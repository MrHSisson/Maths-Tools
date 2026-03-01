import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Eye, ChevronUp, ChevronDown, Home, Menu, X } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// ToolShell v1.5.1  —  Estimation Tool
// ─────────────────────────────────────────────────────────────────────────────

// ── TYPES ────────────────────────────────────────────────────────────────────

type ColorScheme = 'default' | 'blue' | 'pink' | 'yellow';
type DifficultyLevel = 'level1' | 'level2' | 'level3';
type Mode = 'whiteboard' | 'single' | 'worksheet';

type WorkingStep = { type: string; content: string };

// displayType controls how the question is rendered visually:
//   'text'     — plain inline text (levels 1 & 2)
//   'fraction' — a stacked fraction bar, possibly with a suffix/prefix term
type DisplayType = 'text' | 'fraction';

type Question = {
  display: string;           // flat text fallback / used in working steps
  displayType: DisplayType;
  fracNumerator?: string;    // e.g. "34 + 21" or "82"
  fracDenominator?: string;  // e.g. "11" or "13 + 27"
  answer: string;
  working: WorkingStep[];
  values: Record<string, unknown>;
  difficulty: string;
};

type VariableConfig = { key: string; label: string; defaultValue: boolean };

type DropdownOption = {
  value: string;
  label: string;
  sub?: string;
};

type DropdownConfig = {
  key: string;
  label: string;
  options: DropdownOption[];
  defaultValue: string;
  useTwoLineButtons?: boolean;
};

type DifficultySettings = {
  dropdown?: DropdownConfig;
  variables?: VariableConfig[];
};

type ToolSettings = {
  name: string;
  useSubstantialBoxes: boolean;
  variables: VariableConfig[];
  dropdown: DropdownConfig | null;
  difficultySettings: Record<string, DifficultySettings> | null;
};

type InfoItem = { label: string; detail: string };
type InfoSection = { title: string; icon: string; content: InfoItem[] };

// ── STEP 1: TOOL_CONFIG ──────────────────────────────────────────────────────

const OPERATION_DROPDOWN: DropdownConfig = {
  key: 'operation',
  label: 'Operation',
  options: [
    { value: 'mixed',    label: 'Mixed' },
    { value: 'add',      label: 'Addition (+)' },
    { value: 'subtract', label: 'Subtraction (−)' },
    { value: 'multiply', label: 'Multiplication (×)' },
    { value: 'divide',   label: 'Division (÷)' },
  ],
  defaultValue: 'mixed',
};

const LEVEL3_DROPDOWN: DropdownConfig = {
  key: 'l3type',
  label: 'Question Type',
  useTwoLineButtons: true,
  options: [
    { value: 'mixed',    label: 'Mixed',           sub: 'All types' },
    { value: 'fracbar',  label: 'Fraction Bar',    sub: 'expr / expr' },
    { value: 'fracterm', label: 'Fraction + Term', sub: 'a/b ± c  or  a/b × c' },
  ],
  defaultValue: 'mixed',
};

const TOOL_CONFIG: {
  pageTitle: string;
  useGraphicalLayout: boolean;
  tools: Record<string, ToolSettings>;
} = {
  pageTitle: 'Estimation',
  useGraphicalLayout: false,
  tools: {
    estimation: {
      name: 'Estimation',
      useSubstantialBoxes: false,
      variables: [],
      dropdown: OPERATION_DROPDOWN,
      difficultySettings: {
        level1: { dropdown: OPERATION_DROPDOWN },
        level2: { dropdown: OPERATION_DROPDOWN },
        level3: {
          dropdown: LEVEL3_DROPDOWN,
          variables: [
            { key: 'bothSidesExpr', label: 'Both sides can have expression', defaultValue: false },
          ],
        },
      },
    },
  },
};

// ── STEP 2: ToolType ─────────────────────────────────────────────────────────
type ToolType = 'estimation';

// ── STEP 3: INFO_SECTIONS ────────────────────────────────────────────────────
const INFO_SECTIONS: InfoSection[] = [
  {
    title: 'Estimation', icon: '🔢',
    content: [
      { label: 'Overview', detail: 'Practice estimating answers by rounding each number to 1 significant figure before calculating.' },
      { label: 'Level 1 — Green', detail: 'Two whole numbers, single operation. Numbers between 10 and 999.' },
      { label: 'Level 2 — Yellow', detail: 'Two numbers including decimals, single operation.' },
      { label: 'Level 3 — Red', detail: 'Fraction-based questions requiring estimation and simplification. Use Question Options to choose the type.' },
    ],
  },
  {
    title: 'Level 3 Question Types', icon: '➗',
    content: [
      { label: 'Fraction Bar', detail: 'A self-contained stacked fraction. By default only one side has a two-number expression (e.g. (34 + 21) / 11 or 82 / (4 × 13)). Enable "Both sides can have expression" in Question Options to allow expressions on both numerator and denominator.' },
      { label: 'Fraction + Term', detail: 'A simple fraction displayed inline, combined with a separate whole number using +, − or ×, e.g. 32/12 + 48 or 32/12 × 5. Round all numbers to 1 s.f., evaluate the fraction first, then combine with the outer term.' },
    ],
  },
  {
    title: 'Modes', icon: '🖥️',
    content: [
      { label: 'Whiteboard', detail: 'Single large question with blank working space. Ideal for whole-class teaching.' },
      { label: 'Worked Example', detail: 'Question with step-by-step solution revealed on demand.' },
      { label: 'Worksheet', detail: 'Grid of questions with adjustable columns and count.' },
    ],
  },
  {
    title: 'Differentiated Worksheet', icon: '📋',
    content: [
      { label: 'What it does', detail: 'Generates three colour-coded columns — one per difficulty level.' },
      { label: 'Layout', detail: 'Level 1 (green), Level 2 (yellow), Level 3 (red) side by side on one sheet.' },
    ],
  },
];

// ── LEVEL CONSTANTS ───────────────────────────────────────────────────────────

const LV_LABELS: Record<DifficultyLevel, string> = {
  level1: 'Level 1',
  level2: 'Level 2',
  level3: 'Level 3',
};

const LV_HEADER_COLORS: Record<DifficultyLevel, string> = {
  level1: 'text-green-600',
  level2: 'text-yellow-500',
  level3: 'text-red-600',
};

