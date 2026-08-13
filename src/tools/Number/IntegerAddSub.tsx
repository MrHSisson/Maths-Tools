import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type QOSnapshot, type WorkingStep,
  MathRenderer, randInt, mStep, tStep,
} from "../../shared";

// ─────────────────────────────────────────────────────────────────────────────
// Adding & Subtracting Integers
//
// A number-line tool. The maths is simple (a + b or a − b with negatives) but the
// pedagogy is the number line itself — start position, jump direction, distance.
//
// SPECIAL LAYOUT: treated the same way Powers of 10 treats its place-value grid —
// the whole diagram renders through a custom `questionRenderer` and the working
// panel starts collapsed (defaults.collapseWorkingByDefault), so the question box
// goes full-width and ScaleToFit grows the number line into the reclaimed space.
//
// Two number-line states, deliberately different:
//   • Blank   — an empty scaffold (line + arrowheads, no ticks/values) to model on.
//   • Worked  — ticks, start/end points and a jump arrow, keyed off showAnswer —
//               so Show Answer fills it in, exactly like the place-value grid does.
// Whiteboard and Worked Example share one renderer; only the worksheet cell (text
// only) differs, so the default text print handler needs no custom code.
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. Types ──────────────────────────────────────────────────────────────────

type ToolType = "addSub";

interface RawValues {
  a: number;
  answer: number;
  direction: "left" | "right" | "none";
  steps: number;
}

// ── 2. TOOL_CONFIG ────────────────────────────────────────────────────────────

const OPERATION_DD = {
  key: "operationType",
  label: "Type",
  options: [
    { value: "mixed", label: "Mixed" },
    { value: "addition", label: "Addition" },
    { value: "subtraction", label: "Subtraction" },
  ],
  defaultValue: "mixed",
};

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Adding & Subtracting Integers",
  tools: {
    addSub: {
      name: "Adding & Subtracting Integers",
      variables: [],
      dropdown: null,
      // Only Level 1 has a free choice of operation — Level 2 is always "add a
      // negative", Level 3 is always "subtract a negative", so the dropdown is
      // meaningless there.
      difficultySettings: {
        level1: { variables: [], dropdown: OPERATION_DD },
        level2: { variables: [], dropdown: null },
        level3: { variables: [], dropdown: null },
      },
    },
  },
};

// ── 3. INFO_SECTIONS ─────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  { title: "Adding & Subtracting Integers", icon: "➖", content: [
    { label: "Overview",         detail: "Add and subtract positive and negative numbers, modelled as jumps along a number line." },
    { label: "Level 1 — Green",  detail: "a + b or a − b, with a between −10 and 10. Choose Addition, Subtraction, or a Mixed pool." },
    { label: "Level 2 — Yellow", detail: "Adding a negative number, e.g. a + (−b) — always a leftward jump." },
    { label: "Level 3 — Red",    detail: "Subtracting a negative number, e.g. a − (−b) — always a rightward jump." },
  ]},
  { title: "The number line", icon: "📏", content: [
    { label: "Start",            detail: "The purple point marks the starting value, a." },
    { label: "Jump",              detail: "The arrow shows the size and direction of the move — right to add, left to subtract." },
    { label: "End",               detail: "The green point marks the answer, where the jump lands." },
    { label: "Whiteboard",        detail: "Starts blank, ready to model on; Show Answer fills in the ticks, points and jump." },
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard",     detail: "One question with a full-width number line to model on." },
    { label: "Worked Example", detail: "The filled number line plus a step-by-step explanation." },
    { label: "Worksheet",      detail: "A grid of questions with PDF export." },
  ]},
  { title: "Question Options", icon: "⚙️", content: [
    { label: "Type (Level 1 only)", detail: "Mixed, Addition-only, or Subtraction-only questions." },
    { label: "Differentiated", detail: "Worksheet mode produces three columns — one per level — simultaneously." },
  ]},
];

// ── 4. Question maths ─────────────────────────────────────────────────────────

interface RollResult { a: number; b: number; displayLatex: string; answer: number; }

const rollOnce = (level: DifficultyLevel, operationType: string): RollResult => {
  if (level === "level1") {
    const a = randInt(-10, 10);
    const b = randInt(1, 10);
    const isAddition = operationType === "addition" ? true : operationType === "subtraction" ? false : Math.random() < 0.5;
    return { a, b, displayLatex: `${a} ${isAddition ? "+" : "-"} ${b}`, answer: isAddition ? a + b : a - b };
  }
  if (level === "level2") {
    const a = randInt(-10, 10);
    const b = randInt(1, 12);
    return { a, b, displayLatex: `${a} + (-${b})`, answer: a + (-b) };
  }
  const a = randInt(-10, 10);
  const b = randInt(1, 12);
  return { a, b, displayLatex: `${a} - (-${b})`, answer: a - (-b) };
};

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  _variables: Record<string, boolean>,
  dropdownValue: string,
): AnyQuestion => {
  void (tool as ToolType);
  const id = randInt(0, 999_999);
  const operationType = dropdownValue || "mixed";

  let r = rollOnce(level, operationType);
  if (r.answer === 0 && Math.random() < 0.9) r = rollOnce(level, operationType); // avoid a trivial zero answer most of the time

  const { a, b, displayLatex, answer } = r;
  const direction: "left" | "right" | "none" = answer > a ? "right" : answer < a ? "left" : "none";
  const steps = Math.abs(answer - a);

  const working: WorkingStep[] = direction === "none"
    ? [mStep("Start at:", `${a}`), tStep("Stay at the same position — the value doesn't change.")]
    : [
        mStep("Start at:", `${a}`),
        mStep(`Move ${steps} to the ${direction}:`, [`${a} ${direction === "right" ? "+" : "-"} ${steps}`, `= ${answer}`]),
      ];

  const rv: RawValues = { a, answer, direction, steps };

  return {
    kind: "simple",
    display: displayLatex,
    displayLatex,
    answer: `${answer}`,
    answerLatex: `${answer}`,
    working,
    _rawValues: rv,
    key: `addSub-${level}-${a}-${b}-${displayLatex}-${id}`,
    difficulty: level,
  } as unknown as AnyQuestion;
};

