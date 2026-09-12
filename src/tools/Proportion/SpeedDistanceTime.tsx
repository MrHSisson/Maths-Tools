import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type WordedQuestion,
  type ToolMultiSelect, type ToolVariable, type WorkingStep,
  randInt, pick, pickActive, mStep, mStr, fmt, rStep, ratioTableStepRenderer,
} from "../../shared";

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL-SPECIFIC SECTION
//
// Three subtools (Speed / Distance / Time) share one generation model: every
// question is built from a time "shape" (whole hours, a divisor-of-60 minute
// value, a compound hour+minute duration, or an awkward non-factor minute
// value) reduced to a fraction of an hour p/q, then scaled by a size knob k —
// D = k·q, S = k·p, T = p/q hours. Distance and speed always come out clean
// (whole, or a single terminating decimal place) by construction; which two
// of {D, S, T} the question GIVES and which one it ASKS FOR is the only thing
// that differs between the three subtools. The working is a ratio table
// scaling the given pair to a reference of "1 hour" (60 minutes) — see
// src/shared/ratioTable.ts and CLAUDE.md's "Core representations" table.
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. Types ──────────────────────────────────────────────────────────────────

type ToolType = "speed" | "distance" | "time";
type UnitFamily = "mph" | "kmh" | "mps";
type L3Type = "compoundTime" | "awkwardMinutes";
type TimeNotation = "minutes" | "decimal" | "compound" | "worded";

interface FamilyInfo {
  distanceUnit: string;
  timeUnit: string;
  rateUnit: string;
  subjects: string[];
  distMin: number; distMax: number;
  speedMin: number; speedMax: number;
}

const FAMILY: Record<UnitFamily, FamilyInfo> = {
  mph: { distanceUnit: "miles", timeUnit: "hours", rateUnit: "mph", subjects: ["A car", "A train", "A cyclist", "A coach"], distMin: 3, distMax: 120, speedMin: 5, speedMax: 90 },
  kmh: { distanceUnit: "km", timeUnit: "hours", rateUnit: "km/h", subjects: ["A car", "A train", "A lorry", "A cyclist"], distMin: 3, distMax: 200, speedMin: 5, speedMax: 140 },
  mps: { distanceUnit: "m", timeUnit: "seconds", rateUnit: "m/s", subjects: ["A sprinter", "A cyclist", "A dog", "A swimmer"], distMin: 3, distMax: 100, speedMin: 1, speedMax: 25 },
};

// ── 2. TOOL_CONFIG ────────────────────────────────────────────────────────────

const UNITS_L1: ToolMultiSelect = {
  key: "units", label: "Units",
  options: [
    { value: "mph", label: "Miles & hours (mph)", defaultActive: true },
    { value: "kmh", label: "Kilometres & hours (km/h)", defaultActive: true },
    { value: "mps", label: "Metres & seconds (m/s)", defaultActive: true },
  ],
};

const UNITS_L23: ToolMultiSelect = {
  key: "units", label: "Units",
  options: [
    { value: "mph", label: "Miles & hours (mph)", defaultActive: true },
    { value: "kmh", label: "Kilometres & hours (km/h)", defaultActive: true },
  ],
};

const NOTATION_L2: ToolMultiSelect = {
  key: "notation", label: "Time Notation",
  options: [
    { value: "minutes", label: "Minutes", defaultActive: true },
    { value: "decimal", label: "Decimal hours", defaultActive: true },
    { value: "worded", label: "Worded fraction", defaultActive: true },
  ],
};

const NOTATION_L3: ToolMultiSelect = {
  key: "notation", label: "Time Notation",
  options: [
    { value: "compound", label: "Hours & minutes", defaultActive: true },
    { value: "decimal", label: "Decimal hours", defaultActive: true },
    { value: "worded", label: "Worded fraction", defaultActive: true },
  ],
};

const L3_TYPES: ToolMultiSelect = {
  key: "l3Type", label: "Question Types",
  options: [
    { value: "compoundTime", label: "Compound time (1 hr 30)", defaultActive: true },
    { value: "awkwardMinutes", label: "Awkward minutes (40 min)", defaultActive: true },
  ],
};

const ALLOW_DECIMALS: ToolVariable = { key: "allowDecimals", label: "Allow decimal answers", defaultValue: false };

