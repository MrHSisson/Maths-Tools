# Tool Spec: Comparing & Ordering Numbers

**Status:** draft <!-- reviewer: confirm ranges flagged CONFIRM below, then flip to ready -->

---

## 1. Overview

| Field | Value |
|---|---|
| Tool name | Comparing & Ordering Numbers |
| Tool id / URL path | `/comparing-ordering-numbers` |
| Category | Number |
| Card description | Compare and order decimals and negative numbers — in words, then with inequality symbols — fully tailorable by trap type. |
| Defaults | standard |

**Pedagogical intent:** students build genuine magnitude sense — comparing "which is bigger" and
ordering a short list in plain words — before formal inequality notation is layered on the same
skill. Every misconception-provoking property (a non-zero whole-number part on a decimal, the
presence of negatives, how many numbers are in a list) is a **teacher-facing dial**, not a fixed
level property, so the same tool serves a pure place-value warm-up and a full mixed-sign apex
worksheet without switching tools. Sits after place-value and directed-number-line lessons,
before formal inequality/number-line notation work.

---

## 2. Sub-tools

| Key | Tab label | Kind | Instruction line |
|---|---|---|---|
| `compare` | Compare | worded | — |
| `order` | Order | worded | — |

---

## 3. Sub-tool detail

### Sub-tool: Compare (`compare`)

#### 3.1 Question options (QO)

- **dropdown** `notation` — "Notation": `words` (defaultActive) / `symbols`. Available and
  identical in shape at every level; **not** `workedExampleOnly` (changes the answer format, not
  just the working). Reformats instantly via `reformatQuestion` — same two numbers, text rebuilt.

**Per-level QO** (each level's own 2-option weighted pool(s) — render as the compact cycle button,
None → Mixed → Exclusive):

- **Level 1 — Decimals:**
  - **multiSelect** `wholeNumberPart` — "Whole-number part":
    - `zeroOnly` — "0.__ only" — weight 1 — defaultActive: **true**
    - `nonzero` — "Allow whole numbers" — weight 2 — defaultActive: **false**
    - *Default cycle state: None (every number `0.__`).* Teacher can dial to Mixed (blend) or
      Exclusive (every number has a non-zero whole part, e.g. `4.2` vs `3.9`).
- **Level 2 — Integers:**
  - **multiSelect** `sign` — "Sign":
    - `positive` — "Positive" — weight 1 — defaultActive: **false**
    - `negative` — "Negative" — weight 2 — defaultActive: **true**
    - *Default cycle state: Exclusive (every number negative)* — preserves the level's focus on
      sign-reversal out of the box; teacher can dial to Mixed or all-positive.
- **Level 3 — Decimals + sign (apex):** both pools together, same options as above:
  - `wholeNumberPart` — *default Mixed* (both `zeroOnly` and `nonzero` active)
  - `sign` — *default Exclusive negative*, same as Level 2

#### 3.2 Levels

**Level 1 — Decimals:**
- Parameters: two distinct positive decimals `a`, `b`, 1dp or 2dp. Whole-number part drawn per
  the `wholeNumberPart` cycle: `0` when only `zeroOnly` is active; **1–9** <!-- CONFIRM range -->
  when `nonzero` is active for that number; independently per number when both are active.
- Constraints: `a ≠ b`.
- Exclusions: `a = b`.
- Misconceptions targeted: at the base state, pure place-value column comparison of the decimal
  digits (`0.42` vs `0.65` → compare tenths only). With `nonzero` active: "compare only the
  decimal digits and ignore the whole-number part" (`4.2` vs `3.9` — a student who's only ever
  compared `0.__` numbers may compare `2` vs `9` and get it backwards, missing that `4 > 3`
  already decides it).

**Level 2 — Integers:**
- Parameters: two distinct integers, magnitude **1–20** <!-- CONFIRM range -->, sign drawn per
  the `sign` cycle for each number independently.
- Constraints: `a ≠ b`.
- Exclusions: `a = b`.
- Misconceptions targeted: sign-reversal (`-5 > -3` because `5 > 3`) when negatives are present;
  "negative is always less than positive" when Mixed.

**Level 3 — Decimals + sign (apex):**
- Parameters: as Level 1's decimal construction, combined with Level 2's sign draw — magnitude
  **0.01–20.00**, whole-number part and sign each drawn from their own cycle.
- Constraints: `a ≠ b`.
- Exclusions: `a = b`.
- Misconceptions targeted: combined decimal-tail and sign-reversal trap — e.g. `-3.4` vs `-3.09`
  (same whole part, decimal-tail trap under a negative sign) and `-4.2` vs `-3.91` (different
  whole part, sign trap first).

#### 3.3 Worked example script

Shown for **Symbols** mode; **Words** mode uses the same reasoning, ending at `mStep("Answer:", …)`
instead of the final inequality-statement step.

**Level 1 — base state, question: `0.42 ▢ 0.65`**
1. `mStep("Compare the tenths digit:", "4 < 6")`
2. `mStep("So:", "0.42 < 0.65")`

