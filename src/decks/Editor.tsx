import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsDown, ChevronsUp, Circle, Copy, Download, Table2, Image as ImageIcon, ListChecks, Minus, MoveUpRight, Play, Plus, Redo2, RotateCcw, Square, Trash2, Type, Undo2, Upload, X } from "lucide-react";
import { MathRenderer } from "../shared/components/MathRenderer";
import { loadKaTeX } from "../shared/katex";
import { MISCONCEPTIONS, misconceptionLabel } from "../shared/misconceptions";
import { GENERATOR_TOOLS, loadOptions } from "./generators";
import { LAYOUTS, INK } from "./layouts";
import { SlideCanvas } from "./SlideCanvas";
import { allQuestions, bankQuestion, builtDeck, isEditedQuestion, newQuestionId, resetDeck, resetQuestion, saveDeck, saveQuestion } from "./store";
import { CANVAS_H, CANVAS_W, FAMILY_STYLE, MIN_TEXT, type BankQuestion, type DeckDef, type DeckElement, type DeckFamily, type FillMode, type Slide } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// The deck editor: a small slide editor around the site's own pieces. The slide strip on the left, the canvas in
// the middle (click to select, drag to move, handles to resize, double-click text to edit it), the selected thing's
// properties on the right. Every change is saved on this device as it happens; Undo / Redo cover the session.
// Keys: Delete · Ctrl+Z / Ctrl+Shift+Z · Ctrl+D duplicate · Ctrl+C / Ctrl+V (also between decks) · arrows nudge.
// ─────────────────────────────────────────────────────────────────────────────

const SNAP = 10;
const HISTORY_MAX = 100;
const CLIP_KEY = "mt-deck-clip";
const SWATCHES = ["#0f172a", "#475569", "#94a3b8", "#ffffff", "#1e3a8a", "#0369a1", "#7c3aed", "#be185d", "#dbeafe", "#ede9fe", "#f1f5f9", "#fef3c7"];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const w = () => window as any;

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
const snap = (v: number, free: boolean) => (free ? Math.round(v) : Math.round(v / SNAP) * SNAP);
const reId = (el: DeckElement, slideId: string): DeckElement => ({ ...el, id: uid(slideId) });
const reIdSlide = (s: Slide): Slide => { const id = uid("slide"); return { ...s, id, els: s.els.map((e) => reId(e, id)) }; };

/** A KaTeX string's error, or null when it renders (KaTeX is loaded by the page). */
const texError = (latex: string): string | null => {
  const k = w().katex;
  if (!k) return null;
  try { k.renderToString(latex, { throwOnError: true }); return null; } catch (e) { return String((e as Error).message ?? e).replace(/^KaTeX parse error: /, ""); }
};
const inlineErrors = (s: string) => [...s.matchAll(/\$([^$]+)\$/g)].map((m) => texError(m[1])).filter(Boolean) as string[];

