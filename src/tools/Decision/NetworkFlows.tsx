import { useDevMode } from "../../devMode";
import {
  DecisionShell,
  FlowView,
  flowBox,
  generateFlowProblem,
  generateFlowExam,
  generateFlowReason,
  FLOW_IDEAS,
  type ExamChain,
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
import FlowTileArt from "../../shared/decision/FlowTileArt";

// ═══════════════════════════════════════════════════════════════════════════
// Network Flows — Decision Maths (D2). Potentials, cut values, flow augmentation and
// max-flow min-cut on capacity-only and minimum/maximum networks. Built on
// DecisionShell; the maths lives in shared/decision/flow.ts, the networks in
// flowTemplates.ts (diamond, fan, mini hub, zigzag, ladder, hexagon, double hub, tower, big network), the question
// generation in flowGenerate.ts and the working in flowSolve.ts.
// Spec: specs/flow-networks.md.
// ═══════════════════════════════════════════════════════════════════════════

const EXAM_LEVELS = ["Smaller network (6–7 vertices)", "Larger network (8 vertices)", "Exam-sized network (9–10 vertices)"];
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
    title: "AS and A-level",
    icon: "🎓",
    content: [
      { label: "Course (top row)", detail: "AS: capacity-only networks and the ideas underneath flows — finding a flow, a missing flow, the capacity of a cut, max flow = min cut (a flow is shown and a cut of the same capacity proves it maximal), and adding a supersource / supersink. A-level: everything in AS plus potentials, flow augmentation, max flow by augmentation, minimum and maximum arcs, and restricted capacities at a vertex (node capacities)." },
      { label: "Cuts in AS", detail: "Only the arcs going from the S side to the T side are added. An arc that comes back across the cut is not counted (there are no minimums, so nothing is deducted) and is not labelled. Minimum and maximum capacities, and subtracting minimums for arcs coming back, are A-level." },
      { label: "Switching course", detail: "Changing the course changes the question types on offer; if the tab you were on is not in the new course you are moved to the first one." },
    ],
  },
  {
    title: "Levels in exam style questions",
    icon: "📝",
    content: EXAM_LEVELS.map((d, i) => ({ label: `Level ${i + 1}`, detail: d })),
  },
  {
    title: "Question types",
    icon: "🧭",
    content: [
      { label: "Exam style (Practice switch)", detail: "Generated multi-part questions in the style of the AQA papers: one network, then lettered parts with their marks. Show an answer to see just the answer and the marks it earns; the (?) beside it gives the step by step. Nothing is scored. AS: Cuts and bounds, Flow in = flow out, Supersource / supersink, Table of cuts (every cut of a small network, the maximum flow with its reason, and a flow that gives it). A-level: Augment and prove (potentials, flow augmentation from a given flow, prove it maximal with a cut, comment on a claim; at Level 3 on a capacity-only network a restricted vertex too), Supersink, augment and prove (adds the supersource / supersink first) Lower capacities, claims and upgrades (a cut with a backward arc, a claimed maximum flow, which one pipe to upgrade) and Forced flows, then augment (two figures: why an arc is at a bound and why a flow is impossible on the first, then potentials, augmentation and a proof on the second; the figure on screen is named, and a printed paper gives each figure above its parts). The Network choice (capacity only / min and max) applies to the augmentation questions; the lower-capacity question always has minimums." },
      { label: "Table of cuts (AS)", detail: "A list of cuts is given (all of them on the smallest networks). Find the value of each: the capacities of the arcs going from the S side to the T side. Arcs coming back are not counted. The smallest value is an upper bound on the maximum flow (maximum flow ≤ the value of any cut); if the list is every cut, it is the maximum flow." },
      { label: "Max flow by inspection (AS)", detail: "Find the value of the maximum flow without labelling: send as much as possible along routes from S to T, then find a cut whose value equals the flow. Give the flow in each arc and the cut as the reason." },
      { label: "Max flow = min cut (AS)", detail: "A flow of maximal value is shown. Find a cut whose capacity equals the flow: every arc crossing it forward is full, every arc coming back is empty. One cut on its own only gives an upper bound (maximum flow ≤ the value of any cut); it proves the flow maximal because a flow of that value has been found. No potentials or augmentation." },
      { label: "Supersource / supersink (AS)", detail: "Several sources and/or sinks are shown. Add a supersource and/or supersink and give the capacity of each arc you add: the total capacity of the arcs leaving each source (or arriving at each sink). No augmentation." },
      { label: "Find a flow", detail: "Find a flow of a stated value (“find a flow of 12”) — by default a value just below the maximum flow, so the routes cannot be chosen carelessly — or, on min and max networks, any feasible flow. Many answers are valid. The working builds one route by route: capacity only — take the route with the most spare capacity and send as much as it will carry (but no more than is still needed); min and max — take the arc furthest below its minimum, route through it, and send what it needs, then (if a value is set) top up on routes with room until the flow reaches it." },
      { label: "Missing flow", detail: "One or two arcs have no flow shown. Use flow in = flow out at a vertex with exactly one unknown arc." },
      { label: "Flow from potentials", detail: "The potential arrows are shown, not the flows. Flow = maximum − potential increase (or minimum + potential decrease); then find the value of the flow." },
      { label: "Augment flow", detail: "Make two or three augmentations in turn. The potentials are labelled once; then for each augmentation find a flow-augmenting path (every step has a positive potential, including steps that go back against an arrow), take the smallest potential on it, and update the potentials — the next path is found on the updated potentials. Ends with the new value of the flow." },
      { label: "Cut values", detail: "Capacity of a cut = maximums of arcs going S side → T side, minus the minimums of arcs coming back." },
      { label: "Node capacities", detail: "One or two vertices have a maximum throughput (the total flow through them). Each is split into two vertices (X₁ takes the arcs arriving, X₂ the arcs leaving) joined by an arc whose maximum is the restriction. On a min and max network that arc's minimum is the total of the minimums arriving, and its maximum is the restriction (or the total of the maximums arriving, if that is smaller). Flow augmentation then finds the maximum flow and a cut that runs through a split arc confirms it." },
      { label: "Supersource / supersink", detail: "Several sources and/or several sinks (S₁, S₂… and T₁, T₂…). The working adds a supersource S joined to every source and a supersink T joined from every sink. Each new arc carries what leaves the source (or arrives at the sink), so its capacity is the total capacity of those arcs; on a min and max network its minimum and maximum are the totals of their minimums and of their maximums. Then it finds the maximum flow and confirms it with a cut." },
      { label: "Max flow & min cut", detail: "Augment until no path remains (every potential that changes is listed), read the flows off the final potentials, then confirm with a cut of equal capacity." },
    ],
  },
  {
    title: "Explain and justify",
    icon: "💬",
    content: [
      { label: "What it is", detail: "A short question on one idea, answered in words and marked against a model answer (the same wording and mark lines as the exam style questions, which are built from the same parts). It is the place to go when an exam part caught you out on reasoning rather than on a method. Levels are the size of the network; at higher levels the question asks for more judgement (a claim to comment on, a cut that is not the minimum)." },
      { label: "Ideas (Question Options)", detail: "Tick the ideas you want. AS: what a cut tells you, a flow and a cut together, supersource and supersink in words. Ideas marked * come from the earlier specification and are off until ticked: maximum flow along routes, show that a cut has a value, a section blocked, a new pipe. A-level adds: is this the maximum flow, increasing a pipe, which pipe to upgrade, a pipe switched off, a restriction at a vertex, forced arcs and an impossible flow (min and max networks)." },
    ],
  },
  {
    title: "Question Options",
    icon: "⚙️",
    content: [
      { label: "Capacity only / Min and max (top row)", detail: "Capacity only: every arc has one number. Min and max: every arc has a minimum and a maximum. This is the first choice; the question styles sit underneath it." },
      { label: "Levels", detail: "Levels are the size of the network: Level 1 has 4–5 vertices, Level 2 has 6–7 (the hexagon has a centre vertex that arcs can run into and out of), Level 3 has 8." },
      { label: "Reversed arcs", detail: "Every network has at least one arc pointing back against the flow, so backward arcs and backward steps can be tested." },
      { label: "Flow to find", detail: "On Find a flow: a flow close to the maximum (1–3 below it, so most of the network has to be used — the default), a flow of a lower set value, or (min and max networks only) any feasible flow. Mixed picks one at random." },
      { label: "Numbers", detail: "Small (up to about 20), Tens (10 to 200) or Hundreds (100 to 2000). The maths is identical; only the numbers are bigger. The diagram is drawn wider to make room for four-digit labels." },
      { label: "Include a backward arc / step", detail: "On Cut values, require the cut to include an arc coming back across it. On Augment flow and Max flow, require a step that goes back against an arrow." },
    ],
  },
];

