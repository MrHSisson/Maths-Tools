import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type ToolMultiSelect,
  type WorkingStep, type ToolLesson,
  pickActive, maskUnmetOptions, bandFromTable, largestNumber, mStep,
} from "../../shared";
import { BANDS } from "./Indices.calibration";
import { DEPTH_ITEMS } from "./IndicesDepth";
import { LESSONS } from "./IndicesLessons";
import { TEACH_LESSONS } from "./IndicesTeach";
import type { Built, Form } from "./IndicesCore";
import {
  genPowerL1, genRootL1, genZero, genNegative, genReverse, genUnitFraction, genGeneralFraction, genNegativeFraction,
} from "./IndicesNumbers";
import { genNegZero, genFractional, genWriting } from "./IndicesAlgebra";
import { gcd } from "../../shared";

// ─────────────────────────────────────────────────────────────────────────────
// Indices — Y9H Unit 4 (Topics 1–4) plus the GCSE index laws behind them.
// Spec: specs/indices.md. Four sub-tools, one per SoL topic; Levels 1–3 inside each.
// Option values are shared with the Depth bank (IndicesDepth.ts `needs`) and the
// lesson presets (IndicesLessons.ts), and are checked by src/tests/indices.test.ts.
// ─────────────────────────────────────────────────────────────────────────────

type Level = DifficultyLevel;

// ── 1. Option pools ───────────────────────────────────────────────────────────
// Each level offers its own pool. A level's `options` list is the one generators
// draw from; defaultActive is what a fresh tool shows.

const opt = (value: string, label: string, defaultActive: boolean) => ({ value, label, defaultActive });

const POWERS_POOL: Record<Level, ToolMultiSelect> = {
  // Level 1 recaps what is known: squares, cubes and their roots (the Bases selector widens it to fractions and decimals)
  level1: { key: "questionPool", label: "Question Types", options: [
    opt("notation", "Index notation", true), opt("power", "Squares & cubes", true),
    opt("root", "Roots", true), opt("combined", "Combined", false), opt("negatives", "Negative bases", false),
  ] },
  // Level 2: zero and negative powers of numbers
  level2: { key: "questionPool", label: "Question Types", options: [
    opt("zero", "Zero power", true), opt("negative", "Negative powers", true), opt("reverse", "Write as a power", false),
  ] },
  // Level 3: fractional and negative fractional powers of numbers
  level3: { key: "questionPool", label: "Question Types", options: [
    opt("unitFraction", "Roots as powers", true), opt("generalFraction", "Fractional powers", true),
    opt("combinedNegFrac", "Negative fractional", true), opt("calculator", "Calculator", false),
  ] },
};
const BASES_POOL: ToolMultiSelect = { key: "basePool", label: "Bases", options: [
  opt("integers", "Whole numbers", true), opt("fractions", "Fractions", false), opt("decimals", "Decimals", false),
] };

const LAWS_POOL: Record<Level, ToolMultiSelect[]> = {
  level1: [
    { key: "lawPool", label: "Laws", options: [opt("multiply", "Multiply", true), opt("divide", "Divide", true), opt("powerOfPower", "Power of a power", true), opt("multiplyDivide", "Multiply & divide", false)] },
    { key: "baseType", label: "Base", options: [opt("numeric", "Numbers", true), opt("algebraic", "Letters", true)] },
  ],
  level2: [
    { key: "lawPool", label: "Laws", options: [opt("multiply", "Multiply", true), opt("divide", "Divide", true), opt("powerOfPower", "Power of a power", true), opt("multiplyDivide", "Multiply & divide", true)] },
    // Level 2 always has a coefficient on one letter (plain letters are Level 1, two letters Level 3): nothing to choose, so no control
  ],
  level3: [
    { key: "lawPool", label: "Laws", options: [opt("multiply", "Multiply", true), opt("divide", "Divide", true), opt("powerOfPower", "Power of a power", true), opt("multiplyDivide", "Multiply & divide", true), opt("combined", "Combined", true), opt("missingIndex", "Missing index", false)] },
    // Level 3: two letters with coefficients (the combined and missing-index types always carry coefficients too), or several number bases
    { key: "baseType", label: "Base", options: [opt("twoLetters", "Two letters", true), opt("numeric", "Several numbers", true)] },
  ],
};

