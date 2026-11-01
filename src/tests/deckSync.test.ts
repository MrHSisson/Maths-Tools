// The client half of shared editing (store.ts + cloud.ts): a save carries the version it started from, and a merge result is adopted.
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeckDef } from "../decks/types";

const sent: { deck: DeckDef; base?: DeckDef }[] = [];
let handler: ((r: { sent: DeckDef; merged?: DeckDef }) => void) | null = null;
vi.mock("../decks/cloud", () => ({
  fetchIndex: vi.fn(), fetchDeck: vi.fn(), pushQuestion: vi.fn(), pushRemoveDeck: vi.fn(),
  pushDeck: (deck: DeckDef, base?: DeckDef) => { sent.push({ deck, base }); },
  setSyncHandler: (fn: typeof handler) => { handler = fn; },
}));
const { saveDeck, loadDeck, deckBase, onDeckMerged } = await import("../decks/store");

const el = (id: string, text: string) => ({ id, kind: "text" as const, x: 0, y: 0, w: 10, h: 10, text, size: 40 });
const slide = (id: string, text: string) => ({ id, family: "teach" as const, title: id, els: [el(`${id}-1`, text)] });
const deck = (a: string, c: string, extra: Partial<DeckDef> = {}): DeckDef => ({ id: "my-sync", title: "D", summary: "", slides: [slide("a", a), slide("c", c)], ...extra });
const memory = new Map<string, string>();
const stored = () => JSON.parse(localStorage.getItem("mt-deck:my-sync")!) as DeckDef;

describe("shared editing on this device", () => {
  beforeEach(() => {
    memory.clear(); sent.length = 0;
    vi.stubGlobal("localStorage", { getItem: (k: string) => memory.get(k) ?? null, setItem: (k: string, v: string) => memory.set(k, v), removeItem: (k: string) => memory.delete(k), clear: () => memory.clear() });
  });

  it("a save sends the version the page started from as its base, then the accepted save becomes the base", () => {
    saveDeck(deck("a", "c"), false);                                    // pulled from the shared copy: that is the base
    expect(deckBase("my-sync")?.slides[0].els[0]).toMatchObject({ text: "a" });
    saveDeck(deck("edited", "c"));
    expect(sent).toHaveLength(1);
    expect((sent[0].base as DeckDef).slides[0].els[0]).toMatchObject({ text: "a" });
    expect((sent[0].deck as DeckDef).slides[0].els[0]).toMatchObject({ text: "edited" });
    handler!({ sent: sent[0].deck });                                   // the server accepted it unchanged
    expect((deckBase("my-sync") as DeckDef).slides[0].els[0]).toMatchObject({ text: "edited" });
  });

  it("does not send a save that has nothing new in it", () => {
    saveDeck(deck("a", "c"), false);
    saveDeck(deck("a", "c"));
    expect(sent).toHaveLength(0);
  });

  it("with no editor open, a merged deck from the server becomes this device's copy, keeping anything changed since the save", () => {
    saveDeck(deck("a", "c"), false);
    const mine = deck("a2", "c");
    saveDeck(mine);
    const mergedByServer = deck("a2", "c-from-claude", { updatedAt: "2099-01-01T00:00:00.000Z" });
    handler!({ sent: sent[0].deck, merged: mergedByServer });
    expect(stored().slides.map((s) => s.els[0])).toMatchObject([{ text: "a2" }, { text: "c-from-claude" }]);
    expect(loadDeck("my-sync")?.slides[1].els[0]).toMatchObject({ text: "c-from-claude" });
    // a further local change made while the save was in flight is kept too
    saveDeck(deck("a2", "c"), false);
    const sentDeck = deck("a2", "c");
    localStorage.setItem("mt-deck:my-sync", JSON.stringify(deck("a3-typed-meanwhile", "c")));
    handler!({ sent: sentDeck, merged: deck("a2", "c-from-claude") });
    expect(stored().slides.map((s) => s.els[0])).toMatchObject([{ text: "a3-typed-meanwhile" }, { text: "c-from-claude" }]);
  });

  it("with an editor open, the merge goes to the editor and the stored copy is left to it", () => {
    saveDeck(deck("a", "c"), false);
    saveDeck(deck("a2", "c"));
    const heard: DeckDef[] = [];
    const off = onDeckMerged("my-sync", (merged) => heard.push(merged));
    const before = localStorage.getItem("mt-deck:my-sync");
    handler!({ sent: sent[0].deck, merged: deck("a2", "c-from-claude") });
    expect(heard).toHaveLength(1);
    expect(localStorage.getItem("mt-deck:my-sync")).toBe(before);
    off();
    expect((deckBase("my-sync") as DeckDef).slides[1].els[0]).toMatchObject({ text: "c-from-claude" });   // the base moved on, so the next save starts from it
  });
});
