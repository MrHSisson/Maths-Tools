import {
  ToolShell, resolveMultiSelectValues, maskUnmetOptions,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type WorkingStep, type ToolMultiSelect,
  randInt, pick, mStep, pickActive, weightOf,
} from "../../shared";

// ═══════════════════════════════════════════════════════════════════════════
// Partial fractions (A-Level Mathematics, AQA 7357 — NOT Further Maths) — express p(x)/q(x) as a sum of fractions with linear denominators.
// Scope is the A-level one: linear factors (including (a − bx) and (px + q)), a repeated factor squared, at most three fractions, constant
// numerators, and improper fractions by division first. No irreducible quadratics and no cubed factors (those are Further Maths).
//   Two fractions   — a proper fraction over two linear factors (distinct, non-monic, or a repeated factor)
//   Three fractions — a proper fraction over three linear factors (distinct, one containing x, non-monic, repeated)
//   Divide first    — numerator degree ≥ denominator degree: divide to get Q(x) + R(x)/q(x), then split R/q
// Whole-number constants: built from the answer (constants first, numerator assembled). Fractional constants (A = 3/2): the numerator is
// chosen first and the constants SOLVED from it with exact fractions. Either way the working re-derives every constant itself
// (substitute the root of each factor, then equate coefficients for the one leftover) and throws if it disagrees.
// ═══════════════════════════════════════════════════════════════════════════

// ── 1. Types ──────────────────────────────────────────────────────────────────

type SubTool = "two" | "three" | "divide";
type Form =
  | "monic2" | "withX2" | "nonMonic2" | "bothNonMonic2" | "repeated2" | "repeatedNonMonic2"
  | "monic3" | "withX3" | "nonMonic3" | "repeated3" | "repeatedNonMonic3"
  | "negX2" | "negX3" | "repeatedNeg2" | "repeatedNeg3"
  | "equal2" | "quotLinear2" | "equal3" | "quotLinear3" | "repeatedDiv";

/** A linear factor (p x + q) raised to `m` (1 or 2), gcd(p, |q|) = 1. p > 0, except the (a − bx) factors where p < 0 and q > 0. */
interface Fac { p: number; q: number; m: 1 | 2 }
/** One partial fraction: constant `A` over (factor)^k, labelled with a letter. */
interface PFTerm { fi: number; k: number; letter: string; A: Frac }
interface Raw { facs: Fac[]; terms: PFTerm[]; N: number[]; Q: number[] | null; R: number[]; shownExpanded: boolean }

// ── 2. TOOL_CONFIG ────────────────────────────────────────────────────────────

const opt = (value: string, label: string, weight: number, defaultActive = true) => ({ value, label, weight, defaultActive });
const formPool = (options: ToolMultiSelect["options"]): ToolMultiSelect => ({ key: "denomForm", label: "Denominator", plainDisplay: true, options });
/** `fractionForms`: the denominator forms that can give fractional constants. A lone monic repeated factor (x + a)² cannot (its
 *  constants are always whole), so Fractions is greyed unless one of these is on. */
const CONSTANTS = (whole: boolean, fractions: boolean, fractionForms?: string[]): ToolMultiSelect => ({
  key: "constants", label: "Constants", plainDisplay: true,
  options: [opt("whole", "Whole numbers", 0, whole), { ...opt("fractions", "Fractions", 3, fractions), ...(fractionForms ? { requires: [fractionForms] } : {}) }],
});
/** Forms whose constants are always whole numbers, whatever the Constants option says. */
const WHOLE_ONLY_FORMS: Form[] = ["repeated2"];
const SHOWN = (expandedDefault: boolean): ToolMultiSelect => ({
  key: "denomShown", label: "Shown as", plainDisplay: true,
  options: [opt("factorised", "Factorised", 0, !expandedDefault), opt("expanded", "Expanded", 2, expandedDefault)],
});

