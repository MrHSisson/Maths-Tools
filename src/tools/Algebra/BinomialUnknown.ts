import { type DifficultyLevel, type AnyQuestion, type WorkingStep, type ToolMultiSelect, pick, mStep, tStep, pickActive } from "../../shared";
import {
  F, mul, div, absF, coefPre, frTex, frAbsTex, frSmall, frPlain, polyTex, series, powRat, opt, pool, signPool, sizePool, nPick, nonZero, expandWorking, rangeText, type Fr,
} from "../../shared/binomial";

// ═══════════════════════════════════════════════════════════
// Find the unknown — a sub-tool of the Binomial Expansion tool (AQA 7357, Year 2). The power n is known (the specification: (a + bx)ⁿ for any rational n);
// a constant in the bracket is the unknown, found from a coefficient of the expansion, then used to go on. Spec: specs/binomial-expansion.md
//   Level 1 — (1 + ax)ⁿ, a from the coefficient of x (linear)
//   Level 2 — (1 + ax)ⁿ, a from the coefficient of x² (a quadratic: a sign is given, or both values asked)
//   Level 3 — (a + bx)ⁿ, b from a coefficient, or a and b from the first two terms
// ═══════════════════════════════════════════════════════════

const valuesPool = pool("aValues", "When Two Values Fit", [opt("oneVal", "Sign given"), opt("bothVal", "Both values", false)]);
const followPool = pool("followUp", "Then Ask for", [opt("fNone", "Just the unknown"), opt("fCoef", "A coefficient", false), opt("fRange", "Range of validity", false)]);
const unknownPool = pool("unknown", "Unknown", [opt("uB", "b"), opt("uAB", "a and b", false)]);
const givenPool = pool("given", "Given", [opt("gX", "Coefficient of x"), opt("gX2", "Coefficient of x²", false)]);

export const UNKNOWN_POOLS: Record<DifficultyLevel, ToolMultiSelect[]> = {
  level1: [signPool, sizePool("level1"), followPool],
  level2: [signPool, sizePool("level2"), valuesPool, followPool],
  level3: [signPool, sizePool("level3"), unknownPool, givenPool, valuesPool, followPool],
};

/** √ of a rational that is a perfect square over a perfect square, else null */
function sqrtFr(a: Fr): Fr | null {
  const s = (v: number) => { const r = Math.round(Math.sqrt(v)); return r * r === v ? r : null; };
  const n = s(a.n), d = s(a.d);
  return n === null || d === null ? null : F(n, d);
}
const half = (n: Fr): Fr => mul(F(1, 2), mul(n, add1(n, -1)));
const add1 = (n: Fr, k: number): Fr => F(n.n + k * n.d, n.d);
const aPerfect = (n: Fr): number => (n.d === 1 ? pick([2, 3, 4, 5]) : pick([2, 3].map((r) => r ** n.d)));
const xTo = (m: number) => (m === 1 ? "x" : `x^{${m}}`);
const ordinalX = (m: number) => (m === 1 ? "x" : m === 2 ? "x²" : m === 3 ? "x³" : "x⁴");

