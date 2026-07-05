import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type WorkingStep, type QOSnapshot,
  randInt, mStep, pickActive,
} from "../../shared";

// ── 1. Types ──────────────────────────────────────────────────────────────────

type ToolType = "multFractions" | "multMixed";

interface MixedFmt { whole: number; num: number; den: number; isMixed: boolean }

// Raw parameters stored on each question so reformatQuestion can rebuild the
// displayed answer/working when the Answer Format dropdown changes without
// regenerating the underlying maths.
interface RawValues {
  displayLatex: string;
  displayPlain: string;
  core: WorkingStep[];   // working down to the simplified improper fraction
  rawNum: number;
  rawDen: number;
  keyBase: string;
}

// ── 2. TOOL_CONFIG ────────────────────────────────────────────────────────────

const OPS_MS = {
  key: "operations",
  label: "Operations",
  options: [
    { value: "multiply", label: "Multiply", defaultActive: true  },
    { value: "divide",   label: "Divide",   defaultActive: false },
  ],
};

const makeFormatDD = (defaultValue: string) => ({
  key: "format", label: "Answer Format",
  options: [{ value: "improper", label: "Improper" }, { value: "mixed", label: "Mixed Number" }],
  defaultValue,
});
const FORMAT_DD       = makeFormatDD("improper");
const FORMAT_DD_MIXED = makeFormatDD("mixed");

const UNIT_VAR     = { key: "unitFraction",         label: "Include Unit Fraction",  defaultValue: false };
const INT_DIV_VAR  = { key: "noIntDiv",             label: "Allow Integer ÷ Integer", defaultValue: true };
const HARDER_VAR   = { key: "harderMultiplication", label: "Harder Multiplication",  defaultValue: false };

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Multiplying & Dividing Fractions",
  tools: {

    multFractions: {
      name: "Fractions",
      instruction: "Work out:",
      variables: [],
      dropdown: FORMAT_DD,
      multiSelect: OPS_MS,
      difficultySettings: {
        level1: { variables: [UNIT_VAR] },
        level3: { variables: [INT_DIV_VAR] },
      },
    },

    multMixed: {
      name: "Mixed Numbers",
      instruction: "Work out:",
      variables: [],
      dropdown: FORMAT_DD_MIXED,
      multiSelect: OPS_MS,
      difficultySettings: {
        level3: { variables: [HARDER_VAR] },
      },
    },

  },
};

// ── 3. INFO_SECTIONS ─────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  { title: "Fractions", icon: "×", content: [
    { label: "Overview",         detail: "Fraction multiplication and division. Use the Operations option to include Multiply, Divide, or both." },
    { label: "Division method",  detail: "Division uses Keep, Flip, Change: keep the first fraction, flip the second, change ÷ to ×, then multiply." },
    { label: "Level 1 — Green",  detail: "Two proper fractions whose product does not simplify. Turn on \"Include Unit Fraction\" to force a numerator of 1." },
    { label: "Level 2 — Yellow", detail: "Two proper fractions whose product can be simplified. Multiply, then simplify with the HCF." },
    { label: "Level 3 — Red",    detail: "A fraction multiplied or divided by an integer. The integer is written over 1 first. \"Allow Integer ÷ Integer\" (on) permits divisions that reduce to a whole ÷ whole." },
  ]},
  { title: "Mixed Numbers", icon: "🔢", content: [
    { label: "Overview",         detail: "Mixed number multiplication and division. Every question converts to improper fractions first; division uses Keep, Flip, Change." },
    { label: "Level 1 — Green",  detail: "A proper fraction multiplied or divided by a mixed number (either order). Numbers kept small." },
    { label: "Level 2 — Yellow", detail: "A mixed number multiplied or divided by a whole number (either order)." },
    { label: "Level 3 — Red",    detail: "Two mixed numbers. Default: whole parts 1–3, denominators 2–5. Turn on \"Harder Multiplication\" to extend to whole parts 1–8 and denominators 2–10." },
  ]},
  { title: "Question Options", icon: "⚙️", content: [
    { label: "Operations",       detail: "Choose Multiply, Divide, or both. With both active, questions are a random mix." },
    { label: "Answer Format",    detail: "Improper shows a top-heavy fraction; Mixed Number converts an improper answer to a whole number and fraction. Mixed Numbers defaults to Mixed Number." },
    { label: "Differentiated",   detail: "Worksheet mode produces three columns — one per level — simultaneously." },
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard",       detail: "Single large question with blank working space. Ideal for whole-class teaching." },
    { label: "Worked Example",   detail: "Question with a full step-by-step solution revealed on demand." },
    { label: "Worksheet",        detail: "Grid of questions with adjustable columns and count, plus PDF export." },
  ]},
];