// Negative & Zero Indices: Level 1 bare terms, Level 2 one coefficient (or a bracket), Level 3 two letters and combined laws.
// A Notation option writes the laws as powers or with fraction bars and reciprocals (x³/x⁵, x³ ÷ 1/x²).
const NEGZERO_POOL: Record<Level, ToolMultiSelect> = {
  level1: { key: "questionPool", label: "Question Types", options: [
    opt("zero", "Zero index", true), opt("divideNegative", "Divide to negative", true),
    opt("lawsNegative", "Laws with a negative index", true), opt("powerOfPower", "Power of a power", true),
  ] },
  level2: { key: "questionPool", label: "Question Types", options: [
    opt("coefficients", "With a coefficient", true), opt("bracket", "Bracketed terms", true),
  ] },
  level3: { key: "questionPool", label: "Question Types", options: [
    opt("twoLetters", "Two letters", true), opt("combined", "Combined", true), opt("coefficients", "With coefficients", false),
  ] },
};
const NEGZERO_NOTATION: ToolMultiSelect = { key: "negNotation", label: "Notation", options: [
  opt("power", "Powers", true), opt("fraction", "Fractions", false),
] };
const NEGZERO_BASES: ToolMultiSelect = { key: "negBases", label: "Bases", options: [
  opt("letters", "Letters", true), opt("numbers", "Numbers", false),
] };

// Writing Indices: change the form only (no laws, no evaluating): negative indices and roots, with letters or number bases
const WRITING_POOL: Record<Level, ToolMultiSelect> = {
  level1: { key: "questionPool", label: "Question Types", options: [
    opt("negative", "Negative indices", true), opt("unit", "Roots as powers", true),
  ] },
  level2: { key: "questionPool", label: "Question Types", options: [
    opt("negativeCoef", "Negative with a coefficient", true), opt("mixed", "Powers like 2/3", true), opt("coefRoots", "Roots with a coefficient", false),
  ] },
  level3: { key: "questionPool", label: "Question Types", options: [
    opt("negativeForms", "Negative fractional indices", true), opt("coefNegFrac", "With a coefficient", true), opt("mixed", "Powers like 2/3", false),
  ] },
};
// A coefficient goes with a letter only (3x⁻², not 3 × 5⁻²), so Numbers is greyed out unless a question type that can use a number base is on
const WRITING_NUMBER_NEEDS: Record<Level, (string | string[])[] | undefined> = { level1: undefined, level2: [["mixed"]], level3: [["negativeForms", "mixed"]] };
const WRITING_BASES_POOL = (level: Level): ToolMultiSelect => ({ key: "writeBases", label: "Bases", options: [
  opt("letters", "Letters", true), { ...opt("numbers", "Numbers", false), requires: WRITING_NUMBER_NEEDS[level] },
] });
const WRITING_BASES: Record<Level, ToolMultiSelect> = { level1: WRITING_BASES_POOL("level1"), level2: WRITING_BASES_POOL("level2"), level3: WRITING_BASES_POOL("level3") };

// Fractional Indices: write between root and index form, then the laws, then coefficients and negative fractional indices
const FRACTIONAL_POOL: Record<Level, ToolMultiSelect> = {
  level1: { key: "questionPool", label: "Question Types", options: [
    opt("multiply", "Multiply", true), opt("divide", "Divide", true), opt("powerOfPower", "Power of a power", true),
    opt("unlike", "Different denominators", false), opt("negative", "Negative indices", false),
  ] },
  level2: { key: "questionPool", label: "Question Types", options: [
    opt("coefficients", "With a coefficient", true), opt("rootBracket", "Root of a bracket", true),
  ] },
  level3: { key: "questionPool", label: "Question Types", options: [
    opt("twoLetters", "Two letters", true), opt("coefficientsNegative", "Negative fractional", true), opt("negative", "Laws with negatives", false),
  ] },
};
const ANSWER_FORM: ToolMultiSelect = { key: "answerForm", label: "Answer form", exclusive: true, options: [
  opt("leave", "Leave negatives", true), opt("positive", "Positive indices", false),
] };

