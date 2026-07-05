import { useEffect, useState, useCallback, useRef } from "react";
import { loadKaTeX } from "./katex";

// ─────────────────────────────────────────────────────────────────────────────
// TeachingDeck — an embeddable, PowerPoint-style slide runner with animation.
//
// A tool opts in by passing `teachingSlides` to ToolShell, which shows a "Teach"
// mode that runs this deck. Content is authored as data. There are two slide
// kinds:
//   • static  — body blocks + an optional reveal (press once to reveal).
//   • anim     — a scene (e.g. an animated fraction bar) that the teacher
//                presses THROUGH in stages, with a caption per stage.
// The runner tracks a step index; each press advances one step, then moves on
// to the next slide.
// ─────────────────────────────────────────────────────────────────────────────

const w = () => window as any;
const range = (a: number, b: number) => Array.from({ length: b - a }, (_, i) => a + i);

export type TeachAccent = "blue" | "green" | "red" | "amber";
export type TeachBar = { num: number; den: number; color?: string; label?: string };

export type TeachBlock =
  | { t: "text"; s: string }                       // prose; $...$ inline maths, **bold** for emphasis
  | { t: "math"; s: string }                       // large centred KaTeX
  | { t: "bars"; bars: TeachBar[] }                // stacked (static) bar models
  | { t: "verdict"; value: boolean }               // True / False badge
  | { t: "callout"; tone: "good" | "bad" | "info"; s: string };

// A scene is an animated figure driven by the current step index.
export type TeachScene =
  | { type: "split"; num: number; den: number; factor: number; color?: string }   // cut each piece into `factor`
  | { type: "combine"; a: TeachBar; b: TeachBar; sumLabel: string };              // two shaded bars flow into one

export interface StaticSlide {
  kind?: "static";
  tag: string; accent: TeachAccent; title: string;
  body?: TeachBlock[]; reveal?: TeachBlock[]; revealLabel?: string;
}
export interface AnimSlide {
  kind: "anim";
  tag: string; accent: TeachAccent; title: string;
  scene: TeachScene;
  steps: string[];              // one caption per stage; steps.length = number of stages
}
export type TeachingSlide = StaticSlide | AnimSlide;

const BAR_BLUE = "#2563eb", BAR_GREEN = "#16a34a";
const ACCENT: Record<TeachAccent, string> = { blue: "#2563eb", green: "#16a34a", red: "#dc2626", amber: "#d97706" };

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
        i % 2 === 1 ? (
          <Tex key={i} tex={p} />
        ) : (
          p.split(/\*\*([^*]+)\*\*/g).map((seg, j) => (j % 2 === 1 ? <strong key={j}>{seg}</strong> : <span key={j}>{seg}</span>))
        ),
      )}
    </>
  );
}

// ── Static bar model ──────────────────────────────────────────────────────────

function Bar({ num, den, color = BAR_BLUE, label }: TeachBar) {
  const W = 340, H = 40;
  const seg = W / den;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ maxWidth: "100%" }} preserveAspectRatio="xMidYMid meet">
        {Array.from({ length: den }).map((_, i) => (
          <rect key={i} x={i * seg} y={0} width={seg} height={H} fill={i < num ? color : "#ffffff"} stroke="#334155" strokeWidth={1.25} />
        ))}
        <rect x={0.75} y={0.75} width={W - 1.5} height={H - 1.5} fill="none" stroke="#334155" strokeWidth={2} rx={5} />
      </svg>
      {label && <span style={{ fontSize: "1.5rem", minWidth: 70 }}><Tex tex={label} /></span>}
    </div>
  );
}

// ── Animated scenes ───────────────────────────────────────────────────────────

// "Split": a shaded bar whose area never moves while cut-lines slice each piece
// into `factor` sub-pieces, then the label ticks from num/den to (num·f)/(den·f).
// Stages: 0 = original, 1 = cutting, 2 = relabelled.
function SplitScene({ num, den, factor, color = BAR_BLUE, step }: { num: number; den: number; factor: number; color?: string; step: number }) {
  const W = 400, H = 58;
  const shadedW = (num / den) * W;
  const baseLines = range(1, den).map((i) => (i * W) / den);
  const fine = den * factor;
  const cutLines = range(1, fine)
    .map((i) => (i * W) / fine)
    .filter((x) => !baseLines.some((b) => Math.abs(b - x) < 0.5));
  const showCuts = step >= 1;
  const relabel = step >= 2;

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 22, flexWrap: "wrap" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ maxWidth: "100%" }} preserveAspectRatio="xMidYMid meet">
        {/* shaded area — deliberately unchanged across every stage */}
        <rect x={0} y={0} width={shadedW} height={H} fill={color} opacity={0.9} />
        {/* original piece divisions */}
        {baseLines.map((x, i) => <line key={"b" + i} x1={x} y1={0} x2={x} y2={H} stroke="#334155" strokeWidth={2} />)}
        {/* new cut lines grow in, staggered left-to-right */}
        {cutLines.map((x, i) => (
          <line key={"c" + i} x1={x} y1={0} x2={x} y2={H} stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="5 3"
            style={{
              transition: "opacity .45s ease, transform .45s cubic-bezier(.2,.8,.2,1)",
              transitionDelay: `${i * 70}ms`,
              transformBox: "fill-box", transformOrigin: "center",
              opacity: showCuts ? 1 : 0, transform: showCuts ? "scaleY(1)" : "scaleY(0.05)",
            }} />
        ))}
        <rect x={1} y={1} width={W - 2} height={H - 2} fill="none" stroke="#334155" strokeWidth={2.5} rx={6} />
      </svg>
      {/* crossfading label */}
      <div style={{ position: "relative", minWidth: 96, height: 66, fontSize: "1.9rem" }}>
        <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", opacity: relabel ? 0 : 1, transition: "opacity .4s ease" }}><Tex tex={`\\dfrac{${num}}{${den}}`} /></span>
        <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", opacity: relabel ? 1 : 0, transition: "opacity .4s ease" }}><Tex tex={`\\dfrac{${num * factor}}{${den * factor}}`} /></span>
      </div>
    </div>
  );
}

