// A textbook-style worded worksheet pinned to a lesson (Harry, 2026-11-26, the Sharing in a Ratio lesson): one sheet in lettered parts, each a short
// method box and then numbered worded questions, numbered straight on from one part to the next. Pupils work in their books. It prints on A4
// portrait as TWO pages of questions (made to be printed scaled to A5, two to a sheet) and one page of answers. It is a worksheet element with
// `bookSheet` set. The slide shows the parts named in `show` (all of them when absent), with the answers on a click, so one sheet can serve a
// cue slide at the end of each part of the lesson.
import type { PrintMode } from "../shared";
import { openPrintWindow } from "../shared/print";
import type { DeckElement, Slide } from "./types";

export interface BookItem {
  /** The question as the pupil reads it; maths goes between dollar signs ("share $£80$ in the ratio $3 : 5$"). */
  text: string;
  /** The answer, plain text with the same dollar-sign rule ("Ana = £30, Ben = £50"). */
  answer: string;
}
export interface BookPart {
  id: string;
  /** "Sharing a total" (the letter is added). */
  title: string;
  /** One line that says how to start, in the same dollar-sign text. */
  tip?: string;
  items: BookItem[];
}
export interface BookSheet {
  title: string;
  /** A line under the title ("Work in your book."). */
  note?: string;
  parts: BookPart[];
  /** Parts the slide shows (ids); every part when absent. The printed sheet always has every part. */
  show?: string[];
}

/** The two printed pages of questions: the first holds the first two parts, the second the rest. */
export const BOOK_QUESTIONS_PER_PAGE = 24;
export const MAX_BOOK_QUESTIONS = 2 * BOOK_QUESTIONS_PER_PAGE;

export const partLetterOf = (i: number) => String.fromCharCode(65 + i);
/** The number of a part's first question (questions run on from part to part). */
export const firstNumber = (sheet: BookSheet, partIndex: number) => 1 + sheet.parts.slice(0, partIndex).reduce((n, p) => n + p.items.length, 0);
export const shownParts = (sheet: BookSheet) => sheet.parts.map((p, i) => ({ p, i })).filter(({ p }) => !sheet.show || sheet.show.includes(p.id));

