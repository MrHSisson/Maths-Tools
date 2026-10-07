# Tool Spec: Order of Operations (BIDMAS)

**Status:** implemented — `src/tools/Number/OrderOfOperations.tsx`, registered **live**
(Number → group "Operations & calculation", alongside Adding & Subtracting Integers). Tests: `src/tests/orderOfOperations.test.ts`.
Shared piece: `src/shared/components/BidmasPyramid.tsx`.

**Origin:** the Functional Skills generator has a BIDMAS skill (≈30 hand-written templates). This is the
ToolShell version — whiteboard, worked example, worksheet — rebuilt (2026-10-05) around a progression of
**ideas** rather than a menu of variations, and checked against class worksheets.

## The principle: levels are ideas, and each builds on the one below
Each level introduces ONE new idea, and every question at that level **needs** it. Clearing the new idea
leaves a question from the level below, so Level 1 literally helps solve Level 2. Enforced in code by
`levelOf(ast)` (1 = operations only, 2 = needs a bracket or a power, 3 = needs a root, a fraction bar or
brackets inside brackets); generation rejects any draw whose level differs, so a harder idea can never
appear on an easier level and levels never overlap.

| Level | Idea | Focus options (≤ 3, all on by default) |
|---|---|---|
| 1 | **Who goes first?** × ÷ before + −; equal priority goes left to right | × ÷ before + − · Left to right · Both |
| 2 | **Things that jump the queue** — brackets, then powers (squares, cubes). A bracket may itself contain a Level 1 line. | Brackets · Powers · Both |
| 3 | **Symbols that act as brackets** — roots, the fraction bar, brackets inside brackets | Roots · Fraction bar · Nested brackets |

**Numbers** (Evaluate, Levels 2–3 only; one drawn per question, default Whole): Whole · Negatives
(brings in −3² vs (−3)² and subtracting a negative) · Decimals (L3). Whole mode never has a negative step.
Limits: values ≤ 500, every division exact, ≤ 2 d.p. in decimals mode. Pools are weighted (Smart Progressor).

**Operations** (Evaluate, all levels, all four ticked by default): + Add · − Subtract · × Multiply · ÷ Divide. A question may only use ticked
operations (a fraction bar counts as ÷; powers and roots are not operations). Lets a teacher make Left to right all × ÷ (24 ÷ 4 × 2) or all
+ − (20 − 8 + 3), or limit × ÷ before + − to, say, × and +. Not weighted. If the ticked set can't make the picked Focus, another active Focus
is tried, and only if none works is the restriction dropped. (The one pool allowed 4 options; the rest keep ≤ 3.)

## Sub-tools
**Evaluate** (`Work out:`) — one expression, a number answer.
**Spot the Mistake** — worded questions, task pool per level:
- *Spot the mistake*: the student's working line by line (`9 + 4 × 3 + 2` → `13 × 3 + 2` → `39 + 2` → `41`), find the mistake and the correct answer. A draw is rejected unless the lines really end at the wrong answer.
- *Is it correct?*: "Matthew says `9 + 3 × 2 = 15`. Is Matthew correct?" Half true, half a classic mistake.
- *Insert brackets* (**Levels 2–3 only** — brackets are the Level 2 idea): "Insert one pair of brackets to make `2 + 3 × 4 + 1 = 21` true." Exactly one placement works; L3 adds a power and 5 numbers.

Mistakes belong to the level whose idea they get wrong:
| Level | Mistakes |
|---|---|
| 1 | Ignores priority (left to right) · × before ÷ · + before − |
| 2 | Ignores brackets · Power as × (3² = 6) · −3² as 9 |
| 3 | Root of part only (√(9+16) as √9+16) · Bar not a bracket ((a+b)/c as a+b/c) |

## The BIDMAS pyramid
`BidmasPyramid` (shared): B ( ) on top, I ² ³, then **D ÷ | M ×** and **A + | S −** as split tiers — same
tier = equal priority = left to right. A KEY, not a working representation (carries no quantities), so it
is not one of the six core representations. Used as:
- **Whiteboard**: a `workingScaffold` in the working box (hide/show with the box button).
- **Worked Example**: the split picture beside the steps (`stepVisualRenderer` + `stepVisualKeepsWorking`); each step's `extra.pyramid` lights the tier in use (**strong**) and its equal-priority partner or the operation inside a bracket (**soft**) — e.g. `8 ÷ 2 × 3`: D strong, M soft, then M strong.

## Worked-example working
Each step is `mStep(stage label, [line with the next move boxed (\colorbox), "= next line"])`. Labels name the
stage ("Indices:", "Divide (left to right):", "Brackets — add:", "Under the root — …",
"Divide the top by the bottom:"). Roots and fraction bars act as brackets; independent operations of the same
stage share a step; a chain goes one operation per step.

## Acceptance / correctness reference (asserted in the tests)
- `3 + 4 × 2²` → `3 + 4 × 4` → `3 + 16` → `19`; `8 ÷ 2 × 3` → `4 × 3` → `12`; `10 − 3 + 4` → `7 + 4` → `11`.
- `2 × ((3 + 4) − 1)` → `2 × (7 − 1)` → `2 × 6` → `12`; `(3 + 4 × 2) × 5` clears the bracket with a Level 1 step first.
- `−3² + 5` = −4 but `(−3)² + 5` = 14; `4 − 2 × (−3)` → `4 − (−6)` → `10`.
- `√(9 + 16) + 12/(5 − 1)` → `√25 + 12/4` → `√25 + 3` → `5 + 3` → `8`.
- Worksheet items (7 + 2 × 3, 10 − √16, (2 + 8)³, 8² + 2 × 3², 7 × (8 ÷ 4)², 11 + 11 − 6² ÷ 2, 9 + 3² × 10 ÷ 2 = 90 with brackets, and the student-working item 9 + 4 × 3 + 2 → 41) hold.
- Every family × number mode: stepper result = independent evaluator; `levelOf` of every generated question = its level.
- Each step carries pyramid tiers: `7 + 2 × 3` → M then A; `8 ÷ 2 × 3` → D (soft M) then M; a bracket → B (soft = inner operation); a power → I.

## Not in scope
"Make as many different answers as you can" (open investigation); the algebra expression-choice item
(n + 2 × 3 vs (n + 2) × 3); Teach deck and skill-library entries (parked gate); going live (a separate call).
