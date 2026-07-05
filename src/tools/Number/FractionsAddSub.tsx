import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type WorkingStep, type QOSnapshot,
  randInt, mStep, pickActive,
} from "../../shared";

// ── 1. Types ──────────────────────────────────────────────────────────────────

type ToolType = "fractions" | "mixedNumbers";

interface MixedFmt { whole: number; num: number; den: number; isMixed: boolean }

// Raw parameters stored on each question so reformatQuestion can rebuild the
// displayed answer/working when the Answer Format dropdown changes without
// regenerating the underlying maths.
interface RawValues {
  displayLatex: string;
  displayPlain: string;
  core: WorkingStep[];   // working steps down to the simplified improper fraction
  rawNum: number;        // simplified answer numerator
  rawDen: number;        // simplified answer denominator
  keyBase: string;       // parameter-based key for worksheet de-duplication
}

// ── 2. TOOL_CONFIG ────────────────────────────────────────────────────────────

const OPS_MS = {
  key: "operations",
  label: "Operations",
  options: [
    { value: "add",      label: "Addition",    defaultActive: true  },
    { value: "subtract", label: "Subtraction", defaultActive: false },
  ],
};

// Fractions default to improper answers; mixed numbers default to mixed-number
// answers (the conventional form students give), so each sub-tool gets its own
// dropdown with a different default.
const makeFormatDD = (defaultValue: string) => ({
  key: "format", label: "Answer Format",
  options: [{ value: "improper", label: "Improper" }, { value: "mixed", label: "Mixed Number" }],
  defaultValue,
});
const FORMAT_DD = makeFormatDD("improper");
const FORMAT_DD_MIXED = makeFormatDD("mixed");

const ANS_LT1_VAR       = { key: "answerLessThanOne", label: "Answer < 1",       defaultValue: false };
const CARRY_VAR         = { key: "requiresCarrying",  label: "Requires Carrying", defaultValue: false };
const EXTENDED_VAR      = { key: "extendedRange",     label: "Extended Range",    defaultValue: false };

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Adding & Subtracting Fractions",
  tools: {

    fractions: {
      name: "Fractions",
      instruction: "Work out:",
      variables: [ANS_LT1_VAR],
      dropdown: FORMAT_DD,
      multiSelect: OPS_MS,
      difficultySettings: {
        level3: { variables: [ANS_LT1_VAR, EXTENDED_VAR] },
      },
    },

    mixedNumbers: {
      name: "Mixed Numbers",
      instruction: "Work out:",
      variables: [CARRY_VAR],
      dropdown: FORMAT_DD_MIXED,
      multiSelect: OPS_MS,
      difficultySettings: {
        level3: { variables: [CARRY_VAR, EXTENDED_VAR] },
      },
    },

  },
};

// ── 3. INFO_SECTIONS ─────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  { title: "Fractions", icon: "➕", content: [
    { label: "Overview",         detail: "Generates fraction addition and subtraction questions. Use the Operations option to include Addition, Subtraction, or both." },
    { label: "Level 1 — Green",  detail: "Both fractions share the same denominator. Students add or subtract the numerators directly and simplify if needed." },
    { label: "Level 2 — Yellow", detail: "One denominator is a direct multiple of the other. Students scale up the smaller-denominator fraction before calculating." },
    { label: "Level 3 — Red",    detail: "Both denominators are unrelated, requiring LCM conversion. Standard uses denominators 2–10; Extended Range uses denominators 2–15." },
  ]},
  { title: "Mixed Numbers", icon: "🔢", content: [
    { label: "Overview",         detail: "Generates mixed number addition and subtraction questions using the convert-to-improper-fraction method." },
    { label: "Level 1 — Green",  detail: "Same denominator. Students convert to improper fractions, calculate, then convert back." },
    { label: "Level 2 — Yellow", detail: "One denominator is a direct multiple of the other. Convert to improper fractions, scale, then calculate." },
    { label: "Level 3 — Red",    detail: "Unrelated denominators requiring LCM conversion. Standard keeps the LCM below 100; Extended Range allows an LCM up to 225." },
    { label: "Requires Carrying", detail: "When off (default), subtraction questions are generated so no borrowing from the whole number is needed. When on, borrowing may be required." },
  ]},
  { title: "Question Options", icon: "⚙️", content: [
    { label: "Operations",       detail: "Choose Addition, Subtraction, or both. With both active, questions are a random mix." },
    { label: "Answer Format",    detail: "Improper shows the answer as a top-heavy fraction; Mixed Number converts an improper answer to a whole number and fraction." },
    { label: "Answer < 1",       detail: "Fractions only. Keeps every answer below 1 (a proper fraction)." },
    { label: "Extended Range",   detail: "Level 3 only. Allows larger denominators and lowest common multiples for harder questions." },
    { label: "Differentiated",   detail: "Worksheet mode produces three columns — one per level — simultaneously." },
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard",       detail: "Single large question with blank working space. Ideal for whole-class teaching." },
    { label: "Worked Example",   detail: "Question with a full step-by-step solution revealed on demand." },
    { label: "Worksheet",        detail: "Grid of questions with adjustable columns and count, plus PDF export." },
  ]},
];

