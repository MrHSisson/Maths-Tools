# The dashboard as checklists
- **Status:** building
- **Updated:** 2026-11-22

## Intention
The Tools dashboard (`/admin`) should answer one question at a glance: **what is done, and what is left?** Today it shows facts generated from the code, one Review dropdown per tool, and some views over the docs, and its use is unclear (Harry, 2026-11-22). It becomes checklists: every tool, deck and pathway has a list of things that must be true before it is finished, a tick for each, and a progress bar made from the ticks.

Decided with Harry (2026-11-22):
- **Scope:** tools, decks and pathways all become checklists.
- **Only Harry or Claude tick.** Nothing ticks itself from the code. A tick is a deliberate statement that the thing is done, made by Harry on the dashboard or by Claude through the notes API at the end of a session, and kept in the shared notes. (An earlier version of this plan had the code tick what it could prove; Harry decided against it.)
- **The code's facts stay, as evidence only.** Beside each item the dashboard shows what the code finds (for example "a brief found: specs/linear-programming-simplex.md", "tests found"), so a person ticking can see it. If a tick and the evidence disagree (ticked "covered by tests" but the code finds none), the item shows a warning; it never changes the tick.
- **The front page is a grid of tools with progress:** one row per tool with a progress bar and its open items, so scanning down shows where everything stands. A tool's full checklist opens from its row.

## The checklists (a first version, to be adjusted as they are used)

**A tool ("ready to go live").** Progress counts the ticks on the items that apply to that tool; an item that does not apply (calibration for a Decision tool) is left out, not unticked.

| Item | Evidence the dashboard shows | Applies to |
|---|---|---|
| A brief exists in `specs/` | the brief found, if any | every tool |
| Covered by tests | the tests found, if any | every tool |
| Explains itself (About text) | the About file or purpose found, if any | every tool |
| Difficulty calibrated | the calibration found, if any | ToolShell tools |
| Can be printed | the print routes found | tools that are not ToolShell (a ToolShell tool always prints a worksheet) |
| Checked on a phone | nothing (a person judges) | every tool |
| Checked on a tablet | nothing | every tool |
| Checked on a laptop | nothing | every tool |
| Printed on a real printer | nothing | tools that print |
| Answers checked (against the book or the exam) | nothing | every tool |
| Reviewed by Harry | nothing (replaces the Review dropdown) | every tool |
| Switched on (live) | whether the registry has it enabled | every tool |

Extras that never count against a tool, shown beside the list: Depth bank, lessons, Teach deck, a lesson deck (with its name), printable sheets.

**A deck.** The plan is written; the plan is agreed; the look card is approved; the deck is built; layout checked; pushed to the shared copy; published; used in a lesson. Evidence: the plan file, the deck's data file, and (where the service can be read) whether it is pushed and published.

**A pathway.** Its `## Next steps` become a checklist: write each as `- [ ] step`, tick it by changing it to `- [x]` in the pathway file (Claude does this at the end of a session; the dashboard shows it). Harry can also tick one on the dashboard (kept in the shared notes, keyed by the step's text).

## Progress
- 2026-11-22. Decided with Harry (above), including that only Harry or Claude tick. Found that the generated facts are wrong for the tools built lately: the Simplex tool showed no brief, no tests and no sub-tools, because the checks only matched a brief named exactly like the tool, a `__test` export and ToolShell sub-tools. The evidence has to be true even though it no longer ticks anything, so the facts were fixed first (chunk 1, done): briefs are found by their header, tests by a test file that imports the tool, sub-tools and levels are read for Decision tools, and About text and lesson decks are detected; `src/tests/toolFactsTruth.test.ts` pins them.

## Next steps
- [x] **Chunk 1: make the facts true** (the evidence). Done 2026-11-22.
- [ ] **Chunk 2: the checklist module** (`src/admin/checklist.ts`): the items above as data, which apply to which tool, the evidence for each, the warning when a tick and the evidence disagree, and the progress from the ticks; pure functions with unit tests.
- [ ] **Chunk 3: the ticks in the shared notes** (`checks` on a tool's note: `api/_notes.ts`, `notesApi.ts`, the local fallback), written by Harry on the dashboard and by Claude through the notes API. This changes the notes API, so it merges before the dashboard uses it.
- [ ] **Chunk 4: the front page grid** (a row per tool with a progress bar and open items) and a tool's checklist panel in place of the Review dropdown.
- [ ] **Chunk 5: decks** (a Decks checklist, evidence from the decks and `specs/decks/`) and **pathways** (the `- [ ]` steps), then retire the views the checklists replace.
- [ ] **Chunk 6: the routine.** `AGENTS.md` and `CLAUDE.md` change the end-of-session step from "set Review" to "tick what is now true", and the three-source table is updated.

## Where to read more
- `src/admin/` (the dashboard), `scripts/toolFacts.mjs` (the facts, now the evidence), `src/generated/toolFacts.json`, `api/_notes.ts` (the shared notes).
- `AGENTS.md`, "The Tools dashboard (`/admin`) and its notes API".
