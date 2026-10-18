// ═══════════════════════════════════════════════════════════════════════════
// Network Flows — the PARTS LIBRARY (specs/flow-parts-library.md). A part is one question idea with exam wording: its prompt, mark-scheme lines, model
// answer, picture state and (?) working. Every number comes from the same solver as the skills tabs, so a part can never disagree with them.
// A part's `build` returns null when the network does not suit it (so it doubles as the "needs" check) and may leave facts in `c.facts` for the
// parts after it (the cut it named, the minimum cut, the maximum flow). Recipes (flowExam.ts) put parts in the order the papers set them.
// ═══════════════════════════════════════════════════════════════════════════

import {
  allCuts, cutCapacity, flowValue, maxFlow, minCutBruteForce, orderNodes, pathNodes, peelMissing, splitNodes,
  type Flow, type FlowMode, type FlowNet, type FlowProblemData, type FlowViewState,
} from "./flow";
import { drawable } from "./flowGenerate";
import { cutView, potNumbers, solveFlowProblem } from "./flowSolve";
import type { DecisionProblem, ExamMark, ExamPart, SolveStep } from "./types";

/** What a part is told about the question it is being built into. */
export interface PartCtx {
  level: 1 | 2 | 3;
  mode: FlowMode;
  /** the skill problem the question is built on (its network, flow and, for some recipes, a cut or missing arcs) */
  base: DecisionProblem;
  d: FlowProblemData;
  net: FlowNet;
  /** the context's units ("litres per second") and what flows ("water pipes") */
  U: string;
  thing: string;
  /** what earlier parts worked out and later parts reuse (the cut named, the second cut, the maximum flow run…) */
  facts: Record<string, any>;
  /** the parts built so far */
  built: ExamPart[];
}
export interface PartDef {
  id: string;
  /** the idea it tests, so a Practise-this link / the Explain and justify tab can find it */
  idea: string;
  tier: "core" | "reasoning";
  /** only in the earlier specification: built, but off by default (marked * in the tool) */
  legacy?: boolean;
  /** one or more parts, or null when this network does not suit the part */
  build: (c: PartCtx) => ExamPart[] | null;
}

export const CONTEXTS = [
  { thing: "water pipes", unit: "litres per second" },
  { thing: "gas pipes", unit: "cubic metres per second" },
  { thing: "oil pipelines", unit: "thousand barrels per day" },
  { thing: "cooling pipes in a factory", unit: "litres per minute" },
];
export const pickOne = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

// ── helpers ────────────────────────────────────────────────────────────────
export const set = (net: FlowNet, ids: string[]) => `{${orderNodes(net, ids).join(", ")}}`;
export const notation = (net: FlowNet, s: string[]) => `${set(net, s)} | ${set(net, net.nodes.map((n) => n.id).filter((id) => !s.includes(id)))}`;
export const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs[0] ?? "");
export const shuf = <T,>(a: T[]): T[] => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
/** The first cut in the list that can be drawn as one dashed line (checked lazily: the test is the expensive part, and a 10-vertex network has 256 cuts). */
export const firstDrawable = (net: FlowNet, cuts: string[][]): string[] | null => { for (const c of cuts) if (drawable(net, c)) return c; return null; };
export const mk = (code: string, text: string): ExamMark => ({ code, text });
export const part = (label: string, prompt: string, scheme: ExamMark[], model: string[], view?: FlowViewState, explain?: string[], working?: SolveStep[]): ExamPart => ({ label, prompt, marks: scheme.length, scheme, model, explain, working, view });

/** The working for a part: the SAME solver the skills tabs use, run on this question's own network (so the exam can never disagree with the skills),
 *  with every step's picture pinned to the network it is about. */
export function working(base: DecisionProblem, patch: Partial<FlowProblemData>): SolveStep[] {
  const data = { ...base.flow!, ...patch } as FlowProblemData;
  const steps = solveFlowProblem({ ...base, flow: data });
  return steps.map((st) => ({ ...st, flowView: { net: data.net, labelPos: data.labelPos, ...(st.flowView ?? {}) } }));
}

/** what a cut adds up: "AB + SC = 3 + 7 = 10" */
export const sum = (r: ReturnType<typeof cutCapacity>) => `${r.forward.map((a) => a.id).join(" + ")} = ${r.forward.map((a) => a.hi).join(" + ")} = ${r.capacity}`;

/** the maximum flow run from the question's own flow, worked once and shared */
export const runOf = (cx: PartCtx): ReturnType<typeof maxFlow> => (cx.facts.run ??= maxFlow(cx.net, cx.d.flow));
const ctxOf = (cx: PartCtx) => ({ thing: cx.thing, unit: cx.U });

