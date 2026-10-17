// ═══════════════════════════════════════════════════════════════════════════
// Network Flows — exam-style questions (AS). One network and a chain of lettered parts with marks, each with a model answer and a mark
// scheme (specs/flow-exam-questions.md). The numbers all come from the same solver as the skills tabs (cutCapacity, maxFlow, peelMissing,
// the supersource generator), so the mark scheme can never disagree with the working.
//   examCut    — value of a named cut · write down a cut of a given value · deduce the bound on the maximum flow (4 marks)
//   examFlow   — one or two missing flows by flow in = flow out · prove the maximum flow is at most V with a cut (5–6 marks)
//   examSuper  — list sources and sinks · add a supersource / supersink · value of a cut · the bound (6 marks)
// ═══════════════════════════════════════════════════════════════════════════

import {
  allCuts, cutCapacity, flowValue, maxFlow, minCutBruteForce, orderNodes, pathNodes, peelMissing, splitNodes,
  type Flow, type FlowMode, type FlowNet, type FlowProblemData, type FlowViewState,
} from "./flow";
import { drawable, generateFlowProblem } from "./flowGenerate";
import { cutView, potNumbers } from "./flowSolve";
import type { DecisionProblem, ExamMark, ExamPart } from "./types";

// AS: examCut, examFlow, examSuper. A-level: examAug (potentials → augmentation → prove → critique), examAugSuper (add S/T → …), examLower (lower capacities, claims, upgrades)
export type ExamChain = "examCut" | "examFlow" | "examSuper" | "examAug" | "examAugSuper" | "examLower";
export const EXAM_CHAINS: ExamChain[] = ["examCut", "examFlow", "examSuper"];
export const EXAM_CHAINS_A: ExamChain[] = ["examAug", "examAugSuper", "examLower"];

const CONTEXTS = [
  { thing: "water pipes", unit: "litres per second" },
  { thing: "gas pipes", unit: "cubic metres per second" },
  { thing: "oil pipelines", unit: "thousand barrels per day" },
  { thing: "cooling pipes in a factory", unit: "litres per minute" },
];
const pickOne = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const set = (net: FlowNet, ids: string[]) => `{${orderNodes(net, ids).join(", ")}}`;
const notation = (net: FlowNet, s: string[]) => `${set(net, s)} | ${set(net, net.nodes.map((n) => n.id).filter((id) => !s.includes(id)))}`;
const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs[0] ?? "");
const shuf = <T,>(a: T[]): T[] => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
/** The first cut in the list that can be drawn as one dashed line (checked lazily: the test is the expensive part, and a 10-vertex network has 256 cuts). */
const firstDrawable = (net: FlowNet, cuts: string[][]): string[] | null => { for (const c of cuts) if (drawable(net, c)) return c; return null; };
const mk = (code: string, text: string): ExamMark => ({ code, text });
const part = (label: string, prompt: string, scheme: ExamMark[], model: string[], view?: FlowViewState, explain?: string[]): ExamPart => ({ label, prompt, marks: scheme.length, scheme, model, explain, view });
/** what a cut adds up: "AB + SC = 3 + 7 = 10" */
const sum = (r: ReturnType<typeof cutCapacity>) => `${r.forward.map((a) => a.id).join(" + ")} = ${r.forward.map((a) => a.hi).join(" + ")} = ${r.capacity}`;

function build(
  data: FlowProblemData, base: DecisionProblem, intro: string, parts: ExamPart[], examView: FlowViewState,
): DecisionProblem {
  for (const p of parts) if (p.model.length === 0) p.onDiagram = true; // nothing to write out: the answer is the filled-in figure
  const totalMarks = parts.reduce((t, p) => t + p.marks, 0);
  return {
    network: base.network,
    prompt: intro,
    answer: { text: "" }, // the parts carry the answers
    flow: { ...data, subTool: "exam", course: "as", examView, flow: data.flow },
    exam: { id: `${Math.floor(Math.random() * 1e9)}`, intro, parts, totalMarks, minutes: Math.max(3, Math.round(totalMarks * 1.1)) },
    templateId: base.templateId,
  };
}

