import {
  ToolShell,
  type ToolConfig,
  type InfoSection,
  type DifficultyLevel,
  type AnyQuestion,
  mStep,
  pickActive,
} from "../../shared";

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. Types ──────────────────────────────────────────────────────────────────

type ToolType = "estimation";

// ── 2. TOOL_CONFIG ────────────────────────────────────────────────────────────

const OPERATION_MULTISELECT = {
  key: "operation",
  label: "Operation",
  options: [
    { value: "add",      label: "Addition (+)",       defaultActive: true },
    { value: "subtract", label: "Subtraction (−)",    defaultActive: true },
    { value: "multiply", label: "Multiplication (×)", defaultActive: true },
    { value: "divide",   label: "Division (÷)",       defaultActive: true },
  ],
};

const LEVEL3_MULTISELECT = {
  key: "l3type",
  label: "Question Type",
  options: [
    { value: "fracbar",  label: "Fraction Bar",    defaultActive: true },
    { value: "fracterm", label: "Fraction + Term", defaultActive: true },
  ],
};

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Estimation",
  tools: {
    estimation: {
      name: "Estimation",
      variables: [],
      dropdown: null,
      multiSelect: OPERATION_MULTISELECT,
      difficultySettings: {
        level1: { multiSelect: OPERATION_MULTISELECT },
        level2: { multiSelect: OPERATION_MULTISELECT },
        level3: {
          multiSelect: LEVEL3_MULTISELECT,
          variables: [
            { key: "bothSidesExpr", label: "Both sides can have expression", defaultValue: false },
          ],
        },
      },
    },
  },
};

// ── 3. INFO_SECTIONS ─────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  {
    title: "Estimation", icon: "🔢",
    content: [
      { label: "Overview",         detail: "Practice estimating answers by rounding each number to 1 significant figure before calculating." },
      { label: "Level 1 — Green",  detail: "Two whole numbers, single operation. Numbers between 10 and 999." },
      { label: "Level 2 — Yellow", detail: "Two numbers including decimals, single operation." },
      { label: "Level 3 — Red",    detail: "Fraction-based questions requiring estimation and simplification. Use Question Options to choose the type." },
    ],
  },
  {
    title: "Level 3 Question Types", icon: "➗",
    content: [
      { label: "Fraction Bar",    detail: "A self-contained stacked fraction. By default only one side has a two-number expression (e.g. (34 + 21) / 11 or 82 / (4 × 13)). Enable \"Both sides can have expression\" to allow expressions on both numerator and denominator." },
      { label: "Fraction + Term", detail: "A simple fraction displayed inline, combined with a separate whole number using +, − or ×. Round all numbers to 1 s.f., evaluate the fraction first, then combine with the outer term." },
    ],
  },
  {
    title: "Modes", icon: "🖥️",
    content: [
      { label: "Whiteboard",     detail: "Single large question with blank working space. Ideal for whole-class teaching." },
      { label: "Worked Example", detail: "Question with step-by-step solution revealed on demand." },
      { label: "Worksheet",      detail: "Grid of questions with adjustable columns and count." },
    ],
  },
  {
    title: "Differentiated Worksheet", icon: "📋",
    content: [
      { label: "What it does", detail: "Generates three colour-coded columns — one per difficulty level." },
      { label: "Layout",       detail: "Level 1 (green), Level 2 (yellow), Level 3 (red) side by side on one sheet." },
    ],
  },
];

// ── 4. Math helpers ───────────────────────────────────────────────────────────

const formatNumber = (num: number | string): string => {
  if (typeof num === "string") num = parseFloat(num);
  if (num >= 1000) return num.toLocaleString("en-US");
  return num.toString();
};

const isAlreadyRounded = (num: number): boolean => {
  if (num === 0) return true;
  const magnitude = Math.floor(Math.log10(Math.abs(num)));
  return Number.isInteger(num / Math.pow(10, magnitude));
};

