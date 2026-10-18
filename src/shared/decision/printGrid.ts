// A blank squared grid to print, for plotting a resource histogram or a cascade (Gantt) chart by hand: 50 squares across, 20 up, two to a page,
// a heavier line every 5 squares, and nothing else (students add their own scales, axes and labels).

const COLS = 50, ROWS = 20;

function gridSvg(sq: number): string {
  const w = COLS * sq, h = ROWS * sq;
  const minor: string[] = [], major: string[] = [];
  for (let c = 0; c <= COLS; c++) (c % 5 === 0 ? major : minor).push(`M${c * sq},0V${h}`);
  for (let r = 0; r <= ROWS; r++) (r % 5 === 0 ? major : minor).push(`M0,${r * sq}H${w}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}mm" height="${h}mm">
    <path d="${minor.join("")}" stroke="#9ca3af" stroke-width="0.12" fill="none"/>
    <path d="${major.join("")}" stroke="#6b7280" stroke-width="0.3" fill="none"/>
  </svg>`;
}

function openPrint(title: string, orientation: "portrait" | "landscape", boxes: string[]): void {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>
  *{margin:0;padding:0;box-sizing:border-box}
  @page{size:A4 ${orientation};margin:${orientation === "portrait" ? "10mm" : "12mm"}}
  body{font-family:"Segoe UI",Arial,sans-serif}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  .page{display:flex;flex-direction:column;align-items:center;justify-content:space-around;height:${orientation === "portrait" ? "277mm" : "186mm"}}
  svg{display:block}
  .blank{border:0.3mm solid #6b7280;display:block}
</style></head><body><div class="page">${boxes.join("")}</div></body></html>`;
  const win = window.open("", "_blank");
  if (!win) { alert("Please allow popups to print."); return; }
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

/** Opens an A4 page with two blank grids, ready to print. Portrait fits the width (about 3.8 mm squares); landscape gives larger (4.5 mm) squares. */
export function printBlankGrids(orientation: "portrait" | "landscape"): void {
  const sq = orientation === "portrait" ? 3.8 : 4.5;
  openPrint("Blank grids", orientation, [gridSvg(sq), gridSvg(sq)]);
}

/** Four boxes down an A4 portrait page, each the size of a 50 × 20 grid (3.3 mm squares). `layout` "work": an empty box to draw the network and path analysis in, then three grids (a Gantt chart, a histogram, a levelled histogram); "grids": four grids. */
export function printGridSheet(layout: "work" | "grids"): void {
  const sq = 3.3;
  const blank = `<div class="blank" style="width:${COLS * sq}mm;height:${ROWS * sq}mm"></div>`;
  openPrint(layout === "work" ? "Network space and three grids" : "Four blank grids", "portrait", layout === "work" ? [blank, gridSvg(sq), gridSvg(sq), gridSvg(sq)] : [gridSvg(sq), gridSvg(sq), gridSvg(sq), gridSvg(sq)]);
}
