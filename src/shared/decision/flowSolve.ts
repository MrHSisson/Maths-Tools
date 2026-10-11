// ═══════════════════════════════════════════════════════════════════════════
// Network Flows — the worked solution as SolveStep[] (one beat = the next thing a
// teacher would write at the board). Every number in a caption is read off flow.ts,
// never recomputed here, so the working cannot disagree with the answer.
// ═══════════════════════════════════════════════════════════════════════════

import {
  augment, cutCapacity, peelMissing, flowValue, isFeasibleFlow, maxFlow, orderNodes, pathLabel, pathNodes, potentials,
  type AugmentingPath, type Flow, type FlowNet, type FlowProblemData, type FlowViewState,
} from "./flow";
import type { DecisionProblem, SolveStep } from "./types";

const empty = (net: FlowNet): Record<string, "idle"> => Object.fromEntries(net.arcs.map((a) => [a.id, "idle" as const]));
const set = (net: FlowNet, ids: string[]) => `{${orderNodes(net, ids).join(", ")}}`;
/** every arc's potentials as numbers, straight from flow.ts (the renderer never computes them) */
const potNumbers = (net: FlowNet, flow: Flow): NonNullable<FlowViewState["potentials"]> => {
  const p = potentials(net, flow);
  return Object.fromEntries(net.arcs.map((a) => [a.id, { fwd: p[a.id].fwd, bwd: p[a.id].bwd }]));
};
const arrowPath = (p: AugmentingPath) => pathNodes(p).join(" → ");

function beat(net: FlowNet, caption: string, view: FlowViewState, extra: Partial<SolveStep> = {}): SolveStep {
  return { caption, edgeStates: empty(net), flowView: view, ...extra };
}

// ── Initial flow ─────────────────────────────────────────────────────────────
function solveInitial(p: DecisionProblem): SolveStep[] {
  const d = p.flow!;
  const { net, flow, mode } = d;
  const paths = d.paths!;
  const byId = Object.fromEntries(net.arcs.map((a) => [a.id, a]));
  const steps: SolveStep[] = [];
  const acc: Flow = {};
  if (d.style === "find" && mode === "minmax") {
    const lows = net.arcs.filter((a) => a.lo > 0);
    steps.push(beat(net, `Arcs with a minimum above 0: ${lows.map((a) => `${a.id} (${a.lo})`).join(", ")}.\nSend flow along routes through them, furthest below its minimum first, until every arc reaches its minimum${d.target !== undefined ? `; then raise the flow to ${d.target} along routes with room` : ""}.`,
      { focus: lows.map((a) => a.id) }));
  } else if (d.style === "find") {
    steps.push(beat(net, `Send flow along routes from S to T until the value is ${d.target}.`, {}));
  } else {
    steps.push(beat(net, "Put each path's flow on its arcs; where paths share an arc, add.", {}));
  }
  const findNote = (acc2: Flow, tot: number): string => {
    if (d.style !== "find") return "";
    if (mode === "cap") return tot < (d.target ?? tot) ? `\nFlow ${tot}; ${(d.target ?? tot) - tot} still needed.` : `\nFlow ${tot}: reached.`;
    const below = net.arcs.filter((a) => (acc2[a.id] ?? 0) < a.lo);
    if (below.length) return `\nBelow minimum: ${below.map((a) => `${a.id} (${acc2[a.id] ?? 0} of ${a.lo})`).join(", ")}.`;
    if (d.target === undefined) return "\nEvery arc is at least its minimum.";
    return tot < d.target ? `\nMinimums met. Flow ${tot}; ${d.target - tot} still needed.` : `\nMinimums met; flow ${tot}: reached.`;
  };
  let total = 0;
  paths.forEach((pt) => {
    for (const id of pt.arcs) acc[id] = (acc[id] ?? 0) + pt.amount;
    total += pt.amount;
        steps.push(beat(net, `Send ${pt.amount} along ${pathLabel(net, pt.arcs)}: ${pt.arcs.map((id) => `${id} = ${acc[id]}`).join(", ")}.${findNote(acc, total)}`,
      { flow: { ...acc }, path: pt.arcs.map((id) => ({ arc: id, dir: "fwd" as const, to: byId[id].to })) }, { runningTotal: total, totalLabel: "Flow" }));
  });
  const check = isFeasibleFlow(net, flow);
  const nodes = net.nodes.map((n) => n.id).filter((id) => id !== "S" && id !== "T");
  steps.push(beat(net, `${net.arcs.some((a) => flow[a.id] === 0) ? "Other arcs carry 0. " : ""}Flow value ${flowValue(net, flow)}.`, { flow }, { runningTotal: flowValue(net, flow), totalLabel: "Flow" }));
  steps.push(beat(net, mode === "minmax"
    ? `Check: flow in = flow out at ${nodes.join(", ")}, and every arc between its minimum and maximum. A feasible flow${d.target !== undefined ? ` of value ${d.target}` : ""} (others exist).${check.ok ? "" : "\n(!) " + check.violations.join("; ")}`
    : `Check: flow in = flow out at ${nodes.join(", ")}, and no arc over capacity. A valid flow${d.style === "find" ? ` of value ${d.target}` : ""} (others exist).${check.ok ? "" : "\n(!) " + check.violations.join("; ")}`,
    { flow }, { runningTotal: flowValue(net, flow), totalLabel: "Flow" }));
  return steps;
}

