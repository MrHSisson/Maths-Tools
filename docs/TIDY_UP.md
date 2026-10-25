# Tidy-up — split ends and half-finished ideas

**Priority: tidy, fix and level what exists.** Alongside it, write down how we build and roll out (§2). Only after that, put structures in place so new work does not fray it again (§2b).
This is an inventory of what is loose, found by reading the code and docs (2026-10-23, reshaped 2026-10-25). Each item is marked
**Finish** (it is worth completing), **Fold** (two things doing one job), **Remove** (dead weight) or **Decide** (needs a call from Harry).
Nothing here is scheduled.

## 1. What is loose

Every item has the same shape: what we found, why it matters, the suggested move, what is left to decide and where we lean. The mark is **Finish** (worth completing), **Fold** (two things doing one job), **Remove** (dead weight) or **Decide** (needs a call from Harry). Nothing here is scheduled.

### 1. Tools with no agreed fate

- **Mark:** Decide
- **What we found:** Six question tools are not live: Simplifying Ratios (no question options), Perimeter (the most outdated), Travelling Salesperson, Route Inspection, Mixed Strategies and File Sizes. Another 14 internal pages (the Tool Shell template, the Technique and Skill libraries, 11 technique previews) sit in the registry.
- **Why it matters:** Unfinished tools and internal pages clutter the registry and the counts.
- **Suggested move:** Take each one in turn and either take it live, finish it or shelve it.
- **To decide:** For each tool: go live · finish · shelve.
- **Leaning:** No leaning yet.

### 2. Built, but only on a handful of tools

- **Mark:** Decide
- **What we found:** Depth banks: 4 of 42 ToolShell tools. Lessons: 2 tools (Indices, Rounding), Developing-tools only. Teach decks: 3 tools, Developing-tools only. Calibrated worksheets: 1 tool (Order of Operations). Techniques engine: a few tools, plus 11 preview pages. Developing picture in Worked Example: 22 tools, with 19 live tools having none. Printable sheets: 1 tool (Rounding).
- **Why it matters:** Strong features that most teachers never meet look like gaps in the site.
- **Suggested move:** Grow each one tool by tool as part of that tool's review, or decide a few stay a premium extra.
- **To decide:** Which capabilities get rolled out widely and which stay as extras.
- **Leaning:** Grow the developing picture gradually; decide the rest per capability.

### 3. Two ways of doing one job

- **Mark:** Fold
- **What we found:** Three of the four doubles are still open. (1) Ordering a worksheet easy to hard: option weights (12 tools) and calibration (1 tool, Order of Operations). (2) Slides: the Teach tab, lesson decks, the Depth stage and skill slides, four surfaces. (3) Hiding a tool: `enabled`, `hidden`, `parked`, Developing-tools mode and `parkedMode`, five switches. The fourth, printing diagrams, is done (see Settled decisions).
- **Why it matters:** Two mechanisms for one job means a fix or a feature has to be made twice and teachers see inconsistent behaviour.
- **Suggested move:** Calibrate the tools that use weights, one at a time, then retire the weights; decide which slide surfaces survive; aim for two visibility switches (live / not live).
- **To decide:** Which slide-playing surfaces survive · whether weights are retired once calibration covers them · whether five switches can really become two.
- **Leaning:** Calibration is the better ordering mechanism. Do the visibility switches first: they are the smallest and the dashboard already derives a state from them.

### 4. Question Options that are walls

- **Mark:** Finish
- **What we found:** Median is 4 options per level, but Rounding (20), Ordering Numbers (18), Binomial Expansion (15), File Sizes (15), Speed/Distance/Time (14) and Order of Operations (13) are walls. The groups already sort into what is asked, the numbers, notation, method, the answer and support.
- **Why it matters:** A teacher faced with twenty switches cannot find the one they want.
- **Suggested move:** Regroup tool by tool into those six groups (the layered popover is parked, see item 10), after the structural items above.
- **To decide:** Whether to cap options per level.
- **Leaning:** Group first, cap later.

### 5. One "About this tool" (i)

