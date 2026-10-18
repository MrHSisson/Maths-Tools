import {
  ToolShell, resolveMultiSelectValues,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type WorkingStep, type ToolMultiSelect,
  randInt, pick, mStep, pickActive,
} from "../../shared";

// ═══════════════════════════════════════════════════════════
// Binomial expansion (A-Level Mathematics, AQA 7357, Year 2) — expand (a + bx)^n for any rational n, give the range of validity, use it to
// approximate, and expand a fraction by writing it in partial fractions first. Everything is exact (rational arithmetic).
//   Expand (a + bx)ⁿ        — (1 + kx)ⁿ, then (a + bx)ⁿ taking aⁿ out; the range |bx/a| < 1
//   With partial fractions  — N(x)/D(x): partial fractions, expand each term, collect, take the smaller range (spec: specs/binomial-expansion.md)
//   Approximation           — use a small x in the expansion to estimate a value; say when an x cannot be used
// ═══════════════════════════════════════════════════════════

// ── 1. Exact fractions ───────────────────────────────────────────────────────

interface Fr { n: number; d: number }
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const F = (n: number, d = 1): Fr => { const g = gcd(n, d) || 1; const s = d < 0 ? -1 : 1; return { n: (s * n) / g, d: (s * d) / g }; };
const add = (a: Fr, b: Fr) => F(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a: Fr, b: Fr) => add(a, F(-b.n, b.d));
const mul = (a: Fr, b: Fr) => F(a.n * b.n, a.d * b.d);
const div = (a: Fr, b: Fr) => F(a.n * b.d, a.d * b.n);
const neg = (a: Fr) => F(-a.n, a.d);
const eq = (a: Fr, b: Fr) => a.n === b.n && a.d === b.d;
const isZero = (a: Fr) => a.n === 0;
const absF = (a: Fr) => F(Math.abs(a.n), a.d);
const lt = (a: Fr, b: Fr) => a.n * b.d < b.n * a.d;
const powI = (a: Fr, e: number): Fr => (e < 0 ? div(F(1), powI(a, -e)) : e === 0 ? F(1) : mul(a, powI(a, e - 1)));
const toNum = (a: Fr) => a.n / a.d;

/** LaTeX of |a| */
const frAbsTex = (a: Fr): string => (a.d === 1 ? `${Math.abs(a.n)}` : `\\dfrac{${Math.abs(a.n)}}{${a.d}}`);
/** LaTeX of a (with its sign) */
const frTex = (a: Fr): string => (a.n < 0 ? "-" : "") + frAbsTex(a);
/** a in a small exponent or bracket: \frac not \dfrac */
const frSmall = (a: Fr): string => (a.d === 1 ? `${a.n}` : `${a.n < 0 ? "-" : ""}\\frac{${Math.abs(a.n)}}{${a.d}}`);
const frPlain = (a: Fr): string => (a.d === 1 ? `${a.n}` : `${a.n}/${a.d}`);

// ── 2. Binomial series ───────────────────────────────────────────────────────

/** generalised binomial coefficient n(n−1)…(n−r+1)/r! */
function binomCoef(n: Fr, r: number): Fr {
  let c = F(1);
  for (let i = 0; i < r; i++) c = div(mul(c, sub(n, F(i))), F(i + 1));
  return c;
}
/** coefficients of (1 + kx)^n up to x^m */
const series = (n: Fr, k: Fr, m: number): Fr[] => Array.from({ length: m + 1 }, (_, r) => mul(binomCoef(n, r), powI(k, r)));

/** a^n as an exact fraction (a a positive whole number), or null when it is not rational */
function powRat(a: number, n: Fr): Fr | null {
  const q = n.d, p = n.n;
  const s = Math.round(Math.pow(a, 1 / q));
  if (Math.pow(s, q) !== a) return null;
  return p >= 0 ? F(Math.pow(s, p)) : F(1, Math.pow(s, -p));
}

// ── 3. LaTeX helpers ─────────────────────────────────────────────────────────

