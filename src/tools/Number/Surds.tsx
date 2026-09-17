// ═══════════════════════════════════════════════════════════════════════════════
// SURDS — five interlocking skills: simplify, add/subtract, multiply/divide,
// expand brackets, rationalise the denominator.
//
// The working-step engine lives in two sibling modules, deliberately shaped
// like a future src/shared/techniques/index.ts entry — see their headers:
//   ./surdsMath.ts  — pure computation (never recomputed ad hoc here)
//   ./surdsSteps.ts — grain-aware WorkingStep builders ("candidate techniques")
// ═══════════════════════════════════════════════════════════════════════════════

import {
  ToolShell,
  type ToolConfig,
  type InfoSection,
  type DifficultyLevel,
  type AnyQuestion,
  type ToolMultiSelect,
  randInt, pick, step, mStep, pickActive, weightOf,
} from "../../shared";
import {
  type SurdTerm,
  simplifySurd,
  collectLikeSurds,
  multiplySurdTerms,
  divideSurdTerms,
  conjugateOf,
  rationaliseDenominator,
  surdTermToLatex,
  surdExpressionToLatex,
  bracketedLatex,
  rawFractionToLatex,
  fractionToLatex,
} from "./surdsMath";
import {
  type Grain,
  simplifySurdSteps,
  collectLikeSurdsSteps,
  expandBracketsSteps,
  rationaliseDenominatorSteps,
} from "./surdsSteps";

// ── 1. Types ──────────────────────────────────────────────────────────────────

type ToolType = "simplify" | "addSub" | "multiplyDivide" | "expand" | "rationalise";

// ── 2. Random-generation helpers (question variety, not working-step logic) ──

function isSquareFree(n: number): boolean {
  return simplifySurd(n).coeff === 1;
}

function randomSquareFree(min: number, max: number): number {
  for (let i = 0; i < 200; i++) {
    const n = randInt(min, max);
    if (isSquareFree(n)) return n;
  }
  return min;
}

function hasMultipleSquareFactors(n: number): boolean {
  let count = 0;
  for (let f = 2; f * f <= n; f++) if (n % (f * f) === 0) count++;
  return count >= 2;
}

// A radicand with >=2 distinct candidate square factors, so picking the
// LARGEST one (not just any) is the actual skill being tested — e.g. 72
// (4, 9 and 36 all divide it; only 36 gets it in one step).
function randomHiddenFactorRadicand(min: number, max: number, minCoeff: number): number {
  for (let i = 0; i < 300; i++) {
    const n = randInt(min, max);
    const s = simplifySurd(n);
    // s.radicand === 1 means n is itself a perfect square — not a surd at
    // all once simplified, so it's excluded regardless of how many smaller
    // square factors also happen to divide it.
    if (hasMultipleSquareFactors(n) && s.coeff >= minCoeff && s.radicand !== 1) return n;
  }
  return min;
}

// A radicand with exactly one obvious square factor — guarded, not guessed:
// simplifySurd must return the SAME k we built it from, so nothing hides.
function randomObviousRadicand(): number {
  for (let i = 0; i < 200; i++) {
    const k = pick([2, 3, 4, 5]);
    const p = randomSquareFree(2, 15);
    const n = k * k * p;
    if (simplifySurd(n).coeff === k) return n;
  }
  return 12;
}

const sign = (): number => pick([1, -1]);

// ── 3. TOOL_CONFIG ────────────────────────────────────────────────────────────

const SIMPLIFY_RADICAND_MS: ToolMultiSelect = {
  key: "radicandType", label: "Question Types",
  options: [
    { value: "obvious", label: "Obvious square factor", defaultActive: true, weight: 1 },
    { value: "hidden", label: "Several candidate factors", defaultActive: true, weight: 2 },
    { value: "alreadySimplified", label: "Already simplest form", defaultActive: false, weight: 2 },
  ],
};
const SIMPLIFY_COEFF_MS: ToolMultiSelect = {
  key: "coeffForm", label: "Coefficient",
  options: [
    { value: "none", label: "None", defaultActive: true, weight: 1 },
    { value: "withCoeff", label: "Present", defaultActive: true, weight: 2 },
  ],
};

