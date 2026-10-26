# Tool Spec: Ratio Manipulation

**Status:** draft <!-- draft → ready → implemented. Claude Code only implements specs marked `ready`. -->

Replaces two tools: **Fractions ↔ Ratios** (`/fraction-to-ratio`, renamed) and **Simplifying Ratios** (`/simplifying-ratios`, never live, removed). Three of the five sub-tools (Forming Ratios, Fraction to Ratio, Ratio to Fraction) are unchanged; this brief specifies the two new tabs (**Simplifying**, **Equivalent Ratios**) and the move. Closest reference for the multiple-choice level: Collecting Like Terms, Spot the Like Term (`src/tools/Algebra/CollectingLikeTerms.tsx`, `finishMCQ`, `_mcq`). Closest reference for the ratio-table working: `src/tools/Proportion/SpeedDistanceTime.tsx`.

---

## 1. Overview

| Field | Value |
|---|---|
| Tool name | Ratio Manipulation |
| Tool id / URL path | `ratio-manipulation` · `/ratio-manipulation` (alias `/fraction-to-ratio` keeps old links working) |
| Category | Ratio & Proportion (group "Ratio") |
| Card description | Form, simplify and scale ratios, and change between ratios and fractions. |
| Defaults | standard; `hideAnswerStep: true` as Simplifying Ratios had; `toolTabRows: [3, 2]` |

**Pedagogical intent:** a student can write a ratio, reduce it to simplest form (with whole numbers, units, decimals, fractions or letters), build an equivalent ratio by scaling, and move between ratios and fractions. The tabs run in teaching order: forming, simplifying, equivalent, then fractions.

**Migration.** Rename the id `fraction-to-ratio` → `ratio-manipulation` (file `FractionToRatio.tsx` → `RatioManipulation.tsx`, with its `.about.ts`), page title "Ratio Manipulation", `aliases: ['/fraction-to-ratio']`. Remove the `simplifying-ratios` registry entry and its files once its generators are moved into `src/tools/Proportion/ratioSimplifying.ts` (a module, so the tool file stays small). Copy the dashboard notes of both old ids onto `ratio-manipulation`, then remove the old ones. Update `organisation.test.ts`. Run `npm run facts`.

---

## 2. Sub-tools

| Key | Tab label | Kind | Instruction line |
|---|---|---|---|
| `formingRatios` | Forming Ratios | worded | — (unchanged) |
| `simplifying` | Simplifying | worded | — (the prompt is in the question lines, see 3) |
| `equivalentRatios` | Equivalent Ratios | worded at Level 1, simple at Levels 2–3 | — |
| `fractionToRatio` | Fraction to Ratio | worded | — (unchanged) |
| `ratioToFraction` | Ratio to Fraction | worded | — (unchanged) |

---

## 3. Sub-tool detail

### Sub-tool: Simplifying (`simplifying`)

#### 3.1 Question options (QO)

- **multiSelect** `questionTypes` — "Question Types" (one drawn per question; `balanced: true`):
  - `wholeNumbers` — "Whole Numbers" — defaultActive: true
  - `units` — "Different Units" — false
  - `decimals` — "Decimals" — false
  - `fractions` — "Fractions" — false
  - `letters` — "Letters" — false
  - `alreadySimplest` — "Already Simplest" — false
- **multiSelect** `askFor` — "Ask for" (`exclusive: true`):
  - `simplest` — "Simplest Form" — defaultActive: true
  - `oneToN` — "1 : n" — false; `requires: ["wholeNumbers"]`
  - `nToOne` — "n : 1" — false; `requires: ["wholeNumbers"]`
- The generator ignores a blocked option (`maskUnmetOptions`), keeping "Simplest Form" as the fallback. Level 3 whole numbers (three parts) always ask for simplest form.
- **Per-level differences:** none.

#### 3.2 Levels

The level sets how hard whatever type was drawn is.

