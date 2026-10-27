import { useEffect, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Minus, Plus, RotateCcw, Sigma, X } from "lucide-react";
import { MathRenderer } from "../shared/components/MathRenderer";
import { MISCONCEPTIONS, misconceptionLabel } from "../shared/misconceptions";
import type { DepthItem } from "../shared/depth";
import { GENERATOR_TOOLS, loadDepthItems, loadOptions } from "./generators";
import { EquationEditor } from "./EquationEditor";
import { allQuestions, bankQuestion, isEditedQuestion, newQuestionId, resetQuestion } from "./store";
import { CANVAS_H, CANVAS_W, MIN_TEXT, type BankQuestion, type DeckElement, type FillMode, type Slide } from "./types";

// The slide editor's panels: small controls, the question editor and the properties of the integrated elements
// (practice question, board). The editor itself is Editor.tsx.

export const SNAP = 10;
const SWATCHES = ["#0f172a", "#475569", "#94a3b8", "#ffffff", "#1e3a8a", "#0369a1", "#7c3aed", "#be185d", "#dbeafe", "#ede9fe", "#f1f5f9", "#fef3c7"];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const w = () => window as any;

export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
export const snap = (v: number, free: boolean) => (free ? Math.round(v) : Math.round(v / SNAP) * SNAP);
export const reId = (el: DeckElement, slideId: string): DeckElement => ({ ...el, id: uid(slideId) });
export const reIdSlide = (s: Slide): Slide => { const id = uid("slide"); return { ...s, id, els: s.els.map((e) => reId(e, id)) }; };

/** A KaTeX string's error, or null when it renders (KaTeX is loaded by the page). */
const texError = (latex: string): string | null => {
  const k = w().katex;
  if (!k) return null;
  try { k.renderToString(latex, { throwOnError: true }); return null; } catch (e) { return String((e as Error).message ?? e).replace(/^KaTeX parse error: /, ""); }
};
export const inlineErrors = (s: string) => [...s.matchAll(/\$([^$]+)\$/g)].map((m) => texError(m[1])).filter(Boolean) as string[];

