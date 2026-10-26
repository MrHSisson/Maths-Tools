# Surds — difficulty calibration

Generated from **22500** questions — each sub-tool × level sampled across random combinations of ALL its Question Options. Regenerate: `CALIBRATE=1 npx vitest run src/tests/surdsDifficulty.test.ts`.

## How a question is scored

The raw score is the work the question asks for, added up — **not** a weight on the option that produced it. Higher = harder.

| Piece | Cost |
|---|---|
| Start | 0.5 |
| Each step of the working | 0.35 |
| Size of the numbers | 0.9 × log₁₀(biggest number in the question + 1) |
| Surds in the question | 0.4 each (up to 5) |
| Brackets | 0.6 each (up to 2) |
| A fraction | +1 |
| Letters | 0.5 per different letter (up to 2) |

## The eight bands

A worksheet is ordered by **band** (1 easiest … 8 hardest); questions in a band mingle in random order. Bands are relative to the sub-tool + level: the cut points are the 12.5% … 87.5% quantiles of what that level can generate.

| Sub-tool · level | n | Cut points | Share per band (1 … 8) | Min | Median | Max |
|---|---|---|---|---|---|---|
| simplify:level1 | 1500 | 2.9 · 3.2 · 3.4 · 3.5 · 3.6 · 3.7 · 3.8 | 12% 12% 10% 8% 11% 10% 14% 24% | 2.2 | 3.5 | 3.9 |
| simplify:level2 | 1500 | 3.2 · 3.5 · 3.7 · 3.9 · 4 · 4.1 · 4.2 | 11% 11% 11% 17% 11% 10% 10% 20% | 2.6 | 3.9 | 4.3 |
| simplify:level3 | 1500 | 4.1 · 4.3 · 4.4 · 4.5 · 4.6 · 4.7 · 4.8 | 8% 14% 12% 19% 13% 11% 10% 12% | 3.9 | 4.4 | 4.9 |
| addSub:level1 | 1500 | 2.8 · 2.9 · 3 · 3.1 · 3.2 · 3.3 · 3.4 | 8% 7% 19% 40% 19% 6% 0% 0% | 2.4 | 3 | 3.2 |
| addSub:level2 | 1500 | 2.9 · 3 · 3.1 · 4.3 · 4.5 · 4.7 · 4.9 | 11% 7% 16% 15% 7% 15% 11% 17% | 2.4 | 4.3 | 5 |
| addSub:level3 | 1500 | 4 · 4.2 · 4.7 · 4.9 · 5 · 6.5 · 6.7 | 11% 10% 13% 15% 6% 19% 8% 18% | 3.5 | 4.9 | 6.9 |
| multiplyDivide:level1 | 1500 | 3.2 · 3.5 · 3.7 · 3.8 · 4 · 4.2 · 4.4 | 10% 12% 16% 7% 15% 11% 13% 17% | 2.5 | 3.8 | 4.8 |
| multiplyDivide:level2 | 1500 | 3.8 · 4 · 4.2 · 4.4 · 4.6 · 4.9 · 5.1 | 12% 8% 14% 15% 9% 15% 10% 17% | 3.1 | 4.4 | 5.4 |
| multiplyDivide:level3 | 1500 | 4.3 · 4.4 · 4.6 · 4.9 · 5.5 · 5.7 · 5.9 | 9% 7% 18% 16% 12% 10% 10% 19% | 4.1 | 4.9 | 6.1 |
| expand:level1 | 1500 | 3.2 · 3.3 · 3.4 · 3.5 · 3.6 · 3.9 · 4 | 10% 19% 34% 0% 0% 7% 10% 20% | 2.8 | 3.3 | 4 |
| expand:level2 | 1500 | 3.2 · 3.3 · 3.7 · 3.9 · 4 · 4.1 · 4.6 | 5% 10% 18% 16% 24% 9% 4% 14% | 3 | 3.9 | 5.3 |
| expand:level3 | 1500 | 4.6 · 5.2 · 5.3 · 5.4 · 5.5 · 5.8 · 6.1 | 9% 15% 14% 18% 9% 5% 16% 14% | 4.2 | 5.3 | 6.4 |
| rationalise:level1 | 1500 | 4.2 · 4.5 · 5.4 · 5.8 · 6.7 · 7.5 · 7.8 | 11% 12% 11% 15% 13% 13% 12% 13% | 3.7 | 5.8 | 7.8 |
| rationalise:level2 | 1500 | 5.7 · 5.8 · 5.9 · 7.9 · 8 · 8.2 · 8.3 | 8% 8% 10% 22% 12% 12% 26% 0% | 5.3 | 7.9 | 8.2 |
| rationalise:level3 | 1500 | 5.2 · 5.4 · 5.5 · 5.7 · 5.8 · 6.1 · 6.5 | 10% 12% 10% 12% 13% 16% 12% 15% | 4.5 | 5.7 | 7.6 |

