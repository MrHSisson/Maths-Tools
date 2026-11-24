// Printed picture sheets pinned to a lesson (src/decks/pictureSheet.ts, pictureWorksheet in src/shared/printables.ts): the Composite shapes worksheet.
import { describe, expect, it } from "vitest";
import { MAX_PICTURE_ITEMS, pictureSheetHtml, pictureSheetProblems, pictureSheetSlide, type PictureSheet, type PictureSheetItem } from "../decks/pictureSheet";
import { buildDeck } from "../decks/builder";
import { checkDeckContent } from "../decks/deckChecks";
import { pinnedSheets } from "../decks/worksheets";

const svg = (n: number) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg"><text>${n}</text></svg>`)}`;
const item = (i: number): PictureSheetItem => ({ src: svg(i), answerSrc: svg(i + 100), working: [`A: ${i} × 2 = ${i * 2} cm²`, "Total: 1 + 1 = 2 cm²"], answer: `Area = ${i} cm²` });
const sheet = (n = 8): PictureSheet => ({ title: "Composite <shapes>", note: "Work out each area.", items: Array.from({ length: n }, (_, i) => item(i)) });
const pages = (html: string) => html.match(/<section class="page">/g)?.length ?? 0;

describe("Picture sheet", () => {
  it("is four to an A4 page and at most eight, questions then answers", () => {
    expect([1, 4, 5, 8].map((n) => pages(pictureSheetHtml(sheet(n), "questions")))).toEqual([1, 1, 2, 2]);
    expect(pages(pictureSheetHtml(sheet(8), "both"))).toBe(4);
    expect(pages(pictureSheetHtml(sheet(8), "answers"))).toBe(2);
    expect(MAX_PICTURE_ITEMS).toBe(8);
    expect(pictureSheetProblems(sheet(8))).toEqual([]);
    expect(pictureSheetProblems(sheet(9)).join(" ")).toContain("the most is 8");
    expect(pictureSheetProblems({ title: "x", items: [] })).toContain("the sheet has no questions");
  });
  it("prints the picture, a working space and an Area line; the answer page has the picture with its pieces, the worked lines and the answer", () => {
    const q = pictureSheetHtml(sheet(2), "questions"), a = pictureSheetHtml(sheet(2), "answers");
    expect(q).toContain("Area = <i");
    expect(q).toContain('class="space"');
    expect(q).toContain("Name <i></i>");
    expect(q).not.toContain("A: 0 × 2");
    expect(a).toContain("A: 1 × 2 = 2 cm²");
    expect(a).toContain("Area = 1 cm²");
    expect(a).toContain("worked answers");
    expect(a).not.toContain("Name <i>");
    expect(a).toContain(svg(101));
  });
  it("escapes the title and takes only SVG images, never markup", () => {
    expect(pictureSheetHtml(sheet(1), "questions")).toContain("Composite &lt;shapes&gt;");
    const bad = sheet(1);
    bad.items[0].src = "https://example.com/x.png";
    bad.items[0].working = [""];
    bad.items[0].answer = " ";
    const problems = pictureSheetProblems(bad).join(" ");
    expect(problems).toContain("a picture must be an SVG image");
    expect(problems).toContain("the worked lines are missing");
    expect(problems).toContain("the answer is missing");
  });
  it("is a pinned worksheet and the deck check reports a bad one", async () => {
    const deck = await buildDeck({ id: "pic-sheet", title: "Picture sheet", summary: "", slides: [pictureSheetSlide("pic-s", sheet(8), "perimeter-and-area")] });
    expect(pinnedSheets(deck)).toHaveLength(1);
    expect((await checkDeckContent(deck)).problems.filter((p) => /picture|worked|answer|questions/i.test(p))).toEqual([]);
    const el = deck.slides[0].els[0] as { pictureSheet: PictureSheet };
    el.pictureSheet.items = [];
    expect((await checkDeckContent(deck)).problems.join(" ")).toContain("the sheet has no questions");
  });
});
