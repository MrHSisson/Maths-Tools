// ═══════════════════════════════════════════════════════════════════════════
// Network Flows — question generation. Pure (no React); every question is built
// FLOW-FIRST: sample a feasible integer flow by pushing flow along random S→T
// paths, THEN choose the arc bounds around it (lo ≤ flow ≤ hi). A feasible flow
// therefore always exists, and every displayed number comes from flow.ts.
// Constraints per sub-tool/level (specs/flow-networks.md §4) are enforced by
// rejection sampling; the solver is the single source of the answer.
// ═══════════════════════════════════════════════════════════════════════════

import {
  SINK, SOURCE, allAugmentingPaths, decomposeFlow, flowOfValue, pathLabel, allCuts, cutCapacity, findAugmentingPath, flowValue, isAcyclic, isFeasibleFlow,
  maxFlow, orderNodes, potentials, simpleForwardPaths,
  type ArcLabelPos, type Flow, type FlowArc, type FlowMode, type FlowNet, type FlowProblemData, type FlowSubTool, type InitialStyle,
} from "./flow";
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

export const defaultMode = (level: 1 | 2 | 3): FlowMode => (level === 1 ? "cap" : "minmax");

// ── Sample a network + feasible flow from a template ─────────────────────────
export interface FlowInstance {
  net: FlowNet;
  flow: Flow;
  labelPos: FlowProblemData["labelPos"];
}