const xPow = (r: number) => (r === 0 ? "" : r === 1 ? "x" : `x^{${r}}`);
/** a polynomial/series in x from its coefficients (ascending), zero terms skipped */
function polyTex(cs: Fr[]): string {
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
const kxTex = (k: Fr): string => (eq(k, F(1)) ? "x" : eq(k, F(-1)) ? "-x" : `${frTex(k)}x`);
/** a bracket (c + dx) */
const linTex = (c: Fr, d: Fr): string => `${frTex(c)} ${d.n < 0 ? "-" : "+"} ${eq(absF(d), F(1)) ? "" : frAbsTex(d)}x`;
/** plain-text versions for step labels (a label is prose, never KaTeX) */
const kxPlain = (k: Fr): string => (eq(k, F(1)) ? "x" : eq(k, F(-1)) ? "−x" : `${frPlain(k)}x`);
const linPlain = (c: Fr, d: Fr): string => `${frPlain(c)} ${d.n < 0 ? "−" : "+"} ${eq(absF(d), F(1)) ? "" : frPlain(absF(d))}x`;
const modLt = (bound: Fr): string => `\\left|x\\right| < ${frTex(bound)}`;

/** the r-th term of the binomial formula with n and u = kx substituted */
function termSubst(n: Fr, r: number, kx: string): string {
  const u = r === 1 ? `(${kx})` : `(${kx})^{${r}}`;
  if (r === 1) return `(${frSmall(n)})${u}`;
  const top = Array.from({ length: r }, (_, i) => `(${frSmall(sub(n, F(i)))})`).join("");
  return `\\dfrac{${top}}{${r}!}${u}`;
}
const FACT_LABEL = (r: number) => `${r}!`;
function formulaFrags(m: number): string[] {
  const out = ["(1+u)^{n} = 1 + nu"];
  for (let r = 2; r <= m; r++) out.push(` + \\dfrac{${Array.from({ length: r }, (_, i) => (i === 0 ? "n" : `(n-${i})`)).join("")}}{${FACT_LABEL(r)}}u^{${r}}`);
  return out;
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

const stepVisual = (s: WorkingStep): JSX.Element | null => {
  const ex = s.extra as IntervalExtra | undefined;
  if (ex?.kind !== "binInterval") return null;
  return <div className="w-full py-2"><IntervalLine {...ex} /></div>;
};
const withExtra = (st: WorkingStep, extra: IntervalExtra): WorkingStep => ({ ...st, extra });

// ── 5. TOOL_CONFIG ──────────────────────────────────────────────────────────

type SubTool = "expand" | "partial" | "approx";
const opt = (value: string, label: string, defaultActive = true) => ({ value, label, defaultActive });
const pool = (key: string, label: string, options: ToolMultiSelect["options"]): ToolMultiSelect => ({ key, label, plainDisplay: true, options });

const nPool = (level: DifficultyLevel) => pool("power", "Power n", [
  opt("neg", level === "level1" ? "−1, −2" : "−1, −2, −3"),
  opt("half", "½, −½"),
  ...(level === "level1" ? [] : [opt("three", "3/2, −3/2, ⅓", level === "level3")]),
]);
const kPool = (level: DifficultyLevel) => pool("kForm", "Coefficient of x", level === "level1"
  ? [opt("whole", "Whole numbers")]
  : [opt("posWhole", "Positive whole", false), opt("negWhole", "Negative whole"), opt("frac", "Simple fractions")]);
const askPool = (level: DifficultyLevel) => pool("ask", "Ask for", [
  opt("expansion", "The expansion", level !== "level2"),
  opt("range", "Expansion and range", true),
  opt("coef", "One coefficient", level === "level2"),
]);
const toPool = (level: DifficultyLevel) => pool("upTo", "Expand up to", [
  opt("x2", "x²", level !== "level2"),
  opt("x3", "x³", level !== "level1"),
  opt("x4", "x⁴", false),
]);

const EXPAND_POOLS: Record<DifficultyLevel, ToolMultiSelect[]> = {
  level1: [nPool("level1"), kPool("level1"), askPool("level1"), toPool("level1")],
  level2: [nPool("level2"), kPool("level2"), askPool("level2"), toPool("level2")],
  level3: [nPool("level3"), askPool("level3"), toPool("level3")],
};

const formPool = (level: DifficultyLevel): ToolMultiSelect[] => level === "level1" ? [] : [pool("denom", "Denominator", level === "level2"
  ? [opt("scaled", "(c + dx)(e + fx)")]
  : [opt("repeated", "A repeated factor"), opt("improper", "Divide first")])];
const numPool = (level: DifficultyLevel): ToolMultiSelect[] => level === "level3" ? [] : [pool("numer", "Numerator", [opt("linear", "Linear"), opt("constant", "Constant", false)])];
const PARTIAL_POOLS: Record<DifficultyLevel, ToolMultiSelect[]> = {
  level1: [...numPool("level1"), pool("upTo", "Expand up to", [opt("x2", "x²"), opt("x3", "x³", false)]), pool("ask", "Ask for", [opt("expansion", "The expansion", false), opt("range", "Expansion and range"), opt("coef", "One coefficient", false)])],
  level2: [...formPool("level2"), ...numPool("level2"), pool("upTo", "Expand up to", [opt("x2", "x²", false), opt("x3", "x³")]), pool("ask", "Ask for", [opt("expansion", "The expansion", false), opt("range", "Expansion and range"), opt("coef", "One coefficient", false)])],
  level3: [...formPool("level3"), pool("upTo", "Expand up to", [opt("x2", "x²"), opt("x3", "x³")]), pool("ask", "Ask for", [opt("expansion", "The expansion", false), opt("range", "Expansion and range"), opt("coef", "One coefficient", false)])],
};

const APPROX_POOLS: Record<DifficultyLevel, ToolMultiSelect[]> = {
  level1: [pool("ask", "Ask for", [opt("use", "Estimate a value")])],
  level2: [pool("ask", "Ask for", [opt("use", "Estimate a value")])],
  level3: [pool("ask", "Ask for", [opt("use", "Estimate a value"), opt("valid", "Can this x be used?")])],
};

const entry = (name: string, pools: Record<DifficultyLevel, ToolMultiSelect[]>, instruction?: string) => ({
  name, instruction,
  variables: [], dropdown: null,
  difficultySettings: {
    level1: { variables: [], dropdown: null, multiSelect: pools.level1 },
    level2: { variables: [], dropdown: null, multiSelect: pools.level2 },
    level3: { variables: [], dropdown: null, multiSelect: pools.level3 },
  },
});

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Binomial Expansion",
  tools: {
    expand: entry("Expand (a + bx)ⁿ", EXPAND_POOLS),
    partial: entry("With partial fractions", PARTIAL_POOLS),
    approx: entry("Approximation", APPROX_POOLS),
  },
};

// ── 6. INFO_SECTIONS ─────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  { title: "Scope", icon: "🎯", content: [
    { label: "A-level Mathematics", detail: "Matches AQA A-level Mathematics (7357), Year 2: the binomial expansion of (a + bx)ⁿ for any rational n, its range of validity, using it to approximate, and expanding a fraction by writing it in partial fractions first. Positive whole-number n (Year 1) and integration are not covered." },
    { label: "Range of validity", detail: "Always written in modulus form, |x| < c; the answer also gives −c < x < c." },
  ]},
  { title: "Expand (a + bx)ⁿ", icon: "🔢", content: [
    { label: "The formula", detail: "(1 + u)ⁿ = 1 + nu + n(n − 1)/2! u² + n(n − 1)(n − 2)/3! u³ + …, valid for |u| < 1. Put u = kx." },
    { label: "Level 1 — Green", detail: "(1 + kx)ⁿ with whole k and n = −1, −2, ½ or −½, up to x²." },
    { label: "Level 2 — Yellow", detail: "Negative or fractional k, n also −3, 3/2, −3/2 or ⅓, up to x³; a single coefficient can be asked for." },
    { label: "Level 3 — Red", detail: "(a + bx)ⁿ with a ≠ 1: take aⁿ out first, (a + bx)ⁿ = aⁿ(1 + (b/a)x)ⁿ, valid for |x| < |a/b|." },
  ]},
  { title: "With partial fractions", icon: "➗", content: [
    { label: "The chain", detail: "Write N(x)/D(x) in partial fractions, write each as a constant × (1 + kx)ⁿ, expand each term, add the coefficients of each power, then state the range." },
    { label: "Range", detail: "Each fraction has its own range. The expansion of the sum is valid only where all of them are, so take the smaller (the number line shows each range and the overlap)." },
    { label: "Level 1 — Green", detail: "(1 + ax)(1 + bx), a linear (or constant) numerator, up to x²." },
    { label: "Level 2 — Yellow", detail: "Factors with a constant other than 1, such as (2 − x)(1 + 3x), up to x³." },
    { label: "Level 3 — Red", detail: "A repeated factor, or a numerator of degree 2 that is divided first." },
  ]},
  { title: "Approximation", icon: "🎯", content: [
    { label: "Method", detail: "Substitute a small x into the expansion to estimate a value, then compare with a calculator." },
    { label: "Level 1 — Green", detail: "The expansion is given; substitute x." },
    { label: "Level 2 — Yellow", detail: "Find the expansion of (1 + kx)ⁿ, then use it." },
    { label: "Level 3 — Red", detail: "(a + bx)ⁿ with a ≠ 1, and questions asking why a given x cannot be used." },
  ]},
];

