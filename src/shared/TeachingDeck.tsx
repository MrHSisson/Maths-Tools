import { useEffect, useState, useCallback, useRef } from "react";
import { loadKaTeX } from "./katex";

// ─────────────────────────────────────────────────────────────────────────────
// TeachingDeck — an embeddable teaching aid with a category menu and
// press-through, animated slides.
//
// A tool opts in by passing `teachingSlides` to ToolShell, which shows a "Teach"
// mode running this deck. The teacher first picks a category (Concepts, True or
// False, Spot the Mistake…), then presses through the slides in that category
// (→ / space / click to advance one beat, ← to step back, Esc back to the menu).
//
// Two slide kinds:
//   • static — body blocks + an optional reveal (one extra beat).
//   • anim    — a scene (e.g. a fraction bar) choreographed across several beats,
//               with one caption per beat.
// ─────────────────────────────────────────────────────────────────────────────

const w = () => window as any;
const range = (a: number, b: number) => Array.from({ length: Math.max(0, b - a) }, (_, i) => a + i);
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export type TeachCategory = "concept" | "trueFalse" | "spotMistake";

export type TeachBar = { num: number; den: number; label?: string; shade?: boolean };

export type TeachBlock =
  | { t: "text"; s: string }                       // prose; $...$ inline maths, **bold**
  | { t: "math"; s: string }                       // large centred KaTeX
  | { t: "bars"; bars: TeachBar[] }                // stacked static bar models
  | { t: "verdict"; value: boolean }               // True / False
  | { t: "note"; tone?: "good" | "bad" | "plain"; label?: string; s: string }; // clean bordered note (no emoji)

export type TeachScene =
  | { type: "split"; num: number; den: number; factor: number; shadeByOne?: boolean; predict?: boolean }  // cut each piece into `factor`; predict hides the answer
  | { type: "combine"; a: TeachBar; b: TeachBar; sumLabel: string }
  | { type: "equivalents"; num: number; den: number; factors: number[] }  // reveal one ×factor equivalent per beat
  | { type: "multiples"; a: number; b: number };  // list each number's multiples one per press up to the LCM, then highlight the shared value

export type TeachPhase = "iDo" | "weDo" | "youDo";   // shown as a corner badge

export interface StaticSlide {
  kind?: "static";
  category: TeachCategory;
  phase?: TeachPhase;
  title: string;
  body?: TeachBlock[];
  reveal?: TeachBlock[];
  revealLabel?: string;
}
export interface AnimSlide {
  kind: "anim";
  category: TeachCategory;
  phase?: TeachPhase;
  title: string;
  scene: TeachScene;
  steps: string[];   // captions, one per beat (clamped if fewer than the scene's beats)
}
export type TeachingSlide = StaticSlide | AnimSlide;

const PHASE_LABEL: Record<TeachPhase, string> = { iDo: "I do", weDo: "We do", youDo: "You do" };

// ── Palette (matches the rest of the app) ─────────────────────────────────────

const NAVY = "#1e3a8a";   // blue-900
const AMBER = "#d97706";  // amber-600 (True/False category accent only)
const CUT = "#64748b";    // slate-500 — the "split" cut lines (neutral, reads on navy + white)
const RED = "#dc2626";    // red-600
const GREEN = "#16a34a";  // green-600

const CATEGORY: { key: TeachCategory; label: string; color: string }[] = [
  { key: "concept",     label: "Concepts",         color: NAVY },
  { key: "trueFalse",   label: "True or False",    color: AMBER },
  { key: "spotMistake", label: "Spot the Mistake", color: RED },
];
const catMeta = (k: TeachCategory) => CATEGORY.find((c) => c.key === k)!;

// ── KaTeX + rich text ─────────────────────────────────────────────────────────

