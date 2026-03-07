import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Eye, ChevronUp, ChevronDown, Home, Menu, X } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type ToolType = 'findFraction' | 'worded' | 'asFraction';
type DifficultyLevel = 'level1' | 'level2' | 'level3';
type Mode = 'whiteboard' | 'single' | 'worksheet';
type ColorScheme = 'default' | 'blue' | 'pink' | 'yellow';

interface FracQuestion {
  kind: 'frac';
  display: string;
  answerN: number;
  answerD: number;
  working: { type: string; content: string }[];
  key: string;
  difficulty: string;
}

interface WordedQuestion {
  kind: 'worded';
  questionText: string;
  answer: string;
  answerAsFracOfOriginal?: string;
  working: { type: string; content: string }[];
  key: string;
  difficulty: string;
}

type AnyQuestion = FracQuestion | WordedQuestion | AsFracQuestion;

// ── Constants ─────────────────────────────────────────────────────────────────

const LV_COLORS = {
  level1: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700', fill: '#dcfce7' },
  level2: { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-700', fill: '#fef9c3' },
  level3: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700', fill: '#fee2e2' },
};

const LV_HEADER_COLORS: Record<DifficultyLevel, string> = {
  level1: 'text-green-600', level2: 'text-yellow-500', level3: 'text-red-600',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[randInt(0, arr.length - 1)];

const superscript = (n: number | string) => String(n).split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[parseInt(c)] ?? c).join('');
const subscript  = (n: number | string) => String(n).split('').map(c => '₀₁₂₃₄₅₆₇₈₉'[parseInt(c)] ?? c).join('');
const frac = (n: number, d: number) => `${superscript(n)}⁄${subscript(d)}`;

const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);

const toRational = (n: number, d: number) => {
  const g = gcd(Math.abs(n), Math.abs(d));
  return { n: n / g, d: d / g };
};

const formatRational = (n: number, d: number, mode: string): string => {
  const r = toRational(n, d);
  if (r.d === 1) return String(r.n);
  if (mode === 'fraction') return frac(r.n, r.d);
  if (mode === 'mixed') {
    const whole = Math.floor(r.n / r.d);
    const rem = r.n % r.d;
    return whole === 0 ? frac(rem, r.d) : `${whole} ${frac(rem, r.d)}`;
  }
  const dec = r.n / r.d;
  const rounded = Math.round(dec * 100) / 100;
  if (rounded % 1 === 0) return String(rounded);
  return Math.round(dec * 10) / 10 === rounded ? rounded.toFixed(1) : rounded.toFixed(2);
};

const formatPart = (n: number, d: number): string => {
  const r = toRational(n, d);
  return r.d === 1 ? String(r.n) : frac(r.n, r.d);
};

// ── Find the Fraction — generation ───────────────────────────────────────────

const generateFracQuestion = (level: string, denomRange: string, _answerFormat: string): FracQuestion => {
  const maxDenom = denomRange === 'extended' ? 20 : 10;

  if (level === 'level1') {
    const d = randInt(2, maxDenom);
    const k = randInt(1, maxDenom);
    const amount = d * k;
    return {
      kind: 'frac', display: `${frac(1, d)} of ${amount}`,
      answerN: k, answerD: 1,
      working: [
        { type: 'step', content: `Divide by the denominator: ${amount} ÷ ${d} = ${k}` },
        { type: 'step', content: `${frac(1, d)} of ${amount} = ${k}` },
      ],
      key: `f1-${d}-${amount}`, difficulty: level,
    };
  }

  if (level === 'level2') {
    const pool: { rn: number; rd: number }[] = [];
    for (let d = 3; d <= maxDenom; d++) {
      for (let n = 2; n < d; n++) {
        const g = gcd(n, d); const rn = n / g, rd = d / g;
        if (rn === 1 || rn === rd || rd > maxDenom) continue;
        if (!pool.some(p => p.rn === rn && p.rd === rd)) pool.push({ rn, rd });
      }
    }
    const { rn, rd } = pick(pool);
    const k = randInt(1, maxDenom);
    const amount = rd * k;
    const answerN = rn * k;
    return {
      kind: 'frac', display: `${frac(rn, rd)} of ${amount}`,
      answerN, answerD: 1,
      working: [
        { type: 'step', content: `Find 1 part: ${amount} ÷ ${rd} = ${k}` },
        { type: 'step', content: `Multiply by numerator: ${k} × ${rn} = ${answerN}` },
        { type: 'step', content: `${frac(rn, rd)} of ${amount} = ${answerN}` },
      ],
      key: `f2-${rn}-${rd}-${amount}`, difficulty: level,
    };
  }

  type Offset = { num: number; den: number };
  const allOffsets: Offset[] = [
    { num: 1, den: 2 }, { num: 1, den: 4 }, { num: 3, den: 4 },
    { num: 1, den: 3 }, { num: 2, den: 3 },
    { num: 1, den: 5 }, { num: 2, den: 5 }, { num: 3, den: 5 }, { num: 4, den: 5 },
    { num: 1, den: 10 }, { num: 3, den: 10 }, { num: 7, den: 10 }, { num: 9, den: 10 },
  ];
  const pool3: { rn: number; rd: number; offsets: Offset[] }[] = [];
  for (let d = 3; d <= maxDenom; d++) {
    for (let n = 2; n < d; n++) {
      const g = gcd(n, d); const rn = n / g, rd = d / g;
      if (rn === 1 || rd < 2 || rn === rd) continue;
      if (pool3.some(p => p.rn === rn && p.rd === rd)) continue;
      const validOffsets = allOffsets.filter(o => (rd * o.num) % o.den === 0);
      if (validOffsets.length === 0) continue;
      pool3.push({ rn, rd, offsets: validOffsets });
    }
  }
  if (pool3.length > 0) {
    const { rn, rd, offsets } = pick(pool3);
    const k = randInt(1, maxDenom - 1);
    const off = pick(offsets);
    const partN = k * off.den + off.num, partD = off.den;
    const amount = (rd * partN) / partD;
    const ansN = rn * partN, ansD = partD;
    const { n: ansRN, d: ansRD } = toRational(ansN, ansD);
    return {
      kind: 'frac', display: `${frac(rn, rd)} of ${amount}`,
      answerN: ansRN, answerD: ansRD,
      working: [
        { type: 'step', content: `Find 1 part: ${amount} ÷ ${rd} = ${formatPart(partN, partD)}` },
        { type: 'step', content: `Multiply by numerator: ${formatPart(partN, partD)} × ${rn} = ${formatPart(ansRN, ansRD)}` },
        { type: 'step', content: `${frac(rn, rd)} of ${amount} = ${formatPart(ansRN, ansRD)}` },
      ],
      key: `f3-${rn}-${rd}-${amount}`, difficulty: level,
    };
  }
  return generateFracQuestion('level2', denomRange, _answerFormat);
};

// ── Worded Questions — data ───────────────────────────────────────────────────

const L1_CONTEXTS = [
  { item: 'sweets',   colour1: 'red',     colour2: 'green'      },
  { item: 'marbles',  colour1: 'blue',    colour2: 'yellow'     },
  { item: 'stickers', colour1: 'gold',    colour2: 'silver'     },
  { item: 'counters', colour1: 'red',     colour2: 'blue'       },
  { item: 'apples',   colour1: 'red',     colour2: 'green'      },
  { item: 'books',    colour1: 'fiction', colour2: 'non-fiction'},
  { item: 'coins',    colour1: 'gold',    colour2: 'silver'     },
  { item: 'cards',    colour1: 'red',     colour2: 'black'      },
];

const L2_CONVERSIONS = [
  { unit: 'day',    convertedUnit: 'hours',   factor: 24,   hint: '1 day = 24 hours'    },
  { unit: 'hour',   convertedUnit: 'minutes', factor: 60,   hint: '1 hour = 60 minutes' },
  { unit: 'week',   convertedUnit: 'days',    factor: 7,    hint: '1 week = 7 days'     },
  { unit: 'year',   convertedUnit: 'months',  factor: 12,   hint: '1 year = 12 months'  },
  { unit: 'metre',  convertedUnit: 'cm',      factor: 100,  hint: '1 metre = 100 cm'    },
  { unit: 'kg',     convertedUnit: 'grams',   factor: 1000, hint: '1 kg = 1000 g'       },
  { unit: 'pound',  convertedUnit: 'pence',   factor: 100,  hint: '£1 = 100p'           },
];

const L3_CONTEXTS_ITEMS = [
  { item: 'sweets',   verb1: 'eats',   verb2: 'gives away' },
  { item: 'stickers', verb1: 'uses',   verb2: 'gives away' },
  { item: 'marbles',  verb1: 'loses',  verb2: 'gives away' },
  { item: 'cards',    verb1: 'uses',   verb2: 'gives away' },
  { item: 'coins',    verb1: 'spends', verb2: 'gives away' },
  { item: 'beads',    verb1: 'uses',   verb2: 'gives away' },
];

const NAMES = ['James', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Jack', 'Sophia',
               'Harry', 'Grace', 'Sarah', 'Tom', 'Amy', 'Ben', 'Chloe', 'Daniel',
               'Ella', 'Finn', 'Georgia', 'Henry', 'Katie', 'Declan', 'Mia', 'Ryan'];

// Pool of reduced fractions with denom 2–10
const buildFracPool = (nonUnitOnly = false) => {
  const pool: { rn: number; rd: number }[] = [];
  for (let d = 2; d <= 10; d++) {
    for (let n = 1; n < d; n++) {
      const g = gcd(n, d); const rn = n / g, rd = d / g;
      if (rd > 10) continue;
      if (nonUnitOnly && rn === 1) continue;
      if (!pool.some(p => p.rn === rn && p.rd === rd)) pool.push({ rn, rd });
    }
  }
  return pool;
};

const ALL_FRAC_POOL = buildFracPool(false);
const NONUNIT_FRAC_POOL = buildFracPool(true);

// ── Worded Questions — generation ─────────────────────────────────────────────

