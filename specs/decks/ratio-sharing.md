# Deck plan: Sharing in a ratio

**Status:** plan for Harry's review (revised 2026-11-15 after his first reply). Nothing built; no question written. The checklist's first step is to agree the tool changes, the traps and the ladders below.
**Deck id:** `ratio-sharing` · **Tool:** `ratio-sharing` (`/ratio-sharing`) · **Representation:** the bar model (stacked ratio look) · **Pitch:** middle band · **Length:** 1 to 2 lessons

**Shape (Harry, 2026-11-15).** A recap for a class that has met this before, built around finding and fixing mistakes. Questions are **all authored, in difficulty ladders, none generated**: nine projected questions for each kind (sharing a total, a known share, a difference) as a **3 × 3 grid with the instruction once above it and just the numbers in each cell**, then one mixed worksheet of fifteen at the end in the **textbook layout**. More is written than any one pupil is expected to finish: the sets are there to give stretch, not to be completed. The "who is right?" moments are the tool's new Depth cards, used as deck slides.

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

No levels on authored questions; the order carries difficulty. One thing changes between neighbours. A non-money context appears at least once in each set. Help fades the house-style way: the first six cells carry a tiny grey hint ("Hint: 10 parts"), the last three none. The bar model is taught on the worked-example slide before each set, not in the cells.

**How a set is drawn (3 × 3, `S.plainBook`).** One instruction above the grid, then each cell is bare numbers, big and centred. Because one instruction covers all nine, *what is asked is the same for the whole grid*; that is a gain (it isolates the method, and "read what is asked" is tested later by the mixed worksheet) and a cost (a rung that asks for one share, or the other person's share, cannot be a separate rung). Where a rung needs a different ask, the cell carries a short last line ("Find the total"). The look card will show whether three lines fit a cell; if not, that rung moves to a sheet.

| Set | Instruction above the grid | A cell is |
|---|---|---|
| A: from a total | Share each amount in the ratio given. | `£50` over `3 : 7` (three parts: `£90` over `2 : 3 : 4`; a quantity: `40 kg` over `3 : 5`) |
| B: a known share | Find the total. (Rungs asking for the other share carry "Find the other share") | `3 : 5` over `first gets £24` |
| C: a difference | Find both shares. (Rungs asking for the total carry "Find the total") | `3 : 7` over `difference £48` |

Sets B and C are on the board as grids too. If a grid does not fit, or a class wants paper, a set can be a pinned printed sheet instead (up to three per deck, and the mixed worksheet takes one).

**Set A: Sharing from a total**

| Rung | What it is | Trap |
|---|---|---|
| A1 | 1 : n, small total, one share asked | |
| A2 | Same shape, both shares, with the check | T9 |
| A3 | a : b (2 : 3, 3 : 4), times-table total, one share | T1, T2 |
| A4 | Second named person has the larger share, both | T3 |
| A5 | Non-money context (sweets, kg), a : b | |
| A6 | Larger total, parts sum to 10 to 12, no bar | T8 |
| A7 | Ratio given unsimplified (6 : 9) | T11 |
| A8 | Three parts, times-table total | T10 |
| A9 | Three parts, the part value is not whole (pounds and pence) | |

**Set B: A known share**

| Rung | What it is | Trap |
|---|---|---|
| B1 | 1 : n, the known share is the 1 part; find the other | T4 |
| B2 | 1 : n, the known share is the larger; find the other | T4 |
| B3 | a : b, find the total | T5 |
| B4 | a : b, the known is the second person; find the other | T3 |
| B5 | Non-money context, find the total | |
| B6 | Larger numbers, no bar | T8 |
| B7 | Unsimplified ratio, find the other | T11 |
| B8 | Three parts, one share known, find the total | T10 |
| B9 | Three parts, one known, find a different named share | T10 |

**Set C: A difference**

| Rung | What it is | Trap |
|---|---|---|
| C1 | 1 : 3, "£x more than", find the larger share | T6 |
| C2 | Same ratio, "£x less than", find the total | T6 |
| C3 | 2 : 5 (three parts apart), find both | T7 |
| C4 | "The difference between their shares is", find the total | T6, T7 |
| C5 | The first named has less; find the first's share | T3 |
| C6 | Non-money context | |
| C7 | Larger numbers, no bar, find the total | T8 |
| C8 | Three parts, difference between two named people, find the third's share | T10 |
| C9 | Three parts, difference, find the total (stretch) | T10 |

**Worksheet D: Mixed, fifteen (textbook layout)**

Kinds are interleaved, never labelled, in a climb: 1 to 5 two-part, simple (a spread of the three kinds); 6 to 10 unsimplified ratio, a non-money context, larger numbers, an order trap; 11 to 15 three-part, with the last two the hardest. About five of each kind. Questions use numbers used nowhere else in the deck. The tool Worksheet's **Textbook** layout (the pinned worksheet's `layout: "list"`, which the deck already supports): numbered `1)` lines, the instruction once, no boxes, the answer inline on the answer sheet. It suits worded questions of mixed length better than equal boxes, and fifteen fit one A4 page comfortably. The plan is one pinned A4 worksheet, hand-written (`frozen`), in this layout, with its answer sheet; the look card puts it beside the boxed layout so Harry can choose.

## Slide plan (about 22 slides; each divider is a pick-up point)

| Section | Slides |
|---|---|
| Opening | Title · Objective · Starter (four quick retrieval questions, numbers used nowhere else) |
| A. Sharing from a total | Divider · Depth card ("who is right?", T1, T2) · bar model built a click at a time (worked example) · **Grid A (nine, 3 × 3, instruction above, answers on a click)** |
| B. A known share | Divider · Depth card (T4, T5) · bar with the known box coloured · **Grid B** |
| *Lesson break after B* | The second lesson starts at the next divider with a recap of three quick questions from A and B |
| C. A difference | Divider · Depth card (T6, T7) · bar with purple extra boxes · **Grid C** |
| D. Mixed | Divider · "What do I check every time?" (read what is asked, add the shares, check) · **Worksheet D** (cue slide, answers on a click; printed in the textbook layout) |
| End | Exit ticket (three questions, one of each kind, new numbers) · Summary |

**Time.** Not everyone will finish a set (agreed). Each set is a ladder, so the brief says where a secure class can start or a class can stop. A grid has no stepped working on the board: the worked-example slide and Depth card come first, and the answers show on a click.

## Decisions for Harry

1. **The tool changes above**: all, or leave out 5 (other contexts) and 3 (unsimplified)? Both feed the ladders (A5, B5, C6; A7, B7).
2. **One instruction per grid, so one kind of ask per grid** (above). Fine, or do you want a different ask in some cells?
3. **Textbook layout for Worksheet D**: the look card shows it beside the boxed layout.
4. **Lesson break** after the known share (B), so the difference and the mixed work are lesson 2.
5. **Depth cards as the discussion slides.**
6. Which of the eleven traps to drop or add.

## Build steps once agreed

1. Tool change (own commit, tests, About words, `npm run facts`): items 1, 3 to 8 above.
2. Depth spec (`specs/depth/ratio-sharing.md`) for Harry to read, then the bank.
3. Question tables for sets A to C and worksheet D (rung, answer, trap, wrong-method result), every answer recomputed by a separate route, shown to Harry before the deck is built.
4. Build script (outside the repo), look card (`npm run deck -- looks`), Harry says yes; build; `npm run deck -- check ratio-sharing --layout`; `deck review`; look at every sheet.
5. Pathway, patch notes, planner Build Log and the tool's dashboard note.
