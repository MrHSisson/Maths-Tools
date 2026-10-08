// ═══════════════════════════════════════════════════════════════════════════
// Network Flows — the worked solution as SolveStep[] (one beat = the next thing a
// teacher would write at the board). Every number in a caption is read off flow.ts,
// never recomputed here, so the working cannot disagree with the answer.
// ═══════════════════════════════════════════════════════════════════════════

import {
  cutCapacity, peelMissing, sortedAugmentingPaths, flowValue, isFeasibleFlow, maxFlow, orderNodes, pathLabel, pathNodes, potentials,
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
    steps.push(beat(net, `Every arc must carry at least its minimum. The arcs with a minimum above 0 are ${lows.map((a) => `${a.id} (${a.lo})`).join(", ")}. Build the flow up one path at a time so each of these is covered.`,
      { focus: lows.map((a) => a.id) }));
  } else if (d.style === "find") {
    steps.push(beat(net, `Build a flow of value ${d.target} one path at a time, never going above a capacity.`, {}));
  } else {
    steps.push(beat(net, "Put each given path's flow on every arc along it. Where two paths share an arc, the flows add.", {}));
  }
  let total = 0;
  paths.forEach((pt, i) => {
    for (const id of pt.arcs) acc[id] = (acc[id] ?? 0) + pt.amount;
    total += pt.amount;
    const arcs = pt.arcs.map((id) => byId[id]);
    steps.push(beat(net, `Send ${pt.amount} along ${pathLabel(net, pt.arcs)}: add ${pt.amount} to ${arcs.map((a) => a.id).join(", ")}.\n${pt.arcs.map((id) => `${id} = ${acc[id]}`).join(", ")}.${i > 0 && pt.arcs.some((id) => paths.slice(0, i).some((q) => q.arcs.includes(id))) ? "\nSome of these arcs already carry flow from an earlier path, so the amounts add." : ""}`,
      { flow: { ...acc }, path: pt.arcs.map((id) => ({ arc: id, dir: "fwd" as const, to: byId[id].to })) }, { runningTotal: total, totalLabel: "Flow" }));
  });
  steps.push(beat(net, `Every arc not used carries 0. The flow value is ${flowValue(net, flow)}.`, { flow }, { runningTotal: flowValue(net, flow), totalLabel: "Flow" }));
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
    const value = flow[arc];
    known[arc] = value;
    left.delete(arc);
    steps.push(beat(net,
      `At ${vertex} only ${arc} is unknown — call it ${sym[i]}.\nFlow in: ${inn.map(term).join(" + ")}\nFlow out: ${out.map(term).join(" + ")}\n${sym[i]} = ${otherTotal}${sameOthers.length ? ` − ${sameOthers.join(" − ")}` : ""} = ${value}`,
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
      ? `Arc${r.backward.length > 1 ? "s" : ""} ${r.backward.map((a) => a.id).join(", ")} come${r.backward.length > 1 ? "" : "s"} back from the T side to the S side. A capacity-only network has no minimums (they are all 0), so nothing is subtracted.`
      : `Arc${r.backward.length > 1 ? "s" : ""} ${r.backward.map((a) => a.id).join(", ")} come${r.backward.length > 1 ? "" : "s"} back from the T side to the S side (backward). Subtract ${r.backward.length > 1 ? "their minimums" : "its minimum"}.\n${r.forwardSum} − ${r.backward.map((a) => a.lo).join(" − ")} = ${r.capacity}`,
      view(true), { runningTotal: r.capacity, totalLabel: "Cut" }));
  }
  steps.push(beat(net, `The capacity of the cut is ${r.capacity}.`, view(true), { runningTotal: r.capacity, totalLabel: "Cut" }));
  return steps;
}

// ── Augmenting ───────────────────────────────────────────────────────────────
function describeSteps(net: FlowNet, flow: Flow, path: AugmentingPath): string {
  const arcs = Object.fromEntries(net.arcs.map((a) => [a.id, a]));
  return path.steps.map((s, i) => {
    const a = arcs[s.arc];
    return s.dir === "fwd"
      ? `${a.id}: potential increase ${a.hi} − ${flow[a.id]} = ${path.potentials[i]}`
      : `${a.id} (against the arrow): potential decrease ${flow[a.id]} − ${a.lo} = ${path.potentials[i]}`;
  }).join("\n");
}

