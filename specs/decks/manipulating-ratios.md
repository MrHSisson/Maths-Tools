# Deck plan: Manipulating ratios

**Status:** draft review (nothing built). Written 2026-10-30 from a read of the code, not from running every generator.
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

## What needs doing

### A. The tool (Ratio Manipulation)

1. **Ratio to Fraction: a "Fraction of" option** (The total / The other part; both on gives a mixed set), available at Level 1 so the contrast is not hidden behind Level 3. Peer options in one pool (R19).
2. **Wording that carries the clue.** Every question names what the fraction is of ("…as a fraction of the total" / "…as a fraction of the blue"). Today's implicit wording is kept only as a harder wording, so the emphasis lesson and the generators agree. Likely a "Wording" option (Stated / Implied).
3. **Fraction to Ratio: "Fraction given as"** (of the total / of the other part), so $\frac23$ of the blue gives $2 : 3$ and mixed sets are possible.
4. **A bar model (boxes) working step.** The working today is text and ratio tables; the boxes the lesson uses (a box per part, a brace for the total) exist only inside Ratio Sharing's own code. Needs a shared bar-model working step (a core representation, R27) used by both fraction tabs, so a pupil sees "total = $a + b$ boxes" against "the other part = $b$ boxes".
5. A Depth bank for the tool (language misconceptions: "of the total" read as "of the other", adding or not adding the parts, order of the ratio).
6. After any generator change: recalibrate (R25), smoke tests, `npm run facts`, `.about.ts` words for the new options (R11).

### B. Decks (the part most likely to bite)

1. **Generator slides do not show ratio-table working.** The deck's generator slide draws a working step as text, maths or the rounding digits; a ratio-table step has no maths, so it shows only its caption (to be confirmed first thing when building). Fix: draw ratio-table (and later bar-model) steps in the generator and book working.
2. **Fixed question sets cannot hold a ratio table.** Authored working is lines of text and maths. To match the tool's working (R42) a fixed set needs either a structured table step on `CuratedQuestion`, or builders that take the table from the tool's own working. This is a data-model change (`api/_questions.ts` validation, sharing, export).
3. **Ratio table and bar model as slide elements, with a blank state.** Already the next step in `docs/pathways/decks.md` ("the core representations as slide elements, each with a blank state (ratio table first)"). Without them the modelling slides are tiles and boards drawn by hand, which loses the $\div$ arrows.
4. **Book activities.** The new standard (12 in 3 columns) fits short questions (simplify, $1 : n$). The fraction questions are two lines of words; at three columns they will be cramped. Either 8 in 2 columns for those, or shorter wording.
5. Builder helpers for the deck (`Q.simplify`, `Q.ratioFraction`, …) and a plan of slide numbers, written once A and B are settled.

## Recommended order

1. Settle the tool changes (A1 to A3) in a short tool spec, then build them (small, self-contained).
2. Build the bar model working step (A4) and the deck renderer fix (B1), since both lessons and tool pages use them.
3. Decide how fixed sets hold a ratio table (B2) and build the ratio table and bar model slide elements (B3).
4. Depth bank (A5).
5. Then build the deck itself (this file becomes the slide plan).

## Questions for Harry

1. **Year group and length:** one lesson or two? Is the "what is a ratio" opening a recap or genuinely new?
2. **Level 3 part-to-part:** keep it as the harder level, with the new option letting Level 1 mix both, or move it down entirely?
3. **Ratio from a fraction:** do you want "red is $\frac23$ of blue" (part to part) as well as "$\frac25$ are red" (of the total)?
4. **Bar model:** happy for me to build it as a shared working picture (used on the tool pages and the deck), rather than only drawing it by hand on slides?
5. **Fixed questions with a ratio table in the working:** shown on the slide as a real table (needs the data-model change), or is text working enough for the authored sets, with the table only on the generator slides?
