// ─────────────────────────────────────────────────────────────────────────────
// Depth slide artwork — small, original SVG characters so a Depth question looks like a
// designed classroom slide (a speaker with a speech bubble, a mascot, a brand badge)
// rather than app UI. Purely decorative: every piece is aria-hidden except the badge text.
// ─────────────────────────────────────────────────────────────────────────────

import { useId } from "react";

// The cast: eight characters, drawn in the owl's style (soft gradients, big shiny eyes, a ground shadow). A speaker's
// name picks one of them, so the same name always looks the same; two speakers on one slide never share a face.
// They are meant to look like ordinary, varied pupils and teachers: natural hair and colours, nothing that draws the eye.
type HairStyle = "wavy" | "fade" | "bob" | "sidepart" | "coils" | "long" | "curls";
type Top = "crew" | "polo" | "hoodie" | "cardigan" | "stripe";
interface Member {
  skin: [string, string]; hair: [string, string]; shirt: [string, string]; iris: string;
  style: HairStyle; top: Top; glasses?: boolean; freckles?: boolean; lashes?: boolean; mouth: "grin" | "smile" | "open";
}
const CAST: Member[] = [
  { skin: ["#fde3cc", "#f0c19c"], hair: ["#9a4a26", "#5f2a12"], shirt: ["#3aa6a0", "#1f6f6b"], iris: "#3f7d58", style: "wavy", top: "crew", freckles: true, lashes: true, mouth: "open" },
  { skin: ["#a9744f", "#7a4a2e"], hair: ["#2e2522", "#120e0d"], shirt: ["#e0b040", "#a87a16"], iris: "#4a2c17", style: "fade", top: "hoodie", mouth: "grin" },
  { skin: ["#fbe0c4", "#efc29c"], hair: ["#2b2d42", "#0f1020"], shirt: ["#9a7bd0", "#65469c"], iris: "#3b4a8a", style: "bob", top: "cardigan", glasses: true, lashes: true, mouth: "smile" },
  { skin: ["#e3b48a", "#c58a5c"], hair: ["#7a5230", "#4a2f18"], shirt: ["#4f9d69", "#2d6a45"], iris: "#2b6cb0", style: "sidepart", top: "polo", mouth: "open" },
  { skin: ["#8a5a3b", "#5e3a24"], hair: ["#2b1b14", "#0d0705"], shirt: ["#d9738f", "#a8456a"], iris: "#3b2314", style: "coils", top: "stripe", lashes: true, mouth: "grin" },
  { skin: ["#fde6d2", "#f0c8a6"], hair: ["#c9a35a", "#8e6e2c"], shirt: ["#5b8fd6", "#35609e"], iris: "#2f6fb2", style: "sidepart", top: "hoodie", mouth: "grin" },
  { skin: ["#c98b5f", "#9a6240"], hair: ["#261c18", "#0b0807"], shirt: ["#de8a5a", "#b05a2c"], iris: "#4a2c17", style: "long", top: "polo", lashes: true, mouth: "smile" },
  { skin: ["#b97d55", "#8a5636"], hair: ["#2c1f18", "#0f0a07"], shirt: ["#8795a8", "#4f5d70"], iris: "#6b4423", style: "curls", top: "cardigan", glasses: true, mouth: "open" },
];
export const CAST_SIZE = CAST.length;
/** The cast's names, in the same order as `CAST`. Depth items name their speakers from this list. */
export const CAST_NAMES = ["Ruby", "Kofi", "Mei", "Ben", "Amara", "Leo", "Priya", "Jamal"] as const;
/** The owl's name. */
export const MASCOT_NAME = "Feathers";

