import {
  ToolShell, handleDiagramPrint,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion,
  type ToolMultiSelect, type ToolVariable,
  randInt, pickActive, mStep, tStep,
} from "../../shared";

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. Types ──────────────────────────────────────────────────────────────────

type ToolType = "nearest" | "dp" | "sf";
type LabelMode = "ends" | "every";       // Level 1 — how much of the line is labelled
type BlankMode = "blank" | "endsGiven";  // Level 2 — what the student fills in

/** Everything the number-line renderer needs. Every representation (text, line, answer)
 *  is derived from the same integers, so they cannot drift apart. */
interface RoundingData {
  level: DifficultyLevel;
  prompt: string;        // "Round 347 to the nearest 10."
  numStr: string;
  lowerStr: string;
  midStr: string;
  upperStr: string;
  ticks: string[];       // 11 labels, lower → upper
  ansStr: string;
  up: boolean;
  pos: number;           // 0..1 position of the number between lower and upper
  labelMode: LabelMode;
  blankMode: BlankMode;
  aspect: number;
}

// ── 2. TOOL_CONFIG ────────────────────────────────────────────────────────────

const HALFWAY_VAR: ToolVariable = { key: "halfway", label: "Include exact halfway values", defaultValue: false };

const NEAREST_MS: ToolMultiSelect = {
  key: "nearestPool", label: "Round to nearest",
  options: [
    { value: "n1000", label: "1000", defaultActive: true },
    { value: "n100", label: "100", defaultActive: true },
    { value: "n10", label: "10", defaultActive: true },
    { value: "n1", label: "Whole number", defaultActive: true },
  ],
};
const DP_MS: ToolMultiSelect = {
  key: "dpPool", label: "Decimal places",
  options: [
    { value: "dp1", label: "1 d.p.", defaultActive: true },
    { value: "dp2", label: "2 d.p.", defaultActive: true },
    { value: "dp3", label: "3 d.p.", defaultActive: true },
  ],
};
const SF_MS: ToolMultiSelect = {
  key: "sfPool", label: "Significant figures",
  options: [
    { value: "sf1", label: "1 s.f.", defaultActive: true },
    { value: "sf2", label: "2 s.f.", defaultActive: true },
    { value: "sf3", label: "3 s.f.", defaultActive: true },
  ],
};

const LABEL_L1_MS: ToolMultiSelect = {
  key: "labelMode", label: "Number line labels",
  options: [
    { value: "ends", label: "Ends & midpoint", defaultActive: true },
    { value: "every", label: "Every mark", sub: "(just see where it sits)", defaultActive: false },
  ],
};
const BLANK_L2_MS: ToolMultiSelect = {
  key: "blankMode", label: "Student fills in",
  options: [
    { value: "blank", label: "Ends & midpoint", defaultActive: true },
    { value: "endsGiven", label: "Midpoint only", sub: "(ends given)", defaultActive: false },
  ],
};

const subTool = (name: string, pool: ToolMultiSelect) => ({
  name,
  variables: [] as ToolVariable[],
  dropdown: null,
  multiSelect: pool,
  difficultySettings: {
    level1: { variables: [HALFWAY_VAR], multiSelect: [pool, LABEL_L1_MS] },
    level2: { variables: [HALFWAY_VAR], multiSelect: [pool, BLANK_L2_MS] },
    level3: { variables: [HALFWAY_VAR], multiSelect: [pool] },
  },
});

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Rounding",
  tools: {
    nearest: subTool("Nearest 10, 100, 1000", NEAREST_MS),
    dp: subTool("Decimal Places", DP_MS),
    sf: subTool("Significant Figures", SF_MS),
  },
};

