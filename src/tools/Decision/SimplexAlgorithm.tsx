import { DecisionShell, type DecisionProblem, type GenerateContext, type SolveStep } from "../../shared/decision";
import type { ShellOption } from "../../shared/decision/types";
import SxCanvas, { SxSolution, SxPrintFigure, SxPrintWorking, SxStageFigure } from "../../shared/decision/SxWorking";
import { generateSimplex, type SxKind } from "../../shared/decision/lpSimplexGen";
import { solveSimplex, questionBlocks } from "../../shared/decision/lpSimplexSolve";

// ═════════════════════════════════════════════════════════════════════════════════════════════
// The Simplex Algorithm — Decision Maths DD3 and DD4 (AQA 7367), built on DecisionShell with the written working (the tableau and the row operations) as its
// picture. Plan: specs/linear-programming-simplex.md. Four sub-tools: set up a tableau, carry out one pivot, solve a problem, interpret a tableau.
// The numbers are designed from a whole optimum and checked against a niceness budget by level (lpSimplexGen.ts); the exact engine is lpSimplex.ts.
// ═════════════════════════════════════════════════════════════════════════════════════════════

const SUB_TOOLS = [
  { key: "setup", label: "Set up the tableau", levels: 3, blurb: "Slack variables, equations and the initial tableau" },
  { key: "solve", label: "Solve a problem", levels: 3, blurb: "The whole simplex algorithm, or one iteration of it" },
  { key: "forms", label: "Non-standard problems", levels: 3, blurb: "Lower bounds, minimise, ≥ constraints and equalities" },
  { key: "interpret", label: "Read a tableau", levels: 2, blurb: "Optimal? The values, the binding constraints" },
  { key: "practical", label: "Is it practical?", levels: 3, blurb: "Whole numbers: why the optimum fails, and the best practical plan" },
];

const ticked = (v: string | undefined, fallback: string): string[] => (v ? v : fallback).split(",").filter(Boolean);

/** one of the ticked sizes ("3x3"), as [variables, constraints] */
function pickSize(sizes: string[]): [number, number] {
  const z = sizes[Math.floor(Math.random() * sizes.length)] ?? "2x2";
  const [a, b] = z.split("x").map(Number);
  return [a, b];
}

