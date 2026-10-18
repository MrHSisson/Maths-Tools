// ═══════════════════════════════════════════════════════════════════════════
// Critical Path Analysis — exam-style questions. One activity network followed by a chain of lettered parts with marks, in the order
// the papers set them (specs/cpa-exam-questions.md). Every part is built by the SAME generators and solvers as the skill tabs, on one shared
// network (`fixed`), so the model answers and the stepped working cannot drift from the skills. The student reveals each part's answer
// and marks themselves against the mark scheme lines (B1 / M1 / A1 / E1 / R1). Original questions in the style of the papers; no paper's
// question is reproduced.
//
//   AS       asBuild    network from a table, times, then the effect of a change or a claim to judge        (AS Q2, Q3)
//            asClaim    times, minimum time, critical activities, Glyn's claim                              (AS Q4)
//            asChange   a completed network: critical path, then the effect of a change; or times, then a delay of up to d   (AS Q5, Q1)
//            asClock    precedence table, times, which activity first, a clock finish time, a second project in seconds     (AS Q8)
//            asMissing  two missing values in boxes and a statement about a duration, all circle-one                         (AS Q6, Q7)
//   A-level  alCascade  times, critical path or float, a cascade chart, the effect of removing an activity   (AL Q1, Q3)
//            alTable    table to network, times, critical paths, histogram, levelling                      (AL Q5)
//            alHist     critical path, histogram, levelling with a worker limit                            (AL Q2)
//            alShorten  times, which activity to reduce to 1, a limitation of the model                    (AL Q6)
//            alPick     choose the correct levelled histogram                                              (AL Q4)
//            alAlloc    times, critical paths, histogram, levelling, who does what (legacy-style: not in the current papers)
// ═══════════════════════════════════════════════════════════════════════════

import {
  clockTime, cpaList, criticalActivities, fullGraph, generateCpa, successorsOf, withUnit,
  type CpaGenOptions, type CpaKind, type CpaLevel, type CpaProblemData, type CpaViewState,
} from "./cpa";
import { solveCpa } from "./cpaSolve";
import type { DecisionProblem, ExamMark, ExamPart, SolveStep } from "./types";

export type CpaChain = "asBuild" | "asClaim" | "asChange" | "asClock" | "asMissing" | "alCascade" | "alTable" | "alHist" | "alShorten" | "alPick" | "alAlloc";
export const AS_CHAINS: CpaChain[] = ["asBuild", "asClaim", "asChange", "asClock", "asMissing"];
export const AL_CHAINS: CpaChain[] = ["alCascade", "alTable", "alHist", "alShorten", "alPick", "alAlloc"];

type Chart = NonNullable<SolveStep["examChart"]>;
type Fixed = NonNullable<CpaGenOptions["fixed"]>;
interface Ctx { level: CpaLevel; opts: CpaGenOptions; fixed: Fixed; base: CpaProblemData; unit: string; n: number; /** the chart data the parts' pictures use, gathered as the parts are built */ extras: NonNullable<CpaProblemData["extra"]> }

const B = (code: ExamMark["code"] | string, text: string): ExamMark => ({ code, text });
const lastOf = <T,>(a: T[]): T => a[a.length - 1];
const tag = (steps: SolveStep[], chart?: Chart): SolveStep[] => (chart ? steps.map((s) => ({ ...s, examChart: chart })) : steps);
const stepOf = (view: CpaViewState, chart?: Chart, extra: Partial<SolveStep> = {}): SolveStep => ({ caption: "", edgeStates: {}, cpaView: view, ...(chart ? { examChart: chart } : {}), ...extra });
const allTimes = (d: CpaProblemData, which: "es" | "lf" | "both" = "both"): CpaViewState => {
  const all = fullGraph(d.acts);
  return {
    ...(which !== "lf" ? { es: Object.fromEntries(all.map((a) => [a.id, d.times.es[a.id]])) } : {}),
    ...(which !== "es" ? { lf: Object.fromEntries(all.map((a) => [a.id, d.times.lf[a.id]])) } : {}),
  };
};

function problemOf(c: Ctx, kind: CpaKind, g: { data: CpaProblemData; prompt: string; answerText: string }): DecisionProblem {
  return { network: { nodes: [], edges: [] }, kind, level: c.level, cpa: g.data, prompt: g.prompt, answer: { text: g.answerText }, matrixMode: "off" } as unknown as DecisionProblem;
}
/** a part's data and working, built by the skill generator on the shared network */
function sub(c: Ctx, kind: CpaKind, o: CpaGenOptions = {}) {
  const g = generateCpa(c.level, kind, { ...c.opts, ...o, fixed: c.fixed });
  return { g, steps: solveCpa(problemOf(c, kind, g)) };
}
/** retry a generator until a condition holds (a particular case of a change, a distinct pair of boxes…) */
function until<T>(make: () => T, ok: (x: T) => boolean, tries = 40): T {
  for (let i = 0; i < tries; i++) { const x = make(); if (ok(x)) return x; }
  throw new Error("exam: no suitable part");
}

