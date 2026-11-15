// The shared deck pieces (src/decks/pieces.ts), the fresh-number rules (src/decks/deckRules.ts) and the deck checks that back them up.
import katex from "katex";
import { describe, expect, it } from "vitest";
import { Q, S, assertCentred, assertFreshNumbers, buildDeck, fitsCentred, freshNumberProblems, green, hintLine, LOOK, mathsGrid, mathsStack, quiet, type PairColumn } from "../decks/builder";
import { checkDeckContent } from "../decks/deckChecks";
import type { CuratedQuestion, DeckElement, Slide } from "../decks/types";

const renders = (latex: string) => katex.renderToString(latex.replace(/^\$|\$$/g, ""), { throwOnError: true, displayMode: false });
const q = (id: string, title: string): CuratedQuestion => Q.open(id, "t", "level1", title, "$1$", ["$1$"]);
const inside = (e: DeckElement) => e.x >= -1 && e.y >= -1 && e.x + e.w <= 1601 && e.y + e.h <= 901;

describe("maths strings", () => {
  it("a quiet note, a hint line, a stack and a grid all render, with an & in the text", () => {
    expect(() => renders(`$${quiet("(4 pairs)", "small")}$`)).not.toThrow();
    expect(() => renders(hintLine("Hint: 3 & 4 pairs"))).not.toThrow();
    expect(() => renders(mathsStack([[1, "×", 48], [3, "×", "\\Box"]]))).not.toThrow();
    expect(() => renders(mathsGrid([30, 45], [["1×30", "2×15"], ["1×45"]]))).not.toThrow();
    expect(() => renders(`$${green(6)}$`)).not.toThrow();
  });
  it("hints are grey and small, never black", () => {
    expect(quiet("x")).toContain(LOOK.grey);
    expect(hintLine("Hint")).toMatch(/\\tiny/);
  });
  it("a stack lines its rows up in columns, one pair to a line", () => {
    const s = mathsStack([[1, "×", 48], [2, "×", 24]]);
    expect(s).toContain("{rcl}");
    expect(s.match(/\\\\/g)?.length).toBe(1);
  });
  it("a grid puts the two numbers on one line as headings, with a rule under them", () => {
    const g = mathsGrid([30, 45], [["a"], ["b"]]);
    expect(g).toMatch(/\\mathbf\{30\}&\\mathbf\{45\}\\\\\\hline/);
  });
});

describe("centring", () => {
  it("a short question fits what the player centres, a long one does not", () => {
    expect(fitsCentred(["List all the factors of $48$."])).toBe(true);
    expect(fitsCentred(["x".repeat(171)])).toBe(false);
    expect(() => assertCentred(["x".repeat(200)], "test")).toThrow(/over the 170/);
  });
});

describe("slide pieces", () => {
  it("a whiteboard is full-width, inset, in the Teach family, at the standard size", () => {
    const slide = S.whiteboard("w", "Whiteboard", [q("a", "Factors of $48$")], "A brief for the slide.");
    const el = slide.els[0] as Extract<DeckElement, { kind: "questions" }>;
    expect(slide.family).toBe("teach");
    expect(el.presentation).toBeUndefined();                 // absent means full-width
    expect(el.size).toBe(LOOK.whiteboardSize);
    expect(el.x).toBe(LOOK.inset);
    expect(inside(el)).toBe(true);
    expect((S.whiteboard("w", "W", [q("a", "x $1$")], "brief", { table: true }).els[0] as { size: number }).size).toBe(LOOK.whiteboardTableSize);
  });
  it("plain book work is big, centred and fixed; the exit ticket is one question to a row", () => {
    const book = S.plainBook("b", [q("a", "Factors of $40$"), q("b", "Factors of $56$")], 3, "Copy into your book.", "Book work");
    const grid = book.els.find((e) => e.kind === "grid") as Extract<DeckElement, { kind: "grid" }> & { align?: string; fixed?: boolean; size?: number };
    expect(grid.align).toBe("center");
    expect(grid.fixed).toBe(true);
    expect(grid.size).toBe(LOOK.bookSize);
    const exit = S.exitRows("e", [q("c", "x $1$"), q("d", "y $2$")]);
    expect((exit.els.find((e) => e.kind === "grid") as { cols: number }).cols).toBe(1);
  });
  it("a two-number model keeps every element on the slide, with unique ids and a ring for each common value", () => {
    const cols: [PairColumn, PairColumn] = [{ head: 12, pairs: [[1, 12], [2, 6], [3, 4]] }, { head: 18, pairs: [[1, 18], [2, 9], [3, 6]] }];
    const slide = S.pairModel("m", "Find the common factors", "Which numbers are in both?", cols, [1, 2, 3, 6], [{ text: "Common factors: 1, 2, 3, 6", step: 3 }, { text: "Check", step: 4 }]);
    expect(slide.els.every(inside)).toBe(true);
    expect(new Set(slide.els.map((e) => e.id)).size).toBe(slide.els.length);
    expect(slide.els.filter((e) => e.kind === "shape").length).toBe(8);   // 1, 2, 3 and 6 are ringed in each list
  });
});