const ADDSUB_L2_MS: ToolMultiSelect = {
  key: "formL2", label: "Question Types",
  options: [
    { value: "alreadyLike", label: "Already like surds", defaultActive: true, weight: 1 },
    { value: "needsSimplify", label: "Simplify first", defaultActive: true, weight: 2 },
  ],
};
const ADDSUB_L3_MS: ToolMultiSelect = {
  key: "formL3", label: "Question Types",
  options: [
    { value: "needsSimplify", label: "Simplify first", defaultActive: true, weight: 1 },
    { value: "dontCombine", label: "Not like surds", defaultActive: true, weight: 2 },
    { value: "threeTermMixed", label: "Rational + surds", defaultActive: true, weight: 3 },
  ],
};

const OPERATION_MS: ToolMultiSelect = {
  key: "operation", label: "Operation",
  options: [
    { value: "multiply", label: "Multiply", defaultActive: true },
    { value: "divide", label: "Divide", defaultActive: true },
  ],
};
const MULDIV_L2_MS: ToolMultiSelect = {
  key: "formL2", label: "Difficulty",
  options: [
    { value: "basic", label: "Bare surds", defaultActive: true, weight: 1 },
    { value: "withCoeff", label: "With coefficients", defaultActive: true, weight: 2 },
  ],
};
const MULDIV_L3_MS: ToolMultiSelect = {
  key: "formL3", label: "Difficulty",
  options: [
    { value: "withCoeff", label: "With coefficients", defaultActive: true, weight: 1 },
    { value: "sameRadicand", label: "Same surd (√a × √a)", defaultActive: true, weight: 2 },
  ],
};

const BRACKET_TYPE_L2_MS: ToolMultiSelect = {
  key: "bracketType", label: "Bracket Type",
  options: [
    { value: "single", label: "Single bracket", defaultActive: true },
    { value: "double", label: "Double bracket", defaultActive: true },
  ],
};
const EXPAND_ADVANCED_L3_MS: ToolMultiSelect = {
  key: "advancedCase", label: "Advanced Case",
  options: [
    { value: "collect", label: "Collect like surds", defaultActive: true, weight: 1 },
    { value: "simplifyAfter", label: "Simplify after expanding", defaultActive: true, weight: 2 },
    { value: "differenceOfSquares", label: "Difference of two squares", defaultActive: true, weight: 3 },
  ],
};

