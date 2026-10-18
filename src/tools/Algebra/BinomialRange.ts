import { type DifficultyLevel, type AnyQuestion, type WorkingStep, type ToolMultiSelect, pick, mStep, pickActive } from "../../shared";
import {
  F, eq, lt, toNum, frPlain, modLt, condTex, withExtra, opt, pool, ascTex, descTex, powerWritten, signPool, sizePool, nPick, nonZero, type Fr,
} from "../../shared/binomial";

// ═══════════════════════════════════════════════════════════
// Range of validity — a sub-tool of the Binomial Expansion tool (AQA 7357, Year 2). Only the range is asked: each bracket raised to a power that is not a positive whole
// number needs |kx| < 1, and x must satisfy every one of them, so the range is the smallest bound. Spec: specs/binomial-expansion.md
//   Level 1 — one bracket (a + bx)ⁿ
//   Level 2 — a product of two brackets with different bounds: the ranges must be overlapped
//   Level 3 — the partial-fractions situation: three different brackets below, or one repeated
// ═══════════════════════════════════════════════════════════

const formPool = pool("rangeForm", "Brackets below", [opt("three", "Three different*"), opt("repeated", "One repeated")]);
export const RANGE_POOLS: Record<DifficultyLevel, ToolMultiSelect[]> = {
  level1: [signPool, sizePool("level1")],
  level2: [signPool, sizePool("level2")],
  level3: [formPool],
};
export const RANGE_LEVELS = ["One bracket (a + bx)ⁿ", "Two brackets: overlap the ranges", "Partial-fractions denominators: three brackets, or one repeated"];

/** (c + dx)^n, n not a positive whole number */
interface Br { c: number; d: number; n: Fr }
const bound = (b: Br): Fr => F(Math.abs(b.c), Math.abs(b.d));
const brTex = (b: Br) => (b.c === 1 ? ascTex(1, F(b.d)) : descTex(b.c, F(b.d)));

function bracket(): { c: number; d: number } {
  return { c: pick([1, 2, 3, 4, 5]), d: nonZero(-5, 5) };
}
const distinctBounds = (bs: Br[]) => bs.every((x, i) => bs.every((y, j) => i === j || !eq(bound(x), bound(y))));

function make(level: DifficultyLevel, sizes: string[], signs: string[], form: string): { expr: string; brs: Br[] } {
  const power = () => nPick(sizes, signs, level);
  for (let guard = 0; guard < 2000; guard++) {
    if (level === "level1") {
      const b = bracket();
      const br = { ...b, n: power() };
      return { brs: [br], expr: powerWritten(brTex(br), br.n, false) };
    }
    if (level === "level2") {
      const brs = [0, 1].map(() => ({ ...bracket(), n: power() }));
      if (!distinctBounds(brs)) continue;
      return { brs, expr: brs.map((b) => powerWritten(brTex(b), b.n, false)).join("") };
    }
    // Level 3: the denominator as in the partial-fractions tab, any numerator
    const k = form === "repeated" ? 2 : 3;
    const raw = Array.from({ length: k }, () => bracket());
    const brs: Br[] = raw.map((b) => ({ ...b, n: F(-1) }));
    if (!distinctBounds(brs)) continue;
    const numer = pick([`${pick([1, 2, 3, 4, 5])}`, descTex(nonZero(-5, 5), F(nonZero(-5, 5)))]);
    const den = form === "repeated"
      ? `\\left(${brTex(brs[0])}\\right)\\left(${brTex(brs[1])}\\right)^{2}`
      : brs.map((b) => `\\left(${brTex(b)}\\right)`).join("");
    return { brs, expr: `\\dfrac{${numer}}{${den}}` };
  }
  throw new Error("binomial range: no question found");
}

export function rangeQuestion(level: DifficultyLevel, msv: Record<string, boolean>): AnyQuestion {
  const pools = RANGE_POOLS[level];
  const active = (key: string) => pools.find((q) => q.key === key)!.options.filter((o) => msv[o.value]).map((o) => o.value);
  const signs = level === "level3" ? [] : active("powerSign");
  const sizes = level === "level3" ? [] : active("powerSize").filter((v) => v !== "whole" || signs.includes("negative"));
  const form = level === "level3" ? pickActive(msv, formPool.options) : "";
  const { brs, expr } = make(level, sizes, signs, form);
  const bounds = brs.map(bound);
  const smallest = bounds.reduce((mn, b) => (lt(b, mn) ? b : mn), bounds[0]);
  const rows = bounds.map((b) => ({ label: modLt(b), c: toNum(b), plain: frPlain(b) }));
  const steps: WorkingStep[] = [];
  const kOf = (b: Br) => F(b.d, b.c);
  steps.push(withExtra(mStep(brs.length > 1 ? "Each bracket needs |kx| < 1:" : "Valid for |u| < 1:", brs.map((b, i) => `${i ? ",\\ " : ""}${condTex(kOf(b), bounds[i])}`)), { kind: "binInterval", rows }));
  if (brs.length > 1) steps.push(withExtra(mStep("All must hold, so take the smaller:", [modLt(smallest)]), { kind: "binInterval", rows, overlap: true }));
  const id = Math.floor(Math.random() * 1_000_000);
  return {
    kind: "worded",
    lines: [`$f(x) = ${expr}$`, "State the range of values of $x$ for which the binomial expansion of $f(x)$ is valid."],
    answer: `|x| < ${frPlain(smallest)}`,
    answerLatex: modLt(smallest),
    answerSuffix: ` (−${frPlain(smallest)} < x < ${frPlain(smallest)})`,
    working: steps,
    key: `be-range-${level}-${brs.map((b) => `${b.c}_${b.d}_${frPlain(b.n)}`).join("-")}-${id}`,
    difficulty: level,
    _raw: { brs, smallest },
  } as unknown as AnyQuestion;
}

export const generateRange = rangeQuestion;
