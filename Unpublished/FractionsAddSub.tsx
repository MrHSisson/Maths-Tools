import { useState, useEffect, useRef } from 'react';
import { RefreshCw, Eye, ChevronUp, ChevronDown, Home, Menu, X } from 'lucide-react';

// ── TYPES ────────────────────────────────────────────────────────────────────

type ColorScheme = 'default' | 'blue' | 'pink' | 'yellow';
type DifficultyLevel = 'level1' | 'level2' | 'level3';
type Mode = 'whiteboard' | 'single' | 'worksheet';
type AnswerFormat = 'improper' | 'mixed';
type ToolType = 'fractions' | 'mixedNumbers';

type WorkingStep = { type: string; content: string };

type MixedFmt = { whole: number; num: number; den: number; isMixed: boolean };

// Raw answer stored on the question — display format computed at render time
type Question = {
  display: string;
  rawNum: number;   // simplified numerator
  rawDen: number;   // simplified denominator
  working: WorkingStep[];
  values: Record<string, unknown>;
  difficulty: string;
};

type VariableConfig = { key: string; label: string; defaultValue: boolean };
type DropdownOption = { value: string; label: string; sub?: string };
type DropdownConfig = { key: string; label: string; options: DropdownOption[]; defaultValue: string; useTwoLineButtons?: boolean };
type DifficultySettings = { dropdown?: DropdownConfig; variables?: VariableConfig[] };
type ToolSettings = { name: string; useSubstantialBoxes: boolean; variables: VariableConfig[]; dropdown: DropdownConfig | null; difficultySettings: Record<string, DifficultySettings> | null };
type InfoItem = { label: string; detail: string };
type InfoSection = { title: string; icon: string; content: InfoItem[] };

// ── TOOL_CONFIG ───────────────────────────────────────────────────────────────

const TOOL_CONFIG: { pageTitle: string; useGraphicalLayout: boolean; tools: Record<string, ToolSettings> } = {
  pageTitle: 'Addition & Subtraction of Fractions',
  useGraphicalLayout: false,
  tools: {
    fractions: {
      name: 'Fractions',
      useSubstantialBoxes: false,
      variables: [],
      dropdown: { key: 'operation', label: 'Operation', options: [{ value: 'add', label: 'Addition' }, { value: 'subtract', label: 'Subtraction' }, { value: 'mixed', label: 'Mixed' }], defaultValue: 'add' },
      difficultySettings: {
        level1: { variables: [{ key: 'answerLessThanOne', label: 'Answer < 1', defaultValue: false }] },
        level2: { variables: [{ key: 'answerLessThanOne', label: 'Answer < 1', defaultValue: false }] },
        level3: {
          dropdown: { key: 'range', label: 'Range', options: [{ value: 'standard', label: 'Standard', sub: 'Denominators 2–10' }, { value: 'extended', label: 'Extended', sub: 'Denominators 2–15' }], defaultValue: 'standard', useTwoLineButtons: true },
          variables: [{ key: 'answerLessThanOne', label: 'Answer < 1', defaultValue: false }],
        },
      },
    },
    mixedNumbers: {
      name: 'Mixed Numbers',
      useSubstantialBoxes: false,
      variables: [],
      dropdown: { key: 'operation', label: 'Operation', options: [{ value: 'add', label: 'Addition' }, { value: 'subtract', label: 'Subtraction' }, { value: 'mixed', label: 'Mixed' }], defaultValue: 'add' },
      difficultySettings: {
        level1: { variables: [{ key: 'requiresCarrying', label: 'Requires Carrying', defaultValue: false }] },
        level2: { variables: [{ key: 'requiresCarrying', label: 'Requires Carrying', defaultValue: false }] },
        level3: {
          dropdown: { key: 'range', label: 'Range', options: [{ value: 'standard', label: 'Standard', sub: 'LCM < 100' }, { value: 'extended', label: 'Extended', sub: 'LCM < 225' }], defaultValue: 'standard', useTwoLineButtons: true },
          variables: [{ key: 'requiresCarrying', label: 'Requires Carrying', defaultValue: false }],
        },
      },
    },
  },
};

// ── INFO_SECTIONS ─────────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  { title: 'Fractions', icon: '➕', content: [
    { label: 'Overview', detail: 'Generates fraction addition and subtraction questions. Use the Operation dropdown to choose Addition, Subtraction, or Mixed.' },
    { label: 'Level 1 — Green', detail: 'Both fractions share the same denominator. Students add or subtract the numerators directly and simplify if needed.' },
    { label: 'Level 2 — Yellow', detail: 'One denominator is a direct multiple of the other. Students scale up the smaller-denominator fraction before calculating.' },
    { label: 'Level 3 — Red', detail: 'Both denominators are unrelated, requiring LCM conversion. Standard uses denominators 2–10; Extended uses denominators 2–15.' },
  ]},
  { title: 'Mixed Numbers', icon: '🔢', content: [
    { label: 'Overview', detail: 'Generates mixed number addition and subtraction questions. All questions use the convert-to-improper-fraction method.' },
    { label: 'Level 1 — Green', detail: 'Same denominator. Students convert to improper fractions, calculate, then convert back.' },
    { label: 'Level 2 — Yellow', detail: 'One denominator is a direct multiple of the other. Students convert to improper fractions, scale, then calculate.' },
    { label: 'Level 3 — Red', detail: 'Unrelated denominators requiring LCM conversion. Standard keeps LCM below 100; Extended allows LCM up to 225.' },
    { label: 'Requires Carrying', detail: 'When off (default), subtraction questions are generated so no borrowing from the whole number is needed. When on, borrowing may be required.' },
  ]},
  { title: 'Modes', icon: '🖥️', content: [
    { label: 'Whiteboard', detail: 'Single large question with blank working space. Ideal for whole-class teaching.' },
    { label: 'Worked Example', detail: 'Question with step-by-step solution revealed on demand.' },
    { label: 'Worksheet', detail: 'Grid of questions with adjustable columns and count.' },
  ]},
  { title: 'Differentiated Worksheet', icon: '📋', content: [
    { label: 'What it does', detail: 'Generates three colour-coded columns — one per difficulty level — so the whole class can work from the same sheet at their own level.' },
    { label: 'Layout', detail: 'Level 1 (green), Level 2 (yellow), Level 3 (red) side by side on one sheet.' },
  ]},
];

// ── LEVEL CONSTANTS ───────────────────────────────────────────────────────────

