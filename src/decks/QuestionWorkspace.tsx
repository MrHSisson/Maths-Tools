import { DECK_SURFACE } from "./theme";
import { isQuestionDisplaySettings, type QuestionDisplaySettings } from "../../api/_questionDisplay";
import { QuestionFrame } from "./QuestionFrame";
import { QuestionLayoutPicker } from "./QuestionLayoutPicker";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Copy, X } from "lucide-react";
import katex from "katex";
import { isCuratedQuestion } from "../../api/_questions";
import { isQuestionBrief } from "../../api/_questionBrief";
import { DepthPicker } from "./DepthPicker";
import { QuestionBriefFields } from "./QuestionBrief";
import { defaultQuestionBrief } from "./questionBrief";
import { QuestionAuthor } from "./QuestionAuthor";
import { QuestionPresentation, QuestionText } from "./QuestionPresentation";
import { copyQuestion, newQuestion, readyProblems } from "./questions";
import type { CuratedQuestion, QuestionSlideDraft } from "./types";

const button = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40";
type Recovery = { items: CuratedQuestion[]; selected?: number; context?: QuestionSlideDraft; display?: QuestionDisplaySettings; editing?: { q: CuratedQuestion; index: number | null } | null };
function recover(key: string): Recovery | null {
  try {
    const r = JSON.parse(sessionStorage.getItem(key) ?? "null") as Recovery | null;
    if (r?.display && !isQuestionDisplaySettings(r.display)) return null;
    if (!r || !Array.isArray(r.items) || !r.items.every(isCuratedQuestion)) return null;
    if (r.context?.intent && !["purpose", "questionFocus", "evidence", "next"].every((key) => typeof (r.context!.intent as unknown as Record<string, unknown>)[key] === "string")) return null;
    if (r.context && (typeof r.context.title !== "string" || (r.context.questionBrief && !isQuestionBrief(r.context.questionBrief)))) return null;
    // Preserve unsaved new questions from the earlier workspace as ordinary slide drafts.
    if (r.editing?.index === null && isCuratedQuestion(r.editing.q)) r.items.push(r.editing.q);
    return r;
  } catch { return null; }
}
function mathsProblems(q: CuratedQuestion): string[] {
  const errors: string[] = [];
  const strings = (v: unknown): string[] => typeof v === "string" ? [v] : Array.isArray(v) ? v.flatMap(strings) : v && typeof v === "object" ? Object.values(v).flatMap(strings) : [];
  for (const text of strings(q)) {
    if ((text.match(/(?<!\\)\$/g) ?? []).length % 2) { errors.push("Close each inline maths expression with a matching $. Use the equation editor for help."); break; }
    try { for (const m of text.matchAll(/\$([^$]+)\$/g)) katex.renderToString(m[1], { throwOnError: true }); } catch { errors.push("Check the inline maths in the question, answers and teaching guidance."); break; }
  }
  if (q.format === "error") for (const line of q.lines) try { katex.renderToString(line, { throwOnError: true }); } catch { errors.push("Check the LaTeX in the worked lines."); break; }
  return errors;
}
export function QuestionWorkspace({ start, tool, draftKey, context: initialContext, display: initialDisplay = {}, identity, mode = "skill", grid = false, onApply, onClose }: {
  start: CuratedQuestion[]; tool: string; draftKey: string; context?: QuestionSlideDraft; display?: QuestionDisplaySettings; identity?: string; mode?: "skill" | "depth"; grid?: boolean; onApply: (items: CuratedQuestion[], context: QuestionSlideDraft, display: QuestionDisplaySettings) => void; onClose: () => void;
}) {
  const key = `mt-question-draft:${draftKey}`;
  const [recovery] = useState(() => recover(key));
  const makeQuestion = (n: number): CuratedQuestion => ({ ...newQuestion(tool), ...(mode === "depth" ? { purpose: "explain" as const, depth: { prompt: "Think on your own first, then compare with a partner.", takeaway: "Explain the idea you want to remember." } } : {}), title: `Question ${n}`, level: initialContext?.questionBrief?.solution.level ?? start[0]?.level ?? "level1" });
  const startingItems = () => structuredClone(start.length ? start : mode === "skill" ? [makeQuestion(1)] : []);
  const [recovered, setRecovered] = useState(!!recovery);
  const [items, setItems] = useState<CuratedQuestion[]>(() => structuredClone(recovery?.items ?? startingItems()));
  const [selected, setSelected] = useState(recovery?.selected ?? 0);
  const startingContext = (): QuestionSlideDraft => ({ title: initialContext?.title ?? "Skill practice", intent: initialContext?.intent, questionBrief: initialContext?.questionBrief ?? defaultQuestionBrief(tool, start[0]?.level) });
  const [context, setContext] = useState<QuestionSlideDraft>(() => structuredClone(recovery?.context ?? startingContext()));
  const [display, setDisplay] = useState<QuestionDisplaySettings>(() => structuredClone(recovery?.display ?? initialDisplay));
  const [picking, setPicking] = useState(mode === "depth" && !start.length);
  const [cardPreview, setCardPreview] = useState<CuratedQuestion | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const questionList = useRef<HTMLElement>(null);
  useEffect(() => { const el = dialog.current!; el.showModal(); return () => el.close(); }, []);
  useEffect(() => { try { sessionStorage.setItem(key, JSON.stringify({ items, selected, context, display })); } catch { /* draft stays in memory */ } }, [key, items, selected, context, display]);
  const close = () => { try { sessionStorage.removeItem(key); } catch { /* ignore */ } onClose(); };
  const at = Math.min(selected, Math.max(0, items.length - 1));
  const q = items[at];
  useEffect(() => {
    const list = questionList.current, row = list?.querySelector<HTMLElement>('[aria-current="step"]');
    if (!list || !row) return;
    const box = list.getBoundingClientRect(), current = row.getBoundingClientRect();
    if (current.top < box.top) list.scrollTop -= box.top - current.top;
    else if (current.bottom > box.bottom) list.scrollTop += current.bottom - box.bottom;
  }, [at, items.length, picking]);
  const preview = picking ? cardPreview : q;
  const errors = [...new Set(items.flatMap(mathsProblems))];
  const completed = items.filter((item) => readyProblems(item).length === 0 && mathsProblems(item).length === 0).length;
  const update = (next: CuratedQuestion) => setItems((xs) => xs.map((item, i) => i === at ? { ...next, status: readyProblems(next).length || mathsProblems(next).length ? "draft" : "ready" } : item));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items]; const [item] = next.splice(from, 1); next.splice(to, 0, item); setItems(next); setSelected(to);
  };
  return <dialog ref={dialog} aria-labelledby="questions-title" onCancel={(e) => { e.preventDefault(); close(); }} className="m-auto max-h-[96dvh] w-[calc(100%_-_1rem)] max-w-7xl overflow-hidden rounded-2xl border border-slate-300 bg-[#f8f9fb] p-0 text-slate-900 shadow-lift backdrop:bg-slate-900/40">
    <div className="flex h-[94dvh] flex-col">
      <header className="flex shrink-0 items-start gap-3 border-b border-slate-200 bg-white px-5 py-4"><div><h2 id="questions-title" className="text-2xl font-semibold">{mode === "depth" ? "Depth card" : "Skill practice"}</h2><p className="mt-1 text-sm text-slate-500">{context.title} · {completed} completed{mode === "skill" ? ` / ${context.questionBrief?.count ?? 5} planned` : ""}</p><p className="mt-1 text-xs text-slate-500">{context.intent?.purpose || "Write questions directly for this slide."}</p></div><button className={`${button} ml-auto`} aria-label="Close question editor" onClick={close}><X size={18} /></button></header>
      {recovered && <div className="shrink-0 bg-amber-50 px-5 py-2 text-sm">Recovered your unsaved slide draft. <button className="underline" onClick={() => { setItems(startingItems()); setContext(startingContext()); setDisplay(structuredClone(initialDisplay)); setSelected(0); setRecovered(false); }}>Discard recovered draft</button></div>}
      <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-2">
        <section aria-label="Slide questions" className="min-w-0 space-y-4 bg-white p-4 sm:p-5">
          <details className="rounded-xl border border-slate-300 p-3"><summary className="min-h-10 cursor-pointer text-sm font-semibold">Question brief · {context.intent?.questionFocus || "Define what this slide tests"}</summary><QuestionBriefFields value={context} tool={tool} identity={identity ?? draftKey} onChange={setContext} /></details>
          {!grid && <QuestionLayoutPicker value={display} onChange={setDisplay} />}
          {mode === "depth" && <button className={button} onClick={() => { setPicking((v) => !v); setCardPreview(null); }}>{picking ? "Back to slide cards" : "Choose Depth card"}</button>}
          {picking ? <DepthPicker tool={tool} onPreview={setCardPreview} onChoose={(card) => { setItems((xs) => [...xs, copyQuestion(card)]); setSelected(items.length); setPicking(false); setCardPreview(null); }} /> : <>
            <nav ref={questionList} aria-label="Questions on this slide" className="grid max-h-40 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">{items.map((item, i) => <button key={item.id} aria-current={i === at ? "step" : undefined} onClick={() => setSelected(i)} className={`block min-h-11 w-full rounded-xl border p-3 text-left ${i === at ? "border-blue-600 bg-blue-50" : "border-slate-300"}`}><span className="text-sm font-semibold">Question {i + 1}{readyProblems(item).length ? " · Draft" : ""}</span><div className="mt-1 line-clamp-1 text-sm"><QuestionText lines={item.question.some((s) => s.trim()) ? item.question : ["Write your question…"]} /></div></button>)}</nav>
            <button className={button} onClick={() => { setItems((xs) => [...xs, { ...makeQuestion(xs.length + 1), level: context.questionBrief?.solution.level ?? "level1" }]); setSelected(items.length); }}>Add my own question</button>
            {q ? <section aria-label="Selected question" className="space-y-4 border-t border-slate-200 pt-4">
              <div className="flex flex-wrap items-center gap-2"><h3 className="mr-auto font-semibold">Question {at + 1}</h3><button className={button} onClick={() => { setItems((xs) => [...xs.slice(0, at + 1), copyQuestion(q), ...xs.slice(at + 1)]); setSelected(at + 1); }}><Copy size={15} />Duplicate</button><button aria-label="Move question earlier" className={button} disabled={at === 0} onClick={() => move(at, at - 1)}><ArrowUp size={16} /></button><button aria-label="Move question later" className={button} disabled={at === items.length - 1} onClick={() => move(at, at + 1)}><ArrowDown size={16} /></button><button className={button} onClick={() => { setItems((xs) => xs.filter((_, i) => i !== at)); setSelected(Math.max(0, at - 1)); }}>Remove</button></div>
              <p className="text-xs text-slate-500">Solution reference: {context.questionBrief?.solution.tool || tool} · {context.questionBrief?.solution.sub || "default sub-tool"} · Level {q.level.slice(-1)}. Follow its method and reveal steps; your working stays editable.</p>
              <QuestionAuthor key={q.id} question={q} onChange={update} library={items} openOnly={grid} />
            </section> : <p className="text-sm text-slate-500">Add a question directly to this slide to begin.</p>}
          </>}
        </section>
        <aside className="min-w-0 space-y-3 border-t border-slate-200 p-4 sm:p-5 lg:border-l lg:border-t-0"><div className="space-y-3 lg:sticky lg:top-0"><h3 className="text-lg font-semibold">Classroom preview</h3><p className="text-sm text-slate-500">Inspect the question, answers and unfolding working.</p>{preview?.question.some((s) => s.trim()) ? <div style={{ background: DECK_SURFACE, height: preview.depth ? 620 : undefined }} className="h-[480px] min-h-[320px] max-sm:h-[560px] rounded-2xl border border-slate-300 bg-white p-4 shadow-card"><QuestionFrame display={grid ? {} : display} live={false}><QuestionPresentation key={`${preview.id}-${JSON.stringify(preview)}`} question={preview} live base={24} stacked={!!display.presentation && display.presentation !== "full" && !grid} /></QuestionFrame></div> : <div className="rounded-xl border border-dashed border-slate-300 p-8 text-slate-500">{picking ? "Preview a Depth card to inspect it here." : "Your question will appear here as you write."}</div>}</div></aside>
      </div>
      <footer className="flex shrink-0 flex-wrap items-center gap-3 border-t border-slate-200 bg-white px-5 py-3"><span className="text-sm text-slate-500">{errors[0] || `${items.length} questions · Incomplete questions can be saved as drafts`}</span><button className={`${button} ml-auto`} onClick={close}>Cancel</button><button disabled={errors.length > 0 || !items.every(isCuratedQuestion)} className={`${button} !border-blue-900 !bg-blue-900 !text-white`} onClick={() => { onApply(structuredClone(items), structuredClone(context), structuredClone(display)); close(); }}>Apply to slide</button></footer>
    </div>
  </dialog>;
}
