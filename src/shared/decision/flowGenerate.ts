// ═══════════════════════════════════════════════════════════════════════════
// Network Flows — question generation. Pure (no React); every question is built
// FLOW-FIRST: sample a feasible integer flow by pushing flow along random S→T
// paths, THEN choose the arc bounds around it (lo ≤ flow ≤ hi). A feasible flow
// therefore always exists, and every displayed number comes from flow.ts.
// Constraints per sub-tool/level (specs/flow-networks.md §4) are enforced by
// rejection sampling; the solver is the single source of the answer.
// ═══════════════════════════════════════════════════════════════════════════

import {
  SINK, SOURCE, sortedAugmentingPaths, pathNodes, decomposeFlow, pathLabel, allCuts, cutCapacity, flowValue, isAcyclic, isFeasibleFlow,
  maxFlow, orderNodes, potentials, simpleForwardPaths,
  type ArcLabelPos, type Flow, type FlowArc, type FlowMode, type FlowNet, type FlowProblemData, type FlowSubTool, type InitialStyle,
} from "./flow";
import { cutGeometry } from "./cutCurve";
import { FLOW_TEMPLATES, templatesForLevel, type FlowTemplate } from "./flowTemplates";
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
  arcs?: "standard" | "reversed"; // reversed: up to two arcs point the other way
  cuts?: "any" | "forward"; // cutValue: forward-only cuts, or any drawable cut
  backSteps?: boolean; // augment / maxFlow: the working must use a backward step
}

// ── Sample a network + feasible flow from a template ─────────────────────────
export interface FlowInstance {
  net: FlowNet;
  flow: Flow;
  labelPos: FlowProblemData["labelPos"];
  /** the paths (and amounts) the flow was built from — distinct, so they add back to `flow` exactly */
  pushed: Array<{ arcs: string[]; amount: number }>;
}