const POOLS: Record<SubTool, Record<DifficultyLevel, ToolMultiSelect[]>> = {
  two: {
    level1: [formPool([opt("monic2", "(x + a)(x + b)", 1), opt("withX2", "One factor is x", 2)]), SHOWN(false), CONSTANTS(true, false)],
    level2: [formPool([opt("nonMonic2", "(px + q)(x + a)", 3), opt("bothNonMonic2", "(px + q)(rx + s)", 4), opt("negX2", "(a − bx)(cx + d)", 4), opt("monic2", "(x + a)(x + b)", 2, false)]), SHOWN(false), CONSTANTS(true, true)],
    level3: [formPool([opt("repeated2", "Repeated (x + a)²", 5), opt("repeatedNonMonic2", "Repeated (px + q)²", 6), opt("repeatedNeg2", "Repeated (a − bx)²", 6, false)]), SHOWN(false), CONSTANTS(false, true, ["repeatedNonMonic2", "repeatedNeg2"])],
  },
  three: {
    level1: [formPool([opt("monic3", "(x + a)(x + b)(x + c)", 1), opt("withX3", "One factor is x", 2)]), SHOWN(false), CONSTANTS(true, false)],
    level2: [formPool([opt("nonMonic3", "One factor (px + q)", 3), opt("negX3", "One factor (a − bx)", 4), opt("monic3", "(x + a)(x + b)(x + c)", 2, false)]), SHOWN(false), CONSTANTS(true, true)],
    level3: [formPool([opt("repeated3", "(x + a)(x + b)²", 5), opt("repeatedNonMonic3", "(px + q)(x + a)²", 6), opt("repeatedNeg3", "(x + a)(b − cx)²", 7, false)]), SHOWN(false), CONSTANTS(false, true)],
  },
  divide: {
    level1: [formPool([opt("equal2", "Same degree (Q is a number)", 1)]), SHOWN(false), CONSTANTS(true, false)],
    level2: [formPool([opt("quotLinear2", "Q is linear", 3), opt("equal2", "Same degree (Q is a number)", 2, false)]), SHOWN(true), CONSTANTS(true, true)],
    level3: [formPool([opt("equal3", "Cubic denominator, Q a number", 4), opt("quotLinear3", "Cubic denominator, Q linear", 5), opt("repeatedDiv", "Repeated factor, Q linear", 6)]), SHOWN(true), CONSTANTS(false, true)],
  },
};

const NEG_X_VAR = { key: "negX", label: "Negative x in numerator", defaultValue: false };

const METHOD_DD = {
  key: "method", label: "Working", defaultValue: "full",
  options: [{ value: "full", label: "Full working" }, { value: "short", label: "Constants only" }],
  workedExampleOnly: true,
};

const entry = (name: string, tool: SubTool) => ({
  name,
  variables: [],
  dropdown: null,
  difficultySettings: {
    level1: { variables: [NEG_X_VAR], dropdown: METHOD_DD, multiSelect: POOLS[tool].level1 },
    level2: { variables: [NEG_X_VAR], dropdown: METHOD_DD, multiSelect: POOLS[tool].level2 },
    level3: { variables: [NEG_X_VAR], dropdown: METHOD_DD, multiSelect: POOLS[tool].level3 },
  },
});

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Partial Fractions",
  tools: {
    two: { ...entry("Two fractions", "two"), instruction: "Express in partial fractions:" },
    three: { ...entry("Three fractions", "three"), instruction: "Express in partial fractions:" },
    divide: { ...entry("Divide first", "divide"), instruction: "Express as a polynomial plus partial fractions:" },
  },
};

