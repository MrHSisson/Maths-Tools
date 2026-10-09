// ═══════════════════════════════════════════════════════════════════════════
// Travelling salesperson — question generation (no React).
//
//   Level 1  a complete network (K4–K6) that already satisfies the triangle inequality — go straight to the algorithm;
//   Level 2  a practical network (not every pair joined): complete the table of least distances first;
//   Level 3  as Level 2, but one direct edge is NOT the shortest way between its ends (a detour beats it).
//
// Question kinds: tspNN (nearest-neighbour upper bound, from one start or two), tspLower (deleted-vertex lower bound),
// tspBounds (both, then the interval the optimal tour lies in) and tspTable (just the table of least distances).
// Every question is unambiguous: every nearest-neighbour choice is tie-free, every shortest route that matters is unique,
// and the lower bound's tree and links are the only possible ones (see tspBounds.ts). validate.ts re-derives all of it.
// ═══════════════════════════════════════════════════════════════════════════

import { sampleBankGraph } from "./graphBank";
import { givenDistances, leastDistances, nearestNeighbour, type LeastDistances } from "./tsp";
import { lowerBound } from "./tspBounds";
import type { DecisionProblem, Network } from "./types";

export type TspKind = "tspNN" | "tspLower" | "tspBounds" | "tspTable";
export interface TspGenOptions {
  starts: 1 | 2; // nearest neighbour from one start vertex or two (best upper bound)
  setting: "plain" | "context";
  /** Level 1 (a complete network): does the triangle inequality hold? "either" (default) draws both. A table of least distances always satisfies it. */
  triangle?: "holds" | "fails" | "either";
}

const randInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

export const pairKey = (a: string, b: string) => (a < b ? `${a}${b}` : `${b}${a}`);

/** Does every triangle satisfy w(a,c) ≤ w(a,b) + w(b,c)? (Only meaningful for a complete network.) */
export function satisfiesTriangle(net: Network): boolean {
  const w: Record<string, number> = {};
  for (const e of net.edges) w[pairKey(e.from, e.to)] = e.weight;
  const ids = net.nodes.map((n) => n.id);
  for (const a of ids) for (const b of ids) for (const c of ids)
    if (a !== b && b !== c && a !== c && w[pairKey(a, c)] > w[pairKey(a, b)] + w[pairKey(b, c)]) return false;
  return true;
}

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

/** The tour as actually driven in the drawn network — each leg replaced by its shortest route. */
export function expandRoute(ld: LeastDistances, tour: string[]): string[] {
  const out = [tour[0]];
  for (let i = 1; i < tour.length; i++) out.push(...ld.path[tour[i - 1]][tour[i]].slice(1));
  return out;
}

// ── the networks ─────────────────────────────────────────────────────────────
// The vertex count is chosen FIRST and held while a network is searched for: otherwise the easier sizes win the retry loop
// (a 4-vertex complete network satisfies the triangle inequality far more often than a 6-vertex one) and the larger ones almost never appear.
// A complete network's weights are DIFFERENT whole numbers, so no two distances tie (no nearest-neighbour choice and no spanning tree is
// ambiguous). They are deliberately NOT scaled to the drawing: drawn to scale, a ring of five or six towns makes the optimal tour, the
// nearest-neighbour tour and the lower bound all coincide, and there is no interval to find.
//   • triangle inequality HOLDS: 16–31 — any two add to more than the largest, so it holds strictly (a distance table);
//   • triangle inequality FAILS: 5–45 with at least one triangle where a direct leg is longer than going round (journey times: a direct
//     flight or a congested road can take longer than two short hops). The nearest-neighbour and deleted-vertex bounds still work: neither
//     method needs the inequality, only a complete table.
function completeNetwork(n: number, metric: boolean): Network {
  for (let t = 0; t < 400; t++) {
    const net: Network = sampleBankGraph({ use: "tspComplete", ids: [`k${n}`] });
    const pool = metric ? shuffle(Array.from({ length: 16 }, (_, i) => 16 + i)) : shuffle(Array.from({ length: 41 }, (_, i) => 5 + i));
    net.edges.forEach((e, i) => (e.weight = pool[i]));
    if (metric || !satisfiesTriangle(net)) return net;
  }
  throw new Error("tsp generator: no non-metric complete network found");
}

