import {
  ToolShell,
  type ToolConfig, type InfoSection, type QOSnapshot, type DifficultyLevel, type AnyQuestion, type WorkingStep, type ToolMultiSelect,
  randInt, pick, mStep, pickActive, weightOf, ldStep, longDivisionStepRenderer,
} from "../../shared";

// ── 1. Types ──────────────────────────────────────────────────────────────────

type SubTool = "y12" | "y13";
type QType =
  | "decide" | "factorise" | "showSolve" | "trialFactorise" | "trialSolve"
  | "findUnknown" | "twoUnknowns" | "surd" | "oneReal" | "quartic" | "paramA" | "paramK";

/** A linear factor (p x − q). Its root is q / p. In `param` mode the factor is (p x − q a). */
interface Lin { p: number; q: number }

// ── 2. TOOL_CONFIG ────────────────────────────────────────────────────────────

const opt = (value: string, label: string, weight?: number, defaultActive = true) =>
  ({ value, label, defaultActive, ...(weight === undefined ? {} : { weight }) });

const pool = (options: ToolMultiSelect["options"]): ToolMultiSelect =>
  ({ key: "questionType", label: "Question Types", options });

const POOLS: Record<SubTool, Record<DifficultyLevel, ToolMultiSelect>> = {
  y12: {
    level1: pool([
      opt("decide", "Is it a factor?"),
      opt("factorise", "Factorise (factor given)"),
    ]),
    level2: pool([
      opt("showSolve", "Show factor, then solve", 1),
      opt("trialFactorise", "Find a factor, then factorise", 2),
      opt("trialSolve", "Find a factor, then solve", 3),
      opt("findUnknown", "Find an unknown coefficient", 4),
      opt("twoUnknowns", "Two unknown coefficients", 5),
    ]),
    level3: pool([
      opt("oneReal", "Show only one real root", 1),
      opt("surd", "Solve with exact (surd) answers", 2),
      opt("quartic", "Quartic", 3),
      opt("paramK", "Factor containing k", 4),
      opt("paramA", "Factor containing a", 5, false),
    ]),
  },
  y13: {
    level1: pool([
      opt("decide", "Is it a factor?"),
      opt("factorise", "Factorise (factor given)"),
    ]),
    level2: pool([
      opt("showSolve", "Show factor, then solve"),
      opt("findUnknown", "Find an unknown coefficient"),
    ]),
    level3: pool([
      opt("oneReal", "Show only one real root", 1),
      opt("trialSolve", "Find a factor, then solve", 2),
      opt("twoUnknowns", "Two unknown coefficients", 3),
      opt("surd", "Solve with exact (surd) answers", 4),
      opt("quartic", "Quartic", 5),
      opt("paramA", "Factor containing a", 6),
    ]),
  },
};

// Polynomial division grains: bottom = the full long division, top = just the resulting product line.
const DIVISION_DD = {
  key: "division", label: "Division working",
  options: [{ value: "long", label: "Long division" }, { value: "result", label: "Result only" }],
  defaultValue: "long",
  workedExampleOnly: true,
};

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Factor Theorem",
  tools: {
    y12: {
      name: "Year 12 · (x − c)",
      variables: [],
      dropdown: null,
      difficultySettings: {
        level1: { variables: [], dropdown: DIVISION_DD, multiSelect: POOLS.y12.level1 },
        level2: { variables: [], dropdown: DIVISION_DD, multiSelect: POOLS.y12.level2 },
        level3: { variables: [], dropdown: DIVISION_DD, multiSelect: POOLS.y12.level3 },
      },
    },
    y13: {
      name: "Year 13 · (ax − b)",
      variables: [],
      dropdown: null,
      difficultySettings: {
        level1: { variables: [], dropdown: DIVISION_DD, multiSelect: POOLS.y13.level1 },
        level2: { variables: [], dropdown: DIVISION_DD, multiSelect: POOLS.y13.level2 },
        level3: { variables: [], dropdown: DIVISION_DD, multiSelect: POOLS.y13.level3 },
      },
    },
  },
};

// ── 3. INFO_SECTIONS ─────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  { title: "Year 12 · (x − c)", icon: "✂️", content: [
    { label: "Overview",         detail: "If f(c) = 0 then (x − c) is a factor of f(x). Every factor here is monic, so the value to test is a whole number." },
    { label: "Level 1 — Green",  detail: "Decide whether (x − c) is a factor of a cubic, or factorise a cubic given one factor." },
    { label: "Level 2 — Yellow", detail: "Show a factor and solve, find a factor by trying factors of the constant term, or find unknown coefficients." },
    { label: "Level 3 — Red",    detail: "Only one real root (discriminant), exact surd answers, quartics, and factors containing k or a." },
  ]},
  { title: "Year 13 · (ax − b)", icon: "➗", content: [
    { label: "Overview",         detail: "If f(b/a) = 0 then (ax − b) is a factor of f(x). The value to test is a fraction, so substitution needs care." },
    { label: "Level 1 — Green",  detail: "Decide whether (ax − b) is a factor of a cubic, or factorise a cubic given one factor." },
    { label: "Level 2 — Yellow", detail: "Show a factor and solve, or find an unknown coefficient (and factorise)." },
    { label: "Level 3 — Red",    detail: "Two unknown coefficients, finding a factor by trial, quartics, exact surd answers, only one real root, and factors containing a." },
  ]},
  { title: "Worked solution", icon: "📝", content: [
    { label: "Division working", detail: "Question Options → Division working: Long division (default) shows the paper layout; Result only skips it and goes straight to f(x) = factor × quotient. Both start from the same question." },
    { label: "Division",         detail: "The quotient is shown as a single step (f(x) = factor × quadratic). A long-division layout is not drawn." },
    { label: "Trying values",    detail: "Candidates are ± (factor of the constant term) ÷ (factor of the leading coefficient), in size order, stopping at the first zero." },
  ]},
];

