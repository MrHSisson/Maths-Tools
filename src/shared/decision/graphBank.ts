// ═══════════════════════════════════════════════════════════════════════════
// The graph bank — hand-authored, display-optimised UNDIRECTED graphs for every Decision tool that draws a network
// (Minimum Spanning Tree, Travelling Salesperson, the sandbox, and whatever comes next: Dijkstra, route inspection…).
//
//   • Vertex positions are authored (clean, no crossings except where declared); weight-label positions are OPTIMISED once and
//     baked (graphBankLabels.generated.ts — run `npx vitest run src/tests/graphBank.test.ts -t bake` after editing a graph),
//     so a drawing never searches for a layout at run time and every drawing of a bank graph is identical and known-good.
//   • `?` marks an OPTIONAL edge: each question includes it by a coin flip, so one layout gives many networks. The mandatory
//     edges alone always connect every vertex.
//   • The nine Network Flows shapes are in the bank too (diamond, fan, ladder, hexagon, tower, big network…), read as
//     undirected graphs — the same pictures students already know. New shapes below are chosen for what the tools need:
//     wheels and fans (a hub with real Prim / Kruskal choices), prisms and cubes (cycles to reject), grids, strips, and the
//     complete graphs K4–K6 for the travelling salesperson problem.
//   • A sampled graph is also mirrored left↔right and / or top↔bottom at random and its vertices re-lettered in reading order
//     (A, B, C… left to right), which multiplies the variety without touching the layout quality.
// Tests: graphBank.test.ts measures every drawing independently (clearances, crossings, connectivity, spacing).
// ═══════════════════════════════════════════════════════════════════════════

import { FLOW_TEMPLATES } from "./flowTemplates";
import { BANK_LABELS } from "./graphBankLabels.generated";
import { crossingPairs } from "./graphBankLayout";
import type { GEdge, GNode, Network } from "./types";

export interface BankEdge {
  id: string; // the two vertex letters, alphabetical ("AB")
  a: string;
  b: string;
  /** where the weight label sits, as a fraction along the edge from a to b — baked by optimiseLabels */
  at: number;
  optional: boolean;
}

export type BankKind = "planar" | "crossing" | "complete";

export interface BankGraph {
  id: string;
  name: string;
  kind: BankKind;
  size: number;
  nodes: GNode[]; // lettered A, B, … in reading order (left to right)
  edges: BankEdge[];
  /** edges that deliberately cross (everything else must not) */
  crossings: Array<[string, string]>;
}

const LETTERS = "ABCDEFGHIJ";

// ── authoring helpers ─────────────────────────────────────────────────────────
type Raw = { nodes: Record<string, [number, number]>; edges: string };

const ring = (cx: number, cy: number, r: number, n: number, startDeg = -90): Array<[number, number]> =>
  Array.from({ length: n }, (_, i) => {
    const a = ((startDeg + (360 * i) / n) * Math.PI) / 180;
    return [Math.round(cx + r * Math.cos(a)), Math.round(cy + r * Math.sin(a))];
  });

const rimNodes = (cx: number, cy: number, r: number, n: number, withHub: boolean, startDeg = -90): Raw["nodes"] => {
  const pts = ring(cx, cy, r, n, startDeg);
  const out: Raw["nodes"] = {};
  pts.forEach((p, i) => (out[`r${i + 1}`] = p));
  if (withHub) out.h = [cx, cy];
  return out;
};
/** "r1-r2 r2-r3 …" closing the rim */
const rimEdges = (n: number, optional = false) => Array.from({ length: n }, (_, i) => `r${i + 1}-r${((i + 1) % n) + 1}${optional ? "?" : ""}`).join(" ");
/** spokes from the hub: r1 and r3 are always drawn (the hub is never isolated), the rest are optional */
const spokes = (n: number) => Array.from({ length: n }, (_, i) => `h-r${i + 1}${i === 0 || i === 2 ? "" : "?"}`).join(" ");

