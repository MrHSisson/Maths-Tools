// Indices — shared building blocks for the numeric (Powers & Roots) and algebraic (Negative & Zero, Fractional) generators.
// Exact rational arithmetic, monomials with rational exponents, and the answer-form formatting rules from specs/indices-extended.md.
import { mStep, type WorkingStep } from "../../shared";

export type Built = {
  /** The question's own wording (e.g. "Write as a power:"). When set, the question is worded: prompt, then the maths. */
  prompt?: string;
  display?: string; displayLatex?: string; lines?: string[];
  answer: string; answerLatex: string; working: WorkingStep[];
  /** the raw parameters the question was built from, so a test can recompute the answer independently of the display */
  _idx?: unknown;
};

export const rnd = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));
export const choose = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];
export const shuffle = <T,>(xs: readonly T[]): T[] => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const step = (label: string, latex: string | string[]): WorkingStep => mStep(label, latex);
export const rep = (factor: string, n: number) => Array(n).fill(factor).join(" \\times ");

// ── Exact rationals ───────────────────────────────────────────────────────────
export type Rat = [number, number]; // [numerator, denominator], denominator > 0, in lowest terms
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
export const rat = (p: number, q = 1): Rat => { if (q < 0) { p = -p; q = -q; } const g = gcd(p, q) || 1; return [p / g, q / g]; };
export const radd = (a: Rat, b: Rat): Rat => rat(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
export const rsub = (a: Rat, b: Rat): Rat => rat(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
export const rmul = (a: Rat, b: Rat): Rat => rat(a[0] * b[0], a[1] * b[1]);
export const rneg = (a: Rat): Rat => rat(-a[0], a[1]);
export const rrecip = (a: Rat): Rat => rat(a[1], a[0]);
export const req = (a: Rat, b: Rat) => a[0] === b[0] && a[1] === b[1];
export const isInt = (a: Rat) => a[1] === 1;
/** exact integer power (negative n takes the reciprocal) */
export const rpowInt = (a: Rat, n: number): Rat => {
  if (n < 0) return rpowInt(rrecip(a), -n);
  let r: Rat = [1, 1];
  for (let i = 0; i < n; i++) r = rmul(r, a);
  return r;
};
/** the exact n-th root of a non-negative integer, or null */
const iroot = (v: number, n: number): number | null => { const r = Math.round(v ** (1 / n)); return r ** n === v ? r : null; };
/** a^(m/n) exactly (a > 0), or null when the root is not exact */
export const rpow = (a: Rat, e: Rat): Rat | null => {
  const p = iroot(a[0], e[1]), q = iroot(a[1], e[1]);
  if (p === null || q === null) return null;
  return rpowInt(rat(p, q), e[0]);
};

/** a decimal string for a rational whose denominator has only the factors 2 and 5, else null */
export const decStr = (v: Rat): string | null => {
  let [p, q] = v;
  const neg = p < 0; p = Math.abs(p);
  let a = 0, b = 0, d = q;
  while (d % 2 === 0) { d /= 2; a++; }
  while (d % 5 === 0) { d /= 5; b++; }
  if (d !== 1) return null;
  const digits = Math.max(a, b);
  const scaled = String(p * 10 ** digits / q).padStart(digits + 1, "0");
  const s = digits === 0 ? scaled : `${scaled.slice(0, scaled.length - digits)}.${scaled.slice(scaled.length - digits)}`;
  return (neg ? "-" : "") + s;
};

// ── Numbers of three kinds (whole, fraction, decimal) ─────────────────────────
export type Kind = "int" | "frac" | "dec";
export const fracLatex = (v: Rat) => (isInt(v) ? `${v[0]}` : v[0] < 0 ? `-\\dfrac{${-v[0]}}{${v[1]}}` : `\\dfrac{${v[0]}}{${v[1]}}`);
export const fracPlain = (v: Rat) => (isInt(v) ? `${v[0]}` : `${v[0]}/${v[1]}`);
/** a value as the question's kind would write it (a decimal base gives a decimal answer, a fraction base a fraction) */
export const showNum = (v: Rat, kind: Kind): string => (kind === "dec" ? decStr(v) ?? fracLatex(v) : fracLatex(v));
export const plainNum = (v: Rat, kind: Kind): string => (kind === "dec" ? decStr(v) ?? fracPlain(v) : fracPlain(v));
/** a base in a power: whole numbers bare, fractions and decimals in brackets */
export const showBase = (v: Rat, kind: Kind): string => (kind === "int" ? `${v[0]}` : `\\left(${showNum(v, kind)}\\right)`);

// ── Monomials with rational exponents: k × x^a × y^b … ────────────────────────
export type Mono = { k: Rat; e: Record<string, Rat> };
export const mono = (k: number | Rat, e: Record<string, Rat | number> = {}): Mono => ({
  k: typeof k === "number" ? rat(k) : k,
  e: Object.fromEntries(Object.entries(e).map(([l, x]) => [l, typeof x === "number" ? rat(x) : x]).filter(([, x]) => (x as Rat)[0] !== 0)) as Record<string, Rat>,
});
export const mmul = (a: Mono, b: Mono): Mono => {
  const e: Record<string, Rat> = { ...a.e };
  for (const [l, x] of Object.entries(b.e)) e[l] = radd(e[l] ?? [0, 1], x);
  return mono(rmul(a.k, b.k), e);
};
export const mdiv = (a: Mono, b: Mono): Mono => {
  const e: Record<string, Rat> = { ...a.e };
  for (const [l, x] of Object.entries(b.e)) e[l] = rsub(e[l] ?? [0, 1], x);
  return mono(rmul(a.k, rrecip(b.k)), e);
};
/** a monomial to a rational power, or null when the coefficient has no exact root */
export const mpow = (a: Mono, r: Rat): Mono | null => {
  const k = rpow(a.k, r);
  if (!k) return null;
  const e: Record<string, Rat> = {};
  for (const [l, x] of Object.entries(a.e)) e[l] = rmul(x, r);
  return mono(k, e);
};
/** the value at a point (for the tests: arithmetic, not the generator's own rules) */
export const evalMono = (m: Mono, at: Record<string, number>): number =>
  (m.k[0] / m.k[1]) * Object.entries(m.e).reduce((t, [l, x]) => t * Math.pow(at[l], x[0] / x[1]), 1);

/** an exponent: `3`, `-2`, `\frac{1}{2}`, `-\frac{2}{3}` */
export const fmtExp = (a: Rat): string => (isInt(a) ? `${a[0]}` : a[0] < 0 ? `-\\frac{${-a[0]}}{${a[1]}}` : `\\frac{${a[0]}}{${a[1]}}`);
const pow = (l: string, a: Rat) => (a[0] === 1 && a[1] === 1 ? l : `${l}^{${fmtExp(a)}}`);
const letters = (m: Mono) => Object.keys(m.e).sort((a, b) => (/^\d/.test(a) && /^\d/.test(b) ? Number(a) - Number(b) : a < b ? -1 : 1));
/** letters sit side by side (xy); number bases are written 2^{3} \\times 5^{2} */
const joinFactors = (m: Mono, fs: string[]) => fs.join(Object.keys(m.e).some((l) => /^\d/.test(l)) ? " \\times " : "");

export type Form = "positive" | "leave";
/** The answer house style: exponent 1 not written, coefficient 1 not written, zero exponents gone, letters alphabetical.
 *  "positive": negative indices become a fraction. "leave": negative indices stay. */
export const fmtMono = (m: Mono, form: Form): string => {
  const ls = letters(m);
  if (form === "leave") {
    const body = joinFactors(m, ls.map((l) => pow(l, m.e[l])));
    if (!isInt(m.k)) return `${fracLatex(m.k)}${body}`;
    if (!body) return `${m.k[0]}`;
    return `${m.k[0] === 1 ? "" : m.k[0] === -1 ? "-" : m.k[0]}${body}`;
  }
  const top = joinFactors(m, ls.filter((l) => m.e[l][0] > 0).map((l) => pow(l, m.e[l])));
  const bottom = joinFactors(m, ls.filter((l) => m.e[l][0] < 0).map((l) => pow(l, rneg(m.e[l]))));
  const kn = m.k[0], kd = m.k[1];
  const num = `${kn === 1 && top ? "" : kn}${top}`;
  const den = `${kd === 1 && bottom ? "" : kd === 1 ? "" : kd}${bottom}`;
  if (!den) return num;
  return `\\dfrac{${num || "1"}}{${den}}`;
};
/** the plain-text twin of fmtMono, for the answer field */
export const plainMono = (m: Mono, form: Form): string => {
  const ls = letters(m);
  const p = (l: string, a: Rat) => (a[0] === 1 && a[1] === 1 ? l : `${l}^${isInt(a) ? a[0] : `(${a[0]}/${a[1]})`}`);
  if (form === "leave") {
    const body = joinFactors(m, ls.map((l) => p(l, m.e[l]))).replace(/ \\times /g, "*");
    return isInt(m.k) ? (!body ? `${m.k[0]}` : `${m.k[0] === 1 ? "" : m.k[0]}${body}`) : `${fracPlain(m.k)}${body}`;
  }
  const top = joinFactors(m, ls.filter((l) => m.e[l][0] > 0).map((l) => p(l, m.e[l]))).replace(/ \\times /g, "*");
  const bottom = joinFactors(m, ls.filter((l) => m.e[l][0] < 0).map((l) => p(l, rneg(m.e[l])))).replace(/ \\times /g, "*");
  const num = `${m.k[0] === 1 && top ? "" : m.k[0]}${top}`;
  const den = `${m.k[1] === 1 ? "" : m.k[1]}${bottom}`;
  return den ? `${num || "1"}/${den}` : num;
};
/** the displayed expression: a power of a bracketed monomial, a product, a quotient */
export const bracket = (m: Mono, e: Rat) => `\\left(${fmtMono(m, "leave")}\\right)^{${fmtExp(e)}}`;

// ── Expressions: what a question asks, so a test can evaluate it independently of the generator ───────────────────────────
export type Expr = { t: "mono"; m: Mono } | { t: "mul" | "div"; a: Expr; b: Expr } | { t: "pow"; a: Expr; r: Rat };
export const evalExpr = (e: Expr, at: Record<string, number>): number => {
  if (e.t === "mono") return evalMono(e.m, at);
  if (e.t === "pow") return Math.pow(evalExpr(e.a, at), e.r[0] / e.r[1]);
  return e.t === "mul" ? evalExpr(e.a, at) * evalExpr(e.b, at) : evalExpr(e.a, at) / evalExpr(e.b, at);
};
export const hasNegativeIndex = (m: Mono) => Object.values(m.e).some((x) => x[0] < 0);
