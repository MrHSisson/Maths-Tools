# Change brief: Ratio to Fraction, levels by kind (total, a part, a mixture)

**Status:** draft for Harry's review (nothing built). Revised 2026-10-31 to Harry's structure; the earlier "kind by level" grid is withdrawn.
**Tool:** `ratio-manipulation` (`src/tools/Proportion/RatioManipulation.tsx`) · **Tabs changed:** Ratio to Fraction (main), Fraction to Ratio (one added option) · **Needed by:** the Manipulating ratios deck (`specs/decks/manipulating-ratios.md`)

---

## 1. The structure

**The level is the kind of question.** It matches the lesson stage for stage: teach the total on its own, teach a part on its own with the language emphasised, then mix them.

| Level | Kind | The fraction is of… | The skill |
|---|---|---|---|
| **1** | **Of the total** | all the parts added | add the parts for the denominator |
| **2** | **Of a part** | one other part, named in the question | the denominator is a part, **not** the sum |
| **3** | **A mixture** | the total, or a part, or the rest, decided by the wording | read the wording and choose the denominator |

Level 3 is the hardest for a real reason: the numbers need not be harder, but the pupil has to decide, from the wording alone, which denominator the question wants. That is the skill the lesson is about.

## 2. What each level generates by default

Defaults are chosen so that **the questions are ones the tab already makes today**; only their level changes.

| | Default content | Where it comes from today |
|---|---|---|
| **L1 Of the total** | Two parts, each 2 to 12; one part over the total; simplified. "What fraction of the beads are red?" | Today's Level 1, unchanged |
| **L2 Of a part** | Two parts, each 2 to 12; one part over the other, either order, so a fraction bigger than 1 can occur ($\frac43$). "Write apples as a fraction of oranges." | Today's Level 3, unchanged |
| **L3 A mixture** | Two parts, each 2 to 12; each question is of the total **or** of a part (drawn per question, balanced so both appear), either order. | New: a draw between the L1 and L2 generators |

### Options inside each level (all new options default so the lines above are what you get)

| Option | L1 | L2 | L3 |
|---|---|---|---|
| **Parts** (Two parts / Three parts) | Two on, Three off. Three = today's Level 2 questions (three parts each 1 to 10, one part or two parts together over the total, with the existing **Target** dropdown Single / Composite / Mixed and the **Simplest Form** switch) | Two on, Three off. Three adds a third, stated part, see below | Two on, Three off. Both on mixes two- and three-part questions |
| **Compared with** (only when Three parts is on) | not used | One other part (default): the third part is stated and not used (the trap is adding all three). The rest: one part over the other two added (needs three parts) | the same two, drawn with the total |
| **Fraction of** (which kinds in the mixture) | not used | not used | The total · One other part · The rest (the rest needs Three parts on). All on by default except The rest, which switches on with Three parts |

So nothing is lost: **today's Level 2 (a three-part total with a combined numerator) is still there**, now at Level 1 with Three parts switched on.

### Worked examples (checked by hand)

| Level and options | Question | Answer |
|---|---|---|
| L1 | The ratio of red to blue is $6 : 4$. What fraction of the beads are red? | $\frac{6}{10} = \frac35$ |
| L1, Three parts, Composite | The ratio of red : blue : green is $2 : 3 : 5$. What fraction are red or blue? | $\frac{5}{10} = \frac12$ |
| L2 | The ratio of apples to oranges is $12 : 9$. Write apples as a fraction of oranges. | $\frac{12}{9} = \frac43$ |
| L2, Three parts, One other part | The ratio of red : blue : green is $2 : 3 : 5$. Write red as a fraction of green. | $\frac25$ |
| L2, Three parts, The rest | The ratio of red : blue : green is $2 : 3 : 5$. Write red as a fraction of the rest (blue and green together). | $\frac{2}{8} = \frac14$ |
| L3 (one set, same ratio $3 : 5$) | What fraction of the beads are red? / Write red as a fraction of blue. / Write blue as a fraction of red. | $\frac38$ / $\frac35$ / $\frac53$ |
| L3, Three parts | The ratio of red : blue : green is $2 : 3 : 7$. Write green as a fraction of the rest. | $\frac{7}{5}$ |

## 3. The language rules (the point of the lesson)

These become generator rules and tests, not just advice.

1. **Of the total.** Never names the other part as the thing compared with. The existing wording stays ("What fraction of the beads are red?", "Find the fraction of beads that are red", "Write red as a fraction of the total"); it may say "of the total" or imply it by naming the whole collection.
2. **Of a part.** Always names the other part: "as a fraction of **the blue**". Never uses "total", "altogether", "all" or "of the beads".
3. **The rest.** Always says "the rest" and names it: "as a fraction of **the rest** (blue and green together)". Never uses "total".
4. **No question can be read two ways.** A total question never says "of the blue"; a part question never says "of the beads". A test checks every generated question's text.
5. **In the mixture** the working states which denominator was used, in the pupil's vocabulary: **total**, **other part**, **rest**.

## 4. Working: the scaffold, then without it

As Ratio Sharing: the **bar model (ratio look)** at Levels 1 and 2, none at Level 3 by default, and a **Numerical method** switch (Method tab, display only) for any question without the picture.

