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
| Developing picture in Worked Example | 22 tools; 19 live tools have none | Finish gradually, per tool review |
| Ready-made printable sheets (burger menu) | 1 tool — Rounding (blank number lines, two styles) | Finish: see H |

### B. Two ways of doing one job

| Job | The two ways | Mark |
|---|---|---|
| Ordering a worksheet easy → hard | option **weights** (12 tools) and **calibration** (1 tool) | Fold: one mechanism, calibration is the better one |
| Printing diagrams | shared `handleDiagramPrint` (8 tools) vs hand-rolled grids (Basic Angle Facts, Angles in Parallel Lines, Recipes) | Finish: move the three onto the shared one |
| "Slides" | Teach tab, lesson decks, Depth stage, skill slides — four slide-playing surfaces | Decide: which survive |
| Hiding something from the public | `enabled`, `hidden`, `parked`, Developing-tools mode, `parkedMode` — five switches | Fold: aim for two (live / not live) |

### D. Tools with no decision

Six question tools are not live and have no agreed fate: **Simplifying Ratios** (no question options), **Perimeter** (most outdated),
**Travelling Salesperson**, **Route Inspection**, **Mixed Strategies**, **File Sizes**. Plus 14 internal pages (Tool Shell template — now hidden —
Technique and Skill libraries, 11 technique previews) that sit in the registry. Mark: **Decide** each — go live, finish, or shelve.

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
- `NonLinearSimEq` keeps two working chains for its `linear` sub-tool — the old hand-rolled one for everyone, the technique-based one only in Developing-tools mode (`getDevMode()` branch with `legacySolvePos` / `legacySolveNeg`). **Decided 2026-10-24: keep both for now; settle it inside each tool's review / development** (also Simultaneous Equations and Fraction to Ratio — J4).
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

### J. Code audit — shell against tool logic (2026-10-24)

A static sweep of `src/` (type-check with unused-locals on, orphan files, unused exports, duplicated helpers, rule violations, dev-mode branches, stale references in the docs). **Clean:** the type-check has no unused locals or parameters; no orphan files; no `console.log`; no tool imports `react-router` or another tool; `shared/` never imports from `tools/`; only two `TODO`s; every `CLAUDE.md` file path exists. **Fixed in the same session:** the template (`TeacherTools/ToolShell.tsx`) still taught the old "cycle button" look; four tools carried a verbatim copy of `makeUniqueQ` (`SolvingLinearEquations`, `CompletingTheSquare`, `RatioSharingTool`, `Estimation` — the shell already does this, so the prop is gone); stale comments on the no-op option types; `CLAUDE.md` pointed at `DIFFICULTY_TIER_L2`, `buildDecimalValues`, `cycleLabels` and `ToolShellState`, which no longer exist.

Open items, most valuable first (each is a Finish / Fold / Decide; the numbering keeps the gaps left by finished items):

| # | Finding | Why it matters | Suggested move |
|---|---|---|---|
| 1 | **`ToolShellCore` is one component of about 2,100 lines** (41 `useState`, 25 `useEffect`, 32 `mode ===` branches, 21 `eslint-disable` for hook dependencies) | Every shell change touches everything; the disabled lint rules hide real stale-closure risk | Extract hooks one at a time: URL/state sync, worksheet generation, fullscreen fit, QO state. Behaviour-preserving, one hook per commit, tests after each |
| 2 | **Local copies still in tools:** `randInt` / `pick` are defined locally in 5 tools despite the shared ones (`gcd`, `lcm`, `shuffle` and `formatNumber` are done) | A bug fix has to be made N times | Replace the copies with the shared ones as each tool is touched |
| 4 | **Dev-mode branches inside generators (kept for now, 2026-10-24):** `SimultaneousEquations`, `NonLinearSimEq` (two working chains, the old one for everyone) and `FractionToRatio` (a `getDevMode()` label) | The working a class sees depends on a developer switch; the old chain can never be tested against the new in CI | Settle which chain wins inside each tool's review, then delete the other. Each tool's dashboard note carries the open question; Non-linear Sim Eq and Collecting Like Terms also still use `\text{}` in steps (allow-listed in the smoke test until then) |
| 9 | **Loose typing at the shell/tool seam:** 61 `eslint-disable no-explicit-any`, mostly `(q as any)._diagram`, `_rawValues`, `_focus`; 18 `as any` in `WorksheetBuilder`, 15 in `ToolShell` | The underscore fields are the contract between a tool and the shell, and nothing checks them | One `QuestionExtras` interface for the underscore fields (`_diagram`, `_rawValues`, `_stepFocus`, `_stagedReveal`, `_printText`, …) and a typed accessor |
| 11 | **Very large files:** `AlgebraTiles` 2,039, `SystemArchitecture` 1,713, `OrderOfOperations` 1,597, `Surds` 1,197, `FunctionalSkillsGenerator` 2,228, plus `TeachingDeck` 1,244 and `WorksheetBuilder` 823 in the shell | Slow to read and to change safely | Split on the seams that already exist (generator / question renderer / Depth / teach); not urgent |
| 12 | **File-local exports:** 129 exports are used only inside their own file | Noise in the public surface | Un-export as files are touched |


