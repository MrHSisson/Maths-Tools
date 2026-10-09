import {
  DecisionShell,
  generateMstNetwork,
  kruskalTrace,
  primTrace,
  solveKruskal,
  solvePrimMatrix,
  solvePrimNetwork,
  edgeName,
  type DecisionProblem,
  type DecisionProblemExport,
  type GenerateContext,
  type LegendItem,
  type MstKind,
  type SolveStep,
} from "../../shared/decision";
import type { InfoSection } from "../../shared";

// ═══════════════════════════════════════════════════════════════════════════
// Minimum Spanning Tree — Decision Maths (AQA Further Maths, Discrete: graphs & networks). Three methods on
// DecisionShell, at three levels that are graph size (5–6, 7, 8–9 vertices) plus an optional very large size (10–12):
//   Kruskal's algorithm · Prim's algorithm on the network · Prim's algorithm on a table (the network is given as a
//   table of distances, so Question mode draws only the vertices).
// Every network is connected and crossing-free with ALL weights different, so the tree, the order of every choice and the
// total are unique — no tie-break rule is ever needed. The maths lives in shared/decision/mst.ts, the working in mstSolve.ts.
// ═══════════════════════════════════════════════════════════════════════════

const INFO_SECTIONS: InfoSection[] = [
  {
    title: "Minimum Spanning Tree",
    icon: "🌳",
    content: [
      { label: "Overview", detail: "A spanning tree joins every vertex of a network using the fewest edges (one fewer than the number of vertices) with no cycles. The minimum spanning tree has the smallest total weight. Three methods are practised: Kruskal's algorithm, Prim's algorithm on the network, and Prim's algorithm on a table of distances." },
      { label: "Worked through", detail: "Every question is worked through step by step: the network on the left, the working on the right (Next / Back, or the arrow keys). Earlier steps fade but stay on screen. Show all reveals everything; press it again to go back to the step you were on. The expand button on the diagram makes the whole working area fullscreen (Esc leaves it). Chosen edges carry the number they were chosen at." },
      { label: "All weights are different", detail: "Every edge in a question has its own weight, so there is exactly one minimum spanning tree and no choice between equal edges. (In an exam, equal weights can be taken in any order.)" },
    ],
  },
  {
    title: "Question types",
    icon: "🧭",
    content: [
      { label: "Kruskal's algorithm", detail: "List the edges in order of weight. Take them in turn: add an edge unless it would make a cycle, and say which cycle when it is rejected. Stop when the tree has one fewer edge than there are vertices." },
      { label: "Prim's algorithm (network)", detail: "Start at the vertex given. Look at every edge joining the tree to a vertex not yet in it, and add the smallest. Repeat until every vertex is in the tree. The edges on offer are listed at every step." },
      { label: "Prim's algorithm (table)", detail: "The network is given as a table. Write 1 above the starting column and cross out its row. Look down the numbered columns, ignoring crossed-out rows, and take the smallest entry; number its column, cross out its row, and repeat. The tree is built on the vertices as the working goes." },
    ],
  },
  {
    title: "Question Options",
    icon: "⚙️",
    content: [
      { label: "Levels", detail: "Levels are the size of the network: Level 1 has 5–6 vertices, Level 2 has 7, Level 3 has 8–9. Larger networks have more edges to weigh up and more that must be rejected." },
      { label: "Network size", detail: "Kruskal's and Prim's (network) can use a very large network of 10–12 vertices and 15–20 edges, where the sorted edge list and the cycles to reject really matter. Prim's on a table keeps to the level's size, because a 12 × 12 table is too much to read." },
      { label: "Setting", detail: "Plain asks for the tree. In context describes the weights as lengths of cable, pipe or road between sites and asks for the minimum total length needed." },
      { label: "Ask for", detail: "The order the edges are added and the total weight (as in an exam), just the total weight, or just the order of the edges." },
    ],
  },
];

const SUB_TOOLS = [
  { key: "kruskal", label: "Kruskal's algorithm" },
  { key: "primNetwork", label: "Prim's algorithm" },
  { key: "primMatrix", label: "Prim's on a table" },
];

const KIND: Record<string, MstKind> = { kruskal: "kruskal", primNetwork: "primNetwork", primMatrix: "primMatrix" };

const CONTEXTS = [
  { sites: "offices", thing: "cable", unit: "m", need: "length of cable" },
  { sites: "villages", thing: "fibre-optic cable", unit: "km", need: "length of cable" },
  { sites: "houses", thing: "water pipe", unit: "m", need: "length of pipe" },
  { sites: "schools", thing: "broadband link", unit: "km", need: "length of link" },
  { sites: "farms", thing: "road", unit: "km", need: "length of new road" },
  { sites: "warehouses", thing: "conveyor", unit: "m", need: "length of conveyor" },
];
const pickOne = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

