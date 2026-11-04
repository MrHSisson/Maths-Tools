import { estimationWorking, roundEstimationOperand as roundTo1SF } from "../../shared/estimationWorking";
import {
  ToolShell,
  type ToolConfig,
  type DifficultyLevel,
  type AnyQuestion,
  mStep,
  pickActive,
  formatNumber,
  texNumber,
} from "../../shared";
import { applyAbout } from "../../shared";
import { ABOUT } from "./Estimation.about";
import { ESTIMATION_DEPTH } from "./EstimationDepth";
import { ORDER_OPTIONS, generateOrder } from "./EstimationOrder";

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. Types ──────────────────────────────────────────────────────────────────

type ToolType = "estimation" | "orderOfOperations";

// ── 2. TOOL_CONFIG ────────────────────────────────────────────────────────────

const OPERATION_MULTISELECT = {
  key: "operation", tab: "questions" as const,
  label: "Operations",
  options: [
    { value: "add",      label: "Addition (+)",       defaultActive: true },
    { value: "subtract", label: "Subtraction (−)",    defaultActive: true },
    { value: "multiply", label: "Multiplication (×)", defaultActive: true },
    { value: "divide",   label: "Division (÷)",       defaultActive: true },
  ],
};

/** Level 2: which kind of number a question uses. Each question uses exactly one, so this is a pool (R19). */
const NUMBER_MULTISELECT = {
  key: "l2numbers", tab: "questions" as const,
  label: "Sizes Of Number",
  options: [
    { value: "num-mixed",      label: "Tenths (e.g. 4.8 and 0.39)",        defaultActive: true },
    { value: "num-below1",     label: "Both Below 1 (e.g. 0.38 and 0.72)", defaultActive: true },
    { value: "num-hundredths", label: "Hundredths (e.g. 0.048)",           defaultActive: true },
    { value: "num-whole",      label: "Whole Numbers",                      defaultActive: true },
  ],
};

const LEVEL3_MULTISELECT = {
  key: "l3type", tab: "questions" as const,
  label: "Question Types",
  options: [
    { value: "fracbar",  label: "Fraction Bar",    defaultActive: true },
    { value: "fracterm", label: "Fraction + Term", defaultActive: true },
  ],
};

const orderPool = (level: string) => ({ key: ORDER_OPTIONS[level].key, tab: "questions" as const, label: "Question Types", options: ORDER_OPTIONS[level].options });

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
        level2: { multiSelect: [OPERATION_MULTISELECT, NUMBER_MULTISELECT] },
        level3: {
          multiSelect: LEVEL3_MULTISELECT,
          variables: [
            { key: "bothSidesExpr", tab: "questions" as const, label: "Both sides can have expression", defaultValue: false },
          ],
        },
      },
    },
    orderOfOperations: {
      name: "Order of Operations",
      variables: [],
      dropdown: null,
      multiSelect: orderPool("level1"),
      difficultySettings: {
        level1: { multiSelect: orderPool("level1") },
        level2: { multiSelect: orderPool("level2") },
        level3: { multiSelect: orderPool("level3") },
      },
    },
  },
};


// ── 4. Math helpers ───────────────────────────────────────────────────────────

const isAlreadyRounded = (num: number): boolean => {
  if (num === 0) return true;
  return Number(num.toPrecision(1)) === num;   // 0.3 and 0.07 count as rounded (dividing by 0.1 or 0.01 does not, in floating point)
};

/** Every valid division of a level, grouped by its estimated answer. Picking an answer first, then a pair that gives it,
 *  spreads the answers across the times tables; picking random numbers and keeping those that divide piles them on 10 and 5. */
