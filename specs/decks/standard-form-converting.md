# Deck plan: Standard form, lesson 1 (why we use it, and converting)

**Round 7 (Harry, same day), overriding Round 6 and the plan below where they differ:** (1) **Numbers in parts come last of all**, after large to standard form, standard form to large, small to standard form, standard form to small, both sheets and the mixed run. (2) **Whiteboards have no hints and no partly-completed lines**: an instruction and the number, one size, **five questions to a slide** (the help structure came from another deck and does not help here). (3) **Whiteboard working is Method 1 throughout**; the place value table is a model (bridge) slide only, never the working. (4) **Small numbers: get the first number between 1 and 10 first, then divide**: `0.35 = 3.5 ÷ 10 = 3.5 × 1/10 = 3.5 × 10⁻¹` and `0.00058 = 5.8 ÷ 10 000 = 5.8 × 1/10 000 = 5.8 × 1/10⁴ = 5.8 × 10⁻⁴`, not `35 ÷ 100` and then multiplying out tens. Fractions are written inline (1/100) so every line is the same size. Built and pushed the same day; note that `build --replace` keeps the stored slide order, so a reorder needs a fresh build and `push --replace-whole` after deleting `.deck-base/<id>.json`.

**Round 6 (Harry, after seeing the deck): this overrides "The method in full" below for large numbers.** The chain with `320 × 10²` and `32 × 10³` lines is dropped. Large numbers now have **two methods side by side** on two or three examples before the whiteboards (`32 000`, `8 500`, `190 000`; back: `4.3 × 10³`, `5.7 × 10⁴`, `7.9 × 10⁵`): Method 1 in one step (`32 000 = 3.2 × 10 000 = 3.2 × 10⁴`), Method 2 one ten at a time (`32 000 = 3 200 × 10 = 320 × 10 × 10 = 32 × 10 × 10 × 10 = 3.2 × 10 × 10 × 10 × 10 = 3.2 × 10⁴`). Going back, the same two, then the grid: up one place, power down 1, until `10⁰ (= 1)`. Whiteboard working for large numbers is Method 1. The definition states `1 ≤ A < 10`. **Numbers in parts now follow both large directions (before Sheet 1), not the middle of them.** Small numbers are unchanged for now.

