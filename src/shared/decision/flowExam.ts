// ═══════════════════════════════════════════════════════════════════════════
// Network Flows — exam-style questions (AS). One network and a chain of lettered parts with marks, each with a model answer and a mark
// scheme (specs/flow-exam-questions.md). The numbers all come from the same solver as the skills tabs (cutCapacity, maxFlow, peelMissing,
// the supersource generator), so the mark scheme can never disagree with the working.
//   examCut    — value of a named cut · write down a cut of a given value · deduce the bound on the maximum flow (4 marks)
//   examFlow   — one or two missing flows by flow in = flow out · prove the maximum flow is at most V with a cut (5–6 marks)
//   examSuper  — list sources and sinks · add a supersource / supersink · value of a cut · the bound (6 marks)
// ═══════════════════════════════════════════════════════════════════════════

import {
  allCuts, cutCapacity, flowValue, maxFlow, orderNodes, peelMissing,
  type Flow, type FlowNet, type FlowProblemData, type FlowViewState,
} from "./flow";
import { drawable, generateFlowProblem } from "./flowGenerate";
import { cutView } from "./flowSolve";
import type { DecisionProblem, ExamMark, ExamPart } from "./types";

export type ExamChain = "examCut" | "examFlow" | "examSuper";
export const EXAM_CHAINS: ExamChain[] = ["examCut", "examFlow", "examSuper"];

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
const mk = (code: string, text: string): ExamMark => ({ code, text });
const part = (label: string, prompt: string, scheme: ExamMark[], model: string[], view?: FlowViewState): ExamPart => ({ label, prompt, marks: scheme.length, scheme, model, view });
/** what a cut adds up: "AB + SC = 3 + 7 = 10" */
const sum = (r: ReturnType<typeof cutCapacity>) => `${r.forward.map((a) => a.id).join(" + ")} = ${r.forward.map((a) => a.hi).join(" + ")} = ${r.capacity}`;

function build(
  data: FlowProblemData, base: DecisionProblem, intro: string, parts: ExamPart[], examView: FlowViewState,
): DecisionProblem {
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
    const base = generateFlowProblem(level === 1 ? 2 : 3, "cutValue", "cap", undefined, undefined, { course: "as" });
    const d = base.flow!;
    const net = d.net;
    const named = d.sSide!;
    const rNamed = cutCapacity(net, named);
    const minCut = maxFlow(net, d.flow).sSide.join();
    const smaller = allCuts(net).filter((c) => c.join() !== named.join() && cutCapacity(net, c).capacity < rNamed.capacity && cutCapacity(net, c).capacity >= 6 && drawable(net, c));
    if (!smaller.length) continue;
    const preferMin = Math.random() < 0.5 ? smaller.filter((c) => c.join() === minCut) : [];
    const other = pickOne(preferMin.length ? preferMin : smaller);
    const rOther = cutCapacity(net, other);
    const U = ctx.unit;
    const parts = [
      part("(a)", `Find the value of the cut ${notation(net, named)}.`,
        [mk("B1", `Finds the correct value of the cut, ${rNamed.capacity} ${U} (units may be condoned). Only the arcs going from the S side to the T side are added.`)],
        [`Arcs from the S side to the T side: ${rNamed.forward.map((a) => a.id).join(", ")}`, sum(rNamed)],
        cutView(net, {}, named, true, true)),
      part("(b)", `Write down a cut with a value of ${rOther.capacity} ${U}.`,
        [mk("B1", `Gives a valid cut of value ${rOther.capacity}. Any cut with this value is acceptable, for example ${notation(net, other)}.`)],
        [`The cut ${notation(net, other)}`, sum(rOther)],
        cutView(net, {}, other, true, true)),
      part("(c)", "Using your answers to parts (a) and (b), state what can be deduced about the maximum flow through the network. Fully justify your answer.",
        [
          mk("B1F", `States that the maximum flow is less than or equal to ${rOther.capacity} ${U}, the smaller of the two cuts. It must be a weak inequality (≤); "equal to" is not accepted.`),
          mk("E1F", "Explains the answer with the maximum flow–minimum cut theorem: the maximum flow cannot be greater than the value of any cut."),
        ],
        [`Maximum flow ≤ ${rOther.capacity} ${U}`, `The maximum flow is less than or equal to the value of any cut (maximum flow–minimum cut theorem). The cuts found have values ${rNamed.capacity} and ${rOther.capacity}, so the maximum flow is at most ${rOther.capacity}.`],
        cutView(net, {}, other, true, true)),
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
    const base = generateFlowProblem(level === 1 ? 2 : 3, "missingFlow", "cap", undefined, undefined, { course: "as" });
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
        [`At ${vertex}: flow in = flow out`, `${inn.map(term).join(" + ")} = ${out.map(term).join(" + ")}`, `So the flow in the arc from ${a.from} to ${a.to} is ${flow[arc]} ${U}.`],
        { flow: { ...known }, unknown: [...left], solved: [arc] }));
    });
    if (order.length === 1) {
      parts.push(part("(b)", "State the value of the flow through the network.",
        [mk("B1", `States ${current} ${U}.`)],
        [`The flow leaving S: ${net.arcs.filter((x) => x.from === "S").map((x) => flow[x.id]).join(" + ")} = ${current} ${U}.`],
        { flow: { ...flow } }));
    }
    const r = cutCapacity(net, run.sSide);
    parts.push(part("(c)", `Prove that the maximum flow through the network is at most ${run.value} ${U}.`,
      [
        mk("M1", `Identifies the cut ${notation(net, run.sSide)} (the arcs from the S side to the T side are ${r.forward.map((a) => a.id).join(", ")}).`),
        mk("R1", `Completes a reasoned argument: the cut has value ${run.value}, and by the maximum flow–minimum cut theorem the maximum flow is less than or equal to the value of any cut, so it is at most ${run.value} ${U}.`),
      ],
      [`Consider the cut ${notation(net, run.sSide)}.`, sum(r), `By the maximum flow–minimum cut theorem the maximum flow is less than or equal to the value of any cut, so the maximum flow is at most ${run.value} ${U}.`],
      { ...cutView(net, flow, run.sSide, true, true), flow: { ...flow } }));
    const intro = `The diagram shows a network of ${ctx.thing}. The number on each arc is the greatest flow it can carry, in ${U}. A flow through the network is shown by the circled numbers; the flow in ${missing.length > 1 ? "two arcs is" : "one arc is"} missing and marked ?.`;
    return build(d, base, intro, parts, { flow: Object.fromEntries(net.arcs.filter((a) => !missing.includes(a.id)).map((a) => [a.id, flow[a.id]])), unknown: missing });
  }
  throw new Error("flow exam: no flow-in-equals-flow-out question found");
}