export function sampleInstance(tpl: FlowTemplate, mode: FlowMode, allowFlips: boolean): FlowInstance | null {
  // 1. arcs — optionally flip up to two flippable arcs (the network must stay acyclic)
  const flippable = tpl.arcs.filter((a) => a.flippable);
  const flips = new Set<string>();
  if (allowFlips) for (const a of shuffle(flippable).slice(0, 2)) if (Math.random() < 0.5) flips.add(a.id);
  const arcs: Array<FlowArc & { _pos: ArcLabelPos }> = tpl.arcs.map((a) => {
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
  const paths = simpleForwardPaths(net);
  if (paths.length === 0) return null;

  // 2. a feasible flow: push 3–5 random paths
  const flow: Flow = {};
  for (const a of arcs) flow[a.id] = 0;
  for (const p of shuffle(paths).slice(0, ri(3, 5))) {
    const amt = ri(1, 6);
    for (const id of p) flow[id] += amt;
  }
  if (Object.values(flow).some((f) => f > 15)) return null;
  const value = flowValue(net, flow);
  if (value < 8 || value > 24) return null;

  // 3. bounds around the flow
  const used = arcs.filter((a) => flow[a.id] > 0);
  const tight = new Set(shuffle(used).slice(0, Math.max(2, Math.floor(used.length / 4))).map((a) => a.id));
  for (const a of arcs) {
    const f = flow[a.id];
    a.hi = f === 0 ? ri(2, 8) : tight.has(a.id) ? f : f + ri(0, 6);
    a.lo = mode === "minmax" && f > 0 && Math.random() < 0.45 ? ri(1, f) : 0;
  }
  if (mode === "minmax" && arcs.filter((a) => a.lo > 0).length < 2) return null;

  if (!isFeasibleFlow(net, flow).ok) return null; // defensive — cannot happen by construction
  const labelPos: FlowInstance["labelPos"] = {};
  const cleanArcs: FlowArc[] = arcs.map((a) => {
    labelPos[a.id] = a._pos;
    return { id: a.id, from: a.from, to: a.to, lo: a.lo, hi: a.hi };
  });
  return { net: { nodes: net.nodes, arcs: cleanArcs }, flow, labelPos };
}

// ── Level constraints (per sub-tool) ─────────────────────────────────────────
const hasBack = (steps: { dir: string }[]) => steps.some((s) => s.dir === "back");

function okPotentials(inst: FlowInstance, mode: FlowMode, level: number): boolean {
  const pots = potentials(inst.net, inst.flow);
  const arcs = inst.net.arcs;
  if (arcs.some((a) => pots[a.id].fwd === 0 && pots[a.id].bwd === 0)) return false;
  const atMax = arcs.filter((a) => pots[a.id].fwd === 0).length;
  const zero = arcs.filter((a) => inst.flow[a.id] === 0).length;
  if (level === 1) return zero <= 2 && atMax <= 2;
  if (mode === "minmax" && arcs.filter((a) => a.lo > 0 && inst.flow[a.id] > a.lo).length < 2) return false;
  if (atMax < 1) return false;
  if (level === 3 && mode === "minmax") {
    const atMin = arcs.filter((a) => a.lo > 0 && inst.flow[a.id] === a.lo).length;
    return atMin >= 1;
  }
  return true;
}

function chooseCut(inst: FlowInstance, mode: FlowMode, level: number): string[] | null {
  const n = inst.net.nodes.length;
  const cands = allCuts(inst.net).filter((c) => {
    if (c.length < 2 || n - c.length < 2) return false;
    const r = cutCapacity(inst.net, c);
    if (r.capacity < 8 || r.capacity > 60) return false;
    const backReal = mode === "minmax" ? r.backward.some((a) => a.lo > 0) : r.backward.length > 0;
    if (level === 1) return r.backward.length === 0;
    if (level === 2) return backReal;
    return backReal || Math.random() < 0.3;
  });
  return cands.length ? pick(cands) : null;
}

function okAugment(inst: FlowInstance, level: number): boolean {
  const paths = allAugmentingPaths(inst.net, inst.flow);
  const canon = findAugmentingPath(inst.net, inst.flow);
  if (!canon) return false;
  if (canon.bottleneck < (level === 3 ? 1 : 2)) return false;
  if (level === 1) return paths.length === 1 && !hasBack(paths[0].steps);
  if (level === 2) return paths.length >= 1 && paths.length <= 3;
  return paths.length === 1 && hasBack(paths[0].steps);
}

function okMaxFlow(inst: FlowInstance, level: number): boolean {
  const run = maxFlow(inst.net, inst.flow);
  const k = run.augmentations.length;
  const nn = inst.net.nodes.length;
  if (run.value > 40) return false;
  const nontrivial = run.sSide.length >= 2 && run.sSide.length <= nn - 2;
  const back = run.augmentations.some((a) => hasBack(a.path.steps));
  if (level === 1) return k >= 1 && k <= 2;
  if (level === 2) return k >= 2 && k <= 3 && nontrivial;
  return k >= 3 && k <= 4 && nontrivial && back;
}

export const defaultStyle = (level: 1 | 2 | 3): InitialStyle => (level === 3 ? "find" : "paths");

function okInitial(inst: FlowInstance, level: number, mode: FlowMode, style: InitialStyle): boolean {
  const paths = decomposeFlow(inst.net, inst.flow);
  if (style === "paths") {
    const k = paths.length;
    const arcCount = new Map<string, number>();
    for (const p of paths) for (const id of p.arcs) arcCount.set(id, (arcCount.get(id) ?? 0) + 1);
    const shared = [...arcCount.values()].some((c) => c > 1);
    if (level === 1) return k === 2 && !shared;
    if (level === 2) return k === 3 && shared;
    return k >= 3 && k <= 4 && shared;
  }
  if (mode === "minmax") {
    const lows = inst.net.arcs.filter((a) => a.lo > 0);
    const sOut = inst.net.arcs.filter((a) => a.from === SOURCE && a.lo > 0).length;
    return level === 3 ? lows.length >= 3 && sOut >= 2 : lows.length >= 2;
  }
  return true; // capacity-only: the question is "a flow of value V" — built in generateFlowProblem
}

// ── The public generator ─────────────────────────────────────────────────────
/** `forceTemplate` pins the network style (used by the `?tpl=` dev link to check a layout). */
export function generateFlowProblem(
  level: 1 | 2 | 3, subTool: FlowSubTool, mode: FlowMode, forceTemplate?: string, style: InitialStyle = defaultStyle(level),
): DecisionProblem {
  for (let attempt = 0; attempt < 20000; attempt++) {
    // a pinned template is a dev aid: if it cannot meet this level's constraints (e.g. Diamond at Level 3), stop pinning
    const pinned = attempt < 4000 ? FLOW_TEMPLATES.find((t) => t.id === forceTemplate) : undefined;
    const tpl = pinned ?? pick(templatesForLevel(level));
    const inst = sampleInstance(tpl, mode, level === 3 && tpl.arcs.some((x) => x.flippable));
    if (!inst) continue;

    let sSide: string[] | undefined;
    let initial: { flow: FlowInstance["flow"]; target?: number } | undefined;
    if (subTool === "initialFlow") {
      if (!okInitial(inst, level, mode, style)) continue;
      if (style === "find" && mode === "cap") {
        // "find a flow of value V": V is about 70 % of the maximum flow, answered by a flow built from zero
        const mx = maxFlow(inst.net, Object.fromEntries(inst.net.arcs.map((a) => [a.id, 0]))).value;
        const target = Math.max(4, Math.round(mx * 0.7));
        const f = flowOfValue(inst.net, target);
        if (!f || target >= mx) continue;
        initial = { flow: f, target };
      } else initial = { flow: inst.flow };
    }
    if (subTool === "potentials" && !okPotentials(inst, mode, level)) continue;
    if (subTool === "cutValue") {
      const c = chooseCut(inst, mode, level);
      if (!c) continue;
      sSide = c;
    }
    if (subTool === "augment" && !okAugment(inst, level)) continue;
    if (subTool === "maxFlow" && !okMaxFlow(inst, level)) continue;

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
    ...(subTool === "initialFlow" ? { style, target, paths: decomposeFlow(net, flow) } : {}),
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
    prompt = `${bounds} A flow of ${flowValue(net, flow)} is shown (the circled numbers). Find a flow-augmenting path from S to T, and say by how much the flow can be increased.`;
    const p = findAugmentingPath(net, flow)!;
    value = p.bottleneck;
    answerText = `Increase by ${p.bottleneck}`;
  } else {
    prompt = `${bounds} A flow of ${flowValue(net, flow)} is shown (the circled numbers). Use flow augmentation to find a maximal flow, then confirm it with a cut.`;
    const run = maxFlow(net, flow);
    value = run.value;
    answerText = `Maximum flow ${run.value}`;
  }
  return { network, templateId: tpl.id, prompt, answer: { text: answerText, value }, flow: data };
}

export { SOURCE, SINK };
