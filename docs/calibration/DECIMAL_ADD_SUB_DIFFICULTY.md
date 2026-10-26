# Decimal Add/Sub — difficulty calibration

Generated from **9000** questions — each sub-tool × level sampled across random combinations of ALL its Question Options. Regenerate: `CALIBRATE=1 npx vitest run src/tests/decimalAddSubDifficulty.test.ts`.

## How a question is scored

The raw score is the work the question asks for, added up — **not** a weight on the option that produced it. Higher = harder.

| Piece | Cost |
|---|---|
| Start | 0.8 |
| Decimal places | 0.6 per place of the longest number |
| Whole-number digits | 0.5 per digit beyond the first |
| Carries (adding) / exchanges (subtracting) | 1.2 each (up to 5) |
| Different lengths (a placeholder 0 is needed) | +1.2 |
| A whole-number operand | +0.8 |
| An exchange that travels across a zero | +1.5 |

## The eight bands

A worksheet is ordered by **band** (1 easiest … 8 hardest); questions in a band mingle in random order. Bands are relative to the sub-tool + level: the cut points are the 12.5% … 87.5% quantiles of what that level can generate.

| Sub-tool · level | n | Cut points | Share per band (1 … 8) | Min | Median | Max |
|---|---|---|---|---|---|---|
| add:level1 | 1500 | 1.4 · 1.5 · 2 · 2.1 · 2.2 · 2.6 · 2.7 | 0% 32% 0% 33% 0% 0% 36% 0% | 1.4 | 2 | 2.6 |
| add:level2 | 1500 | 3.7 · 4.3 · 4.4 · 4.9 · 5.5 · 5.6 · 6.1 | 12% 12% 22% 0% 11% 23% 0% 20% | 2.6 | 4.9 | 9.1 |
| add:level3 | 1500 | 3.9 · 4.5 · 4.9 · 5.5 · 6.1 · 6.2 · 6.9 | 11% 12% 5% 20% 14% 14% 9% 15% | 2.6 | 5.5 | 9.1 |
| subtract:level1 | 1500 | 1.4 · 1.5 · 2 · 2.1 · 2.2 · 2.6 · 2.7 | 0% 35% 0% 32% 0% 0% 33% 0% | 1.4 | 2 | 2.6 |
| subtract:level2 | 1500 | 3.7 · 4.3 · 4.4 · 4.9 · 5.8 · 6.6 · 7.5 | 12% 11% 19% 0% 19% 12% 12% 14% | 3.1 | 4.9 | 11.1 |
| subtract:level3 | 1500 | 4.9 · 5.1 · 6.1 · 6.3 · 6.4 · 7.3 · 8.4 | 5% 14% 16% 14% 12% 8% 15% 15% | 3.7 | 6.3 | 11.4 |

## Categories, easiest to hardest (55 found)

A category is a coarse fingerprint of the question's structure; within it the score still varies with the actual numbers.

