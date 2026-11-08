// ═══════════════════════════════════════════════════════════════════════════
// Print a Critical Path question as one A4 sheet for students (the browser's print dialog → Save as PDF): the question, the workers table when
// they differ, the network with its times and critical path, the cascade (Gantt) chart with its floats, then the histograms — drawn for them or
// blank to draw on. The pictures are rendered by `cpaSheet.tsx` and handed in as SVG markup. An answer sheet (the same page with the
// histograms filled in, and the answer) can follow.
// ═══════════════════════════════════════════════════════════════════════════

export interface CpaSheetFigure { caption: string; svg: string; kind: "network" | "gantt" | "hist"; /** a tall histogram when it is the only one */ tall?: boolean }
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
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const CSS = `
  @page { size: A4; margin: 10mm; }
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #111827; font-size: 10pt; margin: 0; }
  .sheet { break-after: page; }
  .sheet:last-child { break-after: auto; }
  header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 0.5mm solid #1e3a8a; padding-bottom: 1.5mm; margin-bottom: 2.5mm; }
  header h1 { font-size: 13pt; margin: 0; color: #1e3a8a; }
  header .who { font-size: 9.5pt; color: #374151; }
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
  .fig svg { width: 100% !important; height: 100% !important; min-width: 0 !important; max-height: none !important; margin: 0 !important; }
  /* an answer sheet carries the answer lines too, so its pictures are a little smaller to keep it on one page */
  .sheet.ans .fig.network { height: 40mm; }
  .sheet.ans .fig.gantt { height: 36mm; }
  .sheet.ans .fig.hist { height: 42mm; }
  .sheet.ans .fig.network.tall { height: 62mm; }
  .sheet.ans .fig.hist.tall { height: 120mm; }
  .answer { margin-top: 2mm; font-size: 9pt; line-height: 1.25; }
  .answer ol { margin: 1mm 0 0 5mm; padding: 0; }
  .answer li { margin-bottom: 0.8mm; }
  .tag { font-size: 8.5pt; font-weight: 700; color: #fff; background: #166534; border-radius: 1mm; padding: 0 1.5mm; margin-left: 2mm; }
`;

function sheetHtml(s: CpaSheetInput): string {
  const workers = s.workers && s.workers.length > 0
    ? `<table class="workers"><tr><th>Activity</th>${s.workers.map((w) => `<td>${esc(w.id)}</td>`).join("")}</tr><tr><th>Workers</th>${s.workers.map((w) => `<td class="n">${w.n}</td>`).join("")}</tr></table>`
    : "";
  const figs = s.figures.map((f) => `<div class="cap">${esc(f.caption)}</div><div class="fig ${f.kind}${f.tall ? " tall" : ""}">${f.svg}</div>`).join("");
  const answer = s.answer && s.answer.length > 0
    ? `<div class="answer"><b>Answer</b><ol>${s.answer.map((l) => `<li>${esc(l)}</li>`).join("")}</ol></div>`
    : "";
  return `<section class="sheet${s.answerSheet ? " ans" : ""}"><header><h1>${esc(s.title)} — ${esc(s.subtitle)}${s.answerSheet ? `<span class="tag">answers</span>` : ""}</h1><div class="who">${s.answerSheet ? "" : "Name ____________________ &nbsp; Date _________"}</div></header>
    <div class="prompt">${esc(s.prompt)}</div>${workers}${figs}${answer}</section>`;
}

/** the HTML of one or more sheets (exported so it can be tested without a window) */
export function cpaSheetsHtml(inputs: CpaSheetInput[]): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(inputs[0]?.title ?? "Critical Path")} — ${esc(inputs[0]?.subtitle ?? "")}</title><style>${CSS}</style></head><body>${inputs.map(sheetHtml).join("\n")}</body></html>`;
}

/** `win` is a window opened at the click, so the slow rendering before this cannot make the browser treat the popup as unrequested */
export function printCpaSheets(inputs: CpaSheetInput[], win: Window | null): void {
  if (!win) { alert("Please allow popups to use the PDF export."); return; }
  win.document.write(cpaSheetsHtml(inputs));
  win.document.close();
  setTimeout(() => win.print(), 500);
}
