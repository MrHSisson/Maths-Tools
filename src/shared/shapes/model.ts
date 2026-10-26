// Perimeter & Area — the one geometry model. A shape is a list of closed polygons (the outline first, then any holes) in
// grid units, y up. Edges, perimeter, area and the bounding box are all DERIVED from it, so a picture, an answer and the
// working can never disagree about a length.

export type Pt = [number, number];

export const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);
export const dist = (a: Pt, b: Pt): number => Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) * 1000) / 1000;

export const edgeLengths = (poly: Pt[]): number[] => poly.map((p, i) => dist(p, poly[(i + 1) % poly.length]));

const signedArea = (poly: Pt[]): number =>
  poly.reduce((s, p, i) => { const q = poly[(i + 1) % poly.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;

/** Outline area minus the area of every hole. */
export const areaOf = (polys: Pt[][]): number =>
  Math.round((Math.abs(signedArea(polys[0])) - sum(polys.slice(1).map((h) => Math.abs(signedArea(h))))) * 1000) / 1000;

/** Length all the way round: the outline plus the edge of every hole. */
export const perimeterOf = (polys: Pt[][]): number => Math.round(sum(polys.flatMap(edgeLengths)) * 1000) / 1000;

export interface Box { x0: number; y0: number; x1: number; y1: number }
export const boxOf = (polys: Pt[][]): Box => {
  const all = polys.flat();
  return { x0: Math.min(...all.map((p) => p[0])), y0: Math.min(...all.map((p) => p[1])), x1: Math.max(...all.map((p) => p[0])), y1: Math.max(...all.map((p) => p[1])) };
};

/** Outline counter-clockwise, holes clockwise (y up). */
export const orient = (polys: Pt[][]): Pt[][] =>
  polys.map((p, i) => ((signedArea(p) > 0) === (i === 0) ? p : [...p].reverse() as Pt[]));

/** One of the eight turns and flips of the square, then moved so the shape starts at the origin. */
export const dihedral = (polys: Pt[][], t: number): Pt[][] => {
  const f = ([x, y]: Pt): Pt => {
    let a = x, b = y;
    if (t & 1) a = -a;
    if (t & 2) [a, b] = [b, a];
    if (t & 4) b = -b;
    return [a, b];
  };
  const moved = polys.map((p) => p.map(f));
  const box = boxOf(moved);
  return orient(moved.map((p) => p.map(([x, y]) => [x - box.x0, y - box.y0] as Pt)));
};

/** Even-odd test: is the point in the filled part of the shape (inside the outline, outside the holes)? */
export const insideShape = (x: number, y: number, polys: Pt[][]): boolean => {
  let inside = false;
  for (const poly of polys) {
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
};

export interface Rect { x0: number; y0: number; x1: number; y1: number }
export const rectArea = (r: Rect): number => (r.x1 - r.x0) * (r.y1 - r.y0);

/** Intervals of x that are filled (or, with `filled` false, empty inside the bounding box) along a horizontal line at height y. */
const crossings = (polys: Pt[][], y: number, box: Box, filled: boolean): [number, number][] => {
  const xs: number[] = [];
  for (const poly of polys) {
    poly.forEach((p, i) => {
      const q = poly[(i + 1) % poly.length];
      if (p[0] === q[0] && Math.min(p[1], q[1]) < y && y < Math.max(p[1], q[1])) xs.push(p[0]);
    });
  }
  xs.sort((a, b) => a - b);
  const on: [number, number][] = [];
  for (let i = 0; i + 1 < xs.length; i += 2) on.push([xs[i], xs[i + 1]]);
  if (filled) return on;
  const off: [number, number][] = [];
  let at = box.x0;
  for (const [a, b] of on) { if (a > at) off.push([at, a]); at = b; }
  if (at < box.x1) off.push([at, box.x1]);
  return off;
};

/** Horizontal bands across a rectilinear shape, merged downwards into as few rectangles as it takes. */
const bands = (polys: Pt[][], filled: boolean): Rect[] => {
  const box = boxOf(polys);
  const ys = [...new Set(polys.flat().map((p) => p[1]))].sort((a, b) => a - b);
  const out: Rect[] = [];
  for (let i = 0; i + 1 < ys.length; i++) {
    for (const [a, b] of crossings(polys, (ys[i] + ys[i + 1]) / 2, box, filled)) {
      const same = out.find((r) => r.x0 === a && r.x1 === b && r.y1 === ys[i]);
      if (same) same.y1 = ys[i + 1]; else out.push({ x0: a, x1: b, y0: ys[i], y1: ys[i + 1] });
    }
  }
  return out;
};
/** The shape cut into rectangles. */
export const splitRects = (polys: Pt[][]): Rect[] => bands(polys, true);
/** The rectangles that are missing from the bounding box (the parts to take away). */
export const cutRects = (polys: Pt[][]): Rect[] => bands(polys, false);

/** Unit-height rows of a shape on a grid: each row's filled intervals. */
export const gridRows = (polys: Pt[][]): { y: number; spans: [number, number][] }[] => {
  const box = boxOf(polys);
  const rows: { y: number; spans: [number, number][] }[] = [];
  for (let y = box.y0; y < box.y1; y++) rows.push({ y, spans: crossings(polys, y + 0.5, box, true) });
  return rows;
};

/** Which side of the shape an outline edge is on, going anticlockwise: right-going edges are along the bottom, and so on. */
export const sideOf = (a: Pt, b: Pt): "bottom" | "top" | "right" | "left" =>
  a[1] === b[1] ? (b[0] > a[0] ? "bottom" : "top") : (b[1] > a[1] ? "right" : "left");
export const OPPOSITE = { bottom: "top", top: "bottom", left: "right", right: "left" } as const;
