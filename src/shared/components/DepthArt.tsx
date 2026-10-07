// ─────────────────────────────────────────────────────────────────────────────
// Depth slide artwork — small, original SVG characters so a Depth question looks like a
// designed classroom slide (a speaker with a speech bubble, a mascot, a brand badge)
// rather than app UI. Purely decorative: every piece is aria-hidden except the badge text.
// ─────────────────────────────────────────────────────────────────────────────

import { useId } from "react";

// The cast: eight characters, drawn in the owl's style (soft gradients, big shiny eyes, a ground shadow). A speaker's
// name picks one of them, so the same name always looks the same; two speakers on one slide never share a face.
type HairStyle = "wavy" | "fade" | "bob" | "messy" | "afro" | "spiky" | "braid" | "curls";
interface Member {
  skin: [string, string]; hair: [string, string]; shirt: [string, string]; iris: string;
  style: HairStyle; glasses?: boolean; freckles?: boolean; headband?: string; earrings?: boolean; mouth: "grin" | "smile" | "open";
}
const CAST: Member[] = [
  { skin: ["#fde3cc", "#f2c3a0"], hair: ["#d9622b", "#a63d12"], shirt: ["#2dd4bf", "#0f766e"], iris: "#2f855a", style: "wavy", freckles: true, mouth: "open" },
  { skin: ["#a9744f", "#7a4a2e"], hair: ["#2a2321", "#0f0d0c"], shirt: ["#fde047", "#ca8a04"], iris: "#4a2c17", style: "fade", mouth: "grin" },
  { skin: ["#fbe0c4", "#efc29c"], hair: ["#3b3b4f", "#14141f"], shirt: ["#a78bfa", "#6d28d9"], iris: "#3b4a8a", style: "bob", glasses: true, mouth: "smile" },
  { skin: ["#e6b58a", "#c78b5c"], hair: ["#8b5a35", "#5a3519"], shirt: ["#4ade80", "#15803d"], iris: "#2b6cb0", style: "messy", mouth: "open" },
  { skin: ["#8a5a3b", "#5e3a24"], hair: ["#2b1b14", "#0d0705"], shirt: ["#f472b6", "#be185d"], iris: "#3b2314", style: "afro", earrings: true, mouth: "grin" },
  { skin: ["#fde6d2", "#f1c8a6"], hair: ["#f4cf5f", "#c9972a"], shirt: ["#60a5fa", "#1d4ed8"], iris: "#2563eb", style: "spiky", mouth: "grin" },
  { skin: ["#c98b5f", "#9a6240"], hair: ["#231a17", "#0b0807"], shirt: ["#fb923c", "#c2410c"], iris: "#4a2c17", style: "braid", headband: "#e11d48", mouth: "smile" },
  { skin: ["#b97d55", "#8a5636"], hair: ["#2c1f18", "#0f0a07"], shirt: ["#94a3b8", "#475569"], iris: "#6b4423", style: "curls", glasses: true, mouth: "open" },
];
export const CAST_SIZE = CAST.length;

const hashName = (s: string) => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
/** Cast member for each name on a slide: stable per name, and distinct within the slide. */
export function assignCast(names: string[]): number[] {
  const taken = new Set<number>();
  return names.map((n) => {
    let m = hashName(n) % CAST.length;
    for (let k = 0; k < CAST.length && taken.has(m); k++) m = (m + 1) % CAST.length;
    taken.add(m);
    return m;
  });
}

