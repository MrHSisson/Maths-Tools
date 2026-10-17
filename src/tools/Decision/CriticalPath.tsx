import { useEffect, useRef, useState } from "react";
import {
  DecisionShell,
  ActivityNodeView,
  GanttView,
  HistogramView,
  generateCpa,
  solveCpa,
  type CpaKind,
  type CpaViewState,
  type DecisionProblem,
  type GenerateContext,
  type SolveStep,
} from "../../shared/decision";
import type { InfoSection } from "../../shared";

// ═══════════════════════════════════════════════════════════════════════════
// Critical Path Analysis — Decision Maths (AQA Further Maths, Discrete / Edexcel D1). Activity ON NODE, no dummy activities, total float
// only. One tab per skill (specs/cpa-skill-tools.md, the AS set):
//   Network from a table — draw the activity network (with Start and End) from the precedence table;
//   Table from a network — write the precedence table from a drawn network;
//   Forward pass         — the earliest start of every activity and the minimum completion time;
//   Full analysis        — forward and backward pass, then the critical activities, critical path and minimum time;
//   Float                — the float of every activity, from a network already filled in;
//   Critical paths       — every critical activity and critical path, from a network already filled in;
//   Missing time         — a duration x found from the critical path and the minimum completion time;
//   Delays and changes   — the effect of a delay (against the float) or of shortening a critical activity;
//   Clock times          — a project in minutes with a clock start time: finish time and a latest start time.
// Tabs have their own number of levels (1 or 2): the size of the project (6–7, 8–9 activities) or the harder case of the skill.
// The maths, layout and generator live in shared/decision/cpa.ts, the working in cpaSolve.ts, the picture in ActivityNodeView.
// A-level (the course switch at the top): Cascade chart, Resource histogram and Resource levelling so far; worker allocation and which-to-shorten follow.
//   Resource histogram   — draw the workers-over-time histogram: critical activities along the bottom, the rest stacked with no holes.
//   Resource levelling   — with a limit on the workers, find the minimum completion time and which activities are delayed.
//   Cascade chart        — draw the Gantt chart from the network: critical activities (one row or own rows), floats dashed, early or late starts.
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
      { label: "Table from a network", detail: "The reverse: read the arrows coming into each box. Those activities are its immediate predecessors. Level 2 has an arrow that skips a column, so it is easy to miss." },
      { label: "Forward pass", detail: "Work left to right. An activity's earliest start is the largest of the earliest finishes (start + duration) of the activities before it. End's earliest start is the minimum completion time of the project." },
      { label: "Full analysis", detail: "The forward pass, then the backward pass from End: an activity's latest finish is the smallest of the latest starts (latest finish − duration) of the activities after it. Activities with float 0 are critical, and the critical path joins them from Start to End." },
      { label: "Float", detail: "Float = latest finish − earliest start − duration. It is how long an activity can be delayed without delaying the project; critical activities have float 0. This is total float." },
      { label: "Critical paths", detail: "The network is already filled in. Find the activities with no float, then follow the arrows from Start to End through them. Level 1 has one critical path; Level 2 has more than one, so every one has to be found, and some activities have only a little float and are not critical." },
      { label: "Missing time", detail: "One duration is x. On the critical path: you are told the critical path and the minimum completion time, and the durations along it add up to the minimum completion time, so form an equation and solve it. Not on the critical path (Question Option): find the largest x that leaves the minimum completion time unchanged. That is the activity's latest finish minus its earliest start, so x ≤ that." },
      { label: "Delays and changes", detail: "Level 1: an activity is delayed. If the delay is less than its float, or equal to it, the project time does not change (equal uses up all the float, so the activity becomes critical). If it is more, the project is delayed by the excess. Level 2: a critical activity is made quicker. The time falls by the whole reduction unless another path becomes critical first. The working recalculates the changed boxes one at a time: the earliest starts that change (left to right), the latest finishes that change (right to left), then the new floats." },
      { label: "Cascade chart (A-level)", detail: "Draw a cascade (Gantt) chart from the network: time along the bottom, a bar as long as each activity. The critical activities go end to end; every other activity starts as early (or as late) as possible and its float is shown as a dashed block after it (before it, for late starts). Levels: 8–9 activities, 10–12 activities, then every activity as late as possible." },
      { label: "Resource histogram (A-level)", detail: "Draw a resource histogram: time along the bottom, the number of workers up the side. Each activity is a block as wide as its duration and as high as the workers it needs, every activity starting as early as possible. Put the critical activities along the bottom, stack the rest above them with no gaps (a block never floats over empty space), and label every block. No float is shown. Levels: 8–9 activities with one worker each; 8–9 activities needing 1 to 3 workers; 10–12 activities with one worker each." },
      { label: "Resource levelling (A-level)", detail: "A limit on the workers. The histogram with no limit is shown; find where it goes above the limit, then build it again one activity at a time: an activity starts when everything before it is finished and enough workers are free, so some activities wait. Amber blocks are the delayed ones. Level 1: the delays fit inside the float, so the minimum completion time is unchanged. Level 2: the delays use up the float and the project takes longer (several workers per activity). Level 3: 10–12 activities with two or more delays." },
      { label: "Clock times", detail: "Durations in minutes and a clock time for the start. Work out the minimum completion time, then add it to the start time for the finish. A latest start time is the start time plus the activity's latest start (latest finish − duration)." },
    ],
  },
  {
    title: "Question Options",
    icon: "⚙️",
    content: [
      { label: "Levels", detail: "Network from a table, Forward pass, Full analysis and Float: Level 1 has 6–7 activities, Level 2 has 8–9 (some wait for two others); Forward pass and Full analysis also have Level 3 with 10–12 activities (an arrow that skips a column, and an activity with only 1 or 2 of float). Table from a network: Level 2 adds an arrow that skips a column. Critical paths: one critical path, then more than one. Delays and changes: a delay, then a shortened critical activity. Missing time and Clock times have one level." },
      { label: "Numbers", detail: "Small gives durations from 1 to 9, Medium from 5 to 25. Level 1 starts on Small." },
      { label: "Critical paths", detail: "One: a single critical path (the default). More than one: two or three critical paths, as a chapter question may ask for \u2014 every one must be found, and the working marks each. Either: some questions have one and some several, so the class has to check for others. Available on Full analysis and Float." },
      { label: "Setting", detail: "Plain gives an unnamed project with times in minutes. In context names a project (a shed, a school play, a website, a kitchen) and uses days or hours." },
      { label: "Course", detail: "AS shows the network skills; A-level shows the time-axis charts (cascade chart, resource histogram and resource levelling so far; worker allocation will follow). Switching course moves you to the first tab of the other one." },
      { label: "Critical activities (cascade chart)", detail: "In sequence puts the critical activities end to end on one row (the exam often accepts either); Own rows gives every activity its own row." },
      { label: "Style (cascade chart)", detail: "Blocks draws full-height blocks with the float as a dashed block beside each; Thin bars draws narrow bars with the float as a dashed line." },
      { label: "Not covered", detail: "Dummy activities (activity on arc), free and independent float." },
    ],
  },
];

