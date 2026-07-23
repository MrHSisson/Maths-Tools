import { useState, useEffect } from 'react';
import { Home, Eye, Download, RefreshCw, RotateCcw, Plus, Check, X, ChevronUp, ChevronDown } from 'lucide-react';

const TOOL_CONFIG = {
  pageTitle: 'Maths Skills Generator',
};

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Question = {
  question: string;
  answer: number | string;
  displayQuestion?: string; // for superscript / stacked-fraction rendering in preview + print
  displayAnswer?: string;   // stacked-fraction HTML for the answer key (falls back to answer)
  skill?: SkillId; // which skill generated this question
};

type SkillId =
  | 'numberBonds'
  | 'timesTables'
  | 'reverseTT'
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'negatives'
  | 'busStop'
  | 'indices'
  | 'powersOfTen'
  | 'rounding'
  | 'primes'
  | 'fdp'
  | 'metric'
  | 'bidmas'
  | 'fracAdd'
  | 'fracSub'
  | 'fracMul'
  | 'fracDiv';

// ─── SKILL CONFIG ─────────────────────────────────────────────────────────────

type NumberBondsConfig = { targets: number[] };
type TimesTablesConfig = { range: 10 | 12 | 20; specificTables: number[]; suppressDuplicates: boolean };
type AdditionConfig = { digitBands: (1 | 2 | 3)[]; allowCarrying: boolean };
type SubtractionConfig = { digitBands: (1 | 2 | 3)[]; requireExchange: boolean };
type NegativesConfig = { operations: ('addition' | 'subtraction' | 'multiplication' | 'division')[]; range: 10 | 25 };
type ReverseTTConfig = { range: 10 | 12 | 20 };
type MultiplicationConfig = { types: ('2dx1d' | '2dx2d' | '3dx1d' | '3dx2d')[] };
type BusStopConfig = { types: ('2d1d' | '3d1d' | '3d2d')[] };
type IndicesConfig = { baseRange: 10 | 15; exponentRange: (2 | 3 | 4)[] };

type BaseType = 'int' | '1dp' | '2dp';
type PowersOfTenConfig = {
  operations: ('multiply' | 'divide')[];
  powers: (10 | 100 | 1000)[];
  baseTypes: BaseType[];
};
type RoundTarget = 'n10' | 'n100' | 'n1000' | '1dp' | '2dp' | '1sf' | '2sf';
type RoundingConfig = { targets: RoundTarget[]; edgeCases: boolean };
type PrimesConfig = { tasks: ('identify' | 'next')[]; max: 20 | 50 | 100 };
type FdpPath = 'fd' | 'fp' | 'df' | 'dp' | 'pf' | 'pd';
type FdpComplexity = 'common' | 'extended';
type FdpConfig = { paths: FdpPath[]; complexities: FdpComplexity[] };
type MetricStep = 'adjacent' | 'nonadjacent';
type MetricConfig = {
  categories: ('length' | 'mass' | 'capacity')[];
  steps: MetricStep[];
  decimals: boolean;
};
type BidmasConfig = {
  steps: (2 | 3)[];
  brackets: boolean;
  indices: boolean;
  allowNegatives: boolean;
};
// Fractions. All operands are proper fractions / integers (no mixed-number inputs);
// answers are always simplified, optionally shown as mixed numbers.
type FracDenomType = 'common' | 'multiple' | 'lcm';
type FracAddSubConfig = { denomTypes: FracDenomType[]; mixed: boolean };
type FracMulType = 'fxi' | 'fxf';
type FracMulConfig = { types: FracMulType[]; mixed: boolean };
type FracDivType = 'fdi' | 'idf' | 'fdf';
type FracDivConfig = { types: FracDivType[]; mixed: boolean };

type SkillConfigs = {
  numberBonds: NumberBondsConfig;
  timesTables: TimesTablesConfig;
  reverseTT: ReverseTTConfig;
  addition: AdditionConfig;
  subtraction: SubtractionConfig;
  multiplication: MultiplicationConfig;
  negatives: NegativesConfig;
  busStop: BusStopConfig;
  indices: IndicesConfig;
  powersOfTen: PowersOfTenConfig;
  rounding: RoundingConfig;
  primes: PrimesConfig;
  fdp: FdpConfig;
  metric: MetricConfig;
  bidmas: BidmasConfig;
  fracAdd: FracAddSubConfig;
  fracSub: FracAddSubConfig;
  fracMul: FracMulConfig;
  fracDiv: FracDivConfig;
};

// ─── QUESTION GENERATORS ─────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Round away floating-point noise, default 6 dp.
function round(n: number, dp = 6): number {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}

// Number → string with trailing zeros stripped (e.g. 2.50 → "2.5", 10.0 → "10").
function numStr(n: number): string {
  return String(round(n, 6));
}

function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}

function nextPrime(n: number): number {
  let p = n + 1;
  while (!isPrime(p)) p++;
  return p;
}

function genNumberBonds(config: NumberBondsConfig): Question[] {
  const pool: Question[] = [];
  for (const target of config.targets) {
    for (let a = 0; a <= target; a++) {
      const b = target - a;
      pool.push({ question: `___ + ${b} = ${target}`, answer: a });
      pool.push({ question: `${a} + ___ = ${target}`, answer: b });
    }
  }
  return shuffle(pool);
}

function genTimesTables(config: TimesTablesConfig): Question[] {
  const pool: Question[] = [];
  const tables = config.specificTables.length > 0
    ? config.specificTables
    : Array.from({ length: config.range }, (_, i) => i + 1);

  for (const a of tables) {
    for (let b = 1; b <= config.range; b++) {
      const ans = a * b;
      pool.push({ question: `${a} × ${b} = ___`, answer: ans });
      if (!config.suppressDuplicates) {
        pool.push({ question: `${b} × ${a} = ___`, answer: ans });
      }
    }
  }
  return shuffle(pool);
}

function genAddition(config: AdditionConfig): Question[] {
  const pool: Question[] = [];
  for (const band of config.digitBands) {
    const [min, max] = band === 1 ? [1, 9] : band === 2 ? [10, 99] : [100, 999];
    for (let i = 0; i < 200; i++) {
      const a = randInt(min, max);
      const b = randInt(min, max);
      const ans = a + b;
      if (!config.allowCarrying) {
        // skip if any digit column carries
        const aStr = a.toString().padStart(3, '0');
        const bStr = b.toString().padStart(3, '0');
        let carries = false;
        for (let d = 2; d >= 0; d--) {
          if (parseInt(aStr[d]) + parseInt(bStr[d]) >= 10) { carries = true; break; }
        }
        if (carries) continue;
      }
      pool.push({ question: `${a} + ${b} = ___`, answer: ans });
    }
  }
  return shuffle(pool);
}

function genSubtraction(config: SubtractionConfig): Question[] {
  const pool: Question[] = [];
  for (const band of config.digitBands) {
    const [min, max] = band === 1 ? [1, 9] : band === 2 ? [10, 99] : [100, 999];
    for (let i = 0; i < 200; i++) {
      let a = randInt(min, max);
      let b = randInt(min, max);
      if (b > a) [a, b] = [b, a]; // always prevent negative results
      if (a === b) continue;
      const ans = a - b;

      // detect exchange (borrowing)
      const aStr = a.toString().padStart(3, '0');
      const bStr = b.toString().padStart(3, '0');
      let needsExchange = false;
      for (let d = 2; d >= 0; d--) {
        if (parseInt(aStr[d]) < parseInt(bStr[d])) { needsExchange = true; break; }
      }
      if (config.requireExchange && !needsExchange) continue;

      pool.push({ question: `${a} − ${b} = ___`, answer: ans });
    }
  }
  return shuffle(pool);
}

function genNegatives(config: NegativesConfig): Question[] {
  const pool: Question[] = [];
  const r = config.range;
  for (const op of config.operations) {
    if (op === 'addition' || op === 'subtraction') {
      for (let a = -r; a <= r; a++) {
        for (let b = -r; b <= r; b++) {
          if (a === 0 || b === 0) continue;
          const sym = op === 'addition' ? '+' : '−';
          const ans = op === 'addition' ? a + b : a - b;
          const fmtA = a < 0 ? `(${a})` : `${a}`;
          const fmtB = b < 0 ? `(${b})` : `${b}`;
          pool.push({ question: `${fmtA} ${sym} ${fmtB} = ___`, answer: ans });
        }
      }
    } else if (op === 'multiplication') {
      for (let a = -r; a <= r; a++) {
        for (let b = -r; b <= r; b++) {
          if (a === 0 || b === 0) continue;
          const fmtA = a < 0 ? `(${a})` : `${a}`;
          const fmtB = b < 0 ? `(${b})` : `${b}`;
          pool.push({ question: `${fmtA} × ${fmtB} = ___`, answer: a * b });
        }
      }
    } else if (op === 'division') {
      for (let divisor = 1; divisor <= r; divisor++) {
        for (let quotient = 1; quotient <= r; quotient++) {
          const product = divisor * quotient;
          // pos ÷ neg
          pool.push({ question: `${product} ÷ (${-divisor}) = ___`, answer: -quotient });
          // neg ÷ pos
          pool.push({ question: `(${-product}) ÷ ${divisor} = ___`, answer: -quotient });
          // neg ÷ neg
          pool.push({ question: `(${-product}) ÷ (${-divisor}) = ___`, answer: quotient });
        }
      }
    }
  }
  return shuffle(pool);
}

function genReverseTT(config: ReverseTTConfig): Question[] {
  const pool: Question[] = [];
  for (let divisor = 1; divisor <= config.range; divisor++) {
    for (let quotient = 1; quotient <= config.range; quotient++) {
      const dividend = divisor * quotient;
      pool.push({ question: `${dividend} ÷ ${divisor} = ___`, answer: quotient });
    }
  }
  return shuffle(pool);
}

function genMultiplication(config: MultiplicationConfig): Question[] {
  const pool: Question[] = [];
  for (const type of config.types) {
    for (let i = 0; i < 300; i++) {
      let a: number, b: number;
      switch (type) {
        case '2dx1d': a = randInt(10, 99);  b = randInt(2, 9);  break;
        case '2dx2d': a = randInt(10, 99);  b = randInt(10, 99); break;
        case '3dx1d': a = randInt(100, 999); b = randInt(2, 9);  break;
        case '3dx2d': a = randInt(100, 999); b = randInt(10, 99); break;
        default: continue;
      }
      pool.push({ question: `${a} × ${b} = ___`, answer: a * b });
    }
  }
  return shuffle(pool);
}

