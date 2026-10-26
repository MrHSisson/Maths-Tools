import { renderToStaticMarkup } from "react-dom/server";
import {
  ToolShell,
  type ToolConfig, type DifficultyLevel, type AnyQuestion, type WorkingStep,
  type ToolMultiSelect, type ToolVariable, type QOSnapshot, type PlaceValueTableData, type PVCell, type PVRow,
  MathRenderer, randInt, pickActive, bandFromTable,
  PlaceValueTable, PlaceValueSvg, pvSvgSize, pvSvgAspect, pvSvgRowHForAspect, placeValueStepRenderer, placeValueStepVisual, pvStep, handlePrint, handleDiagramPrint, pvColumnSet, pvSlice, pvDisplay, PV_CELL_H, PV_TABLE_START_DD, PV_WORD_HEADERS_VAR, PV_WORD_HEADERS_KEY,
  extras,
  placeValueSheet,
} from "../../shared";
import { applyAbout } from "../../shared";
import { ABOUT } from "./DecimalAddSub.about";
import { BANDS } from "./DecimalAddSub.calibration";

// ─────────────────────────────────────────────────────────────────────────────
// Adding & Subtracting Decimals
//
// A place-value-table tool (shared `PlaceValueTable`, the same representation as
// Powers of 10 and Comparing & Ordering). The table is the pedagogy: lining the
// decimal points up, filling gaps with placeholder zeros (4.1 → 4.10), then a
// column-by-column calculation from the right with carries / exchanges written
// above the digits.
//
//   • Whiteboard  — an EMPTY full-width table under the equation (hideable) the teacher fills live; Show Answer fills it.
//   • Worked Ex.  — the table rebuilt one step at a time (write → zeros → each column).
//   • Worksheet   — text only.
//
// All arithmetic is integer (a Dec is `int / 10^dp`), so nothing drifts.
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. Types ──────────────────────────────────────────────────────────────────

type ToolType = "add" | "subtract";

/** value = int / 10^dp — always non-negative, dp 0–3. */
interface Dec { int: number; dp: number }

const COLSET = pvColumnSet(3, 3);   // H T O . t h th (letters + words)
const COLS = COLSET.columns;
const ONES = COLSET.onesIndex;
const NCOLS = COLS.length;
const MAX_DP = 3;

const UNIT = ["hundred", "ten", "one", "tenth", "hundredth", "thousandth"];
const NAME = ["Hundreds", "Tens", "Ones", "Tenths", "Hundredths", "Thousandths"];

// ── 2. TOOL_CONFIG ────────────────────────────────────────────────────────────

const PLACES_MS: ToolMultiSelect = {
  key: "places",
  label: "Decimal places",
  options: [
    { value: "dp1", label: "1 d.p.", defaultActive: true },
    { value: "dp2", label: "2 d.p.", defaultActive: true },
    { value: "dp3", label: "3 d.p.", defaultActive: false },
  ],
};

// Level 3: a MAX — the longest number in a question has up to this many d.p. (the other has fewer).
const PLACES_L3_MS: ToolMultiSelect = {
  key: "places",
  label: "Max decimal places",
  info: "The longest number in a question has up to this many decimal places; the other number has fewer. Question types that need two different lengths always use at least 2 d.p.",
  exclusive: true,
  options: PLACES_MS.options.map((o) => ({ ...o, label: o.value === "dp1" ? "1" : o.value === "dp2" ? "2" : "3", defaultActive: o.value === "dp3" })),
};

// Level 2: how many carries / exchanges the calculation needs. One is drawn per question (a focus choice; the worksheet order comes
// from the calibrated rubric below, which also counts the carries a question actually needs).
const exchangePool = (label: string): ToolMultiSelect => ({
  key: "exchanges",
  label,
  options: [
    { value: "x1", label: "1", defaultActive: true },
    { value: "x2", label: "2", defaultActive: true },
    { value: "x3", label: "3+", defaultActive: true },
  ],
});
const CARRY_MS = exchangePool("Carries needed");
const EXCHANGE_MS = exchangePool("Exchanges needed");

const ADD_SHAPE_MS: ToolMultiSelect = {
  key: "addShape",
  label: "Question Types",
  options: [
    { value: "diffPlaces", label: "Different d.p.", sub: "3.4 + 2.68", defaultActive: true },
    { value: "wholePlus", label: "Whole + decimal", sub: "7 + 3.45", defaultActive: true },
    { value: "trimZero", label: "Answer ends in 0", sub: "2.35 + 1.15 = 3.5", defaultActive: true },
  ],
};

