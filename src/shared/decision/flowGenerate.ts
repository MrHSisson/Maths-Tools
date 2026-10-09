// ═══════════════════════════════════════════════════════════════════════════
// Network Flows — question generation. Pure (no React); every question is built
// FLOW-FIRST: sample a feasible integer flow by pushing flow along random S→T
// paths, THEN choose the arc bounds around it (lo ≤ flow ≤ hi). A feasible flow
// therefore always exists, and every displayed number comes from flow.ts.
// Constraints per sub-tool/level (specs/flow-networks.md §4) are enforced by
// rejection sampling; the solver is the single source of the answer.
// ═══════════════════════════════════════════════════════════════════════════

import {
  SINK, SOURCE, pathNodes, decomposeFlow, pathLabel, peelMissing, allCuts, cutCapacity, flowValue, isAcyclic, isFeasibleFlow,
  maxFlow, orderNodes, potentials, simpleForwardPaths, buildFlowByPaths, splitNodes, superParts,
  type Flow, type FlowArc, type FlowMode, type FlowNet, type FlowProblemData, type FlowSubTool, type InitialStyle,
} from "./flow";
import { cutGeometry } from "./cutCurve";
import { FLOW_TEMPLATES, SUPER_TEMPLATES, superTemplatesForLevel, templatesForLevel, type FlowTemplate } from "./flowTemplates";
import type { DecisionProblem } from "./types";

const ri = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
const pick = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];
const shuffle = <T,>(xs: T[]): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** Optional difficulty dials, all chosen by the teacher (never by the level — levels are graph size). */
export interface FlowGenOptions {
  /** reversed: at least one (up to two) arcs point against the left-to-right flow. DEFAULT — the idea of reverse is part of every question. */
  arcs?: "standard" | "reversed";
  /** cutValue — "any" (DEFAULT): any drawable cut, so backward arcs turn up as they happen to; "backward": the cut must include an arc coming back across it; "forward": none do. */
  cuts?: "backward" | "forward" | "any";
  /** augment / maxFlow: true = the working must use a backward step (a step against an arrow). Default false: they appear as they happen to. */
  backSteps?: boolean;
  /** Every capacity, minimum and flow is multiplied by this (1 = single digits to ~20; 10 = 10 to ~200; 100 = 100 to ~2000). The maths is identical, only the numbers are bigger. */
  scale?: 1 | 10 | 100;
  /** initialFlow "find" on a min/max network — "any": just a feasible flow; "value": a feasible flow of a set value ("find a flow of 12"); "mixed" (DEFAULT): either, at random. Capacity-only networks always ask for a set value. */
  target?: "any" | "value" | "mixed";
  /** superST — "sources": several sources, one sink; "sinks": one source, several sinks; "both"; "mixed" (DEFAULT): any of the three at random. */
  shape?: "sources" | "sinks" | "both" | "mixed";
}
export const DEFAULT_GEN: Required<FlowGenOptions> = { arcs: "reversed", cuts: "any", backSteps: false, scale: 1, target: "mixed", shape: "mixed" };

/** Multiply every quantity in an instance by `k` — conservation, bounds, bottlenecks and cuts all scale with it. */
function scaleInstance(inst: FlowInstance, k: number): FlowInstance {
  if (k === 1) return inst;
  const flow: Flow = {};
  for (const id of Object.keys(inst.flow)) flow[id] = inst.flow[id] * k;
  return {
    ...inst,
    flow,
    net: { nodes: inst.net.nodes, arcs: inst.net.arcs.map((a) => ({ ...a, lo: a.lo * k, hi: a.hi * k })) },
    pushed: inst.pushed.map((p) => ({ ...p, amount: p.amount * k })),
  };
}

// ── Sample a network + feasible flow from a template ─────────────────────────
export interface FlowInstance {
  net: FlowNet;
  flow: Flow;
  labelPos: FlowProblemData["labelPos"];
  /** the paths (and amounts) the flow was built from — distinct, so they add back to `flow` exactly */
  pushed: Array<{ arcs: string[]; amount: number }>;
}