// ── 4. Fraction + polynomial helpers ─────────────────────────────────────────

interface Frac { n: number; d: number }
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const lcm = (a: number, b: number) => Math.abs(a * b) / gcd(a, b);
const F = (n: number, d = 1): Frac => {
  const g = gcd(n, d) || 1;
  const s = d < 0 ? -1 : 1;
  return { n: (s * n) / g, d: (s * d) / g };
};
const addF = (a: Frac, b: Frac) => F(a.n * b.d + b.n * a.d, a.d * b.d);
const mulF = (a: Frac, b: Frac) => F(a.n * b.n, a.d * b.d);
const powF = (a: Frac, k: number) => { let r = F(1); for (let i = 0; i < k; i++) r = mulF(r, a); return r; };
const eqF = (a: Frac, b: Frac) => a.n === b.n && a.d === b.d;
const fVal = (a: Frac) => a.n / a.d;

/** Polynomials are integer coefficient arrays, highest power first. */
type Poly = number[];
const polyMul = (a: Poly, b: Poly): Poly => {
  const out = new Array(a.length + b.length - 1).fill(0);
  a.forEach((x, i) => b.forEach((y, j) => { out[i + j] += x * y; }));
  return out;
};
const polyOf = (fs: Lin[]): Poly => fs.reduce<Poly>((acc, f) => polyMul(acc, [f.p, -f.q]), [1]);
const polyEval = (c: Poly, r: Frac): Frac => c.reduce<Frac>((acc, v) => addF(mulF(acc, r), F(v)), F(0));
const rootOf = (l: Lin): Frac => F(l.q, l.p);

// ── 5. LaTeX helpers ─────────────────────────────────────────────────────────

interface Term { neg: boolean; body: string }
const joinTerms = (ts: Term[]): string =>
  ts.length === 0 ? "0" : ts.map((t, i) => (i === 0 ? (t.neg ? "-" : "") : t.neg ? " - " : " + ") + t.body).join("");

const fracAbs = (f: Frac) => (f.d === 1 ? `${Math.abs(f.n)}` : `\\dfrac{${Math.abs(f.n)}}{${f.d}}`);
const fracL = (f: Frac) => (f.n < 0 ? "-" : "") + fracAbs(f);
const fracTerm = (f: Frac): Term => ({ neg: f.n < 0, body: fracAbs(f) });
const sumL = (fs: Frac[]) => joinTerms(fs.filter(f => f.n !== 0).map(fracTerm));

const monoL = (xp: number, ap: number, v = "x") =>
  (ap > 0 ? (ap > 1 ? `a^{${ap}}` : "a") : "") + (xp > 0 ? (xp > 1 ? `${v}^{${xp}}` : v) : "");

/** Polynomial in x. `param`: coefficient i carries a^i (homogeneous in x and a). `sym`: show a letter instead of the coefficient. */
const polyL = (c: Poly, o: { param?: boolean; sym?: Record<number, string>; v?: string } = {}): string => {
  const n = c.length - 1;
  const ts: Term[] = [];
  c.forEach((val, i) => {
    const sy = o.sym?.[i];
    if (val === 0 && !sy) return;
    const m = monoL(n - i, o.param ? i : 0, o.v);
    if (sy) { ts.push({ neg: false, body: sy + m }); return; }
    const A = Math.abs(val);
    ts.push({ neg: val < 0, body: m === "" ? `${A}` : A === 1 ? m : `${A}${m}` });
  });
  return joinTerms(ts);
};

const linBare = (l: Lin, param: boolean) => polyL([l.p, -l.q], { param });
const linL = (l: Lin, param: boolean) => `(${linBare(l, param)})`;
const factorsL = (fs: Lin[], param: boolean) => fs.map(f => linL(f, param)).join("");

const rootL = (r: Frac, param: boolean): string => {
  if (!param) return fracL(r);
  if (r.n === 0) return "0";
  const num = Math.abs(r.n);
  const body = r.d === 1 ? (num === 1 ? "a" : `${num}a`) : `\\dfrac{${num}}{${r.d}}a`;
  return (r.n < 0 ? "-" : "") + body;
};
const qL = (q: number, param: boolean) => (param ? (q === 1 ? "a" : q === -1 ? "-a" : `${q}a`) : `${q}`);

const fOf = (arg: string) => `f\\left(${arg}\\right)`;

const rParen = (r: Frac, param: boolean) => {
  const inner = param ? rootL(r, true) : fracL(r);
  return r.d === 1 && !param ? `(${inner})` : `\\left(${inner}\\right)`;
};

