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
import { NODE_R, flowRadius, pillWidth } from "./flowGeometry";

export type FlowMode = "cap" | "minmax"; // capacity-only (lo = 0 everywhere) or min/max labelled
// AS questions: "maxCut" — a maximal flow is shown and the student finds a cut of the same capacity; "maxInspect" — find the maximum flow by inspection (routes), justified by a cut; "cutTable" — the value of each cut in a list. Original note on maxCut: a maximal flow is shown and the student finds a cut of the same capacity (no potentials, no augmentation)
export type FlowSubTool = "initialFlow" | "missingFlow" | "potentials" | "cutValue" | "augment" | "maxFlow" | "maxCut" | "maxInspect" | "cutTable" | "exam" | "nodeCap" | "superST";
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
interface PathStep {
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
  cutBackSilent?: boolean; // AS: arcs coming back across the cut are ignored, so they get no label at all
  labelled?: string[]; // nodes reached by the labelling procedure
  focus?: string[]; // arcs to emphasise
  /** Draw this network instead of the question's (the node-capacity working draws the SPLIT network), with its own label positions. */
  net?: FlowNet;
  labelPos?: Record<string, ArcLabelPos>;
  /** restricted vertices and their maximum throughput — drawn as a ringed vertex with a "max" tag */
  nodeCaps?: Record<string, number>;
  /** a small tag on a vertex (a source's "supply 12", a sink's "demand 9") */
  nodeTags?: Record<string, string>;
}