// ── 3. INFO_SECTIONS ──────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  {
    title: "Level 1 — Labelled Number Line", icon: "📏",
    content: [
      { label: "Overview", detail: "The number sits on a number line between the two possible rounded values. The ends and the midpoint are labelled, so students see which end the number is closer to." },
      { label: "Number line labels", detail: "'Ends & midpoint' labels the two rounding boundaries and the halfway value. 'Every mark' labels all eleven marks — the number's position is then simply read off the line." },
    ],
  },
  {
    title: "Level 2 — Blank Number Line", icon: "✏️",
    content: [
      { label: "Overview", detail: "The same line with the number marked, but the labels are empty boxes. Students work out the two boundaries and the halfway value themselves, then decide which way to round." },
      { label: "Student fills in", detail: "'Ends & midpoint' leaves all three boxes blank. 'Midpoint only' gives the two ends so students only find the halfway value." },
    ],
  },
  {
    title: "Level 3 — Questions Only", icon: "🔢",
    content: [
      { label: "Overview", detail: "No number line — just the rounding question. Numbers may carry one or two digits beyond the rounding position." },
    ],
  },
  {
    title: "Rounding to…", icon: "🎯",
    content: [
      { label: "Nearest 10, 100, 1000", detail: "Choose any mix of 1000, 100, 10 and whole number." },
      { label: "Decimal places", detail: "1, 2 or 3 d.p. Trailing zeros are kept in answers (e.g. 4.30) because they show the accuracy." },
      { label: "Significant figures", detail: "1, 2 or 3 s.f., including numbers below 1 (leading zeros are not significant) and large numbers." },
      { label: "Exact halfway values", detail: "Off by default. Turn on to include numbers exactly halfway between the two boundaries — round up." },
    ],
  },
  {
    title: "Modes", icon: "🖥️",
    content: [
      { label: "Whiteboard", detail: "One large question; reveal the answer on demand." },
      { label: "Worked Example", detail: "Step-by-step: the two boundaries, the halfway value, then which side the number is on." },
      { label: "Worksheet", detail: "Grid of questions with differentiated layout and PDF export." },
    ],
  },
];

// ── 4. Number formatting (integer arithmetic only — no floating point) ────────

const pow10 = (n: number) => Math.pow(10, n);

/** Group thousands with commas from five digits up (4372 stays 4372, 43720 → 43,720). */
const group = (digits: string) => (digits.length >= 5 ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : digits);

/** n × 10^exp as a string; decimals keep every digit down to 10^exp (so 4.30 stays 4.30). */
function fmtScaled(n: number, exp: number): string {
  if (exp >= 0) return n === 0 ? "0" : group(String(n) + "0".repeat(exp));
  const s = String(n).padStart(-exp + 1, "0");
  return `${group(s.slice(0, s.length + exp))}.${s.slice(s.length + exp)}`;
}

/** Plain string → KaTeX-safe (thousands commas need braces). */
const tex = (s: string) => s.replace(/,/g, "{,}");

// ── 5. Generation ─────────────────────────────────────────────────────────────

function targetPhrase(t: ToolType, n: number): string {
  if (t === "nearest") return n === 0 ? "the nearest whole number" : `the nearest ${pow10(n)}`;
  if (t === "dp") return `${n} decimal place${n > 1 ? "s" : ""}`;
  return `${n} significant figure${n > 1 ? "s" : ""}`;
}

function pickOpt(values: Record<string, boolean> | undefined, options: { value: string }[]): string {
  return pickActive(values ?? {}, options);
}