**Level 1 — `nonzero` active, question: `4.2 ▢ 3.9`**
1. `mStep("Compare the whole number parts first:", "4 > 3")`
2. `mStep("So:", "3.9 < 4.2")`

**Level 2 — question: `-8 ▢ -2`**
1. `mStep("Compare the sizes, ignoring the negative signs:", "8 > 2")`
2. `mStep("For negative numbers, the smaller size is the bigger value:", "-2 > -8")`
3. `mStep("So:", "-8 < -2")`

**Level 3 — question: `-4.2 ▢ -3.91`**
1. `mStep("Compare the sizes, ignoring the negative signs:", "4.2 > 3.91")`
2. `mStep("Negative numbers reverse the order:", "-4.2 < -3.91")`
3. `mStep("So:", "-4.2 < -3.91")`

#### 3.4 Sample questions (acceptance set)

| Level | Config | Question as displayed | Answer | Working (one line) |
|---|---|---|---|---|
| 1 | zeroOnly | Words: "Which is bigger: 0.42 or 0.65?" | 0.65 | Tenths: 4 < 6 |
| 1 | zeroOnly | Symbols: "Insert < or >: 0.7 ▢ 0.68" | 0.7 > 0.68 | 0.70 vs 0.68 |
| 1 | nonzero | Words: "Which is bigger: 4.2 or 3.9?" | 4.2 | Whole parts: 4 > 3 |
| 1 | nonzero | Symbols: "Insert < or >: 6.5 ▢ 6.53" | 6.5 < 6.53 | Same whole part, hundredths 0 < 3 |
| 2 | Exclusive neg | Symbols: "Insert < or >: -8 ▢ -2" | -8 < -2 | Sizes 8 > 2, reversed |
| 2 | Mixed | Words: "Which is smaller: -5 or 3?" | -5 | Negative always less than positive |
| 3 | zeroOnly + neg | Words: "Which is bigger: -3.4 or -3.09?" | -3.09 | Decimal parts 0.40 > 0.09, closer to 0 |
| 3 | nonzero + neg | Symbols: "Insert < or >: -4.2 ▢ -3.91" | -4.2 < -3.91 | Whole parts 4 > 3, reversed |
| 3 | Mixed sign | Words: "Which is bigger: -0.6 or 0.2?" | 0.2 | Negative always less than positive |

#### 3.5 Uniqueness

Key parameters: `level`, `notation`, `wholeNumberPart` state, `sign` state, `a`, `b` (numeric
values), random id.

**Pool size:** every level/config combination draws from a wide enough decimal or integer range
(§3.2) to comfortably exceed 15 distinct pairs.

---

### Sub-tool: Order (`order`)

#### 3.1 Question options (QO)

- **dropdown** `notation` — "Notation": `words` (defaultActive, plain list answer) / `symbols`
  (answer as an inequality chain). Same reformat behaviour as Compare.
- **multiSelect** `direction` — "Direction": `ascending` (defaultActive) / `descending`
  (defaultActive) — both active by default, teacher can lock to one.
- **dropdown** `count` — "How many numbers": `3` / `4` / `5` / `6` — **available in full at every
  level**, per-level default only: Level 1 defaults to `3`, Level 2 to `4`, Level 3 to `5`.
- **Per-level `wholeNumberPart` / `sign` pools:** identical shape and defaults to Compare's §3.1
  (Level 1 → `wholeNumberPart` default None; Level 2 → `sign` default Exclusive negative;
  Level 3 → both, same defaults as Compare Level 3).

#### 3.2 Levels

**Level 1 — Decimals, 3–6 numbers (default 3):**
- Parameters: `count` distinct positive decimals, built exactly as Compare Level 1.
- Constraints: all values distinct.
- Exclusions: any duplicate value.
- Misconceptions targeted: same as Compare Level 1, sustained across a list.

**Level 2 — Integers, 3–6 numbers (default 4):**
- Parameters: `count` distinct integers, built exactly as Compare Level 2.
- Constraints: all values distinct.
- Exclusions: any duplicate value.
- Misconceptions targeted: same as Compare Level 2 — a student sorting by magnitude alone gets
  the list exactly backwards under Exclusive-negative.

**Level 3 — Decimals + sign, 3–6 numbers (default 5):**
- Parameters: `count` distinct decimals, built exactly as Compare Level 3.
- Constraints: all values distinct.
- Exclusions: any duplicate value.
- Misconceptions targeted: same as Compare Level 3, sustained across a list — the hardest visible
  collapse point without a systematic method.

#### 3.3 Worked example script

**Level 1 — base state, question: order `0.42, 0.65, 0.3` (ascending)**
1. `mStep("Compare the tenths digits:", "3 < 4 < 6")`
2. `mStep("So:", "0.3 < 0.42 < 0.65")`

**Level 2 — Exclusive negative, question: order `-7, -2, -9, -4` (ascending)**
1. `mStep("Compare the sizes, ignoring signs:", "9 > 7 > 4 > 2")`
2. `mStep("Negative reverses the order:", "-9 < -7 < -4 < -2")`

