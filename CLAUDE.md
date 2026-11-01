# Maths Tools — Claude Code Instructions

## What this file is

CLAUDE.md is read automatically by Claude Code at the start of every session. It holds the rules and a short **Rules checklist**, and it points to the reference files in `docs/reference/` that document every interface, type, export and convention in full, so no shared source files need to be read before starting work. **It is deliberately kept small** (a test caps its size): long reference goes in `docs/reference/`, not here. **The session workflow (start and end of a session, the record, the dashboard notes API, kickoffs) is in `AGENTS.md`: read it at the start and end of every session.**

---

## Documentation map — which doc, and when

The repo's knowledge is split across a small set of docs, each with one job. Read
this table first; it tells you where to look and where to write.

| Doc | Job | Read it when… |
|---|---|---|
| **`CLAUDE.md`** (this file) | The rules — conventions, the Rules checklist, the workflow, how to build a tool; and the index to the reference files. | Always (auto-loaded). The default answer to "how do I…". |
| **`AGENTS.md`** | The workflow, for Claude Code and Codex alike: setup and checks, branches and merge order, the Handoff note, the end-of-session record (repo, dashboard, planner), the dashboard notes API and kickoffs. Read automatically by Codex. | **At the start and end of every session.** |
| **`README.md`** | Human-facing project overview, tech stack, local setup. | First orientation; onboarding a person. |
| **`docs/TASKS.md`** · **`docs/pathways/`** | The plan. Tasks: smaller to-dos (checks, consistency fixes, one-off jobs). Pathways: the larger developments, one file each (status, intention, progress, next steps; shown on the dashboard). **Never add a task, a pathway or a next step on your own: only when Harry asks, or after you suggest it in chat and he approves.** | **Start of a session** (what is open / what is being built). Update the task or pathway you moved at the end. The shape of a pathway file is in `docs/pathways/README.md`. |
| **`docs/BACKBENCH.md`** | Paused work (the Skills library) lifted out of the plan until readdressed. | Only when someone decides to pick the Skills library back up. |
| **`docs/reference/*.md`** (seven files: `toolshell`, `options-and-calibration`, `questions-and-working`, `pictures`, `depth-teach-lessons`, `decks`, `shell-extras`) | The shared-library reference that used to live in this file: the `ToolShellProps` interface, question and working-step types, `TOOL_CONFIG` and Question Options, representations and diagram printing, Depth / Teach / lessons, ink / printables / Decision shell. | Before changing or building anything it covers: **read the one file the index below points to.** Its never/always rules are all in the Rules checklist below. |
| **Tools dashboard** (`/admin`, Developing-tools mode) | The friendly, interactive overview of every tool: live / not live, what it has (Depth, lessons, Teach, developing picture, calibration…), pictures used, plus hand-written notes. **Read and written by both Harry and Claude.** | Overseeing the project; at the end of a session, update the notes for the tools you touched (see `AGENTS.md`). |
| **`docs/FEATURES.md`** | Plain-language name and purpose of every feature (Whiteboard, Worked Example, Depth, instant reformat, the information (i), Smart Progressor…). Shown on the dashboard (Features). | Describing a feature to a person, or adding one: **add or update its entry in the same session you build it**, then run `npm run facts`. |
| **`docs/HOW_A_TOOL_IS_BUILT.md`** | Plain-language overview of how the repo builds a tool: what is in a tool file, what each surrounding file is for and what to be aware of. Also shown on the dashboard (Developments → How a tool is built). | Orienting a person (or a fresh session) to the build; keep it true when a shared file is added or its rules change. |
| **`docs/PATCH_NOTES.md`** · `docs/history/` | What each session shipped, newest first, split Maths / CS. The current file holds only the last few days; `docs/history/` holds older months. The fuller per-session record is the planner Build Log. | Seeing what was actually done — read only the top few entries. **Add an entry at the end of a session.** |
| **`docs/architecture/CS_SHELL_PLAN.md`** | The `CSShell` architecture and its extraction stages. | Building or extending a CS tool. |
| **`docs/architecture/DECISION_SHELL_PLAN.md`** | The `DecisionShell` architecture — network-native question generators (MST/TSP/CPA) on a shared representation library. | Building or extending a Decision Maths tool. |
| **`docs/GLOSSARY.md`** | Canonical name for every element (tool, grain, technique, skill, QO…). | Naming or discussing anything — use these words. |
| **`docs/design/DECK_BUILD_CHECKLIST.md`** | What has gone wrong building decks, and the guard (automatic or by hand) for each; the standard layouts (book work 3 × 4, worksheets A4). | Before building or changing any deck. |
| **`docs/design/LESSONS.md`** | How a lesson is structured (teach → practise → set → extend), how decks sit inside it, QO rules that serve it, and what the Indices pilot taught us. | Authoring a lesson, a Teach deck or lesson steps. |
| **`docs/design/CAST.md`** | The Depth cast (eight named characters + Feathers the owl): names, rules, how to add a member. | Writing Depth speakers or touching `DepthArt.tsx`. |
| **`docs/design/LESSON_STYLE.md`** · **`docs/design/SLIDE_FEATURES.md`** · **`docs/design/templates/LESSON_PLAN_TEMPLATE.md`** | How Harry's whole-lesson decks are shaped, what can go on a slide, and the short plan he can send. | Planning or building a deck (then `docs/reference/decks.md`). |
| **`docs/design/DESIGN_STUDIO.md`** | The one entry point for designing a new build *with Claude in chat* (repo linked): routes to the right template for a maths tool / CS tool / technique / Teach deck. | Understanding where a brief in `specs/` came from, or how new ones are produced. |
| **`docs/design/templates/TOOL_SPEC_TEMPLATE.md`** · **`docs/design/templates/CS_TOPIC_SPEC_TEMPLATE.md`** · **`docs/design/templates/TECHNIQUE_SPEC_TEMPLATE.md`** · **`docs/design/templates/DEPTH_SPEC_TEMPLATE.md`** · **`docs/design/templates/TEACH_DECK_SPEC_TEMPLATE.md`** · **`docs/design/TOOL_DESIGNER_PROMPT.md`** · **`specs/`** | The spec pipeline — one fill-in template per build type, the deep maths-tool designer prompt, and the completed briefs. | Designing or implementing any build from a brief. |

