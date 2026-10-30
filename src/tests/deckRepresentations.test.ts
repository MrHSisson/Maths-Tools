import { describe, expect, it } from "vitest";
import { LAYOUTS, barSlide, ratioTableSlide } from "../decks/layouts";
import { slideSteps, stagedClicks } from "../decks/SlideCanvas";
import { checkDeckContent } from "../decks/deckChecks";
import type { DeckDef, DeckElement } from "../decks/types";

const deckOf = (slides: DeckDef["slides"]): DeckDef => ({ id: "t", title: "t", summary: "t", slides });
const piece = (slide: DeckDef["slides"][number], kind: string) => slide.els.find((e) => e.kind === kind) as DeckElement;

describe("ratio table and bar model slide pieces", () => {
  it("are offered as layouts with sample content that passes the deck checks", async () => {
    const keys = LAYOUTS.map((l) => l.key);
    expect(keys).toContain("ratio-table");
    expect(keys).toContain("bar-model");
    const slides = ["ratio-table", "bar-model"].map((k, i) => LAYOUTS.find((l) => l.key === k)!.make(`s${i}`));
    const report = await checkDeckContent(deckOf(slides));
    expect(report.problems).toEqual([]);
  });

  it("count one click per further row, and per further part and brace", () => {
    const rt = ratioTableSlide("a", "t", "", undefined, "filled", true);
    expect(stagedClicks(piece(rt, "ratioTable"))).toBe(2);          // three rows: two clicks after the first
    expect(slideSteps(rt)).toBe(2);
    const bar = barSlide("b", "t", "", undefined, "filled", true);
    expect(stagedClicks(piece(bar, "bar"))).toBe(4);                // second part, then three braces
    expect(slideSteps(bar)).toBe(4);
    expect(slideSteps(ratioTableSlide("c"))).toBe(0);               // not staged: everything shows at once
  });

  it("start after the element's own click when it has one", () => {
    const rt = ratioTableSlide("a", "t", "", undefined, "filled", true);
    const els = rt.els.map((e) => (e.kind === "ratioTable" ? { ...e, step: 2 } : e));
    expect(slideSteps({ ...rt, els })).toBe(4);
  });

  it("are caught when the table or bar cannot be drawn", async () => {
    const bad = ratioTableSlide("a", "t", "", { headers: ["A", "B"], rows: [["1", "2"], ["2", "4"]], operations: [] });
    const bar = barSlide("b", "t", "", { parts: [{ units: 2 }], braces: [{ from: 1, to: 9, label: "x" }] });
    const report = await checkDeckContent(deckOf([bad, bar]));
    expect(report.problems.join("\n")).toMatch(/one factor between each pair of rows/);
    expect(report.problems.join("\n")).toMatch(/does not sit inside the bar/);
  });
});
