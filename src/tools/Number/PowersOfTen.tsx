import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type QOSnapshot, type WorkingStep,
  MathRenderer, tStep, PlaceValueTable, pvCells, pvColumnSet, pvDisplay, PV_WORD_HEADERS_VAR, PV_WORD_HEADERS_KEY, type PlaceValueTableData,
} from "../../shared";

// ─────────────────────────────────────────────────────────────────────────────
// Powers of 10: Multiply & Divide
//
// A place-value-grid tool. The maths is simple (v × 10ⁿ or v ÷ 10ⁿ) but the whole
// pedagogy is the *grid*: a wide place-value table showing digits slide left/right.
//
// SPECIAL LAYOUT: the grid must span the full container, not the shell's usual
// question/working split. We get that by rendering the entire grid through a
// custom `questionRenderer` and starting with the working panel collapsed
// (defaults.collapseWorkingByDefault) — the question box then goes full-width and
// ScaleToFit grows the grid into the reclaimed space. The panel stays recoverable
// via the shell's re-open button, so nothing is lost.
//
// Two grid states, deliberately different:
//   • Whiteboard  — an EMPTY scaffold the teacher writes into live; Show Answer
//                   fills it (input row → move → output row) and reveals = answer.
//   • Worked Ex.  — the FILLED grid, plus the shell's verbal working steps + answer.
//   • Worksheet   — text only (v × 10ⁿ = answer); default text print handler.
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. Types ──────────────────────────────────────────────────────────────────

type ToolType = "directCalc";

interface RawValues {
  vin: number;
  vout: number;
  power: number;
  op: "multiply" | "divide";
  zeros: number;
  usePowers: boolean;
}

interface GridData {
  vin: number;
  vout: number;
  op: "multiply" | "divide";
  zeros: number;
  level: DifficultyLevel;
}

// ── 2. TOOL_CONFIG ────────────────────────────────────────────────────────────

const OPERATION_DD = {
  key: "operation",
  label: "Operation",
  options: [
    { value: "mixed", label: "Mixed" },
    { value: "multiply", label: "Multiply" },
    { value: "divide", label: "Divide" },
  ],
  defaultValue: "mixed",
};

const POWERS_NOTATION_VAR = { key: "powersNotation", label: "10ⁿ notation", defaultValue: false };

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Powers of 10: Multiply & Divide",
  tools: {
    directCalc: {
      name: "Direct Calculation",
      variables: [POWERS_NOTATION_VAR, PV_WORD_HEADERS_VAR],
      dropdown: OPERATION_DD,
      difficultySettings: null,
    },
  },
};

// ── 3. INFO_SECTIONS ──────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  { title: "Powers of 10", icon: "🔟", content: [
    { label: "Overview",         detail: "Multiply and divide by 10, 100, 1000 … using a place value grid. Every digit slides the same number of places." },
    { label: "Level 1 — Green",  detail: "Whole numbers only. Multiply or divide so the result is always a whole number." },
    { label: "Level 2 — Yellow", detail: "Decimals (1–2 decimal places). The grid includes tenths, hundredths and beyond, with a decimal-point marker on the Ones column." },
    { label: "Level 3 — Red",    detail: "Very large and very small numbers, too big to grid — shown as a movement statement instead." },
  ]},
  { title: "How the grid works", icon: "📊", content: [
    { label: "Count the zeros",  detail: "100 has 2 zeros, 1000 has 3 — that is how many places every digit moves." },
    { label: "Multiply → left",  detail: "Multiplying makes a number bigger, so the digits move LEFT." },
    { label: "Divide → right",   detail: "Dividing makes a number smaller, so the digits move RIGHT." },
    { label: "Whiteboard grid",  detail: "The whiteboard shows a blank grid to write into; press Show Answer to fill it in and check." },
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard",     detail: "One question with a full-width place value grid to model on." },
    { label: "Worked Example", detail: "The filled grid plus a step-by-step explanation." },
    { label: "Worksheet",      detail: "A grid of questions with PDF export." },
  ]},
  { title: "Question Options", icon: "⚙️", content: [
    { label: "Operation: Mixed / Multiply / Divide", detail: "Choose whether questions multiply, divide, or a random mix of both." },
    { label: "10ⁿ notation", detail: "Show the power as 10ⁿ (e.g. 10³) instead of the expanded number (1000)." },
    { label: "Differentiated", detail: "Worksheet mode produces three columns — one per level — simultaneously." },
  ]},
];

