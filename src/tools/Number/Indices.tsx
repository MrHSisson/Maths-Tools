import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type ToolMultiSelect,
  type WorkingStep, type ToolLesson,
  pickActive, weightOf, mStep,
} from "../../shared";
import { DEPTH_ITEMS } from "./IndicesDepth";
import { LESSONS } from "./IndicesLessons";
import { TEACH_LESSONS } from "./IndicesTeach";

// ─────────────────────────────────────────────────────────────────────────────
// Indices — Y9H Unit 4 (Topics 1–4) plus the GCSE index laws behind them.
// Spec: specs/indices.md. Four sub-tools, one per SoL topic; Levels 1–3 inside each.
// Option values are shared with the Depth bank (IndicesDepth.ts `needs`) and the
// lesson presets (IndicesLessons.ts), and are checked by src/tests/indices.test.ts.
// ─────────────────────────────────────────────────────────────────────────────

type Level = DifficultyLevel;
type Built = {
  /** The question's own wording (e.g. "Write as a power:"). When set, the question is worded: prompt, then the maths. */
  prompt?: string;
  display?: string; displayLatex?: string; lines?: string[];
  answer: string; answerLatex: string; working: WorkingStep[];
};

// ── 1. Option pools ───────────────────────────────────────────────────────────
// Each level offers its own pool. A level's `options` list is the one generators
// draw from; defaultActive is what a fresh tool shows.

const opt = (value: string, label: string, weight: number, defaultActive: boolean) => ({ value, label, weight, defaultActive });

const POWERS_POOL: Record<Level, ToolMultiSelect> = {
  level1: { key: "questionPool", label: "Question Types", options: [
    opt("notation", "Index notation", 1, true), opt("power", "Evaluate powers", 2, true),
    opt("root", "Evaluate roots", 2, true), opt("combined", "Combined", 3, false),
  ] },
  level2: { key: "questionPool", label: "Question Types", options: [
    opt("power", "Evaluate powers", 2, true), opt("root", "Evaluate roots", 2, true),
    opt("combined", "Combined", 3, true), opt("negatives", "Negative bases", 4, false),
  ] },
  level3: { key: "questionPool", label: "Question Types", options: [
    opt("power", "Fractions & decimals", 3, true), opt("root", "Roots of fractions & decimals", 3, true),
    opt("combined", "Combined", 3, true), opt("negatives", "Negative bases", 4, true),
    opt("calculator", "Calculator (1 d.p.)", 5, false),
  ] },
};

const LAWS_POOL: Record<Level, ToolMultiSelect[]> = {
  level1: [
    { key: "lawPool", label: "Laws", options: [opt("multiply", "Multiply (add indices)", 1, true), opt("divide", "Divide (subtract indices)", 1, true), opt("powerOfPower", "Power of a power", 2, true), opt("multiplyDivide", "Multiply then divide", 3, false)] },
    { key: "baseType", label: "Base", options: [opt("numeric", "Numbers", 1, true), opt("algebraic", "Letters", 1, true)] },
  ],
  level2: [
    { key: "lawPool", label: "Laws", options: [opt("multiply", "Multiply (add indices)", 1, true), opt("divide", "Divide (subtract indices)", 1, true), opt("powerOfPower", "Power of a power", 2, true), opt("multiplyDivide", "Multiply then divide", 3, true)] },
    { key: "baseType", label: "Base", options: [opt("algebraic", "Letters", 1, true), opt("coefficients", "With coefficients", 2, true)] },
  ],
  level3: [
    { key: "lawPool", label: "Laws", options: [opt("multiply", "Multiply (add indices)", 1, true), opt("divide", "Divide (subtract indices)", 1, true), opt("powerOfPower", "Power of a power", 2, true), opt("multiplyDivide", "Multiply then divide", 3, true), opt("combined", "Combined laws", 4, true), opt("missingIndex", "Find the missing index", 4, false)] },
    { key: "baseType", label: "Base", options: [opt("coefficients", "With coefficients", 2, true), opt("numeric", "Numbers", 1, true)] },
  ],
};

const SPECIAL_POOL: Record<Level, ToolMultiSelect> = {
  level1: { key: "questionPool", label: "Question Types", options: [
    opt("zero", "Zero power", 1, true), opt("negative", "Negative powers", 2, true), opt("unitFraction", "Roots as powers (1/n)", 2, true),
    opt("divideNegative", "Divide to a negative power", 3, true),
  ] },
  level2: { key: "questionPool", label: "Question Types", options: [
    opt("zero", "Zero power", 1, true), opt("negative", "Negative powers", 2, true), opt("unitFraction", "Roots as powers (1/n)", 2, true),
    opt("fractionBase", "Negative powers of fractions", 3, true), opt("generalFraction", "Powers like 2/3", 3, true), opt("algebraic", "With letters", 4, false),
    opt("divideNegative", "Divide to a negative power", 3, true),
  ] },
  level3: { key: "questionPool", label: "Question Types", options: [
    opt("zero", "Zero power", 1, false), opt("negative", "Negative powers", 2, false), opt("unitFraction", "Roots as powers (1/n)", 2, false),
    opt("fractionBase", "Negative powers of fractions", 3, true), opt("generalFraction", "Powers like 2/3", 3, true),
    opt("algebraic", "With letters", 4, true), opt("combinedNegFrac", "Negative fractional powers", 5, true),
    opt("divideNegative", "Divide to a negative power", 3, false),
  ] },
};

const BASE_OPTS: { value: string; label: string; weight: number; defaultActive: boolean }[] = [
  opt("two", "Base 2", 1, true), opt("three", "Base 3", 1, true), opt("five", "Base 5", 1, false), opt("ten", "Base 10", 1, false),
];

const COMMON_POOL: Record<Level, ToolMultiSelect[]> = {
  level1: [
    { key: "questionPool", label: "Question Types", options: [opt("writeAsPower", "Write as a power", 1, true), opt("solveIndex", "Solve an index equation", 3, true), opt("evaluate", "Simplify and evaluate", 3, false)] },
    { key: "basePool", label: "Bases used", options: BASE_OPTS },
  ],
  level2: [
    { key: "questionPool", label: "Question Types", options: [opt("writeAsPower", "Write as a power", 1, true), opt("solveIndex", "Solve an index equation", 3, true), opt("evaluate", "Simplify and evaluate", 3, true)] },
    { key: "basePool", label: "Bases used", options: BASE_OPTS },
  ],
  level3: [
    { key: "questionPool", label: "Question Types", options: [opt("writeAsPower", "Write as a power", 1, false), opt("solveIndex", "Solve an index equation", 3, true), opt("evaluate", "Simplify and evaluate", 3, true), opt("interms", "Express in terms of a letter", 5, true)] },
    { key: "basePool", label: "Bases used", options: BASE_OPTS },
  ],
};

