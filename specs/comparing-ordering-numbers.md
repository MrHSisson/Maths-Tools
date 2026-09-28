# Tool Spec: Comparing & Ordering Numbers

**Status:** draft <!-- reviewer: confirm ranges/mixes flagged with "CONFIRM" below, then flip to ready -->

---

## 1. Overview

| Field | Value |
|---|---|
| Tool name | Comparing & Ordering Numbers |
| Tool id / URL path | `/comparing-ordering-numbers` |
| Category | Number |
| Card description | Compare and order decimals, negatives and negative decimals — in words, then with inequality symbols. |
| Defaults | standard |

**Pedagogical intent:** students build genuine magnitude sense across decimals and negative
numbers — comparing "which is bigger" and ordering a short list in plain words — before formal
inequality notation is introduced on top of the same skill. The tool deliberately skips a
plain-positive-integer baseline (not needed for this class) and goes straight at the two
misconceptions that matter: reading a decimal tail as a whole number (`4.19 > 4.2` because
`19 > 2`), and treating negative magnitude as value (`-5 > -3` because `5 > 3`). Sits after
place-value and directed-number-line lessons, before formal inequality/number-line notation work.

---

## 2. Sub-tools

| Key | Tab label | Kind | Instruction line |
|---|---|---|---|
| `compare` | Compare | worded | — |
| `order` | Order | worded | — |

Both are self-contained sentences (*"Which is bigger…"*, *"Put these in order…"*), so no separate
instruction line.

---

## 3. Sub-tool detail

### Sub-tool: Compare (`compare`)

#### 3.1 Question options (QO)

- **dropdown** `notation` — "Notation":
  - `words` — "Words" — defaultActive
  - `symbols` — "Symbols"
- **multiSelect / variables:** none
- **Per-level differences:** none — Notation is available and meaningful at every level; it is
  **not** `workedExampleOnly` because it changes the question text and the answer format, not
  just the working.

Switching Notation is an instant `reformatQuestion` — same two numbers, question/answer text
rebuilt from stored `_rawValues` (see "Implementation note" below), never a fresh draw.

**Differentiated worksheet mode:** each level column starts on Notation = Words (the tool default);
teacher-adjustable per column as normal.

#### 3.2 Levels

**Level 1 — Decimals (confidence builder):**
- Parameters: two distinct positive decimals `a`, `b`. Each independently 1dp or 2dp. Integer
  part 0–9 <!-- CONFIRM range — wide enough for variety but not so wide the magnitude jump makes
  the tenths-digit comparison trivial --> . **CONFIRM the trap mix:** ~50% of questions force
  `a` and `b` to share the same whole-number part (so the tenths/hundredths digit genuinely
  decides it — the trap-eligible case); the other ~50% draw independent integer parts (clean
  case, procedural check only).
- Constraints: `a ≠ b` as values (reject `4.20` vs `4.2` — equal despite different digit strings).
- Exclusions: `a = b`.
- Misconceptions targeted: reading the decimal tail as a whole number instead of comparing
  place-value columns left to right (`4.19` vs `4.2` → tenths `1 < 2`, so `4.2` wins, not `4.19`
  despite `19 > 2`).

**Level 2 — Negative integers:**
- Parameters: two distinct negative integers from **−20 to −1** <!-- CONFIRM range -->.
- Constraints: `a ≠ b`.
- Exclusions: `a = b`.
- Misconceptions targeted: treating larger magnitude as larger value (`-5 > -3` because `5 > 3`)
  — every distinct negative-integer pair naturally tests this, no special crafting needed.

**Level 3 — Negative decimals (apex):**
- Parameters: two distinct negative decimals, magnitude 0.01–20.00, 1dp or 2dp, built the same
  way as Level 1 (~50% same-whole-number-part trap pairs). **CONFIRM:** ~20% of questions instead
  draw one negative and one positive decimal (crossing zero) for the combined sign+magnitude
  apex case, matching your original Tier 5.
