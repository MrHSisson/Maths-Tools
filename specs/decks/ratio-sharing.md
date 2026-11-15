# Deck plan: Sharing in a ratio

**Status:** built (2026-11-15) in the repo, awaiting Harry's review: `src/decks/data/ratio-sharing.json` (22 slides, from `specs/decks/ratio-sharing.build.ts`), the tool changes, the Depth bank (`specs/depth/ratio-sharing.md`) and the 42 questions (`specs/decks/ratio-sharing-questions.md`). Not yet pushed to the shared copy (needs this branch merged first: the Depth cards read the new bank).
**Deck id:** `ratio-sharing` · **Tool:** `ratio-sharing` (`/ratio-sharing`) · **Representation:** the bar model (stacked ratio look) · **Pitch:** middle band · **Length:** 1 to 2 lessons

**Shape (Harry, 2026-11-15).** A recap for a class that has met this before, built around finding and fixing mistakes. Questions are **all authored, in difficulty ladders, none generated**: nine projected questions for **sharing from a total only**, as a **3 × 3 grid with the instruction once above it and just the numbers in each cell**; the **known-share and difference sets are printed** (a pinned sheet of nine each), then one mixed worksheet of fifteen at the end. All three sheets use the **textbook layout**. This uses the deck's three pinned sheets exactly. More is written than any one pupil is expected to finish: the sets are there to give stretch, not to be completed. The "who is right?" moments are the tool's new Depth cards, used as deck slides.

## What the tool has (Ratio Sharing, four tabs)

| Tab | Asks | Levels | Method shown |
|---|---|---|---|
| Sharing in a Ratio | Share a total: person A, person B, or both | L1 times-table totals up to 64 · L2 coprime ratios, shares up to 144 · L3 totals up to 500, can be a half-pound | Bar model (L1, L2) or the numerical method (L3, or the Numerical method switch) |
| Known Amounts | One share given: find the total or the other share | L1 · L2 · L3 (totals up to 600) | same |
| Given Difference | "£x more than", "£x less than", "the difference is £x": find the total or either share | L1 · L2 · L3 | same |
| Mixed | A mix of the three | L1 · L2 · L3 | same |

## What I would change in the tool (its own step, with its own tests, before the deck)

Ranked by how much the lesson and the tool gain.

| # | Change | Why | Notes |
|---|---|---|---|
| 1 | **Three-part ratios** (a pool "Parts in the ratio": Two / Three; they are exclusive, so a pool not a toggle, rule R19) | The tool is two-part only. Three parts is the natural stretch and the deck's last rungs need it | Each generator hardcodes two people (`parts[0]`, `parts[1]`, `twoNames()`, a two-entry `shares`). Known: "the other person" must name a person; difference: name the two people compared (`diff_bar` and `partDiff` assume bars 0 and 1). The bar drawing already loops over any number of rows. Ask-for options gain Person C |
| 2 | **A Depth bank** (`RatioSharingDepth.ts`, spec `specs/depth/ratio-sharing.md`) | The tool has none. Diagnose, explain, extend at three levels, every wrong option naming its misconception; `startHere` per level. About 15 items | New misconceptions go in `src/shared/misconceptions.ts` (see the traps). The deck's "who is right?" slides are these cards, so nothing is written twice |
| 3 | **Unsimplified ratios** (a toggle "Ratio not in simplest form") | Today every ratio is coprime, so the exam trap "4 : 6 is really 2 : 3" never appears | Independent of the part count, so a toggle |
| 4 | **A check line in the working** ("Check: the shares add to the total") | The habit the lesson ends on (trap T9). It is the one step the working never shows | An extra last step in the numerical and bar methods, on every tab |
| 5 | **Other contexts than money** (a pool: Money / Quantities such as sweets, kg, litres, minutes) | Every question is "£" and two named people; pupils then think sharing means money | Wording and units only; the maths is unchanged. Units are plain text outside KaTeX (R4) |
| 6 | **Tidy: stop appending a random id to the question key** | Rule R2 says never; the three generators end their keys with `-${id}` | Content fingerprints already decide repeats |
| 7 | **Tidy: the About line** says Level 3 "always uses the algebra method"; the code uses the numerical method | Wording only | Fixed with the About text for the new options |
| 8 | **Fixed-question builders** `Q.share`, `Q.known`, `Q.diff` (the deck needs them) | Authored questions must carry the tool's own working and bar (checklist: extract the generator's inner function, as `ratioFromFraction.ts` did) | A pure helper taking fixed numbers, tested for the same output as the generator |

Not proposed: calibration and a Smart Progressor (the tool has neither; a separate decision), algebraic method for Level 3 (middle band).

## The traps (to agree)

Each gets a Depth card (so a "who is right?" slide) and at least one authored question where the wrong method gives a different, believable answer. Example numbers are indicative; all are recomputed at build.