type DivisionPair = [number, number];
const addPair = (m: Map<number, DivisionPair[]>, answer: number, pair: DivisionPair) => { const list = m.get(answer); if (list) list.push(pair); else m.set(answer, [pair]); };
/** 65% of the time an answer from the 2 to 12 times tables, otherwise any other answer the level can give. */
const pickDivision = (m: Map<number, DivisionPair[]>): DivisionPair => {
  const answers = [...m.keys()].filter((a) => a > 1);
  const table = answers.filter((a) => a <= 12), other = answers.filter((a) => a > 12);
  const pool = table.length && (other.length === 0 || Math.random() < 0.65) ? table : other;
  const list = m.get(pool[Math.floor(Math.random() * pool.length)])!;
  return list[Math.floor(Math.random() * list.length)];
};
const awkwardLeadingDigits = (n: number): boolean => {
  const s = String(n);
  return s[0] === "5" || (s[0] === "9" && s[1] >= "5");
};
let level1Divisions: Map<number, DivisionPair[]> | null = null;
const getLevel1Divisions = () => {
  if (level1Divisions) return level1Divisions;
  const m = new Map<number, DivisionPair[]>();
  for (let n2 = 10; n2 <= 99; n2++) {
    if (isAlreadyRounded(n2) || awkwardLeadingDigits(n2)) continue;
    for (let n1 = 10; n1 <= 999; n1++) {
      if (isAlreadyRounded(n1) || awkwardLeadingDigits(n1)) continue;
      const r1 = roundTo1SF(n1), r2 = roundTo1SF(n2), answer = r1 / r2;
      if (Number.isInteger(answer) && answer > 0 && answer < 10000) addPair(m, answer, [n1, n2]);
    }
  }
  return (level1Divisions = m);
};
let level2Divisions: { decimal: Map<number, DivisionPair[]>; whole: Map<number, DivisionPair[]> } | null = null;
const getLevel2Divisions = () => {
  if (level2Divisions) return level2Divisions;
  const decimal = new Map<number, DivisionPair[]>(), whole = new Map<number, DivisionPair[]>();
  const add = (m: Map<number, DivisionPair[]>, n1: number, n2: number) => {
    if (isAlreadyRounded(n1) || isAlreadyRounded(n2)) return;
    const r1 = roundTo1SF(n1), r2 = roundTo1SF(n2);
    if (r1 === 0 || r2 === 0) return;
    const answer = Math.round((r1 / r2) * 10) / 10;
    if (Math.abs(r1 / r2 - answer) > 0.0001 || answer <= 0 || answer >= 10000) return;
    addPair(m, answer, [n1, n2]);
  };
  for (let a = 10; a <= 100; a++) for (let b = 10; b <= 99; b++) add(decimal, a / 10, b / 100);     // decimals: 1.0 to 10.0 by a number below 1
  for (let a = 10; a <= 108; a++) for (let b = 10; b <= 108; b++) add(whole, a, b);                  // whole numbers
  return (level2Divisions = { decimal, whole });
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
const fmtK = texNumber;

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
      [num1, num2] = pickDivision(getLevel1Divisions());
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
      working: estimationWorking(`${fmtK(num1)} ${latexSym} ${fmtK(num2)}`, `${fmtK(num1)} \\to ${fmtK(r1)}, \\quad ${fmtK(num2)} \\to ${fmtK(r2)}`, [
        mStep("Calculate:",       `${fmtK(r1)} ${latexSym} ${fmtK(r2)} = ${fmtK(answer)}`),
      ]),
      key: `est-l1-${op}-${num1}-${num2}-${id}`,
      difficulty: "level1",
    };
  }
  return {
    kind: "simple",
    display: "82 × 31",
    displayLatex: "82 \\times 31",
    answer: "2,400",
    working: estimationWorking("82 \\times 31", "82 \\to 80, \\quad 31 \\to 30", [
      mStep("Calculate:",       "80 \\times 30 = 2{,}400"),
      ]),
    key: `est-l1-fallback-${Math.floor(Math.random() * 1_000_000)}`,
    difficulty: "level1",
  };
};

// ── 6. Level 2 generator ──────────────────────────────────────────────────────

/** A decimal below 1 whose first significant figure is the `tenths` or the hundredths digit, with a second digit (never a multiple of
 *  10 of its place, never a leading 9 rounding up): 0.38, 0.72 or 0.048, 0.082. Built from digits, so there is no floating-point drift. */