## Categories, easiest to hardest (12 found)

A category is a coarse fingerprint of the question's structure; within it the score still varies with the actual numbers.

| # | Category | n | Mean | Range | Bands (level:band) | Example |
|---|---|---|---|---|---|---|
| 1 | addSub · addSub · 2 surds | 3000 | 3.5 | 2.4–5 | L1:1 L1:2 L1:3 L1:4 L1:5 L1:6 L2:1 L2:2 L2:3 L2:4 L2:5 L2:6 L2:7 L2:8 | $4\sqrt{17} + 2\sqrt{17}$ |
| 2 | simplify · simplify · 1 surd | 4500 | 3.9 | 2.2–4.9 | L1:1 L1:2 L1:3 L1:4 L1:5 L1:6 L1:7 L1:8 L2:1 L2:2 L2:3 L2:4 L2:5 L2:6 L2:7 L2:8 L3:1 L3:2 L3:3 L3:4 L3:5 L3:6 L3:7 L3:8 | $\sqrt{49}$ |
| 3 | multiplyDivide · multiplyDivide · 2 surds | 1524 | 4.0 | 2.5–5.3 | L1:1 L1:2 L1:3 L1:4 L1:5 L1:6 L1:7 L2:1 L2:2 L2:3 L2:4 L2:5 L2:6 L2:7 L2:8 | $\sqrt{5} \times \sqrt{6}$ |
| 4 | addSub · addSub · 2 surds · brackets · letters | 481 | 4.0 | 3.5–4.3 | L3:1 L3:2 L3:3 | $(4x + 8)\sqrt{15} + 5x\sqrt{15}$ |
| 5 | expand · expand · 2 surds · brackets | 4250 | 4.2 | 2.8–6.4 | L1:1 L1:2 L1:3 L1:6 L1:7 L1:8 L2:1 L2:2 L2:3 L2:4 L2:5 L2:6 L2:7 L2:8 L3:1 L3:2 L3:3 L3:4 L3:6 L3:7 L3:8 | $2\sqrt{6}(9 + 4\sqrt{2})$ |
| 6 | multiplyDivide · multiplyDivide · 2 surds · letters | 1476 | 4.3 | 3–5.4 | L1:1 L1:2 L1:3 L1:4 L1:5 L1:6 L1:7 L1:8 L2:1 L2:2 L2:3 L2:4 L2:5 L2:6 L2:7 L2:8 | $x\sqrt{120} \div \sqrt{6}$ |
| 7 | addSub · addSub · 2 surds · brackets | 512 | 4.9 | 4.4–5.1 | L3:3 L3:4 L3:5 L3:6 | $(6 + \sqrt{7}) - (4 - \sqrt{7})$ |
| 8 | multiplyDivide · multiplyDivide · 2 surds · fraction | 1500 | 5.1 | 4.1–6.1 | L3:1 L3:2 L3:3 L3:4 L3:5 L3:6 L3:7 L3:8 | $\dfrac{4\sqrt{28}}{8} \times \dfrac{4}{6\sqrt{7}}$ |
| 9 | expand · expand · 4 surds · brackets | 250 | 5.3 | 4.8–5.4 | L3:2 L3:3 L3:4 L3:5 | $(3\sqrt{11} + 2\sqrt{7})(3\sqrt{11} - 2\sqrt{7})$ |
| 10 | rationalise · rationalise · 1 surd · fraction | 2249 | 5.8 | 3.7–7.8 | L1:1 L1:2 L1:3 L1:4 L1:5 L1:6 L1:7 L1:8 L3:1 L3:2 L3:3 L3:4 L3:5 L3:6 | $\dfrac{11}{\sqrt{19}}$ |
| 11 | addSub · addSub · 4 surds | 507 | 6.6 | 6.1–6.9 | L3:6 L3:7 L3:8 | $2\sqrt{126} - 2\sqrt{350} - 3\sqrt{52} - \sqrt{208}$ |
| 12 | rationalise · rationalise · 2 surds · fraction | 2251 | 6.7 | 4.9–8.2 | L2:1 L2:2 L2:3 L2:4 L2:5 L2:6 L2:7 L3:1 L3:2 L3:3 L3:4 L3:5 L3:6 L3:7 L3:8 | $\dfrac{3 - 3\sqrt{5}}{\sqrt{80}}$ |