interface PartIn {
  label: string; prompt: string; marks: ExamMark[]; model: string[]; working: SolveStep[];
  chart?: Chart; onDiagram?: boolean; stepView?: SolveStep; blank?: SolveStep;
}
function part(p: PartIn): ExamPart {
  const working = tag(p.working, p.chart);
  return {
    label: p.label, prompt: p.prompt, marks: p.marks.length, scheme: p.marks, model: p.onDiagram ? [] : p.model, onDiagram: p.onDiagram,
    working, stepView: p.stepView ?? (p.onDiagram || p.chart ? lastOf(working) : undefined), blankStep: p.blank, explain: working.length ? undefined : p.model,
  };
}

// ── pieces shared by several chains ──────────────────────────────────────────
const noCrit = (steps: SolveStep[]) => steps.filter((s) => s.phase !== "Critical activities" && s.phase !== "Critical path" && s.phase !== "Critical paths");
const blankNet = (chart?: Chart): SolveStep => stepOf({ shown: [START_ID, END_ID] }, chart);
const START_ID = "Start", END_ID = "End";

function timesPart(c: Ctx, label: string, marks: ExamMark[], prompt = "Find the earliest start time and the latest finish time for each activity and write these values on the activity network."): ExamPart {
  const { steps } = sub(c, "cpaFull");
  const w = noCrit(steps);
  const t = c.base.times;
  return part({
    label, prompt, marks, working: w, onDiagram: true,
    model: [`Earliest starts: ${c.base.acts.map((a) => `${a.id} ${t.es[a.id]}`).join(", ")}.`, `Latest finishes: ${c.base.acts.map((a) => `${a.id} ${t.lf[a.id]}`).join(", ")}.`],
    stepView: stepOf(allTimes(c.base)),
    blank: stepOf({}),
  });
}
function networkPart(c: Ctx, label: string, marks: ExamMark[], withTimes: boolean): ExamPart {
  const net = sub(c, "cpaNetwork").steps;
  const times = withTimes ? noCrit(sub(c, "cpaFull").steps) : [];
  return part({
    label,
    prompt: withTimes ? "Construct an activity network for the project and fill in the earliest start time and latest finish time for each activity." : "Complete the activity network for the project.",
    marks, working: [...net, ...times], onDiagram: true, model: [],
    stepView: stepOf(withTimes ? { ...allTimes(c.base) } : { shown: undefined }),
    blank: blankNet(),
  });
}
function critPart(c: Ctx, label: string, kind: "path" | "activities" | "paths"): ExamPart {
  const { steps } = sub(c, "cpaPaths");
  const d = c.base;
  const crit = criticalActivities(d.acts);
  const paths = d.criticalPaths.map((p) => p.filter((id) => id !== "Start" && id !== "End").join(" – "));
  const prompt = kind === "path" ? "Write down the critical path." : kind === "activities" ? "Write down the critical activities of the network." : "Write down the critical path(s).";
  const marks = kind === "path" ? [B("B1", "States the correct critical path and no others")] : kind === "activities" ? [B("B1", "States all correct critical activities and no others")] : [B("B1", "Correctly identifies both critical paths and no others")];
  const model = kind === "activities" ? [crit.join(", ")] : [paths.join(" and ")];
  return part({ label, prompt, marks, model, working: steps });
}
function minTimePart(c: Ctx, label: string): ExamPart {
  const T = c.base.times.projectTime;
  return part({
    label, prompt: "State the minimum completion time for the project.", marks: [B("B1F", "States the correct minimum completion time (follow through their values in the activity network). Condone missing units")],
    model: [`${T} ${c.unit}`],
    working: [{ caption: `The minimum completion time is the earliest start time of End: ${T} ${c.unit}.`, edgeStates: {}, cpaView: allTimes(c.base) }],
  });
}
function floatPart(c: Ctx, label: string): ExamPart {
  const t = c.base.times;
  const cand = c.base.acts.filter((a) => t.float[a.id] > 0);
  const a = cand[Math.floor(Math.random() * cand.length)];
  return part({
    label, prompt: `Determine the float of activity ${a.id}.`, marks: [B("B1", "Determines the correct float. Condone omission of units")],
    model: [`${t.float[a.id]} ${c.unit}`],
    working: [{ caption: `Float = latest finish − earliest start − duration = ${t.lf[a.id]} − ${t.es[a.id]} − ${a.duration} = ${t.float[a.id]}.`, edgeStates: {}, cpaView: { ...allTimes(c.base), current: a.id } }],
  });
}
function reasonPart(c: Ctx, label: string, rc: "claim" | "glyn" | "limit" | "range" | "remove", prompt?: (p: string) => string, which?: number): ExamPart {
  const { g, steps } = sub(c, "cpaReason", { reasonCase: rc, paths: rc === "glyn" ? "more" : undefined });
  const r = g.data.extra!.reason!;
  const marks = which === undefined ? r.marks : [r.marks[which]];
  const model = which === undefined ? r.model : [r.model[which]];
  return part({ label, prompt: prompt ? prompt(g.prompt) : g.prompt, marks: marks.map((m) => B(m.code, m.text)), model, working: steps });
}
function changePart(c: Ctx, label: string, o: CpaGenOptions, want: (m: string) => boolean, marks: ExamMark[], promptFn: (g: ReturnType<typeof generateCpa>, ch: NonNullable<CpaProblemData["extra"]>["change"]) => string): ExamPart {
  const { g, steps } = until(() => sub(c, "cpaChange", o), (x) => want(x.g.data.extra!.change!.mode));
  const ch = g.data.extra!.change!;
  return part({ label, prompt: promptFn(g, ch), marks, model: [g.answerText], working: steps, stepView: stepOf({ ...lastOf(steps).cpaView }) });
}
const histPart = (c: Ctx, label: string, marks: ExamMark[], shape: "step" = "step"): ExamPart => {
  const { g, steps } = sub(c, "cpaHistogram", { histShape: shape });
  const h = g.data.extra!.histogram!;
  c.extras.histogram = h;
  return part({
    label, prompt: "Using the diagram, draw a resource histogram for the project to show how the project can be completed in the minimum possible time. Assume that each activity is to start as early as possible.",
    marks, model: [], working: steps, chart: "histogram", onDiagram: true,
    blank: stepOf({ ...allTimes(c.base) }, "histogram", { histView: { blocks: [] } }),
    stepView: stepOf({ ...allTimes(c.base) }, "histogram", { histView: { blocks: h.blocks.map((b) => b.id) } }),
  });
};

