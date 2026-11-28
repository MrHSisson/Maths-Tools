import { DecisionShell, type DecisionProblem, type GenerateContext, type SolveStep } from "../../shared/decision";
import type { ShellOption } from "../../shared/decision/types";
import LpCanvas, { LpSolution, LpStageFigure } from "../../shared/decision/LpWorking";
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

const PCT: Record<string, string> = { pctOne: "one", pctMany: "combined", pctTotal: "total", pctMore: "morless" };
const STYLES_L2 = "pctOne,pctMany,pctTotal,ratio,share,decimal,fractional";

function generate(level: number, ctx?: GenerateContext): DecisionProblem {
  const o = ctx?.options ?? {};
  const vars = ticked(o.lpVars, "2").map(Number).filter((n) => n >= 2 && n <= 4);
  const view = { slips: o.lpSlips !== "hide", checks: o.lpChecks !== "hide" };
  if (ctx?.subTool === "problem") {
    const q = generateProblem(level, {
      vars, objective: ticked(o.lpObjective, "max"), integers: o.lpIntegers !== "leave", table: o.lpData === "table",
      limits: ticked(o.lpLimits, "1,2").map(Number), single: o.lpSingle === "on", situations: ticked(o.lpSituations, "half,eitherOr,remainder,relation,blend"),
    });
    q.data.view = view;
    return { kind: q.data.kind, level, lp: q.data, prompt: q.prompt, answer: { text: q.answerText }, matrixMode: "off" };
  }
  const toks = ticked(o.lpStyles, level === 1 ? "resource,compare" : level === 2 ? STYLES_L2 : "blend,eitherOr");
  const styles = new Set<string>();
  const pctOf: string[] = [];
  const ratioForms: string[] = [];
  for (const t of toks) {
    if (PCT[t]) { styles.add("percent"); pctOf.push(PCT[t]); }
    else if (t === "ratio" || t === "share") { styles.add("ratio"); ratioForms.push(t); }
    else styles.add(t);
  }
  const q = generateConstraint(level, { vars, styles: [...styles], pctOf, ratioForms, capGiven: o.lpCapGiven || "most" });
  q.data.view = view;
  return { kind: q.data.kind, level, lp: q.data, prompt: q.prompt, answer: { text: q.answerText }, matrixMode: "off" };
}

const solve = (p: DecisionProblem): SolveStep[] => solveLp(p);
const renderCanvas = (p: DecisionProblem, step: SolveStep | undefined) => <LpCanvas p={p} step={step} />;
/** a phone shows the whole solution as one open page */
const renderSolution = (_p: DecisionProblem, steps: SolveStep[]) => <LpSolution steps={steps} />;