const AS_ONLY = { key: "course", values: ["as"] };
const A_ONLY = { key: "course", values: ["a"] };
const SUB_TOOLS = [
  { key: "network", label: "Network from a table", levels: 2, when: AS_ONLY },
  { key: "table", label: "Table from a network", levels: 2, when: AS_ONLY },
  { key: "forward", label: "Forward pass", levels: 3, when: AS_ONLY },
  { key: "full", label: "Full analysis", levels: 3, when: AS_ONLY },
  { key: "float", label: "Float", levels: 2, when: AS_ONLY },
  { key: "paths", label: "Critical paths", levels: 2, when: AS_ONLY },
  { key: "unknown", label: "Missing time", levels: 1, when: AS_ONLY },
  { key: "change", label: "Delays and changes", levels: 2, when: AS_ONLY },
  { key: "clock", label: "Clock times", levels: 1, when: AS_ONLY },
  { key: "cascade", label: "Cascade chart", levels: 3, when: A_ONLY },
  { key: "histogram", label: "Resource histogram", levels: 3, when: A_ONLY },
  { key: "level", label: "Resource levelling", levels: 3, when: A_ONLY },
];
const KIND: Record<string, CpaKind> = {
  network: "cpaNetwork", table: "cpaTable", forward: "cpaForward", full: "cpaFull", float: "cpaFloat",
  paths: "cpaPaths", unknown: "cpaUnknown", change: "cpaChange", clock: "cpaContext", cascade: "cpaCascade", histogram: "cpaHistogram", level: "cpaLevel",
};

