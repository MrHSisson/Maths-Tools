import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type WorkingStep,
  type ToolMultiSelect,
  mStep, randInt, pickActive,
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
// Hex in KaTeX: upright, so "AD" isn't read as A×D.
const hexLatex = (h: string): string => `\\mathrm{${h}}`;

const placeValues = (width: number): number[] =>
  Array.from({ length: width }, (_, i) => 2 ** (width - 1 - i));

// Place-value grid: headings over digits (the J277 128…1 / 16 1 table).
const gridLatex = (headers: (string | number)[], cells: string[]): string => [
  `\\begin{array}{|${"c|".repeat(headers.length)}}`,
  "\\hline",
  `${headers.join(" & ")} \\\\`,
  "\\hline",
  `${cells.join(" & ")} \\\\`,
  "\\hline",
  "\\end{array}",
].join(" ");

// Level 1 = one nibble (0–15), Level 2 = a byte beyond one nibble (16–255) —
// disjoint ranges, so Level 2 is always genuinely two hex digits / 8 bits.
const drawValue = (level: DifficultyLevel): number =>
  level === "level1" ? randInt(1, 15) : randInt(16, 255);

// A nibble's value as the sum of its place values, e.g. 1010 → 8 + 2 = 10.
const nibbleSumLatex = (n: number): string => {
  const parts = placeValues(4).filter((pv) => (n & pv) !== 0);
  return parts.length > 1 ? `${parts.join(" + ")} = ${n}` : `${n}`;
};

// ── 5. Working-step builders ──────────────────────────────────────────────────

const denToBinSteps = (n: number, width: number): WorkingStep[] => {
  const pvs = placeValues(width);
  const steps: WorkingStep[] = [
    mStep("Write out the place values:", gridLatex(pvs, pvs.map(() => "\\phantom{0}"))),
  ];
  let rem = n;
  for (const pv of pvs) {
    if (pv <= rem) {
      steps.push(mStep(`${pv} fits into ${rem}, so write a 1 under ${pv}:`, [`${rem}`, `- ${pv}`, `= ${rem - pv}`]));
      rem -= pv;
    }
    if (rem === 0) break;
  }
  const hasZero = n !== 2 ** width - 1;
  steps.push(mStep(hasZero ? "Write 0 under every other place value:" : "Every place value was used:", gridLatex(pvs, toBits(n, width).map(String))));
  return steps;
};

const binToDenSteps = (n: number, width: number): WorkingStep[] => {
  const pvs = placeValues(width);
  const used = pvs.filter((pv) => (n & pv) !== 0);
  return [
    mStep("Write the bits under the place values:", gridLatex(pvs, toBits(n, width).map(String))),
    mStep("Add the place values that have a 1:", used.length > 1 ? [used.join(" + "), `= ${n}`] : `${n}`),
  ];
};

const denToHexSteps = (n: number): WorkingStep[] => {
  if (n < 16) return [mStep("Hex digits run 0–9, then A = 10 up to F = 15:", `${n} = ${hexLatex(hexDigit(n))}`)];
  const hi = Math.floor(n / 16);
  const lo = n % 16;
  return [
    mStep("Find how many 16s fit, and what is left over:", [`${n}`, `= ${hi} \\times 16 + ${lo}`]),
    mStep("Write each part as a hex digit (A = 10 … F = 15):", [`${hi} = ${hexLatex(hexDigit(hi))}`, `,\\; ${lo} = ${hexLatex(hexDigit(lo))}`]),
  ];
};

const hexToDenSteps = (n: number): WorkingStep[] => {
  if (n < 16) return [mStep("Hex digits run 0–9, then A = 10 up to F = 15:", `${hexLatex(hexDigit(n))} = ${n}`)];
  const hi = Math.floor(n / 16);
  const lo = n % 16;
  return [
    mStep("Write the digits under the place values:", gridLatex([16, 1], [hexLatex(hexDigit(hi)), hexLatex(hexDigit(lo))])),
    mStep("Convert each digit to denary:", `${hexLatex(hexDigit(hi))} = ${hi},\\; ${hexLatex(hexDigit(lo))} = ${lo}`),
    mStep("Multiply by the place values and add:", [`${hi} \\times 16 + ${lo}`, `= ${hi * 16} + ${lo}`, `= ${n}`]),
  ];
};

const nibblesOf = (n: number, width: number): number[] =>
  width === 4 ? [n] : [Math.floor(n / 16), n % 16];

const binToHexSteps = (n: number, width: number): WorkingStep[] => {
  const nibbles = nibblesOf(n, width);
  const nibStr = (x: number) => toBits(x, 4).join("");
  const steps: WorkingStep[] = [];
  if (width === 8) steps.push(mStep("Split the byte into two nibbles (4 bits each):", nibbles.map(nibStr).join("\\;\\;")));
  nibbles.forEach((x) => {
    steps.push(mStep(`Convert ${nibStr(x)} using the place values 8, 4, 2, 1:`, [`${nibStr(x)}`, `= ${nibbleSumLatex(x)}`, `= ${hexLatex(hexDigit(x))}`]));
  });
  if (width === 8) steps.push(mStep("Put the hex digits together:", hexLatex(toHex(n))));
  return steps;
};

const hexToBinSteps = (n: number, width: number): WorkingStep[] => {
  const nibbles = nibblesOf(n, width);
  const nibStr = (x: number) => toBits(x, 4).join("");
  const steps: WorkingStep[] = nibbles.map((x) =>
    mStep(
      `Write ${hexDigit(x)} as a 4-bit nibble using the place values 8, 4, 2, 1:`,
      [`${hexLatex(hexDigit(x))} = ${x}`, `= ${nibStr(x)}`],
    ),
  );
  if (width === 8) steps.push(mStep("Put the nibbles together:", nibbles.map(nibStr).join("")));
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
      line = `Convert $${n}$ to ${bitsWord} binary.`;
      answer = bin; answerLatex = bin; working = denToBinSteps(n, width);
      break;
    case "binToDen":
      line = `Convert $${bin}$ to denary.`;
      answer = `${n}`; answerLatex = `${n}`; working = binToDenSteps(n, width);
      break;
    case "denToHex":
      line = `Convert $${n}$ to hexadecimal.`;
      answer = hex; answerLatex = hexLatex(hex); working = denToHexSteps(n);
      break;
    case "hexToDen":
      line = `Convert $${hexLatex(hex)}$ to denary.`;
      answer = `${n}`; answerLatex = `${n}`; working = hexToDenSteps(n);
      break;
    case "binToHex":
      line = `Convert $${bin}$ to hexadecimal.`;
      answer = hex; answerLatex = hexLatex(hex); working = binToHexSteps(n, width);
      break;
    case "hexToBin":
      line = `Convert $${hexLatex(hex)}$ to ${bitsWord} binary.`;
      answer = bin; answerLatex = bin; working = hexToBinSteps(n, width);
      break;
  }
  working.push(mStep("Answer:", answerLatex));

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
      defaults={{ numQuestions: 12, numColumns: 3, maxColumns: 4 }}
    />
  );
}
