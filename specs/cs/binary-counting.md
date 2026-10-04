# Binary Counting (sandbox)

**Status:** implemented (stage 1 of 3 — see "Rollout")

**Route:** `/binary-counting` · `src/tools/Binary/BinaryCounting.tsx` · category Binary & Number Bases · dev-gated (`enabled: false`)
**Build type:** standalone interactive sandbox (not ToolShell, no generator).

## Purpose
Students count in binary beside denary (and hex) in full place value tables and spot that every n-bit pattern is the (n−1)-bit pattern twice, with a 0 then a 1 in front. Also that a carry is the same idea in every base.

## Design decisions (agreed with the teacher)
- Full place value tables for every base, not bare numbers. Binary headings are place values (128 … 1); a "Powers" toggle shows 2⁷ … 2⁰. Hex headings 16, 1.
- Two views: **Odometer** (default — one row per base, counting up in place, changed digits tinted) and **Full list** (every number as a row).
- **One press = one whole count.** Odometers side by side; the carry chain is shown all at once (carry marks, tinted digits, a one-card summary per column); overflow at all ones is shown explicitly and wraps to 0. No staged / two-phase reveal (tried, confusing). Summaries come from the shared `rippleIncrement`.
- Controls: one toolbar (bits stepper, count controls, Odometer | List); other options in the header menu.
- 1–8 bits (8 needed for hex). Never list all 256: past 4 bits show a page of 16 rows; the last four bits repeat on every page.
- The List view shows the pattern: the bottom half repeats the top half with a 1 in front (rule between, leading bit tinted).
- Must work at phone width: tables stack vertically.

## Acceptance
- 3→4 bits: rows 8–15 equal rows 0–7 with a leading 1 (`src/tests/placeValueBases.test.ts` asserts this for 2–8 bits).
- Hex digits for 0–255 match `toString(16)`; denary rollover (9 → 10) and binary carries read the same.

## Rollout (the same table, extended into the existing tools)
1. ✅ Shared base-aware table + this sandbox.
2. ✅ Number Bases: KaTeX `gridLatex` working replaced with `pvStep` snapshots.
3. ✅ Binary Operations: shifts and addition worked examples on the table (carries in `above`, shifted-out bits shown red outside the register). Printed worksheets unchanged.