// ── Potentials → flow ────────────────────────────────────────────────────────
// The question shows the potentials (the arrow along each arc and the arrow against it) and the bounds, NOT the flows;
// the working reads each flow back off them. An arc swaps from its potentials to its circled flow as it is found.
function solvePotentials(p: DecisionProblem): SolveStep[] {
  const d = p.flow!;
  const { net, flow, mode } = d;
  const pots = potentials(net, flow);
  const groups = net.nodes.map((n) => n.id).filter((id) => net.arcs.some((a) => a.from === id));
  const remaining = potNumbers(net, flow);
  const found: Flow = {};
  const steps: SolveStep[] = [
    beat(net, mode === "cap"
      ? "Flow = capacity − potential increase. Go through the arcs leaving each vertex."
      : "Flow = maximum − potential increase. Go through the arcs leaving each vertex.",
    { potentials: { ...remaining } }),
  ];
  for (const g of groups) {
    const arcs = net.arcs.filter((a) => a.from === g);
    const lines = arcs.map((a) => {
      found[a.id] = flow[a.id];
      delete remaining[a.id];
      return `${a.id}: ${a.hi} − ${pots[a.id].fwd} = ${flow[a.id]}`;
    });
    steps.push(beat(net, `Arcs leaving ${g}\n${lines.join("\n")}`, {
      potentials: { ...remaining }, flow: { ...found }, focus: arcs.map((a) => a.id),
    }));
  }
  const total = flowValue(net, flow);
  const outS = net.arcs.filter((a) => a.from === "S").map((a) => flow[a.id]);
  steps.push(beat(net, `Flow value = leaving S: ${outS.join(" + ")} = ${total}.`,
    { flow: { ...found } }, { runningTotal: total, totalLabel: "Flow" }));
  return steps;
}