const OPTIONS: ShellOption[] = [
  {
    key: "lpVars", label: "Variables", info: "How many quantities the situation has: two (x, y), three (x, y, z) or four (w, x, y, z). Tick any of them and each question draws one. An asterisk marks an extension that is unlikely to come up.",
    multi: true, defaultFor: () => "2",
    choices: [{ value: "2", label: "2", sub: "x and y" }, { value: "3", label: "3", sub: "x, y and z" }, { value: "4", label: "4*", sub: "w, x, y and z" }],
  },
  {
    key: "lpObjective", label: "Objective", info: "Whether the model maximises a profit (resource limits) or minimises a cost (amounts that must be supplied). Tick both to mix them.",
    forSubTools: ["problem"], forLevels: [1, 2], multi: true, defaultFor: () => "max",
    choices: [{ value: "max", label: "Maximise Profit" }, { value: "min", label: "Minimise Cost" }],
  },
  {
    key: "lpLimits", label: "Resource Limits", info: "How many resource limits the situation has: one, two or three. Tick any of them and each question draws one that its situation can supply (three limits are a florist's roses, tulips and sunflowers).",
    forSubTools: ["problem"], multi: true, defaultFor: () => "1,2",
    choices: [{ value: "1", label: "One" }, { value: "2", label: "Two" }, { value: "3", label: "Three" }],
  },
  {
    key: "lpSituations", label: "Situations", info: "Which kinds of model to ask for (each is Level 3: the resource limits on their own are Level 1 and 2). Several ask for the model in fewer letters than the situation has kinds (the rest of a total, or one kind that is exactly a multiple of the others): the question then says which letters to use. A blend is the one problem that minimises.",
    forSubTools: ["problem"], forLevels: [3], multi: true, defaultFor: () => "half,eitherOr,remainder,relation,blend",
    choices: [
      { value: "half", label: "Exactly Half", sub: "x is half of all" },
      { value: "eitherOr", label: "Either-Or Limits", sub: "x/60 + y/45 ≤ 1" },
      { value: "remainder", label: "A Remainder", sub: "the rest of the 40 hectares" },
      { value: "relation", label: "A Relation Between Kinds", sub: "twice, or 10 more than" },
      { value: "blend", label: "A Blend To Minimise", sub: "at least 30% olive oil" },
    ],
  },
  {
    key: "lpSingle", label: "Single Aim", info: "Whether some questions only ask to make as many of one kind as possible (the number of chairs), instead of maximising a profit. It is rare in the exercises, so it is left out unless asked for. An asterisk marks an extension that is unlikely to come up.",
    forSubTools: ["problem"], forLevels: [2, 3], defaultFor: () => "off",
    choices: [{ value: "off", label: "Left Out" }, { value: "on", label: "Included*", sub: "as many chairs as possible" }],
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
    key: "lpStyles", label: "Constraint Styles", info: "Which kinds of constraint to ask for. A question draws one of the ticked kinds, so a teacher can drill one style at a time or mix them all. A percentage of several kinds needs three or more variables, so it is skipped when only two are ticked. An asterisk marks an extension that is unlikely to come up.",
    forSubTools: ["constraint"], multi: true, defaultFor: (lv: number) => (lv === 1 ? "resource,compare" : lv === 2 ? STYLES_L2 : "blend,eitherOr"),
    choices: [
      { value: "resource", forLevels: [1], label: "Resource Use", sub: "10x + 15y ≤ 300" },
      { value: "compare", forLevels: [1], label: "Comparisons", sub: "x ≥ 2y" },
      { value: "pctOne", forLevels: [2], label: "Percentage Of One Kind", sub: "x is 40% of y" },
      { value: "pctMany", forLevels: [2], label: "Percentage Of Several Kinds", sub: "x is 40% of y and z" },
      { value: "pctTotal", forLevels: [2], label: "Percentage Of The Total", sub: "x is at most 25% of all" },
      { value: "pctMore", forLevels: [2], label: "More Or Less Than*", sub: "x is 20% more than y" },
      { value: "ratio", forLevels: [2], label: "Ratios", sub: "x : y at least 2 : 3" },
      { value: "share", forLevels: [2], label: "Shares Of The Total", sub: "x is a third of all" },
      { value: "decimal", forLevels: [2], label: "Decimal Amounts", sub: "0.4x + 0.6y ≤ 30" },
      { value: "fractional", forLevels: [2], label: "Fractional Amounts", sub: "1 minute and 4/3 minutes each" },
      { value: "blend", forLevels: [3], label: "Blends", sub: "At least 30% olive oil" },
      { value: "eitherOr", forLevels: [3], label: "Either-Or Limits", sub: "x/60 + y/45 ≤ 1" },
    ],
  },
  {
    key: "lpCapGiven", label: "Capacity Given As", info: "How the shared limit is put into words: as the most that could be made of each ('60 loaves or 45 cakes'), or as a rate and a time. Either way the student has to work out the amount each item uses before the constraint can be written. An asterisk marks an extension that is unlikely to come up.",
    forSubTools: ["constraint"], forLevels: [3], defaultFor: () => "most",
    choices: [{ value: "most", label: "Most You Could Make", sub: "60 loaves or 45 cakes" }, { value: "rate", label: "Rate And Time*", sub: "60 an hour, 8 hours" }],
  },
  {
    key: "lpSlips", label: "Common Slips", info: "Whether the working ends with the common slip: the mistake a student often makes on this kind of constraint, and why it is wrong. It changes only what is shown.",
    displayOnly: true, tab: "display", defaultFor: () => "show",
    choices: [{ value: "show", label: "Shown" }, { value: "hide", label: "Hidden" }],
  },
  {
    key: "lpChecks", label: "Number Check", info: "Whether the working tries a number to check the constraint (a point that fits the words, or the case of making only one kind). It changes only what is shown.",
    displayOnly: true, tab: "display", defaultFor: () => "show",
    choices: [{ value: "show", label: "Shown" }, { value: "hide", label: "Hidden" }],
  },
  {
    key: "lpSlips", label: "Common Slips", info: "Whether the working ends with the common slip: the mistake a student often makes on this kind of constraint, and why it is wrong. It changes only what is shown.",
    displayOnly: true, tab: "display", defaultFor: () => "show",
    choices: [{ value: "show", label: "Shown" }, { value: "hide", label: "Hidden" }],
  },
  {
    key: "lpChecks", label: "Number Check", info: "Whether the working tries a number to check the constraint (a point that fits the words, or the case of making only one kind). It changes only what is shown.",
    displayOnly: true, tab: "display", defaultFor: () => "show",
    choices: [{ value: "show", label: "Shown" }, { value: "hide", label: "Hidden" }],
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
        questionStage: { hasFigure: (p) => !!p.lp && (p.lp.info.kind !== "problem" || !!p.lp.info.showTable), figure: (p) => <LpStageFigure p={p} /> },
        noSandbox: true,
        levelLabels: {
          constraint: ["Resource use and direct comparisons", "Percentages, ratios, shares, and decimal or fractional amounts", "Blends, and either-or limits worked out from the capacity"],
          problem: ["Resource limits and direct comparisons, with a profit or a cost per item", "Percentages, ratios, decimal amounts and fixed totals; price minus cost, a pack, another unit; integers", "Either-or limits, exactly half, a blend to minimise, a remainder or a relation between kinds substituted out"],
          default: ["One question"],
        },
        subTools: SUB_TOOLS,
        options: OPTIONS,
      }}
    />
  );
}

export const __seed = { generate, subTools: SUB_TOOLS };
