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

import { generateRandomNetwork } from "./randomNetwork";
import { completeNetworkLayout, leastDistances, nearestNeighbour, placeEdgeLabels, type LeastDistances } from "./tsp";
import { lowerBound } from "./tspBounds";
import type { DecisionProblem, Network } from "./types";

export type TspKind = "tspNN" | "tspLower" | "tspBounds" | "tspTable";
export interface TspGenOptions {
  starts: 1 | 2; // nearest neighbour from one start vertex or two (best upper bound)
  setting: "plain" | "context";
}

const randInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

export const pairKey = (a: string, b: string) => (a < b ? `${a}${b}` : `${b}${a}`);

// Weights roughly to scale with the drawing (±15%), so the picture never lies about which vertex is nearer.
function scaledWeight(net: Network, from: string, to: string): number {
  const a = net.nodes.find((n) => n.id === from)!;
  const b = net.nodes.find((n) => n.id === to)!;
  return Math.max(3, Math.round((Math.hypot(a.x - b.x, a.y - b.y) / 20) * (0.85 + Math.random() * 0.3)));
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
// A complete network's weights are DIFFERENT whole numbers from 16 to 31. Any two of them add to more than the largest, so the
// triangle inequality holds strictly (no table entry ever needs replacing) and no two distances tie (so no nearest-neighbour choice and
// no spanning tree is ambiguous). They are deliberately NOT scaled to the drawing: drawn to scale, a ring of five or six towns makes the
// optimal tour, the nearest-neighbour tour and the lower bound all coincide, and there is no interval to find.
function completeNetwork(n: number): Network {
  const net = completeNetworkLayout(n);
  const pool = shuffle(Array.from({ length: 16 }, (_, i) => 16 + i));
  net.edges.forEach((e, i) => (e.weight = pool[i]));
  return net;
}

function practicalNetwork(n: number, shortcut: boolean, minMissing: number, tries = 600): Network | null {
  for (let t = 0; t < tries; t++) {
    const net = generateRandomNetwork({ nodeCount: n, weightRange: [1, 1], maxDegree: 4 });
    const missing = (n * (n - 1)) / 2 - net.edges.length;
    if (missing < minMissing || missing > 6) continue; // enough to complete, not a slog
    for (const e of net.edges) e.weight = scaledWeight(net, e.from, e.to);
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
    const labels = placeEdgeLabels(net);
    if (!labels) continue;
    for (const e of net.edges) e.labelAt = labels[e.id];
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
    const network = level === 1 && kind !== "tspTable" ? completeNetwork(n) : practicalNetwork(n, level === 3, 2);
    if (!network) continue;
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
  const ctx = pick(SETTINGS);
  const inContext = opts.setting === "context";
  const lead = inContext
    ? `${ctx.who} must visit each of ${network.nodes.length} ${ctx.what}, travelling ${b.practical ? "along the roads shown (the weights are distances in " + ctx.unit + ")" : "directly between any two of them (the weights are distances in " + ctx.unit + ")"}, and return to the start. `
    : "";
  const scale = !b.practical && kind !== "tspTable" ? " The diagram is not drawn to scale." : "";
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
  };
}