// AS and A-level share one tool: the top row switches the course, which decides which question types are on offer.
const AS_ONLY = { key: "course", values: ["as"] };
const A_ONLY = { key: "course", values: ["a"] };
const SKILLS = { key: "practice", values: ["skills"] };
const EXAM = { key: "practice", values: ["exam"] };
const SUB_TOOLS = [
  { key: "initialFind", label: "Find a flow", when: SKILLS, blurb: "Build a valid flow from scratch" },
  { key: "missingFlow", label: "Missing flow", when: SKILLS, blurb: "Flow in = flow out to find an arc" },
  { key: "potentials", label: "Flow from potentials", when: [A_ONLY, SKILLS], blurb: "Work out the potential on each arc" },
  { key: "augment", label: "Augment flow", when: [A_ONLY, SKILLS], blurb: "Find a flow-augmenting path" },
  { key: "cutValue", label: "Cut values", when: SKILLS, blurb: "Add up the capacity of a cut" },
  { key: "cutTable", label: "Table of cuts", when: [AS_ONLY, SKILLS], blurb: "The value of every cut in a list" },
  { key: "maxInspect", label: "Max flow by inspection", when: [AS_ONLY, SKILLS], blurb: "Find the maximum flow by inspection" },
  { key: "maxCut", label: "Max flow = min cut", when: [AS_ONLY, SKILLS], blurb: "Show a maximum flow with a minimum cut" },
  { key: "maxFlow", label: "Max flow & min cut", when: [A_ONLY, SKILLS], blurb: "Maximum flow and the minimum cut" },
  { key: "nodeCap", label: "Node capacities", when: [A_ONLY, SKILLS], blurb: "A limit on the flow through a vertex" },
  { key: "superAS", label: "Supersource / supersink", when: [AS_ONLY, SKILLS], blurb: "Several sources or sinks into one" },
  { key: "superST", label: "Supersource / supersink", when: [A_ONLY, SKILLS], blurb: "Several sources or sinks into one" },
  { key: "reason", label: "Explain and justify", when: SKILLS, blurb: "Reason about flows, cuts and claims in words" },
  { key: "examAny", label: "Any exam question", when: EXAM, blurb: "A mixed multi-part question" },
  { key: "examCut", label: "Cuts and bounds", when: [AS_ONLY, EXAM], blurb: "Value of a cut and the bound it gives" },
  { key: "examFlow", label: "Flow in = flow out", when: [AS_ONLY, EXAM], blurb: "Missing flows, then prove a maximum" },
  { key: "examSuper", label: "Supersource / supersink", when: [AS_ONLY, EXAM], blurb: "Add a supersource / supersink, then a cut" },
  { key: "examTable", label: "Table of cuts", levels: 1, when: [AS_ONLY, EXAM], blurb: "Every cut, the maximum flow, a flow that gives it" },
  { key: "examAug", label: "Augment and prove", when: [A_ONLY, EXAM], blurb: "Potentials, augment, prove, comment" },
  { key: "examAugSuper", label: "Supersink, augment and prove", when: [A_ONLY, EXAM], blurb: "Add the supersink first, then augment" },
  { key: "examLower", label: "Lower capacities, claims and upgrades", when: [A_ONLY, EXAM], blurb: "Cuts with minimum capacities, claims" },
  { key: "examForced", label: "Forced flows, then augment", when: [A_ONLY, EXAM], blurb: "Two figures: forced arcs, then augmentation" },
];

