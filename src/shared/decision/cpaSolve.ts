// ═══════════════════════════════════════════════════════════════════════════
// Critical Path Analysis — the working. One SolveStep per move a teacher would make at the board: draw the next box and its arrows,
// fill the next earliest start (showing the finishes that are compared and the largest taken), fill the next latest finish (the latest
// starts compared and the smallest taken), then the float and the critical path. Every number is read from cpaTimes (cpa.ts).
// ═══════════════════════════════════════════════════════════════════════════

import { END, START, clockTime, cpaEdges, cpaList, cpaTimes, criticalActivities, fullGraph, successorsOf, type CpaViewState } from "./cpa";
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
    case "cpaCascade": return solveCascade(p);
    case "cpaHistogram": return solveHistogram(p);
    case "cpaLevel": return solveLevel(p);
    case "cpaAlloc": return solveAlloc(p);
    case "cpaShorten": return solveShorten(p);
    case "cpaReason": return solveReason(p);
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
  if (d.extra?.first) return solveFirst(p);
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
  if (u.box) return solveUnknownBox(p);
  if (u.where === "off") return solveUnknownOff(p);
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
// The changed network is recalculated on the picture: the new duration first, then each earliest start that changes (left to right),
// each latest finish that changes (right to left), then the new floats — so the class sees WHICH boxes move, and why.
function solveChange(p: DecisionProblem): SolveStep[] {
  const d = p.cpa!;
  const c = d.extra!.change!;
  const { times: t } = d;
  const nt = c.newTimes;
  const all = fullGraph(d.acts);
  const byId = new Map(all.map((a) => [a.id, a]));
  const succ = successorsOf(all);
  const real = all.filter((a) => a.id !== START && a.id !== END);
  const oldDur = d.acts.find((a) => a.id === c.id)!.duration;
  const newDur = oldDur + (c.mode === "shorten" || c.mode === "remove" ? -c.amount : c.amount);
  const dur = (id: string) => (id === START || id === END ? 0 : id === c.id ? newDur : d.acts.find((a) => a.id === id)!.duration);
  const es: Record<string, number> = Object.fromEntries(all.map((a) => [a.id, t.es[a.id]]));
  const lf: Record<string, number> = Object.fromEntries(all.map((a) => [a.id, t.lf[a.id]]));
  const labels = { [c.id]: String(newDur) };
  const origFloat = Object.fromEntries(real.map((a) => [a.id, t.float[a.id]]));
  const newCrit = [...new Set(c.newCriticalPaths.flat())];
  const newArrows = [...new Set(c.newCriticalPaths.flatMap((q) => q.slice(1).map((id, k) => `${q[k]}→${id}`)))];
  const T = t.projectTime, nT = nt.projectTime;
  const word = (a: number, b: number) => (b > a ? "rises" : "falls");
  const snap = (extra: Partial<CpaViewState> = {}): CpaViewState => ({ es: { ...es }, lf: { ...lf }, ...extra });
  const steps: SolveStep[] = [];

  // 1. the situation, and what the change is
  if (c.mode === "remove") {
    steps.push(beat(`${c.id} has float 0, so it is critical: the minimum completion time is ${T} ${d.unit}. Taking ${c.id} out of the project is the same as it taking 0 ${d.unit}, with everything before and after it kept in place.`, snap({ float: origFloat, current: c.id }), "Before the change"));
    steps.push(beat(`${c.id} now takes 0. Recalculate: only the times that depend on ${c.id} can change.`, snap({ durLabels: labels, current: c.id }), "The change"));
  } else if (c.mode === "shorten") {
    steps.push(beat(`${c.id} has float 0, so it is critical: the minimum completion time is ${T} ${d.unit}, and making a critical activity quicker can reduce it.`, snap({ float: origFloat, current: c.id }), "Before the change"));
    steps.push(beat(`${c.id} now takes ${oldDur} − ${c.amount} = ${newDur}. Recalculate: only the times that depend on ${c.id} can change.`, snap({ durLabels: labels, current: c.id }), "The change"));
  } else if (c.mode === "range") {
    steps.push(beat(`The float of ${c.id} is ${c.float} ${d.unit}: it can be delayed by that much without delaying the project.`, snap({ float: origFloat, current: c.id }), "Float"));
    steps.push(beat(`The increase could be anything up to ${c.amount}. If it is ${c.float} or less, it is within the float and nothing changes. If it is more than ${c.float}, the project is delayed by the excess over ${c.float}. At worst ${c.amount} − ${c.float} = ${c.amount - c.float}. Check the worst case: ${c.id} takes ${oldDur} + ${c.amount} = ${newDur}.`, snap({ durLabels: labels, current: c.id, float: origFloat }), "Worst case"));
  } else {
    steps.push(beat(`The float of ${c.id} is ${c.float} ${d.unit}: it can be delayed by that much without delaying the project.`, snap({ float: origFloat, current: c.id }), "Float"));
    const cmp = c.mode === "less" ? "less than" : c.mode === "equal" ? "equal to" : "more than";
    steps.push(beat(`The delay is ${c.amount} ${d.unit}, which is ${cmp} the float of ${c.float}. ${c.id} now takes ${oldDur} + ${c.amount} = ${newDur}. Recalculate the times that depend on ${c.id}.`, snap({ durLabels: labels, current: c.id, float: origFloat }), "The change"));
  }

  // 2. the earliest starts that change, left to right
  let anyEs = false;
  for (const a of all) {
    if (a.id === START || nt.es[a.id] === t.es[a.id]) continue;
    anyEs = true;
    const old = es[a.id];
    es[a.id] = nt.es[a.id];
    const pr = byId.get(a.id)!.preds;
    steps.push(beat(
      a.id === END
        ? `End: ${pr.map((q) => `${q} finishes at ${nt.ef[q]}`).join(", ")}. The largest is ${nt.es[END]}, so the minimum completion time ${word(old, nt.es[END])} from ${old} to ${nt.es[END]} ${d.unit}.`
        : `${a.id} follows ${cpaList(pr)}, which finish at ${pr.map((q) => `${es[q]} + ${dur(q)} = ${nt.ef[q]}`).join(" and ")}. The largest is ${nt.es[a.id]}, so the earliest start of ${a.id} ${word(old, nt.es[a.id])} from ${old} to ${nt.es[a.id]}.`,
      snap({ durLabels: labels, current: a.id, compare: pr }), `New earliest start of ${a.id}`,
    ));
  }
  if (!anyEs) steps.push(beat(`Forward pass again: every activity after ${c.id} still starts when it did before, so no earliest start time changes.`, snap({ durLabels: labels, current: c.id }), "Earliest starts"));

  // 3. the latest finishes that change, right to left
  let anyLf = false;
  for (const a of [...all].reverse()) {
    if (nt.lf[a.id] === t.lf[a.id]) continue;
    anyLf = true;
    const old = lf[a.id];
    lf[a.id] = nt.lf[a.id];
    const ss = succ[a.id];
    steps.push(beat(
      a.id === END
        ? `Backward pass again: End's latest finish is the new minimum completion time, ${nt.projectTime}.`
        : ss.length === 1 && ss[0] === END
          ? `${a.id} is followed only by End, so its latest finish ${word(old, nt.lf[a.id])} from ${old} to ${nt.lf[a.id]}.`
          : `${a.id} is followed by ${cpaList(ss)}, which must start by ${ss.map((q) => `${q}: ${lf[q]} − ${dur(q)} = ${nt.ls[q]}`).join(", ")}. The smallest is ${nt.lf[a.id]}, so the latest finish of ${a.id} ${word(old, nt.lf[a.id])} from ${old} to ${nt.lf[a.id]}.`,
      snap({ durLabels: labels, current: a.id, compare: a.id === END ? undefined : ss }), a.id === END ? "Backward pass" : `New latest finish of ${a.id}`,
    ));
  }
  if (!anyLf) steps.push(beat(`Backward pass again: no latest finish time changes.`, snap({ durLabels: labels, current: c.id }), "Latest finishes"));

  // 4. the new floats, and the conclusion
  const newFloat = Object.fromEntries(real.map((a) => [a.id, nt.float[a.id]]));
  const movedFloat = real.filter((a) => nt.float[a.id] !== t.float[a.id]).map((a) => a.id);
  steps.push(beat(
    `New floats: latest finish − earliest start − duration. ${movedFloat.length ? `They change for ${cpaList(movedFloat)}.` : "They are all as before."}`,
    snap({ durLabels: labels, float: newFloat, critical: c.mode === "less" ? undefined : newCrit, criticalArrows: c.mode === "less" ? undefined : newArrows }), "New floats",
  ));
  const saved = T - nT;
  if (c.named) {
    steps.push(beat(
      `The activities asked about: ${c.named.map((q) => `${q}: earliest start ${nt.es[q] === t.es[q] ? `unchanged (${t.es[q]})` : `${t.es[q]} → ${nt.es[q]}`}, latest finish ${nt.lf[q] === t.lf[q] ? `unchanged (${t.lf[q]})` : `${t.lf[q]} → ${nt.lf[q]}`}`).join("; ")}.`,
      snap({ durLabels: labels, float: newFloat, current: c.named[0], compare: c.named }), "The activities asked about",
    ));
  }
  const conclusion = c.mode === "remove"
    ? saved === c.amount
      ? `Removing ${c.id} saves all ${c.amount} ${d.unit}: the new minimum completion time is ${nT} ${d.unit}.`
      : `Removing ${c.id} saves ${saved} ${d.unit}, not ${c.amount}: another path of length ${nT} is now critical (${c.newCriticalPaths.map((q) => q.join(" – ")).join(" and ")}), so the time cannot fall further. The new minimum completion time is ${nT} ${d.unit}.`
    : c.mode === "range"
      ? `If the increase is ${c.float} or less the minimum completion time stays ${T} ${d.unit}; if it is more it rises by the excess over ${c.float}, to at most ${nT} ${d.unit} (an increase of ${c.amount - c.float}).`
      : c.mode === "shorten"
    ? saved === c.amount
      ? `The new minimum completion time is ${nT} ${d.unit}, a saving of ${saved} ${d.unit}: the whole reduction is saved, because ${c.id} is still on the critical path.`
      : `The new minimum completion time is ${nT} ${d.unit}, a saving of ${saved} ${d.unit}, not ${c.amount}. Another path of length ${nT} is now critical (${c.newCriticalPaths.map((q) => q.join(" – ")).join(" and ")}), so the time cannot fall further.`
    : c.mode === "more"
      ? `The delay uses up the float and ${c.amount} − ${c.float} = ${c.amount - c.float} ${d.unit} more, so the project is delayed by ${c.amount - c.float}. The new minimum completion time is ${nT} ${d.unit}.`
      : c.mode === "equal"
        ? `The delay uses up all the float, so the project is not delayed: the time stays ${T} ${d.unit}. ${c.id} now has no float, so it becomes critical.`
        : `The delay is smaller than the float, so the project is not delayed: the time stays ${T} ${d.unit}.`;
  steps.push(beat(conclusion, snap({ durLabels: labels, float: newFloat, critical: c.mode === "less" ? undefined : newCrit, criticalArrows: c.mode === "less" ? undefined : newArrows }), "Conclusion", { runningTotal: nT, totalLabel: "New time" }));
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
  if (clk.second) {
    const sec = clk.second;
    steps.push(beat(
      `The second project must finish at the same time, ${clockTime(clk.startMins + t.projectTime)}. First put each job in minutes: ${sec.parts.map((x) => `${x.label.toLowerCase()}: ${x.secs} seconds = ${x.secs} ÷ 60 = ${x.secs / 60} minutes${x.mins !== x.secs / 60 ? `, plus the minutes: ${x.mins} minutes` : ""}`).join("; ")}.`,
      { ...last, current: END }, "Convert to minutes",
    ));
    steps.push(beat(
      `The jobs follow one another, so the second project takes ${sec.parts.map((x) => x.mins).join(" + ")} = ${sec.total} minutes. The main project takes ${t.projectTime} minutes, so the second one has ${t.projectTime} − ${sec.total} = ${t.projectTime - sec.total} minutes to spare (its float).`,
      { ...last, current: END }, "Total and float", { runningTotal: sec.total, totalLabel: "Minutes" },
    ));
    steps.push(beat(
      `It can start as late as ${clockTime(clk.startMins)} + ${t.projectTime - sec.total} minutes = ${clockTime(clk.startMins + t.projectTime - sec.total)}. That is the latest time the first job can be started.`,
      { ...last, current: END }, "Latest start",
    ));
    return steps;
  }
  steps.push(beat(
    `The latest start of ${target.id} is its latest finish − its duration = ${t.lf[target.id]} − ${target.duration} = ${ls} minutes after the start. ${clockTime(clk.startMins)} + ${ls} minutes = ${clockTime(clk.startMins + ls)}.`,
    { ...last, current: target.id }, `Latest start of ${target.id}`,
  ));
  return steps;
}

