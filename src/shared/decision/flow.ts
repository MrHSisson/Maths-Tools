// ═══════════════════════════════════════════════════════════════════════════
// Network flows — the pure solver (no React). Every sub-tool of Network Flows
// derives its question, answer AND working from these functions, so a displayed
// potential, cut value or augmenting path can never drift from the maths.
//
// Vocabulary (see specs/flow-networks.md §3.1):
//   • an arc has bounds [lo, hi]; a flow puts an integer in [lo, hi] on every arc and
//     balances at every node except S (source) and T (sink);
//   • potential increase = hi − flow   (room to push along the arrow)
//   • potential decrease = flow − lo   (room to take back, against the arrow)
//   • capacity of a cut  = Σ hi (arcs S-side → T-side) − Σ lo (arcs T-side → S-side).
// All arithmetic is integer.
// ═══════════════════════════════════════════════════════════════════════════

import type { GNode } from "./types";

export type FlowMode = "cap" | "minmax"; // capacity-only (lo = 0 everywhere) or min/max labelled
export type FlowSubTool = "initialFlow" | "missingFlow" | "potentials" | "cutValue" | "augment" | "maxFlow";
export type InitialStyle = "paths" | "find"; // initialFlow: write the flow from given paths, or find any feasible flow

export const SOURCE = "S";
export const SINK = "T";

export interface FlowArc {
  id: string; // e.g. "SA" — from-node id then to-node id
  from: string;
  to: string;
  lo: number;
  hi: number;
}

export interface FlowNet {
  nodes: GNode[];
  arcs: FlowArc[];
}

export type Flow = Record<string, number>; // arcId → integer flow

/** One step of an augmenting path: along the arc (fwd) or against it (back). */
export interface PathStep {
  arc: string;
  dir: "fwd" | "back";
  /** the node this step arrives at */
  to: string;
}

export interface AugmentingPath {
  steps: PathStep[];
  bottleneck: number;
  /** the potential on each step, in order */
  potentials: number[];
}

/** How a flow-network question is drawn this beat (consumed by FlowView). */
export interface FlowViewState {
  flow?: Flow; // circled flow per arc (omit = no flow drawn)
  /** the potentials to draw per arc (numbers come from potentials() — the renderer never computes them) */
  potentials?: Record<string, { fwd?: number; bwd?: number }>;
  unknown?: string[]; // arcs whose flow is missing — drawn as a "?" circle
  solved?: string[]; // arcs whose flow has just been found — circled in green
  replaceWithPotentials?: boolean; // an arc that shows its potentials drops its flow circle and "min, max" label
  hideBounds?: boolean; // hide the "min, max" labels (the augmentation working shows potentials only)
  path?: PathStep[]; // highlighted augmenting path
  prevFlow?: Flow; // the flow BEFORE augmenting — struck through beside the updated circles on the path
  sSide?: string[]; // shaded S-side of a cut
  cutArcs?: Record<string, "fwd" | "back">; // arcs crossing the cut, tagged by direction
  cutLabels?: boolean; // write +max / −min beside each crossing arc (working only — never in the question)
  labelled?: string[]; // nodes reached by the labelling procedure
  focus?: string[]; // arcs to emphasise
}

// ── Basics ───────────────────────────────────────────────────────────────────
export const arcById = (net: FlowNet): Record<string, FlowArc> => {
  const m: Record<string, FlowArc> = {};
  for (const a of net.arcs) m[a.id] = a;
  return m;
};

export function flowValue(net: FlowNet, flow: Flow): number {
  return net.arcs.filter((a) => a.from === SOURCE).reduce((s, a) => s + flow[a.id], 0) -
    net.arcs.filter((a) => a.to === SOURCE).reduce((s, a) => s + flow[a.id], 0);
}

export function potentials(net: FlowNet, flow: Flow): Record<string, { fwd: number; bwd: number }> {
  const out: Record<string, { fwd: number; bwd: number }> = {};
  for (const a of net.arcs) out[a.id] = { fwd: a.hi - flow[a.id], bwd: flow[a.id] - a.lo };
  return out;
}

