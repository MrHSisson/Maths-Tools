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
  type CanvasExtras,
  type SolveStep,
} from "../../shared/decision";
import type { InfoSection } from "../../shared";

// ═══════════════════════════════════════════════════════════════════════════
// Network Flows — Decision Maths (D2). Potentials, cut values, flow augmentation and
// max-flow min-cut on capacity-only and minimum/maximum networks. Built on
// DecisionShell; the maths lives in shared/decision/flow.ts, the networks in
// flowTemplates.ts (diamond, fan, mini hub, zigzag, ladder, hexagon, double hub, tower, big network), the question
// generation in flowGenerate.ts and the working in flowSolve.ts.
// Spec: specs/flow-networks.md.
// ═══════════════════════════════════════════════════════════════════════════

const INFO_SECTIONS: InfoSection[] = [
  {
    title: "Network Flows",
    icon: "🌐",
    content: [
      { label: "Overview", detail: "Flows through a network from a source S to a sink T, on capacity-only or minimum/maximum networks. The same few network shapes are used throughout so students learn one picture well." },
      { label: "Worked through", detail: "Every question is worked through step by step: the network on the left, the working on the right (Next / Back, or the arrow keys). Earlier steps fade but stay on screen. Show all reveals everything; press it again to go back to the step you were on. The expand button on the diagram makes the whole working area fullscreen (Esc leaves it)." },
    ],
  },
  {
    title: "Question types",
    icon: "🧭",
    content: [
      { label: "Find a flow", detail: "Find any feasible flow (min and max) or a flow of a stated value (capacity only). Many answers are valid. The working builds one route by route: capacity only — take the route with the most spare capacity and send as much as it will carry (but no more than is still needed); min and max — take the arc furthest below its minimum, route through it, and send what it needs." },
      { label: "Missing flow", detail: "One or two arcs have no flow shown. Use flow in = flow out at a vertex with exactly one unknown arc." },
      { label: "Flow from potentials", detail: "The potential arrows are shown, not the flows. Flow = maximum − potential increase (or minimum + potential decrease); then find the value of the flow." },
      { label: "Augment flow", detail: "Make two or three augmentations in turn. The potentials are labelled once; then for each augmentation find a flow-augmenting path (every step has a positive potential, including steps that go back against an arrow), take the smallest potential on it, and update the potentials — the next path is found on the updated potentials. Ends with the new value of the flow." },
      { label: "Cut values", detail: "Capacity of a cut = maximums of arcs going S side → T side, minus the minimums of arcs coming back." },
      { label: "Max flow & min cut", detail: "Augment until no path remains (every potential that changes is listed), read the flows off the final potentials, then confirm with a cut of equal capacity." },
    ],
  },
  {
    title: "Question Options",
    icon: "⚙️",
    content: [
      { label: "Capacity only / Min and max (top row)", detail: "Capacity only: every arc has one number. Min and max: every arc has a minimum and a maximum. This is the first choice; the question styles sit underneath it." },
      { label: "Levels", detail: "Levels are the size of the network: Level 1 has 4–5 vertices, Level 2 has 6–7 (the hexagon has a centre vertex that arcs can run into and out of), Level 3 has 8." },
      { label: "Reversed arcs", detail: "Every network has at least one arc pointing back against the flow, so backward arcs and backward steps can be tested." },
      { label: "Numbers", detail: "Small (up to about 20), Tens (10 to 200) or Hundreds (100 to 2000). The maths is identical; only the numbers are bigger. The diagram is drawn wider to make room for four-digit labels." },
      { label: "Include a backward arc / step", detail: "On Cut values, require the cut to include an arc coming back across it. On Augment flow and Max flow, require a step that goes back against an arrow." },
    ],
  },
];

const SUB_TOOLS = [
  { key: "initialFind", label: "Find a flow" },
  { key: "missingFlow", label: "Missing flow" },
  { key: "potentials", label: "Flow from potentials" },
  { key: "augment", label: "Augment flow" },
  { key: "cutValue", label: "Cut values" },
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
  // "Find a flow" is the Initial flow question in its find-any-flow style
  const key = ctx?.subTool ?? "initialFind";
  const sub = (key === "initialFind" ? "initialFlow" : key) as FlowSubTool;
  const mode = (ctx?.options.bounds ?? "cap") as FlowMode;
  const tpl = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("tpl") ?? undefined : undefined;
  const style: InitialStyle = "find";
  const o = ctx?.options ?? {};
  // reversed arcs are always in the network; a backward arc in a cut / a backward step in the paths are options
  return generateFlowProblem(lv, sub, mode, tpl, style, {
    cuts: o.cuts === "backward" ? "backward" : "any",
    backSteps: o.backSteps === "on",
    scale: o.scale === "100" ? 100 : o.scale === "10" ? 10 : 1,
  });
}

const renderCanvas = (p: DecisionProblem, step: SolveStep | undefined, extras?: CanvasExtras) => {
  const d = p.flow!;
  // a question's picture is static; the sandbox passes moved vertices, a fixed frame and a drag handler
  const net = extras?.nodes ? { ...d.net, nodes: extras.nodes } : d.net;
  return <FlowView net={net} mode={d.mode} view={step?.flowView ?? questionView(p)} labelPos={d.labelPos} frame={extras?.box} onNodeDown={extras?.onNodeDown} background={extras ? "transparent" : undefined} />;
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
  const sub = p.flow!.subTool;
  const showPotentials = sub !== "initialFlow" && sub !== "missingFlow";
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 18px" }}>
      <span style={item}>
        <span style={{ width: 22, height: 22, borderRadius: 11, border: "2px solid #2563eb", color: "#2563eb", fontWeight: 800, fontSize: 12, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>5</span>
        flow
      </span>
      {sub === "missingFlow" && (
        <span style={item}>
          <span style={{ width: 22, height: 22, borderRadius: 11, border: "2px solid #d97706", background: "#fffbeb", color: "#d97706", fontWeight: 800, fontSize: 12, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>?</span>
          missing flow
        </span>
      )}
      {showPotentials && <span style={item}>
        <svg width={34} height={16}><line x1={2} y1={8} x2={30} y2={8} stroke="#0891b2" strokeWidth={2} /><path d="M 32 8 L 25 4 L 25 12 z" fill="#0891b2" /></svg>
        potential increase (along the arc)
      </span>}
      {showPotentials && <span style={item}>
        <svg width={34} height={16}><line x1={32} y1={8} x2={4} y2={8} stroke="#0891b2" strokeWidth={2} /><path d="M 2 8 L 9 4 L 9 12 z" fill="#0891b2" /></svg>
        potential decrease (against the arc)
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
            key: "cuts",
            label: "Cuts",
            forSubTools: ["cutValue"],
            choices: [
              { value: "any", label: "Any cut" },
              { value: "backward", label: "Include a backward arc" },
            ],
          },
          {
            key: "backSteps",
            label: "Paths",
            forSubTools: ["augment", "maxFlow"],
            choices: [
              { value: "off", label: "Any paths" },
              { value: "on", label: "Include a backward step" },
            ],
          },
          {
            key: "scale",
            label: "Numbers",
            choices: [
              { value: "1", label: "Small (up to about 20)" },
              { value: "10", label: "Tens (10 to 200)" },
              { value: "100", label: "Hundreds (100 to 2000)" },
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