const roundTo1SF = (num: number): number => {
  if (num === 0) return 0;
  const magnitude = Math.floor(Math.log10(Math.abs(num)));
  const factor = Math.pow(10, magnitude);
  const decimalPlaces = Math.max(0, -magnitude + 1);
  return Number((Math.round(num / factor) * factor).toFixed(decimalPlaces));
};

// Plain unicode symbol for display strings
const getOpSym = (op: string): string =>
  ({ add: "+", subtract: "−", multiply: "×", divide: "÷" }[op] ?? op);

// LaTeX symbol for KaTeX working steps
const getOpLatex = (op: string): string =>
  ({ add: "+", subtract: "-", multiply: "\\times", divide: "\\div" }[op] ?? op);

// Converts unicode math operators in expression strings to LaTeX
const toLatex = (s: string): string =>
  s.replace(/÷/g, "\\div").replace(/×/g, "\\times").replace(/−/g, "-");

// Formats a number for KaTeX strings — thousands commas use {,} for correct spacing
const fmtK = (n: number) => formatNumber(n).replace(/,/g, "{,}");

const formatAnswer = (n: number): string => {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? formatNumber(r) : r.toFixed(1);
};

// ── 5. Level 1 generator ──────────────────────────────────────────────────────

const generateLevel1 = (op: string): AnyQuestion => {
  for (let att = 0; att < 50; att++) {
    let num1 = 0, num2 = 0;
    if (op === "multiply") {
      if (Math.random() > 0.3) { num1 = Math.floor(Math.random() * 90) + 10; num2 = Math.floor(Math.random() * 90) + 10; }
      else { num1 = Math.floor(Math.random() * 290) + 10; num2 = Math.floor(Math.random() * 90) + 10; }
    } else if (op === "divide") {
      num2 = Math.floor(Math.random() * 90) + 10;
      num1 = num2 * (Math.floor(Math.random() * 9) + 2) + Math.floor(Math.random() * (num2 * 0.3));
    } else {
      num1 = Math.random() > 0.5 ? Math.floor(Math.random() * 90) + 10 : Math.floor(Math.random() * 890) + 10;
      num2 = Math.random() > 0.5 ? Math.floor(Math.random() * 90) + 10 : Math.floor(Math.random() * 890) + 10;
    }
    if (isAlreadyRounded(num1) || isAlreadyRounded(num2)) continue;
    const fd1 = parseInt(num1.toString()[0]), fd2 = parseInt(num2.toString()[0]);
    if (fd1 === 5 || fd2 === 5) continue;
    if (fd1 === 9 && num1.toString()[1] >= "5") continue;
    if (fd2 === 9 && num2.toString()[1] >= "5") continue;
    const r1 = roundTo1SF(num1), r2 = roundTo1SF(num2);
    let answer = 0;
    if (op === "add") answer = r1 + r2;
    else if (op === "subtract") { if (r1 <= r2) continue; answer = r1 - r2; }
    else if (op === "multiply") answer = r1 * r2;
    else { if (r2 === 0) continue; answer = r1 / r2; }
    if (!Number.isInteger(answer) || answer <= 0 || answer >= 10000) continue;
    const sym = getOpSym(op);
    const latexSym = getOpLatex(op);
    const id = Math.floor(Math.random() * 1_000_000);
    return {
      kind: "simple",
      display: `${formatNumber(num1)} ${sym} ${formatNumber(num2)}`,
      displayLatex: `${fmtK(num1)} ${latexSym} ${fmtK(num2)}`,
      answer: formatNumber(answer),
      working: [
        mStep("Original:",        `${fmtK(num1)} ${latexSym} ${fmtK(num2)}`),
        mStep("Round to 1 s.f.:", `${fmtK(num1)} \\to ${fmtK(r1)}, \\quad ${fmtK(num2)} \\to ${fmtK(r2)}`),
        mStep("Calculate:",       `${fmtK(r1)} ${latexSym} ${fmtK(r2)} = ${fmtK(answer)}`),
      ],
      key: `est-l1-${op}-${num1}-${num2}-${id}`,
      difficulty: "level1",
    };
  }
  return {
    kind: "simple",
    display: "82 × 31",
    displayLatex: "82 \\times 31",
    answer: "2,400",
    working: [
      mStep("Original:",        "82 \\times 31"),
      mStep("Round to 1 s.f.:", "82 \\to 80, \\quad 31 \\to 30"),
      mStep("Calculate:",       "80 \\times 30 = 2{,}400"),
    ],
    key: `est-l1-fallback-${Math.floor(Math.random() * 1_000_000)}`,
    difficulty: "level1",
  };
};

