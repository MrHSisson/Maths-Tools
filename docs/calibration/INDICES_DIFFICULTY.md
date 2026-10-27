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
| powersRoots:level1 | 1500 | 2.7 · 2.8 · 3.4 · 3.5 · 4.1 · 5 · 5.4 | 6% 14% 17% 9% 14% 14% 13% 14% | 2.5 | 3.5 | 6.2 |
| powersRoots:level2 | 1500 | 3 · 3.8 · 4.1 · 4.2 · 4.3 · 4.5 · 5.3 | 12% 11% 13% 9% 11% 19% 12% 14% | 2.6 | 4.2 | 6.3 |
| powersRoots:level3 | 1500 | 3.9 · 4.4 · 4.8 · 5.2 · 5.6 · 5.8 · 6.2 | 12% 10% 15% 12% 12% 11% 15% 13% | 3 | 5.2 | 7.5 |
| writingIndices:level1 | 1500 | 3.4 · 3.6 · 3.7 · 3.8 · 3.9 · 4 · 4.1 | 6% 17% 22% 15% 3% 11% 11% 14% | 2.9 | 3.7 | 4.4 |
| writingIndices:level2 | 1500 | 3.6 · 3.7 · 3.8 · 3.9 · 4 · 4.1 · 4.2 | 10% 27% 16% 8% 5% 12% 9% 13% | 3.4 | 3.7 | 4.4 |
| writingIndices:level3 | 1500 | 3.6 · 4 · 4.4 · 4.5 · 4.6 · 4.7 · 4.9 | 4% 19% 11% 12% 5% 19% 16% 14% | 3.5 | 4.5 | 5.3 |
| indexLaws:level1 | 1500 | 3 · 3.1 · 3.2 · 3.3 · 3.9 · 4 · 4.1 | 5% 15% 24% 6% 2% 10% 12% 25% | 2.7 | 3.2 | 4.3 |
| indexLaws:level2 | 1500 | 3.3 · 3.4 · 3.5 · 3.6 · 3.7 · 4 · 4.1 | 10% 5% 18% 12% 15% 15% 4% 21% | 3.1 | 3.6 | 4.3 |
| indexLaws:level3 | 1500 | 3.2 · 3.3 · 3.4 · 3.5 · 3.6 · 3.7 · 3.8 | 8% 30% 11% 10% 13% 20% 1% 7% | 3 | 3.4 | 4.4 |
| specialPowers:level1 | 1500 | 2.9 · 3.1 · 3.4 · 3.8 · 4.1 · 4.2 · 4.6 | 12% 9% 14% 11% 15% 7% 18% 15% | 2.1 | 3.8 | 5.8 |
| specialPowers:level2 | 1500 | 3.7 · 3.9 · 4.1 · 4.4 · 4.6 · 4.9 · 5 | 8% 15% 7% 20% 10% 13% 11% 17% | 2.7 | 4.4 | 5.5 |
| specialPowers:level3 | 1500 | 3.8 · 4.1 · 4.2 · 4.5 · 4.7 · 4.9 · 5 | 5% 13% 12% 19% 9% 16% 10% 17% | 2.7 | 4.5 | 5.5 |
| fractionalIndices:level1 | 1500 | 3.6 · 3.7 · 3.8 · 3.9 · 4 · 4.1 · 4.6 | 11% 35% 12% 2% 4% 0% 23% 13% | 2.5 | 3.7 | 5 |
| fractionalIndices:level2 | 1500 | 3.7 · 3.8 · 4.1 · 4.6 · 5 · 5.2 · 5.6 | 12% 7% 18% 12% 11% 7% 16% 16% | 2.5 | 4.6 | 5.7 |
| fractionalIndices:level3 | 1500 | 3.6 · 3.9 · 4.6 · 4.7 · 5.2 · 6.4 · 6.8 | 5% 20% 10% 12% 13% 14% 12% 13% | 2.5 | 4.7 | 7.1 |
| commonBase:level1 | 1500 | 3.7 · 3.8 · 4.2 · 4.4 · 4.8 · 5.2 · 5.8 | 10% 9% 12% 15% 12% 16% 9% 17% | 3.1 | 4.4 | 7.4 |
| commonBase:level2 | 1500 | 3.7 · 4 · 4.2 · 4.6 · 4.9 · 5.6 · 6 | 7% 17% 5% 20% 7% 19% 13% 13% | 3.1 | 4.6 | 8.8 |
| commonBase:level3 | 1500 | 3.2 · 3.7 · 4 · 4.2 · 4.5 · 5.8 · 6.2 | 10% 13% 14% 12% 11% 11% 16% 13% | 2.9 | 4.2 | 7.4 |

