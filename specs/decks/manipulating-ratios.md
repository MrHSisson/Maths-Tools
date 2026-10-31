# Deck plan: Manipulating ratios

**Status:** draft. Ratio table and bar model slide pieces are built (2026-10-30); the tool changes and the deck are not. Written from a read of the code, not from running every generator.
**Deck id:** `manipulating-ratios` · **Tool:** `ratio-manipulation` (`/ratio-manipulation`) · **Representations:** ratio table and boxes (the bar model)

## The lesson

| # | Section | What happens |
|---|---|---|
| 1 | What is a ratio? | Comparing parts, order matters, writing $a : b$ from counts, boxes for each part |
| 2 | Simplifying | Equivalent ratios, divide every part by a common factor (ratio table with the $\div$ arrows) |
| 3 | $1 : n$ and $n : 1$ | Divide by the part you want to become 1; $n$ can be a decimal |
| 4 | A fraction of the total | $a : b$ gives $\frac{a}{a+b}$; the words "of the total", "of all" |
| 5 | A fraction of the other part | $a : b$ gives $\frac{a}{b}$; the words "as a fraction of the …", "compared with" |
| 6 | Both, mixed | Read the wording and decide which; Depth on the language |
| 7 | A ratio from a fraction | $\frac25$ are red, the rest blue, so $2 : 3$; and "red is $\frac23$ of blue", so $2 : 3$ |

## What already exists (Ratio Manipulation, five tabs)

| Need | Tab | Covered? |
|---|---|---|
| Write a ratio from counts | Forming Ratios L1 | Yes |
| Simplify; $1 : n$; $n : 1$ | Simplifying (Question Types, Ask for: Simplest Form / 1 : n / n : 1) | **Yes**, with ratio-table working. $1 : n$ only asks for $n$ that terminates (2.5, 1.5…). Level 3 three-part always asks simplest form |
| $a$ as a fraction of the total | Ratio to Fraction L1 (two parts), L2 (three parts, single or combined) | Yes, but the question never says "of the total" in two of its three wordings ("What fraction of the beads are blue?") |
| $a$ as a fraction of the other part | Ratio to Fraction L3 | Yes, but **only at Level 3 and only on its own**: it cannot be mixed with the total questions in one set |
| A ratio from a fraction | Fraction to Ratio L1 to L3 | Only "fraction **of the total**" ("$\frac23$ are red and the rest blue"). No "red is $\frac23$ of blue" |
| Depth, lessons, Teach | none for this tool | Nothing |

## Decided with Harry (2026-10-30)

- The deck is **one continuous lesson that will take more than one lesson**: sections with dividers at the pick-up points (the house style), no fixed timings.
- "Find the fraction of beads that are blue" is fine as it is: it implies the total. Care is needed only around part-to-part ($\frac ab$), which must always name the other part ("as a fraction of the blue"). So **no Wording option**: A2 below is dropped.
- **Opening (year group: they have seen ratio before):** a brief recap of the format and why we use it, with a baking example: one egg for every 300 g of flour, so we would not use 101 eggs for 400 g. Order matters and the numbers describe parts in step.
- **Ratio from a fraction covers both kinds:** "$\frac25$ are red and the rest blue" (of the total) and "red is $\frac23$ of blue" (of the other part), so Fraction to Ratio gets the same two-way option as Ratio to Fraction.
- **Fixed questions use a ratio table in their working** (as the tool does), so the data model must let authored working carry a ratio-table step, and generator slides must draw one (B1, B2 below).
- Boxes (the bar model) are welcome if they fit; see "Do boxes fit?". Ratio tables and bar models must be usable on slides: **built** (see B3).

## Do boxes fit?

Yes for the fraction work, less so elsewhere:

- **Total versus other part** is exactly what boxes show: with $3 : 2$ drawn as five boxes, "of the total" is 3 out of **all** the boxes (a brace over the whole bar), "of the other part" is 3 boxes **compared with** the 2 boxes of the other colour (two braces side by side). The contrast the lesson is about becomes visible.
- **A ratio from a fraction** ($\frac25$ are red) is the same picture read backwards: five boxes, two shaded, so $2 : 3$.
- The site already draws boxes for ratio (Ratio Sharing), so pupils meet the same picture.
- **Simplifying, $1 : n$, $n : 1$** fit the ratio table better (the $\div$ arrows), not boxes.
- Limit: a ratio such as $12 : 9$ would be 21 boxes. The bar allows up to 24 boxes; in practice draw the simplified ratio ($4 : 3$) or small numbers.

## The ratio look, scaffold, and working without the diagrams (Harry, 2026-10-31)