// ── 4. Number / grid helpers (preserved from the original tool) ────────────────

const getPowerOfTen = (level: DifficultyLevel): number => {
  if (level === "level1") return [10, 100, 1000][Math.floor(Math.random() * 3)];
  if (level === "level2") return [10, 100, 1000, 10000, 100000][Math.floor(Math.random() * 5)];
  return [10, 100, 1000, 10000, 100000, 1000000][Math.floor(Math.random() * 6)];
};

const countZeros = (power: number): number => Math.round(Math.log10(power));

const formatNumber = (num: number): string => {
  if (num === 0) return "0";
  let str = num.toString();

  // Expand any scientific notation back to plain digits.
  if (str.includes("e")) {
    const parts = str.split("e");
    const exp = parseInt(parts[1]);
    if (exp < 0) {
      const decimalPlaces = Math.abs(exp) + (parts[0].includes(".") ? parts[0].split(".")[1].length : 0);
      str = num.toFixed(decimalPlaces);
    } else {
      str = num.toFixed(0);
    }
  }

  str = str.replace(/,/g, "");
  const parts = str.includes(".") ? str.split(".") : [str];
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};

// KaTeX-safe number: a bare comma in math mode adds a thin space, so use {,}.
const toLatexNum = (num: number): string => formatNumber(num).replace(/,/g, "{,}");

const powerLatex = (power: number, usePowers: boolean): string =>
  usePowers ? `10^{${countZeros(power)}}` : toLatexNum(power);

// Level 1 is whole numbers (M … O); Level 2 adds six decimal places (t … mth).
const getPlaceValueSet = (level?: DifficultyLevel) => pvColumnSet(7, level === "level1" ? 0 : 6);

// ── 5. Question maths (preserved) ──────────────────────────────────────────────

interface Computed { vin: number; vout: number; power: number; op: "multiply" | "divide"; }

const computeAttempt = (level: DifficultyLevel, op: "multiply" | "divide"): Computed => {
  let vin = 0, vout = 0, power = 0;

  if (level === "level1") {
    power = getPowerOfTen(level);
    if (op === "multiply") {
      const digits = Math.floor(Math.random() * 3) + 1;
      vin = digits === 1 ? Math.floor(Math.random() * 9) + 1
          : digits === 2 ? Math.floor(Math.random() * 90) + 10
          : Math.floor(Math.random() * 900) + 100;
      vout = vin * power;
      if (vout > 9999999) { vin = Math.floor(vin / 10); vout = vin * power; }
    } else {
      const digits = Math.floor(Math.random() * 3) + 1;
      vout = digits === 1 ? Math.floor(Math.random() * 9) + 1
           : digits === 2 ? Math.floor(Math.random() * 90) + 10
           : Math.floor(Math.random() * 900) + 100;
      vin = vout * power;
    }
  } else if (level === "level2") {
    const baseInteger = Math.floor(Math.random() * 9999) + 1;
    const divideBy = Math.random() < 0.5 ? 10 : 100;
    vin = baseInteger / divideBy;
    if (divideBy === 10) {
      power = op === "multiply"
        ? [10, 100, 1000, 10000][Math.floor(Math.random() * 4)]
        : [10, 100, 1000, 10000, 100000][Math.floor(Math.random() * 5)];
    } else {
      power = op === "multiply"
        ? [10, 100, 1000, 10000, 100000][Math.floor(Math.random() * 5)]
        : [10, 100, 1000, 10000][Math.floor(Math.random() * 4)];
    }
    vout = op === "multiply" ? vin * power : vin / power;
    vout = parseFloat(vout.toFixed(12));
  } else {
    // Level 3 — extreme numbers, answer kept in [0.000001, 1,000,000,000).
    if (op === "multiply") {
      if (Math.random() < 0.5) {
        vin = Math.floor(Math.random() * 900000) + 100000;
        const maxPower = Math.floor(1000000000 / vin);
        const available = [10, 100, 1000, 10000, 100000, 1000000].filter(p => p <= maxPower);
        power = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : 10;
        vout = vin * power;
      } else {
        const decimalPlaces = Math.floor(Math.random() * 4) + 5;
        const randomDigits = Math.floor(Math.random() * 9000) + 1000;
        const digitStr = randomDigits.toString();
        vin = parseFloat(`0.${"0".repeat(decimalPlaces - digitStr.length)}${digitStr}`);
        power = getPowerOfTen(level);
        vout = vin * power;
        while (vout < 0.000001 && power < 1000000) { power *= 10; vout = vin * power; }
        vout = parseFloat(vout.toFixed(12));
      }
    } else {
      if (Math.random() < 0.5) {
        vin = Math.floor(Math.random() * 900000) + 100000;
        power = getPowerOfTen(level);
        vout = vin / power;
        while (vout < 0.000001 && power > 10) { power /= 10; vout = vin / power; }
        vout = parseFloat(vout.toFixed(12));
      } else {
        const decimalPlaces = Math.floor(Math.random() * 4) + 5;
        const randomDigits = Math.floor(Math.random() * 9000) + 1000;
        const digitStr = randomDigits.toString();
        vin = parseFloat(`0.${"0".repeat(decimalPlaces - digitStr.length)}${digitStr}`);
        power = [10, 100, 1000][Math.floor(Math.random() * 3)];
        vout = vin / power;
        if (vout < 0.000001) { vin = parseFloat((vin * 1000).toFixed(12)); vout = vin / power; }
        vout = parseFloat(vout.toFixed(12));
      }
    }
    if (vout >= 1000000000) vout = 999999999;
    if (vout < 0.000001 && vout !== 0) vout = 0.000001;
  }

  return { vin, vout, power, op };
};

