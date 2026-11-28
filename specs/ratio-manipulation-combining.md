# Tool Spec: Ratio Manipulation — Combining Ratios (new tab)

**Status:** draft <!-- Open questions in section 7 must be answered before this is marked `ready`. -->

A delta to `specs/ratio-manipulation.md`: it adds one sub-tool (a sixth tab) to the existing Ratio Manipulation tool. Nothing else about the tool changes. The lesson it serves is planned in section 6.

---

## 1. Overview

| Field | Value |
|---|---|
| Tool name | Ratio Manipulation (existing; `ratio-manipulation`, `/ratio-manipulation`) |
| New sub-tool | `combiningRatios` · tab label **Combining Ratios** |
| Placement | After Equivalent Ratios (it needs scaling) and before Fraction to Ratio. `toolTabRows` goes from `[3, 2]` to `[3, 3]`. |
| Kind | worded (the ratios sit on lines of their own, like Ratio to Fraction) |
| Defaults | standard |

**Pedagogical intent:** given A : B and B : C, a student can write A : B : C by scaling so that the shared part (B) is the same number in both. The levels follow the order the lesson teaches it: scale one ratio, then scale both, then mix the cases and use the result. A student who reaches Level 3 knows *why* the shared part is the link (it is the one number both ratios must agree on), not a memorised "multiply by the other one".

**The trivial case is not a question.** A : B = 2 : 5 and B : C = 5 : 3 (shared part already equal) is taught in the lesson as the starting idea and is never generated: it needs no scaling, so there is nothing to practise.

---

## 2. Sub-tool

| Key | Tab label | Kind | Instruction line |
|---|---|---|---|
| `combiningRatios` | Combining Ratios | worded | — |

Question layout (three lines, as Ratio to Fraction does):

```
A : B = 5 : 2
B : C = 4 : 5
Write A : B : C.
```

Letters A, B, C throughout Levels 1–2. Level 3 may use a context (section 3.2).

---

## 3. Sub-tool detail

### 3.1 Question options (QO)

- **multiSelect** `askFor` — "Ask for" (`exclusive: true`; one drawn per question):
  - `combined` — "A : B : C" — defaultActive: true
  - `use` — "Use It" — false; **Level 3 only** (see below)
- **dropdown** `method` — "Method" (`displayOnly`, `workedExampleOnly`: same question and answer, only the working changes): `table` — "Ratio Table" (default) · `lcm` — "Multiples of B". *Ratio Table:* the three-wide table with arrows (3.2b). *Multiples of B:* list the multiples of each shared part until one matches, then scale. (Phase 2: build only `table` first and leave this out of the first merge.)
- **Per-level differences:** Level 1 and Level 2 offer no QO (a level with one choice has no control). Level 3 offers `askFor`.

### 3.2 Levels