function Tex({ tex }: { tex: string }) {
  const html = w().katex ? w().katex.renderToString(tex, { throwOnError: false, displayMode: false }) : tex;
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
function RichText({ s }: { s: string }) {
  const parts = s.split(/\$([^$]+)\$/g);
  // A single inline wrapper, not a fragment — inside flex containers, sibling
  // spans become separate flex items and their edge whitespace collapses,
  // jamming words together around every $...$ segment.
  return (
    <span style={{ display: "inline" }}>
      {parts.map((p, i) =>
        i % 2 === 1 ? <Tex key={i} tex={p} /> : p.split(/\*\*([^*]+)\*\*/g).map((seg, j) => (j % 2 === 1 ? <strong key={`${i}-${j}`}>{seg}</strong> : <span key={`${i}-${j}`}>{seg}</span>)),
      )}
    </span>
  );
}

// ── Fraction bar (static) ─────────────────────────────────────────────────────

function Bar({ num, den, label, shade = true }: TeachBar) {
  const W = 340, H = 40, seg = W / den;
  return (
    <div className="flex items-center justify-center gap-4 flex-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="max-w-full" preserveAspectRatio="xMidYMid meet">
        {range(0, den).map((i) => <rect key={i} x={i * seg} y={0} width={seg} height={H} fill={shade && i < num ? NAVY : "#fff"} stroke="#334155" strokeWidth={1.25} />)}
        <rect x={0.75} y={0.75} width={W - 1.5} height={H - 1.5} fill="none" stroke="#334155" strokeWidth={2} rx={5} />
      </svg>
      {label && <span className="text-2xl text-gray-900"><Tex tex={label} /></span>}
    </div>
  );
}

// ── Animated scenes ───────────────────────────────────────────────────────────

const gcdOf = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcdOf(b, a % b));
const lcmOf = (a: number, b: number): number => (a * b) / gcdOf(a, b);

// How many beats (max step index) a scene runs for.
const sceneMaxStep = (s: TeachScene): number => {
  if (s.type === "split") return (s.shadeByOne ? s.num : 0) + s.den + 1 + (s.predict ? 1 : 0);
  if (s.type === "equivalents") return s.factors.length;                 // prompt + one per factor
  if (s.type === "multiples") { const l = lcmOf(s.a, s.b); return l / s.a + l / s.b + 1; }  // one per multiple, then the answer
  return 1;                                                               // combine: 0 apart, 1 together
};

