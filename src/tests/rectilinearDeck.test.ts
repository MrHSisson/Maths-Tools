import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import SendToDeck from "../decks/SendToDeck";
import { checkDeckContent } from "../decks/deckChecks";
import { describe, expect, it } from "vitest";
import { defaultRectilinear, isRectilinearSpec } from "../../api/_rectilinear";
import { isCuratedQuestion } from "../../api/_questions";
import { checkDeck } from "../../api/_decks";
import { authoredRectilinear, rectilinearQuestion } from "../decks/rectilinear";
import { authoredSheetSlide, sheetQuestions, isFrozen } from "../decks/worksheets";
import { rectilinearPrintCells } from "../decks/rectilinearPrint";
import { diagramPracticeSheet } from "../shared/printables";
import { GENERATOR_TOOLS, generateFrom, loadConfig, generateSet, supportsGeneratorSubtool } from "../decks/generators";
import { fromGenerated } from "../decks/SlideCanvas";
import { labelPlan } from "../shared/shapes/Diagram";
import { extras } from "../shared/questionExtras";
import type { Drawing } from "../shared/shapes/drawing";

const shape = defaultRectilinear;
describe("rectilinear deck foundations", () => {
  it("uses the same 42 cm² L-shape for addition and removing a cut-out in every orientation", () => {
    const outlines = new Set<string>();
    for (let orientation = 0; orientation < 8; orientation++) {
      const add = rectilinearQuestion({ ...shape(), orientation, method: "split" });
      const subtract = rectilinearQuestion({ ...shape(), orientation, method: "subtract" });
      outlines.add(JSON.stringify((extras(add)._diagram as Drawing).polys));
      expect(add.answer).toBe("42"); expect(subtract.answer).toBe("42");
      expect(extras(add)._diagram).toMatchObject({ polys: (extras(subtract)._diagram as Drawing).polys });
      expect(subtract.working.some(w => w.latex.includes("48 - 6"))).toBe(true);
    }
    expect(outlines.size).toBe(8);
  });
  it("checks chosen dimensions, and answers for T-shapes and stairs", () => {
    expect(rectilinearQuestion({ ...shape(), shape: "T", width: 10, height: 7, cutWidth: 3, cutHeight: 5 }).answer).toBe("40");
    expect(rectilinearQuestion({ ...shape(), shape: "stairs3", width: 10, height: 7, cutWidth: 3, cutHeight: 2 }).answer).toBe("46");
    for (const spec of [{ ...shape(), cutWidth: 8 }, { ...shape(), height: Infinity }, { ...shape(), width: 8.5 }, { ...shape(), orientation: 8 }]) {
      expect(isRectilinearSpec(spec)).toBe(false); expect(() => rectilinearQuestion(spec)).toThrow();
    }
  });
  it("saves portable, independent copies and rejects malformed shape data on the API", () => {
    const q = authoredRectilinear("area-one", shape()); expect(isCuratedQuestion(q)).toBe(true);
    expect(q.answer).toEqual(["$42$ cm²"]);
    const slide = authoredSheetSlide("area-sheet", "Area practice", [q]);
    const el = slide.els[0]; if (el.kind !== "worksheet") throw Error("expected sheet");
    expect(isFrozen(el)).toBe(true);
    const roundTrip = JSON.parse(JSON.stringify({ id: "area-foundations", title: "Shapes", summary: "", slides: [slide] }));
    expect(checkDeck(roundTrip)).not.toHaveProperty("error");
    if (q.rectilinear) q.rectilinear.width = 20;
    expect(el.authored?.[0].rectilinear?.width).toBe(8);
    roundTrip.slides[0].els[0].authored[0].rectilinear.cutHeight = -1;
    expect(checkDeck(roundTrip)).toHaveProperty("error");
  });
  it("freezes the printed questions and changes scaffolding without changing the chosen area", async () => {
    const questions = (["full", "split", "none"] as const).map((scaffold, i) => authoredRectilinear(`area-${i}`, { ...shape(), scaffold }));
    const slide = authoredSheetSlide("sheet", "Area practice", questions), el = slide.els[0];
    if (el.kind !== "worksheet") throw Error("expected sheet");
    const printed = await sheetQuestions(el);
    expect(printed.map(q => q.answer)).toEqual(["42", "42", "42"]);
    expect(new Set(printed.map(q => q.key)).size).toBe(3);
    expect((await checkDeckContent({ id: "area-check", title: "Area", summary: "", slides: [slide] })).problems).toEqual([]);
    const cells = rectilinearPrintCells(questions);
    expect(cells[0].prompts.join(" ")).toContain("Rectangle A");
    const stair = rectilinearQuestion({ ...shape(), shape: "stairs3", width: 12, height: 9, cutWidth: 4, cutHeight: 3 });
    expect((extras(stair)._diagram as Drawing).helpers.some(h => h.label === "8 cm" && h.always)).toBe(true);
    expect(cells[2].prompts.join(" ")).not.toContain("Rectangle A");
    expect(cells.every(c => c.svg.includes("<svg") && c.answer.includes("42"))).toBe(true);
    const html = diagramPracticeSheet([...cells, ...cells, ...cells, ...cells], "Area <test>", "both");
    expect(html.match(/<section class="page">/g)).toHaveLength(4);
    expect(html).toContain("Area &lt;test&gt;"); expect(html).not.toContain("<test>");
  });
  it("offers the real rectilinear generator and preserves diagrams in the slide presentation", async () => {
    expect(GENERATOR_TOOLS.some(([id]) => id === "perimeter-and-area")).toBe(true);
    expect(Object.keys((await loadConfig("perimeter-and-area"))!.tools)).toEqual(["compound"]);
    const preset = { sub: "compound", level: "level1" as const, multiSelect: { area: true, perimeter: false, all: true, missing: false }, variables: { reducedLabels: true, showSplit: false } };
    const q = await generateFrom("perimeter-and-area", preset, 123); expect(q).not.toBeNull();
    expect(fromGenerated(q!).drawing?.polys.length).toBe(1);
    expect(fromGenerated(q!).focuses?.length).toBe(q!.working.length);
    expect((await generateSet("perimeter-and-area", preset, 12, 123))).toHaveLength(12);
  });
  it("only sends supported sub-tools and never flattens a diagram into a text-only fixed question", () => {
    expect(supportsGeneratorSubtool("perimeter-and-area", "compound")).toBe(true);
    expect(supportsGeneratorSubtool("perimeter-and-area", "shapes")).toBe(false);
    const html = renderToStaticMarkup(createElement(SendToDeck, { path: "/perimeter-and-area", sub: "compound", level: "level1", variables: {}, dropdown: "", multiSelect: {}, question: rectilinearQuestion(shape()), onClose: () => {} }));
    expect(html).toContain("chosen dimensions");
    expect(html).not.toContain("This question, hand-picked");
  });

  it("enlarges board labels without changing worksheet type or sizing", () => {
    const d = extras(rectilinearQuestion(shape()))._diagram as Drawing;
    expect(labelPlan(d, false, false).L.fs).toBe(30);
    expect(labelPlan(d, true, false).L.fs).toBe(12);
    expect(rectilinearPrintCells([authoredRectilinear("printed", shape())])[0].svg).toContain('font-size="12"');
  });
  it("authors missing lengths by addition or subtraction before area, without leaking the value in helpers", () => {
    for (const missingLength of ["addition", "subtraction"] as const) for (let orientation = 0; orientation < 8; orientation++) {
      const q = rectilinearQuestion({ ...shape(), missingLength, orientation });
      const d = extras(q)._diagram as Drawing;
      const unknown = d.edges.filter(e => e.kind === "missing");
      expect(unknown).toHaveLength(1);
      const value = unknown[0].value!;
      expect(d.edges.filter(e => e.kind === "plain").some(e => e.label === value)).toBe(false);
      expect(d.helpers).toEqual([]);
      expect(q.working.findIndex(w => w.label === "So the missing side is:")).toBeLessThan(q.working.findIndex(w => w.label === "Split it into rectangles and find each area:"));
      expect(q.answer).toBe("42");
      const calculation = q.working.find(w => w.label === "So the missing side is:")!.latex.split("=")[0];
      expect(calculation.includes("-")).toBe(missingLength === "subtraction");
      const authored = authoredRectilinear("missing-one", { ...shape(), missingLength, orientation });
      expect(isCuratedQuestion(JSON.parse(JSON.stringify(authored)))).toBe(true);
      expect(rectilinearPrintCells([authored])[0].prompts[0]).toContain("Missing length");
    }
    expect(isRectilinearSpec({ ...shape(), shape: "T", missingLength: "addition" })).toBe(true);
    expect(isRectilinearSpec({ ...shape(), width: 6, height: 6, cutWidth: 3, cutHeight: 3, missingLength: "subtraction" })).toBe(false);
  });

  it("authors cross, U, two-notch and frame areas through both methods in all orientations", () => {
    const expected = { cross: 141, U: 201, comb: 181, frame: 201 };
    for (const kind of ["cross", "U", "comb", "frame"] as const) for (let orientation = 0; orientation < 8; orientation++) for (const method of ["split", "subtract"] as const) {
      const spec = { ...shape(), shape: kind, width: 17, height: 13, cutWidth: 5, cutHeight: 4, orientation, method };
      expect(isRectilinearSpec(spec)).toBe(true);
      const q = rectilinearQuestion(spec);
      expect(Number(q.answer)).toBe(expected[kind]);
      expect((extras(q)._diagram as Drawing).polys.length).toBe(kind === "frame" ? 2 : 1);
      expect(isCuratedQuestion(authoredRectilinear(`varied-${kind.toLowerCase()}`, spec))).toBe(true);
    }
    expect(isRectilinearSpec({ ...shape(), shape: "comb", width: 8, cutWidth: 3 })).toBe(false);
    expect(isRectilinearSpec({ ...shape(), shape: "frame", cutWidth: 7 })).toBe(false);
    expect(isRectilinearSpec({ ...shape(), shape: "frame", missingLength: "addition" })).toBe(false);
  });
  it("keeps varied missing-length questions solvable without copying a repeated length", () => {
    for (const kind of ["T", "stairs3", "U", "comb"] as const) for (const missingLength of ["addition", "subtraction"] as const) for (let orientation = 0; orientation < 8; orientation++) {
      const spec = { ...shape(), shape: kind, width: 19, height: 13, cutWidth: 4, cutHeight: 3, missingLength, orientation, scaffold: "none" as const };
      if (!isRectilinearSpec(spec)) continue;
      const q = rectilinearQuestion(spec), d = extras(q)._diagram as Drawing;
      expect(d.edges.filter(e => e.kind === "missing")).toHaveLength(1);
      const unknown = d.edges.find(e => e.kind === "missing")!;
      expect(d.edges.some(e => e.kind === "plain" && e.label === unknown.value)).toBe(false);
      expect(q.working.find(w => w.label === "So the missing side is:")!.latex.split("=")[0].includes("-")).toBe(missingLength === "subtraction");
    }
  });
  it("replaces repeated staircase numbers with explicit matching marks and retains component dimensions", () => {
    const spec = { ...shape(), shape: "stairs3" as const, width: 14, height: 10, cutWidth: 4, cutHeight: 3 };
    const d = extras(rectilinearQuestion(spec))._diagram as Drawing;
    const marked = d.edges.filter(e => e.ticks);
    expect(marked.length).toBeGreaterThan(2);
    for (const tick of new Set(marked.map(e => e.ticks))) {
      const group = marked.filter(e => e.ticks === tick);
      expect(new Set(group.map(e => Math.hypot(e.b[0]-e.a[0],e.b[1]-e.a[1]))).size).toBe(1);
      expect(group.filter(e => e.label)).toHaveLength(1);
    }
    expect(d.helpers.some(h => h.label === "10 cm" && h.always)).toBe(true);
    expect(d.edges.filter(e => e.label).length).toBeLessThan(6);
  });

});