// ── 7. Expand (a + bx)^n ─────────────────────────────────────────────────────

interface Binom { a: number; b: Fr; n: Fr } // (a + bx)^n, a a positive whole number

const nPick = (form: string, level: DifficultyLevel): Fr =>
  form === "half" ? pick([F(1, 2), F(-1, 2)]) : form === "three" ? pick([F(3, 2), F(-3, 2), F(1, 3)]) : pick(level === "level1" ? [F(-1), F(-2)] : [F(-1), F(-2), F(-3)]);

/** a for which a^n is rational: a perfect square/cube for fractional powers, 2–5 for whole powers */
const aPick = (n: Fr): number => (n.d === 1 ? pick([2, 3, 4, 5]) : n.d === 2 ? pick([4, 9]) : pick([8, 27]));

function pickK(kForm: string): Fr {
  if (kForm === "frac") return pick([F(1, 2), F(-1, 2), F(1, 3), F(-1, 3), F(2, 3), F(-2, 3), F(3, 2), F(-3, 2)]);
  if (kForm === "negWhole") return F(-randInt(1, 4));
  if (kForm === "posWhole") return F(randInt(2, 5));
  return F(pick([1, 2, 3, -1, -2, -3]));
}

const bracketTex = (bn: Binom): string => (bn.a === 1 ? `1 ${bn.b.n < 0 ? "-" : "+"} ${eq(absF(bn.b), F(1)) ? "" : frAbsTex(bn.b)}x` : linTex(F(bn.a), bn.b));
const powerTex = (bn: Binom): string => `\\left(${bracketTex(bn)}\\right)^{${frSmall(bn.n)}}`;
const upToOf = (v: string) => (v === "x4" ? 4 : v === "x3" ? 3 : 2);

function expandWorking(bn: Binom, m: number, ask: string): { steps: WorkingStep[]; answer: Fr[]; k: Fr; bound: Fr; mult: Fr } {
  const { a, b, n } = bn;
  const k = div(b, F(a));
  const mult = a === 1 ? F(1) : (powRat(a, n) as Fr);
  const core = series(n, k, m);
  const full = core.map((c) => mul(c, mult));
  const bound = absF(div(F(a), b));
  const steps: WorkingStep[] = [];
  steps.push(mStep("The binomial expansion for any rational n:", formulaFrags(m)));
  if (a !== 1) {
    steps.push(mStep(`Take ${a} out of the bracket so it starts with 1:`, [
      `\\left(${linTex(F(a), b)}\\right)^{${frSmall(n)}}`,
      ` = ${a}^{${frSmall(n)}}\\left(1 ${k.n < 0 ? "-" : "+"} ${eq(absF(k), F(1)) ? "" : frAbsTex(absF(k))}x\\right)^{${frSmall(n)}}`,
      ` = ${frTex(mult)}\\left(1 ${k.n < 0 ? "-" : "+"} ${eq(absF(k), F(1)) ? "" : frAbsTex(absF(k))}x\\right)^{${frSmall(n)}}`,
    ]));
  }
  const kx = kxTex(k);
  steps.push(mStep(`Here n = ${frPlain(n)} and u = ${kxPlain(k)}:`, [
    `\\left(1 ${k.n < 0 ? "-" : "+"} ${eq(absF(k), F(1)) ? "" : frAbsTex(absF(k))}x\\right)^{${frSmall(n)}}`,
    ` = 1 + ${termSubst(n, 1, kx)}`,
    ...Array.from({ length: m - 1 }, (_, i) => ` + ${termSubst(n, i + 2, kx)}`),
  ]));
  steps.push(mStep("Simplify each term:", polyFrags(core, "= ")));
  if (a !== 1) steps.push(mStep(`Multiply every term by ${frPlain(mult)}:`, [`${frTex(mult)}\\left(${polyTex(core)}\\right)`, ` = ${polyTex(full)}`]));
  steps.push(withExtra(mStep(`The expansion is valid when |u| < 1:`, [`\\left|${kx}\\right| < 1`, ` \\Rightarrow ${modLt(bound)}`]), { kind: "binInterval", rows: [{ label: modLt(bound), c: toNum(bound), plain: frPlain(bound) }] }));
  if (ask === "coef") steps.push(mStep(`The coefficient of x${m === 1 ? "" : m === 2 ? "²" : m === 3 ? "³" : "⁴"} is:`, [frTex(full[m])]));
  else steps.push(mStep("Write the answer:", polyFrags(full, "")));
  return { steps, answer: full, k, bound, mult };
}