The shared part is always B (the second term of A : B and the first of B : C). Both given ratios are in simplest form. The combined ratio that results from scaling to the lowest common multiple is **always already in simplest form** (proved: a common prime of all three parts would have to divide both given ratios' non-shared parts and the shared parts at once, which simplest form forbids), so no simplifying step is ever needed and none is shown.

**Level 1 — scale one ratio (confidence builder)**
- Parameters: let the two shared parts be `s` (smaller) and `s·k` (larger). `s` 1–6, `k` 2–5, `s·k` ≤ 24. The larger can be in either ratio (so the student must spot *which* ratio to scale). The other part of each ratio is 1–12, different from its own shared part and coprime to it (simplest form).
- Constraints: the smaller ratio is scaled by `k`; the other is left alone. Combined parts are whole numbers.
- Exclusions: equal shared parts (the trivial case); `k = 1`; both ratios needing scaling; a given ratio that is not in simplest form.
- Misconceptions targeted: stacking the ratios (`5 : 2 : 4 : 5`); joining them without scaling (`5 : 2 : 5`, or `5 : 4 : 5`); **adding** the gap instead of multiplying (`2 → 4` read as `+2`, so `7 : 4 : 5`); scaling the wrong ratio. Numbers are chosen so each of these gives a visibly different answer.

**Level 2 — no common factor (scale both)**
- Parameters: shared parts `p` (in A : B) and `q` (in B : C), both 2–9, **coprime** (`gcd = 1`) and neither a multiple of the other. Other parts 1–12, each coprime to its own shared part. Combined B = `p·q` (at most 72, so at most 2 digits for the whole worksheet's B).
- Constraints: A scaled by `q`, B by `q` and `p` to reach `p·q`, C scaled by `p`. Both ratios are scaled.
- Exclusions: a shared part of 1 (that would be Level 1); equal shared parts; shared parts with a common factor (Level 3).
- Misconceptions targeted: scaling both ratios by the same number; scaling each ratio by *its own* shared part (`2 : 5 → ×5`, `3 : 4 → ×3`, giving B = 25 and B = 12, which do not match); stopping when one B matches without checking the other.

**Level 3 — mixed, and using the result**
- Parameters: any of the Level 1 and Level 2 cases, plus **a common factor but neither a multiple of the other** (shared parts `4` and `6` → LCM 12, not 24), plus the shared letter in the wrong place on some questions (`B : A = 2 : 5` and `B : C = 3 : 4`, so the student reorders to `A : B` first). With `askFor = use`, the question gives either a total (`The three amounts total 100`) or one known part (`B is 30`) and asks for each amount.
- Constraints: every "use" question divides exactly (the total is a multiple of the sum of the combined parts; the known part is a multiple of its combined part). Level 3 questions with a context name three things (red, blue, green counters; items from a short pool) so "use it" reads naturally; Levels 1–2 stay on bare letters.
- Exclusions: equal shared parts; a total or known amount that gives a fractional share.
- Misconceptions targeted: using the original ratios' parts instead of the combined parts; sharing the total in the two given ratios separately; taking the product of the shared parts when a smaller common multiple exists (valid but gives larger numbers that then need simplifying).

### 3.2b Picture spec — the three-wide ratio table (all levels)

- **What's drawn:** the shared ratio table (`src/shared/ratioTable.ts`, `rStepBuild`; core representation "ratio table"), three columns headed **A**, **B**, **C**, one row per step, scaling arrows beside the rows, built a row per step like the other ratio tools. It is one continuous bordered table, as `docs/reference/pictures.md` describes.
- **Rows, Level 1** (`A : B = 5 : 2`, `B : C = 4 : 5`):

  | A | B | C | |
  |---|---|---|---|
  | 5 | 2 | | the first given ratio |
  | 10 | 4 | | arrow `× 2` from the row above |
  | | 4 | 5 | the second given ratio (no arrow: it is not scaled) |
  | **10** | **4** | **5** | the answer row, shown last |

- **Rows, Level 2** (`A : B = 2 : 5`, `B : C = 3 : 4`): given A : B, its scaled row (`× 3`), given B : C, its scaled row (`× 5`), then the answer row `6 : 15 : 20`. The two B cells in the scaled rows are highlighted when they match, which is the moment the lesson is about.
- **Blank cells:** a given ratio has one blank cell (the part it does not mention). Blanks stay blank in the given rows and in the scaled rows; only the answer row fills all three.
- **Scaling arrows:** whole-number `×n` only, drawn by the existing component. Because the arrows join *consecutive* rows, each given ratio is followed directly by its scaled row, which is why the table is ordered as above rather than "both given rows first".
- **To check before building (do not assume):** (1) the component renders an empty cell and an empty operation string (`""`, for the gap between the two ratios) without drawing an arrow; (2) `rStepBuild`'s caption for each row reads naturally ("Multiply every part by 3", already supported for three or more columns); (3) three columns fit the phone width at the standard table size. If (1) or (2) needs a change, it is a small separate shared-code chunk with its own test and `npm run smoke:shell`, merged first (`AGENTS.md`, "Small chunks").
- **Print:** the worksheet shows the question only; the answers page shows the answer `A : B : C`, as for Ratio to Fraction.

### 3.3 Worked example script

Level 1, question: `A : B = 5 : 2`, `B : C = 4 : 5`. Write A : B : C.

1. `tStep("B appears in both ratios: it is 2 in the first and 4 in the second. It needs to be the same number in both.")`
2. `rStepBuild("The first ratio, A : B", ["A","B","C"], …)`, then the row `10 : 4` with arrow `× 2` ("2 × 2 = 4, so multiply every part by 2").
3. the second ratio `B : C = 4 : 5` added as its own row (already 4, nothing to scale).
4. `mStep("Now B is 4 in both, so join them:", "A : B : C = 10 : 4 : 5")` (the answer row appears).
5. `mStep("Answer:", "10 : 4 : 5")`.

Level 2, question: `A : B = 2 : 5`, `B : C = 3 : 4`. Steps: say B is 5 and 3 and no whole-number step joins them; "what number do 5 and 3 both go into?" (15); scale A : B by 3 (arrow `× 3`, row `6 : 15`); scale B : C by 5 (arrow `× 5`, row `15 : 20`); the two B cells match, join them; `6 : 15 : 20`.

Level 3 "use it", question: `A : B = 3 : 2`, `B : C = 3 : 5`, total 100. Steps: scale to `9 : 6` and `6 : 10`; combined `9 : 6 : 10`; total parts `9 + 6 + 10 = 25`; one part `100 ÷ 25 = 4`; amounts `36, 24, 40`; answer `A = 36, B = 24, C = 40`.

### 3.4 Sample questions (acceptance set)

| Level | Question as displayed | Answer | Working (one line) |
|---|---|---|---|
| 1 | A : B = 5 : 2, B : C = 4 : 5 | 10 : 4 : 5 | 2 → 4 is × 2; scale A : B by 2 |
| 1 | A : B = 3 : 4, B : C = 2 : 7 | 3 : 4 : 14 | 2 → 4 is × 2; scale B : C by 2 |
| 1 | A : B = 2 : 3, B : C = 9 : 4 | 6 : 9 : 4 | 3 → 9 is × 3; scale A : B by 3 |
| 2 | A : B = 2 : 5, B : C = 3 : 4 | 6 : 15 : 20 | 5 and 3 → 15; × 3 and × 5 |
| 2 | A : B = 3 : 4, B : C = 5 : 7 | 15 : 20 : 28 | 4 and 5 → 20; × 5 and × 4 |
| 2 | A : B = 5 : 3, B : C = 2 : 9 | 10 : 6 : 27 | 3 and 2 → 6; × 2 and × 3 |
| 3 | A : B = 3 : 4, B : C = 6 : 5 | 9 : 12 : 10 | 4 and 6 → 12 (not 24); × 3 and × 2 |
| 3 (Use It) | A : B = 2 : 3, B : C = 4 : 5, B = 24 | A = 16, C = 30 | 8 : 12 : 15; 24 ÷ 12 = 2 per part |
| 3 (Use It) | A : B = 3 : 2, B : C = 3 : 5, total 100 | A = 36, B = 24, C = 40 | 9 : 6 : 10; 100 ÷ 25 = 4 per part |

Answer house style: `A : B : C` with spaces round the colons, as the other tabs write ratios. "Use It" answers are `A = 36, B = 24, C = 40`, in one line.

### 3.5 Uniqueness

Key parameters: the two ratios (all four numbers, in order), the level's case (scale one / both / common factor / reordered), and for Use It the given total or known part.

**Pool size:** Level 1 comfortably exceeds 24 (shared pairs × factors × other parts). Level 2 is the tightest: coprime pairs `(p, q)` from 2–9 with neither a multiple of the other, times the other parts, still far above 24. Check with the usual 30-question worksheet test when built.

---

## 4. Variety requirements

- Spread the shared parts and factors: do not let `k = 2` fill Level 1.
- At Level 1, scale the first ratio about half the time and the second the other half (`balanced`).
- At Level 3, roughly a third each: common-factor case, reordered letters, and the mixed Level 1/2 cases; "Use It" questions spread over total and known part.
- Context pool for Level 3 (three things each): red / blue / green counters; apples / pears / plums; cats / dogs / rabbits; pop / rock / jazz songs. Names are not needed.

---

## 5. Info modal content

Drafted for `RatioManipulation.about.ts`, under a new "Combining Ratios" section:

- **Overview:** Join two ratios that share a letter into one ratio of three parts, by making the shared part the same number in both.
- **Level 1 — Green:** One ratio needs scaling; the shared part of the other is already a multiple of it.
- **Level 2 — Amber:** Both ratios need scaling; the shared parts have no common factor.
- **Level 3 — Red:** All the cases mixed, including a common factor and reordered letters, with the option to use the result to find amounts.
- **Ask for / Use It:** group explainer says what the group is for, not a list of its choices (rule R11).

---

## 6. The lesson this serves (for the deck brief to come)

Not part of this tool brief; recorded so the tool and deck agree. One idea: **make the shared part equal**.

| Step | Content |
|---|---|
| 1. The idea | Two ratios that share a letter: A : B and B : C. Same B value, just join (the trivial case, shown not practised). |
| 2. One side scaled | `5 : 2` and `4 : 5` on the three-wide table; the arrow `× 2`. Fixed set + generator (Level 1). |
| 3. Both sides scaled | `2 : 5` and `3 : 4`; find a common multiple of 5 and 3. Fixed set + generator (Level 2). |
| 4. All of it, and use it | Common factor case, reordered letters, then sharing a total or finding an amount (Level 3). |
| Depth | The misconceptions in 3.2 become Depth items (the bank needs three items per Question Option, `depth.test.ts`). |

Order of work (each its own small merge, `AGENTS.md`): (1) any shared ratio-table change the checks in 3.2b need; (2) this tab, behind Developing-tools mode; (3) the Depth bank; (4) the deck.

---

## 7. Open questions (answer before marking `ready`)

1. **Level 3 scope.** The brief reads "all of the using" as *mix the cases and use the result* (share a total / find an amount). Is that right, or did you mean something else?
2. **The common-factor case** (shared parts 4 and 6, so the LCM is 12, not 24) sits between your "scale one side" and "no shared factor". This draft puts it in Level 3. Should it be its own level or lesson step instead?
3. **Reordered letters** (`B : A` and `B : C`): Level 3 as drafted. Is that wanted, or left out of this lesson?
4. **Contexts:** bare letters for Levels 1–2, a context for Level 3 only. Or letters throughout?