/** Rename vertices to A, B, C… in reading order (x, then y) and return the lettered graph. */
function lettered(id: string, name: string, kind: BankKind, raw: Raw, crossingRaw: Array<[string, string]> = []): BankGraph {
  const ids = Object.keys(raw.nodes).sort((p, q) => raw.nodes[p][0] - raw.nodes[q][0] || raw.nodes[p][1] - raw.nodes[q][1]);
  const letter = Object.fromEntries(ids.map((v, i) => [v, LETTERS[i]]));
  const nodes: GNode[] = ids.map((v) => ({ id: letter[v], x: raw.nodes[v][0], y: raw.nodes[v][1] }));
  const edges: BankEdge[] = raw.edges.trim().split(/\s+/).map((tok) => {
    const optional = tok.endsWith("?");
    const [p, q] = tok.replace("?", "").split("-");
    const [a, b] = [letter[p], letter[q]];
    const flip = a > b; // ids are alphabetical; a flipped edge runs the other way along the same line
    const ea = flip ? b : a, eb = flip ? a : b;
    return { id: ea + eb, a: ea, b: eb, at: 0.5, optional };
  });
  const crossings = crossingRaw.map(([p, q]) => {
    const name2 = (e: string) => { const [x, y] = e.split("-"); const l = [letter[x], letter[y]].sort(); return l.join(""); };
    return [name2(p), name2(q)] as [string, string];
  });
  const baked = (BANK_LABELS as Record<string, Record<string, number>>)[id] ?? {};
  // a baked position is stored for the edge as authored (a→b alphabetical after lettering), so it needs no flipping here
  for (const e of edges) if (baked[e.id] !== undefined) e.at = baked[e.id];
  return { id, name, kind, size: nodes.length, nodes, edges, crossings };
}

/** Network Flows shapes, read as undirected graphs (S and T become ordinary letters). */
function fromFlow(t: (typeof FLOW_TEMPLATES)[number]): BankGraph {
  const raw: Raw = { nodes: Object.fromEntries(t.nodes.map((n) => [n.id, [n.x, n.y] as [number, number]])), edges: t.arcs.map((a) => `${a.from}-${a.to}${a.optional ? "?" : ""}`).join(" ") };
  return lettered(`flow-${t.id}`, t.name, t.crossings?.length ? "crossing" : "planar", raw, (t.crossings ?? []).map(([p, q]) => [`${p[0]}-${p[1]}`, `${q[0]}-${q[1]}`] as [string, string]));
}