// ── Missing flow ─────────────────────────────────────────────────────────────
function solveMissing(p: DecisionProblem): SolveStep[] {
  const d = p.flow!;
  const { net, flow } = d;
  const missing = d.missing!;
  const order = peelMissing(net, missing)!;
  const sym = ["x", "y", "z"];
  const symOf: Record<string, string> = {};
  order.forEach((o, i) => (symOf[o.arc] = sym[i]));
  const known: Flow = Object.fromEntries(net.arcs.filter((a) => !missing.includes(a.id)).map((a) => [a.id, flow[a.id]]));
  const left = new Set(missing);
  const steps: SolveStep[] = [
    beat(net, `Flow in = flow out at every vertex except S and T. Start at a vertex with one unknown arc.`,
      { flow: { ...known }, unknown: [...left] }),
  ];
  order.forEach(({ arc, vertex }, i) => {
    const inn = net.arcs.filter((a) => a.to === vertex);
    const out = net.arcs.filter((a) => a.from === vertex);
    const term = (a: { id: string }) => (a.id === arc ? sym[i] : `${known[a.id]}`);
    const unknownIn = inn.some((a) => a.id === arc);
    const same = unknownIn ? inn : out;
    const other = unknownIn ? out : inn;
    const otherTotal = other.reduce((t, a) => t + known[a.id], 0);
    const sameOthers = sameKnown(same, arc, known);
    const earlier = [...inn, ...out].filter((a) => a.id !== arc && missing.includes(a.id)).map((a) => a.id);
    const value = flow[arc];
    known[arc] = value;
    left.delete(arc);
    steps.push(beat(net,
      `At ${vertex}, ${earlier.length ? `${earlier.join(" and ")} ${earlier.length > 1 ? "are" : "is"} now known, so ` : ""}only ${arc} is unknown — call it ${sym[i]}.\nFlow in: ${inn.map(term).join(" + ")}\nFlow out: ${out.map(term).join(" + ")}\n${sym[i]} = ${otherTotal}${sameOthers.length ? ` − ${sameOthers.join(" − ")} = ${value}` : ""}`,
      { flow: { ...known }, unknown: [...left], solved: [arc], focus: [...inn, ...out].map((a) => a.id) }));
  });
  steps.push(beat(net, `${missing.map((id) => `${id} = ${flow[id]}`).join(", ")}. Flow value ${flowValue(net, flow)}.`,
    { flow: { ...flow } }, { runningTotal: flowValue(net, flow), totalLabel: "Flow" }));
  return steps;
}
const sameKnown = (xs: Array<{ id: string }>, arc: string, known: Flow): number[] => xs.filter((a) => a.id !== arc).map((a) => known[a.id]);

// ── Cut values ───────────────────────────────────────────────────────────────
function cutView(net: FlowNet, flow: Flow, sSide: string[], showLine = true): FlowViewState {
  const r = cutCapacity(net, sSide);
  const cutArcs: Record<string, "fwd" | "back"> = {};
  for (const a of r.forward) cutArcs[a.id] = "fwd";
  for (const a of r.backward) cutArcs[a.id] = "back";
  return { flow, sSide: showLine ? sSide : undefined, cutArcs: showLine ? cutArcs : undefined, cutLabels: true };
}

function solveCut(p: DecisionProblem): SolveStep[] {
  const d = p.flow!;
  const { net, mode, sSide } = d;
  const s = sSide!;
  const r = cutCapacity(net, s);
  const t = net.nodes.map((n) => n.id).filter((id) => !s.includes(id));
  const view = (show: boolean): FlowViewState => ({ ...cutView(net, d.flow, s), ...(show ? {} : { cutArcs: undefined }), flow: undefined });
  // beat 1 marks the crossing arcs bare (as in the question); later beats write +max / −min beside them
  const steps: SolveStep[] = [
    beat(net, `The cut separates ${set(net, s)} (S side) from ${set(net, t)} (T side). Find every arc that crosses it.`, view(false)),
    beat(net, `Arcs going from the S side to the T side (forward): ${r.forward.map((a) => a.id).join(", ")}. Add their ${mode === "cap" ? "capacities" : "maximums"}.\n${r.forward.map((a) => a.hi).join(" + ")} = ${r.forwardSum}`,
      view(true), { runningTotal: r.forwardSum, totalLabel: "Forward" }),
  ];
  if (r.backward.length > 0) {
    steps.push(beat(net, mode === "cap"
      ? `Arc${r.backward.length > 1 ? "s" : ""} ${r.backward.map((a) => a.id).join(", ")} come${r.backward.length > 1 ? "" : "s"} back from the T side to the S side. Nothing is subtracted for ${r.backward.length > 1 ? "them" : r.backward[0].id}: a capacity-only network has no lower limits.`
      : `Arc${r.backward.length > 1 ? "s" : ""} ${r.backward.map((a) => a.id).join(", ")} come${r.backward.length > 1 ? "" : "s"} back from the T side to the S side (backward). Subtract ${r.backward.length > 1 ? "their minimums" : "its minimum"}.\n${r.forwardSum} − ${r.backward.map((a) => a.lo).join(" − ")} = ${r.capacity}`,
      view(true), { runningTotal: r.capacity, totalLabel: "Cut" }));
  } else {
    steps.push(beat(net, "No arc comes back from the T side to the S side, so there is nothing to subtract.", view(true), { runningTotal: r.capacity, totalLabel: "Cut" }));
  }
  steps.push(beat(net, `The capacity of the cut is ${r.capacity}.`, view(true), { runningTotal: r.capacity, totalLabel: "Cut" }));
  return steps;
}