const DENOM_FORM_L1_MS: ToolMultiSelect = {
  key: "denomForm", label: "Denominator Form",
  options: [
    { value: "simplified", label: "Already simplified", defaultActive: true, weight: 1 },
    { value: "needsSimplify", label: "Needs simplifying first", defaultActive: true, weight: 2 },
  ],
};
const NUMERATOR_FORM_L2_MS: ToolMultiSelect = {
  key: "numForm", label: "Numerator Form",
  options: [
    { value: "coefficient", label: "Coefficient numerator", defaultActive: true, weight: 1 },
    { value: "binomial", label: "Binomial numerator", defaultActive: true, weight: 2 },
  ],
};
const RATIONALISE_L3_MS: ToolMultiSelect = {
  key: "l3Form", label: "Numerator Form",
  options: [
    { value: "monomial", label: "Single-term numerator", defaultActive: true, weight: 1 },
    { value: "binomial", label: "Binomial numerator", defaultActive: true, weight: 2 },
  ],
};

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Surds",
  tools: {

    simplify: {
      name: "Simplifying Surds",
      instruction: "Simplify:",
      variables: [],
      dropdown: null,
      difficultySettings: {
        level1: { variables: [], dropdown: null },
        level2: { variables: [], dropdown: null, multiSelect: SIMPLIFY_RADICAND_MS },
        level3: { variables: [], dropdown: null, multiSelect: [SIMPLIFY_RADICAND_MS, SIMPLIFY_COEFF_MS] },
      },
    },

    addSub: {
      name: "Adding & Subtracting",
      instruction: "Simplify:",
      variables: [],
      dropdown: null,
      difficultySettings: {
        level1: { variables: [], dropdown: null },
        level2: { variables: [], dropdown: null, multiSelect: ADDSUB_L2_MS },
        level3: { variables: [], dropdown: null, multiSelect: ADDSUB_L3_MS },
      },
    },

    multiplyDivide: {
      name: "Multiplying & Dividing",
      instruction: "Simplify:",
      variables: [],
      dropdown: null,
      multiSelect: OPERATION_MS,
      difficultySettings: {
        level1: { variables: [], dropdown: null, multiSelect: OPERATION_MS },
        level2: { variables: [], dropdown: null, multiSelect: [OPERATION_MS, MULDIV_L2_MS] },
        level3: { variables: [], dropdown: null, multiSelect: [OPERATION_MS, MULDIV_L3_MS] },
      },
    },

    expand: {
      name: "Expanding Brackets",
      instruction: "Expand and simplify:",
      variables: [],
      dropdown: null,
      difficultySettings: {
        level1: { variables: [], dropdown: null },
        level2: { variables: [], dropdown: null, multiSelect: BRACKET_TYPE_L2_MS },
        level3: { variables: [], dropdown: null, multiSelect: EXPAND_ADVANCED_L3_MS },
      },
    },

    rationalise: {
      name: "Rationalising the Denominator",
      instruction: "Rationalise the denominator:",
      variables: [],
      dropdown: null,
      difficultySettings: {
        level1: { variables: [], dropdown: null, multiSelect: DENOM_FORM_L1_MS },
        level2: { variables: [], dropdown: null, multiSelect: NUMERATOR_FORM_L2_MS },
        level3: { variables: [], dropdown: null, multiSelect: RATIONALISE_L3_MS },
      },
    },

  },
};

// ── 4. INFO_SECTIONS ─────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  { title: "Simplifying Surds", icon: "√", content: [
    { label: "Overview", detail: "Write a surd with the smallest possible number under the root, by extracting the largest square factor." },
    { label: "Level 1 — Green", detail: "One obvious square factor (e.g. √50 = 5√2)." },
    { label: "Level 2 — Yellow", detail: "Radicands with several candidate square factors — spotting the LARGEST one (not just any) is the actual skill; a mix also includes surds already in simplest form." },
    { label: "Level 3 — Red", detail: "As Level 2, plus an existing coefficient to carry through (e.g. 3√48)." },
  ]},
  { title: "Adding & Subtracting", icon: "+", content: [
    { label: "Overview", detail: "Combine surd terms that share the same radicand — only like surds can be added or subtracted." },
    { label: "Level 1 — Green", detail: "Already like surds — just combine the coefficients." },
    { label: "Level 2 — Yellow", detail: "Unlike-looking surds that become like once each is simplified first." },
    { label: "Level 3 — Red", detail: "Three-term expressions mixing rational and surd terms, and a genuine ‘these don't combine’ case." },
  ]},
  { title: "Multiplying & Dividing", icon: "×", content: [
    { label: "Overview", detail: "Multiply or divide surds by combining under one root — this sub-tool never includes a bracket; see Expanding Brackets for that." },
    { label: "Level 1 — Green", detail: "Bare surds, clean results." },
    { label: "Level 2 — Yellow", detail: "Coefficients present." },
    { label: "Level 3 — Red", detail: "Coefficients, plus the special √a × √a = a case." },
  ]},
  { title: "Expanding Brackets", icon: "(·)", content: [
    { label: "Overview", detail: "Distribute a surd over a bracket, or expand two brackets using FOIL." },
    { label: "Level 1 — Green", detail: "Single bracket: a surd times (integer ± surd)." },
    { label: "Level 2 — Yellow", detail: "Single or double brackets — general FOIL." },
    { label: "Level 3 — Red", detail: "Guaranteed advanced cases: collecting multiple like surds after expanding, a term needing simplification after expanding, or the difference of two squares." },
  ]},
  { title: "Rationalising the Denominator", icon: "÷", content: [
    { label: "Overview", detail: "Rewrite a fraction with a surd denominator so the denominator is rational, by multiplying top and bottom by the surd (or its conjugate)." },
    { label: "Level 1 — Green", detail: "Single-surd denominator — sometimes already simplified, sometimes needing simplifying first." },
    { label: "Level 2 — Yellow", detail: "Numerator carries a coefficient, or is itself a binomial." },
    { label: "Level 3 — Red", detail: "Binomial denominator — multiply by the conjugate." },
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard", detail: "Single question on the left, working space on the right." },
    { label: "Worked Example", detail: "Full step-by-step solution revealed on demand." },
    { label: "Worksheet", detail: "Grid of questions with PDF export." },
  ]},
];

