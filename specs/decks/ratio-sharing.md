# Deck plan: Sharing in a ratio

**Status:** plan for Harry's review (2026-11-15). Nothing built. No question has been written yet: the checklist's first step is to agree the ladder and the traps below.
**Deck id:** `ratio-sharing` · **Tool:** `ratio-sharing` (`/ratio-sharing`) · **Representation:** the bar model (stacked ratio look) · **Pitch:** middle band · **Length:** 1 to 2 lessons, with a divider at the pick-up point

**Shape of the lesson.** The class has met this before, so it is built around *finding and fixing mistakes*, not first teaching. Each of the three kinds of problem opens with a "who is right?" discussion where a tempting wrong method gives a believable answer, then a short worked bar model, then practice. The bar model is the scaffold; it fades to the numerical method, as the tool does.

## What the tool has (Ratio Sharing, four tabs)

| Tab | Asks | Levels | Method shown |
|---|---|---|---|
| Sharing in a Ratio | Share a total: person A, person B, or both | L1 times-table totals up to 64 (ratios 1:2 to 3:4, either way round) · L2 coprime ratios, shares up to 144 · L3 totals up to 500, can be a half-pound | Bar model (L1, L2) or the numerical method (L3, or the Numerical method switch) |
| Known Amounts | One share is given: find the total, or the other share | L1 · L2 · L3 (totals up to 600) | same |
| Given Difference | "£x more than", "£x less than" or "the difference is £x": find the total, or either share | L1 · L2 · L3 | same |
| Mixed | A mix of the three | L1 · L2 · L3 | same |

The bar model has a row per person, one box per part, "= share" at the end, a coloured known share, and purple extra boxes for the difference. It is the same look the deck bar piece already draws (`bar` element, ratio look).

## What the tool does not do (and what the deck does about it)

| Gap | Matters for this lesson? | Plan |
|---|---|---|
| Two-part ratios only, always in lowest terms (no 4 : 6, no three parts) | Three parts is the usual next step, not part of a recap. A ratio given unsimplified is a real exam trap | Deck authors a few fixed questions with an unsimplified ratio and one three-part question as stretch. Tool unchanged |
| Money in pounds only; names are random | Fine for the generator. Fixed questions can use other contexts (sweets, litres, time) to avoid "it's always money" | Author the variety in the fixed sets |
| No "which kind is it?" question, and no "spot the mistake" | **This is the core of a misconceptions lesson** | Built in the deck as discussion slides and fixed question sets (no tool change) |
| No Depth bank for the tool | Depth cards would suit the "who is right?" moments | Optional later (`specs/depth/ratio-sharing.md`); the deck uses its own discussion slides first |
| No fixed-question builder (`Q.ratioSharing`) | Authored sets should carry the tool's own working and bar | **Needed:** extract the three generators' inner steps into a pure helper (as `ratioFromFraction.ts` did) so `Q.share`, `Q.known`, `Q.diff` can take fixed numbers. A small, separate, tested change |
| `RatioSharingTool.about.ts` says Level 3 "always uses the algebra method"; the code uses the **numerical** method at Level 3 (`useBar` false) | Wording only, but the deck brief must match what the tool does | Fix the about line when the builders are added |

## The traps (to agree with Harry)

Each gets a discussion slide, and at least one fixed question where the wrong method gives a different, believable answer. Example numbers are indicative only and recomputed at build.

