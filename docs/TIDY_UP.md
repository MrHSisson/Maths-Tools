# Tidy-up — split ends and half-finished ideas

**Priority: tidy, fix and level what exists.** Alongside it, write down how we build and roll out (§2). Only after that, put structures in place so new work does not fray it again (§2b).
This is an inventory of what is loose, found by reading the code and docs (2026-10-23, reshaped 2026-10-25). Each item is marked
**Finish** (it is worth completing), **Fold** (two things doing one job), **Remove** (dead weight) or **Decide** (needs a call from Harry).
Nothing here is scheduled.

## 1. What is loose

Every item has the same shape: what we found, why it matters, the suggested move, what is left to decide and where we lean. The mark is **Finish** (worth completing), **Fold** (two things doing one job), **Remove** (dead weight) or **Decide** (needs a call from Harry). Nothing here is scheduled.

### 1. Built, but only on a handful of tools

- **Mark:** Decide
- **What we found:** Depth banks: 4 of 42 ToolShell tools. Lessons: 2 tools (Indices, Rounding), Developing-tools only. Teach decks: 3 tools, Developing-tools only. Calibrated worksheets: 1 tool (Order of Operations). Techniques engine: a few tools, plus 11 preview pages. Developing picture in Worked Example: 22 tools, with 19 live tools having none. Printable sheets: 1 tool (Rounding).
- **Why it matters:** Strong features that most teachers never meet look like gaps in the site.
- **Suggested move:** Grow each one tool by tool as part of that tool's review, or decide a few stay a premium extra.
- **To decide:** Which capabilities get rolled out widely and which stay as extras.
- **Leaning:** Grow the developing picture gradually; decide the rest per capability.

### 2. Question Options that are walls