// ── 5. generateQuestion ────────────────────────────────────────────────────────

const nextId = (): number => Math.floor(Math.random() * 1_000_000);

function questionFrom(displayLatex: string, answerLatex: string, working: ReturnType<typeof step>[], key: string, level: DifficultyLevel, score?: number): AnyQuestion {
  return {
    kind: "simple",
    display: displayLatex,
    displayLatex,
    answer: answerLatex,
    answerLatex,
    working,
    key,
    difficulty: level,
    ...(score !== undefined ? { _difficultyScore: score } : {}),
  } as unknown as AnyQuestion;
}

function generateSimplify(level: DifficultyLevel, ms: Record<string, boolean>): AnyQuestion {
  let radicandCase = "obvious";
  let radicand: number;

  if (level === "level1") {
    radicand = randomObviousRadicand();
  } else {
    radicandCase = pickActive(ms, SIMPLIFY_RADICAND_MS.options);
    radicand = radicandCase === "hidden" ? randomHiddenFactorRadicand(24, 200, 4)
      : radicandCase === "alreadySimplified" ? randomSquareFree(7, 45)
      : randomObviousRadicand();
  }

  const coeffForm = level === "level3" ? pickActive(ms, SIMPLIFY_COEFF_MS.options) : "none";
  const coeff = coeffForm === "withCoeff" ? randInt(2, 6) : 1;

  const grain: Grain = level === "level1" ? "full" : "standard";
  const working = simplifySurdSteps(radicand, coeff, grain);

  const s = simplifySurd(radicand);
  const finalTerm: SurdTerm = { coeff: coeff * s.coeff, radicand: s.radicand };
  const displayLatex = coeff === 1 ? `\\sqrt{${radicand}}` : `${coeff}\\sqrt{${radicand}}`;
  const answerLatex = surdTermToLatex(finalTerm, true);

  const score = level === "level3" ? weightOf(SIMPLIFY_RADICAND_MS.options, radicandCase) + weightOf(SIMPLIFY_COEFF_MS.options, coeffForm)
    : level === "level2" ? weightOf(SIMPLIFY_RADICAND_MS.options, radicandCase)
    : undefined;

  return questionFrom(displayLatex, answerLatex, working, `simplify-${level}-${radicand}-${coeff}-${nextId()}`, level, score);
}