function buildRounding(t: ToolType, level: DifficultyLevel, wantHalf: boolean, ms: Record<string, boolean> | undefined) {
  // ── which accuracy? → unit exponent e (unit = 10^e) ──
  let n: number, e: number;
  if (t === "nearest") {
    n = { n1000: 3, n100: 2, n10: 1, n1: 0 }[pickOpt(ms, NEAREST_MS.options)] ?? 1;
    e = n;
  } else if (t === "dp") {
    n = Number(pickOpt(ms, DP_MS.options).slice(2));
    e = -n;
  } else {
    n = Number(pickOpt(ms, SF_MS.options).slice(2));
    const p = randInt(-3, 4);            // exponent of the leading digit
    e = p - n + 1;
  }

  // ── how many digits the number carries below the unit (kk) ──
  const extra = level === "level3" ? randInt(1, 2) : 1;
  const kk = t === "nearest" && e > 0 ? e : extra;
  const half = wantHalf && Math.random() < 1 / 6;
  const kkUsed = half && !(t === "nearest" && e > 0) ? 1 : kk;   // a halfway value is 5 × 10^(kk-1)

  // ── lower boundary, in units of 10^e ──
  let lowerIdx: number;
  if (t === "nearest") lowerIdx = randInt(1, e === 3 ? 60 : 99);
  else if (t === "dp") lowerIdx = Math.max(1, randInt(0, 60) * pow10(n) + randInt(0, pow10(n) - 1));
  else lowerIdx = randInt(pow10(n - 1), pow10(n) - 2);   // never 9…9, so the upper bound keeps its s.f.

  // ── the remainder (digits below the unit) ──
  const scale = pow10(kkUsed);
  let rem: number;
  if (half) rem = scale / 2;
  else do { rem = randInt(1, scale - 1); } while (rem % 10 === 0 || rem * 2 === scale);

  const N = lowerIdx * scale + rem;
  const up = rem * 2 >= scale;
  const f = e - kkUsed;
  const ansIdx = lowerIdx + (up ? 1 : 0);

  return {
    n, e, half, lowerIdx, N, f, up, pos: rem / scale,
    numStr: fmtScaled(N, f),
    lowerStr: fmtScaled(lowerIdx, e),
    upperStr: fmtScaled(lowerIdx + 1, e),
    midStr: fmtScaled(lowerIdx * 10 + 5, e - 1),
    ansStr: fmtScaled(ansIdx, e),
    ticks: Array.from({ length: 11 }, (_, i) => fmtScaled(lowerIdx * 10 + i, e - 1)),
  };
}

function introStep(t: ToolType, n: number) {
  if (t === "nearest") {
    return tStep(n === 0
      ? "To round to the nearest whole number, find the two whole numbers either side."
      : `To round to the nearest ${pow10(n)}, find the two multiples of ${pow10(n)} either side.`);
  }
  if (t === "dp") return tStep(`Rounding to ${n} decimal place${n > 1 ? "s" : ""} means keeping ${n} digit${n > 1 ? "s" : ""} after the decimal point. Find the two numbers with ${n} d.p. either side.`);
  return tStep(`The first significant figure is the first non-zero digit. Find the two numbers with ${n} significant figure${n > 1 ? "s" : ""} either side.`);
}

function generateQuestion(
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  _dropdownValue: string,
  multiSelectValues?: Record<string, boolean>,
): AnyQuestion {
  const t = tool as ToolType;
  const r = buildRounding(t, level, !!variables.halfway, multiSelectValues);
  const prompt = `Round ${r.numStr} to ${targetPhrase(t, r.n)}.`;

  const labelMode = pickOpt(multiSelectValues, LABEL_L1_MS.options) as LabelMode;
  const blankMode = pickOpt(multiSelectValues, BLANK_L2_MS.options) as BlankMode;

  const data: RoundingData = {
    level, prompt,
    numStr: r.numStr, lowerStr: r.lowerStr, midStr: r.midStr, upperStr: r.upperStr,
    ticks: r.ticks, ansStr: r.ansStr, up: r.up, pos: r.pos,
    labelMode, blankMode,
    aspect: level === "level3" ? 660 / 130 : 660 / 250,
  };

  const compare = r.half ? "=" : r.up ? "\\gt" : "\\lt";
  const working = [
    introStep(t, r.n),
    mStep("The number lies between:", [tex(r.lowerStr), `\\lt ${tex(r.numStr)}`, `\\lt ${tex(r.upperStr)}`]),
    mStep("The halfway value is:", tex(r.midStr)),
    mStep("Compare the number with the halfway value:", [tex(r.numStr), `${compare} ${tex(r.midStr)}`]),
    mStep(r.half ? "Exactly halfway, so round up:" : r.up ? "Above halfway, so round up:" : "Below halfway, so round down:", tex(r.ansStr)),
  ];

  return {
    kind: "simple",
    display: prompt,
    answer: r.ansStr,
    answerLatex: tex(r.ansStr),
    working,
    key: `round-${t}-${level}-${r.numStr}-${r.n}-${Math.floor(Math.random() * 1_000_000)}`,
    difficulty: level,
    _rounding: data,
    _aspect: data.aspect,
  } as unknown as AnyQuestion;
}

