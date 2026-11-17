# Deck plan: Standard form, lesson 1 (why we use it, and converting)

**Status:** plan for review (2026-11-17). Nothing built. Written from the tool's code and `npm run deck -- preflight standard-form`; the sample numbers below are recomputed by `specs/decks/_check/standard-form-converting-check.py` (all pass).
**Deck id:** `standard-form` (proposed) · **Tool:** `standard-form` (`/standard-form`, Converting tab, Levels 1 to 3; dev-gated, `enabled: false`) · **Representation:** the place value shift grid (digits slide a column, the power rolls by 1)

## The lesson (plan, using the lesson-plan template)

**Lesson:** Standard form 1: why we use it, and converting both ways · **Class / year:** assumed Year 9 higher (SoL Y9H Unit 4, Topics 5 to 8 sit after Indices) — *please correct* · **Length:** assumed one 60 minute lesson; the deck is built for about two, with dividers as the pick-up points · **Tool it uses:** Standard Form, Converting

**Objective:** By the end, pupils can say why standard form is used, say whether a number is in standard form, and convert large and small numbers to and from it.

**Starting point:** they have met powers of 10 in Indices (positive, and 10⁻¹ to 10⁻³ as 0.1 to 0.001). Usual errors: the power is the number of zeros; the sign of the power for a small number; a coefficient outside 1 to 10 (92 × 10³); a lost internal zero (2.04 → 2.4).

**Class profile:** *to confirm.* Calculator assumed, used only to see its display. Writing: Harry's usual book work (nine questions, 3 × 3, or 12 in 3 columns). Numbers kept inside the tool's grid (10⁹ down to 10⁻⁶) wherever a fixed question will show the grid working.

**Flow (lesson 1, indicative minutes)**

| Min | What happens | Slide type |
|---|---|---|
| 5 | Starter: powers of 10 as ordinary numbers (10⁴, 10⁷, 10⁻², 10⁻⁵) | Retrieval starter, 2 × 2 |
| 12 | **Why we use it:** count the zeros, spot the mistake, compare; the key definition; "is it in standard form?" | Discussion, definition, sort |
| 20 | **Large numbers, both ways:** the grid, one idea (the power is how far the point moves); worked; whiteboards; fixed sets A and B; generator | Board, whiteboard, fixed set, generator |
| 15 | **Small numbers, both ways:** the same idea, the power goes negative; worked; whiteboards; fixed sets C and D; generator | as above |
| 5 | **Mixed:** you decide which way and what sign; fixed set E; generator | Fixed set, generator |
| 3 | Exit ticket | Exit ticket, one question a row |
| — | **Stretch, numbers in parts** (45 × 10⁵): optional, lesson 2 pick-up | Fixed set, generator (Level 3) |
| — | **Printed worksheet:** the practice volume (see the last section) | Pinned sheet(s) |

## Slide plan

| Section | Slides |
|---|---|
| Opening | Title · Learning objective with three "I can" lines |
| Starter | Powers of 10 as ordinary numbers (4 boxes; a timer) |
| Why we use it | Divider · **Discussion, the zeros test:** show 150 000 000 km (Earth to the Sun) and 0.000007 m (a red blood cell); class write each in words, then the atom challenge, 0.00000000000000000000000000167 kg (the mass of a hydrogen atom): "count the zeros, and tell your partner how sure you are" · same three as 1.5 × 10⁸, 7 × 10⁻⁶, 1.67 × 10⁻²⁷, one per click · **Three reasons** (short to write, hard to miscount, size shown at a glance by the power) and "your calculator uses it when the screen is full" · **Key definition** (formal wording; vocabulary: ordinary number, standard form, power) · **Is it standard form?** (discussion, six cards, below) · Depth ×2 (later, once a bank exists) |
| Large to standard form | Divider · **Board:** 4 700 000 on the grid, digits slide right one click at a time, power rolls 0 to 6, finishing 4.7 × 10⁶ (grid on, then the same with the grid off) · the two rules in words (1: point after the first non-zero digit; 2: count the places it moved) · Whiteboards 56 000 (partly completed), 8 100 000 (count), 270 000 000 (none) · **Fixed set A** (6) · generator |
| Large to ordinary | Divider · **Board:** 6.3 × 10⁵, the digits slide left 5 columns to 630 000 · "n is how far, not how many zeros" · **Fixed set B** (6) · generator (Converting L1, Ask for both) |
| Small to standard form | Divider · **Board:** 0.00058 on the grid, digits slide left, the power rolls 0, −1 … −4 (negative: smaller than 1) · Whiteboards 0.0042 (partly completed), 0.000063 (count), 0.00074 (none) · **Fixed set C** (6) · generator |
| Small to ordinary | **Board:** 1.6 × 10⁻² to 0.016 · **Fixed set D** (6) · generator (Converting L2) |
| Mixed | Divider · **Fixed set E** (6, large and small, both ways, in a shuffled order) · generator (Converting L1 + L2, Ask for both) |
| Stretch (optional) | Divider · discussion "Is 45 × 10⁵ in standard form? Fix it." · **Fixed set P** (5) · generator (Converting L3) |
| End | Exit ticket (3) · Summary (the definition and the two rules) |

