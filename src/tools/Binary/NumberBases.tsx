import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type WorkingStep,
  type ToolMultiSelect, type PlaceValueTableData, type PVCell,
  randInt, pickActive,
  pvStep, pvBaseColumnSet, placeValueStepRenderer, placeValueStepVisual,
} from "../../shared";

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════
//
// OCR J277 1.2.4 — converting between denary, binary and hexadecimal. The spec
// stops at 8 bits / 2 hex digits, so every sub-tool has exactly two levels
// (ToolEntry.levels): Level 1 is one nibble (0–15, one hex digit), Level 2 a
// full byte (16–255, two hex digits). Each sub-tool covers BOTH directions of
// its pair; direction is a per-question "Direction" pool, so a sheet can mix.
//
// Worked-example working is the shared place value table (pvStep snapshots, base-aware columns:
// 128 … 1 for binary, 16 and 1 for hex), so one table updates in place beside short captions.

// ── 1. Types & constants ──────────────────────────────────────────────────────

type ToolType = "denBin" | "denHex" | "binHex";
type Direction =
  | "denToBin" | "binToDen"
  | "denToHex" | "hexToDen"
  | "binToHex" | "hexToBin";

const directionPool = (a: [Direction, string], b: [Direction, string]): ToolMultiSelect => ({
  key: "direction", label: "Direction",
  options: [
    { value: a[0], label: a[1], defaultActive: true },
    { value: b[0], label: b[1], defaultActive: true },
  ],
});

const DEN_BIN_MS = directionPool(["denToBin", "Denary → Binary"], ["binToDen", "Binary → Denary"]);
const DEN_HEX_MS = directionPool(["denToHex", "Denary → Hex"], ["hexToDen", "Hex → Denary"]);
const BIN_HEX_MS = directionPool(["binToHex", "Binary → Hex"], ["hexToBin", "Hex → Binary"]);

const TWO_LEVELS: DifficultyLevel[] = ["level1", "level2"];

// ── 2. TOOL_CONFIG ────────────────────────────────────────────────────────────

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Number Bases",
  tools: {
    denBin: {
      name: "Denary ↔ Binary",
      variables: [], dropdown: null, multiSelect: DEN_BIN_MS, difficultySettings: null,
      levels: TWO_LEVELS,
    },
    denHex: {
      name: "Denary ↔ Hex",
      variables: [], dropdown: null, multiSelect: DEN_HEX_MS, difficultySettings: null,
      levels: TWO_LEVELS,
    },
    binHex: {
      name: "Binary ↔ Hex",
      variables: [], dropdown: null, multiSelect: BIN_HEX_MS, difficultySettings: null,
      levels: TWO_LEVELS,
    },
  },
};

// ── 3. INFO_SECTIONS ──────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  {
    title: "Number Bases", icon: "🔢",
    content: [
      { label: "Overview", detail: "Convert positive whole numbers between denary (base 10), binary (base 2) and hexadecimal (base 16), up to 8 bits / 2 hex digits (0–255) as in OCR J277 1.2.4." },
      { label: "Level 1 — Green", detail: "One nibble: 4-bit binary, denary 0–15, a single hex digit." },
      { label: "Level 2 — Yellow", detail: "A full byte: 8-bit binary, denary 16–255, two hex digits." },
      { label: "Base subscripts", detail: "Every value is written with a subscript showing its base — 1101₂ binary, 13₁₀ denary, D₁₆ hex — so the same digits (like '10') are never misread as the wrong base." },
    ],
  },
  {
    title: "Methods", icon: "🧮",
    content: [
      { label: "Denary → Binary", detail: "Work along the place values from the left (128, 64, … 1). If the place value fits into what is left, write 1 and subtract it; otherwise write 0." },
      { label: "Binary → Denary", detail: "Write the bits under the place values and add up every place value with a 1 under it." },
      { label: "Denary → Hex", detail: "Divide by 16: the whole-number part is the first digit and the remainder the second. Write 10–15 as A–F." },
      { label: "Hex → Denary", detail: "Multiply the first digit by 16 and add the second." },
      { label: "Binary ↔ Hex", detail: "Split the byte into two nibbles (4 bits). Each nibble is exactly one hex digit, found with the 8 4 2 1 place values." },
    ],
  },
  {
    title: "Question Options", icon: "⚙️",
    content: [
      { label: "Direction", detail: "Each tab converts both ways. Choose one direction, or leave both on to mix them." },
    ],
  },
  {
    title: "Modes", icon: "🖥️",
    content: [
      { label: "Whiteboard", detail: "Single large question for whole-class discussion." },
      { label: "Worked Example", detail: "Step-by-step working using the place-value method." },
      { label: "Worksheet", detail: "Grid of questions with PDF export." },
    ],
  },
];

