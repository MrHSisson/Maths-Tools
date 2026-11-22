// A printed sheet of Venn diagrams pinned to a lesson (the Venn, HCF and LCM lesson's two worksheets). Each Venn is only two numbers: the
// tiles are worked out from their prime factors (`splitPrimes`), so a printed Venn cannot be wrong. Three to an A4 page and at most nine a
// sheet, because Harry prints the page scaled from A4 to A5. The drawing is the slide piece's, as a static SVG string (the same card layout,
// colours and sizes), so the slide, the editor and the paper agree. It is a worksheet element with `vennSheet` set.
import type { PrintMode } from "../shared";
import { openPrintWindow } from "../shared/print";
import { vennWorksheet } from "../shared/printables";
import { hcfLine, lcmLine, primeFactors, splitPrimes, tileColour, vennProblems, type VennRegions } from "../shared/venn";
import type { DeckElement, Slide, VennCard } from "./types";
import { BOX_H, BOX_W, CIRCLE_R, CIRCLE_Y, LEFT_C, LEFT_X, RIGHT_C, RIGHT_X, layoutCards } from "./vennLayout";

type Part = "left" | "middle" | "right";
interface VennSheetItem {
  a: number;
  b: number;
  /** The parts whose tiles are already printed (the fade: the first Venns carry more). Absent or empty: an empty Venn to fill. */
  placed?: Part[];
  /** The factorisations are printed beside the Venn (true unless set false). */
  factors?: boolean;
  /** An "HCF =" and an "LCM =" line under the Venn to fill in. */
  lines?: boolean;
}
export interface VennSheet {
  title: string;
  /** A line under the title, such as "Put each prime factor in the right part of the Venn." */
  note?: string;
  items: VennSheetItem[];
}

export const MAX_VENN_ITEMS = 9;

const regionsFor = (it: VennSheetItem): VennRegions => splitPrimes(it.a, it.b);

/** What is wrong with a Venn sheet, in plain words (empty when it is sound). */
export function vennSheetProblems(sheet: VennSheet): string[] {
  const problems: string[] = [];
  if (!sheet.items.length) problems.push("the sheet has no Venns");
  if (sheet.items.length > MAX_VENN_ITEMS) problems.push(`the sheet has ${sheet.items.length} Venns; the most is ${MAX_VENN_ITEMS} (three to a page, three pages, printed scaled to A5)`);
  sheet.items.forEach((it, i) => vennProblems(it.a, it.b).forEach((p) => problems.push(`Venn ${i + 1}: ${p}`)));
  return problems;
}

/** `12 = 2 × 2 × 3`; a prime says so. */
export const factorisation = (n: number): string => (primeFactors(n).length === 1 ? `${n} is prime` : `${n} = ${primeFactors(n).join(" × ")}`);

const text = (x: number, y: number, size: number, weight: number, fill: string, anchor: string, s: string | number) =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${fill}" font-family="'Segoe UI',Arial,sans-serif">${s}</text>`;

/** The Venn as a static SVG: the box, the two circles labelled with their numbers and the tiles that are placed (every tile when `answers`). */
export function vennItemSvg(it: VennSheetItem, answers: boolean): string {
  const r = regionsFor(it), shown = answers ? ["left", "middle", "right"] as Part[] : it.placed ?? [];
  const cards: VennCard[] = shown.flatMap((part) => r[part].map((n) => ({ text: String(n), tile: true, region: part })));
  const at = layoutCards(cards);
  let b = `<rect x="3" y="3" width="${BOX_W - 6}" height="${BOX_H - 6}" rx="14" fill="white" stroke="#94a3b8" stroke-width="3"/>`
    + `<circle cx="${LEFT_X}" cy="${CIRCLE_Y}" r="${CIRCLE_R}" fill="${LEFT_C}" fill-opacity="0.07" stroke="${LEFT_C}" stroke-width="4"/>`
    + `<circle cx="${RIGHT_X}" cy="${CIRCLE_Y}" r="${CIRCLE_R}" fill="${RIGHT_C}" fill-opacity="0.07" stroke="${RIGHT_C}" stroke-width="4"/>`
    + text(LEFT_X - 60, CIRCLE_Y - CIRCLE_R - 14, 44, 700, LEFT_C, "middle", it.a) + text(RIGHT_X + 60, CIRCLE_Y - CIRCLE_R - 14, 44, 700, RIGHT_C, "middle", it.b);
  cards.forEach((c, i) => {
    const p = at[i];
    b += `<g transform="translate(${p.x - p.w / 2} ${p.y - p.h / 2})"><rect width="${p.w}" height="${p.h}" rx="10" fill="${tileColour(Number(c.text))}"/>${text(p.w / 2, p.h / 2 + 14.4, 40, 700, "#fff", "middle", c.text)}</g>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BOX_W} ${BOX_H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="A Venn diagram of ${it.a} and ${it.b}">${b}</svg>`;
}

/** What each Venn on the page needs: its drawing (with and without the answer), its factorisations and its answer lines. */
export function vennSheetCells(sheet: VennSheet) {
  return sheet.items.map((it) => {
    const r = regionsFor(it);
    return { a: it.a, b: it.b, svg: vennItemSvg(it, false), answerSvg: vennItemSvg(it, true),
      factors: it.factors === false ? [] : [factorisation(it.a), factorisation(it.b)],
      lines: !!it.lines, answers: [hcfLine(r), lcmLine(r)] };
  });
}

export const vennSheetHtml = (sheet: VennSheet, mode: PrintMode): string => vennWorksheet(vennSheetCells(sheet), sheet.title, sheet.note, mode);

/** Opens the print window from the print button (nothing asynchronous before it, so the browser allows it). */
export function printVennSheet(sheet: VennSheet, mode: PrintMode): void {
  openPrintWindow(vennSheetHtml(sheet, mode), 900);
}

/** A slide holding a Venn sheet, pinned so File > Worksheets and the player's Print buttons find it. The slide shows the Venns; `a` shows the answers. */
export function vennSheetSlide(id: string, sheet: VennSheet, tool: string): Slide {
  const el = { id: `${id}-1`, kind: "worksheet", x: 40, y: 30, w: 1520, h: 840, tool, preset: { sub: "converting", level: "level1" }, count: sheet.items.length, cols: 3,
    pin: { title: sheet.title, paper: "A4", layout: "grid", borders: false }, vennSheet: sheet } as DeckElement;
  return { id, family: "practice", title: sheet.title, els: [el] };
}

