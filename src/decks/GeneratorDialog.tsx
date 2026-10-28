import { QuestionLayoutPicker } from "./QuestionLayoutPicker";
import { useEffect, useRef, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import type { ToolConfig } from "../shared";
import { DifficultyToggle } from "../shared/components/DifficultyToggle";
import { InlineMath } from "../shared/components/MathRenderer";
import { resolveMultiSelectValues, unmetRequires } from "../shared/helpers";
import { GENERATOR_TOOLS, loadConfig, offered } from "./generators";
import { SlideCanvas } from "./SlideCanvas";
import { CANVAS_W, type DeckElement, type GeneratorPreset, type Slide } from "./types";

export type GeneratorElement = Extract<DeckElement, { kind: "generator" | "worksheet" | "practice" }>;
const field = "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500";
const heading = "mb-2 block text-sm font-semibold text-slate-700";

/** An isolated draft: applying is one editor change; cancelling never changes the slide. Native dialog provides
 *  focus trapping, Escape and an inert editor underneath (including on narrow screens). */
export function GeneratorDialog({ start, intent, onApply, onClose }: { start: GeneratorElement; intent?: Slide["intent"]; onApply: (el: GeneratorElement) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState(start);
  const [cfg, setCfg] = useState<ToolConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewWidth, setPreviewWidth] = useState(480);
  const preset = draft.kind === "practice" ? draft.generator! : draft.preset;
  const patch = (p: Partial<GeneratorElement>) => setDraft((d) => ({ ...d, ...p } as GeneratorElement));
  const setPreset = (p: GeneratorPreset) => patch(draft.kind === "practice" ? { generator: p } : { preset: p });

  useEffect(() => {
    const el = dialog.current!;
    el.showModal();
    return () => el.close();
  }, []);
  useEffect(() => {
    let active = true;
    setLoading(true); setCfg(null);
    void loadConfig(draft.tool).then((c) => {
      if (!active) return;
      setCfg(c); setLoading(false);
      if (c) setDraft((d) => {
        const p = d.kind === "practice" ? d.generator! : d.preset;
        const sub = p.sub && c.tools[p.sub] ? p.sub : Object.keys(c.tools)[0];
        const levels = c.tools[sub].levels ?? ["level1", "level2", "level3"];
        const next = { ...p, sub, level: levels.includes(p.level) ? p.level : levels[0] as GeneratorPreset["level"] };
        return d.kind === "practice" ? { ...d, generator: next } : { ...d, preset: next };
      });
    });
    return () => { active = false; };
  }, [draft.tool]);
  useEffect(() => {
    const el = preview.current!;
    const ro = new ResizeObserver(() => setPreviewWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const sub = cfg && preset.sub && cfg.tools[preset.sub] ? preset.sub : cfg ? Object.keys(cfg.tools)[0] : "";
  const options = cfg ? offered(cfg, sub, preset.level) : null;
  const values = resolveMultiSelectValues(options?.pools ?? [], preset.multiSelect ?? {});
  const offeredValues = new Set(options?.pools.flatMap((p) => p.options.map((o) => o.value)));
  const levels = cfg?.tools[sub]?.levels ?? ["level1", "level2", "level3"];
  const previewEl: DeckElement = draft.kind === "worksheet"
    ? { ...draft, x: 60, y: 70, w: 1480, h: 760 }
    : { ...draft, kind: "generator", preset, seed: "seed" in draft ? draft.seed : 1, x: 80, y: 60, w: 1440, h: 780 };

  return (
    <dialog ref={dialog} aria-labelledby="generator-title" onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose(); } }}
      className="m-auto max-h-[94dvh] w-[calc(100%_-_2rem)] max-w-6xl overflow-hidden rounded-2xl border border-slate-300 bg-[#f8f9fb] p-0 text-slate-900 shadow-lift backdrop:bg-slate-900/40">
      <div className="flex max-h-[94dvh] flex-col">
        <header className="flex shrink-0 items-start gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div><h2 id="generator-title" className="text-2xl font-semibold">Configure generator</h2><p className="mt-1 text-sm text-slate-500">{draft.kind === "worksheet" ? "Build a book activity for this slide." : draft.kind === "practice" ? "Choose what comes after the hand-picked questions." : "Choose the questions this slide will generate."}</p></div>
          <button onClick={onClose} aria-label="Close generator configuration" className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-slate-100"><X size={20} /></button>
        </header>
        <div className="grid min-h-0 overflow-y-auto lg:grid-cols-2">
          <div className="space-y-6 bg-white p-5 sm:p-6">
            <section aria-label="Slide teaching brief" className="rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm"><h3 className="font-semibold">This slide’s teaching brief</h3>{intent ? <dl className="mt-2 space-y-2">{([["Purpose", intent.purpose], ["Question focus", intent.questionFocus], ["Look for", intent.evidence], ["Next", intent.next]]).map(([label, value]) => <div key={label}><dt className="font-semibold">{label}</dt><dd>{value || "Not yet written"}</dd></div>)}</dl> : <p className="mt-2 text-slate-600">No teaching brief yet. Use Lesson thread in the editor to record what questions belong here.</p>}</section>
            <label className="block"><span className={heading}>Tool</span><select autoFocus value={draft.tool} onChange={(e) => patch({ tool: e.target.value, ...(draft.kind === "practice" ? { generator: { level: "level1" } } : { preset: { level: "level1" } }) })} className={field}>
              {GENERATOR_TOOLS.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select></label>
            {loading ? <p role="status" className="text-sm text-slate-500">Loading the tool’s options…</p> : !cfg ? <p role="alert" className="text-sm text-red-700">This tool could not be loaded. Choose another tool or reopen the dialog.</p> : <>
              {Object.keys(cfg.tools).length > 1 && <fieldset><legend className={heading}>Question type</legend><div className="flex flex-wrap gap-2">{Object.entries(cfg.tools).map(([id, t]) => <button key={id} aria-pressed={id === sub} onClick={() => {
                const available = t.levels ?? ["level1", "level2", "level3"];
                setPreset({ sub: id, level: available.includes(preset.level) ? preset.level : available[0] as GeneratorPreset["level"] });
              }} className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-semibold ${id === sub ? "border-blue-900 bg-blue-50 text-blue-900" : "border-slate-300 hover:bg-slate-50"}`}>{t.name}</button>)}</div></fieldset>}
              <fieldset><legend className={heading}>Level</legend><DifficultyToggle value={preset.level} levels={levels} onChange={(level) => setPreset({ sub, level: level as GeneratorPreset["level"] })} fullWidth /></fieldset>
              <section aria-label="Question Options" className="space-y-5"><h3 className="text-lg font-semibold">Question Options</h3>
                {options?.pools.map((pool) => <fieldset key={pool.key}><legend className={heading}>{pool.label}</legend><div className="grid gap-2 sm:grid-cols-2">{pool.options.map((opt) => {
                  const checked = values[opt.value];
                  const unmet = unmetRequires(opt.requires, values, offeredValues).length > 0;
                  const last = checked && !pool.allowEmpty && !pool.exclusive && pool.options.filter((o) => values[o.value]).length === 1;
                  return <label key={opt.value} className={`flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2 text-sm ${unmet ? "border-slate-200 text-slate-400" : checked ? "border-blue-300 bg-blue-50 text-blue-950" : "border-slate-300 text-slate-700"}`}>
                    <input type={pool.exclusive ? "radio" : "checkbox"} name={`generator-${pool.key}`} checked={checked} disabled={unmet || last} className="h-4 w-4 shrink-0 accent-blue-900" onChange={(e) => {
                      const next = { ...values };
                      if (pool.exclusive) pool.options.forEach((o) => { next[o.value] = o.value === opt.value; });
                      else next[opt.value] = e.target.checked;
                      setPreset({ ...preset, multiSelect: next });
                    }} /><span><InlineMath text={opt.label} />{opt.sub && <span className="block text-xs opacity-70">{opt.sub}</span>}{unmet && <span className="block text-xs">Requires another question option</span>}</span>
                  </label>;
                })}</div></fieldset>)}
                {options?.variables.filter((v) => draft.kind === "worksheet" || !v.worksheetOnly).map((v) => <label key={v.key} className="flex min-h-11 items-center gap-3 text-sm text-slate-700"><input type="checkbox" className="h-4 w-4 accent-blue-900" checked={preset.variables?.[v.key] ?? v.defaultValue} onChange={(e) => setPreset({ ...preset, variables: { ...preset.variables, [v.key]: e.target.checked } })} /><InlineMath text={v.label} /></label>)}
                {options?.dropdown && <label className="block"><span className={heading}>{options.dropdown.label}</span><select className={field} value={preset.dropdown ?? options.dropdown.defaultValue} onChange={(e) => setPreset({ ...preset, dropdown: e.target.value })}>{options.dropdown.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>}
                {options && !options.pools.length && !options.variables.filter((v) => draft.kind === "worksheet" || !v.worksheetOnly).length && !options.dropdown && <p className="text-sm text-slate-500">This question type has no extra options at this level.</p>}
              </section>
            </>}
            {draft.kind === "generator" && <QuestionLayoutPicker value={draft} onChange={(display) => patch(display)} />}
            {draft.kind === "worksheet" && <fieldset><legend className={heading}>Book activity</legend><div className="grid grid-cols-2 gap-3">{([['Questions', 'count', 24], ['Columns', 'cols', 4]] as const).map(([label, key, max]) => <label key={key} className="text-sm text-slate-600">{label}<input type="number" min={1} max={max} value={draft[key]} className={`${field} mt-1`} onChange={(e) => { const n = Number(e.target.value); if (Number.isFinite(n)) patch({ [key]: Math.max(1, Math.min(max, Math.round(n))) }); }} /></label>)}</div></fieldset>}
            {draft.kind !== "practice" && <label className="block"><span className={heading}>Instruction</span><input className={field} value={draft.prompt ?? ""} placeholder="Use the tool’s own instruction" onChange={(e) => patch({ prompt: e.target.value || undefined })} /></label>}
          </div>
          <aside className="min-w-0 p-5 sm:p-6 lg:border-l lg:border-slate-200">
            <div className="sticky top-0 space-y-4"><div className="flex flex-wrap items-center gap-3"><h3 className="text-lg font-semibold">Preview</h3>{draft.kind !== "practice" && <button className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold hover:bg-slate-50" onClick={() => patch({ seed: Math.floor(Math.random() * 1e9) })}><RefreshCw size={16} />{draft.kind === "worksheet" ? "Different set" : "Different question"}</button>}</div>
              <div ref={preview} className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-card">{!loading && cfg && <SlideCanvas key={JSON.stringify(draft)} slide={{ id: "generator-preview", title: "Preview", family: "practice", els: [previewEl] }} scale={Math.max(0.01, (previewWidth - 2) / CANVAS_W)} />}</div>
              <p className="text-sm leading-relaxed text-slate-500">{draft.kind === "practice" ? "A sample from the generator that follows your hand-picked questions." : `The slide opens on this ${draft.kind === "worksheet" ? "set" : "question"}. You can generate more when presenting.`}</p>
            </div>
          </aside>
        </div>
        <footer className="flex shrink-0 justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
          <button className="min-h-11 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100" onClick={onClose}>Cancel</button>
          <button disabled={loading || !cfg} onClick={() => onApply(draft)} className="min-h-11 rounded-xl bg-blue-900 px-5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-40">Apply to slide</button>
        </footer>
      </div>
    </dialog>
  );
}