/** What is wrong with a book sheet, in plain words (empty when it is sound). */
export function bookSheetProblems(sheet: BookSheet): string[] {
  const out: string[] = [];
  if (!sheet.parts.length) out.push("the sheet has no parts");
  const total = sheet.parts.reduce((n, p) => n + p.items.length, 0);
  if (total > MAX_BOOK_QUESTIONS) out.push(`the sheet has ${total} questions; the most is ${MAX_BOOK_QUESTIONS} (two pages)`);
  if (new Set(sheet.parts.map((p) => p.id)).size !== sheet.parts.length) out.push("two parts share an id");
  for (const id of sheet.show ?? []) if (!sheet.parts.some((p) => p.id === id)) out.push(`the slide shows a part (${id}) the sheet does not have`);
  sheet.parts.forEach((p, pi) => {
    if (!p.title.trim()) out.push(`part ${partLetterOf(pi)} has no title`);
    if (!p.items.length) out.push(`part ${partLetterOf(pi)} has no questions`);
    p.items.forEach((it, i) => { if (!it.text.trim() || !it.answer.trim()) out.push(`part ${partLetterOf(pi)} question ${i + 1} has no wording or no answer`); });
  });
  return out;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
/** Text with `$maths$` segments, as HTML (the segments are drawn by KaTeX when the page loads). */
export const bookHtml = (s: string) => s.split("$").map((seg, i) => (i % 2 ? `<span class="m" data-latex="${esc(seg)}"></span>` : esc(seg))).join("");

/** The page that is printed: questions (two pages), answers (one), or both. A4 portrait, KaTeX from the CDN the tool printing uses. */
export function bookSheetHtml(sheet: BookSheet, mode: PrintMode): string {
  const part = (p: BookPart, pi: number, answers: boolean) => `<div class="part" data-id="${pi}"><h2><span class="badge">${partLetterOf(pi)}</span>${esc(p.title)}</h2>
    ${!answers && p.tip ? `<p class="tip">${bookHtml(p.tip)}</p>` : ""}
    <ol start="${firstNumber(sheet, pi)}">${p.items.map((it) => `<li>${bookHtml(answers ? it.answer : it.text)}</li>`).join("")}</ol></div>`;
  const head = (answers: boolean, cont: boolean) => `<h1>${esc(sheet.title)}${answers ? " <span>Answers</span>" : ""}${cont ? " <span>continued</span>" : ""}</h1>${!answers && !cont && sheet.note ? `<p class="note">${esc(sheet.note)}</p>` : ""}`;
  // every part starts on page 1; the print script moves the last questions on to page 2 (a part may carry on there) until page 1 is full, and tightens the type if page 2 would overflow
  const questions = `<section class="page" id="p1">${head(false, false)}${sheet.parts.map((p, i) => part(p, i, false)).join("")}</section><section class="page" id="p2">${head(false, true)}</section>`;
  const answerPage = `<section class="page ans">${head(true, false)}<div class="acols">${sheet.parts.map((p, i) => part(p, i, true)).join("")}</div></section>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(sheet.title)}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"><\/script>
<style>
  *{box-sizing:border-box} @page{size:A4 portrait;margin:12mm 13mm 10mm}
  body{margin:0 auto;width:184mm;font-family:"Segoe UI",Arial,sans-serif;color:#0f172a;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{break-after:page;height:275mm;overflow:hidden} .page:last-child{break-after:auto}
  h1{font-size:23px;margin:0 0 2mm;padding-bottom:1.6mm;border-bottom:.5mm solid #1e3a8a;color:#1e3a8a;font-weight:700} h1 span{font-weight:400;color:#64748b;font-size:.62em;margin-left:3mm}
  .note{margin:0 0 3mm;font-size:12.5px;color:#64748b}
  .part{margin-top:4.5mm;break-inside:avoid}
  h2 small{font-weight:400;color:#64748b;font-size:.75em;margin-left:1mm}
  h2{display:flex;align-items:center;gap:2.5mm;margin:0 0 1.6mm;font-size:16px;color:#1e3a8a}
  .badge{display:inline-flex;align-items:center;justify-content:center;width:7mm;height:7mm;border-radius:1.6mm;background:#1e3a8a;color:#fff;font-size:14px}
  .tip{margin:0 0 2.2mm;padding:1.6mm 3mm;background:#eef2ff;border-left:1mm solid #1e3a8a;border-radius:0 1.2mm 1.2mm 0;font-size:13px;color:#1e293b}
  ol{margin:0;padding:0;list-style:none}
  li{position:relative;padding:1.55mm 0 1.55mm 9mm;border-bottom:.25mm solid #e2e8f0;font-size:var(--fs,14.5px);line-height:1.38}
  li::before{content:attr(data-n);position:absolute;left:0;top:1.55mm;width:7mm;font-weight:700;color:#1e3a8a;font-size:.95em}
  .m .katex{font-size:1.04em}
  .ans li{color:#1e3a8a;font-size:12.5px;padding-top:.9mm;padding-bottom:.9mm} .ans li::before{top:.9mm}
  .acols{column-count:2;column-gap:9mm} .acols .part{margin-top:0;margin-bottom:3mm}
</style></head><body>${mode !== "answers" ? questions : ""}${mode !== "questions" ? answerPage : ""}
<script>
document.querySelectorAll('ol').forEach(function(o){var n=+o.getAttribute('start')||1;o.querySelectorAll('li').forEach(function(l){l.setAttribute('data-n',n++)})});
document.querySelectorAll('.m').forEach(function(e){try{katex.render(e.getAttribute('data-latex'),e,{throwOnError:false})}catch(x){e.textContent=e.getAttribute('data-latex')}});
(function(){var p1=document.getElementById('p1'),p2=document.getElementById('p2');if(!p1)return;
  var d=document.createElement('div');d.style.cssText='height:275mm;position:absolute;visibility:hidden';document.body.appendChild(d);var H=d.offsetHeight;d.remove();
  var fit=function(el){return el.scrollHeight<=H+1};
  [14.5,14,13.5,13,12.5].some(function(fs){
    document.body.style.setProperty('--fs',fs+'px');
    [].slice.call(p2.querySelectorAll('.part')).forEach(function(x){var home=p1.querySelector('.part[data-id="'+x.getAttribute('data-id')+'"]');[].slice.call(x.querySelectorAll('li')).forEach(function(l){home.querySelector('ol').appendChild(l)});home.style.display='';x.remove()});
    var parts=[].slice.call(p1.querySelectorAll('.part'));
    while(!fit(p1)){
      var last=parts.slice().reverse().filter(function(x){return x.querySelector('li')})[0];if(!last)break;
      var id=last.getAttribute('data-id'),dest=p2.querySelector('.part[data-id="'+id+'"]');
      if(!dest){dest=document.createElement('div');dest.className='part';dest.setAttribute('data-id',id);dest.innerHTML=last.querySelector('h2').outerHTML+'<ol></ol>';dest.querySelector('h2').insertAdjacentHTML('beforeend','<small>continued</small>');var after=[].slice.call(p2.querySelectorAll('.part')).filter(function(x){return +x.getAttribute('data-id')>+id})[0];p2.insertBefore(dest,after||null)}
      var lis=last.querySelectorAll('li'),li=lis[lis.length-1],o=dest.querySelector('ol');o.insertBefore(li,o.firstChild);
      if(!last.querySelector('li'))last.style.display='none'}
    [].slice.call(p2.querySelectorAll('.part')).forEach(function(x){var home=p1.querySelector('.part[data-id="'+x.getAttribute('data-id')+'"]');if(home.style.display==='none'){var sm=x.querySelector('small');if(sm)sm.remove();var tip=home.querySelector('.tip');if(tip)x.querySelector('h2').insertAdjacentHTML('afterend',tip.outerHTML)}});
    return fit(p2)});
})();
</script>
</body></html>`;
}

/** Opens the print window from the print button (nothing asynchronous before it, so the browser allows it). */
export function printBookSheet(sheet: BookSheet, mode: PrintMode): void {
  openPrintWindow(bookSheetHtml(sheet, mode), 900);
}

/** A slide holding a book sheet. `pinned` makes it the one File > Worksheets and the player's Print buttons find. */
export function bookSheetSlide(id: string, sheet: BookSheet, tool: string, opts: { pinned?: boolean; brief?: string } = {}): Slide {
  const count = shownParts(sheet).reduce((n, { p }) => n + p.items.length, 0);
  const el = { id: `${id}-1`, kind: "worksheet", x: 40, y: 30, w: 1520, h: 840, tool, preset: { sub: "mixed", level: "level2" }, count, cols: 1,
    ...(opts.pinned ? { pin: { title: sheet.title, paper: "A4", layout: "list", borders: false } } : {}), bookSheet: sheet } as DeckElement;
  return { id, family: "practice", title: sheet.parts.filter((p) => !sheet.show || sheet.show.includes(p.id)).map((p) => p.title).join(" and "), els: [el], ...(opts.brief ? { brief: opts.brief } : {}) };
}
