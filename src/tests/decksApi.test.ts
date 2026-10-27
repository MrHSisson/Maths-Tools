// The pure half of /api/decks (api/_decks.ts): what a device may send, and the index of shared decks.
import { describe, it, expect } from "vitest";
import { MAX_DECK_BYTES, checkDeck, checkQuestion, emptyIndex, indexWith, indexWithout, validId } from "../../api/_decks";

describe("shared decks API", () => {
  it("accepts a deck with an id, a title and slides; refuses anything else", () => {
    expect("deck" in checkDeck({ id: "my-abc", title: "T", slides: [] })).toBe(true);
    for (const bad of [null, {}, { id: "Bad Id", title: "T", slides: [] }, { id: "ok", slides: [] }, { id: "ok", title: "T" }]) expect("error" in checkDeck(bad)).toBe(true);
    const huge = checkDeck({ id: "big", title: "T", slides: [{ img: "x".repeat(MAX_DECK_BYTES) }] });
    expect("error" in huge && huge.status).toBe(413);
  });
  it("keeps the deck's own saved time in the index, and removes an entry", () => {
    const i = indexWith(emptyIndex(), { id: "a", title: "A", summary: "", slides: [1, 2], updatedAt: "2026-10-27T10:00:00Z" }, "Harry", "2026-10-27T10:00:05Z");
    expect(i.decks.a).toMatchObject({ title: "A", slides: 2, updatedAt: "2026-10-27T10:00:00Z", updatedBy: "Harry" });
    expect(indexWith(emptyIndex(), { id: "b", title: "B", summary: "", slides: [] }, "", "now").decks.b.updatedAt).toBe("now");
    expect(indexWithout(i, "a").decks).toEqual({});
  });
  it("checks ids and questions", () => {
    expect([validId("est-01"), validId("my-q-1"), validId("../x"), validId("")]).toEqual([true, true, false, false]);
    expect(checkQuestion({ id: "my-q-1", latex: "1+1", answer: "2", working: [] })?.id).toBe("my-q-1");
    expect(checkQuestion({ id: "my-q-1", latex: "1+1", answer: "2" })).toBeNull();
  });
});