function genBusStop(config: BusStopConfig): Question[] {
  const pool: Question[] = [];
  for (const type of config.types) {
    for (let i = 0; i < 400; i++) {
      let dividend: number, divisor: number;
      if (type === '2d1d') {
        divisor = randInt(2, 9);
        const quotient = randInt(2, 9);
        dividend = divisor * quotient;
        if (dividend < 10 || dividend > 99) continue;
      } else if (type === '3d1d') {
        divisor = randInt(2, 9);
        const quotient = randInt(10, 99);
        dividend = divisor * quotient;
        if (dividend < 100 || dividend > 999) continue;
      } else { // 3d2d
        divisor = randInt(10, 99);
        const quotient = randInt(2, 9);
        dividend = divisor * quotient;
        if (dividend < 100 || dividend > 999) continue;
      }
      pool.push({ question: `${dividend} ÷ ${divisor} = ___`, answer: dividend / divisor });
    }
  }
  return shuffle(pool);
}

function genIndices(config: IndicesConfig): Question[] {
  const pool: Question[] = [];
  for (let base = 2; base <= config.baseRange; base++) {
    for (const exp of config.exponentRange) {
      const ans = Math.pow(base, exp);
      const supMap: Record<number, string> = { 2: '²', 3: '³', 4: '⁴' };
      pool.push({
        question: `${base}${supMap[exp]} = ___`,
        answer: ans,
        displayQuestion: `${base}<sup>${exp}</sup> = ___`,
      });
    }
  }
  return shuffle(pool);
}

function genPowersOfTen(config: PowersOfTenConfig): Question[] {
  const pool: Question[] = [];
  const seen = new Set<string>();
  const ops = config.operations.length ? config.operations : (['multiply'] as const);
  const powers = config.powers.length ? config.powers : ([10] as const);
  const baseTypes = config.baseTypes.length ? config.baseTypes : (['int'] as BaseType[]);
  for (let i = 0; i < 800; i++) {
    const op = pick(ops as ('multiply' | 'divide')[]);
    const power = pick(powers as (10 | 100 | 1000)[]);
    const bt = pick(baseTypes);
    let base: number;
    if (bt === 'int') base = randInt(1, 99);
    else if (bt === '1dp') base = round(randInt(1, 999) / 10, 1);
    else base = round(randInt(1, 9999) / 100, 2);
    const sym = op === 'multiply' ? '×' : '÷';
    const ans = op === 'multiply' ? round(base * power, 6) : round(base / power, 6);
    const q = `${numStr(base)} ${sym} ${power} = ___`;
    if (seen.has(q)) continue;
    seen.add(q);
    pool.push({ question: q, answer: numStr(ans) });
  }
  return shuffle(pool);
}

function genRounding(config: RoundingConfig): Question[] {
  const pool: Question[] = [];
  const seen = new Set<string>();
  const targets = config.targets.length ? config.targets : (['n10'] as RoundTarget[]);
  const labelMap: Record<RoundTarget, string> = {
    n10: 'the nearest 10',
    n100: 'the nearest 100',
    n1000: 'the nearest 1000',
    '1dp': '1 decimal place',
    '2dp': '2 decimal places',
    '1sf': '1 significant figure',
    '2sf': '2 significant figures',
  };

  // Build one candidate number + the place-value unit it rounds to.
  const makeRaw = (target: RoundTarget): { n: number; u: number } => {
    switch (target) {
      case 'n10':   return { n: randInt(11, 2999),     u: 10 };
      case 'n100':  return { n: randInt(101, 29999),   u: 100 };
      case 'n1000': return { n: randInt(1001, 299999), u: 1000 };
      case '1dp':   return { n: round(randInt(11, 9999) / 100, 2),    u: 0.1 };
      case '2dp':   return { n: round(randInt(101, 99999) / 1000, 3), u: 0.01 };
      case '1sf':
      case '2sf': {
        const sf = target === '1sf' ? 1 : 2;
        const n = round(randInt(11, 9989) / pick([1, 10, 100, 1000]), 4);
        const digits = Math.floor(Math.log10(n)) + 1; // integer-part digits (≤0 if n<1)
        const u = Math.pow(10, digits - sf);
        return { n, u };
      }
    }
  };

  for (const target of targets) {
    let count = 0;
    for (let i = 0; i < 1200 && count < 120; i++) {
      const { n, u } = makeRaw(target);
      const r = n / u;
      const floor = Math.floor(r);
      const frac = r - floor;
      const boundary = Math.abs(frac - 0.5) < 1e-9;        // exact halfway (ends in 5)
      const rounded = round(Math.round(r) * u, 6);
      const roundedUp = Math.round(r) > floor;
      const digit = Math.floor(Math.abs(n) / u) % 10;
      const cascade = roundedUp && digit === 9;             // carries into a higher place
      if (!config.edgeCases && (boundary || cascade)) continue;
      const q = `Round ${numStr(n)} to ${labelMap[target]}`;
      if (seen.has(q)) continue;
      seen.add(q);
      pool.push({ question: q, answer: numStr(rounded) });
      count++;
    }
  }
  return shuffle(pool);
}

function genPrimes(config: PrimesConfig): Question[] {
  const pool: Question[] = [];
  const seen = new Set<string>();
  const tasks = config.tasks.length ? config.tasks : (['identify'] as ('identify' | 'next')[]);
  const max = config.max;
  for (const task of tasks) {
    if (task === 'identify') {
      for (let n = 2; n <= max; n++) {
        const q = `Is ${n} prime?`;
        if (seen.has(q)) continue;
        seen.add(q);
        pool.push({ question: q, answer: isPrime(n) ? 'Yes' : 'No' });
      }
    } else {
      for (let n = 2; n < max; n++) {
        const q = `Next prime after ${n} = ___`;
        if (seen.has(q)) continue;
        seen.add(q);
        pool.push({ question: q, answer: nextPrime(n) });
      }
    }
  }
  return shuffle(pool);
}

type FdpTriple = { frac: string; dec: number; pct: number };
const FDP_COMMON: FdpTriple[] = [
  { frac: '1/2', dec: 0.5, pct: 50 },
  { frac: '1/4', dec: 0.25, pct: 25 },
  { frac: '3/4', dec: 0.75, pct: 75 },
  { frac: '1/10', dec: 0.1, pct: 10 },
  { frac: '3/10', dec: 0.3, pct: 30 },
  { frac: '7/10', dec: 0.7, pct: 70 },
  { frac: '9/10', dec: 0.9, pct: 90 },
  { frac: '1/5', dec: 0.2, pct: 20 },
  { frac: '2/5', dec: 0.4, pct: 40 },
  { frac: '3/5', dec: 0.6, pct: 60 },
  { frac: '4/5', dec: 0.8, pct: 80 },
];
const FDP_EXTENDED: FdpTriple[] = [
  { frac: '1/8', dec: 0.125, pct: 12.5 },
  { frac: '3/8', dec: 0.375, pct: 37.5 },
  { frac: '5/8', dec: 0.625, pct: 62.5 },
  { frac: '7/8', dec: 0.875, pct: 87.5 },
  { frac: '1/20', dec: 0.05, pct: 5 },
  { frac: '3/20', dec: 0.15, pct: 15 },
  { frac: '1/25', dec: 0.04, pct: 4 },
  { frac: '3/25', dec: 0.12, pct: 12 },
  { frac: '1/50', dec: 0.02, pct: 2 },
  { frac: '1/100', dec: 0.01, pct: 1 },
];

function genFdp(config: FdpConfig): Question[] {
  const pool: Question[] = [];
  const seen = new Set<string>();
  const paths = config.paths.length ? config.paths : (['fd'] as FdpPath[]);
  const complexities = config.complexities.length ? config.complexities : (['common'] as FdpComplexity[]);
  const triples = [
    ...(complexities.includes('common') ? FDP_COMMON : []),
    ...(complexities.includes('extended') ? FDP_EXTENDED : []),
  ];
  for (const t of triples) {
    for (const path of paths) {
      let q = '', answer: string | number = '';
      switch (path) {
        case 'fd': q = `${t.frac} as a decimal`;    answer = numStr(t.dec); break;
        case 'fp': q = `${t.frac} as a percentage`; answer = `${numStr(t.pct)}%`; break;
        case 'df': q = `${numStr(t.dec)} as a fraction`;   answer = t.frac; break;
        case 'dp': q = `${numStr(t.dec)} as a percentage`; answer = `${numStr(t.pct)}%`; break;
        case 'pf': q = `${numStr(t.pct)}% as a fraction`;  answer = t.frac; break;
        case 'pd': q = `${numStr(t.pct)}% as a decimal`;   answer = numStr(t.dec); break;
      }
      if (seen.has(q)) continue;
      seen.add(q);
      pool.push({ question: q, answer });
    }
  }
  return shuffle(pool);
}

type MetricUnit = { name: string; factor: number; order: number };
const METRIC_UNITS: Record<'length' | 'mass' | 'capacity', MetricUnit[]> = {
  length: [
    { name: 'mm', factor: 0.001, order: 0 },
    { name: 'cm', factor: 0.01, order: 1 },
    { name: 'm', factor: 1, order: 2 },
    { name: 'km', factor: 1000, order: 3 },
  ],
  mass: [
    { name: 'mg', factor: 0.001, order: 0 },
    { name: 'g', factor: 1, order: 1 },
    { name: 'kg', factor: 1000, order: 2 },
    { name: 't', factor: 1000000, order: 3 },
  ],
  capacity: [
    { name: 'ml', factor: 0.001, order: 0 },
    { name: 'cl', factor: 0.01, order: 1 },
    { name: 'l', factor: 1, order: 2 },
  ],
};