/** f with x replaced by r, written term by term. `sym` leaves a letter in place of an unknown coefficient. */
const substExpr = (c: Poly, r: Frac, param: boolean, sym?: Record<number, string>): string => {
  const n = c.length - 1;
  const ts: Term[] = [];
  c.forEach((v, i) => {
    const sy = sym?.[i];
    if (v === 0 && !sy) return;
    const k = n - i;
    const pa = param && i > 0 ? (i > 1 ? `a^{${i}}` : "a") : "";
    const pw = k === 0 ? "" : `${rParen(r, param)}${k > 1 ? `^{${k}}` : ""}`;
    const coef = sy ?? (Math.abs(v) === 1 && (pa || pw) ? "" : `${Math.abs(v)}`);
    ts.push({ neg: sy ? false : v < 0, body: `${coef}${pa}${pw}` || "1" });
  });
  return joinTerms(ts);
};

/** Fragments for "substitute r into f and evaluate". */
const evalFrags = (c: Poly, r: Frac, param: boolean): string[] => {
  const n = c.length - 1;
  const tv = c.map((v, i) => mulF(F(v), powF(r, n - i)));
  const total = tv.reduce(addF, F(0));
  const lhs = fOf(param ? rootL(r, true) : fracL(r));
  const sub = substExpr(c, r, param);
  return param
    ? [`${lhs} = ${sub}`, `= \\left(${sumL(tv)}\\right)a^{${n}}`, `= ${fracL(total)}`]
    : [`${lhs} = ${sub}`, `= ${sumL(tv)}`, `= ${fracL(total)}`];
};

const plainOf = (s: string) =>
  s.replace(/\\dfrac\{(-?\d+)\}\{(\d+)\}/g, "$1/$2").replace(/\\(left|right|;|,|quad)/g, "")
    .replace(/\\pm/g, "±").replace(/\\sqrt\{(\d+)\}/g, "√$1").replace(/\\Rightarrow/g, "⇒")
    .replace(/\\times/g, "×").replace(/\\text\{([^}]*)\}/g, "$1").replace(/[{}\\]/g, "");

// ── 6. Shared working-step builders ──────────────────────────────────────────

const stepZero = (g: Lin, param: boolean): WorkingStep => {
  const r = rootL(rootOf(g), param);
  const frags = [`${linBare(g, param)} = 0`];
  if (g.p !== 1) frags.push(`\\Rightarrow ${g.p}x = ${qL(g.q, param)}`);
  frags.push(`\\Rightarrow x = ${r}`);
  return mStep("Set the factor equal to zero:", frags);
};
/** A long substitution line shrinks to nothing on a phone, so give the evaluation its own step. */
const splitSub = (label: string, frags: string[]): WorkingStep[] => {
  const lhs = frags[0].split(" = ")[0];
  if (frags[0].replace(/\\(left|right)/g, "").length <= 80 || frags.length < 2) return [mStep(label, frags)];
  return [mStep(label, [frags[0]]), mStep("Evaluate:", [`${lhs} ${frags[1]}`, ...frags.slice(2)])];
};
const stepSub = (c: Poly, g: Lin, param: boolean) =>
  splitSub("Substitute into f(x):", evalFrags(c, rootOf(g), param));
const stepConclude = (g: Lin, param: boolean) =>
  mStep("The remainder is zero, so by the factor theorem this is a factor:", linL(g, param));

const sortedRoots = (fs: Lin[]): Frac[] => {
  const rs = fs.map(rootOf).sort((a, b) => fVal(a) - fVal(b));
  return rs.filter((r, i) => i === 0 || !eqF(r, rs[i - 1]));
};
const stepSolve = (fs: Lin[], param: boolean) => {
  const rs = sortedRoots(fs).map(r => rootL(r, param));
  return mStep("Solve each factor equal to zero:", rs.map((r, i) => (i === 0 ? `x = ${r}` : `,\\; ${r}`)));
};
const rootsAnswer = (fs: Lin[], param: boolean) =>
  `x = ${sortedRoots(fs).map(r => rootL(r, param)).join(",\\; ")}`;

const stepLD = (dividend: Poly, g: Lin, param: boolean, identity: string): WorkingStep =>
  ldStep("Polynomial division reveals the other factors:", dividend, g.p, g.q, linBare(g, param), identity, param);

/** Long division of `dividend` by `g`, then the product written out (`prefix` = factors already taken out). */
const stepsDivide = (dividend: Poly, g: Lin, quot: Poly, param: boolean, prefix: Lin[] = []): WorkingStep[] => {
  const pre = factorsL(prefix, param);
  const line = `f(x) = ${pre}${linL(g, param)}\\left(${polyL(quot, { param })}\\right)`;
  return [
    stepLD(dividend, g, param, line),
    mStep("So:", [`f(x) = ${pre}${linL(g, param)}`, `\\left(${polyL(quot, { param })}\\right)`]),
  ];
};

/** Divide by `g` (the quotient is the product of `rest`), then factorise the quotient. */
const stepsDivideFactorise = (g: Lin, rest: Lin[], param: boolean, dividend?: Poly): WorkingStep[] => {
  const what = rest.length === 2 ? "quadratic" : "cubic";
  return [
    ...stepsDivide(dividend ?? polyOf([g, ...rest]), g, polyOf(rest), param),
    mStep(`Factorise the ${what}:`, [`f(x) = ${linL(g, param)}`, ...rest.map(r => linL(r, param))]),
  ];
};

// ── 7. Generation helpers ────────────────────────────────────────────────────

const coprime = (p: number, q: number) => gcd(p, Math.abs(q)) === 1;
const randSign = () => (Math.random() < 0.5 ? -1 : 1);
const randLin = (pMin: number, pMax: number, qMax: number): Lin => {
  for (;;) {
    const p = randInt(pMin, pMax);
    const q = randInt(1, qMax) * randSign();
    if (coprime(p, q)) return { p, q };
  }
};