export function isFeasibleFlow(net: FlowNet, flow: Flow): { ok: boolean; violations: string[] } {
  const violations: string[] = [];
  for (const a of net.arcs) {
    const f = flow[a.id];
    if (!Number.isInteger(f)) violations.push(`${a.id}: flow ${f} is not an integer`);
    else if (f < a.lo) violations.push(`${a.id}: flow ${f} is below its minimum ${a.lo}`);
    else if (f > a.hi) violations.push(`${a.id}: flow ${f} is above its maximum ${a.hi}`);
  }
  for (const n of net.nodes) {
    if (n.id === SOURCE || n.id === SINK) continue;
    const inn = net.arcs.filter((a) => a.to === n.id).reduce((s, a) => s + flow[a.id], 0);
    const out = net.arcs.filter((a) => a.from === n.id).reduce((s, a) => s + flow[a.id], 0);
    if (inn !== out) violations.push(`${n.id}: flow in ${inn} ≠ flow out ${out}`);
  }
  return { ok: violations.length === 0, violations };
}

/** True when no directed cycle exists (the generator only builds acyclic networks). */
export function isAcyclic(net: FlowNet): boolean {
  const indeg: Record<string, number> = {};
  for (const n of net.nodes) indeg[n.id] = 0;
  for (const a of net.arcs) indeg[a.to]++;
  const q = net.nodes.filter((n) => indeg[n.id] === 0).map((n) => n.id);
  let seen = 0;
  while (q.length) {
    const u = q.pop()!;
    seen++;
    for (const a of net.arcs) if (a.from === u && --indeg[a.to] === 0) q.push(a.to);
  }
  return seen === net.nodes.length;
}

// ── The labelling procedure ──────────────────────────────────────────────────
interface Label {
  from: string;
  arc: string;
  dir: "fwd" | "back";
  pot: number;
}

/**
 * Breadth-first labelling from S. CANONICAL ORDER (the worked examples rely on it):
 * nodes are taken off the queue in the order they were labelled; from each node the
 * candidate neighbours are tried in alphabetical order (a forward step before a
 * backward step to the same node). Returns the label of every node reached.
 */
export function labelling(net: FlowNet, flow: Flow): Record<string, Label | null> {
  const labels: Record<string, Label | null> = { [SOURCE]: null };
  const queue = [SOURCE];
  while (queue.length) {
    const u = queue.shift()!;
    const cand: Array<{ v: string; arc: FlowArc; dir: "fwd" | "back"; pot: number }> = [];
    for (const a of net.arcs) {
      if (a.from === u && a.hi - flow[a.id] > 0) cand.push({ v: a.to, arc: a, dir: "fwd", pot: a.hi - flow[a.id] });
      if (a.to === u && flow[a.id] - a.lo > 0) cand.push({ v: a.from, arc: a, dir: "back", pot: flow[a.id] - a.lo });
    }
    cand.sort((x, y) => x.v.localeCompare(y.v) || (x.dir === y.dir ? 0 : x.dir === "fwd" ? -1 : 1));
    for (const c of cand) {
      if (c.v in labels) continue;
      labels[c.v] = { from: u, arc: c.arc.id, dir: c.dir, pot: c.pot };
      queue.push(c.v);
    }
  }
  return labels;
}

function pathFromLabels(labels: Record<string, Label | null>): AugmentingPath | null {
  if (!(SINK in labels)) return null;
  const steps: PathStep[] = [];
  const pots: number[] = [];
  let n = SINK;
  while (n !== SOURCE) {
    const l = labels[n]!;
    steps.push({ arc: l.arc, dir: l.dir, to: n });
    pots.push(l.pot);
    n = l.from;
  }
  steps.reverse();
  pots.reverse();
  return { steps, potentials: pots, bottleneck: Math.min(...pots) };
}

export function findAugmentingPath(net: FlowNet, flow: Flow): AugmentingPath | null {
  return pathFromLabels(labelling(net, flow));
}

