import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type WorkingStep, type ToolDropdown,
  type ToolMultiSelect, type PlaceValueTableData, type PVCell, type PVRow,
  randInt, pick, pickActive,
  pvStep, pvBaseColumnSet, columnName, placeValueStepRenderer, placeValueStepVisual,
} from "../../shared";

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

// Worked-example working uses the shared place value table (pvStep snapshots, base-aware columns 128 … 1): column
// addition walks one column at a time with the carry written above the next column; shifts show the 8-bit register
// with spare columns outside it, where the bits that are pushed off the end appear in red. Carry wording matches
// Binary Counting (src/shared/carry.ts).

// ── 1. Constants ──────────────────────────────────────────────────────────────

const BIT_WIDTH = 8; // OCR J277 works with 8-bit registers throughout

// Share of questions that overflow when the Overflow selector is set to
// "Mixed" — a plain probability generateQuestion applies itself (see below),
// not ToolShell's weighted-multiSelect quota balancing, which always targets
// a ~50/50 split and can't be pointed at an arbitrary rate like this one.
const MIXED_OVERFLOW_RATE = 0.2;

// ── 2. TOOL_CONFIG ────────────────────────────────────────────────────────────

const OVERFLOW_DD: ToolDropdown = {
  key: "overflow", label: "Overflow",
  useTwoLineButtons: false,
  options: [
    { value: "never", label: "Never" },
    { value: "mixed", label: "Mixed" },
    { value: "exclusive", label: "Exclusive" },
  ],
  defaultValue: "never",
};

// Share of shift questions that lose a 1 off the end when "Bits lost" is Mixed.
const MIXED_LOST_RATE = 0.3;

const LOST_BITS_DD: ToolDropdown = {
  key: "lostBits", label: "Bits lost",
  useTwoLineButtons: false,
  options: [
    { value: "never", label: "Never" },
    { value: "mixed", label: "Mixed" },
    { value: "exclusive", label: "Exclusive" },
  ],
  defaultValue: "never",
};

// Direction is variety, not difficulty — peers, no weight.
const DIRECTION_MS: ToolMultiSelect = {
  key: "direction", label: "Direction",
  options: [
    { value: "left", label: "Left", defaultActive: true },
    { value: "right", label: "Right", defaultActive: true },
  ],
};

// Notation is variety, not difficulty — peers, no weight. Which base the
// question's two operands are written in — the shift itself (and its
// ×2ⁿ/÷2ⁿ reading) is identical either way.
const NOTATION_MS: ToolMultiSelect = {
  key: "notation", label: "Notation",
  options: [
    { value: "binary", label: "Binary", defaultActive: true },
    { value: "denary", label: "Denary", defaultActive: true },
  ],
};

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Binary Operations",
  tools: {
    binaryAddition: {
      name: "Binary Addition",
      instruction: "Add:",
      variables: [],
      dropdown: OVERFLOW_DD,
      difficultySettings: null,
    },
    binaryShifts: {
      name: "Binary Shifts",
      instruction: "Calculate:",
      variables: [],
      dropdown: LOST_BITS_DD,
      multiSelect: [DIRECTION_MS, NOTATION_MS],
      difficultySettings: null,
      // Two rungs only: do the shift; then do it AND state the denary effect.
      levels: ["level1", "level2"],
    },
  },
};