- Constraints: `a ≠ b`.
- Exclusions: `a = b`.
- Misconceptions targeted: combined sign-reversal + decimal-tail trap — e.g. `-3.4` vs `-3.09`:
  naive digit-reading says `-3.4` "looks bigger" (tenths `4 > 0`); correct answer is `-3.09`
  (closer to zero, so actually the larger value).

#### 3.3 Worked example script

Steps shown are for **Symbols** mode; **Words** mode uses the same reasoning steps but ends at
the "Answer:" step (no final inequality-statement step), and the question text differs (see 3.4).

**Level 1 — question: `4.19 ▢ 4.2`**
1. `mStep("Compare the whole number parts:", "4 = 4")`
2. `mStep("Whole numbers match, so compare the tenths digit:", "1 < 2")`
3. `mStep("So:", "4.19 < 4.2")` *(Words mode ends instead at `mStep("Answer:", "4.2")`)*

**Level 2 — question: `-5 ▢ -3`**
1. `mStep("Compare the sizes, ignoring the negative signs:", "5 > 3")`
2. `mStep("For negative numbers, the smaller size is the bigger value:", "-3 > -5")`
3. `mStep("So:", "-5 < -3")` *(Words: `mStep("Answer:", "-3")`)*

**Level 3 — question: `-3.4 ▢ -3.09`**
1. `mStep("Both negative with the same whole number part — compare the decimal parts as sizes:", "0.40 > 0.09")`
2. `mStep("The bigger decimal part is closer to zero, so it's the bigger value:", "-3.09 > -3.4")`
3. `mStep("So:", "-3.4 < -3.09")` *(Words: `mStep("Answer:", "-3.09")`)*

#### 3.4 Sample questions (acceptance set)

| Level | Question as displayed | Answer | Working (one line) |
|---|---|---|---|
| 1 | Words: "Which is bigger: 4.2 or 4.19?" | 4.2 | Tenths: 2 > 1 |
| 1 | Symbols: "Insert < or >: 6.5 ▢ 6.53" | 6.5 < 6.53 | Hundredths: 0 < 3 |
| 1 | Words: "Which is bigger: 2.7 or 3.1?" | 3.1 | Whole numbers: 2 < 3 |
| 2 | Symbols: "Insert < or >: -8 ▢ -2" | -8 < -2 | Sizes 8 > 2, negative reverses |
| 2 | Words: "Which is smaller: -11 or -14?" | -14 | Sizes 11 < 14, so -14 more negative |
| 2 | Symbols: "Insert < or >: -1 ▢ -19" | -1 > -19 | Sizes 1 < 19, negative reverses |
| 3 | Words: "Which is bigger: -3.4 or -3.09?" | -3.09 | Decimal parts 0.40 > 0.09, closer to 0 |
| 3 | Symbols: "Insert < or >: -0.6 ▢ 0.2" | -0.6 < 0.2 | Negative is always less than positive |
| 3 | Words: "Which is smaller: -7.25 or -7.2?" | -7.25 | Decimal parts 0.25 > 0.20 → -7.25 further from 0 |

#### 3.5 Uniqueness

Key parameters: `level`, `notation`, `a`, `b` (as generated numeric values, not display strings),
random id.

**Pool size:** Level 1/3 (two independent decimals, 1–2dp, 0–9/0–20 integer range) comfortably
exceed 15 distinct pairs. Level 2 (20 negative integers, unordered pair, no repeats) gives
`20×19/2 = 190` distinct pairs — no issue.

---

### Sub-tool: Order (`order`)

#### 3.1 Question options (QO)

- **dropdown** `notation` — "Notation":
  - `words` — "Words" — defaultActive (plain ordered list answer)
  - `symbols` — "Symbols" (answer written as an inequality chain, e.g. `-9 < -7 < -4`)
