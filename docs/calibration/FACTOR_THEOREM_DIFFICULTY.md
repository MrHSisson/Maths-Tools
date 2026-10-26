# Factor Theorem — difficulty calibration

Generated from **9000** questions — each sub-tool × level sampled across random combinations of ALL its Question Options. Regenerate: `CALIBRATE=1 npx vitest run src/tests/factorTheoremDifficulty.test.ts`.

## How a question is scored

The raw score is the work the question asks for, added up — **not** a weight on the option that produced it. Higher = harder.

| Piece | Cost |
|---|---|
| Start | 0.5 |
| Each step of the working | 0.35 |
| Size of the numbers | 1 × log₁₀(biggest number in the question + 1) |
| What is asked | is it a factor 0 · factorise 1 · show the factor then solve 1.5 · find an unknown 2 · find a factor then factorise 2.5 · only one real root 2.5 · find a factor then solve 3 · exact (surd) roots 3 · two unknowns 3.5 · a factor with k 3.5 · quartic 4 · a factor with a 4 |

## The eight bands

A worksheet is ordered by **band** (1 easiest … 8 hardest); questions in a band mingle in random order. Bands are relative to the sub-tool + level: the cut points are the 12.5% … 87.5% quantiles of what that level can generate.

| Sub-tool · level | n | Cut points | Share per band (1 … 8) | Min | Median | Max |
|---|---|---|---|---|---|---|
| y12:level1 | 1500 | 2.5 · 2.7 · 2.9 · 3.2 · 3.5 · 3.7 · 3.9 | 10% 10% 15% 14% 11% 9% 14% 17% | 2.2 | 3.2 | 4.2 |
| y12:level2 | 1500 | 5.4 · 5.8 · 6.1 · 6.3 · 6.7 · 7 · 7.4 | 11% 10% 14% 12% 14% 11% 14% 13% | 4.2 | 6.3 | 8.4 |
| y12:level3 | 1500 | 6.1 · 6.4 · 6.7 · 6.9 · 7.8 · 8.2 · 10 | 8% 14% 14% 11% 15% 11% 13% 14% | 5.5 | 6.9 | 10.4 |
| y13:level1 | 1500 | 3 · 3.2 · 3.3 · 3.5 · 3.6 · 3.9 · 4 | 9% 10% 11% 19% 8% 16% 9% 17% | 2.2 | 3.5 | 4.2 |
| y13:level2 | 1500 | 5.4 · 5.8 · 6.1 · 6.2 · 6.4 · 6.5 · 6.7 | 10% 14% 12% 6% 16% 10% 19% 13% | 4.2 | 6.2 | 6.9 |
| y13:level3 | 1500 | 6.7 · 6.9 · 7.1 · 7.5 · 8.1 · 8.6 · 10.4 | 9% 12% 11% 17% 11% 14% 11% 14% | 6.2 | 7.5 | 11 |

## Categories, easiest to hardest (22 found)

A category is a coarse fingerprint of the question's structure; within it the score still varies with the actual numbers.

| # | Category | n | Mean | Range | Bands (level:band) | Example |
|---|---|---|---|---|---|---|
| 1 | y12 · y12 · decide | 764 | 2.7 | 2.2–3.2 | L1:1 L1:2 L1:3 L1:4 L1:5 | $$ |
| 2 | y13 · y13 · decide | 786 | 3.2 | 2.2–3.5 | L1:1 L1:2 L1:3 L1:4 L1:5 | $$ |
| 3 | y12 · y12 · factorise | 736 | 3.7 | 3.2–4.2 | L1:5 L1:6 L1:7 L1:8 | $$ |
| 4 | y13 · y13 · factorise | 714 | 3.8 | 3.2–4.2 | L1:3 L1:4 L1:5 L1:6 L1:7 L1:8 | $$ |
| 5 | y12 · y12 · findUnknown | 326 | 5.5 | 4.2–6.6 | L2:1 L2:2 L2:3 L2:4 L2:5 | $$ |
| 6 | y13 · y13 · findUnknown | 715 | 5.9 | 4.2–6.9 | L2:1 L2:2 L2:3 L2:4 L2:5 L2:6 L2:7 L2:8 | $$ |
| 7 | y12 · y12 · showSolve | 286 | 5.9 | 5.1–6.4 | L2:1 L2:2 L2:3 L2:4 L2:5 | $$ |
| 8 | y12 · y12 · paramK | 288 | 6.0 | 5.5–6.4 | L3:1 L3:2 L3:3 | $$ |
| 9 | y12 · y12 · trialFactorise | 280 | 6.2 | 5.4–6.7 | L2:2 L2:3 L2:4 L2:5 L2:6 | $$ |
| 10 | y13 · y13 · showSolve | 785 | 6.3 | 5.1–6.8 | L2:1 L2:2 L2:3 L2:4 L2:5 L2:6 L2:7 L2:8 | $$ |
| 11 | y12 · y12 · oneReal | 283 | 6.6 | 6.1–7 | L3:2 L3:3 L3:4 L3:5 | $$ |
| 12 | y13 · y13 · surd | 281 | 6.7 | 6.3–7 | L3:1 L3:2 L3:3 | $$ |
| 13 | y12 · y12 · surd | 298 | 6.7 | 6.2–7.1 | L3:2 L3:3 L3:4 L3:5 | $$ |
| 14 | y12 · y12 · trialSolve | 312 | 7.0 | 6.2–7.6 | L2:4 L2:5 L2:6 L2:7 L2:8 | $$ |
| 15 | y13 · y13 · oneReal | 237 | 7.0 | 6.2–7.5 | L3:1 L3:2 L3:3 L3:4 L3:5 | $$ |
| 16 | y13 · y13 · trialSolve | 231 | 7.1 | 6.2–7.7 | L3:1 L3:2 L3:3 L3:4 L3:5 | $$ |
| 17 | y12 · y12 · twoUnknowns | 296 | 7.4 | 6.7–8.4 | L2:6 L2:7 L2:8 | $$ |
| 18 | y13 · y13 · twoUnknowns | 235 | 7.9 | 6.8–8.9 | L3:2 L3:3 L3:4 L3:5 L3:6 L3:7 | $$ |
| 19 | y12 · y12 · paramA | 329 | 8.0 | 7.6–8.6 | L3:5 L3:6 L3:7 | $$ |
| 20 | y13 · y13 · paramA | 243 | 8.4 | 7.9–8.8 | L3:5 L3:6 L3:7 | $$ |
| 21 | y12 · y12 · quartic | 302 | 10.0 | 9.2–10.4 | L3:7 L3:8 | $$ |
| 22 | y13 · y13 · quartic | 273 | 10.6 | 9.7–11 | L3:7 L3:8 | $$ |
