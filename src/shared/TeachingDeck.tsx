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
  | { type: "split"; num: number; den: number; factor: number; shadeByOne?: boolean }  // cut each piece into `factor`
  | { type: "combine"; a: TeachBar; b: TeachBar; sumLabel: string };

export interface StaticSlide {
  kind?: "static";
  category: TeachCategory;
  title: string;
  body?: TeachBlock[];
  reveal?: TeachBlock[];
  revealLabel?: string;
}
export interface AnimSlide {
  kind: "anim";
  category: TeachCategory;
  title: string;
  scene: TeachScene;
  steps: string[];   // captions, one per beat (clamped if fewer than the scene's beats)
}
export type TeachingSlide = StaticSlide | AnimSlide;

// ── Palette (matches the rest of the app) ─────────────────────────────────────

const NAVY = "#1e3a8a";   // blue-900
const AMBER = "#d97706";  // amber-600
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
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? <Tex key={i} tex={p} /> : p.split(/\*\*([^*]+)\*\*/g).map((seg, j) => (j % 2 === 1 ? <strong key={j}>{seg}</strong> : <span key={j}>{seg}</span>)),
      )}
    </>
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

// How many beats (max step index) a scene runs for.
const sceneMaxStep = (s: TeachScene): number => {
  if (s.type === "split") return (s.shadeByOne ? s.num : 0) + s.den + 1;  // [initial/shade] + one cut per piece + relabel
  return 1;                                                               // combine: 0 apart, 1 together
};

