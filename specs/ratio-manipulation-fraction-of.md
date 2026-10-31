# Change brief: "Fraction of" for Ratio Manipulation

**Status:** draft for Harry's review (nothing built)
**Tool:** `ratio-manipulation` (`src/tools/Proportion/RatioManipulation.tsx`) · **Tabs changed:** Ratio to Fraction (main), Fraction to Ratio (twin) · **Needed by:** the Manipulating ratios deck (`specs/decks/manipulating-ratios.md`)
**Decision so far:** go with a "Fraction of" option (Harry, 2026-10-31). This brief settles what the three levels look like so that it cannot break the generator that exists.

---

## 1. The idea in one paragraph

Today the tab has three levels that each ask a different *kind* of question: Level 1 a part of the total, Level 2 parts of the total across three parts, Level 3 a part as a fraction of the other part. The lesson needs the kinds **side by side and mixable**. The house pattern for this (Simplifying's Question Types) is: **a pool picks the kind of question; the level sets how hard that kind is.** So every kind exists at every level it makes sense, the level changes the difficulty of the numbers and the form, and the **defaults of each level stay exactly what they are today**. Nothing a teacher has saved, shared or printed changes unless they switch a new option on.

## 2. The three kinds (the new "Fraction of" pool)

A pool, label **Fraction of**, one kind drawn per question (R19), `balanced: true` so a mixed set gets a fair spread of each kind that is on (as Simplifying's Question Types do).

| Kind | The fraction is of… | Denominator | Works with |
|---|---|---|---|
| **The total** | everything, all the parts together | $a + b$ (or $a + b + c$) | two or three parts |
| **The other part** | one other part, named in the question | one part, such as $b$ | two or three parts |
| **The rest** | all the other parts together | the parts except the numerator's, added | three parts only (with two parts, "the rest" is just the other part) |

The first two are the lesson's contrast, "of the total" against "of the other part". **"The rest" is the combining kind**: Harry's point is right that it needs three parts, so it belongs at Level 2, where the tool already asks pupils to combine parts (today they combine in the *numerator* of a total fraction; "the rest" combines in the *denominator*). It is not a Level 3 idea.

## 3. What each level is about

| Level | Theme | One line |
|---|---|---|
| 1 | **Two parts, nothing combined** | Name what you are comparing with: all of it, or the other part |
| 2 | **Three parts: ignore one, or combine** | The third part is a distractor ("do not add it") or is combined (a composite numerator, or "the rest") |
| 3 | **Fluency and form** | Either order (so fractions bigger than 1), bigger numbers, always needing simplifying, and a combined numerator over a single part |

## 4. The full grid: kind by level

Cells marked **today** are exactly what the tab generates now (and stay the default). Everything else is **new and off by default**.

| | Level 1 | Level 2 | Level 3 |
|---|---|---|---|
| **The total** | **today (default on).** Two parts, each 2 to 12, one part over the total, simplified. | **today (default on).** Three parts, each 1 to 10; the numerator is one part or two parts together (the existing **Target** dropdown: Single / Composite / Mixed), over the total. | *new, off.* Three parts, each up to 20; single or combined numerator; guaranteed to need simplifying. |
| **The other part** | *new, off.* Two parts, each 2 to 12; the **smaller** part over the larger, so the fraction is proper; simplified. | *new, off.* Three parts, each 1 to 10; one named part over one other named part; the third part is stated and is not used (the trap is adding all three). Proper fraction. | **today (default on)** for two parts: either order, so the fraction may be bigger than 1 (such as $\frac43$). *New, off:* a **Parts** choice of Three, adding a combined numerator over the single remaining part ("red and blue as a fraction of green"), either order. |
| **The rest** | *not offered* (two parts have no "rest"). | *new, off.* Three parts, each 1 to 10; one part over the other two added; numerator smaller than the rest, so proper. | *new, off.* Three parts, each up to 20; either order, so it may be bigger than 1; guaranteed to need simplifying. |

### Worked examples (all checked by hand)

| Cell | Question | Answer |
|---|---|---|
| L1 total | The ratio of red to blue is $6 : 4$. What fraction of the beads are red? | $\frac{6}{10} = \frac35$ |
| L1 other part | The ratio of red to blue is $4 : 6$. Write red as a fraction of blue. | $\frac46 = \frac23$ |
| L2 total | The ratio of red : blue : green is $2 : 3 : 5$. What fraction are red or blue? | $\frac{5}{10} = \frac12$ |
| L2 other part | The ratio of red : blue : green is $2 : 3 : 5$. Write red as a fraction of green. | $\frac25$ |
| L2 the rest | The ratio of red : blue : green is $2 : 3 : 5$. Write red as a fraction of the rest (blue and green together). | $\frac{2}{8} = \frac14$ |
| L3 total | The ratio of red : blue : green is $6 : 9 : 15$. What fraction are green or red? | $\frac{21}{30} = \frac{7}{10}$ |
| L3 other part (today) | The ratio of apples to oranges is $12 : 9$. Write apples as a fraction of oranges. | $\frac{12}{9} = \frac43$ |
| L3 other part (new, three parts) | The ratio of red : blue : green is $4 : 7 : 9$. Write red and blue together as a fraction of green. | $\frac{11}{9}$ |
| L3 the rest | The ratio of red : blue : green is $4 : 11 : 5$. Write blue as a fraction of the rest. | $\frac{11}{9}$ |

## 5. The language rules (the point of the lesson)

These become generator rules and tests, not just advice.

1. **The total.** Never names the other part as the thing compared with. Its wording is the existing set ("What fraction of the beads are red?", "Find the fraction of beads that are red", "Write red as a fraction of the total"). The question may say "of the total", or imply it by naming the whole collection ("of the beads"); both are fine.
2. **The other part.** Always names the other part: "as a fraction of **the blue**". It never uses "total", "altogether", "all" or "of the beads". Phrases: "Write red as a fraction of blue", "Find red as a fraction of the amount of blue".
3. **The rest.** Always says "the rest" and names what it is: "as a fraction of **the rest** (blue and green together)". It never uses "total".
4. **A question may not be readable two ways.** A "total" question must not say "of the blue"; an "other part" question must not say "of the beads". A test checks every generated question's text against these rules.
5. **Mixed sets.** With more than one kind on, the kind is drawn per question and the working labels what the denominator is (the word the pupil must learn: **total**, **other part**, **rest**).

## 6. Working (the scaffold, then without it)

Follows Ratio Sharing: the **bar model (ratio look)** is the scaffold at Levels 1 and 2, none at Level 3, and a **Numerical method** switch (Method tab, display only) gives the same question with no bar at any level.

| Kind | What the bar shows |
|---|---|
| The total | a row per part, the numerator's row highlighted, a brace across **all** rows ("total: 5 parts") |
| The other part | the numerator's row and the denominator's row highlighted, the others dimmed ("compare these two rows: 3 boxes with 2 boxes"); no brace across all |
| The rest | the numerator's row highlighted, a brace across **the other rows** ("the rest") |

Numerical method (as today, with the denominator named): "Total parts = …" / "Red = 3, Blue = 2: blue is the denominator, this is part : part, not part : whole" / "Do not add the parts" / simplify.

## 7. The twin: Fraction to Ratio

The same pool, **Fraction given as** (the total / the other part). Phase 2; the lesson needs only Level 1.

| | Level 1 | Level 2 | Level 3 |
|---|---|---|---|
| **Of the total** | **today (default).** "$\frac25$ are red, the rest blue" gives $2 : 3$. | **today (default).** Two fractions of the total, three parts (with the existing Different Denominators switch). | **today (default).** A real amount also given. |
| **Of the other part** | *new, off.* "Red is $\frac23$ of blue" gives $2 : 3$ (the fraction in lowest terms; the ratio is numerator : denominator). | *new, off.* Two fractions of **one common part**: "red is $\frac12$ of blue, green is $\frac34$ of blue" gives $2 : 4 : 3$ (scale so the common part matches). | *new, off.* "Red is $\frac23$ of blue, and there are 12 red" gives the amounts and the ratio. |

## 8. Not breaking what exists

The aim is that this change cannot alter a question anyone gets today.

- **Defaults per level are today's behaviour** (grid cells marked today; L1 total, L2 total with the Target dropdown, L3 other part on two parts). The new pool's other options default **off**, so a saved link, a printed worksheet or a lesson step that does not mention the new option is unaffected.
- **Old links keep working** (R18): the new option's key is absent from an old link, so it falls back to its defaults.
- **A "defaults are unchanged" test** per level: at default options, Level 1 is always two parts over the total; Level 2 always three parts over the total with a single or combined numerator; Level 3 always two parts over the other part with either order. It runs over a few thousand questions.
- **A "level envelope" test** for the new cells: each kind at each level stays inside the numbers and form in the grid (parts, range, order, proper or improper, simplifying guaranteed where stated, the third part unused for L2 other part). Difficulty is checked by features of the question, never by the option that produced it (R25).
- **Language test** (section 5) on every kind at every level.
- Existing smoke tests (`generators.test.ts`: no throw, unique keys, every KaTeX string renders) cover every new sub-option automatically once it is in the config; the 30-question worksheet test (`recentQuestions.test.ts`) needs enough distinct questions in each new cell (Level 1 other part has about 55 ordered pairs times several phrasings, so it passes).
- Tool facts, the About words (`RatioManipulation.about.ts`, every option explained, R11) and the dashboard facts updated in the same change.

**A real caveat on "mutually exclusive ranges" (R26).** The tool is not calibrated today (no calibration file), so no score table exists to protect. By feature, a Level 2 "the rest" question (three parts, combined denominator, proper) is not obviously easier than today's Level 3 default (two parts, either order, possibly improper). I would not change Level 3's default to fix that, because that is what would break an existing generator. Instead: the level contract above is stated per kind (within a kind, each level is harder than the one below), and across kinds the level is a guide, not a promise. If you want strict ranges across kinds, that needs calibrating the tool, a separate job.

## 9. What the lesson uses, and what can wait

| Lesson stage | Needs | Phase |
|---|---|---|
| Of the total on its own | L1 and L2 total | exists |
| Of the other part on its own, with the language emphasised | L1 other part, L2 other part | 1 |
| Both mixed | L1 and L2 with total + other part on | 1 |
| "The rest" | L2 rest | 1 |
| A ratio from a fraction, both kinds | Fraction to Ratio L1 other part | 1 |
| Stretch: improper fractions, combined numerators, bigger numbers | L3 additions, Fraction to Ratio L2 and L3 other part | 2 |

Phase 1 changes only Levels 1 and 2 (plus Fraction to Ratio Level 1) and leaves Level 3 untouched, which is the safest way to get the lesson built. Level 3's new cells can follow later without holding the lesson up.

## 10. Build checklist (when approved)

1. `RatioManipulation.tsx`: a `Fraction of` pool (and `Parts` at Level 3 in phase 2), `balanced: true`, per-level options as the grid; generator branches per kind; the Target dropdown applies to **The total** only (ignored, via the mask, for the other kinds, R23).
2. Wording builders per kind that satisfy the language rules, shared by the three wordings each.
3. Working: bar-model scaffold (Levels 1 and 2), Numerical method switch, denominator named in the working.
4. `RatioManipulation.about.ts`: every option and its per-level note.
5. Tests: defaults unchanged, level envelopes, language rules, smoke.
6. `npm run facts`, spec status, patch note, dashboard Review.