const generateWordedL1 = (questionType: string): WordedQuestion => {
  const ctx = pick(L1_CONTEXTS);
  const name = pick(NAMES);
  const { rn, rd } = pick(NONUNIT_FRAC_POOL);
  const k = randInt(2, 8);
  const total = rd * k;
  const fracAmount = rn * k;
  const remainder = total - fracAmount;
  const fracStr = frac(rn, rd);

  const isDirect = questionType === 'direct' ? true : questionType === 'indirect' ? false : Math.random() < 0.5;

  const questionText = [
    `${name} has ${total} ${ctx.item}.`,
    `${fracStr} of the ${ctx.item} are ${ctx.colour1}.`,
    isDirect ? `How many ${ctx.item} are ${ctx.colour1}?` : `The rest are ${ctx.colour2}.\nHow many ${ctx.item} are ${ctx.colour2}?`,
  ].join('\n');

  const working = isDirect
    ? [
        { type: 'step', content: `Find 1 part: ${total} ÷ ${rd} = ${k}` },
        { type: 'step', content: `Multiply by numerator: ${k} × ${rn} = ${fracAmount}` },
        { type: 'step', content: `${fracStr} of ${total} = ${fracAmount} ${ctx.item}` },
      ]
    : [
        { type: 'step', content: `Find 1 part: ${total} ÷ ${rd} = ${k}` },
        { type: 'step', content: `${ctx.colour1.charAt(0).toUpperCase() + ctx.colour1.slice(1)}: ${k} × ${rn} = ${fracAmount}` },
        { type: 'step', content: `${ctx.colour2.charAt(0).toUpperCase() + ctx.colour2.slice(1)}: ${total} − ${fracAmount} = ${remainder}` },
      ];

  return {
    kind: 'worded',
    questionText,
    answer: `${isDirect ? fracAmount : remainder} ${ctx.item}`,
    working,
    key: `w1-${name}-${total}-${rn}-${rd}-${isDirect ? 'd' : 'i'}`,
    difficulty: 'level1',
  };
};

// Level 2 contexts: varied real-world scenarios per conversion type
const L2_CONTEXT_TEMPLATES: Record<string, { templates: string[]; answerSuffix: (rn: number, rd: number, answer: number, unit: string) => string }> = {
  day: {
    templates: [
      '{name} sleeps for {frac} of a day{hint}. How many hours does {name} sleep?',
      '{name} spends {frac} of a day{hint} at school. How many hours is that?',
      '{name} travels for {frac} of a day{hint}. How many hours does {name} travel?',
      '{name} is on holiday for {frac} of a day{hint}. How many hours of the day is that?',
    ],
    answerSuffix: (_rn, _rd, answer, unit) => `${answer} ${unit}`,
  },
  hour: {
    templates: [
      '{name} practises piano for {frac} of an hour{hint}. How many minutes does {name} practise?',
      '{name} reads for {frac} of an hour{hint}. How many minutes does {name} read?',
      '{name} walks for {frac} of an hour{hint}. How many minutes does {name} walk?',
      '{name} watches TV for {frac} of an hour{hint}. How many minutes is that?',
    ],
    answerSuffix: (_rn, _rd, answer, unit) => `${answer} ${unit}`,
  },
  week: {
    templates: [
      '{name} goes to school for {frac} of a week{hint}. How many days is that?',
      '{name} is on a camping trip for {frac} of a week{hint}. How many days does {name} camp?',
      '{name} visits relatives for {frac} of a week{hint}. How many days is the visit?',
    ],
    answerSuffix: (_rn, _rd, answer, unit) => `${answer} ${unit}`,
  },
  year: {
    templates: [
      '{name} spends {frac} of the year{hint} in the UK. How many months does {name} spend in the UK?',
      'A plant flowers for {frac} of the year{hint}. How many months does it flower?',
      '{name} is in secondary school for {frac} of the year{hint}. How many months is that?',
    ],
    answerSuffix: (_rn, _rd, answer, unit) => `${answer} ${unit}`,
  },
  metre: {
    templates: [
      '{name} cuts {frac} of a metre{hint} of ribbon. How many cm of ribbon does {name} cut?',
      '{name} needs {frac} of a metre{hint} of fabric. How many cm of fabric is that?',
      'A shelf is {frac} of a metre{hint} wide. How many cm wide is the shelf?',
      '{name} paints {frac} of a metre{hint} of fence. How many cm does {name} paint?',
    ],
    answerSuffix: (_rn, _rd, answer, unit) => `${answer} ${unit}`,
  },
  kg: {
    templates: [
      'A recipe uses {frac} of a kg{hint} of flour. How many grams of flour is that?',
      '{name} eats {frac} of a kg{hint} of fruit in a week. How many grams is that?',
      'A bag of nuts weighs {frac} of a kg{hint}. How many grams does it weigh?',
      '{name} uses {frac} of a kg{hint} of clay for a sculpture. How many grams does {name} use?',
    ],
    answerSuffix: (_rn, _rd, answer, unit) => `${answer} ${unit}`,
  },
  pound: {
    templates: [
      '{name} spends {frac} of a pound{hint} on a sticker. How many pence does {name} spend?',
      'A pencil costs {frac} of a pound{hint}. How many pence does it cost?',
      '{name} saves {frac} of a pound{hint} each day. How many pence does {name} save each day?',
      'A stamp costs {frac} of a pound{hint}. How many pence does it cost?',
    ],
    answerSuffix: (_rn, _rd, answer, unit) => `${answer} ${unit}`,
  },
};

const generateWordedL2 = (showHint: boolean): WordedQuestion => {
  const conv = pick(L2_CONVERSIONS);
  const name = pick(NAMES);

  // Allow quantities of 1–5 units, but only where answer stays whole
  const validCombos: { qty: number; rn: number; rd: number }[] = [];
  for (let qty = 1; qty <= 5; qty++) {
    const total = conv.factor * qty;
    ALL_FRAC_POOL.forEach(p => {
      if (total % p.rd === 0) validCombos.push({ qty, rn: p.rn, rd: p.rd });
    });
  }
  const { qty, rn, rd } = pick(validCombos);
  const total = conv.factor * qty;
  const part = total / rd;
  const answer = rn * part;
  const fracStr = frac(rn, rd);

  // Article / quantity wording
  const qtyWord = qty === 1
    ? (conv.unit === 'hour' ? 'an hour' : `a ${conv.unit}`)
    : `${qty} ${conv.unit}s`;
  const hintStr = showHint ? ` (${conv.hint})` : '';

  // Pick a context template and substitute
  const ctxGroup = L2_CONTEXT_TEMPLATES[conv.unit] ?? L2_CONTEXT_TEMPLATES['day'];
  const template = pick(ctxGroup.templates);
  // Replace "of a/an/the X{hint}" with "of {qtyWord}{hint}" then substitute the rest
  const questionText = template
    .replace(/of (?:a |an |the )?\w+(\{hint\})/g, `of ${qtyWord}$1`)
    .replace(/{name}/g, name)
    .replace(/{frac}/g, fracStr)
    .replace(/{hint}/g, hintStr);

  const working: { type: string; content: string }[] = [];
  if (qty > 1) {
    working.push({ type: 'step', content: `Total: ${qty} × ${conv.factor} ${conv.convertedUnit} = ${total} ${conv.convertedUnit}` });
  } else {
    working.push({ type: 'step', content: `Convert: 1 ${conv.unit} = ${conv.factor} ${conv.convertedUnit}` });
  }
  working.push(
    { type: 'step', content: `Find 1 part: ${total} ÷ ${rd} = ${part}` },
    { type: 'step', content: `Multiply by numerator: ${part} × ${rn} = ${answer}` },
    { type: 'step', content: `${fracStr} of ${qtyWord} = ${answer} ${conv.convertedUnit}` },
  );

  return {
    kind: 'worded',
    questionText,
    answer: `${answer} ${conv.convertedUnit}`,
    working,
    key: `w2-${name}-${conv.unit}-${qty}-${rn}-${rd}`,
    difficulty: 'level2',
  };
};