## Visual direction — clean, subtle, modern

New and touched UI follows one quiet style (landing page, ToolShell and DecisionShell chrome already do): page background `PAGE_BG` (`#f8f9fb`, `src/shared/colors.ts` — only a touch darker than the cards; cards are defined by border + shadow, not a dark backdrop); cards `rounded-2xl border border-slate-300 shadow-card` (`shadow-card` / `shadow-lift` are the Tailwind tokens in `tailwind.config.js`; never `shadow-xl/2xl`; containers need that soft lift); 1px `slate-300` card borders (`slate-200` for hairlines inside a card), not `border-2`; `font-semibold` rather than `font-bold` for controls; titles `text-3xl font-semibold` with no divider rules; tool tabs as small pills, mode tabs as underline tabs; strand colour only as a small dot; descriptions behind an (i) rather than in boxes; phone: fixed bottom action bar and full-screen option sheets; pictures and questions are sized for the phone (capped height box, shrink-to-fit, `text-xl` question) rather than inheriting desktop size controls. Don't restyle a tool's pictures or content for this — chrome only. Leave other tools alone until they are touched.

---

## What this project is

A React/TypeScript/Vite app of interactive maths tools for teachers. Each tool has three modes — Whiteboard, Worked Example, Worksheet — with Levels 1–3, differentiated worksheets, and PDF export. Deployed to Vercel. CI runs on every push via `.github/workflows/ci.yml`.

**Purpose:** build complete new tools end-to-end from a spec — writing all the code, registering the route, and pushing. The spec supplies the maths content.

**Always consider three screen sizes — phone, tablet, laptop.** This is a standing rule, not a development pathway. Check by hand (headless Chromium is fine) at one representative size each, plus the in-betweens when something is fiddly:

