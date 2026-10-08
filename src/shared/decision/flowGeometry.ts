// ═══════════════════════════════════════════════════════════════════════════
// Where every label of a flow network sits — the single source for FlowView (which draws it) and the layout test
// (which measures it). Positions are fractions along an arc from its tail plus a side (see ArcLabelPos).
// ═══════════════════════════════════════════════════════════════════════════

import type { ArcLabelPos, FlowArc, FlowMode, FlowNet } from "./flow";

export interface Pt {
  x: number;
  y: number;
}

export const NODE_R = 22;
export const FLOW_R = 16; // radius of the circled flow
export const PILL_H = 24; // height of the "min, max" pill
export const SIDE_OFF = 20; // how far beside the arc the circled flow and the potential arrows sit
export const ARROW_BACK = 9; // a potential arrow runs from (centre − ARROW_BACK) to (centre + ARROW_FWD) along its direction
export const ARROW_FWD = 12;
export const NUM_GAP = 20; // its number sits this far beyond the arrow's centre

// ── exact distances between circles, rectangles and (thick) segments — used to place labels and to test the layout ──
export type Shape =
  | { k: "circle"; c: Pt; r: number }
  | { k: "rect"; x0: number; y0: number; x1: number; y1: number }
  | { k: "seg"; a: Pt; b: Pt; w: number };
type RectS = { x0: number; y0: number; x1: number; y1: number };
const pointSeg = (p: Pt, a: Pt, b: Pt) => {
  const vx = b.x - a.x, vy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / (vx * vx + vy * vy || 1)));
  return Math.hypot(p.x - (a.x + vx * t), p.y - (a.y + vy * t));
};
const pointRect = (p: Pt, r: RectS) => {
  const dx = Math.max(r.x0 - p.x, 0, p.x - r.x1), dy = Math.max(r.y0 - p.y, 0, p.y - r.y1);
  return dx === 0 && dy === 0 ? -Math.min(p.x - r.x0, r.x1 - p.x, p.y - r.y0, r.y1 - p.y) : Math.hypot(dx, dy);
};
const segSeg = (a: Pt, b: Pt, c: Pt, d: Pt) => {
  const cross = (o: Pt, p: Pt, q: Pt) => (p.x - o.x) * (q.y - o.y) - (p.y - o.y) * (q.x - o.x);
  if (cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0) return 0;
  return Math.min(pointSeg(a, c, d), pointSeg(b, c, d), pointSeg(c, a, b), pointSeg(d, a, b));
};
/** gap between two shapes (negative = overlapping) */
export const dist = (s: Shape, t: Shape): number => {
  if (s.k === "circle" && t.k === "circle") return Math.hypot(s.c.x - t.c.x, s.c.y - t.c.y) - s.r - t.r;
  if (s.k === "circle" && t.k === "rect") return pointRect(s.c, t) - s.r;
  if (s.k === "circle" && t.k === "seg") return pointSeg(s.c, t.a, t.b) - s.r - t.w / 2;
  if (s.k === "rect" && t.k === "rect") {
    const dx = Math.max(s.x0 - t.x1, t.x0 - s.x1), dy = Math.max(s.y0 - t.y1, t.y0 - s.y1);
    return dx < 0 && dy < 0 ? Math.max(dx, dy) : Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
  }
  if (s.k === "rect" && t.k === "seg") {
    let m = Infinity;
    for (let i = 0; i <= 20; i++) m = Math.min(m, pointRect({ x: t.a.x + ((t.b.x - t.a.x) * i) / 20, y: t.a.y + ((t.b.y - t.a.y) * i) / 20 }, s));
    return m - t.w / 2;
  }
  if (s.k === "seg" && t.k === "seg") return segSeg(s.a, s.b, t.a, t.b) - (s.w + t.w) / 2;
  return dist(t, s);
};
/** distance from a point to the segment a–b */
export const nearLine = pointSeg;
export const numberBox = (c: Pt, digits: number): Shape => ({ k: "rect", x0: c.x - (4.5 * digits + 2), y0: c.y - 9, x1: c.x + (4.5 * digits + 2), y1: c.y + 9 });
const digits = (n: number) => String(n).length;

