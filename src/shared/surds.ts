// ═══════════════════════════════════════════════════════════════════════════════
// SURDS — pure computation.
//
// Promoted from the Surds tool (src/tools/Number/Surds.tsx) once its
// surd-manipulation techniques were shared into src/shared/techniques/index.ts —
// this is the pure-maths layer those techniques (and the Surds tool's own
// generators) are built on. Every quantity ever displayed (a question, its
// answer, a mid-working intermediate) is derived from these functions — never
// recomputed ad hoc in a step-builder or a generator. That keeps a surd's
// surd-form, its working, and its final answer from ever drifting apart
// (CLAUDE.md: "never store the same fact twice").
//
// A SurdTerm is one term of a surd expression: `coeff * sqrt(radicand)`.
// `radicand === 1` represents a plain rational term (coeff on its own).
// An expression is a `SurdTerm[]`; terms are kept SIMPLIFIED and COLLECTED
// (one term per distinct radicand) by every function that returns one.
// ═══════════════════════════════════════════════════════════════════════════════

export interface SurdTerm {
  coeff: number;
  radicand: number; // 1 => rational term
}

export interface SurdFraction {
  numerator: SurdTerm[];
  denominator: number; // always rational once a fraction has been rationalised
}

// ── Largest-square-factor extraction ────────────────────────────────────────
// The largest f with f² | n leaves n/f² square-free by construction — one
// pass is always enough, no second round of extraction is ever needed.
export function simplifySurd(n: number): { coeff: number; radicand: number } {
  let best = 1;
  for (let f = 2; f * f <= n; f++) {
    if (n % (f * f) === 0) best = f;
  }
  return { coeff: best, radicand: n / (best * best) };
}

const simplifyTerm = (t: SurdTerm): SurdTerm => {
  const s = simplifySurd(t.radicand);
  return { coeff: t.coeff * s.coeff, radicand: s.radicand };
};

// ── Canonical order ──────────────────────────────────────────────────────────
// Rational term first, then surd terms ascending by radicand — one fixed
// house style so an expression never renders two different ways depending on
// which step produced it. Used for every "this is now tidy" display, not
// just the final collected result — sorting never merges, so it's safe to
// apply to an intermediate state a further collecting pass still has to see.
export function sortSurdTerms(terms: SurdTerm[]): SurdTerm[] {
  return [...terms].sort((a, b) => {
    if (a.radicand === 1 && b.radicand !== 1) return -1;
    if (b.radicand === 1 && a.radicand !== 1) return 1;
    return a.radicand - b.radicand;
  });
}

// ── Collecting like surds ────────────────────────────────────────────────────
// Simplifies every term first, then groups by radicand and sums coefficients.
export function collectLikeSurds(terms: SurdTerm[]): SurdTerm[] {
  const groups = new Map<number, number>();
  for (const t of terms) {
    const s = simplifyTerm(t);
    groups.set(s.radicand, (groups.get(s.radicand) ?? 0) + s.coeff);
  }
  return sortSurdTerms(
    [...groups.entries()]
      .filter(([, coeff]) => coeff !== 0)
      .map(([radicand, coeff]) => ({ coeff, radicand })),
  );
}

export function multiplySurdTerms(a: SurdTerm, b: SurdTerm): SurdTerm {
  const s = simplifySurd(a.radicand * b.radicand);
  return { coeff: a.coeff * b.coeff * s.coeff, radicand: s.radicand };
}

// Unsimplified product — for displaying the "just expanded" line before a
// step-builder decides whether a simplify pass is needed. Never used to
// compute a final answer (multiplySurdTerms/multiplyExpressions do that).
export function multiplyTermsRaw(a: SurdTerm, b: SurdTerm): SurdTerm {
  return { coeff: a.coeff * b.coeff, radicand: a.radicand * b.radicand };
}

// General expression × expression (covers monomial×monomial, single-bracket
// distribution, and double-bracket FOIL — the cross-product size is the only
// difference). Result is simplified AND collected.
export function multiplyExpressions(a: SurdTerm[], b: SurdTerm[]): SurdTerm[] {
  const products: SurdTerm[] = [];
  for (const ta of a) for (const tb of b) products.push(multiplySurdTerms(ta, tb));
  return collectLikeSurds(products);
}

