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

## Spread by level

| Level | Questions | Min | 25th | Median | 75th | Max |
|---|---|---|---|---|---|---|
| level1 | 600 | 1.5 | 3.7 | 4.7 | 5.7 | 8.7 |
| level2 | 1200 | 1.6 | 4.7 | 5.7 | 7.4 | 13.8 |
| level3 | 1800 | 2 | 6.5 | 8.7 | 10.9 | 16.1 |

## Spread by option (Focus · Numbers)

| Level · Focus · Numbers | n | Median | Range |
|---|---|---|---|
| level1 · basic · whole | 200 | 4 | 1.5–7.7 |
| level1 · chain · whole | 200 | 3.7 | 1.5–8.7 |
| level1 · mixed · whole | 200 | 5.4 | 3–8.4 |
| level2 · brackets · whole | 200 | 4.8 | 1.6–9.2 |
| level2 · brackets · negatives | 200 | 6.4 | 2.4–12.5 |
| level2 · indices · whole | 200 | 5 | 1.7–10.2 |
| level2 · indices · negatives | 200 | 5.8 | 2.9–13 |
| level2 · bracketsIndices · whole | 200 | 5.8 | 2.8–8.8 |
| level2 · bracketsIndices · negatives | 200 | 7.8 | 4.3–13.8 |
| level3 · roots · whole | 200 | 4.7 | 2–12.6 |
| level3 · roots · negatives | 200 | 6.2 | 3.3–13.4 |
| level3 · roots · decimals | 200 | 7.7 | 5.2–15 |
| level3 · fraction · whole | 200 | 8.4 | 5.4–12.4 |
| level3 · fraction · negatives | 200 | 10.7 | 7.9–14.8 |
| level3 · fraction · decimals | 200 | 10.8 | 7.1–15.4 |
| level3 · nested · whole | 200 | 7.4 | 3.7–10.1 |
| level3 · nested · negatives | 200 | 10.2 | 5–15.3 |
| level3 · nested · decimals | 200 | 11.8 | 6.1–16.1 |

## Categories, easiest to hardest (318 found)

A category is the operations in the order they happen, the hardest recall they need (E easy, M mid, H hard, X beyond the grid) and what makes the line awkward. Within a category the score still varies with the actual numbers.