function unknownQuestion(level: DifficultyLevel, msv: Record<string, boolean>): AnyQuestion {
  const pools = UNKNOWN_POOLS[level];
  const has = (key: string) => pools.some((q) => q.key === key);
  const pk = (key: string) => pickActive(msv, pools.find((q) => q.key === key)!.options);
  const active = (key: string) => pools.find((q) => q.key === key)!.options.filter((o) => msv[o.value]).map((o) => o.value);
  const signs = active("powerSign");
  const n = nPick(active("powerSize").filter((v) => v !== "whole" || signs.includes("negative")), signs, level);
  const follow = pk("followUp");
  const both = has("aValues") && pk("aValues") === "bothVal";
  const unknown = level === "level3" ? pk("unknown") : "uB";
  const given = level === "level1" ? "gX" : level === "level2" ? "gX2" : unknown === "uAB" ? "gX" : pk("given");
  const gm = given === "gX" ? 1 : 2; // the given coefficient is of x^gm

  // the bracket (A + vx)^n: A = 1 at Levels 1 and 2, a perfect power at Level 3; v is the unknown
  const A = level === "level3" ? aPerfect(n) : 1;
  const v = nonZero(level === "level1" ? -5 : -4, level === "level1" ? 5 : 4);
  const mult = A === 1 ? F(1) : (powRat(A, n) as Fr);
  const coeff = (val: number, m: number) => mul(mult, series(n, F(val, A), m)[m]);
  const given_c = coeff(v, gm);
  const letter = level === "level3" ? "b" : "a";
  const bracket = level === "level3" ? `\\left(${unknown === "uAB" ? "a" : A} + bx\\right)^{${frSmall(n)}}` : `\\left(1 + ax\\right)^{${frSmall(n)}}`;
  const sign = v < 0 ? "<" : ">";
  const needsSign = gm === 2 && !both;

  const steps: WorkingStep[] = [];
  const coefTex = frTex(given_c);
  // ── the working that finds the unknown ──
  if (unknown === "uAB") {
    steps.push(mStep("Constant term:", [`a^{${frSmall(n)}} = ${frTex(mult)}`, ` \\Rightarrow a = ${A}`]));
  }
  const aKnown = unknown === "uAB" ? A : A;
  if (level === "level3") {
    steps.push(mStep(`Take out ${aKnown}:`, [`\\left(${aKnown} + bx\\right)^{${frSmall(n)}}`, ` = ${frTex(mult)}\\left(1 + \\dfrac{b}{${aKnown}}x\\right)^{${frSmall(n)}}`]));
  }
  const unit = level === "level3" ? `\\dfrac{b}{${aKnown}}` : "a";
  if (gm === 1) {
    const k1 = mul(mult, mul(n, F(1, A)));      // coefficient of x is (mult · n / A)·v
    steps.push(mStep("Coefficient of x:", level === "level3"
      ? [`${frTex(mult)} \\times ${frTex(n)} \\times ${unit}`, ` = ${coefPre(k1)}${letter}`, ` = ${coefTex}`]
      : [`(${frTex(n)})${letter}`, ` = ${coefTex}`]));
    steps.push(mStep(`Solve for ${letter}:`, [`${letter} = ${coefTex} \\div ${frTex(k1)}`, ` = ${v}`]));
  } else {
    const c2 = mul(mult, mul(half(n), F(1, A * A)));  // coefficient of x² is c2·v²
    steps.push(mStep("Coefficient of x²:", level === "level3"
      ? [`${frTex(mult)} \\times \\dfrac{(${frTex(n)})(${frTex(add1(n, -1))})}{2!} \\times \\left(${unit}\\right)^{2}`, ` = ${coefPre(c2)}${letter}^{2}`, ` = ${coefTex}`]
      : [`\\dfrac{(${frTex(n)})(${frTex(add1(n, -1))})}{2!}${letter}^{2}`, ` = ${coefPre(c2)}${letter}^{2}`, ` = ${coefTex}`]));
    const sq = div(given_c, c2);
    const root = sqrtFr(sq);
    if (!root) throw new Error("binomial unknown: not a perfect square");
    steps.push(mStep(`Solve for ${letter}²:`, [`${letter}^{2} = ${coefTex} \\div ${frTex(c2)}`, ` = ${frTex(sq)}`]));
    steps.push(mStep("Take the square root:", [`${letter} = \\pm ${frAbsTex(root)}`]));
    if (!both) steps.push(mStep(`Given ${letter} ${sign} 0:`, [`${letter} = ${v}`]));
  }
  if (unknown === "uAB") steps.push(mStep("So:", [`a = ${A},\\ b = ${v}`]));

  // ── what comes next ──
  const bn = { a: A, b: F(v), n };
  const nextM = gm + 1;
  const ew = expandWorking(bn, nextM);
  let tail = "";
  if (follow === "fCoef") {
    steps.push(...ew.steps.slice(0, -1));
    const c = ew.answer[nextM];
    if (both) steps.push(tStep("For the negative value, every odd power changes sign."));
    tail = `, coefficient of ${ordinalX(nextM)} = ${both && nextM % 2 === 1 ? "±" : ""}${frPlain(both && nextM % 2 === 1 ? absF(c) : c)}`;
  } else if (follow === "fRange") {
    steps.push(ew.steps[ew.steps.length - 1]);
    tail = `, ${rangeText(ew.bound)}`;
  }

  // ── the question ──
  const exprText = (unknown === "uAB" ? `\\left(a + bx\\right)^{${frSmall(n)}}` : bracket);
  const givenText = unknown === "uAB"
    ? `the first two terms of the expansion of $${exprText}$ in ascending powers of $x$ are $${polyTex([mult, mul(mult, series(n, F(v, A), 1)[1])])}$, where $a > 0$.`
    : `in the expansion of $${exprText}$ in ascending powers of $x$, the coefficient of $${xTo(gm)}$ is $${coefTex}$${needsSign ? `, where $${letter} ${sign} 0$` : ""}.`;
  const find = unknown === "uAB" ? "Find the values of $a$ and $b$." : both ? `Find the possible values of $${letter}$.` : `Find the value of $${letter}$.`;
  const stem = givenText.charAt(0).toUpperCase() + givenText.slice(1);
  const lines = follow === "fNone"
    ? [stem, find]
    : [stem, `(a) ${find}`, follow === "fCoef" ? `(b) Hence find the coefficient of $${xTo(nextM)}$ in the expansion.` : "(b) Hence state the range of values of $x$ for which the expansion is valid."];

  const foundTex = unknown === "uAB" ? `a = ${A},\\ b = ${v}` : both ? `${letter} = \\pm ${Math.abs(v)}` : `${letter} = ${v}`;
  const foundPlain = (unknown === "uAB" ? `a = ${A}, b = ${v}` : both ? `${letter} = ±${Math.abs(v)}` : `${letter} = ${v}`).replace("-", "−");
  return {
    kind: "worded", lines,
    answer: foundPlain, answerLatex: foundTex, answerSuffix: tail || undefined,
    working: steps,
    key: `be-unknown-${level}-${unknown}-${given}-${frPlain(n)}-${A}-${v}-${follow}-${both ? "b" : "o"}`,
    difficulty: level,
    _raw: { n, A, v, gm, given_c, mult, both },
  } as unknown as AnyQuestion;
}

export const generateUnknown = unknownQuestion;