/** The network a template becomes for a given set of present arcs and reversed arcs (bounds still 0). Exported for the layout test. */
/** Four-digit numbers need longer arcs: the picture is stretched left-to-right (every position scales together, so label placement and cut lines stay valid). */
export const stretchFor = (scale: number) => (scale >= 100 ? 1.45 : scale >= 10 ? 1.35 : 1);
const X0 = 40;

export function variantNet(tpl: FlowTemplate, presentIds: Set<string>, flips: Set<string>, stretch = 1): { net: FlowNet; labelPos: FlowProblemData["labelPos"] } {
  const labelPos: FlowProblemData["labelPos"] = {};
  const arcs: FlowArc[] = tpl.arcs.filter((a) => presentIds.has(a.id)).map((a) => {
    const flipped = flips.has(a.id);
    const from = flipped ? a.to : a.from;
    const to = flipped ? a.from : a.to;
    // positions are fractions from the TAIL; a flipped arc mirrors them so labels keep their physical place
    const m = (t: number) => (flipped ? 1 - t : t);
    labelPos[from + to] = { label: m(a.label), flow: [m(a.flow[0]), a.flow[1]], pot: [m(a.pot[0]), a.pot[1]] };
    return { id: from + to, from, to, lo: 0, hi: 0 };
  });
  return { net: { nodes: tpl.nodes.map((nd) => ({ ...nd, x: Math.round(X0 + (nd.x - X0) * stretch) })), arcs }, labelPos };
}

/** Is this network usable: acyclic, every vertex used, and at least three S→T routes? */
export function usableNet(net: FlowNet): boolean {
  if (!isAcyclic(net)) return false;
  for (const nd of net.nodes) {
    const inn = net.arcs.some((x) => x.to === nd.id);
    const out = net.arcs.some((x) => x.from === nd.id);
    if (nd.id === SOURCE ? !out : nd.id === SINK ? !inn : !(inn && out)) return false;
  }
  return simpleForwardPaths(net).length >= 3;
}

export function sampleInstance(tpl: FlowTemplate, mode: FlowMode, reversed: boolean, pathCount?: number, stretch = 1): FlowInstance | null {
  // 1. arcs — optional arcs come and go; a reversed question flips up to two flippable arcs (the network must stay acyclic)
  const present = tpl.arcs.filter((a) => !a.optional || Math.random() < 0.65);
  const flips = new Set<string>();
  if (reversed) {
    // a reversed question has at least one arc pointing back against the flow (and sometimes two)
    const cand = shuffle(present.filter((x) => x.flippable));
    if (cand.length === 0) return null;
    for (const a of cand.slice(0, ri(1, Math.min(2, cand.length)))) flips.add(a.id);
  }
  const variant = variantNet(tpl, new Set(present.map((x) => x.id)), flips, stretch);
  const arcs = variant.net.arcs.map((a) => ({ ...a, _pos: variant.labelPos[a.id] }));
  const net: FlowNet = { nodes: variant.net.nodes, arcs };
  if (!usableNet(net)) return null;
  const paths = simpleForwardPaths(net);

  // 2. a feasible flow. Unless the question fixes the paths, choose paths so that EVERY arc carries flow — that is what lets
  //    (almost) every arc have a real minimum, instead of a string of zeros.
  const flow: Flow = {};
  for (const a of arcs) flow[a.id] = 0;
  let chosen: string[][];
  if (pathCount === undefined) {
    const covered = new Set<string>();
    chosen = [];
    // capacity-only: now and then one arc is left unused, so a potential decrease of 0 turns up in the Potentials question
    const spare = mode === "cap" && Math.random() < 0.45 ? pick(arcs).id : null;
    for (const id of shuffle(arcs.map((x) => x.id))) {
      if (covered.has(id) || id === spare) continue;
      const through = paths.filter((q) => q.includes(id));
      through.sort((x, y) => y.filter((e) => !covered.has(e)).length - x.filter((e) => !covered.has(e)).length + (Math.random() - 0.5) * 0.6);
      chosen.push(through[0]);
      through[0].forEach((e) => covered.add(e));
    }
    if (chosen.length > 6) return null;
  } else {
    chosen = shuffle(paths).slice(0, pathCount);
    if (chosen.length < pathCount) return null;
  }
  const pushed: FlowInstance["pushed"] = [];
  for (const p of chosen) {
    const amt = ri(1, pathCount === undefined ? 4 : 6);
    for (const id of p) flow[id] += amt;
    pushed.push({ arcs: p, amount: amt });
  }
  if (Object.values(flow).some((f) => f > 15)) return null;
  const value = flowValue(net, flow);
  if (pathCount === undefined ? value < 6 || value > 30 : value < 8 || value > 24) return null;

  // 3. bounds around the flow
  const used = arcs.filter((a) => flow[a.id] > 0);
  const tight = new Set(shuffle(used).slice(0, Math.max(2, Math.floor(used.length / 4))).map((a) => a.id));
  // min/max: nearly every arc gets a real minimum (1 … its flow); only the odd arc keeps 0
  const zeroBudget = Math.max(1, Math.floor(arcs.length * 0.15));
  let zeros = 0;
  for (const a of arcs) {
    const f = flow[a.id];
    a.hi = f === 0 ? ri(2, 8) : tight.has(a.id) ? f : f + ri(0, 6);
    if (mode === "minmax" && f > 0) {
      if (zeros < zeroBudget && Math.random() < 0.1) { a.lo = 0; zeros++; } else a.lo = ri(1, f);
    } else a.lo = 0;
  }
  // a fixed arc [k, k] gives away its flow: leave a little room above the minimum
  for (const a of arcs) if (mode === "minmax" && a.lo > 0 && a.lo === a.hi) a.hi += ri(1, 3);
  if (mode === "minmax" && arcs.filter((a) => a.lo > 0).length < 2) return null;

  if (!isFeasibleFlow(net, flow).ok) return null; // defensive — cannot happen by construction
  const labelPos: FlowInstance["labelPos"] = {};
  const cleanArcs: FlowArc[] = arcs.map((a) => {
    labelPos[a.id] = a._pos;
    return { id: a.id, from: a.from, to: a.to, lo: a.lo, hi: a.hi };
  });
  return { net: { nodes: net.nodes, arcs: cleanArcs }, flow, labelPos, pushed };
}