- **Mark:** Finish
- **What we found:** The level (i) is done, but **Tool Information** is still a modal in the burger menu, so a teacher has to know to look there. It is a flat list of hand-written cards in the old style (`font-bold`, `shadow-2xl`, a box per item).
- **Why it matters:** The explanation of a tool is hard to find and looks out of step with the rest of the site.
- **Suggested move:** One (i) next to the tool title: what the tool does and is for, what the Question Options do (read from `TOOL_CONFIG` so they are never stale), which modes it has, the misconceptions it targets and any printables. Possible extra: a longer written explanation per level.
- **To decide:** Whether the per-level teaching explanations are worth writing.
- **Leaning:** Build the (i) first, add the per-level text later.

### 6. Printable ready-made sheets

- **Mark:** Finish
- **What we found:** Rounding's burger menu has "Print blank number lines (A4)" and "…every mark": pre-designed sheets with no generated questions. It is a one-off `menuItems` prop that both shells accept and only Rounding uses; it has not been named or documented.
- **Why it matters:** A good idea that is invisible and not rolled out.
- **Suggested move:** Name it "Printables" in `CLAUDE.md` and the dashboard Matrix, give it one heading and one print path in the burger menu, then roll it out where a teacher would reach for it: number lines, place value tables (Decimals already has a cousin in "Grids on worksheet"), ratio tables, blank axes and grids, bar-model strips. Decision tools already print blank networks inside exam papers.
- **To decide:** Which tools genuinely need a blank sheet.
- **Leaning:** Name and document it, then roll out to the number lines and place value tables first.

### 7. Names and homes that do not line up

- **Mark:** Fold
- **What we found:** Six registry ids are not kebab-case (Times Tables, Negative Operations, Multiplication Methods, Functional Skills, Recipes, system architecture) and nine ids do not match their route (`integers` → `/integer-add-and-subtract`, `ratio` → `/ratio-sharing`…). "Teacher Tools" holds the Visualiser and the internal pages. "Binary & Number Bases" is its own strand apart from Computer Science. Question Option labels disagree: "Question Types" (14) against "Question type" (5), "Operation" against "Operations", "Find" against "Ask for".
- **Why it matters:** Inconsistent names make the site and the code harder to search and to trust.
- **Suggested move:** Align ids with routes and kebab-case, settle the strand homes, and add a test for option label vocabulary.
- **To decide:** Whether Binary joins Computer Science and where the Visualiser lives.
- **Leaning:** Fold as files are touched; decide the strands now.

### 8. Loose typing at the shell/tool seam

- **Mark:** Finish
- **What we found:** 61 `eslint-disable no-explicit-any`, mostly `(q as any)._diagram`, `_rawValues` and `_focus`; 18 `as any` in `WorksheetBuilder` and 15 in `ToolShell`.
- **Why it matters:** The underscore fields are the contract between a tool and the shell, and nothing checks them.
- **Suggested move:** One `QuestionExtras` interface for the underscore fields (`_diagram`, `_rawValues`, `_stepFocus`, `_stagedReveal`, `_printText`…) and a typed accessor.
- **To decide:** Typed interface and migrate as files are touched · leave as `any`.
- **Leaning:** Typed interface, gradual.

### 9. Very large files

- **Mark:** Fold
- **What we found:** `AlgebraTiles` 2,039 lines, `SystemArchitecture` 1,713, `OrderOfOperations` 1,597, `Surds` 1,197, `FunctionalSkillsGenerator` 2,228, plus `TeachingDeck` 1,244 and `WorksheetBuilder` 823 in the shell.
- **Why it matters:** They are slow to read and to change safely.
- **Suggested move:** Split on the seams that already exist (generator, question renderer, Depth, teach), only when a file is touched.
- **To decide:** Which to split and on what seams.
- **Leaning:** Not urgent.

### 10. Parked ideas

