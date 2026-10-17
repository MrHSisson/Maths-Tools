import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff, HelpCircle, Check } from "lucide-react";
import type { DecisionProblem, ExamPart, SolveStep } from "./types";
import { STAGE_H } from "./layout";

// ═══════════════════════════════════════════════════════════════════════════
// ExamView — an exam-style question: the picture, the context, then lettered parts each with its marks.
// One part at a time by default (a strip of part tabs, Back / Next), with an "All parts" switch for the whole question in a
// scrolling list. A part's answer is revealed on request: just the answer with its marks listed under it, and a (?) for the
// step by step. The picture is pinned in view and shows the open part's own working. Nothing typed is checked or scored.
// A new question remounts it (key = exam.id), so revealed answers and the chosen part reset.
// ═══════════════════════════════════════════════════════════════════════════

const CODE_TONE: Record<string, string> = { B: "#1e3a8a", M: "#7c3aed", A: "#166534", E: "#b45309", R: "#b45309" };

export default function ExamView({ problem, shown, footer, narrow }: {
  problem: DecisionProblem;
  shown: (st: SolveStep | undefined) => ReactNode;
  footer?: ReactNode;
  narrow: boolean;
}) {
  const exam = problem.exam!;
  const parts = exam.parts;
  const [open, setOpen] = useState<boolean[]>(() => parts.map(() => false));
  const [why, setWhy] = useState<Record<number, boolean>>({});
  const [stepAt, setStepAt] = useState<Record<number, number>>({});   // the working step each part has reached (0-based)
  const [allSteps, setAllSteps] = useState<Record<number, boolean>>({});   // Show all, as in Worked Example
  const [active, setActive] = useState(0);
  const [all, setAll] = useState(false);
  const [introOpen, setIntroOpen] = useState(true);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  const toggle = (i: number) => { setOpen((o) => o.map((v, k) => (k === i ? !v : v))); setActive(i); };
  const allRevealed = open.every(Boolean);
  const revealAll = () => { setOpen(parts.map(() => !allRevealed)); if (!allRevealed) setActive(parts.length - 1); };
  const go = (i: number) => {
    setActive(i);
    if (all) cardRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };
  useEffect(() => { if (!all) cardRefs.current[active]?.scrollIntoView({ block: "nearest" }); }, [all]); // eslint-disable-line react-hooks/exhaustive-deps

  // the picture: the working step being read, else the open part's own answer figure
  const playing = open[active] && why[active] ? parts[active].working : undefined;
  const view = open[active] ? parts[active].view : undefined;
  const step: SolveStep | undefined = playing && playing.length
    ? playing[allSteps[active] ? playing.length - 1 : Math.min(stepAt[active] ?? 0, playing.length - 1)]
    : view ? { caption: "", edgeStates: {}, flowView: view as SolveStep["flowView"] } : undefined;

  // the picture stays in view whatever the parts below do (sticky), so a long answer or a long list never leaves it behind
  const picture = (
    <div className={`flex flex-col gap-2 min-w-0 ${narrow ? "sticky top-0 z-20 bg-[#f8f9fb] pb-2 -mx-3 px-3" : "h-full min-h-0"}`}>
      <div className={`relative rounded-xl border border-gray-200 bg-white overflow-hidden ${narrow ? "" : "flex-1 min-h-0"}`} style={narrow ? { height: "32dvh", minHeight: 190 } : { minHeight: 300 }}>
        {shown(step)}
      </div>
      {footer && <div className="flex justify-center">{footer}</div>}
    </div>
  );

  // the question's own card: title and marks, the context (collapsible), the part tabs and the one-part / all-parts switch
  const header = (
    <div className="rounded-xl border border-gray-200 bg-white">
      <button onClick={() => setIntroOpen(!introOpen)} aria-expanded={introOpen} className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Exam question · {exam.totalMarks} marks · about {exam.minutes} minutes</span>
        <ChevronDown size={18} className="shrink-0 text-slate-400 transition-transform" style={{ transform: introOpen ? "rotate(180deg)" : undefined }} />
      </button>
      {introOpen && <div className="px-4 pb-3 text-base font-semibold text-gray-900 leading-snug">{exam.intro}</div>}
      <div className="border-t border-gray-200 px-3 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5" role="tablist">
          {parts.map((p, i) => (
            <button key={i} role="tab" aria-selected={active === i} onClick={() => go(i)}
              className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${active === i ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"}`}>
              {p.label}{open[i] && <Check size={14} />}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-slate-200/60 p-1 text-sm font-semibold">
          <button onClick={() => setAll(false)} className={`px-3 py-1 rounded-lg ${!all ? "bg-white text-blue-900 shadow-sm" : "text-slate-600"}`}>One part</button>
          <button onClick={() => { setAll(true); setIntroOpen(false); }} className={`px-3 py-1 rounded-lg ${all ? "bg-white text-blue-900 shadow-sm" : "text-slate-600"}`}>All parts</button>
        </div>
      </div>
    </div>
  );

  const partCard = (p: ExamPart, i: number) => (
    <div key={i} ref={(el) => { cardRefs.current[i] = el; }} onClick={() => setActive(i)}
      className={`shrink-0 rounded-xl border bg-white overflow-hidden ${all && active === i ? "border-blue-900 ring-1 ring-blue-900" : "border-gray-200"}`}>
      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="font-bold text-gray-900 text-base shrink-0 w-8">{p.label}</div>
          <div className="flex-1 text-base text-gray-900 leading-snug">{p.prompt}</div>
          <div className="text-sm font-bold text-gray-500 shrink-0 whitespace-nowrap">[{p.marks} mark{p.marks > 1 ? "s" : ""}]</div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); toggle(i); }} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-900 text-white px-4 py-1.5 text-sm font-semibold hover:bg-blue-800">
          {open[i] ? <EyeOff size={16} /> : <Eye size={16} />} {open[i] ? "Hide answer" : "Show answer"}
        </button>
      </div>
      {open[i] && (
        <div className="border-t border-gray-200 bg-slate-50 px-5 py-4 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="flex-1 flex flex-col gap-1 text-base text-gray-900 leading-snug">
              {p.onDiagram ? <div className="text-sm font-semibold text-blue-900">Shown on the diagram{narrow ? " above" : ""}</div> : p.model.map((l, k) => <div key={k} style={{ whiteSpace: "pre-line" }}>{l}</div>)}
            </div>
            {((p.working && p.working.length > 0) || (p.explain && p.explain.length > 0)) && (
              <button onClick={(e) => { e.stopPropagation(); setActive(i); setWhy((w) => ({ ...w, [i]: !w[i] })); }} aria-label="Explain this answer" aria-pressed={!!why[i]} title="Show the step by step"
                className={`shrink-0 rounded-full ${why[i] ? "text-blue-900" : "text-gray-400 hover:text-blue-900"}`}><HelpCircle size={22} /></button>
            )}
          </div>
          {why[i] && p.working && p.working.length > 0 && <Working steps={p.working} at={stepAt[i] ?? 0} all={!!allSteps[i]}
            onAt={(n) => setStepAt((a) => ({ ...a, [i]: n }))} onAll={(v) => setAllSteps((a) => ({ ...a, [i]: v }))} />}
          {why[i] && !(p.working && p.working.length > 0) && p.explain && (
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

  // Back / Next between parts, and Show all answers, under the part in the one-part view
  const nav = (
    <div className="flex items-center justify-between gap-2">
      <button onClick={() => go(active - 1)} disabled={active === 0} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-blue-900 disabled:opacity-40"><ChevronLeft size={16} /> Back</button>
      <button onClick={revealAll} className="text-sm font-semibold text-blue-900 hover:underline">{allRevealed ? "Hide all answers" : "Show all answers"}</button>
      <button onClick={() => go(active + 1)} disabled={active === parts.length - 1} className="inline-flex items-center gap-1 rounded-lg bg-blue-900 text-white px-3 py-1.5 text-sm font-semibold disabled:opacity-40">Next <ChevronRight size={16} /></button>
    </div>
  );

  // the parts live in a box of their own: the one-part view scrolls its part but keeps Back / Next fixed at the bottom; All parts scrolls the whole list
  const scroller = (children: ReactNode) => <div className="flex-1 min-h-0 overflow-y-auto p-0.5 pr-1.5 flex flex-col gap-3">{children}</div>;
  const body = all ? scroller(parts.map(partCard)) : scroller(partCard(parts[active], active));

  return narrow ? (
    <div className="flex flex-col gap-3 p-3 pt-0">{picture}{header}{all ? <div className="flex flex-col gap-3">{parts.map(partCard)}</div> : <>{partCard(parts[active], active)}{nav}</>}</div>
  ) : (
    <div className="p-3 sm:p-6 grid gap-4 sm:gap-6 items-stretch" style={{ gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)", height: `calc(${STAGE_H} + 3rem)` }}>
      <div className="min-w-0 min-h-0">{picture}</div>
      <div className="flex flex-col gap-3 min-w-0 min-h-0">{header}{body}{!all && nav}</div>
    </div>
  );
}

// The working for a part, played as in Worked Example: one step at a time (earlier ones dimmed), Back / Next, or Show all.
function Working({ steps, at, all, onAt, onAll }: { steps: SolveStep[]; at: number; all: boolean; onAt: (n: number) => void; onAll: (v: boolean) => void }) {
  const idx = all ? steps.length - 1 : Math.min(at, steps.length - 1);
  return (
    <div className="rounded-lg border border-blue-200 bg-white px-4 py-3 flex flex-col gap-2">
      <div className="flex flex-col gap-2">
        {steps.slice(0, idx + 1).map((st, k) => (
          <div key={k} className="flex gap-2 text-sm text-gray-800 leading-snug" style={{ opacity: all || k === idx ? 1 : 0.5 }}>
            <span className="shrink-0 w-5 h-5 rounded-full bg-blue-900 text-white text-xs font-bold flex items-center justify-center mt-0.5">{k + 1}</span>
            <span style={{ whiteSpace: "pre-line" }}>{st.caption}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 pt-1">
        <button onClick={() => { onAll(false); onAt(Math.max(0, idx - 1)); }} disabled={idx === 0 && !all} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-blue-900 disabled:opacity-40"><ChevronLeft size={14} /> Back</button>
        <span className="text-xs font-semibold text-gray-500">Step {idx + 1} of {steps.length}</span>
        <button onClick={() => { onAll(false); onAt(Math.min(steps.length - 1, idx + 1)); }} disabled={idx >= steps.length - 1} className="inline-flex items-center gap-1 rounded-lg bg-blue-900 text-white px-2.5 py-1 text-xs font-semibold disabled:opacity-40">Next <ChevronRight size={14} /></button>
      </div>
      <button onClick={() => onAll(!all)} className="self-start text-xs font-semibold text-blue-900 hover:underline">{all ? "Step by step" : "Show all"}</button>
    </div>
  );
}