// Level 1 & 3 keep decimals in the answer short; level 2 is already exact.
const computeQuestion = (level: DifficultyLevel, op: "multiply" | "divide"): Computed => {
  if (level === "level2") return computeAttempt(level, op);
  for (let i = 0; i < 100; i++) {
    const result = computeAttempt(level, op);
    const answerStr = result.vout.toString();
    if (answerStr.includes(".") && answerStr.split(".")[1].length > 7) continue;
    return result;
  }
  return computeAttempt(level, op);
};

// ── 6. buildDisplay — raw params → display / answer / working ──────────────────

interface Built { displayLatex: string; display: string; answerLatex: string; answer: string; working: WorkingStep[]; }

const buildDisplay = (rv: RawValues): Built => {
  const { vin, vout, power, op, zeros, usePowers } = rv;
  const opLatex = op === "multiply" ? "\\times" : "\\div";
  const opPlain = op === "multiply" ? "×" : "÷";
  const pLatex = powerLatex(power, usePowers);
  const pPlain = usePowers ? `10^${zeros}` : formatNumber(power);
  const direction = op === "multiply" ? "left" : "right";
  const zPlural = zeros !== 1 ? "s" : "";

  const working: WorkingStep[] = [
    tStep(`${pPlain} has ${zeros} zero${zPlural}, so every digit moves ${zeros} place${zPlural}.`),
    tStep(`${op === "multiply" ? "Multiplying" : "Dividing"} makes the number ${op === "multiply" ? "bigger" : "smaller"}, so the digits move ${direction}.`),
  ];

  return {
    displayLatex: `${toLatexNum(vin)} ${opLatex} ${pLatex}`,
    display: `${formatNumber(vin)} ${opPlain} ${pPlain}`,
    answerLatex: toLatexNum(vout),
    answer: formatNumber(vout),
    working,
  };
};

// ── 7. generateQuestion ────────────────────────────────────────────────────────

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string,
): AnyQuestion => {
  void (tool as ToolType);
  const usePowers = variables["powersNotation"] ?? false;
  const op: "multiply" | "divide" =
    dropdownValue === "multiply" ? "multiply"
    : dropdownValue === "divide" ? "divide"
    : Math.random() < 0.5 ? "multiply" : "divide";

  const { vin, vout, power } = computeQuestion(level, op);
  const zeros = countZeros(power);
  const rv: RawValues = { vin, vout, power, op, zeros, usePowers };
  const built = buildDisplay(rv);
  const grid: GridData = { vin, vout, op, zeros, level };

  return {
    kind: "simple",
    display: built.display,
    displayLatex: built.displayLatex,
    answer: built.answer,
    answerLatex: built.answerLatex,
    working: built.working,
    _rawValues: rv,
    _grid: grid,
    _wh: variables[PV_WORD_HEADERS_KEY] ?? false,
    key: `directCalc-${level}-${vin}-${power}-${op}`,
    difficulty: level,
  } as unknown as AnyQuestion;
};

// ── 8. reformatQuestion — 10ⁿ toggle is a pure display switch ───────────────────

