# Tool Spec: Ratio Manipulation — Combining Ratios (new tab)

**Status:** draft <!-- Open questions in section 7 must be answered before this is marked `ready`. -->

A delta to `specs/ratio-manipulation.md`: it adds one sub-tool (a sixth tab) to the existing Ratio Manipulation tool. Nothing else about the tool changes.

**Why it exists:** the lesson comes first (`specs/decks/combining-ratios.md`). A deck's practice slides use the tool's own generator, fixed-question builder (`Q.ratioCombine`) and Depth bank (`docs/design/DECK_BUILD_CHECKLIST.md`, "The process"), so the deck needs this tab. The tab is also useful on its own as a Whiteboard / Worked Example / Worksheet.

---

## 1. Overview

| Field | Value |
|---|---|
| Tool name | Ratio Manipulation (existing; `ratio-manipulation`, `/ratio-manipulation`) |
| New sub-tool | `combiningRatios` · tab label **Combining Ratios** |
| Placement | After Equivalent Ratios (it needs scaling) and before Fraction to Ratio. `toolTabRows` goes from `[3, 2]` to `[3, 3]`. |
| Kind | worded (the ratios sit on lines of their own, like Ratio to Fraction) |
| Defaults | standard |

**Pedagogical intent:** given A : B and B : C, a student can write A : B : C by making the shared part (B) the same number in both ratios, then joining them. Levels follow the order the lesson teaches it: nothing to scale, scale one ratio, scale both. A student who reaches Level 3 knows *why* the shared part is the link, not a memorised "multiply by the other one". Using the combined ratio (sharing a total, finding an amount) is **out of scope for now**.

---

## 2. Sub-tool

| Key | Tab label | Kind | Instruction line |
|---|---|---|---|
| `combiningRatios` | Combining Ratios | worded | — |

Question layout (the ratios on lines of their own, then the ask):

```
A : B = 5 : 2
B : C = 4 : 5
Write A : B : C.
```

With a context: `red : blue = 5 : 2`, `blue : green = 4 : 5`, "Write red : blue : green." Three ratios add a third line and a fourth letter or colour.

---

## 3. Sub-tool detail

### 3.1 Question options (QO)

- **multiSelect** `ratios` — "Ratios" (`exclusive: true`): `two` — "Two" — defaultActive: true · `three` — "Three" — false.
- **multiSelect** `wording` — "Wording" (`balanced: true`; one drawn per question): `letters` — "Letters" — defaultActive: true · `context` — "Context" — false.
- **multiSelect** `askOrder` — "Answer Order" (`exclusive: true`): `inOrder` — "In Order" (`A : B : C`) — defaultActive: true · `different` — "Different Order" (e.g. `B : C : A`, `C : A : B`; never the natural order).
- **multiSelect** `givenAs` — "Ratios Given" (`exclusive: true`): `inOrder` — "In Order" (each ratio written in letter order: `A : B` and `B : C`) — defaultActive: true · `mixed` — "Either Way Round" (a ratio may be written the other way, `B : A`; the shared letter may be first in both, `B : A` and `B : C`, last in both, `A : C` and `B : C`, or one of each). The student always finds the shared part as **the letter in both ratios**, never by its position.
- All four groups are independent of level (the level sets how much scaling is needed; these set how many ratios, how they are worded, which order the answer is asked in and how the givens are written), so no per-level differences. Each changes the question, so none is `displayOnly`. "Different Order" and "Either Way Round" are off by default in the tool, so a teacher can ask plain questions; **the deck's sets switch both on from the first set** (order is practised alongside scaling, never taught as its own section: `specs/decks/combining-ratios.md`).
- **Order never changes the scaling.** The combined ratio is worked out as `A : B : C` in the table whatever is asked; "Different Order" only changes how the answer is read off, and "Either Way Round" only changes how the givens are written. So each level's scaling constraints (3.2) hold unchanged under either option.
- **Phase 2 (not in the first build):** `shape` — "Three ratios" — `chain` (A : B, B : C, C : D) · `star` (A : B, B : C, B : D); `method` — "Method" (`displayOnly`, `workedExampleOnly`): "Ratio Table" · "Multiples of B".

The first build's three-ratio shape is the **chain** only. The star is in the extension notes (section 6).

### 3.2 Levels

