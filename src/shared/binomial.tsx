import type { DifficultyLevel, ToolMultiSelect, WorkingStep } from "./types";
import { randInt } from "./helpers";

// ═══════════════════════════════════════════════════════════
// Shared maths and display for the three binomial-expansion tools (Binomial Expansion, Binomial Expansion of Fractions, Binomial Expansion with
// Partial Fractions): exact fractions, the binomial series, the range-of-validity number line, and the small helpers their question options share.
// ═══════════════════════════════════════════════════════════

// ── 1. Exact fractions ───────────────────────────────────────────────────────

export interface Fr { n: number; d: number }
export const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
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
export const frPlain = (a: Fr): string => (a.d === 1 ? `${a.n}` : `${a.n}/${a.d}`);

// ── 2. Binomial series ───────────────────────────────────────────────────────

/** generalised binomial coefficient n(n−1)…(n−r+1)/r! */
export function binomCoef(n: Fr, r: number): Fr {
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
export function polyFrags(cs: Fr[], lead = ""): string[] {
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
export const kxPlain = (k: Fr): string => (eq(k, F(1)) ? "x" : eq(k, F(-1)) ? "−x" : `${frPlain(k)}x`);
export const modLt = (bound: Fr): string => `\\left|x\\right| < ${frTex(bound)}`;

/** the r-th term of the binomial formula with n and u = kx substituted */
export function termSubst(n: Fr, r: number, kx: string): string {
  const u = r === 1 ? `(${kx})` : `(${kx})^{${r}}`;
  if (r === 1) return `(${frSmall(n)})${u}`;
  const top = Array.from({ length: r }, (_, i) => `(${frSmall(sub(n, F(i)))})`).join("");
  return `\\dfrac{${top}}{${r}!}${u}`;
}
// ── 4. The number-line visual (range of validity) ────────────────────────────

export interface IntervalRow { label: string; c: number; plain: string }
export interface IntervalExtra { kind: "binInterval"; rows: IntervalRow[]; overlap?: boolean }

export function IntervalLine({ rows, overlap }: IntervalExtra) {
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
export const pool = (key: string, label: string, options: ToolMultiSelect["options"]): ToolMultiSelect => ({ key, label, plainDisplay: true, options });
export const askPool = (level: DifficultyLevel) => pool("ask", "Ask for", [
  opt("expansion", "The expansion", level !== "level2"),
  opt("range", "Expansion and range", true),
  opt("coef", "One coefficient", level === "level2"),
]);
export const toPool = (level: DifficultyLevel) => pool("upTo", "Expand up to", [
  opt("x2", "x²", level !== "level2"),
  opt("x3", "x³", level !== "level1"),
  opt("x4", "x⁴", false),
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
export function powerWritten(inner: string, n: Fr, root: boolean): string {
  const br = `\\left(${inner}\\right)`;
  if (root) {
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
export const descTex = (c: number, d: Fr): string => `${eq(d, F(1)) ? "" : eq(d, F(-1)) ? "-" : frTex(d)}x ${c < 0 ? "-" : "+"} ${Math.abs(c)}`;
export const isPosInt = (n: Fr) => n.d === 1 && n.n >= 0;
export const nonZero = (lo: number, hi: number): number => { let v = 0; while (v === 0) v = randInt(lo, hi); return v; };
