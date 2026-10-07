// ─────────────────────────────────────────────────────────────────────────────
// Depth slide artwork — small, original SVG characters so a Depth question looks like a
// designed classroom slide (a speaker with a speech bubble, a mascot, a brand badge)
// rather than app UI. Purely decorative: every piece is aria-hidden except the badge text.
// ─────────────────────────────────────────────────────────────────────────────

import { useId } from "react";

const SKIN = ["#f8d9bd", "#eebf94", "#d39a6c", "#b27650", "#8a5a3b", "#6b4429"];
const HAIR = ["#2b1d16", "#5b3a29", "#8a4b2a", "#c2410c", "#d6a032", "#1f2937", "#6b7280"];
const SHIRT = ["#2563eb", "#16a34a", "#e11d48", "#7c3aed", "#ea580c", "#0d9488", "#db2777", "#475569"];
const BACKDROP = ["#dbeafe", "#dcfce7", "#fee2e2", "#ede9fe", "#ffedd5", "#ccfbf1", "#fce7f3", "#e2e8f0"];

/** A small stable hash so the same name always draws the same face, whichever slide it is on. */
const hash = (s: string) => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

/** A friendly cartoon head-and-shoulders, drawn as a round profile picture. Give it the speaker's `name` and the same
 *  character always looks the same (skin, hair colour and style, shirt, glasses); `index` is the fallback. */
export function Avatar({ index, name, size = "4em" }: { index: number; name?: string; size?: string }) {
  const clip = useId().replace(/:/g, "");
  const h = name ? hash(name) : index * 2654435761;
  const pick = (n: number, salt: number) => ((h >>> salt) + (h >>> (salt + 7))) % n;
  const skin = SKIN[pick(SKIN.length, 0)];
  const hair = HAIR[pick(HAIR.length, 3)];
  const shirt = SHIRT[pick(SHIRT.length, 5)];
  const back = BACKDROP[pick(BACKDROP.length, 9)];
  const style = pick(6, 2);
  const glasses = pick(5, 11) === 0;
  const mouth = pick(3, 13);
  const shade = "rgba(0,0,0,0.10)";
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" style={{ width: size, height: size, flexShrink: 0 }}>
      <defs><clipPath id={clip}><circle cx="50" cy="50" r="48" /></clipPath></defs>
      <circle cx="50" cy="50" r="48" fill={back} />
      <g clipPath={`url(#${clip})`}>
        {/* hair behind the head */}
        {style === 2 && <path d="M21 50 C17 14 83 14 79 50 L82 92 L66 92 L66 62 L34 62 L34 92 L18 92Z" fill={hair} />}
        {style === 3 && (
          <g fill={hair}>
            <circle cx="30" cy="32" r="12" /><circle cx="45" cy="23" r="13" /><circle cx="60" cy="23" r="13" /><circle cx="72" cy="32" r="12" />
            <circle cx="24" cy="46" r="9" /><circle cx="76" cy="46" r="9" />
          </g>
        )}
        {style === 4 && <circle cx="50" cy="13" r="10" fill={hair} />}
        {style === 5 && <g fill={hair}><circle cx="20" cy="42" r="9" /><circle cx="80" cy="42" r="9" /></g>}
        {/* shoulders, collar and neck */}
        <path d="M6 104 C8 80 28 71 50 71 C72 71 92 80 94 104Z" fill={shirt} />
        <path d="M38 71 L50 84 L62 71Z" fill="#fff" opacity="0.9" />
        <rect x="42" y="58" width="16" height="16" rx="6" fill={skin} />
        <rect x="42" y="58" width="16" height="7" fill={shade} />
        {/* ears and head */}
        <circle cx="26.5" cy="48" r="4.6" fill={skin} /><circle cx="73.5" cy="48" r="4.6" fill={skin} />
        <ellipse cx="50" cy="46" rx="24" ry="26" fill={skin} />
        {/* hair in front */}
        {style === 0 && <path d="M25 46 C21 14 79 14 75 46 C70 33 32 31 25 46Z" fill={hair} />}
        {style === 1 && <path d="M25 48 C20 12 72 8 77 40 C62 26 42 32 25 48Z" fill={hair} />}
        {style === 2 && <path d="M25 44 C26 17 74 17 75 44 C62 30 38 30 25 44Z" fill={hair} />}
        {style === 3 && <path d="M28 36 C34 26 66 26 72 36 C60 32 40 32 28 36Z" fill={hair} />}
        {style === 4 && <path d="M25 46 C21 16 79 16 75 46 C70 33 32 31 25 46Z" fill={hair} />}
        {style === 5 && <path d="M25 46 C21 14 79 14 75 46 C68 28 34 28 25 46Z" fill={hair} />}
        {/* face */}
        <path d="M33 39.5 Q39 36.5 45 39" fill="none" stroke={hair} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M55 39 Q61 36.5 67 39.5" fill="none" stroke={hair} strokeWidth="2.6" strokeLinecap="round" />
        <ellipse cx="39" cy="47" rx="3.3" ry="3.9" fill="#1f2937" /><ellipse cx="61" cy="47" rx="3.3" ry="3.9" fill="#1f2937" />
        <circle cx="40.2" cy="45.6" r="1.3" fill="#fff" /><circle cx="62.2" cy="45.6" r="1.3" fill="#fff" />
        <path d="M50 49 Q47.5 55 51 55.5" fill="none" stroke={shade.replace("0.10", "0.35")} strokeWidth="2" strokeLinecap="round" />
        <circle cx="31" cy="56" r="4.6" fill="#f97373" opacity="0.28" /><circle cx="69" cy="56" r="4.6" fill="#f97373" opacity="0.28" />
        {mouth === 0 && <path d="M41 60 Q50 68 59 60" fill="none" stroke="#7f1d1d" strokeWidth="2.6" strokeLinecap="round" />}
        {mouth === 1 && <path d="M41 60 Q50 70 59 60Z" fill="#7f1d1d" stroke="#7f1d1d" strokeWidth="2" strokeLinejoin="round" />}
        {mouth === 2 && <path d="M42 61 Q50 66 58 61" fill="none" stroke="#7f1d1d" strokeWidth="2.6" strokeLinecap="round" />}
        {glasses && (
          <g fill="rgba(255,255,255,0.25)" stroke="#334155" strokeWidth="2.2">
            <circle cx="39" cy="47" r="8.5" /><circle cx="61" cy="47" r="8.5" /><path d="M47.5 47 H52.5" fill="none" />
          </g>
        )}
      </g>
      <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(15,23,42,0.18)" strokeWidth="1.5" />
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
