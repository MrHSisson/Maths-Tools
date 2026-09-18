// ═══════════════════════════════════════════════════════════════════════════════
// SURDS — working-step builders.
//
// ── Candidate techniques ─────────────────────────────────────────────────────
// The four builders below are deliberately written to the SAME CONTRACT as a
// real technique in src/shared/techniques/index.ts: a pure function of
// (mathematical inputs, grain) -> WorkingStep[], grain-aware over the same
// "brief" | "standard" | "full" vocabulary, authoring the pedagogy (step
// titles, fragment order) once. See CLAUDE.md's Techniques-engine section and
// docs/design/templates/TECHNIQUE_SPEC_TEMPLATE.md for the reference shape.
//
// They are kept LOCAL to this tool for now — per docs/PROJECTS.md's Priorities
// ("Techniques engine... build on demand, not a sweep"), nothing here should
// force a shared-infrastructure change just to ship Surds. If a second TOOL
// (not sub-tool) later needs one of these — `expandBracketsSteps` is the
// clear candidate, since ExpandingBrackets and NonLinearSimEq are already
// flagged as waiting on exactly this move — promotion should be a near-verbatim
// cut into src/shared/techniques/index.ts:
//   - same signature shape (inputs, grain) => WorkingStep[]
//   - same Grain type (import from there instead of declaring locally)
//   - swap SurdTerm-flavoured inputs for that technique's own arg shape where
//     the move is being generalised beyond surds (e.g. expandBrackets would
//     take algebraic terms, not SurdTerm — the pedagogy/step-shape carries
//     over even though the term representation would need widening)
//
// `collectLikeSurdsSteps` is the surd-flavoured sibling of the already-flagged
// `collectLikeTerms` technique (docs/PROJECTS.md) rather than a literal reuse
// candidate — the matching key differs (radicand vs. variable+power) — kept
// separate deliberately rather than forcing a premature generic merge.
// ═══════════════════════════════════════════════════════════════════════════════

import { step, mStep, type WorkingStep } from "../../shared";
import {
  type SurdTerm,
  simplifySurd,
  collectLikeSurds,
  sortSurdTerms,
  multiplyTermsRaw,
  multiplyExpressions,
  conjugateOf,
  differenceOfSquaresValue,
  isConjugatePair,
  rationaliseDenominator,
  surdTermToLatex,
  surdExpressionToLatex,
  bracketedLatex,
  rawFractionToLatex,
  fractionToLatex,
} from "./surdsMath";

export type Grain = "brief" | "standard" | "full";