const generateWordedL3 = (asFracOfOriginal: boolean, l3Mode: string): WordedQuestion => {
  const fmtMoney = (n: number) => Number.isInteger(n) ? `£${n}` : `£${n.toFixed(2)}`;
  const allInt = (...vals: number[]) => vals.every(v => Number.isInteger(v));

  const resolveSubtype = (): 'fracFrac' | 'amountFrac' => {
    if (l3Mode === 'fracFrac') return 'fracFrac';
    if (l3Mode === 'amountFrac') return 'amountFrac';
    return Math.random() < 0.5 ? 'fracFrac' : 'amountFrac';
  };
  const subtype = resolveSubtype();
  const useMoney = Math.random() < 0.5;
  const ctx = useMoney ? null : pick(L3_CONTEXTS_ITEMS);
  const name = pick(NAMES);

  // Helper: build wording and working for one fraction step
  // keepFrac=true  → "they keep X/Y of it"  → finalLeft = fracPart
  // ── Frac-Frac ─────────────────────────────────────────────────────────────
  if (subtype === 'fracFrac') {
    const FRIENDLY_TOTALS = [60, 80, 90, 100, 120, 150, 160, 180, 200, 240];
    const SIMPLE_FRACS = [
      {rn:3,rd:4},{rn:2,rd:3},{rn:3,rd:5},{rn:4,rd:5},
      {rn:2,rd:5},{rn:3,rd:10},{rn:7,rd:10},{rn:1,rd:2},
      {rn:1,rd:4},{rn:1,rd:5},{rn:1,rd:3},
    ];

    let attempts = 0;
    while (attempts < 500) {
      attempts++;
      const total = pick(FRIENDLY_TOTALS);
      const { rn: rn1, rd: rd1 } = pick(SIMPLE_FRACS);
      const { rn: rn2, rd: rd2 } = pick(SIMPLE_FRACS);
      const keep1 = Math.random() < 0.5;
      const keep2 = Math.random() < 0.5;

      const part1 = total / rd1;
      const fracPart1 = rn1 * part1;
      const remaining1 = keep1 ? fracPart1 : total - fracPart1;
      const part2 = remaining1 / rd2;
      const fracPart2 = rn2 * part2;
      const finalLeft = keep2 ? fracPart2 : remaining1 - fracPart2;

      if (!allInt(part1, fracPart1, remaining1, part2, fracPart2, finalLeft)) continue;
      if (finalLeft <= 0 || remaining1 <= 0) continue;

      const finalQuestion = asFracOfOriginal
        ? 'What fraction of the original amount do they have left?'
        : (useMoney ? 'How much do they have left?' : 'How many do they have left?');

      const fmt = useMoney ? fmtMoney : (n: number) => `${n}`;
      const c = ctx;

      // Build sentences
      let step1sentence: string, step2sentence: string;
      const workLines1: { type: string; content: string }[] = [];
      const workLines2: { type: string; content: string }[] = [];

      if (useMoney) {
        step1sentence = keep1
          ? `They keep ${frac(rn1,rd1)} of it.`
          : `They give ${frac(rn1,rd1)} of it away.`;
        workLines1.push(
          { type: 'step', content: `Find 1 part: ${total} ÷ ${rd1} = ${part1}` },
          keep1
            ? { type: 'step', content: `${frac(rn1,rd1)} kept: ${part1} × ${rn1} = ${fmt(fracPart1)}` }
            : { type: 'step', content: `${frac(rn1,rd1)} given away: ${part1} × ${rn1} = ${fmt(fracPart1)}` },
          keep1
            ? { type: 'step', content: `Now has: ${fmt(fracPart1)}` }
            : { type: 'step', content: `Now has: ${fmt(total)} − ${fmt(fracPart1)} = ${fmt(remaining1)}` },
        );
        step2sentence = keep2
          ? `They keep ${frac(rn2,rd2)} of what remains.`
          : `They give ${frac(rn2,rd2)} of what remains away.`;
        workLines2.push(
          { type: 'step', content: `Find 1 part of remainder: ${remaining1} ÷ ${rd2} = ${part2}` },
          keep2
            ? { type: 'step', content: `${frac(rn2,rd2)} kept: ${part2} × ${rn2} = ${fmt(fracPart2)}` }
            : { type: 'step', content: `${frac(rn2,rd2)} given away: ${part2} × ${rn2} = ${fmt(fracPart2)}` },
          keep2
            ? { type: 'step', content: `Final amount: ${fmt(fracPart2)}` }
            : { type: 'step', content: `Final amount: ${fmt(remaining1)} − ${fmt(fracPart2)} = ${fmt(finalLeft)}` },
        );
      } else {
        const item = c!.item;
        step1sentence = keep1
          ? `They keep ${frac(rn1,rd1)} of them.`
          : `They ${c!.verb2} ${frac(rn1,rd1)} of them.`;
        workLines1.push(
          { type: 'step', content: `Find 1 part: ${total} ÷ ${rd1} = ${part1}` },
          keep1
            ? { type: 'step', content: `${frac(rn1,rd1)} kept: ${part1} × ${rn1} = ${fracPart1} ${item}` }
            : { type: 'step', content: `${frac(rn1,rd1)} ${c!.verb2}n: ${part1} × ${rn1} = ${fracPart1} ${item}` },
          keep1
            ? { type: 'step', content: `Now has: ${fracPart1} ${item}` }
            : { type: 'step', content: `Now has: ${total} − ${fracPart1} = ${remaining1} ${item}` },
        );
        step2sentence = keep2
          ? `They keep ${frac(rn2,rd2)} of what remains.`
          : `They ${c!.verb2} ${frac(rn2,rd2)} of what remains.`;
        workLines2.push(
          { type: 'step', content: `Find 1 part of remainder: ${remaining1} ÷ ${rd2} = ${part2}` },
          keep2
            ? { type: 'step', content: `${frac(rn2,rd2)} kept: ${part2} × ${rn2} = ${fracPart2} ${item}` }
            : { type: 'step', content: `${frac(rn2,rd2)} ${c!.verb2}n: ${part2} × ${rn2} = ${fracPart2} ${item}` },
          keep2
            ? { type: 'step', content: `Final: ${fracPart2} ${item}` }
            : { type: 'step', content: `Final: ${remaining1} − ${fracPart2} = ${finalLeft} ${item}` },
        );
      }

      const questionText = useMoney
        ? `${name} has ${fmtMoney(total)}.\n${step1sentence}\n${step2sentence}\n${finalQuestion}`
        : `${name} has ${total} ${c!.item}.\n${step1sentence}\n${step2sentence}\n${finalQuestion}`;

      const working = [...workLines1, ...workLines2];
      let answer: string;
      let answerAsFracOfOriginal: string | undefined;

      if (asFracOfOriginal) {
        const { n: fn, d: fd } = toRational(finalLeft, total);
        answer = frac(fn, fd); answerAsFracOfOriginal = frac(fn, fd);
        working.push({ type: 'step', content: `Fraction of original: ${finalLeft} ÷ ${total} = ${frac(fn, fd)}` });
      } else {
        answer = useMoney ? fmtMoney(finalLeft) : `${finalLeft} ${c!.item}`;
      }

      return { kind: 'worded' as const, questionText, answer, answerAsFracOfOriginal, working, key: `w3ff-${total}-${rn1}-${rd1}-${keep1}-${rn2}-${rd2}-${keep2}`, difficulty: 'level3' };
    }
  }

  // ── Amount-Frac ───────────────────────────────────────────────────────────
  const amountFirst = Math.random() < 0.5;
  let attempts2 = 0;
  while (attempts2 < 500) {
    attempts2++;
    const { rn: rn1, rd: rd1 } = pick(NONUNIT_FRAC_POOL);
    const multiplier = randInt(3, 9);
    const total = rd1 * multiplier;
    const keepFrac = Math.random() < 0.5;

    const finalQuestion = asFracOfOriginal
      ? 'What fraction of the original amount do they have left?'
      : (useMoney ? 'How much do they have left?' : 'How many do they have left?');

    const working: { type: string; content: string }[] = [];
    let questionText: string;
    let answer: string;
    let answerAsFracOfOriginal: string | undefined;

    if (amountFirst) {
      // fixed amount step THEN fraction step
      const fixedSpend = rd1 * randInt(1, multiplier - 1);
      const remaining1 = total - fixedSpend;
      const part1 = remaining1 / rd1;
      const fracPart = rn1 * part1;
      const finalLeft = keepFrac ? fracPart : remaining1 - fracPart;
      if (!allInt(remaining1, part1, fracPart, finalLeft) || finalLeft <= 0) continue;

      if (useMoney) {
        const fmt = fmtMoney;
        const fracSentence = keepFrac
          ? `They keep ${frac(rn1,rd1)} of what remains.`
          : `They give ${frac(rn1,rd1)} of what remains away.`;
        questionText = `${name} has ${fmt(total)}.\nThey spend ${fmt(fixedSpend)}.\n${fracSentence}\n${finalQuestion}`;
        working.push(
          { type: 'step', content: `After spending: ${fmt(total)} − ${fmt(fixedSpend)} = ${fmt(remaining1)}` },
          { type: 'step', content: `Find 1 part: ${remaining1} ÷ ${rd1} = ${part1}` },
          keepFrac
            ? { type: 'step', content: `${frac(rn1,rd1)} kept: ${part1} × ${rn1} = ${fmt(fracPart)}` }
            : { type: 'step', content: `${frac(rn1,rd1)} given away: ${part1} × ${rn1} = ${fmt(fracPart)}` },
          keepFrac
            ? { type: 'step', content: `Amount left: ${fmt(fracPart)}` }
            : { type: 'step', content: `Amount left: ${fmt(remaining1)} − ${fmt(fracPart)} = ${fmt(finalLeft)}` },
        );
        if (asFracOfOriginal) {
          const { n: fn, d: fd } = toRational(finalLeft, total);
          answer = frac(fn, fd); answerAsFracOfOriginal = frac(fn, fd);
          working.push({ type: 'step', content: `Fraction of original: ${fmt(finalLeft)} ÷ ${fmt(total)} = ${frac(fn, fd)}` });
        } else { answer = fmt(finalLeft); }
      } else {
        const c = ctx!;
        const fracSentence = keepFrac
          ? `They keep ${frac(rn1,rd1)} of what remains.`
          : `They ${c.verb2} ${frac(rn1,rd1)} of what remains.`;
        questionText = `${name} has ${total} ${c.item}.\nThey ${c.verb1} ${fixedSpend}.\n${fracSentence}\n${finalQuestion}`;
        working.push(
          { type: 'step', content: `After ${c.verb1}ing: ${total} − ${fixedSpend} = ${remaining1} ${c.item}` },
          { type: 'step', content: `Find 1 part: ${remaining1} ÷ ${rd1} = ${part1}` },
          keepFrac
            ? { type: 'step', content: `${frac(rn1,rd1)} kept: ${part1} × ${rn1} = ${fracPart} ${c.item}` }
            : { type: 'step', content: `${frac(rn1,rd1)} ${c.verb2}n: ${part1} × ${rn1} = ${fracPart} ${c.item}` },
          keepFrac
            ? { type: 'step', content: `${c.item} left: ${fracPart}` }
            : { type: 'step', content: `${c.item} left: ${remaining1} − ${fracPart} = ${finalLeft}` },
        );
        if (asFracOfOriginal) {
          const { n: fn, d: fd } = toRational(finalLeft, total);
          answer = frac(fn, fd); answerAsFracOfOriginal = frac(fn, fd);
          working.push({ type: 'step', content: `Fraction of original: ${finalLeft} ÷ ${total} = ${frac(fn, fd)}` });
        } else { answer = `${finalLeft} ${c.item}`; }
      }

    } else {
      // fraction step THEN fixed amount step
      const part1 = total / rd1;
      const fracPart = rn1 * part1;
      const remaining1 = keepFrac ? fracPart : total - fracPart;
      const divisors = [2, 3, 4, 5].filter(d => Number.isInteger(remaining1 / d) && remaining1 / d < remaining1);
      if (divisors.length === 0) continue;
      const fixedSpend = remaining1 / pick(divisors);
      const finalLeft = remaining1 - fixedSpend;
      if (!allInt(part1, fracPart, remaining1, fixedSpend, finalLeft) || finalLeft <= 0) continue;

      if (useMoney) {
        const fmt = fmtMoney;
        const fracSentence = keepFrac
          ? `They keep ${frac(rn1,rd1)} of it.`
          : `They give away ${frac(rn1,rd1)} of it.`;
        questionText = `${name} has ${fmt(total)}.\n${fracSentence}\nThey then spend ${fmt(fixedSpend)}.\n${finalQuestion}`;
        working.push(
          { type: 'step', content: `Find 1 part: ${total} ÷ ${rd1} = ${part1}` },
          keepFrac
            ? { type: 'step', content: `${frac(rn1,rd1)} kept: ${part1} × ${rn1} = ${fmt(fracPart)}` }
            : { type: 'step', content: `${frac(rn1,rd1)} given away: ${part1} × ${rn1} = ${fmt(fracPart)}` },
          keepFrac
            ? { type: 'step', content: `Now has: ${fmt(fracPart)}` }
            : { type: 'step', content: `Now has: ${fmt(total)} − ${fmt(fracPart)} = ${fmt(remaining1)}` },
          { type: 'step', content: `After spending: ${fmt(remaining1)} − ${fmt(fixedSpend)} = ${fmt(finalLeft)}` },
        );
        if (asFracOfOriginal) {
          const { n: fn, d: fd } = toRational(finalLeft, total);
          answer = frac(fn, fd); answerAsFracOfOriginal = frac(fn, fd);
          working.push({ type: 'step', content: `Fraction of original: ${fmt(finalLeft)} ÷ ${fmt(total)} = ${frac(fn, fd)}` });
        } else { answer = fmt(finalLeft); }
      } else {
        const c = ctx!;
        const fracSentence = keepFrac
          ? `They keep ${frac(rn1,rd1)} of them.`
          : `They ${c.verb2} ${frac(rn1,rd1)} of them.`;
        questionText = `${name} has ${total} ${c.item}.\n${fracSentence}\nThey then ${c.verb1} ${fixedSpend} more.\n${finalQuestion}`;
        working.push(
          { type: 'step', content: `Find 1 part: ${total} ÷ ${rd1} = ${part1}` },
          keepFrac
            ? { type: 'step', content: `${frac(rn1,rd1)} kept: ${part1} × ${rn1} = ${fracPart} ${c.item}` }
            : { type: 'step', content: `${frac(rn1,rd1)} ${c.verb2}n: ${part1} × ${rn1} = ${fracPart} ${c.item}` },
          keepFrac
            ? { type: 'step', content: `Now has: ${fracPart} ${c.item}` }
            : { type: 'step', content: `Now has: ${total} − ${fracPart} = ${remaining1} ${c.item}` },
          { type: 'step', content: `After ${c.verb1}ing: ${remaining1} − ${fixedSpend} = ${finalLeft} ${c.item}` },
        );
        if (asFracOfOriginal) {
          const { n: fn, d: fd } = toRational(finalLeft, total);
          answer = frac(fn, fd); answerAsFracOfOriginal = frac(fn, fd);
          working.push({ type: 'step', content: `Fraction of original: ${finalLeft} ÷ ${total} = ${frac(fn, fd)}` });
        } else { answer = `${finalLeft} ${c.item}`; }
      }
    }
    return { kind: 'worded' as const, questionText, answer, answerAsFracOfOriginal, working, key: `w3af-${total}-${rn1}-${rd1}-${amountFirst}-${keepFrac}`, difficulty: 'level3' };
  }

  // Fallback
  return generateWordedL3(asFracOfOriginal, l3Mode);
};