| Size | Viewports to check | What it means |
|---|---|---|
| **Phone** | 390×800 (up to 640 wide) | ToolShell's ≤640px layout is automatic; DecisionShell uses the click-through start screens and a fixed bottom bar. Bespoke renderers and standalone sandboxes must be checked by hand. |
| **Tablet** | 1180×820 and 1024×768 (landscape — the layout is designed for this), 820×1180 and 768×1024 (portrait: the phone's stacked arrangement, with a small "works best in landscape" note) | **The phone's interaction model, laid out landscape**: the same click-through start screens and fixed bottom action bar (with text labels) and touch targets ≥ 40px, but wider — picture beside question and steps (DecisionShell), 2-column worksheet cards and a wider column (ToolShell) — and **the Whiteboard stays** (phones have none). Chosen by `useLayoutMode()` (`src/shared/layoutMode.ts`): 641–1180px wide, or a touch-first device (`pointer: coarse`) up to 1400px (an iPad Pro in landscape). Both shells read it; tools add nothing. |
| **Laptop** | 1366×768 (and 1920×1080) | The working area is about one screen tall (`STAGE_H` for Decision tools). Short screens (≤820px high) get tighter spacing. |

Spacing and sizes are chosen for these three; do not add a fourth special case without a reason.

**"View as" (landing page menu).** The burger menu at the top right of the landing page holds **View as: Auto | Mobile | Tablet | Desktop** (stored per device by `setViewOverride` in `src/shared/layoutMode.ts`, read by `useLayoutMode()`, so every shell, sandbox and diagram split honours it) and the **Developing tools** switch (password-protected). It changes the layout *logic*; CSS keyed to the real window width (Tailwind `lg:` etc.) still follows the actual window. New device-wide settings go in this menu. Never read `window.matchMedia("(max-width: 640px)")` directly in a tool or shell: use `useLayoutMode()`.

**In-development work** — what's unfinished, whether behind Developing-tools mode (`enabled: false` tools, lessons and Teach decks, the Technique Library, Grapher Lab) (the Skill Library is simply `enabled: false`) — is tracked as a pathway in `docs/pathways/` (large developments) or a task in `docs/TASKS.md` (smaller jobs). Read the relevant one when picking up feature work; keep its status and progress current as work lands.

**Terminology** — the canonical name for every element (tool, sub-tool, strand, grain, technique, step, skill, deck, QO, …) is in `docs/GLOSSARY.md`. Use those names when discussing or documenting changes.

**Session history** — what each session shipped is in `docs/PATCH_NOTES.md` (Maths and Computer Science strands, newest first); `AGENTS.md` says how to add an entry. `docs/TASKS.md` and `docs/pathways/` are the plan.

---

## Two subjects — repository map

This is one website that hosts **two subjects**. The landing page groups tools into
subject bands (a category's subject comes from its `subject` field in `src/registry.ts`,
default `"GCSE Maths"`; A-Level strands — Pure, Decision — set `subject: 'A-Level'`). Keep the division clear across all three axes:

| Axis | Mathematics | Computer Science |
|---|---|---|
| **Tools** | `src/tools/{Generators,Number,Algebra,Proportion,Geometry,TeacherTools,Interactive}` + root | `src/tools/ComputerScience/` |
| **Shell / how to build** | `ToolShell` (`src/shared/`) — see `docs/reference/toolshell.md` | `CSShell` (`src/shared/cs/`) — a *separate* revision-tool shell; see `docs/architecture/CS_SHELL_PLAN.md` |
| **Further developments** | `docs/pathways/` and `docs/TASKS.md` | `docs/architecture/CS_SHELL_PLAN.md` (the shell architecture) |

The two shells are deliberately separate: `ToolShell` is for **question generators**
(Whiteboard / Worked Example / Worksheet); `CSShell` is for **knowledge/revision tools**
(Learn / Study / Cards / Quiz / Fill / Exam). CS *revision* tools are standalone by design and never
migrate to `ToolShell`. **The exception is procedural CS skills** — binary addition/shifts and
number-base conversions (`src/tools/Binary/`) are genuine question generators, so they are built on
`ToolShell` like a maths tool (usually with fewer levels — see `ToolEntry.levels`). When adding a CS category to the registry, set
`subject: 'Computer Science'` so the landing page bands it correctly.

---

## Working efficiently — token & session awareness

Prioritise real development, but be deliberate about token use. Two things dominate cost:

- **Verifying with generated screenshots.** Rendering the app and reading the PNG back as an
  image is the most expensive kind of tool result, and it lingers in context (reprocessed every
  later turn). Default to cheap checks — `tsc`, `npm run build`, `npm test`, and headless
  assertions (console-error count, a DOM text/element check). Generate-and-read a screenshot only
  for genuine visual/layout judgement, at modest resolution and sparingly; otherwise let the user
  eyeball the live preview themselves.
- **Long single sessions.** The whole conversation is reprocessed each turn, so cost climbs the
  longer a session runs. Commit and push at clean boundaries. When a logical unit is finished and
  the context has grown large, say so and suggest continuing in a **fresh conversation** — a new
  session resumes a pushed branch cheaply (it needs the relevant docs + files, not the old
  history; an unmerged branch is fine to continue). Read targeted slices of large files rather
  than re-reading them whole.

## Branch convention

Each Claude Code session works on its own freshly created branch (e.g. `claude/<session-name>`), branched from an up-to-date `main`. Never push directly to `main`.

### The cycle for each session

1. **Run `npm install` first.** The container clones the repo fresh — `node_modules/` does not exist until you install. Without it, `tsc` resolves to the system-global TypeScript and reports thousands of false errors. With it, the build is completely clean.
2. **Start from a fresh, up-to-date `main`.** Pull before branching.
3. **Do all the session's work on that one branch.** One branch per logical unit of work.
4. **Open a PR and merge it into `main`** when work is complete and build is clean.
5. **Delete the branch once merged.**
6. **Repeat for the next session on a brand new branch off the latest `main`.**

### Conflict-resolution discipline

- Resolve conflicts by hand — never with a broad regex-based script.
- After resolving, run `npm install && npm run build` and confirm zero errors — not just a grep for a hand-picked subset of codes.
- Prefer a regular merge over a squash merge for branches that contain merge commits.

### Concurrent sessions

Claude Code and Codex may both work anywhere, but never in the same area at once: coordinate through the planner note **Maths Tools — Handoff** (`AGENTS.md` has the detail).

---

## Implementing from a spec (`specs/`)

The preferred pipeline: the user designs the build conversationally with **Claude in a chat** (this repo linked; entry point `docs/design/DESIGN_STUDIO.md`), which outputs a completed brief following the matching fill-in template. **Five build types**, each with its own template and home:

| Build type | Template | Brief lives in |
|---|---|---|
| Maths tool (question generator) | `docs/design/templates/TOOL_SPEC_TEMPLATE.md` | `specs/<tool-id>.md` |
| CS tool (J277 revision topic) | `docs/design/templates/CS_TOPIC_SPEC_TEMPLATE.md` | `specs/cs/<topic-id>.md` |
| Technique (reusable working-step block) | `docs/design/templates/TECHNIQUE_SPEC_TEMPLATE.md` | `specs/techniques/<technique-id>.md` |
| Teach deck (a tool's Teach-mode slides) | `docs/design/templates/TEACH_DECK_SPEC_TEMPLATE.md` | `specs/decks/<tool-id>.md` |
| Depth bank (a tool's curated questions) | `docs/design/templates/DEPTH_SPEC_TEMPLATE.md` | `specs/depth/<tool-id>.md` |

The deep maths-tool pedagogy guide (`docs/design/TOOL_DESIGNER_PROMPT.md`) still stands and is usable as claude.ai Project instructions; `docs/design/DESIGN_STUDIO.md` routes the maths branch to it.

When the user provides a brief (pasted, or already in `specs/`):

1. Save it to the right path for its type (table above) if not already there.
2. Only implement briefs with `Status: ready`. If sections are missing or ambiguous, ask before building — otherwise build **without further questions**.
3. The brief's **acceptance/correctness reference** defines correctness — verify it before pushing:
   - maths tool → sample questions produce those shapes with matching answers and working;
   - CS tool → cards/exam questions match their answers and **mark schemes**;
   - technique → the worked numeric example matches at each grain;
   - Teach deck → the slides reproduce the coherent example beat-by-beat;
   - Depth bank → `depth.test.ts` passes and the bank's numbers match the brief's acceptance reference.
4. Take the "About this tool" words (`<Tool>.about.ts`: the tool's purpose, each sub-tool's purpose and one plain line per level) from the brief's info section.
5. After it builds clean and tests pass, change the brief's status line to `**Status:** implemented` in the same commit.

For ad-hoc requests without a brief, gather the details in "What to ask the user for" below (maths tools), or from the relevant template's sections (other types).

---

## How to create a new tool — complete checklist

### 1. Scaffold the tool file

```bash
npm run new-tool -- --name "Display Name" --category <Folder> --path /url-path --description "One sentence."
```

This copies the canonical template (`src/tools/TeacherTools/ToolShell.tsx`) to `src/tools/<Folder>/<DisplayName>.tsx` and registers it in `src/registry.ts` with `enabled: false`. (Manual alternative: copy the template and add the registry entry yourself.)

### 2. Fill in the tool-specific section only

- Types → TOOL_CONFIG → `<Tool>.about.ts` (the words) → generateQuestion
- `generateUniqueQ` is **not needed** — ToolShell wraps `generateQuestion` with the standard retry-until-unique loop automatically. Only write one for non-standard uniqueness handling.
- Keep the `export const __test = { TOOL_CONFIG, generateQuestion }` export — the CI smoke tests discover tools through it. Add `levels: ["level1", "level2"]` to it if the tool offers fewer than three levels.
- Leave the imports and `export default function App()` unchanged.

### 3. Registry entry (`src/registry.ts` — single registration point)

`src/registry.ts` is the single source of truth for every tool. `App.tsx` generates the route (lazy-loaded — each tool builds as its own chunk) and `LandingPage.tsx` renders the card from it, grouped into subject bands by each category's `subject` field (default `"GCSE Maths"`; set `"A-Level"` for A-Level strands such as Pure and Decision Mathematics, and `"Computer Science"` for CS strands). Do **not** edit `App.tsx` or `LandingPage.tsx` to add a tool — everything is driven from the registry entry. The scaffold script adds the entry; review it and remove `enabled: false` when the tool is ready to go live:

```ts
{ id: 'my-new-tool', path: '/my-new-tool', name: 'Display Name', description: 'One sentence.', load: () => import('./tools/Category/MyNewTool') }
```

Optionally add `group: 'Sub-group name'` (e.g. `'Place value & decimals'`) so the landing page lists the tool under a small sub-heading inside its category; groups appear in order of first appearance, so keep a category's entries ordered by scheme of work. Tools with no `group` stay ungrouped. The landing page also has a search box (matches the start of words in name, description or group).

A tool's `id` is its `path` without the slash, lower-case words joined by hyphens (`src/tests/registryIds.test.ts` fails otherwise); it is also the key of the tool's dashboard note, so never rename one without copying that note to the new id. When a **route** changes, keep the old address working with `aliases: ['/old-path']` on the entry: it redirects, query string and all, to the new route (Times Tables moved from `/timestables`).

The registry entry has no version/`ready` field — tools carry no version label. The landing page shows only a "Dev" badge for `enabled: false` tools; there is no version badge.

### 4. Build, test and push

```bash
npm install     # required — node_modules/ is not present in a fresh container
npm run build   # must complete with zero TypeScript errors
npm test        # generator smoke tests — validates keys + every KaTeX string
git add src/tools/... src/registry.ts specs/...
git commit -m "Add <ToolName> tool"
git push
```

---

## Old tools — the migration is closed

Every tool that belongs on `ToolShell` has been migrated; **`src/tests/organisation.test.ts` is authoritative** (it fails the build if a tool is un-categorised, a ToolShell tool lacks `__test`, or a tool file isn't registered). Standalone by design, never migrated: the four PDF Generators, `AlgebraTiles`, `NegativeCounters`, `ParallelLinesInteractive`, `GrapherLab`, `SkillLibrary`, `Visualiser`, `p-value`, the word games, and the Decision (`DecisionShell`) and Computer Science (`CSShell`) tools. If an old hand-rolled tool ever appears: use the shared import set below, delete its local types and UI, keep `TOOL_CONFIG`, the `.about.ts` words and the generation maths, author working with `mStep` / `step` / `tStep`, render `<ToolShell … />`, keep `export const __test`, and update `organisation.test.ts`.

---

## Shared library (`src/shared/`) — complete API reference

Tools import the core API from `"../../shared"`. Where a family has its own sub-path, import it by name from there: `shared/decision/` (Decision tools), `shared/cs/` (CS tools), `shared/mathsWords/` (word games), and the stand-alone modules a tool needs that the barrel does not list (`shared/layoutMode`, `shared/colors`, `shared/depth`, `shared/calibration`, `shared/binomial`). Tools never import another tool, and `shared/` never imports from `tools/`. Never read the shared source files to discover the API: it is documented in the reference files (index below).

### Minimal import set for a new tool

```ts
import {
  ToolShell,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion,
  randInt, pick, step, mStep, tStep, fracStr, mStr, pickActive, fmt,
} from "../../shared";
```

For tools using `reformatQuestion`, `stepRenderer`, or QO snapshots, also import:
```ts
import { type WorkingStep, type QOSnapshot } from "../../shared";
```

For diagram/SVG tools also import:
```ts
import { type PrintMode } from "../../shared";
```

The full export list is `src/shared/index.ts`; each export is documented in the reference files below.

---

## Reference files — read the one you need

The API reference and long how-to sections live in `docs/reference/`, so every session does not load them. **Before you change or build something in this list, read its file** (it is the authoritative reference; never read the shared source files to discover an API). Each file opens with a "Read when" line.

| Read | When you are… |
|---|---|
| [`docs/reference/toolshell.md`](docs/reference/toolshell.md) | writing or changing a ToolShell tool: `ToolShellProps`, `defaults`, what the shell provides (About panel, share links, step reveal…), worksheet and fullscreen behaviour, QO-driven behaviour and `reformatQuestion` |
| [`docs/reference/options-and-calibration.md`](docs/reference/options-and-calibration.md) | writing `TOOL_CONFIG`: option types and pools, `difficultySettings`, calibrating a tool, balanced pools |
| [`docs/reference/questions-and-working.md`](docs/reference/questions-and-working.md) | writing a generator: question types and fields, helpers, working steps and fragments, skill links, KaTeX rules |
| [`docs/reference/pictures.md`](docs/reference/pictures.md) | building a picture: the eight core representations (bar model, place value table, ratio table, counters…), the shape model, the split worked example, SVG diagram tools and their print |
| [`docs/reference/depth-teach-lessons.md`](docs/reference/depth-teach-lessons.md) | authoring a Depth bank, a Teach deck, a lesson, or touching the Skill library |
| [`docs/reference/decks.md`](docs/reference/decks.md) | building or changing a deck (`src/decks/`, the whole-lesson page at `/decks/<id>`): the slide and element model, layouts, the player and the slide editor, board fill modes, hand-picked question banks and the misconception tags, saving, keys and ink; shared editing (merge), the Pen, timers, zoom |
| [`docs/reference/shell-extras.md`](docs/reference/shell-extras.md) | touching ink, printables, recent / pinned questions, a Decision tool, or a hand-written print handler |

## Rules checklist — the never / always rules of the reference files

One line per rule, grouped by file. **These apply even if you have not opened the file.** Each rule's id is also written in the reference file beside the sentence it summarises, and `src/tests/claudeDocs.test.ts` fails if a never / always / must sentence there has no id here (or an id is missing from this list). The rules that stay in this file (branch cycle, build and TypeScript rules) are not repeated.

**Questions and working** (`questions-and-working.md`)
- **R1** Create `WorkingStep` objects only with `step` / `mStep` / `tStep`; never build raw objects.
- **R2** A question `key` names its worksheet cell and describes the question (every parameter that varies it); never append a random id to it. Whether two questions are "the same" is decided by their content fingerprints (`src/shared/recentQuestions.ts`), never by the key, so a coarse key cannot refuse a different question and `makeUniqueQ` renames a key that collides.
- **R3** Tool-specific data goes in underscore fields declared in `QuestionExtras` first; read with `extras(q)`, write with `withExtras` or a cast; never `as any`.
- **R4** `answerSuffix` is plain text: never put units inside KaTeX.
- **R5** Never store the same fact twice: derive every representation of an answer (surd, decimal, graph…) from one computation.
- **R6** Never call `sortByDifficulty` or `buildQuotaOverrides` in a tool file; the shell does.
- **R7** Never use `\text{}` in `step()` / `mStep()` and never put prose words inside `$…$`; use `tStep()` for prose.
- **R8** Working-step fragments: each is the next whole mark a teacher would write (never a lone token) and is valid KaTeX on its own.
- **R9** KaTeX: `verticalAlign` is `"baseline"`; `displayMode` is always `false`; never wrap plain-text answers in `katexSpan()` in print; thousands separators use `texNumber` / `{,}`.

**ToolShell** (`toolshell.md`)
- **R10** Never re-implement what the shell provides: the About panel, the modes, URL and share links, the step reveal, the skill overlay.
- **R11** Option explainers (`<Tool>.about.ts`) say what a group is for, never a list of its choices; every option is explained; a switch's `info` is never shown beside the switch.
- **R12** Never swallow an error inside a tool's generator; let it throw so the shell can name it.
- **R13** A new effect, memo or callback lists everything it reads; a deliberate omission carries `// eslint-disable-line react-hooks/exhaustive-deps -- deliberate: <why>`.
- **R14** Changing a Question Option never throws the current question away; mark an option `displayOnly` only if it changes how the same question is shown, never if it changes the numbers, ranges or what is asked.
- **R15** Condensed wording is a worksheet display setting, never a Question Option.
- **R16** The fullscreen worksheet never re-fits when answers show, and every cell stays the same size.
- **R17** Learn the API from the reference files; do not read `ToolShell.tsx` or other shared source to discover it.
- **R18** Shared links: invalid or stale parameters fall back to defaults; an old link must never break.

**Options and calibration** (`options-and-calibration.md`)
- **R19** Pick the control by mutual exclusivity, not difficulty: a pool applies exactly one option per question; independent properties stay toggles or separate pools; never merge combinable properties into one pool; a per-question on/off becomes a 2-option pool.
- **R20** Group labels follow the one vocabulary (Title Case; plural for a pool you can tick several of; one spelling; "Method", "Working Shown", "Answer Format", "Ask for"); `levelLabels.test.ts` enforces it.
- **R21** Peer options are ordinary buttons; never offer a control with a single option.
- **R22** An `exclusive` pool has exactly one `defaultActive` option.
- **R23** For a `requires` option the generator must also ignore a blocked option (`maskUnmetOptions`) and keep a fallback.
- **R24** `workedExampleOnly` only when a dropdown changes nothing but the displayed working; never on one that changes numbers, structure or the answer.
- **R25** A calibration score comes from the question itself, never from the option that produced it; recalibrate after any generator change.
- **R26** Difficulty rungs are mutually exclusive ranges, and a "harder" property is guaranteed, not just more likely.

**Pictures** (`pictures.md`)
- **R27** Before authoring a new visual, pick one of the eight core representations; a new one needs a reason.
- **R28** Ratio table: never show a combined scale factor as one fraction or decimal multiply; author whole-number steps with `rStep`.
- **R29** Place value table: build columns with `pvColumnSet`, offer `PV_WORD_HEADERS_VAR`, use `PV_CELL_H` so it never resizes between states.
- **R30** Counters are labelled +1 / −1; colour is never the only cue.
- **R31** SVG diagram tools: never a fixed pixel height; the renderer must emit `<svg data-q-index={idx}>`; never hand-write a `customPrintHandler` grid, use `handleDiagramPrint`.

**Depth, Teach, lessons** (`depth-teach-lessons.md`)
- **R32** Teach scenes: the beat count is derived from the scene; reserve space for everything (opacity, not mounting); size for readability, never inflate to fill the card.
- **R33** Teach slides are hand-authored, never generated; no emoji; the title is a short topic label.
- **R34** Depth items are fixed (never generated); the `title` must not give the answer away; every wrong option names its `misconception`; speakers come from the eight named cast; Feathers is a mascot only (no speech bubble, no teacher notes); the question zone never moves when the answer is revealed; `ifSecure` never goes down a level.
- **R35** Depth `needs`: write items so every Question Option has something to offer, and every named option must exist.
- **R36** Lessons are never on the landing page.

**Shell extras** (`shell-extras.md`)
- **R37** Never re-implement drawing or add per-tool ink wiring; add a route to `NO_INK` for any new sandbox.
- **R38** A new printable sheet is a function in `printables.ts`, never a print routine in a tool; offer one only where students fill in a blank (a test enforces it).
- **R39** Recent and pinned questions are wired once per shell; tools add nothing.
- **R40** Decision shell: every `ShellOption` carries an `info` sentence (never an (i) beside the option); add a part to the library and a recipe slot, never write a part inside a chain.
- **R41** Print scripts: `totalPages`, `printMode` and any `var` used inside a function declaration are declared in the script's outer scope; use distinct parameter names.

**Whole-lesson decks** (`decks.md`)
- **R42** Author at least five distinct, fixed questions per skill-practice slide, varying examples deliberately within its brief, with correct answers and working that matches the referenced generator’s method, labels, notation and reveal steps. Misconception notes are optional; if supplied, verify the wrong method gives a different result. Short diagnostics and exit tickets can stay short.
- **R43** A slide brief is optional: one or two sentences in `Slide.brief` saying what the slide’s questions test, or the key skill. When planning a lesson, write one for each question slide (not every slide) before authoring its questions; Harry’s own briefs and constraints take precedence. Save questions directly on the slide, with no shared-bank registration. Keep the brief in exported decks, off the classroom display. Choose the question presentation independently: Full-width, Workspace right or Workspace left; fixed sets and live generators share these layouts. Depth cards remain standalone full-slide question/answer faces, with no split stepper or workspace.

## TypeScript / build rules

- `generateQuestion` must be typed `(tool: string, ...)` — cast internally: `const t = tool as ToolType;`
- Never use `useNavigate` — use `window.location.href = "/"`
- Never import `react-router-dom` inside a tool file
- Never add `declare global` — use `const w = () => window as any` for untyped globals
- Unused shared helpers: suppress with `void (tStep as unknown)` etc. — only for helpers actually imported but unused
- `currentQuestion` initialised via `useState` initialiser, never `null`
- If a tool's questions never include `"frac"` kind, remove any `q.kind === "frac"` branches — they cause TS2367
- `ToolShellProps` renderer props use `JSX.Element | null` return types in their signatures — TypeScript accepts this fine once `@types/react` is installed via `npm install`

### Build correctness — zero errors expected

With `npm install` run, `npm run build` should produce **zero TypeScript errors**. Any error in the output is a real problem to fix.

If you see a flood of TS7026 / TS2307 / TS2503 / TS2875 errors, `node_modules/` is missing — run `npm install` first.

```bash
npm install && npm run build 2>&1 | grep "error TS"
# should return nothing
```

### Generator smoke tests — `npm test`

`src/tests/recentQuestions.test.ts` also fails if any tool level cannot fill a 30-question worksheet with different questions at default options: widen the pool, do not allow-list the level (a repeat is decided by content, rule R2).

CI also runs `npm test` (Vitest, `src/tests/generators.test.ts`). The suite discovers every tool exporting `__test = { TOOL_CONFIG, generateQuestion }` and, for each sub-tool × level with default QO settings, generates 40 questions asserting: no throw, unique non-empty keys, and every KaTeX string (`displayLatex`, `answerLatex`, working-step latex, **each fragment individually**, `$...$` segments in worded lines) renders under `katex.renderToString` with `throwOnError`. It also asserts every `[[skill-id|term]]` marker resolves to a registered skill and that markers never leak into `plain`. This catches `£`/`<` in KaTeX, malformed latex, key collisions and dangling skill links at CI time. **Every new or migrated tool must keep its `__test` export.** Restrict levels with `levels: ["level1", "level2"]` when the tool offers fewer than three. It also fails any `step()` / `mStep()` whose KaTeX contains `\text{}` (two older tools are allow-listed in the test until their review).

`src/tests/skills.test.ts` separately validates every skill in the skill library (see `docs/reference/depth-teach-lessons.md`).

`src/tests/organisation.test.ts` is the **drift-check**: it guards the shell-status bookkeeping (see "How to migrate an old tool") — every tool categorised, no migrated tool left in the backlog, every ToolShell tool covered by `__test`, every tool file registered. It reads tool source text, so it needs no per-tool wiring; it just fails when the docs' lists stop matching the code.

---

## Categories and file locations

| Category (as in `src/registry.ts`) | Folder | LandingPage gradient |
|----------|--------|---------------------|
| Generators | `src/tools/Generators/` | blue → indigo |
| Number | `src/tools/Number/` | cyan → sky |
| Algebra | `src/tools/Algebra/` | purple → fuchsia |
| Ratio & Proportion | `src/tools/Proportion/` | emerald → teal |
| Geometry | `src/tools/Geometry/` | amber → orange |
| Pure Mathematics (A-level) | `src/tools/Algebra/` (Factor Theorem, Partial Fractions, Binomial Expansion) | indigo → blue |
| Decision Mathematics (A-level) | `src/tools/Decision/` | rose → red |
| Classroom (Visualiser; shown on every subject tab) and Workshop (internal pages, Developing-tools mode only) | `src/tools/TeacherTools/` | violet → purple |
| Interactive Tools | `src/tools/Interactive/` | lime → green |
| Computer Science, group "Binary & number bases" (procedural generators on ToolShell) beside group "Computer systems" (CSShell revision topics) | `src/tools/Binary/` and `src/tools/ComputerScience/` | slate → slate |
| Computer Science | `src/tools/ComputerScience/` | slate → slate |

---

## Reference implementations — which file to look at

| Pattern | Reference file |
|---------|---------------|
| Standard v2.3 tool (simple questions) | `src/tools/Algebra/CompletingTheSquare.tsx` |
| Multi-type generators behind a Question Types pool; missing-value working on the ratio table (`rStepSolve`) | `src/tools/Proportion/RatioManipulation.tsx` (`ratioSimplifying.ts`, `ratioEquivalent.ts`) |
| Diagram/SVG tool with shared print (`handleDiagramPrint`) | `src/tools/Geometry/AnglesInQuadrilaterals.tsx` |
| Diagram/SVG tool with a longer printed answer (`_printAnswer`) | `src/tools/Geometry/AnglesInParallelLines.tsx` |
| `reformatQuestion` (instant display reformat) | `src/tools/Algebra/CompletingTheSquare.tsx` |
| Multi-group `multiSelect` | search for `ToolMultiSelect[]` in `src/tools/` |
| `difficultySettings` per-level QO | `src/tools/Algebra/CompletingTheSquare.tsx` |
| Sub-tools with fewer than 3 levels (`ToolEntry.levels`) | `src/tools/Binary/NumberBases.tsx` |

---

## What to ask the user for (new tool spec)

**Only for ad-hoc requests with no spec.** The preferred route is a completed `specs/<tool-id>.md` (see "Implementing from a spec" at the top of this file) — if one exists or the user can produce one via the Tool Designer project, use that instead of asking these questions.

1. **Tool name** — display name, e.g. "Multiplying Fractions"
2. **URL path** — e.g. `/multiplying-fractions`
3. **Category** — which section on the landing page
4. **Description** — one sentence for the landing page card
5. **Sub-tools** — names of the tab buttons (1–5). One sub-tool → tabs hidden automatically.
6. **For each sub-tool:**
   - Question type: simple, worded, or diagram/SVG
   - Level 1 / 2 / 3 — what changes at each level (or fewer than three)
   - QO options: dropdowns, variables, multiSelect
   - `instruction`? e.g. "Simplify:", "Solve:", "Find:"
7. **Worked example steps** — how the solution is explained at each level
8. **Defaults** — non-standard font size, question count, column constraints

Claude drafts `<Tool>.about.ts` from the above — the user does not need to write it.
