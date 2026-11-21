// The two glue functions every Further Mechanics tool on DecisionShell shares: a built question becomes a DecisionProblem, and its steps become the shell's beats.
import type { MechProblemData } from "../mechanics/problem";
import type { DecisionProblem, SolveStep } from "./types";

/** the DecisionProblem the shell carries for a built mechanics question */
export const mechProblem = (m: MechProblemData, kind: string): DecisionProblem =>
  ({ kind, level: m.level, mech: m, prompt: m.prompt, answer: { text: m.answer.text }, matrixMode: "off" }) as unknown as DecisionProblem;

/** the working as beats: each step adds its lines under the ones before, the picture builds with the step, and a last beat shows the answer */
export function solveMech(p: DecisionProblem): SolveStep[] {
  const m = p.mech!;
  const lines: string[] = [];
  const out: SolveStep[] = m.steps.map((s, k) => {
    lines.push(...s.lines);
    return { caption: s.caption, edgeStates: {}, mechView: { stage: "working", shown: k + 1, lines: [...lines], fresh: s.lines.length } };
  });
  lines.push("", `\\textbf{Answer:}\\ ${m.answer.tex}`);
  out.push({ caption: "The answer", edgeStates: {}, mechView: { stage: "answer", shown: m.steps.length + 1, lines: [...lines], fresh: 2 } });
  return out;
}