const LV_LABELS: Record<DifficultyLevel, string> = { level1: 'Level 1', level2: 'Level 2', level3: 'Level 3' };
const LV_HEADER_COLORS: Record<DifficultyLevel, string> = { level1: 'text-green-600', level2: 'text-yellow-500', level3: 'text-red-600' };
const LV_COLORS: Record<DifficultyLevel, { bg: string; border: string; text: string; fill: string; activeBg: string; activeText: string }> = {
  level1: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700', fill: '#dcfce7', activeBg: 'bg-green-600', activeText: 'text-white' },
  level2: { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-700', fill: '#fef9c3', activeBg: 'bg-yellow-500', activeText: 'text-white' },
  level3: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700', fill: '#fee2e2', activeBg: 'bg-red-600', activeText: 'text-white' },
};

// ── MATHS HELPERS ─────────────────────────────────────────────────────────────

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const lcm = (a: number, b: number): number => (a * b) / gcd(a, b);
const simplify = (n: number, d: number): [number, number] => { const g = gcd(n, d); return [n / g, d / g]; };
const toMixed = (n: number, d: number): MixedFmt => { const w = Math.floor(n / d), r = n % d; return { whole: w, num: r, den: d, isMixed: w > 0 && r > 0 }; };

// Format a simplified answer for display given the chosen format
const fmtAnswer = (sn: number, sd: number, fmt: AnswerFormat): string => {
  if (sn === 0) return '0';
  if (sd === 1) return `${sn}`;
  if (fmt === 'mixed' && sn > sd) {
    const m = toMixed(sn, sd);
    return m.num === 0 ? `${m.whole}` : `${m.whole} ${m.num}/${m.den}`;
  }
  return `${sn}/${sd}`;
};

// ── FRACTION QUESTION GENERATOR ───────────────────────────────────────────────

const generateFractionQuestion = (
  level: DifficultyLevel, variables: Record<string, boolean>,
  dropdownValue: string, rangeValue: string,
): Question => {
  const isAdd = dropdownValue === 'mixed' ? Math.random() < 0.5 : dropdownValue === 'add';
  const op = isAdd ? '+' : '−';

  for (let attempt = 0; attempt < 500; attempt++) {
    let num1: number, den1: number, num2: number, den2: number;
    let working: WorkingStep[];

    if (level === 'level1') {
      den1 = Math.floor(Math.random() * 8) + 3; den2 = den1;
      num1 = Math.floor(Math.random() * (den1 - 1)) + 1;
      num2 = Math.floor(Math.random() * (den2 - 1)) + 1;
      if (num1 === num2) continue;
      if (!isAdd && num1 < num2) { const t = num1; num1 = num2; num2 = t; }
      if (isAdd && num1 + num2 === den1 && Math.random() < 0.8) continue;
      const raw = isAdd ? num1 + num2 : num1 - num2;
      if (variables['answerLessThanOne'] && raw >= den1) continue;
      const [sn, sd] = simplify(raw, den1);
      working = [
        { type: 'step', content: `Same denominator — just ${isAdd ? 'add' : 'subtract'} the numerators` },
        { type: 'step', content: `${num1}/${den1} ${op} ${num2}/${den2} = (${num1} ${op} ${num2}) / ${den1} = ${raw}/${den1}` },
      ];
      if (sd !== den1 && raw !== 0) working.push({ type: 'step', content: `Simplify: ${raw}/${den1} = ${sn}/${sd}  (÷${gcd(raw, den1)})` });
      return { display: `${num1}/${den1} ${op} ${num2}/${den2}`, rawNum: sn, rawDen: sd, working, values: { num1, den1, num2, den2, isAdd, isFraction: true }, difficulty: level };
    }

    if (level === 'level2') {
      const base = Math.floor(Math.random() * 9) + 2;
      const mult = Math.floor(Math.random() * 7) + 2;
      den1 = base; den2 = base * mult;
      if (Math.random() < 0.5) { const t = den1; den1 = den2; den2 = t; }
      const smallD = Math.min(den1, den2), largeD = Math.max(den1, den2), m = largeD / smallD;
      num1 = Math.floor(Math.random() * (den1 - 1)) + 1;
      num2 = Math.floor(Math.random() * (den2 - 1)) + 1;
      if (!isAdd && num1 / den1 < num2 / den2) { const tn = num1, td = den1; num1 = num2; den1 = den2; num2 = tn; den2 = td; }
      const sc1 = den1 === smallD ? num1 * m : num1;
      const sc2 = den1 === smallD ? num2 : num2 * m;
      const raw = isAdd ? sc1 + sc2 : sc1 - sc2;
      if (variables['answerLessThanOne'] && raw >= largeD) continue;
      const [sn, sd] = simplify(raw, largeD);
      working = [];
      if (den1 === smallD) working.push({ type: 'step', content: `Scale ${num1}/${den1} up: ×${m}/×${m} = ${sc1}/${largeD}` });
      else working.push({ type: 'step', content: `Scale ${num2}/${den2} up: ×${m}/×${m} = ${sc2}/${largeD}` });
      working.push({ type: 'step', content: `${sc1}/${largeD} ${op} ${sc2}/${largeD} = ${raw}/${largeD}` });
      if (sd !== largeD && raw !== 0) working.push({ type: 'step', content: `Simplify: ${raw}/${largeD} = ${sn}/${sd}  (÷${gcd(raw, largeD)})` });
      return { display: `${num1}/${den1} ${op} ${num2}/${den2}`, rawNum: sn, rawDen: sd, working, values: { num1, den1, num2, den2, isAdd, isFraction: true }, difficulty: level };
    }

    // level3
    const extended = rangeValue === 'extended';
    const maxD = extended ? 15 : 10;
    den1 = Math.floor(Math.random() * (maxD - 1)) + 2;
    den2 = Math.floor(Math.random() * (maxD - 1)) + 2;
    if (den1 === den2 || gcd(den1, den2) !== 1) continue;
    const cl = lcm(den1, den2);
    if (!extended && cl >= 100) continue;
    if (extended && (cl < 65 || cl >= 225)) continue;
    const m1 = cl / den1, m2 = cl / den2;
    num1 = Math.floor(Math.random() * (den1 - 1)) + 1;
    num2 = Math.floor(Math.random() * (den2 - 1)) + 1;
    if (!isAdd && num1 / den1 < num2 / den2) { const tn = num1, td = den1; num1 = num2; den1 = den2; num2 = tn; den2 = td; }
    const sc1 = num1 * m1, sc2 = num2 * m2;
    const raw = isAdd ? sc1 + sc2 : sc1 - sc2;
    if (variables['answerLessThanOne'] && raw >= cl) continue;
    const [sn, sd] = simplify(raw, cl);
    working = [
      { type: 'step', content: `LCM of ${den1} and ${den2} = ${cl}` },
      { type: 'step', content: `${num1}/${den1} = ${sc1}/${cl}  (×${m1})` },
      { type: 'step', content: `${num2}/${den2} = ${sc2}/${cl}  (×${m2})` },
      { type: 'step', content: `${sc1}/${cl} ${op} ${sc2}/${cl} = ${raw}/${cl}` },
    ];
    if (sd !== cl && raw !== 0) working.push({ type: 'step', content: `Simplify: ${raw}/${cl} = ${sn}/${sd}  (÷${gcd(raw, cl)})` });
    return { display: `${num1}/${den1} ${op} ${num2}/${den2}`, rawNum: sn, rawDen: sd, working, values: { num1, den1, num2, den2, isAdd, isFraction: true }, difficulty: level };
  }
  return { display: '1/4 + 1/4', rawNum: 1, rawDen: 2, working: [], values: { num1: 1, den1: 4, num2: 1, den2: 4, isAdd: true, isFraction: true }, difficulty: level };
};

// ── MIXED NUMBER QUESTION GENERATOR ──────────────────────────────────────────

const generateMixedQuestion = (
  level: DifficultyLevel, variables: Record<string, boolean>,
  dropdownValue: string, rangeValue: string,
): Question => {
  const isAdd = dropdownValue === 'mixed' ? Math.random() < 0.5 : dropdownValue === 'add';
  const requiresCarrying = variables['requiresCarrying'] || false;
  const noRegroup = !isAdd && !requiresCarrying;
  const op = isAdd ? '+' : '−';

  // Returns simplified rawNum/rawDen and the working step to convert back (if improper result)
  const buildRaw = (rawN: number, rawD: number): { rawNum: number; rawDen: number; mixedStep: WorkingStep | null } => {
    const [sn, sd] = simplify(rawN, rawD);
    if (sn > sd) {
      const m = toMixed(sn, sd);
      const mixedStr = m.num === 0 ? `${m.whole}` : `${m.whole} ${m.num}/${m.den}`;
      return { rawNum: sn, rawDen: sd, mixedStep: { type: 'step', content: `Convert to mixed number: ${sn}/${sd} = ${mixedStr}` } };
    }
    return { rawNum: sn, rawDen: sd, mixedStep: null };
  };

  for (let attempt = 0; attempt < 500; attempt++) {

    if (level === 'level1') {
      const den = Math.floor(Math.random() * 8) + 3;
      const w1 = Math.random() < 0.25 ? 0 : Math.floor(Math.random() * 3) + 1;
      const w2 = Math.random() < 0.25 ? 0 : Math.floor(Math.random() * 3) + 1;
      if (w1 === 0 && w2 === 0) continue;
      let mNum1 = Math.floor(Math.random() * (den - 1)) + 1;
      let mNum2 = Math.floor(Math.random() * (den - 1)) + 1;
      if (mNum1 === mNum2 && w1 === w2) continue;
      let num1 = w1 * den + mNum1, num2 = w2 * den + mNum2;
      let fw1 = w1, fw2 = w2, fm1 = mNum1, fm2 = mNum2;
      if (!isAdd && num1 < num2) { [num1, num2, fw1, fw2, fm1, fm2] = [num2, num1, w2, w1, mNum2, mNum1]; }
      if (noRegroup && fm1 <= fm2) continue;
      const raw = isAdd ? num1 + num2 : num1 - num2;
      const [sn, sd] = simplify(raw, den);
      const { rawNum, rawDen, mixedStep } = buildRaw(raw, den);
      const working: WorkingStep[] = [
        { type: 'step', content: fw1 > 0 ? `Convert ${fw1} ${fm1}/${den} → improper: ${fw1}×${den}+${fm1} = ${num1}/${den}` : `${fm1}/${den} stays as ${num1}/${den}` },
        { type: 'step', content: fw2 > 0 ? `Convert ${fw2} ${fm2}/${den} → improper: ${fw2}×${den}+${fm2} = ${num2}/${den}` : `${fm2}/${den} stays as ${num2}/${den}` },
        { type: 'step', content: `Same denominator: ${num1}/${den} ${op} ${num2}/${den} = ${raw}/${den}` },
      ];
      if (sd !== den && raw !== 0) working.push({ type: 'step', content: `Simplify: ${raw}/${den} = ${sn}/${sd}  (÷${gcd(raw, den)})` });
      if (mixedStep) working.push(mixedStep);
      return { display: '', rawNum, rawDen, working, values: { num1, den1: den, num2, den2: den, isAdd, isFraction: false, fmt1: { whole: fw1, num: fm1, den, isMixed: fw1 > 0 }, fmt2: { whole: fw2, num: fm2, den, isMixed: fw2 > 0 } }, difficulty: level };
    }

    if (level === 'level2') {
      const base = Math.floor(Math.random() * 6) + 2;
      const mult = Math.floor(Math.random() * 3) + 2;
      let den1 = base, den2 = base * mult;
      if (Math.random() < 0.5) { const t = den1; den1 = den2; den2 = t; }
      const smallD = Math.min(den1, den2), largeD = Math.max(den1, den2), m = largeD / smallD;
      const w1 = Math.random() < 0.25 ? 0 : Math.floor(Math.random() * 3) + 1;
      const w2 = Math.random() < 0.25 ? 0 : Math.floor(Math.random() * 3) + 1;
      if (w1 === 0 && w2 === 0) continue;
      let fm1 = Math.floor(Math.random() * (den1 - 1)) + 1;
      let fm2 = Math.floor(Math.random() * (den2 - 1)) + 1;
      let num1 = w1 * den1 + fm1, num2 = w2 * den2 + fm2;
      let fw1 = w1, fw2 = w2, fd1 = den1, fd2 = den2;
      if (!isAdd && num1 / den1 < num2 / den2) { [num1, fd1, num2, fd2, fw1, fw2, fm1, fm2] = [num2, den2, num1, den1, w2, w1, fm2, fm1]; }
      const sc1 = fd1 === smallD ? num1 * m : num1;
      const sc2 = fd1 === smallD ? num2 : num2 * m;
      const scaledFm1 = fm1 * (largeD / fd1), scaledFm2 = fm2 * (largeD / fd2);
      if (noRegroup && scaledFm1 <= scaledFm2) continue;
      const raw = isAdd ? sc1 + sc2 : sc1 - sc2;
      const [sn, sd] = simplify(raw, largeD);
      const { rawNum, rawDen, mixedStep } = buildRaw(raw, largeD);
      const working: WorkingStep[] = [
        { type: 'step', content: fw1 > 0 ? `Convert ${fw1} ${fm1}/${fd1} → improper: ${fw1}×${fd1}+${fm1} = ${num1}/${fd1}` : `${fm1}/${fd1} stays as ${num1}/${fd1}` },
        { type: 'step', content: fw2 > 0 ? `Convert ${fw2} ${fm2}/${fd2} → improper: ${fw2}×${fd2}+${fm2} = ${num2}/${fd2}` : `${fm2}/${fd2} stays as ${num2}/${fd2}` },
        fd1 === smallD ? { type: 'step', content: `Scale ${num1}/${fd1} up: ×${m}/×${m} = ${sc1}/${largeD}` } : { type: 'step', content: `Scale ${num2}/${fd2} up: ×${m}/×${m} = ${sc2}/${largeD}` },
        { type: 'step', content: `${sc1}/${largeD} ${op} ${sc2}/${largeD} = ${raw}/${largeD}` },
      ];
      if (sd !== largeD && raw !== 0) working.push({ type: 'step', content: `Simplify: ${raw}/${largeD} = ${sn}/${sd}  (÷${gcd(raw, largeD)})` });
      if (mixedStep) working.push(mixedStep);
      return { display: '', rawNum, rawDen, working, values: { num1, den1: fd1, num2, den2: fd2, isAdd, isFraction: false, fmt1: { whole: fw1, num: fm1, den: fd1, isMixed: fw1 > 0 }, fmt2: { whole: fw2, num: fm2, den: fd2, isMixed: fw2 > 0 } }, difficulty: level };
    }

    // level3
    const extended = rangeValue === 'extended';
    const maxD = extended ? 15 : 10, maxLCM = extended ? 225 : 100, minLCM = extended ? 65 : 0;
    let den1 = Math.floor(Math.random() * (maxD - 1)) + 2;
    let den2 = Math.floor(Math.random() * (maxD - 1)) + 2;
    if (den1 === den2 || gcd(den1, den2) !== 1) continue;
    const cl = lcm(den1, den2);
    if (cl > maxLCM || cl <= minLCM) continue;
    const m1 = cl / den1, m2 = cl / den2;
    const w1 = Math.random() < 0.25 ? 0 : Math.floor(Math.random() * 3) + 1;
    const w2 = Math.random() < 0.25 ? 0 : Math.floor(Math.random() * 3) + 1;
    if (w1 === 0 && w2 === 0) continue;
    let fm1 = Math.floor(Math.random() * (den1 - 1)) + 1;
    let fm2 = Math.floor(Math.random() * (den2 - 1)) + 1;
    let num1 = w1 * den1 + fm1, num2 = w2 * den2 + fm2;
    let fw1 = w1, fw2 = w2, fd1 = den1, fd2 = den2, fm1f = fm1, fm2f = fm2;
    if (!isAdd && num1 / den1 < num2 / den2) { [num1, fd1, num2, fd2, fw1, fw2, fm1f, fm2f] = [num2, den2, num1, den1, w2, w1, fm2, fm1]; }
    const scaledFm1 = fm1f * (cl / fd1), scaledFm2 = fm2f * (cl / fd2);
    if (noRegroup && scaledFm1 <= scaledFm2) continue;
    const sc1 = num1 * (cl / fd1), sc2 = num2 * (cl / fd2);
    const raw = isAdd ? sc1 + sc2 : sc1 - sc2;
    const [sn, sd] = simplify(raw, cl);
    const { rawNum, rawDen, mixedStep } = buildRaw(raw, cl);
    const working: WorkingStep[] = [
      { type: 'step', content: fw1 > 0 ? `Convert ${fw1} ${fm1f}/${fd1} → improper: ${fw1}×${fd1}+${fm1f} = ${num1}/${fd1}` : `${fm1f}/${fd1} stays as ${num1}/${fd1}` },
      { type: 'step', content: fw2 > 0 ? `Convert ${fw2} ${fm2f}/${fd2} → improper: ${fw2}×${fd2}+${fm2f} = ${num2}/${fd2}` : `${fm2f}/${fd2} stays as ${num2}/${fd2}` },
      { type: 'step', content: `LCM of ${fd1} and ${fd2} = ${cl}` },
      { type: 'step', content: `${num1}/${fd1} = ${sc1}/${cl}  (×${cl / fd1})` },
      { type: 'step', content: `${num2}/${fd2} = ${sc2}/${cl}  (×${cl / fd2})` },
      { type: 'step', content: `${sc1}/${cl} ${op} ${sc2}/${cl} = ${raw}/${cl}` },
    ];
    if (sd !== cl && raw !== 0) working.push({ type: 'step', content: `Simplify: ${raw}/${cl} = ${sn}/${sd}  (÷${gcd(raw, cl)})` });
    if (mixedStep) working.push(mixedStep);
    return { display: '', rawNum, rawDen, working, values: { num1, den1: fd1, num2, den2: fd2, isAdd, isFraction: false, fmt1: { whole: fw1, num: fm1f, den: fd1, isMixed: fw1 > 0 }, fmt2: { whole: fw2, num: fm2f, den: fd2, isMixed: fw2 > 0 } }, difficulty: level };
  }
  return { display: '', rawNum: 1, rawDen: 1, working: [], values: { num1: 1, den1: 2, num2: 1, den2: 2, isAdd: true, isFraction: false, fmt1: { whole: 1, num: 1, den: 2, isMixed: true }, fmt2: { whole: 1, num: 1, den: 2, isMixed: true } }, difficulty: level };
};

const generateQuestion = (tool: ToolType, level: DifficultyLevel, variables: Record<string, boolean>, dropdownValue: string, rangeValue: string): Question => {
  if (tool === 'fractions') return generateFractionQuestion(level, variables, dropdownValue, rangeValue);
  return generateMixedQuestion(level, variables, dropdownValue, rangeValue);
};

const getQuestionUniqueKey = (q: Question): string => {
  const v = q.values as { num1: number; den1: number; num2: number; den2: number; isAdd: boolean };
  return `${v.num1}-${v.den1}-${v.num2}-${v.den2}-${v.isAdd ? 'a' : 's'}`;
};

const generateUniqueQuestion = (tool: ToolType, level: DifficultyLevel, variables: Record<string, boolean>, dropdownValue: string, rangeValue: string, usedKeys: Set<string>): Question => {
  let q: Question, key = '', attempts = 0;
  do { q = generateQuestion(tool, level, variables, dropdownValue, rangeValue); key = getQuestionUniqueKey(q); if (++attempts > 100) break; } while (usedKeys.has(key));
  usedKeys.add(key);
  return q;
};

// ── RENDER HELPERS ────────────────────────────────────────────────────────────

const FracStack: React.FC<{ n: number; d: number; size: string; color: string }> = ({ n, d, size, color }) => {
  if (d === 1) return <span className={`${size} font-bold`} style={{ color }}>{n}</span>;
  const lh = size === 'text-6xl' ? '4px' : size === 'text-5xl' ? '3px' : '2px';
  const lm = size === 'text-6xl' ? '8px 0' : '4px 0';
  return (
    <div className="inline-flex flex-col items-center">
      <span className={`${size} font-bold`} style={{ color }}>{n}</span>
      <div style={{ width: '100%', height: lh, backgroundColor: color, margin: lm }} />
      <span className={`${size} font-bold`} style={{ color }}>{d}</span>
    </div>
  );
};

const MixedDisplay: React.FC<{ fmt: MixedFmt; size: string; color: string }> = ({ fmt, size, color }) => {
  if (fmt.whole === 0) return <FracStack n={fmt.num} d={fmt.den} size={size} color={color} />;
  return (
    <div className="inline-flex items-center gap-1">
      <span className={`${size} font-bold`} style={{ color }}>{fmt.whole}</span>
      <FracStack n={fmt.num} d={fmt.den} size={size} color={color} />
    </div>
  );
};

// Renders a formatted answer string (may be "3 2/5", "7/5", "1", etc.)
const AnsDisplay: React.FC<{ rawNum: number; rawDen: number; fmt: AnswerFormat; size: string; color: string }> = ({ rawNum, rawDen, fmt, size, color }) => {
  const ansStr = fmtAnswer(rawNum, rawDen, fmt);
  const mix = ansStr.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mix) return <MixedDisplay fmt={{ whole: +mix[1], num: +mix[2], den: +mix[3], isMixed: true }} size={size} color={color} />;
  const frac = ansStr.match(/^(\d+)\/(\d+)$/);
  if (frac) return <FracStack n={+frac[1]} d={+frac[2]} size={size} color={color} />;
  return <span className={`${size} font-bold`} style={{ color }}>{ansStr}</span>;
};

