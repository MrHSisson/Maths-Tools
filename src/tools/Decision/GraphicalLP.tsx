import { DecisionShell, type DecisionProblem, type GenerateContext, type SolveStep } from "../../shared/decision";
import type { ShellOption } from "../../shared/decision/types";
import GxCanvas, { GxSolution, GxPrintFigure, GxPrintWorking, GxStageFigure } from "../../shared/decision/GxWorking";
import { generateRegion } from "../../shared/decision/lpGraphGen";
import { generateSolve } from "../../shared/decision/lpGraphSolveGen";
import { solveOptimise, solveRegion } from "../../shared/decision/lpGraphSolve";

// ═══════════════════════════════════════════════════════════════════════════════
// Graphical Linear Programming — Decision Maths DD2 (AQA 7367), on DecisionShell with a graph and the written working as its picture. Brief:
// specs/linear-programming-graphical.md. Sub-tools so far: Draw the region and Solve a problem (three levels each); Integer solutions follows.
// ═══════════════════════════════════════════════════════════════════════════════

const SUB_TOOLS = [
  { key: "region", label: "Draw the region", levels: 3, blurb: "Draw the lines, shade out, label R and find the vertices" },
  { key: "solve", label: "Solve a problem", levels: 3, blurb: "Optimise by the sliding objective line or a table of the vertices" },
];

const ticked = (v: string | undefined, fallback: string): string[] => (v ? v : fallback).split(",").filter(Boolean);

function generate(level: number, ctx?: GenerateContext): DecisionProblem {
  const o = ctx?.options ?? {};
  if (ctx?.subTool === "solve") {
    const q = generateSolve(level, { start: ticked(o.gxStartS, level === 3 ? "story" : "bare"), shading: ticked(o.gxShade, "out"), methods: ticked(o.gxMethod, "line") });
    return { kind: "solve", level, gx: q.data, prompt: q.prompt, answer: { text: q.answerText }, matrixMode: "off" };
  }
  const q = generateRegion(level, { start: ticked(o.gxStart, level === 1 ? "bare" : "story"), shading: ticked(o.gxShade, "out") });
  return { kind: "region", level, gx: q.data, prompt: q.prompt, answer: { text: q.answerText }, matrixMode: "off" };
}

const solve = (p: DecisionProblem): SolveStep[] => (p.gx?.kind === "solve" ? solveOptimise(p) : solveRegion(p));
const renderCanvas = (p: DecisionProblem, step: SolveStep | undefined) => <GxCanvas p={p} step={step} />;
const renderSolution = (p: DecisionProblem, steps: SolveStep[]) => <GxSolution p={p} steps={steps} />;

const OPTIONS: ShellOption[] = [
  {
    key: "gxStart", label: "Starting From", info: "Whether the student is given the inequalities or first forms them from a situation. Level 1 gives the inequalities by default; Levels 2 and 3 give a situation.",
    forSubTools: ["region"], multi: true, defaultFor: (lv: number) => (lv === 1 ? "bare" : "story"),
    choices: [{ value: "bare", label: "Inequalities" }, { value: "story", label: "A Situation", sub: "in sentences" }],
  },
  {
    key: "gxShade", label: "Shading", info: "Which side of each line is shaded: the unwanted side, so the feasible region is left clear, or the side that satisfies it, so the region is where the tints overlap. Only the picture changes: the question stays the same.",
    forSubTools: ["region", "solve"], multi: true, displayOnly: true, tab: "display", defaultFor: () => "out",
    choices: [{ value: "out", label: "Shade Out" }, { value: "in", label: "Shade In" }],
  },
  {
    key: "gxStartS", label: "Starting From", info: "Whether the student is given the inequalities, forms them from a situation, or is given the region already drawn. A situation is not offered at Level 2, whose objective has a negative coefficient and so no profit or cost to describe.",
    forSubTools: ["solve"], multi: true, defaultFor: (lv: number) => (lv === 3 ? "story" : "bare"),
    choices: [{ value: "bare", label: "Inequalities" }, { value: "story", label: "A Situation", sub: "in sentences", forLevels: [1, 3] }, { value: "diagram", label: "Diagram Given", sub: "the region is drawn" }],
  },
  {
    key: "gxMethod", label: "Method", info: "How the best point is found: slide an objective line across the region, or work out the objective at every vertex. Tick one or both; the same question is shown either way.",
    forSubTools: ["solve"], multi: true, displayOnly: true, tab: "display", defaultFor: () => "line",
    choices: [{ value: "line", label: "Sliding Line" }, { value: "table", label: "Vertex Table" }],
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
        pageTitle: "Graphical Linear Programming",
        purpose: "Draw the feasible region of a linear programming problem and optimise over it: plot each constraint, shade out the unwanted side, label the region, find its vertices exactly, then slide an objective line or test the vertices to find the best point.",
        instruction: "Question",
        levels: 3,
        levelInfo: true,
        hideMatrix: true,
        skillSheet: true,
        questionStage: { hasFigure: (p) => p.gx?.start === "diagram", figure: (p) => <GxStageFigure p={p} /> },
        // on paper the blank axes are printed under each question, one question to a page, and the answers page has the finished graph
        skillPrint: { figure: (p) => <GxPrintFigure p={p} />, working: (p) => <GxPrintWorking p={p} />, perPage: true, dots: false },
        noSandbox: true,
        levelLabels: {
          region: ["Sloped lines on the origin side", "Adds bounds and vertical or horizontal lines, up to five constraints", "A region away from the origin, or a line through it"],
          solve: ["Maximise over a region on the origin side", "Maximise with a negative coefficient, over a region with bounds", "Minimise a cost over a region away from the origin"],
          default: ["One question"],
        },
        subTools: SUB_TOOLS,
        options: OPTIONS,
      }}
    />
  );
}

export const __seed = { generate, subTools: SUB_TOOLS };
