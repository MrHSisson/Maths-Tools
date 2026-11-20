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
const { saveDeck, loadDeck, deckBase, onDeckMerged, syncAllDecks, deckSummaries, ensureDeck } = await import("../decks/store");
const cloud = await import("../decks/cloud");

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

describe("Check for changes across all decks", () => {
  const stamp = (id: string, title: string, updatedAt: string) => ({ ...deck("a", "c", { id, title, updatedAt }) });
  const index = (entries: Record<string, string>) => ({ index: Object.fromEntries(Object.entries(entries).map(([id, updatedAt]) => [id, { title: id, summary: "", slides: 2, updatedBy: "x", updatedAt }])), questions: {} });
  beforeEach(() => {
    memory.clear();
    vi.stubGlobal("localStorage", { getItem: (k: string) => memory.get(k) ?? null, setItem: (k: string, v: string) => memory.set(k, v), removeItem: (k: string) => memory.delete(k), clear: () => memory.clear(), key: (i: number) => [...memory.keys()][i] ?? null, get length() { return memory.size; } });
  });

  it("refreshes the decks this device holds that are newer elsewhere, names them, and does NOT download the rest", async () => {
    saveDeck(stamp("one", "One", "2026-11-01T10:00:00.000Z"), false);
    saveDeck(stamp("two", "Two", "2026-11-01T10:00:00.000Z"), false);
    vi.mocked(cloud.fetchIndex).mockResolvedValue(index({ one: "2026-11-01T10:00:00.000Z", two: "2026-11-02T10:00:00.000Z", three: "2026-11-02T10:00:00.000Z" }) as never);
    vi.mocked(cloud.fetchDeck).mockClear();
    vi.mocked(cloud.fetchDeck).mockImplementation((async (id: string) => stamp(id, `${id} (newer)`, "2026-11-02T10:00:00.000Z")) as never);
    expect((await syncAllDecks())?.updated).toEqual(["two (newer)"]);                 // "one" was already current; "three" is not held here, so it is not downloaded
    expect(vi.mocked(cloud.fetchDeck).mock.calls.map((c) => c[0])).toEqual(["two"]);
    expect(loadDeck("two")?.title).toBe("two (newer)");
    expect(loadDeck("three")).toBeUndefined();
    expect(deckSummaries().map((d) => d.id).sort()).toEqual(["one", "three", "two"]);   // but it is listed, from the shared list
    expect((await syncAllDecks())?.updated).toEqual([]);                                // nothing newer now
  });

  it("opening a deck fetches it when this device does not hold it", async () => {
    vi.mocked(cloud.fetchIndex).mockResolvedValue(index({ three: "2026-11-02T10:00:00.000Z" }) as never);
    vi.mocked(cloud.fetchDeck).mockImplementation((async (id: string) => stamp(id, "Three", "2026-11-02T10:00:00.000Z")) as never);
    expect(loadDeck("three")).toBeUndefined();
    expect((await ensureDeck("three"))?.title).toBe("Three");
    expect(loadDeck("three")?.title).toBe("Three");
  });

  it("lists a deck from the shared list with its summary, and lays this device's newer copy over it", async () => {
    vi.mocked(cloud.fetchIndex).mockResolvedValue({ index: { a: { title: "Shared A", summary: "", slides: 3, updatedAt: "2026-11-02T10:00:00.000Z", updatedBy: "Harry", tool: "indices", families: { teach: 3 }, preview: { id: "p" } }, b: { title: "Shared B", summary: "", slides: 1, updatedAt: "2026-11-01T10:00:00.000Z", updatedBy: "Harry" } }, questions: {} } as never);
    saveDeck(stamp("b", "Local B", "2026-11-03T10:00:00.000Z"), false);                // this device's copy is newer than the shared one
    await syncAllDecks();
    const by = Object.fromEntries(deckSummaries().map((d) => [d.id, d]));
    expect(by.a).toMatchObject({ title: "Shared A", slides: 3, tool: "indices", families: { teach: 3 }, held: false });
    expect(by.b).toMatchObject({ title: "Local B", held: true });
  });

  it("keeps only the most recently used decks on the device, and never drops one with unsent changes", async () => {
    const ids = Array.from({ length: 11 }, (_, i) => `d${String(i).padStart(2, "0")}`);
    for (const id of ids) saveDeck(stamp(id, id, "2026-11-01T10:00:00.000Z"), false);      // 11 held; the earliest saved were used least recently
    saveDeck(stamp("d00", "d00 edited here", "2026-11-05T10:00:00.000Z"));                  // d00 was edited here and not yet sent: its base is the earlier copy
    vi.mocked(cloud.fetchIndex).mockResolvedValue(index(Object.fromEntries(ids.map((id) => [id, "2026-11-01T10:00:00.000Z"]))) as never);
    vi.mocked(cloud.fetchDeck).mockClear();
    await syncAllDecks();
    const held = ids.filter((id) => loadDeck(id));
    expect(held.length).toBe(8);
    expect(held).toContain("d00");                                                       // unsent work is never dropped, however long ago it was used
    // and a deck whose updatedAt looks old but whose content differs from what it last agreed with the shared copy is not dropped either
    expect(held.filter((id) => id !== "d00" && id !== "d10").length).toBe(6);
    expect(held).toContain("d10");                                                       // the most recent stays
    expect(deckSummaries().map((d) => d.id)).toHaveLength(11);                            // all eleven are still listed
  });

  it("says so (null) when the shared copy cannot be reached", async () => {
    vi.mocked(cloud.fetchIndex).mockResolvedValue(null);
    expect(await syncAllDecks()).toBeNull();
  });
});