- **Mark:** Decide
- **What we found:** Colour schemes (a long-term accessibility update that needs a proper rework first) · Complexity stepper · slide-strip lesson builder and slide templates · saved lessons · `.pptx` export · layered Question Options popover (the six groups in item 5) · skill drill-downs: the `[[skill|term]]` markers stay in three tools, inert until the Skill Library is un-parked (`docs/BACKBENCH.md`), and the smoke tests still check each marker names a real skill.
- **Why it matters:** They are kept so they are not lost, not because they are scheduled.
- **Suggested move:** Pick one back up only when a current item clears.
- **To decide:** Which idea, if any, comes next.
- **Leaning:** None yet.

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

## 2a. Repo, notes and admin — three views of one project (checked 2026-10-24)

How they work together is in `CLAUDE.md` → "How the three sources work together": **the repo is everything needed to continue**, **the notes are the deeper per-session
record the repo can reference**, and **the admin page is the site and its development at a glance, in a friendlier interface**. The repo side now follows that. What would
bring the other two in line (for discussion — nothing here is decided or started):

- **Notes → stay current without effort.** The planner's **Tool Index** carries counts and live / in-development state typed by hand, with a running "Update 2026-…" changelog, so it goes stale
  each time a tool changes; the dashboard now generates exactly that. Either refresh those lines from the dashboard at the end of a session, or replace them with "as of <date>" and a pointer to `/admin`.
  The **Development Prongs** "Live in" lists have the same problem (the Matrix is that list).
