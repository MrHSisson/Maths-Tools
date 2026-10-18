// ════════════════════════════════════════════════════════════════════════════
// Network Flows — exam-style questions. One network and a chain of lettered parts with marks, each with a model answer and a mark scheme
// (specs/flow-exam-questions.md). Each question is a RECIPE: an ordered list of slots, each slot a pool of parts from the parts library
// (flowParts.ts). `composeFlowExam` samples a network, builds the slots in order and retries until every part suits the network, so the numbers
// all come from the same solver as the skills tabs and a mark scheme can never disagree with the working.
//   examCut    — value of a named cut · write down a cut of a given value · deduce the bound on the maximum flow (4 marks)
//   examFlow   — one or two missing flows by flow in = flow out · prove the maximum flow is at most V with a cut (5–6 marks)
//   examSuper  — list sources and sinks · add a supersource / supersink · value of a cut · the bound (6 marks)
//   A-level: examAug (potentials → augmentation → prove → critique), examAugSuper (add S/T → …), examLower (lower capacities, claims, upgrades)
// ════════════════════════════════════════════════════════════════════════════

import { flowValue, peelMissing, type Flow, type FlowMode, type FlowNet, type FlowProblemData, type FlowViewState } from "./flow";
import { generateFlowProblem } from "./flowGenerate";
import { CONTEXTS, PARTS, interestingMinCut, pickOne, prepLower, runOf, shuf, type PartCtx } from "./flowParts";
import type { DecisionProblem, ExamPart } from "./types";

// AS: examCut, examFlow, examSuper. A-level: examAug (potentials → augmentation → prove → critique), examAugSuper (add S/T → …), examLower (lower capacities, claims, upgrades)
export type ExamChain = "examCut" | "examFlow" | "examSuper" | "examTable" | "examAug" | "examAugSuper" | "examLower" | "examForced";
export const EXAM_CHAINS: ExamChain[] = ["examCut", "examFlow", "examSuper", "examTable"];
export const EXAM_CHAINS_A: ExamChain[] = ["examAug", "examAugSuper", "examLower", "examForced"];

