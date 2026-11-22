Strand: Maths

## 2026-11-22 — The Venn worksheet: printed Venns, three to an A4 page (no deck yet)

Branch `claude/venn-hcf-lcm-handoff-zzr94r` (merge 3 of the Venn plan). Area: `src/decks/{vennSheet,types,worksheets,SlideCanvas,deckChecks,builder,vennLayout,Venn}`, `src/shared/printables.ts`, `src/tests/vennSheet.test.ts`, `scripts/testAreas.mjs`, `docs/reference/decks.md`.

- **New pinned worksheet format `vennSheet`**: a sheet of Venns, each only two numbers, so the prime tiles are worked out (never typed) and a printed Venn cannot be wrong. Per Venn: which parts already carry their tiles (`placed`, the fade), the two factorisations beside it, and optional "HCF =" and "LCM =" lines to fill in.
- **Print**: `vennWorksheet` in `printables.ts`, beside `shapeWorksheet`. A4 pages made to be printed scaled to A5, **three Venns to a page, at most nine a sheet**; a Name line, an optional note, the Venn large on the left with the factorisations and lines beside it. The answer pages draw every tile and fill the lines in. File → Worksheets and the player's Print buttons use it like the textbook sheet.
- **Same drawing as the slide**: the paper and the slide draw the Venn from one static SVG function using the slide piece's card layout and colours (now exported from `vennLayout.ts`), so they cannot drift. On the slide the sheet shows its Venns in a grid, `a` fills them in.
- **Deck check** fails a sheet with no Venns, more than nine, or a pair that cannot make a Venn. `S.vennSheet` in the builder.
- **Checked**: a nine-Venn sheet (questions and answers) in headless Chromium gives six pages (3 + 3), no cell overflowing; one look at page 1. Unit tests for the page count, tiles on question and answer pages, escaping, pinning and the deck check.
- **Deliberately not done:** the "count in small print" on the fade (placed parts and factorisations cover it for now); the look card and the deck itself (merges 4+); the editor has no Venn-sheet configuration panel yet (sheets are written in the build script, like the textbook sheet); dashboard Review (no tool changed).
- **Merge before the deck content**: this changes the deck data format (`vennSheet` on a worksheet element).

Agent: Claude Code
Notes: Maths Tools — Handoff block "claude/venn-hcf-lcm-handoff-zzr94r".
