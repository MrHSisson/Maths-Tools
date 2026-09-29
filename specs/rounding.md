# Tool Spec: Rounding

**Status:** implemented — `src/tools/Number/Rounding.tsx`, registered `enabled: false` (dev-gated).
Written retrospectively from the built tool (it was designed conversationally, not from this
template) so the intent and decisions are on record.

## 1. Overview

| Field | Value |
|---|---|
| Tool name | Rounding |
| Tool id / URL path | `/rounding` |
| Category | Number |
| Card description | Round to the nearest 10, 100, 1000, decimal places and significant figures, using labelled and blank number lines. |
| Defaults | `numColumns: 2`, `maxColumns: 2`, `numQuestions: 12`, `collapseWorkingByDefault: true` |

**Pedagogical intent:** students see rounding as *deciding which of two boundary values a number is
closer to*, using a number line, and connect that to the digit rule (rounding digit + decider).
Levels fade the scaffold: labelled line → blank line → question only.

## 2. Sub-tools

| Key | Tab label | Kind |
|---|---|---|
| `nearest` | Nearest 10, 100, 1000 | diagram (L1–2) / worded (L3) |
| `dp` | Decimal Places | diagram (L1–2) / worded (L3) |
| `sf` | Significant Figures | diagram (L1–2) / worded (L3) |

Accuracy pools: nearest `1000 / 100 / 10 / whole number`; d.p. `1 / 2 / 3`; s.f. `1 / 2 / 3` (all active by default).

## 3. Levels and QO

- **Level 1 — labelled line.** Number marked between two boundaries; ends + midpoint labelled. QO *Number line labels*: `Ends & midpoint` (default) / `Every mark` (all 11 ticks labelled).
- **Level 2 — blank line.** Same line, empty boxes. QO *Student fills in*: `Ends & midpoint` (default) / `Midpoint only` (ends given).
- **Level 3 — question only** (plain worded text; standard ToolShell display and text print).
- **Levels 1–2:** QO *Number on the line* — `Plotted for them` (default) / `Students plot it` (marker hidden; whiteboard has an in-box **Show Plot** button — see CLAUDE.md "Staged reveal"; answer pages print the plotted line). QO *Digits past the rounding position* — `One extra` (on a tick, default) / `Two extra` (between ticks).
- **All levels:** QO *Exactly halfway* — 2-option weighted pool (cycle button): any position / exactly halfway. Deliberately does **not** feed the Smart Progressor sort (no `_difficultyScore`).

## 4. Maths rules

- All values derived from integers (`fmtScaled`) — never floats. The number line, text, answer and working share one computation.
- Round half up. Exactly-halfway values only when the pool asks for them.
- Trailing zeros are kept (4.30 to 2 d.p.). Numbers never end in an unintended 0 past the rounding position.
- s.f.: leading zeros are not significant; the lower boundary's leading digits never become all 9s (avoids 9.96 → 10 changing the s.f. count).
- Comma grouping from five digits (`4372`, `43,720`); KaTeX uses `{,}`.

## 5. Worked example (6 steps)

1. Where the rounding digit is (place / d.p. / s.f. wording).
2. **Digit step** — the number as digit boxes: rounding digit (blue), decider (orange), rest greyed; s.f. leading zeros noted.
3. The decider rule: `d ≥ 5` → round up, `d < 5` → round down.
4. **Number-line step** — boundaries, halfway, number marked.
5. Compare with the halfway value (agrees with step 3).
6. Answer.

## 6. Acceptance reference

- 347 to the nearest 10 → boundaries 340 / 350, midpoint 345, answer 350.
- 4.372 to 2 d.p. → 4.37 / 4.38, midpoint 4.375, answer 4.37.
- 0.0437 to 2 s.f. → 0.043 / 0.044, midpoint 0.0435, answer 0.044.
- 815 to the nearest 10 → exactly halfway, answer 820.

## 7. Worksheet layout

≤ 5 questions print one per row (fills the page); otherwise the teacher's column count; max 12 per page (`_densityFloorMm: 30`). Pure Level 3 sheets use the standard text print.

## 8. Out of scope (for now)

Teach deck, "spot the mistake" questions, skills-library entry, extra rounding contexts (nearest 5/50, negatives, money, bounds).
