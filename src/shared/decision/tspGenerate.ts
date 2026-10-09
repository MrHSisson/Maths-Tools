// ═══════════════════════════════════════════════════════════════════════════
// Travelling salesperson — question generation (no React).
//
// EVERY question starts from an initial network whose weights are arbitrary: they need not satisfy the triangle inequality, and a pair of
// vertices need not be joined. The first step is always the same — build the complete network of LEAST distances (replace each entry by the
// shortest route), which satisfies the triangle inequality by construction — and then the classical problem is solved on that table.
//
//   Level 1  a complete network (K4–K6) with arbitrary weights: 0–3 of its entries are beaten by a route through other vertices;
//   Level 2  a practical network (not every pair joined): complete the table of least distances; at most one direct edge is beaten;
//   Level 3  as Level 2, but one to three direct edges are beaten by a detour.
//
// Question kinds: tspNN (nearest-neighbour upper bound, from one start or two), tspLower (deleted-vertex lower bound),
// tspBounds (both, then the interval the optimal tour lies in) and tspTable (just the table of least distances).
// Every question is unambiguous: every nearest-neighbour choice is tie-free, every shortest route that matters is unique,
// and the lower bound's tree and links are the only possible ones (see tspBounds.ts). validate.ts re-derives all of it.
// ═══════════════════════════════════════════════════════════════════════════

import { sampleBankGraph } from "./graphBank";
import { leastDistances, nearestNeighbour, type LeastDistances } from "./tsp";
import { lowerBound } from "./tspBounds";
import type { DecisionProblem, Network } from "./types";

export type TspKind = "tspNN" | "tspLower" | "tspBounds" | "tspTable";
export interface TspGenOptions {
  starts: 1 | 2; // nearest neighbour from one start vertex or two (best upper bound)
  setting: "plain" | "context";
  /**
   * Do the INITIAL network's weights satisfy the triangle inequality? "holds": no direct edge is beaten by a route through other vertices
   * (distances); "breaks": at least one is (journey times, costs). "either" (default): a mix. The table of least distances that every question
   * builds first satisfies it regardless.
   */
  weights?: "either" | "holds" | "breaks";
}
export type WeightsMode = NonNullable<TspGenOptions["weights"]>;

const randInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

export const pairKey = (a: string, b: string) => (a < b ? `${a}${b}` : `${b}${a}`);

/** the vertices on the convex hull, in order round it */
function hullOrder(nodes: Array<{ id: string; x: number; y: number }>): string[] {
  const p = [...nodes].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: typeof p = [], up: typeof p = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of [...p].reverse()) { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return [...lo.slice(0, -1), ...up.slice(0, -1)].map((q) => q.id);
}

/** Is the closed tour simply the outline of the drawing (every vertex on the hull, visited in hull order)? Such a tour answers itself at a glance. */
function isOutsideRing(net: Network, tour: string[]): boolean {
  const hull = hullOrder(net.nodes);
  if (hull.length !== net.nodes.length) return false;
  const closed = tour.slice(0, -1).join("");
  const rotations = (arr: string[]) => arr.map((_, i) => arr.slice(i).concat(arr.slice(0, i)).join(""));
  return rotations(hull).includes(closed) || rotations([...hull].reverse()).includes(closed);
}

/** The length of the best tour (exhaustive: at most 5! = 120 orders for six vertices). */
function optimalLength(ids: string[], dist: Record<string, Record<string, number>>): number {
  const [first, ...rest] = ids;
  let best = Infinity;
  const go = (prev: string, left: string[], total: number) => {
    if (total >= best) return;
    if (!left.length) { best = Math.min(best, total + dist[prev][first]); return; }
    left.forEach((v, i) => go(v, left.filter((_, j) => j !== i), total + dist[prev][v]));
  };
  go(first, rest, 0);
  return best;
}