// ── 3. INFO_SECTIONS ─────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  { title: "Scope", icon: "🎯", content: [
    { label: "A-level Mathematics", detail: "Matches AQA A-level Mathematics (7357), not Further Maths: linear factors, a repeated factor squared, at most three fractions, constant numerators, and improper fractions divided first. Irreducible quadratic factors and cubed factors are not included." },
    { label: "Negative x terms", detail: "Question Options → Negative x in numerator: switch off to keep every x coefficient in the numerator positive (the constant term can still be negative)." },
    { label: "Constants", detail: "Question Options → Constants: Whole numbers, or Fractions such as A = 3/2 (the numerator is chosen first and the constants solved from it). Level 1 is whole numbers; Level 3 is fractions." },
  ]},
  { title: "Two fractions", icon: "➗", content: [
    { label: "Overview", detail: "Split a proper fraction over two linear factors: p(x) / ((ax + b)(cx + d)) = A / (ax + b) + B / (cx + d), or for a repeated factor A / (ax + b) + B / (ax + b)²." },
    { label: "Level 1 — Green", detail: "Two different monic factors (x + a)(x + b), including one factor that is just x." },
    { label: "Level 2 — Yellow", detail: "Factors with a coefficient of x: (px + q)(x + a) and (px + q)(rx + s), and a negative x term, (a − bx)(cx + d). The root is a fraction." },
    { label: "Level 3 — Red", detail: "A repeated factor, (x + a)² or (px + q)² (or (a − bx)²): A / (x + a) + B / (x + a)². Constants can be fractions." },
  ]},
  { title: "Three fractions", icon: "🔱", content: [
    { label: "Overview", detail: "The same method with three linear factors. The numerator has degree at most 2." },
    { label: "Level 1 — Green", detail: "Three different monic factors, or two monic factors and x." },
    { label: "Level 2 — Yellow", detail: "One factor has a coefficient of x, such as (2x + 1), or a negative x term, such as (1 − 2x)." },
    { label: "Level 3 — Red", detail: "One repeated factor: A / (x + a) + B / (x + b) + C / (x + b)²." },
  ]},
  { title: "Divide first", icon: "📐", content: [
    { label: "Overview", detail: "When the numerator's degree is at least the denominator's, the fraction is improper. Divide first to get Q(x) + R(x) / q(x), then split R / q into partial fractions." },
    { label: "Level 1 — Green", detail: "Numerator and denominator both quadratic, so Q is a number." },
    { label: "Level 2 — Yellow", detail: "A cubic numerator over a quadratic denominator, so Q is linear." },
    { label: "Level 3 — Red", detail: "A cubic denominator (three factors, or one repeated), with Q a number or linear." },
  ]},
  { title: "Method", icon: "🧮", content: [
    { label: "Substitute", detail: "After multiplying through by the denominator, let x equal the root of one factor: every term containing that factor disappears, leaving one constant." },
    { label: "Equate coefficients", detail: "A repeated factor leaves one constant that substitution cannot reach. Compare the coefficients of the highest power of x on both sides to find it." },
    { label: "Shown as", detail: "Question Options → Shown as: Expanded gives, for example, x² + x − 6, and the working factorises it first." },
    { label: "Working", detail: "Worked Example → Working: Constants only skips the equation lines and shows the constants and the answer." },
  ]},
];

// ── 4. Fractions + polynomials ───────────────────────────────────────────────

interface Frac { n: number; d: number }
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const F = (n: number, d = 1): Frac => { const g = gcd(n, d) || 1; const s = d < 0 ? -1 : 1; return { n: (s * n) / g, d: (s * d) / g }; };
const addF = (a: Frac, b: Frac) => F(a.n * b.d + b.n * a.d, a.d * b.d);
const mulF = (a: Frac, b: Frac) => F(a.n * b.n, a.d * b.d);
const divF = (a: Frac, b: Frac) => F(a.n * b.d, a.d * b.n);
const eqF = (a: Frac, b: Frac) => a.n === b.n && a.d === b.d;

/** Polynomials: integer coefficients, highest power first. */
type Poly = number[];
const polyMul = (a: Poly, b: Poly): Poly => {
  const out = new Array(a.length + b.length - 1).fill(0);
  a.forEach((x, i) => b.forEach((y, j) => { out[i + j] += x * y; }));
  return out;
};
const polyAdd = (a: Poly, b: Poly): Poly => {
  const n = Math.max(a.length, b.length);
  const pa = [...new Array(n - a.length).fill(0), ...a], pb = [...new Array(n - b.length).fill(0), ...b];
  return pa.map((x, i) => x + pb[i]);
};
const trim = (c: Poly): Poly => { let i = 0; while (i < c.length - 1 && c[i] === 0) i++; return c.slice(i); };
const polyEvalF = (c: Poly, r: Frac): Frac => c.reduce<Frac>((acc, v) => addF(mulF(acc, r), F(v)), F(0));
const facPoly = (f: Fac): Poly => (f.m === 2 ? polyMul([f.p, f.q], [f.p, f.q]) : [f.p, f.q]);
const prodPoly = (fs: Fac[]): Poly => fs.reduce<Poly>((acc, f) => polyMul(acc, facPoly(f)), [1]);
const rootOf = (f: Fac): Frac => F(-f.q, f.p);

