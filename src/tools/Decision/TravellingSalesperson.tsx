import {
  DecisionShell,
  generateTsp,
  solveTsp,
  type DecisionProblem,
  type DecisionProblemExport,
  type GenerateContext,
  type LegendItem,
  type TspKind,
} from "../../shared/decision";

// ═══════════════════════════════════════════════════════════════════════════
// Travelling Salesperson — Decision Maths (AQA Further Maths, Discrete: the travelling salesperson problem), on
// DecisionShell. Four question types:
//   Nearest neighbour (the UPPER bound, from one start or two) · Lower bound (delete a vertex, minimum spanning tree of the
//   rest, add its two shortest edges) · Both bounds (and the interval the optimal tour lies in) · Table of least distances.
// Levels: a complete network · a practical network (complete the table of least distances first) · a practical network where a
// direct edge is not the shortest way. Every question is unambiguous: tie-free nearest-neighbour choices, unique shortest routes,
// and a lower bound whose tree and links are the only possible ones. Maths in shared/decision/tsp.ts + tspBounds.ts,
// generation in tspGenerate.ts, working in tspSolve.ts; validate.ts and src/tests/tspBounds.test.ts check it independently.
// ═══════════════════════════════════════════════════════════════════════════

const SUB_TOOLS = [
  { key: "upper", label: "Nearest neighbour", blurb: "Build a tour for an upper bound" },
  { key: "lower", label: "Lower bound", blurb: "Delete a vertex and use a minimum spanning tree" },
  { key: "bounds", label: "Both bounds", blurb: "Find the upper and lower bound together" },
  { key: "table", label: "Table of least distances", blurb: "Fill in the shortest distance between every pair" },
];
const KIND: Record<string, TspKind> = { upper: "tspNN", lower: "tspLower", bounds: "tspBounds", table: "tspTable" };

function generate(level: number, ctx?: GenerateContext): DecisionProblem {
  const lv = Math.min(3, Math.max(1, level)) as 1 | 2 | 3;
  const kind = KIND[ctx?.subTool ?? "upper"] ?? "tspNN";
  const o = ctx?.options ?? {};
  return generateTsp(lv, kind, { starts: o.starts === "two" ? 2 : 1, setting: o.setting === "context" ? "context" : "plain", weights: o.weights === "holds" ? "holds" : o.weights === "breaks" ? "breaks" : "either" });
}

const LEGEND: LegendItem[] = [
  { swatch: "tree", label: "In the tour / tree" },
  { swatch: "considering", label: "This step" },
  { swatch: "added", label: "New table entry / link to deleted vertex" },
  { swatch: "rejected", label: "Not the shortest way" },
  { swatch: "indirect", label: "Via other vertices" },
  { swatch: "current", label: "Current vertex" },
  { swatch: "visited", label: "Visited" },
  { swatch: "deleted", label: "Deleted vertex" },
];

export default function App() {
  return (
    <DecisionShell
      generate={generate}
      solve={solveTsp}
      config={{
        pageTitle: "Travelling Salesperson",
        purpose: "Find upper and lower bounds for the shortest tour that visits every vertex, using the nearest-neighbour method and the deleted-vertex method.",
        instruction: "Question",
        levels: 3,
        levelInfo: true,
        levelLabels: {
          upper: ["Complete network (K4–K6)", "Practical network — complete the table of least distances first", "Practical network where direct edges aren't the shortest route"],
          lower: ["Complete network (K5–K6)", "Practical network — complete the table of least distances first", "Practical network where direct edges aren't the shortest route"],
          bounds: ["Complete network (K5–K6)", "Practical network — complete the table of least distances first", "Practical network where direct edges aren't the shortest route"],
          table: ["Small practical network (4–6 vertices)", "Practical network (4–6 vertices)", "Practical network where a direct edge isn't the shortest route"],
        },
        subTools: SUB_TOOLS,
        legend: LEGEND,
        options: [
          {
            key: "starts",
            label: "Start vertices",
            info: "How many start vertices the nearest-neighbour method tries.",
            forSubTools: ["upper"],
            choices: [
              { value: "one", label: "One start vertex" },
              { value: "two", label: "Two (better bound)" },
            ],
          },
          {
            key: "weights",
            label: "Initial weights",
            info: "Whether the distances obey the triangle inequality.",
            choices: [
              { value: "either", label: "Either" },
              { value: "holds", label: "Triangle inequality holds (distances)" },
              { value: "breaks", label: "Triangle inequality broken (times, costs)" },
            ],
          },
          {
            key: "setting",
            label: "Setting",
            info: "Whether the question is a plain network or set in a real-life context.",
            choices: [
              { value: "plain", label: "Plain" },
              { value: "context", label: "In context" },
            ],
          },
        ],
      }}
    />
  );
}

// CI contract surface — discovered by src/tests/decision.test.ts.
export const __problem: DecisionProblemExport = {
  templates: [],
  levels: [1, 2, 3],
  subTools: ["upper", { subTool: "upper", options: { weights: "holds" } }, { subTool: "upper", options: { weights: "breaks", setting: "context" } }, { subTool: "bounds", options: { weights: "holds" } }, { subTool: "bounds", options: { weights: "breaks" } }, { subTool: "table", options: { weights: "breaks" } }, { subTool: "upper", options: { starts: "two" } }, { subTool: "upper", options: { setting: "context" } }, "lower", "bounds", "table"],
  generate,
  solve: solveTsp,
};