const SUB_SHAPE_MS: ToolMultiSelect = {
  key: "subShape",
  label: "Question Types",
  options: [
    { value: "padZero", label: "Needs a placeholder 0", sub: "4.1 − 3.23", defaultActive: true },
    { value: "wholeMinus", label: "Whole − decimal", sub: "5 − 2.36", defaultActive: true },
    { value: "acrossZero", label: "Exchange across a 0", sub: "6.04 − 1.78", defaultActive: true },
    { value: "longerTop", label: "Longer number first", sub: "5.43 − 2.7", defaultActive: true },
  ],
};

const TABLE_START_DD = PV_TABLE_START_DD;

// Worksheet only: give each question its own place value grid (prints via the diagram printer).
const WS_GRID_VAR: ToolVariable = {
  key: "wsGrid",
  label: "Grids on worksheet",
  defaultValue: false,
  worksheetOnly: true,
  capsColumns: 2,
  info: "Gives every question its own place value grid to work in. Grids need room, so the worksheet is limited to 2 wide columns (differentiated sheets keep one column per level) and up to 10 questions fit on a page.",
};

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Adding & Subtracting Decimals",
  calibrated: true,
  tools: {
    add: {
      name: "Adding",
      instruction: "Work out:",
      variables: [PV_WORD_HEADERS_VAR, WS_GRID_VAR],
      dropdown: TABLE_START_DD,
      multiSelect: PLACES_MS,
      difficultySettings: {
        level1: { variables: [PV_WORD_HEADERS_VAR, WS_GRID_VAR], dropdown: TABLE_START_DD, multiSelect: PLACES_MS },
        level2: { variables: [PV_WORD_HEADERS_VAR, WS_GRID_VAR], dropdown: TABLE_START_DD, multiSelect: [PLACES_MS, CARRY_MS] },
        level3: { variables: [PV_WORD_HEADERS_VAR, WS_GRID_VAR], dropdown: TABLE_START_DD, multiSelect: [PLACES_L3_MS, ADD_SHAPE_MS] },
      },
    },
    subtract: {
      name: "Subtracting",
      instruction: "Work out:",
      variables: [PV_WORD_HEADERS_VAR, WS_GRID_VAR],
      dropdown: TABLE_START_DD,
      multiSelect: PLACES_MS,
      difficultySettings: {
        level1: { variables: [PV_WORD_HEADERS_VAR, WS_GRID_VAR], dropdown: TABLE_START_DD, multiSelect: PLACES_MS },
        level2: { variables: [PV_WORD_HEADERS_VAR, WS_GRID_VAR], dropdown: TABLE_START_DD, multiSelect: [PLACES_MS, EXCHANGE_MS] },
        level3: { variables: [PV_WORD_HEADERS_VAR, WS_GRID_VAR], dropdown: TABLE_START_DD, multiSelect: [PLACES_L3_MS, SUB_SHAPE_MS] },
      },
    },
  },
};


// ── 4. Decimal helpers (integer arithmetic) ───────────────────────────────────

const POW = [1, 10, 100, 1000];

const decStr = (d: Dec, dp: number = d.dp): string => {
  const scaled = d.int * POW[dp - d.dp];
  if (dp === 0) return String(scaled);
  const s = String(scaled).padStart(dp + 1, "0");
  return `${s.slice(0, -dp)}.${s.slice(-dp)}`;
};

const trimZeros = (s: string): string => (s.includes(".") ? s.replace(/0+$/, "").replace(/\.$/, "") : s);

/** Digit of d in each working column (thousandths resolution). */
const toDigits = (d: Dec): number[] => {
  const scaled = d.int * POW[MAX_DP - d.dp];
  return COLS.map((_c, c) => Math.floor(scaled / 10 ** (NCOLS - 1 - c)) % 10);
};

/** The cells of a number as first written (own digits only), optionally with placeholder zeros. */
const shownCells = (d: Dec, padTo: number): PVCell[] => {
  const dig = toDigits(d);
  let lead = ONES;
  for (let c = 0; c < ONES; c++) if (dig[c] !== 0) { lead = c; break; }
  return COLS.map((_c, c): PVCell => {
    if (c === ONES) return { v: String(dig[c]) };
    if (c < ONES) return c >= lead ? { v: String(dig[c]) } : { v: "" };
    const k = c - ONES;
    if (k <= d.dp) return { v: String(dig[c]) };
    if (k <= padTo) return { v: "0", tone: "zero" };
    return { v: "" };
  });
};

