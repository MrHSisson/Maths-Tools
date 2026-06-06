import {
  ToolShell,
  type ToolConfig,
  type ToolMultiSelect,
  type InfoSection,
  type DifficultyLevel,
  type AnyQuestion,
  randInt, pick, step, tStep, mStep, fracStr, mStr, pickActive, fmt,
} from "../../shared";

// ── NAVIGATION ────────────────────────────────────────────────────────────────
// Tools use window.location.href = "/" for the Home button — no React Router.
// ─────────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. Types ──────────────────────────────────────────────────────────────────

type ToolType = "equations";

// ── 2. Multi-select option pools ──────────────────────────────────────────────
// Several independent pools are active per level, so `multiSelect` is an array
// of groups. All groups share one flat values record, so option `value`s must
// be unique across every group in the tool.

const CONSTANTS_L1_GROUP: ToolMultiSelect = {
  key: "constantsL1",
  label: "Constants",
  options: [
    { value: "bothPos", label: "Both +", defaultActive: true },
    { value: "oneNeg",  label: "One −",  defaultActive: false },
    { value: "bothNeg", label: "Both −", defaultActive: false },
  ],
};

const X_SIDE_GROUP: ToolMultiSelect = {
  key: "xSide",
  label: "Larger x on",
  options: [
    { value: "lhs", label: "LHS", defaultActive: true },
    { value: "rhs", label: "RHS", defaultActive: false },
  ],
};

const BRACKET_SIDE_GROUP: ToolMultiSelect = {
  key: "bracketSide",
  label: "Bracket side",
  options: [
    { value: "bracketLeft",  label: "Left",  defaultActive: false },
    { value: "bracketRight", label: "Right", defaultActive: false },
    { value: "bracketBoth",  label: "Both",  defaultActive: true },
  ],
};

const CONSTANT_SIGN_GROUP: ToolMultiSelect = {
  key: "constantSign",
  label: "Constants",
  options: [
    { value: "constAddition",    label: "Addition",    defaultActive: true },
    { value: "constSubtraction", label: "Subtraction", defaultActive: false },
  ],
};

const NEG_COUNT_GROUP: ToolMultiSelect = {
  key: "negCount",
  label: "Negative x terms",
  options: [
    { value: "oneNegX",  label: "One −x",  defaultActive: true },
    { value: "bothNegX", label: "Both −x", defaultActive: false },
  ],
};

const SOLUTION_TYPE_GROUP: ToolMultiSelect = {
  key: "solutionType",
  label: "Solution type",
  options: [
    { value: "integerSolution", label: "Integer", defaultActive: true },
    { value: "decimalSolution", label: "Decimal", defaultActive: false },
  ],
};

const SOLUTION_SIGN_GROUP: ToolMultiSelect = {
  key: "solutionSign",
  label: "Solution sign",
  options: [
    { value: "positiveSolution", label: "Positive", defaultActive: true },
    { value: "negativeSolution", label: "Negative", defaultActive: false },
  ],
};

// ── 3. TOOL_CONFIG ────────────────────────────────────────────────────────────

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Solving Linear Equations",

  tools: {
    equations: {
      name: "Unknowns on Both Sides",
      instruction: "Solve:",
      variables: [],
      dropdown: null,
      difficultySettings: {
        level1: { multiSelect: [CONSTANTS_L1_GROUP, X_SIDE_GROUP, SOLUTION_TYPE_GROUP, SOLUTION_SIGN_GROUP] },
        level2: { multiSelect: [BRACKET_SIDE_GROUP, CONSTANT_SIGN_GROUP, SOLUTION_TYPE_GROUP, SOLUTION_SIGN_GROUP] },
        level3: { multiSelect: [NEG_COUNT_GROUP, SOLUTION_TYPE_GROUP, SOLUTION_SIGN_GROUP] },
      },
    },
  },
};

