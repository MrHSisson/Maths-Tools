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
import type { InfoSection } from "../../shared";
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
      { label: "Forward pass", detail: "Option “Finish time as”: tick A clock time to give a start time on the clock and ask for the finish time (and a latest start time). Work left to right. An activity's earliest start is the largest of the earliest finishes (start + duration) of the activities before it. End's earliest start is the minimum completion time of the project." },
      { label: "Full analysis", detail: "The forward pass, then the backward pass from End: an activity's latest finish is the smallest of the latest starts (latest finish − duration) of the activities after it. Activities with float 0 are critical, and the critical path joins them from Start to End." },
      { label: "Float and critical paths", detail: "The network is already filled in. Float = latest finish − earliest start − duration: how long an activity can be delayed without delaying the project (critical activities have float 0; this is total float). Or find every critical path: the activities with no float, followed from Start to End. Or several activities can start straight away: which must be started first so the project is not delayed? The Question option ticks which of these you get; Level 1 has one critical path and Level 2 more than one." },
      { label: "Explain and justify (AS)", detail: "Written reasoning, marked against mark points (the tool cannot mark free text, so the working shows the evidence, then the marks and a model answer to check yours against). Level 1: explain the effect of a change: a delay of up to d days (threshold at the float) or an activity removed (another path may become critical). Level 2: comment on a claim: a stated finish time against the minimum completion time (and why it might not hold), or Glyn\u2019s claim that adding the critical durations gives the minimum time (false when there is more than one critical path; true for a single critical path)." },
      { label: "Limits of the model (A-level)", detail: "State one limitation of using the activity network to plan the project (travel time between activities, fixed durations, unlimited workers assumed, cost ignored) and explain how it affects the project in time or money terms. Any one with its effect earns the marks." },
      { label: "Missing time", detail: "Level 2: one value in a box is x (an earliest start or a latest finish). An earliest start is the largest of the earlier activities' finishes; a latest finish is the smallest of the later activities' latest starts; the wrong options are the usual slips (the smallest instead of the largest, adding them, or adding the activity's own duration). Level 1: one duration is x. On the critical path: you are told the critical path and the minimum completion time, and the durations along it add up to the minimum completion time, so form an equation and solve it. Not on the critical path (Question Option): find the largest x that leaves the minimum completion time unchanged. That is the activity's latest finish minus its earliest start, so x ≤ that." },
      { label: "Delays and changes", detail: "Level 1: an activity is delayed. If the delay is less than its float, or equal to it, the project time does not change (equal uses up all the float, so the activity becomes critical). If it is more, the project is delayed by the excess. Level 2: a critical activity is made quicker. The time falls by the whole reduction unless another path becomes critical first. Level 3: a delay given as a range (\u201cup to d\u201d; the answer is a threshold at the float) or an activity removed (the same as taking 0 time). The Answer asked option can ask for the earliest start and latest finish of named later activities instead of the project time. The working recalculates the changed boxes one at a time: the earliest starts that change (left to right), the latest finishes that change (right to left), then the new floats." },
      { label: "Cascade/Gantt chart (A-level)", detail: "Level 1 gives the network with its times; Level 2 gives it without, so you find the earliest start and latest finish times first, then draw the chart; Level 3 gives the times and asks for every activity as late as possible. The Activities option sets 8–9 or 10–12 activities (Level 1 starts on 8–9, the others on 10–12). Draw a cascade (Gantt) chart from the network: time along the bottom, a bar as long as each activity. The critical activities go end to end; every other activity starts as early (or as late) as possible and its float is shown as a dashed block after it (before it, for late starts). Levels: 8–9 activities, 10–12 activities, then every activity as late as possible." },
      { label: "Resource histogram (A-level)", detail: "Draw a resource histogram: time along the bottom, the number of workers up the side. Each activity is a block as wide as its duration and as high as the workers it needs, every activity starting as early as possible. Put the critical activities along the bottom, stack the rest above them with no gaps (a block never floats over empty space), and label every block. No float is shown. Levels: 8–9 activities with one worker each; 10–12 activities with one worker each; 10–12 activities needing 1 to 3 workers each. The Workers per activity option overrides this." },
      { label: "Resource levelling (A-level)", detail: "A limit on the workers. The histogram with no limit is shown; find where it goes above the limit, then build it again one activity at a time: an activity starts when everything before it is finished and enough workers are free, so some activities wait. Amber blocks are the delayed ones. Level 1: the delays fit inside the float, so the minimum completion time is unchanged. Level 2: the delays use up the float and the project takes longer (several workers per activity). Level 3: 10–12 activities with two or more delays." },
      { label: "Worker allocation * (A-level)", detail: "Each activity needs one worker, and a worker does one activity at a time. Smallest team: the project must finish in the minimum time, so the critical path keeps one worker busy the whole time; find the fewest workers that can fit the rest round it, and say who does what. Fixed team: only a few workers are available; level the histogram to find the new minimum time, then allocate. The chart has a row for each worker." },
      { label: "Which to shorten (A-level)", detail: "One activity can be reduced to take only 1 unit of time. Which one gives the smallest minimum completion time? Only critical activities can help; try each, redo the passes and compare. A second critical path stops the saving (or means only an activity on every critical path helps), so the longest critical activity is not always the best. Levels: one critical path and the longest is best; two critical paths; a near-critical path makes a shorter critical activity better (10–12 activities)." },
    ],
  },
  {
    title: "Exam style questions",
    icon: "📝",
    content: [
      { label: "What they are", detail: "One activity network (or table) followed by a chain of lettered parts with marks, in the order the exam sets them. Every network, answer and piece of working comes from the same generators as the skills tabs. Reveal each part's answer, with the marks listed under it, and mark yourself; the (?) beside an answer plays the step-by-step working on the picture. Practice | Worksheet prints a paper and a mark scheme (a blank figure is given wherever the answer is drawn)." },
      { label: "AS questions", detail: "Network, then a change or a claim (table to network and times, then the effect of a delay or a claim to judge); Times and Glyn's claim (times, minimum time, critical activities, then adding the critical durations); Effect of a change (a completed network: critical path then the effect of a change on named activities, or times then a delay of up to d days); Clock times and a second project (precedence table, times, which activity first, a clock finish time, a second small project timed in seconds)." },
      { label: "A-level questions", detail: "Times and a cascade chart (with the critical path or a float, and sometimes the effect of removing an activity); Table, histogram and levelling (table to network, times, critical paths, histogram, the effect of a worker limit); Histogram and levelling (critical path, histogram, a worker limit); Which to shorten and a limitation (times, which activity to reduce to 1, a limitation of the model); Levelling and worker allocation (in the style of the earlier specification)." },
      { label: "Levels", detail: "Level 1 has 8–9 activities and Level 2 has 10–12, the sizes of the papers." },
    ],
  },
  {
    title: "Question Options",
    icon: "⚙️",
    content: [
      { label: "Levels", detail: "Network from a table, Forward pass, Full analysis and Float and critical paths: Level 1 has 6–7 activities, Level 2 has 8–9 (some wait for two others); Forward pass and Full analysis also have Level 3 with 10–12 activities (an arrow that skips a column, and an activity with only 1 or 2 of float). Table from a network: Level 2 adds an arrow that skips a column. Float and critical paths: one critical path, then more than one (and which activity must start first). Delays and changes: a delay, then a shortened critical activity, then a delay given as a range or an activity removed. Missing time: a duration x found from the critical path, then (Level 2) a missing earliest start or latest finish in a filled-in box." },
      { label: "Numbers", detail: "Small gives durations from 1 to 9, Medium from 5 to 25. Choosing a level ticks the one it uses (Level 1 starts on Small); tick both to have a mixture." },
      { label: "Critical paths", detail: "One: a single critical path (the default). More than one: two or three critical paths, as a chapter question may ask for \u2014 every one must be found, and the working marks each. Tick both: some questions have one and some several, so the class has to check for others. Available on Full analysis, Float and critical paths, Cascade chart, Resource histogram and Resource levelling." },
      { label: "Course", detail: "AS shows the network skills; A-level shows the time-axis charts (cascade chart, resource histogram, resource levelling and worker allocation so far). Switching course moves you to the first tab of the other one." },
      { label: "Critical activities (cascade chart)", detail: "In sequence puts the critical activities end to end on one row (the exam often accepts either); Own rows gives every activity its own row." },
      { label: "Chart (cascade/Gantt chart)", detail: "Draw it gives a blank chart. Complete a partly drawn chart shows the critical activities and about half of the others already drawn, and you finish it (including the floats)." },
      { label: "Blocks (resource histogram, levelling)", detail: "A block sits on whatever is under it. Where the blocks below change height (say the critical path along the bottom goes from 2 workers to 3), a block above drops into the gap and is drawn in pieces, each labelled with its activity (so you may see E twice), each as many workers high as it needs. Whole blocks keeps every block a plain rectangle (only networks that stack that way are used); Includes a stepped block makes sure at least one block has to drop. Both ticked (the default) gives a mixture." },
      { label: "Start times (resource histogram)", detail: "As early as possible (the usual question) or as late as possible: each block ends at the activity's latest finish. The critical activities still go along the bottom." },
      { label: "More than one critical path (cascade chart, histogram)", detail: "Only the first critical path can sit end to end on the shared row (or along the bottom of the histogram); the other critical activities are drawn on rows of their own (or stacked with the rest). Resource levelling with two critical paths shows how a critical activity can be held up." },
      { label: "Style (cascade chart)", detail: "Blocks draws full-height blocks with the float as a dashed block beside each; Thin bars draws narrow bars with the float as a dashed line." },
      { label: "*", detail: "An asterisk marks a question type that has only been asked in the legacy specification, not the current AS or A-level papers." },
      { label: "Not covered", detail: "Dummy activities (activity on arc), free and independent float." },
    ],
  },
];

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
    // what the histogram is read against sits in a row you scroll sideways — the network, the cascade chart (floats dashed, on the same time axis) and
    // the table of floats — so each gets the whole height and the width it needs; the histogram being built stays in view below
    const cas = d.extra!.cascade;
    const panels: Array<{ title: string; width: string; body: React.ReactNode; ref?: boolean }> = [
      { title: "Network", width: "min(92%, 900px)", ref: true, body: <ActivityNodeView acts={d.acts} layout={d.layout} view={{ ...everyTimes, ...(step?.cpaView ?? {}) }} /> },
      ...(cas ? [{ title: "Cascade chart", width: "min(92%, 900px)", body: <GanttView data={cas} view={step?.ganttView ?? { bars: d.acts.map((a) => a.id), floats: d.acts.filter((a) => d.times.float[a.id] > 0).map((a) => a.id) }} unit={d.unit} axisT={axis} /> }] : []),
      { title: several ? "Floats and workers" : "Floats", width: "auto", body: <div style={{ margin: "auto", padding: "0 12px" }}><FitBox><FloatTable p={p} current={step?.cpaView?.current} /></FitBox></div> },
    ];
    return (
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: 6, padding: "6px 0" }}>
        <div className="flex" style={{ flex: "6 1 0", minHeight: 0, overflowX: "auto", overflowY: "hidden", scrollSnapType: "x proximity", gap: 10, padding: "0 8px" }}>
          {panels.map((pn) => (
            <div key={pn.title} style={{ flex: pn.width === "auto" ? "0 0 auto" : `0 0 ${pn.width}`, minWidth: pn.width === "auto" ? 320 : 560, scrollSnapAlign: "start", display: "flex", flexDirection: "column", minHeight: 0, border: "1px solid #e2e8f0", borderRadius: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#94a3b8", padding: pn.ref ? "6px 10px 0 56px" : "6px 10px 0" }}>{pn.title}</div>
              <div ref={pn.ref ? box : undefined} style={{ flex: 1, minHeight: 0, overflow: "auto", display: "flex" }}>{pn.body}</div>
            </div>
          ))}
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
        instruction: "Question",
        levels: 3, // the most any tab can have; each tab sets its own `levels` (1–3) in SUB_TOOLS
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
            key: "practice",
            label: "Practice",
            top: true,
            choices: [
              { value: "skills", label: "Skills" },
              { value: "exam", label: "Exam style" },
            ],
          },
          {
            key: "floatQ",
            label: "Question",
            forSubTools: ["floatPaths"],
            multi: true,
            defaultFor: (lv: number) => (lv === 1 ? "float,paths" : "float,paths,first"),
            choices: [
              { value: "float", label: "Float of each activity" },
              { value: "paths", label: "Every critical path" },
              { value: "first", label: "Which must start first" },
            ],
          },
          {
            key: "clockQ",
            label: "Finish time as",
            forSubTools: ["forward"],
            multi: true,
            defaultFor: () => "minutes",
            choices: [
              { value: "minutes", label: "Minutes taken" },
              { value: "clock", label: "A clock time" },
            ],
          },
          {
            key: "unknownWhere",
            label: "Where is x",
            forSubTools: ["unknown"],
            multi: true,
            defaultFor: () => "on",
            choices: [
              { value: "on", label: "On the critical path" },
              { value: "off", label: "Not on it (x ≤ …)" },
            ],
          },
          {
            key: "reasonForm",
            label: "Question",
            forSubTools: ["reason"],
            multi: true,
            defaultFor: (lv: number) => (lv === 1 ? "range,remove" : "claim,glyn"),
            choices: [
              { value: "range", label: "A delay of up to d" },
              { value: "remove", label: "An activity removed" },
              { value: "claim", label: "A claimed finish time" },
              { value: "glyn", label: "Add the critical durations" },
            ],
          },
          {
            key: "changeAsk",
            label: "Answer asked",
            forSubTools: ["change"],
            multi: true,
            defaultFor: () => "time",
            choices: [
              { value: "time", label: "The minimum time" },
              { value: "boxes", label: "Times of named activities" },
            ],
          },
          {
            key: "workersEach",
            label: "Workers per activity",
            forSubTools: ["histogram", "level"],
            multi: true,
            defaultFor: (lv: number, sub?: string) => ((sub === "histogram" ? lv === 3 : lv === 2) ? "several" : "one"),
            choices: [
              { value: "one", label: "One each" },
              { value: "several", label: "One to three each" },
            ],
          },
          {
            key: "allocKind",
            label: "Question",
            forSubTools: ["alloc"],
            multi: true,
            defaultFor: (lv: number) => (lv === 1 ? "min" : lv === 2 ? "fixed" : "min,fixed"),
            choices: [
              { value: "min", label: "Smallest team" },
              { value: "fixed", label: "A fixed team" },
            ],
          },
          {
            key: "histBlocks",
            label: "Blocks",
            forSubTools: ["histogram", "level"],
            multi: true,
            defaultFor: () => "whole,jump",
            choices: [
              { value: "whole", label: "Whole blocks" },
              { value: "jump", label: "Includes a stepped block" },
            ],
          },
          {
            key: "histStart",
            label: "Start times",
            forSubTools: ["histogram"],
            multi: true,
            defaultFor: () => "early",
            choices: [
              { value: "early", label: "As early as possible" },
              { value: "late", label: "As late as possible" },
            ],
          },
          {
            key: "actCount",
            label: "Activities",
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
            forSubTools: ["cascade"],
            multi: true,
            defaultFor: () => "blank",
            choices: [
              { value: "blank", label: "Draw it" },
              { value: "partial", label: "Complete a partly drawn chart" },
            ],
          },
          {
            key: "critRow",
            label: "Critical activities",
            forSubTools: ["cascade"],
            multi: true,
            defaultFor: () => "sequence",
            choices: [
              { value: "sequence", label: "In sequence (one row)" },
              { value: "rows", label: "Own rows" },
            ],
          },
          {
            key: "ganttStyle",
            label: "Style",
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
            multi: true,
            defaultFor: sizeDefault,
            choices: [
              { value: "small", label: "Small (1 to 9)" },
              { value: "medium", label: "Medium (5 to 25)" },
            ],
          },
          {
            key: "paths",
            label: "Critical paths",
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
export const __cpa = { generate, solve };
