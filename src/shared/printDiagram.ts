// Diagram (SVG) worksheet printing — the page-fill model for diagram tools.
//
// Unlike text questions, an SVG diagram has no intrinsic height: it is a fixed
// aspect-ratio box that scales to whatever cell it is given. So we don't measure
// it in a probe DOM — we *derive* its needed height from the chosen column width
// (cell height = column width ÷ aspect), feed those synthetic heights to the same
// unit-tested computeWorksheetLayout engine the text path uses, and render the
// pages it plans. That gives diagram tools variable columns (= diagram size),
// sections, differentiated layout and arbitrary question counts for free —
// replacing the old fixed 3×5 = 15 preset.
//
// Because the heights are analytic, the entire layout is computed app-side and
// written as static HTML; there is no in-popup measurement script.

import type { AnyQuestion, PrintMode } from "./types";
import { computeWorksheetLayout } from "./worksheetLayout";

/** Context ToolShell passes alongside a custom print handler. */
export interface PrintContext {
  toolName: string;
  difficulty: string;
  isDifferentiated: boolean;
  numColumns: number;
  instruction: string;
  layout: "grid" | "list";
  showBorders: boolean;
}

const MARGIN_MM  = 12;
const HEADER_MM  = 14;
const GAP_MM     = 2;
const DIV_MM     = 4;
const HDR_MM     = 6;
const PAD_MM     = 2;
const PAGE_H_MM  = 297 - MARGIN_MM * 2;   // 273
const PAGE_W_MM  = 210 - MARGIN_MM * 2;   // 186
const usableH_MM = PAGE_H_MM - HEADER_MM; // 259
const diffHdrMM  = 7;
const pxPerMm    = 3.7795;

// Chrome added around the diagram inside a cell (padding + answer line),
// matching the engine's per-cell allowance (PAD*2 + 6).
const CHROME_MM = PAD_MM * 2 + 6;
// Density floor: pagination never demands more than this per diagram row, so a
// page packs ~5 rows like the old fixed grid. Cells still grow back toward the
// full column width when there are few questions (capped per segment below).
const DENSITY_FLOOR_MM = 40;

const makeCellW = (c: number) => (PAGE_W_MM - GAP_MM * (c - 1)) / c;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const meta = (q: AnyQuestion) => q as any;

