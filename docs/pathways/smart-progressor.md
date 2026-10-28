# Smart Progressor
- **Status:** rolling out
- **Measure:** calibrated
- **Updated:** 2026-10-28

## Intention
Order a worksheet easy to hard automatically, so a teacher gets a sensible ramp without choosing the order by hand.

## Progress
- Settled 2026-10-25: one mechanism, **calibration**. Each question is scored from the question itself (never from the option that made it); a sample of 1500 per sub-tool and level is cut into eight bands; the worksheet generates a pool and picks evenly across the bands reached (`spreadByBand`).
- Calibrated: Order of Operations (the pilot), Decimal Add/Sub, Speed Distance Time, File Sizes, Factor Theorem, Partial Fractions, Indices, Surds. The dashboard's Calibrated filter lists them.
- Option weights are retired. A `balanced: true` pool keeps variety pools (Rounding's zero kinds, Speed Distance Time's mixed types) roughly even on a short sheet.
- The basis exists. Edits to the mechanism wait until it has been rolled out (Harry, 2026-10-28).

## Next steps
- Calibrate further tools as each is finished (a rubric and a 30-line test with the `calibrationKit` helper).
- Check a calibrated sheet with a class.

## Where to read more
`docs/reference/options-and-calibration.md` (Calibrating a tool), `docs/calibration/`, `src/shared/calibration`.
