# Tidy-up — split ends and half-finished ideas

**Priority: tidy, fix and level what exists.** Only after that, put structures in place so new work does not fray it again (§2).
This is an inventory of what is loose, found by reading the code and docs (2026-10-23). Each item is marked
**Finish** (it is worth completing), **Fold** (two things doing one job), **Remove** (dead weight) or **Decide** (needs a call from Harry).
Nothing here is scheduled.

## 1. What is loose

### A. Built, but only on a handful of tools

| Capability | Where it is today | Mark |
|---|---|---|
| Depth question banks | 4 of 42 ToolShell tools | Decide: grow, or keep as a premium extra |
| Lessons (ordered steps) | 2 tools (Indices, Rounding), Developing-tools only | Decide |
| Teach decks | 3 tools, Developing-tools only | Decide |
| Calibrated worksheets | 1 tool (Order of Operations) | Fold — see B |
| Techniques engine | a few tools; 11 hidden preview pages and a library page exist only to show it | Decide |
| Skill drill-downs (`[[skill\|term]]`) | markers in 3 tools, but the Skill Library is parked, so the links are inert for everyone | Decide: switch on, or strip the markers |
| Developing picture in Worked Example | 22 tools; 19 live tools have none | Finish gradually, per tool review |

### B. Two ways of doing one job

| Job | The two ways | Mark |
|---|---|---|
| Ordering a worksheet easy → hard | option **weights** (12 tools) and **calibration** (1 tool) | Fold: one mechanism, calibration is the better one |
| Printing diagrams | shared `handleDiagramPrint` (8 tools) vs hand-rolled grids (Basic Angle Facts, Angles in Parallel Lines, Recipes) | Finish: move the three onto the shared one |
| "Slides" | Teach tab, lesson decks, Depth stage, skill slides — four slide-playing surfaces | Decide: which survive |
| Hiding something from the public | `enabled`, `hidden`, `parked`, Developing-tools mode, `parkedMode` — five switches | Fold: aim for two (live / not live) |

### C. Leftovers that no longer do anything

| Item | Mark |
|---|---|
| `plainDisplay`, `cycleDisplay`, `cycleLabels` still in the option types, now no-ops | Remove |
| `phase` on Teach slides, kept "for old data" but never drawn | Remove |
| A `WorkedExampleSteps` prop marked "no longer used" | Remove |
| `legacy` Flow Networks ideas, off unless ticked | Decide: keep or delete |
| Comment in `devMode.ts` says the step-by-step Worked Example is dev-gated; `CLAUDE.md` says it is live for everyone | Fix whichever is wrong |

### D. Tools with no decision

Six question tools are not live and have no agreed fate: **Simplifying Ratios** (no question options), **Perimeter** (most outdated),
**Travelling Salesperson**, **Route Inspection**, **Mixed Strategies**, **File Sizes**. Plus 14 internal pages (Tool Shell template,
Technique and Skill libraries, 11 technique previews) that sit in the public registry. Mark: **Decide** each — go live, finish, or shelve.

### E. Names and homes that do not line up

- Six registry ids are not kebab-case (`Times Tables`, `Negative Operations`, `Multiplication Methods`, `Functional Skills`, `Recipes`,
  `system architecture`) and nine ids do not match their route (`integers` → `/integer-add-and-subtract`, `ratio` → `/ratio-sharing`…). Mark: Fold.
- "Teacher Tools" holds the Visualiser and the internal pages; "Binary & Number Bases" is its own strand apart from Computer Science. Mark: Decide.
- Question Option labels disagree: "Question Types" (14) vs "Question type" (5), "Operation" vs "Operations", "Find" vs "Ask for". Mark: Fold.

### F. Question Options on about a dozen tools

Median is 4 options per level, but Rounding (20), Ordering Numbers (18), Binomial Expansion (15), File Sizes (15), Speed/Distance/Time (14) and
Order of Operations (13) are walls. The groups already sort into what-is-asked / the numbers / notation / method / the answer / support, which
is the likely shape of the fix. Mark: **Finish**, tool by tool, after A–E.

### G. Docs that have drifted

`docs/PROJECTS.md` says to audit "the other 26" tools for Smart Progressor (12 have it); `CLAUDE.md` says "six core representations" above a
table of eight; the `/admin` plan notes and the Tool review cycle both claim to be the live per-tool record. Mark: Fix as we go.

## 2. After the tidy — keep it from fraying (not started)

Ideas only, to be shaped once §1 is cleared:

- **One state per tool**: live or not, derived by the dashboard, instead of five switches.
- **A definition of live**: a short checklist the dashboard computes (tests, spec, within the option limit, reviewed).
- **No new mechanism without an owner**: a capability has a status (rolling out / done / retired) and a rollout list; the Matrix view is the
  standing picture of it.
- **Tests that catch drift**: option labels from a fixed vocabulary, an API option nobody uses is flagged, ids match routes.
- **Retire before you add**: a new way of doing something names the old way it replaces.

## 3. Parked ideas (kept so they are not lost)

Complexity stepper · slide-strip lesson builder and slide templates · saved lessons · `.pptx` export · layered Question Options popover.
