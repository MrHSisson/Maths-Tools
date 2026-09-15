import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type WordedQuestion, type QOSnapshot,
  type ToolMultiSelect, type ToolVariable, type ToolDropdown, type WorkingStep,
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
// The WORKED EXAMPLE's method is a separate, display-only choice (same
// precedent as ExpandingBrackets.tsx's FOIL/Grid dropdown): "ratioTable" is
// the default unitary-method scaling; "decimal" instead converts the time to
// decimal hours and divides/multiplies by it directly — genuinely useful as
// a taught method even though its intermediate value ("0.1 hours") would
// never appear as a question's own wording.
type WorkingMethod = "ratioTable" | "decimal";

interface FamilyInfo {
  distanceUnit: string;
  timeUnit: string;
  rateUnit: string;
  subjects: string[];
  distMin: number; distMax: number;
  speedMin: number; speedMax: number;
}

const FAMILY: Record<UnitFamily, FamilyInfo> = {
  mph: { distanceUnit: "miles", timeUnit: "hours", rateUnit: "mph", subjects: ["A car", "A train", "A cyclist", "A coach"], distMin: 3, distMax: 180, speedMin: 5, speedMax: 90 },
  kmh: { distanceUnit: "km", timeUnit: "hours", rateUnit: "km/h", subjects: ["A car", "A train", "A lorry", "A cyclist"], distMin: 3, distMax: 260, speedMin: 5, speedMax: 140 },
  mps: { distanceUnit: "m", timeUnit: "seconds", rateUnit: "m/s", subjects: ["A sprinter", "A cyclist", "A dog", "A swimmer"], distMin: 3, distMax: 140, speedMin: 1, speedMax: 28 },
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

const METHOD_DROPDOWN: ToolDropdown = {
  key: "method", label: "Method",
  options: [
    { value: "ratioTable", label: "Ratio Table" },
    { value: "decimal", label: "Decimal" },
  ],
  defaultValue: "ratioTable",
  // Swaps the working steps only — same question and answer either way — so
  // it has nothing to offer a printed worksheet.
  workedExampleOnly: true,
};

// Caps every multiplication/division fact the question generation and its
// ratio-table working actually rely on (the scale factor k, and the shape's
// pp/qq divisors — see pickShape/buildValues) so a student is never asked to
// invert a fact outside their tables. Default is 10×10-only so the tool is
// restrictive out of the box; ticking 20×20 on top opts into the wider,
// larger-number question pool as well.
const TABLES_MS: ToolMultiSelect = {
  key: "tablesLimit", label: "Times Tables",
  options: [
    { value: "10", label: "Up to 10×10", defaultActive: true },
    { value: "20", label: "Up to 20×20", defaultActive: false },
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

// Level 2 only — replaces ALLOW_DECIMALS there rather than sitting alongside
// it, since it's a strict upgrade: genuine 1-2dp decimals (always terminating)
// instead of the old single ±0.5 nudge. See pickShape/buildDecimalValues.
const ALLOW_TERMINATING_DECIMALS: ToolVariable = { key: "terminatingDecimals", label: "Allow terminating decimals (e.g. 1.6, 2.25)", defaultValue: false };

const makeSubtool = (name: string) => ({
  name,
  variables: [ALLOW_DECIMALS],
  dropdown: METHOD_DROPDOWN,
  multiSelect: [UNITS_L1, TABLES_MS],
  difficultySettings: {
    level1: { multiSelect: [UNITS_L1, TABLES_MS] },
    level2: { variables: [ALLOW_TERMINATING_DECIMALS], multiSelect: [UNITS_L23, TABLES_MS] },
    level3: { multiSelect: [UNITS_L23, L3_TYPES, TABLES_MS] },
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
    { label: "Overview", detail: "Given a distance and a time, find the average speed using a ratio table to scale to one hour. The question always names the required unit (mph, km/h or m/s)." },
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
    { label: "Worked Example", detail: "Step-by-step working shown below the question — see Method below for the two available styles." },
    { label: "Worksheet", detail: "Grid of questions with PDF export." },
  ]},
  { title: "Question Options", icon: "⚙️", content: [
    { label: "Units", detail: "Which unit families can appear (m/s only appears at Level 1)." },
    { label: "Time wording", detail: "A given time is always stated in plain minutes, or hours & minutes for a compound time (e.g. '1 hour 30 minutes') — never as a spoken fraction (e.g. 'a quarter of an hour') or a decimal." },
    { label: "Method", detail: "Ratio Table (default) scales to/from one hour using whole-number steps. Decimal instead converts the time to decimal hours and divides/multiplies by that — shown only where the conversion is exact; otherwise it falls back to the Ratio Table method." },
    { label: "Question Types (Level 3)", detail: "Compound times (e.g. 1 hr 30) and/or awkward minute values (e.g. 40 min)." },
    { label: "Times Tables", detail: "Caps every multiplication/division fact the question relies on — including the scale factor in the ratio table working — so a student is never asked to invert a fact outside their tables. Doesn't restrict Level 2's minute value itself, since scaling a divisor of 60 up to one hour is a fixed conversion fact rather than a times-tables one. 'Up to 10×10' is on by default; tick 'Up to 20×20' as well to also allow larger, more demanding numbers." },
    { label: "Allow decimal answers", detail: "Lets the computed value be a terminating decimal (e.g. 12.5) instead of always a whole number." },
    { label: "Allow terminating decimals (Level 2 only)", detail: "Replaces 'Allow decimal answers' at Level 2. The given time is a tenth, fifth, quarter or half of an hour, and a whole-number speed/distance is scaled by that exact fraction — so the computed answer can genuinely land on a 1-2dp decimal (e.g. 8 km/h for a fifth of an hour = 1.6 km), never a repeating one (no ⅓ or ⅙-hour times)." },
  ]},
];

// ── 4. Shared domain helpers ───────────────────────────────────────────────────

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

// Divisors of 60 (excluding 60 itself, and excluding 1 — a 1-minute road
// journey can't land a realistic speed within this tool's distance/speed
// ranges for any family) — L2 picks any of these. The given TIME is always
// worded as plain minutes (e.g. "15 minutes"), never as a spoken fraction or
// a decimal — see formatDuration. The computed distance/speed answer CAN be
// a decimal when "Allow terminating decimals" is on — see L2_DECIMAL_MINUTES.
const L2_MINUTES = [2, 3, 5, 6, 10, 12, 15, 20, 30];

// The subset of L2_MINUTES used when "Allow terminating decimals" is on —
// only values whose TM/60 fraction terminates. The non-terminating ones (2,
// 5, 10, 20 — e.g. 10 minutes = 1/6 hour = 0.1666…) are excluded; the
// terminating ones (a twentieth, tenth, fifth, quarter, half) are all
// reachable at any Times Tables setting since buildDecimalValues scales the
// rate by the shape's own pp, not by tablesLimit directly.
const L2_DECIMAL_MINUTES = [3, 6, 12, 15, 30];

// L3 compound minute-parts — quarter/half/three-quarters only (a third would
// give a non-terminating decimal hours value, breaking the "decimal" WORKING
// METHOD — see decimalMethodApplies).
const L3_COMPOUND_FRACS = [15, 30, 45];
const NICE_MINUTES = new Set([...L2_MINUTES, ...L3_COMPOUND_FRACS]);

interface Shape { kind: "l1" | "l2" | "l3compound" | "l3awkward"; TM: number; H?: number; Mfrac?: number; }

// The reduced pp/qq (60/TM in lowest terms) are the actual divisors the ratio
// table divides/multiplies by — the fact a student must invert. Both must fit
// the selected tables limit, or the working asks for a fact outside it (e.g.
// a compound time giving qq=11 is fine at 20×20 but too big at 10×10). Used
// for L3 shapes only — L2's TM is always an exact divisor of 60 (qq is always
// 1), so its pp is purely "minutes in an hour", a fixed conversion fact
// rather than an arbitrary times-tables one, and is exempt from this cap
// (see pickShape's level2 branch).
const withinTables = (TM: number, tablesLimit: number): boolean => {
  const g = gcd(60, TM);
  return 60 / g <= tablesLimit && TM / g <= tablesLimit;
};

// L3 compound (H hours + a quarter/half/three-quarters) combos whose pp/qq
// stay within the tables limit — e.g. 2hr45 gives qq=11, too big for 10×10.
const compoundCombos = (tablesLimit: number): { H: number; Mfrac: number }[] => {
  const combos: { H: number; Mfrac: number }[] = [];
  for (let H = 1; H <= 3; H++) {
    for (const Mfrac of L3_COMPOUND_FRACS) {
      if (withinTables(H * 60 + Mfrac, tablesLimit)) combos.push({ H, Mfrac });
    }
  }
  return combos;
};

// TM is always "minutes-equivalent" — for L1 it's just T0 * 60, a bookkeeping
// trick so every shape reduces through the same gcd(60, TM) machinery below.
// tablesLimit (10 or 20, from the "Times Tables" QO) caps every fact the
// question ends up needing: T0 directly here, pp/qq via withinTables below,
// and the scale factor k in buildValues.
const pickShape = (level: DifficultyLevel, family: UnitFamily, l3type: L3Type, tablesLimit: number, decimalsMode: boolean): Shape => {
  if (level === "level1") {
    const maxT0 = Math.min(family === "mps" ? 10 : 12, tablesLimit);
    const T0 = randInt(2, maxT0);
    return { kind: "l1", TM: T0 * 60 };
  }
  if (level === "level2") {
    // Not gated by tablesLimit — see withinTables' comment above.
    return { kind: "l2", TM: pick(decimalsMode ? L2_DECIMAL_MINUTES : L2_MINUTES) };
  }
  if (l3type === "compoundTime") {
    const combos = compoundCombos(tablesLimit);
    const { H, Mfrac } = pick(combos.length ? combos : [{ H: 1, Mfrac: 15 }]);
    return { kind: "l3compound", TM: H * 60 + Mfrac, H, Mfrac };
  }
  for (let i = 0; i < 50; i++) {
    const TM = randInt(6, 54);
    if (60 % TM === 0 || NICE_MINUTES.has(TM)) continue;
    // TM coprime to 60 forces qq = TM and pp = 60 exactly — the scale-up
    // factor to reach 60 is then ×60 outright, which the distance/speed
    // ranges below can only satisfy at k=1 (any larger k blows the speed
    // range). k=1 makes D = qq = TM exactly — "37 miles in 37 minutes" —
    // a coincidence forced this way far too often to read as a real
    // question. Requiring a shared factor keeps qq small enough for k to
    // vary genuinely.
    if (gcd(60, TM) === 1) continue;
    if (!withinTables(TM, tablesLimit)) continue;
    return { kind: "l3awkward", TM };
  }
  return { kind: "l3awkward", TM: 40 };
};

// fmt's default (2dp, trailing zeros stripped) is a strict superset of the
// old integer/1dp-only behaviour — also needed for "Allow terminating
// decimals" answers like 2.25.
const numLatex = (n: number): string => fmt(n);

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
// realistic range for the unit family. k is itself capped by tablesLimit —
// it's the other side of the pp/qq fact a student inverts (e.g. qq=8, k=13
// asks for "8 × 13", a fact well outside 10×10 even though 8 itself isn't).
const buildValues = (TM: number, f: FamilyInfo, allowDecimals: boolean, tablesLimit: number): { D: number; S: number; pp: number; qq: number } => {
  const g = gcd(60, TM);
  const pp = 60 / g, qq = TM / g;
  for (let attempt = 0; attempt < 80; attempt++) {
    const useHalf = allowDecimals && Math.random() < 0.35;
    const k = randInt(1, tablesLimit) + (useHalf ? 0.5 : 0);
    const D = k * qq, S = k * pp;
    if (D < f.distMin || D > f.distMax) continue;
    if (S < f.speedMin || S > f.speedMax) continue;
    if (D === TM) continue; // "37 miles in 37 minutes" reads as a coincidence, not a real question
    return { D, S, pp, qq };
  }
  let k = Math.min(Math.max(Math.ceil(f.distMin / qq), Math.ceil(f.speedMin / pp), 1), tablesLimit);
  if (k * qq === TM && (k + 1) * qq <= f.distMax && (k + 1) * pp <= f.speedMax && k + 1 <= tablesLimit) k += 1;
  return { D: k * qq, S: k * pp, pp, qq };
};

// Used instead of buildValues for L2 shapes when "Allow terminating
// decimals" is on (TM drawn from L2_DECIMAL_MINUTES, so TM/60 always
// terminates within 2dp). Rather than forcing D and S into clean multiples
// of pp/qq, the rate S is picked freely as a whole number within the Times
// Tables cap and the distance D is derived by scaling with the exact
// fraction — so D can genuinely land on a 1-2dp decimal (e.g. 8 × 1/5 = 1.6)
// instead of always being a clean multiple. Uses a distance floor of 1
// rather than the family's usual distMin — a small decimal distance (e.g.
// 1.6 miles) is a perfectly realistic journey, and the usual distMin (3)
// would make the smaller fractions (a tenth, a fifth) unreachable under the
// Times Tables cap.
const buildDecimalValues = (TM: number, f: FamilyInfo, tablesLimit: number): { D: number; S: number; pp: number; qq: number } => {
  const g = gcd(60, TM);
  const pp = 60 / g, qq = TM / g;
  const frac = TM / 60;
  const decimalDistMin = 1;
  // Mirrors buildValues' effective S = k·pp (k ≤ tablesLimit) — the actual
  // fact a student inverts is D × pp = S, not S itself, so S can range up to
  // tablesLimit·pp, not just tablesLimit (capping S alone at 10 made every
  // decimal-mode speed 1-10 regardless of the chosen fraction).
  const sMax = tablesLimit * pp;
  for (let attempt = 0; attempt < 80; attempt++) {
    const S = randInt(1, sMax);
    const D = Math.round(S * frac * 100) / 100;
    if (D < decimalDistMin || D > f.distMax) continue;
    if (S < f.speedMin || S > f.speedMax) continue;
    if (D === TM) continue; // "37 miles in 37 minutes" reads as a coincidence, not a real question
    return { D, S, pp, qq };
  }
  const S = Math.min(Math.max(Math.ceil(decimalDistMin / frac), f.speedMin, 1), sMax, f.speedMax);
  const D = Math.round(S * frac * 100) / 100;
  return { D, S, pp, qq };
};

// TM/60 only has an exact (non-repeating) decimal form when, reduced to
// lowest terms, its denominator's only prime factors are 2 and 5 — e.g. 5
// minutes = 1/12 hour = 0.08333… (repeating). Used to gate the "Decimal"
// WORKING METHOD (never a question's own wording, which never uses decimal
// hours at all — see formatDuration).
const terminatesDecimal = (num: number, den: number): boolean => {
  let d = den / gcd(num, den);
  while (d % 2 === 0) d /= 2;
  while (d % 5 === 0) d /= 5;
  return d === 1;
};

// A given/answer time is always plain minutes, or hours & minutes for a
// compound time — never a spoken fraction (e.g. "a quarter of an hour") or
// a decimal.
const formatDuration = (shape: Shape, family: UnitFamily): string => {
  if (shape.kind === "l1") {
    const T0 = shape.TM / 60;
    const unit = family === "mps" ? (T0 === 1 ? "second" : "seconds") : (T0 === 1 ? "hour" : "hours");
    return `${T0} ${unit}`;
  }
  if (shape.kind === "l3compound") return `${shape.H} hour${shape.H === 1 ? "" : "s"} ${shape.Mfrac} minutes`;
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

const buildCommon = (level: DifficultyLevel, family: UnitFamily, l3type: L3Type, allowDecimals: boolean, tablesLimit: number, decimalsMode: boolean) => {
  const shape = pickShape(level, family, l3type, tablesLimit, decimalsMode);
  const f = FAMILY[family];
  const { D, S, pp, qq } = decimalsMode && shape.kind === "l2"
    ? buildDecimalValues(shape.TM, f, tablesLimit)
    : buildValues(shape.TM, f, allowDecimals, tablesLimit);
  const tLabel = timeLabel(shape, f);
  const tVal = timeCellValue(shape);
  const hourRef = hourRefValue(shape);
  const subject = pick(f.subjects);
  return { shape, f, D, S, pp, qq, tLabel, tVal, hourRef, subject };
};

// Everything buildWorking() needs to rebuild the working steps for either
// method, stored on the question so reformatQuestion can redo this without
// regenerating the question itself (same pattern as ExpandingBrackets.tsx's
// "method" dropdown — see reformatQuestion below).
interface RawValues {
  tool: ToolType;
  D: number; S: number; TM: number; pp: number; qq: number;
  tLabel: string; hourRef: number; tVal: number;
  distanceUnit: string;
  shapeKind: Shape["kind"]; H?: number; Mfrac?: number;
}

// The "Decimal" method only differs from "Ratio Table" when there's an
// actual sub-hour fraction to convert AND that fraction is an exact decimal
// (Level 1 is already whole hours; a non-terminating Level 3 shape has no
// clean decimal to divide/multiply by) — otherwise it silently falls back to
// the ratio-table working, which is already the correct/only clean method.
const decimalMethodApplies = (rv: RawValues): boolean =>
  rv.shapeKind !== "l1" && terminatesDecimal(rv.TM, 60);

const buildWorking = (rv: RawValues, method: WorkingMethod): WorkingStep[] => {
  const shape: Shape = { kind: rv.shapeKind, TM: rv.TM, H: rv.H, Mfrac: rv.Mfrac };
  const convertStep = compoundConvertStep(shape);

  if (method === "decimal" && decimalMethodApplies(rv)) {
    const decStr = fmt(rv.TM / 60, 2);
    // A compound time converts the MINUTES part straight to decimal hours
    // and adds the whole hours — never via a "total minutes" detour (e.g.
    // "45 min ÷ 60 = 0.75, then 1 + 0.75 = 1.75", not "1×60+45=105, then
    // 105÷60=1.75"). Speed/Distance are the only tools that need this — Time
    // computes decStr FROM D and S, it never starts from a given compound time.
    const decimalConvertSteps: WorkingStep[] =
      rv.shapeKind === "l3compound"
        ? [
            mStep("Convert the minutes to hours:", `${rv.Mfrac} \\div 60 = ${fmt((rv.Mfrac ?? 0) / 60, 2)}`),
            mStep("Add the hours:", `${rv.H} + ${fmt((rv.Mfrac ?? 0) / 60, 2)} = ${decStr}`),
          ]
        : [mStep("Convert the time to decimal hours:", `${rv.TM} \\div 60 = ${decStr}`)];

    if (rv.tool === "speed") {
      return [
        ...decimalConvertSteps,
        mStep("Divide the distance by this:", `${numLatex(rv.D)} \\div ${decStr} = ${numLatex(rv.S)}`),
      ];
    }
    if (rv.tool === "distance") {
      return [
        ...decimalConvertSteps,
        mStep("Multiply the speed by this:", `${numLatex(rv.S)} \\times ${decStr} = ${numLatex(rv.D)}`),
      ];
    }
    return [
      mStep("Divide the distance by the speed:", `${numLatex(rv.D)} \\div ${numLatex(rv.S)} = ${decStr}`),
      mStep("Convert decimal hours to minutes:", `${decStr} \\times 60 = ${rv.TM}`),
    ];
  }

  if (rv.tool === "speed") {
    const { pairs, ops } = buildScaleSteps([rv.D, rv.tVal], rv.pp, rv.qq, "shrinkTime");
    return [
      ...convertStep,
      rStep("Scale to find the speed:", [rv.distanceUnit, rv.tLabel],
        pairs.map(([d, t]) => [numLatex(d), numLatex(t)]), ops),
    ];
  }
  if (rv.tool === "distance") {
    const { pairs, ops } = buildScaleSteps([rv.S, rv.hourRef], rv.pp, rv.qq, "growTime");
    return [
      ...convertStep,
      rStep("Scale from 1 hour to the given time:", [rv.distanceUnit, rv.tLabel],
        pairs.map(([d, t]) => [numLatex(d), numLatex(t)]), ops),
    ];
  }
  const { pairs, ops } = buildScaleSteps([rv.S, rv.hourRef], rv.pp, rv.qq, "growTime");
  return [
    rStep("Scale from 1 hour to find the time:", [rv.distanceUnit, rv.tLabel],
      pairs.map(([d, t]) => [numLatex(d), numLatex(t)]), ops),
    ...(rv.shapeKind === "l3compound" ? [mStep("Write as hours and minutes:", `${rv.tVal} = ${rv.H} \\times 60 + ${rv.Mfrac}`)] : []),
  ];
};

const genSpeed = (level: DifficultyLevel, family: UnitFamily, l3type: L3Type, allowDecimals: boolean, decimalsMode: boolean, method: WorkingMethod, tablesLimit: number): WordedQuestion => {
  const c = buildCommon(level, family, l3type, allowDecimals, tablesLimit, decimalsMode);
  const durationText = formatDuration(c.shape, family);
  const id = randInt(0, 999999);
  const rv: RawValues = {
    tool: "speed", D: c.D, S: c.S, TM: c.shape.TM, pp: c.pp, qq: c.qq,
    tLabel: c.tLabel, hourRef: c.hourRef, tVal: c.tVal,
    distanceUnit: c.f.distanceUnit, shapeKind: c.shape.kind, H: c.shape.H, Mfrac: c.shape.Mfrac,
  };

  return {
    kind: "worded",
    // Names the required unit explicitly — with three possible rate units
    // (mph/km/h/m/s), "Find its average speed." alone leaves the expected
    // unit ambiguous.
    lines: [`${c.subject} travels ${mStr(numLatex(c.D))} ${c.f.distanceUnit} in ${durationText}.`, `Find its average speed in ${c.f.rateUnit}.`],
    answer: `${numLatex(c.S)} ${c.f.rateUnit}`,
    answerLatex: numLatex(c.S),
    answerSuffix: c.f.rateUnit,
    working: buildWorking(rv, method),
    key: `speed-${level}-${family}-${c.shape.kind}-${c.D}-${c.S}-${method}-${tablesLimit}-${id}`,
    difficulty: level,
    _rawValues: rv,
  } as unknown as WordedQuestion;
};

const genDistance = (level: DifficultyLevel, family: UnitFamily, l3type: L3Type, allowDecimals: boolean, decimalsMode: boolean, method: WorkingMethod, tablesLimit: number): WordedQuestion => {
  const c = buildCommon(level, family, l3type, allowDecimals, tablesLimit, decimalsMode);
  const durationText = formatDuration(c.shape, family);
  const id = randInt(0, 999999);
  const rv: RawValues = {
    tool: "distance", D: c.D, S: c.S, TM: c.shape.TM, pp: c.pp, qq: c.qq,
    tLabel: c.tLabel, hourRef: c.hourRef, tVal: c.tVal,
    distanceUnit: c.f.distanceUnit, shapeKind: c.shape.kind, H: c.shape.H, Mfrac: c.shape.Mfrac,
  };

  return {
    kind: "worded",
    lines: [`${c.subject} travels at a speed of ${mStr(numLatex(c.S))} ${c.f.rateUnit}.`, `How far does it travel in ${durationText}?`],
    answer: `${numLatex(c.D)} ${c.f.distanceUnit}`,
    answerLatex: numLatex(c.D),
    answerSuffix: c.f.distanceUnit,
    working: buildWorking(rv, method),
    key: `distance-${level}-${family}-${c.shape.kind}-${c.D}-${c.S}-${method}-${tablesLimit}-${id}`,
    difficulty: level,
    _rawValues: rv,
  } as unknown as WordedQuestion;
};

const genTime = (level: DifficultyLevel, family: UnitFamily, l3type: L3Type, allowDecimals: boolean, decimalsMode: boolean, method: WorkingMethod, tablesLimit: number): WordedQuestion => {
  const c = buildCommon(level, family, l3type, allowDecimals, tablesLimit, decimalsMode);
  const answerText = formatDuration(c.shape, family);
  const id = randInt(0, 999999);
  const rv: RawValues = {
    tool: "time", D: c.D, S: c.S, TM: c.shape.TM, pp: c.pp, qq: c.qq,
    tLabel: c.tLabel, hourRef: c.hourRef, tVal: c.tVal,
    distanceUnit: c.f.distanceUnit, shapeKind: c.shape.kind, H: c.shape.H, Mfrac: c.shape.Mfrac,
  };
  // The final answer is stated in prose (e.g. "1 hour 30 minutes"), which may
  // not be pure KaTeX — set via `answer` only, no answerLatex (see AnswerDisplay's
  // fallback: it renders the plain `answer` text when answerLatex is absent).

  return {
    kind: "worded",
    lines: [`${c.subject} travels ${mStr(numLatex(c.D))} ${c.f.distanceUnit} at a speed of ${mStr(numLatex(c.S))} ${c.f.rateUnit}.`, "How long does the journey take?"],
    answer: answerText,
    working: buildWorking(rv, method),
    key: `time-${level}-${family}-${c.shape.kind}-${c.D}-${c.S}-${method}-${tablesLimit}-${id}`,
    difficulty: level,
    _rawValues: rv,
  } as unknown as WordedQuestion;
};

// ── 6. generateQuestion ───────────────────────────────────────────────────────

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string,
  multiSelectValues: Record<string, boolean> = {},
): WordedQuestion => {
  const t = tool as ToolType;
  const allowDecimals = variables.allowDecimals === true;
  const decimalsMode = variables.terminatingDecimals === true;
  const method = (dropdownValue || "ratioTable") as WorkingMethod;
  const unitOptions = level === "level1" ? UNITS_L1.options : UNITS_L23.options;
  const family = pickActive(multiSelectValues, unitOptions) as UnitFamily;
  const l3type = level === "level3" ? (pickActive(multiSelectValues, L3_TYPES.options) as L3Type) : "awkwardMinutes";
  const tablesLimit = Number(pickActive(multiSelectValues, TABLES_MS.options));

  if (t === "speed") return genSpeed(level, family, l3type, allowDecimals, decimalsMode, method, tablesLimit);
  if (t === "distance") return genDistance(level, family, l3type, allowDecimals, decimalsMode, method, tablesLimit);
  return genTime(level, family, l3type, allowDecimals, decimalsMode, method, tablesLimit);
};

// Worksheet uniqueness is automatic — ToolShell wraps generateQuestion with the
// standard retry-until-unique loop. No generateUniqueQ needed.

// ── 7. reformatQuestion ───────────────────────────────────────────────────────
// Switching the "Method" dropdown swaps the working steps only — same D/S/T,
// same question wording — without regenerating the question. Same pattern as
// src/tools/Algebra/ExpandingBrackets.tsx's FOIL/Grid method dropdown.

const reformatQuestion = (q: AnyQuestion, qo: QOSnapshot): AnyQuestion | null => {
  const rv = (q as any)._rawValues as RawValues | undefined;
  if (!rv) return null;
  const method = (qo.dropdownValue || "ratioTable") as WorkingMethod;
  return { ...q, working: buildWorking(rv, method) } as unknown as AnyQuestion;
};

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
      reformatQuestion={reformatQuestion}
      stepRenderer={ratioTableStepRenderer}
      defaults={{ displayFontSize: 2, worksheetFontSize: 1 }}
    />
  );
}