const generateWordedQuestion = (level: string, questionType: string, showHint: boolean, asFracOfOriginal: boolean, l3Mode: string): WordedQuestion => {
  if (level === 'level1') return generateWordedL1(questionType);
  if (level === 'level2') return generateWordedL2(showHint);
  return generateWordedL3(asFracOfOriginal, l3Mode);
};

// ── As a Fraction — data ──────────────────────────────────────────────────────

// Products of primes ≤ 11 (standard) and ≤ 19 (extended), capped at 300
const buildPrimeProducts = (maxPrime: number, maxVal: number): number[] => {
  const primes = [2,3,5,7,11,13,17,19].filter(p => p <= maxPrime);
  let products = new Set<number>([1]);
  for (const p of primes) {
    const toAdd: number[] = [];
    products.forEach(x => { let v = x; while (v * p <= maxVal) { v *= p; toAdd.push(v); } });
    toAdd.forEach(v => products.add(v));
  }
  products.delete(1);
  return [...products].sort((a, b) => a - b);
};

const AF_STD_POOL = buildPrimeProducts(7, 100);    // products of 2,3,5,7 up to 100
const AF_EXT_POOL = buildPrimeProducts(19, 361);   // up to 19×19

// Level 2 worded contexts
const AF_L2_CONTEXTS = [
  { total: 'books',    part1: 'fiction',     part2: 'non-fiction' },
  { total: 'students', part1: 'girls',       part2: 'boys'        },
  { total: 'sweets',   part1: 'red',         part2: 'blue'        },
  { total: 'cars',     part1: 'red',         part2: 'silver'      },
  { total: 'shapes',   part1: 'circles',     part2: 'triangles'   },
  { total: 'days',     part1: 'sunny',       part2: 'cloudy'      },
  { total: 'animals',  part1: 'cats',        part2: 'dogs'        },
  { total: 'counters', part1: 'green',       part2: 'yellow'      },
  { total: 'marbles',  part1: 'striped',     part2: 'plain'       },
  { total: 'biscuits', part1: 'chocolate',   part2: 'plain'       },
  { total: 'pupils',   part1: 'boys',        part2: 'girls'       },
  { total: 'flowers',  part1: 'red',         part2: 'white'       },
];

// Level 3 item contexts (reuse L3 item contexts for consistency)
const AF_L3_ITEMS = [
  { item: 'sweets',   verb1: 'eats',   verb2: 'gives away' },
  { item: 'stickers', verb1: 'uses',   verb2: 'gives away' },
  { item: 'marbles',  verb1: 'loses',  verb2: 'gives away' },
  { item: 'cards',    verb1: 'uses',   verb2: 'gives away' },
  { item: 'coins',    verb1: 'spends', verb2: 'gives away' },
];

// ── Level 1 generator ─────────────────────────────────────────────────────────

interface AsFracQuestion {
  kind: 'asFrac';
  questionText: string;
  answer: string;
  working: { type: string; content: string }[];
  key: string;
  difficulty: string;
}

const generateAsFracL1 = (pool: string, allowUnsimplified: boolean): AsFracQuestion => {
  const P = pool === 'extended' ? AF_EXT_POOL : AF_STD_POOL;
  let attempts = 0;
  while (attempts++ < 500) {
    const whole = pick(P.filter(x => x >= 4));
    const part = pick(P.filter(x => x < whole && x >= 2));
    const g = gcd(part, whole);
    const sn = part / g, sd = whole / g;
    if (sn === sd) continue; // avoid 1/1
    if (!allowUnsimplified && g === 1) continue; // must simplify unless toggle is on
    const alreadySimplest = g === 1;
    const questionText = `Write ${part} as a fraction of ${whole}.\nGive your answer in its simplest form.`;
    const working = alreadySimplest
      ? [
          { type: 'step', content: `Write as a fraction: ${part}/${whole}` },
          { type: 'step', content: `HCF of ${part} and ${whole} = 1` },
          { type: 'step', content: `Already in simplest form: ${frac(sn, sd)}` },
        ]
      : [
          { type: 'step', content: `Write as a fraction: ${part}/${whole}` },
          { type: 'step', content: `Find the HCF of ${part} and ${whole}: HCF = ${g}` },
          { type: 'step', content: `Simplify: ${part} ÷ ${g} = ${sn},  ${whole} ÷ ${g} = ${sd}` },
          { type: 'step', content: `Answer: ${frac(sn, sd)}` },
        ];
    return { kind: 'asFrac', questionText, answer: frac(sn, sd), working, key: `af1-${part}-${whole}`, difficulty: 'level1' };
  }
  return generateAsFracL1(pool, allowUnsimplified);
};

// ── Level 2 generator ─────────────────────────────────────────────────────────

const generateAsFracL2 = (questionType: string): AsFracQuestion => {
  const ctx = pick(AF_L2_CONTEXTS);
  let attempts = 0;
  while (attempts++ < 500) {
    // Pick a whole from nice numbers, part from products that divide it
    const wholeOpts = [12,14,15,16,18,20,21,24,25,27,28,30,32,35,36,40,42,45,48,50,54,56,60,63,64,70,72,75,80,84,90,96,100];
    const whole = pick(wholeOpts);
    // part must be < whole and share a factor > 1 with whole for simplification interest
    const parts = [];
    for (let p = 1; p < whole; p++) {
      if (gcd(p, whole) > 1) parts.push(p);
    }
    if (parts.length === 0) continue;
    const part1 = pick(parts.filter(p => p >= 2 && p <= whole - 2));
    if (!part1) continue;
    const part2 = whole - part1;
    const g1 = gcd(part1, whole), sn1 = part1/g1, sd1 = whole/g1;
    const g2 = gcd(part2, whole), sn2 = part2/g2, sd2 = whole/g2;
    if (sn1 === sd1 || sn2 === sd2) continue; // avoid trivial 1/1

    // Decide whether direct (part1 given) or indirect (part2 given, ask for part1's fraction)
    const isDirect = questionType === 'direct' || (questionType === 'mixed' && Math.random() < 0.5);

    let questionText: string;
    let answer: string;
    let working: { type: string; content: string }[];

    if (isDirect) {
      questionText = `There are ${whole} ${ctx.total} in total.\n${part1} of them are ${ctx.part1}.\nWrite the number of ${ctx.part1} as a fraction of the total.\nGive your answer in its simplest form.`;
      working = [
        { type: 'step', content: `Write as a fraction: ${part1}/${whole}` },
        { type: 'step', content: `HCF of ${part1} and ${whole} = ${g1}` },
        { type: 'step', content: `${part1} ÷ ${g1} = ${sn1},  ${whole} ÷ ${g1} = ${sd1}` },
        { type: 'step', content: `Answer: ${frac(sn1, sd1)}` },
      ];
      answer = frac(sn1, sd1);
    } else {
      // Indirect: given part2, ask for part1 as fraction
      questionText = `There are ${whole} ${ctx.total} in total.\n${part2} of them are ${ctx.part2}.\nThe rest are ${ctx.part1}.\nWrite the number of ${ctx.part1} as a fraction of the total.\nGive your answer in its simplest form.`;
      working = [
        { type: 'step', content: `Find the number of ${ctx.part1}: ${whole} − ${part2} = ${part1}` },
        { type: 'step', content: `Write as a fraction: ${part1}/${whole}` },
        { type: 'step', content: `HCF of ${part1} and ${whole} = ${g1}` },
        { type: 'step', content: `${part1} ÷ ${g1} = ${sn1},  ${whole} ÷ ${g1} = ${sd1}` },
        { type: 'step', content: `Answer: ${frac(sn1, sd1)}` },
      ];
      answer = frac(sn1, sd1);
    }

    return { kind: 'asFrac', questionText, answer, working, key: `af2-${ctx.total}-${part1}-${whole}-${isDirect}`, difficulty: 'level2' };
  }
  return generateAsFracL2(questionType);
};

// ── Level 3 generator ─────────────────────────────────────────────────────────