const QuestionDisplay: React.FC<{ q: Question; size: string; showAns: boolean; ansColor: string; answerFormat: AnswerFormat }> = ({ q, size, showAns, ansColor, answerFormat }) => {
  const v = q.values as { num1: number; den1: number; num2: number; den2: number; isAdd: boolean; isFraction: boolean; fmt1?: MixedFmt; fmt2?: MixedFmt };
  const op = v.isAdd ? '+' : '−';

  const left = v.isFraction
    ? <FracStack n={v.num1} d={v.den1} size={size} color="#000000" />
    : v.fmt1 ? <MixedDisplay fmt={v.fmt1} size={size} color="#000000" /> : <FracStack n={v.num1} d={v.den1} size={size} color="#000000" />;

  const right = v.isFraction
    ? <FracStack n={v.num2} d={v.den2} size={size} color="#000000" />
    : v.fmt2 ? <MixedDisplay fmt={v.fmt2} size={size} color="#000000" /> : <FracStack n={v.num2} d={v.den2} size={size} color="#000000" />;

  return (
    <div className="flex items-center justify-center gap-6 flex-wrap">
      {left}
      <span className={`${size} font-bold`} style={{ color: '#000000' }}>{op}</span>
      {right}
      <span className={`${size} font-bold`} style={{ color: '#000000' }}>=</span>
      {showAns
        ? <AnsDisplay rawNum={q.rawNum} rawDen={q.rawDen} fmt={answerFormat} size={size} color={ansColor} />
        : <span className={`${size} font-bold text-gray-400`}>?</span>}
    </div>
  );
};

