# Tasks

Smaller things to do: checks, consistency fixes, tidy-ups and one-off jobs. Larger developments (new environments, things that change most tools) are **pathways** in `docs/pathways/`. Building or reviewing one tool is tracked in that tool's dashboard note, not here.

**Format:** one `### ` heading per task under a status heading, then a line on what and why, and `Links:` if it has any. Status headings: In progress · Open · Recurring · Done (recent). Move a task when its status changes. Delete done tasks after a month (the Build Log and patch notes keep the record).

## In progress

### Move planning docs to pathways and tasks
Pathway files and this file exist. Still to do: dashboard Tasks and Pathways tabs, retire `docs/PROJECTS.md`, `docs/TIDY_UP.md` and `docs/FUTURE.md`, update `CLAUDE.md` and `AGENTS.md`, move the settled-decisions table and old patch notes to the planner archive, clear out the retired planner pages.
Links: planner note Maths Tools - Handoff.

## Open

### Questions render inside their containers
Check that every tool's questions, working and pictures stay inside their boxes at phone, tablet and laptop sizes. Picked up tool by tool during reviews.

### Real-phone pass
The phone layout is built and checked in headless Chromium, but there has not been an overall pass on a real phone and tablet.

### Network Flows and Critical Path on real devices
Eyeball the two-figure exam question and the Explain tab on a real phone and tablet, print a two-figure paper from a real browser, and check the Gantt chart and histograms on a phone.

### Hangman and Pairs classroom test
Phone and tablet checks, a classroom test, then the go-live call for both.

### Dev-mode working chains
Simultaneous Equations (Substitution), Non-linear Sim Eq and Fraction to Ratio keep two versions of their working behind the developer switch. Settle which a class sees, in each tool's review. The `(2x-5)^2` expansion in Substitution is never shown.

### Network Sandbox and Grapher Lab fate
Decide whether each goes live, stays a support page or is retired.

### Re-level the Significant Figures Depth bank
Move it onto the zeros ladder the tab now uses, or add zero-themed items.
Links: `specs/rounding-sf-levels.md`.

### Regroup long Question Option sets
Shorten and group the heaviest sets (Rounding, Comparing & Ordering, File Sizes, Speed Distance Time, Order of Operations, Partial Fractions, Decimals +/-, the Angles tools) during each tool's review. Tabs already stop the worst walls.

### Closing answer step on tools that lack one
Find them with ToolShell tools that do not set `hideAnswerStep`; each needs its working to end on the answer first.
Links: `docs/pathways/worked-solutions.md`.

## Recurring

### Tool review cycle
Each tool is reviewed when we reach it: content, readiness, sandbox fit, techniques, worked solution, Smart Progressor, mobile. The record is that tool's dashboard note. Standard to review against: `CompletingTheSquare` and `AnglesInQuadrilaterals` for shell wiring and print, `RatioManipulation` and `RatioSharingTool` for content.

### Three screen sizes
Anything visual is checked at phone, tablet and laptop (see `CLAUDE.md`).

## Done (recent)

### Tidy-up list cleared
Large files, parked ideas, tabs in the options popover and capabilities-on-few-tools were settled (2026-10-27). Decisions are in `docs/TIDY_UP.md` until they move to the planner archive.