// ── Cuts and bounds ──────────────────────────────────────────────────────────
function examCut(level: 1 | 2 | 3): DecisionProblem {
  const ctx = pickOne(CONTEXTS);
  for (let attempt = 0; attempt < 200; attempt++) {
    const base = generateFlowProblem(level === 1 ? 2 : 3, "cutValue", "cap", undefined, undefined, { course: "as", big: level === 3 });
    const d = base.flow!;
    const net = d.net;
    const named = d.sSide!;
    const rNamed = cutCapacity(net, named);
    const minCut = maxFlow(net, d.flow).sSide.join();
    const smaller = allCuts(net).filter((c) => c.join() !== named.join() && cutCapacity(net, c).capacity < rNamed.capacity && cutCapacity(net, c).capacity >= 6);
    if (!smaller.length) continue;
    const preferMin = Math.random() < 0.5 ? smaller.filter((c) => c.join() === minCut) : [];
    const other = firstDrawable(net, [...preferMin, ...shuf(smaller)]);
    if (!other) continue;
    const rOther = cutCapacity(net, other);
    const U = ctx.unit;
    const parts = [
      part("(a)", `Find the value of the cut ${notation(net, named)}.`,
        [mk("B1", `Finds the correct value of the cut, ${rNamed.capacity} ${U} (units may be condoned). Only the arcs going from the S side to the T side are added.`)],
        [`${sum(rNamed)} ${U}`],
        cutView(net, {}, named, true, true),
        [`The cut separates the S side ${set(net, named)} from the T side.`, `Add the capacities of the arcs going from the S side to the T side: ${rNamed.forward.map((a) => a.id).join(", ")}.`, "An arc that comes back across the cut is not counted."]),
      part("(b)", `Write down a cut with a value of ${rOther.capacity} ${U}.`,
        [mk("B1", `Gives a valid cut of value ${rOther.capacity}. Any cut with this value is acceptable, for example ${notation(net, other)}.`)],
        [`${notation(net, other)}: ${sum(rOther)} ${U}`],
        cutView(net, {}, other, true, true),
        [`Any cut whose arcs from the S side to the T side add up to ${rOther.capacity} will do.`, `Try moving vertices from one side to the other, adding the capacities of the arcs from the S side to the T side each time, until you reach ${rOther.capacity}.`]),
      part("(c)", "Using your answers to parts (a) and (b), state what can be deduced about the maximum flow through the network. Fully justify your answer.",
        [
          mk("B1F", `States that the maximum flow is less than or equal to ${rOther.capacity} ${U}, the smaller of the two cuts. It must be a weak inequality (≤); "equal to" is not accepted.`),
          mk("E1F", "Explains the answer with the maximum flow–minimum cut theorem: the maximum flow cannot be greater than the value of any cut."),
        ],
        [`Maximum flow ≤ ${rOther.capacity} ${U}`, `The maximum flow is less than or equal to the value of any cut (maximum flow–minimum cut theorem), so it is at most ${rOther.capacity}.`],
        cutView(net, {}, other, true, true),
        [`The two cuts have values ${rNamed.capacity} and ${rOther.capacity}.`, "Each cut is an upper bound on the maximum flow, so use the smaller one: it is the tighter bound.", "Write ≤, not =: one cut on its own only gives an upper bound."]),
    ];
    const intro = `The diagram shows a network of ${ctx.thing}. The number on each arc is the greatest flow it can carry, in ${U}.`;
    return build(d, base, intro, parts, {});
  }
  throw new Error("flow exam: no cuts-and-bounds question found");
}