describe("fresh numbers", () => {
  const sections = { listing: [q("l1", "Factors of $48$"), q("l2", "Factors of $60$")], common: [q("c1", "Common factors of $30$ and $45$")] };
  it("passes when nothing repeats", () => {
    expect(freshNumberProblems({ worked: [24, 12, 18], sections, exit: [q("e1", "Factors of $54$")] })).toEqual([]);
    expect(() => assertFreshNumbers({ worked: [24], sections })).not.toThrow();
  });
  it("catches a worked number asked again", () => {
    expect(freshNumberProblems({ worked: [48], sections }).join("\n")).toMatch(/l1 asks about 48/);
    expect(() => assertFreshNumbers({ worked: [30], sections })).toThrow(/fresh-number rules broken/);
  });
  it("catches a number asked twice in one section, but allows it across sections", () => {
    const twice = { listing: [q("l1", "Factors of $48$"), q("l2", "Factors of $48$")] };
    expect(freshNumberProblems({ worked: [], sections: twice }).join("\n")).toMatch(/48 is asked about twice/);
    expect(freshNumberProblems({ worked: [], sections: { a: [q("a1", "Factors of $48$")], b: [q("b1", "HCF of $48$ and $60$")] } })).toEqual([]);
  });
  it("catches an exit ticket that reuses a number, and a pair asked twice", () => {
    expect(freshNumberProblems({ worked: [], sections, exit: [q("e1", "Factors of $60$")] }).join("\n")).toMatch(/exit ticket: e1 asks about 60/);
    const pairs = { a: [q("a1", "HCF of $32$ and $48$")], b: [q("b1", "Common factors of $48$ and $32$")] };
    expect(freshNumberProblems({ worked: [], sections: pairs }).join("\n")).toMatch(/asked about twice/);
  });
});

describe("deck checks that back the rules up", () => {
  const deck = async (slides: Slide[]) => buildDeck({ id: "t", title: "T", summary: "", slides });
  it("warns when a question asks about a number a slide already works through", async () => {
    const worked = S.board("w", "Rounding 48", "Round each.", { head: ["Given", "Answer"], given: 1, rows: [["$48$", "$50$"]] });
    const set = S.deliberate("s", "Practice", Array.from({ length: 5 }, (_, i) => Q.rounding(`r${i}`, i === 0 ? "48" : String(61 + i * 7), "level1")));
    const res = await checkDeckContent(await deck([worked, set]));
    expect(res.warnings.join("\n")).toMatch(/asks about 48, which a slide already shows or works through/);
  });
  it("warns when the same kind of slide has its title in a different place", async () => {
    const mk = (id: string, y: number) => S.board(id, "Title " + id, "Prompt for the class.", undefined).els.map((e) => (e.kind === "text" && e.bold ? { ...e, y } : e));
    const slides = [S.board("a", "A", "Prompt."), S.board("b", "B", "Prompt."), S.board("c", "C", "Prompt."), { ...S.board("d", "D", "Prompt."), els: mk("d", 20) as DeckElement[] }];
    const res = await checkDeckContent(await deck(slides));
    expect(res.warnings.join("\n")).toMatch(/the title sits at/);
  });
});