export function sampleInstance(tpl: FlowTemplate, mode: FlowMode, reversed: boolean, pathCount?: number): FlowInstance | null {
  // 1. arcs — optional arcs come and go; a reversed question flips up to two flippable arcs (the network must stay acyclic)
  const present = tpl.arcs.filter((a) => !a.optional || Math.random() < 0.65);
  const flips = new Set<string>();
  if (reversed) for (const a of shuffle(present.filter((x) => x.flippable)).slice(0, 2)) if (Math.random() < 0.6) flips.add(a.id);
  const arcs: Array<FlowArc & { _pos: ArcLabelPos }> = present.map((a) => {
    const flipped = flips.has(a.id);
    const from = flipped ? a.to : a.from;
    const to = flipped ? a.from : a.to;
    // positions are fractions from the TAIL; a flipped arc mirrors them so labels keep their physical place
    const m = (t: number) => (flipped ? 1 - t : t);
    return {
      id: from + to, from, to, lo: 0, hi: 0,
      _pos: { label: m(a.label), flow: [m(a.flow[0]), a.flow[1]], pot: [m(a.pot[0]), a.pot[1]] },
    };
  });
  const net: FlowNet = { nodes: tpl.nodes.map((n) => ({ ...n })), arcs };
  if (!isAcyclic(net)) return null;
  // every vertex must be used: S sends, T receives, every other vertex has an arc in and an arc out
  for (const nd of net.nodes) {
    const inn = arcs.some((x) => x.to === nd.id);
    const out = arcs.some((x) => x.from === nd.id);
    if (nd.id === SOURCE ? !out : nd.id === SINK ? !inn : !(inn && out)) return null;
  }
  const paths = simpleForwardPaths(net);
  if (paths.length < 3) return null;

  // 2. a feasible flow. Unless the question fixes the paths, choose paths so that EVERY arc carries flow — that is what lets
  //    (almost) every arc have a real minimum, instead of a string of zeros.
  const flow: Flow = {};
  for (const a of arcs) flow[a.id] = 0;
  let chosen: string[][];
  if (pathCount === undefined) {
    const covered = new Set<string>();
    chosen = [];
    for (const id of shuffle(arcs.map((x) => x.id))) {
      if (covered.has(id)) continue;
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
    if (arcs.filter((a) => a.lo > 0 && inst.flow[a.id] > a.lo).length < 2) return false; // backward potential is flow − min, not flow
    if (!arcs.some((a) => a.lo > 0 && inst.flow[a.id] === a.lo)) return false; // one arc with backward potential 0
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

function chooseCut(inst: FlowInstance, cuts: "any" | "forward"): string[] | null {
  const n = inst.net.nodes.length;
  const cheap = allCuts(inst.net).filter((c) => {
    if (c.length < 2 || n - c.length < 2) return false;
    const r = cutCapacity(inst.net, c);
    if (r.capacity < 8 || r.capacity > 60) return false;
    return cuts === "any" || r.backward.length === 0;
  });
  // the drawability test is the expensive one, so try the candidates in random order and stop at the first that passes
  for (const c of shuffle(cheap)) if (drawable(inst.net, c)) return c;
  return null;
}

// The Augment flow question asks for ALL the flow-augmenting paths — always two or three, so there is more than one to find.
function okAugment(inst: FlowInstance, backSteps: boolean): boolean {
  const paths = sortedAugmentingPaths(inst.net, inst.flow);
  if (paths.length < 2 || paths.length > 3) return false;
  if (paths.some((p) => p.bottleneck < (backSteps ? 1 : 2))) return false;
  return backSteps ? paths.some((p) => hasBack(p.steps)) : paths.every((p) => !hasBack(p.steps));
}

function okMaxFlow(inst: FlowInstance, size: number, backSteps: boolean): boolean {
  const run = maxFlow(inst.net, inst.flow);
  const k = run.augmentations.length;
  const nn = inst.net.nodes.length;
  if (run.value > 40) return false;
  const nontrivial = run.sSide.length >= 2 && run.sSide.length <= nn - 2;
  if (!drawable(inst.net, run.sSide)) return false; // the min cut is drawn as one dashed line
  if (backSteps && !run.augmentations.some((a) => hasBack(a.path.steps))) return false;
  if (size === 1) return k >= 1 && k <= 2;
  if (size === 2) return k >= 2 && k <= 3 && nontrivial;
  return k >= 3 && k <= 4 && nontrivial;
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

// ── The public generator ─────────────────────────────────────────────────────
/** `forceTemplate` pins the network style (used by the `?tpl=` dev link to check a layout). */
export function generateFlowProblem(
  level: 1 | 2 | 3, subTool: FlowSubTool, mode: FlowMode, forceTemplate?: string, style: InitialStyle = defaultStyle(), opts: FlowGenOptions = {},
): DecisionProblem {
  for (let attempt = 0; attempt < 20000; attempt++) {
    // a pinned template is a dev aid: if it cannot meet this level's constraints (e.g. Diamond at Level 3), stop pinning
    const pinned = attempt < 4000 ? FLOW_TEMPLATES.find((t) => t.id === forceTemplate) : undefined;
    const tpl = pinned ?? pick(templatesForLevel(level));
    const pathStyle = subTool === "initialFlow" && style === "paths";
    const inst = sampleInstance(tpl, mode, opts.arcs === "reversed", pathStyle ? (level === 1 ? 2 : level === 2 ? 3 : ri(3, 4)) : undefined);
    if (!inst) continue;

    let sSide: string[] | undefined;
    let initial: { flow: FlowInstance["flow"]; target?: number } | undefined;
    if (subTool === "initialFlow") {
      // most questions use at least one route through a cross arc; the rest may be all direct (the smallest networks only have direct pairs)
      if (!okInitial(inst, level, mode, style, level > 1 || Math.random() < 0.7)) continue;
      if (style === "find" && mode === "cap") {
        // "find a flow of value V": V is the value of the flow built for this question, below the maximum flow
        const mx = maxFlow(inst.net, Object.fromEntries(inst.net.arcs.map((a) => [a.id, 0]))).value;
        const target = flowValue(inst.net, inst.flow);
        if (target >= mx) continue;
        initial = { flow: inst.flow, target };
      } else initial = { flow: inst.flow };
    }
    if (subTool === "potentials" && !okPotentials(inst, mode, level)) continue;
    if (subTool === "cutValue") {
      const c = chooseCut(inst, opts.cuts ?? "any");
      if (!c) continue;
      sSide = c;
    }
    if (subTool === "augment" && !okAugment(inst, !!opts.backSteps)) continue;
    if (subTool === "maxFlow" && !okMaxFlow(inst, level, !!opts.backSteps)) continue;

    return toProblem(level, subTool, mode, tpl, initial ? { ...inst, flow: initial.flow } : inst, sSide, style, initial?.target);
  }
  throw new Error(`flow generator: no ${subTool} question found at level ${level} (${mode})`);
}

const setText = (net: FlowNet, ids: string[]) => `{${orderNodes(net, ids).join(", ")}}`;

function toProblem(
  level: 1 | 2 | 3, subTool: FlowSubTool, mode: FlowMode, tpl: FlowTemplate, inst: FlowInstance, sSide?: string[],
  style?: InitialStyle, target?: number,
): DecisionProblem {
  const { net, flow } = inst;
  const data: FlowProblemData = {
    subTool, mode, level, templateId: tpl.id, net, flow, sSide, labelPos: inst.labelPos,
    showCutLine: subTool === "cutValue" ? level < 3 : undefined,
    ...(subTool === "initialFlow" ? { style, target, paths: style === "paths" ? inst.pushed : decomposeFlow(net, flow) } : {}),
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
    } else {
      prompt = `${bounds} Find a feasible flow: every arc must carry at least its minimum and at most its maximum, and the flow into each vertex must equal the flow out. (Many answers are possible.)`;
    }
    value = flowValue(net, flow);
    answerText = `${style === "find" ? "One possible flow" : "Flow"} (value ${value}): ${net.arcs.map((a) => `${a.id} ${flow[a.id]}`).join(", ")}`;
  } else if (subTool === "potentials") {
    prompt = `${bounds} A flow is shown (the circled numbers). Write the forward and backward potential on every arc.`;
    const pots = potentials(net, flow);
    answerText = net.arcs.map((a) => `${a.id}: ${pots[a.id].fwd} forward, ${pots[a.id].bwd} backward`).join("; ");
  } else if (subTool === "cutValue") {
    const t = net.nodes.map((n) => n.id).filter((id) => !sSide!.includes(id));
    prompt = `${bounds} Find the capacity of the cut that separates ${setText(net, sSide!)} from ${setText(net, t)}.`;
    const r = cutCapacity(net, sSide!);
    value = r.capacity;
    answerText = `${r.capacity}`;
  } else if (subTool === "augment") {
    const found = sortedAugmentingPaths(net, flow);
    prompt = `${bounds} A flow of ${flowValue(net, flow)} is shown (the circled numbers). There are ${found.length === 2 ? "two" : "three"} flow-augmenting paths from S to T. Find them, and say by how much the flow can be increased along each.`;
    answerText = found.map((p) => `${pathNodes(p).join("")} +${p.bottleneck}`).join("; ");
  } else {
    prompt = `${bounds} A flow of ${flowValue(net, flow)} is shown (the circled numbers). Use flow augmentation to find a maximal flow, then confirm it with a cut.`;
    const run = maxFlow(net, flow);
    value = run.value;
    answerText = `Maximum flow ${run.value}`;
  }
  return { network, templateId: tpl.id, prompt, answer: { text: answerText, value }, flow: data };
}

export { SOURCE, SINK };
