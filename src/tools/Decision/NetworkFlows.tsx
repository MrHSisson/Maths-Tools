import {
  DecisionShell,
  FlowView,
  generateFlowProblem,
  questionView,
  solveFlowProblem,
  type DecisionProblem,
  type FlowMode,
  type FlowSubTool,
  type InitialStyle,
  type GenerateContext,
  type SolveStep,
} from "../../shared/decision";
import type { InfoSection } from "../../shared";

// ═══════════════════════════════════════════════════════════════════════════
// Network Flows — Decision Maths (D2). Potentials, cut values, flow augmentation and
// max-flow min-cut on capacity-only and minimum/maximum networks. Built on
// DecisionShell; the maths lives in shared/decision/flow.ts, the networks in
// flowTemplates.ts (diamond, fan, ladder, hexagon, big network), the question
// generation in flowGenerate.ts and the working in flowSolve.ts.
// Spec: specs/flow-networks.md.
// ═══════════════════════════════════════════════════════════════════════════

const INFO_SECTIONS: InfoSection[] = [
  {
    title: "Network Flows",
    icon: "🌐",
    content: [
      { label: "Overview", detail: "Flows through a network from a source S to a sink T, on capacity-only or minimum/maximum networks. The same few network shapes are used throughout so students learn one picture well." },
      { label: "Worked through", detail: "Every question is worked through step by step: the network on the left, the working on the right (Next / Back, or the arrow keys). Earlier steps fade but stay on screen; Show all jumps to the end." },
    ],
  },
  {
    title: "Question types",
    icon: "🧭",
    content: [
      { label: "Flow from paths", detail: "Write the flow on every arc from the given paths (flows add where paths share an arc)." },
      { label: "Find a flow", detail: "Find any feasible flow (min and max) or a flow of a stated value (capacity only). Many answers are valid." },
      { label: "Potentials", detail: "Forward potential = maximum − flow; backward potential = flow − minimum." },
      { label: "Cut values", detail: "Capacity of a cut = maximums of arcs going S side → T side, minus the minimums of arcs coming back." },
      { label: "Augment flow", detail: "Find every flow-augmenting path (positive potentials all the way) and the increase along each." },
      { label: "Max flow & min cut", detail: "Augment until no path remains, then confirm with a cut of equal capacity." },
    ],
  },
  {
    title: "Question Options",
    icon: "⚙️",
    content: [
      { label: "Capacity only / Min and max (top row)", detail: "Capacity only: every arc has one number. Min and max: every arc has a minimum and a maximum. This is the first choice; the question styles sit underneath it." },
      { label: "Levels", detail: "Levels are the size of the network: Level 1 has 4–5 vertices, Level 2 has 6–7 (the hexagon has a centre vertex that arcs can run into and out of), Level 3 has 8." },
      { label: "Arcs, Cuts, Paths", detail: "Reverse some arcs, restrict cuts to forward arcs only, or require a backward step in the augmenting paths." },
    ],
  },
];

const SUB_TOOLS = [
  { key: "initialPaths", label: "Flow from paths" },
  { key: "initialFind", label: "Find a flow" },
  { key: "potentials", label: "Potentials" },
  { key: "cutValue", label: "Cut values" },
  { key: "augment", label: "Augment flow" },
  { key: "maxFlow", label: "Max flow & min cut" },
];

const INSTRUCTION: Record<string, string> = {
  initialFlow: "Find an initial flow",
  potentials: "Label the potentials",
  cutValue: "Find the capacity of the cut",
  augment: "Find a flow-augmenting path",
  maxFlow: "Find the maximum flow",
};

function generate(level: number, ctx?: GenerateContext): DecisionProblem {
  const lv = Math.min(3, Math.max(1, level)) as 1 | 2 | 3;
  // "Flow from paths" and "Find a flow" are the two styles of the Initial flow question
  const key = ctx?.subTool ?? "initialPaths";
  const sub = (key === "initialPaths" || key === "initialFind" ? "initialFlow" : key) as FlowSubTool;
  const mode = (ctx?.options.bounds ?? "cap") as FlowMode;
  const tpl = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("tpl") ?? undefined : undefined;
  const style: InitialStyle = key === "initialFind" ? "find" : "paths";
  const o = ctx?.options ?? {};
  return generateFlowProblem(lv, sub, mode, tpl, style, {
    arcs: o.arcs === "reversed" ? "reversed" : "standard",
    cuts: o.cuts === "forward" ? "forward" : "any",
    backSteps: o.backSteps === "on",
  });
}