// ── 4. INFO_SECTIONS ──────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  { title: "Standard (Level 1)", icon: "⚖️", content: [
    { label: "Overview",      detail: "Equations of the form ax + b = cx + d. Collect x terms then constants." },
    { label: "Constants",     detail: "Choose whether b and d are both positive, one negative, or both negative." },
    { label: "Solution type", detail: "Restrict generated equations to integer-only or decimal solutions." },
    { label: "Solution sign", detail: "Restrict generated equations to positive-only or negative-only solutions." },
  ]},
  { title: "With Brackets (Level 2)", icon: "🔢", content: [
    { label: "Overview",     detail: "One or both sides contain an expanded bracket, e.g. 2(x + 3) = 3x + 1." },
    { label: "Bracket side", detail: "Control whether the bracket appears on the left, right, or both sides." },
    { label: "Steps",        detail: "Step 1: Expand brackets. Step 2: Reduce x's. Step 3: Isolate constants. Step 4: Divide." },
  ]},
  { title: "Negative x (Level 3)", icon: "➖", content: [
    { label: "Overview",        detail: "Equations where x terms appear with negative coefficients, e.g. 3 − x = 1 + x or 5 − 3x = 2 − x." },
    { label: "One negative x",  detail: "One side has a negative x term, e.g. 10 − 2x = 8 − x." },
    { label: "Both negative x", detail: "Both sides have negative x terms, e.g. 5 − 3x = 2 − x." },
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard",     detail: "Single question on the left, working space on the right. Visualiser available." },
    { label: "Worked Example", detail: "Full step-by-step solution revealed on demand." },
    { label: "Worksheet",      detail: "Grid of questions with PDF export." },
  ]},
];

// ── 5. Helpers ────────────────────────────────────────────────────────────────

void fracStr; void mStr; void pick; void step; void tStep; void fmt;

// Decimals are only allowed if the value is a tenth, quarter, or third (to 6dp precision).
const isAllowedDecimal = (val: number): boolean => {
  if (Number.isInteger(val)) return true;
  const v = Math.abs(val);
  const tenths   = Math.round(v * 10) / 10;
  const quarters = Math.round(v * 4)  / 4;
  const thirds   = Math.round(v * 3)  / 3;
  return (
    Math.abs(v - tenths)   < 0.000001 ||
    Math.abs(v - quarters) < 0.000001 ||
    Math.abs(v - thirds)   < 0.000001
  );
};

// Render a coefficient: returns "" for 1, "-" for -1, else the number string
const coefStr = (n: number): string => n === 1 ? "" : n === -1 ? "-" : `${n}`;

// Build a side of an equation as LaTeX: coef*x + const
// e.g. sideLatex(3, 4)  → "3x + 4"
//      sideLatex(1, -2) → "x - 2"
//      sideLatex(-1, 5) → "-x + 5"
//      sideLatex(2, 0)  → "2x"
const sideLatex = (xCoef: number, constant: number): string => {
  const xPart = `${coefStr(xCoef)}x`;
  if (constant === 0) return xPart;
  if (constant > 0) return `${xPart} + ${constant}`;
  return `${xPart} - ${Math.abs(constant)}`;
};

// Reads a multiSelect flag, falling back when the key isn't present yet
// (only happens on the very first throwaway question generated before mount).
const flagOr = (vals: Record<string, boolean>, key: string, fallback: boolean): boolean =>
  key in vals ? vals[key] : fallback;

// ── 6. Question generators ────────────────────────────────────────────────────