const smallDecimal = (hundredths: boolean): number => {
  for (;;) {
    const d1 = 1 + Math.floor(Math.random() * 9), d2 = 1 + Math.floor(Math.random() * 9);
    if (d1 === 9 && d2 >= 5) continue;
    return Number(((d1 * 10 + d2) / (hundredths ? 1000 : 100)).toFixed(3));
  }
};
/** A tenths-scale partner for a hundredths number: 3.7, 0.62 or 14.6. */
const partnerDecimal = (): number => {
  const pick = Math.random();
  if (pick < 0.4) return smallDecimal(false);
  const whole = 1 + Math.floor(Math.random() * 9), tenth = 1 + Math.floor(Math.random() * 9);
  return Number((whole + tenth / 10).toFixed(1)) * (pick < 0.7 ? 1 : 10);
};
const hasAtMost2SF = (q: number) => Number(q.toPrecision(2)) === Number(q.toPrecision(12));

/** The two numbers for the "Both Below 1" and "Hundredths" number types. Division keeps only pairs whose estimate is a short, exact decimal. */
const pickSmallDecimals = (kind: string, op: string): [number, number] | null => {
  const draw = (): [number, number] => {
    if (kind === "num-below1") return [smallDecimal(false), smallDecimal(false)];
    const small = smallDecimal(true), other = Math.random() < 0.3 ? smallDecimal(true) : partnerDecimal();
    return Math.random() < 0.5 ? [small, other] : [other, small];
  };
  for (let i = 0; i < 60; i++) {
    const [a, b] = draw();
    if (a === b || isAlreadyRounded(a) || isAlreadyRounded(b)) continue;
    const r1 = roundTo1SF(a), r2 = roundTo1SF(b);
    if (op === "subtract" && r1 <= r2) continue;
    if (op === "divide") {
      const q = r1 / r2;
      if (!hasAtMost2SF(q) || q < 0.01 || q >= 10000 || r1 === r2) continue;
    }
    return [a, b];
  }
  return null;
};

/** An estimate shown without float noise or an exponent: 0.012, 0.45, 2.5, 1,200. */
const formatEstimate = (n: number): string => {
  const v = Number(n.toPrecision(12));
  return Math.abs(v) >= 1000 ? formatNumber(Math.round(v)) : String(v);
};