// ── 2. TOOL_CONFIG ────────────────────────────────────────────────────────────

const lvSettings = (groups: ToolMultiSelect[]) => ({ variables: [], dropdown: null, multiSelect: groups });
const lvs = (f: (l: Level) => ToolMultiSelect[]) => ({
  level1: lvSettings(f("level1")), level2: lvSettings(f("level2")), level3: lvSettings(f("level3")),
});

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Indices",
  tools: {
    powersRoots: {
      name: "Powers & Roots",
      // no tab-wide instruction: each question carries its own prompt
      variables: [], dropdown: null,
      multiSelect: [POWERS_POOL.level1],
      difficultySettings: lvs(l => [POWERS_POOL[l]]),
    },
    indexLaws: {
      name: "Index Laws",
      variables: [], dropdown: null,
      multiSelect: LAWS_POOL.level1,
      difficultySettings: lvs(l => LAWS_POOL[l]),
    },
    specialPowers: {
      name: "Negative & Fractional",
      variables: [], dropdown: null,
      multiSelect: [SPECIAL_POOL.level1],
      difficultySettings: lvs(l => [SPECIAL_POOL[l]]),
    },
    commonBase: {
      name: "Common Base",
      variables: [], dropdown: null,
      multiSelect: COMMON_POOL.level1,
      difficultySettings: lvs(l => COMMON_POOL[l]),
    },
  },
};

// ── 3. INFO_SECTIONS ──────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  { title: "Powers & Roots", icon: "🔢", content: [
    { label: "Overview", detail: "Index notation, squares, cubes and roots, from recall to combined expressions. Brackets matter: compare (−3)² with −3²." },
    { label: "Level 1 — Green", detail: "Writing repeated multiplication as a power, squares to 12², cubes of small numbers and their roots." },
    { label: "Level 2 — Amber", detail: "Squares to 15², cubes, combined expressions and negative bases." },
    { label: "Level 3 — Red", detail: "Powers and roots of fractions and decimals, and calculator work rounded to 1 d.p." },
  ] },
  { title: "Index Laws", icon: "✖️", content: [
    { label: "Overview", detail: "Multiplying, dividing and powers of powers. The first examples write the repeated factors out before stating the rule." },
    { label: "Level 1 — Green", detail: "One law at a time, one base, answers left in index form." },
    { label: "Level 2 — Amber", detail: "Coefficients and bracketed terms, such as (2x³)², and two letters." },
    { label: "Level 3 — Red", detail: "Combined laws, several letters, and missing indices such as 5ⁿ ÷ 5³ = 5⁴." },
  ] },
  { title: "Negative & Fractional", icon: "➖", content: [
    { label: "Overview", detail: "Zero, negative and fractional powers, each built from the laws of indices." },
    { label: "Level 1 — Green", detail: "a⁰ = 1, a⁻ⁿ as a reciprocal, and roots written as powers of one half or one third." },
    { label: "Level 2 — Amber", detail: "Negative powers of fractions and powers like 2/3, with roots taken first." },
    { label: "Level 3 — Red", detail: "Negative fractional powers and algebraic forms with positive indices." },
  ] },
  { title: "Common Base", icon: "🧮", content: [
    { label: "Overview", detail: "Write numbers as powers of one base, so the laws apply, then solve index equations and evaluate." },
    { label: "Level 1 — Green", detail: "Write numbers as positive powers, and solve with matching bases." },
    { label: "Level 2 — Amber", detail: "Negative and fractional targets, different bases to match, and evaluation." },
    { label: "Level 3 — Red", detail: "Equations with x on both sides and expressions in terms of a letter." },
  ] },
];

// ── 4. Helpers ────────────────────────────────────────────────────────────────

const rnd = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));
const choose = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];
const uid = () => Math.floor(Math.random() * 1_000_000);
const rep = (factor: string, n: number) => Array(n).fill(factor).join(" \\times ");
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const fracLatex = (n: number, d: number) => (d === 1 ? `${n}` : `\\dfrac{${n}}{${d}}`);
const fracPlain = (n: number, d: number) => (d === 1 ? `${n}` : `${n}/${d}`);
const reduce = (n: number, d: number): [number, number] => { const g = gcd(n, d) || 1; const s = d < 0 ? -1 : 1; return [s * n / g, s * d / g]; };
const LETTERS = ["x", "y", "a", "b", "m", "n", "p", "t"] as const;

// Pool option lookup for a level: the generator draws its type from exactly the options that level offers.
const groupOf = (tool: string, level: Level, key: string): ToolMultiSelect | undefined => {
  const groups: ToolMultiSelect[] =
    tool === "powersRoots" ? [POWERS_POOL[level]] :
    tool === "indexLaws" ? LAWS_POOL[level] :
    tool === "specialPowers" ? [SPECIAL_POOL[level]] :
    COMMON_POOL[level];
  return groups.find(g => g.key === key);
};
const pickFrom = (ms: Record<string, boolean>, tool: string, level: Level, key: string): { value: string; score: number } => {
  const g = groupOf(tool, level, key)!;
  const value = pickActive(ms, g.options);
  return { value, score: weightOf(g.options, value) };
};

const step = (label: string, latex: string | string[]): WorkingStep => mStep(label, latex);
const finish = (b: Built, prefix: string, level: Level, score: number): AnyQuestion => {
  const key = `${prefix}-${level}-${uid()}`;
  const base = { answer: b.answer, answerLatex: b.answerLatex, working: b.working, key, difficulty: level, _difficultyScore: score };
  if (b.prompt) return { kind: "worded", lines: [b.prompt, `$${b.displayLatex ?? ""}$`], ...base } as unknown as AnyQuestion;
  if (b.lines) return { kind: "worded", lines: b.lines, ...base } as unknown as AnyQuestion;
  return { kind: "simple", display: b.display ?? "", displayLatex: b.displayLatex ?? "", ...base } as unknown as AnyQuestion;
};

// ── 5. Powers & Roots ─────────────────────────────────────────────────────────
// Each level is its own ladder (the ranges are checked in src/tests/indices.test.ts):
//   Level 1  one operation on small numbers: squares to 10², cubes to 5³, 2⁵, 10³;
//            roots of squares to 10² and of 8 and 27.
//   Level 2  bigger numbers and brackets: squares 11²–15², cubes 4³–10³, roots of squares
//            11²–20² and cube roots to 10³; two-term sums and negative bases.
//   Level 3  fractions and decimals, three-term sums with signs, and calculator work to 1 d.p.
// Every question carries its own prompt, so the wording says what the question asks.

const WORK_OUT = "Work out:";

