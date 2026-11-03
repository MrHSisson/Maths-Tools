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

export const PAGE_MARGIN_MM = 10;
export const PAGE_GAP_MM = 4;
const A4 = { w: 210, h: 297 };
const MM_PX = 96 / 25.4;

/** The size of one slide on the page, in millimetres, and the scale to draw the 1600 × 900 canvas at (in CSS pixels). */
export function cellSize(per: PerPage) {
  const l = PRINT_LAYOUTS[per];
  const pageW = l.landscape ? A4.h : A4.w, pageH = l.landscape ? A4.w : A4.h;
  const usableW = pageW - 2 * PAGE_MARGIN_MM, usableH = pageH - 2 * PAGE_MARGIN_MM;
  const w = Math.min((usableW - PAGE_GAP_MM * (l.cols - 1)) / l.cols, ((usableH - PAGE_GAP_MM * (l.rows - 1)) / l.rows) * (CANVAS_W / CANVAS_H));
  const h = (w * CANVAS_H) / CANVAS_W;
  return { wMm: w, hMm: h, scale: (w * MM_PX) / CANVAS_W, usableW, usableH };
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