// ── 4. Maths helpers ──────────────────────────────────────────────────────────

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const lcm = (a: number, b: number): number => (a * b) / gcd(a, b);
const simplify = (n: number, d: number): [number, number] => { const g = gcd(n, d) || 1; return [n / g, d / g]; };
const toMixed = (n: number, d: number): MixedFmt => { const w = Math.floor(n / d), r = n % d; return { whole: w, num: r, den: d, isMixed: w > 0 && r > 0 }; };

// LaTeX / plain-text builders
const fracL = (n: number, d: number): string => (d === 1 ? `${n}` : `\\dfrac{${n}}{${d}}`);
const fracP = (n: number, d: number): string => (d === 1 ? `${n}` : `${n}/${d}`);
const mixedL = (f: MixedFmt): string => (f.whole === 0 ? fracL(f.num, f.den) : f.num === 0 ? `${f.whole}` : `${f.whole}\\dfrac{${f.num}}{${f.den}}`);
const mixedP = (f: MixedFmt): string => (f.whole === 0 ? fracP(f.num, f.den) : f.num === 0 ? `${f.whole}` : `${f.whole} ${f.num}/${f.den}`);

const ansParts = (sn: number, sd: number, isMixedFmt: boolean): { latex: string; plain: string } => {
  if (sn === 0) return { latex: "0", plain: "0" };
  if (sd === 1) return { latex: `${sn}`, plain: `${sn}` };
  if (isMixedFmt && sn > sd) { const m = toMixed(sn, sd); return { latex: mixedL(m), plain: mixedP(m) }; }
  return { latex: fracL(sn, sd), plain: fracP(sn, sd) };
};

// Combine the fixed core working with the format-dependent tail (convert back
// to a mixed number) and the formatted answer.
const buildAnswerWorking = (rv: RawValues, isMixedFmt: boolean): { answer: string; answerLatex: string; working: WorkingStep[] } => {
  const ans = ansParts(rv.rawNum, rv.rawDen, isMixedFmt);
  const working = [...rv.core];
  if (isMixedFmt && rv.rawNum > rv.rawDen && rv.rawDen !== 1) {
    working.push(mStep("Convert back to a mixed number:", `\\dfrac{${rv.rawNum}}{${rv.rawDen}} = ${ans.latex}`));
  }
  return { answer: ans.plain, answerLatex: ans.latex, working };
};

const opLatex = (isAdd: boolean) => (isAdd ? "+" : "-");
const addOrSubLabel = (isAdd: boolean) => `${isAdd ? "Add" : "Subtract"} the numerators:`;

// A simplify working step, or nothing when the fraction is already in lowest terms.
const simplifyStep = (raw: number, den: number, sn: number, sd: number): WorkingStep[] =>
  sd !== den && raw !== 0 ? [mStep(`Simplify (÷${gcd(raw, den)}):`, `\\dfrac{${raw}}{${den}} = ${fracL(sn, sd)}`)] : [];

// ── 5. Core generators (produce RawValues, format-independent) ─────────────────

