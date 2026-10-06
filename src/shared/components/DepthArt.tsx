// ─────────────────────────────────────────────────────────────────────────────
// Depth slide artwork — small, original SVG characters so a Depth question looks like a
// designed classroom slide (a speaker with a speech bubble, a mascot, a brand badge)
// rather than app UI. Purely decorative: every piece is aria-hidden except the badge text.
// ─────────────────────────────────────────────────────────────────────────────

import { useId } from "react";

const SKIN = ["#f6d2b0", "#e0a878", "#a8714b", "#fbdcc0", "#7a4a2e"];
const HAIR = ["#5b3a29", "#1f2937", "#c2410c", "#7c2d12", "#374151", "#a16207"];

/** A friendly cartoon face. `index` picks skin, hair colour and hairstyle so speakers look different. */
export function Avatar({ index, size = "4em" }: { index: number; size?: string }) {
  const skin = SKIN[(index * 2 + 1) % SKIN.length];
  const hair = HAIR[(index * 3 + 2) % HAIR.length];
  const style = index % 3;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" style={{ width: size, height: size, flexShrink: 0 }}>
      {style === 2 && <circle cx="50" cy="14" r="11" fill={hair} />}
      <circle cx="50" cy="56" r="34" fill={skin} />
      {style === 0 && <path d="M15 52 C14 18 86 18 85 52 C76 36 24 36 15 52Z" fill={hair} />}
      {style === 1 && <path d="M15 54 C10 14 72 8 86 44 C68 32 38 34 15 54Z" fill={hair} />}
      {style === 2 && <path d="M16 50 C16 20 84 20 84 50 C74 34 26 34 16 50Z" fill={hair} />}
      <circle cx="37" cy="58" r="4.2" fill="#1f2937" />
      <circle cx="63" cy="58" r="4.2" fill="#1f2937" />
      <circle cx="38.4" cy="56.6" r="1.4" fill="#fff" />
      <circle cx="64.4" cy="56.6" r="1.4" fill="#fff" />
      <circle cx="28" cy="68" r="5" fill="#f9a8a8" opacity="0.45" />
      <circle cx="72" cy="68" r="5" fill="#f9a8a8" opacity="0.45" />
      <path d="M40 71 Q50 81 60 71" fill="none" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** The Depth mascot: a scholarly owl. `mood` "think" looks up at a question mark (one brow raised, head tilted);
 *  "know" has happy closed eyes and a tick. Original SVG, purely decorative. */
export function Mascot({ mood, size = "5.6em", tone = "navy" }: { mood: "think" | "know"; size?: string; tone?: "navy" | "light" }) {
  const uid = useId().replace(/:/g, "");
  const light = tone === "light";
  const top = light ? "#9bbcfa" : "#2f55b8";
  const bottom = light ? "#5b87e6" : "#172554";
  const wing = light ? "#3f6fd6" : "#101c46";
  const belly = light ? "#f4f8ff" : "#dbeafe";
  const ink = "#0f172a";
  const feather = light ? "#b7ccf6" : "#93b4ee";
  const think = mood === "think";
  return (
    <svg viewBox="0 0 140 140" aria-hidden="true" style={{ width: size, height: size, flexShrink: 0, overflow: "visible" }}>
      <defs>
        <linearGradient id={`ob${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} /><stop offset="1" stopColor={bottom} />
        </linearGradient>
      </defs>
      {/* soft ground shadow */}
      <ellipse cx="70" cy="134" rx="40" ry="4.5" fill="#000" opacity="0.14" />
      <g transform={think ? "rotate(-5 70 126)" : undefined}>
        {/* feet */}
        {[52, 88].map((x) => (
          <g key={x} fill="#f59e0b" stroke="#d97706" strokeWidth="1">
            <path d={`M${x - 11} 132 Q${x - 11} 124 ${x - 6} 126 Q${x - 5} 120 ${x} 124 Q${x + 5} 120 ${x + 6} 126 Q${x + 11} 124 ${x + 11} 132Z`} />
          </g>
        ))}
        {/* ear tufts */}
        <path d="M30 46 C26 28 30 14 36 8 C42 16 50 26 54 36Z" fill={`url(#ob${uid})`} />
        <path d="M110 46 C114 28 110 14 104 8 C98 16 90 26 86 36Z" fill={`url(#ob${uid})`} />
        <path d="M34 34 C33 26 35 20 37 16 C40 22 44 28 46 33Z" fill={wing} opacity="0.55" />
        <path d="M106 34 C107 26 105 20 103 16 C100 22 96 28 94 33Z" fill={wing} opacity="0.55" />
        {/* body */}
        <path d="M70 22 C34 22 20 52 21 88 C22 120 44 134 70 134 C96 134 118 120 119 88 C120 52 106 22 70 22Z" fill={`url(#ob${uid})`} />
        {/* wings, with feather lines */}
        <path d="M24 70 C12 92 18 118 40 126 C34 108 34 90 38 74Z" fill={wing} />
        <path d="M116 70 C128 92 122 118 100 126 C106 108 106 90 102 74Z" fill={wing} />
        <path d="M24 92 Q31 96 36 94 M26 104 Q32 108 38 106" fill="none" stroke={top} strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
        <path d="M116 92 Q109 96 104 94 M114 104 Q108 108 102 106" fill="none" stroke={top} strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
        {/* belly with feather chevrons */}
        <path d="M70 76 C50 76 40 94 42 112 C44 126 56 132 70 132 C84 132 96 126 98 112 C100 94 90 76 70 76Z" fill={belly} />
        {[[56, 98], [70, 98], [84, 98], [63, 109], [77, 109], [56, 120], [70, 120], [84, 120]].map(([x, y]) => (
          <path key={`${x}-${y}`} d={`M${x - 5} ${y} Q${x} ${y + 6} ${x + 5} ${y}`} fill="none" stroke={feather} strokeWidth="2" strokeLinecap="round" />
        ))}
        {/* face discs */}
        <circle cx="50" cy="58" r="22" fill={belly} />
        <circle cx="90" cy="58" r="22" fill={belly} />
        <circle cx="50" cy="58" r="22" fill="none" stroke={feather} strokeWidth="2" />
        <circle cx="90" cy="58" r="22" fill="none" stroke={feather} strokeWidth="2" />
        {/* eyes */}
        {think ? (
          <>
            <circle cx="50" cy="58" r="15" fill="#fff" stroke={ink} strokeWidth="1.2" />
            <circle cx="90" cy="58" r="15" fill="#fff" stroke={ink} strokeWidth="1.2" />
            <circle cx="54" cy="53" r="8" fill={ink} />
            <circle cx="94" cy="53" r="8" fill={ink} />
            <circle cx="57" cy="50" r="2.8" fill="#fff" />
            <circle cx="97" cy="50" r="2.8" fill="#fff" />
            {/* one brow raised, one level */}
            <path d="M36 36 Q50 26 64 34" fill="none" stroke={ink} strokeWidth="3.4" strokeLinecap="round" />
            <path d="M78 41 Q90 36 104 40" fill="none" stroke={ink} strokeWidth="3.4" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M36 62 Q50 46 64 62" fill="none" stroke={ink} strokeWidth="5" strokeLinecap="round" />
            <path d="M76 62 Q90 46 104 62" fill="none" stroke={ink} strokeWidth="5" strokeLinecap="round" />
            <circle cx="33" cy="76" r="5" fill="#f9a8a8" opacity="0.55" />
            <circle cx="107" cy="76" r="5" fill="#f9a8a8" opacity="0.55" />
          </>
        )}
        {/* beak */}
        <path d="M62 70 Q70 66 78 70 Q76 82 70 88 Q64 82 62 70Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M65 74 Q70 72 75 74" fill="none" stroke="#d97706" strokeWidth="1" strokeLinecap="round" />
      </g>
      {/* thought / tick badge */}
      {think ? (
        <g>
          <circle cx="124" cy="24" r="17" fill="#fff" stroke="#e2e8f0" strokeWidth="1.5" />
          <circle cx="112" cy="46" r="3.2" fill="#fff" stroke="#e2e8f0" strokeWidth="1" />
          <circle cx="117" cy="40" r="4.5" fill="#fff" stroke="#e2e8f0" strokeWidth="1" />
          <text x="124" y="33" textAnchor="middle" fontSize="26" fontWeight="800" fill="#1e3a8a" fontFamily="system-ui, sans-serif">?</text>
        </g>
      ) : (
        <g>
          <circle cx="124" cy="24" r="17" fill="#16a34a" stroke="#fff" strokeWidth="2" />
          <path d="M115 24 L122 31 L134 16" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
}

/** The Depth wordmark: plain navy text, no block. */
export function Badge({ colour = "#1e3a8a" }: { colour?: string }) {
  return (
    <div style={{ color: colour, lineHeight: 1 }}>
      <div style={{ fontSize: "0.5em", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.85 }}>Maths Tools</div>
      <div style={{ fontSize: "1.25em", fontWeight: 900, letterSpacing: "0.12em" }}>DEPTH</div>
    </div>
  );
}