// ── 4. Conversion helpers ─────────────────────────────────────────────────────

const toBits = (n: number, width: number): number[] =>
  n.toString(2).padStart(width, "0").split("").map(Number);

const hexDigit = (n: number): string => n.toString(16).toUpperCase();
const toHex = (n: number): string => n.toString(16).toUpperCase();
// Base subscripts throughout — so the same digits (e.g. "10") can never be
// misread as the wrong base: binary always _2, denary always _10, hex
// always _16 (kept upright inside \mathrm{} so "AD" isn't read as A×D).
const hexLatex = (h: string): string => `\\mathrm{${h}}_{16}`;
const binLatex = (b: string): string => `${b}_{2}`;
const denLatex = (n: number | string): string => `${n}_{10}`;

const placeValues = (width: number): number[] =>
  Array.from({ length: width }, (_, i) => 2 ** (width - 1 - i));

// Level 1 = one nibble (0–15), Level 2 = a byte beyond one nibble (16–255) —
// disjoint ranges, so Level 2 is always genuinely two hex digits / 8 bits.
const drawValue = (level: DifficultyLevel): number =>
  level === "level1" ? randInt(1, 15) : randInt(16, 255);

// ── 5. Place value tables for the working ─────────────────────────────────────

type Cols = ReturnType<typeof pvBaseColumnSet>;
const BIN: Record<number, Cols> = { 4: pvBaseColumnSet(2, 4), 8: pvBaseColumnSet(2, 8) };
const HEX: Record<number, Cols> = { 1: pvBaseColumnSet(16, 1), 2: pvBaseColumnSet(16, 2) };

const table = (cols: Cols, cells: (PVCell | string)[], groupEvery?: number): PlaceValueTableData => ({
  ...cols, showPoint: false, groupEvery, cellHeight: 64, colWidth: 64, rows: [{ kind: "cells", cells }],
});

/** Binary digits as cells; the 1s are tinted when `lit` (the ones being added up). */
const bitCells = (bits: number[], lit = false): PVCell[] => bits.map((b) => ({ v: String(b), tone: lit && b === 1 ? "highlight" : undefined }));
const blank = (n: number): string[] => Array(n).fill("");

const sub = { 2: "₂", 10: "₁₀", 16: "₁₆" } as const;
const bin = (b: string) => `${b}${sub[2]}`;
const den = (n: number | string) => `${n}${sub[10]}`;
const hexS = (h: string) => `${h}${sub[16]}`;

// ── 6. Working-step builders ──────────────────────────────────────────────────

