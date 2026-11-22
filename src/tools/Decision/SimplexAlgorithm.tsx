import { DecisionShell, type DecisionProblem, type GenerateContext, type SolveStep } from "../../shared/decision";
import type { ShellOption } from "../../shared/decision/types";
import SxCanvas, { SxSolution } from "../../shared/decision/SxWorking";
import { generateSimplex, type SxKind } from "../../shared/decision/lpSimplexGen";
import { solveSimplex } from "../../shared/decision/lpSimplexSolve";

// ═════════════════════════════════════════════════════════════════════════════════════════════
// The Simplex Algorithm — Decision Maths DD3 and DD4 (AQA 7367), built on DecisionShell with the written working (the tableau and the row operations) as its
// picture. Plan: specs/linear-programming-simplex.md. Four sub-tools: set up a tableau, carry out one pivot, solve a problem, interpret a tableau.
// The numbers are designed from a whole optimum and checked against a niceness budget by level (lpSimplexGen.ts); the exact engine is lpSimplex.ts.
// ═════════════════════════════════════════════════════════════════════════════════════════════

const SUB_TOOLS = [
  { key: "setup", label: "Set up the tableau", levels: 3, blurb: "Slack variables, equations and the initial tableau" },
  { key: "pivot", label: "One pivot", levels: 3, blurb: "Choose the pivot, then do one iteration" },
  { key: "solve", label: "Solve a problem", levels: 3, blurb: "The whole simplex algorithm, to the optimum" },
  { key: "interpret", label: "Read a tableau", levels: 3, blurb: "Optimal? The values, the binding constraints" },
  { key: "practical", label: "Is it practical?", levels: 3, blurb: "Whole numbers: why the optimum fails, and the best practical plan" },
];

const ticked = (v: string | undefined, fallback: string): string[] => (v ? v : fallback).split(",").filter(Boolean);

function generate(level: number, ctx?: GenerateContext): DecisionProblem {
  const o = ctx?.options ?? {};
  const key = (ctx?.subTool ?? "solve") as string;
  const kind: SxKind = key === "setup" && o.sxDirection === "reverse" ? "reverse" : (key as SxKind);
  const q = generateSimplex(level, {
    kind,
    vars: ticked(o.sxVars, "2").map(Number),
    cons: ticked(o.sxCons, level === 1 ? "2" : "3").map(Number),
    forms: ticked(o.sxForms, "standard"),
    context: ticked(o.sxContext, "bare"),
    pivotGiven: o.sxPivot === "given",
    whole: o.sxWhole === "on",
    given: o.sxGiven !== "find",
    layout: o.sxLayout === "B" ? "B" : "A",
  });
  return { kind: q.data.kind, level, sx: q.data, prompt: q.prompt, answer: { text: q.answerText }, matrixMode: "off" };
}

const solve = (p: DecisionProblem): SolveStep[] => solveSimplex(p);
const renderCanvas = (p: DecisionProblem, step: SolveStep | undefined) => <SxCanvas p={p} step={step} />;
const renderSolution = (_p: DecisionProblem, steps: SolveStep[]) => <SxSolution steps={steps} />;