// ── Flow in = flow out ───────────────────────────────────────────────────────
function examFlow(level: 1 | 2 | 3): DecisionProblem {
  const ctx = pickOne(CONTEXTS);
  for (let attempt = 0; attempt < 300; attempt++) {
    const base = generateFlowProblem(level === 1 ? 2 : 3, "missingFlow", "cap", undefined, undefined, { course: "as", big: level === 3 });
    const d = base.flow!;
    const { net, flow } = d;
    const missing = d.missing!;
    const order = peelMissing(net, missing);
    if (!order) continue;
    const run = maxFlow(net, flow);
    const current = flowValue(net, flow);
    if (run.value - current < 2 || !drawable(net, run.sSide) || run.sSide.length < 2) continue;
    const U = ctx.unit;
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
        ["Flow in = flow out at every vertex except S and T.", `Choose a vertex where only this arc is unknown: ${vertex}.`, "Call the unknown flow x, add up the flows in and the flows out, and solve for x."]));
    });
    if (order.length === 1) {
      parts.push(part("(b)", "State the value of the flow through the network.",
        [mk("B1", `States ${current} ${U}.`)],
        [`${net.arcs.filter((x) => x.from === "S").map((x) => flow[x.id]).join(" + ")} = ${current} ${U}`],
        { flow: { ...flow } },
        ["The value of the flow is the total flow leaving S (it equals the total flow entering T)."]));
    }
    const r = cutCapacity(net, run.sSide);
    parts.push(part("(c)", `Prove that the maximum flow through the network is at most ${run.value} ${U}.`,
      [
        mk("M1", `Identifies the cut ${notation(net, run.sSide)} (the arcs from the S side to the T side are ${r.forward.map((a) => a.id).join(", ")}).`),
        mk("R1", `Completes a reasoned argument: the cut has value ${run.value}, and by the maximum flow–minimum cut theorem the maximum flow is less than or equal to the value of any cut, so it is at most ${run.value} ${U}.`),
      ],
      [`${notation(net, run.sSide)}: ${sum(r)} ${U}`, `By the maximum flow–minimum cut theorem the maximum flow is less than or equal to the value of any cut, so it is at most ${run.value} ${U}.`],
      { ...cutView(net, flow, run.sSide, true, true), flow: { ...flow } },
      ["To find the cut: start at S and follow arcs that are not full (and arcs backwards that carry flow). The vertices you can reach are the S side.", "Every arc from the S side to the T side is then full, so this cut gives the smallest upper bound.", "Add the capacities of those arcs."]));
    const intro = `The diagram shows a network of ${ctx.thing}. The number on each arc is the greatest flow it can carry, in ${U}. A flow through the network is shown by the circled numbers; the flow in ${missing.length > 1 ? "two arcs is" : "one arc is"} missing and marked ?.`;
    return build(d, base, intro, parts, { flow: Object.fromEntries(net.arcs.filter((a) => !missing.includes(a.id)).map((a) => [a.id, flow[a.id]])), unknown: missing });
  }
  throw new Error("flow exam: no flow-in-equals-flow-out question found");
}

// ── Supersource / supersink ──────────────────────────────────────────────────
function examSuper(level: 1 | 2 | 3): DecisionProblem {
  const ctx = pickOne(CONTEXTS);
  for (let attempt = 0; attempt < 300; attempt++) {
    const base = generateFlowProblem(level === 1 ? 2 : 3, "superST", "cap", undefined, undefined, { course: "as", shape: level === 3 ? "both" : "mixed", big: level === 3 });
    const d = base.flow!;
    const sp = d.superST!;
    const net = d.net; // with the supersource / supersink added
    const srcs = Object.keys(sp.sources), snks = Object.keys(sp.sinks);
    const sources = sp.removeS ? srcs : ["S"], sinks = sp.removeT ? snks : ["T"];
    const byId = Object.fromEntries(net.arcs.map((a) => [a.id, a]));
    const added = sp.superArcs.map((id) => byId[id]);
    const cuts = allCuts(net).filter((c) => c.length >= 2 && net.nodes.length - c.length >= 2 && cutCapacity(net, c).capacity >= 8 && cutCapacity(net, c).capacity <= 60);
    const named = firstDrawable(net, shuf(cuts));
    if (!named) continue;
    const r = cutCapacity(net, named);
    const U = ctx.unit;
    const what = sp.removeS && sp.removeT ? "a supersource S and a supersink T" : sp.removeS ? "a supersource S" : "a supersink T";
    const addedText = added.map((a) => `${a.from} → ${a.to} (${a.hi})`);
    const full = (extra: FlowViewState = {}): FlowViewState => ({ net, labelPos: d.labelPos, ...extra });
    const parts = [
      part("(a)", "State which vertices are sources and which are sinks.",
        [mk("B1", `Lists the sources: ${list(sources)}.`), mk("B1", `Lists the sinks: ${list(sinks)}.`)],
        [`Sources: ${list(sources)}`, `Sinks: ${list(sinks)}`],
        { net: sp.question, labelPos: d.labelPos },
        ["A source has no arcs coming in; a sink has no arcs going out."]),
      part("(b)", `Add ${what} to the network so that it has a single source and a single sink. Show the capacity of each arc you add.`,
        [
          mk("M1", `Adds ${what}, with an arrow from the supersource to each source${sp.removeT ? " and from each sink to the supersink" : ""}, in the correct direction.`),
          mk("A1", `Labels every added arc with a capacity of at least the total capacity of the arcs leaving that source (or arriving at that sink): ${addedText.join(", ")}.`),
        ],
        [],
        full({ focus: sp.superArcs }),
        ["Each added arc takes the total capacity of the arcs leaving that source (or arriving at that sink), so it never limits the flow."]),
      part("(c)", `Find the value of the cut ${notation(net, named)} in your network.`,
        [mk("B1", `Finds the correct value of the cut, ${r.capacity} ${U} (units may be condoned). Only the arcs from the S side to the T side are added.`)],
        [`${sum(r)} ${U}`],
        { ...cutView(net, {}, named, true, true), net, labelPos: d.labelPos },
        [`Add the capacities of the arcs going from the S side to the T side: ${r.forward.map((a) => a.id).join(", ")}.`, "An arc that comes back across the cut is not counted."]),
      part("(d)", "State what can be deduced about the maximum flow through the network.",
        [mk("B1F", `States that the maximum flow is less than or equal to ${r.capacity} ${U}. It must be a weak inequality (≤).`)],
        [`Maximum flow ≤ ${r.capacity} ${U}`],
        { ...cutView(net, {}, named, true, true), net, labelPos: d.labelPos },
        ["The maximum flow is less than or equal to the value of any cut, so the cut in part (c) is an upper bound.", "Write ≤, not =."]),
    ];
    const intro = `The diagram shows a network of ${ctx.thing}. The number on each arc is the greatest flow it can carry, in ${U}.`;
    return build(d, base, intro, parts, { net: sp.question, labelPos: d.labelPos });
  }
  throw new Error("flow exam: no supersource question found");
}