// ── 6. Level 2 generator ──────────────────────────────────────────────────────

const generateLevel2 = (op: string): AnyQuestion => {
  for (let att = 0; att < 50; att++) {
    const useDecimals = Math.random() > 0.3;
    let num1 = 0, num2 = 0;
    if (useDecimals) {
      if (op === "multiply" || op === "divide") {
        num1 = Math.round((Math.random() * 9 + 1) * 10) / 10;
        num2 = Math.round((Math.random() * 0.89 + 0.1) * 100) / 100;
      } else {
        const mag = Math.pow(10, Math.floor(Math.random() * 2));
        num1 = Math.round((Math.random() * 9 + 1) * mag * 10) / 10;
        num2 = Math.round((Math.random() * 9 + 1) * mag * 10) / 10;
      }
    } else {
      if (op === "add" || op === "subtract") {
        const mag = Math.pow(10, Math.floor(Math.random() * 2) + 1);
        num1 = Math.floor(Math.random() * 9 + 1) * mag;
        num2 = Math.floor(Math.random() * 9 + 1) * mag;
      } else {
        num1 = Math.floor(Math.random() * 99) + 10;
        num2 = Math.floor(Math.random() * 99) + 10;
      }
    }
    const r1 = roundTo1SF(num1), r2 = roundTo1SF(num2);
    if (isAlreadyRounded(num1) || isAlreadyRounded(num2)) continue;
    if (r1 === 0 || r2 === 0) continue;
    let answer = 0;
    if (op === "add") answer = r1 + r2;
    else if (op === "subtract") { if (r1 <= r2) continue; answer = r1 - r2; }
    else if (op === "multiply") answer = r1 * r2;
    else { if (r2 === 0) continue; answer = r1 / r2; }
    const ans1dp = Math.round(answer * 10) / 10;
    if (Math.abs(answer - ans1dp) > 0.0001) continue;
    answer = ans1dp;
    if (answer <= 0 || answer >= 10000 || isNaN(answer)) continue;
    const fa = answer >= 1000 ? formatNumber(Math.round(answer)) : Number.isInteger(answer) ? formatNumber(answer) : answer.toFixed(1);
    const sym = getOpSym(op);
    const latexSym = getOpLatex(op);
    const id = Math.floor(Math.random() * 1_000_000);
    return {
      kind: "simple",
      display: `${formatNumber(num1)} ${sym} ${formatNumber(num2)}`,
      displayLatex: `${fmtK(num1)} ${latexSym} ${fmtK(num2)}`,
      answer: fa,
      working: [
        mStep("Original:",        `${fmtK(num1)} ${latexSym} ${fmtK(num2)}`),
        mStep("Round to 1 s.f.:", `${fmtK(num1)} \\to ${fmtK(r1)}, \\quad ${fmtK(num2)} \\to ${fmtK(r2)}`),
        mStep("Calculate:",       `${fmtK(r1)} ${latexSym} ${fmtK(r2)} = ${fa.replace(/,/g, "{,}")}`),
      ],
      key: `est-l2-${op}-${num1}-${num2}-${id}`,
      difficulty: "level2",
    };
  }
  return {
    kind: "simple",
    display: "42 × 1.9",
    displayLatex: "42 \\times 1.9",
    answer: "80",
    working: [
      mStep("Original:",        "42 \\times 1.9"),
      mStep("Round to 1 s.f.:", "42 \\to 40, \\quad 1.9 \\to 2"),
      mStep("Calculate:",       "40 \\times 2 = 80"),
    ],
    key: `est-l2-fallback-${Math.floor(Math.random() * 1_000_000)}`,
    difficulty: "level2",
  };
};