| Kind | What the bar shows |
|---|---|
| Of the total | a row per part, the numerator's row highlighted, a brace across **all** rows ("total: 5 parts") |
| Of a part | the numerator's row and the denominator's row highlighted, any other row dimmed ("compare these two rows: 3 boxes with 5 boxes") |
| The rest | the numerator's row highlighted, a brace across **the other rows** ("the rest") |

Numerical method (as today, with the denominator named): "Total parts = …" for a total; "Red = 3, blue = 5: blue is the denominator. Do not add the parts: this is part : part, not part : whole" for a part.

## 5. Fraction to Ratio (one added option)

Its levels stay as they are (L1 one fraction, L2 two fractions, L3 a real amount). One new pool, **Fraction given as** (The total default / The other part), off by default:

| | The total (today) | The other part (new) |
|---|---|---|
| L1 | "$\frac25$ are red, the rest blue" gives $2 : 3$ | "Red is $\frac23$ of blue" gives $2 : 3$ |
| L2 | two fractions of the total, three parts | "Red is $\frac12$ of blue, green is $\frac34$ of blue" gives $2 : 4 : 3$ (scale so the common part matches) |
| L3 | a real amount also given | "Red is $\frac23$ of blue and there are 12 red" gives the amounts and the ratio |

The lesson needs only the L1 cell.

## 6. What this changes for people using the tab today

This is the honest cost of the structure.

| Today | After |
|---|---|
| Level 1: two-part total | **Level 1: the same** |
| Level 2: three-part total (single or combined numerator) | **Level 1 with Three parts on** (same questions, same Target dropdown). Level 2 is now "of a part" |
| Level 3: two-part, a part of the other part | **Level 2, the same questions.** Level 3 is now the mixture |

- A saved link, worksheet or habit at **Level 2 or 3** of Ratio to Fraction now produces a different kind of question. Old links still load (R18, an unknown or stale value falls back to defaults) but mean something else at those two levels.
- The tool is **live** (enabled) but has **no Depth bank, lesson or deck built on it**, and no test pins Ratio to Fraction's level behaviour. Nothing else in the repo depends on it.
- A **differentiated worksheet** (a column per level) or the Smart Progressor on this tab would now step through *kinds* (total, part, mixture), not easy-to-hard of one kind. For this tab that is arguably what teachers want, but it is a change in meaning.
- **A no-risk alternative:** leave Ratio to Fraction exactly as it is and add a **new sixth tab** with these three levels (L1 total, L2 part, L3 mixture). Nothing changes for anyone, at the cost of some duplicated content and a tab that overlaps the old one. Recommendation: re-level in place (a tab where one level means one thing is easier to teach with), but this is your call.

## 7. Making sure it does not break

- **A "defaults" test per level:** at default options Level 1 is always two parts over the total; Level 2 always two parts, a part over the other part, either order; Level 3 always two parts and both kinds appear in a set of 30 (balanced).
- **An "options" test** for each new option: Level 1 Three parts reproduces today's Level 2 envelope (three parts each 1 to 10, single or combined numerator over the total); Level 2 Three parts gives a stated, unused third part, or the rest; the rest never has a numerator bigger than the other two combined unless order is reversed.
- **Language test** (section 3) over every kind at every level.
- The existing smoke tests (no throw, unique keys, every KaTeX string renders) and the 30-question worksheet test (`recentQuestions.test.ts`) cover every level at defaults automatically; Level 3's mixture draws from two pools so it has plenty of distinct questions.
- `RatioManipulation.about.ts` (the level lines and every option explained, R11), the spec `specs/ratio-manipulation.md` (its level descriptions), tool facts and a patch note, in the same change.
- The tool has no calibration file, so there is no score table to keep (R25 does not apply); difficulty is stated by the contract above.

## 8. What the lesson uses

| Lesson stage | Uses | In this change |
|---|---|---|
| Of the total on its own | Level 1 | already there |
| Of a part on its own, language emphasised | Level 2 | already there (relabelled) |
| Both mixed | Level 3 | **new: the mixture** |
| A ratio from a fraction, both kinds | Fraction to Ratio L1, Fraction given as | **new option** |
| Stretch: three parts, "the rest", combined numerators | Parts = Three at each level, Compared with | **new options** |

The lesson itself needs only the new mixture and the Fraction to Ratio option; the three-part options are stretch and can be built after.

## 9. Build checklist (when approved)

1. `RatioManipulation.tsx`: move today's Level 3 generator to Level 2 and today's Level 2 generator behind Level 1's Parts option (with its Target dropdown and Simplest Form switch); add the Level 3 mixture (a balanced draw between the kinds); the Parts, Compared with and Fraction of pools with their `requires`, masked in the generator (R23); `balanced: true` on the kind pool.
2. Wording builders per kind that satisfy the language rules.
3. Working: bar-model scaffold at Levels 1 and 2, Numerical method switch, the denominator named.
4. Fraction to Ratio: the Fraction given as pool, Level 1 first.
5. `.about.ts`, spec update, tests, `npm run facts`, patch note, dashboard Review.
