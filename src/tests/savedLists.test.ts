// Saved lists: named lists of saved questions that can mix tools, kept in the browser. The pure functions are tested here; the store just holds
// their result.
import { describe, it, expect } from "vitest";
import {
  MAX_LISTS, adoptLegacy, clearSaved, createList, currentList, deleteList, emptyState, hasSaved, mergeSaved, parseState, removeSaved, renameList, savedId,
  selectList, toggleSaved, type SavedItem,
} from "../shared/savedLists";
import { BASKET_MAX } from "../shared/decision/printBasket";

const item = (n: number, page = "/indices", extra: Partial<SavedItem> = {}): SavedItem => ({ tab: "t", level: 1, seed: n, options: {}, preview: `q${n}`, page, pageTitle: page.slice(1), ...extra });

describe("saved lists: questions", () => {
  it("starts with one list, Saved", () => {
    const s = emptyState();
    expect(s.lists.map((l) => l.name)).toEqual(["Saved"]);
    expect(currentList(s).items).toEqual([]);
  });
  it("saves a question once, removes it on the second press, stops at the cap", () => {
    const s1 = toggleSaved(emptyState(), item(1));
    expect(currentList(s1).items).toHaveLength(1);
    expect(hasSaved(s1, item(1))).toBe(true);
    expect(currentList(toggleSaved(s1, item(1))).items).toEqual([]);
    let full = emptyState();
    for (let i = 0; i < BASKET_MAX + 3; i++) full = toggleSaved(full, item(i));
    expect(currentList(full).items).toHaveLength(BASKET_MAX);
  });
  it("one list holds questions from different tools; the same recipe on two tools is two questions", () => {
    let s = toggleSaved(emptyState(), item(1, "/indices"));
    s = toggleSaved(s, item(1, "/surds"));
    s = toggleSaved(s, item(2, "/critical-path"));
    expect(currentList(s).items.map((i) => i.page)).toEqual(["/indices", "/surds", "/critical-path"]);
    expect(savedId(item(1, "/indices"))).not.toBe(savedId(item(1, "/surds")));
  });
  it("removes one, clears the list, merges without repeats", () => {
    let s = toggleSaved(toggleSaved(emptyState(), item(1)), item(2));
    s = removeSaved(s, savedId(item(1)));
    expect(currentList(s).items.map((i) => i.seed)).toEqual([2]);
    s = mergeSaved(s, [item(2), item(3)]);
    expect(currentList(s).items.map((i) => i.seed)).toEqual([2, 3]);
    expect(currentList(clearSaved(s)).items).toEqual([]);
  });
});

describe("saved lists: the lists", () => {
  it("makes a list, opens it, and keeps each list's questions apart", () => {
    let s = toggleSaved(emptyState(), item(1));
    s = createList(s, "  Year 10   Tuesday ");
    expect(currentList(s).name).toBe("Year 10 Tuesday");
    expect(currentList(s).items).toEqual([]);
    s = toggleSaved(s, item(2));
    s = selectList(s, s.lists[0].id);
    expect(currentList(s).items.map((i) => i.seed)).toEqual([1]);
  });
  it("a blank name, an unknown list and too many lists change nothing", () => {
    const s = emptyState();
    expect(createList(s, "   ")).toBe(s);
    expect(selectList(s, "nope")).toBe(s);
    let many = s;
    for (let i = 0; i < MAX_LISTS + 2; i++) many = createList(many, `L${i}`);
    expect(many.lists).toHaveLength(MAX_LISTS);
  });
  it("renames a list", () => {
    const s = emptyState();
    expect(renameList(s, s.lists[0].id, "Revision").lists[0].name).toBe("Revision");
    expect(renameList(s, s.lists[0].id, " ")).toBe(s);
  });
  it("deletes a list with its questions and moves to another; the last list cannot be deleted", () => {
    let s = createList(toggleSaved(emptyState(), item(1)), "Two");
    s = toggleSaved(s, item(2));
    const two = s.current;
    s = deleteList(s, two);
    expect(s.lists.map((l) => l.name)).toEqual(["Saved"]);
    expect(s.current).toBe(s.lists[0].id);
    expect(deleteList(s, s.lists[0].id)).toBe(s);
  });
});

describe("saved lists: storage", () => {
  it("round-trips through a string", () => {
    const s = createList(toggleSaved(emptyState(), item(1, "/indices", { fp: "ab" })), "Two");
    const back = parseState(JSON.stringify(s));
    expect(back).toEqual(s);
  });
  it("damaged, empty or foreign storage falls back to an empty Saved list instead of breaking", () => {
    for (const raw of [null, "", "not json", "[]", '{"lists":"x"}', '{"lists":[{"id":1}]}']) {
      const s = parseState(raw);
      expect(s.lists).toHaveLength(1);
      expect(s.lists[0].name).toBe("Saved");
    }
  });
  it("drops saved questions that are malformed or have no page, keeps the good ones", () => {
    const raw = JSON.stringify({ current: "a", lists: [{ id: "a", name: "A", items: [item(1), { tab: "t" }, { ...item(2), page: "" }] }] });
    expect(currentList(parseState(raw)).items.map((i) => i.seed)).toEqual([1]);
  });
  it("a current list that no longer exists opens the first", () => {
    const s = createList(emptyState(), "Two");
    const back = parseState(JSON.stringify({ ...s, current: "gone" }));
    expect(back.current).toBe(s.lists[0].id);
  });
  it("a page's old basket joins the current list, tagged with its page", () => {
    const old = [{ tab: "t", level: 1, seed: 9, options: {}, preview: "old" }];
    const s = adoptLegacy(emptyState(), old, "/critical-path", "Critical Path");
    expect(currentList(s).items[0]).toMatchObject({ seed: 9, page: "/critical-path", pageTitle: "Critical Path" });
  });
});
