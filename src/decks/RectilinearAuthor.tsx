import { useEffect, useState } from "react";
import { defaultRectilinear, isRectilinearSpec, type RectilinearSpec } from "../../api/_rectilinear";
import { authoredRectilinear } from "./rectilinear";
import type { CuratedQuestion } from "./types";

const input = "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm";
/** Dimension edits stay a draft until valid; the diagram, answer and working are applied together. */
export function RectilinearAuthor({ question, onChange, onValidityChange }: { question: CuratedQuestion; onChange: (q: CuratedQuestion) => void; onValidityChange?: (valid: boolean) => void }) {
  const [draft, setDraft] = useState<RectilinearSpec>(() => structuredClone(question.rectilinear ?? defaultRectilinear()));
  useEffect(() => { onValidityChange?.(isRectilinearSpec(draft)); }, [draft, onValidityChange]);
  const change = (patch: Partial<RectilinearSpec>) => {
    const next = { ...draft, ...patch }; setDraft(next);
    if (isRectilinearSpec(next)) onChange(authoredRectilinear(question.id, next, question));
  };
  return <fieldset className="space-y-3 rounded-xl border border-slate-300 bg-slate-50 p-3"><legend className="px-1 text-sm font-semibold">Rectilinear shape</legend>
    <label className="block text-sm">Shape<select aria-label="Rectilinear shape" className={input} value={draft.shape} onChange={e => change({ shape: e.target.value as RectilinearSpec["shape"] })}><option value="L">L-shape</option><option value="T">T-shape</option><option value="stairs3">Three-step staircase</option></select></label>
    <div className="grid grid-cols-2 gap-3">{([["width", "Overall width (cm)"], ["height", "Overall height (cm)"], ["cutWidth", draft.shape === "L" ? "Cut-out width (cm)" : "Step / side cut width (cm)"], ["cutHeight", draft.shape === "stairs3" ? "Step height (cm)" : "Cut-out height (cm)"]] as const).map(([key, label]) => <label key={key} className="text-sm">{label}<input aria-label={label} type="number" min={1} max={100} step={1} className={input} value={Number.isNaN(draft[key]) ? "" : draft[key]} onChange={e => change({ [key]: e.target.valueAsNumber })} /></label>)}</div>
    {!isRectilinearSpec(draft) && <p role="alert" className="text-sm text-red-700">Use whole-number lengths. The cut-outs must fit inside the overall rectangle. The last valid shape is kept until these dimensions fit.</p>}
    <p className="text-xs text-slate-600">T-shapes have two equal side cut-outs. Staircases have two equal steps and a remaining third step.</p>
    <label className="block text-sm">Method<select aria-label="Area method" className={input} value={draft.method} onChange={e => change({ method: e.target.value as RectilinearSpec["method"] })}><option value="split">Split into rectangles and add</option><option value="subtract">Whole rectangle minus cut-outs</option></select></label>
    <label className="block text-sm">Orientation<select aria-label="Shape orientation" className={input} value={draft.orientation} onChange={e => change({ orientation: Number(e.target.value) })}>{Array.from({ length: 8 }, (_, i) => <option key={i} value={i}>{i < 4 ? "Rotation" : "Reflected rotation"} {(i % 4) * 90}°</option>)}</select></label>
    <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={draft.reducedLabels} onChange={e => change({ reducedLabels: e.target.checked })} />Reduced labelling</label>
    <label className="block text-sm">Worksheet support<select aria-label="Worksheet support" className={input} value={draft.scaffold} onChange={e => change({ scaffold: e.target.value as RectilinearSpec["scaffold"] })}><option value="full">Split shown and calculation prompts</option><option value="split">Split shown, working space</option><option value="none">Independent, working space</option></select></label>
    <p className="text-xs text-slate-600">The diagram and worked answer update together. Duplicate a question to compare adding with removing a cut-out.</p>
  </fieldset>;
}
