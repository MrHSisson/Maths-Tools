import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { QuestionBriefFields } from "./QuestionBrief";
import type { Slide } from "./types";

const fields = [
  ["purpose", "Teaching purpose", "What should pupils understand by the end of this slide?"],
  ["questionFocus", "Question focus", "Which question types belong here? What stays fixed, varies or is excluded?"],
  ["evidence", "Listen / look for", "What response would show understanding or reveal the misconception?"],
  ["next", "Next move", "How does this prepare the next slide? What if pupils are not ready?"],
] as const;

/** One ordered, editable teaching brief; applying records a single editor undo. */
export function LessonMap({ slides, index, deckTitle, onApply, onClose }: { slides: Slide[]; deckTitle: string; index: number; onApply: (slides: Slide[]) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(slides);
  const [at, setAt] = useState(index);
  useEffect(() => { const el = dialog.current!; el.showModal(); return () => el.close(); }, []);
  const slide = draft[at];
  return <dialog ref={dialog} aria-labelledby="lesson-map-title" onCancel={(e) => { e.preventDefault(); onClose(); }} className="m-auto max-h-[94dvh] w-[calc(100%_-_2rem)] max-w-6xl overflow-hidden rounded-2xl border border-slate-300 bg-white p-0 text-slate-900 shadow-lift backdrop:bg-slate-900/40">
    <div className="flex max-h-[94dvh] flex-col">
      <header className="flex items-start gap-4 border-b border-slate-200 p-5"><div><h2 id="lesson-map-title" className="text-2xl font-semibold">Lesson thread</h2><p className="mt-1 text-sm text-slate-500">The purpose and question brief for every slide. Saved with the deck; kept off the classroom display.</p></div><button className="ml-auto min-h-11 min-w-11" aria-label="Close lesson thread" onClick={onClose}><X /></button></header>
      <div className="grid min-h-0 overflow-y-auto md:grid-cols-[minmax(230px,1fr)_2fr]">
        <nav aria-label="Lesson sequence" className="max-h-64 space-y-1 overflow-auto border-b border-slate-200 bg-slate-50 p-3 md:max-h-[65dvh] md:border-b-0 md:border-r">{draft.map((s, i) => <button key={s.id} aria-current={at === i ? "step" : undefined} onClick={() => setAt(i)} className={`block min-h-11 w-full rounded-xl p-3 text-left ${at === i ? "bg-blue-100 text-blue-950" : "hover:bg-white"}`}><span className="text-sm font-semibold">{i + 1}. {s.title}</span><span className="mt-1 block text-xs text-slate-600">{s.intent?.purpose || "Teaching purpose not yet written"}</span></button>)}</nav>
        <section className="space-y-4 p-5"><h3 className="text-lg font-semibold">{at + 1}. {slide.title}</h3>{fields.map(([key, label, hint]) => <label key={key} className="block text-sm font-semibold">{label}<span className="my-1 block text-xs font-normal text-slate-500">{hint}</span><textarea rows={3} value={slide.intent?.[key] ?? ""} onChange={(e) => setDraft((ss) => ss.map((s, i) => i === at ? { ...s, intent: { purpose: "", questionFocus: "", evidence: "", next: "", ...s.intent, [key]: e.target.value } } : s))} className="w-full rounded-xl border border-slate-300 p-3 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500" /></label>)}{(slide.questionBrief || slide.els.some((e) => e.kind === "questions" || e.kind === "practice")) && <details className="rounded-xl border border-slate-300 p-3"><summary className="min-h-10 cursor-pointer font-semibold">Question brief</summary><QuestionBriefFields value={slide} tool={slide.questionBrief?.solution.tool ?? "estimation"} identity={`${deckTitle} / ${slide.id}`} onChange={(context) => setDraft((ss) => ss.map((s, i) => i === at ? { ...s, ...context } : s))} /></details>}</section>
      </div>
      <footer className="flex justify-end gap-3 border-t border-slate-200 p-4"><button className="min-h-11 rounded-xl px-4" onClick={onClose}>Cancel</button><button className="min-h-11 rounded-xl bg-blue-900 px-5 font-semibold text-white" onClick={() => onApply(draft)}>Apply lesson thread</button></footer>
    </div>
  </dialog>;
}