// ── Supersource / supersink ──────────────────────────────────────────────────
function examSuper(level: 1 | 2 | 3): DecisionProblem {
  const ctx = pickOne(CONTEXTS);
  for (let attempt = 0; attempt < 300; attempt++) {
    const base = generateFlowProblem(level === 1 ? 2 : 3, "superST", "cap", undefined, undefined, { course: "as", shape: level === 3 ? "both" : "mixed" });
    const d = base.flow!;
    const sp = d.superST!;
    const net = d.net; // with the supersource / supersink added
    const srcs = Object.keys(sp.sources), snks = Object.keys(sp.sinks);
    const sources = sp.removeS ? srcs : ["S"], sinks = sp.removeT ? snks : ["T"];
    const byId = Object.fromEntries(net.arcs.map((a) => [a.id, a]));
    const added = sp.superArcs.map((id) => byId[id]);
    const cuts = allCuts(net).filter((c) => c.length >= 2 && net.nodes.length - c.length >= 2 && cutCapacity(net, c).capacity >= 8 && cutCapacity(net, c).capacity <= 60 && drawable(net, c));
    if (!cuts.length) continue;
    const named = pickOne(cuts);
    const r = cutCapacity(net, named);
    const U = ctx.unit;
    const what = sp.removeS && sp.removeT ? "a supersource S and a supersink T" : sp.removeS ? "a supersource S" : "a supersink T";
    const addedText = added.map((a) => `${a.from} → ${a.to} (${a.hi})`);
    const full = (extra: FlowViewState = {}): FlowViewState => ({ net, labelPos: d.labelPos, ...extra });
    const parts = [
      part("(a)", "State which vertices are sources and which are sinks.",
        [mk("B1", `Lists the sources: ${list(sources)}.`), mk("B1", `Lists the sinks: ${list(sinks)}.`)],
        [`Sources (nothing flows in): ${list(sources)}`, `Sinks (nothing flows out): ${list(sinks)}`],
        { net: sp.question, labelPos: d.labelPos }),
      part("(b)", `Add ${what} to the network so that it has a single source and a single sink. Show the capacity of each arc you add.`,
        [
          mk("M1", `Adds ${what}, with an arrow from the supersource to each source${sp.removeT ? " and from each sink to the supersink" : ""}, in the correct direction.`),
          mk("A1", `Labels every added arc with a capacity of at least the total capacity of the arcs leaving that source (or arriving at that sink): ${addedText.join(", ")}.`),
        ],
        [`Add ${addedText.join(", ")}`, "Each added arc has a capacity equal to the total capacity of the arcs leaving that source (or arriving at that sink), so it never limits the flow."],
        full({ focus: sp.superArcs })),
      part("(c)", `Find the value of the cut ${notation(net, named)} in your network.`,
        [mk("B1", `Finds the correct value of the cut, ${r.capacity} ${U} (units may be condoned). Only the arcs from the S side to the T side are added.`)],
        [`Arcs from the S side to the T side: ${r.forward.map((a) => a.id).join(", ")}`, sum(r)],
        { ...cutView(net, {}, named, true, true), net, labelPos: d.labelPos }),
      part("(d)", "State what can be deduced about the maximum flow through the network.",
        [mk("B1F", `States that the maximum flow is less than or equal to ${r.capacity} ${U}. It must be a weak inequality (≤).`)],
        [`Maximum flow ≤ ${r.capacity} ${U}, since the maximum flow is less than or equal to the value of any cut.`],
        { ...cutView(net, {}, named, true, true), net, labelPos: d.labelPos }),
    ];
    const intro = `The diagram shows a network of ${ctx.thing}. The number on each arc is the greatest flow it can carry, in ${U}.`;
    return build(d, base, intro, parts, { net: sp.question, labelPos: d.labelPos });
  }
  throw new Error("flow exam: no supersource question found");
}

/** One exam-style question. `chain` picks the style; "any" picks one at random. Levels are the network size (1 = 6–7 vertices, 2–3 = 8). */
export function generateFlowExam(level: 1 | 2 | 3, chain: ExamChain | "any" = "any"): DecisionProblem {
  const c = chain === "any" ? pickOne(EXAM_CHAINS) : chain;
  const p = c === "examCut" ? examCut(level) : c === "examFlow" ? examFlow(level) : examSuper(level);
  return p;
}