/** Reads an image file into a data URL no larger than the canvas (big photos are scaled down and saved as JPEG). */
export const readImage = (file: File): Promise<{ src: string; w: number; h: number }> => new Promise((resolve, reject) => {
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

export const Label = ({ children }: { children: ReactNode }) => <div className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</div>;
export const input = "w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none";
export const small = "inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40";
export const toolBtn = "inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40";

export function Swatches({ value, onChange, none }: { value?: string; onChange: (c: string | undefined) => void; none?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {none && <button onClick={() => onChange(undefined)} title="None" className={`h-6 w-6 rounded-md border bg-white text-[10px] text-slate-400 ${!value ? "ring-2 ring-blue-500" : "border-slate-300"}`}>✕</button>}
      {SWATCHES.map((c) => <button key={c} onClick={() => onChange(c)} title={c} className={`h-6 w-6 rounded-md border border-slate-300 ${value === c ? "ring-2 ring-blue-500" : ""}`} style={{ background: c }} />)}
    </div>
  );
}

export function Num({ label, value, onChange, min }: { label: string; value: number; onChange: (n: number) => void; min?: number }) {
  return (
    <label className="flex items-center gap-1 text-xs text-slate-500">{label}
      <input type="number" value={Math.round(value)} min={min} onChange={(e) => { const n = Number(e.target.value); if (Number.isFinite(n)) onChange(n); }} className={`${input} w-20`} />
    </label>
  );
}

function TexField({ label, value, onChange, maths }: { label: string; value: string; onChange: (s: string) => void; maths?: boolean }) {
  const [eq, setEq] = useState(false);
  const err = maths ? texError(value) : inlineErrors(value)[0] ?? null;
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-1">
        <input value={value} onChange={(e) => onChange(e.target.value)} className={`${input} ${err ? "border-red-400" : ""} ${maths ? "font-mono" : ""}`} spellCheck={false} />
        {maths && <button className={small} onClick={() => setEq(true)} title="Open the equation editor"><Sigma size={14} /></button>}
      </div>
      {maths && value && !err && <div className="mt-1 rounded-lg bg-slate-50 px-2 py-1 text-lg"><MathRenderer latex={value} /></div>}
      {err && <div className="mt-1 text-xs text-red-600">{err}</div>}
      {eq && <EquationEditor initial={value} title={label} onClose={() => setEq(false)} onDone={(l) => { onChange(l); setEq(false); }} />}
    </div>
  );
}

// ── The question editor (write a new one, or edit one in the bank) ──────────

export function QuestionEditor({ start, onSave, onClose }: { start: BankQuestion; onSave: (q: BankQuestion) => void; onClose: () => void }) {
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

export function PracticeProps({ el, set, onEditQuestion }: { el: ElOf<"practice">; set: (p: Partial<ElOf<"practice">>) => void; onEditQuestion: (q: BankQuestion, add: boolean) => void }) {
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

export function BoardProps({ el, set }: { el: ElOf<"board">; set: (p: Partial<ElOf<"board">>) => void }) {
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


export function DepthProps({ el, set }: { el: ElOf<"depth">; set: (p: Partial<ElOf<"depth">>) => void }) {
  const [items, setItems] = useState<DepthItem[]>([]);
  useEffect(() => { let on = true; void loadDepthItems(el.tool).then((x) => { if (on) setItems(x); }); return () => { on = false; }; }, [el.tool]);
  // a new Depth element starts on the tool's first Start here question
  useEffect(() => { if (items.length && !items.some((i) => i.id === el.item)) set({ item: (items.find((i) => i.startHere) ?? items[0]).id }); }, [items, el.item, set]);
  const purpose = { diagnose: "Diagnose", explain: "Explain", extend: "Extend" } as const;
  return (
    <>
      <Label>Tool</Label>
      <select value={el.tool} onChange={(e) => set({ tool: e.target.value })} className={input}>{GENERATOR_TOOLS.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
      <Label>Depth question</Label>
      {items.length ? (
        <select value={el.item} onChange={(e) => set({ item: e.target.value })} className={input}>
          {(["level1", "level2", "level3"] as const).map((lv) => (
            <optgroup key={lv} label={`Level ${lv.slice(-1)}`}>
              {items.filter((i) => i.level === lv).map((i) => <option key={i.id} value={i.id}>{purpose[i.purpose]} · {i.title}{i.startHere ? " (start here)" : ""}</option>)}
            </optgroup>
          ))}
        </select>
      ) : <p className="text-xs text-slate-500">This tool has no Depth bank yet.</p>}
      <p className="mt-2 text-xs text-slate-500">Depth questions are written into the tool's own bank (Depth mode on the tool page shows the same ones). "Show answer" turns the slide to the answer when presenting.</p>
    </>
  );
}

export function GridProps({ el, set, onEditQuestion }: { el: ElOf<"grid">; set: (p: Partial<ElOf<"grid">>) => void; onEditQuestion: (q: BankQuestion, add: boolean) => void }) {
  const pool = allQuestions().filter((q) => !el.bank.includes(q.id));
  const move = (i: number, d: number) => { const b = [...el.bank]; const j = i + d; if (j < 0 || j >= b.length) return; [b[i], b[j]] = [b[j], b[i]]; set({ bank: b }); };
  return (
    <>
      <div className="mt-2 flex gap-3"><Num label="Columns" value={el.cols} min={1} onChange={(cols) => set({ cols: Math.max(1, Math.min(4, cols)) })} /><Num label="Size" value={el.size ?? 56} min={MIN_TEXT} onChange={(size) => set({ size })} /></div>
      <Label>Questions, in order</Label>
      <div className="space-y-1">
        {el.bank.map((id, i) => {
          const q = bankQuestion(id);
          return (
            <div key={id} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1">
              <span className="w-4 text-xs text-slate-400">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-base">{q ? <MathRenderer latex={q.latex} /> : <span className="text-xs text-red-600">missing: {id}</span>}</span>
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
          {pool.map((q) => <option key={q.id} value={q.id}>{q.latex} · {misconceptionLabel(q.tag)}</option>)}
        </select>
        <button className={small} onClick={() => onEditQuestion({ id: newQuestionId(), tool: GENERATOR_TOOLS[0][0], level: "level1", tag: Object.keys(MISCONCEPTIONS)[0], latex: "", answer: "", working: [] }, true)}><Plus size={14} />Write a new question</button>
      </div>
    </>
  );
}