| # | Category | n | Mean | Range | Bands (level:band) | Example |
|---|---|---|---|---|---|---|
| 1 | subtract · − · 1 d.p. · 0 exchanges | 529 | 1.4 | 1.4–1.4 | L1:2 | $6.5 - 2.3$ |
| 2 | add · + · 1 d.p. · 0 carries | 473 | 1.4 | 1.4–1.4 | L1:2 | $6.3 + 1.2$ |
| 3 | add · + · 2 d.p. · 0 carries | 489 | 2.0 | 2–2 | L1:4 | $2.06 + 7.13$ |
| 4 | subtract · − · 2 d.p. · 0 exchanges | 480 | 2.0 | 2–2 | L1:4 | $6.93 - 3.21$ |
| 5 | add · + · 3 d.p. · 0 carries | 538 | 2.6 | 2.6–2.6 | L1:7 | $5.054 + 1.435$ |
| 6 | subtract · − · 3 d.p. · 0 exchanges | 491 | 2.6 | 2.6–2.6 | L1:7 | $9.767 - 0.251$ |
| 7 | add · + · 1 d.p. · 1 carries | 258 | 3.1 | 2.6–3.1 | L2:1 L3:1 | $92.6 + 56.3$ |
| 8 | subtract · − · 1 d.p. · 1 exchanges | 181 | 3.1 | 3.1–3.1 | L2:1 | $51.7 - 4.6$ |
| 9 | add · + · 2 d.p. · 1 carries | 218 | 3.7 | 3.2–3.7 | L2:1 L2:2 L3:1 | $34.53 + 91.12$ |
| 10 | subtract · − · 2 d.p. · 1 exchanges | 172 | 3.7 | 3.2–3.7 | L2:1 L2:2 | $87.38 - 18.13$ |
| 11 | subtract · − · 2 d.p. · 0 exchanges · uneven | 58 | 3.7 | 3.7–3.7 | L3:1 | $93.93 - 31.2$ |
| 12 | add · + · 1 d.p. · 0 carries · uneven | 62 | 3.9 | 3.9–3.9 | L3:2 | $18.4 + 11$ |
| 13 | add · + · 2 d.p. · 0 carries · uneven | 122 | 4.2 | 3.7–4.5 | L3:1 L3:3 | $51.61 + 7$ |
| 14 | add · + · 3 d.p. · 1 carries | 164 | 4.3 | 3.8–4.3 | L2:2 L2:3 L3:2 | $64.415 + 72.501$ |
| 15 | subtract · − · 3 d.p. · 1 exchanges | 154 | 4.3 | 3.8–4.3 | L2:2 L2:3 | $28.059 - 1.412$ |
| 16 | add · + · 1 d.p. · 2 carries | 279 | 4.3 | 4.3–4.3 | L2:3 L3:2 | $52.1 + 58.8$ |
| 17 | subtract · − · 3 d.p. · 0 exchanges · uneven | 15 | 4.3 | 4.3–4.3 | L3:1 | $97.165 - 40.1$ |
| 18 | subtract · − · 1 d.p. · 2 exchanges | 130 | 4.3 | 4.3–4.3 | L2:3 | $66.2 - 39.6$ |
| 19 | add · + · 3 d.p. · 0 carries · uneven | 23 | 4.8 | 4.3–5.1 | L3:2 L3:3 L3:4 | $5.411 + 12$ |
| 20 | subtract · − · 2 d.p. · 1 exchanges · uneven | 213 | 4.9 | 4.4–4.9 | L3:1 L3:2 | $57.54 - 35.6$ |
| 21 | subtract · − · 2 d.p. · 2 exchanges | 135 | 4.9 | 4.4–4.9 | L2:4 L2:5 | $96.23 - 85.48$ |
| 22 | add · + · 2 d.p. · 2 carries | 217 | 4.9 | 4.4–4.9 | L2:4 L2:5 L3:4 | $82.15 + 79.63$ |
| 23 | subtract · − · 1 d.p. · 1 exchanges · uneven | 205 | 5.1 | 4.6–5.1 | L3:1 L3:3 | $26 - 23.6$ |
| 24 | add · + · 1 d.p. · 1 carries · uneven | 133 | 5.1 | 5.1–5.1 | L3:4 | $66 + 50.6$ |
| 25 | add · + · 2 d.p. · 1 carries · uneven | 208 | 5.3 | 4.9–5.7 | L3:4 L3:5 | $54.88 + 63$ |
| 26 | subtract · − · 3 d.p. · 2 exchanges | 145 | 5.5 | 5–5.5 | L2:5 | $86.086 - 47.175$ |
| 27 | add · + · 3 d.p. · 2 carries | 185 | 5.5 | 5–5.5 | L2:5 L2:6 L3:5 | $91.336 + 63.047$ |
| 28 | add · + · 1 d.p. · 3+ carries | 235 | 5.5 | 5.5–5.5 | L2:6 L3:5 | $52.8 + 78.5$ |
| 29 | subtract · − · 3 d.p. · 1 exchanges · uneven | 32 | 5.5 | 5.5–5.5 | L3:3 | $40.786 - 14.46$ |
| 30 | subtract · − · 1 d.p. · 2 exchanges · across 0 | 37 | 5.8 | 5.8–5.8 | L2:6 | $60.3 - 19.8$ |
| 31 | add · + · 3 d.p. · 1 carries · uneven | 52 | 5.9 | 5–6.3 | L3:4 L3:5 L3:7 | $33.273 + 96$ |
| 32 | subtract · − · 1 d.p. · 3+ exchanges | 116 | 6.0 | 6–6 | L2:6 | $422.8 - 374.9$ |
| 33 | subtract · − · 2 d.p. · 2 exchanges · uneven | 217 | 6.1 | 5.6–6.1 | L3:3 L3:4 | $77.4 - 34.49$ |
| 34 | subtract · − · 1 d.p. · 2 exchanges · uneven | 185 | 6.3 | 6.3–6.3 | L3:5 | $82 - 68.5$ |
| 35 | add · + · 1 d.p. · 2 carries · uneven | 58 | 6.3 | 6.3–6.3 | L3:7 | $99.1 + 25$ |
| 36 | subtract · − · 2 d.p. · 2 exchanges · across 0 | 120 | 6.4 | 5.9–6.4 | L2:6 L3:3 L3:6 | $30.77 - 8.84$ |
| 37 | add · + · 2 d.p. · 2 carries · uneven | 187 | 6.4 | 6.1–6.9 | L3:6 L3:8 | $73.7 + 87.04$ |
| 38 | add · + · 2 d.p. · 3+ carries | 288 | 6.4 | 5.6–7.3 | L2:7 L2:8 L3:5 L3:6 L3:8 | $68.47 + 56.69$ |
| 39 | subtract · − · 3 d.p. · 2 exchanges · uneven | 26 | 6.7 | 6.7–6.7 | L3:6 | $85.436 - 41.69$ |
| 40 | subtract · − · 2 d.p. · 3+ exchanges | 109 | 6.8 | 6.6–7.8 | L2:7 L2:8 | $873.38 - 588.94$ |
| 41 | add · + · 3 d.p. · 2 carries · uneven | 56 | 6.9 | 6.7–7.5 | L3:7 L3:8 | $84.501 + 60.97$ |
| 42 | subtract · − · 3 d.p. · 2 exchanges · across 0 | 38 | 7.0 | 6.5–7 | L2:6 L2:7 L3:6 | $33.404 - 12.267$ |
| 43 | subtract · − · 2 d.p. · 3+ exchanges · uneven | 74 | 7.3 | 7.3–7.3 | L3:7 | $62.8 - 36.87$ |
| 44 | add · + · 2 d.p. · 3+ carries · uneven | 52 | 7.3 | 7.3–7.3 | L3:8 | $85.6 + 44.83$ |
| 45 | add · + · 3 d.p. · 3+ carries | 184 | 7.4 | 6.2–9.1 | L2:8 L3:7 L3:8 | $32.157 + 18.658$ |
| 46 | subtract · − · 1 d.p. · 3+ exchanges · across 0 | 45 | 7.5 | 7.5–7.5 | L2:8 | $908.4 - 58.9$ |
| 47 | subtract · − · 3 d.p. · 3+ exchanges | 121 | 7.7 | 6.7–9.6 | L2:7 L2:8 | $944.811 - 260.219$ |
| 48 | subtract · − · 2 d.p. · 3+ exchanges · across 0 | 148 | 7.9 | 7.6–9.3 | L2:8 L3:7 | $520.04 - 386.48$ |
| 49 | subtract · − · 3 d.p. · 2 exchanges · uneven · across 0 | 12 | 8.1 | 7.7–8.2 | L3:7 | $45.054 - 34.99$ |
| 50 | add · + · 3 d.p. · 3+ carries · uneven | 19 | 8.2 | 7.9–9.1 | L3:8 | $23.687 + 76.4$ |
| 51 | subtract · − · 3 d.p. · 3+ exchanges · uneven | 15 | 8.2 | 7.9–9.1 | L3:7 L3:8 | $43.28 - 14.474$ |
| 52 | subtract · − · 2 d.p. · 2 exchanges · uneven · across 0 | 68 | 8.3 | 7.6–8.4 | L3:7 L3:8 | $97 - 80.01$ |
| 53 | subtract · − · 3 d.p. · 3+ exchanges · across 0 | 98 | 9.3 | 8.2–11.1 | L2:8 L3:7 L3:8 | $368.034 - 232.895$ |
| 54 | subtract · − · 2 d.p. · 3+ exchanges · uneven · across 0 | 62 | 9.4 | 8.8–9.6 | L3:8 | $95 - 46.27$ |
| 55 | subtract · − · 3 d.p. · 3+ exchanges · uneven · across 0 | 69 | 10.4 | 8.9–11.4 | L3:8 | $68.3 - 23.608$ |