// ── 3. INFO_SECTIONS ──────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  {
    title: "Binary Addition", icon: "➕",
    content: [
      { label: "Overview", detail: "Add two or three 8-bit binary integers using the standard column method — 0+0=0, 0+1=1, 1+1=0 carry 1, 1+1+1=1 carry 1 — then check whether the true sum still fits in the 8-bit register, following the OCR J277 1.2 approach to binary addition and overflow." },
      { label: "Level 1 — Green", detail: "Two 8-bit numbers with at least one carry, but the carry is never compounded — no column ever has to add two 1s plus an incoming carry (no '1+1+1' column)." },
      { label: "Level 2 — Yellow", detail: "Two 8-bit numbers that always include a genuine '1+1+1=1 carry 1' column — a carry landing on a column where both digits are already 1." },
      { label: "Level 3 — Red", detail: "Three 8-bit numbers, added in sequence: the first two, then the third added to that result — extending the same column method with a guaranteed '1+1+1' column somewhere in the working." },
      { label: "Overflow", detail: "The register only holds 8 bits (0–255). When the true sum is greater than 255, the carry out of the leftmost (most significant) bit has nowhere to go — the 9th bit is lost, and the register stores the wrong 8-bit value. This is an overflow error." },
    ],
  },
  {
    title: "Binary Shifts", icon: "↔️",
    content: [
      { label: "Overview", detail: "Shift an 8-bit binary number left or right by 1–3 places, phrased as the multiplication or division it performs rather than as 'n places' — e.g. 00001101₂ × 1000₂ for a left shift of 3. Every bit moves along; the gaps are filled with 0s, and bits pushed past either end of the register are lost. A left shift of n places multiplies by 2ⁿ; a right shift divides by 2ⁿ." },
      { label: "Level 1 — Green", detail: "Perform the shift and give the 8-bit result." },
      { label: "Level 2 — Yellow", detail: "Perform the shift, then state the effect on the denary value — the value before and after, and the ×2ⁿ or ÷2ⁿ it corresponds to." },
      { label: "Overflow / underflow", detail: "If a 1 is shifted off the left end, the true answer no longer fits in 8 bits — an overflow, so the stored result is not ×2ⁿ. If a 1 is shifted off the right end, the fractional part is lost — an underflow (loss of precision), so the stored result is rounded down." },
    ],
  },
  {
    title: "Question Options", icon: "⚙️",
    content: [
      { label: "Overflow (Addition)", detail: "Never — no question overflows. Mixed — about 1 in 5 do. Exclusive — every question overflows. Starts on Never." },
      { label: "Bits lost (Shifts)", detail: "Never — only 0s are shifted out, so the result is exact. Mixed — about 3 in 10 questions shift a 1 out (overflow or underflow). Exclusive — every question does. Starts on Never." },
      { label: "Direction (Shifts)", detail: "Left shifts, right shifts, or both mixed." },
      { label: "Notation (Shifts)", detail: "Binary — both numbers shown in binary, e.g. 00001101₂ × 1000₂. Denary — shown in denary instead, e.g. 13₁₀ × 8₁₀, asking for the binary working. Leave both on to mix." },
    ],
  },
  {
    title: "Modes", icon: "🖥️",
    content: [
      { label: "Whiteboard", detail: "Single large question for whole-class discussion." },
      { label: "Worked Example", detail: "Full column-by-column working with carries shown, plus the overflow check." },
      { label: "Worksheet", detail: "Grid of questions with PDF export." },
    ],
  },
];

// ── 4. Binary column-addition engine ──────────────────────────────────────────

const toBits = (n: number, width: number): number[] =>
  n.toString(2).padStart(width, "0").split("").map(Number);

const bitsToStr = (bits: number[]): string => bits.join("");

interface ColumnAddition {
  xBits: number[];
  yBits: number[];
  resultBits: number[];
  carryIn: number[];  // carry flowing INTO each column (same MSB→LSB indexing as xBits/yBits)
  finalCarry: number; // carry out of the leftmost column
}

// Adds x and y as width-bit numbers, column by column from the right, tracking
// every carry-in so the working can show exactly where each carry lands.
const addColumns = (x: number, y: number, width: number): ColumnAddition => {
  const xBits = toBits(x, width);
  const yBits = toBits(y, width);
  const resultBits = new Array(width).fill(0);
  const carryIn = new Array(width).fill(0);
  let carry = 0;
  for (let i = width - 1; i >= 0; i--) {
    carryIn[i] = carry;
    const total = xBits[i] + yBits[i] + carry;
    resultBits[i] = total % 2;
    carry = total >= 2 ? 1 : 0;
  }
  return { xBits, yBits, resultBits, carryIn, finalCarry: carry };
};

// ── Column addition on the place value table ─────────────────────────────────
// One snapshot per column, right to left. Column index 0 = leftmost (128), 7 = rightmost (1). A carry produced by
// column c lands above column c−1, so after column c is written the carries above columns ≥ c−1 are on show.