The shared part is always the second term of one ratio and the first of the next (B between A : B and B : C; C between B : C and C : D). Both given ratios are in simplest form. Scaling to the lowest common multiple always leaves the **combined ratio in simplest form** (a common prime of all parts would have to divide a given ratio's own two parts, which simplest form forbids), so no simplifying step is ever shown.

**Level 1 — just combining (nothing to scale)**
- Parameters: shared part `s` 1–12; the other part of each ratio 1–12, different from `s` and coprime to it (simplest form). Two ratios: `A : B = a : s`, `B : C = s : c`. Three ratios (chain): `A : B = a : s`, `B : C = s : t`, `C : D = t : d`, with `s ≠ t`.
- Constraints: every linking part already matches, so the answer is the ratios joined. The linking part is never 1 in a three-ratio question (it is allowed at two ratios).
- Exclusions: a given ratio not in simplest form; a repeated pair of ratios in the same worksheet.
- Misconceptions targeted: repeating the shared part (`5 : 2 : 2 : 9`); joining in the wrong order; writing the two ratios side by side.

**Level 2 — scale one ratio**
- Parameters: the two linking parts are `s` and `s·k`, `s` 1–6, `k` 2–5, `s·k` ≤ 24. The larger can sit in either ratio (the student must spot which to scale). Other parts 1–12, coprime to their own linking part. Three ratios: exactly one of the three given ratios is scaled and the other linking parts already match (an end ratio, e.g. `C : D`, or the first, `A : B`).
- Constraints: exactly one given ratio is scaled, by `k`; the answer's numbers are whole.
- Exclusions: equal linking parts (Level 1); `k = 1`; both ratios needing scaling.
- Misconceptions targeted: scaling nothing and joining (`5 : 2 : 4 : 5`); **adding** the gap instead of multiplying (`2 → 4` read as `+ 2`, so `7 : 4 : 5`); scaling the wrong ratio; scaling only B and forgetting A (`5 : 4 : 5`). Numbers are chosen so each gives a visibly different answer.

**Level 3 — scale both ("multiply all")**
- Parameters: two ratios whose linking parts `p` (in A : B) and `q` (in B : C) are 2–9 and **coprime**, neither a multiple of the other; the combined B is `p·q` (at most 72). Other parts 1–12, coprime to their own linking part. Three ratios: at least two given ratios need scaling (a chain of two links to make equal; the second link is worked from the first link's result).
- Constraints: both ratios scaled; the combined linking part is the product (equal to the LCM because the parts are coprime).
- Exclusions: a linking part of 1; equal parts; parts that share a factor (see open question 2).
- Misconceptions targeted: scaling both ratios by the same number; scaling each ratio by *its own* linking part (`2 : 5 → × 5`, `3 : 4 → × 3`, giving B = 25 and B = 12, which do not match); stopping once one B matches without checking the other; in a chain, scaling the first two and forgetting the third.

### 3.2b Picture spec — the ratio table, three columns wide (all levels)

- **What's drawn:** the shared ratio table (`src/shared/ratioTable.ts`, `rStepBuild`; core representation "ratio table"), headed **A**, **B**, **C** (a context uses the names, e.g. red / blue / green; three ratios add column **D**), built a row per step, with scaling arrows. One continuous bordered table, as `docs/reference/pictures.md` describes.
- **Row order (decided with Harry):** the **given ratios are the first rows**, then the **scaled rows**, then the answer.

  Level 2 (`A : B = 5 : 2`, `B : C = 4 : 5`):

  | A | B | C | |
  |---|---|---|---|
  | 5 | 2 | | given A : B |
  | | 4 | 5 | given B : C |
  | 10 | 4 | | A : B scaled: arrow `× 2` from row 1 |
  | **10** | **4** | **5** | the answer row, shown last |

  Level 3 (`A : B = 2 : 5`, `B : C = 3 : 4`): given A : B, given B : C, A : B scaled (`× 3`, `6 : 15`), B : C scaled (`× 5`, `15 : 20`), answer `6 : 15 : 20`. The two B cells in the scaled rows highlight when they match. Level 1: just the given rows and the answer row.
- **Columns do not move.** The table's columns stay `A | B | C` (or the context's names in the order the question first names them), whatever order the answer is asked in or the givens are written in. A given written `B : A = 2 : 5` goes into the row as `A = 5`, `B = 2`: **the headers do the flipping**, which is exactly what the table is for. A given with the shared part last in both (`A : C`, `B : C`) puts the matching column on C.
- **"Different Order" is an explicit last step:** after the answer row `6 | 15 | 20`, one more line reads it off in the order asked, `B : C : A = 15 : 20 : 6`, with each value shown under its letter. This is where the usual error happens (reordering the numbers but not the letters), so it is its own step rather than a rearranged table.
- **Blank cells:** a given or scaled ratio has blank cells for the parts it does not mention; only the answer row fills every cell.
- **Scaling arrows:** whole-number `×n` only. Each arrow runs from a given row to **its own scaled row, skipping the rows between** (row 1 → row 3, row 2 → row 4). The first ratio's arrow is in the left gutter and the second's in the right (the component already has per-arrow sides), so they never cross.
- **Shared-code change needed (the first chunk, on its own):** the component draws each arrow between *consecutive* rows (`operations[i]` joins row `i` and `i + 1`). This needs an arrow from any row to any later row: an optional `from` / `to` row on each operation (defaulting to consecutive, so every existing tool is unchanged), a test, the documented `rStep` / `rStepBuild` option, a note in `docs/reference/pictures.md`, and `npm run smoke:shell`. **The deck's `ratioTable` element needs the same option** (`decks.md` documents it as "one factor between each pair of rows"), so it is one change in two places; it must be on `main` before a deck that uses it is pushed (`AGENTS.md`, "Deck data format").
- **Check before building (do not assume):** (1) an empty cell draws without a "?" or a stray border outside a board's Structure-only mode; (2) `rStepBuild`'s captions read naturally ("Multiply every part by 3" already exists for three or more columns); (3) three columns, and four for three ratios, fit the phone width at the standard size.
- **Print:** the worksheet shows the question only; the answers page shows `A : B : C` as the other tabs write ratios.

### 3.3 Worked example script

Level 2, question: `A : B = 5 : 2`, `B : C = 4 : 5`. Write A : B : C.

1. `tStep("B is in both ratios: 2 in the first, 4 in the second. It must be the same number in both.")`
2. `rStepBuild("Write both ratios", ["A","B","C"], …)`: rows 1–2 appear together.
3. The scaled row `10 : 4` appears with the arrow `× 2` from row 1 ("2 × 2 = 4, so multiply every part by 2"); the second ratio already has B = 4.
4. `mStep("Now B is 4 in both, so join them:", "A : B : C = 10 : 4 : 5")`.
5. `mStep("Answer:", "10 : 4 : 5")`.

With "Different Order" (question: ask for `B : C : A`) one step is added before the answer: `mStep("Write them in the order asked:", "B : C : A = 15 : 20 : 6")`. With "Either Way Round" a step is added first, naming the shared letter ("B is in both ratios") and putting each given into its row under the right letter (`B : A = 2 : 5` becomes `A = 5`, `B = 2`).

Level 1: steps 2 and 4–5 only (the linking part already matches, so there is no scaling step). Level 3 (`2 : 5`, `3 : 4`): both ratios written; B is 5 and 3 and no whole-number step joins them; "what number do 5 and 3 both go into?" (15, from the multiples of each); scale A : B by 3 (`× 3`, `6 : 15`); scale B : C by 5 (`× 5`, `15 : 20`); the two B cells match, join them; `6 : 15 : 20`. Three ratios repeat the "match, then join" step once per link.

### 3.4 Sample questions (acceptance set)

| Level | Question as displayed | Answer | Working (one line) |
|---|---|---|---|
| 1 | A : B = 3 : 4, B : C = 4 : 7 | 3 : 4 : 7 | B is 4 in both; join |
| 1 | A : B = 5 : 2, B : C = 2 : 9 | 5 : 2 : 9 | B is 2 in both; join |
| 1 (three) | A : B = 2 : 3, B : C = 3 : 5, C : D = 5 : 7 | 2 : 3 : 5 : 7 | B and C match; join |
| 2 | A : B = 5 : 2, B : C = 4 : 5 | 10 : 4 : 5 | 2 → 4 is × 2; scale A : B by 2 |
| 2 | A : B = 3 : 4, B : C = 2 : 7 | 3 : 4 : 14 | 2 → 4 is × 2; scale B : C by 2 |
| 2 | A : B = 2 : 3, B : C = 9 : 4 | 6 : 9 : 4 | 3 → 9 is × 3; scale A : B by 3 |
| 2 (three) | A : B = 2 : 3, B : C = 3 : 4, C : D = 2 : 7 | 2 : 3 : 4 : 14 | C is 4 and 2; scale C : D by 2 |
| 3 | A : B = 2 : 5, B : C = 3 : 4 | 6 : 15 : 20 | 5 and 3 → 15; × 3 and × 5 |
| 3 | A : B = 3 : 4, B : C = 5 : 7 | 15 : 20 : 28 | 4 and 5 → 20; × 5 and × 4 |
| 3 | A : B = 5 : 3, B : C = 2 : 9 | 10 : 6 : 27 | 3 and 2 → 6; × 2 and × 3 |
| 3 (three) | A : B = 2 : 3, B : C = 4 : 5, C : D = 3 : 7 | 8 : 12 : 15 : 35 | B: 3, 4 → 12; then C: 15 and 3 → 15 |

Order options (any level; shown with Level 3 working):

| Option | Question as displayed | Answer | Working (one line) |
|---|---|---|---|
| Different Order | A : B = 2 : 5, B : C = 3 : 4. Write B : C : A. | 15 : 20 : 6 | 6 : 15 : 20 as A : B : C; read off B, C, A |
| Different Order | A : B = 5 : 2, B : C = 4 : 5. Write C : B : A. | 5 : 4 : 10 | 10 : 4 : 5 as A : B : C; read off C, B, A |
| Either Way Round | B : A = 2 : 5, B : C = 3 : 4. Write A : B : C. | 15 : 6 : 8 | B is 2 and 3, so 6; B : A × 3 = 6 : 15, B : C × 2 = 6 : 8 |
| Either Way Round | A : C = 2 : 3, B : C = 5 : 3. Write A : B : C. | 2 : 5 : 3 | C is 3 in both; join under A, B, C |
| Either Way Round | A : C = 3 : 4, B : C = 2 : 5. Write A : B : C. | 15 : 8 : 20 | C is 4 and 5, so 20; A : C × 5, B : C × 4 |

Answer house style: `A : B : C` with spaces round the colons (names in place of letters for a context).

### 3.5 Uniqueness

Key parameters: every number in the given ratios, in order, plus the wording (letters or the context's names). **Pool size:** Level 1 and 2 are far above 24. Level 3 is the tightest (coprime pairs from 2–9, neither a multiple of the other, times the other parts) and still well above 24; confirm with the 30-question worksheet test.

---

## 4. Variety requirements

- Spread the linking parts; at Level 2 do not let `k = 2` fill the set, and scale the first and second ratio about equally (`balanced`).
- Context pool (names two or three things, or four for three ratios): red / blue / green (/ yellow) counters; apples / pears / plums; cats / dogs / rabbits; pop / rock / jazz songs; science / maths / English (books). No people's names needed.
- Do not repeat the same context twice in a row.

---

## 5. Info modal content

Drafted for `RatioManipulation.about.ts`, a "Combining Ratios" section:

- **Overview:** Join ratios that share a part into one ratio, by making the shared part the same number in each.
- **Level 1 — Green:** The shared part already matches; just join them.
- **Level 2 — Amber:** One ratio needs scaling so the shared parts match.
- **Level 3 — Red:** Both ratios need scaling; the shared parts have no common factor.
- **Ratios:** says what the group is for (how many ratios to join), not a list of its choices (R11). **Wording:** whether the ratios use letters or a context.

---

## 6. Extension notes

Not in the first build. A **star**: `A : B`, `B : C`, `B : D` (one shared part in all three ratios; scale all to the lowest common multiple of the three B values, so a common factor appears naturally: 3, 4, 6 → 12, not 72). Worked check: `2 : 3`, `4 : 5`, `6 : 7` → `8 : 12 : 15 : 14`. Offered later as a "Three ratios" shape option; it needs its own Level 2 rule (several ratios may need scaling even when "one side" was the idea).

---

## 7. Open questions (answer before marking `ready`)

1. **Level 1 and your earlier steer.** You first said the equal-linking-part case was trivial and not worth questions; this draft makes it Level 1 as you now describe ("just combining"). Confirm that is right, and that a Level 1 worksheet of 15 questions is fine (the pool is large, so it will not repeat).
2. **A common factor but neither a multiple** (linking parts 4 and 6, LCM 12, not 24): this draft excludes it from Level 3 ("no shared factor") so a "multiply all" method always gives the simplest answer. Where do you want it, and do you want the lowest-common-multiple method taught, or "multiply, then simplify"?
3. **Order (decided with Harry: dispersed through the practice, started from the first set, no position rule taught).** Drafted as two options (3.1), "Different Order" and "Either Way Round", available at every level. Should the tool's own defaults also have them on, or off so a teacher chooses? And should the table's columns stay `A | B | C` with an explicit "read off in the order asked" step (my recommendation: that step is where the mistake is), or follow the order asked?
4. **Three ratios at Level 3 and Level 2:** the rule above (Level 2 scales exactly one ratio, Level 3 at least two) is my reading. Tell me if the progression for three ratios should differ.