const superscript = (m: number) => (m === 2 ? "²" : m === 3 ? "³" : "⁴");
const rangeText = (c: Fr) => `valid for |x| < ${frPlain(c)} (−${frPlain(c)} < x < ${frPlain(c)})`;

function expandQuestion(level: DifficultyLevel, msv: Record<string, boolean>): AnyQuestion {
  const pools = EXPAND_POOLS[level];
  const form = pickActive(msv, pools[0].options);
  const n = nPick(form, level);
  const ask = pickActive(msv, pools.find((p) => p.key === "ask")!.options);
  const m = upToOf(pickActive(msv, pools.find((p) => p.key === "upTo")!.options));
  let bn: Binom;
  if (level === "level3") {
    const a = aPick(n);
    let b = randInt(1, 4) * pick([1, -1]);
    if (Math.abs(b) === a && Math.random() < 0.5) b = b + 1;
    bn = { a, b: F(b), n };
  } else bn = { a: 1, b: pickK(pickActive(msv, pools[1].options)), n };
  const { steps, answer, bound } = expandWorking(bn, m, ask);
  const expr = powerTex(bn);
  const lines = ask === "coef"
    ? [`Find the coefficient of $x^{${m}}$ in the binomial expansion of $${expr}$ in ascending powers of $x$.`]
    : [`Find the binomial expansion of $${expr}$ in ascending powers of $x$, up to and including the term in $x^{${m}}$.`,
       ...(ask === "range" ? ["State the range of values of $x$ for which the expansion is valid."] : [])];
  const id = Math.floor(Math.random() * 1_000_000);
  const ansLatex = ask === "coef" ? frTex(answer[m]) : polyTex(answer);
  return {
    kind: "worded", lines,
    answer: ask === "coef" ? frPlain(answer[m]) : polyTex(answer),
    answerLatex: ansLatex,
    answerSuffix: ask === "range" ? `, ${rangeText(bound)}` : undefined,
    working: steps,
    key: `be-expand-${level}-${frPlain(bn.n)}-${bn.a}-${frPlain(bn.b)}-${m}-${ask}-${id}`,
    difficulty: level,
    _raw: { bn, m, ask },
  } as unknown as AnyQuestion;
}

// ── 8. With partial fractions ────────────────────────────────────────────────

/** a linear factor (c + dx), raised to m (1 or 2) */
interface Fac { c: Fr; d: Fr; m: 1 | 2 }
/** one partial fraction: A / (c + dx)^p */
interface PTerm { fi: number; p: 1 | 2; letter: string; A: Fr }
interface PRaw { facs: Fac[]; terms: PTerm[]; N: Fr[]; Q: Fr | null; improper: boolean }

type Poly = Fr[]; // ascending
const pMul = (a: Poly, b: Poly): Poly => { const out = Array.from({ length: a.length + b.length - 1 }, () => F(0)); a.forEach((x, i) => b.forEach((y, j) => { out[i + j] = add(out[i + j], mul(x, y)); })); return out; };
const pAdd = (a: Poly, b: Poly): Poly => Array.from({ length: Math.max(a.length, b.length) }, (_, i) => add(a[i] ?? F(0), b[i] ?? F(0)));
const pScale = (a: Poly, s: Fr): Poly => a.map((x) => mul(x, s));
const pEval = (a: Poly, x: Fr): Fr => a.reduceRight((acc, c) => add(mul(acc, x), c), F(0));
const facPoly = (f: Fac): Poly => (f.m === 2 ? pMul([f.c, f.d], [f.c, f.d]) : [f.c, f.d]);
const denomPoly = (facs: Fac[]): Poly => facs.reduce<Poly>((acc, f) => pMul(acc, facPoly(f)), [F(1)]);
const trimP = (a: Poly): Poly => { const o = [...a]; while (o.length > 1 && isZero(o[o.length - 1])) o.pop(); return o; };

/** the numerator that gives these partial fractions over these factors (plus Q × denominator when improper) */
function numeratorOf(facs: Fac[], terms: PTerm[], Q: Fr | null): Poly {
  let N: Poly = [F(0)];
  for (const t of terms) {
    let piece: Poly = [t.A];
    facs.forEach((f, j) => { const left = j === t.fi ? f.m - t.p : f.m; for (let i = 0; i < left; i++) piece = pMul(piece, [f.c, f.d]); });
    N = pAdd(N, piece);
  }
  if (Q) N = pAdd(N, pScale(denomPoly(facs), Q));
  return trimP(N);
}

/** the series of N/D up to x^m by dividing term by term (an independent route used to check the partial-fraction result) */
function seriesDivide(N: Poly, D: Poly, m: number): Fr[] {
  const out: Fr[] = [];
  for (let r = 0; r <= m; r++) {
    let acc = N[r] ?? F(0);
    for (let i = 1; i <= r; i++) acc = sub(acc, mul(D[i] ?? F(0), out[r - i]));
    out.push(div(acc, D[0]));
  }
  return out;
}

