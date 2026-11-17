# Tool Spec: Solving Trig Equations

**Status:** draft <!-- draft → ready → implemented. Claude Code only implements specs marked `ready`. -->

Designed in chat with Harry (17 Nov 2026), ahead of his radians lessons. Open points that block `ready` are listed in section 6.

---

## 1. Overview

| Field | Value |
|---|---|
| Tool name | Solving Trig Equations |
| Tool id / URL path | `/solving-trig-equations` |
| Category | Pure Mathematics (A-level) — file in `src/tools/Algebra/SolvingTrigEquations.tsx` |
| Card description | Solve sin, cos and tan equations in a given range, in degrees or radians, with a graph that builds the solutions up step by step. |
| Defaults | standard |

**Pedagogical intent:** after a lesson built on this tool a student can solve `sin`, `cos` and `tan` equations in a stated interval, finding every solution in the range from the principal value, the symmetry of the curve and its period, in degrees or radians. Levels add one idea each: the argument becomes `kθ`, then `kθ ± c`, where the range must be transformed first. It follows the unit circle and exact trig values, and comes before quadratic trig equations and identities (separate future tools).

---

## 2. Sub-tools

| Key | Tab label | Kind | Instruction line |
|---|---|---|---|
| `solve` | Solve | simple | Solve, for the given range: |

One sub-tool, so the tab bar is hidden automatically. Quadratics in trig, and `sin θ = k cos θ` / `sin²θ + cos²θ` work, are separate future sub-tools, not Level 4.

---

## 3. Sub-tool detail

### Sub-tool: Solve (`solve`)

#### 3.1 Question options (QO)

Three **independent** properties, so they stay separate controls (R19). Group labels follow the site vocabulary (R20).

- **multiSelect** `functions` — "Functions":
  - `sin` — "sin" — defaultActive: true
  - `cos` — "cos" — defaultActive: true
  - `tan` — "tan" — defaultActive: true
- **exclusive** `unit` — "Angle Unit" (changes the numbers, so it is **not** `displayOnly`, R14):
  - `deg` — "Degrees" — defaultActive: true
  - `rad` — "Radians" — defaultActive: false
- **multiSelect** `ranges` — "Ranges" (the options shown follow the unit):
  - Degrees: `r0_360` "0 ≤ θ ≤ 360" · `r0_720` "0 ≤ θ ≤ 720" · `r180` "−180 ≤ θ ≤ 180" · `r360` "−360 ≤ θ ≤ 360" · `r0_180` "0 ≤ θ ≤ 180" (Levels 2–3 only)
  - Radians: `r0_2pi` "0 ≤ θ ≤ 2π" · `r0_4pi` "0 ≤ θ ≤ 4π" · `rpi` "−π ≤ θ ≤ π" · `r2pi` "−2π ≤ θ ≤ 2π" · `r0_pi` "0 ≤ θ ≤ π" (Levels 2–3 only)
  - Defaults are in **Per-level differences**.
- **multiSelect** `forms` — "Equation Form" (a pool applies exactly one option per question; teachers tick several):
  - `direct` — "Direct: sin θ = ½" — defaultActive: true
  - `scaled` — "a·sin θ = c: 2 sin θ = 1" — defaultActive: false
  - `shifted` — "a·sin θ + b = c: 2 sin θ + 2 = 1" — defaultActive: false
  - `negative` — "b − a·sin θ = c: 1 − 2 sin θ = 2" — defaultActive: false (the sign-flip trap)
- **multiSelect** `values` — "Values":
  - `exact` — "Exact (½, √2/2, √3/2, 1/√3…)" — defaultActive: true
  - `decimal` — "Decimal (calculator): 0.3, −0.72" — defaultActive: false
  - `extremes` — "Include 0 and ±1" — defaultActive: false (single or boundary solutions)
- **Per-level differences:**
  - Level 1: `ranges` default active `r0_360`, `r0_720`, `r180`; `r360` off; `r0_180` not offered.
  - Level 2: `ranges` default active `r0_360`, `r0_180`; others off. Extra pool **"Argument"** (multiSelect): `multiple` "kθ (k = 2, 3)" active · `half` "θ/2" off · `shift` "θ ± c (shift only)" off.
  - Level 3: `ranges` default active `r0_360`, `r0_180`; others off. Pool "Argument": `both` "kθ ± c" active · `half` "θ/2 ± c" off.

