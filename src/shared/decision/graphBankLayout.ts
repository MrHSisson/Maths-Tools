// ═══════════════════════════════════════════════════════════════════════════
// Graph bank — where the weight labels go (pure geometry, no React).
//
// A bank graph's vertices are authored; its weight labels are OPTIMISED once, offline (`optimiseLabels`) and baked into
// graphBankLabels.generated.ts, so a question never searches for a layout at run time and every drawing of a bank graph is
// identical and known-good. `measureLabels` re-measures a baked layout independently (graphBank.test.ts), so a drawing that
// drifts out of tolerance fails CI.
//
// What a label must clear (every edge of the graph present — the worst case; optional edges only ever remove clutter):
//   • every vertex, and the corner where NetworkView writes a vertex's badge (visit order, deleted…);
//   • every OTHER edge's line (a weight must clearly belong to its own edge) and every other weight label;
//   • the numbered badge NetworkView pins to a chosen edge's label (Kruskal / Prim order).
// Shapes and distances come from flowGeometry.ts, the same code that lays out the Network Flows labels.
// ═══════════════════════════════════════════════════════════════════════════

import { NODE_R, dist, type Shape } from "./flowGeometry";
import type { GNode } from "./types";

export const LABEL_W = 26; // the weight pill NetworkView draws
export const LABEL_H = 22;
export const BADGE_R = 10; // the edge-order badge on the pill's top-right corner
export const BADGE_DX = 15;
export const BADGE_DY = -15;

export interface LayoutEdge {
  id: string;
  a: string;
  b: string;
}

const pillAt = (x: number, y: number): Shape => ({ k: "rect", x0: x - LABEL_W / 2, y0: y - LABEL_H / 2, x1: x + LABEL_W / 2, y1: y + LABEL_H / 2 });
const badgeAt = (x: number, y: number): Shape => ({ k: "circle", c: { x: x + BADGE_DX, y: y + BADGE_DY }, r: BADGE_R });
/** the corner NetworkView writes a vertex's badge in (top-right shoulder): visit order, labels, … */
const nodeBadge = (n: GNode): Shape => ({ k: "rect", x0: n.x + NODE_R * 0.55, y0: n.y - NODE_R * 1.45, x1: n.x + NODE_R * 0.55 + 28, y1: n.y - NODE_R * 1.45 + 22 });

export interface PlacedLabel {
  id: string;
  /** fraction along the edge from a to b */
  at: number;
  pill: Shape;
  badge: Shape;
}

function geometry(nodes: GNode[], edges: LayoutEdge[]) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const lines = edges.map((e) => {
    const p = byId.get(e.a)!, q = byId.get(e.b)!;
    const len = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    const ux = (q.x - p.x) / len, uy = (q.y - p.y) / len;
    return { id: e.id, p, q, a: { x: p.x + ux * NODE_R, y: p.y + uy * NODE_R }, b: { x: q.x - ux * NODE_R, y: q.y - uy * NODE_R } };
  });
  const nodeShapes: Shape[] = nodes.map((n) => ({ k: "circle", c: { x: n.x, y: n.y }, r: NODE_R }));
  const badgeShapes: Shape[] = nodes.map(nodeBadge);
  return { lines, nodeShapes, badgeShapes };
}

/** how clear label `mine` is of everything it must avoid (negative = touching) */
function clearances(
  mine: PlacedLabel,
  g: ReturnType<typeof geometry>,
  others: PlacedLabel[],
): { pill: number; badge: number } {
  const lineObs: Shape[] = g.lines.filter((l) => l.id !== mine.id).map((l) => ({ k: "seg", a: l.a, b: l.b, w: 3 }));
  const pillObs = [...g.nodeShapes, ...g.badgeShapes, ...lineObs, ...others.flatMap((o) => [o.pill, o.badge])];
  const badgeObs = [...g.nodeShapes, ...g.badgeShapes, ...others.flatMap((o) => [o.pill, o.badge])];
  return {
    pill: Math.min(...pillObs.map((o) => dist(mine.pill, o))),
    badge: Math.min(...badgeObs.map((o) => dist(mine.badge, o))),
  };
}

const placed = (g: ReturnType<typeof geometry>, id: string, t: number): PlacedLabel => {
  const l = g.lines.find((x) => x.id === id)!;
  const x = l.p.x + (l.q.x - l.p.x) * t, y = l.p.y + (l.q.y - l.p.y) * t;
  return { id, at: t, pill: pillAt(x, y), badge: badgeAt(x, y) };
};

/**
 * Choose `at` for every edge: coordinate descent over candidate positions, each scored by how clear the weight pill (and its
 * order badge) is of everything else — a little pull towards the middle of the edge breaks ties. Deterministic.
 */
export function optimiseLabels(nodes: GNode[], edges: LayoutEdge[], passes = 8): Record<string, number> {
  const g = geometry(nodes, edges);
  const cur = new Map<string, PlacedLabel>(edges.map((e) => [e.id, placed(g, e.id, 0.5)]));
  const candidates: number[] = [];
  for (let t = 0.16; t <= 0.841; t += 0.01) candidates.push(Math.round(t * 100) / 100);
  for (let pass = 0; pass < passes; pass++) {
    let moved = false;
    for (const e of edges) {
      const others = [...cur.values()].filter((o) => o.id !== e.id);
      let best = cur.get(e.id)!, bestScore = -Infinity;
      for (const t of candidates) {
        const cand = placed(g, e.id, t);
        const c = clearances(cand, g, others);
        const score = Math.min(c.pill, 14, c.badge + 5) - 4 * Math.abs(t - 0.5);
        if (score > bestScore + 1e-9) { bestScore = score; best = cand; }
      }
      if (best.at !== cur.get(e.id)!.at) moved = true;
      cur.set(e.id, best);
    }
    if (!moved) break;
  }
  return Object.fromEntries(edges.map((e) => [e.id, cur.get(e.id)!.at]));
}

export interface LabelReport {
  id: string;
  at: number;
  pill: number; // clearance of the weight pill
  badge: number; // clearance of the order badge
}

/** Independent measurement of a baked layout: the clearance of every pill and badge. */
export function measureLabels(nodes: GNode[], edges: LayoutEdge[], at: Record<string, number>): LabelReport[] {
  const g = geometry(nodes, edges);
  const all = edges.map((e) => placed(g, e.id, at[e.id]));
  return all.map((p) => {
    const c = clearances(p, g, all.filter((o) => o.id !== p.id));
    return { id: p.id, at: p.at, pill: c.pill, badge: c.badge };
  });
}

/** every pair of edges that actually cross (not at a shared vertex), by an independent orientation test */
export function crossingPairs(nodes: GNode[], edges: LayoutEdge[]): Array<[string, string]> {
  const at = new Map(nodes.map((n) => [n.id, n]));
  const ccw = (a: GNode, b: GNode, c: GNode) => (c.y - a.y) * (b.x - a.x) - (b.y - a.y) * (c.x - a.x);
  const out: Array<[string, string]> = [];
  for (let i = 0; i < edges.length; i++)
    for (let j = i + 1; j < edges.length; j++) {
      const e = edges[i], f = edges[j];
      if (e.a === f.a || e.a === f.b || e.b === f.a || e.b === f.b) continue;
      const a = at.get(e.a)!, b = at.get(e.b)!, c = at.get(f.a)!, d = at.get(f.b)!;
      if (ccw(a, c, d) * ccw(b, c, d) < 0 && ccw(a, b, c) * ccw(a, b, d) < 0) out.push([e.id, f.id]);
    }
  return out;
}