function levelPart(c: Ctx, label: string, marks: (info: { clash: string; need: number; limit: number; T2: number; T: number }) => ExamMark[], promptFor: (limit: number) => string, type: "extra" | "within" = "extra"): ExamPart {
  const { g, steps } = sub(c, "cpaLevel", { levelType: type, histShape: "step" });
  const L = g.data.extra!.level!;
  c.extras.level = L;
  const first = L.over[0];
  const running = L.before.blocks.filter((b) => b.start < first.to && first.from < b.end).map((b) => b.id);
  return part({
    label, prompt: promptFor(L.limit),
    marks: marks({ clash: cpaList(running), need: first.need, limit: L.limit, T2: L.newTime, T: g.data.times.projectTime }),
    model: [g.answerText], working: steps, chart: "level", onDiagram: true,
    blank: stepOf({ ...allTimes(c.base) }, "level", { histView: { blocks: [], which: "after", showLimit: true } }),
    stepView: stepOf({ ...allTimes(c.base) }, "level", { histView: { blocks: L.after.blocks.map((b) => b.id), which: "after", showLimit: true } }),
  });
}

// ── the chains ───────────────────────────────────────────────────────────────
type Build = (c: Ctx) => { intro: string; parts: ExamPart[]; q: NonNullable<CpaProblemData["extra"]>["examQ"] };
const activitiesText = (c: Ctx) => { const ids = c.base.acts.map((a) => a.id); return `${ids.length} activities ${ids.slice(0, -1).join(", ")} and ${lastOf(ids)}`; };
const NET_GIVEN = (c: Ctx) => `The activity network for the project is shown in the diagram. The duration of each activity is given in ${c.unit}.`;
const durOnly: CpaViewState = {};