// ── Cascade (Gantt) chart: the critical activities first, then every other activity with its float ──
function solveCascade(p: DecisionProblem): SolveStep[] {
  const d = p.cpa!;
  const c = d.extra!.cascade!;
  const { times: t } = d;
  const all = fullGraph(d.acts);
  const base: CpaViewState = { es: Object.fromEntries(all.map((a) => [a.id, t.es[a.id]])), lf: Object.fromEntries(all.map((a) => [a.id, t.lf[a.id]])) };
  const crit = criticalActivities(d.acts);
  const { arrows: critArrows } = criticalPathInfo(d.criticalPaths);
  const early = c.start === "early";
  const given = new Set(c.given ?? []);
  const bars: string[] = [...given];
  const floats: string[] = [...given].filter((id) => t.float[id] > 0);
  const steps: SolveStep[] = [];
  const g = (current?: string) => ({ bars: [...bars], floats: [...floats], current });
  const step = (caption: string, phase: string, view: CpaViewState, current?: string, extra?: Partial<SolveStep>): SolveStep => ({
    caption, phase, edgeStates: {}, cpaView: view, ganttView: g(current), ...extra,
  });
  const several = d.criticalPaths.length > 1;
  const first = d.criticalPaths[0].filter((id) => id !== START && id !== END);
  const dur = (id: string) => d.acts.find((a) => a.id === id)!.duration;
  steps.push(step(
    `A cascade chart has the time along the bottom, from 0 to ${t.projectTime} ${d.unit}, and each activity drawn as a bar as long as its duration. Every activity starts as ${early ? "early" : "late"} as possible. ${given.size ? `Part of the chart is already drawn (${cpaList([...given])}): complete it. ` : ""}${c.layout === "sequence" ? (several ? "The first critical path goes on the top row; the other critical activities each get a row." : "The critical activities go together on the top row.") : "Each activity has its own row."}`,
    "Set up", { ...base },
  ));
  if (![...crit].every((id) => given.has(id))) {
    crit.forEach((id) => { if (!bars.includes(id)) bars.push(id); });
    steps.push(step(
      `The critical activities (float 0) are ${cpaList(crit)}. ${early ? "They start at their earliest start times" : "They have no float, so early and late starts are the same"}: ${crit.map((id) => `${id} from ${t.es[id]} to ${t.es[id] + dur(id)}`).join(", ")}. ${c.layout === "sequence" ? (several ? `There is more than one critical path, so they cannot all go end to end on one row: draw ${cpaList(first)} end to end on the top row and each of the others on a row of its own.` : "Draw them end to end on one row: they fill the whole time.") : "Draw each on its own row."}`,
      "Critical activities", { ...base, critical: crit, criticalArrows: critArrows },
    ));
  }
  for (const a of d.acts) {
    if (t.float[a.id] === 0 || given.has(a.id)) continue;
    bars.push(a.id); floats.push(a.id);
    const fl = t.float[a.id];
    const s0 = early ? t.es[a.id] : t.lf[a.id] - a.duration;
    steps.push(step(
      early
        ? `${a.id} starts at its earliest start, ${t.es[a.id]}, and lasts ${a.duration}, so it ends at ${t.es[a.id] + a.duration}. Its float is ${fl}: show it as a dashed block from ${t.es[a.id] + a.duration} to ${t.es[a.id] + a.duration + fl}.`
        : `${a.id} must finish by its latest finish, ${t.lf[a.id]}, and lasts ${a.duration}, so it starts at ${s0}. Its float is ${fl}: show it as a dashed block from ${s0 - fl} to ${s0}.`,
      `Activity ${a.id}`, { ...base, critical: crit, criticalArrows: critArrows, current: a.id }, a.id,
    ));
  }
  steps.push(step(
    `Check: every activity is drawn, the critical activities fit end to end with no gaps, and every activity that has float shows it. The project takes ${t.projectTime} ${d.unit}.`,
    "Check", { ...base, critical: crit, criticalArrows: critArrows }, undefined, { runningTotal: t.projectTime, totalLabel: "Minimum time" },
  ));
  return steps;
}

