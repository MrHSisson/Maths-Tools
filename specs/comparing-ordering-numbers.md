# Tool Spec: Comparing & Ordering Numbers

**Status:** implemented — `src/tools/Number/ComparingOrderingNumbers.tsx`, registered as
`enabled: false` (dev-gated) pending a decision on going live. The remaining CONFIRM ranges below
were finalised at their proposed defaults (whole-number-part 1–9, integer magnitude 1–20) since
no objection was raised; revisit if they feel off in practice.

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
skill. Every misconception-provoking property (whole-number part, sign, how many numbers, and
**which named decimal-tail misconception is in play**) is a teacher-facing dial, not baked-in
randomness — and in Order, a list can genuinely stack more than one misconception across
different adjacent pairs, rather than leaning on one guaranteed "gotcha" pair surrounded by easy
filler. Sits after place-value and directed-number-line lessons, before formal
inequality/number-line notation work.

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
  - **multiSelect** `trapType` — "Trap type" (teacher picks which misconceptions are in play;
    all active options give natural variety by default, deactivating any narrows the pool):
    - `clean` — "No trap" — defaultActive **true**
    - `longerIsSmaller` — "Longer looks smaller" — defaultActive **true**
    - `shorterIsSmaller` — "Shorter looks smaller" — defaultActive **true**
    - `wrongPriority` — "Wrong-priority digit" — defaultActive **true**
    - `ignoreWholePart` — "Ignore the whole number" — defaultActive **true**, but **only offered
      (and only ever drawn) when `wholeNumberPart` allows a non-zero part** — with `wholeNumberPart`
      pinned to `zeroOnly`, there's no whole part to ignore, so this option is hidden/inert.
- **Level 2 — Integers:**
  - **multiSelect** `sign` — "Sign": `positive` (weight 1, defaultActive **false**) / `negative`
    (weight 2, defaultActive **true**). *Default: Exclusive (every number negative).*
- **Level 3 — Decimals + sign (apex):** `wholeNumberPart` and `trapType` reused unchanged from
  Level 1 (`wholeNumberPart` default **Mixed**), plus `sign` reused from Level 2 (default
  **Exclusive negative**) — three pools available together.

#### 3.2 Levels

**Level 1 — Decimals:**
- Parameters: two distinct positive decimals `a`, `b`. Decimal part: 1–3dp (house rule above).
  **Whole-number part depends on which `trapType` is drawn for this pair, not an independent
  per-number choice:**
  - For `clean` and `ignoreWholePart`: each number's whole part is drawn per `wholeNumberPart`
    (`0` under `zeroOnly`, or **1–9** <!-- CONFIRM range --> under `nonzero`) — independently per
    number, so they may match or differ.
  - For `longerIsSmaller`, `shorterIsSmaller`, `wrongPriority`: **both numbers are forced to the
    same whole part** (both `0` under `zeroOnly`; one shared value 1–9, drawn once, under
    `nonzero`) — these three traps only work when the whole part can't decide it, so it's pinned
    equal rather than left to chance.

  **The decimal-tail digits (and, for `ignoreWholePart`, the whole parts) are drawn from the
  active `trapType` option** (`pickActive` — same mechanism as any other multiSelect pool), so
  the teacher's selection directly decides which misconceptions a worksheet can contain:
  - `clean` — the leftmost differing place (whole part if they differ, else tenths, else
    hundredths…) decides it outright, no decoy digits after that point
    (e.g. `0.42` vs `0.65`, or `4.7` vs `2.3`).
  - `longerIsSmaller` — same whole part; differing tenths digit decides it, but the number with
    *more* decimal places is the *smaller* one (e.g. `0.3` vs `0.25` → `0.3` wins on tenths alone).
  - `shorterIsSmaller` — same whole part; numbers share every digit up to where the shorter one
    simply stops (implicitly zero-padded), so the *longer* number always wins (e.g. `0.2` vs
    `0.25` → `0.25` wins because `0.20 < 0.25`). Mathematically guaranteed correct by construction.
  - `wrongPriority` — same whole part; the tenths digit correctly decides it, but the *losing*
    number's hundredths **and/or** thousandths digits are individually bigger than the winner's
    at the same place (e.g. `0.311` vs `0.259` → `0.311` wins on tenths despite `0.259` having
    bigger digits in both later places — the winner's own later digits may be smaller, zero, or
    simply absent; only the loser's need to be inflated).
  - `ignoreWholePart` — **different** whole parts correctly decide it, but the *losing* number's
    tenths digit (and beyond) is bigger than the winner's (e.g. `4.2` vs `3.9` → `4.2` wins on the
    whole part alone, `4 > 3`, despite `3.9`'s tenths digit `9` being bigger than `4.2`'s `2`).