/** Pairs whose table entry differs from the drawn network: not joined directly, or joined by an edge that a detour beats. */
export function pairsToComplete(ld: LeastDistances): [string, string][] {
  const out: [string, string][] = [];
  for (let i = 0; i < ld.ids.length; i++)
    for (let j = i + 1; j < ld.ids.length; j++) {
      const a = ld.ids[i], b = ld.ids[j];
      const d = ld.direct[a][b];
      if (d === null || ld.dist[a][b] < d) out.push([a, b]);
    }
  return out;
}

const tieFreeStarts = (ld: LeastDistances): string[] => ld.ids.filter((s) => !nearestNeighbour(ld.ids, ld.dist, s).tied);

/**
 * The complete network of least distances, as a picture: every pair joined, each weight the table entry. A complete network keeps its own
 * layout (so the picture does not jump); a practical network is redrawn on the bank's K4–K6 layout (a clean drawing where every weight label
 * clears the others), with the same vertex letters.
 */
export function completeOf(network: Network, ld: LeastDistances): Network {
  const n = network.nodes.length;
  const w = (e: { from: string; to: string }) => ld.dist[e.from][e.to];
  if (network.edges.length === (n * (n - 1)) / 2) return { nodes: network.nodes.map((v) => ({ ...v })), edges: network.edges.map((e) => ({ ...e, weight: w(e) })) };
  const k = sampleBankGraph({ use: "tspComplete", ids: [`k${n}`] });
  return { nodes: k.nodes, edges: k.edges.map((e) => ({ ...e, weight: w(e) })) };
}

/** The tour as actually driven in the drawn network — each leg replaced by its shortest route. */
export function expandRoute(ld: LeastDistances, tour: string[]): string[] {
  const out = [tour[0]];
  for (let i = 1; i < tour.length; i++) out.push(...ld.path[tour[i - 1]][tour[i]].slice(1));
  return out;
}

// ── the networks ─────────────────────────────────────────────────────────────
// The vertex count is chosen FIRST and held while a network is searched for. Weights are DIFFERENT whole numbers (so no two distances tie:
// no nearest-neighbour choice and no spanning tree is ambiguous) and are deliberately NOT scaled to the drawing: drawn to scale, a ring of
// towns makes the nearest-neighbour tour just the outline, and there is no interval to find. They are also NOT forced to satisfy the
// triangle inequality — a direct leg may be longer than going round (a slow road, a dear ticket); the table of least distances fixes that.

/** Least distances by Floyd–Warshall — cheap enough to screen thousands of candidate networks (the exact, route-keeping search runs only on the survivor). */
function fastDist(net: Network): Record<string, Record<string, number>> {
  const ids = net.nodes.map((v) => v.id);
  const d: Record<string, Record<string, number>> = {};
  for (const a of ids) { d[a] = {}; for (const b of ids) d[a][b] = a === b ? 0 : Infinity; }
  for (const e of net.edges) { d[e.from][e.to] = Math.min(d[e.from][e.to], e.weight); d[e.to][e.from] = Math.min(d[e.to][e.from], e.weight); }
  for (const k of ids) for (const a of ids) for (const b of ids) if (d[a][k] + d[k][b] < d[a][b]) d[a][b] = d[a][k] + d[k][b];
  return d;
}
const beatenEdges = (net: Network): number => { const d = fastDist(net); return net.edges.filter((e) => d[e.from][e.to] < e.weight).length; };