const makeSubtool = (name: string) => ({
  name,
  variables: [ALLOW_DECIMALS],
  dropdown: null,
  multiSelect: [UNITS_L1],
  difficultySettings: {
    level1: { multiSelect: [UNITS_L1] },
    level2: { multiSelect: [UNITS_L23, NOTATION_L2] },
    level3: { multiSelect: [UNITS_L23, NOTATION_L3, L3_TYPES] },
  },
});

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Speed, Distance & Time",
  tools: {
    speed: makeSubtool("Speed"),
    distance: makeSubtool("Distance"),
    time: makeSubtool("Time"),
  },
};

// ── 3. INFO_SECTIONS ──────────────────────────────────────────────────────────

const LEVEL_INFO = [
  { label: "Level 1 — Green", detail: "A whole number of hours (or seconds for m/s) — a direct division or multiplication." },
  { label: "Level 2 — Yellow", detail: "A time given in minutes that divides exactly into 60 — scale to reach one hour." },
  { label: "Level 3 — Red", detail: "A compound time (e.g. 1 hour 30 minutes) or a minute value that isn't a factor of 60 — needs the unitary method." },
];

const INFO_SECTIONS: InfoSection[] = [
  { title: "Speed", icon: "🚗", content: [
    { label: "Overview", detail: "Given a distance and a time, find the average speed using a ratio table to scale to one hour." },
    ...LEVEL_INFO,
  ]},
  { title: "Distance", icon: "📏", content: [
    { label: "Overview", detail: "Given a speed and a time, find the distance travelled." },
    ...LEVEL_INFO,
  ]},
  { title: "Time", icon: "⏱️", content: [
    { label: "Overview", detail: "Given a distance and a speed, find the time taken." },
    ...LEVEL_INFO,
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard", detail: "Single question for whole-class discussion." },
    { label: "Worked Example", detail: "Step-by-step ratio-table working shown below the question." },
    { label: "Worksheet", detail: "Grid of questions with PDF export." },
  ]},
  { title: "Question Options", icon: "⚙️", content: [
    { label: "Units", detail: "Which unit families can appear (m/s only appears at Level 1)." },
    { label: "Time Notation", detail: "How a split time is worded — minutes, decimal hours, hours & minutes, or a spoken fraction." },
    { label: "Question Types (Level 3)", detail: "Compound times (e.g. 1 hr 30) and/or awkward minute values (e.g. 40 min)." },
    { label: "Allow decimal answers", detail: "Lets the computed value be a terminating decimal (e.g. 12.5) instead of always a whole number." },
  ]},
];

// ── 4. Shared domain helpers ───────────────────────────────────────────────────

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

// Divisors of 60 (excluding 60 itself) — L2 picks any of these for "minutes"/
// "decimal" notation. "Worded" is further restricted below to only the ones
// with a genuinely natural spoken form — nobody says "a fifth of an hour" or
// "a twelfth of an hour" in real speech, even though they're valid fractions;
// those shapes just never offer "worded" and fall back to minutes/decimal.
const L2_MINUTES = [5, 6, 10, 12, 15, 20, 30];
const WORDED_L2: Record<number, string> = {
  30: "half an hour", 20: "a third of an hour", 15: "a quarter of an hour",
};

// L3 compound minute-parts — quarter/half/three-quarters only (a third would
// give a non-terminating decimal hours value, breaking the "decimal" notation).
const L3_COMPOUND_FRACS = [15, 30, 45];
const NICE_MINUTES = new Set([...L2_MINUTES, ...L3_COMPOUND_FRACS]);

const wordedCompound = (H: number, Mfrac: number): string => {
  const frac = Mfrac === 15 ? "a quarter" : Mfrac === 30 ? "a half" : "three quarters";
  return H === 1 ? `an hour and ${frac}` : `${H} and ${frac} hours`;
};

interface Shape { kind: "l1" | "l2" | "l3compound" | "l3awkward"; TM: number; H?: number; Mfrac?: number; }