/** The product of every factor except `skip`'s, with `skip` itself raised to `keep` (0 or 1). */
const cofactor = (facs: Fac[], skip: number, keep: number): Poly => {
  let out: Poly = [1];
  facs.forEach((f, i) => {
    const pw = i === skip ? keep : f.m;
    for (let j = 0; j < pw; j++) out = polyMul(out, [f.p, f.q]);
  });
  return out;
};

// ── 5. LaTeX helpers ─────────────────────────────────────────────────────────

const joinTerms = (ts: { neg: boolean; body: string }[]): string =>
  ts.length === 0 ? "0" : ts.map((t, i) => (i === 0 ? (t.neg ? "-" : "") : t.neg ? " - " : " + ") + t.body).join("");

const polyL = (c: Poly): string => {
  const n = c.length - 1;
  const ts: { neg: boolean; body: string }[] = [];
  c.forEach((v, i) => {
    if (v === 0) return;
    const e = n - i, A = Math.abs(v);
    const m = e === 0 ? "" : e === 1 ? "x" : `x^{${e}}`;
    ts.push({ neg: v < 0, body: m === "" ? `${A}` : A === 1 ? m : `${A}${m}` });
  });
  return joinTerms(ts);
};
const fracAbs = (f: Frac) => (f.d === 1 ? `${Math.abs(f.n)}` : `\\dfrac{${Math.abs(f.n)}}{${f.d}}`);
const fracL = (f: Frac) => (f.n < 0 ? "-" : "") + fracAbs(f);
const plainF = (f: Frac) => (f.d === 1 ? `${f.n}` : `${f.n}/${f.d}`);
/** The factor's polynomial: x + 3, 2x − 1, or 3 − 2x (a negative x term is written constant first, as an exam would). */
const linPoly = (p: number, q: number) => (p < 0 && q > 0 ? `${q} - ${p === -1 ? "" : -p}x` : polyL([p, q]));
/** (px + q), or just x for the factor x. */
const linL = (p: number, q: number) => (q === 0 && p === 1 ? "x" : `(${linPoly(p, q)})`);
const facL = (f: Fac, k: number = f.m) => (k === 0 ? "" : k === 1 ? linL(f.p, f.q) : `${linL(f.p, f.q)}^{${k}}`);
const facsL = (facs: Fac[]) => facs.map((f) => facL(f)).join("");
const cofL = (facs: Fac[], skip: number, keep: number) => {
  const s = facs.map((f, i) => (i === skip ? facL(f, keep) : facL(f))).join("");
  return s || "1";
};

/** A linear factor with x replaced by a value, e.g. (2+3) or (2(\tfrac12)+3). */
const linSub = (f: Fac, r: Frac): string => {
  const rv = fracL(r);
  if (f.p < 0) return `\\left(${f.q}-${f.p === -1 ? "" : -f.p}\\left(${rv}\\right)\\right)`;
  if (f.p === 1) return `(${rv}${f.q > 0 ? `+${f.q}` : f.q < 0 ? `${f.q}` : ""})`;
  return `\\left(${f.p}\\left(${rv}\\right)${f.q > 0 ? `+${f.q}` : f.q < 0 ? `${f.q}` : ""}\\right)`;
};
const cofSub = (facs: Fac[], skip: number, keep: number, r: Frac): string => {
  const parts = facs.map((f, i) => {
    const pw = i === skip ? keep : f.m;
    return pw === 0 ? "" : pw === 1 ? linSub(f, r) : `${linSub(f, r)}^{${pw}}`;
  }).join("");
  return parts || "1";
};
const polySub = (c: Poly, r: Frac): string => {
  const n = c.length - 1;
  const ts: { neg: boolean; body: string }[] = [];
  c.forEach((v, i) => {
    const e = n - i;
    if (v === 0) return;
    if (e === 0) { ts.push({ neg: v < 0, body: `${Math.abs(v)}` }); return; }
    if (r.n === 0) return;
    const A = Math.abs(v);
    const rv = r.n < 0 || r.d !== 1 ? `\\left(${fracL(r)}\\right)` : `(${fracL(r)})`;
    const pw = e === 1 ? rv : `${rv}^{${e}}`;
    // a bare 2 for a coefficient of 1 and a positive whole value; otherwise the value stays bracketed
    ts.push({ neg: v < 0, body: A === 1 ? (e === 1 && r.d === 1 && r.n > 0 ? `${r.n}` : pw) : `${A}${pw}` });
  });
  return joinTerms(ts);
};