// ── A missing duration x on an activity that is NOT on the critical path: how big can it get? ──
function solveUnknownOff(p: DecisionProblem): SolveStep[] {
  const d = p.cpa!;
  const u = d.extra!.unknown!;
  const { times: t } = d;
  const T = t.projectTime;
  const all = fullGraph(d.acts);
  const byId = new Map(all.map((a) => [a.id, a]));
  const succ = successorsOf(all);
  const back = new Set<string>(), fwd = new Set<string>();
  const up = (id: string) => byId.get(id)!.preds.forEach((q) => { if (!back.has(q)) { back.add(q); up(q); } });
  const down = (id: string) => succ[id].forEach((q) => { if (!fwd.has(q)) { fwd.add(q); down(q); } });
  up(u.id); down(u.id);
  const dur = (id: string) => (id === START || id === END ? 0 : d.acts.find((a) => a.id === id)!.duration);
  const labels = { [u.id]: "x" };
  const pathArrows = u.path.slice(1).map((id, k) => `${u.path[k]}→${id}`);
  const esShown = Object.fromEntries([...back, u.id].map((id) => [id, t.es[id]]));
  const lfShown = Object.fromEntries([...fwd, u.id].map((id) => [id, t.lf[id]]));
  const steps: SolveStep[] = [];
  steps.push(beat(
    `${u.id} is not on the critical path ${u.path.join(" – ")}, so the minimum completion time is ${T} ${d.unit} as long as ${u.id} is not too long. If x is too big, the path through ${u.id} becomes the longest. We need the time available for ${u.id}: its latest finish minus its earliest start.`,
    { critical: u.path, criticalArrows: pathArrows, durLabels: labels, current: u.id }, "Idea",
  ));
  const preds = byId.get(u.id)!.preds;
  steps.push(beat(
    `Earliest start of ${u.id}: it follows ${cpaList(preds)}, which finish at ${preds.map((q) => `${t.es[q]} + ${dur(q)} = ${t.ef[q]}`).join(" and ")}. The largest is ${t.es[u.id]}, so ${u.id} cannot start before ${t.es[u.id]}. (None of this depends on x.)`,
    { es: esShown, durLabels: labels, current: u.id, compare: preds }, "Forward pass",
  ));
  const ss = succ[u.id];
  steps.push(beat(
    `Latest finish of ${u.id}: it is followed by ${cpaList(ss)}, which must start by ${ss.map((q) => `${q}: ${t.lf[q]} − ${dur(q)} = ${t.ls[q]}`).join(", ")}. The smallest is ${t.lf[u.id]}, so ${u.id} must finish by ${t.lf[u.id]}.`,
    { es: esShown, lf: lfShown, durLabels: labels, current: u.id, compare: ss }, "Backward pass",
  ));
  steps.push(beat(
    `${u.id} has from ${t.es[u.id]} to ${t.lf[u.id]} to be done: ${t.lf[u.id]} − ${t.es[u.id]} = ${u.bound}. So x ≤ ${u.bound}. At x = ${u.bound} there is no float left and ${u.id} just becomes critical; any bigger and the project takes longer than ${T} ${d.unit}.`,
    { es: esShown, lf: lfShown, durLabels: labels, current: u.id }, "Conclusion", { runningTotal: u.bound, totalLabel: "x ≤" },
  ));
  return steps;
}