const BASE_OPTS: { value: string; label: string; defaultActive: boolean }[] = [
  opt("two", "Base 2", true), opt("three", "Base 3", true), opt("five", "Base 5", false), opt("ten", "Base 10", false),
];

const COMMON_POOL: Record<Level, ToolMultiSelect[]> = {
  level1: [
    { key: "questionPool", label: "Question Types", options: [opt("writeAsPower", "Write as a power", true), opt("solveIndex", "Solve for x", true), opt("evaluate", "Simplify & evaluate", false)] },
    { key: "basePool", label: "Bases used", options: BASE_OPTS },
  ],
  level2: [
    { key: "questionPool", label: "Question Types", options: [opt("writeAsPower", "Write as a power", true), opt("solveIndex", "Solve for x", true), opt("evaluate", "Simplify & evaluate", true)] },
    { key: "basePool", label: "Bases used", options: BASE_OPTS },
  ],
  level3: [
    { key: "questionPool", label: "Question Types", options: [opt("writeAsPower", "Write as a power", false), opt("solveIndex", "Solve for x", true), opt("evaluate", "Simplify & evaluate", true), opt("interms", "In terms of a letter", true)] },
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
  calibrated: true,
  tools: {
    powersRoots: {
      name: "Powers & Roots",
      levelLabels: ["Squares, cubes and their roots (a recap)", "Zero and negative powers", "Fractional and negative fractional powers"],
      // no tab-wide instruction: each question carries its own prompt
      variables: [], dropdown: null,
      multiSelect: [POWERS_POOL.level1, BASES_POOL],
      difficultySettings: lvs(l => [POWERS_POOL[l], BASES_POOL]),
    },
    writingIndices: {
      name: "Writing Indices",
      levelLabels: ["Negative indices and roots, written as powers and back", "A coefficient, and powers like 2/3", "Negative fractional indices, with a coefficient"],
      variables: [], dropdown: null,
      multiSelect: [WRITING_POOL.level1, WRITING_BASES.level1],
      difficultySettings: lvs(l => [WRITING_POOL[l], WRITING_BASES[l]]),
    },
    indexLaws: {
      name: "Index Laws",
      levelLabels: ["One law on one base", "Coefficients and bracketed terms", "Combined laws, several letters and missing indices"],
      variables: [], dropdown: null,
      multiSelect: LAWS_POOL.level1,
      difficultySettings: lvs(l => LAWS_POOL[l]),
    },
    specialPowers: {
      name: "Negative & Zero Indices",
      levelLabels: ["The laws with zero and negative indices, on bare terms", "A coefficient or a bracket", "Two letters and combined laws"],
      variables: [], dropdown: null,
      multiSelect: [NEGZERO_POOL.level1, NEGZERO_NOTATION, NEGZERO_BASES, ANSWER_FORM],
      difficultySettings: lvs(l => [NEGZERO_POOL[l], NEGZERO_NOTATION, NEGZERO_BASES, ANSWER_FORM]),
    },
    fractionalIndices: {
      name: "Fractional Indices",
      levelLabels: ["The laws with fractional indices, on bare terms", "A coefficient, or the root of a bracket", "Two letters and negative fractional indices"],
      variables: [], dropdown: null,
      multiSelect: [FRACTIONAL_POOL.level1, ANSWER_FORM],
      difficultySettings: lvs(l => [FRACTIONAL_POOL[l], ANSWER_FORM]),
    },
    commonBase: {
      name: "Common Base",
      levelLabels: ["Write as a power and solve with matching bases", "Negative and fractional targets, and evaluating", "x on both sides and expressions in terms of a letter"],
      variables: [], dropdown: null,
      multiSelect: COMMON_POOL.level1,
      difficultySettings: lvs(l => COMMON_POOL[l]),
    },
  },
};

// ── 3. INFO_SECTIONS ──────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  { title: "Powers & Roots", icon: "🔢", content: [
    { label: "Overview", detail: "Evaluating numbers: from squares and cubes, through zero and negative powers, to fractional powers. Brackets matter: compare (−3)² with −3²." },
    { label: "Bases", detail: "Whole numbers, fractions or decimals. Fractions and decimals are chosen so that the roots come out exactly." },
  ] },
  { title: "Index Laws", icon: "✖️", content: [
    { label: "Overview", detail: "Multiplying, dividing and powers of powers. The first examples write the repeated factors out before stating the rule." },
  ] },
  { title: "Negative & Zero Indices", icon: "➖", content: [
    { label: "Overview", detail: "The laws of indices when an index is zero or negative: x⁰, x⁻³, x³ ÷ x⁵, (x⁻²)⁻⁴. Evaluating numbers such as 2⁻³ is in Powers & Roots." },
    { label: "Answer form", detail: "Positive indices (the default) or leave negatives: x³ ÷ x⁵ is 1/x² in the first and x⁻² in the second." },
  ] },
  { title: "Fractional Indices", icon: "½", content: [
    { label: "Overview", detail: "Roots as powers, and the laws of indices with fractional indices. a^(1/2) × a^(1/2) = a, so a^(1/2) is the square root of a." },
    { label: "Answer form", detail: "Positive indices (the default) or leave negatives, on Levels 2 and 3." },
  ] },
  { title: "Common Base", icon: "🧮", content: [
    { label: "Overview", detail: "Write numbers as powers of one base, so the laws apply, then solve index equations and evaluate." },
  ] },
];

