# Order of Operations — difficulty calibration

Generated from **9000** questions — each sub-tool × level sampled across random combinations of ALL its Question Options. Regenerate: `CALIBRATE=1 npx vitest run src/tests/orderDifficulty.test.ts`.

## How a question is scored

The raw score is the cost of the work the question asks for, added up — **not** a weight on the option that produced it. Higher = harder.

| Piece | Cost |
|---|---|
| × recall | ×1 or ×10: 0.5 · both ≤ 5: 1 · one factor 6–10, the other ≤ 5: 2 · both 6–9: 3 · ×11 / ×12 with a factor ≤ 5: 2.5, with a factor ≥ 6: 3.5 · two-digit × 2–5: 3 (3.5 above 50) · two-digit × 6–9: 4 · two-digit × two-digit: 6 · decimal: +2 · negative: +0.8 |
| ÷ | the matching × fact + 0.7; not exact: 4 (+1.5 if a decimal) |
| + − | operands ≤ 10: 0.5 · two-digit: 1 · bigger: 2 · a carry or exchange: +0.7 · decimals: +1.2 · a negative: +1.5 |
| Powers | square: base ≤ 5: 1.2, 6–9: 2, 10: 1, 11–12: 2.5 · cube: 2 (≤ 3), 3 (4), 3.5 (5) · negative base: +1.2 |
| Roots | √ of ≤ 25: 1.5, ≤ 100: 2, ≤ 144: 2.5 |
| Reading the line | each bracket 0.6 · brackets inside brackets or a fraction bar +1 · fraction bar 1.5 · a root over a sum 0.6 · a leading minus before a power 1 |

## The eight bands

A worksheet is ordered by **band** (1 easiest … 8 hardest); questions in a band mingle in random order. Bands are relative to the sub-tool + level: the cut points are the 12.5% … 87.5% quantiles of what that level can generate.

| Sub-tool · level | n | Cut points | Share per band (1 … 8) | Min | Median | Max |
|---|---|---|---|---|---|---|
| evaluate:level1 | 1500 | 2.7 · 3 · 3.7 · 4.4 · 4.7 · 5.4 · 6.4 | 8% 13% 13% 15% 9% 13% 16% 13% | 1.5 | 4.4 | 9.4 |
| evaluate:level2 | 1500 | 3.2 · 4.1 · 4.7 · 5.1 · 5.7 · 6.5 · 7.7 | 12% 11% 13% 13% 14% 11% 14% 13% | 1.6 | 5.1 | 13.1 |
| evaluate:level3 | 1500 | 4 · 5 · 6.2 · 7.4 · 8.4 · 9.4 · 11.1 | 11% 11% 15% 13% 12% 11% 15% 13% | 2 | 7.4 | 15.6 |
| fixIt:level1 | 1500 | 2.7 · 2.8 · 3 · 3.7 · 4 · 4.7 · 5.1 | 12% 19% 0% 15% 13% 11% 17% 13% | 1.5 | 3.7 | 7.7 |
| fixIt:level2 | 1500 | 2.8 · 3.3 · 4.1 · 4.7 · 4.8 · 5.5 · 6 | 12% 12% 10% 16% 11% 11% 16% 13% | 1.6 | 4.7 | 10.2 |
| fixIt:level3 | 1500 | 4.7 · 5.4 · 6 · 6.6 · 7.3 · 7.9 · 8.9 | 9% 10% 18% 13% 12% 10% 14% 14% | 3.3 | 6.6 | 14 |

## Categories, easiest to hardest (808 found)

A category is a coarse fingerprint of the question's structure; within it the score still varies with the actual numbers.

