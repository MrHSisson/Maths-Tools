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
  /** A sheet of different cells (three titled graphs) gives one per slot, in reading order; `cell` is then the first of them. */
  cells?: string[];
}

/** The print window's page for a sheet: A4 portrait, the cells on a grid. */
export function printableHtml(p: Printable): string {
  const list = p.cells ?? Array.from({ length: p.columns * p.rows }, () => p.cell);
  const cells = list.map((c) => `<div class="c">${c}</div>`).join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${p.title}</title><style>
  *{margin:0;padding:0;box-sizing:border-box}
  @page{size:A4 portrait;margin:12mm}
  body{font-family:"Segoe UI",Arial,sans-serif}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  .page{width:186mm;height:273mm;display:grid;grid-template-columns:repeat(${p.columns},1fr);grid-template-rows:repeat(${p.rows},1fr);gap:3mm 6mm}
  .c{display:flex;align-items:center;justify-content:center;min-height:0;min-width:0}
  .c svg{width:100%;height:100%}
</style></head><body><div class="page">${cells}</div></body></html>`;
}

/** Opens the sheet in a print window. The one print path for every printable. */
export function printPrintable(p: Printable): void {
  openPrintWindow(printableHtml(p), 400);
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

/** Three blank graphs, one above the other: y = sin x, y = cos x and y = tan x, x from −π to 3π (in radians) and y from −2 to 2.
 *  Gridlines every π/4 across (heavier at each π/2) and every 0.25 up (heavier at each whole number), with the axes numbered. */
export function trigGraphSheet(): Printable {
  const FONT_END = FONT.replace("middle", "end"), FONT_START = FONT.replace("middle", "start");   // FONT already sets the anchor, and a second one is ignored
  const PW = 800, PH = 300, X0 = 84, Y0 = 46, W = X0 + PW + 34, H = Y0 + PH + 98;
  const sx = (q: number) => X0 + ((q + 4) / 16) * PW;          // q counts quarter-π steps from −π (q = −4) to 3π (q = 12)
  const sy = (y: number) => Y0 + ((2 - y) / 4) * PH;
  const MINOR = "#e2e8f0", MED = "#cbd5e1";
  const FS = 22;
  const piLabel = (m: number): string => {                     // m half-π steps: 0, π/2, π, 3π/2 … and negatives
    const x = sx(2 * m), yb = Y0 + PH + 40;
    if (m === 0) return `<text x="${x}" y="${yb + 8}" font-size="${FS}" ${FONT}>0</text>`;
    const n = Math.abs(m), sign = m < 0;
    if (n % 2 === 0) {
      const t = n / 2 === 1 ? "π" : `${n / 2}π`;
      return `<text x="${x}" y="${yb + 8}" font-size="${FS}" ${FONT}>${sign ? "−" : ""}${t}</text>`;
    }
    const num = n === 1 ? "π" : `${n}π`, w = num.length * 13 + 6;
    return (sign ? `<text x="${x - w / 2 - 9}" y="${yb + 8}" font-size="${FS}" ${FONT}>−</text>` : "")
      + `<line x1="${x - w / 2}" y1="${yb}" x2="${x + w / 2}" y2="${yb}" stroke="${INK}" stroke-width="2"/>`
      + `<text x="${x}" y="${yb - 5}" font-size="${FS}" ${FONT}>${num}</text><text x="${x}" y="${yb + 22}" font-size="${FS}" ${FONT}>2</text>`;
  };
  const graph = (title: string): string => {
    let b = "";
    for (let i = 0; i <= 16; i++) {                            // horizontal: every 0.25
      const y = -2 + i * 0.25, whole = i % 4 === 0, half = i % 2 === 0;
      b += `<line x1="${X0}" y1="${sy(y)}" x2="${X0 + PW}" y2="${sy(y)}" stroke="${whole ? GUIDE : half ? MED : MINOR}" stroke-width="${whole ? 1.6 : 1}"/>`;
    }
    for (let q = -4; q <= 12; q++) {                            // vertical: every π/4
      const major = q % 2 === 0;
      b += `<line x1="${sx(q)}" y1="${Y0}" x2="${sx(q)}" y2="${Y0 + PH}" stroke="${major ? GUIDE : MINOR}" stroke-width="${major ? 1.6 : 1}"/>`;
    }
    b += `<rect x="${X0}" y="${Y0}" width="${PW}" height="${PH}" fill="none" stroke="${INK}" stroke-width="2.5"/>`
      + `<line x1="${X0}" y1="${sy(0)}" x2="${X0 + PW}" y2="${sy(0)}" stroke="${INK}" stroke-width="3.5"/>`
      + `<line x1="${sx(0)}" y1="${Y0}" x2="${sx(0)}" y2="${Y0 + PH}" stroke="${INK}" stroke-width="3.5"/>`;
    for (let i = 0; i <= 8; i++) {
      const y = -2 + i * 0.5, t = (y < 0 ? "−" : "") + Math.abs(y);
      b += `<text x="${X0 - 14}" y="${sy(y) + 7}" font-size="20" ${FONT_END}>${t}</text>`;
    }
    for (let m = -2; m <= 6; m++) b += `<line x1="${sx(2 * m)}" y1="${Y0 + PH}" x2="${sx(2 * m)}" y2="${Y0 + PH + 8}" stroke="${INK}" stroke-width="2"/>` + piLabel(m);
    b += `<text x="${X0}" y="${Y0 - 14}" font-size="28" font-weight="700" ${FONT_START}>${title}</text>`
      + `<text x="${X0 + PW + 14}" y="${sy(0) + 7}" font-size="22" font-style="italic" ${FONT}>x</text><text x="${sx(0) + 14}" y="${Y0 - 6}" font-size="22" font-style="italic" ${FONT}>y</text>`
      + `<text x="${X0 + PW}" y="${H - 6}" font-size="17" fill="${GUIDE}" font-family="Segoe UI,Arial,sans-serif" text-anchor="end">x in radians</text>`;
    return svg(W, H, b);
  };
  const cells = ["y = sin x", "y = cos x", "y = tan x"].map(graph);
  return { label: "Print blank trig graphs (A4)", hint: "sin, cos and tan, −π to 3π across and −2 to 2 up", title: "Blank sin, cos and tan graphs", cell: cells[0], cells, columns: 1, rows: 3 };
}

/** A plain 1 to 100 number grid in ten columns, two to a page: one to sieve, one to keep. The same layout the deck's Number grid draws,
 *  with no marks, so pupils scribble on it themselves. */
export function hundredSquareSheet(): Printable {
  const C = 50, N = 10, O = 6, SIZE = O * 2 + C * N;
  let b = "";
  for (let i = 0; i <= N; i++) {
    const p = O + i * C, edge = i === 0 || i === N;
    b += `<line x1="${O}" y1="${p}" x2="${O + C * N}" y2="${p}" stroke="${edge ? INK : GUIDE}" stroke-width="${edge ? 2.5 : 1}"/>`
      + `<line x1="${p}" y1="${O}" x2="${p}" y2="${O + C * N}" stroke="${edge ? INK : GUIDE}" stroke-width="${edge ? 2.5 : 1}"/>`;
  }
  for (let n = 1; n <= N * N; n++) {
    const col = (n - 1) % N, row = Math.floor((n - 1) / N);
    b += `<text x="${O + col * C + C / 2}" y="${O + row * C + C / 2 + 8}" font-size="22" font-weight="500" ${FONT}>${n}</text>`;
  }
  return { label: "Print 1 to 100 grids (A4)", hint: "Two grids per page, to sieve and to keep", title: "1 to 100 grids", cell: svg(SIZE, SIZE, b), columns: 1, rows: 2 };
}

/** Authored diagram practice with writing space. Inputs are trusted SVGs produced by the shared renderer; all text is escaped. */
export function diagramPracticeSheet(cells: { svg: string; answerSvg: string; prompts: string[]; answer: string; working: string[] }[], title: string, mode: "questions" | "answers" | "both", paper: "A4" | "A5" = "A4", a4PerPage: 4 | 6 = 6): string {
  const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
  const perPage = paper === "A4" ? a4PerPage : 2;
  const pages = (answers: boolean) => Array.from({ length: Math.ceil(cells.length / perPage) }, (_, page) => `<section class="page"><h1>${esc(title)}${answers ? " — worked answers" : ""}</h1><div class="grid">${cells.slice(page * perPage, (page + 1) * perPage).map((c, i) => `<article><h2>${page * perPage + i + 1}.</h2><div class="diagram">${answers ? c.answerSvg : c.svg}</div><div class="work">${(answers ? [...c.working, c.answer] : c.prompts).map(t => `<p>${esc(t)}</p>`).join("")}</div></article>`).join("")}</div></section>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>
  *{box-sizing:border-box} @page{size:${paper} portrait;margin:10mm} body{margin:0;font-family:Arial,sans-serif;color:#0f172a}
  .page{width:${paper === "A4" ? 190 : 128}mm;height:${paper === "A4" ? 277 : 190}mm;break-after:page;display:flex;flex-direction:column}
  .page:last-child{break-after:auto} h1{font-size:16px;height:10mm;margin:0} .grid{display:grid;grid-template-columns:repeat(${paper === "A4" ? 2 : 1},1fr);grid-template-rows:repeat(${paper === "A4" ? perPage / 2 : 2},1fr);gap:4mm;flex:1;min-height:0}
  article{border:1px solid #cbd5e1;padding:2mm;min-width:0;min-height:0;display:flex;flex-direction:column;break-inside:avoid} h2{font-size:12px;margin:0}.diagram{height:46mm;flex-shrink:0}.diagram svg{width:100%!important;height:100%!important}.work{font-size:11px;line-height:1.25;flex:1;min-height:0}.work p{margin:1.3mm 0}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body>${mode !== "answers" ? pages(false) : ""}${mode !== "questions" ? pages(true) : ""}</body></html>`;
}

/** What a shape question on a printed sheet is asking, so the sheet can head each page and lay it out. */
export type ShapeSection = "partition" | "internal" | "area" | "cutout";
interface ShapeCell { steps?: { title: string; lines: string[] }[]; svg: string; answerSvg: string; prompts: string[]; answer: string; working: string[]; section: ShapeSection }
const SHAPE_SECTIONS: Record<ShapeSection, [string, string]> = {
  partition: ["Split into rectangles", "Draw lines on each shape to split it into rectangles. You do not need to find any areas."],
  area: ["Area by splitting", "Split each shape into rectangles, then find the total area."],
  internal: ["Internal lengths, then area", "Work out any lengths that are not shown, then find the area of each shape."],
  cutout: ["Remove the cut-outs", "Find the area of the whole rectangle, then take away the part (or parts) that are missing."],
};

/**
 * Printed pages of shape questions, designed to be shrunk: Harry prints two A4 pages onto one sheet (each at about 70%), so every size here is
 * set for the A4 page to be read at A5 (lengths in the pictures about 13pt, working lines 13pt, nothing smaller than 11pt).
 * One page per kind of question (four questions to a page): the picture beside the working, or, for "draw your own split", two large pictures across.
 */
export function shapeWorksheet(cells: ShapeCell[], title: string, mode: "questions" | "answers" | "both"): string {
  const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
  // a run of underscores is a writing line: short ones sit in a sentence, long ones stretch to the edge of the column
  const writing = (s: string) => esc(s).replace(/_{2,}/g, run => `<i class="blank${run.length >= 10 ? " long" : ""}"></i>`);
  type Group = { section: ShapeSection; items: { c: ShapeCell; n: number }[] };
  const groups: Group[] = [];
  cells.forEach((c, i) => { const g = groups[groups.length - 1]; if (g && g.section === c.section && g.items.length < 4) g.items.push({ c, n: i + 1 }); else groups.push({ section: c.section, items: [{ c, n: i + 1 }] }); });
  const pages = (answers: boolean) => groups.map((g, gi) => {
    const [head, how] = SHAPE_SECTIONS[g.section], grid = g.section === "partition";
    const body = g.items.map(({ c, n }) => {
      const svg = answers ? c.answerSvg : c.svg;
      if (grid) return `<article class="big"><b class="n">${n}</b><div class="pic">${svg}</div>${answers ? `<p class="note">One valid split is shown. Accept any split into rectangles that cover the shape exactly once.</p>` : ""}</article>`;
      const last = c.prompts[c.prompts.length - 1] ?? "";
      const final = /^(Area|Perimeter) = _+/.test(last) ? last : "";
      const lines = answers ? [...c.working, c.answer] : c.prompts.filter(p => p !== final && !/^Show your method/.test(p));
      const space = !answers && !lines.length && !c.steps;
      if (!answers && c.steps) return `<article class="big scaf${c.steps.reduce((t, st) => t + st.lines.length, 0) <= 3 ? " short" : ""}"><b class="n">${n}</b><div class="pic fixed">${svg}</div><div class="work">${c.steps.map((st, k) => `<div class="step"><h3><i>${k + 1}</i>${esc(st.title)}</h3>${st.lines.map(t => `<p>${writing(t)}</p>`).join("")}</div>`).join("")}</div></article>`;
      return `<article class="big${answers ? " key" : ""}"><b class="n">${n}</b><div class="pic fixed">${svg}</div><div class="work">${lines.map((t, k) => `<p${answers && k === lines.length - 1 ? ' class="final"' : ""}>${answers ? esc(t) : writing(t)}</p>`).join("")}${space ? '<div class="space"><span>Working</span></div>' : ""}${!answers && final ? `<p class="final">${writing(final)}</p>` : ""}</div></article>`;
    }).join("");
    return `<section class="page"><header><h1>${esc(title)}${answers ? " — worked answers" : ""}</h1>${answers ? "" : '<span class="name">Name <i></i></span>'}</header><div class="sec"><b>${String.fromCharCode(65 + gi)} · ${head}</b><span>${how}</span></div><div class="grid2">${body}</div></section>`;
  }).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>
  *{box-sizing:border-box} @page{size:A4 portrait;margin:0} body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#0f172a}
  .page{width:210mm;height:297mm;padding:11mm 13mm 9mm;break-after:page;display:flex;flex-direction:column;overflow:hidden} .page:last-child{break-after:auto}
  header{display:flex;justify-content:space-between;align-items:baseline;height:9mm} h1{font-size:16pt;margin:0;font-weight:700;white-space:nowrap} .name{font-size:12.5pt;display:flex;align-items:baseline;gap:2mm} .name i{display:inline-block;width:40mm;border-bottom:.4mm solid #0f172a}
  .sec{margin:2.5mm 0 3.5mm;padding:2.2mm 4mm;background:#eef2ff;border-left:1.6mm solid #4338ca;border-radius:1mm;display:flex;flex-direction:column;gap:.8mm} .sec b{font-size:15pt;color:#1e3a8a} .sec span{font-size:12.5pt;color:#334155}
  .grid2{flex:1;min-height:0;display:grid;gap:3.5mm;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr}
  article{position:relative;border:.35mm solid #94a3b8;border-radius:2.5mm;min-width:0;min-height:0;overflow:hidden;break-inside:avoid}
  .big{display:flex;flex-direction:column}
  .n{position:absolute;left:2.5mm;top:2mm;font-size:17pt;color:#1e3a8a;z-index:1} .pic{min-width:0;min-height:0;padding:1.5mm 2mm} .big .pic{flex:1} .big .pic.fixed{flex:0 0 74mm} .big.scaf .pic.fixed{flex:0 0 60mm} .big.scaf.short .pic.fixed{flex:0 0 70mm} .big.key .pic.fixed{flex:0 0 66mm} .pic svg{width:100%!important;height:100%!important;display:block}
  .work{flex:1;padding:1mm 4mm 3mm 4mm;display:flex;flex-direction:column;min-width:0;min-height:0} .work p{margin:0 0 3.2mm;font-size:12.5pt;line-height:1.3;display:flex;align-items:flex-end;gap:1.2mm;flex-wrap:wrap}
  .key .work{padding-top:0} .key .work p{font-size:11pt;line-height:1.28;margin-bottom:1.4mm;display:block} .key .work p.final{font-weight:700;color:#166534}
  .blank{display:inline-block;width:9mm;height:5mm;border-bottom:.35mm solid #0f172a;flex:none} .blank.long{flex:1;min-width:30mm} .final{margin-top:auto!important;font-weight:700;font-size:14pt!important}
  .space{flex:1;min-height:12mm;margin-bottom:3mm;border-radius:1.5mm;background:repeating-linear-gradient(transparent 0 7.4mm,#cbd5e1 7.4mm 7.8mm)} .space span{font-size:10.5pt;color:#94a3b8} .note{margin:0;padding:0 4mm 2.5mm;font-size:11.5pt;color:#166534}
  .step{margin-bottom:1.6mm} .step h3{margin:0 0 1mm;font-size:11.5pt;color:#1e3a8a;display:flex;align-items:center;gap:1.8mm} .step h3 i{font-style:normal;display:inline-flex;align-items:center;justify-content:center;width:5mm;height:5mm;border-radius:50%;background:#1e3a8a;color:#fff;font-size:10.5pt;flex:none} .big .step p{margin:0 0 1.5mm 6.8mm;font-size:12pt}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body>${mode !== "answers" ? pages(false) : ""}${mode !== "questions" ? pages(true) : ""}</body></html>`;
}

/** One Venn on a printed sheet: its drawing, with and without the tiles, the numbers' factorisations and the answer lines. */
interface VennCell { a: number; b: number; svg: string; answerSvg: string; factors: string[]; lines: boolean; answers: string[] }

/**
 * Printed Venn sheets, designed to be shrunk like the shape sheets: A4 pages printed scaled to A5, three Venns to a page (one across, three
 * down), so a sheet holds at most nine. The Venn is large on the left with the two numbers' factorisations beside it, and, where the sheet
 * asks for them, "HCF =" and "LCM =" lines to fill in. The answer pages draw every tile and fill the lines in.
 */
export function vennWorksheet(cells: VennCell[], title: string, note: string | undefined, mode: "questions" | "answers" | "both"): string {
  const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
  const PER = 3;
  const pages = (answers: boolean) => Array.from({ length: Math.ceil(cells.length / PER) }, (_, page) => {
    const rows = cells.slice(page * PER, (page + 1) * PER).map((c, i) => `<article><b class="n">${page * PER + i + 1}</b><div class="pic">${answers ? c.answerSvg : c.svg}</div><div class="side">${c.factors.map(f => `<p class="f">${esc(f)}</p>`).join("")}${c.lines ? (answers ? c.answers.map(t => `<p class="ln key">${esc(t)}</p>`) : ["HCF", "LCM"].map(t => `<p class="ln">${t} = <i></i></p>`)).join("") : ""}</div></article>`).join("");
    return `<section class="page"><header><h1>${esc(title)}${answers ? " — answers" : ""}</h1>${answers ? "" : '<span class="name">Name <i></i></span>'}</header>${!answers && note ? `<p class="note">${esc(note)}</p>` : ""}<div class="rows">${rows}</div></section>`;
  }).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>
  *{box-sizing:border-box} @page{size:A4 portrait;margin:0} body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#0f172a}
  .page{width:210mm;height:297mm;padding:11mm 13mm 9mm;break-after:page;display:flex;flex-direction:column;overflow:hidden} .page:last-child{break-after:auto}
  header{display:flex;justify-content:space-between;align-items:baseline;height:9mm} h1{font-size:16pt;margin:0;font-weight:700;white-space:nowrap} .name{font-size:12.5pt;display:flex;align-items:baseline;gap:2mm} .name i{display:inline-block;width:40mm;border-bottom:.4mm solid #0f172a}
  .note{margin:1.5mm 0 0;font-size:12.5pt;color:#334155}
  .rows{flex:1;min-height:0;display:grid;grid-template-rows:repeat(${PER},1fr);gap:0;margin-top:3mm}
  article{position:relative;display:flex;gap:4mm;align-items:center;padding:2mm 4mm 2mm 9mm;min-height:0;overflow:hidden;break-inside:avoid} article+article{border-top:.35mm solid #94a3b8}
  .n{position:absolute;left:1mm;top:1.5mm;font-size:15pt;color:#1e3a8a;z-index:1} .pic{flex:0 0 122mm;height:100%;min-height:0} .pic svg{width:100%;height:100%;display:block}
  .side{flex:1;min-width:0;display:flex;flex-direction:column;gap:3mm} .f{margin:0;font-size:12.5pt;line-height:1.3}
  .ln{margin:2mm 0 0;font-size:13pt;font-weight:700;display:flex;align-items:flex-end;gap:1.5mm;white-space:nowrap} .ln i{flex:1;min-width:10mm;height:5mm;border-bottom:.35mm solid #0f172a} .ln.key{color:#166534;display:block;white-space:normal;font-size:12pt}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body>${mode !== "answers" ? pages(false) : ""}${mode !== "questions" ? pages(true) : ""}</body></html>`;
}