const blankCells = (): PVCell[] => COLS.map(() => ({ v: "" }));

const lowestDigit = (d: Dec): number => d.int % 10;

// ── 5. Working — snapshots of the table ───────────────────────────────────────

interface Snap {
  top: Dec; bot: Dec; op: "+" | "−";
  padTop: boolean; padBot: boolean;
  /** per column: exchanged-away digit display state (subtraction) */
  cur: number[] | null; modified: boolean[];
  carry: (string | undefined)[];
  ans: string[];
  highlightCol?: number;
}

/** Which of the six working columns a table shows: [start, end). Sized to the selected question range. */
interface Layout { start: number; end: number }
const FULL: Layout = { start: 0, end: NCOLS };
const COL_W = 150;

const sliceTable = (t: PlaceValueTableData, { start, end }: Layout): PlaceValueTableData => pvSlice(t, start, end);

/** Columns a question range can need: whole-number columns by tool/level, decimal columns by the
 *  active "Decimal places" options (Level 3 always allows up to 3). */
const layoutFor = (tool: ToolType, level: DifficultyLevel, v: Record<string, boolean>): Layout => {
  const maxDp = Math.max(level === "level3" ? 2 : 1, ...PLACES_MS.options.filter((o) => v[o.value] !== false).map((o) => Number(o.value.slice(2))));
  // L1 is single-digit wholes; adding can reach hundreds; L2 subtracting reaches hundreds only for "3+ exchanges".
  const start = level === "level1" ? ONES : tool === "add" ? 0 : level === "level2" && v["x3"] !== false ? 0 : 1;
  return { start, end: ONES + maxDp + 1 };
};

const snapTable = (s: Snap, workDp: number, layout: Layout): PlaceValueTableData => {
  const topCells = shownCells(s.top, s.padTop ? workDp : s.top.dp).map((cell, c): PVCell => {
    if (s.cur && s.modified[c]) return { ...cell, v: cell.v === "" ? "0" : cell.v, strike: true, above: String(s.cur[c]) };
    if (s.carry[c]) return { ...cell, above: s.carry[c] };
    return cell;
  });
  const botCells = shownCells(s.bot, s.padBot ? workDp : s.bot.dp);
  const ansCells: PVCell[] = s.ans.map((v) => ({ v, tone: v ? "answer" as const : undefined }));
  const rows: PVRow[] = [
    { kind: "cells", cells: topCells },
    { kind: "cells", cells: botCells, label: s.op },
    { kind: "cells", cells: ansCells, label: "=", rule: true },
  ];
  return sliceTable({ columns: COLS, columnNames: COLSET.columnNames, onesIndex: ONES, showPoint: true, rows, cellHeight: 64, colWidth: COL_W, highlightCol: s.highlightCol }, layout);
};

