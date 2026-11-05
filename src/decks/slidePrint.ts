// Printing slides to stick into a book: 1, 2, 4 or 8 to a sheet of A4. Pure layout sums only (the dialog draws the pages), so they can be tested.
import { CANVAS_H, CANVAS_W, type DeckDef, type DeckFamily, type Slide } from "./types";

export type PerPage = 1 | 2 | 4 | 8;
export const PER_PAGE: PerPage[] = [1, 2, 4, 8];

/** The page for each choice: the grid, and which way the paper turns so the slides fill it. 8 is two columns by four rows. */
export const PRINT_LAYOUTS: Record<PerPage, { cols: number; rows: number; landscape: boolean; label: string }> = {
  1: { cols: 1, rows: 1, landscape: true, label: "1 per page" },
  2: { cols: 1, rows: 2, landscape: false, label: "2 per page" },
  4: { cols: 2, rows: 2, landscape: true, label: "4 per page" },
  8: { cols: 2, rows: 4, landscape: false, label: "8 per page (2 × 4)" },
};

export const PAGE_MARGIN_MM = 6;
export const PAGE_GAP_MM = 3;
const A4 = { w: 210, h: 297 };
const MM_PX = 96 / 25.4;

/**
 * The size of one slide on the page, in millimetres, and the scale to draw the 1600 × 900 canvas at (in CSS pixels).
 * The usable area is shared out in equal slots (usableW / cols by usableH / rows); a slide is centred in its slot with
 * PAGE_GAP_MM of air to the slot edge on each side, so cutting along the slot boundaries (the cut lines) leaves every piece
 * the same, with the slide in the middle of it. Two to an A4 portrait page therefore cut exactly in half.
 */
export function cellSize(per: PerPage) {
  const l = PRINT_LAYOUTS[per];
  const pageW = l.landscape ? A4.h : A4.w, pageH = l.landscape ? A4.w : A4.h;
  const usableW = pageW - 2 * PAGE_MARGIN_MM, usableH = pageH - 2 * PAGE_MARGIN_MM;
  const slotW = usableW / l.cols, slotH = usableH / l.rows;
  const w = Math.min(slotW - PAGE_GAP_MM, (slotH - PAGE_GAP_MM) * (CANVAS_W / CANVAS_H));
  const h = (w * CANVAS_H) / CANVAS_W;
  return { wMm: w, hMm: h, slotWMm: slotW, slotHMm: slotH, scale: (w * MM_PX) / CANVAS_W, usableW, usableH };
}

/** Each slide `copies` times in a row (1 to MAX_COPIES), so the same slide can fill a sheet for cutting up. */
export const MAX_COPIES = 8;
export function repeatSlides<T>(items: T[], copies: number): T[] {
  const n = Math.max(1, Math.min(MAX_COPIES, Math.floor(copies) || 1));
  return items.flatMap((x) => Array.from({ length: n }, () => x));
}

/** Where the cut lines go on a page holding `count` slides: positions (mm from the top-left of the usable area) of lines between neighbouring slots, each only as long as the filled slots. */
export function cutLines(per: PerPage, count: number) {
  const l = PRINT_LAYOUTS[per], c = cellSize(per);
  const rowsUsed = Math.ceil(count / l.cols);
  const colsUsed = Math.min(l.cols, count);
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let r = 1; r < rowsUsed; r++) lines.push({ x1: 0, y1: r * c.slotHMm, x2: colsUsed * c.slotWMm, y2: r * c.slotHMm });
  for (let k = 1; k < colsUsed; k++) lines.push({ x1: k * c.slotWMm, y1: 0, x2: k * c.slotWMm, y2: rowsUsed * c.slotHMm });
  return lines;
}

/** Slides split into pages of `per`. */
export function pagesOf<T>(items: T[], per: PerPage): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += per) out.push(items.slice(i, i + per));
  return out;
}

/** The families that hold the points worth sticking in: what to learn and what to remember. */
export const KEY_FAMILIES: DeckFamily[] = ["teach", "language"];
export const keyPointSlides = (deck: Pick<DeckDef, "slides">): number[] => deck.slides.flatMap((s: Slide, i) => (KEY_FAMILIES.includes(s.family) ? [i] : []));

/** Where a slide sits in its slot: `centre` (every piece cuts out identical) or `edges` (outer rows and columns pushed to the page edge, so the spare paper falls between slides, at the cut, rather than round the outside). */
export type Spread = "centre" | "edges";
export function slotAlign(per: PerPage, index: number, spread: Spread): { alignSelf: string; justifySelf: string } {
  if (spread === "centre") return { alignSelf: "center", justifySelf: "center" };
  const l = PRINT_LAYOUTS[per], r = Math.floor(index / l.cols), c = index % l.cols;
  const pick = (i: number, n: number) => (n < 2 ? "center" : i === 0 ? "start" : i === n - 1 ? "end" : "center");
  return { alignSelf: pick(r, l.rows), justifySelf: pick(c, l.cols) };
}
