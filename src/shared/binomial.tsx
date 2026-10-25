import type { DifficultyLevel, ToolMultiSelect, WorkingStep } from "./types";
import { randInt, pick, mStep } from "./helpers";
import { gcd } from "./math";
export { gcd };

// ═══════════════════════════════════════════════════════════
// Shared maths and display for the three binomial-expansion tools (Binomial Expansion, Binomial Expansion of Fractions, Binomial Expansion with
// Partial Fractions): exact fractions, the binomial series, the range-of-validity number line, and the small helpers their question options share.
// ═══════════════════════════════════════════════════════════

// ── 1. Exact fractions ───────────────────────────────────────────────────────

export interface Fr { n: number; d: number }
export const F = (n: number, d = 1): Fr => { const g = gcd(n, d) || 1; const s = d < 0 ? -1 : 1; return { n: (s * n) / g, d: (s * d) / g }; };
export const add = (a: Fr, b: Fr) => F(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Fr, b: Fr) => add(a, F(-b.n, b.d));
export const mul = (a: Fr, b: Fr) => F(a.n * b.n, a.d * b.d);
export const div = (a: Fr, b: Fr) => F(a.n * b.d, a.d * b.n);
export const neg = (a: Fr) => F(-a.n, a.d);
export const eq = (a: Fr, b: Fr) => a.n === b.n && a.d === b.d;
export const isZero = (a: Fr) => a.n === 0;
export const absF = (a: Fr) => F(Math.abs(a.n), a.d);
export const lt = (a: Fr, b: Fr) => a.n * b.d < b.n * a.d;
export const powI = (a: Fr, e: number): Fr => (e < 0 ? div(F(1), powI(a, -e)) : e === 0 ? F(1) : mul(a, powI(a, e - 1)));
export const toNum = (a: Fr) => a.n / a.d;

/** LaTeX of |a| */
export const frAbsTex = (a: Fr): string => (a.d === 1 ? `${Math.abs(a.n)}` : `\\dfrac{${Math.abs(a.n)}}{${a.d}}`);
/** LaTeX of a (with its sign) */
export const frTex = (a: Fr): string => (a.n < 0 ? "-" : "") + frAbsTex(a);
/** a in a small exponent or bracket: \frac not \dfrac */
export const frSmall = (a: Fr): string => (a.d === 1 ? `${a.n}` : `${a.n < 0 ? "-" : ""}\\frac{${Math.abs(a.n)}}{${a.d}}`);
/** plain text, with a true minus sign (−), for labels */
export const frPlain = (a: Fr): string => (a.d === 1 ? `${a.n}` : `${a.n}/${a.d}`).replace("-", "−");

// ── 2. Binomial series ───────────────────────────────────────────────────────

/** generalised binomial coefficient n(n−1)…(n−r+1)/r! */
function binomCoef(n: Fr, r: number): Fr {
  let c = F(1);
  for (let i = 0; i < r; i++) c = div(mul(c, sub(n, F(i))), F(i + 1));
  return c;
}
/** coefficients of (1 + kx)^n up to x^m */
export const series = (n: Fr, k: Fr, m: number): Fr[] => Array.from({ length: m + 1 }, (_, r) => mul(binomCoef(n, r), powI(k, r)));

/** a^n as an exact fraction (a a positive whole number), or null when it is not rational */
export function powRat(a: number, n: Fr): Fr | null {
  const q = n.d, p = n.n;
  const s = Math.round(Math.pow(a, 1 / q));
  if (Math.pow(s, q) !== a) return null;
  return p >= 0 ? F(Math.pow(s, p)) : F(1, Math.pow(s, -p));
}

// ── 3. LaTeX helpers ─────────────────────────────────────────────────────────