function genMetric(config: MetricConfig): Question[] {
  const pool: Question[] = [];
  const seen = new Set<string>();
  const cats = config.categories.length
    ? config.categories
    : (['length'] as ('length' | 'mass' | 'capacity')[]);
  const steps = config.steps.length ? config.steps : (['adjacent'] as MetricStep[]);
  const wantAdjacent = steps.includes('adjacent');
  const wantNon = steps.includes('nonadjacent');

  // Enumerate every unit pair with an allowed order gap.
  const pairs: { cat: string; small: MetricUnit; big: MetricUnit }[] = [];
  for (const cat of cats) {
    const units = METRIC_UNITS[cat];
    for (let i = 0; i < units.length; i++) {
      for (let j = i + 1; j < units.length; j++) {
        const gap = units[j].order - units[i].order;
        const ok = (gap === 1 && wantAdjacent) || (gap >= 2 && wantNon);
        if (ok) pairs.push({ cat, small: units[i], big: units[j] });
      }
    }
  }
  if (pairs.length === 0) return [];

  for (let i = 0; i < 1000 && pool.length < 400; i++) {
    const { small, big } = pick(pairs);
    const ratio = round(big.factor / small.factor, 6); // power of 10
    let from: MetricUnit, to: MetricUnit, val: number, ans: number;
    // "down" = big→small (integer); "up" = small→big (may be decimal)
    const goUp = config.decimals && Math.random() < 0.6;
    if (goUp) {
      from = small; to = big; val = randInt(1, ratio * 99); ans = round(val / ratio, 6);
    } else if (!config.decimals && Math.random() < 0.5) {
      // small→big but forced clean: val is a multiple of ratio
      from = small; to = big; const k = randInt(1, 99); val = k * ratio; ans = k;
    } else {
      from = big; to = small; val = randInt(1, 99); ans = round(val * ratio, 6);
    }
    const q = `${numStr(val)} ${from.name} = ___ ${to.name}`;
    if (seen.has(q)) continue;
    seen.add(q);
    pool.push({ question: q, answer: numStr(ans) });
  }
  return shuffle(pool);
}

// ─── BIDMAS TEMPLATES ─────────────────────────────────────────────────────────

type BidmasInstance = { q: string; display?: string; answer: number; ints: number[] };
type BidmasTmpl = { steps: 2 | 3; brackets: boolean; indices: boolean; gen: () => BidmasInstance };

const sq = (b: number) => b * b;

const BIDMAS_TEMPLATES: BidmasTmpl[] = [
  // ── 2-step, no brackets, no indices ──
  { steps: 2, brackets: false, indices: false, gen: () => {
    const a = randInt(1, 20), b = randInt(2, 9), c = randInt(2, 9);
    return { q: `${a} + ${b} × ${c}`, answer: a + b * c, ints: [b * c] }; } },
  { steps: 2, brackets: false, indices: false, gen: () => {
    const a = randInt(2, 9), b = randInt(2, 9), c = randInt(1, 20);
    return { q: `${a} × ${b} + ${c}`, answer: a * b + c, ints: [a * b] }; } },
  { steps: 2, brackets: false, indices: false, gen: () => {
    const a = randInt(2, 9), b = randInt(2, 9), c = randInt(1, 20);
    return { q: `${a} × ${b} − ${c}`, answer: a * b - c, ints: [a * b, a * b - c] }; } },
  { steps: 2, brackets: false, indices: false, gen: () => {
    const a = randInt(1, 20), b = randInt(2, 9), c = randInt(2, 9);
    return { q: `${a} − ${b} × ${c}`, answer: a - b * c, ints: [b * c, a - b * c] }; } },
  { steps: 2, brackets: false, indices: false, gen: () => {
    const c = randInt(2, 9), q2 = randInt(2, 9), a = randInt(1, 20), b = c * q2;
    return { q: `${a} + ${b} ÷ ${c}`, answer: a + q2, ints: [q2] }; } },
  { steps: 2, brackets: false, indices: false, gen: () => {
    const b = randInt(2, 9), q2 = randInt(2, 9), c = randInt(1, 12), dividend = b * q2;
    return { q: `${dividend} ÷ ${b} + ${c}`, answer: q2 + c, ints: [q2] }; } },

  // ── 2-step, brackets ──
  { steps: 2, brackets: true, indices: false, gen: () => {
    const a = randInt(2, 12), b = randInt(2, 12), c = randInt(2, 9);
    return { q: `(${a} + ${b}) × ${c}`, answer: (a + b) * c, ints: [a + b] }; } },
  { steps: 2, brackets: true, indices: false, gen: () => {
    const a = randInt(2, 15), b = randInt(1, 14), c = randInt(2, 9);
    return { q: `(${a} − ${b}) × ${c}`, answer: (a - b) * c, ints: [a - b, (a - b) * c] }; } },
  { steps: 2, brackets: true, indices: false, gen: () => {
    const a = randInt(2, 12), b = randInt(2, 12), c = randInt(2, 9);
    return { q: `${c} × (${a} + ${b})`, answer: c * (a + b), ints: [a + b] }; } },
  { steps: 2, brackets: true, indices: false, gen: () => {
    const c = randInt(2, 6), q2 = randInt(2, 9), s = c * q2, a = randInt(1, s - 1), b = s - a;
    return { q: `(${a} + ${b}) ÷ ${c}`, answer: q2, ints: [s, q2] }; } },

  // ── 2-step, indices ──
  { steps: 2, brackets: false, indices: true, gen: () => {
    const a = randInt(1, 30), b = randInt(2, 9);
    return { q: `${a} + ${b}²`, display: `${a} + ${b}<sup>2</sup>`, answer: a + sq(b), ints: [sq(b)] }; } },
  { steps: 2, brackets: false, indices: true, gen: () => {
    const a = randInt(20, 90), b = randInt(2, 9);
    return { q: `${a} − ${b}²`, display: `${a} − ${b}<sup>2</sup>`, answer: a - sq(b), ints: [sq(b), a - sq(b)] }; } },
  { steps: 2, brackets: false, indices: true, gen: () => {
    const b = randInt(2, 9), c = randInt(1, 30);
    return { q: `${b}² + ${c}`, display: `${b}<sup>2</sup> + ${c}`, answer: sq(b) + c, ints: [sq(b)] }; } },
  { steps: 2, brackets: false, indices: true, gen: () => {
    const a = randInt(2, 5), b = randInt(2, 6);
    return { q: `${a} × ${b}²`, display: `${a} × ${b}<sup>2</sup>`, answer: a * sq(b), ints: [sq(b)] }; } },

  // ── 3-step, no brackets, no indices ──
  { steps: 3, brackets: false, indices: false, gen: () => {
    const a = randInt(1, 20), b = randInt(2, 9), c = randInt(2, 9), d = randInt(1, 20);
    return { q: `${a} + ${b} × ${c} − ${d}`, answer: a + b * c - d, ints: [b * c, a + b * c, a + b * c - d] }; } },
  { steps: 3, brackets: false, indices: false, gen: () => {
    const a = randInt(2, 9), b = randInt(2, 9), c = randInt(2, 9), d = randInt(2, 9);
    return { q: `${a} × ${b} + ${c} × ${d}`, answer: a * b + c * d, ints: [a * b, c * d] }; } },
  { steps: 3, brackets: false, indices: false, gen: () => {
    const a = randInt(2, 9), b = randInt(2, 9), c = randInt(2, 9), d = randInt(2, 9);
    return { q: `${a} × ${b} − ${c} × ${d}`, answer: a * b - c * d, ints: [a * b, c * d, a * b - c * d] }; } },
  { steps: 3, brackets: false, indices: false, gen: () => {
    const a = randInt(2, 9), b = randInt(2, 9), c = randInt(1, 15), d = randInt(1, 15);
    return { q: `${a} × ${b} + ${c} − ${d}`, answer: a * b + c - d, ints: [a * b, a * b + c, a * b + c - d] }; } },

  // ── 3-step, brackets ──
  { steps: 3, brackets: true, indices: false, gen: () => {
    const a = randInt(2, 12), b = randInt(2, 12), c = randInt(2, 9), d = randInt(1, 20);
    return { q: `(${a} + ${b}) × ${c} − ${d}`, answer: (a + b) * c - d, ints: [a + b, (a + b) * c, (a + b) * c - d] }; } },
  { steps: 3, brackets: true, indices: false, gen: () => {
    const a = randInt(2, 12), b = randInt(2, 12), c = randInt(2, 9), d = randInt(1, 20);
    return { q: `(${a} + ${b}) × ${c} + ${d}`, answer: (a + b) * c + d, ints: [a + b, (a + b) * c] }; } },
  { steps: 3, brackets: true, indices: false, gen: () => {
    const a = randInt(2, 15), b = randInt(1, 14), c = randInt(2, 9), d = randInt(1, 20);
    return { q: `(${a} − ${b}) × ${c} + ${d}`, answer: (a - b) * c + d, ints: [a - b, (a - b) * c] }; } },
  { steps: 3, brackets: true, indices: false, gen: () => {
    const a = randInt(2, 9), b = randInt(2, 12), c = randInt(2, 12), d = randInt(1, 20);
    return { q: `${a} × (${b} + ${c}) − ${d}`, answer: a * (b + c) - d, ints: [b + c, a * (b + c), a * (b + c) - d] }; } },

  // ── 3-step, indices ──
  { steps: 3, brackets: false, indices: true, gen: () => {
    const a = randInt(1, 20), b = randInt(2, 9), c = randInt(1, 20);
    return { q: `${a} + ${b}² − ${c}`, display: `${a} + ${b}<sup>2</sup> − ${c}`, answer: a + sq(b) - c, ints: [sq(b), a + sq(b), a + sq(b) - c] }; } },
  { steps: 3, brackets: false, indices: true, gen: () => {
    const a = randInt(2, 4), b = randInt(2, 6), c = randInt(1, 20);
    return { q: `${a} × ${b}² + ${c}`, display: `${a} × ${b}<sup>2</sup> + ${c}`, answer: a * sq(b) + c, ints: [sq(b), a * sq(b)] }; } },
  { steps: 3, brackets: false, indices: true, gen: () => {
    const b = randInt(2, 7), c = randInt(2, 9), d = randInt(2, 9);
    return { q: `${b}² + ${c} × ${d}`, display: `${b}<sup>2</sup> + ${c} × ${d}`, answer: sq(b) + c * d, ints: [sq(b), c * d] }; } },

  // ── 3-step, brackets + indices ──
  { steps: 3, brackets: true, indices: true, gen: () => {
    const a = randInt(1, 8), b = randInt(1, 8), c = randInt(1, 30);
    return { q: `(${a} + ${b})² − ${c}`, display: `(${a} + ${b})<sup>2</sup> − ${c}`, answer: sq(a + b) - c, ints: [a + b, sq(a + b), sq(a + b) - c] }; } },
  { steps: 3, brackets: true, indices: true, gen: () => {
    const a = randInt(1, 8), b = randInt(1, 8), c = randInt(1, 30);
    return { q: `(${a} + ${b})² + ${c}`, display: `(${a} + ${b})<sup>2</sup> + ${c}`, answer: sq(a + b) + c, ints: [a + b, sq(a + b)] }; } },
];