// "Combine": two shaded bars; on step 1 the second bar's shaded pieces slide up
// onto the end of the first to form the sum bar.
function CombineScene({ a, b, sumLabel, step }: { a: TeachBar; b: TeachBar; sumLabel: string; step: number }) {
  const W = 380, H = 44;
  const den = a.den; // combine assumes a common denominator
  const seg = W / den;
  const moved = step >= 1;
  const cell = (i: number, filled: boolean, color: string, key: string, extra?: React.CSSProperties) => (
    <rect key={key} x={i * seg} y={0} width={seg} height={H} fill={filled ? color : "#fff"} stroke="#334155" strokeWidth={1.25} style={extra} />
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
      {/* bar A with a "landing zone" that fills as B arrives */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} preserveAspectRatio="xMidYMid meet" style={{ maxWidth: "100%" }}>
          {range(0, den).map((i) => cell(i, i < a.num, a.color ?? BAR_BLUE, "a" + i))}
          {range(0, den).map((i) =>
            i >= a.num && i < a.num + b.num
              ? <rect key={"land" + i} x={i * seg} y={0} width={seg} height={H} fill={b.color ?? BAR_GREEN} stroke="#334155" strokeWidth={1.25}
                  style={{ transition: "opacity .5s ease", transitionDelay: `${(i - a.num) * 90}ms`, opacity: moved ? 1 : 0 }} />
              : null)}
          <rect x={0.75} y={0.75} width={W - 1.5} height={H - 1.5} fill="none" stroke="#334155" strokeWidth={2} rx={5} />
        </svg>
        <span style={{ fontSize: "1.5rem" }}><Tex tex={moved ? sumLabel : (a.label ?? "")} /></span>
      </div>
      {/* bar B empties as it moves */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: moved ? 0.25 : 1, transition: "opacity .5s ease" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} preserveAspectRatio="xMidYMid meet" style={{ maxWidth: "100%" }}>
          {range(0, den).map((i) => cell(i, !moved && i < b.num, b.color ?? BAR_GREEN, "b" + i))}
          <rect x={0.75} y={0.75} width={W - 1.5} height={H - 1.5} fill="none" stroke="#334155" strokeWidth={2} rx={5} />
        </svg>
        <span style={{ fontSize: "1.5rem" }}><Tex tex={b.label ?? ""} /></span>
      </div>
    </div>
  );
}

function SceneView({ scene, step }: { scene: TeachScene; step: number }) {
  if (scene.type === "split") return <SplitScene {...scene} step={step} />;
  return <CombineScene {...scene} step={step} />;
}

// ── Block renderer (static slides) ────────────────────────────────────────────

const TONE: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  good: { bg: "#f0fdf4", border: "#86efac", text: "#166534", icon: "✓" },
  bad:  { bg: "#fef2f2", border: "#fca5a5", text: "#991b1b", icon: "✕" },
  info: { bg: "#eff6ff", border: "#93c5fd", text: "#1e40af", icon: "💡" },
};

function BlockView({ b }: { b: TeachBlock }) {
  if (b.t === "text") return <p style={{ fontSize: "1.35rem", color: "#334155", lineHeight: 1.5, textAlign: "center", margin: 0 }}><RichText s={b.s} /></p>;
  if (b.t === "math") return <div style={{ fontSize: "2.4rem", textAlign: "center", color: "#0f172a", margin: "0.25rem 0" }}><Tex tex={b.s} /></div>;
  if (b.t === "bars") return <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>{b.bars.map((bar, i) => <Bar key={i} {...bar} />)}</div>;
  if (b.t === "verdict") {
    const ok = b.value;
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <span style={{ fontSize: "1.6rem", fontWeight: 800, padding: "0.4rem 1.6rem", borderRadius: 9999, color: "#fff", background: ok ? BAR_GREEN : "#dc2626", letterSpacing: "0.03em" }}>{ok ? "TRUE" : "FALSE"}</span>
      </div>
    );
  }
  const tone = TONE[b.tone];
  return (
    <div style={{ background: tone.bg, border: `2px solid ${tone.border}`, borderRadius: 14, padding: "0.9rem 1.2rem", display: "flex", gap: 12, alignItems: "flex-start" }}>
      <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>{tone.icon}</span>
      <span style={{ fontSize: "1.2rem", color: tone.text, lineHeight: 1.5 }}><RichText s={b.s} /></span>
    </div>
  );
}