export const xPow = (r: number) => (r === 0 ? "" : r === 1 ? "x" : `x^{${r}}`);
/** a polynomial/series in x from its coefficients (ascending), zero terms skipped */
export function polyTex(cs: Fr[]): string {
  let out = "";
  cs.forEach((c, r) => {
    if (isZero(c)) return;
    const body = r > 0 && Math.abs(c.n) === 1 && c.d === 1 ? xPow(r) : `${frAbsTex(c)}${xPow(r)}`;
    out += out === "" ? `${c.n < 0 ? "-" : ""}${body}` : ` ${c.n < 0 ? "-" : "+"} ${body}`;
  });
  return out === "" ? "0" : out;
}
/** the term list as fragments (first term, then each " + term") so a worked example can reveal it a term at a time */
function polyFrags(cs: Fr[], lead = ""): string[] {
  const out: string[] = [];
  cs.forEach((c, r) => {
    const t = polyTex([...Array.from({ length: r }, () => F(0)), c]);
    if (isZero(c)) return;
    out.push(out.length === 0 ? `${lead}${t}` : ` ${t.startsWith("-") ? "- " + t.slice(1) : "+ " + t}`);
  });
  return out;
}
/** kx as it is written inside a bracket */
export const kxTex = (k: Fr): string => (eq(k, F(1)) ? "x" : eq(k, F(-1)) ? "-x" : `${frTex(k)}x`);
/** a bracket (c + dx) */
export const linTex = (c: Fr, d: Fr): string => `${frTex(c)} ${d.n < 0 ? "-" : "+"} ${eq(absF(d), F(1)) ? "" : frAbsTex(d)}x`;
/** plain-text versions for step labels (a label is prose, never KaTeX) */
/** kx in plain text: x, −x, 3x, −x/3, 2x/3 (the x is never left ambiguous after a fraction) */
export const kxPlain = (k: Fr): string => {
  const top = `${Math.abs(k.n) === 1 ? "" : Math.abs(k.n)}x`;
  return `${k.n < 0 ? "−" : ""}${k.d === 1 ? top : `${top}/${k.d}`}`;
};
/** a multiplying constant written in front of a bracket: nothing for 1, a minus for −1 (never "1(…)") */
export const coefPre = (c: Fr): string => (eq(c, F(1)) ? "" : eq(c, F(-1)) ? "-" : frTex(c));
/** "|kx| < 1 ⇒ |x| < bound"; for k = 1 that is already the answer, so just |x| < bound (never "|x| < 1 ⇒ |x| < 1") */
export const condTex = (k: Fr, bound: Fr): string => (eq(k, F(1)) ? modLt(bound) : `\\left|${kxTex(k)}\\right| < 1 \\Rightarrow ${modLt(bound)}`);
export const modLt = (bound: Fr): string => `\\left|x\\right| < ${frTex(bound)}`;

/** the r-th term of the binomial formula with n and u = kx substituted */
export function termSubst(n: Fr, r: number, kx: string): string {
  const u = r === 1 ? `(${kx})` : `(${kx})^{${r}}`;
  if (r === 1) return `(${frSmall(n)})${u}`;
  const top = Array.from({ length: r }, (_, i) => `(${frSmall(sub(n, F(i)))})`).join("");
  return `\\dfrac{${top}}{${r}!}${u}`;
}
// ── 4. The number-line visual (range of validity) ────────────────────────────

interface IntervalRow { label: string; c: number; plain: string }
interface IntervalExtra { kind: "binInterval"; rows: IntervalRow[]; overlap?: boolean }

function IntervalLine({ rows, overlap }: IntervalExtra) {
  const R = Math.max(...rows.map((r) => r.c)) * 1.35;
  const W = 520, H = 22 + rows.length * 46 + (overlap ? 46 : 0), L = 30, span = W - 2 * L;
  const x = (v: number) => L + ((v + R) / (2 * R)) * span;
  const Line = ({ y, c, tone, label }: { y: number; c: number; tone: string; label: string }) => (
    <g>
      <line x1={L} y1={y} x2={W - L} y2={y} stroke="#94a3b8" strokeWidth={1.4} />
      <rect x={x(-c)} y={y - 7} width={x(c) - x(-c)} height={14} fill={tone} fillOpacity={0.28} />
      <line x1={x(-c)} y1={y} x2={x(c)} y2={y} stroke={tone} strokeWidth={3} />
      <circle cx={x(-c)} cy={y} r={5} fill="#fff" stroke={tone} strokeWidth={2} />
      <circle cx={x(c)} cy={y} r={5} fill="#fff" stroke={tone} strokeWidth={2} />
      <line x1={x(0)} y1={y - 4} x2={x(0)} y2={y + 4} stroke="#475569" strokeWidth={1.4} />
      <text x={x(-c)} y={y + 20} textAnchor="middle" fontSize={11} fill="#334155">{`−${label}`}</text>
      <text x={x(c)} y={y + 20} textAnchor="middle" fontSize={11} fill="#334155">{label}</text>
      <text x={x(0)} y={y + 20} textAnchor="middle" fontSize={11} fill="#64748b">0</text>
    </g>
  );
  const smallest = rows.reduce((m, r) => (r.c < m.c ? r : m), rows[0]);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ display: "block", width: "100%", maxWidth: 560, height: "auto", margin: "0 auto" }} role="img" aria-label="range of x">
      {rows.map((r, i) => <Line key={i} y={24 + i * 46} c={r.c} tone="#1e3a8a" label={r.plain} />)}
      {overlap && <Line y={24 + rows.length * 46} c={smallest.c} tone="#16a34a" label={smallest.plain} />}
    </svg>
  );
}

