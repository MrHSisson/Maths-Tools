import { useState, useEffect, useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { WorkingStep, QOSnapshot } from "../types";
import { getStepBg } from "../colors";
import { MathRenderer } from "./MathRenderer";
import { SkillLabel } from "../skills";

// Shrinks a maths line that's wider than its card instead of letting it clip
// or force a horizontal scrollbar — width only, never grows past 1x, so a
// line that already fits (the overwhelming common case) renders identically
// to before. Mirrors ToolShell's private ScaleToFit (explicit flex centring +
// getBoundingClientRect, transform: scale) rather than touching that file —
// this only needs the width axis, for a free-flowing text line, not a bounded
// diagram box. Deliberately NOT scrollWidth: an inline-block wider than its
// container, centred only by inherited text-align, overflows on BOTH sides —
// scrollWidth only counts the right-hand excess, undershooting the true
// overflow and computing too large a scale. Explicit flex centring avoids
// that relative-to-what-origin ambiguity entirely.
const FitWidth = ({ children }: { children: ReactNode }) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const outer = outerRef.current, inner = innerRef.current;
    if (!outer || !inner) return;
    let raf = 0;
    const recompute = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const o = outerRef.current, n = innerRef.current;
        if (!o || !n) return;
        const availW = o.clientWidth;
        const prevTransform = n.style.transform;
        n.style.transform = "none";
        const natW = n.getBoundingClientRect().width;
        n.style.transform = prevTransform;
        if (!natW || !availW) return;
        const s = Math.min(1, availW / natW);
        setScale((cur) => (Math.abs(cur - s) > 0.01 ? s : cur));
      });
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(outer); ro.observe(inner);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  });
  return (
    <div ref={outerRef} style={{ width: "100%", overflow: "hidden", display: "flex", justifyContent: "center" }}>
      <div ref={innerRef} style={{ transform: `scale(${scale})`, transformOrigin: "center top", flexShrink: 0 }}>
        {children}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// WorkedExampleSteps — the working-step viewer every tool's "Worked Example" mode
// renders through. Pulled out of ToolShell so it's the SAME component both a real
// tool and the Technique Library preview use — what you see previewing a
// technique is pixel-for-pixel what a teacher sees in the real tool, not a
// separate mockup that can drift out of sync.
//
// Owns its own step-by-step navigation state internally (step index and
// fragment index). Step-by-Step vs Show All persists across a reset (matching
// the original behaviour: picking a new question kept your view preference,
// only your position in it reset) — bump `resetKey` (e.g. the question's key,
// or a counter) whenever the caller wants position reset back to the start.
// ═══════════════════════════════════════════════════════════════════════════════

export interface WorkedExampleStepsProps {
  working: WorkingStep[];
  /** Renders the final answer box's content. */
  renderAnswer: () => ReactNode;
  colorScheme: string;
  /** Tailwind text-size class applied to the answer box, e.g. "text-3xl". */
  answerFontClass: string;
  stepRenderer?: (step: WorkingStep, colorScheme: string, qo?: QOSnapshot) => JSX.Element | null;
  qoSnapshot?: QOSnapshot;
  /** Gates whether Step-by-Step (one beat at a time) is reachable at all —
   *  ToolShell passes its devMode flag; a preview surface can pass true always. */
  stepThroughEnabled: boolean;
  onOpenSkill?: (id: string) => void;
  /** Changing this resets step/fragment position back to the start (Step-by-Step
   *  vs Show All is left alone). Pass something that changes whenever `working`
   *  represents a genuinely new example — a question's key, a technique+grain
   *  pair, or an incrementing counter. */
  resetKey: string | number;
  /** Step-by-Step's card layout. "single" (default) replaces the card each
   *  press — every live tool today, laid out inline (no internal scrolling —
   *  the page/panel around it scrolls, exactly as before this prop existed).
   *  "stacked" builds a vertical list instead, like Show All arrived at one
   *  press at a time: earlier steps stay visible (dimmed), the current one is
   *  highlighted. Because that list can grow taller than its container,
   *  "stacked" owns its own bounded, internally-scrolling layout with the nav
   *  pinned as a fixed footer — give it a parent with a real height (flex
   *  child, or an explicit height) for that to size correctly. Exploratory —
   *  not wired into any real tool yet, only the Technique Library preview.
   */
  layout?: "single" | "stacked";
}

export const WorkedExampleSteps = ({
  working, renderAnswer, colorScheme, answerFontClass, stepRenderer, qoSnapshot,
  stepThroughEnabled, onOpenSkill, resetKey, layout = "single",
}: WorkedExampleStepsProps) => {
  const [steppedMode, setSteppedMode] = useState(true);
  const [stepIdx, setStepIdx] = useState(0);
  const [fragIdx, setFragIdx] = useState(0);
  // Stacked layout only: the current card (or the answer box) scrolls itself
  // into view within the internal scroll body whenever it changes.
  const activeRef = useRef<HTMLDivElement>(null);

  const stepBg = getStepBg(colorScheme);
  const totalSteps = working.length;
  const stepped = stepThroughEnabled && steppedMode;
  const atAnswer = stepIdx >= totalSteps;
  const canPrev = stepIdx > 0 || fragIdx > 0;
  const canNext = stepIdx <= totalSteps;

  // Toggling Step-by-Step/Show All always restarts at the beginning, matching
  // the reset ToolShell used to do by hand on the same button press.
  useEffect(() => { setStepIdx(0); setFragIdx(0); }, [stepped]);
  // A genuinely new example (new question, or a reformat that keeps the same
  // question key but changes the working) also restarts position.
  useEffect(() => { setStepIdx(0); setFragIdx(0); }, [resetKey]);
  // Stacked layout: whenever the current card changes (a new step arrives, or
  // we land on the answer), bring it fully into view — it's always the last
  // thing in the scroll body, so aligning its bottom edge to the bottom of the
  // scrollport ("end") is what actually reaches the very bottom; "nearest"
  // stops short whenever the card itself is taller than the visible area.
  // Plain useEffect deliberately, NOT useLayoutEffect: MathRenderer paints its
  // KaTeX into the DOM from its own useEffect, and React runs every
  // useLayoutEffect in the tree before any useEffect runs anywhere. A layout
  // effect here would measure the new step while its maths is still an empty,
  // unsized span, undershooting the scroll. A plain effect fires in the same
  // (passive-effect) phase as MathRenderer's, and — child effects before
  // parent effects — MathRenderer (nested inside this component) has already
  // rendered by the time this one runs, so the measurement is accurate.
  useEffect(() => {
    if (layout !== "stacked" || !stepped) return;
    const el = activeRef.current;
    if (!el) return;
    el.style.scrollMarginBottom = "16px";
    el.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [stepIdx, layout, stepped]);

  const fragsOf = (s: WorkingStep | undefined): string[] | null =>
    s?.frags && s.frags.length > 1 ? s.frags : null;

  const goNextBeat = () => {
    if (atAnswer) return;
    const frags = fragsOf(working[stepIdx]);
    if (frags && fragIdx < frags.length - 1) { setFragIdx(i => i + 1); return; }
    setStepIdx(i => i + 1);
    setFragIdx(0);
  };
  const goPrevBeat = () => {
    if (fragIdx > 0) { setFragIdx(i => i - 1); return; }
    if (stepIdx === 0) return;
    const prevFrags = fragsOf(working[stepIdx - 1]);
    setStepIdx(i => i - 1);
    setFragIdx(prevFrags ? prevFrags.length - 1 : 0);
  };
  const jumpToStep = (i: number) => { setStepIdx(i); setFragIdx(0); };

  // The maths line of a step. When fragments exist and `reveal` is given
  // (stepped mode, current card), all fragments are laid out immediately and
  // hidden ones sit at opacity 0 — the line never reflows as it builds, and
  // stepping backwards is exact.
  const stepMaths = (s: WorkingStep, reveal?: number) => {
    const frags = fragsOf(s);
    if (!frags || reveal === undefined) return <><MathRenderer latex={s.latex} />{s.unit && <span> {s.unit}</span>}</>;
    return (
      <span style={{ display: "inline-flex", alignItems: "baseline", gap: "0.45em", flexWrap: "wrap", justifyContent: "center" }}>
        {frags.map((f, fi) => (
          <span key={fi} style={{ opacity: fi <= reveal ? 1 : 0, transition: "opacity 0.35s ease" }}>
            <MathRenderer latex={f} />
          </span>
        ))}
        {s.unit && <span style={{ opacity: reveal >= frags.length - 1 ? 1 : 0, transition: "opacity 0.35s ease" }}> {s.unit}</span>}
      </span>
    );
  };

  // `stacked` renders a step at ~90% of its normal size — used for every step
  // in the stacked layout, current and past alike. Size no longer marks a
  // step as "past" (only opacity, plus the ring on the current one, do — see
  // stackedSteps), so nothing resizes as you step forward/backward, it just
  // fades. Applied via inline-style overrides rather than swapped Tailwind
  // classes so the unstacked path is untouched pixel-for-pixel — every live
  // tool's single card, and Show All, keep rendering through the exact same
  // classes as before this existed.
  const renderStep = (s: WorkingStep, i: number, reveal?: number, stacked?: boolean) => {
    const custom = stepRenderer ? stepRenderer(s, colorScheme, qoSnapshot) : null;
    return (
      <div key={i} className="rounded-xl p-6" style={{ backgroundColor: stepBg, ...(stacked ? { padding: "1.35rem" } : null) }}>
        <h4 className="text-xl font-bold mb-2" style={{ color: "#000", ...(stacked ? { fontSize: "1.125rem", lineHeight: "1.575rem", marginBottom: "0.45rem" } : null) }}>Step {i + 1}</h4>
        <div className="text-2xl" style={{ color: "#000", ...(stacked ? { fontSize: "1.35rem", lineHeight: "1.8rem" } : null) }}>
          {custom ?? (s.type === "tStep"
            ? <span><SkillLabel text={s.plain} onOpenSkill={onOpenSkill} /></span>
            : s.type === "mStep"
              ? <div className="flex flex-col gap-1">
                  <span className="text-left"><SkillLabel text={s.label ?? ""} onOpenSkill={onOpenSkill} /></span>
                  <div className="text-center"><FitWidth>{stepMaths(s, reveal)}</FitWidth></div>
                </div>
              : <div className="text-center"><FitWidth>{stepMaths(s, reveal)}</FitWidth></div>
          )}
        </div>
      </div>
    );
  };

  const navArrowStyle = (enabled: boolean): React.CSSProperties => ({
    background: enabled ? "#1e3a8a" : "rgba(0,0,0,0.08)",
    color: enabled ? "#fff" : "#9ca3af",
    border: "none", borderRadius: 12, cursor: enabled ? "pointer" : "not-allowed",
    width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
    opacity: enabled ? 1 : 0.4, transition: "background 0.15s",
  });

  const steppedToggle = (
    <button onClick={() => setSteppedMode(m => !m)}
      className="px-4 py-1.5 rounded-lg font-bold text-sm transition-colors border-2"
      style={{
        background: steppedMode ? "#1e3a8a" : "#fff",
        color: steppedMode ? "#fff" : "#6b7280",
        borderColor: steppedMode ? "#1e3a8a" : "#d1d5db",
      }}>
      {steppedMode ? "Step-by-Step" : "Show All"}
    </button>
  );

  // Stacked layout: every step (current and past) renders at the same ~90%
  // "stacked" size — only opacity, plus the ring on the current one, mark it
  // as past, so nothing resizes as the list grows or you step back through it.
  const stackedSteps = (upTo: number, activeReveal: number) => (
    <div className="space-y-2">
      {working.slice(0, upTo + 1).map((s, i) => {
        const isCurrent = i === upTo;
        return (
          <div key={i} ref={isCurrent ? activeRef : undefined} style={{
            opacity: isCurrent ? 1 : 0.7,
            transition: "opacity 0.3s ease",
            borderRadius: 12,
            boxShadow: isCurrent ? "0 0 0 2px #1e3a8a" : "none",
          }}>
            {renderStep(s, i, isCurrent ? activeReveal : undefined, true)}
          </div>
        );
      })}
    </div>
  );

  // `stacked` matches the answer's font size to the ~90% "stacked" size used
  // by renderStep's cards, instead of the caller's answerFontClass (e.g. the
  // production text-3xl) — only used in the stacked layout's answer view, so
  // every other caller (every live tool, Show All) is unaffected.
  const answerBox = (extraClass: string, ref?: React.Ref<HTMLDivElement>, stacked?: boolean) => (
    <div ref={ref} className={`rounded-xl p-6 text-center ${extraClass}`} style={{ backgroundColor: stepBg }}>
      <div className={stacked ? "font-bold" : `${answerFontClass} font-bold`} style={{ color: "#166534", ...(stacked ? { fontSize: "1.35rem" } : null) }}>
        <FitWidth>{renderAnswer()}</FitWidth>
      </div>
    </div>
  );

  if (stepped) {
    const navRow = (
      <div className="flex items-center justify-between">
        <button style={navArrowStyle(canPrev)} onClick={() => canPrev && goPrevBeat()}>
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-500">
            {atAnswer ? "Answer" : `Step ${stepIdx + 1} of ${totalSteps}`}
          </span>
          {steppedToggle}
        </div>
        <button style={navArrowStyle(canNext && !atAnswer)} onClick={() => canNext && !atAnswer && goNextBeat()}>
          <ChevronRight size={24} />
        </button>
      </div>
    );
    const dotStrip = (
      <div className="flex justify-center gap-2">
        {Array.from({ length: totalSteps + 1 }, (_, i) => (
          <button key={i} onClick={() => jumpToStep(i)}
            style={{
              width: i === totalSteps ? 24 : 10, height: 10, borderRadius: 5, border: "none", cursor: "pointer",
              background: i === stepIdx ? "#1e3a8a" : "#d1d5db", transition: "background 0.15s",
            }}
            title={i === totalSteps ? "Answer" : `Step ${i + 1}`}
          />
        ))}
      </div>
    );

    if (layout === "stacked") {
      // Bounded-height column: scrollable body on top, nav fixed as a footer
      // underneath it — always visible, never requires scrolling down to
      // reach "Next" or up to see where you are. Needs a parent that gives it
      // real height (a flex child works, see the prop doc above).
      return (
        <div className="flex flex-col" style={{ height: "100%", minHeight: 0 }}>
          <div className="flex-1 overflow-y-auto p-1" style={{ minHeight: 0 }}>
            {!atAnswer ? stackedSteps(stepIdx, fragIdx) : (
              <div className="space-y-2">
                <div className="space-y-2" style={{ opacity: 0.7 }}>
                  {working.map((s, i) => renderStep(s, i, undefined, true))}
                </div>
                {answerBox("", activeRef, true)}
              </div>
            )}
          </div>
          <div className="flex-shrink-0 pt-4 mt-4 border-t" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
            {navRow}
            <div className="mt-3">{dotStrip}</div>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="mt-6 mb-4">{navRow}</div>
        {!atAnswer ? (
          <div className="space-y-4">
            {renderStep(working[stepIdx], stepIdx, fragIdx)}
          </div>
        ) : answerBox("")}
        <div className="mt-4">{dotStrip}</div>
      </>
    );
  }

  return (
    <>
      {stepThroughEnabled && (
        <div className="flex justify-end mt-6 mb-4">
          {steppedToggle}
        </div>
      )}
      <div className="space-y-4">
        {working.map((s, i) => renderStep(s, i))}
      </div>
      {answerBox("mt-4")}
    </>
  );
};
