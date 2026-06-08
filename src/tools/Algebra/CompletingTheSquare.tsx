import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type WorkingStep, type QOSnapshot,
  randInt, fmt, mStep, MathRenderer,
} from "../../shared";

// ── 1. Types ──────────────────────────────────────────────────────────────────

type ToolType = "completing" | "roots" | "turning";

// ── 2. TOOL_CONFIG ────────────────────────────────────────────────────────────

const DISPLAY_DD = {
  key: "display", label: "Display",
  options: [{ value: "decimal", label: "Decimal" }, { value: "fraction", label: "Fraction" }],
  defaultValue: "decimal",
};

const INTEGER_C_VAR = { key: "integerC", label: "Integer +c", defaultValue: false };
const NEG_COEFF_VAR = { key: "negativeCoefficients", label: "Negative Coefficients", defaultValue: false };

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Completing the Square",
  tools: {

    completing: {
      name: "Completing the Square",
      instruction: "Write the following in completed the square form:",
      variables: [],
      dropdown: null,
      difficultySettings: {
        level1: { variables: [], dropdown: null },
        level2: { variables: [INTEGER_C_VAR], dropdown: DISPLAY_DD },
        level3: { variables: [INTEGER_C_VAR, NEG_COEFF_VAR], dropdown: DISPLAY_DD },
      },
    },

    roots: {
      name: "Finding Roots",
      instruction: "By completing the square, find the roots of:",
      variables: [],
      dropdown: null,
      difficultySettings: {
        level1: { variables: [], dropdown: null },
        level2: { variables: [INTEGER_C_VAR], dropdown: DISPLAY_DD },
        level3: { variables: [INTEGER_C_VAR, NEG_COEFF_VAR], dropdown: DISPLAY_DD },
      },
    },

    turning: {
      name: "Turning Points",
      instruction: "By completing the square, find the turning point of:",
      variables: [],
      dropdown: null,
      difficultySettings: {
        level1: { variables: [], dropdown: null },
        level2: { variables: [INTEGER_C_VAR], dropdown: DISPLAY_DD },
        level3: { variables: [INTEGER_C_VAR, NEG_COEFF_VAR], dropdown: DISPLAY_DD },
      },
    },

  },
};

// ── 3. INFO_SECTIONS ─────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  { title: "Completing the Square", icon: "📐", content: [
    { label: "Overview",         detail: "Rewrite a quadratic in the form a(x + p)² + q." },
    { label: "Level 1 — Green",  detail: "Monic quadratics (a = 1) with integer p." },
    { label: "Level 2 — Yellow", detail: "Monic quadratics (a = 1) with half-integer p." },
    { label: "Level 3 — Red",    detail: "Non-monic quadratics (a ≥ 2). Optional negative leading coefficient." },
  ]},
  { title: "Finding Roots", icon: "✂️", content: [
    { label: "Overview",         detail: "Use the completed square form to solve for x, or identify when there are no real roots." },
    { label: "Level 1 — Green",  detail: "Monic quadratics with integer p." },
    { label: "Level 2 — Yellow", detail: "Monic quadratics with half-integer p." },
    { label: "Level 3 — Red",    detail: "Non-monic quadratics. Optional negative leading coefficient." },
  ]},
  { title: "Turning Points", icon: "📍", content: [
    { label: "Overview",         detail: "Identify the turning point (vertex) of a quadratic from its completed square form." },
    { label: "Level 1 — Green",  detail: "Monic quadratics with integer p." },
    { label: "Level 2 — Yellow", detail: "Monic quadratics with half-integer p." },
    { label: "Level 3 — Red",    detail: "Non-monic quadratics. Optional negative leading coefficient." },
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard",       detail: "Single question on the left, working space on the right. Visualiser available." },
    { label: "Worked Example",   detail: "Full step-by-step solution revealed on demand." },
    { label: "Worksheet",        detail: "Grid of questions with PDF export." },
  ]},
  { title: "Question Options", icon: "⚙️", content: [
    { label: "Display: Decimal / Fraction", detail: "Levels 2 & 3. Controls whether half-integer values show as decimals (e.g. 2.5) or fractions (e.g. 5/2). Switching is instant — the same question reformats without regenerating." },
    { label: "Integer +c",                 detail: "Levels 2 & 3. When enabled, the constant term c is always an integer." },
    { label: "Negative Coefficients",       detail: "Level 3 only. When enabled, the leading coefficient may be negative." },
    { label: "Differentiated",              detail: "Worksheet mode produces three columns — one per level — simultaneously." },
  ]},
];