const reformatQuestion = (q: AnyQuestion, qo: QOSnapshot): AnyQuestion | null => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rv = (q as any)._rawValues as RawValues | undefined;
  if (!rv) return null;
  const usePowers = qo.variables["powersNotation"] ?? false;
  const wordHeaders = qo.variables[PV_WORD_HEADERS_KEY] ?? false;
  // The heading style is read live at render time (below) — it only needs to be a display change here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const headersChanged = wordHeaders !== ((q as any)._wh ?? false);
  if (usePowers === rv.usePowers && !headersChanged) return null; // nothing display-related changed
  const built = buildDisplay({ ...rv, usePowers });
  return {
    ...q,
    display: built.display,
    displayLatex: built.displayLatex,
    working: built.working,
    _wh: wordHeaders,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _rawValues: { ...rv, usePowers },
  } as unknown as AnyQuestion;
};

// ── 9. Place value grid ────────────────────────────────────────────────────────

function PlaceValueGrid({ vin, vout, op, zeros, level, filled, qo }: GridData & { filled: boolean; qo?: QOSnapshot }) {
  const zPlural = zeros !== 1 ? "s" : "";

  // Level 3 numbers are too extreme to grid — a movement statement instead.
  if (level === "level3") {
    if (!filled) return null;
    const direction = op === "multiply" ? "left" : "right";
    return (
      <div className="w-full flex justify-center">
        <div className="rounded-xl px-8 py-10 text-center bg-white border-2 border-black">
          <span className="text-3xl font-bold text-black">
            All digits move {zeros} place{zPlural} to the {direction}
          </span>
        </div>
      </div>
    );
  }

  const set = getPlaceValueSet(level);
  const { columns, onesIndex } = set;
  const plain = (n: number) => formatNumber(n).replace(/,/g, "");
  const blank = columns.map(() => "");

  // Same three rows in every state (empty / answered), at the shared row height, so the grid
  // never resizes or rescales when Show Answer fills it in.
  const data: PlaceValueTableData = pvDisplay({
    ...set,
    showPoint: level === "level2",
    rows: [
      { kind: "cells", cells: filled ? pvCells(plain(vin), columns, onesIndex) : blank },
      { kind: "banner", text: filled ? `↓ ${op === "multiply" ? "Move LEFT" : "Move RIGHT"} by ${zeros} place${zPlural}` : "↓" },
      { kind: "cells", cells: filled ? pvCells(plain(vout), columns, onesIndex) : blank },
    ],
  }, qo);
  return <PlaceValueTable data={data} />;
}

// ── 10. questionRenderer ───────────────────────────────────────────────────────

const workingScaffold = {
  label: "place value grid",
  placement: "question" as const,
  render: (q: AnyQuestion, showAnswer: boolean, _cs: string, qo?: QOSnapshot): JSX.Element | null => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const grid = (q as any)._grid as GridData | undefined;
    return grid ? <PlaceValueGrid {...grid} filled={showAnswer} qo={qo} /> : null;
  },
};

const questionRenderer = (
  q: AnyQuestion,
  showAnswer: boolean,
  _colorScheme: string,
  compact?: boolean,
  _idx?: number,
  qo?: QOSnapshot,
  fontClass?: string,
): JSX.Element | null => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyQ = q as any;
  const grid = anyQ._grid as GridData | undefined;

  // Worksheet cell — text only; the shell appends "= answer" below on reveal.
  if (compact === true) {
    return (
      <div className="w-full text-center">
        <span className={`${fontClass ?? "text-3xl"} font-bold`} style={{ color: "#000" }}>
          <MathRenderer latex={anyQ.displayLatex} />
        </span>
      </div>
    );
  }

  // Whiteboard (embedded or fullscreen) shows the inline answer beside the
  // equation; worked example gets its own answer card from the shell, so we
  // suppress the inline one there to avoid showing the answer twice.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isWhiteboard = compact === undefined || (qo as any)?.fullscreen === true;
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
      {/* Whiteboard: the grid is ToolShell's hideable workingScaffold (below). Worked example: filled grid here. */}
      {grid && !isWhiteboard && <PlaceValueGrid {...grid} filled={showAnswer} qo={qo} />}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

// Exposed for the generator smoke-test suite (src/tests/generators.test.ts).
export const __test = { TOOL_CONFIG, generateQuestion };

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      reformatQuestion={reformatQuestion}
      questionRenderer={questionRenderer}
      workingScaffold={workingScaffold}
      defaults={{
        collapseWorkingByDefault: true,
        hideFontControls: true,
        worksheetFontControls: true, // text-only worksheet keeps its text-size chevrons
        numQuestions: 5,
        numColumns: 2,
        maxColumns: 4,
      }}
    />
  );
}