const LV_COLORS: Record<DifficultyLevel, { bg: string; border: string; text: string; fill: string; activeBg: string; activeText: string }> = {
  level1: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700', fill: '#dcfce7', activeBg: 'bg-green-600', activeText: 'text-white' },
  level2: { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-700', fill: '#fef9c3', activeBg: 'bg-yellow-500', activeText: 'text-white' },
  level3: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700', fill: '#fee2e2', activeBg: 'bg-red-600', activeText: 'text-white' },
};

// ── STEP 4: generateQuestion ─────────────────────────────────────────────────

const formatNumber = (num: number | string): string => {
  if (typeof num === 'string') num = parseFloat(num);
  if (num >= 1000) return num.toLocaleString('en-US');
  return num.toString();
};

const isAlreadyRounded = (num: number): boolean => {
  if (num === 0) return true;
  const magnitude = Math.floor(Math.log10(Math.abs(num)));
  const factor = Math.pow(10, magnitude);
  return Number.isInteger(num / factor);
};

const roundTo1SF = (num: number): number => {
  if (num === 0) return 0;
  const magnitude = Math.floor(Math.log10(Math.abs(num)));
  const factor = Math.pow(10, magnitude);
  const rounded = Math.round(num / factor) * factor;
  const decimalPlaces = Math.max(0, -magnitude + 1);
  return Number(rounded.toFixed(decimalPlaces));
};

const getOperationSymbol = (op: string): string => {
  const symbols: { [key: string]: string } = { add: '+', subtract: '−', multiply: '×', divide: '÷' };
  return symbols[op] || op;
};

const formatAnswer = (n: number): string => {
  const r = Math.round(n * 10) / 10;
  if (Number.isInteger(r)) return formatNumber(r);
  return r.toFixed(1);
};

// ── Level 1 ──

const generateLevel1 = (forcedOperation: string | null = null): Question => {
  const operations: string[] = forcedOperation ? [forcedOperation] : ['add', 'subtract', 'multiply', 'divide'];
  let attempts = 0;
  while (attempts < 50) {
    attempts++;
    const operation = operations[Math.floor(Math.random() * operations.length)];
    let num1 = 0, num2 = 0;
    if (operation === 'multiply') {
      if (Math.random() > 0.3) { num1 = Math.floor(Math.random() * 90) + 10; num2 = Math.floor(Math.random() * 90) + 10; }
      else { num1 = Math.floor(Math.random() * 290) + 10; num2 = Math.floor(Math.random() * 90) + 10; }
    } else if (operation === 'divide') {
      num2 = Math.floor(Math.random() * 90) + 10;
      num1 = num2 * (Math.floor(Math.random() * 9) + 2) + Math.floor(Math.random() * (num2 * 0.3));
    } else {
      num1 = Math.random() > 0.5 ? Math.floor(Math.random() * 90) + 10 : Math.floor(Math.random() * 890) + 10;
      num2 = Math.random() > 0.5 ? Math.floor(Math.random() * 90) + 10 : Math.floor(Math.random() * 890) + 10;
    }
    if (isAlreadyRounded(num1) || isAlreadyRounded(num2)) continue;
    const fd1 = parseInt(num1.toString()[0]), fd2 = parseInt(num2.toString()[0]);
    if (fd1 === 5 || fd2 === 5) continue;
    if (fd1 === 9 && num1.toString()[1] >= '5') continue;
    if (fd2 === 9 && num2.toString()[1] >= '5') continue;
    const r1 = roundTo1SF(num1), r2 = roundTo1SF(num2);
    let answer = 0;
    if (operation === 'add') answer = r1 + r2;
    else if (operation === 'subtract') { if (r1 <= r2) continue; answer = r1 - r2; }
    else if (operation === 'multiply') answer = r1 * r2;
    else { if (r2 === 0) continue; answer = r1 / r2; }
    if (!Number.isInteger(answer)) continue;
    if (answer > 0 && answer < 10000) {
      const sym = getOperationSymbol(operation);
      return {
        display: `${formatNumber(num1)} ${sym} ${formatNumber(num2)}`, displayType: 'text',
        answer: formatNumber(answer),
        working: [
          { type: 'step', content: `Original: ${formatNumber(num1)} ${sym} ${formatNumber(num2)}` },
          { type: 'step', content: `Round to 1 s.f.: ${formatNumber(num1)} → ${formatNumber(r1)},  ${formatNumber(num2)} → ${formatNumber(r2)}` },
          { type: 'step', content: `Calculate: ${formatNumber(r1)} ${sym} ${formatNumber(r2)} = ${formatNumber(answer)}` },
        ],
        values: { num1, num2, operation, id: Math.random() }, difficulty: 'level1',
      };
    }
  }
  return { display: '80 × 30', displayType: 'text', answer: '2,400', working: [{ type: 'step', content: '80 × 30 = 2,400' }], values: { id: Math.random() }, difficulty: 'level1' };
};

// ── Level 2 ──

const generateLevel2 = (forcedOperation: string | null = null): Question => {
  const operations: string[] = forcedOperation ? [forcedOperation] : ['add', 'subtract', 'multiply', 'divide'];
  let attempts = 0;
  while (attempts < 50) {
    attempts++;
    const useDecimals = Math.random() > 0.3;
    let num1 = 0, num2 = 0;
    const operation = operations[Math.floor(Math.random() * operations.length)];
    if (useDecimals) {
      if (operation === 'multiply' || operation === 'divide') {
        num1 = Math.round((Math.random() * 9 + 1) * 10) / 10;
        num2 = Math.round((Math.random() * 0.89 + 0.1) * 100) / 100;
      } else {
        const mag = Math.pow(10, Math.floor(Math.random() * 2));
        num1 = Math.round((Math.random() * 9 + 1) * mag * 10) / 10;
        num2 = Math.round((Math.random() * 9 + 1) * mag * 10) / 10;
      }
    } else {
      if (operation === 'add' || operation === 'subtract') {
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
    if (operation === 'add') answer = r1 + r2;
    else if (operation === 'subtract') { if (r1 <= r2) continue; answer = r1 - r2; }
    else if (operation === 'multiply') answer = r1 * r2;
    else { if (r2 === 0) continue; answer = r1 / r2; }
    const ans1dp = Math.round(answer * 10) / 10;
    if (Math.abs(answer - ans1dp) > 0.0001) continue;
    answer = ans1dp;
    if (answer > 0 && answer < 10000 && !isNaN(answer)) {
      const fa = answer >= 1000 ? formatNumber(Math.round(answer)) : Number.isInteger(answer) ? formatNumber(answer) : answer.toFixed(1);
      const sym = getOperationSymbol(operation);
      return {
        display: `${formatNumber(num1)} ${sym} ${formatNumber(num2)}`, displayType: 'text',
        answer: fa,
        working: [
          { type: 'step', content: `Original: ${formatNumber(num1)} ${sym} ${formatNumber(num2)}` },
          { type: 'step', content: `Round to 1 s.f.: ${formatNumber(num1)} → ${formatNumber(r1)},  ${formatNumber(num2)} → ${formatNumber(r2)}` },
          { type: 'step', content: `Calculate: ${formatNumber(r1)} ${sym} ${formatNumber(r2)} = ${fa}` },
        ],
        values: { num1, num2, operation, id: Math.random() }, difficulty: 'level2',
      };
    }
  }
  return { display: '45 × 2', displayType: 'text', answer: '100', working: [{ type: 'step', content: '45 × 2 ≈ 100' }], values: { id: Math.random() }, difficulty: 'level2' };
};

// ── Level 3 helpers ──

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

// Build a two-number add/subtract expression, both 2-digit unrounded numbers
const makeAddSubExpr = (): Expr | null => {
  const op = Math.random() > 0.5 ? 'add' : 'subtract';
  const a = randUnrounded2Digit(), b = randUnrounded2Digit();
  if (a === b) return null;
  const ra = roundTo1SF(a), rb = roundTo1SF(b);
  if (ra === rb) return null;
  const sym = getOperationSymbol(op);
  if (op === 'subtract' && ra <= rb) return null;
  const val = op === 'add' ? ra + rb : ra - rb;
  if (val <= 0) return null;
  return {
    raw: `${a} ${sym} ${b}`,
    rounded: `${ra} ${sym} ${rb}`,
    value: val,
    nums: [{ raw: String(a), rounded: String(ra) }, { raw: String(b), rounded: String(rb) }],
  };
};

// Build a two-number multiply/divide expression, both 2-digit unrounded numbers.
// Division is constrained so the rounded result is a whole number.
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
      raw: `${a} × ${b}`,
      rounded: `${ra} × ${rb}`,
      value: val,
      nums: [{ raw: String(a), rounded: String(ra) }, { raw: String(b), rounded: String(rb) }],
    };
  } else {
    // division: ensure ra divides evenly by rb
    if (rb === 0) return null;
    if (!Number.isInteger(ra / rb)) return null;
    const val = ra / rb;
    if (val <= 0 || val === 1 || val > 100) return null;
    return {
      raw: `${a} ÷ ${b}`,
      rounded: `${ra} ÷ ${rb}`,
      value: val,
      nums: [{ raw: String(a), rounded: String(ra) }, { raw: String(b), rounded: String(rb) }],
    };
  }
};