#### J — the decision tree (recorded 2026-10-24, nothing here is started)

Each area above is its own branch with its own decisions. This is the record only: **no code is changed for any of these until Harry picks a branch and decides it.** Done rows have been removed (see `docs/PATCH_NOTES.md`); status of the rest: *undecided* unless stated.

| Area (J item) | Decisions to make | Options | Leaning |
|---|---|---|---|
| **Shell size** (1) | Whether to split `ToolShellCore`; which hook first; whether to re-enable the disabled lint rules afterwards | Extract hooks one per commit (URL sync, worksheet generation, fullscreen fit, QO state) · leave until a shell feature forces it | Extract, URL sync first (best-tested) |
| **Shared maths helpers** (2) | Whether the last local `randInt` / `pick` copies go; what else `math.ts` holds | Candidates, in order of need: simplify fraction / ratio, `gcdThree`, `lcmAll` · `isPrime`, `primeFactors`, `factorPairs` · rounding and significant-figure helpers · distinct-integer and weighted / rare picks · seeded random for tests · positive `mod`, `clamp`, signed-term formatting · one exact `Fraction` type for A-level work. Add each when a tool needs it, not ahead of time | Fractions / ratios and primes next (duplicates exist) |
| **Dev-mode branches** (4) | Which working chain a class sees in Simultaneous Equations, Non-linear Sim Eq and Fraction to Ratio | New chain for everyone, delete the old · keep both behind the switch | Decided 2026-10-24: keep both for now and settle per tool in its review |
| **Recipes `\text{}`** (7) | Convert three steps to `mStep` / `tStep`; add a smoke-test check so it cannot come back | Fix and test · fix only | **Done 2026-10-24.** |
| **Underscore fields** (9) | A typed `QuestionExtras` for `_diagram`, `_rawValues`, `_stepFocus`, `_stagedReveal`… | Typed interface, migrate as files are touched · leave as `any` | Typed interface, gradual |
| **Large files** (11) | Which to split and on what seams | Split on generator / renderer / Depth / teach seams, only when touched | Not urgent |
| **File-local exports** (12) | Un-export the 129 used only inside their own file | Un-export as touched | As files are touched |

Order of work, if and when Harry wants to resume: pick the branch, decide its row, then do one branch at a time with `npm run build` and `npm test` green before the next. Unrelated flaky test: one full-suite run once failed one test (not identified; it passed on two re-runs) — watch for it.


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
- **The generated "what can this tool do?" page and the (i) "About this tool" panel** (§1 F, I) are the other way the admin side gets friendlier: per-tool understanding in the site, not scattered text.

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

## 3. Parked ideas (kept so they are not lost)

Complexity stepper · slide-strip lesson builder and slide templates · saved lessons · `.pptx` export · layered Question Options popover (the six sections noted in F) · **skill drill-downs**: the `[[skill|term]]` markers stay in the three tools that carry them, inert until the Skill Library is un-parked (`docs/BACKBENCH.md`); the smoke tests still check that each marker names a real skill.