const distinctRoots = (fs: Lin[]) => {
  const rs = fs.map(rootOf);
  return rs.every((r, i) => rs.every((s, j) => i === j || !eqF(r, s)));
};
const maxAbs = (c: Poly) => Math.max(...c.map(Math.abs));

interface GenOpts { count: number; maxCoef?: number; param?: boolean }

/** Linear factors for a question; the first is the "given" factor. */
const genFactors = (sub: SubTool, level: DifficultyLevel, o: GenOpts): Lin[] => {
  const maxCoef = o.maxCoef ?? (level === "level1" ? 40 : level === "level2" ? 90 : 160);
  const qMax = level === "level1" ? 4 : 6;
  let last: Lin[] = [];
  for (let t = 0; t < 400; t++) {
    let first: Lin;
    let others: Lin[];
    if (o.param) {
      first = sub === "y12" ? { p: 1, q: randInt(1, 3) * randSign() } : randLin(2, 3, 3);
      others = Array.from({ length: o.count - 1 }, () => (sub === "y12" ? { p: 1, q: randInt(1, 4) * randSign() } : randLin(1, 2, 3)));
    } else if (sub === "y12") {
      first = { p: 1, q: randInt(1, 5) * randSign() };
      others = Array.from({ length: o.count - 1 }, () =>
        level === "level1" || Math.random() < 0.65 ? { p: 1, q: randInt(1, qMax) * randSign() } : randLin(2, 3, qMax));
    } else {
      first = randLin(2, level === "level1" ? 3 : 4, level === "level1" ? 5 : 6);
      others = Array.from({ length: o.count - 1 }, () => (Math.random() < 0.35 ? { p: 1, q: randInt(1, qMax) * randSign() } : randLin(1, 3, qMax)));
    }
    const fs = [first, ...others];
    last = fs;
    if (distinctRoots(fs) && maxAbs(polyOf(fs)) <= maxCoef) return fs;
  }
  return last;
};

const divisors = (m: number) => { const out: number[] = []; for (let i = 1; i <= m; i++) if (m % i === 0) out.push(i); return out; };

/** Rational-root candidates ± (factor of constant) ÷ (factor of leading coefficient), smallest first. */
const candidatesFor = (c: Poly): Frac[] => {
  const out: Frac[] = [];
  for (const p of divisors(Math.abs(c[0]))) for (const q of divisors(Math.abs(c[c.length - 1]))) for (const s of [1, -1]) {
    const f = F(s * q, p);
    if (!out.some(o => eqF(o, f))) out.push(f);
  }
  return out.sort((a, b) => a.d - b.d || Math.abs(a.n) - Math.abs(b.n) || b.n - a.n);
};

/** Try candidates until f = 0. */
const trial = (c: Poly) => {
  const frags: string[] = [];
  let count = 0;
  for (const r of candidatesFor(c)) {
    count++;
    const v = polyEval(c, r);
    frags.push(`${count > 1 ? ",\\quad " : ""}${fOf(fracL(r))} = ${fracL(v)}`);
    if (v.n === 0) return { frags, root: r, count };
  }
  throw new Error("factor theorem: no rational root among candidates");
};
const TRIAL_LABEL: Record<SubTool, string> = {
  y12: "Try integer values that are factors of the constant term:",
  y13: "Try values: a factor of the constant ÷ a factor of the leading coefficient:",
};
const linFromRoot = (r: Frac): Lin => ({ p: r.d, q: r.n });
const without = (fs: Lin[], g: Lin) => {
  const i = fs.findIndex(f => eqF(rootOf(f), rootOf(g)));
  return fs.filter((_, j) => j !== i);
};

// ── 8. Question builders ─────────────────────────────────────────────────────

interface Built {
  lines: string[];
  answerLatex: string;
  working: WorkingStep[];
  raw: unknown;
}

const fLine = (c: Poly, param = false, sym?: Record<number, string>) => `f(x) = ${polyL(c, { param, sym })}`;

const buildDecide = (sub: SubTool, level: DifficultyLevel): Built => {
  const fs = genFactors(sub, level, { count: 3 });
  const c = polyOf(fs);
  const isFactor = Math.random() < 0.5;
  let g = fs[0];
  if (!isFactor) {
    for (;;) {
      g = sub === "y12" ? { p: 1, q: randInt(1, 4) * randSign() } : randLin(2, 3, 5);
      if (!fs.some(f => eqF(rootOf(f), rootOf(g)))) break;
    }
  }
  const r = rootOf(g);
  const v = polyEval(c, r);
  const working = [
    stepZero(g, false),
    ...splitSub("Substitute into f(x):", evalFrags(c, r, false)),
    isFactor
      ? stepConclude(g, false)
      : mStep("The remainder is not zero, so this is not a factor:", linL(g, false)),
  ];
  return {
    lines: [`Decide whether $${linBare(g, false)}$ is a factor of $${fLine(c)}$.`],
    answerLatex: isFactor
      ? `\\text{Yes: } ${fOf(fracL(r))} = 0`
      : `\\text{No: } ${fOf(fracL(r))} = ${fracL(v)}`,
    working,
    raw: { c, fs, g, isFactor },
  };
};

