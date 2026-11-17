import katex from "katex";
import katexCss from "katex/dist/katex.min.css?inline";   // the stylesheet is part of the page and its fonts come from the site itself: a printed paper needs no connection
import type { ExamData } from "./types";
import { FRAME_CSS, esc, frameHeader } from "./printFrame";

// ═══════════════════════════════════════════════════════════════════════════
// Print an exam-style question as a PDF (the browser's print dialog → Save as PDF). Two sheets:
//   1. the question paper: the context, the network, each part with its marks and room to answer — a blank copy of the network under any part
//      whose answer is drawn on it (potentials, a supersource…), and a table for flow augmentation;
//   2. the mark scheme: each part's answer (the filled-in network where it is drawn on it) and its marks, B1 / M1 / A1 / E1 / R1.
// The pictures are rendered by the shell (it owns the network renderer) and handed in as SVG markup.
// ═══════════════════════════════════════════════════════════════════════════

interface ExamPrintInput {
  /** what the sheet is, for the header ("State the dimensions, then find the powers · Level 1") */
  subtitle?: string;
  /** where the picture would be, a blank box headed "Working" (a written-working question draws no picture: the student writes their own) */
  workingBox?: boolean;
  title: string;           // the tool's name
  exam: ExamData;
  questionFigure: string;  // the network as the question gives it
  answerFigures: Array<string | null>;  // per part: the network with that part's answer on it (null: no picture)
  /** per part, where the student draws on the network (potentials, flow augmentation): the network with nothing on it, no capacities and no flows — the question's own picture above has them */
  blankFigures?: Array<string | null>;
  /** per part: the second figure the part is about, when the question gives two (drawn above the part) */
  partFigures?: Array<string | null>;
}

/** one formula as HTML (rendered here, so the printed page needs no script and no connection; a formula KaTeX cannot read is shown as its text) */
const texHtml = (tex: string): string => { try { return katex.renderToString(tex, { throwOnError: false, output: "html" }); } catch { return esc(tex); } };
/** text with maths between $…$ as HTML: the prose escaped, each formula typeset */
const mathHtml = (s: string): string => s.split(/(\$[^$]+\$)/g).map((part, i) => (i % 2 === 1 ? texHtml(part.slice(1, -1)) : esc(part))).join("");
const CODE_BG: Record<string, string> = { B: "#1e3a8a", M: "#7c3aed", A: "#166534", E: "#b45309", R: "#b45309" };

