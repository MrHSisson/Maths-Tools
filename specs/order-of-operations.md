# Tool Spec: Order of Operations (BIDMAS)

**Status:** implemented — `src/tools/Number/OrderOfOperations.tsx`, registered **dev-gated**
(`enabled: false`, Number → group "Order of operations"). Engine tests:
`src/tests/orderOfOperations.test.ts`.

**Origin:** the Functional Skills generator already has a BIDMAS skill (≈30 hand-written 2–3 step
templates: brackets, squares; negatives only as a "no negative answers" filter; no decimals, cubes,
roots or fraction bars). This tool is the ToolShell version — whiteboard, worked example, worksheet —
with the missing content and, above all, working that *shows the order*.

## What it does
Two sub-tools, three levels each.

**Evaluate** (`instruction: "Work out:"`) — one `SimpleQuestion` expression; answer is a number.
**Brackets & Mistakes** — `WordedQuestion`, two tasks drawn from a pool:
- *Insert brackets*: one pair of brackets makes `2 + 3 × 4 + 1 = 21` true. Exactly one placement gives
  the target, the target differs from the unbracketed value and is ≥ 1.
- *Spot the mistake*: the student's working is shown line by line (`9 + 4 × 3 + 2` → `13 × 3 + 2` → `39 + 2` → `41`, the left-to-right error). Answer: the correct value with the mistake named in `answerSuffix`; the first working step explains it. Every draw is rejected unless the student's lines really end at the wrong answer.
- *Is it correct?* (from the class worksheet): "Matthew says `9 + 3 × 2 = 15`. Is Matthew correct?" Half true, half a classic mistake; answer "Yes/No: expr = value".

## The order used (stated in the info modal)
Brackets (innermost first; **a root sign and the top and bottom of a fraction bar act as brackets**) →
indices and roots → × and ÷ left to right → + and − left to right. Independent operations of the same
stage in different places go in one step (`2 × 3 + 4 × 5` → `6 + 20`); a chain is one operation per
step so left-to-right is visible.

## Worked-example working
Each step is `mStep(stage label, [line with the next move boxed, "= next line"])` — the line is
rewritten, the part being done is boxed amber (`\colorbox`), then the result line arrives on the next
press. Labels name the stage ("Indices:", "Divide (left to right):", "Brackets — add:", "Under the root
— …", "Divide the top by the bottom:"). No new representation.

## Content by level (Evaluate) — Question Types pool + Numbers pool, both weighted (Smart Progressor)
| Level | Question Types (default on) | Numbers |
|---|---|---|
| 1 | Operations, Brackets (offered: Left to right, Indices — squares only) | whole only |
| 2 | Left to right, Brackets, Indices (squares and cubes), Brackets + indices (offered: Operations, Roots, Fraction bar) | Whole ✓, Negatives |
| 3 | Indices, Brackets + indices, Roots, Fraction bar, Nested brackets (offered: the rest) | Negatives ✓, Decimals ✓, Whole |
One Numbers option is drawn per question (mutually exclusive), so the pools are weighted pools, not toggles.
Whole mode never has a negative intermediate or answer. Negatives mode always contains a negative
number (including the trap `−3²` and `(−3)²`). Decimals mode: one-decimal operands, ≤ 2 dp throughout.
All values ≤ 500; every division exact.

## Mistake pool (Brackets & Mistakes)
L1: left to right · brackets ignored. L2: + × before ÷ · + before −. L3: + base × index (3² = 6) ·
negative squared (−3² = 9). Each draw is rejected unless the wrong answer differs from the right one.

## Acceptance / correctness reference (all asserted in `orderOfOperations.test.ts`)
- `3 + 4 × 2²` → `3 + 4 × 4` → `3 + 16` → `19` (labels Indices, Multiply, Add).
- `8 ÷ 2 × 3` → `4 × 3` → `12` (label "Divide (left to right)"); `10 − 3 + 4` → `7 + 4` → `11`.
- `2 × ((3 + 4) − 1)` → `2 × (7 − 1)` → `2 × 6` → `12` (innermost bracket first).
- `−3² + 5` = −4 but `(−3)² + 5` = 14; `4 − 2 × (−3)` → `4 − (−6)` → `10`.
- `√(9 + 16) + 12/(5 − 1)` → `√25 + 12/4` → `√25 + 3` → `5 + 3` → `8`.
- For every family × number mode the stepper's final value equals an independent straight evaluator.

## Not in scope / follow-ups
- No Teach deck or skill-library entries (parked gate); no `[[skill|term]]` links.
- No fractions as operands other than the fraction bar; no powers above cubes, no negative indices.
- Going live is a separate call once it has had a classroom look.

## Checked against the class worksheets (2026-10-05)
Worksheet items (7 + 2 × 3, 10 − √16, √(2 + 14), (2 + 8)³, 8² + 2 × 3², 7 × (8 ÷ 4)², 11 + 11 − 6² ÷ 2,
insert-brackets lines such as 9 + 3² × 10 ÷ 2 = 90, and the "Matthew says…" / student-working items) are asserted
in `orderOfOperations.test.ts`. Shapes added from them: a² + b × c², a + a − b² ÷ c, a × (b ÷ c)², (a + b)² or
(a + b)³, √s + b², a × b − √s; insert-brackets lines of 3–5 terms with ÷ and an occasional 1.
Not covered (by design): "make as many different answers as you can" (open investigation) and the algebra
expression-choice item (n + 2 × 3 vs (n + 2) × 3).
