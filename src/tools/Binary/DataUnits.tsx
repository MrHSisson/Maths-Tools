import {
  ToolShell,
  type ToolConfig, type ToolVariable, type InfoSection, type DifficultyLevel, type AnyQuestion, type WorkingStep,
  type ToolMultiSelect,
  mStep, randInt, pickActive,
  UNIT_PLURAL as PLURAL, UNIT_FACTORS as FACTORS, unitName, fmtT, buildHops, hopStep, UnitLadder,
} from "../../shared";

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════
//
// OCR J277 1.2.4 — units of data storage. One ladder of units, always the same:
//
//   bit  ──×4──  nibble  ──×2──  byte  ──×1000──  KB  ──×1000──  MB  ──×1000──  GB  ──×1000──  TB  ──×1000──  PB
//
// OCR uses ×1000 between the named multiples; ×1024 is shown in brackets beside it so students who have met the
// binary prefix aren't thrown. A conversion is a walk along the ladder, and the LEVEL is the length of the walk:
// Level 1 = one step, Level 2 = two, Level 3 = three to five. Moving DOWN the ladder multiplies, UP divides.
//
// Two sub-tools share the ladder: "Bytes & Above" (byte → PB, every factor is 1000) and "Bits & Nibbles" (a walk
// that has a bit or a nibble at one end, so the factors 4 and 2 come in). Values are exact — held as BigInt tenths
// so a PB → byte answer never loses digits, and a one-decimal start (2.5 GB) stays exact.

// ── 1. The ladder ─────────────────────────────────────────────────────────────

type Tool = "bytesUp" | "bitsNibbles";
type Dir = "toLarger" | "toSmaller";

// ── 2. Question options ───────────────────────────────────────────────────────

const DIRECTION: ToolMultiSelect = {
  key: "direction", label: "Direction",
  options: [
    { value: "toSmaller", label: "Larger → smaller unit (×)", defaultActive: true },
    { value: "toLarger", label: "Smaller → larger unit (÷)", defaultActive: true },
  ],
};
const NUMBERS: ToolMultiSelect = {
  key: "numbers", label: "Numbers",
  options: [
    { value: "whole", label: "Whole numbers", defaultActive: true },
    { value: "decimal", label: "One decimal place", defaultActive: false },
  ],
};
const WORDING: ToolMultiSelect = {
  key: "wording", label: "Wording",
  options: [
    { value: "convert", label: "Convert … to …", defaultActive: true },
    { value: "howMany", label: "How many … in …?", defaultActive: true },
  ],
};

/** Scaffold display only — never changes the question. Fewer units on screen: bigger, and no distractors. */
const RELEVANT_KEY = "scaleRelevantOnly";
const RELEVANT_ONLY: ToolVariable = { key: RELEVANT_KEY, label: "Scale: only the relevant units", defaultValue: true };

// ── 3. TOOL_CONFIG ────────────────────────────────────────────────────────────

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Data Units",
  tools: {
    bytesUp: {
      name: "Bytes & Above",
      instruction: "",
      variables: [RELEVANT_ONLY], dropdown: null, multiSelect: [DIRECTION, NUMBERS, WORDING], difficultySettings: null,
    },
    bitsNibbles: {
      name: "Bits & Nibbles",
      instruction: "",
      variables: [RELEVANT_ONLY], dropdown: null, multiSelect: DIRECTION, difficultySettings: null,
    },
  },
};

// ── 4. INFO_SECTIONS ──────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  {
    title: "Data Units", icon: "💾",
    content: [
      { label: "Overview", detail: "Convert between bits, nibbles, bytes, kilobytes, megabytes, gigabytes, terabytes and petabytes, using the OCR J277 1.2.4 scale: a nibble is 4 bits, a byte is 8 bits (2 nibbles), and each named multiple is ×1000 the one below (×1024 shown in brackets)." },
      { label: "The scale", detail: "bit ×4 nibble ×2 byte ×1000 KB ×1000 MB ×1000 GB ×1000 TB ×1000 PB. Moving DOWN the scale (to a smaller unit) multiplies; moving UP (to a larger unit) divides." },
      { label: "Level 1 — Green", detail: "One step along the scale, e.g. 40 000 KB → MB, or 3 TB → GB." },
      { label: "Level 2 — Yellow", detail: "Two steps, e.g. 5 GB → KB, or 3 bytes → bits." },
      { label: "Level 3 — Red", detail: "Three to five steps, e.g. 2 PB → GB… or 3 KB → bits." },
    ],
  },
  {
    title: "Sub-tools", icon: "🗂️",
    content: [
      { label: "Bytes & Above", detail: "Bytes up to petabytes. Every step is ×1000 (÷1000), so the working is about counting steps and zeros." },
      { label: "Bits & Nibbles", detail: "Walks that start or finish at a bit or a nibble, so a ×4 or ×2 step joins the ×1000 steps: 1 byte = 8 bits, 1 byte = 2 nibbles, 1 nibble = 4 bits." },
    ],
  },
  {
    title: "Question Options", icon: "⚙️",
    content: [
      { label: "Direction", detail: "Larger → smaller unit multiplies; smaller → larger divides. Leave both on to mix them." },
      { label: "Numbers (Bytes & Above)", detail: "Switch on one decimal place for answers like 4.5 GB." },
      { label: "Wording (Bytes & Above)", detail: "'Convert 40 000 KB to MB' or 'How many MB are there in 40 000 KB?'. Bits & Nibbles uses a short scenario." },
      { label: "Scale (Whiteboard)", detail: "The working box shows the scale, with the start unit marked and the target unit outlined. Show Answer lights up the path. The scale shows just the units from the start to the target by default — larger, with nothing to distract; switch off 'Scale: only the relevant units' to show every unit." },
    ],
  },
  {
    title: "Modes", icon: "🖥️",
    content: [
      { label: "Whiteboard", detail: "Single large question with the scale beside it." },
      { label: "Worked Example", detail: "One line per step along the scale, each showing ×/÷ by the factor (1024 in brackets)." },
      { label: "Worksheet", detail: "Grid of questions with PDF export." },
    ],
  },
];

