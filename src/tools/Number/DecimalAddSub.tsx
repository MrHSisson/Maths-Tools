import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type WorkingStep,
  type ToolMultiSelect, type PlaceValueTableData, type PVCell, type PVRow,
  MathRenderer, randInt, pickActive,
  PlaceValueTable, placeValueStepRenderer, pvStep, PV_COLS_DECIMAL, PV_ONES_DECIMAL,
} from "../../shared";

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

const COLS = PV_COLS_DECIMAL;   // H T O . t h th
const ONES = PV_ONES_DECIMAL;
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

const ADD_SHAPE_MS: ToolMultiSelect = {
  key: "addShape",
  label: "Question types",
  options: [
    { value: "diffPlaces", label: "Different d.p.", sub: "3.4 + 2.68", defaultActive: true },
    { value: "wholePlus", label: "Whole + decimal", sub: "7 + 3.45", defaultActive: true },
    { value: "trimZero", label: "Answer ends in 0", sub: "2.35 + 1.15 = 3.5", defaultActive: true },
  ],
};

const SUB_SHAPE_MS: ToolMultiSelect = {
  key: "subShape",
  label: "Question types",
  options: [
    { value: "padZero", label: "Needs a placeholder 0", sub: "4.1 − 3.23", defaultActive: true },
    { value: "wholeMinus", label: "Whole − decimal", sub: "5 − 2.36", defaultActive: true },
    { value: "acrossZero", label: "Exchange across a 0", sub: "6.04 − 1.78", defaultActive: true },
    { value: "longerTop", label: "Longer number first", sub: "5.43 − 2.7", defaultActive: true },
  ],
};

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Adding & Subtracting Decimals",
  tools: {
    add: {
      name: "Adding",
      instruction: "Work out:",
      variables: [],
      dropdown: null,
      multiSelect: PLACES_MS,
      difficultySettings: {
        level1: { variables: [], dropdown: null, multiSelect: PLACES_MS },
        level2: { variables: [], dropdown: null, multiSelect: PLACES_MS },
        level3: { variables: [], dropdown: null, multiSelect: ADD_SHAPE_MS },
      },
    },
    subtract: {
      name: "Subtracting",
      instruction: "Work out:",
      variables: [],
      dropdown: null,
      multiSelect: PLACES_MS,
      difficultySettings: {
        level1: { variables: [], dropdown: null, multiSelect: PLACES_MS },
        level2: { variables: [], dropdown: null, multiSelect: PLACES_MS },
        level3: { variables: [], dropdown: null, multiSelect: SUB_SHAPE_MS },
      },
    },
  },
};

// ── 3. INFO_SECTIONS ──────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  { title: "Adding & Subtracting Decimals", icon: "➕", content: [
    { label: "Overview", detail: "Add and subtract decimals using a place value table. Line the decimal points up, then work column by column from the right — just like whole numbers." },
    { label: "Level 1 — Green", detail: "Adding: same number of decimal places, no carrying. Subtracting: same number of decimal places, no exchanging." },
    { label: "Level 2 — Yellow", detail: "Same number of decimal places, but carrying (adding) or exchanging (subtracting) is needed — including across the decimal point." },
    { label: "Level 3 — Red", detail: "Different numbers of decimal places, so a placeholder zero is needed (4.1 becomes 4.10). Subtracting includes whole numbers minus decimals and exchanging across a zero." },
  ]},
  { title: "How the table works", icon: "📊", content: [
    { label: "Line up the point", detail: "The decimal point sits between the Ones and Tenths columns. Digits in the same column have the same place value — that is why they can be added or subtracted." },
    { label: "Placeholder zeros", detail: "4.1 = 4.10. Filling the empty columns with zeros (shown in blue) changes nothing about the value, but every column now has a digit." },
    { label: "Carrying / exchanging", detail: "Carries are written small above the next column. When a digit is too small to subtract from, 1 of the next column is exchanged for 10 — the old digit is crossed out and the new one written above." },
    { label: "Trailing zeros", detail: "If the answer ends in a zero after the point (3.50), it can be dropped: 3.5." },
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard", detail: "An empty table to write into live; press Show Answer to fill it in and check." },
    { label: "Worked Example", detail: "The table built one step at a time: write the numbers, add placeholder zeros, then each column from the right." },
    { label: "Worksheet", detail: "A grid of questions with PDF export." },
  ]},
  { title: "Question Options", icon: "⚙️", content: [
    { label: "Decimal places (Levels 1–2)", detail: "Choose whether the numbers have 1, 2 or 3 decimal places." },
    { label: "Question types (Level 3)", detail: "Choose which tricky shapes appear — different numbers of decimal places, whole numbers with decimals, answers ending in zero, exchanging across a zero." },
    { label: "Differentiated", detail: "Worksheet mode produces three columns — one per level — simultaneously." },
  ]},
];

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