const pillWidth = (text: string) => Math.max(25.5, text.length * 10.54 + 10);

export interface ArcGeometry {
  ux: number;
  uy: number;
  len: number;
  /** the drawn line, node edge to node edge */
  line: { a: Pt; b: Pt };
  boundsText: string;
  pill: { c: Pt; w: number; h: number };
  flowC: Pt;
  /** potential increase (along the arc) and decrease (against it): arrow end points and where the number is written */
  inc: { s0: Pt; e0: Pt; num: Pt };
  dec: { s0: Pt; e0: Pt; num: Pt };
  /** unit normal pointing to the "up" side of the arc (right of a vertical one) */
  normal: Pt;
  at: (t: number, off?: number) => Pt;
}

export function arcGeometry(net: FlowNet, arc: FlowArc, lp: ArcLabelPos, mode: FlowMode): ArcGeometry {
  const byId = new Map(net.nodes.map((n) => [n.id, n]));
  const p = byId.get(arc.from)!;
  const q = byId.get(arc.to)!;
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  let nx = -uy;
  let ny = ux;
  if (ny > 0 || (ny === 0 && nx < 0)) { nx = -nx; ny = -ny; }
  const at = (t: number, off = 0): Pt => ({ x: p.x + dx * t + nx * off, y: p.y + dy * t + ny * off });
  const boundsText = mode === "cap" ? `${arc.hi}` : `${arc.lo}, ${arc.hi}`;
  const arrowAt = (t: number, off: number, dir: 1 | -1) => {
    const c = at(t, lp.pot[1] * off);
    return {
      s0: { x: c.x - ux * ARROW_BACK * dir, y: c.y - uy * ARROW_BACK * dir },
      e0: { x: c.x + ux * ARROW_FWD * dir, y: c.y + uy * ARROW_FWD * dir },
      num: { x: c.x + ux * NUM_GAP * dir, y: c.y + uy * NUM_GAP * dir },
    };
  };
  const nodeShapes: Shape[] = net.nodes.map((n) => ({ k: "circle", c: { x: n.x, y: n.y }, r: NODE_R }));
  const pillW = pillWidth(boundsText);
  const pillAt = (t: number) => {
    const c = at(t);
    const shape: Shape = { k: "rect", x0: c.x - pillW / 2, y0: c.y - PILL_H / 2, x1: c.x + pillW / 2, y1: c.y + PILL_H / 2 };
    return { c, shape, gap: Math.min(...nodeShapes.map((n) => dist(shape, n))) };
  };
  // a wide "min, max" pill slides along its arc until it clears the vertices at both ends
  let pillBest = pillAt(lp.label);
  if (pillBest.gap < 3) {
    for (let k = 1; k <= 40 && pillBest.gap < 3; k++)
      for (const sgn of [1, -1]) {
        const t = lp.label + sgn * k * 0.012;
        if (t < 0.12 || t > 0.88) continue;
        const cand = pillAt(t);
        if (cand.gap > pillBest.gap) pillBest = cand;
      }
  }
  const pill = { c: pillBest.c, w: pillW, h: PILL_H };
  const pillShape: Shape = pillBest.shape;
  // The two potential arrows sit beside the arc at lp.pot; slide them along the arc (towards whichever way clears) until
  // neither the arrows nor their numbers touch this arc's bounds pill or any vertex.
  const size = { inc: digits(arc.hi), dec: digits(arc.hi) }; // the widest a potential can be is the bound itself
  const lineA = { a: { x: p.x + ux * NODE_R, y: p.y + uy * NODE_R }, b: { x: q.x - ux * (NODE_R + 2), y: q.y - uy * (NODE_R + 2) } };
  const otherLines = net.arcs.filter((x) => x.id !== arc.id).map((x) => {
    const f = byId.get(x.from)!, t2 = byId.get(x.to)!;
    const l = Math.hypot(t2.x - f.x, t2.y - f.y) || 1, vx = (t2.x - f.x) / l, vy = (t2.y - f.y) / l;
    return { a: { x: f.x + vx * NODE_R, y: f.y + vy * NODE_R }, b: { x: t2.x - vx * (NODE_R + 2), y: t2.y - vy * (NODE_R + 2) } };
  });
  /** how much nearer the point is to this arc than to the nearest other arc (a label must clearly belong to its own arc) */
  const ownership = (pt: Pt) => Math.min(Infinity, ...otherLines.map((l) => pointSeg(pt, l.a, l.b))) - pointSeg(pt, lineA.a, lineA.b);
  const OWN = 8, CLEARANCE = 3;
  const shapesAt = (t: number) => {
    const inc = arrowAt(t, SIDE_OFF, 1), dec = arrowAt(t, -SIDE_OFF, -1);
    const sh: Shape[] = [
      { k: "seg", a: inc.s0, b: inc.e0, w: 2.5 }, numberBox(inc.num, size.inc),
      { k: "seg", a: dec.s0, b: dec.e0, w: 2.5 }, numberBox(dec.num, size.dec),
    ];
    const marks = [inc.num, dec.num, { x: (inc.s0.x + inc.e0.x) / 2, y: (inc.s0.y + inc.e0.y) / 2 }, { x: (dec.s0.x + dec.e0.x) / 2, y: (dec.s0.y + dec.e0.y) / 2 }];
    const clear = Math.min(...sh.flatMap((x) => [pillShape, ...nodeShapes].map((y) => dist(x, y)))) - CLEARANCE;
    const own = Math.min(...marks.map(ownership)) - OWN;
    return { inc, dec, sh, score: Math.min(clear, own) };
  };
  let potT = lp.pot[0];
  let best = shapesAt(potT);
  for (let k = 1; k <= 45 && best.score < 0; k++)
    for (const sgn of [1, -1]) {
      const t = lp.pot[0] + sgn * k * 0.012;
      if (t < 0.1 || t > 0.9) continue;
      const cand = shapesAt(t);
      if (cand.score > best.score) { best = cand; potT = t; }
    }
  void potT;
  // the circled flow: slide along the arc (and try the other side) until it is clear of everything and clearly its own arc's
  const flowAtT = (t: number, side: 1 | -1) => {
    const c = at(t, SIDE_OFF * side);
    const sh: Shape = { k: "circle", c, r: FLOW_R };
    const clear = Math.min(...[pillShape, ...nodeShapes].map((y) => dist(sh, y))) - CLEARANCE;
    const own = ownership(c) - OWN;
    return { c, score: Math.min(clear, own) };
  };
  let flowBest = flowAtT(lp.flow[0], lp.flow[1]);
  for (let k = 1; k <= 45 && flowBest.score < 0; k++)
    for (const side of [lp.flow[1], (-lp.flow[1]) as 1 | -1])
      for (const sgn of [1, -1]) {
        const cand = flowAtT(lp.flow[0] + sgn * k * 0.012, side);
        if (cand.score > flowBest.score && lp.flow[0] + sgn * k * 0.012 > 0.1 && lp.flow[0] + sgn * k * 0.012 < 0.9) flowBest = cand;
      }
  return {
    ux, uy, len,
    line: { a: { x: p.x + ux * NODE_R, y: p.y + uy * NODE_R }, b: { x: q.x - ux * (NODE_R + 2), y: q.y - uy * (NODE_R + 2) } },
    boundsText,
    pill,
    flowC: flowBest.c,
    inc: best.inc,
    dec: best.dec,
    normal: { x: nx, y: ny },
    at,
  };
}