const powerBuilt = (b: number, e: number, prompt = WORK_OUT): Built => {
  const value = b ** e;
  return {
    prompt, displayLatex: `${b}^{${e}}`, answer: `${value}`, answerLatex: `${value}`,
    working: [
      step(`Write out the repeated multiplication (${e} lots of ${b}):`, rep(`${b}`, e)),
      step("Answer:", `${value}`),
    ],
  };
};

const rootBuilt = (n: number, prompt = WORK_OUT): Built => ({
  prompt, displayLatex: `\\sqrt{${n * n}}`, answer: `${n}`, answerLatex: `${n}`,
  working: [step("Which number multiplied by itself gives this?", `${n} \\times ${n} = ${n * n}`), step("Answer:", `${n}`)],
});

const cubeRootBuilt = (c: number, prompt = WORK_OUT): Built => {
  const k = Math.round(Math.cbrt(Math.abs(c))) * Math.sign(c);
  return {
    prompt, displayLatex: `\\sqrt[3]{${c}}`, answer: `${k}`, answerLatex: `${k}`,
    working: [step("Which number cubed gives this?", `${k} \\times ${k} \\times ${k} = ${c}`), step("Answer:", `${k}`)],
  };
};

const genNotation = (): Built => {
  const b = rnd(2, 5), p = rnd(2, 5);
  return {
    prompt: "Write as a power:",
    displayLatex: rep(`${b}`, p), answer: `${b}^${p}`, answerLatex: `${b}^{${p}}`,
    working: [step(`The base is ${b}, multiplied ${p} times, so the power is ${p}:`, `${b}^{${p}}`)],
  };
};

const genPowerL1 = (): Built => {
  const r = rnd(0, 3);
  if (r === 0) return powerBuilt(rnd(2, 10), 2);
  if (r === 1) return powerBuilt(rnd(2, 5), 3);
  if (r === 2) return powerBuilt(2, rnd(2, 5));
  return powerBuilt(10, rnd(2, 3));
};

const genPowerL2 = (): Built =>
  Math.random() < 0.6 ? powerBuilt(rnd(11, 15), 2) : powerBuilt(rnd(4, 10), 3);

const genPowerL3 = (): Built => {
  if (Math.random() < 0.6) {
    const [a, b] = choose([[1, 2], [2, 3], [3, 4], [2, 5], [3, 2], [1, 3], [3, 5]] as const);
    const e = choose([2, 3] as const);
    const [pn, pd] = [a ** e, b ** e];
    return {
      prompt: "Work out, giving a fraction in its simplest form:",
      displayLatex: `\\left(\\dfrac{${a}}{${b}}\\right)^{${e}}`, answer: fracPlain(pn, pd), answerLatex: fracLatex(pn, pd),
      working: [step("Power the top and the bottom separately:", `\\dfrac{${a}^{${e}}}{${b}^{${e}}} = \\dfrac{${pn}}{${pd}}`)],
    };
  }
  const d = rnd(1, 9), e = choose([2, 3] as const);
  const v = ((d ** e) / 10 ** e).toFixed(e);
  return {
    prompt: WORK_OUT, displayLatex: `\\left(0.${d}\\right)^{${e}}`, answer: v, answerLatex: v,
    working: [step("Write it as a fraction, then power it:", `\\left(\\dfrac{${d}}{10}\\right)^{${e}} = \\dfrac{${d ** e}}{${10 ** e}} = ${v}`)],
  };
};

const genRootL1 = (): Built => (Math.random() < 0.7 ? rootBuilt(rnd(2, 10)) : cubeRootBuilt(choose([8, 27])));

const genRootL2 = (): Built => (Math.random() < 0.6 ? rootBuilt(rnd(11, 20)) : cubeRootBuilt(choose([64, 125, 216, 343, 512, 1000])));

const genRootL3 = (): Built => {
  const pick = rnd(0, 2);
  if (pick === 0) {
    const m = rnd(2, 12), n = rnd(2, 12);
    if (m === n) return genRootL3();
    const [a, b] = reduce(m, n);
    return {
      prompt: "Work out, giving a fraction in its simplest form:",
      displayLatex: `\\sqrt{\\dfrac{${m * m}}{${n * n}}}`, answer: fracPlain(a, b), answerLatex: fracLatex(a, b),
      working: [step("Take the square root of the top and the bottom:", `\\dfrac{\\sqrt{${m * m}}}{\\sqrt{${n * n}}} = \\dfrac{${m}}{${n}}`)],
    };
  }
  if (pick === 1) {
    const d = rnd(1, 9), dec = `0.${String(d * d).padStart(2, "0")}`;
    return {
      prompt: WORK_OUT, displayLatex: `\\sqrt{${dec}}`, answer: `0.${d}`, answerLatex: `0.${d}`,
      working: [step("Find the number that squared gives this:", `0.${d} \\times 0.${d} = ${dec}`)],
    };
  }
  return cubeRootBuilt(-(rnd(2, 10) ** 3));
};

type Term = { latex: string; value: number };
const term = (kind: "pow" | "sqrt" | "cbrt", level: Level): Term => {
  const big = level === "level3";
  if (kind === "pow") { const b = rnd(2, big ? 10 : 9), e = big ? rnd(2, 4) : 2; return { latex: `${b}^{${e}}`, value: b ** e }; }
  if (kind === "sqrt") { const n = rnd(big ? 2 : 11, big ? 15 : 12); return { latex: `\\sqrt{${n * n}}`, value: n }; }
  const c = choose(big ? [2, 3, 4, 5, 6, 10] : [2, 3, 4, 5]); return { latex: `\\sqrt[3]{${c ** 3}}`, value: c };
};

const genCombined = (level: Level): Built => {
  const count = level === "level3" ? 3 : 2;
  for (let tries = 0; tries < 60; tries++) {
    const kinds = Array.from({ length: count }, () => choose(["pow", "sqrt", "cbrt"] as const));
    if (new Set(kinds).size < 2) continue;
    const terms = kinds.map(k => term(k, level));
    const ops = terms.slice(1).map(() => (Math.random() < 0.5 ? "+" : "-") as "+" | "-");
    let result = terms[0].value;
    ops.forEach((o, i) => { result = o === "+" ? result + terms[i + 1].value : result - terms[i + 1].value; });
    if (result === 0 || Math.abs(result) > 500) continue;
    const display = terms.reduce((acc, t, i) => (i === 0 ? t.latex : `${acc} ${ops[i - 1]} ${t.latex}`), "");
    const valuesLatex = terms.reduce((acc, t, i) => (i === 0 ? `${t.value}` : `${acc} ${ops[i - 1]} ${t.value}`), "");
    return {
      prompt: WORK_OUT, displayLatex: display, answer: `${result}`, answerLatex: `${result}`,
      working: [
        step("Work out each part:", terms.map(t => `${t.latex} = ${t.value}`).join(",\\quad")),
        step("Calculate:", `${valuesLatex} = ${result}`),
      ],
    };
  }
  return genCombined(level);
};