- **multiSelect** `direction` — "Direction":
  - `ascending` — "Ascending" — defaultActive
  - `descending` — "Descending" — defaultActive
- **Per-level differences:** none.

Both controls reformat instantly (`reformatQuestion`) from the same stored value list — direction
just reverses the stored sorted order, notation rebuilds the question/answer text.

#### 3.2 Levels

**Level 1 — Decimals, 3 numbers:**
- Parameters: 3 distinct positive decimals, same construction as Compare L1 (1–2dp, integer part
  0–9, ~50% of the list containing at least one same-whole-number-part pair).
- Constraints: all 3 values distinct.
- Exclusions: any duplicate value.
- Misconceptions targeted: same as Compare L1, now requiring the student to sustain the
  column-by-column comparison across 3 items rather than 2.

**Level 2 — Negative integers, 4 numbers:**
- Parameters: 4 distinct negative integers from −20 to −1.
- Constraints: all 4 distinct.
- Exclusions: any duplicate value.
- Misconceptions targeted: sign-reversal, now across a full list (a student who sorts by
  magnitude instead of value gets the list exactly backwards — a visibly wrong answer, not a
  partial one).

**Level 3 — Negative decimals, 5 numbers (apex):**
- Parameters: 5 distinct negative decimals as Compare L3, with **CONFIRM** ~40% of questions
  including 1–2 positive decimals among the 5 (crossing zero) — matching your original apex
  example (`-1.2, 0.4, -1.19, 0.28, -1.05`).
- Constraints: all 5 distinct.
- Exclusions: any duplicate value.
- Misconceptions targeted: combined sign + decimal-tail trap sustained across a full list —
  the hardest visible collapse point for a student without a systematic method.

<!-- CONFIRM: fixed 5 at L3, or randomise 5–6? Fixed 5 keeps worked-example scripting simpler;
     5–6 adds variety. Defaulting to fixed 5 unless you'd rather vary it. -->

#### 3.3 Worked example script

**Level 1 — question: order `4.19, 4.08, 4.2` (ascending)**
1. `mStep("Compare the whole number parts:", "4 = 4 = 4")`
2. `mStep("Whole numbers match — compare the tenths digits:", "0 < 1 < 2")`
3. `mStep("So:", "4.08 < 4.19 < 4.2")` *(Words: `mStep("Answer:", "4.08, 4.19, 4.2")`)*

**Level 2 — question: order `-7, -2, -9, -4` (ascending)**
1. `mStep("Compare the sizes, ignoring signs:", "9 > 7 > 4 > 2")`
2. `mStep("Negative reverses the order — biggest size is smallest value:", "-9 < -7 < -4 < -2")`
3. `mStep("So:", "-9 < -7 < -4 < -2")` *(Words: `mStep("Answer:", "-9, -7, -4, -2")`)*

**Level 3 — question: order `-1.2, 0.4, -1.19, 0.28, -1.05` (ascending)**
1. `tStep("Negative numbers are always smaller than positive numbers.")`
2. `mStep("Order the negatives (biggest size = smallest value):", "-1.2 < -1.19 < -1.05")`
3. `mStep("Order the positives (compare decimal parts):", "0.28 < 0.4")`
4. `mStep("So:", "-1.2 < -1.19 < -1.05 < 0.28 < 0.4")` *(Words: `mStep("Answer:", "-1.2, -1.19, -1.05, 0.28, 0.4")`)*

#### 3.4 Sample questions (acceptance set)

