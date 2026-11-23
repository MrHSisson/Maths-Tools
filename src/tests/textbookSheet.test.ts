// Textbook-style printed worksheets pinned to a lesson (src/decks/textbookSheet.ts).
import { describe, expect, it } from "vitest";
import { blockCols, partLetter, textbookProblems, textbookSheetHtml, textbookSheetSlide, type TextbookSheet } from "../decks/textbookSheet";
import { buildDeck } from "../decks/builder";
import { checkDeckContent } from "../decks/deckChecks";
import { pinnedSheets } from "../decks/worksheets";

const sheet = (n = 6): TextbookSheet => ({
  title: "Standard Form: Sheet 1", note: "Write your answers in your book.",
  blocks: [{ instruction: "Write each of the following numbers in standard form.", parts: Array.from({ length: n }, (_, i) => `${i + 2}\\,000`), answers: Array.from({ length: n }, (_, i) => `${i + 2} \\times 10^{3}`) }],
});

describe("textbook sheet", () => {
  it("lettered parts run a to z and then aa, ab", () => {
    expect([0, 1, 25, 26, 27, 51, 52].map(partLetter)).toEqual(["a", "b", "z", "aa", "ab", "az", "ba"]);
  });
  it("says what is wrong with a sheet", () => {
    expect(textbookProblems(sheet())).toEqual([]);
    expect(textbookProblems({ title: "x", blocks: [] })).toContain("the sheet has no questions");
    const bad = sheet(); bad.blocks[0].answers.pop();
    expect(textbookProblems(bad).join(" ")).toContain("6 parts but 5 answers");
    expect(textbookProblems(sheet(4)).join(" ")).toContain("the least is 5");
    const few = sheet(2); few.blocks[0].few = true;
    expect(textbookProblems(few)).toEqual([]);
  });
  it("numbers the questions from firstQuestion", () => {
    expect(textbookSheetHtml({ ...sheet(), firstQuestion: 4 }, "questions")).toContain("<b>Question 4:</b>");
  });
  it("prints the questions, the answers, or both on separate pages", () => {
    const q = textbookSheetHtml(sheet(), "questions"), a = textbookSheetHtml(sheet(), "answers"), both = textbookSheetHtml(sheet(), "both");
    expect(q).toContain("<b>Question 1:</b> Write each of the following numbers in standard form.");
    expect(q).toContain("(a)");
    expect(q).toContain('data-latex="2\\,000"');
    expect(q).not.toContain("2 \\times 10^{3}");
    expect(a).toContain('data-latex="2 \\times 10^{3}"');
    expect(a).toContain("Answers");
    expect(both.match(/<section class="page/g)).toHaveLength(2);
  });
  it("escapes what it prints", () => {
    const s = sheet(); s.title = "A <b>&"; s.blocks[0].instruction = "Say \"hi\"";
    const html = textbookSheetHtml(s, "questions");
    expect(html).toContain("A &lt;b&gt;&amp;");
    expect(html).toContain("Say &quot;hi&quot;");
  });
  it("is four columns unless the sheet or the question says otherwise", () => {
    expect(blockCols(sheet(), sheet().blocks[0])).toBe(4);
    expect(blockCols({ ...sheet(), cols: 3 }, sheet().blocks[0])).toBe(3);
    expect(blockCols(sheet(), { ...sheet().blocks[0], cols: 2 })).toBe(2);
  });
  it("is pinned to the lesson, passes the deck checks, and a short question is reported", async () => {
    const slide = textbookSheetSlide("t-sheet", sheet(), "standard-form");
    const deck = await buildDeck({ id: "test", title: "Test", summary: "", tool: "standard-form", slides: [slide] });
    expect(pinnedSheets(deck).map((p) => p.el.pin?.title)).toEqual(["Standard Form: Sheet 1"]);
    expect((await checkDeckContent(deck)).problems).toEqual([]);
    const short = await buildDeck({ id: "test", title: "Test", summary: "", tool: "standard-form", slides: [textbookSheetSlide("t-short", sheet(3), "standard-form")] });
    expect((await checkDeckContent(short)).problems.join(" ")).toContain("the least is 5");
  });
});