function generate(level: number, ctx?: GenerateContext): DecisionProblem {
  const o = ctx?.options ?? {};
  const key = (ctx?.subTool ?? "solve") as string;
  // Non-standard problems: each level is its own change of form, set up or solved. (Level 1 a lower bound, Level 2 a minimise or a ≥ constraint, Level 3 an equality.)
  const nonStandard = key === "forms";
  // Solve can stop after one iteration (a pivot question); Non-standard problems can stop at the set-up or the first pivot
  const kind: SxKind = nonStandard ? (o.sxThrough === "setup" ? "setup" : o.sxThrough === "pivot" ? "pivot" : "solve") : key === "solve" && o.sxWork === "one" ? "pivot" : key === "interpret" && level === 2 ? "reverse" : (key as SxKind);
  const changes = nonStandard;
  const FORMS_BY_LEVEL: Record<number, string[]> = { 1: ["lower"], 2: ["min", "ge"], 3: ["eq"] };
  const levelForms = FORMS_BY_LEVEL[level] ?? ["ge"];
  const pickedForms = ticked(o.sxForms, levelForms.join(",")).filter((f) => levelForms.includes(f));
  // a situation has at most three limits, so at Level 3 it is drawn with three constraints
  const contexts = kind === "pivot" ? ["bare"] : nonStandard ? ticked(o.sxCtxF, "bare") : key === "practical" ? ticked(o.sxCtxP, level === 2 ? "story,table" : "bare") : ticked(o.sxContext, level === 2 ? "story,table" : level === 3 && (key === "setup" || key === "solve") ? "story" : "bare");
  const wordsAtL3 = !contexts.includes("bare");
  // Read a tableau: its own size is drawn from the ticked ones, and the problem is designed and judged at that size (two variables is Level 1's, three Level 2's, four Level 3's)
  const readSize = key === "interpret" ? pickSize(ticked(o.sxSizeR, "2x2,3x3")) : undefined;
  const design = readSize ? (readSize[0] === 2 ? 1 : readSize[0] === 3 ? 2 : 3) : level;
  const tableauTicks = ticked(o.sxTableau, "optimal,part");
  const startTicks = ticked(o.sxStart, "initial");
  const degTicks = ticked(o.sxDegenerate, level === 3 ? "plain,degenerate" : "plain");
  const hasDeg = degTicks.includes("degenerate");
  const q = generateSimplex(design, {
    kind,
    anySize: !!readSize,
    tableau: key === "interpret" && kind === "interpret" ? (tableauTicks.length === 1 ? (tableauTicks[0] as "optimal" | "part") : "either") : undefined,
    vars: [],
    cons: [],
    sizes: readSize ? [readSize] : ticked(o.sxSize, level === 1 ? "2x2" : "3x3").map((z): [number, number] => { const [a, b] = z.split("x").map(Number); return [a, b]; }).map(([n, m]): [number, number] => (nonStandard && wordsAtL3 ? [n, Math.min(m, 2)] : [n, m])).filter(([, m]) => !(level === 3 && wordsAtL3 && m > 3 && !nonStandard)),
    hard: level === 3 && (key === "setup" || key === "solve") ? ticked(o.sxHard, "percent,either") : undefined,
    nonStandard: changes,
    forms: !changes ? ["standard"] : pickedForms.length ? pickedForms : levelForms,
    startAt: key === "solve" && (startTicks.length === 2 ? Math.random() < 0.5 : startTicks[0] === "later") ? "later" : "initial",
    method: o.sxMethod === "rows" ? "rows" : "substitute",
    context: contexts,
    pivotGiven: o.sxPivot === "given" || o.sxPivotF === "given",
    whole: o.sxWhole === "on",
    given: o.sxGiven !== "find",
    layout: o.sxLayout === "B" ? "B" : "A",
    // only the sub-tools that pivot can meet a degenerate case; it is allowed by default at Level 3 only
    allowDegenerate: (key === "solve" || key === "forms") && hasDeg,
    onlyDegenerate: (key === "solve" || key === "forms") && hasDeg && !degTicks.includes("plain"),
  });
  return { kind: q.data.kind, level, sx: q.data, prompt: q.prompt, answer: { text: q.answerText }, matrixMode: "off" };
}

const solve = (p: DecisionProblem): SolveStep[] => solveSimplex(p);
const renderCanvas = (p: DecisionProblem, step: SolveStep | undefined) => <SxCanvas p={p} step={step} />;
const renderSolution = (_p: DecisionProblem, steps: SolveStep[]) => <SxSolution steps={steps} />;