interface Computed { startTables: { numbers: PlaceValueTableData; zeros: PlaceValueTableData }; result: Dec; steps: WorkingStep[]; finalTable: PlaceValueTableData; hasChain: boolean; carried: boolean; exchanged: boolean; carries: number; exchanges: number }

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const compute = (op: "+" | "−", a: Dec, b: Dec, layout: Layout = FULL): Computed => {
  const W = Math.max(a.dp, b.dp);
  const last = ONES + W;
  const topD = toDigits(a);
  const botD = toDigits(b);
  const resultInt = op === "+"
    ? a.int * POW[W - a.dp] + b.int * POW[W - b.dp]
    : a.int * POW[W - a.dp] - b.int * POW[W - b.dp];
  const result: Dec = { int: resultInt, dp: W };
  const resDigits = toDigits(result);
  let resLead = ONES;
  for (let c = 0; c < ONES; c++) if (resDigits[c] !== 0) { resLead = c; break; }
  let topLead = ONES;
  for (let c = 0; c < ONES; c++) if (topD[c] !== 0 || botD[c] !== 0) { topLead = c; break; }
  if (op === "−") { topLead = ONES; for (let c = 0; c < ONES; c++) if (topD[c] !== 0) { topLead = c; break; } }

  const snap: Snap = {
    top: a, bot: b, op, padTop: false, padBot: false,
    cur: op === "−" ? [...topD] : null, modified: COLS.map(() => false),
    carry: COLS.map(() => undefined), ans: COLS.map(() => ""),
  };
  const steps: WorkingStep[] = [];
  const push = (caption: string, highlightCol?: number) => {
    steps.push(pvStep(caption, snapTable({ ...snap, highlightCol, modified: [...snap.modified], carry: [...snap.carry], ans: [...snap.ans], cur: snap.cur ? [...snap.cur] : null }, W, layout)));
  };

  push("Write both numbers in the place value table, lining up the decimal point. Digits in the same column have the same place value.");

  if (a.dp !== b.dp) {
    snap.padTop = a.dp < W;
    snap.padBot = b.dp < W;
    const shorter = a.dp < W ? a : b;
    const pad = decStr(shorter, W);
    push(`Fill the empty columns after the decimal point with zeros: ${decStr(shorter)} = ${pad}. The value hasn't changed, but now every column has a digit.`);
  }

  let hasChain = false, carried = false, exchanged = false, carries = 0, exchanges = 0;

  if (op === "−") {
    const cur = snap.cur as number[];
    const lend = (k: number, prefix: string) => {
      const from = k - 1;
      let p = prefix;
      if (cur[from] === 0) {
        hasChain = true;
        lend(from, `${prefix} The ${UNIT[from]}s column is 0, so`);
        p = "Now,";
      }
      cur[from] -= 1; cur[k] += 10;
      snap.modified[from] = true; snap.modified[k] = true;
      exchanged = true; exchanges++;
      const body = `exchange 1 ${UNIT[from]} for 10 ${UNIT[k]}s.`;
      push(`${p} ${p.endsWith(".") ? cap(body) : body}`, k);
    };
    for (let c = last; c >= topLead; c--) {
      if (cur[c] < botD[c]) lend(c, `${cur[c]} − ${botD[c]} isn't possible.`);
      const d = cur[c] - botD[c];
      snap.ans[c] = c < resLead ? "" : String(d);
      push(`${NAME[c]}: ${cur[c]} − ${botD[c]} = ${d}`, c);
    }
  } else {
    let carry = 0;
    for (let c = last; c >= 0; c--) {
      if (c < topLead && carry === 0) break;
      const t = topD[c], bt = botD[c];
      const sum = t + bt + carry;
      const d = sum % 10;
      const out = Math.floor(sum / 10);
      snap.ans[c] = String(d);
      if (out > 0) { snap.carry[c - 1] = String(out); carried = true; carries++; }
      const calc = carry > 0 ? `${t} + ${bt} + ${carry} = ${sum}` : `${t} + ${bt} = ${sum}`;
      push(`${NAME[c]}: ${calc}${out > 0 ? `. Write ${d} and carry ${out}.` : ""}`, c);
      carry = out;
    }
  }

  const finalTable = snapTable({ ...snap, highlightCol: undefined, modified: [...snap.modified], carry: [...snap.carry], ans: [...snap.ans], cur: snap.cur ? [...snap.cur] : null }, W, layout);

  const full = decStr(result);
  const short = trimZeros(full);
  if (short !== full) {
    push(`A zero at the end of a decimal can be dropped: ${full} = ${short}.`);
  }

  const tableOf = (i: number) => (steps[i].extra as { table: PlaceValueTableData }).table;
  const startTables = { numbers: tableOf(0), zeros: tableOf(a.dp !== b.dp ? 1 : 0) };

  return { startTables, result, steps, finalTable, hasChain, carried, exchanged, carries, exchanges };
};

// ── 6. Question generation ────────────────────────────────────────────────────

/** Random decimal with dp places (last digit never 0), whole part in [wholeMin, wholeMax]. */
const rndDec = (dp: number, wholeMin: number, wholeMax: number): Dec => {
  const whole = randInt(wholeMin, wholeMax);
  if (dp === 0) return { int: whole, dp: 0 };
  let frac = 0;
  do { frac = randInt(1, POW[dp] - 1); } while (frac % 10 === 0);
  return { int: whole * POW[dp] + frac, dp };
};

const dpOf = (v: Record<string, boolean>): number => Number(pickActive(v, PLACES_MS.options).slice(2));

const valueAt = (d: Dec, dp: number) => d.int * POW[dp - d.dp];