| # | Trap | Wrong method on an example | Right |
|---|---|---|---|
| T1 | Divides the total by one ratio number (or by 2, "two people") | £60 in 2 : 3: $60 \div 2 = 30$ | Parts $2 + 3 = 5$, one part £12: £24 and £36 |
| T2 | Finds one part but forgets to multiply it back | gives "£12 each" | £24 and £36 |
| T3 | Shares go to the wrong person (ratio order against name order) | "Mia : Jack = 2 : 3", gives Mia the larger share | Mia £24, Jack £36 |
| T4 | **Known share:** treats the given amount as one part | 3 : 5, first gets £24: $24 \times 5 = 120$ for the other | £24 is 3 parts, one part £8, other £40, total £64 |
| T5 | **Known share:** treats the given amount as the total | answers "£24" | £64 |
| T6 | **Difference:** treats the difference as a share or the total | 3 : 7, difference £48: "the total is £48" | $7 - 3 = 4$ parts, one part £12: £36 and £84, total £120 |
| T7 | **Difference:** divides by all the parts, not the difference in parts | $48 \div 10 = 4.80$ | $48 \div 4 = 12$ |
| T8 | Answers a different question (stops at one part, or gives the other person) | £12 | Read what is asked |
| T9 | Does not check | shares that do not add to the total | One-line check |
| T10 | Three parts: adds only two of the parts, or compares the wrong two | 2 : 3 : 5 shared as if 2 : 3 | Add all three parts: 10 |
| T11 | Ratio not simplified, then mixes forms | 6 : 9 treated as 6 + 9 parts, then split again | Either use 15 parts or simplify to 2 : 3 first: same answer |

Early rungs of the difference set avoid ratios that differ by exactly one part: then "divide the difference by 1" happens to be right and the wrong method cannot be seen to fail. One such question comes late, on purpose, as a discussion point.

## The ladders (nine each, to agree)

No levels on authored questions; the order carries difficulty. One thing changes between neighbours. A non-money context appears at least once in each set. **No hints** (decided with Harry: not needed for this class): the help is the worked example and the Depth card before the set, nothing in the cells.

**Set A is a 3 × 3 grid (`S.plainBook`).** One instruction above ("Share each amount in the ratio given."), each cell bare numbers, big and centred: `£50` over `3 : 7` (three parts: `£90` over `2 : 3 : 4`; a quantity: `40 kg` over `3 : 5`). One instruction covers the grid, so every cell asks for both shares; that isolates the method, and "read what is asked" is tested by the mixed worksheet. Answers show on a click.

**Sets B and C are printed**, one pinned sheet each, nine questions in the textbook layout with the full wording ("Mia and Jack share money in the ratio 3 : 5. Mia receives £24. Work out the total."). Written out in full, each question can ask what its rung needs, so the grid's one-ask limit does not apply to them.

**Set A: Sharing from a total** (moved up 2026-11-15: no 1 : n rungs; it starts at a : b)

| Rung | What it is | Trap |
|---|---|---|
| A1 | a : b, two different parts | T1 |
| A2 | a : b, bigger parts | T1 |
| A3 | the larger number first | T2 |
| A4 | not money | T1 |
| A5 | larger total and parts | T1 |
| A6 | ratio not in simplest form | T11 |
| A7 | parts that add to 13 | T1 |
| A8 | three parts | T10 |
| A9 | three parts, pounds and pence | T10 |

**Set B: A known share**

| Rung | What it is | Trap |
|---|---|---|
| B1 | a : b, find the total | T5 |
| B2 | the known share is the second person's | T3 |
| B3 | a : b, find the other share | T4 |
| B4 | not money, find the total | T4 |
| B5 | larger numbers, find the other | T4 |
| B6 | ratio not in simplest form | T11 |
| B7 | three parts, find the total | T10 |
| B8 | three parts, a different share | T4 |
| B9 | three parts, not money, find the total | T4 |

**Set C: A difference**

| Rung | What it is | Trap |
|---|---|---|
| C1 | 2 : 5, three parts apart, the smaller share | T7 |
| C2 | "the difference between their shares", find the total | T6/T7 |
| C3 | "less than", find the larger share | T6 |
| C4 | the first named has less | T3 |
| C5 | not money, find the total | T6/T7 |
| C6 | larger numbers, find the total | T6 |
| C7 | three parts, the third person's share | T10 |
| C8 | three parts, find the total | T10 |
| C9 | three parts, not money, find the total (stretch) | T10 |

**Worksheet D: Mixed, fifteen (textbook layout)**

Kinds are interleaved, never labelled, in a climb: 1 to 5 two-part, simple (a spread of the three kinds); 6 to 10 unsimplified ratio, a non-money context, larger numbers, an order trap; 11 to 15 three-part, with the last two the hardest. About five of each kind. Questions use numbers used nowhere else in the deck. The tool Worksheet's **Textbook** layout (the pinned worksheet's `layout: "list"`, which the deck already supports): numbered `1)` lines, the instruction once, no boxes, the answer inline on the answer sheet. It suits worded questions of mixed length better than equal boxes, and fifteen fit one A4 page comfortably. The plan is one pinned A4 worksheet, hand-written (`frozen`), in this layout, with its answer sheet; the look card puts it beside the boxed layout so Harry can choose.