describe("a full device", () => {
  const LIMIT = 4000;
  const used = () => [...memory.entries()].reduce((n, [k, v]) => n + k.length + v.length, 0);
  beforeEach(() => {
    memory.clear();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => { if (used() - (memory.get(k)?.length ?? 0) + v.length > LIMIT) throw new Error("QuotaExceededError"); memory.set(k, v); },
      removeItem: (k: string) => memory.delete(k), clear: () => memory.clear(), key: (i: number) => [...memory.keys()][i] ?? null, get length() { return memory.size; },
    });
  });
  const filler = (n: number) => "x".repeat(n);

  it("frees the history and base copies of other decks, then keeps the save", () => {
    memory.set("mt-deck-history:other", filler(1800));
    memory.set("mt-deck-base:other", filler(1800));
    expect(saveDeck(deck("a", "c", { id: "my-sync" }), false)).toBe(true);
    expect(memory.has("mt-deck-history:other")).toBe(false);
    expect(loadDeck("my-sync")?.title).toBe("D");
  });

  it("a base copy holding unsent work is never dropped to make room", () => {
    saveDeck(deck("a", "c", { id: "x1", updatedAt: "2026-11-01T10:00:00.000Z" }), false);
    saveDeck(deck("edited", "c", { id: "x1" }));                                         // x1 edited here, not yet sent: its base differs from the deck
    memory.set("mt-deck-history:x2", filler(10));
    memory.set("mt-fill", filler(LIMIT - used() - 5));                                   // storage is now nearly full
    expect(saveDeck(deck("a", "c", { id: "x3", title: "x".repeat(300) }), false)).toBe(false);   // more than the old history can make room for
    expect(memory.has("mt-deck-history:x2")).toBe(false);                                // other decks' history was freed first
    expect(memory.has("mt-deck-base:x1")).toBe(true);                                    // but the base of the deck with unsent edits was not
  });

  it("never drops another deck itself, and says it failed when nothing more can be freed", async () => {
    expect(saveDeck(deck("a", "c", { updatedAt: "2026-11-01T10:00:00.000Z" }), false)).toBe(true);   // an older copy of the deck is held here
    memory.set("mt-deck:other", filler(1400));
    expect(saveDeck(deck("a", filler(3000), { updatedAt: "2026-11-01T10:00:00.000Z" }), false)).toBe(false);   // too big to fit
    expect(memory.has("mt-deck:other")).toBe(true);
    vi.mocked(cloud.fetchIndex).mockResolvedValue({ index: { "my-sync": { title: "Big", summary: "", slides: 2, updatedBy: "x", updatedAt: "2026-11-02T10:00:00.000Z" } }, questions: {} } as never);
    vi.mocked(cloud.fetchDeck).mockResolvedValue(deck("a", filler(3000), { title: "Big", updatedAt: "2026-11-02T10:00:00.000Z" }) as never);
    const r = await syncAllDecks();
    expect(r?.failed).toEqual(["Big"]);
    expect(r?.updated).toEqual([]);
  });
});
