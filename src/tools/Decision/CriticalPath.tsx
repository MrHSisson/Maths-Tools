import { useEffect, useRef, useState } from "react";

import {
  DecisionShell,
  ActivityNodeView,
  GanttView,
  HistogramView,
  generateCpa,
  generateCpaExam,
  type CpaChain,
  solveCpa,
  type CpaKind,
  type CpaViewState,
  type DecisionProblem,
  type GenerateContext,
  type SolveStep,
} from "../../shared/decision";
import CpaTileArt from "../../shared/decision/CpaTileArt";

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
// A-level (the course switch at the top): Cascade chart, Resource histogram, Resource levelling, Worker allocation and Which to shorten.
//   Resource histogram   — draw the workers-over-time histogram: critical activities along the bottom, the rest stacked with no holes.
//   Resource levelling   — with a limit on the workers, find the minimum completion time and which activities are delayed.
//   Worker allocation    — one worker each: the smallest team for the minimum time, or the time with a fixed team, and who does what.
//   Which to shorten     — one activity can be reduced to 1: which gives the smallest minimum completion time, and why.
//   Explain and justify  — (AS) explain the effect of a change, or comment on a claim; (A-level, "Limits of the model") a limitation and its effect. Marked against mark points.
//   Cascade chart        — draw the Gantt chart from the network: critical activities (one row or own rows), floats dashed, early or late starts.
// ═══════════════════════════════════════════════════════════════════════════

const AS_ONLY = { key: "course", values: ["as"] };
const A_ONLY = { key: "course", values: ["a"] };
const SKILLS = { key: "practice", values: ["skills"] };
const EXAM = { key: "practice", values: ["exam"] };
const SUB_TOOLS = [
  { key: "network", label: "Network from a table", levels: 2, blurb: "Draw the network from a precedence table", when: [AS_ONLY, SKILLS] },
  { key: "table", label: "Table from a network", levels: 2, blurb: "Read the precedence table off a network", when: [AS_ONLY, SKILLS] },
  { key: "forward", label: "Forward pass", levels: 3, blurb: "Earliest start times and the minimum time", when: [AS_ONLY, SKILLS] },
  { key: "full", label: "Full analysis", levels: 3, blurb: "Forward and backward pass, critical path", when: [AS_ONLY, SKILLS] },
  { key: "floatPaths", label: "Float and critical paths", levels: 2, blurb: "Float, every critical path, which starts first", when: [AS_ONLY, SKILLS] },
  { key: "unknown", label: "Missing time", levels: 2, blurb: "Find a missing time or box value", when: [AS_ONLY, SKILLS] },
  { key: "change", label: "Delays and changes", levels: 3, blurb: "A delay, a quicker or removed activity", when: [AS_ONLY, SKILLS] },
  { key: "reason", label: "Explain and justify", levels: 2, blurb: "Explain a change, judge a claim", when: [AS_ONLY, SKILLS] },
  { key: "cascade", label: "Cascade/Gantt chart", levels: 3, blurb: "Draw the chart, floats dashed", when: [A_ONLY, SKILLS] },
  { key: "histogram", label: "Resource histogram", levels: 3, blurb: "Workers needed over time", when: [A_ONLY, SKILLS] },
  { key: "level", label: "Resource levelling", levels: 3, blurb: "A limit on the workers: the new time", when: [A_ONLY, SKILLS] },
  { key: "alloc", label: "Worker allocation *", levels: 3, blurb: "Who does which activity (legacy spec only)", when: [A_ONLY, SKILLS] },
  { key: "shorten", label: "Which to shorten", levels: 3, blurb: "Which one activity to reduce", when: [A_ONLY, SKILLS] },
  { key: "reasonA", label: "Limits of the model", levels: 1, blurb: "A limitation of the model and its effect", when: [A_ONLY, SKILLS] },
  // exam-style questions: one network, then a chain of lettered parts with marks (specs/cpa-exam-questions.md)
  { key: "exAsAny", label: "Any AS exam question", levels: 2, blurb: "A mixed multi-part AS question", when: [AS_ONLY, EXAM] },
  { key: "exBuild", label: "Network, then a change or a claim", levels: 2, blurb: "Table to network, then a change or a claim", when: [AS_ONLY, EXAM] },
  { key: "exClaim", label: "Times and Glyn's claim", levels: 2, blurb: "Times, critical activities, Glyn's claim", when: [AS_ONLY, EXAM] },
  { key: "exChange", label: "Effect of a change", levels: 2, blurb: "A completed network and the effect of a change", when: [AS_ONLY, EXAM] },
  { key: "exClock", label: "Clock times and a second project", levels: 2, blurb: "Table, times, clock finish, second project", when: [AS_ONLY, EXAM] },
  { key: "exAlAny", label: "Any A-level exam question", levels: 2, blurb: "A mixed multi-part A-level question", when: [A_ONLY, EXAM] },
  { key: "exCascade", label: "Times and a cascade/Gantt chart", levels: 2, blurb: "Times, a cascade chart, removing an activity", when: [A_ONLY, EXAM] },
  { key: "exTable", label: "Table, histogram and levelling", levels: 2, blurb: "Table, histogram and a worker limit", when: [A_ONLY, EXAM] },
  { key: "exHist", label: "Histogram and levelling", levels: 2, blurb: "Histogram, then levelling with a limit", when: [A_ONLY, EXAM] },
  { key: "exShorten", label: "Which to shorten and a limitation", levels: 2, blurb: "Which to reduce, and a limitation", when: [A_ONLY, EXAM] },
  { key: "exAlloc", label: "Levelling and worker allocation *", levels: 2, blurb: "Levelling, then who does what (legacy spec only)", when: [A_ONLY, EXAM] },
];
const EXAM_CHAIN: Record<string, CpaChain | "asAny" | "alAny"> = {
  exAsAny: "asAny", exBuild: "asBuild", exClaim: "asClaim", exChange: "asChange", exClock: "asClock",
  exAlAny: "alAny", exCascade: "alCascade", exTable: "alTable", exHist: "alHist", exShorten: "alShorten", exAlloc: "alAlloc",
};
const KIND: Record<string, CpaKind> = {
  network: "cpaNetwork", table: "cpaTable", forward: "cpaForward", full: "cpaFull", floatPaths: "cpaFloat",
  unknown: "cpaUnknown", change: "cpaChange", cascade: "cpaCascade", histogram: "cpaHistogram", level: "cpaLevel", alloc: "cpaAlloc", shorten: "cpaShorten", reason: "cpaReason", reasonA: "cpaReason",
};