| Level | Question as displayed | Answer | Working (one line) |
|---|---|---|---|
| 1 | Words, asc: "Order smallest first: 4.19, 4.08, 4.2" | 4.08, 4.19, 4.2 | Tenths: 0 < 1 < 2 |
| 1 | Symbols, desc: "Write as a chain, largest first: 2.7, 3.1, 2.65" | 3.1 > 2.7 > 2.65 | Whole numbers then tenths |
| 1 | Words, asc: "Order smallest first: 6.5, 6.53, 6.05" | 6.05, 6.5, 6.53 | Whole numbers tie, then tenths |
| 2 | Symbols, asc: "Write as a chain, smallest first: -7, -2, -9, -4" | -9 < -7 < -4 < -2 | Sizes 9>7>4>2, reversed |
| 2 | Words, desc: "Order largest first: -11, -3, -14, -6" | -3, -6, -11, -14 | Sizes reversed |
| 3 | Words, asc: "Order smallest first: -1.2, 0.4, -1.19, 0.28, -1.05" | -1.2, -1.19, -1.05, 0.28, 0.4 | Negatives first, then positives, each by decimal part |
| 3 | Symbols, asc: "Write as a chain, smallest first: -3.4, -3.09, -3.25, -3.5, -3.02" | -3.5 < -3.4 < -3.25 < -3.09 < -3.02 | All same whole part, decimal-part order reversed by sign |

#### 3.5 Uniqueness

Key parameters: `level`, `notation`, `direction`, the value list (as generated numeric values),
random id.

**Pool size:** L1 (3 of a wide decimal space) and L3 (5 of a wide decimal space) comfortably
exceed 15. L2 (4 distinct from 20 negative integers, unordered) = `C(20,4) = 4845` combinations —
no issue.

---

## 4. Variety requirements

- At every level, keep the same-whole-number-part trap rate at roughly the stated proportion
  (~50% Compare/Order L1 & L3) rather than 0% or 100% — a worksheet that's all traps or no traps
  stops testing the actual misconception.
- Spread integer parts across the full stated range (0–9 for decimals, full −20..−1 for
  negatives) — don't cluster near one end.
- Randomise which operand is written first in Compare (`a ▢ b` vs `b ▢ a`) and which
  direction (ascending/descending, when both active) is asked in Order, so students can't
  pattern-match position.
- In Order, vary how close together the values are — some lists with values that differ only in
  the last decimal place, some clearly spread out — so students can't just eyeball magnitude
  every time.

---

## 5. Info modal content

**Compare tab:**
- Overview: "Compare two numbers and say which is bigger — first in plain words, then using `<`
  and `>` symbols."
- Level 1 — Decimals: "Positive decimals, including pairs that share the same whole number part —
  targets the 'longer decimal tail means bigger' misconception."
- Level 2 — Negative integers: "Targets the 'bigger digit means bigger value' misconception for
  negative numbers."
- Level 3 — Negative decimals: "Combines both misconceptions, including numbers either side of
  zero."

**Order tab:**
- Overview: "Order a short list of numbers, smallest to largest or largest to smallest — in
  words, then as an inequality chain."
- Level 1 — Decimals (3 numbers): "Same decimal-tail trap as Compare, sustained across a list."
- Level 2 — Negative integers (4 numbers): "Sign-reversal trap across a full list — sorting by
  size alone gives the list exactly backwards."
- Level 3 — Negative decimals (5 numbers): "The full trap set together, including numbers on
  both sides of zero."

---

## 6. Out of scope / future ideas

- Plain positive-integer-only baseline (no negatives/decimals) — deliberately dropped; could be
  added later purely for parity with other tools but isn't needed for this class.
- Fractions in the comparison/ordering pool.
- A number-line diagram sub-tool (visual placement rather than written comparison) — natural
  future extension once this text-based version is proven, using the site's existing Number Line
  representation family.
- Comparing/ordering more than 6 numbers, or mixed fraction+decimal+percentage sets.

---

## Implementation note (not part of the template — for the builder)

Store `_rawValues` on every question (`{ a, b }` for Compare; `{ values: number[] }` for Order,
plus the drawn `direction` for Order) so `reformatQuestion` can rebuild question text/answer for
a Notation (and, for Order, Direction) change without a fresh draw — same pattern as
`CompletingTheSquare.tsx`.
