# Order of Operations — difficulty calibration

Generated from **3600** questions (every Focus at every level, whole / negative / decimal numbers where offered). Regenerate: `CALIBRATE=1 npx vitest run src/tests/orderDifficulty.test.ts`.

## How a question is scored

The score is the cost of the work the question asks for, added up — **not** a weight on the option that produced it. Higher = harder. A question's score is what the Smart Progressor sorts a worksheet by.

| Piece | Cost |
|---|---|
| × recall | ×1 or ×10: 0.5 · both ≤ 5: 1 · one factor 6–10, the other ≤ 5: 2 · both 6–9: 3 · ×11 / ×12 with a factor ≤ 5: 2.5, with a factor ≥ 6: 3.5 · two-digit × 2–5: 3 (3.5 above 50) · two-digit × 6–9: 4 · two-digit × two-digit: 6 · decimal: +2 · negative: +0.8 |
| ÷ | the matching × fact + 0.7 (division is the multiplication read backwards); not exact: 4 (+1.5 if a decimal) |
| + − | operands ≤ 10: 0.5 · two-digit: 1 · bigger: 2 · a carry or exchange: +0.7 · decimals: +1.2 · a negative: +1.5 |
| Powers | square: base ≤ 5: 1.2, 6–9: 2, 10: 1, 11–12: 2.5 · cube: 2 (≤ 3), 3 (4), 3.5 (5) · negative base: +1.2 |
| Roots | √ of ≤ 25: 1.5, ≤ 100: 2, ≤ 144: 2.5 |
| Reading the line | each bracket 0.6 · brackets inside brackets or a fraction bar +1 · fraction bar 1.5 · a root over a sum 0.6 · a leading minus before a power 1 |

## The eight bands

A worksheet is ordered by **band** (1 easiest … 8 hardest). Questions in the same band mingle in random order; a band-8 question never comes before a band-1 one. Bands are relative to the level: the cut points below are the 12.5% … 87.5% quantiles of each level's questions, so each band holds about an eighth of what the level can generate.

| Level | Cut points (score at which the next band starts) | Share per band (1 … 8) |
|---|---|---|
| level1 | 2.7 · 3.4 · 4 · 4.7 · 5 · 5.7 · 6.4 | 7% 19% 12% 14% 9% 15% 9% 16% |
| level2 | 3.8 · 4.6 · 5.2 · 5.7 · 6.5 · 7.5 · 8.6 | 11% 13% 15% 12% 13% 12% 12% 12% |
| level3 | 5.2 · 6.5 · 7.7 · 8.6 · 9.7 · 10.9 · 12.7 | 12% 13% 12% 11% 14% 14% 13% 12% |

## Spread by level

| Level | Questions | Min | 25th | Median | 75th | Max |
|---|---|---|---|---|---|---|
| level1 | 600 | 1.5 | 3 | 4.4 | 5.4 | 9.4 |
| level2 | 1200 | 1.6 | 4.6 | 5.6 | 7.4 | 13.8 |
| level3 | 1800 | 2 | 6.5 | 8.6 | 10.9 | 16.6 |

## Spread by option (Focus · Numbers)

| Level · Focus · Numbers | n | Median | Range |
|---|---|---|---|
| level1 · basic · whole | 200 | 4 | 2–6.7 |
| level1 · chain · whole | 200 | 3.7 | 1.5–8.7 |
| level1 · mixed · whole | 200 | 5.1 | 3–9.4 |
| level2 · brackets · whole | 200 | 4.8 | 1.6–9.2 |
| level2 · brackets · negatives | 200 | 6.1 | 2.4–11.4 |
| level2 · indices · whole | 200 | 4.9 | 1.7–10.2 |
| level2 · indices · negatives | 200 | 5.9 | 3.4–13 |
| level2 · bracketsIndices · whole | 200 | 5.5 | 2.8–8.6 |
| level2 · bracketsIndices · negatives | 200 | 7.8 | 4.3–13.8 |
| level3 · roots · whole | 200 | 4.7 | 2–12.6 |
| level3 · roots · negatives | 200 | 5.8 | 3.3–13.4 |
| level3 · roots · decimals | 200 | 7.4 | 5.2–15 |
| level3 · fraction · whole | 200 | 8.4 | 5.4–12.4 |
| level3 · fraction · negatives | 200 | 10.6 | 7.9–14.8 |
| level3 · fraction · decimals | 200 | 10.9 | 7.1–15.4 |
| level3 · nested · whole | 200 | 7.7 | 3.7–10.6 |
| level3 · nested · negatives | 200 | 10.2 | 5.2–15.3 |
| level3 · nested · decimals | 200 | 11.8 | 6.1–16.6 |

## Categories, easiest to hardest (319 found)

A category is the operations in the order they happen, the hardest recall they need (E easy, M mid, H hard, X beyond the grid) and what makes the line awkward. Within a category the score still varies with the actual numbers.

