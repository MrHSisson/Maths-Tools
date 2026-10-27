// Ratio Manipulation → Simplifying. One generator for every kind of ratio to simplify (whole numbers, units, decimals,
// fractions, letters, already-simplest); the Question Types pool picks the kind and the level sets how hard that kind is.
import {
  mStep, rStepBuild, randInt, pick, pickActive, gcd, gcdAll, lcm, resolveMultiSelectValues, maskUnmetOptions,
  type DifficultyLevel, type WordedQuestion, type WorkingStep, type ToolMultiSelect,
} from "../../shared";

export const SIMPLIFY_TYPES: ToolMultiSelect = {
  key: "questionTypes", label: "Question Types", balanced: true,
  options: [
    { value: "wholeNumbers", label: "Whole Numbers", defaultActive: true },
    { value: "units", label: "Different Units", defaultActive: false },
    { value: "decimals", label: "Decimals", defaultActive: false },
    { value: "fractions", label: "Fractions", defaultActive: false },
    { value: "letters", label: "Letters", defaultActive: false },
    { value: "alreadySimplest", label: "Already Simplest", defaultActive: false },
  ],
};

export const SIMPLIFY_ASK: ToolMultiSelect = {
  key: "askFor", label: "Ask for", exclusive: true,
  options: [
    { value: "simplest", label: "Simplest Form", defaultActive: true },
    { value: "oneToN", label: "1 : n", defaultActive: false, requires: ["wholeNumbers"] },
    { value: "nToOne", label: "n : 1", defaultActive: false, requires: ["wholeNumbers"] },
  ],
};

/** How the common factor is taken out: one prime at a time, or the highest common factor in one go. */
export type SimplifyMethod = "primes" | "hcf";

export const SIMPLIFY_METHOD = {
  key: "method", label: "Method", displayOnly: true, workedExampleOnly: true, defaultValue: "primes",
  options: [{ value: "primes", label: "Prime Steps" }, { value: "hcf", label: "HCF" }],
};

type SimplifyType = "wholeNumbers" | "units" | "decimals" | "fractions" | "letters" | "alreadySimplest";
type AskFor = "simplest" | "oneToN" | "nToOne";

const PROMPT_SIMPLEST = "Simplify the ratio:";
const PROMPT_ONE_N = "Write the ratio in the form 1 : n:";
const PROMPT_N_ONE = "Write the ratio in the form n : 1:";

const rLatex = (...parts: (number | string)[]) => parts.join(" : ");
const frac = (n: number, d: number) => `\\frac{${n}}{${d}}`;
const clean = (x: number) => String(Math.round(x * 1e4) / 1e4);

/** Pairs of coprime numbers in 1..max with unequal parts, shuffled. */
const coprimePair = (max: number, min = 1): [number, number] => {
  for (let i = 0; i < 200; i++) {
    const a = randInt(min, max), b = randInt(min, max);
    if (a !== b && gcd(a, b) === 1) return [a, b];
  }
  return [2, 3];
};

const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];

const primeFactors = (n: number): number[] => {
  const out: number[] = [];
  for (let rest = n; rest > 1;) {
    const p = PRIMES.find((q) => rest % q === 0) ?? rest;
    out.push(p);
    rest /= p;
  }
  return out;
};

/** The rows of a ratio table dividing out one prime at a time, with the `\\div p` between each pair of rows. */
const divideChain = (start: string[], parts: number[], method: SimplifyMethod): { rows: string[][]; ops: string[] } => {
  const rows = [start], ops: string[] = [];
  let cur = [...parts];
  if (method === "hcf") {
    const g = gcdAll(parts);
    if (g > 1) { rows.push(parts.map((n) => String(n / g))); ops.push(`\\div ${g}`); }
    return { rows, ops };
  }
  for (;;) {
    const p = PRIMES.find((q) => cur.every((n) => n % q === 0));
    if (!p) break;
    cur = cur.map((n) => n / p);
    rows.push(cur.map(String));
    ops.push(`\\div ${p}`);
  }
  return { rows, ops };
};