/** The denominator of one partial fraction: x + 3, or (x + 3)², with no brackets round a single linear factor. */
const denL = (f: Fac, k: number) => (k === 1 ? linPoly(f.p, f.q) : `${linL(f.p, f.q)}^{${k}}`);
const termFrac = (facs: Fac[], t: PFTerm, numerator: string, d = 1) => {
  const base = denL(facs[t.fi], t.k);
  // a fractional constant goes in the denominator: 3/(2(x + 1)), not (3/2)/(x + 1)
  const den = d === 1 ? base : t.k === 1 && base !== "x" ? `${d}(${base})` : `${d}${base}`;
  return `\\dfrac{${numerator}}{${den}}`;
};
const answerL = (facs: Fac[], terms: PFTerm[]): string =>
  joinTerms(terms.map((t) => ({ neg: t.A.n < 0, body: termFrac(facs, t, `${Math.abs(t.A.n)}`, t.A.d) })));
const symbolicL = (facs: Fac[], terms: PFTerm[]): string =>
  terms.map((t, i) => (i === 0 ? "" : " + ") + termFrac(facs, t, t.letter)).join("");

// ── 6. Building a question from its answer ───────────────────────────────────

const LETTERS = "ABCDEFG";
const nz = (lo: number, hi: number) => { let v = 0; while (v === 0) v = randInt(lo, hi); return v; };

/** n distinct linear factors with the stated shape; roots are all different. */
function buildFacs(form: Form): Fac[] | null {
  const monic = () => ({ p: 1, q: nz(-6, 6), m: 1 as const });
  const nonMonic = () => { const p = pick([2, 2, 3, 4]); let q = nz(-5, 5); while (gcd(p, Math.abs(q)) !== 1) q = nz(-5, 5); return { p, q, m: 1 as const }; };
  const xFac = () => ({ p: 1, q: 0, m: 1 as const });
  const neg = () => { const p = pick([-1, -1, -2, -3]); let q = randInt(1, 6); while (gcd(Math.abs(p), q) !== 1) q = randInt(1, 6); return { p, q, m: 1 as const }; };
  const rep = (f: Fac): Fac => ({ ...f, m: 2 });
  let facs: Fac[];
  switch (form) {
    case "monic2": case "equal2": case "quotLinear2": facs = [monic(), monic()]; break;
    case "withX2": facs = [xFac(), monic()]; break;
    case "nonMonic2": facs = [nonMonic(), monic()]; break;
    case "bothNonMonic2": facs = [nonMonic(), nonMonic()]; break;
    case "repeated2": facs = [rep(monic())]; break;
    case "repeatedNonMonic2": facs = [rep(nonMonic())]; break;
    case "monic3": case "equal3": case "quotLinear3": facs = [monic(), monic(), monic()]; break;
    case "withX3": facs = [xFac(), monic(), monic()]; break;
    case "nonMonic3": facs = [nonMonic(), monic(), monic()]; break;
    case "repeated3": case "repeatedDiv": facs = [monic(), rep(monic())]; break;
    case "repeatedNonMonic3": facs = [nonMonic(), rep(monic())]; break;
    case "negX2": facs = [neg(), pick([monic, nonMonic])()]; break;
    case "negX3": facs = [neg(), monic(), monic()]; break;
    case "repeatedNeg2": facs = [rep(neg())]; break;
    case "repeatedNeg3": facs = [monic(), rep(neg())]; break;
  }
  for (let i = facs.length - 1; i > 0; i--) { const j = randInt(0, i); [facs[i], facs[j]] = [facs[j], facs[i]]; }
  // distinct roots
  for (let i = 0; i < facs.length; i++) for (let j = i + 1; j < facs.length; j++) if (eqF(rootOf(facs[i]), rootOf(facs[j]))) return null;
  return facs;
}

const termsFor = (facs: Fac[], range: number): PFTerm[] => {
  const out: PFTerm[] = [];
  let li = 0;
  facs.forEach((f, fi) => { for (let k = 1; k <= f.m; k++) out.push({ fi, k, letter: LETTERS[li++], A: F(nz(-range, range)) }); });
  return out;
};

