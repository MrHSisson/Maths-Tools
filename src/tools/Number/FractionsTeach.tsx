import { useEffect, useState, useCallback } from "react";
import { loadKaTeX } from "../../shared";

// ─────────────────────────────────────────────────────────────────────────────
// PROOF OF CONCEPT — "Teach" mode for Adding & Subtracting Fractions.
//
// A self-contained, PowerPoint-style slide deck of curated teaching examples:
// true/false prompts, spot-the-mistake, and bar-model concept slides. Content
// is authored as data (SLIDES); the runner handles navigation and reveal.
//
// This is deliberately standalone (it does NOT use ToolShell) so the idea can
// be trialled without changing the shared component. If we keep it, the runner
// becomes a reusable `teachingSlides` capability on ToolShell.
// ─────────────────────────────────────────────────────────────────────────────

const w = () => window as any;

// ── Slide data model ──────────────────────────────────────────────────────────

type Accent = "blue" | "green" | "red" | "amber";
type BarSpec = { num: number; den: number; color?: string; label?: string };

type Block =
  | { t: "text"; s: string }                       // prose; $...$ renders inline maths
  | { t: "math"; s: string }                       // large centred KaTeX
  | { t: "bars"; bars: BarSpec[] }                 // stacked bar models
  | { t: "verdict"; value: boolean }               // True / False badge
  | { t: "callout"; tone: "good" | "bad" | "info"; s: string };

interface Slide {
  tag: string;                 // small chip, e.g. "Key idea"
  accent: Accent;
  title: string;               // may contain $...$
  body?: Block[];              // always visible
  reveal?: Block[];            // shown after the reveal click
  revealLabel?: string;        // button text
}

const BLUE = "#2563eb", GREEN = "#16a34a", AMBER = "#d97706";