const nonZero = (lo: number, hi: number): number => { let v = 0; while (v === 0) v = randInt(lo, hi); return v; };

function makePartial(level: DifficultyLevel, form: string, numer: string): PRaw {
  for (let guard = 0; guard < 500; guard++) {
    let facs: Fac[]; let terms: PTerm[]; let Q: Fr | null = null;
    if (level === "level3") {
      const a = pick([1, -1, 2, -2, 3, -3]); let b = pick([1, -1, 2, -2, 3, -3]);
      if (Math.abs(a) === Math.abs(b)) continue;
      if (form === "improper") {
        facs = [{ c: F(1), d: F(a), m: 1 }, { c: F(1), d: F(b), m: 1 }];
        terms = [{ fi: 0, p: 1, letter: "A", A: F(nonZero(-4, 4)) }, { fi: 1, p: 1, letter: "B", A: F(nonZero(-4, 4)) }];
        Q = F(nonZero(-3, 3));
      } else if (Math.random() < 0.7) {
        facs = [{ c: F(1), d: F(a), m: 1 }, { c: F(1), d: F(b), m: 2 }];
        terms = [{ fi: 0, p: 1, letter: "A", A: F(nonZero(-3, 3)) }, { fi: 1, p: 1, letter: "B", A: F(nonZero(-3, 3)) }, { fi: 1, p: 2, letter: "C", A: F(nonZero(-3, 3)) }];
      } else {
        facs = [{ c: F(1), d: F(a), m: 2 }];
        terms = [{ fi: 0, p: 1, letter: "A", A: F(nonZero(-4, 4)) }, { fi: 0, p: 2, letter: "B", A: F(nonZero(-4, 4)) }];
      }
    } else {
      const scaled = level === "level2";
      const c1 = scaled ? pick([1, 2, 3, 4]) : 1, c2 = scaled ? pick([1, 2, 3, 4]) : 1;
      const d1 = pick([1, -1, 2, -2, 3, -3]), d2 = pick([1, -1, 2, -2, 3, -3]);
      if (c1 * d2 === c2 * d1) continue; // the same root: not two different factors
      if (scaled && c1 === 1 && c2 === 1) continue;
      let A = nonZero(-4, 4), B = nonZero(-4, 4);
      if (numer === "constant") { const s = pick([1, -1, 2]); A = d1 * s; B = -d2 * s; }
      facs = [{ c: F(c1), d: F(d1), m: 1 }, { c: F(c2), d: F(d2), m: 1 }];
      terms = [{ fi: 0, p: 1, letter: "A", A: F(A) }, { fi: 1, p: 1, letter: "B", A: F(B) }];
    }
    // the two ranges must differ so that taking the smaller is a real decision
    const bounds = facs.map((f) => absF(div(f.c, f.d)));
    if (bounds.length > 1 && bounds.some((x, i) => bounds.some((y, j) => i < j && eq(x, y)))) continue;
    const N = numeratorOf(facs, terms, Q);
    if (N.length === 1 && isZero(N[0])) continue;
    if (N.some((c) => Math.abs(c.n) > 60)) continue;
    return { facs, terms, N, Q, improper: Q !== null };
  }
  throw new Error("binomial expansion: no partial-fraction question found");
}

/** the series of each partial fraction A/(c + dx)^p, up to x^m */
function termSeries(f: Fac, t: PTerm, m: number): { core: Fr[]; mult: Fr; full: Fr[] } {
  const k = div(f.d, f.c);
  const mult = mul(t.A, powI(f.c, -t.p));
  const core = series(F(-t.p), k, m);
  return { core, mult, full: core.map((c) => mul(c, mult)) };
}

const facTex = (f: Fac): string => `\\left(${linTex(f.c, f.d)}\\right)${f.m === 2 ? "^{2}" : ""}`;
const facsTex = (facs: Fac[]) => facs.map(facTex).join("");
const termTex = (f: Fac, t: PTerm) => `\\dfrac{${frTex(t.A)}}{${t.p === 2 ? `\\left(${linTex(f.c, f.d)}\\right)^{2}` : linTex(f.c, f.d)}}`;
const pfSum = (raw: PRaw): string => {
  const body = raw.terms.map((t, i) => { const s = termTex(raw.facs[t.fi], t); return i === 0 ? s : s.startsWith("\\dfrac{-") ? ` - ${s.replace("\\dfrac{-", "\\dfrac{")}` : ` + ${s}`; }).join("");
  return raw.Q ? `${frTex(raw.Q)} ${body.startsWith(" -") ? body : ` + ${body}`}` : body;
};

