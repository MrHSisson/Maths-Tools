// ═══════════════════════════════════════════════════════════════════════════════
// SURDS — five interlocking skills: simplify, add/subtract, multiply/divide,
// expand brackets, rationalise the denominator.
//
// The working-step engine — pure computation (src/shared/surds.ts) and the
// four grain-aware WorkingStep builders (src/shared/techniques/index.ts:
// simplifySurdSteps, collectLikeSurdsSteps, expandSurdBracketsSteps,
// rationaliseDenominatorSteps) — was promoted out of this tool into the
// shared techniques library; this file now pulls it back through
// "../../shared" like any other tool would, rather than owning it locally.
// ═══════════════════════════════════════════════════════════════════════════════

import {
  ToolShell,
  type ToolConfig,
  type InfoSection,
  type DifficultyLevel,
  type AnyQuestion,
  type ToolMultiSelect,
  type SurdTerm,
  type Grain,
  randInt, pick, step, mStep, pickActive, weightOf,
  simplifySurd,
  collectLikeSurds,
  multiplySurdTerms,
  multiplyExpressions,
  divideSurdTerms,
  conjugateOf,
  rationaliseDenominator,
  surdTermToLatex,
  surdExpressionToLatex,
  bracketedLatex,
  rawFractionToLatex,
  fractionToLatex,
  simplifySurdSteps,
  collectLikeSurdsSteps,
  expandSurdBracketsSteps,
  rationaliseDenominatorSteps,
} from "../../shared";

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

// A radicand that's ITSELF a perfect square (√16 = 4, no surd survives at
// all) — the specific case students who are otherwise fine with surds still
// tend to forget once they're deep in general surd manipulation.
function randomPerfectSquareRadicand(minRoot: number, maxRoot: number): number {
  return randInt(minRoot, maxRoot) ** 2;
}

// A radicand k·x² where x (the value that will be extracted) is drawn from
// [minX, maxX] and the whole radicand is capped at maxValue — guarded the
// same way as the other extraction helpers so x is genuinely the largest
// factor. Used for Level 1's "extract a value up to 10" range.
function randomExtractionRadicand(minX: number, maxX: number, maxValue: number): number {
  for (let i = 0; i < 300; i++) {
    const x = randInt(minX, maxX);
    const maxK = Math.floor(maxValue / (x * x));
    if (maxK < 2) continue;
    const k = randomSquareFree(2, maxK);
    const n = x * x * k;
    if (simplifySurd(n).coeff === x) return n;
  }
  return 12;
}

// Curated extraction values for the "several candidate factors" case, each
// built from two distinct small primes (6=2×3, 10=2×5, 15=3×5, …) or a
// square-of-a-square (16=4²) — genuinely interesting to spot, unlike a bare
// large prime squared (19² is just "a big number", not a hidden-factor case
// worth testing) or 16 specifically rewards noticing that pulling out 4²
// once still leaves another 4² behind.
const HIDDEN_FACTOR_X_POOL = [6, 10, 12, 14, 15, 16, 18, 20, 21, 22];

function randomCuratedHiddenFactor(): number {
  for (let i = 0; i < 200; i++) {
    const x = pick(HIDDEN_FACTOR_X_POOL);
    const p = randomSquareFree(2, 5);
    const n = x * x * p;
    if (simplifySurd(n).coeff === x) return n;
  }
  return 72;
}

const sign = (): number => pick([1, -1]);

// Reads a common/rare 2-option pool's raw toggle states directly, bypassing
// pickActive's uniform draw (and, since these pools carry no `weight`, the
// Smart Progressor's balancing too) — so "both active" means the rare case
// shows up naturally rarely, not as a 50/50 split. Off entirely (only common
// active) never shows it; the other extreme (only rare active) always does,
// matching the None/Mixed/Exclusive shape a weighted CycleSelect pool would
// have, just without forcing an even split in the middle state.
function pickRare(values: Record<string, boolean>, commonValue: string, rareValue: string, rareProbability: number): string {
  // Matches pickActive's own convention: absent means active, only an
  // explicit `false` turns an option off.
  const commonOn = values[commonValue] !== false;
  const rareOn = values[rareValue] !== false;
  if (!rareOn) return commonValue;
  if (!commonOn) return rareValue;
  return Math.random() < rareProbability ? rareValue : commonValue;
}