function generateAddSub(level: DifficultyLevel, ms: Record<string, boolean>): AnyQuestion {
  const kase = level === "level1" ? "alreadyLike"
    : level === "level2" ? pickActive(ms, ADDSUB_L2_MS.options)
    : pickActive(ms, ADDSUB_L3_MS.options);

  const s = sign();
  let terms: SurdTerm[];

  if (kase === "alreadyLike") {
    const r = randomSquareFree(2, level === "level1" ? 12 : 20);
    const c1 = randInt(2, 9);
    let c2 = randInt(2, 9);
    if (s === -1 && c2 === c1) c2 = c1 === 9 ? c1 - 1 : c1 + 1;
    terms = [{ coeff: c1, radicand: r }, { coeff: s * c2, radicand: r }];
  } else if (kase === "needsSimplify") {
    const p = randomSquareFree(2, 6);
    const [k1, k2] = [2, 3, 4, 5].sort(() => Math.random() - 0.5).slice(0, 2);
    const c1 = randInt(1, 3);
    let c2 = randInt(1, 3);
    if (s === -1 && c1 * k1 === c2 * k2) c2 += 1;
    terms = [{ coeff: c1, radicand: k1 * k1 * p }, { coeff: s * c2, radicand: k2 * k2 * p }];
  } else if (kase === "dontCombine") {
    const r1 = randomSquareFree(2, 20);
    let r2 = randomSquareFree(2, 20);
    while (r2 === r1) r2 = randomSquareFree(2, 20);
    terms = [{ coeff: randInt(2, 9), radicand: r1 }, { coeff: s * randInt(2, 9), radicand: r2 }];
  } else {
    // threeTermMixed
    const r = randomSquareFree(2, 10);
    const rational = randInt(2, 9);
    const c1 = randInt(2, 9);
    let c2 = randInt(2, 9);
    if (s === -1 && c2 === c1) c2 = c1 === 9 ? c1 - 1 : c1 + 1;
    terms = [{ coeff: rational, radicand: 1 }, { coeff: c1, radicand: r }, { coeff: s * c2, radicand: r }];
  }

  const grain: Grain = level === "level1" ? "full" : "standard";
  const working = collectLikeSurdsSteps(terms, grain);
  const answerTerms = collectLikeSurds(terms);

  const score = level === "level2" ? weightOf(ADDSUB_L2_MS.options, kase)
    : level === "level3" ? weightOf(ADDSUB_L3_MS.options, kase)
    : undefined;

  return questionFrom(
    surdExpressionToLatex(terms),
    surdExpressionToLatex(answerTerms.length ? answerTerms : [{ coeff: 0, radicand: 1 }]),
    working,
    `addSub-${level}-${kase}-${terms.map((t) => `${t.coeff}r${t.radicand}`).join("_")}-${nextId()}`,
    level,
    score,
  );
}

function generateMultiplyDivide(level: DifficultyLevel, ms: Record<string, boolean>): AnyQuestion {
  const operation = pickActive(ms, OPERATION_MS.options);
  const rawFormCase = level === "level1" ? "basic"
    : level === "level2" ? pickActive(ms, MULDIV_L2_MS.options)
    : pickActive(ms, MULDIV_L3_MS.options);
  // √a÷√a is trivial — fall back to the coefficient case for division.
  const formCase = operation === "divide" && rawFormCase === "sameRadicand" ? "withCoeff" : rawFormCase;

  let a: SurdTerm, b: SurdTerm;
  const grain: Grain = level === "level1" ? "full" : "standard";
  let working;
  let resultTerm: SurdTerm;

  if (operation === "multiply") {
    if (formCase === "sameRadicand") {
      const r = randomSquareFree(2, 12);
      a = { coeff: randInt(2, 6), radicand: r };
      b = { coeff: randInt(2, 6), radicand: r };
    } else {
      const useCoeff = formCase === "withCoeff";
      a = { coeff: useCoeff ? randInt(2, 6) : 1, radicand: randomSquareFree(2, level === "level1" ? 12 : 20) };
      b = { coeff: useCoeff ? randInt(2, 6) : 1, radicand: randomSquareFree(2, level === "level1" ? 12 : 20) };
    }
    resultTerm = multiplySurdTerms(a, b);
    working = expandBracketsSteps([a], [b], grain);
  } else {
    // divide — guarded clean on BOTH axes: a's radicand is b's radicand times
    // a perfect square (so the root divides exactly), and a's coefficient is
    // a whole multiple of b's (so the coefficient ratio divides exactly too)
    // — a plain "both drawn independently" pair only cancels by luck.
    const useCoeff = formCase === "withCoeff";
    const r = randomSquareFree(2, 10);
    const m = randInt(2, 5);
    const bCoeff = useCoeff ? randInt(2, 4) : 1;
    const aCoeff = useCoeff ? bCoeff * randInt(1, 3) : 1;
    a = { coeff: aCoeff, radicand: r * m * m };
    b = { coeff: bCoeff, radicand: r };
    resultTerm = divideSurdTerms(a, b);
    const rawLatex = `${surdTermToLatex(a, true)} \\div ${surdTermToLatex(b, true)}`;
    const resultLatex = surdTermToLatex(resultTerm, true);
    const coeffPart = a.coeff !== 1 || b.coeff !== 1 ? `\\dfrac{${a.coeff}}{${b.coeff}} \\times ` : "";
    working = [mStep("Divide under one root:", [
      rawLatex,
      `= ${coeffPart}\\sqrt{\\dfrac{${a.radicand}}{${b.radicand}}}`,
      `= ${resultLatex}`,
    ])];
  }

  const opLatex = operation === "multiply" ? "\\times" : "\\div";
  const displayLatex = `${bracketedLatex([a])} ${opLatex} ${bracketedLatex([b])}`;
  const answerLatex = surdTermToLatex(resultTerm, true);

  const score = level === "level2" ? weightOf(MULDIV_L2_MS.options, rawFormCase)
    : level === "level3" ? weightOf(MULDIV_L3_MS.options, rawFormCase)
    : undefined;

  return questionFrom(displayLatex, answerLatex, working, `mulDiv-${level}-${operation}-${formCase}-${a.coeff}r${a.radicand}-${b.coeff}r${b.radicand}-${nextId()}`, level, score);
}