const IDEAS_AS = FLOW_IDEAS.filter((i) => i.courses.includes("as") && !i.legacy).map((i) => i.key);
const IDEAS_A = FLOW_IDEAS.filter((i) => i.courses.includes("a") && !i.legacy).map((i) => i.key);
const INSTRUCTION: Record<string, string> = {
  initialFlow: "Find an initial flow",
  potentials: "Label the potentials",
  cutValue: "Find the capacity of the cut",
  augment: "Find a flow-augmenting path",
  maxFlow: "Find the maximum flow",
};

function generate(level: number, ctx?: GenerateContext): DecisionProblem {
  const lv = Math.min(3, Math.max(1, level)) as 1 | 2 | 3;
  if (ctx?.subTool === "reason") {
    const course = ctx.options.course === "as" ? "as" : "a";
    return generateFlowReason(lv, (ctx.options[course === "as" ? "ideaAs" : "ideaA"] ?? "").split(",").filter(Boolean), course);
  }
  if (ctx?.subTool.startsWith("exam")) return generateFlowExam(lv, ctx.subTool === "examAny" ? "any" : (ctx.subTool as ExamChain), { course: ctx.options.course === "as" ? "as" : "a", mode: ctx.options.bounds === "minmax" ? "minmax" : "cap" });
  // "Find a flow" is the Initial flow question in its find-any-flow style
  const key = ctx?.subTool ?? "initialFind";
  // the AS supersource / supersink tab is the same network question without the augmentation
  const sub = (key === "initialFind" ? "initialFlow" : key === "superAS" ? "superST" : key) as FlowSubTool;
  const mode = (ctx?.options.bounds ?? "cap") as FlowMode;
  const tpl = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("tpl") ?? undefined : undefined;
  const style: InitialStyle = "find";
  const o = ctx?.options ?? {};
  // reversed arcs are always in the network; a backward arc in a cut / a backward step in the paths are options
  return generateFlowProblem(lv, sub, mode, tpl, style, {
    cuts: o.cuts === "backward" ? "backward" : "any",
    backSteps: o.backSteps === "on",
    scale: o.scale === "100" ? 100 : o.scale === "10" ? 10 : 1,
    target: o.target === "any" ? "any" : o.target === "value" ? "value" : o.target === "mixed" ? "mixed" : "near",
    shape: o.shape === "sources" ? "sources" : o.shape === "sinks" ? "sinks" : o.shape === "both" ? "both" : "mixed",
    course: key === "superAS" || o.course === "as" ? "as" : "a",
  });
}