const OPTIONS: ShellOption[] = [
  {
    key: "sxSize", label: "Size", info: "How many variables and how many constraints the problem has (so how many rows the tableau has): 2 × 3 is two variables and three constraints. Level 1 has two variables, Level 2 has three, and Level 3 has three or four. Tick any of them and each question draws one. An asterisk marks an extension that is unlikely to come up.",
    forSubTools: ["setup", "solve", "forms", "practical"], forLevels: [1, 3], multi: true, defaultFor: (lv: number) => (lv === 1 ? "2x2" : "3x3"),
    choices: [
      { value: "2x2", label: "2 × 2", forLevels: [1] }, { value: "2x3", label: "2 × 3", forLevels: [1] }, { value: "3x3", label: "3 × 3", forLevels: [3] }, { value: "4x4", label: "4 × 4*", forLevels: [3] },
    ],
  },
  {
    key: "sxContext", label: "Wording", info: "Whether the student is given the inequalities or must first form them from a situation. Level 1 always gives them, Levels 2 and 3 form them by default, and a table of the data is Level 2 only.",
    forSubTools: ["setup", "solve"], forSubToolLevels: { setup: [2, 3], solve: [2, 3] }, multi: true, defaultFor: (lv: number) => (lv === 2 ? "story,table" : lv === 3 ? "story" : "bare"),
    choices: [{ value: "bare", label: "Inequalities", forLevels: [3] }, { value: "story", label: "A Situation", sub: "in sentences" }, { value: "table", label: "A Table", sub: "the data in a table", forLevels: [2] }],
  },
  {
    key: "sxHard", label: "Limit Types", info: "The harder ways a limit is worded in a Level 3 situation, which the student must turn into an ordinary constraint. At least one limit in each question is one of the ticked types; the others are worded plainly. Tick either or both.",
    forSubTools: ["setup", "solve"], forLevels: [3], multi: true, defaultFor: () => "percent,either",
    choices: [
      { value: "percent", label: "Percentages Of A Whole", sub: "each uses 5% of the oven time" },
      { value: "either", label: "Either-Or Limits", sub: "20 chairs or 30 tables" },
    ],
  },
  {
    key: "sxWork", label: "Work Through", info: "How far through the simplex algorithm the question goes.",
    forSubTools: ["solve"], defaultFor: () => "optimum",
    choices: [{ value: "optimum", label: "To The Optimum" }, { value: "one", label: "One Iteration" }],
  },
  {
    key: "sxStart", label: "Start From", info: "How far into the run the tableau the question gives is. Tick one or both and each question draws one.",
    forSubTools: ["solve"], when: { key: "sxWork", values: ["one"] }, multi: true, defaultFor: () => "initial",
    choices: [{ value: "initial", label: "The Initial Tableau" }, { value: "later", label: "A Later Tableau" }],
  },
  {
    key: "sxCtxP", label: "Wording", info: "Whether the student is given the inequalities or must first form them from a situation, in sentences or a table. Level 2 is a situation by default.",
    forSubTools: ["practical"], multi: true, defaultFor: (lv: number) => (lv === 2 ? "story,table" : "bare"),
    choices: [{ value: "bare", label: "Inequalities" }, { value: "story", label: "A Situation", sub: "in sentences" }, { value: "table", label: "A Table", sub: "the data in a table" }],
  },
  {
    key: "sxSizeR", label: "Size", info: "How many variables and constraints the tableau has. Tick any of them and each question draws one. An asterisk marks an extension that is unlikely to come up.",
    forSubTools: ["interpret"], multi: true, defaultFor: () => "2x2,3x3",
    choices: [{ value: "2x2", label: "2 × 2" }, { value: "3x3", label: "3 × 3" }, { value: "4x4", label: "4 × 4*" }],
  },
  {
    key: "sxTableau", label: "Which Tableau", info: "Which tableau of the run the question gives. Tick one or both and each question draws one. Reading a tableau that is not yet optimal means saying why, and which column comes next.",
    forSubTools: ["interpret"], forLevels: [1], multi: true, defaultFor: () => "optimal,part",
    choices: [{ value: "optimal", label: "The Optimal Tableau" }, { value: "part", label: "One Not Yet Optimal" }],
  },
  {
    key: "sxCtxF", label: "Wording", info: "Whether the student is given the inequalities or must first form them from a situation, such as a minimum amount that must be used or a number that must be made. A minimise has no natural situation, so it is always given as inequalities.",
    forSubTools: ["forms"], multi: true, defaultFor: () => "bare",
    choices: [{ value: "bare", label: "Inequalities" }, { value: "story", label: "A Situation", sub: "at least 40 hours must be used" }],
  },
  {
    key: "sxPivot", label: "Pivot", info: "Whether the student chooses the pivot (the column, the θ-values, the row) or is told the pivot and only carries out the row operations.",
    forSubTools: ["solve"], when: { key: "sxWork", values: ["one"] }, defaultFor: () => "choose",
    choices: [{ value: "choose", label: "Student Chooses" }, { value: "given", label: "Pivot Given" }],
  },
  {
    key: "sxPivotF", label: "Pivot", info: "Whether the student chooses the first pivot (the column, the θ-values, the row) or is told the pivot and only carries out the row operations.",
    forSubTools: ["forms"], when: { key: "sxThrough", values: ["pivot"] }, defaultFor: () => "choose",
    choices: [{ value: "choose", label: "Student Chooses" }, { value: "given", label: "Pivot Given" }],
  },
  {
    key: "sxForms", label: "Starting Form", info: "What has to change before the simplex algorithm can start. Level 2 has two: a minimise (maximise P = −C) and a ≥ constraint (a negative right-hand side to start). Tick either or both and each question draws one. Level 1 is always a lower bound (y ≥ 4) and Level 3 is always an equality.",
    forSubTools: ["forms"], forLevels: [2], multi: true, defaultFor: () => "min,ge",
    choices: [
      { value: "min", label: "Minimise", sub: "maximise P = −C" },
      { value: "ge", label: "A ≥ Constraint", sub: "multiply by −1" },
    ],
  },
  {
    key: "sxThrough", label: "Work Through", info: "How far through the simplex algorithm the question goes.",
    forSubTools: ["forms"], defaultFor: () => "solve",
    choices: [{ value: "solve", label: "To The Optimum" }, { value: "pivot", label: "First Pivot" }, { value: "setup", label: "Set Up Only" }],
  },
  {
    key: "sxMethod", label: "Method", info: "How a lower bound and an equality are handled. Substitute And Split: a lower bound y ≥ 4 becomes Y = y − 4, and an equality becomes a ≤ and a ≥ constraint. Use As Rows: y ≥ 4 is one more constraint (−y ≤ −4, a negative right-hand side to start), and an equation goes in as a row with no slack variable, with the first pivot in that row. The answer is the same either way.",
    forSubTools: ["forms"], forLevels: [1, 3], defaultFor: () => "substitute",
    choices: [{ value: "substitute", label: "Substitute And Split", sub: "Y = y − 4; two inequalities" }, { value: "rows", label: "Use As Rows", sub: "−y ≤ −4; an equation as a row" }],
  },
  {
    key: "sxWhole", label: "Whole Numbers", info: "Whether the question goes on to ask if the solution is practical when only whole numbers make sense, and for the best practical plan if it is not. The optimum may be whole or have a fraction in it. Levels 1 and 2 only: at Level 3 the whole-number question is the Is it practical? sub-tool. An asterisk marks an extension that is unlikely to come up.",
    forSubTools: ["solve"], forLevels: [1, 2], when: { key: "sxWork", values: ["optimum"] }, defaultFor: () => "off",
    choices: [{ value: "off", label: "Not Asked" }, { value: "on", label: "Ask If Practical*" }],
  },
  {
    key: "sxDegenerate", label: "Degenerate Cases", info: "A degenerate case is a corner where three lines meet, so two rows tie for the smallest θ, a basic variable is 0, and sometimes a pivot has θ = 0 and P does not increase. The method still reaches the optimum, but a student who takes the other tied row follows a different path. Tick one or both and each question draws one; with both ticked about one question in three is built degenerate.",
    forSubTools: ["solve", "forms"], forLevels: [2, 3], forSubToolLevels: { forms: [2] }, multi: true, defaultFor: (lv: number) => (lv === 3 ? "plain,degenerate" : "plain"),
    choices: [{ value: "plain", label: "Not Degenerate" }, { value: "degenerate", label: "Degenerate" }],
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
        questionStage: { hasFigure: (p) => questionBlocks(p).length > 0, figure: (p) => <SxStageFigure p={p} /> },
        // on paper the tableau (or the table of data) the question gives is printed under it, each question has a page to work in, and the answers page has the model working
        skillPrint: { figure: (p) => <SxPrintFigure p={p} />, working: (_p, steps) => <SxPrintWorking steps={steps} />, perPage: true, dots: true },
        noSandbox: true,
        levelLabels: {
          setup: ["Two variables, the inequalities given", "Three variables, a situation in words or a table", "Three variables, a situation with harder limits: percentages, either-or"],
          solve: ["Two variables, the inequalities given", "Three variables, a situation in words or a table", "Three variables, a situation with harder limits: percentages, either-or"],
          forms: ["A lower bound", "A minimise, or a ≥ constraint", "An equality"],
          interpret: ["Read a tableau: is it optimal, the values, the binding constraints", "Write the problem the tableau shows"],
          practical: ["Two variables, the inequalities given", "Three variables, a situation in words or a table", "Rounding to the nearest breaks a constraint"],
          default: ["One question"],
        },
        subTools: SUB_TOOLS,
        options: OPTIONS,
      }}
    />
  );
}

export const __seed = { generate, subTools: SUB_TOOLS };
