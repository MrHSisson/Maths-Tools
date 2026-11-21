// Linear Programming (Decision Maths DD1, formulating): the maths core, with no React. See specs/linear-programming-formulate.md (sections 2, 4 and 9).
// Everything is exact fractions (the `Fr` of dim.ts). A constraint is built from the *worded rule* it came from (a relationship, a blend, an
// either-or limit, a plain resource use) and is always stored in the one tidy form: whole-number coefficients, lowest terms, leading coefficient
// positive (the operator flips when we multiply by −1), strict operators kept strict. `holds` is the constraint's meaning as a plain predicate on
// a point, written from the original numbers of the sentence and never from the tidy coefficients, so a test can compare the two.
import { fr, fadd, fsub, fmul, fdiv, fneg, fzero, fint, ZERO, ONE, type Fr } from "./dim";

// ── Operators ────────────────────────────────────────────────────────────────
export type Op = "≤" | "≥" | "=" | "<" | ">";
export const OPS: readonly Op[] = ["≤", "≥", "=", "<", ">"];
const FLIP: Record<Op, Op> = { "≤": "≥", "≥": "≤", "=": "=", "<": ">", ">": "<" };
/** the operator after both sides are multiplied by −1 */
export const flipOp = (op: Op): Op => FLIP[op];
export const isStrict = (op: Op): boolean => op === "<" || op === ">";

/** sign of a − b for exact fractions (denominators are positive) */
const fcmp = (a: Fr, b: Fr): -1 | 0 | 1 => {
  const d = a[0] * b[1] - b[0] * a[1];
  return d < 0 ? -1 : d > 0 ? 1 : 0;
};
/** does `l op r` hold? */
export function opHolds(l: Fr, op: Op, r: Fr): boolean {
  const c = fcmp(l, r);
  switch (op) {
    case "≤": return c <= 0;
    case "≥": return c >= 0;
    case "=": return c === 0;
    case "<": return c < 0;
    case ">": return c > 0;
  }
}

// ── Integer helpers ──────────────────────────────────────────────────────────
export const gcdInt = (a: number, b: number): number => (b ? gcdInt(b, a % b) : Math.abs(a));
export const lcmInt = (a: number, b: number): number => (a === 0 || b === 0 ? 0 : Math.abs(a * b) / gcdInt(a, b));
const norm = (a: Fr): Fr => (a[0] === 0 ? ZERO : a); // no −0, so toEqual and Object.is agree

// ── Types (brief section 9) ──────────────────────────────────────────────────
export interface Var { sym: string; noun: string; units?: string; integer: boolean }
export type ConstraintKind = "resource" | "multiple" | "percent" | "ratio" | "bound" | "capacity" | "remainder";
export interface Constraint {
  /** canonical: whole numbers, lowest terms, leading coefficient positive */
  coeffs: Fr[];
  op: Op;
  rhs: Fr;
  /** the worded rule it came from */
  source: string;
  kind: ConstraintKind;
  /** the meaning in plain terms, written independently of `coeffs` */
  holds: (point: readonly Fr[]) => boolean;
}
export interface Model {
  vars: Var[];
  sense: "max" | "min";
  obj: Fr[];
  objConst: Fr;
  constraints: Constraint[];
}

// ── The tidy rule ────────────────────────────────────────────────────────────
export interface Tidy { coeffs: Fr[]; op: Op; rhs: Fr }
/**
 * Whole numbers, lowest terms, leading coefficient positive.
 * Multiply through by the lowest common multiple of every denominator (coefficients and right-hand side), divide by the highest common
 * factor of every number in the line, then, if the first non-zero coefficient is negative, multiply by −1 and flip the operator.
 * (A line whose right-hand side is not a multiple of the coefficients' common factor keeps that factor: 2x + 4y ≤ 5 stays as it is.)
 */
export function tidy(coeffs: readonly Fr[], op: Op, rhs: Fr): Tidy {
  const all = [...coeffs, rhs];
  const den = all.reduce((l, f) => lcmInt(l, f[1]), 1);
  const ints = all.map((f) => (f[0] * den) / f[1]);
  const g = ints.reduce((h, n) => gcdInt(h, n), 0);
  const div = g || 1;
  const scaled = ints.map((n) => fr(n / div));
  let c = scaled.slice(0, coeffs.length);
  let r = scaled[scaled.length - 1];
  let o = op;
  const lead = c.find((f) => !fzero(f));
  if (lead && lead[0] < 0) {
    c = c.map(fneg);
    r = fneg(r);
    o = flipOp(op);
  }
  return { coeffs: c.map(norm), op: o, rhs: norm(r) };
}

