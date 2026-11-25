// What a generated Further Mechanics question carries (the `mech` field of a DecisionProblem) and what the canvas is handed at each working step.
// The generators build this from the givens; the working text is written by the same builders that compute the answer, so the two cannot disagree.
import type { DiagramDisplay, Scene } from "./scene";

/** One working step: why (the caption) and the lines it adds, as TeX rows (a row starting "#" is a small plain-text heading; a row starting "=" continues the line above). */
export interface MechStepData { caption: string; lines: string[] }

export interface MechProblemData {
  /** which sub-tool built it (`fd`, `grav`, `angle`, `several`, `variable`) */
  sub: string;
  level: number;
  /** the question as the student reads it (prose, maths between $…$) */
  prompt: string;
  course: "AS" | "A2";
  /** does the question use an idea that is A2 only (cos θ, a slope, a vector)? The Course test asserts this is false at AS. */
  a2: boolean;
  /** the picture, and whether it is given with the question, built up in the working, or absent */
  scene?: Scene;
  display: DiagramDisplay;
  /** the givens as TeX rows, shown under the picture with the question */
  known: string[];
  steps: MechStepData[];
  /** the answer: its numbers (for the checks), its unit and the text as shown */
  answer: { value: number; unit: string; tex: string; text: string };
  /** every part of a multi-part answer after the first, so the validators can check them all */
  extra?: Array<{ value: number; unit: string }>;
  /** the inputs the question was built from (the validators re-derive the answer from these through a different route) */
  inputs: Record<string, number | string | boolean>;
}

/** What the canvas draws at one beat of the working. */
export interface MechViewState {
  stage: "working" | "answer";
  /** how many working steps are showing (the picture builds up with it) */
  shown: number;
  /** all the working rows so far, and how many of the last ones this step added */
  lines: string[];
  fresh: number;
}

/** One value from a multi option's ticks (a comma list), drawn fresh for each question, so a teacher can tick several kinds to mix them or exactly one to restrict to it. */
export function pickOne(ticks: string, fallback: string): string {
  const xs = ticks.split(",").filter(Boolean);
  return xs.length ? xs[Math.floor(Math.random() * xs.length)] : fallback;
}
