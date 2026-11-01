import { describe, expect, it } from "vitest";
import { checkDeck } from "../../api/_decks";
import { isCuratedQuestion } from "../../api/_questions";
import { ESTIMATION_DEPTH } from "../tools/Number/EstimationDepth";
import { copyQuestion, editableDepthCopy, fromDepth, materializeDeck } from "../decks/questions";
import { normaliseDeck } from "../decks/normalise";
import type { CuratedQuestion, DeckDef } from "../decks/types";
const deckFor = (q: CuratedQuestion): DeckDef => ({ id: "art", title: "Art", summary: "", slides: [{ id: "s", title: "S", family: "depth", els: [{ id: "q", kind: "questions", x: 24, y: 24, w: 1552, h: 852, items: [q], presentation: "whiteboard-inverted" }] }] });
describe("Depth artwork persistence", () => {
  it("keeps original cast names, claims and the Depth marker in the portable question", async () => {
    for (const item of ESTIMATION_DEPTH) {
      const q = fromDepth("estimation", item);
      expect(q.depth).toEqual({ prompt: "", takeaway: "" });
      if (item.speakers) expect(q.format === "claims" && q.claims).toEqual(item.speakers.map((s) => ({ name: s.name, text: s.says.join("\n") })));
      const portable = await materializeDeck(deckFor(q), () => undefined);
      expect("deck" in checkDeck(JSON.parse(JSON.stringify(portable)))).toBe(true);
      expect(portable.slides[0].els[0]).toMatchObject({ presentation: "full", visualiser: false, items: [q] });
    }
  });
  it("restores only missing artwork metadata on older Depth copies and preserves all teacher edits", async () => {
    const q = fromDepth("estimation", ESTIMATION_DEPTH[0]); delete q.depth;
    q.question = ["My edited question"]; q.answer = ["My edited answer"]; q.explanation = ["My edited working"];
    if (q.format === "claims") q.claims[0] = { name: "Ruby", text: "My edited claim" };
    const original = structuredClone(q);
    const deck = await materializeDeck(deckFor(q), () => undefined);
    const el = deck.slides[0].els[0]; if (el.kind !== "questions") throw new Error();
    const restored = { ...el.items[0] }; delete restored.depth;
    expect(restored).toEqual(original); expect(q.depth).toBeUndefined();
    expect(el.items[0].depth).toEqual({ prompt: "", takeaway: "" });
  });
  it("retains custom Feathers text and gives duplicates independent artwork data", async () => {
    const q = fromDepth("estimation", ESTIMATION_DEPTH[0]);
    q.depth = { prompt: "My nudge", takeaway: "My takeaway" };
    const copy = copyQuestion(q); copy.depth!.prompt = "Different nudge";
    expect(q.depth.prompt).toBe("My nudge");
    const el = (await materializeDeck(deckFor(q), () => undefined)).slides[0].els[0];
    expect(el.kind === "questions" && el.items[0].depth).toEqual(q.depth);
  });
  it("a Depth copy changed in the deck is kept; an unchanged copy still becomes a bank reference again", () => {
    const edited = editableDepthCopy("estimation", ESTIMATION_DEPTH[0]); edited.question = ["My tweak"];
    expect(edited.source).toMatchObject({ kind: "depth", edited: true });
    expect(isCuratedQuestion(edited)).toBe(true);
    expect(isCuratedQuestion({ ...edited, source: { ...edited.source!, edited: "yes" } })).toBe(false);
    const keep = normaliseDeck(deckFor(edited)).slides[0].els[0];
    expect(keep.kind === "questions" && keep.items[0].question).toEqual(["My tweak"]);
    const plain = normaliseDeck(deckFor(fromDepth("estimation", ESTIMATION_DEPTH[0]))).slides[0].els[0];
    expect(plain).toMatchObject({ kind: "depth", tool: "estimation", item: ESTIMATION_DEPTH[0].id });
  });
  it("normalizes old Depth workspace settings without changing content or the input deck", async () => {
    const q = fromDepth("estimation", ESTIMATION_DEPTH[0]);
    const original = deckFor(q), before = JSON.stringify(original);
    const normalized = await materializeDeck(original, () => undefined);
    expect(normalized.slides[0].els[0]).toMatchObject({ presentation: "full", visualiser: false, items: [q] });
    expect(JSON.stringify(original)).toBe(before);
  });
  it("validates artwork text without weakening existing payload validation", () => {
    const q = fromDepth("estimation", ESTIMATION_DEPTH[0]);
    expect(isCuratedQuestion({ ...q, depth: { prompt: 123, takeaway: "X" } })).toBe(false);
    expect(isCuratedQuestion({ ...q, depth: { prompt: "X" } })).toBe(false);
    expect(isCuratedQuestion(q)).toBe(true);
  });
});