// ── Level constraints (per sub-tool) ─────────────────────────────────────────
const hasBack = (steps: { dir: string }[]) => steps.some((s) => s.dir === "back");

function okPotentials(inst: FlowInstance, mode: FlowMode, level: number): boolean {
  const pots = potentials(inst.net, inst.flow);
  const arcs = inst.net.arcs;
  if (arcs.some((a) => pots[a.id].fwd === 0 && pots[a.id].bwd === 0)) return false;
  const atMax = arcs.filter((a) => pots[a.id].fwd === 0).length;
  const zero = arcs.filter((a) => inst.flow[a.id] === 0).length;
  if (atMax < 1 || zero > Math.ceil(arcs.length / 3)) return false;
  if (level === 1 && atMax > 2) return false;
  if (mode === "minmax") {
    if (arcs.filter((a) => a.lo > 0 && inst.flow[a.id] > a.lo).length < 2) return false; // potential decrease is flow − min, not flow
    if (!arcs.some((a) => a.lo > 0 && inst.flow[a.id] === a.lo)) return false; // one arc with potential decrease 0
  }
  return true;
}

/** A cut can only be set if it can be drawn as one unbroken dashed line (see cutCurve.ts). */
const drawableCache = new Map<string, boolean>(); // the answer depends only on the layout + arc directions + the cut, never on the bounds
const drawable = (net: FlowNet, sSide: string[]): boolean => {
  const key = `${net.nodes.map((n) => n.id + n.x + "," + n.y).join(";")}|${net.arcs.map((a) => a.id).join(",")}|${sSide.join("")}`;
  let ok = drawableCache.get(key);
  if (ok === undefined) {
    const r = cutCapacity(net, sSide);
    ok = cutGeometry(net, sSide, [...r.forward, ...r.backward].map((a) => a.id)) !== null;
    drawableCache.set(key, ok);
  }
  return ok;
};

