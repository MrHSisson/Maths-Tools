import { randInt, pickActive, mStep, type AnyQuestion, type DifficultyLevel, type ToolMultiSelect, type WorkingStep } from "../../shared";
import { decStr, exactCoef, ordinary, standardise } from "./StandardFormCore";

// Standard Form: adding and subtracting.
// L1 the same power; L2 powers one apart, so one term has to be matched; L3 powers two or more apart.
// "Result" (already standard / needs adjusting) is offered at L1 and L2 only: from a gap of 2 the larger-power method can never need adjusting.
// Coefficients are held as tenths (t = 32 is 3.2), so every sum and difference is exact.

export const AS_OPS_MS: ToolMultiSelect = {
  key: "asOps", label: "Operations", tab: "questions",
  options: [
    { value: "add", label: "Add", defaultActive: true },
    { value: "subtract", label: "Subtract", defaultActive: true },
  ],
};
export const AS_RESULT_MS: ToolMultiSelect = {
  key: "asResult", label: "Result", tab: "numbers",
  options: [
    { value: "std", label: "Already Standard", defaultActive: true },
    { value: "adjust", label: "Needs Adjusting", defaultActive: true },
  ],
};
export const AS_POWERS_MS: ToolMultiSelect = {
  key: "asPowers", label: "Powers", tab: "numbers",
  options: [
    { value: "posP", label: "Positive", defaultActive: true },
    { value: "negP", label: "Negative", defaultActive: false },
  ],
};
export const AS_MATCH_MS: ToolMultiSelect = {
  key: "asMatch", label: "Method", tab: "method",
  options: [
    { value: "toLarger", label: "Match to Larger", defaultActive: true },
    { value: "toSmaller", label: "Match to Smaller", defaultActive: false },
  ],
};

const drawT = (): number => { let t = randInt(11, 99); while (t % 10 === 0) t = randInt(11, 99); return t; };

/** The larger power P and the gap d below it: the lower power is P − d. */
const drawPowers = (level: DifficultyLevel, negative: boolean): { P: number; d: number } => {
  const d = level === "level1" ? 0 : level === "level2" ? 1 : randInt(2, 4);
  // both powers stay at least 2 away from zero, so neither term is ever a plain-looking × 10¹
  if (negative) return { P: randInt(-9 + d, -2), d };
  return { P: randInt(2 + d, 9), d };
};

interface Term { t: number; n: number; }

export const genAddSub = (level: DifficultyLevel, msv: Record<string, boolean>): AnyQuestion => {
  for (let attempt = 0; attempt < 30000; attempt++) {
    // after many misses the "already standard / needs adjusting" wish is dropped, so an option set that cannot be met still makes a question
    const relaxed = attempt > 20000;
    const subtract = pickActive(msv, AS_OPS_MS.options) === "subtract";
    // from level 3 the result follows from the method alone (matching to the larger power never needs adjusting, to the smaller always does)
    const wantAdjust = level === "level3" ? null : pickActive(msv, AS_RESULT_MS.options) === "adjust";
    const negative = pickActive(msv, AS_POWERS_MS.options) === "negP";
    const toSmaller = level !== "level1" && pickActive(msv, AS_MATCH_MS.options) === "toSmaller";
    const { P, d } = drawPowers(level, negative);
    const Q = P - d;
    // two terms: one at the larger power, one at the smaller; the one written first is chosen at random
    let t1: Term = { t: drawT(), n: P }, t2: Term = { t: drawT(), n: Q };
    if (d > 0 && Math.random() < 0.5) [t1, t2] = [t2, t1];
    // in units of 10^(Q−1) each term is a whole number
    const units = (x: Term): number => x.t * 10 ** (x.n - Q);
    let X: number;
    if (subtract) {
      if (units(t1) < units(t2)) [t1, t2] = [t2, t1];
      X = units(t1) - units(t2);
      if (X <= 0) continue;
    } else X = units(t1) + units(t2);

    const { cN, cD, k } = standardise(X, 1);
    const e = k + Q - 1;
    const target = toSmaller ? Q : P;               // the power both terms are written with
    const adjusts = e !== target;
    if (!relaxed && wantAdjust !== null && adjusts !== wantAdjust) continue;
    const coef = exactCoef(cN, cD, 8);
    if (coef === null) continue;

    const sym = subtract ? "-" : "+";
    const A = decStr(t1.t, 1), B = decStr(t2.t, 1);
    const working: WorkingStep[] = [];
    let a = A, b = B;                                // the two coefficients once the powers match
    if (d > 0) {
      // write the term whose power is not the target with the target power
      const low = t1.n === target ? t2 : t1;        // the term that changes
      const shift = low.n - target;                  // its coefficient is multiplied by 10^shift
      const changed = ordinary(String(low.t), shift);
      working.push(mStep(
        `Match the powers of 10. Write the ${decStr(low.t, 1)} × 10^${low.n} term with the power ${target}:`,
        [`${decStr(low.t, 1)} \\times 10^{${low.n}}`, `= ${changed} \\times 10^{${target}}`],
      ));
      if (low === t1) a = changed; else b = changed;
    }
    const sumStr = decStr(X, target === P ? d + 1 : 1);
    working.push(mStep(
      d > 0 ? `Now the powers match, so ${subtract ? "subtract" : "add"} the coefficients:` : `The powers of 10 are the same, so ${subtract ? "subtract" : "add"} the coefficients:`,
      [`${a} ${sym} ${b}`, `= ${sumStr}`],
    ));
    if (adjusts) {
      const n = Math.abs(e - target), places = n === 1 ? "1 place" : `${n} places`;
      working.push(mStep(
        `The coefficient must be between 1 and 10. Move the decimal point ${places} to the ${e > target ? "left, so add" : "right, so take"} ${n} ${e > target ? "to" : "off"} the power:`,
        `${sumStr} \\times 10^{${target}} = ${coef} \\times 10^{${e}}`,
      ));
    }
    working.push(mStep("Answer:", `${coef} \\times 10^{${e}}`));

    return {
      kind: "worded",
      lines: ["Give your answer in standard form:", `$(${A} \\times 10^{${t1.n}}) ${sym} (${B} \\times 10^{${t2.n}})$`],
      answer: `${coef} × 10^${e}`,
      answerLatex: `${coef} \\times 10^{${e}}`,
      working,
      key: `sf-addsub-${subtract ? "sub" : "add"}-${A}e${t1.n}-${B}e${t2.n}`,
      difficulty: level,
    } as unknown as AnyQuestion;
  }
  throw new Error("Standard Form: no add/subtract question fits these options");
};