const BIN8 = pvBaseColumnSet(2, BIT_WIDTH);

const addTable = (add: ColumnAddition, firstDone: number, highlightCol?: number, banner?: string): PlaceValueTableData => {
  const xRow: PVRow = {
    kind: "cells",
    cells: add.xBits.map((b, i): PVCell => ({ v: String(b), above: add.carryIn[i] === 1 && i >= firstDone - 1 ? "1" : undefined })),
  };
  const yRow: PVRow = { kind: "cells", label: "+", cells: add.yBits.map((b) => String(b)) };
  const resRow: PVRow = {
    kind: "cells", rule: true, label: "=",
    cells: add.resultBits.map((b, i): PVCell => (i >= firstDone ? { v: String(b), tone: firstDone === 0 ? "answer" : undefined } : { v: "" })),
  };
  const rows: PVRow[] = [xRow, yRow, resRow];
  if (banner) rows.push({ kind: "banner", text: banner });
  return { ...BIN8, showPoint: false, groupEvery: 4, cellHeight: 56, colWidth: 64, highlightCol, rows };
};

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** The steps for one column addition: write the numbers, then one step per column (the all-zero run on the left in one). */
const additionSteps = (add: ColumnAddition, intro: string): WorkingStep[] => {
  const steps: WorkingStep[] = [pvStep(intro, addTable(add, BIT_WIDTH))];
  for (let c = BIT_WIDTH - 1; c >= 0; c--) {
    const trivialFromHere = add.xBits.every((_, i) => i > c || add.xBits[i] + add.yBits[i] + add.carryIn[i] === 0);
    if (trivialFromHere) {
      steps.push(pvStep(`The remaining column${c === 0 ? " is" : "s are"} 0 + 0 = 0, with nothing to carry.`, addTable(add, 0)));
      break;
    }
    const x = add.xBits[c];
    const y = add.yBits[c];
    const cin = add.carryIn[c];
    const total = x + y + cin;
    const sum = `${x} + ${y}${cin ? " + 1 (carry)" : ""} = ${total}`;
    const how = total < 2
      ? `, so write ${total}.`
      : `, which is ${total.toString(2)} in binary: write the ${total % 2} and carry the 1${c === 0 ? " — but there is no column to the left" : " to the next column"}.`;
    steps.push(pvStep(`${cap(columnName(2, BIT_WIDTH - 1 - c))} column: ${sum}${how}`, addTable(add, c, c)));
  }
  return steps;
};

/** The register check: the finished table, with a banner when the carry out of the leftmost column is lost. */
const checkStep = (add: ColumnAddition, trueSum: number): WorkingStep => {
  const overflow = trueSum > 255;
  return pvStep(
    overflow
      ? `Check the 8-bit register can hold the true sum: ${trueSum} > 255. The carry out of the leftmost column has nowhere to go — it is lost, so the stored answer is wrong (overflow error).`
      : `Check the 8-bit register can hold the true sum: ${trueSum} ≤ 255. It fits, so the answer is correct.`,
    addTable(add, 0, undefined, overflow ? "Carry of 1 lost — overflow" : undefined),
  );
};

// Renders the plain (un-worked) stack of addends for the question display —
// each number right-aligned under a "+", with a rule for the student to work below.
const questionArrayLatex = (rows: string[]): string => {
  const lines = rows.map((r, i) => (i === 0 ? r : `+\\,${r}`));
  return ["\\begin{array}{r}", ...lines.map((l) => `${l} \\\\`), "\\hline", "\\end{array}"].join(" ");
};