function build(
  data: FlowProblemData, base: DecisionProblem, intro: string, parts: ExamPart[], examView: FlowViewState,
): DecisionProblem {
  for (const p of parts) if (p.model.length === 0) p.onDiagram = true; // nothing to write out: the answer is the filled-in figure
  for (const p of parts) { // the part's job, so printing never has to read the wording
    if (p.onDiagram && /potential increase/.test(p.prompt)) p.role = "potentials";
    else if (/Use flow augmentation/.test(p.prompt)) p.role = "augment";
    else if (p.onDiagram && /^Add (a )?super/.test(p.prompt)) p.role = "superAdd";
  }
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


// ── Recipes ──────────────────────────────────────────────────────────────────
interface Slot { pool: string[]; optional?: boolean; when?: (cx: PartCtx) => boolean }
interface Recipe {
  attempts: number;
  mode: (o: ExamOptions) => FlowMode;
  base: (level: 1 | 2 | 3, mode: FlowMode) => DecisionProblem;
  /** checks on the sampled network before any part is built (and leaves facts for the parts) */
  accept?: (cx: PartCtx) => boolean;
  slots: Slot[];
  intro: (cx: PartCtx) => string;
  view: (cx: PartCtx) => FlowViewState;
  /** a question with TWO figures: the second network, its own checks, slots and picture (its parts are tagged Figure 2) */
  second?: {
    mode?: FlowMode;
    base: Recipe["base"];
    accept?: Recipe["accept"];
    slots: Slot[];
    intro: (cx: PartCtx) => string;
    view: (cx: PartCtx) => FlowViewState;
  };
}
const tpl = (level: 1 | 2 | 3) => (level === 1 ? 2 : 3);
const CAP_INTRO = (cx: PartCtx) => `The diagram shows a network of ${cx.thing}. The number on each arc is the greatest flow it can carry, in ${cx.U}.`;
const LOWER_INTRO = (cx: PartCtx) => `The diagram shows a network of ${cx.thing}. Each arc is labelled with its lower and upper capacity, in ${cx.U}.`;

const drawableCuts = (cx: PartCtx) => (cx.d.cutDrawable ?? []).every(Boolean);
const aug = (withSuper: boolean): Recipe => ({
  attempts: 800,
  mode: (o) => o.mode ?? "cap",
  base: (level, mode) => withSuper
    ? generateFlowProblem(tpl(level), "superST", mode, undefined, undefined, { course: "a", shape: level === 3 ? "both" : "mixed", big: level === 3 })
    : generateFlowProblem(tpl(level), "maxFlow", mode, undefined, undefined, { big: level === 3 }),
  accept: (cx) => {
    const run = runOf(cx);
    const k = run.augmentations.length;
    // three paths is the usual number in an exam (AQA 2022, 2024); the supersource networks and the smallest networks allow a path either way
    if (withSuper ? k < 2 || k > 4 : cx.level === 1 ? k < 2 || k > 3 : k !== 3) return false;
    const cut = interestingMinCut(cx.net, run.value, run.sSide);
    if (!cut) return false;
    cx.facts.cut = cut;
    return true;
  },
  slots: [
    { pool: [withSuper ? "superAddA" : "potentials"] }, { pool: ["augment"] }, { pool: ["proveMax"] }, { pool: withSuper ? ["claimPipe"] : ["claimPipe", "switchOff"] },
    { pool: ["restricted", "restrictionImpact"], optional: true, when: (cx) => cx.level === 3 && cx.mode === "cap" },
  ],
  intro: (cx) => `The diagram shows a network of ${cx.thing}. ${cx.mode === "minmax" ? "Each arc is labelled with its lower and upper capacity, in " : "The number on each arc is the greatest flow it can carry, in "}${cx.U}.`,
  view: (cx) => { const sp = cx.d.superST; return withSuper && sp ? { net: sp.question, labelPos: cx.d.labelPos, flow: { ...cx.d.flow } } : { flow: { ...cx.d.flow } }; },
});

const RECIPES: Record<ExamChain, Recipe> = {
  examCut: {
    attempts: 200, mode: () => "cap",
    base: (level) => generateFlowProblem(tpl(level), "cutValue", "cap", undefined, undefined, { course: "as", big: level === 3 }),
    slots: [{ pool: ["cutValue"] }, { pool: ["cutWrite"] }, { pool: ["boundTwo"] }],
    intro: CAP_INTRO, view: () => ({}),
  },
  examFlow: {
    attempts: 300, mode: () => "cap",
    base: (level) => generateFlowProblem(tpl(level), "missingFlow", "cap", undefined, undefined, { course: "as", big: level === 3 }),
    accept: (cx) => !!cx.d.missing && !!peelMissing(cx.net, cx.d.missing) && runOf(cx).value - flowValue(cx.net, cx.d.flow) >= 2,
    slots: [{ pool: ["missingFlows"] }, { pool: ["proveAtMost"] }],
    intro: (cx) => `${CAP_INTRO(cx)} A flow through the network is shown by the circled numbers; the flow in ${cx.d.missing!.length > 1 ? "two arcs is" : "one arc is"} missing and marked ?.`,
    view: (cx) => ({ flow: Object.fromEntries(cx.net.arcs.filter((a) => !cx.d.missing!.includes(a.id)).map((a) => [a.id, cx.d.flow[a.id]])) as Flow, unknown: cx.d.missing }),
  },
  examSuper: {
    attempts: 300, mode: () => "cap",
    base: (level) => generateFlowProblem(tpl(level), "superST", "cap", undefined, undefined, { course: "as", shape: level === 3 ? "both" : "mixed", big: level === 3 }),
    slots: [{ pool: ["listSS"] }, { pool: ["addSuper"] }, { pool: ["cutInNew"] }, { pool: ["boundNew"] }],
    intro: CAP_INTRO, view: (cx) => ({ net: cx.d.superST!.question, labelPos: cx.d.labelPos }),
  },
  examTable: {
    attempts: 300, mode: () => "cap",
    base: () => generateFlowProblem(1, "cutTable", "cap", undefined, undefined, { course: "as" }),
    accept: (cx) => !!cx.d.cuts && !!cx.d.cutsAll && drawableCuts(cx),
    slots: [{ pool: ["cutTable"] }, { pool: ["maxFlowReason"] }, { pool: ["drawFlow"] }],
    intro: CAP_INTRO, view: () => ({}),
  },
  examForced: {
    attempts: 300, mode: () => "minmax",
    base: (level) => generateFlowProblem(tpl(level), "maxFlow", "minmax", undefined, undefined, { big: level === 3 }),
    slots: [{ pool: ["forcedArc"] }, { pool: ["impossibleFlow"] }],
    intro: (cx) => `Figure 1 shows a system of ${cx.thing}. The lower and upper capacities of each pipe, in ${cx.U}, are shown on each arc.`,
    view: (cx) => ({ net: cx.facts.net2 as FlowNet, labelPos: cx.d.labelPos }),
    second: {
      base: (level) => generateFlowProblem(tpl(level), "maxFlow", "minmax", undefined, undefined, { big: level === 3 }),
      accept: (cx) => { const run = runOf(cx); const k = run.augmentations.length; if (k < 2 || k > 3) return false; const cut = interestingMinCut(cx.net, run.value, run.sSide); if (!cut) return false; cx.facts.cut = cut; return true; },
      slots: [{ pool: ["potentials"] }, { pool: ["augment"] }, { pool: ["proveMax"] }, { pool: ["claimPipe"], optional: true }],
      intro: (cx) => `Figure 2 shows a second system of ${cx.thing}, with a feasible flow of ${flowValue(cx.net, cx.d.flow)} ${cx.U} shown by the circled numbers.`,
      view: (cx) => ({ flow: { ...cx.d.flow } }),
    },
  },
  examAug: aug(false),
  examAugSuper: aug(true),
  examLower: {
    attempts: 400, mode: () => "minmax",
    base: (level) => generateFlowProblem(tpl(level), "cutValue", "minmax", undefined, undefined, { cuts: "backward", big: level === 3 }),
    accept: prepLower,
    slots: [{ pool: ["cutBack"] }, { pool: ["cutMeaning"] }, { pool: ["claimAboveCut", "claimFlowCut"] }, { pool: ["upgradeOne"] }],
    intro: LOWER_INTRO, view: () => ({}),
  },
};

/** build a recipe's slots in order on one network; false when a part does not suit it */
function fillSlots(slots: Slot[], cx: PartCtx): boolean {
  for (const slot of slots) {
    if (slot.when && !slot.when(cx)) continue;
    let got: ExamPart[] | null = null;
    for (const id of shuf(slot.pool)) { got = PARTS[id].build(cx); if (got) break; }
    if (!got) { if (slot.optional) continue; return false; }
    cx.built.push(...got);
    if (cx.facts.net2 && cx.net !== cx.facts.net2) cx.net = cx.facts.net2 as FlowNet; // a part that changed the network: the parts after it work on the changed one
  }
  return true;
}

/** Build one question from a recipe: sample a network, build each slot's part in order, retry until every part suits the network. */
export function composeFlowExam(r: Recipe, level: 1 | 2 | 3, mode: FlowMode, facts: Record<string, unknown> = {}): DecisionProblem {
  const context = pickOne(CONTEXTS);
  const ctxFor = (base: DecisionProblem, m: FlowMode, f: Record<string, unknown>): PartCtx => { const d = base.flow!; return { level, mode: m, base, d, net: d.net, U: context.unit, thing: context.thing, facts: { ...f }, built: [] }; };
  for (let attempt = 0; attempt < r.attempts; attempt++) {
    const base = r.base(level, mode);
    const cx = ctxFor(base, mode, facts);
    if (r.accept && !r.accept(cx)) continue;
    if (!fillSlots(r.slots, cx)) continue;
    let intro = r.intro(cx);
    if (r.second) {
      const sm = r.second.mode ?? mode;
      let cx2: PartCtx | null = null;
      for (let a2 = 0; a2 < 200 && !cx2; a2++) {
        const c2 = ctxFor(r.second.base(level, sm), sm, facts);
        if (r.second.accept && !r.second.accept(c2)) continue;
        if (fillSlots(r.second.slots, c2)) cx2 = c2;
      }
      if (!cx2) continue;
      // every picture of the second figure names ITS network (the views otherwise draw on the first figure's)
      const own = { net: cx2.d.net, labelPos: cx2.d.labelPos };
      const fig = { label: "Figure 2", view: { ...own, ...r.second.view(cx2) } as unknown };
      cx2.built.forEach((p) => {
        p.figure = fig;
        if (p.view) p.view = { ...own, ...(p.view as object) };
        if (p.stepView?.flowView) p.stepView = { ...p.stepView, flowView: { ...own, ...p.stepView.flowView } };
      });
      cx.built.push(...cx2.built);
      intro = `${intro} ${r.second.intro(cx2)}`;
    }
    cx.built.forEach((p, i) => { p.label = `(${"abcdefghij"[i]})`; });
    return build({ ...cx.d, mode }, base, intro, cx.built, r.view(cx));
  }
  throw new Error("flow exam: no suitable question found");
}

// ── Explain and justify: one idea at a time, as a one-part question ──────────────────────────────────────────────────
const MODE_INTRO = (cx: PartCtx) => (cx.mode === "minmax" ? LOWER_INTRO(cx) : CAP_INTRO(cx));
const ideaView = (cx: PartCtx): FlowViewState => { const sp = cx.d.superST; return sp ? { net: sp.question, labelPos: cx.d.labelPos } : cx.facts.net2 ? { net: cx.facts.net2 as never, labelPos: cx.d.labelPos } : {}; };
const maxBase = (mode: FlowMode) => (level: 1 | 2 | 3) => generateFlowProblem(tpl(level), "maxFlow", mode, undefined, undefined, { big: level === 3 });
const minCutFact = (cx: PartCtx) => { const run = runOf(cx); const cut = interestingMinCut(cx.net, run.value, run.sSide); if (!cut) return false; cx.facts.cut = cut; return run.augmentations.length >= 1; };
const idea = (part: string, mode: FlowMode, base: Recipe["base"], accept?: Recipe["accept"]): Recipe => ({
  attempts: 600, mode: () => mode, base, accept, slots: [{ pool: [part] }], intro: MODE_INTRO, view: ideaView,
});
/** the ideas Explain and justify offers: a short question on one reasoning idea, built from the same parts as the exam questions */
export const FLOW_IDEAS: Array<{ key: string; label: string; courses: Array<"as" | "a">; recipe: Recipe; /** only in the earlier specification: off by default, marked * */ legacy?: boolean }> = [
  { key: "deduce", label: "What a cut tells you", courses: ["as", "a"], recipe: idea("deduceCut", "cap", (l, m) => generateFlowProblem(tpl(l), "cutValue", m ?? "cap", undefined, undefined, { course: "as", big: l === 3 })) },
  { key: "flowCut", label: "A flow and a cut together", courses: ["as", "a"], recipe: idea("flowCutCompare", "cap", maxBase("cap"), (cx) => runOf(cx).augmentations.length >= 1) },
  { key: "superWords", label: "Supersource / supersink in words", courses: ["as", "a"], recipe: idea("superWords", "cap", (l) => generateFlowProblem(tpl(l), "superST", "cap", undefined, undefined, { course: "a", shape: l === 3 ? "both" : "mixed", big: l === 3 })) },
  { key: "claimMax", label: "Is this the maximum flow?", courses: ["a"], recipe: idea("claimFlowCut", "cap", maxBase("cap"), minCutFact) },
  { key: "capacity", label: "Increasing a pipe", courses: ["a"], recipe: idea("claimPipe", "cap", maxBase("cap"), minCutFact) },
  { key: "upgrade", label: "Which pipe to upgrade", courses: ["a"], recipe: idea("upgradeOne", "minmax", (l) => generateFlowProblem(tpl(l), "cutValue", "minmax", undefined, undefined, { cuts: "backward", big: l === 3 }), prepLower) },
  { key: "pipeOff", label: "A pipe switched off", courses: ["a"], recipe: idea("switchOff", "cap", maxBase("cap")) },
  { key: "restriction", label: "A restriction at a vertex", courses: ["a"], recipe: idea("restrictionImpact", "cap", maxBase("cap")) },
  { key: "forced", label: "Forced arcs (min and max)", courses: ["a"], recipe: idea("forcedArc", "minmax", maxBase("minmax")) },
  { key: "impossible", label: "An impossible flow (min and max)", courses: ["a"], recipe: idea("impossibleFlow", "minmax", maxBase("minmax")) },
  { key: "routeMax", label: "Maximum flow along routes", courses: ["as", "a"], legacy: true, recipe: idea("routeMax", "cap", maxBase("cap")) },
  { key: "showThat", label: "Show that a cut has a value", courses: ["as", "a"], legacy: true, recipe: idea("cutShowThat", "cap", (l, m) => generateFlowProblem(tpl(l), "cutValue", m ?? "cap", undefined, undefined, { course: "as", big: l === 3 })) },
  { key: "blocked", label: "A section blocked", courses: ["a"], legacy: true, recipe: idea("blockedMax", "cap", maxBase("cap")) },
  { key: "newArc", label: "A new pipe", courses: ["a"], legacy: true, recipe: idea("newArc", "cap", maxBase("cap")) },
  { key: "capacityIncrease", label: "Two pipes made bigger", courses: ["a"], legacy: true, recipe: idea("capacityIncrease", "cap", maxBase("cap")) },
  { key: "infeasible", label: "No feasible flow (min and max)", courses: ["a"], legacy: true, recipe: idea("infeasibleVertex", "minmax", maxBase("minmax")) },
];
/** one short question on one idea (chosen at random from `ideas`, default every idea the course offers) */
export function generateFlowReason(level: 1 | 2 | 3, ideas: string[], course: "as" | "a"): DecisionProblem {
  const offered = FLOW_IDEAS.filter((i) => i.courses.includes(course));
  const chosen = offered.filter((i) => ideas.includes(i.key));
  const it = pickOne(chosen.length ? chosen : offered.filter((i) => !i.legacy));
  const p = composeFlowExam(it.recipe, level, it.recipe.mode({}), { as: course === "as" });
  return course === "a" ? { ...p, flow: { ...p.flow!, course: undefined } } : p;
}

export interface ExamOptions { course?: "as" | "a"; mode?: FlowMode }

/** One exam-style question. `chain` picks the style; "any" picks one at random from the course's styles. Levels are the network size (1 = 6–7 vertices, 2–3 = 8). */
export function generateFlowExam(level: 1 | 2 | 3, chain: ExamChain | "any" = "any", opts: ExamOptions = {}): DecisionProblem {
  const a = opts.course === "a";
  const c: ExamChain = chain === "any" ? pickOne(a ? EXAM_CHAINS_A : EXAM_CHAINS) : chain;
  const r = RECIPES[c];
  let p = composeFlowExam(r, level, r.mode(opts));
  if (a) p = { ...p, flow: { ...p.flow!, course: undefined } };
  return p;
}
