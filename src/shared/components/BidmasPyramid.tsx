// ─────────────────────────────────────────────────────────────────────────────
// BIDMAS pyramid — the aide-mémoire students are given for the order of operations.
//
//        B ( )
//        I ² ³
//      D ÷ | M ×      ← one tier, split: equal priority, so left to right
//      A + | S −      ← one tier, split: equal priority, so left to right
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
const BASE_Y = 238;
const HALF = 190;
const CX = 200;
const hw = (y: number) => (HALF * (y - APEX_Y)) / (BASE_Y - APEX_Y);

// Tier boundaries (top of B → base).
const Y = [APEX_Y, 62, 120, 182, BASE_Y];

const NAVY = "#1e3a8a";
const LETTER = "#dc2626";
const SYMBOL = "#2563eb";
const STRONG = "#fde68a";
const SOFT = "#fef3c7";

type Pts = [number, number][];
const full = (y1: number, y2: number): Pts => [[CX - hw(y1), y1], [CX + hw(y1), y1], [CX + hw(y2), y2], [CX - hw(y2), y2]];
const left = (y1: number, y2: number): Pts => [[CX - hw(y1), y1], [CX, y1], [CX, y2], [CX - hw(y2), y2]];
const right = (y1: number, y2: number): Pts => [[CX, y1], [CX + hw(y1), y1], [CX + hw(y2), y2], [CX, y2]];
const toStr = (p: Pts) => p.map(([x, y]) => `${x},${y}`).join(" ");

interface TierDef { tier: PyramidTier; pts: Pts; letter: string; lx: number; ly: number; sym: string; sx: number; sy: number; sup?: boolean }

const TIERS: TierDef[] = [
  { tier: "B", pts: full(Y[0], Y[1]), letter: "B", lx: CX, ly: 50, sym: "( )", sx: 252, sy: 32 },
  { tier: "I", pts: full(Y[1], Y[2]), letter: "I", lx: CX - 6, ly: 106, sym: "2  3", sx: CX + 22, sy: 92, sup: true },
  { tier: "D", pts: left(Y[2], Y[3]), letter: "D", lx: 128, ly: 162, sym: "÷", sx: 172, sy: 162 },
  { tier: "M", pts: right(Y[2], Y[3]), letter: "M", lx: 244, ly: 162, sym: "×", sx: 288, sy: 162 },
  { tier: "A", pts: left(Y[3], Y[4]), letter: "A", lx: 102, ly: 220, sym: "+", sx: 148, sy: 220 },
  { tier: "S", pts: right(Y[3], Y[4]), letter: "S", lx: 252, ly: 220, sym: "−", sx: 298, sy: 220 },
];

const NAMES: Record<PyramidTier, string> = { B: "Brackets", I: "Indices", D: "Division", M: "Multiplication", A: "Addition", S: "Subtraction" };

export function BidmasPyramid({ strong = [], soft = [], maxWidth = 420 }: BidmasPyramidProps) {
  const label = `BIDMAS pyramid: Brackets, Indices, then Division and Multiplication together, then Addition and Subtraction together${
    strong.length ? `. Now: ${strong.map((t) => NAMES[t]).join(" and ")}` : ""
  }`;
  return (
    <svg
      viewBox="0 0 400 244"
      role="img"
      aria-label={label}
      style={{ display: "block", width: "100%", maxWidth, height: "auto", margin: "0 auto" }}
    >
      {TIERS.map((t) => {
        const fill = strong.includes(t.tier) ? STRONG : soft.includes(t.tier) ? SOFT : "#ffffff";
        return <polygon key={t.tier} points={toStr(t.pts)} fill={fill} style={{ transition: "fill 200ms" }} />;
      })}
      {/* outline and tier rules */}
      <polygon points={toStr(full(Y[0], Y[4]))} fill="none" stroke={NAVY} strokeWidth={3} strokeLinejoin="round" />
      {[1, 2, 3].map((i) => (
        <line key={i} x1={CX - hw(Y[i])} y1={Y[i]} x2={CX + hw(Y[i])} y2={Y[i]} stroke={NAVY} strokeWidth={2.5} />
      ))}
      <line x1={CX} y1={Y[2]} x2={CX} y2={BASE_Y} stroke={NAVY} strokeWidth={2.5} />
      {TIERS.map((t) => (
        <g key={`t-${t.tier}`} fontFamily="'Segoe UI', system-ui, sans-serif" fontWeight={700}>
          <text x={t.lx} y={t.ly} textAnchor="middle" fontSize={34} fill={LETTER}>{t.letter}</text>
          {t.sup ? (
            <text x={t.sx} y={t.sy} fontSize={20} fill={SYMBOL} style={{ whiteSpace: "pre" }}>{t.sym}</text>
          ) : (
            <text x={t.sx} y={t.sy} textAnchor="middle" fontSize={t.tier === "B" ? 30 : 32} fill={SYMBOL}>{t.sym}</text>
          )}
        </g>
      ))}
    </svg>
  );
}