Radians are **never** a display toggle: shifts are chosen as multiples of π/12 (section 3.2), so the question differs from its degree twin.

**Differentiated worksheet mode:** each column starts from its level's defaults above.

#### 3.2 Levels

Every question is **built backwards**: choose the function, the exact value `k` and the argument, then the range; derive the rearranged form (if any) from `k`. Never generate a no-solution equation (|k| > 1 or tan with no value). Solutions are computed from the principal value `α` as: sin → `α` and `180° − α` (π − α); cos → `±α`; tan → `α`; then add the period (360° / 2π, tan 180° / π) and keep those inside the range. Working and answers come from the same list (R5).

Value table (exact): sin and cos take `±½`, `±√2/2`, `±√3/2`; tan takes `±√3/3`, `±1`, `±√3`. With `extremes` on, add `0` and `±1` for sin and cos, and `0` for tan. Exact tan shows `√3/3` (not `1/√3`), consistent with the Unit Circle tool.

**Level 1 (the equation `trig θ = k`):**
- Parameters: function ∈ `functions`; `k` from the value table; range from `ranges`; unit from `unit`; form from `forms`.
- Constraints: argument is just `θ`. Solutions listed in ascending order. Number of solutions follows from the range: sin, cos and tan each give 2 per 360° (2π) (tan because its period is 180°), so 0–360 has 2 solutions and 0–720 has 4.
- Exclusions: ranges where fewer than 2 solutions exist (except with `extremes` on); `k` outside the table.
- Misconceptions targeted: giving only the principal value; the wrong second solution (180° − α used for cos, 360° − α used for sin); adding 360° for tan when the period is 180°; missing the repeats in 0–720; negative ranges where the principal value of a negative `k` is itself negative or lies outside the range.

**Level 2 (a coefficient of θ — range must be widened first):**
- Parameters: argument `kθ` with `k ∈ {2, 3}` (plus `θ/2` and `θ ± c` when ticked); everything else as Level 1. For shift-only (`θ ± c`) `c` is a multiple of 5° up to 60° (radians: π/12 up to π/3) and `k = 1`.
- Constraints: at least one level-defining property is guaranteed (R26): `k ≥ 2` gives at least 4 solutions in a 0–360 range for sin and cos. All solutions are exact; with `k = 2` and the 45°-family values a half-degree answer (e.g. 22.5°) is allowed.
- Exclusions: `k = 3` with ranges producing more than 6 solutions; `θ/2` with a range that leaves fewer than 1 solution.
- Misconceptions targeted: dividing the principal value by `k` and stopping (half the solutions missing); solving in the original range instead of the widened range; dividing only the first value.

**Level 3 (a linear argument `kθ ± c`):**
- Parameters: `k ∈ {2, 3}`; `c` chosen so **every** solution of the question is a whole number of degrees (radians: a multiple of π/36 or simpler, denominator ≤ 36 when reduced). In degrees `c ∈ {10, 15, 20, 25, 30, 40, 45, 50, 60}`; in radians `c ∈ {π/12, π/6, π/4, π/3}`. The sign of `c` is random.
- Constraints: the transformed range `kθ ± c` starts **below zero** in at least a third of questions (a `− c` shift), guaranteeing a solution that comes from a negative starting angle; both `k` and `c` always present. Sign and order of the inverse (add `c` first, then divide by `k`) always matters.
- Exclusions: any `c` that gives a non-integer degree solution; questions with 0 solutions.
- Misconceptions targeted: halving before adding the shift; subtracting the shift instead of adding; ignoring that the transformed range starts negative (losing a solution); missing a final solution just inside the range.

**Rearranged forms (all levels, when ticked):** `scaled` `a·f = c` (a ∈ {2, 3, 4}, c = a·k); `shifted` `a·f + b = c` (a ∈ {2, 3}, b ∈ {−3…3} ≠ 0, c = a·k + b); `negative` `b − a·f = c` (a ∈ {1, 2, 3}, c = b − a·k). The generator chooses `k` first, then derives `a, b, c` so the rearranged equation yields exactly `k`, then displays it. Misconception: dividing by a negative coefficient and not flipping the sign of `k`.

