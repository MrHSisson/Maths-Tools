import {
  ToolShell, resolveMultiSelectValues, maskUnmetOptions,
  type ToolConfig, type DifficultyLevel, type AnyQuestion, type WorkingStep, type ToolMultiSelect,
  randInt, pick, mStep, pickActive,
} from "../../shared";
import { applyAbout } from "../../shared";
import { ABOUT } from "./BinomialExpansion.about";
import {
  F, add, mul, div, neg, eq, absF, lt, powI, toNum, frAbsTex, frTex, frSmall, frPlain, polyTex, 
  kxTex, condTex, stepVisual, opt, pool, askPool, toPool, entry, upToOf, rangeText, powerWritten, rootTex, expandWorking, signPool, sizePool, nPick,
  nonZero, bracketTex, powerTex, type Fr, type Binom,
} from "../../shared/binomial";
import { ONE_POOLS, POWER_POOLS, generateFraction, fractionHelpers } from "./BinomialFractions";
import { UNKNOWN_POOLS, generateUnknown } from "./BinomialUnknown";
import { RANGE_POOLS, generateRange } from "./BinomialRange";
import { PARTIAL_POOLS, generatePartial, partialHelpers } from "./BinomialPartialFractions";

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
  level1: [signPool, sizePool("level1"), writtenPool, askPool("level1"), pool("upTo", "Expand Up to", [opt("x2", "x²"), opt("x3", "x³"), opt("x4", "x⁴*", false)])], // Level 1 has few distinct brackets, so x³ is on too: a 15-question sheet then rarely repeats
  level2: [signPool, sizePool("level2"), ...kPool("level2"), writtenPool, askPool("level2"), toPool("level2")],
  level3: [signPool, sizePool("level3"), writtenPool, askPool("level3"), toPool("level3")],
};

const approxAsk = (level: DifficultyLevel) => pool("ask", "Ask for", [opt("use", "Given x"), opt("findx", "Work out x", false), ...(level === "level3" ? [opt("valid", "Can this x be used?", false)] : [])]);
const approxAccuracy = pool("accuracy", "Answer", [opt("dp4", "To 4 d.p."), opt("full", "Not rounded", false)]);
const approxUpTo = pool("upTo", "Expand Up to", [opt("x2", "x²"), opt("x3", "x³", false)]);
const APPROX_POOLS: Record<DifficultyLevel, ToolMultiSelect[]> = {
  level1: [signPool, sizePool("level1"), approxAsk("level1"), approxUpTo, approxAccuracy],
  level2: [signPool, sizePool("level2"), approxAsk("level2"), approxUpTo, approxAccuracy],
  level3: [signPool, sizePool("level3"), approxAsk("level3"), approxUpTo, approxAccuracy],
};

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Binomial Expansion",
  tools: {
    expand: entry("Expand (a + bx)ⁿ", EXPAND_POOLS),
    one: entry("Fractions: one bracket", ONE_POOLS),
    power: entry("Power of a fraction", POWER_POOLS),
    partial: entry("With partial fractions", PARTIAL_POOLS),
    range: entry("Range of validity", RANGE_POOLS),
    unknown: entry("Find the unknown", UNKNOWN_POOLS),
    approx: entry("Approximation", APPROX_POOLS),
  },
};


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

applyAbout(TOOL_CONFIG, ABOUT);

export const __test = { TOOL_CONFIG, generateQuestion, helpers: { expandWorking, ...fractionHelpers, ...partialHelpers } };

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      generateQuestion={generateQuestion}
      stepVisualRenderer={stepVisual}
      stepVisualKeepsWorking
      stepVisualPlacement="top"
      defaults={{ numQuestions: 6, numColumns: 2, collapseWorkingByDefault: true }}
    />
  );
}