Dividers are pick-up points; the slide after a divider where the lesson is likely to restart is a four-question recap (per `docs/design/LESSON_STYLE.md`).

### "Is it standard form?" (discussion cards; each answer is a reason, not just yes or no)

| Card | In standard form? | Why / the fix |
|---|---|---|
| 3.8 × 10⁵ | Yes | 3.8 is between 1 and 10 |
| 38 × 10⁴ | No | 38 is 10 or more: 3.8 × 10⁵ |
| 0.38 × 10⁶ | No | 0.38 is less than 1: 3.8 × 10⁵ |
| 9.99 × 10⁻³ | Yes | 9.99 is below 10; a negative power is fine |
| 10 × 10² | No | 10 is not below 10: 1 × 10³ |
| 380 000 | No | it is an ordinary number |

## The question ladders (Harry to agree before any question is written, per the authoring routine)

One ladder shape for all four sets; **consecutive questions change one thing**. Edge cases are few and last. Calculators are not needed. Authored working uses the tool's own captions and the grid, so it matches the generator (R42).

| Rung | Large (sets A, B) | Small (sets C, D) |
|---|---|---|
| 1 | one significant figure, round (7 000) | one significant figure (0.006) |
| 2 | two figures | two figures |
| 3 | extreme power (six zeros) | extreme power (the grid's 10⁻⁶) |
| 4 | three figures | three figures |
| 5 | internal zero (2.04) | internal zero (3.05) |
| 6 | edge: coefficient is 1 (100 000), or in B, the answer has a decimal point (648.2) | edge: power only −1 (0.82), the "no zeros but still negative" case |

**Traps** (new tags to add to `src/shared/misconceptions.ts`; none for standard form exist yet):

| Tag (proposed) | Wrong method | Caught by |
|---|---|---|
| `sf-count-zeros` | power = the number of zeros, not the places the point moved | A2, A4, A5, C2, C4, C5 (the zeros-count power differs from the right one in each; checked) |
| `sf-small-positive-power` | a small number gets a positive power | every question in C |
| `sf-coefficient-range` | 92 × 10³, 0.92 × 10⁵ | A2, A4 and the "Is it standard form?" cards |
| `sf-lost-internal-zero` | 2.04 → 2.4 | A5, C5, B5 |
| `sf-adds-zeros` | to ordinary: writes the digits then n zeros (4.07 × 10⁷ → 4.07 followed by 7 zeros) | B5, B6 |
| `sf-point-wrong-way` | moves the point the wrong way (big power, small number) | D1 to D5 |

### Sample numbers (all recomputed by an independent route; no (digits, power) pair is used twice)

| Slot | Numbers (ordinary ⇄ standard form) |
|---|---|
| Hook | 150 000 000 = 1.5 × 10⁸ · 0.000007 = 7 × 10⁻⁶ · 0.00000000000000000000000000167 = 1.67 × 10⁻²⁷ |
| Worked | 4 700 000 = 4.7 × 10⁶ · 630 000 = 6.3 × 10⁵ · 0.00058 = 5.8 × 10⁻⁴ · 0.016 = 1.6 × 10⁻² |
| Whiteboards, large | 56 000 = 5.6 × 10⁴ · 8 100 000 = 8.1 × 10⁶ · 270 000 000 = 2.7 × 10⁸ |
| Whiteboards, small | 0.0042 = 4.2 × 10⁻³ · 0.000063 = 6.3 × 10⁻⁵ · 0.00074 = 7.4 × 10⁻⁴ |
| **A** to standard form | 7 000 = 7 × 10³ · 92 000 = 9.2 × 10⁴ · 640 000 000 = 6.4 × 10⁸ · 358 000 = 3.58 × 10⁵ · 2 040 000 = 2.04 × 10⁶ · 100 000 = 1 × 10⁵ |
| **B** to ordinary | 5 × 10⁴ = 50 000 · 3.9 × 10⁶ = 3 900 000 · 7.1 × 10³ = 7 100 · 2.65 × 10⁵ = 265 000 · 4.07 × 10⁷ = 40 700 000 · 6.482 × 10² = 648.2 |
| **C** to standard form | 0.006 = 6 × 10⁻³ · 0.00091 = 9.1 × 10⁻⁴ · 0.000008 = 8 × 10⁻⁶ · 0.0364 = 3.64 × 10⁻² · 0.00305 = 3.05 × 10⁻³ · 0.82 = 8.2 × 10⁻¹ |
| **D** to ordinary | 2 × 10⁻³ = 0.002 · 5.9 × 10⁻² = 0.059 · 8.3 × 10⁻⁵ = 0.000083 · 1.45 × 10⁻³ = 0.00145 · 6.02 × 10⁻⁴ = 0.000602 · 4.7 × 10⁻¹ = 0.47 |
| **E** mixed | 56 700 000 → 5.67 × 10⁷ · 3.1 × 10⁻⁴ → 0.00031 · 0.000046 → 4.6 × 10⁻⁵ · 8.04 × 10⁶ → 8 040 000 · 940 000 → 9.4 × 10⁵ · 0.0705 → 7.05 × 10⁻² |
| Exit ticket | 17 000 000 → 1.7 × 10⁷ · 0.00036 → 3.6 × 10⁻⁴ · 5.2 × 10⁻³ → 0.0052 |
| **P** stretch | 24 × 10⁵ → 2.4 × 10⁶ · 0.7 × 10⁴ → 7 × 10³ · 365 × 10³ → 3.65 × 10⁵ · 0.052 × 10⁻² → 5.2 × 10⁻⁴ · 480 × 10⁻⁵ → 4.8 × 10⁻³ |

**Numbers already used** (worked, hook, discussion, whiteboards, the "Is it standard form?" cards): no question in A to E, the exit ticket or the worksheet may reuse them; the exit ticket uses numbers used nowhere else. Set B6 (648.2) and set A6 are written by hand: the generator's Level 1 does not draw them, so check the grid still fits (B6 is four digits).

## What already exists, and what needs building

| Need | Status |
|---|---|
| Converting tab, Levels 1 to 3, the grid working, Whiteboard / Worked Example / Worksheet | **Yes.** Levels: L1 large, L2 small, L3 "in parts". Ask for both ways; digits 1 to 3; internal zero option |
| Standard Form tool live | **No: `enabled: false`.** Decks link to it; confirm a deck's generator slides work against a dev-gated tool, or take it live (the tool's review is open in `docs/TASKS.md`) |
| The grid as a **slide piece** (a board that slides one column per click, grid on and off) | **To check.** The tool draws it; deck slides have ratio tables and bar models but this is not a listed slide piece. If missing, build it as part of this deck, from `PlaceValueShift.tsx` (the deck checklist's side-task list) |
| **Fixed-question builder** (`Q.standardForm…`) | **None** (preflight). Pull the Converting generator's inner function (digits and power in, question and grid working out) into its own file, then add a `Q.` builder that verifies the answer; pattern `src/tools/Proportion/ratioFromFraction.ts`. Needed for sets A to E and P to carry the grid working |
| **Depth bank** | **None** (preflight), so no Depth cards yet. Write `specs/depth/standard-form.md` from `docs/design/templates/DEPTH_SPEC_TEMPLATE.md`: the "which is in standard form?" choice and the six misconception wrongs above (TASKS already says these belong in Depth, not the generator). Two cards, at the end of "Why" and at the end of "Small" (never three together, R44) |
| Mixed options skewing | Preflight flags Multiplying & Dividing only; not used in this lesson |
| `<Tool>.about.ts` | Exists; no change |

## The printed worksheet (textbook format; to review later, as agreed)

Not planned in detail yet. What follows is a starting point for that review.

- **Why print:** the practice volume is too large for book-work slides; pupils work in books or on the sheet.
- **Textbook shape:** a "Key ideas" box (definition and the two rules); a **Worked example** box per skill (large to standard form, small to standard form, standard form to ordinary); then **lettered exercises** of twelve parts (a to l) climbing the same ladder as the sets above, in 3 columns × 4 rows; an end block of **problem solving and reasoning** (spot the mistake, "Is it standard form? Explain", a short context question); an **answers** page.
- **Likely exercises:** 1 Is it standard form? · 2 Large to standard form · 3 Standard form to large · 4 Small to standard form · 5 Standard form to small · 6 Mixed · 7 In parts (stretch) · 8 Problem solving. About three A4 sides and an answer page.
- **All numbers fresh:** none from the table above, none from the deck's own sets; the same ladder and traps.
- **Open: how it is produced.** The lesson's pinned worksheets (up to three, A4 or A5, hand-written `frozen` sets, an answer sheet) are grids of numbered questions; they have no worked-example box and no lettered parts. Options: (a) up to three pinned A4 sheets using the existing engine, one per stage, lettered parts written into each cell; (b) a new printable in `src/shared/printables.ts` with the textbook layout (a build, and R38 limits printables to blanks pupils fill in, so it needs deciding); (c) a document built outside the deck, linked from the lesson. I recommend settling the layout first on a one-page mock-up, then choosing.

## To settle with Harry

1. **Class, year and length** (assumed above), and the calculator.
2. **The ladders and traps** above: right rungs for this class? Anything to add (for example a "which is bigger, 6 × 10⁻⁴ or 6 × 10⁻⁵?" idea belongs in lesson 2)?
3. **Stretch, numbers in parts:** in lesson 1 as an optional last section, or move to lesson 2 with comparing and the calculations? I lean to lesson 2.
4. **The hook:** are the Sun, blood cell and atom the right examples, or is there a better class story?
5. **Worksheet production** (the open question above), when we get to it.
6. **Build order I propose:** the Converting fixed-question builder, then the Depth bank spec, then the look card (`npm run deck -- looks`), then the deck, then the worksheet.