function generate(level: number, ctx?: GenerateContext): DecisionProblem {
  const sub = ctx?.subTool ?? "full";
  const kind = KIND[sub] ?? "cpaFull";
  const o = ctx?.options ?? {};
  // Forward pass and Full analysis have three levels (6–7, 8–9, 10–12 activities); the Cascade chart has three (8–9, 10–12, then as late as possible); the rest have one or two
  const maxLv = sub === "forward" || sub === "full" || sub === "cascade" || sub === "histogram" || sub === "level" ? 3 : 2;
  const lv = Math.min(maxLv, Math.max(1, level)) as 1 | 2 | 3;
  // Critical paths: Level 1 one path, Level 2 more than one. Missing time and the cascade chart need exactly one.
  const paths = sub === "paths" ? (lv === 1 ? "one" : "more") : sub === "unknown" || sub === "cascade" || sub === "histogram" || sub === "level" ? "one" : o.paths === "more" ? "more" : o.paths === "either" ? "either" : "one";
  const genLevel = sub === "unknown" ? 1 : sub === "clock" ? 2 : sub === "cascade" ? (lv === 1 ? 2 : 3) : sub === "histogram" || sub === "level" ? (lv === 3 ? 3 : 2) : lv;
  const { data, prompt, answerText } = generateCpa(genLevel as 1 | 2 | 3, kind, {
    size: o.size === "small" ? "small" : o.size === "medium" ? "medium" : sub === "clock" || sub === "cascade" || sub === "histogram" || sub === "level" ? "medium" : undefined,
    setting: o.setting === "context" ? "context" : "plain",
    paths,
    skip: sub === "table" && lv === 2,
    workers: lv === 2 ? "several" : "one",
    levelType: lv === 1 ? "within" : lv === 2 ? "extra" : "chain",
    unknownWhere: o.unknownWhere === "off" ? "off" : o.unknownWhere === "either" ? "either" : "on",
    cascade: { start: lv === 3 ? "late" : "early", layout: o.critRow === "rows" ? "rows" : "sequence", style: o.ganttStyle === "bars" ? "bars" : "blocks" },
  });
  return {
    network: { nodes: [], edges: [] }, // the picture is the activity network (cpa), not a vertex-and-edge network
    kind, level: lv, cpa: data, prompt,
    answer: { text: answerText, value: data.times.projectTime },
    matrixMode: "off",
  };
}

const solve = (p: DecisionProblem): SolveStep[] => solveCpa(p);