/** For a stepped block: where its bottom edge steps, in words ("" for a plain rectangle). */
function stepNote(b: { id: string; start: number; base?: number[] }): string {
  if (!b.base || b.base.every((v) => v === b.base![0])) return "";
  const moves: string[] = [];
  b.base.forEach((v, i) => { if (i > 0 && v !== b.base![i - 1]) moves.push(`at ${b.start + i} the blocks under ${b.id} ${v > b.base![i - 1] ? "get taller" : "get shorter"} (${b.base![i - 1]} to ${v} workers), so the next piece of ${b.id} sits ${v > b.base![i - 1] ? "higher" : "lower"}`); });
  return ` The blocks under it change height, so it drops into the gap and is drawn in pieces, each labelled ${b.id}: ${moves.join("; ")}. Every piece is as many workers high as ${b.id} needs.`;
}

// ── Resource histogram: the critical activities along the bottom, then the rest stacked with no holes ──
function solveHistogram(p: DecisionProblem): SolveStep[] {
  const d = p.cpa!;
  const h = d.extra!.histogram!;
  const { times: t } = d;
  const all = fullGraph(d.acts);
  const base: CpaViewState = { es: Object.fromEntries(all.map((a) => [a.id, t.es[a.id]])), lf: Object.fromEntries(all.map((a) => [a.id, t.lf[a.id]])) };
  const crit = criticalActivities(d.acts);
  const { arrows: critArrows } = criticalPathInfo(d.criticalPaths);
  const drawn: string[] = [];
  const steps: SolveStep[] = [];
  const several = d.acts.some((a) => (a.workers ?? 1) > 1);
  const step = (caption: string, phase: string, view: CpaViewState, current?: string, extra?: Partial<SolveStep>): SolveStep => ({
    caption, phase, edgeStates: {}, cpaView: view, histView: { blocks: [...drawn], current }, ...extra,
  });
  steps.push(step(
    `A resource histogram shows how many workers are needed at each time. The time runs along the bottom, from 0 to ${h.T} ${d.unit}. Each activity is a block as wide as its duration${several ? " and as high as the number of workers it needs" : ", one worker high"}. Every activity starts as ${h.start === "late" ? "late" : "early"} as possible.`,
    "Set up", { ...base },
  ));
  const firstPath = new Set(d.criticalPaths[0]);
  const more = d.criticalPaths.length > 1;
  const early = h.start !== "late";
  const critBlocks = h.blocks.filter((b) => b.critical && firstPath.has(b.id)).sort((a, b) => a.start - b.start);
  critBlocks.forEach((b) => drawn.push(b.id));
  steps.push(step(
    `Put ${more ? "the first critical path" : "the critical activities"} along the bottom, end to end: ${critBlocks.map((b) => `${b.id} from ${b.start} to ${b.end}`).join(", ")}. ${more ? "There is another critical path; its other activities have no float either, so they are drawn like the rest." : "They have no float, so early and late starts are the same."}`,
    "Critical activities", { ...base, critical: crit, criticalArrows: critArrows },
  ));
  const rest = h.blocks.filter((b) => !drawn.includes(b.id)).sort((a, b) => a.start - b.start || a.y - b.y || a.id.localeCompare(b.id));
  for (const b of rest) {
    drawn.push(b.id);
    const under = h.blocks.filter((o) => o.id !== b.id && drawn.includes(o.id) && o.start < b.end && b.start < o.end && o.y + o.workers === b.y).map((o) => o.id);
    const lateNote = early ? `starts at its earliest start, ${b.start}` : `must finish by its latest finish, ${b.end}, so it starts at ${b.start}`;
    steps.push(step(
      `${b.id} ${lateNote}, and lasts ${b.end - b.start}, so it runs from ${b.start} to ${b.end}${several ? `, needing ${b.workers} worker${b.workers > 1 ? "s" : ""}` : ""}. ${b.y === 0 && !b.base ? "Nothing is below it" : `Draw it on top of ${cpaList(under.length ? under : ["the blocks below"])}`}: ${b.y === 0 && !b.base ? "it sits on the bottom." : "no gaps."}${stepNote(b)}`,
      `Activity ${b.id}`, { ...base, critical: crit, criticalArrows: critArrows, current: b.id }, b.id,
    ));
  }
  steps.push(step(
    `Check: every activity is drawn once and labelled, there are no gaps under any block, and the histogram ends at ${h.T}. The most workers needed at once is ${h.peak}.`,
    "Check", { ...base, critical: crit, criticalArrows: critArrows }, undefined, { runningTotal: h.peak, totalLabel: "Most workers" },
  ));
  return steps;
}

