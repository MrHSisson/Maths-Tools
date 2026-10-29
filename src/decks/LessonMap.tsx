import { useEffect, useRef, useState } from "react";
import { Copy, X } from "lucide-react";
import { deckBriefsText } from "./questionBrief";
import { FAMILY_STYLE, type Slide } from "./types";

/** A title without its `$…$` markers, with the common symbols shown as symbols. */
const plainTitle = (t: string) => t.replace(/\$/g, "").replace(/\\times/g, "×").replace(/\\div/g, "÷").replace(/\\approx/g, "≈").trim();

/** The lesson thread: every slide in order with its one optional brief. Applying records a single editor undo;
 *  Cancel (or Esc) discards the draft. */
export function LessonMap({ slides, index, deckTitle, onApply, onClose }: { slides: Slide[]; deckTitle: string; index: number; onApply: (slides: Slide[]) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const current = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState(slides);
  const [copied, setCopied] = useState("");
  useEffect(() => { const el = dialog.current!; el.showModal(); current.current?.scrollIntoView({ block: "center" }); current.current?.focus(); return () => el.close(); }, []);
  const written = draft.filter((s) => s.brief?.trim()).length;
  const setBrief = (i: number, brief: string) => setDraft((ss) => ss.map((s, k) => (k === i ? { ...s, brief: brief || undefined } : s)));
  const copy = () => { void navigator.clipboard.writeText(deckBriefsText({ title: deckTitle, slides: draft })).then(() => setCopied("Copied. Paste it into chat.")).catch(() => setCopied("Copy was unavailable here.")); };
  return <dialog ref={dialog} aria-labelledby="lesson-map-title" onCancel={(e) => { e.preventDefault(); onClose(); }} className="m-auto max-h-[94dvh] w-[calc(100%_-_2rem)] max-w-3xl overflow-hidden rounded-2xl border border-slate-300 bg-white p-0 text-slate-900 shadow-lift backdrop:bg-slate-900/40">
    <div className="flex max-h-[94dvh] flex-col">
      <header className="flex items-start gap-3 border-b border-slate-200 px-5 py-4">
        <div className="min-w-0"><h2 id="lesson-map-title" className="text-xl font-semibold">Lesson thread</h2>
          <p className="mt-0.5 text-sm text-slate-500">An optional brief for the slides that need one: what the questions should test, or the key skill. Kept off the classroom display.</p></div>
        <button className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="Close lesson thread" onClick={onClose}><X size={18} /></button>
      </header>
      <ol aria-label="Lesson sequence" className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto px-5">
        {draft.map((s, i) => (
          <li key={s.id} className={`flex gap-3 py-2.5 ${i === index ? "-mx-5 bg-blue-50/60 px-5" : ""}`}>
            <span className="w-6 shrink-0 pt-1.5 text-right text-xs tabular-nums text-slate-400">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: FAMILY_STYLE[s.family].colour }} /><span className="truncate">{plainTitle(s.title) || "(untitled)"}</span></div>
              <textarea ref={i === index ? current : undefined} rows={s.brief?.trim() ? 2 : 1} value={s.brief ?? ""} onChange={(e) => setBrief(i, e.target.value)} aria-label={`Brief for slide ${i + 1}`}
                placeholder="Optional" className="mt-1 w-full resize-y rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm text-slate-700 placeholder:text-slate-400 hover:border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none" />
            </div>
          </li>
        ))}
      </ol>
      <footer className="flex flex-wrap items-center gap-2 border-t border-slate-200 px-5 py-3">
        <button className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={copy}><Copy size={14} />Copy briefs for chat</button>
        <span role="status" className="text-sm text-slate-500">{copied || `${written} of ${draft.length} slides have a brief`}</span>
        <button className="ml-auto min-h-10 rounded-lg px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100" onClick={onClose}>Cancel</button>
        <button className="min-h-10 rounded-lg bg-blue-900 px-4 text-sm font-semibold text-white hover:bg-blue-800" onClick={() => onApply(draft)}>Apply lesson thread</button>
      </footer>
    </div>
  </dialog>;
}