const HEADERS = ["First", "Second", "Third"];
/** The working: one ratio table that gains a row per step (`rStepBuild`), shown beside the step captions. */
const chainTable = (label: string, start: string[], parts: number[], method: SimplifyMethod) => {
  const { rows, ops } = divideChain(start, parts, method);
  return table(label, rows, ops);
};
const table = (label: string, rows: string[][], ops: string[]) => rStepBuild(label, HEADERS.slice(0, rows[0].length), rows, ops);

const make = (
  prompt: string, question: string, answerLatex: string, working: WorkingStep[], key: string, level: DifficultyLevel,
): WordedQuestion => ({
  kind: "worded", lines: [prompt, `$${question}$`],
  answer: answerLatex.replace(/\s/g, ""), answerLatex, working, key, difficulty: level,
});

const idOf = () => randInt(0, 999999);

// ── Whole numbers ─────────────────────────────────────────────────────────────

const genWhole = (level: DifficultyLevel, ask: AskFor, method: SimplifyMethod): WordedQuestion => {
  const threePart = level === "level3";
  const [lo, hi, hcfs, minPart, maxPart] = level === "level1"
    ? [1, 5, [2, 3, 4, 5], 4, 20] as const
    : [1, 8, [6, 8, 9, 10, 12, 15, 18], 12, 60] as const;
  const terminating = [1, 2, 4, 5, 8];
  for (let i = 0; i < 300; i++) {
    const simple = Array.from({ length: threePart ? 3 : 2 }, () => randInt(lo, hi));
    if (gcdAll(simple) !== 1) continue;
    const [a, b] = simple;
    if (!threePart) {
      if (ask === "oneToN" && !(a >= 2 && terminating.includes(a) && b > a)) continue;
      if (ask === "nToOne" && !(b >= 2 && terminating.includes(b) && a > b)) continue;
    }
    const f = pick([...hcfs]);
    const parts = simple.map((x) => x * f);
    if (parts.some((x) => x < minPart || x > maxPart)) continue;
    const id = idOf();
    const { rows, ops } = divideChain(parts.map(String), parts, method);
    if (ask === "simplest" || threePart) {
      return make(PROMPT_SIMPLEST, rLatex(...parts), rLatex(...simple), table("Write the ratio", rows, ops), `rs-whole-${level}-${parts.join("_")}-${id}`, level);
    }
    const oneN = ask === "oneToN";
    const out = oneN ? [1, clean(b / a)] : [clean(a / b), 1];
    rows.push(out.map(String));
    ops.push(`\\div ${oneN ? a : b}`);
    return make(oneN ? PROMPT_ONE_N : PROMPT_N_ONE, rLatex(...parts), rLatex(...out), table("Write the ratio", rows, ops), `rs-whole-${ask}-${level}-${parts.join("_")}-${id}`, level);
  }
  const parts = threePart ? [12, 18, 24] : [6, 9];
  return make(PROMPT_SIMPLEST, rLatex(...parts), threePart ? "2 : 3 : 4" : "2 : 3", chainTable("Write the ratio", parts.map(String), parts, method), `rs-whole-fallback-${level}-${idOf()}`, level);
};

// ── Different units ───────────────────────────────────────────────────────────

const UNITS = [
  { big: "m", small: "cm", f: 100 }, { big: "kg", small: "g", f: 1000 }, { big: "km", small: "m", f: 1000 },
  { big: "l", small: "ml", f: 1000 }, { big: "h", small: "min", f: 60 },
];

