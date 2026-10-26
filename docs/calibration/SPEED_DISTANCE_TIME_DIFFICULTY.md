# Speed, Distance, Time — difficulty calibration

Generated from **18000** questions — each sub-tool × level sampled across random combinations of ALL its Question Options. Regenerate: `CALIBRATE=1 npx vitest run src/tests/speedDistanceTimeDifficulty.test.ts`.

## How a question is scored

The raw score is the work the question asks for, added up — **not** a weight on the option that produced it. Higher = harder.

| Piece | Cost |
|---|---|
| Start | 1 |
| The time | whole hours 0 · minutes (30 min) 1.5 · compound (1 hr 30) 3 · awkward minutes (40 min) 3.5 |
| Scaling steps in the ratio table | 0.8 each (a ÷ then a ×) |
| A decimal in the numbers | +1.5 |
| Size of the numbers | 1.2 × log₁₀(the larger of distance and speed) + 0.6 × log₁₀(the smaller + 1) |
| Asking for the time | +0.5 |

## The eight bands

A worksheet is ordered by **band** (1 easiest … 8 hardest); questions in a band mingle in random order. Bands are relative to the sub-tool + level: the cut points are the 12.5% … 87.5% quantiles of what that level can generate.

| Sub-tool · level | n | Cut points | Share per band (1 … 8) | Min | Median | Max |
|---|---|---|---|---|---|---|
| speed:level1 | 1500 | 4 · 4.4 · 4.6 · 4.8 · 5.1 · 5.8 · 6.3 | 10% 14% 10% 11% 15% 13% 12% 14% | 2.6 | 4.8 | 6.9 |
| speed:level2 | 1500 | 5.5 · 5.8 · 6.1 · 6.3 · 6.5 · 7 · 7.6 | 12% 9% 15% 9% 13% 14% 15% 13% | 4.6 | 6.3 | 8 |
| speed:level3 | 1500 | 8.2 · 8.8 · 9.3 · 9.6 · 9.9 · 10.3 · 10.7 | 11% 14% 10% 14% 11% 15% 11% 14% | 7.3 | 9.6 | 11.4 |
| distance:level1 | 1500 | 4.1 · 4.4 · 4.7 · 4.9 · 5.2 · 5.8 · 6.3 | 12% 12% 13% 11% 14% 12% 13% 14% | 2.7 | 4.9 | 6.9 |
| distance:level2 | 1500 | 5.5 · 5.8 · 6.1 · 6.4 · 6.6 · 7.2 · 7.6 | 11% 10% 14% 14% 13% 12% 10% 16% | 4.6 | 6.4 | 8.1 |
| distance:level3 | 1500 | 8.2 · 8.8 · 9.3 · 9.6 · 9.9 · 10.2 · 10.7 | 11% 13% 13% 13% 10% 13% 15% 13% | 7.3 | 9.6 | 11.4 |
| time:level1 | 1500 | 4.6 · 4.9 · 5.1 · 5.4 · 5.6 · 6.3 · 6.8 | 11% 12% 10% 16% 11% 13% 14% 13% | 3.1 | 5.4 | 7.4 |
| time:level2 | 1500 | 6 · 6.3 · 6.6 · 6.9 · 7.1 · 7.7 · 8.1 | 12% 10% 15% 13% 12% 11% 13% 14% | 5.1 | 6.9 | 8.6 |
| time:level3 | 1500 | 8.7 · 9.2 · 9.8 · 10 · 10.4 · 10.7 · 11.1 | 12% 11% 13% 10% 14% 12% 12% 15% | 7.8 | 10 | 11.9 |
| mixed:level1 | 1500 | 4.2 · 4.5 · 4.8 · 5 · 5.3 · 5.9 · 6.4 | 10% 12% 12% 11% 14% 14% 13% 14% | 2.6 | 5 | 7.4 |
| mixed:level2 | 1500 | 5.6 · 6 · 6.3 · 6.5 · 6.8 · 7.3 · 7.7 | 10% 12% 15% 10% 12% 13% 13% 15% | 4.6 | 6.5 | 8.6 |
| mixed:level3 | 1500 | 8.3 · 8.9 · 9.3 · 9.7 · 10 · 10.3 · 10.7 | 12% 13% 10% 14% 12% 11% 12% 16% | 7.3 | 9.7 | 11.9 |

## Categories, easiest to hardest (46 found)

A category is a coarse fingerprint of the question's structure; within it the score still varies with the actual numbers.