// TM is always "minutes-equivalent" — for L1 it's just T0 * 60, a bookkeeping
// trick so every shape reduces through the same gcd(60, TM) machinery below.
const pickShape = (level: DifficultyLevel, family: UnitFamily, l3type: L3Type): Shape => {
  if (level === "level1") {
    const T0 = randInt(2, family === "mps" ? 10 : 12);
    return { kind: "l1", TM: T0 * 60 };
  }
  if (level === "level2") {
    return { kind: "l2", TM: pick(L2_MINUTES) };
  }
  if (l3type === "compoundTime") {
    const H = randInt(1, 3);
    const Mfrac = pick(L3_COMPOUND_FRACS);
    return { kind: "l3compound", TM: H * 60 + Mfrac, H, Mfrac };
  }
  for (let i = 0; i < 50; i++) {
    const TM = randInt(6, 54);
    if (60 % TM === 0 || NICE_MINUTES.has(TM)) continue;
    return { kind: "l3awkward", TM };
  }
  return { kind: "l3awkward", TM: 40 };
};

const numLatex = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1));

// Scale-factor label for the ratio table, reduced to lowest terms as n/d.
const scaleOp = (n: number, d: number): string =>
  d === 1 ? `\\times ${n}` : n === 1 ? `\\div ${d}` : `\\times \\dfrac{${n}}{${d}}`;

// Builds the row sequence for a ratio table as a chain of [distance, time]
// pairs plus the whole-number operation between each consecutive pair.
// A single combined scale factor (e.g. ×2/3) is never shown as one fractional
// multiply — when BOTH pp and qq are non-trivial (only possible at Level 3),
// it's decomposed into ÷qq then ×pp (or the reverse for "growTime"), passing
// through a whole-number "unit" row in between. At Levels 1–2, one of pp/qq
// is always 1 (the given time already scales to/from an hour directly), so
// this collapses back to the original single whole-number step.
const buildScaleSteps = (
  start: [number, number], pp: number, qq: number, direction: "shrinkTime" | "growTime",
): { pairs: [number, number][]; ops: string[] } => {
  const [firstFactor, secondFactor] = direction === "shrinkTime" ? [qq, pp] : [pp, qq];
  const [d0, t0] = start;
  if (firstFactor === 1) return { pairs: [[d0, t0], [d0 * secondFactor, t0 * secondFactor]], ops: [scaleOp(secondFactor, 1)] };
  if (secondFactor === 1) return { pairs: [[d0, t0], [d0 / firstFactor, t0 / firstFactor]], ops: [scaleOp(1, firstFactor)] };
  const unit: [number, number] = [d0 / firstFactor, t0 / firstFactor];
  const end: [number, number] = [unit[0] * secondFactor, unit[1] * secondFactor];
  return { pairs: [[d0, t0], unit, end], ops: [scaleOp(1, firstFactor), scaleOp(secondFactor, 1)] };
};

// D = k·qq, S = k·pp, where pp/qq = 60/TM reduced — picked so both land clean
// (whole, or exactly one decimal place when allowDecimals is on) and inside a
// realistic range for the unit family.
const buildValues = (TM: number, f: FamilyInfo, allowDecimals: boolean): { D: number; S: number; pp: number; qq: number } => {
  const g = gcd(60, TM);
  const pp = 60 / g, qq = TM / g;
  for (let attempt = 0; attempt < 80; attempt++) {
    const useHalf = allowDecimals && Math.random() < 0.35;
    const k = randInt(1, 30) + (useHalf ? 0.5 : 0);
    const D = k * qq, S = k * pp;
    if (D < f.distMin || D > f.distMax) continue;
    if (S < f.speedMin || S > f.speedMax) continue;
    return { D, S, pp, qq };
  }
  const k = Math.max(Math.ceil(f.distMin / qq), Math.ceil(f.speedMin / pp), 1);
  return { D: k * qq, S: k * pp, pp, qq };
};

// TM/60 only has an exact (non-repeating) decimal form when, reduced to
// lowest terms, its denominator's only prime factors are 2 and 5 — e.g. 5
// minutes = 1/12 hour = 0.08333… (repeating), so "decimal" must never be
// offered for that shape even though 5 divides 60 cleanly for the other
// notations.
const terminatesDecimal = (num: number, den: number): boolean => {
  let d = den / gcd(num, den);
  while (d % 2 === 0) d /= 2;
  while (d % 5 === 0) d /= 5;
  return d === 1;
};

