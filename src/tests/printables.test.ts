import { describe, it, expect } from "vitest";
import { numberLineSheet, placeValueSheet, binarySheet, ratioTableSheet, gridSheet, hundredSquareSheet, trigGraphSheet, printableHtml } from "../shared/printables";
import { TOOLS } from "../admin/facts";

// Printables are ready-made sheets of one SVG cell on an A4 grid. A tool offers them only when its working is built on a picture
// the student draws or fills in on a blank.
const SHEETS = [numberLineSheet(), placeValueSheet(), binarySheet(), ratioTableSheet(), gridSheet(), hundredSquareSheet(), trigGraphSheet()];
const BLANKS = ["Number line", "Place value table", "Ratio table", "Graph"];

describe("printables", () => {
  it("every sheet is a well-formed SVG cell on a sensible grid, with its own menu label", () => {
    for (const s of SHEETS) {
      expect(s.cell.startsWith("<svg viewBox=")).toBe(true);
      expect(s.cell.endsWith("</svg>")).toBe(true);
      expect(s.columns).toBeGreaterThanOrEqual(1);
      expect(s.rows).toBeGreaterThanOrEqual(1);
      expect(s.label.trim()).not.toBe("");
    }
    const labels = SHEETS.map(s => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("the trig graph sheet is three different graphs, one to a row, each titled", () => {
    const s = trigGraphSheet();
    expect(s.cells).toHaveLength(s.columns * s.rows);
    expect(new Set(s.cells).size).toBe(3);
    ["sin", "cos", "tan"].forEach((f, i) => expect(s.cells![i]).toContain(`y = ${f} x`));
    expect((printableHtml(s).match(/class="c"/g) ?? []).length).toBe(3);
    expect(printableHtml(numberLineSheet()).match(/class="c"/g)!.length).toBe(10);   // a sheet with one cell still repeats it
  });

  it("only tools built on a blank the student fills in offer one", () => {
    const wrong = TOOLS.filter(t => t.shell === "ToolShell" && t.printables && !t.representations.some(r => BLANKS.includes(r))).map(t => t.id);
    expect(wrong).toEqual([]);
  });
});
