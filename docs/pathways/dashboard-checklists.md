# The dashboard as checklists
- **Status:** building
- **Updated:** 2026-11-22

## Intention
The Tools dashboard (`/admin`) should answer one question at a glance: **what is done, and what is left?** Today it shows facts generated from the code, one Review dropdown per tool, and some views over the docs, and its use is unclear (Harry, 2026-11-22). It becomes checklists: every tool, deck and pathway has a list of things that must be true before it is finished, a tick for each, and a progress bar made from the ticks.

Decided with Harry (2026-11-22):
- **Scope:** tools, decks and pathways all become checklists.
- **Ticking is mixed.** What the code can prove ticks itself and can never be wrong (a brief exists, it has tests, it is calibrated, it is switched on). What only a person can judge (tried on a phone, a tablet and a laptop; printed on a real printer; answers checked against the book; Harry has reviewed it) is ticked by Harry or by Claude and kept in the shared notes.
- **The front page is a grid of tools with progress:** one row per tool with a progress bar and its open items, so scanning down shows where everything stands. A tool's full checklist opens from its row.

## The checklists (a first version, to be adjusted as they are used)

**A tool ("ready to go live").** Progress counts the ticks that apply to that tool; an item that does not apply (calibration for a Decision tool) is left out, not unticked.

| Item | Ticked by | Applies to |
|---|---|---|
| A brief exists in `specs/` | code | every tool |
| Covered by tests | code | every tool |
| Explains itself (About text) | code | every tool |
| Difficulty calibrated | code | ToolShell tools |
| Can be printed | code | tools that are not ToolShell (a ToolShell tool always prints a worksheet) |
| Checked on a phone | person | every tool |
| Checked on a tablet | person | every tool |
| Checked on a laptop | person | every tool |
| Printed on a real printer | person | tools that print |
| Answers checked (against the book or the exam) | person | every tool |
| Reviewed by Harry | person (the Review field, kept) | every tool |
| Switched on (live) | code | every tool |

Extras that never count against a tool, shown beside the list: Depth bank, lessons, Teach deck, a lesson deck, printable sheets.

**A deck.** The plan is written (code: `specs/decks/<id>.md`); the plan is agreed (person); the look card is approved (person); the deck is built (code: its data file exists); layout checked (person); pushed to the shared copy (code, where the service can be read); published (code, from the service); used in a lesson (person).

**A pathway.** Its `## Next steps` become a checklist: write each as `- [ ] step` and tick it by changing it to `- [x]` in the pathway file (Claude does this at the end of a session; the dashboard shows it). Harry can also tick one on the dashboard (kept in the shared notes, keyed by the step's text).

## Progress
- 2026-11-22. Decided with Harry (above). Found that the generated facts are wrong for the tools built lately: the Simplex tool shows no brief, no tests and no sub-tools, because the checks only match a brief named exactly like the tool, a `__test` export and ToolShell sub-tools. A checklist is only useful if its ticks are true, so the facts are fixed first.

## Next steps
- [ ] **Chunk 1: make the facts true.** A brief is found by its header (the tool's path or id), not only its filename; tests are found by a `__test` export or a test file that imports the tool; sub-tools and levels are read for Decision tools; About text and a lesson deck are detected. A test checks each against known tools.
- [ ] **Chunk 2: the checklist module** (`src/admin/checklist.ts`): the items above as data, what ticks each, which apply, and the progress; pure functions with unit tests.
- [ ] **Chunk 3: the manual ticks in the shared notes** (`checks` on a tool's note: `api/_notes.ts`, `notesApi.ts`, the local fallback). This changes the notes API, so it merges before the dashboard uses it.
- [ ] **Chunk 4: the front page grid** (a row per tool with a progress bar and open items) and a tool's checklist panel in place of the Review dropdown.
- [ ] **Chunk 5: decks** (a Decks checklist, read from the decks and `specs/decks/`) and **pathways** (the `- [ ]` steps), then retire the views the checklists replace.
- [ ] **Chunk 6: the routine.** `AGENTS.md` and `CLAUDE.md` change the end-of-session step from "set Review" to "tick what is now true", and the three-source table is updated.

## Where to read more
- `src/admin/` (the dashboard), `scripts/toolFacts.mjs` (the facts), `src/generated/toolFacts.json`, `api/_notes.ts` (the shared notes).
- `AGENTS.md`, "The Tools dashboard (`/admin`) and its notes API".