/** Σ A_t · (denominator ÷ factor^k): the numerator of the proper fraction (whole-number constants). */
const numeratorOf = (facs: Fac[], terms: PFTerm[]): Poly =>
  terms.reduce<Poly>((acc, t) => polyAdd(acc, polyMul([t.A.n], cofactor(facs, t.fi, facs[t.fi].m - t.k))), [0]);

/**
 * The constants for a given numerator, exactly: substitute the root of each factor for its top-power constant, then equate the
 * coefficient of x^(n−1) for the one constant substitution cannot reach (k = 1 of a repeated factor).
 */
function solveTerms(facs: Fac[], N: Poly): PFTerm[] {
  const n = prodPoly(facs).length - 1;
  const terms: PFTerm[] = [];
  let li = 0;
  facs.forEach((f, fi) => { for (let k = 1; k <= f.m; k++) terms.push({ fi, k, letter: LETTERS[li++], A: F(0) }); });
  terms.forEach((t) => {
    if (t.k !== facs[t.fi].m) return;
    const r = rootOf(facs[t.fi]);
    t.A = divF(polyEvalF(N, r), polyEvalF(cofactor(facs, t.fi, 0), r));
  });
  terms.forEach((t) => {
    if (t.k === facs[t.fi].m) return;
    const nCoef = F(N.length >= n ? N[N.length - n] : 0);
    let others = F(0);
    terms.filter((u) => u.k === 1 && u !== t).forEach((u) => { others = addF(others, mulF(F(cofactor(facs, u.fi, facs[u.fi].m - 1)[0]), u.A)); });
    const lead = F(cofactor(facs, t.fi, facs[t.fi].m - 1)[0]);
    t.A = divF(addF(nCoef, mulF(F(-1), others)), lead);
  });
  return terms;
}

const QUOTIENT_DEG: Partial<Record<Form, number>> = { equal2: 0, quotLinear2: 1, equal3: 0, quotLinear3: 1, repeatedDiv: 1 };

function makeRaw(level: DifficultyLevel, form: Form, expanded: boolean, fractions: boolean, negX = true): Raw {
  for (let attempt = 0; attempt < 8000; attempt++) {
    // with negative x terms off, the numerator's x coefficients are kept positive (its constant can still be negative); relaxed only if nothing fits
    const keepPos = !negX && attempt < 7000;
    const facs = buildFacs(form);
    if (!facs) continue;
    const n = prodPoly(facs).length - 1;
    let terms: PFTerm[], R: Poly;
    if (fractions) {
      // numerator first, constants solved from it: nice-looking fractions only
      R = Array.from({ length: n }, (_, i) => (i === 0 ? (keepPos ? randInt(1, 6) : nz(-6, 6)) : keepPos && i < n - 1 ? randInt(0, 6) : randInt(-6, 6)));
      terms = solveTerms(facs, R);
      if (terms.some((t) => t.A.n === 0 || Math.abs(t.A.n) > 12 || t.A.d > 6)) continue;
      // this mode is for fractional constants: a question whose constants all come out whole is rejected (except a lone monic repeated factor, which can only give whole ones)
      if (!WHOLE_ONLY_FORMS.includes(form) && terms.every((t) => t.A.d === 1)) continue;
    } else {
      terms = termsFor(facs, level === "level1" ? 4 : 5);
      R = numeratorOf(facs, terms);
    }
    const qd = QUOTIENT_DEG[form];
    let N = R, Q: number[] | null = null;
    if (qd !== undefined) {
      Q = Array.from({ length: qd + 1 }, (_, i) => (keepPos ? (i === qd + 0 && qd > 0 ? randInt(-3, 3) : i === 0 ? randInt(1, 3) : randInt(0, 3)) : i === 0 ? nz(-3, 3) : randInt(-3, 3)));
      N = polyAdd(polyMul(Q, prodPoly(facs)), R);
    } else if (level !== "level3" && trim(R).length - 1 < n - 1) continue; // a proper question at Levels 1–2 has a numerator of full degree
    if (R.length < n) while (R.length < n) R.unshift(0);
    if (N.some((c) => Math.abs(c) > 60)) continue;
    if (keepPos && N.slice(0, -1).some((c) => c < 0)) continue;
    // skip if every constant is identical (looks contrived)
    if (terms.length > 1 && terms.every((t) => eqF(t.A, terms[0].A))) continue;
    return { facs, terms, N: trim(N), Q, R: trim(R), shownExpanded: expanded };
  }
  throw new Error("partial fractions: no suitable question found");
}

