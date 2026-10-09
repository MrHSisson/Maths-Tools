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
  type SolveStep,
} from "../../shared/decision";
import type { InfoSection } from "../../shared";

// ═══════════════════════════════════════════════════════════════════════════
// Route Inspection (the Chinese postman problem) — Decision Maths (Edexcel D1 / AQA Further Maths, Discrete). Three question types on
// DecisionShell, at three levels that are graph size (5–6, 7, 8 vertices):
//   Degrees & type  — find the degrees, the odd vertices, and say Eulerian / semi-Eulerian / neither;
//   Closed route    — the shortest route that uses every edge at least once and returns to its start;
//   Start and finish — the same, but starting at one odd vertex and finishing at another.
// Networks come from the graph bank (GRAPH_POLICY.routeInspection: planar, 5–8 vertices) with 0, 2 or 4 odd vertices; the cheapest pairing
// of the odd vertices is always unique. The maths lives in shared/decision/routeInspection.ts, the working in routeInspectionSolve.ts.
// ═══════════════════════════════════════════════════════════════════════════

const INFO_SECTIONS: InfoSection[] = [
  {
    title: "Route Inspection",
    icon: "📮",
    content: [
      { label: "Overview", detail: "A route inspection (Chinese postman) route uses every edge of a network at least once and returns to its start, as short as possible. If every vertex has an even degree the network is Eulerian and the shortest route is simply the total weight. Otherwise the odd vertices have to be paired up, and the shortest route between each pair is repeated." },
      { label: "Worked through", detail: "Every question is worked through step by step: the network on the left, the working on the right (Next / Back, or the arrow keys). Odd vertices are ringed in amber with their degree; repeated edges are purple. Show all reveals everything; press it again to go back to the step you were on. The expand button on the diagram makes the whole working area fullscreen (Esc leaves it)." },
      { label: "Odd vertices", detail: "The number of odd vertices is always even (the handshaking lemma). With two odd vertices there is one pair; with four there are three ways to pair them, and the cheapest is chosen. The shortest route between two odd vertices is not always the edge joining them, so each is found from the network." },
    ],
  },
  {
    title: "Question types",
    icon: "🧭",
    content: [
      { label: "Degrees & type", detail: "Find the degree of every vertex and the odd vertices, then say whether the network is Eulerian (no odd vertices: a closed route using every edge once), semi-Eulerian (two odd vertices: an open route from one to the other) or neither." },
      { label: "Closed route", detail: "Total weight of the edges, the odd vertices, the shortest route between every pair of them, the ways to pair them with their totals, then the edges to repeat and the length of the whole route — which ends with one actual route from the start given." },
      { label: "Start and finish", detail: "The route starts at one odd vertex and finishes at another, so neither needs a repeat. With two odd vertices nothing is repeated; with four, only the other two are paired. The working ends with an actual route from start to finish." },
    ],
  },
  {
    title: "Question Options",
    icon: "⚙️",
    content: [
      { label: "Levels", detail: "Levels are the size of the network: Level 1 has 5–6 vertices, Level 2 has 7, Level 3 has 8. Above Level 1 the shortest route between some pair of odd vertices goes through other vertices rather than along the edge joining them." },
      { label: "Odd vertices", detail: "Any: two or four at random (Degrees & type also draws none). Two: one pair to join. Four: three pairings to compare." },
      { label: "Setting", detail: "Plain asks for the shortest route. In context describes the weights as the lengths of roads, streets or corridors that must all be covered." },
    ],
  },
];

const SUB_TOOLS = [
  { key: "classify", label: "Degrees & type" },
  { key: "closed", label: "Closed route" },
  { key: "open", label: "Start and finish" },
];
const KIND: Record<string, RouteKind> = { classify: "routeClassify", closed: "routeClosed", open: "routeOpen" };

const CONTEXTS = [
  { intro: (a: string) => `The weights show the lengths, in km, of the roads on a postman's round. The postman must walk along every road at least once${a}.`, unit: "km", thing: "roads" },
  { intro: (a: string) => `A council gritter must drive along every road shown (the weights are lengths in km) at least once${a}.`, unit: "km", thing: "roads" },
  { intro: (a: string) => `An inspector must walk along every corridor of a building (the weights are lengths in metres) at least once${a}.`, unit: "m", thing: "corridors" },
  { intro: (a: string) => `A street cleaner must sweep every street shown (the weights are lengths in hundreds of metres) at least once${a}.`, unit: "hundred metres", thing: "streets" },
];
const pickOne = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const and = (ids: string[]) => (ids.length > 1 ? `${ids.slice(0, -1).join(", ")} and ${ids[ids.length - 1]}` : ids[0]);

function generate(level: number, ctx?: GenerateContext): DecisionProblem {
  const lv = Math.min(3, Math.max(1, level)) as 1 | 2 | 3;
  const sub = ctx?.subTool ?? "closed";
  const kind = KIND[sub] ?? "routeClosed";
  const o = ctx?.options ?? {};
  const oddChoice: OddChoice = o.odd === "two" ? "two" : o.odd === "four" ? "four" : "any";
  const { network, run, start, end, type } = generateRouteNetwork(lv, kind, oddChoice);
  const inContext = o.setting === "context" && kind !== "routeClassify";
  const c = pickOne(CONTEXTS);
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
      ? `${c.intro(at)} Find the length of the shortest route, and say which ${c.thing} are repeated.`
      : `Find the length of the shortest route that starts and finishes at ${start} and uses every edge at least once. State the routes that are repeated.`;
  } else {
    const at = `, starting at ${start} and finishing at ${end}`;
    prompt = inContext
      ? `${c.intro(at)} Find the length of the shortest such route, and say which ${c.thing} are repeated.`
      : `Find the length of the shortest route that starts at ${start}, finishes at ${end} and uses every edge at least once. State the routes that are repeated.`;
  }
  return {
    network, kind,
    route: { start, end },
    prompt,
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
        instruction: "Question",
        levels: 3,
        levelLabels: ["Small networks (5–6 vertices)", "Medium networks (7 vertices)", "Large networks (8 vertices)"],
        subTools: SUB_TOOLS,
        infoSections: INFO_SECTIONS,
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
            key: "setting",
            label: "Setting",
            forSubTools: ["closed", "open"],
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
  subTools: [
    "classify", "closed", "open",
    { subTool: "closed", options: { odd: "two" } }, { subTool: "closed", options: { odd: "four", setting: "context" } },
    { subTool: "open", options: { odd: "two" } }, { subTool: "open", options: { odd: "four", setting: "context" } },
  ],
  generate,
  solve,
};
