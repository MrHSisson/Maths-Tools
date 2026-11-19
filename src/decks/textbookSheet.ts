// A textbook-style worksheet pinned to a lesson (Harry, 2026-11-17, after the Corbett Maths standard-form sheet): a title, then numbered
// questions, each an instruction and its parts (a), (b), (c) ... laid out in columns with nothing to write in. Pupils work in their books, so
// the sheet is only the numbers, set large and evenly so that they can be read and counted. Printed on A4 (File > Worksheets, or the player's
// Print sheet) with an answer page, and shown on the slide with the answers on a click. It is a worksheet element with `textbook` set.
import type { PrintMode } from "../shared";
import { openPrintWindow } from "../shared/print";
import type { DeckElement, Slide } from "./types";

interface TextbookBlock {
  /** "Write each of the following numbers in standard form." The question number is added. */
  instruction: string;
  /** One maths string (KaTeX, no dollar signs) per part, in the order (a), (b), (c) ... */
  parts: string[];
  /** The answer to each part, in the same order. */
  answers: string[];
  /** Columns for this question; the sheet's `cols` (default 4) when absent. */
  cols?: number;
}
export interface TextbookSheet {
  title: string;
  /** A line under the title, such as "Write your answers in your book." */
  note?: string;
  blocks: TextbookBlock[];
  cols?: number;
}

/** (a) ... (z), then (aa), (ab) ... */
export const partLetter = (i: number): string => (i < 26 ? String.fromCharCode(97 + i) : partLetter(Math.floor(i / 26) - 1) + String.fromCharCode(97 + (i % 26)));
export const blockCols = (sheet: TextbookSheet, b: TextbookBlock) => b.cols ?? sheet.cols ?? 4;

/** What is wrong with a textbook sheet, in plain words (empty when it is sound). */
export function textbookProblems(sheet: TextbookSheet): string[] {
  const problems: string[] = [];
  if (!sheet.blocks.length) problems.push("the sheet has no questions");
  sheet.blocks.forEach((b, i) => {
    if (!b.instruction.trim()) problems.push(`question ${i + 1} has no instruction`);
    if (b.parts.length < 5) problems.push(`question ${i + 1} has ${b.parts.length} parts; the least is 5`);
    if (b.parts.length !== b.answers.length) problems.push(`question ${i + 1} has ${b.parts.length} parts but ${b.answers.length} answers`);
    if ([...b.parts, ...b.answers].some((s) => !s.trim())) problems.push(`question ${i + 1} has an empty part or answer`);
  });
  return problems;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const maths = (latex: string) => `<span class="m" data-latex="${esc(latex)}"></span>`;

/** The printable page: the questions, the answers, or both (answers start a new page). A4 portrait, KaTeX from the same CDN the tool printing uses. */
export function textbookSheetHtml(sheet: TextbookSheet, mode: PrintMode, paper: "A4" | "A5" = "A4"): string {
  const section = (answers: boolean) => `<section class="page${answers ? " ans" : ""}">
  <h1>${esc(sheet.title)}${answers ? " <span>Answers</span>" : ""}</h1>
  ${!answers && sheet.note ? `<p class="note">${esc(sheet.note)}</p>` : ""}
  ${sheet.blocks.map((b, bi) => `<div class="q"><p class="qh"><b>Question ${bi + 1}:</b> ${esc(b.instruction)}</p>
    <div class="parts" style="grid-template-columns:repeat(${blockCols(sheet, b)},1fr)">${b.parts.map((part, i) => `<div class="part"><span class="l">(${partLetter(i)})</span>${maths(answers ? b.answers[i] : part)}</div>`).join("")}</div></div>`).join("")}
</section>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(sheet.title)}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"><\/script>
<style>
  *{box-sizing:border-box} @page{size:${paper} portrait;margin:14mm 14mm 12mm}
  body{margin:0;font-family:"Segoe UI",Arial,sans-serif;color:#0f172a;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{break-after:page} .page:last-child{break-after:auto}
  h1{font-size:${paper === "A4" ? 24 : 20}px;margin:0 0 2mm;padding-bottom:2mm;border-bottom:.5mm solid #1e3a8a;color:#1e3a8a;font-weight:700} h1 span{font-weight:400;color:#64748b;font-size:.7em;margin-left:4mm}
  .note{margin:0 0 5mm;font-size:13px;color:#64748b}
  .q{margin-top:${paper === "A4" ? 9 : 6}mm;break-inside:avoid}
  .qh{margin:0 0 4mm;font-size:${paper === "A4" ? 17 : 14}px}
  .parts{display:grid;column-gap:9mm;row-gap:${paper === "A4" ? 7.4 : 4.6}mm}
  .part{display:flex;align-items:baseline;gap:2mm;font-size:${paper === "A4" ? 20 : 15}px;white-space:nowrap}
  .l{color:#64748b;font-size:.72em;font-weight:600;min-width:8mm}
  .ans .m{color:#1e3a8a}
  .m .katex{font-size:1.08em}
</style></head><body>${mode !== "answers" ? section(false) : ""}${mode !== "questions" ? section(true) : ""}
<script>document.querySelectorAll('.m').forEach(function(e){try{katex.render(e.getAttribute('data-latex'),e,{throwOnError:false})}catch(x){e.textContent=e.getAttribute('data-latex')}});<\/script>
</body></html>`;
}

/** Opens the print window from the print button (nothing asynchronous before it, so the browser allows it). */
export function printTextbookSheet(sheet: TextbookSheet, mode: PrintMode): void {
  openPrintWindow(textbookSheetHtml(sheet, mode), 900);
}

/** A slide holding a textbook sheet, pinned so File > Worksheets and the player's Print buttons find it. The slide shows the sheet; `a` shows the answers. */
export function textbookSheetSlide(id: string, sheet: TextbookSheet, tool: string): Slide {
  const count = sheet.blocks.reduce((n, b) => n + b.parts.length, 0);
  const el = { id: `${id}-1`, kind: "worksheet", x: 40, y: 30, w: 1520, h: 840, tool, preset: { sub: "converting", level: "level1" }, count, cols: sheet.cols ?? 4,
    pin: { title: sheet.title, paper: "A4", layout: "grid", borders: false }, textbook: sheet } as DeckElement;
  return { id, family: "retrieval", title: sheet.title, els: [el] };
}