const generateAsFracL3 = (steps: string): AsFracQuestion => {
  const fmtMoney = (n: number) => Number.isInteger(n) ? `£${n}` : `£${n.toFixed(2)}`;
  const allInt = (...vals: number[]) => vals.every(v => Number.isInteger(v));
  const useMoney = Math.random() < 0.5;
  const name = pick(NAMES);

  // ── 1-step ───────────────────────────────────────────────────────────────
  if (steps === '1step') {
    let attempts = 0;
    while (attempts++ < 500) {
      // 1-step always gives away a fixed amount
      const wholes = [20,24,30,36,40,45,48,50,60,72,80,90,100,120];
      const total = pick(wholes);
      const spend = pick([...Array(total-2)].map((_,i)=>i+1).filter(x => gcd(total-x, total) > 1 && x < total && total-x > 0));
      if (!spend) continue;
      const remaining = total - spend;
      const g = gcd(remaining, total);
      const sn = remaining/g, sd = total/g;
      if (sn === sd) continue;

      let questionText: string, working: { type: string; content: string }[];
      if (useMoney) {
        const fmt = fmtMoney;
        questionText = `${name} has ${fmt(total)}.\nThey spend ${fmt(spend)}.\nWrite the amount they have left as a fraction of the original amount.\nGive your answer in its simplest form.`;
        working = [
          { type: 'step', content: `Amount left: ${fmt(total)} − ${fmt(spend)} = ${fmt(remaining)}` },
          { type: 'step', content: `Write as a fraction: ${remaining}/${total}` },
          { type: 'step', content: `HCF of ${remaining} and ${total} = ${g}` },
          { type: 'step', content: `Simplify: ${frac(sn, sd)}` },
        ];
      } else {
        const c = pick(AF_L3_ITEMS);
        questionText = `${name} has ${total} ${c.item}.\nThey ${c.verb1} ${spend}.\nWrite the number they have left as a fraction of the original amount.\nGive your answer in its simplest form.`;
        working = [
          { type: 'step', content: `${c.item} left: ${total} − ${spend} = ${remaining}` },
          { type: 'step', content: `Write as a fraction: ${remaining}/${total}` },
          { type: 'step', content: `HCF of ${remaining} and ${total} = ${g}` },
          { type: 'step', content: `Simplify: ${frac(sn, sd)}` },
        ];
      }
      return { kind: 'asFrac', questionText, answer: frac(sn, sd), working, key: `af3-1s-${total}-${spend}`, difficulty: 'level3' };
    }
  }

  // ── 2-step ───────────────────────────────────────────────────────────────
  let attempts2 = 0;
  while (attempts2++ < 500) {
    // Step 1: always a fraction op (give away or keep). Step 2: fixed amount.
    const keepFrac = Math.random() < 0.5;
    const { rn, rd } = pick(NONUNIT_FRAC_POOL);
    const multiplier = randInt(4, 10);
    const total = rd * multiplier;
    const part1val = total / rd;
    const fracPart = rn * part1val;
    const after1 = keepFrac ? fracPart : total - fracPart;
    const divisors = [2,3,4,5].filter(d => Number.isInteger(after1/d) && after1/d < after1 && after1/d > 0);
    if (divisors.length === 0) continue;
    const fixedSpend = after1 / pick(divisors);
    const finalLeft = after1 - fixedSpend;
    if (!Number.isInteger(finalLeft) || finalLeft <= 0 || finalLeft === total) continue;
    const g = gcd(finalLeft, total);
    const sn = finalLeft/g, sd = total/g;
    if (sn === sd) continue;
    const fracStr = frac(rn, rd);

    let questionText: string, working: { type: string; content: string }[];
    if (useMoney) {
      const fmt = fmtMoney;
      const fracSentence = keepFrac ? `They keep ${fracStr} of it.` : `They give away ${fracStr} of it.`;
      questionText = `${name} has ${fmt(total)}.\n${fracSentence}\nThey then spend ${fmt(fixedSpend)}.\nWrite the amount they have left as a fraction of the original amount.\nGive your answer in its simplest form.`;
      working = [
        { type: 'step', content: `Find 1 part: ${total} ÷ ${rd} = ${part1val}` },
        keepFrac
          ? { type: 'step', content: `Amount kept: ${part1val} × ${rn} = ${fmt(fracPart)}` }
          : { type: 'step', content: `Amount given away: ${part1val} × ${rn} = ${fmt(fracPart)}` },
        keepFrac
          ? { type: 'step', content: `After keeping: ${fmt(fracPart)}` }
          : { type: 'step', content: `After giving away: ${fmt(total)} − ${fmt(fracPart)} = ${fmt(after1)}` },
        { type: 'step', content: `After spending: ${fmt(after1)} − ${fmt(fixedSpend)} = ${fmt(finalLeft)}` },
        { type: 'step', content: `Write as a fraction: ${finalLeft}/${total}` },
        { type: 'step', content: `HCF of ${finalLeft} and ${total} = ${g}` },
        { type: 'step', content: `Simplify: ${frac(sn, sd)}` },
      ];
    } else {
      const c = pick(AF_L3_ITEMS);
      const fracSentence = keepFrac ? `They keep ${fracStr} of them.` : `They ${c.verb2} ${fracStr} of them.`;
      questionText = `${name} has ${total} ${c.item}.\n${fracSentence}\nThey then ${c.verb1} ${fixedSpend} more.\nWrite the number they have left as a fraction of the original.\nGive your answer in its simplest form.`;
      working = [
        { type: 'step', content: `Find 1 part: ${total} ÷ ${rd} = ${part1val}` },
        keepFrac
          ? { type: 'step', content: `Amount kept: ${part1val} × ${rn} = ${fracPart} ${c.item}` }
          : { type: 'step', content: `Amount ${c.verb2}n: ${part1val} × ${rn} = ${fracPart} ${c.item}` },
        keepFrac
          ? { type: 'step', content: `After keeping: ${fracPart} ${c.item}` }
          : { type: 'step', content: `After ${c.verb2}ing: ${total} − ${fracPart} = ${after1} ${c.item}` },
        { type: 'step', content: `After ${c.verb1}ing: ${after1} − ${fixedSpend} = ${finalLeft} ${c.item}` },
        { type: 'step', content: `Write as a fraction: ${finalLeft}/${total}` },
        { type: 'step', content: `HCF of ${finalLeft} and ${total} = ${g}` },
        { type: 'step', content: `Simplify: ${frac(sn, sd)}` },
      ];
    }
    return { kind: 'asFrac', questionText, answer: frac(sn, sd), working, key: `af3-2s-${total}-${rn}-${rd}-${keepFrac}-${fixedSpend}`, difficulty: 'level3' };
  }
  return generateAsFracL3(steps);
};

const generateAsFracQuestion = (level: string, pool: string, questionType: string, afSteps: string, allowUnsimplified: boolean): AsFracQuestion => {
  if (level === 'level1') return generateAsFracL1(pool, allowUnsimplified);
  if (level === 'level2') return generateAsFracL2(questionType);
  return generateAsFracL3(afSteps);
};

// ── Unified question factory ───────────────────────────────────────────────────

