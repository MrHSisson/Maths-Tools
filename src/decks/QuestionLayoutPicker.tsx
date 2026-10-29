import type { QuestionDisplaySettings } from "../../api/_questionDisplay";

const layouts = [
  ["full", "Full-width", "Question fills the slide; solution opens beside it."],
  ["whiteboard", "Workspace right", "Question left; steps unfold below it."],
  ["whiteboard-inverted", "Workspace left", "Question right; steps unfold below it."],
] as const;
/** `compact`: one row of small switches (above the question editor's preview); otherwise illustrated cards. */
export function QuestionLayoutPicker({ value, onChange, compact }: { value: QuestionDisplaySettings; onChange: (value: QuestionDisplaySettings) => void; compact?: boolean }) {
  const current = value.presentation ?? "full";
  if (compact) return <div className="flex flex-wrap items-center gap-2">
    <div role="group" aria-label="Question layout" className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
      {layouts.map(([id, title, hint]) => <button key={id} type="button" aria-pressed={current === id} aria-label={`${title}: ${hint}`} title={hint} onClick={() => onChange({ ...value, presentation: id })}
        className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-xs font-semibold ${current === id ? "bg-blue-50 text-blue-900 ring-1 ring-blue-200" : "text-slate-600 hover:bg-slate-50"}`}>
        <span aria-hidden="true" className={`flex h-3.5 w-6 gap-0.5 rounded-sm border border-slate-300 p-px ${id === "whiteboard-inverted" ? "flex-row-reverse" : ""}`}><span className="flex-1 rounded-[1px] bg-blue-300" />{id !== "full" && <span className="flex-1 rounded-[1px] border border-dashed border-slate-400" />}</span>{title}
      </button>)}
    </div>
    {current !== "full" && <label className="flex min-h-9 items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={value.visualiser !== false} onChange={(e) => onChange({ ...value, visualiser: e.target.checked })} />Camera when presenting</label>}
  </div>;
  return <fieldset className="space-y-3"><legend className="text-sm font-semibold text-slate-700">Question layout</legend>
    <div className="grid gap-2 sm:grid-cols-3">{layouts.map(([id, title, hint]) => <button key={id} type="button" aria-pressed={(value.presentation ?? "full") === id} onClick={() => onChange({ ...value, presentation: id })} className={`min-h-11 rounded-xl border p-3 text-left ${(value.presentation ?? "full") === id ? "border-blue-800 bg-blue-50 text-blue-950" : "border-slate-300 bg-white text-slate-700"}`}>
      <span aria-hidden="true" className={`question-layout-picture layout-${id}`}><span className="layout-question" />{id !== "full" && <span className="layout-workspace" />}</span><span className="block text-sm font-semibold">{title}</span><span className="mt-1 block text-xs">{hint}</span>
    </button>)}</div>
    {value.presentation && value.presentation !== "full" && <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={value.visualiser !== false} onChange={(e) => onChange({ ...value, visualiser: e.target.checked })} />Offer camera visualiser when presenting</label>}
  </fieldset>;
}