const denToBinSteps = (n: number, width: number): WorkingStep[] => {
  const cols = BIN[width];
  const pvs = placeValues(width);
  const cells: PVCell[] = blank(width).map((v) => ({ v }));
  const steps: WorkingStep[] = [pvStep("Write out the place values.", table(cols, cells.map((c) => ({ ...c }))))];
  let rem = n;
  pvs.forEach((pv, i) => {
    if (rem === 0 || pv > rem) return;
    cells.forEach((c) => { if (c.tone === "highlight") c.tone = undefined; });
    cells[i] = { v: "1", tone: "highlight" };
    steps.push(pvStep(`${pv} fits into ${rem}, so write a 1 under ${pv}. ${rem} − ${pv} = ${rem - pv}.`, table(cols, cells.map((c) => ({ ...c })))));
    rem -= pv;
  });
  const done = cells.map((c) => (c.v === "1" ? { v: "1" } : { v: "0", tone: "zero" as const }));
  steps.push(pvStep(n === 2 ** width - 1 ? "Every place value was used." : "Write 0 under every other place value.", table(cols, done)));
  return steps;
};

const binToDenSteps = (n: number, width: number): WorkingStep[] => {
  const cols = BIN[width];
  const bits = toBits(n, width);
  const used = placeValues(width).filter((pv) => (n & pv) !== 0);
  return [
    pvStep("Write the bits under the place values.", table(cols, bitCells(bits))),
    pvStep(used.length > 1 ? `Add the place values that have a 1: ${used.join(" + ")} = ${n}.` : `Only ${used[0]} has a 1, so the value is ${n}.`, table(cols, bitCells(bits, true))),
  ];
};

const denToHexSteps = (n: number): WorkingStep[] => {
  if (n < 16) return [pvStep(`Hex digits run 0–9, then A = 10 up to F = 15. So ${den(n)} is ${hexS(hexDigit(n))}.`, table(HEX[1], [{ v: hexDigit(n), tone: "answer" }]))];
  const hi = Math.floor(n / 16);
  const lo = n % 16;
  return [
    pvStep(`Find how many 16s fit, and what is left over: ${n} = ${hi} × 16 + ${lo}.`, table(HEX[2], [String(hi), String(lo)])),
    pvStep("Write each part as a hex digit (A = 10 … F = 15).", table(HEX[2], [{ v: hexDigit(hi), tone: "answer" }, { v: hexDigit(lo), tone: "answer" }])),
  ];
};

const hexToDenSteps = (n: number): WorkingStep[] => {
  if (n < 16) return [pvStep(`Hex digits run 0–9, then A = 10 up to F = 15. So ${hexS(hexDigit(n))} is ${den(n)}.`, table(HEX[1], [hexDigit(n)]))];
  const hi = Math.floor(n / 16);
  const lo = n % 16;
  return [
    pvStep("Write the digits under the place values.", table(HEX[2], [hexDigit(hi), hexDigit(lo)])),
    pvStep(`Convert each digit to denary: ${hexDigit(hi)} = ${hi}, ${hexDigit(lo)} = ${lo}.`, table(HEX[2], [String(hi), String(lo)])),
    pvStep(`Multiply by the place values and add: ${hi} × 16 + ${lo} = ${hi * 16} + ${lo} = ${n}.`, table(HEX[2], [{ v: String(hi * 16), tone: "highlight" }, { v: String(lo), tone: "highlight" }])),
  ];
};

const nibblesOf = (n: number, width: number): number[] =>
  width === 4 ? [n] : [Math.floor(n / 16), n % 16];

const binToHexSteps = (n: number, width: number): WorkingStep[] => {
  const nibbles = nibblesOf(n, width);
  const nibStr = (x: number) => toBits(x, 4).join("");
  const steps: WorkingStep[] = [];
  if (width === 8) steps.push(pvStep("Split the byte into two nibbles (4 bits each).", table(BIN[8], bitCells(toBits(n, 8)), 4)));
  nibbles.forEach((x) => {
    const parts = placeValues(4).filter((pv) => (x & pv) !== 0);
    const sum = parts.length > 1 ? `${parts.join(" + ")} = ${x}` : `${x}`;
    steps.push(pvStep(`Convert ${bin(nibStr(x))} using the place values 8, 4, 2, 1: ${sum}, which is ${hexS(hexDigit(x))}.`, table(BIN[4], bitCells(toBits(x, 4), true))));
  });
  if (width === 8) steps.push(pvStep("Put the hex digits together.", table(HEX[2], nibbles.map((x) => ({ v: hexDigit(x), tone: "answer" as const })))));
  return steps;
};