const tryGen = <T,>(make: () => T, ok: (x: T) => boolean): T => {
  let last = make();
  for (let i = 0; i < 2000; i++) {
    if (ok(last)) return last;
    last = make();
  }
  return last;
};

interface Pair { a: Dec; b: Dec }

/** Level 2: how many carries / exchanges this question must need (1, 2, or 3 meaning "3 or more"). */
const wantedCount = (v: Record<string, boolean>): 1 | 2 | 3 =>
  Number(pickActive(v, CARRY_MS.options).slice(1)) as 1 | 2 | 3;
const countOk = (n: number, want: number) => (want === 3 ? n >= 3 : n === want);

const genAdd = (level: DifficultyLevel, v: Record<string, boolean>): Pair => {
  if (level !== "level3") {
    const dp = dpOf(v);
    const wholeMax = level === "level1" ? 9 : 99;
    const want = wantedCount(v);
    return tryGen<Pair>(
      () => ({ a: rndDec(dp, 0, wholeMax), b: rndDec(dp, 0, wholeMax) }),
      ({ a, b }) => {
        const sum = a.int + b.int;
        if (sum % 10 === 0 || sum >= 1000 * POW[dp]) return false;
        const { carries } = compute("+", a, b);
        return level === "level1" ? carries === 0 : countOk(carries, want);
      },
    );
  }
  // The "Max decimal places" pool caps the longest number's d.p.; shapes that need two different
  // lengths can't use 1 d.p., so draw the shape from those that fit and the length from 1..cap.
  const cap = dpOf(v);
  const fits = ADD_SHAPE_MS.options.filter((o) => v[o.value] !== false && (cap >= 2 || o.value === "wholePlus" || o.value === "trimZero"));
  const shape = fits.length ? pickActive({}, fits) : "diffPlaces";
  const maxDp = randInt(shape === "diffPlaces" ? 2 : 1, Math.max(cap, 2));
  const W = (p: Pair) => Math.max(p.a.dp, p.b.dp);
  const sumTrailingZero = (p: Pair) => (valueAt(p.a, W(p)) + valueAt(p.b, W(p))) % 10 === 0;
  const pair = tryGen<Pair>(
    () => {
      if (shape === "wholePlus") {
        const whole = rndDec(0, 1, 99);
        const dec = rndDec(maxDp, 0, 99);
        return Math.random() < 0.5 ? { a: whole, b: dec } : { a: dec, b: whole };
      }
      if (shape === "trimZero") {
        return { a: rndDec(maxDp, 0, 99), b: rndDec(maxDp, 0, 99) };
      }
      const d1 = randInt(1, maxDp - 1);
      const d2 = maxDp;
      return Math.random() < 0.5 ? { a: rndDec(d1, 0, 99), b: rndDec(d2, 0, 99) } : { a: rndDec(d2, 0, 99), b: rndDec(d1, 0, 99) };
    },
    (p) => shape === "trimZero" ? sumTrailingZero(p) : !sumTrailingZero(p),
  );
  return pair;
};

const genSub = (level: DifficultyLevel, v: Record<string, boolean>): Pair => {
  if (level !== "level3") {
    const dp = dpOf(v);
    const want = wantedCount(v);
    // Three exchanges at 1 d.p. needs a hundreds column to lend from.
    const wholeMax = level === "level1" ? 9 : want === 3 ? 999 : 99;
    return tryGen<Pair>(
      () => ({ a: rndDec(dp, 0, wholeMax), b: rndDec(dp, 0, wholeMax) }),
      ({ a, b }) => {
        const diff = a.int - b.int;
        if (diff <= 0 || diff % 10 === 0) return false;
        const { exchanges } = compute("−", a, b);
        return level === "level1" ? exchanges === 0 : countOk(exchanges, want);
      },
    );
  }
  // Longest number's d.p. comes from the "Decimal places" pool; shapes needing two lengths or a
  // zero in the tenths column require at least 2 d.p.
  const cap = dpOf(v);
  const fits = SUB_SHAPE_MS.options.filter((o) => v[o.value] !== false && (cap >= 2 || o.value === "wholeMinus"));
  const shape = fits.length ? pickActive({}, fits) : "padZero";
  const maxDp = shape === "wholeMinus" ? randInt(1, cap) : randInt(2, Math.max(cap, 2));
  return tryGen<Pair>(
    () => {
      if (shape === "wholeMinus") return { a: rndDec(0, 2, 99), b: rndDec(maxDp, 0, 98) };
      if (shape === "acrossZero") {
        const dp = maxDp;
        const a = rndDec(dp, 1, 99);
        // force a zero digit in the tenths column so the exchange has to travel
        const zeroed = a.int - (Math.floor(a.int / POW[dp - 1]) % 10) * POW[dp - 1];
        return { a: { int: zeroed, dp }, b: rndDec(dp, 0, 98) };
      }
      const big = maxDp;
      const small = randInt(1, big - 1);
      return shape === "padZero"
        ? { a: rndDec(small, 1, 99), b: rndDec(big, 0, 98) }
        : { a: rndDec(big, 1, 99), b: rndDec(small, 0, 98) };
    },
    ({ a, b }) => {
      const W = Math.max(a.dp, b.dp);
      const diff = valueAt(a, W) - valueAt(b, W);
      if (diff <= 0 || diff % 10 === 0) return false;
      if (lowestDigit(a) === 0 || lowestDigit(b) === 0) return false;
      if (shape === "acrossZero") return compute("−", a, b).hasChain;
      return true;
    },
  );
};