const buildFactorise = (sub: SubTool, level: DifficultyLevel): Built => {
  const fs = genFactors(sub, level, { count: 3 });
  const c = polyOf(fs);
  return {
    lines: [`Given that $${linBare(fs[0], false)}$ is a factor of $${fLine(c)}$, factorise $f(x)$ completely.`],
    answerLatex: `f(x) = ${factorsL(fs, false)}`,
    working: stepsDivideFactorise(fs[0], fs.slice(1), false),
    raw: { c, fs },
  };
};

const buildShowSolve = (sub: SubTool, level: DifficultyLevel): Built => {
  const fs = genFactors(sub, level, { count: 3 });
  const c = polyOf(fs);
  return {
    lines: [
      `Show that $${linBare(fs[0], false)}$ is a factor of $${fLine(c)}$.`,
      `Hence express $f(x)$ as a product of linear factors and solve $f(x)=0$.`,
    ],
    answerLatex: `f(x) = ${factorsL(fs, false)},\\; ${rootsAnswer(fs, false)}`,
    working: [
      stepZero(fs[0], false), ...stepSub(c, fs[0], false), stepConclude(fs[0], false),
      ...stepsDivideFactorise(fs[0], fs.slice(1), false), stepSolve(fs, false),
    ],
    raw: { c, fs },
  };
};

const buildTrial = (sub: SubTool, level: DifficultyLevel, solve: boolean): Built => {
  let fs: Lin[] = [];
  let tr: ReturnType<typeof trial> | null = null;
  for (let t = 0; t < 120; t++) {
    fs = genFactors(sub, level, { count: 3 });
    tr = trial(polyOf(fs));
    if (tr.count <= 6) break;
  }
  const c = polyOf(fs);
  const g = linFromRoot(tr!.root);
  const rest = without(fs, g);
  const working = [
    mStep(TRIAL_LABEL[sub], tr!.frags),
    stepConclude(g, false),
    ...stepsDivideFactorise(g, rest, false),
    ...(solve ? [stepSolve(fs, false)] : []),
  ];
  const ordered = [g, ...rest];
  return {
    lines: solve
      ? [`Without using a calculator, solve $${fLine(c)} = 0$.`]
      : [`Use the factor theorem to factorise $${fLine(c)}$ completely.`],
    answerLatex: solve ? rootsAnswer(fs, false) : `f(x) = ${factorsL(ordered, false)}`,
    working,
    raw: { c, fs },
  };
};

const buildFindUnknown = (sub: SubTool, level: DifficultyLevel): Built => {
  for (let t = 0; t < 400; t++) {
    const fs = genFactors(sub, level, { count: 3 });
    const c = polyOf(fs);
    const u = pick([1, 2, 2, 3]);
    if (c[u] === 0) continue;
    const g = fs[0];
    const r = rootOf(g);
    const n = c.length - 1;
    let K = F(0);
    c.forEach((v, i) => { if (i !== u) K = addF(K, mulF(F(v), powF(r, n - i))); });
    const m = powF(r, n - u);
    const val = F(-K.n * m.d, K.d * m.n);
    if (!eqF(val, F(c[u]))) throw new Error("factor theorem: unknown coefficient mismatch");
    const hence = Math.random() < 0.5;
    const sym = { [u]: "a" };

    const positional: Term[] = [];
    c.forEach((v, i) => {
      const pw = powF(r, n - i);
      if (i === u) positional.push({ neg: pw.n < 0, body: pw.d === 1 && Math.abs(pw.n) === 1 ? "a" : `${fracAbs(pw)}a` });
      else { const tv = mulF(F(v), pw); if (tv.n !== 0) positional.push(fracTerm(tv)); }
    });
    const mTerm: Term = { neg: m.n < 0, body: m.d === 1 && Math.abs(m.n) === 1 ? "a" : `${fracAbs(m)}a` };
    const collected = joinTerms([...(K.n !== 0 ? [fracTerm(K)] : []), mTerm]);
    const solveFrags = [`${collected} = 0`];
    if (!(m.d === 1 && Math.abs(m.n) === 1)) solveFrags.push(`\\Rightarrow ${joinTerms([mTerm])} = ${fracL(F(-K.n, K.d))}`);
    solveFrags.push(`\\Rightarrow a = ${c[u]}`);

    const working: WorkingStep[] = [
      stepZero(g, false),
      ...splitSub("Substitute into f(x):", [
        `${fOf(fracL(r))} = ${substExpr(c, r, false, sym)}`,
        `= ${joinTerms(positional)}`,
        `= ${collected}`,
      ]),
      mStep("The remainder must be zero, so solve for a:", solveFrags),
    ];
    if (hence) working.push(...stepsDivideFactorise(g, fs.slice(1), false));
    const lines = [
      `$${linBare(g, false)}$ is a factor of $${fLine(c, false, sym)}$.`,
      `Find the value of $a$.`,
    ];
    if (hence) lines.push(`Hence factorise $f(x)$ completely.`);
    return {
      lines,
      answerLatex: hence ? `a = ${c[u]},\\; f(x) = ${factorsL(fs, false)}` : `a = ${c[u]}`,
      working,
      raw: { c, fs, u },
    };
  }
  throw new Error("factor theorem: could not build findUnknown");
};

