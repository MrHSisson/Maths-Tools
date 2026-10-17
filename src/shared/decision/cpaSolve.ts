// ═══════════════════════════════════════════════════════════════════════════
// Critical Path Analysis — the working. One SolveStep per move a teacher would make at the board: draw the next box and its arrows,
// fill the next earliest start (showing the finishes that are compared and the largest taken), fill the next latest finish (the latest
// starts compared and the smallest taken), then the float and the critical path. Every number is read from cpaTimes (cpa.ts).
// ═══════════════════════════════════════════════════════════════════════════

import { END, START, clockTime, cpaEdges, cpaList, criticalActivities, fullGraph, successorsOf, type CpaViewState } from "./cpa";
import type { DecisionProblem, SolveStep } from "./types";

const beat = (caption: string, view: CpaViewState, phase?: string, extra?: Partial<SolveStep>): SolveStep => ({
  caption, phase, edgeStates: {}, cpaView: view, ...extra,
});

export function solveCpa(p: DecisionProblem): SolveStep[] {
  const d = p.cpa!;
  switch (d.kind) {
    case "cpaNetwork": return solveNetwork(p);
    case "cpaTable": return solveTable(p);
    case "cpaForward": return solvePasses(p, false);
    case "cpaFull": return solvePasses(p, true);
    case "cpaPaths": return solvePaths(p);
    case "cpaUnknown": return solveUnknown(p);
    case "cpaChange": return solveChange(p);
    case "cpaContext": return solveContext(p);
    default: return solveFloat(p);
  }
}

// The critical paths as the picture and the caption need them: every box and arrow on one, and the sentence naming them.
function criticalPathInfo(paths: string[][]) {
  const onPaths = [...new Set(paths.flat())];
  const arrows = [...new Set(paths.flatMap((p) => p.slice(1).map((id, i) => `${p[i]}→${id}`)))];
  const text = paths.length > 1
    ? `There are ${paths.length} critical paths: ${paths.map((p) => p.join(" – ")).join(" and ")}.`
    : `The critical path is ${paths[0].join(" – ")}.`;
  return { onPaths, arrows, text };
}

// ── Table → network ──────────────────────────────────────────────────────────
function solveNetwork(p: DecisionProblem): SolveStep[] {
  const d = p.cpa!;
  const all = fullGraph(d.acts);
  const edges = cpaEdges(all);
  const steps: SolveStep[] = [];
  const shown: string[] = [];
  const arrows: string[] = [];
  const draw = (ids: string[], newArrows: string[]) => { shown.push(...ids); arrows.push(...newArrows); };
  const snap = (current: string[], focus: string[]): CpaViewState => ({ shown: [...shown], arrows: [...arrows], compare: current, focusArrows: focus });

  const sources = d.acts.filter((a) => a.preds.length === 0).map((a) => a.id);
  const startArrows = sources.map((s) => `${START}→${s}`);
  draw([START, ...sources], startArrows);
  steps.push(beat(
    `${cpaList(sources)} ${sources.length > 1 ? "have" : "has"} nothing before ${sources.length > 1 ? "them" : "it"} in the table, so ${sources.length > 1 ? "they all follow" : "it follows"} Start. Draw Start, then ${cpaList(sources)}, with an arrow from Start to ${sources.length > 1 ? "each" : "it"}.`,
    snap(sources, startArrows), "Start",
  ));
  // each later activity once everything before it is drawn (the order of the network's columns)
  const order = all.filter((a) => a.id !== START && a.id !== END && a.preds.some((x) => x !== START)).map((a) => a.id);
  for (const id of order) {
    const a = d.acts.find((x) => x.id === id)!;
    const newArrows = a.preds.map((q) => `${q}→${id}`);
    draw([id], newArrows);
    steps.push(beat(
      `${id} can only start when ${cpaList(a.preds)} ${a.preds.length > 1 ? "are" : "is"} finished. Draw ${id}, with an arrow from ${a.preds.length > 1 ? "each of them" : a.preds[0]} to ${id}.`,
      snap([id], newArrows), `Activity ${id}`,
    ));
  }
  const sinks = d.acts.filter((a) => !d.acts.some((b) => b.preds.includes(a.id))).map((a) => a.id);
  const endArrows = sinks.map((s) => `${s}→${END}`);
  draw([END], endArrows);
  steps.push(beat(
    `Nothing comes after ${cpaList(sinks)}, so ${sinks.length > 1 ? "they all go" : "it goes"} to End. Draw End, with an arrow from ${sinks.length > 1 ? "each" : "it"} to End.`,
    snap(sinks, endArrows), "End",
  ));
  void edges;
  steps.push(beat(`The network is complete: every row of the table is an arrow into that activity.`, { shown: [...shown], arrows: [...arrows] }, "Check"));
  return steps;
}

