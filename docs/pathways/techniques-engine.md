# Techniques engine
- **Status:** rolling out
- **Measure:** (to add: a `techniques` fact; 3 tools by hand as of 2026-10-28)
- **Updated:** 2026-10-28

## Intention
Titled, fragmented, grain-aware (brief, standard, full) working blocks written once and reused, so tools stop hand-rolling thin working.

## Progress
- Engine in `src/shared/techniques/`. Ten techniques: `quadraticFormulaSteps`, `solveLinearEquationSteps` (optional `unit`), `solveFactorsSteps`, `substituteBackSteps`, `makeSubjectSteps`, `solveLinearlySteps`, and four surd techniques (`simplifySurdSteps`, `collectLikeSurdsSteps`, `expandSurdBracketsSteps`, `rationaliseDenominatorSteps`).
- Preview page per technique at `/techniques/<slug>`, listed in the Technique Library (`/techniques`, Developing-tools only).
- Used by Surds, Simultaneous Equations (Substitution, dev-only branch) and Angles in Triangles.
- Known gaps: the answer-step split only recognises the full-grain inline chain; no `collectLikeTerms` or angle-facts technique; `GRAIN` is a per-tool constant; Simultaneous Equations (Substitution) keeps its hand-rolled chain for everyone and the `(2x-5)^2` expansion is never shown.

## Next steps
- A runtime "Detailed working" toggle so a teacher can flip grain live (the one shell-level change on the list).
- Convert more tools, high-frequency moves first (see the backlog below); add a CI shape-check once enough are converted.
- Add a `techniques` fact so the x/n comes from the code.

## Where to read more
`src/shared/techniques/`, `specs/techniques/README.md`, `docs/design/templates/TECHNIQUE_SPEC_TEMPLATE.md`.

## Technique backlog
Status: built, partial or needed. Rows for tools not yet converted are inferred demand; confirm the exact moves when each tool is reviewed.

| Technique | Move | Priority | Status |
|---|---|---|---|
| `solveLinearEquation` | isolate, collect, divide to solve `ax+b=c` | **high** | 🚧 built; adopted by Angles in Triangles; needed by Solving Linear Equations |
| `expandBrackets` | single / double / squared brackets (FOIL, grid) | **high** | ⬜ needed by Expanding Brackets and Simultaneous Equations (Substitution); needs a general-term arg shape (the surd version exists) |
| `substitute` | substitute a value or expression into an equation | **high** | 🚧 substitute-back only |
| `collectLikeTerms` | gather like terms | med | ⬜ Collecting Like Terms, Expanding Brackets, Solving Linear Equations |
| `makeSubject` | rearrange for one variable | med | 🚧 brief only |
| `factoriseQuadratic` | factorise → set to zero → roots | med | 🚧 read-the-roots half exists |
| `quadraticFormula` | formula → substitute → discriminant → roots | med | ✅ |
| `completeTheSquare` | half the x-coefficient, form `(x+p)²+q` | low | ⬜ |
| `solveByElimination` | scale, add or subtract to eliminate | med | ⬜ Simultaneous Equations (Elimination); cheaper than a fresh build |
| `solveByIteration` | change-of-sign interval, iterate, bound-test | med | ⬜ Iteration's three sub-tools map almost 1:1 |
| `simplifyFraction` · `fractionOfAmount` | divide by a common factor; ÷ denominator, × numerator | **high** | ⬜ |
| `convertMixedImproper` · `addSubtractFractions` · `multiplyDivideFractions` | mixed ⇄ improper; common denominator; keep-flip-change | med | ⬜ |
| `roundToSigFig` | round each value to 1 s.f. | med | ⬜ Estimation |
| `directedNumberAddSub` · `scaleByPowerOfTen` | jump by sign rules; shift the digits | low | ⬜ |
| `percentageOfAmount` · `percentageChange` · `reversePercentage` | multiplier / chunking; build from 100 ± %; unitary method | med | ⬜ Percentages |
| `shareInRatio` | total parts → 1 part → each share | **high** | ⬜ Ratio Sharing |
| `convertFractionRatio` · `simplifyRatio` | fraction ⇄ ratio; divide parts by a common factor | med | ⬜ |
| `unitPriceCompare` · `scaleRecipe` | price ÷ quantity; scale ingredients | low | ⬜ Best Buys and Recipes need broader specs than these rows |
| `applyAngleFact` | sum to 180/360, isosceles, exterior, on a line or point | **high** | ⬜ five of the eight Geometry tools; the biggest single demand |
| `gradientIntercept` · `circleFormula` · `sumPerimeter` | gradient and `y = mx + c`; circumference, area, arc, sector; add sides / derive a missing side | low–med | ⬜ |