// Attempt to generate a Level 1 question satisfying constraints.
// Returns null if constraints can't be met after attempts.
const tryLevel1 = (
  constants: string,
  allowInteger: boolean,
  allowDecimal: boolean,
  allowPositive: boolean,
  allowNegative: boolean,
  xSide: string,
): AnyQuestion | null => {
  for (let attempt = 0; attempt < 200; attempt++) {
    const xCoef = randInt(1, 5);
    const c = randInt(1, 6);
    const a = c + xCoef;

    let b: number, d: number;
    if (constants === "bothPos") {
      b = randInt(1, 30); d = randInt(1, 30);
    } else if (constants === "oneNeg") {
      if (Math.random() < 0.5) { b = randInt(1, 30); d = -randInt(1, 30); }
      else { b = -randInt(1, 30); d = randInt(1, 30); }
    } else {
      b = -randInt(1, 30); d = -randInt(1, 30);
    }

    const rhs = d - b;
    if (xCoef === 0) continue;

    const xVal = rhs / xCoef;
    const isInteger = Number.isInteger(xVal);
    if (!allowInteger && isInteger) continue;
    if (!allowDecimal && !isInteger) continue;
    if (allowDecimal && !isInteger && !isAllowedDecimal(xVal)) continue;
    if (!allowPositive && xVal > 0) continue;
    if (!allowNegative && xVal < 0) continue;
    if (xVal === 0) continue;

    const xStr = fmt(xVal);
    const id = Math.floor(Math.random() * 1_000_000);

    // lhs = ax + b, rhs side = cx + d (a > c, larger x on left by default)
    // swap display only if xSide === "rhs"
    const swap = xSide === "rhs";
    const lhsLatex = swap ? sideLatex(c, d) : sideLatex(a, b);
    const rhsLatex = swap ? sideLatex(a, b) : sideLatex(c, d);

    const working = [
      mStep("Reduce x's:", `${lhsLatex} = ${rhsLatex} \\rightarrow ${coefStr(xCoef)}x = ${rhs}`),
      mStep("Isolate constant:", `${coefStr(xCoef)}x = ${rhs}`),
      mStep("Divide:", `x = \\frac{${rhs}}{${xCoef}} = ${xStr}`),
    ];

    return {
      kind: "simple",
      display: `${lhsLatex} = ${rhsLatex}`,
      displayLatex: `${lhsLatex} = ${rhsLatex}`,
      answer: `x = ${xStr}`, answerLatex: `x = ${xStr}`,
      working,
      key: `l1-${a}-${b}-${c}-${d}-${xSide}-${id}`,
      difficulty: "level1",
    };
  }
  return null;
};