// ── the new graphs ────────────────────────────────────────────────────────────
// Every coordinate pair is in the same board units as the flow shapes (a vertex is 22 across; edges are at least ~130 long).
const NEW: BankGraph[] = [
  // 5 vertices
  lettered("pentagon-chords", "Pentagon with chords", "planar", { nodes: rimNodes(350, 250, 210, 5, false), edges: `${rimEdges(5)} r1-r3? r1-r4?` }),
  lettered("wheel4", "Wheel (4 rim)", "planar", { nodes: rimNodes(350, 250, 200, 4, true), edges: `${rimEdges(4)} ${spokes(4)}` }),
  lettered("house", "House", "planar", {
    nodes: { apex: [350, 30], tl: [150, 230], tr: [550, 230], bl: [150, 430], br: [550, 430] },
    edges: "apex-tl apex-tr tl-bl tr-br bl-br tl-tr? tl-br?",
  }),
  // 6 vertices
  lettered("wheel5", "Wheel (5 rim)", "planar", { nodes: rimNodes(350, 250, 205, 5, true), edges: `${rimEdges(5)} ${spokes(5)}` }),
  lettered("prism", "Prism", "planar", {
    nodes: { o1: [350, 40], o2: [60, 430], o3: [640, 430], i1: [350, 190], i2: [210, 360], i3: [490, 360] },
    edges: "o1-o2 o2-o3 o3-o1 o1-i1 o2-i2 o3-i3 i1-i2? i2-i3? i3-i1?",
  }),
  lettered("hexagon-fan", "Hexagon with chords", "planar", { nodes: rimNodes(350, 250, 200, 6, false, -120), edges: `${rimEdges(6)} r1-r3? r1-r4? r1-r5?` }),
  lettered("grid-2x3", "Grid (2 × 3)", "planar", {
    nodes: { a: [70, 110], b: [350, 110], c: [630, 110], d: [70, 350], e: [350, 350], f: [630, 350] },
    edges: "a-b b-c c-f f-e e-d d-a b-e? a-e? b-f?",
  }),
  // 7 vertices
  lettered("wheel6", "Wheel (6 rim)", "planar", { nodes: rimNodes(350, 250, 210, 6, true, -120), edges: `${rimEdges(6)} ${spokes(6)}` }),
  lettered("heptagon-fan", "Heptagon with chords", "planar", { nodes: rimNodes(350, 250, 215, 7, false), edges: `${rimEdges(7)} r1-r3? r1-r4? r1-r5? r1-r6?` }),
  lettered("strip7", "Triangle strip", "planar", {
    nodes: { s1: [40, 380], s2: [190, 100], s3: [340, 380], s4: [490, 100], s5: [640, 380], s6: [790, 100], s7: [940, 380] },
    edges: "s1-s2 s2-s3 s3-s4 s4-s5 s5-s6 s6-s7 s1-s3? s2-s4? s3-s5? s4-s6? s5-s7?",
  }),
  // 8 vertices
  lettered("cube", "Cube", "planar", {
    nodes: { o1: [60, 40], o2: [640, 40], o3: [640, 440], o4: [60, 440], i1: [230, 170], i2: [470, 170], i3: [470, 310], i4: [230, 310] },
    edges: "o1-o2 o2-o3 o3-o4 o4-o1 i1-i2? i2-i3? i3-i4? i4-i1? o1-i1 o2-i2 o3-i3 o4-i4",
  }),
  lettered("wheel7", "Wheel (7 rim)", "planar", { nodes: rimNodes(350, 250, 215, 7, true), edges: `${rimEdges(7)} ${spokes(7)}` }),
  lettered("grid-2x4", "Grid (2 × 4)", "planar", {
    nodes: { a: [60, 110], b: [270, 110], c: [480, 110], d: [690, 110], e: [60, 350], f: [270, 350], g: [480, 350], h: [690, 350] },
    edges: "a-b b-c c-d d-h h-g g-f f-e e-a b-f? c-g? a-f? c-h?",
  }),
  // the complete graphs (the travelling salesperson problem): all edges are mandatory, so the drawing is fixed
  lettered("k4", "K4", "complete", {
    nodes: { t: [350, 30], l: [90, 430], r: [610, 430], c: [350, 290] },
    edges: "t-l t-r l-r t-c l-c r-c",
  }),
  lettered("k5", "K5", "crossing", { nodes: rimNodes(350, 250, 215, 5, false), edges: "r1-r2 r2-r3 r3-r4 r4-r5 r5-r1 r1-r3 r1-r4 r2-r4 r2-r5 r3-r5" }),
  lettered("k6", "K6", "crossing", {
    nodes: rimNodes(350, 250, 225, 6, false, -120),
    edges: "r1-r2 r2-r3 r3-r4 r4-r5 r5-r6 r6-r1 r1-r3 r1-r4 r1-r5 r2-r4 r2-r5 r2-r6 r3-r5 r3-r6 r4-r6",
  }),
];

export const GRAPH_BANK: BankGraph[] = [...FLOW_TEMPLATES.map(fromFlow), ...NEW].map((g) => {
  // declare the crossings that really exist (read off the geometry), so a flow shape's declared crossings and the K5 / K6 star are exact
  const real = crossingPairs(g.nodes, g.edges);
  return { ...g, crossings: g.kind === "planar" ? [] : real };
});

export const bankGraph = (id: string): BankGraph => {
  const g = GRAPH_BANK.find((x) => x.id === id);
  if (!g) throw new Error(`graph bank: no graph "${id}"`);
  return g;
};

