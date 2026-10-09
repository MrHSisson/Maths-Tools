// ═══════════════════════════════════════════════════════════════════════════
// Minimum spanning trees — the pure algorithms and the question generator (no React).
//
//   • kruskalTrace(net)      — Kruskal's algorithm, one trace entry per edge CONSIDERED, with the cycle it would
//                              close when rejected;
//   • primTrace(net, start)  — Prim's algorithm from a start vertex, one entry per edge ADDED, with every edge that
//                              was on offer (the "candidates") at that moment;
//   • generateMstNetwork()   — a network from the graph bank (graphBank.ts: hand-authored drawings whose weight labels are
//                              optimised and baked) with edge weights that are ALL DIFFERENT, so the minimum spanning tree
//                              and the order of every choice are unique (no tie-break rule is ever needed).
//
// Everything the working says is read off these traces, never recomputed, so a caption cannot disagree with the
// answer. validate.ts holds an independent Prim reference; src/tests/mst.test.ts re-derives everything again.
// ═══════════════════════════════════════════════════════════════════════════

import { sampleBankGraph } from "./graphBank";
import type { GEdge, Network } from "./types";

/** the two ends of an edge in alphabetical order — how an edge is named everywhere in the working ("AB", never "BA") */
export const ends = (e: { from: string; to: string }): [string, string] => (e.from < e.to ? [e.from, e.to] : [e.to, e.from]);
export const edgeName = (e: { from: string; to: string }) => ends(e).join("");
export const byWeight = (a: GEdge, b: GEdge) => a.weight - b.weight || a.id.localeCompare(b.id);

// ── Kruskal ──────────────────────────────────────────────────────────────────
export interface KruskalEntry {
  edge: GEdge;
  accepted: boolean;
  /** rejected only: the vertices of the path that already joins the two ends in the tree built so far (so the new edge would close a cycle) */
  cycle?: string[];
  /** the connected pieces AFTER this edge was dealt with, each sorted, pieces ordered by their first vertex */
  components: string[][];
}
export interface KruskalRun {
  sorted: GEdge[]; // every edge, smallest first
  entries: KruskalEntry[]; // the edges considered, in order (stops once the tree is complete)
  tree: GEdge[]; // accepted edges, in the order added
  total: number;
}

/** The vertices of the tree path from a to b (or null if they are not yet connected). */
export function treePath(tree: GEdge[], a: string, b: string): string[] | null {
  const adj: Record<string, string[]> = {};
  for (const e of tree) {
    (adj[e.from] ??= []).push(e.to);
    (adj[e.to] ??= []).push(e.from);
  }
  const prev: Record<string, string | null> = { [a]: null };
  const queue = [a];
  while (queue.length) {
    const u = queue.shift()!;
    if (u === b) break;
    for (const v of (adj[u] ?? []).sort()) if (!(v in prev)) { prev[v] = u; queue.push(v); }
  }
  if (!(b in prev)) return null;
  const path = [b];
  while (prev[path[0]] !== null) path.unshift(prev[path[0]]!);
  return path;
}

export function componentsOf(net: Network, tree: GEdge[]): string[][] {
  const parent: Record<string, string> = {};
  for (const n of net.nodes) parent[n.id] = n.id;
  const find = (x: string): string => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  for (const e of tree) parent[find(e.from)] = find(e.to);
  const groups: Record<string, string[]> = {};
  for (const n of net.nodes) (groups[find(n.id)] ??= []).push(n.id);
  return Object.values(groups).map((g) => g.sort()).sort((x, y) => x[0].localeCompare(y[0]));
}

export function kruskalTrace(net: Network): KruskalRun {
  const sorted = [...net.edges].sort(byWeight);
  const entries: KruskalEntry[] = [];
  const tree: GEdge[] = [];
  let total = 0;
  for (const e of sorted) {
    if (tree.length === net.nodes.length - 1) break;
    const path = treePath(tree, e.from, e.to);
    if (path) {
      entries.push({ edge: e, accepted: false, cycle: path, components: componentsOf(net, tree) });
    } else {
      tree.push(e);
      total += e.weight;
      entries.push({ edge: e, accepted: true, components: componentsOf(net, tree) });
    }
  }
  return { sorted, entries, tree, total };
}