export function interestingMinCut(net: FlowNet, V: number, fallback: string[]): string[] | null {
  const n = net.nodes.length;
  const cuts = allCuts(net).filter((c) => c.length >= 2 && n - c.length >= 2 && cutCapacity(net, c).capacity === V);
  const drawn = firstDrawable(net, shuf(cuts));
  if (drawn) return drawn;
  return fallback.length >= 2 && n - fallback.length >= 2 && drawable(net, fallback) ? fallback : null;
}

/** "Comment on the validity of the claim": would increasing the capacity of one arc by k raise the maximum flow? Computed by recomputing the maximum flow. */
export function claimPart(net: FlowNet, run: ReturnType<typeof maxFlow>, cut: string[], U: string, label: string, thing: string): ExamPart {
  const V = run.value;
  const k = 2 + Math.floor(Math.random() * 4);
  const gainOf = (id: string) => {
    const raised: FlowNet = { ...net, arcs: net.arcs.map((a) => (a.id === id ? { ...a, hi: a.hi + k } : a)) };
    return maxFlow(raised, run.flow).value - V;
  };
  const gains = net.arcs.map((a) => ({ a, g: gainOf(a.id) }));
  const wantTrue = Math.random() < 0.5;
  const pool = gains.filter((x) => (wantTrue ? x.g > 0 : x.g === 0));
  const fallback = gains.filter((x) => (wantTrue ? x.g === 0 : x.g > 0));
  const chosen = pickOne(pool.length ? pool : fallback);
  const a = chosen.a, g = chosen.g;
  const f = run.flow[a.id];
  const valid = g > 0;
  const verdict = valid ? "correct" : "incorrect";
  // a full pipe that crosses the minimum cut shown is still no help when ANOTHER minimum cut avoids it
  const inShownCut = cutCapacity(net, cut).forward.some((x) => x.id === a.id);
  const why = valid
    ? `${thing === "pipe" ? "Pipe" : "Arc"} ${a.id} is full and lies in the minimum cut ${notation(net, cut)}, so it is limiting the flow: increasing its capacity by ${k} raises the maximum flow by ${g} ${U}, to ${V + g}.`
    : f < a.hi
      ? `${thing === "pipe" ? "Pipe" : "Arc"} ${a.id} carries ${f} ${U}, below its capacity of ${a.hi}, so it is not limiting the flow. Increasing its capacity will not change the maximum flow of ${V} ${U}.`
      : inShownCut
        ? `${thing === "pipe" ? "Pipe" : "Arc"} ${a.id} is full and lies in the minimum cut ${notation(net, cut)} of value ${V}, but it is not in every minimum cut: another minimum cut avoids it and still limits the flow. Increasing its capacity by ${k} will not change the maximum flow.`
        : `${thing === "pipe" ? "Pipe" : "Arc"} ${a.id} is full, but it is not in a minimum cut: the flow is limited elsewhere, by the cut ${notation(net, cut)} of value ${V}. Increasing its capacity by ${k} will not change the maximum flow.`;
  return part(label, `A trainee engineer claims that increasing the capacity of pipe ${a.id} by ${k} ${U} will increase the maximum flow through the network. Comment on the validity of this claim.`,
    [
      mk("M1", `Explains whether pipe ${a.id} is limiting the flow (${valid ? "it is part of the minimum cut" : f < a.hi ? "it is not full" : inShownCut ? "it is full but not in every minimum cut" : "it is full but not in the minimum cut"}).`),
      mk("R1", `Concludes explicitly that the claim is ${verdict}${valid ? ` (the maximum flow rises by ${g}, to ${V + g} ${U})` : ""}. A conclusion that does not state whether the claim is correct loses this mark.`),
    ],
    [why, `So the engineer's claim is ${verdict}.`],
    { ...cutView(net, run.flow, cut, true, false), focus: [a.id], flow: { ...run.flow } },
    [`Look at pipe ${a.id}: it carries ${f} of a possible ${a.hi} ${U}.`, "A pipe only limits the flow if it is full and lies in a minimum cut. Increasing any other pipe changes nothing.", "Always finish by stating whether the claim is correct or incorrect."]);
}