const generateFractionCore = (level: DifficultyLevel, variables: Record<string, boolean>, isAdd: boolean): RawValues => {
  const opL = opLatex(isAdd);
  const extended = variables["extendedRange"] || false;
  const ansLT1 = variables["answerLessThanOne"] || false;

  for (let attempt = 0; attempt < 500; attempt++) {

    if (level === "level1") {
      const den = randInt(3, 10);
      let num1 = randInt(1, den - 1);
      let num2 = randInt(1, den - 1);
      if (num1 === num2) continue;
      if (!isAdd && num1 < num2) { [num1, num2] = [num2, num1]; }
      if (isAdd && num1 + num2 === den && Math.random() < 0.8) continue;
      const raw = isAdd ? num1 + num2 : num1 - num2;
      if (ansLT1 && raw >= den) continue;
      const [sn, sd] = simplify(raw, den);
      const core: WorkingStep[] = [
        mStep(`Same denominator — ${addOrSubLabel(isAdd)}`,
          `${fracL(num1, den)} ${opL} ${fracL(num2, den)} = \\dfrac{${num1} ${opL} ${num2}}{${den}} = \\dfrac{${raw}}{${den}}`),
        ...simplifyStep(raw, den, sn, sd),
      ];
      return {
        displayLatex: `${fracL(num1, den)} ${opL} ${fracL(num2, den)}`,
        displayPlain: `${fracP(num1, den)} ${isAdd ? "+" : "-"} ${fracP(num2, den)}`,
        core, rawNum: sn, rawDen: sd, keyBase: `${num1}-${den}-${num2}-${den}-${isAdd ? "a" : "s"}`,
      };
    }

    if (level === "level2") {
      const base = randInt(2, 10);
      const mult = randInt(2, 8);
      let den1 = base, den2 = base * mult;
      if (Math.random() < 0.5) { [den1, den2] = [den2, den1]; }
      const smallD = Math.min(den1, den2), largeD = Math.max(den1, den2), m = largeD / smallD;
      let num1 = randInt(1, den1 - 1);
      let num2 = randInt(1, den2 - 1);
      if (!isAdd && num1 / den1 < num2 / den2) { [num1, den1, num2, den2] = [num2, den2, num1, den1]; }
      const sc1 = den1 === smallD ? num1 * m : num1;
      const sc2 = den1 === smallD ? num2 : num2 * m;
      const raw = isAdd ? sc1 + sc2 : sc1 - sc2;
      if (ansLT1 && raw >= largeD) continue;
      const [sn, sd] = simplify(raw, largeD);
      const core: WorkingStep[] = [
        mStep("Write over a common denominator:",
          `${fracL(num1, den1)} ${opL} ${fracL(num2, den2)} = \\dfrac{${sc1}}{${largeD}} ${opL} \\dfrac{${sc2}}{${largeD}}`),
        mStep(addOrSubLabel(isAdd), `\\dfrac{${sc1}}{${largeD}} ${opL} \\dfrac{${sc2}}{${largeD}} = \\dfrac{${raw}}{${largeD}}`),
        ...simplifyStep(raw, largeD, sn, sd),
      ];
      return {
        displayLatex: `${fracL(num1, den1)} ${opL} ${fracL(num2, den2)}`,
        displayPlain: `${fracP(num1, den1)} ${isAdd ? "+" : "-"} ${fracP(num2, den2)}`,
        core, rawNum: sn, rawDen: sd, keyBase: `${num1}-${den1}-${num2}-${den2}-${isAdd ? "a" : "s"}`,
      };
    }

    // level3 — unrelated denominators, LCM conversion
    const maxD = extended ? 15 : 10;
    let den1 = randInt(2, maxD);
    let den2 = randInt(2, maxD);
    if (den1 === den2 || gcd(den1, den2) !== 1) continue;
    const cl = lcm(den1, den2);
    if (!extended && cl >= 100) continue;
    if (extended && (cl < 65 || cl >= 225)) continue;
    let num1 = randInt(1, den1 - 1);
    let num2 = randInt(1, den2 - 1);
    if (!isAdd && num1 / den1 < num2 / den2) { [num1, den1, num2, den2] = [num2, den2, num1, den1]; }
    const m1 = cl / den1, m2 = cl / den2;
    const sc1 = num1 * m1, sc2 = num2 * m2;
    const raw = isAdd ? sc1 + sc2 : sc1 - sc2;
    if (ansLT1 && raw >= cl) continue;
    const [sn, sd] = simplify(raw, cl);
    const core: WorkingStep[] = [
      mStep(`LCM of ${den1} and ${den2}:`, `${cl}`),
      mStep("Rewrite over the common denominator:",
        `${fracL(num1, den1)} = \\dfrac{${sc1}}{${cl}}, \\quad ${fracL(num2, den2)} = \\dfrac{${sc2}}{${cl}}`),
      mStep(addOrSubLabel(isAdd), `\\dfrac{${sc1}}{${cl}} ${opL} \\dfrac{${sc2}}{${cl}} = \\dfrac{${raw}}{${cl}}`),
      ...simplifyStep(raw, cl, sn, sd),
    ];
    return {
      displayLatex: `${fracL(num1, den1)} ${opL} ${fracL(num2, den2)}`,
      displayPlain: `${fracP(num1, den1)} ${isAdd ? "+" : "-"} ${fracP(num2, den2)}`,
      core, rawNum: sn, rawDen: sd, keyBase: `${num1}-${den1}-${num2}-${den2}-${isAdd ? "a" : "s"}`,
    };
  }

  // Fallback (should never be reached)
  return {
    displayLatex: `\\dfrac{1}{4} + \\dfrac{1}{4}`, displayPlain: "1/4 + 1/4",
    core: [mStep("Same denominator — add the numerators:", `\\dfrac{1}{4} + \\dfrac{1}{4} = \\dfrac{2}{4}`)],
    rawNum: 1, rawDen: 2, keyBase: `1-4-1-4-a`,
  };
};