function partialWorking(raw: PRaw, m: number, ask: string): { steps: WorkingStep[]; answer: Fr[]; bound: Fr; pf: string } {
  const { facs, terms, N, Q } = raw;
  const D = denomPoly(facs);
  const steps: WorkingStep[] = [];
  let R = N;
  if (Q) {
    R = trimP(pAdd(N, pScale(D, neg(Q))));
    steps.push(mStep("The numerator has the same degree as the denominator, so divide first:", [
      `\\dfrac{${polyTexDesc(N)}}{${polyTexDesc(D)}}`,
      ` = ${frTex(Q)} + \\dfrac{${polyTexDesc(R)}}{${polyTexDesc(D)}}`,
    ]));
  }
  // the constants, re-derived by the cover-up / substitution method, and checked against the ones the question was built from
  const Aname = terms.map((t) => `${t.letter}`).join("");
  void Aname;
  steps.push(mStep("Write in partial fractions:", [`\\dfrac{${polyTexDesc(R)}}{${facsTex(facs)}}`, ` \\equiv ${terms.map((t, i) => `${i ? " + " : ""}\\dfrac{${t.letter}}{${t.p === 2 ? `\\left(${linTex(facs[t.fi].c, facs[t.fi].d)}\\right)^{2}` : linTex(facs[t.fi].c, facs[t.fi].d)}}`).join("")}`]));
  steps.push(mStep("Multiply through by the denominator:", [`${polyTexDesc(R)} \\equiv ${terms.map((t, i) => {
    const rest = facs.map((f, j) => { const left = j === t.fi ? f.m - t.p : f.m; return left === 0 ? "" : `\\left(${linTex(f.c, f.d)}\\right)${left === 2 ? "^{2}" : ""}`; }).join("");
    return `${i ? " + " : ""}${t.letter}${rest}`;
  }).join("")}`]));
  const found: Record<string, Fr> = {};
  // top-power constants: substitute the root of each factor
  facs.forEach((f, j) => {
    const top = terms.find((t) => t.fi === j && t.p === f.m)!;
    const root = neg(div(f.c, f.d));
    const cof = facs.reduce<Fr>((acc, g, i) => (i === j ? acc : mul(acc, powI(add(g.c, mul(g.d, root)), g.m))), F(1));
    const val = div(pEval(R, root), cof);
    if (!eq(val, top.A)) throw new Error("binomial expansion: constant mismatch");
    found[top.letter] = val;
    steps.push(mStep(`Let x = ${frPlain(root)}:`, [`${frTex(pEval(R, root))} = ${eq(cof, F(1)) ? "" : `${frTex(cof)}`}${top.letter}`, ` \\Rightarrow ${top.letter} = ${frTex(val)}`]));
  });
  // the one constant substitution cannot reach (the single power of a repeated factor): equate coefficients of the highest power of x
  terms.filter((t) => t.p < facs[t.fi].m).forEach((t) => {
    const deg = R.length - 1;
    const lead = (tt: PTerm): Fr => {
      let piece: Poly = [F(1)];
      facs.forEach((f, j) => { const left = j === tt.fi ? f.m - tt.p : f.m; for (let i = 0; i < left; i++) piece = pMul(piece, [f.c, f.d]); });
      return piece[deg] ?? F(0);
    };
    const others = terms.filter((u) => u !== t);
    const known = others.reduce<Fr>((acc, u) => add(acc, mul(lead(u), u.A)), F(0));
    const val = div(sub(R[deg] ?? F(0), known), lead(t));
    if (!eq(val, t.A)) throw new Error("binomial expansion: coefficient mismatch");
    steps.push(mStep(`Equate the coefficients of x${deg === 2 ? "²" : deg === 1 ? "" : `^${deg}`}:`, [`${frTex(R[deg] ?? F(0))} = ${frTex(lead(t))}${t.letter}${isZero(known) ? "" : ` ${known.n < 0 ? "-" : "+"} ${frAbsTex(known)}`}`, ` \\Rightarrow ${t.letter} = ${frTex(val)}`]));
  });
  const pf = pfSum(raw);
  steps.push(mStep("The partial fractions are:", [pf]));
  // each fraction as a constant × (1 + kx)^n
  const perTerm = terms.map((t) => termSeries(facs[t.fi], t, m));
  steps.push(mStep("Write each fraction as a constant × (1 + kx)ⁿ:", terms.map((t, i) => {
    const f = facs[t.fi]; const k = div(f.d, f.c);
    return `${i ? " + " : ""}${frTex(perTerm[i].mult)}\\left(1 ${k.n < 0 ? "-" : "+"} ${eq(absF(k), F(1)) ? "" : frAbsTex(k)}x\\right)^{-${t.p}}`;
  })));
  terms.forEach((t, i) => {
    const f = facs[t.fi]; const k = div(f.d, f.c); const kx = kxTex(k);
    steps.push(mStep(`Expand ${terms.length > 1 ? `the ${["first", "second", "third"][i]} term` : "the term"}:`, [
      `${frTex(perTerm[i].mult)}\\left(1 ${k.n < 0 ? "-" : "+"} ${eq(absF(k), F(1)) ? "" : frAbsTex(k)}x\\right)^{-${t.p}}`,
      ` = ${frTex(perTerm[i].mult)}\\left(1 + ${termSubst(F(-t.p), 1, kx)}${m >= 2 ? ` + ${termSubst(F(-t.p), 2, kx)}` : ""}${m >= 3 ? " + \\dots" : ""}\\right)`,
      ` = ${polyTex(perTerm[i].full)}`,
    ]));
  });
  // collect
  const total: Fr[] = Array.from({ length: m + 1 }, (_, r) => perTerm.reduce<Fr>((acc, s) => add(acc, s.full[r]), r === 0 && Q ? Q : F(0)));
  const check = seriesDivide(N, D, m);
  if (total.some((c, r) => !eq(c, check[r]))) throw new Error("binomial expansion: series mismatch");
  for (let r = 0; r <= m; r++) {
    const parts = [...(r === 0 && Q ? [Q] : []), ...perTerm.map((s) => s.full[r])];
    const sum = total[r];
    steps.push(mStep(r === 0 ? "Add the constant terms:" : `Add the coefficients of x${r === 1 ? "" : superscript(r)}:`, [
      parts.map((p, i) => (i === 0 ? frTex(p) : ` ${p.n < 0 ? "-" : "+"} ${frAbsTex(p)}`)).join(""),
      ` = ${frTex(sum)}`,
    ]));
  }
  // range
  const bounds = facs.map((f) => absF(div(f.c, f.d)));
  const bound = bounds.reduce((mn, b) => (lt(b, mn) ? b : mn), bounds[0]);
  const rows = facs.map((_f, j) => ({ label: modLt(bounds[j]), c: toNum(bounds[j]), plain: frPlain(bounds[j]) }));
  facs.forEach((f, j) => {
    const k = div(f.d, f.c);
    const isLast = j === facs.length - 1 && facs.length === 1;
    const st = mStep(`The term in (${linPlain(f.c, f.d)}) is valid when |${kxPlain(k)}| < 1:`, [`\\left|${kxTex(k)}\\right| < 1`, ` \\Rightarrow ${modLt(bounds[j])}`]);
    steps.push(isLast ? withExtra(st, { kind: "binInterval", rows: rows.slice(0, j + 1), overlap: false }) : withExtra(st, { kind: "binInterval", rows: rows.slice(0, j + 1) }));
  });
  if (facs.length > 1) steps.push(withExtra(mStep("The expansion is valid only where every term is, so take the smaller range:", [modLt(bound)]), { kind: "binInterval", rows, overlap: true }));
  if (ask === "coef") steps.push(mStep(`The coefficient of x${superscript(m)} is:`, [frTex(total[m])]));
  else steps.push(mStep("Write the answer:", polyFrags(total, "")));
  return { steps, answer: total, bound, pf };
}