const snapTable = (s: Snap, workDp: number): PlaceValueTableData => {
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
  return { columns: COLS, onesIndex: ONES, showPoint: true, rows, cellHeight: 64, highlightCol: s.highlightCol };
};

interface Computed { result: Dec; steps: WorkingStep[]; finalTable: PlaceValueTableData; hasChain: boolean; carried: boolean; exchanged: boolean }

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const compute = (op: "+" | "−", a: Dec, b: Dec): Computed => {
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
    steps.push(pvStep(caption, snapTable({ ...snap, highlightCol, modified: [...snap.modified], carry: [...snap.carry], ans: [...snap.ans], cur: snap.cur ? [...snap.cur] : null }, W)));
  };

  push("Write both numbers in the place value table, lining up the decimal point. Digits in the same column have the same place value.");

  if (a.dp !== b.dp) {
    snap.padTop = a.dp < W;
    snap.padBot = b.dp < W;
    const shorter = a.dp < W ? a : b;
    const pad = decStr(shorter, W);
    push(`Fill the empty columns after the decimal point with zeros: ${decStr(shorter)} = ${pad}. The value hasn't changed, but now every column has a digit.`);
  }

  let hasChain = false, carried = false, exchanged = false;

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
      exchanged = true;
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
      if (out > 0) { snap.carry[c - 1] = String(out); carried = true; }
      const calc = carry > 0 ? `${t} + ${bt} + ${carry} = ${sum}` : `${t} + ${bt} = ${sum}`;
      push(`${NAME[c]}: ${calc}${out > 0 ? `. Write ${d} and carry ${out}.` : ""}`, c);
      carry = out;
    }
  }

  const finalTable = snapTable({ ...snap, highlightCol: undefined, modified: [...snap.modified], carry: [...snap.carry], ans: [...snap.ans], cur: snap.cur ? [...snap.cur] : null }, W);

  const full = decStr(result);
  const short = trimZeros(full);
  if (short !== full) {
    push(`A zero at the end of a decimal can be dropped: ${full} = ${short}.`);
  }

  return { result, steps, finalTable, hasChain, carried, exchanged };
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

const genAdd = (level: DifficultyLevel, v: Record<string, boolean>): Pair => {
  if (level !== "level3") {
    const dp = dpOf(v);
    const wholeMax = level === "level1" ? 9 : 99;
    return tryGen<Pair>(
      () => ({ a: rndDec(dp, 0, wholeMax), b: rndDec(dp, 0, wholeMax) }),
      ({ a, b }) => {
        const sum = a.int + b.int;
        if (sum % 10 === 0 || sum >= 1000 * POW[dp]) return false;
        const carries = compute("+", a, b).carried;
        return level === "level1" ? !carries : carries;
      },
    );
  }
  const shape = pickActive(v, ADD_SHAPE_MS.options);
  const W = (p: Pair) => Math.max(p.a.dp, p.b.dp);
  const sumTrailingZero = (p: Pair) => (valueAt(p.a, W(p)) + valueAt(p.b, W(p))) % 10 === 0;
  const pair = tryGen<Pair>(
    () => {
      if (shape === "wholePlus") {
        const whole = rndDec(0, 1, 99);
        const dec = rndDec(randInt(1, MAX_DP), 0, 99);
        return Math.random() < 0.5 ? { a: whole, b: dec } : { a: dec, b: whole };
      }
      if (shape === "trimZero") {
        const dp = randInt(2, MAX_DP);
        return { a: rndDec(dp, 0, 99), b: rndDec(dp, 0, 99) };
      }
      const d1 = randInt(1, MAX_DP - 1);
      const d2 = randInt(d1 + 1, MAX_DP);
      return Math.random() < 0.5 ? { a: rndDec(d1, 0, 99), b: rndDec(d2, 0, 99) } : { a: rndDec(d2, 0, 99), b: rndDec(d1, 0, 99) };
    },
    (p) => shape === "trimZero" ? sumTrailingZero(p) : !sumTrailingZero(p),
  );
  return pair;
};