const genUnits = (level: DifficultyLevel, method: SimplifyMethod): WordedQuestion => {
  const pool = level === "level1" ? UNITS.slice(0, 4) : UNITS;
  const maxA = level === "level1" ? 5 : level === "level2" ? 9 : 12;
  const maxSimple = level === "level3" ? 30 : 12;
  for (let i = 0; i < 300; i++) {
    const u = pick(pool);
    const A = randInt(1, maxA);
    const [s1, s2] = coprimePair(maxSimple);
    const X = A * u.f;
    if ((X * s2) % s1 !== 0) continue;
    const Y = (X * s2) / s1;
    if (Y < 1 || Y > 5000 || X === Y) continue;
    const g = gcd(X, Y);
    const simple = [X / g, Y / g];
    const bigFirst = Math.random() < 0.5;
    const shown = bigFirst
      ? `${A}\\,\\mathrm{${u.big}} : ${Y}\\,\\mathrm{${u.small}}`
      : `${Y}\\,\\mathrm{${u.small}} : ${A}\\,\\mathrm{${u.big}}`;
    const converted = bigFirst ? [X, Y] : [Y, X];
    const answer = bigFirst ? simple : [simple[1], simple[0]];
    const { rows, ops } = divideChain(converted.map(String), converted, method);
    const working = table(`Convert ${A} ${u.big} to ${X} ${u.small}, so both parts are in ${u.small}`, rows, ops);
    return make(PROMPT_SIMPLEST, shown, rLatex(...answer), working, `rs-units-${level}-${shown}-${idOf()}`, level);
  }
  return make(PROMPT_SIMPLEST, "2\\,\\mathrm{m} : 50\\,\\mathrm{cm}", "4 : 1", chainTable("Convert 2 m to 200 cm, so both parts are in cm", ["200", "50"], [200, 50], method), `rs-units-fallback-${idOf()}`, level);
};

// ── Decimals ──────────────────────────────────────────────────────────────────

const decimalText = (v: number, scale: number) => clean(v / scale);

const genDecimals = (level: DifficultyLevel, method: SimplifyMethod): WordedQuestion => {
  for (let i = 0; i < 400; i++) {
    const [s1, s2] = coprimePair(12);
    const twoDp = level !== "level1" && Math.random() < 0.5;
    const scale = twoDp ? 100 : 10;
    const m = randInt(2, level === "level1" ? 6 : 25);
    const p = [s1 * m, s2 * m];
    if (p.some((v) => v > (level === "level3" ? 150 : 99))) continue;
    const multiples = p.filter((v) => v % 10 === 0).length;
    if (level === "level3" ? !(scale === 10 && multiples === 1) : multiples > 0) continue;
    const cells = [decimalText(p[0], scale), decimalText(p[1], scale)];
    const shown = rLatex(...cells);
    const chain = divideChain(p.map(String), p, method);
    const working = table("Write the ratio", [cells, ...chain.rows], [`\\times ${scale}`, ...chain.ops]);
    return make(PROMPT_SIMPLEST, shown, rLatex(s1, s2), working, `rs-decimals-${level}-${shown}-${idOf()}`, level);
  }
  return make(PROMPT_SIMPLEST, "0.6 : 0.9", "2 : 3", table("Write the ratio", [["0.6", "0.9"], ["6", "9"], ["2", "3"]], ["\\times 10", "\\div 3"]), `rs-decimals-fallback-${idOf()}`, level);
};

// ── Fractions ─────────────────────────────────────────────────────────────────