// ── Augmenting ───────────────────────────────────────────────────────────────
// The potentials are worked out ONCE (the "label the potentials" beat) and drawn on the diagram; every later beat READS
// them off the picture, never recalculates them. After each augmentation only the potentials that change are listed, and the
// next path is found on those updated potentials — so Augment flow and Max flow share exactly the same rounds.

/** "SA 2, AD 5, DB 4 (against the arrow)" — the potentials on a path, read off the diagram */
function readPath(path: AugmentingPath): string {
  return path.steps.map((s, i) => `${s.arc} ${path.potentials[i]}${s.dir === "back" ? " (against the arrow)" : ""}`).join(", ");
}

/** The beat that labels the potentials for the first time — the only place their formula is stated. */
function labelBeat(net: FlowNet, flow: Flow, cap: boolean, lead: string, total: number): SolveStep {
  return beat(net, `${lead}Label the potentials: potential increase = ${cap ? "capacity" : "maximum"} − flow, potential decrease = flow${cap ? "" : " − minimum"}.`,
    { potentials: potNumbers(net, flow), hideBounds: true }, { runningTotal: total, totalLabel: "Flow" });
}

/** One augmentation = two beats: find the path on the current potentials (and its smallest potential), then update the potentials. */
function roundBeats(net: FlowNet, flow: Flow, path: AugmentingPath, k: number, totalAfter: number): { steps: SolveStep[]; after: Flow } {
  const after = augment(flow, path);
  const hasBack = path.steps.some((s) => s.dir === "back");
  const b = path.bottleneck;
  const used = path.steps.map((st, i) => `${st.arc} ${path.potentials[i]} → ${path.potentials[i] - b}`).join(", ");
  const steps: SolveStep[] = [
    beat(net, `Augmentation ${k}: ${arrowPath(path)}\nPotentials ${readPath(path)}: smallest = ${b}.`,
      { potentials: potNumbers(net, flow), hideBounds: true, path: path.steps }),
    beat(net, `Add ${b}: ${used}.${k === 1 ? `\nThe other potential on each arc rises by ${b}${hasBack ? " (and the reverse on a step against an arrow)" : ""}.` : ""}\nFlow ${totalAfter}.`,
      { potentials: potNumbers(net, after), hideBounds: true, path: path.steps }, { runningTotal: totalAfter, totalLabel: "Flow" }),
  ];
  return { steps, after };
}

function solveAugment(p: DecisionProblem): SolveStep[] {
  const d = p.flow!;
  const { net } = d;
  const cap = d.mode === "cap";
  const run = maxFlow(net, d.flow);
  const rounds = run.augmentations.slice(0, d.rounds ?? 2);
  const start = flowValue(net, d.flow);
  const steps: SolveStep[] = [
    labelBeat(net, d.flow, cap, `The flow shown has value ${start}. `, start),
  ];
  rounds.forEach((r, i) => steps.push(...roundBeats(net, r.before, r.path, i + 1, flowValue(net, r.after)).steps));
  const end = flowValue(net, rounds[rounds.length - 1].after);
  steps.push(beat(net, `${rounds.map((r) => `${arrowPath(r.path)} (+${r.path.bottleneck})`).join(", ")}.\nFlow ${start} → ${end}.`,
    { flow: rounds[rounds.length - 1].after }, { runningTotal: end, totalLabel: "Flow" }));
  return steps;
}