// ── 4. Maths + latex helpers ──────────────────────────────────────────────────

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const simplify = (n: number, d: number): [number, number] => { const g = gcd(n, d) || 1; return [n / g, d / g]; };
const toMixed = (n: number, d: number): MixedFmt => { const w = Math.floor(n / d), r = n % d; return { whole: w, num: r, den: d, isMixed: w > 0 && r > 0 }; };

const fracL = (n: number, d: number): string => (d === 1 ? `${n}` : `\\dfrac{${n}}{${d}}`);
const fracP = (n: number, d: number): string => (d === 1 ? `${n}` : `${n}/${d}`);
const mixedL = (f: MixedFmt): string => (f.whole === 0 ? fracL(f.num, f.den) : f.num === 0 ? `${f.whole}` : `${f.whole}\\dfrac{${f.num}}{${f.den}}`);
const mixedP = (f: MixedFmt): string => (f.whole === 0 ? fracP(f.num, f.den) : f.num === 0 ? `${f.whole}` : `${f.whole} ${f.num}/${f.den}`);

const opD = (isDiv: boolean) => (isDiv ? "\\div" : "\\times");
const opP = (isDiv: boolean) => (isDiv ? "÷" : "×");

const ansParts = (sn: number, sd: number, isMixedFmt: boolean): { latex: string; plain: string } => {
  if (sn === 0) return { latex: "0", plain: "0" };
  if (sd === 1) return { latex: `${sn}`, plain: `${sn}` };
  if (isMixedFmt && sn > sd) { const m = toMixed(sn, sd); return { latex: mixedL(m), plain: mixedP(m) }; }
  return { latex: fracL(sn, sd), plain: fracP(sn, sd) };
};

// Multiply two fractions (aN/aD) × (bN/bD): the "multiply across then simplify"
// steps plus the simplified result.
const multiplySteps = (aN: number, aD: number, bN: number, bD: number): { steps: WorkingStep[]; sn: number; sd: number } => {
  const rawN = aN * bN, rawD = aD * bD;
  const [sn, sd] = simplify(rawN, rawD);
  const g = gcd(rawN, rawD);
  const steps: WorkingStep[] = [
    mStep("Multiply the numerators and denominators:",
      `${fracL(aN, aD)} \\times ${fracL(bN, bD)} = \\dfrac{${aN} \\times ${bN}}{${aD} \\times ${bD}} = ${fracL(rawN, rawD)}`),
  ];
  if (g > 1) steps.push(mStep(`Simplify (÷${g}):`, `${fracL(rawN, rawD)} = ${fracL(sn, sd)}`));
  return { steps, sn, sd };
};

// Divide (aN/aD) ÷ (bN/bD): Keep-Flip-Change, then multiply.
const divideSteps = (aN: number, aD: number, bN: number, bD: number): { steps: WorkingStep[]; sn: number; sd: number } => {
  const kfc = mStep("Keep, flip, change:",
    `${fracL(aN, aD)} \\div ${fracL(bN, bD)} = ${fracL(aN, aD)} \\times ${fracL(bD, bN)}`);
  const m = multiplySteps(aN, aD, bD, bN);
  return { steps: [kfc, ...m.steps], sn: m.sn, sd: m.sd };
};

// The operator steps for the two displayed operands (as fractions).
const opSteps = (isDiv: boolean, aN: number, aD: number, bN: number, bD: number) =>
  isDiv ? divideSteps(aN, aD, bN, bD) : multiplySteps(aN, aD, bN, bD);

