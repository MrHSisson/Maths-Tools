import { createContext, useContext, useEffect, useLayoutEffect, useState, useCallback, useRef } from "react";
import { Maximize, Minimize } from "lucide-react";
import { loadKaTeX } from "./katex";
import type { TeachHandoff } from "./lessons";
import type { DepthItem } from "./depth";
import { DepthMode } from "./components/DepthMode";
import { SfBoxRow, sfDecorFor, type SfDecor } from "./components/SfBoxRow";
import { classifySf, sfCounts, type SfKind } from "./sigFigs";

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
/** Full screen lays a slide's content out at this width (px), then scales it to the card. */
const FS_DESIGN_W = 760;
const range = (a: number, b: number) => Array.from({ length: Math.max(0, b - a) }, (_, i) => a + i);
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export type TeachCategory = "concept" | "trueFalse" | "spotMistake";

export type TeachBar = { num: number; den: number; label?: string; shade?: boolean };

export type TeachBlock =
  | { t: "text"; s: string }                       // prose; $...$ inline maths, **bold**
  | { t: "math"; s: string }                       // large centred KaTeX
  | { t: "bars"; bars: TeachBar[] }                // stacked static bar models
  | { t: "verdict"; value: boolean }               // True / False
  | { t: "note"; tone?: "good" | "bad" | "plain"; label?: string; s: string }  // clean bordered note (no emoji)
  | { t: "handoff"; buttons: { label: string; to: TeachHandoff }[] };           // buttons that move the class to a pre-set Whiteboard / Worksheet / Depth

// Scenes are grouped into representation families (see "Core representations"
// in CLAUDE.md): bar model (split, combine, equivalents), number line
// (multiples), prime factor tiles (factorTree, primeVenn). New scenes should
// extend one of the five core representations before inventing a new visual.
export type TeachScene =
  // ── bar model family ──
  | { type: "split"; num: number; den: number; factor: number; shadeByOne?: boolean; predict?: boolean }  // cut each piece into `factor`; predict hides the answer
  | { type: "combine"; a: TeachBar; b: TeachBar; sumLabel: string }
  | { type: "equivalents"; num: number; den: number; factors: number[] }  // reveal one ×factor equivalent per beat
  // ── number line family ──
  | { type: "multiples"; a: number; b: number }  // list each number's multiples one per press up to the LCM, then highlight the shared value
  // ── prime factor tiles family ──
  | { type: "factorTree"; n: number }            // build n's factor tree one split per press (smallest prime first), then state the product
  | { type: "primeVenn"; a: number; b: number }  // place each prime in the Venn one per press (shared → middle), then state the LCM
  // ── index tiles (prime factor tiles family: one tile = one copy of the base) ──
  | { type: "indexExpand"; law: "multiply" | "divide" | "power" | "expand"; base: string | number; m: number; n?: number; predict?: boolean; coefs?: number[] }  // x^m·x^n, x^m÷x^n, (x^m)^n, a^m as tiles; predict holds the result at "?" for one beat
  // ── significant figures (digit boxes; the same boxes as the Rounding tool's Identify Sig. Figs) ──
  //   count   : label each significant figure 1st, 2nd, 3rd… one per press (leading zeros greyed first, placeholders last)
  //   kinds   : name each kind of zero in turn (leading, trapped, trailing) with its rule, then the total
  //   routine : ask the three before / after questions of ONE zero (`zero` = its digit index, point not counted)
  | { type: "sigFigs"; raw: string; mode: "count" | "kinds" | "routine"; zero?: number };