const generateLevel2 = (op: string, numberType = "num-mixed"): AnyQuestion => {
  for (let att = 0; att < 50; att++) {
    const small = numberType === "num-below1" || numberType === "num-hundredths";
    const useDecimals = numberType === "num-mixed" || (numberType !== "num-whole" && !small);
    let num1 = 0, num2 = 0;
    if (small) {
      const pair = pickSmallDecimals(numberType, op);
      if (!pair) continue;
      [num1, num2] = pair;
    } else if (op === "divide") {
      [num1, num2] = pickDivision(getLevel2Divisions()[useDecimals ? "decimal" : "whole"]);
    } else if (useDecimals) {
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
        num1 = Math.floor(Math.random() * 890) + 12;
        num2 = Math.floor(Math.random() * 890) + 12;
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
    if (small) answer = Number(answer.toPrecision(12));
    else {
      const ans1dp = Math.round(answer * 10) / 10;
      if (Math.abs(answer - ans1dp) > 0.0001) continue;
      answer = ans1dp;
    }
    if (answer <= 0 || answer >= 10000 || isNaN(answer)) continue;
    const fa = small ? formatEstimate(answer) : answer >= 1000 ? formatNumber(Math.round(answer)) : Number.isInteger(answer) ? formatNumber(answer) : answer.toFixed(1);
    const sym = getOpSym(op);
    const latexSym = getOpLatex(op);
    const id = Math.floor(Math.random() * 1_000_000);
    return {
      kind: "simple",
      display: `${formatNumber(num1)} ${sym} ${formatNumber(num2)}`,
      displayLatex: `${fmtK(num1)} ${latexSym} ${fmtK(num2)}`,
      answer: fa,
      working: estimationWorking(`${fmtK(num1)} ${latexSym} ${fmtK(num2)}`, `${fmtK(num1)} \\to ${fmtK(r1)}, \\quad ${fmtK(num2)} \\to ${fmtK(r2)}`, [
        mStep("Calculate:",       `${fmtK(r1)} ${latexSym} ${fmtK(r2)} = ${fa.replace(/,/g, "{,}")}`),
      ]),
      key: `est-l2-${op}-${num1}-${num2}-${id}`,
      difficulty: "level2",
    };
  }
  return {
    kind: "simple",
    display: "42 × 1.9",
    displayLatex: "42 \\times 1.9",
    answer: "80",
    working: estimationWorking("42 \\times 1.9", "42 \\to 40, \\quad 1.9 \\to 2", [
      mStep("Calculate:",       "40 \\times 2 = 80"),
      ]),
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
    working: estimationWorking(`\\dfrac{${toLatex(numWorkRaw)}}{${toLatex(denWorkRaw)}}`, roundLatex, [
      ...(numExpr ? [mStep("Numerator:",   `${toLatex(numWorkRnd)} = ${numVal}`)] : []),
      ...(denExpr ? [mStep("Denominator:", `${toLatex(denWorkRnd)} = ${denVal}`)] : []),
      mStep("Calculate:",       `${numVal} \\div ${denVal} = ${formattedAnswer}`),
      ]),
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
      if (op === "subtract" && fracR >= rOuter) continue;   // a subtraction is term − fraction: the fraction is always under 10, so the other way round could never be positive
    }

    let answer: number;
    if (op === "add") answer = fracR + rOuter;
    else if (op === "subtract") answer = rOuter - fracR;
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
      display: op === "subtract" ? `${outerStr} ${sym} ${fNum}/${fDen}` : `${fNum}/${fDen} ${sym} ${outerStr}`,
      displayLatex: op === "subtract" ? `${outerStr} ${latexSym} \\dfrac{${fNum}}{${fDen}}` : `\\dfrac{${fNum}}{${fDen}} ${latexSym} ${outerStr}`,
      answer: formattedAnswer,
      working: estimationWorking(op === "subtract" ? `${outerStr} ${latexSym} \\dfrac{${fNum}}{${fDen}}` : `\\dfrac{${fNum}}{${fDen}} ${latexSym} ${outerStr}`, `${fNum} \\to ${rFNum}, \\quad ${fDen} \\to ${rFDen}, \\quad ${outerStr} \\to ${rOuterStr}`, [
        mStep("Fraction:",        `${rFNum} \\div ${rFDen} = ${fracValStr}`),
        mStep("Calculate:",       op === "subtract" ? `${rOuterStr} ${latexSym} ${fracValStr} = ${formattedAnswer}` : `${fracValStr} ${latexSym} ${rOuterStr} = ${formattedAnswer}`),
      ]),
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
    working: estimationWorking("\\dfrac{34 + 21}{11}", "34 \\to 30, \\; 21 \\to 20, \\; 11 \\to 10", [
      mStep("Numerator:",       "(30 + 20) = 50"),
      mStep("Calculate:",       "50 \\div 10 = 5"),
      ]),
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
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  _dropdownValue: string,
  multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  if ((tool as ToolType) === "orderOfOperations") return generateOrder(level, multiSelectValues);
  if (level === "level1") return generateLevel1(pickActive(multiSelectValues, OPERATION_MULTISELECT.options));
  if (level === "level2") return generateLevel2(pickActive(multiSelectValues, OPERATION_MULTISELECT.options), pickActive(multiSelectValues, NUMBER_MULTISELECT.options));
  return generateLevel3(pickActive(multiSelectValues, LEVEL3_MULTISELECT.options), !!variables["bothSidesExpr"]);
};


// ═══════════════════════════════════════════════════════════════════════════════
// END OF TOOL-SPECIFIC SECTION
// ═══════════════════════════════════════════════════════════════════════════════

// Exposed for the generator smoke-test suite (src/tests/generators.test.ts).
applyAbout(TOOL_CONFIG, ABOUT);

export const __test = { TOOL_CONFIG, generateQuestion, depthItems: ESTIMATION_DEPTH };

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      generateQuestion={generateQuestion}
      defaults={{ hideAnswerStep: true }}
      depthItems={ESTIMATION_DEPTH}
    />
  );
}