function genBidmas(config: BidmasConfig): Question[] {
  const pool: Question[] = [];
  const seen = new Set<string>();
  const steps = config.steps.length ? config.steps : ([2] as (2 | 3)[]);
  const eligible = BIDMAS_TEMPLATES.filter(t =>
    steps.includes(t.steps) &&
    (!t.brackets || config.brackets) &&
    (!t.indices || config.indices));
  if (eligible.length === 0) return [];
  for (let i = 0; i < 2500 && pool.length < 400; i++) {
    const inst = pick(eligible).gen();
    if (!config.allowNegatives && (inst.answer < 0 || inst.ints.some(x => x < 0))) continue;
    const q = `${inst.q} = ___`;
    if (seen.has(q)) continue;
    seen.add(q);
    pool.push({
      question: q,
      answer: inst.answer,
      displayQuestion: inst.display ? `${inst.display} = ___` : undefined,
    });
  }
  return shuffle(pool);
}

// ─── FRACTION SKILLS ──────────────────────────────────────────────────────────
// Design constraints (from the spec):
//   • Every multiplication a student must do stays within the 12×12 tables — all
//     denominators are ≤ 12, so common denominators, cross-multiplications and
//     conversions only ever use a×b facts with a, b ≤ 12.
//   • Operands are always proper fractions (in lowest terms) or integers — never
//     mixed numbers. Answers are always fully simplified; the `mixed` option shows
//     an improper answer as a mixed number instead.

function fgcd(a: number, b: number): number { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; }
function flcm(a: number, b: number): number { return (a * b) / fgcd(a, b); }

// A stacked fraction as inline HTML. Inline styles + currentColor mean it renders
// identically in the React preview and the print document, inheriting the text
// colour (black in questions, green in the answer key).
function fracSpan(n: number | string, d: number | string): string {
  return '<span style="display:inline-block;vertical-align:middle;text-align:center;margin:0 0.12em;">'
    + `<span style="display:block;border-bottom:0.08em solid currentColor;padding:0 0.15em;line-height:1.15;">${n}</span>`
    + `<span style="display:block;padding:0 0.15em;line-height:1.15;">${d}</span>`
    + '</span>';
}

type FracValue = { plain: string; html: string };

// Format a raw num/den result, fully simplified, as an improper fraction or (when
// mixed) a mixed number. Whole numbers collapse to an integer.
function formatFrac(num: number, den: number, mixed: boolean): FracValue {
  const g = fgcd(num, den);
  let n = num / g; const d = den / g;
  const sign = n < 0 ? '-' : '';
  n = Math.abs(n);
  if (d === 1) return { plain: `${sign}${n}`, html: `${sign}${n}` };
  if (mixed && n >= d) {
    const whole = Math.floor(n / d);
    const rem = n - whole * d;
    if (rem === 0) return { plain: `${sign}${whole}`, html: `${sign}${whole}` };
    return { plain: `${sign}${whole} ${rem}/${d}`, html: `${sign}${whole}&nbsp;${fracSpan(rem, d)}` };
  }
  return { plain: `${sign}${n}/${d}`, html: `${sign}${fracSpan(n, d)}` };
}

// A proper-fraction operand in lowest terms with the given denominator.
function properNumerator(d: number): number {
  const cands: number[] = [];
  for (let n = 1; n < d; n++) if (fgcd(n, d) === 1) cands.push(n);
  return pick(cands);
}
function fracOperand(n: number, d: number): FracValue {
  return { plain: `${n}/${d}`, html: fracSpan(n, d) };
}

function genFracAddSub(config: FracAddSubConfig, op: 'add' | 'sub'): Question[] {
  const pool: Question[] = [];
  const seen = new Set<string>();
  const types = config.denomTypes.length ? config.denomTypes : (['common'] as FracDenomType[]);
  const sym = op === 'add' ? '+' : '−';

  // Denominator pairs [d1, d2] allowed by the chosen styles (denominators ≤ 12).
  const pairKey = new Set<string>();
  const pairs: [number, number][] = [];
  const addPair = (x: number, y: number) => { const k = `${x},${y}`; if (!pairKey.has(k)) { pairKey.add(k); pairs.push([x, y]); } };
  for (const t of types) {
    for (let a = 2; a <= 12; a++) for (let b = 2; b <= 12; b++) {
      if (t === 'common' && a === b) addPair(a, b);
      else if (t === 'multiple' && a !== b && (b % a === 0 || a % b === 0)) addPair(a, b);
      else if (t === 'lcm' && a !== b && b % a !== 0 && a % b !== 0) addPair(a, b);
    }
  }
  if (pairs.length === 0) return [];

  for (let i = 0; i < 3000 && pool.length < 250; i++) {
    const [d1, d2] = pick(pairs);
    const L = flcm(d1, d2);
    const m1 = L / d1, m2 = L / d2;
    const a = properNumerator(d1);
    const b = properNumerator(d2);
    let resNum: number;
    if (op === 'add') resNum = a * m1 + b * m2;
    else {
      if (a * m1 <= b * m2) continue; // keep the answer strictly positive
      resNum = a * m1 - b * m2;
    }
    const f1 = fracOperand(a, d1), f2 = fracOperand(b, d2);
    const ans = formatFrac(resNum, L, config.mixed);
    const plain = `${f1.plain} ${sym} ${f2.plain} = ___`;
    if (seen.has(plain)) continue;
    seen.add(plain);
    pool.push({ question: plain, displayQuestion: `${f1.html} ${sym} ${f2.html} = ___`, answer: ans.plain, displayAnswer: ans.html });
  }
  return shuffle(pool);
}

function genFracMul(config: FracMulConfig): Question[] {
  const pool: Question[] = [];
  const seen = new Set<string>();
  const types = config.types.length ? config.types : (['fxi'] as FracMulType[]);
  for (let i = 0; i < 3000 && pool.length < 250; i++) {
    const t = pick(types);
    let plain = '', disp = '', num = 0, den = 1;
    if (t === 'fxi') {
      const b = randInt(2, 12), a = properNumerator(b), c = randInt(2, 12);
      num = a * c; den = b;
      const f = fracOperand(a, b);
      plain = `${f.plain} × ${c} = ___`; disp = `${f.html} × ${c} = ___`;
    } else {
      const b = randInt(2, 12), d = randInt(2, 12);
      const a = properNumerator(b), c = properNumerator(d);
      num = a * c; den = b * d;
      const f1 = fracOperand(a, b), f2 = fracOperand(c, d);
      plain = `${f1.plain} × ${f2.plain} = ___`; disp = `${f1.html} × ${f2.html} = ___`;
    }
    if (seen.has(plain)) continue;
    seen.add(plain);
    const ans = formatFrac(num, den, config.mixed);
    pool.push({ question: plain, displayQuestion: disp, answer: ans.plain, displayAnswer: ans.html });
  }
  return shuffle(pool);
}

function genFracDiv(config: FracDivConfig): Question[] {
  const pool: Question[] = [];
  const seen = new Set<string>();
  const types = config.types.length ? config.types : (['fdi'] as FracDivType[]);
  for (let i = 0; i < 3000 && pool.length < 250; i++) {
    const t = pick(types);
    let plain = '', disp = '', num = 0, den = 1;
    if (t === 'fdi') { // fraction ÷ integer
      const b = randInt(2, 12), a = properNumerator(b), c = randInt(2, 12);
      num = a; den = b * c;
      const f = fracOperand(a, b);
      plain = `${f.plain} ÷ ${c} = ___`; disp = `${f.html} ÷ ${c} = ___`;
    } else if (t === 'idf') { // integer ÷ fraction
      const b = randInt(2, 12), a = properNumerator(b), c = randInt(2, 12);
      num = c * b; den = a;
      const f = fracOperand(a, b);
      plain = `${c} ÷ ${f.plain} = ___`; disp = `${c} ÷ ${f.html} = ___`;
    } else { // fraction ÷ fraction
      const b = randInt(2, 12), d = randInt(2, 12);
      const a = properNumerator(b), c = properNumerator(d);
      num = a * d; den = b * c;
      const f1 = fracOperand(a, b), f2 = fracOperand(c, d);
      plain = `${f1.plain} ÷ ${f2.plain} = ___`; disp = `${f1.html} ÷ ${f2.html} = ___`;
    }
    if (seen.has(plain)) continue;
    seen.add(plain);
    const ans = formatFrac(num, den, config.mixed);
    pool.push({ question: plain, displayQuestion: disp, answer: ans.plain, displayAnswer: ans.html });
  }
  return shuffle(pool);
}


// ─── PDF PRINT ────────────────────────────────────────────────────────────────