// ── Resource levelling: where the histogram is over the limit, then the schedule built again within the limit ──
function solveLevel(p: DecisionProblem): SolveStep[] {
  const d = p.cpa!;
  const lv = d.extra!.level!;
  if (lv.choices) return solveLevelChoice(p);
  const { times: t } = d;
  const all = fullGraph(d.acts);
  const base: CpaViewState = { es: Object.fromEntries(all.map((a) => [a.id, t.es[a.id]])), lf: Object.fromEntries(all.map((a) => [a.id, t.lf[a.id]])) };
  const byId = new Map(d.acts.map((a) => [a.id, a]));
  const several = d.acts.some((a) => (a.workers ?? 1) > 1);
  const all0 = lv.before.blocks.map((b) => b.id);
  const steps: SolveStep[] = [];
  const drawn: string[] = [];
  const mk = (caption: string, phase: string, view: CpaViewState, hist: Partial<NonNullable<SolveStep["histView"]>>, extra?: Partial<SolveStep>): SolveStep => ({
    caption, phase, edgeStates: {}, cpaView: view, histView: { blocks: [...drawn], ...hist },
    // read the histogram against the cascade chart: every bar and float is there from the start, the activity being placed is lit
    ...(lv.ref !== "network" && lv.ref !== "floats" ? { ganttView: { bars: d.acts.map((x) => x.id), floats: d.acts.filter((x) => t.float[x.id] > 0).map((x) => x.id), current: view.current } } : {}),
    ...extra,
  });
  const running = (from: number, to: number) => lv.before.blocks.filter((b) => b.start < to && from < b.end).map((b) => b.id);
  // 1. where the histogram is over the limit
  drawn.push(...all0);
  steps.push(mk(
    `Only ${lv.limit} workers are available, so the histogram must never go above ${lv.limit}. Draw the limit and look for the times that need more: ${lv.over.map((o) => `from ${o.from} to ${o.to} it needs ${o.need} (${cpaList(running(o.from, o.to))} together)`).join("; ")}.`,
    "Where is the limit exceeded?", { ...base }, { which: "before", showLimit: true, showOver: true },
  ));
  drawn.length = 0;
  steps.push(mk(
    `So some activities must wait. Build the histogram again, one activity at a time, in time order. An activity can start when everything before it is finished AND enough workers are free; if they are not, it waits. Keep every precedence.`,
    "Level the histogram", { ...base, critical: criticalActivities(d.acts) }, { which: "after", showLimit: true },
  ));
  // 2. each activity in start order
  const order = [...lv.after.blocks].sort((a, b) => a.start - b.start || a.id.localeCompare(b.id));
  const usageAt = (time: number, skip: string) => lv.after.blocks.filter((b) => b.id !== skip && b.start <= time && time < b.end).reduce((s, b) => s + b.workers, 0);
  for (const b of order) {
    drawn.push(b.id);
    const a = byId.get(b.id)!;
    const ready = Math.max(0, ...(all.find((x) => x.id === b.id)!.preds.filter((q) => q !== START).map((q) => lv.after.blocks.find((o) => o.id === q)!.end)));
    const free = lv.limit - usageAt(ready, b.id);
    const need = a.workers ?? 1;
    const delay = b.start - t.es[b.id];
    const fl = t.float[b.id];
    const text = !b.moved
      ? b.start === t.es[b.id]
        ? `${b.id} can start at its earliest start, ${b.start}${several ? `; it needs ${need} worker${need > 1 ? "s" : ""}` : ""}, and the workers are free, so it runs from ${b.start} to ${b.end}.`
        : `${b.id} starts as soon as everything before it is finished, at ${b.start} (later than before, because the activities before it were delayed), and the workers are free, so it runs from ${b.start} to ${b.end}.`
      : `${b.id} could start at ${ready}, when everything before it is finished, but only ${Math.max(0, free)} worker${free === 1 ? " is" : "s are"} free and it needs ${need}. They are not free until ${b.start}, so ${b.id} waits ${b.start - ready} and runs from ${b.start} to ${b.end}. ${fl === 0 ? `${b.id} is critical, so this delays the whole project.` : delay <= fl ? `Altogether it starts ${delay} later than before, which is within its float of ${fl}.` : `Altogether it starts ${delay} later than before, which is more than its float of ${fl}, so the project is delayed.`}`;
    steps.push(mk(text + stepNote(b), b.moved ? `Delay ${b.id}` : `Activity ${b.id}`, { ...base, current: b.id }, { which: "after", showLimit: true, current: b.id }));
  }
  const extra = lv.newTime - t.projectTime;
  steps.push(mk(
    extra === 0
      ? `The levelled histogram never goes above ${lv.limit}, and it still finishes at ${lv.newTime} ${d.unit}: ${cpaList(lv.delayed.map((x) => x.id))} could wait within ${lv.delayed.length > 1 ? "their" : "its"} float, so the minimum completion time is unchanged.`
      : `The levelled histogram never goes above ${lv.limit}. It finishes at ${lv.newTime} ${d.unit}, which is ${extra} more than the ${t.projectTime} it takes with no limit. The activities delayed are ${cpaList(lv.delayed.map((x) => x.id))}.`,
    "Conclusion", { ...base }, { which: "after", showLimit: true }, { runningTotal: lv.newTime, totalLabel: "Minimum time" },
  ));
  void START;
  return steps;
}