const BUILDERS: Record<CpaChain, Build> = {
  // AS Q2 / Q3: table → network and times → the effect of a change, or a claim
  asBuild: (c) => {
    const variant = Math.random() < 0.5 ? "change" : "claim";
    const a = networkPart(c, "(a)", [
      B("M1", `Constructs an activity network with at least ${Math.max(6, c.n - 2)} activities and at least 4 correct connections`),
      B("A1", "Completes the activity network with all activities and correct connections (condone an extra End activity of duration 0)"),
      B("B1", "Finds correctly the earliest start time for each activity on the correct network"),
      B("B1F", "Finds correctly the latest finish time for each activity on their network (follow through their earliest start times)"),
    ], true);
    const b = variant === "change"
      ? changePart(c, "(b)", { changeCase: "delay" }, (m) => m === "more", [
        B("M1", "Evaluates the effect of the increase on the activity in their activity network (for example considers its float, or amends the network)"),
        B("A1F", "Determines the new minimum completion time (follow through their minimum completion time)"),
      ], (_g, ch) => `During the project, the duration of activity ${ch!.id} is extended by ${withUnit(ch!.amount, c.unit)}. Determine the new minimum completion time of the project.`)
      : reasonPart(c, "(b)", "claim");
    return { intro: `A project consists of ${activitiesText(c)}. The duration and the immediate predecessors of each activity are shown in the table. Times are in ${c.unit}.`, parts: [a, b], q: { view: { shown: [] }, table: "full" } };
  },
  // AS Q4: times, minimum time, critical activities, Glyn's claim
  asClaim: (c) => {
    const parts = [
      timesPart(c, "(a)(i)", [
        B("M1", "Finds correctly the earliest start time for some of the activities"),
        B("A1", "Finds correctly the earliest start time for each activity on the network"),
        B("B1", "Finds correctly the latest finish time for each activity on the network (condone inclusion of an End activity with zero duration)"),
      ], "Complete the activity network, showing the earliest start time and latest finish time for each activity."),
      minTimePart(c, "(a)(ii)"),
      critPart(c, "(b)", "activities"),
      reasonPart(c, "(c)(i)", "glyn", () => "Glyn claims that a project's activity network can be used to determine its minimum completion time by adding together the durations of all the project's critical activities. Show that Glyn's claim is false for this network.", 0),
      reasonPart(c, "(c)(ii)", "glyn", () => "Describe a situation in which Glyn's claim would be true.", 1),
    ];
    return { intro: `A community project consists of ${activitiesText(c)}. ${NET_GIVEN(c)}`, parts, q: { view: durOnly } };
  },
  // AS Q5 / Q1
  asChange: (c) => {
    if (Math.random() < 0.5) {
      const crit = critPart(c, "(a)", "path");
      const named = changePart(c, "(b)", { changeCase: "delay", changeAsk: "boxes" }, (m) => m === "more", [
        B("M1", "Uses the model to assess the effect of the change on the earliest start times of the activities asked about (or states that the activity remains non-critical)"),
        B("B1", "States explicitly the activities whose earliest start time and latest finish time remain unchanged"),
        B("A1", "Deduces the new earliest start times and states the latest finish times"),
      ], (_g, ch) => `Due to an issue with the supply of materials, the duration of activity ${ch!.id} is increased by ${withUnit(ch!.amount, c.unit)}. Deduce the effect, if any, on the earliest start time and latest finish time for each of the activities ${cpaList(ch!.named ?? [])}.`);
      return { intro: `A project consists of ${activitiesText(c)}. A completed activity network for the project is shown in the diagram, with the earliest start time and latest finish time of each activity. All times are in ${c.unit}.`, parts: [crit, named], q: { view: allTimes(c.base) } };
    }
    const times = timesPart(c, "(a)", [
      B("M1", "Obtains the correct start times for some of the activities"),
      B("A1", "Finds correctly the earliest start time for each activity on the network"),
      B("B1", "Finds correctly the latest finish time for each activity on the network"),
    ], "Complete the activity network by showing the earliest start time and the latest finish time for each activity.");
    const range = reasonPart(c, "(b)", "range", (p) => p.replace(/^The activity network shows the earliest start time, latest finish time and float of every activity\. The times are in \w+\. /, ""));
    return { intro: `A project consists of ${activitiesText(c)}. ${NET_GIVEN(c)}`, parts: [times, range], q: { view: durOnly } };
  },
  // AS Q8
  asClock: (c) => {
    const tab = sub(c, "cpaTable");
    const t = sub(c, "cpaFull");
    const first = sub(c, "cpaPaths", { pathsAsk: "first" });
    const f = first.g.data.extra!.first!;
    const clk = sub(c, "cpaContext", { clockSecond: true });
    const ck = clk.g.data.extra!.clock!;
    const sec = ck.second!;
    const T = c.base.times.projectTime;
    const parts: ExamPart[] = [
      part({ label: "(a)(i)", prompt: "Complete the precedence table for the activities.", marks: [B("B1", "Correctly completes the precedence table")], working: tab.steps, onDiagram: false,
        model: c.base.acts.map((a) => `${a.id}: ${a.preds.length ? a.preds.join(", ") : "none"}`) }),
      timesPart(c, "(a)(ii)", [B("B1", "Correctly states the earliest start times for all activities"), B("B1", "Correctly states the latest finish times for all activities")], "Complete the activity network by showing the earliest start time and latest finish time for each activity."),
      part({
        label: "(b)(i)", prompt: `${cpaList(f.sources)} can all be started straight away. State the activity which must be started first so that the work is finished in the shortest possible time. Fully justify your answer.`,
        marks: [B("B1F", "States the correct activity (from their completed activity network)"), B("E1F", "Identifies their activity as critical, or states that its float is zero")],
        model: [`${f.answer}: it is on the critical path (float 0). ${f.sources.filter((id) => id !== f.answer).map((id) => `${id} has float ${f.floats[id]}`).join(", ")}.`], working: first.steps,
      }),
      part({
        label: "(b)(ii)", prompt: `Work starts at ${clockTime(ck.startMins)}. Determine the earliest possible time at which the work can be completed.`,
        marks: [B("B1F", `States their correct time using their completed activity network: ${clockTime(ck.startMins)} + their minimum completion time`)],
        model: [`${clockTime(ck.startMins)} + ${T} minutes = ${clockTime(ck.startMins + T)}`],
        working: [{ caption: `The minimum completion time is ${T} minutes. ${clockTime(ck.startMins)} + ${T} minutes = ${clockTime(ck.startMins + T)}.`, edgeStates: {}, cpaView: allTimes(c.base) }],
      }),
      part({
        label: "(c)(i)", prompt: `A second small piece of work must finish at the same time as the first. It has three jobs, one after another: (1) ${sec.parts[0].text}; (2) ${sec.parts[1].text}; (3) ${sec.parts[2].text}. Give the duration of each job in minutes.`,
        marks: [B("B1", "Correct durations (condone correct durations in seconds)")],
        model: sec.parts.map((x, i) => `Job ${i + 1}: ${x.mins} minutes`), working: clk.steps.filter((s) => s.phase === "Convert to minutes"),
      }),
      part({
        label: "(c)(ii)", prompt: "Determine the latest time at which the first of these jobs can be started so that both pieces of work finish together.",
        marks: [B("M1", "Uses their minimum completion time and the total of the second piece of work in consistent units to find its float"), B("A1", "States the correct time (cao). Condone omission of am/pm")],
        model: [`${T} − ${sec.total} = ${T - sec.total} minutes. ${clockTime(ck.startMins)} + ${T - sec.total} minutes = ${clockTime(ck.startMins + T - sec.total)}`],
        working: clk.steps.filter((s) => s.phase === "Total and float" || s.phase === "Latest start"),
      }),
    ];
    void t;
    return { intro: `A group of friends prepare a meal. Work starts at ${clockTime(ck.startMins)}. The activities are shown in the activity network, and the duration of each is given in minutes.`, parts, q: { view: durOnly } };
  },
  // AS Q6 / Q7
  asMissing: (c) => {
    const succs = successorsOf(fullGraph(c.base.acts));
    const pick = () => {
      const x = sub(c, "cpaUnknown", { unknownBox: true, unknownChoice: true });
      const y = sub(c, "cpaUnknown", { unknownBox: true, unknownChoice: true });
      return { x, y };
    };
    const { x, y } = until(pick, ({ x, y }) => {
      const bx = x.g.data.extra!.unknown!.box!, by = y.g.data.extra!.unknown!.box!;
      return bx.id !== by.id && bx.cell !== by.cell;
    });
    const bx = x.g.data.extra!.unknown!, by = y.g.data.extra!.unknown!;
    const crit = criticalActivities(c.base.acts);
    const xPreds = c.base.acts.find((a) => a.id === bx.id)!.preds;
    const ySuccs = succs[by.id];
    const ds = crit.filter((id) => !xPreds.includes(id) && !ySuccs.includes(id) && id !== bx.id && id !== by.id);
    if (!ds.length) throw new Error("exam: no suitable part");
    const k = ds[Math.floor(Math.random() * ds.length)];
    const v = c.base.acts.find((a) => a.id === k)!.duration;
    const opts = [`0 < d < ${v}`, `d = ${v}`, `${v} < d < ${2 * v}`, `d = ${2 * v}`];
    const view: CpaViewState = (() => {
      const e = { ...allTimes(c.base).es! }, l = { ...allTimes(c.base).lf! };
      delete e[bx.box!.cell === "es" ? bx.id : ""]; delete l[by.box!.cell === "lf" ? by.id : ""];
      if (bx.box!.cell === "lf") delete l[bx.id];
      if (by.box!.cell === "es") delete e[by.id];
      return { es: e, lf: l, esLabels: { ...(bx.box!.cell === "es" ? { [bx.id]: "x" } : {}), ...(by.box!.cell === "es" ? { [by.id]: "y" } : {}) }, lfLabels: { ...(bx.box!.cell === "lf" ? { [bx.id]: "x" } : {}), ...(by.box!.cell === "lf" ? { [by.id]: "y" } : {}) }, durLabels: { [k]: "d" } };
    })();
    const cell = (b: typeof bx) => (b.box!.cell === "es" ? "earliest start time" : "latest finish time");
    const parts: ExamPart[] = [
      part({ label: "(a)", prompt: `The ${cell(bx)} of activity ${bx.id} is x. Find the value of x. Circle your answer: ${bx.choices!.join("   ")}`, marks: [B("B1", "Circles the correct answer")], model: [`x = ${bx.x}`], working: x.steps }),
      part({ label: "(b)", prompt: `The ${cell(by)} of activity ${by.id} is y. Find the value of y. Circle your answer: ${by.choices!.join("   ")}`, marks: [B("B1", "Circles the correct answer")], model: [`y = ${by.x}`], working: y.steps }),
      part({
        label: "(c)", prompt: `${cpaList(c.base.criticalPaths[0].filter((id) => id !== "Start" && id !== "End"))} is the critical path. The duration of activity ${k} is d. Which of the following statements about d is correct? Circle your answer: ${opts.join("     ")}`,
        marks: [B("B1", "Circles the correct answer")], model: [opts[1]],
        working: [{ caption: `${k} is on the critical path, so it has no float: its duration is its latest finish − its earliest start = ${c.base.times.lf[k]} − ${c.base.times.es[k]} = ${v}. So d = ${v}.`, edgeStates: {}, cpaView: { ...allTimes(c.base), current: k, critical: [k] } }],
      }),
    ];
    return { intro: `An activity network for a project of ${activitiesText(c)} is shown in the diagram. Times are in ${c.unit}. The earliest start time and latest finish time of the activities are shown, except where a letter stands for a missing value.`, parts, q: { view } };
  },
  // AL Q1 / Q3
  alCascade: (c) => {
    const q3 = Math.random() < 0.5;
    const times = timesPart(c, "(a)(i)", [B("B1", "Finds the correct earliest start time for each activity"), B("B1", "Finds the correct latest finish time for each activity")]);
    const second = q3 ? critPart(c, "(a)(ii)", "path") : floatPart(c, "(a)(ii)");
    const { g, steps } = sub(c, "cpaCascade", { paths: "one", cascade: { start: "early", layout: "sequence", style: "blocks" } });
    const cas = g.data.extra!.cascade!;
    c.extras.cascade = cas;
    const cascade = part({
      label: "(b)", prompt: "Draw a cascade diagram (Gantt chart) for the project, assuming that each activity starts as early as possible.",
      marks: [B("M1", `Translates the information in the activity network into a diagram showing and labelling all ${c.n} activities`), B("A1", `All ${criticalActivities(c.base.acts).length} critical activities shown correctly, either on individual rows or all on a single row`), B("A1", "Draws a fully correct diagram, including all floats")],
      model: [], working: steps, chart: "cascade", onDiagram: true,
      blank: stepOf({ ...allTimes(c.base) }, "cascade", { ganttView: { bars: [], floats: [] } }),
      stepView: stepOf({ ...allTimes(c.base) }, "cascade", { ganttView: { bars: cas.bars.map((b) => b.id), floats: cas.bars.filter((b) => !b.critical).map((b) => b.id) } }),
    });
    const parts = [times, second, cascade];
    if (q3) parts.push(changePart(c, "(c)", { changeCase: "remove" }, () => true, [
      B("B1", "Explains that another activity now becomes critical (or that the earliest start times of the later activities decrease)"),
      B("B1", "Deduces that the minimum completion time reduces"),
    ], (_g2, ch) => `The project team find that activity ${ch!.id} is not necessary and remove it from the project. Explain the effect removing activity ${ch!.id} has on the minimum completion time of the project.`));
    return { intro: `A project is broken down into ${activitiesText(c)}. The activity network for the project is shown. The duration of each activity is given in ${c.unit}.`, parts, q: { view: durOnly } };
  },
  // AL Q5
  alTable: (c) => {
    const times = timesPart(c, "(a)(ii)", [
      B("M1", "Finds correctly the earliest start time for the activities that follow two others"),
      B("A1", "Finds correctly the earliest start time for each activity on the network"),
      B("B1", "Finds correctly the latest finish time for each activity on the network"),
    ], "Find the earliest start time and the latest finish time for each activity and show these values on the activity network.");
    const net = networkPart(c, "(a)(i)", [B("M1", `Constructs an activity network with at least ${Math.max(6, c.n - 2)} labelled activities drawn and at least 4 connections`), B("A1", "Activity network fully correct with all activities and connections (condone omission of arrows)")], false);
    const hist = histPart(c, "(c)(i)", [B("M1", `Draws a resource histogram with a consistent vertical scale with at least ${Math.max(6, c.n - 2)} labelled regions. Must have a correct critical path on the bottom row (condone floats, but do not condone overhangs)`), B("A1", "Draws the correct resource histogram")]);
    const lev = levelPart(c, "(c)(ii)", (i) => [
      B("M1", `Evaluates the effect of only having ${i.limit} members of the team working on the project by noting that ${i.clash} cannot be carried out simultaneously (needing ${i.need} members)`),
      B("R1", `Explains correctly that the minimum completion time for the project increases to ${i.T2} ${c.unit}`),
    ], (limit) => `The boss assigns ${limit} members of the team to work on the project. Explain the effect this has on the minimum completion time for the project. You may use the diagram in your answer.`);
    const parts = [net, times, critPart(c, "(b)", "paths"), hist, lev];
    return { intro: `A team is undertaking a project broken down into ${activitiesText(c)}, as shown in the precedence table (durations in ${c.unit}). Each activity requires one member of the team.`, parts, q: { view: { shown: [] }, table: "full" } };
  },
  // AL Q2
  alHist: (c) => {
    const crit = critPart(c, "(a)", "path");
    const hist = histPart(c, "(b)", [B("M1", `Draws a resource histogram with at least ${Math.max(6, c.n - 2)} labelled activities`), B("A1", "Draws a resource histogram with the first activities drawn correctly"), B("A1", "Draws a fully correct resource histogram")]);
    const lev = levelPart(c, "(c)", (i) => [
      B("M1", `Shows that activities ${i.clash} cannot be carried out simultaneously on the histogram`),
      B("A1", "Draws a fully correct, labelled and levelled resource histogram"),
      B("A1", `Obtains ${i.T2} ${c.unit}. Condone missing units`),
    ], (limit) => `Only ${limit} workers are available to work on the project. Find the minimum completion time for the project. Use the diagram in your answer.`);
    return { intro: `A project is broken down into ${activitiesText(c)}. The diagram shows the completed activity network, with the earliest start time, duration, latest finish time and the number of workers required for each activity. All times are in ${c.unit}.`, parts: [crit, hist, lev], q: { view: allTimes(c.base), workers: true } };
  },
  // AL Q6
  alShorten: (c) => {
    const times = timesPart(c, "(a)", [B("B1", "Finds the correct earliest start time for each activity"), B("B1", "Finds the correct latest finish time for each activity")], "Complete the activity network.");
    const { g, steps } = sub(c, "cpaShorten", { shortenCase: Math.random() < 0.5 ? "trap" : "simple" });
    const S = g.data.extra!.shorten!;
    const shorten = part({
      label: "(b)", prompt: `The duration of a single activity can be reduced to ${S.to} ${c.unit.replace(/s$/, "")} by using specialist equipment. State, with a reason, which activity should have its duration reduced in order to minimise the completion time for the project.`,
      marks: [B("M1", "Evaluates the effects of reducing the duration of one of the activities on the project completion time"), B("M1", "Compares the effects of reducing the duration of each of the critical activities on the project completion time"), B("R1", "Correctly deduces the activity which should have its duration reduced, from correct reasoning")],
      model: [g.answerText], working: steps,
    });
    const limit = reasonPart(c, "(c)", "limit", () => "State one limitation of the project plan shown by the activity network. Explain how this limitation affects the project.");
    return { intro: `A small building project has ${activitiesText(c)}. The activity network for the project is shown. Each duration is given in ${c.unit}.`, parts: [times, shorten, limit], q: { view: durOnly } };
  },
  // AL Q4
  alPick: (c) => {
    const { g, steps } = sub(c, "cpaLevel", { levelType: "extra", levelAsk: "choose", histShape: "step" });
    const L = g.data.extra!.level!;
    c.extras.level = L;
    const right = L.choices!.findIndex((x) => x.fault === "none");
    const pick = part({
      label: "(a)", prompt: `${g.prompt.replace(/^The activity network represents [^.]*\. The times are in \w+\. /, "")}`,
      marks: [B("B1", "Ticks the correct box")], model: [g.answerText], working: steps, chart: "choose", onDiagram: false,
      stepView: stepOf({ ...allTimes(c.base) }, "choose", { histView: { blocks: [], option: right } }),
    });
    return { intro: `A company undertakes a project of ${activitiesText(c)}. The diagram shows the activity network, and the three histograms below show possible levelled resource histograms for the project.`, parts: [pick], q: { view: allTimes(c.base), chart: "choose", workers: c.base.acts.some((a) => (a.workers ?? 1) > 1) } };
  },
  // legacy style
  alAlloc: (c) => {
    const times = timesPart(c, "(a)", [B("B1", "Finds the correct earliest start time for each activity"), B("B1", "Finds the correct latest finish time for each activity")]);
    const crit = critPart(c, "(b)", "paths");
    const hist = histPart(c, "(c)", [B("M1", "A histogram with the critical activities along the bottom, all activities labelled"), B("A1", "Correct heights and widths for the critical activities"), B("A1", "Fully correct histogram with no holes")]);
    const lev = levelPart(c, "(d)(i)", (i) => [B("M1", `Identifies the problem: ${i.clash} cannot all run at once with ${i.limit} workers`), B("A1", `The minimum completion time is ${i.T2} ${c.unit}`)], (limit) => `Only ${limit} workers are available. Find the minimum completion time for the project.`);
    const { g, steps } = sub(c, "cpaAlloc", { allocKind: "fixed", allocWorkers: c.extras.level!.limit });
    const A = g.data.extra!.alloc!;
    c.extras.alloc = A;
    const alloc = part({
      label: "(d)(ii)", prompt: `Allocate the activities to the ${A.workers} workers so that this new minimum time can be achieved.`,
      marks: [B("B1", "Each worker has a list of activities that do not overlap in time"), B("B1", "The allocation respects the order of the activities and finishes in the new minimum time")],
      model: [g.answerText.replace(/^.*?\)\.\s*/, "")], working: steps, chart: "alloc", onDiagram: false,
      stepView: stepOf({ ...allTimes(c.base) }, "alloc", { ganttView: { bars: A.chart.bars.map((b) => b.id), floats: [] } }),
    });
    return { intro: `A project is broken down into ${activitiesText(c)}. The completed activity network, with the number of workers each activity needs, is shown. All times are in ${c.unit}. (This question is in the style of the earlier specification, which also set worker allocation.)`, parts: [times, crit, hist, lev, alloc], q: { view: allTimes(c.base), workers: true } };
  },
};

