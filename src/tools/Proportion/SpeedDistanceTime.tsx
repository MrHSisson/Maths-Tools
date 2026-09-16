import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type WordedQuestion, type QOSnapshot,
  type ToolMultiSelect, type ToolDropdown, type WorkingStep,
  randInt, pick, pickActive, mStep, mStr, fmt, rStep, ratioTableStepRenderer, weightOf,
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

// Level 2 only — how the given/answer time is worded. A pure variety choice
// (unweighted, no Smart Progressor participation — see TIME_NOTATION_L2),
// not a difficulty axis: "a quarter of an hour" isn't harder than "15
// minutes" by design, just a different, equally valid phrasing.
type TimeNotation = "minutes" | "wordedFraction";

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

const L3_TYPES: ToolMultiSelect = {
  key: "l3Type", label: "Question Types",
  options: [
    { value: "compoundTime", label: "Compound time (1 hr 30)", defaultActive: true },
    { value: "awkwardMinutes", label: "Awkward minutes (40 min)", defaultActive: true },
  ],
};

// The Smart Progressor difficulty ladder — one ordinal multiSelect pool (see
// weightOf/sortByDifficulty in shared/helpers.ts), shared by ALL THREE
// levels (same key/options object reused across difficultySettings, same
// pattern as UNITS_L23). Each question draws one active rung via pickActive,
// weighted so a worksheet's easier rungs land in its earlier questions.
// Replaces what used to be an independent Times-Tables multiSelect +
// "Allow decimal answers" boolean at every level.
//
// The three rungs are MUTUALLY EXCLUSIVE, not overlapping ranges — a genuine
// ladder, not three independent caps:
//   - "tables10": the scale factor k (the fact a student inverts, alongside
//     the shape's own pp/qq — see buildValues) is drawn from 1-10.
//   - "tables20": k is drawn from 11-20 ONLY — a harder, disjoint fact range,
//     never overlapping tables10's 1-10 (the old "Up to 20×20" cap included
//     every 1-10 fact too, so it didn't read as strictly harder). At Level 3
//     this also excludes any time shape reachable at the 10-tier (see
//     pickShape's requireAboveTen) — genuinely harder, not just a wider net.
//   - "decimals": THIS SUBTOOL'S OWN ANSWER (S for Speed, D for Distance —
//     Time's answer is the time itself, unaffected either way) is GUARANTEED
//     to be a genuine decimal, not just eligible to land on one. buildValues
//     always adds the +0.5 that used to be a 35%-chance "useHalf" roll — but
//     k·pp (or k·qq) only comes out fractional when the multiplied factor is
//     itself ODD, so pickShape additionally only offers a time shape whose
//     pp/qq lines up with whichever of S/D this subtool is asking for (see
//     pickShape's target-aware branches, and buildCommon's genSpeed passing
//     "S" vs. genDistance/genTime passing "D").
// See TABLES_TIER below and buildValues/pickShape for exactly what each rung
// changes.
const DIFFICULTY_TIER: ToolMultiSelect = {
  key: "difficultyTier", label: "Difficulty",
  options: [
    { value: "tables10", label: "1-10 times tables", defaultActive: true, weight: 1 },
    { value: "tables20", label: "11-20 times tables", defaultActive: false, weight: 2 },
    { value: "decimals", label: "Decimals (e.g. 1.6, 4.5)", defaultActive: false, weight: 3 },
  ],
};

const TABLES_TIER: Record<string, { kMin: number; kMax: number; decimalsMode: boolean }> = {
  tables10: { kMin: 1, kMax: 10, decimalsMode: false },
  tables20: { kMin: 11, kMax: 20, decimalsMode: false },
  decimals: { kMin: 1, kMax: 20, decimalsMode: true },
};

// Level 2's time wording — a peer choice (mph-vs-km/h style variety, not an
// ordinal ladder), so deliberately UNWEIGHTED: no `weight` on either option,
// so it renders as the normal 2-cell pill row (not the difficulty
// cycle-button — see CLAUDE.md's "QO control types") and never enters the
// Smart Progressor's sort/balance. Both options are a genuine, always-correct
// choice by construction — see pickShape's level2 branch and WORDED_FRACTIONS
// below; when only "Worded fraction" is active, the minute value is drawn
// exclusively from TM values that actually have a natural spoken form, never
// silently falling back to plain-minutes wording (that silent fallback was
// the exact bug in this feature's first iteration — see docs/PATCH_NOTES.md,
// "fix 'Time Notation' QO not restricting at Level 2").
const TIME_NOTATION_L2: ToolMultiSelect = {
  key: "timeNotationL2", label: "Time Notation",
  options: [
    { value: "minutes", label: "Minutes", defaultActive: true },
    { value: "wordedFraction", label: "Worded fraction", defaultActive: false },
  ],
};

