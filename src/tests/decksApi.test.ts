// The pure half of /api/decks (api/_decks.ts): what a device may send, and the index of shared decks.
import { describe, it, expect } from "vitest";
import { MAX_DECK_BYTES, checkDeck, checkQuestion, emptyIndex, emptyPublished, indexWith, indexWithout, publishedBody, publishedPath, publishedWith, publishedWithout, validId } from "../../api/_decks";

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
  it("publishing keeps a frozen, stamped copy and lists it; unpublishing removes it", () => {
    const checked = checkDeck({ id: "est", title: "Estimation", summary: "S", slides: [{ id: "a", els: [] }, { id: "b", els: [] }], tool: "estimation" });
    if (!("body" in checked)) throw new Error("deck refused");
    const body = JSON.parse(publishedBody(checked.body, "2026-10-29T12:00:00Z"));
    expect(body).toMatchObject({ id: "est", tool: "estimation", publishedAt: "2026-10-29T12:00:00Z" });   // the whole deck, plus when
    expect(body.slides).toHaveLength(2);
    expect(publishedPath("est")).toBe("published/est.json");
    const index = publishedWith(emptyPublished(), checked.deck, "2026-10-29T12:00:00Z");
    expect(index.decks.est).toEqual({ title: "Estimation", summary: "S", slides: 2, publishedAt: "2026-10-29T12:00:00Z", preview: { id: "a", els: [] } });   // the first slide, for the card
    const huge = publishedWith(emptyPublished(), { id: "big", title: "B", summary: "", slides: [{ id: "a", els: [{ src: "x".repeat(40_000) }] }] }, "now");
    expect(huge.decks.big.preview).toBeUndefined();     // a heavy first slide stays out of the listing
    expect(publishedWith(index, { ...checked.deck, title: "Estimation 2" }, "later").decks.est).toMatchObject({ title: "Estimation 2", publishedAt: "later" });
    expect(publishedWithout(index, "est").decks).toEqual({});
  });
});