// The numbers each level starts on (the Numbers option follows this until the teacher ticks something else): the first level of a skill uses small durations, the rest medium
const CHART_SUBS = new Set(["cascade", "histogram", "level", "alloc", "shorten", "reason", "reasonA"]);
function sizeDefault(level: number, sub?: string): string {
  if (sub && EXAM_CHAIN[sub]) return sub.startsWith("exAs") || ["exBuild", "exClaim", "exChange", "exClock"].includes(sub) ? (level === 1 ? "small" : "medium") : "medium";
  if (sub && CHART_SUBS.has(sub)) return "medium";
  return level === 1 ? "small" : "medium";
}
/** one of the ticked choices of a multi option, at random */
const pickOf = (v: string | undefined, fallback: string): string => { const xs = (v || fallback).split(",").filter(Boolean); return xs[Math.floor(Math.random() * xs.length)] ?? fallback; };

function generate(level: number, ctx?: GenerateContext): DecisionProblem {
  const sub = ctx?.subTool ?? "full";
  const o = ctx?.options ?? {};
  // every multi option arrives as a comma list of what is ticked; each question draws one of them
  const size = pickOf(o.size, "") === "small" ? "small" : pickOf(o.size, "") === "medium" ? "medium" : undefined;
  if (EXAM_CHAIN[sub]) return generateCpaExam(level, EXAM_CHAIN[sub], { size, setting: "context" });
  // Float and critical paths is one tab with three kinds of question; Forward pass can ask for a clock finish time
  const floatQ = sub === "floatPaths" ? pickOf(o.floatQ, "float") : "";
  const clockQ = sub === "forward" && pickOf(o.clockQ, "minutes") === "clock";
  const kind: CpaKind = clockQ ? "cpaContext" : sub === "floatPaths" ? (floatQ === "float" ? "cpaFloat" : "cpaPaths") : KIND[sub] ?? "cpaFull";
  // Forward pass and Full analysis have three levels (6–7, 8–9, 10–12 activities); the Cascade chart has three (8–9, 10–12, then as late as possible); the rest have one or two
  const maxLv = sub === "forward" || sub === "full" || sub === "cascade" || sub === "histogram" || sub === "level" || sub === "alloc" || sub === "shorten" ? 3 : 2;
  const lv = Math.min(maxLv, Math.max(1, level)) as 1 | 2 | 3;
  const reasonCase = sub === "reasonA" ? "limit" : (pickOf(o.reasonForm, lv === 1 ? "range" : "claim") as "range" | "remove" | "claim" | "glyn");
  const picked = pickOf(o.paths, "one") === "more" ? "more" : "one";
  // the question that names its own critical paths fixes the count: "which must start first" and the missing time have exactly one
  const paths = sub === "reason" && reasonCase === "glyn" ? "more" : sub === "shorten" ? (lv === 2 ? "more" : "one") : sub === "unknown" || floatQ === "first" ? "one" : picked;
  const genLevel = clockQ ? 2 : sub === "reason" || sub === "reasonA" ? 2 : sub === "unknown" ? (lv === 2 ? 2 : 1) : sub === "cascade" ? (pickOf(o.actCount, lv === 1 ? "n89" : "n1012") === "n89" ? 2 : 3) : sub === "histogram" ? (lv >= 2 ? 3 : 2) : sub === "level" || sub === "alloc" || sub === "shorten" ? (lv === 3 ? 3 : 2) : lv;
  const workers = pickOf(o.workersEach, sub === "histogram" ? (lv === 3 ? "several" : "one") : lv === 2 ? "several" : "one") === "several" ? "several" : "one";
  const blocks = pickOf(o.histBlocks, "whole,jump") === "whole" ? "whole" : "jump";
  const { data, prompt, answerText } = generateCpa(genLevel as 1 | 2 | 3, kind, {
    size: size ?? (clockQ || CHART_SUBS.has(sub) ? "medium" : undefined),
    setting: "context",
    paths,
    levelRef: "cascade",
    levelAsk: "time",
    reasonCase,
    pathsAsk: floatQ === "first" ? "first" : "paths",
    clockSecond: false,
    skip: sub === "table" && lv === 2,
    workers,
    changeCase: lv === 1 ? "delay" : lv === 2 ? "shorten" : Math.random() < 0.5 ? "range" : "remove",
    changeAsk: pickOf(o.changeAsk, "time") === "boxes" ? "boxes" : "time",
    shortenCase: lv === 1 ? "simple" : lv === 2 ? "two" : "trap",
    allocKind: pickOf(o.allocKind, lv === 1 ? "min" : "fixed") === "min" ? "min" : "fixed",
    histShape: blocks,
    histStart: pickOf(o.histStart, "early") === "late" ? "late" : "early",
    partial: sub === "cascade" && lv !== 2 && pickOf(o.chartGiven, "blank") === "partial",
    cascadePasses: sub === "cascade" && lv === 2,
    levelType: lv === 1 ? "within" : lv === 2 ? "extra" : "chain",
    unknownBox: sub === "unknown" && lv === 2,
    unknownChoice: false,
    unknownWhere: pickOf(o.unknownWhere, "on") === "off" ? "off" : "on",
    cascade: { start: lv === 3 ? "late" : "early", layout: pickOf(o.critRow, "sequence") === "rows" ? "rows" : "sequence", style: pickOf(o.ganttStyle, "blocks") === "bars" ? "bars" : "blocks" },
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

// Resource levelling with floats: each activity's duration, earliest start, latest finish, float and workers
function FloatTable({ p, current }: { p: DecisionProblem; current?: string }) {
  const d = p.cpa!;
  const several = d.acts.some((a) => (a.workers ?? 1) > 1);
  const head: React.CSSProperties = { background: TABLE_HEAD, color: "#fff", fontWeight: 700, fontSize: 13, padding: "3px 10px", border: `2px solid ${TABLE_HEAD}`, textAlign: "center" };
  const cell = (on: boolean): React.CSSProperties => ({ border: `2px solid ${TABLE_HEAD}`, padding: "2px 10px", textAlign: "center", fontSize: 14, fontFamily: serif, background: on ? "#dbeafe" : "#fff", color: "#0f172a" });
  const rows: Array<[string, (id: string) => number | string]> = [
    ["Duration", (id) => d.acts.find((a) => a.id === id)!.duration],
    ["Earliest start", (id) => d.times.es[id]],
    ["Latest finish", (id) => d.times.lf[id]],
    ["Float", (id) => d.times.float[id]],
    ...(several ? [["Workers", (id: string) => d.acts.find((a) => a.id === id)!.workers ?? 1] as [string, (id: string) => number]] : []),
  ];
  return (
    <table style={{ borderCollapse: "collapse" }}>
      <tbody>
        <tr><th style={head}>Activity</th>{d.acts.map((a) => <td key={a.id} style={cell(current === a.id)}><i>{a.id}</i></td>)}</tr>
        {rows.map(([label, f]) => <tr key={label}><th style={head}>{label}</th>{d.acts.map((a) => <td key={a.id} style={cell(current === a.id)}>{f(a.id)}</td>)}</tr>)}
      </tbody>
    </table>
  );
}

// The picture scrolls sideways on a phone (the boxes keep a readable size), so it follows the box being worked on.
function CpaCanvas({ p, step }: { p: DecisionProblem; step: SolveStep | undefined }) {
  const d = p.cpa!;
  const box = useRef<HTMLDivElement>(null);
  const [refIdx, setRefIdx] = useState(0); // resource levelling: which of the reference pictures (network, cascade chart, floats) is showing
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
  const passesFirst = d.kind === "cpaCascade" && !!d.extra!.cascade?.passes; // the times are for the student to find
  const questionView: CpaViewState =
    d.kind === "cpaNetwork" ? { shown: [] }
      : d.kind === "cpaFloat" || d.kind === "cpaPaths" ? { es: everyEs, lf: everyLf }
        : d.kind === "cpaShorten" ? { es: everyEs, lf: everyLf }
        : d.kind === "cpaChange" ? { es: everyEs, lf: everyLf, float: Object.fromEntries(Object.entries(d.times.float).filter(([id]) => id !== "Start" && id !== "End")) }
          : d.kind === "cpaUnknown" && d.extra!.unknown!.box
            ? (() => {
              const b = d.extra!.unknown!.box!;
              const es2 = { ...everyEs }, lf2 = { ...everyLf };
              if (b.cell === "es") delete es2[b.id]; else delete lf2[b.id];
              return { es: es2, lf: lf2, ...(b.cell === "es" ? { esLabels: { [b.id]: "x" } } : { lfLabels: { [b.id]: "x" } }) } as CpaViewState;
            })()
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
    const cg = d.extra!.cascade!;
    const g = step?.ganttView ?? { bars: cg.given ?? [], floats: (cg.given ?? []).filter((id) => d.times.float[id] > 0) };
    return (
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: 6, padding: "6px 0" }}>
        <div ref={box} style={{ flex: "4 1 0", minHeight: 0, overflow: "auto", display: "flex" }}>
          <ActivityNodeView acts={d.acts} layout={d.layout} view={step?.cpaView ? { ...everyTimes, ...step.cpaView } : passesFirst ? { es: { Start: 0 } } : everyTimes} />
        </div>
        <div style={{ flex: "7 1 0", minHeight: 0, overflow: "auto", display: "flex", borderTop: "1px solid #e2e8f0" }}>
          <GanttView data={d.extra!.cascade!} view={g} unit={d.unit} />
        </div>
      </div>
    );
  }
  if (d.kind === "cpaShorten") {
    const sh = d.extra!.shorten!;
    const done = new Set(view.shortenDone ?? []);
    const critIds = sh.results.filter((r) => r.critical).map((r) => r.id);
    const head: React.CSSProperties = { background: TABLE_HEAD, color: "#fff", fontWeight: 700, fontSize: 13, padding: "3px 10px", border: `2px solid ${TABLE_HEAD}`, textAlign: "center" };
    const cell: React.CSSProperties = { border: `2px solid ${TABLE_HEAD}`, padding: "2px 10px", textAlign: "center", fontSize: 14, fontFamily: serif, background: "#fff", color: "#0f172a", minWidth: 28 };
    return (
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: 6, padding: "6px 0" }}>
        <div ref={box} style={{ flex: "1 1 0", minHeight: 0, overflow: "auto", display: "flex" }}>
          <ActivityNodeView acts={d.acts} layout={d.layout} view={view} />
        </div>
        {step && (
          <div style={{ flexShrink: 0, padding: "0 12px 4px" }}>
            <FitBox>
              <table style={{ borderCollapse: "collapse" }}>
                <tbody>
                  <tr><th style={head}>Reduce</th>{critIds.map((id) => <td key={id} style={{ ...cell, fontStyle: "italic" }}>{id}</td>)}</tr>
                  <tr><th style={head}>New minimum time</th>{sh.results.filter((r) => r.critical).map((r) => <td key={r.id} style={{ ...cell, fontWeight: r.id === sh.best && step.cpaView?.shortenDone?.length === critIds.length && done.has(r.id) && step.phase === "Conclusion" ? 700 : 400 }}>{done.has(r.id) ? r.newTime : "\u00a0"}</td>)}</tr>
                </tbody>
              </table>
            </FitBox>
          </div>
        )}
      </div>
    );
  }
  if (d.kind === "cpaAlloc") {
    // the network above, a row for each worker below (empty to start, then each activity on its worker's row)
    const al = d.extra!.alloc!;
    const g = step?.ganttView ?? { bars: [], floats: [] };
    return (
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: 6, padding: "6px 0" }}>
        <div ref={box} style={{ flex: "5 1 0", minHeight: 0, overflow: "auto", display: "flex" }}>
          <ActivityNodeView acts={d.acts} layout={d.layout} view={{ ...everyTimes, ...(step?.cpaView ?? {}) }} />
        </div>
        <div style={{ flex: "5 1 0", minHeight: 0, overflow: "auto", display: "flex", borderTop: "1px solid #e2e8f0" }}>
          <GanttView data={al.chart} view={g} unit={d.unit} />
        </div>
      </div>
    );
  }
  if (d.kind === "cpaLevel") {
    const lv = d.extra!.level!;
    if (lv.choices) {
      // three options side by side, the one being checked outlined
      const g2 = step?.histView;
      const axis = Math.max(...lv.choices.map((c) => c.data.T));
      return (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: 6, padding: "6px 0" }}>
          <div ref={box} style={{ flex: "4 1 0", minHeight: 0, overflow: "auto", display: "flex" }}>
            <ActivityNodeView acts={d.acts} layout={d.layout} view={{ ...everyTimes, ...(step?.cpaView ?? {}) }} />
          </div>
          {d.acts.some((a) => (a.workers ?? 1) > 1) && <div style={{ flexShrink: 0, padding: "0 12px" }}><FitBox><WorkersTable p={p} /></FitBox></div>}
          <div style={{ flex: "5 1 0", minHeight: 0, display: "flex", gap: 8, overflow: "auto", borderTop: "1px solid #e2e8f0", padding: "4px 8px" }}>
            {lv.choices.map((c, i) => (
              <div key={c.label} style={{ flex: "1 0 340px", minWidth: 340, border: g2?.option === i ? "2px solid #2563eb" : "1px solid #e2e8f0", borderRadius: 10, padding: 4, display: "flex", flexDirection: "column" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1e3a8a", padding: "0 4px" }}>Option {c.label}</div>
                <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
                  <HistogramView data={c.data} view={{ blocks: c.data.blocks.map((b) => b.id) }} unit={d.unit} limit={lv.limit} axisT={axis} minWidth={0} />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    const g = step?.histView ?? { blocks: lv.before.blocks.map((b) => b.id), which: "before" as const, showLimit: true, showOver: true };
    const data = g.which === "after" ? lv.after : lv.before;
    const several = d.acts.some((a) => (a.workers ?? 1) > 1);
    const axis = Math.max(lv.before.T, lv.after.T);
    // what the histogram is read against is one picture at a time, switched with < and > — the network, the cascade chart (floats dashed, on the same time axis) and
    // the table of floats — so each gets the whole height and the width it needs; the histogram being built stays in view below
    const cas = d.extra!.cascade;
    const panels: Array<{ title: string; width: string; body: React.ReactNode; ref?: boolean }> = [
      { title: "Network", width: "min(92%, 900px)", ref: true, body: <ActivityNodeView acts={d.acts} layout={d.layout} view={{ ...everyTimes, ...(step?.cpaView ?? {}) }} /> },
      ...(cas ? [{ title: "Cascade chart", width: "min(92%, 900px)", body: <GanttView data={cas} view={step?.ganttView ?? { bars: d.acts.map((a) => a.id), floats: d.acts.filter((a) => d.times.float[a.id] > 0).map((a) => a.id) }} unit={d.unit} axisT={axis} /> }] : []),
      { title: several ? "Floats and workers" : "Floats", width: "auto", body: <div style={{ margin: "auto", padding: "0 12px" }}><FitBox><FloatTable p={p} current={step?.cpaView?.current} /></FitBox></div> },
    ];
    const cur = Math.min(refIdx, panels.length - 1);
    return (
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: 6, padding: "6px 0" }}>
        <div style={{ flex: "6 1 0", minHeight: 0, display: "flex", flexDirection: "column", margin: "0 8px", border: "1px solid #e2e8f0", borderRadius: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px 0 56px" }}>
            <button onClick={() => setRefIdx((refIdx - 1 + panels.length) % panels.length)} aria-label="Previous picture" title="Previous picture" style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", color: "#1e3a8a", fontWeight: 800, fontSize: 16, lineHeight: 1 }}>‹</button>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#64748b", minWidth: 150, textAlign: "center" }}>{panels[cur].title} <span style={{ color: "#94a3b8" }}>· {cur + 1} of {panels.length}</span></div>
            <button onClick={() => setRefIdx((refIdx + 1) % panels.length)} aria-label="Next picture" title="Next picture" style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", color: "#1e3a8a", fontWeight: 800, fontSize: 16, lineHeight: 1 }}>›</button>
          </div>
          <div ref={panels[cur].ref ? box : undefined} style={{ flex: 1, minHeight: 0, overflow: "auto", display: "flex" }}>{panels[cur].body}</div>
        </div>
        <div style={{ flex: "5 1 0", minHeight: 0, overflow: "auto", display: "flex", borderTop: "1px solid #e2e8f0" }}>
          <HistogramView data={data} view={g} unit={d.unit} limit={g.showLimit ? lv.limit : undefined} over={g.showOver ? lv.over : undefined} axisT={axis} />
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

// The pinned picture of an exam-style question: the network (and the table or workers the question gives), then whichever chart the open part uses.
function ExamCanvas({ p, step }: { p: DecisionProblem; step: SolveStep | undefined }) {
  const d = p.cpa!;
  const x = d.extra!.examQ!;
  const chart = step ? step.examChart : x.chart;
  const view = step?.cpaView ?? x.view;
  if (!step && x.table === "full") {
    return (
      <div style={{ position: "absolute", inset: 0, padding: 12 }}>
        <FitBox fitHeight><PrecedenceTable p={p} across={false} /></FitBox>
      </div>
    );
  }
  const net = <div style={{ flex: chart ? "4 1 0" : "1 1 0", minHeight: 0, overflow: "auto", display: "flex" }}><ActivityNodeView acts={d.acts} layout={d.layout} view={view} /></div>;
  const workers = x.workers && d.acts.some((a) => (a.workers ?? 1) > 1) ? <div style={{ flexShrink: 0, padding: "0 12px" }}><FitBox><WorkersTable p={p} /></FitBox></div> : null;
  const box = (child: React.ReactNode) => <div style={{ flex: "5 1 0", minHeight: 0, overflow: "auto", display: "flex", borderTop: "1px solid #e2e8f0" }}>{child}</div>;
  let lower: React.ReactNode = null;
  const ex = d.extra!;
  if (chart === "cascade" && ex.cascade) lower = box(<GanttView data={ex.cascade} view={step?.ganttView ?? { bars: [], floats: [] }} unit={d.unit} />);
  else if (chart === "alloc" && ex.alloc) lower = box(<GanttView data={ex.alloc.chart} view={step?.ganttView ?? { bars: [], floats: [] }} unit={d.unit} />);
  else if (chart === "histogram" && ex.histogram) lower = box(<HistogramView data={ex.histogram} view={step?.histView ?? { blocks: [] }} unit={d.unit} />);
  else if (chart === "level" && ex.level) {
    const lv = ex.level;
    const g = step?.histView ?? { blocks: [], which: "after" as const, showLimit: true };
    lower = box(<HistogramView data={g.which === "before" ? lv.before : lv.after} view={g} unit={d.unit} limit={g.showLimit ? lv.limit : undefined} over={g.showOver ? lv.over : undefined} axisT={Math.max(lv.before.T, lv.after.T)} />);
  } else if (chart === "choose" && ex.level?.choices) {
    const lv = ex.level;
    const axis = Math.max(...lv.choices!.map((c) => c.data.T));
    lower = (
      <div style={{ flex: "5 1 0", minHeight: 0, display: "flex", gap: 8, overflow: "auto", borderTop: "1px solid #e2e8f0", padding: "4px 8px" }}>
        {lv.choices!.map((c, i) => (
          <div key={c.label} style={{ flex: "1 0 340px", minWidth: 340, border: step?.histView?.option === i ? "2px solid #16a34a" : "1px solid #e2e8f0", borderRadius: 10, padding: 4, display: "flex", flexDirection: "column" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1e3a8a", padding: "0 4px" }}>Option {c.label}</div>
            <div style={{ flex: 1, minHeight: 0, display: "flex" }}><HistogramView data={c.data} view={{ blocks: c.data.blocks.map((b) => b.id) }} unit={d.unit} limit={lv.limit} axisT={axis} minWidth={0} /></div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: 6, padding: "6px 0" }}>
      {x.table && step && <div style={{ padding: "4px 12px 0 52px", flexShrink: 0 }}><FitBox><PrecedenceTable p={p} across /></FitBox></div>}
      {net}{workers}{lower}
    </div>
  );
}

const renderCanvas = (p: DecisionProblem, step: SolveStep | undefined) => (p.cpa?.kind === "cpaExam" ? <ExamCanvas p={p} step={step} /> : <CpaCanvas p={p} step={step} />);

// The colour key and the box key under the picture.
function CpaKey({ p }: { p?: DecisionProblem }) {
  const item: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#334155", fontWeight: 600, whiteSpace: "nowrap" };
  const swatch = (bg: string, border: string, dashed = false): React.CSSProperties => ({ width: 16, height: 16, borderRadius: 4, background: bg, border: `2px ${dashed ? "dashed" : "solid"} ${border}` });
  const cascade = p?.cpa?.kind === "cpaCascade";
  const histogram = p?.cpa?.kind === "cpaHistogram";
  const levelling = p?.cpa?.kind === "cpaLevel";
  const alloc = p?.cpa?.kind === "cpaAlloc";
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 18px" }}>
      <span style={item}>box: earliest start | duration | latest finish</span>
      {alloc ? (
        <>
          <span style={item}><span style={swatch("#bbf7d0", "#16a34a")} /> critical</span>
          <span style={item}><span style={swatch("#bae6fd", "#1e3a8a")} /> other activity</span>
          <span style={item}>one row per worker</span>
        </>
      ) : levelling ? (
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
        purpose: "Plan a project: draw the activity network, find the earliest and latest times, the critical path and the float, and schedule workers.",
        instruction: "Question",
        levels: 3, // the most any tab can have; each tab sets its own `levels` (1–3) in SUB_TOOLS
        printTemplates: true,
        levelInfo: true,
        levelLabels: {
          ...Object.fromEntries(Object.keys(EXAM_CHAIN).map((k) => [k, ["Smaller networks (8–9 activities)", "Larger networks (10–12 activities)"]])),
          default: ["Small projects (6–7 activities)", "Medium projects (8–9 activities)"],
          forward: ["Small projects (6–7 activities)", "Medium projects (8–9 activities)", "Large projects (10–12 activities)"],
          full: ["Small projects (6–7 activities)", "Medium projects (8–9 activities)", "Large projects (10–12 activities)"],
          level: ["The delays fit inside the float (8–9 activities)", "The project takes longer (8–9 activities, several workers each)", "Two or more delays (10–12 activities)"],
          histogram: ["8–9 activities, one worker each", "10–12 activities, one worker each", "10–12 activities, one to three workers each"],
          shorten: ["One critical path: the longest critical activity is best", "Two critical paths: only an activity on both helps", "A near-critical path limits the saving (10–12 activities)"],
          alloc: ["8–9 activities: the smallest team for the minimum time", "8–9 activities: a fixed, smaller team", "10–12 activities: either question"],
          cascade: ["Network with its times given: draw the chart, as early as possible", "Network without its times: find them, then draw the chart, as early as possible", "Network with its times given: draw the chart, as late as possible"],
          table: ["No arrow skips a column", "An arrow skips a column"],
          floatPaths: ["Small projects (6–7 activities), one critical path", "Medium projects (8–9 activities), more than one critical path, and which activity must start first"],
          reason: ["Explain the effect of a change (a delay of up to d, or an activity removed)", "Comment on a claim (a finish time, or adding the critical durations)"],
          reasonA: ["State a limitation of the model and its effect"],
          unknown: ["One duration x from the critical path", "A missing earliest start or latest finish in a box"],
          change: ["A delay compared with the float", "A critical activity made quicker", "A delay of \u201cup to d\u201d, or an activity removed"],
        },
        subTools: SUB_TOOLS,
        chooser: {
          art: (k: string) => <CpaTileArt k={k} />,
          filters: ["course", "practice"],
          groups: [
            { title: "Building the network", keys: ["network", "table"] },
            { title: "Times, floats and critical paths", keys: ["forward", "full", "floatPaths", "unknown"] },
            { title: "Changes and reasoning", keys: ["change", "reason", "shorten", "reasonA"] },
            { title: "Charts and resources", keys: ["cascade", "histogram", "level", "alloc"] },
            { title: "AS exam style questions", keys: ["exAsAny", "exBuild", "exClaim", "exChange", "exClock"] },
            { title: "A-level exam style questions", keys: ["exAlAny", "exCascade", "exTable", "exHist", "exShorten", "exAlloc"] },
          ],
        },
        hideMatrix: true,
        noSandbox: true,
        canvasFooter: (p: DecisionProblem) => <CpaKey p={p} />,
        options: [
          {
            key: "course",
            label: "Course",
            info: "Which course the questions and tabs are for.",
            top: true,
            defaultFor: () => "as",
            choices: [
              { value: "as", label: "AS" },
              { value: "a", label: "A-level" },
            ],
          },
          {
            key: "practice",
            label: "Practice",
            info: "Skills gives single-skill questions. Exam style gives multi-part questions in the style of the exam paper.",
            top: true,
            choices: [
              { value: "skills", label: "Skills" },
              { value: "exam", label: "Exam style" },
            ],
          },
          {
            key: "floatQ",
            label: "Question",
            info: "What to ask for.",
            forSubTools: ["floatPaths"],
            multi: true,
            defaultFor: (lv: number) => (lv === 1 ? "float,paths" : "float,paths,first"),
            choices: [
              { value: "float", label: "Float", sub: "Of each activity" },
              { value: "paths", label: "Critical paths", sub: "Every one" },
              { value: "first", label: "Start first", sub: "Which activity" },
            ],
          },
          {
            key: "clockQ",
            label: "Finish time as",
            info: "Whether the finish is given as the minutes taken or as a clock time (a start and a finish).",
            forSubTools: ["forward"],
            multi: true,
            defaultFor: () => "minutes",
            choices: [
              { value: "minutes", label: "Minutes", sub: "Time taken" },
              { value: "clock", label: "Clock time", sub: "Start and finish" },
            ],
          },
          {
            key: "unknownWhere",
            label: "Where is x",
            info: "Whether the unknown x is on the critical path, or off it (then find x ≤ …).",
            forSubTools: ["unknown"],
            multi: true,
            defaultFor: () => "on",
            choices: [
              { value: "on", label: "On the path", sub: "x is critical" },
              { value: "off", label: "Off the path", sub: "Find x ≤ …" },
            ],
          },
          {
            key: "reasonForm",
            label: "Question",
            info: "The kind of question.",
            forSubTools: ["reason"],
            multi: true,
            defaultFor: (lv: number) => (lv === 1 ? "range,remove" : "claim,glyn"),
            choices: [
              { value: "range", label: "Delay up to d", sub: "Effect of a delay" },
              { value: "remove", label: "Removed", sub: "An activity is removed" },
              { value: "claim", label: "Claimed time", sub: "A finish time" },
              { value: "glyn", label: "Add durations", sub: "Of the critical activities" },
            ],
          },
          {
            key: "changeAsk",
            label: "Answer asked",
            info: "What is asked after a change.",
            forSubTools: ["change"],
            multi: true,
            defaultFor: () => "time",
            choices: [
              { value: "time", label: "Minimum time" },
              { value: "boxes", label: "Named activities", sub: "Their times" },
            ],
          },
          {
            key: "workersEach",
            label: "Workers per activity",
            info: "How many workers each activity needs.",
            forSubTools: ["histogram", "level"],
            multi: true,
            defaultFor: (lv: number, sub?: string) => ((sub === "histogram" ? lv === 3 : lv === 2) ? "several" : "one"),
            choices: [
              { value: "one", label: "One each" },
              { value: "several", label: "1 to 3 each" },
            ],
          },
          {
            key: "allocKind",
            label: "Question",
            info: "What to find about the team.",
            forSubTools: ["alloc"],
            multi: true,
            defaultFor: (lv: number) => (lv === 1 ? "min" : lv === 2 ? "fixed" : "min,fixed"),
            choices: [
              { value: "min", label: "Smallest", sub: "Smallest team" },
              { value: "fixed", label: "Fixed", sub: "A set team" },
            ],
          },
          {
            key: "histBlocks",
            label: "Blocks",
            info: "How the blocks are drawn.",
            forSubTools: ["histogram", "level"],
            multi: true,
            defaultFor: () => "whole,jump",
            choices: [
              { value: "whole", label: "Whole", sub: "Plain rectangles" },
              { value: "jump", label: "Stepped", sub: "A block drops" },
            ],
          },
          {
            key: "histStart",
            label: "Start times",
            info: "Whether activities start as early as possible or as late as possible.",
            forSubTools: ["histogram"],
            multi: true,
            defaultFor: () => "early",
            choices: [
              { value: "early", label: "Early", sub: "As early as possible" },
              { value: "late", label: "Late", sub: "As late as possible" },
            ],
          },
          {
            key: "actCount",
            label: "Activities",
            info: "How many activities there are.",
            forSubTools: ["cascade"],
            multi: true,
            defaultFor: (lv: number) => (lv === 1 ? "n89" : "n1012"),
            choices: [
              { value: "n89", label: "8–9" },
              { value: "n1012", label: "10–12" },
            ],
          },
          {
            key: "chartGiven",
            label: "Chart",
            info: "Whether you draw the whole chart, or complete a partly drawn one.",
            forSubTools: ["cascade"],
            multi: true,
            defaultFor: () => "blank",
            choices: [
              { value: "blank", label: "Draw it" },
              { value: "partial", label: "Complete it", sub: "A partly drawn chart" },
            ],
          },
          {
            key: "critRow",
            label: "Critical activities",
            info: "Whether the critical activities share one row (in sequence) or each have their own row.",
            forSubTools: ["cascade"],
            multi: true,
            defaultFor: () => "sequence",
            choices: [
              { value: "sequence", label: "In sequence", sub: "On one row" },
              { value: "rows", label: "Own rows" },
            ],
          },
          {
            key: "ganttStyle",
            label: "Style",
            info: "Whether activities are drawn as blocks or as thin bars.",
            forSubTools: ["cascade"],
            multi: true,
            defaultFor: () => "blocks",
            choices: [
              { value: "blocks", label: "Blocks" },
              { value: "bars", label: "Thin bars" },
            ],
          },
          {
            key: "size",
            label: "Numbers",
            info: "How big the durations are.",
            multi: true,
            defaultFor: sizeDefault,
            choices: [
              { value: "small", label: "Small", sub: "1 to 9" },
              { value: "medium", label: "Medium", sub: "5 to 25" },
            ],
          },
          {
            key: "paths",
            label: "Critical paths",
            info: "Whether there is one critical path or more than one.",
            forSubTools: ["full", "floatPaths", "cascade", "histogram", "level"],
            multi: true,
            defaultFor: (lv: number, sub?: string) => (sub === "floatPaths" && lv === 2 ? "more" : "one"),
            choices: [
              { value: "one", label: "One" },
              { value: "more", label: "More than one" },
            ],
          },
        ],
      }}
    />
  );
}

// CI contract surface — checked by src/tests/cpa.test.ts (the shared Decision `__problem` validator is MST/TSP/route-specific).