// ── Prim ─────────────────────────────────────────────────────────────────────
export interface PrimEntry {
  /** vertices already in the tree when this edge was chosen (in the order they joined) */
  inTree: string[];
  /** every edge joining a tree vertex to a vertex outside it, smallest first — the chosen one is candidates[0] */
  candidates: GEdge[];
  edge: GEdge;
  /** the vertex this edge brings in */
  added: string;
  /** the vertex of the edge that was already in the tree */
  from: string;
  total: number;
}
export interface PrimRun {
  start: string;
  entries: PrimEntry[];
  tree: GEdge[];
  total: number;
}

export function primTrace(net: Network, start: string): PrimRun {
  const inTree = [start];
  const have = new Set(inTree);
  const entries: PrimEntry[] = [];
  const tree: GEdge[] = [];
  let total = 0;
  while (have.size < net.nodes.length) {
    const candidates = net.edges.filter((e) => have.has(e.from) !== have.has(e.to)).sort(byWeight);
    if (candidates.length === 0) throw new Error("primTrace: the network is not connected");
    const edge = candidates[0];
    const added = have.has(edge.from) ? edge.to : edge.from;
    const from = added === edge.to ? edge.from : edge.to;
    total += edge.weight;
    entries.push({ inTree: [...inTree], candidates, edge, added, from, total });
    tree.push(edge);
    inTree.push(added);
    have.add(added);
  }
  return { start, entries, tree, total };
}

// ── Generation ───────────────────────────────────────────────────────────────
export type MstKind = "kruskal" | "primNetwork" | "primMatrix";

export interface MstLevelSpec {
  nodes: [number, number];
  extra: [number, number];
  weights: [number, number];
  minRejected: number; // Kruskal must throw out at least this many edges
}
export const MST_LEVELS: Record<1 | 2 | 3, MstLevelSpec> = {
  1: { nodes: [5, 6], extra: [2, 4], weights: [2, 20], minRejected: 1 },
  2: { nodes: [7, 7], extra: [3, 6], weights: [3, 40], minRejected: 2 },
  3: { nodes: [8, 8], extra: [4, 8], weights: [3, 60], minRejected: 3 },
};

const ri = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));
const shuffle = <T,>(a: T[]): T[] => [...a].sort(() => Math.random() - 0.5);

/** n DIFFERENT integers from [lo, hi], in random order. */
export function distinctWeights(n: number, lo: number, hi: number): number[] {
  const pool: number[] = [];
  for (let v = lo; v <= hi; v++) pool.push(v);
  return shuffle(pool).slice(0, n);
}

/**
 * A network from the graph bank with all-different weights. `kind` only changes what must be true of it: Prim's must meet a
 * real choice, and must disagree with Kruskal's about the order.
 */
export function generateMstNetwork(level: 1 | 2 | 3, kind: MstKind): { network: Network; start: string } {
  const spec = MST_LEVELS[level];
  for (let attempt = 0; attempt < 4000; attempt++) {
    const nodeCount = ri(spec.nodes[0], spec.nodes[1]);
    // planar drawings only (a spanning-tree working never needs crossing edges); the complete graphs are for the travelling salesperson problem
    const sampled = sampleBankGraph({ size: nodeCount, kinds: ["planar"], edges: [nodeCount + spec.extra[0] - 1, nodeCount * 2] });
    const net: Network = { nodes: sampled.nodes, edges: sampled.edges };
    const ws = distinctWeights(net.edges.length, spec.weights[0], spec.weights[1]);
    if (ws.length < net.edges.length) continue;
    net.edges.forEach((e, i) => (e.weight = ws[i]));

    const k = kruskalTrace(net);
    const rejected = k.entries.filter((e) => !e.accepted).length;
    if (rejected < spec.minRejected) continue;

    const start = net.nodes[ri(0, net.nodes.length - 1)].id;
    if (kind !== "kruskal") {
      const p = primTrace(net, start);
      // Prim's must meet a real decision: at some step the cheapest edge is NOT simply the only one on offer
      if (p.entries.filter((e) => e.candidates.length >= 2).length < Math.max(2, nodeCount - 4)) continue;
      // …and Prim's and Kruskal's must disagree about the ORDER (otherwise it is the same working twice)
      if (p.tree.map((e) => e.id).join() === k.tree.map((e) => e.id).join()) continue;
    }
    return { network: net, start };
  }
  throw new Error("mst generator: no suitable network found");
}
