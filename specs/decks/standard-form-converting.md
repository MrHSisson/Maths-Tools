# Deck plan: Standard form, lesson 1 (why we use it, and converting)

**Status:** plan, revised 2026-11-17 with Harry's answers (50 minutes, no starter; numbers in parts are in; the method is repeated tens, never a moving point; one worksheet at the end). Nothing built. Every number below is recomputed by `specs/decks/_check/standard-form-converting-check.py` (93 numbers, all pass).
**Deck id:** `standard-form` (proposed) · **Tool:** `standard-form` (`/standard-form`, Converting tab, Levels 1 to 3; dev-gated) · **Picture:** none. The method is lines of equal numbers (see "The method"); the tool's place value grid is **not used** in this deck.

## The lesson

**Lesson:** Standard form 1: why we use it, and converting both ways · **Class / year:** Year 9 higher (assumed) · **Length:** 50 minutes (Harry gives his own starter) · **Tool:** Standard Form, Converting

**Objective:** pupils can say why standard form is used, say whether a number is in standard form, and convert large and small numbers to and from it, including numbers "in parts" such as 320 × 10².

**Starting point:** powers of 10 from Indices (10³ = 1 000; 10⁻² = 0.01). The method below needs two things they have: `10 × 10 = 10²` (adding powers) and, for small numbers, `10⁻³ = 0.001`.

**Teach both ways first, with lots of whiteboard practice; then one worksheet at the end** (Harry). There is no exit ticket: the worksheet is the check.

| Min | What happens | Slide type |
|---|---|---|
| 8 | **Why we use it:** the zeros test (hook), three reasons, key definition, four "is it standard form?" cards | Discussion, definition |
| 7 | **The method, large numbers:** 2 000 = 2 × 1 000 = 2 × 10³, then the chain for 32 000 | Model, one line per click |
| 7 | **Whiteboards, large to standard form** (WL) | Whiteboards |
| 6 | **Back again:** 3.2 × 10⁴ to 32 000, the same lines read the other way (WF) | Model, whiteboards |
| 5 | **Numbers in parts** (WP): the middle lines of the chain, finished off | Whiteboards |
| 8 | **Small numbers, both ways** (WS, WT), then a mixed run (WM) | Model, whiteboards |
| 9 | **Worksheet** (four questions) | Printed sheet |

The whiteboard bank is bigger than the lesson (28 questions); the dividers are pick-up points, so what is not reached carries to lesson 2.

## The method (decided with Harry): repeated tens, never a moving point

**Nothing on a slide or in a caption moves, slides or shifts a decimal point or a digit, and no arrow crosses the digits.** The words are "multiply", "divide", "is the same as", "write as". The tool's place value grid ("slide every digit one column") is therefore not used in this deck.

**Stage 1: a 1 followed by zeros is a power of 10.**
`2 000 = 2 × 1 000` and `1 000 = 10³`, so `2 000 = 2 × 10³`.

**Stage 2: the chain** (built one line per click), for 32 000:

1. `32 000 = 3 200 × 10`
2. `= 320 × 10 × 10`
3. `10 × 10 = 10²`, so `= 320 × 10²`
4. `= 32 × 10³` (320 is 32 × 10, and 10 × 10² = 10³)
5. `= 3.2 × 10⁴` (32 is 3.2 × 10, and 10 × 10³ = 10⁴)

Lines 3 and 4 are **numbers in parts** (a coefficient that is too big). They are named as stepping stones, so the "numbers in parts" work is simply "finish the chain from here". Pupils meet 32 × 10³ as a form that is *nearly* standard form and see exactly why 32 is not allowed (it is 3.2 × 10).

**Back again:** the same lines read in the other direction: `3.2 × 10⁴ = 3.2 × 10 × 10³ = 32 × 10³ = 32 × 1 000 = 32 000`.

**Small numbers (proposal, to confirm):** the same idea with `0.001 = 10⁻³`. `0.003 = 3 × 0.001 = 3 × 10⁻³`. Then `0.00058 = 58 × 0.00001 = 58 × 10⁻⁵ = 5.8 × 10 × 10⁻⁵ = 5.8 × 10⁻⁴` (the line `10 × 10⁻⁵ = 10⁻⁴` is the one to rehearse: `10⁻⁵` is 1 ÷ 100 000, ten times that is 1 ÷ 10 000). Back: `4.6 × 10⁻³ = 4.6 × 0.001 = 0.0046`.

**Why the zeros trap is the point of the lesson:** 32 000 has three zeros but the power is 4. The chain shows why: the power is not the zeros, it is the tens that were peeled off, and the last one comes from turning 32 into 3.2 × 10. (A 1 followed by zeros, such as 1 000, does have as many zeros as its power; stage 1 uses only that.)

## Slide plan