function generate(level: number, ctx?: GenerateContext): DecisionProblem {
  const lv = Math.min(3, Math.max(1, level)) as 1 | 2 | 3;
  const sub = ctx?.subTool ?? "kruskal";
  const kind = KIND[sub] ?? "kruskal";
  const o = ctx?.options ?? {};
  const { network, start } = generateMstNetwork(lv, kind, o.size === "huge");
  const n = network.nodes.length;

  const tree = kind === "kruskal" ? kruskalTrace(network).tree : primTrace(network, start).tree;
  const total = tree.reduce((t, e) => t + e.weight, 0);
  const order = tree.map(edgeName).join(", ");

  const ask = o.ask ?? "both";
  const inContext = o.setting === "context";
  const c = pickOne(CONTEXTS);
  const wantOrder = ask === "both" || ask === "order";
  const wantWeight = ask === "both" || ask === "weight";
  const how =
    kind === "kruskal" ? "Kruskal's algorithm" : kind === "primNetwork" ? `Prim's algorithm, starting at ${start},` : `Prim's algorithm on the table, starting at ${start},`;
  const asks = [
    wantOrder ? "State the order in which the edges are added" : "",
    wantWeight ? (inContext ? `${wantOrder ? "find" : "Find"} the minimum total ${c.need} needed, in ${c.unit}` : `${wantOrder ? "find" : "Find"} the total weight of the tree`) : "",
  ].filter(Boolean).join(", and ");

  let prompt: string;
  if (kind === "primMatrix") {
    prompt = inContext
      ? `The table shows the distances, in ${c.unit}, between ${n} ${c.sites} (a blank means no direct link). A ${c.thing} is to join them all. Use ${how} to find the minimum spanning tree. ${asks}.`
      : `The table shows the weights of the edges of a network with ${n} vertices (a blank means no edge). Use ${how} to find the minimum spanning tree and draw it on the vertices. ${asks}.`;
  } else if (inContext) {
    prompt = `The weights on the network are the distances, in ${c.unit}, between ${n} ${c.sites}. A ${c.thing} is to join them all. Use ${how} to find the minimum spanning tree. ${asks}.`;
  } else {
    prompt = `Use ${how} to find a minimum spanning tree for the network. ${asks}.`;
  }

  const unit = inContext ? ` ${c.unit}` : "";
  const parts = [
    wantOrder ? `Edges added: ${order}` : "",
    wantWeight ? `${wantOrder ? "total " : "Total "}weight ${total}${unit}` : `Tree: ${order}`,
  ].filter(Boolean);

  return {
    network,
    start: kind === "kruskal" ? undefined : start,
    kind,
    prompt,
    answer: { text: parts.join(", ") + ".", edges: tree.map((e) => e.id), value: total },
    matrixMode: kind === "primMatrix" ? "question" : "off",
    vertexOnlyQuestion: kind === "primMatrix",
  };
}

function solve(p: DecisionProblem): SolveStep[] {
  if (p.kind === "primMatrix") return solvePrimMatrix(p.network, p.start!);
  if (p.kind === "primNetwork") return solvePrimNetwork(p.network, p.start!);
  return solveKruskal(p.network);
}

const LEGEND: LegendItem[] = [
  { swatch: "tree", label: "In the tree" },
  { swatch: "considering", label: "Being weighed" },
  { swatch: "rejected", label: "Rejected (cycle)" },
  { swatch: "visited", label: "In the tree (vertex)" },
];

export default function App() {
  return (
    <DecisionShell
      generate={generate}
      solve={solve}
      config={{
        pageTitle: "Minimum Spanning Tree",
        instruction: "Question",
        levels: 3,
        levelLabels: ["Small networks (5–6 vertices)", "Medium networks (7 vertices)", "Large networks (8–9 vertices)"],
        subTools: SUB_TOOLS,
        infoSections: INFO_SECTIONS,
        matrixMissing: "–",
        legend: LEGEND,
        options: [
          {
            key: "setting",
            label: "Setting",
            choices: [
              { value: "plain", label: "Plain" },
              { value: "context", label: "In context" },
            ],
          },
          {
            key: "size",
            label: "Network size",
            forSubTools: ["kruskal", "primNetwork"],
            choices: [
              { value: "level", label: "As the level" },
              { value: "huge", label: "Very large (10–12 vertices, any level)" },
            ],
          },
          {
            key: "ask",
            label: "Ask for",
            choices: [
              { value: "both", label: "Order and total weight" },
              { value: "weight", label: "Total weight only" },
              { value: "order", label: "Order only" },
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
  subTools: ["kruskal", "primNetwork", "primMatrix", { subTool: "kruskal", options: { size: "huge" } }, { subTool: "primNetwork", options: { size: "huge" } }],
  generate,
  solve,
};
