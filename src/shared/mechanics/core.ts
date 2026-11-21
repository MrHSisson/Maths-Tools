// The mechanics core: pure maths for the Further Mechanics generators, with no React. Units and conversions, g, the work formulae, rounding to
// significant figures, and the small calculus (an antiderivative and an independent numerical integral) the Variable Force questions need.
// Plan: specs/further-mechanics-mc.md §4.1. Every function here has its own check in src/tests/workDone.test.ts, and the generators' answers are
// re-derived from the SHOWN givens by a different route there (R5, §4.7).
import { texNumber } from "../math";

// ── constants and units ────────────────────────────────────────────────────────────────────────────────────────────

export type GValue = 9.8 | 10;
/** Exact conversions to SI: what you multiply by to get kg, m, N, J, W, s. */
const TO_SI = { kg: 1, g: 0.001, tonne: 1000, m: 1, km: 1000, cm: 0.01, N: 1, kN: 1000, MN: 1e6, J: 1, kJ: 1000, MJ: 1e6, W: 1, kW: 1000, MW: 1e6, s: 1 } as const;
export type Unit = keyof typeof TO_SI;
export const toSI = (value: number, unit: Unit): number => value * TO_SI[unit];
export const fromSI = (value: number, unit: Unit): number => value / TO_SI[unit];

// ── rounding and writing numbers ───────────────────────────────────────────────────────────────────────────────────

/** Round to n significant figures (a number). */
export const sig = (x: number, n = 3): number => (x === 0 ? 0 : Number(x.toPrecision(n)));

const grouped = (s: string): string => {
  const [whole, frac] = s.split(".");
  const g = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return frac === undefined ? g : `${g}.${frac}`;
};

/** Plain text of x to n significant figures, trailing zeros kept after a decimal point ("1.50"), thin-space thousands ("1 470 000"). */
export function sfText(x: number, n = 3): string {
  const r = sig(x, n);
  if (Math.abs(r) >= 1e21 || (r !== 0 && Math.abs(r) < 1e-6)) return r.toExponential(n - 1);
  if (Math.abs(r) >= 10 ** (n - 1) || Number.isInteger(r)) return grouped(String(r));
  const dp = Math.max(0, n - 1 - Math.floor(Math.log10(Math.abs(r))));
  return grouped(r.toFixed(dp));
}
/** The same for KaTeX: thousands as `{,}`. */
export const sfTex = (x: number, n = 3): string => sfText(x, n).replace(/ /g, "{,}");
/** An exact value (an integer or a short decimal, as it is in the working) written for KaTeX with thousands separators. */
export const numTex = (x: number): string => texNumber(Number(x.toPrecision(12)));
/** An exact value as plain text for a question's prose. */
export const numText = (x: number): string => grouped(String(Number(x.toPrecision(12))));

// ── the formulae ───────────────────────────────────────────────────────────────────────────────────────────────────

export const radians = (deg: number): number => (deg * Math.PI) / 180;
export const degrees = (rad: number): number => (rad * 180) / Math.PI;

/** Work done by a constant force F (N) over a distance d (m) at an angle θ (degrees) to the motion. */
export const work = (F: number, d: number, thetaDeg = 0): number => F * d * Math.cos(radians(thetaDeg));
/** Work done against (or by) gravity: m g h. */
export const gravityWork = (m: number, h: number, g: GValue): number => m * g * h;
/** The height gained over a distance d along a slope at α degrees to the horizontal. */
export const slopeHeight = (d: number, alphaDeg: number): number => d * Math.sin(radians(alphaDeg));
/** Kinetic energy, ½ m v². */
export const kineticEnergy = (m: number, v: number): number => 0.5 * m * v * v;
export const speedFromKE = (m: number, ke: number): number => Math.sqrt((2 * ke) / m);
/** Average power, work ÷ time. */
export const averagePower = (W: number, t: number): number => W / t;

// ── a force that varies with distance ──────────────────────────────────────────────────────────────────────────────

/** One term of f(x): `pow` is c·x^p, `sin` / `cos` are c·sin(kx) / c·cos(kx) (k = 1 unless given). */
export type ForceTerm =
  | { kind: "pow"; c: number; p: number }
  | { kind: "sin" | "cos"; c: number; k: number };

const termValue = (t: ForceTerm, x: number): number => (t.kind === "pow" ? t.c * x ** t.p : t.kind === "sin" ? t.c * Math.sin(t.k * x) : t.c * Math.cos(t.k * x));
export const forceAt = (terms: ForceTerm[], x: number): number => terms.reduce((s, t) => s + termValue(t, x), 0);

/** The antiderivative at x, term by term (c/x gives c ln x; the constant of integration is dropped). */
export function antiderivative(terms: ForceTerm[], x: number): number {
  return terms.reduce((s, t) => {
    if (t.kind === "pow") return s + (t.p === -1 ? t.c * Math.log(x) : (t.c * x ** (t.p + 1)) / (t.p + 1));
    if (t.kind === "sin") return s - (t.c / t.k) * Math.cos(t.k * x);
    return s + (t.c / t.k) * Math.sin(t.k * x);
  }, 0);
}
/** ∫ₐᵇ f dx exactly (by the antiderivative). */
export const integrate = (terms: ForceTerm[], a: number, b: number): number => antiderivative(terms, b) - antiderivative(terms, a);
/** ∫ₐᵇ f dx by Simpson's rule: the independent route the tests use. */
export function integrateNumerically(f: (x: number) => number, a: number, b: number, n = 2000): number {
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 === 0 ? 2 : 4);
  return (s * h) / 3;
}
/** The root of g between lo and hi by bisection (g(lo) and g(hi) of opposite sign): the solver the validators use for "find the limit". */
export function bisect(g: (x: number) => number, lo: number, hi: number): number {
  let a = lo, b = hi;
  const ga = g(a);
  for (let i = 0; i < 200; i++) {
    const m = (a + b) / 2;
    if (Math.sign(g(m)) === Math.sign(ga)) a = m; else b = m;
  }
  return (a + b) / 2;
}