// Scales its content down (never up) to fit the box it is in — width, and height too when asked — so a table never needs a scrollbar.
function FitBox({ children, fitHeight }: { children: React.ReactNode; fitHeight?: boolean }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [h, setH] = useState(0);
  useEffect(() => {
    const o = outer.current, i = inner.current;
    if (!o || !i) return;
    const fit = () => {
      const w = i.offsetWidth, ht = i.offsetHeight;
      if (!w || !ht) return;
      const s = Math.min(1, o.clientWidth / w, fitHeight && o.clientHeight ? o.clientHeight / ht : 1);
      setScale((c) => (Math.abs(c - s) > 0.005 ? s : c));
      setH((c) => (Math.abs(c - ht * s) > 0.5 ? ht * s : c));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(o); ro.observe(i);
    return () => ro.disconnect();
  });
  return (
    <div ref={outer} style={{ width: "100%", height: fitHeight ? "100%" : h || undefined, display: "flex", justifyContent: "center", alignItems: fitHeight ? "center" : "flex-start", overflow: "hidden" }}>
      <div ref={inner} style={{ transform: `scale(${scale})`, transformOrigin: fitHeight ? "center center" : "center top", flexShrink: 0 }}>{children}</div>
    </div>
  );
}

// The precedence table. As the question it is the exam format: activity, duration, immediate predecessors, one row per activity. While the
// network is drawn it becomes the same table laid across the top (one column per activity), so it stays in view without taking the picture's room.
const TABLE_HEAD = "#1e3a8a";
const serif = "'Latin Modern Roman', 'Times New Roman', serif";
const letters = (ids: string[]) => ids.map((id, i) => <span key={id}><i>{id}</i>{i < ids.length - 1 ? ", " : ""}</span>);

function PrecedenceTable({ p, across, done }: { p: DecisionProblem; across: boolean; done?: Set<string> }) {
  const acts = p.cpa!.acts;
  const unit = p.cpa!.unit;
  const head: React.CSSProperties = { background: TABLE_HEAD, color: "#fff", fontWeight: 700, fontSize: across ? 13 : 15, lineHeight: 1.35, padding: across ? "4px 10px" : "8px 14px", border: `2px solid ${TABLE_HEAD}`, textAlign: "center" };
  const cell: React.CSSProperties = { border: `2px solid ${TABLE_HEAD}`, padding: across ? "3px 10px" : "3px 14px", textAlign: "center", fontSize: across ? 14 : 15, fontFamily: serif, background: "#fff", color: "#0f172a" };
  if (across) {
    return (
      <table style={{ borderCollapse: "collapse" }}>
        <tbody>
          <tr><th style={head}>Activity</th>{acts.map((a) => <td key={a.id} style={cell}><i>{a.id}</i></td>)}</tr>
          <tr><th style={head}>Duration ({unit})</th>{acts.map((a) => <td key={a.id} style={cell}>{a.duration}</td>)}</tr>
          <tr><th style={head}>Immediate predecessors</th>{acts.map((a) => <td key={a.id} style={cell}>{done && !done.has(a.id) ? "\u00a0" : a.preds.length ? letters(a.preds) : "–"}</td>)}</tr>
        </tbody>
      </table>
    );
  }
  return (
    <table style={{ borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={head}>Activity</th>
          <th style={head}>Duration<br />({unit})</th>
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
  );
}

// Workers each activity needs (the histogram questions where they differ), in the same exam-table style as the precedence table.
function WorkersTable({ p }: { p: DecisionProblem }) {
  const acts = p.cpa!.acts;
  const head: React.CSSProperties = { background: TABLE_HEAD, color: "#fff", fontWeight: 700, fontSize: 13, padding: "3px 10px", border: `2px solid ${TABLE_HEAD}`, textAlign: "center" };
  const cell: React.CSSProperties = { border: `2px solid ${TABLE_HEAD}`, padding: "2px 10px", textAlign: "center", fontSize: 14, fontFamily: serif, background: "#fff", color: "#0f172a" };
  return (
    <table style={{ borderCollapse: "collapse" }}>
      <tbody>
        <tr><th style={head}>Activity</th>{acts.map((a) => <td key={a.id} style={cell}><i>{a.id}</i></td>)}</tr>
        <tr><th style={head}>Workers</th>{acts.map((a) => <td key={a.id} style={cell}>{a.workers ?? 1}</td>)}</tr>
      </tbody>
    </table>
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
  // what the question gives: the network (with its durations) for the pass questions; the filled-in network for float, paths and changes; nothing but the table to start from
  const everyEs = Object.fromEntries(Object.entries(d.times.es));
  const everyLf = Object.fromEntries(Object.entries(d.times.lf));
  const everyTimes: CpaViewState = { es: everyEs, lf: everyLf };
  const questionView: CpaViewState =
    d.kind === "cpaNetwork" ? { shown: [] }
      : d.kind === "cpaFloat" || d.kind === "cpaPaths" ? { es: everyEs, lf: everyLf }
        : d.kind === "cpaChange" ? { es: everyEs, lf: everyLf, float: Object.fromEntries(Object.entries(d.times.float).filter(([id]) => id !== "Start" && id !== "End")) }
          : d.kind === "cpaUnknown" ? { durLabels: { [d.extra!.unknown!.id]: "x" } }
            : d.kind === "cpaTable" ? {}
              : { es: { Start: 0 } };
  const view = step?.cpaView ?? questionView;
  // the table IS the question until the network starts to appear
  if (d.kind === "cpaNetwork" && !step) {
    return (
      <div style={{ position: "absolute", inset: 0, padding: 12 }}>
        <FitBox fitHeight><PrecedenceTable p={p} across={false} /></FitBox>
      </div>
    );
  }
  if (d.kind === "cpaCascade") {
    // the network (with its times) above, the cascade chart being drawn below it
    const g = step?.ganttView ?? { bars: [], floats: [] };
    return (
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: 6, padding: "6px 0" }}>
        <div ref={box} style={{ flex: "4 1 0", minHeight: 0, overflow: "auto", display: "flex" }}>
          <ActivityNodeView acts={d.acts} layout={d.layout} view={{ ...everyTimes, ...(step?.cpaView ?? {}) }} />
        </div>
        <div style={{ flex: "7 1 0", minHeight: 0, overflow: "auto", display: "flex", borderTop: "1px solid #e2e8f0" }}>
          <GanttView data={d.extra!.cascade!} view={g} unit={d.unit} />
        </div>
      </div>
    );
  }
  if (d.kind === "cpaLevel") {
    const lv = d.extra!.level!;
    const g = step?.histView ?? { blocks: lv.before.blocks.map((b) => b.id), which: "before" as const, showLimit: true, showOver: true };
    const data = g.which === "after" ? lv.after : lv.before;
    const several = d.acts.some((a) => (a.workers ?? 1) > 1);
    return (
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: 6, padding: "6px 0" }}>
        <div ref={box} style={{ flex: "5 1 0", minHeight: 0, overflow: "auto", display: "flex" }}>
          <ActivityNodeView acts={d.acts} layout={d.layout} view={{ ...everyTimes, ...(step?.cpaView ?? {}) }} />
        </div>
        {several && <div style={{ flexShrink: 0, padding: "0 12px" }}><FitBox><WorkersTable p={p} /></FitBox></div>}
        <div style={{ flex: "6 1 0", minHeight: 0, overflow: "auto", display: "flex", borderTop: "1px solid #e2e8f0" }}>
          <HistogramView data={data} view={g} unit={d.unit} limit={g.showLimit ? lv.limit : undefined} over={g.showOver ? lv.over : undefined} axisT={Math.max(lv.before.T, lv.after.T)} />
        </div>
      </div>
    );
  }
  if (d.kind === "cpaHistogram") {
    // the network (with its times) above, the workers each activity needs when they differ, and the histogram being drawn
    const g = step?.histView ?? { blocks: [] };
    const several = d.acts.some((a) => (a.workers ?? 1) > 1);
    return (
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: 6, padding: "6px 0" }}>
        <div ref={box} style={{ flex: "5 1 0", minHeight: 0, overflow: "auto", display: "flex" }}>
          <ActivityNodeView acts={d.acts} layout={d.layout} view={{ ...everyTimes, ...(step?.cpaView ?? {}) }} />
        </div>
        {several && <div style={{ flexShrink: 0, padding: "0 12px" }}><FitBox><WorkersTable p={p} /></FitBox></div>}
        <div style={{ flex: "6 1 0", minHeight: 0, overflow: "auto", display: "flex", borderTop: "1px solid #e2e8f0" }}>
          <HistogramView data={d.extra!.histogram!} view={g} unit={d.unit} />
        </div>
      </div>
    );
  }
  const tableAbove = d.kind === "cpaNetwork" || d.kind === "cpaTable";
  const tableDone = d.kind === "cpaTable" ? new Set(view.tableDone ?? []) : undefined;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      {tableAbove && <div style={{ padding: "10px 12px 4px 52px", flexShrink: 0 }}><FitBox><PrecedenceTable p={p} across done={tableDone} /></FitBox></div>}
      <div ref={box} style={{ flex: 1, minHeight: 0, overflow: "auto", display: "flex" }}>
        <ActivityNodeView acts={d.acts} layout={d.layout} view={view} />
      </div>
    </div>
  );
}

