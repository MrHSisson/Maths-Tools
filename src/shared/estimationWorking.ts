import { mStep } from "./helpers";
import { texNumber } from "./math";
import type { WorkingStep } from "./types";

export const roundEstimationOperand = (num: number): number => {
  if (num === 0) return 0;
  const magnitude = Math.floor(Math.log10(Math.abs(num)));
  const factor = Math.pow(10, magnitude);
  return Number((Math.round(num / factor) * factor).toFixed(Math.max(0, -magnitude + 1)));
};

/** Canonical reveal boundaries for the generator and fixed Estimation examples. */
export function estimationWorking(original: string, rounding: string, calculation: WorkingStep[]): WorkingStep[] {
  return [mStep("Original:", original), mStep("Round to 1 s.f.:", rounding), ...calculation];
}

/** The fixed pilot uses two-operand expressions, optionally over a numeric denominator. This builds working
 *  from the actual operands, using the same method and step assembly as the generator, not hand-written steps. */
export function authoredEstimationWorking(latex: string): WorkingStep[] {
  const fraction = latex.match(/^\\dfrac\{(.+)\}\{([\d.]+)\}$/);
  const expression = (fraction?.[1] ?? latex).match(/^([\d.]+)\s*(\\times|\\div|\+|-)\s*([\d.]+)$/);
  if (!expression) throw new Error(`Unsupported fixed Estimation expression: ${latex}`);
  const a = Number(expression[1]), b = Number(expression[3]), op = expression[2];
  const ra = roundEstimationOperand(a), rb = roundEstimationOperand(b);
  const calculate = op === "+" ? ra + rb : op === "-" ? ra - rb : op === "\\times" ? ra * rb : ra / rb;
  const value = Number(calculate.toPrecision(12));
  const rounded = `${texNumber(ra)} ${op} ${texNumber(rb)}`;
  const rounding = `${texNumber(a)} \\to ${texNumber(ra)}, \\quad ${texNumber(b)} \\to ${texNumber(rb)}`;
  if (!fraction) return estimationWorking(latex, rounding, [mStep("Calculate:", `${rounded} = ${texNumber(value)}`)]);
  const denominator = Number(fraction[2]), rd = roundEstimationOperand(denominator);
  return estimationWorking(`\\dfrac{(${fraction[1]})}{${fraction[2]}}`, `${a} \\to ${ra}, \\;${b} \\to ${rb}, \\;${denominator} \\to ${rd}`, [mStep("Numerator:", `(${rounded}) = ${value}`), mStep("Calculate:", `${value} \\div ${rd} = ${Number((value / rd).toPrecision(12))}`)]);
}