**House style for answers:** `θ = 60°, 300°` / `θ = \frac{\pi}{3}, \frac{5\pi}{3}`, ascending. Exact radian answers are reduced multiples of π (`5π/12`, `π`, `0`); never decimals unless `decimal` values are ticked, in which case degrees are given to 1 d.p. and radians to 3 s.f. (computed exactly then rounded, never accumulated rounding).

#### 3.2b Picture spec — the developing picture

This is a **developing picture**: one graph updates in place beside the working (`stepVisualRenderer` + `stepVisualKeepsWorking`, the "Keep working" flavour in `docs/reference/pictures.md`). It uses the graph build, the same mechanism as Equations of Lines.

- **What's drawn:** the graph of `y = f(u)` for the function in the question (the *argument* `u`, so Level 1 is `y = f(θ)`), over the question's range (for Levels 2–3, over the **transformed** range of `u`, shaded to show the widened range). A dashed horizontal line `y = k` is drawn from the first step. The frame is computed from the full range, so the view never jumps.
- **Axes:** degrees (ticks at multiples of 90°, with minor ticks at 30° or 45°) or radians (ticks labelled as multiples of π: `π/6`, `π/2`, `π`, `3π/2`, `2π`…), chosen by `unit`. The y-axis marks `k`.
- **Developing order** (one beat per working step):
  1. the curve, the range and the line `y = k`;
  2. the principal value as a dot on the curve, labelled;
  3. the second solution as a dot, with the symmetry shown (a mirror guide about the curve's line of symmetry, or the gap from the period);
  4. each repeat added a period on, ringed as it appears, until the range is full;
  5. (Levels 2–3) the final step drops the shading and relabels the solution dots with their θ values.
- **Labelling:** solution dots labelled in the working's own units; the unknown is `u` while solving and `θ` in the answer. Colour: curve in the tool's accent, line `y = k` in grey dashed, solution dots green (as in the answer line).
- **Reference implementation to follow:** `EquationsOfLines` (graph build with `graphStep`, `GraphBuildSpec`) and `src/shared/grapher/` docs in `docs/reference/pictures.md`.
- **Known gap — to resolve before the build:** `SmartGrapher` has sine, cosine and tangent curve types but works in **radians** with numeric tick labels. This tool needs (a) a **degree** x-axis, (b) **π tick labels** (`π/6`…), (c) trig functions of a degrees argument. The preferred route is a small, general extension of `SmartGrapher` (a tick formatter and unit option), since the Unit Circle sandbox and later trig tools want it too; the fallback is a dedicated SVG picture using the diagram-split pattern. Decide this at the start of the build.
- **Worksheet cell:** no picture (an equation with an answer line); the picture appears in Whiteboard (after "Show answer") and Worked Example only.

**Possible v2 (not in the first build):** a second linked picture for Levels 2–3 that shows the transformation, with the graph morphing from the graph of `y = f(u)` back to `y = f(kθ ± c)` in θ.

#### 3.3 Worked example script

The final step states the answer, so the separate answer box is hidden (`hideAnswerStep`). Prose never goes inside the maths (R7); the degree sign is the third `mStep` argument.

**Level 1 example — `cos θ = 1/2, 0 ≤ θ ≤ 720`**
1. `mStep("Principal value:", "\\theta = \\cos^{-1}\\left(\\tfrac{1}{2}\\right) = 60", "°")`
2. `mStep("cos is symmetrical about 360°, so the second solution is:", "\\theta = 360 - 60 = 300", "°")`
3. `mStep("Add 360° to each to find the solutions up to 720°:", "\\theta = 60 + 360 = 420 \\quad \\theta = 300 + 360 = 660", "°")`
4. `mStep("Answer:", "\\theta = 60,\\ 300,\\ 420,\\ 660", "°")`

(Radians: the same with `π/3`, `2π − π/3 = 5π/3`, add `2π`.) For sin the second solution is `180° − α` (π − α); for tan there is no second step, the period is 180° (`π`), so the repeats are `α`, `α + 180°`, `α + 360°`…. When the principal value is outside the range (e.g. `−60°`), a step says so and adds one period to bring it in. When the equation is **rearranged** the working gets an opening step first: `mStep("Rearrange:", "2\\sin\\theta + 2 = 1 \\;\\Rightarrow\\; \\sin\\theta = -\\tfrac{1}{2}")` (two lines if the rearrangement takes two moves).

**Level 2 example — `cos 2θ = 1/2, 0 ≤ θ ≤ 360`**
1. `mStep("Let u = 2θ. The range for u is 0 ≤ u ≤ 720:", "0 \\le 2\\theta \\le 720")`
2. `mStep("Principal value:", "2\\theta = 60", "°")`
3. `mStep("Second solution:", "2\\theta = 360 - 60 = 300", "°")`
4. `mStep("Add 360° to stay within 720°:", "2\\theta = 420 \\quad 2\\theta = 660", "°")`
5. `mStep("Divide by 2:", "\\theta = 30,\\ 150,\\ 210,\\ 330", "°")`  *(the closing answer step)*

**Level 3 example — `cos(2θ − 40°) = 1/2, 0 ≤ θ ≤ 360`**
1. `mStep("Let u = 2θ − 40. The range for u is:", "-40 \\le 2\\theta - 40 \\le 680")`
2. `mStep("Principal value:", "2\\theta - 40 = 60", "°")`
3. `mStep("Second solution:", "2\\theta - 40 = 360 - 60 = 300", "°")`
4. `mStep("Add 360° while it is still in range (780 is too big):", "2\\theta - 40 = 420 \\quad 2\\theta - 40 = 660", "°")`
5. `mStep("Add 40 to each, then divide by 2:", "\\theta = 50,\\ 170,\\ 230,\\ 350", "°")`  *(the closing answer step)*

Where a negative range start brings an extra solution in (e.g. `−300`), a step adds `−360` as well, and says so.

#### 3.4 Sample questions (acceptance set)

All answers verified by substitution.

| Level | Question as displayed | Answer | Working (one line) |
|---|---|---|---|
| 1 | cos θ = ½, 0 ≤ θ ≤ 360 | θ = 60°, 300° | α = 60°; 360° − 60° = 300° |
| 1 | sin θ = −√3/2, 0 ≤ θ ≤ 720 | θ = 240°, 300°, 600°, 660° | α = −60°; 180° + 60° = 240°; −60° + 360° = 300°; add 360° |
| 1 | tan θ = 1, 0 ≤ θ ≤ 360 | θ = 45°, 225° | α = 45°; add 180° |
| 1 | tan θ = −√3/3, −180 ≤ θ ≤ 180 | θ = −30°, 150° | α = −30°; −30° + 180° = 150° |
| 1 | cos θ = −√2/2, 0 ≤ θ ≤ 2π | θ = 3π/4, 5π/4 | α = 3π/4; 2π − 3π/4 = 5π/4 |
| 1 | sin θ = ½, 0 ≤ θ ≤ 4π | θ = π/6, 5π/6, 13π/6, 17π/6 | α = π/6; π − π/6 = 5π/6; add 2π |
| 1 (shifted) | 2 sin θ + 2 = 1, 0 ≤ θ ≤ 360 | θ = 210°, 330° | sin θ = −½; α = −30°; 180° + 30° = 210°; −30° + 360° = 330° |
| 1 (negative) | 1 − 2 sin θ = 2, 0 ≤ θ ≤ 360 | θ = 210°, 330° | −2 sin θ = 1; sin θ = −½ |
| 2 | cos 2θ = ½, 0 ≤ θ ≤ 360 | θ = 30°, 150°, 210°, 330° | 0 ≤ 2θ ≤ 720; 2θ = 60, 300, 420, 660; ÷ 2 |
| 2 | sin 3θ = √3/2, 0 ≤ θ ≤ 360 | θ = 20°, 40°, 140°, 160°, 260°, 280° | 0 ≤ 3θ ≤ 1080; 3θ = 60, 120, 420, 480, 780, 840; ÷ 3 |
| 2 | tan 2θ = −√3, 0 ≤ θ ≤ 360 | θ = 60°, 150°, 240°, 330° | 2θ = 120, 300, 480, 660 (period 180°); ÷ 2 |
| 2 | sin 2θ = −½, 0 ≤ θ ≤ 2π | θ = 7π/12, 11π/12, 19π/12, 23π/12 | 0 ≤ 2θ ≤ 4π; 2θ = 7π/6, 11π/6, 19π/6, 23π/6; ÷ 2 |
| 3 | cos(2θ − 40°) = ½, 0 ≤ θ ≤ 360 | θ = 50°, 170°, 230°, 350° | −40 ≤ u ≤ 680; u = 60, 300, 420, 660; θ = (u + 40)/2 |
| 3 | sin(2θ + 30°) = −½, 0 ≤ θ ≤ 360 | θ = 90°, 150°, 270°, 330° | 30 ≤ u ≤ 750; u = 210, 330, 570, 690; θ = (u − 30)/2 |
| 3 | tan(2θ − 25°) = 1, 0 ≤ θ ≤ 360 | θ = 35°, 125°, 215°, 305° | −25 ≤ u ≤ 695; u = 45, 225, 405, 585; θ = (u + 25)/2 |
| 3 (shifted) | 2 cos(2θ − 40°) + 1 = 2, 0 ≤ θ ≤ 360 | θ = 50°, 170°, 230°, 350° | cos(2θ − 40°) = ½ (as above) |
| 3 | cos(2θ − π/6) = −½, 0 ≤ θ ≤ 2π | θ = 5π/12, 3π/4, 17π/12, 7π/4 | −π/6 ≤ u ≤ 23π/6; u = 2π/3, 4π/3, 8π/3, 10π/3; θ = (u + π/6)/2 |

#### 3.5 Uniqueness

Key parameters: function, form, `k`, argument (`k`, `c`, sign), range, unit, values mode (and the rearranged coefficients `a, b`).

**Pool size:** at default options Level 1 has 18 exact values × 3 ranges = 54; Level 2 has 18 × 2 values of k × 2 ranges = 72; Level 3 has far more (k × c × sign). Each level must fill a 30-question worksheet (`recentQuestions.test.ts`) at its defaults, so the default `ranges` are deliberately more than one.

---

## 4. Variety requirements

- Spread the three functions and both signs of `k` across a worksheet; do not cluster on `k = ½`.
- At Level 1, mix positive and negative `k` so students meet the third and fourth quadrant solutions.
- At Level 3, mix `+ c` and `− c`; keep the `− c` (negative-start) rule from the Constraints.
- Rearranged forms (when ticked): vary `a` and `b` and spread across the three variants.
- No worded contexts.

---

## 5. Info modal content (`SolvingTrigEquations.about.ts`)

- **Tool purpose:** Practise solving sin, cos and tan equations in a given range, in degrees or radians, finding every solution.
- **Solve:**
  - Level 1 — the equation is a trig function of θ equal to an exact value, in a stated range.
  - Level 2 — the angle is a multiple of θ, so the range has to be widened before solving.
  - Level 3 — the angle is a multiple of θ plus or minus a shift, so the transformed range can start below zero.
- **Option explainers (R11):** "Angle Unit" — whether the angles and the range are in degrees or in radians. "Ranges" — the interval the solutions must lie in. "Equation Form" — whether the trig function stands alone or needs rearranging first. "Values" — exact values, calculator decimals, and whether to include the single-solution cases (0 and ±1). "Functions" — which of sin, cos and tan appear. Every option explained, none listing its choices.

---

## 6. Out of scope / future ideas / open points

**Open — resolve before `ready`:**
1. **Audience.** Coefficients and shifts are A-level Pure; Level 1 (degrees, 0–360, exact values) is also GCSE. Confirm the A-level category, and whether Level 1 should be reachable from a GCSE strand.
2. **The grapher extension** (degree axis, π tick labels, trig of a degrees argument) vs a dedicated SVG picture: decide at the start of the build (section 3.2b).
3. **`decimal` values.** Included as an option; confirm it is wanted in the first build or left until after the radians unit.

**Not in this tool:** quadratic trig (`2sin²θ − sin θ = 0`), identities (`tan θ = sin θ / cos θ` equations, `sin² + cos² = 1` substitutions), and reciprocal functions. These are separate future sub-tools, not Level 4.

**Ideas:** link to the Unit Circle sandbox from the working ("see it on the circle"); the v2 transformation picture for Levels 2–3; a teacher choice of whether the symmetry rule is shown as the graph or the CAST diagram.