export const stepVisual = (s: WorkingStep): JSX.Element | null => {
  const ex = s.extra as IntervalExtra | undefined;
  if (ex?.kind !== "binInterval") return null;
  return <div className="w-full py-2"><IntervalLine {...ex} /></div>;
};
export const withExtra = (st: WorkingStep, extra: IntervalExtra): WorkingStep => ({ ...st, extra });


// ── option helpers shared by the three tools ─────────────────────
export const opt = (value: string, label: string, defaultActive = true) => ({ value, label, defaultActive });
export const pool = (key: string, label: string, options: ToolMultiSelect["options"]): ToolMultiSelect => ({ key, label, options });
export const askPool = (_level: DifficultyLevel) => pool("ask", "Ask for", [
  opt("expansion", "The expansion", true),
  opt("range", "Expansion and range", false),
  opt("coef", "One coefficient", false),
]);
export const toPool = (level: DifficultyLevel) => pool("upTo", "Expand up to", [
  opt("x2", "x²", level !== "level2"),
  opt("x3", "x³", level !== "level1"),
  opt("x4", "x⁴*", false),
]);
export const entry = (name: string, pools: Record<DifficultyLevel, ToolMultiSelect[]>, levelLabels: string[], instruction?: string) => ({
  name, instruction, levelLabels,
  variables: [], dropdown: null,
  difficultySettings: {
    level1: { variables: [], dropdown: null, multiSelect: pools.level1 },
    level2: { variables: [], dropdown: null, multiSelect: pools.level2 },
    level3: { variables: [], dropdown: null, multiSelect: pools.level3 },
  },
});


// ── question helpers ────────────────────────────────────────────
export interface Binom { a: number; b: Fr; n: Fr } // (a + bx)^n, a a positive whole number
export const bracketTex = (bn: Binom): string => (bn.a === 1 ? `1 ${bn.b.n < 0 ? "-" : "+"} ${eq(absF(bn.b), F(1)) ? "" : frAbsTex(bn.b)}x` : linTex(F(bn.a), bn.b));
export const powerTex = (bn: Binom): string => `\\left(${bracketTex(bn)}\\right)^{${frSmall(bn.n)}}`;
export const upToOf = (v: string) => (v === "x4" ? 4 : v === "x3" ? 3 : 2);
export const rangeText = (c: Fr) => `valid for |x| < ${frPlain(c)} (−${frPlain(c)} < x < ${frPlain(c)})`;
/** the power (a + bx)ⁿ written as a root or a reciprocal where that is the natural way (√, ∛, 1/…), or as a power */
/** a positive fractional power p/q as a root: √, ∛, ⁴√, ⁵√ … (p > 1 puts the bracket to the power p inside) */
export function rootTex(inner: string, n: Fr): string {
  const body = n.n === 1 ? inner : `\\left(${inner}\\right)^{${n.n}}`;
  return n.d === 2 ? `\\sqrt{${body}}` : `\\sqrt[${n.d}]{${body}}`;
}
export function powerWritten(inner: string, n: Fr, root: boolean): string {
  const br = `\\left(${inner}\\right)`;
  if (root) {
    if (n.d >= 4) return n.n > 0 ? rootTex(inner, n) : `\\dfrac{1}{${rootTex(inner, neg(n))}}`;
    if (eq(n, F(1, 2))) return `\\sqrt{${inner}}`;
    if (eq(n, F(-1, 2))) return `\\dfrac{1}{\\sqrt{${inner}}}`;
    if (eq(n, F(1, 3))) return `\\sqrt[3]{${inner}}`;
    if (eq(n, F(-1))) return `\\dfrac{1}{${inner}}`;
    if (n.d === 1 && n.n < 0) return `\\dfrac{1}{${br}^{${-n.n}}}`;
    if (eq(n, F(-3, 2))) return `\\dfrac{1}{${br}^{\\frac{3}{2}}}`;
  }
  return `${br}^{${frSmall(n)}}`;
}
/** a bracket as the question writes it: constant first when it is 1, descending (highest power first) for a numerator */
export const ascTex = (c: number, d: Fr): string => (c === 1 ? `1 ${d.n < 0 ? "-" : "+"} ${eq(absF(d), F(1)) ? "" : frAbsTex(d)}x` : linTex(F(c), d));
export const descTex = (c: number, d: Fr): string => linTex(F(c), d); // a LINEAR numerator is written constant first (3 − x, not −x + 3); quadratics and above are written highest power first
export const isPosInt = (n: Fr) => n.d === 1 && n.n >= 0;
export const nonZero = (lo: number, hi: number): number => { let v = 0; while (v === 0) v = randInt(lo, hi); return v; };

