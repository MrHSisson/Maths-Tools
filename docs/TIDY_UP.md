# Tidy-up — split ends and half-finished ideas

**Priority: tidy, fix and level what exists.** Alongside it, write down how we build and roll out (§2). Only after that, put structures in place so new work does not fray it again (§2b).
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
| Ready-made printable sheets (burger menu) | 1 tool — Rounding (blank number lines, two styles) | Finish: see H |

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

**Found in the 2026-10-24 scrub:** the **Tool Shell template page (`/tool-shell`) is registered live**, so a teacher sees "Tool Shell — a tool shell for
developing new tools" on the landing page under Teacher Tools; the other internal pages are hidden or dev-gated. Mark: **Decide** (almost certainly
`enabled: false`).

### E. Names and homes that do not line up

- Six registry ids are not kebab-case (`Times Tables`, `Negative Operations`, `Multiplication Methods`, `Functional Skills`, `Recipes`,
  `system architecture`) and nine ids do not match their route (`integers` → `/integer-add-and-subtract`, `ratio` → `/ratio-sharing`…). Mark: Fold.
- "Teacher Tools" holds the Visualiser and the internal pages; "Binary & Number Bases" is its own strand apart from Computer Science. Mark: Decide.
- Question Option labels disagree: "Question Types" (14) vs "Question type" (5), "Operation" vs "Operations", "Find" vs "Ask for". Mark: Fold.

### F. Question Options on about a dozen tools

Median is 4 options per level, but Rounding (20), Ordering Numbers (18), Binomial Expansion (15), File Sizes (15), Speed/Distance/Time (14) and
Order of Operations (13) are walls. The groups already sort into what-is-asked / the numbers / notation / method / the answer / support, which
is the likely shape of the fix. Mark: **Finish**, tool by tool, after A–E.

### G. Docs and code that disagreed (scrubbed 2026-10-24)

Done: the README, `PROJECTS.md` (rewritten as current state), `CLAUDE.md`, the glossary, the back bench, the architecture plans, the specs' statuses and
links, the `devMode.ts` header, and four finished audit documents plus the August tool audit were removed. **Still loose, found while doing it:**
- `NonLinearSimEq` keeps two working chains for its `linear` sub-tool — the old hand-rolled one for everyone, the technique-based one only in Developing-tools mode (`getDevMode()` branch with `legacySolvePos` / `legacySolveNeg`). Mark: Decide, then delete one.
- The landing page has a theme for a "Probability & Statistics" category that does not exist, and no theme for "Binary & Number Bases" (it falls back to slate). Mark: Remove / Fold.
- The Tools dashboard facts read only registry entries that load from `./tools/…`, so the hidden `admin` entry itself is not listed (80 registry entries, 79 in the facts). Harmless; noted so the counts are not a surprise.

### H. Printable ready-made sheets (the burger-menu print section)

Rounding's burger menu has "Print blank number lines (A4)" and "…every mark": pre-designed sheets with no generated questions, for the
class to fill in. It is a one-off: a `menuItems` prop that both shells accept (ToolShell and DecisionShell) and only Rounding uses. It is a
good idea that has not been named, documented or rolled out. Mark: **Finish** — name it, document it, then roll it out.

- **Name and document it** as a standing capability ("Printables") in `CLAUDE.md` and on the dashboard Matrix, so it is findable.
- **Make it one thing:** a "Printables" heading in the burger menu with the same print path every time, instead of free-form menu items.
- **Candidates to check with Harry** (a blank the class would actually fill in): number lines (Integers +/−, Rounding), place value
  tables (Decimals +/−, Powers of 10; Decimals already has a "Grids on worksheet" switch that is a cousin of this), ratio tables
  (Speed/Distance/Time, Ratio), blank axes and grids (Equations of Lines), blank networks (Decision tools already print these inside exam
  papers), bar-model strips. Only add where a teacher would really reach for it.

### I. The information (i) — two of them, in the wrong place

- **"Tool Information"** is a modal opened from the **burger menu**, so a teacher has to know to look there. It is a flat list of
  label + sentence cards written by hand per tool (55 tools; one to eight sections each), and it is the old style (`font-bold`, `shadow-2xl`,
  a box per item) that the rest of the site has moved on from.
- A **separate level (i)** sits beside the level buttons, but only on 8 tools (the five Decision tools, Factor Theorem, Partial Fractions,
  Indices) — the only place a tool says in plain words what Level 1, 2 and 3 mean.
- So the two (i)s hold different things, in different places, and most tools have only the first.

Mark: **Finish.** One "About this tool" (i) next to the tool title, replacing both, and the natural home for more teacher understanding:
what the tool does and what it is for · what each level means · what the Question Options do (grouped sensibly) · which modes it has
(Whiteboard, Worked Example, Worksheet, Depth, lessons) · common misconceptions it targets · printables. Levels and options can be read
from `TOOL_CONFIG` so they are never stale; only the teaching notes are written by hand. Restyle to the current visual direction.

