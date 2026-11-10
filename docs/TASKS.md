# Tasks

Smaller things to do: checks, consistency fixes, tidy-ups and one-off jobs. Larger developments are **pathways** in `docs/pathways/`. Building or reviewing one tool is tracked in that tool's dashboard note, not here.

**A task is added only when Harry asks for it, or when it has been suggested in chat and Harry approves.** Do not add tasks (or pathway next steps) on your own initiative; suggest them in chat instead.

**Format:** one `### ` heading per task under a status heading, then a line on what and why, and `Links:` if it has any. Status headings: In progress · Open · Recurring · Done (recent). Move a task when its status changes; delete done tasks after a month.

## In progress

Nothing at the moment.

## Open

### Worksheet formats: textbook style and more on a page
Banked 2026-11-03 at Harry's request, not started. The printed worksheet (pinned worksheets: File → Worksheets, and the tool pages' Worksheet) feels limited: the cell structure caps how much fits on a page. Idea: a **textbook-style** option (flowing columns, thin dividers instead of boxed cells, lettered parts) that fits 20 to 30 questions on a page while still looking clean and well divided; the tool pages already have a Worksheet / Textbook layout (`layout: "grid" | "list"`) that a pinned worksheet could offer under that name. Still to settle with Harry: whether this is the printed sheet or the on-slide book work (assumed: the printed sheet), the page sizes (A5 by default today), and how many questions a sheet may hold.
Links: `src/decks/worksheets.ts`, `src/shared/print.ts`, `docs/reference/decks.md` (pinned worksheets).

### Critical Path: a backward pass of its own
Banked 2026-11-10 at Harry's request, not started. DE2 asks for earliest **and** latest start and finish times. Today **Forward pass** practises only the earliest times, and the backward pass appears only inside **Full analysis** (which also asks for the critical path), so the latest times have no practice of their own. Build a **Backward pass** sub-tool (AS, skills practice) that starts from a network with its earliest times filled in and asks for the latest times, then pair it with DE2 in `DECISION_PAIRINGS` (`src/tools/Decision/decisionSpec.ts`) and move Full analysis from DE2 to DE3, where its critical path belongs (a sub-tool is listed under one statement only); `decisionPairings.test.ts` fails until a new Critical Path sub-tool is placed.
Links: `src/tools/Decision/CriticalPath.tsx`, `src/tools/Decision/decisionSpec.ts`, `docs/pathways/decision-exam-questions.md`.

### Questions render inside their containers
Check that every tool's questions, working and pictures stay inside their boxes at phone, tablet and laptop sizes. Picked up tool by tool during reviews.

## Recurring

### Tool review cycle
Each tool is reviewed when we reach it; the record is that tool's dashboard note.

### Three screen sizes
Anything visual is checked at phone, tablet and laptop (see `CLAUDE.md`).

## Done (recent)
