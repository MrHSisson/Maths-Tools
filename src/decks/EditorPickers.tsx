import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Plus, RefreshCw, Search, X } from "lucide-react";
import { InlineMath, MathRenderer } from "../shared/components/MathRenderer";
import { MISCONCEPTIONS, misconceptionLabel } from "../shared/misconceptions";
import type { AnyQuestion } from "../shared";
import { Menu, MenuHeading, MenuItem, input, small } from "./EditorChrome";
import { GENERATOR_TOOL_INFO, generateSet } from "./generators";
import { fromGenerated } from "./SlideCanvas";
import { allQuestions } from "./store";
import type { BankQuestion, GeneratorPreset } from "./types";

// Pickers for connecting a slide to the site's tools: a searchable tool list, a browser for the hand-picked questions, and a
// live preview of what a generator will ask. Used by the generator, book activity, practice, grid and Depth panels.

const words = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
const matches = (haystack: string, query: string) => { const h = haystack.toLowerCase(); return words(query).every((w) => h.includes(w)); };

function ToolList({ value, onPick }: { value: string; onPick: (id: string) => void }) {
  const [q, setQ] = useState("");
  const shown = GENERATOR_TOOL_INFO.filter((t) => matches(`${t.name} ${t.group ?? ""} ${t.category}`, q));
  const strands = [...new Set(shown.map((t) => t.category))];
  return (
    <div>
      <div className="sticky top-0 z-10 bg-white p-1">
        <div className="relative">
          <Search size={13} className="pointer-events-none absolute left-2 top-2.5 text-slate-400" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tools" aria-label="Search tools" className={`${input} pl-7`} />
        </div>
      </div>
      {!shown.length && <p className="px-2 py-2 text-xs text-slate-500">No tool matches “{q}”.</p>}
      {strands.map((c) => (
        <div key={c}>
          <MenuHeading>{c}</MenuHeading>
          {shown.filter((t) => t.category === c).map((t) => (
            <MenuItem key={t.id} label={t.id === value ? `${t.name}  ✓` : t.name} note={t.group} onClick={() => onPick(t.id)} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Choose a tool: a searchable list grouped by strand (the landing page's own grouping). */
export function ToolPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const info = GENERATOR_TOOL_INFO.find((t) => t.id === value);
  return (
    <Menu full wide title="Choose a tool" button={<span className="truncate">{info?.name ?? value}</span>}>
      {(close) => <ToolList value={value} onPick={(id) => { close(); if (id !== value) onChange(id); }} />}
    </Menu>
  );
}

// ── What a generator will ask ──────────────────────────────────────────────────

function QuestionLine({ q }: { q: ReturnType<typeof fromGenerated> }) {
  return q.lines?.length
    ? <div className="space-y-0.5 text-sm">{q.lines.map((l, i) => <div key={i}><InlineMath text={l} /></div>)}</div>
    : <div className="text-lg"><MathRenderer latex={q.latex} /></div>;
}

/** What the slide will ask with these settings: the question (or the first few of a set) and its answer on demand.
 *  With `onPick` the seed belongs to the slide ("Show another" changes what the slide opens on); without it the preview is only a look. */
export function GeneratorPreview({ tool, preset, count = 1, seed, onPick }: { tool: string; preset: GeneratorPreset; count?: number; seed?: number; onPick?: (seed: number) => void }) {
  const [local, setLocal] = useState(1);
  const [qs, setQs] = useState<AnyQuestion[] | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const at = seed ?? local;
  const presetKey = JSON.stringify(preset);
  useEffect(() => {
    let on = true;
    setQs(null);
    void generateSet(tool, preset, Math.min(count, 4), at).then((x) => { if (on) setQs(x); });
    return () => { on = false; };
  }, [tool, presetKey, count, at]);   // eslint-disable-line react-hooks/exhaustive-deps -- deliberate: presetKey stands for preset
  const another = () => { const n = Math.floor(Math.random() * 1e9); if (onPick) onPick(n); else setLocal(n); };
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
      <div className="mb-1 flex items-center gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{count > 1 ? "First questions" : "What it asks"}</span>
        <button className={`${small} ml-auto`} onClick={() => setShowAnswer((v) => !v)}>{showAnswer ? <EyeOff size={12} /> : <Eye size={12} />}{showAnswer ? "Hide answer" : "Answer"}</button>
        <button className={small} onClick={another} title={onPick ? "The slide opens on this one" : "Another example"}><RefreshCw size={12} />{onPick ? "Open on another" : "Another"}</button>
      </div>
      {qs === null && <p className="text-xs text-slate-400">Loading…</p>}
      {qs?.length === 0 && <p className="text-xs text-red-600">This tool could not make a question with these settings.</p>}
      {qs?.map((q, i) => { const s = fromGenerated(q); return (
        <div key={q.key} className="flex items-baseline gap-2 border-t border-slate-200 py-1 first:border-0">
          {count > 1 && <span className="w-4 shrink-0 text-xs text-slate-400">{i + 1}</span>}
          <div className="min-w-0 flex-1"><QuestionLine q={s} />{showAnswer && <div className="text-sm text-emerald-800">= <MathRenderer latex={s.answer} />{s.suffix ? ` ${s.suffix}` : ""}</div>}</div>
        </div>); })}
    </div>
  );
}

// ── The hand-picked questions ──────────────────────────────────────────────────

const LEVELS = [["level1", "Level 1"], ["level2", "Level 2"], ["level3", "Level 3"]] as const;

/** Browse every hand-picked question: filter by tool, level and misconception, search the maths, see the answer, tick several and add them at once. */
export function QuestionBrowser({ tool, aim, taken, onAdd, onNew, onClose }: {
  tool?: string; aim?: string; taken: string[]; onAdd: (ids: string[]) => void; onNew: () => void; onClose: () => void;
}) {
  const [toolF, setToolF] = useState(tool ?? "");
  const [level, setLevel] = useState("");
  const [tag, setTag] = useState("");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const all = useMemo(() => allQuestions(), []);
  const tools = [...new Set(all.map((q) => q.tool))];
  const tags = [...new Set(all.filter((q) => !toolF || q.tool === toolF).map((q) => q.tag))];
  const text = (q: BankQuestion) => `${q.latex} ${(q.lines ?? []).join(" ")} ${q.answer} ${misconceptionLabel(q.tag)}`;
  const shown = all.filter((q) => (!toolF || q.tool === toolF) && (!level || q.level === level) && (!tag || q.tag === tag) && (!query || matches(text(q), query)))
    .sort((a, b) => Number(b.tag === aim) - Number(a.tag === aim));
  const toolName = (id: string) => GENERATOR_TOOL_INFO.find((t) => t.id === id)?.name ?? id;
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-900/40 p-4" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }} onKeyDown={(e) => e.stopPropagation()} onPaste={(e) => e.stopPropagation()}>
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-slate-300 bg-white shadow-lift">
        <div className="flex items-center gap-2 border-b border-slate-200 p-4">
          <h2 className="text-xl font-semibold text-slate-900">Choose questions</h2>
          <span className="text-xs text-slate-500">{shown.length} of {all.length} hand-picked questions</span>
          <button onClick={onClose} className="ml-auto rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3">
          <div className="relative min-w-[10rem] flex-1">
            <Search size={13} className="pointer-events-none absolute left-2 top-2.5 text-slate-400" />
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the maths or the misconception" aria-label="Search questions" className={`${input} pl-7`} />
          </div>
          <select value={toolF} onChange={(e) => { setToolF(e.target.value); setTag(""); }} className={`${input} w-auto`} aria-label="Tool">
            <option value="">All tools</option>{tools.map((t) => <option key={t} value={t}>{toolName(t)}</option>)}
          </select>
          <select value={tag} onChange={(e) => setTag(e.target.value)} className={`${input} w-auto max-w-[16rem]`} aria-label="Misconception">
            <option value="">Any misconception</option>{tags.map((t) => <option key={t} value={t}>{misconceptionLabel(t)}</option>)}
          </select>
          <div className="flex gap-1">
            <button className={`${small} ${level === "" ? "!bg-slate-800 !text-white" : ""}`} onClick={() => setLevel("")}>Any level</button>
            {LEVELS.map(([k, l]) => <button key={k} className={`${small} ${level === k ? "!bg-slate-800 !text-white" : ""}`} onClick={() => setLevel(k)}>{l.slice(-1)}</button>)}
          </div>
        </div>
        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-3">
          {!shown.length && <p className="text-sm text-slate-500">Nothing matches. Clear a filter, or write a new question.</p>}
          {shown.map((q) => {
            const used = taken.includes(q.id), on = picked.includes(q.id);
            return (
              <label key={q.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-2.5 ${used ? "cursor-default border-slate-200 bg-slate-50 opacity-60" : on ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}>
                <input type="checkbox" disabled={used} checked={used || on} onChange={() => toggle(q.id)} className="mt-1.5" />
                <div className="min-w-0 flex-1">
                  {q.lines?.length ? <div className="space-y-0.5 text-sm">{q.lines.map((l, i) => <div key={i}><InlineMath text={l} /></div>)}</div> : <div className="text-xl"><MathRenderer latex={q.latex} /></div>}
                  <div className="text-sm text-emerald-800">= <MathRenderer latex={q.answer} /></div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium">Level {q.level.slice(-1)}</span>
                    {!tool && <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium">{toolName(q.tool)}</span>}
                    {q.tag === aim && <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800">Matches this slide</span>}
                    {used && <span className="rounded-full bg-slate-200 px-2 py-0.5 font-medium">Already on this slide</span>}
                    <span className="min-w-0 truncate" title={MISCONCEPTIONS[q.tag]?.label}>{misconceptionLabel(q.tag)}</span>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
        <div className="flex items-center gap-2 border-t border-slate-200 p-3">
          <button className={small} onClick={() => { onClose(); onNew(); }}><Plus size={14} />Write a new question</button>
          <button onClick={onClose} className="ml-auto rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
          <button disabled={!picked.length} onClick={() => { onAdd(picked); onClose(); }} className="rounded-xl bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-40">
            {picked.length ? `Add ${picked.length} question${picked.length === 1 ? "" : "s"}` : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