const genSub = (level: DifficultyLevel, v: Record<string, boolean>): Pair => {
  if (level !== "level3") {
    const dp = dpOf(v);
    const wholeMax = level === "level1" ? 9 : 99;
    return tryGen<Pair>(
      () => ({ a: rndDec(dp, 0, wholeMax), b: rndDec(dp, 0, wholeMax) }),
      ({ a, b }) => {
        const diff = a.int - b.int;
        if (diff <= 0 || diff % 10 === 0) return false;
        const { exchanged } = compute("−", a, b);
        return level === "level1" ? !exchanged : exchanged;
      },
    );
  }
  const shape = pickActive(v, SUB_SHAPE_MS.options);
  return tryGen<Pair>(
    () => {
      if (shape === "wholeMinus") return { a: rndDec(0, 2, 99), b: rndDec(randInt(1, MAX_DP), 0, 98) };
      if (shape === "acrossZero") {
        const dp = randInt(2, MAX_DP);
        const a = rndDec(dp, 1, 99);
        // force a zero digit in the tenths column so the exchange has to travel
        const zeroed = a.int - (Math.floor(a.int / POW[dp - 1]) % 10) * POW[dp - 1];
        return { a: { int: zeroed, dp }, b: rndDec(dp, 0, 98) };
      }
      const big = randInt(2, MAX_DP);
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

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  _variables: Record<string, boolean>,
  _dropdownValue: string,
  multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  const t = tool as ToolType;
  const op: "+" | "−" = t === "add" ? "+" : "−";
  const { a, b } = t === "add" ? genAdd(level, multiSelectValues) : genSub(level, multiSelectValues);
  const comp = compute(op, a, b);
  const answer = trimZeros(decStr(comp.result));
  const aS = decStr(a), bS = decStr(b);
  const latexOp = op === "+" ? "+" : "-";

  return {
    kind: "simple",
    display: `${aS} ${op} ${bS}`,
    displayLatex: `${aS} ${latexOp} ${bS}`,
    answer,
    answerLatex: answer,
    working: comp.steps,
    _pv: { op, a, b, finalTable: comp.finalTable },
    key: `${t}-${level}-${aS}-${bS}-${Math.floor(Math.random() * 1_000_000)}`,
    difficulty: level,
  } as unknown as AnyQuestion;
};

// ── 7. questionRenderer ───────────────────────────────────────────────────────

interface PVData { op: "+" | "−"; a: Dec; b: Dec; finalTable: PlaceValueTableData }

const emptyTable = (op: "+" | "−"): PlaceValueTableData => ({
  columns: COLS, onesIndex: ONES, showPoint: true, cellHeight: 96,
  rows: [
    { kind: "cells", cells: blankCells() },
    { kind: "cells", cells: blankCells(), label: op },
    { kind: "cells", cells: blankCells(), label: "=", rule: true },
  ],
});

// The table is a ToolShell `workingScaffold` placed in the question box (the
// working panel starts collapsed, so it runs full width like Powers of 10); the
// teacher models on it and can hide it with the toolbar button.
const workingScaffold = {
  label: "place value table",
  placement: "question" as const,
  render: (q: AnyQuestion, showAnswer: boolean): JSX.Element | null => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pv = (q as any)._pv as PVData | undefined;
    if (!pv) return null;
    return <PlaceValueTable data={showAnswer ? { ...pv.finalTable, cellHeight: 72 } : emptyTable(pv.op)} />;
  },
};

const questionRenderer = (
  q: AnyQuestion,
  showAnswer: boolean,
  _colorScheme: string,
  compact?: boolean,
  _idx?: number,
  qo?: { fullscreen?: boolean },
  fontClass?: string,
): JSX.Element | null => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyQ = q as any;
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
        {showAnswer && isWhiteboard && (
          <span className={`${eqClass} ml-4`} style={{ color: "#166534" }}>
            <MathRenderer latex={`= ${anyQ.answerLatex}`} />
          </span>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

// Exposed for the generator smoke-test suite (src/tests/generators.test.ts).
export const __test = { TOOL_CONFIG, generateQuestion, compute };

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      questionRenderer={questionRenderer}
      stepRenderer={placeValueStepRenderer}
      workingScaffold={workingScaffold}
      defaults={{
        collapseWorkingByDefault: true,
        hideFontControls: true,
        numQuestions: 10,
        numColumns: 3,
        maxColumns: 4,
      }}
    />
  );
}
