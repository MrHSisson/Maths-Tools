// ═══════════════════════════════════════════════════════════════════════════
// Route inspection (the Chinese postman problem) — the pure maths and the question generator (no React).
//
//   • degreeMap / oddVertices   — which vertices have an odd number of edges;
//   • shortestPaths(net)        — least distances and routes between every pair (Floyd–Warshall);
//   • inspectRoute(net, ends?)  — the whole working as data: total weight of the edges, every way of pairing the odd vertices
//                                 with its cost, the cheapest pairing, the edges to repeat. With `ends` (an odd start and an odd
//                                 finish) those two need no repeats and only the REST are paired — the "start at A, finish at B" question;
//   • eulerRoute(net, …)        — an actual route (Hierholzer) over the network plus the repeated edges, so the working can end with one;
//   • generateRouteNetwork()    — a network from the graph bank (GRAPH_POLICY.routeInspection) with a chosen number of odd vertices.
//
// Everything the working says is read off inspectRoute(), never recomputed, so a caption cannot disagree with the answer.
// validate.ts holds an independent brute-force reference (Bellman–Ford distances + exhaustive matching) that CI checks every answer against.
// ═══════════════════════════════════════════════════════════════════════════

import { sampleBankGraph } from "./graphBank";
import type { GEdge, Network } from "./types";

const ri = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));

// ── Degrees ──────────────────────────────────────────────────────────────────
export function degreeMap(net: Network): Record<string, number> {
  const d: Record<string, number> = Object.fromEntries(net.nodes.map((n) => [n.id, 0]));
  for (const e of net.edges) { d[e.from]++; d[e.to]++; }
  return d;
}
export const oddVertices = (net: Network): string[] => {
  const d = degreeMap(net);
  return net.nodes.map((n) => n.id).filter((id) => d[id] % 2 === 1).sort();
};
export type NetworkType = "eulerian" | "semi" | "neither";
export const networkType = (oddCount: number): NetworkType => (oddCount === 0 ? "eulerian" : oddCount === 2 ? "semi" : "neither");

export const totalWeight = (net: Network) => net.edges.reduce((t, e) => t + e.weight, 0);
export const routeEdgeName = (e: { from: string; to: string }) => (e.from < e.to ? e.from + e.to : e.to + e.from);
const edgeBetween = (net: Network, u: string, v: string): GEdge | undefined =>
  net.edges.find((e) => (e.from === u && e.to === v) || (e.from === v && e.to === u));

// ── Shortest paths ───────────────────────────────────────────────────────────
export interface Shortest {
  dist: Record<string, Record<string, number>>;
  /** the vertices of a shortest route from a to b, inclusive */
  path: (a: string, b: string) => string[];
  /** how many different shortest routes there are from a to b (1 = the route is unique) */
  count: (a: string, b: string) => number;
}

export function shortestPaths(net: Network): Shortest {
  const ids = net.nodes.map((n) => n.id);
  const dist: Record<string, Record<string, number>> = {};
  const next: Record<string, Record<string, string | null>> = {};
  for (const a of ids) {
    dist[a] = {};
    next[a] = {};
    for (const b of ids) { dist[a][b] = a === b ? 0 : Infinity; next[a][b] = null; }
  }
  for (const e of net.edges) {
    for (const [u, v] of [[e.from, e.to], [e.to, e.from]] as const) if (e.weight < dist[u][v]) { dist[u][v] = e.weight; next[u][v] = v; }
  }
  for (const k of ids) for (const a of ids) for (const b of ids) {
    if (dist[a][k] + dist[k][b] < dist[a][b]) { dist[a][b] = dist[a][k] + dist[k][b]; next[a][b] = next[a][k]; }
  }
  const path = (a: string, b: string): string[] => {
    const out = [a];
    let at = a;
    while (at !== b) { at = next[at][b]!; out.push(at); }
    return out;
  };
  const memo = new Map<string, number>();
  const count = (a: string, b: string): number => {
    if (a === b) return 1;
    const key = a + "|" + b;
    const hit = memo.get(key);
    if (hit !== undefined) return hit;
    let n = 0;
    for (const e of net.edges) {
      if (e.from !== a && e.to !== a) continue;
      const v = e.from === a ? e.to : e.from;
      if (e.weight + dist[v][b] === dist[a][b]) n += count(v, b);
    }
    memo.set(key, n);
    return n;
  };
  return { dist, path, count };
}