// ── 6. Diagram ────────────────────────────────────────────────────────────────

const X0 = 50, LW = 560, STEP = LW / 10, LY = 150;
const INK = "#1e293b", BLUE = "#2563eb", GREEN = "#166534";

function RoundingDiagram({ d, showAnswer, withPrompt, idx }: { d: RoundingData; showAnswer: boolean; withPrompt: boolean; idx?: number }) {
  const y0 = withPrompt ? 0 : 60;
  const h = withPrompt ? 250 : 190;
  const mx = X0 + d.pos * LW;
  const ansX = X0 + (d.up ? LW : 0);
  const majors = [0, 5, 10];
  const majorText = [d.lowerStr, d.midStr, d.upperStr];
  const promptFs = Math.min(30, 620 / (d.prompt.length * 0.56));

  const majorLabel = (mi: number) => {
    const i = majors[mi];
    const x = X0 + i * STEP;
    if (d.level === "level2") {
      // blank boxes; filled when the answer is shown, or when the ends are given
      const filled = showAnswer || (d.blankMode === "endsGiven" && i !== 5);
      return (
        <g key={`m${i}`}>
          <rect x={x - 46} y={LY + 22} width={92} height={38} rx={6} fill="#ffffff"
            stroke={filled ? "#94a3b8" : "#64748b"} strokeWidth={1.5} strokeDasharray={filled ? undefined : "5 4"} />
          {filled && <text x={x} y={LY + 42} textAnchor="middle" dominantBaseline="middle" fontSize={22} fontWeight={700}
            fill={showAnswer && !(d.blankMode === "endsGiven" && i !== 5) ? GREEN : INK}>{majorText[mi]}</text>}
        </g>
      );
    }
    if (d.labelMode === "every") return null;
    return <text key={`m${i}`} x={x} y={LY + 42} textAnchor="middle" dominantBaseline="middle" fontSize={22} fontWeight={700} fill={INK}>{majorText[mi]}</text>;
  };

  return (
    <svg viewBox={`0 ${y0} 660 ${h}`} style={{ display: "block", width: "100%", height: "auto" }} preserveAspectRatio="xMidYMid meet"
      {...(idx !== undefined ? { "data-q-index": idx } : {})}>
      {withPrompt && <text x={330} y={36} textAnchor="middle" dominantBaseline="middle" fontSize={promptFs} fontWeight={700} fill="#000">{d.prompt}</text>}

      {/* the number */}
      <text x={mx} y={88} textAnchor="middle" dominantBaseline="middle" fontSize={24} fontWeight={700} fill={BLUE}>{d.numStr}</text>
      <line x1={mx} y1={102} x2={mx} y2={126} stroke={BLUE} strokeWidth={3} />
      <polygon points={`${mx - 7},122 ${mx + 7},122 ${mx},136`} fill={BLUE} />

      {/* the line and its marks */}
      <line x1={X0 - 16} y1={LY} x2={X0 + LW + 16} y2={LY} stroke={INK} strokeWidth={3} strokeLinecap="round" />
      {Array.from({ length: 11 }, (_, i) => {
        const major = i % 5 === 0;
        const x = X0 + i * STEP;
        return <line key={`t${i}`} x1={x} y1={LY - (major ? 14 : 8)} x2={x} y2={LY + (major ? 14 : 8)} stroke={INK} strokeWidth={major ? 3 : 2} />;
      })}
      <circle cx={mx} cy={LY} r={5.5} fill={BLUE} />

      {/* labels */}
      {d.level === "level1" && d.labelMode === "every" && d.ticks.map((s, i) => (
        <text key={`l${i}`} x={X0 + i * STEP} y={LY + 38} textAnchor="middle" dominantBaseline="middle"
          fontSize={16} fontWeight={i % 5 === 0 ? 700 : 500} fill={INK}>{s}</text>
      ))}
      {majors.map((_, mi) => majorLabel(mi))}

      {/* answer */}
      {showAnswer && <circle cx={ansX} cy={LY} r={10} fill="none" stroke={GREEN} strokeWidth={3} />}
      <text x={330} y={h + y0 - 18} textAnchor="middle" dominantBaseline="middle" fontSize={26} fontWeight={700} fill={GREEN}
        opacity={showAnswer ? 1 : 0}>{`Answer: ${d.ansStr}`}</text>
    </svg>
  );
}

