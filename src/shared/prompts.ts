// Prompt hoisting — a worksheet whose questions all open with the same prompt line ("Simplify:") says it once, above the sheet,
// instead of repeating it in every cell. A question has a prompt when it is a worded question whose leading line(s) hold no
// maths and whose last line is only maths: `lines: ["Simplify:", "$x^3 \\times x^2$"]`.
import type { AnyQuestion } from "./types";

const PURE_MATHS = /^\$[^$]+\$$/;

/** The prompt line of a "prompt + maths" question, or null when the question is any other shape. */
export const promptOf = (q: AnyQuestion): string | null => {
  if (q.kind !== "worded") return null;
  const lines = q.lines;
  if (lines.length !== 2 || lines[0].includes("$") || !PURE_MATHS.test(lines[1].trim())) return null;
  return lines[0];
};

/** The one prompt every question shares (needs at least two questions), else null. */
export const commonPrompt = (qs: AnyQuestion[]): string | null => {
  if (qs.length < 2) return null;
  const first = promptOf(qs[0]);
  return first !== null && qs.every(q => promptOf(q) === first) ? first : null;
};

/** The question without its prompt line (the maths line alone). */
export const withoutPrompt = (q: AnyQuestion): AnyQuestion =>
  promptOf(q) === null ? q : ({ ...q, lines: (q as { lines: string[] }).lines.slice(1) } as AnyQuestion);
