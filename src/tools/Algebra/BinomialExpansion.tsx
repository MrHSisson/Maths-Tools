import {
  ToolShell, resolveMultiSelectValues,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type WorkingStep, type ToolMultiSelect,
  randInt, pick, mStep, pickActive,
} from "../../shared";
import {
  F, add, mul, div, eq, absF, lt, powI, toNum, frAbsTex, frTex, frSmall, frPlain, series, powRat, polyTex, polyFrags,
  kxTex, linTex, kxPlain, modLt, termSubst, stepVisual, withExtra, opt, pool, askPool, toPool, entry, upToOf, rangeText, powerWritten,
  nonZero, bracketTex, powerTex, type Fr, type Binom,
} from "../../shared/binomial";

// ═══════════════════════════════════════════════════════════
// Binomial expansion (A-Level Mathematics, AQA 7357, Year 2) — expand (a + bx)^n for any rational n, give the range of validity, and use it to
// approximate. Everything is exact (rational arithmetic). Fractions are the next two tools: Binomial Expansion of Fractions (one bracket in the
// denominator, no partial fractions) and Binomial Expansion with Partial Fractions. Spec: specs/binomial-expansion.md
//   Expand (a + bx)ⁿ — (1 + kx)ⁿ, then (a + bx)ⁿ taking aⁿ out; the range |bx/a| < 1
//   Approximation   — use a small x in the expansion to estimate a value; say when an x cannot be used
// ═══════════════════════════════════════════════════════════

// ── 1. TOOL_CONFIG ──────────────────────────────────────────

type SubTool = "expand" | "approx";

// Level 1: (1 + kx)ⁿ, whole k, n = −1, −2, ½, −½.  Level 2: the powers Level 1 never uses (−3, −4, 3/2, −3/2, ⅓) with any k, or Level 1's powers with a
// FRACTIONAL k.  Level 3: (a + bx)ⁿ with a ≠ 1 (aⁿ taken out first).
const nPool = (level: DifficultyLevel) => level === "level1"
  ? pool("power", "Power n", [opt("neg", "−1, −2"), opt("half", "½, −½")])
  : level === "level2"
    ? pool("power", "Power n", [opt("fresh", "−3, −4, 3/2, −3/2, ⅓"), opt("old", "−1, −2, ½, −½ (fractional k)")])
    : pool("power", "Power n", [opt("neg", "−1, −2, −3"), opt("half", "½, −½"), opt("three", "3/2, −3/2, ⅓", false)]);
const kPool = (level: DifficultyLevel) => level === "level1"
  ? pool("kForm", "Coefficient of x", [opt("whole", "Whole numbers")])
  : pool("kForm", "Coefficient of x", [opt("whole", "Whole numbers"), opt("frac", "Fractions")]);
const writtenPool = pool("written", "Written as", [opt("exp", "Powers", true), opt("root", "Roots and fractions", true)]);

const EXPAND_POOLS: Record<DifficultyLevel, ToolMultiSelect[]> = {
  level1: [nPool("level1"), kPool("level1"), writtenPool, askPool("level1"), toPool("level1")],
  level2: [nPool("level2"), kPool("level2"), writtenPool, askPool("level2"), toPool("level2")],
  level3: [nPool("level3"), writtenPool, askPool("level3"), toPool("level3")],
};

const APPROX_POOLS: Record<DifficultyLevel, ToolMultiSelect[]> = {
  level1: [pool("ask", "Ask for", [opt("use", "Estimate a value")])],
  level2: [pool("ask", "Ask for", [opt("use", "Estimate a value")])],
  level3: [pool("ask", "Ask for", [opt("use", "Estimate a value"), opt("valid", "Can this x be used?")])],
};

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Binomial Expansion",
  tools: {
    expand: entry("Expand (a + bx)ⁿ", EXPAND_POOLS, ["(1 + kx)ⁿ, whole k, n = −1, −2, ½ or −½ (as powers, roots or fractions), up to x²", "Powers Level 1 lacks (−3, −4, 3/2, ⅓), or fractional k, up to x³", "(a + bx)ⁿ with a ≠ 1: take aⁿ out first"]),
    approx: entry("Approximation", APPROX_POOLS, ["Expansion given: substitute a small x", "Expand (1 + kx)ⁿ first, then estimate", "(a + bx)ⁿ with a ≠ 1, and why a given x cannot be used"]),
  },
};