| # | Category | n | Mean score | Range | Example |
|---|---|---|---|---|---|
| 1 | + × · recall E · grp | 1 | 1.6 | 1.6–1.6 | $\left(5 + 5\right) \times 5$ |
| 2 | × + · recall E | 10 | 1.9 | 1.5–2.7 | $14 + 3 \times 5$ |
| 3 | × ÷ · recall E | 3 | 2.2 | 1.7–2.7 | $10 \times 2 \div 2$ |
| 4 | ^2 × · recall E | 3 | 2.2 | 2.2–2.2 | $5 \times 2^{2}$ |
| 5 | × − · recall E | 10 | 2.2 | 2–2.7 | $49 - 3 \times 2$ |
| 6 | − × · recall E · grp | 7 | 2.4 | 1.6–3.3 | $\left(13 - 10\right) \times 2$ |
| 7 | − + · recall - | 30 | 2.4 | 1.5–3.4 | $31 - 11 + 12$ |
| 8 | √ × · recall E | 5 | 2.5 | 2.5–2.5 | $2 \times \sqrt{100}$ |
| 9 | − − · recall - | 30 | 2.5 | 2–3.4 | $32 - 3 - 8$ |
| 10 | ÷ + · recall E | 8 | 2.6 | 2.2–3.4 | $9 + 16 \div 4$ |
| 11 | √ + · recall - | 16 | 2.6 | 2–3.5 | $\sqrt{49} + 15$ |
| 12 | ÷ × · recall E | 2 | 2.7 | 2.7–2.7 | $12 \div 3 \times 2$ |
| 13 | + − · recall - · grp | 12 | 2.8 | 2.1–3.3 | $49 - \left(11 + 3\right)$ |
| 14 | ^2 − · recall - | 10 | 2.8 | 2.2–3.7 | $50 - 2^{2}$ |
| 15 | ^2 + · recall - | 24 | 2.8 | 1.7–3.7 | $3 + 7^{2}$ |
| 16 | × × − · recall E | 3 | 2.9 | 2.5–3.7 | $4 \times 2 - 3 \times 2$ |
| 17 | × × + · recall E | 3 | 2.9 | 2.5–3.7 | $5 \times 3 + 5 \times 5$ |
| 18 | ÷ − · recall E | 8 | 3.0 | 2.7–3.4 | $38 - 25 \div 5$ |
| 19 | × + · recall M | 9 | 3.0 | 3–3 | $2 + 9 \times 2$ |
| 20 | √ − · recall - | 21 | 3.1 | 2.5–4.2 | $33 - \sqrt{100}$ |
| 21 | − × · recall E · grp,neg | 2 | 3.1 | 3.1–3.1 | $\left(-8 - (-8)\right) \times 5$ |
| 22 | ÷ ÷ · recall E | 2 | 3.1 | 2.9–3.4 | $50 \div 5 \div 5$ |
| 23 | + × − · recall E · grp | 2 | 3.2 | 3.1–3.3 | $5 \times \left(2 + 3\right) - 5$ |
| 24 | ^2 × · recall M | 3 | 3.2 | 3.2–3.2 | $2 \times 3^{2}$ |
| 25 | + × · recall M · grp | 9 | 3.3 | 3.1–3.6 | $\left(5 + 3\right) \times 5$ |
| 26 | √ × · recall M · neg | 5 | 3.3 | 3.3–3.3 | $-5 \times \sqrt{100}$ |
| 27 | ^2 × · recall E · neg | 1 | 3.4 | 3.4–3.4 | $4 \times (-2)^{2}$ |
| 28 | × − · recall M | 10 | 3.4 | 3–3.7 | $43 - 2 \times 6$ |
| 29 | ÷ + × · recall E · grp | 3 | 3.5 | 3.3–3.8 | $\left(20 \div 4 + 5\right) \times 3$ |
| 30 | × + − · recall E | 3 | 3.5 | 3–3.7 | $17 + 3 \times 4 - 16$ |
| 31 | √ × + · recall E | 8 | 3.5 | 3–4.2 | $7 + 5 \times \sqrt{25}$ |
| 32 | + × · recall E · grp,neg | 2 | 3.6 | 3.6–3.6 | $\left(9 + (-5)\right) \times 3$ |
| 33 | ÷ + · recall M | 15 | 3.6 | 3.2–4.4 | $2 + 21 \div 7$ |
| 34 | − × · recall M · grp,neg | 3 | 3.6 | 2.4–5.6 | $\left(8 - 5\right) \times (-5)$ |
| 35 | ^2 × + · recall E | 3 | 3.7 | 3.2–4 | $8^{2} + 5 \times 3$ |
| 36 | − + − · recall - | 38 | 3.7 | 2.5–5.1 | $49 - 4 + 11 - 2$ |
| 37 | × − + · recall E | 12 | 3.8 | 3–4.4 | $37 - 5 + 2 \times 5$ |
| 38 | ^3 − · recall - | 5 | 3.8 | 3.7–4 | $46 - 3^{3}$ |
| 39 | √ × − · recall E | 12 | 3.8 | 3–4.7 | $3 \times 3 - \sqrt{9}$ |
| 40 | + ^2 × + · recall E · grp | 1 | 3.8 | 3.8–3.8 | $4 + 2 \times \left(1 + 1\right)^{2}$ |
| 41 | ÷ × + · recall E | 7 | 3.8 | 3.2–4.4 | $10 + 15 \div 3 \times 3$ |
| 42 | + ^2 ÷ · recall E · grp | 8 | 3.9 | 3.5–4 | $\left(3 + 2\right)^{2} \div 5$ |
| 43 | − × · recall M · grp | 4 | 4.0 | 3.6–4.3 | $\left(19 - 7\right) \times 3$ |
| 44 | ÷ − + · recall E | 14 | 4.1 | 3.7–5.1 | $56 - 16 \div 4 + 2$ |
| 45 | + × · recall M · grp,neg | 10 | 4.1 | 2.4–5.1 | $\left(-7 + 6\right) \times 3$ |
| 46 | × + · recall H | 7 | 4.1 | 4–4.7 | $6 + 7 \times 7$ |
| 47 | × + × · recall M · grp | 3 | 4.1 | 4.1–4.1 | $\left(3 + 2 \times 2\right) \times 2$ |
| 48 | ÷ − · recall M | 23 | 4.1 | 3.7–4.4 | $31 - 24 \div 6$ |
| 49 | + − × · recall E · grp | 28 | 4.1 | 2.7–5.4 | $\left(12 + 4\right) \times \left(11 - 1\right)$ |
| 50 | ^3 + · recall - | 23 | 4.1 | 3–6.2 | $4^{3} + 29$ |
| 51 | √ ^2 + · recall - | 15 | 4.1 | 3.2–5 | $\sqrt{25} + 4^{2}$ |
| 52 | √ + · recall - · neg | 13 | 4.2 | 3.5–5 | $\sqrt{100} + (-16)$ |
| 53 | √ × · recall M | 11 | 4.2 | 3.5–5 | $3 \times \sqrt{49}$ |
| 54 | ^2 × · recall M · neg | 1 | 4.2 | 4.2–4.2 | $-4 \times (-2)^{2}$ |
| 55 | ^2 + − · recall - | 13 | 4.2 | 2.2–5.7 | $19 + 4^{2} - 7$ |
| 56 | + × · recall H · grp | 21 | 4.2 | 4.1–4.6 | $5 \times \left(12 + 5\right)$ |
| 57 | + ÷ · recall E · grp | 20 | 4.2 | 2.8–6.4 | $\left(3 + 5\right) \div 2$ |
| 58 | √ − · recall - · neg | 8 | 4.3 | 4–5 | $-30 - \sqrt{16}$ |
| 59 | ÷ × · recall M | 19 | 4.3 | 3.7–4.7 | $32 \div 4 \times 3$ |
| 60 | × ÷ · recall M | 3 | 4.4 | 3.7–4.7 | $6 \times 3 \div 2$ |
| 61 | × + − · recall M | 14 | 4.5 | 4–5.4 | $16 + 4 \times 7 - 5$ |
| 62 | × − · recall H | 3 | 4.5 | 4–4.7 | $59 - 7 \times 8$ |
| 63 | ^2 − · recall - · neg | 12 | 4.5 | 3.7–4.9 | $-51 - 7^{2}$ |
| 64 | ÷ ^2 × · recall E · grp | 2 | 4.5 | 4.5–4.5 | $2 \times \left(4 \div 2\right)^{2}$ |
| 65 | + ^2 + · recall - · grp | 8 | 4.5 | 3.3–6.3 | $\left(4 + 3\right)^{2} + 4$ |
| 66 | ^2 ^2 × + · recall E | 7 | 4.5 | 3.9–5.2 | $3^{2} + 2 \times 2^{2}$ |
| 67 | ^2 ^2 − · recall - | 5 | 4.6 | 3.4–5.7 | $9^{2} - 8^{2}$ |
| 68 | ÷ ÷ · recall M | 5 | 4.7 | 4.4–5.9 | $60 \div 5 \div 2$ |
| 69 | × × − + · recall E | 1 | 4.7 | 4.7–4.7 | $5 \times 5 - 2 \times 4 + 20$ |
| 70 | ^2 + · recall - · neg | 20 | 4.7 | 2.9–5.7 | $(-7)^{2} + (-19)$ |
| 71 | + × − · recall E · grp,neg | 4 | 4.7 | 3.6–6.1 | $\left(4 + (-3)\right) \times 6 - (-5)$ |
| 72 | ^2 − × + · recall E · grp | 14 | 4.7 | 4.3–5.8 | $2^{2} + \left(6 - 3\right) \times 5$ |
| 73 | √ × · recall H · neg | 9 | 4.7 | 4.3–5.8 | $-2 \times \sqrt{36}$ |
| 74 | + − · recall - · grp,neg | 21 | 4.8 | 3.6–5.6 | $-37 - \left(7 + 9\right)$ |
| 75 | × − + · recall M | 28 | 4.8 | 4–5.4 | $42 - 7 + 7 \times 4$ |
| 76 | + ^2 − · recall - · grp | 21 | 4.8 | 3.3–6.3 | $\left(6 + 2\right)^{2} - 21$ |
| 77 | ^3 + − · recall - | 3 | 4.8 | 4–5.7 | $9 + 3^{3} - 20$ |
| 78 | ^3 × · recall H · neg | 1 | 4.8 | 4.8–4.8 | $-3 \times 2^{3}$ |
| 79 | ^2 − · recall - · grp,neg | 25 | 4.8 | 4.2–5.5 | $21 - -4^{2}$ |
| 80 | √ × + · recall E · neg | 3 | 4.8 | 4.5–5 | $-14 + 4 \times \sqrt{100}$ |
| 81 | ^3 × + · recall E | 2 | 4.8 | 4–5.7 | $4^{3} + 3 \times 2$ |
| 82 | × × − · recall M | 8 | 4.9 | 4–5.7 | $8 \times 5 - 5 \times 8$ |
| 83 | + × − · recall M · grp | 3 | 4.9 | 4.6–5.3 | $4 \times \left(8 + 4\right) - 4$ |
| 84 | ^2 + · recall - · grp,neg | 17 | 4.9 | 4.2–5.5 | $-4^{2} + 8$ |
| 85 | + √ × · recall E · grp | 24 | 4.9 | 4.2–5.4 | $\sqrt{18 + 7} \times 4$ |
| 86 | ^2 × · recall H | 17 | 4.9 | 4.2–5.5 | $5 \times 7^{2}$ |
| 87 | ^2 × + · recall M | 11 | 4.9 | 4.2–5.7 | $2^{2} + 9 \times 2$ |
| 88 | − ^2 + · recall - · grp | 35 | 4.9 | 2.8–6.8 | $\left(12 - 5\right)^{2} + 19$ |
| 89 | × × + · recall M | 17 | 5.0 | 4–5.7 | $5 \times 3 + 2 \times 9$ |
| 90 | + × · recall H · grp,neg | 13 | 5.0 | 3.9–5.9 | $-2 \times \left(4 + 4\right)$ |
| 91 | ÷ + · recall H | 3 | 5.0 | 4.2–5.4 | $9 + 63 \div 7$ |
| 92 | − × · recall H · grp | 6 | 5.1 | 4.6–5.3 | $\left(20 - 11\right) \times 8$ |
| 93 | ÷ − · recall H | 9 | 5.1 | 4.7–5.4 | $21 - 72 \div 9$ |
| 94 | √ × · recall H | 5 | 5.2 | 5–6 | $9 \times \sqrt{81}$ |
| 95 | √ × + · recall M | 9 | 5.2 | 5–6 | $15 + 2 \times \sqrt{36}$ |
| 96 | + ^2 × + · recall M · grp | 5 | 5.3 | 5.3–5.3 | $3 + 4 \times \left(2 + 1\right)^{2}$ |
| 97 | √ + · recall - · dec | 13 | 5.3 | 5.2–5.7 | $\sqrt{0.04} + 13$ |
| 98 | + ÷ · recall E · grp,neg | 3 | 5.3 | 3.8–7.9 | $\left(-1 + 9\right) \div 2$ |
| 99 | √ ^2 + · recall - · neg | 32 | 5.3 | 4.4–6.2 | $\sqrt{25} + (-9)^{2}$ |
| 100 | × + − · recall H | 12 | 5.4 | 5–5.7 | $10 + 9 \times 8 - 16$ |
| 101 | + ^3 + · recall - · grp | 13 | 5.4 | 3.6–7.3 | $\left(3 + 3\right)^{3} + 15$ |
| 102 | ÷ − + · recall M | 40 | 5.4 | 4.7–6.1 | $48 - 16 \div 2 + 1$ |
| 103 | + ^2 ÷ · recall E · grp,neg | 5 | 5.4 | 5–5.5 | $\left(-4 + 9\right)^{2} \div 5$ |
| 104 | × + × · recall H · grp | 17 | 5.4 | 5.1–5.6 | $\left(8 + 2 \times 3\right) \times 4$ |
| 105 | ÷ × + · recall M | 26 | 5.4 | 4.2–6.4 | $29 + 12 \div 3 \times 6$ |
| 106 | √ × − · recall M | 2 | 5.5 | 5.2–5.7 | $6 \times 4 - \sqrt{36}$ |
| 107 | − × · recall H · grp,neg | 3 | 5.5 | 4.4–6.1 | $\left(-17 - (-8)\right) \times (-3)$ |
| 108 | × × − · recall H | 6 | 5.5 | 5–6 | $6 \times 7 - 8 \times 4$ |
| 109 | ^3 × · recall H | 3 | 5.5 | 5–6.5 | $2 \times 3^{3}$ |
| 110 | ^2 − × + · recall E · grp,neg | 1 | 5.5 | 5.5–5.5 | $(-2)^{2} + \left(7 - 4\right) \times 5$ |
| 111 | ^2 ^2 − · recall - · neg | 9 | 5.5 | 4.1–6.9 | $(-2)^{2} - 9^{2}$ |
| 112 | ÷ + × · recall M · grp | 15 | 5.6 | 4.3–6.3 | $\left(40 \div 8 + 2\right) \times 4$ |
| 113 | − × · recall X · grp | 2 | 5.6 | 5.6–5.6 | $\left(18 - 2\right) \times 8$ |
| 114 | + × · recall X · grp | 6 | 5.6 | 5.6–5.6 | $6 \times \left(5 + 12\right)$ |
| 115 | × + × · recall M · grp,neg | 10 | 5.6 | 3.4–6.6 | $\left(-8 + (-5) \times (-2)\right) \times 4$ |
| 116 | √ × − · recall M · neg | 14 | 5.7 | 4.3–6.3 | $-4 \times 4 - \sqrt{36}$ |
| 117 | ^2 ÷ + − · recall E | 6 | 5.7 | 4.4–6.3 | $5 + 9 - 5^{2} \div 5$ |
| 118 | √ − · recall - · dec | 23 | 5.7 | 5.7–5.7 | $23 - \sqrt{0.49}$ |
| 119 | + ^2 ÷ · recall M · grp | 10 | 5.7 | 5–6.3 | $\left(4 + 2\right)^{2} \div 3$ |
| 120 | + √ × · recall E · grp,dec | 3 | 5.7 | 5.4–5.9 | $\sqrt{17.7 + 7.3} \times 4$ |
| 121 | ÷ ^2 × · recall M · grp | 11 | 5.8 | 5.5–6.5 | $5 \times \left(12 \div 6\right)^{2}$ |
| 122 | √ × · recall X · neg | 4 | 5.8 | 5.8–5.8 | $-9 \times \sqrt{36}$ |
| 123 | × − + · recall H | 20 | 5.8 | 5–6.4 | $22 - 4 + 6 \times 9$ |
| 124 | + × − · recall H · grp | 28 | 5.8 | 5.1–6.6 | $\left(2 + 11\right) \times 3 - 6$ |
| 125 | + ^2 + · recall - · grp,neg | 18 | 5.9 | 4.3–7.5 | $\left(3 + 3\right)^{2} + (-6)$ |
| 126 | + − × · recall M · grp | 46 | 5.9 | 4.2–6.4 | $\left(6 + 2\right) \times \left(7 - 3\right)$ |
| 127 | ^2 × + · recall E · neg | 1 | 5.9 | 5.9–5.9 | $3 \times (-2)^{2} + (-13)$ |
| 128 | ^3 − · recall - · neg | 7 | 6.0 | 5.5–6.7 | $-39 - (-2)^{3}$ |
| 129 | √ × + · recall M · neg | 19 | 6.0 | 5.3–7.5 | $-13 + 4 \times \sqrt{121}$ |
| 130 | √ × · recall M · dec | 16 | 6.0 | 6–6 | $9 \times \sqrt{0.16}$ |
| 131 | × × + · recall H | 19 | 6.0 | 5–7.7 | $7 \times 7 + 8 \times 8$ |
| 132 | + √ × · recall M · grp | 9 | 6.0 | 5.2–6.9 | $\sqrt{11 + 70} \times 4$ |
| 133 | + ÷ · recall M · grp | 31 | 6.0 | 3.8–8.1 | $\left(14 + 10\right) \div 4$ |
| 134 | + √ × · recall E · grp,neg | 3 | 6.0 | 5.7–6.2 | $\sqrt{-7 + 16} \times 3$ |
| 135 | × × − + · recall M | 11 | 6.1 | 4.5–7.4 | $4 \times 7 - 3 \times 6 + 15$ |
| 136 | ÷ × · recall H | 11 | 6.1 | 5.7–6.7 | $64 \div 8 \times 8$ |
| 137 | ^2 + − · recall - · neg | 15 | 6.1 | 3.9–7.4 | $18 + 7^{2} - (-12)$ |
| 138 | + √ + · recall - · grp | 19 | 6.1 | 4.2–8.9 | $\sqrt{36 + 64} + 10$ |
| 139 | + − × · recall E · grp,neg | 19 | 6.1 | 4.2–7.2 | $\left(-9 + 11\right) \times \left(15 - 5\right)$ |
| 140 | ^2 ^2 × + · recall M | 4 | 6.2 | 5.4–6.9 | $9^{2} + 4 \times 3^{2}$ |
| 141 | + × − ÷ · recall E · grp | 2 | 6.2 | 5.9–6.4 | $\left(\left(2 + 1\right) \times 3 - 0\right) \div 3$ |
| 142 | ÷ ÷ · recall H | 20 | 6.2 | 5.4–6.4 | $54 \div 3 \div 3$ |
| 143 | − × + × · recall E · grp,neg | 2 | 6.2 | 6.2–6.2 | $3 \times \left(-5 + 2 \times \left(8 - 5\right)\right)$ |
| 144 | ^2 × + · recall M · neg | 3 | 6.2 | 5.7–6.9 | $3 \times (-3)^{2} + (-1)$ |
| 145 | + ^2 × + · recall E · grp,neg | 14 | 6.3 | 4.8–8.5 | $-2 + 2 \times \left(2 + (-4)\right)^{2}$ |
| 146 | − × + × · recall M · grp | 6 | 6.3 | 5.7–6.7 | $3 \times \left(3 + 2 \times \left(7 - 5\right)\right)$ |
| 147 | √ × − · recall X · neg | 1 | 6.3 | 6.3–6.3 | $-6 \times (-6) - \sqrt{4}$ |
| 148 | + − × · recall E · grp,dec | 2 | 6.3 | 6.1–6.6 | $5 \times \left(\left(6 + 6.7\right) - 2.7\right)$ |
| 149 | ÷ − + · recall H | 15 | 6.4 | 5.7–7.1 | $39 - 56 \div 7 + 3$ |
| 150 | ^2 × · recall H · neg | 4 | 6.4 | 5.4–6.7 | $2 \times (-9)^{2}$ |
| 151 | + × − · recall M · grp,neg | 6 | 6.5 | 6.1–7.1 | $\left(9 + (-4)\right) \times 8 - 11$ |
| 152 | ^2 − × + · recall M · grp | 19 | 6.5 | 5.3–7.5 | $8^{2} + \left(10 - 2\right) \times 3$ |
| 153 | × ÷ · recall H | 17 | 6.5 | 4.2–7.2 | $24 \times 2 \div 8$ |
| 154 | + ^2 − · recall - · grp,neg | 25 | 6.6 | 4.3–8.3 | $\left(-6 + 4\right)^{2} - (-20)$ |
| 155 | − √ − · recall - · grp | 13 | 6.6 | 5.4–7.6 | $18 - \sqrt{100 - 36}$ |
| 156 | ^3 ^3 − · recall - | 6 | 6.6 | 5–9 | $5^{3} - 5^{3}$ |
| 157 | − ÷ · recall E · grp | 16 | 6.6 | 5.4–7.1 | $\dfrac{18 - 15}{3}$ |
| 158 | √ × − · recall E · dec | 4 | 6.6 | 6.2–6.7 | $5 \times 5 - \sqrt{0.25}$ |
| 159 | + − × · recall H · grp | 12 | 6.6 | 5.9–7.4 | $\left(3 + 5\right) \times \left(13 - 4\right)$ |
| 160 | ^3 × + · recall M | 4 | 6.6 | 5–8.2 | $5^{3} + 8 \times 5$ |
| 161 | ^2 ÷ + − · recall M | 4 | 6.6 | 5.9–7.4 | $9 + 14 - 4^{2} \div 2$ |
| 162 | ÷ + × · recall M · grp,neg | 7 | 6.7 | 4.6–7.7 | $\left(14 \div 7 + (-5)\right) \times (-4)$ |
| 163 | + √ × · recall H · grp,dec | 2 | 6.7 | 6.7–6.7 | $\sqrt{12 + 4} \times 3.9$ |
| 164 | ^3 + · recall - · neg | 12 | 6.7 | 4.5–8.2 | $-27 + (-3)^{3}$ |
| 165 | + − ÷ · recall E · grp | 8 | 6.7 | 6.4–8.1 | $\dfrac{23 + 2}{11 - 6}$ |
| 166 | + ^3 + · recall - · grp,neg | 9 | 6.7 | 5.1–7.8 | $\left(2 + (-3)\right)^{3} + 9$ |
| 167 | + ^2 ÷ · recall H · grp | 15 | 6.8 | 6.8–6.8 | $\left(5 + 4\right)^{2} \div 9$ |
| 168 | ÷ + × · recall H · grp | 2 | 6.8 | 6.8–6.8 | $\left(35 \div 7 + 8\right) \times 4$ |
| 169 | ÷ ^2 × · recall H · grp | 16 | 6.8 | 6.5–7.5 | $5 \times \left(32 \div 8\right)^{2}$ |
| 170 | + × · recall X · grp,neg | 14 | 6.8 | 4.9–7.9 | $\left(-6 + (-10)\right) \times 3$ |
| 171 | + √ × · recall M · grp,neg | 17 | 6.8 | 5.5–8.7 | $\sqrt{-24 + 105} \times 4$ |
| 172 | ^2 × + · recall H | 16 | 6.9 | 5.2–8.2 | $3 \times 5^{2} + 4$ |
| 173 | √ × − · recall H · neg | 9 | 6.9 | 6–7.3 | $-6 \times 4 - \sqrt{49}$ |
| 174 | + − × · recall M · grp,neg | 25 | 6.9 | 5–8.7 | $\left(-8 + 6\right) \times \left(6 - 3\right)$ |
| 175 | + ÷ + · recall E · grp | 4 | 6.9 | 6.4–7.1 | $\dfrac{35 + 15}{5} + 3$ |
| 176 | ^2 × · recall X · neg | 3 | 6.9 | 6.3–7.5 | $-2 \times (-8)^{2}$ |
| 177 | ^2 ÷ + − · recall E · neg | 4 | 7.0 | 6.1–8.1 | $-7 + 17 - 5^{2} \div 5$ |
| 178 | + ^2 × + · recall H · grp | 21 | 7.1 | 6.3–8.6 | $1 + 3 \times \left(1 + 3\right)^{2}$ |
| 179 | ÷ × + · recall H | 13 | 7.1 | 6.7–8.4 | $20 + 63 \div 7 \times 4$ |
| 180 | + × − · recall X · grp | 4 | 7.2 | 6.1–8.3 | $8 \times \left(12 + 7\right) - 6$ |
| 181 | + ÷ · recall E · grp,dec | 5 | 7.2 | 7.1–7.6 | $\dfrac{6.5 + 2.5}{3}$ |
| 182 | − × · recall X · grp,neg | 10 | 7.2 | 5.6–7.9 | $\left(-10 - 10\right) \times (-7)$ |
| 183 | + √ × · recall M · grp,dec | 9 | 7.2 | 6.4–7.4 | $\sqrt{10.8 + 38.2} \times 3$ |
| 184 | × + × · recall H · grp,neg | 6 | 7.2 | 5.9–7.7 | $\left(6 + (-3) \times 4\right) \times (-2)$ |
| 185 | − ÷ + · recall E · grp | 2 | 7.3 | 6.9–7.6 | $\dfrac{18 - 8}{5} + 4$ |
| 186 | − √ − · recall - · grp,neg | 14 | 7.3 | 6.4–8.4 | $-27 - \sqrt{25 - 9}$ |
| 187 | × × − + · recall H | 13 | 7.3 | 6–8.4 | $9 \times 6 - 3 \times 5 + 11$ |
| 188 | + ÷ · recall H · grp | 20 | 7.3 | 4.8–9.1 | $77 \div \left(6 + 5\right)$ |
| 189 | ÷ ^2 × · recall M · grp,neg | 10 | 7.3 | 5.3–8.3 | $4 \times \left(9 \div (-3)\right)^{2}$ |
| 190 | + ^2 ÷ · recall M · grp,neg | 7 | 7.3 | 6.5–7.8 | $\left(-3 + 7\right)^{2} \div 2$ |
| 191 | − √ − · recall - · grp,dec | 8 | 7.4 | 6.6–8.1 | $10.4 - \sqrt{100 - 64}$ |
| 192 | × + ÷ · recall E · grp | 8 | 7.4 | 6.9–8.1 | $\dfrac{14 + 2 \times 3}{5}$ |
| 193 | + ÷ · recall M · grp,neg | 21 | 7.4 | 5.3–9.5 | $18 \div \left(-3 + 5\right)$ |
| 194 | ^3 × · recall X | 3 | 7.5 | 7.5–7.5 | $3 \times 5^{3}$ |
| 195 | √ × + · recall H · neg | 5 | 7.5 | 7.3–8.3 | $-9 + (-3) \times \sqrt{49}$ |
| 196 | + √ + · recall - · grp,dec | 14 | 7.5 | 5.4–9.4 | $\sqrt{25 + 144} + 9.2$ |
| 197 | ^2 × + · recall H · neg | 9 | 7.6 | 6.5–9.7 | $6^{2} + (-8) \times (-3)$ |
| 198 | + × − · recall H · grp,neg | 8 | 7.7 | 6.4–8.4 | $2 \times \left(-4 + (-8)\right) - 5$ |
| 199 | √ × − · recall M · dec | 5 | 7.7 | 7.7–7.7 | $4 \times 6 - \sqrt{0.09}$ |
| 200 | + − × · recall H · grp,neg,dec | 3 | 7.7 | 6.5–8.9 | $2.4 \times \left(\left(2 + 3\right) - 6\right)$ |
| 201 | + √ × · recall H · grp,neg | 11 | 7.7 | 6.5–9.5 | $\sqrt{54 + 27} \times (-2)$ |
| 202 | + − × · recall M · grp,dec | 6 | 7.7 | 6.9–8.1 | $4 \times \left(\left(2.4 + 3.8\right) - 6\right)$ |
| 203 | ^3 × + · recall H | 8 | 7.7 | 6.7–9.2 | $4 \times 3^{3} + 14$ |
| 204 | √ × + · recall M · dec | 26 | 7.7 | 7–8.2 | $1 + 2 \times \sqrt{0.81}$ |
| 205 | × + × · recall X · grp,neg | 10 | 7.9 | 6.4–8.7 | $\left(8 + 5 \times 3\right) \times (-4)$ |
| 206 | ÷ + × · recall H · grp,neg | 5 | 7.9 | 5.6–10.2 | $\left(-16 \div (-8) + 3\right) \times 3$ |
| 207 | + − ÷ · recall E · grp,dec | 9 | 7.9 | 7.6–8.8 | $\dfrac{18.6 + 1.4}{6 - 1}$ |
| 208 | − ^2 + · recall - · grp,neg | 28 | 7.9 | 5.5–10.3 | $\left(14 - (-5)\right)^{2} + 17$ |
| 209 | ^2 − × + · recall M · grp,neg | 9 | 7.9 | 6.1–9.3 | $(-5)^{2} + \left(-5 - (-3)\right) \times 5$ |
| 210 | ^2 ^2 × + · recall M · neg | 2 | 7.9 | 7.8–8.1 | $(-8)^{2} + 2 \times 3^{2}$ |
| 211 | + − × · recall X · grp | 12 | 8.0 | 6.7–9.2 | $\left(2 + 11\right) \times \left(11 - 3\right)$ |
| 212 | + √ + · recall - · grp,neg | 11 | 8.0 | 5.7–9.7 | $\sqrt{25 + 144} + (-7)$ |
| 213 | × ÷ · recall X | 20 | 8.1 | 7.7–8.7 | $28 \times 6 \div 7$ |
| 214 | + ^2 × + · recall M · grp,neg | 3 | 8.2 | 7.1–9.3 | $-4 + (-4) \times \left(-4 + 4\right)^{2}$ |
| 215 | + − × · recall H · grp,dec | 15 | 8.2 | 6.2–8.6 | $4 \times \left(\left(1.6 + 5\right) - 2\right)$ |
| 216 | + × − ÷ · recall M · grp | 33 | 8.3 | 6.9–9.6 | $\left(\left(9 + 1\right) \times 3 - 0\right) \div 5$ |
| 217 | − ÷ + · recall M · grp | 5 | 8.3 | 7.9–8.6 | $\dfrac{47 - 20}{9} + 12$ |
| 218 | ^3 + − · recall - · neg | 4 | 8.3 | 7–9.2 | $-10 + 3^{3} - (-16)$ |
| 219 | + ÷ + · recall M · grp | 19 | 8.4 | 7.4–9.6 | $\dfrac{8 + 16}{4} + 2$ |
| 220 | ^2 − ÷ · recall E · grp | 13 | 8.4 | 7.6–9.1 | $\dfrac{9^{2} - 73}{2}$ |
| 221 | + − ÷ · recall M · grp | 16 | 8.4 | 7.4–9.8 | $\dfrac{6 + 30}{10 - 6}$ |
| 222 | √ ^2 + · recall - · dec | 26 | 8.4 | 8.4–8.4 | $\sqrt{0.25} + 0.2^{2}$ |
| 223 | ^3 × · recall X · neg | 3 | 8.4 | 7.3–9.5 | $-3 \times 4^{3}$ |
| 224 | √ × − · recall H · dec | 13 | 8.5 | 8.2–8.7 | $3 \times 4.1 - \sqrt{0.36}$ |
| 225 | + × − ÷ · recall E · grp,neg | 4 | 8.5 | 7.9–9.4 | $\left(\left(9 + (-8)\right) \times 5 - (-7)\right) \div 4$ |
| 226 | + ÷ · recall M · grp,dec | 15 | 8.5 | 8.1–8.6 | $\dfrac{23.6 + 8.4}{4}$ |
| 227 | + ^2 ÷ · recall H · grp,neg | 4 | 8.6 | 8.3–8.8 | $\left(-1 + 9\right)^{2} \div 8$ |
| 228 | + ÷ + · recall E · grp,dec | 4 | 8.6 | 8.3–8.8 | $\dfrac{15 + 15}{3} + 5.7$ |
| 229 | − × + × · recall H · grp | 66 | 8.6 | 7.2–9.9 | $4 \times \left(9 + 2 \times \left(9 - 1\right)\right)$ |
| 230 | + ÷ + · recall E · grp,neg | 5 | 8.6 | 8.4–8.6 | $\dfrac{18 + 42}{6} + (-8)$ |
| 231 | ^3 × + · recall H · neg | 6 | 8.6 | 7.3–10 | $2^{3} + (-4) \times 9$ |
| 232 | × ÷ · recall M · grp | 2 | 8.7 | 8.4–8.9 | $\dfrac{12 \times 2}{4}$ |
| 233 | − ÷ + · recall E · grp,dec | 8 | 8.7 | 8.1–9.3 | $\dfrac{12.6 - 2.6}{2} + 17$ |
| 234 | ^2 ^2 × + · recall H | 15 | 8.7 | 6.4–10.2 | $9^{2} + 4 \times 5^{2}$ |
| 235 | ÷ ^2 × · recall H · grp,neg | 16 | 8.7 | 6.3–10.3 | $5 \times \left(35 \div (-7)\right)^{2}$ |
| 236 | ^2 ÷ + − · recall H | 2 | 8.8 | 8.4–9.1 | $20 + 13 - 9^{2} \div 9$ |
| 237 | + − ÷ · recall E · grp,neg | 9 | 8.8 | 7.9–9.6 | $\dfrac{-5 + 20}{7 - 4}$ |
| 238 | ^2 − × + · recall H · grp | 1 | 8.8 | 8.8–8.8 | $8^{2} + \left(15 - 4\right) \times 6$ |
| 239 | + − × · recall X · grp,neg,dec | 4 | 8.8 | 7–9.4 | $2.5 \times \left(\left(2 + 2.6\right) - 6\right)$ |
| 240 | + − × · recall H · grp,neg | 26 | 8.8 | 6.5–9.5 | $\left(-9 + 7\right) \times \left(9 - 2\right)$ |
| 241 | ^2 × + · recall X · neg | 12 | 8.9 | 6–11 | $-3 \times 6^{2} + (-18)$ |
| 242 | − × + × · recall M · grp,neg | 4 | 8.9 | 7.7–9.8 | $2 \times \left(-1 + 2 \times \left(8 - 3\right)\right)$ |
| 243 | × + ÷ · recall E · grp,neg | 1 | 8.9 | 8.9–8.9 | $\dfrac{-10 + 4 \times 5}{5}$ |
| 244 | + × − · recall X · grp,neg | 16 | 9.1 | 7.4–11.4 | $\left(-8 + (-7)\right) \times 8 - (-10)$ |
| 245 | + ÷ · recall H · grp,neg | 34 | 9.1 | 5.4–10.9 | $\left(-12 + 66\right) \div 6$ |
| 246 | ^3 × + · recall X · neg | 6 | 9.2 | 6.8–12 | $3^{3} + (-7) \times (-6)$ |
| 247 | − ÷ + · recall E · grp,neg | 2 | 9.3 | 8.9–9.6 | $\dfrac{29 - 14}{3} + (-19)$ |
| 248 | + × − ÷ · recall H · grp | 18 | 9.3 | 8.4–10.1 | $\left(\left(7 + 7\right) \times 3 - 27\right) \div 3$ |
| 249 | × + ÷ · recall M · grp | 7 | 9.3 | 8.4–10.1 | $\dfrac{28 + 2 \times 6}{5}$ |
| 250 | − ÷ + · recall H · grp | 9 | 9.3 | 8.9–9.6 | $\dfrac{61 - 13}{8} + 7$ |
| 251 | ^2 − ÷ · recall M · grp | 10 | 9.4 | 8.6–10.1 | $\dfrac{7^{2} - 25}{4}$ |
| 252 | ^2 ^2 + √ + · recall - · grp | 21 | 9.4 | 6.6–12.6 | $\sqrt{5^{2} + 12^{2}} + 17$ |
| 253 | + ^2 × + · recall H · grp,neg | 11 | 9.5 | 7.6–12.3 | $-2 + (-3) \times \left(1 + (-4)\right)^{2}$ |
| 254 | + ÷ + · recall H · grp | 7 | 9.6 | 8.9–10.1 | $\dfrac{42 + 30}{6} + 1$ |
| 255 | + √ × · recall H · grp | 10 | 9.6 | 7.2–10.2 | $5 \times \sqrt{25 + 144}$ |
| 256 | + − ÷ · recall M · grp,dec | 11 | 9.6 | 8.6–10.3 | $\dfrac{12.7 + 3.3}{7 - 5}$ |
| 257 | + ÷ + · recall M · grp,dec | 24 | 9.7 | 8.6–10.8 | $\dfrac{30 + 25}{5} + 6.4$ |
| 258 | √ × − · recall X · dec | 4 | 9.7 | 9.7–9.7 | $6 \times 4.1 - \sqrt{0.04}$ |
| 259 | ÷ ^2 × · recall X · grp,neg | 11 | 9.7 | 7.3–11.1 | $-4 \times \left(-32 \div 8\right)^{2}$ |
| 260 | ^2 − × + · recall H · grp,neg | 15 | 9.8 | 8.3–11.6 | $(-4)^{2} + \left(10 - 4\right) \times (-3)$ |
| 261 | + √ × · recall X · grp,dec | 8 | 9.8 | 8.2–12.2 | $3.5 \times \sqrt{25 + 144}$ |
| 262 | − ÷ + · recall M · grp,dec | 17 | 9.8 | 9.1–10.8 | $\dfrac{50.9 - 15.9}{7} + 14$ |
| 263 | + ÷ · recall X · grp,neg | 12 | 9.9 | 6.4–11.5 | $-54 \div \left(3 + 3\right)$ |
| 264 | ^2 ^2 × + · recall H · neg | 6 | 9.9 | 7.6–11.1 | $(-9)^{2} + 2 \times 5^{2}$ |
| 265 | ^2 ÷ + − · recall H · neg | 9 | 10.0 | 8.2–10.7 | $-17 + 19 - (-8)^{2} \div 4$ |
| 266 | + − × · recall X · grp,neg | 24 | 10.0 | 8.2–12.5 | $\left(-5 + (-6)\right) \times \left(-13 - 3\right)$ |
| 267 | × + ÷ · recall H · grp | 4 | 10.0 | 9.4–11.1 | $\dfrac{28 + 4 \times 2}{6}$ |
| 268 | + − × · recall X · grp,dec | 56 | 10.0 | 7.9–11.6 | $5 \times \left(\left(6.9 + 9\right) - 2\right)$ |
| 269 | + − ÷ · recall H · grp | 6 | 10.0 | 9.6–10.1 | $\dfrac{23 + 13}{14 - 8}$ |
| 270 | ^2 − ÷ · recall M · grp,neg | 6 | 10.1 | 10.1–10.1 | $\dfrac{4^{2} - (-8)}{6}$ |
| 271 | + ÷ + · recall M · grp,neg | 8 | 10.2 | 9.4–11.1 | $\dfrac{28 + 16}{4} + (-2)$ |
| 272 | + √ × · recall X · grp,neg | 6 | 10.3 | 8–11 | $-3 \times \sqrt{25 + 144}$ |
| 273 | + ÷ · recall H · grp,dec | 4 | 10.3 | 9.6–10.9 | $\dfrac{38.7 + 15.3}{6}$ |
| 274 | + − ÷ · recall M · grp,neg | 16 | 10.3 | 9.4–11.2 | $\dfrac{12 + (-37)}{13 - 8}$ |
| 275 | + × − ÷ · recall M · grp,dec | 1 | 10.3 | 10.3–10.3 | $\left(\left(2.4 + 5.6\right) \times 4 - 4\right) \div 4$ |
| 276 | × + ÷ · recall M · grp,neg | 19 | 10.3 | 9.2–11.3 | $\dfrac{40 + (-3) \times 4}{4}$ |
| 277 | + × − ÷ · recall M · grp,neg | 31 | 10.3 | 8.4–11.2 | $\left(\left(9 + (-5)\right) \times (-2) - (-26)\right) \div 2$ |
| 278 | + ÷ + · recall X · grp | 1 | 10.4 | 10.4–10.4 | $\dfrac{36 + 42}{6} + 4$ |
| 279 | − × + × · recall H · grp,dec | 2 | 10.4 | 9.9–10.9 | $4.3 \times \left(2.4 + 2.6 \times \left(6 - 5\right)\right)$ |
| 280 | × ÷ · recall H · grp | 10 | 10.4 | 9.4–11.4 | $\dfrac{18 \times 2}{3}$ |
| 281 | ^3 ^3 − · recall - · neg | 3 | 10.5 | 9.9–11.4 | $(-5)^{3} - (-3)^{3}$ |
| 282 | − ÷ + · recall M · grp,neg | 16 | 10.5 | 9.4–12 | $\dfrac{37 - 13}{8} + (-5)$ |
| 283 | × ÷ · recall H · grp,neg | 2 | 10.8 | 10.8–10.8 | $\dfrac{6 \times (-2)}{2}$ |
| 284 | + × − ÷ · recall H · grp,dec | 1 | 10.8 | 10.8–10.8 | $\left(\left(1.7 + 3\right) \times 5 - 15.5\right) \div 2$ |
| 285 | + ÷ + · recall H · grp,dec | 6 | 10.9 | 10.1–11.3 | $\dfrac{42 + 24}{6} + 10.3$ |
| 286 | + ÷ · recall X · grp,dec | 9 | 11.1 | 9.9–11.4 | $\dfrac{47.4 + 22.2}{8}$ |
| 287 | ^2 − ÷ · recall H · grp | 3 | 11.1 | 11.1–11.1 | $\dfrac{9^{2} - 27}{6}$ |
| 288 | + − ÷ · recall H · grp,neg | 8 | 11.2 | 10.4–12.2 | $\dfrac{-40 + (-5)}{7 - 2}$ |
| 289 | ^2 ^2 + √ + · recall - · grp,neg | 16 | 11.3 | 8.1–13.4 | $\sqrt{6^{2} + 8^{2}} + (-8)$ |
| 290 | + ^2 × + · recall X · grp,neg | 2 | 11.3 | 9.6–13.1 | $-2 + (-4) \times \left(3 + 2\right)^{2}$ |
| 291 | + ÷ + · recall H · grp,neg | 2 | 11.3 | 11.1–11.6 | $\dfrac{18 + 36}{6} + (-7)$ |
| 292 | − × + × · recall H · grp,neg | 24 | 11.4 | 9–13.2 | $4 \times \left(-4 + 3 \times \left(6 - (-2)\right)\right)$ |
| 293 | ^2 − ÷ · recall H · grp,neg | 2 | 11.5 | 11.1–11.9 | $\dfrac{7^{2} - (-5)}{6}$ |
| 294 | ^2 − × + · recall X · grp,neg | 12 | 11.6 | 8.6–13.8 | $(-3)^{2} + \left(15 - (-3)\right) \times (-6)$ |
| 295 | + ÷ + · recall X · grp,dec | 1 | 11.6 | 11.6–11.6 | $\dfrac{42 + 42}{6} + 6.1$ |
| 296 | + × − ÷ · recall X · grp,neg | 2 | 11.7 | 11.7–11.7 | $\left(\left(5 + 8\right) \times (-4) - (-73)\right) \div 3$ |
| 297 | × + ÷ · recall H · grp,neg | 23 | 11.7 | 10.2–12.5 | $\dfrac{-56 + 5 \times 4}{4}$ |
| 298 | + × − ÷ · recall H · grp,neg | 15 | 11.8 | 10.2–13.2 | $\left(\left(7 + 5\right) \times (-2) - (-56)\right) \div 4$ |
| 299 | ^2 ^2 × + · recall X · neg | 5 | 11.8 | 11.1–13 | $(-2)^{2} + (-4) \times (-4)^{2}$ |
| 300 | × + ÷ · recall H · grp,dec | 13 | 11.8 | 10.1–14.4 | $\dfrac{18.6 + 2.1 \times 4}{3}$ |
| 301 | × ÷ · recall X · grp | 11 | 12.0 | 11.4–12.4 | $\dfrac{30 \times 9}{6}$ |
| 302 | + − ÷ · recall X · grp,neg | 1 | 12.0 | 12–12 | $\dfrac{43 + (-91)}{7 - 1}$ |
| 303 | + − ÷ · recall H · grp,dec | 6 | 12.1 | 11.4–13.1 | $\dfrac{1 + 15.5}{12 - 7}$ |
| 304 | − ÷ + · recall H · grp,dec | 10 | 12.2 | 10.1–13.6 | $\dfrac{66 - 10}{7} + 3.6$ |
| 305 | − ÷ + · recall H · grp,neg | 20 | 12.3 | 10.4–13 | $\dfrac{-11 - 7}{6} + 10$ |
| 306 | + × − ÷ · recall X · grp,dec | 42 | 12.5 | 11.3–14.8 | $\left(\left(9 + 6.1\right) \times 4 - 28.4\right) \div 4$ |
| 307 | + − ÷ · recall X · grp,dec | 6 | 12.6 | 11.9–13.1 | $\dfrac{4 + 8.4}{10 - 8}$ |
| 308 | × ÷ · recall X · grp,neg | 11 | 12.8 | 10.3–14.8 | $\dfrac{14 \times (-2)}{7}$ |
| 309 | ^2 − ÷ · recall H · grp,dec | 3 | 12.9 | 12.6–13.4 | $\dfrac{4^{2} - 6.7}{3}$ |
| 310 | − × + × · recall X · grp,neg | 43 | 12.9 | 8.5–15.3 | $3 \times \left(7 + 4 \times \left(-7 - 2\right)\right)$ |
| 311 | − ÷ + · recall X · grp,dec | 13 | 13.1 | 11.1–13.6 | $\dfrac{68.3 - 17}{9} + 12.7$ |
| 312 | ^2 − ÷ · recall X · grp,dec | 7 | 13.4 | 13.4–13.4 | $\dfrac{9^{2} - 70.2}{2}$ |
| 313 | − ÷ + · recall X · grp,neg | 6 | 13.7 | 13.5–14 | $\dfrac{-82 - (-18)}{8} + 10$ |
| 314 | × + ÷ · recall X · grp,dec | 14 | 13.7 | 12.4–15.4 | $\dfrac{3.1 + 3.7 \times 5}{6}$ |
| 315 | × + ÷ · recall X · grp,neg | 4 | 13.8 | 13.3–14.3 | $\dfrac{-28 + 2 \times (-4)}{6}$ |
| 316 | ^2 ^2 + √ + · recall - · grp,dec | 26 | 14.0 | 11.3–15 | $\sqrt{0.5^{2} + 1.2^{2}} + 12$ |
| 317 | − × + × · recall X · grp,dec | 68 | 14.1 | 9.2–16.1 | $4 \times \left(5.2 + 3 \times \left(6.3 - 1\right)\right)$ |
| 318 | × ÷ · recall X · grp,dec | 15 | 14.3 | 12.7–15.2 | $\dfrac{24 \times 3.7}{6}$ |