**Level 3 — question: order `-4.5, -4.2, -4.05, -3.91, -3.6` (ascending)**
1. `mStep("Compare the sizes, ignoring the negative signs:", "4.5 > 4.2 > 4.05 > 3.91 > 3.6")`
2. `mStep("Negative reverses the order:", "-4.5 < -4.2 < -4.05 < -3.91 < -3.6")`

#### 3.4 Sample questions (acceptance set)

| Level | Config | Question as displayed | Answer | Working (one line) |
|---|---|---|---|---|
| 1 | zeroOnly, count 3 | Words, asc: "Order smallest first: 0.42, 0.65, 0.3" | 0.3, 0.42, 0.65 | Tenths: 3 < 4 < 6 |
| 1 | nonzero, count 4 | Symbols, desc: "Write as a chain, largest first: 4.2, 3.9, 4.05, 3.6" | 4.2 > 4.05 > 3.9 > 3.6 | Whole parts then tenths |
| 2 | Exclusive neg, count 4 | Symbols, asc: "Write as a chain, smallest first: -7, -2, -9, -4" | -9 < -7 < -4 < -2 | Sizes reversed |
| 2 | Mixed, count 5 | Words, asc: "Order smallest first: -3, 6, -8, 2, -1" | -8, -3, -1, 2, 6 | Negatives first (reversed), then positives |
| 3 | count 5 | Words, asc: "Order smallest first: -4.5, -4.2, -4.05, -3.91, -3.6" | -4.5, -4.2, -4.05, -3.91, -3.6 | Whole parts reversed by sign |
| 3 | count 6, Mixed sign | Symbols, asc: "Write as a chain, smallest first: -3.4, -3.09, 0.28, -3.25, 0.4, -3.5" | -3.5 < -3.4 < -3.25 < -3.09 < 0.28 < 0.4 | Negatives (reversed) then positives |

#### 3.5 Uniqueness

Key parameters: `level`, `notation`, `direction`, `count`, `wholeNumberPart` state, `sign` state,
the value list (numeric), random id.

**Pool size:** every level/count/config combination comfortably exceeds 15 distinct lists (see
Compare §3.5 — the same per-number ranges apply, just drawing `count` values instead of 2).

---

## 4. Variety requirements

- When `nonzero`/`sign` cycles are in **Mixed** state, keep the split roughly even (Smart
  Progressor's existing `buildQuotaOverrides` mechanism already does this for any weighted
  multiSelect pool — no extra tool code needed).
- When `nonzero` is active (Mixed or Exclusive), bias a meaningful share of generated pairs/lists
  to **share the same whole-number part** (e.g. `4.2` vs `3.9` → `4.2` vs `4.19`) — otherwise the
  "ignore the whole number, just eyeball the tail" trap rarely triggers. Target roughly half of
  `nonzero`-eligible questions sharing a whole part, half not. <!-- CONFIRM ratio -->
  - Same principle for `sign` = Mixed at Level 3: a meaningful share of pairs/lists should share
    the same whole-number part under the sign trap too, not just vary randomly.
- Spread whole-number parts and integer magnitudes across their full stated ranges — don't cluster
  near one end.
- Randomise which operand is written first in Compare, and which direction is asked in Order (when
  both active), so students can't pattern-match position.

---

## 5. Info modal content

**Compare tab:**
- Overview: "Compare two numbers and say which is bigger — first in plain words, then using `<`
  and `>` symbols. Every trap (whole-number part, sign) is a teacher-adjustable dial."
- Level 1 — Decimals: "Starts as pure `0.__` comparison; switch on 'Allow whole numbers' to add
  the 'ignore the whole part, just compare the tail' trap."
- Level 2 — Integers: "Sign dial runs Positive-only → Mixed → Negative-only, targeting the
  'bigger digit means bigger value' misconception for negatives."
- Level 3 — Decimals + sign: "Both dials together — the full trap set, teacher-tunable."

**Order tab:**
- Overview: "Order 3–6 numbers, smallest to largest or largest to smallest — in words, then as an
  inequality chain. Choose how many numbers and which traps are active at every level."
- Level 1 / 2 / 3: as Compare, sustained across a list.

---

## 6. Out of scope / future ideas

- Plain positive-integer-only baseline with no decimal/sign dials at all — covered implicitly by
  setting both cycles to their easiest state, so no dedicated mode needed.
- Fractions in the comparison/ordering pool.
- A number-line diagram sub-tool (visual placement) — natural future extension using the site's
  Number Line representation family.
- Mixed decimal-and-plain-integer comparisons (e.g. `0.65` vs `7`, no decimal point at all) — a
  distinct crossover trap from the whole-number-part dial above; parked as a possible future
  `numberForm` pool if wanted later.

---

## Implementation note (not part of the template — for the builder)

Store `_rawValues` (`{ a, b }` for Compare; `{ values: number[] }` + `direction` for Order) so
`reformatQuestion` rebuilds question/answer text for a Notation or Direction change without a
fresh draw — same pattern as `CompletingTheSquare.tsx`. `wholeNumberPart`/`sign`/`count` changes
go through normal regeneration (they change the underlying numbers), same as any other QO change.
