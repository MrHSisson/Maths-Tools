import { useState, useEffect, useRef } from 'react';
import { RefreshCw, Eye, ChevronUp, ChevronDown, Home, Menu, X } from 'lucide-react';

// ── TYPES ────────────────────────────────────────────────────────────────────

type ColorScheme = 'default' | 'blue' | 'pink' | 'yellow';
type DifficultyLevel = 'level1' | 'level2' | 'level3';
type Mode = 'whiteboard' | 'single' | 'worksheet';
type AnswerFormat = 'improper' | 'mixed';
type Operation = 'multiply' | 'divide' | 'mixed';
type ToolType = 'multFractions' | 'multMixed';

type WorkingStep = { type: string; content: string };
type MixedFmt = { whole: number; num: number; den: number; isMixed: boolean };

type Question = {
  display: string;
  rawNum: number;
  rawDen: number;
  working: WorkingStep[];
  values: Record<string, unknown>;
  difficulty: string;
  isDiv: boolean;
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
  pageTitle: 'Multiplication & Division of Fractions',
  useGraphicalLayout: false,
  tools: {
    multFractions: {
      name: 'Fractions',
      useSubstantialBoxes: false,
      variables: [],
      dropdown: null,
      difficultySettings: {
        level1: { variables: [{ key: 'unitFraction', label: 'Include Unit Fraction', defaultValue: false }] },
        level2: { variables: [] },
        level3: { variables: [{ key: 'noIntDiv', label: 'Allow Integer \u00f7 Integer', defaultValue: true }] },
      },
    },
    multMixed: {
      name: 'Mixed Numbers',
      useSubstantialBoxes: false,
      variables: [],
      dropdown: null,
      difficultySettings: {
        level1: { variables: [] },
        level2: { variables: [] },
        level3: { variables: [{ key: 'harderMultiplication', label: 'Harder Multiplication', defaultValue: false }] },
      },
    },
  },
};