/** Flow through one vertex restricted to c (cap networks only): split it, find the new minimum cut. */
export function restrictedPart(base: DecisionProblem, run: ReturnType<typeof maxFlow>, U: string, label: string): ExamPart | null {
  const net = base.flow!.net, labelPos = base.flow!.labelPos;
  const V = run.value;
  const inner = net.nodes.map((n) => n.id).filter((id) => id !== "S" && id !== "T");
  const options = inner.map((v) => ({ v, t: net.arcs.filter((a) => a.to === v).reduce((s, a) => s + run.flow[a.id], 0) })).filter((x) => x.t >= 5);
  for (const { v, t } of options.sort(() => Math.random() - 0.5)) {
    const c = t - (2 + Math.floor(Math.random() * 3));
    if (c < 2) continue;
    const sp = splitNodes(net, { [v]: c }, labelPos, run.flow);
    const M = minCutBruteForce(sp.net);
    if (M.capacity >= V || M.capacity < 1) continue;
    return part(label, `The flow through vertex ${v} is now restricted to a maximum of ${c} ${U}. Find the new maximum flow through the network, and explain what has changed.`,
      [
        mk("M1", `Models the restriction: splits ${v} into ${sp.inNode[v]} (arrivals) and ${sp.outNode[v]} (departures) joined by an arc of capacity ${c}, or otherwise limits the flow through ${v} to ${c}.`),
        mk("A1", `States that the maximum flow falls from ${V} to ${M.capacity} ${U} (the new minimum cut passes through the restricted vertex).`),
      ],
      [`Split ${v} into ${sp.inNode[v]} and ${sp.outNode[v]}, joined by an arc of capacity ${c}.`, `The maximum flow falls from ${V} to ${M.capacity} ${U}: the restriction on ${v} is now limiting the flow.`],
      { net: sp.net, labelPos: sp.labelPos, focus: [sp.nodeArc[v]] },
      [`Arcs arriving at ${v} now go into ${sp.inNode[v]}; arcs leaving go out of ${sp.outNode[v]}.`, `The new minimum cut ${notation(sp.net, M.sSide)} has value ${M.capacity}.`],
      // the split network starts from NO flow: the unrestricted maximum flow would break the cap on the new arc, and the working then builds up to the restricted maximum
      working(base, { subTool: "nodeCap", nodeCaps: { [v]: c }, split: { ...sp, flow: Object.fromEntries(sp.net.arcs.map((x) => [x.id, x.lo])) } }));
  }
  return null;
}

export function augScheme(paths: { path: { bottleneck: number }; before: Flow; after: Flow }[], V0: number, V: number, U: string): { scheme: ExamMark[]; model: string[]; explain: string[] } {
  const rows = paths.map((x) => `${pathNodes(x.path as never).join("")} | +${x.path.bottleneck}`);
  const total = V - V0;
  const scheme: ExamMark[] = [mk("M1", "Finds one correct flow-augmenting path and the extra flow along it (T may be omitted from the path).")];
  if (paths.length >= 2) scheme.push(mk("A1", "Finds a second correct augmenting path and its extra flow."));
  if (paths.length >= 3) scheme.push(mk("A1", `Finds a third correct augmenting path${paths.length > 3 ? " (and any others)" : ""}, with no incorrect paths. The extra flows must total ${total}.`));
  else scheme[scheme.length - 1] = { ...scheme[scheme.length - 1], text: `${scheme[scheme.length - 1].text} The extra flows must total ${total}, with no incorrect paths.` };
  scheme.push(mk("B1", `States the maximum flow, ${V} ${U} (units required).`));
  return { scheme, model: ["Augmenting path | Extra flow", ...rows, `The extra flows total ${total}, so the maximum flow is ${V0} + ${total} = ${V} ${U}.`], explain: ["Look for a path from S to T where every step has a positive potential (the increase for a step along an arrow, the decrease for a step against one).", "The extra flow along the path is the smallest potential on it. Add it along the path, then update the potentials.", "Repeat until no such path is left. Any valid paths are accepted, as long as the extra flows total the same."] };
}

