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

import { flowValue, peelMissing, type Flow, type FlowMode, type FlowProblemData, type FlowViewState } from "./flow";
import { generateFlowProblem } from "./flowGenerate";
import { CONTEXTS, PARTS, interestingMinCut, pickOne, prepLower, runOf, shuf, type PartCtx } from "./flowParts";
import type { DecisionProblem, ExamPart } from "./types";

// AS: examCut, examFlow, examSuper. A-level: examAug (potentials → augmentation → prove → critique), examAugSuper (add S/T → …), examLower (lower capacities, claims, upgrades)
export type ExamChain = "examCut" | "examFlow" | "examSuper" | "examAug" | "examAugSuper" | "examLower";
export const EXAM_CHAINS: ExamChain[] = ["examCut", "examFlow", "examSuper"];
export const EXAM_CHAINS_A: ExamChain[] = ["examAug", "examAugSuper", "examLower"];

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
}
const tpl = (level: 1 | 2 | 3) => (level === 1 ? 2 : 3);
const CAP_INTRO = (cx: PartCtx) => `The diagram shows a network of ${cx.thing}. The number on each arc is the greatest flow it can carry, in ${cx.U}.`;
const LOWER_INTRO = (cx: PartCtx) => `The diagram shows a network of ${cx.thing}. Each arc is labelled with its lower and upper capacity, in ${cx.U}.`;

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
    { pool: [withSuper ? "superAddA" : "potentials"] }, { pool: ["augment"] }, { pool: ["proveMax"] }, { pool: ["claimPipe"] },
    { pool: ["restricted"], optional: true, when: (cx) => cx.level === 3 && cx.mode === "cap" },
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
  examAug: aug(false),
  examAugSuper: aug(true),
  examLower: {
    attempts: 400, mode: () => "minmax",
    base: (level) => generateFlowProblem(tpl(level), "cutValue", "minmax", undefined, undefined, { cuts: "backward", big: level === 3 }),
    accept: prepLower,
    slots: [{ pool: ["cutBack"] }, { pool: ["cutMeaning"] }, { pool: ["claimAboveCut"] }, { pool: ["upgradeOne"] }],
    intro: LOWER_INTRO, view: () => ({}),
  },
};

/** Build one question from a recipe: sample a network, build each slot's part in order, retry until every part suits the network. */
export function composeFlowExam(r: Recipe, level: 1 | 2 | 3, mode: FlowMode): DecisionProblem {
  const context = pickOne(CONTEXTS);
  for (let attempt = 0; attempt < r.attempts; attempt++) {
    const base = r.base(level, mode);
    const d = base.flow!;
    const cx: PartCtx = { level, mode, base, d, net: d.net, U: context.unit, thing: context.thing, facts: {}, built: [] };
    if (r.accept && !r.accept(cx)) continue;
    let ok = true;
    for (const slot of r.slots) {
      if (slot.when && !slot.when(cx)) continue;
      let got: ExamPart[] | null = null;
      for (const id of shuf(slot.pool)) { got = PARTS[id].build(cx); if (got) break; }
      if (!got) { if (slot.optional) continue; ok = false; break; }
      cx.built.push(...got);
    }
    if (!ok) continue;
    cx.built.forEach((p, i) => { p.label = `(${"abcdefghij"[i]})`; });
    return build({ ...d, mode }, base, r.intro(cx), cx.built, r.view(cx));
  }
  throw new Error("flow exam: no suitable question found");
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