/** Every simple S→T path through positive potentials (used to enforce "exactly one path"). */
export function allAugmentingPaths(net: FlowNet, flow: Flow): AugmentingPath[] {
  const found: AugmentingPath[] = [];
  const visit = (u: string, seen: Set<string>, steps: PathStep[], pots: number[]) => {
    if (u === SINK) {
      found.push({ steps: [...steps], potentials: [...pots], bottleneck: Math.min(...pots) });
      return;
    }
    for (const a of net.arcs) {
      if (a.from === u && !seen.has(a.to) && a.hi - flow[a.id] > 0) {
        seen.add(a.to);
        visit(a.to, seen, [...steps, { arc: a.id, dir: "fwd", to: a.to }], [...pots, a.hi - flow[a.id]]);
        seen.delete(a.to);
      }
      if (a.to === u && !seen.has(a.from) && flow[a.id] - a.lo > 0) {
        seen.add(a.from);
        visit(a.from, seen, [...steps, { arc: a.id, dir: "back", to: a.from }], [...pots, flow[a.id] - a.lo]);
        seen.delete(a.from);
      }
    }
  };
  visit(SOURCE, new Set([SOURCE]), [], []);
  return found;
}

export function augment(flow: Flow, path: AugmentingPath): Flow {
  const out = { ...flow };
  for (const s of path.steps) out[s.arc] += s.dir === "fwd" ? path.bottleneck : -path.bottleneck;
  return out;
}

export interface MaxFlowRun {
  /** each augmentation in order, with the flow before and after */
  augmentations: Array<{ path: AugmentingPath; before: Flow; after: Flow }>;
  flow: Flow;
  value: number;
  /** nodes labelled when the procedure stops = S-side of the canonical minimum cut */
  sSide: string[];
}

export function maxFlow(net: FlowNet, flow0: Flow): MaxFlowRun {
  let flow = { ...flow0 };
  const augmentations: MaxFlowRun["augmentations"] = [];
  for (let guard = 0; guard < 200; guard++) {
    const path = findAugmentingPath(net, flow);
    if (!path) break;
    const after = augment(flow, path);
    augmentations.push({ path, before: flow, after });
    flow = after;
  }
  const labels = labelling(net, flow);
  return { augmentations, flow, value: flowValue(net, flow), sSide: orderNodes(net, Object.keys(labels)) };
}

// ── Cuts ─────────────────────────────────────────────────────────────────────
export interface CutResult {
  forward: FlowArc[]; // S-side → T-side: contribute +hi
  backward: FlowArc[]; // T-side → S-side: contribute −lo
  forwardSum: number;
  backwardSum: number;
  capacity: number;
}

export function cutCapacity(net: FlowNet, sSide: string[]): CutResult {
  const s = new Set(sSide);
  const forward = net.arcs.filter((a) => s.has(a.from) && !s.has(a.to));
  const backward = net.arcs.filter((a) => !s.has(a.from) && s.has(a.to));
  const forwardSum = forward.reduce((t, a) => t + a.hi, 0);
  const backwardSum = backward.reduce((t, a) => t + a.lo, 0);
  return { forward, backward, forwardSum, backwardSum, capacity: forwardSum - backwardSum };
}

/** Every cut: each subset of the non-terminal nodes joins S's side. 2^(n−2) cuts. */
export function allCuts(net: FlowNet): string[][] {
  const mid = net.nodes.map((n) => n.id).filter((id) => id !== SOURCE && id !== SINK);
  const cuts: string[][] = [];
  for (let mask = 0; mask < 1 << mid.length; mask++) {
    cuts.push(orderNodes(net, [SOURCE, ...mid.filter((_, i) => mask & (1 << i))]));
  }
  return cuts;
}

/** Brute-force minimum cut capacity — the independent reference the tests compare maxFlow against. */
export function minCutBruteForce(net: FlowNet): { capacity: number; sSide: string[] } {
  let best: { capacity: number; sSide: string[] } | null = null;
  for (const c of allCuts(net)) {
    const cap = cutCapacity(net, c).capacity;
    if (!best || cap < best.capacity) best = { capacity: cap, sSide: c };
  }
  return best!;
}

/** Order node ids as the network lists them (S first … T last), for stable display. */
export function orderNodes(net: FlowNet, ids: string[]): string[] {
  const rank = new Map(net.nodes.map((n, i) => [n.id, i]));
  return [...ids].sort((a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0));
}