// ── INFO_SECTIONS ─────────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  { title: 'Multiplying & Dividing Fractions', icon: '\u00d7', content: [
    { label: 'Overview', detail: 'Generates fraction multiplication and division questions. Use the Operation selector in Question Options to choose Multiply, Divide, or Mixed.' },
    { label: 'Division method', detail: 'Division uses Keep–Flip–Change: keep the first fraction, flip the second, change to multiply. The resulting multiplication must satisfy the same criteria as the chosen level.' },
    { label: 'Level 1 \u2014 Green', detail: 'Two proper fractions whose product does not simplify. Enable "Include Unit Fraction" to force at least one numerator to be 1.' },
    { label: 'Level 2 \u2014 Yellow', detail: 'Two proper fractions whose product can be simplified. Students multiply then simplify using the HCF.' },
    { label: 'Level 3 \u2014 Red', detail: 'A fraction multiplied (or divided) by an integer. Students write the integer as a fraction over 1 before applying KFC or multiplying.' },
  ]},
  { title: 'Multiplying & Dividing Mixed Numbers', icon: '\ud83d\udd22', content: [
    { label: 'Overview', detail: 'Generates mixed number multiplication and division questions. Division uses KFC before converting to improper fractions.' },
    { label: 'Level 1 \u2014 Green', detail: 'A proper fraction multiplied or divided by a mixed number (or vice versa). Numbers kept small.' },
    { label: 'Level 2 \u2014 Yellow', detail: 'A mixed number multiplied or divided by a whole number.' },
    { label: 'Level 3 \u2014 Red', detail: 'Two mixed numbers. Default: whole parts 1\u20133, denominators 2\u20135. Enable "Harder Multiplication" to extend to whole parts 1\u20138 and denominators 2\u201310.' },
  ]},
  { title: 'Modes', icon: '\ud83d\udda5\ufe0f', content: [
    { label: 'Whiteboard', detail: 'Single large question with blank working space. Ideal for whole-class teaching.' },
    { label: 'Worked Example', detail: 'Question with step-by-step solution revealed on demand.' },
    { label: 'Worksheet', detail: 'Grid of questions with adjustable columns and count.' },
  ]},
  { title: 'Differentiated Worksheet', icon: '\ud83d\udccb', content: [
    { label: 'What it does', detail: 'Generates three colour-coded columns \u2014 one per difficulty level \u2014 so the whole class can work from the same sheet at their own level.' },
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
const simplify = (n: number, d: number): [number, number] => { const g = gcd(n, d); return [n / g, d / g]; };
const toMixed = (n: number, d: number): MixedFmt => { const w = Math.floor(n / d), r = n % d; return { whole: w, num: r, den: d, isMixed: w > 0 && r > 0 }; };

const fmtAnswer = (sn: number, sd: number, fmt: AnswerFormat): string => {
  if (sn === 0) return '0';
  if (sd === 1) return `${sn}`;
  if (fmt === 'mixed' && sn > sd) {
    const m = toMixed(sn, sd);
    return m.num === 0 ? `${m.whole}` : `${m.whole} ${m.num}/${m.den}`;
  }
  return `${sn}/${sd}`;
};

// ── MULT FRACTIONS GENERATOR ──────────────────────────────────────────────────

const generateMultFractionQuestion = (level: DifficultyLevel, variables: Record<string, boolean>, operation: Operation): Question => {
  const isDiv = operation === 'mixed' ? Math.random() < 0.5 : operation === 'divide';

  for (let attempt = 0; attempt < 500; attempt++) {

    if (level === 'level1') {
      const forceUnit = variables['unitFraction'] || false;
      const den1 = Math.floor(Math.random() * 11) + 2; // 2-12
      const den2 = Math.floor(Math.random() * 11) + 2;
      if (den1 === den2) continue;
      let finalNum1: number, finalNum2: number;
      if (forceUnit) {
        const bothUnit = Math.random() < 0.2;
        if (bothUnit) {
          finalNum1 = 1; finalNum2 = 1;
        } else if (Math.random() < 0.5) {
          finalNum1 = 1;
          finalNum2 = den2 > 2 ? Math.floor(Math.random() * (den2 - 2)) + 2 : 1;
        } else {
          finalNum1 = den1 > 2 ? Math.floor(Math.random() * (den1 - 2)) + 2 : 1;
          finalNum2 = 1;
        }
      } else {
        finalNum1 = Math.floor(Math.random() * (den1 - 1)) + 1;
        finalNum2 = Math.floor(Math.random() * (den2 - 1)) + 1;
        if (finalNum1 === 1 && finalNum2 === 1 && Math.random() > 0.2) continue;
      }
      const rawN = finalNum1 * finalNum2;
      const rawD = den1 * den2;
      const [sn, sd] = simplify(rawN, rawD);
      if (gcd(rawN, rawD) !== 1) continue;
      if (rawD > 144) continue;
      // For division: display as (finalNum1/den1) ÷ (den2/finalNum2), i.e. divisor is flipped form
      // KFC: keep finalNum1/den1, flip den2/finalNum2 → finalNum2/den2, change to ×
      const working: WorkingStep[] = isDiv ? [
        { type: 'step', content: `Keep the first fraction: ${finalNum1}/${den1}` },
        { type: 'step', content: `Flip the second fraction: ${den2}/${finalNum2} \u2192 ${finalNum2}/${den2}` },
        { type: 'step', content: `Change \u00f7 to \u00d7: ${finalNum1}/${den1} \u00d7 ${finalNum2}/${den2}` },
        { type: 'step', content: `Multiply numerators: ${finalNum1} \u00d7 ${finalNum2} = ${rawN}` },
        { type: 'step', content: `Multiply denominators: ${den1} \u00d7 ${den2} = ${rawD}` },
        { type: 'step', content: `Answer: ${rawN}/${rawD}  (does not simplify)` },
      ] : [
        { type: 'step', content: `Multiply the numerators: ${finalNum1} \u00d7 ${finalNum2} = ${rawN}` },
        { type: 'step', content: `Multiply the denominators: ${den1} \u00d7 ${den2} = ${rawD}` },
        { type: 'step', content: `Answer: ${rawN}/${rawD}  (does not simplify)` },
      ];
      const display = isDiv
        ? `${finalNum1}/${den1} \u00f7 ${den2}/${finalNum2}`
        : `${finalNum1}/${den1} \u00d7 ${finalNum2}/${den2}`;
      return { display, rawNum: sn, rawDen: sd, working,
        values: { num1: finalNum1, den1, num2: finalNum2, den2, isInteger: false, intVal: 0, isDiv,
          dispNum1: finalNum1, dispDen1: den1,
          dispNum2: isDiv ? den2 : finalNum2,
          dispDen2: isDiv ? finalNum2 : den2 },
        difficulty: level, isDiv };
    }

    if (level === 'level2') {
      // Two proper fractions whose product CAN simplify
      const den1 = Math.floor(Math.random() * 11) + 2; // 2-12
      const den2 = Math.floor(Math.random() * 11) + 2;
      const num1 = Math.floor(Math.random() * (den1 - 1)) + 1;
      const num2 = Math.floor(Math.random() * (den2 - 1)) + 1;
      const rawN = num1 * num2;
      const rawD = den1 * den2;
      const g = gcd(rawN, rawD);
      if (g <= 1) continue;
      if (rawD > 144) continue;
      const [sn, sd] = simplify(rawN, rawD);
      if (sn === rawN) continue;
      const working: WorkingStep[] = isDiv ? [
        { type: 'step', content: `Keep the first fraction: ${num1}/${den1}` },
        { type: 'step', content: `Flip the second fraction: ${den2}/${num2} \u2192 ${num2}/${den2}` },
        { type: 'step', content: `Change \u00f7 to \u00d7: ${num1}/${den1} \u00d7 ${num2}/${den2}` },
        { type: 'step', content: `Multiply numerators: ${num1} \u00d7 ${num2} = ${rawN}` },
        { type: 'step', content: `Multiply denominators: ${den1} \u00d7 ${den2} = ${rawD}` },
        { type: 'step', content: `Simplify ${rawN}/${rawD}: divide by ${g} \u2192 ${sn}/${sd}` },
      ] : [
        { type: 'step', content: `Multiply the numerators: ${num1} \u00d7 ${num2} = ${rawN}` },
        { type: 'step', content: `Multiply the denominators: ${den1} \u00d7 ${den2} = ${rawD}` },
        { type: 'step', content: `Simplify ${rawN}/${rawD}: divide by ${g} \u2192 ${sn}/${sd}` },
      ];
      const display = isDiv
        ? `${num1}/${den1} \u00f7 ${den2}/${num2}`
        : `${num1}/${den1} \u00d7 ${num2}/${den2}`;
      return { display, rawNum: sn, rawDen: sd, working,
        values: { num1, den1, num2, den2, isInteger: false, intVal: 0, isDiv,
          dispNum1: num1, dispDen1: den1,
          dispNum2: isDiv ? den2 : num2,
          dispDen2: isDiv ? num2 : den2 },
        difficulty: level, isDiv };
    }

    // level3: integer × or ÷ fraction
    const den = Math.floor(Math.random() * 11) + 2; // 2–12
    const num = Math.floor(Math.random() * (den - 1)) + 1;
    const intVal = Math.floor(Math.random() * 9) + 2; // 2–10
    if (intVal === den) continue;
    // When dividing, num=1 makes den/num render as a plain integer → int ÷ int appearance
    if (isDiv && !variables['noIntDiv'] && num === 1) continue;
    const rawN = intVal * num;
    const rawD = den;
    const g = gcd(rawN, rawD);
    const [sn, sd] = simplify(rawN, rawD);
    // For division: intVal ÷ (num/den) — KFC: intVal/1 ÷ num/den → intVal/1 × den/num
    // But that gives intVal*den/num which can be messy. Instead keep same structure:
    // display as intVal ÷ (den/num), KFC flips den/num → num/den, same multiplication result.
    const flipDisplay = Math.random() < 0.5;
    let working: WorkingStep[];
    let display: string;
    if (isDiv) {
      // display: intVal ÷ den/num  (or den/num ÷ intVal — but ÷ by integer is more natural)
      // KFC: keep intVal/1, flip den/num → num/den, multiply
      working = [
        { type: 'step', content: `Write the integer as a fraction: ${intVal} = ${intVal}/1` },
        { type: 'step', content: `Keep: ${intVal}/1` },
        { type: 'step', content: `Flip: ${den}/${num} \u2192 ${num}/${den}` },
        { type: 'step', content: `Change \u00f7 to \u00d7: ${intVal}/1 \u00d7 ${num}/${den}` },
        { type: 'step', content: `Numerators: ${intVal} \u00d7 ${num} = ${rawN}` },
        { type: 'step', content: `Denominators: 1 \u00d7 ${den} = ${den}` },
      ];
      if (g > 1) working.push({ type: 'step', content: `Simplify ${rawN}/${rawD}: divide by ${g} \u2192 ${sn}/${sd}` });
      else working.push({ type: 'step', content: `Answer: ${rawN}/${rawD}` });
      display = flipDisplay ? `${den}/${num} \u00f7 ${intVal}` : `${intVal} \u00f7 ${den}/${num}`;
      // For flipDisplay (frac ÷ int): den/num ÷ intVal — KFC: keep den/num, flip intVal/1 → 1/intVal
      if (flipDisplay) {
        // den/num ÷ intVal: KFC → den/num × 1/intVal = den/(num*intVal)
        const fRawN = den;
        const fRawD = num * intVal;
        const [fsn, fsd] = simplify(fRawN, fRawD);
        const fg = gcd(fRawN, fRawD);
        working = [
          { type: 'step', content: `Write the integer as a fraction: ${intVal} = ${intVal}/1` },
          { type: 'step', content: `Keep: ${den}/${num}` },
          { type: 'step', content: `Flip: ${intVal}/1 \u2192 1/${intVal}` },
          { type: 'step', content: `Change \u00f7 to \u00d7: ${den}/${num} \u00d7 1/${intVal}` },
          { type: 'step', content: `Numerators: ${den} \u00d7 1 = ${fRawN}` },
          { type: 'step', content: `Denominators: ${num} \u00d7 ${intVal} = ${fRawD}` },
        ];
        if (fg > 1) working.push({ type: 'step', content: `Simplify ${fRawN}/${fRawD}: divide by ${fg} \u2192 ${fsn}/${fsd}` });
        else working.push({ type: 'step', content: `Answer: ${fRawN}/${fRawD}` });
        return { display, rawNum: fsn, rawDen: fsd, working,
          values: { isInteger: true, intVal, flipDisplay: true, isDiv: true,
            dispNum1: den, dispDen1: num, dispNum2: intVal, dispDen2: 1 },
          difficulty: level, isDiv: true };
      }
    } else {
      working = [
        { type: 'step', content: `Write the integer as a fraction: ${intVal} = ${intVal}/1` },
        { type: 'step', content: `Multiply: ${intVal}/1 \u00d7 ${num}/${den}` },
        { type: 'step', content: `Numerators: ${intVal} \u00d7 ${num} = ${rawN}` },
        { type: 'step', content: `Denominators: 1 \u00d7 ${den} = ${den}` },
      ];
      if (g > 1) working.push({ type: 'step', content: `Simplify ${rawN}/${rawD}: divide by ${g} \u2192 ${sn}/${sd}` });
      else working.push({ type: 'step', content: `Answer: ${rawN}/${rawD}` });
      display = flipDisplay ? `${num}/${den} \u00d7 ${intVal}` : `${intVal} \u00d7 ${num}/${den}`;
    }
    return { display, rawNum: sn, rawDen: sd, working,
      values: { isInteger: true, intVal, flipDisplay, isDiv,
        dispNum1: isDiv ? intVal : (flipDisplay ? num : intVal),
        dispDen1: isDiv ? 1      : (flipDisplay ? den : 1),
        dispNum2: isDiv ? den    : (flipDisplay ? intVal : num),
        dispDen2: isDiv ? num    : (flipDisplay ? 1 : den) },
      difficulty: level, isDiv };
  }
  return { display: '2/3 \u00d7 1/4', rawNum: 1, rawDen: 6, working: [], values: { num1: 2, den1: 3, num2: 1, den2: 4, isInteger: false, intVal: 0, isDiv: false }, difficulty: level, isDiv: false };
};

// ── MULT MIXED GENERATOR ──────────────────────────────────────────────────────

const generateMultMixedQuestion = (level: DifficultyLevel, variables: Record<string, boolean>, operation: Operation): Question => {
  const isDiv = operation === 'mixed' ? Math.random() < 0.5 : operation === 'divide';
  for (let attempt = 0; attempt < 500; attempt++) {

    if (level === 'level1') {
      // Fraction × or ÷ Mixed number (or vice versa)
      const den1 = Math.floor(Math.random() * 5) + 2; // 2–6
      const num1 = Math.floor(Math.random() * (den1 - 1)) + 1;
      const whole2 = Math.floor(Math.random() * 3) + 1; // 1–3
      const den2 = Math.floor(Math.random() * 5) + 2;
      const num2 = Math.floor(Math.random() * (den2 - 1)) + 1;
      const imp2N = whole2 * den2 + num2;
      const imp2D = den2;
      // The multiplication that we ultimately compute: num1/den1 × imp2N/imp2D
      const rawN = num1 * imp2N;
      const rawD = den1 * imp2D;
      if (rawN > 60 || rawD > 60) continue;
      const [sn, sd] = simplify(rawN, rawD);
      const fmt2: MixedFmt = { whole: whole2, num: num2, den: den2, isMixed: true };
      const fmt1pure: MixedFmt = { whole: 0, num: num1, den: den1, isMixed: false };
      const flipDisplay = Math.random() < 0.5;
      const mixedConvert = (sn > sd) ? (() => { const m = toMixed(sn, sd); return m.num === 0 ? `${m.whole}` : `${m.whole} ${m.num}/${m.den}`; })() : null;

      let working: WorkingStep[];
      if (isDiv) {
        // Display: fraction ÷ mixed  (or mixed ÷ fraction if flipped)
        // KFC: flip the divisor, then proceed as multiplication
        if (!flipDisplay) {
          // num1/den1 ÷ (whole2 num2/den2)
          // KFC: flip imp2N/imp2D → imp2D/imp2N, then multiply
          const kfcN = num1 * imp2D;
          const kfcD = den1 * imp2N;
          const [ksn, ksd] = simplify(kfcN, kfcD);
          if (kfcN > 60 || kfcD > 60) continue;
          const km = ksn > ksd ? (() => { const m = toMixed(ksn, ksd); return m.num === 0 ? `${m.whole}` : `${m.whole} ${m.num}/${m.den}`; })() : null;
          working = [
            { type: 'step', content: `Convert ${whole2} ${num2}/${den2} to improper: ${whole2}\u00d7${den2}+${num2} = ${imp2N}/${imp2D}` },
            { type: 'step', content: `Keep: ${num1}/${den1}` },
            { type: 'step', content: `Flip: ${imp2N}/${imp2D} \u2192 ${imp2D}/${imp2N}` },
            { type: 'step', content: `Change \u00f7 to \u00d7: ${num1}/${den1} \u00d7 ${imp2D}/${imp2N}` },
            { type: 'step', content: `Numerators: ${num1} \u00d7 ${imp2D} = ${kfcN}` },
            { type: 'step', content: `Denominators: ${den1} \u00d7 ${imp2N} = ${kfcD}` },
          ];
          if (gcd(kfcN, kfcD) > 1) working.push({ type: 'step', content: `Simplify ${kfcN}/${kfcD} \u2192 ${ksn}/${ksd}  (\u00f7${gcd(kfcN, kfcD)})` });
          if (km) working.push({ type: 'step', content: `Convert to mixed number: ${ksn}/${ksd} = ${km}` });
          return { display: '', rawNum: ksn, rawDen: ksd, working, values: { isL1Mixed: true, flipDisplay: false, isDiv: true, fmt1: fmt1pure, fmt2 }, difficulty: level, isDiv: true };
        } else {
          // (whole2 num2/den2) ÷ num1/den1
          // KFC: flip num1/den1 → den1/num1, multiply imp2N/imp2D × den1/num1
          const kfcN = imp2N * den1;
          const kfcD = imp2D * num1;
          const [ksn, ksd] = simplify(kfcN, kfcD);
          if (kfcN > 60 || kfcD > 60) continue;
          const km = ksn > ksd ? (() => { const m = toMixed(ksn, ksd); return m.num === 0 ? `${m.whole}` : `${m.whole} ${m.num}/${m.den}`; })() : null;
          working = [
            { type: 'step', content: `Convert ${whole2} ${num2}/${den2} to improper: ${whole2}\u00d7${den2}+${num2} = ${imp2N}/${imp2D}` },
            { type: 'step', content: `Keep: ${imp2N}/${imp2D}` },
            { type: 'step', content: `Flip: ${num1}/${den1} \u2192 ${den1}/${num1}` },
            { type: 'step', content: `Change \u00f7 to \u00d7: ${imp2N}/${imp2D} \u00d7 ${den1}/${num1}` },
            { type: 'step', content: `Numerators: ${imp2N} \u00d7 ${den1} = ${kfcN}` },
            { type: 'step', content: `Denominators: ${imp2D} \u00d7 ${num1} = ${kfcD}` },
          ];
          if (gcd(kfcN, kfcD) > 1) working.push({ type: 'step', content: `Simplify ${kfcN}/${kfcD} \u2192 ${ksn}/${ksd}  (\u00f7${gcd(kfcN, kfcD)})` });
          if (km) working.push({ type: 'step', content: `Convert to mixed number: ${ksn}/${ksd} = ${km}` });
          return { display: '', rawNum: ksn, rawDen: ksd, working, values: { isL1Mixed: true, flipDisplay: true, isDiv: true, fmt1: fmt1pure, fmt2 }, difficulty: level, isDiv: true };
        }
      } else {
        working = [
          { type: 'step', content: `Convert ${whole2} ${num2}/${den2} to improper: ${whole2}\u00d7${den2}+${num2} = ${imp2N}/${imp2D}` },
          { type: 'step', content: `Multiply: ${num1}/${den1} \u00d7 ${imp2N}/${imp2D}` },
          { type: 'step', content: `Numerators: ${num1} \u00d7 ${imp2N} = ${rawN}` },
          { type: 'step', content: `Denominators: ${den1} \u00d7 ${imp2D} = ${rawD}` },
        ];
        if (gcd(rawN, rawD) > 1) working.push({ type: 'step', content: `Simplify ${rawN}/${rawD} \u2192 ${sn}/${sd}  (\u00f7${gcd(rawN, rawD)})` });
        if (mixedConvert) working.push({ type: 'step', content: `Convert to mixed number: ${sn}/${sd} = ${mixedConvert}` });
        return { display: '', rawNum: sn, rawDen: sd, working, values: { isL1Mixed: true, flipDisplay, isDiv: false, fmt1: fmt1pure, fmt2 }, difficulty: level, isDiv: false };
      }
    }

    if (level === 'level2') {
      // Mixed number × or ÷ whole number
      const whole2 = Math.floor(Math.random() * 4) + 2; // integer: 2–5
      const wholeM = Math.floor(Math.random() * 3) + 1; // mixed whole: 1–3
      const denM = Math.floor(Math.random() * 5) + 2; // 2–6
      const numM = Math.floor(Math.random() * (denM - 1)) + 1;
      const impMN = wholeM * denM + numM;
      const fmtM: MixedFmt = { whole: wholeM, num: numM, den: denM, isMixed: true };
      const flipDisplay = Math.random() < 0.5;

      if (isDiv) {
        // mixed ÷ integer  or  integer ÷ mixed
        if (!flipDisplay) {
          // (wholeM numM/denM) ÷ whole2 → KFC: impMN/denM × 1/whole2
          const kfcN = impMN;
          const kfcD = denM * whole2;
          if (kfcN > 60 || kfcD > 60) continue;
          const [ksn, ksd] = simplify(kfcN, kfcD);
          const km = ksn > ksd ? (() => { const m = toMixed(ksn, ksd); return m.num === 0 ? `${m.whole}` : `${m.whole} ${m.num}/${m.den}`; })() : null;
          const working: WorkingStep[] = [
            { type: 'step', content: `Convert ${wholeM} ${numM}/${denM} to improper: ${wholeM}\u00d7${denM}+${numM} = ${impMN}/${denM}` },
            { type: 'step', content: `Write ${whole2} as a fraction: ${whole2}/1` },
            { type: 'step', content: `Keep: ${impMN}/${denM}` },
            { type: 'step', content: `Flip: ${whole2}/1 \u2192 1/${whole2}` },
            { type: 'step', content: `Change \u00f7 to \u00d7: ${impMN}/${denM} \u00d7 1/${whole2}` },
            { type: 'step', content: `Numerators: ${impMN} \u00d7 1 = ${kfcN}` },
            { type: 'step', content: `Denominators: ${denM} \u00d7 ${whole2} = ${kfcD}` },
          ];
          if (gcd(kfcN, kfcD) > 1) working.push({ type: 'step', content: `Simplify ${kfcN}/${kfcD} \u2192 ${ksn}/${ksd}  (\u00f7${gcd(kfcN, kfcD)})` });
          if (km) working.push({ type: 'step', content: `Convert to mixed number: ${ksn}/${ksd} = ${km}` });
          return { display: '', rawNum: ksn, rawDen: ksd, working, values: { isL2MixedInt: true, flipDisplay: false, isDiv: true, fmtM, intVal: whole2 }, difficulty: level, isDiv: true };
        } else {
          // whole2 ÷ (wholeM numM/denM) → KFC: whole2/1 × denM/impMN
          const kfcN = whole2 * denM;
          const kfcD = impMN;
          if (kfcN > 60 || kfcD > 60) continue;
          const [ksn, ksd] = simplify(kfcN, kfcD);
          const km = ksn > ksd ? (() => { const m = toMixed(ksn, ksd); return m.num === 0 ? `${m.whole}` : `${m.whole} ${m.num}/${m.den}`; })() : null;
          const working: WorkingStep[] = [
            { type: 'step', content: `Convert ${wholeM} ${numM}/${denM} to improper: ${wholeM}\u00d7${denM}+${numM} = ${impMN}/${denM}` },
            { type: 'step', content: `Write ${whole2} as a fraction: ${whole2}/1` },
            { type: 'step', content: `Keep: ${whole2}/1` },
            { type: 'step', content: `Flip: ${impMN}/${denM} \u2192 ${denM}/${impMN}` },
            { type: 'step', content: `Change \u00f7 to \u00d7: ${whole2}/1 \u00d7 ${denM}/${impMN}` },
            { type: 'step', content: `Numerators: ${whole2} \u00d7 ${denM} = ${kfcN}` },
            { type: 'step', content: `Denominators: 1 \u00d7 ${impMN} = ${kfcD}` },
          ];
          if (gcd(kfcN, kfcD) > 1) working.push({ type: 'step', content: `Simplify ${kfcN}/${kfcD} \u2192 ${ksn}/${ksd}  (\u00f7${gcd(kfcN, kfcD)})` });
          if (km) working.push({ type: 'step', content: `Convert to mixed number: ${ksn}/${ksd} = ${km}` });
          return { display: '', rawNum: ksn, rawDen: ksd, working, values: { isL2MixedInt: true, flipDisplay: true, isDiv: true, fmtM, intVal: whole2 }, difficulty: level, isDiv: true };
        }
      } else {
        const rawN = impMN * whole2;
        const rawD = denM;
        if (rawN > 60) continue;
        const [sn, sd] = simplify(rawN, rawD);
        const km = sn > sd ? (() => { const m = toMixed(sn, sd); return m.num === 0 ? `${m.whole}` : `${m.whole} ${m.num}/${m.den}`; })() : null;
        const working: WorkingStep[] = [
          { type: 'step', content: `Convert ${wholeM} ${numM}/${denM} to improper: ${wholeM}\u00d7${denM}+${numM} = ${impMN}/${denM}` },
          { type: 'step', content: `Write ${whole2} as a fraction: ${whole2}/1` },
          { type: 'step', content: `Multiply: ${impMN}/${denM} \u00d7 ${whole2}/1` },
          { type: 'step', content: `Numerators: ${impMN} \u00d7 ${whole2} = ${rawN}` },
          { type: 'step', content: `Denominators: ${denM} \u00d7 1 = ${denM}` },
        ];
        if (gcd(rawN, rawD) > 1) working.push({ type: 'step', content: `Simplify ${rawN}/${rawD} \u2192 ${sn}/${sd}  (\u00f7${gcd(rawN, rawD)})` });
        if (km) working.push({ type: 'step', content: `Convert to mixed number: ${sn}/${sd} = ${km}` });
        return { display: '', rawNum: sn, rawDen: sd, working, values: { isL2MixedInt: true, flipDisplay, isDiv: false, fmtM, intVal: whole2 }, difficulty: level, isDiv: false };
      }
    }

    // level3: two mixed numbers × or ÷
    const harder = variables['harderMultiplication'] || false;
    const maxWhole = harder ? 8 : 3;
    const maxDen = harder ? 9 : 4;
    const maxProduct = harder ? 200 : 80;
    const maxDenProd = harder ? 100 : 25;
    const w1 = Math.floor(Math.random() * maxWhole) + 1;
    const den1 = Math.floor(Math.random() * maxDen) + 2;
    const num1 = Math.floor(Math.random() * (den1 - 1)) + 1;
    const w2 = Math.floor(Math.random() * maxWhole) + 1;
    const den2 = Math.floor(Math.random() * maxDen) + 2;
    const num2 = Math.floor(Math.random() * (den2 - 1)) + 1;
    const imp1N = w1 * den1 + num1;
    const imp2N = w2 * den2 + num2;
    const fmt1: MixedFmt = { whole: w1, num: num1, den: den1, isMixed: true };
    const fmt2: MixedFmt = { whole: w2, num: num2, den: den2, isMixed: true };

    if (isDiv) {
      // (w1 num1/den1) ÷ (w2 num2/den2) → KFC: imp1N/den1 × den2/imp2N
      const kfcN = imp1N * den2;
      const kfcD = den1 * imp2N;
      if (kfcN > maxProduct || kfcD > maxDenProd) continue;
      const [ksn, ksd] = simplify(kfcN, kfcD);
      const km = ksn > ksd ? (() => { const m = toMixed(ksn, ksd); return m.num === 0 ? `${m.whole}` : `${m.whole} ${m.num}/${m.den}`; })() : null;
      const working: WorkingStep[] = [
        { type: 'step', content: `Convert ${w1} ${num1}/${den1} to improper: ${w1}\u00d7${den1}+${num1} = ${imp1N}/${den1}` },
        { type: 'step', content: `Convert ${w2} ${num2}/${den2} to improper: ${w2}\u00d7${den2}+${num2} = ${imp2N}/${den2}` },
        { type: 'step', content: `Keep: ${imp1N}/${den1}` },
        { type: 'step', content: `Flip: ${imp2N}/${den2} \u2192 ${den2}/${imp2N}` },
        { type: 'step', content: `Change \u00f7 to \u00d7: ${imp1N}/${den1} \u00d7 ${den2}/${imp2N}` },
        { type: 'step', content: `Numerators: ${imp1N} \u00d7 ${den2} = ${kfcN}` },
        { type: 'step', content: `Denominators: ${den1} \u00d7 ${imp2N} = ${kfcD}` },
      ];
      if (gcd(kfcN, kfcD) > 1) working.push({ type: 'step', content: `Simplify ${kfcN}/${kfcD} \u2192 ${ksn}/${ksd}  (\u00f7${gcd(kfcN, kfcD)})` });
      if (km) working.push({ type: 'step', content: `Convert to mixed number: ${ksn}/${ksd} = ${km}` });
      return { display: '', rawNum: ksn, rawDen: ksd, working, values: { isL3TwoMixed: true, isDiv: true, fmt1, fmt2, imp1N, den1, imp2N, den2 }, difficulty: level, isDiv: true };
    } else {
      const rawN = imp1N * imp2N;
      const rawD = den1 * den2;
      if (rawN > maxProduct || rawD > maxDenProd) continue;
      const [sn, sd] = simplify(rawN, rawD);
      const km = sn > sd ? (() => { const m = toMixed(sn, sd); return m.num === 0 ? `${m.whole}` : `${m.whole} ${m.num}/${m.den}`; })() : null;
      const working: WorkingStep[] = [
        { type: 'step', content: `Convert ${w1} ${num1}/${den1} to improper: ${w1}\u00d7${den1}+${num1} = ${imp1N}/${den1}` },
        { type: 'step', content: `Convert ${w2} ${num2}/${den2} to improper: ${w2}\u00d7${den2}+${num2} = ${imp2N}/${den2}` },
        { type: 'step', content: `Multiply: ${imp1N}/${den1} \u00d7 ${imp2N}/${den2}` },
        { type: 'step', content: `Numerators: ${imp1N} \u00d7 ${imp2N} = ${rawN}` },
        { type: 'step', content: `Denominators: ${den1} \u00d7 ${den2} = ${rawD}` },
      ];
      if (gcd(rawN, rawD) > 1) working.push({ type: 'step', content: `Simplify ${rawN}/${rawD} \u2192 ${sn}/${sd}  (\u00f7${gcd(rawN, rawD)})` });
      if (km) working.push({ type: 'step', content: `Convert to mixed number: ${sn}/${sd} = ${km}` });
      return { display: '', rawNum: sn, rawDen: sd, working, values: { isL3TwoMixed: true, isDiv: false, fmt1, fmt2, imp1N, den1, imp2N, den2 }, difficulty: level, isDiv: false };
    }
  }
  return { display: '', rawNum: 3, rawDen: 1, working: [], values: {}, difficulty: level, isDiv: false };
};

const generateQuestion = (tool: ToolType, level: DifficultyLevel, variables: Record<string, boolean>, operation: Operation): Question => {
  if (tool === 'multFractions') return generateMultFractionQuestion(level, variables, operation);
  return generateMultMixedQuestion(level, variables, operation);
};

const getQuestionUniqueKey = (q: Question): string => {
  const v = q.values as Record<string, unknown>;
  return JSON.stringify({ n1: v.num1, d1: v.den1, n2: v.num2, d2: v.den2, imp1: v.imp1N, imp2: v.imp2N, intV: v.intVal, div: q.isDiv });
};

const generateUniqueQuestion = (tool: ToolType, level: DifficultyLevel, variables: Record<string, boolean>, operation: Operation, usedKeys: Set<string>): Question => {
  let q: Question, key = '', attempts = 0;
  do { q = generateQuestion(tool, level, variables, operation); key = getQuestionUniqueKey(q); if (++attempts > 100) break; } while (usedKeys.has(key));
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
  if (fmt.num === 0) return <span className={`${size} font-bold`} style={{ color }}>{fmt.whole}</span>;
  return (
    <div className="inline-flex items-center gap-1">
      <span className={`${size} font-bold`} style={{ color }}>{fmt.whole}</span>
      <FracStack n={fmt.num} d={fmt.den} size={size} color={color} />
    </div>
  );
};

const AnsDisplay: React.FC<{ rawNum: number; rawDen: number; fmt: AnswerFormat; size: string; color: string }> = ({ rawNum, rawDen, fmt, size, color }) => {
  const ansStr = fmtAnswer(rawNum, rawDen, fmt);
  const mix = ansStr.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mix) return <MixedDisplay fmt={{ whole: +mix[1], num: +mix[2], den: +mix[3], isMixed: true }} size={size} color={color} />;
  const frac = ansStr.match(/^(\d+)\/(\d+)$/);
  if (frac) return <FracStack n={+frac[1]} d={+frac[2]} size={size} color={color} />;
  return <span className={`${size} font-bold`} style={{ color }}>{ansStr}</span>;
};

// Renders the question's left and right operands
const QuestionDisplay: React.FC<{ q: Question; size: string; showAns: boolean; ansColor: string; answerFormat: AnswerFormat }> = ({ q, size, showAns, ansColor, answerFormat }) => {
  const v = q.values as {
    // multFractions — display fields (correct for both × and ÷)
    dispNum1?: number; dispDen1?: number; dispNum2?: number; dispDen2?: number;
    isInteger?: boolean; intVal?: number; flipDisplay?: boolean;
    // multMixed L1
    isL1Mixed?: boolean; fmt1?: MixedFmt; fmt2?: MixedFmt;
    // multMixed L2
    isL2MixedInt?: boolean; fmtM?: MixedFmt;
    // multMixed L3
    isL3TwoMixed?: boolean;
  };

  let left: React.ReactNode;
  let right: React.ReactNode;

  if (v.isL3TwoMixed && v.fmt1 && v.fmt2) {
    left = <MixedDisplay fmt={v.fmt1} size={size} color="#000000" />;
    right = <MixedDisplay fmt={v.fmt2} size={size} color="#000000" />;
  } else if (v.isL2MixedInt && v.fmtM) {
    const intNode = <span className={`${size} font-bold`} style={{ color: '#000000' }}>{v.intVal}</span>;
    const mixNode = <MixedDisplay fmt={v.fmtM} size={size} color="#000000" />;
    if (v.flipDisplay) { left = intNode; right = mixNode; }
    else { left = mixNode; right = intNode; }
  } else if (v.isL1Mixed && v.fmt1 && v.fmt2) {
    const fracNode = <MixedDisplay fmt={v.fmt1} size={size} color="#000000" />;
    const mixNode = <MixedDisplay fmt={v.fmt2} size={size} color="#000000" />;
    if (v.flipDisplay) { left = mixNode; right = fracNode; }
    else { left = fracNode; right = mixNode; }
  } else if (v.dispNum1 !== undefined && v.dispDen1 !== undefined && v.dispNum2 !== undefined && v.dispDen2 !== undefined) {
    // fractions tool — use display-specific fields so ÷ shows the pre-flip divisor
    const leftNode = v.dispDen1 === 1
      ? <span className={`${size} font-bold`} style={{ color: '#000000' }}>{v.dispNum1}</span>
      : <FracStack n={v.dispNum1} d={v.dispDen1} size={size} color="#000000" />;
    const rightNode = v.dispDen2 === 1
      ? <span className={`${size} font-bold`} style={{ color: '#000000' }}>{v.dispNum2}</span>
      : <FracStack n={v.dispNum2} d={v.dispDen2} size={size} color="#000000" />;
    left = leftNode; right = rightNode;
  } else {
    left = <span className={`${size} font-bold`}>?</span>;
    right = <span className={`${size} font-bold`}>?</span>;
  }

  return (
    <div className="flex items-center justify-center gap-6 flex-wrap">
      {left}
      <span className={`${size} font-bold`} style={{ color: '#000000' }}>{q.isDiv ? '\u00f7' : '\u00d7'}</span>
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

const OperationSection: React.FC<{ value: Operation; onChange: (v: Operation) => void }> = ({ value, onChange }) => (
  <div className="flex flex-col gap-2">
    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Operation</span>
    <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
      {([['multiply', 'Multiply'], ['divide', 'Divide'], ['mixed', 'Mixed']] as [Operation, string][]).map(([v, label]) => (
        <button key={v} onClick={() => onChange(v)}
          className={`flex-1 px-4 py-2.5 text-base font-bold transition-colors ${value === v ? 'bg-blue-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
          {label}
        </button>
      ))}
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

const StandardQOPopover: React.FC<{
  answerFormat: AnswerFormat; onAnswerFormatChange: (v: AnswerFormat) => void;
  currentLevel: DifficultyLevel; currentTool: ToolType;
  levelVars: Record<string, boolean>; onVarChange: (k: string, v: boolean) => void;
  operation: Operation; onOperationChange: (v: Operation) => void;
}> = ({ answerFormat, onAnswerFormatChange, currentLevel, currentTool, levelVars, onVarChange, operation, onOperationChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const vars = TOOL_CONFIG.tools[currentTool].difficultySettings?.[currentLevel]?.variables ?? [];
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className={`px-4 py-2 rounded-xl border-2 font-bold text-base transition-colors shadow-sm flex items-center gap-2 ${open ? 'bg-blue-900 border-blue-900 text-white' : 'bg-white border-gray-300 text-gray-600 hover:border-blue-900 hover:text-blue-900'}`}>
        Question Options <ChevronDown size={18} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-72 p-5 flex flex-col gap-5">
          <OperationSection value={operation} onChange={onOperationChange} />
          <AnswerFormatSection value={answerFormat} onChange={onAnswerFormatChange} />
          {vars.length > 0 && <VariablesSection variables={vars} values={levelVars} onChange={onVarChange} />}
        </div>
      )}
    </div>
  );
};

const DiffQOPopover: React.FC<{
  answerFormat: AnswerFormat; onAnswerFormatChange: (v: AnswerFormat) => void;
  currentTool: ToolType;
  allLevelVars: Record<DifficultyLevel, Record<string, boolean>>;
  onLevelVarChange: (lv: DifficultyLevel, k: string, v: boolean) => void;
  operation: Operation; onOperationChange: (v: Operation) => void;
}> = ({ answerFormat, onAnswerFormatChange, currentTool, allLevelVars, onLevelVarChange, operation, onOperationChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
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
          <OperationSection value={operation} onChange={onOperationChange} />
          <AnswerFormatSection value={answerFormat} onChange={onAnswerFormatChange} />
          {(['level1', 'level2', 'level3'] as DifficultyLevel[]).map(lv => {
            const vars = TOOL_CONFIG.tools[currentTool].difficultySettings?.[lv]?.variables ?? [];
            return (
              <div key={lv} className="flex flex-col gap-1">
                <span className={`text-sm font-extrabold uppercase tracking-wider ${LV_HEADER_COLORS[lv]}`}>{LV_LABELS[lv]}</span>
                {vars.length > 0
                  ? <VariablesSection variables={vars} values={allLevelVars[lv]} onChange={(k, v) => onLevelVarChange(lv, k, v)} />
                  : <p className="text-xs text-gray-400 pl-1">No additional options at this level.</p>}
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

const MultFractionsTool: React.FC = () => {
  const [currentTool, setCurrentTool] = useState<ToolType>('multFractions');
  const [mode, setMode] = useState<Mode>('whiteboard');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('level1');
  const [answerFormat, setAnswerFormat] = useState<AnswerFormat>('improper');
  const [toolOperations, setToolOperations] = useState<Record<ToolType, Operation>>({ multFractions: 'mixed', multMixed: 'mixed' });
  const getOperation = () => toolOperations[currentTool];
  const setOperation = (op: Operation) => setToolOperations(p => ({ ...p, [currentTool]: op }));

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

  // Per-tool per-level variables (e.g. unitFraction, harderMultiplication)
  const [levelVariables, setLevelVariables] = useState<Record<ToolType, Record<DifficultyLevel, Record<string, boolean>>>>(() => {
    const init = {} as Record<ToolType, Record<DifficultyLevel, Record<string, boolean>>>;
    (Object.keys(TOOL_CONFIG.tools) as ToolType[]).forEach(tool => {
      init[tool] = { level1: {}, level2: {}, level3: {} };
      const ds = TOOL_CONFIG.tools[tool].difficultySettings;
      if (ds) {
        (['level1', 'level2', 'level3'] as DifficultyLevel[]).forEach(lv => {
          (ds[lv]?.variables ?? []).forEach(v => { init[tool][lv][v.key] = v.defaultValue; });
        });
      }
    });
    return init;
  });

  const getVars = (lv: DifficultyLevel) => levelVariables[currentTool]?.[lv] ?? {};
  const setVar = (lv: DifficultyLevel, key: string, val: boolean) =>
    setLevelVariables(p => ({ ...p, [currentTool]: { ...p[currentTool], [lv]: { ...p[currentTool][lv], [key]: val } } }));

  const getQBg = () => ({ blue: '#D1E7F8', pink: '#F8D1E7', yellow: '#F8F4D1' }[colorScheme] ?? '#ffffff');
  const getStepBg = () => ({ blue: '#B3D9F2', pink: '#F2B3D9', yellow: '#F2EBB3' }[colorScheme] ?? '#f3f4f6');

  const handleNewQuestion = () => {
    const q = generateQuestion(currentTool, difficulty, getVars(difficulty), getOperation());
    setCurrentQuestion(q);
    setShowWhiteboardAnswer(false);
    setShowAnswer(false);
  };

  const handleGenerateWorksheet = () => {
    const usedKeys = new Set<string>();
    const questions: Question[] = [];
    if (isDifferentiated) {
      (['level1', 'level2', 'level3'] as DifficultyLevel[]).forEach(lv => {
        for (let i = 0; i < numQuestions; i++) questions.push(generateUniqueQuestion(currentTool, lv, getVars(lv), getOperation(), usedKeys));
      });
    } else {
      for (let i = 0; i < numQuestions; i++) questions.push(generateUniqueQuestion(currentTool, difficulty, getVars(difficulty), getOperation(), usedKeys));
    }
    setWorksheet(questions);
    setShowWorksheetAnswers(false);
  };

  useEffect(() => { if (mode !== 'worksheet') handleNewQuestion(); }, [difficulty, currentTool, toolOperations]);

  const fontSizes = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
  const canIncrease = worksheetFontSize < fontSizes.length - 1;
  const canDecrease = worksheetFontSize > 0;

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
          {isDifferentiated
            ? <DiffQOPopover answerFormat={answerFormat} onAnswerFormatChange={setAnswerFormat} currentTool={currentTool} allLevelVars={levelVariables[currentTool]} onLevelVarChange={(lv, k, v) => setVar(lv, k, v)} operation={getOperation()} onOperationChange={setOperation} />
            : <StandardQOPopover answerFormat={answerFormat} onAnswerFormatChange={setAnswerFormat} currentLevel={difficulty} currentTool={currentTool} levelVars={getVars(difficulty)} onVarChange={(k, v) => setVar(difficulty, k, v)} operation={getOperation()} onOperationChange={setOperation} />}
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
          <StandardQOPopover answerFormat={answerFormat} onAnswerFormatChange={setAnswerFormat} currentLevel={difficulty} currentTool={currentTool} levelVars={getVars(difficulty)} onVarChange={(k, v) => setVar(difficulty, k, v)} operation={getOperation()} onOperationChange={setOperation} />
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

export default MultFractionsTool;