// "Split": the shaded area never moves while each original piece is cut into
// `factor` sub-pieces — one piece per press. The answer (relabel + the
// ×factor equation) appears on the final beat; in `predict` mode it stays "?"
// behind one extra beat so students can guess first.
function SplitScene({ num, den, factor, shadeByOne = false, predict = false, step }: { num: number; den: number; factor: number; shadeByOne?: boolean; predict?: boolean; step: number }) {
  const W = 440, H = 62, seg = W / den;
  const shadeSteps = shadeByOne ? num : 0;
  const shadedPieces = shadeByOne ? clamp(step, 0, num) : num;
  const cutStart = shadeSteps + 1;
  const cutCount = clamp(step - cutStart + 1, 0, den);
  const answerStep = shadeSteps + den + 1 + (predict ? 1 : 0);
  const promptStep = predict ? shadeSteps + den + 1 : Infinity;
  const showAnswer = step >= answerStep;
  const showPrompt = step >= promptStep && !showAnswer;
  const nf = num * factor, df = den * factor;
  const labelTex = showAnswer ? `\\dfrac{${nf}}{${df}}` : showPrompt ? `\\dfrac{?}{\\,?\\,}` : `\\dfrac{${num}}{${den}}`;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* grid keeps the BAR centred; the fraction label sits in the right track without shifting it */}
      <div className="grid items-center w-full" style={{ gridTemplateColumns: "1fr auto 1fr" }}>
        <div />
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="max-w-full" preserveAspectRatio="xMidYMid meet">
          {range(0, den).map((i) => <rect key={"p" + i} x={i * seg} y={0} width={seg} height={H} fill="#fff" stroke="#334155" strokeWidth={1.5} />)}
          {range(0, num).map((i) => (
            <rect key={"s" + i} x={i * seg} y={0} width={seg} height={H} fill={NAVY}
              style={{ transition: "opacity .35s ease", opacity: i < shadedPieces ? 0.92 : 0 }} />
          ))}
          {range(0, den).flatMap((p) =>
            range(1, factor).map((k) => {
              const x = p * seg + (k * seg) / factor;
              const shown = p < cutCount;
              return (
                <line key={`c${p}-${k}`} x1={x} y1={0} x2={x} y2={H} stroke={CUT} strokeWidth={2.5} strokeDasharray="5 3"
                  style={{ transition: "opacity .3s ease, transform .3s cubic-bezier(.2,.8,.2,1)", transformBox: "fill-box", transformOrigin: "center", opacity: shown ? 1 : 0, transform: shown ? "scaleY(1)" : "scaleY(0.05)" }} />
              );
            }),
          )}
          {range(1, den).map((i) => <line key={"b" + i} x1={i * seg} y1={0} x2={i * seg} y2={H} stroke="#334155" strokeWidth={2} />)}
          <rect x={1} y={1} width={W - 2} height={H - 2} fill="none" stroke="#334155" strokeWidth={2.5} rx={6} />
        </svg>
        <div className="justify-self-start text-3xl flex items-center pl-4" style={{ height: 66 }}><Tex tex={labelTex} /></div>
      </div>
      {/* the actual result: multiplying top and bottom by `factor` */}
      <div className="text-gray-900" style={{ fontSize: "1.8rem", minHeight: "2.4rem", opacity: showAnswer ? 1 : 0, transition: "opacity .4s ease" }}>
        <Tex tex={`\\dfrac{${num}}{${den}} = \\dfrac{${num} \\times ${factor}}{${den} \\times ${factor}} = \\dfrac{${nf}}{${df}}`} />
      </div>
    </div>
  );
}

