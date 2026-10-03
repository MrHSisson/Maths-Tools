import { Fragment } from "react";
import {
  ToolShell, handleDiagramPrint,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion,
  type ToolMultiSelect, type ToolVariable,
  randInt, pickActive, mStep, tStep, QuestionDisplay, AnswerDisplay, handlePrint, type WorkingStep, type QOSnapshot, type ToolDropdown,
} from "../../shared";

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. Types ──────────────────────────────────────────────────────────────────

type ToolType = "nearest" | "dp" | "sf";
type Method = "digit" | "line";   // worked-example method — the question is identical either way
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
  plotted: boolean;      // false → students plot the number themselves (Levels 1–2)
  aspect: number;
  e: number;             // unit exponent (unit = 10^e)
}

// ── 2. TOOL_CONFIG ────────────────────────────────────────────────────────────

// A common/rare pair, not a difficulty ladder — so no `weight` (that would opt into the
// Smart Progressor's roughly-even split). `cycleDisplay` still gives the compact
// Off → Mixed → Always button; "Mixed" means a fixed rare chance, read via pickRare.
const HALFWAY_MIXED_CHANCE = 0.05;
const POSITION_MS: ToolMultiSelect = {
  key: "position", label: "Exactly halfway", cycleDisplay: true,
  cycleStateLabels: ["Off", "Mixed (~5%)", "Always"],
  options: [
    { value: "midAny", label: "Any position", defaultActive: true },
    { value: "midExact", label: "Exactly halfway", defaultActive: false },
  ],
};

/** Absent means active, only an explicit `false` turns an option off (pickActive's convention). */
function pickRare(values: Record<string, boolean> | undefined, commonValue: string, rareValue: string, rareChance: number): string {
  const commonOn = values?.[commonValue] !== false;
  const rareOn = values?.[rareValue] !== false;
  if (!rareOn) return commonValue;
  if (!commonOn) return rareValue;
  return Math.random() < rareChance ? rareValue : commonValue;
}
const PRECISION_MS: ToolMultiSelect = {
  key: "precision", label: "Digits past the rounding position",
  options: [
    { value: "oneDigit", label: "One extra", sub: "(sits on a mark)", defaultActive: true },
    { value: "twoDigit", label: "Two extra", sub: "(between marks)", defaultActive: false },
  ],
};
const PLOT_MS: ToolMultiSelect = {
  key: "plotMode", label: "Number on the line", exclusive: true,
  options: [
    { value: "student", label: "Students plot it", sub: "(reveal the plot, then the answer)", defaultActive: true },
    { value: "auto", label: "Plotted for them", defaultActive: false },
  ],
};