## Categories, easiest to hardest (37 found)

A category is a coarse fingerprint of the question's structure; within it the score still varies with the actual numbers.

| # | Category | n | Mean | Range | Bands (level:band) | Example |
|---|---|---|---|---|---|---|
| 1 | fractionalIndices · fractionalIndices · letters | 76 | 2.8 | 2.5–3.4 | L1:1 L2:1 L3:1 | $$ |
| 2 | specialPowers · specialPowers · letters | 570 | 2.9 | 2.1–3.4 | L1:1 L1:2 L1:3 L1:4 L2:1 L3:1 | $$ |
| 3 | powersRoots · powersRoots · letters | 686 | 3.0 | 2.5–4.4 | L1:1 L1:2 L1:3 L1:4 L1:5 L2:1 L2:2 L2:6 | $$ |
| 4 | powersRoots · powersRoots · brackets · letters | 635 | 3.2 | 2.6–3.7 | L1:3 L1:4 L1:5 L2:1 L3:1 | $$ |
| 5 | indexLaws · indexLaws · letters | 2537 | 3.3 | 2.7–4 | L1:1 L1:2 L1:3 L1:4 L1:5 L2:1 L2:2 L2:3 L2:4 L2:5 L2:6 L2:7 L3:1 L3:2 L3:3 L3:4 L3:5 L3:6 L3:7 L3:8 | $$ |
| 6 | fractionalIndices · fractionalIndices · negative index · letters | 32 | 3.5 | 3.5–3.5 | L1:1 L3:1 | $$ |
| 7 | specialPowers · specialPowers · brackets · letters | 312 | 3.6 | 3–3.9 | L1:2 L1:3 L1:4 L2:1 L2:2 L2:3 L3:1 L3:2 | $$ |
| 8 | writingIndices · writingIndices · roots · letters | 748 | 3.6 | 2.9–3.9 | L1:1 L1:2 L1:3 L1:4 L1:5 L1:6 L2:1 L2:2 L2:3 L2:4 L2:5 L3:1 L3:2 | $$ |
| 9 | writingIndices · writingIndices · fractions · letters | 1713 | 3.7 | 3.3–4 | L1:1 L1:2 L1:3 L1:4 L1:5 L1:6 L1:7 L2:1 L2:2 L2:3 L2:4 L2:5 L2:6 L3:2 L3:3 | $$ |
| 10 | fractionalIndices · fractionalIndices · fractions · letters | 2024 | 3.7 | 3.4–4.4 | L1:1 L1:2 L1:3 L1:4 L1:5 L1:6 L2:1 L2:2 L2:3 L2:4 L3:1 L3:2 L3:3 | $$ |
| 11 | indexLaws · indexLaws · brackets · letters | 1119 | 3.7 | 3.4–4.3 | L1:5 L1:6 L1:7 L1:8 L2:3 L2:4 L2:5 L2:6 L3:4 L3:5 L3:6 | $$ |
| 12 | specialPowers · specialPowers · negative index · letters | 1316 | 4.1 | 3.4–5 | L1:4 L1:5 L1:6 L1:7 L2:1 L2:2 L2:3 L2:4 L2:5 L2:6 L3:1 L3:2 L3:3 L3:4 L3:5 L3:6 L3:7 L3:8 | $$ |
| 13 | writingIndices · writingIndices · negative index · letters | 692 | 4.1 | 3.7–4.4 | L1:4 L1:6 L1:7 L1:8 L2:5 L2:6 L2:7 L2:8 | $$ |
| 14 | indexLaws · indexLaws · fractions · letters | 844 | 4.1 | 3.8–4.4 | L1:5 L1:6 L1:7 L1:8 L2:6 L2:7 L2:8 L3:8 | $$ |
| 15 | writingIndices · writingIndices · roots · brackets · letters | 348 | 4.1 | 4–4.4 | L2:6 L2:7 L2:8 L3:3 L3:4 | $$ |
| 16 | powersRoots · powersRoots · negative index · letters | 180 | 4.2 | 3.9–4.4 | L2:3 L2:4 L2:5 L2:6 | $$ |
| 17 | commonBase · commonBase · fractions · letters | 218 | 4.2 | 3.4–6 | L2:1 L2:2 L2:3 L2:4 L2:6 L2:8 | $$ |
| 18 | specialPowers · specialPowers · fractions · letters | 752 | 4.3 | 3.4–5.2 | L1:4 L1:5 L1:6 L1:7 L1:8 L2:3 L2:4 L2:5 L2:6 L2:7 L2:8 L3:2 L3:3 L3:4 L3:5 L3:6 L3:7 L3:8 | $$ |
| 19 | powersRoots · powersRoots · negative index · brackets · letters | 163 | 4.3 | 4.2–4.5 | L2:5 L2:6 L2:7 | $$ |
| 20 | writingIndices · writingIndices · roots · fractions · letters | 328 | 4.5 | 4.1–4.8 | L3:3 L3:4 L3:5 L3:6 L3:7 | $$ |
| 21 | powersRoots · powersRoots · fractions · brackets · letters | 786 | 4.5 | 3.9–6.2 | L1:5 L1:6 L2:3 L2:4 L2:5 L2:6 L3:2 L3:3 L3:4 L3:5 L3:6 L3:7 L3:8 | $$ |
| 22 | commonBase · commonBase · letters | 3901 | 4.6 | 2.9–8.8 | L1:1 L1:2 L1:3 L1:4 L1:5 L1:6 L1:7 L1:8 L2:1 L2:2 L2:3 L2:4 L2:5 L2:6 L2:7 L2:8 L3:1 L3:2 L3:3 L3:4 L3:5 L3:6 L3:8 | $$ |
| 23 | fractionalIndices · fractionalIndices · negative index · fractions · letters | 599 | 4.6 | 4.4–5 | L1:7 L1:8 L3:3 L3:4 L3:5 | $$ |
| 24 | powersRoots · powersRoots · fractions · letters | 748 | 4.6 | 3.6–6.3 | L2:3 L2:4 L2:6 L2:7 L2:8 L3:1 L3:2 L3:3 L3:4 L3:5 L3:6 L3:7 | $$ |
| 25 | writingIndices · writingIndices · negative index · fractions · letters | 514 | 4.7 | 4.4–5 | L3:4 L3:6 L3:7 L3:8 | $$ |
| 26 | specialPowers · specialPowers · negative index · brackets · letters | 1035 | 4.8 | 3.9–5.3 | L1:5 L1:7 L1:8 L2:5 L2:6 L2:7 L2:8 L3:4 L3:5 L3:6 L3:7 L3:8 | $$ |
| 27 | fractionalIndices · fractionalIndices · fractions · brackets · letters | 1265 | 4.9 | 3.9–5.7 | L1:5 L1:7 L2:4 L2:5 L2:6 L2:7 L2:8 L3:3 L3:4 L3:5 L3:6 | $$ |
| 28 | specialPowers · specialPowers · fractions · brackets · letters | 361 | 4.9 | 4.3–5.5 | L1:7 L1:8 L2:6 L2:7 L2:8 L3:5 L3:6 L3:7 L3:8 | $$ |
| 29 | writingIndices · writingIndices · roots · fractions · brackets · letters | 157 | 5.0 | 4.9–5.3 | L3:8 | $$ |
| 30 | specialPowers · specialPowers · negative index · fractions · letters | 63 | 5.1 | 4.6–5.5 | L2:6 L2:7 L2:8 L3:6 L3:7 L3:8 | $$ |
| 31 | powersRoots · powersRoots · roots · letters | 691 | 5.2 | 3.2–6.2 | L1:3 L1:4 L1:5 L1:6 L1:7 L1:8 L3:3 L3:4 L3:5 L3:6 L3:7 | $$ |
| 32 | powersRoots · powersRoots · roots · fractions · letters | 103 | 5.2 | 4.4–6.1 | L1:6 L1:7 L1:8 | $$ |
| 33 | specialPowers · specialPowers · negative index · fractions · brackets · letters | 91 | 5.5 | 5.3–5.8 | L1:8 | $$ |
| 34 | powersRoots · powersRoots · negative index · fractions · brackets · letters | 372 | 6.0 | 5.3–7.5 | L2:8 L3:6 L3:7 L3:8 | $$ |
| 35 | commonBase · commonBase · negative index · fractions · brackets · letters | 381 | 6.0 | 5.6–6.2 | L3:6 L3:7 L3:8 | $$ |
| 36 | powersRoots · powersRoots · negative index · fractions · letters | 136 | 6.2 | 5.3–6.8 | L3:5 L3:6 L3:7 L3:8 | $$ |
| 37 | fractionalIndices · fractionalIndices · negative index · fractions · brackets · letters | 504 | 6.6 | 5.8–7.1 | L3:6 L3:7 L3:8 | $$ |
