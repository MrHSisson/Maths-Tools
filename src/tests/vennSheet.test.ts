// Printed Venn sheets pinned to a lesson (src/decks/vennSheet.ts, vennWorksheet in src/shared/printables.ts).
import { describe, expect, it } from "vitest";
import { MAX_VENN_GRID_ITEMS, MAX_VENN_ITEMS, factorisation, vennItemSvg, vennSheetCells, vennSheetHtml, vennSheetProblems, vennSheetSlide, type VennSheet } from "../decks/vennSheet";
import { buildDeck } from "../decks/builder";
import { checkDeckContent } from "../decks/deckChecks";
import { pinnedSheets } from "../decks/worksheets";

const pairs: [number, number][] = [[12, 18], [8, 12], [9, 18], [8, 15], [20, 30], [24, 36], [10, 21], [16, 40], [30, 45]];
const sheet = (n = 6, lines = false): VennSheet => ({ title: "Venn Sheet <1>", note: "Put each prime factor in the right part.", items: pairs.slice(0, n).map(([a, b], i) => ({ a, b, lines, placed: i < 2 ? ["middle"] : [] })) });
const pages = (html: string) => html.match(/<section class="page">/g)?.length ?? 0;
const tiles = (svg: string) => svg.match(/<text [^>]*font-size="40"/g)?.length ?? 0;

describe("Venn sheet", () => {
  it("is three Venns to a page and no more than nine", () => {
    expect([1, 3, 4, 6, 9].map((n) => pages(vennSheetHtml(sheet(n), "questions")))).toEqual([1, 1, 2, 2, 3]);
    expect(MAX_VENN_ITEMS).toBe(9);
    expect(vennSheetProblems(sheet(9))).toEqual([]);
    expect(vennSheetProblems({ ...sheet(9), items: [...sheet(9).items, { a: 6, b: 10 }] }).join(" ")).toContain("the most is 9");
    expect(vennSheetProblems({ title: "x", items: [] })).toContain("the sheet has no Venns");
  });
  it("the tall 2 x 2 sheet is four to a page, up to twelve, with a working line each for the HCF and the LCM", () => {
    const more = (n: number): VennSheet => ({ title: "Tall", grid: true, items: Array.from({ length: n }, (_, i) => ({ a: 12, b: 18 + i * 0, lines: true })) });
    expect([1, 4, 5, 8, 12].map((n) => pages(vennSheetHtml(more(n), "questions")))).toEqual([1, 1, 2, 2, 3]);
    expect(MAX_VENN_GRID_ITEMS).toBe(12);
    expect(vennSheetProblems(more(12))).toEqual([]);
    expect(vennSheetProblems(more(13)).join(" ")).toContain("the most is 12");
    expect(vennSheetProblems({ ...more(10), grid: false }).join(" ")).toContain("the most is 9");
    const q = vennSheetHtml(more(4), "questions");
    expect(q).toContain('class="rows grid"');
    expect(q).toContain("HCF = <i></i>");
    expect(q).toContain("LCM = <i></i>");
    expect(vennSheetHtml(sheet(3), "questions")).not.toContain("rows grid");
  });
  it("rejects a pair that cannot make a Venn", () => {
    expect(vennSheetProblems({ title: "x", items: [{ a: 1, b: 6 }] }).join(" ")).toContain("cannot go in a Venn");
  });
  it("draws only the placed tiles on the question and every tile on the answer", () => {
    const it = { a: 12, b: 18, placed: ["middle" as const] };       // 2 × 3 shared; 2 left; 3 right
    expect(tiles(vennItemSvg(it, false))).toBe(2);
    expect(tiles(vennItemSvg(it, true))).toBe(4);
    expect(tiles(vennItemSvg({ a: 12, b: 18 }, false))).toBe(0);
  });
  it("prints the numbers, the factorisations and the answer lines", () => {
    expect(factorisation(12)).toBe("12 = 2 × 2 × 3");
    expect(factorisation(7)).toBe("7 is prime");
    const q = vennSheetHtml(sheet(3, true), "questions"), a = vennSheetHtml(sheet(3, true), "answers");
    expect(q).toContain("12 = 2 × 2 × 3");
    expect(q).toContain("HCF = <i></i>");
    expect(q).not.toContain("HCF = 2 × 3 = 6");
    expect(a).toContain("HCF = 2 × 3 = 6");
    expect(a).toContain("LCM = 2 × 2 × 3 × 3 = 36");
    expect(a).toContain("answers");
    expect(pages(vennSheetHtml(sheet(3), "both"))).toBe(2);
    expect(vennSheetCells({ ...sheet(1), items: [{ a: 12, b: 18, factors: false }] })[0].factors).toEqual([]);
  });
  it("escapes what it prints", () => {
    expect(vennSheetHtml(sheet(1), "questions")).toContain("Venn Sheet &lt;1&gt;");
  });
  it("is pinned to the lesson and passes the deck checks; a long sheet is reported", async () => {
    const deck = await buildDeck({ id: "test", title: "Test", summary: "", tool: "hcf-and-lcm", slides: [vennSheetSlide("v-sheet", sheet(), "hcf-and-lcm")] });
    expect(pinnedSheets(deck).map((p) => p.el.pin?.title)).toEqual(["Venn Sheet <1>"]);
    expect((await checkDeckContent(deck)).problems).toEqual([]);
    const long = { ...sheet(9), items: [...sheet(9).items, { a: 6, b: 10 }] };
    const bad = await buildDeck({ id: "test", title: "Test", summary: "", tool: "hcf-and-lcm", slides: [vennSheetSlide("v-long", long, "hcf-and-lcm")] });
    expect((await checkDeckContent(bad)).problems.join(" ")).toContain("the most is 9");
  });
});
