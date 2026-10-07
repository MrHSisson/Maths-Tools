// ─────────────────────────────────────────────────────────────────────────────
// BIDMAS pyramid — the aide-mémoire students are given for the order of operations.
//
//        B ( )
//        I ² ³
//     D ÷ & M ×       ← ONE tile: equal priority, so work left to right ALONG THE EXPRESSION
//     A + & S −       ← ONE tile: the order here is not an order of working
//
// Each of these two tiers used to be split in half by a vertical rule. Students read the halves as a
// sequence (A is left of S, so add first) and followed the acronym's letters; so the tier is now a single
// tile with an "&" between its operations and a reminder that "left to right" is the order they appear in the
// QUESTION, not the order they sit on the pyramid.
//
// A KEY, not a working representation (it carries no quantities), so it is not one of
// the six core representations. It can be shown plain (a whiteboard scaffold) or with
// tiers lit to show where a step of the working is: `strong` tiers are the move being
// made now; `soft` tiers are its equal-priority partner or the operation inside a bracket.
// ─────────────────────────────────────────────────────────────────────────────

export type PyramidTier = "B" | "I" | "D" | "M" | "A" | "S";

export interface BidmasPyramidProps {
  /** Tiers lit strongly (the move being made now). */
  strong?: PyramidTier[];
  /** Tiers lit softly (the equal-priority partner, or the operation inside a bracket). */
  soft?: PyramidTier[];
  /** Maximum rendered width in px (the SVG scales down to its container). */
  maxWidth?: number;
}

const APEX_Y = 6;
const BASE_Y = 250;
const HALF = 190;
const CX = 200;
const hw = (y: number) => (HALF * (y - APEX_Y)) / (BASE_Y - APEX_Y);

// Tier boundaries (top of B → base). B is the tallest-narrowest tier, so it is given extra height
// to hold "B ( )" inside the triangle.
const Y = [APEX_Y, 76, 130, 190, BASE_Y];

const NAVY = "#1e3a8a";
const LETTER = "#dc2626";
const SYMBOL = "#2563eb";
const STRONG = "#fde68a";
const SOFT = "#fef3c7";

type Pts = [number, number][];
const full = (y1: number, y2: number): Pts => [[CX - hw(y1), y1], [CX + hw(y1), y1], [CX + hw(y2), y2], [CX - hw(y2), y2]];
const toStr = (p: Pts) => p.map(([x, y]) => `${x},${y}`).join(" ");

// B and I are one centred text each (letter + its symbols as tspans). D M and A S are ONE tile each holding both
// operations with an "&" between them, so the pair can never read as a sequence.
interface TierDef { tier: PyramidTier; pts: Pts; letter: string; sym: string; x: number; y: number; symSize: number; letterSize?: number }

const SINGLE: TierDef[] = [
  { tier: "B", pts: full(Y[0], Y[1]), letter: "B", sym: "( )", x: CX, y: 68, symSize: 24, letterSize: 30 },
  { tier: "I", pts: full(Y[1], Y[2]), letter: "I", sym: "² ³", x: CX, y: 118, symSize: 30 },
];

interface PairDef { a: PyramidTier; b: PyramidTier; pts: Pts; la: string; sa: string; lb: string; sb: string; y: number; capY: number }
const PAIRS: PairDef[] = [
  { a: "D", b: "M", pts: full(Y[2], Y[3]), la: "D", sa: "÷", lb: "M", sb: "×", y: 168, capY: 184 },
  { a: "A", b: "S", pts: full(Y[3], Y[4]), la: "A", sa: "+", lb: "S", sb: "−", y: 228, capY: 244 },
];

const NAMES: Record<PyramidTier, string> = { B: "Brackets", I: "Indices", D: "Division", M: "Multiplication", A: "Addition", S: "Subtraction" };

export function BidmasPyramid({ strong = [], soft = [], maxWidth = 420 }: BidmasPyramidProps) {
  const label = `BIDMAS pyramid: Brackets, Indices, then Division and Multiplication together (equal priority, done left to right as written), then Addition and Subtraction together (also equal priority)${
    strong.length ? `. Now: ${strong.map((t) => NAMES[t]).join(" and ")}` : ""
  }`;
  return (
    <svg
      viewBox="0 0 400 256"
      role="img"
      aria-label={label}
      style={{ display: "block", width: "100%", maxWidth, height: "auto", margin: "0 auto" }}
    >
      {SINGLE.map((t) => {
        const fill = strong.includes(t.tier) ? STRONG : soft.includes(t.tier) ? SOFT : "#ffffff";
        return <polygon key={t.tier} points={toStr(t.pts)} fill={fill} style={{ transition: "fill 200ms" }} />;
      })}
      {PAIRS.map((p) => {
        const fill = strong.includes(p.a) || strong.includes(p.b) ? STRONG : soft.includes(p.a) || soft.includes(p.b) ? SOFT : "#ffffff";
        return <polygon key={p.a} points={toStr(p.pts)} fill={fill} style={{ transition: "fill 200ms" }} />;
      })}
      {/* outline and tier rules — no rule down the middle of D M or A S: each is one tile */}
      <polygon points={toStr(full(Y[0], Y[4]))} fill="none" stroke={NAVY} strokeWidth={3} strokeLinejoin="round" />
      {[1, 2, 3].map((i) => (
        <line key={i} x1={CX - hw(Y[i])} y1={Y[i]} x2={CX + hw(Y[i])} y2={Y[i]} stroke={NAVY} strokeWidth={2.5} />
      ))}
      {SINGLE.map((t) => (
        <text key={`t-${t.tier}`} x={t.x} y={t.y} textAnchor="middle" fontFamily="'Segoe UI', system-ui, sans-serif" fontWeight={700}>
          <tspan fontSize={t.letterSize ?? 34} fill={LETTER}>{t.letter}</tspan>
          <tspan dx={8} fontSize={t.symSize} fill={SYMBOL}>{t.sym}</tspan>
        </text>
      ))}
      {PAIRS.map((p) => (
        <g key={`p-${p.a}`} fontFamily="'Segoe UI', system-ui, sans-serif" fontWeight={700} textAnchor="middle">
          <text x={CX} y={p.y}>
            <tspan fontSize={30} fill={LETTER} textDecoration={strong.includes(p.a) ? "underline" : undefined}>{p.la}</tspan>
            <tspan dx={6} fontSize={32} fill={SYMBOL} textDecoration={strong.includes(p.a) ? "underline" : undefined}>{p.sa}</tspan>
            <tspan dx={14} fontSize={30} fill={NAVY}>&amp;</tspan>
            <tspan dx={14} fontSize={30} fill={LETTER} textDecoration={strong.includes(p.b) ? "underline" : undefined}>{p.lb}</tspan>
            <tspan dx={6} fontSize={32} fill={SYMBOL} textDecoration={strong.includes(p.b) ? "underline" : undefined}>{p.sb}</tspan>
          </text>
          <text x={CX} y={p.capY} fontSize={11} fill="#475569" fontWeight={600}>equal priority: left to right in the question</text>
        </g>
      ))}
    </svg>
  );
}
