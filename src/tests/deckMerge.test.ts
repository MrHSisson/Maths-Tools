import { describe, expect, it } from "vitest";
import { isEdited, mergeRebuild, slideHash, stampBuilt } from "../decks/merge";
import type { DeckDef, Slide } from "../decks/types";

const slide = (id: string, text: string): Slide => ({ id, family: "teach", title: id, els: [{ id: `${id}-t`, kind: "text", x: 0, y: 0, w: 100, h: 50, text, size: 40 }] });
const deck = (...slides: Slide[]): DeckDef => ({ id: "d", title: "d", summary: "", slides });

describe("rebuilding a deck keeps what was edited in the editor", () => {
  it("stamps slides and notices an edit", () => {
    const built = stampBuilt(deck(slide("a", "one")));
    expect(isEdited(built.slides[0])).toBe(false);
    const edited = { ...built.slides[0], els: [{ ...built.slides[0].els[0], text: "changed" } as never] };
    expect(isEdited(edited)).toBe(true);
    expect(slideHash(built.slides[0])).toBe(slideHash({ ...built.slides[0], built: "other" }));   // the stamp is not part of the hash
  });
  it("replaces untouched slides, keeps edited ones, keeps slides added in the editor where they were", () => {
    const first = stampBuilt(deck(slide("a", "one"), slide("b", "two"), slide("c", "three")));
    const edited = { ...first.slides[1], els: [{ ...first.slides[1].els[0], text: "Harry's words" } as never] };
    const mine = slide("mine", "added in the editor");
    const existing = { ...first, slides: [first.slides[0], edited, mine, first.slides[2]] };
    const r = mergeRebuild(existing, stampBuilt(deck(slide("a", "one NEW"), slide("b", "two NEW"), slide("c", "three NEW"))));
    expect(r.deck.slides.map((s) => s.id)).toEqual(["a", "b", "mine", "c"]);
    expect((r.deck.slides[0].els[0] as { text: string }).text).toBe("one NEW");
    expect((r.deck.slides[1].els[0] as { text: string }).text).toBe("Harry's words");
    expect((r.deck.slides[3].els[0] as { text: string }).text).toBe("three NEW");
    expect(r.kept).toEqual(["b"]); expect(r.added).toEqual(["mine"]); expect(r.replaced).toBe(2);
  });
  it("drops a slide the script no longer builds if it was untouched, keeps it if it was edited", () => {
    const first = stampBuilt(deck(slide("a", "one"), slide("b", "two")));
    const r = mergeRebuild(first, stampBuilt(deck(slide("a", "one"))));
    expect(r.dropped).toEqual(["b"]);
    const edited = { ...first, slides: [first.slides[0], { ...first.slides[1], title: "renamed" }] };
    expect(mergeRebuild(edited, stampBuilt(deck(slide("a", "one")))).kept).toEqual(["b"]);
  });
  it("replaces everything for a deck from before slides were stamped", () => {
    const r = mergeRebuild(deck(slide("a", "old")), stampBuilt(deck(slide("a", "new"))));
    expect((r.deck.slides[0].els[0] as { text: string }).text).toBe("new");
  });
});