// ── SHELL SUB-COMPONENTS ──────────────────────────────────────────────────────

const DifficultyToggle: React.FC<{ value: DifficultyLevel; onChange: (v: DifficultyLevel) => void }> = ({ value, onChange }) => (
  <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
    {([['level1', 'Level 1', 'bg-green-600'], ['level2', 'Level 2', 'bg-yellow-500'], ['level3', 'Level 3', 'bg-red-600']] as [DifficultyLevel, string, string][]).map(([val, label, col]) => (
      <button key={val} onClick={() => onChange(val)}
        className={`px-5 py-2 font-bold text-base transition-colors ${value === val ? `${col} text-white` : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
        {label}
      </button>
    ))}
  </div>
);

const DropdownSection: React.FC<{ dropdown: DropdownConfig; value: string; onChange: (v: string) => void }> = ({ dropdown, value, onChange }) => (
  <div className="flex flex-col gap-2">
    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{dropdown.label}</span>
    <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
      {dropdown.options.map((opt) =>
        dropdown.useTwoLineButtons ? (
          <button key={opt.value} onClick={() => onChange(opt.value)}
            className={`flex-1 px-3 py-2.5 text-center transition-colors flex flex-col items-center justify-center ${value === opt.value ? 'bg-blue-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            <span className="text-sm font-bold leading-tight">{opt.label}</span>
            {opt.sub && <span className={`text-xs leading-tight mt-0.5 ${value === opt.value ? 'text-blue-200' : 'text-gray-400'}`}>{opt.sub}</span>}
          </button>
        ) : (
          <button key={opt.value} onClick={() => onChange(opt.value)}
            className={`flex-1 px-4 py-2.5 text-base font-bold transition-colors ${value === opt.value ? 'bg-blue-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            {opt.label}
          </button>
        )
      )}
    </div>
  </div>
);

const VariablesSection: React.FC<{ variables: VariableConfig[]; values: Record<string, boolean>; onChange: (k: string, v: boolean) => void }> = ({ variables, values, onChange }) => (
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

const AnswerFormatSection: React.FC<{ value: AnswerFormat; onChange: (v: AnswerFormat) => void }> = ({ value, onChange }) => (
  <div className="flex flex-col gap-2">
    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Answer Format</span>
    <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
      {([['improper', 'Improper'], ['mixed', 'Mixed Number']] as [AnswerFormat, string][]).map(([v, label]) => (
        <button key={v} onClick={() => onChange(v)}
          className={`flex-1 px-4 py-2.5 text-base font-bold transition-colors ${value === v ? 'bg-blue-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
          {label}
        </button>
      ))}
    </div>
  </div>
);

interface StdQOProps {
  variables: VariableConfig[]; variableValues: Record<string, boolean>; onVariableChange: (k: string, v: boolean) => void;
  dropdown: DropdownConfig | null; dropdownValue: string; onDropdownChange: (v: string) => void;
  rangeDropdown: DropdownConfig | null; rangeValue: string; onRangeChange: (v: string) => void;
  answerFormat: AnswerFormat; onAnswerFormatChange: (v: AnswerFormat) => void;
  operationValue: string;
}

const StandardQOPopover: React.FC<StdQOProps> = ({ variables, variableValues, onVariableChange, dropdown, dropdownValue, onDropdownChange, rangeDropdown, rangeValue, onRangeChange, answerFormat, onAnswerFormatChange, operationValue }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const filteredVars = variables.filter(v => !(v.key === 'requiresCarrying' && operationValue === 'add'));
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className={`px-4 py-2 rounded-xl border-2 font-bold text-base transition-colors shadow-sm flex items-center gap-2 ${open ? 'bg-blue-900 border-blue-900 text-white' : 'bg-white border-gray-300 text-gray-600 hover:border-blue-900 hover:text-blue-900'}`}>
        Question Options <ChevronDown size={18} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-72 p-5 flex flex-col gap-5">
          {dropdown && <DropdownSection dropdown={dropdown} value={dropdownValue} onChange={onDropdownChange} />}
          {rangeDropdown && <DropdownSection dropdown={rangeDropdown} value={rangeValue} onChange={onRangeChange} />}
          <AnswerFormatSection value={answerFormat} onChange={onAnswerFormatChange} />
          {filteredVars.length > 0 && <VariablesSection variables={filteredVars} values={variableValues} onChange={onVariableChange} />}
        </div>
      )}
    </div>
  );
};

interface DiffQOProps {
  toolSettings: ToolSettings;
  levelVariables: Record<DifficultyLevel, Record<string, boolean>>;
  onLevelVariableChange: (lv: DifficultyLevel, k: string, v: boolean) => void;
  levelDropdowns: Record<DifficultyLevel, string>;
  onLevelDropdownChange: (lv: DifficultyLevel, v: string) => void;
  levelRanges: Record<DifficultyLevel, string>;
  onLevelRangeChange: (lv: DifficultyLevel, v: string) => void;
  answerFormat: AnswerFormat; onAnswerFormatChange: (v: AnswerFormat) => void;
  operationValue: string;
}

const DiffQOPopover: React.FC<DiffQOProps> = ({ toolSettings, levelVariables, onLevelVariableChange, levelDropdowns, onLevelDropdownChange, levelRanges, onLevelRangeChange, answerFormat, onAnswerFormatChange, operationValue }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const levels: DifficultyLevel[] = ['level1', 'level2', 'level3'];
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const getRangeForLevel = (lv: DifficultyLevel): DropdownConfig | null => { const dd = toolSettings.difficultySettings?.[lv]?.dropdown; return dd?.key === 'range' ? dd : null; };
  const getOpForLevel = (lv: DifficultyLevel): DropdownConfig | null => { const dd = toolSettings.difficultySettings?.[lv]?.dropdown; if (dd?.key === 'range') return toolSettings.dropdown; return dd ?? toolSettings.dropdown; };
  const getVarsForLevel = (lv: DifficultyLevel): VariableConfig[] => { const vars = toolSettings.difficultySettings?.[lv]?.variables ?? toolSettings.variables; return vars.filter(v => !(v.key === 'requiresCarrying' && operationValue === 'add')); };
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className={`px-4 py-2 rounded-xl border-2 font-bold text-base transition-colors shadow-sm flex items-center gap-2 ${open ? 'bg-blue-900 border-blue-900 text-white' : 'bg-white border-gray-300 text-gray-600 hover:border-blue-900 hover:text-blue-900'}`}>
        Question Options <ChevronDown size={18} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-80 p-5 flex flex-col gap-5">
          <AnswerFormatSection value={answerFormat} onChange={onAnswerFormatChange} />
          {levels.map((lv) => {
            const opDD = getOpForLevel(lv);
            const rangeDD = getRangeForLevel(lv);
            const vars = getVarsForLevel(lv);
            return (
              <div key={lv} className="flex flex-col gap-2">
                <span className={`text-sm font-extrabold uppercase tracking-wider ${LV_HEADER_COLORS[lv]}`}>{LV_LABELS[lv]}</span>
                <div className="flex flex-col gap-3 pl-1">
                  {opDD && opDD.key !== 'range' && <DropdownSection dropdown={opDD} value={levelDropdowns[lv]} onChange={(v) => onLevelDropdownChange(lv, v)} />}
                  {rangeDD && <DropdownSection dropdown={rangeDD} value={levelRanges[lv]} onChange={(v) => onLevelRangeChange(lv, v)} />}
                  {vars.length > 0 && <VariablesSection variables={vars} values={levelVariables[lv]} onChange={(k, v) => onLevelVariableChange(lv, k, v)} />}
                  {!opDD && !rangeDD && vars.length === 0 && <p className="text-xs text-gray-400">No options at this level.</p>}
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
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col" style={{ height: '80vh' }} onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tool Information</h2>
          <p className="text-sm text-gray-400 mt-0.5">A guide to all features and options</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"><X size={20} /></button>
      </div>
      <div className="overflow-y-auto px-7 py-6 flex flex-col gap-6 flex-1">
        {INFO_SECTIONS.map(section => (
          <div key={section.title}>
            <div className="flex items-center gap-2 mb-3"><span className="text-xl">{section.icon}</span><h3 className="text-lg font-bold text-blue-900">{section.title}</h3></div>
            <div className="flex flex-col gap-2">
              {section.content.map(item => (
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

const MenuDropdown: React.FC<{ colorScheme: ColorScheme; setColorScheme: (s: ColorScheme) => void; onClose: () => void; onOpenInfo: () => void }> = ({ colorScheme, setColorScheme, onClose, onOpenInfo }) => {
  const [colorOpen, setColorOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const schemes: ColorScheme[] = ['default', 'blue', 'pink', 'yellow'];
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);
  return (
    <div ref={ref} className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden" style={{ minWidth: '200px' }}>
      <div className="py-1">
        <button onClick={() => setColorOpen(!colorOpen)} className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2"><ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${colorOpen ? '-rotate-90' : ''}`} /><span>Colour Scheme</span></div>
          <span className="text-xs text-gray-400 font-normal capitalize">{colorScheme}</span>
        </button>
        {colorOpen && (
          <div className="border-t border-gray-100">
            {schemes.map(s => (
              <button key={s} onClick={() => { setColorScheme(s); onClose(); }}
                className={`w-full flex items-center justify-between pl-10 pr-4 py-2.5 text-sm font-semibold transition-colors capitalize ${colorScheme === s ? 'bg-blue-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>{s}</button>
            ))}
          </div>
        )}
        <div className="border-t border-gray-100 my-1" />
        <button onClick={() => { onOpenInfo(); onClose(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400 flex-shrink-0"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" /><path d="M8 7v5M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          Tool Information
        </button>
      </div>
    </div>
  );
};

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

const AddSubTool: React.FC = () => {
  const [currentTool, setCurrentTool] = useState<ToolType>('fractions');
  const [mode, setMode] = useState<Mode>('whiteboard');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('level1');
  const [answerFormat, setAnswerFormat] = useState<AnswerFormat>('improper');

  const [toolVariables, setToolVariables] = useState<Record<string, Record<string, boolean>>>(() => {
    const init: Record<string, Record<string, boolean>> = {};
    Object.entries(TOOL_CONFIG.tools).forEach(([k, t]) => {
      init[k] = {};
      (t as ToolSettings).variables.forEach(v => { init[k][v.key] = v.defaultValue; });
      Object.values((t as ToolSettings).difficultySettings ?? {}).forEach(ds => { (ds.variables ?? []).forEach(v => { init[k][v.key] = v.defaultValue; }); });
    });
    return init;
  });

  const [toolDropdowns, setToolDropdowns] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    Object.entries(TOOL_CONFIG.tools).forEach(([k, t]) => { if ((t as ToolSettings).dropdown) init[k] = (t as ToolSettings).dropdown!.defaultValue; });
    return init;
  });

  const [toolRanges, setToolRanges] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    Object.keys(TOOL_CONFIG.tools).forEach(k => { init[k] = 'standard'; });
    return init;
  });

  const [levelVariables, setLevelVariables] = useState<Record<DifficultyLevel, Record<string, boolean>>>(() => ({ level1: {}, level2: {}, level3: {} }));
  const [levelDropdowns, setLevelDropdowns] = useState<Record<DifficultyLevel, string>>(() => ({ level1: 'add', level2: 'add', level3: 'add' }));
  const [levelRanges, setLevelRanges] = useState<Record<DifficultyLevel, string>>(() => ({ level1: 'standard', level2: 'standard', level3: 'standard' }));

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

  const getQBg = () => ({ blue: '#D1E7F8', pink: '#F8D1E7', yellow: '#F8F4D1' }[colorScheme] ?? '#ffffff');
  const getStepBg = () => ({ blue: '#B3D9F2', pink: '#F2B3D9', yellow: '#F2EBB3' }[colorScheme] ?? '#f3f4f6');

  const getToolSettings = (): ToolSettings => TOOL_CONFIG.tools[currentTool] as ToolSettings;
  const getDropdownConfig = (): DropdownConfig | null => { const t = getToolSettings(); const lvDD = t.difficultySettings?.[difficulty]?.dropdown; if (lvDD?.key === 'range') return t.dropdown; return lvDD ?? t.dropdown; };
  const getRangeConfig = (): DropdownConfig | null => { const t = getToolSettings(); const lvDD = t.difficultySettings?.[difficulty]?.dropdown; return lvDD?.key === 'range' ? lvDD : null; };
  const getVariablesConfig = (): VariableConfig[] => { const t = getToolSettings(); return t.difficultySettings?.[difficulty]?.variables ?? t.variables; };
  const getDropdownValue = (): string => toolDropdowns[currentTool] ?? 'add';
  const getRangeValue = (): string => toolRanges[currentTool] ?? 'standard';
  const setDropdownValue = (v: string) => setToolDropdowns(p => ({ ...p, [currentTool]: v }));
  const setRangeValue = (v: string) => setToolRanges(p => ({ ...p, [currentTool]: v }));
  const setVariableValue = (key: string, value: boolean) => setToolVariables(p => ({ ...p, [currentTool]: { ...p[currentTool], [key]: value } }));
  const handleLevelVariableChange = (lv: DifficultyLevel, k: string, v: boolean) => setLevelVariables(p => ({ ...p, [lv]: { ...p[lv], [k]: v } }));
  const handleLevelDropdownChange = (lv: DifficultyLevel, v: string) => setLevelDropdowns(p => ({ ...p, [lv]: v }));
  const handleLevelRangeChange = (lv: DifficultyLevel, v: string) => setLevelRanges(p => ({ ...p, [lv]: v }));

  useEffect(() => { setLevelDropdowns({ level1: getDropdownValue(), level2: getDropdownValue(), level3: getDropdownValue() }); }, [currentTool]);

  const handleNewQuestion = () => {
    const q = generateQuestion(currentTool, difficulty, toolVariables[currentTool] || {}, getDropdownValue(), getRangeValue());
    setCurrentQuestion(q);
    setShowWhiteboardAnswer(false);
    setShowAnswer(false);
  };

  const handleGenerateWorksheet = () => {
    const usedKeys = new Set<string>();
    const questions: Question[] = [];
    if (isDifferentiated) {
      (['level1', 'level2', 'level3'] as DifficultyLevel[]).forEach(lv => {
        for (let i = 0; i < numQuestions; i++) questions.push(generateUniqueQuestion(currentTool, lv, levelVariables[lv], levelDropdowns[lv], levelRanges[lv], usedKeys));
      });
    } else {
      for (let i = 0; i < numQuestions; i++) questions.push(generateUniqueQuestion(currentTool, difficulty, toolVariables[currentTool] || {}, getDropdownValue(), getRangeValue(), usedKeys));
    }
    setWorksheet(questions);
    setShowWorksheetAnswers(false);
  };

  useEffect(() => { if (mode !== 'worksheet') handleNewQuestion(); }, [difficulty, currentTool]);

  const fontSizes = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
  const canIncrease = worksheetFontSize < fontSizes.length - 1;
  const canDecrease = worksheetFontSize > 0;

  const stdQOProps: StdQOProps = {
    variables: getVariablesConfig(), variableValues: toolVariables[currentTool] || {}, onVariableChange: setVariableValue,
    dropdown: getDropdownConfig(), dropdownValue: getDropdownValue(), onDropdownChange: setDropdownValue,
    rangeDropdown: getRangeConfig(), rangeValue: getRangeValue(), onRangeChange: setRangeValue,
    answerFormat, onAnswerFormatChange: setAnswerFormat, operationValue: getDropdownValue(),
  };

  const diffQOProps: DiffQOProps = {
    toolSettings: getToolSettings(),
    levelVariables, onLevelVariableChange: handleLevelVariableChange,
    levelDropdowns, onLevelDropdownChange: handleLevelDropdownChange,
    levelRanges, onLevelRangeChange: handleLevelRangeChange,
    answerFormat, onAnswerFormatChange: setAnswerFormat, operationValue: getDropdownValue(),
  };

  const renderControlBar = (): JSX.Element => {
    if (mode === 'worksheet') return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex justify-center items-center gap-6 mb-4">
          <div className="flex items-center gap-3">
            <label className="text-base font-semibold text-gray-700">Questions:</label>
            <input type="number" min="1" max="20" value={numQuestions}
              onChange={e => setNumQuestions(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
              className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base" />
          </div>
          {isDifferentiated ? <DiffQOPopover {...diffQOProps} /> : <StandardQOPopover {...stdQOProps} />}
          <button onClick={() => setIsDifferentiated(!isDifferentiated)}
            className={`px-6 py-2 rounded-xl font-bold text-base shadow-sm border-2 transition-colors ${isDifferentiated ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-900 hover:text-blue-900'}`}>
            Differentiated
          </button>
        </div>
        {!isDifferentiated && (
          <div className="flex justify-center items-center gap-6 mb-4">
            <DifficultyToggle value={difficulty} onChange={setDifficulty} />
            <div className="flex items-center gap-3">
              <label className="text-base font-semibold text-gray-700">Columns:</label>
              <input type="number" min="1" max="4" value={numColumns}
                onChange={e => setNumColumns(Math.max(1, Math.min(4, parseInt(e.target.value) || 2)))}
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
        <div className="flex items-center justify-between gap-4">
          <DifficultyToggle value={difficulty} onChange={setDifficulty} />
          <StandardQOPopover {...stdQOProps} />
          <div className="flex gap-3">
            <button onClick={handleNewQuestion} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <RefreshCw size={18} /> New Question
            </button>
            <button onClick={() => mode === 'whiteboard' ? setShowWhiteboardAnswer(!showWhiteboardAnswer) : setShowAnswer(!showAnswer)}
              className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <Eye size={18} /> {(mode === 'whiteboard' ? showWhiteboardAnswer : showAnswer) ? 'Hide Answer' : 'Show Answer'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderWhiteboardMode = (): JSX.Element => (
    <div className="rounded-xl shadow-2xl p-8" style={{ backgroundColor: getQBg() }}>
      <div className="flex flex-col items-center justify-center">
        {currentQuestion ? (
          <div className="flex flex-col items-center gap-8 w-full">
            <p className="text-4xl font-semibold text-center">Work out the answer</p>
            <QuestionDisplay q={currentQuestion} size="text-6xl" showAns={showWhiteboardAnswer} ansColor="#166534" answerFormat={answerFormat} />
          </div>
        ) : <span className="text-4xl text-gray-400">Generate question</span>}
      </div>
      <div className="rounded-xl mt-8" style={{ height: '500px', backgroundColor: getStepBg() }} />
    </div>
  );

  const renderWorkedExampleMode = (): JSX.Element => (
    <div className="overflow-y-auto" style={{ height: '120vh' }}>
      <div className="rounded-xl shadow-lg p-8 w-full" style={{ backgroundColor: getQBg() }}>
        {currentQuestion ? (
          <>
            <p className="text-4xl font-semibold text-center mb-8">Work out the answer</p>
            <QuestionDisplay q={currentQuestion} size="text-6xl" showAns={false} ansColor="#166534" answerFormat={answerFormat} />
            {showAnswer && (
              <>
                <div className="space-y-4 mt-8">
                  {currentQuestion.working.map((step, i) => (
                    <div key={i} className="rounded-xl p-6" style={{ backgroundColor: getStepBg() }}>
                      <h4 className="text-xl font-bold mb-2">Step {i + 1}</h4>
                      <p className="text-2xl">{step.content}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl p-6 text-center mt-4" style={{ backgroundColor: getStepBg() }}>
                  <QuestionDisplay q={currentQuestion} size="text-4xl" showAns={true} ansColor="#166534" answerFormat={answerFormat} />
                </div>
              </>
            )}
          </>
        ) : <div className="text-center text-gray-400 text-4xl py-16">Generate question</div>}
      </div>
    </div>
  );

  const renderWorksheetMode = (): JSX.Element => {
    const fsz = fontSizes[worksheetFontSize];
    if (worksheet.length === 0) return (
      <div className="rounded-xl shadow-2xl p-8 text-center" style={{ backgroundColor: getQBg() }}>
        <span className="text-2xl text-gray-400">Generate worksheet</span>
      </div>
    );
    const fontCtrl = (
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <button disabled={!canDecrease} onClick={() => canDecrease && setWorksheetFontSize(worksheetFontSize - 1)}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${canDecrease ? 'bg-blue-900 text-white hover:bg-blue-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}><ChevronDown size={20} /></button>
        <button disabled={!canIncrease} onClick={() => canIncrease && setWorksheetFontSize(worksheetFontSize + 1)}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${canIncrease ? 'bg-blue-900 text-white hover:bg-blue-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}><ChevronUp size={20} /></button>
      </div>
    );
    const renderQCell = (q: Question, idx: number, bgOverride?: string): JSX.Element => (
      <div className="p-3 rounded-lg" style={bgOverride ? { backgroundColor: bgOverride } : {}}>
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`${fsz} font-semibold`}>{idx + 1}.</span>
          <QuestionDisplay q={q} size={fsz} showAns={showWorksheetAnswers} ansColor="#059669" answerFormat={answerFormat} />
        </div>
      </div>
    );
    if (isDifferentiated) return (
      <div className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: getQBg() }}>
        {fontCtrl}
        <h2 className="text-3xl font-bold text-center mb-8">{TOOL_CONFIG.tools[currentTool].name} — Worksheet</h2>
        <div className="grid grid-cols-3 gap-4">
          {(['level1', 'level2', 'level3'] as DifficultyLevel[]).map((lv, li) => {
            const lqs = worksheet.filter(q => q.difficulty === lv);
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
      <div className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: getQBg() }}>
        {fontCtrl}
        <h2 className="text-3xl font-bold text-center mb-8">{TOOL_CONFIG.tools[currentTool].name} — Worksheet</h2>
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
          <button className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors">
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
          <h1 className="text-5xl font-bold text-center mb-8">{TOOL_CONFIG.pageTitle}</h1>
          <div className="flex justify-center mb-8"><div style={{ width: '90%', height: '2px', backgroundColor: '#d1d5db' }} /></div>
          <div className="flex justify-center gap-4 mb-6">
            {(Object.keys(TOOL_CONFIG.tools) as ToolType[]).map(tool => (
              <button key={tool} onClick={() => setCurrentTool(tool)}
                className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${currentTool === tool ? 'bg-blue-900 text-white' : 'bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900'}`}>
                {TOOL_CONFIG.tools[tool].name}
              </button>
            ))}
          </div>
          <div className="flex justify-center mb-8"><div style={{ width: '90%', height: '2px', backgroundColor: '#d1d5db' }} /></div>
          <div className="flex justify-center gap-4 mb-8">
            {(['whiteboard', 'single', 'worksheet'] as Mode[]).map(m => (
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

export default AddSubTool;