// The power n is two selectors: its sign (Positive / Negative) and its size (Whole · Standard fractions ½ ⅓ 3/2 · Extended fractions ¼ ¾ ⅕ to ⅘).
// Positive whole powers are Year 1, so Whole needs Negative. A selector with one option is never shown.
export const signPool = pool("powerSign", "Sign of n", [opt("positive", "Positive"), opt("negative", "Negative")]);
export const sizePool = (_level: DifficultyLevel) => pool("powerSize", "Size of n", [
  { ...opt("whole", "Whole"), requires: ["negative"] }, opt("standard", "½, ⅓, 3/2"), opt("extended", "¼ to ⅘*", false),
]);
const WHOLE: Record<DifficultyLevel, number[]> = { level1: [1, 2, 3, 4, 5], level2: [1, 2, 3, 4], level3: [1, 2, 3] };
const STANDARD: Fr[] = [F(1, 2), F(3, 2), F(1, 3)];
const EXTENDED: Fr[] = [F(1, 4), F(3, 4), F(1, 5), F(2, 5), F(3, 5), F(4, 5)];
/** n from the ticked sign and size; negatives of every fraction are included */
export function nPick(sizes: string[], signs: string[], level: DifficultyLevel): Fr {
  const all: Fr[] = [];
  if (sizes.includes("whole") && signs.includes("negative")) all.push(...WHOLE[level].map((w) => F(-w)));
  const fr = [...(sizes.includes("standard") ? STANDARD : []), ...(sizes.includes("extended") ? EXTENDED : [])];
  for (const f of fr) { if (signs.includes("positive")) all.push(f); if (signs.includes("negative")) all.push(neg(f)); }
  return all.length ? pick(all) : F(-1);
}

/** the working for expanding (a + bx)ⁿ up to xᵐ: take out a, expand, simplify, multiply back, and the range */
export function expandWorking(bn: Binom, m: number): { steps: WorkingStep[]; answer: Fr[]; k: Fr; bound: Fr; mult: Fr } {
  const { a, b, n } = bn;
  const k = div(b, F(a));
  const mult = a === 1 ? F(1) : (powRat(a, n) as Fr);
  const core = series(n, k, m);
  const full = core.map((c) => mul(c, mult));
  const bound = absF(div(F(a), b));
  const steps: WorkingStep[] = [];
  const kBracket = `\\left(1 ${k.n < 0 ? "-" : "+"} ${eq(absF(k), F(1)) ? "" : frAbsTex(absF(k))}x\\right)^{${frSmall(n)}}`;
  if (a !== 1) {
    steps.push(mStep(`Take out ${a}:`, [
      `\\left(${linTex(F(a), b)}\\right)^{${frSmall(n)}}`,
      ` = ${frTex(mult)}${kBracket}`,
    ]));
  }
  const kx = kxTex(k);
  steps.push(mStep(`Expand, with n = ${frPlain(n)}, u = ${kxPlain(k)}:`, [
    kBracket,
    ` = 1 + ${termSubst(n, 1, kx)}`,
    ...Array.from({ length: m - 1 }, (_, i) => ` + ${termSubst(n, i + 2, kx)}`),
  ]));
  steps.push(mStep("Simplify:", polyFrags(core, "= ")));
  if (a !== 1) steps.push(mStep(`Multiply by ${frPlain(mult)}:`, [`${frTex(mult)}\\left(${polyTex(core)}\\right)`, ` = ${polyTex(full)}`]));
  steps.push(withExtra(mStep("Valid for |u| < 1:", [condTex(k, bound)]), { kind: "binInterval", rows: [{ label: modLt(bound), c: toNum(bound), plain: frPlain(bound) }] }));
  return { steps, answer: full, k, bound, mult };
}