// ═══ AS ═══════════════════════════════════════════════════════════════════
const cutValue: PartDef = { id: "cutValue", idea: "cutValue", tier: "core", build: (cx) => {
  const { net, base, U } = cx; const named = cx.d.sSide; if (!named) return null;
  const rNamed = cutCapacity(net, named); cx.facts.named = named; cx.facts.rNamed = rNamed;
  const p = part("(a)", `Find the value of the cut ${notation(net, named)}.`,
        [mk("B1", `Finds the correct value of the cut, ${rNamed.capacity} ${U} (units may be condoned). Only the arcs going from the S side to the T side are added.`)],
        [`${sum(rNamed)} ${U}`],
        cutView(net, {}, named, true, true),
        [`The cut separates the S side ${set(net, named)} from the T side.`, `Add the capacities of the arcs going from the S side to the T side: ${rNamed.forward.map((a) => a.id).join(", ")}.`, "An arc that comes back across the cut is not counted."]);
  p.working = working(base, { subTool: "cutValue", sSide: named, course: "as" });
  return [p];
} };
const cutWrite: PartDef = { id: "cutWrite", idea: "cutValue", tier: "core", build: (cx) => {
  const { net, base, U, d } = cx; const named: string[] = cx.facts.named; const rNamed = cx.facts.rNamed; if (!named) return null;
    const minCut = maxFlow(net, d.flow).sSide.join();
    const smaller = allCuts(net).filter((c) => c.join() !== named.join() && cutCapacity(net, c).capacity < rNamed.capacity && cutCapacity(net, c).capacity >= 6);
  if (!smaller.length) return null;
    const preferMin = Math.random() < 0.5 ? smaller.filter((c) => c.join() === minCut) : [];
    const other = firstDrawable(net, [...preferMin, ...shuf(smaller)]);
  if (!other) return null;
  const rOther = cutCapacity(net, other); cx.facts.other = other; cx.facts.rOther = rOther;
  const p = part("(b)", `Write down a cut with a value of ${rOther.capacity} ${U}.`,
        [mk("B1", `Gives a valid cut of value ${rOther.capacity}. Any cut with this value is acceptable, for example ${notation(net, other)}.`)],
        [`${notation(net, other)}: ${sum(rOther)} ${U}`],
        cutView(net, {}, other, true, true),
        [`Any cut whose arcs from the S side to the T side add up to ${rOther.capacity} will do.`, `Try moving vertices from one side to the other, adding the capacities of the arcs from the S side to the T side each time, until you reach ${rOther.capacity}.`]);
  p.working = working(base, { subTool: "cutValue", sSide: other, course: "as" });
  return [p];
} };
const boundTwo: PartDef = { id: "boundTwo", idea: "cutBound", tier: "core", build: (cx) => {
  const { net, U } = cx; const named: string[] = cx.facts.named, other: string[] = cx.facts.other; const rNamed = cx.facts.rNamed, rOther = cx.facts.rOther; if (!other) return null;
  void named;
  return [part("(c)", "Using your answers to parts (a) and (b), state what can be deduced about the maximum flow through the network. Fully justify your answer.",
        [
          mk("B1F", `States that the maximum flow is less than or equal to ${rOther.capacity} ${U}, the smaller of the two cuts. It must be a weak inequality (≤); "equal to" is not accepted.`),
          mk("E1F", "Explains the answer with the maximum flow–minimum cut theorem: the maximum flow cannot be greater than the value of any cut."),
        ],
        [`Maximum flow ≤ ${rOther.capacity} ${U}`, `The maximum flow is less than or equal to the value of any cut (maximum flow–minimum cut theorem), so it is at most ${rOther.capacity}.`],
        cutView(net, {}, other, true, true),
        [`The two cuts have values ${rNamed.capacity} and ${rOther.capacity}.`, "Each cut is an upper bound on the maximum flow, so use the smaller one: it is the tighter bound.", "Write ≤, not =: one cut on its own only gives an upper bound."])];
} };

const missingFlows: PartDef = { id: "missingFlows", idea: "missingFlow", tier: "core", build: (cx) => {
  const { net, base, U, d } = cx; const flow = d.flow; const missing = d.missing; if (!missing) return null;
  const order = peelMissing(net, missing); if (!order) return null;
  const current = flowValue(net, flow);
    const known: Flow = Object.fromEntries(net.arcs.filter((a) => !missing.includes(a.id)).map((a) => [a.id, flow[a.id]]));
    const left = new Set(missing);
    const parts: ExamPart[] = [];
    const letters = ["(a)", "(b)"];
    order.forEach(({ arc, vertex }, i) => {
      const a = net.arcs.find((x) => x.id === arc)!;
      const inn = net.arcs.filter((x) => x.to === vertex), out = net.arcs.filter((x) => x.from === vertex);
      const term = (x: { id: string }) => (x.id === arc ? "x" : `${known[x.id] ?? "?"}`);
      known[arc] = flow[arc];
      left.delete(arc);
      parts.push(part(letters[i], `Find the flow in the arc from ${a.from} to ${a.to} (marked ?).`,
        [
          mk("M1", `Uses flow in = flow out at ${vertex}, where only this arc is unknown (or an equivalent method).`),
          mk("A1", `Obtains ${flow[arc]} ${U}.`),
        ],
        [`At ${vertex}: ${inn.map(term).join(" + ")} = ${out.map(term).join(" + ")}`, `x = ${flow[arc]} ${U}`],
        { flow: { ...known }, unknown: [...left], solved: [arc] },
        ["Flow in = flow out at every vertex except S and T.", `Choose a vertex where only this arc is unknown: ${vertex}.`, "Call the unknown flow x, add up the flows in and the flows out, and solve for x."],
        // part (a) of two: the first two beats of the skill working (the second arc is still unknown); then (b) is the skill question with one arc missing
        i === 0 && order.length > 1 ? working(base, { subTool: "missingFlow", missing }).slice(0, 2) : working(base, { subTool: "missingFlow", missing: [arc] })));
    });
    if (order.length === 1) {
      parts.push(part("(b)", "State the value of the flow through the network.",
        [mk("B1", `States ${current} ${U}.`)],
        [`${net.arcs.filter((x) => x.from === "S").map((x) => flow[x.id]).join(" + ")} = ${current} ${U}`],
        { flow: { ...flow } },
        ["The value of the flow is the total flow leaving S (it equals the total flow entering T)."]));
    }
  return parts;
} };
const proveAtMost: PartDef = { id: "proveAtMost", idea: "cutBound", tier: "core", build: (cx) => {
  const { net, base, U, d } = cx; const flow = d.flow; const run = runOf(cx);
  if (!drawable(net, run.sSide) || run.sSide.length < 2) return null;
  const parts: ExamPart[] = [];
    const r = cutCapacity(net, run.sSide);
    parts.push(part("(c)", `Prove that the maximum flow through the network is at most ${run.value} ${U}.`,
      [
        mk("M1", `Identifies the cut ${notation(net, run.sSide)} (the arcs from the S side to the T side are ${r.forward.map((a) => a.id).join(", ")}).`),
        mk("R1", `Completes a reasoned argument: the cut has value ${run.value}, and by the maximum flow–minimum cut theorem the maximum flow is less than or equal to the value of any cut, so it is at most ${run.value} ${U}.`),
      ],
      [`${notation(net, run.sSide)}: ${sum(r)} ${U}`, `By the maximum flow–minimum cut theorem the maximum flow is less than or equal to the value of any cut, so it is at most ${run.value} ${U}.`],
      { ...cutView(net, flow, run.sSide, true, true), flow: { ...flow } },
      ["To find the cut: start at S and follow arcs that are not full (and arcs backwards that carry flow). The vertices you can reach are the S side.", "Every arc from the S side to the T side is then full, so this cut gives the smallest upper bound.", "Add the capacities of those arcs."]));
    parts[parts.length - 1].working = working(base, { subTool: "cutValue", sSide: run.sSide, course: "as" });
  return parts;
} };