const pickNotation = (shape: Shape, mv: Record<string, boolean>): TimeNotation => {
  if (shape.kind === "l1") return "minutes"; // unused — l1 always formatted directly
  if (shape.kind === "l3awkward") return "minutes";
  let opts = shape.kind === "l2" ? NOTATION_L2.options : NOTATION_L3.options;
  if (!terminatesDecimal(shape.TM, 60)) opts = opts.filter((o) => o.value !== "decimal");
  if (shape.kind === "l2" && !(shape.TM in WORDED_L2)) opts = opts.filter((o) => o.value !== "worded");
  return pickActive(mv, opts) as TimeNotation;
};

const formatDuration = (shape: Shape, family: UnitFamily, notation: TimeNotation): string => {
  if (shape.kind === "l1") {
    const T0 = shape.TM / 60;
    const unit = family === "mps" ? (T0 === 1 ? "second" : "seconds") : (T0 === 1 ? "hour" : "hours");
    return `${T0} ${unit}`;
  }
  if (notation === "decimal") return `${fmt(shape.TM / 60, 2)} hours`;
  if (notation === "compound" && shape.kind === "l3compound") return `${shape.H} hour${shape.H === 1 ? "" : "s"} ${shape.Mfrac} minutes`;
  if (notation === "worded") {
    if (shape.kind === "l2") return WORDED_L2[shape.TM] ?? `${shape.TM} minutes`;
    if (shape.kind === "l3compound") return wordedCompound(shape.H!, shape.Mfrac!);
  }
  return `${shape.TM} minutes`;
};

const timeLabel = (shape: Shape, f: FamilyInfo): string =>
  shape.kind === "l1" ? (f.timeUnit === "seconds" ? "Seconds" : "Hours") : "Minutes";

const timeCellValue = (shape: Shape): number => (shape.kind === "l1" ? shape.TM / 60 : shape.TM);

const hourRefValue = (shape: Shape): number => (shape.kind === "l1" ? 1 : 60);

// ── 5. Question builders ──────────────────────────────────────────────────────

const compoundConvertStep = (shape: Shape): WorkingStep[] =>
  shape.kind === "l3compound"
    ? [mStep("Convert to minutes:", `${shape.H} \\times 60 + ${shape.Mfrac} = ${shape.TM}`)]
    : [];

const buildCommon = (level: DifficultyLevel, family: UnitFamily, l3type: L3Type, allowDecimals: boolean) => {
  const shape = pickShape(level, family, l3type);
  const f = FAMILY[family];
  const { D, S, pp, qq } = buildValues(shape.TM, f, allowDecimals);
  const tLabel = timeLabel(shape, f);
  const tVal = timeCellValue(shape);
  const hourRef = hourRefValue(shape);
  const subject = pick(f.subjects);
  return { shape, f, D, S, pp, qq, tLabel, tVal, hourRef, subject };
};

const genSpeed = (level: DifficultyLevel, family: UnitFamily, l3type: L3Type, allowDecimals: boolean, notationMv: Record<string, boolean>): WordedQuestion => {
  const c = buildCommon(level, family, l3type, allowDecimals);
  const notation = pickNotation(c.shape, notationMv);
  const durationText = formatDuration(c.shape, family, notation);
  const id = randInt(0, 999999);

  const { pairs, ops } = buildScaleSteps([c.D, c.tVal], c.pp, c.qq, "shrinkTime");
  const working: WorkingStep[] = [
    ...compoundConvertStep(c.shape),
    rStep("Scale to find the speed:", [c.f.distanceUnit, c.tLabel],
      pairs.map(([d, t]) => [numLatex(d), numLatex(t)]), ops),
  ];

  return {
    kind: "worded",
    lines: [`${c.subject} travels ${mStr(numLatex(c.D))} ${c.f.distanceUnit} in ${durationText}.`, "Find its average speed."],
    answer: `${numLatex(c.S)} ${c.f.rateUnit}`,
    answerLatex: numLatex(c.S),
    answerSuffix: c.f.rateUnit,
    working,
    key: `speed-${level}-${family}-${c.shape.kind}-${c.D}-${c.S}-${notation}-${id}`,
    difficulty: level,
  };
};