// ── 5. Number line diagram ────────────────────────────────────────────────────

function BlankNumberLineSVG() {
  const width = 750, height = 100, padding = 50, lineY = 50, numSlots = 14;
  const spacing = (width - 2 * padding) / (numSlots - 1);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ display: "block", width: "100%", height: "auto" }} preserveAspectRatio="xMidYMid meet">
      <polygon points={`${padding - 22},${lineY} ${padding - 10},${lineY - 6} ${padding - 10},${lineY + 6}`} fill="#6b7280" />
      <line x1={padding - 15} y1={lineY} x2={width - padding + 15} y2={lineY} stroke="#6b7280" strokeWidth={3} strokeLinecap="round" />
      <polygon points={`${width - padding + 22},${lineY} ${width - padding + 10},${lineY - 6} ${width - padding + 10},${lineY + 6}`} fill="#6b7280" />
      {Array.from({ length: numSlots }, (_, i) => (
        <line key={i} x1={padding + i * spacing} y1={lineY - 12} x2={padding + i * spacing} y2={lineY + 12} stroke="#6b7280" strokeWidth={2} />
      ))}
    </svg>
  );
}

function WorkedNumberLineSVG({ a, answer, direction, steps }: RawValues) {
  const minVal = Math.min(a, answer) - 3;
  const maxVal = Math.max(a, answer) + 3;
  const range = maxVal - minVal;
  const width = 750, height = 180, padding = 50, lineY = height * 0.65;
  const getX = (val: number) => padding + ((val - minVal) / range) * (width - 2 * padding);
  const ticks: number[] = [];
  for (let i = minVal; i <= maxVal; i++) ticks.push(i);
  const arrowColor = direction === "right" ? "#059669" : direction === "left" ? "#dc2626" : "#6b7280";
  const arrowLabel = direction === "right" ? `+${steps}` : direction === "left" ? `−${steps}` : "0";
  const startX = getX(a), endX = getX(answer), midX = (startX + endX) / 2;
  const markerId = `addsub-arrowhead-${a}-${answer}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ display: "block", width: "100%", height: "auto" }} preserveAspectRatio="xMidYMid meet">
      <defs>
        <marker id={markerId} markerWidth={10} markerHeight={7} refX={9} refY={3.5} orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill={arrowColor} />
        </marker>
      </defs>
      <line x1={padding - 15} y1={lineY} x2={width - padding + 15} y2={lineY} stroke="#4b5563" strokeWidth={3} strokeLinecap="round" />
      <polygon points={`${width - padding + 22},${lineY} ${width - padding + 10},${lineY - 6} ${width - padding + 10},${lineY + 6}`} fill="#4b5563" />
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={getX(tick)} y1={lineY - (tick === 0 ? 12 : 8)} x2={getX(tick)} y2={lineY + (tick === 0 ? 12 : 8)} stroke={tick === 0 ? "#1e40af" : "#4b5563"} strokeWidth={tick === 0 ? 3 : 2} />
          <text x={getX(tick)} y={lineY + 28} textAnchor="middle" fontSize={15} fill={tick === 0 ? "#1e40af" : "#374151"} fontWeight={tick === 0 ? "bold" : "500"}>{tick}</text>
        </g>
      ))}
      <circle cx={startX} cy={lineY} r={10} fill="#7c3aed" stroke="#5b21b6" strokeWidth={2} />
      <text x={startX} y={lineY - 18} textAnchor="middle" fontSize={14} fill="#7c3aed" fontWeight="bold">Start</text>
      {direction !== "none" && (
        <>
          <path d={`M ${startX} ${lineY - 14} Q ${midX} ${lineY - 59} ${endX} ${lineY - 14}`} fill="none" stroke={arrowColor} strokeWidth={3} strokeLinecap="round" markerEnd={`url(#${markerId})`} />
          <rect x={midX - 22} y={lineY - 83} width={44} height={24} rx={4} fill="white" stroke={arrowColor} strokeWidth={2} />
          <text x={midX} y={lineY - 66} textAnchor="middle" fontSize={16} fill={arrowColor} fontWeight="bold">{arrowLabel}</text>
        </>
      )}
      <circle cx={endX} cy={lineY} r={10} fill="#059669" stroke="#047857" strokeWidth={2} />
    </svg>
  );
}

function NumberLineDiagram({ rv, filled }: { rv: RawValues; filled: boolean }) {
  return <div className="w-full">{filled ? <WorkedNumberLineSVG {...rv} /> : <BlankNumberLineSVG />}</div>;
}

// ── 6. questionRenderer ───────────────────────────────────────────────────────

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
  const rv = anyQ._rawValues as RawValues | undefined;

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
      {rv && <NumberLineDiagram rv={rv} filled={showAnswer} />}
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
      questionRenderer={questionRenderer}
      defaults={{
        collapseWorkingByDefault: true,
        hideFontControls: true,
        numQuestions: 5,
        numColumns: 2,
        maxColumns: 4,
      }}
    />
  );
}