const generateMixedCore = (level: DifficultyLevel, variables: Record<string, boolean>, isAdd: boolean): RawValues => {
  const opL = opLatex(isAdd);
  const extended = variables["extendedRange"] || false;
  const requiresCarrying = variables["requiresCarrying"] || false;
  const noRegroup = !isAdd && !requiresCarrying;

  const pickWhole = () => (Math.random() < 0.25 ? 0 : randInt(1, 3));
  const convertStep = (f: MixedFmt, num: number): WorkingStep[] =>
    f.whole > 0
      ? [mStep(`Convert ${mixedP(f)} to an improper fraction:`,
          `${f.whole}\\dfrac{${f.num}}{${f.den}} = \\dfrac{${f.whole} \\times ${f.den} + ${f.num}}{${f.den}} = \\dfrac{${num}}{${f.den}}`)]
      : [];

  for (let attempt = 0; attempt < 500; attempt++) {

    if (level === "level1") {
      const den = randInt(3, 10);
      const w1 = pickWhole(), w2 = pickWhole();
      if (w1 === 0 && w2 === 0) continue;
      let mNum1 = randInt(1, den - 1), mNum2 = randInt(1, den - 1);
      if (mNum1 === mNum2 && w1 === w2) continue;
      let num1 = w1 * den + mNum1, num2 = w2 * den + mNum2;
      let fw1 = w1, fw2 = w2, fm1 = mNum1, fm2 = mNum2;
      if (!isAdd && num1 < num2) { [num1, num2, fw1, fw2, fm1, fm2] = [num2, num1, w2, w1, mNum2, mNum1]; }
      if (noRegroup && fm1 <= fm2) continue;
      const raw = isAdd ? num1 + num2 : num1 - num2;
      const [sn, sd] = simplify(raw, den);
      const f1: MixedFmt = { whole: fw1, num: fm1, den, isMixed: fw1 > 0 };
      const f2: MixedFmt = { whole: fw2, num: fm2, den, isMixed: fw2 > 0 };
      const core: WorkingStep[] = [
        ...convertStep(f1, num1),
        ...convertStep(f2, num2),
        mStep(`Same denominator — ${addOrSubLabel(isAdd)}`,
          `\\dfrac{${num1}}{${den}} ${opL} \\dfrac{${num2}}{${den}} = \\dfrac{${raw}}{${den}}`),
        ...simplifyStep(raw, den, sn, sd),
      ];
      return {
        displayLatex: `${mixedL(f1)} ${opL} ${mixedL(f2)}`,
        displayPlain: `${mixedP(f1)} ${isAdd ? "+" : "-"} ${mixedP(f2)}`,
        core, rawNum: sn, rawDen: sd, keyBase: `${num1}-${den}-${num2}-${den}-${isAdd ? "a" : "s"}`,
      };
    }

    if (level === "level2") {
      const base = randInt(2, 7);
      const mult = randInt(2, 4);
      let den1 = base, den2 = base * mult;
      if (Math.random() < 0.5) { [den1, den2] = [den2, den1]; }
      const smallD = Math.min(den1, den2), largeD = Math.max(den1, den2), m = largeD / smallD;
      const w1 = pickWhole(), w2 = pickWhole();
      if (w1 === 0 && w2 === 0) continue;
      let fm1 = randInt(1, den1 - 1), fm2 = randInt(1, den2 - 1);
      let num1 = w1 * den1 + fm1, num2 = w2 * den2 + fm2;
      let fw1 = w1, fw2 = w2, fd1 = den1, fd2 = den2;
      if (!isAdd && num1 / den1 < num2 / den2) { [num1, fd1, num2, fd2, fw1, fw2, fm1, fm2] = [num2, den2, num1, den1, w2, w1, fm2, fm1]; }
      const sc1 = fd1 === smallD ? num1 * m : num1;
      const sc2 = fd1 === smallD ? num2 : num2 * m;
      const scaledFm1 = fm1 * (largeD / fd1), scaledFm2 = fm2 * (largeD / fd2);
      if (noRegroup && scaledFm1 <= scaledFm2) continue;
      const raw = isAdd ? sc1 + sc2 : sc1 - sc2;
      const [sn, sd] = simplify(raw, largeD);
      const f1: MixedFmt = { whole: fw1, num: fm1, den: fd1, isMixed: fw1 > 0 };
      const f2: MixedFmt = { whole: fw2, num: fm2, den: fd2, isMixed: fw2 > 0 };
      const core: WorkingStep[] = [
        ...convertStep(f1, num1),
        ...convertStep(f2, num2),
        mStep("Write over a common denominator:",
          `\\dfrac{${num1}}{${fd1}} ${opL} \\dfrac{${num2}}{${fd2}} = \\dfrac{${sc1}}{${largeD}} ${opL} \\dfrac{${sc2}}{${largeD}}`),
        mStep(addOrSubLabel(isAdd), `\\dfrac{${sc1}}{${largeD}} ${opL} \\dfrac{${sc2}}{${largeD}} = \\dfrac{${raw}}{${largeD}}`),
        ...simplifyStep(raw, largeD, sn, sd),
      ];
      return {
        displayLatex: `${mixedL(f1)} ${opL} ${mixedL(f2)}`,
        displayPlain: `${mixedP(f1)} ${isAdd ? "+" : "-"} ${mixedP(f2)}`,
        core, rawNum: sn, rawDen: sd, keyBase: `${num1}-${fd1}-${num2}-${fd2}-${isAdd ? "a" : "s"}`,
      };
    }

    // level3 — unrelated denominators
    const maxD = extended ? 15 : 10, maxLCM = extended ? 225 : 100, minLCM = extended ? 65 : 0;
    let den1 = randInt(2, maxD), den2 = randInt(2, maxD);
    if (den1 === den2 || gcd(den1, den2) !== 1) continue;
    const cl = lcm(den1, den2);
    if (cl > maxLCM || cl <= minLCM) continue;
    const w1 = pickWhole(), w2 = pickWhole();
    if (w1 === 0 && w2 === 0) continue;
    let fm1 = randInt(1, den1 - 1), fm2 = randInt(1, den2 - 1);
    let num1 = w1 * den1 + fm1, num2 = w2 * den2 + fm2;
    let fw1 = w1, fw2 = w2, fd1 = den1, fd2 = den2;
    if (!isAdd && num1 / den1 < num2 / den2) { [num1, fd1, num2, fd2, fw1, fw2, fm1, fm2] = [num2, den2, num1, den1, w2, w1, fm2, fm1]; }
    const scaledFm1 = fm1 * (cl / fd1), scaledFm2 = fm2 * (cl / fd2);
    if (noRegroup && scaledFm1 <= scaledFm2) continue;
    const sc1 = num1 * (cl / fd1), sc2 = num2 * (cl / fd2);
    const raw = isAdd ? sc1 + sc2 : sc1 - sc2;
    const [sn, sd] = simplify(raw, cl);
    const f1: MixedFmt = { whole: fw1, num: fm1, den: fd1, isMixed: fw1 > 0 };
    const f2: MixedFmt = { whole: fw2, num: fm2, den: fd2, isMixed: fw2 > 0 };
    const core: WorkingStep[] = [
      ...convertStep(f1, num1),
      ...convertStep(f2, num2),
      mStep(`LCM of ${fd1} and ${fd2}:`, `${cl}`),
      mStep("Rewrite over the common denominator:",
        `\\dfrac{${num1}}{${fd1}} = \\dfrac{${sc1}}{${cl}}, \\quad \\dfrac{${num2}}{${fd2}} = \\dfrac{${sc2}}{${cl}}`),
      mStep(addOrSubLabel(isAdd), `\\dfrac{${sc1}}{${cl}} ${opL} \\dfrac{${sc2}}{${cl}} = \\dfrac{${raw}}{${cl}}`),
      ...simplifyStep(raw, cl, sn, sd),
    ];
    return {
      displayLatex: `${mixedL(f1)} ${opL} ${mixedL(f2)}`,
      displayPlain: `${mixedP(f1)} ${isAdd ? "+" : "-"} ${mixedP(f2)}`,
      core, rawNum: sn, rawDen: sd, keyBase: `${num1}-${fd1}-${num2}-${fd2}-${isAdd ? "a" : "s"}`,
    };
  }

  // Fallback (should never be reached)
  return {
    displayLatex: `1\\dfrac{1}{2} + 1\\dfrac{1}{2}`, displayPlain: "1 1/2 + 1 1/2",
    core: [mStep("Same denominator — add the numerators:", `\\dfrac{3}{2} + \\dfrac{3}{2} = \\dfrac{6}{2}`)],
    rawNum: 3, rawDen: 1, keyBase: `3-2-3-2-a`,
  };
};