// ── Basics ───────────────────────────────────────────────────────────────────
const arcById = (net: FlowNet): Record<string, FlowArc> => {
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

interface MaxFlowRun {
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
interface CutResult {
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
  nodeCaps?: Record<string, number>; // nodeCap: vertex → maximum throughput (the total flow through it)
  split?: SplitNet; // nodeCap: the network with every restricted vertex split in two (see splitNodes)
  /** superST: `net` is the network WITH the supersource / supersink; this describes what the question shows instead */
  superST?: SuperParts & { removeS: boolean; removeT: boolean };
  sSide?: string[]; // cutValue / maxCut: the cut's S-side
  /** "as": the AS version of the question (superST: add the supersource / supersink and give the capacities of the added arcs, no augmentation) */
  course?: "as";
  /** cutTable: the cuts asked for (each the S side), whether each can be drawn as one dashed line, and whether they are ALL the cuts of the network */
  cuts?: string[][];
  cutDrawable?: boolean[];
  cutsAll?: boolean;
  /** exam: how the picture looks in the question, before any part\'s answer is showing */
  examView?: FlowViewState;
  showCutLine?: boolean; // cutValue: draw the cut on the diagram
  /** per-arc label positions (fractions from the tail) so crossings stay readable */
  labelPos: Record<string, ArcLabelPos>;
}

// ── Several sources / several sinks ──────────────────────────────────────────
// The question shows the network WITHOUT its super vertices: the vertices S fed are sources (each with a supply = the capacity of its
// arc from S), the vertices that fed T are sinks (each with a demand). The working adds S / T back, which is the network the algorithms run on.
interface SuperParts {
  sources: Record<string, number>; // source vertex → supply
  sinks: Record<string, number>; // sink vertex → demand
  question: FlowNet; // the network as the question draws it
  superArcs: string[]; // the arcs the working adds (S → each source, each sink → T)
}
export function superParts(net: FlowNet, removeS: boolean, removeT: boolean): SuperParts {
  const sOut = net.arcs.filter((a) => a.from === SOURCE);
  const tIn = net.arcs.filter((a) => a.to === SINK);
  const gone = (a: FlowArc) => (removeS && a.from === SOURCE) || (removeT && a.to === SINK);
  return {
    sources: removeS ? Object.fromEntries(sOut.map((a) => [a.to, a.hi])) : {},
    sinks: removeT ? Object.fromEntries(tIn.map((a) => [a.from, a.hi])) : {},
    question: {
      nodes: net.nodes.filter((n) => !((removeS && n.id === SOURCE) || (removeT && n.id === SINK))),
      arcs: net.arcs.filter((a) => !gone(a)),
    },
    superArcs: net.arcs.filter(gone).map((a) => a.id),
  };
}

// ── Restricted vertices: split a vertex into two joined by an arc ─────────────
// A vertex with a maximum throughput c is replaced by X₁ (everything arriving) → X₂ (everything leaving) with an arc of
// capacity c between them. The flow through the original vertex is the flow in that arc, so the ordinary algorithms apply.
interface SplitNet {
  net: FlowNet;
  labelPos: Record<string, ArcLabelPos>;
  flow: Flow; // the question's flow carried over (the new arcs carry the vertex's throughput)
  nodeArc: Record<string, string>; // restricted vertex → the id of its new arc
  inNode: Record<string, string>; // restricted vertex → its first half (X₁: takes the arcs arriving)
  outNode: Record<string, string>; // restricted vertex → its second half (X₂: takes the arcs leaving)
  arcMap: Record<string, string>; // original arc id → id in the split network
}
/** The shortest the new arc between the two halves is (the arc's labels need more when its pill is wide — see `splitNodes`). */
const SPLIT_GAP = 170;

export const subscript = (n: number) => String(n).split("").map((c) => "₀₁₂₃₄₅₆₇₈₉"[+c]).join("");

export function splitNodes(net: FlowNet, caps: Record<string, number>, labelPos: Record<string, ArcLabelPos>, flow: Flow): SplitNet {
  const restricted = new Set(Object.keys(caps));
  const inNode: Record<string, string> = {};
  const outNode: Record<string, string> = {};
  const nodes: GNode[] = [];
  // The new arc carries the whole flow through x, which is also the total arriving and the total leaving, so it can never be less than the
  // minimums arriving (or leaving) added up, nor more than the maximums arriving (or leaving) added up: its bounds are the restriction,
  // tightened by those sums. (Minimums add — they do not take a "min of the mins": two arcs arriving with minimums 2 and 3 force at least 5 through x.)
  const boundsOf = (x: string) => {
    const into = net.arcs.filter((a) => a.to === x), outOf = net.arcs.filter((a) => a.from === x);
    return {
      lo: Math.max(into.reduce((t, a) => t + a.lo, 0), outOf.reduce((t, a) => t + a.lo, 0)),
      hi: Math.min(caps[x], into.reduce((t, a) => t + a.hi, 0), outOf.reduce((t, a) => t + a.hi, 0)),
    };
  };
  const minmax = net.arcs.some((a) => a.lo > 0);
  // Room for the new arc's labels: its "min, max" pill and its circled flow sit side by side along it, so a wide pill (min and max networks)
  // needs a longer arc. The pill sits at the second half's end of the line and the circle at the first half's end.
  const pillW = Math.max(...[...restricted].map((x) => { const b = boundsOf(x); return pillWidth(minmax ? `${b.lo}, ${b.hi}` : `${b.hi}`); }));
  const flowR = Math.max(...[...restricted].map((x) => flowRadius(String(boundsOf(x).hi).length)));
  const gap = Math.max(SPLIT_GAP, Math.ceil(pillW + 2 * flowR + 2 * NODE_R + 26));
  // Room for the new arc: the first half stays where the vertex was, the second half sits one gap to its right, and every vertex further
  // right moves along by one gap per split vertex to its left — so no existing arc is squeezed and nothing lands on top of another vertex.
  const splitXs = [...new Set(net.nodes.filter((n) => restricted.has(n.id)).map((n) => n.x))];
  const shiftFor = (x: number) => gap * splitXs.filter((sx) => sx < x).length;
  for (const n of net.nodes) {
    const x = n.x + shiftFor(n.x);
    if (!restricted.has(n.id)) { nodes.push({ ...n, x }); continue; }
    const base = n.label ?? n.id;
    inNode[n.id] = base + subscript(1);
    outNode[n.id] = base + subscript(2);
    nodes.push({ ...n, id: inNode[n.id], x, label: inNode[n.id] });
    nodes.push({ id: outNode[n.id], x: x + gap, y: n.y, label: outNode[n.id] });
  }
  const labelAt = (gapPx: number) => ({ label: (gapPx - NODE_R - 2 - pillW / 2) / gapPx, flow: [(NODE_R + flowR + 2) / gapPx, 1] as [number, 1], pot: [0.5, -1] as [number, -1] });
  const arcs: FlowArc[] = [];
  const newPos: Record<string, ArcLabelPos> = {};
  const newFlow: Flow = {};
  const arcMap: Record<string, string> = {};
  const nodeArc: Record<string, string> = {};
  for (const a of net.arcs) {
    const from = restricted.has(a.from) ? outNode[a.from] : a.from;
    const to = restricted.has(a.to) ? inNode[a.to] : a.to;
    const id = from + to;
    arcMap[a.id] = id;
    arcs.push({ id, from, to, lo: a.lo, hi: a.hi });
    if (labelPos[a.id]) newPos[id] = labelPos[a.id];
    newFlow[id] = flow[a.id];
  }
  for (const x of restricted) {
    const id = inNode[x] + outNode[x];
    nodeArc[x] = id;
    const { lo, hi } = boundsOf(x);
    arcs.push({ id, from: inNode[x], to: outNode[x], lo, hi });
    newPos[id] = labelAt(gap);
    newFlow[id] = net.arcs.filter((a) => a.to === x).reduce((t, a) => t + flow[a.id], 0);
  }
  return { net: { nodes, arcs }, labelPos: newPos, flow: newFlow, nodeArc, inNode, outNode, arcMap };
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
