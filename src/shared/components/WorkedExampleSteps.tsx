import { useState, useEffect, useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { WorkingStep, QOSnapshot } from "../types";
import { getStepBg } from "../colors";
import { MathRenderer } from "./MathRenderer";
import { SkillLabel } from "../skills";
import { ScaleToFit } from "./ScaleToFit";

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
export const FitWidth = ({ children }: { children: ReactNode }) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [natH, setNatH] = useState(0);
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
        const box = n.getBoundingClientRect();
        const natW = box.width;
        n.style.transform = prevTransform;
        if (!natW || !availW) return;
        const s = Math.min(1, availW / natW);
        setScale((cur) => (Math.abs(cur - s) > 0.01 ? s : cur));
        setNatH((cur) => (Math.abs(cur - box.height) > 1 ? box.height : cur));
      });
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(outer); ro.observe(inner);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  });
  return (
    // When scaled down, shrink the box to the scaled height too, so no blank gap is left below.
    <div ref={outerRef} style={{ width: "100%", overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "flex-start", ...(scale < 1 && natH ? { height: natH * scale } : null) }}>
      <div ref={innerRef} style={{ transform: `scale(${scale})`, transformOrigin: "center top", flexShrink: 0 }}>
        {children}
      </div>
    </div>
  );
};

// Stacked layout only: the one card that just newly entered the list (as
// opposed to every earlier card, which was already on screen and only has
// its opacity/ring prop change smoothly on its own). A React `key` that
// hasn't rendered before mounts fresh with no "previous style" to transition
// from, so a plain style prop can't animate its arrival — it would just pop
// in at full opacity instantly, which is the "clunky" jump a fresh card
// arriving currently has. This starts every new mount below its resting
// state (faded) and flips to resting on the next frame, so the transition
// has a real from→to to animate across. Pure opacity, no accompanying
// motion — a slide read as busy alongside the fade, so this leans all the
// way into "fade" rather than "fade + slide". Height is unaffected either
// way, so nothing else reflows as it fades in — the auto-scroll compensation
// effect elsewhere in this file still sees the same footer displacement.
const EnterCard = ({ children, style }: { children: ReactNode; style?: React.CSSProperties }) => {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div style={{
      ...style,
      opacity: entered ? 1 : 0,
      transition: "opacity 0.9s ease",
    }}>
      {children}
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
  /** `reveal` is the fragment index showing on the current card (undefined = show everything: past steps, Show All), so a
   *  custom renderer can build itself up one beat at a time like a fragment-authored step. */
  stepRenderer?: (step: WorkingStep, colorScheme: string, qo?: QOSnapshot, reveal?: number) => JSX.Element | null;
  /** Visual-only renderer for steps whose working is an evolving picture (see ToolShellProps). */
  stepVisualRenderer?: (step: WorkingStep, colorScheme: string, qo?: QOSnapshot) => JSX.Element | null | false;
  /** With a `stepVisualRenderer`: keep every step's full working (its maths) in the list beside the
   *  picture instead of reducing the list to captions — for tools whose steps are equations and the
   *  picture (a graph) builds up alongside them. */
  keepWorking?: boolean;
  /** Where the picture sits: beside the steps (default) or above them, full width — for a wide, short
   *  picture such as a number line that is unreadable squeezed into a half-width panel. */
  visualPlacement?: "side" | "top";
  qoSnapshot?: QOSnapshot;
  /** Gates whether Step-by-Step (one beat at a time) is reachable at all.
   *  ToolShell and the preview surfaces pass true; false leaves Show All only. */
  stepThroughEnabled: boolean;
  onOpenSkill?: (id: string) => void;
  /** Changing this resets step/fragment position back to the start (Step-by-Step
   *  vs Show All is left alone). Pass something that changes whenever `working`
   *  represents a genuinely new example — a question's key, a technique+grain
   *  pair, or an incrementing counter. */
  resetKey: string | number;
  /** Step-by-Step's card layout. "single" (default) replaces the card each
   *  press — laid out inline, no internal scrolling; the page/panel around
   *  it scrolls. "stacked" builds a vertical list instead, like Show All
   *  arrived at one press at a time: earlier steps stay visible (dimmed),
   *  the current one is highlighted. It grows and shrinks with the list's
   *  own natural height — no forced/bounded parent height, so a short
   *  example (most techniques) never leaves a tall empty gap below the
   *  cards. The nav footer sits right after the last card and moves down
   *  the page as the list grows; the window-scroll-compensation effect
   *  below keeps it visually anchored instead of a pinned/internally-
   *  scrolling box. Used by Surds and the Technique Library preview. */
  layout?: "single" | "stacked";
  /** When true, there is no separate terminal "Answer" beat/card after the
   *  last working step — Step-by-Step ends on the last step itself (no extra
   *  dot, Next disables there) and Show All doesn't render a trailing answer
   *  box either. Use this when the last working step already states the
   *  final result and the caller has no genuinely separate answer to show
   *  (e.g. a technique preview, whose only data is a list of working steps)
   *  — otherwise the same content shows twice. Defaults to false, so every
   *  existing caller (every live tool, which has a real, distinct answer)
   *  is unaffected. renderAnswer/answerFontClass are simply never invoked
   *  when this is true. */
  hideAnswerStep?: boolean;
  /** Shrinks each step card's own text/padding further than even the
   *  "stacked" layout's own reduced size — for ToolShell's narrow-viewport
   *  layout, where the desktop/whiteboard-sized step text reads too large
   *  next to the rest of the compact chrome. Independent of `layout`/the
   *  internal `stacked` sizing: applies to every rendering path (Show All,
   *  single-step navigation, and stacked), and takes priority over the
   *  "stacked" size when both apply. Defaults to false — every existing
   *  (desktop) caller is unaffected. */
  compact?: boolean;
  /** Fullscreen worked example (ToolShell's fullscreen mode): the component fills the height it is given — the steps
   *  scroll inside it (following the current step), the Back / Next controls stay pinned at the foot — and
   *  everything is set larger for reading from the back of a room. Ignored with `compact`. */
  fullscreen?: boolean;
}