// ── 4. Helpers ────────────────────────────────────────────────────────────────

const fmtF = (n: number): string => {
  if (n % 1 === 0) return String(n);
  if ((n * 2) % 1 === 0) { const num = Math.round(n * 2); return num < 0 ? `-${Math.abs(num)}/2` : `${num}/2`; }
  if ((n * 4) % 1 === 0) { const num = Math.round(n * 4); return num < 0 ? `-${Math.abs(num)}/4` : `${num}/4`; }
  return fmt(n);
};

const toLatex = (s: string): string => {
  const m = s.match(/^(-?)(\d+)\/(\d+)$/);
  if (m) return `${m[1]}\\frac{${m[2]}}{${m[3]}}`;
  return s;
};

// ── 5. buildDisplay ───────────────────────────────────────────────────────────
//
// Converts the raw quadratic parameters and display mode into displayLatex,
// answerLatex, and working steps. Called at generation time for both decimal
// and fraction modes so both versions are pre-computed on the question.

interface RawValues {
  tool: ToolType;
  a: number; b: number; c: number; p: number; q: number;
}

interface Built {
  displayLatex: string;
  answerLatex: string;
  working: WorkingStep[];
}

const buildDisplay = (rv: RawValues, useFractions: boolean): Built => {
  const { tool, a, b, c, p, q } = rv;
  const fmtP = (n: number) => useFractions ? fmtF(n) : fmt(n);
  const L = (s: string) => toLatex(s);

  const aStr   = a === 1 ? "" : a === -1 ? "-" : a > 0 ? String(a) : `-${Math.abs(a)}`;
  const bAbs   = Math.abs(b);
  const bLatex = b === 0 ? "" : bAbs === 1 ? (b > 0 ? " + x" : " - x") : b > 0 ? ` + ${L(fmtP(b))}x` : ` - ${L(fmtP(bAbs))}x`;
  const cLatex = c === 0 ? "" : c > 0 ? ` + ${L(fmtP(c))}` : ` - ${L(fmtP(Math.abs(c)))}`;
  const displayLatex = `y = ${aStr}x^2${bLatex}${cLatex}`;

  const pStr  = p > 0 ? `+ ${L(fmtP(p))}` : p < 0 ? `- ${L(fmtP(Math.abs(p)))}` : "";
  const pSqL  = L(fmtP(p * p));
  const aPSqL = L(fmtP(a * p * p));
  const cPart = c > 0 ? `+ ${L(fmtP(c))}` : c < 0 ? `- ${L(fmtP(Math.abs(c)))}` : "";

  const working: WorkingStep[] = [];

  if (a !== 1) {
    const bOverA = b / a;
    const bOAL   = bOverA > 0 ? `+ ${L(fmtP(bOverA))}x` : bOverA < 0 ? `- ${L(fmtP(Math.abs(bOverA)))}x` : "";
    const cPartF = c > 0 ? ` + ${L(fmtP(c))}` : c < 0 ? ` - ${L(fmtP(Math.abs(c)))}` : "";
    working.push(mStep(`Factor out ${a}:`, `y = ${a}(x^2 ${bOAL})${cPartF}`));
  }

  const coeffStr = a !== 1 ? L(fmtP(b / a)) : String(b);
  working.push(mStep("Half the coefficient of x:", `${coeffStr} \\div 2 = ${L(fmtP(b / (2 * a)))}`));

  if (a !== 1) {
    working.push(mStep("Complete the square:", `y = ${a}[(x ${pStr})^2 - ${pSqL}] ${cPart}`));
    working.push(mStep("Expand the square brackets:", `y = ${a}(x ${pStr})^2 - ${aPSqL} ${cPart}`));
  } else {
    working.push(mStep("Complete the square:", `y = [(x ${pStr})^2 - ${pSqL}] ${cPart}`));
    working.push(mStep("Expand the square brackets:", `y = (x ${pStr})^2 - ${pSqL} ${cPart}`));
  }

  const aFinal  = a === 1 ? "" : a === -1 ? "-" : String(a);
  const pFinal  = p > 0 ? `+ ${L(fmtP(p))}` : p < 0 ? `- ${L(fmtP(Math.abs(p)))}` : "";
  const qFinal  = q > 0 ? `+ ${L(fmtP(q))}` : q < 0 ? `- ${L(fmtP(Math.abs(q)))}` : "";
  const negP    = -p;
  const negPStr = negP > 0 ? L(fmtP(negP)) : negP < 0 ? `-${L(fmtP(Math.abs(negP)))}` : "0";

  let answerLatex = "";

  if (tool === "roots") {
    working.push(mStep("Set equal to zero:", `0 = ${aFinal}(x ${pFinal})^2 ${qFinal}`));
    working.push(mStep("Rearrange:", `${aFinal}(x ${pFinal})^2 = ${L(fmtP(-q))}`));
    if (q > 0) {
      answerLatex = "\\text{No real roots}";
    } else {
      if (a !== 1) {
        working.push(mStep(`Divide by ${a}:`, `(x ${pFinal})^2 = ${L(fmtP(-q / a))}`));
      }
      const sqrtVal = a !== 1 ? -q / a : -q;
      const sqrtStr = sqrtVal % 1 === 0 && Math.sqrt(sqrtVal) % 1 === 0
        ? String(Math.sqrt(sqrtVal))
        : `\\sqrt{${L(fmtP(sqrtVal))}}`;
      working.push(mStep("Square root both sides:", `x ${pFinal} = \\pm ${sqrtStr}`));
      answerLatex = `x = ${negPStr} \\pm ${sqrtStr}`;
    }
  } else if (tool === "turning") {
    working.push(mStep("Minimum value of squared term:", `(x ${pFinal})^2 \\geq 0`));
    working.push(mStep("This equals zero when:", `x = ${negPStr}`));
    working.push(mStep("Find the y-coordinate:", `x = ${negPStr},\\; y = ${L(fmtP(q))}`));
    answerLatex = `(${negPStr},\\; ${L(fmtP(q))})`;
  } else {
    answerLatex = `y = ${aFinal}(x ${pFinal})^2 ${qFinal}`;
  }

  return { displayLatex, answerLatex, working };
};