function superBits(cx: PartCtx) {
  const d = cx.d; const sp = d.superST; if (!sp) return null;
    const net = d.net; // with the supersource / supersink added
    const srcs = Object.keys(sp.sources), snks = Object.keys(sp.sinks);
    const sources = sp.removeS ? srcs : ["S"], sinks = sp.removeT ? snks : ["T"];
    const byId = Object.fromEntries(net.arcs.map((a) => [a.id, a]));
    const added = sp.superArcs.map((id) => byId[id]);
    const what = sp.removeS && sp.removeT ? "a supersource S and a supersink T" : sp.removeS ? "a supersource S" : "a supersink T";
    const addedText = added.map((a) => `${a.from} → ${a.to} (${a.hi})`);
    const full = (extra: FlowViewState = {}): FlowViewState => ({ net, labelPos: d.labelPos, ...extra });
  return { sp, net, srcs, snks, sources, sinks, byId, added, what, addedText, full };
}
const listSS: PartDef = { id: "listSS", idea: "superSource", tier: "core", build: (cx) => {
  const b = superBits(cx); if (!b) return null; const { sp, sources, sinks } = b; const d = cx.d; void d;
  return [part("(a)", "State which vertices are sources and which are sinks.",
        [mk("B1", `Lists the sources: ${list(sources)}.`), mk("B1", `Lists the sinks: ${list(sinks)}.`)],
        [`Sources: ${list(sources)}`, `Sinks: ${list(sinks)}`],
        { net: sp.question, labelPos: d.labelPos },
        ["A source has no arcs coming in; a sink has no arcs going out."])];
} };
const addSuper: PartDef = { id: "addSuper", idea: "superSource", tier: "core", build: (cx) => {
  const b = superBits(cx); if (!b) return null; const { sp, what, addedText, full } = b; const base = cx.base;
  const p = part("(b)", `Add ${what} to the network so that it has a single source and a single sink. Show the capacity of each arc you add.`,
        [
          mk("M1", `Adds ${what}, with an arrow from the supersource to each source${sp.removeT ? " and from each sink to the supersink" : ""}, in the correct direction.`),
          mk("A1", `Labels every added arc with a capacity of at least the total capacity of the arcs leaving that source (or arriving at that sink): ${addedText.join(", ")}.`),
        ],
        [],
        full({ focus: sp.superArcs }),
        ["Each added arc takes the total capacity of the arcs leaving that source (or arriving at that sink), so it never limits the flow."]);
  p.working = working(base, { subTool: "superST" });
  return [p];
} };
const cutInNew: PartDef = { id: "cutInNew", idea: "cutValue", tier: "core", build: (cx) => {
  const b = superBits(cx); if (!b) return null; const { net } = b; const d = cx.d; const base = cx.base; const U = cx.U;
    const cuts = allCuts(net).filter((c) => c.length >= 2 && net.nodes.length - c.length >= 2 && cutCapacity(net, c).capacity >= 8 && cutCapacity(net, c).capacity <= 60);
    const named = firstDrawable(net, shuf(cuts));
    if (!named) return null;
    const r = cutCapacity(net, named);
  cx.facts.named = named; cx.facts.rNamed = r;
  const p = part("(c)", `Find the value of the cut ${notation(net, named)} in your network.`,
        [mk("B1", `Finds the correct value of the cut, ${r.capacity} ${U} (units may be condoned). Only the arcs from the S side to the T side are added.`)],
        [`${sum(r)} ${U}`],
        { ...cutView(net, {}, named, true, true), net, labelPos: d.labelPos },
        [`Add the capacities of the arcs going from the S side to the T side: ${r.forward.map((a) => a.id).join(", ")}.`, "An arc that comes back across the cut is not counted."]);
  p.working = working(base, { subTool: "cutValue", sSide: named, course: "as", superST: undefined });
  return [p];
} };
const boundNew: PartDef = { id: "boundNew", idea: "cutBound", tier: "core", build: (cx) => {
  const b = superBits(cx); if (!b) return null; const { net } = b; const d = cx.d; const U = cx.U; const named: string[] = cx.facts.named, r = cx.facts.rNamed; if (!named) return null;
  return [part("(d)", "State what can be deduced about the maximum flow through the network.",
        [mk("B1F", `States that the maximum flow is less than or equal to ${r.capacity} ${U}. It must be a weak inequality (≤).`)],
        [`Maximum flow ≤ ${r.capacity} ${U}`],
        { ...cutView(net, {}, named, true, true), net, labelPos: d.labelPos },
        ["The maximum flow is less than or equal to the value of any cut, so the cut in part (c) is an upper bound.", "Write ≤, not =."])];
} };