// TM values with a natural spoken fraction of an hour. Every TM pool Level 2
// can draw from has at least one member here — L2_MINUTES ⊇
// {5,6,10,12,15,20,30} and L2_ODD_PP_MINUTES ⊇ {12,20} — so
// "wordedFraction"-only never needs a fallback to the unfiltered pool.
const WORDED_FRACTIONS: Record<number, string> = {
  5: "a twelfth of an hour",
  6: "a tenth of an hour",
  10: "a sixth of an hour",
  12: "a fifth of an hour",
  15: "a quarter of an hour",
  20: "a third of an hour",
  30: "half an hour",
};

const makeSubtool = (name: string) => ({
  name,
  variables: [],
  dropdown: METHOD_DROPDOWN,
  multiSelect: [UNITS_L1, DIFFICULTY_TIER],
  difficultySettings: {
    level1: { multiSelect: [UNITS_L1, DIFFICULTY_TIER] },
    level2: { multiSelect: [UNITS_L23, DIFFICULTY_TIER, TIME_NOTATION_L2] },
    level3: { multiSelect: [UNITS_L23, L3_TYPES, DIFFICULTY_TIER] },
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
    { label: "Time wording", detail: "A compound time (Level 3) is always stated in hours & minutes (e.g. '1 hour 30 minutes'); a Level 2 time follows the Time Notation setting below. Never a decimal at any level." },
    { label: "Method", detail: "Ratio Table (default) scales to/from one hour using whole-number steps. Decimal instead converts the time to decimal hours and divides/multiplies by that — shown only where the conversion is exact; otherwise it falls back to the Ratio Table method." },
    { label: "Question Types (Level 3)", detail: "Compound times (e.g. 1 hr 30) and/or awkward minute values (e.g. 40 min)." },
    { label: "Difficulty (all levels)", detail: "One pool of three mutually exclusive rungs, easiest first: '1-10 times tables' (on by default, the scale factor is drawn from 1-10), '11-20 times tables' (drawn from 11-20 only — genuinely harder facts, not just a higher cap), and 'Decimals' (the computed distance/speed value is guaranteed to be a genuine decimal every time, e.g. 8 km/h for a fifth of an hour = 1.6 km, never a repeating one and never a coincidental whole number). Tick more than one rung to mix them in a worksheet — on the Worksheet tab, questions are ordered easiest-rung-first so a sheet ramps up rather than mixing difficulties at random." },
    { label: "Time Notation (Level 2)", detail: "Whether the given/answer time is worded as plain minutes (e.g. '12 minutes') or as a spoken fraction of an hour (e.g. 'a fifth of an hour') — a variety choice, not a difficulty setting, so it isn't ordered by the Worksheet tab's easy-to-hard sort. Tick both to mix the two wordings in one worksheet. 'Worded fraction' only ever picks a time that genuinely has a natural spoken form (a twelfth, tenth, sixth, fifth, quarter, third or half of an hour) — it never falls back to plain-minutes wording for a value that doesn't." },
  ]},
];

// ── 4. Shared domain helpers ───────────────────────────────────────────────────

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

// Divisors of 60 (excluding 60 itself, and excluding 1 — a 1-minute road
// journey can't land a realistic speed within this tool's distance/speed
// ranges for any family) — L2 picks any of these. The given TIME's wording
// (plain minutes vs. a spoken fraction) follows the Time Notation QO — see
// TIME_NOTATION_L2/formatDuration — never a decimal. The computed
// distance/speed answer CAN be a decimal when the "Decimals" Difficulty rung
// is active — see L2_ODD_PP_MINUTES below and buildValues' forceDecimal.
const L2_MINUTES = [2, 3, 5, 6, 10, 12, 15, 20, 30];

