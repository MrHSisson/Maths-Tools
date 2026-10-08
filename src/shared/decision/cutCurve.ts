// ═══════════════════════════════════════════════════════════════════════════
// The dashed cut line. A cut is a set of nodes (the S side); the line is the zero
// contour of a smooth "which side am I nearest" field over the diagram, traced with
// marching squares — so it works for ANY cut (including ones that loop round a node),
// always separates the two sides, and the ticks sit exactly where it crosses each cut arc.
// Pure geometry (no React); FlowView draws the result.
// ═══════════════════════════════════════════════════════════════════════════

import type { FlowNet } from "./flow";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const NODE_R = 22;

/** The framed area of a network diagram (nodes plus room for labels). */
export function flowBox(net: FlowNet): Box {
  const xs = net.nodes.map((n) => n.x);
  const ys = net.nodes.map((n) => n.y);
  const pad = NODE_R + 34;
  return {
    x: Math.min(...xs) - pad,
    y: Math.min(...ys) - pad,
    w: Math.max(...xs) - Math.min(...xs) + pad * 2,
    h: Math.max(...ys) - Math.min(...ys) + pad * 2,
  };
}

export interface CutGeometry {
  paths: string[]; // SVG path data, one per contour piece
  ticks: Record<string, { x: number; y: number }>; // arcId → where the line crosses it
}

// A wider blend (SIGMA) gives a smoother, rounder line; the widest value that still separates every node is used.
const SIGMAS = [100, 80, 62, 48, 36];
const STEP = 6;

/** The single dashed line for a cut, or null when the cut cannot be drawn as one unbroken line that crosses exactly its arcs. */
export function cutGeometry(net: FlowNet, sSide: string[], arcIds: string[], box: Box = flowBox(net)): CutGeometry | null {
  for (const sigma of SIGMAS) {
    const g = tryCut(net, sSide, arcIds, box, sigma);
    if (g) return g;
  }
  return null;
}