const CSS = `
  ${FRAME_CSS}
  .intro { font-weight: 600; margin-bottom: 4mm; }
  .fig { width: 100%; height: 88mm; border: 0.3mm solid #cbd5e1; border-radius: 2mm; margin-bottom: 5mm; }
  .fig.small { height: 78mm; margin: 2mm 0 1mm; }
  .fig.tiny { height: 52mm; margin: 2mm 0 1mm; }
  .fig > div, .fig svg { width: 100%; height: 100%; }
  .workbox { position: relative; width: 100%; height: 70mm; border: 0.3mm solid #cbd5e1; border-radius: 2mm; margin-bottom: 5mm; }
  .workbox span { position: absolute; top: 2mm; left: 3mm; font-size: 8.5pt; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #6b7280; }
  .skillq { display: grid; grid-template-columns: 9mm 1fr; break-inside: avoid; margin-bottom: 6mm; }
  .skillq .n { font-weight: 700; }
  .skillq .box { grid-column: 2; border: 0.3mm solid #cbd5e1; border-radius: 2mm; margin-top: 2mm; }
  .skillq .box.s { height: 26mm; } .skillq .box.m { height: 36mm; } .skillq .box.l { height: 48mm; }
  .skillq .box.lines { background: repeating-linear-gradient(to bottom, #fff 0, #fff 7.6mm, #9ca3af 7.6mm, #9ca3af 7.85mm); border-color: #cbd5e1; }
  .skillq .box.grid { background-color: #fff; background-image: linear-gradient(#e5e7eb 0.2mm, transparent 0.2mm), linear-gradient(90deg, #e5e7eb 0.2mm, transparent 0.2mm); background-size: 5mm 5mm; }
  .skillq.single { break-after: page; align-content: start; }
  .skillq.single .box.s { height: 90mm; } .skillq.single .box.m { height: 130mm; } .skillq.single .box.l { height: 170mm; }
  .answers { columns: 2; column-gap: 10mm; }
  .answers .a { break-inside: avoid; margin-bottom: 3mm; display: grid; grid-template-columns: 9mm 1fr; }
  .answers .a b { color: #1e3a8a; }
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
function questionHtml({ title, subtitle, exam, questionFigure, answerFigures, blankFigures = [], partFigures = [], workingBox }: ExamPrintInput, n: number, total: number): PartHtml {
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
    const fig2 = partFigures[i] ? `<div class="cap">${esc(p.figure?.label ?? "Figure 2")}</div><div class="fig">${partFigures[i]}</div>` : "";
    return `<section class="part">${fig2}<div class="prompt"><b>${esc(p.label)}</b><span>${mathHtml(p.prompt)}</span><em>[${p.marks} mark${p.marks > 1 ? "s" : ""}]</em></div>${space}</section>`;
  }).join("");

  const scheme = exam.parts.map((p, i) => {
    const fig = answerFigures[i];
    const answer = p.onDiagram
      ? (fig ? `<div class="fig small">${fig}</div>` : "")
      : `<div class="model">${p.model.map((l) => `<div>${mathHtml(l)}</div>`).join("")}</div>${fig ? `<div class="fig tiny">${fig}</div>` : ""}`;
    const marks = p.scheme.map((m) => `<div class="mk"><span class="code" style="background:${CODE_BG[m.code[0]] ?? "#475569"}">${esc(m.code)}</span><span>${mathHtml(m.text)}</span></div>`).join("");
    return `<section class="part"><div class="prompt"><b>${esc(p.label)}</b><span>${mathHtml(p.prompt)}</span><em>[${p.marks}]</em></div>${answer}<div class="marks">${marks}</div></section>`;
  }).join("");

  const tag = total > 1 ? `Question ${n} of ${total} · ` : "";
  const paper = `<div class="paper">
    ${frameHeader(title, subtitle)}
    <div class="meta">${tag}${exam.totalMarks} marks · about ${exam.minutes} minutes</div>
    <div class="intro">${mathHtml(exam.intro)}</div>
    ${questionFigure ? `${exam.parts.some((x) => x.figure) ? `<div class="cap">Figure 1</div>` : ""}<div class="fig">${questionFigure}</div>` : workingBox ? `<div class="workbox"><span>Working</span></div>` : ""}
    ${parts}
  </div>`;
  const markScheme = `<div class="markscheme">
    ${frameHeader(title, subtitle, { tag: "mark scheme", who: false })}
    <div class="meta">${total > 1 ? `Question ${n} · ` : ""}${exam.totalMarks} marks</div>
    ${scheme}
  </div>`;
  return { paper, scheme: markScheme };
}

const KATEX_HEAD = `<style>${katexCss}</style>`;
/** once the fonts are in, open the print dialog (the page itself has no maths to draw: it is already typeset) */
const PRINT_SCRIPT = `<script>
  window.addEventListener('load', function () {
    if (!document.body.getAttribute('data-autoprint')) return;
    var go = function () { setTimeout(function () { window.print(); }, 200); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); else go();
  });
  <\/script>`;

