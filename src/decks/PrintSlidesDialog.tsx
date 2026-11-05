import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Printer, X } from "lucide-react";
import { SlideCanvas } from "./SlideCanvas";
import { FAMILY_STYLE, type DeckDef } from "./types";
import { KEY_FAMILIES, MAX_COPIES, PAGE_MARGIN_MM, PER_PAGE, PRINT_LAYOUTS, cellSize, cutLines, keyPointSlides, pagesOf, repeatSlides, slotAlign, type Spread, type PerPage } from "./slidePrint";
import { small } from "./EditorPanels";

// File → Print slides…: choose slides (all, just the key points, or your own pick), how many go on a sheet of A4 (1, 2, 4 or 8), and print.
// The pages are drawn into a hidden area of this page and the browser prints only that, so a slide looks exactly as it does on screen.

const choice = (on: boolean) => `${small} ${on ? "!bg-slate-800 !text-white" : ""}`;

export function PrintSlidesDialog({ deck, onClose }: { deck: Pick<DeckDef, "slides" | "title">; onClose: () => void }) {
  const key = useMemo(() => keyPointSlides(deck), [deck]);
  const [picked, setPicked] = useState<Set<number>>(() => new Set(key.length ? key : deck.slides.map((_, i) => i)));
  const [per, setPer] = useState<PerPage>(8);
  const [borders, setBorders] = useState(false);
  const [cutMarks, setCutMarks] = useState(true);
  const [copies, setCopies] = useState(1);
  const [spread, setSpread] = useState<Spread>("centre");
  const [printing, setPrinting] = useState(false);
  const chosen = deck.slides.filter((_, i) => picked.has(i));
  const total = chosen.length * copies;
  const toggle = (i: number) => setPicked((p) => { const n = new Set(p); if (n.has(i)) n.delete(i); else n.add(i); return n; });

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape" && !printing) { e.stopPropagation(); onClose(); } };
    window.addEventListener("keydown", k, true);
    return () => window.removeEventListener("keydown", k, true);
  }, [onClose, printing]);

  // Once the pages are drawn (fonts and maths in, text sizes fitted), open the browser's print window; when it closes, stop drawing them.
  useEffect(() => {
    if (!printing) return;
    let on = true;
    const done = () => { if (on) setPrinting(false); };
    window.addEventListener("afterprint", done);
    void (document.fonts?.ready ?? Promise.resolve()).then(() => new Promise((r) => setTimeout(r, 900))).then(() => { if (on) window.print(); });
    return () => { on = false; window.removeEventListener("afterprint", done); };
  }, [printing]);

  const layout = PRINT_LAYOUTS[per], cell = cellSize(per);
  return (
    <div className="fixed inset-0 z-[2600] flex items-center justify-center bg-slate-900/30 p-4" onPointerDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Print slides" onPointerDown={(e) => e.stopPropagation()} className="flex max-h-full w-full max-w-xl flex-col rounded-2xl border border-slate-300 bg-white p-5 shadow-lift">
        <div className="mb-1 flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-900">Print slides</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><X size={16} /></button></div>
        <p className="mb-3 text-sm text-slate-600">For sticking into books. Choose the slides and how many go on a sheet of A4.</p>
        <div className="mb-2 flex flex-wrap items-center gap-1">
          <button className={choice(picked.size === deck.slides.length)} onClick={() => setPicked(new Set(deck.slides.map((_, i) => i)))}>All slides</button>
          <button className={choice(key.length > 0 && picked.size === key.length && key.every((i) => picked.has(i)))} disabled={!key.length} onClick={() => setPicked(new Set(key))}
            title={`Slides of the kinds ${KEY_FAMILIES.map((f) => FAMILY_STYLE[f].label).join(" and ")}`}>Key points</button>
          <button className={choice(picked.size === 0)} onClick={() => setPicked(new Set())}>None</button>
          <span className="ml-auto text-xs text-slate-500">{picked.size} of {deck.slides.length} chosen</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-slate-200">
          {deck.slides.map((s, i) => (
            <label key={s.id} className="flex min-h-9 cursor-pointer items-center gap-2 border-b border-slate-100 px-3 py-1 text-sm last:border-b-0 hover:bg-slate-50">
              <input type="checkbox" className="h-4 w-4 accent-blue-900" checked={picked.has(i)} onChange={() => toggle(i)} />
              <span className="w-6 text-right text-xs text-slate-400">{i + 1}</span>
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: FAMILY_STYLE[s.family].colour }} />
              <span className="truncate text-slate-800">{s.title || "Untitled"}</span>
            </label>
          ))}
        </div>
        <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">On each sheet</div>
        <div className="mt-1 flex flex-wrap gap-1">{PER_PAGE.map((p) => <button key={p} className={choice(per === p)} onClick={() => setPer(p)}>{PRINT_LAYOUTS[p].label}</button>)}
          <button className={choice(borders)} onClick={() => setBorders((b) => !b)} title="A thin line round each slide">Borders</button>
          <button className={choice(spread === "edges")} onClick={() => setSpread((v) => (v === "edges" ? "centre" : "edges"))} title="Push slides to the outer edges of the sheet, so less paper is wasted round the outside (pieces are then mirror images rather than identical)">Fill to edges</button>
          <button className={choice(cutMarks)} onClick={() => setCutMarks((b) => !b)} title="A faint dashed line between the slides, to cut along">Cut lines</button></div>
        <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Copies of each slide</div>
        <div className="mt-1 flex flex-wrap gap-1">{Array.from({ length: MAX_COPIES }, (_, k) => k + 1).map((n) => <button key={n} className={choice(copies === n)} onClick={() => setCopies(n)}>{n}</button>)}</div>
        <p className="mt-1 text-xs text-slate-500">{layout.cols} column{layout.cols > 1 ? "s" : ""} × {layout.rows} row{layout.rows > 1 ? "s" : ""}, A4 {layout.landscape ? "landscape" : "portrait"}, {Math.round(cell.wMm)} mm wide. {total ? `${Math.ceil(total / per)} sheet${Math.ceil(total / per) > 1 ? "s" : ""}.` : ""}</p>
        <div className="mt-3 flex justify-end gap-2">
          <button className={small} onClick={onClose}>Cancel</button>
          <button className={`${small} !bg-blue-900 !text-white`} disabled={chosen.length === 0 || printing} onClick={() => setPrinting(true)}><Printer size={12} />{printing ? "Preparing…" : "Print"}</button>
        </div>
      </div>
      {printing && createPortal(<PrintArea slides={repeatSlides(chosen, copies)} per={per} borders={borders} cutMarks={cutMarks} spread={spread} />, document.body)}
    </div>
  );
}