// ── 5. Generating addend pairs with a guaranteed carry profile ───────────────
//
// Builds an 8-bit pair column by column, LSB to MSB, so the requested carry
// behaviour is guaranteed by construction rather than hoped for by retrying:
//   - allowDoubleCarry=false excludes the "1+1" choice whenever a carry is
//     already incoming, so no column can ever need 1+1+1.
//   - requireCarry / requireDoubleCarry / targetOverflow are then checked
//     against the actual draw, and the whole pair is redrawn if they don't
//     hold — this keeps "Level 1 always carries, never double-carries" and
//     "Level 2 always double-carries" guaranteed, not just likely.
const genPair = (
  allowDoubleCarry: boolean,
  requireCarry: boolean,
  requireDoubleCarry: boolean,
  targetOverflow: boolean,
): { x: number; y: number } => {
  for (let attempt = 0; attempt < 1000; attempt++) {
    let carry = 0;
    let sawCarry = false;
    let sawDoubleCarry = false;
    const xBits: number[] = [];
    const yBits: number[] = [];
    for (let i = 0; i < BIT_WIDTH; i++) {
      const options: [number, number][] =
        carry === 1 && !allowDoubleCarry
          ? [[0, 0], [0, 1], [1, 0]]
          : [[0, 0], [0, 1], [1, 0], [1, 1]];
      const [a, b] = pick(options);
      if (a === 1 && b === 1 && carry === 1) sawDoubleCarry = true;
      const total = a + b + carry;
      if (total >= 2) sawCarry = true;
      xBits.push(a);
      yBits.push(b);
      carry = total >= 2 ? 1 : 0;
    }
    if (requireCarry && !sawCarry) continue;
    if (requireDoubleCarry && !sawDoubleCarry) continue;
    if (carry !== (targetOverflow ? 1 : 0)) continue;
    const x = parseInt(xBits.slice().reverse().join(""), 2);
    const y = parseInt(yBits.slice().reverse().join(""), 2);
    return { x, y };
  }
  // Deterministic fallback pairs, each hand-verified to satisfy every combination.
  if (allowDoubleCarry) return targetOverflow ? { x: 255, y: 255 } : { x: 3, y: 3 };
  return targetOverflow ? { x: 128, y: 128 } : { x: 1, y: 1 };
};

const genLevel1Pair = (targetOverflow: boolean) => genPair(false, true, false, targetOverflow);
const genLevel2Pair = (targetOverflow: boolean) => genPair(true, true, true, targetOverflow);

// ── 6. Question builders ──────────────────────────────────────────────────────
//
// Both builders take the overflow decision already made (once, per question)
// by generateQuestion from the Overflow dropdown — a plain boolean, the same
// in every mode (Whiteboard/Worked Example draw it live per question,
// Worksheet mode calls generateQuestion once per slot with the same
// dropdownValue, so "Mixed" lands at MIXED_OVERFLOW_RATE across a sheet too).

const overflowNote = "(overflow — the true sum needs more than 8 bits and cannot be stored correctly)";

const buildTwoNumberQuestion = (level: DifficultyLevel, wantOverflow: boolean): AnyQuestion => {
  const id = randInt(0, 999999);
  const { x: a, y: b } = level === "level1" ? genLevel1Pair(wantOverflow) : genLevel2Pair(wantOverflow);
  const add = addColumns(a, b, BIT_WIDTH);
  const trueSum = a + b;
  const overflow = trueSum > 255;
  const storedStr = bitsToStr(toBits(trueSum & 0xff, BIT_WIDTH));
  const aStr = bitsToStr(toBits(a, BIT_WIDTH));
  const bStr = bitsToStr(toBits(b, BIT_WIDTH));

  const working: WorkingStep[] = [
    ...additionSteps(add, "Write the numbers in the table, lined up by place value. Add each column from right to left, carrying whenever a column totals 2 or more."),
    checkStep(add, trueSum),
  ];

  return {
    kind: "simple",
    display: `${aStr} + ${bStr}`,
    displayLatex: questionArrayLatex([aStr, bStr]),
    answer: storedStr,
    answerLatex: storedStr,
    answerSuffix: overflow ? overflowNote : undefined,
    working,
    key: `binary-addition-${level}-${a}-${b}-${id}`,
    difficulty: level,
    _difficultyScore: wantOverflow ? 2 : 1,
  } as unknown as AnyQuestion;
};