const genFractions = (level: DifficultyLevel, method: SimplifyMethod): WordedQuestion => {
  const dens = level === "level3" ? [3, 4, 5, 6, 8, 9, 10, 12] : level === "level2" ? [2, 3, 4, 5, 6, 8, 10] : [4, 5, 6, 8, 10];
  const maxPart = level === "level3" ? 40 : 30;
  for (let i = 0; i < 400; i++) {
    const d1 = pick(dens);
    const d2 = level === "level1" ? d1 : pick(dens);
    if (level !== "level1" && d1 === d2) continue;
    if (level === "level3" && (d1 % d2 === 0 || d2 % d1 === 0)) continue;
    const n1 = randInt(1, d1 - 1), n2 = randInt(1, d2 - 1);
    if (n1 * d2 === n2 * d1) continue;
    const L = lcm(d1, d2);
    const p = [n1 * (L / d1), n2 * (L / d2)];
    const g = gcd(p[0], p[1]);
    if (p[0] / g > maxPart || p[1] / g > maxPart) continue;
    const shown = `${frac(n1, d1)} : ${frac(n2, d2)}`;
    const chain = divideChain(p.map(String), p, method);
    const working = table("Write the ratio", [[frac(n1, d1), frac(n2, d2)], ...chain.rows], [`\\times ${L}`, ...chain.ops]);
    return make(PROMPT_SIMPLEST, shown, rLatex(p[0] / g, p[1] / g), working, `rs-fractions-${level}-${n1}_${d1}-${n2}_${d2}-${idOf()}`, level);
  }
  return make(PROMPT_SIMPLEST, `${frac(1, 2)} : ${frac(3, 4)}`, "2 : 3", table("Write the ratio", [[frac(1, 2), frac(3, 4)], ["2", "3"]], ["\\times 4"]), `rs-fractions-fallback-${idOf()}`, level);
};

// ── Letters ───────────────────────────────────────────────────────────────────

type Term = { coeff: number; vars: Record<string, number> };

const VARS = ["x", "y", "z"];
const otherVar = (exclude: string[]) => pick(VARS.filter((v) => !exclude.includes(v)));

const formatTerm = (t: Term): string => {
  const keys = Object.keys(t.vars).filter((v) => t.vars[v] > 0).sort();
  let out = t.coeff === 1 && keys.length > 0 ? "" : String(t.coeff);
  for (const v of keys) out += t.vars[v] === 1 ? v : `${v}^{${t.vars[v]}}`;
  return out || String(t.coeff);
};

const termPair = (level: DifficultyLevel): [Term, Term] => {
  const t1: Term = { coeff: 1, vars: {} }, t2: Term = { coeff: 1, vars: {} };
  if (level === "level1") {
    const family = pick(["numeric", "algebraic", "power"]);
    if (family === "numeric") {
      const common = pick([2, 3, 4, 5, 6, 8, 10]);
      const [c1, c2] = coprimePair(5);
      t1.coeff = common * c1; t2.coeff = common * c2;
      const v1 = pick(VARS);
      t1.vars[v1] = 1; t2.vars[otherVar([v1])] = 1;
    } else if (family === "algebraic") {
      const [c1, c2] = coprimePair(5, 2);
      t1.coeff = c1; t2.coeff = c2;
      const shared = pick(VARS), v1 = otherVar([shared]), v2 = otherVar([shared, v1]);
      t1.vars[shared] = 1; t1.vars[v1] = 1; t2.vars[shared] = 1; t2.vars[v2] = 1;
    } else {
      const [c1, c2] = coprimePair(5, 2);
      t1.coeff = c1; t2.coeff = c2;
      const v = pick(VARS);
      t1.vars[v] = 2; t2.vars[v] = 1;
    }
  } else if (level === "level2") {
    const common = pick([2, 3, 4, 5, 6, 8, 10, 12]);
    const m1 = randInt(1, 4);
    let m2 = randInt(1, 4);
    while (m1 === m2) m2 = randInt(1, 4);
    t1.coeff = common * m1; t2.coeff = common * m2;
    if (pick(["power", "twoVars"]) === "power") {
      const v = pick(VARS);
      t1.vars[v] = 1; t2.vars[v] = 2;
    } else {
      const shared = pick(VARS), v1 = otherVar([shared]), v2 = otherVar([shared, v1]);
      t1.vars[shared] = 1; t1.vars[v1] = 1; t2.vars[shared] = 1; t2.vars[v2] = 1;
    }
  } else {
    const common = pick([2, 3, 4, 5, 6, 8, 9, 10, 12]);
    const m1 = randInt(1, 3);
    let m2 = randInt(2, 4);
    while (m1 === m2) m2 = randInt(2, 4);
    t1.coeff = common * m1; t2.coeff = common * m2;
    const v1 = pick(VARS), v2 = otherVar([v1]);
    t1.vars[v1] = 2; t1.vars[v2] = 3; t2.vars[v1] = 3; t2.vars[v2] = 1;
  }
  return [t1, t2];
};

