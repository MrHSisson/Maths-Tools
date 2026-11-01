import { describe, expect, it } from "vitest";
import { Q } from "../decks/builder";
import { parsePictureLine, pictureLine } from "../decks/WorkedPicture";
import { pinnedSheets, MAX_PINNED } from "../decks/worksheets";
import type { DeckDef } from "../decks/types";
import deckJson from "../decks/data/manipulating-ratios.json";

const pictures = (q: { explanation: string[] }) => q.explanation.map(parsePictureLine).filter((x) => x !== null);

describe("fixed questions made from the Ratio Manipulation tool's own generator", () => {
  it("simplifying: the working is the tool's ratio table, one row per prime step", () => {
    const q = Q.ratioSimplify("t1", "level1", [18, 27]);
    expect(q.answer).toEqual(["$2 : 3$"]);
    const tables = pictures(q).filter((p) => p!.type === "ratioTable");
    expect(tables).toHaveLength(3);                                                        // write the ratio, ÷ 3, ÷ 3
    const rows = tables.map((t) => (t!.data as { rows: string[][] }).rows.length);
    expect(rows).toEqual([1, 2, 3]);                                                         // the table grows a row per step
    expect(tables[0]!.caption).toBe("Write the ratio");
  });

  it("1 : n and n : 1 finish with a row that has the 1 in it", () => {
    expect(Q.ratioSimplify("t2", "level1", [6, 15], "oneToN").answer).toEqual(["$1 : 2.5$"]);
    expect(Q.ratioSimplify("t3", "level1", [9, 6], "nToOne").answer).toEqual(["$1.5 : 1$"]);
    expect(Q.ratioSimplify("t4", "level1", [24, 40, 16]).answer).toEqual(["$3 : 5 : 2$"]);   // three parts: simplest form
  });

  it("ratio to fraction: of the total, of a part, and of the rest, each with its answer checked from the parts", () => {
    const total = Q.ratioFraction("t5", "level1", { names: ["red", "blue"], of: "the beads", v: [6, 4], kind: "total", num: [0], variant: 0 });
    expect(total.question[0]).toBe("red : blue = $6 : 4$");
    expect(total.question[1]).toBe("What fraction of the beads are red?");
    expect(total.answer).toEqual(["$\\frac{3}{5}$"]);
    expect(pictures(total).filter((p) => p!.type === "bar")).toHaveLength(2);               // the bar-model scaffold, two steps
    const part = Q.ratioFraction("t6", "level2", { names: ["red", "blue"], of: "the beads", v: [4, 9], kind: "part", num: [1], den: [0], variant: 2 });
    expect(part.question[1]).toBe("What fraction of red are blue?");
    expect(part.answer).toEqual(["$\\frac{9}{4}$"]);
    const rest = Q.ratioFraction("t7", "level2", { names: ["football", "squash", "tennis"], v: [2, 3, 5], kind: "rest", num: [0] });
    expect(rest.answer).toEqual(["$\\frac{1}{4}$"]);
    expect(rest.question[1]).toMatch(/the rest \(squash and tennis together\)/);
  });

  it("the numbers-only method leaves the bar out", () => {
    const q = Q.ratioFraction("t8", "level3", { names: ["boys", "girls"], v: [7, 3], kind: "part", num: [1], den: [0], numerical: true });
    expect(pictures(q)).toHaveLength(0);
  });

  it("a picture line round-trips, and an ordinary line is not one", () => {
    const line = pictureLine("A caption", "bar", { parts: [], rows: [{ name: "Red", units: 3 }] });
    expect(parsePictureLine(line)).toMatchObject({ caption: "A caption", type: "bar" });
    expect(parsePictureLine("Red = $\\frac{3}{8}$")).toBeNull();
  });
});

describe("Fraction to Ratio and Forming Ratios questions made by the tool's own code", () => {
  it("a fraction of the total: the rest is found, and the ratio is in the order asked", () => {
    const q = Q.ratioFromFraction("f1", "total", "beads", ["Red", "Blue"], 2, 5);
    expect(q.answer).toEqual(["$2 : 3$"]);
    expect(q.question[0]).toContain("Write the ratio of Red to Blue");
    const r = Q.ratioFromFraction("f2", "total", "beads", ["Red", "Blue"], 2, 5, { rev: true });
    expect(r.answer).toEqual(["$3 : 2$"]);
  });
  it("a fraction of the other part: numerator : denominator, reversed when asked the other way", () => {
    expect(Q.ratioFromFraction("f3", "part", "beads", ["red", "blue"], 2, 3).answer).toEqual(["$2 : 3$"]);
    expect(Q.ratioFromFraction("f4", "part", "marbles", ["pink", "white"], 3, 5, { rev: true }).answer).toEqual(["$5 : 3$"]);
  });
  it("forming a two-part ratio keeps the order asked, and simplifies on request", () => {
    expect(Q.ratioForm("g1", ["girls", "boys"], "classroom", 12, 15, { rev: true }).answer).toEqual(["$15 : 12$"]);
    expect(Q.ratioForm("g2", ["apples", "oranges"], "basket", 12, 8, { simplest: true }).answer).toEqual(["$3 : 2$"]);
  });
});

describe("the Manipulating ratios deck", () => {
  const deck = deckJson as unknown as DeckDef;
  it("pins one A4 worksheet of 12 (Ratio to Fraction, Level 3); the other two stages are nine hand-written book work questions", () => {
    const sheets = pinnedSheets(deck);
    expect(sheets).toHaveLength(1);
    expect(sheets.length).toBeLessThanOrEqual(MAX_PINNED);
    expect(sheets.map((s) => s.el.preset.level)).toEqual(["level3"]);
    expect(sheets.every((s) => s.el.tool === "ratio-manipulation" && s.el.view === "key" && s.el.pin?.paper === "A4" && s.el.count === 12)).toBe(true);
    for (const id of ["mr-w1", "mr-w2"]) {
      const grid = deck.slides.find((s) => s.id === id)!.els.find((e) => e.kind === "grid") as unknown as { items: { answer: string[] }[] };
      expect(grid.items).toHaveLength(9);
      expect(new Set(grid.items.map((q) => q.answer[0])).size).toBe(9);
    }
  });
});