/** Level 3 worksheet cell — text only, but as an SVG so the shared diagram print can clone it. */
function PromptSvg({ d, showAnswer, idx }: { d: RoundingData; showAnswer: boolean; idx?: number }) {
  const fs = Math.min(34, 620 / (d.prompt.length * 0.56));
  return (
    <svg viewBox="0 0 660 130" style={{ display: "block", width: "100%", height: "auto" }} preserveAspectRatio="xMidYMid meet"
      {...(idx !== undefined ? { "data-q-index": idx } : {})}>
      <text x={330} y={48} textAnchor="middle" dominantBaseline="middle" fontSize={fs} fontWeight={700} fill="#000">{d.prompt}</text>
      <text x={330} y={100} textAnchor="middle" dominantBaseline="middle" fontSize={28} fontWeight={700} fill={GREEN}
        opacity={showAnswer ? 1 : 0}>{`= ${d.ansStr}`}</text>
    </svg>
  );
}

const questionRenderer = (
  q: AnyQuestion, showAnswer: boolean, _cs: string, compact?: boolean, idx?: number, _qo?: unknown, fontClass?: string,
): JSX.Element | null => {
  const d = (q as any)._rounding as RoundingData | undefined;
  if (!d) return null;

  // Worksheet cell — the prompt lives inside the SVG so it prints with the diagram.
  if (compact === true) {
    return d.level === "level3"
      ? <PromptSvg d={d} showAnswer={showAnswer} idx={idx} />
      : <RoundingDiagram d={d} showAnswer={showAnswer} withPrompt idx={idx} />;
  }

  // Whiteboard / worked example — prompt as text (respects the size chevrons).
  const fc = fontClass ?? "text-3xl";
  return (
    <div className="w-full flex flex-col items-center gap-3">
      <div className={`${fc} font-bold`} style={{ color: "#000" }}>{d.prompt}</div>
      {d.level === "level3"
        ? (showAnswer && <div className={`${fc} font-bold`} style={{ color: GREEN }}>{`= ${d.ansStr}`}</div>)
        : (
          <div style={{ width: "100%", maxWidth: compact === false ? 640 : 460, margin: "0 auto" }}>
            <RoundingDiagram d={d} showAnswer={showAnswer} withPrompt={false} />
          </div>
        )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// APP — leave unchanged
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      questionRenderer={questionRenderer}
      customPrintHandler={handleDiagramPrint}
      defaults={{ numColumns: 2, maxColumns: 2, collapseWorkingByDefault: true }}
    />
  );
}

export const __test = { TOOL_CONFIG, generateQuestion, levels: ["level1", "level2", "level3"] };