function completeNetwork(n: number, mode: WeightsMode): Network {
  // 0–3 entries beaten by a route through other vertices (0 is a table of genuine distances, which needs no change)
  const want = mode === "holds" ? 0 : mode === "breaks" ? pick([1, 1, 2, 2, 3]) : pick([0, 1, 1, 2, 2, 3]);
  for (let t = 0; t < 3000; t++) {
    const net: Network = sampleBankGraph({ use: "tspComplete", ids: [`k${n}`] });
    // 16–31 can never be beaten (any two add to more than the largest); 5–45 often is
    const pool = want === 0 ? shuffle(Array.from({ length: 16 }, (_, i) => 16 + i)) : shuffle(Array.from({ length: 41 }, (_, i) => 5 + i));
    net.edges.forEach((e, i) => (e.weight = pool[i]));
    if (beatenEdges(net) !== want) continue; // a complete network: every beaten edge is a table entry to replace
    const ld = leastDistances(net);
    const todo = pairsToComplete(ld);
    if (todo.some(([a, b]) => !ld.unique[a][b])) continue; // one clear route for each replaced entry
    return net;
  }
  throw new Error("tsp generator: no complete network found");
}

function practicalNetwork(n: number, level: 2 | 3, minMissing: number, mode: WeightsMode, tries = 800): Network | null {
  for (let t = 0; t < tries; t++) {
    // a practical network: any bank graph with n vertices that is not complete (its optional edges vary from question to question)
    const sampled = sampleBankGraph({ use: "tspPractical", size: n });
    const net: Network = { nodes: sampled.nodes, edges: sampled.edges };
    const missing = (n * (n - 1)) / 2 - net.edges.length;
    if (missing < minMissing || missing > 6) continue; // enough to complete, not a slog
    const pool = shuffle(Array.from({ length: 27 }, (_, i) => 4 + i));
    net.edges.forEach((e, i) => (e.weight = pool[i]));
    let b = beatenEdges(net);
    if (level === 3 && b === 0 && mode !== "holds") {
      // lengthen one non-bridge edge so a detour beats it (a road over a hill)
      const cand = shuffle(net.edges).find((e) => fastDist({ ...net, edges: net.edges.filter((x) => x.id !== e.id) })[e.from][e.to] < Infinity);
      if (!cand) continue;
      const without = { ...net, edges: net.edges.filter((x) => x.id !== cand.id) };
      cand.weight = fastDist(without)[cand.from][cand.to] + randInt(2, 6);
      b = beatenEdges(net);
    }
    // holds: no direct edge is beaten; breaks: Level 2 exactly one, Level 3 one to three; either: Level 2 none or one, Level 3 one to three
    if (mode === "holds" ? b !== 0 : mode === "breaks" ? (level === 2 ? b !== 1 : b < 1 || b > 3) : level === 2 ? b > 1 : b < 1 || b > 3) continue;
    const ld = leastDistances(net);
    if (pairsToComplete(ld).some(([x, y]) => !ld.unique[x][y])) continue; // one clear route for each entry
    // with every direct edge a true shortest route (no edge beaten), what makes Level 3 harder is a table entry that needs a long route: three or more edges
    if (mode === "holds" && level === 3 && !pairsToComplete(ld).some(([x, y]) => ld.path[x][y].length >= 4)) continue;
    return net;
  }
  return null;
}

const SIZES: Record<TspKind, number[]> = {
  tspNN: [4, 5, 6],
  tspLower: [5, 6],
  tspBounds: [5, 6],
  tspTable: [4, 5, 6],
};

// ── the setting ──────────────────────────────────────────────────────────────
// The weights need not be distances: journey times and costs break the triangle inequality naturally (a direct leg can be slower or dearer
// than going round). A plain distance is only offered when no direct edge is beaten by a detour.
const SETTINGS = [
  { who: "A delivery driver", what: "depots", measure: "distances in km", distance: true },
  { who: "A sales representative", what: "towns", measure: "distances in miles", distance: true },
  { who: "An engineer", what: "wind-farm sites", measure: "distances in km", distance: true },
  { who: "A tourist", what: "landmarks", measure: "distances in km", distance: true },
  { who: "A surveyor", what: "monitoring stations", measure: "distances in miles", distance: true },
  { who: "A courier", what: "depots", measure: "journey times in minutes — traffic, ferries and motorways mean the quickest way between two depots is not always the shortest", distance: false },
  { who: "A sales representative", what: "towns", measure: "the cost in pounds of the cheapest direct ticket", distance: false },
  { who: "A maintenance engineer", what: "sites", measure: "journey times in minutes, including waiting for connections", distance: false },
  { who: "A tour operator", what: "airports", measure: "the cost in pounds of the cheapest direct flight", distance: false },
];

