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
skill. Every misconception-provoking property (whole-number part, sign, how many numbers) is a
teacher-facing dial, and the decimal-tail generator specifically targets three named, opposing
misconceptions rather than random-shaped numbers (see §3.2). Sits after place-value and
directed-number-line lessons, before formal inequality/number-line notation work.

**Decimal depth — house rule for this whole tool:** every decimal, in every level and every QO
state, is drawn to **1, 2, or 3 decimal places — never beyond thousandths.**

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
  identical in shape at every level; **not** `workedExampleOnly`. Reformats instantly via
  `reformatQuestion` — same two numbers, text rebuilt.

**Per-level QO** (2-option weighted pools — render as the compact cycle button, None → Mixed →
Exclusive):

- **Level 1 — Decimals:**
  - **multiSelect** `wholeNumberPart` — "Whole-number part": `zeroOnly` (weight 1, defaultActive
    **true**) / `nonzero` (weight 2, defaultActive **false**). *Default: None (every number
    `0.___`).*
- **Level 2 — Integers:**
  - **multiSelect** `sign` — "Sign": `positive` (weight 1, defaultActive **false**) / `negative`
    (weight 2, defaultActive **true**). *Default: Exclusive (every number negative).*
- **Level 3 — Decimals + sign (apex):** both pools together, same options/defaults as above
  (`wholeNumberPart` default **Mixed**, `sign` default **Exclusive negative**).

#### 3.2 Levels

**Level 1 — Decimals:**
- Parameters: two distinct positive decimals `a`, `b`. Whole-number part: `0` when only
  `zeroOnly` active; **1–9** <!-- CONFIRM range --> when `nonzero` active for that number
  (independently per number when Mixed). Decimal part: 1–3dp (house rule above).
  **The decimal-tail digits are drawn from four archetypes, roughly evenly split** (this is the
  generator's internal variety, not a QO control — a teacher shouldn't have to hand-pick trap
  types):
  1. **Clean** — differing tenths digit, same dp length on both numbers, no decoy digits
     (e.g. `0.42` vs `0.65`).
  2. **Longer-is-smaller trap** — differing tenths digit decides it, but the number with *more*
     decimal places is the *smaller* one (e.g. `0.3` vs `0.25` → `0.3` wins on tenths alone).
  3. **Shorter-is-smaller trap** — numbers share every digit up to where the shorter one simply
     stops (implicitly zero-padded), so the *longer* number always wins (e.g. `0.2` vs `0.25` →
     `0.25` wins because `0.20 < 0.25`). Mathematically guaranteed correct by construction.
  4. **Wrong-priority-digit trap** — both numbers full 3dp; the tenths digit correctly decides
     it, but the *losing* number's hundredths **and** thousandths digits are individually bigger
     than the winner's (e.g. `0.311` vs `0.259` → `0.311` wins on tenths despite `0.259` having
     bigger digits in both later places).
- Constraints: `a ≠ b`.
- Exclusions: `a = b`.
- Misconceptions targeted: archetype 2 → "more digits after the point = bigger value." Archetype
  3 → "a place with no digit there beats one that has a (smaller-looking) digit." Archetype 4 →
  "compare the biggest/rightmost digits, not the leftmost place value." Archetype 1 is the
  procedural control case (no trap, just column-by-column comparison).

**Level 2 — Integers:**
- Parameters: two distinct integers, magnitude **1–20** <!-- CONFIRM range -->, sign drawn per
  the `sign` cycle for each number independently.
- Constraints: `a ≠ b`.
- Exclusions: `a = b`.
- Misconceptions targeted: "the bigger positive number is the bigger negative number" — every
  distinct negative pair tests this inherently (`-5` vs `-3` → naive magnitude reading says
  `-5 > -3`, correct answer reverses it). Mixed sign also tests "negative is always less than
  positive."

**Level 3 — Decimals + sign (apex):**
- Parameters: Level 1's decimal construction (all four archetypes, still capped at 3dp), combined
  with Level 2's sign draw — magnitude **0.001–20.000** <!-- CONFIRM range -->.
- Constraints: `a ≠ b`.
- Exclusions: `a = b`.
- Misconceptions targeted: any Level 1 archetype **compounded with** the Level 2 sign-reversal —
  e.g. archetype 3 under a negative sign: `-0.2` vs `-0.25` → magnitude says `0.25 > 0.2`, but the
  negative sign reverses it, so `-0.2 > -0.25`. Two independent traps stacked in one question.

#### 3.3 Worked example script

Shown for **Symbols** mode; **Words** mode ends at `mStep("Answer:", …)` instead of the final
inequality-statement step. Method is identical across archetypes (compare place-value columns
left to right) — only which column decides it changes, so one script generalises; the four
sample questions below in §3.4 show it applied to each archetype.

**Level 1 — archetype 2 (longer-is-smaller), question: `0.3 ▢ 0.25`**
1. `mStep("Compare the tenths digit — the leftmost decimal place decides first:", "3 > 2")`
2. `mStep("So:", "0.3 > 0.25")`