// ── Technique 1: simplify a surd ─────────────────────────────────────────────
// The one move: find the largest square factor, split the root, evaluate it.
//   brief    — one line, factor jump assumed.
//   standard — the factor-split chain as one fragment-revealed step.
//   full     — same chain, PLUS the coefficient multiply as its own step when
//              a coefficient is already present (e.g. 3√48) — two separate
//              taught moves rather than one folded line.
export function simplifySurdSteps(radicand: number, coeff: number = 1, grain: Grain = "standard"): WorkingStep[] {
  const s = simplifySurd(radicand);

  if (s.coeff === 1) {
    // Nothing to extract — a deliberate case worth stating, not skipping.
    return grain === "brief"
      ? [step(coeff === 1 ? `\\sqrt{${radicand}}` : `${coeff}\\sqrt{${radicand}}`)]
      : [mStep("Already in simplest form — no square number divides it:", coeff === 1 ? `\\sqrt{${radicand}}` : `${coeff}\\sqrt{${radicand}}`)];
  }

  if (s.radicand === 1) {
    // The radicand IS a perfect square — the root disappears entirely, not
    // just partially. Genuinely distinct from the general case below: the
    // answer is a plain integer, never "…\sqrt{1}" — a case worth its own
    // branch, since students who are fine at extracting a partial factor
    // often still don't expect the root to vanish completely.
    const finalCoeff = coeff * s.coeff;
    if (grain === "brief") {
      return [step([coeff === 1 ? `\\sqrt{${radicand}}` : `${coeff}\\sqrt{${radicand}}`, `= ${finalCoeff}`])];
    }
    const recognise = mStep("This is a perfect square — the root disappears completely:", [
      `\\sqrt{${radicand}}`,
      `= ${s.coeff}`,
    ]);
    if (coeff === 1) return [recognise];
    if (grain === "standard") {
      return [mStep("This is a perfect square — the root disappears completely:", [
        `${coeff}\\sqrt{${radicand}}`,
        `= ${coeff} \\times ${s.coeff}`,
        `= ${finalCoeff}`,
      ])];
    }
    return [recognise, mStep("Multiply by the coefficient:", [`${coeff} \\times ${s.coeff}`, `= ${finalCoeff}`])];
  }

  const sqFactor = s.coeff * s.coeff;

  if (grain === "brief") {
    const finalCoeff = coeff * s.coeff;
    return [step([
      coeff === 1 ? `\\sqrt{${radicand}}` : `${coeff}\\sqrt{${radicand}}`,
      `= ${finalCoeff}\\sqrt{${s.radicand}}`,
    ])];
  }

  if (coeff === 1) {
    return [mStep("Find the largest square factor and split the root:", [
      `\\sqrt{${radicand}}`,
      `= \\sqrt{${sqFactor} \\times ${s.radicand}}`,
      `= ${s.coeff}\\sqrt{${s.radicand}}`,
    ])];
  }

  if (grain === "standard") {
    return [mStep("Find the largest square factor and split the root:", [
      `${coeff}\\sqrt{${radicand}}`,
      `= ${coeff}\\sqrt{${sqFactor} \\times ${s.radicand}}`,
      `= ${coeff} \\times ${s.coeff}\\sqrt{${s.radicand}}`,
      `= ${coeff * s.coeff}\\sqrt{${s.radicand}}`,
    ])];
  }

  // full — coefficient multiply gets its own taught step.
  return [
    mStep("Find the largest square factor and split the root:", [
      `\\sqrt{${radicand}}`,
      `= \\sqrt{${sqFactor} \\times ${s.radicand}}`,
      `= ${s.coeff}\\sqrt{${s.radicand}}`,
    ]),
    mStep("Multiply by the coefficient:", [
      `${coeff} \\times ${s.coeff}\\sqrt{${s.radicand}}`,
      `= ${coeff * s.coeff}\\sqrt{${s.radicand}}`,
    ]),
  ];
}

// ── Technique 2: collect like surds ──────────────────────────────────────────
// The one move: simplify every term, then group and sum matching radicands.
// Explicitly handles the "these don't combine" case rather than leaving it to
// fall out silently — recognising when NOT to act is its own taught outcome.
//   brief    — jump straight to the collected result.
//   standard/full — show the pre-simplify pass (only if genuinely needed) then
//                   the collect pass as its own titled step.
export function collectLikeSurdsSteps(terms: SurdTerm[], grain: Grain = "standard"): WorkingStep[] {
  const simplified = terms.map((t) => {
    const s = simplifySurd(t.radicand);
    return { coeff: t.coeff * s.coeff, radicand: s.radicand };
  });
  const neededPreSimplify = simplified.some((t, i) => t.radicand !== terms[i].radicand);
  const distinctRadicands = new Set(simplified.map((t) => t.radicand)).size;
  const collected = collectLikeSurds(terms);
  // Canonical order for every "tidied" display below — sorting never merges,
  // so it's safe whether or not a further collecting pass follows.
  const simplifiedSorted = sortSurdTerms(simplified);

  const steps: WorkingStep[] = [];
  if (neededPreSimplify && grain !== "brief") {
    steps.push(mStep("Simplify each surd first:", [
      surdExpressionToLatex(terms),
      `= ${surdExpressionToLatex(simplifiedSorted)}`,
    ]));
  }

  if (distinctRadicands === simplified.length) {
    // No two terms share a radicand — genuinely nothing to combine.
    steps.push(
      grain === "brief"
        ? step(surdExpressionToLatex(simplifiedSorted))
        : mStep("These are not like surds — they cannot be combined:", surdExpressionToLatex(simplifiedSorted)),
    );
    return steps;
  }

  steps.push(
    grain === "brief"
      ? step([surdExpressionToLatex(simplifiedSorted), `= ${surdExpressionToLatex(collected)}`])
      : mStep("Collect the like surds:", [surdExpressionToLatex(simplifiedSorted), `= ${surdExpressionToLatex(collected)}`]),
  );
  return steps;
}