## Slide plan (superseded 2026-11-15: 30 slides, see "As built" at the end; each divider is a pick-up point)

| Section | Slides |
|---|---|
| Opening | Title · Objective · Starter (four quick retrieval questions, numbers used nowhere else) |
| A. Sharing from a total | Divider · Depth card ("who is right?", T1, T2) · bar model built a click at a time (worked example) · **Grid A (nine, 3 × 3, instruction above, answers on a click)** |
| B. A known share | Divider · Depth card (T4, T5) · bar with the known box coloured · **Worksheet B cue slide** (answers on a click; printed sheet of nine) |
| *Lesson break after B* | The second lesson starts at the next divider with a recap of three quick questions from A and B |
| C. A difference | Divider · Depth card (T6, T7) · bar with purple extra boxes · **Worksheet C cue slide** (answers on a click; printed sheet of nine) |
| D. Mixed | Divider · "What do I check every time?" (read what is asked, add the shares, check) · **Worksheet D** (cue slide, answers on a click; printed in the textbook layout) |
| End | Exit ticket (three questions, one of each kind, new numbers) · Summary |

**Time.** Not everyone will finish a set (agreed). Each set is a ladder, so the brief says where a secure class can start or a class can stop. The worked-example slide and Depth card come first, and the answers show on a click.

## Decided with Harry (2026-11-15)

- All the tool changes (1 to 8), including unsimplified ratios and other contexts.
- No hints. Board grid for set A only; sets B and C and the mixed worksheet are printed (textbook layout). One ask per grid is fine.
- All eleven traps stay for now.
- **Moved up (2026-11-15, Harry):** the class is middle band, so the 1 : n rungs and the Level 1 numbers are redundant. Every set starts at a : b with bigger totals, and the Depth cards run Level 2 before Level 3: section A opens with the Level 2 card on sharing a total (£108 in 4 : 5), then the known-share and difference cards, and the two Level 3 cards (which first step, three parts) come last, before the mixed sheet. The Level 1 cards stay in the tool's bank for other classes.
- Still to confirm: the lesson break after set B, and Depth cards as the discussion slides (assumed yes).

## Progress

- **2026-11-15: the Depth spec** is written (`specs/depth/ratio-sharing.md`, 15 items) and **all 42 authored questions** are written and checked (`specs/decks/ratio-sharing-sets.ts`, the table Harry reads: `specs/decks/ratio-sharing-questions.md`, tests in `src/tests/ratioSharingSets.test.ts`). Waiting for Harry on both before the Depth bank and the deck are built.
- **2026-11-15: tool change 1, 3 to 8 done** (three parts, unsimplified, contexts, check step, key and About tidy, `Q.share` / `Q.known` / `Q.diff`), tested. Remaining: the Depth spec and bank, the question tables, the look card, the build.

## Build steps once agreed

1. Tool change (own commit, tests, About words, `npm run facts`): items 1, 3 to 8 above.
2. Depth spec (`specs/depth/ratio-sharing.md`) for Harry to read, then the bank.
3. Question tables for sets A to C and worksheet D (rung, answer, trap, wrong-method result), every answer recomputed by a separate route, shown to Harry before the deck is built.
4. Build script (outside the repo), look card (`npm run deck -- looks`), Harry says yes; build; `npm run deck -- check ratio-sharing --layout`; `deck review`; look at every sheet.
5. Pathway, patch notes, planner Build Log and the tool's dashboard note.

## As built (2026-11-15, after Harry's first look: "no authored whiteboards, no generators, fill in the boxes")

Every section is the same shape: divider · Depth card · worked bar model (click by click: rows, brace, the value of one part in every box, each share) · **five authored whiteboard questions** (the tool's own bar-model working, the boxes filling in) · **the tool's live generator at Level 2** · the independent set.

| Section | Slides |
|---|---|
| Opening | Title · Objective · Starter (simplify, equal sharing, scaling, a fraction of an amount) |
| A. Sharing a total | Divider · Depth (Level 2) · worked · whiteboards (WA1 to WA5) · generator (Sharing) · 3 × 3 board grid (A1 to A9) |
| B. A known share | Divider · Depth · worked · whiteboards (WB) · generator (Known Amounts) · printed sheet of nine |
| C. A difference | Divider · recap of lesson 1 · Depth · worked · whiteboards (WC) · generator (Given Difference) · printed sheet of nine |
| D. Mixed | Divider · two Level 3 Depth cards · whiteboards (WD, unlabelled kinds) · generator (Mixed, three parts on) · printed sheet of fifteen |
| End | Exit ticket · Summary |

The twenty whiteboard questions are in `specs/decks/ratio-sharing-sets.ts` (`WHITEBOARDS`) and checked by `src/tests/ratioSharingSets.test.ts` like the sets.
