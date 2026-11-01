import { describe, expect, it } from "vitest";
import { mergeDecks } from "../../api/_deckMerge";
import ratios from "../decks/data/manipulating-ratios.json";

type Obj = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const el = (id: string, extra: Obj = {}): Obj => ({ id, kind: "text", x: 0, y: 0, w: 100, h: 50, text: id, size: 40, ...extra });
const slide = (id: string, els: Obj[] = [el(`${id}-1`)], extra: Obj = {}): Obj => ({ id, family: "teach", title: id, els, ...extra });
const deck = (slides: Obj[], extra: Obj = {}): Obj => ({ id: "d", title: "Deck", summary: "", slides, ...extra });
const ids = (d: Obj) => d.slides.map((s: Obj) => s.id);
const get = (d: Obj, s: string, e: string) => d.slides.find((x: Obj) => x.id === s).els.find((x: Obj) => x.id === e);

describe("merging two edits of one deck", () => {
  const base = deck([slide("a"), slide("b"), slide("c")]);

  it("keeps edits to different slides from both sides", () => {
    const mine = structuredClone(base); get(mine, "a", "a-1").text = "mine";
    const his = structuredClone(base); get(his, "c", "c-1").text = "his";
    const r = mergeDecks(base, mine, his, "current");
    expect(get(r.deck, "a", "a-1").text).toBe("mine");
    expect(get(r.deck, "c", "c-1").text).toBe("his");
    expect(r.conflicts).toEqual([]);
    expect(r.merged).toBe(true);
  });

  it("keeps edits to different fields of the same element, and different elements of one slide", () => {
    const b = deck([slide("a", [el("x"), el("y")])]);
    const mine = structuredClone(b); get(mine, "a", "x").text = "new words"; get(mine, "a", "y").size = 60;
    const his = structuredClone(b); get(his, "a", "x").x = 300; get(his, "a", "y").text = "his words";
    const r = mergeDecks(b, mine, his, "current");
    expect(get(r.deck, "a", "x")).toMatchObject({ text: "new words", x: 300 });
    expect(get(r.deck, "a", "y")).toMatchObject({ size: 60, text: "his words" });
    expect(r.conflicts).toEqual([]);
  });

  it("when both change the same field, the winner's value stays and the conflict is reported", () => {
    const mine = structuredClone(base); get(mine, "b", "b-1").text = "mine";
    const his = structuredClone(base); get(his, "b", "b-1").text = "his";
    const harrysWin = mergeDecks(base, mine, his, "current");
    expect(get(harrysWin.deck, "b", "b-1").text).toBe("his");
    expect(harrysWin.conflicts).toEqual(["b/b-1.text"]);
    expect(get(mergeDecks(base, mine, his, "incoming").deck, "b", "b-1").text).toBe("mine");
  });

  it("an edit beats a delete; an untouched item is deleted", () => {
    const mine = deck([slide("a"), slide("c")]);                                    // deletes b
    const his = structuredClone(base); get(his, "b", "b-1").text = "edited";         // edits b
    expect(ids(mergeDecks(base, mine, his, "current").deck)).toEqual(["a", "b", "c"]);
    const untouched = structuredClone(base);
    expect(ids(mergeDecks(base, mine, untouched, "current").deck)).toEqual(["a", "c"]);
    const elDel = structuredClone(base); elDel.slides[0].els = [];
    const elEdit = structuredClone(base); get(elEdit, "a", "a-1").text = "edited";
    expect(get(mergeDecks(base, elDel, elEdit, "current").deck, "a", "a-1").text).toBe("edited");
  });

  it("keeps slides added on either side, placing them after the slide they followed", () => {
    const mine = deck([slide("a"), slide("m1"), slide("b"), slide("c")]);
    const his = deck([slide("a"), slide("b"), slide("h1"), slide("c"), slide("h2")]);
    expect(ids(mergeDecks(base, mine, his, "current").deck)).toEqual(["a", "m1", "b", "h1", "c", "h2"]);
    expect(ids(mergeDecks(base, mine, his, "incoming").deck)).toEqual(["a", "m1", "b", "h1", "c", "h2"]);
  });

  it("follows the winner's order when both reorder", () => {
    const mine = deck([slide("c"), slide("a"), slide("b")]);
    const his = deck([slide("b"), slide("c"), slide("a")]);
    expect(ids(mergeDecks(base, mine, his, "current").deck)).toEqual(["b", "c", "a"]);
    expect(ids(mergeDecks(base, mine, his, "incoming").deck)).toEqual(["c", "a", "b"]);
  });

  it("merges deck-level fields and slide-level fields", () => {
    const mine = structuredClone(base); mine.title = "New title"; mine.slides[0].brief = "A brief that is long enough.";
    const his = structuredClone(base); his.summary = "New summary"; his.slides[0].title = "Renamed";
    const r = mergeDecks(base, mine, his, "current");
    expect(r.deck).toMatchObject({ title: "New title", summary: "New summary" });
    expect((r.deck as Obj).slides[0]).toMatchObject({ brief: "A brief that is long enough.", title: "Renamed" });
  });

  it("with no base it is a plain save: the incoming deck replaces the stored one", () => {
    const mine = deck([slide("a")]), his = deck([slide("z")]);
    const r = mergeDecks(null, mine, his, "current");
    expect(r.deck).toEqual(mine);
    expect(r.merged).toBe(false);
  });

  it("saving what is already stored changes nothing, and so does saving an unedited copy over someone else's edit", () => {
    const edited = structuredClone(base); get(edited, "a", "a-1").text = "his";
    expect(mergeDecks(base, edited, edited, "current").merged).toBe(false);
    const r = mergeDecks(base, structuredClone(base), edited, "current");           // an old unedited copy is saved: his edit survives
    expect(get(r.deck, "a", "a-1").text).toBe("his");
  });

  it("does not change its inputs", () => {
    const mine = structuredClone(base); get(mine, "a", "a-1").text = "mine";
    const his = structuredClone(base); get(his, "a", "a-1").size = 99;
    const copies = [structuredClone(base), structuredClone(mine), structuredClone(his)];
    mergeDecks(base, mine, his, "current");
    expect([base, mine, his]).toEqual(copies);
  });

  it("the real case: Harry's layout edits and Claude's edits to Manipulating ratios both survive", () => {
    const b = ratios as unknown as Obj;
    const his = structuredClone(b);                                       // Harry: wider book work grid, titles and instruction removed
    const bookSlide = his.slides.find((s: Obj) => s.id === "mr-1n-book");
    bookSlide.els = bookSlide.els.filter((e: Obj) => e.kind !== "text");
    Object.assign(bookSlide.els[0], { x: 20, y: 40, w: 1560, h: 830 });
    const mine = structuredClone(b);                                      // Claude: smaller fixed text on that grid, no title on Worksheet 2
    Object.assign(mine.slides.find((s: Obj) => s.id === "mr-1n-book").els.find((e: Obj) => e.kind === "grid"), { fixed: true, size: 42 });
    const w2 = mine.slides.find((s: Obj) => s.id === "mr-w2");
    w2.els = w2.els.filter((e: Obj) => !(e.kind === "text" && e.size >= 60));
    const r = mergeDecks(b, mine, his, "current");
    const grid = (r.deck as Obj).slides.find((s: Obj) => s.id === "mr-1n-book").els.find((e: Obj) => e.kind === "grid");
    expect(grid).toMatchObject({ x: 20, y: 40, w: 1560, h: 830, fixed: true, size: 42 });          // his box, my size
    expect((r.deck as Obj).slides.find((s: Obj) => s.id === "mr-1n-book").els.filter((e: Obj) => e.kind === "text")).toHaveLength(0);   // his deletions stay
    expect((r.deck as Obj).slides.find((s: Obj) => s.id === "mr-w2").els.some((e: Obj) => e.kind === "text" && e.size >= 60)).toBe(false);
    expect(r.conflicts).toEqual([]);
    expect((r.deck as Obj).slides).toHaveLength(b.slides.length);
  });
});
