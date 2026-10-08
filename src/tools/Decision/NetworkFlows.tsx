import {
  DecisionShell,
  FlowView,
  defaultMode,
  defaultStyle,
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

// ═══════════════════════════════════════════════════════════════════════════
// Network Flows — Decision Maths (D2). Potentials, cut values, flow augmentation and
// max-flow min-cut on capacity-only and minimum/maximum networks. Built on
// DecisionShell; the maths lives in shared/decision/flow.ts, the networks in
// flowTemplates.ts (diamond, fan, ladder, hexagon, big network), the question
// generation in flowGenerate.ts and the working in flowSolve.ts.
// Spec: specs/flow-networks.md.
// ═══════════════════════════════════════════════════════════════════════════

const SUB_TOOLS = [
  { key: "initialFlow", label: "Initial flow" },
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
  const sub = (ctx?.subTool ?? "initialFlow") as FlowSubTool;
  const mode = (ctx?.options.bounds ?? defaultMode(lv)) as FlowMode;
  const tpl = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("tpl") ?? undefined : undefined;
  const style = (ctx?.options.style ?? defaultStyle(lv)) as InitialStyle;
  return generateFlowProblem(lv, sub, mode, tpl, style);
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
        <span style={item}><span style={{ width: 4, height: 20, background: "#dc2626", borderRadius: 2, transform: "rotate(30deg)" }} /> arc crossing the cut</span>
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
        levelLabels: ["Capacity-only, smaller networks", "Minimum/maximum, larger networks", "Reversed arcs and backward steps"],
        hideMatrix: true,
        subTools: SUB_TOOLS,
        options: [
          {
            key: "bounds",
            label: "Network",
            choices: [
              { value: "cap", label: "Capacity only" },
              { value: "minmax", label: "Min and max" },
            ],
            defaultFor: (lv) => defaultMode(lv as 1 | 2 | 3),
          },
          {
            key: "style",
            label: "Question",
            forSubTools: ["initialFlow"],
            choices: [
              { value: "paths", label: "Given paths" },
              { value: "find", label: "Find a flow" },
            ],
            defaultFor: (lv) => defaultStyle(lv as 1 | 2 | 3),
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