// ── 7. Working ───────────────────────────────────────────────────────────────

/** Partial fractions of R / D: write, multiply through, substitute each root, equate coefficients, answer. */
function partialSteps(raw: Raw, numer: Poly, short: boolean): WorkingStep[] {
  const { facs, terms } = raw;
  const steps: WorkingStep[] = [];
  const D = prodPoly(facs), n = D.length - 1;
  const numerL = polyL(numer);

  if (raw.shownExpanded) {
    steps.push(mStep("Factorise the denominator:", [polyL(D), `= ${facsL(facs)}`]));
  }
  if (!short) {
    steps.push(mStep("Write as partial fractions:", [`\\dfrac{${numerL}}{${facsL(facs)}}`, `\\equiv ${symbolicL(facs, terms)}`]));
    const rhs = terms.map((t) => { const c = cofL(facs, t.fi, facs[t.fi].m - t.k); return `${t.letter}${c === "1" ? "" : c}`; }).join(" + ");
    steps.push(mStep("Multiply through by the denominator:", [numerL, `\\equiv ${rhs}`]));
  }

  // top power of each factor: substitute the root
  terms.filter((t) => t.k === facs[t.fi].m).forEach((t) => {
    const f = facs[t.fi];
    const r = rootOf(f);
    const left = polyEvalF(numer, r);
    const right = cofSub(facs, t.fi, 0, r);
    const P = polyEvalF(cofactor(facs, t.fi, 0), r);
    if (!eqF(divF(left, P), t.A)) throw new Error("partial fractions: substitution mismatch");
    const coefL = eqF(P, F(1)) ? "" : eqF(P, F(-1)) ? "-" : fracL(P);
    if (short) return;
    // two short steps rather than one long line: the substitution, then the solve (a single line shrinks to nothing on a phone)
    steps.push(mStep(`Let x = ${plainF(r)} (the root of a factor):`, [`${polySub(numer, r)} = ${t.letter}${right === "1" ? "" : right}`]));
    steps.push(mStep(`Solve for ${t.letter}:`, coefL === "" ? [`${t.letter} = ${fracL(t.A)}`] : [`${fracL(left)} = ${coefL}${t.letter}`, `\\Rightarrow ${t.letter} = ${fracL(t.A)}`]));
  });

  // the one constant substitution cannot reach (k = 1 of a repeated factor): equate the coefficient of x^{n-1}
  terms.filter((t) => t.k < facs[t.fi].m).forEach((t) => {
    const nCoef = numer.length - 1 >= n - 1 ? numer[numer.length - n] ?? 0 : 0;
    const items = terms.filter((u) => u.k === 1).map((u) => {
      const lead = cofactor(facs, u.fi, facs[u.fi].m - 1)[0];
      return { u, lead };
    });
    const exp = n - 1 === 0 ? "the constant terms" : n - 1 === 1 ? "x" : n - 1 === 2 ? "x²" : `x^${n - 1}`;
    const unknown = items.find((it) => it.u.letter === t.letter)!;
    const others = items.filter((it) => it !== unknown);
    const sumOthers = others.reduce((acc, it) => addF(acc, mulF(F(it.lead), it.u.A)), F(0));
    const hasOthers = others.length > 0 && sumOthers.n !== 0;
    const leadS = unknown.lead === 1 ? "" : unknown.lead === -1 ? "-" : `${unknown.lead}`;
    const lhs = `${nCoef} = ${leadS}${t.letter}${hasOthers ? ` ${sumOthers.n < 0 ? "-" : "+"} ${fracAbs(sumOthers)}` : ""}`;
    if (!eqF(F(nCoef), addF(mulF(F(unknown.lead), t.A), sumOthers))) throw new Error("partial fractions: coefficient mismatch");
    if (short) return;
    const moved = addF(F(nCoef), mulF(F(-1), sumOthers));
    const solve: string[] = [];
    if (hasOthers) solve.push(`${leadS}${t.letter} = ${fracL(moved)}`);
    if (unknown.lead !== 1) solve.push(`${hasOthers ? "\\Rightarrow " : ""}${t.letter} = ${fracL(t.A)}`);
    steps.push(mStep(`Equate coefficients of ${exp}:`, [lhs]));
    if (solve.length) steps.push(mStep(`Solve for ${t.letter}:`, solve));
  });

  steps.push(mStep("Write the answer:", [`\\dfrac{${numerL}}{${facsL(facs)}}`, `\\equiv ${answerL(facs, terms)}`]));
  return steps;
}

