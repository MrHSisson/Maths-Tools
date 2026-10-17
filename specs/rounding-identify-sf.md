# Tool Spec: Rounding — Identify Significant Figures (new sub-tool)

**Status:** implemented

A new fourth tab on the existing Rounding tool (`src/tools/Number/Rounding.tsx`, `/rounding`),
beside Nearest 10/100/1000, Decimal Places and Significant Figures. It teaches *which digits count*
before students round to a number of significant figures.

## 1. Overview

| Field | Value |
|---|---|
| Tool | Rounding (existing) — new sub-tool `identifySf`, tab label **Identify Sig. Figs** |
| Kind | `simple` (digit boxes drawn by a `questionRenderer`; Level 3 counting questions may be `worded`) |
| Defaults | as Rounding (2 columns, `maxColumnsByLevel` unchanged) |

**Pedagogical intent:** students can say which digits of a number are significant, name the 1st, 2nd and 3rd
significant figure, and count them, handling trapped, leading and trailing zeros. It sits *before* Significant Figures
(rounding) in the teaching sequence.

## 2. Task (Question Options)

- **multiSelect** `sfTask` — "Task" (default: all on; one drawn per question):
  - `mark` — "Mark them" — the number is shown as digit boxes; students circle/shade the significant digits. Answer: the significant digits shaded.
  - `name` — "Name the 1st, 2nd or 3rd" — "Write the 2nd significant figure of 0.04052." Answer: the digit.
  - `count` — "Count them" — "How many significant figures does 120.00 have?" Answer: the count.
- **multiSelect** `sfKind` — "Numbers": `wholes` ("Whole numbers", default on) · `decimals` ("Decimals", default on). Same option the Significant Figures tab already has; a number is a decimal if it has a decimal point.
- **multiSelect** `sfZeros` — "Zeros (Levels 2–3)": `trapped` · `leading` · `trailing`, a question draws one type of zero to make the point (default: the level's own types on). A number may contain several zeros of that kind.

Differentiated worksheet columns start with each level's own options as below.

## 3. Levels

**Level 1 — no zeros to judge.** Whole numbers 100–99 999 and decimals (e.g. 4 718, 3.526, 62.41) with **no zero digits**.
Every digit counts, so Mark and Count would be trivial: **Level 1 is always 'Name one'** (the 1st, 2nd or 3rd). Options: Numbers only.
*Misconception:* students count digits after the decimal point only, or skip the first digit. Numbers use 3–6 digits.

**Level 2 — trapped and leading zeros.**
- Trapped zeros between non-zero digits (3 052, 4.0071, 20.5) — they count.
- Leading zeros (0.0472, 0.00305; none on whole numbers) — they never count.
- Options: Zeros = trapped, leading (both default on). Shown as the two-way cycle button (Trapped only → Mixed 50/50 → Leading only); both options carry a `weight` so a worksheet keeps the Mixed split close to even. Leading zeros force a decimal; trapped numbers may be whole or decimal. Trapped zeros are underlined in the answer picture.
- Constraints: at least one zero of a type that is switched on; the number never also has a trailing zero.
*Misconception:* "zeros never count" / "all zeros count" — each number has a zero of the type being tested, and the count differs from the digit count.

**Level 3 — trailing zeros and mixed.**
- Trailing zeros after the decimal point **count** (120.00 → 5 s.f.; 0.0450 → 3 s.f.).
- Trailing zeros of a whole number **do not count** — 1 200 is 2 s.f., 45 000 is 2 s.f. (house convention: ambiguity is resolved as 2 s.f.; the Info section states it).
- Mixed: any of trapped, leading, trailing together (e.g. 0.002040, 30 600). Options: Zeros = trapped, leading, trailing (all default on).
- Constraints: every question has at least two kinds of zero or a trailing zero.
*Misconception:* "trailing zeros never count" or "always count" — chosen so the wrong rule gives a different answer. Each of the three tasks appears.

## 4. Worked example (Whiteboard reveals; Worked Example steps)

Steps (each fragmented by the board-writing rule):
1. `tStep` — "The first significant figure is the first non-zero digit."
2. A digit-box picture: leading zeros greyed, significant digits shaded blue, trapped zeros ringed with "counts — between non-zero digits", trailing zeros ringed with "counts — after the decimal point" or greyed with "does not count — whole number" as appropriate.
3. Final `mStep("Answer:", …)` — the shaded digits, the nth digit, or the count.

Example, count task: **120.00** → "1 is the first significant figure; the zero after it is trapped between significant digits… all five digits count because the zeros come after the decimal point" → **5**.

## 5. Sample questions (acceptance set)

| Level | Task | Question | Answer |
|---|---|---|---|
| 1 | mark | 4718 | all four digits significant |
| 1 | name | 2nd significant figure of 3.526 | 5 |
| 1 | count | How many s.f. in 62.41? | 4 |
| 2 | mark | 0.00305 | 3, 0, 5 (the two zeros before the 3 do not count; the zero after counts) |
| 2 | name | 3rd significant figure of 4.0071 | 0 |
| 2 | count | How many s.f. in 3052? | 4 |
| 3 | count | How many s.f. in 120.00? | 5 |
| 3 | count | How many s.f. in 1200? | 2 |
| 3 | name | 3rd significant figure of 0.002040 | 4 |

## 6. Info section text

- *Overview:* significant figures are the digits that carry meaning, starting from the first non-zero digit.
- *Zeros:* leading zeros never count; trapped zeros always count; trailing zeros count after a decimal point but not on a whole number (so 1 200 is taken as 2 s.f.).
- *Task / Numbers / Zeros:* what each Question Option does.

## 7. Build notes

- New `ToolType` `"identifySf"`; add the sub-tool to `TOOL_CONFIG`, a generator, a `questionRenderer` branch (digit boxes, reusing the `DigitsView` styling), working steps, and `__test` coverage.
- Single-digit-box picture needs `hideFontControls`-style handling consistent with the other Rounding levels; print through `handleDiagramPrint` for `mark`, text print for `name`/`count` (mixed sheets use `_printText`).
- The sub-tool has no `levels` restriction (three levels).
- Add a test asserting every sample question's answer against an independent significant-figure counter, for 1000+ random questions per level.
