// ═══════════════════════════════════════════════════════════════════════════
// Critical Path Analysis — the working. One SolveStep per move a teacher would make at the board: draw the next box and its arrows,
// fill the next earliest start (showing the finishes that are compared and the largest taken), fill the next latest finish (the latest
// starts compared and the smallest taken), then the float and the critical path. Every number is read from cpaTimes (cpa.ts).
// ═══════════════════════════════════════════════════════════════════════════

import { END, START, cpaEdges, cpaList, criticalActivities, fullGraph, successorsOf, type CpaViewState } from "./cpa";
import type { DecisionProblem, SolveStep } from "./types";

const beat = (caption: string, view: CpaViewState, phase?: string, extra?: Partial<SolveStep>): SolveStep => ({
  caption, phase, edgeStates: {}, cpaView: view, ...extra,
});

export function solveCpa(p: DecisionProblem): SolveStep[] {
  const d = p.cpa!;
  switch (d.kind) {
    case "cpaNetwork": return solveNetwork(p);
    case "cpaForward": return solvePasses(p, false);
    case "cpaFull": return solvePasses(p, true);
    default: return solveFloat(p);
  }
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
  const path = d.criticalPath;
  const critArrows = cpaEdges(all).filter((e) => path.includes(e.from) && path.includes(e.to) && path.indexOf(e.to) === path.indexOf(e.from) + 1).map((e) => e.id);
  steps.push(beat(
    `Float = latest finish − earliest start − duration. The activities with float 0 are critical: ${cpaList(crit)}.`,
    snap({ critical: crit }), "Critical activities",
  ));
  steps.push(beat(
    `The critical path is ${path.join(" – ")}. The minimum completion time is ${t.projectTime} ${d.unit}.`,
    snap({ critical: path, criticalArrows: critArrows }), "Critical path", { runningTotal: t.projectTime, totalLabel: "Minimum time" },
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
  const path = d.criticalPath;
  const critArrows = cpaEdges(all).filter((e) => path.includes(e.from) && path.includes(e.to) && path.indexOf(e.to) === path.indexOf(e.from) + 1).map((e) => e.id);
  steps.push(beat(
    `The critical activities are those with float 0: ${cpaList(crit)} (the critical path ${path.join(" – ")}).`,
    snap({ critical: path, criticalArrows: critArrows }), "Critical activities",
  ));
  return steps;
}