const renderCanvas = (p: DecisionProblem, step: SolveStep | undefined) => {
  const d = p.flow!;
  return <FlowView net={d.net} mode={d.mode} view={step?.flowView ?? questionView(p)} labelPos={d.labelPos} />;
};

// The colour key under the diagram — mirrors FlowView's own colours.
function FlowKey({ p }: { p: DecisionProblem }) {
  const item: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#334155", fontWeight: 600, whiteSpace: "nowrap" };
  if (p.flow!.subTool === "cutValue")
    return (
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 18px" }}>
        <span style={item}><span style={{ width: 16, height: 16, borderRadius: 8, background: "#dbeafe", border: "2px solid #1e3a8a" }} /> S side of the cut</span>
        <span style={item}><svg width={34} height={8}><line x1={1} y1={4} x2={33} y2={4} stroke="#dc2626" strokeWidth={3} strokeDasharray="9 5" /></svg> the cut</span>
      </div>
    );
  const showPotentials = p.flow!.subTool !== "initialFlow";
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 18px" }}>
      <span style={item}>
        <span style={{ width: 22, height: 22, borderRadius: 11, border: "2px solid #2563eb", color: "#2563eb", fontWeight: 800, fontSize: 12, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>5</span>
        flow
      </span>
      {showPotentials && <span style={item}>
        <svg width={34} height={16}><line x1={2} y1={8} x2={30} y2={8} stroke="#0891b2" strokeWidth={2} /><path d="M 32 8 L 25 4 L 25 12 z" fill="#0891b2" /></svg>
        potential along the arc (room to add)
      </span>}
      {showPotentials && <span style={item}>
        <svg width={34} height={16}><line x1={32} y1={8} x2={4} y2={8} stroke="#0891b2" strokeWidth={2} /><path d="M 2 8 L 9 4 L 9 12 z" fill="#0891b2" /></svg>
        potential against it (room to take back)
      </span>}
    </div>
  );
}

export default function App() {
  return (
    <DecisionShell
      generate={generate}
      solve={solveFlowProblem}
      renderCanvas={renderCanvas}
      config={{
        pageTitle: "Network Flows",
        instruction: "Question",
        levels: 3,
        levelLabels: ["Small networks (4–5 vertices)", "Medium networks (6–7 vertices)", "Large networks (8 vertices)"],
        hideMatrix: true,
        infoSections: INFO_SECTIONS,
        subTools: SUB_TOOLS,
        options: [
          {
            key: "bounds",
            label: "Network",
            top: true,
            choices: [
              { value: "cap", label: "Capacity only" },
              { value: "minmax", label: "Min and max" },
            ],
          },
          {
            key: "arcs",
            label: "Arcs",
            choices: [
              { value: "standard", label: "Standard directions" },
              { value: "reversed", label: "Some reversed" },
            ],
          },
          {
            key: "cuts",
            label: "Cuts",
            forSubTools: ["cutValue"],
            choices: [
              { value: "any", label: "Any cut" },
              { value: "forward", label: "Forward arcs only" },
            ],
          },
          {
            key: "backSteps",
            label: "Paths",
            forSubTools: ["augment", "maxFlow"],
            choices: [
              { value: "off", label: "Forward steps only" },
              { value: "on", label: "Include a backward step" },
            ],
          },
        ],
        canvasFooter: (p: DecisionProblem) => <FlowKey p={p} />,
      }}
    />
  );
}

export { INSTRUCTION };

// CI contract surface — checked by src/tests/flow.test.ts (the shared Decision
// `__problem` validator is MST/TSP-specific, so this tool does not export one).
export const __flow = { generate, solve: solveFlowProblem };