const NEAREST_MS: ToolMultiSelect = {
  key: "nearestPool", label: "Round to nearest",
  options: [
    // ordered as a difficulty scale (not a size scale): 10 → 100 → 1000 → whole number
    { value: "n10", label: "10", defaultActive: true },
    { value: "n100", label: "100", defaultActive: true },
    { value: "n1000", label: "1000", defaultActive: true },
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
  key: "labelMode", label: "Number line labels", exclusive: true,
  options: [
    { value: "ends", label: "Ends & midpoint", defaultActive: true },
    { value: "every", label: "Every mark", sub: "(just see where it sits)", defaultActive: false },
  ],
};
const BLANK_L2_MS: ToolMultiSelect = {
  key: "blankMode", label: "Student fills in", exclusive: true,
  options: [
    { value: "blank", label: "Ends & midpoint", defaultActive: true },
    { value: "endsGiven", label: "Midpoint only", sub: "(ends given)", defaultActive: false },
  ],
};

// Working method — the same question, explained by the digit rule or on a number line.
// Shown only in Whiteboard / Worked Example (it changes nothing on a printed worksheet).
const METHOD_DD: ToolDropdown = {
  key: "method", label: "Working method",
  options: [
    { value: "digit", label: "Digit rule", sub: "(rounding digit + decider)" },
    { value: "line", label: "Number line", sub: "(boundaries + halfway)" },
  ],
  defaultValue: "digit",
  workedExampleOnly: true,
};

const subTool = (name: string, pool: ToolMultiSelect) => ({
  name,
  variables: [] as ToolVariable[],
  dropdown: METHOD_DD,
  multiSelect: pool,
  difficultySettings: {
    level1: { variables: [], multiSelect: [pool, LABEL_L1_MS, PLOT_MS, PRECISION_MS, POSITION_MS] },
    level2: { variables: [], multiSelect: [pool, BLANK_L2_MS, PLOT_MS, PRECISION_MS, POSITION_MS] },
    level3: { variables: [], multiSelect: [pool, POSITION_MS] },
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
      { label: "Nearest 10, 100, 1000", detail: "Choose any mix of 10, 100, 1000 and whole number (listed as a difficulty scale, easiest first)." },
      { label: "Decimal places", detail: "1, 2 or 3 d.p. Trailing zeros are kept in answers (e.g. 4.30) because they show the accuracy." },
      { label: "Significant figures", detail: "1, 2 or 3 s.f., including numbers below 1 (leading zeros are not significant) and large numbers." },
      { label: "Number on the line (Levels 1–2)", detail: "'Students plot it' (the default) leaves the line without a marker — on the whiteboard, 'Show Plot' reveals where the number sits before 'Show Answer' reveals the rounding. On worksheets the marker appears with the answers. 'Plotted for them' marks the number on the line from the start." },
      { label: "Digits past the rounding position (Levels 1–2)", detail: "'One extra' puts the number exactly on a mark of the line; 'Two extra' places it between marks so students estimate its position. This applies to every sub-tool: for nearest 100, one extra gives 3480 (on a mark) and two extra gives 3482 (between marks). Level 3 uses natural digits for nearest 10/100/1000 (e.g. 3482) and mixes one and two extra digits elsewhere." },
      { label: "Working method", detail: "Worked Example only (it changes the explanation, not the question). 'Digit rule' shows the rounding digit and the decider with a dotted line between them, then the 5-or-more rule. 'Number line' shows the two possible answers either side of the number, the halfway value, and which it is closer to. Switching keeps the same question." },
      { label: "Exactly halfway", detail: "Click to cycle: Off → Mixed (about 5% of questions) → Always. Exactly-halfway numbers round up." },
    ],
  },
  {
    title: "Modes", icon: "🖥️",
    content: [
      { label: "Whiteboard", detail: "One large question; reveal the answer on demand." },
      { label: "Worked Example", detail: "Step-by-step, in the chosen working method: the digit rule (rounding digit, decider, 5-or-more) or the number line (boundaries, halfway, which is closer)." },
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

function buildRounding(t: ToolType, level: DifficultyLevel, ms: Record<string, boolean> | undefined) {
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
  const extra = level === "level3" ? randInt(1, 2) : pickOpt(ms, PRECISION_MS.options) === "twoDigit" ? 2 : 1;
  // Level 3 nearest-10/100/1000 uses the number's natural digits (3482 to the nearest 100);
  // Levels 1–2 follow the QO: one extra digit sits on a mark (3480), two between marks (3482).
  const natural = level === "level3" && t === "nearest" && e > 0;
  const kk = natural ? e : extra;
  const half = pickRare(ms, "midAny", "midExact", HALFWAY_MIXED_CHANCE) === "midExact";
  const kkUsed = half && !natural ? 1 : kk;   // a halfway value is 5 × 10^(kk-1)

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
    n, e, half, lowerIdx, N, f, up, kk: kkUsed, pos: rem / scale,
    numStr: fmtScaled(N, f),
    lowerStr: fmtScaled(lowerIdx, e),
    upperStr: fmtScaled(lowerIdx + 1, e),
    midStr: fmtScaled(lowerIdx * 10 + 5, e - 1),
    ansStr: fmtScaled(ansIdx, e),
    ticks: Array.from({ length: 11 }, (_, i) => fmtScaled(lowerIdx * 10 + i, e - 1)),
  };
}

const PLACE = ["units", "tens", "hundreds", "thousands"];
function introStep(t: ToolType, n: number, method: Method) {
  if (method === "line") {
    if (t === "nearest") return tStep(`To round to the nearest ${n === 0 ? "whole number" : pow10(n)}, find the two ${n === 0 ? "whole numbers" : `multiples of ${pow10(n)}`} either side of the number, then decide which one it is closer to.`);
    if (t === "dp") return tStep(`The two possible answers are the numbers with ${n} decimal place${n > 1 ? "s" : ""} either side of the number. Decide which one it is closer to.`);
    return tStep(`The two possible answers are the numbers with ${n} significant figure${n > 1 ? "s" : ""} either side of the number (the first significant figure is the first non-zero digit). Decide which one it is closer to.`);
  }
  if (t === "nearest") return tStep(`Rounding to the nearest ${n === 0 ? "whole number" : pow10(n)}: the rounding digit is the ${PLACE[n]} digit.`);
  if (t === "dp") return tStep(`Rounding to ${n} decimal place${n > 1 ? "s" : ""} means keeping ${n} digit${n > 1 ? "s" : ""} after the decimal point. The rounding digit is the last digit you keep.`);
  return tStep(`The first significant figure is the first non-zero digit. Rounding to ${n} significant figure${n > 1 ? "s" : ""} means keeping ${n} of them; the rounding digit is the last one you keep.`);
}

type Rounded = ReturnType<typeof buildRounding>;

/** The worked example for one question — the digit rule OR the number line, never both. */
function buildWorking(t: ToolType, r: Rounded, data: RoundingData, method: Method): WorkingStep[] {
  const compare = r.half ? "=" : r.up ? "\\gt" : "\\lt";
  if (method === "line") {
    return [
      introStep(t, r.n, "line"),
      { type: "roundLine", latex: "", plain: `${r.numStr} lies between ${r.lowerStr} and ${r.upperStr}`, label: `Mark the number between ${r.lowerStr} and ${r.upperStr}; halfway is ${r.midStr}:`, extra: data },
      mStep(r.half ? "Exactly halfway, so it rounds up:" : r.up ? "Past the halfway value, so it is closer to the upper number:" : "Before the halfway value, so it is closer to the lower number:", [tex(r.numStr), `${compare} ${tex(r.midStr)}`]),
      mStep("Answer:", tex(r.ansStr)),
    ];
  }
  const decider = Math.floor(r.N / pow10(r.kk - 1)) % 10;   // the digit just after the rounding digit
  return [
    introStep(t, r.n, "digit"),
    { type: "roundDigits", latex: "", plain: `Rounding digit and decider in ${r.numStr}`, label: "Find the rounding digit (blue), draw a dotted line after it, then look at the digit that follows — the decider (orange):", extra: { numStr: r.numStr, e: r.e, sf: t === "sf" } },
    mStep(`The decider is ${decider}, which is ${decider >= 5 ? "5 or more, so round up" : "less than 5, so round down"}:`, `${decider} ${decider >= 5 ? "\\ge" : "\\lt"} 5`),
    mStep(r.up ? "Add 1 to the rounding digit and drop (or zero) everything after it:" : "Keep the rounding digit and drop (or zero) everything after it:", tex(r.ansStr)),
  ];
}

function generateQuestion(
  tool: string,
  level: DifficultyLevel,
  _variables: Record<string, boolean>,
  dropdownValue: string,
  multiSelectValues?: Record<string, boolean>,
): AnyQuestion {
  const t = tool as ToolType;
  const r = buildRounding(t, level, multiSelectValues);
  const prompt = `Round ${r.numStr} to ${targetPhrase(t, r.n)}.`;

  const labelMode = pickOpt(multiSelectValues, LABEL_L1_MS.options) as LabelMode;
  const blankMode = pickOpt(multiSelectValues, BLANK_L2_MS.options) as BlankMode;
  const plotted = level === "level3" || pickOpt(multiSelectValues, PLOT_MS.options) === "auto";

  const data: RoundingData = {
    level, prompt,
    numStr: r.numStr, lowerStr: r.lowerStr, midStr: r.midStr, upperStr: r.upperStr,
    ticks: r.ticks, ansStr: r.ansStr, up: r.up, pos: r.pos,
    labelMode, blankMode, plotted,
    e: r.e,
    aspect: 660 / 290,   // same cell shape at every level so page fill / the 12-per-page cap match
  };

  const method = (dropdownValue === "line" ? "line" : "digit") as Method;
  const working = buildWorking(t, r, data, method);
  const work = { t, r, data };   // kept so reformatQuestion can rebuild the working
  const qoKey = JSON.stringify(multiSelectValues ?? {});

  // Level 3 is a plain text question — ToolShell's standard display, sizing and print.
  if (level === "level3") {
    return {
      kind: "worded",
      lines: [`Round $${tex(r.numStr)}$ to ${targetPhrase(t, r.n)}.`],
      answer: r.ansStr,
      answerLatex: tex(r.ansStr),
      working,
      key: `round-${t}-${level}-${r.numStr}-${r.n}-${Math.floor(Math.random() * 1_000_000)}`,
      difficulty: level,
      _aspect: data.aspect,
      _work: work, _qoKey: qoKey,
      _printText: prompt,   // used only when a diagram sheet mixes levels (differentiated)
    } as unknown as AnyQuestion;
  }

  return {
    kind: "simple",
    display: prompt,
    answer: r.ansStr,
    answerLatex: tex(r.ansStr),
    working,
    key: `round-${t}-${level}-${r.numStr}-${r.n}-${Math.floor(Math.random() * 1_000_000)}`,
    difficulty: level,
    _rounding: data,
    _work: work, _qoKey: qoKey,
    _aspect: data.aspect,
    _densityFloorMm: 30,   // caps a page at 12 diagrams (2 columns × 6 rows)
    ...(plotted ? {} : { _stagedReveal: "Show Plot" }),   // whiteboard: plot first, then the answer
  } as unknown as AnyQuestion;
}

// Switching the working method only re-explains the same question — rebuild the steps.
// Any other QO change means a new question (return null and let ToolShell regenerate).
const reformatQuestion = (q: AnyQuestion, qo: QOSnapshot): AnyQuestion | null => {
  const w = (q as any)._work as { t: ToolType; r: Rounded; data: RoundingData } | undefined;
  if (!w || (q as any)._qoKey !== JSON.stringify(qo.multiSelectValues ?? {})) return null;
  return { ...q, working: buildWorking(w.t, w.r, w.data, qo.dropdownValue === "line" ? "line" : "digit") } as unknown as AnyQuestion;
};

// ── 6. Diagram ────────────────────────────────────────────────────────────────

const X0 = 60, LW = 540, STEP = LW / 10, LY = 165;
const INK = "#1e293b", BLUE = "#2563eb", GREEN = "#166534";

function RoundingDiagram({ d, showAnswer, withPrompt, idx, preview, answerIdx, answerBand = true }: { d: RoundingData; showAnswer: boolean; withPrompt: boolean; idx?: number; preview?: boolean; answerIdx?: number; answerBand?: boolean }) {
  const y0 = withPrompt ? 0 : 60;
  const bottom = answerBand ? 290 : 245;   // the answer band sits below the line's labels
  const h = bottom - y0;
  const mx = X0 + d.pos * LW;
  const showMarker = d.plotted || showAnswer || !!preview;
  const ansX = X0 + (d.up ? LW : 0);
  const majors = [0, 5, 10];
  const majorText = [d.lowerStr, d.midStr, d.upperStr];
  const promptFs = Math.min(32, 620 / (d.prompt.length * 0.56));

  const majorLabel = (mi: number) => {
    const i = majors[mi];
    const x = X0 + i * STEP;
    if (d.level === "level2") {
      // blank boxes; filled when the answer is shown, or when the ends are given
      const given = d.blankMode === "endsGiven" && i !== 5;
      const filled = showAnswer || given;
      return (
        <g key={`m${i}`}>
          <rect x={x - 52} y={LY + 26} width={104} height={46} rx={7} fill="#ffffff"
            stroke={filled ? "#94a3b8" : "#64748b"} strokeWidth={2} strokeDasharray={filled ? undefined : "6 5"} />
          {filled && <text x={x} y={LY + 50} textAnchor="middle" dominantBaseline="middle" fontSize={28} fontWeight={700}
            fill={showAnswer && !given ? GREEN : INK}>{majorText[mi]}</text>}
        </g>
      );
    }
    if (d.labelMode === "every") return null;
    return <text key={`m${i}`} x={x} y={LY + 50} textAnchor="middle" dominantBaseline="middle" fontSize={28} fontWeight={700} fill={INK}>{majorText[mi]}</text>;
  };

  return (
    <svg viewBox={`0 ${y0} 660 ${h}`} style={{ display: "block", width: "100%", height: "auto" }} preserveAspectRatio="xMidYMid meet"
      {...(idx !== undefined ? { "data-q-index": idx } : {})}
      {...(answerIdx !== undefined ? { "data-q-answer-index": answerIdx } : {})}>
      {withPrompt && <text x={330} y={38} textAnchor="middle" dominantBaseline="middle" fontSize={promptFs} fontWeight={700} fill="#000">{d.prompt}</text>}

      {/* the number — when students plot it themselves it appears at the "Show Plot" step */}
      {showMarker && <g>
      <text x={mx} y={92} textAnchor="middle" dominantBaseline="middle" fontSize={32} fontWeight={700} fill={BLUE}>{d.numStr}</text>
      <line x1={mx} y1={112} x2={mx} y2={140} stroke={BLUE} strokeWidth={4} />
      <polygon points={`${mx - 9},136 ${mx + 9},136 ${mx},152`} fill={BLUE} />
      </g>}

      {/* the line and its marks */}
      <line x1={X0 - 20} y1={LY} x2={X0 + LW + 20} y2={LY} stroke={INK} strokeWidth={4} strokeLinecap="round" />
      {Array.from({ length: 11 }, (_, i) => {
        const major = i % 5 === 0;
        const x = X0 + i * STEP;
        return <line key={`t${i}`} x1={x} y1={LY - (major ? 18 : 10)} x2={x} y2={LY + (major ? 18 : 10)} stroke={INK} strokeWidth={major ? 4 : 2.5} />;
      })}
      {showMarker && <circle cx={mx} cy={LY} r={7} fill={BLUE} />}

      {/* labels */}
      {d.level === "level1" && d.labelMode === "every" && d.ticks.map((s, i) => (
        <text key={`l${i}`} x={X0 + i * STEP} y={LY + 44} textAnchor="middle" dominantBaseline="middle"
          fontSize={i % 5 === 0 ? 19 : 17} fontWeight={i % 5 === 0 ? 700 : 500} fill={INK}>{s}</text>
      ))}
      {majors.map((_, mi) => majorLabel(mi))}

      {/* answer */}
      {showAnswer && <circle cx={ansX} cy={LY} r={13} fill="none" stroke={GREEN} strokeWidth={4} />}
      {answerBand && <text x={330} y={LY + 102} textAnchor="middle" dominantBaseline="middle" fontSize={40} fontWeight={700} fill={GREEN}
        opacity={showAnswer ? 1 : 0}>{`Answer: ${d.ansStr}`}</text>}
    </svg>
  );
}

const questionRenderer = (
  q: AnyQuestion, showAnswer: boolean, _cs: string, compact?: boolean, idx?: number, qo?: { preview?: boolean; fullscreen?: boolean }, fontClass?: string,
): JSX.Element | null => {
  // Worked Example (compact === false, not the fullscreen whiteboard): the answer is found by
  // stepping through the working, so the question box never shows it — but the plot is set up.
  const workedExample = compact === false && !qo?.fullscreen;
  const revealAnswer = showAnswer && !workedExample;
  // Level 3 — the standard text question (plus the answer when revealed).
  if (q.kind === "worded") {
    const fc = fontClass ?? "text-xl";
    return (
      <div className="w-full flex flex-col items-center gap-2">
        <QuestionDisplay q={q} cls={fc} />
        {revealAnswer && <div className={`${fc} font-bold`} style={{ color: GREEN }}><AnswerDisplay q={q} /></div>}
      </div>
    );
  }
  const d = (q as any)._rounding as RoundingData | undefined;
  if (!d) return null;

  // Worksheet cell — the prompt lives inside the SVG so it prints with the diagram.
  if (compact === true) {
    // The hidden twin (its wrapper is display:none on screen via the `hidden` class; the print
    // code copies only the <svg>, so it stays visible there) is what the answer pages print: the same line with the plot/answer drawn on.
    return (
      <>
        <RoundingDiagram d={d} showAnswer={showAnswer} withPrompt idx={idx} />
        {idx !== undefined && <div className="hidden"><RoundingDiagram d={d} showAnswer withPrompt answerIdx={idx} /></div>}
      </>
    );
  }

  // Whiteboard / worked example — prompt as text (respects the size chevrons).
  const fc = fontClass ?? "text-3xl";
  return (
    <div className="w-full flex flex-col items-center gap-3">
      <div className={`${fc} font-bold`} style={{ color: "#000" }}>{d.prompt}</div>
      <div style={{ width: "100%", maxWidth: compact === false ? 900 : 680, margin: "0 auto" }}>
        <RoundingDiagram d={d} showAnswer={revealAnswer} withPrompt={false} preview={qo?.preview || (workedExample && showAnswer)} answerBand={!workedExample} />
      </div>
    </div>
  );
};

// ── 7. Worked-example steps (custom renderers) ────────────────────────────────

const stepLabelStyle = { textAlign: "left" as const, marginBottom: 4 };

/** The number as digit boxes: rounding digit (blue), decider (orange), the rest greyed. */
function DigitsView({ numStr, e, sf }: { numStr: string; e: number; sf: boolean }) {
  const [intPart] = numStr.replace(/,/g, "").split(".");
  let seenPoint = false, intIdx = 0, fracIdx = 0, seenNonZero = false;
  const cells = numStr.split("").map((ch, i) => {
    if (ch === "," || ch === ".") { if (ch === ".") seenPoint = true; return { key: i, sep: ch }; }
    const exp = seenPoint ? -(++fracIdx) : intPart.length - 1 - intIdx++;
    if (ch !== "0") seenNonZero = true;
    const lead = sf && !seenNonZero;      // leading zeros are not significant figures
    const kind = lead ? "lead" : exp > e ? "kept" : exp === e ? "round" : exp === e - 1 ? "decide" : "dropped";
    return { key: i, ch, kind };
  });
  const palette: Record<string, { bg: string; border: string; color: string }> = {
    kept: { bg: "#ffffff", border: "#94a3b8", color: "#0f172a" },
    round: { bg: "#dbeafe", border: "#2563eb", color: "#1d4ed8" },
    decide: { bg: "#fef3c7", border: "#d97706", color: "#b45309" },
    dropped: { bg: "#f1f5f9", border: "#cbd5e1", color: "#94a3b8" },
    lead: { bg: "#f1f5f9", border: "#cbd5e1", color: "#94a3b8" },
  };
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "26px 0", gap: 4 }}>
      {cells.map(c => "sep" in c && c.sep ? (
        <span key={c.key} style={{ fontSize: "2rem", fontWeight: 700, color: "#334155", alignSelf: "flex-end", lineHeight: 1.5 }}>{c.sep}</span>
      ) : (
        <Fragment key={c.key}>
        {/* the dotted "cut" line between the rounding digit and the decider */}
        {(c as any).kind === "decide" && <div style={{ alignSelf: "stretch", borderLeft: "3px dotted #334155", margin: "-8px 6px" }} />}
        <div style={{ position: "relative" }}>
          <div style={{ width: "2.6rem", height: "3.2rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: 700, borderRadius: 8, border: `2px solid ${palette[(c as any).kind].border}`, background: palette[(c as any).kind].bg, color: palette[(c as any).kind].color }}>{(c as any).ch}</div>
          {(c as any).kind === "round" && <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap", fontSize: "0.8rem", fontWeight: 700, color: "#1d4ed8", marginTop: 4 }}>rounding digit</div>}
          {(c as any).kind === "decide" && <div style={{ position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap", fontSize: "0.8rem", fontWeight: 700, color: "#b45309", marginBottom: 4 }}>decider</div>}
        </div>
        </Fragment>
      ))}
    </div>
  );
}

const stepRenderer = (s: WorkingStep): JSX.Element | null => {
  if (s.type === "roundDigits") {
    const x = s.extra as { numStr: string; e: number; sf: boolean };
    return (
      <div style={{ width: "100%" }}>
        <div style={stepLabelStyle}>{s.label}</div>
        <DigitsView numStr={x.numStr} e={x.e} sf={x.sf} />
        {x.sf && /^0\./.test(x.numStr) && <div style={{ fontSize: "0.85rem", color: "#64748b", textAlign: "center" }}>Leading zeros are not significant figures.</div>}
      </div>
    );
  }
  if (s.type === "roundLine") {
    const d = { ...(s.extra as RoundingData), level: "level1" as DifficultyLevel, labelMode: "ends" as LabelMode, plotted: true };
    return (
      <div style={{ width: "100%" }}>
        <div style={stepLabelStyle}>{s.label}</div>
        <div style={{ maxWidth: 760, margin: "0 auto" }}><RoundingDiagram d={d} showAnswer={false} withPrompt={false} answerBand={false} /></div>
      </div>
    );
  }
  return null;
};

// ═══════════════════════════════════════════════════════════════════════════════
// APP — leave unchanged
// ═══════════════════════════════════════════════════════════════════════════════

// Few questions → fewer, bigger columns so the sheet still fills the page (a wide line
// can only grow with its column width). 5 or fewer go one per row; otherwise the
// teacher's column count applies. Pages hold at most 12 (see _densityFloorMm).
// A pure Level 3 sheet is plain text, so it goes through the standard text print (which
// already scales to fit).
const printRounding: typeof handleDiagramPrint = (qs, mode, el, ctx) => {
  if (!ctx.isDifferentiated && qs.length > 0 && qs.every(q => q.difficulty === "level3")) {
    handlePrint(qs, ctx.toolName, ctx.difficulty, false, ctx.diffLevels, ctx.numColumns, ctx.instruction, mode, ctx.layout, ctx.showBorders, ctx.diffSameSize ?? true, ctx.diffColorLevels ?? true);
    return;
  }
  handleDiagramPrint(qs, mode, el, ctx.isDifferentiated ? ctx : { ...ctx, numColumns: qs.length <= 5 ? 1 : ctx.numColumns });
};

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      questionRenderer={questionRenderer}
      stepRenderer={stepRenderer}
      reformatQuestion={reformatQuestion}
      customPrintHandler={printRounding}
      defaults={{ numColumns: 2, maxColumns: 2, numQuestions: 12, qoColumns: 2, collapseWorkingByDefault: true, hideAnswerStep: true }}
    />
  );
}

export const __test = { TOOL_CONFIG, generateQuestion, levels: ["level1", "level2", "level3"] };