/** One lesson of a tool's Teach deck (one per sub-tool topic): an ordered run of slides that ends in a hand-off. */
export interface TeachLesson {
  id: string;
  title: string;
  /** One line for the lesson card. */
  summary: string;
  /** The sub-tool tab this lesson belongs to; it is listed only on that tab. */
  tool: string;
  slides: TeachingSlide[];
}

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
/** A Depth item played inside the deck, exactly as Depth shows it: the question beat, then the answer beat (two presses). */
export interface DepthSlide {
  kind: "depth";
  category: TeachCategory;
  phase?: TeachPhase;
  title: string;
  item: DepthItem;
}
export type TeachingSlide = StaticSlide | AnimSlide | DepthSlide;


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
  // A bracket or punctuation mark touching a maths segment is glued to it (nowrap), so a line never breaks between "(" and the
  // maths inside it, or leaves a lone ")" / "." at the start of the next line.
  const parts = s.split(/([(\[]?\$[^$]+\$[)\].,:;!?]*)/g);
  const bold = (t: string, k: number) => t.split(/\*\*([^*]+)\*\*/g).map((seg, j) => (j % 2 === 1 ? <strong key={`${k}-${j}`}>{seg}</strong> : <span key={`${k}-${j}`}>{seg}</span>));
  // A single inline wrapper, not a fragment — inside flex containers, sibling
  // spans become separate flex items and their edge whitespace collapses,
  // jamming words together around every $...$ segment.
  return (
    <span style={{ display: "inline" }}>
      {parts.map((p, i) => {
        const m = i % 2 === 1 ? p.match(/^([(\[]?)\$([^$]+)\$(.*)$/) : null;
        if (!m) return bold(p, i);
        return <span key={i} style={{ whiteSpace: "nowrap" }}>{m[1]}<Tex tex={m[2]} />{m[3]}</span>;
      })}
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

// Prime factors of n in ascending order, with multiplicity: 12 → [2, 2, 3].
const primeFactorsOf = (n: number): number[] => {
  const out: number[] = [];
  let m = n;
  for (let p = 2; p * p <= m; p++) while (m % p === 0) { out.push(p); m /= p; }
  if (m > 1) out.push(m);
  return out;
};

// The three regions of a prime-factor Venn: shared primes (the gcd's factors)
// and each number's leftovers, all as multisets.
const vennParts = (a: number, b: number) => {
  const shared = primeFactorsOf(gcdOf(a, b));
  const remove = (list: number[], rem: number[]) => {
    const c = [...list];
    rem.forEach((r) => { const i = c.indexOf(r); if (i >= 0) c.splice(i, 1); });
    return c;
  };
  return { shared, aOnly: remove(primeFactorsOf(a), shared), bOnly: remove(primeFactorsOf(b), shared) };
};

// How many beats (max step index) a scene runs for.
export const sceneMaxStep = (s: TeachScene): number => {
  if (s.type === "split") return (s.shadeByOne ? s.num : 0) + s.den + 1 + (s.predict ? 1 : 0);
  if (s.type === "equivalents") return s.factors.length;                 // prompt + one per factor
  if (s.type === "multiples") { const l = lcmOf(s.a, s.b); return l / s.a + l / s.b + 1; }  // one per multiple, then the answer
  if (s.type === "factorTree") return primeFactorsOf(s.n).length;        // one per split, then the product
  if (s.type === "primeVenn") { const v = vennParts(s.a, s.b); return v.shared.length + v.aOnly.length + v.bOnly.length + 1; }  // one per prime, then the LCM
  if (s.type === "indexExpand") return indexSeq(s).length - 1;
  if (s.type === "sigFigs") return sigSeq(s).length - 1;
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
      <span className="text-2xl font-bold text-gray-500 flex-shrink-0" style={{ minWidth: "11.5rem" }}>Multiples of {n}:</span>
      <div className="flex items-baseline gap-3 flex-wrap">
        {list.map((m, i) => {
          const isCommon = m === l && commonFound;
          return (
            <span key={m}
              className="text-4xl font-semibold"
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
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
      {row(a, listA, revealedA)}
      {row(b, listB, revealedB)}
      <div className="text-gray-900" style={{ fontSize: "2.2rem", minHeight: "2.8rem", opacity: showAnswer ? 1 : 0, transition: "opacity .4s ease" }}>
        <Tex tex={`\\mathrm{LCM}(${a},\\ ${b}) = ${l}`} />
      </div>
    </div>
  );
}

// ── Prime factor tiles ────────────────────────────────────────────────────────
// Primes render as coloured square tiles, keyed by value so the same prime
// always looks the same everywhere (tree leaves, Venn regions, factor lists).
const PRIME_TILE_COLORS: Record<number, string> = {
  2: "#0284c7",   // sky-600
  3: "#059669",   // emerald-600
  5: "#d97706",   // amber-600
  7: "#9333ea",   // purple-600
  11: "#db2777",  // pink-600
  13: "#0891b2",  // cyan-600
};
const tileColor = (p: number) => PRIME_TILE_COLORS[p] ?? "#475569";

// SVG prime tile, centred on (x, y).
const svgTile = (x: number, y: number, v: number, size: number, visible: boolean, key: string) => (
  <g key={key} style={{ opacity: visible ? 1 : 0, transition: "opacity .35s ease" }}>
    <rect x={x - size / 2} y={y - size / 2} width={size} height={size} rx={6} fill={tileColor(v)} />
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={size / 2} fontWeight={700} fill="#fff">{v}</text>
  </g>
);

// "FactorTree": builds n's factor tree one split per press, always dividing
// out the smallest prime — exactly the board method. Composites are plain
// numbers; a prime is "taken as a tile" the moment it's produced (only primes
// get the tile treatment, so the visual act matches the caption). The whole
// tree is laid out from beat 0 (hidden at opacity 0) so nothing moves.
function FactorTreeScene({ n, step }: { n: number; step: number }) {
  const primes = primeFactorsOf(n);
  const splits = primes.length - 1;
  const chain: number[] = [n];                       // composites down the right-hand chain
  for (let i = 0; i < splits; i++) chain.push(chain[i] / primes[i]);
  const revealedSplits = clamp(step, 0, splits);
  const showAnswer = step >= splits + 1;

  const DX = 50, DY = 46, T = 30;
  const px = (k: number) => 90 + DX * k, py = (k: number) => 26 + DY * k;
  const W = px(splits) + 90, H = py(splits) + 34;

  const numNode = (x: number, y: number, v: number, visible: boolean, key: string) => (
    <g key={key} style={{ opacity: visible ? 1 : 0, transition: "opacity .35s ease" }}>
      <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={700} fill="#111827">{v}</text>
    </g>
  );
  const node = (x: number, y: number, v: number, isPrime: boolean, visible: boolean, key: string) =>
    isPrime ? svgTile(x, y, v, T, visible, key) : numNode(x, y, v, visible, key);
  const edge = (x1: number, y1: number, x2: number, y2: number, visible: boolean, key: string) => (
    <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth={2}
      style={{ opacity: visible ? 1 : 0, transition: "opacity .35s ease" }} />
  );

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* rendered at 1.4× the viewBox — the SVG scales crisply into the card */}
      <svg viewBox={`0 0 ${W} ${H}`} width={W * 1.4} height={H * 1.4} className="max-w-full" style={{ height: "auto" }} preserveAspectRatio="xMidYMid meet">
        {range(1, splits + 1).flatMap((k) => {
          const shown = revealedSplits >= k;
          const parX = px(k - 1), parY = py(k - 1);
          const leafX = px(k - 1) - DX, chainX = px(k), y = py(k);
          return [
            edge(parX - 10, parY + 14, leafX + 9, y - 17, shown, `el${k}`),
            edge(parX + 10, parY + 14, chainX - 9, y - 17, shown, `ec${k}`),
            node(leafX, y, primes[k - 1], true, shown, `l${k}`),
            node(chainX, y, chain[k], k === splits, shown, `c${k}`),
          ];
        })}
        {node(px(0), py(0), n, splits === 0, true, "root")}
      </svg>
      <div className="text-gray-900" style={{ fontSize: "2.1rem", minHeight: "2.7rem", opacity: showAnswer ? 1 : 0, transition: "opacity .4s ease" }}>
        <Tex tex={`${n} = ${primes.join(" \\times ")}`} />
      </div>
    </div>
  );
}

// "PrimeVenn": both factorisations are shown up front as rows of prime tiles;
// each press crosses the next tile(s) off the lists and places the prime in
// the Venn — a shared prime crosses one tile off EACH list and puts a single
// tile in the middle (the board move), then each number's leftovers go to
// their own side. The final beat multiplies everything in the diagram.
function PrimeVennScene({ a, b, step }: { a: number; b: number; step: number }) {
  const pa = primeFactorsOf(a), pb = primeFactorsOf(b);
  const { shared, aOnly, bOnly } = vennParts(a, b);
  const placements = shared.length + aOnly.length + bOnly.length;
  const placed = clamp(step, 0, placements);
  const showAnswer = step >= placements + 1;
  const all = [...shared, ...aOnly, ...bOnly].sort((x, y) => x - y);

  // Which placement (1-based) crosses off each list entry: shared placements
  // strike the first unstruck occurrence in BOTH lists, then a's leftovers
  // strike from a's list and b's from b's.
  const paStruck: number[] = new Array(pa.length).fill(Infinity);
  const pbStruck: number[] = new Array(pb.length).fill(Infinity);
  const strikeFirst = (list: number[], struck: number[], v: number, p: number) => {
    const i = list.findIndex((x, j) => x === v && struck[j] === Infinity);
    if (i >= 0) struck[i] = p;
  };
  let p = 1;
  for (const v of shared) { strikeFirst(pa, paStruck, v, p); strikeFirst(pb, pbStruck, v, p); p++; }
  for (const v of aOnly) { strikeFirst(pa, paStruck, v, p); p++; }
  for (const v of bOnly) { strikeFirst(pb, pbStruck, v, p); p++; }

  const listRow = (n: number, list: number[], struckAt: number[]) => (
    <div className="flex items-center gap-1.5">
      <span className="text-2xl font-bold text-gray-800 mr-1">{n} =</span>
      {list.map((v, i) => {
        const struck = placed >= struckAt[i];
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-gray-500 font-bold text-lg">×</span>}
            <span style={{
              position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 32, height: 32, borderRadius: 6, fontWeight: 700, fontSize: 16, color: "#fff",
              background: tileColor(v), opacity: struck ? 0.35 : 1, transition: "opacity .3s ease",
            }}>
              {v}
              {/* the cross-off slash — layered over the tile, no layout change */}
              <span style={{
                position: "absolute", inset: 0, borderRadius: 6, opacity: struck ? 1 : 0, transition: "opacity .3s ease",
                backgroundImage: "linear-gradient(to top right, transparent 44%, #1f2937 44%, #1f2937 56%, transparent 56%)",
              }} />
            </span>
          </span>
        );
      })}
    </div>
  );

  const spread = (cx: number, count: number, i: number): [number, number] =>
    [cx, 86 + (i - (count - 1) / 2) * 36];
  const chips: { x: number; y: number; v: number }[] = [
    ...shared.map((v, i) => { const [x, y] = spread(160, shared.length, i); return { x, y, v }; }),
    ...aOnly.map((v, i) => { const [x, y] = spread(74, aOnly.length, i); return { x, y, v }; }),
    ...bOnly.map((v, i) => { const [x, y] = spread(246, bOnly.length, i); return { x, y, v }; }),
  ];

  // Kept compact on purpose — factor lists + Venn + equation must all fit
  // the fixed-height slide card without scrolling.
  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div className="flex items-center justify-center gap-12 flex-wrap">
        {listRow(a, pa, paStruck)}
        {listRow(b, pb, pbStruck)}
      </div>
      {/* rendered at ~1.45× the viewBox — the Venn is the teaching object, let it fill the card */}
      <svg viewBox="0 0 320 162" width={464} height={235} className="max-w-full" style={{ height: "auto" }} preserveAspectRatio="xMidYMid meet">
        <circle cx={118} cy={86} r={66} fill="none" stroke="#334155" strokeWidth={2.5} />
        <circle cx={202} cy={86} r={66} fill="none" stroke="#334155" strokeWidth={2.5} />
        <text x={44} y={18} fontSize={16} fontWeight={700} fill="#6b7280">{a}</text>
        <text x={276} y={18} fontSize={16} fontWeight={700} fill="#6b7280" textAnchor="end">{b}</text>
        {chips.map((c, i) => svgTile(c.x, c.y, c.v, 26, i < placed, `chip${i}`))}
      </svg>
      <div className="text-gray-900" style={{ fontSize: "1.8rem", minHeight: "2.4rem", opacity: showAnswer ? 1 : 0, transition: "opacity .4s ease" }}>
        <Tex tex={`\\mathrm{LCM}(${a},\\ ${b}) = ${all.join(" \\times ")} = ${lcmOf(a, b)}`} />
      </div>
    </div>
  );
}

// ── Index tiles ───────────────────────────────────────────────────────────────
// One tile = one copy of the base. A numeric prime base uses the prime-tile colour (so 2 is the same sky tile as in a factor tree);
// letters and other bases are navy. Groups are marked by a bracket underneath; a power of a power is an n × m array.
// The beats of each law, in order (the scene's beat count is derived from this list):
export const indexSeq = (s: Extract<TeachScene, { type: "indexExpand" }>): string[] => {
  const seq =
    // with `coefs` (multiply [k1, k2] · divide [top, bottom] · power [k]) a "numbers" beat deals with the coefficients on their own
    s.law === "multiply" ? ["expr", "a", "b", ...(s.coefs ? ["numbers"] : []), "count", "result"]
    : s.law === "divide" ? ["expr", "top", "bottom", ...(s.coefs ? ["numbers"] : []), "cancel", "left", "result"]
    : s.law === "power" ? ["expr", "copies", "open", ...(s.coefs ? ["numbers"] : []), "count", "result"]
    : ["expr", "tiles", "product", "value"];
  if (s.predict) { const at = seq.findIndex((k) => k === "count" || k === "left" || k === "value"); seq.splice(at, 0, "predict"); }
  return seq;
};

/** How many tiles the scene draws at most (kept small so the picture stays readable from the back of the room). */
export const indexTileCount = (s: Extract<TeachScene, { type: "indexExpand" }>): number => {
  const n = s.n ?? 0;
  return s.law === "multiply" ? s.m + n : s.law === "divide" ? Math.max(s.m, n) * 2 : s.law === "power" ? s.m * n : s.m;
};

const idxColor = (b: string | number) => (typeof b === "number" && PRIME_TILE_COLORS[b] ? PRIME_TILE_COLORS[b] : NAVY);

function IndexExpandScene({ law, base, m, n = 0, predict = false, coefs, step }: { law: "multiply" | "divide" | "power" | "expand"; base: string | number; m: number; n?: number; predict?: boolean; coefs?: number[]; step: number }) {
  const seq = indexSeq({ type: "indexExpand", law, base, m, n, predict, coefs });
  const at = (k: string) => { const i = seq.indexOf(k); return i >= 0 && step >= i; };
  const only = (k: string) => seq[step] === k;
  const b = String(base);
  const T = 46, G = 8, P = T + G;
  const fill = idxColor(base);
  const tile = (x: number, y: number, visible: boolean, key: string, dim = false, dx = 0) => (
    <g key={key} style={{ opacity: visible ? (dim ? 0.3 : 1) : 0, transform: `translateX(${dx}px)`, transition: "opacity .35s ease, transform .7s ease" }}>
      <rect x={x} y={y} width={T} height={T} rx={8} fill={fill} />
      <text x={x + T / 2} y={y + T / 2} textAnchor="middle" dominantBaseline="central" fontSize={24} fontWeight={700} fill="#fff" fontStyle={typeof base === "string" ? "italic" : "normal"}>{b}</text>
      {dim && <line x1={x + 6} y1={y + T - 6} x2={x + T - 6} y2={y + 6} stroke="#1f2937" strokeWidth={4} strokeLinecap="round" />}
    </g>
  );
  // a coefficient is a white chip with a navy outline — it is NOT a copy of the base, so it never joins the tile count
  const chip = (x: number, y: number, v: number, visible: boolean, key: string, dim = false, dx = 0) => (
    <g key={key} style={{ opacity: visible ? (dim ? 0.3 : 1) : 0, transform: `translateX(${dx}px)`, transition: "opacity .35s ease, transform .7s ease" }}>
      <rect x={x} y={y} width={T} height={T} rx={8} fill="#fff" stroke={NAVY} strokeWidth={3} />
      <text x={x + T / 2} y={y + T / 2} textAnchor="middle" dominantBaseline="central" fontSize={v >= 100 ? 18 : 24} fontWeight={700} fill={NAVY}>{v}</text>
      {dim && <line x1={x + 6} y1={y + T - 6} x2={x + T - 6} y2={y + 6} stroke="#1f2937" strokeWidth={4} strokeLinecap="round" />}
    </g>
  );
  const brace = (x1: number, x2: number, y: number, visible: boolean, label: string, key: string) => (
    <g key={key} style={{ opacity: visible ? 1 : 0, transition: "opacity .35s ease" }}>
      <path d={`M ${x1} ${y} v 8 h ${x2 - x1} v -8`} fill="none" stroke={CUT} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <text x={(x1 + x2) / 2} y={y + 36} textAnchor="middle" fontSize={22} fontWeight={700} fill="#111827">{label}</text>
    </g>
  );
  const numbersLine = (x: number, y: number, label: string) => (
    <text x={x} y={y} textAnchor="middle" fontSize={22} fontWeight={700} fill={NAVY} style={{ opacity: at("numbers") ? 1 : 0, transition: "opacity .35s ease" }}>{label}</text>
  );
  const co = (k: number | undefined) => (k === undefined ? "" : `${k}`);

  let expr: string, result: string, svg: JSX.Element;
  if (law === "multiply") {
    const [k1, k2] = coefs ?? [];
    const c = coefs ? P : 0, midGap = 30;
    const x1 = (i: number) => 6 + c + i * P;
    const start2 = 6 + c + m * P + midGap;
    const x2 = (j: number) => start2 + c + j * P;
    const W = x2(n - 1) + T + 6 + (coefs ? 12 : 0), H = T + 70 + (coefs ? 36 : 0);
    const shuf = !!coefs && at("numbers");
    // reshuffled row: coefficient, ×, coefficient, then all the letters
    const shufX = (slot: number) => 6 + slot * P + (slot >= 1 ? 22 : 0) + (slot >= 2 ? 22 : 0);
    expr = `${co(k1)}${b}^{${m}} \\times ${co(k2)}${b}^{${n}}`;
    result = coefs
      ? `${expr} = (${k1} \\times ${k2})(${b}^{${m}} \\times ${b}^{${n}}) = ${k1 * k2}${b}^{${m + n}}`
      : `${b}^{${m}} \\times ${b}^{${n}} = ${b}^{${m + n}}`;
    svg = (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="max-w-full" style={{ height: "auto" }}>
        {/* with coefficients the tiles reshuffle on the "numbers" beat: both coefficients to the front, then every x */}
        {coefs && chip(6, 6, k1, at("a"), "c1", false, 0)}
        {range(0, m).map((i) => tile(x1(i), 6, at("a"), `t${i}`, false, shuf ? shufX(2 + i) - x1(i) : 0))}
        {coefs && chip(start2, 6, k2, at("b"), "c2", false, shuf ? shufX(1) - start2 : 0)}
        {range(0, n).map((j) => tile(x2(j), 6, at("b"), `u${j}`, false, shuf ? shufX(2 + m + j) - x2(j) : 0))}
        <text x={(x1(m - 1) + T + start2) / 2} y={6 + T / 2} textAnchor="middle" dominantBaseline="central" fontSize={26} fontWeight={700} fill="#475569" style={{ opacity: at("b") && !shuf ? 1 : 0, transition: "opacity .35s ease" }}>×</text>
        {coefs && <text x={shufX(1) + T + (shufX(2) - shufX(1) - T) / 2} y={6 + T / 2} textAnchor="middle" dominantBaseline="central" fontSize={26} fontWeight={700} fill="#475569" style={{ opacity: shuf ? 1 : 0, transition: "opacity .35s ease .35s" }}>×</text>}
        {coefs && <text x={6 + T + (shufX(1) - 6 - T) / 2} y={6 + T / 2} textAnchor="middle" dominantBaseline="central" fontSize={26} fontWeight={700} fill="#475569" style={{ opacity: shuf ? 1 : 0, transition: "opacity .35s ease .35s" }}>×</text>}
        {brace(coefs ? shufX(2) : x1(0), coefs ? shufX(1 + m + n) + T : x2(n - 1) + T, T + 14, at("count"), `${m + n} copies of ${b}`, "br")}
        {coefs && numbersLine(W / 2, T + 14 + 36 + 34, `numbers: ${k1} × ${k2} = ${k1 * k2}`)}
      </svg>
    );
  } else if (law === "divide") {
    const [kt, kb] = coefs ?? [];
    const off = coefs ? P : 0;
    const cols = Math.max(m, n), W = cols * P + 12 + off, rowTop = 6, rowBot = T + 34, H = rowBot + T + 10 + (coefs ? 40 : 0);
    const cancelled = Math.min(m, n);
    expr = `${co(kt)}${b}^{${m}} \\div ${co(kb)}${b}^{${n}}`;
    const tail = m > n ? `${b}^{${m - n}}` : m === n ? `1 = ${b}^{0}` : `\\dfrac{1}{${b}^{${n - m}}} = ${b}^{-${n - m}}`;
    result = coefs && m > n
      ? `\\dfrac{${kt}${b}^{${m}}}{${kb}${b}^{${n}}} = \\dfrac{${kt}}{${kb}} \\times \\dfrac{${b}^{${m}}}{${b}^{${n}}} = ${kt! / kb!}${b}^{${m - n}}`
      : `\\dfrac{${b}^{${m}}}{${b}^{${n}}} = ${tail}`;
    svg = (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="max-w-full" style={{ height: "auto" }}>
        {coefs && chip(6, rowTop, kt, at("top"), "ct")}
        {range(0, m).map((i) => tile(6 + off + i * P, rowTop, at("top"), `u${i}`, at("cancel") && i < cancelled))}
        <line x1={0} y1={T + 17} x2={W} y2={T + 17} stroke="#111827" strokeWidth={3} style={{ opacity: at("top") ? 1 : 0, transition: "opacity .35s ease" }} />
        {coefs && chip(6, rowBot, kb, at("bottom"), "cb")}
        {range(0, n).map((i) => tile(6 + off + i * P, rowBot, at("bottom"), `d${i}`, at("cancel") && i < cancelled))}
        {m > n && range(n, m).map((i) => <rect key={`hl${i}`} x={6 + off + i * P - 3} y={rowTop - 3} width={T + 6} height={T + 6} rx={10} fill="none" stroke={GREEN} strokeWidth={3} style={{ opacity: at("left") ? 1 : 0, transition: "opacity .35s ease" }} />)}
        {m < n && range(m, n).map((i) => <rect key={`hl${i}`} x={6 + off + i * P - 3} y={rowBot - 3} width={T + 6} height={T + 6} rx={10} fill="none" stroke={GREEN} strokeWidth={3} style={{ opacity: at("left") ? 1 : 0, transition: "opacity .35s ease" }} />)}
        {m === n && <text x={W / 2} y={T / 2 + 6} textAnchor="middle" dominantBaseline="central" fontSize={30} fontWeight={700} fill={GREEN} style={{ opacity: at("left") ? 1 : 0, transition: "opacity .35s ease" }}>nothing left: 1</text>}
        {coefs && numbersLine(W / 2, rowBot + T + 34, `numbers: ${kt} ÷ ${kb} = ${kt! / kb!}`)}
      </svg>
    );
  } else if (law === "power") {
    // (x^m)^n: the power says "write the bracket n times", so it is x^m × x^m × …, and multiplying ADDS the indices: m + m + … = m × n
    const [k] = coefs ?? [];
    const off = coefs ? P : 0;
    const gap = 34, boxW = m * P + 6 + off, W = n * boxW + (n - 1) * gap + 6, H = T + 12 + (coefs ? 50 + 36 : 8);
    const sums = Array(n).fill(m).join(" + ");
    // reshuffled row: the n coefficients (with × between), then all m·n letters
    const chipX = (i: number) => 6 + i * (P + 20);
    const tileX = (t: number) => 6 + n * P + (n - 1) * 20 + 14 + t * P;
    expr = `(${co(k)}${b}^{${m}})^{${n}}`;
    // the boxes already show the repeated bracket, so the line below only carries the indices (no coefficients) or the single answer
    result = coefs
      ? `${expr} = ${k! ** n}${b}^{${m * n}}`
      : `${expr} = ${b}^{${sums}} = ${b}^{${m * n}}`;
    svg = (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="max-w-full" style={{ height: "auto" }}>
        {range(0, n).map((r) => {
          const x0 = 3 + r * (boxW + gap);
          // with coefficients the tiles reshuffle on the "numbers" beat: the boxes fade, every coefficient moves to the front (k × k × …), then all the letters
          const shuf = !!coefs && at("numbers");
          return (
            <g key={`box${r}`}>
              <rect x={x0} y={3} width={boxW} height={T + 12} rx={12} fill="#f8fafc" stroke={CUT} strokeWidth={2.5} style={{ opacity: at("copies") && !shuf ? 1 : 0, transition: "opacity .35s ease" }} />
              <text x={x0 + boxW / 2} y={3 + (T + 12) / 2} textAnchor="middle" dominantBaseline="central" fontSize={26} fontWeight={700} fill="#111827" style={{ opacity: at("copies") && !at("open") ? 1 : 0, transition: "opacity .3s ease" }}>{`${co(k)}${b}${["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"][m] ?? ""}`}</text>
              {coefs && chip(x0 + 6, 9, k!, at("open"), `ch${r}`, false, shuf ? chipX(r) - (x0 + 6) : 0)}
              {range(0, m).map((i) => tile(x0 + 6 + off + i * P, 9, at("open"), `p${r}-${i}`, false, shuf ? tileX(r * m + i) - (x0 + 6 + off + i * P) : 0))}
              {r < n - 1 && <text x={x0 + boxW + gap / 2} y={3 + (T + 12) / 2} textAnchor="middle" dominantBaseline="central" fontSize={26} fontWeight={700} fill="#475569" style={{ opacity: at("copies") && !shuf ? 1 : 0, transition: "opacity .35s ease" }}>×</text>}
              {coefs && r === 0 && <text x={chipX(n - 1) + T + (tileX(0) - chipX(n - 1) - T) / 2} y={9 + T / 2} textAnchor="middle" dominantBaseline="central" fontSize={26} fontWeight={700} fill="#475569" style={{ opacity: shuf ? 1 : 0, transition: "opacity .35s ease .35s" }}>×</text>}
              {coefs && r < n - 1 && <text x={chipX(r) + T + 10 + (r > -1 ? 0 : 0)} y={9 + T / 2} textAnchor="middle" dominantBaseline="central" fontSize={26} fontWeight={700} fill="#475569" style={{ opacity: shuf ? 1 : 0, transition: "opacity .35s ease .35s" }}>×</text>}
            </g>
          );
        })}
        {coefs && numbersLine(W / 2, T + 12 + 32, `numbers: ${Array(n).fill(k).join(" × ")} = ${k! ** n}`)}
        {coefs && <text x={W / 2} y={T + 12 + 32 + 36} textAnchor="middle" dominantBaseline="central" fontSize={26} fontWeight={700} fill="#111827" style={{ opacity: at("count") ? 1 : 0, transition: "opacity .35s ease" }}>{`letters: ${sums} = ${m * n}`}</text>}
      </svg>
    );
  } else {
    const W = m * P + 12, H = T + 14;
    const rep = range(0, m).map(() => b).join(" \\times ");
    expr = `${b}^{${m}}`;
    if (typeof base === "number") {
      // the running product, two at a time: 4 × 4 × 4 = 16 × 4 = 64
      const links = range(2, m + 1).map((k) => (k < m ? `${base ** k} \\times ${base}` : `${base ** m}`));
      result = `${b}^{${m}} = ${rep} = ${links.join(" = ")}`;
    } else result = `${b}^{${m}} = ${rep}`;
    svg = (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="max-w-full" style={{ height: "auto" }}>
        {range(0, m).map((i) => tile(6 + i * P, 6, at("tiles"), `t${i}`))}
      </svg>
    );
  }
  const showPredict = only("predict");
  const lineHidden = law === "expand" ? !at("product") : !(at("result") || showPredict);
  const resultTex = law === "expand" ? (at("value") ? result : `${b}^{${m}} = ${range(0, m).map(() => b).join(" \\times ")}`) : showPredict ? `${expr} = \\,?` : result;
  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="text-gray-900" style={{ fontSize: "2.3rem", minHeight: "3.2rem" }}><Tex tex={expr} /></div>
      <div className="flex items-center justify-center w-full" style={{ minHeight: 40 }}>{svg}</div>
      <div className="text-gray-900" style={{ fontSize: "1.9rem", minHeight: "2.8rem", opacity: lineHidden ? 0 : 1, transition: "opacity .4s ease" }}><Tex tex={resultTex} /></div>
    </div>
  );
}

// ── Significant figures ───────────────────────────────────────────────────────
// The beats of each mode, in order (the scene's beat count is derived from this list). Keys: boxes · leading · d0, d1… (the digits that
// count) · placeholder · trapped · trailing · q1/a1 … q3/a3 (the routine) · result.
export const sigSeq = (s: Extract<TeachScene, { type: "sigFigs" }>): string[] => {
  const { cells, sig } = classifySf(s.raw);
  const kinds = new Set(cells.filter((c) => !c.sep).map((c) => (c.sep ? "" : c.kind)));
  if (s.mode === "count") return ["boxes", ...(kinds.has("lead") ? ["leading"] : []), ...sig.map((_, i) => `d${i}`), ...(kinds.has("trailingNo") ? ["placeholder"] : []), "result"];
  if (s.mode === "kinds") return ["boxes", ...(kinds.has("lead") ? ["leading"] : []), ...(kinds.has("trapped") ? ["trapped"] : []), ...(kinds.has("trailing") || kinds.has("trailingNo") ? ["trailing"] : []), "result"];
  const digits = cells.filter((c): c is Extract<typeof c, { ch: string }> => !c.sep);
  const k = digits[s.zero ?? 0]?.kind;
  return ["boxes", "q1", "a1", ...(k !== "lead" ? ["q2", "a2"] : []), ...(k === "trailing" || k === "trailingNo" ? ["q3", "a3"] : [])];
};

const ORD = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"];
const SF_KEY: Record<string, { color: string; text: (point: boolean) => string }> = {
  leading: { color: "#94a3b8", text: () => "Leading zeros: no non-zero digit before them. They do not count." },
  trapped: { color: "#16a34a", text: () => "Trapped zeros: a non-zero digit before and after. They count." },
  trailing: { color: "#d97706", text: (point) => (point ? "Trailing zeros: no non-zero digit after them, and the number has a decimal point. They count." : "Trailing zeros: no non-zero digit after them, and no decimal point. They do not count.") },
};

function SigFigsScene({ raw, mode, zero = 0, step }: { raw: string; mode: "count" | "kinds" | "routine"; zero?: number; step: number }) {
  const seq = sigSeq({ type: "sigFigs", raw, mode, zero });
  const at = (k: string) => { const i = seq.indexOf(k); return i >= 0 && step >= i; };
  const { cells, sig, hasPoint } = classifySf(raw);
  const digits = cells.filter((c): c is Extract<typeof c, { ch: string }> => !c.sep);
  // each digit's place among the significant figures (-1 when it does not count)
  let seen = -1;
  const order = digits.map((d) => (sfCounts(d.kind) ? ++seen : -1));
  const line = (key: string, text: string, color: string, bold = false) => (
    <div key={key} className="flex items-start gap-3" style={{ opacity: at(key) ? 1 : 0, transition: "opacity .35s ease", minHeight: "2rem" }}>
      <span style={{ width: 14, height: 14, borderRadius: 4, background: color, marginTop: 8, flexShrink: 0 }} />
      <span className={`text-xl ${bold ? "font-semibold text-gray-900" : "text-gray-700"}`}>{text}</span>
    </div>
  );
  const result = (
    <div className="text-center font-semibold text-gray-900" style={{ fontSize: "1.6rem", minHeight: "2.4rem", opacity: at("result") ? 1 : 0, transition: "opacity .4s ease" }}>
      {sig.length} significant figures{sig.length ? <span className="text-gray-500 font-normal">{`: ${sig.join(", ")}`}</span> : null}
    </div>
  );

  let body: JSX.Element;
  if (mode === "count") {
    const decorate = (i: number, kind: SfKind): SfDecor => {
      if (kind === "lead") return at("leading") ? { tone: "off" } : { tone: "plain" };
      if (kind === "trailingNo") return at("placeholder") ? { tone: "off" } : { tone: "plain" };
      const o = order[i];
      if (!at(`d${o}`)) return { tone: "plain" };
      return { ...sfDecorFor(kind), label: ORD[o] ?? `${o + 1}th` };
    };
    body = <>
      <SfBoxRow raw={raw} decorate={decorate} />
      <div style={{ height: "2.4rem" }} />
      {result}
    </>;
  } else if (mode === "kinds") {
    const decorate = (_i: number, kind: SfKind): SfDecor => {
      if (kind === "sig") return { tone: "sig" };
      if (kind === "lead") return at("leading") ? { tone: "off" } : { tone: "plain" };
      if (kind === "trapped") return at("trapped") ? sfDecorFor(kind) : { tone: "plain" };
      return at("trailing") ? sfDecorFor(kind) : { tone: "plain" };
    };
    body = <>
      <SfBoxRow raw={raw} decorate={decorate} />
      <div style={{ height: "1.6rem" }} />
      <div className="flex flex-col gap-1 self-center" style={{ maxWidth: 640 }}>
        {line("leading", SF_KEY.leading.text(hasPoint), SF_KEY.leading.color)}
        {line("trapped", SF_KEY.trapped.text(hasPoint), SF_KEY.trapped.color)}
        {line("trailing", SF_KEY.trailing.text(hasPoint), SF_KEY.trailing.color)}
      </div>
      {result}
    </>;
  } else {
    const target = digits[zero];
    const last = seq[seq.length - 1];
    const decorate = (i: number, kind: SfKind): SfDecor => {
      if (i === zero) return at(last) ? { ...sfDecorFor(kind), ring: true } : { tone: "plain", ring: true };
      const dashed = (at("q1") && !at("q2") && i < zero) || (at("q2") && !at("q3") && i > zero);
      return { tone: "plain", dashed };
    };
    const k = target?.kind;
    const a1 = k === "lead" ? "No: I am a leading zero. I do not count." : "Yes: so I am not a leading zero.";
    const a2 = k === "trapped" ? "Yes: I am a trapped zero. I count." : "No: so I am a trailing zero.";
    const a3 = k === "trailing" ? "Yes: so I count." : "No: so I do not count.";
    const q = (key: string, text: string, ans: string, color: string) => (
      <div key={key} className="flex flex-col gap-0.5">
        {line(`q${key}`, text, "#475569", true)}
        {line(`a${key}`, ans, color)}
      </div>
    );
    body = <>
      <SfBoxRow raw={raw} decorate={decorate} />
      <div style={{ height: "1.4rem" }} />
      <div className="flex flex-col gap-2 self-center" style={{ maxWidth: 640 }}>
        {q("1", "1. Is there a non-zero digit before me?", a1, k === "lead" ? "#94a3b8" : "#475569")}
        {k !== "lead" && q("2", "2. Is there a non-zero digit after me?", a2, k === "trapped" ? "#16a34a" : "#475569")}
        {(k === "trailing" || k === "trailingNo") && q("3", "3. Does the number have a decimal point?", a3, k === "trailing" ? "#d97706" : "#94a3b8")}
      </div>
    </>;
  }
  return <div className="flex flex-col items-stretch gap-2 w-full" style={{ minHeight: 230 }}>{body}</div>;
}

function SceneView({ scene, step }: { scene: TeachScene; step: number }) {
  if (scene.type === "split") return <SplitScene {...scene} step={step} />;
  if (scene.type === "equivalents") return <EquivalentsScene {...scene} step={step} />;
  if (scene.type === "multiples") return <MultiplesScene {...scene} step={step} />;
  if (scene.type === "factorTree") return <FactorTreeScene {...scene} step={step} />;
  if (scene.type === "primeVenn") return <PrimeVennScene {...scene} step={step} />;
  if (scene.type === "indexExpand") return <IndexExpandScene {...scene} step={step} />;
  if (scene.type === "sigFigs") return <SigFigsScene {...scene} step={step} />;
  return <CombineScene {...scene} step={step} />;
}

// ── Static blocks ─────────────────────────────────────────────────────────────

// Hand-off buttons move the class to a pre-set Whiteboard / Worksheet / Depth. The shell supplies the callback; elsewhere they are inert.
const HandoffCtx = createContext<((to: TeachHandoff) => void) | null>(null);

function BlockView({ b }: { b: TeachBlock }) {
  const onHandoff = useContext(HandoffCtx);
  if (b.t === "handoff") return (
    <div className="flex flex-wrap justify-center gap-4">
      {b.buttons.map((btn, i) => (
        <button key={i} disabled={!onHandoff} onClick={(e) => { e.stopPropagation(); onHandoff?.(btn.to); }}
          className="px-6 py-3 rounded-xl text-white font-semibold text-xl shadow-card transition-opacity disabled:opacity-40" style={{ background: NAVY }}>{btn.label}</button>
      ))}
    </div>
  );
  if (b.t === "text") return <p className="text-2xl text-gray-700 text-center leading-relaxed"><RichText s={b.s} /></p>;
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
export const slideMaxStep = (s: TeachingSlide) => (s.kind === "anim" ? sceneMaxStep(s.scene) : s.kind === "depth" ? 1 : s.reveal ? 1 : 0);

// ── SlideDeck — plays a flat slide array, one beat per press ──────────────────
// The reusable core of the Teach deck: TeachingDeck uses it after a category is
// chosen, and the skill-library overlay (src/shared/skills) plays a skill's
// slides through it directly. Owns its own slide/beat state and keyboard
// handling (→/space/Enter advance, ← back, Esc → onEscape).
export function SlideDeck({ slides, color, onEscape, onDone, doneLabel, fill }: {
  slides: TeachingSlide[];
  color: string;
  onEscape?: () => void;
  /** When provided, the Next button becomes "Done" on the last beat and fires
   *  this instead of disabling — used by the skill overlay to close itself. */
  onDone?: () => void;
  /** Label for that last-beat button (default "Done"). */
  doneLabel?: string;
  /** Fill the parent's height instead of the default 62vh card — used when the
   *  host (e.g. the near-fullscreen skill overlay) owns the sizing. */
  fill?: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const [step, setStep] = useState(0);
  // Full screen: an overlay that works everywhere, plus native fullscreen where the browser allows. It ends by itself when the deck is
  // unmounted (a hand-off, or the lesson moving on to Whiteboard / Worksheet / Depth).
  const [present, setPresent] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!present) return;
    const el = wrapRef.current as (HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> }) | null;
    try { void (el?.requestFullscreen?.() ?? el?.webkitRequestFullscreen?.())?.catch?.(() => {}); } catch { /* the overlay is enough */ }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onFs = () => { if (!document.fullscreenElement) setPresent(false); };
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      document.body.style.overflow = prevOverflow;
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    };
  }, [present]);
  const [controlsHost, setControlsHost] = useState<HTMLElement | null>(null);
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
      else if (e.key === "Escape") { if (present) setPresent(false); else onEscape?.(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [goNext, goPrev, onEscape, present]);

  const slide = slides[idx];

  // ── Fit-to-card scaling ──────────────────────────────────────────────────
  // Scenes are authored at a generous fixed size; on smaller screens the
  // content is scaled DOWN (CSS transform) to fit the card's content area.
  // There are never scrollbars in a slide. offsetHeight ignores transforms,
  // so the natural size can be measured without neutralising the scale.
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  useLayoutEffect(() => {
    const recompute = () => {
      const o = outerRef.current, n = innerRef.current;
      if (!o || !n) return;
      const availH = o.clientHeight, availW = o.clientWidth, natH = n.offsetHeight;
      if (!availH || !natH) return;
      // Content is laid out at ONE design width and scaled to the card on both axes, so every slide has the same type sizes and
      // proportions on any screen (a laptop gets a proportionally smaller slide, not a more cramped one), and it never spills past
      // the card's edges. (The skill overlay, `fill`, keeps its old scale-down-only behaviour.)
      const s = fill ? Math.min(1, (availH * 0.99) / natH) : Math.min(2.4, availW / FS_DESIGN_W, (availH * 0.99) / natH);
      setFitScale((prev) => (Math.abs(prev - s) > 0.01 ? s : prev));
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    if (outerRef.current) ro.observe(outerRef.current);
    if (innerRef.current) ro.observe(innerRef.current);
    return () => ro.disconnect();
  }, [idx, present, fill]);

  if (!slide) return null;
  const maxStep = slideMaxStep(slide);
  const atEnd = step >= maxStep;
  const atLast = atEnd && idx === slides.length - 1;
  const isAnim = slide.kind === "anim";
  const capIdx = isAnim ? Math.min(step, (slide as AnimSlide).steps.length - 1) : 0;

  const goDone = () => { setPresent(false); onDone?.(); };
  const navRow = (
    <div className="flex items-center justify-between flex-shrink-0 pt-1 gap-2" onClick={(e) => e.stopPropagation()}>
      <button onClick={goPrev} disabled={idx === 0 && step === 0}
        className={`px-4 py-1.5 rounded-lg border font-semibold text-sm transition-colors ${idx === 0 && step === 0 ? "border-slate-100 text-slate-300 cursor-default" : "border-slate-200 text-slate-600 bg-white hover:border-blue-900 hover:text-blue-900"}`}>← Back</button>
      <div className="flex items-center gap-3">
        {slide.kind === "depth" && <span ref={setControlsHost} className="flex items-center" />}
        <span className="font-semibold text-sm text-center" style={{ color, minWidth: "3.5rem", visibility: isAnim ? "visible" : "hidden" }}>{step + 1} / {maxStep + 1}</span>
        {!fill && (
          <button onClick={() => setPresent((v) => !v)} className={`px-3 py-1.5 rounded-lg border font-semibold text-sm flex items-center gap-1.5 transition-colors ${"border-slate-200 text-slate-600 bg-white hover:border-blue-900 hover:text-blue-900"}`}>
            {present ? <><Minimize size={14} /> Exit full screen</> : <><Maximize size={14} /> Full screen</>}
          </button>
        )}
      </div>
      <button onClick={() => { if (atLast) goDone(); else goNext(); }} disabled={atLast && !onDone}
        className="px-5 py-1.5 rounded-lg text-white font-semibold text-sm transition-opacity"
        style={{ background: color, opacity: atLast && !onDone ? 0.4 : 1 }}>
        {atLast ? (doneLabel ?? "Done") : "Next ▸"}
      </button>
    </div>
  );

  // Every slide is the same 16:9 shape. The slot's width is set from the height budget (stage/card + Feathers row + Back/Next),
  // so a card, a scene and a Depth stage are identical in size, and full screen is the same slide, bigger.
  const slotW = fill ? "100%" : present ? "min(100%, calc((100vh - 6rem) * 16 / 9))" : "min(100%, calc((100vh - 20rem) * 16 / 9))";
  // The slide area has one fixed height (the 16:9 card + a strip for Depth's Feathers / Teacher notes buttons), so the Back / Full
  // screen / Next row is in exactly the same place on every slide.

  const cardEl = slide.kind === "depth" ? (
    <DepthMode key={slide.item.id} items={[slide.item]} level={slide.item.level} onLevelChange={() => {}} itemId={slide.item.id} onItemChange={() => {}} embedded={{ slide: step >= 1 ? 1 : 0, controlsHost }} />
  ) : (
    <div onClick={isAnim ? goNext : undefined} className={`relative bg-white rounded-2xl border border-slate-200 shadow-card px-8 pt-5 pb-4 flex flex-col ${isAnim ? "cursor-pointer" : ""}`}
      style={{ borderTop: `3px solid ${color}`, overflow: "hidden", ...(fill ? { height: "100%" } : { height: "calc(100cqw * 0.5625)" }) }}>
      <h2 className="text-xl font-semibold text-slate-500 leading-snug flex-shrink-0"><RichText s={slide.title} /></h2>

      <div ref={outerRef} className="flex-1" style={{ minHeight: 0, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div key={idx} ref={innerRef} className={`${fill ? "w-full " : ""}flex flex-col items-center gap-5 py-1`}
            style={{ flexShrink: 0, ...(fill ? {} : { width: FS_DESIGN_W }), transform: `scale(${fitScale})`, transformOrigin: "center center" }}>
          {isAnim ? (
            <>
              <SceneView scene={(slide as AnimSlide).scene} step={step} />
              <div className="w-full max-w-2xl px-2" style={{ display: "grid" }}>
                {(slide as AnimSlide).steps.map((cap, i) => (
                  // Incoming caption fades in; outgoing ones vanish instantly — a cross-fade superimposes both texts for the fade duration.
                  <div key={i} className="flex items-center justify-center text-2xl text-gray-800 text-center"
                    style={{ gridArea: "1 / 1", opacity: i === capIdx ? 1 : 0, transition: i === capIdx ? "opacity .3s ease" : "none" }}>
                    <RichText s={cap} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="w-full flex flex-col gap-5 items-stretch">
              {(slide as StaticSlide).body?.map((b, i) => <BlockView key={i} b={b} />)}
              {(slide as StaticSlide).reveal && (
                <div className="relative">
                  <div className="flex flex-col gap-4 pt-4 border-t border-gray-200"
                    style={{ opacity: step >= 1 ? 1 : 0, transition: "opacity .35s ease", pointerEvents: step >= 1 ? "auto" : "none" }}>
                    {(slide as StaticSlide).reveal!.map((b, i) => <BlockView key={i} b={b} />)}
                  </div>
                  {step < 1 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button onClick={() => setStep(1)} className="px-6 py-2.5 rounded-xl text-white font-semibold text-lg shadow-card" style={{ background: color }}>
                        {(slide as StaticSlide).revealLabel ?? "Reveal"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
      {fill && navRow}
    </div>
  );

  // The card is the same shape every time and every beat's content is laid out from the first press (captions share one grid cell
  // sized to the tallest, a reveal reserves its space), so nothing resizes mid-slide. Content that would exceed the card scales down
  // to fit — never scrollbars — and in full screen it may scale up. The Back / Full screen / Next row sits under the card.
  return (
    <div ref={wrapRef} className={present ? "flex flex-col items-center justify-center" : ""}
      style={present ? { position: "fixed", inset: 0, zIndex: 1000, background: "#eef2f7", padding: "1rem", overflowY: "auto" } : fill ? { height: "100%" } : undefined}>
      <div style={{ width: slotW, margin: "0 auto", height: fill ? "100%" : undefined, containerType: fill ? undefined : "inline-size" } as React.CSSProperties}>
        <div style={fill ? { height: "100%" } : { height: "calc(100cqw * 0.5625)" }}>{cardEl}</div>
        {!fill && <div className="mt-1">{navRow}</div>}
      </div>
    </div>
  );
}

export function TeachingDeck({ slides, lessons, tool, onHandoff, initialLesson, onFinish }: {
  slides?: TeachingSlide[];
  /** Lessons, one per sub-tool topic; when given they replace the category menu (only those on `tool` are listed). */
  lessons?: TeachLesson[];
  tool?: string;
  onHandoff?: (to: TeachHandoff) => void;
  /** Open this lesson straight away (a lesson step's link). */
  initialLesson?: string;
  /** Called by the last slide's button (a running lesson moves on to its next step). */
  onFinish?: () => void;
}) {
  const [ready, setReady] = useState(!!w().katex);
  const [cat, setCat] = useState<TeachCategory | null>(null);
  const [lessonId, setLessonId] = useState<string | null>(initialLesson ?? null);

  useEffect(() => {
    if (!w().katex) loadKaTeX().then(() => setReady(true)).catch(() => setReady(true));
    else setReady(true);
  }, []);

  const toMenu = useCallback(() => { setCat(null); setLessonId(null); }, []);

  if (!ready) return <div className="text-center text-gray-400 py-16">Loading…</div>;

  // ── Lesson menu / lesson ──
  if (lessons?.length) {
    const here = lessons.filter((l) => !tool || l.tool === tool);
    const lesson = here.find((l) => l.id === lessonId);
    if (lesson) {
      return (
        <HandoffCtx.Provider value={onHandoff ?? null}>
          <div className="flex flex-col gap-2">
            {!initialLesson && (
              <div className="relative flex items-center h-9">
                <button onClick={toMenu} className="absolute left-0 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:border-blue-900 hover:text-blue-900 transition-colors">← Lessons</button>
                <span className="mx-auto text-xs font-semibold uppercase tracking-widest" style={{ color: NAVY }}>{lesson.title}</span>
              </div>
            )}
            <SlideDeck key={lesson.id} slides={lesson.slides} color={NAVY} onEscape={initialLesson ? undefined : toMenu} onDone={onFinish} doneLabel={onFinish ? "Next step ▸" : undefined} />
          </div>
        </HandoffCtx.Provider>
      );
    }
    if (!here.length) return <div className="text-center text-slate-500 py-16">There is no Teach lesson on this tab yet.</div>;
    return (
      <div className="flex flex-col gap-4">
        {here.map((l) => (
          <button key={l.id} onClick={() => setLessonId(l.id)}
            className="bg-white rounded-2xl border border-slate-300 shadow-card p-6 flex items-center justify-between gap-4 text-left transition-all hover:shadow-lift hover:-translate-y-0.5">
            <span className="min-w-0">
              <span className="flex items-center gap-3 text-xl font-semibold text-slate-900"><span className="w-2.5 h-2.5 rounded-full" style={{ background: NAVY }} />{l.title}</span>
              <span className="block text-slate-600 mt-1">{l.summary}</span>
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider shrink-0" style={{ color: NAVY }}>{`${l.slides.length} slides`}</span>
          </button>
        ))}
      </div>
    );
  }

  const all = slides ?? [];

  // ── Menu ──
  if (!cat) {
    return (
      <div className="flex flex-col gap-4">
        {CATEGORY.map((c) => {
          const count = all.filter((s) => s.category === c.key).length;
          const disabled = count === 0;
          return (
            <button key={c.key} disabled={disabled} onClick={() => setCat(c.key)}
              className={`bg-white rounded-2xl border border-slate-200 shadow-card p-6 flex items-center justify-between text-left transition-all ${disabled ? "opacity-60 cursor-default" : "hover:shadow-lift hover:-translate-y-0.5"}`}
              >
              <span className="flex items-center gap-3 text-xl font-semibold" style={{ color: disabled ? "#9ca3af" : "#0f172a" }}><span className="w-2.5 h-2.5 rounded-full" style={{ background: disabled ? "#d1d5db" : c.color }} />{c.label}</span>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: disabled ? "#9ca3af" : c.color }}>
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
    <div className="flex flex-col gap-2">
      <div className="relative flex items-center h-9">
        <button onClick={toMenu} className="absolute left-0 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:border-blue-900 hover:text-blue-900 transition-colors">← Menu</button>
        <span className="mx-auto text-xs font-semibold uppercase tracking-widest" style={{ color }}>{catMeta(cat).label}</span>
      </div>
      <SlideDeck key={cat} slides={all.filter((s) => s.category === cat)} color={color} onEscape={toMenu} />
    </div>
  );
}