// ── 7. Level 3 helpers ────────────────────────────────────────────────────────

const randUnrounded2Digit = (): number => {
  let n: number;
  do { n = Math.floor(Math.random() * 88) + 12; } while (isAlreadyRounded(n));
  return n;
};

const randUnrounded = (): number => {
  let n: number;
  do { n = Math.floor(Math.random() * 887) + 13; } while (isAlreadyRounded(n));
  return n;
};

type Expr = { raw: string; rounded: string; value: number; nums: Array<{ raw: string; rounded: string }> };

const makeAddSubExpr = (): Expr | null => {
  const op = Math.random() > 0.5 ? "add" : "subtract";
  const a = randUnrounded2Digit(), b = randUnrounded2Digit();
  if (a === b) return null;
  const ra = roundTo1SF(a), rb = roundTo1SF(b);
  if (ra === rb) return null;
  const sym = getOpSym(op);
  if (op === "subtract" && ra <= rb) return null;
  const val = op === "add" ? ra + rb : ra - rb;
  if (val <= 0) return null;
  return {
    raw: `${a} ${sym} ${b}`,
    rounded: `${ra} ${sym} ${rb}`,
    value: val,
    nums: [{ raw: String(a), rounded: String(ra) }, { raw: String(b), rounded: String(rb) }],
  };
};

const makeMulDivExpr = (): Expr | null => {
  const useMul = Math.random() > 0.4;
  const a = randUnrounded2Digit(), b = randUnrounded2Digit();
  if (a === b) return null;
  const ra = roundTo1SF(a), rb = roundTo1SF(b);
  if (ra === rb) return null;
  if (useMul) {
    const val = ra * rb;
    if (val <= 0 || val > 10000) return null;
    return {
      raw: `${a} × ${b}`, rounded: `${ra} × ${rb}`, value: val,
      nums: [{ raw: String(a), rounded: String(ra) }, { raw: String(b), rounded: String(rb) }],
    };
  }
  if (rb === 0 || !Number.isInteger(ra / rb)) return null;
  const val = ra / rb;
  if (val <= 0 || val === 1 || val > 100) return null;
  return {
    raw: `${a} ÷ ${b}`, rounded: `${ra} ÷ ${rb}`, value: val,
    nums: [{ raw: String(a), rounded: String(ra) }, { raw: String(b), rounded: String(rb) }],
  };
};

const makeAnyExpr = (): Expr | null =>
  Math.random() > 0.5 ? makeAddSubExpr() : makeMulDivExpr();

// ── 8. Level 3: Fraction Bar ──────────────────────────────────────────────────

