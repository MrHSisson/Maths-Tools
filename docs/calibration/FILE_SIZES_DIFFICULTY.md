# File Sizes — difficulty calibration

Generated from **13500** questions — each sub-tool × level sampled across random combinations of ALL its Question Options. Regenerate: `CALIBRATE=1 npx vitest run src/tests/fileSizesDifficulty.test.ts`.

## How a question is scored

The raw score is the work the question asks for, added up — **not** a weight on the option that produced it. Higher = harder.

| Piece | Cost |
|---|---|
| Start | 0.5 |
| Each step of the working | 0.6 |
| Each unit conversion (bits ↔ bytes ↔ KB ↔ MB) | 1.4 |
| The biggest number in the question | 0.4 per digit beyond the first |
| What is asked | find a size or colours from bits 0 · compare ASCII/Unicode, fewest bits 1 · can n bits store, several images, logo 1.5 · find the characters or bits per character 2 · find the colour depth or pixels 2.5 |

## The eight bands

A worksheet is ordered by **band** (1 easiest … 8 hardest); questions in a band mingle in random order. Bands are relative to the sub-tool + level: the cut points are the 12.5% … 87.5% quantiles of what that level can generate.

| Sub-tool · level | n | Cut points | Share per band (1 … 8) | Min | Median | Max |
|---|---|---|---|---|---|---|
| text:level1 | 1500 | 1.5 · 1.6 · 1.7 · 1.8 · 1.9 · 2 · 2.1 | 0% 88% 0% 0% 0% 12% 0% 0% | 1.5 | 1.5 | 1.9 |
| text:level2 | 1500 | 3.9 · 4 · 5.9 · 8.1 · 8.2 · 12.1 · 12.2 | 12% 15% 7% 14% 23% 0% 28% 0% | 3.7 | 8.1 | 12.1 |
| text:level3 | 1500 | 3.9 · 4 · 4.1 · 5.9 · 7.1 · 7.9 · 12.1 | 0% 48% 0% 0% 12% 8% 12% 19% | 3.9 | 5.9 | 12.1 |
| images:level1 | 1500 | 1.1 · 1.2 · 1.3 · 1.5 · 1.9 · 2 · 2.1 | 0% 48% 0% 0% 9% 23% 0% 20% | 1.1 | 1.5 | 2.1 |
| images:level2 | 1500 | 2.7 · 3.1 · 3.2 · 3.5 · 4.5 · 6.5 · 6.6 | 0% 18% 20% 0% 12% 20% 18% 12% | 2.7 | 3.5 | 8.5 |
| images:level3 | 1500 | 1.1 · 3.2 · 4 · 4.8 · 7 · 7.1 · 8.6 | 0% 23% 12% 8% 16% 14% 7% 19% | 1.1 | 4.8 | 11 |
| sound:level1 | 1500 | 1.5 · 1.6 · 1.7 · 1.8 · 1.9 · 2 · 2.1 | 0% 57% 0% 0% 0% 43% 0% 0% | 1.5 | 1.5 | 1.9 |
| sound:level2 | 1500 | 3.9 · 4 · 4.1 · 5.9 · 6 · 6.1 · 6.2 | 0% 48% 0% 0% 52% 0% 0% 0% | 3.9 | 5.9 | 5.9 |
| sound:level3 | 1500 | 4.9 · 5 · 5.9 · 6.4 · 6.5 · 6.9 · 12.1 | 0% 32% 0% 12% 16% 10% 17% 14% | 4.9 | 6.4 | 13.3 |

## Categories, easiest to hardest (36 found)

A category is a coarse fingerprint of the question's structure; within it the score still varies with the actual numbers.

