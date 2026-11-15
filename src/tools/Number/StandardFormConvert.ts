import { randInt, pickActive, mStep, type AnyQuestion, type DifficultyLevel, type ToolMultiSelect } from "../../shared";
import { ordinary, texOrdinary } from "./StandardFormCore";

// Standard Form: converting between ordinary numbers and standard form.
// L1 large numbers (positive powers); L2 small numbers (negative powers), each either way round.
// L3 "half-way" numbers: a coefficient that is too big (304 × 10⁵) or too small (0.003 × 10⁻²) to be standard form, to be rewritten.

export const CONV_ASK_MS: ToolMultiSelect = {
  key: "convAsk", label: "Ask for", tab: "questions",
  options: [
    { value: "toStd", label: "To Standard Form", defaultActive: true },
    { value: "toOrd", label: "To Ordinary Number", defaultActive: true },
  ],
};
export const CONV_DIGITS_MS: ToolMultiSelect = {
  key: "convDigits", label: "Coefficient Digits", tab: "numbers",
  options: [
    { value: "d1", label: "1 Digit", defaultActive: true },
    { value: "d2", label: "2 Digits", defaultActive: true },
    { value: "d3", label: "3 Digits", defaultActive: false },
  ],
};
export const CONV_ZEROS_MS: ToolMultiSelect = {
  key: "convZeros", label: "Internal Zeros", tab: "numbers",
  options: [
    { value: "noZero", label: "Without", defaultActive: true },
    // an internal zero needs a middle digit to sit in: 3 digits (5.01)
    { value: "withZero", label: "With", defaultActive: false, requires: [["d3"]] },
  ],
};

// Level 3: the number is in parts, with a coefficient outside 1 to 10
export const CONV_COEF_MS: ToolMultiSelect = {
  key: "convCoef", label: "Coefficients", tab: "numbers",
  options: [
    { value: "tooBig", label: "Too Big", defaultActive: true },
    { value: "tooSmall", label: "Too Small", defaultActive: true },
  ],
};
export const CONV_START_MS: ToolMultiSelect = {
  key: "convStart", label: "Starting Power", tab: "numbers",
  options: [
    { value: "startPos", label: "Positive", defaultActive: true },
    { value: "startNeg", label: "Negative", defaultActive: true },
  ],
};

/** Coefficient digits: first digit non-zero; the last non-zero (so no trailing zero); a middle digit that is 0 only when asked. */
const drawDigits = (len: number, zero: boolean): string => {
  if (zero) return `${randInt(1, 9)}0${randInt(1, 9)}`;
  if (len === 1) return String(randInt(1, 9));
  if (len === 2) return `${randInt(1, 9)}${randInt(1, 9)}`;
  return `${randInt(1, 9)}${randInt(1, 9)}${randInt(1, 9)}`;
};

const drawPower = (level: DifficultyLevel): number => (level === "level1" ? randInt(3, 8) : -randInt(3, 8));

/** Level 3: a coefficient that is not between 1 and 10, written with a power, to be put into standard form. */
const genHalfway = (msv: Record<string, boolean>): AnyQuestion => {
  for (;;) {
    const tooBig = pickActive(msv, CONV_COEF_MS.options) === "tooBig";
    const n = (pickActive(msv, CONV_START_MS.options) === "startPos" ? 1 : -1) * randInt(2, 8);
    let digits: string, shown: string, places: number;
    if (tooBig) {
      // 45, 304: two or three digits, the first and last not zero, so a whole number of 11 to 999 with no trailing zero
      const len = randInt(2, 3);
      digits = len === 2 ? `${randInt(1, 9)}${randInt(1, 9)}` : `${randInt(1, 9)}${randInt(0, 9)}${randInt(1, 9)}`;
      places = len - 1;                                     // the point moves this far left
      shown = ordinary(digits, places);
    } else {
      // 0.45, 0.02, 0.003: one or two digits after none, one or two zeros
      const zeros = randInt(0, 2);
      digits = Math.random() < 0.5 ? String(randInt(1, 9)) : `${randInt(1, 9)}${randInt(1, 9)}`;
      places = zeros + 1;                                   // the point moves this far right
      shown = ordinary(digits, -places);
    }
    const e = tooBig ? n + places : n - places;
    if (e === 0) continue;                                  // 10⁰ would hide the idea
    const coef = ordinary(digits, 0);
    const times = String(10 ** places);
    const working = [
      mStep(`The coefficient must be between 1 and 10. Move the decimal point ${places === 1 ? "1 place" : `${places} places`} to the ${tooBig ? "left" : "right"}:`, [shown, `\\rightarrow ${coef}`]),
      mStep(tooBig ? `That made the coefficient ${times} times smaller, so the power goes up by ${places}:` : `That made the coefficient ${times} times bigger, so the power goes down by ${places}:`, `${n} ${tooBig ? "+" : "-"} ${places} = ${e}`),
      mStep("Answer:", `${coef} \\times 10^{${e}}`),
    ];
    return {
      kind: "worded",
      lines: ["Write in standard form:", `$${shown} \\times 10^{${n}}$`],
      answer: `${coef} × 10^${e}`,
      answerLatex: `${coef} \\times 10^{${e}}`,
      working,
      key: `sf-conv-half-${shown}e${n}`,
      difficulty: "level3",
    } as unknown as AnyQuestion;
  }
};

export const genConvert = (level: DifficultyLevel, msv: Record<string, boolean>): AnyQuestion => {
  if (level === "level3") return genHalfway(msv);
  const toStd = pickActive(msv, CONV_ASK_MS.options) === "toStd";
  // "With" only counts while 3 digits are on (the option is greyed out otherwise); if it is picked the coefficient has 3 digits
  const zero = pickActive(msv, CONV_ZEROS_MS.options) === "withZero" && msv["d3"] === true;
  const len = zero ? 3 : parseInt(pickActive(msv, CONV_DIGITS_MS.options).slice(1), 10);
  const digits = drawDigits(len, zero);
  const n = drawPower(level);
  const ord = ordinary(digits, n);
  const coef = ordinary(digits, 0);
  const std = `${coef} \\times 10^{${n}}`;
  const plural = `${Math.abs(n)} places`, big = n > 0;

  const working = toStd
    ? [
        mStep(`Put the decimal point after the first non-zero digit. It moves ${plural} to the ${big ? "left" : "right"}:`, [texOrdinary(ord), `\\rightarrow ${coef}`]),
        mStep(big ? "The number is bigger than 1, so the power is positive:" : "The number is smaller than 1, so the power is negative:", `10^{${n}}`),
        mStep("Answer:", std),
      ]
    : [
        mStep(`The power is ${n}, so move the decimal point ${plural} to the ${big ? "right" : "left"}, filling any gaps with zeros:`, [coef, `\\rightarrow ${texOrdinary(ord)}`]),
        mStep("Answer:", texOrdinary(ord)),
      ];

  return {
    kind: "worded",
    lines: toStd ? ["Write in standard form:", `$${texOrdinary(ord)}$`] : ["Write as an ordinary number:", `$${std}$`],
    answer: toStd ? `${coef} × 10^${n}` : ord,
    answerLatex: toStd ? std : texOrdinary(ord),
    working,
    key: `sf-conv-${toStd ? "std" : "ord"}-${digits}e${n}`,
    difficulty: level,
  } as unknown as AnyQuestion;
};