/** "S → A → D" style path text from a path's steps (starting at S). */
export function pathNodes(path: AugmentingPath): string[] {
  return [SOURCE, ...path.steps.map((s) => s.to)];
}

/** All simple directed S→T paths (arcs only, forward) — the generator pushes flow along these. */
export function simpleForwardPaths(net: FlowNet): string[][] {
  const out: string[][] = [];
  const visit = (u: string, arcs: string[]) => {
    if (u === SINK) {
      out.push(arcs);
      return;
    }
    for (const a of net.arcs) if (a.from === u) visit(a.to, [...arcs, a.id]);
  };
  visit(SOURCE, []);
  return out;
}

/** Where an arc\'s three labels sit: a fraction along the arc from its tail, plus (for the flow circle and the
 *  potential arrows) which side of the line — +1 above it (right of a vertical arc), −1 below it. */
export interface ArcLabelPos {
  label: number; // "min, max" pill — on the line
  flow: [t: number, side: 1 | -1]; // circled flow — beside the line
  pot: [t: number, side: 1 | -1]; // the two potential arrows — beside the line, further out
}

/** The generated data a Network Flows question carries (DecisionProblem.flow). */
export interface FlowProblemData {
  subTool: FlowSubTool;
  mode: FlowMode;
  level: 1 | 2 | 3;
  templateId: string;
  net: FlowNet;
  flow: Flow; // the flow given in the question (all sub-tools start from one)
  style?: InitialStyle; // initialFlow only
  paths?: Array<{ arcs: string[]; amount: number }>; // initialFlow: a path decomposition of `flow` (the given paths, or the working)
  missing?: string[]; // missingFlow: the arcs whose flow is left out of the question
  rounds?: number; // augment: how many augmentations the question asks for
  target?: number; // initialFlow, capacity-only "find": the flow value asked for
  sSide?: string[]; // cutValue: the cut's S-side
  showCutLine?: boolean; // cutValue: draw the cut on the diagram
  /** per-arc label positions (fractions from the tail) so crossings stay readable */
  labelPos: Record<string, ArcLabelPos>;
}

/**
 * Split a flow into S→T paths (deterministic: depth-first, alphabetical). The amounts add back to the flow,
 * so it doubles as the "given paths" of an Initial flow question and as its worked solution.
 */
export function decomposeFlow(net: FlowNet, flow: Flow): Array<{ arcs: string[]; amount: number }> {
  const rem: Flow = { ...flow };
  const out: Array<{ arcs: string[]; amount: number }> = [];
  for (let guard = 0; guard < 100; guard++) {
    const walk = (u: string, arcs: string[]): string[] | null => {
      if (u === SINK) return arcs;
      const next = net.arcs.filter((a) => a.from === u && rem[a.id] > 0).sort((x, y) => x.to.localeCompare(y.to));
      for (const a of next) {
        const r = walk(a.to, [...arcs, a.id]);
        if (r) return r;
      }
      return null;
    };
    const arcs = walk(SOURCE, []);
    if (!arcs) break;
    const amount = Math.min(...arcs.map((id) => rem[id]));
    for (const id of arcs) rem[id] -= amount;
    out.push({ arcs, amount });
  }
  return out;
}

/** A feasible flow of exactly `value` on a capacity-only network (augment from zero, trimming the last push). */
export function flowOfValue(net: FlowNet, value: number): Flow | null {
  let flow: Flow = Object.fromEntries(net.arcs.map((a) => [a.id, a.lo]));
  if (!isFeasibleFlow(net, flow).ok) return null;
  for (let guard = 0; guard < 200 && flowValue(net, flow) < value; guard++) {
    const path = findAugmentingPath(net, flow);
    if (!path) return null;
    const need = value - flowValue(net, flow);
    flow = augment(flow, { ...path, bottleneck: Math.min(path.bottleneck, need) });
  }
  return flowValue(net, flow) === value ? flow : null;
}

/** "SACET" from an arc-id path. */
export const pathLabel = (net: FlowNet, arcs: string[]): string => {
  const byId = arcById(net);
  return SOURCE + arcs.map((id) => byId[id].to).join("");
};