function practicalNetwork(n: number, shortcut: boolean, minMissing: number, tries = 600): Network | null {
  for (let t = 0; t < tries; t++) {
    // a practical network: any bank graph with n vertices that is not complete (its optional edges vary from question to question)
    const sampled = sampleBankGraph({ use: "tspPractical", size: n });
    const net: Network = { nodes: sampled.nodes, edges: sampled.edges };
    const missing = (n * (n - 1)) / 2 - net.edges.length;
    if (missing < minMissing || missing > 6) continue; // enough to complete, not a slog
    // different whole numbers, NOT scaled to the drawing: drawn to scale, the nearest neighbour just walks round the outside and
    // the tour is obvious from the picture
    const pool = shuffle(Array.from({ length: 27 }, (_, i) => 4 + i));
    net.edges.forEach((e, i) => (e.weight = pool[i]));
    if (shortcut) {
      // lengthen one non-bridge edge so a detour beats it (a road over a hill)
      const cand = shuffle(net.edges).find((e) => leastDistances({ ...net, edges: net.edges.filter((x) => x.id !== e.id) }).dist[e.from][e.to] < Infinity);
      if (!cand) continue;
      const without = { ...net, edges: net.edges.filter((x) => x.id !== cand.id) };
      cand.weight = leastDistances(without).dist[cand.from][cand.to] + randInt(2, 6);
    }
    const ld = leastDistances(net);
    if (net.edges.filter((e) => ld.dist[e.from][e.to] < e.weight).length !== (shortcut ? 1 : 0)) continue;
    if (pairsToComplete(ld).some(([a, b]) => !ld.unique[a][b])) continue; // one clear route for each entry
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
const SETTINGS = [
  { who: "A delivery driver", what: "depots", unit: "km" },
  { who: "A sales representative", what: "towns", unit: "miles" },
  { who: "An engineer", what: "wind-farm sites", unit: "km" },
  { who: "A tourist", what: "landmarks", unit: "km" },
  { who: "A surveyor", what: "monitoring stations", unit: "miles" },
];

export function generateTsp(level: 1 | 2 | 3, kind: TspKind, opts: TspGenOptions): DecisionProblem {
  for (let attempt = 0; attempt < 400; attempt++) {
    // the table question is about incomplete networks, so even Level 1 is a (small) practical network
    const n = pick(SIZES[kind].filter((m) => level < 3 || m >= 5));
    const metric = opts.triangle === "holds" ? true : opts.triangle === "fails" ? false : Math.random() < 0.5;
    const network = level === 1 && kind !== "tspTable" ? completeNetwork(n, metric) : practicalNetwork(n, level === 3, 2);
    if (!network) continue;
    // a complete table that breaks the triangle inequality is the data as given: nothing in it is replaced by a shorter route
    const given = level === 1 && kind !== "tspTable" && !satisfiesTriangle(network);
    const ld = given ? givenDistances(network) : leastDistances(network);
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

    return buildProblem(kind, network, ld, { starts, deleted, upper, lower, tour, todo, practical }, opts, given);
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

function buildProblem(kind: TspKind, network: Network, ld: LeastDistances, b: Built, opts: TspGenOptions, given: boolean): DecisionProblem {
  const ctx = pick(SETTINGS);
  const inContext = opts.setting === "context";
  // a complete table that breaks the triangle inequality is a table of journey TIMES (a direct leg can be slower than going round)
  const times = !b.practical && !satisfiesTriangle(network);
  const lead = inContext
    ? `${ctx.who} must visit each of ${network.nodes.length} ${ctx.what}, travelling ${b.practical ? "along the roads shown (the weights are distances in " + ctx.unit + ")" : times ? "directly between any two of them (the weights are journey times in minutes)" : "directly between any two of them (the weights are distances in " + ctx.unit + ")"}, and return to the start. `
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
    ...(given ? { givenTable: true } : {}),
  };
}