- Constraints: `a ≠ b`.
- Exclusions: `a = b`.
- Misconceptions targeted: `longerIsSmaller` → "more digits after the point = bigger value."
  `shorterIsSmaller` → "a place with no digit there beats one that has a (smaller-looking) digit."
  `wrongPriority` → "compare the biggest/rightmost digits, not the leftmost place value."
  `ignoreWholePart` → "just look at the decimal part, the whole number doesn't matter." `clean`
  is the procedural control case (no trap, just column-by-column comparison).

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
- Parameters: Level 1's decimal construction (all five `trapType` options, still capped at 3dp),
  combined with Level 2's sign draw — magnitude **0.001–20.000** <!-- CONFIRM range -->.
- Constraints: `a ≠ b`.
- Exclusions: `a = b`.
- Misconceptions targeted: any `trapType` **compounded with** the Level 2 sign-reversal — e.g.
  `shorterIsSmaller` under a negative sign: `-0.2` vs `-0.25` → magnitude says `0.25 > 0.2`, but
  the negative sign reverses it, so `-0.2 > -0.25`. Two independent traps stacked in one question.
  Note `ignoreWholePart` requires `wholeNumberPart` to allow non-zero, same as Level 1.

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

**Level 1 — `ignoreWholePart`, question: `4.2 ▢ 3.9`**
1. `mStep("Compare the whole number parts first — they outweigh everything after the point:", "4 > 3")`
2. `mStep("The decimal digits don't matter once the whole number part has decided it:", "4.2 > 3.9")`

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
| 1 | Ignore-whole-part | Words: "Which is bigger: 4.2 or 3.9?" | 4.2 | Whole parts: 4 > 3 (tenths digit is a decoy) |
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
- **Per-level `wholeNumberPart` / `sign` / `trapType` pools:** identical shape and defaults to
  Compare §3.1.

#### 3.2 Levels

**Level 1 — Decimals, 3–6 numbers (default 3):**
- Parameters: `count` distinct positive decimals, same digit rules as Compare Level 1 (1–3dp).
  Build the list by walking the **sorted** order left to right: the first number is drawn freely
  (whole part per `wholeNumberPart`); each subsequent number is constructed **relative to the one
  before it**, drawing a `trapType` option for that gap (`pickActive`, same pool as Compare) and
  applying Compare's construction rule for that type. Whole part follows the same per-trap rule as
  Compare — `longerIsSmaller`/`shorterIsSmaller`/`wrongPriority` **inherit** the previous number's
  whole part unchanged (so the trap holds regardless of what earlier gaps did); `clean`/
  `ignoreWholePart` draw a fresh whole part per `wholeNumberPart`. No backtracking is needed —
  each number only has to satisfy the one gap that created it. This means a list can end up with
  zero, one, or several gaps carrying a trap, and **different trap types can appear in the same
  list** (e.g. one gap a `shorterIsSmaller` pair, the next a `longerIsSmaller` pair) — every gap is
  a real, checkable misconception opportunity, not decoration around one guaranteed pair.
- Constraints: all values distinct.
- Exclusions: any duplicate value.
- Misconceptions targeted: same three trap types as Compare Level 1, now potentially compounding
  across a list — a student who trusts "longer/shorter = bigger" as a blanket rule can be wrong at
  more than one point in the same question, which a single guaranteed trap pair can't test.