| # | Category | n | Mean score | Range | Bands (level:band) | Example |
|---|---|---|---|---|---|---|
| 1 | − × · recall E · grp | 3 | 1.9 | 1.6–2.1 | L2:1 | $\left(8 - 6\right) \times 3$ |
| 2 | + × · recall E · grp | 1 | 2.1 | 2.1–2.1 | L2:1 | $\left(2 + 3\right) \times 5$ |
| 3 | ^2 × · recall E | 3 | 2.2 | 2.2–2.2 | L2:1 | $2 \times 2^{2}$ |
| 4 | × − · recall E | 11 | 2.3 | 2–2.7 | L1:1 L1:2 | $39 - 3 \times 2$ |
| 5 | × + · recall E | 8 | 2.3 | 2–2.7 | L1:1 L1:2 | $12 + 3 \times 5$ |
| 6 | − + · recall - | 43 | 2.4 | 1.5–3.4 | L1:1 L1:2 L1:3 | $33 - 8 + 16$ |
| 7 | √ × · recall E | 7 | 2.5 | 2.5–2.5 | L3:1 | $5 \times \sqrt{16}$ |
| 8 | − − · recall - | 29 | 2.6 | 2–3.4 | L1:1 L1:2 L1:3 | $32 - 15 - 16$ |
| 9 | × + × · recall E · grp | 1 | 2.6 | 2.6–2.6 | L2:1 | $\left(2 + 4 \times 2\right) \times 3$ |
| 10 | √ + · recall - | 18 | 2.7 | 2–4.2 | L3:1 | $\sqrt{49} + 19$ |
| 11 | ÷ × · recall E | 4 | 2.7 | 2.7–2.7 | L1:2 | $10 \div 5 \times 5$ |
| 12 | ÷ + · recall E | 7 | 2.7 | 2.2–3.4 | L1:1 L1:2 L1:3 | $14 + 8 \div 4$ |
| 13 | + − · recall - · grp | 20 | 2.9 | 2.1–3.3 | L2:1 | $53 - \left(3 + 12\right)$ |
| 14 | ÷ ÷ · recall E | 5 | 2.9 | 2.9–2.9 | L1:2 | $20 \div 2 \div 2$ |
| 15 | ^2 + · recall - | 23 | 3.0 | 1.7–3.7 | L2:1 | $25 + 7^{2}$ |
| 16 | ÷ − · recall E | 10 | 3.0 | 2.7–3.4 | L1:2 L1:3 | $33 - 9 \div 3$ |
| 17 | × × − · recall E | 1 | 3.0 | 3–3 | L1:2 | $3 \times 4 - 2 \times 5$ |
| 18 | × × + · recall E | 1 | 3.0 | 3–3 | L1:2 | $2 \times 3 + 4 \times 5$ |
| 19 | × + · recall M | 18 | 3.1 | 3–3.7 | L1:2 L1:3 | $16 + 9 \times 4$ |
| 20 | √ − · recall - | 19 | 3.1 | 2.5–3.7 | L3:1 | $33 - \sqrt{64}$ |
| 21 | ^2 − · recall - | 5 | 3.1 | 2.2–3.7 | L2:1 | $90 - 8^{2}$ |
| 22 | × − · recall M | 16 | 3.1 | 3–3.7 | L1:2 L1:3 | $35 - 8 \times 4$ |
| 23 | ^2 × · recall M | 2 | 3.2 | 3.2–3.2 | L2:1 | $4 \times 3^{2}$ |
| 24 | × + − · recall E | 5 | 3.3 | 3–3.7 | L1:2 L1:3 | $11 + 5 \times 2 - 15$ |
| 25 | + × · recall M · grp | 8 | 3.3 | 3.1–3.6 | L2:1 | $2 \times \left(4 + 8\right)$ |
| 26 | + × − · recall E · grp | 3 | 3.3 | 3.3–3.3 | L2:1 | $\left(8 + 2\right) \times 9 - 8$ |
| 27 | √ × · recall M · neg | 2 | 3.3 | 3.3–3.3 | L3:1 | $-5 \times \sqrt{9}$ |
| 28 | √ × + · recall E | 6 | 3.3 | 3–3.5 | L3:1 | $15 + 2 \times \sqrt{4}$ |
| 29 | + × · recall E · grp,neg | 4 | 3.4 | 3.1–3.6 | L2:1 | $2 \times \left(8 + (-8)\right)$ |
| 30 | √ × − · recall E | 13 | 3.5 | 3–4.7 | L3:1 | $2 \times 4 - \sqrt{4}$ |
| 31 | ^2 × + · recall E | 5 | 3.5 | 3.2–3.9 | L2:1 L2:2 | $4 \times 2^{2} + 11$ |
| 32 | × − + · recall E | 20 | 3.6 | 3–4.4 | L1:2 L1:3 L1:4 | $47 - 10 + 2 \times 2$ |
| 33 | − × · recall E · grp,neg | 1 | 3.6 | 3.6–3.6 | L2:1 | $\left(-13 - (-13)\right) \times 4$ |
| 34 | √ × · recall M | 8 | 3.7 | 3.5–4 | L3:1 | $7 \times \sqrt{9}$ |
| 35 | + ^2 ÷ · recall E · grp | 12 | 3.8 | 3.5–4 | L2:1 L2:2 | $\left(3 + 2\right)^{2} \div 5$ |
| 36 | ÷ + × · recall E · grp | 1 | 3.8 | 3.8–3.8 | L2:2 | $\left(4 \div 2 + 2\right) \times 2$ |
| 37 | + ^2 × + · recall E · grp | 2 | 3.8 | 3.8–3.8 | L2:2 | $2 + 2 \times \left(1 + 1\right)^{2}$ |
| 38 | − × · recall M · grp | 6 | 3.8 | 3.1–4.3 | L2:1 L2:2 | $\left(19 - 7\right) \times 5$ |
| 39 | ÷ + · recall M | 17 | 3.8 | 3.2–4.4 | L1:2 L1:3 L1:4 | $3 + 21 \div 7$ |
| 40 | − × · recall M · grp,neg | 1 | 3.9 | 3.9–3.9 | L2:2 | $\left(-6 - (-7)\right) \times (-4)$ |
| 41 | ^3 − · recall - | 8 | 3.9 | 3–4.7 | L2:1 L2:2 L2:3 | $38 - 3^{3}$ |
| 42 | − + − · recall - | 38 | 3.9 | 3–5.1 | L1:2 L1:3 L1:4 L1:6 | $34 - 5 + 15 - 9$ |
| 43 | ÷ × + · recall E | 8 | 4.0 | 3.7–4.4 | L1:3 L1:4 | $13 + 10 \div 2 \times 3$ |
| 44 | × × − + · recall E | 3 | 4.0 | 3.5–4.2 | L1:3 L1:4 | $2 \times 5 - 2 \times 4 + 12$ |
| 45 | × + · recall H | 5 | 4.0 | 4–4 | L1:4 | $14 + 6 \times 7$ |
| 46 | × − · recall H | 1 | 4.0 | 4–4 | L1:4 | $58 - 6 \times 7$ |
| 47 | ^3 × · recall M | 4 | 4.0 | 4–4 | L2:2 | $4 \times 2^{3}$ |
| 48 | ^3 + · recall - | 16 | 4.0 | 2.5–6.2 | L2:1 L2:2 L2:3 L2:4 L2:5 | $5 + 5^{3}$ |
| 49 | ÷ − · recall M | 9 | 4.0 | 3.7–4.4 | L1:3 L1:4 | $34 - 36 \div 9$ |
| 50 | ÷ × · recall M | 14 | 4.1 | 3.7–4.7 | L1:3 L1:5 | $20 \div 4 \times 8$ |
| 51 | √ + · recall - · neg | 14 | 4.1 | 3.5–5 | L3:1 | $\sqrt{25} + (-13)$ |
| 52 | ^2 − · recall - · neg | 9 | 4.1 | 3.4–5.7 | L2:1 L2:2 L2:5 | $-31 - (-9)^{2}$ |
| 53 | √ ^2 + · recall - | 21 | 4.2 | 3.2–5 | L3:1 | $\sqrt{9} + 2^{2}$ |
| 54 | ÷ − + · recall E | 13 | 4.2 | 3.7–5.1 | L1:3 L1:4 L1:6 | $56 - 6 \div 2 + 15$ |
| 55 | + × · recall M · grp,neg | 18 | 4.3 | 2.4–4.6 | L2:1 L2:2 L2:3 | $\left(-3 + 4\right) \times (-5)$ |
| 56 | + − × · recall E · grp | 25 | 4.3 | 3.2–5.4 | L2:1 L3:1 L3:2 | $\left(7 + 11\right) \times \left(12 - 2\right)$ |
| 57 | × + − · recall M | 20 | 4.3 | 4–4.7 | L1:4 L1:5 | $5 + 5 \times 8 - 7$ |
| 58 | ^2 × · recall M · neg | 5 | 4.4 | 4.2–4.4 | L2:2 | $5 \times (-3)^{2}$ |
| 59 | + × · recall H · grp | 13 | 4.4 | 4.1–4.6 | L2:2 L2:3 | $\left(6 + 9\right) \times 5$ |
| 60 | ^2 + − · recall - | 19 | 4.4 | 3.4–5.7 | L2:1 L2:2 L2:3 L2:4 L2:5 | $3 + 5^{2} - 19$ |
| 61 | √ − · recall - · neg | 24 | 4.4 | 4–5 | L3:1 | $-39 - \sqrt{121}$ |
| 62 | × + × · recall M · grp | 3 | 4.4 | 4.1–4.6 | L2:2 L2:3 | $\left(2 + 2 \times 3\right) \times 2$ |
| 63 | ^2 + · recall - · neg | 20 | 4.5 | 3.4–5.7 | L2:1 L2:2 L2:3 L2:5 | $20 + (-8)^{2}$ |
| 64 | ^2 ^2 − · recall - | 5 | 4.5 | 4.1–4.9 | L2:2 L2:3 | $6^{2} - 3^{2}$ |
| 65 | ÷ ^2 × · recall E · grp | 5 | 4.5 | 4.5–4.5 | L2:2 | $2 \times \left(8 \div 4\right)^{2}$ |
| 66 | + ^2 + · recall - · grp | 12 | 4.5 | 3.3–5.6 | L2:1 L2:2 L2:3 L2:4 | $\left(5 + 2\right)^{2} + 12$ |
| 67 | √ × · recall H · neg | 8 | 4.6 | 4.3–4.8 | L3:1 | $-5 \times \sqrt{36}$ |
| 68 | + ÷ · recall E · grp | 15 | 4.6 | 2.8–6.4 | L2:1 L3:2 | $\left(11 + 4\right) \div 5$ |
| 69 | × − + · recall M | 31 | 4.6 | 4–5.4 | L1:4 L1:5 L1:6 | $33 - 4 + 4 \times 8$ |
| 70 | ^2 × + · recall M | 12 | 4.7 | 4.2–5.7 | L2:2 L2:3 L2:5 | $4^{2} + 5 \times 6$ |
| 71 | − × + × · recall E · grp | 2 | 4.7 | 4.7–4.7 | L3:1 | $5 \times \left(2 + 4 \times \left(7 - 5\right)\right)$ |
| 72 | ^2 ÷ + − · recall E | 13 | 4.7 | 4.4–5.6 | L2:2 L2:3 L2:4 | $6 + 11 - 5^{2} \div 5$ |
| 73 | ^2 + · recall - · grp,neg | 19 | 4.8 | 4.2–5.5 | L2:2 L2:3 L2:4 | $-3^{2} + 1$ |
| 74 | × × + · recall M | 9 | 4.8 | 4–5.7 | L1:4 L1:6 L1:7 | $3 \times 9 + 9 \times 2$ |
| 75 | × × − · recall M | 8 | 4.8 | 4–5.7 | L1:4 L1:5 L1:6 L1:7 | $3 \times 9 - 8 \times 3$ |
| 76 | ÷ + × · recall E · grp,neg | 1 | 4.8 | 4.8–4.8 | L2:3 | $\left(4 \div 2 + (-1)\right) \times 3$ |
| 77 | ^2 − × + · recall E · grp | 9 | 4.8 | 3.8–5.8 | L2:2 L2:3 L2:5 | $8^{2} + \left(11 - 1\right) \times 6$ |
| 78 | − ^2 + · recall - · grp | 28 | 4.8 | 2.8–6.8 | L2:1 L2:2 L2:3 L2:4 L2:5 L2:6 | $\left(7 - 5\right)^{2} + 2$ |
| 79 | + × − · recall M · grp | 8 | 4.8 | 4.1–5.3 | L2:2 L2:3 L2:4 | $\left(6 + 6\right) \times 4 - 4$ |
| 80 | − × · recall H · grp | 6 | 4.8 | 4.1–5.3 | L2:2 L2:3 L2:4 | $\left(14 - 6\right) \times 9$ |
| 81 | + √ × · recall E · grp | 23 | 4.8 | 4.2–5.4 | L3:1 L3:2 | $5 \times \sqrt{9 + 16}$ |
| 82 | × + × · recall E · grp,neg | 2 | 4.8 | 4.6–5.1 | L2:3 | $\left(-7 + 3 \times 4\right) \times 3$ |
| 83 | ^2 − · recall - · grp,neg | 19 | 4.9 | 4.2–5.5 | L2:2 L2:3 L2:4 | $-8 - -3^{2}$ |
| 84 | + − · recall - · grp,neg | 18 | 4.9 | 3.6–5.6 | L2:1 L2:2 L2:3 L2:4 | $49 - \left(-11 + (-2)\right)$ |
| 85 | + × − · recall E · grp,neg | 7 | 4.9 | 3.6–6.1 | L2:1 L2:2 L2:3 L2:4 L2:5 | $\left(11 + (-10)\right) \times 2 - (-14)$ |
| 86 | √ × + · recall E · neg | 5 | 4.9 | 4.5–5 | L3:1 | $-14 + 2 \times \sqrt{25}$ |
| 87 | ÷ + · recall H | 12 | 5.0 | 4.2–5.4 | L1:4 L1:5 L1:6 | $1 + 54 \div 6$ |
| 88 | + ^2 − · recall - · grp | 38 | 5.1 | 3.3–6.3 | L2:1 L2:2 L2:3 L2:4 L2:5 | $\left(7 + 3\right)^{2} - 9$ |
| 89 | ^2 × · recall H | 7 | 5.1 | 4.2–5.5 | L2:2 L2:3 L2:4 | $3 \times 9^{2}$ |
| 90 | ÷ ÷ · recall M | 7 | 5.1 | 4.4–5.9 | L1:4 L1:5 L1:7 | $36 \div 3 \div 4$ |
| 91 | ÷ − · recall H | 7 | 5.2 | 4.7–5.4 | L1:5 L1:6 | $27 - 49 \div 7$ |
| 92 | √ × − · recall M | 6 | 5.2 | 4.5–5.7 | L3:1 L3:2 | $4 \times 6 - \sqrt{36}$ |
| 93 | × + − · recall H | 9 | 5.2 | 5–5.7 | L1:6 L1:7 | $4 + 7 \times 6 - 2$ |
| 94 | √ ^2 + · recall - · neg | 22 | 5.2 | 4.4–6.2 | L3:1 L3:2 | $\sqrt{25} + (-5)^{2}$ |
| 95 | + ^2 ÷ · recall E · grp,neg | 2 | 5.3 | 5–5.5 | L2:3 L2:4 | $\left(-2 + 5\right)^{2} \div 3$ |
| 96 | + ^3 + · recall - · grp | 10 | 5.3 | 3.6–7.3 | L2:1 L2:2 L2:3 L2:5 L2:6 | $\left(2 + 1\right)^{3} + 3$ |
| 97 | ÷ − + · recall M | 27 | 5.3 | 4.7–6.1 | L1:5 L1:6 L1:7 | $40 - 21 \div 7 + 1$ |
| 98 | + ^2 × + · recall M · grp | 6 | 5.3 | 5.3–5.3 | L2:4 | $5 + 3 \times \left(1 + 2\right)^{2}$ |
| 99 | ÷ × + · recall M | 24 | 5.3 | 4.2–6.4 | L1:4 L1:5 L1:6 L1:7 L1:8 | $8 + 8 \div 4 \times 6$ |
| 100 | + × · recall H · grp,neg | 15 | 5.3 | 3.9–6.1 | L2:2 L2:4 L2:5 | $9 \times \left(4 + (-9)\right)$ |
| 101 | √ × + · recall M | 7 | 5.4 | 5–6.7 | L3:1 L3:2 L3:3 | $4 + 3 \times \sqrt{64}$ |
| 102 | × − + · recall H | 18 | 5.4 | 5–6.4 | L1:6 L1:7 L1:8 | $43 - 10 + 6 \times 7$ |
| 103 | + × · recall X · grp | 10 | 5.4 | 5.1–6.3 | L2:3 L2:4 L2:5 | $\left(2 + 12\right) \times 6$ |
| 104 | ÷ + × · recall M · grp | 15 | 5.4 | 4.8–6.3 | L2:3 L2:4 L2:5 | $\left(6 \div 2 + 3\right) \times 3$ |
| 105 | × + × · recall H · grp | 10 | 5.5 | 5.1–5.6 | L2:3 L2:4 | $\left(6 + 5 \times 5\right) \times 2$ |
| 106 | √ + · recall - · dec | 24 | 5.5 | 5.2–5.7 | L3:2 | $\sqrt{0.81} + 11.2$ |
| 107 | × + × · recall M · grp,neg | 3 | 5.5 | 4.9–6.1 | L2:3 L2:4 L2:5 | $\left(9 + (-2) \times 2\right) \times 2$ |
| 108 | ÷ ^2 × · recall M · grp | 4 | 5.5 | 5.5–5.5 | L2:4 | $3 \times \left(18 \div 9\right)^{2}$ |
| 109 | ^2 − × + · recall E · grp,neg | 1 | 5.5 | 5.5–5.5 | L2:4 | $(-4)^{2} + \left(13 - 3\right) \times 2$ |
| 110 | √ × · recall H | 2 | 5.5 | 5–6 | L3:1 L3:2 | $6 \times \sqrt{144}$ |
| 111 | √ × − · recall H | 1 | 5.5 | 5.5–5.5 | L3:2 | $6 \times 6 - \sqrt{4}$ |
| 112 | √ × − · recall M · neg | 20 | 5.5 | 4.3–6.3 | L3:1 L3:2 | $2 \times (-4) - \sqrt{25}$ |
| 113 | ^2 ^2 × + · recall E | 2 | 5.6 | 5.2–5.9 | L2:4 L2:5 | $8^{2} + 2 \times 2^{2}$ |
| 114 | + ^2 ÷ · recall M · grp | 8 | 5.6 | 5–6.3 | L2:3 L2:5 | $\left(2 + 4\right)^{2} \div 12$ |
| 115 | + ÷ · recall M · grp | 26 | 5.6 | 3.8–8.1 | L2:2 L2:3 L3:3 L3:4 | $\left(14 + 21\right) \div 5$ |
| 116 | − × · recall X · grp | 4 | 5.6 | 5.6–5.6 | L2:4 | $\left(18 - 2\right) \times 7$ |
| 117 | + ÷ · recall H · grp | 17 | 5.6 | 4.8–9.1 | L2:3 L2:4 L2:5 L3:4 L3:5 | $42 \div \left(2 + 5\right)$ |
| 118 | + √ × · recall E · grp,dec | 2 | 5.7 | 5.4–5.9 | L3:2 | $\sqrt{13.3 + 11.7} \times 3$ |
| 119 | + × − · recall H · grp | 23 | 5.7 | 5.1–6.3 | L2:3 L2:4 L2:5 | $\left(4 + 3\right) \times 6 - 3$ |
| 120 | √ − · recall - · dec | 29 | 5.7 | 5.7–5.7 | L3:2 | $18 - \sqrt{0.04}$ |
| 121 | ^2 + − · recall - · neg | 12 | 5.7 | 3.9–7.4 | L2:2 L2:3 L2:4 L2:5 L2:6 | $-11 + (-5)^{2} - (-7)$ |
| 122 | ^3 × + · recall M | 5 | 5.8 | 5–7.5 | L2:3 L2:5 L2:7 | $2 \times 2^{3} + 11$ |
| 123 | ^2 ^2 × + · recall E · neg | 3 | 5.9 | 5.6–6.4 | L2:4 L2:5 | $8^{2} + 3 \times (-2)^{2}$ |
| 124 | + √ × · recall E · grp,neg | 3 | 5.9 | 5.7–6.2 | L3:2 | $\sqrt{-8 + 17} \times 2$ |
| 125 | + − × · recall M · grp | 35 | 5.9 | 4.2–6.4 | L2:2 L3:2 | $\left(5 + 2\right) \times \left(8 - 3\right)$ |
| 126 | ^3 + − · recall - | 6 | 5.9 | 4.7–8.2 | L2:3 L2:5 L2:7 | $6 + 4^{3} - 9$ |
| 127 | × × − + · recall M | 16 | 5.9 | 4.5–7.4 | L1:4 L1:6 L1:7 L1:8 | $3 \times 8 - 3 \times 4 + 16$ |
| 128 | ^2 × · recall H · neg | 2 | 6.0 | 5.2–6.7 | L2:4 L2:6 | $-2 \times (-3)^{2}$ |
| 129 | ÷ ÷ · recall H | 25 | 6.0 | 5.4–6.4 | L1:6 L1:8 | $48 \div 3 \div 2$ |
| 130 | ^3 × · recall H · neg | 2 | 6.0 | 6–6 | L2:5 | $4 \times (-2)^{3}$ |
| 131 | √ × · recall M · dec | 15 | 6.0 | 6–6 | L3:2 | $7 \times \sqrt{0.25}$ |
| 132 | − × · recall H · grp,neg | 5 | 6.0 | 5.9–6.1 | L2:5 | $\left(16 - (-2)\right) \times 3$ |
| 133 | × ÷ · recall H | 15 | 6.1 | 4.2–7.2 | L1:4 L1:7 L1:8 | $10 \times 3 \div 2$ |
| 134 | ^2 ^2 − · recall - · neg | 13 | 6.1 | 4.1–8.1 | L2:2 L2:4 L2:5 L2:6 L2:7 | $(-3)^{2} - 2^{2}$ |
| 135 | × × − · recall H | 7 | 6.1 | 5–6.7 | L1:6 L1:7 L1:8 | $9 \times 8 - 5 \times 4$ |
| 136 | ÷ × · recall H | 12 | 6.1 | 5.7–6.7 | L1:7 L1:8 | $45 \div 5 \times 6$ |
| 137 | √ × · recall X · neg | 3 | 6.1 | 5.8–6.8 | L3:2 L3:3 | $-9 \times \sqrt{144}$ |
| 138 | × × + · recall H | 19 | 6.1 | 5–6.7 | L1:6 L1:7 L1:8 | $6 \times 6 + 4 \times 3$ |
| 139 | ^3 − · recall - · neg | 5 | 6.2 | 4.5–8.2 | L2:2 L2:5 L2:6 L2:7 | $-83 - 3^{3}$ |
| 140 | + √ + · recall - · grp | 13 | 6.2 | 4.2–8.2 | L3:1 L3:2 L3:4 | $\sqrt{25 + 144} + 3$ |
| 141 | ÷ − + · recall H | 10 | 6.2 | 5.7–7.1 | L1:7 L1:8 | $66 - 63 \div 7 + 4$ |
| 142 | ^2 ^2 × + · recall M | 1 | 6.2 | 6.2–6.2 | L2:5 | $9^{2} + 4 \times 3^{2}$ |
| 143 | + √ × · recall M · grp | 8 | 6.2 | 5.2–6.9 | L3:2 L3:3 | $\sqrt{5 + 4} \times 6$ |
| 144 | ^3 + · recall - · neg | 13 | 6.2 | 4.5–8.2 | L2:2 L2:4 L2:5 L2:6 L2:7 | $-24 + (-2)^{3}$ |
| 145 | + × − · recall M · grp,neg | 9 | 6.2 | 5.6–7.1 | L2:4 L2:5 L2:6 | $\left(-7 + 6\right) \times 5 - 14$ |
| 146 | ^2 × + · recall H | 15 | 6.3 | 5.2–8.2 | L2:4 L2:6 L2:7 | $4 \times 4^{2} + 15$ |
| 147 | + ^2 + · recall - · grp,neg | 19 | 6.3 | 4.8–8.3 | L2:3 L2:4 L2:5 L2:6 L2:7 | $\left(4 + 5\right)^{2} + (-14)$ |
| 148 | ^3 × · recall H | 7 | 6.3 | 5–6.5 | L2:3 L2:6 | $3 \times 4^{3}$ |
| 149 | + ^2 − · recall - · grp,neg | 34 | 6.3 | 4.3–8.3 | L2:2 L2:3 L2:4 L2:5 L2:6 L2:7 | $\left(-1 + (-2)\right)^{2} - 18$ |
| 150 | + − × · recall H · grp | 13 | 6.3 | 5.2–7.4 | L2:4 L2:5 L3:2 L3:3 | $\left(4 + 8\right) \times \left(12 - 1\right)$ |
| 151 | + × · recall X · grp,neg | 15 | 6.3 | 4.9–7.9 | L2:3 L2:4 L2:5 L2:6 L2:7 | $\left(8 + 3\right) \times (-6)$ |
| 152 | + × − ÷ · recall E · grp | 9 | 6.4 | 5.9–7.1 | L3:2 L3:3 | $\left(\left(8 + 2\right) \times 5 - 34\right) \div 4$ |
| 153 | ^2 × · recall X · neg | 4 | 6.4 | 5–7.5 | L2:3 L2:5 L2:6 L2:7 | $-5 \times (-8)^{2}$ |
| 154 | + − × · recall E · grp,dec | 3 | 6.4 | 6.1–6.6 | L3:2 L3:3 | $3 \times \left(\left(3 + 2.5\right) - 1.5\right)$ |
| 155 | + ^2 × + · recall E · grp,neg | 15 | 6.4 | 4.8–8.5 | L2:3 L2:4 L2:5 L2:6 L2:7 | $4 + 2 \times \left(1 + (-2)\right)^{2}$ |
| 156 | − √ − · recall - · grp | 15 | 6.5 | 5.4–7.6 | L3:2 L3:3 | $20 - \sqrt{25 - 9}$ |
| 157 | − ÷ · recall E · grp | 15 | 6.5 | 5.4–7.1 | L3:2 L3:3 | $\dfrac{40 - 15}{5}$ |
| 158 | − × + × · recall M · grp | 10 | 6.6 | 6.2–6.7 | L3:2 L3:3 | $5 \times \left(3 + 2 \times \left(7 - 5\right)\right)$ |
| 159 | + − × · recall E · grp,neg | 7 | 6.6 | 5.2–7.2 | L3:2 L3:3 | $6 \times \left(\left(-2 + 7\right) - 5\right)$ |
| 160 | √ × − · recall E · dec | 11 | 6.6 | 6.2–6.7 | L3:2 L3:3 | $4 \times 3 - \sqrt{0.09}$ |
| 161 | √ × + · recall M · neg | 7 | 6.6 | 5.8–7.5 | L3:2 L3:3 | $-7 + 5 \times \sqrt{64}$ |
| 162 | + √ × · recall M · grp,neg | 16 | 6.6 | 5–8.7 | L3:1 L3:2 L3:3 L3:4 L3:5 | $-5 \times \sqrt{9 + 16}$ |
| 163 | √ × − · recall H · neg | 9 | 6.7 | 5.8–7.3 | L3:2 L3:3 | $6 \times (-3) - \sqrt{4}$ |
| 164 | ^2 − × + · recall M · grp | 13 | 6.7 | 5.3–8 | L2:4 L2:5 L2:6 L2:7 | $4^{2} + \left(12 - 1\right) \times 3$ |
| 165 | ÷ + × · recall M · grp,neg | 13 | 6.7 | 5.4–7.7 | L2:4 L2:5 L2:6 L2:7 | $\left(-8 \div 4 + 5\right) \times (-4)$ |
| 166 | + − ÷ · recall E · grp | 9 | 6.7 | 6.4–7.6 | L3:2 L3:3 | $\dfrac{3 + 12}{7 - 2}$ |
| 167 | + √ × · recall H · grp,dec | 6 | 6.8 | 6.2–7.4 | L3:2 L3:3 | $\sqrt{3 + 1} \times 4.6$ |
| 168 | + ÷ + · recall E · grp | 10 | 6.8 | 6.4–7.6 | L3:2 L3:3 | $\dfrac{20 + 20}{4} + 1$ |
| 169 | + ^2 ÷ · recall H · grp | 10 | 6.8 | 6.8–6.8 | L2:6 | $\left(2 + 4\right)^{2} \div 2$ |
| 170 | ÷ + × · recall H · grp | 1 | 6.8 | 6.8–6.8 | L2:6 | $\left(45 \div 9 + 9\right) \times 2$ |
| 171 | ^2 × + · recall M · neg | 2 | 6.9 | 6.9–6.9 | L2:6 | $3 \times (-3)^{2} + (-18)$ |
| 172 | − × · recall X · grp,neg | 16 | 7.0 | 5.4–7.9 | L2:4 L2:5 L2:6 L2:7 | $\left(12 - (-5)\right) \times 9$ |
| 173 | ^3 ^3 − · recall - | 4 | 7.0 | 4.5–8.5 | L2:2 L2:6 L2:7 | $5^{3} - 4^{3}$ |
| 174 | + ÷ · recall M · grp,neg | 23 | 7.1 | 4.4–9.5 | L2:2 L2:4 L2:5 L3:5 | $\left(-11 + 23\right) \div 2$ |
| 175 | + ÷ · recall E · grp,dec | 5 | 7.1 | 7.1–7.1 | L3:3 | $\dfrac{4.1 + 1.9}{2}$ |
| 176 | + ÷ · recall E · grp,neg | 4 | 7.1 | 4.8–7.9 | L2:3 L3:4 | $\left(-7 + 17\right) \div 2$ |
| 177 | ÷ ^2 × · recall H · grp | 16 | 7.1 | 6.5–7.5 | L2:6 L2:7 | $4 \times \left(12 \div 3\right)^{2}$ |
| 178 | + ^2 ÷ · recall M · grp,neg | 2 | 7.2 | 6.5–7.8 | L2:6 L2:7 | $\left(-4 + 10\right)^{2} \div 12$ |
| 179 | ^2 × + · recall H · neg | 9 | 7.2 | 5.7–8.9 | L2:5 L2:6 L2:7 L2:8 | $7^{2} + (-6) \times 5$ |
| 180 | + − × · recall M · grp,neg | 33 | 7.2 | 5–8.2 | L2:3 L2:6 L3:2 L3:3 L3:4 | $\left(5 + 5\right) \times \left(-9 - 2\right)$ |
| 181 | × + ÷ · recall E · grp | 6 | 7.2 | 6.9–8.1 | L3:3 L3:4 | $\dfrac{6 + 2 \times 3}{4}$ |
| 182 | ÷ × + · recall H | 14 | 7.2 | 6.7–8.4 | L1:8 | $16 + 48 \div 6 \times 6$ |
| 183 | − × + × · recall E · grp,neg | 1 | 7.2 | 7.2–7.2 | L3:3 | $3 \times \left(-9 + 4 \times \left(8 - 5\right)\right)$ |
| 184 | ^2 − × + · recall H · grp | 5 | 7.2 | 6.3–8.5 | L2:5 L2:6 L2:7 | $4^{2} + \left(8 - 1\right) \times 6$ |
| 185 | + √ + · recall - · grp,dec | 8 | 7.3 | 5.4–9.4 | L3:2 L3:3 L3:5 | $\sqrt{9 + 16} + 1.6$ |
| 186 | + ^3 + · recall - · grp,neg | 13 | 7.3 | 5.1–9.3 | L2:3 L2:4 L2:6 L2:7 L2:8 | $\left(2 + 1\right)^{3} + (-4)$ |
| 187 | ^2 ÷ + − · recall M | 2 | 7.3 | 6.6–8.1 | L2:6 L2:7 | $17 + 7 - 4^{2} \div 8$ |
| 188 | − ÷ + · recall E · grp | 10 | 7.4 | 6.4–8.1 | L3:2 L3:3 L3:4 | $\dfrac{8 - 4}{2} + 18$ |
| 189 | + − × · recall M · grp,dec | 5 | 7.4 | 6.2–8.1 | L3:2 L3:3 L3:4 | $2.2 \times \left(\left(3 + 2.9\right) - 5\right)$ |
| 190 | + √ × · recall M · grp,dec | 7 | 7.4 | 7.4–7.4 | L3:3 | $\sqrt{76.4 + 4.6} \times 4$ |
| 191 | + ^2 × + · recall H · grp | 21 | 7.4 | 6.3–8.6 | L2:5 L2:6 L2:7 L2:8 | $5 + 3 \times \left(4 + 1\right)^{2}$ |
| 192 | × + × · recall X · grp,neg | 4 | 7.4 | 6.4–8.7 | L2:5 L2:7 L2:8 | $\left(-7 + (-4) \times 5\right) \times (-4)$ |
| 193 | + × − · recall H · grp,neg | 11 | 7.5 | 6.4–8.4 | L2:5 L2:6 L2:7 | $5 \times \left(-11 + 4\right) - 7$ |
| 194 | × × − + · recall H | 16 | 7.5 | 6–9.4 | L1:7 L1:8 | $9 \times 7 - 8 \times 6 + 7$ |
| 195 | ^3 × · recall X | 1 | 7.5 | 7.5–7.5 | L2:7 | $4 \times 5^{3}$ |
| 196 | √ × + · recall H · neg | 9 | 7.5 | 7.3–8.3 | L3:3 L3:4 | $9 + (-2) \times \sqrt{81}$ |
| 197 | ÷ ^2 × · recall M · grp,neg | 7 | 7.5 | 6.1–8.3 | L2:5 L2:6 L2:7 | $-5 \times \left(18 \div 9\right)^{2}$ |
| 198 | + × − · recall X · grp | 9 | 7.5 | 6.1–9 | L2:5 L2:6 L2:7 L2:8 | $\left(11 + 9\right) \times 8 - 9$ |
| 199 | + √ + · recall - · grp,neg | 16 | 7.6 | 6.2–9.7 | L3:2 L3:3 L3:6 | $\sqrt{36 + 64} + (-4)$ |
| 200 | − ÷ · recall M · grp | 3 | 7.6 | 7.4–8.1 | L3:3 L3:4 | $\dfrac{48 - 24}{6}$ |
| 201 | ÷ + × · recall H · grp,neg | 8 | 7.6 | 6.1–9.7 | L2:5 L2:6 L2:7 L2:8 | $\left(-24 \div 8 + 8\right) \times 5$ |
| 202 | ^2 ÷ + − · recall E · neg | 2 | 7.7 | 7.4–7.9 | L2:6 L2:7 | $-18 + 13 - 2^{2} \div 2$ |
| 203 | √ × + · recall M · dec | 16 | 7.7 | 6.5–8.2 | L3:3 L3:4 | $6.9 + 3 \times \sqrt{0.81}$ |
| 204 | × + × · recall H · grp,neg | 1 | 7.7 | 7.7–7.7 | L2:7 | $\left(-4 + 4 \times (-2)\right) \times 2$ |
| 205 | √ × − · recall M · dec | 4 | 7.7 | 7.7–7.7 | L3:4 | $3 \times 6 - \sqrt{0.81}$ |
| 206 | − √ − · recall - · grp,dec | 8 | 7.7 | 6.6–8.1 | L3:3 L3:4 | $23.1 - \sqrt{25 - 16}$ |
| 207 | + ^2 × + · recall M · grp,neg | 10 | 7.8 | 5.6–9.5 | L2:4 L2:6 L2:7 L2:8 | $2 + (-3) \times \left(-4 + 3\right)^{2}$ |
| 208 | ^2 − × + · recall X · grp | 1 | 7.8 | 7.8–7.8 | L2:7 | $3^{2} + \left(15 - 2\right) \times 6$ |
| 209 | + ÷ + · recall E · grp,dec | 13 | 7.8 | 7.1–8.8 | L3:3 L3:4 L3:5 | $\dfrac{16 + 24}{4} + 2.1$ |
| 210 | + − × · recall X · grp | 8 | 7.8 | 6.2–9.2 | L2:5 L2:6 L2:7 L2:8 L3:4 | $\left(8 + 7\right) \times \left(13 - 1\right)$ |
| 211 | + √ × · recall H · grp,neg | 4 | 7.9 | 7–9.5 | L3:3 L3:4 L3:5 | $\sqrt{-4 + 29} \times (-6)$ |
| 212 | − ^2 + · recall - · grp,neg | 36 | 7.9 | 4.3–10.3 | L2:2 L2:3 L2:5 L2:6 L2:7 L2:8 | $\left(-15 - 5\right)^{2} + (-1)$ |
| 213 | ^3 × + · recall H · neg | 4 | 8.0 | 7.3–8.5 | L2:6 L2:7 | $(-2)^{3} + (-9) \times (-2)$ |
| 214 | − × + × · recall M · grp,neg | 5 | 8.0 | 5.5–9.8 | L3:2 L3:3 L3:6 | $-5 \times \left(2 + 2 \times \left(9 - 5\right)\right)$ |
| 215 | − √ − · recall - · grp,neg | 14 | 8.0 | 6.9–8.4 | L3:3 L3:4 | $-27 - \sqrt{100 - 64}$ |
| 216 | ^2 − × + · recall M · grp,neg | 8 | 8.1 | 6.6–9.5 | L2:6 L2:8 | $(-7)^{2} + \left(14 - 3\right) \times 5$ |
| 217 | ^2 ^2 × + · recall M · neg | 4 | 8.2 | 7.4–8.7 | L2:6 L2:7 L2:8 | $(-9)^{2} + (-2) \times 2^{2}$ |
| 218 | + − × · recall H · grp,dec | 18 | 8.2 | 6.2–9.1 | L3:2 L3:3 L3:5 | $4.1 \times \left(\left(1.3 + 7\right) - 6\right)$ |
| 219 | + − ÷ · recall E · grp,dec | 3 | 8.2 | 7.6–9.3 | L3:3 L3:5 | $\dfrac{2.9 + 3.1}{4 - 1}$ |
| 220 | ^3 + − · recall - · neg | 6 | 8.2 | 5.5–10.5 | L2:4 L2:7 L2:8 | $16 + (-2)^{3} - (-6)$ |
| 221 | ^3 × + · recall H | 6 | 8.2 | 6–9.2 | L2:5 L2:7 L2:8 | $3 \times 3^{3} + 1$ |
| 222 | ^2 − ÷ · recall E · grp | 9 | 8.3 | 7.6–9.1 | L3:3 L3:4 L3:5 | $\dfrac{7^{2} - 39}{2}$ |
| 223 | + ÷ + · recall M · grp | 18 | 8.3 | 7.4–10.3 | L3:3 L3:4 L3:5 L3:6 | $\dfrac{25 + 20}{5} + 5$ |
| 224 | − ÷ + · recall M · grp | 13 | 8.4 | 7.9–9.1 | L3:4 L3:5 | $\dfrac{42 - 14}{7} + 5$ |
| 225 | + × − ÷ · recall M · grp | 34 | 8.4 | 7.4–9.6 | L3:3 L3:4 L3:5 | $\left(\left(7 + 4\right) \times 3 - 5\right) \div 4$ |
| 226 | × + ÷ · recall E · grp,neg | 1 | 8.4 | 8.4–8.4 | L3:4 | $\dfrac{-2 + 3 \times 2}{2}$ |
| 227 | √ ^2 + · recall - · dec | 16 | 8.4 | 8.4–8.4 | L3:4 | $\sqrt{0.04} + 0.3^{2}$ |
| 228 | + − × · recall H · grp,neg | 22 | 8.4 | 7–10 | L2:7 L3:3 L3:4 L3:5 L3:6 | $\left(-8 + 3\right) \times \left(15 - 4\right)$ |
| 229 | + ÷ + · recall E · grp,neg | 3 | 8.5 | 8.4–8.6 | L3:4 L3:5 | $\dfrac{24 + 16}{4} + (-3)$ |
| 230 | ^2 ÷ + − · recall H | 11 | 8.5 | 7.2–9.1 | L2:6 L2:7 L2:8 | $5 + 17 - 7^{2} \div 7$ |
| 231 | √ × − · recall H · dec | 11 | 8.5 | 8.2–8.7 | L3:4 L3:5 | $6 \times 6 - \sqrt{0.04}$ |
| 232 | + ÷ · recall M · grp,dec | 17 | 8.5 | 8.1–8.6 | L3:4 L3:5 | $\dfrac{15.8 + 8.2}{4}$ |
| 233 | + − ÷ · recall M · grp | 13 | 8.6 | 7.4–9.8 | L3:3 L3:4 L3:5 L3:6 | $\dfrac{3 + 15}{10 - 4}$ |
| 234 | − × + × · recall H · grp | 64 | 8.6 | 7.2–9.9 | L3:3 L3:4 L3:5 L3:6 | $4 \times \left(2 + 2 \times \left(12 - 3\right)\right)$ |
| 235 | − ÷ + · recall E · grp,dec | 10 | 8.6 | 7.6–9.8 | L3:3 L3:4 L3:5 L3:6 | $\dfrac{20.6 - 14.6}{2} + 6.2$ |
| 236 | × ÷ · recall X | 8 | 8.6 | 7.7–8.7 | L1:8 | $18 \times 7 \div 9$ |
| 237 | ^2 × + · recall X · neg | 5 | 8.6 | 7.5–10.5 | L2:7 L2:8 | $(-5)^{2} + (-7) \times 6$ |
| 238 | ^2 ^2 × + · recall H | 17 | 8.6 | 7.1–10.2 | L2:6 L2:7 L2:8 | $3^{2} + 4 \times 6^{2}$ |
| 239 | ÷ ^2 × · recall X · grp,neg | 6 | 8.7 | 7.3–10.1 | L2:6 L2:7 L2:8 | $-4 \times \left(16 \div (-4)\right)^{2}$ |
| 240 | + ^2 ÷ · recall H · grp,neg | 2 | 8.8 | 8.8–8.8 | L2:8 | $\left(-5 + 13\right)^{2} \div 4$ |
| 241 | × + ÷ · recall M · grp | 13 | 8.8 | 8.4–9.4 | L3:4 L3:5 | $\dfrac{12 + 6 \times 4}{4}$ |
| 242 | + − ÷ · recall E · grp,neg | 6 | 8.8 | 7.9–9.6 | L3:4 L3:5 | $\dfrac{-1 + 11}{14 - 9}$ |
| 243 | ^2 − ÷ · recall E · grp,neg | 5 | 8.9 | 8.6–9.1 | L3:5 | $\dfrac{3^{2} - (-16)}{5}$ |
| 244 | + × − ÷ · recall E · grp,neg | 4 | 8.9 | 8.4–9.4 | L3:4 L3:5 | $\left(\left(7 + (-5)\right) \times 2 - (-6)\right) \div 5$ |
| 245 | + − × · recall H · grp,neg,dec | 1 | 8.9 | 8.9–8.9 | L3:5 | $2 \times \left(\left(3.2 + 1.2\right) - 5.3\right)$ |
| 246 | ^2 ÷ + − · recall M · neg | 5 | 9.0 | 7.8–10.9 | L2:7 L2:8 | $7 + (-9) - (-6)^{2} \div 3$ |
| 247 | ^3 × + · recall X · neg | 4 | 9.1 | 6.8–10.5 | L2:6 L2:8 | $3^{3} + (-9) \times (-9)$ |
| 248 | ÷ ^2 × · recall H · grp,neg | 14 | 9.2 | 7.3–10.3 | L2:6 L2:7 L2:8 | $5 \times \left(-40 \div (-8)\right)^{2}$ |
| 249 | + ÷ · recall H · grp,neg | 25 | 9.2 | 5.4–10.9 | L2:4 L2:6 L3:6 L3:7 | $-32 \div \left(-6 + 2\right)$ |
| 250 | ^2 ^2 × + · recall H · neg | 10 | 9.2 | 7.6–10.9 | L2:7 L2:8 | $9^{2} + 2 \times (-4)^{2}$ |
| 251 | − ÷ + · recall H · grp | 8 | 9.3 | 8.9–10.1 | L3:5 L3:6 | $\dfrac{82 - 18}{8} + 13$ |
| 252 | ^2 − × + · recall H · grp,neg | 10 | 9.4 | 8.3–11.1 | L2:7 L2:8 | $8^{2} + \left(5 - (-2)\right) \times 6$ |
| 253 | + − × · recall X · grp,neg,dec | 1 | 9.4 | 9.4–9.4 | L3:5 | $3 \times \left(\left(1.2 + 1\right) - 4\right)$ |
| 254 | + × − · recall X · grp,neg | 6 | 9.4 | 7.4–11.4 | L2:6 L2:7 L2:8 | $\left(2 + 9\right) \times (-6) - 1$ |
| 255 | + ^2 × + · recall H · grp,neg | 7 | 9.4 | 7.8–10.3 | L2:7 L2:8 | $-5 + (-2) \times \left(-4 + 1\right)^{2}$ |
| 256 | ^3 ^3 − · recall - · neg | 11 | 9.5 | 7.7–11.2 | L2:7 L2:8 | $(-2)^{3} - 3^{3}$ |
| 257 | ^2 − ÷ · recall M · grp | 6 | 9.5 | 8.6–10.1 | L3:5 L3:6 | $\dfrac{8^{2} - 36}{4}$ |
| 258 | + ÷ + · recall H · grp | 13 | 9.5 | 8.9–10.1 | L3:5 L3:6 | $\dfrac{35 + 30}{5} + 11$ |
| 259 | ^2 ^2 + √ + · recall - · grp | 20 | 9.6 | 6.6–12.6 | L3:3 L3:5 L3:6 L3:7 | $\sqrt{3^{2} + 4^{2}} + 17$ |
| 260 | + × − ÷ · recall H · grp | 19 | 9.6 | 8.4–10.6 | L3:4 L3:5 L3:6 | $\left(\left(9 + 6\right) \times 2 - 10\right) \div 5$ |
| 261 | × + ÷ · recall H · grp | 3 | 9.6 | 9.4–10.1 | L3:5 L3:6 | $\dfrac{42 + 3 \times 2}{6}$ |
| 262 | + ÷ + · recall M · grp,dec | 14 | 9.7 | 8.6–10.8 | L3:5 L3:6 | $\dfrac{12 + 20}{4} + 8.2$ |
| 263 | √ × − · recall X · dec | 4 | 9.7 | 9.7–9.7 | L3:6 | $4.2 \times 6 - \sqrt{0.25}$ |
| 264 | + ÷ + · recall M · grp,neg | 14 | 9.8 | 8.9–10.6 | L3:5 L3:6 | $\dfrac{20 + 24}{4} + (-9)$ |
| 265 | + √ × · recall H · grp | 13 | 9.8 | 7.2–10.2 | L3:3 L3:4 L3:6 | $3 \times \sqrt{25 + 144}$ |
| 266 | + − ÷ · recall M · grp,dec | 8 | 9.8 | 9.1–10.3 | L3:5 L3:6 | $\dfrac{16.8 + 1.2}{14 - 8}$ |
| 267 | − ÷ + · recall E · grp,neg | 3 | 9.9 | 9.4–10.4 | L3:5 L3:6 | $\dfrac{1 - (-5)}{3} + (-4)$ |
| 268 | + − × · recall X · grp,dec | 58 | 10.0 | 7.9–11.6 | L3:4 L3:5 L3:6 L3:7 | $6 \times \left(\left(1 + 9\right) - 1.4\right)$ |
| 269 | + − × · recall X · grp,neg | 18 | 10.0 | 8.2–11.5 | L2:7 L2:8 L3:4 L3:5 L3:6 L3:7 | $\left(-10 + 2\right) \times \left(12 - (-1)\right)$ |
| 270 | − ÷ + · recall M · grp,dec | 10 | 10.0 | 9.1–10.8 | L3:5 L3:6 | $\dfrac{29.2 - 13.2}{8} + 11.5$ |
| 271 | + × − ÷ · recall M · grp,neg | 34 | 10.0 | 8.2–11.2 | L3:4 L3:5 L3:6 L3:7 | $\left(\left(1 + 4\right) \times 3 - (-9)\right) \div 3$ |
| 272 | ^2 ÷ + − · recall H · neg | 4 | 10.0 | 9.2–11.4 | L2:8 | $14 + (-13) - 8^{2} \div 4$ |
| 273 | + − ÷ · recall M · grp,neg | 20 | 10.1 | 9.4–11.2 | L3:5 L3:6 L3:7 | $\dfrac{-9 + (-7)}{8 - 4}$ |
| 274 | ^2 − ÷ · recall M · grp,neg | 3 | 10.1 | 10.1–10.1 | L3:6 | $\dfrac{3^{2} - (-19)}{4}$ |
| 275 | ^3 × + · recall X | 1 | 10.2 | 10.2–10.2 | L2:8 | $3 \times 5^{3} + 9$ |
| 276 | − ÷ + · recall M · grp,neg | 17 | 10.2 | 9.4–11.5 | L3:5 L3:6 L3:7 | $\dfrac{-10 - 2}{4} + (-18)$ |
| 277 | + √ × · recall X · grp,dec | 9 | 10.2 | 8.9–12.2 | L3:5 L3:7 | $\sqrt{16.7 + 19.3} \times 5.9$ |
| 278 | + − ÷ · recall H · grp | 5 | 10.2 | 10.1–10.8 | L3:6 | $\dfrac{1 + 35}{13 - 7}$ |
| 279 | + × − ÷ · recall H · grp,dec | 1 | 10.3 | 10.3–10.3 | L3:6 | $\left(\left(1.8 + 1.1\right) \times 3 - 2.7\right) \div 3$ |
| 280 | + ÷ · recall H · grp,dec | 8 | 10.3 | 9.6–11.4 | L3:5 L3:7 | $\dfrac{6 + 3.2}{4}$ |
| 281 | × ÷ · recall H · grp | 8 | 10.4 | 9.9–10.9 | L3:6 L3:7 | $\dfrac{12 \times 5}{3}$ |
| 282 | + ÷ · recall X · grp,neg | 10 | 10.5 | 6.4–12.5 | L2:5 L2:7 L3:7 | $-72 \div \left(-6 + (-3)\right)$ |
| 283 | × + ÷ · recall M · grp,neg | 18 | 10.6 | 9.7–11.5 | L3:6 L3:7 | $\dfrac{60 + (-5) \times 4}{5}$ |
| 284 | + ÷ + · recall H · grp,dec | 6 | 10.6 | 10.1–11.3 | L3:6 L3:7 | $\dfrac{42 + 30}{6} + 9.1$ |
| 285 | × ÷ · recall H · grp,neg | 3 | 10.6 | 9.8–11.3 | L3:6 L3:7 | $\dfrac{9 \times (-3)}{3}$ |
| 286 | ^2 ^2 + √ + · recall - · grp,neg | 16 | 10.7 | 8.1–13.4 | L3:4 L3:5 L3:7 L3:8 | $\sqrt{3^{2} + 4^{2}} + (-17)$ |
| 287 | − × + × · recall H · grp,dec | 1 | 10.9 | 10.9–10.9 | L3:7 | $2 \times \left(2 + 5 \times \left(6.6 - 4.2\right)\right)$ |
| 288 | + √ × · recall X · grp,neg | 8 | 11.0 | 11–11 | L3:7 | $-4 \times \sqrt{25 + 144}$ |
| 289 | − × + × · recall H · grp,neg | 16 | 11.1 | 9–13.2 | L3:5 L3:6 L3:7 L3:8 | $4 \times \left(3 + 5 \times \left(12 - (-4)\right)\right)$ |
| 290 | ^2 − ÷ · recall H · grp,neg | 2 | 11.1 | 11.1–11.1 | L3:7 | $\dfrac{3^{2} - (-45)}{6}$ |
| 291 | + ÷ + · recall H · grp,neg | 4 | 11.1 | 10.4–11.6 | L3:6 L3:7 | $\dfrac{30 + 36}{6} + (-10)$ |
| 292 | + − ÷ · recall H · grp,neg | 4 | 11.2 | 10.5–12.2 | L3:6 L3:7 | $\dfrac{-18 + (-22)}{11 - 6}$ |
| 293 | + ÷ · recall X · grp,dec | 10 | 11.3 | 9.9–11.4 | L3:6 L3:7 | $\dfrac{13.8 + 38.2}{8}$ |
| 294 | + ^2 × + · recall X · grp,neg | 8 | 11.4 | 8.6–13.1 | L2:8 | $-1 + (-4) \times \left(1 + 3\right)^{2}$ |
| 295 | + − ÷ · recall H · grp,dec | 8 | 11.4 | 10.1–12.6 | L3:6 L3:7 | $\dfrac{7.8 + 10.2}{8 - 3}$ |
| 296 | + × − ÷ · recall H · grp,neg | 17 | 11.4 | 9.7–12.2 | L3:6 L3:7 | $\left(\left(-2 + 6\right) \times 3 - (-24)\right) \div 6$ |
| 297 | × + ÷ · recall H · grp,dec | 7 | 11.5 | 10.1–12.6 | L3:6 L3:7 | $\dfrac{16.2 + 2.6 \times 3}{6}$ |
| 298 | ^2 ^2 × + · recall X · neg | 8 | 11.6 | 9.9–13 | L2:8 | $(-3)^{2} + (-2) \times 8^{2}$ |
| 299 | × + ÷ · recall H · grp,neg | 22 | 11.7 | 10.2–13.3 | L3:6 L3:7 L3:8 | $\dfrac{-12 + (-2) \times 3}{2}$ |
| 300 | − ÷ + · recall H · grp,dec | 9 | 11.7 | 10.1–13.6 | L3:6 L3:7 L3:8 | $\dfrac{33.2 - 16}{4} + 19$ |
| 301 | + ÷ + · recall X · grp,neg | 2 | 11.9 | 11.9–11.9 | L3:7 | $\dfrac{36 + 42}{6} + (-1)$ |
| 302 | × ÷ · recall X · grp | 16 | 11.9 | 11.4–12.4 | L3:7 | $\dfrac{21 \times 6}{7}$ |
| 303 | ^2 − × + · recall X · grp,neg | 6 | 12.0 | 10.4–13.8 | L2:8 | $(-3)^{2} + \left(-12 - 4\right) \times 4$ |
| 304 | + × − ÷ · recall X · grp,neg | 5 | 12.0 | 11.7–13.2 | L3:7 L3:8 | $\left(\left(7 + 7\right) \times (-3) - (-87)\right) \div 5$ |
| 305 | + − ÷ · recall X · grp,neg | 4 | 12.3 | 12–13.2 | L3:7 L3:8 | $\dfrac{11 + (-65)}{14 - 8}$ |
| 306 | − ÷ + · recall H · grp,neg | 14 | 12.3 | 10.9–13 | L3:7 L3:8 | $\dfrac{-9 - 19}{4} + (-12)$ |
| 307 | + − ÷ · recall X · grp,dec | 11 | 12.5 | 11.6–13.1 | L3:7 L3:8 | $\dfrac{19.8 + 22.8}{15 - 9}$ |
| 308 | − × + × · recall X · grp,neg | 55 | 12.6 | 8–15.3 | L3:4 L3:5 L3:6 L3:7 L3:8 | $-4 \times \left(-6 + 2 \times \left(9 - (-3)\right)\right)$ |
| 309 | + × − ÷ · recall X · grp,dec | 41 | 12.6 | 10.6–13.8 | L3:6 L3:7 L3:8 | $\left(\left(2.5 + 6.7\right) \times 3 - 19.6\right) \div 4$ |
| 310 | × + ÷ · recall X · grp,dec | 14 | 12.9 | 11.4–15.4 | L3:7 L3:8 | $\dfrac{22.4 + 6 \times 2.1}{5}$ |
| 311 | × ÷ · recall X · grp,neg | 12 | 13.1 | 10.3–14.8 | L3:6 L3:7 L3:8 | $\dfrac{48 \times (-2)}{8}$ |
| 312 | ^2 − ÷ · recall X · grp,dec | 7 | 13.3 | 12.6–13.4 | L3:7 L3:8 | $\dfrac{9^{2} - 61.8}{3}$ |
| 313 | − ÷ + · recall X · grp,dec | 21 | 13.3 | 11.6–13.6 | L3:7 L3:8 | $\dfrac{74.9 - 11.7}{8} + 3.1$ |
| 314 | ^2 − ÷ · recall H · grp,dec | 3 | 13.4 | 13.4–13.4 | L3:8 | $\dfrac{9^{2} - 64.6}{4}$ |
| 315 | − ÷ + · recall X · grp,neg | 4 | 13.8 | 13.5–14 | L3:8 | $\dfrac{-52 - 11}{9} + (-18)$ |
| 316 | × ÷ · recall X · grp,dec | 16 | 13.8 | 8.9–15.2 | L3:5 L3:7 L3:8 | $\dfrac{8 \times 8.7}{2}$ |
| 317 | ^2 ^2 + √ + · recall - · grp,dec | 30 | 13.9 | 11.3–15 | L3:7 L3:8 | $\sqrt{0.3^{2} + 0.4^{2}} + 17$ |
| 318 | − × + × · recall X · grp,dec | 71 | 14.2 | 9.4–16.6 | L3:5 L3:6 L3:7 L3:8 | $3 \times \left(9 + 5 \times \left(8 - 3.3\right)\right)$ |
| 319 | × + ÷ · recall X · grp,neg | 2 | 14.3 | 14.3–14.3 | L3:8 | $\dfrac{18 + 6 \times (-6)}{6}$ |
