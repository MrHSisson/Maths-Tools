// The Simplex Algorithm, whole numbers ("is it practical?"): when the optimum of the linear programme has a fraction in it but only whole numbers make sense, the
// best practical plan is found from the whole-number points around the optimum. Standard form only (maximise, every constraint ≤, whole-number coefficients).
// The bound: a practical plan is also a plan of the linear programme, so its objective is at most the optimum; and with whole-number coefficients it is a whole
// number, so at most the greatest whole number below the optimum. A feasible point that reaches that bound is the best practical plan, with nothing more to check.
import { type Fr } from "./dim";
import { type SxSpec, type Run, readTab } from "./lpSimplex";

interface Cand { pt: number[]; lhs: number[]; ok: boolean; p: number }
export interface Whole {
  /** the optimum of the linear programme and its value */
  x: Fr[];
  p: Fr;
  /** the greatest whole number not above the optimum value */
  bound: number;
  /** the variables whose optimal value has a fraction in it */
  frac: number[];
  /** the whole-number points around the optimum (each fractional variable rounded down or up), in order */
  cands: Cand[];
  best: Cand;
  down: Cand;
  /** every variable rounded to the nearest whole number */
  nearest: Cand;
}

const floorFr = (f: Fr): number => Math.floor(f[0] / f[1]);
export function wholeAnalysis(spec: SxSpec, run: Run): Whole {
  const n = spec.c.length;
  const rd = readTab(run.final);
  const x = rd.values.slice(0, n);
  const frac = x.map((v, j) => (v[1] === 1 ? -1 : j)).filter((j) => j >= 0);
  const lo = x.map(floorFr);
  const mk = (pt: number[]): Cand => {
    const lhs = spec.cons.map((k) => k.a.reduce((t, v, j) => t + v * pt[j], 0));
    return { pt, lhs, ok: spec.cons.every((k, i) => lhs[i] <= k.b), p: spec.c.reduce((t, v, j) => t + v * pt[j], 0) };
  };
  let pts: number[][] = [lo];
  for (const j of frac) pts = pts.flatMap((q) => [q, q.map((v, i) => (i === j ? v + 1 : v))]);
  const cands = pts.map(mk);
  const feasible = cands.filter((c) => c.ok);
  const best = feasible.reduce((b, c) => (c.p > b.p ? c : b), feasible[0] ?? cands[0]);
  const nearest = mk(x.map((v) => Math.floor((2 * v[0] + v[1]) / (2 * v[1]))));
  return { x, p: rd.p, bound: floorFr(rd.p), frac, cands, best, down: cands[0], nearest };
}

/** whether a problem makes a good whole-number question at a level: a fraction in the optimum, a practical plan that reaches the bound, something to rule out,
 *  and from Level 2 a best plan that is not just everything rounded down, and at Level 3 a nearest rounding that is not allowed */
export function wholeNice(w: Whole, level: number): boolean {
  if (!w.frac.length || w.p[1] === 1) return false;
  if (!w.best.ok || w.best.p !== w.bound) return false;
  if (!w.cands.some((c) => !c.ok)) return false;
  if (level >= 2 && w.best.pt.join() === w.down.pt.join()) return false;
  if (level >= 3 && w.nearest.ok) return false;
  return true;
}