// ── Max flow, min cut ────────────────────────────────────────────────────────
function solveMaxFlow(p: DecisionProblem): SolveStep[] {
  const d = p.flow!;
  const { net } = d;
  const cap = d.mode === "cap";
  const run = maxFlow(net, d.flow);
  const start = flowValue(net, d.flow);
  const steps: SolveStep[] = [
    labelBeat(net, d.flow, cap, `Flow ${start}. `, start),
  ];
  steps[0].caption += " Then augment until no path is left.";
  run.augmentations.forEach((a, i) => steps.push(...roundBeats(net, a.before, a.path, i + 1, flowValue(net, a.after)).steps));
  const t = net.nodes.map((n) => n.id).filter((id) => !run.sSide.includes(id));
  const r = cutCapacity(net, run.sSide);
  const fin = potNumbers(net, run.flow);
  steps.push(beat(net, `No flow-augmenting path reaches T. Reached from S: ${set(net, run.sSide)}. The flow is maximal.`,
    { potentials: fin, hideBounds: true, labelled: run.sSide }, { runningTotal: run.value, totalLabel: "Flow" }));
  steps.push(beat(net, `Flow = ${cap ? "capacity" : "maximum"} − potential increase: the flows are shown. Maximal flow ${run.value}.`,
    { flow: run.flow }, { runningTotal: run.value, totalLabel: "Flow" }));
  const back = r.backward.length
    ? cap
      ? ` (${r.backward.map((a) => a.id).join(", ")} come back: nothing subtracted.)`
      : `\nBackward ${r.backward.map((a) => a.id).join(", ")}: ${r.forwardSum} − ${r.backward.map((a) => a.lo).join(" − ")}.`
    : "";
  steps.push(beat(net, `Cut ${set(net, run.sSide)} | ${set(net, t)}: ${r.forward.map((a) => a.id).join(" + ")} = ${r.forward.map((a) => a.hi).join(" + ")} = ${r.forwardSum}.${back}\nCut capacity = ${r.capacity}.`,
    { ...cutView(net, run.flow, run.sSide), flow: run.flow }, { runningTotal: run.value, totalLabel: "Flow" }));
  steps.push(beat(net, `Flow ${run.value} = cut ${r.capacity}: maximal.`,
    { ...cutView(net, run.flow, run.sSide), flow: run.flow }, { runningTotal: run.value, totalLabel: "Max flow" }));
  return steps;
}

// ── Several sources / sinks (supersource, supersink) ─────────────────────────
const superTags = (sp: NonNullable<FlowProblemData["superST"]>): Record<string, string> => ({
  ...Object.fromEntries(Object.entries(sp.sources).map(([id, c]) => [id, `supply ${c}`])),
  ...Object.fromEntries(Object.entries(sp.sinks).map(([id, c]) => [id, `demand ${c}`])),
});

function solveSuper(p: DecisionProblem): SolveStep[] {
  const d = p.flow!;
  const sp = d.superST!;
  const full = d.net;
  const byId = Object.fromEntries(full.arcs.map((a) => [a.id, a]));
  const srcIds = Object.keys(sp.sources), snkIds = Object.keys(sp.sinks);
  const start = flowValue(full, d.flow);
  const arcName = (id: string) => `${byId[id].from} → ${byId[id].to}`;
  const added = sp.superArcs.map((id) => `${arcName(id)} (${byId[id].hi})`);
  const kinds = [sp.removeS ? "supersource S" : "", sp.removeT ? "supersink T" : ""].filter(Boolean).join(" and a ");
  const steps: SolveStep[] = [
    beat(full, `${srcIds.length ? `Sources ${set(full, srcIds)}` : ""}${srcIds.length && snkIds.length ? "; " : ""}${snkIds.length ? `sinks ${set(full, snkIds)}` : ""}: add a ${kinds} to get one source and one sink.`,
      { net: sp.question, labelPos: d.labelPos, flow: d.flow, nodeTags: superTags(sp) }, { runningTotal: start, totalLabel: "Flow" }),
    beat(full, `Add ${added.join(", ")}.`,
      { flow: d.flow, focus: sp.superArcs }, { runningTotal: start, totalLabel: "Flow" }),
  ];
  const inner: DecisionProblem = { ...p, flow: { ...d, subTool: "maxFlow", superST: undefined } };
  steps.push(...solveMaxFlow(inner));
  const run = maxFlow(full, d.flow);
  const lines = [
    ...srcIds.map((id) => { const a = byId[`S${id}`]; return `${id} supplies ${run.flow[a.id]} of ${a.hi}`; }),
    ...snkIds.map((id) => { const a = byId[`${id}T`]; return `${id} takes ${run.flow[a.id]} of ${a.hi}`; }),
  ];
  steps.push(beat(full, `Maximum flow ${run.value}:\n${lines.join("\n")}.`,
    { net: sp.question, labelPos: d.labelPos, flow: run.flow, nodeTags: superTags(sp) }, { runningTotal: run.value, totalLabel: "Max flow" }));
  return steps;
}

