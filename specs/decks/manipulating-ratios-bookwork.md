# Manipulating ratios: book work to replace Worksheet 1 (for review)

**Status (2026-11-01, later): built in the repo copy.** Worksheets 1 and 2 are now hand-written nine-question book work slides (`mr-w1`, `mr-w2`), built and checked by `specs/decks/_check/ratio-bookwork-build.py`; Harry chose to hand-write all of them, including question 9, so the tool is not changed (the open point below is closed: option b, but with the bar model working). The second set (of a part) is in the table at the end. Not yet in the shared copy (the decks service was failing). Original plan: Decided in chat 2026-11-01: Worksheet 1 is arbitrary and quick to finish, so it becomes **nine questions answered in books**, climbing to three-part ratios, ending on a walk, car, bicycle context. All nine fit on one slide with no title. Worksheets 2 and 3 are to be looked at later (3 may stay, 2 may go).

**How it is checked** (`docs/design/DECK_BUILD_CHECKLIST.md`): every answer recomputed by a different route (counting equal parts), every trap checked to give a different answer, no answer repeated (`specs/decks/_check/ratio-bookwork-check.py`, all pass). Questions 1 to 8 would be built with the tool's own code (`Q.ratioFraction`), so the working (the bar model) matches the generator.

| # | Ratio | Question | Answer | What the wrong method gives |
|---|---|---|---|---|
| 1 | green : yellow counters = 2 : 7 | What fraction of the counters are green? | 2/9 | the ratio as a fraction: 2/7 |
| 2 | bananas : grapes = 4 : 5 | Find the fraction of the fruit that are grapes. | 5/9 | the ratio as a fraction: 5/4 |
| 3 | adults : children = 3 : 8 | Write children as a fraction of the total. | 8/11 | the ratio as a fraction: 8/3 |
| 4 | Year 7s : Year 8s = 12 : 8 | What fraction of the pupils are Year 7s? | 3/5 | 3/2; and not simplified, 12/20 |
| 5 | red : blue marbles = 10 : 6 | What fraction of the marbles are red? | 5/8 | 5/3 |
| 6 | apples : oranges = 9 : 21 | Find the fraction of the fruit that are oranges. | 7/10 | 7/3 |
| 7 | strawberry : lemon : orange sweets = 3 : 5 : 4 | What fraction of the sweets are lemon? | 5/12 | one part over another, 5/3; over the other two only, 5/7 |
| 8 | roses : tulips : daisies = 5 : 3 : 4 | What fraction of the flowers are not roses? | 7/12 | one part only, 1/4; over the roses, 7/5 |
| 9 | walk : car : bicycle = 6 : 7 : 5 | What fraction of the pupils are travelling on tyres? | 2/3 | car only, 7/18; walkers, 1/3; over the walkers, 2/1 |

**Ladder:** 1 to 3 two parts, either part, simple; 4 to 6 two parts that simplify (12 : 8, 10 : 6, 9 : 21); 7 three parts, one part; 8 three parts, two together named by leaving one out; 9 the same idea in a real context where the class must decide which parts need tyres.

**Open point on question 9:** the tool has no walk, car, bicycle context. Either (a) add one small context to the tool (`THREE` in `ratioFractionOf.ts`, with "travelling on tyres" as the name for car and bicycle together), which also makes it available to the generator and Worksheets, with the bar-model working; or (b) write question 9 by hand with plain working and no bar. (a) is my recommendation.


## Set 2 — of a part (replaces Worksheet 2)

Same ladder: 1 to 3 two parts (fractions can be improper), 4 to 6 two parts that simplify, 7 to 9 three parts. Working is the bar model with numerator and denominator rows; "do not add the parts".

| # | Ratio | Question | Answer | What the wrong method gives |
|---|---|---|---|---|
| 1 | wins : losses = 3 : 4 | wins as a fraction of losses | 3/4 | of the total, 3/7 |
| 2 | green : yellow = 5 : 2 | green as a fraction of yellow | 5/2 | of the total, 5/7; reversed, 2/5 |
| 3 | Year 7s : Year 8s = 4 : 9 | Year 8s as a fraction of Year 7s | 9/4 | of the total, 9/13; reversed, 4/9 |
| 4 | bananas : grapes = 6 : 9 | bananas as a fraction of grapes | 2/3 | of the total, 2/5; not simplified, 6/9 |
| 5 | red : blue = 14 : 8 | What fraction of blue are red? | 7/4 | of the total, 7/11; reversed, 4/7 |
| 6 | adults : children = 15 : 6 | children as a fraction of adults | 2/5 | of the total, 2/7; reversed, 5/2 |
| 7 | football : squash : tennis = 4 : 3 : 5 | tennis as a fraction of football | 5/4 | of the total, 5/12; over the other two, 5/8 |
| 8 | roses : tulips : daisies = 2 : 7 : 3 | roses and daisies together as a fraction of tulips | 5/7 | of the total, 5/12; roses only, 2/7 |
| 9 | sopranos : altos : tenors = 6 : 4 : 5 | the singers who are not altos as a fraction of the altos | 11/4 | of the total, 11/15; all the singers over the altos, 15/4 |