const buildThreeNumberQuestion = (level: DifficultyLevel, wantOverflow: boolean): AnyQuestion => {
  const id = randInt(0, 999999);
  // Guarantees a genuine double-carry column in the first addition (so Level 3
  // always exceeds Level 2's requirement), but never lets that first addition
  // overflow on its own — overflow of the FINAL three-number sum is then
  // targeted explicitly via the third number, exactly as for Levels 1/2,
  // rather than left as an incidental (and much likelier) side effect of
  // summing three random 8-bit numbers.
  const { x: a, y: b } = genPair(true, true, true, false);
  const ab = a + b;
  const c = wantOverflow
    ? randInt(Math.max(0, 256 - ab), 255)
    : randInt(0, Math.max(0, 255 - ab));

  const step1 = addColumns(a, b, BIT_WIDTH);
  const p = a + b;
  const step2Width = Math.max(BIT_WIDTH, p.toString(2).length, c.toString(2).length);
  const step2 = addColumns(p, c, step2Width);

  const trueSum = a + b + c;
  const overflow = trueSum > 255;
  const storedStr = bitsToStr(toBits(trueSum & 0xff, BIT_WIDTH));
  const aStr = bitsToStr(toBits(a, BIT_WIDTH));
  const bStr = bitsToStr(toBits(b, BIT_WIDTH));
  const cStr = bitsToStr(toBits(c, BIT_WIDTH));

  const working: WorkingStep[] = [
    ...additionSteps(step1, "Step 1 — add the first two numbers. Write them in the table, lined up by place value."),
    ...additionSteps(step2, "Step 2 — add the third number to that result."),
    checkStep(step2, trueSum),
  ];

  return {
    kind: "simple",
    display: `${aStr} + ${bStr} + ${cStr}`,
    displayLatex: questionArrayLatex([aStr, bStr, cStr]),
    answer: storedStr,
    answerLatex: storedStr,
    answerSuffix: overflow ? overflowNote : undefined,
    working,
    key: `binary-addition-level3-${a}-${b}-${c}-${id}`,
    difficulty: level,
    _difficultyScore: wantOverflow ? 2 : 1,
  } as unknown as AnyQuestion;
};

// ── 7. Binary shifts ──────────────────────────────────────────────────────────

// Base subscripts (shifts only — binary addition's 8-bit strings are never
// set alongside a denary value in the same expression, so it keeps its plain
// notation): binary always _2, denary always _10, so the same digits (e.g.
// "10") can't be misread as the wrong base.
const binLatex = (b: string): string => `${b}_{2}`;
const denLatex = (n: number | string): string => `${n}_{10}`;

// ── Shifts on the place value table ──────────────────────────────────────────
// The register is the 8 columns 128 … 1; `places` spare columns sit outside it on the side the bits leave from.
// Row 1 is the number as written, row 2 the shifted result: vacated cells are blue placeholder zeros, and the bits
// pushed out of the register appear in red in the spare columns (and are marked red in row 1 once the shift is shown).

const shiftTable = (
  dir: "left" | "right", places: number, vBits: number[], rBits: number[],
  opts: { shifted: boolean; litOriginal?: boolean; litResult?: boolean },
): PlaceValueTableData => {
  const left = dir === "left" ? places : 0;
  const right = dir === "right" ? places : 0;
  const blanks = (n: number) => Array(n).fill("");
  const columns = [...blanks(left), ...BIN8.columns, ...blanks(right)];
  const columnNames = [...blanks(left), ...BIN8.columnNames, ...blanks(right)];
  const lostIdx = (i: number) => (dir === "left" ? i < places : i >= BIT_WIDTH - places);

  const orig: (PVCell | string)[] = [
    ...blanks(left),
    ...vBits.map((b, i): PVCell => ({ v: String(b), tone: opts.shifted && lostIdx(i) ? "lost" : opts.litOriginal && b === 1 ? "highlight" : undefined })),
    ...blanks(right),
  ];
  const rows: PVRow[] = [{ kind: "cells", cells: orig }];
  if (opts.shifted) {
    const lostBits = dir === "left" ? vBits.slice(0, places) : vBits.slice(BIT_WIDTH - places);
    const lostCells = lostBits.map((b): PVCell => ({ v: String(b), tone: "lost" }));
    const inside = rBits.map((b, i): PVCell => ({ v: String(b), tone: lostIdxVacated(dir, places, i) ? "zero" : opts.litResult && b === 1 ? "highlight" : undefined }));
    rows.push({ kind: "cells", label: "→", cells: [...(dir === "left" ? lostCells : []), ...inside, ...(dir === "right" ? lostCells : [])] });
  }
  return { columns, columnNames, onesIndex: left + BIT_WIDTH - 1, showPoint: false, cellHeight: 56, colWidth: 64, rows };
};