const POOL_VALUES = [...PLACES_MS.options, ...CARRY_MS.options, ...ADD_SHAPE_MS.options, ...SUB_SHAPE_MS.options].map((o) => o.value);
/** Signature of the question-pool options — changes only when the maths would change. */
const poolSig = (v: Record<string, boolean>): string => POOL_VALUES.map((k) => (v[k] !== false ? 1 : 0)).join("");

/**
 * Smart Progressor ranking — the standard calibration process (src/shared/calibration.ts). The raw score is the work the question asks for:
 * the decimal places, the whole-number digits, each carry / exchange, mismatched lengths (a placeholder 0 is needed), a whole-number operand
 * and an exchange that travels across a zero. See docs/calibration/DECIMAL_ADD_SUB_DIFFICULTY.md.
 */
const difficultyOf = (op: "+" | "−", a: Dec, b: Dec, comp: Computed): { raw: number; category: string } => {
  const W = Math.max(a.dp, b.dp);
  const moves = op === "+" ? comp.carries : comp.exchanges;
  const wholeDigits = Math.max(String(Math.floor(a.int / POW[a.dp])).length, String(Math.floor(b.int / POW[b.dp])).length);
  const uneven = a.dp !== b.dp;
  const raw = 0.8 + 0.6 * W + 0.5 * (wholeDigits - 1) + 1.2 * Math.min(moves, 5) + (uneven ? 1.2 : 0) + (comp.hasChain ? 1.5 : 0) + (a.dp === 0 || b.dp === 0 ? 0.8 : 0);
  const category = `${op} · ${W} d.p. · ${moves >= 3 ? "3+" : moves} ${op === "+" ? "carries" : "exchanges"}${uneven ? " · uneven" : ""}${comp.hasChain ? " · across 0" : ""}`;
  return { raw: Math.round(raw * 10) / 10, category };
};
const rank = (t: ToolType, level: DifficultyLevel, op: "+" | "−", a: Dec, b: Dec, comp: Computed) => {
  const { raw, category } = difficultyOf(op, a, b, comp);
  return { _rawDifficulty: raw, _category: category, _difficultyScore: bandFromTable(BANDS, t, level, raw) };
};

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string,
  multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  const t = tool as ToolType;
  const op: "+" | "−" = t === "add" ? "+" : "−";
  const { a, b } = t === "add" ? genAdd(level, multiSelectValues) : genSub(level, multiSelectValues);
  const layout = layoutFor(t, level, multiSelectValues);
  const comp = compute(op, a, b, layout);
  const answer = trimZeros(decStr(comp.result));
  const aS = decStr(a), bS = decStr(b);
  const latexOp = op === "+" ? "+" : "-";

  // Worksheet grids (opt-in): each question carries its own place value grid, drawn as an SVG cell.
  const wsOn = variables["wsGrid"] === true;
  const start = dropdownValue === "numbers" || dropdownValue === "zeros" ? dropdownValue : "empty";
  const hs = variables[PV_WORD_HEADERS_KEY] ? "words" as const : "letters" as const;
  const wsTable = { ...(start === "numbers" ? comp.startTables.numbers : start === "zeros" ? comp.startTables.zeros : emptyTable(op, layout)), headerStyle: hs };
  const eqText = `${aS} ${op} ${bS} =`;

  return {
    kind: "simple",
    display: `${aS} ${op} ${bS}`,
    displayLatex: `${aS} ${latexOp} ${bS}`,
    answer,
    answerLatex: answer,
    working: comp.steps,
    _pv: { op, a, b, layout, finalTable: { ...comp.finalTable, headerStyle: hs }, startTables: comp.startTables },
    _sig: poolSig(multiSelectValues),
    ...rank(t, level, op, a, b, comp),
    _ws: { on: wsOn, table: wsTable, title: eqText },
    _fixedSizeCell: wsOn,   // a grid cell is drawn at a fixed size, so the worksheet text-size chevrons would do nothing
    _printText: eqText,
    ...(wsOn ? { _aspect: pvSvgAspect(wsTable, true), _densityFloorMm: 38 } : {}),
    key: `${t}-${level}-${aS}-${bS}-${Math.floor(Math.random() * 1_000_000)}`,
    difficulty: level,
  } as unknown as AnyQuestion;
};

