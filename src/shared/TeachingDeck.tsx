import { useEffect, useState, useCallback } from "react";
import { loadKaTeX } from "./katex";

// ─────────────────────────────────────────────────────────────────────────────
// TeachingDeck — an embeddable, PowerPoint-style slide runner.
//
// A tool opts in by passing `teachingSlides` to ToolShell, which then shows a
// "Teach" mode that renders this deck. Content is authored as data (see the
// TeachingSlide type); the runner handles navigation (click / arrow keys) and
// the teacher-controlled reveal.
// ─────────────────────────────────────────────────────────────────────────────

const w = () => window as any;

export type TeachAccent = "blue" | "green" | "red" | "amber";
export type TeachBar = { num: number; den: number; color?: string; label?: string };

export type TeachBlock =
  | { t: "text"; s: string }                       // prose; $...$ renders inline maths, **bold** for emphasis
  | { t: "math"; s: string }                       // large centred KaTeX
  | { t: "bars"; bars: TeachBar[] }                // stacked bar models
  | { t: "verdict"; value: boolean }               // True / False badge
  | { t: "callout"; tone: "good" | "bad" | "info"; s: string };

export interface TeachingSlide {
  tag: string;                 // small chip, e.g. "Key idea"
  accent: TeachAccent;
  title: string;               // may contain $...$
  body?: TeachBlock[];         // always visible
  reveal?: TeachBlock[];       // shown after the reveal click
  revealLabel?: string;        // button text
}

const BAR_BLUE = "#2563eb", BAR_GREEN = "#16a34a";
const ACCENT: Record<TeachAccent, string> = { blue: "#2563eb", green: "#16a34a", red: "#dc2626", amber: "#d97706" };

// ── KaTeX + rich text ─────────────────────────────────────────────────────────

function Tex({ tex }: { tex: string }) {
  const html = w().katex ? w().katex.renderToString(tex, { throwOnError: false, displayMode: false }) : tex;
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

// Prose with inline $...$ maths and **bold** segments.
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

// ── Bar model ─────────────────────────────────────────────────────────────────

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

// ── Block renderer ────────────────────────────────────────────────────────────

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

// ── Deck runner (embeddable) ──────────────────────────────────────────────────

export function TeachingDeck({ slides }: { slides: TeachingSlide[] }) {
  const [ready, setReady] = useState(!!w().katex);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!w().katex) loadKaTeX().then(() => setReady(true)).catch(() => setReady(true));
    else setReady(true);
  }, []);

  const goNext = useCallback(() => {
    if (slides[idx].reveal && !revealed) { setRevealed(true); return; }
    if (idx < slides.length - 1) { setIdx(idx + 1); setRevealed(false); }
  }, [idx, revealed, slides]);

  const goPrev = useCallback(() => {
    if (idx > 0) { setIdx(idx - 1); setRevealed(false); }
  }, [idx]);

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
  const canReveal = !!slide.reveal && !revealed;

  return (
    <div style={{ background: "#f1f5f9", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", color: "#94a3b8", fontWeight: 700, fontSize: "0.9rem" }}>{idx + 1} / {slides.length}</div>

      <div onClick={goNext} style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "58vh", cursor: "pointer" }}>
        <div onClick={(e) => e.stopPropagation()}
          style={{ background: "#fff", borderRadius: 24, boxShadow: "0 10px 40px rgba(15,23,42,0.10)", borderTop: `6px solid ${accent}`, maxWidth: 780, width: "100%", padding: "2.25rem 2.5rem", display: "flex", flexDirection: "column", gap: 18 }}>
          <span style={{ alignSelf: "flex-start", fontSize: "0.8rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#fff", background: accent, padding: "0.25rem 0.8rem", borderRadius: 9999 }}>{slide.tag}</span>

          <h2 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.25, margin: 0 }}><RichText s={slide.title} /></h2>

          {slide.body?.map((b, i) => <BlockView key={i} b={b} />)}

          {revealed && slide.reveal && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, borderTop: "1px dashed #cbd5e1", paddingTop: 18 }}>
              {slide.reveal.map((b, i) => <BlockView key={i} b={b} />)}
            </div>
          )}

          {canReveal && (
            <button onClick={(e) => { e.stopPropagation(); setRevealed(true); }}
              style={{ alignSelf: "center", marginTop: 4, background: accent, color: "#fff", border: "none", borderRadius: 12, padding: "0.65rem 1.6rem", fontWeight: 800, fontSize: "1.05rem", cursor: "pointer" }}>
              {slide.revealLabel ?? "Reveal"}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={goPrev} disabled={idx === 0}
          style={{ border: "2px solid #e2e8f0", background: "#fff", color: idx === 0 ? "#cbd5e1" : "#334155", fontWeight: 700, borderRadius: 10, padding: "0.5rem 1.1rem", cursor: idx === 0 ? "default" : "pointer" }}>← Back</button>
        <div style={{ display: "flex", gap: 8 }}>
          {slides.map((_, i) => <span key={i} style={{ width: 9, height: 9, borderRadius: 9999, background: i === idx ? accent : "#cbd5e1" }} />)}
        </div>
        <button onClick={goNext}
          style={{ border: "none", background: accent, color: "#fff", fontWeight: 800, borderRadius: 10, padding: "0.55rem 1.4rem", cursor: "pointer", opacity: (!canReveal && idx === slides.length - 1) ? 0.5 : 1 }}>
          {canReveal ? (slide.revealLabel ?? "Reveal") : idx === slides.length - 1 ? "Done" : "Next →"}
        </button>
      </div>
    </div>
  );
}
