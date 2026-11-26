// The worded book sheet pinned to a lesson (src/decks/bookSheet.ts): the Sharing in a Ratio worksheet, four lettered parts on two A4 pages.
import { describe, expect, it } from "vitest";
import { bookHtml, bookSheetHtml, bookSheetProblems, bookSheetSlide, itemLetter, MAX_BOOK_QUESTIONS, questionNumber, shownParts, type BookSheet } from "../decks/bookSheet";
import { buildDeck } from "../decks/builder";
import { checkDeckContent } from "../decks/deckChecks";
import { pinnedSheets } from "../decks/worksheets";

const part = (id: string, n: number) => ({ id, title: `Part <${id}>`, tip: "Divide $80 \\div 8$.", items: Array.from({ length: n }, (_, i) => ({ text: `Share $£${i + 10}$ in the ratio $2 : 3$.`, answer: `£${i}` })) });
const sheet = (): BookSheet => ({ title: "Ratio <sheet>", note: "Work in your book.", parts: [part("a", 9), part("b", 9), part("c", 9), part("d", 15)] });

describe("Book sheet", () => {
  it("numbers each part as a question and its items as (a), (b), (c) ...", () => {
    expect([0, 1, 3].map(questionNumber)).toEqual([1, 2, 4]);
    expect([0, 1, 8, 26].map(itemLetter)).toEqual(["(a)", "(b)", "(i)", "(aa)"]);
    const h = bookSheetHtml(sheet(), "questions");
    expect(h).toContain('data-n="(a)"');
    expect(h).toContain('data-n="(o)"');
    expect(h).not.toContain('data-n="1"');
  });
  it("prints questions (the first half of the parts on page 1, the rest on page 2) and a separate answer page", () => {
    const q = bookSheetHtml(sheet(), "questions"), a = bookSheetHtml(sheet(), "answers"), both = bookSheetHtml(sheet(), "both");
    expect(q.match(/<section class="page"/g)).toHaveLength(2);
    expect(a.match(/<section class="page ans"/g)).toHaveLength(1);
    expect(both.match(/<section class="page/g)).toHaveLength(3);
    expect(q).toContain("Share ");
    expect(q).not.toContain("£8</li>");
    expect(a).toContain(">£8</li>");
    expect(a).not.toContain("Divide");
    expect(q.split('<section class="page">')[1]).toContain("Part &lt;b&gt;");
    expect(q.split('<section class="page">')[2]).toContain("Part &lt;c&gt;");
    expect(q.split('<section class="page">')[2]).not.toContain("Part &lt;b&gt;");
  });
  it("escapes titles and wording; maths goes between dollar signs", () => {
    const h = bookSheetHtml(sheet(), "questions");
    expect(h).toContain("Ratio &lt;sheet&gt;");
    expect(h).toContain("Part &lt;a&gt;");
    expect(bookHtml("a <b> $x < 2$")).toBe('a &lt;b&gt; <span class="m" data-latex="x &lt; 2"></span>');
    expect(bookHtml("in $2 : 5$. Next")).toContain("</span>\u2060. Next");   // a full stop never wraps away from the ratio before it
  });
  it("checks the sheet: a size limit, ids, empty text, and a slide that names a part the sheet lacks", () => {
    expect(bookSheetProblems(sheet())).toEqual([]);
    expect(MAX_BOOK_QUESTIONS).toBe(48);
    const big = sheet(); big.parts.push(part("e", 7));
    expect(bookSheetProblems(big).join(" ")).toContain("the most is 48");
    const bad = sheet(); bad.parts[0].items[0].answer = " "; bad.show = ["z"];
    const text = bookSheetProblems(bad).join(" ");
    expect(text).toContain("no wording or no answer");
    expect(text).toContain("(z)");
    expect(bookSheetProblems({ title: "x", parts: [] })).toContain("the sheet has no parts");
  });
  it("shows only the parts a slide names, while the print keeps them all", () => {
    const s = { ...sheet(), show: ["c"] };
    expect(shownParts(s).map(({ p }) => p.id)).toEqual(["c"]);
    expect(bookSheetHtml(s, "questions")).toContain("Part &lt;a&gt;");
  });
  it("is a pinned worksheet only when asked, and the deck check reports a bad one", async () => {
    const deck = await buildDeck({ id: "book-sheet", title: "Book sheet", summary: "", slides: [bookSheetSlide("bk-1", { ...sheet(), show: ["a"] }, "ratio-sharing"), bookSheetSlide("bk-2", { ...sheet(), show: ["d"] }, "ratio-sharing", { pinned: true })] });
    expect(pinnedSheets(deck)).toHaveLength(1);
    expect((await checkDeckContent(deck)).problems.filter((p) => /sheet|part|maths|wording/i.test(p))).toEqual([]);
    const el = deck.slides[0].els[0] as { bookSheet: BookSheet };
    el.bookSheet.parts[0].items[0].text = "Find $\\frac{1$.";
    expect((await checkDeckContent(deck)).problems.join(" ")).toContain("maths does not render");
  });
});