// "Table starts" is display-only, so changing it must not regenerate the question.
// Anything that changes the question pool still does (return null).
const reformatQuestion = (q: AnyQuestion, qo: QOSnapshot): AnyQuestion | null =>
  extras(q)._sig === poolSig(qo.multiSelectValues) ? ({ ...q } as AnyQuestion) : null;

// ── 7. questionRenderer ───────────────────────────────────────────────────────

interface PVData { op: "+" | "−"; a: Dec; b: Dec; layout: Layout; finalTable: PlaceValueTableData; startTables: { numbers: PlaceValueTableData; zeros: PlaceValueTableData } }

// One row height for every whiteboard state (empty / prefilled / answered) so the
// table never resizes or rescales when the answer is revealed.
const CELL_H = PV_CELL_H;

const emptyTable = (op: "+" | "−", layout: Layout): PlaceValueTableData => sliceTable({
  columns: COLS, columnNames: COLSET.columnNames, onesIndex: ONES, showPoint: true, cellHeight: CELL_H, colWidth: COL_W,
  rows: [
    { kind: "cells", cells: blankCells() },
    { kind: "cells", cells: blankCells(), label: op },
    { kind: "cells", cells: blankCells(), label: "=", rule: true },
  ],
}, layout);

// The table is a ToolShell `workingScaffold` placed in the question box (the
// working panel starts collapsed, so it runs full width like Powers of 10); the
// teacher models on it and can hide it with the toolbar button.
const workingScaffold = {
  label: "place value table",
  placement: "question" as const,
  render: (q: AnyQuestion, showAnswer: boolean, qo?: QOSnapshot): JSX.Element | null => {
    const pv = extras(q)._pv as PVData | undefined;
    if (!pv) return null;
    const start = qo?.dropdownValue ?? "empty";
    const base = showAnswer ? pv.finalTable
      : start === "numbers" ? pv.startTables.numbers
      : start === "zeros" ? pv.startTables.zeros
      : emptyTable(pv.op, pv.layout);
    return <PlaceValueTable data={pvDisplay(base, qo)} />;
  },
};

const questionRenderer = (
  q: AnyQuestion,
  showAnswer: boolean,
  compact?: boolean,
  idx?: number,
  qo?: QOSnapshot,
  fontClass?: string,
): JSX.Element | null => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyQ = q as any;
  const ws0 = extras(q)._ws as { on?: boolean } | undefined;
  if (compact === true && ws0?.on) {
    const ws = anyQ._ws as { table: PlaceValueTableData; title: string };
    const solved = (extras(q)._pv as PVData).finalTable;
    // Preview size: the SVG is drawn for print, so cap how large a cell shows it (about half scale)
    // and centre it, rather than letting it stretch to the full cell width.
    return (
      <div className="w-full" style={{ maxWidth: pvSvgSize(ws.table, true).w * 0.5, margin: "0 auto" }}>
        <PlaceValueSvg data={showAnswer ? solved : ws.table} title={ws.title} idx={idx} />
        {/* hidden solved twin — the print path uses it on the answer pages */}
        {idx !== undefined && <div className="hidden"><PlaceValueSvg data={solved} title={ws.title} answerIdx={idx} /></div>}
      </div>
    );
  }

  if (compact === true) {
    return (
      <div className="w-full text-center">
        <span className={`${fontClass ?? "text-3xl"} font-bold`} style={{ color: "#000" }}>
          <MathRenderer latex={anyQ.displayLatex} />
        </span>
      </div>
    );
  }

  const isWhiteboard = compact === undefined || qo?.fullscreen === true;
  const eqClass = `${fontClass ?? "text-5xl"} font-bold`;

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <div className="text-center">
        <span className={eqClass} style={{ color: "#000" }}>
          <MathRenderer latex={anyQ.displayLatex} />
        </span>
        {/* With the table showing, the answer lives in its bottom row and the equation stays centred;
            with the table hidden, the answer appears inline as normal. */}
        {showAnswer && isWhiteboard && !qo?.scaffoldVisible && (
          <span className={`${eqClass} ml-4`} style={{ color: "#166534" }}>
            <MathRenderer latex={`= ${anyQ.answerLatex}`} />
          </span>
        )}
      </div>
    </div>
  );
};

