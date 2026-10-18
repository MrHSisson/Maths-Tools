import {
  ToolShell, resolveMultiSelectValues, maskUnmetOptions,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type WorkingStep, type ToolMultiSelect,
  randInt, pick, mStep, pickActive,
} from "../../shared";
import {
  F, add, mul, div, neg, eq, absF, lt, powI, toNum, frAbsTex, frTex, frSmall, frPlain, polyTex, 
  kxTex, condTex, stepVisual, opt, pool, askPool, toPool, entry, upToOf, rangeText, powerWritten, rootTex, expandWorking, signPool, sizePool, nPick,
  nonZero, bracketTex, powerTex, type Fr, type Binom,
} from "../../shared/binomial";
import { ONE_POOLS, POWER_POOLS, ONE_LEVELS, POWER_LEVELS, generateFraction, fractionHelpers } from "./BinomialFractions";
import { UNKNOWN_POOLS, UNKNOWN_LEVELS, generateUnknown } from "./BinomialUnknown";
import { RANGE_POOLS, RANGE_LEVELS, generateRange } from "./BinomialRange";
import { PARTIAL_POOLS, PARTIAL_LEVELS, generatePartial, partialHelpers } from "./BinomialPartialFractions";

// ═══════════════════════════════════════════════════════════
// Binomial expansion (A-Level Mathematics, AQA 7357, Year 2) — ONE tool, five sub-tools. Everything is exact (rational arithmetic).
// Spec: specs/binomial-expansion.md
//   Expand (a + bx)ⁿ        — (1 + kx)ⁿ, then (a + bx)ⁿ taking aⁿ out; the range |bx/a| < 1
//   One bracket below       — (px + q)/(r + sx)ⁿ as a product, no partial fractions        (BinomialFractions.ts)
//   Power of a fraction     — ((px + q)/(r + sx)) squared, cubed, √ or ∛                    (BinomialFractions.ts)
//   With partial fractions  — two or more different brackets below: partial fractions first (BinomialPartialFractions.ts)
//   Approximation           — use a small x in the expansion to estimate a value; say when an x cannot be used
// ═══════════════════════════════════════════════════════════

// ── 1. TOOL_CONFIG ──────────────────────────────────────────

type SubTool = "expand" | "one" | "power" | "partial" | "range" | "unknown" | "approx";

// Level 1: (1 + kx)ⁿ, whole k, n = −1, −2, ½, −½.  Level 2: the powers Level 1 never uses (−3, −4, 3/2, −3/2, ⅓) with any k, or Level 1's powers with a
// FRACTIONAL k.  Level 3: (a + bx)ⁿ with a ≠ 1 (aⁿ taken out first).
// The level is the bracket, as on the fraction tabs: Level 1 (1 ± x, no k), Level 2 (1 + kx, k whole or a fraction), Level 3 (a + bx)
const kPool = (level: DifficultyLevel) => level === "level2" ? [pool("kForm", "Coefficient of x", [opt("kWhole", "Whole numbers"), opt("kFrac", "Fractions")])] : [];
const writtenPool = pool("written", "Written as", [opt("exp", "Powers", true), opt("root", "Roots and fractions", false)]);

const EXPAND_POOLS: Record<DifficultyLevel, ToolMultiSelect[]> = {
  level1: [signPool, sizePool("level1"), writtenPool, askPool("level1"), pool("upTo", "Expand up to", [opt("x2", "x²"), opt("x3", "x³"), opt("x4", "x⁴*", false)])], // Level 1 has few distinct brackets, so x³ is on too: a 15-question sheet then rarely repeats
  level2: [signPool, sizePool("level2"), ...kPool("level2"), writtenPool, askPool("level2"), toPool("level2")],
  level3: [signPool, sizePool("level3"), writtenPool, askPool("level3"), toPool("level3")],
};

