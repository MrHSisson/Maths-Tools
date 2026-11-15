import { randInt, pickActive, mStep, type AnyQuestion, type DifficultyLevel, type ToolMultiSelect } from "../../shared";
import { ordinary, texOrdinary } from "./StandardFormCore";

// Standard Form: converting between ordinary numbers and standard form.
// L1 large numbers (positive powers); L2 small numbers (negative powers); L3 either, so the student decides the sign.

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

/** Coefficient digits: first digit non-zero; the last non-zero (so no trailing zero); a middle digit that is 0 only when asked. */
const drawDigits = (len: number, zero: boolean): string => {
  if (zero) return `${randInt(1, 9)}0${randInt(1, 9)}`;
  if (len === 1) return String(randInt(1, 9));
  if (len === 2) return `${randInt(1, 9)}${randInt(1, 9)}`;
  return `${randInt(1, 9)}${randInt(1, 9)}${randInt(1, 9)}`;
};

const drawPower = (level: DifficultyLevel): number => {
  const mag = randInt(3, 8);
  if (level === "level1") return mag;
  if (level === "level2") return -mag;
  return Math.random() < 0.5 ? mag : -mag;
};

export const genConvert = (level: DifficultyLevel, msv: Record<string, boolean>): AnyQuestion => {
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