- **Look:** ratio bar models use Ratio Sharing's stacked layout (a row per quantity, white boxes with a navy border, values in boxes, "= total", purple extra boxes), not one coloured bar. The slide bar model now has that look as its default (the single coloured bar stays for fractions).
- **Scaffold, then fade.** Ratio Sharing shows the bar at Levels 1 and 2, drops it at Level 3, and has a **Numerical method** switch (Method tab, display only) for the same questions without it. Ratio Manipulation's fraction tabs should work the same way: a bar-model working step as the scaffold at Levels 1 and 2, none at Level 3, and the same switch, so the same question can be worked with or without the picture. The deck follows suit: model with the bar (built up by click), then the same idea as a ratio-table or numbers-only method, then questions with no diagram.
- **Ratio tables** are less of an issue (the table is the method). Four-step tables are now laid out at full size from the start (done).
- Ratio Sharing keeps its own bar drawing for now; moving it onto the shared picture is a later tidy so the two cannot drift.

## Does a "Fraction of" option fit across the levels?

Today part-to-part is Level 3 only because it is the hardest idea in the tab, so putting it at Level 1 leaves Level 3 with nothing harder. A ladder that keeps a scale:

| Level | Parts | Fraction of | Notes |
|---|---|---|---|
| 1 | two | the total, or the other part (option; both on = mixed) | part-to-part with the first part the smaller, so the fraction is proper |
| 2 | three | one part or two parts together, of the total; or one part of another single part (option; mixed) | the existing composite questions stay |
| 3 | two or three | the total, the other part, or **the rest** (the other parts together); reversed order, so improper fractions such as $\frac43$ | "the rest" is the new hardest wording |

This needs the ladder's rungs checked against the calibration (R25, R26) when built. The lighter alternative is to leave the levels alone and mix the two kinds only in fixed question sets (no tool change); general practice would then be total (Level 1) and part-to-part (Level 3) on separate slides, not mixed.

## What needs doing

### A. The tool (Ratio Manipulation)

1. **Ratio to Fraction: a "Fraction of" option** (The total / The other part; both on gives a mixed set), available at Level 1 so the contrast is not hidden behind Level 3. Peer options in one pool (R19).
2. ~~Wording option~~ (dropped, see Decided). Instead check that every part-to-part question names the other part, and that no total question can be read as part-to-part.
3. **Fraction to Ratio: "Fraction given as"** (of the total / of the other part), so $\frac23$ of the blue gives $2 : 3$ and mixed sets are possible.
4. **A bar model (boxes) working step, as the scaffold.** The working today is text and ratio tables; the boxes exist only inside Ratio Sharing's own code. Use the shared bar model (ratio look, now built) as a working step on both fraction tabs at Levels 1 and 2, with a Numerical method switch and no bar at Level 3, as Ratio Sharing does, so a pupil sees "total = $a + b$ boxes" against "the other part = $b$ boxes" and then learns to do it without.
5. A Depth bank for the tool (language misconceptions: "of the total" read as "of the other", adding or not adding the parts, order of the ratio).
6. After any generator change: recalibrate (R25), smoke tests, `npm run facts`, `.about.ts` words for the new options (R11).

### B. Decks (the part most likely to bite)

1. **Generator slides do not show ratio-table working.** The deck's generator slide draws a working step as text, maths or the rounding digits; a ratio-table step has no maths, so it shows only its caption (to be confirmed first thing when building). Fix: draw ratio-table (and later bar-model) steps in the generator and book working.
2. **Fixed question sets cannot hold a ratio table.** Authored working is lines of text and maths. To match the tool's working (R42) a fixed set needs either a structured table step on `CuratedQuestion`, or builders that take the table from the tool's own working. This is a data-model change (`api/_questions.ts` validation, sharing, export).
3. ~~Ratio table and bar model as slide elements~~ **Built 2026-10-30**: Insert menu and Add slide, Filled in / Structure only / Blank (B), click-by-click building, editor panels, checks. The bar model is a shared picture (`src/shared/barModel.ts`) for the tools to reuse.
4. **Book activities.** The new standard (12 in 3 columns) fits short questions (simplify, $1 : n$). The fraction questions are two lines of words; at three columns they will be cramped. Either 8 in 2 columns for those, or shorter wording.
5. Builder helpers for the deck (`Q.simplify`, `Q.ratioFraction`, …) and a plan of slide numbers, written once A and B are settled.

## Recommended order

1. Settle the tool changes (A1 to A3) in a short tool spec, then build them (small, self-contained).
2. Build the bar model working step (A4) and the deck renderer fix (B1), since both lessons and tool pages use them. (The slide pieces, B3, are done.)
3. Decide how fixed sets hold a ratio table (B2).
4. Depth bank (A5).
5. Then build the deck itself (this file becomes the slide plan).

## Still to settle

1. **The level ladder.** Harry's structure (2026-10-31): **Level 1 of the total, Level 2 of a part, Level 3 a mixture**, so each lesson stage is a level. The brief is `specs/ratio-manipulation-fraction-of.md`; it replaces the earlier sketches above (the "Fraction of" option by level, and the three-row ladder). Open: re-level the tab in place, or add a new tab so nothing existing changes.