## 2. Write down how we build and roll out

Three things are done by habit and spread across `CLAUDE.md`, `TOOL_DESIGNER_PROMPT`, the spec templates, the review cycle,
the dashboard notes and Harry's planner. The job is to gather them into **one short "how we build" page**, not to add process. Each is a
short path with a clear "done when", and the dashboard shows where a tool or lesson is on it.

**Building a tool** — idea (a dashboard note) → brief (`specs/<id>.md`, ready) → scaffold (dev-gated, builds, smoke tests pass) → core
(generator, working, info, matches the brief) → teaching layer (Depth, lesson, developing picture where they fit, printables where they
fit) → review (review block, options within limit, phone / tablet / laptop checked) → live.

**Building a lesson or deck** — brief (`specs/decks/<id>.md`: one idea, what it excludes) → deck (the agreed arc: hook → check before →
explain → I do → we do → check after → you do → hand-off) → checks (by Depth id, never first) → hand-off presets tested → review on the
real slide at 1280×720 and on a phone → live (remove the Developing-tools gate). Today the arc lives in a code comment and `LESSONS.md`;
nothing says when a deck is "live".

**Rolling a capability across tools** (Depth, lessons, printables, the (i), calibration…) — decide it is worth having → pilot on one or two
tools → write the rule into `CLAUDE.md` → list it as a column on the dashboard Matrix → roll it out tool by tool through the Tool review
cycle → retire the old way it replaces. Today most capabilities stop after the pilot, which is where the split ends in §1 came from.

## 2a. Repo, admin and notes — one home for each fact (checked 2026-10-24)

The rule is in `CLAUDE.md` → "Where things live". The repo side now follows it. What is left is on the **planner** and **admin** sides, found by reading the planner's
"Build Tracking & Organisation" notes against `/admin`:

| In the planner now | Overlaps with | Proposed |
|---|---|---|
| **Tool Index** — counts, which tools are live, shell and sub-tools per tool, plus a running "Update 2026-…" changelog | the dashboard facts (generated) | Replace with a short pointer to `/admin`. Nothing here is judgement; all of it is computable. |
| **Tool pages** (about 75, by strand): At a glance, Sub-tools, Levels, Question options, Defaults | `TOOL_CONFIG` (and the generated "what can this tool do?" page proposed in §1 F) | Retire those blocks. Keep only teacher-facing narrative if it is wanted. |
| **Tool pages' Review blocks** | dashboard notes: Review, Wants to change, Open questions | Import once into the dashboard notes, then drop the planner copy, so there is one per-tool record that Claude can read and write. |
| **Different From & Additional To Tool Shell** | dashboard note field "Differs from / adds to the standard" | Import, then retire. |
| **Development Prongs** — Live in / Next / Why per prong, mirrored into tool pages | `docs/PROJECTS.md` (plan) and the Matrix ("which tools have it") | Keep *Why* and decisions; drop "Live in" lists (the Matrix is that list). |
| **Build Log** | `docs/PATCH_NOTES.md` | Keep (the human layer), but one short block per session that links to the repo entry instead of restating it. |
| **Features** | nothing generated covers it | Keep: the plain-English "what the site offers", by section. |
| **Representations** · **Characters** | `CLAUDE.md` / `CAST.md` hold the technical rules only | Keep. |

**Admin space — what it needs to be the shared per-tool record:** one-off import of the planner Review blocks (above); the planner-page link per tool (optional);
and, once built, the generated "what can this tool do?" page and the (i) "About this tool" panel, which move the remaining per-tool text out of the planner into the repo.

**Repo size** (the other streamlining lever, not yet done): the auto-loaded `CLAUDE.md` is about 32k tokens. Most of it is the shared-library reference
(`ToolShellProps` alone is 356 lines, then TOOL_CONFIG, diagram tools, key types), needed only when building or changing a tool. Splitting that into on-demand reference
files and keeping `CLAUDE.md` to the rules and the doc map would roughly halve what every session loads. Mark: **Decide** — it changes how sessions find the API.

## 2b. After the tidy — keep it from fraying (not started)

Ideas only, to be shaped once §1 is cleared:

- **One state per tool**: live or not, derived by the dashboard, instead of five switches.
- **A definition of live**: a short checklist the dashboard computes (tests, spec, within the option limit, reviewed).
- **No new mechanism without an owner**: a capability has a status (rolling out / done / retired) and a rollout list; the Matrix view is the
  standing picture of it.
- **Tests that catch drift**: option labels from a fixed vocabulary, an API option nobody uses is flagged, ids match routes.
- **Retire before you add**: a new way of doing something names the old way it replaces.

## 3. Parked ideas (kept so they are not lost)

Complexity stepper · slide-strip lesson builder and slide templates · saved lessons · `.pptx` export · layered Question Options popover (the six sections noted in F).