const generateUniqueQ = (
  tool: ToolType, level: string,
  denomRange: string, answerFormat: string,
  questionType: string, showHint: boolean, asFracOfOriginal: boolean, l3Mode: string,
  afPool: string, afQuestionType: string, afSteps: string, allowUnsimplified: boolean,
  usedKeys: Set<string>,
): AnyQuestion => {
  let q: AnyQuestion;
  let attempts = 0;
  do {
    if (tool === 'findFraction') q = generateFracQuestion(level, denomRange, answerFormat);
    else if (tool === 'asFraction') q = generateAsFracQuestion(level, afPool, afQuestionType, afSteps, allowUnsimplified);
    else q = generateWordedQuestion(level, questionType, showHint, asFracOfOriginal, l3Mode);
    if (++attempts > 200) break;
  } while (usedKeys.has(q.key));
  usedKeys.add(q.key);
  return q;
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const DifficultyToggle = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
    {([['level1', 'Level 1', 'bg-green-600'], ['level2', 'Level 2', 'bg-yellow-500'], ['level3', 'Level 3', 'bg-red-600']] as const).map(([val, label, col]) => (
      <button key={val} onClick={() => onChange(val)}
        className={`px-5 py-2 font-bold text-base transition-colors ${value === val ? col + ' text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
        {label}
      </button>
    ))}
  </div>
);

// ── Find the Fraction QO Popover ──────────────────────────────────────────────

const FracQOPopover = ({
  difficulty, denomRange, onDenomRangeChange,
  denomRangeByLevel, onDenomRangeByLevelChange,
  answerFormat, onAnswerFormatChange,
  isDifferentiated,
}: {
  difficulty: string;
  denomRange: string; onDenomRangeChange: (v: string) => void;
  denomRangeByLevel: Record<string, string>; onDenomRangeByLevelChange: (lv: string, v: string) => void;
  answerFormat: string; onAnswerFormatChange: (v: string) => void;
  isDifferentiated: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const rangeOpts = [{ value: 'standard', line1: 'Standard', line2: '(2–10)' }, { value: 'extended', line1: 'Extended', line2: '(2–20)' }];

  const RangeButtons = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
      {rangeOpts.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className={`flex-1 px-4 py-2 text-sm font-bold transition-colors flex flex-col items-center leading-tight ${value === opt.value ? 'bg-blue-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
          <span>{opt.line1}</span><span className="font-normal text-xs">{opt.line2}</span>
        </button>
      ))}
    </div>
  );

  const AnswerFormatButtons = () => (
    <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
      {[{ value: 'decimal', label: 'Decimal' }, { value: 'fraction', label: 'Fraction' }, { value: 'mixed', label: 'Mixed Number' }].map(opt => (
        <button key={opt.value} onClick={() => onAnswerFormatChange(opt.value)}
          className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${answerFormat === opt.value ? 'bg-blue-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
          {opt.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className={`px-4 py-2 rounded-xl border-2 font-bold text-base transition-colors shadow-sm flex items-center gap-2 ${open ? 'bg-blue-900 border-blue-900 text-white' : 'bg-white border-gray-300 text-gray-600 hover:border-blue-900 hover:text-blue-900'}`}>
        Question Options <ChevronDown size={18} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-80 p-5 flex flex-col gap-5">
          {isDifferentiated ? (
            <>
              {(['level1', 'level2', 'level3'] as DifficultyLevel[]).map(lv => (
                <div key={lv} className="flex flex-col gap-2">
                  <span className={`text-sm font-extrabold uppercase tracking-wider ${LV_HEADER_COLORS[lv]}`}>
                    {lv === 'level1' ? 'Level 1' : lv === 'level2' ? 'Level 2' : 'Level 3'}
                  </span>
                  <div className="flex flex-col gap-2 pl-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Denominator Range</span>
                    <RangeButtons value={denomRangeByLevel[lv]} onChange={v => onDenomRangeByLevelChange(lv, v)} />
                    {lv === 'level3' && (
                      <>
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">Answer Format</span>
                        <AnswerFormatButtons />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Denominator Range</span>
                <RangeButtons value={denomRange} onChange={onDenomRangeChange} />
              </div>
              {difficulty === 'level3' && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Answer Format</span>
                  <AnswerFormatButtons />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ── Worded QO Popover ─────────────────────────────────────────────────────────

const WordedQOPopover = ({
  difficulty,
  questionType, onQuestionTypeChange,
  showHint, onShowHintChange,
  asFracOfOriginal, onAsFracOfOriginalChange,
  l3Mode, onL3ModeChange,
  isDifferentiated,
  levelQuestionTypes, onLevelQuestionTypeChange,
  levelShowHints, onLevelShowHintChange,
  levelAsFrac, onLevelAsFracChange,
  levelL3Mode, onLevelL3ModeChange,
}: {
  difficulty: string;
  questionType: string; onQuestionTypeChange: (v: string) => void;
  showHint: boolean; onShowHintChange: (v: boolean) => void;
  asFracOfOriginal: boolean; onAsFracOfOriginalChange: (v: boolean) => void;
  l3Mode: string; onL3ModeChange: (v: string) => void;
  isDifferentiated: boolean;
  levelQuestionTypes: Record<string, string>; onLevelQuestionTypeChange: (lv: string, v: string) => void;
  levelShowHints: Record<string, boolean>; onLevelShowHintChange: (lv: string, v: boolean) => void;
  levelAsFrac: Record<string, boolean>; onLevelAsFracChange: (lv: string, v: boolean) => void;
  levelL3Mode: Record<string, string>; onLevelL3ModeChange: (lv: string, v: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const QTypeButtons = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
      {[{ value: 'direct', label: 'Direct' }, { value: 'indirect', label: 'Indirect' }, { value: 'mixed', label: 'Mixed' }].map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${value === opt.value ? 'bg-blue-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
          {opt.label}
        </button>
      ))}
    </div>
  );

  const L3ModeButtons = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
      {[{ value: 'fracFrac', label: 'Fraction / Fraction' }, { value: 'amountFrac', label: 'Fraction / Amount' }, { value: 'mixed', label: 'Mixed' }].map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${value === opt.value ? 'bg-blue-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
          {opt.label}
        </button>
      ))}
    </div>
  );

  const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <label className="flex items-center gap-3 cursor-pointer py-1">
      <div onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${checked ? 'bg-blue-900' : 'bg-gray-300'}`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-7' : 'translate-x-1'}`} />
      </div>
      <span className="text-sm font-semibold text-gray-700">{label}</span>
    </label>
  );

  const renderLevelOptions = (lv: string) => (
    <div className="flex flex-col gap-2 pl-1">
      {lv === 'level1' && (
        <>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Question Type</span>
          <QTypeButtons value={levelQuestionTypes[lv] ?? 'mixed'} onChange={v => onLevelQuestionTypeChange(lv, v)} />
        </>
      )}
      {lv === 'level2' && (
        <Toggle checked={levelShowHints[lv] ?? false} onChange={v => onLevelShowHintChange(lv, v)} label="Show conversion hint" />
      )}
      {lv === 'level3' && (
        <>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Question Type</span>
          <L3ModeButtons value={levelL3Mode[lv] ?? 'mixed'} onChange={v => onLevelL3ModeChange(lv, v)} />
          <Toggle checked={levelAsFrac[lv] ?? false} onChange={v => onLevelAsFracChange(lv, v)} label="Answer as fraction of original" />
        </>
      )}
    </div>
  );

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className={`px-4 py-2 rounded-xl border-2 font-bold text-base transition-colors shadow-sm flex items-center gap-2 ${open ? 'bg-blue-900 border-blue-900 text-white' : 'bg-white border-gray-300 text-gray-600 hover:border-blue-900 hover:text-blue-900'}`}>
        Question Options <ChevronDown size={18} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-72 p-5 flex flex-col gap-5">
          {isDifferentiated ? (
            <>
              {(['level1', 'level2', 'level3'] as DifficultyLevel[]).map(lv => (
                <div key={lv} className="flex flex-col gap-2">
                  <span className={`text-sm font-extrabold uppercase tracking-wider ${LV_HEADER_COLORS[lv]}`}>
                    {lv === 'level1' ? 'Level 1' : lv === 'level2' ? 'Level 2' : 'Level 3'}
                  </span>
                  {renderLevelOptions(lv)}
                </div>
              ))}
            </>
          ) : (
            <>
              {difficulty === 'level1' && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Question Type</span>
                  <QTypeButtons value={questionType} onChange={onQuestionTypeChange} />
                </div>
              )}
              {difficulty === 'level2' && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Options</span>
                  <Toggle checked={showHint} onChange={onShowHintChange} label="Show conversion hint" />
                </div>
              )}
              {difficulty === 'level3' && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Question Type</span>
                  <L3ModeButtons value={l3Mode} onChange={onL3ModeChange} />
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-wider mt-1">Options</span>
                  <Toggle checked={asFracOfOriginal} onChange={onAsFracOfOriginalChange} label="Answer as fraction of original" />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ── Info Modal ────────────────────────────────────────────────────────────────

const INFO_SECTIONS = [
  {
    title: 'Finding Amounts', icon: '½',
    content: [
      { label: 'Overview', detail: 'Practice finding fractions of amounts using the divide-then-multiply method.' },
      { label: 'Level 1 — Green', detail: 'Unit fractions only (e.g. ¼ of 20). The amount is always a multiple of the denominator, giving whole-number answers.' },
      { label: 'Level 2 — Yellow', detail: 'Non-unit fractions (e.g. ³⁄₅ of 40). One part is always a whole number so the final answer is also a whole number.' },
      { label: 'Level 3 — Red', detail: 'Non-unit fractions where one part may be a decimal. Answers can be decimals, fractions, or mixed numbers.' },
      { label: 'Denominator Range', detail: 'Standard uses denominators 2–10. Extended uses 2–20.' },
      { label: 'Answer Format (Level 3)', detail: 'Choose between Decimal, Fraction, or Mixed Number display for Level 3 answers.' },
    ],
  },
  {
    title: 'Finding Amounts (Worded)', icon: '📝',
    content: [
      { label: 'Overview', detail: 'Apply fractions of amounts to real-world contexts with progressively complex reasoning.' },
      { label: 'Level 1 — Green', detail: 'One-step questions in everyday contexts. Direct asks for the fraction amount; Indirect asks for the remainder.' },
      { label: 'Level 2 — Yellow', detail: 'Requires a known unit conversion (e.g. hours in a day). The conversion hint can be toggled on or off.' },
      { label: 'Level 3 — Red', detail: 'Two-step questions with a changing amount: amount→fraction, fraction→amount, or fraction→fraction sub-types mixed automatically. Toggle "Answer as fraction of original" for an extra challenge.' },
    ],
  },
  {
    title: 'Modes', icon: '🖥️',
    content: [
      { label: 'Whiteboard', detail: 'One large question with blank working space. Ideal for whole-class teaching.' },
      { label: 'Worked Example', detail: 'Question with step-by-step solution revealed on demand.' },
      { label: 'Worksheet', detail: 'Grid of questions with adjustable columns and count. Answers can be shown or hidden.' },
    ],
  },
  {
    title: 'Differentiated Worksheet', icon: '📋',
    content: [
      { label: 'What it does', detail: 'Generates three colour-coded columns — one per difficulty level.' },
      { label: 'Per-level Options', detail: 'Question Options shows independent settings for each level when Differentiated is active.' },
    ],
  },
];

const InfoModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col" style={{ height: '80vh' }} onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tool Information</h2>
          <p className="text-sm text-gray-400 mt-0.5">A guide to all features and options</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
          <X size={20} />
        </button>
      </div>
      <div className="overflow-y-auto px-7 py-6 flex flex-col gap-6 flex-1">
        {INFO_SECTIONS.map(section => (
          <div key={section.title}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{section.icon}</span>
              <h3 className="text-lg font-bold text-blue-900">{section.title}</h3>
            </div>
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

const MenuDropdown = ({ colorScheme, setColorScheme, onClose, onOpenInfo }: {
  colorScheme: ColorScheme; setColorScheme: (s: ColorScheme) => void; onClose: () => void; onOpenInfo: () => void;
}) => {
  const [colorOpen, setColorOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden" style={{ minWidth: '200px' }}>
      <div className="py-1">
        <button onClick={() => setColorOpen(!colorOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`text-gray-400 transition-transform duration-200 ${colorOpen ? 'rotate-90' : ''}`}>
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Colour Scheme</span>
          </div>
          <span className="text-xs text-gray-400 font-normal">{colorScheme.charAt(0).toUpperCase() + colorScheme.slice(1)}</span>
        </button>
        {colorOpen && (
          <div className="border-t border-gray-100">
            {['default', 'blue', 'pink', 'yellow'].map(s => (
              <button key={s} onClick={() => { setColorScheme(s as ColorScheme); onClose(); }}
                className={`w-full flex items-center justify-between pl-10 pr-4 py-2.5 text-sm font-semibold transition-colors ${colorScheme === s ? 'bg-blue-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
                {colorScheme === s && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7l3.5 3.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
        <div className="border-t border-gray-100 my-1" />
        <button onClick={() => { onOpenInfo(); onClose(); }}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
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

// ── As a Fraction QO Popover ─────────────────────────────────────────────────

const AsFracQOPopover = ({
  difficulty,
  afPool, onAfPoolChange,
  afQuestionType, onAfQuestionTypeChange,
  afSteps, onAfStepsChange,
  isDifferentiated,
  levelAfPool, onLevelAfPoolChange,
  levelAfQuestionType, onLevelAfQuestionTypeChange,
  levelAfSteps, onLevelAfStepsChange,
  afAllowUnsimplified, onAfAllowUnsimplifiedChange,
  levelAfAllowUnsimplified, onLevelAfAllowUnsimplifiedChange,
}: {
  difficulty: string;
  afPool: string; onAfPoolChange: (v: string) => void;
  afQuestionType: string; onAfQuestionTypeChange: (v: string) => void;
  afSteps: string; onAfStepsChange: (v: string) => void;
  isDifferentiated: boolean;
  levelAfPool: Record<string, string>; onLevelAfPoolChange: (lv: string, v: string) => void;
  levelAfQuestionType: Record<string, string>; onLevelAfQuestionTypeChange: (lv: string, v: string) => void;
  levelAfSteps: Record<string, string>; onLevelAfStepsChange: (lv: string, v: string) => void;
  afAllowUnsimplified: boolean; onAfAllowUnsimplifiedChange: (v: boolean) => void;
  levelAfAllowUnsimplified: Record<string, boolean>; onLevelAfAllowUnsimplifiedChange: (lv: string, v: boolean) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <label className="flex items-center gap-3 cursor-pointer py-1">
      <div onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${checked ? 'bg-blue-900' : 'bg-gray-300'}`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-7' : 'translate-x-1'}`} />
      </div>
      <span className="text-sm font-semibold text-gray-700">{label}</span>
    </label>
  );

  const SegButtons = ({ value, onChange, opts }: { value: string; onChange: (v: string) => void; opts: { value: string; label: string }[] }) => (
    <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
      {opts.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${value === opt.value ? 'bg-blue-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
          {opt.label}
        </button>
      ))}
    </div>
  );

  const renderLevelOpts = (lv: string) => (
    <div className="flex flex-col gap-3 pl-1">
      {lv === 'level1' && (
        <>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Number Range</span>
          <SegButtons value={levelAfPool[lv] ?? 'standard'} onChange={v => onLevelAfPoolChange(lv, v)}
            opts={[{ value: 'standard', label: 'Standard (×12)' }, { value: 'extended', label: 'Extended (×19)' }]} />
          <Toggle checked={levelAfAllowUnsimplified[lv] ?? false} onChange={v => onLevelAfAllowUnsimplifiedChange(lv, v)} label="Include already simplified" />
        </>
      )}
      {lv === 'level2' && (
        <>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Question Type</span>
          <SegButtons value={levelAfQuestionType[lv] ?? 'mixed'} onChange={v => onLevelAfQuestionTypeChange(lv, v)}
            opts={[{ value: 'direct', label: 'Direct' }, { value: 'indirect', label: 'Indirect' }, { value: 'mixed', label: 'Mixed' }]} />
        </>
      )}
      {lv === 'level3' && (
        <>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Steps</span>
          <SegButtons value={levelAfSteps[lv] ?? 'mixed'} onChange={v => onLevelAfStepsChange(lv, v)}
            opts={[{ value: '1step', label: '1 Step' }, { value: '2step', label: '2 Steps' }, { value: 'mixed', label: 'Mixed' }]} />
        </>
      )}
    </div>
  );

  const renderSingleOpts = () => {
    if (difficulty === 'level1') return (
      <div className="flex flex-col gap-2">
        <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Number Range</span>
        <SegButtons value={afPool} onChange={onAfPoolChange}
          opts={[{ value: 'standard', label: 'Standard (×12)' }, { value: 'extended', label: 'Extended (×19)' }]} />
        <Toggle checked={afAllowUnsimplified} onChange={onAfAllowUnsimplifiedChange} label="Include already simplified" />
      </div>
    );
    if (difficulty === 'level2') return (
      <div className="flex flex-col gap-2">
        <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Question Type</span>
        <SegButtons value={afQuestionType} onChange={onAfQuestionTypeChange}
          opts={[{ value: 'direct', label: 'Direct' }, { value: 'indirect', label: 'Indirect' }, { value: 'mixed', label: 'Mixed' }]} />
      </div>
    );
    return (
      <div className="flex flex-col gap-2">
        <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Steps</span>
        <SegButtons value={afSteps} onChange={onAfStepsChange}
          opts={[{ value: '1step', label: '1 Step' }, { value: '2step', label: '2 Steps' }, { value: 'mixed', label: 'Mixed' }]} />
      </div>
    );
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className={`px-4 py-2 rounded-xl border-2 font-bold text-base transition-colors shadow-sm flex items-center gap-2 ${open ? 'bg-blue-900 border-blue-900 text-white' : 'bg-white border-gray-300 text-gray-600 hover:border-blue-900 hover:text-blue-900'}`}>
        Question Options <ChevronDown size={18} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-72 p-5 flex flex-col gap-5">
          {isDifferentiated ? (
            <>
              {(['level1', 'level2', 'level3'] as DifficultyLevel[]).map(lv => (
                <div key={lv} className="flex flex-col gap-2">
                  <span className={`text-sm font-extrabold uppercase tracking-wider ${LV_HEADER_COLORS[lv]}`}>
                    {lv === 'level1' ? 'Level 1' : lv === 'level2' ? 'Level 2' : 'Level 3'}
                  </span>
                  {renderLevelOpts(lv)}
                </div>
              ))}
            </>
          ) : renderSingleOpts()}
        </div>
      )}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

export default function FractionsOfAmounts() {
  const navigate = useNavigate();
  const [currentTool, setCurrentTool] = useState<ToolType>('findFraction');
  const [mode, setMode] = useState<Mode>('whiteboard');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('level1');

  // Find the Fraction options
  const [denomRange, setDenomRange] = useState('standard');
  const [denomRangeByLevel, setDenomRangeByLevel] = useState<Record<string, string>>({ level1: 'standard', level2: 'standard', level3: 'standard' });
  const [answerFormat, setAnswerFormat] = useState('decimal');

  // As a Fraction options
  const [afPool, setAfPool] = useState('standard');
  const [afQuestionType, setAfQuestionType] = useState('mixed');
  const [afSteps, setAfSteps] = useState('mixed');
  const [afAllowUnsimplified, setAfAllowUnsimplified] = useState(false);
  const [levelAfPool, setLevelAfPool] = useState<Record<string, string>>({ level1: 'standard', level2: 'standard', level3: 'standard' });
  const [levelAfQuestionType, setLevelAfQuestionType] = useState<Record<string, string>>({ level1: 'mixed', level2: 'mixed', level3: 'mixed' });
  const [levelAfSteps, setLevelAfSteps] = useState<Record<string, string>>({ level1: 'mixed', level2: 'mixed', level3: 'mixed' });
  const [levelAfAllowUnsimplified, setLevelAfAllowUnsimplified] = useState<Record<string, boolean>>({ level1: false, level2: false, level3: false });

  // Worded options
  const [questionType, setQuestionType] = useState('mixed');
  const [showHint, setShowHint] = useState(false);
  const [asFracOfOriginal, setAsFracOfOriginal] = useState(false);
  const [l3Mode, setL3Mode] = useState('mixed');
  const [levelL3Mode, setLevelL3Mode] = useState<Record<string, string>>({ level1: 'mixed', level2: 'mixed', level3: 'mixed' });
  const [levelQuestionTypes, setLevelQuestionTypes] = useState<Record<string, string>>({ level1: 'mixed', level2: 'mixed', level3: 'mixed' });
  const [levelShowHints, setLevelShowHints] = useState<Record<string, boolean>>({ level1: false, level2: false, level3: false });
  const [levelAsFrac, setLevelAsFrac] = useState<Record<string, boolean>>({ level1: false, level2: false, level3: false });

  // Shared state
  const [currentQuestion, setCurrentQuestion] = useState<AnyQuestion | null>(null);
  const [showWhiteboardAnswer, setShowWhiteboardAnswer] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [numQuestions, setNumQuestions] = useState(6);
  const [worksheet, setWorksheet] = useState<AnyQuestion[]>([]);
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState(false);
  const [isDifferentiated, setIsDifferentiated] = useState(false);
  const [numColumns, setNumColumns] = useState(2);
  const [worksheetFontSize, setWorksheetFontSize] = useState(1);
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const getQBg = () => colorScheme === 'blue' ? '#D1E7F8' : colorScheme === 'pink' ? '#F8D1E7' : colorScheme === 'yellow' ? '#F8F4D1' : '#ffffff';
  const getStepBg = () => colorScheme === 'blue' ? '#B3D9F2' : colorScheme === 'pink' ? '#F2B3D9' : colorScheme === 'yellow' ? '#F2EBB3' : '#f3f4f6';

  const setDenomRangeForLevel = (lv: string, v: string) => setDenomRangeByLevel(prev => ({ ...prev, [lv]: v }));

  const handleNewQuestion = () => {
    let q: AnyQuestion;
    if (currentTool === 'findFraction') q = generateFracQuestion(difficulty, denomRange, answerFormat);
    else if (currentTool === 'asFraction') q = generateAsFracQuestion(difficulty, afPool, afQuestionType, afSteps, afAllowUnsimplified);
    else q = generateWordedQuestion(difficulty, questionType, showHint, asFracOfOriginal, l3Mode);
    setCurrentQuestion(q);
    setShowWhiteboardAnswer(false);
    setShowAnswer(false);
  };

  const handleGenerateWorksheet = () => {
    const usedKeys = new Set<string>();
    const questions: AnyQuestion[] = [];
    if (isDifferentiated) {
      (['level1', 'level2', 'level3'] as DifficultyLevel[]).forEach(lv => {
        for (let i = 0; i < numQuestions; i++) {
          questions.push(generateUniqueQ(
            currentTool, lv,
            denomRangeByLevel[lv] ?? 'standard', answerFormat,
            levelQuestionTypes[lv] ?? 'mixed',
            levelShowHints[lv] ?? false,
            levelAsFrac[lv] ?? false,
            levelL3Mode[lv] ?? 'mixed',
            levelAfPool[lv] ?? 'standard',
            levelAfQuestionType[lv] ?? 'mixed',
            levelAfSteps[lv] ?? 'mixed',
            levelAfAllowUnsimplified[lv] ?? false,
            usedKeys,
          ));
        }
      });
    } else {
      for (let i = 0; i < numQuestions; i++) {
        questions.push(generateUniqueQ(currentTool, difficulty, denomRange, answerFormat, questionType, showHint, asFracOfOriginal, l3Mode, afPool, afQuestionType, afSteps, afAllowUnsimplified, usedKeys));
      }
    }
    setWorksheet(questions);
    setShowWorksheetAnswers(false);
  };

  useEffect(() => { if (mode !== 'worksheet') handleNewQuestion(); }, [difficulty, currentTool]);
  useEffect(() => { handleNewQuestion(); }, []);

  const fontSizes = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
  const canIncrease = worksheetFontSize < fontSizes.length - 1;
  const canDecrease = worksheetFontSize > 0;

  const renderAnswer = (q: AnyQuestion): string => {
    if (q.kind === 'frac') return formatRational(q.answerN, q.answerD, answerFormat);
    if (q.kind === 'asFrac') return (q as AsFracQuestion).answer;
    return (q as WordedQuestion).answer;
  };

  // QO popovers
  const fracQO = (diff = false) => (
    <FracQOPopover
      difficulty={difficulty}
      denomRange={denomRange} onDenomRangeChange={setDenomRange}
      denomRangeByLevel={denomRangeByLevel} onDenomRangeByLevelChange={setDenomRangeForLevel}
      answerFormat={answerFormat} onAnswerFormatChange={setAnswerFormat}
      isDifferentiated={diff}
    />
  );

  const wordedQO = (diff = false) => (
    <WordedQOPopover
      difficulty={difficulty}
      questionType={questionType} onQuestionTypeChange={setQuestionType}
      showHint={showHint} onShowHintChange={setShowHint}
      asFracOfOriginal={asFracOfOriginal} onAsFracOfOriginalChange={setAsFracOfOriginal}
      l3Mode={l3Mode} onL3ModeChange={setL3Mode}
      isDifferentiated={diff}
      levelQuestionTypes={levelQuestionTypes}
      onLevelQuestionTypeChange={(lv, v) => setLevelQuestionTypes(prev => ({ ...prev, [lv]: v }))}
      levelShowHints={levelShowHints}
      onLevelShowHintChange={(lv, v) => setLevelShowHints(prev => ({ ...prev, [lv]: v }))}
      levelAsFrac={levelAsFrac}
      onLevelAsFracChange={(lv, v) => setLevelAsFrac(prev => ({ ...prev, [lv]: v }))}
      levelL3Mode={levelL3Mode}
      onLevelL3ModeChange={(lv, v) => setLevelL3Mode(prev => ({ ...prev, [lv]: v }))}
    />
  );

  const asFracQO = (diff = false) => (
    <AsFracQOPopover
      difficulty={difficulty}
      afPool={afPool} onAfPoolChange={setAfPool}
      afQuestionType={afQuestionType} onAfQuestionTypeChange={setAfQuestionType}
      afSteps={afSteps} onAfStepsChange={setAfSteps}
      isDifferentiated={diff}
      levelAfPool={levelAfPool} onLevelAfPoolChange={(lv, v) => setLevelAfPool(prev => ({ ...prev, [lv]: v }))}
      levelAfQuestionType={levelAfQuestionType} onLevelAfQuestionTypeChange={(lv, v) => setLevelAfQuestionType(prev => ({ ...prev, [lv]: v }))}
      levelAfSteps={levelAfSteps} onLevelAfStepsChange={(lv, v) => setLevelAfSteps(prev => ({ ...prev, [lv]: v }))}
      afAllowUnsimplified={afAllowUnsimplified} onAfAllowUnsimplifiedChange={setAfAllowUnsimplified}
      levelAfAllowUnsimplified={levelAfAllowUnsimplified} onLevelAfAllowUnsimplifiedChange={(lv, v) => setLevelAfAllowUnsimplified(prev => ({ ...prev, [lv]: v }))}
    />
  );

  const qoEl = (diff = false) => {
    if (currentTool === 'findFraction') return fracQO(diff);
    if (currentTool === 'asFraction') return asFracQO(diff);
    return wordedQO(diff);
  };

  // ── Control bar ──────────────────────────────────────────────────────────────

  const renderControlBar = () => {
    if (mode === 'worksheet') return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex justify-center items-center gap-6 mb-4">
          <div className="flex items-center gap-3">
            <label className="text-base font-semibold text-gray-700">Questions:</label>
            <input type="number" min="1" max="20" value={numQuestions}
              onChange={e => setNumQuestions(Math.max(1, Math.min(20, parseInt(e.target.value) || 6)))}
              className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base" />
          </div>
          {qoEl(isDifferentiated)}
          <button onClick={() => setIsDifferentiated(!isDifferentiated)}
            className={`px-6 py-2 rounded-xl font-bold text-base shadow-sm border-2 transition-colors ${isDifferentiated ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-900 hover:text-blue-900'}`}>
            Differentiated
          </button>
        </div>
        {!isDifferentiated && (
          <div className="flex justify-center items-center gap-6 mb-4">
            <DifficultyToggle value={difficulty} onChange={v => setDifficulty(v as DifficultyLevel)} />
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
          <DifficultyToggle value={difficulty} onChange={v => setDifficulty(v as DifficultyLevel)} />
          {qoEl()}
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

  // ── As a Fraction question panel ─────────────────────────────────────────────

  const renderAsFracPanel = (q: AsFracQuestion) => {
    const lines = q.questionText.split('\n');
    return (
      <div className="rounded-xl flex items-center justify-center p-8"
        style={{ width: '480px', minHeight: '500px', flexShrink: 0, backgroundColor: getStepBg() }}>
        <div className="w-full text-center">
          {lines.map((line, i) => (
            <div key={i} className="mb-5 text-3xl font-semibold"
              style={{ color: '#000000', lineHeight: '1.5' }}>
              {line}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Worded question panel (left side of split layout) ────────────────────────

  const renderWordedPanel = (q: WordedQuestion) => {
    const lines = q.questionText.split('\n');
    return (
      <div className="rounded-xl flex items-center justify-center p-8"
        style={{ width: '480px', minHeight: '500px', flexShrink: 0, backgroundColor: getStepBg() }}>
        <div className="w-full text-center">
          {lines.map((line, i) => (
            <div key={i} className="mb-5 text-3xl font-semibold"
              style={{ color: '#000000', lineHeight: '1.5' }}>
              {line}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Whiteboard ─────────────────────────────────────────────────────────────────

  const renderWhiteboardMode = () => {
    const kind = currentQuestion?.kind;
    const isPanelStyle = kind === 'worded' || kind === 'asFrac';
    return (
      <div className="rounded-xl shadow-2xl p-8" style={{ backgroundColor: getQBg() }}>
        {isPanelStyle ? (
          <div className="flex gap-6">
            {currentQuestion ? (
              kind === 'asFrac'
                ? renderAsFracPanel(currentQuestion as AsFracQuestion)
                : renderWordedPanel(currentQuestion as WordedQuestion)
            ) : <div style={{ width: '480px', minHeight: '500px', flexShrink: 0 }} />}
            <div className="flex-1 rounded-xl p-6 flex flex-col" style={{ minHeight: '500px', backgroundColor: getStepBg() }}>
              {showWhiteboardAnswer && currentQuestion && (
                <div className="text-center mt-4">
                  <div className="text-4xl font-bold" style={{ color: '#166534' }}>= {renderAnswer(currentQuestion)}</div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center">
            {currentQuestion ? (
              <>
                <span className="text-6xl font-bold" style={{ color: '#000000' }}>Find {(currentQuestion as FracQuestion).display}</span>
                {showWhiteboardAnswer && (
                  <span className="text-6xl font-bold ml-4" style={{ color: '#166534' }}>= {renderAnswer(currentQuestion)}</span>
                )}
              </>
            ) : <span className="text-4xl text-gray-400">Generate question</span>}
            <div className="rounded-xl mt-8" style={{ height: '400px', backgroundColor: getStepBg() }} />
          </div>
        )}
      </div>
    );
  };

  // ── Worked Example ─────────────────────────────────────────────────────────────

  const renderWorkedExampleMode = () => {
    const kind = currentQuestion?.kind;
    return (
      <div className="rounded-xl shadow-lg p-8 w-full" style={{ backgroundColor: getQBg() }}>
        {currentQuestion ? (
          <>
            <div className="text-center py-4">
              {kind === 'worded' ? (
                <div className="space-y-3">
                  {(currentQuestion as WordedQuestion).questionText.split('\n').map((line, i) => (
                    <div key={i} className="text-4xl font-bold" style={{ color: '#000000' }}>{line}</div>
                  ))}
                </div>
              ) : kind === 'asFrac' ? (
                <div className="space-y-3">
                  {(currentQuestion as AsFracQuestion).questionText.split('\n').map((line, i) => (
                    <div key={i} className="text-4xl font-bold" style={{ color: '#000000' }}>{line}</div>
                  ))}
                </div>
              ) : (
                <span className="text-6xl font-bold" style={{ color: '#000000' }}>Find {(currentQuestion as FracQuestion).display}</span>
              )}
            </div>
            {showAnswer && (
              <>
                <div className="space-y-4">
                  {currentQuestion.working.map((step, i) => (
                    <div key={i} className="rounded-xl p-6" style={{ backgroundColor: getStepBg() }}>
                      <h4 className="text-xl font-bold mb-2" style={{ color: '#000000' }}>Step {i + 1}</h4>
                      <p className="text-2xl" style={{ color: '#000000' }}>{step.content}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl p-6 text-center mt-4" style={{ backgroundColor: getStepBg() }}>
                  <span className="text-5xl font-bold" style={{ color: '#166534' }}>= {renderAnswer(currentQuestion)}</span>
                </div>
              </>
            )}
          </>
        ) : <div className="text-center text-gray-400 text-4xl py-4">Generate question</div>}
      </div>
    );
  };

  // ── Worksheet ─────────────────────────────────────────────────────────────────

  const renderWorksheetMode = () => {
    const fsz = fontSizes[worksheetFontSize];

    if (worksheet.length === 0) return (
      <div className="rounded-xl shadow-2xl p-8 text-center" style={{ backgroundColor: getQBg() }}>
        <span className="text-2xl text-gray-400">Generate worksheet</span>
      </div>
    );

    const fontCtrl = (
      <div className="absolute top-4 right-4 flex items-center gap-1">
        {([['down', canDecrease, () => canDecrease && setWorksheetFontSize(worksheetFontSize - 1)],
           ['up',   canIncrease, () => canIncrease && setWorksheetFontSize(worksheetFontSize + 1)]] as [string, boolean, () => void][]).map(([dir, can, fn]) => (
          <button key={dir} onClick={fn} disabled={!can}
            className={`w-8 h-8 rounded flex items-center justify-center ${can ? 'bg-blue-900 text-white hover:bg-blue-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            {dir === 'down' ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
        ))}
      </div>
    );

    const renderQCell = (q: AnyQuestion, idx: number, bgOverride?: string) => {
      const bg = bgOverride ?? getStepBg();
      const ansText = renderAnswer(q);
      if (q.kind === 'worded' || q.kind === 'asFrac') {
        const lines = q.kind === 'worded'
          ? (q as WordedQuestion).questionText.split('\n')
          : (q as AsFracQuestion).questionText.split('\n');
        return (
          <div className="rounded-lg p-4 shadow" style={{ backgroundColor: bg }}>
            <div className={`${fsz} font-semibold`} style={{ color: '#000000', lineHeight: '1.7' }}>
              <span className="font-bold">{idx + 1}. </span>
              {lines.map((line, i) => <div key={i}>{line}</div>)}
            </div>
            {showWorksheetAnswers && <div className={`${fsz} font-semibold mt-2`} style={{ color: '#059669' }}>= {ansText}</div>}
          </div>
        );
      }
      return (
        <div className="rounded-lg p-4 shadow" style={{ backgroundColor: bg }}>
          <span className={`${fsz} font-semibold`} style={{ color: '#000000' }}>{idx + 1}. Find {(q as FracQuestion).display}</span>
          {showWorksheetAnswers && <span className={`${fsz} font-semibold ml-2`} style={{ color: '#059669' }}>= {ansText}</span>}
        </div>
      );
    };

    const toolTitle = currentTool === 'findFraction' ? 'Finding Amounts' : currentTool === 'asFraction' ? 'Expressing as a Fraction' : 'Finding Amounts (Worded)';

    if (isDifferentiated) return (
      <div className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: getQBg() }}>
        {fontCtrl}
        <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#000000' }}>{toolTitle} — Worksheet</h2>
        <div className="grid grid-cols-3 gap-4">
          {(['level1', 'level2', 'level3'] as DifficultyLevel[]).map((lv, li) => {
            const lqs = worksheet.filter(q => q.difficulty === lv);
            const cc = LV_COLORS[lv];
            return (
              <div key={lv} className={`${cc.bg} border-2 ${cc.border} rounded-xl p-4`}>
                <h3 className={`text-xl font-bold mb-4 text-center ${cc.text}`}>Level {li + 1}</h3>
                <div className="space-y-3">{lqs.map((q, idx) => <div key={idx}>{renderQCell(q, idx, cc.fill)}</div>)}</div>
              </div>
            );
          })}
        </div>
      </div>
    );

    return (
      <div className="rounded-xl shadow-2xl p-8 relative" style={{ backgroundColor: getQBg() }}>
        {fontCtrl}
        <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#000000' }}>{toolTitle} — Worksheet</h2>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${numColumns}, 1fr)` }}>
          {worksheet.map((q, idx) => <div key={idx}>{renderQCell(q, idx)}</div>)}
        </div>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────────

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
            {isMenuOpen && (
              <MenuDropdown colorScheme={colorScheme} setColorScheme={setColorScheme}
                onClose={() => setIsMenuOpen(false)} onOpenInfo={() => setIsInfoOpen(true)} />
            )}
          </div>
        </div>
      </div>

      {isInfoOpen && <InfoModal onClose={() => setIsInfoOpen(false)} />}

      <div className="min-h-screen p-8" style={{ backgroundColor: '#f5f3f0' }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-8" style={{ color: '#000000' }}>Fractions of Amounts</h1>
          <div className="flex justify-center mb-6"><div style={{ width: '90%', height: '2px', backgroundColor: '#d1d5db' }} /></div>

          {/* Sub-tool selector */}
          <div className="flex justify-center gap-4 mb-6">
            {([['findFraction', 'Finding Amounts'], ['worded', 'Finding Amounts (Worded)'], ['asFraction', 'Expressing as a Fraction']] as [ToolType, string][]).map(([tool, label]) => (
              <button key={tool} onClick={() => setCurrentTool(tool)}
                className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${currentTool === tool ? 'bg-blue-900 text-white' : 'bg-white text-gray-800 hover:bg-gray-100 hover:text-blue-900'}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="flex justify-center mb-8"><div style={{ width: '90%', height: '2px', backgroundColor: '#d1d5db' }} /></div>

          {/* Mode selector */}
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
}