const tryLevel2 = (
  bracketSide: string,
  allowInteger: boolean,
  allowDecimal: boolean,
  allowPositive: boolean,
  allowNegative: boolean,
  allowPosConst: boolean,
  allowNegConst: boolean,
): AnyQuestion | null => {
  const pickConst = (lo: number, hi: number): number => {
    const usePos = allowPosConst && (!allowNegConst || Math.random() < 0.5);
    return usePos ? randInt(lo, hi) : -randInt(lo, hi);
  };

  // Build bracket latex: m(ax + p) or m(ax - p)
  const bracketLatex = (m: number, a: number, p: number): string => {
    const inner = a === 1 ? "x" : `${a}x`;
    const pSign = p >= 0 ? `+ ${p}` : `- ${Math.abs(p)}`;
    return `${m}(${inner} ${pSign})`;
  };

  for (let attempt = 0; attempt < 200; attempt++) {
    const m  = randInt(2, 5);
    const a  = randInt(1, 6);           // x coefficient inside bracket
    const p  = pickConst(1, 8);
    if (p === 0) continue;

    // After expansion: left = (m*a)x + (m*p)
    const expandedXL = m * a;
    const expandedBL = m * p;

    let c: number, d: number;
    let rightM = 0, rightA = 0, rightP = 0;  // right bracket params

    if (bracketSide === "bracketBoth") {
      rightM = randInt(2, 5);
      rightA = randInt(1, 6);
      rightP = pickConst(1, 8);
      if (rightP === 0) continue;
      c = rightM * rightA;
      d = rightM * rightP;
      if (c === expandedXL) continue;
    } else if (bracketSide === "bracketRight") {
      // plain left, bracket right
      rightM = randInt(2, 5);
      rightA = randInt(1, 6);
      rightP = pickConst(1, 8);
      if (rightP === 0) continue;
      const expandedXR = rightM * rightA;
      const expandedBR = rightM * rightP;
      const leftC = randInt(1, 9);
      const leftD = pickConst(1, 10);
      if (leftD === 0) continue;
      const xCoef2 = leftC - expandedXR;
      if (xCoef2 === 0) continue;
      const rhs2 = expandedBR - leftD;
      const xVal2 = rhs2 / xCoef2;
      const isInt2 = Number.isInteger(xVal2);
      if (!allowInteger && isInt2) continue;
      if (!allowDecimal && !isInt2) continue;
      if (allowDecimal && !isInt2 && !isAllowedDecimal(xVal2)) continue;
      if (!allowPositive && xVal2 > 0) continue;
      if (!allowNegative && xVal2 < 0) continue;
      if (xVal2 === 0) continue;
      const xStr2 = fmt(xVal2);
      const id2 = Math.floor(Math.random() * 1_000_000);
      const leftLatex2 = sideLatex(leftC, leftD);
      const rightLatex2 = bracketLatex(rightM, rightA, rightP);
      const expandedRight2 = sideLatex(expandedXR, expandedBR);
      return {
        kind: "simple",
        display: `${leftLatex2} = ${rightLatex2}`,
        displayLatex: `${leftLatex2} = ${rightLatex2}`,
        answer: `x = ${xStr2}`, answerLatex: `x = ${xStr2}`,
        working: [
          mStep("Expand brackets:", `${leftLatex2} = ${rightLatex2} \\rightarrow ${leftLatex2} = ${expandedRight2}`),
          mStep("Reduce x's:", `${leftLatex2} = ${expandedRight2} \\rightarrow ${coefStr(xCoef2)}x = ${rhs2}`),
          mStep("Isolate constant:", `${coefStr(xCoef2)}x = ${rhs2}`),
          mStep("Divide:", `x = \\frac{${rhs2}}{${xCoef2}} = ${xStr2}`),
        ],
        key: `l2r-${leftC}-${leftD}-${rightM}-${rightA}-${rightP}-${id2}`, difficulty: "level2",
      };
    } else {
      // left bracket only, plain right
      c = randInt(1, expandedXL + 3);
      if (c === expandedXL) continue;
      d = pickConst(1, 10);
      if (d === 0) continue;
    }

    const xCoef = expandedXL - c;
    if (xCoef === 0) continue;
    const rhs = d - expandedBL;

    const xVal = rhs / xCoef;
    const isInteger = Number.isInteger(xVal);
    if (!allowInteger && isInteger) continue;
    if (!allowDecimal && !isInteger) continue;
    if (allowDecimal && !isInteger && !isAllowedDecimal(xVal)) continue;
    if (!allowPositive && xVal > 0) continue;
    if (!allowNegative && xVal < 0) continue;
    if (xVal === 0) continue;

    const xStr = fmt(xVal);
    const id = Math.floor(Math.random() * 1_000_000);

    const leftLatex = bracketLatex(m, a, p);
    const rightLatex = bracketSide === "bracketBoth" ? bracketLatex(rightM, rightA, rightP) : sideLatex(c, d);

    const expandedLeft = sideLatex(expandedXL, expandedBL);
    const expandedRight = sideLatex(c, d);

    const working = [
      mStep("Expand brackets:", `${leftLatex} = ${rightLatex} \\rightarrow ${expandedLeft} = ${expandedRight}`),
      mStep("Reduce x's:", `${expandedLeft} = ${expandedRight} \\rightarrow ${coefStr(xCoef)}x = ${rhs}`),
      mStep("Isolate constant:", `${coefStr(xCoef)}x = ${rhs}`),
      mStep("Divide:", `x = \\frac{${rhs}}{${xCoef}} = ${xStr}`),
    ];

    return {
      kind: "simple",
      display: `${leftLatex} = ${rightLatex}`,
      displayLatex: `${leftLatex} = ${rightLatex}`,
      answer: `x = ${xStr}`, answerLatex: `x = ${xStr}`,
      working,
      key: `l2-${m}-${a}-${p}-${c}-${d}-${id}`,
      difficulty: "level2",
    };
  }
  return null;
};

