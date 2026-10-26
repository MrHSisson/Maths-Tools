// Perimeter & Area — what every generator hands back, and how it becomes a question.
import { withExtras, randInt, type AnyQuestion, type DifficultyLevel, type WorkingStep } from "../../../shared";
import { aspectOf } from "../../../shared/shapes/Diagram";
import type { Drawing, Focus } from "../../../shared/shapes/drawing";

/** One working step and what the picture should light while it is showing. */
export interface Beat { step: WorkingStep; focus?: Focus }

export interface Built {
  tool: string;
  level: DifficultyLevel;
  key: string;                      // describes the question (never a random number), so the shell's repeat check works
  drawing: Drawing;
  answer: string;                   // plain text
  answerLatex?: string;
  suffix?: string;                  // "cm" or "cm²", plain text after the answer
  beats: Beat[];
}

export const toQuestion = (b: Built): AnyQuestion =>
  withExtras(
    {
      kind: "simple" as const,
      display: b.drawing.caption.join(" "),
      answer: b.answer,
      ...(b.answerLatex ? { answerLatex: b.answerLatex } : {}),
      ...(b.suffix ? { answerSuffix: b.suffix } : {}),
      working: b.beats.map((x) => x.step),
      key: b.key,
      difficulty: b.level,
    },
    { _diagram: b.drawing, _stepFocus: b.beats.map((x) => x.focus), _aspect: aspectOf(b.drawing), _printAnswer: b.suffix ? `${b.answer} ${b.suffix}` : b.answer },
  ) as unknown as AnyQuestion;

export const CM = "cm", CM2 = "cm²";
export const chance = (p: number): boolean => Math.random() < p;
export const pickOne = <T,>(xs: T[]): T => xs[randInt(0, xs.length - 1)];

/** "a + b + c" as fragments for a line written one mark at a time: ["a", "+ b", "+ c"], then the result. */
export const addFrags = (xs: (number | string)[], result?: number | string): string[] => [
  String(xs[0]), ...xs.slice(1).map((x) => `+ ${x}`), ...(result !== undefined ? [`= ${result}`] : []),
];

/** A length written in a unit, for a label and for the conversion line of the working. */
export interface Shown { text: string; conv?: string }
/** Show `cm` centimetres as plain cm, or (in mixed units) sometimes as mm or m. A metre is only used for whole tens of cm from 50 up. */
export const showLength = (cm: number, mixed: boolean): Shown => {
  if (mixed && chance(0.5)) {
    if (cm >= 50 && cm % 10 === 0) return { text: `${cm / 100} m`, conv: `${cm / 100}\\,\\mathrm{m} = ${cm}\\,\\mathrm{cm}` };
    if (cm < 50) return { text: `${cm * 10} mm`, conv: `${cm * 10}\\,\\mathrm{mm} = ${cm}\\,\\mathrm{cm}` };
  }
  return { text: `${cm} cm` };
};
