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
import type { InfoSection } from "../../shared";

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

const INFO_SECTIONS: InfoSection[] = [
  {
    title: "Travelling Salesperson",
    icon: "🧳",
    content: [
      { label: "Overview", detail: "The travelling salesperson problem asks for the shortest closed tour that visits every vertex. There is no quick way to find it, so we find an UPPER bound (a tour we can actually drive — nearest neighbour) and a LOWER bound (the optimal tour cannot be shorter than this — delete a vertex). The optimal tour lies between them." },
      { label: "Worked through", detail: "Every question is worked through step by step: the network on the left, the working on the right (Next / Back, or the arrow keys), and the table of distances below with the entries being used. Earlier steps fade but stay on screen. Show all reveals everything; press it again to go back to the step you were on. The expand button on the diagram makes the whole working area fullscreen (Esc leaves it)." },
    ],
  },
  {
    title: "Question types",
    icon: "🧭",
    content: [
      { label: "Nearest neighbour (upper bound)", detail: "From the start vertex, always travel to the nearest vertex not yet visited (cross out its column in the table); when every vertex has been visited, return to the start. The total is an upper bound. With two start vertices, the smaller total is the better upper bound." },
      { label: "Lower bound (deleted vertex)", detail: "Delete a vertex and its edges. Find a minimum spanning tree of the vertices left (Kruskal's algorithm on the table), then add the two shortest edges from the deleted vertex. The total is a lower bound for the length of the optimal tour." },
      { label: "Both bounds", detail: "Find the upper bound by nearest neighbour and the lower bound by deleting a vertex, then state the interval the optimal tour length lies in: lower ≤ optimal ≤ upper." },
      { label: "Table of least distances", detail: "In a practical network not every pair of vertices is joined, and a direct edge may be longer than a route through other vertices. Fill in each missing entry with the length of the shortest route (the route is shown)." },
    ],
  },
  {
    title: "Question Options",
    icon: "⚙️",
    content: [
      { label: "Levels", detail: "Level 1: a complete network (every pair joined) whose weights may or may not obey the triangle inequality — up to three entries can be beaten by a route through other vertices and must be replaced. Level 2: a practical network (not every pair joined) — complete the table of least distances first. Level 3: a practical network where one to three direct edges are longer than a route through other vertices. Level 2: a practical network — complete the table of least distances first, then apply the algorithm. Level 3: a practical network where one direct edge is longer than a route through other vertices, so a table entry must be replaced." },
      { label: "Initial weights", detail: "Every question starts from an initial network and ALWAYS builds the complete network of least distances first (each entry becomes the shortest route), which satisfies the triangle inequality by construction; the classical problem is then solved on that table. The option decides whether the INITIAL weights obey the inequality. Holds: no direct edge is beaten by a route through other vertices (distances) — Level 3 then always has a table entry that needs a route of three or more edges. Broken: at least one direct edge is longer than a route through other vertices (a slow road, a dear ticket, a long wait), so that table entry must be replaced; in-context questions then describe the weights as journey times or costs. Either (the default) mixes both. Weights are never drawn to scale, so the picture does not give the tour away." },
      { label: "Start vertices", detail: "Nearest neighbour from one start vertex, or from two start vertices with the better (smaller) upper bound taken." },
      { label: "Setting", detail: "Plain, or in context (a driver, representative or surveyor who must visit every site and return)." },
      { label: "No ties", detail: "Every question has no ties between nearest vertices and a lower bound whose tree and edges are the only possible ones, so there is always exactly one correct working." },
    ],
  },
];

const SUB_TOOLS = [
  { key: "upper", label: "Nearest neighbour" },
  { key: "lower", label: "Lower bound" },
  { key: "bounds", label: "Both bounds" },
  { key: "table", label: "Table of least distances" },
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
  { swatch: "added", label: "Edges back to the deleted vertex" },
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
        instruction: "Question",
        levels: 3,
        levelLabels: {
          upper: ["Complete network (K4–K6)", "Practical network — complete the table of least distances first", "Practical network where direct edges aren't the shortest route"],
          lower: ["Complete network (K5–K6)", "Practical network — complete the table of least distances first", "Practical network where direct edges aren't the shortest route"],
          bounds: ["Complete network (K5–K6)", "Practical network — complete the table of least distances first", "Practical network where direct edges aren't the shortest route"],
          table: ["Small practical network (4–6 vertices)", "Practical network (4–6 vertices)", "Practical network where a direct edge isn't the shortest route"],
        },
        subTools: SUB_TOOLS,
        infoSections: INFO_SECTIONS,
        legend: LEGEND,
        options: [
          {
            key: "starts",
            label: "Start vertices",
            forSubTools: ["upper"],
            choices: [
              { value: "one", label: "One start vertex" },
              { value: "two", label: "Two (better bound)" },
            ],
          },
          {
            key: "weights",
            label: "Initial weights",
            choices: [
              { value: "either", label: "Either" },
              { value: "holds", label: "Triangle inequality holds (distances)" },
              { value: "breaks", label: "Triangle inequality broken (times, costs)" },
            ],
          },
          {
            key: "setting",
            label: "Setting",
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