// ── 3. TOOL_CONFIG ────────────────────────────────────────────────────────────

// No `weight` on either option deliberately — these are common/rare pairs,
// not a difficulty ladder, so they must NOT go through the Smart
// Progressor's balancing (which would force a roughly-even split whenever
// both are active) or render as a compact CycleSelect. Generation reads the
// raw toggle states itself via pickRare, so "both active" genuinely means
// "rare", not "50/50" — see pickRare's own comment.
const SIMPLIFY_RADICAND_L1_MS: ToolMultiSelect = {
  key: "radicandTypeL1", label: "Question Types",
  options: [
    { value: "obvious", label: "Standard", defaultActive: true },
    { value: "perfectSquare", label: "Perfect square (√16 = 4, rare ~8%)", defaultActive: true },
  ],
};
// L2+ deliberately does NOT include "obvious"/"perfectSquare" — those are
// Level 1's whole content, and leaving them active here let two-thirds of a
// default L2 worksheet look identical to L1. L2 is now genuinely about
// spotting the largest factor, with "already simplest form" as a rare trap
// rather than a coin-flip alternative.
const SIMPLIFY_RADICAND_MS: ToolMultiSelect = {
  key: "radicandType", label: "Question Types",
  options: [
    { value: "hidden", label: "Several candidate factors", defaultActive: true },
    { value: "alreadySimplified", label: "Already simplest form (rare ~10%)", defaultActive: true },
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
// Coefficient presence and "does the radicand relationship collapse nicely"
// are independent properties (a perfect-square product can carry a
// coefficient too), so they're two separate pools, not one conflated ladder.
const MULDIV_COEFF_MS: ToolMultiSelect = {
  key: "coeffForm", label: "Difficulty",
  options: [
    { value: "basic", label: "Bare surds", defaultActive: true, weight: 1 },
    { value: "withCoeff", label: "With coefficients", defaultActive: true, weight: 2 },
  ],
};
// Multiply-only: recognising when two DIFFERENT surds still collapse to an
// integer is a distinct, easily-missed skill from the visually-obvious
// √a × √a case — e.g. √2 × √8 = √16 = 4 gives no visual hint it will cancel.
const MULDIV_RADICAND_L1_MS: ToolMultiSelect = {
  key: "radicandCaseL1", label: "Question Types",
  options: [
    { value: "general", label: "Standard", defaultActive: true },
    { value: "perfectSquareProduct", label: "Perfect square product (√2×√8 = 4)", defaultActive: true },
  ],
};
const MULDIV_RADICAND_MS: ToolMultiSelect = {
  key: "radicandCase", label: "Question Types",
  options: [
    { value: "general", label: "Standard", defaultActive: true, weight: 1 },
    { value: "sameRadicand", label: "Same surd (√a × √a)", defaultActive: true, weight: 2 },
    { value: "perfectSquareProduct", label: "Perfect square product (√2×√8 = 4)", defaultActive: true, weight: 3 },
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
        level1: { variables: [], dropdown: null, multiSelect: SIMPLIFY_RADICAND_L1_MS },
        // Level 2 reuses Level 1's friendly radicand range (extraction up to
        // 10, capped at 400) — the one new thing it introduces is a
        // coefficient to carry through, on numbers that are otherwise already
        // familiar. Level 3 is where the radicand range itself gets harder.
        level2: { variables: [], dropdown: null, multiSelect: SIMPLIFY_RADICAND_L1_MS },
        // No coefficient toggle at either level — both always have one now
        // (see generateSimplify).
        level3: { variables: [], dropdown: null, multiSelect: SIMPLIFY_RADICAND_MS },
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
        level1: { variables: [], dropdown: null, multiSelect: [OPERATION_MS, MULDIV_RADICAND_L1_MS] },
        // Level 2 keeps L1's radicand-relationship pool (general / perfect-
        // square-product) rather than dropping it — it was previously
        // available at L1, silently absent at L2, then back at L3, which
        // read as a gap rather than a build-up.
        level2: { variables: [], dropdown: null, multiSelect: [OPERATION_MS, MULDIV_RADICAND_L1_MS, MULDIV_COEFF_MS] },
        level3: { variables: [], dropdown: null, multiSelect: [OPERATION_MS, MULDIV_COEFF_MS, MULDIV_RADICAND_MS] },
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
    { label: "Overview", detail: "Write a surd with the smallest possible number under the root, by extracting the largest square factor. A toggleable 'perfect square' case (e.g. √16 = 4) is included as a rare, naturally-occurring trap rather than a coin flip — a check students often forget once they're used to general surd manipulation." },
    { label: "Level 1 — Green", detail: "Extracting a value up to 10 (e.g. √50 = 5√2, up to 10√k), radicand capped at 400. Perfect squares (√16 = 4) appear rarely (~8%) when included, not on every other question." },
    { label: "Level 2 — Yellow", detail: "Same friendly radicand range as Level 1, but now always with a coefficient to carry through (e.g. 3√50 = 15√2) — taking out a factor and multiplying it into an existing coefficient, on numbers that are otherwise already familiar." },
    { label: "Level 3 — Red", detail: "Deliberately past Level 1/2's range — curated extraction values like 12, 15 or 16 (built from two prime-power squares, e.g. 3² and 5² for 15), always with a coefficient. 'Already simplest form' is a rare trap (~10%), not a 50/50 alternative." },
  ]},
  { title: "Adding & Subtracting", icon: "+", content: [
    { label: "Overview", detail: "Combine surd terms that share the same radicand — only like surds can be added or subtracted." },
    { label: "Level 1 — Green", detail: "Already like surds — just combine the coefficients." },
    { label: "Level 2 — Yellow", detail: "Unlike-looking surds that become like once each is simplified first." },
    { label: "Level 3 — Red", detail: "Three-term expressions mixing rational and surd terms, and a genuine ‘these don't combine’ case." },
  ]},
  { title: "Multiplying & Dividing", icon: "×", content: [
    { label: "Overview", detail: "Multiply or divide surds by combining under one root — this sub-tool never includes a bracket; see Expanding Brackets for that. Includes a toggleable 'perfect square product' case (e.g. √2 × √8 = √16 = 4) — two different-looking surds that still collapse to an integer, easy to miss since nothing about the question hints at it." },
    { label: "Level 1 — Green", detail: "Bare surds, clean results, with the perfect-square-product case selectable from the start." },
    { label: "Level 2 — Yellow", detail: "Coefficients present, alongside the same perfect-square-product option from Level 1." },
    { label: "Level 3 — Red", detail: "Coefficients, plus the special √a × √a = a case alongside the less obvious perfect-square-product case." },
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
  // Level 3 is the only level using the curated "several candidate factors"
  // pool (radicand pushed past 400) — Level 2 stays on Level 1's friendly
  // extraction range so the only new thing it introduces is the coefficient
  // below, not a harder radicand at the same time.
  const radicandCase = level === "level3"
    ? pickRare(ms, "hidden", "alreadySimplified", 0.1)
    : pickRare(ms, "obvious", "perfectSquare", 0.08);

  const radicand = radicandCase === "perfectSquare" ? randomPerfectSquareRadicand(2, 12)
    // Level 1 and 2: extract a value up to 10, radicand capped at 400 so
    // numbers stay readable even at the top of that range.
    : radicandCase === "obvious" ? randomExtractionRadicand(2, 10, 400)
    // Level 3: curated composite extraction values (12, 15, 16, …) —
    // deliberately past Level 1/2's range, and chosen so there's a genuine
    // "which factor did I spot" decision rather than a single obvious one.
    : radicandCase === "hidden" ? randomCuratedHiddenFactor()
    // Floor of 2, not 7 — √2 and √3 are genuine "already simplest form"
    // examples, not trivial ones to exclude.
    : randomSquareFree(2, 60);

  // Level 2 and 3 both always carry a coefficient — no toggle, it's a fixed
  // step up from Level 1. Taking out a factor and multiplying it into an
  // existing coefficient is itself the new skill Level 2 adds (on Level 1's
  // otherwise-familiar numbers); Level 3 then combines that same skill with
  // the harder curated radicand range, rather than introducing both at once.
  const coeff = level !== "level1" ? randInt(2, 6) : 1;

  // "full" shows the coefficient-multiply as its own step (see
  // simplifySurdSteps) — needed whenever a coefficient is present, which is
  // now Level 2 and 3 both.
  const grain: Grain = "full";
  const working = simplifySurdSteps(radicand, coeff, grain);

  const s = simplifySurd(radicand);
  const finalTerm: SurdTerm = { coeff: coeff * s.coeff, radicand: s.radicand };
  const displayLatex = coeff === 1 ? `\\sqrt{${radicand}}` : `${coeff}\\sqrt{${radicand}}`;
  const answerLatex = surdTermToLatex(finalTerm, true);

  // No _difficultyScore — neither pool carries a weight (see pickRare):
  // common-vs-rare isn't a difficulty ladder the Smart Progressor should
  // sort or balance, and Level 3's coefficient is no longer a QO choice.
  return questionFrom(displayLatex, answerLatex, working, `simplify-${level}-${radicand}-${coeff}-${nextId()}`, level);
}

function generateAddSub(level: DifficultyLevel, ms: Record<string, boolean>): AnyQuestion {
  const kase = level === "level1" ? "alreadyLike"
    : level === "level2" ? pickActive(ms, ADDSUB_L2_MS.options)
    : pickActive(ms, ADDSUB_L3_MS.options);

  const s = sign();
  let terms: SurdTerm[];

  if (kase === "alreadyLike") {
    const r = randomSquareFree(2, level === "level1" ? 20 : 35);
    const c1 = randInt(2, 12);
    let c2 = randInt(2, 12);
    if (s === -1 && c2 === c1) c2 = c1 === 12 ? c1 - 1 : c1 + 1;
    terms = [{ coeff: c1, radicand: r }, { coeff: s * c2, radicand: r }];
  } else if (kase === "needsSimplify") {
    // p's pool was the narrowest in the whole tool (only {2,3,5,6} at
    // 2-6) — widened so "simplify first" doesn't repeat the same handful
    // of base values every worksheet.
    const p = randomSquareFree(2, 15);
    const [k1, k2] = [2, 3, 4, 5].sort(() => Math.random() - 0.5).slice(0, 2);
    const c1 = randInt(1, 4);
    let c2 = randInt(1, 4);
    if (s === -1 && c1 * k1 === c2 * k2) c2 += 1;
    terms = [{ coeff: c1, radicand: k1 * k1 * p }, { coeff: s * c2, radicand: k2 * k2 * p }];
  } else if (kase === "dontCombine") {
    const r1 = randomSquareFree(2, 35);
    let r2 = randomSquareFree(2, 35);
    while (r2 === r1) r2 = randomSquareFree(2, 35);
    terms = [{ coeff: randInt(2, 12), radicand: r1 }, { coeff: s * randInt(2, 12), radicand: r2 }];
  } else {
    // threeTermMixed
    const r = randomSquareFree(2, 20);
    const rational = randInt(2, 12);
    const c1 = randInt(2, 12);
    let c2 = randInt(2, 12);
    if (s === -1 && c2 === c1) c2 = c1 === 12 ? c1 - 1 : c1 + 1;
    terms = [{ coeff: rational, radicand: 1 }, { coeff: c1, radicand: r }, { coeff: s * c2, radicand: r }];
  }

  // Surds is where this technique is first taught, not a downstream tool
  // that already assumes it — full grain throughout, not just Level 1.
  const grain: Grain = "full";
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
  const coeffCase = level === "level1" ? "basic" : pickActive(ms, MULDIV_COEFF_MS.options);
  // The radicand-relationship pool is multiply-only — division's own
  // construction already guarantees a clean collapse by a different route
  // (the radicand ratio, not the product, is the perfect square).
  const radicandCase = operation !== "multiply" ? "general"
    : level === "level3" ? pickActive(ms, MULDIV_RADICAND_MS.options)
    : pickActive(ms, MULDIV_RADICAND_L1_MS.options);
  const useCoeff = coeffCase === "withCoeff";

  let a: SurdTerm, b: SurdTerm;
  // Surds is where this technique is first taught, not a downstream tool
  // that already assumes it — full grain throughout, not just Level 1.
  const grain: Grain = "full";
  let working;
  let resultTerm: SurdTerm;

  if (operation === "multiply") {
    if (radicandCase === "sameRadicand") {
      const r = randomSquareFree(2, 20);
      a = { coeff: useCoeff ? randInt(2, 8) : 1, radicand: r };
      b = { coeff: useCoeff ? randInt(2, 8) : 1, radicand: r };
    } else if (radicandCase === "perfectSquareProduct") {
      // a's and b's radicands are DIFFERENT but their product is a perfect
      // square by construction — k × (k·m²) = (km)² — e.g.
      // k=2, m=2 gives √2 × √8 = √16 = 4, exactly the case
      // that gives no visual hint it will collapse.
      const k = randomSquareFree(2, 10);
      const m = randInt(2, 4);
      a = { coeff: useCoeff ? randInt(2, 8) : 1, radicand: k };
      b = { coeff: useCoeff ? randInt(2, 8) : 1, radicand: k * m * m };
    } else {
      a = { coeff: useCoeff ? randInt(2, 8) : 1, radicand: randomSquareFree(2, level === "level1" ? 20 : 35) };
      b = { coeff: useCoeff ? randInt(2, 8) : 1, radicand: randomSquareFree(2, level === "level1" ? 20 : 35) };
    }
    resultTerm = multiplySurdTerms(a, b);
    working = expandSurdBracketsSteps([a], [b], grain);
  } else {
    // divide — guarded clean on BOTH axes: a's radicand is b's radicand times
    // a perfect square (so the root divides exactly), and a's coefficient is
    // a whole multiple of b's (so the coefficient ratio divides exactly too)
    // — a plain "both drawn independently" pair only cancels by luck.
    const r = randomSquareFree(2, 15);
    const m = randInt(2, 5);
    const bCoeff = useCoeff ? randInt(2, 5) : 1;
    const aCoeff = useCoeff ? bCoeff * randInt(1, 4) : 1;
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

  const score = level === "level2" ? weightOf(MULDIV_COEFF_MS.options, coeffCase)
    : level === "level3" ? weightOf(MULDIV_COEFF_MS.options, coeffCase) + weightOf(MULDIV_RADICAND_MS.options, radicandCase)
    : undefined;

  return questionFrom(displayLatex, answerLatex, working, `mulDiv-${level}-${operation}-${coeffCase}-${radicandCase}-${a.coeff}r${a.radicand}-${b.coeff}r${b.radicand}-${nextId()}`, level, score);
}

function generateExpand(level: DifficultyLevel, ms: Record<string, boolean>): AnyQuestion {
  let a: SurdTerm[], b: SurdTerm[];
  let caseKey = "single";

  if (level === "level1") {
    a = [{ coeff: randInt(2, 8), radicand: randomSquareFree(2, 15) }];
    b = [{ coeff: randInt(2, 12), radicand: 1 }, { coeff: sign() * randInt(1, 7), radicand: randomSquareFree(2, 15) }];
  } else if (level === "level2") {
    caseKey = pickActive(ms, BRACKET_TYPE_L2_MS.options);
    if (caseKey === "single") {
      a = [{ coeff: randInt(2, 8), radicand: randomSquareFree(2, 15) }];
      b = [{ coeff: randInt(2, 12), radicand: 1 }, { coeff: sign() * randInt(1, 7), radicand: randomSquareFree(2, 15) }];
    } else {
      a = [{ coeff: sign() * randInt(1, 7), radicand: randomSquareFree(2, 15) }, { coeff: randInt(2, 12), radicand: 1 }];
      b = [{ coeff: sign() * randInt(1, 7), radicand: randomSquareFree(2, 15) }, { coeff: randInt(2, 12), radicand: 1 }];
    }
  } else {
    caseKey = pickActive(ms, EXPAND_ADVANCED_L3_MS.options);
    if (caseKey === "differenceOfSquares") {
      const p: SurdTerm = Math.random() < 0.5
        ? { coeff: randInt(2, 12), radicand: 1 }
        : { coeff: randInt(1, 6), radicand: randomSquareFree(2, 15) };
      let q: SurdTerm = { coeff: randInt(1, 6), radicand: randomSquareFree(2, 15) };
      // p and q must be distinct — if they happen to match, the second
      // bracket becomes p + (-p) = 0 and the whole question degenerates.
      while (q.coeff === p.coeff && q.radicand === p.radicand) {
        q = { coeff: randInt(1, 6), radicand: randomSquareFree(2, 15) };
      }
      a = [p, q];
      b = [p, conjugateOf(q)];
    } else if (caseKey === "collect") {
      // Shared radicand r between one term of each bracket, so the outer and
      // inner cross-products combine — e.g. (√3+2)(√3+5).
      const r = randomSquareFree(2, 15);
      a = [{ coeff: randInt(1, 5), radicand: r }, { coeff: randInt(2, 12), radicand: 1 }];
      b = [{ coeff: randInt(1, 5), radicand: r }, { coeff: randInt(2, 12), radicand: 1 }];
    } else {
      // simplifyAfter — a cross product's radicand is a perfect square by
      // construction: r * (r*k^2) = (rk)^2, guaranteed, not left to chance.
      const r = randomSquareFree(2, 10);
      const k = randInt(2, 3);
      a = [{ coeff: 1, radicand: 1 }, { coeff: 1, radicand: r * k * k }];
      b = [{ coeff: 1, radicand: 1 }, { coeff: 1, radicand: r }];
    }
  }

  // Surds is where this technique is first taught, not a downstream tool
  // that already assumes it — full grain throughout, not just some levels.
  const working = expandSurdBracketsSteps(a, b, "full");
  // Reuse the same general multiply-and-collect computation the step
  // builder is built on, rather than re-deriving the cross-product logic
  // inline — one source of truth for what the expansion actually equals.
  const answerTerms = multiplyExpressions(a, b);

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
    const r = kase === "needsSimplify" ? randomHiddenFactorRadicand(8, 80, 2) : randomSquareFree(2, 20);
    numerator = [{ coeff: 1, radicand: 1 }];
    denominator = [{ coeff: 1, radicand: r }];
  } else if (level === "level2") {
    kase = pickActive(ms, NUMERATOR_FORM_L2_MS.options);
    const denomRadicand = Math.random() < 0.5 ? randomSquareFree(2, 20) : randomHiddenFactorRadicand(8, 80, 2);
    denominator = [{ coeff: 1, radicand: denomRadicand }];
    const simplified = simplifySurd(denomRadicand).radicand;
    numerator = kase === "coefficient"
      ? [{ coeff: randInt(2, 12), radicand: 1 }]
      : [{ coeff: randInt(2, 12), radicand: 1 }, { coeff: sign() * randInt(1, 6), radicand: simplified }];
  } else {
    kase = pickActive(ms, RATIONALISE_L3_MS.options);
    const denomOther: SurdTerm = { coeff: randInt(2, 6), radicand: 1 };
    const p: SurdTerm = { coeff: randInt(1, 5), radicand: randomSquareFree(2, 15) };
    denominator = [denomOther, p];
    numerator = kase === "monomial"
      ? [{ coeff: randInt(2, 12), radicand: 1 }]
      : [{ coeff: randInt(2, 12), radicand: 1 }, { coeff: sign() * randInt(1, 5), radicand: randomSquareFree(2, 15) }];
  }

  // Surds is where this technique is first taught, not a downstream tool
  // that already assumes it — full grain throughout, not just Level 1.
  const grain: Grain = "full";
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
      // hideAnswerStep: every sub-tool's last working step already states the
      // exact final answer (verified across 300 draws per sub-tool/level in a
      // scratch stress test — see the commit that added this flag), so the
      // separate green answer box would just repeat it. Piloted here first.
      defaults={{ numQuestions: 12, numColumns: 3, workedExampleLayout: "stacked", toolTabRows: [3, 2], hideAnswerStep: true }}
    />
  );
}