const buildTwoUnknowns = (sub: SubTool, level: DifficultyLevel): Built => {
  for (let t = 0; t < 400; t++) {
    const fs = genFactors(sub, level, { count: 3 });
    const c = polyOf(fs);
    const [u1, u2] = pick([[1, 2], [2, 3]]);
    if (c[u1] === 0 || c[u2] === 0) continue;
    const n = c.length - 1;
    const sym = { [u1]: "a", [u2]: "b" };
    const given = [fs[0], fs[1]];

    const eqs = given.map(g => {
      const r = rootOf(g);
      let K = F(0);
      c.forEach((v, i) => { if (i !== u1 && i !== u2) K = addF(K, mulF(F(v), powF(r, n - i))); });
      const m1 = powF(r, n - u1);
      const m2 = powF(r, n - u2);
      const L = lcm(lcm(K.d, m1.d), m2.d);
      const A = (m1.n * L) / m1.d;
      const B = (m2.n * L) / m2.d;
      const C = (-K.n * L) / K.d;
      const unk = (m: Frac, s: string): Term => ({ neg: m.n < 0, body: m.d === 1 && Math.abs(m.n) === 1 ? s : `${fracAbs(m)}${s}` });
      const positional: Term[] = [];
      c.forEach((v, i) => {
        const pw = powF(r, n - i);
        if (i === u1) positional.push(unk(pw, "a"));
        else if (i === u2) positional.push(unk(pw, "b"));
        else { const tv = mulF(F(v), pw); if (tv.n !== 0) positional.push(fracTerm(tv)); }
      });
      return { g, r, A, B, C, positional, expr: substExpr(c, r, false, sym) };
    });
    const [e1, e2] = eqs;
    const coefTerm = (k: number, s: string): Term => ({ neg: k < 0, body: Math.abs(k) === 1 ? s : `${Math.abs(k)}${s}` });
    const eqL = (e: typeof e1, tag: number) =>
      `\\Rightarrow ${joinTerms([coefTerm(e.A, "a"), coefTerm(e.B, "b")])} = ${e.C} \\quad (${tag})`;

    const gB = gcd(Math.abs(e1.B), Math.abs(e2.B));
    const m1 = Math.abs(e2.B) / gB;
    const m2 = Math.abs(e1.B) / gB;
    const same = e1.B > 0 === e2.B > 0;
    const E = same ? e1.A * m1 - e2.A * m2 : e1.A * m1 + e2.A * m2;
    const Fv = same ? e1.C * m1 - e2.C * m2 : e1.C * m1 + e2.C * m2;
    if (E === 0 || Fv % E !== 0) continue;
    const va = Fv / E;
    const rhsB = e1.C - e1.A * va;
    if (va !== c[u1] || rhsB % e1.B !== 0 || rhsB / e1.B !== c[u2]) throw new Error("factor theorem: two-unknown mismatch");
    const vb = c[u2];

    const mulPart = (k: number, tag: number) => (k === 1 ? `(${tag})` : `${k}\\times(${tag})`);
    const aTerm = e1.A === 1 ? `(${va})` : `${e1.A}(${va})`;
    const working: WorkingStep[] = [
      mStep("Each factor gives a root:", given.map((g, i) => (i === 0 ? `x = ${fracL(rootOf(g))}` : `,\\; x = ${fracL(rootOf(g))}`))),
      ...splitSub("Substitute the first root into f(x) = 0:", [
        `${fOf(fracL(e1.r))} = ${e1.expr}`, `= ${joinTerms(e1.positional)}`, `= 0`, eqL(e1, 1),
      ]),
      ...splitSub("Substitute the second root into f(x) = 0:", [
        `${fOf(fracL(e2.r))} = ${e2.expr}`, `= ${joinTerms(e2.positional)}`, `= 0`, eqL(e2, 2),
      ]),
      mStep(same ? "Match the coefficients of b, then subtract to eliminate b:" : "Match the coefficients of b, then add to eliminate b:", [
        `${mulPart(m1, 1)} ${same ? "-" : "+"} ${mulPart(m2, 2)}`,
        `\\Rightarrow ${joinTerms([coefTerm(E, "a")])} = ${Fv}`,
        `\\Rightarrow a = ${va}`,
      ]),
      mStep("Substitute back into equation (1) to find b:", [
        `${aTerm} ${e1.B < 0 ? "-" : "+"} ${Math.abs(e1.B) === 1 ? "" : Math.abs(e1.B)}b = ${e1.C}`,
        `\\Rightarrow ${joinTerms([coefTerm(e1.B, "b")])} = ${rhsB}`,
        `\\Rightarrow b = ${vb}`,
      ]),
      mStep("The leading coefficient and constant term give the remaining factor:", [
        `f(x) = ${factorsL(given, false)}`, linL(fs[2], false),
      ]),
    ];
    return {
      lines: [
        `$${fLine(c, false, sym)}$ has factors $${linBare(given[0], false)}$ and $${linBare(given[1], false)}$.`,
        `Find the values of $a$ and $b$.`,
        `Hence find the remaining factor of $f(x)$.`,
      ],
      answerLatex: `a = ${va},\\; b = ${vb},\\; ${linL(fs[2], false)}`,
      working,
      raw: { c, fs, u1, u2 },
    };
  }
  throw new Error("factor theorem: could not build twoUnknowns");
};

