import { type ReactNode } from "react";
import { Minus, Plus, X } from "lucide-react";
import { GENERATOR_TOOLS } from "./generators";
import { CANVAS_H, CANVAS_W, MIN_TEXT, type DeckElement, type FillMode, type Slide } from "./types";
import { BAR_TONES, barProblems, barUnits } from "../shared/barModel";

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

type ElOf<K extends DeckElement["kind"]> = Extract<DeckElement, { kind: K }>;

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


const FILL_NAMES: [FillMode, string][] = [["filled", "Filled in"], ["structure", "Structure only"], ["blank", "Blank"]];
const FillButtons = ({ value, onChange }: { value: FillMode; onChange: (m: FillMode) => void }) => (
  <div className="flex gap-1">{FILL_NAMES.map(([m, label]) => <button key={m} onClick={() => onChange(m)} className={`${small} ${value === m ? "!bg-slate-800 !text-white" : ""}`}>{label}</button>)}</div>
);
const Check = ({ checked, onChange, children }: { checked: boolean; onChange: (b: boolean) => void; children: ReactNode }) => (
  <label className="mt-2 flex min-h-8 items-center gap-2 text-sm text-slate-700"><input type="checkbox" className="h-4 w-4 accent-blue-900" checked={checked} onChange={(e) => onChange(e.target.checked)} />{children}</label>
);

/** The ratio table: quantities across the top, a row per scale step, and the factor between two rows. */
export function RatioTableProps({ el, set }: { el: ElOf<"ratioTable">; set: (p: Partial<ElOf<"ratioTable">>) => void }) {
  const t = el.table, cols = t.headers.length;
  const setTable = (p: Partial<typeof t>) => set({ table: { ...t, ...p } });
  const setCell = (r: number, c: number, v: string) => setTable({ rows: t.rows.map((row, i) => (i === r ? row.map((x, j) => (j === c ? v : x)) : row)) });
  const setOp = (i: number, v: string) => setTable({ operations: t.operations.map((x, j) => (j === i ? v : x)) });
  return (
    <>
      <Label>Starts as</Label>
      <FillButtons value={el.fill ?? "filled"} onChange={(fill) => set({ fill })} />
      <Check checked={!!el.staged} onChange={(staged) => set({ staged })}>One row per click</Check>
      <div className="mt-2 flex gap-3"><Num label="Rows given" value={t.given ?? 1} min={0} onChange={(given) => setTable({ given })} /><Num label="Text size" value={el.size ?? 46} min={MIN_TEXT} onChange={(size) => set({ size })} /></div>
      <Label>Cells and factors (maths, no $ needed)</Label>
      <div className="overflow-auto">
        <table className="text-xs">
          <tbody>
            <tr>{t.headers.map((h, c) => <td key={c} className="p-0.5"><input value={h} onChange={(e) => setTable({ headers: t.headers.map((x, j) => (j === c ? e.target.value : x)) })} className={`${input} font-semibold`} aria-label={`Heading ${c + 1}`} /></td>)}<td /></tr>
            {t.rows.flatMap((row, r) => [
              <tr key={`r${r}`}>
                {row.map((cell, c) => <td key={c} className="p-0.5"><input value={cell} spellCheck={false} onChange={(e) => setCell(r, c, e.target.value)} className={`${input} font-mono`} aria-label={`Row ${r + 1}, column ${c + 1}`} /></td>)}
                <td><button className={small} onClick={() => setTable({ rows: t.rows.filter((_, i) => i !== r), operations: t.operations.filter((_, i) => i !== Math.min(r, t.operations.length - 1)) })} disabled={t.rows.length < 2} aria-label="Remove row"><X size={12} /></button></td>
              </tr>,
              ...(r < t.rows.length - 1 ? [<tr key={`o${r}`}><td colSpan={cols} className="p-0.5"><input value={t.operations[r] ?? ""} spellCheck={false} onChange={(e) => setOp(r, e.target.value)} placeholder="factor, e.g. \\times 3" className={`${input} font-mono !bg-slate-50 text-slate-500`} aria-label={`Factor between rows ${r + 1} and ${r + 2}`} /></td><td /></tr>] : []),
            ])}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <button className={small} onClick={() => setTable({ rows: [...t.rows, Array(cols).fill("")], operations: [...t.operations, ""] })}><Plus size={12} />Row</button>
        <button className={small} onClick={() => setTable({ headers: [...t.headers, ""], rows: t.rows.map((r) => [...r, ""]) })}><Plus size={12} />Column</button>
        <button className={small} disabled={cols < 2} onClick={() => setTable({ headers: t.headers.slice(0, -1), rows: t.rows.map((r) => r.slice(0, -1)) })}><Minus size={12} />Column</button>
      </div>
    </>
  );
}