// ── Restricted vertices (node capacities) ────────────────────────────────────
// Split each restricted vertex into two joined by an arc of capacity = its throughput; then the ordinary max-flow working applies
// to the split network, ending with the point that the minimum cut runs through a split arc.
function solveNodeCap(p: DecisionProblem): SolveStep[] {
  const d = p.flow!;
  const caps = d.nodeCaps!;
  const sp = d.split!;
  const ids = Object.keys(caps);
  const sn = sp.net;
  const stamp = (st: SolveStep): SolveStep => ({ ...st, flowView: { ...(st.flowView ?? {}), net: sn, labelPos: sp.labelPos } });
  const plural = ids.length > 1;
  const steps: SolveStep[] = [
    stamp(beat(sn, `Split ${ids.map((id) => `${id} into ${sp.inNode[id]} (arrivals) and ${sp.outNode[id]} (departures), joined by ${sp.nodeArc[id]} with capacity ${caps[id]}`).join("; ")}.\n${ids.map((id) => `${sp.nodeArc[id]} = ${sp.flow[sp.nodeArc[id]]}`).join(", ")} (the flow through ${plural ? "each vertex" : ids[0]}).`,
      { flow: sp.flow, focus: ids.map((id) => sp.nodeArc[id]) }, { runningTotal: flowValue(sn, sp.flow), totalLabel: "Flow" })),
  ];
  const inner: DecisionProblem = { ...p, flow: { ...d, subTool: "maxFlow", net: sn, flow: sp.flow, labelPos: sp.labelPos, nodeCaps: undefined, split: undefined } };
  steps.push(...solveMaxFlow(inner).map(stamp));
  const run = maxFlow(sn, sp.flow);
  const limiting = ids.filter((id) => run.sSide.includes(sp.inNode[id]) && !run.sSide.includes(sp.outNode[id]));
  const unrestricted = maxFlow(d.net, d.flow).value;
  steps.push(stamp(beat(sn, `The minimum cut passes through ${limiting.map((id) => sp.nodeArc[id]).join(" and ")}: that is what limits the flow (${unrestricted} without the restriction, ${run.value} with it).`,
    { ...cutView(sn, run.flow, run.sSide), flow: run.flow }, { runningTotal: run.value, totalLabel: "Max flow" })));
  return steps;
}

export function solveFlowProblem(p: DecisionProblem): SolveStep[] {
  switch (p.flow!.subTool) {
    case "nodeCap": return solveNodeCap(p);
    case "superST": return solveSuper(p);
    case "initialFlow": return solveInitial(p);
    case "missingFlow": return solveMissing(p);
    case "potentials": return solvePotentials(p);
    case "cutValue": return solveCut(p);
    case "augment": return solveAugment(p);
    default: return solveMaxFlow(p);
  }
}

/** How the diagram looks in Question mode (before any working is shown). */
export function questionView(p: DecisionProblem): FlowViewState {
  const d = p.flow!;
  if (d.subTool === "initialFlow") return {};
  if (d.subTool === "nodeCap") return { flow: d.flow, nodeCaps: d.nodeCaps };
  if (d.subTool === "superST") return { flow: d.flow, net: d.superST!.question, labelPos: d.labelPos, nodeTags: superTags(d.superST!) };
  if (d.subTool === "potentials") return { potentials: potNumbers(d.net, d.flow) };
  if (d.subTool === "missingFlow") return { flow: Object.fromEntries(d.net.arcs.filter((a) => !d.missing!.includes(a.id)).map((a) => [a.id, d.flow[a.id]])), unknown: d.missing };
  if (d.subTool === "cutValue") return d.showCutLine ? { ...cutView(d.net, d.flow, d.sSide!), flow: undefined, cutLabels: false } : {};
  return { flow: d.flow };
}
