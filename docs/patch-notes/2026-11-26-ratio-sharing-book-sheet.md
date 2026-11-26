Strand: Maths

## 2026-11-26 — Sharing in a Ratio: one textbook-style book sheet instead of three worksheets

Branch `claude/practical-edison-cm3toa`. Area: `src/decks/bookSheet.ts` (new), `src/decks/{types,worksheets,deckChecks,SlideCanvas}`, `src/tests/bookSheet.test.ts`, `specs/decks/ratio-sharing.build.ts`, `src/decks/data/ratio-sharing.json`, `docs/reference/decks.md`.

The Sharing in a Ratio lesson no longer pins three separate worksheets (known share, difference, mixed). It has one worded **book sheet** in a textbook layout: four numbered questions, each with lettered parts. Question 1 is sharing a total (nine parts, the board-grid numbers, now worded with names), 2 a known share (9), 3 a difference (9) and 4 mixed (10, down from 15). Each question has a one-line instruction, the wording of every part is hand-written and varied (bare "Share £65 in the ratio 2 : 3.", a story, a ratio of two people's money, "gets £30 more than", and so on), and the sheet says "Work in your book" with a Name line. No circles or badges: plain numbers and (a), (b), (c) in grey. It prints on **two A4 pages of questions** (made to be printed two to a sheet, scaled to A5): questions 1 and 2 on page 1, 3 and 4 on page 2, then one answer page. The print script picks the largest type that fits both pages and spreads spare room between the parts. The three cue slides stay where they were (questions 2, 3 and 4: the answer key on a click, the questions are on the paper); only the last holds the pinned print, so File > Worksheets and the player's Print buttons print the whole sheet.

New shared piece: the `bookSheet` worksheet element (`BookSheet`: `parts` = numbered questions of lettered worded `items`, a `show` list of the questions a slide draws, at most 48 lettered parts), with its deck check and tests. The numbers and answers are the ones already checked in `specs/decks/ratio-sharing-sets.ts`; the wording is in `specs/decks/ratio-sharing-book.ts`, and the build script checks every wording still carries its set's numbers and answer.

Not done: the deck is rebuilt in the repo snapshot only and **not pushed to the shared copy** (the live server needs this code merged first; see `AGENTS.md`, "Deck data format"). The spec `specs/decks/ratio-sharing.md` still describes three cell sheets.

Agent: Claude Code
Notes: no Build Log block yet (the planner was not reachable this session).