/** Polynomial long division of N by D, one quotient term per step. */
function divisionSteps(raw: Raw): WorkingStep[] {
  const { facs } = raw;
  const D = prodPoly(facs);
  const steps: WorkingStep[] = [];
  if (!raw.shownExpanded) steps.push(mStep("Expand the denominator:", [facsL(facs), `= ${polyL(D)}`]));
  let rem = [...raw.N];
  const Q = raw.Q!;
  Q.forEach((qc, i) => {
    const e = Q.length - 1 - i;
    const term = polyL([qc, ...new Array(e).fill(0)]);
    const prod = polyMul([qc, ...new Array(e).fill(0)], D);
    const next = trim(polyAdd(rem, prod.map((c) => -c)));
    steps.push(mStep("Divide the leading terms, then subtract:", [
      `${polyL(rem)}`,
      `- ${qc < 0 ? `(${term})` : term}(${polyL(D)})`,
      `= ${next.length === 1 && next[0] === 0 ? "0" : polyL(next)}`,
    ]));
    rem = next;
  });
  steps.push(mStep("Write in the form Q + R / denominator:", [
    `\\dfrac{${polyL(raw.N)}}{${polyL(D)}}`,
    `\\equiv ${polyL(Q)} + \\dfrac{${polyL(raw.R)}}{${polyL(D)}}`,
  ]));
  return steps;
}

// ── 8. generateQuestion ──────────────────────────────────────────────────────

const generateQuestion = (
  tool: string, level: DifficultyLevel,
  vars: Record<string, boolean>, dropdownValue: string, multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  const t = tool as SubTool;
  const pools = POOLS[t][level];
  const msv = maskUnmetOptions(pools, resolveMultiSelectValues(pools, multiSelectValues));
  const form = pickActive(msv, pools[0].options) as Form;
  const shown = pickActive(msv, pools[1].options);
  const expanded = shown === "expanded";
  const constants = WHOLE_ONLY_FORMS.includes(form) ? "whole" : pickActive(msv, pools[2].options);
  const raw = makeRaw(level, form, expanded, constants === "fractions", vars.negX === true);
  const { facs, terms } = raw;
  const D = prodPoly(facs);
  const denomL = expanded ? polyL(D) : facsL(facs);
  const short = dropdownValue === "short";

  const working: WorkingStep[] = [];
  if (raw.Q) working.push(...divisionSteps(raw));
  working.push(...partialSteps(raw, raw.R, short));

  const ans = answerL(facs, terms);
  const answerLatex = raw.Q ? `${polyL(raw.Q)} + ${ans.replace(/^-/, "- ")}`.replace(/\+ - /, "- ") : ans;
  const score = weightOf(pools[0].options, form) + weightOf(pools[1].options, shown) + weightOf(pools[2].options, constants);
  const id = Math.floor(Math.random() * 1_000_000);

  return {
    kind: "simple",
    display: `(${polyL(raw.N)}) / (${denomL})`,
    displayLatex: `\\dfrac{${polyL(raw.N)}}{${denomL}}`,
    answer: answerLatex,
    answerLatex,
    working,
    key: `pf-${t}-${level}-${form}-${shown}-${raw.N.join(",")}-${terms.map((x) => `${x.A.n}/${x.A.d}`).join(",")}-${id}`,
    difficulty: level,
    _difficultyScore: score,
    _raw: raw,
  } as unknown as AnyQuestion;
};

// ── 9. Export ─────────────────────────────────────────────────────────────────

export const __test = { TOOL_CONFIG, generateQuestion, helpers: { prodPoly, cofactor, polyEvalF, rootOf, answerL, polyMul, F, addF, mulF, divF, eqF } };

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      defaults={{ numQuestions: 6, numColumns: 2, collapseWorkingByDefault: true }}
    />
  );
}
