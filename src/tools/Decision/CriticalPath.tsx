import { useEffect, useRef } from "react";
import {
  DecisionShell,
  ActivityNodeView,
  generateCpa,
  solveCpa,
  type CpaKind,
  type DecisionProblem,
  type GenerateContext,
  type SolveStep,
} from "../../shared/decision";
import type { InfoSection } from "../../shared";

// ═══════════════════════════════════════════════════════════════════════════
// Critical Path Analysis — Decision Maths (AQA Further Maths, Discrete / Edexcel D1). Activity ON NODE, no dummy activities, total float
// only. Four question types on DecisionShell, at three levels that are the size of the project (6–7, 8–9, 10–12 activities):
//   Network from a table — draw the activity network (with Start and End) from the precedence table;
//   Forward pass         — the earliest start of every activity and the minimum completion time;
//   Full analysis        — forward and backward pass, then the critical activities, critical path and minimum time;
//   Float                — the float of every activity, from a network already filled in.
// The maths, layout and generator live in shared/decision/cpa.ts, the working in cpaSolve.ts, the picture in ActivityNodeView.
// Spec: specs/critical-path.md. Gantt / cascade charts and resource histograms are later increments.
// ═══════════════════════════════════════════════════════════════════════════

const INFO_SECTIONS: InfoSection[] = [
  {
    title: "Critical Path Analysis",
    icon: "🗺️",
    content: [
      { label: "Overview", detail: "A project is split into activities. Some cannot start until others are finished (their precedences). The activity network shows this as boxes joined by arrows, and critical path analysis finds the shortest time the whole project can take and which activities cannot be delayed." },
      { label: "The boxes", detail: "Each box shows the activity, then three cells: earliest start time, duration, latest finish time. Start and End boxes close the network. The arrows run from an activity to each activity that follows it directly." },
      { label: "Worked through", detail: "Every question is worked through step by step: the network on the left, the working beside it (Next / Back, or the arrow keys). Show all reveals everything; press it again to go back to the step you were on. Amber boxes are the ones being compared, blue is the one being worked out, green is critical." },
    ],
  },
  {
    title: "Question types",
    icon: "🧭",
    content: [
      { label: "Network from a table", detail: "A precedence table lists each activity, its duration and the activities that must be finished immediately before it. Draw the network: Start, then the activities with nothing before them, then each activity with an arrow from every activity before it, then End." },
      { label: "Forward pass", detail: "Work left to right. An activity's earliest start is the largest of the earliest finishes (start + duration) of the activities before it. End's earliest start is the minimum completion time of the project." },
      { label: "Full analysis", detail: "The forward pass, then the backward pass from End: an activity's latest finish is the smallest of the latest starts (latest finish − duration) of the activities after it. Activities with float 0 are critical, and the critical path joins them from Start to End." },
      { label: "Float", detail: "Float = latest finish − earliest start − duration. It is how long an activity can be delayed without delaying the project; critical activities have float 0. This is total float." },
    ],
  },
  {
    title: "Question Options",
    icon: "⚙️",
    content: [
      { label: "Levels", detail: "Levels are the size of the project: Level 1 has 6–7 activities, Level 2 has 8–9 (some wait for two others) and Level 3 has 10–12 (an arrow that skips a column, and an activity with only 1 or 2 of float)." },
      { label: "Numbers", detail: "Small gives durations from 1 to 9, Medium from 5 to 25. Level 1 starts on Small." },
      { label: "Setting", detail: "Plain gives an unnamed project with times in minutes. In context names a project (a shed, a school play, a website, a kitchen) and uses days or hours." },
      { label: "Not covered", detail: "Dummy activities (activity on arc), free and independent float, cascade (Gantt) charts and resource histograms." },
    ],
  },
];

const SUB_TOOLS = [
  { key: "network", label: "Network from a table" },
  { key: "forward", label: "Forward pass" },
  { key: "full", label: "Full analysis" },
  { key: "float", label: "Float" },
];
const KIND: Record<string, CpaKind> = { network: "cpaNetwork", forward: "cpaForward", full: "cpaFull", float: "cpaFloat" };

function generate(level: number, ctx?: GenerateContext): DecisionProblem {
  const lv = Math.min(3, Math.max(1, level)) as 1 | 2 | 3;
  const kind = KIND[ctx?.subTool ?? "full"] ?? "cpaFull";
  const o = ctx?.options ?? {};
  const { data, prompt, answerText } = generateCpa(lv, kind, {
    size: o.size === "small" ? "small" : o.size === "medium" ? "medium" : undefined,
    setting: o.setting === "context" ? "context" : "plain",
  });
  return {
    network: { nodes: [], edges: [] }, // the picture is the activity network (cpa), not a vertex-and-edge network
    kind, level: lv, cpa: data, prompt,
    answer: { text: answerText, value: data.times.projectTime },
    matrixMode: "off",
  };
}

const solve = (p: DecisionProblem): SolveStep[] => solveCpa(p);