function chooseCut(inst: FlowInstance, cuts: "any" | "forward" | "backward"): string[] | null {
  const n = inst.net.nodes.length;
  const cheap = allCuts(inst.net).filter((c) => {
    if (c.length < 2 || n - c.length < 2) return false;
    const r = cutCapacity(inst.net, c);
    if (r.capacity < 8 || r.capacity > 60) return false;
    // in a min/max network a backward arc must have a real minimum — "− 0" teaches nothing
    if (r.backward.some((a) => a.hi > 0 && a.lo === 0) && inst.net.arcs.some((a) => a.lo > 0)) return false;
    return cuts === "any" || (cuts === "forward" ? r.backward.length === 0 : r.backward.length > 0);
  });
  // the drawability test is the expensive one, so try the candidates in random order and stop at the first that passes
  for (const c of shuffle(cheap)) if (drawable(inst.net, c)) return c;
  return null;
}

// Augment flow: make `rounds` augmentations in turn (2, or 3 at Level 3), each found on the potentials the last one left.
// A start flow qualifies when the canonical labelling procedure yields at least that many paths, none of them trivial.
function augmentRounds(level: number): number {
  return level === 1 ? 2 : level === 2 ? ri(2, 3) : 3;
}
function okAugment(inst: FlowInstance, backSteps: boolean, rounds: number): boolean {
  const run = maxFlow(inst.net, inst.flow);
  if (run.augmentations.length < rounds) return false;
  const used = run.augmentations.slice(0, rounds);
  if (used.some((a) => a.path.bottleneck < (backSteps ? 1 : 2))) return false;
  // the increases must not all be the same: a list of identical "+2"s hides what the bottleneck is for
  if (rounds >= 3 && new Set(used.map((a) => a.path.bottleneck)).size < 2) return false;
  if (flowValue(inst.net, used[rounds - 1].after) > 45) return false;
  return backSteps ? used.some((a) => hasBack(a.path.steps)) : true;
}

function okMaxFlow(inst: FlowInstance, size: number, backSteps: boolean): boolean {
  const run = maxFlow(inst.net, inst.flow);
  const k = run.augmentations.length;
  const nn = inst.net.nodes.length;
  if (run.value > 40) return false;
  // the confirming cut is usually an inner one, but a cut that is just the source (or just the sink) turns up now and then
  const nontrivial = (run.sSide.length >= 2 && run.sSide.length <= nn - 2) || Math.random() < 0.2;
  if (!drawable(inst.net, run.sSide)) return false; // the min cut is drawn as one dashed line
  if (backSteps && !run.augmentations.some((a) => hasBack(a.path.steps))) return false;
  const big = run.augmentations.filter((a) => a.path.bottleneck >= 2).length;
  if (size === 1) return k >= 1 && k <= 2;
  if (size === 2) return k >= 2 && k <= 3 && nontrivial && big * 2 >= k;
  return k >= 3 && k <= 5 && nontrivial && big * 2 >= k;
}

/** Missing flow: leave out 1–2 arcs' flows, each findable by flow in = flow out at some vertex (in order). */
function chooseMissing(inst: FlowInstance, size: number): string[] | null {
  const count = size === 1 ? 1 : size === 2 ? ri(1, 2) : 2;
  const net = inst.net;
  const deg = (v: string) => net.arcs.filter((a) => a.from === v || a.to === v).length;
  const interior = (id: string) => { const a = net.arcs.find((x) => x.id === id)!; return a.from !== SOURCE && a.to !== SINK; };
  // chained pairs (the second is only findable once the first is known) become more common as the network grows
  const wantChain = count === 2 && Math.random() < (size === 3 ? 0.5 : 0.3);
  for (let t = 0; t < 80; t++) {
    const ids = shuffle(net.arcs.map((a) => a.id)).slice(0, count);
    const order = peelMissing(net, ids);
    if (!order) continue;
    if (order.some((o) => deg(o.vertex) < 3)) continue; // solving at a vertex with only two arcs is a one-line "in = out"
    if (size >= 2 && !ids.some(interior)) continue; // not only arcs touching the source or sink
    if (wantChain) {
      const chained = order.length === 2 && ids.every((id) => net.arcs.find((x) => x.id === id) && true) &&
        (() => { const [x, y] = order; const ay = net.arcs.find((q) => q.id === y.arc)!; return ay.from === x.vertex || ay.to === x.vertex; })();
      if (!chained) continue;
    }
    return ids;
  }
  return null;
}