export function generateTsp(level: 1 | 2 | 3, kind: TspKind, opts: TspGenOptions): DecisionProblem {
  for (let attempt = 0; attempt < 400; attempt++) {
    // Level 1 is a complete network; Levels 2–3 (and the table question, at every level) are practical networks with missing edges
    const n = pick(SIZES[kind].filter((m) => level < 3 || m >= 5));
    const mode: WeightsMode = opts.weights ?? "either";
    const network = level === 1 && kind !== "tspTable" ? completeNetwork(n, mode) : practicalNetwork(n, level === 3 ? 3 : 2, 2, mode);
    if (!network) continue;
    // the first step is always the complete network of least distances — a metric by construction — and the classical problem is solved on it
    const ld = leastDistances(network);
    const todo = pairsToComplete(ld);
    const practical = todo.length > 0;

    let starts: string[] = [];
    let deleted: string | undefined;
    let upper: number | undefined;
    let lower: number | undefined;
    let tour: string[] | undefined;
    if (kind === "tspNN" || kind === "tspBounds") {
      const ok = shuffle(tieFreeStarts(ld));
      if (opts.starts === 2 && kind === "tspNN") {
        const s1 = ok[0];
        const s2 = ok.find((s) => s !== s1 && nearestNeighbour(ld.ids, ld.dist, s).total !== nearestNeighbour(ld.ids, ld.dist, s1).total);
        if (!s1 || !s2) continue;
        starts = [s1, s2];
      } else {
        if (!ok.length) continue;
        starts = [ok[0]];
      }
      const runs = starts.map((s) => ({ s, nn: nearestNeighbour(ld.ids, ld.dist, s) }));
      const best = runs.reduce((a, b) => (b.nn.total < a.nn.total ? b : a));
      upper = best.nn.total;
      tour = best.nn.tour;
      // the tour must not simply be the outline of the drawing, and (most of the time) the nearest-neighbour tour is not already optimal —
      // otherwise the upper bound is no more than a restatement of the picture
      if (isOutsideRing(network, tour)) continue;
      if (Math.random() < 0.6 && upper === optimalLength(ld.ids, ld.dist)) continue;
      starts = [...starts]; // the first is the question's start; the best is recorded in answer.tour
    }
    if (kind === "tspLower" || kind === "tspBounds") {
      // for both bounds the interval must be worth stating: not a sliver (a few units AND a few percent wide)
      const wide = (l: number) => upper === undefined || upper - l >= Math.max(3, Math.round(upper * 0.08));
      const cands = shuffle(ld.ids).filter((v) => lowerBound(ld, v).unique && wide(lowerBound(ld, v).lower));
      if (!cands.length) continue;
      deleted = cands[0];
      lower = lowerBound(ld, deleted).lower;
    }
    if (kind === "tspTable" && todo.length < 2) continue;

    return buildProblem(kind, network, ld, { starts, deleted, upper, lower, tour, todo, practical }, opts);
  }
  throw new Error(`tsp generator: no ${kind} question found at level ${level}`);
}

interface Built {
  starts: string[];
  deleted?: string;
  upper?: number;
  lower?: number;
  tour?: string[];
  todo: [string, string][];
  practical: boolean;
}

