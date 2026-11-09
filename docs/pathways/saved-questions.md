# Saved questions
- **Status:** building
- **Updated:** 2026-11-09

## Intention
Named lists of questions a teacher wants to come back to, held across lessons and able to mix tools, with printing as something a saved question can do rather than a separate place. Today there are two overlapping ideas: **pinned** questions (any tool, memory only: gone on reload, five at most) and the **print basket** (Decision tools with a printable sheet, kept on the device, thirty at most, printable and shareable by link). Both are "keep this so I can come back to it". The basket's idea is the better one: a saved question is a recipe (sub-tool, level, options, seed) and is rebuilt from it, so it survives a reload and goes in a link. Pins should work the same way.

## Progress
- 2026-11-09: **one control.** Pin and print basket are one joined split control in both shells (`PinButton`): the main half pins, the attached chevron opens a panel with Pin / Add to print basket / Open print basket and the Recent and Pinned lists. The basket's own dialog and the burger menu's list are unchanged.
- 2026-11-09: **seed audit.** Every generator now rebuilds the same question from the same seed (Maths shell, Decision tools); `FileSizes` and `NonLinearSimEq` level 3 had "don't repeat" memory at module level and were fixed. `src/tests/seedReplay.test.ts` guards it and rule R45 records it.

- 2026-11-09: **one saved list.** Pins are now saved recipes kept on the device (30 at most), the very list the Decision print basket prints, in both shells. Each saved question carries a fingerprint, and a restore that no longer matches says the tool has changed. A saved question with no print sheet stays in the list, marked, and is left out of a print. Recent is still memory only.
- 2026-11-09: **named lists that mix tools.** Saved questions live in site-wide named lists (`savedLists.ts`: new, rename, delete, switch; always one called Saved); each question remembers its tool page, a question from another tool shows with that tool's name and picking it opens that tool with the question restored (`?pick=`); a page's old basket joins the open list on first load. Printing still works only for the tool you are on.

## Next steps
- Check it with a class over a few weeks (saved questions held across lessons; does a changed generator warn as it should?).
- Printing for Maths tools (only Critical Path has a printable sheet today); until then a Maths question can be saved and reloaded but not printed.
- Printing a mixed list (the print layouts live in the tool pages, so only this tool's questions print today).
- A link that carries a whole list across tools and devices (today's link carries one tool's questions).

## Where to read more
`docs/reference/shell-extras.md` (recent and pinned questions; print basket), `src/shared/questionKeeper.ts`, `src/shared/components/PinButton.tsx`, `src/shared/decision/usePrintBasket.tsx`, `src/shared/seededGenerate.ts`, `src/tests/seedReplay.test.ts`.