const renderCanvas = (p: DecisionProblem, step: SolveStep | undefined) => <CpaCanvas p={p} step={step} />;

// The colour key and the box key under the picture.
function CpaKey({ p }: { p?: DecisionProblem }) {
  const item: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#334155", fontWeight: 600, whiteSpace: "nowrap" };
  const swatch = (bg: string, border: string, dashed = false): React.CSSProperties => ({ width: 16, height: 16, borderRadius: 4, background: bg, border: `2px ${dashed ? "dashed" : "solid"} ${border}` });
  const cascade = p?.cpa?.kind === "cpaCascade";
  const histogram = p?.cpa?.kind === "cpaHistogram";
  const levelling = p?.cpa?.kind === "cpaLevel";
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 18px" }}>
      <span style={item}>box: earliest start | duration | latest finish</span>
      {levelling ? (
        <>
          <span style={item}><span style={swatch("#bae6fd", "#1e3a8a")} /> activity</span>
          <span style={item}><span style={swatch("#fde68a", "#d97706")} /> delayed</span>
          <span style={item}><span style={swatch("#fecaca", "#dc2626", true)} /> over the limit</span>
        </>
      ) : histogram ? (
        <>
          <span style={item}><span style={swatch("#bbf7d0", "#16a34a")} /> critical</span>
          <span style={item}><span style={swatch("#bae6fd", "#1e3a8a")} /> other activity</span>
          <span style={item}>block: width = duration, height = workers</span>
        </>
      ) : cascade ? (
        <>
          <span style={item}><span style={swatch("#bbf7d0", "#16a34a")} /> critical</span>
          <span style={item}><span style={swatch("#bae6fd", "#1e3a8a")} /> other activity</span>
          <span style={item}><span style={swatch("transparent", "#7c3aed", true)} /> float</span>
        </>
      ) : (
        <>
          <span style={item}><span style={swatch("#fef3c7", "#d97706")} /> compared</span>
          <span style={item}><span style={swatch("#fff", "#2563eb")} /> working out</span>
          <span style={item}><span style={swatch("#dcfce7", "#16a34a")} /> critical</span>
        </>
      )}
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
        levels: 3, // the most any tab can have; each tab sets its own `levels` (1–3) in SUB_TOOLS
        levelLabels: {
          default: ["Small projects (6–7 activities)", "Medium projects (8–9 activities)"],
          forward: ["Small projects (6–7 activities)", "Medium projects (8–9 activities)", "Large projects (10–12 activities)"],
          full: ["Small projects (6–7 activities)", "Medium projects (8–9 activities)", "Large projects (10–12 activities)"],
          level: ["The delays fit inside the float (8–9 activities)", "The project takes longer (8–9 activities, several workers each)", "Two or more delays (10–12 activities)"],
          histogram: ["8–9 activities, one worker each", "8–9 activities, several workers each", "10–12 activities, one worker each"],
          cascade: ["8–9 activities, as early as possible", "10–12 activities, as early as possible", "10–12 activities, as late as possible"],
          table: ["No arrow skips a column", "An arrow skips a column"],
          paths: ["One critical path", "More than one critical path"],
          change: ["A delay compared with the float", "A critical activity made quicker"],
        },
        subTools: SUB_TOOLS,
        infoSections: INFO_SECTIONS,
        hideMatrix: true,
        noSandbox: true,
        canvasFooter: (p: DecisionProblem) => <CpaKey p={p} />,
        options: [
          {
            key: "course",
            label: "Course",
            top: true,
            defaultFor: () => "as",
            choices: [
              { value: "as", label: "AS" },
              { value: "a", label: "A-level" },
            ],
          },
          {
            key: "unknownWhere",
            label: "Where is x",
            forSubTools: ["unknown"],
            choices: [
              { value: "on", label: "On the critical path" },
              { value: "off", label: "Not on it (x ≤ …)" },
              { value: "either", label: "Either" },
            ],
          },
          {
            key: "critRow",
            label: "Critical activities",
            forSubTools: ["cascade"],
            choices: [
              { value: "sequence", label: "In sequence (one row)" },
              { value: "rows", label: "Own rows" },
            ],
          },
          {
            key: "ganttStyle",
            label: "Style",
            forSubTools: ["cascade"],
            choices: [
              { value: "blocks", label: "Blocks" },
              { value: "bars", label: "Thin bars" },
            ],
          },
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
            key: "paths",
            label: "Critical paths",
            forSubTools: ["full", "float"],
            choices: [
              { value: "one", label: "One" },
              { value: "more", label: "More than one" },
              { value: "either", label: "Either" },
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
