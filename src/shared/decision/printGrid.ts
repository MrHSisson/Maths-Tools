// Blank templates to print, for plotting a resource histogram or a cascade (Gantt) chart by hand. A grid is 50 squares across by 20 up with a heavier
// line every 5 squares and an L-shaped black axis (left and bottom); a blank box is the same size with nothing in it (for the network and path analysis).
// Students add their own scales, axes and labels.

const COLS = 50, ROWS = 20;
type Box = "grid" | "blank";

export interface PrintTemplate {
  id: string;
  label: string;
  hint: string;
  orientation: "portrait" | "landscape";
  /** squares are this many mm */
  sq: number;
  boxes: Box[];
}

export const PRINT_TEMPLATES: PrintTemplate[] = [
  { id: "two", label: "2 grids", hint: "Two squared grids, centred on the page", orientation: "portrait", sq: 3.8, boxes: ["grid", "grid"] },
  { id: "two-landscape", label: "2 grids, landscape", hint: "Two squared grids with larger squares", orientation: "landscape", sq: 4.5, boxes: ["grid", "grid"] },
  { id: "four", label: "4 grids", hint: "Four squared grids on one page", orientation: "portrait", sq: 3.3, boxes: ["grid", "grid", "grid", "grid"] },
  { id: "work", label: "Network space + 3 grids", hint: "A blank box for the network and path analysis, then three grids (Gantt chart, histogram, levelled histogram)", orientation: "portrait", sq: 3.3, boxes: ["blank", "grid", "grid", "grid"] },
  { id: "interweaved", label: "2 blank, 2 squared, interweaved", hint: "A blank box for the network, a grid for its chart, another blank box, another grid — so two questions fit on a page", orientation: "portrait", sq: 3.3, boxes: ["blank", "grid", "blank", "grid"] },
];

const AXIS = 0.5; // mm, black L axis on a grid

function gridSvg(sq: number): string {
  const w = COLS * sq, h = ROWS * sq;
  const minor: string[] = [], major: string[] = [];
  for (let c = 0; c <= COLS; c++) (c % 5 === 0 ? major : minor).push(`M${c * sq},0V${h}`);
  for (let r = 0; r <= ROWS; r++) (r % 5 === 0 ? major : minor).push(`M0,${r * sq}H${w}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-AXIS} ${-AXIS} ${w + 2 * AXIS} ${h + 2 * AXIS}" width="${w + 2 * AXIS}mm" height="${h + 2 * AXIS}mm">
    <path d="${minor.join("")}" stroke="#9ca3af" stroke-width="0.12" fill="none"/>
    <path d="${major.join("")}" stroke="#6b7280" stroke-width="0.3" fill="none"/>
    <path d="M0,0V${h}H${w}" fill="none" stroke="#000" stroke-width="${AXIS}" stroke-linecap="square"/>
  </svg>`;
}

/** The whole print page for a template, as HTML (the preview shows exactly this, and printing opens it). */
export function templateHtml(t: PrintTemplate): string {
  const blank = `<div class="blank" style="width:${COLS * t.sq + 2 * AXIS}mm;height:${ROWS * t.sq + 2 * AXIS}mm"></div>`;
  const boxes = t.boxes.map((b) => (b === "grid" ? gridSvg(t.sq) : blank)).join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${t.label}</title><style>
  *{margin:0;padding:0;box-sizing:border-box}
  @page{size:A4 ${t.orientation};margin:${t.orientation === "portrait" ? "10mm" : "12mm"}}
  body{font-family:"Segoe UI",Arial,sans-serif;background:#fff}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  @media screen{body{padding:${t.orientation === "portrait" ? "10mm" : "12mm"}}}
  .page{display:flex;flex-direction:column;align-items:center;justify-content:space-around;height:${t.orientation === "portrait" ? "277mm" : "186mm"}}
  svg{display:block}
  .blank{display:block}
</style></head><body><div class="page">${boxes}</div></body></html>`;
}

export function printTemplate(t: PrintTemplate): void {
  const win = window.open("", "_blank");
  if (!win) { alert("Please allow popups to print."); return; }
  win.document.write(templateHtml(t));
  win.document.close();
  setTimeout(() => win.print(), 400);
}