const OPTIONS: ShellOption[] = [
  {
    key: "sxVars", label: "Variables", info: "How many quantities the problem has: two (x, y), three (x, y, z) or four (w, x, y, z). Tick any of them and each question draws one.",
    multi: true, defaultFor: () => "2",
    choices: [{ value: "2", label: "Two", sub: "x and y" }, { value: "3", label: "Three", sub: "x, y and z", forLevels: [2, 3] }, { value: "4", label: "Four", sub: "w, x, y and z", forLevels: [3] }],
  },
  {
    key: "sxCons", label: "Constraints", info: "How many constraints the problem has, and so how many rows the tableau has. Tick any of them and each question draws one.",
    multi: true, defaultFor: (lv: number) => (lv === 1 ? "2" : "3"),
    choices: [{ value: "2", label: "Two" }, { value: "3", label: "Three" }, { value: "4", label: "Four", forLevels: [3] }],
  },
  {
    key: "sxDirection", label: "Direction", info: "Whether the question gives the problem and asks for the tableau, or gives the tableau and asks for the problem it represents.",
    forSubTools: ["setup"], defaultFor: () => "forward",
    choices: [{ value: "forward", label: "Problem To Tableau" }, { value: "reverse", label: "Tableau To Problem" }],
  },
  {
    key: "sxContext", label: "Wording", info: "Whether the problem is given as an objective and inequalities, or as a situation (in sentences or in a table) that must first be turned into them.",
    forSubTools: ["setup", "solve", "practical"], forLevels: [2, 3], multi: true, defaultFor: () => "bare",
    choices: [{ value: "bare", label: "Inequalities" }, { value: "story", label: "A Situation", sub: "in sentences" }, { value: "table", label: "A Table", sub: "the data in a table" }],
  },
  {
    key: "sxPivot", label: "Pivot", info: "Whether the student chooses the pivot (the column, the θ-values, the row) or is told the pivot and only carries out the row operations.",
    forSubTools: ["pivot"], defaultFor: () => "choose",
    choices: [{ value: "choose", label: "Student Chooses" }, { value: "given", label: "Pivot Given" }],
  },
  {
    key: "sxForms", label: "Starting Form", info: "What the problem looks like before the simplex algorithm can start: already in standard form, or needing a change first. Tick any of them and each question draws one.",
    forSubTools: ["setup", "pivot", "solve"], forLevels: [3], multi: true, defaultFor: () => "standard",
    choices: [
      { value: "standard", label: "Standard Form", sub: "maximise, every constraint ≤" },
      { value: "min", label: "Minimise", sub: "maximise P = −C" },
      { value: "ge", label: "A ≥ Constraint", sub: "multiply by −1" },
      { value: "lower", label: "A Lower Bound", sub: "x ≥ 2, so X = x − 2" },
      { value: "eq", label: "An Equality", sub: "a ≤ and a ≥" },
    ],
  },
  {
    key: "sxWhole", label: "Whole Numbers", info: "Whether only whole numbers make sense. When it is on, the optimum has a fraction in it, and the question asks why that is not practical and for the best practical plan.",
    forSubTools: ["solve", "interpret"], defaultFor: () => "off",
    choices: [{ value: "off", label: "Not Asked" }, { value: "on", label: "Ask If Practical" }],
  },
  {
    key: "sxGiven", label: "Optimum", info: "Whether the question gives the optimal solution of the linear programme, or asks for it first with the simplex algorithm.",
    forSubTools: ["practical"], defaultFor: () => "given",
    choices: [{ value: "given", label: "Given" }, { value: "find", label: "Find It First" }],
  },
  {
    key: "sxLayout", label: "Tableau Layout", info: "How the tableau and the row operations are written. It changes only the way the same working is laid out, never the numbers.",
    displayOnly: true, tab: "display", defaultFor: () => "A",
    choices: [{ value: "A", label: "Columns And NPR", sub: "NPR = R3 ÷ 2" }, { value: "B", label: "Basic Variable And Rows", sub: "R5 = R1 + 8 × R6" }],
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
        pageTitle: "The Simplex Algorithm",
        purpose: "Set up a simplex tableau, choose a pivot and carry out the row operations, solve a problem to its optimum and read what a tableau says, in exact fractions.",
        instruction: "Question",
        levels: 3,
        levelInfo: true,
        hideMatrix: true,
        skillSheet: true,
        noSandbox: true,
        levelLabels: {
          setup: ["Two variables, standard form", "Three variables, and a situation in words", "A change of form first: minimise, ≥, a lower bound, an equality"],
          pivot: ["The first pivot", "Any pivot, three variables", "Including a negative right-hand side to start"],
          solve: ["Two variables, two iterations", "Three variables, up to three iterations", "Four variables, a change of form, up to four iterations"],
          interpret: ["The optimal tableau", "Optimal or not, and the slack variables", "Optimal or not, up to four variables"],
          practical: ["Two variables: round down and up, test, choose", "A situation in words, or three variables; rounding down is not best", "Up to four variables; rounding to the nearest is not allowed"],
          default: ["One question"],
        },
        subTools: SUB_TOOLS,
        options: OPTIONS,
      }}
    />
  );
}

export const __seed = { generate, subTools: SUB_TOOLS };
