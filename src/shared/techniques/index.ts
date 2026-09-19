// ═══════════════════════════════════════════════════════════════════════════════
// TECHNIQUES — reusable, pedagogically-titled working-step sequences, each
// renderable at a GRAIN.
//
// A technique encodes the pedagogy of one recurring maths move — its step titles
// and its live-model fragments — ONCE. The same move renders at three grains:
//
//   • "full"     — every micro-step ("Subtract 3 from both sides", "Divide by 2").
//                  The fundamental teaching pattern; this grain IS the (text spine
//                  of the) matching skill.
//   • "standard" — the default worked-example grain: each conceptual move a step,
//                  arithmetic folded into the result.
//   • "brief"    — assumes the student can already do this move; one line, keep going.
//                  What a higher-order tool wants for a prerequisite it doesn't teach.
//
// The TOOL chooses the grain per call (a prerequisite move → brief; the move being
// taught → full). A runtime "detailed working" toggle can drive it later.
//
// Sibling of the slide-based skill library (src/shared/skills): skills teach a
// prerequisite in slides; techniques narrate a move in working steps.
// ═══════════════════════════════════════════════════════════════════════════════

import { step, mStep, tStep } from "../helpers";
import type { WorkingStep } from "../types";
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
  surdExpressionToLatex,
  bracketedLatex,
  rawFractionToLatex,
  fractionToLatex,
} from "../surds";

export type Grain = "brief" | "standard" | "full";

// ── The authoring builder ────────────────────────────────────────────────────
export interface Workings {
  step(title: string, latex: string | string[]): Workings;
  raw(latex: string | string[]): Workings;
  note(text: string): Workings;
  use(steps: WorkingStep[]): Workings;
  visual(caption: string, payload: unknown): Workings;
  build(): WorkingStep[];
}

export const workings = (): Workings => {
  const out: WorkingStep[] = [];
  const push = (s: WorkingStep) => {
    const prev = out[out.length - 1];
    if (prev && s.latex && prev.latex === s.latex) return; // no restate-the-answer duplication
    out.push(s);
  };
  const api: Workings = {
    step(title, latex) { push(mStep(title, latex)); return api; },
    raw(latex) { push(step(latex)); return api; },
    note(text) { push(tStep(text)); return api; },
    use(steps) { steps.forEach(push); return api; },
    visual(caption, payload) { const g: WorkingStep = tStep(caption); g.extra = payload; out.push(g); return api; },
    build() { return out; },
  };
  return api;
};

// ── Small LaTeX helpers ──────────────────────────────────────────────────────
// A titled first row + one untitled row per subsequent SEPARATE line.
const titledLines = (title: string, lines: string[]): WorkingStep[] =>
  lines.length ? [mStep(title, lines[0]), ...lines.slice(1).map((l) => step(l))] : [];

// " + 3" / " - 3" — a signed term to append.
const signed = (n: number): string => (n < 0 ? `- ${-n}` : `+ ${n}`);
// A coefficient prefix: 1 → "", -1 → "-", else the number.
const coef = (n: number): string => (n === 1 ? "" : n === -1 ? "-" : `${n}`);
// n/d as an integer or a reduced-sign fraction.
const frac = (num: number, den: number): string => {
  if (den === 0) return `${num}`;
  if (num % den === 0) return `${num / den}`;
  const s = (num < 0) !== (den < 0) ? "-" : "";
  return `${s}\\dfrac{${Math.abs(num)}}{${Math.abs(den)}}`;
};

// ── Techniques ────────────────────────────────────────────────────────────────

// Solve a quadratic with the formula.
//   brief    — formula → simplified surd (assumes the substitution).
//   standard — formula → substituted → simplified.
//   full     — + the discriminant arithmetic, the ± split, and the decimals
//              (the skill-level teaching of the formula itself).
export const quadraticFormulaSteps = (a: number, b: number, c: number, v = "x", grain: Grain = "standard"): WorkingStep[] => {
  const disc = b * b - 4 * a * c, twoA = 2 * a;
  const formula = `${v} = \\dfrac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}`;
  const subbed = `= \\dfrac{-(${b}) \\pm \\sqrt{(${b})^2 - 4(${a})(${c})}}{2(${a})}`;
  const simplified = `${v} = \\dfrac{${-b} \\pm \\sqrt{${disc}}}{${twoA}}`;

  if (grain === "brief") {
    return [mStep("Use the quadratic formula", [formula, `= \\dfrac{${-b} \\pm \\sqrt{${disc}}}{${twoA}}`])];
  }
  if (grain === "full") {
    const r1 = (-b + Math.sqrt(disc)) / twoA, r2 = (-b - Math.sqrt(disc)) / twoA;
    return [
      mStep("Substitute into the quadratic formula", [formula, subbed]),
      mStep("Work out the discriminant", [
        `b^2 - 4ac = (${b})^2 - 4(${a})(${c})`,
        `= ${b * b} - (${4 * a * c})`,
        `= ${disc}`,
      ]),
      mStep("Simplify", [simplified]),
      mStep("Take the + and − in turn", [
        `${v} = \\dfrac{${-b} + \\sqrt{${disc}}}{${twoA}} \\quad \\text{or} \\quad ${v} = \\dfrac{${-b} - \\sqrt{${disc}}}{${twoA}}`,
      ]),
      mStep("As decimals (2 d.p.)", [`${v} \\approx ${r1.toFixed(2)} \\quad \\text{or} \\quad ${v} \\approx ${r2.toFixed(2)}`]),
    ];
  }
  return [
    mStep("Substitute into the quadratic formula", [formula, subbed]),
    mStep("Simplify under the root", [simplified]),
  ];
};