**Level 1:**
- *Whole numbers:* two parts, simplest form `a : b` with `a, b` in 1–5 coprime, common factor 2–5, both given parts 4–20 (as the old Numeric Level 1).
- *Different units:* `A big-unit : B small-unit`, factors 100 (m/cm, £/p) and 1000 (kg/g, km/m, l/ml); `A` in 1–5; simplest form `a : b` coprime with `a, b` ≤ 12; `B = A·f·b/a` must be an integer (reject otherwise). Never `1 : 1`.
- *Decimals:* one decimal place both parts (`0.6 : 0.9`), simplest form with parts ≤ 12.
- *Fractions:* same denominator (`1/4 : 3/4`), answer is the numerators over their gcd.
- *Letters:* one shared factor, a number, a letter, or a letter to a power (as the old Algebraic Level 1, including its three-way random pick, now just the generator).
- *Already simplest:* coprime parts 1–9, not equal.
- *Exclusions (all):* a ratio of equal parts; an answer with a part of 1 and the other of 1; repeated keys.

**Level 2:**
- *Whole numbers:* two parts, common factor from {6, 8, 9, 10, 12, 15, 18}, parts 12–60 (as old Numeric Level 2).
- *Different units:* adds minutes/hours (f = 60); `A` in 1–9.
- *Decimals:* one or two decimal places (`0.15 : 0.45`).
- *Fractions:* different denominators from {2, 3, 4, 5, 6, 8, 10} (`1/2 : 3/4`), working multiplies both by the common denominator.
- *Letters:* a number and a letter together, or one term with a squared letter (as old Algebraic Level 2).
- *Already simplest:* coprime parts 5–20.

**Level 3:**
- *Whole numbers:* **three parts** `a : b : c`, simplest form coprime as a triple, common factor from the Level 2 set, parts up to 60 (as old Numeric Level 3).
- *Different units, Decimals:* two parts, harder (`1.5 : 4`, `3 kg : 1200 g`), answer parts ≤ 30.
- *Fractions:* denominators not dividing each other (`2/3 : 5/6`), answer parts ≤ 30.
- *Letters:* two letters in both terms at different powers plus a number (as old Algebraic Level 3).
- *Already simplest:* coprime parts up to 40.

**Constraints:** the answer is always in simplest form (parts coprime) and the question is never already simplest unless the type is "Already Simplest". For "1 : n" the smaller simplified part must be 1, 2, 4, 5 or 8 so that `n` terminates (`6 : 15` → `1 : 2.5`); for "n : 1" the larger one likewise.

**Misconceptions targeted:** dividing by a common factor of only one part; stopping before the highest common factor (the prime-by-prime working shows it); not converting units before simplifying; treating `0.6 : 0.9` as already simple; leaving fractions in the ratio; forgetting a letter cancels.

#### 3.3 Worked example script

Whole numbers keep the old prime-by-prime working: one `step("<ratio> \\div p = <ratio>")` per prime, no final answer step (`hideAnswerStep`). Other types add a first step:
- *Units:* `mStep("Write both parts in the same unit:", "2 \\text{ m}…")` — **no `\text{}`**: give the converted ratio only, `mStep("Convert 2 m to 200 cm:", "200 : 50")`, then the division steps.
- *Decimals:* `mStep("Multiply both parts by 10:", "0.6 : 0.9 = 6 : 9")`, then divisions.
- *Fractions:* `mStep("Multiply both parts by the common denominator, 4:", ["\\dfrac{1}{2} : \\dfrac{3}{4}", "= 2 : 3"])`, then divisions.
- *Letters:* as the old Algebraic working (`Divide both parts by …`).
- *Already simplest:* `mStep("No common factor other than 1:", "7 : 9")`, already in simplest form.

#### 3.4 Sample questions (acceptance set)