/** The pages, off screen until the browser prints, when everything else on the page is hidden. */
function PrintArea({ slides, per, borders, cutMarks, spread }: { slides: DeckDef["slides"]; per: PerPage; borders: boolean; cutMarks: boolean; spread: Spread }) {
  const l = PRINT_LAYOUTS[per], cell = cellSize(per);
  const pages = pagesOf(slides, per);
  const css = `
    #slide-print { position: fixed; left: -99999px; top: 0; }
    .sp-page { display: grid; grid-template-columns: repeat(${l.cols}, ${cell.slotWMm}mm); grid-auto-rows: ${cell.slotHMm}mm; align-content: start; justify-content: start; position: relative; width: ${cell.usableW}mm; height: ${cell.usableH}mm; overflow: hidden; }
    .sp-cut { position: absolute; border: 0 dashed #b8c0cc; pointer-events: none; }
    .sp-cell { width: ${cell.wMm}mm; height: ${cell.hMm}mm; overflow: hidden; position: relative; contain: strict; ${borders ? "outline: 0.3mm solid #94a3b8; outline-offset: -0.15mm;" : ""} }
    @media print {
      @page { size: A4 ${l.landscape ? "landscape" : "portrait"}; margin: ${PAGE_MARGIN_MM}mm; }
      html, body { background: #fff !important; }
      body > *:not(#slide-print) { display: none !important; }
      #slide-print { position: static !important; left: auto !important; }
      .sp-page { break-after: page; page-break-after: always; }
      .sp-page:last-child { break-after: auto; page-break-after: auto; }
      #slide-print, #slide-print * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }`;
  return (
    <div id="slide-print" aria-hidden="true">
      <style>{css}</style>
      {pages.map((pg, i) => (
        <div key={i} className="sp-page">
          {pg.map((s, j) => <div key={`${s.id}-${j}`} className="sp-cell" style={slotAlign(per, j, spread)}><SlideCanvas slide={s} scale={cell.scale} /></div>)}
          {cutMarks && cutLines(per, pg.length).map((c, k) => c.y1 === c.y2
            ? <div key={k} className="sp-cut" style={{ left: `${c.x1}mm`, width: `${c.x2 - c.x1}mm`, top: `${c.y1}mm`, borderTopWidth: "0.25mm" }} />
            : <div key={k} className="sp-cut" style={{ top: `${c.y1}mm`, height: `${c.y2 - c.y1}mm`, left: `${c.x1}mm`, borderLeftWidth: "0.25mm" }} />)}
        </div>))}
    </div>
  );
}
