import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./SolutionStepper.css";

/** Position 0 is the question, 1..n are working, and n+1 is the separate final answer. */
export function solutionProgress(count: number, hasAnswer: boolean, position: number, all = false) {
  const end = count + (hasAnswer ? 1 : 0);
  const at = Math.max(0, Math.min(end, position));
  return { at, end, open: end > 0 && (at > 0 || all), shown: all ? count : Math.min(at, count), answer: hasAnswer && (all || at > count) };
}
export function useSolutionStepper(count: number, hasAnswer: boolean) {
  const [position, setPosition] = useState(0);
  const [all, setAll] = useState(false);
  const progress = solutionProgress(count, hasAnswer, position, all);
  const reset = useCallback(() => { setPosition(0); setAll(false); }, []);
  const next = useCallback(() => { setAll(false); setPosition((p) => Math.min(count + (hasAnswer ? 1 : 0), p + 1)); }, [count, hasAnswer]);
  const previous = () => { setAll(false); setPosition(Math.max(0, progress.at - 1)); };
  const toggleAnswer = useCallback(() => { setAll(false); setPosition(progress.answer || !hasAnswer ? 0 : count + 1); }, [count, hasAnswer, progress.answer]);
  const toggleWorking = () => { if (progress.open) reset(); else setPosition(count ? 1 : hasAnswer ? 1 : 0); };
  const toggleAll = () => { if (!progress.open) setPosition(1); setAll((v) => !v); };
  return { ...progress, all, next, previous, reset, toggleAnswer, toggleWorking, toggleAll };
}
type SolutionStepperState = ReturnType<typeof useSolutionStepper>;

/** Presentational split used by authored and generated slide questions. The question remains the same DOM node
 *  as it moves from the centre to the right; the numbered cascade unfolds on the left. The API takes ReactNode
 *  content so maths, prose and diagnostic reasoning share the same reveal and navigation behaviour. */
export function SolutionStepper({ question, steps, answer, state, live, fontSize = 46, largeQuestion = false, questionFontSize, layout = "split", flip = false, picture }: {
  question: ReactNode; steps: ReactNode[]; answer: ReactNode; state: SolutionStepperState; live: boolean; fontSize?: number; largeQuestion?: boolean; questionFontSize?: number;
  /** `split` (full-width): the steps unfold beside the question. `stacked` (a workspace layout): only the ANSWER is revealed, under the question; pass no steps. */
  layout?: "split" | "stacked";
  /** `split` only: mirror it (steps on the right, question on the left). */
  flip?: boolean;
  /** `split` only: the developing picture. `undefined` has none (the question moves across as before); a node, or `null` for "not drawn yet", puts the question above the steps on one side and the picture on the other. */
  picture?: ReactNode | null;
}) {
  const list = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const B = live ? "button" : "span";
  useEffect(() => {
    const box = list.current, inner = content.current;
    if (!box || !inner || !state.open) return;
    let frame = 0;
    const follow = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const row = inner.querySelector<HTMLElement>('[data-current="true"]') ?? inner.lastElementChild as HTMLElement | null;
        if (!row) return;
        const target = row.offsetHeight > box.clientHeight ? row.offsetTop : row.offsetTop + row.offsetHeight - box.clientHeight + 16;
        box.scrollTo({ top: Math.max(0, target), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
      });
    };
    follow();
    const ro = new ResizeObserver(follow); ro.observe(inner); ro.observe(box);
    return () => { cancelAnimationFrame(frame); ro.disconnect(); };
  }, [state.at, state.all, state.open, state.shown, state.answer]);
  const vars = { "--solution-font": `${fontSize}px`, "--question-size": `${questionFontSize ?? fontSize * (largeQuestion ? 1.65 : 1)}px` } as CSSProperties;
  return <div className="solution-stepper" style={vars} data-solution-layout={layout} data-solution-flip={flip && layout === "split"} data-solution-picture={picture !== undefined && layout === "split"} data-solution-open={state.open} data-solution-all={state.all} onKeyDown={(e) => {
    if (!live || !state.open || !(e.target as HTMLElement).closest('[data-step-controls]')) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); e.stopPropagation(); if (e.key === "ArrowRight") state.next(); else state.previous(); }
  }}>
    <section className="solution-working" aria-label="Worked solution" aria-hidden={!state.open}>
      <div className="solution-heading"><span>{layout === "stacked" ? "Answer" : "Worked solution"}</span><span className="solution-position" aria-live={live ? "polite" : undefined}>{state.all ? "All steps" : state.answer ? "Answer" : `Step ${state.at} of ${steps.length}`}</span></div>
      <div ref={list} className="solution-list thin-scroll">
        <div ref={content} className="solution-timeline">
          {steps.slice(0, state.shown).map((step, i) => <div key={i} className="solution-row solution-enter" data-explanation="" data-step={i + 1} data-current={!state.all && !state.answer && i === state.shown - 1} data-past={!state.all && (state.answer || i < state.shown - 1)}>
            <span className="solution-marker">{i + 1}</span><div className="solution-row-content">{step}</div>
          </div>)}
          {state.answer && <div className="solution-row solution-answer solution-enter" data-answer="" data-current="true"><span className="solution-marker">A</span><div className="solution-row-content">{answer}</div></div>}
        </div>
      </div>
      {layout !== "stacked" && <div className="solution-controls" data-step-controls="">
        <div className="solution-nav">
          <B aria-label="Previous step" title="Previous step" className="solution-arrow" disabled={state.at === 0} onClick={state.previous}><ChevronLeft size="1.3em" /></B>
          <B className="solution-toggle" onClick={state.toggleAll} aria-pressed={state.all}>{state.all ? "Step-by-Step" : "Show all"}</B>
          <B aria-label="Next step" title="Next step" className="solution-arrow" disabled={!state.all && state.at >= state.end} onClick={state.next}><ChevronRight size="1.3em" /></B>
        </div>
      </div>}
    </section>
    {picture !== undefined && layout === "split" && <section className="solution-picture" aria-label="Developing picture">{picture}</section>}
    <section className="solution-question" aria-label="Question"><div className="solution-question-content">{question}</div></section>
  </div>;
}
