// Graphical linear programming (Decision Maths DD2): the maths core, with no React. See specs/linear-programming-graphical.md (sections 3, 6, 8).
// Two variables, whole-number coefficients, exact fractions for every vertex. It reuses `vertices`, `bestVertices` and `opHolds` of lp.ts rather than
// rewriting them; this file adds what drawing needs: the ordered polygon, whether the region is enclosed (so R is written in it), the side to shade out,
// the sliding objective line, and the whole-number points around an optimum. x ≥ 0 and y ≥ 0 are always part of the region.
import { fr, fadd, fsub, fmul, fdiv, feq, fint, ZERO, ONE, type Fr } from "./dim";
import { type Op, opHolds, vertices as lpVertices, bestVertices as lpBest } from "./lp";

/** one constraint a·x + b·y (op) c, whole numbers; a vertical line has b = 0 and a horizontal line has a = 0 */
export interface GLine { a: number; b: number; op: Op; c: number }
export type Pt = readonly [Fr, Fr];
export type Sense = "max" | "min";
export interface Objective { p: number; q: number; sense: Sense }

const val = (l: GLine, p: Pt): Fr => fadd(fmul(fr(l.a), p[0]), fmul(fr(l.b), p[1]));
const cmp = (a: Fr, b: Fr): number => a[0] * b[1] - b[0] * a[1];
export const toNum = (f: Fr): number => f[0] / f[1];
export const ptKey = (p: Pt): string => `${p[0][0]}/${p[0][1]},${p[1][0]}/${p[1][1]}`;

/** does the point satisfy the line's inequality exactly (a strict operator excludes its boundary)? */
export const lineHolds = (l: GLine, p: Pt): boolean => opHolds(val(l, p), l.op, fr(l.c));
/** the point is in the region: every constraint and x ≥ 0, y ≥ 0 */
export const inRegion = (ls: readonly GLine[], p: Pt): boolean => cmp(p[0], ZERO) >= 0 && cmp(p[1], ZERO) >= 0 && ls.every((l) => lineHolds(l, p));
export const isStrictLine = (l: GLine): boolean => l.op === "<" || l.op === ">";
/** the axes as constraints, for the picture (never drawn as boundary labels) */
export const AXES: readonly GLine[] = [{ a: 1, b: 0, op: "≥", c: 0 }, { a: 0, b: 1, op: "≥", c: 0 }];

/** the corner points of the region, in order round it (anticlockwise from the lowest left); a strict boundary counts as its closure */
export function regionVertices(ls: readonly GLine[]): Pt[] {
  const vs = lpVertices(ls.map((l) => ({ coeffs: [fr(l.a), fr(l.b)], op: l.op, rhs: fr(l.c) })), 2).map((v): Pt => [v[0], v[1]]);
  if (vs.length < 3) return vs;
  const cx = vs.reduce((s, v) => s + toNum(v[0]), 0) / vs.length;
  const cy = vs.reduce((s, v) => s + toNum(v[1]), 0) / vs.length;
  return vs.sort((u, v) => Math.atan2(toNum(u[1]) - cy, toNum(u[0]) - cx) - Math.atan2(toNum(v[1]) - cy, toNum(v[0]) - cx));
}

/** the region has an interior (it is not empty, a point or a line segment) */
export const hasInterior = (ls: readonly GLine[]): boolean => {
  const vs = regionVertices(ls);
  if (vs.length < 3) return false;
  const [o, ...rest] = vs;
  return rest.some((u, i) => rest.slice(i + 1).some((w) => cross(o, u, w)[0] !== 0));
};
const cross = (o: Pt, u: Pt, w: Pt): Fr => fsub(fmul(fsub(u[0], o[0]), fsub(w[1], o[1])), fmul(fsub(u[1], o[1]), fsub(w[0], o[0])));

/** the region is enclosed (R is written in it): no direction d ≠ 0 with d ≥ 0 and every constraint's left side not moving towards the open side */
export function isEnclosed(ls: readonly GLine[]): boolean {
  const dirs: Array<[number, number]> = [[1, 0], [0, 1]];
  for (const l of ls) { dirs.push([l.b, -l.a], [-l.b, l.a]); }
  const ok = (d: [number, number]): boolean => {
    if (d[0] < 0 || d[1] < 0 || (d[0] === 0 && d[1] === 0)) return false;
    return ls.every((l) => {
      const m = l.a * d[0] + l.b * d[1];
      return l.op === "≤" || l.op === "<" ? m <= 0 : l.op === "≥" || l.op === ">" ? m >= 0 : m === 0;
    });
  };
  return !dirs.some(ok);
}

/** a point to test which side of a line to shade out: (0, 0) unless the line passes through it, then a point clear of the line (never on it) */
export function testPoint(l: GLine): { at: Pt; holds: boolean } {
  const candidates: Pt[] = [[ZERO, ZERO], [ONE, ZERO], [ZERO, ONE], [ONE, ONE], [fr(2), ONE], [ONE, fr(2)]];
  const at = candidates.find((p) => cmp(val(l, p), fr(l.c)) !== 0) as Pt;
  return { at, holds: lineHolds(l, at) };
}
/** the axis crossings of a line (null where it is parallel to the axis), as exact fractions */
export const intercepts = (l: GLine): { x: Fr | null; y: Fr | null } => ({ x: l.a === 0 ? null : fr(l.c, l.a), y: l.b === 0 ? null : fr(l.c, l.b) });

