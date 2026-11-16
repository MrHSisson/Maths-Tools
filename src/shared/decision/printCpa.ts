import { FRAME_CSS, esc, frameHeader } from "./printFrame";
// ═══════════════════════════════════════════════════════════════════════════
// Print a Critical Path question as one A4 sheet for students (the browser's print dialog → Save as PDF): the question, the workers table when
// they differ, the network with its times and critical path, the cascade (Gantt) chart with its floats, then the histograms — drawn for them or
// blank to draw on. The pictures are rendered by `cpaSheet.tsx` and handed in as SVG markup. An answer sheet (the same page with the
// histograms filled in, and the answer) can follow.
// ═══════════════════════════════════════════════════════════════════════════

export interface CpaSheetFigure {
  caption: string;
  /** the picture as markup (an SVG; for `draw`, the precedence table and the drawing space) */
  svg: string;
  /** `work` is a whole-page network the student writes on; `draw` is the table with a large space to draw the network in */
  kind: "network" | "gantt" | "hist" | "work" | "draw" | "response";
  /** a tall drawing chart (Gantt or histogram), or its accompanying network */
  tall?: boolean;
  /** `work` and `draw` figures: turned a quarter turn (anticlockwise) so the long side of the portrait page carries the width of the network; the student turns the page to read it */
  rotate?: boolean;
}
export interface CpaSheetInput {
  title: string;
  subtitle: string;
  prompt: string;
  /** shown as a one-row table when the activities need different numbers of workers */
  workers?: { id: string; n: number }[];
  figures: CpaSheetFigure[];
  /** an answer sheet: what to write (one line each) */
  answer?: string[];
  answerSheet?: boolean;
  /** a sheet the student works on directly: the figure takes the rest of the page (no fixed picture heights), and `fill` are write-in lines under it */
  work?: boolean;
  fill?: string[];
}

const CSS = `
  ${FRAME_CSS}
  .sheet { break-after: page; }
  .sheet:last-child { break-after: auto; }
  .prompt { margin: 0 0 2mm; line-height: 1.3; font-weight: 600; }
  table.workers { border-collapse: collapse; margin: 0 auto 2mm; font-size: 9.5pt; }
  table.workers th { background: #1e3a8a; color: #fff; padding: 0.6mm 2.5mm; border: 0.3mm solid #1e3a8a; text-align: center; }
  table.workers td { border: 0.3mm solid #1e3a8a; padding: 0.6mm 2.5mm; text-align: center; font-style: italic; min-width: 6mm; }
  table.workers td.n { font-style: normal; }
  .cap { font-size: 8.5pt; font-weight: 700; color: #1e3a8a; margin: 1.5mm 0 0.5mm; }
  .fig { width: 100%; border: 0.25mm solid #cbd5e1; border-radius: 1.5mm; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .fig.network { height: 50mm; }
  .fig.gantt { height: 46mm; }
  .fig.hist { height: 52mm; }
  .fig.network.tall { height: 72mm; }
  .fig.hist.tall { height: 138mm; }
  .fig.gantt.tall { height: 138mm; }
  .fig svg { width: 100% !important; height: 100% !important; min-width: 0 !important; max-height: none !important; margin: 0 !important; }
  /* an answer sheet carries the answer lines too, so its pictures are a little smaller to keep it on one page */
  .sheet.ans .fig.network { height: 40mm; }
  .sheet.ans .fig.gantt { height: 36mm; }
  .sheet.ans .fig.hist { height: 42mm; }
  .sheet.ans .fig.network.tall { height: 62mm; }
  .sheet.ans .fig.hist.tall { height: 120mm; }
  .sheet.ans .fig.gantt.tall { height: 120mm; }
  .answer { margin-top: 2mm; font-size: 9pt; line-height: 1.25; }
  .answer ol { margin: 1mm 0 0 5mm; padding: 0; }
  .answer li { margin-bottom: 0.8mm; }
  /* a working sheet: the page is one column, the figure takes whatever the question, header and write-in lines leave */
  .sheet.work { display: flex; flex-direction: column; height: 276mm; overflow: hidden; break-inside: avoid; }
  .sheet.work .fig.work, .sheet.work .fig.draw { flex: 1 1 0; min-height: 0; height: auto; }
  .sheet.work .fig.response { flex: 1 1 0; min-height: 0; }
  .responsein { display: flex; flex-direction: column; width: 100%; height: 100%; padding: 3mm; }
  .responsein table.prec.up { position: static; width: 100%; }
  .responsein table.prec td { min-height: 8mm; padding: 2mm; }
  .ruled { flex: 1; min-height: 0; margin-top: 2mm; background: repeating-linear-gradient(to bottom, transparent 0, transparent 7.7mm, #cbd5e1 7.7mm, #cbd5e1 8mm); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .fig.rot { position: relative; display: block; container-type: size; }
  /* turned a quarter turn anticlockwise: its top is the left edge of the page, so the student turns the page clockwise to read it */
  .fig.rot .rotin { position: absolute; left: 0; top: 100cqh; width: 100cqh; height: 100cqw; transform-origin: 0 0; transform: rotate(-90deg); }
  .fig.rot .rotin svg { display: block; }
  .drawin { display: flex; flex-direction: column; width: 100%; height: 100%; padding: 3mm; }
  table.prec { border-collapse: collapse; width: 100%; font-size: 10.5pt; }
  table.prec th { width: 1%; background: #1e3a8a; color: #fff; padding: 1mm 2mm; border: 0.3mm solid #1e3a8a; text-align: left; white-space: nowrap; }
  table.prec td { border: 0.3mm solid #1e3a8a; padding: 1mm 2mm; text-align: center; font-style: italic; }
  table.prec td.n { font-style: normal; }
  .space { position: relative; flex: 1 1 0; min-height: 0; margin-top: 3mm; border: 0.3mm dashed #94a3b8; border-radius: 1.5mm; -webkit-print-color-adjust: exact; print-color-adjust: exact;
    background-image: radial-gradient(circle, #94a3b8 0.25mm, transparent 0.3mm); background-size: 5mm 5mm; background-position: 2.5mm 2.5mm; }
  /* the precedence table sits in the top corner of the dotted drawing space, on white so it reads clearly */
  table.prec.up { position: absolute; top: 2.5mm; left: 2.5mm; width: auto; background: #fff; font-size: 10pt; }
  table.prec.up th { width: auto; text-align: center; padding: 1mm 3mm; white-space: normal; }
  table.prec.up td { padding: 0.8mm 3mm; font-style: normal; text-align: center; }
  .fill { margin-top: 2mm; font-size: 10pt; }
  .fill .row { display: flex; align-items: flex-end; gap: 2mm; height: 8.5mm; }
  .fill .row .line { flex: 1; border-bottom: 0.3mm solid #111827; height: 6mm; }
`;