// ═══════════════════════════════════════════════════════════════════════════
// A-level (DC1–DC7). Questions are longer (6–10 marks) and use the A-level skills: flow augmentation from a GIVEN feasible flow, lower and
// upper capacities, proving a flow maximal with a cut, and commenting on a claim about the network. Network sizes are the 8-vertex
// templates (AQA uses up to about 10 nodes plus the added S and T; larger templates are not built yet).
// ═══════════════════════════════════════════════════════════════════════════

/** A minimum cut worth asking about: of the cuts with the maximum flow's value, one that is drawable and has several vertices on each side (a cut of just S or just T teaches nothing). */
function interestingMinCut(net: FlowNet, V: number, fallback: string[]): string[] | null {
  const n = net.nodes.length;
  const cuts = allCuts(net).filter((c) => c.length >= 2 && n - c.length >= 2 && cutCapacity(net, c).capacity === V);
  const drawn = firstDrawable(net, shuf(cuts));
  if (drawn) return drawn;
  return fallback.length >= 2 && drawable(net, fallback) ? fallback : null;
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
  const why = valid
    ? `${thing === "pipe" ? "Pipe" : "Arc"} ${a.id} is full and lies in the minimum cut ${notation(net, cut)}, so it is limiting the flow: increasing its capacity by ${k} raises the maximum flow by ${g} ${U}, to ${V + g}.`
    : f < a.hi
      ? `${thing === "pipe" ? "Pipe" : "Arc"} ${a.id} carries ${f} ${U}, below its capacity of ${a.hi}, so it is not limiting the flow. Increasing its capacity will not change the maximum flow of ${V} ${U}.`
      : `${thing === "pipe" ? "Pipe" : "Arc"} ${a.id} is full, but it is not in a minimum cut: the flow is limited elsewhere, by the cut ${notation(net, cut)} of value ${V}. Increasing its capacity by ${k} will not change the maximum flow.`;
  return part(label, `A trainee engineer claims that increasing the capacity of pipe ${a.id} by ${k} ${U} will increase the maximum flow through the network. Comment on the validity of this claim.`,
    [
      mk("M1", `Explains whether pipe ${a.id} is limiting the flow (${valid ? "it is part of the minimum cut" : f < a.hi ? "it is not full" : "it is full but not in the minimum cut"}).`),
      mk("R1", `Concludes explicitly that the claim is ${verdict}${valid ? ` (the maximum flow rises by ${g}, to ${V + g} ${U})` : ""}. A conclusion that does not state whether the claim is correct loses this mark.`),
    ],
    [why, `So the engineer's claim is ${verdict}.`],
    { ...cutView(net, run.flow, cut, true, false), focus: [a.id], flow: { ...run.flow } },
    [`Look at pipe ${a.id}: it carries ${f} of a possible ${a.hi} ${U}.`, "A pipe only limits the flow if it is full and lies in a minimum cut. Increasing any other pipe changes nothing.", "Always finish by stating whether the claim is correct or incorrect."]);
}