// ── base networks per chain ──────────────────────────────────────────────────
interface Spec { paths: "one" | "more"; workers?: "one" | "several"; ok?: (d: CpaProblemData) => boolean; skip?: boolean }
const SPEC: Record<CpaChain, Spec> = {
  asBuild: { paths: "one" },
  asClaim: { paths: "more" },
  asChange: { paths: "one" },
  asClock: { paths: "one", ok: (d) => { const src = d.acts.filter((a) => a.preds.length === 0); return src.length >= 2 && src.filter((a) => d.times.float[a.id] === 0).length === 1; } },
  asMissing: { paths: "one" },
  alCascade: { paths: "one" },
  alTable: { paths: "more", workers: "one" },
  alHist: { paths: "one", workers: "several" },
  alShorten: { paths: "one" },
  alPick: { paths: "one", workers: "one" },
  alAlloc: { paths: "one", workers: "one" },
};
const AS_SET = new Set<CpaChain>(AS_CHAINS);

/** one exam-style question: the network, the context and the chain of parts */
export function generateCpaExam(level: number, chain: CpaChain | "asAny" | "alAny", opts: CpaGenOptions = {}): DecisionProblem {
  const pickFrom = (arr: CpaChain[]) => arr[Math.floor(Math.random() * arr.length)];
  // the all-multiple-choice chains (circle one of four, tick the correct histogram) are no longer offered, alone or in a mixed question
  const ch: CpaChain = chain === "asAny" ? pickFrom(AS_CHAINS.filter((c) => c !== "asMissing")) : chain === "alAny" ? pickFrom(AL_CHAINS.filter((c) => c !== "alPick")) : chain;
  const lv = (level >= 2 ? 2 : 1) as 1 | 2;
  // 8–9 activities, then 10–12 (the sizes of the papers)
  // choosing a levelled histogram stays at 8–9 activities (three whole histograms must fit on the screen); its second level has several workers each instead
  const genLevel: CpaLevel = ch === "alPick" ? 2 : lv === 1 ? 2 : 3;
  const spec = ch === "alPick" ? { ...SPEC.alPick, workers: lv === 1 ? ("one" as const) : ("several" as const) } : SPEC[ch];
  let lastErr: unknown;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const o: CpaGenOptions = { ...opts, paths: spec.paths, size: opts.size ?? (AS_SET.has(ch) && genLevel === 2 ? "small" : "medium") };
      const first = generateCpa(genLevel, "cpaFull", o);
      if (spec.ok && !spec.ok(first.data)) continue;
      const fixed: Fixed = { acts: first.data.acts, layout: first.data.layout };
      if (spec.workers) first.data.acts.forEach((a) => { a.workers = spec.workers === "several" ? 1 + Math.floor(Math.random() * 3) : 1; });
      const c: Ctx = { level: genLevel, opts: o, fixed, base: first.data, unit: first.data.unit, n: first.data.acts.length, extras: {} };
      const b = BUILDERS[ch](c);
      const parts = b.parts;
      const total = parts.reduce((s, p) => s + p.marks, 0);
      const base: CpaProblemData = { ...first.data, kind: "cpaExam", extra: { ...c.extras, examQ: b.q } };
      const exam = { id: `cpaexam${Math.floor(Math.random() * 1e9)}`, intro: b.intro, parts, totalMarks: total, minutes: Math.max(3, Math.round(total * 1.1)) };
      return {
        network: { nodes: [], edges: [] }, kind: "cpaExam", level: lv, cpa: base, prompt: b.intro, answer: { text: "" }, matrixMode: "off", exam, templateId: ch,
      } as unknown as DecisionProblem;
    } catch (e) { lastErr = e; }
  }
  throw lastErr instanceof Error ? lastErr : new Error("exam: no question");
}