// The precedence table in the exam format: coloured header and borders (site navy), italic activity letters, a dash where nothing comes before.
const TABLE_HEAD = "#1e3a8a";
function PrecedenceTable({ p, compact }: { p: DecisionProblem; compact: boolean }) {
  const acts = p.cpa!.acts;
  const head: React.CSSProperties = { background: TABLE_HEAD, color: "#fff", fontWeight: 700, fontSize: 15, lineHeight: 1.35, padding: "8px 14px", border: `2px solid ${TABLE_HEAD}`, textAlign: "center" };
  const cell: React.CSSProperties = { border: `2px solid ${TABLE_HEAD}`, padding: "3px 14px", textAlign: "center", fontSize: 15, fontFamily: "'Latin Modern Roman', 'Times New Roman', serif", background: "#fff", color: "#0f172a" };
  const letters = (ids: string[]) => ids.map((id, i) => <span key={id}><i>{id}</i>{i < ids.length - 1 ? ", " : ""}</span>);
  return (
    <div style={{ overflow: "auto", maxHeight: compact ? "40%" : "100%", padding: "10px 12px 6px", flexShrink: 0 }}>
      <table style={{ borderCollapse: "collapse", margin: "0 auto" }}>
        <thead>
          <tr>
            <th style={head}>Activity</th>
            <th style={head}>Duration<br />({p.cpa!.unit})</th>
            <th style={head}>Immediate<br />predecessors</th>
          </tr>
        </thead>
        <tbody>
          {acts.map((a) => (
            <tr key={a.id}>
              <td style={cell}><i>{a.id}</i></td>
              <td style={cell}>{a.duration}</td>
              <td style={cell}>{a.preds.length ? letters(a.preds) : "–"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// The picture scrolls sideways on a phone (the boxes keep a readable size), so it follows the box being worked on.
function CpaCanvas({ p, step }: { p: DecisionProblem; step: SolveStep | undefined }) {
  const d = p.cpa!;
  const box = useRef<HTMLDivElement>(null);
  const current = step?.cpaView?.current ?? step?.cpaView?.compare?.[0];
  useEffect(() => {
    const host = box.current, svg = host?.querySelector("svg");
    const b = current ? d.layout.boxes[current] : undefined;
    if (!host || !svg || !b || host.scrollWidth <= host.clientWidth + 2) return;
    const scale = svg.getBoundingClientRect().width / d.layout.width;
    host.scrollTo({ left: Math.max(0, (b.x + b.w / 2) * scale - host.clientWidth / 2), behavior: "smooth" });
  }, [current, d]);
  // what the question gives: the network (with its durations) for the pass questions; the filled-in network for float; nothing but the table to start from
  const questionView = d.kind === "cpaNetwork"
    ? { shown: [] as string[] }
    : d.kind === "cpaFloat"
      ? { es: Object.fromEntries(Object.entries(d.times.es)), lf: Object.fromEntries(Object.entries(d.times.lf)) }
      : { es: { Start: 0 } };
  const view = step?.cpaView ?? questionView;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      {d.kind === "cpaNetwork" && <PrecedenceTable p={p} compact={!!step} />}
      <div ref={box} style={{ flex: 1, minHeight: 0, overflow: "auto", display: "flex" }}>
        <ActivityNodeView acts={d.acts} layout={d.layout} view={view} />
      </div>
    </div>
  );
}

const renderCanvas = (p: DecisionProblem, step: SolveStep | undefined) => <CpaCanvas p={p} step={step} />;

// The colour key and the box key under the picture.
function CpaKey() {
  const item: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#334155", fontWeight: 600, whiteSpace: "nowrap" };
  const swatch = (bg: string, border: string): React.CSSProperties => ({ width: 16, height: 16, borderRadius: 4, background: bg, border: `2px solid ${border}` });
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 18px" }}>
      <span style={item}>box: earliest start | duration | latest finish</span>
      <span style={item}><span style={swatch("#fef3c7", "#d97706")} /> compared</span>
      <span style={item}><span style={swatch("#fff", "#2563eb")} /> working out</span>
      <span style={item}><span style={swatch("#dcfce7", "#16a34a")} /> critical</span>
    </div>
  );
}

export default function App() {
  return (
    <DecisionShell
      generate={generate}
      solve={solve}
      renderCanvas={renderCanvas}
      config={{
        pageTitle: "Critical Path Analysis",
        instruction: "Question",
        levels: 3,
        levelLabels: ["Small projects (6–7 activities)", "Medium projects (8–9 activities)", "Large projects (10–12 activities)"],
        subTools: SUB_TOOLS,
        infoSections: INFO_SECTIONS,
        hideMatrix: true,
        noSandbox: true,
        canvasFooter: <CpaKey />,
        options: [
          {
            key: "size",
            label: "Numbers",
            choices: [
              { value: "default", label: "By level" },
              { value: "small", label: "Small (1 to 9)" },
              { value: "medium", label: "Medium (5 to 25)" },
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

// CI contract surface — checked by src/tests/cpa.test.ts (the shared Decision `__problem` validator is MST/TSP/route-specific).
export const __cpa = { generate, solve };