// Pick any expression type (add/sub or mul/div)
const makeAnyExpr = (): Expr | null =>
  Math.random() > 0.5 ? makeAddSubExpr() : makeMulDivExpr();

// ── Level 3: FRACTION BAR ────────────────────────────────────────────────────
//
// Self-contained stacked fraction where the numerator and/or denominator is a
// two-number expression using +, −, × or ÷.
//
// Structures (chosen randomly):
//   expr / num   — e.g. (34 + 21) / 11   or   (4 × 31) / 11
//   num  / expr  — e.g. 82 / (13 + 27)   or   82 / (4 × 13)
//   expr / expr  — e.g. (34 + 21) / (4 × 13)
//
// When one side is a single number we find one that makes the division clean.

const generateFracBar = (allowBothSides: boolean): Question | null => {
  // When allowBothSides is false, restrict to expr/num or num/expr only
  const structure = !allowBothSides
    ? (Math.random() < 0.5 ? 'expr/num' : 'num/expr')
    : (Math.random() < 0.40 ? 'expr/num'
      : Math.random() < 0.55 ? 'num/expr'
      : 'expr/expr');

  let numExpr: Expr | null = null, denExpr: Expr | null = null;
  let numVal = 0, denVal = 0;
  let numRaw = '', numRounded = '', denRaw = '', denRounded = '';
  let numNums: Array<{ raw: string; rounded: string }> = [];
  let denNums: Array<{ raw: string; rounded: string }> = [];

  // ── numerator ──
  if (structure === 'expr/num' || structure === 'expr/expr') {
    numExpr = makeAnyExpr();
    if (!numExpr) return null;
    numVal = numExpr.value; numRaw = numExpr.raw; numRounded = numExpr.rounded; numNums = numExpr.nums;
  } else {
    // single unrounded number
    const n = randUnrounded();
    numVal = roundTo1SF(n); numRaw = formatNumber(n); numRounded = formatNumber(numVal);
    numNums = [{ raw: formatNumber(n), rounded: formatNumber(numVal) }];
  }

  // ── denominator ──
  if (structure === 'num/expr' || structure === 'expr/expr') {
    denExpr = makeAnyExpr();
    if (!denExpr) return null;
    denVal = denExpr.value; denRaw = denExpr.raw; denRounded = denExpr.rounded; denNums = denExpr.nums;
  } else {
    // single number — must divide numVal cleanly
    const factors: number[] = [];
    for (let f = 2; f < numVal; f++) {
      if (Number.isInteger(numVal / f)) factors.push(f);
    }
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

  if (denVal === 0) return null;
  if (numVal === denVal) return null;
  const answer = numVal / denVal;
  const ansR = Math.round(answer * 10) / 10;
  if (Math.abs(answer - ansR) > 0.0001) return null;
  if (answer <= 0 || answer > 500 || answer === 1) return null;
  const formattedAnswer = formatAnswer(ansR);

  // Bracket expressions in the flat (working step) representation
  const numWorkRaw = numExpr ? `(${numRaw})` : numRaw;
  const denWorkRaw = denExpr ? `(${denRaw})` : denRaw;
  const numWorkRnd = numExpr ? `(${numRounded})` : numRounded;
  const denWorkRnd = denExpr ? `(${denRounded})` : denRounded;

  const allNums = [...numNums, ...denNums];
  const roundStr = allNums.map(n => `${n.raw} → ${n.rounded}`).join(',  ');

  const step3parts: string[] = [];
  if (numExpr) step3parts.push(`Numerator: ${numWorkRnd} = ${numVal}`);
  if (denExpr) step3parts.push(`Denominator: ${denWorkRnd} = ${denVal}`);

  return {
    display: `${numWorkRaw} ÷ ${denWorkRaw}`,
    displayType: 'fraction',
    fracNumerator: numRaw,
    fracDenominator: denRaw,
    answer: formattedAnswer,
    working: [
      { type: 'step', content: `Original: ${numWorkRaw} ÷ ${denWorkRaw}` },
      { type: 'step', content: `Round to 1 s.f.: ${roundStr}` },
      ...(step3parts.length > 0 ? [{ type: 'step', content: step3parts.join('   ') }] : []),
      { type: 'step', content: `Calculate: ${numVal} ÷ ${denVal} = ${formattedAnswer}` },
    ],
    values: { numRaw, denRaw, id: Math.random() },
    difficulty: 'level3',
  };
};

// ── Level 3: FRACTION + TERM ─────────────────────────────────────────────────
//
// A simple fraction a/b displayed inline, combined with a separate whole number.
//
//   a/b + c    numerator & denominator 2-digit, outer term 3-digit (clearly different scale)
//   a/b − c    outer term 3-digit, guaranteed larger than the fraction value
//   a/b × c    outer term small (2–9 single-figure-ish) so the multiply is sensible
//
// Number ranges are deliberately kept distinct so the three parts look different.

const generateFracTerm = (): Question | null => {
  const outerOps = ['add', 'subtract', 'multiply'];
  const op = outerOps[Math.floor(Math.random() * outerOps.length)];
  const sym = getOperationSymbol(op);

  let attempts = 0;
  while (attempts < 60) {
    attempts++;

    // Numerator and denominator: 2-digit unrounded, clearly different from each other
    const fNum = randUnrounded2Digit(), fDen = randUnrounded2Digit();
    if (fNum === fDen) continue;
    const rFNum = roundTo1SF(fNum), rFDen = roundTo1SF(fDen);
    if (rFNum === rFDen) continue;
    if (rFDen === 0) continue;

    // Fraction value after rounding — must be a whole number or clean 1dp
    const fracVal = rFNum / rFDen;
    const fracR = Math.round(fracVal * 10) / 10;
    if (Math.abs(fracVal - fracR) > 0.0001) continue;
    if (fracR <= 0 || fracR === 1) continue;

    let outer: number;
    let rOuter: number;

    if (op === 'multiply') {
      // Keep outer small (12–49) so the multiply stays pedagogically sensible
      // and is visually distinct (single/low double digit vs fraction parts)
      outer = Math.floor(Math.random() * 38) + 12;
      if (isAlreadyRounded(outer)) continue;
      rOuter = roundTo1SF(outer);
      if (rOuter === 0 || rOuter === rFNum || rOuter === rFDen) continue;
    } else {
      // Add/subtract: use a small whole number in the 12–28 range (rounds to 10 or 20)
      // so it is visually distinct from the 2-digit numerator/denominator
      // and students still have to round it to 1 s.f.
      let attempts2 = 0;
      outer = 0;
      while (attempts2 < 20) {
        attempts2++;
        // 12–19 → rounds to 10 or 20; 21–28 → rounds to 20
        const candidate = Math.floor(Math.random() * 17) + 12; // 12–28
        if (!isAlreadyRounded(candidate)) { outer = candidate; break; }
      }
      if (outer === 0) continue;
      rOuter = roundTo1SF(outer);
      if (rOuter === 0) continue;

      if (op === 'subtract') {
        // For subtract: a/b − c, so the fraction must be larger than the outer term
        if (fracR <= rOuter) continue;
      }
    }

    // Compute answer from rounded values
    let answer: number;
    if (op === 'add')      answer = fracR + rOuter;
    else if (op === 'subtract') answer = fracR - rOuter;  // a/b − c
    else                   answer = fracR * rOuter;

    // Must be a clean value (integer or 1dp)
    const ansR = Math.round(answer * 10) / 10;
    if (Math.abs(answer - ansR) > 0.0001) continue;
    if (ansR <= 0 || ansR > 10000) continue;

    const formattedAnswer = formatAnswer(ansR);
    const fracValStr = formatAnswer(fracR);
    const outerStr = formatNumber(outer);
    const rOuterStr = formatNumber(rOuter);

    return {
      display: `${fNum}/${fDen} ${sym} ${outerStr}`,
      displayType: 'fraction',
      fracNumerator: formatNumber(fNum),
      fracDenominator: formatNumber(fDen),
      answer: formattedAnswer,
      working: [
        { type: 'step', content: `Original: ${fNum}/${fDen} ${sym} ${outerStr}` },
        { type: 'step', content: `Round to 1 s.f.: ${fNum} → ${rFNum},  ${fDen} → ${rFDen},  ${outerStr} → ${rOuterStr}` },
        { type: 'step', content: `Fraction: ${rFNum} ÷ ${rFDen} = ${fracValStr}` },
        { type: 'step', content: op === 'subtract' ? `Calculate: ${fracValStr} − ${rOuterStr} = ${formattedAnswer}` : `Calculate: ${fracValStr} ${sym} ${rOuterStr} = ${formattedAnswer}` },
      ],
      values: { fNum, fDen, outer, fracOp: op, fracOuterNum: outerStr, fracOuterSym: sym, id: Math.random() },
      difficulty: 'level3',
    };
  }
  return null;
};

// ── Level 3 dispatcher ──

const generateLevel3 = (l3type: string, allowBothSides: boolean): Question => {
  const FALLBACK: Question = {
    display: '(34 + 21) ÷ 11', displayType: 'fraction',
    fracNumerator: '34 + 21', fracDenominator: '11', answer: '5',
    working: [
      { type: 'step', content: 'Original: (34 + 21) ÷ 11' },
      { type: 'step', content: 'Round to 1 s.f.: 34 → 30,  21 → 20,  11 → 10' },
      { type: 'step', content: 'Numerator: (30 + 20) = 50' },
      { type: 'step', content: 'Calculate: 50 ÷ 10 = 5' },
    ],
    values: { id: Math.random() }, difficulty: 'level3',
  };
  for (let att = 0; att < 40; att++) {
    let type = l3type;
    if (type === 'mixed') {
      type = Math.random() < 0.5 ? 'fracbar' : 'fracterm';
    }
    let q: Question | null = null;
    if (type === 'fracbar')  q = generateFracBar(allowBothSides);
    if (type === 'fracterm') q = generateFracTerm();
    if (q) return q;
  }
  return FALLBACK;
};

// ── Main dispatcher ──

const generateQuestion = (
  _tool: ToolType,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string,
): Question => {
  if (level === 'level1') return generateLevel1(dropdownValue === 'mixed' ? null : dropdownValue);
  if (level === 'level2') return generateLevel2(dropdownValue === 'mixed' ? null : dropdownValue);
  const allowBothSides = !!variables['bothSidesExpr'];
  return generateLevel3(dropdownValue, allowBothSides);
};

// ── STEP 5: getQuestionUniqueKey ─────────────────────────────────────────────

const getQuestionUniqueKey = (q: Question): string => q.display;

const generateUniqueQuestion = (
  tool: ToolType, level: DifficultyLevel, variables: Record<string, boolean>,
  dropdownValue: string, usedKeys: Set<string>,
): Question => {
  let q: Question, key = '', attempts = 0;
  do {
    q = generateQuestion(tool, level, variables, dropdownValue);
    key = getQuestionUniqueKey(q);
    if (++attempts > 100) break;
  } while (usedKeys.has(key));
  usedKeys.add(key);
  return q;
};

// ── STEP 6: renderDiagram (unused) ───────────────────────────────────────────

const renderDiagram = (_q: Question | null, size: number): JSX.Element => (
  <div className="flex items-center justify-center h-full text-gray-400 text-xl">Diagram ({size}px)</div>
);

// ── Fraction visual renderer ──────────────────────────────────────────────────
//
// For 'fraction' displayType questions the question is rendered as a proper
// stacked fraction, optionally with a prefix (× outer) or suffix (± outer).
//
// Two variants:
//   renderQuestionDisplay       — uses Tailwind text-size classes (whiteboard / worked)
//   renderQuestionDisplayInline — uses inline font-size strings (worksheet cells)

const renderQuestionDisplay = (q: Question, textSizeClass: string): JSX.Element => {
  if (q.displayType === 'fraction' && q.fracNumerator !== undefined && q.fracDenominator !== undefined) {
    const v = q.values as Record<string, unknown>;
    const fracOuterSym = v.fracOuterSym as string | undefined;
    const fracOuterNum = v.fracOuterNum as string | undefined;

    return (
      <span className="inline-flex items-center gap-3">
        <span className="inline-flex flex-col items-center" style={{ lineHeight: 1.1 }}>
          <span className={`${textSizeClass} font-bold px-2`} style={{ color: '#000000' }}>{q.fracNumerator}</span>
          <span className="w-full" style={{ borderTop: '4px solid #000', minWidth: '2rem' }} />
          <span className={`${textSizeClass} font-bold px-2`} style={{ color: '#000000' }}>{q.fracDenominator}</span>
        </span>
        {fracOuterSym && fracOuterNum && (
          <span className={`${textSizeClass} font-bold`} style={{ color: '#000000' }}>
            {fracOuterSym} {fracOuterNum}
          </span>
        )}
      </span>
    );
  }
  return <span className={`${textSizeClass} font-bold`} style={{ color: '#000000' }}>{q.display}</span>;
};

const renderQuestionDisplayInline = (q: Question, fontSize: string): JSX.Element => {
  if (q.displayType === 'fraction' && q.fracNumerator !== undefined && q.fracDenominator !== undefined) {
    const v = q.values as Record<string, unknown>;
    const fracOuterSym = v.fracOuterSym as string | undefined;
    const fracOuterNum = v.fracOuterNum as string | undefined;

    return (
      <span className="inline-flex items-center gap-1.5" style={{ fontSize }}>
        <span className="inline-flex flex-col items-center" style={{ lineHeight: 1.1 }}>
          <span className="font-bold px-1" style={{ color: '#000000' }}>{q.fracNumerator}</span>
          <span className="w-full" style={{ borderTop: '2px solid #000', minWidth: '1.2rem' }} />
          <span className="font-bold px-1" style={{ color: '#000000' }}>{q.fracDenominator}</span>
        </span>
        {fracOuterSym && fracOuterNum && (
          <span className="font-bold" style={{ color: '#000000' }}>{fracOuterSym} {fracOuterNum}</span>
        )}
      </span>
    );
  }
  return <span className="font-bold" style={{ color: '#000000', fontSize }}>{q.display}</span>;
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

interface DifficultyToggleProps { value: DifficultyLevel; onChange: (v: DifficultyLevel) => void; }
const DifficultyToggle: React.FC<DifficultyToggleProps> = ({ value, onChange }) => (
  <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
    {([['level1', 'Level 1', 'bg-green-600'], ['level2', 'Level 2', 'bg-yellow-500'], ['level3', 'Level 3', 'bg-red-600']] as [DifficultyLevel, string, string][]).map(([val, label, activeCol]) => (
      <button key={val} onClick={() => onChange(val)}
        className={`px-5 py-2 font-bold text-base transition-colors ${value === val ? `${activeCol} text-white` : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
        {label}
      </button>
    ))}
  </div>
);

interface DropdownSectionProps { dropdown: DropdownConfig; value: string; onChange: (v: string) => void; }
const DropdownSection: React.FC<DropdownSectionProps> = ({ dropdown, value, onChange }) => (
  <div className="flex flex-col gap-2">
    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{dropdown.label}</span>
    <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
      {dropdown.options.map((opt) => dropdown.useTwoLineButtons ? (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className={`flex-1 px-3 py-2.5 text-center transition-colors flex flex-col items-center justify-center ${value === opt.value ? 'bg-blue-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
          <span className="text-sm font-bold leading-tight">{opt.label}</span>
          {opt.sub !== undefined && <span className={`text-xs leading-tight mt-0.5 ${value === opt.value ? 'text-blue-200' : 'text-gray-400'}`}>{opt.sub}</span>}
        </button>
      ) : (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className={`flex-1 px-4 py-2.5 text-base font-bold transition-colors ${value === opt.value ? 'bg-blue-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

interface VariablesSectionProps { variables: VariableConfig[]; values: Record<string, boolean>; onChange: (key: string, value: boolean) => void; }
const VariablesSection: React.FC<VariablesSectionProps> = ({ variables, values, onChange }) => (
  <div className="flex flex-col gap-3">
    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Options</span>
    {variables.map((v) => (
      <label key={v.key} className="flex items-center gap-3 cursor-pointer py-1">
        <div onClick={() => onChange(v.key, !values[v.key])}
          className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${values[v.key] ? 'bg-blue-900' : 'bg-gray-300'}`}>
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${values[v.key] ? 'translate-x-7' : 'translate-x-1'}`} />
        </div>
        <span className="text-base font-semibold text-gray-700">{v.label}</span>
      </label>
    ))}
  </div>
);

interface StandardQOPopoverProps {
  variables: VariableConfig[]; variableValues: Record<string, boolean>; onVariableChange: (key: string, value: boolean) => void;
  dropdown: DropdownConfig | null; dropdownValue: string; onDropdownChange: (v: string) => void;
}
const StandardQOPopover: React.FC<StandardQOPopoverProps> = ({ variables, variableValues, onVariableChange, dropdown, dropdownValue, onDropdownChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const hasContent = variables.length > 0 || dropdown !== null;
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className={`px-4 py-2 rounded-xl border-2 font-bold text-base transition-colors shadow-sm flex items-center gap-2 ${open ? 'bg-blue-900 border-blue-900 text-white' : 'bg-white border-gray-300 text-gray-600 hover:border-blue-900 hover:text-blue-900'}`}>
        Question Options
        <ChevronDown size={18} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-72 p-5 flex flex-col gap-5">
          {dropdown !== null && <DropdownSection dropdown={dropdown} value={dropdownValue} onChange={onDropdownChange} />}
          {variables.length > 0 && <VariablesSection variables={variables} values={variableValues} onChange={onVariableChange} />}
          {!hasContent && <p className="text-sm text-gray-400">No additional options for this tool.</p>}
        </div>
      )}
    </div>
  );
};

interface DiffQOPopoverProps {
  tool: ToolType; toolSettings: ToolSettings;
  levelVariables: Record<DifficultyLevel, Record<string, boolean>>; onLevelVariableChange: (level: DifficultyLevel, key: string, value: boolean) => void;
  levelDropdowns: Record<DifficultyLevel, string>; onLevelDropdownChange: (level: DifficultyLevel, value: string) => void;
}
const DiffQOPopover: React.FC<DiffQOPopoverProps> = ({ toolSettings, levelVariables, onLevelVariableChange, levelDropdowns, onLevelDropdownChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const levels: DifficultyLevel[] = ['level1', 'level2', 'level3'];
  const getDDForLevel = (lv: DifficultyLevel): DropdownConfig | null => toolSettings.difficultySettings?.[lv]?.dropdown ?? toolSettings.dropdown;
  const getVarsForLevel = (lv: DifficultyLevel): VariableConfig[] => toolSettings.difficultySettings?.[lv]?.variables ?? toolSettings.variables;
  const anyContent = levels.some((lv) => getDDForLevel(lv) !== null || getVarsForLevel(lv).length > 0);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className={`px-4 py-2 rounded-xl border-2 font-bold text-base transition-colors shadow-sm flex items-center gap-2 ${open ? 'bg-blue-900 border-blue-900 text-white' : 'bg-white border-gray-300 text-gray-600 hover:border-blue-900 hover:text-blue-900'}`}>
        Question Options
        <ChevronDown size={18} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-80 p-5 flex flex-col gap-5">
          {!anyContent ? <p className="text-sm text-gray-400">No additional options for this tool.</p> : levels.map((lv) => {
            const dd = getDDForLevel(lv), vars = getVarsForLevel(lv);
            return (
              <div key={lv} className="flex flex-col gap-2">
                <span className={`text-sm font-extrabold uppercase tracking-wider ${LV_HEADER_COLORS[lv]}`}>{LV_LABELS[lv]}</span>
                <div className="flex flex-col gap-3 pl-1">
                  {dd !== null && <DropdownSection dropdown={dd} value={levelDropdowns[lv]} onChange={(v) => onLevelDropdownChange(lv, v)} />}
                  {vars.length > 0 && <VariablesSection variables={vars} values={levelVariables[lv]} onChange={(key, val) => onLevelVariableChange(lv, key, val)} />}
                  {!dd && vars.length === 0 && <p className="text-xs text-gray-400">No options at this level.</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const InfoModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col" style={{ height: '80vh' }} onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 flex-shrink-0">
        <div><h2 className="text-2xl font-bold text-gray-900">Tool Information</h2><p className="text-sm text-gray-400 mt-0.5">A guide to all features and options</p></div>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"><X size={20} /></button>
      </div>
      <div className="overflow-y-auto px-7 py-6 flex flex-col gap-6 flex-1">
        {INFO_SECTIONS.map((section) => (
          <div key={section.title}>
            <div className="flex items-center gap-2 mb-3"><span className="text-xl">{section.icon}</span><h3 className="text-lg font-bold text-blue-900">{section.title}</h3></div>
            <div className="flex flex-col gap-2">
              {section.content.map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-xl px-4 py-3">
                  <span className="font-bold text-gray-800 text-sm">{item.label}</span>
                  <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="px-7 py-4 border-t border-gray-100 flex justify-end flex-shrink-0">
        <button onClick={onClose} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-sm hover:bg-blue-800 transition-colors">Close</button>
      </div>
    </div>
  </div>
);

interface MenuDropdownProps { colorScheme: ColorScheme; setColorScheme: (s: ColorScheme) => void; onClose: () => void; onOpenInfo: () => void; }
const MenuDropdown: React.FC<MenuDropdownProps> = ({ colorScheme, setColorScheme, onClose, onOpenInfo }) => {
  const [colorOpen, setColorOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);
  const schemes: ColorScheme[] = ['default', 'blue', 'pink', 'yellow'];
  return (
    <div ref={ref} className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden" style={{ minWidth: '200px' }}>
      <div className="py-1">
        <button onClick={() => setColorOpen(!colorOpen)} className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${colorOpen ? '-rotate-90' : ''}`} />
            <span>Colour Scheme</span>
          </div>
          <span className="text-xs text-gray-400 font-normal capitalize">{colorScheme}</span>
        </button>
        {colorOpen && (
          <div className="border-t border-gray-100">
            {schemes.map((s) => (
              <button key={s} onClick={() => { setColorScheme(s); onClose(); }}
                className={`w-full flex items-center justify-between pl-10 pr-4 py-2.5 text-sm font-semibold transition-colors capitalize ${colorScheme === s ? 'bg-blue-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="border-t border-gray-100 my-1" />
        <button onClick={() => { onOpenInfo(); onClose(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400 flex-shrink-0">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 7v5M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Tool Information
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const EstimationTool: React.FC = () => {
  const navigate = useNavigate();
  const [currentTool] = useState<ToolType>('estimation');
  const [mode, setMode] = useState<Mode>('whiteboard');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('level1');
  const [toolVariables] = useState<Record<string, Record<string, boolean>>>({ estimation: {} });
  const [toolDropdowns, setToolDropdowns] = useState<Record<string, string>>({ estimation: 'mixed' });
  const [levelVariables, setLevelVariables] = useState<Record<DifficultyLevel, Record<string, boolean>>>({ level1: {}, level2: {}, level3: {} });
  const [levelDropdowns, setLevelDropdowns] = useState<Record<DifficultyLevel, string>>({ level1: 'mixed', level2: 'mixed', level3: 'mixed' });
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [showWhiteboardAnswer, setShowWhiteboardAnswer] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);
  const [worksheet, setWorksheet] = useState<Question[]>([]);
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState(false);
  const [isDifferentiated, setIsDifferentiated] = useState(false);
  const [numColumns, setNumColumns] = useState(2);
  const [worksheetFontSize, setWorksheetFontSize] = useState(1);
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const getQuestionBg = (): string => {
    if (colorScheme === 'blue') return '#D1E7F8';
    if (colorScheme === 'pink') return '#F8D1E7';
    if (colorScheme === 'yellow') return '#F8F4D1';
    return '#ffffff';
  };
  const getStepBg = (): string => {
    if (colorScheme === 'blue') return '#B3D9F2';
    if (colorScheme === 'pink') return '#F2B3D9';
    if (colorScheme === 'yellow') return '#F2EBB3';
    return '#f3f4f6';
  };

  const getToolSettings = (): ToolSettings => TOOL_CONFIG.tools[currentTool] as ToolSettings;
  const getDropdownConfig = (): DropdownConfig | null => {
    const t = getToolSettings();
    return t.difficultySettings?.[difficulty]?.dropdown ?? t.dropdown;
  };
  const getVariablesConfig = (): VariableConfig[] => {
    const t = getToolSettings();
    return t.difficultySettings?.[difficulty]?.variables ?? t.variables;
  };
  const getDropdownValue = (): string => toolDropdowns[currentTool] ?? 'mixed';
  const setDropdownValue = (v: string): void => setToolDropdowns((prev) => ({ ...prev, [currentTool]: v }));
  const handleLevelDropdownChange = (level: DifficultyLevel, value: string): void =>
    setLevelDropdowns((prev) => ({ ...prev, [level]: value }));

  const handleNewQuestion = (): void => {
    const vars = difficulty === 'level3' ? levelVariables['level3'] : (toolVariables[currentTool] || {});
    const q = generateQuestion(currentTool, difficulty, vars, getDropdownValue());
    setCurrentQuestion(q);
    setShowWhiteboardAnswer(false);
    setShowAnswer(false);
  };

  const handleGenerateWorksheet = (): void => {
    const usedKeys = new Set<string>();
    const questions: Question[] = [];
    if (isDifferentiated) {
      (['level1', 'level2', 'level3'] as DifficultyLevel[]).forEach((lv) => {
        for (let i = 0; i < numQuestions; i++)
          questions.push(generateUniqueQuestion(currentTool, lv, levelVariables[lv], levelDropdowns[lv], usedKeys));
      });
    } else {
      const wsVars = difficulty === 'level3' ? levelVariables['level3'] : (toolVariables[currentTool] || {});
      for (let i = 0; i < numQuestions; i++)
        questions.push(generateUniqueQuestion(currentTool, difficulty, wsVars, getDropdownValue(), usedKeys));
    }
    setWorksheet(questions);
    setShowWorksheetAnswers(false);
  };

  useEffect(() => { if (mode !== 'worksheet') handleNewQuestion(); }, [difficulty, currentTool]);
  useEffect(() => { setToolDropdowns((prev) => ({ ...prev, [currentTool]: 'mixed' })); }, [difficulty]);

  const fontSizes    = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
  const fontSizePx   = ['1.25rem', '1.5rem', '1.875rem', '2.25rem'];
  const canIncrease  = worksheetFontSize < fontSizes.length - 1;
  const canDecrease  = worksheetFontSize > 0;

  const stdQOProps: StandardQOPopoverProps = {
    variables: getVariablesConfig(),
    variableValues: difficulty === 'level3' ? levelVariables['level3'] : (toolVariables[currentTool] || {}),
    onVariableChange: (key: string, value: boolean) => {
      if (difficulty === 'level3') {
        setLevelVariables((prev) => ({ ...prev, level3: { ...prev['level3'], [key]: value } }));
      }
    },
    dropdown: getDropdownConfig(), dropdownValue: getDropdownValue(), onDropdownChange: setDropdownValue,
  };

  const diffQOProps: DiffQOPopoverProps = {
    tool: currentTool, toolSettings: getToolSettings(),
    levelVariables,
    onLevelVariableChange: (level: DifficultyLevel, key: string, value: boolean) => {
      setLevelVariables((prev) => ({ ...prev, [level]: { ...prev[level], [key]: value } }));
    },
    levelDropdowns, onLevelDropdownChange: handleLevelDropdownChange,
  };

  // ── Control bar ──

  const renderControlBar = (): JSX.Element => {
    if (mode === 'worksheet') return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex justify-center items-center gap-6 mb-4 flex-wrap">
          <div className="flex items-center gap-3">
            <label className="text-base font-semibold text-gray-700">Questions:</label>
            <input type="number" min="1" max="20" value={numQuestions}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumQuestions(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
              className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base" />
          </div>
          {isDifferentiated ? <DiffQOPopover {...diffQOProps} /> : <StandardQOPopover {...stdQOProps} />}
          <button onClick={() => setIsDifferentiated(!isDifferentiated)}
            className={`px-6 py-2 rounded-xl font-bold text-base shadow-sm border-2 transition-colors ${isDifferentiated ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-900 hover:text-blue-900'}`}>
            Differentiated
          </button>
        </div>
        {!isDifferentiated && (
          <div className="flex justify-center items-center gap-6 mb-4 flex-wrap">
            <DifficultyToggle value={difficulty} onChange={setDifficulty} />
            <div className="flex items-center gap-3">
              <label className="text-base font-semibold text-gray-700">Columns:</label>
              <input type="number" min="1" max="4" value={numColumns}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumColumns(Math.max(1, Math.min(4, parseInt(e.target.value) || 2)))}
                className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base" />
            </div>
          </div>
        )}
        <div className="flex justify-center items-center gap-4">
          <button onClick={handleGenerateWorksheet} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
            <RefreshCw size={18} /> Generate Worksheet
          </button>
          {worksheet.length > 0 && (
            <button onClick={() => setShowWorksheetAnswers(!showWorksheetAnswers)} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <Eye size={18} /> {showWorksheetAnswers ? 'Hide Answers' : 'Show Answers'}
            </button>
          )}
        </div>
      </div>
    );

    return (
      <div className="bg-white rounded-xl shadow-lg p-5 mb-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <DifficultyToggle value={difficulty} onChange={setDifficulty} />
          <StandardQOPopover {...stdQOProps} />
          <div className="flex gap-3">
            <button onClick={handleNewQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <RefreshCw size={18} /> New Question
            </button>
            <button onClick={() => mode === 'whiteboard' ? setShowWhiteboardAnswer(!showWhiteboardAnswer) : setShowAnswer(!showAnswer)}
              className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <Eye size={18} />
              {(mode === 'whiteboard' ? showWhiteboardAnswer : showAnswer) ? 'Hide Answer' : 'Show Answer'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Whiteboard ──

  const renderWhiteboardMode = (): JSX.Element => {
    if (TOOL_CONFIG.useGraphicalLayout) {
      return (
        <div className="rounded-xl shadow-2xl p-8" style={{ backgroundColor: getQuestionBg() }}>
          <div className="flex gap-6">
            <div className="rounded-xl flex items-center justify-center" style={{ width: '450px', height: '500px', backgroundColor: getStepBg() }}>
              {renderDiagram(currentQuestion, 400)}
            </div>
            <div className="flex-1 rounded-xl p-6" style={{ minHeight: '500px', backgroundColor: getStepBg() }}>
              {currentQuestion && (
                <div className="flex flex-col items-center gap-4">
                  {renderQuestionDisplay(currentQuestion, 'text-4xl')}
                  {showWhiteboardAnswer && <span className="text-4xl font-bold" style={{ color: '#166534' }}>= {currentQuestion.answer}</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="rounded-xl shadow-2xl p-8" style={{ backgroundColor: getQuestionBg() }}>
        <div className="flex flex-row flex-wrap items-center justify-center gap-6 py-4">
          {currentQuestion ? (
            <>
              {renderQuestionDisplay(currentQuestion, 'text-6xl')}
              {showWhiteboardAnswer && <span className="text-6xl font-bold" style={{ color: '#166534' }}>= {currentQuestion.answer}</span>}
            </>
          ) : (
            <span className="text-4xl text-gray-400">Generate question</span>
          )}
        </div>
        <div className="rounded-xl mt-8" style={{ height: '500px', backgroundColor: getStepBg() }} />
      </div>
    );
  };

  // ── Worked Example ──

  const renderWorkedExampleMode = (): JSX.Element => {
    if (TOOL_CONFIG.useGraphicalLayout) {
      return (
        <div className="overflow-y-auto" style={{ height: '120vh' }}>
          <div className="rounded-xl shadow-lg p-8 w-full" style={{ backgroundColor: getQuestionBg() }}>
            <div className="flex gap-6">
              <div className="rounded-xl flex items-center justify-center" style={{ width: '450px', height: '500px', backgroundColor: getStepBg() }}>
                {renderDiagram(currentQuestion, 400)}
              </div>
              <div className="flex-1">
                {currentQuestion && (
                  <>
                    <div className="flex justify-center mb-6">{renderQuestionDisplay(currentQuestion, 'text-4xl')}</div>
                    {showAnswer && (
                      <>
                        <div className="space-y-4">
                          {currentQuestion.working.map((step, i) => (
                            <div key={i} className="rounded-xl p-6" style={{ backgroundColor: getStepBg() }}>
                              <h4 className="text-xl font-bold mb-2" style={{ color: '#000000' }}>Step {i + 1}</h4>
                              <p className="text-3xl" style={{ color: '#000000' }}>{step.content}</p>
                            </div>
                          ))}
                        </div>
                        <div className="rounded-xl p-6 text-center mt-4" style={{ backgroundColor: getStepBg() }}>
                          <span className="text-5xl font-bold" style={{ color: '#166534' }}>= {currentQuestion.answer}</span>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="overflow-y-auto" style={{ height: '120vh' }}>
        <div className="rounded-xl shadow-lg p-8 w-full" style={{ backgroundColor: getQuestionBg() }}>
          {currentQuestion ? (
            <>
              <div className="flex justify-center py-4">{renderQuestionDisplay(currentQuestion, 'text-6xl')}</div>
              {showAnswer && (
                <>
                  <div className="space-y-4 mt-8">
                    {currentQuestion.working.map((step, i) => (
                      <div key={i} className="rounded-xl p-6" style={{ backgroundColor: getStepBg() }}>
                        <h4 className="text-xl font-bold mb-2" style={{ color: '#000000' }}>Step {i + 1}</h4>
                        <p className="text-3xl" style={{ color: '#000000' }}>{step.content}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl p-6 text-center mt-4" style={{ backgroundColor: getStepBg() }}>
                    <span className="text-5xl font-bold" style={{ color: '#166534' }}>= {currentQuestion.answer}</span>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-center text-gray-400 text-4xl py-16">Generate question</div>
          )}
        </div>
      </div>
    );
  };

  // ── Worksheet ──

  const renderWorksheetMode = (): JSX.Element => {
    const toolSettings = getToolSettings();
    if (worksheet.length === 0) return (
      <div className="rounded-xl shadow-2xl p-8 text-center" style={{ backgroundColor: getQuestionBg() }}>
        <span className="text-2xl text-gray-400">Generate worksheet</span>
      </div>
    );

    const fontSizeControls = (
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <button disabled={!canDecrease} onClick={() => canDecrease && setWorksheetFontSize(worksheetFontSize - 1)}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${canDecrease ? 'bg-blue-900 text-white hover:bg-blue-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
          <ChevronDown size={20} />
        </button>
        <button disabled={!canIncrease} onClick={() => canIncrease && setWorksheetFontSize(worksheetFontSize + 1)}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${canIncrease ? 'bg-blue-900 text-white hover:bg-blue-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
          <ChevronUp size={20} />
        </button>
      </div>
    );

    const px = fontSizePx[worksheetFontSize];

    const renderQCell = (q: Question, idx: number, bgOverride?: string): JSX.Element => {
      const bg = bgOverride ?? getStepBg();
      const qEl = renderQuestionDisplayInline(q, px);
      const aEl = showWorksheetAnswers
        ? <span className="font-semibold ml-2" style={{ color: '#059669', fontSize: px }}>= {q.answer}</span>
        : null;
      return toolSettings.useSubstantialBoxes ? (
        <div className="rounded-lg p-4 shadow" style={{ backgroundColor: bg }}>
          <span className="font-semibold mr-1" style={{ color: '#000000', fontSize: px }}>{idx + 1}.</span>
          {qEl}{aEl}
        </div>
      ) : (
        <div className="p-3 flex items-center flex-wrap gap-x-1">
          <span className="font-semibold mr-1" style={{ color: '#000000', fontSize: px }}>{idx + 1}.</span>
          {qEl}{aEl}
        </div>
      );
    };

    if (isDifferentiated) return (
      <div className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: getQuestionBg() }}>
        {fontSizeControls}
        <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#000000' }}>Estimation — Worksheet</h2>
        <div className="grid grid-cols-3 gap-4">
          {(['level1', 'level2', 'level3'] as DifficultyLevel[]).map((lv, li) => {
            const lqs = worksheet.filter((q) => q.difficulty === lv);
            const c = LV_COLORS[lv];
            return (
              <div key={lv} className={`${c.bg} border-2 ${c.border} rounded-xl p-4`}>
                <h3 className={`text-xl font-bold mb-4 text-center ${c.text}`}>Level {li + 1}</h3>
                <div className="space-y-3">{lqs.map((q, idx) => <div key={idx}>{renderQCell(q, idx, c.fill)}</div>)}</div>
              </div>
            );
          })}
        </div>
      </div>
    );

    return (
      <div className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: getQuestionBg() }}>
        {fontSizeControls}
        <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#000000' }}>Estimation — Worksheet</h2>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${numColumns}, 1fr)` }}>
          {worksheet.map((q, idx) => <div key={idx}>{renderQCell(q, idx)}</div>)}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors">
            <Home size={24} /><span className="font-semibold text-lg">Home</span>
          </button>
          <div className="relative">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors">
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
            {isMenuOpen && <MenuDropdown colorScheme={colorScheme} setColorScheme={setColorScheme} onClose={() => setIsMenuOpen(false)} onOpenInfo={() => setIsInfoOpen(true)} />}
          </div>
        </div>
      </div>

      {isInfoOpen && <InfoModal onClose={() => setIsInfoOpen(false)} />}

      <div className="min-h-screen p-8" style={{ backgroundColor: '#f5f3f0' }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-8" style={{ color: '#000000' }}>{TOOL_CONFIG.pageTitle}</h1>
          <div className="flex justify-center mb-8"><div style={{ width: '90%', height: '2px', backgroundColor: '#d1d5db' }} /></div>

          <div className="flex justify-center gap-4 mb-8">
            {(['whiteboard', 'single', 'worksheet'] as Mode[]).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${mode === m ? 'bg-blue-900 text-white' : 'bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900'}`}>
                {m === 'whiteboard' ? 'Whiteboard' : m === 'single' ? 'Worked Example' : 'Worksheet'}
              </button>
            ))}
          </div>

          {renderControlBar()}
          {mode === 'whiteboard' && renderWhiteboardMode()}
          {mode === 'single' && renderWorkedExampleMode()}
          {mode === 'worksheet' && renderWorksheetMode()}
        </div>
      </div>
    </>
  );
};

export default EstimationTool;