**Level 1 — archetype 4 (wrong-priority-digit), question: `0.311 ▢ 0.259`**
1. `mStep("Compare the tenths digit first — it outweighs every digit after it:", "3 > 2")`
2. `mStep("The hundredths and thousandths don't matter once the tenths digit has decided it:", "0.311 > 0.259")`

**Level 2 — question: `-8 ▢ -2`**
1. `mStep("Compare the sizes, ignoring the negative signs:", "8 > 2")`
2. `mStep("For negative numbers, the smaller size is the bigger value:", "-2 > -8")`
3. `mStep("So:", "-8 < -2")`

**Level 3 — question: `-0.2 ▢ -0.25`**
1. `mStep("Compare the sizes, ignoring the negative signs:", "0.2 < 0.25")`
2. `mStep("Negative numbers reverse the order:", "-0.2 > -0.25")`
3. `mStep("So:", "-0.25 < -0.2")`

#### 3.4 Sample questions (acceptance set)

| Level | Config | Question as displayed | Answer | Working (one line) |
|---|---|---|---|---|
| 1 | Clean | Words: "Which is bigger: 0.42 or 0.65?" | 0.65 | Tenths: 4 < 6 |
| 1 | Longer-is-smaller | Symbols: "Insert < or >: 0.3 ▢ 0.25" | 0.3 > 0.25 | Tenths: 3 > 2 |
| 1 | Shorter-is-smaller | Words: "Which is bigger: 0.2 or 0.25?" | 0.25 | Same tenths, 0.20 < 0.25 |
| 1 | Wrong-priority-digit | Symbols: "Insert < or >: 0.311 ▢ 0.259" | 0.311 > 0.259 | Tenths: 3 > 2 (later digits are a decoy) |
| 2 | Exclusive neg | Symbols: "Insert < or >: -8 ▢ -2" | -8 < -2 | Sizes 8 > 2, reversed |
| 2 | Mixed | Words: "Which is smaller: -5 or 3?" | -5 | Negative always less than positive |
| 3 | Shorter-is-smaller + neg | Symbols: "Insert < or >: -0.2 ▢ -0.25" | -0.2 > -0.25 | 0.20 < 0.25, then sign reverses |
| 3 | Wrong-priority + neg | Words: "Which is bigger: -0.311 or -0.259?" | -0.259 | Tenths decide (3>2), then sign reverses |
| 3 | Mixed sign | Words: "Which is bigger: -0.6 or 0.2?" | 0.2 | Negative always less than positive |

#### 3.5 Uniqueness

Key parameters: `level`, `notation`, `wholeNumberPart` state, `sign` state, `a`, `b` (numeric
values), random id.

**Pool size:** every level/config combination draws from a wide enough range to comfortably
exceed 15 distinct pairs (archetype 2/3/4 constructions still leave many digit choices free).

---

### Sub-tool: Order (`order`)

#### 3.1 Question options (QO)

- **dropdown** `notation` — same as Compare.
- **multiSelect** `direction` — "Direction": `ascending` (defaultActive) / `descending`
  (defaultActive).
- **dropdown** `count` — "How many numbers": `3` / `4` / `5` / `6` — available in full at every
  level; per-level default only: Level 1 → `3`, Level 2 → `4`, Level 3 → `5`.
- **Per-level `wholeNumberPart` / `sign` pools:** identical shape and defaults to Compare §3.1.

#### 3.2 Levels

**Level 1 — Decimals, 3–6 numbers (default 3):**
- Parameters: `count` distinct positive decimals, same digit rules as Compare Level 1 (1–3dp,
  whole-number part per `wholeNumberPart`). **At least one adjacent pair in the correctly-sorted
  list is drawn from archetype 2, 3, or 4** (rotating across a worksheet so all three appear over
  a set of questions); the rest of the list fills from archetype 1 (clean) within the same range.
- Constraints: all values distinct.
- Exclusions: any duplicate value.
- Misconceptions targeted: same three archetypes as Compare Level 1, sustained across a list — a
  student who trusts "longer/shorter = bigger" gets at least one comparison in the list wrong.

**Level 2 — Integers, 3–6 numbers (default 4):**
- Parameters: `count` distinct integers, built exactly as Compare Level 2.
- Constraints: all values distinct.
- Exclusions: any duplicate value.
- Misconceptions targeted: same as Compare Level 2 — sorting by magnitude alone gives the list
  exactly backwards under Exclusive-negative.

**Level 3 — Decimals + sign, 3–6 numbers (default 5):**
- Parameters: `count` distinct decimals, built exactly as Compare Level 3 (archetype rotation +
  sign draw).
- Constraints: all values distinct.
- Exclusions: any duplicate value.
- Misconceptions targeted: Level 1's archetypes compounded with Level 2's sign-reversal, sustained
  across a list — the hardest visible collapse point without a systematic method.

#### 3.3 Worked example script

**Level 1 — one archetype-2 pair present, question: order `0.65, 0.3, 0.25` (ascending)**
1. `mStep("Compare the tenths digit of each number first:", "2 < 3 < 6")`
2. `mStep("So:", "0.25 < 0.3 < 0.65")`