function CombineScene({ a, b, sumLabel, step }: { a: TeachBar; b: TeachBar; sumLabel: string; step: number }) {
  const W = 380, H = 44, den = a.den, seg = W / den;
  const moved = step >= 1;
  return (
    <div className="flex flex-col gap-3 items-center">
      <div className="flex items-center gap-4">
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="max-w-full" preserveAspectRatio="xMidYMid meet">
          {range(0, den).map((i) => <rect key={"a" + i} x={i * seg} y={0} width={seg} height={H} fill={i < a.num ? NAVY : "#fff"} stroke="#334155" strokeWidth={1.25} />)}
          {range(0, den).map((i) => (i >= a.num && i < a.num + b.num
            ? <rect key={"l" + i} x={i * seg} y={0} width={seg} height={H} fill={GREEN} stroke="#334155" strokeWidth={1.25} style={{ transition: "opacity .45s ease", transitionDelay: `${(i - a.num) * 90}ms`, opacity: moved ? 1 : 0 }} />
            : null))}
          <rect x={0.75} y={0.75} width={W - 1.5} height={H - 1.5} fill="none" stroke="#334155" strokeWidth={2} rx={5} />
        </svg>
        <span className="text-2xl text-gray-900"><Tex tex={moved ? sumLabel : (a.label ?? "")} /></span>
      </div>
      <div className="flex items-center gap-4" style={{ opacity: moved ? 0.25 : 1, transition: "opacity .45s ease" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="max-w-full" preserveAspectRatio="xMidYMid meet">
          {range(0, den).map((i) => <rect key={"b" + i} x={i * seg} y={0} width={seg} height={H} fill={!moved && i < b.num ? GREEN : "#fff"} stroke="#334155" strokeWidth={1.25} />)}
          <rect x={0.75} y={0.75} width={W - 1.5} height={H - 1.5} fill="none" stroke="#334155" strokeWidth={2} rx={5} />
        </svg>
        <span className="text-2xl text-gray-900"><Tex tex={b.label ?? ""} /></span>
      </div>
    </div>
  );
}

// "Equivalents": the base fraction, then one ×factor equivalent revealed per beat
// (for a "find two equivalent fractions" You-do, checked against common answers).
function EquivalentsScene({ num, den, factors, step }: { num: number; den: number; factors: number[]; step: number }) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div style={{ fontSize: "2.6rem" }} className="text-gray-900"><Tex tex={`\\dfrac{${num}}{${den}}`} /></div>
      <div className="grid grid-cols-2 gap-x-12 gap-y-4">
        {factors.map((f, i) => (
          <div key={f} className="flex items-baseline gap-3 justify-center" style={{ opacity: i < step ? 1 : 0, transition: "opacity .35s ease", minHeight: "3rem" }}>
            <span style={{ fontSize: "1.7rem" }} className="text-gray-900"><Tex tex={`\\dfrac{${num}}{${den}} = \\dfrac{${num * f}}{${den * f}}`} /></span>
            <span className="text-sm font-bold uppercase tracking-wide" style={{ color: NAVY }}>×{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// "Multiples": the walkthrough for finding an LCM. Each press writes the next
// multiple — first a's list up to the LCM, then b's — exactly as a teacher
// would list them on the board. When the shared value lands in the second
// list, both copies highlight; the final beat states the LCM.
function MultiplesScene({ a, b, step }: { a: number; b: number; step: number }) {
  const l = lcmOf(a, b);
  const listA = range(1, l / a + 1).map((i) => i * a);
  const listB = range(1, l / b + 1).map((i) => i * b);
  const revealedA = clamp(step, 0, listA.length);
  const revealedB = clamp(step - listA.length, 0, listB.length);
  const commonFound = revealedB >= listB.length;   // the LCM is always the last multiple listed
  const showAnswer = step >= listA.length + listB.length + 1;

  const row = (n: number, list: number[], revealed: number) => (
    <div className="flex items-baseline gap-4 justify-start w-full">
      <span className="text-xl font-bold text-gray-500 flex-shrink-0" style={{ minWidth: "9.5rem" }}>Multiples of {n}:</span>
      <div className="flex items-baseline gap-3 flex-wrap">
        {list.map((m, i) => {
          const isCommon = m === l && commonFound;
          return (
            <span key={m}
              className="text-3xl font-semibold"
              style={{
                opacity: i < revealed ? 1 : 0,
                transition: "opacity .35s ease, background .35s ease, color .35s ease",
                color: isCommon ? "#fff" : "#111827",
                background: isCommon ? NAVY : "transparent",
                borderRadius: 10,
                padding: "0 0.4em",
              }}>
              {m}
            </span>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-xl">
      {row(a, listA, revealedA)}
      {row(b, listB, revealedB)}
      <div className="text-gray-900" style={{ fontSize: "1.9rem", minHeight: "2.5rem", opacity: showAnswer ? 1 : 0, transition: "opacity .4s ease" }}>
        <Tex tex={`\\mathrm{LCM}(${a},\\ ${b}) = ${l}`} />
      </div>
    </div>
  );
}

function SceneView({ scene, step }: { scene: TeachScene; step: number }) {
  if (scene.type === "split") return <SplitScene {...scene} step={step} />;
  if (scene.type === "equivalents") return <EquivalentsScene {...scene} step={step} />;
  if (scene.type === "multiples") return <MultiplesScene {...scene} step={step} />;
  return <CombineScene {...scene} step={step} />;
}

// ── Static blocks ─────────────────────────────────────────────────────────────

function BlockView({ b }: { b: TeachBlock }) {
  if (b.t === "text") return <p className="text-xl text-gray-700 text-center leading-relaxed"><RichText s={b.s} /></p>;
  if (b.t === "math") return <div className="text-center text-gray-900" style={{ fontSize: "2.2rem" }}><Tex tex={b.s} /></div>;
  if (b.t === "bars") return <div className="flex flex-col gap-3 items-center">{b.bars.map((bar, i) => <Bar key={i} {...bar} />)}</div>;
  if (b.t === "verdict") return (
    <div className="flex justify-center">
      <span className="px-6 py-1.5 rounded-full text-white font-extrabold text-xl tracking-wide" style={{ background: b.value ? GREEN : RED }}>{b.value ? "TRUE" : "FALSE"}</span>
    </div>
  );
  const color = b.tone === "good" ? GREEN : b.tone === "bad" ? RED : "#94a3b8";
  return (
    <div className="pl-4 py-1" style={{ borderLeft: `4px solid ${color}` }}>
      {b.label && <span className="block font-bold text-gray-900 text-sm uppercase tracking-wide mb-0.5">{b.label}</span>}
      <span className="text-lg text-gray-700 leading-relaxed"><RichText s={b.s} /></span>
    </div>
  );
}

// ── Runner ────────────────────────────────────────────────────────────────────

// Beats a slide runs for (exported for the slide smoke tests).
export const slideMaxStep = (s: TeachingSlide) => (s.kind === "anim" ? sceneMaxStep(s.scene) : s.reveal ? 1 : 0);

// ── SlideDeck — plays a flat slide array, one beat per press ──────────────────
// The reusable core of the Teach deck: TeachingDeck uses it after a category is
// chosen, and the skill-library overlay (src/shared/skills) plays a skill's
// slides through it directly. Owns its own slide/beat state and keyboard
// handling (→/space/Enter advance, ← back, Esc → onEscape).
export function SlideDeck({ slides, color, onEscape, onDone }: {
  slides: TeachingSlide[];
  color: string;
  onEscape?: () => void;
  /** When provided, the Next button becomes "Done" on the last beat and fires
   *  this instead of disabling — used by the skill overlay to close itself. */
  onDone?: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [step, setStep] = useState(0);
  const idxRef = useRef(0); idxRef.current = idx;
  const stepRef = useRef(0); stepRef.current = step;

  const goNext = useCallback(() => {
    const i = idxRef.current, s = stepRef.current;
    if (!slides[i]) return;
    if (s < slideMaxStep(slides[i])) { setStep(s + 1); return; }
    if (i < slides.length - 1) { setIdx(i + 1); setStep(0); }
  }, [slides]);
  const goPrev = useCallback(() => {
    const i = idxRef.current, s = stepRef.current;
    if (s > 0) { setStep(s - 1); return; }
    if (i > 0) { setIdx(i - 1); setStep(0); }
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") { e.preventDefault(); goNext(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
      else if (e.key === "Escape" && onEscape) onEscape();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [goNext, goPrev, onEscape]);

  const slide = slides[idx];
  if (!slide) return null;
  const maxStep = slideMaxStep(slide);
  const atEnd = step >= maxStep;
  const atLast = atEnd && idx === slides.length - 1;
  const isAnim = slide.kind === "anim";
  const caption = isAnim ? (slide as AnimSlide).steps[Math.min(step, (slide as AnimSlide).steps.length - 1)] : "";

  return (
    <div className="flex flex-col gap-4">
      <div onClick={isAnim ? goNext : undefined} className={`relative bg-white rounded-2xl shadow-lg px-10 pt-7 pb-6 flex flex-col ${isAnim ? "cursor-pointer" : ""}`} style={{ borderTop: `5px solid ${color}`, minHeight: "44vh" }}>
        {slide.phase && (
          <span className="absolute top-6 right-6 px-4 py-1.5 rounded-full text-white text-xs font-extrabold uppercase tracking-widest" style={{ background: color }}>{PHASE_LABEL[slide.phase]}</span>
        )}

        <h2 className="text-xl font-bold text-gray-500 leading-snug pr-28"><RichText s={slide.title} /></h2>

        <div className="flex-1 flex flex-col items-center justify-center gap-7 py-4">
          {isAnim ? (
            <>
              <SceneView scene={(slide as AnimSlide).scene} step={step} />
              <div className="min-h-[3.25rem] max-w-2xl flex items-center justify-center text-2xl text-gray-800 text-center px-2"><RichText s={caption} /></div>
            </>
          ) : (
            <div className="w-full flex flex-col gap-5 items-stretch">
              {(slide as StaticSlide).body?.map((b, i) => <BlockView key={i} b={b} />)}
              {step >= 1 && (slide as StaticSlide).reveal && (
                <div className="flex flex-col gap-4 pt-4 border-t border-gray-200">
                  {(slide as StaticSlide).reveal!.map((b, i) => <BlockView key={i} b={b} />)}
                </div>
              )}
              {step < 1 && (slide as StaticSlide).reveal && (
                <button onClick={() => setStep(1)} className="self-center mt-1 px-6 py-2.5 rounded-xl text-white font-bold text-lg" style={{ background: color }}>
                  {(slide as StaticSlide).revealLabel ?? "Reveal"}
                </button>
              )}
            </div>
          )}
        </div>

        {isAnim && <div className="text-center font-bold text-sm" style={{ color }}>{step + 1} / {maxStep + 1}</div>}
      </div>

      <div className="flex items-center justify-between">
        <button onClick={goPrev} disabled={idx === 0 && step === 0}
          className={`px-5 py-2.5 rounded-xl border-2 font-bold transition-colors ${idx === 0 && step === 0 ? "border-gray-200 text-gray-300 cursor-default" : "border-gray-300 text-gray-700 bg-white hover:border-blue-900 hover:text-blue-900"}`}>← Back</button>
        <button onClick={() => { if (atLast) { if (onDone) onDone(); } else goNext(); }} disabled={atLast && !onDone}
          className="px-6 py-2.5 rounded-xl text-white font-bold transition-opacity"
          style={{ background: color, opacity: atLast && !onDone ? 0.4 : 1 }}>
          {atLast ? "Done" : "Next ▸"}
        </button>
      </div>
    </div>
  );
}

export function TeachingDeck({ slides }: { slides: TeachingSlide[] }) {
  const [ready, setReady] = useState(!!w().katex);
  const [cat, setCat] = useState<TeachCategory | null>(null);

  useEffect(() => {
    if (!w().katex) loadKaTeX().then(() => setReady(true)).catch(() => setReady(true));
    else setReady(true);
  }, []);

  const toMenu = useCallback(() => setCat(null), []);

  if (!ready) return <div className="text-center text-gray-400 py-16">Loading…</div>;

  // ── Menu ──
  if (!cat) {
    return (
      <div className="flex flex-col gap-4">
        {CATEGORY.map((c) => {
          const count = slides.filter((s) => s.category === c.key).length;
          const disabled = count === 0;
          return (
            <button key={c.key} disabled={disabled} onClick={() => setCat(c.key)}
              className={`bg-white rounded-xl shadow-lg p-6 flex items-center justify-between text-left transition-all ${disabled ? "opacity-60 cursor-default" : "hover:shadow-xl hover:-translate-y-0.5"}`}
              style={{ borderLeft: `6px solid ${c.color}` }}>
              <span className="text-2xl font-bold" style={{ color: disabled ? "#9ca3af" : "#111827" }}>{c.label}</span>
              <span className="text-sm font-bold uppercase tracking-wider" style={{ color: disabled ? "#9ca3af" : c.color }}>
                {disabled ? "Coming soon" : `${count} slide${count > 1 ? "s" : ""}`}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // ── Deck ── (keyed by category so slide/beat state resets on re-entry)
  const color = catMeta(cat).color;
  return (
    <div className="flex flex-col gap-4">
      <div className="relative flex items-center h-10">
        <button onClick={toMenu} className="absolute left-0 px-4 py-2 rounded-lg border-2 border-gray-300 bg-white text-gray-700 font-bold hover:border-blue-900 hover:text-blue-900 transition-colors">← Menu</button>
        <span className="mx-auto text-sm font-bold uppercase tracking-wider" style={{ color }}>{catMeta(cat).label}</span>
      </div>
      <SlideDeck key={cat} slides={slides.filter((s) => s.category === cat)} color={color} onEscape={toMenu} />
    </div>
  );
}