// ── Worker allocation: the schedule that meets the limit, then who does each activity ──
function solveAlloc(p: DecisionProblem): SolveStep[] {
  const d = p.cpa!;
  const a = d.extra!.alloc!;
  const { times: t } = d;
  const all = fullGraph(d.acts);
  const base: CpaViewState = { es: Object.fromEntries(all.map((x) => [x.id, t.es[x.id]])), lf: Object.fromEntries(all.map((x) => [x.id, t.lf[x.id]])) };
  const crit = criticalActivities(d.acts);
  const first = d.criticalPaths[0].filter((id) => id !== START && id !== END);
  const drawn: string[] = [];
  const steps: SolveStep[] = [];
  const step = (caption: string, phase: string, view: CpaViewState, current?: string, extra?: Partial<SolveStep>): SolveStep => ({
    caption, phase, edgeStates: {}, cpaView: view, ganttView: { bars: [...drawn], floats: [], current }, ...extra,
  });
  const T = t.projectTime;
  const pinned = a.kind === "min" && first.every((id) => a.starts[id] === t.es[id]);
  const wname = (w: number) => `Worker ${w + 1}`;
  steps.push(step(
    a.kind === "min"
      ? `Each worker does one activity at a time, so the chart has a row for each worker. To finish in ${T} ${d.unit} every critical activity must start at its earliest start, so the critical path ${first.join(" – ")} keeps one worker busy the whole time. The other activities fit round it in their float.`
      : `Each worker does one activity at a time, so the chart has a row for each worker. With only ${a.workers} workers, level the histogram: activities wait until everything before them is done and a worker is free. That gives a minimum completion time of ${a.newTime} ${d.unit}, which is ${a.newTime - T} more than ${T}.`,
    "Set up", { ...base, critical: crit },
  ));
  const order = [...d.acts].sort((x, y) => a.starts[x.id] - a.starts[y.id] || x.id.localeCompare(y.id));
  const lastEnd: number[] = new Array(a.workers).fill(0);
  let inCrit = false;
  for (const act of order) {
    const w = a.alloc[act.id];
    const s0 = a.starts[act.id];
    drawn.push(act.id);
    const busy = lastEnd.map((e, i) => (e > s0 ? wname(i) : null)).filter((x): x is string => !!x);
    let text: string;
    if (pinned && first.includes(act.id)) {
      text = inCrit ? `${act.id} is the next activity on the critical path: ${wname(0)} does it, from ${s0} to ${s0 + act.duration}.` : `${act.id} is on the critical path, so ${wname(0)} does it, from ${s0} to ${s0 + act.duration}.`;
      inCrit = true;
    } else {
      const free = lastEnd.map((e, i) => (e <= s0 && !(pinned && i === 0) ? wname(i) : null)).filter((x): x is string => !!x);
      text = `${act.id} starts at ${s0} (it can start then, once everything before it is done${a.starts[act.id] > t.es[act.id] ? ", and a worker is free" : ""}). ${busy.length ? `${cpaList(busy)} ${busy.length > 1 ? "are" : "is"} busy then.` : "Nobody is busy."} ${wname(w)} is free, so ${wname(w)} does ${act.id}, from ${s0} to ${s0 + act.duration}.${free.length > 1 ? ` (${cpaList(free)} are all free; any would do.)` : ""}`;
    }
    lastEnd[w] = s0 + act.duration;
    steps.push(step(text, `${act.id}: ${wname(w)}`, { ...base, critical: crit, current: act.id }, act.id));
  }
  const team = Array.from({ length: a.workers }, (_, w) => `${wname(w)}: ${order.filter((x) => a.alloc[x.id] === w).map((x) => x.id).join(" ")}`).join("; ");
  steps.push(step(
    a.kind === "min"
      ? `Everything finishes by ${a.newTime} ${d.unit}, using ${a.workers} workers. ${team}. Could fewer do it? With ${a.workers - 1} workers the best possible finish is ${a.withFewer} ${d.unit}, later than ${T}, so ${a.workers} is the smallest team.`
      : `Everything finishes by ${a.newTime} ${d.unit}. ${team}. Nobody does two activities at once, and every activity starts after the ones before it are finished.`,
    "Check", { ...base, critical: crit }, undefined, a.kind === "min" ? { runningTotal: a.workers, totalLabel: "Workers" } : { runningTotal: a.newTime, totalLabel: "Minimum time" },
  ));
  return steps;
}

// ── Which activity to shorten: only critical activities can help; try each and recalculate ──
function solveShorten(p: DecisionProblem): SolveStep[] {
  const d = p.cpa!;
  const sh = d.extra!.shorten!;
  const { times: t } = d;
  const all = fullGraph(d.acts);
  const base: CpaViewState = { es: Object.fromEntries(all.map((x) => [x.id, t.es[x.id]])), lf: Object.fromEntries(all.map((x) => [x.id, t.lf[x.id]])) };
  const crit = criticalActivities(d.acts);
  const { arrows: critArrows, text: pathText } = criticalPathInfo(d.criticalPaths);
  const T = t.projectTime;
  const u1 = d.unit.replace(/s$/, "");
  const dur = (id: string) => d.acts.find((a) => a.id === id)!.duration;
  const done: string[] = [];
  const steps: SolveStep[] = [];
  steps.push(beat(
    `Reducing an activity only shortens the project if it is on the critical path: an activity with float can already take longer without delaying anything. ${pathText} The critical activities are ${cpaList(crit)}, so only these are worth trying.`,
    { ...base, critical: crit, criticalArrows: critArrows, shortenDone: [] }, "Which activities can help?",
  ));
  for (const r of sh.results.filter((x) => x.critical)) {
    const changed = d.acts.map((a) => (a.id === r.id ? { ...a, duration: sh.to } : a));
    const nt = cpaTimes(changed);
    const refPaths = r.limitedBy;
    done.push(r.id);
    const full = dur(r.id) - sh.to;
    const why = r.saving === full
      ? `The whole reduction of ${full} is saved, because ${r.id} is still on the critical path.`
      : r.saving === 0
        ? `Nothing is saved: there is another critical path that does not go through ${r.id}, and it is still ${T} ${d.unit} long.`
        : `Only ${r.saving} is saved, not ${full}: another path of length ${r.newTime} (${refPaths.map((q) => q.join(" – ")).join(" and ")}) becomes critical, so the time cannot fall below ${r.newTime}.`;
    const newCrit = [...new Set(refPaths.flat())];
    steps.push(beat(
      `Reduce ${r.id} from ${dur(r.id)} to ${sh.to}. Do the passes again: the new minimum completion time is ${r.newTime} ${d.unit}. ${why}`,
      { es: Object.fromEntries(all.map((x) => [x.id, nt.es[x.id]])), lf: Object.fromEntries(all.map((x) => [x.id, nt.lf[x.id]])), durLabels: { [r.id]: String(sh.to) }, current: r.id, critical: r.saving < full ? newCrit : undefined, shortenDone: [...done] },
      `Reduce ${r.id}`, { runningTotal: r.newTime, totalLabel: "New time" },
    ));
  }
  const table = sh.results.filter((x) => x.critical).map((r) => `${r.id}: ${r.newTime}`).join(", ");
  steps.push(beat(
    `Compare the new minimum completion times: ${table}. The smallest is ${sh.bestTime}, from reducing ${sh.best}: it saves ${T - sh.bestTime} ${d.unit}. Reducing any other activity gives ${sh.nextBest} or more. So reduce ${sh.best}, and the minimum completion time becomes ${sh.bestTime} ${d.unit}.`,
    { ...base, critical: [sh.best], current: sh.best, shortenDone: [...done] }, "Conclusion", { runningTotal: sh.bestTime, totalLabel: "New time" },
  ));
  void u1; void START;
  return steps;
}