const approxAsk = (level: DifficultyLevel) => pool("ask", "Ask for", [opt("use", "Given x"), opt("findx", "Work out x", false), ...(level === "level3" ? [opt("valid", "Can this x be used?", false)] : [])]);
const approxAccuracy = pool("accuracy", "Answer", [opt("dp4", "To 4 d.p."), opt("full", "Not rounded", false)]);
const approxUpTo = pool("upTo", "Expand up to", [opt("x2", "x²"), opt("x3", "x³", false)]);
const APPROX_POOLS: Record<DifficultyLevel, ToolMultiSelect[]> = {
  level1: [signPool, sizePool("level1"), approxAsk("level1"), approxUpTo, approxAccuracy],
  level2: [signPool, sizePool("level2"), approxAsk("level2"), approxUpTo, approxAccuracy],
  level3: [signPool, sizePool("level3"), approxAsk("level3"), approxUpTo, approxAccuracy],
};

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Binomial Expansion",
  tools: {
    expand: entry("Expand (a + bx)ⁿ", EXPAND_POOLS, ["(1 ± x)ⁿ: no k, any power", "(1 + kx)ⁿ: k a whole number or a fraction", "(a + bx)ⁿ with a ≠ 1: take aⁿ out first"]),
    one: entry("Fractions: one bracket", ONE_POOLS, ONE_LEVELS),
    power: entry("Power of a fraction", POWER_POOLS, POWER_LEVELS),
    partial: entry("With partial fractions", PARTIAL_POOLS, PARTIAL_LEVELS),
    range: entry("Range of validity", RANGE_POOLS, RANGE_LEVELS),
    unknown: entry("Find the unknown", UNKNOWN_POOLS, UNKNOWN_LEVELS),
    approx: entry("Approximation", APPROX_POOLS, ["Expansion given: substitute a small x", "Expand (1 + kx)ⁿ first, then estimate", "(a + bx)ⁿ with a ≠ 1, and why a given x cannot be used"]),
  },
};

// ── 2. INFO_SECTIONS ────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  { title: "Scope", icon: "🎯", content: [
    { label: "AQA A-level Maths, Year 2", detail: "(a + bx)ⁿ for rational n, its range of validity |x| < c (also −c < x < c), fractions with and without partial fractions, and approximation. Not covered: positive whole n, integration." },
    { label: "Which fraction tab?", detail: "One bracket in the denominator needs no partial fractions: (1 + x)/(1 − x) = (1 + x)(1 − x)⁻¹. Two or more different brackets in the denominator need partial fractions first." },
  ]},
  { title: "Expand (a + bx)ⁿ", icon: "🔢", content: [
    { label: "Sign and size of n", detail: "Sign (positive / negative) and size: whole, the fractions ½, ⅓, 3/2, or the fractions ¼ to ⅘ (off by default)." },
    { label: "Method", detail: "(1 + u)ⁿ = 1 + nu + n(n − 1)/2! u² + …, valid for |u| < 1, with u = kx. For (a + bx)ⁿ take aⁿ out first." },
    { label: "Levels", detail: "The level is the bracket, as on the fraction tabs: Green (1 ± x)ⁿ, Yellow (1 + kx)ⁿ with k whole or a fraction, Red (a + bx)ⁿ with a ≠ 1. Any power at any level." },
  ]},
  { title: "Fractions: one bracket · Power of a fraction", icon: "➗", content: [
    { label: "Method", detail: "Take out constants, expand each bracket, multiply, then multiply by the constants. The range is the smaller of the brackets' ranges (a whole-number power of the numerator puts no limit on x)." },
    { label: "Levels", detail: "The level is the denominator bracket: Green 1 ± x, Yellow 1 + kx, Red a + bx. The numerator is any px + q. The power is an option, grouped as whole, roots (√ ∛) or ¼ to ⅘ (off by default): the denominator to 1, 2, 3 or a root, or the whole fraction to 2, 3 or a root (a root needs perfect-power constants)." },
  ]},
  { title: "With partial fractions", icon: "➗", content: [
    { label: "Method", detail: "Partial fractions, expand each fraction, add like terms; the range is the smaller of the fractions' ranges." },
    { label: "Levels", detail: "Green: (1 + ax)(1 + bx). Yellow: factors like (2 − x)(1 + 3x), up to x³. Red: a repeated factor, or divide first." },
  ]},
  { title: "Range of validity", icon: "↔️", content: [
    { label: "Method", detail: "Each bracket raised to a power that is not a positive whole number needs |kx| < 1. x must satisfy every one, so the range is the smallest bound. Level 1: one bracket; Level 2: two brackets; Level 3: the denominators of a partial-fractions question." },
  ]},
  { title: "Find the unknown", icon: "❓", content: [
    { label: "Method", detail: "The power n is known. A constant in the bracket (a, or b) is found from a coefficient of the expansion, then used to go on. Level 1: a from the coefficient of x. Level 2: a from the coefficient of x² (a² = …, so a sign is given or both values asked). Level 3: (a + bx)ⁿ, b from a coefficient, or a and b from the first two terms." },
  ]},
  { title: "Approximation", icon: "🎯", content: [
    { label: "Method", detail: "Substitute a small x into the expansion and compare with a calculator. \"Work out x\" makes the student find which x to use: the bracket must equal the number." },
    { label: "Options", detail: "The same sign and size of n as Expand, expand up to x² or x³, and answers to 4 decimal places (or not rounded)." },
    { label: "Levels", detail: "Green: (1 ± kx)ⁿ with the expansion given. Yellow: expand first. Red: a ≠ 1, and why a given x cannot be used." },
  ]},
];