function buildProblem(kind: TspKind, network: Network, ld: LeastDistances, b: Built, opts: TspGenOptions): DecisionProblem {
  // a direct leg beaten by a detour means the weights are times or costs, not plain distances
  const beaten = network.edges.some((e) => ld.dist[e.from][e.to] < e.weight);
  // "holds" is the distance questions; "breaks" is times and costs; "either" offers a plain distance only when nothing is beaten
  const mode = opts.weights ?? "either";
  const ctx = pick(SETTINGS.filter((x) => (mode === "holds" ? x.distance : mode === "breaks" ? !x.distance : !x.distance || !beaten)));
  const inContext = opts.setting === "context";
  const complete = network.edges.length === (network.nodes.length * (network.nodes.length - 1)) / 2;
  const lead = inContext
    ? `${ctx.who} must visit each of ${network.nodes.length} ${ctx.what} once and return to the start, travelling ${complete ? "directly between any two of them" : "along the routes shown"} (the weights are ${ctx.measure}). `
    : "";
  const scale = " The diagram is not drawn to scale.";
  const tableFirst = b.practical && kind !== "tspTable" ? "Complete a table of least distances, then " : "";
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const pb = inContext ? "travelling salesperson problem" : "travelling salesperson problem";

  let prompt = "";
  let text = "";
  let value: number | undefined;
  const bounds = b.lower !== undefined || b.upper !== undefined ? { lower: b.lower, upper: b.upper } : undefined;

  if (kind === "tspTable") {
    prompt = `${lead}${b.todo.length > 1 ? "Some" : "One"} of the entries in the table of least distances ${b.todo.length > 1 ? "are" : "is"} not simply an edge of the network. Complete the table of least distances, giving the shortest route for each new entry.`;
    text = `Completed entries: ${b.todo.map(([x, y]) => `${x}${y} ${ld.dist[x][y]}`).join(", ")}.`;
    value = b.todo.length;
  } else if (kind === "tspNN") {
    const [s1, s2] = b.starts;
    const how = s2
      ? `use the nearest neighbour algorithm starting at ${s1}, and again starting at ${s2}, to find the better upper bound for the ${pb}`
      : `use the nearest neighbour algorithm starting at ${s1} to find an upper bound for the ${pb}`;
    prompt = lead + cap(tableFirst ? tableFirst + how : how) + "." + scale;
    const t = b.tour!;
    const route = expandRoute(ld, t);
    text = s2
      ? `Best upper bound ${b.upper}: ${t.join(" → ")}.`
      : `Tour ${t.join(" → ")}, length ${b.upper} (an upper bound).` + (b.practical && route.join("") !== t.join("") ? ` In the original network: ${route.join("–")}.` : "");
    value = b.upper;
  } else if (kind === "tspLower") {
    prompt = `${lead}${cap(tableFirst)}${tableFirst ? "find" : "Find"} a lower bound for the ${pb} by deleting vertex ${b.deleted}.${scale}`;
    const lbr = lowerBound(ld, b.deleted!);
    text = `Lower bound ${b.lower}: tree ${lbr.mst.map((e) => e.a + e.b).join(", ")} = ${lbr.mstTotal}, plus ${b.deleted}${lbr.links[0].to} and ${b.deleted}${lbr.links[1].to} = ${lbr.linksTotal}.`;
    value = b.lower;
  } else {
    const s = b.starts[0];
    prompt = `${lead}${cap(tableFirst)}${tableFirst ? "use" : "Use"} the nearest neighbour algorithm starting at ${s} to find an upper bound, and delete vertex ${b.deleted} to find a lower bound, for the ${pb}. Write down the interval that contains the length of the optimal tour.${scale}`;
    text = `${b.lower} ≤ optimal tour ≤ ${b.upper} (lower bound ${b.lower}; upper bound ${b.upper}).`;
    value = b.upper;
  }

  return {
    network,
    start: b.starts[0],
    kind,
    deleted: b.deleted,
    bounds,
    starts: b.starts,
    prompt,
    answer: { text, value, tour: b.tour },
    matrixMode: "question",
    ...(b.practical ? { complete: completeOf(network, ld) } : {}),
  };
}
