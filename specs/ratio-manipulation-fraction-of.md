# Change brief: Ratio to Fraction, levels by kind (total, a part, a mixture)

**Status:** phase 1 implemented (2026-10-31); phase 2 (section 4 extras, Fraction Given As at Levels 2 and 3) not built. Revised 2026-10-31: Harry's structure; every variant a Question Option; which part is asked about and "not" wording at every level; Level 3 extras. Assumes **re-levelling the tab in place** (Harry's "yes"); the alternative, a new sixth tab, is in section 8.
**Tool:** `ratio-manipulation` (`src/tools/Proportion/RatioManipulation.tsx`) · **Tabs changed:** Ratio to Fraction (main), Fraction to Ratio (one added option) · **Needed by:** the Manipulating ratios deck (`specs/decks/manipulating-ratios.md`)

---

## 0. As built (2026-10-31), where it differs from the plan below

- The engine is `src/tools/Proportion/ratioFractionOf.ts`; tests `src/tests/ratioFractionOf.test.ts`.
- **The question has the ratio on a line of its own**, in words and numbers (`red : blue = 3 : 5`), and the question on the line below (Harry's request). Fraction to Ratio keeps its sentence.
- **Part Asked About for two parts together is the part *left out*** (so "red or blue" is "Third Part"), the same rule that makes the left-out part the denominator of a part-of-a-part pair and the part named in "not X".
- **Equal parts are never generated** (no $4 : 4$), and a part-of-a-part or "the rest" answer is never a whole number ($\frac{20}{1}$); both tighten today's Level 1 slightly.
- The bar-model scaffold is a working step type `fracBar` drawn by the shared bar model (ratio look): numerator rows light blue, the denominator purple, unused rows faded, a brace across all rows for the total.
- Numerical method is a variable defaulting off at Levels 1 and 2 and **on at Level 3**.
- Generator slides in decks now draw ratio-table and fraction-bar working, and set a long worded question smaller so it fits.

## 1. The structure

**The level is the kind of question.** It matches the lesson stage for stage: teach the total, teach a part with the language emphasised, then mix them.

| Level | Kind | The fraction is of… | What the pupil has to do |
|---|---|---|---|
| **1** | **Of the total** | all the parts added | add the parts for the denominator |
| **2** | **Of a part** | one other part, named in the question | see that the denominator is a part, **not** the sum |
| **3** | **A mixture** | the total, a part, or the rest, decided by the wording | **identify** from the wording which fraction is wanted |

Level 3 is not harder in the numbers; it is harder because the pupil must identify what is being asked. That is the point of the lesson, and it is why the extra Level 3 ideas in section 4 are all about *identifying*, not about bigger numbers.

## 2. Every variant is a Question Option

Nothing below is hard-wired. A question is built from a few independent choices, and each is its own option so a teacher can switch variants on and off, and a mixed set is just several options on (one is drawn per question, `balanced`).

| Option (label, tab) | Choices | Levels | Notes |
|---|---|---|---|
| **Parts** (pool, Questions) | Two Parts *(on)* · Three Parts *(off)* | 1 2 3 | Both on mixes two- and three-part questions in one set |
| **Numerator** (pool, Questions) | One Part *(on)* · Two Parts Together *(off; needs Three Parts)* | 1 2 3 | The "2 conditions out of the 3" case: "red **or** blue", "red and blue together". Both on mixes them. Replaces today's Level 2 **Target** dropdown (Single / Composite / Mixed) |
| **Fraction Of** (pool, Questions) | The Total · One Other Part · The Rest *(needs Three Parts)* | 2 3 (not shown at 1) | Level 2 starts on One Other Part only; Level 3 starts on The Total and One Other Part. Level 1 is always of the total, so there is nothing to choose and no control (R21) |
| **Answer Size** (pool, Numbers) | Less Than 1 · More Than 1 | 2 3 | Both on at Level 2 and 3 (today's either-order behaviour). Level 1 is always less than 1 |
| **Part Asked About** (pool, Questions) | First Part *(on)* · Second Part *(on)* · Third Part *(on, needs Three Parts)* | 1 2 3 | **Which part of the ratio the question is about**, so it is not always the first. With red : blue, "what fraction of the beads are red?" asks about the first part and "what fraction of the beads are blue?" the second; as a part of a part, "what fraction of the red is blue?" has the second part over the first. All on is today's behaviour (the part is drawn at random); switch one off to isolate it |
| **Part Named** (pool, Questions) | By Its Name *(on)* · By Leaving Others Out *(off)* | 1 2 3 | "red" or "**not** red". At Level 1, "not red" is the other part of two, or two parts together of three. At Level 2 it applies only where a combined numerator exists (Three Parts with Two Parts Together), e.g. "the beads that are not green, as a fraction of the green"; otherwise it is ignored (masked) |
| **Question Types** (pool, Questions) | From The Ratio *(on)* · Convert Between Fractions *(off)* | 3 | See section 4 |
| **Include An Amount** (switch, Numbers) | off | 3 | A real total as a distractor ("There are 40 beads"); the fraction does not depend on it |
| **Simplest Form** (switch, Display) | on | 1 2 3 | Today only Level 2 has it; Levels 1 and 3 always simplify. Off leaves $\frac{6}{10}$ |
| **Numerical Method** (switch, Method, display only) | off at 1 and 2; on at 3 | 1 2 3 | The bar-model scaffold is drawn at Levels 1 and 2 unless this is on |

Rules that keep the combinations valid (the generator masks and falls back, R23, and the control greys the choice with `requires`):
- **Two Parts Together** and **The Rest** both need **Three Parts**.
- **The Rest** always has a single numerator (with three parts, two parts together over "the rest" would be a part over itself); the generator ignores Two Parts Together for a The Rest question.
- **Two Parts Together** with **One Other Part** is the *remaining* part ("red and blue together as a fraction of green"); with **The Total** it is today's combined numerator ("red or blue").
- Equal numerator and denominator are never generated (so no answer of 1 unless asked for), and a Two Parts Together over the total is always less than 1.
- With **Three Parts** and **One Other Part** and a single numerator, the third part is **stated and unused** (the trap is adding all three).

## 3. What each level generates by default

Defaults are chosen so the questions are ones the tab already makes; only their level changes.

| | Default content | Where it comes from today |
|---|---|---|
| **L1 Of the total** | Two Parts (each 2 to 12), One Part over the total, simplified | Today's Level 1, unchanged |
| **L2 Of a part** | Two Parts (each 2 to 12), One Part over One Other Part, either order, so a fraction bigger than 1 can occur ($\frac43$) | Today's Level 3, unchanged |
| **L3 A mixture** | Two Parts, each question of the total **or** of a part, either order | New: a balanced draw between the L1 and L2 generators |

**Nothing is lost.** Today's Level 2 (a three-part total with a single or combined numerator) is **Level 1 with Three Parts on**, with Numerator One Part and Two Parts Together both on (what the dropdown called Mixed), with the same numbers (three parts, each 1 to 10).

### Worked examples (checked by hand)

| Level and options | Question | Answer |
|---|---|---|
| L1 | The ratio of red to blue is $6 : 4$. What fraction of the beads are red? | $\frac{6}{10} = \frac35$ |
| L1, Three Parts, Two Parts Together | The ratio of red : blue : green is $2 : 3 : 5$. What fraction are red or blue? | $\frac{5}{10} = \frac12$ |
| L2 | The ratio of apples to oranges is $12 : 9$. Write apples as a fraction of oranges. | $\frac{12}{9} = \frac43$ |
| L2, Three Parts, One Other Part | The ratio of red : blue : green is $2 : 3 : 5$. Write red as a fraction of green. | $\frac25$ |
| L2, Three Parts, Two Parts Together, One Other Part | The ratio of red : blue : green is $2 : 3 : 7$. Write red and blue together as a fraction of green. | $\frac57$ |
| L2, Three Parts, The Rest | The ratio of red : blue : green is $2 : 3 : 5$. Write red as a fraction of the rest (blue and green together). | $\frac{2}{8} = \frac14$ |
| L3 (one set from $3 : 5$) | What fraction of the beads are red? / Write red as a fraction of blue. / Write blue as a fraction of red. | $\frac38$ / $\frac35$ / $\frac53$ |

## 4. More that belongs at Level 3 (identifying what is being asked)

Level 3's skill is reading the question, so anything that makes the *wording* the hard part belongs here, with the numbers kept ordinary. Two of the ideas from the first draft have **moved down to Levels 1 and 2** (Harry): **which part is asked about** (Part Asked About, so it is not always the first in the ratio) and **"not" wording** (Part Named). They are options at every level; Level 3 simply uses them with the kinds mixed. What stays at Level 3:

| Idea | Question Option | Example | Why it is Level 3 | My view |
|---|---|---|---|---|
| **Convert between the two kinds of fraction** | Question Types: Convert Between Fractions | "Red is $\frac25$ of the beads. Write red as a fraction of the blue." ($2 : 3$, so $\frac23$.) And back: "Red is $\frac34$ of the blue. What fraction of the beads is red?" ($\frac37$.) | The pupil must work out which kind they have been given and which they are asked for: the two fractions are the same ratio read two ways | **Yes, the strongest.** The lesson's idea in one question |
| **A distractor amount** | Include An Amount | "There are 40 beads. The ratio of red to blue is $3 : 5$. What fraction are red?" | Not every number given is needed | Optional |
| **Answer as a decimal or a percentage** | (later) Answer As: Fraction · Decimal · Percentage | "Write red as a percentage of the total" ($37.5\%$) | A different target form | **Not now.** A different skill; park it |
| **Four-part ratios** (two parts together over two parts together) | (later) Parts: Four Parts | $a : b : c : d$, "red or blue as a fraction of green or yellow" | Both sides combined | **Leave out.** Rare at GCSE |
| **True or false and "who is right" claims** | not a generator | "Tom says red is $\frac35$ of the blue. Is he right?" | Pure identification | **A Depth bank, not this tab** (planned separately) |

Phase 1 now includes Part Asked About and Part Named (they are the core of the language work). Only Convert Between Fractions and Include An Amount wait for phase 2, both off by default so Level 3's default stays the clean mixture.

## 5. The language rules (the point of the lesson)

These become generator rules and tests, not just advice.

1. **Of the total.** Never names the other part as the thing compared with. The existing wording stays ("What fraction of the beads are red?", "Find the fraction of beads that are red", "Write red as a fraction of the total"); it may say "of the total" or imply it by naming the whole collection.
2. **Of a part.** Always names the other part: "as a fraction of **the blue**". Never uses "total", "altogether", "all" or "of the beads".
3. **The rest.** Always says "the rest" and names it: "as a fraction of **the rest** (blue and green together)". Never uses "total".
4. **The asked part is the numerator and the thing named after "of" is the denominator**, whichever comes first in the ratio. Wordings for a part of a part: "Write **red** as a fraction of **blue**", "Find red as a fraction of the amount of blue", "What fraction of **the blue** is **red**?", and "With red : blue, **what fraction of the red is blue?**" (blue over red, the second part over the first). Wordings for the total: "What fraction of the beads are red?", "Find the fraction of beads that are red", "Write red as a fraction of the total".
5. **No question can be read two ways.** A total question never says "of the blue"; a part question never says "of the beads". A test checks every generated question's text.
6. **In the mixture** the working states which denominator was used, in the pupil's vocabulary: **total**, **other part**, **rest**.

## 6. Working: the scaffold, then without it

As Ratio Sharing: the **bar model (ratio look)** at Levels 1 and 2, none at Level 3 by default (Numerical Method on), and the switch for any question without the picture.

| Kind | What the bar shows |
|---|---|
| Of the total | a row per part, the numerator's row highlighted, a brace across **all** rows ("total: 5 parts") |
| Of a part | the numerator's row and the denominator's row highlighted, any other row dimmed ("compare these two rows") |
| The rest | the numerator's row highlighted, a brace across **the other rows** ("the rest") |

Numerical method (as today, with the denominator named): "Total parts = …" for a total; "Red = 3, blue = 5: blue is the denominator. Do not add the parts: this is part : part, not part : whole" for a part.

## 7. Fraction to Ratio (one added option)

Its levels stay as they are (L1 one fraction, L2 two fractions, L3 a real amount). One new pool, **Fraction Given As** (The Total *(on)* · The Other Part *(off)*), at all three levels:

| | The total (today) | The other part (new) |
|---|---|---|
| L1 | "$\frac25$ are red, the rest blue" gives $2 : 3$ | "Red is $\frac23$ of blue" gives $2 : 3$ |
| L2 | two fractions of the total, three parts | "Red is $\frac12$ of blue, green is $\frac34$ of blue" gives $2 : 4 : 3$ (scale so the common part matches) |
| L3 | a real amount also given | "Red is $\frac23$ of blue and there are 12 red" gives the amounts and the ratio |

The lesson needs only the Level 1 cell; the others can follow.

## 8. What this changes for people using the tab today

| Today | After |
|---|---|
| Level 1: two-part total | **Level 1: the same** |
| Level 2: three-part total (single or combined numerator) | **Level 1 with Three Parts on** (same questions; the Target dropdown becomes the Numerator pool). Level 2 is now "of a part" |
| Level 3: two-part, a part of the other part | **Level 2, the same questions.** Level 3 is now the mixture |

- A saved link, worksheet or habit at **Level 2 or 3** of Ratio to Fraction now produces a different kind of question. Old links still load (R18) but mean something else at those two levels; the old Target dropdown value is simply ignored.
- The tool is **live** but has **no Depth bank, lesson or deck built on it**, and no test touches Ratio to Fraction.
- A **differentiated worksheet** (a column per level) or the Smart Progressor on this tab would now step through *kinds*, not easy-to-hard of one kind.
- **No-risk alternative:** leave Ratio to Fraction as it is and add a new sixth tab with these levels. Nothing changes for anyone, at the cost of some duplicated content. Not recommended, but available.

## 9. Making sure it does not break

- **A "defaults" test per level:** at default options Level 1 is always two parts over the total; Level 2 always two parts, a part over the other part, either order; Level 3 always two parts and both kinds appear in a set of 30 (balanced).
- **Part Asked About:** at default options both the first and the second part are asked about across a set (both appear in 30 questions), for every kind; switching one off removes it; the numerator is always the part named in the question, never assumed to be the first number.
- **An "options" test** for each option and each valid combination: Level 1 Three Parts with both Numerators reproduces today's Level 2 envelope; Two Parts Together over One Other Part uses the remaining part; The Rest never has a two-part numerator; no equal numerator and denominator; the stated third part is unused; a By Leaving Others Out question names the parts it leaves out correctly.
- **Language test** (section 5) over every kind at every level.
- The existing smoke tests (no throw, unique keys, every KaTeX string renders) and the 30-question worksheet test cover every level at defaults; Level 3 draws from two pools so it has plenty of distinct questions.
- `RatioManipulation.about.ts` (the level lines and every option explained, R11; labels follow the vocabulary, R20), the spec `specs/ratio-manipulation.md` (its level descriptions), tool facts and a patch note, in the same change.
- The tool has no calibration file, so there is no score table to keep (R25 does not apply); difficulty is stated by the contract above.

## 10. Build plan

**Phase 1 (what the lesson needs):** move today's Level 3 generator to Level 2 and today's Level 2 behind Level 1's Parts and Numerator options; the Level 3 mixture; the pools Parts, Numerator, Fraction Of, Answer Size, **Part Asked About** and **Part Named**, with Simplest Form and Numerical Method; the language rules and the new wordings; the bar-model scaffold; Fraction to Ratio Level 1's Fraction Given As; tests; docs.
**Phase 2:** Convert Between Fractions and Include An Amount at Level 3; Fraction Given As at Levels 2 and 3.
**Not planned:** percentage and decimal answers, four-part ratios, claims (Depth).