// ── 3. Expand (a + bx)^n ────────────────────────────────────

/** a for which a^n is rational: a perfect square/cube for fractional powers, 2–5 for whole powers */
const aPick = (n: Fr): number => (n.d === 1 ? pick([2, 3, 4, 5]) : pick([2, 3].map((r) => r ** n.d)));

function pickK(kForm: string): Fr {
  if (kForm === "kFrac") return pick([F(1, 2), F(-1, 2), F(1, 3), F(-1, 3), F(2, 3), F(-2, 3), F(3, 2), F(-3, 2), F(1, 4), F(-1, 4)]);
  if (kForm === "negWhole") return F(-randInt(1, 4));
  if (kForm === "posWhole") return F(randInt(2, 5));
  return F(pick([2, 3, 4, 5, -2, -3, -4, -5]));
}

function expandQuestion(level: DifficultyLevel, msv: Record<string, boolean>): AnyQuestion {
  const pools = EXPAND_POOLS[level];
  const pk = (key: string) => pickActive(msv, pools.find((q) => q.key === key)!.options);
  const ask = pk("ask");
  const m = upToOf(pk("upTo"));
  const root = pk("written") === "root";
  const active = (key: string) => pools.find((q) => q.key === key)!.options.filter((o) => msv[o.value]).map((o) => o.value);
  const sizes = active("powerSize"), signs = active("powerSign");
  const n = nPick(sizes.filter((v) => v !== "whole" || signs.includes("negative")), signs, level);
  let bn: Binom;
  if (level === "level3") {
    const a = aPick(n);
    let b = randInt(1, 4) * pick([1, -1]);
    if (Math.abs(b) === a && Math.random() < 0.5) b = b + 1;
    bn = { a, b: F(b), n };
  } else {
    // Level 1 is (1 ± x), no k; Level 2 is (1 + kx) with k a whole number (not ±1) or a fraction
    bn = { a: 1, b: level === "level1" ? F(pick([1, -1])) : pickK(pk("kForm")), n };
  }
  const { steps, answer, bound } = expandWorking(bn, m);
  const expr = powerWritten(bracketTex(bn), bn.n, root);
  const lines = ask === "coef"
    ? [`Find the coefficient of $x^{${m}}$ in the expansion of $${expr}$.`]
    : ask === "range"
      ? [`(a) Expand $${expr}$ up to $x^{${m}}$.`, "(b) State the range of values of $x$ for which the expansion is valid."]
      : [`Expand $${expr}$ up to $x^{${m}}$.`];
  return {
    kind: "worded", lines,
    answer: ask === "coef" ? frPlain(answer[m]) : polyTex(answer),
    answerLatex: ask === "coef" ? frTex(answer[m]) : polyTex(answer),
    answerSuffix: ask === "range" ? `, ${rangeText(bound)}` : undefined,
    working: steps,
    key: `be-expand-${level}-${frPlain(bn.n)}-${bn.a}-${frPlain(bn.b)}-${m}-${ask}-${root ? "r" : "p"}`,
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
  if (n.d > 1) return n.n > 0 ? rootTex(base, n) : `\\dfrac{1}{${rootTex(base, neg(n))}}`;
  return `${base}^{${frSmall(n)}}`;
}
const decimal = (v: number, dp: number) => v.toFixed(dp);
const dec = (f: Fr) => `${toNum(f)}`.replace(/(\.\d*?[1-9])0+$/, "$1");

function approxQuestion(level: DifficultyLevel, msv: Record<string, boolean>): AnyQuestion {
  const pools = APPROX_POOLS[level];
  const ask = pickActive(msv, pools.find((q) => q.key === "ask")!.options);
  // the same power selectors as Expand; a small x and a coefficient k, so u = kx is a few hundredths
  const active = (key: string) => pools.find((q) => q.key === key)!.options.filter((o) => msv[o.value]).map((o) => o.value);
  const signs = active("powerSign");
  const n = nPick(active("powerSize").filter((v) => v !== "whole" || signs.includes("negative")), signs, level);
  const m = pickActive(msv, approxUpTo.options) === "x3" ? 3 : 2;
  const dp4 = pickActive(msv, approxAccuracy.options) === "dp4";
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
    steps.push(mStep("Valid for |u| < 1:", [condTex(k, bound)]));
    steps.push(mStep("Check x:", [`\\left|${kxTex(k)}\\right| = ${frTex(ratio)}`, ` \\geq 1`, ` \\Rightarrow \\left|x\\right| = ${frTex(absF(bad))} \\geq ${frTex(bound)}`]));
    answer = `|x| = ${frPlain(absF(bad))} is not less than ${frPlain(bound)}, so x is outside the range of validity`;
    answerLatex = `\\left|x\\right| = ${frAbsTex(bad)} \\not< ${frTex(bound)}`;
    return {
      kind: "worded", lines, answer, answerLatex, answerSuffix: ", so x is outside the range of validity and the expansion cannot be used",
      working: steps, key: `be-approx-valid-${level}-${frPlain(bn.n)}-${bn.a}-${frPlain(bn.b)}-${frPlain(bad)}`, difficulty: level,
    } as unknown as AnyQuestion;
  }

  const full = expandWorking(bn, m);
  const approxF = full.answer.reduce<Fr>((acc, c, r) => add(acc, mul(c, powI(xv, r))), F(0));
  const exact = Math.pow(1 + toNum(u), toNum(n)) * toNum(full.mult);
  const baseTex = `${decimal(1 + toNum(u), 2).replace(/0+$/, "").replace(/\.$/, "")}`;
  const number = bn.a === 1 ? valueTex(baseTex, n) : `${valueTex(`${decimal(bn.a + toNum(bn.b) * toNum(xv), 2).replace(/0+$/, "").replace(/\.$/, "")}`, n)}`;
  const expLatex = polyTex(full.answer);
  const findx = ask === "findx";
  if (findx) {
    // the student works out which x to substitute: the bracket must equal the number under the root
    if (level === "level1") lines.push(`$${expr} \\approx ${expLatex}$.`, `(a) Find the value of $x$ to use to estimate $${number}$.`, `(b) Hence estimate $${number}$.`);
    else lines.push(`(a) Expand $${expr}$ up to $x^{${m}}$.`, `(b) Find the value of $x$ to use to estimate $${number}$.`, `(c) Hence estimate $${number}$.`);
  } else if (level === "level1") {
    lines.push(`$${expr} \\approx ${expLatex}$. Use $x = ${dec(xv)}$ to estimate $${number}$.`);
  } else {
    lines.push(`Expand $${expr}$ up to $x^{${m}}$, then use $x = ${dec(xv)}$ to estimate $${number}$.`);
  }
  if (level !== "level1") steps.push(...full.steps);
  else steps.push(mStep("In range:", [`\\left|${kxTex(k)}\\right| = ${frTex(absF(u))} < 1`]));
  if (findx) {
    const val = bn.a + toNum(bn.b) * toNum(xv);
    const bx = `${bn.b.n === 1 ? "" : bn.b.n === -1 ? "-" : bn.b.n}x`;
    steps.push(mStep("Match the bracket to the number:", [`${bracketTex(bn)} = ${decimal(val, 2).replace(/0+$/, "").replace(/\.$/, "")}`, ` \\Rightarrow ${bx} = ${dec(mul(bn.b, xv))}`, ` \\Rightarrow x = ${dec(xv)}`]));
  }
  if (dp4) lines[lines.length - 1] += " Give your answer to 4 decimal places.";
  const subbed = expLatex.replace(/x\^\{(\d)\}/g, `(${dec(xv)})^{$1}`).replace(/(\d|\})x(?!\^)/g, `$1(${dec(xv)})`).replace(/(^|[+\-] )x(?![\^(])/g, `$1(${dec(xv)})`);
  steps.push(mStep(`Substitute x = ${dec(xv)}:`, [subbed, ` \\approx ${decimal(toNum(approxF), 6).replace(/0+$/, "").replace(/\.$/, "")}`]));
  if (dp4) steps.push(mStep("Round to 4 decimal places:", [` \\approx ${decimal(toNum(approxF), 4)}`]));
  steps.push(mStep("Calculator:", [`${number} = ${decimal(exact, dp4 ? 4 : 6)}${dp4 ? "" : "\\ldots"}`]));
  answer = dp4 ? decimal(toNum(approxF), 4) : `${decimal(toNum(approxF), 6)}`;
  answerLatex = dp4 ? decimal(toNum(approxF), 4) : `${decimal(toNum(approxF), 6).replace(/0+$/, "").replace(/\.$/, "")}`;
  return {
    kind: "worded", lines, answer, answerLatex, answerSuffix: `${findx ? ` (x = ${dec(xv)}; ` : " ("}calculator: ${decimal(exact, dp4 ? 4 : 6)})`,
    working: steps, key: `be-approx-${level}-${frPlain(bn.n)}-${bn.a}-${frPlain(bn.b)}-${frPlain(xv)}-${m}-${ask}-${dp4}`, difficulty: level,
  } as unknown as AnyQuestion;
}


// ── 4. generateQuestion ─────────────────────────────────────

const POOLS: Record<SubTool, Record<DifficultyLevel, ToolMultiSelect[]>> = { expand: EXPAND_POOLS, one: ONE_POOLS, power: POWER_POOLS, partial: PARTIAL_POOLS, range: RANGE_POOLS, unknown: UNKNOWN_POOLS, approx: APPROX_POOLS };

const generateQuestion = (
  tool: string, level: DifficultyLevel,
  _vars: Record<string, boolean>, _dropdownValue: string, multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  const t = tool as SubTool;
  const msv = maskUnmetOptions(POOLS[t][level], resolveMultiSelectValues(POOLS[t][level], multiSelectValues));
  return t === "expand" ? expandQuestion(level, msv)
    : t === "one" || t === "power" ? generateFraction(t, level, msv)
    : t === "partial" ? generatePartial(level, msv)
    : t === "range" ? generateRange(level, msv)
    : t === "unknown" ? generateUnknown(level, msv)
    : approxQuestion(level, msv);
};

// ── 5. Export ───────────────────────────────────────────────

export const __test = { TOOL_CONFIG, generateQuestion, helpers: { expandWorking, ...fractionHelpers, ...partialHelpers } };

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