- **Mark:** Finish
- **What we found:** Median is 4 options per level, but Rounding (20), Ordering Numbers (18), Binomial Expansion (15), File Sizes (15), Speed/Distance/Time (14) and Order of Operations (13) are walls. The groups already sort into what is asked, the numbers, notation, method, the answer and support.
- **Why it matters:** A teacher faced with twenty switches cannot find the one they want.
- **Suggested move:** Regroup tool by tool into those six groups (the layered popover is parked, see `docs/BACKBENCH.md`), after the structural items above.
- **To decide:** Whether to cap options per level.
- **Leaning:** Group first, cap later.

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
- **The generated "what can this tool do?" page and the (i) "About this tool" panel** (the "About this tool" panel is built, see Settled decisions) are the other way the admin side gets friendlier: per-tool understanding in the site, not scattered text.

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
| Perimeter | Rewritten from scratch as **Perimeter & Area** (stand-alone; id `perimeter-and-area`, `/perimeter` redirects): Perimeter and Area together, **arcs and circles out** (Circle Properties owns them), **algebraic perimeter and area as its own tab**, a **squared-grid counting tab** in. Four tabs: Counting on a Grid, Standard Shapes, Compound Shapes, With Algebra. Labels are placed by a collision-aware search, and **Reduced Labelling** leaves out only the labels the drawing already implies (it pairs with Some Missing, whose ? sides are always sums or differences, never copies). Live. Brief: `specs/perimeter-and-area.md` | 2026-10-26 |
| Simplifying Ratios | Merged into **Ratio Manipulation** (the renamed Fractions ↔ Ratios: id `ratio-manipulation`, `/fraction-to-ratio` redirects). **Simplifying** is one tab with a Question Types pool (whole numbers, different units, decimals, fractions, letters, already simplest) and an Ask for choice (simplest, 1 : n, n : 1); algebra is a pool item, not a tab. **Equivalent Ratios** is new: Level 1 picks the equivalent ratio from A–D, Level 2 scales by a whole number, Level 3 simplifies then scales, both on the ratio table. `specs/ratio-manipulation.md` | 2026-10-26 |
| Tools with no agreed fate | Closed 2026-10-26: File Sizes, the merged Ratio Manipulation and the rebuilt Perimeter & Area are live; the three Decision tools are in the Decision exam-style questions prong and go live through it (no longer a loose end). Decided earlier the same day: **File Sizes** goes live. **Travelling Salesperson, Route Inspection and Mixed Strategies** become part of a new prong, *Decision exam-style questions* (`docs/PROJECTS.md`), and go live through it. **Simplifying Ratios** is to be merged into a separate ratio tool after its Question Options are listed. **Perimeter** is to be reworked from a fresh brief | 2026-10-26 |
| Slides | Slides moved out of the tidy-up list into the plan as their own prong (**Slides**, `docs/PROJECTS.md`): which of the four surfaces (Teach tab, lesson decks, the Depth stage, skill slides) survive is a build-out decision, not a loose end. Leaning kept there: keep Depth and the lesson decks; fold the Teach tab and skill slides into them | 2026-10-26 |
| Large files and parked ideas | Neither needs a decision, so neither is a loose end. **Very large files** (the biggest tools and shell files): no clean-up job; split on the seams that already exist (generator, question renderer, Depth, teach) only when a file is touched for another reason. **Parked ideas** (colour schemes, complexity stepper, slide-strip lesson builder and slide templates, saved lessons, `.pptx` export, the layered Question Options popover, skill drill-downs): kept as a list in `docs/BACKBENCH.md` under "Parked ideas" so none is lost; one is picked up only when a current item clears | 2026-10-26 |
| Equal-side ticks | Squares, regular polygons, isosceles triangles and parallelograms keep their equal-side tick marks, with or without Reduced Labelling (Perimeter & Area): the ticks are how those pictures say two sides are equal. Compound shapes have no ticks, since equal sides there are implied by the drawing | 2026-10-26 |
| Printables | Named and wired into the shell: a tool passes `printables` and the burger menu lists them under one "Printables" heading, printed through one path (`src/shared/printables.ts`). Five shared sheets (number line, place value table, binary table, ratio table, coordinate grid) go on the tools whose working is built on that blank (the dashboard's Printables filter lists them); the rule is that a tool offers one only when students fill in a blank, and a test enforces it. The old one-off `menuItems` prop is gone. Bar-model strips were left out: no live tool uses the bar model yet | 2026-10-26 |
| Registry ids | Every tool's id is its route without the slash, in lower-case words joined by hyphens (`ratio` → `ratio-sharing`, `integers` → `integer-add-and-subtract`, `Times Tables` → `times-tables` (its route moved from `/timestables`, which still redirects), `grapher-lab` → `grapher`, `system architecture` → `system-architecture`…: sixteen renamed). The ids are never in a link, so no route changed and no old link needed a redirect; the thing that carried an id was each tool's dashboard note, which was copied to the new id (the old entries stay in the store until the branch is merged, then are removed with the notes service's new `remove` action). A test (`src/tests/registryIds.test.ts`) fails on an id that is not kebab-case or not its route. The technique previews keep their `technique-preview-…` ids: they are pages, not tools | 2026-10-26 |
| Strand homes | Binary & Number Bases is no longer its own strand: its five tools sit in Computer Science as the group "Binary & number bases", beside the group "Computer systems" (the revision topics). The Visualiser has a **Classroom** strand of its own and the internal pages (Tool Shell, Skill Library, Technique Library) a **Workshop** strand (Developing-tools mode only); both are `subject: 'All subjects'`, so they show on every subject tab. The folders (`src/tools/Binary/`, `src/tools/TeacherTools/`) stay where they are | 2026-10-26 |
| Group label wording | Every Question Option group label (the heading over a pool or dropdown) is Title Case, and one word means one thing: **Method** (how it is worked: FOIL or grid, ratio table or decimal, digit rule or number line), **Working Shown** (how much working: full or constants only, long division or result only), **Answer Format** (how the answer is written), **Ask for** (what the question asks for), **Operation** (which operation). Sixty-odd labels changed; `src/tests/levelLabels.test.ts` fails on a label that is not Title Case or that goes back to a retired wording | 2026-10-26 |
| Question Option labels | One vocabulary for the group labels (the heading over a pool or dropdown): a pool you can tick several of is plural ("Question Types", "Operations", "Bases", "Coefficients", "Solution Types"), one spelling per label across the site, and "Ask for" is the label for what a question asks for (never "Find" or "Ask"). 22 labels renamed; a test in `src/tests/levelLabels.test.ts` fails on a clash or a synonym | 2026-10-26 |
| Question underscore fields | The data a tool hangs on a question for the shell (`_diagram`, `_rawValues`, `_stagedReveal`, `_stepFocus`, `_printText`…) is one interface, `QuestionExtras`, with a typed reader `extras(q)` and `withExtras(q, {…})` (`src/shared/questionExtras.ts`). Every read in the shell and the tools goes through it, so `as any` for these is gone (the shell's own reads of a question's fields are typed too, and the dead "frac" question kind was deleted from print, the worksheet view and the question display: `as any` casts in the app went from 111 to 13, three of them reading `window` and the rest in the standalone PDF generator, Rounding's cell drawing and one diagram helper). A test fails on any underscore field the interface does not list, on a listed one nothing uses, and on a new `(q as any)._x`. Writes are still object literals cast to `AnyQuestion`, checked by that name test; fields private to one tool are `unknown` in the interface and the tool narrows them where it reads | 2026-10-26 |
| "About this tool" | One click-through panel from the burger menu, kept apart from the level (i) beside the level buttons (which stays). Its Question Options topic is written from the config; it opens once per live tool per device on the first visit (not from shared links or lessons), with "Show tool tips again" on the landing menu. Per-level teaching text is a later extra for the level (i) | 2026-10-25 |
| Ordering a worksheet easy to hard | One mechanism: calibration. Eight tools score each question from the question itself and the worksheet spreads across eight bands: Order of Operations, Decimal Add/Sub, Speed Distance Time, File Sizes, Factor Theorem, Partial Fractions, Indices and Surds. Option weights are gone (`weight`, `weightOf`); `calibrated: true` marks a tool and a shared test kit checks it. Variety pools that should stay even on a short sheet are `balanced: true` (Rounding's zero kinds, Speed Distance Time's mixed types) | 2026-10-25 |
| Hiding a tool | Two states only: live or not live (`enabled: false`, shown with Developing-tools mode). The `hidden` and `parked` switches and the separate parked gate (`?parked=1`) are gone. The dashboard and technique previews are `PAGES` in the registry (no state, no card). Skill drill-down links and the Skill Library now follow Developing-tools mode | 2026-10-25 |
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
