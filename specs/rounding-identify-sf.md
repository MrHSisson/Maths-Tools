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

## 3. Levels — the shared zeros ladder

Identify Sig. Figs and the Significant Figures (rounding) tab use the **same ladder**, set by the zeros in the number:

| Level | Zeros (two- or four-button multiselect, `sfZeros`) |
|---|---|
| 1 | `none` (no zeros) · `trapped` |
| 2 | `leading` · `trailing` |
| 3 | all four |

Each question is about **one** kind, drawn uniformly from the buttons ticked (weighted so a worksheet keeps the split near even). Leading zeros force a decimal (with decimals switched off another kind is used).

- **Level 1:** always **Name one** (1st, 2nd or 3rd s.f.): with no zero or only trapped zeros every digit counts, so Mark and Count would be trivial. Numbers 3–5 digits; trapped numbers like 3052, 30.52.
- **Level 2:** leading (0.00305: "0." plus 1–3 zeros then 2–4 digits) or trailing (1200, 120.00, 0.0450: trailing zeros after the point count, in a whole number they are placeholders). All three tasks.
- **Level 3:** all four kinds, all three tasks.

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
| 1 | name | 3rd significant figure of 4.0071 | 0 |
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
