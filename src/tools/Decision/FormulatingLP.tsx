import { DecisionShell, type DecisionProblem, type GenerateContext, type SolveStep } from "../../shared/decision";
import type { ShellOption } from "../../shared/decision/types";
import LpCanvas, { LpSolution } from "../../shared/decision/LpWorking";
import { generateConstraint } from "../../shared/decision/lpGenL23";
import { generateProblem } from "../../shared/decision/lpProblem";
import { solveLp } from "../../shared/decision/lpSolve";

// ═════════════════════════════════════════════════════════════════════════════════════════════
// Formulating Linear Programmes — Decision Maths DD1 (AQA 7367), built on DecisionShell with the written working (the page a student would write, building a line
// at a time) as its picture. Brief: specs/linear-programming-formulate.md. One sub-tool so far:
//   Write a constraint — one constraint from a short situation, in whole numbers and lowest terms (Level 1: resource use and direct comparisons).
// The maths is in shared/decision/lp.ts, the question generators in lpGen.ts, the working in lpSolve.ts and the picture in LpWorking.tsx.
// ═════════════════════════════════════════════════════════════════════════════════════════════

const SUB_TOOLS = [
  { key: "constraint", label: "Write a constraint", levels: 3, blurb: "One constraint from a short situation" },
  { key: "problem", label: "Formulate a problem", levels: 3, blurb: "The variables, the objective and every constraint" },
];

const ticked = (v: string | undefined, fallback: string): string[] => (v ? v : fallback).split(",").filter(Boolean);

function generate(level: number, ctx?: GenerateContext): DecisionProblem {
  const o = ctx?.options ?? {};
  const vars = ticked(o.lpVars, "2").map(Number).filter((n) => n >= 2 && n <= 4);
  if (ctx?.subTool === "problem") {
    const q = generateProblem(level, { vars, objective: ticked(o.lpObjective, "max"), integers: o.lpIntegers !== "leave", table: o.lpData === "table" });
    return { kind: q.data.kind, level, lp: q.data, prompt: q.prompt, answer: { text: q.answerText }, matrixMode: "off" };
  }
  const styles = ticked(o.lpStyles, level === 1 ? "resource,compare" : level === 2 ? "percent,ratio,decimal" : "blend,eitherOr");
  const pctOf = ticked(o.lpPctOf, "one,combined,total,morless");
  const method = o.lpMethod === "units" || o.lpMethod === "both" ? o.lpMethod : "fractions";
  const q = generateConstraint(level, { vars, styles, pctOf, capGiven: o.lpCapGiven || "most", method });
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
    key: "lpObjective", label: "Objective", info: "Whether the model maximises a profit (resource limits) or minimises a cost (amounts that must be supplied). Tick both to mix them.",
    forSubTools: ["problem"], multi: true, defaultFor: () => "max",
    choices: [{ value: "max", label: "Maximise Profit" }, { value: "min", label: "Minimise Cost" }],
  },
  {
    key: "lpIntegers", label: "Integers", info: "Whether the question says that only whole numbers of items can be made, so that the model must say the variables are integers.",
    forSubTools: ["problem"], forLevels: [2, 3], defaultFor: () => "say",
    choices: [{ value: "say", label: "Say So" }, { value: "leave", label: "Leave Out" }],
  },
  {
    key: "lpData", label: "Data Shown", info: "Whether the limits and the profit per item are written in sentences or set out in a table beside the question. It changes only how the same question is shown.",
    forSubTools: ["problem"], forLevels: [2, 3], displayOnly: true, tab: "display", defaultFor: () => "sentences",
    choices: [{ value: "sentences", label: "Sentences" }, { value: "table", label: "Table" }],
  },
  {
    key: "lpStyles", label: "Constraint Styles", info: "Which kinds of constraint to ask for. A question draws one of the ticked kinds, so a teacher can drill one style at a time or mix them all.",
    forSubTools: ["constraint"], multi: true, defaultFor: (lv: number) => (lv === 1 ? "resource,compare" : lv === 2 ? "percent,ratio,decimal" : "blend,eitherOr"),
    choices: [
      { value: "resource", forLevels: [1], label: "Resource Use", sub: "10x + 15y ≤ 300" },
      { value: "compare", forLevels: [1], label: "Comparisons", sub: "x ≥ 2y" },
      { value: "percent", forLevels: [2], label: "Percentages", sub: "x is 40% of y" },
      { value: "ratio", forLevels: [2], label: "Ratios And Shares", sub: "x : y, one for every two" },
      { value: "decimal", forLevels: [2], label: "Decimal Amounts", sub: "0.4x + 0.6y ≤ 30" },
      { value: "blend", forLevels: [3], label: "Blends", sub: "At least 30% olive oil" },
      { value: "eitherOr", forLevels: [3], label: "Either-Or Limits", sub: "x/60 + y/45 ≤ 1" },
    ],
  },
  {
    key: "lpPctOf", label: "Percentages Of", info: "What the percentage is taken of. Several variables combined need three or more variables; they are skipped when only two are ticked.",
    forSubTools: ["constraint"], forLevels: [2], multi: true, defaultFor: () => "one,combined,total,morless",
    choices: [{ value: "one", label: "One Variable" }, { value: "combined", label: "Several Combined" }, { value: "total", label: "The Total" }, { value: "morless", label: "More Or Less Than", sub: "20% more than y" }],
  },
  {
    key: "lpCapGiven", label: "Capacity Given As", info: "How the shared limit is put into words: it changes what the student must read and convert before the same kind of constraint can be written.",
    forSubTools: ["constraint"], forLevels: [3], defaultFor: () => "most",
    choices: [{ value: "most", label: "Most You Could Make", sub: "60 loaves or 45 cakes" }, { value: "rate", label: "Rate And Time", sub: "60 an hour, 8 hours" }, { value: "perItem", label: "Time Per Item", sub: "1 minute, 4/3 minutes" }, { value: "requirement", label: "Share Of A Requirement", sub: "1/60 each, at least 1" }],
  },
  {
    key: "lpMethod", label: "Capacity Method", info: "How the working builds the either-or constraint: as fractions of the capacity, or by supposing a common number of units. It changes only the working, never the numbers.",
    forSubTools: ["constraint"], forLevels: [3], displayOnly: true, tab: "method", defaultFor: () => "fractions",
    choices: [{ value: "fractions", label: "Fractions Of Capacity" }, { value: "units", label: "Common Units" }, { value: "both", label: "Both" }],
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
          constraint: ["Resource use and direct comparisons", "Percentages, ratios and decimal amounts", "Blends and either-or limits"],
          problem: ["Resource limits and direct comparisons, with a profit or a cost per item", "Percentages, ratios, decimal amounts and fixed totals; price minus cost, a pack, another unit; integers", "Either-or limits, a blend to make, a rest to substitute out; \"exactly half\""],
          default: ["One question"],
        },
        subTools: SUB_TOOLS,
        options: OPTIONS,
      }}
    />
  );
}

export const __seed = { generate, subTools: SUB_TOOLS };
