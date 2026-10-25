# Maths Tools — Claude Code Instructions

## What this file is

CLAUDE.md is read automatically by Claude Code at the start of every session. It is the single source of truth for this codebase — every interface, type, export, and convention is documented here so no shared source files need to be read before starting work.

---

## Documentation map — which doc, and when

The repo's knowledge is split across a small set of docs, each with one job. Read
this table first; it tells you where to look and where to write.

| Doc | Job | Read it when… |
|---|---|---|
| **`CLAUDE.md`** (this file) | The rules — conventions, shared-API reference, how to build/migrate a tool. | Always (auto-loaded). The default answer to "how do I…". |
| **`README.md`** | Human-facing project overview, tech stack, local setup. | First orientation; onboarding a person. |
| **`docs/PROJECTS.md`** | The plan — where every prong is up to and what could come next (deep detail tables live here). | **Start of a session** (current state / what's next). Keep the moved prong current at the end. |
| **`docs/BACKBENCH.md`** | Paused work (the Skills library) lifted out of the plan until readdressed. | Only when someone decides to pick the Skills library back up. |
| **Tools dashboard** (`/admin`, Developing-tools mode) | The friendly, interactive overview of every tool: live / not live, what it has (Depth, lessons, Teach, developing picture, calibration…), pictures used, plus hand-written notes. **Read and written by both Harry and Claude.** | Overseeing the project; at the end of a session, update the notes for the tools you touched (see "Tools dashboard" below). |
| **`docs/FEATURES.md`** | Plain-language name and purpose of every feature (Whiteboard, Worked Example, Depth, instant reformat, the information (i), Smart Progressor…). Shown on the dashboard (top bar → Features) and mirrored in the planner as "Maths Tools — Feature Guide". | Describing a feature to a person, or adding one: **add or update its entry in the same session you build it**, then run `npm run facts`. |
| **`docs/HOW_A_TOOL_IS_BUILT.md`** | Plain-language overview of how the repo builds a tool: what is in a tool file, what each surrounding file is for and what to be aware of. Also shown on the dashboard (Developments → How a tool is built). | Orienting a person (or a fresh session) to the build; keep it true when a shared file is added or its rules change. |
| **`docs/PATCH_NOTES.md`** · `docs/history/` | The history — what each session shipped, split Maths / CS, newest first. The current file holds October 2026 on; `docs/history/` holds everything older. | Seeing what was actually done — read only the top few entries. **Add an entry at the end of a session.** |
| **`docs/architecture/CS_SHELL_PLAN.md`** | The `CSShell` architecture and its extraction stages. | Building or extending a CS tool. |
| **`docs/architecture/DECISION_SHELL_PLAN.md`** | The `DecisionShell` architecture — network-native question generators (MST/TSP/CPA) on a shared representation library. | Building or extending a Decision Maths tool. |
| **`docs/GLOSSARY.md`** | Canonical name for every element (tool, grain, technique, skill, QO…). | Naming or discussing anything — use these words. |
| **`docs/design/LESSONS.md`** | How a lesson is structured (teach → practise → set → extend), how decks sit inside it, QO rules that serve it, and what the Indices pilot taught us. | Authoring a lesson, a Teach deck or lesson steps. |
| **`docs/design/CAST.md`** | The Depth cast (eight named characters + Feathers the owl): names, rules, how to add a member. | Writing Depth speakers or touching `DepthArt.tsx`. |
| **`docs/TIDY_UP.md`** | Inventory of split ends and half-finished ideas (what to finish, fold, remove or decide), then the structures that would stop the site fraying again. **Current priority.** | Before adding a feature or a tool; when tidying. |
| **`docs/design/DESIGN_STUDIO.md`** | The one entry point for designing a new build *with Claude in chat* (repo linked): routes to the right template for a maths tool / CS tool / technique / Teach deck. | Understanding where a brief in `specs/` came from, or how new ones are produced. |
| **`docs/design/templates/TOOL_SPEC_TEMPLATE.md`** · **`docs/design/templates/CS_TOPIC_SPEC_TEMPLATE.md`** · **`docs/design/templates/TECHNIQUE_SPEC_TEMPLATE.md`** · **`docs/design/templates/DEPTH_SPEC_TEMPLATE.md`** · **`docs/design/templates/TEACH_DECK_SPEC_TEMPLATE.md`** · **`docs/design/TOOL_DESIGNER_PROMPT.md`** · **`specs/`** | The spec pipeline — one fill-in template per build type, the deep maths-tool designer prompt, and the completed briefs. | Designing or implementing any build from a brief. |

### How the three sources work together (repo · notes · admin)

The repo, Harry's planner notes and the Tools dashboard (`/admin`) are three views of the same project. Each has a job, and each points to the others:

| Source | Its job | What goes in it |
|---|---|---|
| **The repo** | **Everything needed to continue successfully.** A fresh session should be able to pick the work up from the repo alone. | The rules (`CLAUDE.md`), the plan (`docs/PROJECTS.md`), what is loose (`docs/TIDY_UP.md`), what shipped (`docs/PATCH_NOTES.md`, older in `docs/history/`), the specs and the code itself. |
| **The notes** (Harry's planner) | **The deeper record, session by session**, that the repo can reference. | The Build Log (what changed, what we decided and why, what is next — one block per session), Features (plain English, by section), Representations (picture decisions), Characters, and the per-tool pages for depth. |
| **The admin page** (`/admin`) | **The site and its development at a glance** — a friendlier, easier interface. | Facts generated from the code (every tool, its state, what it has), per-tool notes Harry and Claude edit (plan status, in development, wants to change, review, open questions), and the views over them: List, Matrix, Next up. |

How they stay in step:
- **Link, don't restate.** A `docs/PATCH_NOTES.md` entry ends with a `Notes:` line naming its Build Log block, and the Build Log block names the branch and links back to the repo entry. A doc or note that needs a number the code can produce (how many tools are live, which tools have Depth) points to the dashboard or says "as of <date>" — the dashboard's facts are generated, so they cannot drift.
- **Each source can go deeper than the others, but they must not disagree.** If they do: the code is right, then the repo docs, then the notes. Fix the one that is wrong in the same session.
- **The admin page grows as the front door:** the place to see where the site is and what to do next, with the repo and the notes one click behind it.

---

## Visual direction — clean, subtle, modern

New and touched UI follows one quiet style (landing page, ToolShell and DecisionShell chrome already do): page background `PAGE_BG` (`#f8f9fb`, `src/shared/colors.ts` — only a touch darker than the cards; cards are defined by border + shadow, not a dark backdrop); cards `rounded-2xl border border-slate-300 shadow-card` (`shadow-card` / `shadow-lift` are the Tailwind tokens in `tailwind.config.js`; never `shadow-xl/2xl`; containers need that soft lift); 1px `slate-300` card borders (`slate-200` for hairlines inside a card), not `border-2`; `font-semibold` rather than `font-bold` for controls; titles `text-3xl font-semibold` with no divider rules; tool tabs as small pills, mode tabs as underline tabs; strand colour only as a small dot; descriptions behind an (i) rather than in boxes; phone: fixed bottom action bar and full-screen option sheets; pictures and questions are sized for the phone (capped height box, shrink-to-fit, `text-xl` question) rather than inheriting desktop size controls. Don't restyle a tool's pictures or content for this — chrome only. Leave other tools alone until they are touched.

---

## Tools dashboard (`/admin`) — what each tool is, has, and needs

A Developing-tools-gated page (burger menu → Developing tools → **Tools dashboard**, or `/admin`). It does **not** replace `docs/PROJECTS.md` (the plan, your home for reading) or Harry's planner (the granular written history); it is the interactive, friendlier overview of the same ground. Two halves:

0. **Kinds — what counts as a tool.** Every registry entry gets a `kind` (`kindOf` in `scripts/toolFacts.mjs`: rules by id/category, plus `KIND_OVERRIDES`): `tool` (teaching tools — ToolShell/Decision/CS), `sandbox` (open-ended interactives, visualiser), `game`, `generator` (PDF generators), `workshop` (internal: Tool Shell template, Technique/Skill libraries, technique previews). The dashboard has one tab per kind and opens on **Tools**; counts, strands and feature filters are scoped to the tab, so a technique preview never weighs the same as a whole tool. A new entry that isn't a teaching tool needs a rule or override.
1. **Facts read from the code** (never edit by hand): `scripts/toolFacts.mjs` reads `src/registry.ts` and each tool file and writes `src/generated/toolFacts.json` — availability (live / in development / hidden / parked), shell, sub-tool count, Depth, lessons, Teach, developing picture, calibration, Smart Progressor, scaffold, smoke tests, spec, pictures used. It runs before every build; **after adding or changing a tool or the registry run `npm run facts`** and commit the JSON (a test fails if it is stale).
3. **Developments and the build guide** (read from the docs, never typed in the dashboard): the dashboard's top bar has **Tools · Developments · Features · How a tool is built**. Developments shows one numbered list of what is loose (each with what we found, why it matters, the suggested move, what is left to decide and where we lean) and a Settled decisions tab, both from `docs/TIDY_UP.md`, plus every tool's *Differs from the standard* and *In development / wants to change / open questions* notes gathered in one place. How a tool is built shows `docs/HOW_A_TOOL_IS_BUILT.md`; Features shows `docs/FEATURES.md`. `scripts/adminDocs.mjs` turns those docs into `src/generated/adminDocs.json` (run by `npm run facts` and before every build; a test fails if stale), so **edit the docs, then run `npm run facts`** — never edit the JSON.
2. **Notes written by people** (live, shared): per tool — Status (idea / in development / ready / live / shelved), In development, What we want to change, Differs from / adds to the standard, Representation (+ Agreed), Review (not reviewed / reviewing / reviewed), Open questions. Stored as one private Vercel Blob (`tool-notes.json`) behind `api/tool-notes.ts`; the dashboard edits them, and Claude edits them through the same API. Tool ids are the registry `id`s. Until the Blob store is connected the dashboard falls back to notes on that device only (it says so in a banner).

**Claude reading and writing notes** (needs the environment's network policy to allow `maths-tools-phi.vercel.app`; key = the Developing-tools password in `src/devAccess.ts`):

```bash
KEY=$(grep -o 'DEV_PASSWORD = "[^"]*"' src/devAccess.ts | cut -d'"' -f2); URL=https://maths-tools-phi.vercel.app/api/tool-notes
curl -s -H "x-admin-key: $KEY" $URL                                    # every tool's notes
curl -s -X POST -H "x-admin-key: $KEY" -H "content-type: application/json" \
  -d '{"tool":"indices","by":"Claude","fields":{"wantsToChange":"…"}}' $URL   # merge fields into one tool's note
```

**On a branch preview** (before the dashboard is merged, or to test API changes): previews sit behind Vercel login, so get past it with the Vercel connector — `list_deployments` (branch filter) for the latest preview URL, then `get_access_to_vercel_url` for a share link, then `curl -c jar -b jar "$PREVIEW/api/tool-notes?_vercel_share=<token>"` repeated every ~5 s until it returns **307** (the cookie is now in `jar`), and add `-b jar` to the GET/POST calls above with `URL=$PREVIEW/api/tool-notes`. Notes are one shared Blob, so a write from a preview shows on every deployment. Runtime errors: `get_runtime_logs` for the deployment.

POST sends only the fields you change (the server merges, so Harry's edits to other fields are kept; writes are ETag-checked). **At the end of a session that changes a tool, update that tool's notes** (In development / Wants to change / Differs from / Representation / Open questions) so the dashboard stays true. Setup (done, 2026-10-22): a private Blob store connected to the `maths-tools` project (gives `BLOB_READ_WRITE_TOKEN`), an `ADMIN_KEY` env var (Production + Preview) equal to the Developing-tools password, and `*.vercel.app` in the Claude environment's allowed domains. The function keeps the notes logic in `api/_notes.ts` (it must import with `.js` extensions and cannot import from `src/`) and takes the conditional-write ETag from `head()` (a download's ETag turns weak and is rejected).

---

## What this project is

A React/TypeScript/Vite app of interactive maths tools for teachers. Each tool has three modes — Whiteboard, Worked Example, Worksheet — with Levels 1–3, differentiated worksheets, and PDF export. Deployed to Vercel. CI runs on every push via `.github/workflows/ci.yml`.

**Purpose:** build complete new tools end-to-end from a spec — writing all the code, registering the route, and pushing. The spec supplies the maths content.

**Always consider three screen sizes — phone, tablet, laptop.** This is a standing rule, not a development prong. Check by hand (headless Chromium is fine) at one representative size each, plus the in-betweens when something is fiddly:

| Size | Viewports to check | What it means |
|---|---|---|
| **Phone** | 390×800 (up to 640 wide) | ToolShell's ≤640px layout is automatic; DecisionShell uses the click-through start screens and a fixed bottom bar. Bespoke renderers and standalone sandboxes must be checked by hand. |
| **Tablet** | 1180×820 and 1024×768 (landscape — the layout is designed for this), 820×1180 and 768×1024 (portrait: the phone's stacked arrangement, with a small "works best in landscape" note) | **The phone's interaction model, laid out landscape**: the same click-through start screens and fixed bottom action bar (with text labels) and touch targets ≥ 40px, but wider — picture beside question and steps (DecisionShell), 2-column worksheet cards and a wider column (ToolShell) — and **the Whiteboard stays** (phones have none). Chosen by `useLayoutMode()` (`src/shared/layoutMode.ts`): 641–1180px wide, or a touch-first device (`pointer: coarse`) up to 1400px (an iPad Pro in landscape). Both shells read it; tools add nothing. |
| **Laptop** | 1366×768 (and 1920×1080) | The working area is about one screen tall (`STAGE_H` for Decision tools). Short screens (≤820px high) get tighter spacing. |

Spacing and sizes are chosen for these three; do not add a fourth special case without a reason.

**"View as" (landing page menu).** The burger menu at the top right of the landing page holds **View as: Auto | Mobile | Tablet | Desktop** (stored per device by `setViewOverride` in `src/shared/layoutMode.ts`, read by `useLayoutMode()`, so every shell, sandbox and diagram split honours it) and the **Developing tools** switch (password-protected). It changes the layout *logic*; CSS keyed to the real window width (Tailwind `lg:` etc.) still follows the actual window. New device-wide settings go in this menu. Never read `window.matchMedia("(max-width: 640px)")` directly in a tool or shell: use `useLayoutMode()`.

**In-development work** — what's unfinished, whether behind Developing-tools mode (`enabled: false` tools, lessons and Teach decks, the Technique Library, Grapher Lab) (the Skill Library is simply `enabled: false`) — is tracked in `docs/PROJECTS.md`; what is loose and needs tidying is in `docs/TIDY_UP.md`. Read it when picking up feature work; keep the prong's status current as work lands.

**Terminology** — the canonical name for every element (tool, sub-tool, strand, grain, technique, step, skill, deck, QO, …) is in `docs/GLOSSARY.md`. Use those names when discussing or documenting changes.

**Session history** — what each session actually shipped is logged in `docs/PATCH_NOTES.md`, split into **Maths** and **Computer Science** strands (newest first). **Append a short entry to it at the end** of a session before pushing. `docs/PROJECTS.md` is the plan (current state / what's next); `docs/PATCH_NOTES.md` is the history (what's done).

---

## Two subjects — repository map

This is one website that hosts **two subjects**. The landing page groups tools into
subject bands (a category's subject comes from its `subject` field in `src/registry.ts`,
default `"GCSE Maths"`; A-Level strands — Pure, Decision — set `subject: 'A-Level'`). Keep the division clear across all three axes:

| Axis | Mathematics | Computer Science |
|---|---|---|
| **Tools** | `src/tools/{Generators,Number,Algebra,Proportion,Geometry,TeacherTools,Interactive}` + root | `src/tools/ComputerScience/` |
| **Shell / how to build** | `ToolShell` (`src/shared/`) — see this file's shared-library + ToolShell sections | `CSShell` (`src/shared/cs/`) — a *separate* revision-tool shell; see `docs/architecture/CS_SHELL_PLAN.md` |
| **Further developments** | `docs/PROJECTS.md` (Maths sections) | `docs/PROJECTS.md` (Computer Science section) + `docs/architecture/CS_SHELL_PLAN.md` (the shell architecture) |

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

### Ending a session / session kickoffs

The single planning surface is **`docs/PROJECTS.md`** — where every prong is up to and what
could come next. Standing "resume here" prompts are **not** kept in the docs (they rot);
instead, kickoff blocks are **generated on demand** from `docs/PROJECTS.md`, and no session's
kickoff is ever saved to a file.

**When you finish a unit of a multi-session build:** refresh the moved prong's **Where it's
at** line (and its *At a glance* row) in `docs/PROJECTS.md`, and add the `docs/PATCH_NOTES.md` history
entry. If the user wants to carry straight on, also output a kickoff block in chat (below) —
but only in chat; never write it into a doc.

**End of a session — keep the three sources in step** (see "How the three sources work together"):
1. **Repo:** add the `docs/PATCH_NOTES.md` entry (ending with a `Notes:` line that names the Build Log block) and refresh the prong in `docs/PROJECTS.md` (as above).
2. **Admin:** run `npm run facts` if a tool or the registry changed (the facts are generated), then update the **dashboard notes** of each tool the session touched (In development / Wants to change / Differs from / Representation / Open questions) through the API.
3. **Notes (planner)** — use the planner tools (`mcp__Harry_s_Planner__*`; load via ToolSearch):
   - **Build Log** — one block at the top of `Maths Tools — Build Log` for every session that changes something: *What changed for teachers*, *What we decided and why*, *Still to do / next*, branch name, and the matching `docs/PATCH_NOTES.md` entry. This is the deeper record the repo points to.
   - **Features** — update the matching section of `Maths Tools — Features` when something teachers see changed.
   - **Representations** — dated design decisions about the pictures, with open questions.
   - **Development Prongs and the tool pages** — update the prongs the session touched and any tool page it changed. Avoid typing counts or live / in-development state that goes stale; refresh them from the dashboard or mark them "as of <date>".
   - Never edit a locked block (Harry unlocks); read a block's `version` first (`get_block`); keep blocks plain English, in bullets, with any table cell holding more than one item bulleted inside the cell (`• item<br>• item`).

**The tracking habit — how the three areas stay true.** Do these every session, not just at the end; a session that skips them leaves the next one guessing.

| When | Do |
|---|---|
| **Start** | Read the top of `docs/PROJECTS.md` and `docs/TIDY_UP.md`, the newest 2–3 `docs/PATCH_NOTES.md` entries, and — if you will touch tools — that tool's dashboard note (`GET /api/tool-notes`). Run `npm run facts` and check `git status`: a changed `toolFacts.json` means the code moved under the docs. |
| **As you change something** | One change, one home. A rule or API → `CLAUDE.md`. A decision about direction → `docs/PROJECTS.md` / `docs/TIDY_UP.md`. A tool gained or lost a feature → run `npm run facts` and commit the JSON (the dashboard updates itself). A new idea or loose end → `docs/TIDY_UP.md` §1, not a comment in code. |
| **End** | The three-step routine above (repo entry → admin notes → planner Build Log and the pages you touched), then say in the final message what you updated in each, and what you chose not to. |

What belongs where, so nothing is typed twice:

| Event | Repo | Dashboard (`/admin`) | Planner notes |
|---|---|---|---|
| New or changed tool (options, levels, sub-tools, state) | `npm run facts` + commit; spec status; `docs/PATCH_NOTES.md` | Facts update by themselves; edit the tool's notes (In development / Wants to change / Differs from / Open questions) | Rebuild that tool's page blocks with `scripts/notesPages.mjs` (see below); Build Log block; the Features section if teachers see it |
| Something teachers see changed (not tied to one tool) | `docs/PATCH_NOTES.md` | — | Features section; Build Log |
| A decision or a design choice | `docs/PROJECTS.md` / `docs/TIDY_UP.md` if it changes the plan | Open question on the tool, if it is about one tool | Build Log "What we decided and why"; Representations if it is about a picture |
| A tool goes live or not live | Registry (the code is the truth) + `npm run facts` | Plan status note | Tool Index status meanings / strand table; the tool page's At a glance (regenerate) |
| A rule for building (convention, shared API) | `CLAUDE.md` | — | Different From & Additional To Tool Shell, only if a tool now varies from the standard |
| Depth bank, lesson or Teach deck added | `docs/PATCH_NOTES.md`, `docs/PROJECTS.md` prong | — | Development Prongs (Depth / Lessons blocks), Characters if the cast changed |

**Where the working record lives (decided 2026-10-24).** Per-tool status, in development, wants to change, differs from, representation, review and open questions are kept **on the dashboard** and updated there as the work happens (through the API, or by Harry in `/admin`). The planner is brought up to date **at each session end** from it: the Build Log block says what changed and what was decided, and tool pages are only refreshed for what the code produces (`scripts/notesPages.mjs`). Do not keep per-tool review or wants-to-change in two places: a tool page's Review block is the old record and is left as it is.

Rules for the habit:
1. **Never type what the code can count.** How many tools are live, which have Depth, which hide the answer step: read it from the dashboard / `toolFacts.json`, or write "as of <date>" beside it. Hand-typed counts rot first.
2. **If the sources disagree, the code is right, then the repo docs, then the notes.** Fix the wrong one in the same session; do not leave a note saying they differ.
3. **Link, don't restate.** A `docs/PATCH_NOTES.md` entry ends with a `Notes:` line naming its Build Log block; the Build Log block names the branch and the repo entry. Notes point to the dashboard for current facts.
4. **Tool pages in the planner are generated, then lightly authored.** At a glance, What it does, Sub-tools, Levels, Question options and Defaults come from the code: run `NOTES_DUMP_DIR=/tmp/maths-tools-notes DUMP_CONFIGS=1 npx vitest run src/tests/dumpToolConfigs.test.ts` then `node scripts/notesPages.mjs` (writes `pages.json`, never touches the planner), compare with the page, and `update_block` only the blocks that differ. Never touch a tool's **Review** block (Harry's record), and keep any hand-written "About" lines.
5. **Planner mechanics.** Read a block's `version` first; one edit per block per `batch` call (versions do not advance inside a batch — a second edit to the same block fails the whole batch); locked blocks are left alone; say before deleting (deleted blocks sit in the trash for 30 days); keep language plain, in bullets, table cells holding several items bulleted inside the cell.
6. **A session is not done until** `npm run build` and `npm test` pass, the repo entry exists, the dashboard facts are regenerated, and the planner reflects what changed. If time runs out, write the missing steps into the Build Log block under "Still to do / next" rather than leaving them silent.
7. **Check before ending:** `npm run facts` leaves no diff; grep the docs for the old name of anything you renamed; open `/admin` (or fetch `/api/tool-notes`) and confirm a tool you set to "live" really is.

**The kickoff recipe (used both at session end and on demand).** When the user asks for a
"kickoff for `<prong>`" — e.g. when firing off several sessions in a sitting — build one from
that prong's `docs/PROJECTS.md` entry: a fenced code block (triple backtick, language `text`, so
the paste boundary is unmistakable) containing:

- a one-line **current-state** summary for the prong;
- the **exact next task** — the specific option chosen from that prong's *Possible next
  steps* (ask which, if it's not obvious);
- the **minimal files to read** (and which large files *not* to re-read whole);
- the **verification bar** before pushing (`npm run build` clean, `npm test`, any eyeball check);
- the standard setup line (confirm baseline current, `npm install`).

**Never name a specific branch to check out.** Every kickoff starts from an up-to-date `main`
and works on the session's own fresh branch (the harness assigns it) — the prompt must not
name one, and a session must never check out or reuse an old feature branch. Do **not** use
the old `>>>` … `<<<` delimiters — they render as nested blockquotes and break the boundary.

---

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

Keep concurrent sessions on disjoint files/tools. Two sessions editing the same file will produce merge conflicts.

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

Every tool that belongs on `ToolShell` has been migrated, and the backlog is empty. **`src/tests/organisation.test.ts` is authoritative:** it holds the shell status of every
tool (standalone / CS / backlog) and fails the build if a tool is un-categorised, if a ToolShell tool lacks `__test`, or if a tool file isn't registered. To confirm a file is on the
shell: `grep -L "<ToolShell" src/tools/**/*.tsx` lists the ones that are not (the Generators, sandboxes, Decision and CS tools are standalone by design).

Standalone by design (never migrate): the four **Generator tools** (`TimesTablesGenerator`, `MultiplicationGenerator`, `NegativeOperationsGenerator`, `FunctionalSkillsGenerator` —
they batch-produce PDF worksheets), `AlgebraTiles`, `NegativeCounters`, `ParallelLinesInteractive`, `GrapherLab`, `SkillLibrary`, `Visualiser`, `p-value`, the word games, and the
Decision (`DecisionShell`) and Computer Science (`CSShell`) tools.

If an old hand-rolled tool ever appears: use the shared import set below, delete all local types and UI (`useNavigate`, popovers, `useState`), keep `TOOL_CONFIG` / the `.about.ts` words /
the generation maths, author working with `mStep` / `step` / `tStep`, render `<ToolShell … />`, keep `export const __test`, and update `organisation.test.ts`.

---

## Shared library (`src/shared/`) — complete API reference

Tools import the core API from `"../../shared"`. Where a family has its own sub-path, import it by name from there: `shared/decision/` (Decision tools), `shared/cs/` (CS tools), `shared/mathsWords/` (word games), and the stand-alone modules a tool needs that the barrel does not list (`shared/layoutMode`, `shared/colors`, `shared/depth`, `shared/calibration`, `shared/binomial`). Tools never import another tool, and `shared/` never imports from `tools/`. Never read the shared source files to discover the API — it is fully documented here.

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

### Core exports from `src/shared/`

**Types** (use `type` keyword in imports):
`DifficultyLevel` · `PrintMode` · `AnyQuestion` · `SimpleQuestion` · `WordedQuestion` · `WorkingStep` · `ToolConfig` · `ToolEntry` · `ToolDropdown` · `ToolMultiSelect` · `ToolMultiSelectConfig` · `ToolVariable` · `DifficultyLevelSettings` · `InfoSection` · `InfoItem` · `QOSnapshot` · `ToolShellDefaults` · `ToolShellProps` · `TeachingSlide` · `TeachBlock` · `TeachBar` · `TeachScene` · `TeachCategory` · `SkillDef` · `WorkedExampleStepsProps` · `TechniquePreviewPageDef` · `DepthItem` · `DepthOption` · `DepthPurpose`

**Components / hooks**:
`ToolShell` · `TeachingDeck` · `SlideDeck` · `MathRenderer` · `InlineMath` · `QuestionDisplay` · `AnswerDisplay` · `DifficultyToggle` · `StandardQOPopover` · `DiffQOPopover` · `InlineQOPanel` · `InfoModal` · `MenuDropdown` · `PrintSplitButton` · `SkillLabel` · `SkillOverlay` · `WorkedExampleSteps` · `TechniquePreviewPage` · `DepthMode` · `BidmasPyramid` (an order-of-operations *key*, not a working representation — `strong`/`soft` light tiers; reference: `src/tools/Number/OrderOfOperations.tsx`)

**Helpers**:
`randInt` · `pick` · `formatNumber` · `texNumber` · `fracStr` · `mStr` · `pickActive` · `normalizeMultiSelect` · `step` · `tStep` · `mStep` · `fmt` · `ansEq` · `makeUniqueQ` · `stripSkillMarkers` · `SKILL_MARKER_RE` · `slideMaxStep` · `sortByDifficulty` · `buildQuotaOverrides`

**Skill library**: `SKILLS` · `getSkill` (see "Skill library" section)

**Utilities**:
`loadKaTeX` · `handlePrint` · `LV_COLORS` · `LV_LABELS` · `LV_HEADER_COLORS` · `getQuestionBg` · `getStepBg`

This is the core set. The representation components and helpers (`PlaceValueTable`, `RatioTable`, `CounterBoard`, `SmartGrapher`, `DrawHotbar`, …), the lesson types (`ToolLesson`, `LessonStep`) and the file-size / long-division helpers are documented in their own sections below; `src/shared/index.ts` is the full list.

---

## Key types — full definitions

### `WorkingStep`
```ts
interface WorkingStep {
  type: string;       // "step" | "mStep" | "tStep"
  latex: string;      // KaTeX string — always present (joined from frags when authored in parts)
  plain: string;      // plain-text fallback (skill markers stripped)
  label?: string;     // mStep only — left-aligned prose label; may contain [[skill-id|term]] markers
  unit?: string;      // mStep only — plain-text unit appended after KaTeX
  frags?: string[];   // set automatically when step()/mStep() get a string[] — see "fragments"
  extra?: unknown;    // arbitrary payload for tool-specific use
}
```
Always create `WorkingStep` objects via the helpers (`step`, `mStep`, `tStep`) — never construct raw objects.

### `QOSnapshot`
```ts
interface QOSnapshot {
  level: DifficultyLevel;                 // "level1" | "level2" | "level3"
  variables: Record<string, boolean>;     // variable key → current on/off value
  dropdownValue: string;                  // current dropdown selection
  multiSelectValues: Record<string, boolean>; // option value → active
}
```
Passed to renderer props and `reformatQuestion` so they can read the live QO state without separate prop-drilling.

### `SimpleQuestion`
```ts
{
  kind: "simple";
  display: string;          // plain-text fallback
  displayLatex?: string;    // KaTeX — use for all maths content
  answer: string;           // plain-text fallback
  answerLatex?: string;     // KaTeX answer
  answerSuffix?: string;    // plain-text unit after answerLatex (never put units in KaTeX)
  working: WorkingStep[];
  key: string;
  difficulty: string;
  _qo?: unknown;            // reserved — do not use
}
```

### `WordedQuestion`
```ts
{
  kind: "worded";
  lines: string[];          // each line can contain $...$ for InlineMath
  answer: string;
  answerLatex?: string;
  answerSuffix?: string;
  working: WorkingStep[];
  key: string;
  difficulty: string;
  _qo?: unknown;
}
```

### `AnyQuestion`
```ts
type AnyQuestion = SimpleQuestion | WordedQuestion;
```

### Key rules for questions
- Keys must be unique within a worksheet — include all parameters that vary the question
- Always append a random `id` (`Math.floor(Math.random() * 1_000_000)`) to prevent false duplicates
- Store tool-specific data (diagram, raw params) in underscore fields: `_diagram`, `_rawValues`, etc. Cast through `unknown`: `} as unknown as AnyQuestion`
- Retrieve in renderers: `const d = (q as any)._rawValues as MyType | undefined`
- `answerSuffix` is always plain text — never put units inside KaTeX
- **Never store the same fact twice.** Derive every representation of an answer — surd ⇄ decimal ⇄ numeric ⇄ graph — from one computation, so they cannot drift out of sync.

---

## `ToolShellProps` — complete interface

`ToolShellProps` is defined and exported from `src/shared/ToolShell.tsx`. Do not read that file — this section is the authoritative reference.

```ts
export interface ToolShellProps {
  // ── Required ────────────────────────────────────────────────────────────────
  config: ToolConfig;
  infoSections?: InfoSection[];   // optional and normally omitted: "About this tool" reads <Tool>.about.ts and TOOL_CONFIG

  generateQuestion: (
    tool: string,
    level: DifficultyLevel,
    variables: Record<string, boolean>,
    dropdownValue: string,
    multiSelectValues?: Record<string, boolean>,
  ) => AnyQuestion;

  /** Optional — omit it. ToolShell wraps generateQuestion with the standard
   *  retry-until-unique loop (makeUniqueQ) automatically. Only supply for
   *  non-standard uniqueness handling. */
  generateUniqueQ?: (
    tool: string,
    level: DifficultyLevel,
    variables: Record<string, boolean>,
    dropdownValue: string,
    usedKeys: Set<string>,
    multiSelectValues?: Record<string, boolean>,
  ) => AnyQuestion;

  // ── Optional — layout & behaviour ───────────────────────────────────────────
  defaults?: ToolShellDefaults;

  // ── Optional — custom renderers ──────────────────────────────────────────────
  /** Replaces QuestionDisplay in all modes.
   *  compact: true=worksheet cell, undefined=regular whiteboard, false=worked-example/fullscreen.
   *  idx: worksheet cell index (pass to SVG as data-q-index).
   *  qo: live QO state — use for display-time decisions.
   *  fontClass: the active font-size Tailwind class (driven by the size chevrons —
   *    worksheetFontSize when compact, displayFontSize otherwise). Apply it so the
   *    chevrons actually resize text in a custom renderer; ignore it for diagrams
   *    that use hideFontControls. */
  questionRenderer?: (
    q: AnyQuestion,
    showAnswer: boolean,
    compact?: boolean,
    idx?: number,
    qo?: QOSnapshot,
    fontClass?: string,
  ) => JSX.Element | null;

  /** Replaces AnswerDisplay. Shown when answer is revealed. */
  answerRenderer?: (
    q: AnyQuestion,
    qo?: QOSnapshot,
  ) => JSX.Element | null;

  /** Replaces default step rendering in the worked-example step list. `reveal` is the fragment index showing on the
   *  current card (undefined = show everything: past steps, Show All) so a custom renderer can build itself up one
   *  beat at a time like a fragment-authored step (reference: Order of Operations' board-style lines). */
  stepRenderer?: (
    step: WorkingStep,
    qo?: QOSnapshot,
    reveal?: number,
  ) => JSX.Element | null;

  /** For steps whose working is a visual that EVOLVES (a place value table filling in): return just
   *  the visual (`false` for a caption-only step of the same tool — it joins the timeline while the picture stays on screen; `null` for any other step). In the cascade and Show All the list then carries only each
   *  step's caption (`step.plain`) and ONE visual — the current step's — updates in place beside it
   *  (above on narrow screens), instead of reprinting the table every step. */
  stepVisualRenderer?: (step: WorkingStep, qo?: QOSnapshot) => JSX.Element | null | false;

  /** Companion to `stepVisualRenderer`: keep every step's full working (its maths) in the list beside the
   *  picture instead of a caption-only timeline. For equation-led tools whose picture builds up with the
   *  working (see "Split worked example" below). */
  stepVisualKeepsWorking?: boolean;

  /** Companion to `stepVisualRenderer`: "side" (default) puts the picture beside the steps; "top" puts it
   *  full width above them — for wide, short pictures (number lines). */
  stepVisualPlacement?: "side" | "top";

  /** Called when a QO option changes. Return a reformatted copy of the question (same maths, different display),
   *  or null to leave it to the shell (which replays `displayOnly` options from the saved seed, else keeps the question).
   *  Usually unnecessary: mark the option `displayOnly` instead. */
  reformatQuestion?: (
    q: AnyQuestion,
    qo: QOSnapshot,
  ) => AnyQuestion | null;

  /** Custom print handler for diagram/SVG tools.
   *  Replaces the default handlePrint for worksheet PDF export.
   *  For SVG tools, pass the shared `handleDiagramPrint` directly — it measures
   *  nothing in the DOM (diagram heights are derived from the aspect ratio) and
   *  routes pagination through the same computeWorksheetLayout engine the text
   *  path uses, so diagrams get variable columns, sections and differentiated
   *  layout for free. `ctx` carries the live print setup (columns, etc.). */
  customPrintHandler?: (
    questions: AnyQuestion[],
    printMode: PrintMode,
    worksheetEl: HTMLElement | null,
    ctx: PrintContext,  // { toolName, difficulty, isDifferentiated, numColumns, instruction, layout, showBorders }
  ) => void;

  /** Optional. When provided, ToolShell shows a "Teach" mode — a PowerPoint-style
   *  deck the teacher presses through (→ / space / click; ← steps back). Omit it
   *  and no Teach tab appears. See "Teaching slides" below. */
  teachingSlides?: TeachingSlide[];

  /** Optional scaffold drawn inside the whiteboard's working box (e.g. a place
   *  value table to model on). A toolbar button in the box hides/shows it so the
   *  teacher can remove the scaffold. Whiteboard only (embedded + fullscreen);
   *  suppressed while the visualiser camera is on. `label` names the tooltip. */
  workingScaffold?: {
    label: string;
    /** "workingBox" (default) or "question" — inside the question box below the
     *  question (works with the default renderer or a `questionRenderer`); pair with `collapseWorkingByDefault`
     *  for a full-width scaffold. The hide button then sits in the question box. */
    placement?: "workingBox" | "workingCorner" | "question";
    cornerWidth?: number;   // px, for workingCorner (default 190)
    render: (q: AnyQuestion, showAnswer: boolean, qo?: QOSnapshot) => JSX.Element | null;
  };
}
```

### `defaults` — per-tool overrides

```ts
defaults?: {
  displayFontSize?: number;             // starting font size index 0–5, default 2 (text-3xl)
  worksheetFontSize?: number;           // starting font size index 0–5, default 1 (text-xl)
  numQuestions?: number;                // starting question count, default 15
  numColumns?: number;                  // starting column count, default 3
  fixedColumns?: boolean;               // hides the columns input entirely
  maxColumns?: number;                  // caps the columns input max (e.g. 3 = no 4-col option)
  maxColumnsByLevel?: Record<string, number>; // per-level override of maxColumns (e.g. { level3: 4 } for a text-only level on a diagram tool)
  maxColumnsByTool?: Record<string, number>;  // per-sub-tool override of maxColumns (beats maxColumnsByLevel)
  hideFontControls?: boolean;           // hides the text-size up/down chevrons (diagram-only tools)
  qoColumns?: 2;                        // Question Options popover in two columns with a thin grey divider (tools with many options)
  collapseWorkingByDefault?: boolean;   // whiteboard opens with the working/visualiser panel collapsed (diagram-heavy tools)
  worksheetFontControls?: boolean;      // with hideFontControls on, keep the chevrons on a text Worksheet (hidden only while a question sets `_fixedSizeCell: true`)
  workedExampleLayout?: "stacked" | "single"; // Step-by-Step layout: "stacked" (default) cascades; "single" replaces the card each press
  toolTabRows?: number[];               // split the sub-tool tab buttons across rows, e.g. [3, 2] for five sub-tools; omit for one row
  hideAnswerStep?: boolean;             // Worked Example: skip the separate green answer box. Only when the last working step states the exact final answer in every case (stress-test every sub-tool × level)
}
```

### Staged reveal — show a preview before the answer

A question may carry `_stagedReveal: "<button label>"` (e.g. `"Show Plot"`). In Whiteboard, fullscreen and Worked Example ToolShell then renders a separate toggle button **inside the question box** (below the renderer output; "Show Plot" ⇄ "Hide Plot"), leaving the toolbar's Show Answer untouched. Pressing it sets `qo.preview = true` (on the `QOSnapshot` passed to `questionRenderer`) so the tool can draw an intermediate state; Show Answer reveals everything, and the button hides once the answer is up. A new question / reformat resets it. Worksheets ignore it (renderers should honour `qo.preview` only when `compact !== true`). Reference: `src/tools/Number/Rounding.tsx` ("Students plot it").

**Per-page cap for diagram worksheets:** set `_densityFloorMm` on a tool's questions to override `handleDiagramPrint`'s default 40 mm density floor — a lower value means taller minimum rows, so fewer per page (30 → 12 per page at 2 columns for a ~2.6:1 diagram). A tool can also wrap `handleDiagramPrint` to adapt `ctx.numColumns` to the question count so a short sheet uses fewer, bigger columns (see `printRounding`). Questions with no SVG can set `_printText` to print a plain text cell on a diagram sheet (mixed-level / differentiated); a diagram tool whose text-only level should scale like any normal tool can route pure-text sheets to `handlePrint` instead.

### Shared prompt — said once on a worksheet

A worded question shaped `lines: ["Simplify:", "$maths$"]` (a maths-free prompt, then a line of only maths) has a **prompt** (`promptOf`, `src/shared/prompts.ts`). On the Whiteboard and Worked Example `QuestionDisplay` draws that prompt as a small slate line (half size) above the large maths, so the question carries the emphasis (the same look as a tab-wide `instruction`, but it works when the prompt varies per question). On the standard Worksheet, when every question shares the same prompt (and the tool has no `instruction` and no `questionRenderer`), ToolShell shows it once above the sheet on screen (print is unchanged: every printed cell keeps its prompt) and the on-screen cells carry only the maths. The Worksheet Settings popover has a **Say the prompt once** switch (on by default, shown only when a shared prompt exists) to put the prompt back in every cell. Otherwise each cell shows its prompt as a small label above the maths. Keep one prompt per question type, and the same wording across the types a sheet mixes (put the answer-form wording in every type's prompt), so a sheet can hoist it.

### Condensed wording — a Worksheet setting

A question may carry `_condensedLines` (`["$123.45$", "(3 d.p.)"]`: the question, then a small tag) beside its ordinary `lines`. When any question on the sheet has it, the Worksheet **Settings** popover shows a **Condensed wording** switch (off by default, remembered per tool for the session); on, the worksheet cells show the condensed form (`condensedOf`, `src/shared/prompts.ts`: the first line large, the tag at half size in slate via `_tagged`). It is a display setting, never a Question Option, and it does not regenerate anything; print and the whiteboard keep the full wording. Reference: Rounding's text questions (Level 3, and Significant Figures with the number line off).

### Worksheet answers — in place of the question, one cell at a time

With answers up, a text cell shows its **answer** (large, green) instead of the question with the answer squeezed beneath it; a **double-tap** on a cell flips just that cell between question and answer (`flips` in `ToolShell`, keyed by question key), so answers can be revealed one at a time, and the Show Answers switch resets every cell. A cell with a picture (a `questionRenderer` question that is not `worded`) keeps the picture and gets the answer under it. The cell's regenerate button stops its own pointer-up so it never counts as half of a double-tap.

### One slide size

A Teach slide and a Depth stage out of full screen use the same width (`slideSlotWidth()`, `src/shared/slideSize.ts`: the height left after `SLIDE_CHROME_REM` of page chrome, 16:9). Use it for any new 16:9 slide surface.

### Fullscreen worksheet — fits itself to the screen

Fullscreen sizes the sheet's text itself (`wfs` in `ToolShell`): it starts from the largest size, waits for the maths to draw, steps down until the sheet fits the screen height, and stretches the rows to fill what is left. Pressing a text-size button takes over (an **Auto-fit** button then returns to it); it re-fits when the columns, the sheet or the window change. **Showing answers never re-fits** (that re-laid the page out): the fit draws every cell as its answer (`fsProbe`, the tallest it gets) and settles on one size, so Show Answers and per-cell flips never change the layout. Worksheet text sizes run `text-lg` to `text-7xl`. **Every cell stays the same size** (a standing priority): columns are `minmax(0, 1fr)`; once the text fits, the rows are `minmax(0, 1fr)` too and split the screen exactly (when it cannot fit, rows are `1fr` and the sheet scrolls, every row as tall as the tallest). A differentiated level's box spans the shared rows with a spacer row at the foot instead of bottom padding (a subgrid adds its padding to its last track, which made each column's last cell shorter), and each level says its own shared prompt once under its heading.

### Working scaffold — content inside the working box

The working box is otherwise blank space (the teacher writes on it, or the visualiser camera fills it). A tool can put a **scaffold** in it with `workingScaffold` — e.g. the shared place value table, empty until Show Answer fills it. The box's button cluster gains a toggle that hides/shows the scaffold (session-only, default shown), so the teacher can remove it when students no longer need it. The scaffold is fit-scaled into the box. `qo.scaffoldVisible` (on the snapshot given to `questionRenderer`) is true while the scaffold is actually on screen, so a renderer can drop content the scaffold already shows (the decimal tool omits its inline "= answer" while its table shows the answer row). **Font sizers:** a tool with `hideFontControls` gets the size chevrons back while a `placement: "question"` scaffold is hidden (and the question stops auto-fitting to fill, so the chevrons work). **Placement:** default is the working box; `placement: "question"` draws it inside the question box under the question (and answer) instead — works with the default question display as well as a `questionRenderer`; third option, `placement: "workingCorner"` (+ `cornerWidth` px), pins a SMALL scaffold to the top-left of the working box (not fit-scaled, so the rest of the box stays free to write in; the hide button still works) — Order of Operations uses it for the BIDMAS pyramid (the hide button moves to the question box's cluster) — use it with `collapseWorkingByDefault: true` for a wide scaffold like a place value table, so it runs full width. References: `src/tools/Number/DecimalAddSub.tsx` and `src/tools/Number/PowersOfTen.tsx` (both `placement: "question"`; Powers of 10 still draws its filled grid through the question renderer in Worked Example, where the scaffold isn't shown).

### Collapsible working / visualiser panel

The whiteboard's right-hand **working / visualiser panel** can be collapsed via the **collapse button** (top-right of the panel) in both the embedded and fullscreen views. When collapsed, the panel is removed and the question box expands to fill the full width, with its contents **scaled up to fit** (`ScaleToFit`) so SVGs/diagrams and text genuinely grow into the reclaimed space — ideal for large diagrams in fullscreen. A **re-open button** (`PanelRightOpen`) then lives inside the question box's top-right control cluster (next to the font-size chevrons), so the panel is always recoverable — including fullscreen-expanded, and on diagram tools that hide the font controls. The **Fullscreen / Exit Fullscreen** button moves into that same cluster while the panel is collapsed, so it is always present (always last, after the panel re-open button, matching the open panel's collapse-then-fullscreen order). The panel is never gone for good; it stays available in every tool. State is session-only (resets on reload). Diagram-heavy tools can start collapsed with `defaults={{ collapseWorkingByDefault: true }}`.

Font size indices: `0=text-lg  1=text-xl  2=text-3xl  3=text-4xl  4=text-5xl  5=text-7xl`

### What ToolShell provides automatically (never re-implement)

**"About this tool"** (`InfoModal` + `src/shared/about.ts`: burger menu item; the tool's purpose, then each sub-tool with its purpose, what its levels mean and its Question Options, all read from `TOOL_CONFIG` — no explanation of the modes; opens once per live tool per device from a plain address, `setLivePaths` in `App.tsx`, reset from the landing menu) — used by ToolShell, DecisionShell (built from its tabs' `blurb`, `levelLabels` and options) and CSShell/games (their hand-written notes). **The words live in `<Tool>.about.ts`** (`ABOUT: ToolAbout`: `purpose`; per sub-tool a `purpose` and one short plain line per level; and `options`, one plain sentence for every Question Option group by its id — the key, or `key@<levels>` where one key means different choices at different levels — shared by the tool or overridden per sub-tool; `applyAbout` writes it onto copies of the pools, switches and dropdowns as their `info`, so the hover note in the options popover and the About panel say the same thing, and `levelLabels.test.ts` fails for any option left unexplained), applied with `applyAbout(TOOL_CONFIG, ABOUT)` just before `export const __test`; the same level text feeds the level (i) beside the level buttons, so the two always agree (`levelLabels.test.ts` requires them and limits their length; no jargon) · Whiteboard / Worked Example / Worksheet modes (the Worksheet has a Fullscreen button on the laptop layout: edge-to-edge sheet with its own columns, text size and answers bar) · **Teach mode (when `teachingSlides` supplied)** · difficulty toggle · QO popovers (dropdown, variables, multiSelect, differentiated) · tool tab buttons (auto-hidden when only one sub-tool) · font size controls · PDF print · info modal · home button · shareable links (URL ⇄ state sync + "Copy Link to Setup" menu item) · **step-by-step Worked Example (the cascade — earlier steps stay on screen, dimmed — with Show All as the alternative) with fragment walking and skill-link overlays** — tools only author `string[]` steps and `[[skill-id|term]]` markers; never re-implement the reveal or the overlay

### Depth — a bank of curated questions (diagnose · explain · extend)

**Depth** is a ToolShell mode (a "Depth" tab beside Whiteboard / Worked Example / Worksheet) holding **fixed, hand-written questions** that go beyond generated practice. It is the lighter, adaptive successor to a presentation deck: the teacher dips in by **purpose** and **level**, in whatever order the class needs, instead of pressing through a pre-planned sequence. Where a tool already shows the model (BIDMAS pyramid, place value table…), a dedicated model deck is unnecessary.

```tsx
<ToolShell depthItems={DEPTH_ITEMS} … />   // items: DepthItem[] — see src/shared/depth.ts
```

- **An item is two slides**: the **question** slide, then the **answer** slide (`←` / `→` / `Space`, or the Question | Answer switch). Each is designed like a classroom slide, not app UI: a navy 16:9 stage (the site blue) with a left rail (plain DEPTH wordmark, level pill, purpose pill in the purpose's accent colour, and the owl mascot — a question mark on the question slide, a tick on the answer slide), a white left-aligned panel topped with a purpose-coloured bar, cartoon speakers with speech bubbles and big type. The stage's type scales with its width (container-query units; phones get a normal flowing column). **Present** fills the screen — an overlay that works in every browser, plus native fullscreen where the browser allows; `Esc` leaves. `$...$` is inline maths in every string.
- **Interactive pieces** (all optional per item): `speakers` draw cartoon faces with speech bubbles ("Jack says…"); `working` shows lines of working the class can tap to pick the one they think is wrong (the answer slide marks `wrongLine` as the first mistake and dims the lines that follow from it); `options` are lettered tiles (the answer slide marks the correct one and names the misconception behind each wrong one); `visual` shows a picture in the panel's corner (currently `{ type: "pyramid", strong, soft }`, the BIDMAS pyramid — visible from the start, lit on the answer slide; a **Scaffold → BIDMAS pyramid** switch in the side rail hides it, kept between questions). Teacher notes sit behind a **Teacher notes** toggle under the slide so a projected slide never shows them. Artwork lives in `DepthArt.tsx` (original SVG: `Avatar`, `Mascot`, `Badge`).
- **Three purposes**: `diagnose` (surface a misconception — who is right? multiple choice where every wrong option **names the misconception it reveals**, shown on the answer beat), `explain` (unpick reasoning — explain this mistake, spot the error in working), `extend` (go deeper — always/sometimes/never, convince me, make your own).
- **Level-aware**: the picker shows the current level's items (the level toggle sits above it), filterable by purpose. `startHere: true` on one diagnose item per level feeds the **Start here** quick check (one question per level, in order — shows where the class is).
- **Follows the Question Options**: Depth shows the same Question Options control as the other modes (same state, so what is ticked in Whiteboard / Worked Example / Worksheet is what Depth sees). An item may list `needs` — clauses that must all hold, each an option `value` or an array of which at least one must be on (e.g. `[["indices", "bracketsIndices"], "negatives"]`). Items whose needs aren't met are **greyed out** in the picker with "Needs Focus: Roots", so a class building up never gets a question it can't meet. Needs are checked only for items at the current level (cross-level links and the Start here check are never blocked); a clause naming no option offered on the current sub-tool/level is skipped, so one list can name a generator's options on several tabs (Evaluate's focus families and Spot the Mistake's mistake types). Omit `needs` for an item that is always possible. `depthUnmet` (shared) does the check; `depth.test.ts` verifies every named option exists, that default options still leave diagnose, explain and extend at every level, and that no single option leaves fewer than 3 items (or only diagnose items) — write items so every Question Option has something to offer.
- **Feathers (the owl) talks**: a speech bubble on every slide — a nudge to the class on the question slide, a takeaway on the answer slide — from `feathersLine(item, onAnswer)` (a default from the item's shape, or the item's own `prompt` / `takeaway`; keep lines short, class-facing and never the answer). A **Feathers** button under the slide mutes the bubbles per device. Speakers are the eight named cast (Ruby, Kofi, Mei, Ben, Amara, Leo, Priya, Jamal — `CAST_NAMES`); name speakers from that list.
- **Adaptive without a script**: `ifNotSecure` / `ifSecure` point at an easier/related item or an extension; the answer beat offers them as buttons (a link may cross levels; `ifSecure` never goes down).
- **Authoring rules**: the `title` shows on the picker so it must not give the answer away; items are **fixed** (never generated — generated "Is it correct?" / "Spot the mistake" tasks stay in the tool's own practice); give each wrong option a `misconception`; add a `teacherNote` (what to ask / listen for); ids are `<tool>-<slug>` (URL-safe, used by `?item=`).
- **Gating**: none — Depth is live wherever a tool passes `depthItems` for the current sub-tool (an item with no `tool` shows on every tab). URL: `?mode=depth&level=2&item=<id>`.
- **Tests**: expose the bank as `__test.depthItems` — `src/tests/depth.test.ts` checks unique ids, well-formed items, one correct option per multiple-choice item with a named misconception for every wrong one, links that resolve, diagnose + explain + extend at every level, one Start here per level, and that every `$...$` renders. Assert the bank's numbers in the tool's own test (see `OrderOfOperations`).
- **Spec**: `docs/design/templates/DEPTH_SPEC_TEMPLATE.md` → `specs/depth/<tool-id>.md`. Reference bank: `src/tools/Number/OrderOfOperationsDepth.ts` (32 items).

### Teaching slides — the "Teach" deck  (authoring guide)

The **Teach** deck (`TeachingDeck`, `src/shared/TeachingDeck.tsx`) is a slide-based "teaching part of the lesson": the teacher picks a category, then presses through hand-authored, misconception-driven slides one **beat** at a time before moving to Whiteboard / Worksheet. This section is the complete guide to authoring them.

**Developing-tools gated.** Decks only show when Developing-tools mode is on (`useDevMode()` in `ToolShell.tsx`, `showTeach`). A tool with `teachingSlides` gets a Teach tab; lesson decks (`teachingLessons`) have NO tab: they are reached through a lesson step (burger menu → Lessons). Remove the gate when a deck is classroom-ready and should go fully live.

**Add a deck to a tool.** Define an array in the tool file and pass it: `<ToolShell teachingSlides={TEACHING_SLIDES} … />`. No prop → no Teach tab. Reference implementation: `src/tools/Number/FractionsAddSub.tsx` (`TEACHING_SLIDES`); a minimal one in the `ToolShell.tsx` template.

**`SlideDeck`** is the reusable core: it plays a flat `TeachingSlide[]` one beat per press (keyboard included) and is exported from shared. `TeachingDeck` wraps it with the category menu; the skill-library overlay (`SkillOverlay`) plays a skill's slides through it directly. New slide-playing surfaces should reuse it, not reimplement beats. The slide card is **fixed-height** (62vh embedded; `fill` makes it fill the host — the skill overlay is near-fullscreen with a slim dimmed rim) with the nav controls (Back / beat counter / Next) inside the card's bottom edge — the whole surface is teaching space, no external button row. Every beat's content is laid out from the first press — captions stack in one grid cell sized to the tallest, static reveals reserve their space with the Reveal button overlaying it — so the card never resizes mid-slide. Content that would exceed the card **auto-scales down to fit** (CSS transform, measured per slide) — slides never show scrollbars, on any screen size. Scenes must follow the same rule: reserve space for everything (opacity, not mounting).

**Size for readability, never to fill.** The container claims the screen; the content does not. Scenes and text are authored at a size chosen for legibility from the back of a classroom — fit-scaling only ever scales content *down*, and nothing is ever inflated to occupy empty card space. Whitespace around a slide is calm framing, not waste; a slide that fills its card edge-to-edge is harder to read, not better.

**Authoring philosophy — read before writing slides.**
- Slides are **specific, hand-authored, misconception-driven examples** — NOT generated. The randomised/varied side is exactly what Whiteboard and Worksheet are for; do not add generators here.
- Prefer an **I-do → We-do → You-do** arc within a category, on **one coherent example** (e.g. keep the same fraction across the three). You-do should make the student **predict/answer** before the reveal.
- `title` is a short **topic label** (e.g. "Equivalent fractions"), not a sentence — it renders small and muted. The **changing caption is the voice**; put the teaching there.
- No emoji. Palette is navy shade + slate cut-lines + white cards. Keep to it. Every slide is the same 16:9 shape (card, scene and Depth stage alike); there are no I do / We do / You do banners. The Back / Full screen / Next row sits under the card; full screen is an overlay that ends when the deck unmounts (a hand-off or the lesson moving on).

**Slide model (`TeachingSlide`).** Every slide has `category: "concept" | "trueFalse" | "spotMistake"` (`TeachCategory`). Two kinds:

```ts
// static (default kind) — body blocks, then one optional `reveal` (one extra beat / a Reveal button)
{ category: "trueFalse", title: "$2+3=6$",
  body:   [{ t: "text", s: "Decide first." }],
  reveal: [{ t: "verdict", value: false }, { t: "note", tone: "good", label: "Correct", s: "$2+3=5$." }],
  revealLabel: "Reveal" }

// anim — a scene choreographed across beats, ONE caption per beat
{ kind: "anim", category: "concept", title: "Equivalent fractions",
  scene: { type: "split", num: 3, den: 5, factor: 2 },
  steps: ["Here is $\\dfrac{3}{5}$…", "Split the first fifth…", /* one per piece */ "…$\\dfrac{6}{10}$." ] }
```

**`TeachBlock` types (static slides):** `{ t:"text", s }` (`$...$` inline maths, `**bold**`) · `{ t:"math", s }` (large centred KaTeX) · `{ t:"bars", bars:[{num,den,label?}] }` (static shaded bars) · `{ t:"verdict", value:boolean }` (TRUE/FALSE pill) · `{ t:"note", tone?:"good"|"bad"|"plain", label?, s }` (bordered note, coloured left rule, **no emoji**).

**`TeachScene` types (anim slides)** — the beat count is **derived from the scene**, so `steps` must supply one caption per beat (fewer is allowed; the last caption persists — avoid that with `predict`):

| scene | beats (max step = beats−1) | what it does |
|---|---|---|
| `{ type:"split", num, den, factor, shadeByOne?, predict? }` | `den + 2` (`+1` if `predict`, `+num` if `shadeByOne`) | cuts ONE original piece into `factor` per press (shaded area never moves), then shows the equation `num/den = (num·f)/(den·f)`. `predict` holds the answer at `?/?` for one extra beat (You-do). |
| `{ type:"equivalents", num, den, factors:number[] }` | `factors.length + 1` | beat 0 is the prompt; each later beat reveals one `×factor` equivalent — for a "find two equivalent fractions" You-do (`factors:[2,3,4,5]` gives the four common answers). |
| `{ type:"multiples", a, b }` | `lcm/a + lcm/b + 2` | LCM walkthrough: each press writes the next multiple (a's list up to the LCM, then b's); the shared value highlights when it lands, and the final beat states `LCM(a, b)`. |
| `{ type:"factorTree", n }` | `Ω(n) + 1` (Ω = prime factors with multiplicity) | builds n's factor tree one split per press, always dividing out the smallest prime; composites are plain numbers, each prime becomes a coloured tile as it's produced; final beat states the product. |
| `{ type:"primeVenn", a, b }` | `(total primes across regions) + 2` | both factor lists shown as tile rows up front; each press crosses the next tile(s) off the list(s) and places the prime in the Venn (a shared prime strikes one tile off EACH list and puts a single tile in the middle); final beat multiplies everything for the LCM. |
| `{ type:"combine", a, b, sumLabel }` | `2` | two shaded bars (common denominator) flow into one. |

**Lessons in the deck (`teachingLessons`).** Instead of the category menu a tool can pass `teachingLessons={TEACH_LESSONS}` (`TeachLesson { id, title, summary, tool, slides }`, one per sub-tool topic; the Teach menu lists the lessons on the current tab). A static slide may carry a `{ t: "handoff", buttons: [{ label, to: { tool, step } }] }` block: the buttons open a pre-set Whiteboard / Worksheet / Depth in place (`step` is a lesson-step setup — `setupParams` in `src/shared/lessons.ts`). Build diagnostic check slides from the Depth bank by id rather than copying them: a `{ kind: "depth", item }` slide plays the real Depth stage inside the deck (question beat, then answer beat; `checkSlide(id)` in `IndicesTeach.ts`). A lesson step of kind `teach` (`deck: "<lesson id>"`) opens a deck; a lesson step may name its own `tool` so a lesson moves on to another tab. Reference: `src/tools/Number/IndicesTeach.ts` (Laws of indices) and `src/tests/indicesTeach.test.ts`. The `indexExpand` scene (`multiply` · `divide` · `power` · `expand`; factor tiles, one tile per copy of the base) carries index laws; its optional `head` / `tail` strings replace the equation line above / below the picture (e.g. `x^-2 × x^5 = 1/x² × x^5 = x⁵/x²` over the cancelling tiles).

**Adding a new scene type:** extend the `TeachScene` union, add its beat count to `sceneMaxStep`, and render it in `SceneView` (+ a component). Drive animation with CSS transitions on SVG (opacity/transform), no libraries — see `SplitScene`. The URL `mode=teach` deep-links to the deck.

### Ink overlay — writing anywhere (app-level, never per tool)

`src/shared/components/InkOverlay.tsx` is mounted **once in `App.tsx`** and appears on every tool page (not the landing page; not the Algebra Tiles / Negative Counters sandboxes, which have their own board and hotbar — add a route to `NO_INK` for any new sandbox). A pencil button opens a movable hotbar: **Freeze** (the page is live, the ink stays) · **Pen** · **Eraser** · Undo · Clear · colours; tap the active Pen / Eraser again for its options flyout (pen thickness; eraser size and **Part** vs **Whole line**). In Draw a drag inks and a short still tap is **forwarded** to the element underneath, so buttons keep working. Never re-implement drawing in a tool, and never add per-tool ink wiring.

- **Forwarded taps are synthetic**, so the browser refuses anything that needs a genuine click (popups — Print). Mark such a control **`data-trusted-click`**: tapping it while drawing freezes the layer ("Frozen — tap again") so the second tap is a real click. Fullscreen / Present / the visualiser camera do *not* need it.
- Ink is stored in **screen (viewport) coordinates** (page-anchored ink slid when the Whiteboard fullscreen re-laid out the page) and clears on route change; it is hidden when printing.
- Hotbar position (`mt-ink-hotbar`) and pen / eraser choices (`mt-ink-prefs`) are remembered per device. The bar never changes size when the tool changes — options live in flyout menus that open perpendicular to it. Pure helpers (`dockFromDrop`, `placeHotbar`, `classifyPress`, `eraseAt`) are unit-tested in `src/tests/inkOverlay.test.ts`.

### Recent and pinned questions — in both shells (never per tool)

`src/shared/questionKeeper.ts` (`useQuestionKeeper`, `MAX_KEPT = 5`) is wired once in `ToolShell` and once in `DecisionShell`: the burger menu's **Recent & pinned questions** item pops out the last 5 questions you moved on from (newest first, no repeats) and up to 5 pinned ones, and `PinButton` (`src/shared/components/PinButton.tsx`) sits beside New Question in the toolbar (phone: the bottom bar). Memory only (gone on reload); hidden in Worksheet mode. Picking one restores the exact question and its level / tab / options without regenerating it (`ToolShell` guards the QO effect with `restoredQ`). `MenuDropdown` takes `keeper` for this and `menuItems` (extra burger items, e.g. Rounding's printable blank number lines; they carry `data-trusted-click`). Tools add nothing.

### DecisionShell (`src/shared/decision/`) — network-native tools, quick reference

Full plan: `docs/architecture/DECISION_SHELL_PLAN.md`. Shell-level options a Decision tool can use (all opt-in):

- **`config.chooser: ShellChooser`** — one collapsible topic chooser at the top (desktop; phones keep the click-through start screens) instead of the big tabs and tab row: `filters` (the `top` option keys shown as segmented filters inside it), `groups` (titled lists of sub-tool keys) and optional `art(key)` mini pictures. `ShellSubTool.blurb` is the tile's one-liner; `ShellSubTool.when` / `ShellOption.when` accept an array (every condition must hold) so a course or practice switch can hide tabs and options. Picking a tile leaves the chooser open. Reference: `src/tools/Decision/NetworkFlows.tsx` (art: `FlowTileArt.tsx`).
- **Layout** — the working area is one laptop screen tall (`STAGE_H` in `layout.ts`, both columns fill it) from `lg` up and stacks below; the toolbar is the ToolShell one (levels · Question Options · pin + New Question). `config.levelLabels` become a "Levels" Info section automatically.
- **Parts library + recipes (Network Flows; the pattern for every Decision exam)** — `shared/decision/flowParts.ts` holds one `PartDef` per question idea (`build(ctx)` → `ExamPart[]` or `null` when the network does not suit it; it may leave `ctx.facts` for later parts); `flowExam.ts` holds the recipes (slots = pools of part ids) and `composeFlowExam`, which samples a network and retries. Add a part to the library and a slot to a recipe — never write a part inside a chain. A recipe may have a `second` figure (`ExamPart.figure`); every part gets `partId` and a `practise` target (`PRACTISE`) for the "Practise this" link. The **Explain and justify** tab (`FLOW_IDEAS`, `generateFlowReason`) is a one-part exam built from the same parts; ideas marked `legacy` are off until ticked. Paper questions are tagged as part chains in `specs/corpus/<tool>.md`, checked by `flowCorpus.test.ts`. Spec: `specs/flow-parts-library.md`.
- **Exam-style questions** — a generator may return `DecisionProblem.exam` (`ExamData`: intro, marks, minutes, `parts: ExamPart[]` with `prompt`, `marks`, `scheme` (B1/M1/A1/E1/R1), `model` answer lines (empty + `onDiagram` when the answer is drawn on the picture), `explain`, `working: SolveStep[]` (the skill solver's steps, played stepped behind the (?)), `view` (the picture for the part's answer) and `role`). `ExamView` shows one part at a time (Show individually | Show all parts) with Back / Show answer / Next fixed at the foot; **Practice | Worksheet** (the switch lives in the chooser) generates a set, previews each question and prints it with the normal green Print split button (Both / Questions / Answers) through `printExam.ts` (papers first, then mark schemes; blank networks where the student draws). Reference generator: `src/shared/decision/flowExam.ts`; spec `specs/flow-exam-questions.md`.

### Shareable links — URL parameter format

ToolShell mirrors the current setup into the URL query string (`history.replaceState`, only non-default values), so the address bar is always bookmarkable and the burger menu's "Copy Link to Setup" copies it. Opening a link restores the full setup; a `mode=worksheet` link auto-generates the worksheet on arrival. Invalid/stale params fall back to defaults — old links never break.

| Param | Meaning | Example |
|---|---|---|
| `tool` | sub-tool key (omitted for the first tab) | `tool=findingRoots` |
| `mode` | `example`, `worksheet` or `teach` (whiteboard is default) | `mode=worksheet` |
| `level` | `1` `2` `3` | `level=2` |
| `dd` | dropdown value for the current tool+level | `dd=fraction` |
| `vars` | variable toggles; `-` prefix = off | `vars=integerC,-negCoeff` |
| `ms` | multiSelect options; `-` prefix = off | `ms=bothNeg,-typeA` |
| `n` / `cols` | worksheet question count / columns | `n=20&cols=2` |
| `diff` | differentiated worksheet flag | `diff=1` |

Only the current tool+level's QO state is encoded (the URL reflects what is on screen). Differentiated per-level QO customisation and advanced-mode groups are not encoded. Tools get all of this for free — never re-implement URL handling in a tool file.

### Split worked example — the developing picture, three flavours

`stepVisualRenderer` turns Worked Example into a split: ONE picture that updates in place as the steps advance.
Everything is in the shared `WorkedExampleSteps` — a tool only supplies per-step data and a renderer.

| Flavour | Left list | Tool supplies | References |
|---|---|---|---|
| **Caption-only** (default) | each step's caption (`step.plain`) on a numbered timeline; the answer is a green **A** line (no box, no outline) | steps whose snapshot IS the working: `pvStep` + `placeValueStepVisual`; `rStepBuild` + `ratioTableStepVisual` (one ratio table growing a row per step); bar steps | `DecimalAddSub`, `PowersOfTen`, `SpeedDistanceTime`, `RatioSharingTool` |
| **Keep working** (`stepVisualKeepsWorking`) | flat numbered rows (same spine as the captions, no backing cards) carrying each step's own label and maths; picture sits beside them | steps stamped with the picture state | `EquationsOfLines`, `NonLinearSimEq`, `MixedStrategies` (graph) |
| **Picture on top** (`stepVisualPlacement="top"`) | as above, picture full width above | a wide short picture | `IntegerAddSub`, `Rounding` (number line) |

**Step-by-step graph builds.** `SmartGrapher` takes a `step` prop: any series / FOI (`config.fois`) / guide / region
carrying a `step` field is drawn only once `step >= its step`, and what appears exactly now is emphasised (heavier
curve, ringed dot). The frame is computed from the FULL set so the view never jumps. A tool describes the complete
graph once as a `GraphBuildSpec` (tagging parts with `step`), stamps each working step with
`graphStep(step, spec, n)` and passes `graphStepVisual` as `stepVisualRenderer` (+ `stepVisualKeepsWorking`).
Steps before the first stamped step render as plain full-width cards (the layout splits when the picture starts).

**Diagram tools (the geometry tools).** The question *is* the diagram, so use the shared `src/shared/diagramSplit.tsx`: `withDiagramSteps(generateQuestion)` stamps each working step with the question's `_diagram`, `diagramStepVisual(questionRenderer)` is the `stepVisualRenderer` (the diagram, answer revealed on the final step), and `diagramSplitQuestion(questionRenderer)` swaps the diagram above for the one-line prompt (`q.display`) in the worked example once the answer is showing (pass `{ promptInDiagram: true }` when the drawing carries its own prompt). Pass `stepVisualKeepsWorking` and create all three wrappers at module level. `withDiagramSteps` also splits a final inline chain (`x = 180° − 146°` · `= 34°`) into the working plus a separate green answer step via `splitAnswerStep` (helpers) — tools with `hideAnswerStep` and fragment-authored last steps should call it too. The picture copy also gets `_step` (the step index): a diagram can reveal values the working has just found (e.g. an angle with `appearsAt: n` is drawn from step n, in green). **Per-step emphasis:** give the question `_stepFocus` (one entry per working step — the tool decides the shape, e.g. angle indices); each step's picture gets its entry as `(q as any)._focus` in the tool's `questionRenderer`, which lights those parts and fades the rest (reference: `AnglesInTriangles`, `focus` prop on `TriangleDiagram`). References: any tool in `src/tools/Geometry/` (not Equations of Lines, which uses `graphStepVisual`).

**`hideAnswerStep` with a split:** a split tool that sets `hideAnswerStep` drops its A line, so only set it when
the last step is itself the answer.

### Shell failures name the part that broke (`shellDiagnostics.ts`)

Every screen of the shell (Whiteboard, Worked Example, Worksheet and its control panel, the phone layout, Depth, Teach, the advanced builder) runs inside a `ShellPartBoundary`. If one fails to draw, only that screen is replaced by a short message naming it with a **Try again** button; the menu, the tabs and the way home keep working. Generator calls (a new question, a worksheet, one regenerated cell, a Question Option change) run behind `attempt`: a throwing generator leaves the question or sheet on screen and shows a note naming what failed. Every failure is recorded by `reportShellFault` with the screen, sub-tool, level and mode: read it in the browser console as `window.__mtFaults`, or as a `[ToolShell:<part>]` console error. Tools add nothing; **never swallow an error inside a tool's own generator** (let it throw so the shell can name it). Checks: `src/tests/shellDiagnostics.test.ts`, and `npm run smoke:shell` (opens every screen of three representative tools at laptop, tablet and phone sizes in a real browser and fails naming any screen that reported a fault; needs Playwright, not a project dependency; `SMOKE_TOOLS=/rounding` narrows it). Run it after any change under `src/shared/`. **Lint:** `npm run lint` (ESLint, React hooks rules only; runs in CI beside the build and tests, and `smoke:shell` runs in CI as its own job). A new effect, memo or callback must list everything it reads. Where it should deliberately react to less, switch the check off on that line with a reason: `// eslint-disable-line react-hooks/exhaustive-deps -- deliberate: <why>` (`src/tests/hookDisables.test.ts` fails without it anywhere under `src/`).

### Single sub-tool — no tab buttons needed

If `config.tools` has exactly one key, the tool tab buttons are **automatically hidden**. Nothing special needed.

### `levels` — sub-tools with fewer than three levels

Not every topic has three honest difficulty rungs (e.g. number-base conversions: one nibble, then a
byte — the spec stops there). Set `levels` on the **sub-tool's `ToolEntry`** (per sub-tool, so tabs
in one tool can differ):

```ts
binaryShifts: { name: "Binary Shifts", …, levels: ["level1", "level2"] },
```

Unlisted levels are **hidden** everywhere — whiteboard/worked-example toggles, the worksheet level
row, the differentiated picker (two levels → a two-column differentiated sheet), the advanced
builder. With one level the
difficulty toggle (and Differentiated button) disappear, as tool tabs do with one sub-tool.
Switching tab clamps the level to the new sub-tool's set, and a `level=` URL param outside the set
falls back to its first level. The smoke tests skip hidden levels automatically. Put
difficulty *variety within* a level into QO pools, not extra levels. Reference:
`src/tools/Binary/NumberBases.tsx`.

---

## QO-driven behaviour — how ToolShell reacts to option changes

**Changing a Question Option never throws the current question away** (Whiteboard and Worked Example; Worksheet is unaffected). The question on screen stays, and the *next* question follows the new options, so a teacher can change their mind without losing the question they are on. ToolShell tracks a `qoFingerprint`; when it changes:

1. **Level or sub-tool changed** → a fresh `generateQuestion` (always).
2. **Otherwise**, if the tool supplies `reformatQuestion` and it returns a question → that replaces the current one (same maths, new display).
3. **Otherwise**, if every option that changed is **`displayOnly`** (on a dropdown, variable or multiSelect group; a dropdown with `workedExampleOnly` counts) → the shell **replays the question from its saved seed** with the new options: same numbers, new display, instantly, with no per-tool code. Every question generated for the Whiteboard / Worked Example carries `_seed` (`generateSeeded` / `replaySeeded`, `src/shared/seededGenerate.ts`, which runs the generator with a seeded `Math.random`).
4. **Otherwise** → nothing happens to the current question.

So to make an option reformat instantly, mark it `displayOnly: true` — nothing else. Only mark an option that changes how the SAME question is shown (decimal ↔ fraction, headings, a hint, a method of working); `src/tests/seededReformat.test.ts` replays every flagged variable and fails if the answer changes. Never flag an option that changes the numbers, the ranges or what is asked. A switch whose answer line is worded differently when flipped, with the same question and result (Best Buys' comparison unit), also sets `rewordsAnswer: true`; the test then checks the question text is identical instead of the answer. `reformatQuestion` below is still available for a tool that needs to rebuild its display by hand.

**DecisionShell follows the same rule.** Changing a (non-top) Question Option leaves the current problem on screen and the next one follows the new options; a `ShellOption` marked `displayOnly: true` redraws the current problem at once from its saved seed (`_seed`). Changing the level, the tab, or a top-tier option still gives a fresh problem.

### `reformatQuestion` — implementation pattern

Store raw parameters on the question at generation time:

```ts
return {
  kind: "simple",
  // ...
  _rawValues: rv,    // store raw params so reformatQuestion can recompute display
  key: `...`,
  difficulty: level,
} as unknown as AnyQuestion;
```

Provide `reformatQuestion` alongside the generators:

```ts
const reformatQuestion = (q: AnyQuestion, qo: QOSnapshot): AnyQuestion | null => {
  const rv = (q as any)._rawValues as RawValues | undefined;
  if (!rv) return null;
  const built = buildDisplay(rv, qo.dropdownValue === "fraction");
  return {
    ...q,
    displayLatex: built.displayLatex,
    answerLatex: built.answerLatex,
    working: built.working,
  } as unknown as AnyQuestion;
};
```

Pass it to `<ToolShell reformatQuestion={reformatQuestion} />`.

**Reference implementation:** `src/tools/Algebra/CompletingTheSquare.tsx`

---

## Helper reference

| Helper | Signature | Purpose |
|--------|-----------|---------|
| `randInt(min, max)` | `(min: number, max: number) => number` | Random integer, inclusive both ends |
| `pick(arr)` | `<T>(arr: T[]) => T` | Random element from array |
| `step(latex, plain?)` | `(latex: string \| string[], plain?: string) => WorkingStep` | Pure KaTeX working step; array = reveal-in-parts fragments |
| `mStep(label, latex, unit?)` | `(label: string, latex: string \| string[], unit?: string) => WorkingStep` | Prose label + KaTeX; array = fragments; label may carry `[[skill-id\|term]]` |
| `tStep(text)` | `(text: string) => WorkingStep` | Plain-text only step |
| `stripSkillMarkers(s)` | `(s: string) => string` | Replaces every `[[skill-id\|term]]` marker with its bare term |
| `formatNumber(n)` / `texNumber(n)` | `(n: number \| string) => string` | Thousands commas from 1,000 up (`1,234`); `texNumber` uses `{,}` for KaTeX. Never rounds |
| `fracStr(n, d)` | `(n: number \| string, d: number \| string) => string` | `"$\\frac{n}{d}$"` for InlineMath |
| `mStr(x)` | `(x: number \| string) => string` | `"$x$"` — wraps value for InlineMath |
| `pickActive(values, opts)` | `(values: Record<string, boolean>, options: {value: string}[]) => string` | Random active multiSelect value |
| `fmt(n, dp?)` | `(n: number, dp?: number) => string` | Number → string, trailing zeros stripped, default 2dp |
| `ansEq(answer)` | `(answer: string) => string` | Prepends `"= "` unless answer already contains `=` |
| `normalizeMultiSelect(ms)` | `<T>(ms?: T \| T[] \| null) => T[]` | Normalises single/array multiSelect config |
| `sortByDifficulty(questions)` | `<Q extends {key: string}>(questions: Q[]) => Q[]` | Stable ascending sort by each question's `_difficultyScore` (the calibrated band); no-op if none is set. Used inside `ToolShell`'s worksheet generation — never call it in a tool file |
| `buildQuotaOverrides(groups, baseValues, numQuestions)` | `(groups: {key: string; balanced?: boolean; options: {value: string}[]}[], baseValues: Record<string, boolean>, numQuestions: number) => Record<string, boolean>[]` | One `multiSelectValues` override per worksheet slot, keeping a `balanced` group's active options roughly (not exactly) evenly split; other groups pass through untouched. Called automatically by `ToolShell`'s worksheet generation — never call it in a tool file |

### Working step rendering — how each type appears

| Call | Renders as |
|------|-----------|
| `step("16 \\div 4 = 4")` | Centred KaTeX — no label |
| `mStep("Divide by 4:", "16 \\div 4 = 4")` | Left-aligned prose label, centred KaTeX below |
| `mStep("Answer:", "12", "kg")` | Same as above, plain-text unit after KaTeX |
| `tStep("Simplify the fraction.")` | Plain text only — zero KaTeX |

**Pick `mStep` by default.** Use `step` when a label would be redundant (e.g. a chain of equals steps). Use `tStep` only for genuinely numberless prose (rare).

**Never use `\text{}` inside `step()` or `mStep()`.** Never put prose words inside `$...$`.

### Working-step fragments — live modelling (author these by default)

`step()` and `mStep()` accept the latex as a **`string[]` of ordered fragments**. In the step-by-step Worked Example (live for every tool), the line then reveals one fragment per press — *live modelling*: the line is written in the order a teacher would write it on the board, and the pause between presses is the class's thinking time. Everywhere else (show-all mode, print, worksheets, tests) the fragments join into one normal KaTeX line, so fragments can never diverge from the printed working. All fragments are laid out immediately (hidden ones at opacity 0), so the line never reflows and ← exactly retraces →.

```ts
mStep("Convert the first fraction:", ["\\dfrac{1}{11}", "= \\dfrac{1 \\times 13}{11 \\times 13}", "= \\dfrac{13}{143}"])
```

**The board-writing rule:** a fragment is the next *mark a teacher would write* — a whole decision (an operator with its operand, a complete `= …` link), never a lone token. Fragment any line containing two or more written moves; 2–4 fragments per step is the norm.

| Line shape | Fragmentation |
|---|---|
| Apply an operation | `start` → `× operation applied` → `= result` |
| Equals chain | one fragment per `= …` link |
| Substitution | expression → expression with values → `= result` |
| Single fact (`LCM = 143`) | no fragments — arrives whole |

Each fragment must be valid KaTeX **on its own** (the smoke tests render them individually).

### Skill links — `[[skill-id|term]]` drill-downs

A prose label (`mStep` label or `tStep` text) may mark a term as a drill-down into the **skill library**:

```ts
mStep(`Find the common denominator — the [[lcm|LCM]] of ${d1} and ${d2}:`, `${cl}`)
```

The dotted-underline, clickable rendering only appears when Developing-tools mode is on (`skillLinks` on the Worked Example view; `onOpenSkill` is `undefined` otherwise) — clicking it plays the skill's slides in an overlay, then returns to the same step. With Developing-tools mode off (the ordinary case), the step-by-step Worked Example still works, but every marker renders as bare term text, same as classic mode — `SkillLabel` degrades silently with no `onOpenSkill` (see `src/shared/skills/index.tsx`). In classic mode (and in `plain`/print) only the bare term shows too — the helpers strip markers from `plain` automatically. The smoke tests fail on any marker whose id isn't in the skill registry, so a dangling link can't ship.

**When to link:** whenever a step's label names a prerequisite skill the tool *uses* but doesn't *teach* (LCM, equivalent fractions, factor pairs…). If the skill doesn't exist yet, create it (see "Skill library" below) in the same commit.

---

## Core representations — the visual vocabulary

Every taught visual on the site (skill slides, Teach decks, and eventually whiteboard visualisers) is built from **eight core representations**. Consistency is the point: a student who met the bar model in fractions meets the *same* bar in ratio — the representation library is the site's visual scheme of work.

| Representation | Carries | Scene family (TeachingDeck) |
|---|---|---|
| **Bar model** | fractions, ratio, proportion, percentages | `split` · `combine` · `equivalents` |
| **Number line** | integers, rounding, inequalities, sequences, multiples | `multiples` |
| **Area model** | multiplication, expanding brackets, completing the square | *(none yet)* |
| **Algebra tiles** | collecting terms, solving equations, factorising | *(manipulative exists; no scenes yet)* |
| **Negative counters** | directed numbers, integer add/sub, zero pairs | *(shared component + sandbox built; no Teach scenes yet)* |
| **Prime factor tiles** | HCF/LCM, factors, prime decomposition | `factorTree` · `primeVenn` |
| **Place value table** | place value itself — ×/÷ powers of 10, adding/subtracting decimals | *(question/working-step representation; no Teach scene yet)* |
| **Ratio table** | proportional scaling — speed/distance/time, currency conversion, recipe scaling | *(working-step representation; no Teach scene yet)* |

**Representations evolve, and sometimes pair.** The vocabulary is a progression — double number line → ratio table; negative counters → bar model with negatives → number line — so a topic's pictures should be chosen as the *next step* from what the student already knows, not in isolation. A question may also need **two at once** (e.g. a ratio table beside the grapher for gradients). Plan and status: `docs/PROJECTS.md` → "Representation progressions & composites".

**The rule: before authoring any new visual, pick one of these.** A brand-new representation needs a reason. New scenes extend an existing family in `TeachingDeck.tsx` (grouped by family comments in the `TeachScene` union) and follow the standing scene contract: beat count derived from the scene, reserve space for everything (opacity, not mounting), animate only opacity/transform.

**Ratio table** (`src/shared/ratioTable.ts` + `src/shared/components/RatioTable.tsx`) is a *working-step* representation rather than a Teach-deck scene, rendered as **one continuous bordered `<table>`** — matching how a ratio table is conventionally drawn on paper: **quantities as columns** (the header row, e.g. "Miles", "Hours"), **each scale-step as a row going down**, rows sharing borders directly (no gap/divider row between them). The scale factor between two adjacent value-rows sits **outside** the table as a curved arrow (bulging away from the table, mirrored left/right via CSS rather than two authored paths) running from the vertical **centre** of one row to the centre of the next, with the factor labelled beside it — never inside a table cell. That centre-to-centre position is measured in real pixels (refs + `getBoundingClientRect` on each `<tr>`, in a plain — not layout — `useEffect` so it runs after `MathRenderer`'s own child effect has painted the KaTeX content), not CSS percentages: a percentage-height div inside a `<td>` does not reliably resolve against the cell's height in this rendering engine (found to collapse to 0, stacking every arrow at the same spot) — the same measurement approach `WorkedExampleSteps.tsx`'s `FitWidth` already uses elsewhere in this codebase. A single combined scale factor is **never shown as one fraction or decimal multiply** (e.g. `×2/3`) — author it via `rStep(label, headers, rows, operations)` as a chain of whole-number steps instead: `rows` is one array of values per step (`rows[step][quantityIndex]`, not one array per quantity) and `operations` (length `rows.length − 1`) is the whole-number `×n`/`÷n` between each consecutive step, so a fractional factor becomes an extra "unit" row in between (e.g. `100, 75` →(÷5)→ `20, 15` →(×4)→ `80, 60`, never a single `×4/5`). Pass the shared `ratioTableStepRenderer` as the tool's `stepRenderer` — it returns `null` for every non-ratio-table step, so `mStep`/`tStep`/`step` still render through ToolShell's normal path. There is no fragment-level reveal inside a single ratio table — a multi-step scale is just more rows/operations in one call. Reference implementation: `src/tools/Proportion/SpeedDistanceTime.tsx` (`buildScaleSteps` decomposes ÷qq then ×pp, or the reverse, only when both factors are non-trivial — i.e. only at Level 3; Levels 1–2 already have one factor equal to 1, so the chain collapses back to a single step).

**Place value table** (`src/shared/placeValue.ts` + `src/shared/components/PlaceValueTable.tsx`, extracted from Powers of 10) is a fixed set of columns (e.g. `PV_COLS_DECIMAL` = H T O · t h th) with the decimal point drawn on the right edge of the Ones column, so digits in one column always share a place value. Data is `PlaceValueTableData` (columns, `onesIndex`, rows of cells / banners); `pvCells(numStr, columns, onesIndex)` places a decimal string into columns. Cells can carry a tone (`zero` = blue placeholder zero, `answer`), a struck digit, and a small `above` digit (a carry, or the new value after an exchange); `highlightCol` tints the current column; when rows carry operator labels (+ / − / =) the gutter is mirrored on the right so the table body itself is centred; optional `colWidth` (px) fixes the column width so a table with fewer columns is narrower rather than stretched. `PlaceValueSvg` (+ `pvSvgAspect(data, hasTitle, rowH?)` for the question's `_aspect`, `pvSvgRowHForAspect` to stretch rows to a wanted aspect, `fill` for print) draws the same data as an SVG for worksheet cells — tag it `idx` (question) and a hidden `answerIdx` twin and print with `handleDiagramPrint`. For worked examples author steps with `pvStep(caption, table)` (one table snapshot per step) and pass `placeValueStepRenderer` as `stepRenderer` and `placeValueStepVisual` as `stepVisualRenderer` (each returns `null` for any other step) — the cascade then shows one table updating in place beside the step captions instead of reprinting it per step. References: `src/tools/Number/PowersOfTen.tsx` (grid), `src/tools/Number/DecimalAddSub.tsx` (stepped carries/exchanges). Build column sets with `pvColumnSet(whole, dec)` (one canonical letters + words catalogue), offer `PV_WORD_HEADERS_VAR` so teachers can switch headings between letters and words (read live from `qo` — `pvDisplay(table, qo)` for scaffolds, `placeValueStepRenderer` does it for steps), use `PV_CELL_H` so the table never resizes between states, and `pvSlice` to show only the columns a question range needs. Cells can also carry `circle` (ring the deciding digit) and `badge` (filled value, e.g. a rank); non-place columns (Sign, Order) are just extra entries in `columns`. Reference for a comparison table: `src/tools/Number/ComparingOrderingNumbers.tsx`.

**Negative counters** (`src/shared/counters.ts` + `src/shared/components/Counters.tsx`): a **yellow counter is +1, a red counter is −1** (the same yellow and red as the algebra tiles' unit and negative tiles, `COUNTER_POS`/`COUNTER_NEG`), and one of each is a **zero pair**. Every counter is labelled **+1 / −1** so colour is never the only cue. Data is `CounterBoardData` (`rows` of `Counter {sign, state}`; `state` = `normal` · `paired` (part of a boxed zero pair) · `removed` (ghosted, taken away) · `new`); build with `ctr(pos, neg, state?)` / `zeroPairs(n)`, read with `netValue` / `pairCount`. Render with `CounterBoard` / `CounterDot`. **The representation table ("mat")** — `layout: "mat"`, built with `matBoard(pos, neg, { pairs?, collapsed?, footer? })`: a **+ row above a − row**, split from the labels by a vertical rule and from each other by a horizontal rule, counters aligned in columns so a + over a − is a zero pair (each pair boxed in a rounded blue frame, `PairBox` / `pairBoxStyle`) and what's left over is the answer; `collapsed` ghosts the pairs instead. It keeps everything in place for a class to read and count. For worked examples author steps with `cStep(caption, board)` (one board snapshot per step) and pass `countersStepRenderer` as `stepRenderer` and `countersStepVisual` as `stepVisualRenderer` — one board updating in place beside the captions, exactly like the place value table. The interactive sandbox is `src/tools/Interactive/NegativeCounters.tsx` (a **Free / Table** board switch — Table is the + / − representation table: drag counters into their own row and they snap into columns (dropping onto an occupied cell swaps), so a + over a − is a zero pair; drag from the tray, move / flip / take away, add zero pair, remove zero pairs, tidy, live value; a **"When +1 meets −1" setting** chooses whether a dropped counter *pairs up* with its opposite as a boxed zero pair (a + stacked over a −) or both *collapse* to nothing) — it uses the same `CounterDot`, so the sandbox and the question solutions look identical. The sandbox page deliberately mirrors the Algebra Tiles layout (header + burger menu, narrow panel, dot-grid canvas with floating hotbar, bottom summary bar) — keep the two in step when changing either. The bottom toolbar (Select / Grab / Pen / Eraser / Clear drawings / colours) is the shared `DrawHotbar` in `src/shared/components/BoardTools.tsx` — new sandboxes should reuse it (its `extra` prop adds tool-specific buttons). Next in the progression: signed bar model, then number line (see "Representation progressions" in `docs/PROJECTS.md`).

Prime factor tiles are **coloured squares keyed by the prime** (2 sky, 3 emerald, 5 amber, 7 purple, 11 pink — `tileColor` in TeachingDeck), so the same prime looks the same in a factor tree, a Venn region, and a factor list. Composites stay plain numbers; only primes become tiles.

---

## Lessons — ordered steps inside a tool

A **lesson** is an ordered run of steps inside one tool (`docs/GLOSSARY.md` §5c). It is the teacher's sequence: a Depth item to diagnose, a Whiteboard or Worked Example to practise, a Worksheet to set, a Depth item to extend.

- **Developing-tools gated.** Lessons only appear when Developing-tools mode is on (`ToolShell` wrapper, `useDevMode()`), the same as Teach. Structure and learnings: `docs/design/LESSONS.md`.
- **A lesson may cross tabs:** a step names its own `tool`; the lesson's `tool` is where the overview opens. A deck hand-off moves a running lesson to the next step of the same kind and tool.
- **Declare** lessons on the tool's default export: `<ToolShell lessons={LESSONS} … />` (see `src/tools/Number/IndicesLessons.ts`). The burger menu has one **Lessons…** item that opens a lessons page (`LessonsPage`, a card per lesson); lessons are never on the landing page.
- **A step is a shareable-link setup.** Its `kind` (`depth` · `whiteboard` · `example` · `worksheet`), `level`, `item`, `ms`, `vars`, `dd`, `n`, `cols` and `diff` are the same parameters the URL already carries (`src/shared/lessons.ts`). Give every Question Option the step needs, by value.
- **A lesson's deck is full-size and self-contained:** while a lesson step's deck plays, the page's title and tabs are hidden (`compact`) and its back button ("← Lesson") returns to the lesson overview; a deck opened by a lesson never shows the deck menu. The step bar is a small bottom-left pill that can be collapsed to a tab and hides itself while anything is full screen (`useFullscreenFlag`, `src/shared/fullscreenFlag.ts`).
- **A Depth step plays inside the deck surface** (`SlideDeck` with one `{kind:"depth"}` slide, "← Lesson" back, Next step ▸ at the end) with the page title/tabs/top padding hidden and the slide given more room (`LESSON_CHROME_REM`), so Teach and Depth steps share one size and chrome; the Depth tab itself is unchanged.
- **The deck is not the container.** A Teach deck (when it exists) is only one possible step; a lesson can be Depth → Worksheet with no deck.
- **Tests**: `src/tests/indicesLessons.test.ts` is the pattern. Every preset names a real sub-tool, level, option and Depth item on that sub-tool.
- **Opening a lesson shows its overview** (one card per step). A card opens that step; the step bar's title returns to the overview, and Finish on the last step does too. The close button leaves the lesson.
- A running lesson keeps `lesson=<id>&step=<n>` in the URL (`lesson=<id>` alone on the overview). Changing mode or options mid-step is allowed; the step bar stays until Finish or the close button.

---

## Skill library (`src/shared/skills/`)

Small, reusable slide sequences that each teach **one** core skill pedagogically, on hand-picked model-friendly exemplar numbers. They are the drill-downs behind `[[skill-id|term]]` markers, and are browsable at `/skills` (the **Skill Library** page — registered `enabled: false`, so it shows only with Developing-tools mode on).

```ts
interface SkillDef {
  id: string;           // kebab-case, referenced by [[id|term]] markers; variants use <base>-<method>
  title: string;        // variants of one skill share the SAME title — /skills groups on it
  method?: string;      // variant label when a skill has multiple methods, e.g. "From times tables"
  description: string;  // one sentence, shown on the Skill Library card
  category: string;     // landing-page strand name (Number, Algebra, …)
  slides: TeachingSlide[];   // same slide types as the Teach deck
}
```

**While the library is on the back bench** (`docs/BACKBENCH.md`) the `[[skill-id|term]]` markers render as plain text unless Developing-tools mode is on, and the smoke tests still fail on a marker whose id is not in `SKILLS`. The authoring rules (variants, adding a skill, exemplars, the existing skills) are kept in `docs/BACKBENCH.md` → "Authoring a skill" for when the library resumes. Two skills exist: `lcm` and `lcm-prime-factors`.

CI (`src/tests/skills.test.ts`) validates every skill: unique kebab-case ids, every KaTeX string renders, anim slides never supply more captions than beats.

---

## TOOL_CONFIG format

```ts
const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Displayed at top of page",
  tools: {

    subtool1: {
      name: "Button label",
      instruction: "Solve:",          // optional — shown above question in all modes

      variables: [],                  // toggle switches — prefer multiSelect instead
      dropdown: null,                 // single-select segmented buttons, or null
      multiSelect: {                  // default QO control — reach for this first
        key: "questionPool",
        label: "Question Types",
        options: [
          { value: "a", label: "Type A", defaultActive: true  },
          { value: "b", label: "Type B", defaultActive: true  },
          { value: "c", label: "Type C", defaultActive: false },
        ],
      },
      difficultySettings: null,       // null = same options at all levels
      levels: ["level1", "level2"],   // optional — omit for all three (see `levels` below)
      // purpose and levelLabels are written in <Tool>.about.ts (applyAbout), not here
    },

  },
};
```

### QO control types

| Control | When to use |
|---------|------------|
| `multiSelect` | **Default.** Pool of question types, multiple can be active. Use `pickActive(values, options)` in the generator. |
| `dropdown` | A single mutually-exclusive setting (e.g. method choice, display format). |
| `variables` | Independent on/off toggles. Use sparingly — prefer `multiSelect`. |

**The deciding test between `multiSelect` and `variables` is mutual exclusivity, not difficulty.**
A `multiSelect` pool is for any option set where exactly **one** member applies to a given
question — the generator draws one active option per question via `pickActive`, rendered as the
same row-of-cells UI either way. That covers pure variety (Units: mph vs km/h vs m/s) *and* an
ordinal difficulty ladder (easiest rung `defaultActive: true`; the worksheet's easy-to-hard order
comes from calibrating the tool, see below, never from the options) — difficulty-vs-variety doesn't
decide the control type. A `ToolVariable` (boolean toggle) is for a
property that's genuinely **independent** — switching it on doesn't replace anything, and if
several such toggles are on at once, **all of them apply to the same question simultaneously**
(rare, but real — e.g. "allow negative coefficients" and "allow non-integer constants" both true
on one question, stacking rather than choosing between them).

**Before converting a boolean into a multiSelect ladder, check combinability first.** If the
property can stack with a sibling property on one question, it must stay independent — either as
its own `ToolVariable`, or as its own separate multiSelect pool — never merged into the same pool
as something it can coexist with, since a pool only ever picks **one** of its options per
question. Model a genuinely ordinal, mutually-exclusive option set as one pool (easiest rung
`defaultActive: true`, harder rungs `false`) rather than a standalone toggle.

**Even a plain on/off property becomes a 2-option pool, not a boolean, once it's mutually
exclusive per question.** A boolean toggle only ever applies to the *whole worksheet* — "negative
coefficients" as `allowNegative: boolean` means every question can potentially get one, or none
ever do; there's no way for question 3 specifically to draw "non-negative" while question 9 draws
"negative". If that per-question distinction is what you actually want (e.g. a quadratic tool
where non-negative coefficients are the easier case), it's a 2-option `multiSelect` pool —
`{ value: "nonNegative" }` / `{ value: "negative" }` — exactly like a 3+
option ladder, just with two rungs. Expect this to come up often: **most existing boolean QO
options that gate a per-question property will turn into 2-option pools** once they're audited
against the mutual-exclusivity test, not just the ones that already had 3+ named states like SDT's
Times Tables.

**Question-option buttons are one look everywhere (`OptionGrid`, `src/shared/components/QOPopovers.tsx`).** Every pool and dropdown in a QO popover — ToolShell and DecisionShell alike — is drawn as well-spaced single buttons: four to a row when the (short) labels fit the popover width, three if not, otherwise two (a short last row is centred; any option with a `sub` line keeps two to a row). Keep each label short so the powers/groups of a pool sit on one row, and put any detail in the option's `sub` (a smaller line under the label) rather than a long label. A 2-option pool is just two buttons (the old None / Mixed / Exclusive cycle button is gone). A popover with more than four sections splits automatically into two columns with a thin grey divider (the Split QO layout; `defaults.qoColumns: 2` forces it, and the Decision popover does the same). DecisionShell options may also be `multi` (tick-any; see `ShellOption.multi`) and take `choices[].sub`. **A label that ends in an asterisk marks something beyond standard questioning** (off by default): the standard, inline and differentiated popovers then show "* beyond standard questioning" at the bottom automatically — end the label with `*`, nothing else to wire. A selector with a single option is never shown. A question's `key` must describe the question (never a random number), or the shared repeat check cannot stop a worksheet repeating a question.

**Rungs must be mutually exclusive, not overlapping caps, and any "harder" property must be
guaranteed, not just more likely.** An "up to 20" rung that silently includes every "up to 10"
value too doesn't read as strictly harder than the rung below it — give each rung its own disjoint
range (e.g. a scale factor drawn from 11-20, not 1-20) instead of a rising single-sided cap. Same
for a qualitative property like "the answer is a decimal": if the underlying generation only makes
a decimal *possible* (e.g. ~80% of draws), a chunk of that rung's questions render indistinguishably
from the easier rungs on a printed sheet — find the exact mathematical condition that produces the
property and reject/retry any draw that fails it (see `SpeedDistanceTime.tsx`'s
the decimals rung's draw in `SpeedDistanceTime.tsx` (`TABLES_TIER` / `decimalsMode`): `D` is only ever whole when the drawn speed is a multiple of the shape's
`pp`, so rejecting that one case guarantees every decimals-tier answer is a genuine decimal).
Reference: `DIFFICULTY_TIER` in `src/tools/Proportion/SpeedDistanceTime.tsx`.

**Peer pools.** Two options that are *peers* (Factorised / Expanded, Whole / Fractions, Numbers / Letters) are ordinary buttons like every other pool; keep labels short (detail goes in the info or the option's `sub`), and never offer a control with a single option. See `docs/design/LESSONS.md` §4.

**`exclusive: true` — a single-choice pool.** Set it on a `ToolMultiSelect` when its options are mutually exclusive settings, not a mixable pool (e.g. "labelled line" vs "every mark"): picking one option turns the others off (radio behaviour) and the generator's `pickActive` always sees exactly one. Use it instead of a `dropdown` when a level already uses its one dropdown slot, or when several such choices sit side by side. Give exactly one option `defaultActive: true`. Reference: the label / fill-in / plot pools in `src/tools/Number/Rounding.tsx`.

**`requires` on a multiSelect option — greyed out unless other options are on.** An option may list `requires: [clause, …]`; every clause must hold, a clause being an option `value` from any pool of the same sub-tool + level, or an array of values of which at least one is on (same shape as `DepthItem.needs`). While unmet the option is greyed, struck through and unclickable, with a "Needs × or ÷ and + or −" tooltip; the teacher's own tick is kept and returns when the requirement is met. The popover does this by itself; the *generator* must also ignore a blocked option: `pickActive(maskUnmetOptions(pools, resolveMultiSelectValues(pools, msv)), options)` (a pool is never emptied by the mask, so keep a fallback). Reference: Order of Operations' Level 1 Focus vs its Operations pool.

**`dropdown.workedExampleOnly`** — set this `true` only when the dropdown changes nothing but
the displayed working (a "Method" choice like Ratio Table vs Decimal, or FOIL vs Grid arrows) —
the question and answer are identical across every option. ToolShell then hides it from the
Worksheet mode QO popover (standard and differentiated), where it would have no visible effect,
while still showing it in Whiteboard and Worked Example mode. Never set it on a dropdown that
changes the question's numbers, structure, or answer (e.g. a method that also changes the
coefficient sizes) — those must stay visible in Worksheet mode.

**`ToolVariable` extras** — `worksheetOnly` (only offered in Worksheet mode), `info` (an ⓘ hover note next to the switch) and `capsColumns: n` (while on, worksheet columns are limited to n — on screen, in the Columns input and in print ctx — so the worksheet matches what prints). Reference: the "Grids on worksheet" switch in `src/tools/Number/DecimalAddSub.tsx`.

### `difficultySettings` — per-level QO overrides

```ts
difficultySettings: {
  level1: { variables: [], dropdown: null },
  level2: { variables: [INTEGER_C_VAR], dropdown: DISPLAY_DD },
  level3: { variables: [INTEGER_C_VAR, NEG_COEFF_VAR], dropdown: DISPLAY_DD },
}
```

Each level independently overrides `dropdown`, `variables`, and/or `multiSelect`. Omitted keys inherit the tool-level default.

### Calibrating a tool — the one way a worksheet is ordered easy to hard

There are no option weights. An option can't tell two questions from the same option apart, so once a tool is happy we **calibrate** it (`src/shared/calibration.ts`, pilot: `src/tools/Number/OrderOfOperations.tsx`; every calibrated tool has a committed `<Tool>.calibration.ts` and a report in `docs/calibration/`):

1. **Score the question.** Each generated question carries `_rawDifficulty` (cost computed from the question itself — the steps of its working, the size of its numbers, its structure — never from the option that made it), `_category` (a coarse fingerprint for the report) and `_difficultyScore: bandFromTable(BANDS, subTool, level, raw)`. `largestNumber(text)` (shared) helps with "size of the numbers". Put the rubric in a `rank(...)` function beside the generator and explain it in a comment.
2. **Say so.** Set `calibrated: true` on the `ToolConfig` (it makes the Worksheet show the **Smart Progressor** switch, and the tool's test checks it).
3. **Test and sample.** The tool's test file calls `calibrationTests({ name, config, generate, bands, tableFile, reportFile, regenerate, rubric })` from `src/tests/calibrationKit.ts` (copy `src/tests/decimalAddSubDifficulty.test.ts`): it checks the table, that every question carries its score and band, and that a fresh 1000+ sample uses the bands sensibly. `CALIBRATE=1 npx vitest run <test file>` samples 1500 questions per **sub-tool × level** across *random combinations of all its options* (`randomSetup`), cuts each cell into eight bands (`quantileCuts`) and rewrites `<Tool>.calibration.ts` and the report (run it twice the first time: the first run writes the table the other tests then read).
4. **Use — generate extra, then pick.** For a calibrated tool the standard Worksheet tab generates a pool of candidates (8× the question count, 60–400) and `spreadByBand` picks n spread as evenly as possible across the bands the ticked options can reach (a short band hands its slots on), sorted easy→hard, same-band questions mingling. Wired once in ToolShell (`calibratedBlock`); the Smart Progressor switch turns it off. Standard and differentiated worksheets only — the advanced builder never comes through here. Recalibrate after any generator change (the test fails when a fresh sample no longer fits the table).

A level that has only a few kinds of question (one fixed shape) gets few distinct scores; that is honest, and the test allows for it.

### Balanced pools — a variety pool kept even on a worksheet

Set `balanced: true` on a `ToolMultiSelect` (not on difficulty) when a short sheet shouldn't be left to chance: a Speed / Distance / Time mix, the kinds of zero in Rounding. `pickActive`'s per-question random draw can land 9/4/2 over 15 questions; `ToolShell` (`buildQuotaOverrides`, internal) builds one `multiSelectValues` override per slot, drawn independently at random but retried until every active option's count is within ±1 of its fair share (6/5/4 is a normal outcome). Pools without the flag keep varying randomly. It applies to calibrated and uncalibrated tools alike on the standard Worksheet tab, and follows the same **Smart Progressor** switch (off = plain random draws). Nothing else to wire.

---

## Question kinds — required fields

### `SimpleQuestion`
```ts
{
  kind: "simple",
  display: "3 + 4",           // plain-text fallback
  displayLatex: "3 + 4",      // KaTeX expression — use for all maths content
  answer: "7",
  answerLatex: "7",
  answerSuffix: "kg",         // optional plain-text unit
  working: [ step("3 + 4 = 7") ],
  key: `tool-level-a-b-${id}`,
  difficulty: level,
}
```

### `WordedQuestion`
```ts
{
  kind: "worded",
  lines: [
    `A bag weighs ${mStr(16)} kg.`,
    `Find ${fracStr(3, 4)} of it.`,
    "How many kg?",
  ],
  answer: "12 kg",
  answerLatex: "12",
  answerSuffix: "kg",
  working: [
    mStep("Divide by denominator:", "16 \\div 4 = 4"),
    mStep("Multiply by numerator:", "4 \\times 3 = 12"),
    mStep("Answer:", "12", "kg"),
  ],
  key: `tool-level-d-k-n-${id}`,
  difficulty: level,
}
```

---

## Diagram tools — custom renderers and SVG printing

For SVG-based tools (angle geometry, number lines, etc.).

**Reference implementations:** `src/tools/Geometry/AnglesInQuadrilaterals.tsx` (the print pattern below), `src/tools/Geometry/AnglesInParallelLines.tsx` (a diagram tool that prints the reasoning behind each answer, `_printAnswer`) and `src/tools/Geometry/BasicAngleFacts.tsx`. All diagram tools print through the shared `handleDiagramPrint`; the one hand-rolled print handler left is Recipes' (see `docs/TIDY_UP.md`), whose "Needed / You Have" tables are not pictures.

### Storing diagram data

```ts
return {
  kind: "simple",
  display: "find x",
  answer: `x = ${xVal}°`,
  working: [...],
  key: `tool-level-${id}`,
  difficulty: level,
  _diagram: diagramData,
} as unknown as AnyQuestion;
// Retrieve: const d = (q as any)._diagram as DiagramData | undefined;
```

### `questionRenderer` — compact context table

| `compact` value | Context | Typical maxWidth |
|---|---|---|
| `true` | Worksheet cell | ~180px |
| `undefined` | Regular whiteboard panel (480px fixed) | ~340px |
| `false` | Worked example or fullscreen whiteboard | ~500px |

```tsx
const questionRenderer = (q, showAnswer, compact, idx, _qo) => {
  const d = (q as any)._diagram as DiagramData | undefined;
  if (!d) return null;
  const maxW = compact === true ? 180 : compact === undefined ? 340 : 500;
  return (
    <div style={{ width: "100%", maxWidth: maxW, margin: "0 auto" }}>
      <MySVGDiagram d={d} showAnswer={showAnswer} qIndex={idx} />
    </div>
  );
};
```

### SVG element requirements

```tsx
<svg
  viewBox="0 0 500 500"
  style={{ display: "block", width: "100%", height: "auto" }}
  preserveAspectRatio="xMidYMid meet"
  {...(qIndex !== undefined ? { "data-q-index": qIndex } : {})}
>
```

- Never use a fixed pixel height — causes overflow in the whiteboard panel
- `data-q-index` is required for the print handler to locate the SVG in the DOM

### Printing SVG worksheets — use the shared `handleDiagramPrint`

**Do not hand-write a `customPrintHandler` with a fixed grid.** Pass the shared
`handleDiagramPrint` (exported from `"../../shared"`) straight to ToolShell:

```ts
import { ToolShell, handleDiagramPrint } from "../../shared";

<ToolShell
  questionRenderer={questionRenderer}
  customPrintHandler={handleDiagramPrint}
  defaults={{ numColumns: 3, maxColumns: 4, hideFontControls: true }}
/>
```

How it works: a diagram has no measured height — only an aspect ratio — so
`handleDiagramPrint` *derives* a synthetic cell height from the column width and
feeds it to the same unit-tested `computeWorksheetLayout` engine the text path
uses. The fed height is capped at a **density floor** (~40 mm) so a page packs
~5 rows rather than a few oversized squares; at
render time each cell is grown back toward the full column width, but never past
it, so few-question sheets still get big diagrams without floating in whitespace.
Everything is computed app-side and written as static HTML — no probe, no
measurement round-trip.

This means SVG worksheets get, for free and with no per-tool code:
- **Variable columns = density/size** — more columns → more per row (denser),
  fewer columns → wider cells and bigger diagrams. Expose it by *not* setting
  `fixedColumns` (use `maxColumns` to cap, default columns via `numColumns`).
- **Sections** (advanced worksheets) — per-section columns, headers, dividers.
- **Differentiated** three-column layout and **arbitrary question counts** that
  flow across pages.

There is no fixed question preset, but the density holds: 15 questions in 3
columns fit one page, while pages with only a few diagrams render them larger.

**Requirements on the tool:** the worksheet `questionRenderer` must emit an
`<svg data-q-index={idx}>` (see SVG element requirements above) so the handler can
clone it. For non-square diagrams, store `_aspect` (= viewBoxWidth ÷ viewBoxHeight)
on the question; it defaults to 1. A question may also carry `_printAnswer` (one line per `\n`) when the printed answer should say more than `answer`: it replaces `answer` in the answer cells.

**Reference:** `src/tools/Geometry/AnglesInQuadrilaterals.tsx`.

---

## KaTeX rendering — the rules

| Content | Correct approach |
|---------|----------------|
| Number or operator in prose | `mStr(n)` — e.g. `"A bag weighs " + mStr(16) + " kg."` |
| Fraction in prose | `fracStr(n, d)` |
| Ratio in prose | `mStr("3:4")` — no spaces around colon |
| Pure maths working step | `step("16 \\div 4 = 4")` |
| Prose label + maths result | `mStep("Divide:", "16 \\div 4 = 4")` |
| Genuinely numberless prose | `tStep("Simplify the fraction.")` |
| Question display | `displayLatex: "..."` on SimpleQuestion |

### KaTeX gotchas

- `verticalAlign` must be `"baseline"` — `"middle"` drops spans below the baseline
- `displayMode` is always `false` — wrap in a `<div>` for block display
- Plain-text answers: never wrap in `katexSpan()` in the print handler — `£`, `<`, `>` crash KaTeX silently
- In print CSS: set `font-size` on `.katex-render .katex` (inner span), not on `.katex-render` — the wrapper causes KaTeX to compound the scaling
- **Thousands separators**: plain `,` inside KaTeX math mode adds a thin space — `2,400` renders as "2, 400". Use `{,}`: `2{,}400`. Use the shared `texNumber(n)` (and `formatNumber(n)` for prose): a comma from 1,000 up, negatives and every decimal kept.
- **`\text{}` in steps**: never use `\text{}` inside `step()` or `mStep()` — use `tStep()` for prose

---

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

CI also runs `npm test` (Vitest, `src/tests/generators.test.ts`). The suite discovers every tool exporting `__test = { TOOL_CONFIG, generateQuestion }` and, for each sub-tool × level with default QO settings, generates 40 questions asserting: no throw, unique non-empty keys, and every KaTeX string (`displayLatex`, `answerLatex`, working-step latex, **each fragment individually**, `$...$` segments in worded lines) renders under `katex.renderToString` with `throwOnError`. It also asserts every `[[skill-id|term]]` marker resolves to a registered skill and that markers never leak into `plain`. This catches `£`/`<` in KaTeX, malformed latex, key collisions and dangling skill links at CI time. **Every new or migrated tool must keep its `__test` export.** Restrict levels with `levels: ["level1", "level2"]` when the tool offers fewer than three. It also fails any `step()` / `mStep()` whose KaTeX contains `\text{}` (two older tools are allow-listed in the test until their review).

`src/tests/skills.test.ts` separately validates every skill in the skill library (see "Skill library" section).

`src/tests/organisation.test.ts` is the **drift-check**: it guards the shell-status bookkeeping (see "How to migrate an old tool") — every tool categorised, no migrated tool left in the backlog, every ToolShell tool covered by `__test`, every tool file registered. It reads tool source text, so it needs no per-tool wiring; it just fails when the docs' lists stop matching the code.

---

## PDF print — edge cases

- `totalPages`, `printMode`, and any `var` referenced inside a function declaration must be declared in the injected script's **outer scope** — declaring them inside `buildPage` causes "not defined" at runtime
- Params appearing only as `${...}` in the HTML string are invisible to TypeScript — use distinct names (e.g. `pMode` not `printMode`) and add `void (param as unknown)` suppressions before the template literal
- If a tool has only worded questions, remove `"simple"` and `"frac"` branches from `questionToHtml` — TS2367 otherwise
- For SVG tools use `handleDiagramPrint` (via `customPrintHandler`) — the text `handlePrint` has no SVG support

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
| Teacher Tools | `src/tools/TeacherTools/` | violet → purple |
| Interactive Tools | `src/tools/Interactive/` | lime → green |
| Binary & Number Bases (Computer Science procedural generators) | `src/tools/Binary/` | Computer Science colours (slate) |
| Computer Science | `src/tools/ComputerScience/` | slate → slate |

---

## Reference implementations — which file to look at

| Pattern | Reference file |
|---------|---------------|
| Standard v2.3 tool (simple questions) | `src/tools/Algebra/CompletingTheSquare.tsx` |
| Standard v2.3 tool (simple questions, ratio simplification) | `src/tools/Proportion/SimplifyingRatiosTool.tsx` |
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
