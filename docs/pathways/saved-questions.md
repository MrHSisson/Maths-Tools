# Saved questions
- **Status:** building
- **Updated:** 2026-11-09

## Intention
One list of questions a teacher wants to come back to, held across lessons, with printing as something a saved question can do rather than a separate place. Today there are two overlapping ideas: **pinned** questions (any tool, memory only: gone on reload, five at most) and the **print basket** (Decision tools with a printable sheet, kept on the device, thirty at most, printable and shareable by link). Both are "keep this so I can come back to it". The basket's idea is the better one: a saved question is a recipe (sub-tool, level, options, seed) and is rebuilt from it, so it survives a reload and goes in a link. Pins should work the same way.

## Progress
- 2026-11-09: **one control.** Pin and print basket are one joined split control in both shells (`PinButton`): the main half pins, the attached chevron opens a panel with Pin / Add to print basket / Open print basket and the Recent and Pinned lists. The basket's own dialog and the burger menu's list are unchanged.
- 2026-11-09: **seed audit.** Every generator now rebuilds the same question from the same seed (Maths shell, Decision tools); `FileSizes` and `NonLinearSimEq` level 3 had "don't repeat" memory at module level and were fixed. `src/tests/seedReplay.test.ts` guards it and rule R45 records it.

## Next steps
- Make pins persistent recipes in the basket's format (stored on the device, one cap for both), so the panel's Pinned and the basket become one Saved list. Questions with no seed (exam-style) cannot be saved this way: list them first and decide how pins treat them.
- Store a short fingerprint of the question's text with each saved question, so one whose generator has since changed can be flagged instead of silently coming back different.
- Printing for Maths tools (only Critical Path has a printable sheet today); until then a Maths question can be saved and reloaded but not printed.
- Possibly named lists (for example one per lesson) once there is a single list.

## Where to read more
`docs/reference/shell-extras.md` (recent and pinned questions; print basket), `src/shared/questionKeeper.ts`, `src/shared/components/PinButton.tsx`, `src/shared/decision/usePrintBasket.tsx`, `src/shared/seededGenerate.ts`, `src/tests/seedReplay.test.ts`.