**Level 2 — Integers, 3–6 numbers (default 4):**
- Parameters: `count` distinct integers, built exactly as Compare Level 2.
- Constraints: all values distinct.
- Exclusions: any duplicate value.
- Misconceptions targeted: same as Compare Level 2 — sorting by magnitude alone gives the list
  exactly backwards under Exclusive-negative.

**Level 3 — Decimals + sign, 3–6 numbers (default 5):**
- Parameters: `count` distinct decimals, built with Level 1's per-gap `trapType` draw, then signed
  per the `sign` cycle.
- Constraints: all values distinct.
- Exclusions: any duplicate value.
- Misconceptions targeted: Level 1's trap types compounded with Level 2's sign-reversal, sustained
  and potentially repeated across a list — the hardest visible collapse point without a
  systematic method.

#### 3.3 Worked example script

**Level 1 — two different traps in one list, question: order `0.3, 0.25, 0.259` (ascending)**
*(`0.25`↔`0.259` is a `shorterIsSmaller` gap; `0.259`↔`0.3` is a `longerIsSmaller` gap — both
active in the same question.)*
1. `mStep("Compare 0.25 and 0.259 — same tenths and hundredths, so compare thousandths:", "0 < 9")`
2. `mStep("Compare 0.259 and 0.3 — the tenths digit decides regardless of how many places each has:", "2 < 3")`
3. `mStep("So:", "0.25 < 0.259 < 0.3")`

**Level 2 — Exclusive negative, question: order `-7, -2, -9, -4` (ascending)**
1. `mStep("Compare the sizes, ignoring signs:", "9 > 7 > 4 > 2")`
2. `mStep("Negative reverses the order:", "-9 < -7 < -4 < -2")`

**Level 3 — question: order `-0.2, -0.65, -0.25` (ascending)**
1. `mStep("Compare the sizes, ignoring the negative signs:", "0.2 < 0.25 < 0.65")`
2. `mStep("Negative reverses the order:", "-0.65 < -0.25 < -0.2")`

#### 3.4 Sample questions (acceptance set)

| Level | Config | Question as displayed | Answer | Working (one line) |
|---|---|---|---|---|
| 1 | count 3, two traps | Words, asc: "Order smallest first: 0.3, 0.25, 0.259" | 0.25, 0.259, 0.3 | shorterIsSmaller then longerIsSmaller gap |
| 1 | count 4, clean only | Symbols, desc: "Write as a chain, largest first: 0.65, 0.42, 0.311, 0.259" | 0.65 > 0.42 > 0.311 > 0.259 | Tenths decide each pair, no traps |
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

- `trapType` is a standard (unweighted) multiSelect pool — `pickActive` draws uniformly from
  whichever options the teacher has left active, per pair (Compare) or per gap (Order). With all
  four active by default this already gives roughly-even natural variety; a teacher narrowing the
  pool (e.g. only `shorterIsSmaller`) gets every question/gap testing just that misconception.
- Order specifically: because each gap draws independently, don't let the "how many gaps actually
  end up trap-vs-clean" outcome be too front-loaded or back-loaded — no per-tool code needed
  beyond the independent per-gap draw itself, but sanity-check on a generated worksheet that
  multi-trap lists (2+ non-clean gaps) show up regularly, not just as a rare edge case, once
  `clean` isn't the only active option.
- When `sign`/`wholeNumberPart` cycles are in Mixed state, the existing Smart Progressor
  (`buildQuotaOverrides`) already keeps the split roughly even — no extra tool code needed.
- Spread whole-number parts and integer magnitudes across their full stated ranges.
- Randomise which operand is written first in Compare, and which direction is asked in Order.

---

## 5. Info modal content

**Compare tab:**
- Overview: "Compare two numbers and say which is bigger — first in plain words, then with `<`
  and `>`. Choose exactly which decimal misconception(s) to drill with the Trap type control, or
  leave all active for natural variety."
- Level 1 — Decimals: "Pure `0.___` comparison up to thousandths. Trap type lets you isolate
  'longer looks smaller', 'shorter looks smaller' or 'wrong-priority digit' — or mix them.
  'Allow whole numbers' adds the 'ignore the whole part' trap on top."
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