// ── Technique 3: expand brackets ─────────────────────────────────────────────
// The one move: multiply every term in the first bracket by every term in the
// second (a single-term "bracket" covers plain distribution). Detects the
// difference-of-two-squares shape as a named special case, and otherwise
// chains "expand -> simplify any surds produced -> collect like terms",
// emitting only the sub-steps a given pair of brackets actually needs — this
// is the guaranteed depth for the "expand then collect" and "simplify after
// expanding" cases (see docs/PROJECTS.md's `expandBrackets` technique row —
// this is that same move, see the file header for the promotion note).
//   brief    — jump straight to the fully expanded, collected result.
//   standard/full — the full expand / simplify / collect chain, only showing
//                   the sub-steps a given question actually needs.
export function expandBracketsSteps(a: SurdTerm[], b: SurdTerm[], grain: Grain = "standard"): WorkingStep[] {
  const bracketA = bracketedLatex(a);
  const bracketB = bracketedLatex(b);
  const label = a.length === 1 ? "Distribute:" : "Expand using FOIL:";
  // Two bare terms (no bracket on either side) need an explicit "\times" —
  // juxtaposition only reads as multiplication once at least one side is
  // itself a bracket (a coefficient against a bracket, or bracket×bracket).
  const joined = a.length === 1 && b.length === 1 ? `${bracketA} \\times ${bracketB}` : `${bracketA}${bracketB}`;

  if (a.length === 2 && b.length === 2 && isConjugatePair(a as [SurdTerm, SurdTerm], b as [SurdTerm, SurdTerm])) {
    const [p, q] = a;
    const pSqLatex = p.radicand === 1 ? `${p.coeff}^2` : `(\\sqrt{${p.radicand}})^2`;
    const qSqLatex = q.radicand === 1 ? `${Math.abs(q.coeff)}^2` : `(\\sqrt{${q.radicand}})^2`;
    const pVal = p.coeff * p.coeff * p.radicand;
    const qVal = q.coeff * q.coeff * q.radicand;
    const chain = [joined, `= ${pSqLatex} - ${qSqLatex}`, `= ${pVal} - ${qVal}`, `= ${pVal - qVal}`];
    return grain === "brief"
      ? [step([chain[0], chain[chain.length - 1]])]
      : [mStep("Multiply using the difference of two squares:", chain)];
  }

  // Raw (UNsimplified) products — the "simplify any surds produced" step
  // below is only meaningful if this line hasn't already extracted square
  // factors out from under it.
  const rawProducts: SurdTerm[] = [];
  for (const ta of a) for (const tb of b) rawProducts.push(multiplyTermsRaw(ta, tb));
  const finalCollected = collectLikeSurds(rawProducts);

  if (grain === "brief") {
    return [step([joined, `= ${surdExpressionToLatex(finalCollected)}`])];
  }

  // Decide up front whether the raw FOIL line will be the TERMINAL state
  // (nothing left to simplify or collect) — if so it must already be in
  // canonical order, since it then has to read exactly as the final answer
  // does. Otherwise keep genuine FOIL order: seeing cross terms in the order
  // they were produced, not yet tidied, is what makes the next step's
  // simplifying/collecting legible as an action rather than a fait accompli.
  const simplifiedCurrent = rawProducts.map((t) => {
    const s = simplifySurd(t.radicand);
    return { coeff: t.coeff * s.coeff, radicand: s.radicand };
  });
  const neededSimplify = simplifiedCurrent.some((t, i) => t.radicand !== rawProducts[i].radicand);
  const neededCollect = collectLikeSurds(neededSimplify ? simplifiedCurrent : rawProducts).length < rawProducts.length;
  const isTerminal = !neededSimplify && !neededCollect;

  const steps: WorkingStep[] = [mStep(label, [
    joined,
    `= ${surdExpressionToLatex(isTerminal ? sortSurdTerms(rawProducts) : rawProducts)}`,
  ])];

  let current = rawProducts;
  if (neededSimplify) {
    // Canonical order for the "tidied" side — matters most when this is the
    // LAST step (no collect step follows), since it must then read exactly
    // as the final answer does.
    const simplifiedSorted = sortSurdTerms(simplifiedCurrent);
    steps.push(mStep("Simplify any surds produced:", [surdExpressionToLatex(current), `= ${surdExpressionToLatex(simplifiedSorted)}`]));
    current = simplifiedSorted;
  }

  const collected = collectLikeSurds(current);
  if (collected.length < current.length) {
    steps.push(mStep("Collect like terms:", [surdExpressionToLatex(current), `= ${surdExpressionToLatex(collected)}`]));
  }

  return steps;
}