| Section | Slides |
|---|---|
| Opening | Title · Learning objective with three "I can" lines |
| Why we use it | Divider · **the zeros test:** show 150 000 000 km (Earth to the Sun) and 0.000007 m (a red blood cell), pupils say each aloud, then 0.00000000000000000000000000167 kg (a hydrogen atom): "count the zeros, and say how sure you are" · same three as 1.5 × 10⁸, 7 × 10⁻⁶, 1.67 × 10⁻²⁷, one per click · **three reasons** (short to write, hard to miscount, the power shows the size; "your calculator switches to it when the screen is full") · **key definition** (formal wording; the words ordinary number, standard form, power) · **is it standard form?** (four cards, below) |
| The method, large | Divider · stage 1 (2 000) · stage 2, the chain for 32 000, one line per click · what is in standard form: the lines that are, the lines that are not |
| Large to standard form | WL 1 to 7 (help climbs: chain started, a small grey hint "how many tens?", none; the last has none) |
| Back again | The chain reversed for 3.2 × 10⁴ · WF 1 to 6 |
| Numbers in parts | Divider (four-question recap first) · "Is 25 × 10⁶ standard form? Fix it." · WP 1 to 7 (the last three have a coefficient that is too small, 0.9 × 10⁷, and are marked as a step up) |
| Small numbers | Divider · stage 1 and the chain for 0.003 and 0.00058 · WS 1 to 6 · the chain reversed for 1.6 × 10⁻² · WT 1 to 5 · WM 1 to 5 (mixed, both ways, shuffled) |
| End | Worksheet (instructions only, no title; the answers shown on a click) · Summary |

**Is it standard form?** (four cards, each answer a reason): `3.8 × 10⁵` yes (3.8 is between 1 and 10) · `38 × 10⁴` no (38 is 10 or more) · `0.38 × 10⁶` no (0.38 is less than 1) · `9.99 × 10⁻³` yes (a negative power is fine). Spares for a Depth card later: `10 × 10²` (10 is not below 10) and `380 000` (an ordinary number).

## The whiteboard bank

Whiteboard slides are full width, centred, one question each, with the help climbing; working is authored as the lines of the chain (not the grid), so a pupil's own working looks like the model's. **Authored questions have no levels.** Every pair of coefficient digits and power is used by one question only (checked); the hook and worked numbers are asked nowhere.

| Run | Numbers (ordinary ⇄ standard form) |
|---|---|
| Worked | 2 000 = 2 × 10³ · 32 000 = 3.2 × 10⁴ · 0.003 = 3 × 10⁻³ · 0.00058 = 5.8 × 10⁻⁴ · 1.6 × 10⁻² = 0.016 |
| **WL** large to standard form | 60 000 = 6 × 10⁴ · 450 000 = 4.5 × 10⁵ · 91 000 = 9.1 × 10⁴ · 7 300 000 = 7.3 × 10⁶ · 862 000 = 8.62 × 10⁵ · 3 050 000 = 3.05 × 10⁶ (internal zero) · 100 000 = 1 × 10⁵ (coefficient 1) |
| **WF** large to ordinary | 9 × 10⁴ = 90 000 · 5.4 × 10³ = 5 400 · 2.8 × 10⁶ = 2 800 000 · 7.25 × 10⁵ = 725 000 · 3.06 × 10⁷ = 30 600 000 (internal zero) · 8.346 × 10² = 834.6 (the answer has a decimal point) |
| **WP** in parts | 50 × 10⁶ → 5 × 10⁷ · 25 × 10⁵ → 2.5 × 10⁶ · 640 × 10² → 6.4 × 10⁴ · 480 × 10⁻⁵ → 4.8 × 10⁻³ · 0.9 × 10⁷ → 9 × 10⁶ · 0.38 × 10⁸ → 3.8 × 10⁷ · 0.052 × 10⁻² → 5.2 × 10⁻⁴ |
| **WS** small to standard form | 0.0007 = 7 × 10⁻⁴ · 0.025 = 2.5 × 10⁻² · 0.00046 = 4.6 × 10⁻⁴ · 0.000019 = 1.9 × 10⁻⁵ · 0.00802 = 8.02 × 10⁻³ (internal zero) · 0.4 = 4 × 10⁻¹ (power only −1) |
| **WT** small to ordinary | 2 × 10⁻³ = 0.002 · 3.7 × 10⁻² = 0.037 · 9.2 × 10⁻⁴ = 0.00092 · 5.01 × 10⁻³ = 0.00501 · 2.6 × 10⁻¹ = 0.26 |
| **WM** mixed | 83 000 000 → 8.3 × 10⁷ · 4.5 × 10⁻⁵ → 0.000045 · 0.00061 → 6.1 × 10⁻⁴ · 7.04 × 10⁶ → 7 040 000 · 540 000 → 5.4 × 10⁵ |

**The ladder** (consecutive questions change one thing; edge cases last): one non-zero digit · two digits · more digits · internal zero · coefficient 1 or power only ±1 or a decimal answer.

**Traps** (new tags for `src/shared/misconceptions.ts`; none for standard form exist):

