# Depth Bank: Order of Operations (BIDMAS)

**Status:** implemented (pilot, awaiting review) — `src/tools/Number/OrderOfOperationsDepth.ts`, 21 items, dev-gated.

Seven items per level, following the tool's three ideas. Diagnose = multiple choice with a named misconception per
wrong option; Explain = unpick a stated mistake or working; Extend = always/sometimes/never, convince me, make your own.
Every number is asserted in `src/tests/orderOfOperations.test.ts` ("Depth bank numeric claims").

| Level | Diagnose | Explain | Extend |
|---|---|---|---|
| 1 Who goes first? | Jack/Jo `7+2×3` (**Start here**) · `20−8+3` · `24÷4×2` | Matthew `9+3×2=24` · student working `9+4×3+2 → 41` | Why multiply first? (3 lots of 4) · How many answers from 2, 3, 4 |
| 2 Things that jump the queue | `5+(4+2)×3` (**Start here**) · `3×2²` · `−3²` vs `(−3)²` | Priya `(3+4)²=25` · Kofi `2+3²=25` | One pair of brackets in `2+3×4+1` → 15, 17, 21 · `(a+b)²=a²+b²` always/sometimes/never |
| 3 Symbols that act as brackets | `√(9+16)` (**Start here**) · `(8+4)/(5−1)` · `2×(3+(4−1)×5)` | Elena `√9+√16` · Jamal `12/(4+2)=5` | `√(a+b)=√a+√b` always/sometimes/never · Build your own with a root and a fraction bar |

To review: wording, missing misconceptions from your classroom, and the follow-up routes (`ifNotSecure` / `ifSecure`).