export const defaultStyle = (): InitialStyle => "paths";

// A "long" path goes through a cross arc (S→A→B→T…), not straight S→X→T. Questions should not only ever use the direct routes.
const isLong = (p: { arcs: string[] }) => p.arcs.length >= 3;

function okInitial(inst: FlowInstance, level: number, mode: FlowMode, style: InitialStyle, wantLong: boolean): boolean {
  if (style === "paths") {
    const paths = inst.pushed;
    const arcCount = new Map<string, number>();
    for (const p of paths) for (const id of p.arcs) arcCount.set(id, (arcCount.get(id) ?? 0) + 1);
    const shared = [...arcCount.values()].some((c) => c > 1);
    if (wantLong && !paths.some(isLong)) return false;
    if (level === 1) return paths.length === 2 && !shared;
    if (level === 2) return paths.length === 3 && shared;
    return paths.length >= 3 && paths.length <= 4 && shared;
  }
  if (wantLong && !decomposeFlow(inst.net, inst.flow).some(isLong)) return false;
  if (mode === "minmax") {
    const lows = inst.net.arcs.filter((a) => a.lo > 0);
    const sOut = inst.net.arcs.filter((a) => a.from === SOURCE && a.lo > 0).length;
    return level === 3 ? lows.length >= 3 && sOut >= 2 : lows.length >= 2;
  }
  return true; // capacity-only: "a flow of value V" — V is the value of the flow the question was built around
}

// ── Restricted vertices ──────────────────────────────────────────────────────
/**
 * Choose which vertices have a maximum throughput, and what it is. The question's flow already respects every restriction
 * (a throughput is never below what the flow already passes through), the restriction genuinely lowers the maximum flow, a
 * few augmentations are still needed, and the minimum cut runs through a restricted vertex — so the restriction is what the
 * class has to deal with, not decoration.
 */
function chooseNodeCaps(inst: FlowInstance, level: number): Record<string, number> | null {
  const { net, flow } = inst;
  const inner = net.nodes.map((n) => n.id).filter((id) => id !== SOURCE && id !== SINK);
  const through = (id: string) => net.arcs.filter((a) => a.to === id).reduce((t, a) => t + flow[a.id], 0);
  const unrestricted = maxFlow(net, flow).value;
  for (let attempt = 0; attempt < 40; attempt++) {
    const count = level === 1 ? 1 : ri(1, 2);
    const chosen = shuffle(inner.filter((id) => through(id) > 0)).slice(0, count);
    if (chosen.length < count) continue;
    const caps: Record<string, number> = {};
    for (const id of chosen) caps[id] = through(id) + ri(0, 3);
    const sp = splitNodes(net, caps, inst.labelPos, flow);
    const run = maxFlow(sp.net, sp.flow);
    if (run.value >= unrestricted || run.augmentations.length < 1 || run.augmentations.length > (level === 1 ? 3 : 4)) continue;
    // the minimum cut separates some vertex from its second half: the restriction is what limits the flow
    const cutThrough = chosen.filter((id) => run.sSide.includes(id) && !run.sSide.includes(sp.outNode[id]));
    if (!cutThrough.length) continue;
    return caps;
  }
  return null;
}

// ── Several sources / sinks ──────────────────────────────────────────────────
/**
 * Which of the super vertices to take away. A source must be a vertex that only S feeds (nothing else flows INTO it), a sink one that only
 * feeds T; no vertex is both; there are at least two of whichever is plural. A little work must remain (1–3 / 1–4 augmentations).
 */