| Tag (proposed) | Wrong method | Where it bites |
|---|---|---|
| `sf-count-zeros` | the power is the number of zeros (32 000 → 3.2 × 10³) | every question whose coefficient has two or more digits or whose number is small (checked: the zeros count differs from the power in 29 of the 34 to-standard-form questions; it matches only in WL1, WL7 and worksheet 1a, 1b, 1i, which are the one-digit and coefficient-1 cases) |
| `sf-coefficient-range` | 32 × 10³, 0.32 × 10⁵ left as the answer | WP, the cards, the chain's middle lines |
| `sf-small-positive-power` | a small number gets a positive power | every small to-standard-form question |
| `sf-negative-power-large` | a negative power makes a big number (3.7 × 10⁻² = 370) | WT, worksheet 4 |
| `sf-negative-power-negative` | a negative power makes a negative number (−0.037) | WT, worksheet 4 |
| `sf-lost-internal-zero` | 3.05 → 3.5 | WL6, WS5, WF5, WT4 |
| `sf-adds-zeros` | to ordinary: the digits then n zeros (4.07 × 10⁷ → 4.07 followed by seven zeros) | WF5, WF6 |

## The worksheet (one, at the end; textbook format)

Four numbered questions, each a to l in three columns of four, climbing the ladder above:

| Q | Asks | Parts |
|---|---|---|
| 1 | Write in standard form (large) | a to i whole numbers; j to l numbers in parts (36 × 10⁴, 810 × 10³, 0.74 × 10⁸) |
| 2 | Write as an ordinary number (large) | a to l (ends on 3.274 × 10⁵, 6.005 × 10⁴, 9.18 × 10²) |
| 3 | Write in standard form (small) | a to i; j to l in parts (750 × 10⁻⁶, 0.6 × 10⁻², 0.081 × 10⁻³) |
| 4 | Write as an ordinary number (small) | a to l (ends on 5.381 × 10⁻², 1.002 × 10⁻³, 7.7 × 10⁻⁷) |

All 48 numbers are in the checked file, none used on a slide. Pupils answer in their books; there is an answers page and the slide shows the answers on a click. Possible textbook extras: a "Key ideas" box (the definition and the chain in one picture) and one worked example per question.

**To confirm:** I read "a worksheet which looks at 4 questions" as these four questions with lettered parts. If you meant four short questions in total, it is a smaller sheet with the same four kinds. Also: are the in-parts parts (Q1 j to l, Q3 j to l) wanted on the sheet, or only on whiteboards?

**Open: how a textbook layout is produced.** Pinned worksheets (up to three, A4 or A5, hand-written `frozen` sets, an answer sheet) are numbered grids of questions; they have no lettered parts. Options: (a) one pinned A4 sheet using the existing engine, the lettered parts written into each question's cell (four cells); (b) a new printable in `src/shared/printables.ts` with the textbook layout (R38 limits printables to blanks pupils fill in, so it needs a decision); (c) a document built outside the deck and linked from the lesson. We agreed to settle this when we get there; a one-page mock-up of (a) is the first step.

## What already exists, and what needs building

| Need | Status |
|---|---|
| Converting tab, Levels 1 to 3 (large, small, in parts), Whiteboard / Worked Example / Worksheet | **Yes**, but its working is the place value grid ("slide every digit one column"), which is the idea this lesson avoids. **Decision needed (below).** |
| **Working in the chain method** | **To build.** The working lines (peel a ten, combine the tens, finish the coefficient) are ordinary `mStep` lines, with no new picture. The generator's number and answer stay as they are; only the working changes (R5: one computation) |
| Fixed-question builder (`Q.…`) | **None** (preflight). Because the working is plain lines the builder is small: take the Converting generator's inner function out into its own file (pattern `src/tools/Proportion/ratioFromFraction.ts`), add a `Q.` builder that verifies the answer |
| Depth bank | **None.** Write `specs/depth/standard-form.md` from `docs/design/templates/DEPTH_SPEC_TEMPLATE.md` once the deck is agreed: "which is in standard form?" and the seven wrongs above. The deck has none until then |
| The tool is dev-gated (`enabled: false`) | Confirm generator slides work against it, or take it live |
| `<Tool>.about.ts` | Needs a line for the new method (R11) |

## To settle with Harry

1. **The tool's working (needs a yes or no).** Recommendation: add a **Method** option on Converting, "Powers of 10" and "Place value grid", display-only (R24: it changes only the displayed working), with "Powers of 10" the default, so the tool and the deck teach the same idea and the grid stays for anyone who wants it. Alternative: change the working outright and drop the grid. Either way the grid's "slide" captions are not used in this deck.
2. **Small numbers:** is the `0.001 = 10⁻³` route right, with `10 × 10⁻⁵ = 10⁻⁴` as the line to rehearse?
3. **Too-small coefficients** (0.9 × 10⁷, the last three of WP): in lesson 1, or lesson 2? I have put them last and marked as a step up.
4. **Worksheet:** the reading of "four questions" above, and the in-parts parts.
5. **Build order (agreed):** the Converting working and fixed-question builder, then the Depth bank spec, then the look card (`npm run deck -- looks`), then the deck, then the worksheet.