export const WorkedExampleSteps = ({
  working, renderAnswer, colorScheme, answerFontClass, stepRenderer, stepVisualRenderer, keepWorking = false, visualPlacement = "side", qoSnapshot,
  stepThroughEnabled, onOpenSkill, resetKey, layout = "single", hideAnswerStep = false, compact = false, fullscreen = false,
}: WorkedExampleStepsProps) => {
  const big = fullscreen && !compact;
  const [steppedMode, setSteppedMode] = useState(true);
  const [stepIdx, setStepIdx] = useState(0);
  const [fragIdx, setFragIdx] = useState(0);
  // Stacked layout only: the footer (nav + dot strip) sits after the growing
  // card list, so — since nothing here actually gets its own internal scroll
  // in practice; the page itself grows and scrolls instead — pressing Next
  // pushes the footer further down the page each time. prevFooterTop records
  // where the footer was immediately before a press; the effect below then
  // scrolls the window by exactly how far the footer moved, so it stays put
  // on screen instead of creeping downward (or off the bottom) as the stack
  // grows, and scrolls back up by the same logic when a press shrinks it.
  const footerRef = useRef<HTMLDivElement>(null);
  // Evolving-visual layout: the captions live in a fixed-height scroll area beside the visual (so the
  // page never grows). It follows the current step, and fades out at the top once older steps scroll away.
  const listRef = useRef<HTMLDivElement>(null);
  // Fullscreen: the scrolling area that holds the whole step list (when there is no side picture with its own list).
  const fsScrollRef = useRef<HTMLDivElement>(null);
  const [listScrolled, setListScrolled] = useState(false);
  const prevFooterTop = useRef<number | null>(null);
  const captureFooterTop = () => {
    if (layout === "stacked" && footerRef.current) {
      prevFooterTop.current = footerRef.current.getBoundingClientRect().top;
    }
  };

  const stepBg = getStepBg(colorScheme);
  const totalSteps = working.length;
  const stepped = stepThroughEnabled && steppedMode;

  const fragsOf = (s: WorkingStep | undefined): string[] | null =>
    s?.frags && s.frags.length > 1 ? s.frags : null;

  const atAnswer = !hideAnswerStep && stepIdx >= totalSteps;
  const canPrev = stepIdx > 0 || fragIdx > 0;
  const currentFrags = fragsOf(working[stepIdx]);
  const hasMoreFragsHere = !!currentFrags && fragIdx < currentFrags.length - 1;
  // With no separate Answer beat, Next disables once the last step's
  // fragments are exhausted instead of once an Answer state is reached.
  const canNext = hideAnswerStep ? (stepIdx < totalSteps - 1 || hasMoreFragsHere) : stepIdx <= totalSteps;

  // Toggling Step-by-Step/Show All always restarts at the beginning, matching
  // the reset ToolShell used to do by hand on the same button press.
  useEffect(() => { setStepIdx(0); setFragIdx(0); }, [stepped]);
  // Keep the caption list scrolled to the current step (the last card), smoothly.
  useEffect(() => {
    for (const el of [listRef.current, fsScrollRef.current]) if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [stepIdx, fragIdx, stepped]);
  // A genuinely new example (new question, or a reformat that keeps the same
  // question key but changes the working) also restarts position.
  useEffect(() => { setStepIdx(0); setFragIdx(0); }, [resetKey]);
  // Stacked layout: compensate for whatever the footer just got displaced by.
  // captureFooterTop() (called from each nav press below) records the
  // footer's position beforehand; once the press's new content has painted,
  // this measures where the footer ended up and scrolls the window by
  // exactly that delta — the footer lands back where it was, same idea as
  // "if the button drops 500px, scroll 500px", symmetric for growing forward
  // and shrinking back. Plain useEffect deliberately, NOT useLayoutEffect:
  // MathRenderer paints its KaTeX into the DOM from its own useEffect, and
  // React runs every useLayoutEffect in the tree before any useEffect runs
  // anywhere. A layout effect here would measure the footer before the new
  // step's maths has painted, undershooting the true displacement. A plain
  // effect fires in the same (passive-effect) phase as MathRenderer's, and —
  // child effects before parent effects — MathRenderer (nested inside this
  // component) has already rendered by the time this one runs, so the
  // measurement is accurate.
  useEffect(() => {
    if (layout !== "stacked" || !stepped || fullscreen) return;
    if (prevFooterTop.current === null || !footerRef.current) return;
    const delta = footerRef.current.getBoundingClientRect().top - prevFooterTop.current;
    prevFooterTop.current = null;
    if (Math.abs(delta) > 0.5) window.scrollBy({ top: delta, behavior: "smooth" });
  }, [stepIdx, fragIdx, layout, stepped, fullscreen]);

  // Fullscreen: ← / → / Space step the working (never while typing, never with a modifier).
  const keyRef = useRef({ next: () => {}, prev: () => {} });
  useEffect(() => {
    if (!fullscreen || !stepped) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.ctrlKey || e.metaKey || e.altKey || (t && /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(t.tagName) && e.key === " ")) return;
      if (t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) return;
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); keyRef.current.next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); keyRef.current.prev(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen, stepped]);

  const goNextBeat = () => {
    if (atAnswer) return;
    const frags = fragsOf(working[stepIdx]);
    if (frags && fragIdx < frags.length - 1) { setFragIdx(i => i + 1); return; }
    if (hideAnswerStep && stepIdx >= totalSteps - 1) return;
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
  keyRef.current = { next: () => { if (canNext && !atAnswer) goNextBeat(); }, prev: () => { if (canPrev) goPrevBeat(); } };

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
  //
  // When hideAnswerStep is set, there's no separate answer box after this —
  // the last step's own value IS the answer. The normal flow already rings
  // whichever step is "active" in blue and drops that ring the moment a new
  // step arrives (see stackedSteps) — there was previously nothing left to
  // ring once you reached the very end, since the last step just became an
  // inert card once you clicked past it into the separate Answer beat. Now
  // that beat IS the last step, so it keeps a ring too — green instead of
  // blue, since it's not "the current thing to focus on", it's arrival.
  // Evolving-visual steps (a place value table filling in): in the cascade and Show All the list
  // carries only each step's caption, and ONE visual — the current step's — updates in place beside it,
  // rather than reprinting the table on every card.
  const visualOf = (s: WorkingStep) => (stepVisualRenderer ? stepVisualRenderer(s, colorScheme, qoSnapshot) : null);
  // A step the renderer claims returns its picture, or `false` for a caption-only step that sits in the
  // same timeline while the picture stays on screen; `null` means "not mine".
  const isPicture = (s: WorkingStep) => { const v = visualOf(s); return v !== null && v !== false; };
  const hasVisual = !!stepVisualRenderer && working.some(isPicture);
  const evolve = hasVisual && (!stepped || layout === "stacked");
  /** Split with caption-only lines on a timeline (vs `keepWorking`: ordinary step cards beside the picture). */
  const captions = evolve && !keepWorking;
  /** Either split flavour: steps are flat rows on a numbered spine (no backing cards), with the answer as a green "A" line. */
  const timeline = evolve;
  /** The visual to show when `idx` is the current step: the nearest visual step at or before it. */
  const visualFor = (idx: number): JSX.Element | null => {
    for (let i = Math.min(idx, totalSteps - 1); i >= 0; i--) {
      const v = visualOf(working[i]);
      if (v) return v;   // (false / null are skipped)
    }
    return null;
  };
  const withVisual = (list: ReactNode, idx: number) => {
    const vis = evolve ? visualFor(idx) : null;
    if (!vis) return list;
    // phone: the picture is sized for the phone — shrunk to a capped box, never left at its desktop size
    const phoneVis = compact ? <div className="w-full" style={{ height: "24dvh" }}><ScaleToFit maxScale={0.85}><div className="px-2">{vis}</div></ScaleToFit></div> : vis;
    if (visualPlacement === "top") {
      return (
        <div className={`flex flex-col gap-4 ${fullscreen ? "h-full min-h-0" : ""}`}>
          <div className={`flex min-w-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5 ${fullscreen ? "flex-none max-h-[48%]" : ""}`}>{phoneVis}</div>
          {fullscreen
            ? <div ref={listRef} className="thin-scroll min-w-0 min-h-0 flex-1 overflow-y-auto">{list}</div>
            : <div className="min-w-0">{list}</div>}
        </div>
      );
    }
    return (
      // Fullscreen splits from tablet width up (md); the page waits for lg.
      <div className={`grid grid-cols-1 gap-4 items-stretch ${fullscreen ? "md:h-full" : ""} ${fullscreen ? (keepWorking ? "md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" : "md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]") : (keepWorking ? "md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]" : "md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]")}`} style={fullscreen ? { gridTemplateRows: "minmax(0, 1fr)" } : undefined}>
        {/* min-w-0 lets the panel shrink to the screen (a grid item otherwise grows to its content). */}
        <div className={`${fullscreen ? "md:order-2 min-h-[16rem]" : "md:order-2 max-md:sticky max-md:top-0 max-md:z-10 max-md:max-h-[40dvh] max-md:[&_svg]:max-h-[34dvh] max-md:[&_svg]:w-auto max-md:[&_svg]:mx-auto"} flex min-w-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5`}>
          {/* fullscreen: the picture grows to fill its panel (never past 2.2x), as it would on a projector */}
          {fullscreen ? <ScaleToFit maxScale={2.2}>{vis}</ScaleToFit> : phoneVis}
        </div>
        {/* The row is as tall as the visual; the caption list scrolls inside it instead of growing the page. */}
        <div className={`${fullscreen ? "md:order-1" : "md:order-1"} relative min-w-0 ${fullscreen ? "min-h-[16rem]" : keepWorking ? "min-h-[24rem]" : "min-h-[16rem]"}`}>
          <div
            ref={listRef}
            onScroll={(e) => setListScrolled(e.currentTarget.scrollTop > 4)}
            className={`thin-scroll max-h-80 overflow-y-auto ${fullscreen ? "md:max-h-none md:absolute md:inset-0" : "md:max-h-none md:absolute md:inset-0"}`}
            style={listScrolled ? { WebkitMaskImage: "linear-gradient(to bottom, transparent 0, #000 3rem)", maskImage: "linear-gradient(to bottom, transparent 0, #000 3rem)" } : undefined}
          >
            <div className="p-1">{list}</div>
          </div>
        </div>
      </div>
    );
  };

  // A step whose picture lives in the side panel is just a line in a timeline: a numbered dot and its
  // caption — no card, so the list stays light and more history fits. "current" is the live step,
  // "past" fades back, "all" (Show All) shows every line at full strength.
  const captionRow = (s: WorkingStep, i: number, state: "current" | "past" | "all") => {
    const on = state === "current";
    return (
      <div key={i} className="flex items-start gap-3 py-2" style={{ opacity: state === "past" ? 0.5 : 1, transition: "opacity 0.3s ease" }}>
        <span
          className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
          style={{ background: on ? "#1e3a8a" : "#fff", color: on ? "#fff" : "#475569", border: on ? "2px solid #1e3a8a" : "2px solid #cbd5e1", boxShadow: on ? "0 0 0 4px rgba(30,58,138,0.15)" : "none" }}
        >{i + 1}</span>
        <p className={compact ? "text-base leading-snug pt-1" : big ? "text-xl leading-snug pt-0.5" : "text-xl leading-snug pt-0.5"} style={{ color: on ? "#0f172a" : "#334155", fontWeight: on ? 600 : 400 }}>{s.plain}</p>
      </div>
    );
  };
  // Keep-working flavour: the same flat row as a caption — numbered dot, no card — but it carries the step's own
  // label and maths. Past steps fade back; the final step's dot turns green when it is itself the answer.
  const workRow = (s: WorkingStep, i: number, reveal: number | undefined, state: "current" | "past" | "all") => {
    const on = state === "current";
    const isAnswer = hideAnswerStep && i === totalSteps - 1;
    const custom = stepRenderer ? stepRenderer(s, colorScheme, qoSnapshot, reveal) : null;
    const text = compact ? "text-base leading-snug" : "text-xl leading-snug";
    const maths = compact ? "text-2xl" : "text-3xl";
    const mathsAns = compact ? "text-3xl" : "text-4xl";
    const dotBg = isAnswer ? "#16a34a" : on ? "#1e3a8a" : "#fff";
    const dotBorder = isAnswer ? "#16a34a" : on ? "#1e3a8a" : "#cbd5e1";
    return (
      <div key={i} className="flex items-start gap-3 py-2" style={{ opacity: state === "past" ? 0.5 : 1, transition: "opacity 0.3s ease" }}>
        <span
          className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
          style={{ background: dotBg, color: on || isAnswer ? "#fff" : "#475569", border: `2px solid ${dotBorder}`, boxShadow: on ? `0 0 0 4px ${isAnswer ? "rgba(22,163,74,0.15)" : "rgba(30,58,138,0.15)"}` : "none" }}
        >{i + 1}</span>
        <div className="min-w-0 flex-1 pt-0.5" style={{ color: "#0f172a" }}>
          {custom ?? (s.type === "tStep"
            ? <p className={text} style={{ fontWeight: on ? 600 : 400 }}><SkillLabel text={s.plain} onOpenSkill={onOpenSkill} /></p>
            : s.type === "mStep"
              ? <div className="flex flex-col gap-1">
                  <span className={`text-left ${text}`} style={{ fontWeight: on ? 600 : 400 }}><SkillLabel text={s.label ?? ""} onOpenSkill={onOpenSkill} /></span>
                  <div className={`text-center ${isAnswer ? `font-bold ${mathsAns}` : maths}`} style={isAnswer ? { color: "#166534" } : undefined}><FitWidth>{stepMaths(s, reveal)}</FitWidth></div>
                </div>
              : <div className={`text-center ${isAnswer ? `font-bold ${mathsAns}` : maths}`} style={isAnswer ? { color: "#166534" } : undefined}><FitWidth>{stepMaths(s, reveal)}</FitWidth></div>
          )}
        </div>
      </div>
    );
  };
  /** The vertical line the numbered dots sit on. */
  const timelineSpine = <div className="absolute left-4 top-6 bottom-6 w-0.5 -translate-x-1/2 rounded bg-slate-300" aria-hidden />;

  const renderStep = (s: WorkingStep, i: number, reveal?: number, stacked?: boolean, state: "current" | "past" | "all" = "all") => {
    if (captions && visualOf(s) !== null) return captionRow(s, i, state);   // a picture step or a caption-only step
    if (timeline && keepWorking) return workRow(s, i, reveal, state);       // keep-working: same row, with the maths
    const custom = stepRenderer ? stepRenderer(s, colorScheme, qoSnapshot, reveal) : null;
    const isFinalAnswerStep = hideAnswerStep && i === totalSteps - 1;
    // compact (narrow viewport) always wins over the "stacked" layout's own
    // reduced size — the two are independent axes, and narrow needs smaller
    // text than stacked's desktop-oriented reduction already gives it.
    const padStyle = compact ? { padding: "1rem" } : big ? { padding: "1.25rem" } : stacked ? { padding: "1.35rem" } : null;
    const headerStyle = compact
      ? { fontSize: "1rem", lineHeight: "1.4rem", marginBottom: "0.35rem" }
      : big ? { fontSize: "1.05rem", lineHeight: "1.5rem", marginBottom: "0.35rem" }
      : stacked ? { fontSize: "1.125rem", lineHeight: "1.575rem", marginBottom: "0.45rem" } : null;
    const bodyStyle = compact ? { fontSize: "1.05rem", lineHeight: "1.5rem" } : big ? { fontSize: "1.4rem", lineHeight: "1.85rem" } : stacked ? { fontSize: "1.35rem", lineHeight: "1.8rem" } : null;
    return (
      <div key={i} className="rounded-xl p-6" style={{
        backgroundColor: stepBg,
        boxShadow: isFinalAnswerStep ? "0 0 0 2px #16a34a" : undefined,
        ...padStyle,
      }}>
        <h4 className="text-xl font-bold mb-2" style={{ color: "#000", ...headerStyle }}>Step {i + 1}</h4>
        <div className="text-2xl" style={{ color: "#000", ...bodyStyle }}>
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
    width: big ? 56 : 44, height: big ? 56 : 44, display: "flex", alignItems: "center", justifyContent: "center",
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
  // The current card is the one that just newly entered the list on a forward
  // press (going back re-enters an already-mounted card, which just changes
  // its opacity/ring like any other prop change — no re-mount, no re-animate)
  // — see EnterCard's own comment for why that one needs a mount transition
  // and the rest don't.
  const stackedSteps = (upTo: number, activeReveal: number) => (
    <div className={timeline ? "relative" : "space-y-2"}>
      {timeline && timelineSpine}
      {working.slice(0, upTo + 1).map((s, i) => {
        const isCurrent = i === upTo;
        const isFinalAnswerStep = hideAnswerStep && i === totalSteps - 1;
        const content = renderStep(s, i, isCurrent ? activeReveal : undefined, true, isCurrent ? "current" : "past");
        if (timeline) {
          return isCurrent ? <EnterCard key={i}>{content}</EnterCard> : content;
        }
        if (isCurrent) {
          // The blue "current position" ring means "here's where you are,
          // there's more ahead" — once this IS the final answer step (no more
          // ahead, Next is disabled), that ring stops being true. renderStep
          // already applies its own green ring in that case, so this wrapper
          // adds no ring of its own rather than stacking two different colours.
          return (
            <EnterCard key={i} style={isFinalAnswerStep ? { borderRadius: 12 } : { borderRadius: 12, boxShadow: "0 0 0 2px #1e3a8a" }}>
              {content}
            </EnterCard>
          );
        }
        return (
          <div key={i} style={{
            opacity: 0.7,
            transition: "opacity 0.3s ease",
            borderRadius: 12,
            boxShadow: "none",
          }}>
            {content}
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
    <div ref={ref} className={`rounded-xl ${compact ? "p-4" : "p-6"} text-center ${extraClass}`} style={{ backgroundColor: stepBg }}>
      <div className={compact || stacked || big ? "font-bold" : `${answerFontClass} font-bold`} style={{ color: "#166534", ...(compact ? { fontSize: "1.05rem" } : big ? { fontSize: "1.7rem" } : stacked ? { fontSize: "1.35rem" } : null) }}>
        <FitWidth>{renderAnswer()}</FitWidth>
      </div>
    </div>
  );

  // In the split (evolving-visual) layout the answer is not a separate box: it is the last line of the
  // timeline — a green "A" marker and the bold green answer on the same spine as the step captions.
  const answerRow = (
    <div className="flex items-start gap-3 py-2">
      <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ background: "#16a34a", color: "#fff", border: "2px solid #16a34a", boxShadow: "0 0 0 4px rgba(22,163,74,0.15)" }}>A</span>
      <div className={`min-w-0 flex-1 font-bold ${compact ? "text-base pt-1" : "text-xl pt-0.5"}`} style={{ color: "#166534" }}>
        <FitWidth>{renderAnswer()}</FitWidth>
      </div>
    </div>
  );

  if (stepped) {
    const navRow = (
      <div className="flex items-center justify-between">
        <button style={navArrowStyle(canPrev)} title="Previous step" aria-label="Previous step" onClick={() => canPrev && (captureFooterTop(), goPrevBeat())}>
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-3">
          <span className={`${big ? "text-lg" : "text-sm"} font-bold text-gray-500`}>
            {atAnswer ? "Answer" : `Step ${stepIdx + 1} of ${totalSteps}`}
          </span>
          {steppedToggle}
        </div>
        <button style={navArrowStyle(canNext && !atAnswer)} title="Next step" aria-label="Next step" onClick={() => canNext && !atAnswer && (captureFooterTop(), goNextBeat())}>
          <ChevronRight size={24} />
        </button>
      </div>
    );
    const dotStrip = (
      <div className="flex justify-center gap-2">
        {Array.from({ length: hideAnswerStep ? totalSteps : totalSteps + 1 }, (_, i) => (
          <button key={i} onClick={() => { captureFooterTop(); jumpToStep(i); }}
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
      // Natural height: the card list and footer just flow one after the
      // other, growing/shrinking with however many steps are on screen — no
      // forced parent height, no internal scrollbox. The footer-position
      // effect above compensates by scrolling the window when the footer
      // moves, so it still reads as "pinned" without pre-reserving space
      // that's empty for a short (1-3 step) example.
      const body = (!atAnswer ? withVisual(stackedSteps(stepIdx, fragIdx), stepIdx) : withVisual(
            <div className="space-y-2">
              <div className={timeline ? "relative" : "space-y-2"} style={timeline ? undefined : { opacity: 0.7 }}>
                {timeline && timelineSpine}
                {working.map((s, i) => renderStep(s, i, undefined, true, "past"))}
                {timeline && answerRow}
              </div>
              {!timeline && answerBox("", undefined, true)}
            </div>, totalSteps - 1));
      const footer = (
        <>
        {compact && <div aria-hidden="true" style={{ height: "4.5rem" }} />}
        <div ref={footerRef} className={compact ? "fixed inset-x-0 z-30 px-4 pt-2 pb-2 bg-white border-t border-slate-200" : "pt-4 mt-4 border-t"} style={compact ? { bottom: "calc(4rem + env(safe-area-inset-bottom))" } : { borderColor: "rgba(0,0,0,0.08)" }}>
          {compact && <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-5 h-5" style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0), #fff)" }} />}
          {navRow}
          {!compact && <div className="mt-3">{dotStrip}</div>}
        </div>
        </>
      );
      if (fullscreen) {
        // A split with a picture is bounded by the area (its list scrolls itself); anything else scrolls as one column.
        const split = hasVisual && evolve && (atAnswer ? !!visualFor(totalSteps - 1) : !!visualFor(stepIdx));
        return (
          <div className="flex h-full min-h-0 flex-col">
            <div ref={fsScrollRef} className={`thin-scroll min-h-0 flex-1 p-1 ${split ? "overflow-y-auto md:overflow-hidden" : "overflow-y-auto"}`}>{body}</div>
            {/* the pen (ink) button floats bottom-right on every tool page: keep the controls clear of it */}
            <div className="flex-shrink-0 pb-1 pl-1 pr-16">{footer}</div>
          </div>
        );
      }
      return <div className="p-1">{body}{footer}</div>;
    }

    const single = (
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
    return fullscreen ? <div className="thin-scroll h-full overflow-y-auto p-1">{single}</div> : single;
  }

  const showAll = (
    <>
      {stepThroughEnabled && (
        <div className="flex justify-end mt-6 mb-4">
          {steppedToggle}
        </div>
      )}
      {withVisual(
        <div className={timeline ? "relative" : "space-y-4"}>
          {timeline && timelineSpine}
          {working.map((s, i) => renderStep(s, i))}
          {timeline && !hideAnswerStep && answerRow}
        </div>, totalSteps - 1)}
      {!hideAnswerStep && !timeline && answerBox("mt-4")}
    </>
  );
  return fullscreen ? <div className="thin-scroll h-full overflow-y-auto p-1">{showAll}</div> : showAll;
};