const SLIDES: Slide[] = [
  {
    tag: "Key idea", accent: "blue",
    title: "Same denominator? Just add the numerators.",
    body: [
      { t: "text", s: "The denominator tells you the size of the pieces. When the pieces are the same size, you just count how many you have." },
      { t: "bars", bars: [
        { num: 1, den: 5, color: BLUE, label: "\\dfrac{1}{5}" },
        { num: 3, den: 5, color: BLUE, label: "\\dfrac{3}{5}" },
      ] },
      { t: "math", s: "\\dfrac{1}{5} + \\dfrac{3}{5} = \\dfrac{4}{5}" },
    ],
    reveal: [
      { t: "bars", bars: [{ num: 4, den: 5, color: GREEN, label: "\\dfrac{4}{5}" }] },
      { t: "callout", tone: "info", s: "The denominator stays as $5$ — you are not making new-sized pieces, only counting more of them." },
    ],
    revealLabel: "Show the total",
  },
  {
    tag: "True or false?", accent: "amber",
    title: "$\\dfrac{1}{2} + \\dfrac{1}{3} = \\dfrac{2}{5}$",
    body: [{ t: "text", s: "Decide with the class before you reveal." }],
    reveal: [
      { t: "verdict", value: false },
      { t: "bars", bars: [
        { num: 1, den: 2, color: BLUE, label: "\\dfrac{1}{2}" },
        { num: 1, den: 3, color: AMBER, label: "\\dfrac{1}{3}" },
      ] },
      { t: "callout", tone: "bad", s: "The pieces are different sizes, so you cannot add them directly — and you never add the denominators." },
      { t: "math", s: "\\dfrac{1}{2} + \\dfrac{1}{3} = \\dfrac{3}{6} + \\dfrac{2}{6} = \\dfrac{5}{6}" },
    ],
    revealLabel: "Reveal",
  },
  {
    tag: "Key idea", accent: "blue",
    title: "Different denominators? Make the pieces the same size first.",
    body: [
      { t: "text", s: "Rewrite each fraction over a common denominator, then add. Here the common denominator is $6$." },
      { t: "bars", bars: [
        { num: 3, den: 6, color: BLUE, label: "\\dfrac{1}{2} = \\dfrac{3}{6}" },
        { num: 2, den: 6, color: AMBER, label: "\\dfrac{1}{3} = \\dfrac{2}{6}" },
      ] },
    ],
    reveal: [
      { t: "bars", bars: [{ num: 5, den: 6, color: GREEN, label: "\\dfrac{5}{6}" }] },
      { t: "math", s: "\\dfrac{3}{6} + \\dfrac{2}{6} = \\dfrac{5}{6}" },
    ],
    revealLabel: "Add them",
  },
  {
    tag: "Key idea", accent: "blue",
    title: "Equivalent fractions: multiply top and bottom by the same number.",
    body: [
      { t: "math", s: "\\dfrac{1}{3} = \\dfrac{1 \\times 4}{3 \\times 4} = \\dfrac{4}{12}" },
      { t: "bars", bars: [
        { num: 1, den: 3, color: BLUE, label: "\\dfrac{1}{3}" },
        { num: 4, den: 12, color: BLUE, label: "\\dfrac{4}{12}" },
      ] },
    ],
    reveal: [
      { t: "callout", tone: "info", s: "The shaded amount is identical — you have only cut each piece into smaller equal pieces, so the value does not change." },
    ],
    revealLabel: "Why is it the same?",
  },
  {
    tag: "Spot the mistake", accent: "red",
    title: "What went wrong?",
    body: [
      { t: "text", s: "A student wrote:" },
      { t: "math", s: "\\dfrac{2}{3} + \\dfrac{1}{6} = \\dfrac{3}{9}" },
    ],
    reveal: [
      { t: "callout", tone: "bad", s: "They added the numerators **and** the denominators. Denominators are never added." },
      { t: "callout", tone: "good", s: "Use a common denominator of $6$:" },
      { t: "math", s: "\\dfrac{2}{3} + \\dfrac{1}{6} = \\dfrac{4}{6} + \\dfrac{1}{6} = \\dfrac{5}{6}" },
    ],
    revealLabel: "Reveal the mistake",
  },
  {
    tag: "True or false?", accent: "amber",
    title: "$1\\dfrac{1}{4} + 2\\dfrac{1}{2}$ can be done by adding the wholes and the fractions separately.",
    body: [{ t: "text", s: "Would this method work?" }],
    reveal: [
      { t: "verdict", value: true },
      { t: "callout", tone: "good", s: "Wholes: $1 + 2 = 3$. Parts: $\\dfrac{1}{4} + \\dfrac{2}{4} = \\dfrac{3}{4}$. Answer: $3\\dfrac{3}{4}$." },
      { t: "callout", tone: "info", s: "Converting to improper fractions also works — both give the same answer." },
    ],
    revealLabel: "Reveal",
  },
];

// ── KaTeX helpers ─────────────────────────────────────────────────────────────

function Tex({ tex }: { tex: string }) {
  const html = w().katex ? w().katex.renderToString(tex, { throwOnError: false, displayMode: false }) : tex;
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

// Renders prose with inline $...$ maths and **bold** segments.
function RichText({ s }: { s: string }) {
  const parts = s.split(/\$([^$]+)\$/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <Tex key={i} tex={p} />
        ) : (
          p.split(/\*\*([^*]+)\*\*/g).map((seg, j) =>
            j % 2 === 1 ? <strong key={j}>{seg}</strong> : <span key={j}>{seg}</span>,
          )
        ),
      )}
    </>
  );
}

// ── Bar model ─────────────────────────────────────────────────────────────────

