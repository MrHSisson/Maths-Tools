# Indices — difficulty calibration

Generated from **27000** questions — each sub-tool × level sampled across random combinations of ALL its Question Options. Regenerate: `CALIBRATE=1 npx vitest run src/tests/indicesDifficulty.test.ts`.

## How a question is scored

The raw score is the work the question asks for, added up — **not** a weight on the option that produced it. Higher = harder.

| Piece | Cost |
|---|---|
| Start | 0.5 |
| Each step of the working | 0.35 |
| Size of the numbers | 1 × log₁₀(biggest number in the question + 1) |
| Roots | 0.8 each (up to 2) |
| A negative index | +1 |
| Fractions | +0.9 |
| Brackets | 0.5 each (up to 3) |
| Letters | 0.4 per different letter (up to 3) |

## The eight bands

A worksheet is ordered by **band** (1 easiest … 8 hardest); questions in a band mingle in random order. Bands are relative to the sub-tool + level: the cut points are the 12.5% … 87.5% quantiles of what that level can generate.

| Sub-tool · level | n | Cut points | Share per band (1 … 8) | Min | Median | Max |
|---|---|---|---|---|---|---|
| powersRoots:level1 | 1500 | 2.7 · 3 · 3.3 · 3.5 · 4.1 · 5 · 5.4 | 4% 20% 11% 12% 13% 13% 12% 15% | 2.5 | 3.5 | 6.2 |
| powersRoots:level2 | 1500 | 3.2 · 3.8 · 4.1 · 4.2 · 4.3 · 4.5 · 5.4 | 12% 11% 12% 8% 10% 17% 13% 16% | 2.6 | 4.2 | 6.3 |
| powersRoots:level3 | 1500 | 3.6 · 4.4 · 4.7 · 5.1 · 5.6 · 5.8 · 6.2 | 12% 12% 13% 12% 11% 11% 15% 14% | 3 | 5.1 | 7.5 |
| writingIndices:level1 | 1500 | 3.4 · 3.6 · 3.7 · 3.8 · 3.9 · 4 · 4.1 | 7% 16% 21% 14% 3% 10% 12% 16% | 2.9 | 3.7 | 4.4 |
| writingIndices:level2 | 1500 | 3.6 · 3.7 · 3.8 · 3.9 · 4 · 4.1 · 4.2 | 10% 28% 15% 9% 4% 13% 9% 13% | 3.4 | 3.7 | 4.4 |
| writingIndices:level3 | 1500 | 3.6 · 4 · 4.4 · 4.5 · 4.6 · 4.7 · 4.8 | 5% 18% 12% 12% 6% 18% 10% 19% | 3.5 | 4.5 | 5.3 |
| indexLaws:level1 | 1500 | 3 · 3.1 · 3.2 · 3.7 · 3.9 · 4.1 · 4.2 | 5% 13% 24% 8% 1% 23% 14% 12% | 2.7 | 3.7 | 4.3 |
| indexLaws:level2 | 1500 | 3.3 · 3.4 · 3.5 · 3.6 · 3.7 · 3.9 · 4.1 | 12% 5% 16% 14% 13% 13% 6% 19% | 3 | 3.6 | 4.3 |
| indexLaws:level3 | 1500 | 3.2 · 3.3 · 3.4 · 3.5 · 3.6 · 3.7 · 3.8 | 9% 29% 9% 11% 13% 19% 1% 10% | 3 | 3.4 | 4.4 |
| specialPowers:level1 | 1500 | 2.9 · 3.2 · 3.6 · 3.9 · 4.1 · 4.3 · 4.6 | 12% 13% 12% 10% 11% 16% 10% 16% | 2.1 | 3.9 | 5.8 |
| specialPowers:level2 | 1500 | 3.7 · 3.9 · 4.1 · 4.4 · 4.6 · 4.9 · 5 | 8% 14% 5% 21% 11% 13% 10% 16% | 2.7 | 4.4 | 5.6 |
| specialPowers:level3 | 1500 | 3.8 · 4.1 · 4.2 · 4.4 · 4.7 · 4.9 · 5 | 5% 15% 12% 12% 16% 14% 9% 17% | 2.7 | 4.4 | 5.6 |
| fractionalIndices:level1 | 1500 | 3.6 · 3.7 · 3.8 · 3.9 · 4 · 4.1 · 4.4 | 10% 36% 12% 3% 5% 0% 18% 15% | 2.5 | 3.7 | 5 |
| fractionalIndices:level2 | 1500 | 3.7 · 3.8 · 4 · 4.4 · 5 · 5.2 · 5.6 | 12% 7% 15% 15% 13% 8% 14% 17% | 2.5 | 4.4 | 5.7 |
| fractionalIndices:level3 | 1500 | 3.6 · 3.9 · 4.6 · 4.8 · 5.2 · 6.3 · 6.7 | 5% 18% 12% 14% 11% 15% 13% 13% | 2.5 | 4.8 | 7.1 |
| commonBase:level1 | 1500 | 3.6 · 3.8 · 4.2 · 4.4 · 4.9 · 5.2 · 5.8 | 11% 13% 13% 12% 12% 9% 9% 20% | 3.1 | 4.4 | 7.4 |
| commonBase:level2 | 1500 | 3.7 · 3.9 · 4.2 · 4.7 · 4.9 · 5.8 · 6.2 | 8% 15% 7% 19% 3% 22% 13% 13% | 3.1 | 4.7 | 8.8 |
| commonBase:level3 | 1500 | 3.4 · 3.7 · 3.9 · 4 · 4.5 · 5.9 · 6.2 | 12% 12% 12% 2% 23% 14% 12% 13% | 2.9 | 4 | 7.4 |