/** x = (−B ± √D) / 2A in lowest terms. */
const surdSolutions = (A: number, B: number, C: number) => {
  const D = B * B - 4 * A * C;
  let s = 1;
  let t = D;
  for (let k = Math.floor(Math.sqrt(D)); k > 1; k--) if (D % (k * k) === 0) { s = k; t = D / (k * k); break; }
  const g = gcd(gcd(Math.abs(B), s), 2 * A);
  const u = -B / g, v = s / g, w = (2 * A) / g;
  const root = `${v === 1 ? "" : v}\\sqrt{${t}}`;
  const num = `${u === 0 ? "" : u} \\pm ${root}`;
  const latex = w === 1 ? num : `\\dfrac{${num}}{${w}}`;
  return { D, t, s, latex, raw: `\\dfrac{${-B} \\pm \\sqrt{${D}}}{${2 * A}}` };
};
const isSquare = (n: number) => n >= 0 && Math.sqrt(n) % 1 === 0;

const randQuad = (sub: SubTool, kind: "surd" | "noReal"): Poly => {
  for (;;) {
    const A = sub === "y12" ? 1 : pick([1, 1, 2]);
    const B = randInt(1, 6) * randSign();
    const C = randInt(1, 9) * randSign();
    const D = B * B - 4 * A * C;
    if (kind === "surd" ? D > 0 && !isSquare(D) : D < 0) return [A, B, C];
  }
};

const buildSurd = (sub: SubTool, _level: DifficultyLevel): Built => {
  for (let t = 0; t < 300; t++) {
    const g: Lin = sub === "y12" ? { p: 1, q: randInt(1, 4) * randSign() } : randLin(2, 3, 4);
    const quad = randQuad(sub, "surd");
    const c = polyMul([g.p, -g.q], quad);
    if (maxAbs(c) > 90) continue;
    const tr = trial(c);
    if (!eqF(tr.root, rootOf(g)) || (tr.count > 6 && t < 250)) continue;
    const [A, B, Cq] = quad;
    const sol = surdSolutions(A, B, Cq);
    const formula = [
      `x = \\dfrac{-(${B}) \\pm \\sqrt{(${B})^2 - 4(${A})(${Cq})}}{2(${A})}`,
      `= ${sol.raw}`,
    ];
    if (`= ${sol.latex}` !== `= ${sol.raw}`) formula.push(`= ${sol.latex}`);
    const working = [
      mStep(TRIAL_LABEL[sub], tr.frags),
      stepConclude(g, false),
      ...stepsDivide(c, g, quad, false),
      mStep("The quadratic does not factorise, so use the quadratic formula:", formula),
      mStep("The solutions are:", [`x = ${fracL(rootOf(g))}`, `,\\; x = ${sol.latex}`]),
    ];
    return {
      lines: [`Use the factor theorem to find a factor of $${fLine(c)}$.`, `Hence solve $f(x)=0$, giving exact answers.`],
      answerLatex: `x = ${fracL(rootOf(g))},\\; x = ${sol.latex}`,
      working,
      raw: { c, g, quad },
    };
  }
  throw new Error("factor theorem: could not build surd");
};

const buildOneReal = (sub: SubTool, _level: DifficultyLevel): Built => {
  for (let t = 0; t < 300; t++) {
    const g: Lin = sub === "y12" ? { p: 1, q: randInt(1, 4) * randSign() } : randLin(2, 3, 4);
    const quad = randQuad(sub, "noReal");
    const c = polyMul([g.p, -g.q], quad);
    if (maxAbs(c) > 70) continue;
    const [A, B, Cq] = quad;
    const D = B * B - 4 * A * Cq;
    const working = [
      stepZero(g, false), ...stepSub(c, g, false), stepConclude(g, false),
      ...stepsDivide(c, g, quad, false),
      mStep("Check the discriminant of the quadratic factor:", [`b^2 - 4ac = (${B})^2 - 4(${A})(${Cq})`, `= ${D}`]),
      mStep("The discriminant is negative, so the quadratic has no real roots. The only real root comes from the linear factor:", `x = ${fracL(rootOf(g))}`),
    ];
    return {
      lines: [
        `Show that $${linBare(g, false)}$ is a factor of $${fLine(c)}$.`,
        `Hence show that $f(x)=0$ only has one real root.`,
      ],
      answerLatex: `b^2 - 4ac = ${D} < 0,\\; x = ${fracL(rootOf(g))}`,
      working,
      raw: { c, g, quad },
    };
  }
  throw new Error("factor theorem: could not build oneReal");
};

const buildQuartic = (sub: SubTool, level: DifficultyLevel): Built => {
  let fs: Lin[] = [];
  let tr: ReturnType<typeof trial> | null = null;
  let cubic: Poly = [];
  for (let t = 0; t < 200; t++) {
    fs = genFactors(sub, level, { count: 4, maxCoef: sub === "y12" ? 120 : 220 });
    cubic = polyOf(fs.slice(1));
    tr = trial(cubic);
    if (tr.count <= 5) break;
  }
  const c = polyOf(fs);
  const g1 = fs[0];
  const g2 = linFromRoot(tr!.root);
  const rest2 = without(fs.slice(1), g2);
  const working: WorkingStep[] = [
    stepZero(g1, false), ...stepSub(c, g1, false), stepConclude(g1, false),
    ...stepsDivide(c, g1, cubic, false),
    mStep("Use the factor theorem again on the cubic:", tr!.frags),
    stepConclude(g2, false),
    ...stepsDivide(cubic, g2, polyOf(rest2), false, [g1]),
    mStep("Factorise the quadratic:", [`f(x) = ${linL(g1, false)}${linL(g2, false)}`, ...rest2.map(r => linL(r, false))]),
    stepSolve(fs, false),
  ];
  return {
    lines: [
      `Show that $${linBare(g1, false)}$ is a factor of $${fLine(c)}$.`,
      `Hence solve $f(x)=0$.`,
    ],
    answerLatex: `f(x) = ${factorsL([g1, g2, ...rest2], false)},\\; ${rootsAnswer(fs, false)}`,
    working,
    raw: { c, fs },
  };
};