/** how a skill worksheet is laid out: several questions to a page or one, and what each has to work in */
interface SkillLayout {
  perPage: boolean;
  /** "auto" gives each kind of question the room it needs; the others make every working area that kind */
  space: "auto" | "s" | "m" | "l" | "lines" | "grid" | "none";
}
interface SkillPrintQuestion {
  prompt: string;
  /** the answer, with maths between $…$ */
  answer: string;
  /** how much room to work in: s, m or l */
  space?: "s" | "m" | "l";
}
/** the paper and the answers page of a set of skill questions */
function skillParts(title: string, subtitle: string | undefined, questions: SkillPrintQuestion[], layout: SkillLayout = { perPage: false, space: "auto" }): { paper: string; answers: string } {
  const area = (q: SkillPrintQuestion): string => {
    if (layout.space === "none") return "";
    const size = layout.space === "s" || layout.space === "m" || layout.space === "l" ? layout.space : q.space ?? "m";
    return `<div class="box ${size}${layout.space === "lines" ? " lines" : layout.space === "grid" ? " grid" : ""}"></div>`;
  };
  const count = `${questions.length} question${questions.length === 1 ? "" : "s"}`;
  return {
    paper: `<div class="paper">
    ${frameHeader(title, subtitle)}
    <div class="meta">${count}</div>
    ${questions.map((q, i) => `<section class="skillq${layout.perPage ? " single" : ""}"><div class="n">${i + 1}.</div><div class="intro" style="margin:0">${mathHtml(q.prompt)}</div>${area(q)}</section>`).join("\n")}
  </div>`,
    answers: `<div class="markscheme">
    ${frameHeader(title, subtitle, { tag: "answers", who: false })}
    <div class="meta">${count}</div>
    <div class="answers">${questions.map((q, i) => `<div class="a"><b>${i + 1}.</b><div>${mathHtml(q.answer)}</div></div>`).join("\n")}</div>
  </div>`,
  };
}
const documentHtml = (title: string, papers: string[], schemes: string[], autoPrint?: boolean): string => `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>${KATEX_HEAD}<style>${CSS}</style></head><body${autoPrint ? ' data-autoprint="1"' : ""}>
  ${papers.join("\n")}
  ${schemes.join("\n")}
  ${PRINT_SCRIPT}
  </body></html>`;
/** a worksheet of skill questions: numbered questions each with a blank working box, then (on request) a page of answers (exported so it can be tested without a window) */
export function skillSheetHtml(title: string, questions: SkillPrintQuestion[], opts: { papers?: boolean; schemes?: boolean; autoPrint?: boolean; layout?: SkillLayout; subtitle?: string } = {}): string {
  const s = skillParts(title, opts.subtitle, questions, opts.layout);
  return documentHtml(`${title} — worksheet`, opts.papers === false ? [] : [s.paper], opts.schemes === false ? [] : [s.answers], opts.autoPrint);
}

/** exam papers and skill questions together in one document: every paper first (exam papers, then the skill sheet), then every mark scheme and the answers page */
function sheetsHtml(exams: ExamPrintInput[], skill: { title: string; subtitle?: string; questions: SkillPrintQuestion[]; layout?: SkillLayout } | null, opts: { papers?: boolean; schemes?: boolean; autoPrint?: boolean }): string {
  const items = exams.map((inp, i) => questionHtml(inp, i + 1, exams.length));
  const s = skill && skill.questions.length ? skillParts(skill.title, skill.subtitle, skill.questions, skill.layout) : null;
  const title = exams[0]?.title ?? skill?.title ?? "";
  return documentHtml(`${title} — worksheet`, opts.papers === false ? [] : [...items.map((x) => x.paper), ...(s ? [s.paper] : [])], opts.schemes === false ? [] : [...items.map((x) => x.scheme), ...(s ? [s.answers] : [])], opts.autoPrint);
}
/** `win` is a window already opened at the click (so slow rendering before it cannot make the browser treat the popup as unrequested) */
export function printSheets(exams: ExamPrintInput[], skill: { title: string; subtitle?: string; questions: SkillPrintQuestion[]; layout?: SkillLayout } | null, opts: { papers?: boolean; schemes?: boolean; win?: Window | null } = {}): void {
  const html = sheetsHtml(exams, skill, { ...opts, autoPrint: true });
  const win = opts.win ?? window.open("", "_blank");
  if (!win) { alert("Please allow popups to use the PDF export."); return; }
  win.document.write(html);
  win.document.close();
}

/** the HTML of a whole print: every question paper first, then every mark scheme (exported so it can be tested without a window) */
export function examSetHtml(inputs: ExamPrintInput[], opts: { papers?: boolean; schemes?: boolean; autoPrint?: boolean } = {}): string {
  const items = inputs.map((inp, i) => questionHtml(inp, i + 1, inputs.length));
  const title = inputs[0]?.title ?? "";
  return documentHtml(`${title} — exam question${inputs.length > 1 ? "s" : ""}`, opts.papers === false ? [] : items.map((x) => x.paper), opts.schemes === false ? [] : items.map((x) => x.scheme), opts.autoPrint);
}

/** a single question (paper and mark scheme) */
export function examPrintHtml(input: ExamPrintInput): string { return examSetHtml([input]); }
