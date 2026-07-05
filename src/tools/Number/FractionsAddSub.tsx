import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type WorkingStep, type QOSnapshot,
  type TeachingSlide,
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
  mixedAnswerOnly?: boolean; // whole-and-part method concludes with a mixed number
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

const ANS_LT1_VAR       = { key: "answerLessThanOne", label: "Answer < 1",       defaultValue: true  };
const ALLOW_NEG_VAR     = { key: "allowNegatives",    label: "Allow Negatives",  defaultValue: true  };
const CARRY_VAR         = { key: "requiresCarrying",  label: "Requires Carrying", defaultValue: false };
const PARTS_VAR         = { key: "partsMethod",       label: "Whole & Part Method", defaultValue: false };
const EXTENDED_VAR      = { key: "extendedRange",     label: "Extended Range",    defaultValue: false };

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Adding & Subtracting Fractions",
  tools: {

    fractions: {
      name: "Fractions",
      instruction: "Work out:",
      variables: [ANS_LT1_VAR, ALLOW_NEG_VAR],
      dropdown: FORMAT_DD,
      multiSelect: OPS_MS,
      difficultySettings: {
        level3: { variables: [ANS_LT1_VAR, ALLOW_NEG_VAR, EXTENDED_VAR] },
      },
    },

    mixedNumbers: {
      name: "Mixed Numbers",
      instruction: "Work out:",
      variables: [PARTS_VAR, CARRY_VAR],
      dropdown: FORMAT_DD_MIXED,
      multiSelect: OPS_MS,
      difficultySettings: {
        level3: { variables: [PARTS_VAR, CARRY_VAR, EXTENDED_VAR] },
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
    { label: "Overview",         detail: "Generates mixed number addition and subtraction questions. Choose between the convert-to-improper method and the whole-and-part method with the Method option." },
    { label: "Level 1 — Green",  detail: "Same denominator. Students convert to improper fractions, calculate, then convert back." },
    { label: "Level 2 — Yellow", detail: "One denominator is a direct multiple of the other. Convert to improper fractions, scale, then calculate." },
    { label: "Level 3 — Red",    detail: "Unrelated denominators requiring LCM conversion. Standard keeps the LCM below 100; Extended Range allows an LCM up to 225." },
    { label: "Method",           detail: "Two methods are available. Convert to improper fractions (default) turns each mixed number top-heavy first. Whole & Part Method adds/subtracts the whole numbers and the fractional parts separately, then regroups — this is where carrying and borrowing become visible." },
    { label: "Requires Carrying", detail: "When off (default), subtraction questions are generated so no borrowing from the whole number is needed. When on, borrowing may be required." },
  ]},
  { title: "Question Options", icon: "⚙️", content: [
    { label: "Operations",       detail: "Choose Addition, Subtraction, or both. With both active, questions are a random mix." },
    { label: "Answer Format",    detail: "Improper shows the answer as a top-heavy fraction; Mixed Number converts an improper answer to a whole number and fraction." },
    { label: "Answer < 1",       detail: "Fractions only, on by default. Keeps every answer below 1 (a proper fraction) so the result is never an improper or mixed number. Turn it off to allow answers of 1 or more." },
    { label: "Allow Negatives",  detail: "Fractions only, on by default. Lets subtraction give a negative answer (e.g. 1/4 − 3/4 = −1/2). Turn it off to restrict subtraction so the larger fraction always comes first and the answer stays positive." },
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
  const sign = sn < 0 ? "-" : "";
  const a = Math.abs(sn);
  if (sd === 1) return { latex: `${sn}`, plain: `${sn}` };
  if (isMixedFmt && a > sd) { const m = toMixed(a, sd); return { latex: `${sign}${mixedL(m)}`, plain: `${sign}${mixedP(m)}` }; }
  return { latex: `${sign}${fracL(a, sd)}`, plain: `${sign}${fracP(a, sd)}` };
};

// Combine the fixed core working with the format-dependent tail (convert back
// to a mixed number) and the formatted answer.
const buildAnswerWorking = (rv: RawValues, isMixedFmt: boolean): { answer: string; answerLatex: string; working: WorkingStep[] } => {
  // The whole-and-part method already concludes with a mixed number, so its
  // answer is always shown mixed and it needs no convert-back tail.
  const forceMixed = rv.mixedAnswerOnly === true;
  const useMixed = forceMixed || isMixedFmt;
  const ans = ansParts(rv.rawNum, rv.rawDen, useMixed);
  const working = [...rv.core];
  if (!forceMixed && isMixedFmt && rv.rawNum > rv.rawDen && rv.rawDen !== 1) {
    working.push(mStep("Convert back to a mixed number:", `\\dfrac{${rv.rawNum}}{${rv.rawDen}} = ${ans.latex}`));
  }
  return { answer: ans.plain, answerLatex: ans.latex, working };
};

const opLatex = (isAdd: boolean) => (isAdd ? "+" : "-");
const addOrSubLabel = (isAdd: boolean) => `${isAdd ? "Add" : "Subtract"} the numerators:`;

// A simplify working step, or nothing when the fraction is already in lowest terms.
const simplifyStep = (raw: number, den: number, sn: number, sd: number): WorkingStep[] =>
  sd !== den && raw !== 0 ? [mStep(`Simplify (÷${gcd(raw, den)}):`, `\\dfrac{${raw}}{${den}} = ${fracL(sn, sd)}`)] : [];

// An equivalent-fraction step showing the ×m applied to top and bottom.
const rewriteStep = (label: string, n: number, d: number, target: number): WorkingStep => {
  const m = target / d;
  return mStep(label, `\\dfrac{${n}}{${d}} = \\dfrac{${n} \\times ${m}}{${d} \\times ${m}} = \\dfrac{${n * m}}{${target}}`);
};

const convertMixedStep = (whole: number, num: number, den: number, imp: number): WorkingStep =>
  mStep(`Convert ${whole} ${num}/${den} to an improper fraction:`,
    `${whole}\\dfrac{${num}}{${den}} = \\dfrac{${whole} \\times ${den} + ${num}}{${den}} = \\dfrac{${imp}}{${den}}`);

// ── Mixed-number working builders (convert-to-improper vs whole-and-part) ──────
//
// Both take the two mixed numbers already in display order (with subtraction
// ordered so the first is the larger), and the fractional parts already scaled
// to a common denominator. They return identical answers — only the method
// (and hence the working) differs.

interface MixedBuild { core: WorkingStep[]; rawNum: number; rawDen: number; mixedAnswerOnly?: boolean }

const improperMethodWorking = (
  w1: number, fn1: number, d1: number, w2: number, fn2: number, d2: number,
  isAdd: boolean, commonD: number, opL: string,
): MixedBuild => {
  const imp1 = w1 * d1 + fn1, imp2 = w2 * d2 + fn2;
  const core: WorkingStep[] = [];
  if (w1 > 0) core.push(convertMixedStep(w1, fn1, d1, imp1));
  if (w2 > 0) core.push(convertMixedStep(w2, fn2, d2, imp2));
  const isc1 = imp1 * (commonD / d1), isc2 = imp2 * (commonD / d2);
  if (d1 !== commonD) core.push(rewriteStep("Rewrite the first fraction:", imp1, d1, commonD));
  if (d2 !== commonD) core.push(rewriteStep("Rewrite the second fraction:", imp2, d2, commonD));
  const raw = isAdd ? isc1 + isc2 : isc1 - isc2;
  core.push(mStep(addOrSubLabel(isAdd), `\\dfrac{${isc1}}{${commonD}} ${opL} \\dfrac{${isc2}}{${commonD}} = \\dfrac{${raw}}{${commonD}}`));
  const [sn, sd] = simplify(raw, commonD);
  core.push(...simplifyStep(raw, commonD, sn, sd));
  return { core, rawNum: sn, rawDen: sd };
};

const separatePartsWorking = (
  w1: number, fn1: number, d1: number, w2: number, fn2: number, d2: number,
  isAdd: boolean, commonD: number, opL: string,
): MixedBuild => {
  const sc1 = fn1 * (commonD / d1), sc2 = fn2 * (commonD / d2);
  const core: WorkingStep[] = [];

  const Wraw = isAdd ? w1 + w2 : w1 - w2;
  core.push(mStep(isAdd ? "Add the whole numbers:" : "Subtract the whole numbers:", `${w1} ${opL} ${w2} = ${Wraw}`));

  if (d1 !== commonD) core.push(rewriteStep("Rewrite the first fraction:", fn1, d1, commonD));
  if (d2 !== commonD) core.push(rewriteStep("Rewrite the second fraction:", fn2, d2, commonD));

  let finalW = Wraw, fracN = isAdd ? sc1 + sc2 : sc1 - sc2;
  let carryLatex = "";

  if (isAdd) {
    core.push(mStep("Add the fractional parts:", `\\dfrac{${sc1}}{${commonD}} + \\dfrac{${sc2}}{${commonD}} = \\dfrac{${fracN}}{${commonD}}`));
    if (fracN >= commonD) {
      const rem = fracN - commonD;              // each part < 1, so the carry is exactly 1
      const [rn, rd] = rem === 0 ? [0, 1] : simplify(rem, commonD);
      carryLatex = rem === 0 ? "1" : `1\\dfrac{${rn}}{${rd}}`;
      core.push(mStep("The fraction makes a whole — regroup:", `\\dfrac{${fracN}}{${commonD}} = ${carryLatex}`));
      finalW = Wraw + 1;
      fracN = rem;
    }
  } else if (fracN < 0) {
    finalW = Wraw - 1;
    core.push(mStep("The first fraction is smaller — borrow 1 whole:",
      `${Wraw} \\rightarrow ${finalW}, \\quad \\dfrac{${sc1}}{${commonD}} + \\dfrac{${commonD}}{${commonD}} = \\dfrac{${sc1 + commonD}}{${commonD}}`));
    fracN = sc1 + commonD - sc2;
    core.push(mStep("Subtract the fractional parts:", `\\dfrac{${sc1 + commonD}}{${commonD}} - \\dfrac{${sc2}}{${commonD}} = \\dfrac{${fracN}}{${commonD}}`));
  } else {
    core.push(mStep("Subtract the fractional parts:", `\\dfrac{${sc1}}{${commonD}} - \\dfrac{${sc2}}{${commonD}} = \\dfrac{${fracN}}{${commonD}}`));
  }

  const [fsn, fsd] = fracN === 0 ? [0, 1] : simplify(fracN, commonD);

  let rawNum: number, rawDen: number, ansLatex: string;
  if (fsn === 0) { rawNum = finalW; rawDen = 1; ansLatex = `${finalW}`; }
  else if (finalW === 0) { rawNum = fsn; rawDen = fsd; ansLatex = fracL(fsn, fsd); }
  else { rawNum = finalW * fsd + fsn; rawDen = fsd; ansLatex = `${finalW}\\dfrac{${fsn}}{${fsd}}`; }

  if (carryLatex) {
    // the regroup step already showed (and simplified) the carried whole and fraction
    core.push(mStep("Combine:", `${Wraw} + ${carryLatex} = ${ansLatex}`));
  } else {
    if (fracN !== 0 && fsd !== commonD) core.push(mStep(`Simplify (÷${gcd(fracN, commonD)}):`, `\\dfrac{${fracN}}{${commonD}} = ${fracL(fsn, fsd)}`));
    if (fsn === 0) core.push(mStep("The fractional parts cancel, so the answer is:", `${finalW}`));
    else if (finalW === 0) core.push(mStep("The whole part is 0, so the answer is:", ansLatex));
    else core.push(mStep("Combine the whole and fractional parts:", `${finalW} + ${fracL(fsn, fsd)} = ${ansLatex}`));
  }

  return { core, rawNum, rawDen, mixedAnswerOnly: true };
};

// ── 5. Core generators (produce RawValues, format-independent) ─────────────────

const generateFractionCore = (level: DifficultyLevel, variables: Record<string, boolean>, isAdd: boolean): RawValues => {
  const opL = opLatex(isAdd);
  const extended = variables["extendedRange"] || false;
  const ansLT1 = variables["answerLessThanOne"] || false;
  const restrictNeg = !(variables["allowNegatives"] ?? true);   // off => keep the result non-negative

  for (let attempt = 0; attempt < 500; attempt++) {

    if (level === "level1") {
      const den = randInt(3, 10);
      let num1 = randInt(1, den - 1);
      let num2 = randInt(1, den - 1);
      if (num1 === num2) continue;
      if (!isAdd && restrictNeg && num1 < num2) { [num1, num2] = [num2, num1]; }
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
      if (base * mult > 50) continue;   // cap the larger denominator at 50
      let den1 = base, den2 = base * mult;
      if (Math.random() < 0.5) { [den1, den2] = [den2, den1]; }
      const smallD = Math.min(den1, den2), largeD = Math.max(den1, den2), m = largeD / smallD;
      let num1 = randInt(1, den1 - 1);
      let num2 = randInt(1, den2 - 1);
      if (!isAdd && restrictNeg && num1 / den1 < num2 / den2) { [num1, den1, num2, den2] = [num2, den2, num1, den1]; }
      const sc1 = den1 === smallD ? num1 * m : num1;
      const sc2 = den1 === smallD ? num2 : num2 * m;
      const raw = isAdd ? sc1 + sc2 : sc1 - sc2;
      if (ansLT1 && raw >= largeD) continue;
      const [sn, sd] = simplify(raw, largeD);
      // Only the smaller-denominator fraction needs scaling; show the ×m explicitly.
      const scaleFirst = den1 === smallD;
      const core: WorkingStep[] = [
        scaleFirst
          ? rewriteStep("Write over a common denominator:", num1, den1, largeD)
          : rewriteStep("Write over a common denominator:", num2, den2, largeD),
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
    if (!isAdd && restrictNeg && num1 / den1 < num2 / den2) { [num1, den1, num2, den2] = [num2, den2, num1, den1]; }
    const m1 = cl / den1, m2 = cl / den2;
    const sc1 = num1 * m1, sc2 = num2 * m2;
    const raw = isAdd ? sc1 + sc2 : sc1 - sc2;
    if (ansLT1 && raw >= cl) continue;
    const [sn, sd] = simplify(raw, cl);
    const core: WorkingStep[] = [
      mStep(`LCM of ${den1} and ${den2}:`, `${cl}`),
      rewriteStep("Rewrite the first fraction:", num1, den1, cl),
      rewriteStep("Rewrite the second fraction:", num2, den2, cl),
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
  const partsMethod = variables["partsMethod"] || false;
  const noRegroup = !isAdd && !requiresCarrying;
  const pickWhole = () => (Math.random() < 0.25 ? 0 : randInt(1, 3));

  for (let attempt = 0; attempt < 500; attempt++) {
    // Denominators per level: same (L1), one a multiple of the other (L2),
    // unrelated/coprime needing an LCM (L3).
    let d1: number, d2: number;
    if (level === "level1") {
      d1 = randInt(3, 10); d2 = d1;
    } else if (level === "level2") {
      const base = randInt(2, 7), mult = randInt(2, 4);
      d1 = base; d2 = base * mult;
      if (Math.random() < 0.5) { [d1, d2] = [d2, d1]; }
    } else {
      const maxD = extended ? 15 : 10, maxLCM = extended ? 225 : 100, minLCM = extended ? 65 : 0;
      d1 = randInt(2, maxD); d2 = randInt(2, maxD);
      if (d1 === d2 || gcd(d1, d2) !== 1) continue;
      const cl = lcm(d1, d2);
      if (cl > maxLCM || cl <= minLCM) continue;
    }

    let w1 = pickWhole(), w2 = pickWhole();
    if (w1 === 0 && w2 === 0) continue;
    let fn1 = randInt(1, d1 - 1), fn2 = randInt(1, d2 - 1);
    if (gcd(fn1, d1) !== 1 || gcd(fn2, d2) !== 1) continue;   // keep fractional parts in lowest terms

    // Subtraction: order so the first number is the larger (answer stays ≥ 0).
    if (!isAdd && (w1 + fn1 / d1) < (w2 + fn2 / d2)) {
      [w1, fn1, d1, w2, fn2, d2] = [w2, fn2, d2, w1, fn1, d1];
    }
    if (level === "level1" && w1 === w2 && fn1 === fn2) continue;

    const commonD = lcm(d1, d2);
    const sc1 = fn1 * (commonD / d1), sc2 = fn2 * (commonD / d2);
    // Without "Requires Carrying", keep subtraction free of borrowing.
    if (noRegroup && sc1 < sc2) continue;

    const built = partsMethod
      ? separatePartsWorking(w1, fn1, d1, w2, fn2, d2, isAdd, commonD, opL)
      : improperMethodWorking(w1, fn1, d1, w2, fn2, d2, isAdd, commonD, opL);

    const f1: MixedFmt = { whole: w1, num: fn1, den: d1, isMixed: w1 > 0 };
    const f2: MixedFmt = { whole: w2, num: fn2, den: d2, isMixed: w2 > 0 };
    return {
      displayLatex: `${mixedL(f1)} ${opL} ${mixedL(f2)}`,
      displayPlain: `${mixedP(f1)} ${isAdd ? "+" : "-"} ${mixedP(f2)}`,
      core: built.core, rawNum: built.rawNum, rawDen: built.rawDen,
      mixedAnswerOnly: built.mixedAnswerOnly,
      keyBase: `${w1}.${fn1}.${d1}-${w2}.${fn2}.${d2}-${isAdd ? "a" : "s"}-${partsMethod ? "p" : "i"}`,
    };
  }

  // Fallback (should never be reached)
  const fb = improperMethodWorking(1, 1, 2, 1, 1, 2, true, 2, "+");
  return {
    displayLatex: `1\\dfrac{1}{2} + 1\\dfrac{1}{2}`, displayPlain: "1 1/2 + 1 1/2",
    core: fb.core, rawNum: fb.rawNum, rawDen: fb.rawDen, keyBase: `1.1.2-1.1.2-a-i`,
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

// ── Teaching slides — curated key ideas & misconceptions ───────────────────────

const BLUE = "#2563eb", GREEN = "#16a34a", AMBER = "#d97706";

const TEACHING_SLIDES: TeachingSlide[] = [
  {
    tag: "Key idea", accent: "blue",
    title: "Same denominator? Just add the numerators.",
    body: [
      { t: "text", s: "The denominator tells you the size of the pieces. When the pieces are the same size, you just count how many you have." },
      { t: "bars", bars: [
        { num: 1, den: 5, color: BLUE, label: "\\dfrac{1}{5}" },
        { num: 3, den: 5, color: BLUE, label: "\\dfrac{3}{5}" },
      ] },
      { t: "math", s: "\\dfrac{1}{5} + \\dfrac{3}{5} = \\dfrac{4}{5}" },
    ],
    reveal: [
      { t: "bars", bars: [{ num: 4, den: 5, color: GREEN, label: "\\dfrac{4}{5}" }] },
      { t: "callout", tone: "info", s: "The denominator stays as $5$ — you are not making new-sized pieces, only counting more of them." },
    ],
    revealLabel: "Show the total",
  },
  {
    tag: "True or false?", accent: "amber",
    title: "$\\dfrac{1}{2} + \\dfrac{1}{3} = \\dfrac{2}{5}$",
    body: [{ t: "text", s: "Decide with the class before you reveal." }],
    reveal: [
      { t: "verdict", value: false },
      { t: "bars", bars: [
        { num: 1, den: 2, color: BLUE, label: "\\dfrac{1}{2}" },
        { num: 1, den: 3, color: AMBER, label: "\\dfrac{1}{3}" },
      ] },
      { t: "callout", tone: "bad", s: "The pieces are different sizes, so you cannot add them directly — and you never add the denominators." },
      { t: "math", s: "\\dfrac{1}{2} + \\dfrac{1}{3} = \\dfrac{3}{6} + \\dfrac{2}{6} = \\dfrac{5}{6}" },
    ],
    revealLabel: "Reveal",
  },
  {
    tag: "Key idea", accent: "blue",
    title: "Different denominators? Make the pieces the same size first.",
    body: [
      { t: "text", s: "Rewrite each fraction over a common denominator, then add. Here the common denominator is $6$." },
      { t: "bars", bars: [
        { num: 3, den: 6, color: BLUE, label: "\\dfrac{1}{2} = \\dfrac{3}{6}" },
        { num: 2, den: 6, color: AMBER, label: "\\dfrac{1}{3} = \\dfrac{2}{6}" },
      ] },
    ],
    reveal: [
      { t: "bars", bars: [{ num: 5, den: 6, color: GREEN, label: "\\dfrac{5}{6}" }] },
      { t: "math", s: "\\dfrac{3}{6} + \\dfrac{2}{6} = \\dfrac{5}{6}" },
    ],
    revealLabel: "Add them",
  },
  {
    tag: "Key idea", accent: "blue",
    title: "Equivalent fractions: multiply top and bottom by the same number.",
    body: [
      { t: "math", s: "\\dfrac{1}{3} = \\dfrac{1 \\times 4}{3 \\times 4} = \\dfrac{4}{12}" },
      { t: "bars", bars: [
        { num: 1, den: 3, color: BLUE, label: "\\dfrac{1}{3}" },
        { num: 4, den: 12, color: BLUE, label: "\\dfrac{4}{12}" },
      ] },
    ],
    reveal: [
      { t: "callout", tone: "info", s: "The shaded amount is identical — you have only cut each piece into smaller equal pieces, so the value does not change." },
    ],
    revealLabel: "Why is it the same?",
  },
  {
    tag: "Spot the mistake", accent: "red",
    title: "What went wrong?",
    body: [
      { t: "text", s: "A student wrote:" },
      { t: "math", s: "\\dfrac{2}{3} + \\dfrac{1}{6} = \\dfrac{3}{9}" },
    ],
    reveal: [
      { t: "callout", tone: "bad", s: "They added the numerators **and** the denominators. Denominators are never added." },
      { t: "callout", tone: "good", s: "Use a common denominator of $6$:" },
      { t: "math", s: "\\dfrac{2}{3} + \\dfrac{1}{6} = \\dfrac{4}{6} + \\dfrac{1}{6} = \\dfrac{5}{6}" },
    ],
    revealLabel: "Reveal the mistake",
  },
  {
    tag: "True or false?", accent: "amber",
    title: "$1\\dfrac{1}{4} + 2\\dfrac{1}{2}$ can be done by adding the wholes and the fractions separately.",
    body: [{ t: "text", s: "Would this method work?" }],
    reveal: [
      { t: "verdict", value: true },
      { t: "callout", tone: "good", s: "Wholes: $1 + 2 = 3$. Parts: $\\dfrac{1}{4} + \\dfrac{2}{4} = \\dfrac{3}{4}$. Answer: $3\\dfrac{3}{4}$." },
      { t: "callout", tone: "info", s: "Converting to improper fractions also works — both give the same answer." },
    ],
    revealLabel: "Reveal",
  },
];

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
      teachingSlides={TEACHING_SLIDES}
      defaults={{ numQuestions: 12, numColumns: 3 }}
    />
  );
}