/** Flow through one vertex restricted to c (cap networks only): split it, find the new minimum cut. */
function restrictedPart(net: FlowNet, run: ReturnType<typeof maxFlow>, labelPos: FlowProblemData["labelPos"], U: string, label: string): ExamPart | null {
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
      [`Arcs arriving at ${v} now go into ${sp.inNode[v]}; arcs leaving go out of ${sp.outNode[v]}.`, `The new minimum cut ${notation(sp.net, M.sSide)} has value ${M.capacity}.`]);
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

function examAug(level: 1 | 2 | 3, mode: FlowMode, withSuper: boolean): DecisionProblem {
  const ctx = pickOne(CONTEXTS);
  const U = ctx.unit;
  for (let attempt = 0; attempt < 800; attempt++) {
    const tpl = level === 1 ? 2 : 3;
    const base = withSuper
      ? generateFlowProblem(tpl, "superST", mode, undefined, undefined, { course: "a", shape: level === 3 ? "both" : "mixed", big: level === 3 })
      : generateFlowProblem(tpl, "maxFlow", mode, undefined, undefined, { big: level === 3 });
    const d = base.flow!;
    const net = d.net;
    const run = maxFlow(net, d.flow);
    const k = run.augmentations.length;
    // three paths is the usual number in an exam (AQA 2022, 2024); the supersource networks and the smallest networks allow a path either way
    if (withSuper ? k < 2 || k > 4 : level === 1 ? k < 2 || k > 3 : k !== 3) continue;
    const V0 = flowValue(net, d.flow), V = run.value;
    const cut = interestingMinCut(net, V, run.sSide);
    if (!cut) continue;
    const sp = d.superST;
    const parts: ExamPart[] = [];
    const labels = withSuper ? ["(a)", "(b)", "(c)", "(d)", "(e)"] : ["(a)", "(b)", "(c)", "(d)", "(e)"];
    let li = 0;
    const ml = mode === "minmax";
    if (withSuper && sp) {
      const what = sp.removeS && sp.removeT ? "a supersource S and a supersink T" : sp.removeS ? "a supersource S" : "a supersink T";
      parts.push(part(labels[li++], `Add ${what} to the network so that it has a single source and a single sink, ${ml ? "showing the lower and upper capacity of each arc you add" : "showing the capacity of each arc you add"}.`,
        [
          mk("M1", `Adds ${what}, with an arrow from the supersource to each source${sp.removeT ? " and from each sink to the supersink" : ""}.`),
          mk("A1", ml ? "Labels every added arc with a correct upper capacity AND a correct lower capacity (the totals of the arcs leaving each source or arriving at each sink)." : "Labels every added arc with a capacity at least the total capacity of the arcs leaving each source (or arriving at each sink)."),
        ],
        [],
        { net, labelPos: d.labelPos, flow: { ...d.flow }, focus: sp.superArcs },
        [ml ? "Each added arc takes the total of the lower capacities and the total of the upper capacities of the arcs leaving that source (or arriving at that sink)." : "Each added arc takes the total capacity of the arcs leaving that source (or arriving at that sink)."]));
    } else {
      parts.push(part(labels[li++], `A flow of ${V0} ${U} through the network is shown (the circled numbers). On the network, indicate the potential increase and the potential decrease of each arc.`,
        [mk("M1", "Finds a correct potential increase and decrease for at least one arc (numbers reversed condoned for this mark)."), mk("A1", "Determines the correct potential increase and decrease for every arc.")],
        [],
        { flow: { ...d.flow }, potentials: potNumbers(net, d.flow) },
        [`Write both numbers on each arc of the blank network: each arc carries its potential increase (along the arrow) and its potential decrease (against it).`, `Potential increase = ${ml ? "upper capacity" : "capacity"} − flow (how much more can be sent along the arrow).`, `Potential decrease = flow${ml ? " − lower capacity" : ""} (how much can be taken back, against the arrow).`]));
    }
    const aug = augScheme(run.augmentations, V0, V, U);
    parts.push(part(labels[li++], `A flow of ${V0} ${U} through the ${withSuper ? "new " : ""}network is shown (the circled numbers). Use flow augmentation to find the maximum flow. You must indicate any flow-augmenting paths clearly in the table.`,
      aug.scheme, aug.model, { flow: { ...run.flow } }, aug.explain));
    const r = cutCapacity(net, cut);
    parts.push(part(labels[li++], `Prove that the flow you found is the maximum flow.`,
      [
        mk("M1", `Identifies a minimum cut, for example ${notation(net, cut)}${ml ? " (arcs coming back across it use their lower capacities)" : ""}.`),
        mk("R1", `Compares the cut value, ${r.capacity}, with the flow of ${V} ${U} and states, naming or explaining the maximum flow–minimum cut theorem, that the flow is maximal.`),
      ],
      [`${notation(net, cut)}: ${ml && r.backward.length ? `${r.forward.map((a) => a.hi).join(" + ")} − ${r.backward.map((a) => a.lo).join(" − ")} = ${r.capacity}` : `${r.forward.map((a) => a.hi).join(" + ")} = ${r.capacity}`}`, `The cut has value ${r.capacity}, equal to the flow of ${V} ${U}. By the maximum flow–minimum cut theorem, the flow is maximal.`],
      { ...cutView(net, run.flow, cut, true, false), flow: { ...run.flow } },
      ["To find the cut: after the last augmentation, start at S and follow arcs that still have spare potential. The vertices you can reach are the S side.", ml ? "Add the upper capacities of the arcs from the S side to the T side, and subtract the lower capacities of the arcs coming back." : "Add the capacities of the arcs from the S side to the T side.", "A flow equal to a cut cannot be improved: the maximum flow is at most any cut."]));
    parts.push(claimPart(net, run, cut, U, labels[li++], ctx.thing.includes("pipe") ? "pipe" : "arc"));
    if (level === 3 && mode === "cap") {
      const rp = restrictedPart(net, run, d.labelPos, U, labels[li]);
      if (rp) parts.push(rp);
    }
    const intro = `The diagram shows a network of ${ctx.thing}. ${ml ? "Each arc is labelled with its lower and upper capacity, in " : "The number on each arc is the greatest flow it can carry, in "}${U}.`;
    const examView: FlowViewState = withSuper && sp ? { net: sp.question, labelPos: d.labelPos, flow: { ...d.flow } } : { flow: { ...d.flow } };
    return build({ ...d, mode }, base, intro, parts, examView);
  }
  throw new Error("flow exam (A-level): no augmentation question found");
}