## Categories, easiest to hardest (37 found)

A category is a coarse fingerprint of the question's structure; within it the score still varies with the actual numbers.

| # | Category | n | Mean | Range | Bands (level:band) | Example |
|---|---|---|---|---|---|---|
| 1 | fractionalIndices · fractionalIndices · letters | 64 | 2.8 | 2.5–3.4 | L1:1 L2:1 L3:1 | $$ |
| 2 | specialPowers · specialPowers · letters | 563 | 2.9 | 2.1–3.4 | L1:1 L1:2 L1:3 L2:1 L3:1 | $$ |
| 3 | powersRoots · powersRoots · letters | 717 | 3.0 | 2.5–4.4 | L1:1 L1:2 L1:3 L1:4 L1:5 L2:1 L2:2 L2:6 | $$ |
| 4 | powersRoots · powersRoots · brackets · letters | 632 | 3.3 | 2.6–3.7 | L1:3 L1:4 L1:5 L2:1 L3:1 L3:2 | $$ |
| 5 | indexLaws · indexLaws · letters | 2521 | 3.3 | 2.7–4 | L1:1 L1:2 L1:3 L1:4 L2:1 L2:2 L2:3 L2:4 L2:5 L2:6 L2:7 L3:1 L3:2 L3:3 L3:4 L3:5 L3:6 L3:7 L3:8 | $$ |
| 6 | fractionalIndices · fractionalIndices · negative index · letters | 42 | 3.5 | 3.5–3.5 | L1:1 L3:1 | $$ |
| 7 | specialPowers · specialPowers · brackets · letters | 267 | 3.5 | 3–3.9 | L1:2 L1:3 L1:4 L2:1 L2:2 L2:3 L3:1 L3:2 | $$ |
| 8 | writingIndices · writingIndices · roots · letters | 760 | 3.5 | 2.9–3.9 | L1:1 L1:2 L1:3 L1:4 L1:5 L1:6 L2:1 L2:2 L2:3 L2:4 L2:5 L3:1 L3:2 | $$ |
| 9 | writingIndices · writingIndices · fractions · letters | 1691 | 3.7 | 3.3–4 | L1:1 L1:2 L1:3 L1:4 L1:5 L1:6 L1:7 L2:1 L2:2 L2:3 L2:4 L2:5 L2:6 L3:2 L3:3 | $$ |
| 10 | indexLaws · indexLaws · brackets · letters | 1107 | 3.7 | 3.4–4.3 | L1:5 L1:6 L1:7 L1:8 L2:3 L2:4 L2:5 L2:6 L3:4 L3:5 L3:6 | $$ |
| 11 | fractionalIndices · fractionalIndices · fractions · letters | 2082 | 3.7 | 3.4–4.4 | L1:1 L1:2 L1:3 L1:4 L1:5 L1:6 L2:1 L2:2 L2:3 L2:4 L2:5 L3:1 L3:2 L3:3 | $$ |
| 12 | specialPowers · specialPowers · negative index · letters | 1353 | 4.1 | 3.5–5 | L1:3 L1:4 L1:5 L1:6 L1:7 L2:2 L2:3 L2:4 L2:5 L2:6 L3:1 L3:2 L3:3 L3:4 L3:5 L3:6 L3:7 L3:8 | $$ |
| 13 | writingIndices · writingIndices · roots · brackets · letters | 385 | 4.1 | 4–4.4 | L2:6 L2:7 L2:8 L3:3 L3:4 | $$ |
| 14 | writingIndices · writingIndices · negative index · letters | 683 | 4.1 | 3.7–4.4 | L1:4 L1:6 L1:7 L1:8 L2:5 L2:6 L2:7 L2:8 | $$ |
| 15 | indexLaws · indexLaws · fractions · letters | 872 | 4.1 | 3.8–4.4 | L1:5 L1:6 L1:7 L1:8 L2:6 L2:7 L2:8 L3:8 | $$ |
| 16 | powersRoots · powersRoots · negative index · letters | 153 | 4.2 | 3.9–4.4 | L2:3 L2:4 L2:5 L2:6 | $$ |
| 17 | commonBase · commonBase · fractions · letters | 202 | 4.3 | 3.4–6 | L2:1 L2:2 L2:3 L2:4 L2:6 L2:7 | $$ |
| 18 | specialPowers · specialPowers · fractions · letters | 772 | 4.3 | 3.4–5.2 | L1:3 L1:4 L1:5 L1:6 L1:7 L1:8 L2:2 L2:3 L2:4 L2:5 L2:6 L2:7 L2:8 L3:2 L3:3 L3:4 L3:5 L3:6 L3:7 L3:8 | $$ |
| 19 | powersRoots · powersRoots · negative index · brackets · letters | 174 | 4.4 | 4.2–4.5 | L2:5 L2:6 L2:7 | $$ |
| 20 | writingIndices · writingIndices · roots · fractions · letters | 334 | 4.5 | 4.1–4.8 | L3:3 L3:4 L3:5 L3:6 L3:7 L3:8 | $$ |
| 21 | powersRoots · powersRoots · fractions · brackets · letters | 739 | 4.5 | 3.9–6.2 | L1:5 L1:6 L2:3 L2:4 L2:5 L2:6 L3:2 L3:3 L3:4 L3:5 L3:6 L3:7 L3:8 | $$ |
| 22 | commonBase · commonBase · letters | 3925 | 4.6 | 2.9–8.8 | L1:1 L1:2 L1:3 L1:4 L1:5 L1:6 L1:7 L1:8 L2:1 L2:2 L2:3 L2:4 L2:5 L2:6 L2:7 L2:8 L3:1 L3:2 L3:3 L3:4 L3:5 L3:6 L3:7 L3:8 | $$ |
| 23 | powersRoots · powersRoots · fractions · letters | 730 | 4.6 | 3.6–6.3 | L2:3 L2:4 L2:6 L2:7 L2:8 L3:2 L3:3 L3:4 L3:5 L3:6 L3:7 | $$ |
| 24 | fractionalIndices · fractionalIndices · negative index · fractions · letters | 537 | 4.6 | 4.4–5 | L1:8 L3:3 L3:4 L3:5 | $$ |
| 25 | writingIndices · writingIndices · negative index · fractions · letters | 508 | 4.7 | 4.4–5 | L3:4 L3:6 L3:7 L3:8 | $$ |
| 26 | specialPowers · specialPowers · negative index · brackets · letters | 985 | 4.8 | 3.9–5.3 | L1:5 L1:6 L1:7 L1:8 L2:5 L2:6 L2:7 L2:8 L3:5 L3:6 L3:7 L3:8 | $$ |
| 27 | fractionalIndices · fractionalIndices · fractions · brackets · letters | 1265 | 4.9 | 3.9–5.7 | L1:5 L1:7 L2:5 L2:6 L2:7 L2:8 L3:3 L3:4 L3:5 L3:6 | $$ |
| 28 | specialPowers · specialPowers · fractions · brackets · letters | 389 | 4.9 | 4.3–5.5 | L1:7 L1:8 L2:6 L2:7 L2:8 L3:5 L3:6 L3:7 L3:8 | $$ |
| 29 | writingIndices · writingIndices · roots · fractions · brackets · letters | 139 | 5.0 | 4.9–5.3 | L3:8 | $$ |
| 30 | powersRoots · powersRoots · roots · letters | 686 | 5.1 | 3.2–6.2 | L1:3 L1:4 L1:5 L1:6 L1:7 L1:8 L3:3 L3:4 L3:5 L3:6 L3:7 | $$ |
| 31 | specialPowers · specialPowers · negative index · fractions · letters | 67 | 5.1 | 4.6–5.6 | L2:6 L2:7 L2:8 L3:5 L3:6 L3:7 L3:8 | $$ |
| 32 | powersRoots · powersRoots · roots · fractions · letters | 98 | 5.3 | 4.4–6.1 | L1:6 L1:7 L1:8 | $$ |
| 33 | specialPowers · specialPowers · negative index · fractions · brackets · letters | 104 | 5.5 | 5.3–5.8 | L1:8 | $$ |
| 34 | powersRoots · powersRoots · negative index · fractions · brackets · letters | 431 | 5.9 | 5.3–7.5 | L2:7 L2:8 L3:6 L3:7 L3:8 | $$ |
| 35 | commonBase · commonBase · negative index · fractions · brackets · letters | 373 | 6.0 | 5.6–6.2 | L3:6 L3:7 L3:8 | $$ |
| 36 | powersRoots · powersRoots · negative index · fractions · letters | 140 | 6.1 | 5.3–6.8 | L3:5 L3:6 L3:7 L3:8 | $$ |
| 37 | fractionalIndices · fractionalIndices · negative index · fractions · brackets · letters | 510 | 6.6 | 5.8–7.1 | L3:6 L3:7 L3:8 | $$ |
