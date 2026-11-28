// The geometry the region picture is drawn from (no React): the window, half-planes clipped to it, a line's visible segment, and the text of a constraint
// and of a coordinate. Floating point is fine here (it is only drawing); every number the student reads comes from the exact maths of lpGraph.ts.
import { type Fr } from "./dim";
import { type GLine, type Pt, regionVertices, toNum } from "./lpGraph";

export interface GWin { xMax: number; yMax: number; step: number }
export type XY = readonly [number, number];

/** the window from the origin to a little beyond every intercept and corner: the same for every step of a question, so the picture never resizes (R32) */
export function graphWindow(lines: readonly GLine[], extra: readonly Pt[] = []): GWin {
  const xs: number[] = [1], ys: number[] = [1];
  for (const l of lines) {
    if (l.a !== 0) xs.push(Math.abs(l.c / l.a));
    if (l.b !== 0) ys.push(Math.abs(l.c / l.b));
  }
  for (const v of [...regionVertices(lines), ...extra]) { xs.push(toNum(v[0])); ys.push(toNum(v[1])); }
  const top = Math.max(Math.max(...xs), Math.max(...ys));
  const step = top <= 10 ? 1 : top <= 24 ? 2 : top <= 60 ? 5 : 10;
  const up = (m: number) => step * Math.max(3, Math.ceil((m * 1.12) / step));
  return { xMax: up(Math.max(...xs)), yMax: up(Math.max(...ys)), step };
}

/** clip a polygon to one side of the line a·x + b·y = c: keep where a·x + b·y ≥ c ("ge") or ≤ c ("le") */
export function clipPoly(poly: readonly XY[], l: Pick<GLine, "a" | "b" | "c">, keep: "ge" | "le"): XY[] {
  const s = keep === "ge" ? 1 : -1;
  const f = (p: XY) => s * (l.a * p[0] + l.b * p[1] - l.c);
  const out: XY[] = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    const fp = f(p), fq = f(q);
    if (fp >= 0) out.push(p);
    if ((fp > 0 && fq < 0) || (fp < 0 && fq > 0)) { const t = fp / (fp - fq); out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]); }
  }
  return out;
}
const rect = (w: GWin): XY[] => [[0, 0], [w.xMax, 0], [w.xMax, w.yMax], [0, w.yMax]];
const failsSide = (l: GLine): "ge" | "le" => (l.op === "≤" || l.op === "<" ? "ge" : "le");
/** the part of the window the constraint rules out (the side to shade out) */
export const unwantedPolygon = (l: GLine, w: GWin): XY[] => clipPoly(rect(w), l, failsSide(l));
/** the part of the window inside every constraint (the region, clipped to the window when it is open) */
export const regionPolygon = (ls: readonly GLine[], w: GWin): XY[] =>
  ls.reduce<XY[]>((poly, l) => (poly.length ? clipPoly(poly, l, failsSide(l) === "ge" ? "le" : "ge") : poly), rect(w));
export const polyArea = (p: readonly XY[]): number => Math.abs(p.reduce((s, q, i) => s + q[0] * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * q[1], 0)) / 2;

/** the visible part of the line a·x + b·y = c inside the window, or null */
export function lineSegment(l: Pick<GLine, "a" | "b" | "c">, w: GWin): [XY, XY] | null {
  const pts: XY[] = [];
  const add = (x: number, y: number) => { if (x >= -1e-9 && x <= w.xMax + 1e-9 && y >= -1e-9 && y <= w.yMax + 1e-9 && !pts.some((p) => Math.hypot(p[0] - x, p[1] - y) < 1e-9)) pts.push([x, y]); };
  if (l.a !== 0) { add(l.c / l.a, 0); add((l.c - l.b * w.yMax) / l.a, w.yMax); }
  if (l.b !== 0) { add(0, l.c / l.b); add(w.xMax, (l.c - l.a * w.xMax) / l.b); }
  return pts.length >= 2 ? [pts[0], pts[1]] : null;
}

/** an exact coordinate as a reader writes it: whole, a short decimal, or a fraction */
export function fmtFr(f: Fr): string {
  if (f[1] === 1) return String(f[0]);
  let d = f[1];
  while (d % 2 === 0) d /= 2;
  while (d % 5 === 0) d /= 5;
  return d === 1 ? String(+(f[0] / f[1]).toFixed(4)) : `${f[0]}/${f[1]}`;
}
export const fmtPt = (p: Pt): string => `(${fmtFr(p[0])}, ${fmtFr(p[1])})`;
const term = (k: number, v: string, first: boolean): string => {
  if (k === 0) return "";
  const abs = Math.abs(k) === 1 ? "" : String(Math.abs(k));
  return `${k < 0 ? (first ? "−" : " − ") : first ? "" : " + "}${abs}${v}`;
};
/** the constraint as written on the picture: 2x + 3y ≤ 12 */
export const constraintText = (l: GLine): string => `${term(l.a, "x", true)}${term(l.b, "y", l.a === 0)} ${l.op} ${l.c}`;
