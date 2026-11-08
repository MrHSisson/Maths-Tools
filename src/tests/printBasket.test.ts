// The print basket: saved question recipes, their storage, their link, and that a recipe rebuilds the same question.
import { describe, expect, it } from "vitest";
import { generateFromSeed, generateSeeded } from "../shared/seededGenerate";
import { generateCpa } from "../shared/decision";
import { BASKET_MAX, addItem, decodeBasket, encodeBasket, hasItem, itemKey, loadBasket, mergeItems, previewOf, removeItem, saveBasket, type BasketItem } from "../shared/decision/printBasket";

const item = (seed: number, over: Partial<BasketItem> = {}): BasketItem => ({ tab: "histogram", level: 3, seed, options: { histGiven: "true", histCut: "fewest" }, preview: "Delaying activities within their float…", ...over });

describe("print basket — the list", () => {
  it("adds a question once, removes it, and stops at the cap", () => {
    let b: BasketItem[] = [];
    b = addItem(b, item(1)); b = addItem(b, item(1)); b = addItem(b, item(2));
    expect(b.map((x) => x.seed)).toEqual([1, 2]);
    expect(hasItem(b, item(2))).toBe(true);
    expect(hasItem(b, item(2, { options: { histGiven: "false" } }))).toBe(false);   // other options: another question
    b = removeItem(b, item(1));
    expect(b.map((x) => x.seed)).toEqual([2]);
    let full: BasketItem[] = [];
    for (let s = 0; s < BASKET_MAX + 5; s++) full = addItem(full, item(s));
    expect(full.length).toBe(BASKET_MAX);
  });
  it("a question's key does not depend on the order of its options", () => {
    expect(itemKey(item(5, { options: { a: "1", b: "2" } }))).toBe(itemKey(item(5, { options: { b: "2", a: "1" } })));
  });
  it("the preview is the question's own sentence, not the shared opening", () => {
    const p = previewOf("The activity network represents a project. The times are in days. Each activity needs one worker. Draw a resource histogram for the project, with every activity starting as early as possible. Label every block.");
    expect(p.startsWith("Each activity needs one worker.")).toBe(true);
    expect(p.length).toBeLessThanOrEqual(70);
  });
});

describe("print basket — storage and links", () => {
  it("saves to and loads from the browser's storage, and survives bad data", () => {
    const store: Record<string, string> = {};
    (globalThis as unknown as { window: unknown }).window = { localStorage: { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; } } };
    saveBasket("k", [item(1), item(2)]);
    expect(loadBasket("k").map((x) => x.seed)).toEqual([1, 2]);
    store.k = "{not json";
    expect(loadBasket("k")).toEqual([]);
    store.k = JSON.stringify([item(3), { tab: 5 }]);
    expect(loadBasket("k").map((x) => x.seed)).toEqual([3]);
    delete (globalThis as unknown as { window?: unknown }).window;
    expect(loadBasket("k")).toEqual([]);                  // no storage at all: an empty basket, no error
  });
  it("a link round-trips the whole basket, merges without repeats, and a damaged link is ignored", () => {
    const b = [item(11), item(12, { tab: "level", level: 2, options: { levelWording: "extra" }, preview: "Only 8 workers — é" })];
    const code = encodeBasket(b);
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);             // safe in a link
    expect(decodeBasket(code)).toEqual(b);
    expect(mergeItems([item(11)], decodeBasket(code)!).map((x) => x.seed)).toEqual([11, 12]);
    for (const bad of ["", "###", encodeBasket([]), btoa("[1,2]"), btoa("{}")]) expect(decodeBasket(bad)).toBeNull();
  });
});

describe("print basket — a saved recipe rebuilds the same question", () => {
  it("the same seed and options give the identical question, for each sort of question the basket holds", () => {
    const recipes: Array<[string, () => ReturnType<typeof generateCpa>]> = [
      ["histogram L1", () => generateCpa(2, "cpaHistogram", { paths: "one", workers: "one" })],
      ["histogram L3", () => generateCpa(3, "cpaHistogram", { paths: "one", histLevel: 3, histGiven: false, histWorkers: "mixed", histCut: "fewest" })],
      ["levelling L3", () => generateCpa(3, "cpaLevel", { paths: "one", levelLevel: 3, levelWorkers: "mixed", histShape: "step" })],
    ];
    for (const [name, gen] of recipes) {
      const q = generateSeeded(gen);                       // what is on screen when "Add to print basket" is pressed
      const again = generateFromSeed((q as unknown as { _seed: number })._seed, gen);
      expect(JSON.stringify(again.data), name).toBe(JSON.stringify(q.data));
      expect(again.prompt).toBe(q.prompt);
    }
  }, 120_000);
});