const genNegatives = (): Built => {
  const b = rnd(2, 6), e = choose([2, 3, 4] as const);
  const variant = rnd(0, 2);
  const prompt = "Work out, remembering the brackets:";
  if (variant === 0) {
    const v = (-b) ** e;
    return {
      prompt, displayLatex: `(-${b})^{${e}}`, answer: `${v}`, answerLatex: `${v}`,
      working: [step("The minus sign is part of the base, so it is raised to the power too:", `(-${b})^{${e}} = ${v}`)],
    };
  }
  if (variant === 1) {
    const v = -(b ** e);
    return {
      prompt, displayLatex: `-${b}^{${e}}`, answer: `${v}`, answerLatex: `${v}`,
      working: [step("Only the base is raised to the power; the minus sign is applied after:", `-${b}^{${e}} = -${b ** e} = ${v}`)],
    };
  }
  const c = rnd(2, 5);
  const v1 = (-b) ** 3, v2 = c * c, res = v1 + v2;
  return {
    prompt, displayLatex: `(-${b})^{3} + ${c}^{2}`, answer: `${res}`, answerLatex: `${res}`,
    working: [
      step("The minus is part of the base, so work out the bracketed cube first:", `(-${b})^{3} = ${v1}`),
      step("Square the second term, then add:", `${v1} + ${v2} = ${res}`),
    ],
  };
};

// Level 3 calculator work: a decimal power that is exact to 3 d.p., or a root of a non-square number to 1 d.p.
const genCalculator = (): Built => {
  if (Math.random() < 0.5) {
    const a = rnd(1, 9), d = rnd(1, 9), e = choose([2, 3] as const);
    const exact = ((a * 10 + d) ** e / 10 ** e).toFixed(e);
    return {
      prompt: WORK_OUT, displayLatex: `\\left(${a}.${d}\\right)^{${e}}`, answer: exact, answerLatex: exact,
      working: [step("Multiply the decimal by itself:", `(${a}.${d})^{${e}} = ${exact}`)],
    };
  }
  let n = rnd(20, 500);
  while (Number.isInteger(Math.sqrt(n))) n = rnd(20, 500);
  const root = Math.sqrt(n), rounded = root.toFixed(1);
  return {
    prompt: "Give your answer to 1 decimal place:", displayLatex: `\\sqrt{${n}}`, answer: rounded, answerLatex: rounded,
    working: [step("Use the square root key:", `\\sqrt{${n}} = ${root.toFixed(4)}\\ldots`), step("Round to 1 decimal place:", `${rounded}`)],
  };
};

const genPowersRoots = (ms: Record<string, boolean>, level: Level): AnyQuestion => {
  const { value, score } = pickFrom(ms, "powersRoots", level, "questionPool");
  const build: Built =
    value === "notation" ? genNotation() :
    value === "power" ? (level === "level1" ? genPowerL1() : level === "level2" ? genPowerL2() : genPowerL3()) :
    value === "root" ? (level === "level1" ? genRootL1() : level === "level2" ? genRootL2() : genRootL3()) :
    value === "combined" ? genCombined(level) :
    value === "negatives" ? genNegatives() :
    genCalculator();
  return finish(build, "pr", level, score);
};

// ── 6. Index Laws ─────────────────────────────────────────────────────────────