export const handleDiagramPrint = (
  questions: AnyQuestion[],
  printMode: PrintMode,
  container: HTMLElement | null,
  ctx: PrintContext,
) => {
  const sectionIdx     = questions.map(q => (meta(q)._sectionIdx as number | undefined) ?? 0);
  const sectionColsArr = questions.map(q => (meta(q)._sectionCols as number | undefined) ?? ctx.numColumns);
  const sectionHeaders = questions.map(q => (meta(q)._sectionHeader as string | undefined) ?? "");
  const aspects        = questions.map(q => (meta(q)._aspect as number | undefined) ?? 1);
  const hasSections    = sectionIdx.some(s => s > 0) || sectionHeaders.some(h => !!h);

  let isDiff = ctx.isDifferentiated;
  if (ctx.difficulty === "advanced") isDiff = false;
  if (hasSections) isDiff = false;
  const cols = isDiff ? 3 : ctx.numColumns;

  // Synthetic per-question heights drive pagination. A diagram's *natural* box is
  // its column width (height = width / aspect), but we cap the value fed to the
  // engine at the density floor so the page stays dense (~5 rows) rather than
  // fitting only a few huge squares. Cells are grown back toward natural size at
  // render time (see the per-segment cap), so few-question sheets still get big
  // diagrams without floating in whitespace.
  const heightsPx = questions.map((_, i) => {
    const secCols = isDiff ? 3 : sectionColsArr[i];
    const naturalH = makeCellW(secCols) / aspects[i];
    return Math.min(naturalH, DENSITY_FLOOR_MM) * pxPerMm;
  });

  const plan = computeWorksheetLayout({
    isList: false, isDiff, hasSections, cols, totalQ: questions.length,
    heightsPx, sectionIdx, sectionCols: sectionColsArr,
    itemHasHeader: sectionHeaders.map(h => !!h),
    usableH: usableH_MM, GAP_MM, PAD_MM, DIV_MM, HDR_MM, diffHdrMM, pxPerMm,
  });

  // Clone the live on-screen SVGs, keyed by their data-q-index.
  const svgList: string[] = [];
  if (container) {
    container.querySelectorAll<SVGSVGElement>("svg[data-q-index]").forEach(el => {
      const clone = el.cloneNode(true) as SVGSVGElement;
      clone.setAttribute("width", "100%");
      clone.setAttribute("height", "100%");
      const idx = parseInt(el.getAttribute("data-q-index") ?? String(svgList.length), 10);
      svgList[idx] = clone.outerHTML;
    });
  }

  const toolName = ctx.toolName;
  const dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const cellHtml = (qi: number, displayNum: number, showAns: boolean, cW: number, cH: number): string =>
    `<div class="cell" style="width:${cW}mm;height:${cH}mm;">`
    + `<div class="cell-num">${displayNum}</div>`
    + `<div class="cell-diag">${svgList[qi] ?? ""}</div>`
    + (showAns ? `<div class="answer">${esc(questions[qi].answer ?? "")}</div>` : "")
    + `</div>`;

  const pageWrap = (title: string, metaLine: string, body: string): string =>
    `<div class="page"><div class="ph"><h1>${esc(title)}</h1>`
    + `<div class="meta">${metaLine}</div></div>${body}</div>`;

  // ── Section-aware grid page (also covers the no-section case as one segment) ──
  const gridPage = (pg: number[], pn: number, tp: number, showAns: boolean): string => {
    const segments: number[][] = [];
    let curSeg: number[] = [];
    let curSec = pg.length > 0 ? sectionIdx[pg[0]] : 0;
    for (const qi of pg) {
      if (sectionIdx[qi] !== curSec) { segments.push(curSeg); curSeg = []; curSec = sectionIdx[qi]; }
      curSeg.push(qi);
    }
    if (curSeg.length > 0) segments.push(curSeg);

    let out = "";
    segments.forEach((seg, sg) => {
      const header = sectionHeaders[seg[0]];
      if (sg > 0) out += `<div class="section-divider">${header ? `<span>${esc(header)}</span>` : ""}</div>`;
      else if (header) out += `<div class="section-header">${esc(header)}</div>`;
      const segCols = sectionColsArr[seg[0]];
      const segCW = makeCellW(segCols);
      // Fill the page (engine's page-filling height) but never exceed the
      // tallest natural diagram in the segment — so few-question pages grow the
      // diagrams up to the column width instead of stretching past it.
      const segNaturalH = segCW / Math.min(...seg.map(qi => aspects[qi]));
      const fillingH = plan.sectionCellH[sectionIdx[seg[0]]] ?? plan.chosenH_mm;
      const segH = Math.min(fillingH, segNaturalH + CHROME_MM);
      const cells = seg.map(qi => cellHtml(qi, qi + 1, showAns, segCW, segH)).join("");
      out += `<div class="grid" style="grid-template-columns:repeat(${segCols},${segCW}mm);grid-auto-rows:${segH}mm;">${cells}</div>`;
    });

    const title = toolName + (showAns ? " — Answers" : "");
    const pageLabel = tp > 1 ? ` &middot; Page ${pn} of ${tp}` : "";
    return pageWrap(title, `Worksheet &middot; ${dateStr}${pageLabel}`, out);
  };

  // ── Differentiated page: three level columns ──
  const lvls: ("level1" | "level2" | "level3")[] = ["level1", "level2", "level3"];
  const diffPage = (p: number, tp: number, showAns: boolean): string => {
    const cW = makeCellW(3);
    // Fill the column but cap at the natural diagram size (see gridPage).
    const natH = cW / Math.min(...aspects);
    const cH = Math.min(plan.diffCellH_mm, natH + CHROME_MM);
    const offsets: Record<string, number> = {};
    let run = 0;
    for (const lv of lvls) { offsets[lv] = run; run += questions.filter(q => q.difficulty === lv).length; }
    const colsHtml = lvls.map((lv, li) => {
      const textCol = ["#166534", "#854d0e", "#991b1b"][li];
      const bgCol = ["#dcfce7", "#fef9c3", "#fee2e2"][li];
      const label = ["Level 1", "Level 2", "Level 3"][li];
      const lvQ: number[] = [];
      questions.forEach((q, i) => { if (q.difficulty === lv) lvQ.push(i); });
      const slice = lvQ.slice(p * plan.diffRowsPerPage, (p + 1) * plan.diffRowsPerPage);
      const cells = slice.map((qi, i) => cellHtml(qi, p * plan.diffRowsPerPage + i + 1, showAns, cW, cH)).join("");
      return `<div class="dc"><div class="dh" style="color:${textCol};background:${bgCol}">${label}</div><div class="dcs">${cells}</div></div>`;
    }).join("");
    const title = toolName + (showAns ? " — Answers" : "");
    const pageLabel = tp > 1 ? ` &middot; Page ${p + 1} of ${tp}` : "";
    return pageWrap(title, `Differentiated &middot; ${dateStr}${pageLabel}`, `<div class="dg" style="grid-template-columns:repeat(3,${cW}mm);">${colsHtml}</div>`);
  };

  const build = (showAns: boolean): string => {
    if (isDiff) {
      const tp = plan.numDiffPages;
      return Array.from({ length: tp }, (_, p) => diffPage(p, tp, showAns)).join("");
    }
    const tp = plan.pages.length;
    return plan.pages.map((pg, i) => gridPage(pg, i + 1, tp, showAns)).join("");
  };

  const body = printMode === "questions" ? build(false)
             : printMode === "answers"   ? build(true)
             : build(false) + build(true);

  const cellBorder = ctx.showBorders ? ".3mm solid #d1d5db" : "none";

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(toolName)}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  @page{size:A4 portrait;margin:${MARGIN_MM}mm}
  body{font-family:"Segoe UI",Arial,sans-serif}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  .page{width:${PAGE_W_MM}mm;height:${PAGE_H_MM}mm;display:flex;flex-direction:column;page-break-after:always;overflow:hidden}
  .page:last-child{page-break-after:auto}
  .ph{display:flex;justify-content:space-between;align-items:baseline;border-bottom:.4mm solid #1e3a8a;padding-bottom:1.5mm;margin-bottom:2mm;flex-shrink:0}
  .ph h1{font-size:5mm;font-weight:700;color:#1e3a8a}
  .meta{font-size:3mm;color:#6b7280}
  .grid{display:grid;gap:${GAP_MM}mm;justify-content:start;align-content:start;margin-bottom:${GAP_MM}mm}
  .section-header{font-size:3.6mm;font-weight:700;color:#1e3a8a;margin:0 0 1.5mm}
  .section-divider{border-top:.3mm dashed #9ca3af;margin:1mm 0 2mm;height:0;position:relative}
  .section-divider span{position:absolute;top:1mm;left:0;font-size:3.4mm;font-weight:700;color:#1e3a8a}
  .dg{display:grid;gap:${GAP_MM}mm;flex:1;min-height:0;align-content:start}
  .dc{display:flex;flex-direction:column;gap:${GAP_MM}mm;min-height:0}
  .dh{text-align:center;font-size:3.5mm;font-weight:700;padding:1.5mm 0;border-radius:1.5mm;flex-shrink:0}
  .dcs{display:flex;flex-direction:column;gap:${GAP_MM}mm}
  .cell{border:${cellBorder};border-radius:2mm;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:${PAD_MM}mm;overflow:hidden;position:relative}
  .cell-num{position:absolute;top:1.5mm;left:2mm;font-size:2.8mm;font-weight:700;color:#374151}
  .cell-diag{width:100%;flex:1;min-height:0;display:flex;align-items:center;justify-content:center;overflow:hidden}
  .cell-diag svg{width:100%;height:100%;overflow:visible}
  .answer{font-size:3mm;font-weight:700;color:#059669;text-align:center;flex-shrink:0;margin-top:1mm}
</style>
</head><body>${body}</body></html>`;

  const win = window.open("", "_blank");
  if (!win) { alert("Please allow popups to use the PDF export."); return; }
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 400);
};