// Solve a linear equation a·v + b = c — the "do the same to both sides" teaching.
//   full     — name each both-sides operation ("Subtract 3 from both sides", …).
//   standard — collect, then divide (two rows).
//   brief    — one line.
export const solveLinearEquationSteps = (a: number, b: number, c: number, v = "x", grain: Grain = "standard"): WorkingStep[] => {
  const rhs = c - b, result = frac(rhs, a);
  if (grain === "brief") return [mStep(`Solve for ${v}`, [`${v} = ${result}`])];
  if (grain === "full") {
    const op = b < 0 ? `Add ${-b} to both sides` : `Subtract ${b} from both sides`;
    const steps: WorkingStep[] = [
      mStep(op, [`${coef(a)}${v} = ${c} ${signed(-b)}`, `${coef(a)}${v} = ${rhs}`]),
    ];
    if (a !== 1) steps.push(mStep(`Divide both sides by ${a}`, [`${v} = \\dfrac{${rhs}}{${a}}`, `${v} = ${result}`]));
    return steps;
  }
  return titledLines(`Solve for ${v}`, a !== 1 ? [`${coef(a)}${v} = ${rhs}`, `${v} = ${result}`] : [`${v} = ${result}`]);
};

// Read the roots off a factorised expression. `roots` are ready LaTeX strings.
export const solveFactorsSteps = (roots: string[], v = "x"): WorkingStep[] => {
  const uniq = roots.filter((r, i) => roots.indexOf(r) === i);
  const line = uniq.map((r) => `${v} = ${r}`).join(" \\quad \\text{or} \\quad ");
  return [mStep("Set each factor equal to zero and solve", [line])];
};

// Substitute a found value (or values) back to get the other unknown. Each line in
// `body` is a SEPARATE row; the title names the value + equation when given.
export const substituteBackSteps = (
  varName: string,
  body: string | string[],
  ctx?: { value?: string; into?: string },
): WorkingStep[] => {
  const title = ctx?.value && ctx?.into
    ? `Substitute ${ctx.value} into ${ctx.into} to find ${varName}`
    : `Substitute back to find ${varName}`;
  return titledLines(title, Array.isArray(body) ? body : [body]);
};

// Rearrange an equation to make a variable the subject.
export const makeSubjectSteps = (
  varName: string, resultLatex: string | string[], eqLabel = "(2)",
): WorkingStep[] => [mStep(`Rearrange equation ${eqLabel} to make ${varName} the subject`, resultLatex)];

// Solve a linear equation from a pre-built chain of lines (one row per move).
export const solveLinearlySteps = (v: string, chain: string[]): WorkingStep[] =>
  titledLines(`Expand and solve for ${v}`, chain);

// ── Surd techniques ───────────────────────────────────────────────────────────
// Promoted from the Surds tool (src/tools/Number/Surds.tsx), which now pulls
// all four back through this file — see docs/PATCH_NOTES.md for the
// promotion commit. Operate on SurdTerm (src/shared/surds.ts), not general
// algebraic terms, so `expandSurdBracketsSteps` is named apart from the
// still-unbuilt generic `expandBrackets` technique in the audit backlog
// (docs/PROJECTS.md) — that one will take algebraic terms, a different shape,
// when it's eventually built for ExpandingBrackets/NonLinearSimEq.

// Simplify a surd: find the largest square factor, split the root, evaluate it.
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

// Collect like surds: simplify every term first, then group and sum matching
// radicands. Explicitly handles the "these don't combine" case rather than
// leaving it to fall out silently — recognising when NOT to act is its own
// taught outcome.
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

