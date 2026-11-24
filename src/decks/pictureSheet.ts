// A printed worksheet of picture questions pinned to a lesson (the Composite shapes worksheet). Each question is an authored picture (kept as an
// image, never as HTML), the same picture with its working drawn in, the worked lines and the answer. Four to an A4 page and at most eight a
// sheet here (two pages), made to be printed scaled to A5. It is a worksheet element with `pictureSheet` set.
import type { PrintMode } from "../shared";
import { openPrintWindow } from "../shared/print";
import { pictureWorksheet } from "../shared/printables";
import type { DeckElement, Slide } from "./types";

export interface PictureSheetItem {
  /** The picture as the pupil sees it: a `data:image/svg+xml` image. */
  src: string;
  /** The same picture with the pieces drawn in, for the answer page and for the slide when answers are shown (the picture itself when absent). */
  answerSrc?: string;
  /** The worked lines, in plain text. */
  working: string[];
  /** The final answer, such as "Area = 63 cm²". */
  answer: string;
}
export interface PictureSheet { title: string; /** A line under the title. */ note?: string; items: PictureSheetItem[] }

/** Two A4 pages of four. */
export const MAX_PICTURE_ITEMS = 8;

/** What is wrong with a picture sheet, in plain words (empty when it is sound). */
export function pictureSheetProblems(sheet: PictureSheet): string[] {
  const problems: string[] = [];
  if (!sheet.items.length) problems.push("the sheet has no questions");
  if (sheet.items.length > MAX_PICTURE_ITEMS) problems.push(`the sheet has ${sheet.items.length} questions; the most is ${MAX_PICTURE_ITEMS} (four to a page, two pages)`);
  sheet.items.forEach((it, i) => {
    const n = `question ${i + 1}`;
    for (const src of [it.src, it.answerSrc]) if (src !== undefined && !/^data:image\/svg\+xml/.test(src)) problems.push(`${n}: a picture must be an SVG image`);
    if (!it.working.length || it.working.some((l) => !l.trim())) problems.push(`${n}: the worked lines are missing`);
    if (!it.answer.trim()) problems.push(`${n}: the answer is missing`);
  });
  return problems;
}

export const pictureSheetHtml = (sheet: PictureSheet, mode: PrintMode): string =>
  pictureWorksheet(sheet.items.map((it) => ({ src: it.src, answerSrc: it.answerSrc ?? it.src, working: it.working, answer: it.answer })), sheet.title, sheet.note, mode);

/** Opens the print window from the print button (nothing asynchronous before it, so the browser allows it). */
export function printPictureSheet(sheet: PictureSheet, mode: PrintMode): void {
  openPrintWindow(pictureSheetHtml(sheet, mode), 900);
}

/** A slide holding a picture sheet, pinned so File > Worksheets and the player's Print buttons find it. The slide shows the pictures; `a` shows the answers. */
export function pictureSheetSlide(id: string, sheet: PictureSheet, tool: string): Slide {
  const el = { id: `${id}-1`, kind: "worksheet", x: 40, y: 30, w: 1520, h: 840, tool, preset: { sub: "compound", level: "level1" }, count: sheet.items.length, cols: 4,
    pin: { title: sheet.title, paper: "A4", layout: "grid", borders: false }, pictureSheet: sheet } as DeckElement;
  return { id, family: "practice", title: sheet.title, els: [el] };
}