const genDistance = (level: DifficultyLevel, family: UnitFamily, l3type: L3Type, allowDecimals: boolean, notationMv: Record<string, boolean>): WordedQuestion => {
  const c = buildCommon(level, family, l3type, allowDecimals);
  const notation = pickNotation(c.shape, notationMv);
  const durationText = formatDuration(c.shape, family, notation);
  const id = randInt(0, 999999);

  const { pairs, ops } = buildScaleSteps([c.S, c.hourRef], c.pp, c.qq, "growTime");
  const working: WorkingStep[] = [
    ...compoundConvertStep(c.shape),
    rStep("Scale from 1 hour to the given time:", [c.f.distanceUnit, c.tLabel],
      pairs.map(([d, t]) => [numLatex(d), numLatex(t)]), ops),
  ];

  return {
    kind: "worded",
    lines: [`${c.subject} travels at a speed of ${mStr(numLatex(c.S))} ${c.f.rateUnit}.`, `How far does it travel in ${durationText}?`],
    answer: `${numLatex(c.D)} ${c.f.distanceUnit}`,
    answerLatex: numLatex(c.D),
    answerSuffix: c.f.distanceUnit,
    working,
    key: `distance-${level}-${family}-${c.shape.kind}-${c.D}-${c.S}-${notation}-${id}`,
    difficulty: level,
  };
};

const genTime = (level: DifficultyLevel, family: UnitFamily, l3type: L3Type, allowDecimals: boolean, notationMv: Record<string, boolean>): WordedQuestion => {
  const c = buildCommon(level, family, l3type, allowDecimals);
  const notation = pickNotation(c.shape, notationMv);
  const answerText = formatDuration(c.shape, family, notation);
  const id = randInt(0, 999999);

  const { pairs, ops } = buildScaleSteps([c.S, c.hourRef], c.pp, c.qq, "growTime");
  const working: WorkingStep[] = [
    rStep("Scale from 1 hour to find the time:", [c.f.distanceUnit, c.tLabel],
      pairs.map(([d, t]) => [numLatex(d), numLatex(t)]), ops),
    ...(c.shape.kind === "l3compound" ? [mStep("Write as hours and minutes:", `${c.tVal} = ${c.shape.H} \\times 60 + ${c.shape.Mfrac}`)] : []),
  ];
  // The final answer is stated in prose (e.g. "an hour and a half"), which may
  // not be pure KaTeX — set via `answer` only, no answerLatex (see AnswerDisplay's
  // fallback: it renders the plain `answer` text when answerLatex is absent).

  return {
    kind: "worded",
    lines: [`${c.subject} travels ${mStr(numLatex(c.D))} ${c.f.distanceUnit} at a speed of ${mStr(numLatex(c.S))} ${c.f.rateUnit}.`, "How long does the journey take?"],
    answer: answerText,
    working,
    key: `time-${level}-${family}-${c.shape.kind}-${c.D}-${c.S}-${notation}-${id}`,
    difficulty: level,
  };
};

// ── 6. generateQuestion ───────────────────────────────────────────────────────

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  _dropdownValue: string,
  multiSelectValues: Record<string, boolean> = {},
): WordedQuestion => {
  const t = tool as ToolType;
  const allowDecimals = variables.allowDecimals === true;
  const unitOptions = level === "level1" ? UNITS_L1.options : UNITS_L23.options;
  const family = pickActive(multiSelectValues, unitOptions) as UnitFamily;
  const l3type = level === "level3" ? (pickActive(multiSelectValues, L3_TYPES.options) as L3Type) : "awkwardMinutes";

  if (t === "speed") return genSpeed(level, family, l3type, allowDecimals, multiSelectValues);
  if (t === "distance") return genDistance(level, family, l3type, allowDecimals, multiSelectValues);
  return genTime(level, family, l3type, allowDecimals, multiSelectValues);
};

// Worksheet uniqueness is automatic — ToolShell wraps generateQuestion with the
// standard retry-until-unique loop. No generateUniqueQ needed.

// ═══════════════════════════════════════════════════════════════════════════════
// END OF TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

export const __test = { TOOL_CONFIG, generateQuestion };

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      stepRenderer={ratioTableStepRenderer}
      defaults={{ displayFontSize: 2, worksheetFontSize: 1 }}
    />
  );
}