/** Cells the shift vacated (filled with 0s): the right-hand end after a left shift, the left-hand end after a right shift. */
const lostIdxVacated = (dir: "left" | "right", places: number, i: number): boolean =>
  dir === "left" ? i >= BIT_WIDTH - places : i < places;

// Draws an 8-bit value whose shift does (or doesn't) push a 1 out of the
// register — guaranteed by rejection, never just made likely.
const PLACE_VALUES = Array.from({ length: BIT_WIDTH }, (_, i) => 2 ** (BIT_WIDTH - 1 - i));

const genShiftValue = (dir: "left" | "right", places: number, wantLost: boolean): number => {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const v = randInt(1, 255);
    const ones = v.toString(2).split("").filter(b => b === "1").length;
    if (ones < 2) continue; // too trivial to be worth shifting
    const lostMask = dir === "left" ? (0xff << (BIT_WIDTH - places)) & 0xff : (1 << places) - 1;
    const lost = (v & lostMask) !== 0;
    if (lost !== wantLost) continue;
    const result = dir === "left" ? (v << places) & 0xff : v >> places;
    if (result === 0) continue; // everything shifted away — degenerate
    return v;
  }
  return dir === "left" ? (wantLost ? 0b11000011 : 0b00000110) : (wantLost ? 0b00000111 : 0b01100000);
};