/** true if the constraint is in the tidy form (whole-number coefficients, gcd 1 with the right-hand side, leading coefficient positive) */
export function isTidy(c: Pick<Constraint, "coeffs" | "rhs">): boolean {
  if (![...c.coeffs, c.rhs].every(fint)) return false;
  const g = [...c.coeffs, c.rhs].reduce((h, f) => gcdInt(h, f[0]), 0);
  const lead = c.coeffs.find((f) => !fzero(f));
  return g === 1 && !!lead && lead[0] > 0;
}

const dot = (coeffs: readonly Fr[], point: readonly Fr[]): Fr => coeffs.reduce((s, c, i) => fadd(s, fmul(c, point[i] ?? ZERO)), ZERO);
const sumAt = (idx: readonly number[], point: readonly Fr[]): Fr => idx.reduce((s, i) => fadd(s, point[i] ?? ZERO), ZERO);

function build(kind: ConstraintKind, source: string, raw: readonly Fr[], op: Op, rhs: Fr, holds: Constraint["holds"]): Constraint {
  const t = tidy(raw, op, rhs);
  return { coeffs: t.coeffs, op: t.op, rhs: t.rhs, source, kind, holds };
}

// ── Plain linear constraints: a resource use, a bound, a total, a difference ─
/** Σ coeffs·x ⟨op⟩ rhs, as the sentence gave them (decimals and fractions allowed); `holds` uses these original numbers */
export function linear(coeffs: readonly Fr[], op: Op, rhs: Fr, kind: ConstraintKind = "resource", source = ""): Constraint {
  return build(kind, source, coeffs, op, rhs, (p) => opHolds(dot(coeffs, p), op, rhs));
}

// ── The relationship rule (brief section 2) ──────────────────────────────────
interface RelationshipSpec {
  /** number of variables in the model */
  n: number;
  /** indices of group A */
  a: readonly number[];
  /** indices of group B (may include A's variables: "of the total") */
  b: readonly number[];
  /** the multiple, a rational (a percentage p% is fr(p, 100)) */
  m: Fr;
  op: Op;
  kind?: ConstraintKind;
  source?: string;
}
/** Σ(A) ⟨op⟩ m · Σ(B): clear the fraction, move to the left, combine like terms (so a total on the right is combined with A's own variables) */
export function relationship(s: RelationshipSpec): Constraint {
  const raw: Fr[] = Array.from({ length: s.n }, () => ZERO);
  for (const i of s.a) raw[i] = fadd(raw[i], ONE);
  for (const i of s.b) raw[i] = fsub(raw[i], s.m);
  return build(s.kind ?? "multiple", s.source ?? "", raw, s.op, ZERO, (p) => opHolds(sumAt(s.a, p), s.op, fmul(s.m, sumAt(s.b, p))));
}
/** "A is p% of B" (a percentage, p may be a fraction: 12.5 is fr(25, 2)) */
export const percentOf = (s: Omit<RelationshipSpec, "m" | "kind"> & { p: Fr }): Constraint =>
  relationship({ ...s, m: fdiv(s.p, fr(100)), kind: "percent" });
/** "the ratio of A to B is ⟨op⟩ num : den", so A/B ⟨op⟩ num/den */
export const ratioOf = (s: Omit<RelationshipSpec, "m" | "kind"> & { num: number; den: number }): Constraint =>
  relationship({ ...s, m: fr(s.num, s.den), kind: "ratio" });

// ── The blend rule (brief section 4, "Blends and averages") ──────────────────
interface BlendSpec {
  /** the proportion of the component in one unit of each item (0.5 for oil that is 50% olive) */
  contents: readonly Fr[];
  /** the share the whole mix must have (the total is in the denominator) */
  share: Fr;
  op: Op;
  source?: string;
}
/** Σ cᵢxᵢ ⟨op⟩ p·Σxᵢ, so (cᵢ − p) are the coefficients and the right-hand side is 0 */
export function blend(s: BlendSpec): Constraint {
  const raw = s.contents.map((c) => fsub(c, s.share));
  const all = s.contents.map((_, i) => i);
  return build("percent", s.source ?? "", raw, s.op, ZERO, (p) => {
    const total = sumAt(all, p);
    const component = dot(s.contents, p);
    // an empty mix has no share to compare; compare the amounts (0 and 0) so the strict operators stay false there, as the tidy form does
    if (fzero(total)) return opHolds(ZERO, s.op, ZERO);
    return opHolds(fdiv(component, total), s.op, s.share);
  });
}

