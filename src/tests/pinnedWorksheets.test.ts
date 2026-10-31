import { afterEach, describe, expect, it, vi } from "vitest";
import { LAYOUTS, pinnedSheetSlide } from "../decks/layouts";
import { MAX_PINNED, freezeSheet, isFrozen, nextSheetTitle, pinnedSheets, printSheet, sheetQuestions, sheetSig, type Sheet } from "../decks/worksheets";
import { checkDeckContent } from "../decks/deckChecks";
import type { DeckDef, Slide } from "../decks/types";

const deckOf = (slides: Slide[]): DeckDef => ({ id: "t", title: "t", summary: "t", slides });
const sheetOf = (slide: Slide) => slide.els.find((e) => e.kind === "worksheet") as Sheet;
const slideFor = (id: string, seed = 1) => pinnedSheetSlide(id, "ratio-manipulation", { sub: "ratioToFraction", level: "level1" }, 12, 2, "Worksheet", seed);

/** Captures the HTML a print window is given, in place of opening one. */
const capturePrint = () => {
  const writes: string[] = [];
  vi.stubGlobal("window", { open: () => ({ document: { write: (h: string) => writes.push(h), close: () => undefined }, print: () => undefined }), alert: () => undefined });
  return writes;
};
afterEach(() => vi.unstubAllGlobals());

describe("worksheets pinned to a lesson", () => {
  it("is offered as a layout, pinned, with the answers view and a passing deck check", async () => {
    const l = LAYOUTS.find((x) => x.key === "worksheet");
    expect(l).toBeDefined();
    const slide = l!.make("s1"), el = sheetOf(slide);
    expect(el.pin).toBeDefined();
    expect(el.view).toBe("key");
    expect((await checkDeckContent(deckOf([slide]))).problems).toEqual([]);
  });

  it("finds the pinned worksheets in slide order, and allows three", () => {
    const deck = deckOf([slideFor("a"), { ...slideFor("b"), els: [{ ...sheetOf(slideFor("b")), pin: undefined }] }, slideFor("c")]);
    expect(pinnedSheets(deck).map((p) => p.slide.id)).toEqual(["a", "c"]);
    expect(pinnedSheets(deck).map((p) => p.slideNo)).toEqual([1, 3]);
    expect(MAX_PINNED).toBe(3);
    expect(nextSheetTitle(deck)).toBe("Worksheet 3");
  });

  it("freezes a set without its working, and uses it only while the setup is the same", async () => {
    const el = sheetOf(slideFor("a", 5));
    const frozen = await freezeSheet(el);
    expect(frozen.questions).toHaveLength(12);
    expect(frozen.questions.every((q) => q.working.length === 0)).toBe(true);
    const pinned: Sheet = { ...el, frozen };
    expect(isFrozen(pinned)).toBe(true);
    expect(await sheetQuestions(pinned)).toBe(frozen.questions);                       // the kept copy, not a fresh set
    const moved: Sheet = { ...pinned, seed: 6 };                                        // a new set: the kept copy no longer applies
    expect(isFrozen(moved)).toBe(false);
    expect(sheetSig(moved)).not.toBe(sheetSig(pinned));
    expect((await sheetQuestions(moved)).map((q) => q.key)).not.toEqual(frozen.questions.map((q) => q.key));
  });

  it("a seed gives the same set every time, so the sheet and its slide agree before it is frozen", async () => {
    const el = sheetOf(slideFor("a", 9));
    expect((await sheetQuestions(el)).map((q) => q.answerLatex)).toEqual((await sheetQuestions(el)).map((q) => q.answerLatex));
  });

  it("prints on an A5 page by default, A4 when asked, as questions, answers or both", async () => {
    const el = sheetOf(slideFor("a", 3));
    let writes = capturePrint();
    await printSheet(el, "questions");
    expect(writes[0]).toContain("@page { size: A5; margin: 10mm; }");
    expect(writes[0]).toContain('var printMode = "questions"');
    writes = capturePrint();
    await printSheet({ ...el, pin: { ...el.pin!, paper: "A4" } }, "answers");
    expect(writes[0]).toContain("@page { size: A4; margin: 12mm; }");
    expect(writes[0]).toContain('var printMode = "answers"');
    writes = capturePrint();
    await printSheet(el, "both");
    expect(writes[0]).toContain('var printMode = "both"');
  });

  it("prints with the sheet's title, the tool pages' column count, layout and text size", async () => {
    const el = sheetOf(slideFor("a", 3));
    const writes = capturePrint();
    await printSheet({ ...el, cols: 3, pin: { title: "Worksheet 2", layout: "list", fontPx: 18 } }, "questions");
    expect(writes[0]).toContain('var toolName  = "Worksheet 2"');
    expect(writes[0]).toContain("var cols      = 3");
    expect(writes[0]).toContain("var isListLayout = true");
    expect(writes[0]).toContain("font-size: 18px");
  });

  it("prints the answer sheet as a compact list in larger type, whatever the sheet's own layout", async () => {
    const el = sheetOf(slideFor("a", 3));
    const writes = capturePrint();
    await printSheet({ ...el, cols: 3, pin: { ...el.pin!, layout: "grid", fontPx: 16 } }, "answers");
    expect(writes[0]).toContain("var isListLayout = true");
    expect(writes[0]).toContain("var cols      = 2");
    expect(writes[0]).toContain("font-size: 21px");                                    // 16px × 1.3
    expect(writes[0]).toContain('var printMode = "answers"');
  });

  it("does nothing for a worksheet that is not pinned", async () => {
    const writes = capturePrint();
    await printSheet({ ...sheetOf(slideFor("a")), pin: undefined }, "questions");
    expect(writes).toHaveLength(0);
  });
});
