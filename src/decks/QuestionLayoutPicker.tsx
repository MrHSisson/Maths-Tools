import type { QuestionDisplaySettings } from "../../api/_questionDisplay";

const layouts = [
  ["full", "Full-width", "Question fills the slide; solution opens beside it."],
  ["whiteboard", "Workspace right", "Question left; steps unfold below it."],
  ["whiteboard-inverted", "Workspace left", "Question right; steps unfold below it."],
] as const;
export function QuestionLayoutPicker({ value, onChange }: { value: QuestionDisplaySettings; onChange: (value: QuestionDisplaySettings) => void }) {
  return <fieldset className="space-y-3"><legend className="text-sm font-semibold text-slate-700">Question layout</legend>
    <div className="grid gap-2 sm:grid-cols-3">{layouts.map(([id, title, hint]) => <button key={id} type="button" aria-pressed={(value.presentation ?? "full") === id} onClick={() => onChange({ ...value, presentation: id })} className={`min-h-11 rounded-xl border p-3 text-left ${(value.presentation ?? "full") === id ? "border-blue-800 bg-blue-50 text-blue-950" : "border-slate-300 bg-white text-slate-700"}`}>
      <span aria-hidden="true" className={`question-layout-picture layout-${id}`}><span className="layout-question" />{id !== "full" && <span className="layout-workspace" />}</span><span className="block text-sm font-semibold">{title}</span><span className="mt-1 block text-xs">{hint}</span>
    </button>)}</div>
    {value.presentation && value.presentation !== "full" && <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={value.visualiser !== false} onChange={(e) => onChange({ ...value, visualiser: e.target.checked })} />Offer camera visualiser when presenting</label>}
  </fieldset>;
}