type Drag = { mode: "move" | "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "p1" | "p2"; id: string; x0: number; y0: number; orig: DeckElement; before: DeckDef; moved: boolean };

/** The element's on-canvas bounding box (a line's runs between its two points). */
const bbox = (el: DeckElement) => el.kind === "line"
  ? { x: Math.min(el.x, el.x + el.w), y: Math.min(el.y, el.y + el.h), w: Math.abs(el.w), h: Math.abs(el.h) }
  : { x: el.x, y: el.y, w: el.w, h: el.h };

function resize(o: DeckElement, mode: Drag["mode"], dx: number, dy: number, free: boolean): Partial<DeckElement> {
  if (mode === "move") return { x: snap(o.x + dx, free), y: snap(o.y + dy, free) };
  if (mode === "p1") { const x = snap(o.x + dx, free), y = snap(o.y + dy, free); return { x, y, w: o.x + o.w - x, h: o.y + o.h - y }; }
  if (mode === "p2") return { w: snap(o.x + o.w + dx, free) - o.x, h: snap(o.y + o.h + dy, free) - o.y };
  let { x, y, w: ww, h } = o;
  const min = 20;
  if (mode.includes("e")) ww = Math.max(min, snap(o.x + o.w + dx, free) - o.x);
  if (mode.includes("s")) h = Math.max(min, snap(o.y + o.h + dy, free) - o.y);
  if (mode.includes("w")) { const nx = Math.min(snap(o.x + dx, free), o.x + o.w - min); ww = o.x + o.w - nx; x = nx; }
  if (mode === "n" || mode === "ne" || mode === "nw") { const ny = Math.min(snap(o.y + dy, free), o.y + o.h - min); h = o.y + o.h - ny; y = ny; }
  return { x, y, w: ww, h };
}

/** Reads an image file into a data URL no larger than the canvas (big photos are scaled down and saved as JPEG). */
const readImage = (file: File): Promise<{ src: string; w: number; h: number }> => new Promise((resolve, reject) => {
  const fr = new FileReader();
  fr.onerror = () => reject(fr.error);
  fr.onload = () => {
    const img = new Image();
    img.onerror = () => reject(new Error("Not an image"));
    img.onload = () => {
      const k = Math.min(1, CANVAS_W / img.width, CANVAS_H / img.height);
      const W = Math.round(img.width * k), H = Math.round(img.height * k);
      if (k === 1 && file.size < 400_000) { resolve({ src: String(fr.result), w: W, h: H }); return; }
      const c = document.createElement("canvas"); c.width = W; c.height = H;
      const ctx = c.getContext("2d"); if (!ctx) { reject(new Error("No canvas")); return; }
      ctx.fillStyle = "white"; ctx.fillRect(0, 0, W, H); ctx.drawImage(img, 0, 0, W, H);
      resolve({ src: c.toDataURL("image/jpeg", 0.85), w: W, h: H });
    };
    img.src = String(fr.result);
  };
  fr.readAsDataURL(file);
});

// ── Small controls ──────────────────────────────────────────────────────────

const Label = ({ children }: { children: ReactNode }) => <div className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</div>;
const input = "w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none";
const small = "inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40";
const tool = "inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40";

function Swatches({ value, onChange, none }: { value?: string; onChange: (c: string | undefined) => void; none?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {none && <button onClick={() => onChange(undefined)} title="None" className={`h-6 w-6 rounded-md border bg-white text-[10px] text-slate-400 ${!value ? "ring-2 ring-blue-500" : "border-slate-300"}`}>✕</button>}
      {SWATCHES.map((c) => <button key={c} onClick={() => onChange(c)} title={c} className={`h-6 w-6 rounded-md border border-slate-300 ${value === c ? "ring-2 ring-blue-500" : ""}`} style={{ background: c }} />)}
    </div>
  );
}

function Num({ label, value, onChange, min }: { label: string; value: number; onChange: (n: number) => void; min?: number }) {
  return (
    <label className="flex items-center gap-1 text-xs text-slate-500">{label}
      <input type="number" value={Math.round(value)} min={min} onChange={(e) => { const n = Number(e.target.value); if (Number.isFinite(n)) onChange(n); }} className={`${input} w-20`} />
    </label>
  );
}

function TexField({ label, value, onChange, maths }: { label: string; value: string; onChange: (s: string) => void; maths?: boolean }) {
  const err = maths ? texError(value) : inlineErrors(value)[0] ?? null;
  return (
    <div>
      <Label>{label}</Label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className={`${input} ${err ? "border-red-400" : ""} font-mono`} spellCheck={false} />
      {maths && value && !err && <div className="mt-1 rounded-lg bg-slate-50 px-2 py-1 text-lg"><MathRenderer latex={value} /></div>}
      {err && <div className="mt-1 text-xs text-red-600">{err}</div>}
    </div>
  );
}

// ── The question editor (write a new one, or edit one in the bank) ──────────

function QuestionEditor({ start, onSave, onClose }: { start: BankQuestion; onSave: (q: BankQuestion) => void; onClose: () => void }) {
  const [q, setQ] = useState(start);
  const set = (p: Partial<BankQuestion>) => setQ((x) => ({ ...x, ...p }));
  const builtIn = !start.id.startsWith("my-");
  const errors = [q.latex, q.answer, ...q.working.map((s) => s.latex)].map(texError).filter(Boolean);
  const last = q.working[q.working.length - 1]?.latex ?? "";
  const endsOnAnswer = !q.working.length || last.replace(/\s/g, "").endsWith(`=${q.answer.replace(/\s/g, "")}`);
  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-900/40 p-4" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl border border-slate-300 bg-white p-5 shadow-lift">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-slate-900">{start.latex ? "Edit question" : "New question"}</h2>
          {builtIn && <span className="text-xs text-slate-500">Your edit is kept on this device; the original stays in the site's bank.</span>}
          <button onClick={onClose} className="ml-auto rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label="Close"><X size={18} /></button>
        </div>
        <p className="mt-1 text-xs text-slate-500">Write maths as LaTeX, for example <code>48 \times 31</code>, <code>\dfrac{"{34+21}"}{"{11}"}</code>, <code>6 \div 0.5</code>.</p>
        <TexField label="Question" value={q.latex} onChange={(latex) => set({ latex })} maths />
        <TexField label="Answer" value={q.answer} onChange={(answer) => set({ answer })} maths />
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Catches (misconception)</Label>
            <select value={q.tag} onChange={(e) => set({ tag: e.target.value })} className={input}>
              {Object.entries(MISCONCEPTIONS).map(([id, m]) => <option key={id} value={id}>{m.label}</option>)}
            </select></div>
          <div><Label>Level</Label>
            <select value={q.level} onChange={(e) => set({ level: e.target.value as BankQuestion["level"] })} className={input}>
              <option value="level1">Level 1</option><option value="level2">Level 2</option><option value="level3">Level 3</option>
            </select></div>
        </div>
        <Label>Working</Label>
        <div className="space-y-2">
          {q.working.map((s, i) => {
            const err = texError(s.latex);
            return (
              <div key={i} className="flex items-start gap-2">
                <input value={s.label} placeholder="Label" onChange={(e) => set({ working: q.working.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} className={`${input} w-40`} />
                <div className="flex-1">
                  <input value={s.latex} spellCheck={false} onChange={(e) => set({ working: q.working.map((x, j) => (j === i ? { ...x, latex: e.target.value } : x)) })} className={`${input} font-mono ${err ? "border-red-400" : ""}`} />
                  {s.latex && !err && <div className="mt-0.5 text-base"><MathRenderer latex={s.latex} /></div>}
                  {err && <div className="text-xs text-red-600">{err}</div>}
                </div>
                <button className={small} onClick={() => set({ working: q.working.filter((_, j) => j !== i) })} aria-label="Remove step"><X size={14} /></button>
              </div>
            );
          })}
          <button className={small} onClick={() => set({ working: [...q.working, { label: "", latex: "" }] })}><Plus size={14} />Add a step</button>
        </div>
        {!endsOnAnswer && <p className="mt-3 text-xs text-amber-700">The last step does not end on the answer ("= {q.answer}"). Check it before saving.</p>}
        <div className="mt-5 flex items-center gap-2">
          {builtIn && isEditedQuestion(start.id) && <button className={small} onClick={() => { resetQuestion(start.id); onClose(); }}><RotateCcw size={14} />Back to the original</button>}
          <button onClick={onClose} className="ml-auto rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
          <button disabled={!q.latex.trim() || !q.answer.trim() || errors.length > 0} onClick={() => onSave(q)}
            className="rounded-xl bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-40">Save question</button>
        </div>
      </div>
    </div>
  );
}

// ── Properties for each kind of element ─────────────────────────────────────

type ElOf<K extends DeckElement["kind"]> = Extract<DeckElement, { kind: K }>;

function PracticeProps({ el, set, onEditQuestion }: { el: ElOf<"practice">; set: (p: Partial<ElOf<"practice">>) => void; onEditQuestion: (q: BankQuestion, add: boolean) => void }) {
  const [opts, setOpts] = useState<{ label: string; options: { value: string; label: string }[] }[]>([]);
  const level = el.generator?.level ?? "level1";
  useEffect(() => { let on = true; void loadOptions(el.tool, level).then((o) => { if (on) setOpts(o); }); return () => { on = false; }; }, [el.tool, level]);
  const pool = allQuestions().filter((q) => q.tool === el.tool && !el.bank.includes(q.id));
  const move = (i: number, d: number) => { const b = [...el.bank]; const j = i + d; if (j < 0 || j >= b.length) return; [b[i], b[j]] = [b[j], b[i]]; set({ bank: b }); };
  return (
    <>
      <Label>Tool</Label>
      <select value={el.tool} onChange={(e) => set({ tool: e.target.value })} className={input}>{GENERATOR_TOOLS.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
      <TexField label="Prompt" value={el.prompt ?? ""} onChange={(prompt) => set({ prompt })} />
      <Label>Catches (misconception)</Label>
      <select value={el.intention} onChange={(e) => set({ intention: e.target.value })} className={input}>
        {Object.entries(MISCONCEPTIONS).map(([id, m]) => <option key={id} value={id}>{m.label}</option>)}
      </select>
      <Label>Questions, in order</Label>
      <div className="space-y-1">
        {el.bank.map((id, i) => {
          const q = bankQuestion(id);
          return (
            <div key={id} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1">
              <span className="min-w-0 flex-1 truncate text-base">{q ? <MathRenderer latex={q.latex} /> : <span className="text-xs text-red-600">missing: {id}</span>}</span>
              {q && q.tag !== el.intention && <span className="text-[10px] text-amber-700" title={misconceptionLabel(q.tag)}>other trap</span>}
              {q && <button className={small} onClick={() => onEditQuestion(q, false)}>Edit</button>}
              <button className={small} onClick={() => move(i, -1)} disabled={i === 0} aria-label="Earlier"><ArrowUp size={12} /></button>
              <button className={small} onClick={() => move(i, 1)} disabled={i === el.bank.length - 1} aria-label="Later"><ArrowDown size={12} /></button>
              <button className={small} onClick={() => set({ bank: el.bank.filter((x) => x !== id) })} aria-label="Remove"><X size={12} /></button>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <select value="" onChange={(e) => { if (e.target.value) set({ bank: [...el.bank, e.target.value] }); }} className={`${input} w-auto flex-1`}>
          <option value="">Add from the bank…</option>
          {pool.map((q) => <option key={q.id} value={q.id}>{q.latex.replace(/\\(times|div|dfrac)/g, (m) => ({ "\\times": "×", "\\div": "÷", "\\dfrac": "frac" } as Record<string, string>)[m])} · {misconceptionLabel(q.tag)}</option>)}
        </select>
        <button className={small} onClick={() => onEditQuestion({ id: newQuestionId(), tool: el.tool, level, tag: el.intention, latex: "", answer: "", working: [{ label: "Round to 1 s.f.:", latex: "" }, { label: "Calculate:", latex: "" }] }, true)}><Plus size={14} />Write a new question</button>
      </div>
      <Label>After the questions</Label>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={!!el.generator} onChange={(e) => set({ generator: e.target.checked ? { level, multiSelect: {} } : undefined })} />
        "Another question" uses the tool's generator
      </label>
      {el.generator && (
        <div className="mt-2 rounded-lg border border-slate-200 p-2">
          <select value={level} onChange={(e) => set({ generator: { ...el.generator!, level: e.target.value as "level1" | "level2" | "level3", multiSelect: {} } })} className={input}>
            <option value="level1">Level 1</option><option value="level2">Level 2</option><option value="level3">Level 3</option>
          </select>
          {opts.map((p) => (
            <div key={p.label} className="mt-2">
              <div className="text-xs font-semibold text-slate-500">{p.label}</div>
              <div className="flex flex-wrap gap-x-3">
                {p.options.map((o) => {
                  const ms = el.generator!.multiSelect ?? {};
                  const on = Object.keys(ms).length ? !!ms[o.value] : true;
                  return (
                    <label key={o.value} className="flex items-center gap-1 text-sm text-slate-700">
                      <input type="checkbox" checked={on} onChange={(e) => {
                        const all = Object.fromEntries(p.options.map((x) => [x.value, Object.keys(ms).length ? !!ms[x.value] : true]));
                        set({ generator: { ...el.generator!, multiSelect: { ...ms, ...all, [o.value]: e.target.checked } } });
                      }} />{o.label}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      <Label>Question size</Label>
      <Num label="" value={el.size ?? 120} min={MIN_TEXT} onChange={(size) => set({ size })} />
    </>
  );
}

function BoardProps({ el, set }: { el: ElOf<"board">; set: (p: Partial<ElOf<"board">>) => void }) {
  const g = el.grid;
  const setGrid = (p: Partial<typeof g>) => set({ grid: { ...g, ...p } });
  const cols = g.head.length;
  return (
    <>
      <Label>Starts as</Label>
      <div className="flex gap-1">{(["filled", "structure", "blank"] as FillMode[]).map((m) => (
        <button key={m} onClick={() => set({ fill: m })} className={`${small} ${(el.fill ?? "filled") === m ? "!bg-slate-800 !text-white" : ""}`}>{m === "filled" ? "Filled in" : m === "structure" ? "Structure only" : "Blank"}</button>))}</div>
      <div className="mt-2 flex gap-3"><Num label="Columns given" value={g.given ?? 1} min={0} onChange={(given) => setGrid({ given })} /><Num label="Text size" value={el.size ?? 46} min={MIN_TEXT} onChange={(size) => set({ size })} /></div>
      <Label>Cells ($…$ for maths)</Label>
      <div className="overflow-auto">
        <table className="text-xs">
          <tbody>
            <tr>{g.head.map((h, c) => <td key={c} className="p-0.5"><input value={h} onChange={(e) => setGrid({ head: g.head.map((x, j) => (j === c ? e.target.value : x)) })} className={`${input} font-semibold`} /></td>)}</tr>
            {g.rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => <td key={c} className="p-0.5"><input value={cell} spellCheck={false} onChange={(e) => setGrid({ rows: g.rows.map((rr, i) => (i === r ? rr.map((x, j) => (j === c ? e.target.value : x)) : rr)) })} className={`${input} font-mono ${inlineErrors(cell).length ? "border-red-400" : ""}`} /></td>)}
                <td><button className={small} onClick={() => setGrid({ rows: g.rows.filter((_, i) => i !== r) })} disabled={g.rows.length < 2} aria-label="Remove row"><X size={12} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <button className={small} onClick={() => setGrid({ rows: [...g.rows, Array(cols).fill("")] })}><Plus size={12} />Row</button>
        <button className={small} onClick={() => setGrid({ head: [...g.head, ""], rows: g.rows.map((r) => [...r, ""]) })}><Plus size={12} />Column</button>
        <button className={small} disabled={cols < 2} onClick={() => setGrid({ head: g.head.slice(0, -1), rows: g.rows.map((r) => r.slice(0, -1)) })}><Minus size={12} />Column</button>
      </div>
    </>
  );
}

// ── The editor ──────────────────────────────────────────────────────────────

export function Editor({ start, startIndex, onPresent }: { start: DeckDef; startIndex: number; onPresent: (deck: DeckDef, index: number) => void }) {
  const [deck, setDeck] = useState(start);
  const [si, setSi] = useState(Math.min(startIndex, start.slides.length - 1));
  const [sel, setSel] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [layoutMenu, setLayoutMenu] = useState(false);
  const [question, setQuestion] = useState<{ q: BankQuestion; add: boolean } | null>(null);
  const [bankVersion, setBankVersion] = useState(0);
  const past = useRef<DeckDef[]>([]);
  const future = useRef<DeckDef[]>([]);
  const [, setHist] = useState(0);
  const drag = useRef<Drag | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => { void loadKaTeX().then(() => setBankVersion((v) => v + 1)); }, []);

  // keep the canvas as large as the middle column allows
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const fit = () => setScale(Math.max(0.2, Math.min((el.clientWidth - 16) / CANVAS_W, (el.clientHeight - 16) / CANVAS_H)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // every change is saved on this device as it happens
  useEffect(() => {
    if (deck === start) return;                                   // opening the editor is not an edit
    setStatus(saveDeck(deck) ? "Saved on this device" : "Not saved: this device's storage is full (try smaller images)");
  }, [deck, start]);

  // History lives in refs and is changed outside state updaters (development mode runs an updater twice).
  const deckRef = useRef(deck);
  deckRef.current = deck;
  const apply = useCallback((fn: (d: DeckDef) => DeckDef) => {
    const d = deckRef.current, n = fn(d);
    if (n === d) return;
    past.current = [...past.current.slice(-(HISTORY_MAX - 1)), d]; future.current = [];
    deckRef.current = n; setDeck(n); setHist((h) => h + 1);
  }, []);
  const undo = useCallback(() => { const p = past.current.pop(); if (!p) return; future.current.push(deckRef.current); deckRef.current = p; setDeck(p); setHist((h) => h + 1); }, []);
  const redo = useCallback(() => { const f = future.current.pop(); if (!f) return; past.current.push(deckRef.current); deckRef.current = f; setDeck(f); setHist((h) => h + 1); }, []);

  const slide = deck.slides[Math.min(si, deck.slides.length - 1)];
  const selected = slide.els.find((e) => e.id === sel) ?? null;
  const setSlide = (fn: (s: Slide) => Slide) => apply((d) => ({ ...d, slides: d.slides.map((s) => (s.id === slide.id ? fn(s) : s)) }));
  const setEl = (id: string, patch: Partial<DeckElement>) => setSlide((s) => ({ ...s, els: s.els.map((e) => (e.id === id ? ({ ...e, ...patch } as DeckElement) : e)) }));
  const addEl = (el: DeckElement) => { setSlide((s) => ({ ...s, els: [...s.els, el] })); setSel(el.id); };
  const deleteEl = (id: string) => { setSlide((s) => ({ ...s, els: s.els.filter((e) => e.id !== id) })); setSel(null); };
  const duplicateEl = (el: DeckElement) => addEl({ ...reId(el, slide.id), x: el.x + 30, y: el.y + 30 });
  const layer = (id: string, to: "front" | "back" | "up" | "down") => setSlide((s) => {
    const i = s.els.findIndex((e) => e.id === id); if (i < 0) return s;
    const els = [...s.els]; const [e] = els.splice(i, 1);
    const j = to === "front" ? els.length : to === "back" ? 0 : to === "up" ? Math.min(els.length, i + 1) : Math.max(0, i - 1);
    els.splice(j, 0, e); return { ...s, els };
  });

  const goSlide = (i: number) => { setSi(Math.max(0, Math.min(deck.slides.length - 1, i))); setSel(null); };
  const addSlide = (s: Slide) => { apply((d) => ({ ...d, slides: [...d.slides.slice(0, si + 1), s, ...d.slides.slice(si + 1)] })); setSi(si + 1); setSel(null); setLayoutMenu(false); };
  const moveSlide = (d: number) => { const j = si + d; if (j < 0 || j >= deck.slides.length) return; apply((x) => { const ss = [...x.slides]; [ss[si], ss[j]] = [ss[j], ss[si]]; return { ...x, slides: ss }; }); setSi(j); };
  const deleteSlide = () => { if (deck.slides.length < 2) return; apply((d) => ({ ...d, slides: d.slides.filter((_, i) => i !== si) })); setSi(Math.max(0, si - 1)); setSel(null); };

  const copy = (what: { el?: DeckElement; slide?: Slide }) => { try { localStorage.setItem(CLIP_KEY, JSON.stringify(what)); setStatus(what.el ? "Copied the element" : "Copied the slide"); } catch { /* ignore */ } };
  const paste = () => {
    let clip: { el?: DeckElement; slide?: Slide } = {};
    try { clip = JSON.parse(localStorage.getItem(CLIP_KEY) ?? "{}"); } catch { /* ignore */ }
    if (clip.el) addEl(reId(clip.el, slide.id));
    else if (clip.slide) addSlide(reIdSlide(clip.slide));
  };

  const centre = (w2: number, h2: number) => ({ x: snap((CANVAS_W - w2) / 2, false), y: snap((CANVAS_H - h2) / 2, false), w: w2, h: h2 });
  const ADD: { label: string; icon: ReactNode; make: () => DeckElement }[] = [
    { label: "Text", icon: <Type size={16} />, make: () => ({ id: uid(slide.id), kind: "text", ...centre(800, 120), text: "New text", size: 56, colour: INK }) },
    { label: "Rectangle", icon: <Square size={16} />, make: () => ({ id: uid(slide.id), kind: "shape", shape: "rect", ...centre(400, 250), fill: "#dbeafe", stroke: "#1e3a8a", strokeWidth: 4, radius: 16 }) },
    { label: "Ellipse", icon: <Circle size={16} />, make: () => ({ id: uid(slide.id), kind: "shape", shape: "ellipse", ...centre(300, 300), fill: "#ede9fe", stroke: "#7c3aed", strokeWidth: 4 }) },
    { label: "Line", icon: <Minus size={16} />, make: () => ({ id: uid(slide.id), kind: "line", x: 600, y: 450, w: 400, h: 0, colour: INK, width: 6 }) },
    { label: "Arrow", icon: <MoveUpRight size={16} />, make: () => ({ id: uid(slide.id), kind: "line", x: 600, y: 450, w: 400, h: 0, colour: INK, width: 6, arrow: true }) },
    { label: "Board", icon: <Table2 size={16} />, make: () => ({ id: uid(slide.id), kind: "board", ...centre(1000, 400), grid: { head: ["", ""], given: 1, rows: [["", ""], ["", ""], ["", ""]] }, fill: "filled", size: 46 }) },
    { label: "Practice question", icon: <ListChecks size={16} />, make: () => ({ id: uid(slide.id), kind: "practice", x: 100, y: 70, w: 1400, h: 780, tool: deck.tool ?? GENERATOR_TOOLS[0][0], intention: Object.keys(MISCONCEPTIONS)[0], bank: [], prompt: "Estimate.", size: 120 }) },
  ];

  const onImage = async (file: File | undefined) => {
    if (!file) return;
    try {
      const img = await readImage(file);
      const k = Math.min(1, 800 / img.w, 600 / img.h);
      addEl({ id: uid(slide.id), kind: "image", src: img.src, ...centre(Math.round(img.w * k), Math.round(img.h * k)) });
    } catch { setStatus("That file could not be read as an image"); }
  };

  const exportDeck = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(deck, null, 2)], { type: "application/json" }));
    a.download = `${deck.id}.deck.json`; a.click(); URL.revokeObjectURL(a.href);
  };
  const importSlides = async (file: File | undefined) => {
    if (!file) return;
    try {
      const d = JSON.parse(await file.text()) as DeckDef;
      if (!Array.isArray(d.slides)) throw new Error();
      apply((x) => ({ ...x, slides: [...x.slides, ...d.slides.map(reIdSlide)] }));
      setStatus(`Added ${d.slides.length} slides from ${d.title ?? "the file"}`);
    } catch { setStatus("That file is not a deck"); }
  };

  // ── pointer: select, move, resize ──
  const begin = (e: React.PointerEvent, el: DeckElement, mode: Drag["mode"]) => {
    e.stopPropagation(); e.preventDefault();
    setSel(el.id);
    drag.current = { mode, id: el.id, x0: e.clientX, y0: e.clientY, orig: el, before: deck, moved: false };
  };
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current; if (!d) return;
      const dx = (e.clientX - d.x0) / scale, dy = (e.clientY - d.y0) / scale;
      if (!d.moved && Math.hypot(dx, dy) * scale < 3) return;
      d.moved = true;
      const patch = resize(d.orig, d.mode, dx, dy, e.altKey);
      setDeck((x) => ({ ...x, slides: x.slides.map((s) => ({ ...s, els: s.els.map((el) => (el.id === d.id ? ({ ...el, ...patch } as DeckElement) : el)) })) }));
    };
    const up = () => {
      const d = drag.current; drag.current = null;
      if (d?.moved) { past.current = [...past.current.slice(-(HISTORY_MAX - 1)), d.before]; future.current = []; setHist((h) => h + 1); }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [scale]);

  // ── keys ──
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea,select,[contenteditable]")) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      if (mod && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); return; }
      if (mod && e.key.toLowerCase() === "v") { e.preventDefault(); paste(); return; }
      if (selected) {
        if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); deleteEl(selected.id); }
        else if (mod && e.key.toLowerCase() === "d") { e.preventDefault(); duplicateEl(selected); }
        else if (mod && e.key.toLowerCase() === "c") { e.preventDefault(); copy({ el: selected }); }
        else if (e.key === "Escape") setSel(null);
        else if (e.key.startsWith("Arrow")) {
          e.preventDefault();
          const step = e.shiftKey ? 1 : SNAP;
          const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0, dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
          setEl(selected.id, { x: selected.x + dx, y: selected.y + dy });
        }
      } else if (e.key === "PageDown") goSlide(si + 1);
      else if (e.key === "PageUp") goSlide(si - 1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }); // eslint-disable-line react-hooks/exhaustive-deps -- deliberate: re-bound every render so it always sees the current slide and selection

  const handles = (el: DeckElement) => {
    const b = el.kind === "line"
      ? [["p1", el.x, el.y], ["p2", el.x + el.w, el.y + el.h]] as const
      : ([["nw", 0, 0], ["n", 0.5, 0], ["ne", 1, 0], ["e", 1, 0.5], ["se", 1, 1], ["s", 0.5, 1], ["sw", 0, 1], ["w", 0, 0.5]] as const).map(([m, fx, fy]) => [m, el.x + el.w * fx, el.y + el.h * fy] as const);
    const r = 9 / scale;
    return b.map(([m, x, y]) => (
      <div key={m} onPointerDown={(e) => begin(e, el, m as Drag["mode"])}
        style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: 999, background: "white", border: `${2 / scale}px solid #2563eb`, cursor: m === "p1" || m === "p2" ? "crosshair" : `${m}-resize`, zIndex: 10 }} />
    ));
  };

  const textWarn = selected?.kind === "text" && selected.size < MIN_TEXT;
  const hist = { canUndo: past.current.length > 0, canRedo: future.current.length > 0 };
  const isBuilt = !!builtDeck(deck.id);

  return (
    <div className="flex h-screen flex-col bg-[#f8f9fb]">
      {/* top bar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-white px-3 py-2">
        <input value={deck.title} onChange={(e) => apply((d) => ({ ...d, title: e.target.value }))} className="w-56 rounded-lg px-2 py-1 text-lg font-semibold text-slate-900 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Deck title" />
        <span className="mx-1 h-6 w-px bg-slate-200" />
        {ADD.map((a) => <button key={a.label} className={tool} onClick={() => addEl(a.make())} title={`Add ${a.label.toLowerCase()}`}>{a.icon}<span className="hidden 2xl:inline">{a.label}</span></button>)}
        <button className={tool} onClick={() => fileRef.current?.click()} title="Add an image"><ImageIcon size={16} /><span className="hidden 2xl:inline">Image</span></button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { void onImage(e.target.files?.[0]); e.target.value = ""; }} />
        <span className="mx-1 h-6 w-px bg-slate-200" />
        <button className={tool} onClick={undo} disabled={!hist.canUndo} title="Undo (Ctrl+Z)"><Undo2 size={16} /></button>
        <button className={tool} onClick={redo} disabled={!hist.canRedo} title="Redo (Ctrl+Shift+Z)"><Redo2 size={16} /></button>
        <span className="ml-auto mr-2 text-xs text-slate-500">{status}</span>
        <button className={tool} onClick={exportDeck} title="Download this deck as a file"><Download size={16} /><span className="hidden xl:inline">Export</span></button>
        <button className={tool} onClick={() => importRef.current?.click()} title="Add the slides from a deck file"><Upload size={16} /><span className="hidden xl:inline">Import slides</span></button>
        <input ref={importRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => { void importSlides(e.target.files?.[0]); e.target.value = ""; }} />
        <button className={tool} onClick={() => { if (window.confirm(isBuilt ? "Put this deck back to the original? Your changes on this device are lost." : "Delete this deck from this device?")) { resetDeck(deck.id); window.location.href = isBuilt ? `/decks/${deck.id}` : "/decks"; } }}
          title={isBuilt ? "Back to the original deck" : "Delete this deck"}>{isBuilt ? <RotateCcw size={16} /> : <Trash2 size={16} />}<span className="hidden xl:inline">{isBuilt ? "Reset" : "Delete"}</span></button>
        <button onClick={() => onPresent(deck, si)} className="ml-1 inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-900 px-3 text-sm font-semibold text-white hover:bg-blue-800"><Play size={16} />Present</button>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* slide strip */}
        <div className="w-56 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-2">
          {deck.slides.map((s, i) => (
            <div key={s.id} role="button" tabIndex={0} onClick={() => goSlide(i)} onKeyDown={(e) => { if (e.key === "Enter") goSlide(i); }} className={`mb-2 block w-full cursor-pointer rounded-lg p-1 text-left ${i === si ? "ring-2 ring-blue-500" : "hover:bg-slate-50"}`}>
              <div className="flex items-start gap-1">
                <span className="w-4 pt-0.5 text-[10px] text-slate-400">{i + 1}</span>
                <div className="overflow-hidden rounded border border-slate-200"><SlideCanvas key={`${s.id}-${bankVersion}`} slide={s} scale={0.115} /></div>
              </div>
            </div>
          ))}
          <div className="relative mt-1">
            <button className={`${small} w-full justify-center py-2`} onClick={() => setLayoutMenu((v) => !v)}><Plus size={14} />Add slide</button>
            {layoutMenu && (
              <div className="absolute bottom-full left-0 z-20 mb-1 w-64 rounded-xl border border-slate-300 bg-white p-1 shadow-lift">
                {LAYOUTS.map((l) => (
                  <button key={l.key} onClick={() => addSlide(l.make(uid("slide")))} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-50">
                    <span className="h-2 w-2 rounded-full" style={{ background: FAMILY_STYLE[l.family].colour }} />{l.label}
                  </button>
                ))}
                <button onClick={paste} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-50"><Copy size={12} />Paste a copied slide</button>
              </div>
            )}
          </div>
        </div>

        {/* canvas */}
        <div ref={stageRef} className="flex min-w-0 flex-1 items-center justify-center p-2" onPointerDown={() => setSel(null)}>
          <div className="rounded-sm shadow-card">
            <SlideCanvas key={`${slide.id}-${bankVersion}`} slide={slide} scale={scale}>
              {slide.els.map((el) => {
                const b = bbox(el);
                const pad = el.kind === "line" ? 14 / scale : 0;
                return (
                  <div key={el.id} onPointerDown={(e) => begin(e, el, "move")} onDoubleClick={() => { if (el.kind === "text") textRef.current?.focus(); }}
                    style={{ position: "absolute", left: b.x - pad, top: b.y - pad, width: b.w + pad * 2, height: b.h + pad * 2, cursor: "move",
                      outline: el.id === sel ? `${2 / scale}px solid #2563eb` : undefined, outlineOffset: 2 / scale }}
                    className={el.id === sel ? "" : "hover:outline hover:outline-1 hover:outline-blue-300"} />
                );
              })}
              {selected && handles(selected)}
            </SlideCanvas>
          </div>
        </div>

        {/* properties */}
        <div className="w-80 shrink-0 overflow-y-auto border-l border-slate-200 bg-white p-3 text-sm">
          {!selected && (
            <>
              <div className="font-semibold text-slate-900">Slide {si + 1}</div>
              <Label>Title (for the slide list)</Label>
              <input value={slide.title} onChange={(e) => setSlide((s) => ({ ...s, title: e.target.value }))} className={input} />
              <Label>Kind of slide (its colour)</Label>
              <div className="flex flex-wrap gap-1">{(Object.keys(FAMILY_STYLE) as DeckFamily[]).map((f) => (
                <button key={f} onClick={() => setSlide((s) => ({ ...s, family: f }))} className={`${small} ${slide.family === f ? "ring-2 ring-blue-500" : ""}`}>
                  <span className="h-2 w-2 rounded-full" style={{ background: FAMILY_STYLE[f].colour }} />{FAMILY_STYLE[f].label}</button>))}</div>
              <Label>Slide</Label>
              <div className="flex flex-wrap gap-1">
                <button className={small} onClick={() => moveSlide(-1)} disabled={si === 0}><ArrowUp size={12} />Earlier</button>
                <button className={small} onClick={() => moveSlide(1)} disabled={si === deck.slides.length - 1}><ArrowDown size={12} />Later</button>
                <button className={small} onClick={() => addSlide(reIdSlide(slide))}><Copy size={12} />Duplicate</button>
                <button className={small} onClick={() => copy({ slide })}><Copy size={12} />Copy</button>
                <button className={small} onClick={deleteSlide} disabled={deck.slides.length < 2}><Trash2 size={12} />Delete</button>
              </div>
              <Label>Deck</Label>
              <textarea value={deck.summary} onChange={(e) => apply((d) => ({ ...d, summary: e.target.value }))} rows={3} className={input} placeholder="One sentence: what this lesson covers." />
              <p className="mt-4 text-xs leading-relaxed text-slate-500">Click something on the slide to change it; drag to move it, pull its handles to resize (hold Alt to place it freely). Double-click text to edit it. Copy and paste works between slides and between decks.</p>
            </>
          )}
          {selected && (
            <>
              <div className="flex items-center gap-1">
                <span className="font-semibold capitalize text-slate-900">{selected.kind === "practice" ? "Practice question" : selected.kind}</span>
                <button className={`${small} ml-auto`} onClick={() => duplicateEl(selected)} title="Duplicate (Ctrl+D)"><Copy size={12} /></button>
                <button className={small} onClick={() => deleteEl(selected.id)} title="Delete"><Trash2 size={12} /></button>
              </div>
              {selected.kind === "text" && (
                <>
                  <Label>Text ($…$ for maths; a new line is a new line)</Label>
                  <textarea ref={textRef} value={selected.text} rows={5} onChange={(e) => setEl(selected.id, { text: e.target.value })} className={`${input} ${inlineErrors(selected.text).length ? "border-red-400" : ""}`} />
                  {inlineErrors(selected.text).map((er, i) => <div key={i} className="text-xs text-red-600">{er}</div>)}
                  <div className="mt-2 flex items-center gap-2">
                    <Num label="Size" value={selected.size} min={MIN_TEXT} onChange={(size) => setEl(selected.id, { size })} />
                    <button className={`${small} ${selected.bold ? "!bg-slate-800 !text-white" : ""}`} onClick={() => setEl(selected.id, { bold: !selected.bold })}>Bold</button>
                  </div>
                  {textWarn && <div className="mt-1 text-xs text-amber-700">Smaller than {MIN_TEXT}: hard to read from the back of the room.</div>}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(["left", "center", "right"] as const).map((a) => <button key={a} className={`${small} ${(selected.align ?? "left") === a ? "!bg-slate-800 !text-white" : ""}`} onClick={() => setEl(selected.id, { align: a })}>{a === "center" ? "Centre" : a[0].toUpperCase() + a.slice(1)}</button>)}
                    <button className={`${small} ${selected.middle ? "!bg-slate-800 !text-white" : ""}`} onClick={() => setEl(selected.id, { middle: !selected.middle })}>Middle</button>
                  </div>
                  <Label>Colour</Label><Swatches value={selected.colour} onChange={(colour) => setEl(selected.id, { colour: colour ?? INK })} />
                </>
              )}
              {selected.kind === "shape" && (
                <>
                  <Label>Shape</Label>
                  <div className="flex gap-1">{(["rect", "ellipse"] as const).map((s) => <button key={s} className={`${small} ${selected.shape === s ? "!bg-slate-800 !text-white" : ""}`} onClick={() => setEl(selected.id, { shape: s })}>{s === "rect" ? "Rectangle" : "Ellipse"}</button>)}</div>
                  <Label>Fill</Label><Swatches value={selected.fill} none onChange={(fill) => setEl(selected.id, { fill })} />
                  <Label>Outline</Label><Swatches value={selected.stroke} none onChange={(stroke) => setEl(selected.id, { stroke })} />
                  <div className="mt-2 flex gap-2"><Num label="Outline" value={selected.strokeWidth ?? 4} min={0} onChange={(strokeWidth) => setEl(selected.id, { strokeWidth })} />
                    {selected.shape === "rect" && <Num label="Corners" value={selected.radius ?? 0} min={0} onChange={(radius) => setEl(selected.id, { radius })} />}</div>
                </>
              )}
              {selected.kind === "line" && (
                <>
                  <Label>Colour</Label><Swatches value={selected.colour} onChange={(colour) => setEl(selected.id, { colour: colour ?? INK })} />
                  <div className="mt-2 flex items-center gap-2"><Num label="Thickness" value={selected.width ?? 6} min={1} onChange={(width) => setEl(selected.id, { width })} />
                    <button className={`${small} ${selected.arrow ? "!bg-slate-800 !text-white" : ""}`} onClick={() => setEl(selected.id, { arrow: !selected.arrow })}>Arrowhead</button></div>
                </>
              )}
              {selected.kind === "board" && <BoardProps el={selected} set={(p) => setEl(selected.id, p)} />}
              {selected.kind === "practice" && <PracticeProps el={selected} set={(p) => setEl(selected.id, p)} onEditQuestion={(q, add) => setQuestion({ q, add })} />}
              <Label>Position and size</Label>
              <div className="grid grid-cols-2 gap-1">
                <Num label="X" value={selected.x} onChange={(x) => setEl(selected.id, { x })} /><Num label="Y" value={selected.y} onChange={(y) => setEl(selected.id, { y })} />
                <Num label="W" value={selected.w} onChange={(ww) => setEl(selected.id, { w: ww })} /><Num label="H" value={selected.h} onChange={(h) => setEl(selected.id, { h })} />
              </div>
              <Label>Layer</Label>
              <div className="flex flex-wrap gap-1">
                <button className={small} onClick={() => layer(selected.id, "front")}><ChevronsUp size={12} />Front</button>
                <button className={small} onClick={() => layer(selected.id, "up")}><ArrowUp size={12} />Forward</button>
                <button className={small} onClick={() => layer(selected.id, "down")}><ArrowDown size={12} />Back</button>
                <button className={small} onClick={() => layer(selected.id, "back")}><ChevronsDown size={12} />Behind all</button>
              </div>
            </>
          )}
        </div>
      </div>

      {question && (
        <QuestionEditor start={question.q} onClose={() => { setQuestion(null); setBankVersion((v) => v + 1); }}
          onSave={(q) => {
            setStatus(saveQuestion(q) ? "Question saved on this device" : "Not saved: storage is full");
            if (question.add && selected?.kind === "practice") setEl(selected.id, { bank: [...selected.bank, q.id] });
            setQuestion(null); setBankVersion((v) => v + 1);
          }} />
      )}
    </div>
  );
}