// Worksheets with grids print through the diagram printer. A page holds at most 10 (5 rows of 2);
// fewer questions stretch the grid rows so the grids still fill the page, like the number lines.
// Plain worksheets use the text printer.
const PAGE_USABLE_MM = 259;   // A4 less margins and the page header (matches printDiagram)
const MAX_ROWS_PER_PAGE = 5;
const printHandler: typeof handleDiagramPrint = (qs, mode, _el, ctx) => {
  if (!qs.some((q) => (extras(q)._ws as { on?: boolean } | undefined)?.on)) {
    handlePrint(qs, ctx.toolName, ctx.difficulty, ctx.isDifferentiated, ctx.diffLevels, ctx.numColumns, ctx.instruction, mode, ctx.layout, ctx.showBorders, ctx.diffSameSize ?? true, ctx.diffColorLevels ?? true);
    return;
  }
  const cols = ctx.isDifferentiated ? Math.max(1, ctx.diffLevels.length) : Math.min(ctx.numColumns, 2);
  const cellW = (186 - 2 * (cols - 1)) / cols;
  const rows = Math.max(1, Math.min(Math.ceil(qs.length / cols), MAX_ROWS_PER_PAGE));
  const innerH = PAGE_USABLE_MM / rows - 12;   // cell height less its padding / number chrome
  // Re-draw each grid with row heights for this page fill, in a detached container the printer reads.
  const holder = document.createElement("div");
  const sized = qs.map((q, i) => {
    const ws = extras(q)._ws as { on: boolean; table: PlaceValueTableData; title: string } | undefined;
    if (!ws?.on) return q;
    const rowH = pvSvgRowHForAspect(ws.table, true, cellW / innerH);
    const solved = (extras(q)._pv as PVData).finalTable;
    holder.insertAdjacentHTML("beforeend",
      renderToStaticMarkup(<PlaceValueSvg data={ws.table} title={ws.title} idx={i} rowH={rowH} fill />)
      + renderToStaticMarkup(<PlaceValueSvg data={solved} title={ws.title} answerIdx={i} rowH={rowH} fill />));
    return { ...q, _aspect: pvSvgAspect(ws.table, true, rowH) } as unknown as AnyQuestion;
  });
  handleDiagramPrint(sized, mode, holder, { ...ctx, numColumns: cols });
};

// ─────────────────────────────────────────────────────────────────────────────

// Exposed for the generator smoke-test suite (src/tests/generators.test.ts).
applyAbout(TOOL_CONFIG, ABOUT);

export const __test = { TOOL_CONFIG, generateQuestion, compute };

// Printables: this tool's working is built on a blank the student fills in, so the burger menu offers it as a sheet.
const PRINTABLES = [placeValueSheet()];

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      printables={PRINTABLES}
      generateQuestion={generateQuestion}
      reformatQuestion={reformatQuestion}
      questionRenderer={questionRenderer}
      stepRenderer={placeValueStepRenderer}
      stepVisualRenderer={placeValueStepVisual}
      customPrintHandler={printHandler}
      workingScaffold={workingScaffold}
      defaults={{
        collapseWorkingByDefault: true,
        displayFontSize: 3, // text-4xl — the equation's size (chevrons return when the table is hidden)
        worksheetFontSize: 0, // text-lg — text-only worksheets (grid cells are drawn at a fixed size)
        hideFontControls: true,
        worksheetFontControls: true, // a plain-text worksheet keeps its text-size chevrons (hidden only while grids are on)
        numQuestions: 10,
        numColumns: 3,
        maxColumns: 4,
      }}
    />
  );
}