const renderCanvas = (p: DecisionProblem, step: SolveStep | undefined, extras?: CanvasExtras) => {
  const d = p.flow!;
  const view = step?.flowView ?? questionView(p);
  // a question's picture is static; the sandbox passes moved vertices, a fixed frame and a drag handler.
  // The node-capacity working draws the SPLIT network (its own vertices), which the sandbox cannot drag.
  const net = view.net ?? (extras?.nodes ? { ...d.net, nodes: extras.nodes } : d.net);
  return <FlowView net={net} mode={d.mode} view={view} labelPos={view.labelPos ?? d.labelPos} frame={extras?.box ?? (d.superST ? flowBox(d.net) : undefined)} onNodeDown={extras?.onNodeDown} background={extras ? "transparent" : undefined} />;
};

// The colour key under the diagram — mirrors FlowView's own colours.
function FlowKey({ p }: { p: DecisionProblem }) {
  const item: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#334155", fontWeight: 600, whiteSpace: "nowrap" };
  if (p.flow!.subTool === "exam") return null; // exam questions carry no key
  if (p.flow!.subTool === "superST" && p.flow!.course === "as") return null; // AS: a capacity-only picture, nothing to key
  if (p.flow!.subTool === "maxInspect" || p.flow!.subTool === "cutTable") {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 18px" }}>
        {p.flow!.subTool === "maxInspect" && <span style={item}><span style={{ width: 22, height: 22, borderRadius: 11, border: "2px solid #2563eb", color: "#2563eb", fontWeight: 800, fontSize: 12, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>5</span> flow</span>}
        <span style={item}><svg width={34} height={8}><line x1={1} y1={4} x2={33} y2={4} stroke="#dc2626" strokeWidth={3} strokeDasharray="9 5" /></svg> the cut</span>
      </div>
    );
  }
  if (p.flow!.subTool === "cutValue" || p.flow!.subTool === "maxCut")
    return (
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 18px" }}>
        <span style={item}><span style={{ width: 16, height: 16, borderRadius: 8, background: "#dbeafe", border: "2px solid #1e3a8a" }} /> S side of the cut</span>
        <span style={item}><svg width={34} height={8}><line x1={1} y1={4} x2={33} y2={4} stroke="#dc2626" strokeWidth={3} strokeDasharray="9 5" /></svg> the cut</span>
      </div>
    );
  const sub = p.flow!.subTool;
  const showPotentials = sub !== "initialFlow" && sub !== "missingFlow" && sub !== "nodeCap" && sub !== "superST";
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 18px" }}>
      <span style={item}>
        <span style={{ width: 22, height: 22, borderRadius: 11, border: "2px solid #2563eb", color: "#2563eb", fontWeight: 800, fontSize: 12, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>5</span>
        flow
      </span>
      {sub === "nodeCap" && (
        <span style={item}>
          <span style={{ width: 20, height: 20, borderRadius: 10, border: "2px solid #d97706", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><span style={{ width: 12, height: 12, borderRadius: 6, border: "2px solid #1e3a8a" }} /></span>
          restricted vertex (maximum throughput)
        </span>
      )}
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

// Still being previewed, so only offered in Developing-tools mode (see docs/PROJECTS.md, Network Flows: needs more work)
const DEV_ONLY_TABS = ["reason", "examTable", "examForced"];

export default function App() {
  const dev = useDevMode();
  const subTools = dev ? SUB_TOOLS : SUB_TOOLS.filter((t) => !DEV_ONLY_TABS.includes(t.key));
  return (
    <DecisionShell
      generate={generate}
      solve={solveFlowProblem}
      renderCanvas={renderCanvas}
      config={{
        pageTitle: "Network Flows",
        instruction: "Question",
        levels: 3,
        levelInfo: true,
        levelLabels: { default: ["Small networks (4–5 vertices)", "Medium networks (6–7 vertices)", "Large networks (8 vertices)"], reason: EXAM_LEVELS, ...Object.fromEntries(["examAny", "examCut", "examFlow", "examSuper", "examAug", "examAugSuper", "examLower", "examForced"].map((k) => [k, EXAM_LEVELS])), examTable: ["Small network (5 vertices)"] },
        purpose: "Work with flows through a network: build and check flows, find cuts, and find the maximum flow and the minimum cut.",
        hideMatrix: true,
        infoSections: INFO_SECTIONS,
        subTools,
        chooser: {
          art: (k: string) => <FlowTileArt k={k} />,
          filters: ["course", "practice"],
          groups: [
            { title: "Flows", keys: ["initialFind", "missingFlow", "potentials", "augment", "nodeCap"] },
            { title: "Cuts and maximum flow", keys: ["cutValue", "cutTable", "maxInspect", "maxCut", "maxFlow"] },
            { title: "Supersource / supersink", keys: ["superAS", "superST"] },
            { title: "Explaining and justifying", keys: ["reason"] },
            { title: "Exam style questions", keys: ["examAny", "examCut", "examFlow", "examSuper", "examTable", "examAug", "examAugSuper", "examLower", "examForced"] },
          ],
        },
        options: [
          {
            key: "course",
            label: "Course",
            top: true,
            defaultFor: () => "a",
            choices: [
              { value: "as", label: "AS" },
              { value: "a", label: "A-level" },
            ],
          },
          {
            key: "practice",
            label: "Practice",
            top: true,
            choices: [
              { value: "skills", label: "Skills" },
              { value: "exam", label: "Exam style" },
            ],
          },
          {
            key: "bounds",
            label: "Network",
            when: A_ONLY, // AS is capacity-only networks
            forSubTools: ["initialFind", "missingFlow", "potentials", "augment", "cutValue", "maxFlow", "nodeCap", "superST", "examAug", "examAugSuper", "examAny"],
            choices: [
              { value: "cap", label: "Capacity only" },
              { value: "minmax", label: "Min and max" },
            ],
          },
          {
            key: "ideaAs",
            label: "Idea",
            when: [AS_ONLY],
            forSubTools: ["reason"],
            multi: true,
            defaultFor: () => IDEAS_AS.join(","),
            choices: FLOW_IDEAS.filter((i) => i.courses.includes("as")).map((i) => ({ value: i.key, label: i.label + (i.legacy ? " *" : "") })),
          },
          {
            key: "ideaA",
            label: "Idea",
            when: [A_ONLY],
            forSubTools: ["reason"],
            multi: true,
            defaultFor: () => IDEAS_A.join(","),
            choices: FLOW_IDEAS.filter((i) => i.courses.includes("a")).map((i) => ({ value: i.key, label: i.label + (i.legacy ? " *" : "") })),
          },
          {
            key: "cuts",
            label: "Cuts",
            when: A_ONLY, // AS counts only the arcs going from the S side to the T side, so there is nothing to choose
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
            key: "target",
            label: "Flow to find",
            forSubTools: ["initialFind"],
            choices: [
              { value: "near", label: "Close to the maximum" },
              { value: "value", label: "A lower set value" },
              { value: "any", label: "Any feasible flow", sub: "min and max networks" },
              { value: "mixed", label: "Mixed" },
            ],
          },
          {
            key: "shape",
            label: "Sources and sinks",
            forSubTools: ["superST"],
            choices: [
              { value: "mixed", label: "Any" },
              { value: "sources", label: "Several sources" },
              { value: "sinks", label: "Several sinks" },
              { value: "both", label: "Both" },
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