function augmentBeats(net: FlowNet, flow: Flow, path: AugmentingPath, k: number | null, totalAfter: number): { steps: SolveStep[]; after: Flow } {
  const after = { ...flow };
  for (const s of path.steps) after[s.arc] += s.dir === "fwd" ? path.bottleneck : -path.bottleneck;
  const tag = k === null ? "" : `Augmentation ${k}. `;
  const hasBack = path.steps.some((s) => s.dir === "back");
  // While augmenting, only the potentials are drawn — the flows and the min/max labels are hidden to keep the
  // picture clear, and are read back off at the end.
  const before = { potentials: potNumbers(net, flow), hideBounds: true };
  const steps: SolveStep[] = [
    beat(net, `${tag}Label the potentials on every arc: potential increase = maximum − flow, potential decrease = flow − minimum.`, before),
    beat(net, `${tag}A flow-augmenting path: ${arrowPath(path)}.\nEvery step has potential above 0${hasBack ? " (a step against an arrow uses the potential decrease)" : ""}.\n${describeSteps(net, flow, path)}`,
      { ...before, path: path.steps }),
    beat(net, `${tag}The flow can be increased by the smallest potential on the path.\nmin(${path.potentials.join(", ")}) = ${path.bottleneck}`,
      { ...before, path: path.steps }),
    beat(net, `${tag}Update the potentials along the path: on each step along an arrow the potential increase goes down by ${path.bottleneck} and the potential decrease goes up by ${path.bottleneck}${hasBack ? "; on a step against an arrow it is the other way round" : ""}. The flow value is now ${totalAfter}.`,
      { potentials: potNumbers(net, after), hideBounds: true, path: path.steps }, { runningTotal: totalAfter, totalLabel: "Flow" }),
  ];
  return { steps, after };
}

function solveAugment(p: DecisionProblem): SolveStep[] {
  const d = p.flow!;
  const { net, flow } = d;
  const paths = sortedAugmentingPaths(net, flow);
  const before = flowValue(net, flow);
  const pots = { potentials: potNumbers(net, flow), hideBounds: true };
  const steps: SolveStep[] = [
    beat(net, `The flow shown has value ${before}. Find every flow-augmenting path from S to T. First label the potentials on every arc: potential increase = ${d.mode === "cap" ? "capacity" : "maximum"} − flow, potential decrease = flow${d.mode === "cap" ? "" : " − minimum"}.`,
      pots, { runningTotal: before, totalLabel: "Flow" }),
  ];
  paths.forEach((path, i) => {
    const hasBack = path.steps.some((s) => s.dir === "back");
    steps.push(
      beat(net, `Path ${i + 1}: ${arrowPath(path)}.\nEvery step has potential above 0${hasBack ? " (a step against an arrow uses the potential decrease)" : ""}.\n${describeSteps(net, flow, path)}`,
        { ...pots, path: path.steps }),
      beat(net, `Path ${i + 1}: the flow can be increased by the smallest potential on the path.\nmin(${path.potentials.join(", ")}) = ${path.bottleneck}`,
        { ...pots, path: path.steps }),
    );
  });
  const used = new Map<string, number>();
  for (const pt of paths) for (const s of pt.steps) used.set(s.arc, (used.get(s.arc) ?? 0) + 1);
  const shares = [...used.values()].some((c) => c > 1);
  steps.push(beat(net, `There are ${paths.length} flow-augmenting paths:\n${paths.map((pt) => `${arrowPath(pt)}: increase by ${pt.bottleneck}`).join("\n")}${shares ? "\nThe paths share arcs, so the flow can be increased along any one of them — not all of them by their full amounts at once." : ""}`,
    { flow }, { runningTotal: before, totalLabel: "Flow" }));
  return steps;
}

// ── Max flow, min cut ────────────────────────────────────────────────────────
function solveMaxFlow(p: DecisionProblem): SolveStep[] {
  const d = p.flow!;
  const { net } = d;
  const run = maxFlow(net, d.flow);
  const steps: SolveStep[] = [
    beat(net, `The flow shown has value ${flowValue(net, d.flow)}. Keep finding flow-augmenting paths until there are none left.`, { flow: d.flow },
      { runningTotal: flowValue(net, d.flow), totalLabel: "Flow" }),
  ];
  run.augmentations.forEach((a, i) => {
    const total = flowValue(net, a.after);
    steps.push(...augmentBeats(net, a.before, a.path, i + 1, total).steps.slice(i === 0 ? 0 : 1)); // later rounds start from the potentials the last round left
  });
  const t = net.nodes.map((n) => n.id).filter((id) => !run.sSide.includes(id));
  const r = cutCapacity(net, run.sSide);
  steps.push(beat(net, `Label again: no flow-augmenting path reaches T, so the flow is maximal. The vertices that can still be reached from S are ${set(net, run.sSide)}.`,
    { potentials: potNumbers(net, run.flow), hideBounds: true, labelled: run.sSide }, { runningTotal: run.value, totalLabel: "Flow" }));
  steps.push(beat(net, `Reinterpret the final potentials as flows: the maximal flow has value ${run.value}.`,
    { flow: run.flow }, { runningTotal: run.value, totalLabel: "Flow" }));
  const back = r.backward.length
    ? `\nBackward arcs (T side → S side): ${r.backward.map((a) => a.id).join(", ")}, minimums subtracted: ${r.forwardSum} − ${r.backward.map((a) => a.lo).join(" − ")}.`
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
