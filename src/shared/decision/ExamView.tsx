import { useState, type ReactNode } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import type { DecisionProblem, SolveStep } from "./types";

// ═══════════════════════════════════════════════════════════════════════════
// ExamView — an exam-style question: the picture, the context, then lettered parts each with its marks. A part's answer is revealed on
// request (model answer, then the mark scheme with a tick box per mark); the picture shows that part's own working while it is open.
// The student self-marks: nothing typed is checked. A new question remounts it (key = exam.id), so ticks and open parts reset.
// ═══════════════════════════════════════════════════════════════════════════

const CODE_TONE: Record<string, string> = { B: "#1e3a8a", M: "#7c3aed", A: "#166534", E: "#b45309", R: "#b45309" };

export default function ExamView({ problem, shown, footer, narrow }: {
  problem: DecisionProblem;
  shown: (st: SolveStep | undefined) => ReactNode;
  footer?: ReactNode;
  narrow: boolean;
}) {
  const exam = problem.exam!;
  const [open, setOpen] = useState<boolean[]>(() => exam.parts.map(() => false));
  const [ticks, setTicks] = useState<Record<string, boolean>>({});
  const [active, setActive] = useState<number | null>(null);

  const toggle = (i: number) => {
    const next = open.map((o, k) => (k === i ? !o : o));
    setOpen(next);
    setActive(next[i] ? i : next.lastIndexOf(true) >= 0 ? next.lastIndexOf(true) : null);
  };
  const allOpen = open.every(Boolean);
  const showAll = () => { setOpen(exam.parts.map(() => !allOpen)); setActive(allOpen ? null : exam.parts.length - 1); };
  const earned = exam.parts.reduce((t, p, i) => t + (open[i] ? p.scheme.filter((_, j) => ticks[`${i}-${j}`]).length : 0), 0);
  const view = active !== null && open[active] ? exam.parts[active].view : undefined;
  const step: SolveStep | undefined = view ? { caption: "", edgeStates: {}, flowView: view as SolveStep["flowView"] } : undefined;

  const picture = (
    <div className="flex flex-col gap-2 min-w-0">
      <div className="relative rounded-xl border border-gray-200 bg-white overflow-hidden" style={{ height: narrow ? "38dvh" : "min(70vh, 720px)", minHeight: narrow ? 220 : 360 }}>
        {shown(step)}
      </div>
      {footer && <div className="flex justify-center">{footer}</div>}
    </div>
  );

  const summary = (
    <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-2">
        <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Exam question · {exam.totalMarks} marks · about {exam.minutes} minutes</div>
        <div className="text-sm font-semibold text-gray-600">Self-marked: <span className="text-blue-900">{earned} / {exam.totalMarks}</span></div>
      </div>
      <div className="text-base font-semibold text-gray-900 leading-snug">{exam.intro}</div>
      <button onClick={showAll} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-900 hover:underline">
        {allOpen ? <EyeOff size={16} /> : <Eye size={16} />} {allOpen ? "Hide all answers" : "Show all answers"}
      </button>
    </div>
  );

  const partCard = (p: (typeof exam.parts)[number], i: number) => (
    <div key={i} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="font-bold text-gray-900 text-base shrink-0 w-8">{p.label}</div>
          <div className="flex-1 text-base text-gray-900 leading-snug">{p.prompt}</div>
          <div className="text-sm font-bold text-gray-500 shrink-0 whitespace-nowrap">[{p.marks} mark{p.marks > 1 ? "s" : ""}]</div>
        </div>
        <button onClick={() => toggle(i)} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-900 text-white px-4 py-1.5 text-sm font-semibold hover:bg-blue-800">
          {open[i] ? <EyeOff size={16} /> : <Eye size={16} />} {open[i] ? "Hide answer" : "Show answer"}
        </button>
      </div>
      {open[i] && (
        <div className="border-t border-gray-200 bg-slate-50 px-5 py-4 flex flex-col gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Model answer</div>
            <div className="flex flex-col gap-1 text-base text-gray-900 leading-snug">{p.model.map((l, k) => <div key={k} style={{ whiteSpace: "pre-line" }}>{l}</div>)}</div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Mark scheme — tick each mark you earned</div>
            <div className="flex flex-col gap-1.5">
              {p.scheme.map((m, j) => {
                const key = `${i}-${j}`;
                const on = !!ticks[key];
                return (
                  <label key={j} className={`flex items-start gap-3 rounded-lg border px-3 py-2 cursor-pointer ${on ? "bg-green-50 border-green-300" : "bg-white border-gray-200"}`}>
                    <input type="checkbox" className="sr-only" checked={on} onChange={() => setTicks((t) => ({ ...t, [key]: !t[key] }))} />
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${on ? "bg-green-600 border-green-600 text-white" : "bg-white border-gray-300 text-transparent"}`}><Check size={14} /></span>
                    <span className="shrink-0 rounded px-1.5 py-0.5 text-xs font-bold text-white" style={{ background: CODE_TONE[m.code[0]] ?? "#475569" }}>{m.code}</span>
                    <span className="text-sm text-gray-800 leading-snug">{m.text}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return narrow ? (
    <div className="flex flex-col gap-3 p-3">{summary}{picture}{exam.parts.map(partCard)}</div>
  ) : (
    <div className="p-3 sm:p-6 grid gap-4 sm:gap-6 items-start" style={{ gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)" }}>
      <div className="sticky top-3 min-w-0">{picture}</div>
      <div className="flex flex-col gap-4 min-w-0">{summary}{exam.parts.map(partCard)}</div>
    </div>
  );
}
