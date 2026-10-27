import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import katex from "katex";
import { ALL_TOOLS } from "../registry";
import facts from "../generated/toolFacts.json";
import { InlineMath } from "../shared/components/MathRenderer";
import { isCuratedQuestion } from "../../api/_questions";
import { useCloudState } from "./cloud";
import { loadDepthItems } from "./generators";
import { QuestionAuthor } from "./QuestionAuthor";
import { QuestionPresentation, QuestionText } from "./QuestionPresentation";
import { allQuestions, saveQuestion } from "./store";
import { asCurated, copyQuestion, fromDepth, misconceptionChoices, newQuestion } from "./questions";
import type { CuratedQuestion } from "./types";

const button = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40";
const input = "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
type Editing = { q: CuratedQuestion; index: number | null };
type Recovery = { items: CuratedQuestion[]; editing: Editing | null };
function recover(key: string): Recovery | null {
  try { const raw = JSON.parse(sessionStorage.getItem(key) ?? "null") as Recovery | null; return raw && Array.isArray(raw.items) && raw.items.every(isCuratedQuestion) && (!raw.editing || isCuratedQuestion(raw.editing.q)) ? raw : null; } catch { return null; }
}
function mathsProblems(q: CuratedQuestion): string[] {
  const errors: string[] = [];
  const strings = (v: unknown): string[] => typeof v === "string" ? [v] : Array.isArray(v) ? v.flatMap(strings) : v && typeof v === "object" ? Object.values(v).flatMap(strings) : [];
  for (const text of strings(q)) {
    const dollars = (text.match(/(?<!\\)\$/g) ?? []).length;
    if (dollars % 2) { errors.push("Close each inline maths expression with a matching $. Use the equation editor for help."); break; }
    let invalid = false;
    for (const match of text.matchAll(/\$([^$]+)\$/g)) try { katex.renderToString(match[1], { throwOnError: true }); } catch { invalid = true; }
    if (invalid) { errors.push("Check the inline maths in the question, answers and teaching guidance."); break; }
  }
  if (q.format === "error") for (const line of q.lines) try { katex.renderToString(line, { throwOnError: true }); } catch { errors.push("Check the LaTeX in the worked lines."); break; }
  return errors;
}
export function QuestionWorkspace({ start, tool, draftKey, grid = false, onApply, onClose }: {
  start: CuratedQuestion[]; tool: string; draftKey: string; grid?: boolean; onApply: (items: CuratedQuestion[]) => void; onClose: () => void;
}) {
  const cloud = useCloudState();
  const key = `mt-question-draft:${draftKey}`;
  const [recovery] = useState(() => recover(key));
  const [recovered, setRecovered] = useState(!!recovery);
  const [items, setItems] = useState<CuratedQuestion[]>(() => structuredClone(recovery?.items ?? start));
  const [editing, setEditing] = useState<Editing | null>(() => recovery?.editing ?? null);
  const [tab, setTab] = useState<"browse" | "edit" | "sequence">(recovery?.editing ? "edit" : "browse");
  const [library, setLibrary] = useState(() => allQuestions().map(asCurated));
  const [loading, setLoading] = useState(true);
  const [filterTool, setFilterTool] = useState(tool);
  const [level, setLevel] = useState("");
  const [purpose, setPurpose] = useState("");
  const [format, setFormat] = useState("");
  const [source, setSource] = useState("");
  const [tag, setTag] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CuratedQuestion | null>(null);
  const [message, setMessage] = useState("");
  const [dragged, setDragged] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const el = dialog.current!; el.showModal(); return () => el.close(); }, []);
  useEffect(() => {
    let active = true;
    const depthTools = facts.tools.filter((f) => f.depth && f.shell === "ToolShell");
    void Promise.all(depthTools.map(async (t) => (await loadDepthItems(t.id)).map((i) => fromDepth(t.id, i)))).then((depth) => {
      if (active) { setLibrary([...allQuestions().map(asCurated), ...depth.flat()]); setLoading(false); }
    }).catch(() => { if (active) { setLoading(false); setMessage("Some diagnostic activities could not be loaded. Your questions are still available; reopen to retry."); } });
    return () => { active = false; };
  }, []);
  useEffect(() => { try { sessionStorage.setItem(key, JSON.stringify({ items, editing })); } catch { /* the open draft remains in memory */ } }, [key, items, editing]);
  const close = () => { try { sessionStorage.removeItem(key); } catch { /* ignore */ } onClose(); };
  const preview = tab === "edit" ? editing?.q : selected ?? items[0];
  const update = (q: CuratedQuestion) => {
    if (!editing) return;
    setEditing({ ...editing, q });
    if (editing.index !== null) setItems((xs) => xs.map((x, i) => i === editing.index ? q : x));
  };
  const add = (q: CuratedQuestion) => {
    if (grid && q.format !== "open") { setMessage("Diagnostic activities need their own slide. Add a Questions activity to use this format."); return; }
    const copy = copyQuestion(q); setItems((xs) => [...xs, copy]); setSelected(copy); setMessage("Added a deck copy to the sequence.");
  };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items]; const [q] = next.splice(from, 1); next.splice(to, 0, q); setItems(next); setEditing(null);
  };
  const shown = library.filter((q) => (!filterTool || q.tool === filterTool) && (!level || q.level === level) && (!purpose || q.purpose === purpose) && (!format || q.format === format) && (!tag || (q.misconception?.id === tag || q.relatedMisconceptions?.some((m) => m.id === tag))) && (!source || (source === "saved" ? q.source?.kind === "library" || !q.source : source === "depth" ? q.source?.kind === "depth" : q.source?.kind === "bank")) && (!search || `${q.title} ${q.question.join(" ")} ${q.misconception?.label ?? ""} ${q.rationale}`.toLowerCase().includes(search.toLowerCase())) && (!grid || q.format === "open"));
  const pendingNew = editing?.index === null && !!(editing.q.title.trim() || editing.q.question.some((s) => s.trim()) || editing.q.answer.some((s) => s.trim()));
  const errors = [...new Set(items.flatMap(mathsProblems))];
  const editorErrors = editing ? mathsProblems(editing.q) : [];
  const saveLibraryCopy = () => {
    const q = preview;
    if (!q) return;
    if (!isCuratedQuestion(q) || mathsProblems(q).length) { setMessage("Complete the question structure and correct its maths before saving to the library."); return; }
    const saved = { ...copyQuestion(q), source: { kind: "library" as const, id: q.id, tool: q.tool } };
    if (!saveQuestion(saved)) { setMessage("The library copy could not be saved: this device’s storage is full. Your open draft is safe; apply it to the deck or free some storage."); return; }
    setLibrary((xs) => [...xs, saved]); setMessage("New copy saved to your library on this device. The sharing status below reports whether it reaches your other devices.");
  };
  return <dialog ref={dialog} aria-labelledby="questions-title" onCancel={(e) => { e.preventDefault(); close(); }} onClick={(e) => { if (e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close(); } }} className="m-auto max-h-[96dvh] w-[calc(100%_-_1rem)] max-w-7xl overflow-hidden rounded-2xl border border-slate-300 bg-[#f8f9fb] p-0 text-slate-900 shadow-lift backdrop:bg-slate-900/40">
    <div className="flex h-[94dvh] flex-col">
      <header className="flex shrink-0 items-start gap-3 border-b border-slate-200 bg-white px-5 py-4"><div><h2 id="questions-title" className="text-2xl font-semibold">Questions</h2><p className="mt-1 text-sm text-slate-500">Find the right example, understand its purpose, and shape a sequence for this deck.</p></div><button className={`${button} ml-auto`} aria-label="Close questions workspace" onClick={close}><X size={18} /></button></header>
      <div className="flex shrink-0 gap-2 border-b border-slate-200 bg-white px-5 py-2" role="tablist" aria-label="Question workspace views" onKeyDown={(e) => {
        const tabs = ["browse", "edit", "sequence"] as const;
        const i = tabs.indexOf(tab);
        const next = e.key === "ArrowRight" ? (i + 1) % 3 : e.key === "ArrowLeft" ? (i + 2) % 3 : e.key === "Home" ? 0 : e.key === "End" ? 2 : -1;
        if (next < 0) return;
        e.preventDefault(); setTab(tabs[next]);
        if (tabs[next] === "edit" && !editing) setEditing({ q: newQuestion(tool), index: null });
        (e.currentTarget.querySelectorAll('[role="tab"]')[next] as HTMLElement).focus();
      }}>{([['browse','Browse'], ['edit','Create / Edit'], ['sequence',`Sequence (${items.length})`]] as const).map(([id, name]) => <button role="tab" tabIndex={tab === id ? 0 : -1} aria-controls={`questions-${id}-panel`} aria-selected={tab === id} key={id} className={`${button} ${tab === id ? "!border-blue-900 !bg-blue-50 !text-blue-950" : ""}`} onClick={() => { setTab(id); if (id === "edit" && !editing) setEditing({ q: newQuestion(tool), index: null }); }}>{name}</button>)}</div>
      {recovered && <div className="shrink-0 bg-amber-50 px-5 py-2 text-sm text-amber-950">Recovered your unsaved draft. It has not been applied to the deck. <button className="underline" onClick={() => { setItems(structuredClone(start)); setEditing(null); setTab("browse"); setRecovered(false); }}>Discard recovered draft</button></div>}
      {message && <p role="status" className="shrink-0 bg-blue-50 px-5 py-2 text-sm text-blue-950">{message}</p>}
      <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section role="tabpanel" id={`questions-${tab}-panel`} className="min-w-0 space-y-4 bg-white p-4 sm:p-5" aria-label={tab === "browse" ? "Question library" : tab === "edit" ? "Question authoring" : "Question sequence"}>
          {tab === "browse" && <>
            <label className="block"><span className="sr-only">Search questions</span><input autoFocus className={input} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search questions or misconceptions…" /></label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <select aria-label="Filter tool" className={input} value={filterTool} onChange={(e) => { setFilterTool(e.target.value); setTag(""); }}><option value="">All tools</option>{ALL_TOOLS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
              <select aria-label="Filter level" className={input} value={level} onChange={(e) => setLevel(e.target.value)}><option value="">All levels</option>{["level1", "level2", "level3"].map((l) => <option key={l} value={l}>Level {l.slice(-1)}</option>)}</select>
              <select aria-label="Filter teaching purpose" className={input} value={purpose} onChange={(e) => setPurpose(e.target.value)}><option value="">All purposes</option><option value="practice">Targeted practice</option><option value="diagnose">Diagnose</option><option value="explain">Explain</option><option value="extend">Extend</option></select>
              <select aria-label="Filter source" className={input} value={source} onChange={(e) => setSource(e.target.value)}><option value="">All sources</option><option value="built">Built-in practice</option><option value="depth">Depth activities</option><option value="saved">My library</option></select>
              <select aria-label="Filter question format" className={input} value={format} onChange={(e) => setFormat(e.target.value)}><option value="">All formats</option><option value="open">Open response</option><option value="choice">Multiple choice</option><option value="claims">Compare claims</option><option value="error">Find the error</option></select>
              <select aria-label="Filter misconception" className={input} value={tag} onChange={(e) => setTag(e.target.value)}><option value="">All misconceptions</option>{misconceptionChoices(library.filter((q) => !filterTool || q.tool === filterTool)).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
            </div>
            <div className="flex flex-wrap items-center gap-2"><p className="text-sm text-slate-500">{shown.length} questions{loading ? " · loading Depth activities…" : ""}</p><button className={`${button} ml-auto`} onClick={() => { setEditing({ q: newQuestion(filterTool || tool), index: null }); setTab("edit"); }}>Write a question</button></div>
            {grid && <p className="text-sm text-slate-500">Grids offer open-response questions. Add a Questions activity for diagnostic formats.</p>}
            {!shown.length && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No questions match. Clear the filters or write a question for this topic.</p>}
            <div className="grid gap-3">{shown.map((q) => <article key={`${q.source?.kind}-${q.id}`} className={`rounded-2xl border p-4 shadow-card ${selected?.id === q.id ? "border-blue-700 bg-blue-50/40" : "border-slate-300"}`}>
              <div className="mb-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-500"><span>{q.purpose === "practice" ? q.misconception ? "Targeted practice" : "General practice" : q.purpose === "diagnose" ? "Diagnose" : q.purpose === "explain" ? "Explain" : "Extend"}</span><span>· Level {q.level.slice(-1)}</span><span>· {q.source?.kind === "depth" ? "Depth" : q.source?.kind === "bank" ? "Built-in" : "My library"}</span>{q.status === "draft" && <span className="text-amber-700">Draft</span>}</div>
              <h3 className="font-semibold"><InlineMath text={q.title} /></h3><div className="mt-2 text-lg"><QuestionText lines={q.question} /></div><p className="mt-2 text-sm text-slate-600">{[q.misconception?.label, ...(q.relatedMisconceptions ?? []).map((m) => m.label)].filter(Boolean).join(" · ") || "Reasoning / general practice"}</p>
              <div className="mt-3 flex flex-wrap gap-2"><button className={button} onClick={() => setSelected(q)}>Preview</button><button className={button} onClick={() => add(q)}><Plus size={15} />Add to sequence</button><button className={button} onClick={() => { setEditing({ q: copyQuestion(q), index: null }); setTab("edit"); }}>Adapt a copy</button></div>
            </article>)}</div>
          </>}
          {tab === "edit" && editing && <><QuestionAuthor question={editing.q} onChange={update} library={library} openOnly={grid} />{editorErrors.map((e) => <p role="alert" className="text-sm text-red-700" key={e}>{e}</p>)}{editing.index === null && <button className={`${button} !border-blue-900 !bg-blue-900 !text-white`} disabled={editorErrors.length > 0 || !isCuratedQuestion(editing.q) || (grid && editing.q.format !== "open")} onClick={() => { add(editing.q); setEditing(null); setTab("sequence"); }}>Add this question to sequence</button>}{editing.index === null && <button className={`${button} ml-2`} onClick={() => { setEditing(null); setTab("sequence"); }}>Discard new draft</button>}</>}
          {tab === "sequence" && <><div className="flex items-center gap-2"><h3 className="text-lg font-semibold">Your teaching sequence</h3><button className={`${button} ml-auto`} onClick={() => setTab("browse")}>Add questions</button></div><p className="text-sm text-slate-500">These are deck copies. Changes are applied together; no generator takes over at the end.</p>{!items.length && <p className="rounded-xl bg-slate-50 p-4">Choose questions from Browse or create your own.</p>}{items.map((q, i) => <article key={`${q.id}-${i}`} draggable onDragEnd={() => setDragged(null)} onDragStart={() => setDragged(i)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (dragged !== null) move(dragged, i); setDragged(null); }} className="rounded-xl border border-slate-300 p-3"><div className="flex gap-2"><span className="text-sm font-semibold text-slate-500">{i + 1}</span><div className="min-w-0 flex-1"><b><InlineMath text={q.title || "Untitled draft"} /></b><div className="mt-1 text-sm text-slate-500">{q.misconception?.label ?? q.purpose}{q.missing ? " · MISSING SOURCE" : q.status === "draft" ? " · Draft" : ""}</div></div></div><div className="mt-3 flex flex-wrap gap-2"><button className={button} onClick={() => setSelected(q)}>Preview</button><button className={button} onClick={() => { setEditing({ q, index: i }); setTab("edit"); }}>Edit deck copy</button><button className={button} aria-label={`Move question ${i + 1} earlier`} disabled={i === 0} onClick={() => move(i, i - 1)}><ArrowUp size={16} /></button><button className={button} aria-label={`Move question ${i + 1} later`} disabled={i === items.length - 1} onClick={() => move(i, i + 1)}><ArrowDown size={16} /></button><button className={button} aria-label={`Remove question ${i + 1}`} onClick={() => { setItems((xs) => xs.filter((_, j) => j !== i)); setEditing(null); }}>Remove</button></div></article>)}</>}
        </section>
        <aside className="min-w-0 space-y-3 border-t border-slate-200 p-4 sm:p-5 lg:border-l lg:border-t-0"><div className="space-y-3 lg:sticky lg:top-0"><h3 className="text-lg font-semibold">Classroom preview</h3><p className="text-sm text-slate-500">Use the reveal controls to inspect the answer, explanation and teacher guidance.</p>{preview ? <><div className="h-[min(480px,calc(94dvh_-_380px))] min-h-[260px] rounded-2xl border border-slate-300 bg-white p-4 shadow-card"><QuestionPresentation key={JSON.stringify(preview)} question={preview} live base={24} /></div><button className={`${button} w-full`} onClick={saveLibraryCopy}>Save a copy to my library</button>{cloud.message && <p className="text-xs text-slate-500">{cloud.message}</p>}</> : <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-slate-500">Select Preview on a question to inspect it here.</div>}</div></aside>
      </div>
      <footer className="flex shrink-0 flex-wrap items-center gap-3 border-t border-slate-200 bg-white px-5 py-3"><span className="text-sm text-slate-500">{items.length} deck {items.length === 1 ? "question" : "questions"}{errors.length ? ` · ${errors[0]}` : " · Apply is one undo step"}{pendingNew ? " · Add the new question or discard its draft before applying" : ""}</span><button className={`${button} ml-auto`} onClick={close}>Cancel</button><button disabled={pendingNew || errors.length > 0 || !items.every(isCuratedQuestion)} className={`${button} !border-blue-900 !bg-blue-900 !text-white`} onClick={() => { onApply(structuredClone(items)); close(); }}>Apply to deck</button></footer>
    </div>
  </dialog>;
}