function chooseSuper(inst: FlowInstance, level: number, shape: NonNullable<FlowGenOptions["shape"]>): { removeS: boolean; removeT: boolean } | null {
  const options: Array<[boolean, boolean]> = shape === "sources" ? [[true, false]] : shape === "sinks" ? [[false, true]] : shape === "both" ? [[true, true]] : [[true, false], [false, true], [true, true]];
  const run = maxFlow(inst.net, inst.flow);
  if (run.augmentations.length < 1 || run.augmentations.length > (level === 1 ? 3 : 4)) return null;
  const valid = options.filter(([rs, rt]) => {
    const sp = superParts(inst.net, rs, rt);
    const src = Object.keys(sp.sources), snk = Object.keys(sp.sinks);
    if (rs && src.length < 2) return false;
    if (rt && snk.length < 2) return false;
    if (src.some((v) => sp.question.arcs.some((a) => a.to === v))) return false; // a source has nothing flowing in
    if (snk.some((v) => sp.question.arcs.some((a) => a.from === v))) return false; // a sink has nothing flowing out
    return !src.some((v) => snk.includes(v));
  });
  if (!valid.length) return null;
  const [removeS, removeT] = pick(valid);
  return { removeS, removeT };
}

// ── The public generator ─────────────────────────────────────────────────────
/** `forceTemplate` pins the network style (used by the `?tpl=` dev link to check a layout). */
export function generateFlowProblem(
  level: 1 | 2 | 3, subTool: FlowSubTool, mode: FlowMode, forceTemplate?: string, style: InitialStyle = defaultStyle(), options: FlowGenOptions = {},
): DecisionProblem {
  const opts = { ...DEFAULT_GEN, ...options };
  for (let attempt = 0; attempt < 20000; attempt++) {
    // a pinned template is a dev aid: if it cannot meet this level's constraints (e.g. Diamond at Level 3), stop pinning
    const pinned = attempt < 4000 ? [...FLOW_TEMPLATES, ...SUPER_TEMPLATES].find((t) => t.id === forceTemplate) : undefined;
    const tpl = pinned ?? pick(subTool === "superST" ? superTemplatesForLevel(level) : templatesForLevel(level));
    const pathStyle = subTool === "initialFlow" && style === "paths";
    const inst = sampleInstance(tpl, subTool === "nodeCap" || subTool === "superST" ? "cap" : mode, opts.arcs === "reversed" && subTool !== "superST", pathStyle ? (level === 1 ? 2 : level === 2 ? 3 : ri(3, 4)) : undefined, stretchFor(opts.scale));
    if (!inst) continue;

    let sSide: string[] | undefined;
    let initial: { flow: FlowInstance["flow"]; target?: number } | undefined;
    if (subTool === "initialFlow") {
      // most questions use at least one route through a cross arc; the rest may be all direct (the smallest networks only have direct pairs)
      if (!okInitial(inst, level, mode, style, level > 1 || Math.random() < 0.7)) continue;
      if (style === "find") {
        // the answer is built the way a student would build it, route by route (buildFlowByPaths), so the working is a real method
        let target: number | undefined;
        if (mode === "cap") {
          // "find a flow of value V": V is below the maximum flow
          const mx = maxFlow(inst.net, Object.fromEntries(inst.net.arcs.map((a) => [a.id, 0]))).value;
          target = flowValue(inst.net, inst.flow);
          if (target >= mx) continue;
        } else if (opts.target === "value" || (opts.target === "mixed" && Math.random() < 0.5)) {
          // "find a feasible flow of value V": V is more than the minimums alone give, and a flow of that value is reachable
          const base = buildFlowByPaths(inst.net);
          if (!base) continue;
          target = flowValue(inst.net, base.flow) + ri(1, 4);
        }
        const built = buildFlowByPaths(inst.net, target);
        if (!built || built.paths.length < 2 || built.paths.length > 5) continue;
        if (level > 1 && !built.paths.some(isLong)) continue;
        inst.pushed = built.paths;
        initial = { flow: built.flow, target };
      } else initial = { flow: inst.flow };
    }
    let missing: string[] | undefined;
    if (subTool === "missingFlow") {
      const m = chooseMissing(inst, level);
      if (!m) continue;
      missing = m;
    }
    if (subTool === "potentials" && !okPotentials(inst, mode, level)) continue;
    if (subTool === "cutValue") {
      const c = chooseCut(inst, opts.cuts);
      if (!c) continue;
      sSide = c;
    }
    let nodeCaps: Record<string, number> | undefined;
    if (subTool === "nodeCap") {
      const c = chooseNodeCaps(inst, level);
      if (!c) continue;
      nodeCaps = c;
    }
    let superInfo: { removeS: boolean; removeT: boolean } | undefined;
    if (subTool === "superST") {
      const c = chooseSuper(inst, level, level === 1 && opts.shape === "both" ? "mixed" : opts.shape);
      if (!c) continue;
      superInfo = c;
    }
    const rounds = subTool === "augment" ? augmentRounds(level) : undefined;
    if (subTool === "augment" && !okAugment(inst, opts.backSteps, rounds!)) continue;
    if (subTool === "maxFlow" && !okMaxFlow(inst, level, opts.backSteps)) continue;

    const k = opts.scale;
    const scaledCaps = nodeCaps ? Object.fromEntries(Object.entries(nodeCaps).map(([id, c]) => [id, c * k])) : undefined;
    return toProblem(level, subTool, subTool === "nodeCap" || subTool === "superST" ? "cap" : mode, tpl, scaleInstance(initial ? { ...inst, flow: initial.flow } : inst, k), sSide, style, initial?.target === undefined ? undefined : initial.target * k, missing, rounds, scaledCaps, superInfo);
  }
  throw new Error(`flow generator: no ${subTool} question found at level ${level} (${mode})`);
}