// ── the objective ────────────────────────────────────────────────────────────
export const objValue = (o: Objective, p: Pt): Fr => fadd(fmul(fr(o.p), p[0]), fmul(fr(o.q), p[1]));
/** the best corner(s): more than one means a tie along an edge, which the generator never builds */
export const bestCorners = (vs: readonly Pt[], o: Objective): { value: Fr; at: Pt[] } | null => {
  const r = lpBest(vs.map((v) => [v[0], v[1]]), [fr(o.p), fr(o.q)], o.sense);
  return r ? { value: r.value, at: r.at.map((v): Pt => [v[0], v[1]]) } : null;
};
/** every corner with its objective value, in the order of the polygon (the vertex table) */
export const vertexTable = (vs: readonly Pt[], o: Objective): Array<{ at: Pt; value: Fr }> => vs.map((v) => ({ at: v, value: objValue(o, v) }));
/** the objective line px + qy = k: its two axis crossings */
export const objectiveLine = (o: Objective, k: Fr): { x: Fr | null; y: Fr | null } => ({ x: o.p === 0 ? null : fdiv(k, fr(o.p)), y: o.q === 0 ? null : fdiv(k, fr(o.q)) });
/** the objective is never parallel to a boundary of the region: a tie along an edge is impossible */
export const notParallelToAnEdge = (ls: readonly GLine[], o: Objective): boolean => [...ls, ...AXES].every((l) => l.a * o.q - l.b * o.p !== 0);

// ── whole-number points ──────────────────────────────────────────────────────
/** every whole-number point in the region (the region must be enclosed) */
export function latticePoints(ls: readonly GLine[]): Pt[] {
  const vs = regionVertices(ls);
  const xs = vs.map((v) => toNum(v[0])), ys = vs.map((v) => toNum(v[1]));
  const out: Pt[] = [];
  for (let x = 0; x <= Math.ceil(Math.max(...xs)); x++) for (let y = 0; y <= Math.ceil(Math.max(...ys)); y++) {
    const p: Pt = [fr(x), fr(y)];
    if (inRegion(ls, p)) out.push(p);
  }
  return out;
}
/** the four whole points around a point: both floors and ceilings (fewer when a coordinate is whole), each with whether it is in the region */
export function surroundingPoints(ls: readonly GLine[], at: Pt): Array<{ at: Pt; feasible: boolean }> {
  const f = (v: Fr): number[] => (fint(v) ? [v[0]] : [Math.floor(v[0] / v[1]), Math.ceil(v[0] / v[1])]);
  const out: Array<{ at: Pt; feasible: boolean }> = [];
  for (const x of f(at[0])) for (const y of f(at[1])) { const p: Pt = [fr(x), fr(y)]; out.push({ at: p, feasible: inRegion(ls, p) }); }
  return out;
}
/** the whole point nearest to the point (each coordinate rounded, a half rounding up), with its feasibility */
export const nearestWhole = (ls: readonly GLine[], at: Pt): { at: Pt; feasible: boolean } => {
  const r = (v: Fr): number => Math.floor((2 * v[0] + v[1]) / (2 * v[1]));
  const p: Pt = [fr(r(at[0])), fr(r(at[1]))];
  return { at: p, feasible: inRegion(ls, p) };
};
/** the best whole point(s), searched over every whole point in the region (brute force: the independent route) */
export function bestWhole(ls: readonly GLine[], o: Objective): { value: Fr; at: Pt[] } | null {
  const pts = latticePoints(ls);
  if (!pts.length) return null;
  let value = objValue(o, pts[0]);
  let at: Pt[] = [];
  for (const p of pts) {
    const v = objValue(o, p), k = cmp(v, value);
    if (!at.length || (o.sense === "max" ? k > 0 : k < 0)) { value = v; at = [p]; } else if (k === 0) at.push(p);
  }
  return { value, at };
}
/** the best of the four surrounding whole points that are in the region (the textbook's method) */
export function bestAmongSurrounding(ls: readonly GLine[], at: Pt, o: Objective): { value: Fr; at: Pt[] } | null {
  const feas = surroundingPoints(ls, at).filter((s) => s.feasible).map((s) => s.at);
  if (!feas.length) return null;
  const r = lpBest(feas.map((p) => [p[0], p[1]]), [fr(o.p), fr(o.q)], o.sense);
  return r ? { value: r.value, at: r.at.map((v): Pt => [v[0], v[1]]) } : null;
}
/** the table of the greatest feasible y for each whole x (for a maximising objective with positive q), with the value there */
export function greatestYTable(ls: readonly GLine[], o: Objective): Array<{ x: number; y: number; value: Fr }> {
  const pts = latticePoints(ls);
  const best = new Map<number, number>();
  for (const p of pts) best.set(p[0][0], Math.max(best.get(p[0][0]) ?? -1, p[1][0]));
  return [...best.entries()].sort((u, v) => u[0] - v[0]).map(([x, y]) => ({ x, y, value: objValue(o, [fr(x), fr(y)]) }));
}
export const ptEq = (u: Pt, v: Pt): boolean => feq(u[0], v[0]) && feq(u[1], v[1]);

/** the constraint-count rule: at most four constraints (five when the extra one is a bound), at most three sloped (ax ± by with both non-zero) */
export function countsOk(ls: readonly GLine[]): boolean {
  const bounds = ls.filter((l) => l.a === 0 || l.b === 0);
  const sloped = ls.length - bounds.length;
  return sloped <= 3 && (ls.length <= 4 || (ls.length === 5 && bounds.length >= 1));
}