// √a ÷ √b — caller guarantees (by construction) that the result is a clean
// simplification; this never silently produces a surd denominator.
export function divideSurdTerms(a: SurdTerm, b: SurdTerm): SurdTerm {
  const s = simplifySurd(a.radicand / b.radicand);
  return { coeff: (a.coeff / b.coeff) * s.coeff, radicand: s.radicand };
}

export function conjugateOf(term: SurdTerm): SurdTerm {
  return { coeff: -term.coeff, radicand: term.radicand };
}

// (p + q)(p − q) = p² − q², evaluated as a plain number (always rational).
export function differenceOfSquaresValue(p: SurdTerm, q: SurdTerm): number {
  return p.coeff * p.coeff * p.radicand - q.coeff * q.coeff * q.radicand;
}

// True exactly when `a`, `b` are conjugate binomial pairs — same first term,
// negated second term. Used to detect the difference-of-two-squares shape.
export function isConjugatePair(a: [SurdTerm, SurdTerm], b: [SurdTerm, SurdTerm]): boolean {
  return (
    a[0].coeff === b[0].coeff && a[0].radicand === b[0].radicand &&
    a[1].coeff === -b[1].coeff && a[1].radicand === b[1].radicand
  );
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

export function simplifyFraction(f: SurdFraction): SurdFraction {
  const magnitudes = f.numerator.map((t) => Math.abs(t.coeff)).concat(Math.abs(f.denominator));
  const g = magnitudes.filter((m) => m !== 0).reduce((a, b) => gcd(a, b), 0) || 1;
  if (g <= 1) return f;
  return {
    numerator: f.numerator.map((t) => ({ ...t, coeff: t.coeff / g })),
    denominator: f.denominator / g,
  };
}

// Rationalise numerator/denominator, where denominator is 1 term (monomial —
// multiply by itself) or 2 terms (binomial — multiply by the conjugate).
// Unifies both cases: the "multiplier" is either the denominator itself or
// its conjugate, and the resulting denominator value is always rational.
export function rationaliseDenominator(numerator: SurdTerm[], denominator: SurdTerm[]): SurdFraction {
  const isBinomial = denominator.length === 2;
  const multiplier: SurdTerm[] = isBinomial ? [denominator[0], conjugateOf(denominator[1])] : denominator;
  let denomValue = isBinomial
    ? differenceOfSquaresValue(denominator[0], denominator[1])
    : denominator[0].coeff * denominator[0].coeff * denominator[0].radicand;
  let num = multiplyExpressions(numerator, multiplier);
  // House style: the final denominator is always positive — a binomial
  // conjugate can easily land negative (e.g. 5^2 - (2√7)^2 = -3).
  if (denomValue < 0) {
    denomValue = -denomValue;
    num = num.map((t) => ({ ...t, coeff: -t.coeff }));
  }
  return simplifyFraction({ numerator: num, denominator: denomValue });
}

// ── LaTeX formatting — the single source of "what a surd expression looks
// like", so every step and every question display agree byte-for-byte. ──────

export function surdTermToLatex(t: SurdTerm, isFirst: boolean): string {
  const abs = Math.abs(t.coeff);
  const body = t.radicand === 1 ? `${abs}` : abs === 1 ? `\\sqrt{${t.radicand}}` : `${abs}\\sqrt{${t.radicand}}`;
  if (isFirst) return t.coeff < 0 ? `-${body}` : body;
  return t.coeff < 0 ? ` - ${body}` : ` + ${body}`;
}

export function surdExpressionToLatex(terms: SurdTerm[]): string {
  if (terms.length === 0) return "0";
  return terms.map((t, i) => surdTermToLatex(t, i === 0)).join("");
}

export function bracketedLatex(terms: SurdTerm[]): string {
  return terms.length === 1 ? surdTermToLatex(terms[0], true) : `(${surdExpressionToLatex(terms)})`;
}

export function rawFractionToLatex(numerator: SurdTerm[], denominator: SurdTerm[]): string {
  return `\\dfrac{${surdExpressionToLatex(numerator)}}{${surdExpressionToLatex(denominator)}}`;
}

export function fractionToLatex(f: SurdFraction): string {
  const num = surdExpressionToLatex(f.numerator);
  return f.denominator === 1 ? num : `\\dfrac{${num}}{${f.denominator}}`;
}