// "Split": the shaded area never moves while each original piece is cut into
// `factor` sub-pieces — one piece per press — then the label ticks over.
function SplitScene({ num, den, factor, shadeByOne = false, step }: { num: number; den: number; factor: number; shadeByOne?: boolean; step: number }) {
  const W = 440, H = 62, seg = W / den;
  const shadeSteps = shadeByOne ? num : 0;
  const shadedPieces = shadeByOne ? clamp(step, 0, num) : num;
  const cutStart = shadeSteps + 1;
  const cutCount = clamp(step - cutStart + 1, 0, den);
  const relabel = step >= shadeSteps + den + 1;

  return (
    <div className="flex items-center justify-center gap-6 flex-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="max-w-full" preserveAspectRatio="xMidYMid meet">
        {/* piece backgrounds */}
        {range(0, den).map((i) => <rect key={"p" + i} x={i * seg} y={0} width={seg} height={H} fill="#fff" stroke="#334155" strokeWidth={1.5} />)}
        {/* shaded pieces (fill in one-by-one when shadeByOne) */}
        {range(0, num).map((i) => (
          <rect key={"s" + i} x={i * seg} y={0} width={seg} height={H} fill={NAVY}
            style={{ transition: "opacity .35s ease", opacity: i < shadedPieces ? 0.92 : 0 }} />
        ))}
        {/* cut lines appear per piece as it is split */}
        {range(0, den).flatMap((p) =>
          range(1, factor).map((k) => {
            const x = p * seg + (k * seg) / factor;
            const shown = p < cutCount;
            return (
              <line key={`c${p}-${k}`} x1={x} y1={0} x2={x} y2={H} stroke={AMBER} strokeWidth={2.5} strokeDasharray="5 3"
                style={{ transition: "opacity .3s ease, transform .3s cubic-bezier(.2,.8,.2,1)", transformBox: "fill-box", transformOrigin: "center", opacity: shown ? 1 : 0, transform: shown ? "scaleY(1)" : "scaleY(0.05)" }} />
            );
          }),
        )}
        {range(1, den).map((i) => <line key={"b" + i} x1={i * seg} y1={0} x2={i * seg} y2={H} stroke="#334155" strokeWidth={2} />)}
        <rect x={1} y={1} width={W - 2} height={H - 2} fill="none" stroke="#334155" strokeWidth={2.5} rx={6} />
      </svg>
      <div className="relative text-3xl" style={{ minWidth: 96, height: 66 }}>
        <span className="absolute inset-0 flex items-center" style={{ opacity: relabel ? 0 : 1, transition: "opacity .35s ease" }}><Tex tex={`\\dfrac{${num}}{${den}}`} /></span>
        <span className="absolute inset-0 flex items-center" style={{ opacity: relabel ? 1 : 0, transition: "opacity .35s ease" }}><Tex tex={`\\dfrac{${num * factor}}{${den * factor}}`} /></span>
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

function SceneView({ scene, step }: { scene: TeachScene; step: number }) {
  return scene.type === "split" ? <SplitScene {...scene} step={step} /> : <CombineScene {...scene} step={step} />;
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

const maxStepOf = (s: TeachingSlide) => (s.kind === "anim" ? sceneMaxStep(s.scene) : s.reveal ? 1 : 0);

export function TeachingDeck({ slides }: { slides: TeachingSlide[] }) {
  const [ready, setReady] = useState(!!w().katex);
  const [cat, setCat] = useState<TeachCategory | null>(null);
  const [idx, setIdx] = useState(0);
  const [step, setStep] = useState(0);
  const idxRef = useRef(0); idxRef.current = idx;
  const stepRef = useRef(0); stepRef.current = step;

  useEffect(() => {
    if (!w().katex) loadKaTeX().then(() => setReady(true)).catch(() => setReady(true));
    else setReady(true);
  }, []);

  const deck = cat ? slides.filter((s) => s.category === cat) : [];

  const goNext = useCallback(() => {
    const list = slides.filter((s) => s.category === cat);
    const i = idxRef.current, s = stepRef.current;
    if (!list[i]) return;
    if (s < maxStepOf(list[i])) { setStep(s + 1); return; }
    if (i < list.length - 1) { setIdx(i + 1); setStep(0); }
  }, [slides, cat]);
  const goPrev = useCallback(() => {
    const i = idxRef.current, s = stepRef.current;
    if (s > 0) { setStep(s - 1); return; }
    if (i > 0) { setIdx(i - 1); setStep(0); }
  }, []);
  const toMenu = useCallback(() => { setCat(null); setIdx(0); setStep(0); }, []);

  useEffect(() => {
    if (!cat) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") { e.preventDefault(); goNext(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
      else if (e.key === "Escape") toMenu();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [cat, goNext, goPrev, toMenu]);

  if (!ready) return <div className="text-center text-gray-400 py-16">Loading…</div>;

  // ── Menu ──
  if (!cat) {
    return (
      <div className="flex flex-col gap-4">
        {CATEGORY.map((c) => {
          const count = slides.filter((s) => s.category === c.key).length;
          const disabled = count === 0;
          return (
            <button key={c.key} disabled={disabled} onClick={() => { setCat(c.key); setIdx(0); setStep(0); }}
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

  // ── Deck ──
  const slide = deck[idx];
  const color = catMeta(cat).color;
  const maxStep = maxStepOf(slide);
  const atEnd = step >= maxStep;
  const isAnim = slide.kind === "anim";
  const caption = isAnim ? (slide as AnimSlide).steps[Math.min(step, (slide as AnimSlide).steps.length - 1)] : "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button onClick={toMenu} className="px-4 py-2 rounded-lg border-2 border-gray-300 bg-white text-gray-700 font-bold hover:border-blue-900 hover:text-blue-900 transition-colors">← Menu</button>
        <span className="text-sm font-bold uppercase tracking-wider" style={{ color }}>{catMeta(cat).label}</span>
        <span className="text-gray-400 font-bold text-sm">{idx + 1} / {deck.length}</span>
      </div>

      <div onClick={isAnim ? goNext : undefined} className={`bg-white rounded-2xl shadow-lg px-10 py-9 flex flex-col gap-5 ${isAnim ? "cursor-pointer" : ""}`} style={{ borderTop: `5px solid ${color}`, minHeight: "48vh" }}>
        <h2 className="text-3xl font-bold text-gray-900 leading-tight"><RichText s={slide.title} /></h2>

        {isAnim ? (
          <>
            <div className="my-3"><SceneView scene={(slide as AnimSlide).scene} step={step} /></div>
            <div className="min-h-[3rem] flex items-center justify-center text-xl text-gray-700 text-center"><RichText s={caption} /></div>
            {/* per-beat progress pips */}
            <div className="flex justify-center gap-1.5">
              {range(0, maxStep + 1).map((i) => <span key={i} className="rounded-full" style={{ width: 7, height: 7, background: i <= step ? color : "#e5e7eb" }} />)}
            </div>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button onClick={goPrev} disabled={idx === 0 && step === 0}
          className={`px-5 py-2.5 rounded-xl border-2 font-bold transition-colors ${idx === 0 && step === 0 ? "border-gray-200 text-gray-300 cursor-default" : "border-gray-300 text-gray-700 bg-white hover:border-blue-900 hover:text-blue-900"}`}>← Back</button>
        <div className="flex gap-2">
          {deck.map((_, i) => <span key={i} className="rounded-full" style={{ width: 9, height: 9, background: i === idx ? color : "#cbd5e1" }} />)}
        </div>
        <button onClick={goNext} disabled={atEnd && idx === deck.length - 1}
          className="px-6 py-2.5 rounded-xl text-white font-bold transition-opacity"
          style={{ background: color, opacity: atEnd && idx === deck.length - 1 ? 0.4 : 1 }}>
          {!atEnd ? "Next step ▸" : idx === deck.length - 1 ? "Done" : "Next slide →"}
        </button>
      </div>
    </div>
  );
}
