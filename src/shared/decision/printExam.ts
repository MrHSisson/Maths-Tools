import type { ExamData } from "./types";

// ═══════════════════════════════════════════════════════════════════════════
// Print an exam-style question as a PDF (the browser's print dialog → Save as PDF). Two sheets:
//   1. the question paper: the context, the network, each part with its marks and room to answer — a blank copy of the network under any part
//      whose answer is drawn on it (potentials, a supersource…), and a table for flow augmentation;
//   2. the mark scheme: each part's answer (the filled-in network where it is drawn on it) and its marks, B1 / M1 / A1 / E1 / R1.
// The pictures are rendered by the shell (it owns the network renderer) and handed in as SVG markup.
// ═══════════════════════════════════════════════════════════════════════════

export interface ExamPrintInput {
  title: string;           // the tool's name
  exam: ExamData;
  questionFigure: string;  // the network as the question gives it
  answerFigures: Array<string | null>;  // per part: the network with that part's answer on it (null: no picture)
  /** per part, where the student draws on the network (potentials, flow augmentation): the network with nothing on it, no capacities and no flows — the question's own picture above has them */
  blankFigures?: Array<string | null>;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const CODE_BG: Record<string, string> = { B: "#1e3a8a", M: "#7c3aed", A: "#166534", E: "#b45309", R: "#b45309" };

const CSS = `
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #111827; font-size: 11.5pt; margin: 0; }
  header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 0.6mm solid #1e3a8a; padding-bottom: 2mm; margin-bottom: 4mm; }
  header h1 { font-size: 14pt; margin: 0; color: #1e3a8a; }
  header .who { font-size: 10pt; color: #374151; }
  .meta { font-size: 9.5pt; color: #4b5563; margin-bottom: 3mm; }
  .intro { font-weight: 600; margin-bottom: 4mm; }
  .fig { width: 100%; height: 88mm; border: 0.3mm solid #cbd5e1; border-radius: 2mm; margin-bottom: 5mm; }
  .fig.small { height: 78mm; margin: 2mm 0 1mm; }
  .fig.tiny { height: 52mm; margin: 2mm 0 1mm; }
  .fig > div, .fig svg { width: 100%; height: 100%; }
  .part { break-inside: avoid; margin-bottom: 6mm; }
  .prompt { display: grid; grid-template-columns: 9mm 1fr auto; gap: 2mm; align-items: baseline; }
  .prompt em { font-style: normal; font-weight: 700; color: #4b5563; white-space: nowrap; }
  .rule { border-bottom: 0.25mm solid #9ca3af; height: 8mm; margin-left: 9mm; }
  .cap { font-size: 9.5pt; font-weight: 700; color: #1e3a8a; margin: 3mm 0 0 9mm; }
  .note { font-size: 9pt; color: #6b7280; margin-left: 9mm; }
  table.aug { margin: 3mm 0 1mm 9mm; border-collapse: collapse; width: calc(100% - 9mm); }
  table.aug th, table.aug td { border: 0.3mm solid #6b7280; padding: 1mm 2mm; height: 8mm; text-align: left; font-size: 10pt; }
  .paper + .paper { break-before: page; }
  .markscheme { break-before: page; }
  body > .markscheme:first-child { break-before: auto; }
  .model { margin: 1.5mm 0 1mm 9mm; font-weight: 600; white-space: pre-line; }
  .marks { margin: 1.5mm 0 0 9mm; }
  .mk { display: flex; gap: 2mm; align-items: baseline; font-size: 9.5pt; color: #374151; margin-bottom: 1mm; }
  .code { color: #fff; font-weight: 700; font-size: 8.5pt; border-radius: 1mm; padding: 0 1.5mm; flex-shrink: 0; }
  `;

type PartHtml = { paper: string; scheme: string };

/** one question's paper and mark scheme (n of total numbers them when there are several) */
function questionHtml({ title, exam, questionFigure, answerFigures, blankFigures = [] }: ExamPrintInput, n: number, total: number): PartHtml {
  const lines = (n: number) => Array.from({ length: n }, () => `<div class="rule"></div>`).join("");
  // potentials then augmentation: both are worked on the SAME network (the potentials crossed out and updated as the paths are used), so that one
  // copy is given with the potentials part, and the augmentation part only gets a second copy for the maximum flow
  const isPot = (p: ExamData["parts"][number]) => p.role === "potentials";
  const isAug = (p: ExamData["parts"][number]) => p.role === "augment";
  // adding a supersource / supersink comes first, and the same network is then worked on (nothing is given pre-drawn)
  const isSuperAdd = (p: ExamData["parts"][number]) => p.role === "superAdd";
  const shared = exam.parts.some(isAug) && (exam.parts.some(isPot) || exam.parts.some(isSuperAdd));
  const parts = exam.parts.map((p, i) => {
    const augTable = p.role === "augment";
    const drawn = !!p.onDiagram;
    const space = drawn
      ? `<div class="fig small">${blankFigures[i] ?? questionFigure}</div><div class="note">${shared && isPot(p) ? "Use this network for the potentials here and then for your flow augmentations in the next part, crossing out and updating the potentials as you go." : shared && isSuperAdd(p) ? "Add the supersource / supersink to this network, then use it for the potentials and your flow augmentations in the next part, crossing out and updating the potentials as you go." : "Use this copy of the network for your answer."}</div>`
      : augTable
        ? `<table class="aug"><tr><th>Augmenting path</th><th>Extra flow</th></tr>${Array.from({ length: 5 }, () => "<tr><td></td><td></td></tr>").join("")}</table>${
            blankFigures[i]
              ? shared
                ? `<div class="cap">Show the maximum flow on this network</div><div class="fig small">${blankFigures[i]}</div>`
                : `<div class="cap">Network 1: the potentials and your augmenting paths</div><div class="fig small">${blankFigures[i]}</div><div class="cap">Network 2: show the maximum flow here</div><div class="fig small">${blankFigures[i]}</div>`
              : lines(2)}`
        : lines(Math.min(9, 2 + p.marks * 2));
    return `<section class="part"><div class="prompt"><b>${esc(p.label)}</b><span>${esc(p.prompt)}</span><em>[${p.marks} mark${p.marks > 1 ? "s" : ""}]</em></div>${space}</section>`;
  }).join("");

  const scheme = exam.parts.map((p, i) => {
    const fig = answerFigures[i];
    const answer = p.onDiagram
      ? (fig ? `<div class="fig small">${fig}</div>` : "")
      : `<div class="model">${p.model.map((l) => `<div>${esc(l)}</div>`).join("")}</div>${fig ? `<div class="fig tiny">${fig}</div>` : ""}`;
    const marks = p.scheme.map((m) => `<div class="mk"><span class="code" style="background:${CODE_BG[m.code[0]] ?? "#475569"}">${esc(m.code)}</span><span>${esc(m.text)}</span></div>`).join("");
    return `<section class="part"><div class="prompt"><b>${esc(p.label)}</b><span>${esc(p.prompt)}</span><em>[${p.marks}]</em></div>${answer}<div class="marks">${marks}</div></section>`;
  }).join("");

  const tag = total > 1 ? `Question ${n} of ${total} · ` : "";
  const paper = `<div class="paper">
    <header><h1>${esc(title)}</h1><div class="who">Name ______________________ &nbsp; Date __________</div></header>
    <div class="meta">${tag}${exam.totalMarks} marks · about ${exam.minutes} minutes</div>
    <div class="intro">${esc(exam.intro)}</div>
    <div class="fig">${questionFigure}</div>
    ${parts}
  </div>`;
  const markScheme = `<div class="markscheme">
    <header><h1>${esc(title)} — mark scheme</h1><div class="who">${total > 1 ? `Question ${n} · ` : ""}${exam.totalMarks} marks</div></header>
    ${scheme}
  </div>`;
  return { paper, scheme: markScheme };
}

/** the HTML of a whole print: every question paper first, then every mark scheme (exported so it can be tested without a window) */
export function examSetHtml(inputs: ExamPrintInput[], opts: { papers?: boolean; schemes?: boolean } = {}): string {
  const items = inputs.map((inp, i) => questionHtml(inp, i + 1, inputs.length));
  const title = inputs[0]?.title ?? "";
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)} — exam question${inputs.length > 1 ? "s" : ""}</title><style>${CSS}</style></head><body>
  ${opts.papers === false ? "" : items.map((x) => x.paper).join("\n")}
  ${opts.schemes === false ? "" : items.map((x) => x.scheme).join("\n")}
  </body></html>`;
}

/** a single question (paper and mark scheme) */
export function examPrintHtml(input: ExamPrintInput): string { return examSetHtml([input]); }

/** `win` is a window already opened at the click (so the slow rendering before it cannot make the browser treat the popup as unrequested) */
export function printExam(input: ExamPrintInput | ExamPrintInput[], opts: { papers?: boolean; schemes?: boolean; win?: Window | null } = {}): void {
  const html = examSetHtml(Array.isArray(input) ? input : [input], opts);
  const win = opts.win ?? window.open("", "_blank");
  if (!win) { alert("Please allow popups to use the PDF export."); return; }
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
}
