import { Fragment } from "react";
import {
  ToolShell, handleDiagramPrint,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion,
  type ToolMultiSelect, type ToolVariable,
  randInt, pickActive, mStep, tStep, QuestionDisplay, AnswerDisplay, handlePrint, type WorkingStep, type QOSnapshot, type ToolDropdown,
} from "../../shared";
import { DEPTH_ITEMS } from "./RoundingDepth";
import { SF_ID_DEPTH_ITEMS } from "./RoundingSfIdDepth";

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. Types ──────────────────────────────────────────────────────────────────

type ToolType = "nearest" | "dp" | "sf" | "identifySf";
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
  endsFirst: boolean;   // Level 2 whiteboard: a "Show Ends" step fills in the end boxes before the answer
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

const SF_KIND_MS: ToolMultiSelect = {
  key: "sfKind", label: "Numbers",
  options: [
    { value: "wholes", label: "Whole numbers", sub: "(no decimal part)", defaultActive: true },
    { value: "decimals", label: "Decimals", sub: "(including below 1)", defaultActive: true },
  ],
};

// Identify Significant Figures — which digits count (its own tab)
const SF_TASK_MS: ToolMultiSelect = {
  key: "sfTask", label: "Task",
  options: [
    { value: "mark", label: "Mark them", sub: "(circle the significant figures)", defaultActive: true },
    { value: "name", label: "Name one", sub: "(the 1st, 2nd or 3rd)", defaultActive: true },
    { value: "count", label: "Count them", defaultActive: true },
  ],
};
const SF_ZEROS_L2_MS: ToolMultiSelect = {
  key: "sfZeros", label: "Zeros",
  options: [
    { value: "trapped", label: "Trapped", sub: "(between digits)", defaultActive: true },
    { value: "leading", label: "Leading", sub: "(before the first digit)", defaultActive: true },
  ],
};
const SF_ZEROS_L3_MS: ToolMultiSelect = {
  key: "sfZeros", label: "Zeros",
  options: [
    { value: "trapped", label: "Trapped", sub: "(between digits)", defaultActive: true },
    { value: "leading", label: "Leading", sub: "(before the first digit)", defaultActive: true },
    { value: "trailing", label: "Trailing", sub: "(after the last digit)", defaultActive: true },
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

const ENDS_L2_MS: ToolMultiSelect = {
  key: "endsReveal", label: "Reveal ends & midpoint", exclusive: true,
  options: [
    { value: "withAnswer", label: "With the answer", defaultActive: true },
    { value: "endsFirst", label: "Before the plot", sub: "(Show Ends, then plot)", defaultActive: false },
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

const subTool = (name: string, pool: ToolMultiSelect, extra: ToolMultiSelect[] = []) => ({
  name,
  variables: [] as ToolVariable[],
  dropdown: METHOD_DD,
  multiSelect: pool,
  difficultySettings: {
    level1: { variables: [], multiSelect: [pool, ...extra, LABEL_L1_MS, PLOT_MS, PRECISION_MS, POSITION_MS] },
    level2: { variables: [], multiSelect: [pool, ...extra, BLANK_L2_MS, ENDS_L2_MS, PLOT_MS, PRECISION_MS, POSITION_MS] },
    level3: { variables: [], multiSelect: [pool, ...extra, POSITION_MS] },
  },
});

const identifySfTool = {
  name: "Identify Sig. Figs",
  variables: [] as ToolVariable[],
  dropdown: null,
  multiSelect: SF_TASK_MS,
  difficultySettings: {
    level1: { variables: [], multiSelect: [SF_TASK_MS, SF_KIND_MS] },
    level2: { variables: [], multiSelect: [SF_TASK_MS, SF_KIND_MS, SF_ZEROS_L2_MS] },
    level3: { variables: [], multiSelect: [SF_TASK_MS, SF_KIND_MS, SF_ZEROS_L3_MS] },
  },
};

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Rounding",
  tools: {
    nearest: subTool("Nearest 10, 100, 1000", NEAREST_MS),
    dp: subTool("Decimal Places", DP_MS),
    identifySf: identifySfTool,
    sf: subTool("Significant Figures", SF_MS, [SF_KIND_MS]),
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
      { label: "Reveal ends & midpoint", detail: "'Before the plot' adds whiteboard steps: Show Ends (fills in the three boxes), then Show Plot (if students plot the number), then Show Answer. 'With the answer' fills the boxes only when the answer is shown. Only applies when students fill in the ends and midpoint." },
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
      { label: "Significant figures", detail: "1, 2 or 3 s.f., including numbers below 1 (leading zeros are not significant) and large numbers. 'Numbers' restricts them to whole numbers (no decimal part), decimals (including numbers below 1), or a mix of both." },
      { label: "Number on the line (Levels 1–2)", detail: "'Students plot it' (the default) leaves the line without a marker — on the whiteboard, 'Show Plot' reveals where the number sits before 'Show Answer' reveals the rounding. On worksheets the marker appears with the answers. 'Plotted for them' marks the number on the line from the start." },
      { label: "Digits past the rounding position (Levels 1–2)", detail: "'One extra' puts the number exactly on a mark of the line; 'Two extra' places it between marks so students estimate its position. This applies to every sub-tool: for nearest 100, one extra gives 3480 (on a mark) and two extra gives 3482 (between marks). Level 3 uses natural digits for nearest 10/100/1000 (e.g. 3482) and mixes one and two extra digits elsewhere." },
      { label: "Working method", detail: "Worked Example only (it changes the explanation, not the question). 'Digit rule' shows the rounding digit and the decider with a dotted line between them, then the 5-or-more rule. 'Number line' shows the two possible answers either side of the number, the halfway value, and which it is closer to. Switching keeps the same question." },
      { label: "Exactly halfway", detail: "Click to cycle: Off → Mixed (about 5% of questions) → Always. Exactly-halfway numbers round up." },
    ],
  },
  {
    title: "Identify Significant Figures", icon: "🔍",
    content: [
      { label: "Overview", detail: "Which digits of a number are significant figures? The first significant figure is the first non-zero digit, and the skill is spotting which zeros count." },
      { label: "Level 1", detail: "Numbers with no zeros, so every digit counts. Find the 1st, 2nd and 3rd significant figures and count them." },
      { label: "Level 2", detail: "Trapped zeros (between digits, as in 3052) always count. Leading zeros (before the first non-zero digit, as in 0.0472) never count." },
      { label: "Level 3", detail: "Trailing zeros: after a decimal point they count (120.00 has 5 s.f., 0.0450 has 3 s.f.). In a whole number they are placeholders and do not count, so 1200 is taken as 2 s.f. Questions can mix all three kinds of zero." },
      { label: "Task", detail: "'Mark them' asks for the significant figures to be circled; 'Name one' asks for the 1st, 2nd or 3rd; 'Count them' asks how many there are. One is drawn per question from those switched on." },
      { label: "Numbers", detail: "Whole numbers, decimals, or a mix. Leading zeros only occur in decimals." },
      { label: "Zeros (Levels 2–3)", detail: "Choose which kind of zero the questions are about: trapped, leading and (Level 3) trailing." },
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
  {
    title: "Blank number lines", icon: "🖨️",
    content: [
      { label: "Printable sheet", detail: "Menu (top right) → Print blank number lines. One A4 page of 18 empty number lines in two columns, with no questions, for students to fill in themselves. Choose boxes under the ends and middle, or a box under every mark." },
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

/** Significant figures only: keep drawing until the number is a whole number or a decimal, as the Numbers option asks. */
function buildRounding(t: ToolType, level: DifficultyLevel, ms: Record<string, boolean> | undefined) {
  if (t !== "sf") return buildRoundingOnce(t, level, ms, undefined);
  const kind = pickOpt(ms, SF_KIND_MS.options);
  for (let i = 0; i < 500; i++) {
    const r = buildRoundingOnce(t, level, ms, kind);
    if ((kind === "wholes") === (r.f >= 0)) return r;
  }
  return buildRoundingOnce(t, level, ms, kind);
}

function buildRoundingOnce(t: ToolType, level: DifficultyLevel, ms: Record<string, boolean> | undefined, sfKind: string | undefined) {
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
    const p = sfKind === "wholes" ? randInt(0, 6) : randInt(-3, 4);   // exponent of the leading digit
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
    // Each step carries the line stage to draw beside it: the ends → the number and halfway → which half → the answer.
    const lineSteps = [
      introStep(t, r.n, "line"),
      { type: "roundLine", latex: "", plain: `${r.numStr} lies between ${r.lowerStr} and ${r.upperStr}`, label: `Mark the number between ${r.lowerStr} and ${r.upperStr}; halfway is ${r.midStr}:` },
      mStep(r.half ? "Exactly halfway, so it rounds up:" : r.up ? "Past the halfway value, so it is closer to the upper number:" : "Before the halfway value, so it is closer to the lower number:", [tex(r.numStr), `${compare} ${tex(r.midStr)}`]),
      mStep("Answer:", tex(r.ansStr)),
    ];
    return lineSteps.map((st, i) => ({ ...st, extra: { kind: "roundLineStage", data, stage: i } }));
  }
  const decider = Math.floor(r.N / pow10(r.kk - 1)) % 10;   // the digit just after the rounding digit
  return [
    introStep(t, r.n, "digit"),
    { type: "roundDigits", latex: "", plain: `Rounding digit and decider in ${r.numStr}`, label: "Find the rounding digit (blue), draw a dotted line after it, then look at the digit that follows — the decider (orange):", extra: { numStr: r.numStr, e: r.e, sf: t === "sf" } },
    mStep(`The decider is ${decider}, which is ${decider >= 5 ? "5 or more, so round up" : "less than 5, so round down"}:`, `${decider} ${decider >= 5 ? "\\ge" : "\\lt"} 5`),
    mStep(r.up ? "Add 1 to the rounding digit and drop (or zero) everything after it:" : "Keep the rounding digit and drop (or zero) everything after it:", tex(r.ansStr)),
  ];
}

// ── Identify Significant Figures ──────────────────────────────────────────────

type SfKind = "sig" | "trapped" | "trailing" | "lead" | "trailingNo";
type SfCell = { sep: true } | { sep?: false; ch: string; kind: SfKind };

/** Every digit of a plain number string ("0.00305", "120.00", "1200") classified. Zeros: leading never count, trapped
 *  always count, trailing count only when the number has a decimal point (a whole number's trailing zeros are placeholders). */
function classifySf(raw: string): { cells: SfCell[]; sig: string[] } {
  const hasPoint = raw.includes(".");
  const digits = raw.replace(".", "");
  const firstNZ = digits.search(/[1-9]/);
  const lastNZ = digits.length - 1 - [...digits].reverse().findIndex(c => c !== "0");
  let di = 0;
  const cells: SfCell[] = [...raw].map(ch => {
    if (ch === ".") return { sep: true };
    const i = di++;
    const kind: SfKind = i < firstNZ ? "lead" : ch !== "0" ? "sig" : i < lastNZ ? "trapped" : hasPoint ? "trailing" : "trailingNo";
    return { ch, kind };
  });
  const sig = cells.filter((c): c is Extract<SfCell, { ch: string }> => !c.sep && c.kind !== "lead" && c.kind !== "trailingNo").map(c => c.ch);
  return { cells, sig };
}

const nonZero = () => randInt(1, 9);
const nonZeros = (n: number) => Array.from({ length: n }, nonZero).join("");

/** A number whose zeros are of the given kinds (none = no zeros at all). Trapped sit between non-zero digits, leading
 *  follow "0." (decimals only), trailing end the digits; a decimal's trailing zeros always fall after the point. */
function buildSfNumber(kinds: Set<string>, decimal: boolean): string {
  const lead = decimal && kinds.has("leading");
  let core: string;
  if (kinds.has("trapped")) {
    const d = Array.from({ length: randInt(2, 4) }, nonZero);
    const gap = randInt(1, d.length - 1);
    core = d.slice(0, gap).join("") + "0".repeat(randInt(1, 2)) + d.slice(gap).join("");
  } else core = nonZeros(randInt(kinds.size ? 2 : 3, kinds.size ? 4 : 5));
  const trail = kinds.has("trailing") ? "0".repeat(randInt(1, 3)) : "";
  if (!decimal) return core + trail;
  if (lead) return "0." + "0".repeat(randInt(1, 3)) + core + trail;
  const full = core + trail;
  const p = randInt(1, trail ? core.length : full.length - 1);
  return `${full.slice(0, p)}.${full.slice(p)}`;
}

const ORDINAL = ["1st", "2nd", "3rd"];

function generateIdentify(level: DifficultyLevel, ms: Record<string, boolean> | undefined): AnyQuestion {
  const decimal = pickOpt(ms, SF_KIND_MS.options) === "decimals";
  let kinds = new Set<string>();
  if (level === "level2") {
    const z = pickOpt(ms, SF_ZEROS_L2_MS.options);
    kinds = new Set([!decimal && z === "leading" ? "trapped" : z]);
  } else if (level === "level3") {
    const active = SF_ZEROS_L3_MS.options.map(o => o.value).filter(v => ms?.[v] !== false);
    const pool = active.length ? active : SF_ZEROS_L3_MS.options.map(o => o.value);
    const effective = (k: Set<string>) => (decimal ? k : new Set([...k].filter(v => v !== "leading")));
    for (let i = 0; i < 40; i++) {
      const k = new Set(pool.filter(() => Math.random() < 0.5));
      const e = effective(k);
      if (e.size && (e.has("trailing") || e.size >= 2)) { kinds = e; break; }
    }
    if (!kinds.size) kinds = effective(new Set(pool));
    if (!kinds.size) kinds = new Set(["trapped"]);
  }
  const raw = buildSfNumber(kinds, decimal);
  const { cells, sig } = classifySf(raw);
  const intPart = raw.split(".")[0];
  const shown = raw.includes(".") ? raw : intPart.length >= 5 ? group(intPart) : raw;
  const task = pickOpt(ms, SF_TASK_MS.options) as "mark" | "name" | "count";
  const k = randInt(1, Math.min(3, sig.length));
  const num = `$${tex(shown)}$`;

  let line: string, answer: string, answerLatex: string;
  if (task === "mark") {
    line = `Circle the significant figures in ${num}.`;
    answer = sig.join(", "); answerLatex = sig.join(",\\ ");
  } else if (task === "name") {
    line = `Write the ${ORDINAL[k - 1]} significant figure of ${num}.`;
    answer = sig[k - 1]; answerLatex = sig[k - 1];
  } else {
    line = `How many significant figures does ${num} have?`;
    answer = String(sig.length); answerLatex = answer;
  }

  const notes: string[] = [];
  const has = (kind: SfKind) => cells.some(c => !c.sep && c.kind === kind);
  if (has("lead")) notes.push("Leading zeros only hold the place of the first digit, so they do not count.");
  if (has("trapped")) notes.push("Zeros trapped between non-zero digits do count.");
  if (has("trailing")) notes.push("Zeros after the decimal point at the end show how accurate the number is, so they do count.");
  if (has("trailingNo")) notes.push("Zeros at the end of a whole number only hold place value, so they do not count.");

  const finish = task === "mark" ? mStep("The significant figures are:", answerLatex)
    : task === "name" ? mStep(`The ${ORDINAL[k - 1]} significant figure is:`, answerLatex)
    : mStep(`The significant figures are ${sig.join(", ")}, so there are:`, answerLatex);
  const working: WorkingStep[] = [
    tStep("The first significant figure is the first non-zero digit. Every digit after it counts, except zeros at the end of a whole number."),
    { type: "sfDigits", latex: "", plain: `Which digits of ${shown} count`, label: "Check each digit — blue digits are significant figures, grey ones are not:", extra: { raw, task, k } },
    ...notes.map(n => tStep(n)),
    finish,
  ];

  return {
    kind: "worded",
    lines: [line],
    answer, answerLatex,
    working,
    key: `sfid-${level}-${task}-${raw}-${task === "name" ? k : 0}-${Math.floor(Math.random() * 1_000_000)}`,
    difficulty: level,
    _sf: { raw, task, k },
  } as unknown as AnyQuestion;
}

function generateQuestion(
  tool: string,
  level: DifficultyLevel,
  _variables: Record<string, boolean>,
  dropdownValue: string,
  multiSelectValues?: Record<string, boolean>,
): AnyQuestion {
  const t = tool as ToolType;
  if (t === "identifySf") return generateIdentify(level, multiSelectValues);
  const r = buildRounding(t, level, multiSelectValues);
  const prompt = `Round ${r.numStr} to ${targetPhrase(t, r.n)}.`;

  const labelMode = pickOpt(multiSelectValues, LABEL_L1_MS.options) as LabelMode;
  const blankMode = pickOpt(multiSelectValues, BLANK_L2_MS.options) as BlankMode;
  const endsFirst = level === "level2" && blankMode === "blank" && pickOpt(multiSelectValues, ENDS_L2_MS.options) === "endsFirst";
  const plotted = level === "level3" || pickOpt(multiSelectValues, PLOT_MS.options) === "auto";

  const data: RoundingData = {
    level, prompt,
    numStr: r.numStr, lowerStr: r.lowerStr, midStr: r.midStr, upperStr: r.upperStr,
    ticks: r.ticks, ansStr: r.ansStr, up: r.up, pos: r.pos,
    labelMode, blankMode, endsFirst, plotted,
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
    // whiteboard: the ends (Level 2, optional) then the plot, then the answer
    ...(endsFirst ? { _stagedReveal: plotted ? ["Show Ends"] : ["Show Ends", "Show Plot"] } : plotted ? {} : { _stagedReveal: "Show Plot" }),
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

/** `stage` (worked example, number-line method only) develops the picture: 0 the line and its ends · 1 the number
 *  plotted and halfway marked · 2 the half it sits in shaded · 3 the answer ringed. Undefined = the ordinary diagram. */
function RoundingDiagram({ d, showAnswer: showAnswerProp, withPrompt, idx, preview, answerIdx, answerBand = true, stage, previewStage = preview ? 1 : 0 }: { d: RoundingData; showAnswer: boolean; withPrompt: boolean; idx?: number; preview?: boolean; previewStage?: number; answerIdx?: number; answerBand?: boolean; stage?: number }) {
  const showAnswer = stage !== undefined ? stage >= 3 : showAnswerProp;
  const HALF = "#b45309";
  const y0 = withPrompt ? 0 : 60;
  const bottom = answerBand ? 290 : 245;   // the answer band sits below the line's labels
  const h = bottom - y0;
  const mx = X0 + d.pos * LW;
  const showMarker = stage !== undefined ? stage >= 1 : d.plotted || showAnswer || previewStage >= (d.endsFirst ? 2 : 1);
  const ansX = X0 + (d.up ? LW : 0);
  const majors = [0, 5, 10];
  const majorText = [d.lowerStr, d.midStr, d.upperStr];
  const promptFs = Math.min(32, 620 / (d.prompt.length * 0.56));

  const majorLabel = (mi: number) => {
    const i = majors[mi];
    const x = X0 + i * STEP;
    if (d.level === "level2") {
      // blank boxes; filled when the answer is shown, or when the ends are given
      const given = (d.blankMode === "endsGiven" && i !== 5) || (d.endsFirst && previewStage >= 1);
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
    return <text key={`m${i}`} x={x} y={LY + 50} textAnchor="middle" dominantBaseline="middle" fontSize={28} fontWeight={700} fill={stage !== undefined && stage >= 1 && i === 5 ? HALF : INK}>{majorText[mi]}</text>;
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

      {/* which half the number sits in (stage 2) */}
      {stage !== undefined && stage >= 2 && <rect x={d.up ? X0 + 5 * STEP : X0} y={LY - 30} width={5 * STEP} height={60} rx={6} fill="#16a34a" opacity={0.14} />}
      {/* halfway marker (stage 1+) */}
      {stage !== undefined && stage >= 1 && <g>
        <line x1={X0 + 5 * STEP} y1={LY - 46} x2={X0 + 5 * STEP} y2={LY + 22} stroke={HALF} strokeWidth={3} strokeDasharray="6 5" />
        <text x={X0 + 5 * STEP} y={LY - 54} textAnchor="middle" fontSize={20} fontWeight={700} fill={HALF}>halfway</text>
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
  q: AnyQuestion, showAnswer: boolean, _cs: string, compact?: boolean, idx?: number, qo?: { preview?: boolean; previewStage?: number; fullscreen?: boolean; dropdownValue?: string }, fontClass?: string,
): JSX.Element | null => {
  // Worked Example (compact === false, not the fullscreen whiteboard): the answer is found by
  // stepping through the working, so the question box never shows it — but the plot is set up.
  const workedExample = compact === false && !qo?.fullscreen;
  const revealAnswer = showAnswer && !workedExample;
  // Identify Significant Figures — the prompt, and the number as digit boxes (coloured once the answer shows).
  const sf = (q as any)._sf as { raw: string; task: string; k: number } | undefined;
  if (sf && compact !== true) {
    const fc = fontClass ?? "text-xl";
    return (
      <div className="w-full flex flex-col items-center gap-2">
        <QuestionDisplay q={q} cls={fc} />
        <SfDigits raw={sf.raw} reveal={revealAnswer} pick={sf.task === "name" ? sf.k : undefined} />
        {revealAnswer && <div className={`${fc} font-bold`} style={{ color: GREEN }}><AnswerDisplay q={q} /></div>}
      </div>
    );
  }
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
      {/* Number-line method, answer showing: the line develops beside the steps (stepVisual), not up here. */}
      {!(workedExample && showAnswer && qo?.dropdownValue === "line") && (
        <div style={{ width: "100%", maxWidth: compact === false ? 900 : 680, margin: "0 auto" }}>
          <RoundingDiagram d={d} showAnswer={revealAnswer} withPrompt={false} previewStage={workedExample && showAnswer ? 9 : qo?.previewStage ?? 0} answerBand={!workedExample} />
        </div>
      )}
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

/** The number as digit boxes for Identify Significant Figures. `reveal` colours them: significant digits blue, ones that
 *  do not count grey, each zero captioned with why. `pick` (the "name one" task) rings the nth significant figure. */
function SfDigits({ raw, reveal, pick }: { raw: string; reveal: boolean; pick?: number }) {
  const { cells } = classifySf(raw);
  let sigSeen = 0;
  const palette = {
    sig: { bg: "#dbeafe", border: "#2563eb", color: "#1d4ed8" },
    off: { bg: "#f1f5f9", border: "#cbd5e1", color: "#94a3b8" },
    plain: { bg: "#ffffff", border: "#94a3b8", color: "#0f172a" },
    pick: { bg: "#fef3c7", border: "#d97706", color: "#b45309" },
  };
  const hasTrapped = reveal && cells.some(c => !c.sep && c.kind === "trapped");
  return (
    <div style={{ padding: "10px 0 8px" }}>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", gap: 4 }}>
        {cells.map((c, i) => {
          if (c.sep) return <span key={i} style={{ fontSize: "2rem", fontWeight: 700, color: "#334155", alignSelf: "flex-end", lineHeight: 1.5, paddingBottom: 4 }}>.</span>;
          const counts = c.kind !== "lead" && c.kind !== "trailingNo";
          if (counts) sigSeen++;
          const tone = !reveal ? palette.plain : counts ? (pick === sigSeen ? palette.pick : palette.sig) : palette.off;
          return (
            <div key={i} style={{ position: "relative" }}>
              <div style={{ width: "2.6rem", height: "3.2rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: 700, borderRadius: 8, border: `2px solid ${tone.border}`, background: tone.bg, color: tone.color }}>{c.ch}</div>
              {/* every trapped zero is underlined */}
              {reveal && c.kind === "trapped" && <div style={{ position: "absolute", left: 4, right: 4, top: "calc(100% + 5px)", height: 5, borderRadius: 3, background: "#16a34a" }} />}
            </div>
          );
        })}
      </div>
      {hasTrapped && <div style={{ textAlign: "center", fontSize: "0.85rem", fontWeight: 600, color: "#166534", marginTop: 12 }}>Underlined zeros are trapped between digits, so they count.</div>}
    </div>
  );
}

const stepRenderer = (s: WorkingStep): JSX.Element | null => {
  if (s.type === "sfDigits") {
    const x = s.extra as { raw: string; task: string; k: number };
    return (
      <div style={{ width: "100%" }}>
        <div style={stepLabelStyle}>{s.label}</div>
        <SfDigits raw={x.raw} reveal pick={x.task === "name" ? x.k : undefined} />
      </div>
    );
  }
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
    // The picture itself develops beside the steps (stepVisual); this card carries just the instruction.
    return <div style={{ width: "100%" }}><div style={stepLabelStyle}>{s.label}</div></div>;
  }
  return null;
};

/** `stepVisualRenderer`: the number line at that step's stage; null for the digit method's steps. */
const stepVisual = (s: WorkingStep): JSX.Element | null => {
  const x = s.extra as { kind?: string; data?: RoundingData; stage?: number } | undefined;
  if (x?.kind !== "roundLineStage" || !x.data) return null;
  const d = { ...x.data, level: "level1" as DifficultyLevel, labelMode: "ends" as LabelMode };
  return <div className="w-full"><RoundingDiagram d={d} showAnswer={false} withPrompt={false} answerBand={false} stage={x.stage ?? 0} /></div>;
};

const ALL_DEPTH_ITEMS = [...DEPTH_ITEMS, ...SF_ID_DEPTH_ITEMS];

// ── 8. Blank number lines — an A4 printable with no questions ─────────────────

/** One blank line as SVG markup: ten spaces, eleven marks, and empty boxes under the marks for the student to fill in
 *  (the ends and the middle, or every mark). Same geometry as the line in the questions, so the sheet matches the lessons. */
function blankLineSvg(everyMark: boolean): string {
  const LYB = 70, box = "fill=\"#ffffff\" stroke=\"#64748b\" stroke-width=\"2\" stroke-dasharray=\"6 5\"";
  const ticks = Array.from({ length: 11 }, (_, i) => {
    const major = i % 5 === 0, x = X0 + i * STEP;
    return `<line x1="${x}" y1="${LYB - (major ? 18 : 10)}" x2="${x}" y2="${LYB + (major ? 18 : 10)}" stroke="${INK}" stroke-width="${major ? 4 : 2.5}"/>`;
  }).join("");
  const boxes = (everyMark ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : [0, 5, 10]).map((i) => {
    const w = everyMark ? 44 : 124, x = X0 + i * STEP - w / 2;
    return `<rect x="${x}" y="${LYB + 24}" width="${w}" height="80" rx="8" ${box}/>`;
  }).join("");
  return `<svg viewBox="-6 0 672 182" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">`
    + `<line x1="${X0 - 20}" y1="${LYB}" x2="${X0 + LW + 20}" y2="${LYB}" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>${ticks}${boxes}</svg>`;
}

/** Opens an A4 page of blank number lines, two columns and no questions, ready to print for students. */
function printBlankNumberLines(everyMark: boolean) {
  const ROWS = 9;
  const cells = Array.from({ length: ROWS * 2 }, () => `<div class="c">${blankLineSvg(everyMark)}</div>`).join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Blank number lines</title><style>
  *{margin:0;padding:0;box-sizing:border-box}
  @page{size:A4 portrait;margin:12mm}
  body{font-family:"Segoe UI",Arial,sans-serif}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  .page{width:186mm;height:273mm;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(${ROWS},1fr);gap:2mm 6mm}
  .c{display:flex;align-items:center;justify-content:center;min-height:0;min-width:0}
  .c svg{width:100%;height:100%}
</style></head><body><div class="page">${cells}</div></body></html>`;
  const win = window.open("", "_blank");
  if (!win) { alert("Please allow popups to print."); return; }
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

const MENU_ITEMS = [
  { label: "Print blank number lines (A4)", hint: "Two columns, no questions — ends and middle boxes", onClick: () => printBlankNumberLines(false) },
  { label: "Print blank number lines, every mark", hint: "Two columns, no questions — a box under every mark", onClick: () => printBlankNumberLines(true) },
];

// ═══════════════════════════════════════════════════════════════════════════════
// APP — leave unchanged
// ═══════════════════════════════════════════════════════════════════════════════

// Few questions → fewer, bigger columns so the sheet still fills the page (a wide line
// can only grow with its column width). 5 or fewer go one per row; otherwise the
// teacher's column count applies. Pages hold at most 12 (see _densityFloorMm).
// A pure Level 3 sheet is plain text, so it goes through the standard text print (which
// already scales to fit).
const printRounding: typeof handleDiagramPrint = (qs, mode, el, ctx) => {
  // Identify Significant Figures is all text (any level, differentiated or not)
  const allSf = qs.length > 0 && qs.every(q => (q as any)._sf);
  if (allSf || (!ctx.isDifferentiated && qs.length > 0 && qs.every(q => q.difficulty === "level3"))) {
    handlePrint(qs, ctx.toolName, ctx.difficulty, allSf && ctx.isDifferentiated, ctx.diffLevels, ctx.numColumns, ctx.instruction, mode, ctx.layout, ctx.showBorders, ctx.diffSameSize ?? true, ctx.diffColorLevels ?? true);
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
      stepVisualRenderer={stepVisual}
      stepVisualKeepsWorking
      stepVisualPlacement="top"
      reformatQuestion={reformatQuestion}
      depthItems={ALL_DEPTH_ITEMS}
      customPrintHandler={printRounding}
      menuItems={MENU_ITEMS}
      defaults={{ numColumns: 2, maxColumns: 2, maxColumnsByLevel: { level3: 4 }, numQuestions: 12, qoColumns: 2, collapseWorkingByDefault: true, hideAnswerStep: true }}
    />
  );
}

export const __test = { TOOL_CONFIG, generateQuestion, depthItems: ALL_DEPTH_ITEMS, levels: ["level1", "level2", "level3"] };
