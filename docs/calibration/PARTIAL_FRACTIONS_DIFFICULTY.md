# Partial Fractions — difficulty calibration

Generated from **13500** questions — each sub-tool × level sampled across random combinations of ALL its Question Options. Regenerate: `CALIBRATE=1 npx vitest run src/tests/partialFractionsDifficulty.test.ts`.

## How a question is scored

The raw score is the work the question asks for, added up — **not** a weight on the option that produced it. Higher = harder.

| Piece | Cost |
|---|---|
| Start | 1 |
| Each partial fraction to find | 1 |
| A repeated factor | +1.5 |
| Each factor with a coefficient on x (px + q) | +0.8 |
| A negative x term (a − bx) | +0.8 |
| Fractional constants | +1.2 |
| Denominator shown expanded | +0.7 |
| A division first | +1.5, +0.5 per extra term of the quotient |
| Size of the numbers | 0.8 × log₁₀(biggest coefficient + 1) |

## The eight bands

A worksheet is ordered by **band** (1 easiest … 8 hardest); questions in a band mingle in random order. Bands are relative to the sub-tool + level: the cut points are the 12.5% … 87.5% quantiles of what that level can generate.

| Sub-tool · level | n | Cut points | Share per band (1 … 8) | Min | Median | Max |
|---|---|---|---|---|---|---|
| two:level1 | 1500 | 3.8 · 4.2 · 4.5 · 4.8 · 4.9 · 5.3 · 5.5 | 10% 15% 10% 15% 15% 10% 3% 22% | 3.2 | 4.8 | 5.6 |
| two:level2 | 1500 | 4.7 · 5.2 · 5.5 · 5.6 · 6.2 · 6.4 · 7.1 | 11% 14% 8% 7% 20% 11% 17% 13% | 3.4 | 5.6 | 8 |
| two:level3 | 1500 | 5.5 · 5.9 · 6.2 · 6.7 · 7.1 · 7.7 · 7.9 | 12% 10% 12% 13% 12% 13% 12% 15% | 4.7 | 6.7 | 8.7 |
| three:level1 | 1500 | 5.1 · 5.4 · 5.8 · 5.9 · 6 · 6.1 · 6.6 | 8% 13% 14% 16% 15% 5% 17% 13% | 4.5 | 5.8 | 6.6 |
| three:level2 | 1500 | 5.8 · 5.9 · 6.4 · 6.6 · 6.7 · 7.2 · 7.4 | 12% 6% 19% 7% 13% 17% 9% 17% | 4.6 | 6.6 | 8.2 |
| three:level3 | 1500 | 7.2 · 7.4 · 7.7 · 8.1 · 8.2 · 8.5 · 8.9 | 12% 10% 15% 13% 12% 14% 11% 14% | 6.1 | 8.1 | 9.7 |
| divide:level1 | 1500 | 5.5 · 5.8 · 6.1 · 6.4 · 6.6 · 7 · 7.3 | 10% 12% 12% 12% 12% 16% 11% 15% | 4.9 | 6.4 | 7.8 |
| divide:level2 | 1500 | 5.8 · 6.2 · 6.4 · 6.7 · 7 · 7.3 · 7.6 | 10% 15% 9% 13% 15% 13% 11% 15% | 5 | 6.7 | 8.3 |
| divide:level3 | 1500 | 7.2 · 7.5 · 8 · 8.4 · 8.7 · 9.2 · 9.6 | 12% 10% 15% 13% 12% 13% 12% 14% | 6.4 | 8.4 | 10.8 |

## Categories, easiest to hardest (36 found)

A category is a coarse fingerprint of the question's structure; within it the score still varies with the actual numbers.

