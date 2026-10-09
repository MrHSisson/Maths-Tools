// ═══════════════════════════════════════════════════════════════════════════
// Network Flows — the worked solution as SolveStep[] (one beat = the next thing a
// teacher would write at the board). Every number in a caption is read off flow.ts,
// never recomputed here, so the working cannot disagree with the answer.
// ═══════════════════════════════════════════════════════════════════════════

import {
  augment, cutCapacity, peelMissing, flowValue, isFeasibleFlow, maxFlow, orderNodes, pathLabel, pathNodes, potentials,
  type AugmentingPath, type Flow, type FlowNet, type FlowViewState,
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
    steps.push(beat(net, `Every arc must carry at least its minimum, and no more than its maximum. The arcs with a minimum above 0 are ${lows.map((a) => `${a.id} (${a.lo})`).join(", ")}.\nMethod: take the arc furthest below its minimum, choose a route from S to T through it (preferably one that passes through other arcs still below their minimum), and send what that arc still needs — without going over any maximum. Repeat until every arc is at its minimum.`,
      { focus: lows.map((a) => a.id) }));
  } else if (d.style === "find") {
    steps.push(beat(net, `Method: choose a route from S to T with spare capacity, and send as much as it will carry (the smallest spare capacity on the route) — but no more than is still needed. Repeat with another route until the flow has value ${d.target}.`, {}));
  } else {
    steps.push(beat(net, "Put each given path's flow on every arc along it. Where two paths share an arc, the flows add.", {}));
  }
  const findNote = (acc2: Flow, tot: number): string => {
    if (d.style !== "find") return "";
    if (mode === "cap") return tot < (d.target ?? tot) ? `\nFlow so far ${tot}; still needed ${(d.target ?? tot) - tot}.` : `\nThe flow has reached ${tot}.`;
    const below = net.arcs.filter((a) => (acc2[a.id] ?? 0) < a.lo);
    return below.length ? `\nStill below their minimum: ${below.map((a) => `${a.id} (${acc2[a.id] ?? 0} of ${a.lo})`).join(", ")}.` : "\nEvery arc is now at least its minimum.";
  };
  let total = 0;
  paths.forEach((pt, i) => {
    for (const id of pt.arcs) acc[id] = (acc[id] ?? 0) + pt.amount;
    total += pt.amount;
    const arcs = pt.arcs.map((id) => byId[id]);
    steps.push(beat(net, `Send ${pt.amount} along ${pathLabel(net, pt.arcs)}: add ${pt.amount} to ${arcs.map((a) => a.id).join(", ")}.\n${pt.arcs.map((id) => `${id} = ${acc[id]}`).join(", ")}.${i > 0 && pt.arcs.some((id) => paths.slice(0, i).some((q) => q.arcs.includes(id))) ? "\nSome of these arcs already carry flow from an earlier path, so the amounts add." : ""}${findNote(acc, total)}`,
      { flow: { ...acc }, path: pt.arcs.map((id) => ({ arc: id, dir: "fwd" as const, to: byId[id].to })) }, { runningTotal: total, totalLabel: "Flow" }));
  });
  steps.push(beat(net, `${net.arcs.some((a) => flow[a.id] === 0) ? "Every arc not used carries 0. " : ""}The flow value is ${flowValue(net, flow)}.`, { flow }, { runningTotal: flowValue(net, flow), totalLabel: "Flow" }));
  const check = isFeasibleFlow(net, flow);
  const nodes = net.nodes.map((n) => n.id).filter((id) => id !== "S" && id !== "T");
  const bal = nodes.map((id) => {
    const inn = net.arcs.filter((a) => a.to === id).map((a) => flow[a.id]);
    const out = net.arcs.filter((a) => a.from === id).map((a) => flow[a.id]);
    return `${id}: in ${inn.join(" + ") || "0"} = ${inn.reduce((x, y) => x + y, 0)}, out ${out.join(" + ") || "0"} = ${out.reduce((x, y) => x + y, 0)}`;
  });
  steps.push(beat(net, `Check the flow in equals the flow out at every vertex except S and T:\n${bal.join("\n")}${check.ok ? "" : "\n(!) " + check.violations.join("; ")}`, { flow }, { runningTotal: flowValue(net, flow), totalLabel: "Flow" }));
  steps.push(beat(net, mode === "minmax"
    ? `Check every arc lies between its minimum and its maximum. It does, so this is a feasible flow (other feasible flows exist).`
    : `Check no arc is above its capacity. It is not, so this is a valid flow${d.style === "find" ? ` of value ${d.target}` : ""} (other valid flows exist).`,
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
      ? "Potential increase = capacity − flow, and potential decrease = flow. So the flow in an arc is its potential decrease (or capacity − potential increase). Work through the arcs leaving each vertex in turn."
      : "Potential increase = maximum − flow, and potential decrease = flow − minimum. So the flow in an arc is maximum − potential increase (or minimum + potential decrease). Work through the arcs leaving each vertex in turn.",
    { potentials: { ...remaining } }),
  ];
  for (const g of groups) {
    const arcs = net.arcs.filter((a) => a.from === g);
    const lines = arcs.map((a) => {
      found[a.id] = flow[a.id];
      delete remaining[a.id];
      return mode === "cap"
        ? `${a.id}: flow = capacity − potential increase = ${a.hi} − ${pots[a.id].fwd} = ${flow[a.id]}  (check: potential decrease ${pots[a.id].bwd})`
        : `${a.id}: flow = maximum − potential increase = ${a.hi} − ${pots[a.id].fwd} = ${flow[a.id]}  (check: ${a.lo} + potential decrease ${pots[a.id].bwd})`;
    });
    steps.push(beat(net, `Arcs leaving ${g}\n${lines.join("\n")}`, {
      potentials: { ...remaining }, flow: { ...found }, focus: arcs.map((a) => a.id),
    }));
  }
  const total = flowValue(net, flow);
  const outS = net.arcs.filter((a) => a.from === "S").map((a) => flow[a.id]);
  steps.push(beat(net, `Every flow is found. The value of the flow is the total leaving S: ${outS.join(" + ")} = ${total}.`,
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
    beat(net, `At every vertex except S and T, the flow in equals the flow out. ${missing.length === 1 ? "One arc has its flow missing" : "Some arcs have their flows missing"}: find ${missing.length === 1 ? "it" : "them"} by looking for a vertex with exactly one unknown arc.`,
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
  steps.push(beat(net, `All the flows are found: ${missing.map((id) => `${id} = ${flow[id]}`).join(", ")}. The flow value is ${flowValue(net, flow)}.`,
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

/** every arc whose potentials change this round, old → new (the rest are unchanged) */
function potChanges(net: FlowNet, before: Flow, after: Flow): string {
  const a = potNumbers(net, before), b = potNumbers(net, after);
  return net.arcs.filter((x) => a[x.id].fwd !== b[x.id].fwd || a[x.id].bwd !== b[x.id].bwd)
    .map((x) => `${x.id}: increase ${a[x.id].fwd} → ${b[x.id].fwd}, decrease ${a[x.id].bwd} → ${b[x.id].bwd}`).join("\n") + "\nAll other potentials are unchanged.";
}

/** The beat that labels the potentials for the first time — the only place their formula is stated. */
function labelBeat(net: FlowNet, flow: Flow, cap: boolean, lead: string, total: number): SolveStep {
  return beat(net, `${lead}Label the potentials on every arc: potential increase = ${cap ? "capacity" : "maximum"} − flow, potential decrease = flow${cap ? "" : " − minimum"}.`,
    { potentials: potNumbers(net, flow), hideBounds: true }, { runningTotal: total, totalLabel: "Flow" });
}

/** One augmentation = three beats: find the path on the current potentials, take the bottleneck, update the potentials. */
function roundBeats(net: FlowNet, flow: Flow, path: AugmentingPath, k: number, totalAfter: number): { steps: SolveStep[]; after: Flow } {
  const after = augment(flow, path);
  const hasBack = path.steps.some((s) => s.dir === "back");
  const pots = { potentials: potNumbers(net, flow), hideBounds: true };
  const steps: SolveStep[] = [
    beat(net, `Augmentation ${k}. A flow-augmenting path: ${arrowPath(path)}.\nEvery step has a potential above 0${hasBack ? " (a step against an arrow uses its potential decrease)" : ""}:\n${readPath(path)}`,
      { ...pots, path: path.steps }),
    beat(net, `Augmentation ${k}. The flow can be increased by the smallest potential on the path.\nmin(${path.potentials.join(", ")}) = ${path.bottleneck}`,
      { ...pots, path: path.steps }),
    beat(net, `Augmentation ${k}. Update the potentials along the path: on each step along an arrow the potential increase goes down by ${path.bottleneck} and the potential decrease goes up by ${path.bottleneck}${hasBack ? "; on a step against an arrow it is the other way round" : ""}.\n${potChanges(net, flow, after)}\nThe flow value is now ${totalAfter}.`,
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
  steps.push(beat(net, `${rounds.length} augmentation${rounds.length > 1 ? "s" : ""} made: ${rounds.map((r) => `${arrowPath(r.path)} (+${r.path.bottleneck})`).join(", ")}.\nThe flow has increased from ${start} to ${end}.`,
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
    beat(net, `The flow shown has value ${start}. Keep finding flow-augmenting paths until there are none left.`, { flow: d.flow }, { runningTotal: start, totalLabel: "Flow" }),
    labelBeat(net, d.flow, cap, "", start),
  ];
  run.augmentations.forEach((a, i) => steps.push(...roundBeats(net, a.before, a.path, i + 1, flowValue(net, a.after)).steps));
  const t = net.nodes.map((n) => n.id).filter((id) => !run.sSide.includes(id));
  const r = cutCapacity(net, run.sSide);
  const fin = potNumbers(net, run.flow);
  steps.push(beat(net, `With these updated potentials, label again: no flow-augmenting path reaches T, so the flow is maximal. The vertices that can still be reached from S are ${set(net, run.sSide)}.\nFinal potentials:\n${net.arcs.map((a) => `${a.id}: increase ${fin[a.id].fwd}, decrease ${fin[a.id].bwd}`).join("\n")}`,
    { potentials: fin, hideBounds: true, labelled: run.sSide }, { runningTotal: run.value, totalLabel: "Flow" }));
  steps.push(beat(net, `Reinterpret the final potentials as flows (${cap ? "flow = capacity − potential increase" : "flow = maximum − potential increase"}):\n${net.arcs.map((a) => `${a.id}: ${a.hi} − ${fin[a.id].fwd} = ${run.flow[a.id]}`).join("\n")}\nThe maximal flow has value ${run.value}.`,
    { flow: run.flow }, { runningTotal: run.value, totalLabel: "Flow" }));
  const back = r.backward.length
    ? cap
      ? `\nArc${r.backward.length > 1 ? "s" : ""} ${r.backward.map((a) => a.id).join(", ")} come${r.backward.length > 1 ? "" : "s"} back from the T side; nothing is subtracted for ${r.backward.length > 1 ? "them" : "it"} (capacity-only).`
      : `\nBackward arcs (T side → S side): ${r.backward.map((a) => a.id).join(", ")}, minimums subtracted: ${r.forwardSum} − ${r.backward.map((a) => a.lo).join(" − ")}.`
    : "";
  steps.push(beat(net, `Cut ${set(net, run.sSide)} | ${set(net, t)}: forward arcs ${r.forward.map((a) => a.id).join(", ")}, ${r.forward.map((a) => a.hi).join(" + ")} = ${r.forwardSum}.${back}\nCapacity of the cut = ${r.capacity}.`,
    { ...cutView(net, run.flow, run.sSide), flow: run.flow }, { runningTotal: run.value, totalLabel: "Flow" }));
  steps.push(beat(net, `The flow of ${run.value} equals the capacity of a cut, ${r.capacity}. By the maximum flow – minimum cut theorem, the flow is maximal.`,
    { ...cutView(net, run.flow, run.sSide), flow: run.flow }, { runningTotal: run.value, totalLabel: "Max flow" }));
  return steps;
}

export function solveFlowProblem(p: DecisionProblem): SolveStep[] {
  switch (p.flow!.subTool) {
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
  if (d.subTool === "potentials") return { potentials: potNumbers(d.net, d.flow) };
  if (d.subTool === "missingFlow") return { flow: Object.fromEntries(d.net.arcs.filter((a) => !d.missing!.includes(a.id)).map((a) => [a.id, d.flow[a.id]])), unknown: d.missing };
  if (d.subTool === "cutValue") return d.showCutLine ? { ...cutView(d.net, d.flow, d.sSide!), flow: undefined, cutLabels: false } : {};
  return { flow: d.flow };
}
