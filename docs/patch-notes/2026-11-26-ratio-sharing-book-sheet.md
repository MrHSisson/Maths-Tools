Strand: Maths

## 2026-11-26 — Sharing in a Ratio: one textbook-style book sheet instead of three worksheets

Branch `claude/practical-edison-cm3toa`. Area: `src/decks/bookSheet.ts` (new), `src/decks/{types,worksheets,deckChecks,SlideCanvas}`, `src/tests/bookSheet.test.ts`, `specs/decks/ratio-sharing.build.ts`, `src/decks/data/ratio-sharing.json`, `docs/reference/decks.md`.

The Sharing in a Ratio lesson no longer pins three separate worksheets (known share, difference, mixed). It has one worded **book sheet** in four lettered parts, with every question numbered straight on from 1 to 42: A sharing a total (the nine questions that are on the board grid, now worded with names), B a known share (9), C a difference (9), D mixed (15). There are no method hints, and the sheet says "Work in your book" with a Name line. It prints on **two A4 pages of questions** (made to be printed two to a sheet, scaled to A5): A and B on page 1, C and D on page 2, then one answer page. The print script picks the largest type that fits both pages and spreads each page's spare room between its questions, so it follows the real wrapping. Numbered circles, a shaded band for each part. The three cue slides stay where they were (parts B, C, D: the answer key on a click, the questions are on the paper); only the last holds the pinned print, so File > Worksheets and the player's Print buttons print the whole sheet.

New shared piece: the `bookSheet` worksheet element (`BookSheet`: `parts` of worded `items`, a `show` list of the parts a slide draws, at most 48 questions), with its deck check and tests. The questions and answers are the ones already checked in `specs/decks/ratio-sharing-sets.ts`; the build script rebuilds the sheet from them and checks the part A answers again.

Not done: the deck is rebuilt in the repo snapshot only and **not pushed to the shared copy** (the live server needs this code merged first; see `AGENTS.md`, "Deck data format"). The spec `specs/decks/ratio-sharing.md` still describes three cell sheets.

Agent: Claude Code
Notes: no Build Log block yet (the planner was not reachable this session).
