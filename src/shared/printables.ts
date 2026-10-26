// Printables — ready-made A4 sheets with no generated questions, for a class to fill in.
//
// A tool offers a printable when its working is built on a picture the student draws or completes on a blank
// (a number line, a place value table, a ratio table, a coordinate grid). The shell lists them under one
// "Printables" heading in the burger menu and prints them through one path (`printPrintable`); a tool only
// says which sheets it wants: `<ToolShell printables={[numberLineSheet(), …]} />`.
//
// A sheet is one SVG cell repeated on a grid, so every sheet shares the page, margins and print dialog.

import { openPrintWindow } from "./print";

export interface Printable {
  /** The menu item. */
  label: string;
  hint?: string;
  /** The browser tab / PDF name. */
  title: string;
  /** One cell as SVG markup (a viewBox, no fixed size): repeated `columns × rows` times on an A4 portrait page. */
  cell: string;
  columns: number;
  rows: number;
}

/** Opens the sheet in a print window. The one print path for every printable. */
export function printPrintable(p: Printable): void {
  const cells = Array.from({ length: p.columns * p.rows }, () => `<div class="c">${p.cell}</div>`).join("");
  openPrintWindow(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${p.title}</title><style>
  *{margin:0;padding:0;box-sizing:border-box}
  @page{size:A4 portrait;margin:12mm}
  body{font-family:"Segoe UI",Arial,sans-serif}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  .page{width:186mm;height:273mm;display:grid;grid-template-columns:repeat(${p.columns},1fr);grid-template-rows:repeat(${p.rows},1fr);gap:3mm 6mm}
  .c{display:flex;align-items:center;justify-content:center;min-height:0;min-width:0}
  .c svg{width:100%;height:100%}
</style></head><body><div class="page">${cells}</div></body></html>`, 400);
}

const INK = "#1e293b";
const GUIDE = "#94a3b8";
const FONT = `font-family="Segoe UI,Arial,sans-serif" fill="${INK}" text-anchor="middle"`;
const svg = (w: number, h: number, body: string) => `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">${body}</svg>`;
const box = (x: number, y: number, w: number, h: number) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ffffff" stroke="${INK}" stroke-width="2.5"/>`;

/** An integer number line, -10 to 10, every mark numbered, with room above for jumps. */
export function numberLineSheet(): Printable {
  const W = 1000, X0 = 50, STEP = 45, Y = 100;
  let b = `<line x1="${X0 - 24}" y1="${Y}" x2="${X0 + 20 * STEP + 24}" y2="${Y}" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
  for (let i = 0; i <= 20; i++) {
    const x = X0 + i * STEP, n = i - 10, major = n % 5 === 0;
    b += `<line x1="${x}" y1="${Y - (major ? 14 : 9)}" x2="${x}" y2="${Y + (major ? 14 : 9)}" stroke="${INK}" stroke-width="${major ? 3.5 : 2.5}"/>`
      + `<text x="${x}" y="${Y + 38}" font-size="22" font-weight="${major ? 700 : 500}" ${FONT}>${n < 0 ? "−" + -n : n}</text>`;
  }
  return { label: "Print blank number lines (A4)", hint: "One line per row, −10 to 10, room above for jumps", title: "Blank number lines", cell: svg(W, 145, b), columns: 1, rows: 10 };
}

/** The decimal place value table: Hundreds, Tens, Ones, point, tenths, hundredths, thousandths, with blank rows. */
export function placeValueSheet(): Printable {
  const heads = ["H", "T", "O", "", "t", "h", "th"], CW = 70, HH = 60, RH = 70, rows = 3, X0 = 14, W = X0 * 2 + CW * 7;
  let b = "";
  heads.forEach((h, i) => {
    const x = X0 + i * CW;
    if (i === 3) { b += `<text x="${x + CW / 2}" y="${HH + RH * rows / 2 + 14}" font-size="46" font-weight="700" ${FONT}>.</text>`; return; }
    b += `<rect x="${x}" y="2" width="${CW}" height="${HH}" fill="#e2e8f0" stroke="${INK}" stroke-width="2.5"/><text x="${x + CW / 2}" y="${HH / 2 + 12}" font-size="32" font-weight="700" ${FONT}>${h}</text>`;
    for (let r = 0; r < rows; r++) b += box(x, 2 + HH + r * RH, CW, RH);
  });
  return { label: "Print blank place value tables (A4)", hint: "Two columns, headings and three empty rows each", title: "Blank place value tables", cell: svg(W, HH + RH * rows + 4, b), columns: 2, rows: 6 };
}

/** The binary place value table, 128 down to 1, with blank rows. */
export function binarySheet(): Printable {
  const heads = [128, 64, 32, 16, 8, 4, 2, 1], CW = 64, HH = 56, RH = 64, rows = 3, X0 = 14, W = X0 * 2 + CW * 8 + 12;
  let b = "";
  heads.forEach((h, i) => {
    const x = X0 + i * CW + (i >= 4 ? 12 : 0);
    b += `<rect x="${x}" y="2" width="${CW}" height="${HH}" fill="#e2e8f0" stroke="${INK}" stroke-width="2.5"/><text x="${x + CW / 2}" y="${HH / 2 + 10}" font-size="26" font-weight="700" ${FONT}>${h}</text>`;
    for (let r = 0; r < rows; r++) b += box(x, 2 + HH + r * RH, CW, RH);
  });
  return { label: "Print blank binary tables (A4)", hint: "Two columns, 128 to 1 with three empty rows each", title: "Blank binary place value tables", cell: svg(W, HH + RH * rows + 4, b), columns: 2, rows: 6 };
}

/** A ratio table: two quantity columns, rows going down, and an empty box beside each gap for the scale factor. */
export function ratioTableSheet(): Printable {
  const CW = 150, HH = 60, RH = 62, rows = 4, X0 = 70, W = X0 + CW * 2 + 90;
  let b = "";
  for (let c = 0; c < 2; c++) b += `<rect x="${X0 + c * CW}" y="2" width="${CW}" height="${HH}" fill="#e2e8f0" stroke="${INK}" stroke-width="2.5"/>`;
  for (let r = 0; r < rows; r++) for (let c = 0; c < 2; c++) b += box(X0 + c * CW, 2 + HH + r * RH, CW, RH);
  for (let r = 0; r < rows - 1; r++) {
    const y = 2 + HH + r * RH + RH / 2, y2 = y + RH;
    b += `<path d="M${X0 + 2 * CW + 6} ${y} C ${X0 + 2 * CW + 52} ${y}, ${X0 + 2 * CW + 52} ${y2}, ${X0 + 2 * CW + 6} ${y2}" fill="none" stroke="${GUIDE}" stroke-width="3" stroke-linecap="round"/>`
      + `<rect x="${X0 + 2 * CW + 40}" y="${(y + y2) / 2 - 16}" width="46" height="32" rx="6" fill="#ffffff" stroke="${INK}" stroke-width="2" stroke-dasharray="5 4"/>`;
  }
  return { label: "Print blank ratio tables (A4)", hint: "Two columns, headings empty, four rows and a box for each scale factor", title: "Blank ratio tables", cell: svg(W, HH + RH * rows + 6, b), columns: 2, rows: 5 };
}

/** A coordinate grid, -10 to 10 on both axes, axes numbered every 2. */
export function gridSheet(): Printable {
  const S = 22, N = 10, O = 40, SIZE = O * 2 + 2 * N * S;
  let b = "";
  for (let i = -N; i <= N; i++) {
    const p = O + (i + N) * S;
    b += `<line x1="${O}" y1="${p}" x2="${O + 2 * N * S}" y2="${p}" stroke="${i === 0 ? INK : GUIDE}" stroke-width="${i === 0 ? 3 : 1}"/>`
      + `<line x1="${p}" y1="${O}" x2="${p}" y2="${O + 2 * N * S}" stroke="${i === 0 ? INK : GUIDE}" stroke-width="${i === 0 ? 3 : 1}"/>`;
    if (i !== 0 && i % 2 === 0) {
      const t = i < 0 ? "−" + -i : String(i);
      b += `<text x="${p}" y="${O + N * S + 20}" font-size="15" ${FONT}>${t}</text><text x="${O + N * S - 8}" y="${O + (N - i) * S + 5}" font-size="15" ${FONT} text-anchor="end">${t}</text>`;
    }
  }
  b += `<text x="${O + 2 * N * S + 22}" y="${O + N * S + 6}" font-size="22" font-style="italic" ${FONT}>x</text><text x="${O + N * S}" y="${O - 14}" font-size="22" font-style="italic" ${FONT}>y</text>`;
  return { label: "Print blank coordinate grids (A4)", hint: "Six per page, −10 to 10 on both axes", title: "Blank coordinate grids", cell: svg(SIZE, SIZE, b), columns: 2, rows: 3 };
}
