import {
  DecisionShell,
  generateRouteNetwork,
  solveRoute,
  type DecisionProblem,
  type DecisionProblemExport,
  type GenerateContext,
  type LegendItem,
  type OddChoice,
  type RouteKind,
  type TriangleChoice,
  type SolveStep,
} from "../../shared/decision";

// ═══════════════════════════════════════════════════════════════════════════
// Route Inspection (the Chinese postman problem) — Decision Maths (Edexcel D1 / AQA Further Maths, Discrete). Three question types on
// DecisionShell, at three levels that are graph size (5–6, 7, 8 vertices):
//   Degrees & type  — find the degrees, the odd vertices, and say Eulerian / semi-Eulerian / neither;
//   Closed route    — the shortest route that uses every edge at least once and returns to its start;
//   Start and finish — the same, but starting at one odd vertex and finishing at another.
// Networks come from the graph bank (GRAPH_POLICY.routeInspection: planar, 5–8 vertices) with 0, 2 or 4 odd vertices; the cheapest pairing
// of the odd vertices is always unique. The maths lives in shared/decision/routeInspection.ts, the working in routeInspectionSolve.ts.
// ═══════════════════════════════════════════════════════════════════════════

const SUB_TOOLS = [
  { key: "classify", label: "Degrees & type", blurb: "Find the odd vertices and say what kind of route is possible" },
  { key: "closed", label: "Closed route", blurb: "Pair up the odd vertices to find the shortest closed route" },
  { key: "open", label: "Start and finish", blurb: "Choose where to start and finish for the shortest route" },
];
const KIND: Record<string, RouteKind> = { classify: "routeClassify", closed: "routeClosed", open: "routeOpen" };

const CONTEXTS = [
  { intro: (a: string) => `The weights show the lengths, in km, of the roads on a postman's round. The postman must walk along every road at least once${a}.`, unit: "km", thing: "roads" },
  { intro: (a: string) => `A council gritter must drive along every road shown (the weights are lengths in km) at least once${a}.`, unit: "km", thing: "roads" },
  { intro: (a: string) => `An inspector must walk along every corridor of a building (the weights are lengths in metres) at least once${a}.`, unit: "m", thing: "corridors" },
  { intro: (a: string) => `A street cleaner must sweep every street shown (the weights are lengths in hundreds of metres) at least once${a}.`, unit: "hundred metres", thing: "streets" },
];
// Weights that are NOT lengths: a journey time or a charge need not obey the triangle inequality, so a direct edge can be slower or dearer
// than going round — the shortest connection between two odd vertices is then genuinely found from the network, not read off the edge.
const OTHER_CONTEXTS = [
  { intro: (a: string) => `A delivery van must drive along every route shown (the weights are journey times in minutes, including traffic and waiting) at least once${a}.`, unit: "minutes", thing: "routes", measure: "time" },
  { intro: (a: string) => `A ferry inspector must travel on every crossing shown (the weights are journey times in minutes) at least once${a}.`, unit: "minutes", thing: "crossings", measure: "time" },
  { intro: (a: string) => `A rail engineer must check every line shown at least once${a}. The weights are the cost in pounds of travelling each line, which is not always cheapest by the direct line.`, unit: "pounds", thing: "lines", measure: "cost" },
  { intro: (a: string) => `A tour guide must use every toll road shown (the weights are the tolls in pounds) at least once${a}.`, unit: "pounds", thing: "toll roads", measure: "cost" },
];
const pickOne = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const and = (ids: string[]) => (ids.length > 1 ? `${ids.slice(0, -1).join(", ")} and ${ids[ids.length - 1]}` : ids[0]);

