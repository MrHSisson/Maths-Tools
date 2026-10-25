// ═══════════════════════════════════════════════════════════════════════════
// Network Flows — the PARTS LIBRARY (specs/flow-parts-library.md). A part is one question idea with exam wording: its prompt, mark-scheme lines, model
// answer, picture state and (?) working. Every number comes from the same solver as the skills tabs, so a part can never disagree with them.
// A part's `build` returns null when the network does not suit it (so it doubles as the "needs" check) and may leave facts in `c.facts` for the
// parts after it (the cut it named, the minimum cut, the maximum flow). Recipes (flowExam.ts) put parts in the order the papers set them.
// ═══════════════════════════════════════════════════════════════════════════

import {
  allCuts, cutCapacity, flowValue, maxFlow, minCutBruteForce, orderNodes, pathLabel, pathNodes, peelMissing, simpleForwardPaths, splitNodes,
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
interface PartDef {
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
const firstDrawable = (net: FlowNet, cuts: string[][]): string[] | null => { for (const c of cuts) if (drawable(net, c)) return c; return null; };
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
/** what a cut adds up to, with arcs coming back subtracted when they have a lower capacity: "AB + SC − DE = 3 + 7 − 2 = 8" */
const sumFull = (r: ReturnType<typeof cutCapacity>) => {
  const back = r.backward.filter((a) => a.lo > 0);
  return back.length ? `${r.forward.map((a) => a.id).join(" + ")} − ${back.map((a) => a.id).join(" − ")} = ${r.forward.map((a) => a.hi).join(" + ")} − ${back.map((a) => a.lo).join(" − ")} = ${r.capacity}` : sum(r);
};
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
function claimPart(net: FlowNet, run: ReturnType<typeof maxFlow>, cut: string[], U: string, label: string, thing: string): ExamPart {
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
function restrictedPart(base: DecisionProblem, run: ReturnType<typeof maxFlow>, U: string, label: string): ExamPart | null {
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

function augScheme(paths: { path: { bottleneck: number }; before: Flow; after: Flow }[], V0: number, V: number, U: string): { scheme: ExamMark[]; model: string[]; explain: string[] } {
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


// ═══ Reasoning parts (idea → a short question answered in words, marked against the real schemes' stable patterns) ═══════════
/** a cut worth asking about: several vertices on each side, drawn as one line, with a capacity the test accepts */
function pickCutWhere(cx: PartCtx, ok: (cap: number, c: string[]) => boolean): string[] | null {
  const n = cx.net.nodes.length;
  const cuts = allCuts(cx.net).filter((c) => c.length >= 2 && n - c.length >= 2 && ok(cutCapacity(cx.net, c).capacity, c));
  return firstDrawable(cx.net, shuf(cuts));
}
const silent = (cx: PartCtx) => cx.mode === "cap" && (cx.d.course === "as" || cx.d.course === undefined && cx.facts.as === true);
const cutPic = (cx: PartCtx, net: FlowNet, flow: Flow, cut: string[]): FlowViewState => ({ ...cutView(net, flow, cut, true, silent(cx)), net, labelPos: cx.d.labelPos });
const cutWorking = (cx: PartCtx, cut: string[]) => working(cx.base, { subTool: "cutValue", sSide: cut, flow: cx.d.flow, superST: undefined, mode: cx.mode, course: cx.facts.as ? "as" : cx.d.course });

const deduceCut: PartDef = { id: "deduceCut", idea: "deduce", tier: "reasoning", build: (cx) => {
  const { net, U } = cx;
  const cut = pickCutWhere(cx, (cap) => cap >= 8 && cap <= 70); if (!cut) return null;
  const r = cutCapacity(net, cut);
  const p = part("(?)", `The value of the cut ${notation(net, cut)} is ${r.capacity} ${U}. State what can be deduced about the maximum flow through the network. Fully justify your answer.`,
    [mk("B1", `States that the maximum flow is less than or equal to ${r.capacity} ${U}. It must be a weak inequality (≤); "equal to" is not accepted.`), mk("E1", "Justifies it with the maximum flow–minimum cut theorem: the maximum flow cannot be greater than the value of any cut.")],
    [`Maximum flow ≤ ${r.capacity} ${U}`, "The maximum flow is less than or equal to the value of any cut (maximum flow–minimum cut theorem)."],
    cutPic(cx, net, {}, cut),
    ["Every unit of flow from S to T has to cross the cut, so the flow cannot be more than the cut can carry.", "A cut therefore gives an upper bound, never an exact value on its own. Write ≤, not =."]);
  p.working = cutWorking(cx, cut);
  return [p];
} };

/** a flow and a cut together: equal → the maximum flow; a flow below a cut → between the two */
const flowCutCompare: PartDef = { id: "flowCutCompare", idea: "flowCut", tier: "reasoning", build: (cx) => {
  const { net, U, d } = cx; const run = runOf(cx); const V = run.value; const f0 = flowValue(net, d.flow);
  const equal = cx.level === 1 || Math.random() < 0.5;
  if (equal) {
    const cut = interestingMinCut(net, V, run.sSide); if (!cut) return null;
    return [part("(?)", `A student finds a flow of value ${V} ${U} through the network, and a cut ${notation(net, cut)} of value ${V} ${U}. What can be deduced about the maximum flow? Fully justify your answer.`,
      [mk("B1", `States that the maximum flow is ${V} ${U}.`), mk("R1", `Completes a reasoned argument: the maximum flow is at least the flow, ${V}, and at most the value of the cut, ${V}, by the maximum flow–minimum cut theorem, so it is ${V}.`)],
      [`Maximum flow = ${V} ${U}`, `The flow shows the maximum is at least ${V}; the cut shows it is at most ${V} (maximum flow–minimum cut theorem). So it is exactly ${V}.`],
      cutPic(cx, net, run.flow, cut),
      ["A flow is a lower bound on the maximum flow (a flow of that value exists).", "A cut is an upper bound. When a flow and a cut have the same value, the two bounds meet, so that value is the maximum flow."])];
  }
  if (f0 >= V) return null;
  const cut = pickCutWhere(cx, (cap) => cap > V && cap <= V + 12); if (!cut) return null;
  const c = cutCapacity(net, cut).capacity;
  return [part("(?)", `A student finds a flow of value ${f0} ${U} through the network, and a cut ${notation(net, cut)} of value ${c} ${U}. What can be deduced about the maximum flow? Fully justify your answer.`,
    [mk("B1", `States that the maximum flow is at least ${f0} ${U} and at most ${c} ${U}, and does not claim it equals either.`), mk("E1", "Explains: the flow shows a flow of that value exists, and the maximum flow is less than or equal to the value of any cut (maximum flow–minimum cut theorem).")],
    [`${f0} ≤ maximum flow ≤ ${c} ${U}`, "The flow is a lower bound; the cut is an upper bound. Neither is necessarily the maximum, so we cannot say more."],
    cutPic(cx, net, d.flow, cut),
    ["The flow found means the maximum flow is at least that big.", "The cut means it is at most the cut's value. With a gap between them the maximum is somewhere in between."])];
} };

/** a claim about the maximum flow that a cut settles: a flow equal to a cut (correct), or a cut that is not the minimum (incorrect) */
const claimFlowCut: PartDef = { id: "claimFlowCut", idea: "claimMax", tier: "reasoning", build: (cx) => {
  const { net, U } = cx; const run = runOf(cx); const V = run.value;
  const equal = cx.level === 1 || cx.level === 2 && Math.random() < 0.6;
  if (equal) {
    const cut = interestingMinCut(net, V, run.sSide); if (!cut) return null;
    const given = !!cx.facts.given; // standing alone: the cut an earlier part would have found is handed over
    if (given) cx.facts.givenView = cutPic(cx, net, run.flow, cut);
    const p = part("(?)", `${given ? `The cut ${notation(net, cut)} has value ${V} ${U}. ` : ""}A manager finds a flow of ${V} ${U} through the network. They claim that this is the maximum possible flow. Explain whether this claim is correct. Fully justify your answer.`,
      [mk("M1", given ? `Compares the value of the given cut, ${V}, with the flow of ${V} ${U}.` : `Finds a cut of value ${V}, for example ${notation(net, cut)}, and compares it with the flow of ${V} ${U}.`), mk("R1", "Completes a reasoned argument with explicit reference to the maximum flow–minimum cut theorem, and concludes that the claim is correct.")],
      [`${notation(net, cut)}: ${sumFull(cutCapacity(net, cut))} ${U}`, `The flow equals the value of this cut, so by the maximum flow–minimum cut theorem the maximum flow is ${V} ${U}. The claim is correct.`],
      cutPic(cx, net, run.flow, cut),
      ["Look for a cut with the same value as the flow.", "If there is one, the flow cannot be increased: the claim is correct."]);
    p.working = cutWorking(cx, cut);
    return [p];
  }
  // a cut that is NOT the minimum: the maximum flow is not its value
  const big = pickCutWhere(cx, (cap) => cap > V && cap <= V + 14); if (!big) return null;
  const small = interestingMinCut(net, V, run.sSide); if (!small) return null;
  const cBig = cutCapacity(net, big).capacity;
  const given = !!cx.facts.given;
  if (given) cx.facts.givenView = cutPic(cx, net, {}, small);
  return [part("(?)", `${given ? `Another cut, ${notation(net, small)}, has value ${V} ${U}. ` : ""}A trainee correctly calculates the value of the cut ${notation(net, big)} to be ${cBig} ${U}. They then claim that the maximum flow through the network is ${cBig} ${U}. Comment on the validity of this claim.`,
    [mk("B1", given ? `Compares the value of the other cut, ${V}, with ${cBig}.` : `Finds a different cut with a lower value, for example ${notation(net, small)} of value ${V}, and compares it with ${cBig}.`), mk("B1F", `Concludes that the claim is incorrect: the maximum flow is at most ${V}, which is less than ${cBig}.`)],
    [`${notation(net, small)}: ${sumFull(cutCapacity(net, small))} ${U}`, `This cut is smaller than ${cBig}, so the maximum flow is at most ${V} ${U}. The claim is incorrect.`],
    cutPic(cx, net, {}, small),
    [`The maximum flow is at most the value of EVERY cut, so it is at most the smallest one.`, `The cut given, ${cBig}, is not the minimum cut, so ${cBig} is only an upper bound. Find a smaller cut to show the claim is wrong.`])];
} };

/** the language of supersources and supersinks, answered in words */
const superWords: PartDef = { id: "superWords", idea: "superWords", tier: "reasoning", build: (cx) => {
  const b = superBits(cx); if (!b) return null; const { sp, sources, sinks } = b; const U = cx.U;
  const facility = sp.removeT && Math.random() < 0.5;
  const pic: FlowViewState = { net: sp.question, labelPos: cx.d.labelPos };
  if (facility)
    return [part("(?)", `All of the ${cx.thing.includes("pipe") ? "flow" : "flow"} must now pass through a new final facility before it leaves the system. Using the language of networks, explain how the network could be modified to include the new facility.`,
      [mk("E1", `Explains that the new facility should be connected to the nodes ${list(sinks)}, because these are the sinks of the network.`), mk("B1", "States that the new facility is a supersink (with a directed arc from each sink to it).")],
      [`The new facility is a supersink, connected by a directed arc from each of the sinks ${list(sinks)}.`],
      pic, ["The nodes the flow currently leaves at are the sinks.", "A single new vertex that they all feed into is a supersink; each sink gets a directed arc into it."])];
  return [part("(?)", `A manager claims that adding a ${sp.removeS ? "supersource" : ""}${sp.removeS && sp.removeT ? " and a " : ""}${sp.removeT ? "supersink" : ""} to the network will increase the maximum flow through it. Explain why this claim is incorrect.`,
    [mk("E1", `Explains that the ${sp.removeS ? "supersource" : "supersink"} does not change the flow out of the sources or into the sinks, so the minimum cut and the maximum flow stay the same.`)],
    [`The added arcs carry at least all that leaves the sources${sp.removeT ? " and all that arrives at the sinks" : ""}, so they never limit the flow. The minimum cut is unchanged, so the maximum flow is unchanged (${list(sources)} → ${list(sinks)} in ${U}).`],
    pic, ["The arcs added are given the total capacity of what leaves each source (or arrives at each sink).", "So they can never be the bottleneck: the flow is limited by the same cut as before."])];
} };

/** min/max networks: a vertex where the most that can arrive equals the least that must leave (or the reverse) forces its arcs to a bound */
const forcedArc: PartDef = { id: "forcedArc", idea: "forced", tier: "reasoning", build: (cx) => {
  if (cx.mode !== "minmax") return null;
  const { net, U, d } = cx; const flow = d.flow;
  const inner = net.nodes.map((n) => n.id).filter((id) => id !== "S" && id !== "T");
  for (const v of shuf(inner)) {
    const ins = net.arcs.filter((a) => a.to === v), outs = net.arcs.filter((a) => a.from === v);
    if (!ins.length || outs.length < 2 || ins.length > 2) continue;
    const upper = Math.random() < 0.5; // false: the arcs leaving v are forced to their LOWER capacity; true: to their UPPER
    const asked = outs.find((a) => (upper ? a.hi > flow[a.id] : a.lo < flow[a.id])); if (!asked) continue;
    const arcs = net.arcs.map((a) => {
      if (a.to === v) return upper ? { ...a, lo: flow[a.id] } : { ...a, hi: flow[a.id] };
      if (a.from === v) return upper ? { ...a, hi: flow[a.id] } : { ...a, lo: flow[a.id] };
      return a;
    });
    const net2: FlowNet = { ...net, arcs };
    const sIn = ins.map((a) => (upper ? flow[a.id] : flow[a.id])).reduce((x, y) => x + y, 0);
    const lowOrUp = upper ? "upper" : "lower";
    const inTxt = upper ? `the least that must arrive at ${v} is ${ins.map((a) => flow[a.id]).join(" + ")} = ${sIn}` : `the most that can arrive at ${v} is ${ins.map((a) => flow[a.id]).join(" + ")} = ${sIn}`;
    const outTxt = upper ? `the most that can leave ${v} is ${outs.map((a) => flow[a.id]).join(" + ")} = ${sIn}` : `the least that must leave ${v} is ${outs.map((a) => flow[a.id]).join(" + ")} = ${sIn}`;
    cx.facts.net2 = net2;
    return [part("(?)", `A feasible flow from S to T exists. Explain why the flow in arc ${asked.from}${asked.to} must be at its ${lowOrUp} capacity.`,
      [mk("E1", `Explains, using the flows at ${v}: ${inTxt}, and ${outTxt}; flow in = flow out, so every arc ${upper ? "leaving" : "leaving"} ${v} is at its ${lowOrUp} capacity (units ${U}).`)],
      [`At ${v}: ${inTxt}.`, `And ${outTxt}.`, `Flow in = flow out, so the flow out of ${v} is exactly ${sIn}, which means each arc leaving ${v} is at its ${lowOrUp} capacity — including ${asked.from}${asked.to}.`],
      { net: net2, labelPos: d.labelPos, focus: [asked.id] },
      [`Add the ${upper ? "lower" : "upper"} capacities of the arcs into ${v}, and the ${upper ? "upper" : "lower"} capacities of the arcs out of ${v}.`, "If those totals are equal, the flow in and out is pinned to that total, so every arc has to sit at the bound that gives it."])];
  }
  return null;
} };

/** min/max networks: the least flow that must cross a cut can be more than a stated flow, so that flow is impossible */
const impossibleFlow: PartDef = { id: "impossibleFlow", idea: "impossible", tier: "reasoning", build: (cx) => {
  if (cx.mode !== "minmax") return null;
  const { net, U } = cx; const n = net.nodes.length;
  let best: { cut: string[]; L: number } | null = null;
  for (const c of allCuts(net)) {
    if (c.length < 2 || n - c.length < 2) continue;
    const r = cutCapacity(net, c);
    const L = r.forward.reduce((t, a) => t + a.lo, 0) - r.backward.reduce((t, a) => t + a.hi, 0);
    if (L >= 6 && (!best || L > best.L) && drawable(net, c)) best = { cut: c, L };
  }
  if (!best) return null;
  const { cut, L } = best; const r = cutCapacity(net, cut);
  const V = L - 1 - (Math.random() < 0.3 ? 1 : 0);
  const fwd = r.forward.map((a) => a.lo).join(" + "), bwd = r.backward.map((a) => a.hi).join(" − ");
  const given = !!cx.facts.given; // standing alone: the cut is named for the student
  if (given) cx.facts.givenView = { ...cutView(net, {}, cut, true, false), net, labelPos: cx.d.labelPos };
  return [part("(?)", `${given ? `Consider the cut ${notation(net, cut)}. ` : ""}Explain why a flow of ${V} ${U} through the network is impossible.`,
    [mk("M1", `${given ? "Finds the least flow that must cross the cut" : `Finds the least flow that must cross a cut, such as ${notation(net, cut)}`}: the lower capacities of the arcs from the S side to the T side${r.backward.length ? ", minus the upper capacities of the arcs coming back" : ""}: ${L} ${U}.`), mk("E1", `Explains that every flow must be at least ${L}, which is more than ${V}.`)],
    [`${notation(net, cut)}: least flow across = ${fwd}${r.backward.length ? ` − ${bwd}` : ""} = ${L} ${U}.`, `Any flow from S to T must cross this cut, so every feasible flow is at least ${L}. ${L} > ${V}, so a flow of ${V} is impossible.`],
    { ...cutView(net, {}, cut, true, false), net, labelPos: cx.d.labelPos },
    ["All the flow has to cross any cut, so the flow is at least the smallest amount that can cross.", "That smallest amount uses the LOWER capacities forwards and the UPPER capacities of arcs coming back."])];
} };

/** capacity-only networks: a pipe is switched off while the flow is at its maximum — does the maximum fall by the flow it carried? */
const switchOff: PartDef = { id: "switchOff", idea: "pipeOff", tier: "reasoning", build: (cx) => {
  if (cx.mode !== "cap" || cx.d.superST) return null; // (a supersource network's picture would show the added vertices)
  const { net, U } = cx; const run = runOf(cx); const V = run.value;
  const wantTrue = Math.random() < 0.5;
  const tries = shuf(net.arcs.filter((a) => run.flow[a.id] > 0 && a.from !== "S" && a.to !== "T")).map((a) => {
    const net2: FlowNet = { ...net, arcs: net.arcs.map((x) => (x.id === a.id ? { ...x, hi: 0 } : x)) };
    const M = minCutBruteForce(net2);
    return { a, net2, M, f: run.flow[a.id], drop: V - M.capacity };
  }).filter((x) => x.M.capacity >= 1);
  const pick = tries.find((x) => (x.drop === x.f) === wantTrue) ?? tries.find((x) => (x.drop === x.f) !== wantTrue); if (!pick) return null;
  const { a, net2, M, f, drop } = pick; const valid = drop === f;
  const noun = cx.thing.includes("pipe") ? "pipe" : "arc";
  return [part("(?)", `While the flow through the network is at its maximum value of ${V} ${U}, ${noun} ${a.id} is switched off. An engineer claims that the maximum flow will reduce by ${f} ${U}, the flow that ${a.id} was carrying. Comment on the validity of this claim.`,
    [mk("E1", valid ? `Explains that the flow through ${a.id} cannot be rerouted: with ${a.id} off, the cut ${notation(net2, M.sSide)} has value ${M.capacity}, so the maximum flow falls to ${M.capacity}.` : `Explains that some of the flow through ${a.id} can be rerouted along other routes with spare capacity, so the maximum flow falls by less than ${f}.`),
     mk("R1", `Concludes explicitly that the claim is ${valid ? "correct" : "incorrect"}${valid ? "" : `: the maximum flow falls by ${drop} ${U}, to ${M.capacity} ${U}`}.`)],
    valid
      ? [`With ${a.id} off, the cut ${notation(net2, M.sSide)} has value ${M.capacity} = ${V} − ${f}.`, `None of the flow can be rerouted, so the maximum flow falls by ${f} ${U}. The engineer's claim is correct.`]
      : [`With ${a.id} off, the maximum flow is ${M.capacity} ${U} (cut ${notation(net2, M.sSide)}), a fall of ${drop}, not ${f}.`, `Part of the flow can be rerouted, so the claim is incorrect.`],
    { ...cutView(net2, {}, M.sSide, true, true), net: net2, labelPos: cx.d.labelPos, focus: [a.id] },
    [`${a.id} carries ${f} in the maximum flow, so at least ${f} is lost — unless that flow can go another way.`, `Work out the new maximum flow with ${a.id} removed (a minimum cut of the new network). The fall is ${drop}.`, "Finish by stating whether the claim is correct."])];
} };

/** a restriction on the flow through a vertex: it may or may not change the maximum flow */
const restrictionImpact: PartDef = { id: "restrictionImpact", idea: "restriction", tier: "reasoning", build: (cx) => {
  if (cx.mode !== "cap") return null;
  const { net, U, d } = cx; const run = runOf(cx); const V = run.value;
  if (Math.random() < 0.5) { const rp = restrictedPart(cx.base, run, U, "(?)"); if (rp) return [rp]; }
  const inner = net.nodes.map((n) => n.id).filter((id) => id !== "S" && id !== "T");
  for (const v of shuf(inner)) {
    const t = net.arcs.filter((a) => a.to === v).reduce((s, a) => s + run.flow[a.id], 0);
    if (t < 2) continue;
    const c = t + 1 + Math.floor(Math.random() * 3);
    return [part("(?)", `The flow through vertex ${v} is restricted to a maximum of ${c} ${U}. Interpret the impact of this restriction on the maximum flow through the network.`,
      [mk("M1", `Compares the restriction, ${c}, with the flow through ${v} in the maximum flow, ${t}.`), mk("A1", `States that the restriction has no impact: ${t} < ${c}, so the maximum flow is still ${V} ${U}.`)],
      [`In the maximum flow the flow through ${v} is ${t} ${U}, which is less than the restriction of ${c} ${U}.`, `The restriction does not stop this flow, so the maximum flow is unchanged: ${V} ${U}.`],
      { flow: { ...run.flow }, focus: net.arcs.filter((a) => a.to === v || a.from === v).map((a) => a.id), labelPos: d.labelPos },
      [`Find how much passes through ${v} in the maximum flow: ${t}.`, "If the restriction is bigger than that, nothing changes. If it were smaller, the maximum flow would fall."])];
  }
  return null;
} };


// ═══ Earlier-specification ideas (built, but off by default; marked * in the tool) ══════════════════════════════════════════
/** "Find the maximum flow along each of the routes ABEH, ACFH…" — arc-disjoint routes, each limited by its smallest capacity */
const routeMax: PartDef = { id: "routeMax", idea: "routeMax", tier: "core", legacy: true, build: (cx) => {
  if (cx.mode !== "cap" || cx.d.superST) return null;
  const { net, U } = cx;
  const routes = simpleForwardPaths(net).filter((r) => r.length >= 3);
  const byId = Object.fromEntries(net.arcs.map((a) => [a.id, a]));
  const want = cx.level === 1 ? 2 : 3;
  const chosen: string[][] = [];
  for (const r of shuf(routes)) {
    if (chosen.every((o) => !o.some((id) => r.includes(id)))) chosen.push(r);
    if (chosen.length === want) break;
  }
  if (chosen.length < 2) return null;
  const amounts = chosen.map((r) => Math.min(...r.map((id) => byId[id].hi)));
  const flow: Flow = Object.fromEntries(net.arcs.map((a) => [a.id, 0]));
  chosen.forEach((r, i) => r.forEach((id) => { flow[id] += amounts[i]; }));
  const names = chosen.map((r) => pathLabel(net, r));
  cx.facts.routes = { chosen, amounts };
  return [part("(?)", `Find the maximum flow along each of the routes ${list(names)}.`,
    chosen.map((_, i) => mk("B1", `Route ${names[i]}: ${amounts[i]} ${U} (the smallest capacity on the route).`)),
    names.map((n, i) => `${n}: ${amounts[i]} ${U}`),
    { flow, labelPos: cx.d.labelPos },
    ["A route can carry no more than its smallest arc.", "These routes share no arcs, so each can be filled independently."])];
} };

/** "Show that the value of the cut is …" — the same sum, asked the other way round */
const cutShowThat: PartDef = { id: "cutShowThat", idea: "cutValue", tier: "core", legacy: true, build: (cx) => {
  const { net, U } = cx;
  const cut = pickCutWhere(cx, (cap) => cap >= 8 && cap <= 70); if (!cut) return null;
  const r = cutCapacity(net, cut);
  const p = part("(?)", `Show that the value of the cut ${notation(net, cut)} is ${r.capacity} ${U}.`,
    [mk("M1", "Adds the capacities of the arcs from the S side to the T side (arcs coming back are not counted)."), mk("A1", `Reaches ${r.capacity} ${U}.`)],
    [`${sumFull(r)} ${U}`], cutPic(cx, net, {}, cut),
    [`The S side is ${set(net, cut)}.`, `The arcs going from the S side to the T side: ${r.forward.map((a) => a.id).join(", ")}. Add their capacities.`]);
  p.working = cutWorking(cx, cut);
  return [p];
} };

/** "On a particular day this section is blocked: find the maximum flow" */
const blockedMax: PartDef = { id: "blockedMax", idea: "pipeOff", tier: "reasoning", legacy: true, build: (cx) => {
  if (cx.mode !== "cap" || cx.d.superST) return null;
  const { net, U } = cx; const run = runOf(cx); const V = run.value;
  const cands = shuf(net.arcs.filter((a) => run.flow[a.id] > 0 && a.from !== "S" && a.to !== "T")).map((a) => {
    const net2: FlowNet = { ...net, arcs: net.arcs.map((x) => (x.id === a.id ? { ...x, hi: 0 } : x)) };
    return { a, net2, M: minCutBruteForce(net2) };
  }).filter((x) => x.M.capacity >= 1 && x.M.capacity < V);
  const pick = cands[0]; if (!pick) return null;
  const { a, net2, M } = pick; const noun = cx.thing.includes("pipe") ? "pipe" : "arc";
  return [part("(?)", `On a particular day ${noun} ${a.id} is blocked, so it cannot be used. Find, by inspection, the maximum flow through the network on this day, and justify your answer.`,
    [mk("M1", `Finds a flow of ${M.capacity} ${U} that avoids ${a.id}.`), mk("A1", `Justifies that ${M.capacity} ${U} is the maximum with a cut: ${notation(net2, M.sSide)} has value ${M.capacity}.`)],
    [`Maximum flow ${M.capacity} ${U} (down from ${V}).`, `${notation(net2, M.sSide)}: ${sumFull(cutCapacity(net2, M.sSide))} ${U}, so no larger flow is possible.`],
    { ...cutView(net2, {}, M.sSide, true, true), net: net2, labelPos: cx.d.labelPos, focus: [a.id] },
    [`Treat ${a.id} as having capacity 0 and find the new maximum flow.`, "Show a cut of the same value to prove it."])];
} };

/** "A new pipe is to be added: which two vertices should it join to make a bigger flow possible?" */
const newArc: PartDef = { id: "newArc", idea: "capacityChange", tier: "reasoning", legacy: true, build: (cx) => {
  if (cx.mode !== "cap" || cx.d.superST) return null;
  const { net, U } = cx; const run = runOf(cx); const V = run.value;
  const ids = net.nodes.map((n) => n.id);
  const k = 4 + Math.floor(Math.random() * 5);
  const good: Array<[string, string, number]> = [];
  for (const u of ids) for (const v of ids) {
    if (u === v || v === "S" || u === "T" || net.arcs.some((a) => a.from === u && a.to === v)) continue;
    const net2: FlowNet = { ...net, arcs: [...net.arcs, { id: `${u}${v}`, from: u, to: v, lo: 0, hi: k }] };
    const gain = maxFlow(net2, { ...run.flow, [`${u}${v}`]: 0 }).value - V;
    if (gain > 0) good.push([u, v, gain]);
  }
  if (!good.length) return null;
  const [u, v, g] = good[0];
  return [part("(?)", `A new pipe of capacity ${k} ${U} is to be added to the network between two vertices that are not yet joined. Determine which two vertices it should join so that a flow of more than ${V} ${U} becomes possible.`,
    [mk("M1", `Chooses a pipe from a vertex on the S side of the minimum cut to a vertex on the T side, for example ${u} → ${v}.`), mk("A1", `Shows or states that the maximum flow increases (here by ${g}, to ${V + g} ${U}).`)],
    [`For example ${u} → ${v}: the maximum flow increases to ${V + g} ${U}.`, `A pipe helps only if it crosses the minimum cut ${notation(net, run.sSide)} from the S side to the T side. Valid choices include ${good.slice(0, 4).map(([a, b]) => `${a} → ${b}`).join(", ")}.`],
    { ...cutView(net, run.flow, run.sSide, true, true), net, labelPos: cx.d.labelPos },
    ["Every minimum cut limits the flow. A new pipe only helps if it goes from the S side to the T side of every minimum cut.", "A pipe inside one side of the cut changes nothing."])];
} };


// ═══ Showing a result on the diagram, tables of cuts, and more earlier-specification shapes ═════════════════════════════════
/** "State the value of the maximum flow and show a possible flow along each arc" — the flow is drawn on the figure */
const drawFlow: PartDef = { id: "drawFlow", idea: "augment", tier: "core", build: (cx) => {
  if (cx.d.superST) return null;
  const { U, net } = cx; const run = runOf(cx);
  return [part("(?)", `State the value of the maximum flow, and show a possible flow along each arc that gives this maximum flow.`,
    [mk("B1", `States the maximum flow, ${run.value} ${U}.`), mk("B1", `Shows a feasible flow of value ${run.value} on the network: flow in = flow out at every vertex and no arc over its capacity.`)],
    [], { flow: { ...run.flow }, labelPos: cx.d.labelPos },
    [`The maximum flow is ${run.value} ${U}.`, `Put the flow on each arc: ${net.arcs.filter((a) => run.flow[a.id] > 0).map((a) => `${a.id} ${run.flow[a.id]}`).join(", ")}; the other arcs carry 0.`])];
} };

/** AS: "complete the table to give the value of each of the cuts" — every cut of a small network */
const cutTable: PartDef = { id: "cutTable", idea: "cutTable", tier: "core", build: (cx) => {
  const d = cx.d; if (!d.cuts || !d.cutsAll) return null;
  const { net, U } = cx;
  const rows = d.cuts.map((c) => `${notation(net, c)}: ${cutCapacity(net, c).capacity}`);
  cx.facts.allCuts = d.cuts;
  return [part("(?)", `Complete a table giving the value of each of the ${d.cuts.length} possible cuts of the network.`,
    [mk("B1", `Gives the correct value of every cut (${U}); only arcs from the S side to the T side are added.`)],
    rows, { ...cutView(net, {}, d.cuts[0], true, true), net, labelPos: d.labelPos },
    ["List every way to split the vertices into an S side (containing S) and a T side (containing T).", "For each, add the capacities of the arcs going from the S side to the T side."])];
} };

/** AS: from the table of all cuts, "state the value of the maximum flow and give a reason" */
const maxFlowReason: PartDef = { id: "maxFlowReason", idea: "cutBound", tier: "core", build: (cx) => {
  const d = cx.d; const cuts: string[][] | undefined = cx.facts.allCuts; if (!cuts || !d.cutsAll) return null;
  const { net, U } = cx;
  const caps = cuts.map((c) => cutCapacity(net, c).capacity); const m = Math.min(...caps);
  const best = cuts[caps.indexOf(m)];
  return [part("(?)", `State the value of the maximum flow through the network. Give a reason for your answer.`,
    [mk("B1", `States ${m} ${U}, because it is the value of the smallest cut (maximum flow–minimum cut theorem).`)],
    [`Maximum flow = ${m} ${U}, the value of the smallest cut, ${notation(net, best)}.`],
    { ...cutView(net, {}, best, true, true), net, labelPos: d.labelPos },
    ["The maximum flow equals the value of the minimum cut (maximum flow–minimum cut theorem).", "Every possible cut is in the table, so the smallest value in it is the minimum cut."])];
} };

/** earlier specification: two arcs are made bigger — find the new maximum flow, starting from the old maximum flow */
const capacityIncrease: PartDef = { id: "capacityIncrease", idea: "capacityChange", tier: "reasoning", legacy: true, build: (cx) => {
  if (cx.mode !== "cap" || cx.d.superST) return null;
  const { net, U } = cx; const run = runOf(cx); const V = run.value;
  const cutArcs = cutCapacity(net, run.sSide).forward; if (cutArcs.length < 2) return null;
  const [a, b] = shuf(cutArcs).slice(0, 2); const k = 2 + Math.floor(Math.random() * 4);
  const net2: FlowNet = { ...net, arcs: net.arcs.map((x) => (x.id === a.id || x.id === b.id ? { ...x, hi: x.hi + k } : x)) };
  const run2 = maxFlow(net2, run.flow);
  if (run2.value <= V || run2.augmentations.length < 1 || run2.augmentations.length > 3) return null;
  const aug = augScheme(run2.augmentations, V, run2.value, U);
  return [part("(?)", `The capacities of ${a.id} and ${b.id} are each increased by ${k} ${U}. Starting from the maximum flow for the original network, use flow augmentation to find the new maximum flow.`,
    aug.scheme, aug.model, { flow: { ...run2.flow }, net: net2, labelPos: cx.d.labelPos, focus: [a.id, b.id] }, aug.explain)];
} };

/** earlier specification (min/max): by looking at one vertex, why no feasible flow exists at all */
const infeasibleVertex: PartDef = { id: "infeasibleVertex", idea: "impossible", tier: "reasoning", legacy: true, build: (cx) => {
  if (cx.mode !== "minmax") return null;
  const { net, d } = cx;
  for (const v of shuf(net.nodes.map((n) => n.id).filter((id) => id !== "S" && id !== "T"))) {
    const ins = net.arcs.filter((a) => a.to === v), outs = net.arcs.filter((a) => a.from === v);
    if (!ins.length || outs.length < 1) continue;
    const maxIn = ins.reduce((t, a) => t + a.hi, 0);
    const o = outs[0]; const others = outs.slice(1).reduce((t, a) => t + a.lo, 0);
    const lo = Math.max(o.lo, maxIn - others + 1 + Math.floor(Math.random() * 3));
    const arcs = net.arcs.map((a) => (a.id === o.id ? { ...a, lo, hi: Math.max(a.hi, lo + 2) } : a));
    const minOut = others + lo;
    const net2: FlowNet = { ...net, arcs };
    cx.facts.net2 = net2;
    return [part("(?)", `By considering the flow at an appropriate vertex, explain why there is no feasible flow through this network.`,
      [mk("M1", `Finds the most that can arrive at ${v}, ${ins.map((a) => a.hi).join(" + ")} = ${maxIn}, and the least that must leave it, ${[lo, ...outs.slice(1).map((a) => a.lo)].join(" + ")} = ${minOut}.`), mk("E1", `Explains that flow in = flow out cannot hold, because the most that can arrive (${maxIn}) is less than the least that must leave (${minOut}).`)],
      [`At ${v}: the most that can arrive is ${maxIn}; the least that must leave is ${minOut}.`, `${maxIn} < ${minOut}, so flow in = flow out is impossible: there is no feasible flow.`],
      { net: net2, labelPos: d.labelPos, focus: [...ins, ...outs].map((a) => a.id) },
      [`Add the upper capacities of the arcs into ${v} and the lower capacities of the arcs out of ${v}.`, "Flow in must equal flow out, so if the least out is more than the most in, no flow can exist."])];
  }
  return null;
} };


// ═══ Standing alone: what the earlier parts of a real question would have found ═════════════════════════════════════════════
// In an exam these reasoning parts come after the parts that find the maximum flow and its minimum cut. Standing alone (the Explain and
// justify tab) the question hands those results over — in the text and on the picture — so a one or two mark question is only the reasoning.
const GIVEN_FLOW: Record<string, { cut: boolean }> = {
  switchOff: { cut: false }, claimPipe: { cut: true }, restricted: { cut: false }, restrictionImpact: { cut: false },
  upgradeOne: { cut: true }, blockedMax: { cut: false }, capacityIncrease: { cut: false }, newArc: { cut: true },
};
function giveFlow(cx: PartCtx, withCut: boolean): string {
  const run = runOf(cx); const U = cx.U;
  const cut: string[] | null = withCut ? (cx.facts.cut as string[] | undefined) ?? interestingMinCut(cx.net, run.value, run.sSide) ?? run.sSide : null;
  cx.facts.givenView = { ...(cut ? cutView(cx.net, run.flow, cut, true, silent(cx)) : {}), flow: { ...run.flow }, net: cx.net, labelPos: cx.d.labelPos };
  return `A maximum flow of ${run.value} ${U} is shown on the diagram${cut ? `, and the minimum cut ${notation(cx.net, cut)} is marked` : ""}. `;
}
function withGiven(def: PartDef): PartDef {
  const spec = GIVEN_FLOW[def.id]; if (!spec) return def;
  return { ...def, build: (cx) => {
    const out = def.build(cx);
    if (!out || !cx.facts.given) return out;
    const g = giveFlow(cx, spec.cut);
    out[0] = { ...out[0], prompt: `${g}${out[0].prompt}` };
    return out;
  } };
}

export const PARTS: Record<string, PartDef> = Object.fromEntries([
  cutValue, cutWrite, boundTwo, missingFlows, proveAtMost, listSS, addSuper, cutInNew, boundNew,
  superAddA, potentials, augmentPart, proveMax, claimPipe, restricted, cutBack, cutMeaning, claimAboveCut, upgradeOne,
  deduceCut, flowCutCompare, claimFlowCut, superWords, forcedArc, impossibleFlow, switchOff, restrictionImpact,
  routeMax, cutShowThat, blockedMax, newArc,
  drawFlow, cutTable, maxFlowReason, capacityIncrease, infeasibleVertex,
].map((p) => [p.id, withGiven(p)]));

/** where each part is practised: a skills tab, or the Explain and justify tab with that idea ticked */
const skill = (subTool: string) => ({ subTool, options: { practice: "skills" } });
const idea = (key: string) => ({ subTool: "reason", options: { practice: "skills", ideaA: key, ideaAs: key } });
export const PRACTISE: Record<string, { subTool: string; options?: Record<string, string> }> = {
  cutValue: skill("cutValue"), cutWrite: skill("cutValue"), cutInNew: skill("cutValue"), cutBack: skill("cutValue"), cutShowThat: idea("showThat"),
  boundTwo: idea("deduce"), boundNew: idea("deduce"), cutMeaning: idea("deduce"), deduceCut: idea("deduce"),
  missingFlows: skill("missingFlow"), proveAtMost: skill("maxCut"), listSS: skill("superAS"), addSuper: skill("superAS"), superAddA: skill("superST"),
  potentials: skill("potentials"), augment: skill("augment"), proveMax: skill("maxFlow"), drawFlow: skill("maxFlow"),
  cutTable: skill("cutTable"), maxFlowReason: skill("cutTable"), restricted: skill("nodeCap"),
  claimPipe: idea("capacity"), upgradeOne: idea("upgrade"), claimAboveCut: idea("claimMax"), claimFlowCut: idea("claimMax"), flowCutCompare: idea("flowCut"),
  superWords: idea("superWords"), forcedArc: idea("forced"), impossibleFlow: idea("impossible"), switchOff: idea("pipeOff"), restrictionImpact: idea("restriction"),
  routeMax: idea("routeMax"), blockedMax: idea("blocked"), newArc: idea("newArc"), capacityIncrease: idea("capacityIncrease"), infeasibleVertex: idea("infeasible"),
};