// ── Pairing the odd vertices ─────────────────────────────────────────────────
/** every way of splitting an even-sized list into pairs (the list is in alphabetical order; each pair is too) */
export function pairingsOf(ids: string[]): Array<Array<[string, string]>> {
  if (ids.length === 0) return [[]];
  const [first, ...rest] = ids;
  const out: Array<Array<[string, string]>> = [];
  rest.forEach((partner, i) => {
    const others = rest.filter((_, j) => j !== i);
    for (const p of pairingsOf(others)) out.push([[first, partner], ...p]);
  });
  return out;
}

export interface Pairing {
  pairs: Array<[string, string]>;
  /** the least distance between the two vertices of each pair */
  lengths: number[];
  total: number;
}

export interface InspectionRun {
  totalWeight: number;
  degrees: Record<string, number>;
  odd: string[];
  /** with `ends`: the start and finish (both odd) — they are not paired */
  ends?: { start: string; end: string };
  /** the odd vertices that DO have to be paired (all of them, or all but the two ends) */
  toPair: string[];
  shortest: Shortest;
  pairings: Pairing[];
  /** the cheapest pairing (null when nothing needs pairing) */
  best: Pairing | null;
  /** is the cheapest total shared by more than one pairing? (the generator never asks such a question) */
  tied: boolean;
  /** the vertices of the route repeated for each pair of the best pairing */
  repeated: string[][];
  extra: number;
  routeLength: number;
}

export function inspectRoute(net: Network, ends?: { start: string; end: string }): InspectionRun {
  const degrees = degreeMap(net);
  const odd = oddVertices(net);
  if (ends && (!odd.includes(ends.start) || !odd.includes(ends.end) || ends.start === ends.end)) throw new Error("inspectRoute: the start and finish must be two different odd vertices");
  const toPair = ends ? odd.filter((v) => v !== ends.start && v !== ends.end) : odd;
  const shortest = shortestPaths(net);
  const pairings: Pairing[] = pairingsOf(toPair).map((pairs) => {
    const lengths = pairs.map(([a, b]) => shortest.dist[a][b]);
    return { pairs, lengths, total: lengths.reduce((t, x) => t + x, 0) };
  });
  const best = pairings.length ? pairings.reduce((m, p) => (p.total < m.total ? p : m)) : null;
  const tied = !!best && pairings.filter((p) => p.total === best.total).length > 1;
  const repeated = best ? best.pairs.map(([a, b]) => shortest.path(a, b)) : [];
  const extra = best?.total ?? 0;
  const tw = totalWeight(net);
  return { totalWeight: tw, degrees, odd, ends, toPair, shortest, pairings, best, tied, repeated, extra, routeLength: tw + extra };
}

// ── An actual route ──────────────────────────────────────────────────────────
/** Every edge once, plus each repeated connection once more — as a multigraph — traversed by Hierholzer's algorithm from `start`. */
export function eulerRoute(net: Network, repeated: string[][], start: string): string[] {
  const list: Array<{ a: string; b: string }> = net.edges.map((e) => ({ a: e.from, b: e.to }));
  for (const path of repeated) for (let i = 0; i + 1 < path.length; i++) {
    const e = edgeBetween(net, path[i], path[i + 1]);
    if (!e) throw new Error("eulerRoute: a repeated connection uses a missing edge");
    list.push({ a: e.from, b: e.to });
  }
  const adj = new Map<string, Array<{ to: string; idx: number }>>();
  list.forEach((e, idx) => {
    for (const [u, v] of [[e.a, e.b], [e.b, e.a]] as const) (adj.get(u) ?? adj.set(u, []).get(u)!).push({ to: v, idx });
  });
  for (const arr of adj.values()) arr.sort((p, q) => p.to.localeCompare(q.to) || p.idx - q.idx);
  const used = new Array(list.length).fill(false);
  const stack = [start];
  const out: string[] = [];
  while (stack.length) {
    const v = stack[stack.length - 1];
    const arr = adj.get(v) ?? [];
    while (arr.length && used[arr[0].idx]) arr.shift();
    if (arr.length) { const h = arr.shift()!; used[h.idx] = true; stack.push(h.to); } else out.push(stack.pop()!);
  }
  return out.reverse();
}