function Bar({ num, den, color = BLUE, label }: BarSpec) {
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

function BlockView({ b }: { b: Block }) {
  if (b.t === "text") return <p style={{ fontSize: "1.35rem", color: "#334155", lineHeight: 1.5, textAlign: "center" }}><RichText s={b.s} /></p>;
  if (b.t === "math") return <div style={{ fontSize: "2.4rem", textAlign: "center", color: "#0f172a", margin: "0.5rem 0" }}><Tex tex={b.s} /></div>;
  if (b.t === "bars") return <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>{b.bars.map((bar, i) => <Bar key={i} {...bar} />)}</div>;
  if (b.t === "verdict") {
    const ok = b.value;
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <span style={{
          fontSize: "1.6rem", fontWeight: 800, padding: "0.4rem 1.6rem", borderRadius: 9999,
          color: "#fff", background: ok ? GREEN : "#dc2626", letterSpacing: "0.03em",
        }}>{ok ? "TRUE" : "FALSE"}</span>
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

// ── Deck runner ───────────────────────────────────────────────────────────────

const ACCENT: Record<Accent, string> = { blue: "#2563eb", green: "#16a34a", red: "#dc2626", amber: "#d97706" };

export default function App() {
  const [ready, setReady] = useState(!!w().katex);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!w().katex) loadKaTeX().then(() => setReady(true)).catch(() => setReady(true));
    else setReady(true);
  }, []);

  const slide = SLIDES[idx];
  const canReveal = !!slide.reveal && !revealed;

  const next = useCallback(() => {
    if (SLIDES[idx].reveal && !revealed) { setRevealed(true); return; }
    if (idx < SLIDES.length - 1) { setIdx(idx + 1); setRevealed(false); }
  }, [idx, revealed]);

  const prev = useCallback(() => {
    if (idx > 0) { setIdx(idx - 1); setRevealed(false); }
  }, [idx]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      else if (e.key === "Escape") window.location.href = "/";
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [next, prev]);

  if (!ready) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>Loading…</div>;

  const accent = ACCENT[slide.accent];

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", display: "flex", flexDirection: "column", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      {/* header */}
      <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
        <button onClick={() => (window.location.href = "/")}
          style={{ border: "none", background: "transparent", color: "#475569", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" }}>← Home</button>
        <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "1rem" }}>Adding &amp; Subtracting Fractions — Teach</span>
        <span style={{ color: "#94a3b8", fontWeight: 700, fontSize: "0.9rem" }}>{idx + 1} / {SLIDES.length}</span>
      </div>

      {/* slide */}
      <div onClick={next} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, cursor: "pointer" }}>
        <div style={{ background: "#fff", borderRadius: 24, boxShadow: "0 10px 40px rgba(15,23,42,0.10)", borderTop: `6px solid ${accent}`, maxWidth: 780, width: "100%", padding: "2.5rem 2.75rem", display: "flex", flexDirection: "column", gap: 20 }}
          onClick={(e) => e.stopPropagation()}>
          <span style={{ alignSelf: "flex-start", fontSize: "0.8rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#fff", background: accent, padding: "0.25rem 0.8rem", borderRadius: 9999 }}>{slide.tag}</span>

          <h1 style={{ fontSize: "1.9rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.25, margin: 0 }}><RichText s={slide.title} /></h1>

          {slide.body?.map((b, i) => <BlockView key={i} b={b} />)}

          {revealed && slide.reveal && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, borderTop: "1px dashed #cbd5e1", paddingTop: 20 }}>
              {slide.reveal.map((b, i) => <BlockView key={i} b={b} />)}
            </div>
          )}

          {canReveal && (
            <button onClick={(e) => { e.stopPropagation(); setRevealed(true); }}
              style={{ alignSelf: "center", marginTop: 6, background: accent, color: "#fff", border: "none", borderRadius: 12, padding: "0.7rem 1.6rem", fontWeight: 800, fontSize: "1.05rem", cursor: "pointer" }}>
              {slide.revealLabel ?? "Reveal"}
            </button>
          )}
        </div>
      </div>

      {/* footer */}
      <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", background: "#fff", borderTop: "1px solid #e2e8f0" }}>
        <button onClick={prev} disabled={idx === 0}
          style={{ border: "2px solid #e2e8f0", background: "#fff", color: idx === 0 ? "#cbd5e1" : "#334155", fontWeight: 700, borderRadius: 10, padding: "0.5rem 1.1rem", cursor: idx === 0 ? "default" : "pointer" }}>← Back</button>

        <div style={{ display: "flex", gap: 8 }}>
          {SLIDES.map((_, i) => (
            <span key={i} style={{ width: 9, height: 9, borderRadius: 9999, background: i === idx ? accent : "#cbd5e1" }} />
          ))}
        </div>

        <button onClick={next}
          style={{ border: "none", background: accent, color: "#fff", fontWeight: 800, borderRadius: 10, padding: "0.55rem 1.4rem", cursor: "pointer" }}>
          {canReveal ? (slide.revealLabel ?? "Reveal") : idx === SLIDES.length - 1 ? "Done" : "Next →"}
        </button>
      </div>
    </div>
  );
}