// ── Forward pass (and the backward pass, float and critical path for the full analysis) ──
function solvePasses(p: DecisionProblem, full: boolean): SolveStep[] {
  const d = p.cpa!;
  const { times: t } = d;
  const all = fullGraph(d.acts);
  const succ = successorsOf(all);
  const dur = Object.fromEntries(all.map((a) => [a.id, a.duration]));
  const steps: SolveStep[] = [];
  const es: Record<string, number> = { [START]: 0 };
  const lf: Record<string, number> = {};
  const snap = (extra: Partial<CpaViewState> = {}): CpaViewState => ({ es: { ...es }, lf: { ...lf }, ...extra });

  const sources = d.acts.filter((a) => a.preds.length === 0).map((a) => a.id);
  sources.forEach((s) => (es[s] = 0));
  steps.push(beat(
    `Forward pass. Start is at time 0. ${cpaList(sources)} ${sources.length > 1 ? "have" : "has"} nothing before ${sources.length > 1 ? "them" : "it"}, so ${sources.length > 1 ? "they start" : "it starts"} at 0.`,
    snap({ compare: [START, ...sources] }), "Forward pass",
  ));
  for (const a of all) {
    if (a.id === START || a.preds.length === 0 || (a.preds.length === 1 && a.preds[0] === START)) continue;
    es[a.id] = t.es[a.id];
    const preds = a.preds;
    if (a.id === END) {
      steps.push(beat(
        `End: ${preds.map((q) => `${q} finishes at ${t.es[q]} + ${dur[q]} = ${t.ef[q]}`).join("; ")}. The largest is ${t.es[END]}, so the minimum completion time is ${t.es[END]} ${d.unit}.`,
        snap({ current: END, compare: preds }), "Forward pass", { runningTotal: t.es[END], totalLabel: "Minimum time" },
      ));
    } else if (preds.length === 1) {
      const q = preds[0];
      steps.push(beat(
        `${a.id} follows ${q}, which finishes at ${t.es[q]} + ${dur[q]} = ${t.ef[q]}. So ${a.id} starts at ${t.es[a.id]}.`,
        snap({ current: a.id, compare: [q] }), `Earliest start of ${a.id}`,
      ));
    } else {
      steps.push(beat(
        `${a.id} follows ${cpaList(preds)}. They finish at ${preds.map((q) => `${t.ef[q]}`).join(" and ")} (${preds.map((q) => `${q}: ${t.es[q]} + ${dur[q]}`).join(", ")}). ${a.id} cannot start until the last is done: the largest, ${t.es[a.id]}.`,
        snap({ current: a.id, compare: preds }), `Earliest start of ${a.id}`,
      ));
    }
  }
  if (!full) return steps;

  // backward pass
  lf[END] = t.projectTime;
  steps.push(beat(
    `Backward pass. Start at End: its latest finish is the minimum completion time, ${t.projectTime}.`,
    snap({ current: END }), "Backward pass",
  ));
  for (const a of [...all].reverse()) {
    if (a.id === END) continue;
    lf[a.id] = t.lf[a.id];
    const ss = succ[a.id];
    if (a.id === START) {
      steps.push(beat(`Check: working back to Start gives a latest finish of ${t.lf[START]}, so the times agree.`, snap({ current: START, compare: ss }), "Backward pass"));
    } else if (ss.length === 1 && ss[0] === END) {
      steps.push(beat(`${a.id} is followed only by End, so its latest finish is ${t.projectTime}.`, snap({ current: a.id, compare: [END] }), `Latest finish of ${a.id}`));
    } else if (ss.length === 1) {
      const s = ss[0];
      steps.push(beat(
        `${a.id} is followed by ${s}, which must start by ${t.lf[s]} − ${dur[s]} = ${t.ls[s]}. So ${a.id} must finish by ${t.lf[a.id]}.`,
        snap({ current: a.id, compare: [s] }), `Latest finish of ${a.id}`,
      ));
    } else {
      steps.push(beat(
        `${a.id} is followed by ${cpaList(ss)}. They must start by ${ss.map((s) => `${s}: ${t.lf[s]} − ${dur[s]} = ${t.ls[s]}`).join(", ")}. ${a.id} must finish before the first of them: the smallest, ${t.lf[a.id]}.`,
        snap({ current: a.id, compare: ss }), `Latest finish of ${a.id}`,
      ));
    }
  }
  // float, critical activities, critical path
  const crit = criticalActivities(d.acts);
  const { onPaths, arrows: critArrows, text: pathText } = criticalPathInfo(d.criticalPaths);
  steps.push(beat(
    `Float = latest finish − earliest start − duration. The activities with float 0 are critical: ${cpaList(crit)}.`,
    snap({ critical: crit }), "Critical activities",
  ));
  steps.push(beat(
    `${pathText} The minimum completion time is ${t.projectTime} ${d.unit}.`,
    snap({ critical: onPaths, criticalArrows: critArrows }), d.criticalPaths.length > 1 ? "Critical paths" : "Critical path", { runningTotal: t.projectTime, totalLabel: "Minimum time" },
  ));
  return steps;
}