| # | Category | n | Mean | Range | Bands (level:band) | Example |
|---|---|---|---|---|---|---|
| 1 | images · images · coloursFromBits · 0 conversions | 969 | 1.1 | 1.1–1.5 | L1:2 L1:5 L3:2 | $$ |
| 2 | text · text · findSize · 0 conversions | 1500 | 1.5 | 1.5–1.9 | L1:2 L1:6 | $$ |
| 3 | sound · sound · findSize · 0 conversions | 1500 | 1.7 | 1.5–1.9 | L1:2 L1:6 | $$ |
| 4 | images · images · findSize · 0 conversions | 727 | 2.0 | 1.7–2.1 | L1:5 L1:6 L1:8 | $$ |
| 5 | images · images · fewestBits · 0 conversions | 955 | 3.0 | 2.7–3.5 | L2:2 L2:3 L2:5 L3:2 L3:3 | $$ |
| 6 | images · images · canStore · 0 conversions | 172 | 3.5 | 3.2–4 | L3:3 L3:4 | $$ |
| 7 | text · text · findSize · 1 conversion | 506 | 3.9 | 3.7–4.1 | L2:1 L2:2 L2:3 | $$ |
| 8 | text · text · findChars · 0 conversions | 331 | 3.9 | 3.9–3.9 | L3:2 | $$ |
| 9 | text · text · findBits · 0 conversions | 395 | 3.9 | 3.9–3.9 | L3:2 | $$ |
| 10 | sound · sound · findSize · 1 conversion | 716 | 3.9 | 3.9–3.9 | L2:2 | $$ |
| 11 | images · images · findSize · 1 conversion | 306 | 4.5 | 4.5–4.5 | L2:6 | $$ |
| 12 | images · images · logo · 0 conversions | 192 | 4.6 | 4.4–4.8 | L3:4 L3:5 | $$ |
| 13 | sound · sound · findRate · 1 conversion | 237 | 4.9 | 4.9–4.9 | L3:2 | $$ |
| 14 | sound · sound · findDuration · 1 conversion | 236 | 4.9 | 4.9–4.9 | L3:2 | $$ |
| 15 | text · text · findSize · 2 conversions | 399 | 5.9 | 5.9–5.9 | L2:4 L3:5 | $$ |
| 16 | sound · sound · findSize · 2 conversions | 1039 | 6.0 | 5.7–6.7 | L2:5 L3:3 L3:4 L3:6 | $$ |
| 17 | sound · sound · findDepth · 1 conversion | 243 | 6.4 | 6.4–6.4 | L3:5 | $$ |
| 18 | images · images · findSize · 2 conversions | 383 | 6.6 | 5.9–7.7 | L2:7 L3:5 L3:7 | $$ |
| 19 | sound · sound · findRate · 2 conversions | 107 | 6.6 | 6.5–6.9 | L3:6 L3:7 | $$ |
| 20 | images · images · findPixels · 1 conversion | 141 | 6.7 | 6.4–7 | L3:5 L3:6 | $$ |
| 21 | sound · sound · findDuration · 2 conversions | 102 | 6.9 | 6.9–6.9 | L3:7 | $$ |
| 22 | images · images · findDepth · 1 conversion | 140 | 7.0 | 7–7 | L3:6 | $$ |
| 23 | text · text · findChars · 2 conversions | 128 | 7.4 | 7.1–7.9 | L3:6 L3:7 | $$ |
| 24 | text · text · findBits · 2 conversions | 109 | 7.9 | 7.9–7.9 | L3:7 | $$ |
| 25 | text · text · findSize · 3 conversions | 64 | 7.9 | 7.9–7.9 | L3:7 | $$ |
| 26 | text · text · compareSets · 2 conversions | 351 | 8.1 | 8.1–8.1 | L2:5 | $$ |
| 27 | sound · sound · findDepth · 2 conversions | 113 | 8.4 | 8.4–8.4 | L3:7 | $$ |
| 28 | images · images · findSize · 3 conversions | 199 | 8.5 | 7.9–9.7 | L2:8 L3:7 L3:8 | $$ |
| 29 | images · images · findPixels · 2 conversions | 69 | 8.6 | 8–9 | L3:7 L3:8 | $$ |
| 30 | images · images · several · 2 conversions | 106 | 8.6 | 8.6–8.6 | L3:8 | $$ |
| 31 | images · images · findDepth · 2 conversions | 47 | 9.0 | 9–9 | L3:8 | $$ |
| 32 | images · images · findPixels · 3 conversions | 5 | 10.4 | 9.6–11 | L3:8 | $$ |
| 33 | images · images · several · 3 conversions | 86 | 10.6 | 10.6–10.6 | L3:8 | $$ |
| 34 | images · images · findDepth · 3 conversions | 3 | 11.0 | 11–11 | L3:8 | $$ |
| 35 | text · text · compareSets · 4 conversions | 717 | 12.1 | 12.1–12.1 | L2:7 L3:8 | $$ |
| 36 | sound · sound · compare · 4 conversions | 207 | 12.6 | 12.1–13.3 | L3:8 | $$ |