- **Notes ↔ repo links.** Each Build Log block names its branch and the `docs/PATCH_NOTES.md` entry, and each entry has a `Notes:` line back. Not yet done for past sessions.
- **One per-tool record — decided 2026-10-24: the dashboard.** Status, in development, wants to change, differs from, representation, review and open questions are kept on the dashboard, where Harry and Claude both edit them as the work happens. The planner copies them at each session (the Build Log block, and a tool page's own blocks only for things the code produces or a longer write-up). Each planner tool page's Review block stays as the historical record and is not updated going forward.
- **The admin page as the front door.** Today it is a list of tools. For "the site and its development at a glance" it could open on an **overview**: where the site is (live tools by strand), the current
  priority (`docs/TIDY_UP.md`), the prongs and where each is up to (`docs/PROJECTS.md`), what shipped most recently (`docs/PATCH_NOTES.md`), and a link to the matching Build Log block. The List,
  Matrix and Next up views stay behind it.
- **The generated "what can this tool do?" page and the (i) "About this tool" panel** (§1 items 4 and 5) are the other way the admin side gets friendlier: per-tool understanding in the site, not scattered text.

**Repo size** (a separate lever, not yet done): the auto-loaded `CLAUDE.md` is about 32k tokens. Most of it is the shared-library reference (`ToolShellProps` alone is 356 lines, then TOOL_CONFIG, diagram tools,
key types), needed only when building or changing a tool. Splitting that into on-demand reference files and keeping `CLAUDE.md` to the rules and the doc map would roughly halve what every session loads.
Mark: **Decide** — it changes how sessions find the API.

## 2b. After the tidy — keep it from fraying (not started)

Ideas only, to be shaped once §1 is cleared:

- **One state per tool**: live or not, derived by the dashboard, instead of five switches.
- **A definition of live**: a short checklist the dashboard computes (tests, spec, within the option limit, reviewed).
- **No new mechanism without an owner**: a capability has a status (rolling out / done / retired) and a rollout list; the Matrix view is the
  standing picture of it.
- **Tests that catch drift**: option labels from a fixed vocabulary, an API option nobody uses is flagged, ids match routes.
- **Retire before you add**: a new way of doing something names the old way it replaces.

## Settled decisions

| Decision | What we chose | When |
|---|---|---|
| Dev-mode working chains | Three tools (Simultaneous Equations, Non-linear Sim Eq, Fraction to Ratio) keep two versions of their working behind the developer switch. Decided to keep both for now and settle which a class sees inside each tool's own review: the question is already on each tool's dashboard note, so it no longer needs a card here | 2026-10-25 |
| Printing diagrams | Basic Angle Facts and Angles in Parallel Lines now print through the shared `handleDiagramPrint` (their own print pages are gone; the parallel-lines answers keep their reasoning through a new `_printAnswer`, and both gain a choice of columns). Recipes keeps its own print on purpose: its "Needed / You Have" tables are not pictures | 2026-10-25 |
| Colour scheme argument in the renderer API | The `colorScheme` argument is gone from every renderer (`questionRenderer`, `answerRenderer`, `stepRenderer`, `stepVisualRenderer`, the working scaffold's `render`) and from the worked-example steps. Positional arguments moved up by one, so the type-check found every tool that needed changing; `CLAUDE.md` shows the new signatures | 2026-10-25 |
| Decision tools: story text separate from numbers | Not doing it now; a Decision option becomes display-only if and when a Decision tool is next reworked and the story text is separated then | 2026-10-25 |
| Display-only options | Five more options now redraw the same question when flipped: Fractions "Whole & Part Method", Powers of 10 "10ⁿ notation", Percentages "Unitary method", Ratio Sharing "Numerical method" and Best Buys "Force unitary method" (it changes the comparison unit in the working and the answer line, never the packs; such a switch is marked `rewordsAnswer` and the test then checks the question is identical instead) (the other two on the old list, Decimal "Table starts" and the Geometry show-switches, already did). The existing test replays every flagged option and fails if the answer changes | 2026-10-25 |
| Local copies of `randInt` / `pick` | The shared versions are used everywhere: the five tools and four Decision files that defined their own now import them (`pick` accepts read-only lists). Other helpers for `math.ts` (simplify fraction, prime factors, a `Fraction` type…) are added when a tool needs them, not ahead of time | 2026-10-25 |
| File-local exports | 148 exports that no other file used are no longer exported, and one dead function (`histHasNoHoles`) was deleted. A test (`src/tests/localExports.test.ts`) fails if a new one appears | 2026-10-25 |
| Dashboard counts | The dashboard lists 79 tools of 80 registry entries; the one it leaves out is the dashboard itself, which is not a tool. A test (`src/tests/dashboardCounts.test.ts`) explains the gap and fails if another unlisted entry appears | 2026-10-25 |
| Hook dependencies, everywhere | Every file under `src` now passes the React hooks lint rules, with no files left off the check. The last ones were fixed or justified: missing dependencies in `ExpandingBrackets`, `SystemArchitecture` and `ParallelLinesInteractive`; each deliberate exception in `SmartGrapher`, `DecisionShell`, `ExamView`, the CS `ExamMode`, `GrapherLab`, `WordsHangman` and `BinaryCounting` now says why. A test fails if one has no reason | 2026-10-25 |
| Hook-dependency lint for the shell | ESLint with the React hooks rules is installed (`npm run lint`, run in CI beside the build and tests). The tool shell and the shared components pass it: each place that deliberately skips the rule says why (`-- deliberate: …`, enforced by a test), a missing dependency in the Escape-key, Visualiser and worked-example effects was fixed, and `npm run smoke:shell` also runs in CI in a real browser | 2026-10-25 |
| The tool shell | Split from one 2,450-line file into a small lessons wrapper, a 990-line core, screen components (Whiteboard, Worked Example, Worksheet, phone layout) and small files for share links, options, worksheet generation and the question lifecycle. Every screen runs behind a guard that names it when it fails, generators fail without freezing the page, and failures are recorded with their setup. Tests and `npm run smoke:shell` check it | 2026-10-25 |
| Where the level text lives | One (i) beside the level buttons on every tool, with a fuller pop-up per level; the Level entries left the burger menu | 2026-10-25 |
| Changing a Question Option | It keeps the current question and the next one follows the new options; display-only options replay the same question instantly | 2026-10-25 |
| Colour schemes | Removed from every tool; parked as a long-term accessibility idea | 2026-10-25 |
| Recipes `\text{}` steps | Converted to `mStep` / `tStep`, and the smoke test now blocks them | 2026-10-24 |
| Docs and code that disagreed | README, PROJECTS, CLAUDE, glossary, plans and spec statuses brought back in line with the code | 2026-10-24 |
| Dev-mode working chains (Simultaneous Equations, Non-linear Sim Eq, Fraction to Ratio) | Keep both chains for now and settle per tool in its review | 2026-10-24 |