| # | Trap | Wrong method on an example | Right |
|---|---|---|---|
| T1 | Divides the total by one of the ratio numbers (or by 2, "two people") | £60 shared 2 : 3: $60 \div 2 = 30$, or $60 \div 3 = 20$ | Parts $2 + 3 = 5$, one part £12: £24 and £36 |
| T2 | Finds one part but forgets to multiply it back | £60, 2 : 3, gives "£12 each" | £24 and £36 |
| T3 | Shares go to the wrong person (order of the ratio against the order of the names) | "Mia : Jack = 2 : 3", gives Mia the £36 | Mia £24, Jack £36 |
| T4 | **Known share:** treats the given amount as one part | 3 : 5, the first gets £24: $24 \times 5 = 120$ for the other | £24 is 3 parts, one part £8, other £40, total £64 |
| T5 | **Known share:** treats the given amount as the total | the same question answered "£24" | Total £64 |
| T6 | **Difference:** treats the difference as a share or the total | 3 : 7, difference £48, "the total is £48" | Difference is $7 - 3 = 4$ parts, one part £12: shares £36 and £84, total £120 |
| T7 | **Difference:** divides by the total number of parts, not the difference in parts | £48 $\div 10 = 4.80$ | $48 \div 4 = 12$ |
| T8 | Answers a different question (gives the part value, or the other person's share) | finds £12 and stops | Read what is asked ("the total", "Jack's share") |
| T9 | Does not check: shares that do not add up to the total | | A one-line check: do the shares add to the total? |

The "which kind is it?" skill (given the total, a known share, or a difference) is the lesson's second thread: it is what pupils get wrong most when the three are mixed.

## The ladder (to agree with Harry)

One thing changes between consecutive questions. No levels on authored questions (the ladder carries difficulty).

| Rung | Kind | Change from the one before |
|---|---|---|
| 1 | Total, one share asked | Times-table total, first person (the easy case) |
| 2 | Total, both shares | Both, with a check that they add to the total |
| 3 | Total, second person has the bigger share | Order trap (T3) |
| 4 | Total, ratio given unsimplified (4 : 6) | Simplify first, or divide by 10 parts |
| 5 | Known share, find the other | The known share is the *smaller* part; the first trap (T4) |
| 6 | Known share, find the total | T5 |
| 7 | Difference, find a share | T6, T7 |
| 8 | Difference, find the total | |
| 9 | Mixed: which kind? | Same story told three ways; pupils name the kind first |
| 10 | Stretch (one only) | Three-part ratio, or a non-money context with a decimal part value |

## Slide plan (about 28 slides; each divider is a pick-up point)

The first lesson covers sections A and B, the second C and D. If the class is quick the deck can be played straight through.

| Section | Slides |
|---|---|
| Opening | Title · Objective · Retrieval starter (four quick questions: write 3 : 2 as shares of 10, simplify 6 : 9, "£20 in 1 : 3", one part-value division). Numbers used nowhere else |
| A. Sharing a total (lesson 1) | Divider · **"Who is right?"** discussion: £60 in 2 : 3, three pupils' methods (T1, T2) · bar model built a click at a time, with total parts and 1 part · two whiteboard questions, then the third without the bar (fading) · **spot the mistake** (find the first error, T3, using the Questions "find the first error" format) · generator (Sharing, Level 1 to 2) · book work (nine, 3 × 3, with the check) |
| B. Which share is it? (lesson 1) | Divider · order of names against order of the ratio (T3) · unsimplified ratio (T4) · fixed set of six (rungs 1 to 4) · exit check for the section |
| C. Known share (lesson 2) | Divider · recap: three quick questions from A · **"Who is right?"**: £24 is one share of 3 : 5 (T4, T5) · bar model with the known box coloured · whiteboards (find the other, then the total) · generator (Known Amounts) · book work (nine) |
| D. Difference, and choosing the method (lesson 2) | Divider · **"Who is right?"**: 3 : 7, difference £48 (T6, T7) · bar with purple extra boxes · whiteboards · **Which kind is it?** a sort-and-solve fixed set (rung 9): name the kind first, then solve · generator (Mixed, Level 2) · book work (twelve, 3 × 4, mixed, a decimal or non-money last) |
| End | Exit ticket (three questions, one of each kind, numbers used nowhere else) · Summary: "What I check every time" (do the shares add to the total? did I answer what was asked?) |

Book work is plain big numbers with the instruction once at the top (house style); the worksheet slide is optional (one pinned A5 mixed sheet) if Harry wants paper.

## Decisions for Harry

1. **One deck or two?** Plan is one deck with a divider at the lesson break (A, B | C, D), as the other decks do. Say if you would rather have two decks.
2. **Are the nine traps the right ones?** Add, drop or reorder before any question is written.
3. **Is Level 3's algebraic method wanted here?** The tool's Level 3 is numerical only. This class sits in the middle band, so the plan stays with the bar model and numerical method.
4. **Three-part ratios:** one stretch question only, or leave out?
5. **Depth cards:** worth authoring 4 to 5 cards for the tool afterwards, or do the discussion slides cover it?
6. **Paper:** one pinned A5 mixed worksheet, or none?
7. **The calculator and pace:** assumed calculators are allowed and pupils write a nine-question book set in about ten minutes. Correct me if not.

## Build steps once agreed

1. Extract the three generators' inner steps into a pure helper and add `Q.share`, `Q.known`, `Q.diff` (with tests; the tool's own output unchanged). Fix the about line.
2. Write the question tables (rung, answer, trap, wrong-method result) for Harry to check; recompute every answer by a separate route.
3. Build script (outside the repo), then `npm run deck -- looks <script>` for the look card; Harry says yes.
4. Build, `npm run deck -- check ratio-sharing --layout`, `deck review`, then look at every sheet.
5. Update the pathway, patch notes, planner Build Log and the tool's dashboard note.