function generate(level: number, ctx?: GenerateContext): DecisionProblem {
  const lv = Math.min(3, Math.max(1, level)) as 1 | 2 | 3;
  const sub = ctx?.subTool ?? "closed";
  const kind = KIND[sub] ?? "routeClosed";
  const o = ctx?.options ?? {};
  const oddChoice: OddChoice = o.odd === "two" ? "two" : o.odd === "four" ? "four" : "any";
  const triangle: TriangleChoice = o.triangle === "holds" ? "holds" : o.triangle === "breaks" ? "breaks" : "either";
  const { network, run, start, end, type } = generateRouteNetwork(lv, kind, oddChoice, triangle);
  // lengths always obey the triangle inequality, so a context that breaks it must be a time or a cost
  const otherWeights = (o.setting === "contextOther" || (o.setting === "context" && triangle === "breaks")) && kind !== "routeClassify";
  const inContext = (o.setting === "context" || otherWeights) && kind !== "routeClassify";
  const c = otherWeights ? pickOne(OTHER_CONTEXTS) : pickOne(CONTEXTS);
  const measure = "measure" in c ? (c as { measure: string }).measure : "length";
  const unit = inContext ? ` ${c.unit}` : "";

  if (kind === "routeClassify") {
    const typeText = type === "eulerian" ? "Eulerian" : type === "semi" ? "semi-Eulerian" : "neither Eulerian nor semi-Eulerian";
    return {
      network, kind,
      route: { start },
      prompt: "Find the degree of every vertex. State which vertices are odd, and say whether the network is Eulerian, semi-Eulerian or neither.",
      answer: { text: `${run.odd.length ? `Odd vertices ${and(run.odd)}` : "No odd vertices"}: the network is ${typeText}.`, value: run.odd.length },
      matrixMode: "off",
    };
  }

  const repeats = run.repeated.length ? ` Repeat ${run.repeated.map((p) => p.join("–")).join(" and ")}.` : " No edge is repeated.";
  let prompt: string;
  if (kind === "routeClosed") {
    const at = `, starting and finishing at ${start}`;
    prompt = inContext
      ? `${c.intro(at)} Find the ${measure === "length" ? "length" : "total " + measure} of the shortest route, and say which ${c.thing} are repeated.`
      : `Find the length of the shortest route that starts and finishes at ${start} and uses every edge at least once. State the routes that are repeated.`;
  } else {
    const at = `, starting at ${start} and finishing at ${end}`;
    prompt = inContext
      ? `${c.intro(at)} Find the ${measure === "length" ? "length" : "total " + measure} of the shortest such route, and say which ${c.thing} are repeated.`
      : `Find the length of the shortest route that starts at ${start}, finishes at ${end} and uses every edge at least once. State the routes that are repeated.`;
  }
  return {
    network, kind,
    route: { start, end },
    prompt,
    caption: `Sum of all the edges = ${run.totalWeight}${unit}`,
    answer: { text: `Shortest route ${run.routeLength}${unit}.${repeats}`, value: run.routeLength },
    matrixMode: "off",
  };
}

function solve(p: DecisionProblem): SolveStep[] {
  return solveRoute(p);
}

const LEGEND: LegendItem[] = [
  { swatch: "current", label: "Odd vertex (degree shown)" },
  { swatch: "added", label: "Repeated edge" },
];

export default function App() {
  return (
    <DecisionShell
      generate={generate}
      solve={solve}
      config={{
        pageTitle: "Route Inspection",
        purpose: "Find the shortest route that uses every edge of a network at least once (the Chinese postman problem).",
        instruction: "Question",
        levels: 3,
        levelInfo: true,
        levelLabels: ["Small networks (5–6 vertices)", "Medium networks (7 vertices)", "Large networks (8 vertices)"],
        subTools: SUB_TOOLS,
        hideMatrix: true,
        legend: LEGEND,
        options: [
          {
            key: "odd",
            label: "Odd vertices",
            choices: [
              { value: "any", label: "Any (two or four)" },
              { value: "two", label: "Two" },
              { value: "four", label: "Four" },
            ],
          },
          {
            key: "triangle",
            label: "Triangle inequality",
            forSubTools: ["closed", "open"],
            choices: [
              { value: "either", label: "Either" },
              { value: "holds", label: "Obeys it" },
              { value: "breaks", label: "Breaks it" },
            ],
          },
          {
            key: "setting",
            label: "Setting",
            forSubTools: ["closed", "open"],
            choices: [
              { value: "plain", label: "Plain" },
              { value: "context", label: "In context (lengths)" },
              { value: "contextOther", label: "In context (times, costs)" },
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
  subTools: [
    "classify", "closed", "open",
    { subTool: "closed", options: { odd: "two" } }, { subTool: "closed", options: { odd: "four", setting: "context" } },
    { subTool: "open", options: { odd: "two" } }, { subTool: "open", options: { odd: "four", setting: "context" } },
    { subTool: "closed", options: { setting: "contextOther" } }, { subTool: "open", options: { odd: "four", setting: "contextOther" } },
    { subTool: "closed", options: { triangle: "holds" } }, { subTool: "open", options: { triangle: "breaks", setting: "context" } },
    { subTool: "closed", options: { triangle: "breaks" } },
  ],
  generate,
  solve,
};