// ── Technique 4: rationalise the denominator ─────────────────────────────────
// The one move: multiply top and bottom by whatever makes the denominator
// rational (the surd itself for a monomial denominator, its conjugate for a
// binomial one), then simplify. Composes techniques 1 and 3 rather than
// re-deriving them — this is the concrete "shared step-builder" reuse the
// design conversation called for: the denominator's simplify-first pass calls
// simplifySurdSteps, and a binomial denominator's "becomes rational" step
// calls expandBracketsSteps (which always hits the difference-of-squares
// branch here, since the multiplier is constructed as the exact conjugate).
//   brief    — jump straight to the final rationalised fraction.
//   standard/full — simplify the denominator first only if it needs it,
//                   multiply top & bottom, show the denominator becoming
//                   rational, expand the numerator if it's not a single term.
export function rationaliseDenominatorSteps(numerator: SurdTerm[], denominator: SurdTerm[], grain: Grain = "standard"): WorkingStep[] {
  let denom = denominator;
  const steps: WorkingStep[] = [];

  if (denom.length === 1 && denom[0].coeff === 1) {
    const s = simplifySurd(denom[0].radicand);
    if (s.coeff !== 1) {
      if (grain !== "brief") {
        steps.push(...simplifySurdSteps(denom[0].radicand, 1, "brief"));
      }
      denom = [{ coeff: s.coeff, radicand: s.radicand }];
      if (grain !== "brief") {
        steps.push(mStep("Rewrite the fraction:", rawFractionToLatex(numerator, denom)));
      }
    }
  }

  const isBinomial = denom.length === 2;
  const multiplier: SurdTerm[] = isBinomial ? [denom[0], conjugateOf(denom[1])] : denom;
  const multiplierLatex = bracketedLatex(multiplier);

  const newNumerator = multiplyExpressions(numerator, multiplier);
  const denomValue = isBinomial
    ? differenceOfSquaresValue(denom[0], denom[1])
    : denom[0].coeff * denom[0].coeff * denom[0].radicand;
  // The single source of truth for the answer — computed the same way
  // regardless of grain, so the shown working always lands on it exactly.
  const finalFraction = rationaliseDenominator(numerator, denom);

  if (grain === "brief") {
    steps.push(step([rawFractionToLatex(numerator, denom), `= ${fractionToLatex(finalFraction)}`]));
    return steps;
  }

  steps.push(mStep(
    isBinomial ? "Multiply top and bottom by the conjugate:" : "Multiply top and bottom by the surd in the denominator:",
    `${rawFractionToLatex(numerator, denom)} \\times \\dfrac{${multiplierLatex}}{${multiplierLatex}}`,
  ));

  // The denominator becoming rational is exactly `expandBracketsSteps(denom,
  // multiplier)` — a monomial "multiplies by itself" (not a difference of
  // squares), a binomial always hits the conjugate/difference-of-squares
  // branch since `multiplier` IS denom's conjugate by construction.
  if (isBinomial) {
    steps.push(...expandBracketsSteps(denom, multiplier, "standard"));
  } else {
    steps.push(mStep("The denominator becomes rational:", [
      `${multiplierLatex} \\times ${multiplierLatex}`,
      `= ${denomValue}`,
    ]));
  }

  if (numerator.length > 1 || isBinomial) {
    steps.push(mStep("Expand the numerator:", [
      `${bracketedLatex(numerator)} \\times ${multiplierLatex}`,
      `= ${surdExpressionToLatex(newNumerator)}`,
    ]));
  }

  // House style: the denominator is always left positive. A binomial
  // conjugate can easily land negative (e.g. 5^2 - (2\sqrt{7})^2 = -3) —
  // flip both signs rather than ship an answer with a negative denominator.
  if (denomValue < 0) {
    const flippedNumerator = newNumerator.map((t) => ({ ...t, coeff: -t.coeff }));
    steps.push(mStep("Make the denominator positive:", [
      `\\dfrac{${surdExpressionToLatex(newNumerator)}}{${denomValue}}`,
      `= \\dfrac{${surdExpressionToLatex(flippedNumerator)}}{${-denomValue}}`,
    ]));
  }

  steps.push(mStep("Write the final answer:", fractionToLatex(finalFraction)));
  return steps;
}

// Re-export the surface a generator needs alongside the step builders, so a
// tool file only imports from one place for the "surds engine".
export { surdTermToLatex };