const genLawBuilt = (law: string, baseType: string, level: Level): Built => {
  const letter = choose(LETTERS);
  const b = baseType === "numeric" ? `${rnd(2, 9)}` : letter;
  const pow = (e: number) => `${b}^{${e}}`;

  // multiplyDivide: (b^a × b^c) ÷ b^d — add the indices on the top, then subtract the bottom's
  if (law === "multiplyDivide") {
    const a = rnd(2, 6), c = rnd(2, 6), d = rnd(2, a + c - 2);
    if (baseType === "coefficients") {
      const v = choose(["x", "y"] as const);
      const k = rnd(2, 5), m = rnd(2, 5), divs = [2, 3, 4, 5, 6, 8, 9, 10, 12, 15].filter((x) => (k * m) % x === 0 && x < k * m);
      const dv = divs.length ? choose(divs) : 1, e = rnd(2, a + c - 2);
      const top = k * m;
      return {
        displayLatex: `\\dfrac{${k}${v}^{${a}} \\times ${m}${v}^{${c}}}{${dv === 1 ? "" : dv}${v}^{${e}}}`,
        answer: `${top / dv}${v}^${a + c - e}`, answerLatex: `${top / dv}${v}^{${a + c - e}}`,
        working: [
          step("Multiply the top: multiply the numbers and add the indices:", `${k}${v}^{${a}} \\times ${m}${v}^{${c}} = ${top}${v}^{${a + c}}`),
          step("Divide by the bottom: divide the numbers and subtract the indices:", `\\dfrac{${top}${v}^{${a + c}}}{${dv === 1 ? "" : dv}${v}^{${e}}} = ${top / dv}${v}^{${a + c}-${e}} = ${top / dv}${v}^{${a + c - e}}`),
        ],
      };
    }
    return {
      displayLatex: `\\dfrac{${pow(a)} \\times ${pow(c)}}{${pow(d)}}`, answer: `${b}^${a + c - d}`, answerLatex: `${b}^{${a + c - d}}`,
      working: [
        step("Multiply the top: same base, so add the indices:", `${pow(a)} \\times ${pow(c)} = ${b}^{${a}+${c}} = ${pow(a + c)}`),
        step("Divide by the bottom: subtract the indices:", `\\dfrac{${pow(a + c)}}{${pow(d)}} = ${b}^{${a + c}-${d}} = ${pow(a + c - d)}`),
      ],
    };
  }

  if (law === "multiply" && baseType === "algebraic" && level === "level2") {
    const [u, v] = choose([["x", "y"], ["a", "b"], ["m", "n"]] as const);
    const m = rnd(2, 6), n = rnd(2, 5), p2 = rnd(2, 6), q = rnd(2, 4);
    return {
      displayLatex: `${u}^{${m}}${v}^{${n}} \\times ${u}^{${p2}}${v}^{${q}}`, answer: `${u}^${m + p2}${v}^${n + q}`, answerLatex: `${u}^{${m + p2}}${v}^{${n + q}}`,
      working: [
        step("Work on each letter separately, adding its indices:", `${u}^{${m}+${p2}} = ${u}^{${m + p2}}, \\quad ${v}^{${n}+${q}} = ${v}^{${n + q}}`),
        step("Answer:", `${u}^{${m + p2}}${v}^{${n + q}}`),
      ],
    };
  }

  if (law === "multiply") {
    if (baseType === "coefficients") {
      const k1 = rnd(2, 9), k2 = rnd(2, 9), v = choose(["x", "y"] as const);
      const m = rnd(2, 6), n = rnd(2, 6);
      return {
        displayLatex: `${k1}${v}^{${m}} \\times ${k2}${v}^{${n}}`, answer: `${k1 * k2}${v}^${m + n}`, answerLatex: `${k1 * k2}${v}^{${m + n}}`,
        working: [
          step("Multiply the numbers, and add the indices of the letter:", `${k1} \\times ${k2} = ${k1 * k2}, \\quad ${v}^{${m}+${n}} = ${v}^{${m + n}}`),
          step("Answer:", `${k1 * k2}${v}^{${m + n}}`),
        ],
      };
    }
    let m = rnd(2, 9), n = rnd(2, 9);
    // 2 + 2 = 2 × 2 would hide the add-the-indices lesson, so that pair is never drawn.
    if (b === "2" && m === 2 && n === 2) n = 3;
    const expanded = level === "level1" && m + n <= 8;
    return {
      displayLatex: `${pow(m)} \\times ${pow(n)}`, answer: `${b}^${m + n}`, answerLatex: `${b}^{${m + n}}`,
      working: [
        ...(expanded ? [step("Write out each power:", `(${rep(b, m)}) \\times (${rep(b, n)})`)] : []),
        step("Same base, so add the indices:", `${b}^{${m}+${n}} = ${b}^{${m + n}}`),
      ],
    };
  }

  if (law === "divide") {
    if (baseType === "coefficients") {
      const k = rnd(2, 6), divisor = rnd(2, 6), m = rnd(4, 12), n = rnd(2, m - 2);
      return {
        displayLatex: `${divisor * k}x^{${m}} \\div ${divisor}x^{${n}}`, answer: `${k}x^${m - n}`, answerLatex: `${k}x^{${m - n}}`,
        working: [
          step("Divide the numbers, and subtract the indices:", `${divisor * k} \\div ${divisor} = ${k}, \\quad x^{${m}-${n}} = x^{${m - n}}`),
          step("Answer:", `${k}x^{${m - n}}`),
        ],
      };
    }
    const n = rnd(2, 8), m = rnd(n + 2, 12);
    return {
      displayLatex: `${pow(m)} \\div ${pow(n)}`, answer: `${b}^${m - n}`, answerLatex: `${b}^{${m - n}}`,
      working: [step("Same base, so subtract the indices:", `${b}^{${m}-${n}} = ${b}^{${m - n}}`)],
    };
  }

  if (law === "powerOfPower") {
    const m = rnd(2, 5), n = rnd(2, 5);
    if (baseType === "coefficients") {
      const k = rnd(2, 4), e = rnd(2, 3), v = k ** e;
      return {
        displayLatex: `(${k}x^{${m}})^{${e}}`, answer: `${v}x^${m * e}`, answerLatex: `${v}x^{${m * e}}`,
        working: [
          step("The outer power applies to the number as well as the letter:", `(${k}x^{${m}})^{${e}} = ${k}^{${e}} \\times (x^{${m}})^{${e}}`),
          step("Work out the number, and multiply the indices:", `= ${v}x^{${m} \\times ${e}} = ${v}x^{${m * e}}`),
        ],
      };
    }
    return {
      displayLatex: `(${pow(m)})^{${n}}`, answer: `${b}^${m * n}`, answerLatex: `${b}^{${m * n}}`,
      working: [
        ...(level === "level1" ? [step("Write out the brackets:", Array(n).fill(pow(m)).join(" \\times "))] : []),
        step("Multiply the indices:", `${m} \\times ${n} = ${m * n}, \\quad (${b}^{${m}})^{${n}} = ${b}^{${m * n}}`),
      ],
    };
  }

  if (law === "combined") {
    const k = rnd(2, 4), a = rnd(2, 3), bb = rnd(2, 3), nn = rnd(2, 3), cc = rnd(2, 4), d = rnd(2, 4), e = rnd(2, 4);
    const left = `${k ** nn}x^{${a * nn}}y^{${bb * nn}}`;
    return {
      displayLatex: `(${k}x^{${a}}y^{${bb}})^{${nn}} \\times ${cc}x^{${d}}y^{${e}}`,
      answer: `${k ** nn * cc}x^${a * nn + d}y^${bb * nn + e}`, answerLatex: `${k ** nn * cc}x^{${a * nn + d}}y^{${bb * nn + e}}`,
      working: [
        step("Expand the bracket first:", `(${k}x^{${a}}y^{${bb}})^{${nn}} = ${left}`),
        step("Multiply the numbers, and add the indices of each letter:", `${left} \\times ${cc}x^{${d}}y^{${e}} = ${k ** nn * cc}x^{${a * nn + d}}y^{${bb * nn + e}}`),
      ],
    };
  }

  // missingIndex: b^{n} × b^{c} = b^{t}, so n = t − c
  const base = choose(["x", "y", "2", "3", "5"] as const);
  const cIdx = rnd(2, 6), nIdx = rnd(2, 8), t = cIdx + nIdx;
  return {
    displayLatex: `${base}^{\\square} \\times ${base}^{${cIdx}} = ${base}^{${t}}`, answer: `n = ${nIdx}`, answerLatex: `n = ${nIdx}`,
    working: [
      step("Same base, so add the indices on the left:", `n + ${cIdx} = ${t}`),
      step("Solve:", `n = ${t} - ${cIdx} = ${nIdx}`),
    ],
  };
};

// Level 3 "numbers": several bases in one product, collected to one power per base.
const genMultiBase = (): Built => {
  const [p, q] = choose([[2, 3], [2, 5], [3, 5], [2, 7]] as const);
  const a = rnd(2, 5), b = rnd(2, 4), c = rnd(2, 4), d = rnd(2, 4);
  return {
    prompt: "Simplify, writing each base once:",
    displayLatex: `${p}^{${a}} \\times ${q}^{${b}} \\times ${p}^{${c}} \\times ${q}^{${d}}`,
    answer: `${p}^${a + c} x ${q}^${b + d}`, answerLatex: `${p}^{${a + c}} \\times ${q}^{${b + d}}`,
    working: [
      step("Put the same bases together, then add their indices:", `${p}^{${a}+${c}} \\times ${q}^{${b}+${d}}`),
      step("Answer:", `${p}^{${a + c}} \\times ${q}^{${b + d}}`),
    ],
  };
};