// ── Which of several activities that can start at once must start first? The one with no float. ──
function solveFirst(p: DecisionProblem): SolveStep[] {
  const d = p.cpa!;
  const f = d.extra!.first!;
  const { times: t } = d;
  const all = fullGraph(d.acts);
  const base: CpaViewState = { es: Object.fromEntries(all.map((x) => [x.id, t.es[x.id]])), lf: Object.fromEntries(all.map((x) => [x.id, t.lf[x.id]])) };
  const dur = (id: string) => d.acts.find((a) => a.id === id)!.duration;
  const others = f.sources.filter((id) => id !== f.answer);
  const { onPaths, arrows } = criticalPathInfo(d.criticalPaths);
  return [
    beat(`${cpaList(f.sources)} have nothing before them, so any of them could be started first. An activity that must not be delayed is one with no float: if it starts late, the whole project finishes late.`, { ...base, compare: f.sources }, "Which can wait?"),
    beat(`Float = latest finish − earliest start − duration: ${f.sources.map((id) => `${id}: ${t.lf[id]} − ${t.es[id]} − ${dur(id)} = ${f.floats[id]}`).join("; ")}.`, { ...base, compare: f.sources, float: Object.fromEntries(f.sources.map((id) => [id, f.floats[id]])) }, "Float of each"),
    beat(`${f.answer} has float 0, so it is critical: it is the first activity on the critical path and must be started first. ${cpaList(others)} ${others.length > 1 ? "have" : "has"} float (${others.map((id) => `${id}: ${f.floats[id]}`).join(", ")}), so ${others.length > 1 ? "they" : "it"} can wait without delaying the project.`, { ...base, critical: onPaths, criticalArrows: arrows, current: f.answer }, "Conclusion"),
  ];
}

// ── One value in a box of the filled-in network is missing ──
function solveUnknownBox(p: DecisionProblem): SolveStep[] {
  const d = p.cpa!;
  const u = d.extra!.unknown!;
  const b = u.box!;
  const { times: t } = d;
  const all = fullGraph(d.acts);
  const byId = new Map(all.map((a) => [a.id, a]));
  const succ = successorsOf(all);
  const dur = (id: string) => (id === START || id === END ? 0 : d.acts.find((a) => a.id === id)!.duration);
  const everyEs = Object.fromEntries(all.map((a) => [a.id, t.es[a.id]]));
  const everyLf = Object.fromEntries(all.map((a) => [a.id, t.lf[a.id]]));
  const hideEs = { ...everyEs }, hideLf = { ...everyLf };
  if (b.cell === "es") delete hideEs[b.id]; else delete hideLf[b.id];
  const labels = b.cell === "es" ? { esLabels: { [b.id]: "x" } } : { lfLabels: { [b.id]: "x" } };
  const view = (extra: Partial<CpaViewState> = {}): CpaViewState => ({ es: hideEs, lf: hideLf, ...labels, ...extra });
  const steps: SolveStep[] = [];
  if (b.cell === "es") {
    const preds = byId.get(b.id)!.preds;
    steps.push(beat(`x is the earliest start of ${b.id}. An activity cannot start until everything before it has finished, so look at ${cpaList(preds)}, which come before ${b.id}.`, view({ current: b.id, compare: preds }), "Idea"));
    steps.push(beat(`Each one finishes at its earliest start + its duration: ${preds.map((q) => `${q}: ${t.es[q]} + ${dur(q)} = ${t.ef[q]}`).join("; ")}.`, view({ current: b.id, compare: preds }), "Earliest finishes"));
    steps.push(beat(`${b.id} has to wait for the last of them: the largest, ${u.x}. So x = ${u.x}.${u.choices ? ` (Circle ${u.x}.)` : ""}`, { es: everyEs, lf: hideLf, current: b.id, compare: preds }, "Take the largest", { runningTotal: u.x, totalLabel: "x" }));
  } else {
    const ss = succ[b.id];
    steps.push(beat(`x is the latest finish of ${b.id}. It must be finished in time for everything after it to start by its own latest start, so look at ${cpaList(ss)}, which come after ${b.id}.`, view({ current: b.id, compare: ss }), "Idea"));
    steps.push(beat(`Each must start by its latest finish − its duration: ${ss.map((q) => `${q}: ${t.lf[q]} − ${dur(q)} = ${t.ls[q]}`).join("; ")}.`, view({ current: b.id, compare: ss }), "Latest starts"));
    steps.push(beat(`${b.id} must be finished before the first of them has to start: the smallest, ${u.x}. So x = ${u.x}.${u.choices ? ` (Circle ${u.x}.)` : ""}`, { es: hideEs, lf: everyLf, current: b.id, compare: ss }, "Take the smallest", { runningTotal: u.x, totalLabel: "x" }));
  }
  return steps;
}