| # | Category | n | Mean | Range | Bands (level:band) | Example |
|---|---|---|---|---|---|---|
| 1 | two · two · 2 fractions | 915 | 4.2 | 3.2–5.1 | L1:1 L1:2 L1:3 L1:4 L1:5 L1:6 L2:1 L2:2 | $\dfrac{x - 9}{(x - 4)(x + 1)}$ |
| 2 | two · two · 2 fractions · a−bx | 49 | 5.2 | 4.5–5.8 | L2:1 L2:2 L2:3 L2:4 L2:5 | $\dfrac{8x - 6}{-x^{2} + 9}$ |
| 3 | two · two · 2 fractions · fractions | 935 | 5.2 | 4.6–5.6 | L1:4 L1:5 L1:6 L1:7 L1:8 L2:1 L2:2 L2:3 L2:4 L2:5 | $\dfrac{x - 3}{(x + 3)(x - 2)}$ |
| 4 | three · three · 3 fractions | 1037 | 5.5 | 4.5–6.1 | L1:1 L1:2 L1:3 L1:4 L1:5 L1:6 L1:7 L2:1 L2:2 L2:3 | $\dfrac{9x^{2} + 30x - 43}{x^{3} + 3x^{2} - 13x - 15}$ |
| 5 | two · two · 2 fractions · px+q | 396 | 5.6 | 4.2–6.7 | L2:1 L2:2 L2:3 L2:4 L2:5 L2:6 L2:7 | $\dfrac{13x + 26}{(x + 6)(2x - 1)}$ |
| 6 | two · two · 2 fractions · repeated | 500 | 5.6 | 4.7–6.4 | L3:1 L3:2 L3:3 L3:4 | $\dfrac{5x + 29}{(x + 6)^{2}}$ |
| 7 | two · two · 2 fractions · a−bx · fractions | 52 | 6.0 | 5.4–6.4 | L2:3 L2:4 L2:5 L2:6 L2:7 | $\dfrac{-2x + 3}{-x^{2} + 7x - 10}$ |
| 8 | divide · divide · 2 fractions · divide first | 1499 | 6.0 | 4.9–7.1 | L1:1 L1:2 L1:3 L1:4 L1:5 L1:6 L2:1 L2:2 L2:3 L2:4 L2:5 L2:6 | $\dfrac{-x^{2} - 3x + 32}{x^{2} + 5x - 6}$ |
| 9 | two · two · 2 fractions · px+q · a−bx | 144 | 6.1 | 5.2–7.3 | L2:3 L2:4 L2:5 L2:6 L2:7 L2:8 | $\dfrac{19x + 21}{-4x^{2} + 21x + 18}$ |
| 10 | three · three · 3 fractions · fractions | 978 | 6.2 | 5.6–6.6 | L1:3 L1:4 L1:5 L1:7 L1:8 L2:1 L2:2 L2:3 L2:4 L2:5 | $\dfrac{x^{2} + 4x - 6}{x^{3} - 4x^{2} + 3x}$ |
| 11 | three · three · 3 fractions · px+q | 244 | 6.4 | 5.3–6.9 | L2:1 L2:2 L2:3 L2:4 L2:5 L2:6 | $\dfrac{7x^{2} + 19x + 14}{3x^{3} + 11x^{2} - 40x + 12}$ |
| 12 | three · three · 3 fractions · a−bx | 87 | 6.4 | 5.5–6.9 | L2:1 L2:2 L2:3 L2:4 L2:5 L2:6 | $\dfrac{2x^{2} + 5x + 47}{-x^{3} - 4x^{2} + 11x + 30}$ |
| 13 | two · two · 2 fractions · px+q · fractions | 390 | 6.4 | 5.4–7.2 | L2:3 L2:4 L2:5 L2:6 L2:7 L2:8 | $\dfrac{-x - 3}{(2x - 3)(2x - 1)}$ |
| 14 | two · two · 2 fractions · repeated · px+q | 231 | 6.5 | 5.7–7.2 | L3:2 L3:3 L3:4 L3:5 L3:6 | $\dfrac{8x - 9}{(4x - 5)^{2}}$ |
| 15 | two · two · 2 fractions · repeated · a−bx | 136 | 6.5 | 5.7–7.2 | L3:2 L3:3 L3:4 L3:5 L3:6 | $\dfrac{2x - 7}{x^{2} - 8x + 16}$ |
| 16 | three · three · 3 fractions · repeated | 261 | 7.0 | 6.1–7.6 | L3:1 L3:2 L3:3 | $\dfrac{2x^{2} + x - 17}{x^{3} + 4x^{2} - 11x + 6}$ |
| 17 | three · three · 3 fractions · px+q · fractions | 234 | 7.0 | 6.4–7.4 | L2:4 L2:5 L2:6 L2:7 L2:8 | $\dfrac{3x^{2} + 5x + 5}{4x^{3} - 15x^{2} - 24x - 5}$ |
| 18 | three · three · 3 fractions · a−bx · fractions | 157 | 7.0 | 6.5–7.4 | L2:4 L2:5 L2:6 L2:7 L2:8 | $\dfrac{x^{2} - 5x - 4}{-x^{3} + 12x^{2} - 41x + 30}$ |
| 19 | two · two · 2 fractions · px+q · a−bx · fractions | 119 | 7.1 | 6.2–8 | L2:6 L2:7 L2:8 | $\dfrac{-4x - 4}{(x + 4)(1 - 2x)}$ |
| 20 | divide · divide · 2 fractions · divide first · fractions | 1501 | 7.1 | 6.1–8.3 | L1:4 L1:5 L1:6 L1:7 L1:8 L2:2 L2:3 L2:4 L2:5 L2:6 L2:7 L2:8 | $\dfrac{x^{2} + x - 26}{(x - 6)(x + 4)}$ |
| 21 | three · three · 3 fractions · px+q · a−bx | 148 | 7.2 | 6.2–7.7 | L2:3 L2:4 L2:5 L2:6 L2:7 L2:8 | $\dfrac{21x^{2} + 34x - 35}{(1 - 3x)(x + 5)(x + 1)}$ |
| 22 | two · two · 2 fractions · repeated · px+q · a−bx | 119 | 7.2 | 6.6–8 | L3:4 L3:5 L3:6 L3:7 L3:8 | $\dfrac{-4x + 5}{(3 - 2x)^{2}}$ |
| 23 | divide · divide · 3 fractions · divide first | 500 | 7.3 | 6.4–8.1 | L3:1 L3:2 L3:3 L3:4 | $\dfrac{x^{4} + 9x^{3} + 24x^{2} + 3x - 57}{(x + 3)(x + 4)(x - 1)}$ |
| 24 | two · two · 2 fractions · repeated · px+q · fractions | 273 | 7.4 | 6.9–7.9 | L3:5 L3:6 L3:7 L3:8 | $\dfrac{2x - 6}{16x^{2} - 40x + 25}$ |
| 25 | three · three · 3 fractions · repeated · fractions | 242 | 7.7 | 7.2–8.1 | L3:2 L3:3 L3:4 L3:5 | $\dfrac{5x^{2} + 5x - 1}{x^{3} + 3x^{2} - 9x + 5}$ |
| 26 | three · three · 3 fractions · repeated · a−bx | 124 | 7.8 | 6.9–8.4 | L3:1 L3:2 L3:3 L3:4 L3:5 L3:6 | $\dfrac{7x - 22}{x^{3} - 14x^{2} + 64x - 96}$ |
| 27 | three · three · 3 fractions · px+q · a−bx · fractions | 115 | 7.8 | 7.2–8.2 | L2:7 L2:8 | $\dfrac{-x^{2} - 4x}{(2 - 3x)(x - 3)(x - 1)}$ |
| 28 | three · three · 3 fractions · repeated · px+q | 248 | 7.8 | 6.8–8.4 | L3:1 L3:2 L3:3 L3:4 L3:5 L3:6 | $\dfrac{9x^{2} - 30x + 36}{(x - 3)^{2}(2x + 3)}$ |
| 29 | two · two · 2 fractions · repeated · px+q · a−bx · fractions | 241 | 8.2 | 7.7–8.7 | L3:7 L3:8 | $\dfrac{x - 4}{4x^{2} - 20x + 25}$ |
| 30 | divide · divide · 3 fractions · divide first · fractions | 501 | 8.4 | 7.1–9.3 | L3:1 L3:2 L3:3 L3:4 L3:5 L3:6 L3:7 | $\dfrac{x^{3} + 6x^{2} + 8x - 5}{(x + 4)(x - 1)(x + 2)}$ |
| 31 | three · three · 3 fractions · repeated · px+q · fractions | 239 | 8.5 | 7.9–8.9 | L3:4 L3:5 L3:6 L3:7 L3:8 | $\dfrac{6x^{2} + 4x - 5}{(x - 5)^{2}(4x - 5)}$ |
| 32 | three · three · 3 fractions · repeated · a−bx · fractions | 151 | 8.5 | 7.9–8.9 | L3:4 L3:5 L3:6 L3:7 L3:8 | $\dfrac{2x^{2} - 2x - 3}{x^{3} - 6x^{2} + 9x - 4}$ |
| 33 | three · three · 3 fractions · repeated · px+q · a−bx | 127 | 8.6 | 7.7–9.2 | L3:4 L3:5 L3:6 L3:7 L3:8 | $\dfrac{42x^{2} - 42x + 20}{9x^{3} + 39x^{2} - 29x + 5}$ |
| 34 | divide · divide · 3 fractions · repeated · divide first | 267 | 9.0 | 8–9.6 | L3:4 L3:5 L3:6 L3:7 L3:8 | $\dfrac{-3x^{4} + x^{3} + 7x^{2} - 15}{(x + 1)^{2}(x - 2)}$ |
| 35 | three · three · 3 fractions · repeated · px+q · a−bx · fractions | 108 | 9.2 | 8.7–9.7 | L3:7 L3:8 | $\dfrac{-x^{2} - 2x + 5}{4x^{3} - 12x^{2} + 9x - 2}$ |
| 36 | divide · divide · 3 fractions · repeated · divide first · fractions | 232 | 10.0 | 9.1–10.8 | L3:6 L3:7 L3:8 | $\dfrac{x^{4} + 8x^{3} + 23x^{2} + 24x + 3}{(x + 3)^{2}(x + 1)}$ |
