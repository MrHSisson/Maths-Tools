import { describe, expect, it } from "vitest";
import { isQuestionBrief } from "../../api/_questionBrief";
import { checkDeck } from "../../api/_decks";
import { ESTIMATION_DECK } from "../decks/estimation";
import { briefText, deckBriefsText, legacyBrief, withBriefs } from "../decks/questionBrief";
import { copyQuestion, materializeDeck, newQuestion, readyProblems } from "../decks/questions";
import { practiceSlide } from "../decks/layouts";
import { BANK } from "../decks";
import { generateFrom } from "../decks/generators";
import { authoredEstimationWorking } from "../shared/estimationWorking";
import type { DeckDef } from "../decks/types";

const normalize = (s: string) => s.replace(/\{,\}/g, "").replace(/\s/g, "");
describe("slide-owned skill authoring", () => {
  it("starts a general practice question without demanding misconception metadata", () => {
    const q = { ...newQuestion(), title: "Question 1", question: ["Estimate $48 \\times 31$."], answer: ["$1500$"] };
    expect(readyProblems(q)).toEqual([]);
    expect(readyProblems(newQuestion())).toContain("Add an answer.");
  });
  it("continues resolving old practice-bank references without changing their source", async () => {
    const legacy: DeckDef = { id: "legacy", title: "Legacy", summary: "", slides: [practiceSlide("legacy-slide")] };
    const deck = await materializeDeck(legacy, (id) => BANK.find((q) => q.id === id));
    const activity = deck.slides[0].els[0];
    expect(activity.kind).toBe("questions");
    expect(activity.kind === "questions" && activity.items.length).toBe(5);
    expect(legacy.slides[0].els[0].kind).toBe("practice");
  });
  it("duplicates a personally authored question without inventing library provenance", () => {
    const original = { ...newQuestion(), title: "My question", question: ["Estimate $28 \\times 42$."] };
    const copy = copyQuestion(original);
    expect(copy.id).not.toBe(original.id);
    expect(copy.source).toBeUndefined();
    copy.question[0] = "Edited duplicate";
    expect(original.question[0]).toContain("28");
  });
  it("keeps one optional brief per slide through portable saving, and folds older notes into it", async () => {
    const slide = { ...ESTIMATION_DECK.slides[8], brief: "Whole-number products; vary zero factors" };
    const deck: DeckDef = { ...ESTIMATION_DECK, slides: [slide, ESTIMATION_DECK.slides[0]] };
    const copy = await materializeDeck(JSON.parse(JSON.stringify(deck)), () => undefined);
    expect(copy.slides[0].brief).toBe(slide.brief);
    expect(copy.slides[1].brief).toBeUndefined();
    expect("deck" in checkDeck(copy)).toBe(true);
    const text = briefText(slide, `${deck.title} / ${slide.id}`, "estimation");
    expect(text).toContain(slide.id); expect(text).toContain("Brief: Whole-number products");
    expect(deckBriefsText(deck)).toContain("1. Estimate products: retain zero factors: Whole-number products");
    // An older deck: four teaching-note boxes and the brief form become the one note; nothing else changes.
    const intent = { purpose: "Expose lost place value.", questionFocus: "Five whole-number products.", evidence: "Explains 1500", next: "Decimals" };
    const questionBrief = { count: 5, exclude: "Decimals", progression: "Increase the zeros", examples: "48 × 31", solution: { tool: "estimation", sub: "", level: "level1" as const } };
    expect(isQuestionBrief(questionBrief)).toBe(true);
    expect("deck" in checkDeck({ ...deck, slides: [{ ...slide, brief: undefined, intent, questionBrief }] })).toBe(true);
    expect(legacyBrief({ intent, questionBrief })).toBe("Expose lost place value. Five whole-number products. Avoid: Decimals Increase the zeros");
    const folded = withBriefs({ ...deck, slides: [{ ...slide, brief: undefined, intent, questionBrief }, { ...ESTIMATION_DECK.slides[0], intent: { purpose: "", questionFocus: "", evidence: "", next: "" } }] });
    expect(folded.slides[0]).toMatchObject({ brief: legacyBrief({ intent, questionBrief }) });
    expect(folded.slides[0].intent).toBeUndefined(); expect(folded.slides[0].questionBrief).toBeUndefined();
    expect("brief" in folded.slides[1]).toBe(false);
    expect(withBriefs(ESTIMATION_DECK)).toBe(ESTIMATION_DECK);
  });
  it("defines practice and exit questions with each slide, without bank lookups", async () => {
    const deck = await materializeDeck(ESTIMATION_DECK, () => { throw new Error("Bank lookup is forbidden for this built deck"); });
    for (const slide of deck.slides) for (const el of slide.els) {
      expect(el.kind).not.toBe("practice");
      if (el.kind !== "questions" && el.kind !== "grid") continue;
      const items = el.items ?? [];
      expect(items.length).toBeGreaterThan(0);
      if (el.kind === "grid") expect(el.bank).toEqual([]);
      if (slide.family === "practice") expect(items.length).toBeGreaterThanOrEqual(5);
    }
  });
});
describe("canonical Estimation solutions", () => {
  for (const level of ["level1", "level2"] as const) it(`${level}: fixed authoring matches actual generator step labels, boundaries and maths`, async () => {
    for (let seed = 1; seed <= 20; seed++) {
      const generated = await generateFrom("estimation", { sub: "estimation", level }, seed);
      if (!generated || generated.kind !== "simple") throw new Error("Missing generator");
      const fixed = authoredEstimationWorking(generated.displayLatex!);
      expect(fixed.map((s) => s.label)).toEqual(generated.working.map((s) => s.label));
      expect(fixed.map((s) => normalize(s.latex))).toEqual(generated.working.map((s) => normalize(s.latex)));
    }
  });
  it("fraction examples preserve the generator’s Original, Round, Numerator, Calculate sequence", async () => {
    let checked = 0;
    for (let seed = 1; seed <= 100 && checked < 10; seed++) {
      const q = await generateFrom("estimation", { sub: "estimation", level: "level3", multiSelect: { fracbar: true, fracterm: false } }, seed);
      if (!q || q.kind !== "simple" || !/^\\dfrac\{[\d.]+\s*(?:\+|-|\\times|\\div)\s*[\d.]+\}\{[\d.]+\}$/.test(q.displayLatex!)) continue;
      const fixed = authoredEstimationWorking(q.displayLatex!);
      expect(fixed.map((s) => s.label)).toEqual(q.working.map((s) => s.label));
      expect(fixed.map((s) => normalize(s.latex))).toEqual(q.working.map((s) => normalize(s.latex)));
      checked++;
    }
    expect(checked).toBe(10);
  });
  it("all fixed pilot examples include the Original reveal and finish at the recorded answer", () => {
    for (const slide of ESTIMATION_DECK.slides) for (const el of slide.els) if (el.kind === "questions" || el.kind === "grid") for (const q of el.items ?? []) {
      expect(q.explanation[0]).toMatch(/^Original:/);
      const result = q.explanation[q.explanation.length - 1].match(/= (.+)\$$/)![1];
      expect(normalize(result)).toBe(normalize(q.answer[0].replace(/^\$\\approx /, "").replace(/\$$/, "")));
    }
  });
});