// ── 4. Helpers ────────────────────────────────────────────────────────────────

const rnd = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));
const choose = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];
const uid = () => Math.floor(Math.random() * 1_000_000);
const rep = (factor: string, n: number) => Array(n).fill(factor).join(" \\times ");
const fracLatex = (n: number, d: number) => (d === 1 ? `${n}` : `\\dfrac{${n}}{${d}}`);
const fracPlain = (n: number, d: number) => (d === 1 ? `${n}` : `${n}/${d}`);
const reduce = (n: number, d: number): [number, number] => { const g = gcd(n, d) || 1; const s = d < 0 ? -1 : 1; return [s * n / g, s * d / g]; };
const LETTERS = ["x", "y", "a", "b", "m", "n", "p", "t"] as const;

// Pool option lookup for a level: the generator draws its type from exactly the options that level offers.
const groupOf = (tool: string, level: Level, key: string): ToolMultiSelect | undefined => {
  const groups: ToolMultiSelect[] =
    tool === "powersRoots" ? [POWERS_POOL[level], BASES_POOL] :
    tool === "writingIndices" ? [WRITING_POOL[level], WRITING_BASES[level]] :
    tool === "indexLaws" ? LAWS_POOL[level] :
    tool === "specialPowers" ? [NEGZERO_POOL[level], NEGZERO_NOTATION, NEGZERO_BASES, ANSWER_FORM] :
    tool === "fractionalIndices" ? [FRACTIONAL_POOL[level], ANSWER_FORM] :
    COMMON_POOL[level];
  return groups.find(g => g.key === key);
};
const pickFrom = (ms: Record<string, boolean>, tool: string, level: Level, key: string): { value: string } =>
  ({ value: pickActive(ms, groupOf(tool, level, key)!.options) });

const step = (label: string, latex: string | string[]): WorkingStep => mStep(label, latex);
const finish = (b: Built, prefix: string, level: Level): AnyQuestion => {
  const key = `${prefix}-${level}-${uid()}`;
  const base = { answer: b.answer, answerLatex: b.answerLatex, working: b.working, key, difficulty: level, ...rank(prefix, level, b), _idx: b._idx };
  if (b.prompt) return { kind: "worded", lines: [b.prompt, `$${b.displayLatex ?? ""}$`], ...base } as unknown as AnyQuestion;
  if (b.lines) return { kind: "worded", lines: b.lines, ...base } as unknown as AnyQuestion;
  return { kind: "simple", display: b.display ?? "", displayLatex: b.displayLatex ?? "", ...base } as unknown as AnyQuestion;
};