const generateFracBar = (allowBothSides: boolean): AnyQuestion | null => {
  const structure = !allowBothSides
    ? (Math.random() < 0.5 ? "expr/num" : "num/expr")
    : (Math.random() < 0.40 ? "expr/num" : Math.random() < 0.55 ? "num/expr" : "expr/expr");

  let numExpr: Expr | null = null, denExpr: Expr | null = null;
  let numVal = 0, denVal = 0;
  let numRaw = "", numRounded = "", denRaw = "", denRounded = "";
  let numNums: Array<{ raw: string; rounded: string }> = [];
  let denNums: Array<{ raw: string; rounded: string }> = [];

  if (structure === "expr/num" || structure === "expr/expr") {
    numExpr = makeAnyExpr();
    if (!numExpr) return null;
    ({ value: numVal, raw: numRaw, rounded: numRounded, nums: numNums } = numExpr);
  } else {
    const n = randUnrounded();
    numVal = roundTo1SF(n); numRaw = formatNumber(n); numRounded = formatNumber(numVal);
    numNums = [{ raw: formatNumber(n), rounded: formatNumber(numVal) }];
  }

  if (structure === "num/expr" || structure === "expr/expr") {
    denExpr = makeAnyExpr();
    if (!denExpr) return null;
    ({ value: denVal, raw: denRaw, rounded: denRounded, nums: denNums } = denExpr);
  } else {
    const factors: number[] = [];
    for (let f = 2; f < numVal; f++) { if (Number.isInteger(numVal / f)) factors.push(f); }
    const validFactors = factors.filter(f => f !== numVal && f !== 1);
    if (validFactors.length === 0) return null;
    const target = validFactors[Math.floor(Math.random() * Math.min(validFactors.length, 8))];
    let den = 0;
    for (let att = 0; att < 30; att++) {
      const c = randUnrounded2Digit();
      if (roundTo1SF(c) === target) { den = c; break; }
    }
    if (den === 0) return null;
    denVal = target; denRaw = formatNumber(den); denRounded = formatNumber(target);
    denNums = [{ raw: formatNumber(den), rounded: formatNumber(target) }];
  }

  if (denVal === 0 || numVal === denVal) return null;
  const answer = numVal / denVal;
  const ansR = Math.round(answer * 10) / 10;
  if (Math.abs(answer - ansR) > 0.0001 || answer <= 0 || answer > 500 || answer === 1) return null;
  const formattedAnswer = formatAnswer(ansR);

  const numWorkRaw = numExpr ? `(${numRaw})` : numRaw;
  const denWorkRaw = denExpr ? `(${denRaw})` : denRaw;
  const numWorkRnd = numExpr ? `(${numRounded})` : numRounded;
  const denWorkRnd = denExpr ? `(${denRounded})` : denRounded;

  const allNums = [...numNums, ...denNums];
  const roundLatex = allNums.map(n => `${n.raw} \\to ${n.rounded}`).join(", \\;");

  const id = Math.floor(Math.random() * 1_000_000);
  return {
    kind: "simple",
    display: `${numWorkRaw} ÷ ${denWorkRaw}`,
    displayLatex: `\\dfrac{${toLatex(numRaw)}}{${toLatex(denRaw)}}`,
    answer: formattedAnswer,
    working: [
      mStep("Original:",        `\\dfrac{${toLatex(numWorkRaw)}}{${toLatex(denWorkRaw)}}`),
      mStep("Round to 1 s.f.:", roundLatex),
      ...(numExpr ? [mStep("Numerator:",   `${toLatex(numWorkRnd)} = ${numVal}`)] : []),
      ...(denExpr ? [mStep("Denominator:", `${toLatex(denWorkRnd)} = ${denVal}`)] : []),
      mStep("Calculate:",       `${numVal} \\div ${denVal} = ${formattedAnswer}`),
    ],
    key: `est-l3-fb-${numRaw}-${denRaw}-${id}`,
    difficulty: "level3",
  };
};

// ── 9. Level 3: Fraction + Term ───────────────────────────────────────────────