**Level 2 — Exclusive negative, question: order `-7, -2, -9, -4` (ascending)**
1. `mStep("Compare the sizes, ignoring signs:", "9 > 7 > 4 > 2")`
2. `mStep("Negative reverses the order:", "-9 < -7 < -4 < -2")`

**Level 3 — question: order `-0.2, -0.65, -0.25` (ascending)**
1. `mStep("Compare the sizes, ignoring the negative signs:", "0.2 < 0.25 < 0.65")`
2. `mStep("Negative reverses the order:", "-0.65 < -0.25 < -0.2")`

#### 3.4 Sample questions (acceptance set)

| Level | Config | Question as displayed | Answer | Working (one line) |
|---|---|---|---|---|
| 1 | count 3 | Words, asc: "Order smallest first: 0.65, 0.3, 0.25" | 0.25, 0.3, 0.65 | Tenths: 2 < 3 < 6 |
| 1 | count 4 | Symbols, desc: "Write as a chain, largest first: 0.42, 0.311, 0.259, 0.5" | 0.5 > 0.42 > 0.311 > 0.259 | Tenths decide each pair |
| 2 | Exclusive neg, count 4 | Symbols, asc: "Write as a chain, smallest first: -7, -2, -9, -4" | -9 < -7 < -4 < -2 | Sizes reversed |
| 2 | Mixed, count 5 | Words, asc: "Order smallest first: -3, 6, -8, 2, -1" | -8, -3, -1, 2, 6 | Negatives reversed, then positives |
| 3 | count 5 | Words, asc: "Order smallest first: -0.2, -0.65, -0.25, -0.42, -0.311" | -0.65, -0.42, -0.311, -0.25, -0.2 | Sizes reversed under sign |
| 3 | count 6, Mixed sign | Symbols, asc: "Write as a chain, smallest first: -0.6, -0.2, -0.25, 0.311, 0.259, 0.5" | -0.6 < -0.25 < -0.2 < 0.259 < 0.311 < 0.5 | Negatives (reversed) then positives |

#### 3.5 Uniqueness

Key parameters: `level`, `notation`, `direction`, `count`, `wholeNumberPart` state, `sign` state,
the value list (numeric), random id.

**Pool size:** every level/count/config combination comfortably exceeds 15 distinct lists (same
per-number ranges as Compare, drawing `count` values instead of 2).

---

## 4. Variety requirements

- Compare Level 1/3: rotate through the four decimal archetypes roughly evenly across a
  worksheet — never settle into all-clean or all-one-trap-type. <!-- CONFIRM: exact split, or is
  "roughly a quarter each" fine, same mechanism as the Smart Progressor's quota balancing? -->
- Order Level 1/3: rotate which archetype the guaranteed adjacent-pair uses (2, 3, then 4, then
  repeat) across consecutive questions on one worksheet, so a 15-question sheet doesn't lean on
  just one trap.
- When `sign`/`wholeNumberPart` cycles are in Mixed state, the existing Smart Progressor
  (`buildQuotaOverrides`) already keeps the split roughly even — no extra tool code needed.
- Spread whole-number parts and integer magnitudes across their full stated ranges.
- Randomise which operand is written first in Compare, and which direction is asked in Order.

---

## 5. Info modal content

**Compare tab:**
- Overview: "Compare two numbers and say which is bigger — first in plain words, then with `<`
  and `>`. The decimal generator specifically targets the 'longer/shorter decimal looks bigger'
  misconceptions, not just random numbers."
- Level 1 — Decimals: "Pure `0.___` comparison up to thousandths, built from named misconception
  traps (see info panel). 'Allow whole numbers' adds the 'ignore the whole part' trap."
- Level 2 — Integers: "Sign dial (Positive-only → Mixed → Negative-only) targets 'the bigger
  positive number is the bigger negative number.'"
- Level 3 — Decimals + sign: "Both trap families together."

**Order tab:**
- Overview: "Order 3–6 numbers, smallest to largest or largest to smallest — in words, then as an
  inequality chain."
- Level 1 / 2 / 3: as Compare, sustained across a list.

---

## 6. Out of scope / future ideas

- Plain positive-integer-only baseline with no dials active — covered by setting both cycles to
  their easiest state, no dedicated mode needed.
- Fractions in the comparison/ordering pool.
- A number-line diagram sub-tool (visual placement) — future extension via the Number Line
  representation family.
- Mixed decimal-and-plain-integer comparisons (e.g. `0.65` vs `7`, no decimal point at all) — a
  distinct crossover trap from the whole-number-part dial; parked as a possible future
  `numberForm` pool.

---

## Implementation note (not part of the template — for the builder)

Store `_rawValues` (`{ a, b }` for Compare; `{ values: number[] }` + `direction` for Order) so
`reformatQuestion` rebuilds question/answer text for a Notation or Direction change without a
fresh draw. `wholeNumberPart`/`sign`/`count`/archetype changes go through normal regeneration.
The four-archetype digit construction (§3.2) is the one genuinely new piece of generation logic
this tool needs — everywhere else reuses standard `randInt`/`pick` patterns.
