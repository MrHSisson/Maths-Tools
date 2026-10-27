import { describe, expect, it } from "vitest";
import { isCuratedQuestion } from "../../api/_questions";
import { checkDeck, checkQuestion } from "../../api/_decks";
import { BANK, DECKS } from "../decks";
import { copyQuestion, fromBank, fromDepth, materializeDeck, newQuestion, readyProblems } from "../decks/questions";
import { ESTIMATION_DEPTH } from "../tools/Number/EstimationDepth";
import { loadDepthItems } from "../decks/generators";
import type { CuratedQuestion, DeckDef } from "../decks/types";

describe("deck-owned question content", () => {
  it("materializes without changing the source; a deck copy never mutates the bank", async () => {
    const original = JSON.stringify(DECKS[0]);
    const prepared = await materializeDeck(DECKS[0], (id) => BANK.find((q) => q.id === id));
    expect(JSON.stringify(DECKS[0])).toBe(original);
    const el = prepared.slides.flatMap((s) => s.els).find((e) => e.kind === "questions")!;
    if (el.kind !== "questions") throw new Error();
    expect(el.size).toBe(46); // legacy 120 was question text, not the whole activity font
    const source = BANK.find((q) => q.id === el.items[0].source?.id)!;
    el.items[0].question[0] = "Edited in this deck";
    expect(fromBank(source).question[0]).not.toBe("Edited in this deck");
    expect(prepared.slides.flatMap((s) => s.els).some((e) => e.kind === "practice" || e.kind === "depth")).toBe(false);
    expect(isCuratedQuestion(el.items[0])).toBe(true);
  });
  it("exports complete content and imports with an empty library", async () => {
    const deck = await materializeDeck(DECKS[0], (id) => BANK.find((q) => q.id === id));
    const imported = await materializeDeck(JSON.parse(JSON.stringify(deck)) as DeckDef, () => undefined);
    expect(imported).toEqual(deck);
    expect("deck" in checkDeck(imported)).toBe(true);
  });
  it("keeps unresolved references visible instead of silently dropping questions", async () => {
    const d: DeckDef = { id: "test", title: "Test", summary: "", slides: [{ id: "s", title: "Missing", family: "practice", els: [{ id: "e", kind: "practice", tool: "estimation", x: 0, y: 0, w: 100, h: 100, bank: ["not-found"] }] }] };
    const materialized = await materializeDeck(d, () => undefined);
    const el = materialized.slides[0].els[0];
    expect(el.kind === "questions" && el.items[0].missing).toBe("not-found");
    expect(el.kind === "questions" && el.items.length).toBe(1);
  });
  it("library reuse makes an independent copy with provenance", () => {
    const original = fromBank(BANK[0]); const copy = copyQuestion(original);
    expect(copy.id).not.toBe(original.id);
    expect(copy.source?.id).toBe(BANK[0].id);
    copy.expectedErrors[0].response = "Different";
    expect(original.expectedErrors[0].response).not.toBe("Different");
  });
});
describe("diagnostic adaptation", () => {
  it("preserves claims, choices, error location, reasoning and purpose", () => {
    for (const item of ESTIMATION_DEPTH) {
      const q = fromDepth("estimation", item);
      expect(isCuratedQuestion(q), item.id).toBe(true);
      expect(q.purpose).toBe(item.purpose);
      expect([...q.answer, ...q.explanation]).toEqual(item.answer);
      if (item.working) expect(q.format === "error" && q.wrongLine).toBe(item.working.wrongLine);
      if (item.speakers) expect(q.format).toBe("claims");
    }
  });
  it("keeps all misconception labels when a diagnostic exposes several errors", () => {
    const q = fromDepth("estimation", ESTIMATION_DEPTH[0]);
    expect([q.misconception?.id, ...q.relatedMisconceptions!.map((m) => m.id)]).toEqual(["estimation-round-truncate", "estimation-calc-zeros"]);
  });
  it("serializes a custom visual as a source reference, never a render function", async () => {
    const item = (await loadDepthItems("rounding")).find((i) => i.visual?.type === "custom")!;
    expect(item).toBeTruthy();
    const copy = fromDepth("rounding", item);
    expect(copy.visual).toEqual({ tool: "rounding", item: item.id });
    expect(JSON.parse(JSON.stringify(copy))).toEqual(copy);
  });
});
describe("question validation", () => {
  const base = (): CuratedQuestion => ({ ...newQuestion(), title: "Test", question: ["Explain $2+2$."], answer: ["$4$"], purpose: "explain" });
  it("accepts all four formats and draft content through the sharing API", () => {
    const q = base();
    const forms: CuratedQuestion[] = [q, { ...q, format: "choice", options: [{ text: "$4$", correct: true, reasoning: "" }, { text: "$5$", correct: false, reasoning: "Miscounted" }] }, { ...q, format: "claims", claims: [{ name: "A", text: "$2+2=4$" }], options: [] }, { ...q, format: "error", lines: ["2+2=5"], wrongLine: 0 }];
    for (const form of forms) { expect(isCuratedQuestion(form)).toBe(true); expect(checkQuestion(form)?.id).toBe(q.id); }
  });
  it("keeps incomplete diagnostic drafts without claiming they are ready", () => {
    const draft = { ...base(), format: "choice" as const, options: [] };
    expect(isCuratedQuestion(draft)).toBe(true);
    expect(readyProblems(draft)).toContain("Add at least two choices and mark the correct answer(s).");
    expect(isCuratedQuestion({ ...draft, status: "ready" })).toBe(false);
    const diagnostic = fromDepth("estimation", ESTIMATION_DEPTH[0]);
    expect(diagnostic.status).toBe(readyProblems(diagnostic).length ? "draft" : "ready");
  });
  it("rejects corrupt nested question payloads while accepting legacy questions", () => {
    expect(checkQuestion({ id: "old", latex: "1+1", answer: "2", working: [] })).toBeTruthy();
    for (const malformed of [{ ...base(), question: 123 }, { ...base(), status: "ready", format: "choice", options: [] }, { ...base(), format: "error", lines: ["2+2=5"], wrongLine: 9 }, { ...base(), visual: { render: "function" } }]) {
      expect(checkQuestion(malformed)).toBeNull();
      expect("error" in checkDeck({ id: "test", title: "Test", slides: [{ els: [{ kind: "questions", items: [malformed] }] }] })).toBe(true);
    }
    expect(checkQuestion({ ...base(), rationale: "x".repeat(20001) })).toBeNull();
  });
  it("does not call an unannotated practice draft ready", () => {
    expect(readyProblems(newQuestion())).toContain("Add an expected wrong response and its reasoning.");
    for (const q of BANK.map(fromBank)) expect(readyProblems(q), q.id).toEqual([]);
  });
  it("pilot wrong responses differ from the correct answer, including truncation and numerator rounding", () => {
    for (const item of BANK) expect(item.teaching!.expectedErrors[0].response.replace(/\$/g, ""), item.id).not.toBe(item.answer);
    expect(BANK.find((q) => q.id === "est-06")!.answer).toBe("400");
    expect(BANK.find((q) => q.id === "est-14")!.answer).toBe("5.5");
  });
});