// ── Deck runner (step-based) ──────────────────────────────────────────────────

const maxStepOf = (s: TeachingSlide) => (s.kind === "anim" ? s.steps.length - 1 : s.reveal ? 1 : 0);

export function TeachingDeck({ slides }: { slides: TeachingSlide[] }) {
  const [ready, setReady] = useState(!!w().katex);
  const [idx, setIdx] = useState(0);
  const [step, setStep] = useState(0);
  const idxRef = useRef(0); idxRef.current = idx;
  const stepRef = useRef(0); stepRef.current = step;

  useEffect(() => {
    if (!w().katex) loadKaTeX().then(() => setReady(true)).catch(() => setReady(true));
    else setReady(true);
  }, []);

  const goNext = useCallback(() => {
    const i = idxRef.current, s = stepRef.current;
    if (s < maxStepOf(slides[i])) { setStep(s + 1); return; }
    if (i < slides.length - 1) { setIdx(i + 1); setStep(0); }
  }, [slides]);

  const goPrev = useCallback(() => {
    const i = idxRef.current, s = stepRef.current;
    if (s > 0) { setStep(s - 1); return; }
    if (i > 0) { setIdx(i - 1); setStep(0); }
  }, [slides]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") { e.preventDefault(); goNext(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [goNext, goPrev]);

  if (!slides.length) return null;
  if (!ready) return <div style={{ padding: "4rem", textAlign: "center", color: "#64748b" }}>Loading…</div>;

  const slide = slides[idx];
  const accent = ACCENT[slide.accent];
  const maxStep = maxStepOf(slide);
  const atEnd = step >= maxStep;
  const isAnim = slide.kind === "anim";

  return (
    <div style={{ background: "#f1f5f9", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", color: "#94a3b8", fontWeight: 700, fontSize: "0.9rem" }}>{idx + 1} / {slides.length}</div>

      <div onClick={goNext} style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "58vh", cursor: "pointer" }}>
        <div onClick={isAnim ? undefined : (e) => e.stopPropagation()}
          style={{ background: "#fff", borderRadius: 24, boxShadow: "0 10px 40px rgba(15,23,42,0.10)", borderTop: `6px solid ${accent}`, maxWidth: 820, width: "100%", padding: "2.25rem 2.5rem", display: "flex", flexDirection: "column", gap: 18 }}>
          <span style={{ alignSelf: "flex-start", fontSize: "0.8rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#fff", background: accent, padding: "0.25rem 0.8rem", borderRadius: 9999 }}>{slide.tag}</span>

          <h2 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.25, margin: 0 }}><RichText s={slide.title} /></h2>

          {slide.kind === "anim" ? (
            <>
              <div style={{ margin: "0.75rem 0" }}><SceneView scene={slide.scene} step={step} /></div>
              <div style={{ minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.35rem", color: "#334155", textAlign: "center" }}>
                <RichText s={slide.steps[step]} />
              </div>
              {!atEnd && <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.95rem", fontWeight: 600 }}>press → to continue</div>}
            </>
          ) : (
            <>
              {slide.body?.map((b, i) => <BlockView key={i} b={b} />)}
              {step >= 1 && slide.reveal && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16, borderTop: "1px dashed #cbd5e1", paddingTop: 18 }}>
                  {slide.reveal.map((b, i) => <BlockView key={i} b={b} />)}
                </div>
              )}
              {step < 1 && slide.reveal && (
                <button onClick={(e) => { e.stopPropagation(); setStep(1); }}
                  style={{ alignSelf: "center", marginTop: 4, background: accent, color: "#fff", border: "none", borderRadius: 12, padding: "0.65rem 1.6rem", fontWeight: 800, fontSize: "1.05rem", cursor: "pointer" }}>
                  {slide.revealLabel ?? "Reveal"}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={goPrev} disabled={idx === 0 && step === 0}
          style={{ border: "2px solid #e2e8f0", background: "#fff", color: idx === 0 && step === 0 ? "#cbd5e1" : "#334155", fontWeight: 700, borderRadius: 10, padding: "0.5rem 1.1rem", cursor: idx === 0 && step === 0 ? "default" : "pointer" }}>← Back</button>
        <div style={{ display: "flex", gap: 8 }}>
          {slides.map((_, i) => <span key={i} style={{ width: 9, height: 9, borderRadius: 9999, background: i === idx ? accent : "#cbd5e1" }} />)}
        </div>
        <button onClick={goNext}
          style={{ border: "none", background: accent, color: "#fff", fontWeight: 800, borderRadius: 10, padding: "0.55rem 1.4rem", cursor: "pointer", opacity: atEnd && idx === slides.length - 1 ? 0.5 : 1 }}>
          {!atEnd ? "Continue ▸" : idx === slides.length - 1 ? "Done" : "Next →"}
        </button>
      </div>
    </div>
  );
}