function tryCut(net: FlowNet, sSide: string[], arcIds: string[], box: Box, SIGMA: number): CutGeometry | null {
  const side = new Set(sSide);
  const field = (x: number, y: number): number => {
    let min = Infinity;
    for (const n of net.nodes) min = Math.min(min, (n.x - x) ** 2 + (n.y - y) ** 2);
    let num = 0;
    let den = 0;
    for (const n of net.nodes) {
      const w = Math.exp(-((n.x - x) ** 2 + (n.y - y) ** 2 - min) / (2 * SIGMA * SIGMA));
      num += (side.has(n.id) ? 1 : -1) * w;
      den += w;
    }
    return num / den;
  };
  // the field must agree with the cut at every node, or the line would not separate them
  for (const n of net.nodes) if ((field(n.x, n.y) > 0) !== side.has(n.id)) return null;

  const cols = Math.ceil(box.w / STEP) + 1;
  const rows = Math.ceil(box.h / STEP) + 1;
  const v: number[][] = [];
  for (let j = 0; j < rows; j++) {
    const row: number[] = [];
    for (let i = 0; i < cols; i++) row.push(field(box.x + i * STEP, box.y + j * STEP));
    v.push(row);
  }

  // marching squares — every crossed grid edge becomes a point (keyed so neighbouring cells share it)
  const pts = new Map<string, { x: number; y: number }>();
  const adj = new Map<string, string[]>();
  const edgePoint = (id: string, i0: number, j0: number, i1: number, j1: number) => {
    if (!pts.has(id)) {
      const a = v[j0][i0];
      const b = v[j1][i1];
      const t = a / (a - b);
      pts.set(id, { x: box.x + (i0 + (i1 - i0) * t) * STEP, y: box.y + (j0 + (j1 - j0) * t) * STEP });
    }
    return id;
  };
  const link = (p: string, q: string) => {
    adj.set(p, [...(adj.get(p) ?? []), q]);
    adj.set(q, [...(adj.get(q) ?? []), p]);
  };
  for (let j = 0; j < rows - 1; j++)
    for (let i = 0; i < cols - 1; i++) {
      const c00 = v[j][i] > 0;
      const c10 = v[j][i + 1] > 0;
      const c11 = v[j + 1][i + 1] > 0;
      const c01 = v[j + 1][i] > 0;
      const cross: string[] = [];
      if (c00 !== c10) cross.push(edgePoint(`h${i},${j}`, i, j, i + 1, j)); // top
      if (c10 !== c11) cross.push(edgePoint(`v${i + 1},${j}`, i + 1, j, i + 1, j + 1)); // right
      if (c01 !== c11) cross.push(edgePoint(`h${i},${j + 1}`, i, j + 1, i + 1, j + 1)); // bottom
      if (c00 !== c01) cross.push(edgePoint(`v${i},${j}`, i, j, i, j + 1)); // left
      if (cross.length === 2) link(cross[0], cross[1]);
      else if (cross.length === 4) {
        // saddle: pair by the cell centre
        const centre = (v[j][i] + v[j][i + 1] + v[j + 1][i + 1] + v[j + 1][i]) / 4 > 0;
        if (centre === c00) { link(cross[0], cross[3]); link(cross[1], cross[2]); } else { link(cross[0], cross[1]); link(cross[2], cross[3]); }
      }
    }

  // chain the pieces into polylines: open curves first (they start at a degree-1 point), then loops
  const seen = new Set<string>();
  const paths: string[] = [];
  const walk = (start: string) => {
    const out: string[] = [];
    let prev: string | null = null;
    let cur: string | null = start;
    while (cur && !seen.has(cur)) {
      seen.add(cur);
      out.push(cur);
      const next: string | undefined = (adj.get(cur) ?? []).find((n) => n !== prev && !seen.has(n));
      prev = cur;
      cur = next ?? null;
    }
    if (out.length > 1) paths.push(out.map((id, k) => `${k === 0 ? "M" : "L"} ${pts.get(id)!.x.toFixed(1)} ${pts.get(id)!.y.toFixed(1)}`).join(" "));
  };
  for (const [id, nb] of adj) if (nb.length === 1) walk(id);
  for (const id of adj.keys()) walk(id);
  // A proper cut line is ONE unbroken line that crosses every cut arc exactly once and no other arc.
  if (paths.length !== 1) return null;
  const byNode = new Map(net.nodes.map((n) => [n.id, n]));
  const cutIds = new Set(arcIds);
  for (const arc of net.arcs) {
    const p = byNode.get(arc.from)!;
    const q = byNode.get(arc.to)!;
    let changes = 0;
    let prev = field(p.x, p.y) > 0;
    for (let k = 1; k <= 80; k++) {
      const t = k / 80;
      const cur = field(p.x + (q.x - p.x) * t, p.y + (q.y - p.y) * t) > 0;
      if (cur !== prev) changes++;
      prev = cur;
    }
    if (changes !== (cutIds.has(arc.id) ? 1 : 0)) return null;
  }

  // where the line crosses each cut arc (first sign change from the tail)
  const byId = new Map(net.nodes.map((n) => [n.id, n]));
  const ticks: CutGeometry["ticks"] = {};
  for (const id of arcIds) {
    const arc = net.arcs.find((a) => a.id === id);
    if (!arc) continue;
    const p = byId.get(arc.from)!;
    const q = byId.get(arc.to)!;
    const at = (t: number) => field(p.x + (q.x - p.x) * t, p.y + (q.y - p.y) * t);
    let lo = 0;
    let hi = 1;
    const s0 = at(0) > 0;
    let found = false;
    for (let k = 1; k <= 40; k++) {
      const t = k / 40;
      if ((at(t) > 0) !== s0) { hi = t; lo = (k - 1) / 40; found = true; break; }
    }
    if (found) for (let k = 0; k < 18; k++) { const m = (lo + hi) / 2; if ((at(m) > 0) === s0) lo = m; else hi = m; }
    const t = found ? (lo + hi) / 2 : 0.5;
    ticks[id] = { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t };
  }
  return { paths, ticks };
}
