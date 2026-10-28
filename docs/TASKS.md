# Tasks

Smaller things to do: checks, consistency fixes, tidy-ups and one-off jobs. Larger developments (new environments, things that change most tools) are **pathways** in `docs/pathways/`. Building or reviewing one tool is tracked in that tool's dashboard note, not here.

**Format:** one `### ` heading per task under a status heading, then a line on what and why, and `Links:` if it has any. Status headings: In progress · Open · Recurring · Done (recent). Move a task when its status changes. Delete done tasks after a month (the Build Log and patch notes keep the record).

## In progress

### Move planning docs to pathways and tasks
Done: pathway files, this file, the dashboard tabs, the old planning docs retired, settled decisions in the planner archive. Still to do: move old patch notes to the planner Build Log, slim `CLAUDE.md`, clear out the retired planner pages (tool pages, Tool Index, Feature Guide, old Prongs note).
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

### Write down how we build and roll out
One short page for the three routes done by habit today: building a tool (idea, brief, scaffold, core, teaching layer, review, live), building a lesson or deck (brief, deck, checks, hand-off, review at 1280x720 and on a phone, live), and rolling a capability across tools (decide, pilot, write the rule, show it on the Matrix, roll out in reviews, retire the old way). Gather them from `CLAUDE.md`, the spec templates and the review cycle; do not add process.
Links: `docs/HOW_A_TOOL_IS_BUILT.md`, `docs/pathways/keeping-the-site-from-fraying.md`.

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
Large files, parked ideas, tabs in the options popover and capabilities-on-few-tools were settled (2026-10-27). Decisions are in the planner note Maths Tools - Archive: Settled Decisions.