// ── 6. generateQuestion ───────────────────────────────────────────────────────

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string,
): AnyQuestion => {
  const t           = tool as ToolType;
  const useNegative = variables["negativeCoefficients"] ?? false;
  const integerC    = variables["integerC"] ?? false;

  let a = 0, p = 0, q = 0;

  if (level === "level1") {
    a = 1;
    p = randInt(-9, 9); if (p === 0) p = 1;
  } else if (level === "level2") {
    a = 1;
    p = randInt(-9, 9) + 0.5;
  } else {
    a = randInt(2, 5);
    if (useNegative && Math.random() > 0.5) a = -a;
    p = Math.random() > 0.5
      ? (() => { let v = randInt(-9, 9); if (v === 0) v = 1; return v; })()
      : randInt(-9, 9) + 0.5;
  }

  if (t === "roots") {
    q = Math.random() < 0.1 ? randInt(1, 15) : -(randInt(1, 15));
  } else if (integerC && p % 1 !== 0) {
    const c = randInt(-8, 8);
    q = c - a * p * p;
  } else {
    if (p % 1 !== 0) {
      if (Math.random() > 0.5) { const c = randInt(-8, 8); q = c - a * p * p; }
      else                      { q = randInt(-8, 8); }
    } else {
      q = randInt(-8, 8);
    }
  }

  const b = 2 * a * p;
  const c = a * p * p + q;
  const rv: RawValues = { tool: t, a, b, c, p, q };

  // Pre-compute both display modes so switching is instant
  const builtD = buildDisplay(rv, false);
  const builtF = buildDisplay(rv, true);

  // Store fraction-version steps on each decimal step's extra field
  const working = builtD.working.map((s, i) => ({
    ...s,
    extra: { _fractionStep: builtF.working[i] },
  }));

  const useFractions = dropdownValue === "fraction";
  const displayLatex = useFractions ? builtF.displayLatex : builtD.displayLatex;
  const answerLatex  = useFractions ? builtF.answerLatex  : builtD.answerLatex;

  const aStr = a === 1 ? "" : a === -1 ? "-" : a > 0 ? String(a) : `-${Math.abs(a)}`;
  const bAbs = Math.abs(b);
  const bStr = b === 0 ? "" : bAbs === 1 ? (b > 0 ? " + x" : " - x") : b > 0 ? ` + ${fmt(b)}x` : ` - ${fmt(bAbs)}x`;
  const cStr = c === 0 ? "" : c > 0 ? ` + ${fmt(c)}` : ` - ${fmt(Math.abs(c))}`;

  return {
    kind: "simple",
    display: `y = ${aStr}x²${bStr}${cStr}`,
    displayLatex,
    answer: "",
    answerLatex,
    working,
    // Store both pre-computed versions and raw values for instant reformat
    _rawValues: rv,
    _builtDecimal: builtD,
    _builtFraction: builtF,
    key: `${t}-${level}-${a}-${b}-${c}`,
    difficulty: level,
  } as unknown as AnyQuestion;
};