const buildShiftQuestion = (
  level: DifficultyLevel,
  dir: "left" | "right",
  places: number,
  wantLost: boolean,
  notation: "binary" | "denary",
): AnyQuestion => {
  const id = randInt(0, 999999);
  const v = genShiftValue(dir, places, wantLost);
  const result = dir === "left" ? (v << places) & 0xff : v >> places;
  const factor = 2 ** places;
  const vStr = bitsToStr(toBits(v, BIT_WIDTH));
  const rStr = bitsToStr(toBits(result, BIT_WIDTH));
  const lostStr = dir === "left" ? vStr.slice(0, places) : vStr.slice(BIT_WIDTH - places);
  const lost = lostStr.includes("1");
  const placeWord = places === 1 ? "place" : "places";

  const zeros = "0".repeat(places);
  const vBits = toBits(v, BIT_WIDTH);
  const rBits = toBits(result, BIT_WIDTH);
  const sumOf = (n: number): string => {
    const parts = PLACE_VALUES.filter((pv) => (n & pv) !== 0);
    return parts.length > 1 ? `${parts.join(" + ")} = ${n}` : `${n}`;
  };

  // The question is phrased as the multiplication/division a shift performs
  // — ×2ⁿ / ÷2ⁿ — never as "n places". "binary" notation shows both operands
  // in binary (e.g. 00001101 × 1000); "denary" shows them in denary (13 × 8)
  // and asks for the binary working instead.
  const opSym = dir === "left" ? "\\times" : "\\div";
  const factorBinStr = factor.toString(2);
  const questionLatex = notation === "denary"
    ? `${denLatex(v)} ${opSym} ${denLatex(factor)}`
    : `${binLatex(vStr)} ${opSym} ${binLatex(factorBinStr)}`;

  const working: WorkingStep[] = [
    pvStep("Write the number in the 8-bit register.", shiftTable(dir, places, vBits, rBits, { shifted: false })),
    pvStep(
      dir === "left"
        ? `Move every bit ${places} ${placeWord} left and fill the ${places === 1 ? "gap" : "gaps"} on the right with ${zeros.length === 1 ? "a 0" : "0s"} — bits pushed off the left end (red) are lost.`
        : `Move every bit ${places} ${placeWord} right and fill the ${places === 1 ? "gap" : "gaps"} on the left with ${zeros.length === 1 ? "a 0" : "0s"} — bits pushed off the right end (red) are lost.`,
      shiftTable(dir, places, vBits, rBits, { shifted: true }),
    ),
  ];

  let suffix: string | undefined;
  if (level === "level2") {
    const trueVal = dir === "left" ? v * factor : v / factor;
    const both = (o: { litOriginal?: boolean; litResult?: boolean }) => shiftTable(dir, places, vBits, rBits, { shifted: true, ...o });
    working.push(
      pvStep(`Convert the original number to denary: ${sumOf(v)}.`, both({ litOriginal: true })),
      pvStep(`Convert the result to denary: ${sumOf(result)}.`, both({ litResult: true })),
    );
    if (!lost) {
      working.push(pvStep(`A ${dir} shift of ${places} ${placeWord} ${dir === "left" ? "multiplies" : "divides"} by ${factor}: ${v} ${dir === "left" ? "×" : "÷"} ${factor} = ${result}.`, both({})));
      suffix = `(${v} → ${result}, ${dir === "left" ? "×" : "÷"} ${factor})`;
    } else if (dir === "left") {
      working.push(pvStep(`The true answer needs more than 8 bits: ${v} × ${factor} = ${trueVal}, which is more than 255. The 1s shifted out of the left end are lost — overflow.`, both({})));
      suffix = `(${v} → ${result} — overflow: should be ×${factor} = ${trueVal})`;
    } else {
      working.push(pvStep(`The true answer is not a whole number, so the fraction is lost: ${v} ÷ ${factor} = ${trueVal}, which becomes ${result}. The 1s shifted out of the right end are lost — underflow.`, both({})));
      suffix = `(${v} → ${result} — underflow: ÷${factor} = ${trueVal}, rounded down)`;
    }
  } else if (lost) {
    suffix = dir === "left" ? "(overflow — a 1 was shifted out of the register)" : "(underflow — a 1 was shifted out of the register)";
  }

  const lines = [notation === "denary" ? `Show $${questionLatex}$ through a binary shift.` : `$${questionLatex}$`];
  if (level === "level2") lines.push("State the effect on its denary value.");

  return {
    kind: "worded",
    lines,
    answer: rStr,
    answerLatex: binLatex(rStr),
    answerSuffix: suffix,
    working,
    key: `binary-shift-${level}-${dir}-${places}-${notation}-${v}-${id}`,
    difficulty: level,
    _difficultyScore: lost ? 2 : 1,
  } as unknown as AnyQuestion;
};

const wantFromDropdown = (dropdownValue: string, mixedRate: number): boolean =>
  dropdownValue === "exclusive" ? true :
  dropdownValue === "mixed" ? Math.random() < mixedRate :
  false; // "never" (and any unrecognised value) — the safe default

// ── 8. generateQuestion ───────────────────────────────────────────────────────

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  _variables: Record<string, boolean>,
  dropdownValue: string,
  multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  if (tool === "binaryShifts") {
    const dir = pickActive(multiSelectValues, DIRECTION_MS.options) as "left" | "right";
    const notation = pickActive(multiSelectValues, NOTATION_MS.options) as "binary" | "denary";
    return buildShiftQuestion(level, dir, randInt(1, 3), wantFromDropdown(dropdownValue, MIXED_LOST_RATE), notation);
  }
  const wantOverflow =
    dropdownValue === "exclusive" ? true :
    dropdownValue === "mixed" ? Math.random() < MIXED_OVERFLOW_RATE :
    false; // "never" (and any unrecognised value) — the safe default
  if (level === "level3") return buildThreeNumberQuestion(level, wantOverflow);
  return buildTwoNumberQuestion(level, wantOverflow);
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
      stepRenderer={placeValueStepRenderer}
      stepVisualRenderer={placeValueStepVisual}
      defaults={{ numQuestions: 8, numColumns: 2, maxColumns: 3 }}
    />
  );
}