const polyTexDesc = (p: Poly): string => polyTex(p);

function partialQuestion(level: DifficultyLevel, msv: Record<string, boolean>): AnyQuestion {
  const pools = PARTIAL_POOLS[level];
  const form = pools.find((p) => p.key === "denom") ? pickActive(msv, pools.find((p) => p.key === "denom")!.options) : "distinct";
  const numer = pools.find((p) => p.key === "numer") ? pickActive(msv, pools.find((p) => p.key === "numer")!.options) : "linear";
  const ask = pickActive(msv, pools.find((p) => p.key === "ask")!.options);
  const m = upToOf(pickActive(msv, pools.find((p) => p.key === "upTo")!.options));
  const raw = makePartial(level, form, numer);
  const { steps, answer, bound, pf } = partialWorking(raw, m, ask);
  const fx = `f(x) = \\dfrac{${polyTex(raw.N)}}{${facsTex(raw.facs)}}`;
  const count = m + 1;
  const lines = [
    raw.improper ? `Express $${fx}$ in the form $Q + \\dfrac{A}{\\dots} + \\dfrac{B}{\\dots}$, where $Q$ is a constant.` : `Express $${fx}$ in partial fractions.`,
    ask === "coef"
      ? `Hence find the coefficient of $x^{${m}}$ in the binomial expansion of $f(x)$ in ascending powers of $x$.`
      : `Hence find the first ${count} terms of the binomial expansion of $f(x)$ in ascending powers of $x$.`,
    ...(ask === "range" ? ["State the range of values of $x$ for which the expansion is valid."] : []),
  ];
  const id = Math.floor(Math.random() * 1_000_000);
  const expLatex = ask === "coef" ? frTex(answer[m]) : polyTex(answer);
  return {
    kind: "worded", lines,
    answer: ask === "coef" ? frPlain(answer[m]) : polyTex(answer),
    answerLatex: `${pf} \\;\\Rightarrow\\; ${expLatex}`,
    answerSuffix: ask === "range" ? `, ${rangeText(bound)}` : undefined,
    working: steps,
    key: `be-partial-${level}-${raw.facs.map((f) => `${frPlain(f.c)}_${frPlain(f.d)}_${f.m}`).join("-")}-${raw.N.map(frPlain).join(",")}-${m}-${ask}-${id}`,
    difficulty: level,
    _raw: raw,
  } as unknown as AnyQuestion;
}

// ── 9. Approximation ─────────────────────────────────────────────────────────

/** the value (1 + u)^n written the way the question names it: √1.04, 1/√0.98, 1/1.03², ∛1.06 … */
function valueTex(base: string, n: Fr): string {
  if (eq(n, F(1, 2))) return `\\sqrt{${base}}`;
  if (eq(n, F(-1, 2))) return `\\dfrac{1}{\\sqrt{${base}}}`;
  if (eq(n, F(1, 3))) return `\\sqrt[3]{${base}}`;
  if (eq(n, F(-1))) return `\\dfrac{1}{${base}}`;
  if (eq(n, F(-2))) return `\\dfrac{1}{${base}^{2}}`;
  if (eq(n, F(-3))) return `\\dfrac{1}{${base}^{3}}`;
  if (eq(n, F(3, 2))) return `${base}\\sqrt{${base}}`;
  return `${base}^{${frSmall(n)}}`;
}
const decimal = (v: number, dp: number) => v.toFixed(dp);
const dec = (f: Fr) => `${toNum(f)}`.replace(/(\.\d*?[1-9])0+$/, "$1");