// ── 7. generateUniqueQ ────────────────────────────────────────────────────────

const generateUniqueQ = (
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string,
  usedKeys: Set<string>,
): AnyQuestion => {
  let q: AnyQuestion;
  let attempts = 0;
  do { q = generateQuestion(tool, level, variables, dropdownValue); attempts++; }
  while (usedKeys.has(q.key) && attempts < 100);
  usedKeys.add(q.key);
  return q;
};

// ── 8. Custom renderers for instant decimal/fraction reformat ─────────────────

const questionRenderer = (
  q: AnyQuestion,
  showAnswer: boolean,
  _colorScheme: string,
  _compact?: boolean,
  _idx?: number,
  qo?: QOSnapshot,
) => {
  const anyQ = q as any;
  const rv   = anyQ._rawValues as RawValues | undefined;
  if (!rv) return null;

  const useFractions  = qo?.dropdownValue === "fraction";
  const built: Built  = useFractions ? anyQ._builtFraction : anyQ._builtDecimal;
  if (!built) return null;

  const instruction = TOOL_CONFIG.tools[rv.tool]?.instruction ?? "";

  return (
    <div className="w-full text-center flex flex-col gap-4 items-center">
      {instruction && (
        <div className="text-2xl font-semibold" style={{ color: "#000" }}>{instruction}</div>
      )}
      <div className="text-4xl font-semibold" style={{ color: "#000" }}>
        <MathRenderer latex={built.displayLatex} />
      </div>
      {showAnswer && (
        <div className="text-4xl font-bold" style={{ color: "#166534" }}>
          <MathRenderer latex={built.answerLatex} />
        </div>
      )}
    </div>
  );
};

const answerRenderer = (
  q: AnyQuestion,
  _colorScheme: string,
  qo?: QOSnapshot,
) => {
  const anyQ = q as any;
  const useFractions = qo?.dropdownValue === "fraction";
  const built: Built = useFractions ? anyQ._builtFraction : anyQ._builtDecimal;
  if (!built) return null;
  return <MathRenderer latex={built.answerLatex} />;
};

const stepRenderer = (
  s: WorkingStep,
  _colorScheme: string,
  qo?: QOSnapshot,
) => {
  const useFractions = qo?.dropdownValue === "fraction";
  const activeStep: WorkingStep = useFractions
    ? ((s.extra as any)?._fractionStep ?? s)
    : s;

  if (activeStep.type === "mStep") {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-left">{activeStep.label}</span>
        <div className="text-center">
          <MathRenderer latex={activeStep.latex} />
          {activeStep.unit && <span> {activeStep.unit}</span>}
        </div>
      </div>
    );
  }
  return <div className="text-center"><MathRenderer latex={activeStep.latex} /></div>;
};

// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      generateUniqueQ={generateUniqueQ}
      questionRenderer={questionRenderer}
      answerRenderer={answerRenderer}
      stepRenderer={stepRenderer}
      defaults={{ numQuestions: 6, numColumns: 2 }}
    />
  );
}