// Expand brackets (surd-flavoured): multiply every term in the first bracket
// by every term in the second (a single-term "bracket" covers plain
// distribution). Detects the difference-of-two-squares shape as a named
// special case, and otherwise chains "expand -> simplify any surds produced
// -> collect like terms", emitting only the sub-steps a given pair of
// brackets actually needs.
//   brief    — jump straight to the fully expanded, collected result.
//   standard/full — the full expand / simplify / collect chain, only showing
//                   the sub-steps a given question actually needs.
export function expandSurdBracketsSteps(a: SurdTerm[], b: SurdTerm[], grain: Grain = "standard"): WorkingStep[] {
  const bracketA = bracketedLatex(a);
  const bracketB = bracketedLatex(b);
  const label = a.length === 1 ? "Distribute:" : "Expand using FOIL:";
  // Two bare terms (no bracket on either side) need an explicit "\times" —
  // juxtaposition only reads as multiplication once at least one side is
  // itself a bracket (a coefficient against a bracket, or bracket×bracket).
  const joined = a.length === 1 && b.length === 1 ? `${bracketA} \\times ${bracketB}` : `${bracketA}${bracketB}`;

  if (a.length === 2 && b.length === 2 && isConjugatePair(a as [SurdTerm, SurdTerm], b as [SurdTerm, SurdTerm])) {
    const [p, q] = a;
    const pSqLatex = p.radicand === 1 ? `${Math.abs(p.coeff)}^2` : `(\\sqrt{${p.radicand}})^2`;
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

// Rationalise the denominator: multiply top and bottom by whatever makes the
// denominator rational (the surd itself for a monomial denominator, its
// conjugate for a binomial one), then simplify. Composes the two techniques
// above rather than re-deriving them: the denominator's simplify-first pass
// calls simplifySurdSteps, and a binomial denominator's "becomes rational"
// step calls expandSurdBracketsSteps (which always hits the
// difference-of-squares branch here, since the multiplier is constructed as
// the exact conjugate).
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

  // The denominator becoming rational is exactly `expandSurdBracketsSteps(denom,
  // multiplier)` — a monomial "multiplies by itself" (not a difference of
  // squares), a binomial always hits the conjugate/difference-of-squares
  // branch since `multiplier` IS denom's conjugate by construction.
  if (isBinomial) {
    steps.push(...expandSurdBracketsSteps(denom, multiplier, "standard"));
  } else {
    steps.push(mStep("The denominator becomes rational:", [
      `${multiplierLatex} \\times ${multiplierLatex}`,
      `= ${denomValue}`,
    ]));
  }

  // Skip only when the numerator is a bare, literal "1" over a monomial
  // denominator — multiplying by 1 has nothing worth showing. Any other
  // numerator (a coefficient, a binomial, or both) gets its own step so the
  // chain doesn't jump straight from "denominator becomes rational" to an
  // answer that assumes an unshown multiplication.
  const numeratorIsBareOne = numerator.length === 1 && numerator[0].coeff === 1 && numerator[0].radicand === 1;
  if (!numeratorIsBareOne) {
    steps.push(mStep("Multiply out the numerator:", [
      `${bracketedLatex(numerator)} \\times ${multiplierLatex}`,
      `= ${surdExpressionToLatex(newNumerator)}`,
    ]));
  }

  // House style: the denominator is always left positive. A binomial
  // conjugate can easily land negative (e.g. 5^2 - (2\sqrt{7})^2 = -3) —
  // flip both signs rather than ship an answer with a negative denominator.
  let signedNumerator = newNumerator;
  let signedDenomValue = denomValue;
  if (denomValue < 0) {
    signedNumerator = newNumerator.map((t) => ({ ...t, coeff: -t.coeff }));
    signedDenomValue = -denomValue;
    steps.push(mStep("Make the denominator positive:", [
      `\\dfrac{${surdExpressionToLatex(newNumerator)}}{${denomValue}}`,
      `= \\dfrac{${surdExpressionToLatex(signedNumerator)}}{${signedDenomValue}}`,
    ]));
  }

  // The fraction may still share a common factor (e.g. 6/√3 rationalises to
  // 6√3/3, which reduces to 2√3) — show that reduction rather than jumping
  // straight to an already-simplified final answer with no step to justify it.
  const preReduceLatex = fractionToLatex({ numerator: signedNumerator, denominator: signedDenomValue });
  const finalLatex = fractionToLatex(finalFraction);
  if (preReduceLatex !== finalLatex) {
    steps.push(mStep("Simplify the fraction:", [preReduceLatex, `= ${finalLatex}`]));
  }

  steps.push(mStep("Write the final answer:", finalLatex));
  return steps;
}