/**
 * Smart Progressor ranking — the standard calibration process (src/shared/calibration.ts). The raw score is the work the question asks
 * for, read from the question itself: the steps of the working, the size of the biggest number, roots, negative indices, fractions,
 * brackets and letters. See docs/calibration/INDICES_DIFFICULTY.md.
 */
const SUB_OF_PREFIX: Record<string, string> = { pr: "powersRoots", il: "indexLaws", sp: "specialPowers", wi: "writingIndices", fi: "fractionalIndices", cb: "commonBase" };
const rank = (prefix: string, level: Level, b: Built) => {
  const text = [b.displayLatex ?? "", b.display ?? "", ...(b.lines ?? []), b.prompt ?? ""].join(" ");
  const maths = text.replace(/\\[a-zA-Z]+/g, " ");
  const roots = (text.match(/\\sqrt/g) ?? []).length;
  const negIndex = /\^\{?-/.test(text) ? 1 : 0;
  const fractions = /\\d?frac/.test(text) ? 1 : 0;
  const brackets = (text.match(/\(/g) ?? []).length;
  const letters = new Set(maths.match(/[a-z]/g) ?? []).size;
  const raw = Math.round((0.5 + 0.35 * b.working.length + 1.0 * Math.log10(largestNumber(text) + 1) + 0.8 * Math.min(roots, 2) + 1.0 * negIndex + 0.9 * fractions
    + 0.5 * Math.min(brackets, 3) + 0.4 * Math.min(letters, 3)) * 10) / 10;
  const sub = SUB_OF_PREFIX[prefix];
  const category = `${sub}${roots ? " · roots" : ""}${negIndex ? " · negative index" : ""}${fractions ? " · fractions" : ""}${brackets ? " · brackets" : ""}${letters ? " · letters" : ""}`;
  return { _rawDifficulty: raw, _category: category, _difficultyScore: bandFromTable(BANDS, sub, level, raw) };
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

const genNotation = (): Built => {
  const b = rnd(2, 5), p = rnd(2, 5);
  return {
    prompt: "Write as a power:",
    displayLatex: rep(`${b}`, p), answer: `${b}^${p}`, answerLatex: `${b}^{${p}}`,
    working: [step(`The base is ${b}, multiplied ${p} times, so the power is ${p}:`, `${b}^{${p}}`)],
  };
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

const KINDS = { integers: "int", fractions: "frac", decimals: "dec" } as const;
const genPowersRoots = (ms: Record<string, boolean>, level: Level): AnyQuestion => {
  const { value } = pickFrom(ms, "powersRoots", level, "questionPool");
  const base = pickFrom(ms, "powersRoots", level, "basePool");
  const kind = KINDS[base.value as keyof typeof KINDS] ?? "int";
  const build: Built =
    value === "notation" ? genNotation() :
    value === "power" ? genPowerL1(kind) :
    value === "root" ? genRootL1(kind) :
    value === "combined" ? genCombined("level2") :
    value === "negatives" ? genNegatives() :
    value === "zero" ? genZero(kind) :
    value === "negative" ? genNegative(kind) :
    value === "reverse" ? genReverse() :
    value === "unitFraction" ? genUnitFraction(kind) :
    value === "generalFraction" ? genGeneralFraction(kind) :
    value === "combinedNegFrac" ? genNegativeFraction(kind) :
    genCalculator();
  return finish(build, "pr", level);
};

// ── 6. Index Laws ─────────────────────────────────────────────────────────────

// Level 3: two letters with coefficients — the numbers and each letter are dealt with separately.
const genTwoLetters = (law: string): Built => {
  const [u, v] = choose([["x", "y"], ["a", "b"], ["m", "n"], ["p", "q"]] as const);
  const pw = (l: string, e: number) => (e === 1 ? l : `${l}^{${e}}`);
  const term = (k: number, a: number, b: number) => `${k === 1 ? "" : k}${pw(u, a)}${pw(v, b)}`;
  if (law === "divide") {
    const dv = rnd(2, 5), k = rnd(2, 5), c = rnd(1, 4), a = c + rnd(1, 4), d = rnd(1, 4), b = d + rnd(1, 4);
    return {
      displayLatex: `${term(k * dv, a, b)} \\div ${term(dv, c, d)}`, answer: `${term(k, a - c, b - d)}`, answerLatex: `${term(k, a - c, b - d)}`,
      working: [
        step("Divide the numbers, then subtract the indices of each letter:", `${k * dv} \\div ${dv} = ${k}, \\quad ${u}^{${a}-${c}} = ${pw(u, a - c)}, \\quad ${v}^{${b}-${d}} = ${pw(v, b - d)}`),
        step("Answer:", `${term(k, a - c, b - d)}`),
      ],
    };
  }
  if (law === "powerOfPower") {
    const k = rnd(2, 3), e = rnd(2, 3), a = rnd(1, 4), b = rnd(1, 4);
    return {
      displayLatex: `(${term(k, a, b)})^{${e}}`, answer: `${term(k ** e, a * e, b * e)}`, answerLatex: `${term(k ** e, a * e, b * e)}`,
      working: [
        step("The outer power applies to the number and to each letter:", `(${term(k, a, b)})^{${e}} = ${k}^{${e}} \\times (${pw(u, a)})^{${e}} \\times (${pw(v, b)})^{${e}}`),
        step("Work out the number, and multiply the indices:", `= ${k ** e}${pw(u, a * e)}${pw(v, b * e)}`),
      ],
    };
  }
  if (law === "multiplyDivide") {
    for (let t = 0; t < 50; t++) {
      const k1 = rnd(2, 6), k2 = rnd(2, 6), divs = [2, 3, 4, 5, 6, 8, 9, 10, 12].filter((x) => (k1 * k2) % x === 0 && x < k1 * k2);
      if (!divs.length) continue;
      const dv = choose(divs), a = rnd(1, 4), c = rnd(1, 4), b = rnd(1, 4), d = rnd(1, 4), e = rnd(1, a + c - 1), f = rnd(1, b + d - 1);
      const top = k1 * k2, kk = top / dv;
      return {
        displayLatex: `\\dfrac{${term(k1, a, b)} \\times ${term(k2, c, d)}}{${term(dv, e, f)}}`, answer: `${term(kk, a + c - e, b + d - f)}`, answerLatex: `${term(kk, a + c - e, b + d - f)}`,
        working: [
          step("Multiply the top: multiply the numbers and add the indices of each letter:", `${term(k1, a, b)} \\times ${term(k2, c, d)} = ${term(top, a + c, b + d)}`),
          step("Divide by the bottom: divide the numbers and subtract the indices:", `\\dfrac{${term(top, a + c, b + d)}}{${term(dv, e, f)}} = ${term(kk, a + c - e, b + d - f)}`),
        ],
      };
    }
  }
  // multiply
  const k1 = rnd(2, 6), k2 = rnd(2, 6), a = rnd(1, 5), c = rnd(1, 5), b = rnd(1, 5), d = rnd(1, 5);
  return {
    displayLatex: `${term(k1, a, b)} \\times ${term(k2, c, d)}`, answer: `${term(k1 * k2, a + c, b + d)}`, answerLatex: `${term(k1 * k2, a + c, b + d)}`,
    working: [
      step("Multiply the numbers, then add the indices of each letter:", `${k1} \\times ${k2} = ${k1 * k2}, \\quad ${u}^{${a}+${c}} = ${pw(u, a + c)}, \\quad ${v}^{${b}+${d}} = ${pw(v, b + d)}`),
      step("Answer:", `${term(k1 * k2, a + c, b + d)}`),
    ],
  };
};

const genLawBuilt = (law: string, baseType: string, level: Level): Built => {
  const letter = choose(LETTERS);
  const b = baseType === "numeric" ? `${rnd(2, 9)}` : letter;
  const pow = (e: number) => `${b}^{${e}}`;
  if (baseType === "twoLetters") return genTwoLetters(law);

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
        ...(level === "level1" ? [step("The power says: write the bracket " + n + " times:", Array(n).fill(pow(m)).join(" \\times ")), step("Multiplying adds the indices:", `${b}^{${Array(n).fill(m).join("+")}} = ${pow(m * n)}`)] : []),
        step(level === "level1" ? "Adding " + m + " " + n + " times is " + m + " × " + n + ", so multiply the indices:" : "Multiply the indices:", `${m} \\times ${n} = ${m * n}, \\quad (${b}^{${m}})^{${n}} = ${b}^{${m * n}}`),
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
  const baseType = law.value === "combined" || law.value === "missingIndex" || level === "level2" ? "coefficients"
    : pickActive(ms, baseGroup!.options);
  if (level === "level3" && baseType === "numeric") return finish(genMultiBase(), "il", level);
  const built = genLawBuilt(law.value, baseType, level);
  built.prompt = lawPrompt(law.value, baseType);
  return finish(built, "il", level);
};

// ── 7. Negative & Zero Indices, and Fractional Indices ───────────────────────

const formOf = (ms: Record<string, boolean>, tool: string, level: Level): Form => {
  const g = groupOf(tool, level, "answerForm");
  return g && pickActive(ms, g.options) === "leave" ? "leave" : "positive";
};

const genSpecialPowers = (ms: Record<string, boolean>, level: Level): AnyQuestion => {
  const { value } = pickFrom(ms, "specialPowers", level, "questionPool");
  const g = groupOf("specialPowers", level, "negBases");
  const num = !!g && pickActive(ms, g.options) === "numbers";
  const nt = groupOf("specialPowers", level, "negNotation");
  const notation = nt && pickActive(ms, nt.options) === "fraction" ? "fraction" : "power";
  return finish(genNegZero(value, formOf(ms, "specialPowers", level), num, notation), "sp", level);
};

const genWritingIndices = (ms: Record<string, boolean>, level: Level): AnyQuestion => {
  const { value } = pickFrom(ms, "writingIndices", level, "questionPool");
  const g = groupOf("writingIndices", level, "writeBases");
  // Numbers is ignored while its requirement is unmet, and a coefficient question always uses a letter (3x⁻², never 3 × 5⁻²)
  const masked = maskUnmetOptions([WRITING_POOL[level], WRITING_BASES[level]], ms);
  const coefficient = value === "negativeCoef" || value === "coefRoots" || value === "coefNegFrac";
  const num = !!g && !coefficient && pickActive(masked, g.options) === "numbers";
  return finish(genWriting(value, num), "wi", level);
};

const genFractionalIndices = (ms: Record<string, boolean>, level: Level): AnyQuestion => {
  const { value } = pickFrom(ms, "fractionalIndices", level, "questionPool");
  return finish(genFractional(value, formOf(ms, "fractionalIndices", level)), "fi", level);
};

// ── 8. Common Base ────────────────────────────────────────────────────────────

const basesOn = (ms: Record<string, boolean>): number[] => {
  const on = BASE_OPTS.filter(o => ms[o.value] !== false).map(o => ({ two: 2, three: 3, five: 5, ten: 10 } as Record<string, number>)[o.value]);
  return on.length ? on : [2];
};

const genCommon = (ms: Record<string, boolean>, level: Level): AnyQuestion => {
  const { value } = pickFrom(ms, "commonBase", level, "questionPool");
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
      }, "cb", level);
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
    }, "cb", level);
  }
  if (value === "solveIndex") built.prompt = "Solve:";
  return finish(built, "cb", level);
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
  if (tool === "writingIndices") return genWritingIndices(ms, level);
  if (tool === "indexLaws") return genIndexLaws(ms, level);
  if (tool === "specialPowers") return genSpecialPowers(ms, level);
  if (tool === "fractionalIndices") return genFractionalIndices(ms, level);
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
