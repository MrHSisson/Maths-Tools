// Polynomial long division — a working-step representation, laid out as on paper:
// divisor to the left of a bracket, quotient above the bar, then each "multiply back, subtract,
// bring down" pair as rows with the terms kept in power columns.
//
//   ldStep("Polynomial division reveals the other factor:", [2, -9, 7, 6], 2, -1)   // ÷ (2x + 1)
//
// Renders via `LongDivision` (src/shared/components/LongDivision.tsx) through `longDivisionStepRenderer`,
// which a tool passes (or composes into) its `stepRenderer`. The step's `latex` is the identity
// f(x) = (divisor)(quotient) so show-all, print and tests still have a normal line.
// `param`: coefficient i carries a^i (homogeneous in x and a), as in the Factor Theorem tool.

import type { WorkingStep } from "./types";
import { stripSkillMarkers } from "./helpers";

export interface LongDivisionData {
  /** Divisor as KaTeX, e.g. `2x+1`. */
  divisor: string;
  /** Number of power columns (dividend degree + 1). */
  cols: number;
  /** Quotient terms in columns 1.. (column 0 is empty), signed KaTeX or "". */
  quotient: string[];
  dividend: string[];
  /** One entry per quotient term: the product row (underlined) and the remainder row beneath it. */
  steps: { product: string[]; remainder: string[] }[];
}

const termL = (val: number, xp: number, ap: number, first: boolean): string => {
  if (val === 0) return "";
  const m = (ap > 0 ? (ap > 1 ? `a^{${ap}}` : "a") : "") + (xp > 0 ? (xp > 1 ? `x^{${xp}}` : "x") : "");
  const A = Math.abs(val);
  const body = m === "" ? `${A}` : A === 1 ? m : `${A}${m}`;
  return (val < 0 ? "-" : first ? "" : "+") + body;
};

/** Cells for a row of coefficients, where `coef[i]` sits in column `col0 + i` and has x-power (n − col). */
const rowCells = (coef: number[], col0: number, cols: number, param: boolean, aOffset = 0): string[] => {
  const n = cols - 1;
  const out = new Array(cols).fill("");
  let first = true;
  coef.forEach((v, i) => {
    const col = col0 + i;
    const s = termL(v, n - col, param ? col - aOffset : 0, first);
    if (s) first = false;
    out[col] = s;
  });
  return out;
};

export const longDivisionData = (dividend: number[], p: number, q: number, divisor: string, param = false): LongDivisionData => {
  const cols = dividend.length;
  const quotientCoef: number[] = [];
  const steps: LongDivisionData["steps"] = [];
  let cur = [...dividend];
  let col = 0;
  while (cur.length > 1) {
    const t = cur[0] / p;
    if (!Number.isInteger(t)) throw new Error("long division: not exact");
    quotientCoef.push(t);
    const prod = [t * p, -t * q];
    const next = cur.slice(0, 2).map((v, i) => v - prod[i]);
    const rest = [next[1], ...cur.slice(2)];
    steps.push({
      product: rowCells(prod, col, cols, param),
      remainder: rowCells(rest, col + 1, cols, param),
    });
    cur = rest;
    col++;
  }
  if (cur[0] !== 0) throw new Error("long division: non-zero remainder");
  // remainder rows print a lone "0" at the end (the last one)
  const last = steps[steps.length - 1];
  last.remainder = new Array(cols).fill("");
  last.remainder[cols - 1] = "0";
  return {
    divisor,
    cols,
    quotient: rowCells(quotientCoef, 1, cols, param, 1),
    dividend: rowCells(dividend, 0, cols, param),
    steps,
  };
};

export const ldStep = (label: string, dividend: number[], p: number, q: number, divisor: string, identity: string, param = false): WorkingStep => ({
  type: "longDivision",
  latex: identity,
  plain: stripSkillMarkers(label),
  label,
  extra: longDivisionData(dividend, p, q, divisor, param),
});