function sheetHtml(s: CpaSheetInput, numbering?: string): string {
  const workers = s.workers && s.workers.length > 0
    ? `<table class="workers"><tr><th>Activity</th>${s.workers.map((w) => `<td>${esc(w.id)}</td>`).join("")}</tr><tr><th>Workers</th>${s.workers.map((w) => `<td class="n">${w.n}</td>`).join("")}</tr></table>`
    : "";
  const figs = s.figures.map((f) => `<div class="cap">${esc(f.caption)}</div>${f.rotate
    ? `<div class="fig ${f.kind} rot"><div class="rotin">${f.svg}</div></div>`
    : `<div class="fig ${f.kind}${f.tall ? " tall" : ""}">${f.svg}</div>`}`).join("");
  const fill = s.fill && s.fill.length > 0 ? `<div class="fill">${s.fill.map((l) => `<div class="row"><span>${esc(l)}</span><span class="line"></span></div>`).join("")}</div>` : "";
  const lines = (s.answer ?? []).filter((l) => l.trim() !== "");   // a drawn answer (the network) has no words: no empty "Answer 1." under it
  const answer = lines.length > 0
    ? `<div class="answer"><b>Answer</b><ol>${lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ol></div>`
    : "";
  return `<section class="sheet${s.answerSheet ? " ans" : ""}${s.work ? " work" : ""}">${frameHeader(s.title, s.subtitle, { tag: s.answerSheet ? "answers" : undefined, who: !s.answerSheet })}${numbering ? `<div class="meta">${esc(numbering)}</div>` : ""}
    <div class="prompt">${esc(s.prompt)}</div>${workers}${figs}${fill}${answer}</section>`;
}

/** the HTML of one or more sheets (exported so it can be tested without a window) */
export function cpaSheetsHtml(inputs: CpaSheetInput[]): string {
  // "Question 2 of 4": the question sheets are numbered in order, and each answer sheet carries the number of the question it answers (they follow in the same order)
  const total = inputs.filter((x) => !x.answerSheet).length || inputs.filter((x) => x.answerSheet).length;
  const seen = { q: 0, a: 0 };
  const sheets = inputs.map((s) => { const k = s.answerSheet ? ++seen.a : ++seen.q; return sheetHtml(s, total > 1 ? `Question ${k} of ${total}` : undefined); });
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(inputs[0]?.title ?? "Critical Path")} — ${esc(inputs[0]?.subtitle ?? "")}</title><style>${CSS}</style></head><body>${sheets.join("\n")}</body></html>`;
}

/** `win` is a window opened at the click, so the slow rendering before this cannot make the browser treat the popup as unrequested */
export function printCpaSheets(inputs: CpaSheetInput[], win: Window | null): void {
  if (!win) { alert("Please allow popups to use the PDF export."); return; }
  win.document.write(cpaSheetsHtml(inputs));
  win.document.close();
  setTimeout(() => win.print(), 500);
}