function approxQuestion(level: DifficultyLevel, msv: Record<string, boolean>): AnyQuestion {
  const ask = pickActive(msv, APPROX_POOLS[level][0].options);
  const id = Math.floor(Math.random() * 1_000_000);
  // a small x and a coefficient k, so u = kx is a few hundredths
  const n = pick(level === "level1" ? [F(1, 2), F(-1, 2), F(-1), F(-2)] : [F(1, 2), F(-1, 2), F(-1), F(-2), F(1, 3), F(-3)]);
  const m = 2;
  const xv = pick([F(1, 100), F(2, 100), F(-1, 100), F(-2, 100), F(1, 50)]);
  let bn: Binom;
  if (level === "level3") {
    const a = aPick(n);
    const b = nonZero(-3, 3);
    bn = { a, b: F(b), n };
  } else bn = { a: 1, b: F(pick([1, 2, 3, 4, -1, -2, -3, -4])), n };
  const k = div(bn.b, F(bn.a));
  const u = mul(k, xv);
  if (level !== "level3" && !lt(absF(u), F(1, 5))) return approxQuestion(level, msv);
  const steps: WorkingStep[] = [];
  const expr = powerTex(bn);
  const lines: string[] = [];
  let answer = "", answerLatex = "";

  if (ask === "valid") {
    // an x that cannot be used: |bx/a| ≥ 1
    const bad = F(pick([1, 1, 2]) * bn.a * pick([1, 2]), Math.abs(bn.b.n));
    const bound = absF(div(F(bn.a), bn.b));
    const ratio = absF(mul(k, bad));
    lines.push(`The binomial expansion of $${expr}$ in ascending powers of $x$ is used with $x = ${frTex(bad)}$.`, "Explain why this value of $x$ cannot be used.");
    steps.push(mStep("The expansion is valid when |u| < 1:", [`\\left|${kxTex(k)}\\right| < 1`, ` \\Rightarrow ${modLt(bound)}`]));
    steps.push(mStep("Check the given value of x:", [`\\left|${kxTex(k)}\\right| = \\left|${kxTex(k).replace("x", `(${frTex(bad)})`)}\\right|`, ` = ${frTex(ratio)}`]));
    steps.push(mStep("Compare with the range:", [`${frTex(ratio)} \\geq 1`, ` \\Rightarrow \\left|x\\right| = ${frTex(absF(bad))} \\geq ${frTex(bound)}`]));
    answer = `|x| = ${frPlain(absF(bad))} is not less than ${frPlain(bound)}, so x is outside the range of validity`;
    answerLatex = `\\left|x\\right| = ${frAbsTex(bad)} \\not< ${frTex(bound)}`;
    return {
      kind: "worded", lines, answer, answerLatex, answerSuffix: ", so x is outside the range of validity and the expansion cannot be used",
      working: steps, key: `be-approx-valid-${level}-${frPlain(bn.n)}-${bn.a}-${frPlain(bn.b)}-${frPlain(bad)}-${id}`, difficulty: level,
    } as unknown as AnyQuestion;
  }

  const full = expandWorking(bn, m, "expansion");
  const approxF = full.answer.reduce<Fr>((acc, c, r) => add(acc, mul(c, powI(xv, r))), F(0));
  const exact = Math.pow(1 + toNum(u), toNum(n)) * toNum(full.mult);
  const baseTex = `${decimal(1 + toNum(u), 2).replace(/0+$/, "").replace(/\.$/, "")}`;
  const number = bn.a === 1 ? valueTex(baseTex, n) : `${valueTex(`${decimal(bn.a + toNum(bn.b) * toNum(xv), 2).replace(/0+$/, "").replace(/\.$/, "")}`, n)}`;
  const expLatex = polyTex(full.answer);
  if (level === "level1") {
    lines.push(`$${expr} \\approx ${expLatex}$ for small $x$.`, `Use $x = ${dec(xv)}$ to estimate $${number}$.`);
  } else {
    lines.push(`Find the binomial expansion of $${expr}$ in ascending powers of $x$, up to and including the term in $x^{2}$.`,
      `Use $x = ${dec(xv)}$ in your expansion to estimate $${number}$.`);
  }
  if (level !== "level1") steps.push(...full.steps.slice(0, -1));
  else steps.push(mStep("Check that x is in the range of validity:", [`\\left|${kxTex(k)}\\right| = ${frTex(absF(u))}`, ` < 1`]));
  steps.push(mStep(`Substitute x = ${dec(xv)}:`, [
    `${expLatex.replace(/x\^\{(\d)\}/g, `(${dec(xv)})^{$1}`).replace(/(\d|\})x(?!\^)/g, `$1(${dec(xv)})`).replace(/(^|[+\-] )x(?![\^(])/g, `$1(${dec(xv)})`)}`,
  ]));
  steps.push(mStep("Add the terms:", [`\\approx ${decimal(toNum(approxF), 6).replace(/0+$/, "").replace(/\.$/, "")}`]));
  steps.push(mStep("Compare with a calculator:", [`${number} = ${decimal(exact, 6)}\\ldots`]));
  answer = `${decimal(toNum(approxF), 6)}`;
  answerLatex = `${decimal(toNum(approxF), 6).replace(/0+$/, "").replace(/\.$/, "")}`;
  return {
    kind: "worded", lines, answer, answerLatex, answerSuffix: ` (calculator: ${decimal(exact, 6)})`,
    working: steps, key: `be-approx-${level}-${frPlain(bn.n)}-${bn.a}-${frPlain(bn.b)}-${frPlain(xv)}-${id}`, difficulty: level,
  } as unknown as AnyQuestion;
}

// ── 10. generateQuestion ─────────────────────────────────────────────────────

const generateQuestion = (
  tool: string, level: DifficultyLevel,
  _vars: Record<string, boolean>, _dropdownValue: string, multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  const t = tool as SubTool;
  const pools = t === "expand" ? EXPAND_POOLS[level] : t === "partial" ? PARTIAL_POOLS[level] : APPROX_POOLS[level];
  const msv = resolveMultiSelectValues(pools, multiSelectValues);
  return t === "expand" ? expandQuestion(level, msv) : t === "partial" ? partialQuestion(level, msv) : approxQuestion(level, msv);
};

// ── 11. Export ───────────────────────────────────────────────────────────────

export const __test = {
  TOOL_CONFIG, generateQuestion,
  helpers: { F, add, mul, div, eq, series, powRat, polyTex, seriesDivide, denomPoly, numeratorOf, binomCoef, makePartial, expandWorking, partialWorking, frPlain },
};

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      stepVisualRenderer={stepVisual}
      stepVisualKeepsWorking
      stepVisualPlacement="top"
      defaults={{ numQuestions: 6, numColumns: 2 }}
    />
  );
}