// ── Float ────────────────────────────────────────────────────────────────────
function solveFloat(p: DecisionProblem): SolveStep[] {
  const d = p.cpa!;
  const { times: t } = d;
  const all = fullGraph(d.acts);
  const everyEs = Object.fromEntries(all.map((a) => [a.id, t.es[a.id]]));
  const everyLf = Object.fromEntries(all.map((a) => [a.id, t.lf[a.id]]));
  const steps: SolveStep[] = [];
  const float: Record<string, number> = {};
  const snap = (extra: Partial<CpaViewState> = {}): CpaViewState => ({ es: everyEs, lf: everyLf, float: { ...float }, ...extra });
  steps.push(beat(
    "Float = latest finish − earliest start − duration: the time an activity can be delayed without delaying the project.",
    snap(), "Float",
  ));
  for (const a of all) {
    if (a.id === START || a.id === END) continue;
    float[a.id] = t.float[a.id];
    steps.push(beat(
      `${a.id}: ${t.lf[a.id]} − ${t.es[a.id]} − ${a.duration} = ${t.float[a.id]}${t.float[a.id] === 0 ? ". No float, so it is critical." : "."}`,
      snap({ current: a.id }), `Float of ${a.id}`,
    ));
  }
  const crit = criticalActivities(d.acts);
  const { onPaths, arrows: critArrows, text: pathText } = criticalPathInfo(d.criticalPaths);
  steps.push(beat(
    `The critical activities are those with float 0: ${cpaList(crit)}. ${pathText}`,
    snap({ critical: onPaths, criticalArrows: critArrows }), "Critical activities",
  ));
  return steps;
}

// ── Network → table ──────────────────────────────────────────────────────────
function solveTable(p: DecisionProblem): SolveStep[] {
  const d = p.cpa!;
  const steps: SolveStep[] = [];
  const done: string[] = [];
  steps.push(beat(
    "Read the table from the network one activity at a time. For each activity, look at the arrows coming INTO its box: they come from its immediate predecessors. An arrow from Start means there is nothing before it.",
    { tableDone: [] }, "Precedence table",
  ));
  for (const a of d.acts) {
    done.push(a.id);
    const arrows = (a.preds.length ? a.preds : [START]).map((q) => `${q}→${a.id}`);
    steps.push(beat(
      a.preds.length === 0
        ? `${a.id} has an arrow in from Start only, so nothing has to be finished before it: write a dash.`
        : a.preds.length === 1
          ? `${a.id} has one arrow in, from ${a.preds[0]}. So ${a.preds[0]} is its immediate predecessor.`
          : `${a.id} has ${a.preds.length} arrows in, from ${cpaList(a.preds)}. All of them must be finished first.`,
      { tableDone: [...done], current: a.id, focusArrows: arrows }, `Activity ${a.id}`,
    ));
  }
  steps.push(beat("Check: every arrow in the network (apart from those to Start and End) appears once in the table.", { tableDone: [...done] }, "Check"));
  return steps;
}