// ── The either-or rule (brief section 4.1) ───────────────────────────────────
interface EitherOrSpec {
  /** the most of each product the shared resource could make alone: a, b, (c, d) */
  caps: readonly Fr[];
  /** how much of the resource there is, in units of the capacity: 1 for "the time available", 8 for "8 hours" at a rate per hour */
  amount?: Fr;
  op?: Op;
  source?: string;
}
/** x/a + y/b (+ …) ⟨op⟩ T, multiplied by the lowest common multiple: two products give (b/g)x + (a/g)y ⟨op⟩ T·ab/g, g = gcd(a, b) */
export function eitherOr(s: EitherOrSpec): Constraint {
  const op = s.op ?? "≤";
  const T = s.amount ?? ONE;
  const raw = s.caps.map((a) => fdiv(ONE, a));
  return build("capacity", s.source ?? "", raw, op, T, (p) => opHolds(dot(raw, p), op, T));
}

// ── Helpers for tests and later chunks ───────────────────────────────────────
/** where the boundary line meets axis i (all other variables 0): rhs / coefficient, or null if the line is parallel to that axis */
export function intercept(c: Pick<Constraint, "coeffs" | "rhs">, i: number): Fr | null {
  return fzero(c.coeffs[i]) ? null : fdiv(c.rhs, c.coeffs[i]);
}
/** the canonical inequality evaluated at a point (not `holds`: this one reads the tidy coefficients) */
export const tidyHolds = (c: Pick<Constraint, "coeffs" | "op" | "rhs">, p: readonly Fr[]): boolean => opHolds(dot(c.coeffs, p), c.op, c.rhs);
/** is the point feasible for every constraint of the model (by meaning, not by coefficients)? */
export const feasible = (m: Model, p: readonly Fr[]): boolean => m.constraints.every((c) => c.holds(p));
/** the objective at a point */
export const objective = (m: Model, p: readonly Fr[]): Fr => fadd(dot(m.obj, p), m.objConst);
/** a point from plain numbers */
export const pt = (...n: number[]): Fr[] => n.map((v) => fr(v));

// ── Corner points and the best one (for a model's feasible region, exact) ────
interface Row { c: Fr[]; r: Fr; op: Op }
/** the unique solution of n equations in n unknowns, or null (Gaussian elimination in exact fractions) */
function solveSquare(rows: readonly Row[], n: number): Fr[] | null {
  const m = rows.map((row) => [...row.c, row.r]);
  for (let col = 0; col < n; col++) {
    const piv = m.findIndex((r, i) => i >= col && !fzero(r[col]));
    if (piv < 0) return null;
    [m[col], m[piv]] = [m[piv], m[col]];
    m[col] = m[col].map((v) => fdiv(v, m[col][col]));
    for (let i = 0; i < n; i++) if (i !== col && !fzero(m[i][col])) m[i] = m[i].map((v, k) => fsub(v, fmul(m[i][col], m[col][k])));
  }
  return m.map((r) => r[n]);
}
/** the corner points of the region the constraints and x ≥ 0 bound (a strict operator is treated as its non-strict closure) */
export function vertices(cons: readonly Pick<Constraint, "coeffs" | "op" | "rhs">[], n: number): Fr[][] {
  const rows: Row[] = [...cons.map((c) => ({ c: [...c.coeffs], r: c.rhs, op: c.op })), ...Array.from({ length: n }, (_, i): Row => ({ c: Array.from({ length: n }, (__, j) => (i === j ? ONE : ZERO)), r: ZERO, op: "≥" }))];
  const closed = (row: Row, p: readonly Fr[]): boolean => {
    const v = dot(row.c, p);
    const k = fcmp(v, row.r);
    return row.op === "=" ? k === 0 : row.op === "≤" || row.op === "<" ? k <= 0 : k >= 0;
  };
  const out = new Map<string, Fr[]>();
  const pick = (start: number, chosen: Row[]): void => {
    if (chosen.length === n) {
      const p = solveSquare(chosen, n);
      if (p && rows.every((row) => closed(row, p))) out.set(p.map((f) => `${f[0]}/${f[1]}`).join(","), p);
      return;
    }
    for (let i = start; i < rows.length; i++) pick(i + 1, [...chosen, rows[i]]);
  };
  pick(0, []);
  return [...out.values()];
}
/** the best corner points for an objective (all of them: more than one means the optimum is not a single point) */
export function bestVertices(vs: readonly Fr[][], obj: readonly Fr[], sense: "max" | "min"): { value: Fr; at: Fr[][] } | null {
  if (!vs.length) return null;
  let value = dot(obj, vs[0]);
  let at: Fr[][] = [];
  for (const v of vs) {
    const o = dot(obj, v);
    const k = fcmp(o, value);
    if (at.length === 0 || (sense === "max" ? k > 0 : k < 0)) { value = o; at = [v]; } else if (k === 0) at.push(v);
  }
  return { value, at };
}
