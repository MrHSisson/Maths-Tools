import { randInt, pickActive, mStep, type AnyQuestion, type DifficultyLevel, type ToolMultiSelect, type WorkingStep } from "../../shared";
import { decStr, exactCoef, round3sf, standardise } from "./StandardFormCore";

// Standard Form: multiplying and dividing.
// L1 positive powers and the answer is already in standard form; L2 positive powers and the coefficient has to be adjusted;
// L3 a negative power appears, and the coefficient still has to be adjusted.
// Coefficients are held as integers over a scale (m / 10^sc), so every product and quotient is exact.

export const MD_OPS_MS: ToolMultiSelect = {
  key: "mdOps", label: "Operations", tab: "questions",
  options: [
    { value: "multiply", label: "Multiply", defaultActive: true },
    { value: "divide", label: "Divide", defaultActive: true },
  ],
};
export const MD_COEF_MS: ToolMultiSelect = {
  key: "mdCoef", label: "Coefficients", tab: "numbers",
  options: [
    { value: "cInt", label: "Whole Numbers", defaultActive: true },
    { value: "cDec", label: "1 Decimal Place", defaultActive: true },
    { value: "cCalc", label: "Calculator (3 s.f.)", defaultActive: false },
  ],
};

interface Coef { m: number; sc: number; }

const drawCoef = (mode: string): Coef => {
  if (mode === "cInt") return { m: randInt(2, 9), sc: 0 };
  if (mode === "cDec") { let m = randInt(11, 99); while (m % 10 === 0) m = randInt(11, 99); return { m, sc: 1 }; }
  let m = randInt(101, 999); while (m % 10 === 0) m = randInt(101, 999);
  return { m, sc: 2 };
};

const nonZero = (lo: number, hi: number): number => { let v = randInt(lo, hi); while (v === 0) v = randInt(lo, hi); return v; };

/** The two powers for a level: L1 and L2 positive (a division leaves a positive power), L3 with at least one negative. */
const drawPowers = (level: DifficultyLevel, divide: boolean): [number, number] => {
  if (level === "level3") {
    for (;;) {
      const p = nonZero(-9, 9), q = nonZero(-9, 9);
      if (p < 0 || q < 0) return [p, q];
    }
  }
  if (!divide) return [randInt(2, 9), randInt(2, 9)];
  const q = randInt(2, 6);
  return [randInt(q + 2, 9), q];
};

const approx = (N: number, D: number, dp: number): string => decStr(Math.floor((2 * N * 10 ** dp + D) / (2 * D)), dp);

export const genMulDiv = (level: DifficultyLevel, msv: Record<string, boolean>): AnyQuestion => {
  for (let attempt = 0; attempt < 5000; attempt++) {
    const divide = pickActive(msv, MD_OPS_MS.options) === "divide";
    const mode = pickActive(msv, MD_COEF_MS.options);
    const a = drawCoef(mode), b = drawCoef(mode);
    const [p, q] = drawPowers(level, divide);
    // the value of the coefficients: a × b or a ÷ b, as the ratio N / D
    const N = divide ? a.m * 10 ** b.sc : a.m * b.m;
    const D = divide ? 10 ** a.sc * b.m : 10 ** (a.sc + b.sc);
    if (divide && a.m * 10 ** b.sc === b.m * 10 ** a.sc) continue;      // equal coefficients: the quotient is just 1
    const { cN, cD, k } = standardise(N, D);
    if (level === "level1" ? k !== 0 : k === 0) continue;
    const e = (divide ? p - q : p + q) + k;
    if (e === 0 || (level !== "level3" && e < 1)) continue;
    const calc = mode === "cCalc";
    const final = calc ? round3sf(cN, cD) : exactCoef(cN, cD, 2);
    if (final === null) continue;

    const A = decStr(a.m, a.sc), B = decStr(b.m, b.sc);
    const pq = divide ? p - q : p + q;
    const raw = divide ? exactCoef(N, D, 6) : decStr(N, a.sc + b.sc);          // the coefficients combined, before adjusting
    const rawStr = raw ?? approx(N, D, 4);
    const rel = raw === null ? "\\approx" : "=";
    const adjusted = exactCoef(cN, cD, 6) ?? approx(cN, cD, 5);
    const adjRel = exactCoef(cN, cD, 6) === null ? "\\approx" : "=";
    const sym = divide ? "\\div" : "\\times";

    const working: WorkingStep[] = [
      mStep(divide ? "Divide the coefficients:" : "Multiply the coefficients:", `${A} ${sym} ${B} ${rel} ${rawStr}`),
      mStep(divide ? "Subtract the powers of 10:" : "Add the powers of 10:", divide ? `10^{${p}} \\div 10^{${q}} = 10^{${pq}}` : `10^{${p}} \\times 10^{${q}} = 10^{${pq}}`),
      mStep("Put them together:", `${rawStr} \\times 10^{${pq}}`),
    ];
    if (k !== 0) {
      working.push(mStep(
        k > 0 ? "The coefficient must be between 1 and 10. Divide it by 10 and add 1 to the power:" : "The coefficient must be between 1 and 10. Multiply it by 10 and take 1 off the power:",
        `${rawStr} \\times 10^{${pq}} ${adjRel} ${adjusted} \\times 10^{${e}}`,
      ));
    }
    if (calc) working.push(mStep("Round the coefficient to 3 significant figures:", `${adjusted} \\times 10^{${e}} \\approx ${final} \\times 10^{${e}}`));
    working.push(mStep("Answer:", `${final} \\times 10^{${e}}`));

    return {
      kind: "worded",
      lines: [
        calc ? "Give your answer in standard form, with the coefficient to 3 significant figures:" : "Give your answer in standard form:",
        `$(${A} \\times 10^{${p}}) ${sym} (${B} \\times 10^{${q}})$`,
      ],
      answer: `${final} × 10^${e}`,
      answerLatex: `${final} \\times 10^{${e}}`,
      working,
      key: `sf-muldiv-${divide ? "div" : "mul"}-${A}e${p}-${B}e${q}`,
      difficulty: level,
    } as unknown as AnyQuestion;
  }
  throw new Error("Standard Form: no multiply/divide question fits these options");
};
