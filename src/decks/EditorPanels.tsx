import { type ReactNode } from "react";
import { Minus, Plus, X } from "lucide-react";
import { GENERATOR_TOOLS } from "./generators";
import { CANVAS_H, CANVAS_W, MIN_TEXT, type DeckElement, type FillMode, type Slide } from "./types";

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


/** Generator setup belongs in the central dialog; this panel keeps only its summary. */
export function GeneratorProps({ el, onConfigure }: { el: ElOf<"generator"> | ElOf<"worksheet">; onConfigure: () => void }) {
  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="font-semibold text-slate-900">{GENERATOR_TOOLS.find(([id]) => id === el.tool)?.[1] ?? el.tool}</div>
      <p className="mt-1 text-sm text-slate-500">Level {el.preset.level.slice(-1)}{el.kind === "worksheet" ? ` · ${el.count} questions · ${el.cols} columns` : " · live generator"}</p>
      <button className={`${small} mt-3 min-h-10 w-full justify-center`} onClick={onConfigure}>Configure generator…</button>
      <p className="mt-2 text-xs text-slate-500">Choose the tool, level and Question Options, with a preview.</p>
    </div>
  );
}