function handlePrint(allPages: Question[][]) {
  const FONT_PX   = 13;
  const PAD_MM    = 1.2;
  const MARGIN_MM = 12;
  const HEADER_MM = 14;
  const GAP_MM    = 1.2;
  const PAGE_H_MM = 297 - MARGIN_MM * 2;
  const PAGE_W_MM = 210 - MARGIN_MM * 2;
  const usableH   = PAGE_H_MM - HEADER_MM;
  const cols      = 3;
  const cellW_MM  = (PAGE_W_MM - GAP_MM * 2) / 3;
  const totalSheets = allPages.length;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // Build per-sheet data
  const sheetsData = allPages.map((questions, sheetIdx) => {
    const totalQ = questions.length;

    const qHtml = (idx: number, showAnswer: boolean): string => {
      const q = questions[idx];
      const ans = q.displayAnswer || String(q.answer);
      const display = q.displayQuestion || q.question;
      if (showAnswer) {
        return `<div class="qbody qbody-ans"><div class="q-text">${display}</div><div class="q-ans">${ans}</div></div>`;
      }
      return `<div class="qbody">${display}</div>`;
    };

    return {
      totalQ,
      sheetIdx,
      probeHtml: questions.map((_, i) => `<div class="q-inner" id="probe-${sheetIdx}-${i}">${qHtml(i, true)}</div>`).join(''),
      allQ:    questions.map((_, i) => qHtml(i, false)),
      allQAns: questions.map((_, i) => qHtml(i, true)),
    };
  });

  const allProbeHtml = sheetsData.map(s => s.probeHtml).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Maths Skills — Worksheet</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  @page { size:A4; margin:${MARGIN_MM}mm; }
  body { font-family:"Segoe UI",Arial,sans-serif; background:#fff; }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
  .page { width:${PAGE_W_MM}mm; height:${PAGE_H_MM}mm; overflow:hidden; page-break-after:always; }
  .page:last-child { page-break-after:auto; }
  .page-header {
    display:flex; justify-content:space-between; align-items:baseline;
    border-bottom:0.4mm solid #1e3a8a; padding-bottom:1.5mm; margin-bottom:2mm;
  }
  .page-header h1 { font-size:5mm; font-weight:700; color:#1e3a8a; }
  .page-header .meta { font-size:3mm; color:#6b7280; }
  .grid { display:grid; gap:${GAP_MM}mm; }
  .cell {
    border:0.3mm solid #000; border-radius:3mm;
    overflow:hidden; display:flex; align-items:stretch; justify-content:flex-start;
  }
  #probe {
    position:fixed; left:-9999px; top:0; visibility:hidden;
    font-family:"Segoe UI",Arial,sans-serif; font-size:${FONT_PX}px; line-height:1.4;
    width:${cellW_MM}mm;
  }
  .q-inner { width:100%; display:flex; flex-direction:column; flex:1; }
  .qbody {
    padding:${PAD_MM}mm; text-align:center; flex:1;
    font-size:var(--qfs, ${FONT_PX}px); line-height:1.4;
  }
  .qbody-ans {
    display:flex; flex-direction:column; justify-content:space-between; align-items:center;
  }
  .q-text { text-align:center; width:100%; }
  .q-ans {
    font-size:var(--afs, ${Math.round(FONT_PX * 1.6)}px); font-weight:700; color:#059669;
    text-align:center; width:100%; padding-top:${PAD_MM}mm;
  }
</style>
</head>
<body>
<div id="probe">${allProbeHtml}</div>
<div id="pages"></div>
<script>
document.addEventListener("DOMContentLoaded", function() {
  var pxPerMm   = 3.7795;
  var PAD_MM    = ${PAD_MM};
  var GAP_MM    = ${GAP_MM};
  var usableH   = ${usableH};
  var PAGE_W_MM = ${PAGE_W_MM};
  var cols      = ${cols};
  var dateStr   = "${dateStr}";
  var totalSheets = ${totalSheets};
  var sheetsData  = ${JSON.stringify(sheetsData.map(s => ({ totalQ: s.totalQ, sheetIdx: s.sheetIdx, allQ: s.allQ, allQAns: s.allQAns })))};

  var rowHeights = [];
  for (var r = 1; r <= 15; r++) {
    rowHeights.push((usableH - GAP_MM * (r - 1)) / r);
  }

  // Measure tallest question (with its answer) across ALL sheets. scrollHeight
  // already includes the cell's internal padding, so only a small margin for
  // the cell border/rounding is added.
  var probe = document.getElementById("probe");
  var maxH_px = 0;
  probe.querySelectorAll(".q-inner").forEach(function(el) {
    if (el.scrollHeight > maxH_px) maxH_px = el.scrollHeight;
  });
  var maxH_mm = maxH_px / pxPerMm;
  var needed_mm = maxH_mm + 2;

  var maxQ = 0;
  sheetsData.forEach(function(s) { if (s.totalQ > maxQ) maxQ = s.totalQ; });

  // Always use enough rows to fit every question on the page — never drop any.
  var rowsPerPage = Math.max(1, Math.min(rowHeights.length, Math.ceil(maxQ / cols)));
  var chosenH_mm = rowHeights[rowsPerPage - 1];

  // If the tallest question is taller than the chosen cell, scale the question
  // (and answer) font down to fit rather than overflowing or dropping questions.
  var fontScale = needed_mm > chosenH_mm ? Math.max(0.5, chosenH_mm / needed_mm) : 1;
  var qFs = Math.round(${FONT_PX} * fontScale * 10) / 10;
  var aFs = Math.round(${FONT_PX} * 1.6 * fontScale * 10) / 10;

  function cW() { return (PAGE_W_MM - GAP_MM * (cols - 1)) / cols; }

  function buildCell(allQ, allQAns, idx, showAnswer, h) {
    var inner = showAnswer ? allQAns[idx] : allQ[idx];
    return '<div class="cell" style="width:' + cW() + 'mm;height:' + h + 'mm;">' + inner + '</div>';
  }

  function buildGrid(allQ, allQAns, totalQ, showAnswer, h) {
    var pageCapacity = rowsPerPage * cols;
    var rows = Math.ceil(Math.min(totalQ, pageCapacity) / cols);
    var cells = '';
    for (var i = 0; i < Math.min(totalQ, pageCapacity); i++) {
      cells += buildCell(allQ, allQAns, i, showAnswer, h);
    }
    return '<div class="grid" style="grid-template-columns:repeat(' + cols + ',' + cW() + 'mm);grid-template-rows:repeat(' + rows + ',' + h + 'mm);">' + cells + '</div>';
  }

  function buildSheetPage(sheet, showAnswer) {
    var weekLabel = totalSheets > 1 ? ' · Week ' + (sheet.sheetIdx + 1) + ' of ' + totalSheets : '';
    var lbl = sheet.totalQ + ' questions' + weekLabel;
    var title = showAnswer ? 'Maths Skills — Answers' : 'Maths Skills Worksheet';
    return '<div class="page">'
      + '<div class="page-header"><h1>' + title + '</h1><div class="meta">' + dateStr + lbl + '</div></div>'
      + buildGrid(sheet.allQ, sheet.allQAns, sheet.totalQ, showAnswer, chosenH_mm)
      + '</div>';
  }

  // All question pages first, then all answer pages
  var html = '';
  sheetsData.forEach(function(s) { html += buildSheetPage(s, false); });
  sheetsData.forEach(function(s) { html += buildSheetPage(s, true); });

  var pagesEl = document.getElementById("pages");
  pagesEl.innerHTML = html;
  pagesEl.style.setProperty("--qfs", qFs + "px");
  pagesEl.style.setProperty("--afs", aFs + "px");
  probe.remove();
  setTimeout(function() { window.print(); }, 300);
});
</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) { alert('Please allow popups to use the PDF export.'); return; }
  win.document.write(html);
  win.document.close();
}


// ─── SKILL METADATA ───────────────────────────────────────────────────────────

const SKILL_META: Record<SkillId, { label: string; description: string }> = {
  numberBonds:    { label: 'Number Bonds',        description: 'Pairs that sum to a target' },
  timesTables:    { label: 'Times Tables',         description: 'Multiplication facts' },
  reverseTT:      { label: 'Reverse Times Tables', description: 'Division from times table facts' },
  addition:       { label: 'Addition',             description: 'Column/mental addition' },
  subtraction:    { label: 'Subtraction',          description: 'Column/mental subtraction' },
  multiplication: { label: 'Multiplication',       description: 'Multi-digit multiplication' },
  negatives:      { label: 'Negatives',            description: 'Operations with negative numbers' },
  busStop:        { label: 'Division',             description: 'Long division, integer answers' },
  indices:        { label: 'Indices',              description: 'Powers and exponents' },
  powersOfTen:    { label: 'Powers of 10',         description: 'Multiply/divide by 10, 100, 1000' },
  rounding:       { label: 'Rounding',             description: 'Decimal places, sig figs, nearest 10' },
  primes:         { label: 'Primes',               description: 'Identify primes and find the next prime' },
  fdp:            { label: 'FDP Conversion',       description: 'Fractions, decimals and percentages' },
  metric:         { label: 'Metric Conversions',   description: 'Length, mass and capacity units' },
  bidmas:         { label: 'BIDMAS',               description: 'Order of operations' },
  fracAdd:        { label: 'Fraction Addition',        description: 'Common, multiple or LCM denominators' },
  fracSub:        { label: 'Fraction Subtraction',     description: 'Common, multiple or LCM denominators' },
  fracMul:        { label: 'Fraction Multiplication',  description: 'Fraction × integer or fraction × fraction' },
  fracDiv:        { label: 'Fraction Division',        description: 'Fraction ÷ integer, integer ÷ fraction, fraction ÷ fraction' },
};

const ALL_SKILLS: SkillId[] = ['numberBonds', 'timesTables', 'reverseTT', 'addition', 'subtraction', 'multiplication', 'busStop', 'negatives', 'indices', 'powersOfTen', 'rounding', 'primes', 'fdp', 'metric', 'bidmas', 'fracAdd', 'fracSub', 'fracMul', 'fracDiv'];

// Skills grouped by number sub-topic (all skills are number skills — these are
// teaching themes, not the app's top-level categories).
const SKILL_GROUPS: { label: string; skills: SkillId[] }[] = [
  { label: 'Number Facts',                 skills: ['numberBonds', 'timesTables', 'reverseTT'] },
  { label: 'Written Methods',              skills: ['addition', 'subtraction', 'multiplication', 'busStop', 'negatives'] },
  { label: 'Place Value & Rounding',       skills: ['powersOfTen', 'rounding'] },
  { label: 'Number Properties',            skills: ['primes', 'indices'] },
  { label: 'Fraction Arithmetic',          skills: ['fracAdd', 'fracSub', 'fracMul', 'fracDiv'] },
  { label: 'Fractions, Decimals & Measures', skills: ['fdp', 'metric'] },
  { label: 'Order of Operations',          skills: ['bidmas'] },
];

// ─── DEFAULT CONFIGS ──────────────────────────────────────────────────────────

const defaultConfigs: SkillConfigs = {
  numberBonds:    { targets: [10] },
  timesTables:    { range: 12, specificTables: [], suppressDuplicates: false },
  reverseTT:      { range: 12 },
  addition:       { digitBands: [2], allowCarrying: true },
  subtraction:    { digitBands: [2], requireExchange: false },
  multiplication: { types: ['2dx1d'] },
  negatives:      { operations: ['addition', 'subtraction'], range: 10 },
  busStop:        { types: ['2d1d'] },
  indices:        { baseRange: 10, exponentRange: [2, 3] },
  powersOfTen:    { operations: ['multiply'], powers: [10, 100], baseTypes: ['int'] },
  rounding:       { targets: ['n10', 'n100'], edgeCases: false },
  primes:         { tasks: ['identify'], max: 50 },
  fdp:            { paths: ['fd', 'dp'], complexities: ['common'] },
  metric:         { categories: ['length'], steps: ['adjacent'], decimals: false },
  bidmas:         { steps: [2], brackets: true, indices: false, allowNegatives: false },
  fracAdd:        { denomTypes: ['common'], mixed: false },
  fracSub:        { denomTypes: ['common'], mixed: false },
  fracMul:        { types: ['fxi'], mixed: false },
  fracDiv:        { types: ['fdi'], mixed: false },
};

const DEFAULT_SKILL_COUNTS: Record<SkillId, number> = {
  numberBonds: 5, timesTables: 5, reverseTT: 5, addition: 5, subtraction: 5,
  multiplication: 5, negatives: 5, busStop: 5, indices: 5,
  powersOfTen: 5, rounding: 5, primes: 5, fdp: 5, metric: 5, bidmas: 5,
  fracAdd: 5, fracSub: 5, fracMul: 5, fracDiv: 5,
};

// ─── SETUP PERSISTENCE ────────────────────────────────────────────────────────
// The whole setup is mirrored to localStorage so it survives a page refresh.

const STORAGE_KEY = 'fsGenerator.setup.v1';

type SavedSetup = {
  enabledSkills: SkillId[];
  skillCounts: Record<SkillId, number>;
  configs: SkillConfigs;
  maxQuestions: number;
  numPages: number;
  grouped: boolean;
};

function loadSetup(): Partial<SavedSetup> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<SavedSetup>) : {};
  } catch {
    return {};
  }
}