const generateFracTerm = (): AnyQuestion | null => {
  const outerOps = ["add", "subtract", "multiply"];
  const op = outerOps[Math.floor(Math.random() * outerOps.length)];
  const sym = getOpSym(op);
  const latexSym = getOpLatex(op);

  for (let att = 0; att < 60; att++) {
    const fNum = randUnrounded2Digit(), fDen = randUnrounded2Digit();
    if (fNum === fDen) continue;
    const rFNum = roundTo1SF(fNum), rFDen = roundTo1SF(fDen);
    if (rFNum === rFDen || rFDen === 0) continue;
    const fracVal = rFNum / rFDen;
    const fracR = Math.round(fracVal * 10) / 10;
    if (Math.abs(fracVal - fracR) > 0.0001 || fracR <= 0 || fracR === 1) continue;

    let outer = 0, rOuter = 0;
    if (op === "multiply") {
      outer = Math.floor(Math.random() * 38) + 12;
      if (isAlreadyRounded(outer)) continue;
      rOuter = roundTo1SF(outer);
      if (rOuter === 0 || rOuter === rFNum || rOuter === rFDen) continue;
    } else {
      let innerAtt = 0;
      while (innerAtt++ < 20) {
        const c = Math.floor(Math.random() * 17) + 12;
        if (!isAlreadyRounded(c)) { outer = c; break; }
      }
      if (outer === 0) continue;
      rOuter = roundTo1SF(outer);
      if (rOuter === 0) continue;
      if (op === "subtract" && fracR <= rOuter) continue;
    }

    let answer: number;
    if (op === "add") answer = fracR + rOuter;
    else if (op === "subtract") answer = fracR - rOuter;
    else answer = fracR * rOuter;
    const ansR = Math.round(answer * 10) / 10;
    if (Math.abs(answer - ansR) > 0.0001 || ansR <= 0 || ansR > 10000) continue;

    const formattedAnswer = formatAnswer(ansR);
    const fracValStr = formatAnswer(fracR);
    const outerStr = formatNumber(outer);
    const rOuterStr = formatNumber(rOuter);
    const id = Math.floor(Math.random() * 1_000_000);
    return {
      kind: "simple",
      display: `${fNum}/${fDen} ${sym} ${outerStr}`,
      displayLatex: `\\dfrac{${fNum}}{${fDen}} ${latexSym} ${outerStr}`,
      answer: formattedAnswer,
      working: [
        mStep("Original:",        `\\dfrac{${fNum}}{${fDen}} ${latexSym} ${outerStr}`),
        mStep("Round to 1 s.f.:", `${fNum} \\to ${rFNum}, \\quad ${fDen} \\to ${rFDen}, \\quad ${outerStr} \\to ${rOuterStr}`),
        mStep("Fraction:",        `${rFNum} \\div ${rFDen} = ${fracValStr}`),
        mStep("Calculate:",       `${fracValStr} ${op === "subtract" ? "-" : latexSym} ${rOuterStr} = ${formattedAnswer}`),
      ],
      key: `est-l3-ft-${fNum}-${fDen}-${op}-${outer}-${id}`,
      difficulty: "level3",
    };
  }
  return null;
};

// ── 10. Level 3 dispatcher ────────────────────────────────────────────────────

const generateLevel3 = (l3type: string, allowBothSides: boolean): AnyQuestion => {
  const FALLBACK: AnyQuestion = {
    kind: "simple",
    display: "(34 + 21) ÷ 11",
    displayLatex: "\\dfrac{34 + 21}{11}",
    answer: "5",
    working: [
      mStep("Original:",        "\\dfrac{34 + 21}{11}"),
      mStep("Round to 1 s.f.:", "34 \\to 30, \\; 21 \\to 20, \\; 11 \\to 10"),
      mStep("Numerator:",       "(30 + 20) = 50"),
      mStep("Calculate:",       "50 \\div 10 = 5"),
    ],
    key: `est-l3-fallback-${Math.floor(Math.random() * 1_000_000)}`,
    difficulty: "level3",
  };
  for (let att = 0; att < 40; att++) {
    const q = l3type === "fracbar" ? generateFracBar(allowBothSides) : generateFracTerm();
    if (q) return q;
  }
  return FALLBACK;
};

// ── 11. generateQuestion ──────────────────────────────────────────────────────

const generateQuestion = (
  _tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  _dropdownValue: string,
  multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  void (_tool as ToolType);
  if (level === "level1") return generateLevel1(pickActive(multiSelectValues, OPERATION_MULTISELECT.options));
  if (level === "level2") return generateLevel2(pickActive(multiSelectValues, OPERATION_MULTISELECT.options));
  return generateLevel3(pickActive(multiSelectValues, LEVEL3_MULTISELECT.options), !!variables["bothSidesExpr"]);
};

// ── 12. generateUniqueQ ───────────────────────────────────────────────────────

const generateUniqueQ = (
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string,
  usedKeys: Set<string>,
  multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  let q: AnyQuestion;
  let attempts = 0;
  do {
    q = generateQuestion(tool, level, variables, dropdownValue, multiSelectValues);
    attempts++;
  } while (usedKeys.has(q.key) && attempts < 100);
  usedKeys.add(q.key);
  return q;
};

// ═══════════════════════════════════════════════════════════════════════════════
// END OF TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

// Exposed for the generator smoke-test suite (src/tests/generators.test.ts).
export const __test = { TOOL_CONFIG, generateQuestion };

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      generateUniqueQ={generateUniqueQ}
    />
  );
}
