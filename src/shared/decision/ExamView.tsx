import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Eye, EyeOff, HelpCircle } from "lucide-react";
import type { DecisionProblem, ExamPart, SolveStep } from "./types";
import { STAGE_H, STAGE_H_TABLET } from "./layout";
import StepCascade from "./StepCascade";

// ═══════════════════════════════════════════════════════════════════════════
// ExamView — an exam-style question: the picture, the context, then lettered parts each with its marks.
// One part at a time by default (a strip of part tabs, Back / Next), with an "All parts" switch for the whole question in a
// scrolling list. A part's answer is revealed on request: just the answer with its marks listed under it, and a (?) for the
// step by step. The picture is pinned in view and shows the open part's own working. Nothing typed is checked or scored.
// A new question remounts it (key = exam.id), so revealed answers and the chosen part reset.
// ═══════════════════════════════════════════════════════════════════════════

const CODE_TONE: Record<string, string> = { B: "#1e3a8a", M: "#7c3aed", A: "#166534", E: "#b45309", R: "#b45309" };

export default function ExamView({ problem, shown, footer, narrow, tablet, onPractise }: {
  problem: DecisionProblem;
  shown: (st: SolveStep | undefined) => ReactNode;
  footer?: ReactNode;
  narrow: boolean;
  /** a tablet keeps the shorter working area (the laptop one fills the window) */
  tablet?: boolean;
  /** "Practise this": go to the tab (and options) where this part's skill is drilled */
  onPractise?: (target: { subTool: string; options?: Record<string, string> }) => void;
}) {
  const exam = problem.exam!;
  const parts = exam.parts;
  const [open, setOpen] = useState<boolean[]>(() => parts.map(() => false));
  const [why, setWhy] = useState<Record<number, boolean>>({});
  const [stepAt, setStepAt] = useState<Record<number, number>>({});   // the working step each part has reached (0-based)
  const [active, setActive] = useState(0);
  const [all, setAll] = useState(false);
  const [showAllSteps, setShowAllSteps] = useState(false); // the working panel: every step at once instead of one at a time
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  const toggle = (i: number) => { setOpen((o) => o.map((v, k) => (k === i ? !v : v))); setActive(i); };
  const allRevealed = open.every(Boolean);
  const revealAll = () => { setOpen(parts.map(() => !allRevealed)); if (!allRevealed) setActive(parts.length - 1); };
  const go = (i: number) => {
    setActive(i);
    if (all) cardRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };
  useEffect(() => { if (!all) cardRefs.current[active]?.scrollIntoView({ block: "nearest" }); }, [all]); // eslint-disable-line react-hooks/exhaustive-deps -- deliberate: scroll to the open part only when switching view, not whenever the open part changes

  // the picture: the working step being read, else the open part's own answer figure
  const playing = open[active] && why[active] ? parts[active].working : undefined;
  const view = open[active] ? parts[active].view : undefined;
  const stepView = open[active] ? parts[active].stepView : undefined;
  const step: SolveStep | undefined = playing && playing.length
    ? playing[Math.min(stepAt[active] ?? 0, playing.length - 1)]
    : stepView ? stepView
    : view ? { caption: "", edgeStates: {}, flowView: view as SolveStep["flowView"] }
    : parts[active]?.figure ? { caption: "", edgeStates: {}, flowView: parts[active].figure!.view as SolveStep["flowView"] } : undefined;
  // a question with two figures names the one on screen
  const twoFigures = parts.some((x) => x.figure);
  const figureName = twoFigures ? (parts[active]?.figure?.label ?? "Figure 1") : "";

  // the context sits with the picture (it only sets the scene), so the right-hand side is all parts
  const context = (
    <div className="shrink-0 flex flex-col gap-1">
      <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Exam question · {exam.totalMarks} mark{exam.totalMarks === 1 ? "" : "s"} · about {exam.minutes} min</div>
      <p className="text-sm font-semibold text-gray-900 leading-snug">{exam.intro}</p>
    </div>
  );
  // the picture stays in view whatever the parts below do (sticky), so a long answer or a long list never leaves it behind
  const picture = (
    <div className={`flex flex-col gap-2 min-w-0 ${narrow ? "sticky top-0 z-20 bg-[#f8f9fb] pb-2 -mx-3 px-3" : "h-full min-h-0"}`}>
      {!narrow && context}
      <div className={`relative rounded-xl border border-gray-200 bg-white overflow-hidden ${narrow ? "" : "flex-1 min-h-0"}`} style={narrow ? { height: "32dvh", minHeight: 190 } : { minHeight: 300 }}>
        {shown(step)}
        {figureName && <span className="absolute top-2 left-2 rounded-md bg-blue-900 text-white text-xs font-bold px-2 py-0.5">{figureName}</span>}
      </div>
      {footer && <div className="flex justify-center">{footer}</div>}
    </div>
  );

  // the question's own card: what it is, the context, the part tabs and the one-part / all-parts switch
  // one slim row: show the parts one at a time or all together, and the answers
  const header = (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 shrink-0">
      <div className="flex items-center gap-0.5 rounded-lg bg-slate-200/60 p-0.5 text-sm font-semibold">
        <button onClick={() => setAll(false)} className={`px-3 py-1 rounded-md ${!all ? "bg-white text-blue-900 shadow-sm" : "text-slate-600"}`}>Show individually</button>
        <button onClick={() => setAll(true)} className={`px-3 py-1 rounded-md ${all ? "bg-white text-blue-900 shadow-sm" : "text-slate-600"}`}>Show all parts</button>
      </div>
      <div className="flex items-center gap-3 text-xs font-semibold">
        {!all && <span className="text-gray-500">Part {active + 1} of {parts.length}</span>}
        {all && <button onClick={revealAll} className="text-sm text-blue-900 hover:underline">{allRevealed ? "Hide all answers" : "Show all answers"}</button>}
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
        {all && (
          <button onClick={(e) => { e.stopPropagation(); toggle(i); }} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-900 text-white px-4 py-1.5 text-sm font-semibold hover:bg-blue-800">
            {open[i] ? <EyeOff size={16} /> : <Eye size={16} />} {open[i] ? "Hide answer" : "Show answer"}
          </button>
        )}
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
            {p.practise && onPractise && (
              <button onClick={(e) => { e.stopPropagation(); onPractise(p.practise!); }} className="mt-1 self-start text-sm font-semibold text-blue-900 hover:underline">Practise this</button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // the action bar sits at the foot of the parts, always in the same place: Back · Show / Hide answer · Next
  const nav = (
    <div className="flex items-center gap-2 shrink-0">
      <button onClick={() => go(active - 1)} disabled={active === 0} aria-label="Previous part" className="w-12 h-12 shrink-0 rounded-xl border-2 border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-40"><ChevronLeft size={24} /></button>
      <button onClick={() => toggle(active)} className="flex-1 h-12 rounded-xl bg-blue-900 text-white font-bold text-base flex items-center justify-center gap-2 hover:bg-blue-800">
        {open[active] ? <EyeOff size={18} /> : <Eye size={18} />} {open[active] ? "Hide answer" : "Show answer"}
      </button>
      <button onClick={() => go(active + 1)} disabled={active === parts.length - 1} aria-label="Next part" className="w-12 h-12 shrink-0 rounded-xl border-2 border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-40"><ChevronRight size={24} /></button>
    </div>
  );

  // the (?) takes over the whole right-hand side: the part's question for reference, then its working in the same auto-scrolling cascade as everywhere else
  const wp = parts[active];
  const wSteps = wp.working ?? [];
  const workingOpen = !!(open[active] && why[active] && wSteps.length > 0);
  const hasAnswer = !wp.onDiagram && wp.model.length > 0;
  const beats = wSteps.length + (hasAnswer ? 1 : 0);
  const wAt = Math.min(stepAt[active] ?? 0, Math.max(0, beats - 1));
  const setWAt = (n: number) => setStepAt((a) => ({ ...a, [active]: Math.max(0, Math.min(beats - 1, n)) }));
  const lastBeat = wAt >= beats - 1;
  const closeWorking = () => { setWhy((w) => ({ ...w, [active]: false })); setShowAllSteps(false); };
  const workingPanel = workingOpen ? (
    <div className={`flex flex-col gap-3 min-w-0 ${narrow ? "" : "min-h-0 flex-1"}`} style={narrow ? { height: "62dvh", minHeight: 360 } : undefined}>
      <div className="shrink-0 flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5">
        <button onClick={closeWorking} className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1 text-sm font-semibold text-blue-900 hover:bg-slate-50"><ChevronLeft size={16} /> Question</button>
        <div className="min-w-0 text-sm text-gray-900 leading-snug"><b className="mr-2">{wp.label}</b><span className="line-clamp-2">{wp.prompt}</span></div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="shrink-0 px-5 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Working</div>
        <div className="relative flex-1 min-h-0">
          <div className="absolute inset-0">
            <StepCascade steps={wSteps} idx={showAllSteps ? wSteps.length - 1 : Math.min(wAt, wSteps.length - 1)} answer={hasAnswer && (showAllSteps || wAt >= wSteps.length) ? wp.model.join("\n") : null} all={showAllSteps} big />
          </div>
        </div>
        <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-4 py-3 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <button onClick={() => { setShowAllSteps(false); setWAt(wAt - 1); }} disabled={wAt === 0 && !showAllSteps} aria-label="Previous step" className="w-12 h-12 shrink-0 rounded-xl border-2 border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-40"><ChevronLeft size={22} /></button>
            <button onClick={() => { if (showAllSteps || lastBeat) closeWorking(); else setWAt(wAt + 1); }} className="flex-1 h-12 rounded-xl bg-blue-900 text-white font-bold text-base flex items-center justify-center gap-2 hover:bg-blue-800">
              {showAllSteps || lastBeat ? "Back to the question" : <>Next step <ChevronRight size={20} /></>}
            </button>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm font-semibold text-gray-500">
            <span>Step {showAllSteps ? beats : wAt + 1} of {beats}</span>
            <button onClick={() => setShowAllSteps(!showAllSteps)} className="text-blue-900 hover:underline">{showAllSteps ? "Step by step" : "Show all"}</button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  // the parts live in a box of their own: the one-part view scrolls its part but keeps Back / Next fixed at the bottom; All parts scrolls the whole list
  const scroller = (children: ReactNode) => <div className="flex-1 min-h-0 overflow-y-auto p-0.5 pr-1.5 flex flex-col gap-3">{children}</div>;
  const body = all ? scroller(parts.map(partCard)) : scroller(partCard(parts[active], active));

  return narrow ? (
    <div className="flex flex-col gap-3 p-3 pt-1">{context}{picture}{workingPanel ?? <>{header}{all ? <div className="flex flex-col gap-3">{parts.map(partCard)}</div> : <>{partCard(parts[active], active)}{nav}</>}</>}</div>
  ) : (
    <div className="p-3 sm:p-4 grid gap-4 sm:gap-5 items-stretch grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:h-[calc(var(--stage)+2rem)]" style={{ ["--stage" as string]: tablet ? STAGE_H_TABLET : STAGE_H }}>
      <div className="min-w-0 h-[46dvh] min-h-[300px] lg:min-h-0 lg:h-auto self-stretch">{picture}</div>
      <div className="flex flex-col gap-3 min-w-0 min-h-0">{workingPanel ?? <>{header}{body}{!all && nav}</>}</div>
    </div>
  );
}