const hexToBinSteps = (n: number, width: number): WorkingStep[] => {
  const nibbles = nibblesOf(n, width);
  const nibStr = (x: number) => toBits(x, 4).join("");
  const steps: WorkingStep[] = nibbles.map((x) => {
    const parts = placeValues(4).filter((pv) => (x & pv) !== 0);
    const how = parts.length > 1 ? ` = ${parts.join(" + ")}` : "";
    return pvStep(`Write ${hexDigit(x)} as a 4-bit nibble using the place values 8, 4, 2, 1: ${hexS(hexDigit(x))} = ${den(x)}${how}, so ${bin(nibStr(x))}.`, table(BIN[4], bitCells(toBits(x, 4), true)));
  });
  if (width === 8) steps.push(pvStep("Put the nibbles together.", table(BIN[8], bitCells(toBits(n, 8)), 4)));
  return steps;
};

// ── 6. Question builder ───────────────────────────────────────────────────────

const buildQuestion = (level: DifficultyLevel, dir: Direction): AnyQuestion => {
  const id = randInt(0, 999999);
  const n = drawValue(level);
  const width = level === "level1" ? 4 : 8;
  const bin = toBits(n, width).join("");
  const hex = toHex(n);
  const bitsWord = `${width}-bit`;

  let line: string;
  let answer: string;
  let answerLatex: string;
  let working: WorkingStep[];
  switch (dir) {
    case "denToBin":
      line = `Convert $${denLatex(n)}$ to ${bitsWord} binary.`;
      answer = bin; answerLatex = binLatex(bin); working = denToBinSteps(n, width);
      break;
    case "binToDen":
      line = `Convert $${binLatex(bin)}$ to denary.`;
      answer = `${n}`; answerLatex = denLatex(n); working = binToDenSteps(n, width);
      break;
    case "denToHex":
      line = `Convert $${denLatex(n)}$ to hexadecimal.`;
      answer = hex; answerLatex = hexLatex(hex); working = denToHexSteps(n);
      break;
    case "hexToDen":
      line = `Convert $${hexLatex(hex)}$ to denary.`;
      answer = `${n}`; answerLatex = denLatex(n); working = hexToDenSteps(n);
      break;
    case "binToHex":
      line = `Convert $${binLatex(bin)}$ to hexadecimal.`;
      answer = hex; answerLatex = hexLatex(hex); working = binToHexSteps(n, width);
      break;
    case "hexToBin":
      line = `Convert $${hexLatex(hex)}$ to ${bitsWord} binary.`;
      answer = bin; answerLatex = binLatex(bin); working = hexToBinSteps(n, width);
      break;
  }

  return {
    kind: "worded",
    lines: [line],
    answer,
    answerLatex,
    working,
    key: `number-bases-${dir}-${level}-${n}-${id}`,
    difficulty: level,
    _rawValues: { n, dir, width },
  } as unknown as AnyQuestion;
};

// ── 7. generateQuestion ───────────────────────────────────────────────────────

const POOLS: Record<ToolType, ToolMultiSelect> = { denBin: DEN_BIN_MS, denHex: DEN_HEX_MS, binHex: BIN_HEX_MS };

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  _variables: Record<string, boolean>,
  _dropdownValue: string,
  multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  const pool = POOLS[tool as ToolType] ?? DEN_BIN_MS;
  const dir = pickActive(multiSelectValues, pool.options) as Direction;
  // Only two levels exist; treat any stray level3 as the byte level.
  return buildQuestion(level === "level1" ? "level1" : "level2", dir);
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
      defaults={{ numQuestions: 12, numColumns: 3, maxColumns: 4 }}
    />
  );
}
