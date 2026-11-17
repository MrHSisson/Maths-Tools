# Deck plan: Standard form, lesson 1 (why we use it, and converting)

**Status:** plan, revised 2026-11-17 (second round with Harry). Nothing built. Every number below is recomputed by `specs/decks/_check/standard-form-converting-check.py` (115 questions and 14 worked or hook numbers; all correct, none repeated, none used on a slide and also asked).
**Deck id:** `standard-form` (proposed) · **Tool:** `standard-form` (`/standard-form`, Converting tab, Levels 1 to 3; dev-gated)

## Decided with Harry

- **50 minutes, no starter** (Harry gives his own). One worksheet at the end: four questions (large to standard form, large to ordinary, small to standard form, small to ordinary), a to l each, textbook format.
- **The pupils have just done the laws of indices**, so the method uses them: `10 × 10 = 10²`, `10 × 10² = 10³`, and for small numbers `1/10² = 10⁻²` and `10 × 10⁻⁵ = 10⁻⁴`.
- **Large numbers** (Harry's route): `2 000 = 2 × 1 000`, `1 000 = 10³`. Then the chain, `32 000 = 3 200 × 10 = 320 × 10 × 10`, `10 × 10 = 10²`, `320 × 10² = 32 × 10³ = 3.2 × 10⁴`.
- **Small numbers** (Harry's route, via a division and the index law): `0.02 = 2 ÷ 100 = 2 × 1/100 = 2 × 1/10² = 2 × 10⁻²`.
- **The small-number parts need a lot of effort**, so they get their own build-up, not a copy of the large section (below).
- **An abundance of authored questions** (below).
- **Numbers in parts are not an extension at the end.** They are part of writing a number in standard form: `320 × 10²` and `32 × 10³` are lines of the chain, and `58 × 10⁻⁵` is a line of the small chain. They are taught and practised inside the large section and inside the small section.
- **Words:** the deck never says "move the decimal point" (and no arrow crosses the digits). Sliding a digit one column in a place value grid is a different idea (each column is worth ten times more or less) and is not banned; whether to show the grid is a question below.

## The lesson

**Class:** Year 9 higher (assumed) · **Starting point:** laws of indices, just taught; powers of 10 as ordinary numbers. Usual errors: the power is the number of zeros; a small number gets a positive power; `1/10²` read as `10²`; a coefficient outside 1 to 10; a lost internal zero.

| Min | What happens | Slide type |
|---|---|---|
| 6 | **Why we use it:** the zeros test, three reasons, the definition, four "is it standard form?" cards | Discussion, definition |
| 14 | **Large to standard form:** the method, whiteboards, then numbers in parts for large numbers | Model, whiteboards |
| 6 | **Large from standard form:** the chain read the other way, whiteboards | Model, whiteboards |
| 14 | **Small to standard form:** a recap of the index laws, then a build-up of four models, whiteboards | Model, whiteboards |
| 6 | **Small from standard form** and numbers in parts for small numbers | Model, whiteboards |
| 4 | **Worksheet** handed out; finished at the start of the next lesson or at home | Printed sheet |

**Honest note on time:** with this much on small numbers and a large bank, 50 minutes reaches about the end of "Small from standard form"; the dividers are pick-up points, so the mixed run and the worksheet can open the next lesson. I would rather plan that than rush the small numbers.

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

## Slide plan

| Section | Slides |
|---|---|
| Opening | Title · Learning objective with three "I can" lines |
| Why we use it | Divider · **the zeros test:** 150 000 000 km (Earth to the Sun) and 0.000007 m (a red blood cell) said aloud, then 0.00000000000000000000000000167 kg (a hydrogen atom): "count the zeros, and say how sure you are" · the same three as 1.5 × 10⁸, 7 × 10⁻⁶, 1.67 × 10⁻²⁷ · **three reasons** (short to write, hard to miscount, the power shows the size; "your calculator switches to it when the screen is full") · **key definition** (formal wording; ordinary number, standard form, power) · **is it standard form?**: `3.8 × 10⁵` yes (3.8 is between 1 and 10) · `38 × 10⁴` no (38 is 10 or more) · `0.38 × 10⁶` no (0.38 is less than 1) · `9.99 × 10⁻³` yes (a negative power is fine) |
| Large to standard form | Divider · stage 1 (2 000) · the chain for 32 000, one line per click · which lines are standard form and which are not · WL 1 to 10 · divider (four-question recap) · numbers in parts: "Is 25 × 10⁶ standard form? Fix it." · WPL 1 to 8 |
| Large from standard form | The chain reversed · WF 1 to 9 |
| Small to standard form | Divider · four retrieval questions · models 1 to 4 (one per slide, one line per click) · WS 1 to 12 |
| Small from standard form | The two reversed models · WT 1 to 10 · numbers in parts, small: worked `0.8 × 10³`, then WPS 1 to 8 |
| Mixed (next lesson, or if time) | Divider · WM 1 to 10 · generator slides (Converting L1, L2, L3) |
| End | Worksheet slide (instruction only, no title; answers on a click) · Summary |

## The whiteboard bank (67 questions, all authored)

Whiteboards are full width and centred, one question each, with help that climbs inside a run: the working started (the first lines of the chain given), a small grey hint ("how many tens?" or "÷ by what?"), then none; the last in a run has none. The working shown is the chain. **Authored questions have no levels.** Each pair of coefficient digits and power is used once across the whiteboards and worksheet, and no worked number is asked.

| Run | Numbers (ordinary ⇄ standard form, or "in parts" → standard form) |
|---|---|
| Worked | 2 000 = 2 × 10³ · 32 000 = 3.2 × 10⁴ · 0.02 = 2 × 10⁻² · 0.35 = 3.5 × 10⁻¹ · 0.00058 = 5.8 × 10⁻⁴ · 1.6 × 10⁻² = 0.016 · 3.7 × 10⁻³ = 0.0037 · 0.8 × 10³ → 8 × 10² |
| **WL** large to standard (10) | 60 000 = 6 × 10⁴ · 5 000 000 = 5 × 10⁶ · 45 000 = 4.5 × 10⁴ · 380 000 = 3.8 × 10⁵ · 7 200 000 = 7.2 × 10⁶ · 91 000 000 = 9.1 × 10⁷ · 536 000 = 5.36 × 10⁵ · 2 840 000 = 2.84 × 10⁶ · 4 070 000 = 4.07 × 10⁶ (internal zero) · 100 000 000 = 1 × 10⁸ (coefficient 1) |
| **WPL** in parts, large (8) | 40 × 10³ → 4 × 10⁴ · 15 × 10⁴ → 1.5 × 10⁵ · 62 × 10⁷ → 6.2 × 10⁸ · 240 × 10² → 2.4 × 10⁴ · 900 × 10⁵ → 9 × 10⁷ · 735 × 10³ → 7.35 × 10⁵ · 1 600 × 10⁴ → 1.6 × 10⁷ · 4 080 × 10² → 4.08 × 10⁵ |
| **WF** large to ordinary (9) | 7 × 10⁵ = 700 000 · 4 × 10⁷ = 40 000 000 · 3.5 × 10³ = 3 500 · 6.2 × 10⁵ = 620 000 · 8.9 × 10⁷ = 89 000 000 · 1.46 × 10⁴ = 14 600 · 5.08 × 10⁶ = 5 080 000 (internal zero) · 9.317 × 10⁵ = 931 700 · 6.482 × 10² = 648.2 (a decimal answer) |
| **WS** small to standard (12) | 0.7 = 7 × 10⁻¹ · 0.09 = 9 × 10⁻² · 0.0004 = 4 × 10⁻⁴ · 0.38 = 3.8 × 10⁻¹ · 0.0062 = 6.2 × 10⁻³ · 0.00083 = 8.3 × 10⁻⁴ · 0.000071 = 7.1 × 10⁻⁵ · 0.0258 = 2.58 × 10⁻² · 0.000419 = 4.19 × 10⁻⁴ · 0.00306 = 3.06 × 10⁻³ (internal zero) · 0.0000052 = 5.2 × 10⁻⁶ · 0.1 = 1 × 10⁻¹ (coefficient 1) |
| **WT** small to ordinary (10) | 3 × 10⁻² = 0.03 · 8 × 10⁻⁴ = 0.0008 · 2.5 × 10⁻³ = 0.0025 · 6.1 × 10⁻² = 0.061 · 9.4 × 10⁻⁴ = 0.00094 · 1.7 × 10⁻⁵ = 0.000017 · 4.36 × 10⁻³ = 0.00436 · 7.05 × 10⁻⁴ = 0.000705 (internal zero) · 5.9 × 10⁻¹ = 0.59 · 2.08 × 10⁻² = 0.0208 |
| **WPS** in parts, small (8) | 70 × 10⁻⁴ → 7 × 10⁻³ · 74 × 10⁻⁴ → 7.4 × 10⁻³ · 390 × 10⁻⁶ → 3.9 × 10⁻⁴ · 125 × 10⁻⁴ → 1.25 × 10⁻² · 0.6 × 10⁻³ → 6 × 10⁻⁴ (too small) · 0.9 × 10⁷ → 9 × 10⁶ · 0.38 × 10⁸ → 3.8 × 10⁷ · 0.047 × 10⁻² → 4.7 × 10⁻⁴ |
| **WM** mixed (10) | 28 000 000 → 2.8 × 10⁷ · 0.000046 → 4.6 × 10⁻⁵ · 3.3 × 10⁶ → 3 300 000 · 8.1 × 10⁻³ → 0.0081 · 0.0705 → 7.05 × 10⁻² · 640 000 → 6.4 × 10⁵ · 5.72 × 10⁴ → 57 200 · 0.0000093 → 9.3 × 10⁻⁶ · 4.9 × 10⁻² → 0.049 · 710 000 000 → 7.1 × 10⁸ |

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

## The worksheet (one, at the end; textbook format)

Four numbered questions, each a to l in three columns of four, climbing the same ladder; **no numbers in parts** on the sheet (they are practised in each section, and appear as lines of the pupils' own working):

| Q | Asks | Ends on |
|---|---|---|
| 1 | Write in standard form (large) | 1 000 000 (coefficient 1), then 1 280 000, 90 700 000, 6 150 000 |
| 2 | Write as an ordinary number (large) | 3.274 × 10⁵, 6.005 × 10⁴, 9.18 × 10² |
| 3 | Write in standard form (small) | 0.3 (power −1), then 0.00725, 0.0000604, 0.0013 |
| 4 | Write as an ordinary number (small) | 5.381 × 10⁻², 1.002 × 10⁻³, 7.7 × 10⁻⁷ |

All 48 numbers are in the checked file; none appears on a slide. Pupils answer in their books; an answers page, and the slide shows the answers on a click. Possible textbook extras: a "Key ideas" box (the definition and the chain) and a worked example for each question.

**Open: how a textbook layout is produced.** Pinned worksheets (up to three, A4 or A5, hand-written `frozen` sets, an answer sheet) are numbered grids; they have no lettered parts. Options: (a) one pinned A4 sheet with four cells, the lettered parts written into each; (b) a new printable in `src/shared/printables.ts` with the textbook layout (R38 limits printables to blanks pupils fill in, so it needs a decision); (c) a document built outside the deck and linked from it. A one-page mock-up of (a) is the first step when we reach it.

## What already exists, and what needs building

| Need | Status |
|---|---|
| Converting tab, Levels 1 to 3 (large, small, in parts), Whiteboard / Worked Example / Worksheet | **Yes**, with a place value grid as its working. The grid is a sound picture (a column is worth ten times more or less) and stays |
| **Working in the chain method**, for the tool and for the authored questions | **To build.** Lines as ordinary `mStep` lines (peel a ten, combine the tens, finish the coefficient; for small numbers the division, the `1/10ⁿ` step and the index law). The number and answer the generator draws do not change (R5) |
| Fixed-question builder (`Q.…`) | **None** (preflight). Because the working is plain lines it is small: take the Converting generator's inner function into its own file (pattern `src/tools/Proportion/ratioFromFraction.ts`) and add a `Q.` builder that verifies the answer |
| Depth bank | **None.** Write `specs/depth/standard-form.md` (`docs/design/templates/DEPTH_SPEC_TEMPLATE.md`) once the deck is agreed: "which is in standard form?" and the eight wrongs above |
| The tool is dev-gated | Confirm generator slides work against it, or take it live |
| `<Tool>.about.ts` | Needs a line for the new method (R11) |

## To settle with Harry

1. **The tool's working.** You said sliding a column is not moving the point, so I will not remove the grid. Recommendation: add a **Method** option on Converting (a display-only dropdown, R24), "Powers of 10" and "Place value grid", with the default your choice. The deck's authored working uses the chain either way. Should the grid also appear on the deck's model slides as a second view, or not at all in the deck?
2. **Small numbers, model 3:** `0.00058 = 58 ÷ 100 000`: is the line "58 is 5.8 × 10, which takes one off the power" the right place to rehearse the sign, or should that model be built from a smaller number first (0.0058 = 58 × 10⁻⁴)?
3. **Bank size:** 67 whiteboards plus the 48 on the worksheet. Right amount, or more for small numbers? The small runs (WS 12, WT 10, WPS 8) are the biggest.
4. **Time:** are you happy with the lesson ending after "Small from standard form" and the worksheet and mixed run opening lesson 2?
5. **Build order (agreed):** the Converting working and fixed-question builder, then the Depth bank spec, then the look card (`npm run deck -- looks`), then the deck, then the worksheet.