// Merge saved configs over the current defaults, so a save made before a skill
// (or option) existed still loads cleanly with the new keys filled in.
function mergeConfigs(saved?: Partial<SkillConfigs>): SkillConfigs {
  const out = {} as SkillConfigs;
  (Object.keys(defaultConfigs) as SkillId[]).forEach(k => {
    (out as any)[k] = { ...(defaultConfigs as any)[k], ...((saved as any)?.[k] ?? {}) };
  });
  return out;
}






export default function MathsSkillsGenerator() {
  const [saved] = useState<Partial<SavedSetup>>(loadSetup);
  const [enabledSkills, setEnabledSkills] = useState<SkillId[]>(
    () => (saved.enabledSkills ?? []).filter(s => ALL_SKILLS.includes(s)),
  );
  const [skillCounts, setSkillCounts] = useState<Record<SkillId, number>>(
    () => ({ ...DEFAULT_SKILL_COUNTS, ...(saved.skillCounts ?? {}) }),
  );
  const [configs, setConfigs] = useState<SkillConfigs>(() => mergeConfigs(saved.configs));
  const [maxQuestions, setMaxQuestions] = useState<number>(saved.maxQuestions ?? 30);
  const [numPages, setNumPages] = useState<number>(saved.numPages ?? 1);
  const [grouped, setGrouped] = useState<boolean>(saved.grouped ?? false);
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string>('');
  const [expandedSkill, setExpandedSkill] = useState<SkillId | null>(null);

  // Mirror the setup to localStorage whenever it changes.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        enabledSkills, skillCounts, configs, maxQuestions, numPages, grouped,
      }));
    } catch { /* storage unavailable — ignore */ }
  }, [enabledSkills, skillCounts, configs, maxQuestions, numPages, grouped]);

  const total = enabledSkills.reduce((sum, s) => sum + skillCounts[s], 0);
  const overBudget = total > maxQuestions;

  const clearAll = () => {
    setEnabledSkills([]);
    setExpandedSkill(null);
    setPreviewQuestions([]);
    setError('');
  };

  const toggleSkill = (skill: SkillId) => {
    setEnabledSkills(prev => {
      if (prev.includes(skill)) {
        if (expandedSkill === skill) setExpandedSkill(null);
        return prev.filter(s => s !== skill);
      }
      // When enabling, auto-assign remaining budget (min 1, max 5 or remaining)
      const budget = Math.max(1, Math.min(5, maxQuestions - prev.reduce((s, sk) => s + skillCounts[sk], 0)));
      setSkillCounts(c => ({ ...c, [skill]: budget }));
      return [...prev, skill];
    });
    setError('');
  };

  const adjustCount = (skill: SkillId, delta: number) => {
    setSkillCounts(prev => {
      const next = prev[skill] + delta;
      if (next < 1) return prev;
      if (delta > 0 && total >= maxQuestions) return prev;
      return { ...prev, [skill]: next };
    });
  };

  const updateConfig = <K extends SkillId>(skill: K, patch: Partial<SkillConfigs[K]>) => {
    setConfigs(prev => ({ ...prev, [skill]: { ...prev[skill], ...patch } }));
  };

  const getPool = (skill: SkillId): Question[] => {
    let pool: Question[] = [];
    switch (skill) {
      case 'numberBonds':    pool = genNumberBonds(configs.numberBonds); break;
      case 'timesTables':    pool = genTimesTables(configs.timesTables); break;
      case 'reverseTT':      pool = genReverseTT(configs.reverseTT); break;
      case 'addition':       pool = genAddition(configs.addition); break;
      case 'subtraction':    pool = genSubtraction(configs.subtraction); break;
      case 'multiplication': pool = genMultiplication(configs.multiplication); break;
      case 'negatives':      pool = genNegatives(configs.negatives); break;
      case 'busStop':        pool = genBusStop(configs.busStop); break;
      case 'indices':        pool = genIndices(configs.indices); break;
      case 'powersOfTen':    pool = genPowersOfTen(configs.powersOfTen); break;
      case 'rounding':       pool = genRounding(configs.rounding); break;
      case 'primes':         pool = genPrimes(configs.primes); break;
      case 'fdp':            pool = genFdp(configs.fdp); break;
      case 'metric':         pool = genMetric(configs.metric); break;
      case 'bidmas':         pool = genBidmas(configs.bidmas); break;
      case 'fracAdd':        pool = genFracAddSub(configs.fracAdd, 'add'); break;
      case 'fracSub':        pool = genFracAddSub(configs.fracSub, 'sub'); break;
      case 'fracMul':        pool = genFracMul(configs.fracMul); break;
      case 'fracDiv':        pool = genFracDiv(configs.fracDiv); break;
    }
    return pool.map(q => ({ ...q, skill }));
  };

  const buildQuestions = () => {
    const allQs: Question[] = [];
    for (const skill of enabledSkills) {
      allQs.push(...getPool(skill).slice(0, skillCounts[skill]));
    }
    return grouped ? allQs : shuffle(allQs);
  };

  const regenQuestion = (idx: number) => {
    const skill = previewQuestions[idx].skill;
    if (!skill) return;
    // Get a fresh pool and pick one that isn't already shown
    const existing = new Set(previewQuestions.map(q => q.question));
    const pool = getPool(skill).filter(q => !existing.has(q.question));
    if (pool.length === 0) return; // pool exhausted, nothing to swap
    const replacement = pool[Math.floor(Math.random() * pool.length)];
    setPreviewQuestions(prev => prev.map((q, i) => i === idx ? replacement : q));
  };

  const handleGeneratePreview = () => {
    if (enabledSkills.length === 0) { setError('Please enable at least one skill.'); return; }
    const qs = buildQuestions();
    if (qs.length === 0) { setError('No questions could be generated with the current settings.'); return; }
    setPreviewQuestions(qs);
    setError('');
  };

  const handleGeneratePDF = () => {
    if (enabledSkills.length === 0) { setError('Please enable at least one skill.'); return; }
    const allPageQs: Question[][] = [];
    for (let p = 0; p < numPages; p++) {
      if (p === 0 && previewQuestions.length > 0) {
        allPageQs.push(previewQuestions);
      } else {
        const qs = buildQuestions();
        if (qs.length === 0) { setError('No questions could be generated with the current settings.'); return; }
        allPageQs.push(qs);
      }
    }
    handlePrint(allPageQs);
    setError('');
  };

  // ── PILL HELPERS ─────────────────────────────────────────────────────────

  const toggleArr = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  // Multi-select pill group
  const PillMulti = <T extends string | number>({
    label, options, selected, onToggle, format,
  }: {
    label: string;
    options: T[];
    selected: T[];
    onToggle: (v: T) => void;
    format?: (v: T) => string;
  }) => {
    return (
      <div className="mb-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{label}</p>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {options.map(opt => {
            const active = selected.includes(opt);
            return (
              <button
                key={String(opt)}
                onClick={() => onToggle(opt)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
                  active
                    ? 'bg-blue-900 border-blue-900 text-white'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-900'
                }`}
              >
                {format ? format(opt) : String(opt)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Single-select pill group (radio behaviour)
  const PillSingle = <T extends string | number>({
    label, options, selected, onSelect, format,
  }: {
    label: string;
    options: T[];
    selected: T;
    onSelect: (v: T) => void;
    format?: (v: T) => string;
  }) => {
    return (
      <div className="mb-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{label}</p>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {options.map(opt => {
            const active = selected === opt;
            return (
              <button
                key={String(opt)}
                onClick={() => onSelect(opt)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
                  active
                    ? 'bg-blue-900 border-blue-900 text-white'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-900'
                }`}
              >
                {format ? format(opt) : String(opt)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Toggle pill (single boolean option)
  const PillToggle = ({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
        active
          ? 'bg-blue-900 border-blue-900 text-white'
          : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-900'
      }`}
    >
      {label}
    </button>
  );

  // ── SKILL CONFIG PANELS ──────────────────────────────────────────────────

  const renderConfig = (skill: SkillId) => {
    const c = configs;

    const panels: Record<SkillId, JSX.Element> = {
      numberBonds: (
        <PillMulti
          label="Bond targets"
          options={[10, 20, 50, 100]}
          selected={c.numberBonds.targets}
          onToggle={v => updateConfig('numberBonds', { targets: toggleArr(c.numberBonds.targets, v) })}
          format={v => `to ${v}`}
        />
      ),

      timesTables: (
        <>
          <PillSingle
            label="Range"
            options={[10, 12, 20] as const}
            selected={c.timesTables.range}
            onSelect={v => updateConfig('timesTables', { range: v as 10 | 12 | 20, specificTables: [] })}
            format={v => `Up to ${v}×${v}`}
          />
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              Specific tables <span className="normal-case font-normal">(leave blank for all)</span>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${c.timesTables.range / 2}, 36px)`, gap: '6px', justifyContent: 'center' }}>
              {Array.from({ length: c.timesTables.range }, (_, i) => i + 1).map(t => (
                <button
                  key={t}
                  onClick={() => updateConfig('timesTables', { specificTables: toggleArr(c.timesTables.specificTables, t) })}
                  className={`w-9 h-9 rounded-full text-sm font-bold border-2 transition-all ${
                    c.timesTables.specificTables.includes(t)
                      ? 'bg-blue-900 border-blue-900 text-white'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-center gap-2">
            <PillToggle
              label="Suppress duplicates"
              active={c.timesTables.suppressDuplicates}
              onToggle={() => updateConfig('timesTables', { suppressDuplicates: !c.timesTables.suppressDuplicates })}
            />
          </div>
        </>
      ),

      addition: (
        <>
          <PillMulti
            label="Digit size"
            options={[1, 2, 3] as const}
            selected={c.addition.digitBands}
            onToggle={v => updateConfig('addition', { digitBands: toggleArr(c.addition.digitBands, v as 1|2|3) })}
            format={v => `${v}-digit`}
          />
          <div className="flex justify-center gap-2">
            <PillToggle
              label="Carrying"
              active={c.addition.allowCarrying}
              onToggle={() => updateConfig('addition', { allowCarrying: !c.addition.allowCarrying })}
            />
          </div>
        </>
      ),

      subtraction: (
        <>
          <PillMulti
            label="Digit size"
            options={[1, 2, 3] as const}
            selected={c.subtraction.digitBands}
            onToggle={v => updateConfig('subtraction', { digitBands: toggleArr(c.subtraction.digitBands, v as 1|2|3) })}
            format={v => `${v}-digit`}
          />
          <div className="flex justify-center gap-2">
            <PillToggle
              label="Require exchange"
              active={c.subtraction.requireExchange}
              onToggle={() => updateConfig('subtraction', { requireExchange: !c.subtraction.requireExchange })}
            />
          </div>
        </>
      ),

      reverseTT: (
        <PillSingle
          label="Range"
          options={[10, 12, 20] as const}
          selected={c.reverseTT.range}
          onSelect={v => updateConfig('reverseTT', { range: v as 10 | 12 | 20 })}
          format={v => `Up to ${v}×${v}`}
        />
      ),

      multiplication: (
        <PillMulti
          label="Question type"
          options={['2dx1d', '2dx2d', '3dx1d', '3dx2d'] as const}
          selected={c.multiplication.types}
          onToggle={v => updateConfig('multiplication', { types: toggleArr(c.multiplication.types, v as any) })}
          format={v => v.replace('dx', '-digit × ').replace('d', '-digit')}
        />
      ),

      negatives: (
        <>
          <PillMulti
            label="Operations"
            options={['addition', 'subtraction', 'multiplication', 'division'] as const}
            selected={c.negatives.operations}
            onToggle={v => updateConfig('negatives', { operations: toggleArr(c.negatives.operations, v as any) })}
            format={v => v.charAt(0).toUpperCase() + v.slice(1)}
          />
          <PillSingle
            label="Number range"
            options={[10, 25] as const}
            selected={c.negatives.range}
            onSelect={v => updateConfig('negatives', { range: v as 10 | 25 })}
            format={v => `−${v} to ${v}`}
          />
        </>
      ),

      busStop: (
        <PillMulti
          label="Question type"
          options={['2d1d', '3d1d', '3d2d'] as const}
          selected={c.busStop.types}
          onToggle={v => updateConfig('busStop', { types: toggleArr(c.busStop.types, v as any) })}
          format={v => {
            if (v === '2d1d') return '2-digit ÷ 1-digit';
            if (v === '3d1d') return '3-digit ÷ 1-digit';
            return '3-digit ÷ 2-digit';
          }}
        />
      ),

      indices: (
        <>
          <PillSingle
            label="Base range"
            options={[10, 15] as const}
            selected={c.indices.baseRange}
            onSelect={v => updateConfig('indices', { baseRange: v as 10 | 15 })}
            format={v => `2 to ${v}`}
          />
          <PillMulti
            label="Exponents"
            options={[2, 3, 4] as const}
            selected={c.indices.exponentRange}
            onToggle={v => updateConfig('indices', { exponentRange: toggleArr(c.indices.exponentRange, v as 2|3|4) })}
            format={v => `x${['', '', '²', '³', '⁴'][v]}`}
          />
        </>
      ),

      powersOfTen: (
        <>
          <PillMulti
            label="Operations"
            options={['multiply', 'divide'] as const}
            selected={c.powersOfTen.operations}
            onToggle={v => updateConfig('powersOfTen', { operations: toggleArr(c.powersOfTen.operations, v as 'multiply' | 'divide') })}
            format={v => v === 'multiply' ? 'Multiply ×' : 'Divide ÷'}
          />
          <PillMulti
            label="Multipliers / divisors"
            options={[10, 100, 1000] as const}
            selected={c.powersOfTen.powers}
            onToggle={v => updateConfig('powersOfTen', { powers: toggleArr(c.powersOfTen.powers, v as 10 | 100 | 1000) })}
          />
          <PillMulti
            label="Base number type"
            options={['int', '1dp', '2dp'] as const}
            selected={c.powersOfTen.baseTypes}
            onToggle={v => updateConfig('powersOfTen', { baseTypes: toggleArr(c.powersOfTen.baseTypes, v as BaseType) })}
            format={v => v === 'int' ? 'Integers' : v === '1dp' ? '1 d.p.' : '2+ d.p.'}
          />
        </>
      ),

      rounding: (
        <>
          <PillMulti
            label="Target accuracy"
            options={['n10', 'n100', 'n1000', '1dp', '2dp', '1sf', '2sf'] as const}
            selected={c.rounding.targets}
            onToggle={v => updateConfig('rounding', { targets: toggleArr(c.rounding.targets, v as RoundTarget) })}
            format={v => ({ n10: 'Nearest 10', n100: 'Nearest 100', n1000: 'Nearest 1000', '1dp': '1 d.p.', '2dp': '2 d.p.', '1sf': '1 s.f.', '2sf': '2 s.f.' } as Record<RoundTarget, string>)[v]}
          />
          <div className="flex justify-center gap-2">
            <PillToggle
              label="Include edge cases"
              active={c.rounding.edgeCases}
              onToggle={() => updateConfig('rounding', { edgeCases: !c.rounding.edgeCases })}
            />
          </div>
        </>
      ),

      primes: (
        <>
          <PillMulti
            label="Task type"
            options={['identify', 'next'] as const}
            selected={c.primes.tasks}
            onToggle={v => updateConfig('primes', { tasks: toggleArr(c.primes.tasks, v as 'identify' | 'next') })}
            format={v => v === 'identify' ? 'Identify prime' : 'Next prime'}
          />
          <PillSingle
            label="Range"
            options={[20, 50, 100] as const}
            selected={c.primes.max}
            onSelect={v => updateConfig('primes', { max: v as 20 | 50 | 100 })}
            format={v => `Up to ${v}`}
          />
        </>
      ),

      fdp: (
        <>
          <PillMulti
            label="Conversion path"
            options={['fd', 'fp', 'df', 'dp', 'pf', 'pd'] as const}
            selected={c.fdp.paths}
            onToggle={v => updateConfig('fdp', { paths: toggleArr(c.fdp.paths, v as FdpPath) })}
            format={v => ({ fd: 'Frac → Dec', fp: 'Frac → %', df: 'Dec → Frac', dp: 'Dec → %', pf: '% → Frac', pd: '% → Dec' } as Record<FdpPath, string>)[v]}
          />
          <PillMulti
            label="Fraction complexity"
            options={['common', 'extended'] as const}
            selected={c.fdp.complexities}
            onToggle={v => updateConfig('fdp', { complexities: toggleArr(c.fdp.complexities, v as FdpComplexity) })}
            format={v => v === 'common' ? 'Common' : 'Extended'}
          />
        </>
      ),

      metric: (
        <>
          <PillMulti
            label="Measure category"
            options={['length', 'mass', 'capacity'] as const}
            selected={c.metric.categories}
            onToggle={v => updateConfig('metric', { categories: toggleArr(c.metric.categories, v as 'length' | 'mass' | 'capacity') })}
            format={v => v.charAt(0).toUpperCase() + v.slice(1)}
          />
          <PillMulti
            label="Conversion step"
            options={['adjacent', 'nonadjacent'] as const}
            selected={c.metric.steps}
            onToggle={v => updateConfig('metric', { steps: toggleArr(c.metric.steps, v as MetricStep) })}
            format={v => v === 'adjacent' ? 'Adjacent units' : 'Non-adjacent'}
          />
          <div className="flex justify-center gap-2">
            <PillToggle
              label="Include decimal answers"
              active={c.metric.decimals}
              onToggle={() => updateConfig('metric', { decimals: !c.metric.decimals })}
            />
          </div>
        </>
      ),

      bidmas: (
        <>
          <PillMulti
            label="Complexity"
            options={[2, 3] as const}
            selected={c.bidmas.steps}
            onToggle={v => updateConfig('bidmas', { steps: toggleArr(c.bidmas.steps, v as 2 | 3) })}
            format={v => `${v}-step`}
          />
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Operations included</p>
            <div className="flex justify-center gap-2">
              <PillToggle
                label="Brackets"
                active={c.bidmas.brackets}
                onToggle={() => updateConfig('bidmas', { brackets: !c.bidmas.brackets })}
              />
              <PillToggle
                label="Indices"
                active={c.bidmas.indices}
                onToggle={() => updateConfig('bidmas', { indices: !c.bidmas.indices })}
              />
            </div>
          </div>
          <div className="flex justify-center gap-2">
            <PillToggle
              label="Allow negative numbers"
              active={c.bidmas.allowNegatives}
              onToggle={() => updateConfig('bidmas', { allowNegatives: !c.bidmas.allowNegatives })}
            />
          </div>
        </>
      ),

      fracAdd: (
        <>
          <PillMulti
            label="Denominators"
            options={['common', 'multiple', 'lcm'] as const}
            selected={c.fracAdd.denomTypes}
            onToggle={v => updateConfig('fracAdd', { denomTypes: toggleArr(c.fracAdd.denomTypes, v as FracDenomType) })}
            format={v => ({ common: 'Common', multiple: 'Multiple', lcm: 'Find LCM' } as Record<FracDenomType, string>)[v]}
          />
          <div className="flex justify-center gap-2">
            <PillToggle
              label="Mixed number answers"
              active={c.fracAdd.mixed}
              onToggle={() => updateConfig('fracAdd', { mixed: !c.fracAdd.mixed })}
            />
          </div>
        </>
      ),

      fracSub: (
        <>
          <PillMulti
            label="Denominators"
            options={['common', 'multiple', 'lcm'] as const}
            selected={c.fracSub.denomTypes}
            onToggle={v => updateConfig('fracSub', { denomTypes: toggleArr(c.fracSub.denomTypes, v as FracDenomType) })}
            format={v => ({ common: 'Common', multiple: 'Multiple', lcm: 'Find LCM' } as Record<FracDenomType, string>)[v]}
          />
          <div className="flex justify-center gap-2">
            <PillToggle
              label="Mixed number answers"
              active={c.fracSub.mixed}
              onToggle={() => updateConfig('fracSub', { mixed: !c.fracSub.mixed })}
            />
          </div>
        </>
      ),

      fracMul: (
        <>
          <PillMulti
            label="Question type"
            options={['fxi', 'fxf'] as const}
            selected={c.fracMul.types}
            onToggle={v => updateConfig('fracMul', { types: toggleArr(c.fracMul.types, v as FracMulType) })}
            format={v => ({ fxi: 'Fraction × integer', fxf: 'Fraction × fraction' } as Record<FracMulType, string>)[v]}
          />
          <div className="flex justify-center gap-2">
            <PillToggle
              label="Mixed number answers"
              active={c.fracMul.mixed}
              onToggle={() => updateConfig('fracMul', { mixed: !c.fracMul.mixed })}
            />
          </div>
        </>
      ),

      fracDiv: (
        <>
          <PillMulti
            label="Question type"
            options={['fdi', 'idf', 'fdf'] as const}
            selected={c.fracDiv.types}
            onToggle={v => updateConfig('fracDiv', { types: toggleArr(c.fracDiv.types, v as FracDivType) })}
            format={v => ({ fdi: 'Fraction ÷ integer', idf: 'Integer ÷ fraction', fdf: 'Fraction ÷ fraction' } as Record<FracDivType, string>)[v]}
          />
          <div className="flex justify-center gap-2">
            <PillToggle
              label="Mixed number answers"
              active={c.fracDiv.mixed}
              onToggle={() => updateConfig('fracDiv', { mixed: !c.fracDiv.mixed })}
            />
          </div>
        </>
      ),
    };

    return (
      <div className="pt-4 px-1">
        {panels[skill]}
      </div>
    );
  };

  // ── RENDER ───────────────────────────────────────────────────────────────

  const canGenerate = enabledSkills.length > 0 && total > 0;

  return (
    <>
      {/* Header */}
      <div style={{ backgroundColor: '#1e3a8a' }}>
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <button onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors">
            <Home size={24} />
            <span className="font-semibold text-lg">Home</span>
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="min-h-screen p-8" style={{ backgroundColor: '#f5f3f0' }}>
        <div className="max-w-6xl mx-auto">

          <h1 className="text-5xl font-bold text-center mb-2" style={{ color: '#000000' }}>
            {TOOL_CONFIG.pageTitle}
          </h1>
          <p className="text-center text-gray-500 mb-6">Build a worksheet with intent — tap a skill to set its options and how many questions it adds.</p>

          {/* Browse (tiles) + build (controls) */}
          <div className="flex flex-col md:flex-row gap-6 mb-6 md:h-[calc(100vh-14rem)]">

            {/* LEFT — skill tiles grouped by topic; this column scrolls on its own */}
            <div className="flex-1 w-full md:min-h-0 md:overflow-y-auto md:pr-1 space-y-5">
              {SKILL_GROUPS.map(group => (
                <div key={group.label}>
                  <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">{group.label}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.skills.map(skill => {
                      const enabled = enabledSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          onClick={() => toggleSkill(skill)}
                          className={`flex items-center gap-2.5 rounded-lg border-2 px-3 py-2.5 text-left transition-all ${enabled ? 'bg-blue-900 border-blue-900 shadow-sm' : 'bg-white border-gray-200 hover:border-blue-300 shadow-sm'}`}
                        >
                          <span className={`flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0 ${enabled ? 'bg-white text-blue-900' : 'border-2 border-gray-200 text-gray-300'}`}>
                            {enabled ? <Check size={13} /> : <Plus size={12} />}
                          </span>
                          <span className={`font-bold text-sm whitespace-nowrap flex-shrink-0 ${enabled ? 'text-white' : 'text-gray-800'}`}>{SKILL_META[skill].label}</span>
                          <span className={`text-[11px] truncate min-w-0 ${enabled ? 'text-blue-200' : 'text-gray-400'}`}>{SKILL_META[skill].description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* RIGHT — your worksheet: fixed header, scrolling skill list, fixed action footer */}
            <div className="w-full md:flex-1 md:min-h-0">
              <div className="bg-white rounded-2xl shadow-lg flex flex-col md:h-full">

                {/* Header */}
                <div className="p-5 pb-3 flex-shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-gray-900">Your worksheet</h2>
                    {enabledSkills.length > 0 && (
                      <button
                        onClick={clearAll}
                        className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-red-600 transition-colors"
                        title="Remove all skills"
                      >
                        <RotateCcw size={13} /> Clear
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${overBudget ? 'bg-red-500' : 'bg-blue-900'}`}
                        style={{ width: `${Math.min(100, (total / maxQuestions) * 100)}%` }}
                      />
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${overBudget ? 'text-red-600' : 'text-gray-700'}`}>
                      {total} / {maxQuestions}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {enabledSkills.length === 0 ? 'Tap a tile to add a skill.' : `${enabledSkills.length} skill${enabledSkills.length > 1 ? 's' : ''} selected`}
                  </p>
                </div>

                {/* Scrolling body: selected skills + worksheet settings */}
                <div className="flex-1 md:min-h-0 md:overflow-y-auto px-5 py-1">
                  {enabledSkills.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8 px-4">Nothing added yet. Tap skills on the left to build your worksheet.</p>
                  ) : (
                    <div className="space-y-2">
                      {enabledSkills.map(skill => {
                        const expanded = expandedSkill === skill;
                        return (
                          <div key={skill} className={`rounded-xl border overflow-hidden transition-colors ${expanded ? 'border-blue-300' : 'border-gray-200'}`}>
                            <div className="px-3 pt-2 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="flex-1 min-w-0 truncate text-sm font-bold text-gray-900">{SKILL_META[skill].label}</span>
                                <button
                                  onClick={() => toggleSkill(skill)}
                                  title="Remove"
                                  className="w-6 h-6 flex items-center justify-center rounded text-gray-300 hover:text-red-600 hover:bg-red-50 flex-shrink-0 transition-all"
                                ><X size={15} /></button>
                              </div>
                              <div className="flex items-center justify-between mt-1.5">
                                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                                  <button
                                    onClick={() => adjustCount(skill, -1)}
                                    disabled={skillCounts[skill] <= 1}
                                    className="w-7 h-7 flex items-center justify-center rounded-md text-gray-600 hover:bg-white hover:text-blue-900 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-lg leading-none"
                                  >−</button>
                                  <span className="w-7 text-center text-sm font-bold text-gray-800 tabular-nums">{skillCounts[skill]}</span>
                                  <button
                                    onClick={() => adjustCount(skill, 1)}
                                    disabled={total >= maxQuestions}
                                    className="w-7 h-7 flex items-center justify-center rounded-md text-gray-600 hover:bg-white hover:text-blue-900 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-lg leading-none"
                                  >+</button>
                                </div>
                                <button
                                  onClick={() => setExpandedSkill(expanded ? null : skill)}
                                  className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-all ${expanded ? 'bg-blue-900 border-blue-900 text-white' : 'border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-900'}`}
                                >
                                  Options {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                </button>
                              </div>
                            </div>
                            {expanded && (
                              <div className="px-3 pb-3 pt-1 border-t border-gray-100 bg-slate-50">
                                {renderConfig(skill)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Worksheet settings */}
                  <div className="border-t border-gray-100 mt-3 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Max questions</label>
                      <input
                        type="number"
                        min={3} max={30} step={3}
                        value={maxQuestions}
                        onChange={e => setMaxQuestions(Math.min(30, Math.max(3, parseInt(e.target.value) || 3)))}
                        className="w-16 px-2 py-1.5 border-2 border-gray-200 rounded-lg text-sm font-bold text-gray-800 text-center focus:outline-none focus:border-blue-900"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pages</label>
                      <input
                        type="number"
                        min={1} max={12} step={1}
                        value={numPages}
                        onChange={e => setNumPages(Math.min(12, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="w-16 px-2 py-1.5 border-2 border-gray-200 rounded-lg text-sm font-bold text-gray-800 text-center focus:outline-none focus:border-blue-900"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order</label>
                      <div className="flex rounded-lg overflow-hidden border-2 border-gray-200">
                        <button
                          onClick={() => setGrouped(false)}
                          className={`px-3 py-1 text-sm font-bold transition-all ${!grouped ? 'bg-blue-900 text-white' : 'bg-white text-gray-500 hover:text-blue-900'}`}
                        >Mixed</button>
                        <button
                          onClick={() => setGrouped(true)}
                          className={`px-3 py-1 text-sm font-bold transition-all border-l-2 border-gray-200 ${grouped ? 'bg-blue-900 text-white' : 'bg-white text-gray-500 hover:text-blue-900'}`}
                        >Grouped</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fixed action footer */}
                <div className="p-5 pt-3 border-t border-gray-100 flex-shrink-0">
                  {error && (
                    <div className="mb-3 px-3 py-2 bg-red-50 border-2 border-red-400 rounded-xl text-red-700 font-semibold text-xs text-center">
                      {error}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleGeneratePreview}
                      disabled={!canGenerate || overBudget}
                      className={`flex-1 py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${(!canGenerate || overBudget) ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border-2 border-blue-900 text-blue-900 hover:bg-blue-50 shadow-sm'}`}
                    >
                      <Eye size={20} /> Preview
                    </button>
                    <button
                      onClick={handleGeneratePDF}
                      disabled={!canGenerate || overBudget}
                      className={`flex-1 py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${(!canGenerate || overBudget) ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-900 text-white hover:bg-blue-800 shadow-lg'}`}
                    >
                      <Download size={20} /> Generate PDF
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>


          {/* Preview grid */}
          {previewQuestions.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-lg font-bold mb-4" style={{ color: '#000000' }}>
                Preview — {previewQuestions.length} questions
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {previewQuestions.map((q, i) => (
                  <div key={i} className="group relative p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                    <span className="text-sm font-semibold text-gray-800 pr-5 block">
                      {i + 1}.{' '}
                      {q.displayQuestion
                        ? <span dangerouslySetInnerHTML={{ __html: q.displayQuestion }} />
                        : q.question}
                    </span>
                    <button
                      onClick={() => regenQuestion(i)}
                      className="absolute top-2 right-2 p-1 rounded text-gray-300 hover:text-blue-900 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all"
                      title="Regenerate this question"
                    >
                      <RefreshCw size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-gray-900 mb-3">How it works</h3>
            <ul className="space-y-1.5 text-sm text-gray-600">
              {[
                'Browse skills by topic on the left and tap a tile to add it (tap again to remove); it appears in "Your worksheet" on the right.',
                'In your worksheet, use − / + to set how many questions each skill contributes, and Options to configure its difficulty and ranges inline.',
                'Maximum 30 questions total — the budget bar shows how many you have left. Use Clear to start over.',
                'Set the total, number of pages and question order (mixed or grouped) under your worksheet.',
                'Preview shows a sample; Generate PDF opens a print-ready worksheet with answers.',
                'Your setup is saved automatically and restored when you come back.',
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-blue-900 font-bold mt-0.5">·</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </>
  );
}