| Level | Question as displayed | Answer | Working (one line) |
|---|---|---|---|
| 1 | Simplify: `8 : 12` | `2 : 3` | ÷4 |
| 1 | Simplify: `9 : 15` | `3 : 5` | ÷3 |
| 1 | Simplify: `2 m : 50 cm` | `4 : 1` | 2 m = 200 cm; `200 : 50` ÷50 |
| 1 | Simplify: `0.6 : 0.9` | `2 : 3` | ×10 → `6 : 9` ÷3 |
| 1 | Simplify: `1/4 : 3/4` | `1 : 3` | ×4 → `1 : 3` |
| 1 | Simplify: `3x^2 : 5x` | `3x : 5` | ÷x |
| 2 | Simplify: `45 : 72` | `5 : 8` | ÷9 (÷3, ÷3) |
| 2 | Simplify: `1/2 : 3/4` | `2 : 3` | ×4 → `2 : 3` |
| 2 | Simplify: `0.15 : 0.45` | `1 : 3` | ×100 → `15 : 45` ÷15 |
| 3 | Simplify: `24 : 36 : 60` | `2 : 3 : 5` | ÷12 (÷2, ÷2, ÷3) |
| 3 | Simplify: `2/3 : 5/6` | `4 : 5` | ×6 → `4 : 5` |
| 3 | Simplify: `3 kg : 1200 g` | `5 : 2` | `3000 : 1200` ÷600 |
| any | Write `6 : 15` in the form `1 : n` | `1 : 2.5` | ÷3 → `2 : 5`; ÷2 → `1 : 2.5` |
| any | Simplify: `7 : 9` | `7 : 9` | no common factor |

#### 3.5 Uniqueness

Key parameters: type, level, the displayed parts (as a string) and the ask-for form, plus a random id. Pools are large except Already Simplest at Level 1 (about 30 pairs): widen to parts 1–12 if a 24-question sheet repeats.

---

### Sub-tool: Equivalent Ratios (`equivalentRatios`)

The level sets the **method**, not just the size: pick, then scale directly, then simplify-and-scale.

#### 3.1 Question options (QO)

- **Level 1:** none.
- **Level 2 and 3:** **multiSelect** `askFor` — "Ask for" (`balanced: true`): `secondPart` — "Second Part" (defaultActive: true) · `firstPart` — "First Part" (false). Ticking both mixes them.
- **Level 2 only:** **multiSelect** `direction` — "Direction": `up` — "Scale Up" (true) · `down` — "Scale Down" (false).
- Levels offered: all three.

#### 3.2 Levels

**Level 1 — pick the equivalent ratio (A–D, one correct answer):**
- Parameters: simplest form `a : b` coprime, `a, b` in 1–9, `a ≠ b`; scale factor `k` in 2–6 with `k·a` and `k·b` ≤ 54. Prompt: "Which ratio is equivalent to `a : b`?" Four options `A)` to `D)`, shuffled.
- Correct option `ka : kb`. Three distractors drawn from these four, each with an `explain` note naming the mistake:
  - *additive:* `ka : (b + (k−1)a)` — "added the same amount to both parts instead of multiplying";
  - *one part scaled:* `ka : b` — "multiplied only the first part";
  - *swapped:* `kb : ka` — "the parts are in the wrong order";
  - *near miss:* `ka : (kb ± 1)` — "second part is one out".
- Constraints: no distractor is equivalent to `a : b` (cross-multiply check), no two options are equal. Exclusions: `a = b`; `k = 1`.
- Misconceptions targeted: additive thinking; scaling one part; reversing the order.

**Level 2 — scale directly by a whole number (missing value):**
- Parameters: simplest form `a : b`, `a ≠ b`, coprime, `a, b` in 1–9; whole-number factor `k` in 2–9 with parts ≤ 90. Displayed `a : b = ka : ?` (Scale Up, second part asked). *First Part* gives `a : b = ? : kb`. *Scale Down* gives the given ratio as `ka : kb` and the target as `a : ?` (or `? : b`), a division by `k`.
- Answer: the missing part, a whole number.
- Misconceptions targeted: additive thinking (`2 : 5 = 4 : 7`); applying the factor to only one part.

**Level 3 — simplify, then scale:**
- Parameters: simplest form `a : b` coprime, `a ≠ b`, `a, b` in 1–8; `g` in 2–6 gives the displayed ratio `ga : gb`; `m` in 2–7 gives the target `ma : ?` with the answer `mb`. Neither `g` divides `m` nor `m` divides `g` (so the factor from the given to the target, `m/g`, is never a whole number or a whole-number division). Parts ≤ 60. Displayed `ga : gb = ma : ?` (First Part asked mirrors it).
- Examples: `4 : 10 = 6 : ?` (÷2 → `2 : 5`, ×3 → `6 : 15`), `12 : 18 = 10 : ?`.
- Misconceptions targeted: trying to scale `4 → 6` directly (a fraction factor); adding 2 to each part.