// Each Index Laws question says what to do: the same wording as the Powers & Roots tab.
const lawPrompt = (law: string, baseType: string): string => {
  if (law === "missingIndex") return "Find the missing index:";
  if (law === "multiplyDivide" && baseType === "numeric") return "Write as a single power:";
  if (baseType === "numeric") return "Write as a single power:";
  return "Simplify:";
};

const genIndexLaws = (ms: Record<string, boolean>, level: Level): AnyQuestion => {
  const law = pickFrom(ms, "indexLaws", level, "lawPool");
  const baseGroup = groupOf("indexLaws", level, "baseType");
  // Some laws only make sense in one base family: combined laws and missing indices are always letters
  // with coefficients, and the coefficient-free laws take whichever bases the level offers.
  const baseType = law.value === "combined" || law.value === "missingIndex" ? "coefficients"
    : pickActive(ms, baseGroup!.options);
  if (level === "level3" && baseType === "numeric") return finish(genMultiBase(), "il", level, law.score);
  const built = genLawBuilt(law.value, baseType, level);
  built.prompt = lawPrompt(law.value, baseType);
  return finish(built, "il", level, law.score);
};

// ── 7. Negative & Fractional ──────────────────────────────────────────────────

const GENERAL_ROOTS = [
  { base: 8, r: 2, n: 3, m: 2, answer: 4 }, { base: 27, r: 3, n: 3, m: 2, answer: 9 },
  { base: 16, r: 2, n: 4, m: 3, answer: 8 }, { base: 4, r: 2, n: 2, m: 3, answer: 8 },
  { base: 125, r: 5, n: 3, m: 2, answer: 25 }, { base: 81, r: 3, n: 4, m: 3, answer: 27 },
];
const COMBINED_NEG_FRAC = [
  { q: "8^{-\\frac{2}{3}}", a: "\\dfrac{1}{4}" },
  { q: "\\left(\\dfrac{9}{4}\\right)^{-\\frac{3}{2}}", a: "\\dfrac{8}{27}" },
  { q: "16^{-\\frac{3}{4}}", a: "\\dfrac{1}{8}" },
  { q: "\\left(\\dfrac{27}{8}\\right)^{-\\frac{2}{3}}", a: "\\dfrac{4}{9}" },
];

const genSpecial = (value: string, level: Level): Built => {
  if (value === "zero") {
    if (level !== "level1" && Math.random() < 0.5) {
      const c = rnd(2, 9);
      return {
        displayLatex: `${c}x^{0}`, answer: `${c}`, answerLatex: `${c}`,
        working: [step("Only the letter is raised to the power; x⁰ = 1:", `${c}x^{0} = ${c} \\times 1 = ${c}`)],
      };
    }
    const a = choose([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 20, 100] as const);
    return {
      displayLatex: `${a}^{0}`, answer: "1", answerLatex: "1",
      working: [
        step("Divide a power by itself, using the division law:", `${a}^{3} \\div ${a}^{3} = ${a}^{3-3} = ${a}^{0}`),
        step("Anything divided by itself is 1:", `${a}^{0} = 1`),
      ],
    };
  }
  if (value === "divideNegative") {
    // the bottom power is bigger, so subtracting the indices goes negative: x^m ÷ x^n = x^(m−n) = 1/x^(n−m)
    const m = rnd(2, 6), d = rnd(1, 3), n = m + d;
    const kind = level === "level1" ? choose(["letter", "number"] as const) : choose(["letter", "number", "coefficient"] as const);
    if (kind === "number") {
      const a = choose([2, 3, 5, 10] as const), v = a ** d;
      return {
        displayLatex: `${a}^{${m}} \\div ${a}^{${n}}`, answer: `${a}^-${d} = 1/${v}`, answerLatex: `${a}^{-${d}} = \\dfrac{1}{${v}}`,
        working: [
          step("Same base, so subtract the indices:", `${a}^{${m}-${n}} = ${a}^{-${d}}`),
          step("A negative index means one over the positive index:", `${a}^{-${d}} = \\dfrac{1}{${a}^{${d}}} = \\dfrac{1}{${v}}`),
        ],
      };
    }
    const x = choose(LETTERS);
    if (kind === "coefficient") {
      const c = choose([2, 3, 4, 5] as const), k = c * rnd(2, 4), q = k / c;
      return {
        displayLatex: `${k}${x}^{${m}} \\div ${c}${x}^{${n}}`, answer: `${q}${x}^-${d} = ${q}/${x}^${d}`, answerLatex: `${q}${x}^{-${d}} = \\dfrac{${q}}{${x}^{${d}}}`,
        working: [
          step("Divide the numbers, and subtract the indices:", `${k} \\div ${c} = ${q}, \\quad ${x}^{${m}-${n}} = ${x}^{-${d}}`),
          step("Only the letter has the negative index:", `${q}${x}^{-${d}} = \\dfrac{${q}}{${x}^{${d}}}`),
        ],
      };
    }
    return {
      displayLatex: `${x}^{${m}} \\div ${x}^{${n}}`, answer: `${x}^-${d} = 1/${x}^${d}`, answerLatex: `${x}^{-${d}} = \\dfrac{1}{${x}^{${d}}}`,
      working: [
        step("Same base, so subtract the indices:", `${x}^{${m}-${n}} = ${x}^{-${d}}`),
        step("A negative index means one over the positive index:", `${x}^{-${d}} = \\dfrac{1}{${x}^{${d}}}`),
      ],
    };
  }
  if (value === "negative") {
    const a = choose([2, 3, 4, 5, 10] as const), n = rnd(1, level === "level1" ? 2 : 3), d = a ** n;
    return {
      displayLatex: `${a}^{-${n}}`, answer: `1/${d}`, answerLatex: `\\dfrac{1}{${d}}`,
      working: [
        step("A negative power means the reciprocal of the positive power:", `${a}^{-${n}} = \\dfrac{1}{${a}^{${n}}}`),
        step("Work out the power:", `= \\dfrac{1}{${d}}`),
      ],
    };
  }
  if (value === "unitFraction") {
    if (Math.random() < 0.6) {
      const n = rnd(2, level === "level1" ? 10 : 12);
      return {
        displayLatex: `${n * n}^{\\frac{1}{2}}`, answer: `${n}`, answerLatex: `${n}`,
        working: [step("A power of one half is a square root:", `${n * n}^{\\frac{1}{2}} = \\sqrt{${n * n}} = ${n}`)],
      };
    }
    const c = choose(level === "level1" ? [8, 27] as const : [8, 27, 64, 125, 1000] as const), k = Math.round(Math.cbrt(c));
    return {
      displayLatex: `${c}^{\\frac{1}{3}}`, answer: `${k}`, answerLatex: `${k}`,
      working: [step("A power of one third is a cube root:", `${c}^{\\frac{1}{3}} = \\sqrt[3]{${c}} = ${k}`)],
    };
  }
  if (value === "fractionBase") {
    const [a, b] = choose([[2, 3], [3, 4], [1, 2], [2, 5], [3, 5]] as const);
    const n = choose([1, 2] as const);
    const [pn, pd] = [b ** n, a ** n];
    return {
      displayLatex: `\\left(\\dfrac{${a}}{${b}}\\right)^{-${n}}`, answer: fracPlain(pn, pd), answerLatex: fracLatex(pn, pd),
      working: [
        step("Flip the fraction to remove the negative:", `\\left(\\dfrac{${a}}{${b}}\\right)^{-${n}} = \\left(\\dfrac{${b}}{${a}}\\right)^{${n}}`),
        step("Work out the power:", `= \\dfrac{${pn}}{${pd}}`),
      ],
    };
  }
  if (value === "generalFraction") {
    const g = choose(GENERAL_ROOTS);
    return {
      displayLatex: `${g.base}^{\\frac{${g.m}}{${g.n}}}`, answer: `${g.answer}`, answerLatex: `${g.answer}`,
      working: [
        step("The denominator is the root and the numerator is the power. Take the root first:", `${g.base}^{\\frac{${g.m}}{${g.n}}} = \\left(\\sqrt[${g.n}]{${g.base}}\\right)^{${g.m}} = ${g.r}^{${g.m}}`),
        step("Answer:", `${g.answer}`),
      ],
    };
  }
  if (value === "algebraic") {
    const p = rnd(2, 4), q = rnd(p + 1, 6), k = rnd(2, 5);
    const forms = level === "level3" ? [0, 1, 2, 3, 4] : [0, 1];
    const f = choose(forms);
    if (f === 0) return { displayLatex: `x^{-${p}}`, answer: `1/x^${p}`, answerLatex: `\\dfrac{1}{x^{${p}}}`, working: [step("A negative index is the reciprocal:", `x^{-${p}} = \\dfrac{1}{x^{${p}}}`)] };
    if (f === 1) return { displayLatex: `${k}x^{-${p}}`, answer: `${k}/x^${p}`, answerLatex: `\\dfrac{${k}}{x^{${p}}}`, working: [step("Only the x has the negative index:", `${k}x^{-${p}} = \\dfrac{${k}}{x^{${p}}}`)] };
    if (f === 2) return { displayLatex: `4x^{-${p}} \\times 3x^{${q}}`, answer: `12x^${q - p}`, answerLatex: `12x^{${q - p}}`, working: [step("Multiply the numbers, and add the indices:", `4 \\times 3 = 12, \\quad x^{-${p}+${q}} = x^{${q - p}}`)] };
    if (f === 3) return { displayLatex: `(x^{-${p}})^{${q}}`, answer: `1/x^${p * q}`, answerLatex: `\\dfrac{1}{x^{${p * q}}}`, working: [step("Multiply the indices, then take the reciprocal:", `(x^{-${p}})^{${q}} = x^{-${p * q}} = \\dfrac{1}{x^{${p * q}}}`)] };
    return { displayLatex: `x^{-${p}} \\div x^{-${q}}`, answer: `x^${q - p}`, answerLatex: `x^{${q - p}}`, working: [step("Same base, so subtract the indices:", `x^{-${p}-(-${q})} = x^{${q - p}}`)] };
  }
  // combinedNegFrac
  const c = choose(COMBINED_NEG_FRAC);
  return {
    displayLatex: c.q, answer: c.a, answerLatex: c.a,
    working: [
      step("Negative power: take the reciprocal, and take the root first:", c.q),
      step("Answer:", c.a),
    ],
  };
};