const setText = (net: FlowNet, ids: string[]) => `{${orderNodes(net, ids).join(", ")}}`;

function toProblem(
  level: 1 | 2 | 3, subTool: FlowSubTool, mode: FlowMode, tpl: FlowTemplate, inst: FlowInstance, sSide?: string[],
  style?: InitialStyle, target?: number, missing?: string[], rounds?: number, nodeCaps?: Record<string, number>,
  superInfo?: { removeS: boolean; removeT: boolean },
): DecisionProblem {
  const { net, flow } = inst;
  const data: FlowProblemData = {
    subTool, mode, level, templateId: tpl.id, net, flow, sSide, labelPos: inst.labelPos,
    showCutLine: subTool === "cutValue" ? true : undefined,
    missing, rounds,
    ...(nodeCaps ? { nodeCaps, split: splitNodes(net, nodeCaps, inst.labelPos, flow) } : {}),
    ...(superInfo ? { superST: { ...superParts(net, superInfo.removeS, superInfo.removeT), ...superInfo } } : {}),
    ...(subTool === "initialFlow" ? { style, target, paths: inst.pushed } : {}),
  };
  const network = {
    nodes: net.nodes,
    edges: net.arcs.map((a) => ({ id: a.id, from: a.from, to: a.to, weight: a.hi, directed: true })),
  };
  let prompt = "";
  let answerText = "";
  let value: number | undefined;
  const bounds = mode === "cap" ? "Each arc shows its capacity." : "Each arc shows its minimum and maximum.";

  if (subTool === "initialFlow") {
    const paths = data.paths!;
    if (style === "paths") {
      const list = paths.map((p) => `${p.amount} along ${pathLabel(net, p.arcs)}`);
      prompt = `${bounds} Take an initial flow comprising ${list.length > 1 ? `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}` : list[0]}. Write the flow in each arc.`;
    } else if (mode === "cap") {
      prompt = `${bounds} Find a flow of value ${target} through the network. The flow into each vertex must equal the flow out, and no arc may carry more than its capacity.`;
    } else if (target !== undefined) {
      prompt = `${bounds} Find a feasible flow of value ${target} through the network: every arc must carry at least its minimum and at most its maximum, and the flow into each vertex must equal the flow out. (Many answers are possible.)`;
    } else {
      prompt = `${bounds} Find a feasible flow: every arc must carry at least its minimum and at most its maximum, and the flow into each vertex must equal the flow out. (Many answers are possible.)`;
    }
    value = flowValue(net, flow);
    answerText = `${style === "find" ? "One possible flow" : "Flow"} (value ${value}): ${net.arcs.map((a) => `${a.id} ${flow[a.id]}`).join(", ")}`;
  } else if (subTool === "missingFlow") {
    const n = missing!.length;
    prompt = `${bounds} A flow is shown (the circled numbers), but the flow ${n === 1 ? "in the arc marked ? is" : "in each of the arcs marked ? is"} missing. Use "flow in = flow out" at the vertices to find ${n === 1 ? "it" : "them"}.`;
    answerText = missing!.map((id) => `${id} = ${flow[id]}`).join("; ");
    if (n === 1) value = flow[missing![0]];
  } else if (subTool === "potentials") {
    // read the flow back OFF the potentials: the arrows are shown, the flows are not
    prompt = `${bounds} The potentials on every arc are shown: the potential increase (the arrow along the arc) and the potential decrease (the arrow against it). Find the flow in every arc, and the value of the flow.`;
    value = flowValue(net, flow);
    answerText = `Flow value ${value}`;
  } else if (subTool === "cutValue") {
    const t = net.nodes.map((n) => n.id).filter((id) => !sSide!.includes(id));
    prompt = `${bounds} Find the capacity of the cut that separates ${setText(net, sSide!)} from ${setText(net, t)}.`;
    const r = cutCapacity(net, sSide!);
    value = r.capacity;
    answerText = `${r.capacity}`;
  } else if (subTool === "nodeCap") {
    const ids = Object.keys(nodeCaps!);
    const list = ids.map((id) => `vertex ${id} at most ${nodeCaps![id]}`);
    const sp = data.split!;
    const run = maxFlow(sp.net, sp.flow);
    prompt = `${bounds} The total flow through ${ids.length > 1 ? "each of the vertices" : "the vertex"} ${ids.join(ids.length > 2 ? ", " : " and ")} is restricted (its maximum throughput): ${list.length > 1 ? `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}` : list[0]}. A flow of ${flowValue(net, flow)} is shown (the circled numbers). Split ${ids.length > 1 ? "each restricted vertex" : `vertex ${ids[0]}`} in two so the restriction becomes the capacity of an arc, use flow augmentation to find the maximum flow, then confirm it with a cut.`;
    value = run.value;
    answerText = `Maximum flow ${run.value}`;
  } else if (subTool === "superST") {
    const sp = data.superST!;
    const list = (m: Record<string, number>) => {
      const parts = Object.entries(m).map(([id, c]) => `${id} (${c})`);
      return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts[0];
    };
    const what = sp.removeS && sp.removeT ? "a supersource and a supersink" : sp.removeS ? "a supersource" : "a supersink";
    const text = [
      sp.removeS ? `There are several sources: ${list(sp.sources)}; the number in brackets is the most each can supply.` : "",
      sp.removeT ? `There are several sinks: ${list(sp.sinks)}; the number in brackets is the most each can take (its demand).` : "",
    ].filter(Boolean).join(" ");
    const run = maxFlow(net, flow);
    prompt = `${bounds} ${text} A flow of ${flowValue(net, flow)} is shown (the circled numbers). Add ${what} so that there is a single source and sink, with arcs whose capacities are the supplies and demands; then use flow augmentation to find the maximum flow, and confirm it with a cut.`;
    value = run.value;
    answerText = `Maximum flow ${run.value}`;
  } else if (subTool === "augment") {
    const run = maxFlow(net, flow);
    const used = run.augmentations.slice(0, rounds!);
    const word = ["", "one", "two", "three", "four"][rounds!];
    prompt = `${bounds} A flow of ${flowValue(net, flow)} is shown (the circled numbers). Use flow augmentation ${word} times: each time find a flow-augmenting path from S to T, say by how much the flow can be increased along it, and update the potentials before finding the next path. State the new value of the flow.`;
    value = flowValue(net, used[used.length - 1].after);
    answerText = `${used.map((a) => `${pathNodes(a.path).join("")} +${a.path.bottleneck}`).join("; ")}; flow ${value}`;
  } else {
    prompt = `${bounds} A flow of ${flowValue(net, flow)} is shown (the circled numbers). Use flow augmentation to find the maximum flow, then confirm it with a cut.`;
    const run = maxFlow(net, flow);
    value = run.value;
    answerText = `Maximum flow ${run.value}`;
  }
  return { network, templateId: tpl.id, prompt, answer: { text: answerText, value }, flow: data };
}

export { SOURCE, SINK };
