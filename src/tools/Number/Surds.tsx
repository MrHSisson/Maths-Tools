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

// An extraction value x is only an interesting "several candidate factors"
// case when x² itself has more than one smaller square factor to notice —
// e.g. 6² = 36 = 4×9 (spot the 4, or the 9, before the true largest factor
// 36), or 16² = 256 (pulling out 4² once still leaves another 4² behind).
// A bare prime squared (2² = 4, 3² = 9, 19² = 361, …) has only ONE square
// factor — nothing hidden, just "a big number" — so it's excluded by the
// same `hasMultipleSquareFactors` check already used for Rationalise's
// hidden-factor radicands, applied here to x² rather than to the radicand
// itself.
function isMultiStepExtractable(x: number): boolean {
  return hasMultipleSquareFactors(x * x);
}

// Level 3's radicand: curated extraction values (filtered above), always
// pushed past 400 so the size itself forces breaking the number down via
// smaller squares rather than spotting the answer at a glance. Capped at
// 2000 so the numbers stay readable even at the top of the range.
function randomCuratedHiddenFactorAbove400(): number {
  for (let i = 0; i < 500; i++) {
    const x = randInt(4, 25);
    if (!isMultiStepExtractable(x)) continue;
    const k = randomSquareFree(2, 6);
    const n = x * x * k;
    if (n <= 400 || n > 2000) continue;
    if (simplifySurd(n).coeff === x) return n;
  }
  return 432; // 12² × 3 — safely > 400, 12 is multi-step-extractable
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

// No `weight` on either option deliberately — this is a common/rare pair,
// not a difficulty ladder, so it must NOT go through the Smart Progressor's
// balancing (which would force a roughly-even split whenever both are
// active). `cycleDisplay` gets the same compact None/Mixed/Exclusive button
// a weighted pool would render as, without opting into that balancing —
// generation reads the raw toggle states itself via pickRare, so "Mixed"
// genuinely means "rare", not "50/50" — see pickRare's own comment.
const SIMPLIFY_RADICAND_L1_MS: ToolMultiSelect = {
  key: "radicandTypeL1", label: "Perfect Squares", cycleDisplay: true,
  cycleStateLabels: ["Off", "Mixed (~8%)", "Always"],
  options: [
    { value: "obvious", label: "Standard", defaultActive: true },
    { value: "perfectSquare", label: "Perfect square (√16 = 4, rare ~8%)", defaultActive: true },
  ],
};
// Level 3's coefficient is now a genuine QO choice rather than a fixed
// always-on — a real easy/hard ladder (no coefficient to carry vs one to
// multiply through), so this DOES carry `weight` and gets Smart Progressor
// balancing + the compact cycle button for free, unlike the pool above.
const SIMPLIFY_COEFF_L3_MS: ToolMultiSelect = {
  key: "coeffL3", label: "Coefficient",
  options: [
    { value: "none", label: "No coefficient", defaultActive: true, weight: 1 },
    { value: "withCoeff", label: "With coefficient", defaultActive: true, weight: 2 },
  ],
};

// A peer/variety pool, not a difficulty ladder — add vs subtract aren't
// harder/easier than each other, so no weight; both active (the default)
// means a genuine random mix, exactly like Multiply/Divide's own OPERATION_MS.
// Present at every level, since which sign a question uses is independent of
// what else changes level to level.
const ADDSUB_OPERATION_MS: ToolMultiSelect = {
  key: "operationAS", label: "Operation",
  options: [
    { value: "add", label: "Add", defaultActive: true },
    { value: "subtract", label: "Subtract", defaultActive: true },
  ],
};
// Level 2 always requires simplifying first now (that WAS the old L1→L2
// distinction, and it wasn't distinct enough on its own) — this is the new
// axis Level 2 varies instead: whether each surd term also carries its own
// coefficient on top of the part that needs extracting (e.g. "4√12 + 3√27"
// vs the bare "√12 + √27").
const ADDSUB_COEFF_L2_MS: ToolMultiSelect = {
  key: "coeffL2", label: "Coefficients",
  options: [
    { value: "none", label: "No coefficient", defaultActive: true, weight: 1 },
    { value: "withCoeff", label: "With coefficient", defaultActive: true, weight: 2 },
  ],
};
// A rare "these don't actually combine" trap, shared across Level 1 and
// Level 2 (same key, so the toggle state carries between them, matching
// Simplify's own L1/L2 perfect-square pool) — students who are fine
// combining like surds at those levels still need to notice when two surds
// genuinely don't share a radicand. `cycleDisplay` (not `weight`) keeps it
// genuinely rare via `pickRare` rather than the Smart Progressor's even-split
// balancing. No longer part of Level 3's own pool — moved here instead.
const ADDSUB_TRAP_MS: ToolMultiSelect = {
  key: "trapAS", label: "Not Like Surds", cycleDisplay: true,
  cycleStateLabels: ["Off", "Mixed (~10%)", "Always"],
  options: [
    { value: "combine", label: "Combines", defaultActive: true },
    { value: "dontCombine", label: "Doesn't combine (rare trap)", defaultActive: true },
  ],
};
// Level 3's own new skills — genuinely distinct from Level 2's "simplify
// first", not an extension of it: sorting/grouping across two surd families,
// distributing a negative across a bracket before collecting, and collecting
// an algebraic (x-carrying) coefficient.
const ADDSUB_L3_MS: ToolMultiSelect = {
  key: "formL3", label: "Question Types",
  options: [
    { value: "multiGroup", label: "Multiple surd families", defaultActive: true, weight: 1 },
    { value: "negativeBracket", label: "Distribute a negative bracket", defaultActive: true, weight: 2 },
    { value: "algebraicCoeff", label: "Algebraic coefficients", defaultActive: true, weight: 3 },
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

// Shared by Level 1 AND Level 2 (same key, like Simplify's L1/L2 radicand
// pool) — the denominator's own "does it need simplifying first" property is
// the same friendly-range dimension at both levels; what changes between
// them is the numerator (see RATIONALISE_NUM_L1_MS / the always-binomial
// Level 2 numerator below).
const RATIONALISE_DENOM_L1_MS: ToolMultiSelect = {
  key: "denomForm", label: "Denominator Form",
  options: [
    { value: "simplified", label: "Already simplified", defaultActive: true, weight: 1 },
    { value: "needsSimplify", label: "Needs simplifying first", defaultActive: true, weight: 2 },
  ],
};
// Level 1 only — independent of the denominator's own form (both dimensions
// can combine on one question), so it's its own pool rather than folded into
// a single ladder. Whether the numerator is a bare 1 (a genuine unit
// fraction) or some other integer is a real QO choice now, not fixed at 1.
const RATIONALISE_NUM_L1_MS: ToolMultiSelect = {
  key: "numFormL1", label: "Numerator Form",
  options: [
    { value: "unit", label: "Unit fraction (numerator 1)", defaultActive: true, weight: 1 },
    { value: "coefficient", label: "Integer numerator", defaultActive: true, weight: 2 },
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
        // 10, capped at 400) — the one new thing it introduces is a wider,
        // always-on coefficient to carry through, on numbers that are
        // otherwise already familiar. Level 3 is where the radicand range
        // itself gets harder, and the coefficient becomes a genuine choice.
        level2: { variables: [], dropdown: null, multiSelect: SIMPLIFY_RADICAND_L1_MS },
        // Radicand is always the curated "several candidate factors" case,
        // always past 400 — no "already simplest form" trap at this level,
        // and no toggle for it; the coefficient is the one QO choice here.
        level3: { variables: [], dropdown: null, multiSelect: SIMPLIFY_COEFF_L3_MS },
      },
    },

    addSub: {
      name: "Adding & Subtracting",
      instruction: "Simplify:",
      variables: [],
      dropdown: null,
      difficultySettings: {
        level1: { variables: [], dropdown: null, multiSelect: [ADDSUB_OPERATION_MS, ADDSUB_TRAP_MS] },
        level2: { variables: [], dropdown: null, multiSelect: [ADDSUB_OPERATION_MS, ADDSUB_COEFF_L2_MS, ADDSUB_TRAP_MS] },
        level3: { variables: [], dropdown: null, multiSelect: [ADDSUB_OPERATION_MS, ADDSUB_L3_MS] },
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
        level1: { variables: [], dropdown: null, multiSelect: [RATIONALISE_DENOM_L1_MS, RATIONALISE_NUM_L1_MS] },
        // Same denominator-form pool as Level 1 (shared key) — Level 2's own
        // new skill is the numerator, which is now always binomial (see
        // generateRationalise), not a QO choice any more.
        level2: { variables: [], dropdown: null, multiSelect: RATIONALISE_DENOM_L1_MS },
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
    { label: "Level 2 — Yellow", detail: "Same friendly radicand range as Level 1, but now always with a coefficient (2-16) to carry through (e.g. 7√50 = 35√2) — taking out a factor and multiplying it into an existing coefficient, on numbers that are otherwise already familiar." },
    { label: "Level 3 — Red", detail: "Radicand always past 400, from curated extraction values whose square has more than one smaller square factor to notice (e.g. 12² = 144 = 16×9, or 6² = 36 = 4×9) — never a bare prime squared, which hides nothing. The coefficient (2-6) is a genuine choice here, toggle-able in Question Options." },
  ]},
  { title: "Adding & Subtracting", icon: "+", content: [
    { label: "Overview", detail: "Combine surd terms that share the same radicand — only like surds can be added or subtracted. Every level has an Operation toggle to restrict questions to just adding or just subtracting, or leave both on for a mix." },
    { label: "Level 1 — Green", detail: "Already like surds — just combine the coefficients. A rare 'these don't actually combine' trap (~10% when included) is toggleable in Question Options — a check students often skip once they're used to everything combining." },
    { label: "Level 2 — Yellow", detail: "Always requires simplifying each term first before they reveal themselves as like surds (e.g. √12 + √27 → 2√3 + 3√3) — a genuine QO choice for whether each term also carries its own coefficient on top (e.g. 4√12 + 3√27), plus the same rare 'doesn't combine' trap as Level 1." },
    { label: "Level 3 — Red", detail: "Three genuinely distinct extensions, a QO choice: a four-term expression spanning two different surd families to sort and group, distributing a leading negative across a bracket before collecting, and an algebraic (x-carrying) coefficient collected into a single bracketed coefficient (e.g. (4x+3)√11 − 2x√11 = (2x+3)√11)." },
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
    { label: "Level 1 — Green", detail: "Single-surd denominator (sometimes already simplified, sometimes needing simplifying first) with an integer numerator — a genuine choice between a unit fraction (1/√a) and a general integer numerator." },
    { label: "Level 2 — Yellow", detail: "Same friendly single-surd denominator range as Level 1, but the numerator is now always a binomial (k ± c√a) — multiplying it through the denominator's surd is the new skill this level adds." },
    { label: "Level 3 — Red", detail: "Binomial denominator — multiply top and bottom by the conjugate. The numerator can be a single term or itself a binomial." },
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
  // Level 3 always uses the curated "several candidate factors" pool, always
  // past 400 — no rare "already simplest form" trap at this level any more
  // (see randomCuratedHiddenFactorAbove400). Level 1/2 share the same
  // obvious/perfect-square rare-trap pool, on the friendly ≤400 range.
  const radicandCase = level === "level3" ? "hidden" : pickRare(ms, "obvious", "perfectSquare", 0.08);

  const radicand = radicandCase === "perfectSquare" ? randomPerfectSquareRadicand(2, 12)
    // Level 1 and 2: extract a value up to 10, radicand capped at 400 so
    // numbers stay readable even at the top of that range.
    : radicandCase === "obvious" ? randomExtractionRadicand(2, 10, 400)
    // Level 3: curated composite extraction values, always past 400 — the
    // size itself forces breaking the number down via smaller squares.
    : randomCuratedHiddenFactorAbove400();

  // Level 1: never a coefficient. Level 2: always one, on a wider range than
  // Level 3's — taking out a factor and multiplying it into an existing
  // coefficient is itself the new skill Level 2 adds (on Level 1's otherwise
  // -familiar numbers), so it gets more room to vary. Level 3 combines the
  // harder curated radicand with a coefficient that's now a genuine QO
  // choice rather than always-on, so its own range stays modest (2-6) —
  // the radicand size is what makes Level 3 harder, not the coefficient.
  const coeff = level === "level1" ? 1
    : level === "level2" ? randInt(2, 16)
    : pickActive(ms, SIMPLIFY_COEFF_L3_MS.options) === "withCoeff" ? randInt(2, 6) : 1;

  // "full" shows the coefficient-multiply as its own step (see
  // simplifySurdSteps) — needed whenever a coefficient is present, which is
  // now Level 2 always and Level 3 whenever the QO choice includes one.
  const grain: Grain = "full";
  const working = simplifySurdSteps(radicand, coeff, grain);

  const s = simplifySurd(radicand);
  const finalTerm: SurdTerm = { coeff: coeff * s.coeff, radicand: s.radicand };
  const displayLatex = coeff === 1 ? `\\sqrt{${radicand}}` : `${coeff}\\sqrt{${radicand}}`;
  const answerLatex = surdTermToLatex(finalTerm, true);

  // _difficultyScore only at Level 3, where the coefficient is a genuine
  // weighted QO choice (see SIMPLIFY_COEFF_L3_MS) — Level 1/2's rare-trap
  // pool deliberately carries no weight (see pickRare), so there's nothing
  // for the Smart Progressor to sort or balance there.
  const score = level === "level3" ? weightOf(SIMPLIFY_COEFF_L3_MS.options, coeff === 1 ? "none" : "withCoeff") : undefined;
  return questionFrom(displayLatex, answerLatex, working, `simplify-${level}-${radicand}-${coeff}-${nextId()}`, level, score);
}

// Level 3 only, bespoke: (R1 + C1√r) - (R2 ± C2√r), requiring the leading
// negative to be distributed across BOTH of the second bracket's terms
// before anything can combine — a distinct sign-handling skill from Level
// 2's "simplify first". Doesn't fit the flat SurdTerm[]-in, collect-out shape
// the other cases share, so it builds its own leading step and question.
function buildNegativeBracketAddSub(level: DifficultyLevel): AnyQuestion {
  const r = randomSquareFree(2, 20);
  const R1 = randInt(2, 9), R2 = randInt(2, 9);
  const C1 = randInt(1, 6), C2 = randInt(1, 6);
  const innerSign2 = pick([1, -1]); // the sign INSIDE the second bracket, before distributing
  const bracket1: SurdTerm[] = [{ coeff: R1, radicand: 1 }, { coeff: C1, radicand: r }];
  const bracket2: SurdTerm[] = [{ coeff: R2, radicand: 1 }, { coeff: innerSign2 * C2, radicand: r }];
  const terms: SurdTerm[] = [...bracket1, ...bracket2.map((t) => ({ ...t, coeff: -t.coeff }))];

  const displayLatex = `${bracketedLatex(bracket1)} - ${bracketedLatex(bracket2)}`;
  const distributeStep = mStep("Distribute the negative:", [displayLatex, `= ${surdExpressionToLatex(terms)}`]);

  const grain: Grain = "full";
  const working = [distributeStep, ...collectLikeSurdsSteps(terms, grain)];
  const answerTerms = collectLikeSurds(terms);
  const answerLatex = surdExpressionToLatex(answerTerms.length ? answerTerms : [{ coeff: 0, radicand: 1 }]);

  return questionFrom(
    displayLatex,
    answerLatex,
    working,
    `addSub-${level}-negativeBracket-${R1}_${C1}_${innerSign2}_${R2}_${C2}_${r}-${nextId()}`,
    level,
    weightOf(ADDSUB_L3_MS.options, "negativeBracket"),
  );
}

// Level 3 only, bespoke: (ax+b)√r ± cx√r, collecting the x-carrying part and
// the constant part SEPARATELY (they're unlike terms, so the answer stays a
// genuine two-term expression) — e.g. (x+2)√3 - x√3 = 2√3, or with a
// surviving x-term: (3x+2)√5 + x√5 = 4x√5 + 2√5. A genuinely different
// "what counts as a like term" skill from anything numeric-only. Doesn't fit
// the numeric-only SurdTerm shape, so this is entirely bespoke.
function buildAlgebraicCoeffAddSub(level: DifficultyLevel): AnyQuestion {
  const r = randomSquareFree(2, 20);
  const a = randInt(2, 5);
  const b = randInt(1, 8);
  const c = randInt(1, 5);
  const opAdd = pick([true, false]);
  // The x-parts CAN cancel entirely (e.g. (x+2)√3 - x√3 = 2√3) — that's a
  // genuine, valid outcome here, same as any other surd term collapsing to a
  // simpler form, not something to guard against.
  const finalXCoeff = opAdd ? a + c : a - c;

  const xTerm = (coeff: number): string => coeff === 1 ? "x" : coeff === -1 ? "-x" : `${coeff}x`;
  const binomialLatex = `(${xTerm(a)} + ${b})\\sqrt{${r}}`;
  const secondLatex = `${xTerm(c)}\\sqrt{${r}}`;
  const displayLatex = `${binomialLatex} ${opAdd ? "+" : "-"} ${secondLatex}`;

  // Combine the algebraic coefficients into ONE bracketed coefficient — the
  // same "add the coefficients" move any collect-like-surds case makes, just
  // with an algebraic (x-carrying) coefficient. If the x-parts cancel, the
  // bracket collapses to a plain number, same as any other simplification.
  const answerLatex = finalXCoeff === 0
    ? `${b}\\sqrt{${r}}`
    : `(${xTerm(finalXCoeff)} + ${b})\\sqrt{${r}}`;

  const working = [
    mStep("Add the algebraic coefficients:", [displayLatex, `= ${answerLatex}`]),
    mStep("Write the final answer:", answerLatex),
  ];

  return questionFrom(
    displayLatex,
    answerLatex,
    working,
    `addSub-${level}-algebraicCoeff-${a}_${b}_${c}_${opAdd}_${r}-${nextId()}`,
    level,
    weightOf(ADDSUB_L3_MS.options, "algebraicCoeff"),
  );
}

function generateAddSub(level: DifficultyLevel, ms: Record<string, boolean>): AnyQuestion {
  // Level 1/2 layer the rare "doesn't combine" trap on top of their normal
  // case (see ADDSUB_TRAP_MS) — read via pickRare, not pickActive, so it
  // stays genuinely rare rather than forced toward an even split. Level 2
  // always requires simplifying first otherwise — no longer a QO choice (see
  // ADDSUB_COEFF_L2_MS for what Level 2 varies instead).
  const trapFires = (level === "level1" || level === "level2") && pickRare(ms, "combine", "dontCombine", 0.1) === "dontCombine";
  const kase = trapFires ? "dontCombine"
    : level === "level1" ? "alreadyLike"
    : level === "level3" ? pickActive(ms, ADDSUB_L3_MS.options)
    : "needsSimplify";

  // Bespoke Level 3 cases that don't fit the flat SurdTerm[] shape the rest
  // of this function shares — built and returned separately.
  if (kase === "negativeBracket") return buildNegativeBracketAddSub(level);
  if (kase === "algebraicCoeff") return buildAlgebraicCoeffAddSub(level);

  // Operation is a genuine QO choice at every level (see ADDSUB_OPERATION_MS)
  // — restrict to always-add, always-subtract, or a mixed default.
  const s = pickActive(ms, ADDSUB_OPERATION_MS.options) === "add" ? 1 : -1;
  // Level 2's own QO axis (see ADDSUB_COEFF_L2_MS): only meaningful at Level
  // 2 itself.
  const coeffKaseL2 = level === "level2" ? pickActive(ms, ADDSUB_COEFF_L2_MS.options) : "withCoeff";
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
    const useCoeff = coeffKaseL2 === "withCoeff";
    const c1 = useCoeff ? randInt(2, 4) : 1;
    let c2 = useCoeff ? randInt(2, 4) : 1;
    if (s === -1 && c1 * k1 === c2 * k2) c2 += 1;
    terms = [{ coeff: c1, radicand: k1 * k1 * p }, { coeff: s * c2, radicand: k2 * k2 * p }];
  } else if (kase === "dontCombine") {
    const r1 = randomSquareFree(2, 35);
    let r2 = randomSquareFree(2, 35);
    while (r2 === r1) r2 = randomSquareFree(2, 35);
    terms = [{ coeff: randInt(2, 12), radicand: r1 }, { coeff: s * randInt(2, 12), radicand: r2 }];
  } else {
    // multiGroup — level3 only: 4 terms spanning TWO distinct surd families
    // once simplified (p and q), testing sorting/grouping across families
    // rather than just spotting one pair. Each non-leading term independently
    // respects the Operation restriction, so a "mixed" worksheet can show a
    // genuine blend of + and - within one expression.
    const p = randomSquareFree(2, 15);
    let q = randomSquareFree(2, 15);
    while (q === p) q = randomSquareFree(2, 15);
    const [k1, k2, k3, k4] = [2, 3, 4, 5].sort(() => Math.random() - 0.5);
    const signedTerm = (k: number, base: number): SurdTerm => {
      const sgn = pickActive(ms, ADDSUB_OPERATION_MS.options) === "add" ? 1 : -1;
      return { coeff: sgn * randInt(1, 3), radicand: k * k * base };
    };
    terms = [
      { coeff: randInt(1, 3), radicand: k1 * k1 * p },
      signedTerm(k2, p),
      signedTerm(k3, q),
      signedTerm(k4, q),
    ];
  }

  // Surds is where this technique is first taught, not a downstream tool
  // that already assumes it — full grain throughout, not just Level 1.
  const grain: Grain = "full";
  const working = collectLikeSurdsSteps(terms, grain);
  const answerTerms = collectLikeSurds(terms);

  // No score for a Level 2 trap question — the coefficient axis didn't
  // actually influence it (ADDSUB_TRAP_MS carries no weight of its own, by
  // design, so it stays genuinely rare rather than Smart-Progressor-balanced).
  const score = level === "level2" && kase !== "dontCombine" ? weightOf(ADDSUB_COEFF_L2_MS.options, coeffKaseL2)
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
  let score: number | undefined;

  if (level === "level1") {
    // Two independent dimensions: whether the denominator needs simplifying
    // first, and whether the numerator is a genuine unit fraction or some
    // other integer — both can combine on one question, so they're two
    // separate pools rather than one ladder.
    const denomKase = pickActive(ms, RATIONALISE_DENOM_L1_MS.options);
    const numKase = pickActive(ms, RATIONALISE_NUM_L1_MS.options);
    kase = `${denomKase}-${numKase}`;
    const r = denomKase === "needsSimplify" ? randomHiddenFactorRadicand(8, 80, 2) : randomSquareFree(2, 20);
    numerator = numKase === "unit" ? [{ coeff: 1, radicand: 1 }] : [{ coeff: randInt(2, 12), radicand: 1 }];
    denominator = [{ coeff: 1, radicand: r }];
    score = weightOf(RATIONALISE_DENOM_L1_MS.options, denomKase) + weightOf(RATIONALISE_NUM_L1_MS.options, numKase);
  } else if (level === "level2") {
    // Same denominator-form pool as Level 1 (shared key). The new skill here
    // is always a binomial numerator (k ± c√a, sharing the denominator's own
    // surd once simplified) — no longer a QO choice, since Level 1 now
    // already covers the plain-integer-numerator case.
    kase = pickActive(ms, RATIONALISE_DENOM_L1_MS.options);
    const denomRadicand = kase === "needsSimplify" ? randomHiddenFactorRadicand(8, 80, 2) : randomSquareFree(2, 20);
    denominator = [{ coeff: 1, radicand: denomRadicand }];
    const simplified = simplifySurd(denomRadicand).radicand;
    numerator = [{ coeff: randInt(2, 12), radicand: 1 }, { coeff: sign() * randInt(1, 6), radicand: simplified }];
    score = weightOf(RATIONALISE_DENOM_L1_MS.options, kase);
  } else {
    kase = pickActive(ms, RATIONALISE_L3_MS.options);
    const denomOther: SurdTerm = { coeff: randInt(2, 6), radicand: 1 };
    const p: SurdTerm = { coeff: randInt(1, 5), radicand: randomSquareFree(2, 15) };
    denominator = [denomOther, p];
    numerator = kase === "monomial"
      ? [{ coeff: randInt(2, 12), radicand: 1 }]
      : [{ coeff: randInt(2, 12), radicand: 1 }, { coeff: sign() * randInt(1, 5), radicand: randomSquareFree(2, 15) }];
    score = weightOf(RATIONALISE_L3_MS.options, kase);
  }

  // Surds is where this technique is first taught, not a downstream tool
  // that already assumes it — full grain throughout, not just Level 1.
  const grain: Grain = "full";
  const working = rationaliseDenominatorSteps(numerator, denominator, grain);
  const finalFraction = rationaliseDenominator(numerator, denominator);

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