/** Lower capacities, cuts with a backward arc, a claim about the maximum flow, and which one pipe to upgrade. */
function examLower(level: 1 | 2 | 3): DecisionProblem {
  const ctx = pickOne(CONTEXTS);
  const U = ctx.unit;
  for (let attempt = 0; attempt < 400; attempt++) {
    const base = generateFlowProblem(level === 1 ? 2 : 3, "cutValue", "minmax", undefined, undefined, { cuts: "backward", big: level === 3 });
    const d = base.flow!;
    const { net } = d;
    const named = d.sSide!;
    const r = cutCapacity(net, named);
    if (!r.backward.length || !r.backward.some((a) => a.lo > 0)) continue;
    const run = maxFlow(net, d.flow);
    if (r.capacity < run.value) continue; // the cut must be a genuine upper bound (always true), kept as a guard
    // exactly one pipe whose upgrade by k raises the maximum flow
    let upgrade: { id: string; k: number; g: number } | null = null;
    for (let k = 2; k <= 6 && !upgrade; k++) {
      const gains = net.arcs.map((a) => ({ id: a.id, g: maxFlow({ ...net, arcs: net.arcs.map((x) => (x.id === a.id ? { ...x, hi: x.hi + k } : x)) }, run.flow).value - run.value }));
      const helpful = gains.filter((x) => x.g > 0);
      if (helpful.length === 1) upgrade = { id: helpful[0].id, k, g: helpful[0].g };
    }
    if (!upgrade) continue;
    const X = r.capacity + 3 + Math.floor(Math.random() * 8);
    const up = net.arcs.find((a) => a.id === upgrade!.id)!;
    const fwd = r.forward.map((a) => a.hi).join(" + ");
    const back = r.backward.map((a) => a.lo).join(" − ");
    const parts = [
      part("(a)", `Find the value of the cut ${notation(net, named)}.`,
        [mk("B1", `Finds the correct value of the cut, ${r.capacity} ${U}: the upper capacities of the arcs from the S side to the T side, minus the lower capacities of the arcs coming back (units may be condoned).`)],
        [`${fwd} − ${back} = ${r.capacity} ${U}`],
        cutView(net, {}, named, true, false),
        [`Arcs from the S side to the T side: ${r.forward.map((a) => a.id).join(", ")} — add their upper capacities.`, `Arcs coming back across the cut: ${r.backward.map((a) => a.id).join(", ")} — subtract their lower capacities.`]),
      part("(b)", "Explain what your answer to part (a) tells you about the maximum flow, in the context of the question.",
        [mk("B1F", `States, in context and with units, that the maximum flow through the network of ${ctx.thing} is less than or equal to ${r.capacity} ${U}. Answers in the language of arcs and nodes only do not score.`)],
        [`The maximum flow through the ${ctx.thing} is at most ${r.capacity} ${U}.`],
        cutView(net, {}, named, true, false),
        ["The maximum flow cannot be greater than the value of any cut.", "Say it in the context of the question, with units, not in the language of arcs and nodes."]),
      part("(c)", `A manager claims that the maximum flow through the network is ${X} ${U}. Comment on the validity of this claim.`,
        [
          mk("B1", `Compares the claimed ${X} ${U} with the value of the cut found in part (a), ${r.capacity} ${U}.`),
          mk("B1F", `Concludes explicitly that the claim is incorrect, because the maximum flow is at most ${r.capacity}, which is less than ${X}.`),
        ],
        [`The maximum flow is at most ${r.capacity} ${U} (part (a)), and ${r.capacity} < ${X}.`, "So the manager's claim is incorrect."],
        cutView(net, {}, named, true, false),
        [`Compare the claim, ${X}, with the value of the cut, ${r.capacity}.`, `The maximum flow cannot exceed ${r.capacity}, so ${X} is impossible.`, "Finish with a clear statement that the claim is incorrect."]),
      part("(d)", `The capacity of just one pipe can be increased by ${upgrade.k} ${U}. Explain which pipe should be increased, and find the new maximum flow.`,
        [
          mk("E1", `Explains that pipe ${up.id} should be increased: it is the only pipe that crosses every minimum cut from the S side to the T side, so it is the only one limiting the flow.`),
          mk("B1F", `States that the maximum flow increases by ${upgrade.g}, to ${run.value + upgrade.g} ${U}.`),
        ],
        [`Increase pipe ${up.id}: it is the only pipe in every minimum cut, so it is the only one limiting the flow.`, `The new maximum flow is ${run.value + upgrade.g} ${U} (an increase of ${upgrade.g}).`],
        { ...cutView(net, run.flow, run.sSide, true, false), focus: [up.id], flow: { ...run.flow } },
        [`The maximum flow is ${run.value} ${U}, limited by the minimum cut ${notation(net, run.sSide)}.`, "Increasing a pipe that is not in every minimum cut leaves a minimum cut unchanged, so the maximum flow stays the same."]),
    ];
    const intro = `The diagram shows a network of ${ctx.thing}. Each arc is labelled with its lower and upper capacity, in ${U}.`;
    return build(d, base, intro, parts, {});
  }
  throw new Error("flow exam (A-level): no lower-capacity question found");
}

export interface ExamOptions { course?: "as" | "a"; mode?: FlowMode }

/** One exam-style question. `chain` picks the style; "any" picks one at random from the course's styles. Levels are the network size (1 = 6–7 vertices, 2–3 = 8). */
export function generateFlowExam(level: 1 | 2 | 3, chain: ExamChain | "any" = "any", opts: ExamOptions = {}): DecisionProblem {
  const a = opts.course === "a";
  const c: ExamChain = chain === "any" ? pickOne(a ? EXAM_CHAINS_A : EXAM_CHAINS) : chain;
  const mode = opts.mode ?? "cap";
  let p: DecisionProblem;
  if (c === "examCut") p = examCut(level);
  else if (c === "examFlow") p = examFlow(level);
  else if (c === "examSuper") p = examSuper(level);
  else if (c === "examAug") p = examAug(level, mode, false);
  else if (c === "examAugSuper") p = examAug(level, mode, true);
  else p = examLower(level);
  if (a) p = { ...p, flow: { ...p.flow!, course: undefined } };
  return p;
}