// ═══ A-level ═════════════════════════════════════════════════════════════
const superAddA: PartDef = { id: "superAddA", idea: "superSource", tier: "core", build: (cx) => {
  const d = cx.d; const net = d.net; const sp = d.superST; const ml = cx.mode === "minmax"; if (!sp) return null;
      const what = sp.removeS && sp.removeT ? "a supersource S and a supersink T" : sp.removeS ? "a supersource S" : "a supersink T";
  return [part("(?)", `Add ${what} to the network so that it has a single source and a single sink, ${ml ? "showing the lower and upper capacity of each arc you add" : "showing the capacity of each arc you add"}.`,
        [
          mk("M1", `Adds ${what}, with an arrow from the supersource to each source${sp.removeT ? " and from each sink to the supersink" : ""}.`),
          mk("A1", ml ? "Labels every added arc with a correct upper capacity AND a correct lower capacity (the totals of the arcs leaving each source or arriving at each sink)." : "Labels every added arc with a capacity at least the total capacity of the arcs leaving each source (or arriving at each sink)."),
        ],
        [],
        { net, labelPos: d.labelPos, flow: { ...d.flow }, focus: sp.superArcs },
        [ml ? "Each added arc takes the total of the lower capacities and the total of the upper capacities of the arcs leaving that source (or arriving at that sink)." : "Each added arc takes the total capacity of the arcs leaving that source (or arriving at that sink)."])];
} };
const potentials: PartDef = { id: "potentials", idea: "potentials", tier: "core", build: (cx) => {
  const d = cx.d; const net = d.net; const ml = cx.mode === "minmax"; const U = cx.U; const V0 = flowValue(net, d.flow);
  const p = part("(?)", `A flow of ${V0} ${U} through the network is shown (the circled numbers). On the network, indicate the potential increase and the potential decrease of each arc.`,
        [mk("M1", "Finds a correct potential increase and decrease for at least one arc (numbers reversed condoned for this mark)."), mk("A1", "Determines the correct potential increase and decrease for every arc.")],
        [],
        { potentials: potNumbers(net, d.flow), hideBounds: true }, // the potentials replace the flows on the figure, as in the skills working
        [`Write both numbers on each arc of the blank network: each arc carries its potential increase (along the arrow) and its potential decrease (against it).`, `Potential increase = ${ml ? "upper capacity" : "capacity"} − flow (how much more can be sent along the arrow).`, `Potential decrease = flow${ml ? " − lower capacity" : ""} (how much can be taken back, against the arrow).`]);
  p.working = cx.d.superST ? working(cx.base, { subTool: "superST", mode: cx.mode }).slice(0, 2) : working(cx.base, { subTool: "maxFlow", superST: undefined, mode: cx.mode }).slice(0, 1);
  return [p];
} };
const augmentPart: PartDef = { id: "augment", idea: "augment", tier: "core", build: (cx) => {
  const { base, mode, U } = cx; const d = cx.d; const net = d.net; const run = runOf(cx); const sp = d.superST; const withSuper = !!sp;
  const V0 = flowValue(net, d.flow), V = run.value;
  let finalFlowOnQuestionNet = (steps: SolveStep[]): SolveStep[] => steps;
    const aug = augScheme(run.augmentations, V0, V, U);
    // the supersource / supersink are only a device for the working: the final flow is shown on the network as the question gave it, without them
    const qNet = withSuper && sp ? sp.question : null;
    const onQuestionNet = (f: Flow): Flow => (qNet ? Object.fromEntries(qNet.arcs.filter((x) => f[x.id] !== undefined).map((x) => [x.id, f[x.id]])) : f);
  const p = part("(?)", `A flow of ${V0} ${U} through the ${withSuper ? "new " : ""}network is shown (the circled numbers). Use flow augmentation to find the maximum flow. You must indicate any flow-augmenting paths clearly in the table, and then show the maximum flow on the network.`,
      aug.scheme, aug.model, qNet ? { net: qNet, labelPos: d.labelPos, flow: onQuestionNet(run.flow) } : { flow: { ...run.flow } }, aug.explain);
    if (qNet) finalFlowOnQuestionNet = (steps) => steps.map((st) => (st.flowView?.flow && !st.flowView.potentials && !st.flowView.sSide ? { ...st, flowView: { ...st.flowView, net: qNet, flow: onQuestionNet(st.flowView.flow) } } : st));
  p.working = finalFlowOnQuestionNet(working(base, { subTool: "maxFlow", superST: undefined, mode }));
  return [p];
} };
const proveMax: PartDef = { id: "proveMax", idea: "cutBound", tier: "core", build: (cx) => {
  const { base, mode, U } = cx; const d = cx.d; const net = d.net; const run = runOf(cx); const cut: string[] = cx.facts.cut; if (!cut) return null;
  const V = run.value; const ml = mode === "minmax";
    const r = cutCapacity(net, cut);
  const p = part("(?)", `Prove that the flow you found is the maximum flow.`,
      [
        mk("M1", `Identifies a minimum cut, for example ${notation(net, cut)}${ml ? " (arcs coming back across it use their lower capacities)" : ""}.`),
        mk("R1", `Compares the cut value, ${r.capacity}, with the flow of ${V} ${U} and states, naming or explaining the maximum flow–minimum cut theorem, that the flow is maximal.`),
      ],
      [`${notation(net, cut)}: ${ml && r.backward.length ? `${r.forward.map((a) => a.hi).join(" + ")} − ${r.backward.map((a) => a.lo).join(" − ")} = ${r.capacity}` : `${r.forward.map((a) => a.hi).join(" + ")} = ${r.capacity}`}`, `The cut has value ${r.capacity}, equal to the flow of ${V} ${U}. By the maximum flow–minimum cut theorem, the flow is maximal.`],
      { ...cutView(net, run.flow, cut, true, false), flow: { ...run.flow } },
      ["To find the cut: after the last augmentation, start at S and follow arcs that still have spare potential. The vertices you can reach are the S side.", ml ? "Add the upper capacities of the arcs from the S side to the T side, and subtract the lower capacities of the arcs coming back." : "Add the capacities of the arcs from the S side to the T side.", "A flow equal to a cut cannot be improved: the maximum flow is at most any cut."]);
  p.working = working(base, { subTool: "cutValue", sSide: cut, flow: run.flow, superST: undefined, mode });
  return [p];
} };
const claimPipe: PartDef = { id: "claimPipe", idea: "capacityChange", tier: "reasoning", build: (cx) => {
  const run = runOf(cx); const cut: string[] = cx.facts.cut; if (!cut) return null;
  return [claimPart(cx.net, run, cut, cx.U, "(?)", cx.thing.includes("pipe") ? "pipe" : "arc")];
} };
const restricted: PartDef = { id: "restricted", idea: "restriction", tier: "reasoning", build: (cx) => {
  if (cx.mode !== "cap") return null;
  const rp = restrictedPart(cx.base, runOf(cx), cx.U, "(?)");
  return rp ? [rp] : null;
} };