function generateExpand(level: DifficultyLevel, ms: Record<string, boolean>): AnyQuestion {
  let a: SurdTerm[], b: SurdTerm[];
  let caseKey = "single";

  if (level === "level1") {
    a = [{ coeff: randInt(2, 6), radicand: randomSquareFree(2, 10) }];
    b = [{ coeff: randInt(2, 9), radicand: 1 }, { coeff: sign() * randInt(1, 6), radicand: randomSquareFree(2, 10) }];
  } else if (level === "level2") {
    caseKey = pickActive(ms, BRACKET_TYPE_L2_MS.options);
    if (caseKey === "single") {
      a = [{ coeff: randInt(2, 6), radicand: randomSquareFree(2, 10) }];
      b = [{ coeff: randInt(2, 9), radicand: 1 }, { coeff: sign() * randInt(1, 6), radicand: randomSquareFree(2, 10) }];
    } else {
      a = [{ coeff: sign() * randInt(1, 6), radicand: randomSquareFree(2, 10) }, { coeff: randInt(2, 9), radicand: 1 }];
      b = [{ coeff: sign() * randInt(1, 6), radicand: randomSquareFree(2, 10) }, { coeff: randInt(2, 9), radicand: 1 }];
    }
  } else {
    caseKey = pickActive(ms, EXPAND_ADVANCED_L3_MS.options);
    if (caseKey === "differenceOfSquares") {
      const p: SurdTerm = Math.random() < 0.5
        ? { coeff: randInt(2, 9), radicand: 1 }
        : { coeff: randInt(1, 5), radicand: randomSquareFree(2, 10) };
      const q: SurdTerm = { coeff: randInt(1, 5), radicand: randomSquareFree(2, 10) };
      a = [p, q];
      b = [p, conjugateOf(q)];
    } else if (caseKey === "collect") {
      // Shared radicand r between one term of each bracket, so the outer and
      // inner cross-products combine — e.g. (√3+2)(√3+5).
      const r = randomSquareFree(2, 8);
      a = [{ coeff: randInt(1, 4), radicand: r }, { coeff: randInt(2, 9), radicand: 1 }];
      b = [{ coeff: randInt(1, 4), radicand: r }, { coeff: randInt(2, 9), radicand: 1 }];
    } else {
      // simplifyAfter — a cross product's radicand is a perfect square by
      // construction: r * (r*k^2) = (rk)^2, guaranteed, not left to chance.
      const r = randomSquareFree(2, 6);
      const k = randInt(2, 3);
      a = [{ coeff: 1, radicand: 1 }, { coeff: 1, radicand: r * k * k }];
      b = [{ coeff: 1, radicand: 1 }, { coeff: 1, radicand: r }];
    }
  }

  const working = expandBracketsSteps(a, b, "standard");
  const answerTerms = collectLikeSurds([
    multiplySurdTerms(a[0], b[0]),
    ...(a.length > 1 ? [multiplySurdTerms(a[1], b[0])] : []),
    ...(b.length > 1 ? [multiplySurdTerms(a[0], b[1])] : []),
    ...(a.length > 1 && b.length > 1 ? [multiplySurdTerms(a[1], b[1])] : []),
  ]);

  const score = level === "level3" ? weightOf(EXPAND_ADVANCED_L3_MS.options, caseKey) : undefined;

  return questionFrom(
    `${bracketedLatex(a)}${bracketedLatex(b)}`,
    surdExpressionToLatex(answerTerms.length ? answerTerms : [{ coeff: 0, radicand: 1 }]),
    working,
    `expand-${level}-${caseKey}-${nextId()}`,
    level,
    score,
  );
}