const buildParamA = (sub: SubTool, level: DifficultyLevel): Built => {
  const fs = genFactors(sub, level, { count: 3, param: true, maxCoef: 90 });
  const c = polyOf(fs);
  return {
    lines: [
      `Show that $${linBare(fs[0], true)}$ is a factor of $${fLine(c, true)}$.`,
      `Hence solve $f(x)=0$.`,
    ],
    answerLatex: `f(x) = ${factorsL(fs, true)},\\; ${rootsAnswer(fs, true)}`,
    working: [
      stepZero(fs[0], true), ...stepSub(c, fs[0], true), stepConclude(fs[0], true),
      ...stepsDivideFactorise(fs[0], fs.slice(1), true), stepSolve(fs, true),
    ],
    raw: { c, fs },
  };
};

const buildParamK = (): Built => {
  // x² + (t−1)k x − t s k has the factor (x − k): f(k) = t k² − t s k = t k (k − s)
  const t = pick([2, 3, 4, -2, -3]);
  const s = randInt(1, 6) * randSign();
  const bC = t - 1;
  const cC = -t * s;
  const term = (k: number, body: string): Term => ({ neg: k < 0, body: Math.abs(k) === 1 ? body : `${Math.abs(k)}${body}` });
  const fExpr = joinTerms([{ neg: false, body: "x^2" }, ...(bC !== 0 ? [term(bC, "kx")] : []), term(cC, "k")]);
  const subExpr = joinTerms([{ neg: false, body: "k^2" }, ...(bC !== 0 ? [term(bC, "k(k)")] : []), term(cC, "k")]);
  const collected = joinTerms([term(t, "k^2"), term(cC, "k")]);
  const working = [
    mStep("Set the factor equal to zero:", [`x - k = 0`, `\\Rightarrow x = k`]),
    ...splitSub("Substitute into f(x):", [`f(k) = ${subExpr}`, `= ${collected}`, `= 0`]),
    mStep("Factorise and solve for k:", [
      `${t === 1 ? "" : t}k\\left(k ${s > 0 ? "-" : "+"} ${Math.abs(s)}\\right) = 0`,
      `\\Rightarrow k = 0,\\; k = ${s}`,
    ]),
  ];
  return {
    lines: [`The polynomial $${fExpr}$ has a factor $(x - k)$. Find the possible values of $k$.`],
    answerLatex: `k = 0,\\; k = ${s}`,
    working,
    raw: { t, s },
  };
};

// ── 9. generateQuestion ──────────────────────────────────────────────────────

const BUILDERS: Record<QType, (sub: SubTool, level: DifficultyLevel) => Built> = {
  decide: buildDecide,
  factorise: buildFactorise,
  showSolve: buildShowSolve,
  trialFactorise: (s, l) => buildTrial(s, l, false),
  trialSolve: (s, l) => buildTrial(s, l, true),
  findUnknown: buildFindUnknown,
  twoUnknowns: buildTwoUnknowns,
  surd: buildSurd,
  oneReal: buildOneReal,
  quartic: buildQuartic,
  paramA: buildParamA,
  paramK: () => buildParamK(),
};

const withoutLongDivision = (w: WorkingStep[]) => w.filter(st => st.type !== "longDivision");

/** Switching the Division working option only changes the steps shown — same question, same answer. */
const reformatQuestion = (q: AnyQuestion, qo: QOSnapshot): AnyQuestion | null => {
  const full = (q as any)._workingFull as WorkingStep[] | undefined; // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!full) return null;
  return { ...q, working: qo.dropdownValue === "result" ? withoutLongDivision(full) : full } as unknown as AnyQuestion;
};

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  _variables: Record<string, boolean>,
  dropdownValue: string,
  multiSelectValues?: Record<string, boolean>,
): AnyQuestion => {
  const sub = tool as SubTool;
  const qPool = POOLS[sub][level];
  const type = pickActive(multiSelectValues ?? {}, qPool.options) as QType;
  let built: Built | null = null;
  let err: unknown = null;
  for (let i = 0; i < 12 && !built; i++) {
    try { built = BUILDERS[type](sub, level); } catch (e) { err = e; }
  }
  if (!built) throw err;
  const id = Math.floor(Math.random() * 1_000_000);
  return {
    kind: "worded",
    lines: built.lines,
    answer: plainOf(built.answerLatex),
    answerLatex: built.answerLatex,
    working: dropdownValue === "result" ? withoutLongDivision(built.working) : built.working,
    key: `ft-${sub}-${level}-${type}-${built.lines[0]}-${id}`,
    difficulty: level,
    _rawValues: built.raw,
    _workingFull: built.working,
    _difficultyScore: weightOf(qPool.options, type),
  } as unknown as AnyQuestion;
};

// ─────────────────────────────────────────────────────────────────────────────

// Exposed for the generator smoke-test suite (src/tests/generators.test.ts).
export const __test = { TOOL_CONFIG, generateQuestion };

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      reformatQuestion={reformatQuestion}
      stepRenderer={longDivisionStepRenderer}
      defaults={{ numQuestions: 6, numColumns: 2, collapseWorkingByDefault: true }}
    />
  );
}