// ═══ A-level, lower capacities ═══════════════════════════════════════════════
/** the cut with a backward arc, the maximum flow and the one pipe worth upgrading (the question's facts), or false when this network does not suit */
export function prepLower(cx: PartCtx): boolean {
  const d = cx.d; const { net } = d;
    const named = d.sSide!;
    const r = cutCapacity(net, named);
  if (!r.backward.length || !r.backward.some((a) => a.lo > 0)) return false;
  const run = maxFlow(net, d.flow);
  if (r.capacity < run.value) return false;
    // exactly one pipe whose upgrade by k raises the maximum flow
    let upgrade: { id: string; k: number; g: number } | null = null;
    for (let k = 2; k <= 6 && !upgrade; k++) {
      const gains = net.arcs.map((a) => ({ id: a.id, g: maxFlow({ ...net, arcs: net.arcs.map((x) => (x.id === a.id ? { ...x, hi: x.hi + k } : x)) }, run.flow).value - run.value }));
      const helpful = gains.filter((x) => x.g > 0);
      if (helpful.length === 1) upgrade = { id: helpful[0].id, k, g: helpful[0].g };
    }
  if (!upgrade) return false;
  cx.facts.named = named; cx.facts.r = r; cx.facts.run = run; cx.facts.upgrade = upgrade;
  cx.facts.X = r.capacity + 3 + Math.floor(Math.random() * 8);
  return true;
}
function lowerBits(cx: PartCtx) {
  const { net } = cx.d; const named: string[] = cx.facts.named; const r: ReturnType<typeof cutCapacity> = cx.facts.r; const run = cx.facts.run; const upgrade = cx.facts.upgrade; const X: number = cx.facts.X;
  const up = net.arcs.find((a) => a.id === upgrade.id)!;
  const fwd = r.forward.map((a: { hi: number }) => a.hi).join(" + ");
  const back = r.backward.map((a: { lo: number }) => a.lo).join(" − ");
  return { net, named, r, run, upgrade, X, up, fwd, back };
}
const cutBack: PartDef = { id: "cutBack", idea: "cutValue", tier: "core", build: (cx) => {
  if (!cx.facts.upgrade) return null; const { net, named, r, fwd, back } = lowerBits(cx); const U = cx.U;
  const p = part("(a)", `Find the value of the cut ${notation(net, named)}.`,
        [mk("B1", `Finds the correct value of the cut, ${r.capacity} ${U}: the upper capacities of the arcs from the S side to the T side, minus the lower capacities of the arcs coming back (units may be condoned).`)],
        [`${fwd} − ${back} = ${r.capacity} ${U}`],
        cutView(net, {}, named, true, false),
        [`Arcs from the S side to the T side: ${r.forward.map((a) => a.id).join(", ")} — add their upper capacities.`, `Arcs coming back across the cut: ${r.backward.map((a) => a.id).join(", ")} — subtract their lower capacities.`]);
  p.working = working(cx.base, {});
  return [p];
} };
const cutMeaning: PartDef = { id: "cutMeaning", idea: "cutBound", tier: "reasoning", build: (cx) => {
  if (!cx.facts.upgrade) return null; const { net, named, r } = lowerBits(cx); const U = cx.U; const ctx = ctxOf(cx);
  return [part("(b)", "Explain what your answer to part (a) tells you about the maximum flow, in the context of the question.",
        [mk("B1F", `States, in context and with units, that the maximum flow through the network of ${ctx.thing} is less than or equal to ${r.capacity} ${U}. Answers in the language of arcs and nodes only do not score.`)],
        [`The maximum flow through the ${ctx.thing} is at most ${r.capacity} ${U}.`],
        cutView(net, {}, named, true, false),
        ["The maximum flow cannot be greater than the value of any cut.", "Say it in the context of the question, with units, not in the language of arcs and nodes."])];
} };
const claimAboveCut: PartDef = { id: "claimAboveCut", idea: "flowVsCut", tier: "reasoning", build: (cx) => {
  if (!cx.facts.upgrade) return null; const { net, named, r, X } = lowerBits(cx); const U = cx.U;
  return [part("(c)", `A manager claims that the maximum flow through the network is ${X} ${U}. Comment on the validity of this claim.`,
        [
          mk("B1", `Compares the claimed ${X} ${U} with the value of the cut found in part (a), ${r.capacity} ${U}.`),
          mk("B1F", `Concludes explicitly that the claim is incorrect, because the maximum flow is at most ${r.capacity}, which is less than ${X}.`),
        ],
        [`The maximum flow is at most ${r.capacity} ${U} (part (a)), and ${r.capacity} < ${X}.`, "So the manager's claim is incorrect."],
        cutView(net, {}, named, true, false),
        [`Compare the claim, ${X}, with the value of the cut, ${r.capacity}.`, `The maximum flow cannot exceed ${r.capacity}, so ${X} is impossible.`, "Finish with a clear statement that the claim is incorrect."])];
} };
const upgradeOne: PartDef = { id: "upgradeOne", idea: "capacityChange", tier: "reasoning", build: (cx) => {
  if (!cx.facts.upgrade) return null; const { net, run, upgrade, up } = lowerBits(cx); const U = cx.U;
  return [part("(d)", `The capacity of just one pipe can be increased by ${upgrade.k} ${U}. Explain which pipe should be increased, and find the new maximum flow.`,
        [
          mk("E1", `Explains that pipe ${up.id} should be increased: it is the only pipe that crosses every minimum cut from the S side to the T side, so it is the only one limiting the flow.`),
          mk("B1F", `States that the maximum flow increases by ${upgrade.g}, to ${run.value + upgrade.g} ${U}.`),
        ],
        [`Increase pipe ${up.id}: it is the only pipe in every minimum cut, so it is the only one limiting the flow.`, `The new maximum flow is ${run.value + upgrade.g} ${U} (an increase of ${upgrade.g}).`],
        { ...cutView(net, run.flow, run.sSide, true, false), focus: [up.id], flow: { ...run.flow } },
        [`The maximum flow is ${run.value} ${U}, limited by the minimum cut ${notation(net, run.sSide)}.`, "Increasing a pipe that is not in every minimum cut leaves a minimum cut unchanged, so the maximum flow stays the same."])];
} };

export const PARTS: Record<string, PartDef> = Object.fromEntries([
  cutValue, cutWrite, boundTwo, missingFlows, proveAtMost, listSS, addSuper, cutInNew, boundNew,
  superAddA, potentials, augmentPart, proveMax, claimPipe, restricted, cutBack, cutMeaning, claimAboveCut, upgradeOne,
].map((p) => [p.id, p]));