// ── Generation ───────────────────────────────────────────────────────────────
export type RouteKind = "routeClassify" | "routeClosed" | "routeOpen";
export type OddChoice = "any" | "two" | "four";

export interface RouteLevelSpec { nodes: [number, number]; weights: [number, number] }
/** levels are graph size (GRAPH_POLICY.routeInspection: planar, 5–8 vertices) */
export const ROUTE_LEVELS: Record<1 | 2 | 3, RouteLevelSpec> = {
  1: { nodes: [5, 6], weights: [2, 12] },
  2: { nodes: [7, 7], weights: [2, 15] },
  3: { nodes: [8, 8], weights: [3, 20] },
};

export interface RouteNetwork { network: Network; run: InspectionRun; start: string; end?: string; type: NetworkType }

/**
 * A network from the graph bank with the wanted number of odd vertices. Questions that ask for a route have 2 or 4 odd vertices (the
 * classify question also draws 0, so a network with none is met too); the cheapest pairing is unique; and above Level 1 the cheapest
 * connection between some pair of odd vertices is NOT simply the edge between them (so the shortest-path work is real).
 */
export function generateRouteNetwork(level: 1 | 2 | 3, kind: RouteKind, odd: OddChoice = "any"): RouteNetwork {
  const spec = ROUTE_LEVELS[level];
  for (let attempt = 0; attempt < 6000; attempt++) {
    const want = kind === "routeClassify"
      ? (odd === "two" ? 2 : odd === "four" ? 4 : [0, 2, 4][ri(0, 2)])
      : (odd === "two" ? 2 : odd === "four" ? 4 : ri(0, 1) ? 4 : 2);
    const sampled = sampleBankGraph({ use: "routeInspection", size: spec.nodes });
    const network: Network = { nodes: sampled.nodes, edges: sampled.edges };
    if (oddVertices(network).length !== want) continue;
    network.edges.forEach((e) => (e.weight = ri(spec.weights[0], spec.weights[1])));
    if (kind === "routeClassify") {
      const run = inspectRoute(network);
      return { network, run, start: run.odd[0] ?? network.nodes[0].id, type: networkType(want) };
    }
    const ids = oddVertices(network);
    // closed: start anywhere; open: start and finish are two of the odd vertices (with four odd vertices, the other two are paired)
    let ends: { start: string; end: string } | undefined;
    let start = network.nodes[ri(0, network.nodes.length - 1)].id;
    if (kind === "routeOpen") {
      const pair = [...ids].sort(() => Math.random() - 0.5).slice(0, 2);
      ends = { start: pair[0], end: pair[1] };
      start = pair[0];
    }
    const run = inspectRoute(network, ends);
    if (kind === "routeClosed" && want === 0) continue; // nothing to pair: the closed question needs odd vertices
    if (run.tied) continue;
    if (run.best && run.best.pairs.some(([a, b]) => run.shortest.count(a, b) !== 1)) continue; // the repeated route is unique
    if (level > 1 && run.best && run.toPair.length) {
      const indirect = run.pairings.some((p) => p.pairs.some(([a, b]) => { const d = edgeBetween(network, a, b); return !d || d.weight > run.shortest.dist[a][b]; }));
      if (!indirect) continue;
    }
    // the answer must differ from the cheaper-looking "just the total weight" so the repeats matter
    if (run.extra <= 0 && kind === "routeClosed") continue;
    return { network, run, start, end: ends?.end, type: networkType(ids.length) };
  }
  throw new Error("route inspection generator: no suitable network found");
}
