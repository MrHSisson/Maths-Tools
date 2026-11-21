import { DecisionShell, type DecisionProblem, type GenerateContext, type SolveStep } from "../../shared/decision";
import type { ShellOption } from "../../shared/decision/types";
import LpCanvas, { LpSolution } from "../../shared/decision/LpWorking";
import { generateConstraint } from "../../shared/decision/lpGen";
import { solveLp } from "../../shared/decision/lpSolve";

// ═════════════════════════════════════════════════════════════════════════════════════════════
// Formulating Linear Programmes — Decision Maths DD1 (AQA 7367), built on DecisionShell with the written working (the page a student would write, building a line
// at a time) as its picture. Brief: specs/linear-programming-formulate.md. One sub-tool so far:
//   Write a constraint — one constraint from a short situation, in whole numbers and lowest terms (Level 1: resource use and direct comparisons).
// The maths is in shared/decision/lp.ts, the question generators in lpGen.ts, the working in lpSolve.ts and the picture in LpWorking.tsx.
// ═════════════════════════════════════════════════════════════════════════════════════════════

const SUB_TOOLS = [
  { key: "constraint", label: "Write a constraint", levels: 1, blurb: "One constraint from a short situation" },
];

const ticked = (v: string | undefined, fallback: string): string[] => (v ? v : fallback).split(",").filter(Boolean);

function generate(level: number, ctx?: GenerateContext): DecisionProblem {
  const o = ctx?.options ?? {};
  const vars = ticked(o.lpVars, "2").map(Number).filter((n) => n >= 2 && n <= 4);
  const styles = ticked(o.lpStyles, "resource,compare");
  const q = generateConstraint(level, { vars, styles });
  return { kind: q.data.kind, level, lp: q.data, prompt: q.prompt, answer: { text: q.answerText }, matrixMode: "off" };
}

const solve = (p: DecisionProblem): SolveStep[] => solveLp(p);
const renderCanvas = (p: DecisionProblem, step: SolveStep | undefined) => <LpCanvas p={p} step={step} />;
/** a phone shows the whole solution as one open page */
const renderSolution = (_p: DecisionProblem, steps: SolveStep[]) => <LpSolution steps={steps} />;

const OPTIONS: ShellOption[] = [
  {
    key: "lpVars", label: "Variables", info: "How many quantities the situation has: two (x, y), three (x, y, z) or four (w, x, y, z). Tick any of them and each question draws one.",
    multi: true, defaultFor: () => "2",
    choices: [{ value: "2", label: "Two", sub: "x and y" }, { value: "3", label: "Three", sub: "x, y and z" }, { value: "4", label: "Four", sub: "w, x, y and z" }],
  },
  {
    key: "lpStyles", label: "Constraint Styles", info: "Which kinds of constraint to ask for. Resource use is a limit on something the items use up or supply; comparisons relate the amounts to each other (a multiple, a difference, a bound or a total).",
    forSubTools: ["constraint"], multi: true, defaultFor: () => "resource,compare",
    choices: [{ value: "resource", label: "Resource Use", sub: "10x + 15y ≤ 300" }, { value: "compare", label: "Comparisons", sub: "x ≥ 2y" }],
  },
];

export default function App() {
  return (
    <DecisionShell
      generate={generate}
      solve={solve}
      renderCanvas={renderCanvas}
      renderSolution={renderSolution}
      config={{
        pageTitle: "Formulating Linear Programmes",
        purpose: "Turn a situation into a constraint: the inequality that a limit, a comparison or a total puts on the variables, written with whole-number coefficients in lowest terms.",
        instruction: "Question",
        levels: 3,
        levelInfo: true,
        hideMatrix: true,
        skillSheet: true,
        noSandbox: true,
        levelLabels: {
          constraint: ["Resource use and direct comparisons"],
          default: ["One question"],
        },
        subTools: SUB_TOOLS,
        options: OPTIONS,
      }}
    />
  );
}

export const __seed = { generate, subTools: SUB_TOOLS };
