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
      { label: "Levels", detail: "Level 1: a complete network (every pair joined), so the algorithms apply straight away. Level 2: a practical network — complete the table of least distances first. Level 3: a practical network where one direct edge is longer than a route through other vertices. With times or costs (see Weights below) every level is a complete table instead, and the level sets its size and how many triangles break the inequality. The table question always uses distances. Level 2: a practical network — complete the table of least distances first, then apply the algorithm. Level 3: a practical network where one direct edge is longer than a route through other vertices, so a table entry must be replaced." },
      { label: "Weights: distances or times / costs", detail: "Distances: Level 1 is a complete network that satisfies the triangle inequality; Levels 2–3 are practical networks whose table of least distances satisfies it by construction. Times or costs: a complete table of journey times or ticket costs that does NOT have to satisfy the triangle inequality (a direct leg can be slower or dearer than going round), at every level — Level 1 is K4–K5 with at least one broken triangle, Level 2 is K5–K6 with at least two, Level 3 is K6 with at least three. The table is the data as given (nothing is replaced by a shorter route). Nearest neighbour and the deleted-vertex bound only need a complete table, so both still work. Either (the default) draws one or the other. The weights are never drawn to scale, so the picture does not give the tour away." },
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
  return generateTsp(lv, kind, { starts: o.starts === "two" ? 2 : 1, setting: o.setting === "context" ? "context" : "plain", triangle: o.triangle === "holds" ? "holds" : o.triangle === "fails" ? "fails" : "either" });
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
          upper: ["Distances: complete network (K4–K6) · Times/costs: K4–K5", "Distances: complete the table of least distances first · Times/costs: K5–K6", "Distances: a direct edge isn't the shortest route · Times/costs: K6, several broken triangles"],
          lower: ["Distances: complete network (K5) · Times/costs: K5", "Distances: complete the table of least distances first · Times/costs: K5–K6", "Distances: a direct edge isn't the shortest route · Times/costs: K6, several broken triangles"],
          bounds: ["Distances: complete network (K5) · Times/costs: K5", "Distances: complete the table of least distances first · Times/costs: K5–K6", "Distances: a direct edge isn't the shortest route · Times/costs: K6, several broken triangles"],
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
            key: "triangle",
            label: "Weights",
            forSubTools: ["upper", "lower", "bounds"],
            choices: [
              { value: "either", label: "Either" },
              { value: "holds", label: "Distances (triangle inequality holds)" },
              { value: "fails", label: "Times or costs (need not hold)" },
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
  subTools: ["upper", { subTool: "upper", options: { triangle: "fails" } }, { subTool: "lower", options: { triangle: "fails", setting: "context" } }, { subTool: "bounds", options: { triangle: "fails" } }, { subTool: "upper", options: { starts: "two" } }, { subTool: "upper", options: { setting: "context" } }, "lower", "bounds", "table"],
  generate,
  solve: solveTsp,
};