// ── sampling ──────────────────────────────────────────────────────────────────
export interface SampleOptions {
  /** vertex count, or an inclusive range */
  size?: number | [number, number];
  /** only these graphs (default: the whole bank) */
  ids?: string[];
  exclude?: string[];
  kinds?: BankKind[];
  /** keep the sampled network's edge count within this range (default: no limit) */
  edges?: [number, number];
  /** chance each optional edge is drawn (default 0.5) */
  optionalChance?: number;
}

const rnd = (n: number) => Math.floor(Math.random() * n);
const pickOne = <T,>(a: T[]): T => a[rnd(a.length)];

export function bankCandidates(o: SampleOptions): BankGraph[] {
  const [lo, hi] = o.size === undefined ? [0, 99] : typeof o.size === "number" ? [o.size, o.size] : o.size;
  return GRAPH_BANK.filter(
    (g) => g.size >= lo && g.size <= hi && (!o.ids || o.ids.includes(g.id)) && !o.exclude?.includes(g.id) && (!o.kinds || o.kinds.includes(g.kind)),
  );
}

/** Mirror a bank graph (and re-letter it in reading order). `at` is a fraction a→b, so an edge whose ends swap alphabetical order flips it. */
export function mirrored(g: BankGraph, flipX: boolean, flipY: boolean): BankGraph {
  if (!flipX && !flipY) return g;
  const xs = g.nodes.map((n) => n.x), ys = g.nodes.map((n) => n.y);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const moved = g.nodes.map((n) => ({ id: n.id, x: flipX ? x0 + x1 - n.x : n.x, y: flipY ? y0 + y1 - n.y : n.y }));
  const order = [...moved].sort((p, q) => p.x - q.x || p.y - q.y);
  const letter = Object.fromEntries(order.map((n, i) => [n.id, LETTERS[i]]));
  const nodes: GNode[] = order.map((n) => ({ id: letter[n.id], x: n.x, y: n.y }));
  const edges: BankEdge[] = g.edges.map((e) => {
    const [a, b] = [letter[e.a], letter[e.b]];
    const swap = a > b;
    return { id: swap ? b + a : a + b, a: swap ? b : a, b: swap ? a : b, at: swap ? 1 - e.at : e.at, optional: e.optional };
  });
  const cross = g.crossings.map(([p, q]) => {
    const nm = (id: string) => [letter[id[0]], letter[id[1]]].sort().join("");
    return [nm(p), nm(q)] as [string, string];
  });
  return { ...g, nodes, edges, crossings: cross };
}

function connected(nodes: GNode[], edges: Array<{ a: string; b: string }>): boolean {
  const seen = new Set([nodes[0].id]);
  for (let grew = true; grew; ) {
    grew = false;
    for (const e of edges) if (seen.has(e.a) !== seen.has(e.b)) { seen.add(e.a); seen.add(e.b); grew = true; }
  }
  return seen.size === nodes.length;
}

/**
 * A concrete network from the bank: a random graph that fits `opts`, randomly mirrored, optional edges flipped in or out
 * (the result is always connected and within `opts.edges`). Weights are 0 — the tool fills them in. `labelAt` is the baked,
 * optimised label position of every edge, and `bankId` records where the drawing came from.
 */
export function sampleBankGraph(opts: SampleOptions = {}): Network & { bankId: string } {
  const pool = bankCandidates(opts);
  if (!pool.length) throw new Error("graph bank: nothing matches " + JSON.stringify(opts));
  const chance = opts.optionalChance ?? 0.5;
  for (let attempt = 0; attempt < 500; attempt++) {
    const g = mirrored(pickOne(pool), Math.random() < 0.5, Math.random() < 0.5);
    const edges = g.edges.filter((e) => !e.optional || Math.random() < chance);
    if (opts.edges && (edges.length < opts.edges[0] || edges.length > opts.edges[1])) continue;
    if (!connected(g.nodes, edges)) continue;
    const gEdges: GEdge[] = edges.map((e) => ({ id: e.id, from: e.a, to: e.b, weight: 0, labelAt: e.at }));
    return { nodes: g.nodes.map((n) => ({ ...n })), edges: gEdges, bankId: g.id };
  }
  throw new Error("graph bank: could not sample a graph for " + JSON.stringify(opts));
}