// ── Critical activities and every critical path, from a network already filled in ──
function solvePaths(p: DecisionProblem): SolveStep[] {
  const d = p.cpa!;
  const { times: t } = d;
  const all = fullGraph(d.acts);
  const everyEs = Object.fromEntries(all.map((a) => [a.id, t.es[a.id]]));
  const everyLf = Object.fromEntries(all.map((a) => [a.id, t.lf[a.id]]));
  const base: CpaViewState = { es: everyEs, lf: everyLf };
  const crit = criticalActivities(d.acts);
  const steps: SolveStep[] = [];
  steps.push(beat(
    "An activity is critical when it has no float: latest finish − earliest start = duration. Check each activity.",
    { ...base }, "Critical activities",
  ));
  const rows = d.acts.map((a) => `${a.id}: ${t.lf[a.id]} − ${t.es[a.id]} = ${t.lf[a.id] - t.es[a.id]}${t.float[a.id] === 0 ? ` = ${a.duration}` : ` (duration ${a.duration}, float ${t.float[a.id]})`}`);
  steps.push(beat(`${rows.join("; ")}. The critical activities are ${cpaList(crit)}.`, { ...base, critical: crit }, "Critical activities"));
  d.criticalPaths.forEach((path, i) => {
    const arrows = path.slice(1).map((id, k) => `${path[k]}→${id}`);
    steps.push(beat(
      `${d.criticalPaths.length > 1 ? `Critical path ${i + 1}: ` : "Follow the arrows from Start to End through critical activities only: "}${path.join(" – ")}.`,
      { ...base, critical: path, criticalArrows: arrows }, d.criticalPaths.length > 1 ? `Critical path ${i + 1}` : "Critical path",
    ));
  });
  const near = d.acts.filter((a) => t.float[a.id] > 0 && t.float[a.id] <= 2).map((a) => a.id);
  const { onPaths, arrows, text } = criticalPathInfo(d.criticalPaths);
  steps.push(beat(
    `${text} The minimum completion time is ${t.projectTime} ${d.unit}.${near.length ? ` ${cpaList(near)} ${near.length > 1 ? "have" : "has"} a little float, so ${near.length > 1 ? "are" : "is"} not critical.` : ""}`,
    { ...base, critical: onPaths, criticalArrows: arrows }, d.criticalPaths.length > 1 ? "Critical paths" : "Critical path", { runningTotal: t.projectTime, totalLabel: "Minimum time" },
  ));
  return steps;
}

// ── A missing duration x on the critical path ────────────────────────────────
function solveUnknown(p: DecisionProblem): SolveStep[] {
  const d = p.cpa!;
  const u = d.extra!.unknown!;
  const T = d.times.projectTime;
  const arrows = u.path.slice(1).map((id, k) => `${u.path[k]}→${id}`);
  const onPath = u.path.slice(1, -1);
  const known = onPath.filter((id) => id !== u.id);
  const labels = { [u.id]: "x" };
  const steps: SolveStep[] = [];
  steps.push(beat(
    `The critical path is ${u.path.join(" – ")}. On the critical path the durations add up to the minimum completion time.`,
    { critical: u.path, criticalArrows: arrows, durLabels: labels }, "Critical path",
  ));
  const dur = (id: string) => d.acts.find((a) => a.id === id)!.duration;
  steps.push(beat(
    `Add the durations on the path: ${known.map((id) => dur(id)).join(" + ")}${known.length ? " + " : ""}x = ${T}, so ${u.sumOthers} + x = ${T}.`,
    { critical: u.path, criticalArrows: arrows, durLabels: labels, compare: known }, "Form an equation",
  ));
  steps.push(beat(
    `x = ${T} − ${u.sumOthers} = ${u.x}. Activity ${u.id} takes ${u.x} ${d.unit}.`,
    { critical: u.path, criticalArrows: arrows, durLabels: { [u.id]: String(u.x) }, current: u.id }, "Solve", { runningTotal: u.x, totalLabel: `x` },
  ));
  return steps;
}