const convertMixedStep = (f: MixedFmt, imp: number): WorkingStep =>
  mStep(`Convert ${mixedP(f)} to an improper fraction:`,
    `\\dfrac{${f.whole} \\times ${f.den} + ${f.num}}{${f.den}} = \\dfrac{${imp}}{${f.den}}`);

const writeIntStep = (n: number): WorkingStep =>
  mStep("Write the integer as a fraction:", `${n} = \\dfrac{${n}}{1}`);

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

const rvOf = (displayLatex: string, displayPlain: string, core: WorkingStep[], rawNum: number, rawDen: number, keyBase: string): RawValues =>
  ({ displayLatex, displayPlain, core, rawNum, rawDen, keyBase });

// ── 5. Fractions generator ────────────────────────────────────────────────────

const generateMultFractionCore = (level: DifficultyLevel, variables: Record<string, boolean>, isDiv: boolean): RawValues => {
  for (let attempt = 0; attempt < 500; attempt++) {

    if (level === "level1" || level === "level2") {
      const den1 = randInt(2, 12), den2 = randInt(2, 12);
      let n1: number, n2: number;

      if (level === "level1") {
        if (den1 === den2) continue;
        const forceUnit = variables["unitFraction"] || false;
        if (forceUnit) {
          if (Math.random() < 0.2) { n1 = 1; n2 = 1; }
          else if (Math.random() < 0.5) { n1 = 1; n2 = den2 > 2 ? randInt(2, den2 - 1) : 1; }
          else { n1 = den1 > 2 ? randInt(2, den1 - 1) : 1; n2 = 1; }
        } else {
          n1 = randInt(1, den1 - 1); n2 = randInt(1, den2 - 1);
          if (n1 === 1 && n2 === 1 && Math.random() > 0.2) continue;
        }
        if (gcd(n1 * n2, den1 * den2) !== 1) continue;   // level 1: product must NOT simplify
        if (den1 * den2 > 144) continue;
      } else {
        n1 = randInt(1, den1 - 1); n2 = randInt(1, den2 - 1);
        if (gcd(n1 * n2, den1 * den2) <= 1) continue;     // level 2: product MUST simplify
        if (den1 * den2 > 144) continue;
      }

      const bN = isDiv ? den2 : n2, bD = isDiv ? n2 : den2;   // the displayed divisor is den2/n2
      const tail = opSteps(isDiv, n1, den1, bN, bD);
      const displayLatex = `${fracL(n1, den1)} ${opD(isDiv)} ${fracL(bN, bD)}`;
      const displayPlain = `${fracP(n1, den1)} ${opP(isDiv)} ${fracP(bN, bD)}`;
      return rvOf(displayLatex, displayPlain, tail.steps, tail.sn, tail.sd,
        `f${level === "level1" ? 1 : 2}-${n1}-${den1}-${n2}-${den2}-${isDiv ? "d" : "m"}`);
    }

    // level3: integer × or ÷ fraction
    const den = randInt(2, 12), num = randInt(1, den - 1), intVal = randInt(2, 10);
    if (intVal === den) continue;
    if (isDiv && !(variables["noIntDiv"] ?? true) && num === 1) continue;
    const flip = Math.random() < 0.5;

    let leftL: string, rightL: string, leftP: string, rightP: string;
    let tail: { steps: WorkingStep[]; sn: number; sd: number };

    if (!isDiv) {
      if (flip) { tail = opSteps(false, num, den, intVal, 1); leftL = fracL(num, den); rightL = `${intVal}`; leftP = fracP(num, den); rightP = `${intVal}`; }
      else      { tail = opSteps(false, intVal, 1, num, den); leftL = `${intVal}`; rightL = fracL(num, den); leftP = `${intVal}`; rightP = fracP(num, den); }
    } else {
      if (flip) { tail = opSteps(true, den, num, intVal, 1); leftL = fracL(den, num); rightL = `${intVal}`; leftP = fracP(den, num); rightP = `${intVal}`; }
      else      { tail = opSteps(true, intVal, 1, den, num); leftL = `${intVal}`; rightL = fracL(den, num); leftP = `${intVal}`; rightP = fracP(den, num); }
    }

    const core = [writeIntStep(intVal), ...tail.steps];
    const displayLatex = `${leftL} ${opD(isDiv)} ${rightL}`;
    const displayPlain = `${leftP} ${opP(isDiv)} ${rightP}`;
    return rvOf(displayLatex, displayPlain, core, tail.sn, tail.sd,
      `f3-${intVal}-${num}-${den}-${flip ? "f" : "n"}-${isDiv ? "d" : "m"}`);
  }

  // Fallback (should never be reached)
  const t = multiplySteps(2, 3, 1, 4);
  return rvOf("\\dfrac{2}{3} \\times \\dfrac{1}{4}", "2/3 × 1/4", t.steps, t.sn, t.sd, "f1-2-3-1-4-m");
};