// ── 6. generateQuestion ───────────────────────────────────────────────────────

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string,
  multiSelectValues?: Record<string, boolean>,
): AnyQuestion => {
  const t = tool as ToolType;
  const active = pickActive(multiSelectValues ?? {}, OPS_MS.options);
  const isAdd = active !== "subtract";

  const rv = t === "fractions"
    ? generateFractionCore(level, variables, isAdd)
    : generateMixedCore(level, variables, isAdd);

  const isMixedFmt = dropdownValue === "mixed";
  const { answer, answerLatex, working } = buildAnswerWorking(rv, isMixedFmt);

  return {
    kind: "simple",
    display: rv.displayPlain,
    displayLatex: rv.displayLatex,
    answer,
    answerLatex,
    working,
    _rawValues: rv,
    key: `${t}-${level}-${rv.keyBase}`,
    difficulty: level,
  } as unknown as AnyQuestion;
};

// ── 7. reformatQuestion — instant Answer Format switch ─────────────────────────

const reformatQuestion = (q: AnyQuestion, qo: QOSnapshot): AnyQuestion | null => {
  const rv = (q as any)._rawValues as RawValues | undefined;
  if (!rv) return null;
  const { answer, answerLatex, working } = buildAnswerWorking(rv, qo.dropdownValue === "mixed");
  return { ...q, answer, answerLatex, working } as unknown as AnyQuestion;
};

// ─────────────────────────────────────────────────────────────────────────────

// Exposed for the generator smoke-test suite (src/tests/generators.test.ts).
export const __test = { TOOL_CONFIG, generateQuestion };

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      reformatQuestion={reformatQuestion}
      defaults={{ numQuestions: 12, numColumns: 3 }}
    />
  );
}