| # | Category | n | Mean | Range | Bands (level:band) | Example |
|---|---|---|---|---|---|---|
| 1 | fixIt · isCorrect · + × · recall E · grp | 1 | 1.6 | 1.6–1.6 | L2:1 | $$ |
| 2 | fixIt · insertBrackets · + × · recall E · grp | 28 | 1.7 | 1.6–2.1 | L2:1 | $$ |
| 3 | evaluate · evaluate · + × · recall E · grp | 2 | 1.9 | 1.6–2.1 | L2:1 | $\left(2 + 3\right) \times 3$ |
| 4 | fixIt · insertBrackets · − × · recall E · grp | 33 | 1.9 | 1.6–2.1 | L2:1 | $$ |
| 5 | fixIt · isCorrect · × + · recall E | 15 | 1.9 | 1.5–2.7 | L1:1 L1:2 | $$ |
| 6 | evaluate · evaluate · × + · recall E | 21 | 1.9 | 1.5–2.7 | L1:1 L1:2 | $17 + 2 \times 5$ |
| 7 | fixIt · findMistake · × + · recall E | 19 | 2.0 | 1.5–2.7 | L1:1 L1:2 | $$ |
| 8 | fixIt · insertBrackets · + + × · recall E · grp | 2 | 2.1 | 2.1–2.1 | L2:1 | $$ |
| 9 | fixIt · insertBrackets · × + − · recall E · grp | 1 | 2.1 | 2.1–2.1 | L2:1 | $$ |
| 10 | fixIt · findMistake · − × · recall E · grp | 6 | 2.1 | 1.6–2.8 | L2:1 L2:2 | $$ |
| 11 | evaluate · evaluate · ^2 × · recall E | 12 | 2.2 | 2.2–2.2 | L2:1 | $2 \times 2^{2}$ |
| 12 | evaluate · evaluate · × − · recall E | 27 | 2.3 | 2–2.7 | L1:1 L1:2 | $37 - 4 \times 5$ |
| 13 | fixIt · isCorrect · − + · recall - | 112 | 2.3 | 1.5–3.4 | L1:1 L1:2 L1:4 | $$ |
| 14 | fixIt · insertBrackets · − × + · recall E · grp | 22 | 2.3 | 2.1–3.1 | L2:1 L2:2 | $$ |
| 15 | fixIt · insertBrackets · − + × · recall E · grp | 4 | 2.4 | 2.1–2.6 | L2:1 | $$ |
| 16 | fixIt · isCorrect · ÷ + · recall E | 14 | 2.4 | 2.2–2.7 | L1:1 L1:2 | $$ |
| 17 | fixIt · insertBrackets · − × − · recall E · grp | 11 | 2.4 | 2.1–3.3 | L2:1 L2:2 L2:3 | $$ |
| 18 | fixIt · isCorrect · − × · recall E · grp | 4 | 2.4 | 2.1–3.3 | L2:1 L2:3 | $$ |
| 19 | fixIt · findMistake · × − · recall E | 10 | 2.4 | 2–2.7 | L1:1 L1:2 | $$ |
| 20 | fixIt · insertBrackets · − − × · recall E · grp | 3 | 2.4 | 2.1–2.6 | L2:1 | $$ |
| 21 | fixIt · findMistake · − + · recall - | 107 | 2.4 | 1.5–3.4 | L1:1 L1:2 L1:4 | $$ |
| 22 | evaluate · evaluate · − × · recall E · grp | 15 | 2.5 | 1.6–3.3 | L2:1 L2:2 | $\left(15 - 12\right) \times 3$ |
| 23 | evaluate · evaluate · − + · recall - | 55 | 2.5 | 1.5–3.4 | L1:1 L1:2 L1:3 | $20 - 9 + 8$ |
| 24 | evaluate · evaluate · √ × · recall E | 20 | 2.5 | 2.5–2.5 | L3:1 | $2 \times \sqrt{9}$ |
| 25 | fixIt · isCorrect · × × − · recall E | 1 | 2.5 | 2.5–2.5 | L1:1 | $$ |
| 26 | fixIt · findMistake · × × − · recall E | 1 | 2.5 | 2.5–2.5 | L1:1 | $$ |
| 27 | fixIt · insertBrackets · − ÷ · recall E · grp | 7 | 2.5 | 2.3–2.8 | L2:1 L2:2 | $$ |
| 28 | fixIt · findMistake · ÷ + · recall E | 13 | 2.6 | 2.2–3.4 | L1:1 L1:2 L1:4 | $$ |
| 29 | fixIt · isCorrect · + − · recall - · grp | 13 | 2.6 | 2.1–3.3 | L2:1 L2:2 L2:3 | $$ |
| 30 | evaluate · evaluate · − − · recall - | 192 | 2.6 | 2–3.4 | L1:1 L1:2 L1:3 | $31 - 3 - 3$ |
| 31 | fixIt · insertBrackets · + × × · recall E · grp | 3 | 2.6 | 2.6–2.6 | L2:1 | $$ |
| 32 | fixIt · isCorrect · × + × · recall E · grp | 3 | 2.6 | 2.6–2.6 | L2:1 | $$ |
| 33 | fixIt · insertBrackets · + ÷ · recall E · grp | 13 | 2.6 | 2.3–2.8 | L2:1 L2:2 | $$ |
| 34 | evaluate · evaluate · √ + · recall - | 41 | 2.6 | 2–3.5 | L3:1 | $\sqrt{36} + 20$ |
| 35 | evaluate · evaluate · + − · recall - · grp | 30 | 2.6 | 2.1–3.3 | L2:1 L2:2 | $33 - \left(6 + 2\right)$ |
| 36 | fixIt · isCorrect · ÷ × · recall E | 91 | 2.7 | 2.7–2.7 | L1:2 | $$ |
| 37 | fixIt · findMistake · ÷ × · recall E | 86 | 2.7 | 2.7–2.7 | L1:2 | $$ |
| 38 | evaluate · evaluate · ÷ × · recall E | 7 | 2.7 | 2.7–2.7 | L1:2 | $20 \div 4 \times 2$ |
| 39 | fixIt · insertBrackets · × − − · recall E · grp | 4 | 2.7 | 2.1–3.3 | L2:1 L2:3 | $$ |
| 40 | fixIt · isCorrect · × − · recall E | 3 | 2.7 | 2.7–2.7 | L1:2 | $$ |
| 41 | evaluate · evaluate · ÷ + · recall E | 28 | 2.7 | 2.2–3.4 | L1:1 L1:2 L1:3 | $18 + 10 \div 5$ |
| 42 | fixIt · insertBrackets · + × + · recall E · grp | 13 | 2.7 | 2.6–3.1 | L2:1 L2:2 | $$ |
| 43 | fixIt · insertBrackets · × − × · recall E · grp | 3 | 2.8 | 2.6–3.1 | L2:1 L2:2 | $$ |
| 44 | fixIt · insertBrackets · − + ÷ · recall E · grp | 1 | 2.8 | 2.8–2.8 | L2:2 | $$ |
| 45 | fixIt · insertBrackets · − ÷ + · recall E · grp | 4 | 2.8 | 2.8–2.8 | L2:2 | $$ |
| 46 | fixIt · insertBrackets · − × × · recall E · grp | 5 | 2.8 | 2.6–3.1 | L2:1 L2:2 | $$ |
| 47 | fixIt · insertBrackets · + × ÷ · recall E · grp | 1 | 2.8 | 2.8–2.8 | L2:2 | $$ |
| 48 | fixIt · insertBrackets · − ÷ − · recall E · grp | 5 | 2.8 | 2.8–2.8 | L2:2 | $$ |
| 49 | fixIt · insertBrackets · − − ÷ · recall E · grp | 1 | 2.8 | 2.8–2.8 | L2:2 | $$ |
| 50 | fixIt · isCorrect · ÷ − · recall E | 10 | 2.8 | 2.7–3.4 | L1:2 L1:4 | $$ |
| 51 | evaluate · evaluate · ^2 − · recall - | 32 | 2.8 | 2.2–3.7 | L2:1 L2:2 | $86 - 4^{2}$ |
| 52 | fixIt · findMistake · ^2 + · recall - | 20 | 2.9 | 1.7–3.7 | L2:1 L2:2 L2:3 | $$ |
| 53 | fixIt · findMistake · + − · recall - · grp | 17 | 2.9 | 2.1–3.3 | L2:1 L2:2 L2:3 | $$ |
| 54 | evaluate · evaluate · ÷ − · recall E | 20 | 2.9 | 2.7–3.4 | L1:2 L1:3 | $20 - 15 \div 5$ |
| 55 | fixIt · isCorrect · ^2 + · recall - | 24 | 2.9 | 2.2–3.7 | L2:1 L2:2 L2:3 | $$ |
| 56 | fixIt · findMistake · ÷ − · recall E | 17 | 2.9 | 2.7–3.4 | L1:2 L1:4 | $$ |
| 57 | fixIt · isCorrect · + − × · recall E · grp | 2 | 3.0 | 2.7–3.2 | L2:1 L2:2 | $$ |
| 58 | fixIt · insertBrackets · + − × · recall E · grp | 10 | 3.0 | 2.1–3.8 | L2:1 L2:2 L2:3 | $$ |
| 59 | fixIt · findMistake · × × + · recall E | 8 | 3.0 | 2.5–3.7 | L1:1 L1:4 L1:5 | $$ |
| 60 | evaluate · evaluate · ^2 + · recall - | 63 | 3.0 | 1.7–3.7 | L2:1 L2:2 | $1 + 8^{2}$ |
| 61 | fixIt · insertBrackets · ÷ − − · recall E · grp | 3 | 3.0 | 2.8–3.3 | L2:2 L2:3 | $$ |
| 62 | evaluate · evaluate · × × + · recall E | 2 | 3.0 | 3–3 | L1:3 | $5 \times 3 + 3 \times 4$ |
| 63 | evaluate · evaluate · × × − · recall E | 1 | 3.0 | 3–3 | L1:3 | $5 \times 5 - 5 \times 2$ |
| 64 | fixIt · isCorrect · × × + · recall E | 1 | 3.0 | 3–3 | L1:4 | $$ |
| 65 | fixIt · findMistake · ^2 − · recall - | 9 | 3.0 | 2.2–3.7 | L2:1 L2:2 L2:3 | $$ |
| 66 | evaluate · evaluate · ÷ ÷ · recall E | 25 | 3.1 | 2.9–3.4 | L1:2 L1:3 | $30 \div 3 \div 5$ |
| 67 | fixIt · isCorrect · ^2 − · recall - | 5 | 3.1 | 2.2–3.7 | L2:1 L2:2 L2:3 | $$ |
| 68 | fixIt · isCorrect · × + · recall M | 32 | 3.1 | 3–3.7 | L1:4 L1:5 | $$ |
| 69 | fixIt · insertBrackets · + ÷ + · recall E · grp | 5 | 3.1 | 2.8–3.3 | L2:2 L2:3 | $$ |
| 70 | fixIt · insertBrackets · − × · recall M · grp | 19 | 3.1 | 3.1–3.1 | L2:2 | $$ |
| 71 | evaluate · evaluate · √ − · recall - | 50 | 3.1 | 2.5–3.7 | L3:1 | $15 - \sqrt{25}$ |
| 72 | fixIt · insertBrackets · ÷ + − · recall E · grp | 3 | 3.1 | 2.8–3.3 | L2:2 L2:3 | $$ |
| 73 | fixIt · findMistake · × + · recall M | 31 | 3.1 | 3–3.7 | L1:4 L1:5 | $$ |
| 74 | evaluate · evaluate · × + · recall M | 49 | 3.1 | 3–3.7 | L1:3 L1:4 | $9 + 9 \times 4$ |
| 75 | fixIt · insertBrackets · ÷ + × · recall E · grp | 4 | 3.2 | 2.8–3.3 | L2:2 L2:3 | $$ |
| 76 | evaluate · evaluate · ^2 × · recall M | 7 | 3.2 | 3.2–3.2 | L2:2 | $2 \times 3^{2}$ |
| 77 | fixIt · findMistake · + − × · recall E · grp | 1 | 3.2 | 3.2–3.2 | L2:2 | $$ |
| 78 | fixIt · findMistake · ^2 × + · recall E | 2 | 3.2 | 3.2–3.2 | L2:2 | $$ |
| 79 | fixIt · isCorrect · ^2 × · recall M | 3 | 3.2 | 3.2–3.2 | L2:2 | $$ |
| 80 | fixIt · findMistake · ^3 + · recall - | 9 | 3.2 | 2.5–4 | L2:1 L2:2 L2:3 | $$ |
| 81 | fixIt · findMistake · × + − · recall E | 18 | 3.2 | 2.5–4.4 | L1:1 L1:4 L1:5 L1:6 | $$ |
| 82 | fixIt · findMistake · × − · recall M | 15 | 3.2 | 3–3.7 | L1:4 L1:5 | $$ |
| 83 | fixIt · insertBrackets · + × · recall M · grp | 40 | 3.2 | 3.1–3.6 | L2:2 L2:3 | $$ |
| 84 | evaluate · evaluate · + × · recall M · grp | 7 | 3.2 | 3.1–3.6 | L2:1 L2:2 | $\left(6 + 2\right) \times 4$ |
| 85 | fixIt · isCorrect · × − · recall M | 11 | 3.3 | 3–3.7 | L1:4 L1:5 | $$ |
| 86 | evaluate · evaluate · × + − · recall E | 7 | 3.3 | 2.7–3.7 | L1:2 L1:3 L1:4 | $4 + 3 \times 2 - 7$ |
| 87 | evaluate · evaluate · − × · recall E · grp,neg | 3 | 3.3 | 3.1–3.6 | L2:1 L2:2 | $\left(-9 - (-9)\right) \times 7$ |
| 88 | evaluate · evaluate · × − · recall M | 45 | 3.3 | 3–3.7 | L1:3 L1:4 | $33 - 2 \times 8$ |
| 89 | fixIt · findMistake · + × · recall M · grp | 8 | 3.3 | 3.1–3.6 | L2:2 L2:3 | $$ |
| 90 | evaluate · evaluate · √ × · recall M · neg | 17 | 3.3 | 3.3–3.3 | L3:1 | $-4 \times \sqrt{9}$ |
| 91 | evaluate · evaluate · √ × + · recall E | 5 | 3.3 | 3–3.5 | L3:1 | $3 + 2 \times \sqrt{9}$ |
| 92 | fixIt · isCorrect · + × − · recall E · grp | 1 | 3.3 | 3.3–3.3 | L2:3 | $$ |
| 93 | fixIt · insertBrackets · − ÷ × · recall E · grp | 4 | 3.3 | 2.8–3.8 | L2:2 L2:3 | $$ |
| 94 | fixIt · findMistake · + × − · recall E · grp | 2 | 3.3 | 3.3–3.3 | L2:3 | $$ |
| 95 | fixIt · insertBrackets · + ÷ × · recall E · grp | 2 | 3.3 | 2.8–3.8 | L2:2 L2:3 | $$ |
| 96 | fixIt · insertBrackets · + + ÷ · recall E · grp | 1 | 3.3 | 3.3–3.3 | L2:3 | $$ |
| 97 | fixIt · findMistake · ÷ + × · recall E · grp | 1 | 3.3 | 3.3–3.3 | L2:3 | $$ |
| 98 | fixIt · insertBrackets · + ÷ − · recall E · grp | 1 | 3.3 | 3.3–3.3 | L2:3 | $$ |
| 99 | fixIt · insertBrackets · − + ^2 × · recall E · grp | 1 | 3.3 | 3.3–3.3 | L3:1 | $$ |
| 100 | fixIt · insertBrackets · − ^2 × × · recall E · grp | 1 | 3.3 | 3.3–3.3 | L3:1 | $$ |
| 101 | fixIt · insertBrackets · ^2 − + × · recall E · grp | 1 | 3.3 | 3.3–3.3 | L3:1 | $$ |
| 102 | fixIt · insertBrackets · ^2 + + × · recall E · grp | 1 | 3.3 | 3.3–3.3 | L3:1 | $$ |
| 103 | fixIt · isCorrect · × + − · recall E | 25 | 3.3 | 2.5–4.4 | L1:1 L1:2 L1:4 L1:5 L1:6 | $$ |
| 104 | evaluate · evaluate · ^2 × · recall E · neg | 5 | 3.4 | 3.4–3.4 | L2:2 | $4 \times (-2)^{2}$ |
| 105 | fixIt · findMistake · ^3 − · recall - | 5 | 3.4 | 3–3.7 | L2:2 L2:3 | $$ |
| 106 | evaluate · evaluate · + × · recall E · grp,neg | 6 | 3.4 | 3.1–3.6 | L2:1 L2:2 | $2 \times \left(-8 + 8\right)$ |
| 107 | fixIt · isCorrect · + × · recall M · grp | 7 | 3.5 | 3.1–3.6 | L2:2 L2:3 | $$ |
| 108 | fixIt · isCorrect · ÷ + · recall M | 11 | 3.5 | 3.2–4.4 | L1:4 L1:5 L1:6 | $$ |
| 109 | fixIt · insertBrackets · ÷ − × · recall E · grp | 3 | 3.5 | 2.8–3.8 | L2:2 L2:3 | $$ |
| 110 | evaluate · evaluate · × − + · recall E | 25 | 3.5 | 3–4.4 | L1:3 L1:4 L1:5 | $42 - 7 + 3 \times 4$ |
| 111 | evaluate · evaluate · ÷ + × · recall E · grp | 2 | 3.5 | 3.3–3.8 | L2:2 | $\left(16 \div 4 + 6\right) \times 2$ |
| 112 | fixIt · insertBrackets · + × − · recall E · grp | 2 | 3.5 | 3.3–3.8 | L2:3 | $$ |
| 113 | fixIt · findMistake · ÷ + · recall M | 16 | 3.6 | 3.2–4.4 | L1:4 L1:5 L1:6 | $$ |
| 114 | evaluate · evaluate · √ × − · recall E | 10 | 3.6 | 3–4.2 | L3:1 L3:2 | $2 \times 2 - \sqrt{4}$ |
| 115 | fixIt · isCorrect · − × · recall M · grp | 5 | 3.6 | 3.1–4.3 | L2:2 L2:4 | $$ |
| 116 | fixIt · insertBrackets · − × × · recall M · grp | 2 | 3.6 | 3.6–3.6 | L2:3 | $$ |
| 117 | fixIt · insertBrackets · − − × · recall M · grp | 1 | 3.6 | 3.6–3.6 | L2:3 | $$ |
| 118 | fixIt · insertBrackets · + × × · recall M · grp | 1 | 3.6 | 3.6–3.6 | L2:3 | $$ |
| 119 | evaluate · evaluate · ^3 − · recall - | 15 | 3.6 | 3–4 | L2:1 L2:2 | $82 - 3^{3}$ |
| 120 | evaluate · evaluate · + ÷ · recall E · grp | 38 | 3.6 | 2.3–7.1 | L2:1 L2:2 L3:3 L3:4 | $12 \div \left(1 + 2\right)$ |
| 121 | fixIt · insertBrackets · − ^2 × + · recall E · grp | 8 | 3.6 | 3.3–4.3 | L3:1 | $$ |
| 122 | fixIt · insertBrackets · ^2 × − − · recall E · grp | 3 | 3.6 | 3.3–3.8 | L3:1 | $$ |
| 123 | fixIt · insertBrackets · + − ^2 × · recall E · grp | 2 | 3.6 | 3.3–4 | L3:1 | $$ |
| 124 | fixIt · isCorrect · ^2 × + · recall E | 5 | 3.7 | 3.2–4.7 | L2:2 L2:3 L2:5 | $$ |
| 125 | evaluate · evaluate · ÷ + · recall M | 46 | 3.7 | 3.2–4.4 | L1:3 L1:4 L1:5 | $20 + 32 \div 8$ |
| 126 | fixIt · insertBrackets · − + × · recall M · grp | 6 | 3.7 | 3.6–4.1 | L2:3 L2:4 | $$ |
| 127 | fixIt · evaluate · × − · recall M | 1 | 3.7 | 3.7–3.7 | L1:5 | $45 - 7 \times 4$ |
| 128 | fixIt · evaluate · ÷ − · recall M | 1 | 3.7 | 3.7–3.7 | L1:5 | $25 - 28 \div 7$ |
| 129 | fixIt · insertBrackets · + ÷ · recall M · grp | 3 | 3.8 | 3.8–3.8 | L2:3 | $$ |
| 130 | fixIt · insertBrackets · ^2 − × − + · recall E · grp | 3 | 3.8 | 3.8–3.8 | L3:1 | $$ |
| 131 | fixIt · insertBrackets · ^2 + − × · recall E · grp | 3 | 3.8 | 3.8–3.8 | L3:1 | $$ |
| 132 | fixIt · isCorrect · ÷ + × · recall E · grp | 4 | 3.8 | 3.8–3.8 | L2:3 | $$ |
| 133 | fixIt · insertBrackets · − × ÷ · recall E · grp | 1 | 3.8 | 3.8–3.8 | L2:3 | $$ |
| 134 | fixIt · insertBrackets · ^2 − × × · recall E · grp | 2 | 3.8 | 3.8–3.8 | L3:1 | $$ |
| 135 | fixIt · insertBrackets · + ^2 × + · recall E · grp | 1 | 3.8 | 3.8–3.8 | L3:1 | $$ |
| 136 | fixIt · insertBrackets · ^2 + − × + · recall E · grp | 2 | 3.8 | 3.8–3.8 | L3:1 | $$ |
| 137 | evaluate · evaluate · − × · recall M · grp | 12 | 3.8 | 3.1–4.8 | L2:1 L2:2 L2:3 L2:4 | $\left(7 - 2\right) \times 6$ |
| 138 | evaluate · evaluate · − + − · recall - | 62 | 3.8 | 3–5.1 | L1:3 L1:4 L1:5 L1:6 | $46 - 6 + 11 - 9$ |
| 139 | evaluate · evaluate · ÷ × + · recall E | 21 | 3.9 | 3.2–4.4 | L1:3 L1:4 L1:5 | $18 + 6 \div 2 \times 5$ |
| 140 | fixIt · isCorrect · ^3 − · recall - | 6 | 3.9 | 3.7–4.7 | L2:3 L2:5 | $$ |
| 141 | evaluate · evaluate · − × · recall M · grp,neg | 9 | 3.9 | 2.4–4.6 | L2:1 L2:2 L2:3 | $\left(-16 - (-6)\right) \times 8$ |
| 142 | fixIt · insertBrackets · ^2 − × + · recall E · grp | 10 | 3.9 | 3.3–4.5 | L3:1 | $$ |
| 143 | evaluate · evaluate · + ^2 ÷ · recall E · grp | 12 | 3.9 | 3.5–4 | L2:2 | $\left(1 + 4\right)^{2} \div 5$ |
| 144 | fixIt · findMistake · − + − · recall - | 108 | 3.9 | 3–5.1 | L1:4 L1:5 L1:6 L1:8 | $$ |
| 145 | fixIt · isCorrect · − + − · recall - | 136 | 3.9 | 2.5–5.1 | L1:1 L1:4 L1:5 L1:6 L1:8 | $$ |
| 146 | evaluate · evaluate · × ÷ · recall M | 2 | 4.0 | 3.2–4.7 | L1:3 L1:6 | $6 \times 3 \div 2$ |
| 147 | evaluate · evaluate · ^2 × · recall M · neg | 11 | 4.0 | 3–4.4 | L2:1 L2:3 | $2 \times (-3)^{2}$ |
| 148 | evaluate · evaluate · ^2 × + · recall E | 5 | 4.0 | 2.7–4.7 | L2:1 L2:2 L2:4 | $4 \times 2^{2} + 1$ |
| 149 | evaluate · evaluate · ^3 × · recall M | 8 | 4.0 | 4–4 | L2:2 | $3 \times 2^{3}$ |
| 150 | fixIt · findMistake · × + · recall H | 14 | 4.0 | 4–4 | L1:6 | $$ |
| 151 | fixIt · isCorrect · × + · recall H | 4 | 4.0 | 4–4 | L1:6 | $$ |
| 152 | fixIt · evaluate · × + · recall H | 1 | 4.0 | 4–4 | L1:6 | $12 + 9 \times 7$ |
| 153 | fixIt · findMistake · ^3 × · recall M | 4 | 4.0 | 4–4 | L2:3 | $$ |
| 154 | fixIt · insertBrackets · ^2 − ÷ − · recall E · grp | 2 | 4.0 | 4–4 | L3:1 | $$ |
| 155 | fixIt · insertBrackets · + ^2 ÷ × · recall E · grp | 2 | 4.0 | 4–4 | L3:1 | $$ |
| 156 | fixIt · insertBrackets · ^2 + ÷ × · recall E · grp | 1 | 4.0 | 4–4 | L3:1 | $$ |
| 157 | fixIt · insertBrackets · − ^2 ÷ + · recall E · grp | 1 | 4.0 | 4–4 | L3:1 | $$ |
| 158 | fixIt · insertBrackets · ÷ − ^2 × · recall E · grp | 1 | 4.0 | 4–4 | L3:1 | $$ |
| 159 | fixIt · insertBrackets · ^2 + + ÷ · recall E · grp | 1 | 4.0 | 4–4 | L3:1 | $$ |
| 160 | evaluate · evaluate · √ × · recall M | 33 | 4.0 | 3.5–5 | L3:1 L3:2 L3:3 | $9 \times \sqrt{25}$ |
| 161 | fixIt · insertBrackets · ^2 − × − · recall E · grp | 8 | 4.0 | 3.3–5 | L3:1 L3:2 | $$ |
| 162 | fixIt · insertBrackets · ^2 + × + · recall E · grp | 5 | 4.0 | 3.8–5 | L3:1 L3:2 | $$ |
| 163 | fixIt · findMistake · − × · recall M · grp | 5 | 4.0 | 3.8–4.1 | L2:3 L2:4 | $$ |
| 164 | fixIt · isCorrect · ÷ − · recall M | 10 | 4.0 | 3.7–4.4 | L1:5 L1:6 | $$ |
| 165 | fixIt · findMistake · ÷ − · recall M | 15 | 4.1 | 3.7–4.4 | L1:5 L1:6 | $$ |
| 166 | evaluate · evaluate · √ ^2 + · recall - | 30 | 4.1 | 3.2–5 | L3:1 L3:2 L3:3 | $\sqrt{49} + 9^{2}$ |
| 167 | evaluate · evaluate · ÷ − · recall M | 60 | 4.1 | 3.7–4.4 | L1:4 L1:5 | $34 - 12 \div 2$ |
| 168 | evaluate · evaluate · + × − · recall M · grp | 1 | 4.1 | 4.1–4.1 | L2:3 | $3 \times \left(6 + 2\right) - 12$ |
| 169 | evaluate · evaluate · × + × · recall E · grp,neg | 2 | 4.1 | 4.1–4.1 | L2:3 | $\left(-6 + 2 \times 3\right) \times 4$ |
| 170 | fixIt · findMistake · ^2 ^2 − · recall - | 8 | 4.1 | 2.9–4.9 | L2:2 L2:3 L2:4 L2:6 | $$ |
| 171 | fixIt · insertBrackets · − × · recall H · grp | 4 | 4.1 | 4.1–4.1 | L2:4 | $$ |
| 172 | evaluate · evaluate · + ^2 × + · recall E · grp | 3 | 4.1 | 3.8–4.3 | L2:2 L2:3 | $4 + 4 \times \left(1 + 1\right)^{2}$ |
| 173 | evaluate · evaluate · × × − + · recall E | 3 | 4.1 | 3.5–4.7 | L1:3 L1:4 L1:6 | $4 \times 5 - 4 \times 5 + 6$ |
| 174 | evaluate · evaluate · + − × · recall E · grp | 26 | 4.1 | 3.4–4.9 | L2:2 L3:1 L3:2 | $\left(6 + 4\right) \times \left(10 - 1\right)$ |
| 175 | fixIt · isCorrect · ^2 ^2 − · recall - | 5 | 4.2 | 4.1–4.2 | L2:4 | $$ |
| 176 | fixIt · isCorrect · ^3 + · recall - | 18 | 4.2 | 2.5–6.2 | L2:1 L2:2 L2:3 L2:5 L2:7 L2:8 | $$ |
| 177 | evaluate · evaluate · √ + · recall - · neg | 28 | 4.2 | 3.5–5 | L3:1 L3:2 L3:3 | $\sqrt{81} + (-11)$ |
| 178 | evaluate · evaluate · ^3 + · recall - | 22 | 4.2 | 2.5–6.2 | L2:1 L2:2 L2:4 L2:6 | $4^{3} + 23$ |
| 179 | evaluate · evaluate · ÷ × · recall M | 33 | 4.2 | 3.7–4.7 | L1:4 L1:6 | $30 \div 5 \times 4$ |
| 180 | fixIt · insertBrackets · − × + · recall M · grp | 12 | 4.2 | 4.1–4.8 | L2:4 L2:6 | $$ |
| 181 | fixIt · isCorrect · ^2 + − · recall - | 11 | 4.2 | 3.2–4.7 | L2:2 L2:3 L2:4 L2:5 | $$ |
| 182 | fixIt · insertBrackets · + × · recall H · grp | 47 | 4.2 | 4.1–4.6 | L2:4 | $$ |
| 183 | evaluate · evaluate · × − · recall H | 3 | 4.2 | 4–4.7 | L1:4 L1:6 | $56 - 6 \times 9$ |
| 184 | evaluate · evaluate · + ^2 + · recall - · grp | 47 | 4.2 | 2.8–6.3 | L2:1 L2:2 L2:3 L2:4 L2:5 L2:6 | $\left(5 + 5\right)^{2} + 6$ |
| 185 | fixIt · insertBrackets · ^2 ÷ − − · recall E · grp | 2 | 4.3 | 4–4.5 | L3:1 | $$ |
| 186 | fixIt · insertBrackets · ^2 − ÷ + · recall E · grp | 2 | 4.3 | 4–4.5 | L3:1 | $$ |
| 187 | fixIt · isCorrect · + ÷ · recall E · grp | 13 | 4.3 | 2.3–6.4 | L2:1 L2:2 L2:3 L3:3 L3:4 | $$ |
| 188 | evaluate · evaluate · ÷ − + · recall E | 28 | 4.3 | 3.7–5.1 | L1:4 L1:5 L1:6 | $52 - 12 \div 3 + 8$ |
| 189 | evaluate · evaluate · ^2 + − · recall - | 6 | 4.3 | 3.9–4.7 | L2:2 L2:3 L2:4 | $3 + 8^{2} - 9$ |
| 190 | evaluate · evaluate · × + · recall H | 17 | 4.3 | 4–4.7 | L1:4 L1:6 | $15 + 8 \times 7$ |
| 191 | fixIt · insertBrackets · + − × · recall M · grp | 10 | 4.3 | 3.6–4.8 | L2:3 L2:4 L2:6 | $$ |
| 192 | fixIt · insertBrackets · + ÷ − · recall M · grp | 1 | 4.3 | 4.3–4.3 | L2:4 | $$ |
| 193 | fixIt · insertBrackets · + ÷ + · recall M · grp | 1 | 4.3 | 4.3–4.3 | L2:4 | $$ |
| 194 | fixIt · insertBrackets · ÷ − × · recall M · grp | 1 | 4.3 | 4.3–4.3 | L2:4 | $$ |
| 195 | fixIt · insertBrackets · ^2 + × + + · recall E · grp | 1 | 4.3 | 4.3–4.3 | L3:1 | $$ |
| 196 | fixIt · insertBrackets · × − ^2 × + · recall E · grp | 1 | 4.3 | 4.3–4.3 | L3:1 | $$ |
| 197 | fixIt · insertBrackets · − ^2 × × + · recall E · grp | 2 | 4.3 | 4.3–4.3 | L3:1 | $$ |
| 198 | fixIt · insertBrackets · ^2 − × + − · recall E · grp | 1 | 4.3 | 4.3–4.3 | L3:1 | $$ |
| 199 | fixIt · insertBrackets · ^2 − + × + · recall E · grp | 1 | 4.3 | 4.3–4.3 | L3:1 | $$ |
| 200 | fixIt · insertBrackets · − ^2 × + − · recall E · grp | 1 | 4.3 | 4.3–4.3 | L3:1 | $$ |
| 201 | fixIt · insertBrackets · − ^2 × − + · recall E · grp | 1 | 4.3 | 4.3–4.3 | L3:1 | $$ |
| 202 | fixIt · isCorrect · + × · recall H · grp | 14 | 4.3 | 4.1–4.6 | L2:4 | $$ |
| 203 | fixIt · insertBrackets · − × − · recall M · grp | 6 | 4.3 | 4.1–4.8 | L2:4 L2:6 | $$ |
| 204 | fixIt · insertBrackets · ^2 ÷ + − · recall E · grp | 5 | 4.3 | 4–5.2 | L3:1 L3:2 | $$ |
| 205 | fixIt · findMistake · × + × · recall M · grp | 2 | 4.3 | 4.1–4.6 | L2:4 | $$ |
| 206 | fixIt · findMistake · + × · recall H · grp | 12 | 4.4 | 4.1–4.6 | L2:4 | $$ |
| 207 | fixIt · findMistake · ^2 + − · recall - | 6 | 4.4 | 2.7–5.4 | L2:1 L2:3 L2:4 L2:5 L2:6 | $$ |
| 208 | fixIt · isCorrect · ÷ + · recall H | 6 | 4.4 | 4.2–5.4 | L1:6 L1:8 | $$ |
| 209 | fixIt · evaluate · − + − · recall - | 1 | 4.4 | 4.4–4.4 | L1:6 | $39 - 3 + 8 - 5$ |
| 210 | fixIt · findMistake · + × − · recall M · grp | 10 | 4.4 | 4.1–4.6 | L2:4 | $$ |
| 211 | fixIt · insertBrackets · ^2 + × − · recall E · grp | 4 | 4.4 | 4.3–4.5 | L3:1 | $$ |
| 212 | fixIt · findMistake · ÷ × · recall M | 125 | 4.4 | 3.7–4.7 | L1:5 L1:7 | $$ |
| 213 | fixIt · insertBrackets · ÷ + × · recall M · grp | 4 | 4.4 | 4.3–4.8 | L2:4 L2:6 | $$ |
| 214 | evaluate · evaluate · + × · recall H · grp | 21 | 4.4 | 4.1–4.6 | L2:3 | $2 \times \left(6 + 9\right)$ |
| 215 | fixIt · isCorrect · × + × · recall M · grp | 3 | 4.4 | 4.1–4.6 | L2:4 | $$ |
| 216 | evaluate · evaluate · + × · recall M · grp,neg | 17 | 4.4 | 3.9–4.9 | L2:2 L2:3 L2:4 | $\left(5 + (-4)\right) \times (-6)$ |
| 217 | fixIt · isCorrect · ÷ × · recall M | 122 | 4.4 | 3.7–4.7 | L1:5 L1:7 | $$ |
| 218 | evaluate · evaluate · √ − · recall - · neg | 38 | 4.4 | 4–5 | L3:2 L3:3 | $-25 - \sqrt{121}$ |
| 219 | fixIt · isCorrect · × + − · recall M | 31 | 4.5 | 4–5.4 | L1:6 L1:7 L1:8 | $$ |
| 220 | evaluate · evaluate · ^2 + · recall - · neg | 27 | 4.5 | 2.9–5.7 | L2:1 L2:2 L2:3 L2:4 L2:6 | $-1 + (-8)^{2}$ |
| 221 | fixIt · isCorrect · × × + · recall M | 22 | 4.5 | 4–5.7 | L1:6 L1:7 L1:8 | $$ |
| 222 | fixIt · insertBrackets · + × + · recall M · grp | 20 | 4.5 | 4.1–5.3 | L2:4 L2:6 | $$ |
| 223 | evaluate · evaluate · + ^2 − · recall - · grp | 22 | 4.5 | 3.3–5.6 | L2:2 L2:3 L2:4 L2:5 | $\left(4 + 3\right)^{2} - 24$ |
| 224 | fixIt · findMistake · ÷ + · recall H | 6 | 4.5 | 4.2–5.4 | L1:6 L1:7 L1:8 | $$ |
| 225 | fixIt · isCorrect · ^3 + − · recall - | 7 | 4.5 | 4–5.7 | L2:3 L2:5 L2:6 L2:7 | $$ |
| 226 | evaluate · evaluate · ÷ ^2 × · recall E · grp | 8 | 4.5 | 4.5–4.5 | L2:3 | $3 \times \left(4 \div 2\right)^{2}$ |
| 227 | fixIt · insertBrackets · ÷ + ÷ · recall E · grp | 1 | 4.5 | 4.5–4.5 | L2:4 | $$ |
| 228 | fixIt · insertBrackets · ^2 ÷ + × · recall E · grp | 3 | 4.5 | 4–5 | L3:1 L3:2 | $$ |
| 229 | fixIt · insertBrackets · + ^2 × − · recall E · grp | 2 | 4.5 | 4.5–4.5 | L3:1 | $$ |
| 230 | fixIt · insertBrackets · ^2 ÷ − × − · recall E · grp | 1 | 4.5 | 4.5–4.5 | L3:1 | $$ |
| 231 | fixIt · insertBrackets · − ^2 ÷ − + · recall E · grp | 1 | 4.5 | 4.5–4.5 | L3:1 | $$ |
| 232 | fixIt · insertBrackets · ^2 − × ÷ · recall E · grp | 2 | 4.5 | 4.5–4.5 | L3:1 | $$ |
| 233 | fixIt · insertBrackets · ^2 ÷ + + × · recall E · grp | 1 | 4.5 | 4.5–4.5 | L3:1 | $$ |
| 234 | fixIt · insertBrackets · − ^2 × − · recall E · grp | 1 | 4.5 | 4.5–4.5 | L3:1 | $$ |
| 235 | fixIt · insertBrackets · − ^2 ÷ + + · recall E · grp | 1 | 4.5 | 4.5–4.5 | L3:1 | $$ |
| 236 | fixIt · insertBrackets · ^2 ÷ − − − · recall E · grp | 1 | 4.5 | 4.5–4.5 | L3:1 | $$ |
| 237 | fixIt · findMistake · × + − · recall M | 49 | 4.5 | 4–5.4 | L1:6 L1:7 L1:8 | $$ |
| 238 | fixIt · insertBrackets · + × − · recall M · grp | 13 | 4.5 | 4.1–5.3 | L2:4 L2:6 | $$ |
| 239 | fixIt · insertBrackets · ^2 × − × · recall E · grp | 2 | 4.5 | 4.3–4.8 | L3:1 L3:2 | $$ |
| 240 | evaluate · evaluate · ^2 ^2 − · recall - | 26 | 4.6 | 2.9–5.7 | L2:1 L2:2 L2:3 L2:4 L2:6 | $7^{2} - 2^{2}$ |
| 241 | fixIt · isCorrect · ^2 × · recall H | 15 | 4.6 | 4.2–5.5 | L2:4 L2:6 L2:7 | $$ |
| 242 | evaluate · evaluate · × + × · recall M · grp | 4 | 4.6 | 4.6–4.6 | L2:3 | $\left(5 + 3 \times 2\right) \times 4$ |
| 243 | fixIt · findMistake · × × + · recall M | 9 | 4.6 | 4–5.7 | L1:6 L1:7 L1:8 | $$ |
| 244 | evaluate · evaluate · − ^2 + · recall - · grp | 23 | 4.6 | 2.8–6.8 | L2:1 L2:2 L2:3 L2:4 L2:5 L2:6 L2:7 | $\left(6 - 2\right)^{2} + 5$ |
| 245 | fixIt · isCorrect · + − × · recall M · grp | 6 | 4.7 | 4.2–5.2 | L2:4 L2:5 L2:6 | $$ |
| 246 | fixIt · insertBrackets · − ^2 × + + · recall E · grp | 2 | 4.7 | 3.8–5.5 | L3:1 L3:3 | $$ |
| 247 | evaluate · evaluate · × + − · recall M | 16 | 4.7 | 4–5.4 | L1:4 L1:6 L1:7 | $20 + 8 \times 4 - 13$ |
| 248 | evaluate · evaluate · ÷ + · recall H | 35 | 4.7 | 4.2–5.4 | L1:4 L1:6 L1:7 | $15 + 81 \div 9$ |
| 249 | evaluate · evaluate · ^2 ÷ + − · recall E | 4 | 4.7 | 4.4–5.1 | L2:3 L2:4 L2:5 | $12 + 6 - 2^{2} \div 4$ |
| 250 | evaluate · evaluate · ^2 × + · recall E · neg | 1 | 4.7 | 4.7–4.7 | L2:4 | $3 \times 2^{2} + (-6)$ |
| 251 | fixIt · isCorrect · + × − · recall M · grp | 4 | 4.7 | 4.1–5.3 | L2:4 L2:6 | $$ |
| 252 | fixIt · isCorrect · ^3 × + · recall E | 5 | 4.7 | 4–6.5 | L2:3 L2:6 L2:8 | $$ |
| 253 | fixIt · findMistake · ^2 × · recall H | 13 | 4.7 | 4.2–5.5 | L2:4 L2:6 L2:7 | $$ |
| 254 | evaluate · evaluate · √ × · recall H · neg | 30 | 4.7 | 4.3–5.8 | L3:2 L3:3 | $-2 \times \sqrt{144}$ |
| 255 | evaluate · evaluate · ÷ ÷ · recall M | 79 | 4.7 | 4.4–5.9 | L1:5 L1:6 L1:7 | $40 \div 5 \div 4$ |
| 256 | evaluate · evaluate · × − + · recall M | 54 | 4.7 | 4–5.4 | L1:4 L1:6 L1:7 | $49 - 11 + 2 \times 7$ |
| 257 | evaluate · evaluate · ^2 ^2 × + · recall E | 3 | 4.7 | 3.9–5.9 | L2:2 L2:3 L2:6 | $3^{2} + 2 \times 2^{2}$ |
| 258 | fixIt · insertBrackets · ^2 + ÷ + · recall E · grp | 2 | 4.8 | 4.5–5 | L3:1 L3:2 | $$ |
| 259 | fixIt · insertBrackets · ^2 − ÷ × · recall E · grp | 2 | 4.8 | 4.5–5 | L3:1 L3:2 | $$ |
| 260 | evaluate · evaluate · + − · recall - · grp,neg | 32 | 4.8 | 3.6–5.6 | L2:2 L2:3 L2:4 L2:5 | $-32 - \left(-2 + (-2)\right)$ |
| 261 | fixIt · findMistake · × × − · recall M | 11 | 4.8 | 4–5.7 | L1:6 L1:7 L1:8 | $$ |
| 262 | evaluate · evaluate · ^2 × + · recall M | 5 | 4.8 | 4.2–5 | L2:3 L2:4 | $4 \times 3^{2} + 18$ |
| 263 | fixIt · insertBrackets · − + × · recall H · grp | 5 | 4.8 | 4.6–5.1 | L2:4 L2:6 | $$ |
| 264 | fixIt · insertBrackets · ^2 + + − × · recall E · grp | 1 | 4.8 | 4.8–4.8 | L3:2 | $$ |
| 265 | fixIt · insertBrackets · + − ^2 × · recall M · grp | 1 | 4.8 | 4.8–4.8 | L3:2 | $$ |
| 266 | fixIt · insertBrackets · ^2 − − × · recall M · grp | 2 | 4.8 | 4.8–4.8 | L3:2 | $$ |
| 267 | evaluate · evaluate · × × − · recall M | 18 | 4.8 | 4–5.7 | L1:4 L1:6 L1:7 | $8 \times 5 - 8 \times 4$ |
| 268 | fixIt · findMistake · + ÷ · recall E · grp | 13 | 4.8 | 2.3–6.4 | L2:1 L2:2 L3:3 L3:4 | $$ |
| 269 | fixIt · isCorrect · ^2 ^2 × + · recall E | 3 | 4.9 | 4.4–5.1 | L2:4 L2:6 | $$ |
| 270 | evaluate · evaluate · + √ × · recall E · grp | 12 | 4.9 | 4.2–5.4 | L3:2 L3:3 | $\sqrt{4 + 5} \times 5$ |
| 271 | evaluate · evaluate · − × · recall H · grp | 21 | 4.9 | 4.1–5.3 | L2:3 L2:4 L2:5 | $\left(18 - 5\right) \times 2$ |
| 272 | fixIt · isCorrect · × × − · recall M | 9 | 4.9 | 4–5.7 | L1:6 L1:7 L1:8 | $$ |
| 273 | fixIt · isCorrect · ^2 + · recall - · grp,neg | 154 | 4.9 | 4.2–5.5 | L2:4 L2:5 L2:7 | $$ |
| 274 | evaluate · evaluate · × × + · recall M | 44 | 4.9 | 4–5.7 | L1:4 L1:6 L1:7 | $2 \times 9 + 2 \times 8$ |
| 275 | evaluate · evaluate · ^2 − · recall - · grp,neg | 43 | 4.9 | 4.2–5.5 | L2:3 L2:4 L2:5 | $28 - -4^{2}$ |
| 276 | fixIt · insertBrackets · + − ^2 × + · recall E · grp | 2 | 4.9 | 3.8–6 | L3:1 L3:4 | $$ |
| 277 | evaluate · evaluate · ^2 × · recall H | 33 | 4.9 | 4.2–5.5 | L2:3 L2:4 L2:5 | $5 \times 9^{2}$ |
| 278 | evaluate · evaluate · √ × + · recall E · neg | 7 | 4.9 | 4.5–5 | L3:2 L3:3 | $-12 + 2 \times \sqrt{9}$ |
| 279 | fixIt · findMistake · ^3 + − · recall - | 10 | 4.9 | 4–6.4 | L2:3 L2:5 L2:6 L2:8 | $$ |
| 280 | evaluate · evaluate · ^2 + · recall - · grp,neg | 50 | 4.9 | 4.2–5.5 | L2:3 L2:4 L2:5 | $-2^{2} + (-4)$ |
| 281 | fixIt · isCorrect · + √ × · recall E · grp | 73 | 4.9 | 4.2–5.4 | L3:1 L3:2 L3:3 | $$ |
| 282 | fixIt · findMistake · − × · recall H · grp | 2 | 4.9 | 4.8–5.1 | L2:6 | $$ |
| 283 | fixIt · insertBrackets · × − × · recall M · grp | 2 | 4.9 | 4.8–5.1 | L2:6 | $$ |
| 284 | fixIt · insertBrackets · ^2 − × + + · recall E · grp | 5 | 5.0 | 3.8–6.7 | L3:1 L3:2 L3:3 L3:5 | $$ |
| 285 | fixIt · findMistake · ^2 + · recall - · grp,neg | 168 | 5.0 | 4.2–5.5 | L2:4 L2:5 L2:7 | $$ |
| 286 | evaluate · evaluate · ^2 − · recall - · neg | 18 | 5.0 | 3.7–5.7 | L2:2 L2:3 L2:4 L2:6 | $-68 - (-7)^{2}$ |
| 287 | fixIt · findMistake · ÷ − · recall H | 5 | 5.0 | 4.7–5.4 | L1:7 L1:8 | $$ |
| 288 | fixIt · isCorrect · ^3 × + · recall M | 4 | 5.0 | 5–5 | L2:6 | $$ |
| 289 | fixIt · insertBrackets · × − ÷ · recall E · grp | 1 | 5.0 | 5–5 | L2:6 | $$ |
| 290 | fixIt · insertBrackets · ^2 − − × · recall E · grp | 1 | 5.0 | 5–5 | L3:2 | $$ |
| 291 | fixIt · insertBrackets · ^2 + ÷ + − · recall E · grp | 2 | 5.0 | 5–5 | L3:2 | $$ |
| 292 | fixIt · insertBrackets · ^2 × ÷ − × · recall E · grp | 1 | 5.0 | 5–5 | L3:2 | $$ |
| 293 | fixIt · insertBrackets · ^2 − ÷ × + · recall E · grp | 1 | 5.0 | 5–5 | L3:2 | $$ |
| 294 | fixIt · insertBrackets · ^2 × + − · recall E · grp | 2 | 5.0 | 4.5–5.5 | L3:1 L3:3 | $$ |
| 295 | fixIt · insertBrackets · + ^2 ÷ + · recall E · grp | 1 | 5.0 | 5–5 | L3:2 | $$ |
| 296 | fixIt · insertBrackets · + + ^2 × − · recall E · grp | 1 | 5.0 | 5–5 | L3:2 | $$ |
| 297 | fixIt · insertBrackets · − ^2 ÷ × + · recall E · grp | 1 | 5.0 | 5–5 | L3:2 | $$ |
| 298 | fixIt · findMistake · + √ × · recall E · grp | 60 | 5.0 | 4.2–5.4 | L3:1 L3:2 L3:3 | $$ |
| 299 | evaluate · evaluate · + ÷ · recall E · grp,neg | 9 | 5.0 | 3.8–7.9 | L2:2 L2:3 L2:4 L3:5 | $5 \div \left(3 + (-2)\right)$ |
| 300 | fixIt · insertBrackets · + + × · recall H · grp | 6 | 5.1 | 4.6–5.8 | L2:4 L2:6 L2:7 | $$ |
| 301 | fixIt · findMistake · ^2 × + · recall M | 7 | 5.1 | 4.2–5.7 | L2:4 L2:6 L2:7 | $$ |
| 302 | evaluate · evaluate · + × · recall H · grp,neg | 5 | 5.1 | 3.9–5.4 | L2:2 L2:5 | $-7 \times \left(-5 + 9\right)$ |
| 303 | fixIt · insertBrackets · + × · recall X · grp | 5 | 5.1 | 5.1–5.1 | L2:6 | $$ |
| 304 | fixIt · isCorrect · ^2 × + · recall M | 8 | 5.1 | 4.2–5.7 | L2:4 L2:6 L2:7 | $$ |
| 305 | evaluate · evaluate · + ^3 + · recall - · grp | 30 | 5.1 | 3.6–7.3 | L2:2 L2:3 L2:4 L2:5 L2:6 L2:7 | $\left(1 + 1\right)^{3} + 12$ |
| 306 | evaluate · evaluate · √ × − · recall M | 6 | 5.1 | 4.5–5.7 | L3:2 L3:3 | $6 \times 3 - \sqrt{9}$ |
| 307 | fixIt · findMistake · ^2 ÷ + − · recall E | 7 | 5.2 | 4.4–6.3 | L2:4 L2:6 L2:7 L2:8 | $$ |
| 308 | fixIt · insertBrackets · ^2 × − × · recall M · grp | 4 | 5.2 | 4.8–5.3 | L3:2 | $$ |
| 309 | evaluate · evaluate · + × · recall X · grp | 6 | 5.2 | 5.1–5.6 | L2:5 | $\left(5 + 12\right) \times 7$ |
| 310 | fixIt · isCorrect · − × · recall H · grp | 2 | 5.2 | 5.1–5.3 | L2:6 | $$ |
| 311 | evaluate · evaluate · √ × · recall H | 23 | 5.2 | 5–6 | L3:3 | $9 \times \sqrt{49}$ |
| 312 | evaluate · evaluate · ÷ − · recall H | 27 | 5.2 | 4.7–5.4 | L1:6 L1:7 | $18 - 64 \div 8$ |
| 313 | fixIt · isCorrect · + × · recall X · grp | 4 | 5.2 | 5.1–5.6 | L2:6 L2:7 | $$ |
| 314 | evaluate · evaluate · √ × − · recall M · neg | 11 | 5.2 | 3.8–6.3 | L3:1 L3:2 L3:3 L3:4 | $-3 \times (-5) - \sqrt{16}$ |
| 315 | fixIt · findMistake · ÷ + × · recall M · grp | 14 | 5.2 | 4.3–6.3 | L2:4 L2:6 L2:7 L2:8 | $$ |
| 316 | fixIt · findMistake · × + − · recall H | 9 | 5.2 | 5–5.7 | L1:7 L1:8 | $$ |
| 317 | fixIt · isCorrect · ^2 ÷ + − · recall E | 2 | 5.3 | 4.9–5.6 | L2:6 L2:7 | $$ |
| 318 | evaluate · evaluate · ^2 − × + · recall E · grp | 7 | 5.3 | 5.1–5.8 | L2:5 L2:6 | $7^{2} + \left(11 - 1\right) \times 6$ |
| 319 | fixIt · findMistake · + × · recall X · grp | 3 | 5.3 | 5.1–5.6 | L2:6 L2:7 | $$ |
| 320 | evaluate · evaluate · + ^2 × + · recall M · grp | 4 | 5.3 | 5.3–5.3 | L2:5 | $3 + 2 \times \left(2 + 1\right)^{2}$ |
| 321 | fixIt · insertBrackets · + ÷ × · recall M · grp | 1 | 5.3 | 5.3–5.3 | L2:6 | $$ |
| 322 | fixIt · insertBrackets · + ^2 × + · recall M · grp | 1 | 5.3 | 5.3–5.3 | L3:2 | $$ |
| 323 | fixIt · insertBrackets · ^2 × + × · recall M · grp | 1 | 5.3 | 5.3–5.3 | L3:2 | $$ |
| 324 | fixIt · insertBrackets · ^2 + + × · recall M · grp | 1 | 5.3 | 5.3–5.3 | L3:2 | $$ |
| 325 | fixIt · insertBrackets · ^2 × − − × · recall E · grp | 1 | 5.3 | 5.3–5.3 | L3:2 | $$ |
| 326 | fixIt · isCorrect · + ÷ · recall M · grp | 19 | 5.3 | 3.8–8.1 | L2:3 L2:4 L2:6 L3:5 L3:6 L3:7 | $$ |
| 327 | evaluate · evaluate · ÷ × + · recall M | 55 | 5.3 | 4.2–6.4 | L1:4 L1:6 L1:7 L1:8 | $24 + 14 \div 2 \times 3$ |
| 328 | fixIt · findMistake · × + × · recall H · grp | 23 | 5.3 | 5.1–5.6 | L2:6 L2:7 | $$ |
| 329 | evaluate · evaluate · ^3 × + · recall M | 2 | 5.3 | 5–5.7 | L2:4 L2:6 | $2 \times 2^{3} + 9$ |
| 330 | evaluate · evaluate · + × − · recall E · grp,neg | 2 | 5.3 | 4.6–6.1 | L2:3 L2:6 | $4 \times \left(2 + 3\right) - (-11)$ |
| 331 | fixIt · isCorrect · ÷ + × · recall M · grp | 17 | 5.4 | 4.3–6.3 | L2:4 L2:6 L2:7 L2:8 | $$ |
| 332 | evaluate · evaluate · √ ^2 + · recall - · neg | 31 | 5.4 | 4.4–6.2 | L3:2 L3:3 L3:4 | $\sqrt{9} + (-5)^{2}$ |
| 333 | fixIt · evaluate · ÷ + · recall H | 1 | 5.4 | 5.4–5.4 | L1:8 | $15 + 81 \div 9$ |
| 334 | fixIt · isCorrect · ÷ − · recall H | 1 | 5.4 | 5.4–5.4 | L1:8 | $$ |
| 335 | evaluate · evaluate · ÷ − + · recall M | 51 | 5.4 | 4.7–6.1 | L1:6 L1:7 | $52 - 36 \div 4 + 1$ |
| 336 | fixIt · insertBrackets · − × + · recall H · grp | 4 | 5.4 | 5.1–5.8 | L2:6 L2:7 | $$ |
| 337 | evaluate · evaluate · √ + · recall - · dec | 6 | 5.5 | 5.2–5.7 | L3:3 | $\sqrt{0.16} + 18$ |
| 338 | fixIt · insertBrackets · ^2 + − ÷ · recall E · grp | 2 | 5.5 | 5.2–5.7 | L3:2 L3:3 | $$ |
| 339 | fixIt · insertBrackets · ÷ + × · recall H · grp | 3 | 5.5 | 5.3–5.8 | L2:6 L2:7 | $$ |
| 340 | evaluate · evaluate · ^3 × · recall H · neg | 7 | 5.5 | 4.8–6 | L2:4 L2:6 | $-4 \times 2^{3}$ |
| 341 | evaluate · evaluate · ÷ + × · recall M · grp | 8 | 5.5 | 4.8–6.3 | L2:4 L2:6 | $\left(12 \div 6 + 9\right) \times 2$ |
| 342 | evaluate · evaluate · × + × · recall H · grp | 18 | 5.5 | 5.1–5.6 | L2:5 | $\left(3 + 4 \times 3\right) \times 2$ |
| 343 | evaluate · evaluate · + ^2 ÷ · recall E · grp,neg | 3 | 5.5 | 5.5–5.5 | L2:5 | $\left(-2 + 5\right)^{2} \div 3$ |
| 344 | evaluate · evaluate · × + × · recall M · grp,neg | 5 | 5.5 | 4.9–6.2 | L2:4 L2:5 L2:6 | $\left(6 + 4 \times (-4)\right) \times (-3)$ |
| 345 | evaluate · evaluate · ^3 × · recall H | 9 | 5.5 | 5–6.5 | L2:4 L2:7 | $2 \times 3^{3}$ |
| 346 | evaluate · evaluate · √ × + · recall M | 4 | 5.5 | 5–6 | L3:3 | $13 + 3 \times \sqrt{144}$ |
| 347 | fixIt · findMistake · ^2 ^2 × + · recall E | 2 | 5.5 | 5.1–5.9 | L2:6 L2:7 | $$ |
| 348 | fixIt · insertBrackets · ^2 + ÷ + + · recall E · grp | 1 | 5.5 | 5.5–5.5 | L3:3 | $$ |
| 349 | fixIt · insertBrackets · ^2 − ÷ × · recall M · grp | 1 | 5.5 | 5.5–5.5 | L3:3 | $$ |
| 350 | fixIt · insertBrackets · ^2 + × + − · recall E · grp | 1 | 5.5 | 5.5–5.5 | L3:3 | $$ |
| 351 | fixIt · insertBrackets · ^2 × ÷ + × · recall E · grp | 1 | 5.5 | 5.5–5.5 | L3:3 | $$ |
| 352 | fixIt · insertBrackets · ^2 ÷ − × · recall M · grp | 2 | 5.5 | 5.5–5.5 | L3:3 | $$ |
| 353 | fixIt · insertBrackets · − ^2 × − − · recall E · grp | 1 | 5.5 | 5.5–5.5 | L3:3 | $$ |
| 354 | fixIt · insertBrackets · ^2 − ÷ − · recall M · grp | 1 | 5.5 | 5.5–5.5 | L3:3 | $$ |
| 355 | fixIt · isCorrect · × + − · recall H | 15 | 5.5 | 5–5.7 | L1:7 L1:8 | $$ |
| 356 | evaluate · evaluate · × + − · recall H | 4 | 5.5 | 5–6.4 | L1:6 L1:7 L1:8 | $16 + 8 \times 7 - 5$ |
| 357 | fixIt · isCorrect · × + × · recall H · grp | 15 | 5.5 | 5.1–5.6 | L2:6 L2:7 | $$ |
| 358 | fixIt · insertBrackets · + × − · recall H · grp | 8 | 5.5 | 5.1–6.3 | L2:6 L2:7 L2:8 | $$ |
| 359 | fixIt · insertBrackets · + × + · recall H · grp | 15 | 5.6 | 5.1–7.3 | L2:6 L2:7 L2:8 | $$ |
| 360 | evaluate · evaluate · ^3 + − · recall - | 6 | 5.6 | 4.7–7.5 | L2:4 L2:5 L2:6 L2:7 | $17 + 2^{3} - 13$ |
| 361 | fixIt · insertBrackets · − × − · recall H · grp | 3 | 5.6 | 5.1–5.8 | L2:6 L2:7 | $$ |
| 362 | fixIt · insertBrackets · ^2 − × + · recall M · grp | 9 | 5.6 | 5.3–6.3 | L3:2 L3:4 | $$ |
| 363 | evaluate · evaluate · − × · recall H · grp,neg | 13 | 5.6 | 4.4–6.1 | L2:3 L2:5 L2:6 | $\left(12 - (-12)\right) \times 5$ |
| 364 | evaluate · evaluate · − × · recall X · grp | 1 | 5.6 | 5.6–5.6 | L2:5 | $\left(19 - 6\right) \times 8$ |
| 365 | evaluate · evaluate · × − + · recall H | 31 | 5.6 | 5–6.4 | L1:6 L1:7 L1:8 | $49 - 8 + 8 \times 6$ |
| 366 | evaluate · evaluate · + √ + · recall - · grp | 26 | 5.6 | 4.2–8.2 | L3:2 L3:3 L3:5 | $\sqrt{36 + 64} + 14$ |
| 367 | fixIt · insertBrackets · ^2 + × − · recall M · grp | 7 | 5.6 | 5.3–6 | L3:2 L3:3 L3:4 | $$ |
| 368 | fixIt · isCorrect · + − × · recall H · grp | 6 | 5.6 | 5.2–5.9 | L2:6 L2:7 | $$ |
| 369 | fixIt · insertBrackets · − ^2 × + · recall M · grp | 2 | 5.7 | 5.3–6 | L3:2 L3:4 | $$ |
| 370 | fixIt · isCorrect · + × − · recall H · grp | 23 | 5.7 | 5.1–6.3 | L2:6 L2:7 L2:8 | $$ |
| 371 | evaluate · evaluate · ÷ ^2 × · recall M · grp | 15 | 5.7 | 5.5–6.5 | L2:5 L2:7 | $3 \times \left(12 \div 4\right)^{2}$ |
| 372 | fixIt · insertBrackets · + ^2 × − · recall M · grp | 6 | 5.7 | 5.3–6 | L3:2 L3:3 L3:4 | $$ |
| 373 | fixIt · insertBrackets · ^2 + × + · recall M · grp | 6 | 5.7 | 5.3–6 | L3:2 L3:3 L3:4 | $$ |
| 374 | evaluate · evaluate · √ − · recall - · dec | 11 | 5.7 | 5.7–5.7 | L3:3 | $29.6 - \sqrt{0.25}$ |
| 375 | fixIt · findMistake · + √ + · recall - · grp | 84 | 5.7 | 4.2–8.9 | L3:1 L3:2 L3:3 L3:7 L3:8 | $$ |
| 376 | fixIt · insertBrackets · ^2 + − × · recall M · grp | 5 | 5.7 | 4.8–6 | L3:2 L3:3 L3:4 | $$ |
| 377 | fixIt · insertBrackets · − × ÷ · recall M · grp | 7 | 5.7 | 4.8–6.3 | L2:6 L2:7 L2:8 | $$ |
| 378 | evaluate · evaluate · ^2 × · recall X · neg | 9 | 5.7 | 5–7.5 | L2:4 L2:6 L2:7 | $-5 \times (-9)^{2}$ |
| 379 | evaluate · evaluate · ^2 × + · recall M · neg | 3 | 5.7 | 5.4–6.1 | L2:5 L2:6 | $(-3)^{2} + 2 \times 7$ |
| 380 | fixIt · insertBrackets · + − × · recall H · grp | 3 | 5.7 | 5.6–5.8 | L2:7 | $$ |
| 381 | evaluate · evaluate · ^3 − · recall - · neg | 13 | 5.7 | 4.5–7 | L2:3 L2:6 L2:7 | $23 - (-3)^{3}$ |
| 382 | evaluate · evaluate · + − × · recall M · grp | 30 | 5.7 | 4.2–6.4 | L2:3 L2:4 L3:3 L3:4 | $\left(6 + 2\right) \times \left(7 - 2\right)$ |
| 383 | fixIt · findMistake · + × − · recall H · grp | 27 | 5.7 | 5.1–6.3 | L2:6 L2:7 L2:8 | $$ |
| 384 | evaluate · evaluate · + × − · recall H · grp | 11 | 5.8 | 5.1–7 | L2:5 L2:6 L2:7 | $4 \times \left(12 + 7\right) - 7$ |
| 385 | evaluate · evaluate · + ÷ · recall M · grp | 40 | 5.8 | 3.8–8.1 | L2:2 L2:3 L2:4 L3:4 L3:5 | $\left(4 + 8\right) \div 6$ |
| 386 | evaluate · evaluate · ^2 × · recall H · neg | 20 | 5.8 | 4–6.7 | L2:2 L2:5 L2:6 L2:7 | $-2 \times 3^{2}$ |
| 387 | fixIt · findMistake · ^3 × + · recall M | 3 | 5.8 | 5.7–6 | L2:7 L2:8 | $$ |
| 388 | fixIt · insertBrackets · + × ÷ · recall M · grp | 1 | 5.8 | 5.8–5.8 | L2:7 | $$ |
| 389 | fixIt · insertBrackets · ^2 + − × − · recall M · grp | 1 | 5.8 | 5.8–5.8 | L3:3 | $$ |
| 390 | fixIt · insertBrackets · ^2 − + × · recall H · grp | 2 | 5.8 | 5.8–5.8 | L3:3 | $$ |
| 391 | fixIt · insertBrackets · − ^2 × × · recall H · grp | 1 | 5.8 | 5.8–5.8 | L3:3 | $$ |
| 392 | fixIt · insertBrackets · − ^2 × − + · recall M · grp | 1 | 5.8 | 5.8–5.8 | L3:3 | $$ |
| 393 | fixIt · insertBrackets · ^2 + × × · recall M · grp | 1 | 5.8 | 5.8–5.8 | L3:3 | $$ |
| 394 | fixIt · insertBrackets · − + ^2 × · recall H · grp | 1 | 5.8 | 5.8–5.8 | L3:3 | $$ |
| 395 | fixIt · insertBrackets · ^2 − + × − · recall M · grp | 1 | 5.8 | 5.8–5.8 | L3:3 | $$ |
| 396 | fixIt · insertBrackets · ^2 × − − · recall M · grp | 1 | 5.8 | 5.8–5.8 | L3:3 | $$ |
| 397 | fixIt · insertBrackets · ^2 − + × + · recall M · grp | 1 | 5.8 | 5.8–5.8 | L3:3 | $$ |
| 398 | fixIt · findMistake · ÷ × · recall H | 36 | 5.8 | 5.7–6.7 | L1:8 | $$ |
| 399 | fixIt · insertBrackets · + × × · recall H · grp | 9 | 5.8 | 4.6–7.6 | L2:4 L2:6 L2:8 | $$ |
| 400 | fixIt · isCorrect · ÷ × · recall H | 38 | 5.8 | 5.7–6.7 | L1:8 | $$ |
| 401 | fixIt · findMistake · + − × · recall H · grp | 11 | 5.9 | 5.2–6.9 | L2:6 L2:7 L2:8 | $$ |
| 402 | fixIt · isCorrect · + √ + · recall - · grp | 88 | 5.9 | 4.2–8.9 | L3:1 L3:2 L3:3 L3:7 L3:8 | $$ |
| 403 | fixIt · insertBrackets · ^2 ÷ + × · recall M · grp | 4 | 5.9 | 5.5–6.5 | L3:3 L3:4 | $$ |
| 404 | evaluate · evaluate · ^3 + · recall - · neg | 6 | 5.9 | 4.5–7 | L2:3 L2:6 L2:7 | $16 + (-4)^{3}$ |
| 405 | evaluate · evaluate · × × + · recall H | 45 | 5.9 | 5–7.7 | L1:6 L1:7 L1:8 | $5 \times 5 + 8 \times 8$ |
| 406 | evaluate · evaluate · + √ × · recall E · grp,dec | 1 | 5.9 | 5.9–5.9 | L3:3 | $\sqrt{4.4 + 20.6} \times 5$ |
| 407 | fixIt · insertBrackets · ^2 − × − · recall M · grp | 5 | 5.9 | 5.3–7 | L3:2 L3:4 L3:5 | $$ |
| 408 | evaluate · evaluate · × × − + · recall M | 27 | 5.9 | 5–7.4 | L1:6 L1:7 L1:8 | $6 \times 5 - 6 \times 4 + 18$ |
| 409 | evaluate · evaluate · × ÷ · recall H | 61 | 5.9 | 4.2–7.2 | L1:4 L1:7 L1:8 | $14 \times 2 \div 7$ |
| 410 | evaluate · evaluate · + ^2 ÷ · recall M · grp | 5 | 5.9 | 5–6.3 | L2:4 L2:6 | $\left(5 + 1\right)^{2} \div 12$ |
| 411 | evaluate · evaluate · + − × · recall E · grp,neg | 10 | 6.0 | 5.2–7.2 | L3:3 L3:4 | $6 \times \left(\left(5 + (-2)\right) - 3\right)$ |
| 412 | evaluate · evaluate · + ^2 + · recall - · grp,neg | 29 | 6.0 | 4.3–9.8 | L2:3 L2:4 L2:5 L2:6 L2:7 L2:8 | $\left(-5 + 1\right)^{2} + (-13)$ |
| 413 | evaluate · evaluate · + √ × · recall M · grp,neg | 10 | 6.0 | 5–8 | L3:3 L3:4 L3:5 | $\sqrt{4 + 12} \times (-5)$ |
| 414 | evaluate · evaluate · √ × · recall M · dec | 9 | 6.0 | 6–6 | L3:3 | $5 \times \sqrt{0.49}$ |
| 415 | fixIt · insertBrackets · ^2 ÷ − + − · recall E · grp | 1 | 6.0 | 6–6 | L3:4 | $$ |
| 416 | fixIt · insertBrackets · ^2 − ÷ + · recall M · grp | 1 | 6.0 | 6–6 | L3:4 | $$ |
| 417 | fixIt · insertBrackets · + ^2 × ÷ × · recall M · grp | 1 | 6.0 | 6–6 | L3:4 | $$ |
| 418 | fixIt · insertBrackets · ÷ + ^2 × · recall M · grp | 1 | 6.0 | 6–6 | L3:4 | $$ |
| 419 | fixIt · insertBrackets · ^2 + ÷ − · recall M · grp | 2 | 6.0 | 6–6 | L3:4 | $$ |
| 420 | evaluate · evaluate · + ^2 × + · recall E · grp,neg | 9 | 6.0 | 4.8–8.5 | L2:4 L2:5 L2:6 L2:8 | $-2 + 3 \times \left(-1 + 2\right)^{2}$ |
| 421 | fixIt · findMistake · × × + · recall H | 6 | 6.0 | 5–6.7 | L1:7 L1:8 | $$ |
| 422 | fixIt · isCorrect · × × − · recall H | 12 | 6.0 | 5–6.7 | L1:7 L1:8 | $$ |
| 423 | evaluate · evaluate · + ^2 − · recall - · grp,neg | 24 | 6.0 | 4.8–8.3 | L2:4 L2:5 L2:6 L2:7 L2:8 | $\left(-5 + 7\right)^{2} - 23$ |
| 424 | evaluate · evaluate · + √ × · recall M · grp | 8 | 6.0 | 5.2–6.9 | L3:3 L3:4 | $\sqrt{5 + 31} \times 3$ |
| 425 | fixIt · isCorrect · × × + · recall H | 15 | 6.1 | 5–7.7 | L1:7 L1:8 | $$ |
| 426 | evaluate · evaluate · ÷ × · recall H | 36 | 6.1 | 5.7–6.7 | L1:7 L1:8 | $63 \div 9 \times 5$ |
| 427 | fixIt · isCorrect · + √ × · recall M · grp | 3 | 6.1 | 5.2–6.9 | L3:2 L3:4 L3:5 | $$ |
| 428 | fixIt · findMistake · × × − · recall H | 12 | 6.1 | 5–7.7 | L1:7 L1:8 | $$ |
| 429 | fixIt · isCorrect · ^3 × · recall H | 4 | 6.1 | 5–6.5 | L2:6 L2:8 | $$ |
| 430 | fixIt · insertBrackets · ^2 ÷ + + − · recall E · grp | 3 | 6.1 | 6–6.2 | L3:4 | $$ |
| 431 | fixIt · isCorrect · ^2 ^2 × + · recall M | 2 | 6.2 | 5.4–6.9 | L2:6 L2:8 | $$ |
| 432 | fixIt · insertBrackets · × − ÷ · recall M · grp | 2 | 6.2 | 5.3–7 | L2:6 L2:8 | $$ |
| 433 | evaluate · evaluate · √ × · recall X · neg | 11 | 6.2 | 5.8–6.8 | L3:3 L3:4 | $-8 \times \sqrt{81}$ |
| 434 | fixIt · insertBrackets · − × × · recall H · grp | 6 | 6.2 | 4.6–7.6 | L2:4 L2:8 | $$ |
| 435 | evaluate · evaluate · × × − · recall H | 17 | 6.2 | 5–7.7 | L1:6 L1:7 L1:8 | $8 \times 7 - 4 \times 3$ |
| 436 | evaluate · evaluate · ÷ ÷ · recall H | 39 | 6.2 | 5.4–6.4 | L1:7 L1:8 | $50 \div 2 \div 5$ |
| 437 | fixIt · insertBrackets · + + × · recall X · grp | 2 | 6.2 | 5.6–6.8 | L2:7 L2:8 | $$ |
| 438 | evaluate · evaluate · √ × − · recall E · dec | 1 | 6.2 | 6.2–6.2 | L3:4 | $3 \times 3 - \sqrt{0.09}$ |
| 439 | evaluate · evaluate · + √ × · recall E · grp,neg | 1 | 6.2 | 6.2–6.2 | L3:4 | $\sqrt{-13 + 38} \times 4$ |
| 440 | fixIt · findMistake · ^3 × · recall H | 5 | 6.2 | 5–6.5 | L2:6 L2:8 | $$ |
| 441 | fixIt · insertBrackets · ^2 ÷ × ÷ + · recall E · grp | 1 | 6.2 | 6.2–6.2 | L3:4 | $$ |
| 442 | fixIt · insertBrackets · ^2 ÷ − ÷ · recall E · grp | 1 | 6.2 | 6.2–6.2 | L3:4 | $$ |
| 443 | fixIt · insertBrackets · ^2 − ÷ × ÷ · recall E · grp | 1 | 6.2 | 6.2–6.2 | L3:4 | $$ |
| 444 | fixIt · insertBrackets · ^2 + ÷ ÷ − · recall E · grp | 1 | 6.2 | 6.2–6.2 | L3:4 | $$ |
| 445 | evaluate · evaluate · + × · recall X · grp,neg | 8 | 6.2 | 5.4–6.9 | L2:5 L2:6 L2:7 | $\left(4 + 7\right) \times (-8)$ |
| 446 | evaluate · evaluate · √ × + · recall M · neg | 8 | 6.2 | 5.3–7.5 | L3:3 L3:4 L3:5 | $-9 + (-5) \times \sqrt{4}$ |
| 447 | fixIt · insertBrackets · × + × · recall H · grp | 13 | 6.2 | 4.6–8.8 | L2:4 L2:6 L2:7 L2:8 | $$ |
| 448 | evaluate · evaluate · ^2 − × + · recall E · grp,neg | 1 | 6.3 | 6.3–6.3 | L2:6 | $(-7)^{2} + \left(13 - 3\right) \times 5$ |
| 449 | evaluate · evaluate · − × + × · recall M · grp | 5 | 6.3 | 5.7–6.7 | L3:3 L3:4 | $5 \times \left(1 + 5 \times \left(6 - 5\right)\right)$ |
| 450 | evaluate · evaluate · + × − ÷ · recall E · grp | 3 | 6.3 | 5.9–6.6 | L3:3 L3:4 | $\left(\left(1 + 3\right) \times 4 - 12\right) \div 2$ |
| 451 | fixIt · insertBrackets · ÷ + × · recall X · grp | 1 | 6.3 | 6.3–6.3 | L2:8 | $$ |
| 452 | fixIt · isCorrect · + ÷ · recall H · grp | 8 | 6.3 | 4.8–9.1 | L2:6 L3:7 L3:8 | $$ |
| 453 | fixIt · insertBrackets · + ÷ × · recall X · grp | 1 | 6.3 | 6.3–6.3 | L2:8 | $$ |
| 454 | fixIt · insertBrackets · ^2 × + × × · recall H · grp | 1 | 6.3 | 6.3–6.3 | L3:4 | $$ |
| 455 | fixIt · insertBrackets · − ^2 × − − · recall M · grp | 1 | 6.3 | 6.3–6.3 | L3:4 | $$ |
| 456 | fixIt · insertBrackets · − ^2 × × + · recall M · grp | 1 | 6.3 | 6.3–6.3 | L3:4 | $$ |
| 457 | fixIt · insertBrackets · ^2 + + − × · recall M · grp | 1 | 6.3 | 6.3–6.3 | L3:4 | $$ |
| 458 | fixIt · insertBrackets · ^2 + × × − · recall M · grp | 1 | 6.3 | 6.3–6.3 | L3:4 | $$ |
| 459 | fixIt · insertBrackets · ^2 + + × + · recall M · grp | 1 | 6.3 | 6.3–6.3 | L3:4 | $$ |
| 460 | evaluate · evaluate · ^2 ^2 − · recall - · neg | 21 | 6.4 | 4.1–8.1 | L2:3 L2:5 L2:6 L2:7 L2:8 | $7^{2} - (-2)^{2}$ |
| 461 | evaluate · evaluate · ^2 − × + · recall M · grp | 10 | 6.4 | 5.3–8 | L2:5 L2:6 L2:7 L2:8 | $4^{2} + \left(10 - 4\right) \times 2$ |
| 462 | fixIt · evaluate · × − + · recall H | 1 | 6.4 | 6.4–6.4 | L1:8 | $25 - 9 + 7 \times 8$ |
| 463 | fixIt · insertBrackets · ^2 ÷ − ÷ × · recall E · grp | 1 | 6.4 | 6.4–6.4 | L3:4 | $$ |
| 464 | fixIt · findMistake · − √ − · recall - · grp | 90 | 6.4 | 5.4–7.6 | L3:3 L3:4 L3:5 L3:6 | $$ |
| 465 | fixIt · isCorrect · − ÷ · recall E · grp | 74 | 6.4 | 5.4–7.1 | L3:3 L3:4 L3:5 | $$ |
| 466 | evaluate · evaluate · ÷ + × · recall M · grp,neg | 3 | 6.4 | 5.8–7.1 | L2:6 L2:7 | $\left(35 \div 7 + (-5)\right) \times 2$ |
| 467 | fixIt · isCorrect · − √ − · recall - · grp | 79 | 6.4 | 5.4–7.6 | L3:3 L3:4 L3:5 L3:6 | $$ |
| 468 | evaluate · evaluate · ^2 + − · recall - · neg | 5 | 6.4 | 4.7–7 | L2:4 L2:7 | $-11 + (-4)^{2} - (-7)$ |
| 469 | evaluate · evaluate · + × − · recall M · grp,neg | 7 | 6.4 | 5.9–7.4 | L2:6 L2:7 | $\left(-7 + 9\right) \times 8 - 8$ |
| 470 | evaluate · evaluate · − ÷ · recall E · grp | 40 | 6.5 | 5.4–7.1 | L3:3 L3:4 | $\dfrac{8 - 6}{2}$ |
| 471 | fixIt · insertBrackets · ^2 + + × · recall H · grp | 9 | 6.5 | 5.8–7.5 | L3:3 L3:4 L3:5 L3:6 | $$ |
| 472 | fixIt · findMistake · − ÷ · recall E · grp | 66 | 6.5 | 5.4–7.1 | L3:3 L3:4 L3:5 | $$ |
| 473 | evaluate · evaluate · ÷ − + · recall H | 31 | 6.5 | 5.7–7.1 | L1:7 L1:8 | $67 - 72 \div 9 + 11$ |
| 474 | evaluate · evaluate · ^3 × + · recall M · neg | 1 | 6.5 | 6.5–6.5 | L2:7 | $4^{3} + (-3) \times (-3)$ |
| 475 | fixIt · insertBrackets · × − ^2 × ÷ · recall M · grp | 1 | 6.5 | 6.5–6.5 | L3:4 | $$ |
| 476 | fixIt · insertBrackets · + + ^2 × + · recall M · grp | 1 | 6.5 | 6.5–6.5 | L3:4 | $$ |
| 477 | fixIt · insertBrackets · ÷ + + ^2 × · recall M · grp | 1 | 6.5 | 6.5–6.5 | L3:4 | $$ |
| 478 | fixIt · insertBrackets · ^2 ÷ − × · recall H · grp | 1 | 6.5 | 6.5–6.5 | L3:4 | $$ |
| 479 | fixIt · insertBrackets · − + ^2 × − · recall M · grp | 1 | 6.5 | 6.5–6.5 | L3:4 | $$ |
| 480 | fixIt · insertBrackets · ÷ − ^2 × − · recall M · grp | 1 | 6.5 | 6.5–6.5 | L3:4 | $$ |
| 481 | fixIt · insertBrackets · ^2 ÷ − + × · recall M · grp | 1 | 6.5 | 6.5–6.5 | L3:4 | $$ |
| 482 | evaluate · evaluate · + ÷ · recall H · grp | 20 | 6.5 | 4.8–9.1 | L2:4 L2:5 L3:6 | $54 \div \left(3 + 3\right)$ |
| 483 | evaluate · evaluate · √ × − · recall H · neg | 8 | 6.5 | 5.3–7.3 | L3:3 L3:4 | $3 \times (-6) - \sqrt{36}$ |
| 484 | fixIt · insertBrackets · − ^2 × − · recall H · grp | 3 | 6.5 | 6.3–7 | L3:4 L3:5 | $$ |
| 485 | fixIt · findMistake · ^2 ^2 × + · recall M | 2 | 6.6 | 6.2–6.9 | L2:8 | $$ |
| 486 | fixIt · findMistake · + √ × · recall M · grp | 4 | 6.6 | 6.2–6.9 | L3:4 L3:5 | $$ |
| 487 | fixIt · findMistake · + ÷ · recall M · grp | 12 | 6.6 | 3.8–8.1 | L2:3 L2:4 L3:5 L3:6 L3:7 | $$ |
| 488 | evaluate · evaluate · + √ + · recall - · grp,neg | 15 | 6.6 | 5.7–9.7 | L3:3 L3:4 L3:5 L3:7 | $\sqrt{36 + 64} + (-19)$ |
| 489 | evaluate · evaluate · + ÷ · recall M · grp,neg | 22 | 6.7 | 5.3–9.5 | L2:5 L2:6 L3:6 L3:7 | $\left(-1 + (-7)\right) \div 4$ |
| 490 | evaluate · evaluate · ^2 × + · recall H | 10 | 6.7 | 5.2–7.7 | L2:5 L2:6 L2:7 L2:8 | $3 \times 4^{2} + 13$ |
| 491 | evaluate · evaluate · − × · recall X · grp,neg | 27 | 6.7 | 5.4–7.9 | L2:5 L2:6 L2:7 L2:8 | $\left(-10 - (-4)\right) \times (-9)$ |
| 492 | evaluate · evaluate · − √ − · recall - · grp | 58 | 6.7 | 5.4–7.6 | L3:3 L3:4 L3:5 | $13 - \sqrt{100 - 36}$ |
| 493 | evaluate · evaluate · + − × · recall H · grp | 9 | 6.7 | 5.7–7.4 | L2:6 L2:7 L3:4 L3:5 | $\left(11 + 10\right) \times \left(7 - 4\right)$ |
| 494 | fixIt · evaluate · × ÷ · recall H | 1 | 6.7 | 6.7–6.7 | L1:8 | $21 \times 2 \div 7$ |
| 495 | fixIt · findMistake · ^3 ^3 − · recall - | 2 | 6.7 | 6.7–6.7 | L2:8 | $$ |
| 496 | fixIt · isCorrect · ^3 ^3 − · recall - | 1 | 6.7 | 6.7–6.7 | L2:8 | $$ |
| 497 | fixIt · findMistake · + − × · recall X · grp | 1 | 6.7 | 6.7–6.7 | L2:8 | $$ |
| 498 | fixIt · findMistake · ^2 ÷ + − · recall M | 1 | 6.7 | 6.7–6.7 | L2:8 | $$ |
| 499 | fixIt · insertBrackets · ^2 ÷ + × · recall H · grp | 5 | 6.7 | 6.5–7 | L3:4 L3:5 | $$ |
| 500 | fixIt · insertBrackets · ^2 + − × ÷ · recall M · grp | 1 | 6.7 | 6.7–6.7 | L3:5 | $$ |
| 501 | fixIt · insertBrackets · ^2 + ÷ × ÷ · recall E · grp | 1 | 6.7 | 6.7–6.7 | L3:5 | $$ |
| 502 | fixIt · isCorrect · ^2 × + · recall H | 13 | 6.7 | 5.9–8.2 | L2:7 L2:8 | $$ |
| 503 | fixIt · findMistake · ^2 × + · recall H | 19 | 6.7 | 5.2–8.2 | L2:6 L2:7 L2:8 | $$ |
| 504 | fixIt · insertBrackets · ^2 + − × · recall H · grp | 8 | 6.7 | 5.8–7.5 | L3:3 L3:4 L3:5 L3:6 | $$ |
| 505 | fixIt · insertBrackets · × − × · recall H · grp | 3 | 6.7 | 5.6–7.3 | L2:7 L2:8 | $$ |
| 506 | fixIt · findMistake · + ÷ + · recall E · grp | 16 | 6.7 | 6.4–7.6 | L3:4 L3:5 L3:6 | $$ |
| 507 | fixIt · insertBrackets · ^2 + × − − · recall M · grp | 2 | 6.8 | 6.5–7 | L3:4 L3:5 | $$ |
| 508 | fixIt · insertBrackets · ^2 + ÷ × · recall M · grp | 2 | 6.8 | 6.5–7 | L3:4 L3:5 | $$ |
| 509 | evaluate · evaluate · + ^2 ÷ · recall H · grp | 7 | 6.8 | 6.8–6.8 | L2:7 | $\left(3 + 6\right)^{2} \div 9$ |
| 510 | evaluate · evaluate · ÷ + × · recall H · grp | 1 | 6.8 | 6.8–6.8 | L2:7 | $\left(40 \div 8 + 8\right) \times 2$ |
| 511 | fixIt · insertBrackets · ^2 × + × + · recall M · grp | 1 | 6.8 | 6.8–6.8 | L3:5 | $$ |
| 512 | fixIt · insertBrackets · ^2 + − − × · recall M · grp | 1 | 6.8 | 6.8–6.8 | L3:5 | $$ |
| 513 | evaluate · evaluate · + ÷ + · recall E · grp | 10 | 6.8 | 6.4–7.4 | L3:4 L3:5 | $\dfrac{15 + 10}{5} + 9$ |
| 514 | fixIt · insertBrackets · + ^2 × + · recall H · grp | 6 | 6.8 | 6.3–7.5 | L3:4 L3:5 L3:6 | $$ |
| 515 | fixIt · isCorrect · + ÷ + · recall E · grp | 17 | 6.8 | 5.9–7.6 | L3:3 L3:4 L3:5 L3:6 | $$ |
| 516 | fixIt · insertBrackets · ^2 + × + − · recall M · grp | 4 | 6.8 | 6.3–7.7 | L3:4 L3:5 L3:6 | $$ |
| 517 | fixIt · findMistake · + − ÷ · recall E · grp | 5 | 6.9 | 6.4–7.6 | L3:4 L3:5 L3:6 | $$ |
| 518 | evaluate · evaluate · ÷ ^2 × · recall H · grp | 21 | 6.9 | 6.5–7.5 | L2:7 | $3 \times \left(40 \div 8\right)^{2}$ |
| 519 | evaluate · evaluate · ^3 ^3 − · recall - | 11 | 6.9 | 5–8.5 | L2:4 L2:6 L2:7 L2:8 | $4^{3} - 2^{3}$ |
| 520 | fixIt · findMistake · × + ÷ · recall E · grp | 5 | 6.9 | 6.9–6.9 | L3:5 | $$ |
| 521 | fixIt · insertBrackets · ^2 + − × + · recall M · grp | 2 | 6.9 | 5.8–8 | L3:3 L3:7 | $$ |
| 522 | fixIt · insertBrackets · ^2 − × + · recall H · grp | 5 | 6.9 | 6.3–7.5 | L3:4 L3:5 L3:6 | $$ |
| 523 | fixIt · isCorrect · ^2 ÷ + − · recall M | 2 | 6.9 | 6.6–7.3 | L2:8 | $$ |
| 524 | evaluate · evaluate · + ^2 × + · recall H · grp | 21 | 7.0 | 6.3–8.1 | L2:6 L2:7 L2:8 | $4 + 3 \times \left(1 + 3\right)^{2}$ |
| 525 | fixIt · insertBrackets · ^2 + × + · recall H · grp | 15 | 7.0 | 6.3–8.5 | L3:4 L3:5 L3:6 L3:7 | $$ |
| 526 | fixIt · insertBrackets · + ^2 × − · recall H · grp | 5 | 7.0 | 6.3–7.8 | L3:4 L3:5 L3:6 | $$ |
| 527 | evaluate · evaluate · + − × · recall M · grp,neg | 22 | 7.0 | 4.5–8.2 | L2:5 L2:7 L2:8 L3:2 L3:3 L3:4 L3:5 | $\left(-11 + 8\right) \times \left(-15 - (-5)\right)$ |
| 528 | fixIt · insertBrackets · ^2 − × × · recall H · grp | 6 | 7.0 | 5.8–10 | L3:3 L3:4 L3:5 L3:6 L3:8 | $$ |
| 529 | fixIt · insertBrackets · ^2 − − × − · recall M · grp | 1 | 7.0 | 7–7 | L3:5 | $$ |
| 530 | fixIt · insertBrackets · ^2 − × ÷ · recall M · grp | 1 | 7.0 | 7–7 | L3:5 | $$ |
| 531 | fixIt · insertBrackets · ^2 × × ÷ − · recall M · grp | 1 | 7.0 | 7–7 | L3:5 | $$ |
| 532 | fixIt · insertBrackets · ^2 − × + + · recall M · grp | 1 | 7.0 | 7–7 | L3:5 | $$ |
| 533 | fixIt · insertBrackets · ^2 + × − + · recall M · grp | 1 | 7.0 | 7–7 | L3:5 | $$ |
| 534 | fixIt · insertBrackets · ^2 + ÷ × + · recall M · grp | 1 | 7.0 | 7–7 | L3:5 | $$ |
| 535 | fixIt · insertBrackets · + + ^2 × − · recall M · grp | 1 | 7.0 | 7–7 | L3:5 | $$ |
| 536 | fixIt · insertBrackets · ^2 × ÷ + × · recall M · grp | 1 | 7.0 | 7–7 | L3:5 | $$ |
| 537 | fixIt · insertBrackets · ÷ + ^2 × · recall H · grp | 1 | 7.0 | 7–7 | L3:5 | $$ |
| 538 | fixIt · insertBrackets · + ^2 × + + · recall M · grp | 1 | 7.0 | 7–7 | L3:5 | $$ |
| 539 | fixIt · insertBrackets · × − ^2 × + · recall M · grp | 1 | 7.0 | 7–7 | L3:5 | $$ |
| 540 | fixIt · isCorrect · − ÷ + · recall E · grp | 6 | 7.0 | 6.4–7.6 | L3:4 L3:5 L3:6 | $$ |
| 541 | fixIt · insertBrackets · × + × · recall X · grp | 6 | 7.0 | 5.6–8.6 | L2:7 L2:8 | $$ |
| 542 | evaluate · evaluate · + ^3 + · recall - · grp,neg | 32 | 7.0 | 5.1–9.3 | L2:5 L2:7 L2:8 | $\left(1 + (-1)\right)^{3} + 20$ |
| 543 | evaluate · evaluate · ÷ × + · recall H | 24 | 7.0 | 6.7–8.4 | L1:8 | $17 + 42 \div 7 \times 5$ |
| 544 | evaluate · evaluate · ÷ ^2 × · recall M · grp,neg | 8 | 7.0 | 5.3–8.1 | L2:5 L2:6 L2:7 L2:8 | $-2 \times \left(12 \div 6\right)^{2}$ |
| 545 | fixIt · insertBrackets · ^2 − × − · recall H · grp | 4 | 7.1 | 6.3–8.2 | L3:4 L3:6 L3:7 | $$ |
| 546 | evaluate · evaluate · + − ÷ · recall E · grp | 6 | 7.1 | 6.4–8.1 | L3:4 L3:5 | $\dfrac{1 + 5}{12 - 9}$ |
| 547 | fixIt · insertBrackets · + × + · recall X · grp | 2 | 7.1 | 7.1–7.1 | L2:8 | $$ |
| 548 | fixIt · insertBrackets · + × × · recall X · grp | 2 | 7.1 | 6.1–8.1 | L2:8 | $$ |
| 549 | fixIt · insertBrackets · ^2 × + − × · recall M · grp | 4 | 7.1 | 6.3–8.3 | L3:4 L3:5 L3:7 | $$ |
| 550 | fixIt · isCorrect · + − ÷ · recall E · grp | 7 | 7.1 | 6.4–8.8 | L3:4 L3:5 L3:7 | $$ |
| 551 | evaluate · evaluate · ^3 × + · recall H | 3 | 7.1 | 6–7.7 | L2:6 L2:8 | $3 \times 3^{3} + 4$ |
| 552 | fixIt · insertBrackets · ^2 + × × · recall H · grp | 3 | 7.1 | 6.8–7.3 | L3:5 L3:6 | $$ |
| 553 | evaluate · evaluate · − ÷ + · recall E · grp | 7 | 7.1 | 6.9–8.1 | L3:4 L3:5 | $\dfrac{20 - 8}{3} + 11$ |
| 554 | fixIt · isCorrect · × + ÷ · recall E · grp | 6 | 7.1 | 6.9–7.4 | L3:5 L3:6 | $$ |
| 555 | fixIt · insertBrackets · ^2 − × + − · recall M · grp | 4 | 7.1 | 6.3–8.2 | L3:4 L3:5 L3:6 L3:7 | $$ |
| 556 | fixIt · isCorrect · ^3 × + · recall H | 8 | 7.2 | 6–9.2 | L2:8 | $$ |
| 557 | evaluate · evaluate · + × − · recall H · grp,neg | 4 | 7.2 | 6.6–8.4 | L2:7 L2:8 | $6 \times \left(6 + 2\right) - (-11)$ |
| 558 | fixIt · findMistake · ^3 × + · recall E | 2 | 7.2 | 7.2–7.2 | L2:8 | $$ |
| 559 | fixIt · insertBrackets · ^2 − + + ÷ · recall M · grp | 1 | 7.2 | 7.2–7.2 | L3:5 | $$ |
| 560 | fixIt · insertBrackets · + ^2 ÷ ÷ + · recall M · grp | 1 | 7.2 | 7.2–7.2 | L3:5 | $$ |
| 561 | fixIt · findMistake · + × − · recall X · grp | 7 | 7.2 | 6.1–8.3 | L2:8 | $$ |
| 562 | evaluate · evaluate · × + × · recall H · grp,neg | 4 | 7.2 | 6.4–7.9 | L2:6 L2:7 L2:8 | $\left(-2 + (-4) \times (-5)\right) \times 4$ |
| 563 | fixIt · insertBrackets · ^2 − × − + · recall M · grp | 2 | 7.3 | 6.3–8.2 | L3:4 L3:7 | $$ |
| 564 | fixIt · insertBrackets · + ^2 × + − · recall H · grp | 2 | 7.3 | 7.3–7.3 | L3:6 | $$ |
| 565 | fixIt · insertBrackets · ^2 − × + − · recall H · grp | 1 | 7.3 | 7.3–7.3 | L3:6 | $$ |
| 566 | fixIt · insertBrackets · + ^2 × × − · recall M · grp | 1 | 7.3 | 7.3–7.3 | L3:6 | $$ |
| 567 | fixIt · insertBrackets · + ^2 × × · recall H · grp | 1 | 7.3 | 7.3–7.3 | L3:6 | $$ |
| 568 | evaluate · evaluate · × + × · recall X · grp,neg | 8 | 7.3 | 5.9–8.7 | L2:6 L2:7 L2:8 | $\left(6 + 4 \times 2\right) \times (-3)$ |
| 569 | fixIt · insertBrackets · ^2 + + × + · recall H · grp | 4 | 7.4 | 6.8–8 | L3:5 L3:6 L3:7 | $$ |
| 570 | fixIt · insertBrackets · ^2 + + × · recall X · grp | 3 | 7.4 | 6.8–8 | L3:5 L3:6 L3:7 | $$ |
| 571 | fixIt · insertBrackets · ^2 + × − · recall H · grp | 4 | 7.4 | 6.8–8.2 | L3:5 L3:6 L3:7 | $$ |
| 572 | evaluate · evaluate · − ^2 + · recall - · grp,neg | 24 | 7.4 | 4.3–10.3 | L2:3 L2:5 L2:6 L2:7 L2:8 | $\left(6 - (-4)\right)^{2} + (-6)$ |
| 573 | evaluate · evaluate · + √ × · recall M · grp,dec | 2 | 7.4 | 7.4–7.4 | L3:5 | $3.5 \times \sqrt{36 + 64}$ |
| 574 | fixIt · insertBrackets · ^2 − − × − · recall H · grp | 2 | 7.4 | 6.8–8 | L3:5 L3:7 | $$ |
| 575 | evaluate · evaluate · × × − + · recall H | 22 | 7.5 | 6–9.4 | L1:7 L1:8 | $8 \times 9 - 7 \times 4 + 11$ |
| 576 | evaluate · evaluate · − √ − · recall - · grp,dec | 8 | 7.5 | 6.6–8.1 | L3:4 L3:5 | $21.3 - \sqrt{100 - 64}$ |
| 577 | evaluate · evaluate · ^2 ^2 × + · recall M · neg | 1 | 7.5 | 7.5–7.5 | L2:7 | $9^{2} + (-2) \times 2^{2}$ |
| 578 | evaluate · evaluate · ^3 × · recall X | 2 | 7.5 | 7.5–7.5 | L2:7 | $2 \times 5^{3}$ |
| 579 | evaluate · evaluate · × + ÷ · recall E · grp | 2 | 7.5 | 6.9–8.1 | L3:4 L3:5 | $\dfrac{5 + 5 \times 2}{5}$ |
| 580 | fixIt · findMistake · ^3 × · recall X | 1 | 7.5 | 7.5–7.5 | L2:8 | $$ |
| 581 | fixIt · insertBrackets · ^2 + × + + · recall M · grp | 1 | 7.5 | 7.5–7.5 | L3:6 | $$ |
| 582 | fixIt · insertBrackets · + ^2 × ÷ + · recall M · grp | 1 | 7.5 | 7.5–7.5 | L3:6 | $$ |
| 583 | fixIt · insertBrackets · + ^2 × + − · recall M · grp | 1 | 7.5 | 7.5–7.5 | L3:6 | $$ |
| 584 | fixIt · insertBrackets · ^2 + × ÷ × · recall M · grp | 2 | 7.5 | 6–9 | L3:4 L3:8 | $$ |
| 585 | fixIt · insertBrackets · + ^2 × ÷ · recall X · grp | 1 | 7.5 | 7.5–7.5 | L3:6 | $$ |
| 586 | fixIt · insertBrackets · ^2 + − + × · recall H · grp | 2 | 7.5 | 7.5–7.5 | L3:6 | $$ |
| 587 | fixIt · insertBrackets · ÷ + ^2 × − · recall H · grp | 1 | 7.5 | 7.5–7.5 | L3:6 | $$ |
| 588 | fixIt · insertBrackets · ^2 ÷ + + × · recall H · grp | 2 | 7.5 | 7–8 | L3:5 L3:7 | $$ |
| 589 | fixIt · insertBrackets · ^2 − + × − · recall H · grp | 1 | 7.5 | 7.5–7.5 | L3:6 | $$ |
| 590 | fixIt · insertBrackets · − ^2 × × − · recall H · grp | 1 | 7.5 | 7.5–7.5 | L3:6 | $$ |
| 591 | fixIt · insertBrackets · ^2 + × ÷ + · recall M · grp | 2 | 7.5 | 7.5–7.5 | L3:6 | $$ |
| 592 | fixIt · insertBrackets · ^2 × − + ÷ · recall H · grp | 1 | 7.5 | 7.5–7.5 | L3:6 | $$ |
| 593 | fixIt · insertBrackets · ^2 × + ÷ · recall M · grp | 1 | 7.5 | 7.5–7.5 | L3:6 | $$ |
| 594 | evaluate · evaluate · − √ − · recall - · grp,neg | 42 | 7.5 | 6.4–8.4 | L3:4 L3:5 L3:6 | $-23 - \sqrt{100 - 36}$ |
| 595 | evaluate · evaluate · + × − · recall X · grp | 5 | 7.6 | 7.1–7.8 | L2:7 L2:8 | $7 \times \left(12 + 11\right) - 1$ |
| 596 | evaluate · evaluate · + ^2 × + · recall M · grp,neg | 10 | 7.6 | 5.6–9.3 | L2:5 L2:6 L2:7 L2:8 | $5 + (-3) \times \left(-4 + 2\right)^{2}$ |
| 597 | evaluate · evaluate · ^3 × · recall X · neg | 18 | 7.6 | 5.8–9.5 | L2:6 L2:7 L2:8 | $-2 \times (-5)^{3}$ |
| 598 | evaluate · evaluate · + ÷ · recall E · grp,dec | 3 | 7.6 | 7.6–7.6 | L3:5 | $\dfrac{12.2 + 2.8}{3}$ |
| 599 | evaluate · evaluate · + − ÷ · recall E · grp,dec | 1 | 7.6 | 7.6–7.6 | L3:5 | $\dfrac{2.8 + 5.2}{6 - 2}$ |
| 600 | fixIt · insertBrackets · − ^2 × ÷ + · recall M · grp | 2 | 7.6 | 6.5–8.7 | L3:4 L3:7 | $$ |
| 601 | fixIt · insertBrackets · ^2 ÷ + × − · recall M · grp | 2 | 7.6 | 6.5–8.7 | L3:4 L3:7 | $$ |
| 602 | fixIt · insertBrackets · ^2 − + + × · recall H · grp | 2 | 7.7 | 7.5–7.8 | L3:6 | $$ |
| 603 | fixIt · findMistake · − ÷ + · recall E · grp | 7 | 7.7 | 6.9–8.1 | L3:5 L3:6 L3:7 | $$ |
| 604 | fixIt · isCorrect · + − × · recall X · grp | 5 | 7.7 | 6.7–8.7 | L2:8 | $$ |
| 605 | fixIt · isCorrect · + × − · recall X · grp | 3 | 7.7 | 7.6–7.8 | L2:8 | $$ |
| 606 | fixIt · findMistake · − ÷ · recall M · grp | 13 | 7.7 | 7.4–8.1 | L3:6 L3:7 | $$ |
| 607 | fixIt · isCorrect · − ÷ · recall M · grp | 10 | 7.7 | 7.4–8.1 | L3:6 L3:7 | $$ |
| 608 | fixIt · insertBrackets · × − × · recall X · grp | 4 | 7.7 | 6.6–8.3 | L2:8 | $$ |
| 609 | fixIt · insertBrackets · ^2 + × ÷ − · recall M · grp | 1 | 7.7 | 7.7–7.7 | L3:6 | $$ |
| 610 | evaluate · evaluate · + ^2 ÷ · recall M · grp,neg | 3 | 7.8 | 7.3–8.3 | L2:7 L2:8 | $\left(-3 + 9\right)^{2} \div 9$ |
| 611 | evaluate · evaluate · + √ × · recall H · grp | 5 | 7.8 | 7.2–10.2 | L3:4 L3:7 | $\sqrt{23 + 13} \times 6$ |
| 612 | fixIt · insertBrackets · − × ÷ · recall H · grp | 2 | 7.8 | 7.8–7.8 | L2:8 | $$ |
| 613 | fixIt · insertBrackets · × + ^2 × · recall H · grp | 2 | 7.8 | 7.8–7.8 | L3:6 | $$ |
| 614 | fixIt · insertBrackets · ^2 × − × − · recall M · grp | 1 | 7.8 | 7.8–7.8 | L3:6 | $$ |
| 615 | fixIt · insertBrackets · ^2 + − × · recall X · grp | 1 | 7.8 | 7.8–7.8 | L3:6 | $$ |
| 616 | fixIt · insertBrackets · ^2 × × − × · recall M · grp | 1 | 7.8 | 7.8–7.8 | L3:6 | $$ |
| 617 | fixIt · insertBrackets · × − ^2 × · recall H · grp | 1 | 7.8 | 7.8–7.8 | L3:6 | $$ |
| 618 | evaluate · evaluate · ^2 − × + · recall H · grp | 2 | 7.8 | 7.3–8.3 | L2:7 L2:8 | $3^{2} + \left(12 - 1\right) \times 6$ |
| 619 | fixIt · insertBrackets · ^2 − × × − · recall H · grp | 2 | 7.8 | 7.3–8.3 | L3:6 L3:7 | $$ |
| 620 | evaluate · evaluate · ^2 × + · recall H · neg | 5 | 7.8 | 6.5–9.4 | L2:7 L2:8 | $(-3)^{2} + 4 \times (-6)$ |
| 621 | evaluate · evaluate · ^3 × + · recall H · neg | 2 | 7.9 | 7.3–8.5 | L2:7 L2:8 | $4 \times (-2)^{3} + 15$ |
| 622 | evaluate · evaluate · √ × + · recall M · dec | 2 | 7.9 | 7.7–8.2 | L3:5 | $6 + 3 \times \sqrt{0.64}$ |
| 623 | fixIt · insertBrackets · ^2 ÷ + × · recall X · grp | 3 | 8.0 | 8–8 | L3:7 | $$ |
| 624 | fixIt · insertBrackets · ^2 + × × − · recall H · grp | 1 | 8.0 | 8–8 | L3:7 | $$ |
| 625 | fixIt · insertBrackets · ^2 − × − − · recall H · grp | 1 | 8.0 | 8–8 | L3:7 | $$ |
| 626 | fixIt · insertBrackets · + + ^2 × + · recall H · grp | 1 | 8.0 | 8–8 | L3:7 | $$ |
| 627 | fixIt · insertBrackets · × + ^2 × + · recall H · grp | 1 | 8.0 | 8–8 | L3:7 | $$ |
| 628 | fixIt · findMistake · ^3 × + · recall H | 4 | 8.0 | 6–9.2 | L2:8 | $$ |
| 629 | evaluate · evaluate · − ÷ · recall M · grp | 3 | 8.1 | 8.1–8.1 | L3:5 | $\dfrac{42 - 24}{6}$ |
| 630 | evaluate · evaluate · + − × · recall M · grp,dec | 1 | 8.1 | 8.1–8.1 | L3:5 | $5.5 \times \left(\left(1.4 + 4.8\right) - 6\right)$ |
| 631 | fixIt · findMistake · + − ÷ · recall M · grp | 8 | 8.1 | 7.4–9.1 | L3:6 L3:7 L3:8 | $$ |
| 632 | fixIt · insertBrackets · ^2 × + × · recall X · grp | 5 | 8.1 | 7.3–8.8 | L3:6 L3:7 | $$ |
| 633 | evaluate · evaluate · ^3 + − · recall - · neg | 3 | 8.1 | 8–8.2 | L2:8 | $16 + (-3)^{3} - 9$ |
| 634 | evaluate · evaluate · × ÷ · recall M · grp,neg | 3 | 8.1 | 7.8–8.8 | L3:5 L3:6 | $\dfrac{10 \times (-5)}{5}$ |
| 635 | evaluate · evaluate · × ÷ · recall M · grp | 15 | 8.1 | 7.4–8.9 | L3:5 L3:6 | $\dfrac{8 \times 2}{2}$ |
| 636 | fixIt · isCorrect · ^2 − ÷ · recall E · grp | 11 | 8.1 | 7.1–9.1 | L3:5 L3:6 L3:7 L3:8 | $$ |
| 637 | fixIt · insertBrackets · ^2 + + + × · recall H · grp | 5 | 8.2 | 6.8–9.2 | L3:5 L3:6 L3:7 L3:8 | $$ |
| 638 | fixIt · isCorrect · ^2 ÷ + − · recall H | 5 | 8.2 | 7.2–9.1 | L2:8 | $$ |
| 639 | fixIt · insertBrackets · ^2 ÷ + × − · recall H · grp | 2 | 8.2 | 8.2–8.2 | L3:7 | $$ |
| 640 | fixIt · findMistake · ^2 ÷ + − · recall H | 3 | 8.2 | 7.2–9.1 | L2:8 | $$ |
| 641 | evaluate · evaluate · + ÷ · recall X · grp,neg | 12 | 8.3 | 6.4–12.5 | L2:6 L2:7 L2:8 L3:8 | $-81 \div \left(5 + 4\right)$ |
| 642 | fixIt · insertBrackets · ^2 + × × + · recall H · grp | 5 | 8.3 | 6.8–10.5 | L3:5 L3:6 L3:7 L3:8 | $$ |
| 643 | evaluate · evaluate · √ × + · recall H · neg | 1 | 8.3 | 8.3–8.3 | L3:5 | $8 + (-5) \times \sqrt{121}$ |
| 644 | fixIt · insertBrackets · × + ÷ · recall H · grp | 1 | 8.3 | 8.3–8.3 | L2:8 | $$ |
| 645 | fixIt · insertBrackets · ^2 × − × + · recall M · grp | 1 | 8.3 | 8.3–8.3 | L3:7 | $$ |
| 646 | fixIt · insertBrackets · ^2 − + × + · recall H · grp | 1 | 8.3 | 8.3–8.3 | L3:7 | $$ |
| 647 | fixIt · insertBrackets · ^2 + × × · recall X · grp | 1 | 8.3 | 8.3–8.3 | L3:7 | $$ |
| 648 | fixIt · findMistake · − ÷ + · recall M · grp | 13 | 8.3 | 7.9–9.1 | L3:7 L3:8 | $$ |
| 649 | evaluate · evaluate · ^2 ^2 × + · recall H | 11 | 8.3 | 7.2–9.7 | L2:7 L2:8 | $9^{2} + 2 \times 4^{2}$ |
| 650 | evaluate · evaluate · − ÷ + · recall M · grp | 10 | 8.3 | 7.9–9.1 | L3:5 L3:6 | $\dfrac{46 - 10}{4} + 10$ |
| 651 | evaluate · evaluate · + − ÷ · recall M · grp | 10 | 8.3 | 7.4–9.1 | L3:5 L3:6 | $\dfrac{16 + 29}{6 - 1}$ |
| 652 | evaluate · evaluate · + × − ÷ · recall M · grp | 24 | 8.4 | 7.4–9.6 | L3:5 L3:6 L3:7 | $\left(\left(1 + 7\right) \times 4 - 12\right) \div 5$ |
| 653 | fixIt · isCorrect · ^2 ^2 × + · recall H | 16 | 8.4 | 6.4–10.2 | L2:8 | $$ |
| 654 | fixIt · isCorrect · − ÷ + · recall M · grp | 11 | 8.4 | 7.9–9.1 | L3:7 L3:8 | $$ |
| 655 | evaluate · evaluate · + × − · recall X · grp,neg | 4 | 8.4 | 7.4–9.4 | L2:7 L2:8 | $\left(-7 + (-9)\right) \times 4 - 5$ |
| 656 | evaluate · evaluate · + − ÷ · recall E · grp,neg | 1 | 8.4 | 8.4–8.4 | L3:6 | $\dfrac{-1 + 13}{6 - 3}$ |
| 657 | fixIt · findMistake · + ÷ · recall H · grp | 1 | 8.4 | 8.4–8.4 | L3:7 | $$ |
| 658 | evaluate · evaluate · √ ^2 + · recall - · dec | 10 | 8.4 | 8.4–8.4 | L3:6 | $\sqrt{0.04} + 1.2^{2}$ |
| 659 | fixIt · findMistake · + ÷ + · recall M · grp | 46 | 8.4 | 7.4–9.6 | L3:6 L3:7 L3:8 | $$ |
| 660 | fixIt · findMistake · ^2 ^2 × + · recall H | 21 | 8.4 | 6.4–10.2 | L2:8 | $$ |
| 661 | evaluate · evaluate · + ÷ + · recall M · grp | 17 | 8.4 | 7.9–9.6 | L3:5 L3:6 L3:7 | $\dfrac{25 + 35}{5} + 7$ |
| 662 | evaluate · evaluate · + ÷ · recall M · grp,dec | 3 | 8.4 | 8.1–8.6 | L3:5 L3:6 | $\dfrac{2.5 + 13.5}{8}$ |
| 663 | fixIt · insertBrackets · ^2 × − × · recall H · grp | 3 | 8.4 | 7.5–9.3 | L3:6 L3:7 L3:8 | $$ |
| 664 | evaluate · evaluate · ÷ + × · recall H · grp,neg | 5 | 8.4 | 6.4–9.7 | L2:6 L2:8 | $\left(-36 \div (-9) + 1\right) \times 3$ |
| 665 | fixIt · isCorrect · + ÷ + · recall M · grp | 49 | 8.4 | 7.4–9.6 | L3:6 L3:7 L3:8 | $$ |
| 666 | evaluate · evaluate · ÷ ^2 × · recall H · grp,neg | 29 | 8.5 | 6.3–10.3 | L2:6 L2:7 L2:8 | $-5 \times \left(-21 \div 7\right)^{2}$ |
| 667 | fixIt · findMistake · ^2 − ÷ · recall E · grp | 14 | 8.5 | 7.6–9.1 | L3:6 L3:7 L3:8 | $$ |
| 668 | evaluate · evaluate · ^2 − ÷ · recall E · grp | 13 | 8.5 | 7.6–9.1 | L3:5 L3:6 | $\dfrac{9^{2} - 65}{4}$ |
| 669 | evaluate · evaluate · ^2 ^2 + √ + · recall - · grp | 31 | 8.5 | 6.6–12.6 | L3:4 L3:7 L3:8 | $\sqrt{6^{2} + 8^{2}} + 14$ |
| 670 | evaluate · evaluate · × ÷ · recall X | 5 | 8.5 | 7.7–8.7 | L1:8 | $18 \times 8 \div 9$ |
| 671 | evaluate · evaluate · − × + × · recall M · grp,neg | 3 | 8.5 | 8–9 | L3:5 L3:6 | $3 \times \left(7 + (-2) \times \left(-6 - (-4)\right)\right)$ |
| 672 | fixIt · insertBrackets · ^2 + + × − · recall H · grp | 1 | 8.5 | 8.5–8.5 | L3:7 | $$ |
| 673 | fixIt · insertBrackets · ^2 ÷ + − × · recall X · grp | 1 | 8.5 | 8.5–8.5 | L3:7 | $$ |
| 674 | fixIt · insertBrackets · + ^2 × + + · recall H · grp | 2 | 8.6 | 7.3–9.8 | L3:6 L3:8 | $$ |
| 675 | evaluate · evaluate · ^2 − × + · recall M · grp,neg | 10 | 8.6 | 6.8–10.1 | L2:7 L2:8 | $(-4)^{2} + \left(8 - (-3)\right) \times 5$ |
| 676 | evaluate · evaluate · + − × · recall H · grp,dec | 6 | 8.6 | 8.6–8.6 | L3:6 | $4 \times \left(\left(5.2 + 2\right) - 5.6\right)$ |
| 677 | evaluate · evaluate · ÷ ^2 × · recall X · grp,neg | 18 | 8.6 | 7.3–11.1 | L2:7 L2:8 | $-3 \times \left(20 \div 4\right)^{2}$ |
| 678 | evaluate · evaluate · + ÷ + · recall E · grp,neg | 5 | 8.7 | 7.9–9.6 | L3:5 L3:6 L3:7 | $\dfrac{6 + 4}{2} + (-1)$ |
| 679 | evaluate · evaluate · + − × · recall H · grp,neg | 18 | 8.7 | 7–9.5 | L2:7 L2:8 L3:5 L3:6 L3:7 | $\left(7 + (-4)\right) \times \left(-14 - (-2)\right)$ |
| 680 | evaluate · evaluate · × + ÷ · recall M · grp | 9 | 8.7 | 8.4–9.4 | L3:6 L3:7 | $\dfrac{2 + 3 \times 6}{4}$ |
| 681 | evaluate · evaluate · − × + × · recall H · grp | 51 | 8.7 | 7.2–9.9 | L3:4 L3:5 L3:6 L3:7 | $3 \times \left(1 + 3 \times \left(7 - 1\right)\right)$ |
| 682 | fixIt · isCorrect · + − ÷ · recall M · grp | 4 | 8.7 | 7.9–9.1 | L3:7 L3:8 | $$ |
| 683 | fixIt · insertBrackets · + ^2 × ÷ − · recall M · grp | 1 | 8.7 | 8.7–8.7 | L3:7 | $$ |
| 684 | fixIt · insertBrackets · ^2 + × − + · recall H · grp | 1 | 8.7 | 8.7–8.7 | L3:7 | $$ |
| 685 | fixIt · insertBrackets · ^2 + − × − · recall H · grp | 1 | 8.7 | 8.7–8.7 | L3:7 | $$ |
| 686 | evaluate · evaluate · − ÷ + · recall E · grp,neg | 5 | 8.7 | 8.4–9.6 | L3:6 L3:7 | $\dfrac{20 - 12}{4} + (-13)$ |
| 687 | fixIt · insertBrackets · + ^2 × × − · recall H · grp | 3 | 8.8 | 6.8–11 | L3:5 L3:7 L3:8 | $$ |
| 688 | evaluate · evaluate · + × − ÷ · recall E · grp,neg | 4 | 8.8 | 8.4–8.9 | L3:6 | $\left(\left(-7 + 9\right) \times 2 - (-2)\right) \div 2$ |
| 689 | fixIt · isCorrect · × + ÷ · recall M · grp | 16 | 8.8 | 7.9–10.1 | L3:7 L3:8 | $$ |
| 690 | evaluate · evaluate · + ^2 ÷ · recall H · grp,neg | 1 | 8.8 | 8.8–8.8 | L2:8 | $\left(-7 + 15\right)^{2} \div 8$ |
| 691 | evaluate · evaluate · ^2 − ÷ · recall E · grp,neg | 5 | 8.8 | 8.6–9.1 | L3:6 | $\dfrac{3^{2} - (-6)}{5}$ |
| 692 | fixIt · insertBrackets · ^2 − × + · recall X · grp | 1 | 8.8 | 8.8–8.8 | L3:7 | $$ |
| 693 | fixIt · insertBrackets · ^2 × + × − · recall X · grp | 1 | 8.8 | 8.8–8.8 | L3:7 | $$ |
| 694 | fixIt · insertBrackets · ^2 + + × − · recall X · grp | 1 | 8.8 | 8.8–8.8 | L3:7 | $$ |
| 695 | evaluate · evaluate · + ÷ · recall H · grp,neg | 19 | 8.8 | 5.4–10.9 | L2:5 L2:7 L3:7 | $\left(-28 + 76\right) \div 6$ |
| 696 | fixIt · findMistake · × + ÷ · recall M · grp | 21 | 8.9 | 7.9–10.1 | L3:7 L3:8 | $$ |
| 697 | fixIt · insertBrackets · ^2 × + × · recall H · grp | 10 | 8.9 | 6.8–10 | L3:5 L3:6 L3:7 L3:8 | $$ |
| 698 | fixIt · insertBrackets · ^2 + × + + · recall H · grp | 3 | 8.9 | 7.5–11.2 | L3:6 L3:7 L3:8 | $$ |
| 699 | evaluate · evaluate · + √ + · recall - · grp,dec | 5 | 8.9 | 7.1–9.4 | L3:4 L3:7 | $\sqrt{25 + 144} + 18.9$ |
| 700 | evaluate · evaluate · + √ × · recall H · grp,neg | 2 | 9.0 | 8.5–9.5 | L3:6 L3:7 | $\sqrt{-56 + 120} \times (-5)$ |
| 701 | evaluate · evaluate · + ÷ + · recall H · grp | 5 | 9.0 | 8.9–9.4 | L3:6 L3:7 | $\dfrac{12 + 36}{6} + 2$ |
| 702 | fixIt · insertBrackets · ^2 + × − · recall X · grp | 1 | 9.0 | 9–9 | L3:8 | $$ |
| 703 | fixIt · insertBrackets · + ^2 × ÷ · recall H · grp | 2 | 9.0 | 9–9 | L3:8 | $$ |
| 704 | fixIt · insertBrackets · ^2 + ÷ × + · recall X · grp | 1 | 9.0 | 9–9 | L3:8 | $$ |
| 705 | evaluate · evaluate · ^2 ÷ + − · recall H | 1 | 9.1 | 9.1–9.1 | L2:8 | $14 + 18 - 8^{2} \div 4$ |
| 706 | evaluate · evaluate · + × − ÷ · recall H · grp | 10 | 9.2 | 8.4–10.1 | L3:6 L3:7 | $\left(\left(6 + 7\right) \times 4 - 36\right) \div 2$ |
| 707 | fixIt · insertBrackets · ^2 − × + + · recall H · grp | 1 | 9.2 | 9.2–9.2 | L3:8 | $$ |
| 708 | fixIt · isCorrect · + − ÷ · recall H · grp | 2 | 9.3 | 8.9–9.6 | L3:8 | $$ |
| 709 | fixIt · insertBrackets · + + ^2 × · recall X · grp | 1 | 9.3 | 9.3–9.3 | L3:8 | $$ |
| 710 | evaluate · evaluate · − ÷ + · recall H · grp | 4 | 9.3 | 8.9–9.6 | L3:6 L3:7 | $\dfrac{88 - 7}{9} + 7$ |
| 711 | evaluate · evaluate · + ÷ + · recall M · grp,dec | 3 | 9.3 | 8.6–10.8 | L3:6 L3:7 | $\dfrac{18 + 18}{3} + 8.3$ |
| 712 | fixIt · insertBrackets · ^2 + × + − · recall H · grp | 2 | 9.4 | 8.8–9.9 | L3:7 L3:8 | $$ |
| 713 | fixIt · isCorrect · + ÷ + · recall H · grp | 7 | 9.4 | 8.9–10.1 | L3:8 | $$ |
| 714 | evaluate · evaluate · ^3 × + · recall X · neg | 2 | 9.4 | 9.3–9.5 | L2:8 | $-4 \times 3^{3} + 18$ |
| 715 | evaluate · evaluate · × + ÷ · recall H · grp | 1 | 9.4 | 9.4–9.4 | L3:7 | $\dfrac{42 + 4 \times 3}{6}$ |
| 716 | evaluate · evaluate · ^2 − ÷ · recall M · grp | 16 | 9.5 | 8.6–10.1 | L3:6 L3:7 | $\dfrac{6^{2} - 6}{5}$ |
| 717 | evaluate · evaluate · ^2 × + · recall X · neg | 3 | 9.5 | 8.7–11 | L2:8 | $-3 \times (-8)^{2} + 18$ |
| 718 | evaluate · evaluate · + √ × · recall X · grp,neg | 1 | 9.5 | 9.5–9.5 | L3:7 | $\sqrt{-32 + 68} \times (-6)$ |
| 719 | fixIt · findMistake · ^3 × + · recall X | 1 | 9.5 | 9.5–9.5 | L2:8 | $$ |
| 720 | fixIt · insertBrackets · ^2 + − × × · recall H · grp | 2 | 9.5 | 7.8–11.2 | L3:6 L3:8 | $$ |
| 721 | fixIt · insertBrackets · ^2 + × ÷ · recall H · grp | 3 | 9.5 | 9–10 | L3:8 | $$ |
| 722 | fixIt · insertBrackets · ^2 ÷ × + × · recall H · grp | 2 | 9.5 | 8–11 | L3:7 L3:8 | $$ |
| 723 | fixIt · findMistake · − ÷ + · recall H · grp | 2 | 9.5 | 9.4–9.6 | L3:8 | $$ |
| 724 | fixIt · findMistake · ^2 − ÷ · recall M · grp | 10 | 9.5 | 8.6–10.1 | L3:7 L3:8 | $$ |
| 725 | fixIt · isCorrect · − ÷ + · recall H · grp | 4 | 9.6 | 9.4–9.6 | L3:8 | $$ |
| 726 | fixIt · findMistake · + ÷ + · recall H · grp | 19 | 9.6 | 8.9–10.6 | L3:8 | $$ |
| 727 | fixIt · isCorrect · ^2 − ÷ · recall M · grp | 5 | 9.7 | 9.4–10.1 | L3:8 | $$ |
| 728 | evaluate · evaluate · × ÷ · recall H · grp | 57 | 9.7 | 7.9–11.4 | L3:5 L3:7 L3:8 | $\dfrac{24 \times 2}{4}$ |
| 729 | evaluate · evaluate · √ × − · recall X · dec | 1 | 9.7 | 9.7–9.7 | L3:7 | $6 \times 4.5 - \sqrt{0.49}$ |
| 730 | fixIt · insertBrackets · + ^2 ÷ × ÷ · recall M · grp | 1 | 9.7 | 9.7–9.7 | L3:8 | $$ |
| 731 | fixIt · insertBrackets · + ^2 × ÷ + · recall H · grp | 1 | 9.7 | 9.7–9.7 | L3:8 | $$ |
| 732 | fixIt · insertBrackets · ^2 + + ÷ × · recall H · grp | 1 | 9.7 | 9.7–9.7 | L3:8 | $$ |
| 733 | evaluate · evaluate · ^2 − × + · recall H · grp,neg | 11 | 9.7 | 8.3–11.6 | L2:8 | $9^{2} + \left(-6 - 2\right) \times (-4)$ |
| 734 | fixIt · insertBrackets · + × ÷ · recall X · grp | 1 | 9.8 | 9.8–9.8 | L2:8 | $$ |
| 735 | fixIt · insertBrackets · ^2 × + − × · recall X · grp | 1 | 9.8 | 9.8–9.8 | L3:8 | $$ |
| 736 | fixIt · insertBrackets · × + + ^2 × · recall H · grp | 1 | 9.8 | 9.8–9.8 | L3:8 | $$ |
| 737 | fixIt · insertBrackets · ^2 + + × × · recall X · grp | 1 | 9.8 | 9.8–9.8 | L3:8 | $$ |
| 738 | evaluate · evaluate · + ^2 × + · recall H · grp,neg | 7 | 9.9 | 7.8–12.3 | L2:8 | $5 + 3 \times \left(-2 + (-2)\right)^{2}$ |
| 739 | evaluate · evaluate · + − × · recall X · grp,neg | 14 | 9.9 | 8.5–10.5 | L2:8 L3:6 L3:7 | $\left(4 + 12\right) \times \left(-10 - (-4)\right)$ |
| 740 | fixIt · insertBrackets · ^2 × + + × · recall H · grp | 2 | 9.9 | 9.5–10.3 | L3:8 | $$ |
| 741 | fixIt · insertBrackets · ^2 + × × + · recall X · grp | 2 | 9.9 | 8.8–11 | L3:7 L3:8 | $$ |
| 742 | evaluate · evaluate · ^2 ^2 + √ + · recall - · grp,neg | 18 | 9.9 | 8.1–13.4 | L3:5 L3:6 L3:7 L3:8 | $\sqrt{6^{2} + 8^{2}} + (-11)$ |
| 743 | evaluate · evaluate · + × − ÷ · recall M · grp,neg | 12 | 9.9 | 8.4–11.2 | L3:6 L3:7 L3:8 | $\left(\left(1 + 1\right) \times (-5) - (-22)\right) \div 3$ |
| 744 | evaluate · evaluate · ^3 ^3 − · recall - · neg | 6 | 10.0 | 7.7–12.4 | L2:8 | $(-2)^{3} - (-4)^{3}$ |
| 745 | fixIt · insertBrackets · ^2 × ÷ + × · recall H · grp | 2 | 10.0 | 9.5–10.5 | L3:8 | $$ |
| 746 | evaluate · evaluate · ^2 − ÷ · recall M · grp,neg | 23 | 10.0 | 9.6–10.9 | L3:7 | $\dfrac{3^{2} - (-7)}{2}$ |
| 747 | evaluate · evaluate · + − ÷ · recall M · grp,neg | 7 | 10.1 | 9.4–11.2 | L3:7 L3:8 | $\dfrac{-2 + (-6)}{6 - 4}$ |
| 748 | evaluate · evaluate · + ÷ + · recall M · grp,neg | 10 | 10.2 | 8.9–11.1 | L3:6 L3:7 L3:8 | $\dfrac{15 + 21}{3} + (-1)$ |
| 749 | fixIt · findMistake · + √ × · recall H · grp | 4 | 10.2 | 10.2–10.2 | L3:8 | $$ |
| 750 | fixIt · isCorrect · + √ × · recall H · grp | 14 | 10.2 | 10.2–10.2 | L3:8 | $$ |
| 751 | evaluate · evaluate · + ^2 × + · recall X · grp,neg | 7 | 10.2 | 8.6–13.1 | L2:8 | $-3 + (-3) \times \left(4 + 4\right)^{2}$ |
| 752 | evaluate · evaluate · + − × · recall X · grp,dec | 8 | 10.3 | 8.4–12.1 | L3:6 L3:7 L3:8 | $5 \times \left(\left(6.4 + 3.4\right) - 1\right)$ |
| 753 | evaluate · evaluate · ^2 ÷ + − · recall H · neg | 1 | 10.3 | 10.3–10.3 | L2:8 | $14 + 6 - (-9)^{2} \div 9$ |
| 754 | evaluate · evaluate · + − ÷ · recall M · grp,dec | 3 | 10.3 | 10.3–10.3 | L3:7 | $\dfrac{43.9 + 1.1}{14 - 9}$ |
| 755 | evaluate · evaluate · × + ÷ · recall M · grp,neg | 5 | 10.3 | 9.7–10.7 | L3:7 | $\dfrac{29 + (-3) \times 3}{5}$ |
| 756 | evaluate · evaluate · + × − ÷ · recall H · grp,dec | 1 | 10.3 | 10.3–10.3 | L3:7 | $\left(\left(8.7 + 5.3\right) \times 3 - 38\right) \div 2$ |
| 757 | fixIt · insertBrackets · ^2 − × + − · recall X · grp | 1 | 10.3 | 10.3–10.3 | L3:8 | $$ |
| 758 | fixIt · insertBrackets · + ^2 × + + · recall X · grp | 1 | 10.3 | 10.3–10.3 | L3:8 | $$ |
| 759 | fixIt · isCorrect · × + ÷ · recall H · grp | 6 | 10.3 | 9.4–11.1 | L3:8 | $$ |
| 760 | evaluate · evaluate · ^2 ^2 × + · recall X · neg | 3 | 10.4 | 9.9–10.7 | L2:8 | $(-3)^{2} + (-4) \times 4^{2}$ |
| 761 | evaluate · evaluate · + ÷ + · recall H · grp,neg | 1 | 10.4 | 10.4–10.4 | L3:7 | $\dfrac{30 + 18}{6} + (-4)$ |
| 762 | evaluate · evaluate · ^2 ^2 × + · recall H · neg | 5 | 10.5 | 7.7–12.6 | L2:8 | $(-7)^{2} + 4 \times (-4)^{2}$ |
| 763 | fixIt · insertBrackets · ^2 − − × × · recall H · grp | 1 | 10.5 | 10.5–10.5 | L3:8 | $$ |
| 764 | fixIt · findMistake · × + ÷ · recall H · grp | 4 | 10.6 | 10.4–11.1 | L3:8 | $$ |
| 765 | fixIt · insertBrackets · ^2 × + ÷ · recall H · grp | 2 | 10.6 | 10.2–11 | L3:8 | $$ |
| 766 | fixIt · insertBrackets · ^2 × − × · recall X · grp | 3 | 10.6 | 9.5–12.5 | L3:8 | $$ |
| 767 | evaluate · evaluate · ÷ + × · recall X · grp,neg | 1 | 10.7 | 10.7–10.7 | L2:8 | $\left(32 \div (-8) + (-9)\right) \times 4$ |
| 768 | fixIt · insertBrackets · ^2 ÷ − × − · recall X · grp | 1 | 10.7 | 10.7–10.7 | L3:8 | $$ |
| 769 | fixIt · findMistake · + − ÷ · recall H · grp | 1 | 10.8 | 10.8–10.8 | L3:8 | $$ |
| 770 | evaluate · evaluate · − ÷ + · recall M · grp,neg | 7 | 10.9 | 9.9–11.5 | L3:7 L3:8 | $\dfrac{31 - 7}{4} + (-18)$ |
| 771 | evaluate · evaluate · − × + × · recall H · grp,neg | 14 | 10.9 | 7.5–13.2 | L3:5 L3:7 L3:8 | $2 \times \left(2 + (-2) \times \left(-10 - (-4)\right)\right)$ |
| 772 | evaluate · evaluate · × ÷ · recall H · grp,neg | 10 | 11.0 | 9.8–11.8 | L3:7 L3:8 | $\dfrac{12 \times (-4)}{4}$ |
| 773 | fixIt · insertBrackets · ^2 + × − − · recall X · grp | 1 | 11.0 | 11–11 | L3:8 | $$ |
| 774 | fixIt · insertBrackets · + ^2 × − · recall X · grp | 1 | 11.0 | 11–11 | L3:8 | $$ |
| 775 | fixIt · insertBrackets · ^2 + × ÷ · recall X · grp | 1 | 11.2 | 11.2–11.2 | L3:8 | $$ |
| 776 | evaluate · evaluate · ^2 − ÷ · recall H · grp,neg | 5 | 11.3 | 11.1–11.9 | L3:8 | $\dfrac{4^{2} - (-38)}{6}$ |
| 777 | fixIt · insertBrackets · ^2 × + × + · recall H · grp | 3 | 11.3 | 10.5–12 | L3:8 | $$ |
| 778 | evaluate · evaluate · + − ÷ · recall H · grp,dec | 1 | 11.4 | 11.4–11.4 | L3:8 | $\dfrac{4 + 9.8}{7 - 4}$ |
| 779 | evaluate · evaluate · + ÷ · recall X · grp,dec | 3 | 11.4 | 11.4–11.4 | L3:8 | $\dfrac{14 + 17.5}{5}$ |
| 780 | evaluate · evaluate · + ÷ · recall H · grp,dec | 1 | 11.4 | 11.4–11.4 | L3:8 | $\dfrac{11 + 4.6}{4}$ |
| 781 | evaluate · evaluate · ^2 − × + · recall X · grp,neg | 2 | 11.5 | 10.9–12.1 | L2:8 | $(-7)^{2} + \left(5 - (-4)\right) \times (-6)$ |
| 782 | evaluate · evaluate · + − ÷ · recall H · grp,neg | 5 | 11.5 | 11–12.2 | L3:7 L3:8 | $\dfrac{-16 + (-11)}{5 - 2}$ |
| 783 | evaluate · evaluate · + ÷ + · recall X · grp,dec | 2 | 11.6 | 11.6–11.6 | L3:8 | $\dfrac{36 + 42}{6} + 1.3$ |
| 784 | evaluate · evaluate · × + ÷ · recall H · grp,dec | 2 | 11.6 | 11.6–11.6 | L3:8 | $\dfrac{9.3 + 3 \times 4.9}{4}$ |
| 785 | evaluate · evaluate · − ÷ + · recall H · grp,neg | 4 | 11.7 | 10.4–13 | L3:7 L3:8 | $\dfrac{52 - (-12)}{8} + 18$ |
| 786 | fixIt · insertBrackets · ^2 × − ÷ · recall X · grp | 1 | 11.7 | 11.7–11.7 | L3:8 | $$ |
| 787 | evaluate · evaluate · + ÷ + · recall X · grp,neg | 1 | 11.9 | 11.9–11.9 | L3:8 | $\dfrac{42 + 36}{6} + (-2)$ |
| 788 | fixIt · insertBrackets · ^2 + × + + · recall X · grp | 2 | 11.9 | 10.8–13 | L3:8 | $$ |
| 789 | evaluate · evaluate · + × − ÷ · recall X · grp,neg | 5 | 12.0 | 10.7–13.2 | L3:7 L3:8 | $\left(\left(-6 + (-7)\right) \times 2 - (-41)\right) \div 5$ |
| 790 | evaluate · evaluate · × + ÷ · recall H · grp,neg | 11 | 12.1 | 10.7–13.3 | L3:7 L3:8 | $\dfrac{-16 + 4 \times (-5)}{4}$ |
| 791 | evaluate · evaluate · × ÷ · recall X · grp | 3 | 12.1 | 11.4–12.4 | L3:8 | $\dfrac{32 \times 8}{8}$ |
| 792 | evaluate · evaluate · + × − ÷ · recall H · grp,neg | 10 | 12.1 | 9.4–14.7 | L3:7 L3:8 | $\left(\left(2 + 9\right) \times (-5) - (-67)\right) \div 2$ |
| 793 | evaluate · evaluate · × + ÷ · recall X · grp,dec | 3 | 12.1 | 11.4–12.6 | L3:8 | $\dfrac{22.6 + 4 \times 5.6}{5}$ |
| 794 | fixIt · insertBrackets · ^2 + × × − · recall X · grp | 1 | 12.3 | 12.3–12.3 | L3:8 | $$ |
| 795 | evaluate · evaluate · × ÷ · recall X · grp,neg | 31 | 12.4 | 10.3–14.8 | L3:7 L3:8 | $\dfrac{16 \times (-4)}{8}$ |
| 796 | evaluate · evaluate · × + ÷ · recall X · grp,neg | 2 | 12.5 | 12.5–12.5 | L3:8 | $\dfrac{-54 + 4 \times 3}{6}$ |
| 797 | fixIt · insertBrackets · ^2 − × × + · recall X · grp | 1 | 12.5 | 12.5–12.5 | L3:8 | $$ |
| 798 | evaluate · evaluate · + − ÷ · recall X · grp,dec | 3 | 12.6 | 11.6–13.1 | L3:8 | $\dfrac{3.2 + 27.8}{11 - 6}$ |
| 799 | fixIt · insertBrackets · ^2 + × − + · recall X · grp | 1 | 12.9 | 12.9–12.9 | L3:8 | $$ |
| 800 | evaluate · evaluate · + × − ÷ · recall X · grp,dec | 10 | 12.9 | 11.6–14.3 | L3:8 | $\left(\left(6 + 6.3\right) \times 3 - 20.9\right) \div 4$ |
| 801 | evaluate · evaluate · − × + × · recall X · grp,neg | 34 | 13.1 | 8.5–15.3 | L3:6 L3:7 L3:8 | $-2 \times \left(4 + (-5) \times \left(-8 - 1\right)\right)$ |
| 802 | evaluate · evaluate · ^2 − ÷ · recall X · grp,dec | 4 | 13.2 | 12.6–13.4 | L3:8 | $\dfrac{5^{2} - 11.4}{2}$ |
| 803 | evaluate · evaluate · − ÷ + · recall X · grp,dec | 2 | 13.3 | 13.1–13.6 | L3:8 | $\dfrac{14.6 - 3}{2} + 12$ |
| 804 | evaluate · evaluate · − × + × · recall X · grp,dec | 8 | 13.4 | 9.4–15.6 | L3:7 L3:8 | $5 \times \left(8.9 + 2 \times \left(9 - 4\right)\right)$ |
| 805 | evaluate · evaluate · − ÷ + · recall X · grp,neg | 2 | 13.5 | 13.5–13.5 | L3:8 | $\dfrac{-32 - 16}{6} + (-2)$ |
| 806 | fixIt · insertBrackets · ^2 + × × ÷ · recall X · grp | 1 | 14.0 | 14–14 | L3:8 | $$ |
| 807 | evaluate · evaluate · × ÷ · recall X · grp,dec | 11 | 14.1 | 13.2–15.2 | L3:8 | $\dfrac{8 \times 3.4}{2}$ |
| 808 | evaluate · evaluate · ^2 ^2 + √ + · recall - · grp,dec | 9 | 14.2 | 11.8–15 | L3:8 | $\sqrt{0.5^{2} + 1.2^{2}} + 1$ |