// ── 2. INFO_SECTIONS ────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  { title: "Scope", icon: "🎯", content: [
    { label: "AQA A-level Maths, Year 2", detail: "(a + bx)ⁿ for rational n, its range of validity |x| < c (also −c < x < c) and approximation. Fractions have their own tools. Not covered: positive whole n, integration." },
  ]},
  { title: "Expand (a + bx)ⁿ", icon: "🔢", content: [
    { label: "Method", detail: "(1 + u)ⁿ = 1 + nu + n(n − 1)/2! u² + …, valid for |u| < 1, with u = kx. For (a + bx)ⁿ take aⁿ out first." },
    { label: "Levels", detail: "Green: (1 + kx)ⁿ, whole k. Yellow: other powers, or fractional k. Red: a ≠ 1." },
  ]},
  { title: "Approximation", icon: "🎯", content: [
    { label: "Method", detail: "Substitute a small x into the expansion and compare with a calculator." },
    { label: "Levels", detail: "Green: expansion given. Yellow: expand first. Red: a ≠ 1, and why a given x cannot be used." },
  ]},
];

// ── 3. Expand (a + bx)^n ────────────────────────────────────

const nPick = (form: string, level: DifficultyLevel): Fr =>
  form === "half" ? pick([F(1, 2), F(-1, 2)])
  : form === "three" ? pick([F(3, 2), F(-3, 2), F(1, 3)])
  : form === "fresh" ? pick([F(-3), F(-4), F(3, 2), F(-3, 2), F(1, 3)])
  : form === "old" ? pick([F(-1), F(-2), F(1, 2), F(-1, 2)])
  : pick(level === "level1" ? [F(-1), F(-2)] : [F(-1), F(-2), F(-3)]);

/** a for which a^n is rational: a perfect square/cube for fractional powers, 2–5 for whole powers */
const aPick = (n: Fr): number => (n.d === 1 ? pick([2, 3, 4, 5]) : n.d === 2 ? pick([4, 9]) : pick([8, 27]));

function pickK(kForm: string): Fr {
  if (kForm === "frac") return pick([F(1, 2), F(-1, 2), F(1, 3), F(-1, 3), F(2, 3), F(-2, 3), F(3, 2), F(-3, 2), F(1, 4), F(-1, 4)]);
  if (kForm === "negWhole") return F(-randInt(1, 4));
  if (kForm === "posWhole") return F(randInt(2, 5));
  return F(pick([1, 2, 3, 4, 5, -1, -2, -3, -4, -5]));
}

function expandWorking(bn: Binom, m: number): { steps: WorkingStep[]; answer: Fr[]; k: Fr; bound: Fr; mult: Fr } {
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
  steps.push(withExtra(mStep("Valid for |u| < 1:", [`\\left|${kx}\\right| < 1`, ` \\Rightarrow ${modLt(bound)}`]), { kind: "binInterval", rows: [{ label: modLt(bound), c: toNum(bound), plain: frPlain(bound) }] }));
  return { steps, answer: full, k, bound, mult };
}

