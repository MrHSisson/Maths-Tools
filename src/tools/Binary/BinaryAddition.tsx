import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type SimpleQuestion, type WorkingStep,
  mStep, randInt, pick,
} from "../../shared";

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. Constants ──────────────────────────────────────────────────────────────

const BIT_WIDTH = 8; // OCR J277 works with 8-bit registers throughout

// ── 2. TOOL_CONFIG ────────────────────────────────────────────────────────────

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Binary Addition",
  tools: {
    binaryAddition: {
      name: "Binary Addition",
      instruction: "Add these 8-bit binary numbers. Give your 8-bit answer, and state if an overflow error occurs.",
      variables: [],
      dropdown: null,
      difficultySettings: null,
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
      { label: "Overflow", detail: "The register only holds 8 bits (0–255). When the true sum is greater than 255, the carry out of the leftmost (most significant) bit has nowhere to go — the 9th bit is lost, and the register stores the wrong 8-bit value. This is an overflow error, and every level can produce one." },
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

// Renders a full worked column-addition table: a carry row (blank where no
// carry lands), the two addends, a rule, and the result — with the carry out
// of the leftmost column shown as an extra digit spilling past the register.
const columnTableLatex = (add: ColumnAddition): string => {
  const carryRow = add.carryIn.map((c) => (c ? "1" : "\\phantom{0}")).join("");
  const resultRow = (add.finalCarry ? "1" : "") + bitsToStr(add.resultBits);
  return [
    "\\begin{array}{r}",
    `${carryRow} \\\\`,
    `${bitsToStr(add.xBits)} \\\\`,
    `+\\,${bitsToStr(add.yBits)} \\\\`,
    "\\hline",
    `${resultRow}`,
    "\\end{array}",
  ].join(" ");
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

const genLevel1Pair = () => genPair(false, true, false, Math.random() < 0.35);
const genLevel2Pair = () => genPair(true, true, true, Math.random() < 0.35);

// ── 6. Question builders ──────────────────────────────────────────────────────

const overflowNote = "(overflow — the true sum needs more than 8 bits and cannot be stored correctly)";

const buildTwoNumberQuestion = (level: DifficultyLevel): SimpleQuestion => {
  const id = randInt(0, 999999);
  const { x: a, y: b } = level === "level1" ? genLevel1Pair() : genLevel2Pair();
  const add = addColumns(a, b, BIT_WIDTH);
  const trueSum = a + b;
  const overflow = trueSum > 255;
  const storedStr = bitsToStr(toBits(trueSum & 0xff, BIT_WIDTH));
  const aStr = bitsToStr(toBits(a, BIT_WIDTH));
  const bStr = bitsToStr(toBits(b, BIT_WIDTH));

  const working: WorkingStep[] = [
    mStep("Add each column from right to left, carrying whenever a column totals 2 or more:", columnTableLatex(add)),
    mStep("Check the 8-bit register can hold the true sum:", `${trueSum} ${overflow ? ">" : "\\le"} 255`),
    mStep("Answer:", storedStr, overflow ? "— OVERFLOW ERROR" : undefined),
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
  };
};

const buildThreeNumberQuestion = (level: DifficultyLevel): SimpleQuestion => {
  const id = randInt(0, 999999);
  // Guarantees a genuine double-carry column in the first addition, so Level 3
  // always exceeds Level 2's requirement; the third number is drawn freely.
  const { x: a, y: b } = genLevel2Pair();
  const c = randInt(0, 255);

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
    mStep("Step 1 — add the first two numbers:", columnTableLatex(step1)),
    mStep("Step 2 — add the third number to that result:", columnTableLatex(step2)),
    mStep("Check the 8-bit register can hold the true sum:", `${trueSum} ${overflow ? ">" : "\\le"} 255`),
    mStep("Answer:", storedStr, overflow ? "— OVERFLOW ERROR" : undefined),
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
  };
};

// ── 7. generateQuestion ───────────────────────────────────────────────────────

const generateQuestion = (
  _tool: string,
  level: DifficultyLevel,
  _variables: Record<string, boolean>,
  _dropdownValue: string,
): AnyQuestion => {
  if (level === "level3") return buildThreeNumberQuestion(level);
  return buildTwoNumberQuestion(level);
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
      defaults={{ numQuestions: 8, numColumns: 2, maxColumns: 3 }}
    />
  );
}