const genLetters = (level: DifficultyLevel, method: SimplifyMethod): WordedQuestion => {
  const [t1, t2] = termPair(level);
  const g = gcd(t1.coeff, t2.coeff);
  const s1: Term = { coeff: t1.coeff / g, vars: {} }, s2: Term = { coeff: t2.coeff / g, vars: {} };
  const all = new Set([...Object.keys(t1.vars), ...Object.keys(t2.vars)]);
  all.forEach((v) => {
    const p1 = t1.vars[v] || 0, p2 = t2.vars[v] || 0, lowest = Math.min(p1, p2);
    if (p1 > lowest) s1.vars[v] = p1 - lowest;
    if (p2 > lowest) s2.vars[v] = p2 - lowest;
  });

  const working: WorkingStep[] = [];
  const c1: Term = { coeff: t1.coeff, vars: { ...t1.vars } }, c2: Term = { coeff: t2.coeff, vars: { ...t2.vars } };
  const line = () => `${formatTerm(c1)} : ${formatTerm(c2)}`;
  if (g > 1) {
    for (const f of method === "hcf" ? [g] : primeFactors(g)) {
      const before = line();
      c1.coeff /= f; c2.coeff /= f;
      working.push(mStep(`Divide both parts by ${f}:`, `${before} = ${line()}`));
    }
  }
  [...all].sort().forEach((v) => {
    const lowest = Math.min(c1.vars[v] || 0, c2.vars[v] || 0);
    if (lowest <= 0) return;
    const before = line();
    c1.vars[v] -= lowest; c2.vars[v] -= lowest;
    if (c1.vars[v] === 0) delete c1.vars[v];
    if (c2.vars[v] === 0) delete c2.vars[v];
    working.push(mStep(`Divide both parts by ${lowest === 1 ? v : `${v}^{${lowest}}`}:`, `${before} = ${line()}`));
  });

  const shown = `${formatTerm(t1)} : ${formatTerm(t2)}`;
  return make(PROMPT_SIMPLEST, shown, `${formatTerm(s1)} : ${formatTerm(s2)}`, working, `rs-letters-${level}-${shown}-${idOf()}`, level);
};

// ── Already simplest ──────────────────────────────────────────────────────────

const genAlreadySimplest = (level: DifficultyLevel): WordedQuestion => {
  const [a, b] = level === "level1" ? coprimePair(9) : level === "level2" ? coprimePair(20, 5) : coprimePair(40, 5);
  const shown = rLatex(a, b);
  return make(PROMPT_SIMPLEST, shown, shown, [mStep("The only common factor is 1, so it is already in simplest form:", shown)], `rs-simplest-${level}-${a}_${b}-${idOf()}`, level);
};

// ── Dispatcher ────────────────────────────────────────────────────────────────

export const genSimplifying = (level: DifficultyLevel, msv: Record<string, boolean>, method: SimplifyMethod = "primes"): WordedQuestion => {
  const pools = [SIMPLIFY_TYPES, SIMPLIFY_ASK];
  const values = maskUnmetOptions(pools, resolveMultiSelectValues(pools, msv));
  const type = pickActive(values, SIMPLIFY_TYPES.options) as SimplifyType;
  // "1 : n" and "n : 1" belong to whole numbers; three-part ratios always ask for the simplest form.
  const ask = (type === "wholeNumbers" ? pickActive(values, SIMPLIFY_ASK.options) : "simplest") as AskFor;
  switch (type) {
    case "units": return genUnits(level, method);
    case "decimals": return genDecimals(level, method);
    case "fractions": return genFractions(level, method);
    case "letters": return genLetters(level, method);
    case "alreadySimplest": return genAlreadySimplest(level);
    default: return genWhole(level, ask, method);
  }
};