const hashName = (s: string) => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
/** Cast member for each name on a slide: a cast name picks its own character, any other name a stable one; distinct within the slide. */
export function assignCast(names: string[]): number[] {
  const taken = new Set<number>();
  return names.map((n) => {
    const own = CAST_NAMES.findIndex((c) => c.toLowerCase() === n.trim().toLowerCase());   // a cast member's own name
    let m = own >= 0 ? own : hashName(n) % CAST.length;
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
  const strand = c.hair[1];
  const lines = (d: string) => <path d={d} fill="none" stroke={strand} strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />;
  const back = (() => {
    switch (c.style) {
      case "wavy": return <path d="M27 54 C18 14 102 14 93 54 C97 70 97 88 103 98 C91 106 80 98 78 84 L42 84 C40 98 29 106 17 98 C23 88 23 70 27 54Z" fill={g("h")} />;
      case "bob": return <path d="M27 56 C18 14 102 14 93 56 L95 86 C84 92 78 84 78 74 L42 74 C42 84 36 92 25 86Z" fill={g("h")} />;
      case "coils": return <g fill={g("h")}><circle cx="60" cy="31" r="27" /><circle cx="34" cy="43" r="11" /><circle cx="86" cy="43" r="11" /></g>;
      case "long": return <path d="M27 54 C18 14 102 14 93 54 L97 100 C88 104 80 96 78 86 L42 86 C40 96 32 104 23 100Z" fill={g("h")} />;
      case "curls": return <g fill={g("h")}><circle cx="35" cy="39" r="11" /><circle cx="47" cy="27" r="12" /><circle cx="61" cy="23" r="12" /><circle cx="75" cy="27" r="12" /><circle cx="86" cy="39" r="11" /></g>;
      default: return null;
    }
  })();
  const front = (() => {
    switch (c.style) {
      case "wavy": return <g><path d="M29 48 C25 5 95 5 91 48 C84 36 64 30 50 38 C42 42 34 44 29 48Z" fill={g("h")} />{lines("M40 30 C46 26 56 25 64 27")}{lines("M33 46 C38 42 44 40 48 38")}</g>;
      case "fade": return <g><path d="M30 46 C27 6 93 6 90 46 C84 33 70 29 60 29 C50 29 36 33 30 46Z" fill={g("h")} />{lines("M42 24 C50 21 62 21 72 25")}</g>;
      case "bob": return <g><path d="M28 50 C24 4 96 4 92 50 C82 40 70 36 60 36 C50 36 38 40 28 50Z" fill={g("h")} />{lines("M38 28 C46 23 58 22 70 25")}</g>;
      case "sidepart": return <g><path d="M29 48 C25 4 95 4 91 46 C86 35 76 27 58 27 C46 27 38 35 33 46 Z" fill={g("h")} />{lines("M52 27 C50 33 46 37 41 40")}{lines("M62 26 C74 26 84 32 88 42")}</g>;
      case "coils": return <path d="M30 46 C26 6 94 6 90 46 C80 36 40 36 30 46Z" fill={g("h")} />;
      case "long": return <g><path d="M29 48 C25 5 95 5 91 46 C86 35 76 27 58 27 C46 27 38 35 33 46Z" fill={g("h")} />{lines("M52 27 C50 33 46 37 41 40")}{lines("M62 26 C74 26 84 32 88 42")}</g>;
      case "curls": return <g fill={g("h")}><path d="M30 46 C26 8 94 8 90 46 C80 36 40 36 30 46Z" /><circle cx="39" cy="35" r="9" /><circle cx="51" cy="29" r="10" /><circle cx="64" cy="28" r="10" /><circle cx="76" cy="32" r="10" /><circle cx="83" cy="42" r="7" /></g>;
    }
  })();
  const top = (() => {
    const wh = "#fff";
    switch (c.top) {
      case "crew": return <g><path d="M46 81 Q60 92 74 81" fill="none" stroke="#000" strokeOpacity="0.2" strokeWidth="5" strokeLinecap="round" /><path d="M44 80 Q60 94 76 80" fill="none" stroke={c.shirt[0]} strokeWidth="3" strokeLinecap="round" opacity="0.8" /></g>;
      case "polo": return <g><path d="M46 80 L56 94 L60 82Z M74 80 L64 94 L60 82Z" fill={wh} stroke="#000" strokeOpacity="0.12" strokeWidth="1" strokeLinejoin="round" /><path d="M60 84 L60 106" stroke="#000" strokeOpacity="0.18" strokeWidth="1.5" /><circle cx="60" cy="92" r="1.6" fill="#000" opacity="0.28" /><circle cx="60" cy="100" r="1.6" fill="#000" opacity="0.28" /></g>;
      case "hoodie": return <g><path d="M38 84 C44 96 76 96 82 84 C76 82 70 80 60 80 C50 80 44 82 38 84Z" fill={c.shirt[1]} opacity="0.55" /><path d="M54 92 L53 106 M66 92 L67 106" stroke={wh} strokeWidth="2" strokeLinecap="round" opacity="0.9" /><path d="M32 112 Q60 118 88 112" fill="none" stroke="#000" strokeOpacity="0.12" strokeWidth="1.5" /></g>;
      case "cardigan": return <g><path d="M46 80 Q60 92 74 80 L72 120 L48 120Z" fill={wh} opacity="0.92" /><path d="M48 82 L47 119 M72 82 L73 119" stroke={c.shirt[1]} strokeWidth="2.4" strokeLinecap="round" opacity="0.9" /><circle cx="55" cy="96" r="1.5" fill={c.shirt[1]} /><circle cx="55" cy="106" r="1.5" fill={c.shirt[1]} /></g>;
      case "stripe": return <g stroke={wh} strokeWidth="3" opacity="0.55"><path d="M26 98 Q60 92 94 98" fill="none" /><path d="M24 107 Q60 101 96 107" fill="none" /><path d="M46 81 Q60 90 74 81" fill="none" strokeOpacity="0.9" /></g>;
    }
  })();
  return (
    <svg viewBox="8 8 104 114" aria-hidden="true" style={{ width: size, height: size, flexShrink: 0, overflow: "visible" }}>
      <defs>
        <radialGradient id={`s${uid}`} cx="0.38" cy="0.3" r="0.85"><stop offset="0" stopColor={c.skin[0]} /><stop offset="1" stopColor={c.skin[1]} /></radialGradient>
        <linearGradient id={`h${uid}`} x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stopColor={c.hair[0]} /><stop offset="1" stopColor={c.hair[1]} /></linearGradient>
        <linearGradient id={`t${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c.shirt[0]} /><stop offset="1" stopColor={c.shirt[1]} /></linearGradient>
        <clipPath id={`m${uid}`}><path d="M51 66 Q60 79 69 66Z" /></clipPath>
        <radialGradient id={`i${uid}`} cx="0.5" cy="0.3" r="0.8"><stop offset="0" stopColor={c.iris} stopOpacity="0.75" /><stop offset="1" stopColor={c.iris} /></radialGradient>
      </defs>
      <ellipse cx="60" cy="119" rx="34" ry="4.5" fill="#000" opacity="0.14" />
      {back}
      {/* torso, with the top's own details */}
      <path d="M22 112 C20 90 34 80 60 80 C86 80 100 90 98 112 C98 118 90 120 60 120 C30 120 22 118 22 112Z" fill={g("t")} />
      <path d="M30 96 C36 88 46 84 52 84" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="51" y="68" width="18" height="18" rx="8" fill={g("s")} />
      <path d="M51 76 Q60 85 69 76 L69 70 L51 70Z" fill="#000" opacity="0.12" />
      {top}
      {/* ears */}
      <circle cx="30" cy="54" r="6.5" fill={g("s")} /><circle cx="90" cy="54" r="6.5" fill={g("s")} />
      <path d="M28 52 Q31 54 29 58 M92 52 Q89 54 91 58" fill="none" stroke="#000" strokeOpacity="0.15" strokeWidth="1.2" strokeLinecap="round" />
      {/* head, with a soft chin shadow and forehead light */}
      <ellipse cx="60" cy="50" rx="31" ry="30" fill={g("s")} />
      <path d="M32 62 C36 84 84 84 88 62 C80 76 40 76 32 62Z" fill="#000" opacity="0.07" />
      {front}
      {/* brows */}
      <path d="M37 41 Q46 36 55 40" fill="none" stroke={c.hair[1]} strokeWidth="3" strokeLinecap="round" />
      <path d="M65 40 Q74 36 83 41" fill="none" stroke={c.hair[1]} strokeWidth="3" strokeLinecap="round" />
      {/* eyes: white, iris, pupil, two highlights, lid line */}
      {[46, 74].map((x, k) => (
        <g key={x}>
          <ellipse cx={x} cy="53" rx="8.6" ry="9.6" fill="#fff" />
          <ellipse cx={x} cy="54" rx="6.2" ry="7.3" fill={g("i")} />
          <ellipse cx={x} cy="54.6" rx="3.4" ry="4.1" fill={ink} />
          <circle cx={x + 2.4} cy="50.8" r="2.4" fill="#fff" /><circle cx={x - 2} cy="57.6" r="1.2" fill="#fff" opacity="0.8" />
          <path d={`M${x - 8.6} 49.5 Q${x} 42 ${x + 8.6} 49.5`} fill="none" stroke={ink} strokeWidth="2" strokeLinecap="round" />
          {c.lashes && <path d={k === 0 ? `M${x - 8.6} 49.5 l-2.6 -2 M${x - 7.4} 47.4 l-2.2 -2.4` : `M${x + 8.6} 49.5 l2.6 -2 M${x + 7.4} 47.4 l2.2 -2.4`} stroke={ink} strokeWidth="1.4" strokeLinecap="round" fill="none" />}
        </g>
      ))}
      {c.freckles && <g fill="#b9683a" opacity="0.5"><circle cx="39" cy="62" r="1" /><circle cx="43" cy="64" r="1" /><circle cx="36" cy="65" r="1" /><circle cx="81" cy="62" r="1" /><circle cx="77" cy="64" r="1" /><circle cx="84" cy="65" r="1" /></g>}
      <circle cx="37" cy="63" r="5.5" fill="#ff7a8a" opacity="0.26" /><circle cx="83" cy="63" r="5.5" fill="#ff7a8a" opacity="0.26" />
      {/* nose: bridge light, tip and nostrils */}
      <ellipse cx="59" cy="55" rx="1.6" ry="3" fill="#fff" opacity="0.2" />
      <path d="M57.4 60 Q60 63.6 63 60.4" fill="none" stroke="#000" strokeOpacity="0.3" strokeWidth="1.8" strokeLinecap="round" />
      {/* mouth */}
      {c.mouth === "smile" && <g><path d="M51 67 Q60 75 69 67" fill="none" stroke="#7f1d2d" strokeWidth="3" strokeLinecap="round" /><path d="M54 71.4 Q60 74 66 71.4" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" /></g>}
      {c.mouth === "grin" && <g><path d="M49 66 Q60 80 71 66Z" fill="#8b1d2c" /><path d="M50.5 66.4 Q60 69 69.5 66.4 L69 69 Q60 72 51 69Z" fill="#fff" /></g>}
      {c.mouth === "open" && <g><path d="M51 66 Q60 79 69 66Z" fill="#8b1d2c" /><g clipPath={`url(#m${uid})`}><ellipse cx="60" cy="73.6" rx="5" ry="3.2" fill="#f87171" /></g></g>}
      {c.glasses && (
        <g fill="rgba(255,255,255,0.14)" stroke="#2a2438" strokeWidth="2.2">
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