/** One of the cast, bust-length with a ground shadow. Purely decorative. */
export function Avatar({ member, size = "4em" }: { member: number; size?: string }) {
  const uid = useId().replace(/:/g, "");
  const c = CAST[((member % CAST.length) + CAST.length) % CAST.length];
  const g = (n: string) => `url(#${n}${uid})`;
  const ink = "#1b1220";
  const rim = "rgba(255,255,255,0.35)";
  const back = (() => {
    switch (c.style) {
      case "wavy": return <path d="M27 54 C18 14 102 14 93 54 C98 72 98 90 106 100 C92 108 80 98 78 84 L42 84 C40 98 28 108 14 100 C22 90 22 72 27 54Z" fill={g("h")} />;
      case "bob": return <path d="M27 56 C18 14 102 14 93 56 L95 86 C84 92 78 84 78 74 L42 74 C42 84 36 92 25 86Z" fill={g("h")} />;
      case "afro": return <g fill={g("h")}><circle cx="60" cy="30" r="35" /><circle cx="30" cy="42" r="14" /><circle cx="90" cy="42" r="14" /></g>;
      case "braid": return <path d="M28 52 C22 16 98 16 92 52 C94 62 92 70 88 74 L32 74 C28 70 26 62 28 52Z" fill={g("h")} />;
      case "curls": return <g fill={g("h")}><circle cx="34" cy="38" r="13" /><circle cx="46" cy="25" r="14" /><circle cx="62" cy="21" r="14" /><circle cx="77" cy="26" r="14" /><circle cx="87" cy="39" r="13" /></g>;
      default: return null;
    }
  })();
  const front = (() => {
    switch (c.style) {
      case "wavy": return <path d="M29 48 C28 18 92 16 91 48 C84 36 64 30 50 38 C42 42 34 44 29 48Z" fill={g("h")} />;
      case "fade": return <path d="M30 46 C30 14 90 14 90 46 C84 33 70 29 60 29 C50 29 36 33 30 46Z" fill={g("h")} />;
      case "bob": return <path d="M28 50 C28 14 92 14 92 50 C82 40 70 36 60 36 C50 36 38 40 28 50Z" fill={g("h")} />;
      case "messy": return <path d="M29 48 C24 28 32 16 44 20 C48 10 60 12 62 20 C70 10 84 16 80 24 C92 22 96 38 91 48 C82 34 42 34 29 48Z" fill={g("h")} />;
      case "afro": return <path d="M31 44 C36 27 84 27 89 44 C78 36 42 36 31 44Z" fill={g("h")} />;
      case "spiky": return <path d="M29 48 L28 26 L40 34 L42 14 L54 28 L60 10 L68 28 L80 14 L80 34 L92 26 L91 48 C82 34 40 34 29 48Z" fill={g("h")} strokeLinejoin="round" stroke={g("h")} strokeWidth="2" />;
      case "braid": return (
        <g>
          <path d="M29 48 C28 18 92 16 91 48 C84 34 66 30 56 36 C46 40 36 42 29 48Z" fill={g("h")} />
          <path d="M84 66 C92 70 94 78 92 86 C96 94 94 104 90 110" fill="none" stroke={g("h")} strokeWidth="9" strokeLinecap="round" />
          <path d="M86 78 l6 3 M88 88 l6 3 M88 98 l6 2" stroke={c.hair[1]} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
          <circle cx="90" cy="111" r="3.4" fill="#e11d48" />
        </g>
      );
      case "curls": return <g fill={g("h")}><circle cx="38" cy="36" r="9" /><circle cx="50" cy="29" r="10" /><circle cx="64" cy="28" r="10" /><circle cx="77" cy="32" r="10" /><circle cx="84" cy="42" r="8" /></g>;
    }
  })();
  return (
    <svg viewBox="8 8 104 114" aria-hidden="true" style={{ width: size, height: size, flexShrink: 0, overflow: "visible" }}>
      <defs>
        <radialGradient id={`s${uid}`} cx="0.38" cy="0.3" r="0.85"><stop offset="0" stopColor={c.skin[0]} /><stop offset="1" stopColor={c.skin[1]} /></radialGradient>
        <linearGradient id={`h${uid}`} x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stopColor={c.hair[0]} /><stop offset="1" stopColor={c.hair[1]} /></linearGradient>
        <linearGradient id={`t${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c.shirt[0]} /><stop offset="1" stopColor={c.shirt[1]} /></linearGradient>
        <radialGradient id={`i${uid}`} cx="0.5" cy="0.3" r="0.8"><stop offset="0" stopColor={c.iris} stopOpacity="0.75" /><stop offset="1" stopColor={c.iris} /></radialGradient>
      </defs>
      <ellipse cx="60" cy="119" rx="34" ry="4.5" fill="#000" opacity="0.14" />
      {back}
      {/* torso, collar and neck */}
      <path d="M22 112 C20 90 34 80 60 80 C86 80 100 90 98 112 C98 118 90 120 60 120 C30 120 22 118 22 112Z" fill={g("t")} />
      <path d="M30 96 C36 88 46 84 52 84" fill="none" stroke={rim} strokeWidth="2.4" strokeLinecap="round" />
      <rect x="51" y="68" width="18" height="18" rx="8" fill={g("s")} />
      <path d="M51 76 Q60 84 69 76 L69 70 L51 70Z" fill="#000" opacity="0.10" />
      <path d="M46 82 Q60 96 74 82 L70 80 Q60 90 50 80Z" fill="#fff" opacity="0.9" />
      {/* ears */}
      <circle cx="30" cy="54" r="6.5" fill={g("s")} /><circle cx="90" cy="54" r="6.5" fill={g("s")} />
      <circle cx="30" cy="55" r="3" fill="#f08a8a" opacity="0.35" /><circle cx="90" cy="55" r="3" fill="#f08a8a" opacity="0.35" />
      {c.earrings && <g fill="#fbbf24" stroke="#d97706" strokeWidth="1"><circle cx="29" cy="64" r="3.4" /><circle cx="91" cy="64" r="3.4" /></g>}
      {/* head */}
      <ellipse cx="60" cy="50" rx="31" ry="30" fill={g("s")} />
      {front}
      {c.headband && <path d="M29 38 C40 28 80 28 91 38 L91 44 C80 34 40 34 29 44Z" fill={c.headband} />}
      {/* hair sheen */}
      <path d="M40 30 C48 24 62 23 72 27" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.25" />
      {/* brows */}
      <path d="M37 41 Q46 36 55 40" fill="none" stroke={c.hair[1]} strokeWidth="3.2" strokeLinecap="round" />
      <path d="M65 40 Q74 36 83 41" fill="none" stroke={c.hair[1]} strokeWidth="3.2" strokeLinecap="round" />
      {/* eyes: white, iris, pupil, two highlights */}
      {[46, 74].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="53" rx="8.6" ry="9.6" fill="#fff" />
          <ellipse cx={x} cy="54" rx="6.2" ry="7.3" fill={g("i")} />
          <ellipse cx={x} cy="54.6" rx="3.4" ry="4.1" fill={ink} />
          <circle cx={x + 2.4} cy="50.8" r="2.4" fill="#fff" /><circle cx={x - 2} cy="57.6" r="1.2" fill="#fff" opacity="0.8" />
          <path d={`M${x - 8.6} 49.5 Q${x} 42 ${x + 8.6} 49.5`} fill="none" stroke={ink} strokeWidth="2" strokeLinecap="round" />
        </g>
      ))}
      {c.freckles && <g fill="#c9703a" opacity="0.55"><circle cx="39" cy="62" r="1" /><circle cx="43" cy="64" r="1" /><circle cx="36" cy="65" r="1" /><circle cx="81" cy="62" r="1" /><circle cx="77" cy="64" r="1" /><circle cx="84" cy="65" r="1" /></g>}
      <circle cx="37" cy="63" r="5.5" fill="#ff7a8a" opacity="0.3" /><circle cx="83" cy="63" r="5.5" fill="#ff7a8a" opacity="0.3" />
      <path d="M58 60 Q60 63 62.5 61" fill="none" stroke="#000" strokeOpacity="0.28" strokeWidth="1.8" strokeLinecap="round" />
      {/* mouth */}
      {c.mouth === "smile" && <path d="M51 67 Q60 75 69 67" fill="none" stroke="#7f1d2d" strokeWidth="3" strokeLinecap="round" />}
      {c.mouth === "grin" && (
        <g><path d="M49 66 Q60 80 71 66Z" fill="#8b1d2c" /><path d="M50.5 66.4 Q60 69 69.5 66.4 L69 69 Q60 72 51 69Z" fill="#fff" /></g>
      )}
      {c.mouth === "open" && (
        <g><path d="M51 66 Q60 79 69 66Z" fill="#8b1d2c" /><ellipse cx="60" cy="73.5" rx="4.6" ry="2.6" fill="#f87171" /></g>
      )}
      {c.glasses && (
        <g fill="rgba(255,255,255,0.18)" stroke="#2a2438" strokeWidth="2.6">
          <circle cx="46" cy="53" r="12" /><circle cx="74" cy="53" r="12" /><path d="M58 52 Q60 49.5 62 52" fill="none" />
        </g>
      )}
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