| # | Category | n | Mean | Range | Bands (level:band) | Example |
|---|---|---|---|---|---|---|
| 1 | speed · speed · l1 · 1 scaling step | 1019 | 4.5 | 2.6–5.4 | L1:1 L1:2 L1:3 L1:4 L1:5 L1:6 | $$ |
| 2 | distance · distance · l1 · 1 scaling step | 994 | 4.5 | 2.7–5.4 | L1:1 L1:2 L1:3 L1:4 L1:5 L1:6 | $$ |
| 3 | mixed · speed · l1 · 1 scaling step | 323 | 4.5 | 2.7–5.4 | L1:1 L1:2 L1:3 L1:4 L1:5 L1:6 | $$ |
| 4 | mixed · distance · l1 · 1 scaling step | 341 | 4.5 | 2.6–5.4 | L1:1 L1:2 L1:3 L1:4 L1:5 L1:6 | $$ |
| 5 | mixed · time · l1 · 1 scaling step | 358 | 5.0 | 3.1–5.9 | L1:1 L1:2 L1:3 L1:4 L1:5 L1:6 L1:7 | $$ |
| 6 | time · time · l1 · 1 scaling step | 1018 | 5.0 | 3.1–5.9 | L1:1 L1:2 L1:3 L1:4 L1:5 L1:6 | $$ |
| 7 | mixed · distance · l2 · 1 scaling step | 320 | 5.9 | 4.6–7 | L2:1 L2:2 L2:3 L2:4 L2:5 L2:6 | $$ |
| 8 | speed · speed · l2 · 1 scaling step | 1026 | 6.0 | 4.6–7 | L2:1 L2:2 L2:3 L2:4 L2:5 L2:6 L2:7 | $$ |
| 9 | distance · distance · l2 · 1 scaling step | 982 | 6.0 | 4.6–7 | L2:1 L2:2 L2:3 L2:4 L2:5 L2:6 | $$ |
| 10 | mixed · speed · l2 · 1 scaling step | 329 | 6.0 | 4.6–7 | L2:1 L2:2 L2:3 L2:4 L2:5 L2:6 | $$ |
| 11 | mixed · speed · l1 · 1 scaling step · decimal | 143 | 6.1 | 4.3–6.9 | L1:2 L1:4 L1:6 L1:7 L1:8 | $$ |
| 12 | distance · distance · l1 · 1 scaling step · decimal | 506 | 6.1 | 4.3–6.9 | L1:2 L1:4 L1:5 L1:6 L1:7 L1:8 | $$ |
| 13 | mixed · distance · l1 · 1 scaling step · decimal | 159 | 6.1 | 4.3–6.9 | L1:2 L1:3 L1:4 L1:5 L1:6 L1:7 L1:8 | $$ |
| 14 | speed · speed · l1 · 1 scaling step · decimal | 481 | 6.1 | 4.3–6.9 | L1:2 L1:4 L1:5 L1:6 L1:7 L1:8 | $$ |
| 15 | mixed · time · l2 · 1 scaling step | 341 | 6.4 | 5.1–7.5 | L2:1 L2:2 L2:3 L2:4 L2:5 L2:6 L2:7 | $$ |
| 16 | time · time · l2 · 1 scaling step | 990 | 6.5 | 5.1–7.5 | L2:1 L2:2 L2:3 L2:4 L2:5 L2:6 | $$ |
| 17 | mixed · time · l1 · 1 scaling step · decimal | 176 | 6.5 | 4.8–7.4 | L1:4 L1:5 L1:6 L1:7 L1:8 | $$ |
| 18 | time · time · l1 · 1 scaling step · decimal | 482 | 6.6 | 4.8–7.4 | L1:2 L1:4 L1:5 L1:6 L1:7 L1:8 | $$ |
| 19 | mixed · speed · l2 · 1 scaling step · decimal | 157 | 7.4 | 6.4–8 | L2:4 L2:5 L2:6 L2:7 L2:8 | $$ |
| 20 | speed · speed · l2 · 1 scaling step · decimal | 474 | 7.4 | 6.4–8 | L2:5 L2:6 L2:7 L2:8 | $$ |
| 21 | distance · distance · l2 · 1 scaling step · decimal | 518 | 7.4 | 6.2–8.1 | L2:4 L2:5 L2:6 L2:7 L2:8 | $$ |
| 22 | mixed · distance · l2 · 1 scaling step · decimal | 176 | 7.4 | 6.2–8.1 | L2:3 L2:4 L2:5 L2:6 L2:7 L2:8 | $$ |
| 23 | mixed · time · l2 · 1 scaling step · decimal | 177 | 7.9 | 6.7–8.6 | L2:5 L2:6 L2:7 L2:8 | $$ |
| 24 | time · time · l2 · 1 scaling step · decimal | 510 | 7.9 | 6.7–8.6 | L2:4 L2:5 L2:6 L2:7 L2:8 | $$ |
| 25 | mixed · distance · l3compound · 2 scaling steps | 178 | 8.7 | 7.4–9.6 | L3:1 L3:2 L3:3 L3:4 | $$ |
| 26 | speed · speed · l3compound · 2 scaling steps | 527 | 8.8 | 7.3–9.6 | L3:1 L3:2 L3:3 L3:4 L3:5 | $$ |
| 27 | distance · distance · l3compound · 2 scaling steps | 478 | 8.8 | 7.3–9.6 | L3:1 L3:2 L3:3 L3:4 L3:5 | $$ |
| 28 | mixed · speed · l3compound · 2 scaling steps | 166 | 8.8 | 7.3–9.6 | L3:1 L3:2 L3:3 L3:4 | $$ |
| 29 | mixed · distance · l3awkward · 2 scaling steps | 166 | 9.2 | 7.4–10.3 | L3:1 L3:2 L3:3 L3:4 L3:5 L3:6 L3:7 | $$ |
| 30 | time · time · l3compound · 2 scaling steps | 506 | 9.2 | 7.8–10.1 | L3:1 L3:2 L3:3 L3:4 L3:5 | $$ |
| 31 | mixed · time · l3compound · 2 scaling steps | 176 | 9.3 | 7.9–10.1 | L3:1 L3:2 L3:3 L3:4 L3:5 L3:6 | $$ |
| 32 | mixed · speed · l3awkward · 2 scaling steps | 173 | 9.3 | 7.3–10.3 | L3:1 L3:2 L3:3 L3:4 L3:5 L3:6 L3:7 | $$ |
| 33 | distance · distance · l3awkward · 2 scaling steps | 523 | 9.3 | 7.3–10.3 | L3:1 L3:2 L3:3 L3:4 L3:5 L3:6 L3:7 | $$ |
| 34 | speed · speed · l3awkward · 2 scaling steps | 488 | 9.4 | 7.3–10.3 | L3:1 L3:2 L3:3 L3:4 L3:5 L3:6 L3:7 | $$ |
| 35 | mixed · time · l3awkward · 2 scaling steps | 165 | 9.7 | 7.8–10.8 | L3:1 L3:2 L3:3 L3:4 L3:5 L3:6 L3:7 L3:8 | $$ |
| 36 | time · time · l3awkward · 2 scaling steps | 502 | 9.8 | 7.8–10.8 | L3:1 L3:2 L3:3 L3:4 L3:5 L3:6 L3:7 | $$ |
| 37 | distance · distance · l3compound · 2 scaling steps · decimal | 226 | 10.2 | 8.6–11.1 | L3:2 L3:3 L3:4 L3:5 L3:6 L3:7 L3:8 | $$ |
| 38 | mixed · distance · l3compound · 2 scaling steps · decimal | 81 | 10.2 | 8.8–11.1 | L3:2 L3:3 L3:4 L3:5 L3:6 L3:7 L3:8 | $$ |
| 39 | mixed · speed · l3awkward · 2 scaling steps · decimal | 143 | 10.4 | 9–11.3 | L3:3 L3:4 L3:5 L3:6 L3:7 L3:8 | $$ |
| 40 | speed · speed · l3awkward · 2 scaling steps · decimal | 485 | 10.5 | 9–11.4 | L3:3 L3:4 L3:5 L3:6 L3:7 L3:8 | $$ |
| 41 | mixed · distance · l3awkward · 2 scaling steps · decimal | 85 | 10.6 | 9.1–11.4 | L3:3 L3:4 L3:5 L3:6 L3:7 L3:8 | $$ |
| 42 | distance · distance · l3awkward · 2 scaling steps · decimal | 273 | 10.6 | 9.1–11.4 | L3:3 L3:4 L3:5 L3:6 L3:7 L3:8 | $$ |
| 43 | mixed · time · l3compound · 2 scaling steps · decimal | 82 | 10.6 | 9.4–11.6 | L3:4 L3:5 L3:6 L3:7 L3:8 | $$ |
| 44 | time · time · l3compound · 2 scaling steps · decimal | 247 | 10.7 | 9.1–11.6 | L3:2 L3:3 L3:4 L3:5 L3:6 L3:7 L3:8 | $$ |
| 45 | mixed · time · l3awkward · 2 scaling steps · decimal | 85 | 11.1 | 9.6–11.9 | L3:4 L3:6 L3:7 L3:8 | $$ |
| 46 | time · time · l3awkward · 2 scaling steps · decimal | 245 | 11.1 | 9.6–11.9 | L3:3 L3:5 L3:6 L3:7 L3:8 | $$ |