// Each Negative & Fractional question says what to do.
const specialPrompt = (value: string, b: Built): string => {
  if (value === "negative") return "Write as a fraction:";
  if (value === "divideNegative") return "Simplify, then write with a positive index:";
  if (value === "algebraic") return /\\times|\\div/.test(b.displayLatex ?? "") ? "Simplify:" : "Write with a positive index:";
  if (value === "zero") return /x/.test(b.displayLatex ?? "") ? "Simplify:" : "Work out:";
  return "Work out:";
};

const genSpecialPowers = (ms: Record<string, boolean>, level: Level): AnyQuestion => {
  const { value, score } = pickFrom(ms, "specialPowers", level, "questionPool");
  const built = genSpecial(value, level);
  built.prompt = specialPrompt(value, built);
  return finish(built, "sp", level, score);
};

// ── 8. Common Base ────────────────────────────────────────────────────────────

const basesOn = (ms: Record<string, boolean>): number[] => {
  const on = BASE_OPTS.filter(o => ms[o.value] !== false).map(o => ({ two: 2, three: 3, five: 5, ten: 10 } as Record<string, number>)[o.value]);
  return on.length ? on : [2];
};

const genCommon = (ms: Record<string, boolean>, level: Level): AnyQuestion => {
  const { value, score } = pickFrom(ms, "commonBase", level, "questionPool");
  const bases = basesOn(ms);
  const p = choose(bases);
  let built: Built;

  if (value === "writeAsPower") {
    const e = rnd(2, 5), v = p ** e;
    if (level === "level2" && Math.random() < 0.4) {
      const k = rnd(1, 3);
      return finish({
        prompt: "Fill in the missing index:",
        displayLatex: `\\dfrac{1}{${p ** k}} = ${p}^{\\square}`, answer: `-${k}`, answerLatex: `-${k}`,
        working: [step("A negative power is a reciprocal:", `\\dfrac{1}{${p ** k}} = \\dfrac{1}{${p}^{${k}}} = ${p}^{-${k}}`)],
      }, "cb", level, score);
    }
    built = {
      prompt: "Fill in the missing index:",
      displayLatex: `${v} = ${p}^{\\square}`, answer: `${e}`, answerLatex: `${e}`,
      working: [step("Keep multiplying by the base until you reach the number:", `${Array.from({ length: e }, (_, i) => p ** (i + 1)).join(",\\ ")}`), step("Count the factors:", `${v} = ${rep(`${p}`, e)} = ${p}^{${e}}`)],
    };
  } else if (value === "solveIndex") {
    if (level === "level1") {
      const e = rnd(2, 5), v = p ** e;
      built = {
        displayLatex: `${p}^{x} = ${v}`, answer: `x = ${e}`, answerLatex: `x = ${e}`,
        working: [step("Write the right-hand side as a power of the base:", `${v} = ${p}^{${e}}`), step("Same base, so the indices are equal:", `x = ${e}`)],
      };
    } else if (level === "level2") {
      const a = choose([2, 3] as const);
      let k = rnd(2, 6);
      while (k === a) k = rnd(2, 6);   // x = 1 teaches nothing
      const [n, d] = reduce(k, a);
      built = {
        displayLatex: `${p ** a}^{x} = ${p ** k}`, answer: `x = ${fracPlain(n, d)}`, answerLatex: `x = ${fracLatex(n, d)}`,
        working: [
          step("Write both sides with base " + p + ":", `${p ** a} = ${p}^{${a}}, \\quad ${p ** k} = ${p}^{${k}}`),
          step("Use (aᵐ)ⁿ = aᵐⁿ, then equate the indices:", `${p}^{${a}x} = ${p}^{${k}}, \\quad ${a}x = ${k}`),
          step("Solve:", `x = ${fracLatex(n, d)}`),
        ],
      };
    } else {
      // (2^a)^(x+j) = (2^c)^(x−l)  →  a(x+j) = c(x−l)  →  x = (aj + cl)/(c − a)
      // Redraw until the solution is a whole number or a simple fraction: x = (aj + cl) / (c − a).
      let a = 2, c = 3, j = 1, l = 1, n = 0, d = 1;
      for (let t = 0; t < 40; t++) {
        a = choose([2, 3] as const); c = a + choose([1, 2] as const); j = rnd(1, 3); l = rnd(1, 3);
        [n, d] = reduce(a * j + c * l, c - a);
        if (d <= 2) break;
      }
      built = {
        displayLatex: `${2 ** a}^{x+${j}} = ${2 ** c}^{x-${l}}`, answer: `x = ${fracPlain(n, d)}`, answerLatex: `x = ${fracLatex(n, d)}`,
        working: [
          step("Write both sides with base 2:", `${2 ** a}^{x+${j}} = 2^{${a}(x+${j})}, \\quad ${2 ** c}^{x-${l}} = 2^{${c}(x-${l})}`),
          step("Same base, so the indices are equal:", `${a}x + ${a * j} = ${c}x - ${c * l}`),
          step("Solve:", `x = ${fracLatex(n, d)}`),
        ],
      };
    }
  } else if (value === "evaluate" && level === "level3") {
    // Fractional and negative indices: (p^(ck))^(b/c) × p^(−d) = p^(kb − d), with kb − d and c chosen so the answer is exact.
    const c = choose([2, 3] as const), k = rnd(1, 3), bb = choose([1, 2, 3, 4, 5].filter(v => v % c !== 0)), d = rnd(1, 3);
    const idx = k * bb - d;
    const value2 = idx >= 0 ? `${p ** idx}` : `\\dfrac{1}{${p ** -idx}}`;
    built = {
      prompt: "Work out, giving your answer as a number:",
      displayLatex: `\\left(${p}^{${c * k}}\\right)^{\\frac{${bb}}{${c}}} \\times ${p}^{-${d}}`,
      answer: idx >= 0 ? `${p ** idx}` : `1/${p ** -idx}`, answerLatex: value2,
      working: [
        step("Multiply the indices inside the bracket:", `(${p}^{${c * k}})^{\\frac{${bb}}{${c}}} = ${p}^{${c * k}\\times\\frac{${bb}}{${c}}} = ${p}^{${k * bb}}`),
        step("Add the indices of the two powers of " + p + ":", `${p}^{${k * bb}} \\times ${p}^{-${d}} = ${p}^{${idx}}`),
        step("Answer:", value2),
      ],
    };
  } else if (value === "evaluate") {
    const sq = p ** 2, cu = p ** 3;
    for (let t = 0; t < 40; t++) {
      const a = rnd(1, 6), b = rnd(1, 3), c = rnd(1, 3), e = a + 2 * b - 3 * c;
      if (e < -4 || e > 8) continue;
      const value2 = e >= 0 ? `${p ** e}` : `\\dfrac{1}{${p ** -e}}`;
      built = {
        displayLatex: `${p}^{${a}} \\times ${sq}^{${b}} \\div ${cu}^{${c}}`, answer: e >= 0 ? `${p ** e}` : `1/${p ** -e}`, answerLatex: value2,
        working: [
          step(`Write every number with base ${p}:`, `${p}^{${a}} \\times (${p}^{2})^{${b}} \\div (${p}^{3})^{${c}}`),
          step("Multiply: add the indices. Divide: subtract them.", `${p}^{${a}+${2 * b}-${3 * c}} = ${p}^{${e}}`),
          step("Answer:", value2),
        ],
      };
      break;
    }
    built ??= { displayLatex: `${p}^{2}`, answer: `${sq}`, answerLatex: `${sq}`, working: [step("Answer:", `${sq}`)] };
    built.prompt = "Work out:";
  } else {
    // interms: given p^x = a, write p^(x+j) or (p^m)^x in terms of a
    const m = choose([2, 3] as const), j = rnd(1, 3);
    const variant = rnd(0, 1);
    const expr = variant === 0 ? `${p ** m}^{x}` : `${p}^{x+${j}}`;
    const ansLatex = variant === 0 ? `a^{${m}}` : `${p ** j}a`;
    return finish({
      lines: [`Given $${p}^x = a$,`, `write $${expr}$ in terms of $a$.`],
      answer: variant === 0 ? `a^${m}` : `${p ** j}a`, answerLatex: ansLatex,
      working: [
        step(`Write the new expression with base ${p} and the same index:`, variant === 0 ? `${p ** m}^{x} = (${p}^{${m}})^{x} = (${p}^{x})^{${m}}` : `${p}^{x+${j}} = ${p}^{${j}} \\times ${p}^{x}`),
        step("Replace the power of p with a:", variant === 0 ? `= a^{${m}}` : `= ${p ** j}a`),
      ],
    }, "cb", level, score);
  }
  if (value === "solveIndex") built.prompt = "Solve:";
  return finish(built, "cb", level, score);
};

// ── 9. Generator dispatch ─────────────────────────────────────────────────────

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  _variables: Record<string, boolean>,
  _dropdownValue: string,
  multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  const ms = multiSelectValues;
  if (tool === "powersRoots") return genPowersRoots(ms, level);
  if (tool === "indexLaws") return genIndexLaws(ms, level);
  if (tool === "specialPowers") return genSpecialPowers(ms, level);
  return genCommon(ms, level);
};

// ── 10. Export ────────────────────────────────────────────────────────────────

export const __test = { TOOL_CONFIG, generateQuestion, depthItems: DEPTH_ITEMS, lessons: LESSONS, teachLessons: TEACH_LESSONS };

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      depthItems={DEPTH_ITEMS}
      teachingLessons={TEACH_LESSONS}
      lessons={LESSONS as ToolLesson[]}
      defaults={{ numColumns: 3, maxColumns: 3 }}
    />
  );
}
