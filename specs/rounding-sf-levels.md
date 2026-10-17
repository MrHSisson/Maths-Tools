# Tool Spec: Rounding — Significant Figures tab, new levels

**Status:** implemented

Re-levels the **Significant Figures** tab of Rounding (`src/tools/Number/Rounding.tsx`). The challenge is deciding which digits count and
then rounding at that position, not the presence or absence of a number line. Nearest 10/100/1000 and Decimal Places are unchanged.
Aligned with Identify Sig. Figs (`specs/rounding-identify-sf.md`): same ladder, same `sfZeros` buttons.

## Levels

| Level | Zeros (one kind per question) | Number line |
|---|---|---|
| 1 | none · trapped | optional |
| 2 | leading · trailing | optional |
| 3 | none · trapped · leading · trailing | never |

Round to 1, 2 or 3 s.f. (`sfPool`), Numbers = whole numbers / decimals (`sfKind`), digits past the rounding position (`oneDigit` / `twoDigit`,
Levels 1–2; Level 3 mixes one and two), Exactly halfway (cycle). The zeros buttons are plain, weighted for an even worksheet split.

## Number line (Levels 1–2): `sfLine`, exclusive — Off (default) · Labelled · Blank

- **Off:** a text question (printed through the standard text print).
- **Labelled:** the old Level 1 line (ends and midpoint labelled). **Blank:** the old Level 2 line (students fill the ends and midpoint).
- "Students plot it / Plotted for them" and "Reveal ends & midpoint" apply once a line is on and are greyed out otherwise (`requires`);
  "Reveal ends & midpoint — Before the plot" needs Blank. Whiteboard steps: Show Ends, Show Plot, Show Answer.
- Dropped for this tab (kept on the other tabs): the "every mark" labels and "midpoint only (ends given)" variants.

## Generation

Rejection sampling over the existing rounding generator, checked by `hasZeroKind`:
- **none:** no zero digit in the number.
- **trapped:** a trapped zero among the first n + 1 significant digits (so it is a kept digit or the decider: 3.052 to 2 s.f. = 3.1); no leading or trailing zeros.
- **leading:** the number starts `0.0`; no trapped or trailing zeros (0.0472 to 2 s.f. = 0.047).
- **trailing:** the given number ends in a zero (4500, 3.40, 120.00), or the decimal answer keeps one (4.96 to 2 s.f. = 5.0); no trapped or leading zeros.
- Leading zeros force a decimal; whole numbers have placeholders where the answer needs them (46 720 to 2 s.f. = 47 000).

## Acceptance

`src/tests/roundingOptions.test.ts` checks, for every level × zero kind, that the number is of that kind and that the answer equals an independent
digit-string rounding to n s.f. (round half up, trailing zeros kept), plus the Numbers option, the optional line and the staged reveal.

## Depth

The Depth bank's levels follow its own ideas (see `RoundingDepth.ts`); only the Identify Sig. Figs bank (`RoundingSfIdDepth.ts`) follows the zeros ladder.