/** The bar model: boxes in coloured parts, with braces above and below. */
export function BarProps({ el, set }: { el: ElOf<"bar">; set: (p: Partial<ElOf<"bar">>) => void }) {
  const b = el.bar, braces = b.braces ?? [];
  const setBar = (p: Partial<typeof b>) => set({ bar: { ...b, ...p } });
  const setPart = (i: number, p: Partial<(typeof b.parts)[number]>) => setBar({ parts: b.parts.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  const setBrace = (i: number, p: Partial<(typeof braces)[number]>) => setBar({ braces: braces.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  const problems = barProblems(b);
  return (
    <>
      <Label>Starts as</Label>
      <FillButtons value={el.fill ?? "filled"} onChange={(fill) => set({ fill })} />
      <Check checked={!!el.staged} onChange={(staged) => set({ staged })}>One part, then one brace, per click</Check>
      <div className="mt-2 flex gap-3"><Num label="Text size" value={el.size ?? 40} min={MIN_TEXT} onChange={(size) => set({ size })} />
        <label className="flex items-center gap-1 text-xs text-slate-500">In each box<input value={b.unitLabel ?? ""} spellCheck={false} onChange={(e) => setBar({ unitLabel: e.target.value || undefined })} className={`${input} w-20`} /></label></div>
      <Label>Layout</Label>
      <div className="flex gap-1">
        <button className={`${small} ${b.rows ? "!bg-slate-800 !text-white" : ""}`} onClick={() => !b.rows && setBar({ parts: [], braces: undefined, unitLabel: undefined, rows: b.parts.map((p, i) => ({ name: String.fromCharCode(65 + i), units: p.units })) })} title="One row per quantity, aligned from the left, as in Ratio Sharing">Rows (ratio)</button>
        <button className={`${small} ${!b.rows ? "!bg-slate-800 !text-white" : ""}`} onClick={() => b.rows && setBar({ rows: undefined, sideBrace: undefined, parts: b.rows.map((r, i) => ({ units: r.units, tone: i })) })} title="One bar of coloured parts">Single bar</button>
      </div>
      {b.rows && <>
        <Label>Rows ({barUnits(b)} boxes across)</Label>
        {b.rows.map((r, i) => {
          const setRow = (p: Partial<typeof r>) => setBar({ rows: b.rows!.map((x, j) => (j === i ? { ...x, ...p } : x)) });
          return (
            <div key={i} className="mb-2 rounded-lg border border-slate-200 p-2">
              <div className="flex flex-wrap items-center gap-2">
                <input value={r.name ?? ""} spellCheck={false} onChange={(e) => setRow({ name: e.target.value || undefined })} placeholder="name" className={`${input} w-24`} aria-label={`Row ${i + 1} name`} />
                <Num label="Boxes" value={r.units} min={1} onChange={(units) => setRow({ units })} />
                <button className={small} disabled={b.rows!.length < 2} onClick={() => setBar({ rows: b.rows!.filter((_, j) => j !== i) })} aria-label="Remove row"><X size={12} /></button>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <input value={r.unitLabel ?? ""} spellCheck={false} onChange={(e) => setRow({ unitLabel: e.target.value || undefined })} placeholder="in each box" className={`${input} w-28`} aria-label={`Row ${i + 1} text in each box`} />
                <input value={r.total ?? ""} spellCheck={false} onChange={(e) => setRow({ total: e.target.value || undefined })} placeholder="= total" className={`${input} w-28`} aria-label={`Row ${i + 1} total`} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <Num label="Extra from box" value={(r.extraFrom ?? -1) + 1} min={0} onChange={(n) => setRow({ extraFrom: n > 0 ? n - 1 : undefined })} />
                <label className="flex items-center gap-1 text-xs text-slate-500"><input type="checkbox" className="h-4 w-4 accent-blue-900" checked={!!r.known} onChange={(e) => setRow({ known: e.target.checked || undefined })} />Known amount</label>
              </div>
            </div>
          );
        })}
        <button className={small} onClick={() => setBar({ rows: [...b.rows!, { name: String.fromCharCode(65 + b.rows!.length), units: 1 }] })}><Plus size={12} />Row</button>
        <Label>Brace across all rows</Label>
        <input value={b.sideBrace?.label ?? ""} spellCheck={false} onChange={(e) => setBar({ sideBrace: e.target.value ? { label: e.target.value } : undefined })} placeholder="e.g. total: 5 parts (blank for none)" className={input} aria-label="Brace label" />
      </>}
      {!b.rows && <>
      <Label>Parts ({barUnits(b)} boxes)</Label>
      {b.parts.map((p, i) => (
        <div key={i} className="mb-1 flex items-center gap-2">
          <Num label={`Part ${i + 1}`} value={p.units} min={1} onChange={(units) => setPart(i, { units })} />
          <div className="flex gap-0.5">{BAR_TONES.map((t, k) => <button key={k} aria-label={`Colour ${k + 1}`} onClick={() => setPart(i, { tone: k })} className={`h-5 w-5 rounded border ${(p.tone ?? i) % BAR_TONES.length === k ? "ring-2 ring-blue-500" : "border-slate-300"}`} style={{ background: t.fill }} />)}</div>
          <button className={small} disabled={b.parts.length < 2} onClick={() => setBar({ parts: b.parts.filter((_, j) => j !== i) })} aria-label="Remove part"><X size={12} /></button>
        </div>
      ))}
      <button className={small} onClick={() => setBar({ parts: [...b.parts, { units: 1, tone: b.parts.length % BAR_TONES.length }] })}><Plus size={12} />Part</button>
      <Label>Braces (boxes from … to …)</Label>
      {braces.map((br, i) => (
        <div key={i} className="mb-2 rounded-lg border border-slate-200 p-2">
          <div className="flex flex-wrap items-center gap-2">
            <Num label="From" value={br.from + 1} min={1} onChange={(n) => setBrace(i, { from: n - 1 })} /><Num label="to" value={br.to} min={1} onChange={(to) => setBrace(i, { to })} />
            <button className={`${small} ${br.below ? "!bg-slate-800 !text-white" : ""}`} onClick={() => setBrace(i, { below: !br.below })}>{br.below ? "Below" : "Above"}</button>
            <button className={small} onClick={() => setBar({ braces: braces.filter((_, j) => j !== i) })} aria-label="Remove brace"><X size={12} /></button>
          </div>
          <input value={br.label} spellCheck={false} onChange={(e) => setBrace(i, { label: e.target.value })} placeholder="label ($…$ for maths)" className={`${input} mt-1`} aria-label={`Brace ${i + 1} label`} />
        </div>
      ))}
      <button className={small} onClick={() => setBar({ braces: [...braces, { from: 0, to: barUnits(b), label: "" }] })}><Plus size={12} />Brace</button>
      </>}
      {problems.length > 0 && <p className="mt-2 text-xs text-red-700" role="alert">{problems.join(". ")}.</p>}
    </>
  );
}

/** Generator setup belongs in the central dialog; this panel keeps only its summary. */
export function GeneratorProps({ el, onConfigure }: { el: ElOf<"generator"> | ElOf<"worksheet">; onConfigure: () => void }) {
  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="font-semibold text-slate-900">{GENERATOR_TOOLS.find(([id]) => id === el.tool)?.[1] ?? el.tool}</div>
      <p className="mt-1 text-sm text-slate-500">Level {el.preset.level.slice(-1)}{el.kind === "worksheet" ? ` · ${el.count} questions · ${el.cols} columns` : el.presentation === "full-inverted" ? " · full-width, flipped" : el.presentation === "whiteboard" ? " · workspace right" : el.presentation === "whiteboard-inverted" ? " · workspace left" : " · live generator"}</p>
      <button className={`${small} mt-3 min-h-10 w-full justify-center`} onClick={onConfigure}>Configure generator…</button>
      <p className="mt-2 text-xs text-slate-500">Choose the tool, level and Question Options, with a preview.</p>
    </div>
  );
}
