# Depth Bank Spec: Ratio Manipulation

**Status:** implemented — `src/tools/Proportion/RatioManipulationDepth.ts`, 21 items.

Bank for the **Ratio Manipulation** tool (`specs/ratio-manipulation.md`, `specs/ratio-manipulation-fraction-of.md`), exposed as `__test.depthItems`. It pairs with the *Manipulating ratios* deck, which uses five of the cards (`docs/pathways/decks.md`).

**Structure.** Levels follow the ideas, not the tabs' own levels. Nine general items (no `tool`: three per level, one `startHere` per level) show on every tab; the rest name their tabs: *forming, simplifying, equivalent* (`BASICS`) and *ratio to fraction, fraction to ratio* (`FRACTIONS`). Specific items link only within their group or to a general item.

| Level | Idea | Misconceptions |
|---|---|---|
| 1 Reading a ratio | order, "for every", a ratio is not a fraction | wrong order; reads $1 : 3$ as one third; stops simplifying early; the other part as the denominator |
| 2 Equivalent ratios | scale, do not add; one form each; ratio as counts or as a fraction | adds the same to both parts; divides by the wrong part for $1 : n$; reads $2 : 3$ as exactly 2 and 3 |
| 3 Which fraction? | of the total or of the other part, from one ratio; three parts; $n : 1$ | thinks a ratio gives one fraction only; simplifies with a factor of two parts; forgets the rest |

Every misconception has a tag in `src/shared/misconceptions.ts` (`ratio-…`). Every numeric claim is asserted in `src/tests/ratioManipulationDepth.test.ts`.