/** Every flow-augmenting path, in a stable order (by the nodes they visit) — what the Augment flow question asks for. */
export function sortedAugmentingPaths(net: FlowNet, flow: Flow): AugmentingPath[] {
  return allAugmentingPaths(net, flow).sort((a, b) => pathNodes(a).join("").localeCompare(pathNodes(b).join("")));
}

/**
 * Missing flow: the order in which flow-in = flow-out at a vertex finds each missing arc, or null if the set cannot all
 * be found that way (some inner vertex must have exactly one unknown arc at each stage).
 */
export function peelMissing(net: FlowNet, missing: string[]): Array<{ arc: string; vertex: string }> | null {
  const unknown = new Set(missing);
  const out: Array<{ arc: string; vertex: string }> = [];
  const inner = net.nodes.map((n) => n.id).filter((id) => id !== SOURCE && id !== SINK);
  while (unknown.size) {
    let found = false;
    for (const v of inner) {
      const inc = net.arcs.filter((a) => (a.from === v || a.to === v) && unknown.has(a.id));
      if (inc.length === 1) {
        out.push({ arc: inc[0].id, vertex: v });
        unknown.delete(inc[0].id);
        found = true;
        break;
      }
    }
    if (!found) return null;
  }
  return out;
}


/**
 * The by-hand method for "find a flow", one S→T route at a time (what a student does on paper):
 *  • capacity-only (`target` given): repeatedly take the route with the most spare capacity and send as much as it will carry, but no more than is still
 *    needed, until the flow reaches `target`;
 *  • min/max: repeatedly take the arc furthest below its minimum, route through it (preferring routes that also cover other arcs still below their minimum
 *    and have the room), and send what that arc still needs, until every arc is at least its minimum.
 * Returns the routes and the resulting flow, or null if the method gets stuck (the generator then asks a different question).
 */
export function buildFlowByPaths(net: FlowNet, target?: number): { flow: Flow; paths: Array<{ arcs: string[]; amount: number }> } | null {
  const byId = arcById(net);
  const routes = simpleForwardPaths(net);
  const flow: Flow = {};
  for (const a of net.arcs) flow[a.id] = 0;
  const paths: Array<{ arcs: string[]; amount: number }> = [];
  const spare = (r: string[]) => Math.min(...r.map((id) => byId[id].hi - flow[id]));
  const push = (r: string[], amount: number) => {
    for (const id of r) flow[id] += amount;
    paths.push({ arcs: r, amount });
  };
  const minmax = net.arcs.some((a) => a.lo > 0);
  for (let guard = 0; guard < 14; guard++) {
    // a set value on a min/max network: the minimums come first, then the rest of the value is topped up on routes with room
    const deficient = minmax ? net.arcs.filter((a) => flow[a.id] < a.lo) : [];
    if (target !== undefined && !deficient.length) {
      const need = target - flowValue(net, flow);
      if (need <= 0) break;
      const cand = routes.filter((r) => spare(r) > 0).sort((x, y) => spare(y) - spare(x) || x.length - y.length || x.join().localeCompare(y.join()));
      if (!cand.length) return null;
      push(cand[0], Math.min(spare(cand[0]), need));
    } else {
      if (!deficient.length) break;
      const first = [...deficient].sort((x, y) => (y.lo - flow[y.id]) - (x.lo - flow[x.id]) || x.id.localeCompare(y.id))[0];
      const covered = (r: string[]) => r.filter((id) => flow[id] < byId[id].lo).length;
      const cand = routes.filter((r) => r.includes(first.id) && spare(r) > 0).sort((x, y) => covered(y) - covered(x) || spare(y) - spare(x) || x.length - y.length || x.join().localeCompare(y.join()));
      if (!cand.length) return null;
      push(cand[0], Math.min(spare(cand[0]), first.lo - flow[first.id]));
    }
  }
  if (flowValue(net, flow) === 0 || !isFeasibleFlow(net, flow).ok) return null;
  if (target !== undefined && flowValue(net, flow) !== target) return null;
  return { flow, paths };
}