// Every L2 shape has qq = 1 exactly (TM always divides 60 evenly, by
// construction), so D = k·qq = k is ALWAYS decimal once buildValues'
// forceDecimal adds its 0.5 to k — any TM in L2_MINUTES works for a
// genDistance/genTime "decimals" question. Speed is the harder case: S = k·pp
// is only decimal when pp (= 60/TM) is itself ODD — true for just three of
// the divisors of 60 (excluding 1 and 60 themselves): TM=4 → pp=15, TM=12 →
// pp=5, TM=20 → pp=3. genSpeed's decimals rung draws its TM from this
// narrower pool instead (see pickShape's level2 branch) — the same
// "guarantee THIS subtool's own answer is decimal" rule L3 uses (see its
// requireAboveTen/target comment), just simpler here since qq never varies.
const L2_ODD_PP_MINUTES = [4, 12, 20];

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
// tablesLimit (from DIFFICULTY_TIER's picked rung) caps the facts the
// question needs: pp/qq via withinTables below, and the scale factor k in
// buildValues. `requireAboveTen` is only set true for the "tables20" rung —
// it excludes any L3 time shape already reachable at 10, so tables20 reads as
// genuinely harder, not a wider net that still includes every easy fact (see
// DIFFICULTY_TIER's comment). `decimalsMode` is the "decimals" rung; `target`
// says which of S/D THIS subtool's own answer is (see buildCommon) — since
// pp and qq can't both be even (they're coprime factors of 60), at least one
// is always odd, but not necessarily the one this subtool needs decimal.
const pickShape = (
  level: DifficultyLevel, family: UnitFamily, l3type: L3Type,
  tablesLimit: number, decimalsMode: boolean, requireAboveTen: boolean, target: "S" | "D",
  notation: TimeNotation = "minutes",
): Shape => {
  if (level === "level1") {
    // T0's cap is a "realistic journey length" bound (10 seconds for m/s, 12
    // hours otherwise), not itself a times-tables fact — like L2's TM, it
    // stays exempt from the tables10/tables20 disjoint-range requirement.
    // The actual fact under test is the scale factor k (S = k·1 = k), which
    // IS drawn from a genuinely disjoint 1-10 / 11-20 range via kMin/kMax.
    const cap = family === "mps" ? 10 : 12;
    if (decimalsMode) {
      // pp is always 1 at L1 (trivially odd), so S = k·1 is already
      // guaranteed decimal by buildValues' forceDecimal regardless of
      // target — forcing T0 (= qq) odd too just means D = k·T0 is
      // guaranteed decimal as well (0.5·T0 only stays whole when T0 is
      // even), so BOTH land on a genuine decimal here, no target-splitting
      // needed the way L3 requires below.
      const odds: number[] = [];
      for (let t = 3; t <= cap; t += 2) odds.push(t);
      return { kind: "l1", TM: pick(odds) * 60 };
    }
    const T0 = randInt(2, Math.min(cap, tablesLimit));
    return { kind: "l1", TM: T0 * 60 };
  }
  if (level === "level2") {
    // Not gated by tablesLimit — see withinTables' comment above.
    // decimalsMode + target "S" (genSpeed) needs the narrower odd-pp pool —
    // see L2_ODD_PP_MINUTES' comment; target "D" (genDistance/genTime) can
    // use any L2_MINUTES value, since qq = 1 always guarantees D is decimal.
    const pool = decimalsMode && target === "S" ? L2_ODD_PP_MINUTES : L2_MINUTES;
    // When "Worded fraction" is the only active notation, restrict to TM
    // values that actually have a natural spoken form (see WORDED_FRACTIONS)
    // — deliberately no fallback to the unfiltered pool if this ever came up
    // empty; that silent fallback was the exact bug the first version of
    // this feature had.
    const candidates = notation === "wordedFraction" ? pool.filter(tm => tm in WORDED_FRACTIONS) : pool;
    return { kind: "l2", TM: pick(candidates) };
  }
  // Every H + {15,30,45}-minute compound combo reduces to an ODD qq but an
  // EVEN pp by construction (each Mfrac shares an even 60/gcd with 60) — so
  // it can guarantee a decimal D (target "D", e.g. genDistance/genTime) but
  // can NEVER guarantee a decimal S (target "S", genSpeed): S = k·pp with an
  // even pp always lands whole regardless of k's fractional part. When the
  // decimals rung needs S and this draw is compoundTime, fall through to the
  // awkwardMinutes pool instead, which has plenty of odd-pp candidates.
  const useCompound = l3type === "compoundTime" && !(decimalsMode && target === "S");
  if (useCompound) {
    const combos = compoundCombos(tablesLimit).filter(({ H, Mfrac }) =>
      !requireAboveTen || !withinTables(H * 60 + Mfrac, 10));
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
    if (requireAboveTen && withinTables(TM, 10)) continue; // genuinely-harder-only for "tables20"
    if (decimalsMode) {
      const g = gcd(60, TM);
      const oddField = target === "S" ? 60 / g : TM / g; // pp for "S", qq for "D"
      if (oddField % 2 === 0) continue; // guarantees THIS subtool's own answer is decimal
    }
    return { kind: "l3awkward", TM };
  }
  // Safe fallbacks: TM=24 → pp=5 (odd, for "S"); TM=42 → qq=7 (odd, for "D").
  return { kind: "l3awkward", TM: decimalsMode ? (target === "S" ? 24 : 42) : 40 };
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
// (whole, or a genuine decimal when forceDecimal is on) and inside a
// realistic range for the unit family. k is itself drawn from [kMin, kMax] —
// it's the other side of the pp/qq fact a student inverts (e.g. qq=8, k=13
// asks for "8 × 13", a fact well outside 10×10 even though 8 itself isn't).
// kMin defaults to 1 (a plain cap, as at the "tables10" rung); the "tables20"
// rung passes an explicit floor of 11 too, so it's a genuinely disjoint
// range, not "up to 20". forceDecimal (the "decimals" rung) always adds 0.5
// to k — a GUARANTEE, not the ~35%-chance "useHalf" roll this used to be —
// so S is a genuine decimal every draw (pickShape's decimalsMode branches
// additionally pick a shape whose qq is odd, so D is guaranteed too).
const buildValues = (TM: number, f: FamilyInfo, forceDecimal: boolean, kMax: number, kMin: number = 1): { D: number; S: number; pp: number; qq: number } => {
  const g = gcd(60, TM);
  const pp = 60 / g, qq = TM / g;
  for (let attempt = 0; attempt < 80; attempt++) {
    const k = randInt(kMin, kMax) + (forceDecimal ? 0.5 : 0);
    const D = k * qq, S = k * pp;
    if (D < f.distMin || D > f.distMax) continue;
    if (S < f.speedMin || S > f.speedMax) continue;
    if (D === TM) continue; // "37 miles in 37 minutes" reads as a coincidence, not a real question
    return { D, S, pp, qq };
  }
  const kBase = Math.min(Math.max(Math.ceil(f.distMin / qq), Math.ceil(f.speedMin / pp), kMin), kMax);
  const bump = kBase * qq === TM && kBase + 1 <= kMax && (kBase + 1) * qq <= f.distMax && (kBase + 1) * pp <= f.speedMax;
  const k = (bump ? kBase + 1 : kBase) + (forceDecimal ? 0.5 : 0);
  return { D: k * qq, S: k * pp, pp, qq };
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

// A given/answer time is plain minutes, or hours & minutes for a compound
// time — or, at Level 2 only, a spoken fraction (e.g. "a quarter of an
// hour") when the "Worded fraction" Time Notation is picked — never a
// decimal, at any level. `notation` only ever affects an "l2" shape; Level 1
// and Level 3 always use their existing wording regardless of the argument.
const formatDuration = (shape: Shape, family: UnitFamily, notation: TimeNotation = "minutes"): string => {
  if (shape.kind === "l1") {
    const T0 = shape.TM / 60;
    const unit = family === "mps" ? (T0 === 1 ? "second" : "seconds") : (T0 === 1 ? "hour" : "hours");
    return `${T0} ${unit}`;
  }
  if (shape.kind === "l3compound") return `${shape.H} hour${shape.H === 1 ? "" : "s"} ${shape.Mfrac} minutes`;
  if (shape.kind === "l2" && notation === "wordedFraction" && shape.TM in WORDED_FRACTIONS) return WORDED_FRACTIONS[shape.TM];
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

const buildCommon = (
  level: DifficultyLevel, family: UnitFamily, l3type: L3Type,
  tablesLimit: number, decimalsMode: boolean, requireAboveTen: boolean, target: "S" | "D",
  kMin: number = 1, notation: TimeNotation = "minutes",
) => {
  const shape = pickShape(level, family, l3type, tablesLimit, decimalsMode, requireAboveTen, target, notation);
  const f = FAMILY[family];
  // One unified value-builder for all three levels: buildValues' forceDecimal
  // (k = n + 0.5) guarantees a genuine decimal whenever decimalsMode is on,
  // for whichever of S/D pickShape's target-aware shape selection lined up
  // (see pickShape's L1/L2/L3 branches and their comments).
  const { D, S, pp, qq } = buildValues(shape.TM, f, decimalsMode, tablesLimit, kMin);
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

const genSpeed = (level: DifficultyLevel, family: UnitFamily, l3type: L3Type, decimalsMode: boolean, requireAboveTen: boolean, method: WorkingMethod, tablesLimit: number, kMin: number = 1, notation: TimeNotation = "minutes"): WordedQuestion => {
  // The Speed subtool's own answer is S — the "decimals" rung must guarantee
  // THAT one, not D (see buildCommon/pickShape's target).
  const c = buildCommon(level, family, l3type, tablesLimit, decimalsMode, requireAboveTen, "S", kMin, notation);
  const durationText = formatDuration(c.shape, family, notation);
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

const genDistance = (level: DifficultyLevel, family: UnitFamily, l3type: L3Type, decimalsMode: boolean, requireAboveTen: boolean, method: WorkingMethod, tablesLimit: number, kMin: number = 1, notation: TimeNotation = "minutes"): WordedQuestion => {
  // The Distance subtool's own answer is D — target it directly.
  const c = buildCommon(level, family, l3type, tablesLimit, decimalsMode, requireAboveTen, "D", kMin, notation);
  const durationText = formatDuration(c.shape, family, notation);
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

const genTime = (level: DifficultyLevel, family: UnitFamily, l3type: L3Type, decimalsMode: boolean, requireAboveTen: boolean, method: WorkingMethod, tablesLimit: number, kMin: number = 1, notation: TimeNotation = "minutes"): WordedQuestion => {
  // The Time subtool's own answer is the duration (derived purely from the
  // time shape, never from S/D — see formatDuration), so decimalsMode never
  // affects ITS answer either way; "D" is an arbitrary but harmless default
  // for which of the two given values (D or S) reads as the decimal one.
  const c = buildCommon(level, family, l3type, tablesLimit, decimalsMode, requireAboveTen, "D", kMin, notation);
  const answerText = formatDuration(c.shape, family, notation);
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
  _variables: Record<string, boolean>,
  dropdownValue: string,
  multiSelectValues: Record<string, boolean> = {},
): WordedQuestion => {
  const t = tool as ToolType;
  const method = (dropdownValue || "ratioTable") as WorkingMethod;
  const unitOptions = level === "level1" ? UNITS_L1.options : UNITS_L23.options;
  const family = pickActive(multiSelectValues, unitOptions) as UnitFamily;
  const l3type = level === "level3" ? (pickActive(multiSelectValues, L3_TYPES.options) as L3Type) : "awkwardMinutes";

  // Every level draws its k-range/decimalsMode from the same DIFFICULTY_TIER
  // ladder (Smart Progressor) — tables10/tables20/decimals, mutually
  // exclusive rungs, never an independent boolean/pool per level (see
  // DIFFICULTY_TIER's comment). requireAboveTen is only meaningful for L3's
  // pickShape (see its comment) — L1/L2 ignore it.
  const tier = pickActive(multiSelectValues, DIFFICULTY_TIER.options);
  const cfg = TABLES_TIER[tier];
  const tablesLimit = cfg.kMax;
  const kMin = cfg.kMin;
  const decimalsMode = cfg.decimalsMode;
  const requireAboveTen = tier === "tables20";
  const difficultyScore = weightOf(DIFFICULTY_TIER.options, tier);
  // Time Notation is Level 2 only — unweighted, pure wording variety, not a
  // Smart Progressor axis (see TIME_NOTATION_L2's comment).
  const notation: TimeNotation = level === "level2" ? (pickActive(multiSelectValues, TIME_NOTATION_L2.options) as TimeNotation) : "minutes";

  const q = t === "speed" ? genSpeed(level, family, l3type, decimalsMode, requireAboveTen, method, tablesLimit, kMin, notation)
    : t === "distance" ? genDistance(level, family, l3type, decimalsMode, requireAboveTen, method, tablesLimit, kMin, notation)
    : genTime(level, family, l3type, decimalsMode, requireAboveTen, method, tablesLimit, kMin, notation);
  return { ...q, _difficultyScore: difficultyScore } as unknown as WordedQuestion;
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