function expandQuestion(level: DifficultyLevel, msv: Record<string, boolean>): AnyQuestion {
  const pools = EXPAND_POOLS[level];
  const pk = (key: string) => pickActive(msv, pools.find((q) => q.key === key)!.options);
  const ask = pk("ask");
  const m = upToOf(pk("upTo"));
  const root = pk("written") === "root";
  const n = nPick(pk("power"), level);
  let bn: Binom;
  if (level === "level3") {
    const a = aPick(n);
    let b = randInt(1, 4) * pick([1, -1]);
    if (Math.abs(b) === a && Math.random() < 0.5) b = b + 1;
    bn = { a, b: F(b), n };
  } else {
    // Level 2 never repeats a Level 1 question: Level 1's powers only come with a fractional k there, the new powers with any k
    const l1 = [F(-1), F(-2), F(1, 2), F(-1, 2)].some((x) => eq(x, n));
    bn = { a: 1, b: pickK(level === "level2" && l1 ? "frac" : pk("kForm")), n };
  }
  const { steps, answer, bound } = expandWorking(bn, m);
  const expr = powerWritten(bracketTex(bn), bn.n, root);
  const lines = ask === "coef"
    ? [`Find the coefficient of $x^{${m}}$ in the expansion of $${expr}$.`]
    : [`Expand $${expr}$ up to $x^{${m}}$.`, ...(ask === "range" ? ["State the range of validity of the expansion."] : [])];
  const id = Math.floor(Math.random() * 1_000_000);
  return {
    kind: "worded", lines,
    answer: ask === "coef" ? frPlain(answer[m]) : polyTex(answer),
    answerLatex: ask === "coef" ? frTex(answer[m]) : polyTex(answer),
    answerSuffix: ask === "range" ? `, ${rangeText(bound)}` : undefined,
    working: steps,
    key: `be-expand-${level}-${frPlain(bn.n)}-${bn.a}-${frPlain(bn.b)}-${m}-${ask}-${root ? "r" : "p"}-${id}`,
    difficulty: level,
    _raw: { shape: "bracket", bn, m, ask },
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
    lines.push(`The expansion of $${expr}$ is used with $x = ${frTex(bad)}$. Explain why this is not valid.`);
    steps.push(mStep("Valid for |u| < 1:", [`\\left|${kxTex(k)}\\right| < 1`, ` \\Rightarrow ${modLt(bound)}`]));
    steps.push(mStep("Check x:", [`\\left|${kxTex(k)}\\right| = ${frTex(ratio)}`, ` \\geq 1`, ` \\Rightarrow \\left|x\\right| = ${frTex(absF(bad))} \\geq ${frTex(bound)}`]));
    answer = `|x| = ${frPlain(absF(bad))} is not less than ${frPlain(bound)}, so x is outside the range of validity`;
    answerLatex = `\\left|x\\right| = ${frAbsTex(bad)} \\not< ${frTex(bound)}`;
    return {
      kind: "worded", lines, answer, answerLatex, answerSuffix: ", so x is outside the range of validity and the expansion cannot be used",
      working: steps, key: `be-approx-valid-${level}-${frPlain(bn.n)}-${bn.a}-${frPlain(bn.b)}-${frPlain(bad)}-${id}`, difficulty: level,
    } as unknown as AnyQuestion;
  }

  const full = expandWorking(bn, m);
  const approxF = full.answer.reduce<Fr>((acc, c, r) => add(acc, mul(c, powI(xv, r))), F(0));
  const exact = Math.pow(1 + toNum(u), toNum(n)) * toNum(full.mult);
  const baseTex = `${decimal(1 + toNum(u), 2).replace(/0+$/, "").replace(/\.$/, "")}`;
  const number = bn.a === 1 ? valueTex(baseTex, n) : `${valueTex(`${decimal(bn.a + toNum(bn.b) * toNum(xv), 2).replace(/0+$/, "").replace(/\.$/, "")}`, n)}`;
  const expLatex = polyTex(full.answer);
  if (level === "level1") {
    lines.push(`$${expr} \\approx ${expLatex}$. Use $x = ${dec(xv)}$ to estimate $${number}$.`);
  } else {
    lines.push(`Expand $${expr}$ up to $x^{2}$, then use $x = ${dec(xv)}$ to estimate $${number}$.`);
  }
  if (level !== "level1") steps.push(...full.steps);
  else steps.push(mStep("In range:", [`\\left|${kxTex(k)}\\right| = ${frTex(absF(u))} < 1`]));
  const subbed = expLatex.replace(/x\^\{(\d)\}/g, `(${dec(xv)})^{$1}`).replace(/(\d|\})x(?!\^)/g, `$1(${dec(xv)})`).replace(/(^|[+\-] )x(?![\^(])/g, `$1(${dec(xv)})`);
  steps.push(mStep(`Substitute x = ${dec(xv)}:`, [subbed, ` \\approx ${decimal(toNum(approxF), 6).replace(/0+$/, "").replace(/\.$/, "")}`]));
  steps.push(mStep("Calculator:", [`${number} = ${decimal(exact, 6)}\\ldots`]));
  answer = `${decimal(toNum(approxF), 6)}`;
  answerLatex = `${decimal(toNum(approxF), 6).replace(/0+$/, "").replace(/\.$/, "")}`;
  return {
    kind: "worded", lines, answer, answerLatex, answerSuffix: ` (calculator: ${decimal(exact, 6)})`,
    working: steps, key: `be-approx-${level}-${frPlain(bn.n)}-${bn.a}-${frPlain(bn.b)}-${frPlain(xv)}-${id}`, difficulty: level,
  } as unknown as AnyQuestion;
}


// ── 4. generateQuestion ─────────────────────────────────────

const generateQuestion = (
  tool: string, level: DifficultyLevel,
  _vars: Record<string, boolean>, _dropdownValue: string, multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  const t = tool as SubTool;
  const pools = t === "expand" ? EXPAND_POOLS[level] : APPROX_POOLS[level];
  const msv = resolveMultiSelectValues(pools, multiSelectValues);
  return t === "expand" ? expandQuestion(level, msv) : approxQuestion(level, msv);
};

// ── 5. Export ───────────────────────────────────────────────

export const __test = { TOOL_CONFIG, generateQuestion, helpers: { expandWorking } };

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      stepVisualRenderer={stepVisual}
      stepVisualKeepsWorking
      stepVisualPlacement="top"
      defaults={{ numQuestions: 6, numColumns: 2, collapseWorkingByDefault: true }}
    />
  );
}
