// What the Decks page shows from the category tree (src/decks/categoryTree.ts).
import { describe, expect, it } from "vitest";
import { DEFAULT_TREE as API_TREE } from "../../api/_categories";
import { DEFAULT_TREE, LEGACY_DATA, layoutDecks, menuOptions, pathOf, placeOf, type CategoryData } from "../decks/categoryTree";

const data: CategoryData = {
  categories: [
    { id: "n", name: "Number", parent: null, position: 0 },
    { id: "fm", name: "Factors & multiples", parent: "n", position: 0 },
    { id: "ix", name: "Indices", parent: "n", position: 1 },
    { id: "d", name: "Decision Mathematics", parent: null, position: 1 },
    { id: "s", name: "Starters", parent: null, position: 2 },
  ],
  filing: { fac: "fm", est: "n", res: "d" },
};

describe("where a deck sits", () => {
  it("the filing wins over the strand a deck carries", () => {
    expect(placeOf({ id: "fac", strand: "Decision Mathematics" }, data)).toBe("fm");
  });
  it("an unfiled deck falls back to the strand it carries, matched by name without regard to case", () => {
    expect(placeOf({ id: "new", strand: "number" }, data)).toBe("n");
    expect(placeOf({ id: "new", strand: "Pure" }, data)).toBeNull();
    expect(placeOf({ id: "new" }, data)).toBeNull();
  });
  it("a deck filed under a category that no longer exists is not filed", () => {
    expect(placeOf({ id: "x" }, { ...data, filing: { x: "gone" } })).toBeNull();
  });
});

describe("the sections", () => {
  const decks = [{ id: "fac" }, { id: "est" }, { id: "res" }, { id: "loose" }, { id: "old", strand: "Number" }];
  it("lists strands in order, the decks filed straight in a strand, then its topics, then what is not filed", () => {
    const l = layoutDecks(decks, data, { showEmpty: false });
    expect(l.sections.map((s) => s.category.name)).toEqual(["Number", "Decision Mathematics"]);
    expect(l.sections[0].decks).toEqual(["est", "old"]);
    expect(l.sections[0].topics.map((t) => [t.category.name, t.decks])).toEqual([["Factors & multiples", ["fac"]]]);
    expect(l.unfiled).toEqual(["loose"]);
  });
  it("hides empty categories from the public and shows them to Harry, so he can drop a deck into one", () => {
    const pub = layoutDecks(decks, data, { showEmpty: false });
    const admin = layoutDecks(decks, data, { showEmpty: true });
    expect(pub.sections.map((s) => s.category.name)).not.toContain("Starters");
    expect(admin.sections.map((s) => s.category.name)).toEqual(["Number", "Decision Mathematics", "Starters"]);
    expect(admin.sections[0].topics.map((t) => t.category.name)).toEqual(["Factors & multiples", "Indices"]);
  });
  it("follows the order Harry set, not the alphabet", () => {
    const flipped: CategoryData = { ...data, categories: data.categories.map((c) => (c.id === "d" ? { ...c, position: -1 } : c)) };
    expect(layoutDecks(decks, flipped, { showEmpty: false }).sections.map((s) => s.category.name)).toEqual(["Decision Mathematics", "Number"]);
  });
  it("when the service cannot be reached it uses the five old strands, placing decks by the strand they carry", () => {
    const l = layoutDecks([{ id: "a", strand: "Algebra" }, { id: "b" }], null, { showEmpty: false });
    expect(l.sections.map((s) => s.category.name)).toEqual(["Algebra"]);
    expect(l.unfiled).toEqual(["b"]);
  });
});

describe("names for menus", () => {
  it("a path reads Strand › Topic, and an unfiled deck reads Not filed", () => {
    expect(pathOf("fm", data)).toBe("Number › Factors & multiples");
    expect(pathOf("n", data)).toBe("Number");
    expect(pathOf(null, data)).toBe("Not filed");
  });
  it("a menu lists each strand followed by its topics", () => {
    expect(menuOptions(data).map((o) => `${o.depth}:${o.label}`)).toEqual(["0:Number", "1:Factors & multiples", "1:Indices", "0:Decision Mathematics", "0:Starters"]);
  });
  it("the page's fallback tree and the service's starting tree are the same", () => {
    expect(DEFAULT_TREE).toEqual(API_TREE);
    expect(LEGACY_DATA.categories.filter((c) => c.parent === null).map((c) => c.name)).toEqual(DEFAULT_TREE.map((t) => t.name));
  });
  it("a deck still carrying Decision Mathematics sits in A-Level > Further Maths", () => {
    const id = placeOf({ id: "x", strand: "Decision Mathematics" }, { categories: LEGACY_DATA.categories, filing: {} });
    expect(pathOf(id, LEGACY_DATA)).toBe("A-Level › Further Maths");
  });
});
