import { useState } from "react";
import { GENERATOR_TOOLS } from "./generators";
import { defaultQuestionBrief, questionBriefText } from "./questionBrief";
import type { QuestionSlideDraft } from "./types";

const input = "mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-blue-500";
export function QuestionBriefFields({ value, tool, identity, onChange }: { value: QuestionSlideDraft; tool: string; identity: string; onChange: (v: QuestionSlideDraft) => void }) {
  const [copyStatus, setCopyStatus] = useState("");
  const brief = value.questionBrief ?? defaultQuestionBrief(tool);
  const intent = value.intent ?? { purpose: "", questionFocus: "", evidence: "", next: "" };
  return <div className="space-y-3">
    <label className="block text-sm font-semibold">Skill / slide title<input className={input} value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} /></label>
    {([['purpose', 'Teaching purpose'], ['questionFocus', 'Question focus']] as const).map(([key, label]) => <label key={key} className="block text-sm font-semibold">{label}<textarea rows={2} className={input} value={intent[key]} onChange={(e) => onChange({ ...value, intent: { ...intent, [key]: e.target.value } })} /></label>)}
    <label className="block text-sm font-semibold">Number of questions<input type="number" min={1} step={1} className={input} value={brief.count} onChange={(e) => { const count = Number(e.target.value); if (Number.isSafeInteger(count) && count > 0) onChange({ ...value, questionBrief: { ...brief, count } }); }} /></label>
    {([['exclude', 'Avoid'], ['progression', 'Variation / progression'], ['examples', 'Reference examples']] as const).map(([key, label]) => <label key={key} className="block text-sm font-semibold">{label}<textarea rows={2} className={input} value={brief[key]} onChange={(e) => onChange({ ...value, questionBrief: { ...brief, [key]: e.target.value } })} /></label>)}
    <fieldset className="space-y-2"><legend className="text-sm font-semibold">Solution reference</legend><p className="text-xs text-slate-500">Use this generator’s method, labels and reveal steps. Changing the brief keeps your existing questions and working.</p>
      <label className="block text-sm">Generator<select className={input} value={brief.solution.tool} onChange={(e) => onChange({ ...value, questionBrief: { ...brief, solution: { ...brief.solution, tool: e.target.value, sub: "" } } })}>{!GENERATOR_TOOLS.some(([id]) => id === brief.solution.tool) && <option value={brief.solution.tool}>{brief.solution.tool}</option>}{GENERATOR_TOOLS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <div className="grid gap-2 sm:grid-cols-2"><label className="text-sm">Sub-tool<input className={input} placeholder="Default sub-tool" value={brief.solution.sub} onChange={(e) => onChange({ ...value, questionBrief: { ...brief, solution: { ...brief.solution, sub: e.target.value } } })} /></label><label className="text-sm">Solution level<select className={input} value={brief.solution.level} onChange={(e) => onChange({ ...value, questionBrief: { ...brief, solution: { ...brief.solution, level: e.target.value as typeof brief.solution.level } } })}>{["level1", "level2", "level3"].map((v) => <option key={v} value={v}>Level {v.slice(-1)}</option>)}</select></label></div>
    </fieldset>
    <button className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold" onClick={() => { void navigator.clipboard.writeText(questionBriefText({ ...value, questionBrief: brief }, identity)).then(() => setCopyStatus("Question brief copied. Paste it into chat to discuss this slide.")).catch(() => setCopyStatus("Copy was unavailable. Select the brief text below to copy it.")); }}>Copy question brief</button>
    {copyStatus && <p role="status" className="text-sm text-slate-600">{copyStatus}</p>}{copyStatus.startsWith("Copy was") && <textarea readOnly aria-label="Question brief to copy" rows={8} className={input} value={questionBriefText({ ...value, questionBrief: brief }, identity)} />}
  </div>;
}