// ── "Which could be a correctly levelled histogram?": check each option against the two rules ──
function solveLevelChoice(p: DecisionProblem): SolveStep[] {
  const d = p.cpa!;
  const lv = d.extra!.level!;
  const ch = lv.choices!;
  const { times: t } = d;
  const all = fullGraph(d.acts);
  const base: CpaViewState = { es: Object.fromEntries(all.map((x) => [x.id, t.es[x.id]])), lf: Object.fromEntries(all.map((x) => [x.id, t.lf[x.id]])) };
  const mk = (caption: string, phase: string, option?: number, extra?: Partial<SolveStep>): SolveStep => ({
    caption, phase, edgeStates: {}, cpaView: base, histView: { blocks: lv.before.blocks.map((b) => b.id), which: "before", showLimit: true, option }, ...extra,
  });
  const steps: SolveStep[] = [mk(
    `A correctly levelled histogram obeys two rules. (1) It never goes above ${lv.limit} workers. (2) Every activity starts only after all the activities before it have finished. Check each option against both.`,
    "The two rules",
  )];
  ch.forEach((c, i) => {
    const profileMax = c.data.peak;
    steps.push(mk(
      c.fault === "none"
        ? `Option ${c.label}: the most workers at once is ${profileMax}, within the limit of ${lv.limit}. Every activity starts after the ones it follows have finished. It passes both rules, and it finishes at ${c.data.T} ${d.unit}.`
        : c.fault === "limit"
          ? `Option ${c.label}: ${c.note}. It breaks rule (1), so it is not correctly levelled.`
          : `Option ${c.label}: it stays within ${lv.limit} workers, but ${c.note}. It breaks rule (2): it finishes sooner (${c.data.T} ${d.unit}) only because it ignores the order the activities must be done in.`,
      `Option ${c.label}`, i,
    ));
  });
  const right = ch.find((c) => c.fault === "none")!;
  steps.push(mk(`Only option ${right.label} obeys both rules, so it is the answer. The shortest-looking option is not the right one if it breaks the order of the activities.`, "Conclusion", ch.indexOf(right), { runningTotal: right.data.T, totalLabel: "Finish" }));
  return steps;
}

// ── Explain and justify: the evidence, then each mark point, then a model answer to self-mark against ──
function solveReason(p: DecisionProblem): SolveStep[] {
  const d = p.cpa!;
  const r = d.extra!.reason!;
  const { times: t } = d;
  const all = fullGraph(d.acts);
  const base: CpaViewState = { es: Object.fromEntries(all.map((x) => [x.id, t.es[x.id]])), lf: Object.fromEntries(all.map((x) => [x.id, t.lf[x.id]])) };
  const crit = criticalActivities(d.acts);
  const { onPaths, arrows } = criticalPathInfo(d.criticalPaths);
  const T = t.projectTime;
  const dur = (id: string) => d.acts.find((a) => a.id === id)!.duration;
  const steps: SolveStep[] = [];
  const marksBeat = (view: CpaViewState) => beat(
    `What earns the marks (${r.marks.length}): ${r.marks.map((m) => `${m.code} — ${m.text}`).join("   ")}`,
    view, `Mark scheme (${r.marks.length} marks)`,
  );
  const modelBeat = (view: CpaViewState) => beat(r.model.join(" "), view, "A model answer", { runningTotal: r.marks.length, totalLabel: "Marks" });
  if (r.type === "range" || r.type === "remove") {
    // the evidence is the recalculation, box by box, then the marks and the model answer
    const change = solveChange(p);
    const last = change[change.length - 1].cpaView!;
    return [...change, marksBeat(last), modelBeat(last)];
  }
  if (r.type === "claim") {
    const c = r.claim!;
    steps.push(beat(`To judge the claim, find the minimum completion time: the longest time any path takes. ${criticalPathInfo(d.criticalPaths).text}`, { ...base, critical: onPaths, criticalArrows: arrows }, "Evidence", { runningTotal: T, totalLabel: "Minimum time" }));
    steps.push(beat(c.time === T ? `${c.who} claims ${c.time} ${d.unit}, the same as the minimum completion time ${T} ${d.unit}: so the claim looks valid.` : `${c.who} claims ${c.time} ${d.unit}, but the minimum completion time is ${T} ${d.unit}, ${T - c.time} more: the project cannot be done that quickly.`, { ...base, critical: onPaths, criticalArrows: arrows }, "Compare with the claim"));
    if (c.time === T) steps.push(beat(`But the minimum time only holds if every activity starts at its earliest start. That needs enough workers to do activities at the same time, and no delay to any critical activity (${cpaList(crit)}). If either fails, the project takes longer. A good comment says both: it appears valid, and why it might not be.`, { ...base, critical: crit }, "Is it really valid?"));
    steps.push(marksBeat({ ...base, critical: onPaths, criticalArrows: arrows }), modelBeat({ ...base, critical: onPaths, criticalArrows: arrows }));
    return steps;
  }
  if (r.type === "glyn") {
    const sum = r.sumCritical!;
    steps.push(beat(`Glyn's method: add the durations of all the critical activities. The critical activities (float 0) are ${cpaList(crit)}. There are ${d.criticalPaths.length} critical paths: ${d.criticalPaths.map((q) => q.join(" – ")).join(" and ")}.`, { ...base, critical: crit, criticalArrows: arrows }, "(i) The critical activities"));
    steps.push(beat(`Add their durations: ${crit.map((id) => dur(id)).join(" + ")} = ${sum}. The minimum completion time is ${T}. ${sum} ≠ ${T}, so Glyn's claim is false for this network. (Both values must be stated: one alone is not enough.)`, { ...base, critical: crit, criticalArrows: arrows }, "(i) Show it is false", { runningTotal: sum, totalLabel: "Sum" }));
    steps.push(beat(`The sum counts activities that run at the same time on different critical paths, so it is too big. It would be true if every critical activity were on one single critical path, because then the activities follow one another end to end and their durations add up to the minimum completion time.`, { ...base, critical: crit }, "(ii) When is it true?"));
    steps.push(marksBeat({ ...base, critical: crit }), modelBeat({ ...base, critical: crit }));
    return steps;
  }
  // limit
  steps.push(beat(`The activity network is a model of the project. It gives the minimum completion time by using the durations and the order of the activities, and it makes assumptions. A limitation is something real that the model leaves out.`, { ...base }, "What is a limitation?"));
  (r.limits ?? []).forEach((l) => steps.push(beat(`${l.name[0].toUpperCase()}${l.name.slice(1)}. ${l.limitation} ${l.effect}`, { ...base }, `Acceptable: ${l.name}`)));
  steps.push(marksBeat({ ...base }), modelBeat({ ...base }));
  return steps;
}