// ── 6. Mixed numbers generator ────────────────────────────────────────────────

const generateMultMixedCore = (level: DifficultyLevel, variables: Record<string, boolean>, isDiv: boolean): RawValues => {
  for (let attempt = 0; attempt < 500; attempt++) {

    if (level === "level1") {
      const den1 = randInt(2, 6), num1 = randInt(1, den1 - 1);
      const whole2 = randInt(1, 3), den2 = randInt(2, 6), num2 = randInt(1, den2 - 1);
      if (gcd(num1, den1) !== 1 || gcd(num2, den2) !== 1) continue;   // keep operands in lowest terms
      const imp2N = whole2 * den2 + num2, imp2D = den2;
      const frac1: MixedFmt = { whole: 0, num: num1, den: den1, isMixed: false };
      const fmt2: MixedFmt = { whole: whole2, num: num2, den: den2, isMixed: true };
      const flip = Math.random() < 0.5;
      const conv = convertMixedStep(fmt2, imp2N);

      let tail: { steps: WorkingStep[]; sn: number; sd: number };
      let leftL: string, rightL: string, leftP: string, rightP: string;

      if (!isDiv) {
        if (num1 * imp2N > 60 || den1 * imp2D > 60) continue;
        if (flip) { tail = opSteps(false, imp2N, imp2D, num1, den1); leftL = mixedL(fmt2); rightL = mixedL(frac1); leftP = mixedP(fmt2); rightP = mixedP(frac1); }
        else      { tail = opSteps(false, num1, den1, imp2N, imp2D); leftL = mixedL(frac1); rightL = mixedL(fmt2); leftP = mixedP(frac1); rightP = mixedP(fmt2); }
      } else {
        if (!flip) { if (num1 * imp2D > 60 || den1 * imp2N > 60) continue; tail = opSteps(true, num1, den1, imp2N, imp2D); leftL = mixedL(frac1); rightL = mixedL(fmt2); leftP = mixedP(frac1); rightP = mixedP(fmt2); }
        else       { if (imp2N * den1 > 60 || imp2D * num1 > 60) continue; tail = opSteps(true, imp2N, imp2D, num1, den1); leftL = mixedL(fmt2); rightL = mixedL(frac1); leftP = mixedP(fmt2); rightP = mixedP(frac1); }
      }

      const core = [conv, ...tail.steps];
      return rvOf(`${leftL} ${opD(isDiv)} ${rightL}`, `${leftP} ${opP(isDiv)} ${rightP}`, core, tail.sn, tail.sd,
        `mm1-${num1}-${den1}-${whole2}-${num2}-${den2}-${flip ? "f" : "n"}-${isDiv ? "d" : "m"}`);
    }

    if (level === "level2") {
      const whole2 = randInt(2, 5);
      const wholeM = randInt(1, 3), denM = randInt(2, 6), numM = randInt(1, denM - 1);
      if (gcd(numM, denM) !== 1) continue;   // keep the mixed number in lowest terms
      const impMN = wholeM * denM + numM;
      const fmtM: MixedFmt = { whole: wholeM, num: numM, den: denM, isMixed: true };
      const flip = Math.random() < 0.5;
      const conv = [convertMixedStep(fmtM, impMN), writeIntStep(whole2)];

      let tail: { steps: WorkingStep[]; sn: number; sd: number };
      let leftL: string, rightL: string, leftP: string, rightP: string;

      if (!isDiv) {
        if (impMN * whole2 > 60) continue;
        if (flip) { tail = opSteps(false, whole2, 1, impMN, denM); leftL = `${whole2}`; rightL = mixedL(fmtM); leftP = `${whole2}`; rightP = mixedP(fmtM); }
        else      { tail = opSteps(false, impMN, denM, whole2, 1); leftL = mixedL(fmtM); rightL = `${whole2}`; leftP = mixedP(fmtM); rightP = `${whole2}`; }
      } else {
        if (!flip) { if (impMN > 60 || denM * whole2 > 60) continue; tail = opSteps(true, impMN, denM, whole2, 1); leftL = mixedL(fmtM); rightL = `${whole2}`; leftP = mixedP(fmtM); rightP = `${whole2}`; }
        else       { if (whole2 * denM > 60 || impMN > 60) continue; tail = opSteps(true, whole2, 1, impMN, denM); leftL = `${whole2}`; rightL = mixedL(fmtM); leftP = `${whole2}`; rightP = mixedP(fmtM); }
      }

      const core = [...conv, ...tail.steps];
      return rvOf(`${leftL} ${opD(isDiv)} ${rightL}`, `${leftP} ${opP(isDiv)} ${rightP}`, core, tail.sn, tail.sd,
        `mm2-${whole2}-${wholeM}-${numM}-${denM}-${flip ? "f" : "n"}-${isDiv ? "d" : "m"}`);
    }

    // level3: two mixed numbers × or ÷
    const harder = variables["harderMultiplication"] || false;
    const maxWhole = harder ? 8 : 3, maxDenVal = harder ? 10 : 5, maxProduct = harder ? 200 : 80, maxDenProd = harder ? 100 : 25;
    const w1 = randInt(1, maxWhole), den1 = randInt(2, maxDenVal), num1 = randInt(1, den1 - 1);
    const w2 = randInt(1, maxWhole), den2 = randInt(2, maxDenVal), num2 = randInt(1, den2 - 1);
    if (gcd(num1, den1) !== 1 || gcd(num2, den2) !== 1) continue;   // keep both mixed numbers in lowest terms
    const imp1N = w1 * den1 + num1, imp2N = w2 * den2 + num2;
    const fmt1: MixedFmt = { whole: w1, num: num1, den: den1, isMixed: true };
    const fmt2: MixedFmt = { whole: w2, num: num2, den: den2, isMixed: true };
    const conv = [convertMixedStep(fmt1, imp1N), convertMixedStep(fmt2, imp2N)];

    let tail: { steps: WorkingStep[]; sn: number; sd: number };
    if (!isDiv) {
      if (imp1N * imp2N > maxProduct || den1 * den2 > maxDenProd) continue;
      tail = opSteps(false, imp1N, den1, imp2N, den2);
    } else {
      if (imp1N * den2 > maxProduct || den1 * imp2N > maxDenProd) continue;
      tail = opSteps(true, imp1N, den1, imp2N, den2);
    }

    const core = [...conv, ...tail.steps];
    return rvOf(`${mixedL(fmt1)} ${opD(isDiv)} ${mixedL(fmt2)}`, `${mixedP(fmt1)} ${opP(isDiv)} ${mixedP(fmt2)}`, core, tail.sn, tail.sd,
      `mm3-${w1}-${num1}-${den1}-${w2}-${num2}-${den2}-${isDiv ? "d" : "m"}`);
  }

  // Fallback (should never be reached)
  const t = multiplySteps(3, 2, 5, 2);
  return rvOf("1\\dfrac{1}{2} \\times 2\\dfrac{1}{2}", "1 1/2 × 2 1/2", t.steps, t.sn, t.sd, "mm3-1-1-2-2-1-2-m");
};

// ── 7. generateQuestion ───────────────────────────────────────────────────────

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string,
  multiSelectValues?: Record<string, boolean>,
): AnyQuestion => {
  const t = tool as ToolType;
  const active = pickActive(multiSelectValues ?? {}, OPS_MS.options);
  const isDiv = active === "divide";

  const rv = t === "multFractions"
    ? generateMultFractionCore(level, variables, isDiv)
    : generateMultMixedCore(level, variables, isDiv);

  const { answer, answerLatex, working } = buildAnswerWorking(rv, dropdownValue === "mixed");

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

// ── 8. reformatQuestion — instant Answer Format switch ─────────────────────────

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