const tryLevel3 = (
  negCount: string,
  allowInteger: boolean,
  allowDecimal: boolean,
  allowPositive: boolean,
  allowNegative: boolean,
): AnyQuestion | null => {
  for (let attempt = 0; attempt < 200; attempt++) {
    let a: number, b: number, c: number, d: number;

    if (negCount === "oneNegX") {
      a = randInt(1, 5);
      c = randInt(1, 5);
      b = randInt(2, 15);
      d = randInt(-8, 8);
      if (d === b) continue;

      const xCoef = a + c;
      const rhs = b - d;
      const xVal = rhs / xCoef;
      const isInteger = Number.isInteger(xVal);
      if (!allowInteger && isInteger) continue;
      if (!allowDecimal && !isInteger) continue;
      if (allowDecimal && !isInteger && !isAllowedDecimal(xVal)) continue;
      if (!allowPositive && xVal > 0) continue;
      if (!allowNegative && xVal < 0) continue;
      if (xVal === 0) continue;

      const xStr = fmt(xVal);
      const id = Math.floor(Math.random() * 1_000_000);
      const leftDisplay = `${b} - ${a === 1 ? "" : a}x`;
      const rightDisplay = sideLatex(c, d);
      const working = [
        mStep("Reduce x's:", `${leftDisplay} = ${rightDisplay} \\rightarrow ${b} ${d >= 0 ? `- ${d}` : `+ ${Math.abs(d)}`} = ${c === 1 ? "" : c}x + ${a === 1 ? "" : a}x`),
        mStep("Isolate constant:", `${rhs} = ${xCoef === 1 ? "" : xCoef}x`),
        mStep("Divide:", `x = \\frac{${rhs}}{${xCoef}} = ${xStr}`),
      ];
      return {
        kind: "simple", display: `${leftDisplay} = ${rightDisplay}`, displayLatex: `${leftDisplay} = ${rightDisplay}`,
        answer: `x = ${xStr}`, answerLatex: `x = ${xStr}`,
        working, key: `l3-one-${a}-${b}-${c}-${d}-${id}`, difficulty: "level3",
      };

    } else {
      a = randInt(1, 5);
      c = randInt(1, 5);
      if (a === c) continue;
      b = randInt(2, 15);
      d = randInt(2, 15);
      if (b === d) continue;

      const xCoef = c - a;
      const rhs = d - b;
      if (xCoef === 0) continue;
      const xVal = rhs / xCoef;
      const isInteger = Number.isInteger(xVal);
      if (!allowInteger && isInteger) continue;
      if (!allowDecimal && !isInteger) continue;
      if (allowDecimal && !isInteger && !isAllowedDecimal(xVal)) continue;
      if (!allowPositive && xVal > 0) continue;
      if (!allowNegative && xVal < 0) continue;
      if (xVal === 0) continue;

      const xStr = fmt(xVal);
      const id = Math.floor(Math.random() * 1_000_000);
      const leftDisplay = `${b} - ${a === 1 ? "" : a}x`;
      const rightDisplay = `${d} - ${c === 1 ? "" : c}x`;
      const working = [
        mStep("Reduce x's:", `${leftDisplay} = ${rightDisplay} \\rightarrow ${b - d} = ${a === 1 ? "" : a}x - ${c === 1 ? "" : c}x`),
        mStep("Isolate constant:", `${b - d} = ${xCoef === 1 ? "" : xCoef === -1 ? "-" : xCoef}x`),
        mStep("Divide:", `x = \\frac{${b - d}}{${xCoef}} = ${xStr}`),
      ];
      return {
        kind: "simple", display: `${leftDisplay} = ${rightDisplay}`, displayLatex: `${leftDisplay} = ${rightDisplay}`,
        answer: `x = ${xStr}`, answerLatex: `x = ${xStr}`,
        working, key: `l3-both-${a}-${b}-${c}-${d}-${id}`, difficulty: "level3",
      };
    }
  }
  return null;
};

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  _variables: Record<string, boolean>,
  _dropdownValue: string,
  multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  void (tool as ToolType);
  const msv = multiSelectValues;

  const allowInteger  = flagOr(msv, "integerSolution",   true);
  const allowDecimal  = flagOr(msv, "decimalSolution",   false);
  const allowPositive = flagOr(msv, "positiveSolution",  true);
  const allowNegative = flagOr(msv, "negativeSolution",  false);

  const id = Math.floor(Math.random() * 1_000_000);

  if (level === "level1") {
    const constants = pickActive(msv, CONSTANTS_L1_GROUP.options);
    const xSide = pickActive(msv, X_SIDE_GROUP.options); // "lhs" or "rhs"
    return tryLevel1(constants, allowInteger, allowDecimal, allowPositive, allowNegative, xSide) ?? {
      kind: "simple", display: "3x + 4 = x + 10", displayLatex: "3x + 4 = x + 10",
      answer: "x = 3", answerLatex: "x = 3",
      working: [mStep("Reduce x's:", "3x + 4 = x + 10 \\rightarrow 2x + 4 = 10"), mStep("Isolate constant:", "2x = 6"), mStep("Divide:", "x = 3")],
      key: `l1-fallback-${id}`, difficulty: "level1",
    };
  }

  if (level === "level2") {
    const bracketSide = pickActive(msv, BRACKET_SIDE_GROUP.options);
    const allowPosConst = flagOr(msv, "constAddition", true);
    const allowNegConst = flagOr(msv, "constSubtraction", false);
    return tryLevel2(bracketSide, allowInteger, allowDecimal, allowPositive, allowNegative, allowPosConst, allowNegConst) ?? {
      kind: "simple", display: "2(x + 3) = 3x + 1", displayLatex: "2(x + 3) = 3x + 1",
      answer: "x = 5", answerLatex: "x = 5",
      working: [mStep("Expand brackets:", "2(x + 3) = 3x + 1 \\rightarrow 2x + 6 = 3x + 1"), mStep("Reduce x's:", "2x + 6 = 3x + 1 \\rightarrow 6 - 1 = 3x - 2x"), mStep("Isolate constant:", "5 = x"), mStep("Divide:", "x = 5")],
      key: `l2-fallback-${id}`, difficulty: "level2",
    };
  }

  // level3
  const negCount = pickActive(msv, NEG_COUNT_GROUP.options);
  return tryLevel3(negCount, allowInteger, allowDecimal, allowPositive, allowNegative) ?? {
    kind: "simple", display: "10 - 2x = 8 - x", displayLatex: "10 - 2x = 8 - x",
    answer: "x = 2", answerLatex: "x = 2",
    working: [mStep("Reduce x's:", "10 - 2x = 8 - x \\rightarrow 10 - 8 = 2x - x"), mStep("Isolate constant:", "2 = x"), mStep("Divide:", "x = 2")],
    key: `l3-fallback-${id}`, difficulty: "level3",
  };
};

// ── 7. generateUniqueQ ────────────────────────────────────────────────────────

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
  do { q = generateQuestion(tool, level, variables, dropdownValue, multiSelectValues); attempts++; }
  while (usedKeys.has(q.key) && attempts < 100);
  usedKeys.add(q.key);
  return q;
};

// ═══════════════════════════════════════════════════════════════════════════════
// END OF TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

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