**Status:** plan, revised 2026-11-17 (fourth round with Harry: printed book work inside the lesson). **First build done the same day** (`specs/decks/standard-form.build.ts`, deck `standard-form`, 48 slides, Sheets 1 and 2 as placeholders; Harry's look at it is next). Harry's fifth round: **15 minutes per sheet is far too generous**, so plan about 6 to 8 minutes a sheet and make each sheet long, like the Corbett Maths standard-form sheet he showed (four columns, questions with parts (a) to (r) or (x), no scaffold, a QR code and video link at the top): about 18 to 26 parts a question, in textbook layout, so quick pupils are never waiting. The sheets are still to be built; the deck holds placeholders. Every number below is recomputed by `specs/decks/_check/standard-form-converting-check.py` (115 questions and 14 worked or hook numbers; all correct, none repeated, none used on a slide and also asked).
**Deck id:** `standard-form` (proposed) · **Tool:** `standard-form` (`/standard-form`, Converting tab, Levels 1 to 3; dev-gated)

## Decided with Harry

- **50 minutes, no starter** (Harry gives his own). **Printed book work inside the lesson**, not only at the end: the pupils need something to do in their books, and it is printed because counting the zeros in a long number off a projector, and copying it down, is really hard. Four questions (large to standard form, large to ordinary, small to standard form, small to ordinary), a to l each, textbook format, **on two printed sheets**: Sheet 1 (large) after the large section, Sheet 2 (small) after the small section.
- **The pupils have just done the laws of indices**, so the method uses them: `10 × 10 = 10²`, `10 × 10² = 10³`, and for small numbers `1/10² = 10⁻²` and `10 × 10⁻⁵ = 10⁻⁴`.
- **Large numbers** (Harry's route): `2 000 = 2 × 1 000`, `1 000 = 10³`. Then the chain, `32 000 = 3 200 × 10 = 320 × 10 × 10`, `10 × 10 = 10²`, `320 × 10² = 32 × 10³ = 3.2 × 10⁴`.
- **Small numbers** (Harry's route, via a division and the index law): `0.02 = 2 ÷ 100 = 2 × 1/100 = 2 × 1/10² = 2 × 10⁻²`.
- **The small-number parts need a lot of effort**, so they get their own build-up, not a copy of the large section (below).
- **An abundance of authored questions** (below).
- **Numbers in parts are not an extension at the end.** They are part of writing a number in standard form: `320 × 10²` and `32 × 10³` are lines of the chain, and `58 × 10⁻⁵` is a line of the small chain. They are taught and practised inside the large section and inside the small section.
- **Two stages, understanding first, then the quicker rule** (Harry): the chain is seen several times to build understanding. Then, in each section, the **place value grid** comes in: the number moves one place and the power changes by one. **If the number moves down one place, the power goes up by 1; if it moves up one place, the power goes down by 1.** The chain is the reason, the grid is the shortcut.
- **Words:** the deck never says "move the decimal point". In the grid the point stays fixed (after the ones column, as in the tool) and the digits move; the words are "the number moves down one place" and "each digit is worth ten times less". During the chain stage no arrow crosses the digits.

## The lesson

**Class:** Year 9 higher (assumed) · **Starting point:** laws of indices, just taught; powers of 10 as ordinary numbers. Usual errors: the power is the number of zeros; a small number gets a positive power; `1/10²` read as `10²`; a coefficient outside 1 to 10; a lost internal zero.

Printing the book work changes the time: each sheet needs about 15 minutes in the lesson (two to hand out and start, the rest working). Two ways to fit it, **I recommend B**:

**B. Two lessons, a sheet in each** (recommended: it keeps lots of whiteboard practice and gives the small numbers the effort you asked for)

| Lesson | Min | What happens | Slide type |
|---|---|---|---|
| 1 | 5 | **Why we use it:** the zeros test, three reasons, the definition, four "is it standard form?" cards | Discussion, definition |
| 1 | 12 | **Large to standard form:** the chain, a few whiteboards, **the grid** (the bridge), whiteboards | Model, whiteboards |
| 1 | 7 | **Large from standard form:** the chain read the other way, whiteboards | Model, whiteboards |
| 1 | 6 | **Numbers in parts (large):** whiteboards | Whiteboards |
| 1 | 15 | **Sheet 1 (printed): Q1 and Q2, large**, in books | Printed sheet |
| 1 | 5 | A mixed large run, or the summary | Whiteboards |
| 2 | 20 | **Small to standard form:** the index-law recap, four models, a few whiteboards, **the grid**, whiteboards | Model, whiteboards |
| 2 | 8 | **Small from standard form**, whiteboards | Model, whiteboards |
| 2 | 6 | **Numbers in parts (small):** whiteboards | Whiteboards |
| 2 | 15 | **Sheet 2 (printed): Q3 and Q4, small**, in books | Printed sheet |
| 2 | — | Mixed run (WM) and generator slides, if time | Whiteboards |

**A. One 50 minute lesson, everything:** Why 5 · large to standard form 9 · large from 4 · **Sheet 1** 8 · small to standard form 10 · small from 4 · **Sheet 2** 8 · summary 2. It fits only by cutting the whiteboards to about ten in total, dropping numbers in parts to a single example, and giving about six minutes to each sheet (a to f of each question; the rest at home).

## The method in full

**Large to standard form.**

1. Stage 1: `2 000 = 2 × 1 000`, and `1 000 = 10³`, so `2 000 = 2 × 10³`.
2. The chain, one line per click, for 32 000:
   `32 000 = 3 200 × 10` → `= 320 × 10 × 10` → `10 × 10 = 10²`, so `= 320 × 10²` → `= 32 × 10³` (320 is 32 × 10) → `= 3.2 × 10⁴` (32 is 3.2 × 10).
3. **Numbers in parts (large)** are those middle lines: `320 × 10²` and `32 × 10³` are nearly standard form, and 320 and 32 are not between 1 and 10. The whiteboard run WPL gives a number in parts and asks for standard form: finish the chain from where it is.

**Large from standard form:** `3.2 × 10⁴ = 3.2 × 10 × 10³ = 32 × 10³ = 32 × 1 000 = 32 000`.

**Small to standard form: the build-up** (four models, each adds one idea; this is the part that needs the effort):

| Model | Number | What it adds |
|---|---|---|
| Retrieval first | four quick questions: `1/10² = ?`, `1/10⁴ = ?`, `10 × 10⁻⁵ = ?`, `10⁻³` as a decimal | the two index laws the method uses, before any new idea |
| 1 | `0.02 = 2 ÷ 100 = 2 × 1/100 = 2 × 1/10² = 2 × 10⁻²` | Harry's route: a decimal is a division by a power of ten; the answer is standard form straight away |
| 2 | `0.35 = 35 ÷ 100 = 35 × 10⁻²`, then `35 = 3.5 × 10`, so `= 3.5 × 10 × 10⁻² = 3.5 × 10⁻¹` | a coefficient that is too big (numbers in parts, small), fixed with the same index law |
| 3 | `0.00058 = 58 ÷ 100 000 = 58 × 1/10⁵ = 58 × 10⁻⁵ = 5.8 × 10 × 10⁻⁵ = 5.8 × 10⁻⁴` | more zeros; the power is not the zeros (58 is 5.8 × 10, which takes one off) |
| 4 | discussion: "why is the power negative?" (we divided by tens, so the number is smaller than 1) | the meaning of the sign, and why `0.02` is not `2 × 10²` |

**Small from standard form:** `1.6 × 10⁻² = 1.6 × 1/10² = 1.6 ÷ 100 = 0.016`, then `3.7 × 10⁻³ = 3.7 ÷ 1 000 = 0.0037`.

**Numbers in parts (small):** both kinds. Too big, `70 × 10⁻⁴ = 7 × 10 × 10⁻⁴ = 7 × 10⁻³`. Too small, `0.9 × 10⁷ = 9 ÷ 10 × 10⁷ = 9 × 10⁻¹ × 10⁷ = 9 × 10⁶` (0.9 is `9 × 10⁻¹`, from the first small model). Worked first: `0.8 × 10³ = 8 × 10⁻¹ × 10³ = 8 × 10²`.

**Stage 2: from the chain to the grid** (once the chain has been seen on the model and on the first four whiteboards of the section):

1. **The bridge slide** shows the grid with 32 000 written one digit to a column and `× 10⁰` beside it. Each click moves the number down one place (each digit is now worth ten times less) and the power goes up by 1: `× 10¹`, `× 10²`, `× 10³`, until the first digit is in the ones column and the power is 4: `3.2 × 10⁴`. Beside it, the chain's lines: the same five lines, so the class sees that the grid is the chain, one ten at a time.
2. **The rule**, written once on the board: *down one place, power up 1; up one place, power down 1.*
3. **Small numbers:** `0.02 × 10⁰`, the number moves up two places, the power goes down by 1 twice, `2 × 10⁻²`; and the link back to Harry's route (`2 ÷ 100`: dividing by 10 twice is the power going down twice).
4. **Large from standard form** is the grid the other way: start with `3.2 × 10⁴`, move the number up (the power going down) until the power is `10⁰`.
5. **Numbers in parts** fit the grid as well: `320 × 10²` has the 3 in the hundreds column and the power 2; moving the number down one place makes `32 × 10³`, and down again `3.2 × 10⁴`. This is the tool's "half" picture.

After the bridge, whiteboard working in the run shows the grid, with the chain still available as the reason. The class can use either; the grid is the one to aim for.

## Slide plan

| Section | Slides |
|---|---|
| Opening | Title · Learning objective with three "I can" lines |
| Why we use it | Divider · **the zeros test:** 150 000 000 km (Earth to the Sun) and 0.000007 m (a red blood cell) said aloud, then 0.00000000000000000000000000167 kg (a hydrogen atom): "count the zeros, and say how sure you are" · the same three as 1.5 × 10⁸, 7 × 10⁻⁶, 1.67 × 10⁻²⁷ · **three reasons** (short to write, hard to miscount, the power shows the size; "your calculator switches to it when the screen is full") · **key definition** (formal wording; ordinary number, standard form, power) · **is it standard form?**: `3.8 × 10⁵` yes (3.8 is between 1 and 10) · `38 × 10⁴` no (38 is 10 or more) · `0.38 × 10⁶` no (0.38 is less than 1) · `9.99 × 10⁻³` yes (a negative power is fine) |
| Large to standard form | Divider · stage 1 (2 000) · the chain for 32 000, one line per click · which lines are standard form and which are not · WL 1 to 4 (chain working) · **the bridge: the chain on the grid** and the rule · WL 5 to 10 (grid working) · divider (four-question recap) · numbers in parts: "Is 25 × 10⁶ standard form? Fix it." · WPL 1 to 8 |
| Large from standard form | The chain reversed · WF 1 to 3 · the grid reversed (the number moves up, the power goes down) · WF 4 to 9 · **book work slide: Sheet 1** (an instruction only, no title: "Sheet 1, questions 1 and 2"; answers on a click) |
| Small to standard form | Divider · four retrieval questions · models 1 to 4 (one per slide, one line per click) · WS 1 to 4 (chain working) · **the bridge, small:** 0.02 on the grid, the number moves up, the power goes down, and the rule again · WS 5 to 12 (grid working) |
| Small from standard form | The two reversed models · WT 1 to 4 (chain working) · the grid reversed · WT 5 to 10 · numbers in parts, small: worked `0.8 × 10³` on the chain and on the grid, then WPS 1 to 8 · **book work slide: Sheet 2** (questions 3 and 4; answers on a click) |
| Mixed (if time) | Divider · WM 1 to 10 · generator slides (Converting L1, L2, L3) |
| End | Summary (the definition, the chain, the rule) |

## The whiteboard bank (67 questions, all authored)

Whiteboards are full width and centred, one question each, with help that climbs inside a run: the working started (the first lines given), a small grey hint ("how many tens?", or "which way does the number move?"), then none; the last in a run has none. The working shown is the chain for the first four of a run and the grid after the bridge slide. **Every whiteboard fits the grid** (10⁹ down to 10⁻⁶; checked); five worksheet questions (3e, 3h, 3k, 4e, 4l) go past it, which does not matter because the paper shows no working. **Authored questions have no levels.** Each pair of coefficient digits and power is used once across the whiteboards and worksheet, and no worked number is asked.

| Run | Numbers (ordinary ⇄ standard form, or "in parts" → standard form) |
|---|---|
| Worked | 2 000 = 2 × 10³ · 32 000 = 3.2 × 10⁴ · 0.02 = 2 × 10⁻² · 0.35 = 3.5 × 10⁻¹ · 0.00058 = 5.8 × 10⁻⁴ · 1.6 × 10⁻² = 0.016 · 3.7 × 10⁻³ = 0.0037 · 0.8 × 10³ → 8 × 10² |
| **WL** large to standard (10) | 60 000 = 6 × 10⁴ · 5 000 000 = 5 × 10⁶ · 45 000 = 4.5 × 10⁴ · 380 000 = 3.8 × 10⁵ · 7 200 000 = 7.2 × 10⁶ · 91 000 000 = 9.1 × 10⁷ · 536 000 = 5.36 × 10⁵ · 2 840 000 = 2.84 × 10⁶ · 4 070 000 = 4.07 × 10⁶ (internal zero) · 100 000 000 = 1 × 10⁸ (coefficient 1) |
| **WPL** in parts, large (8) | 40 × 10³ → 4 × 10⁴ · 15 × 10⁴ → 1.5 × 10⁵ · 62 × 10⁷ → 6.2 × 10⁸ · 240 × 10² → 2.4 × 10⁴ · 900 × 10⁵ → 9 × 10⁷ · 735 × 10³ → 7.35 × 10⁵ · 1 600 × 10⁴ → 1.6 × 10⁷ · 4 080 × 10² → 4.08 × 10⁵ |
| **WF** large to ordinary (9) | 7 × 10⁵ = 700 000 · 4 × 10⁷ = 40 000 000 · 3.5 × 10³ = 3 500 · 6.2 × 10⁵ = 620 000 · 8.9 × 10⁷ = 89 000 000 · 1.46 × 10⁴ = 14 600 · 5.08 × 10⁶ = 5 080 000 (internal zero) · 9.317 × 10⁵ = 931 700 · 6.482 × 10² = 648.2 (a decimal answer) |
| **WS** small to standard (12) | 0.7 = 7 × 10⁻¹ · 0.09 = 9 × 10⁻² · 0.0004 = 4 × 10⁻⁴ · 0.38 = 3.8 × 10⁻¹ · 0.0062 = 6.2 × 10⁻³ · 0.00083 = 8.3 × 10⁻⁴ · 0.000071 = 7.1 × 10⁻⁵ · 0.0258 = 2.58 × 10⁻² · 0.000419 = 4.19 × 10⁻⁴ · 0.00306 = 3.06 × 10⁻³ (internal zero) · 0.000052 = 5.2 × 10⁻⁵ · 0.1 = 1 × 10⁻¹ (coefficient 1) |
| **WT** small to ordinary (10) | 3 × 10⁻² = 0.03 · 8 × 10⁻⁴ = 0.0008 · 2.5 × 10⁻³ = 0.0025 · 6.1 × 10⁻² = 0.061 · 9.4 × 10⁻⁴ = 0.00094 · 1.7 × 10⁻⁵ = 0.000017 · 4.36 × 10⁻³ = 0.00436 · 7.05 × 10⁻⁴ = 0.000705 (internal zero) · 5.9 × 10⁻¹ = 0.59 · 2.08 × 10⁻² = 0.0208 |
| **WPS** in parts, small (8) | 70 × 10⁻⁴ → 7 × 10⁻³ · 74 × 10⁻⁴ → 7.4 × 10⁻³ · 390 × 10⁻⁶ → 3.9 × 10⁻⁴ · 125 × 10⁻⁴ → 1.25 × 10⁻² · 0.6 × 10⁻³ → 6 × 10⁻⁴ (too small) · 0.9 × 10⁷ → 9 × 10⁶ · 0.38 × 10⁸ → 3.8 × 10⁷ · 0.047 × 10⁻² → 4.7 × 10⁻⁴ |
| **WM** mixed (10) | 28 000 000 → 2.8 × 10⁷ · 0.000046 → 4.6 × 10⁻⁵ · 3.3 × 10⁶ → 3 300 000 · 8.1 × 10⁻³ → 0.0081 · 0.0705 → 7.05 × 10⁻² · 640 000 → 6.4 × 10⁵ · 5.72 × 10⁴ → 57 200 · 0.000093 → 9.3 × 10⁻⁵ · 4.9 × 10⁻² → 0.049 · 710 000 000 → 7.1 × 10⁸ |

**The ladder in every run:** one non-zero digit · two digits · more digits · an internal zero · an edge (coefficient 1, a power of only −1, a decimal answer). Consecutive questions change one thing. The small runs start at power −1 (0.7), the easiest case of Harry's route, and climb.

**Traps** (new tags to add to `src/shared/misconceptions.ts`; none for standard form exist):

| Tag (proposed) | Wrong method | Where it bites |
|---|---|---|
| `sf-count-zeros` | the power is the number of zeros (32 000 → 3.2 × 10³) | 46 of the 52 to-standard-form questions; it matches the right power only in WL1, WL2, WL10, 1a, 1b, 1i (checked) |
| `sf-coefficient-range` | 32 × 10³ or 0.32 × 10⁵ left as the answer | WPL, WPS, the cards, the chain's middle lines |
| `sf-small-positive-power` | a small number gets a positive power (0.02 = 2 × 10²) | every small to-standard-form question |
| `sf-reciprocal-dropped` | `1/10²` read as `10²` | the small models, WS |
| `sf-negative-power-large` | a negative power makes a big number (3.7 × 10⁻² = 370) | WT, worksheet 4 |
| `sf-negative-power-negative` | a negative power makes a negative number (−0.037) | WT, worksheet 4 |
| `sf-lost-internal-zero` | 3.06 → 3.6 | WL9, WS10, WF7, WT8 |
| `sf-adds-zeros` | to ordinary: the digits then n zeros (5.08 × 10⁶ → 5.08 followed by six zeros) | WF7, WF9 |

## The printed sheets (two, used inside the lesson; textbook format)

Four numbered questions, each a to l in three columns of four, climbing the same ladder, on **two sheets**: **Sheet 1** (Q1, Q2: large, taught first) and **Sheet 2** (Q3, Q4: small). **No numbers in parts** on the sheets (they are practised on the whiteboards in each section and appear as lines of the pupils' own working). Pupils answer in their books; each sheet has an answers page, and the slide shows the answers on a click. In the lesson pupils start with a to f of each question; g to l are the stretch, or home.

| Sheet | Q | Asks | Ends on |
|---|---|---|---|
| 1 | 1 | Write in standard form (large) | 1 000 000 (coefficient 1), then 1 280 000, 90 700 000, 6 150 000 |
| 1 | 2 | Write as an ordinary number (large) | 3.274 × 10⁵, 6.005 × 10⁴, 9.18 × 10² |
| 2 | 3 | Write in standard form (small) | 0.3 (power −1), then 0.00725, 0.0000604, 0.0013 |
| 2 | 4 | Write as an ordinary number (small) | 5.381 × 10⁻², 1.002 × 10⁻³, 7.7 × 10⁻⁷ |

All 48 numbers are in the checked file; none appears on a slide. Possible textbook extras on each sheet: a "Key ideas" box (the definition and the chain, or the rule) and one worked example per question.

**Making the zeros countable (why it is printed):** large numbers print in groups of three (`4 070 000`, a thin space, in a big even-width font) on the sheets and on the slides. Small numbers are harder; proposal for the look card: print the digits after the point in groups of three too (`0.000 058 3`) on the sheets and whiteboards, so a pupil can see how many places there are, with a note that exam papers do not group them. Decide on the picture, not in words.

**Open: how the textbook layout is produced.** Pinned worksheets (up to three, A4 or A5, hand-written `frozen` sets, an answer sheet) are numbered grids; they have no lettered parts and one instruction above the set. Two sheets fits the limit of three. Options: (a) two pinned A4 sheets, each with two blocks (an instruction above each 12) and the answers sheet, using the engine as it is if it can carry two instructions on one sheet (to check); (b) a new printable in `src/shared/printables.ts` with the textbook layout (R38 limits printables to blanks pupils fill in, so it needs a decision); (c) a document built outside the deck and linked from it. A one-page mock-up of (a) is the first step, now that the sheets are needed for lesson 1 rather than last. The third pinned sheet is free: a mixed sheet with numbers in parts for the second lesson, if wanted.

## What already exists, and what needs building

| Need | Status |
|---|---|
| Converting tab, Levels 1 to 3 (large, small, in parts), Whiteboard / Worked Example / Worksheet | **Yes**, with the place value grid as its working: the digits move a column and the power changes by 1, which is the second stage of the lesson, so the grid is used as built. Check the tool's captions say "down one place, power up 1" in the lesson's words |
| **Working in the chain method**, for the tool and for the authored questions (the first stage) | **To build.** Lines as ordinary `mStep` lines (peel a ten, combine the tens, finish the coefficient; for small numbers the division, the `1/10ⁿ` step and the index law). The number and answer the generator draws do not change (R5) |
| Fixed-question builder (`Q.…`) | **None** (preflight). It must carry both workings, the chain (plain lines) and the grid (the tool's picture). The chain part is small: take the Converting generator's inner function into its own file (pattern `src/tools/Proportion/ratioFromFraction.ts`) and add a `Q.` builder that verifies the answer |
| Depth bank | **None.** Write `specs/depth/standard-form.md` (`docs/design/templates/DEPTH_SPEC_TEMPLATE.md`) once the deck is agreed: "which is in standard form?" and the eight wrongs above |
| The grid as a **slide piece** (a board that moves the number a column per click, with the power beside it, grid on and off) | **To check** (`docs/reference/pictures.md` lists the tool's `PlaceValueShift`, not a slide piece). If missing, build it as part of this deck from `PlaceValueShift.tsx`; it is the bridge slide's main element |
| The tool is dev-gated | Confirm generator slides work against it, or take it live |
| `<Tool>.about.ts` | Needs a line for the new method (R11) |

## To settle with Harry

1. **The tool's working (answered in part):** the grid is kept and used as the second stage. Still open: the new chain working as a **Method** option on Converting (display-only, R24), "Powers of 10" and "Place value grid", and which is the tool's default. For this lesson the deck uses the chain first and the grid second either way.
2. **Small numbers, model 3:** `0.00058 = 58 ÷ 100 000`: is the line "58 is 5.8 × 10, which takes one off the power" the right place to rehearse the sign, or should that model be built from a smaller number first (0.0058 = 58 × 10⁻⁴)?
3. **One lesson or two (A or B above)?** I recommend B: Sheet 1 closes lesson 1, Sheet 2 closes lesson 2. With A, the whiteboards drop to about ten and numbers in parts shrink to one example.
4. **Grouping digits in small numbers** (`0.000 058 3`) to make the zeros countable: yes, no, or large numbers only? I will put it on the look card.
5. **Layout of the sheets:** the mock-up of option (a) first, since lesson 1 now needs Sheet 1.
6. **Bank size:** 67 whiteboards plus the 48 on the sheets. Right amount, or more for small numbers (WS 12, WT 10, WPS 8 are the biggest)?
7. **When the grid comes in:** after the chain model and the first four whiteboards of each section. Right, or sooner?
8. **Build order (agreed):** the Converting working and fixed-question builder, then the Depth bank spec, then the look card (`npm run deck -- looks`), **then Sheet 1 mock-up**, the deck, and Sheet 2.