// ── 5. Exact values (BigInt tenths) ───────────────────────────────────────────

// ── 5. Exact values and working steps: shared with File Sizes — see shared/dataUnits.ts ──────────────────

// ── 7. Question builder ───────────────────────────────────────────────────────

const BITS_PAIRS: Record<DifficultyLevel, [number, number][]> = {
  level1: [[0, 1], [1, 2]],                                  // bit–nibble, nibble–byte
  level2: [[0, 2], [1, 3]],                                  // bit–byte, nibble–KB
  level3: [[0, 3], [1, 4], [0, 4], [1, 5]],                  // bit–KB, nibble–MB, bit–MB, nibble–GB
};

const buildQuestion = (tool: Tool, level: DifficultyLevel, dir: Dir, decimal: boolean, wording: string): AnyQuestion => {
  // The walk: lo = the smaller unit, hi = the larger.
  let lo: number;
  let hi: number;
  if (tool === "bytesUp") {
    const steps = level === "level1" ? 1 : level === "level2" ? 2 : randInt(3, 5);
    lo = randInt(2, 7 - steps);
    hi = lo + steps;
  } else {
    const pairs = BITS_PAIRS[level];
    [lo, hi] = pairs[randInt(0, pairs.length - 1)];
  }
  const a = dir === "toLarger" ? lo : hi;   // start unit
  const b = dir === "toLarger" ? hi : lo;   // target unit

  // Pick the quantity in the LARGER unit, then derive the other — so every division is exact.
  const span = FACTORS.slice(lo, hi).reduce((x, y) => x * BigInt(y), 1n);
  const useDecimal = decimal && tool === "bytesUp";
  const maxL = tool === "bitsNibbles" && level === "level3" ? 20 : 99;
  let largerT: bigint;
  if (useDecimal) {
    let v = randInt(11, 99);
    while (v % 10 === 0) v = randInt(11, 99);
    largerT = BigInt(v);
  } else {
    largerT = BigInt(randInt(1, maxL) * 10);
  }
  const startT = dir === "toLarger" ? largerT * span : largerT;
  const hops = buildHops(a, b, startT);
  const ansT = hops[hops.length - 1].after;

  const start = `$${fmtT(startT, "{,}")}$`;
  const startUnit = unitName(a, startT);
  const ansUnit = unitName(b, ansT);
  const id = randInt(0, 999999);

  const lines: string[] = tool === "bytesUp"
    ? [wording === "howMany"
        ? `How many ${PLURAL[b]} are there in ${start} ${startUnit}?`
        : `Convert ${start} ${startUnit} to ${PLURAL[b]}.`]
    : [`A file is ${start} ${startUnit} in size.`, `How many ${PLURAL[b]} is this?`];

  const answerLatex = fmtT(ansT, "{,}");
  const working: WorkingStep[] = [...hops.map(hopStep), mStep("Answer:", answerLatex, ansUnit)];

  return {
    kind: "worded",
    lines,
    answer: `${fmtT(ansT)} ${ansUnit}`,
    answerLatex,
    answerSuffix: ansUnit,
    working,
    key: `data-units-${tool}-${level}-${a}-${b}-${startT}-${id}`,
    difficulty: level,
    _rawValues: { a, b, startT, ansT },
  } as unknown as AnyQuestion;
};

// ── 8. generateQuestion ───────────────────────────────────────────────────────

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  _variables: Record<string, boolean>,
  _dropdownValue: string,
  multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  const t: Tool = tool === "bitsNibbles" ? "bitsNibbles" : "bytesUp";
  const dir = pickActive(multiSelectValues, DIRECTION.options) as Dir;
  const decimal = pickActive(multiSelectValues, NUMBERS.options) === "decimal";
  const wording = pickActive(multiSelectValues, WORDING.options);
  return buildQuestion(t, level, dir, decimal, wording);
};

// ── 9. The scale in the working box (Whiteboard) is the shared <UnitLadder> (shared/components/UnitLadder.tsx) ──

// ═══════════════════════════════════════════════════════════════════════════════
// END OF TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

export const __test = { TOOL_CONFIG, generateQuestion, FACTORS };

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      defaults={{ numQuestions: 12, numColumns: 3, maxColumns: 4, hideAnswerStep: true }}
      workingScaffold={{
        label: "the scale",
        render: (q, showAnswer, _cs, qo) => {
          const rv = (q as any)._rawValues as { a: number; b: number } | undefined;
          return rv ? <UnitLadder a={rv.a} b={rv.b} showAnswer={showAnswer} relevantOnly={qo?.variables?.[RELEVANT_KEY] !== false} /> : null;
        },
      }}
    />
  );
}
