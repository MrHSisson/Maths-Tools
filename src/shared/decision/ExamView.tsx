import { useState, type ReactNode } from "react";
import { Eye, EyeOff, HelpCircle } from "lucide-react";
import type { DecisionProblem, SolveStep } from "./types";

// ═══════════════════════════════════════════════════════════════════════════
// ExamView — an exam-style question: the picture, the context, then lettered parts each with its marks. A part's answer is revealed on
// request: just the answer, with the marks it earns listed underneath. A (?) button opens the step-by-step explanation for that part.
// The picture shows that part's own working while it is open. Nothing typed is checked or scored. A new question remounts it
// (key = exam.id), so open parts and explanations reset.
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
  const [why, setWhy] = useState<Record<number, boolean>>({});
  const [active, setActive] = useState<number | null>(null);

  const toggle = (i: number) => {
    const next = open.map((o, k) => (k === i ? !o : o));
    setOpen(next);
    setActive(next[i] ? i : next.lastIndexOf(true) >= 0 ? next.lastIndexOf(true) : null);
  };
  const allOpen = open.every(Boolean);
  const showAll = () => { setOpen(exam.parts.map(() => !allOpen)); setActive(allOpen ? null : exam.parts.length - 1); };
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
        <div className="border-t border-gray-200 bg-slate-50 px-5 py-4 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="flex-1 flex flex-col gap-1 text-base text-gray-900 leading-snug">{p.model.map((l, k) => <div key={k} style={{ whiteSpace: "pre-line" }}>{l}</div>)}</div>
            {p.explain && p.explain.length > 0 && (
              <button onClick={() => setWhy((w) => ({ ...w, [i]: !w[i] }))} aria-label="Explain this answer" aria-pressed={!!why[i]} title="Show the step by step"
                className={`shrink-0 rounded-full ${why[i] ? "text-blue-900" : "text-gray-400 hover:text-blue-900"}`}><HelpCircle size={22} /></button>
            )}
          </div>
          {why[i] && p.explain && (
            <div className="rounded-lg border border-blue-200 bg-white px-4 py-3 flex flex-col gap-1 text-sm text-gray-800 leading-snug">
              {p.explain.map((l, k) => <div key={k} style={{ whiteSpace: "pre-line" }}>{l}</div>)}
            </div>
          )}
          <div className="flex flex-col gap-1 border-t border-gray-200 pt-2">
            {p.scheme.map((m, j) => (
              <div key={j} className="flex items-start gap-2">
                <span className="shrink-0 rounded px-1.5 py-0.5 text-xs font-bold text-white" style={{ background: CODE_TONE[m.code[0]] ?? "#475569" }}>{m.code}</span>
                <span className="text-xs text-gray-600 leading-snug">{m.text}</span>
              </div>
            ))}
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
