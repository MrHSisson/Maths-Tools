import { DECK_SURFACE } from "./theme";
import { isQuestionDisplaySettings, type QuestionDisplaySettings } from "../../api/_questionDisplay";
import { QuestionFrame } from "./QuestionFrame";
import { QuestionLayoutPicker } from "./QuestionLayoutPicker";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Copy, Plus, Trash2, X } from "lucide-react";
import katex from "katex";
import { isCuratedQuestion } from "../../api/_questions";
import { DepthPicker } from "./DepthPicker";
import { briefText } from "./questionBrief";
import { QuestionAuthor } from "./QuestionAuthor";
import { QuestionPresentation, QuestionText } from "./QuestionPresentation";
import { copyQuestion, isDepthQuestion, newQuestion, readyProblems } from "./questions";
import type { CuratedQuestion, QuestionSlideDraft } from "./types";

const button = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40";
type Recovery = { items: CuratedQuestion[]; selected?: number; context?: QuestionSlideDraft; display?: QuestionDisplaySettings; editing?: { q: CuratedQuestion; index: number | null } | null };
function recover(key: string): Recovery | null {
  try {
    const r = JSON.parse(sessionStorage.getItem(key) ?? "null") as Recovery | null;
    if (r?.display && !isQuestionDisplaySettings(r.display)) return null;
    if (!r || !Array.isArray(r.items) || !r.items.every(isCuratedQuestion)) return null;
    if (r.context && (typeof r.context.title !== "string" || (r.context.brief !== undefined && typeof r.context.brief !== "string"))) return null;
    if (r.context) r.context = { title: r.context.title, brief: r.context.brief };   // drafts from before the one-note brief
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
  const makeQuestion = (n: number, level?: CuratedQuestion["level"]): CuratedQuestion => ({ ...newQuestion(tool), ...(mode === "depth" ? { purpose: "explain" as const, depth: { prompt: "Think on your own first, then compare with a partner.", takeaway: "Explain the idea you want to remember." } } : {}), title: `Question ${n}`, level: level ?? start[0]?.level ?? "level1" });
  const startingItems = () => structuredClone(start.length ? start : mode === "skill" ? [makeQuestion(1)] : []);
  const [recovered, setRecovered] = useState(!!recovery);
  const [items, setItems] = useState<CuratedQuestion[]>(() => structuredClone(recovery?.items ?? startingItems()));
  const [selected, setSelected] = useState(recovery?.selected ?? 0);
  const startingContext = (): QuestionSlideDraft => ({ title: initialContext?.title ?? "Skill practice", brief: initialContext?.brief });
  const [context, setContext] = useState<QuestionSlideDraft>(() => structuredClone(recovery?.context ?? startingContext()));
  const [display, setDisplay] = useState<QuestionDisplaySettings>(() => structuredClone(recovery?.display ?? initialDisplay));
  const [picking, setPicking] = useState(mode === "depth" && !start.length);
  const [cardPreview, setCardPreview] = useState<CuratedQuestion | null>(null);
  const [copied, setCopied] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const questionList = useRef<HTMLElement>(null);
  useEffect(() => { const el = dialog.current!; el.showModal(); el.focus(); return () => el.close(); }, []);   // focus the window, not the title box
  useEffect(() => { try { sessionStorage.setItem(key, JSON.stringify({ items, selected, context, display })); } catch { /* draft stays in memory */ } }, [key, items, selected, context, display]);
  const close = () => { try { sessionStorage.removeItem(key); } catch { /* ignore */ } onClose(); };
  const at = Math.min(selected, Math.max(0, items.length - 1));
  const q = items[at];
  useEffect(() => { questionList.current?.querySelector<HTMLElement>('[aria-current="step"]')?.scrollIntoView({ block: "nearest", inline: "nearest" }); }, [at, items.length, picking]);
  const preview = picking ? cardPreview : q;
  const standaloneDepth = mode === "depth" || items.some(isDepthQuestion);
  const savedDisplay: QuestionDisplaySettings = standaloneDepth ? { presentation: "full", visualiser: false } : display;
  const errors = [...new Set(items.flatMap(mathsProblems))];
  const drafts = items.filter((item) => readyProblems(item).length > 0 || mathsProblems(item).length > 0).length;
  const update = (next: CuratedQuestion) => setItems((xs) => xs.map((item, i) => i === at ? { ...next, status: readyProblems(next).length || mathsProblems(next).length ? "draft" : "ready" } : item));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items]; const [item] = next.splice(from, 1); next.splice(to, 0, item); setItems(next); setSelected(to);
  };
  const add = () => { setItems((xs) => [...xs, makeQuestion(xs.length + 1, xs[xs.length - 1]?.level)]); setSelected(items.length); setPicking(false); };
  const copyBrief = () => { void navigator.clipboard.writeText(briefText(context, identity ?? draftKey, tool)).then(() => setCopied("Copied")).catch(() => setCopied("Copy unavailable")); };
  const icon = "inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30";
  return <dialog ref={dialog} tabIndex={-1} aria-labelledby="questions-title" onCancel={(e) => { e.preventDefault(); close(); }} className="m-auto max-h-[96dvh] w-[calc(100%_-_1rem)] max-w-7xl overflow-hidden outline-none rounded-2xl border border-slate-300 bg-[#f8f9fb] p-0 text-slate-900 shadow-lift backdrop:bg-slate-900/40">
    <div className="flex h-[94dvh] flex-col">
      <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <h2 id="questions-title" className="shrink-0 text-lg font-semibold">{mode === "depth" ? "Depth card" : "Skill practice"}</h2>
          <span className="text-slate-300">·</span>
          <input aria-label="Slide title" value={context.title} onChange={(e) => setContext({ ...context, title: e.target.value })} className="min-w-0 flex-1 rounded-md px-1.5 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button className={icon} aria-label="Close question editor" onClick={close}><X size={18} /></button>
        </div>
        {mode === "skill" && <div className="mt-2 flex items-start gap-2">
          <textarea aria-label="Slide brief" rows={1} value={context.brief ?? ""} onChange={(e) => setContext({ ...context, brief: e.target.value })}
            placeholder="Brief (optional): what should these questions test? e.g. whole-number products with zero factors, no decimals"
            className="min-h-9 flex-1 resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none" />
          <button className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50" onClick={copyBrief} title="Copy the slide and its brief, to ask Claude for questions"><Copy size={13} />{copied || "Copy for chat"}</button>
        </div>}
      </header>
      {recovered && <div className="shrink-0 bg-amber-50 px-5 py-2 text-sm">Recovered your unsaved slide draft. <button className="underline" onClick={() => { setItems(startingItems()); setContext(startingContext()); setDisplay(structuredClone(initialDisplay)); setSelected(0); setRecovered(false); }}>Discard recovered draft</button></div>}
      <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[13rem_minmax(0,1fr)_minmax(0,1fr)] lg:overflow-hidden">
        <nav ref={questionList} aria-label="Questions on this slide" className="flex gap-1.5 overflow-x-auto border-b border-slate-200 bg-white p-2 max-lg:min-h-[3.75rem] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:border-b-0 lg:border-r">
          {items.map((item, i) => {
            const draft = readyProblems(item).length > 0 || mathsProblems(item).length > 0;
            return <button key={item.id} aria-current={!picking && i === at ? "step" : undefined} onClick={() => { setSelected(i); setPicking(false); }}
              className={`flex min-h-11 w-44 shrink-0 items-start gap-2 rounded-lg px-2 py-1.5 text-left lg:w-full ${!picking && i === at ? "bg-blue-50 ring-1 ring-blue-300" : "hover:bg-slate-50"}`}>
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${draft ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`} title={draft ? "Draft: not finished" : undefined}>{i + 1}</span>
              <span className="line-clamp-2 min-w-0 text-xs text-slate-700"><QuestionText lines={item.question.some((s) => s.trim()) ? item.question : ["Write your question…"]} /></span>
            </button>;
          })}
          {mode === "skill" && <button className="flex min-h-11 w-36 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 text-sm font-semibold text-slate-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-900 lg:w-full" onClick={add}><Plus size={15} />Add question</button>}
          {mode === "depth" && <button className="flex min-h-11 w-40 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50 lg:w-full" onClick={() => { setPicking((v) => !v); setCardPreview(null); }}>{picking ? "Back to slide cards" : "Choose Depth card"}</button>}
        </nav>
        <section aria-label="Selected question" className="min-w-0 bg-white p-4 sm:p-5 lg:overflow-y-auto">
          {picking ? <DepthPicker tool={tool} onPreview={setCardPreview} onChoose={(card) => { setItems((xs) => [...xs, copyQuestion(card)]); setSelected(items.length); setPicking(false); setCardPreview(null); }} />
            : q ? <>
              <div className="mb-3 flex items-center gap-0.5">
                <h3 className="mr-auto font-semibold">Question {at + 1} <span className="font-normal text-slate-400">of {items.length}</span></h3>
                <button className={icon} aria-label="Duplicate" title="Duplicate" onClick={() => { setItems((xs) => [...xs.slice(0, at + 1), copyQuestion(q), ...xs.slice(at + 1)]); setSelected(at + 1); }}><Copy size={16} /></button>
                <button className={icon} aria-label="Move question earlier" title="Move earlier" disabled={at === 0} onClick={() => move(at, at - 1)}><ArrowUp size={16} /></button>
                <button className={icon} aria-label="Move question later" title="Move later" disabled={at === items.length - 1} onClick={() => move(at, at + 1)}><ArrowDown size={16} /></button>
                <button className={`${icon} hover:!text-red-700`} aria-label="Remove" title="Remove" onClick={() => { setItems((xs) => xs.filter((_, i) => i !== at)); setSelected(Math.max(0, at - 1)); }}><Trash2 size={16} /></button>
              </div>
              <QuestionAuthor key={q.id} question={q} onChange={update} library={items} openOnly={grid} />
            </> : <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No questions yet. <button className="font-semibold text-blue-800 underline" onClick={add}>Add one</button>{mode === "depth" ? " or choose a Depth card." : "."}</div>}
        </section>
        <aside aria-label="Classroom preview" className="min-w-0 border-t border-slate-200 p-4 sm:p-5 lg:overflow-y-auto lg:border-l lg:border-t-0">
          <div className="mb-3 flex flex-wrap items-center gap-2"><h3 className="mr-auto text-sm font-semibold text-slate-600">Preview</h3>{!grid && !standaloneDepth && <QuestionLayoutPicker compact value={display} onChange={setDisplay} />}</div>
          {preview?.question.some((s) => s.trim()) ? <div style={{ background: DECK_SURFACE, height: preview.depth ? 620 : undefined }} className="h-[460px] min-h-[320px] max-sm:h-[520px] rounded-2xl border border-slate-300 bg-white p-4 shadow-card"><QuestionFrame display={grid ? {} : savedDisplay} live={false}><QuestionPresentation key={`${preview.id}-${JSON.stringify(preview)}`} question={preview} standaloneDepth={standaloneDepth} live base={24} stacked={!standaloneDepth && !!display.presentation && display.presentation !== "full" && !grid} /></QuestionFrame></div>
            : <div className="rounded-xl border border-dashed border-slate-300 p-8 text-sm text-slate-500">{picking ? "Preview a Depth card to see it here." : "The question appears here as you write it."}</div>}
        </aside>
      </div>
      <footer className="flex shrink-0 flex-wrap items-center gap-3 border-t border-slate-200 bg-white px-5 py-3"><span className={`text-sm ${errors.length ? "text-red-700" : "text-slate-500"}`}>{errors[0] || `${items.length} question${items.length === 1 ? "" : "s"}${drafts ? ` · ${drafts} unfinished (saved as drafts)` : ""}`}</span><button className={`${button} ml-auto`} onClick={close}>Cancel</button><button disabled={errors.length > 0 || !items.every(isCuratedQuestion)} className={`${button} !border-blue-900 !bg-blue-900 !text-white`} onClick={() => { onApply(structuredClone(items), structuredClone(context), structuredClone(savedDisplay)); close(); }}>Apply to slide</button></footer>
    </div>
  </dialog>;
}