function generateRationalise(level: DifficultyLevel, ms: Record<string, boolean>): AnyQuestion {
  let numerator: SurdTerm[], denominator: SurdTerm[];
  let kase = "";

  if (level === "level1") {
    kase = pickActive(ms, DENOM_FORM_L1_MS.options);
    const r = kase === "needsSimplify" ? randomHiddenFactorRadicand(8, 50, 2) : randomSquareFree(2, 12);
    numerator = [{ coeff: 1, radicand: 1 }];
    denominator = [{ coeff: 1, radicand: r }];
  } else if (level === "level2") {
    kase = pickActive(ms, NUMERATOR_FORM_L2_MS.options);
    const denomRadicand = Math.random() < 0.5 ? randomSquareFree(2, 12) : randomHiddenFactorRadicand(8, 50, 2);
    denominator = [{ coeff: 1, radicand: denomRadicand }];
    const simplified = simplifySurd(denomRadicand).radicand;
    numerator = kase === "coefficient"
      ? [{ coeff: randInt(2, 9), radicand: 1 }]
      : [{ coeff: randInt(2, 9), radicand: 1 }, { coeff: sign() * randInt(1, 5), radicand: simplified }];
  } else {
    kase = pickActive(ms, RATIONALISE_L3_MS.options);
    const denomOther: SurdTerm = { coeff: randInt(2, 5), radicand: 1 };
    const p: SurdTerm = { coeff: randInt(1, 4), radicand: randomSquareFree(2, 10) };
    denominator = [denomOther, p];
    numerator = kase === "monomial"
      ? [{ coeff: randInt(2, 9), radicand: 1 }]
      : [{ coeff: randInt(2, 9), radicand: 1 }, { coeff: sign() * randInt(1, 4), radicand: randomSquareFree(2, 10) }];
  }

  const grain: Grain = level === "level1" ? "full" : "standard";
  const working = rationaliseDenominatorSteps(numerator, denominator, grain);
  const finalFraction = rationaliseDenominator(numerator, denominator);

  const score = level === "level1" ? weightOf(DENOM_FORM_L1_MS.options, kase)
    : level === "level2" ? weightOf(NUMERATOR_FORM_L2_MS.options, kase)
    : weightOf(RATIONALISE_L3_MS.options, kase);

  return questionFrom(
    rawFractionToLatex(numerator, denominator),
    fractionToLatex(finalFraction),
    working,
    `rationalise-${level}-${kase}-${nextId()}`,
    level,
    score,
  );
}

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  _variables: Record<string, boolean>,
  _dropdownValue: string,
  multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  const t = tool as ToolType;
  if (t === "simplify") return generateSimplify(level, multiSelectValues);
  if (t === "addSub") return generateAddSub(level, multiSelectValues);
  if (t === "multiplyDivide") return generateMultiplyDivide(level, multiSelectValues);
  if (t === "expand") return generateExpand(level, multiSelectValues);
  return generateRationalise(level, multiSelectValues);
};

// Worksheet uniqueness is automatic — ToolShell wraps generateQuestion with the
// standard retry-until-unique loop. No generateUniqueQ needed.

// Exposes internals to the generator smoke-test suite (src/tests/generators.test.ts).
export const __test = { TOOL_CONFIG, generateQuestion };

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      defaults={{ numQuestions: 12, numColumns: 3 }}
    />
  );
}