// ── A delay (compared with the float) or a shortened critical activity ───────
function solveChange(p: DecisionProblem): SolveStep[] {
  const d = p.cpa!;
  const c = d.extra!.change!;
  const { times: t } = d;
  const all = fullGraph(d.acts);
  const origEs = Object.fromEntries(all.map((a) => [a.id, t.es[a.id]]));
  const origLf = Object.fromEntries(all.map((a) => [a.id, t.lf[a.id]]));
  const origFloat = Object.fromEntries(all.filter((a) => a.id !== START && a.id !== END).map((a) => [a.id, t.float[a.id]]));
  const nt = c.newTimes;
  const newDur = d.acts.find((a) => a.id === c.id)!.duration + (c.mode === "shorten" ? -c.amount : c.amount);
  const base: CpaViewState = { es: origEs, lf: origLf, float: origFloat };
  const steps: SolveStep[] = [];
  const after = (extra: Partial<CpaViewState> = {}): CpaViewState => ({
    es: Object.fromEntries(all.map((a) => [a.id, nt.es[a.id]])), lf: Object.fromEntries(all.map((a) => [a.id, nt.lf[a.id]])),
    float: Object.fromEntries(all.filter((a) => a.id !== START && a.id !== END).map((a) => [a.id, nt.float[a.id]])),
    durLabels: { [c.id]: String(newDur) }, ...extra,
  });
  const newCrit = [...new Set(c.newCriticalPaths.flat())];
  const newArrows = [...new Set(c.newCriticalPaths.flatMap((q) => q.slice(1).map((id, k) => `${q[k]}→${id}`)))];
  const nT = nt.projectTime;
  if (c.mode === "shorten") {
    steps.push(beat(`${c.id} has float 0, so it is critical: the minimum completion time is ${t.projectTime} ${d.unit}, and shortening a critical activity can reduce it.`, { ...base, current: c.id }, "Before the change"));
    steps.push(beat(`${c.id} now takes ${d.acts.find((a) => a.id === c.id)!.duration} − ${c.amount} = ${newDur}. Do the forward pass again with the new duration.`, after({ current: c.id, critical: newCrit, criticalArrows: newArrows }), "After the change", { runningTotal: nT, totalLabel: "New time" }));
    const saved = t.projectTime - nT;
    steps.push(beat(
      saved === c.amount
        ? `The new minimum completion time is ${nT} ${d.unit}, a saving of ${saved} ${d.unit}: the whole reduction is saved, because ${c.id} is still on the critical path.`
        : `The new minimum completion time is ${nT} ${d.unit}, a saving of ${saved} ${d.unit}, not ${c.amount}. Another path of length ${nT} is now critical (${c.newCriticalPaths.map((q) => q.join(" – ")).join(" and ")}), so the time cannot fall further.`,
      after({ critical: newCrit, criticalArrows: newArrows }), "Conclusion", { runningTotal: nT, totalLabel: "New time" },
    ));
    return steps;
  }
  steps.push(beat(`The float of ${c.id} is ${c.float} ${d.unit}: it can be delayed by that much without delaying the project.`, { ...base, current: c.id }, "Float"));
  const cmp = c.mode === "less" ? "less than" : c.mode === "equal" ? "equal to" : "more than";
  steps.push(beat(`The delay is ${c.amount} ${d.unit}, which is ${cmp} the float of ${c.float}.`, { ...base, current: c.id }, "Compare the delay with the float"));
  steps.push(beat(
    c.mode === "more"
      ? `The delay uses up the float and ${c.amount} − ${c.float} = ${c.amount - c.float} ${d.unit} more, so the project is delayed by ${c.amount - c.float}. The new minimum completion time is ${nT} ${d.unit}.`
      : c.mode === "equal"
        ? `The delay uses up all the float, so the project is not delayed: the time stays ${t.projectTime} ${d.unit}. ${c.id} now has no float, so it becomes critical.`
        : `The delay is smaller than the float, so the project is not delayed: the time stays ${t.projectTime} ${d.unit}.`,
    after({ current: c.id, critical: c.mode === "less" ? undefined : newCrit, criticalArrows: c.mode === "less" ? undefined : newArrows }), "Conclusion", { runningTotal: nT, totalLabel: "New time" },
  ));
  return steps;
}

// ── Clock times: the full analysis, then convert ─────────────────────────────
function solveContext(p: DecisionProblem): SolveStep[] {
  const d = p.cpa!;
  const clk = d.extra!.clock!;
  const { times: t } = d;
  const steps = solvePasses(p, true).filter((s) => s.phase !== "Critical activities" && s.phase !== "Critical path" && s.phase !== "Critical paths");
  const last = steps[steps.length - 1].cpaView!;
  const target = d.acts.find((a) => a.id === clk.latestId)!;
  const ls = t.lf[target.id] - target.duration;
  steps.push(beat(
    `The project takes ${t.projectTime} minutes and work starts at ${clockTime(clk.startMins)}. ${clockTime(clk.startMins)} + ${t.projectTime} minutes = ${clockTime(clk.startMins + t.projectTime)}. The earliest the project can finish is ${clockTime(clk.startMins + t.projectTime)}.`,
    { ...last, current: END }, "Finish time", { runningTotal: t.projectTime, totalLabel: "Minutes" },
  ));
  steps.push(beat(
    `The latest start of ${target.id} is its latest finish − its duration = ${t.lf[target.id]} − ${target.duration} = ${ls} minutes after the start. ${clockTime(clk.startMins)} + ${ls} minutes = ${clockTime(clk.startMins + ls)}.`,
    { ...last, current: target.id }, `Latest start of ${target.id}`,
  ));
  return steps;
}
