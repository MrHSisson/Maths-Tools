// ─────────────────────────────────────────────────────────────────────────────
// Depth slide artwork — small, original SVG characters so a Depth question looks like a
// designed classroom slide (a speaker with a speech bubble, a mascot, a brand badge)
// rather than app UI. Purely decorative: every piece is aria-hidden except the badge text.
// ─────────────────────────────────────────────────────────────────────────────

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

/** The Depth mascot: an owl. `mood` "think" shows a question mark, "know" a tick. */
export function Mascot({ mood, size = "5.6em" }: { mood: "think" | "know"; size?: string }) {
  return (
    <svg viewBox="0 0 140 130" aria-hidden="true" style={{ width: size, height: `calc(${size} * 130 / 140)`, flexShrink: 0 }}>
      {/* feet */}
      <ellipse cx="50" cy="123" rx="13" ry="5" fill="#f59e0b" />
      <ellipse cx="82" cy="123" rx="13" ry="5" fill="#f59e0b" />
      {/* ear tufts */}
      <path d="M30 40 L40 12 L56 34Z" fill="#1e3a8a" />
      <path d="M102 40 L92 12 L76 34Z" fill="#1e3a8a" />
      {/* body */}
      <ellipse cx="66" cy="76" rx="44" ry="46" fill="#1e3a8a" />
      <ellipse cx="66" cy="92" rx="26" ry="28" fill="#bfdbfe" />
      {/* eyes */}
      <circle cx="46" cy="60" r="19" fill="#fff" />
      <circle cx="86" cy="60" r="19" fill="#fff" />
      {mood === "think" ? (
        <>
          <circle cx="51" cy="55" r="8" fill="#111827" />
          <circle cx="91" cy="55" r="8" fill="#111827" />
          <circle cx="54" cy="52" r="2.6" fill="#fff" />
          <circle cx="94" cy="52" r="2.6" fill="#fff" />
        </>
      ) : (
        <>
          <path d="M36 62 Q46 50 56 62" fill="none" stroke="#111827" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M76 62 Q86 50 96 62" fill="none" stroke="#111827" strokeWidth="4.5" strokeLinecap="round" />
        </>
      )}
      {/* beak */}
      <path d="M59 72 L73 72 L66 86Z" fill="#f59e0b" />
      {/* wings */}
      <path d="M22 70 Q14 92 32 108 Q30 86 36 72Z" fill="#172554" />
      <path d="M110 70 Q118 92 100 108 Q102 86 96 72Z" fill="#172554" />
      {mood === "think" ? (
        <g>
          <circle cx="118" cy="22" r="16" fill="#fff" />
          <text x="118" y="30" textAnchor="middle" fontSize="24" fontWeight="800" fill="#1e3a8a" fontFamily="system-ui, sans-serif">?</text>
        </g>
      ) : (
        <g>
          <circle cx="118" cy="22" r="16" fill="#16a34a" />
          <path d="M109 22 L116 29 L128 15" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
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
