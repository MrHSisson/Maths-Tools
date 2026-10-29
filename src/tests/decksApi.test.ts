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
  it("preserves a slide teaching brief and rejects malformed fields", () => {
    const intent = { purpose: "Check transfer", questionFocus: "Whole-number multiplication only", evidence: "Keeps zero factors", next: "Move to decimals" };
    const deck = { id: "thread", title: "Thread", slides: [{ id: "s", els: [], intent }] };
    const checked = checkDeck(deck);
    expect("body" in checked && JSON.parse(checked.body).slides[0].intent).toEqual(intent);
    expect("error" in checkDeck({ ...deck, slides: [{ els: [], intent: { ...intent, purpose: {} } }] })).toBe(true);
    expect("error" in checkDeck({ ...deck, slides: [{ els: [], intent: { ...intent, next: "x".repeat(4001) } }] })).toBe(true);
  });
  it("preserves a slide's one-note brief and rejects a malformed one", () => {
    const deck = { id: "brief", title: "Brief", slides: [{ id: "s", els: [], brief: "Whole-number products with zero factors" }] };
    const checked = checkDeck(deck);
    expect("body" in checked && JSON.parse(checked.body).slides[0].brief).toBe("Whole-number products with zero factors");
    for (const brief of [{}, 5, "x".repeat(4001)]) expect("error" in checkDeck({ ...deck, slides: [{ els: [], brief }] })).toBe(true);
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