Uniqueness: key includes level, the displayed parts, `k` or `(g, m)`, which part is asked, and a random id.

#### 3.3 Worked example script

- **Level 1:** `mStep("Compare the first parts:", ["a \\times k = ka"])`, `mStep("Do the same to the second part:", ["b \\times k = kb"])`, `mStep("So the equivalent ratio is:", "ka : kb")`. The answer reveals the letter of the correct option; each wrong option's `explain` shows on the answer.
- **Level 2:** a ratio table (`rStep` / `rStepBuild` with `ratioTableStepVisual` as the developing picture): header `["First", "Second"]`, rows `[[a, b], [ka, kb]]`, operations `["\\times k"]` (Scale Down: `"\\div k"`). Then `mStep("Answer:", "kb")`.
- **Level 3:** the same table with a middle row: `[[ga, gb], [a, b], [ma, mb]]`, operations `["\\div g", "\\times m"]`. A fractional factor `m/g` is never written as one step (the ratio table rule).
- A ratio table also makes this tool eligible for the shared `ratioTableSheet` printable.

#### 3.4 Sample questions (acceptance set)

| Level | Question as displayed | Answer | Working (one line) |
|---|---|---|---|
| 1 | Which is equivalent to `3 : 5`? `A) 9:15  B) 9:11  C) 9:5  D) 15:9` | A | ×3 both parts; B added 6 to both, C scaled one part, D swapped |
| 1 | Which is equivalent to `2 : 5`? `8:20 · 8:11 · 8:5 · 20:8` (shuffled) | `8 : 20` | ×4 both; `8 : 11` added 6; `8 : 5` one part; `20 : 8` swapped |
| 1 | Which is equivalent to `4 : 3`? `8:6 · 8:7 · 8:3 · 6:8` (shuffled) | `8 : 6` | ×2 both |
| 2 | `2 : 5 = 4 : ?` | `10` | ×2 |
| 2 | `3 : 8 = ? : 24` | `9` | ×3 |
| 2 | `18 : 30 = 3 : ?` | `5` | ÷6 |
| 3 | `4 : 10 = 6 : ?` | `15` | ÷2 → `2 : 5`; ×3 → `6 : 15` |
| 3 | `12 : 18 = 10 : ?` | `15` | ÷6 → `2 : 3`; ×5 → `10 : 15` |
| 3 | `9 : 12 = ? : 20` | `15` | ÷3 → `3 : 4`; ×5 → `15 : 20` |

---

## 4. Variety requirements

Level 1 spreads which distractor types appear (all four used across a sheet) and which letter is correct. Levels 2–3 spread the asked part and the factors across their ranges; do not cluster on ×2. Simplifying's Question Types is `balanced`, so a short mixed sheet keeps every ticked type.

---

## 5. Info modal content (`RatioManipulation.about.ts`)

- Purpose: "Write, simplify and scale ratios, and change between ratios and fractions."
- `simplifying` — purpose "Divide every part of a ratio by a common factor." Levels: "Small common factors; two parts; with letters, one shared factor" · "Larger common factors; with letters, a number and a letter together" · "Three parts for whole numbers; harder units, decimals and fractions; with letters, two letters at different powers."
- `equivalentRatios` — purpose "Build a ratio that is equivalent by scaling." Levels: "Pick the equivalent ratio from four options" · "Scale directly by a whole number to find a missing value" · "Simplify first, then scale, to find a missing value."
- Options (all by id in `options`, `levelLabels.test.ts` requires one sentence each): `questionTypes`, `askFor@…` (the Simplifying form vs the Equivalent part asked), `direction`.

---

## 6. Out of scope / future ideas

- A **Method** choice (divide by the highest common factor in one go vs prime by prime).
- **Spot the odd one out** (three equivalent ratios and one not) as an Equivalent Ratios question type.
- Three-part algebraic ratios; three-part equivalent ratios.
- A Depth bank (the Level 1 distractor notes are the seed for one).
- Negative or fractional scale factors in Equivalent Ratios Level 3.
