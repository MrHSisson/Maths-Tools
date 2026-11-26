# Maths Tools — instructions for coding agents (Codex, Claude Code)

This file is read automatically by Codex. **`CLAUDE.md` is the rulebook for everyone** (conventions, the Rules checklist, how to build a tool, the index to `docs/reference/`): read it before you change anything and follow it exactly as you would if you were Claude Code. **This file is the workflow**: how two agents share the repo, and how a session starts and ends (the Handoff note, the record in the repo, the dashboard and the planner, the dashboard notes API, kickoffs). Both agents read both files.

## Who is working

Harry runs more than one agent at once (Claude Code and Codex), each in its own session on its own branch. Both follow the same rules, update the same three places (repo, dashboard, planner) and are held to the same bar before merging. The difference is only who is working on what at the time, so say what you are in the first message and keep to it.

## Setup and checks (every session)

```bash
npm install                      # a fresh container has no node_modules; without it tsc reports thousands of false errors
npm run build                    # zero TypeScript errors expected
npm test                         # Vitest; generator smoke tests, drift checks, docs checks
npm run lint                     # ESLint, React hooks rules only
npm run facts                    # after adding or changing a tool or the registry; commit the JSON it writes
npm run smoke:shell              # after any change under src/shared/ (needs Playwright; narrow with SMOKE_TOOLS=/rounding)
npm run deck -- check <id> --layout   # after building or editing a deck (content checks, then every slide measured; needs Playwright)
npm run deck -- looks <script>        # BEFORE building a deck: the look card (one slide of each kind, every state); Harry says yes first
npm run deck -- review <id>           # AFTER building: contact sheets of every slide with all clicks revealed; look at every one
```

**Which tests CI runs.** Type check, build and lint always run. Tests run only for the areas the changed files touch, shared out over four runners by how long each file takes (`scripts/testShards.mjs`, from `scripts/testTimes.json`; refresh it with `npm run test:times` after adding or changing big tests, and split a test file that is much longer than the rest, because one file is the least a runner can take); the browser smoke check runs when anything but docs or decks changed. The areas: Critical Path (`cpa`), Network Flows (`flow`), the small graph topics (`graphs`: MST, TSP, Route Inspection), mechanics (`mechanics`: Dimensional Analysis and the mechanics diagrams), the checks that span the Decision shell (`decision`), the checks that run over every tool (`cross`: generators, seeded replay, recent questions…), each maths tool's own tests (`tools`), decks and the deck API (`decks`), Computer Science (`cs`) and docs (`docs`: docs, patch notes and the checks that read every tool's source). A change to one Decision topic runs that topic, `decision`, `cross` and `docs`; a change to the Decision shell itself runs every Decision topic; a mechanics change runs only the mechanics tests plus those. When a change touches only tool files (a tool or its `.about.ts`) or one Decision topic's files (`TOPIC_TOOLS` in `scripts/testAreas.mjs`, which says which tools each topic can affect; the graph topics also use two flow files), the `cross` checks run for just those tools (CI sets `TOOL_FILES`, which `src/tests/toolFilter.ts` reads; set it yourself to run them for one tool: `TOOL_FILES=src/tools/Number/Indices.tsx npx vitest run src/tests/generators.test.ts`); any other change that needs them (shared code, a helper in a tool folder, a changed cross-tool test) runs them for every tool. A pull request is compared with its base branch and a push to `main` with the commit before it, so `main` does not re-run what a pull request already passed. A nightly run (02:17 UTC) and a manual run (Actions → CI → Run workflow, "full" ticked) run everything. The plain list of which test files and which paths belong to which area is `scripts/testAreas.mjs` (a test fails if a test file is in no area, and checks the routing); a path it does not know, or shared code, the registry or config, runs everything. To see what your branch would run: `node scripts/selectTests.mjs origin/main`. Run an area locally with `npx vitest run <files>` using that list. A new test file needs no wiring (the default area is "tools"); add its name to a pattern in `scripts/testAreas.mjs` if it belongs to a Decision topic, mechanics, decks, CS, docs or the cross-tool checks, and add a path rule if a new group of source files belongs to one area.

**Tests must not fail by chance.** A test that asserts a statistic over random draws ("at most 3% bad", "spread over the bands") wraps its draws in `withSeededRandom(seed, …)` (`src/tests/seededRandom.ts`) so it is a fixed regression sample; `vite.config.ts` gives every test 60 s (CI has two busy cores) and retries a failing test twice on CI only. A red CI that passes on a rerun is a bug to fix, not to rerun.

**A test or generator that fails now and then: measure, then follow the rule (decided 2026-11-20).** Find how often the generator gives up and returns its fall-back, or throws: count over about 20,000 draws per option setting (`src/tests/fallbackRates.test.ts`, run with `FALLBACK_RATES=1`). **Under 1 in 100: draw again.** The shell does this for every tool (`drawAgain` in `makeUniqueQ`): a generator that throws, or returns its fixed fall-back marked `_fallback: true` (`withExtras(q, { _fallback: true })`), is asked up to three more times; only then is the fall-back kept or the error thrown, so a real fault is still named. A generator needs no other change, and the test is seeded (see above). **1 in 100 or more: an authored fall-back.** Replace the single hard-coded fall-back with a bank of fixed, checked questions of the kind asked (or the inputs for them, run through the normal builder so the working is generated), drawn when drawing again fails; every entry is tested against the same rules as a generated question; never an error shown to a teacher. **Failing most of the time: a very large authored set (100 or more questions that all work, a random group drawn from it) or a generator built so every draw passes** (as the Critical Path networks now are). Never change a generator that is under 1 in 100 beyond the redraw. The authored-bank mechanism is built when the first generator needs it, not before.

A session is not finished until build, tests and lint pass. Prefer cheap checks (tsc, tests, DOM assertions) to reading screenshots back; take a screenshot only for real layout judgement. Check phone, tablet and laptop sizes for anything visual (see `CLAUDE.md`).

## Branches and merging

- **One fresh branch per session, from an up-to-date `main`.** Never push to `main`, never reuse or stack onto an old feature branch, never rewrite history on another agent's branch.
- **Small chunks, merged early.** A big build is several small merges, not one long branch. Each merge leaves `main` working, but it need not be a finished tool. The usual layers, in order: (1) a shared piece with its test; (2) the tool behind `enabled: false` or Developing-tools mode; (3) deck content (after the code it needs is on `main`: see "Deck data format"); (4) the switch that makes it live. A chunk is ready when build, tests and lint pass and its docs are in; merge it as soon as it is green (when Harry asks for the pull request), and start the next chunk from the new `main` on a new branch. If a chunk cannot be finished in a session, split it so that what is done can merge. Kickoffs (below) ask for one chunk, never "the whole pathway".
- **Parallel sessions: one worktree and branch each, and the Handoff note is the claim list.** Each Claude chat is its own container; on one machine give every Codex or local session its own worktree (`git worktree add ../mt-<name> -b <branch> origin/main`) so two never share a working folder. Before starting, read the Handoff note and claim the files, tool or pathway you will touch; two sessions never hold the same area. A long-running chunk that touches a shared file (`src/registry.ts`, `src/shared/index.ts`) merges that edit first, in its own small chunk.
- **Anyone can work anywhere, but one agent per area at a time.** Neither agent owns files or tools. Before starting, read the planner note **Maths Tools — Handoff** and add a block for your branch (agent, branch, goal, the files, tool or pathway you are touching, state). If an unmerged block already covers your area, do not start: tell Harry or wait. At the end, update your block (state, done, deliberately not done, next, blockers); delete it once merged, since the Build Log and `docs/PATCH_NOTES.md` keep the permanent record. If the planner is unreachable, say so and put the same facts at the top of your patch-notes entry.
- **Shared files are the usual collision points**: `src/registry.ts`, `src/shared/index.ts`, `docs/TASKS.md`, `docs/FEATURES.md`, `package-lock.json`. Edit them minimally and add, never reformat.
- **Generated files** (`src/generated/toolFacts.json`, `src/generated/adminDocs.json`, `docs/PATCH_NOTES.md`) are never merged or edited by hand. `npm install` sets a git merge rule (`.gitattributes`, `scripts/gitSetup.mjs`) that keeps your copy when both sides changed one, so there is no conflict to resolve: after any merge run `npm run facts` and commit what it writes. (If git does stop on one, take either side and run `npm run facts`.)
- **Patch notes are one file per session**: add `docs/patch-notes/YYYY-MM-DD-<slug>.md` (first line `Strand: Maths` or `Strand: Computer Science`, a blank line, then the entry ending with `Agent:` and `Notes:` lines). `docs/PATCH_NOTES.md` is built from them by `npm run facts` (a test fails if it is stale), so two sessions never edit the same file.
- **Merge order:** whichever branch is finished first merges first. The second merges `main` into its own branch (a merge commit, resolved by hand, never with a broad script), runs install, build, tests, lint and `npm run facts`, then merges.
- **Decks Harry edits (shared editing, since 2026-11-01).** Harry and Claude can edit the same deck: `npm run deck -- pull <id>` first (it records the version your change starts from in `.deck-base/`, git-ignored), change the JSON by slide or element id, `npm run deck -- push <id>` (the server merges it into the stored deck; if both changed the very same thing Harry's version wins and the push lists the clashes). The push refuses to run against a deployment that cannot merge yet, and `--replace-whole` is the deliberate whole-deck overwrite (it only skips the guards: with a base file the push still merges, and the stored slide order always wins, so to reorder slides delete `.deck-base/<id>.json` first, then push with `--replace-whole` and read the shared copy back). Details in `docs/reference/decks-building.md` ("Sharing one deck between Harry and Claude") and `docs/design/DECK_BUILD_CHECKLIST.md` (4a). The live copy is the master and `src/decks/data` is its snapshot: `check <id> --live` checks the live copy, `backup` writes live copies into the repo (commit them), and `publish` publishes the live copy then backs it up.
- **Pushing a deck so Harry can see it.** A brand-new deck has no shared copy, so `npm run deck -- push <id>` creates it with no flag (it says so; `pull` returns 404 first). In a cloud session the **Auto** permission mode's safety classifier blocks writes to the shared deck service and edits to permission settings, whatever Harry's allow rules say. `.claude/settings.json` (committed 2026-11-20) allows the routine deck commands (`pull`, `push`, `check`, `list`, `backup`, `verify`, `review`, `looks`, `diff`, `sheet`, `build`, `new`, `preflight`, `builders`, `categories`) and asks before `publish`, `unpublish`, `delete`, `file` and `push --replace-whole`; whether it silences the prompts in Accept edits mode is to be confirmed by Harry. If a push is denied, do not retry or look for another route: tell Harry to switch the session to **Accept edits** (he then approves the prompt) or to run the push himself, then carry on. The build now rejects what the server would (for example an upper-case question id) before the push.
- **Deck data format: merge the code before the content.** The live server validates every deck question with the code on `main`, so a deck that uses a new shape or field (`api/_rectilinear.ts`, deck validators) is refused until that code is merged; a branch preview is behind the Vercel login. Put the code that changes the data format in its own small merge, then push the deck content. See `docs/TASKS.md` ("Decks: see and push deck changes before they are merged") for the plan to make previews pushable. **Since 2026-11-20 the server keeps what only newer code understands** (an unfamiliar question format or rectilinear shape or version), so a push of such content is accepted, prints what it kept, and the site shows "This needs a newer version of the site" until the code is merged; it still refuses anything else malformed. Prefer merging the format code first, but it is no longer blocking.
- **Do not open a pull request unless Harry asks.** Commit and push to your own branch. **Merging is Harry's decision each time** (no auto-merge, no merge queue): when a branch is ready, say so plainly, with what passed, what is not done, and anything that should be deployed or checked after the merge, and let Harry decide.

## The record: repo, dashboard, planner

### How the three sources work together (repo · notes · admin)

The repo, Harry's planner notes and the Tools dashboard (`/admin`) are three views of the same project. Each has a job, and each points to the others:

| Source | Its job | What goes in it |
|---|---|---|
| **The repo** | **Everything needed to continue successfully.** A fresh session should be able to pick the work up from the repo alone. | The rules (`CLAUDE.md`), the plan (`docs/TASKS.md`, `docs/pathways/`), what shipped (`docs/PATCH_NOTES.md`, older in `docs/history/`), the specs and the code itself. |
| **The notes** (Harry's planner) | **The deeper record, session by session**, that the repo can reference. | The Build Log (what changed, what we decided and why, what is next — one block per session), Overview (every tool, what is in progress, what is new), Features (plain English, by section), Representations (picture decisions), Characters, Handoff, and the archive of settled decisions. |
| **The admin page** (`/admin`) | **The site and its development at a glance** — a friendlier, easier interface. | Facts generated from the code (every tool, its state, what it has), a per-tool Review status Harry and Claude set, and the views over them: List, Matrix. |

How they stay in step:
- **Link, don't restate.** A `docs/PATCH_NOTES.md` entry ends with a `Notes:` line naming its Build Log block, and the Build Log block names the branch and links back to the repo entry. A doc or note that needs a number the code can produce (how many tools are live, which tools have Depth) points to the dashboard or says "as of <date>" — the dashboard's facts are generated, so they cannot drift.
- **Each source can go deeper than the others, but they must not disagree.** If they do: the code is right, then the repo docs, then the notes. Fix the one that is wrong in the same session.
- **The admin page grows as the front door:** the place to see where the site is and what to do next, with the repo and the notes one click behind it.

---

### Ending a session and kickoffs

The plan lives in **`docs/pathways/`** (the large developments, one file each) and **`docs/TASKS.md`**
(smaller to-dos). Standing "resume here" prompts are **not** kept in the docs (they rot);
instead, kickoff blocks are **generated on demand** from a pathway file, and no session's
kickoff is ever saved to a file.

**When you finish a unit of a multi-session build:** update the moved pathway's
**Progress** and **Next steps** (and its `Status`, `Updated`) in `docs/pathways/<name>.md`, and add the patch-notes session file (`docs/patch-notes/`). If the user wants to carry straight on, also output a kickoff block in chat (below) —
but only in chat; never write it into a doc.

**End of a session — keep the three sources in step** (see "How the three sources work together"):
1. **Repo:** add the patch-notes session file `docs/patch-notes/YYYY-MM-DD-<slug>.md` (see "Patch notes are one file per session"; the entry ending with an `Agent: Claude Code` or `Agent: Codex` line and a `Notes:` line that names the Build Log block) and update the pathway file in `docs/pathways/` (as above); move or add the task in `docs/TASKS.md` if one changed.
2. **Admin:** run `npm run facts` if a tool or the registry changed (the facts are generated), then update the **dashboard notes** of each tool the session touched (Review) through the API.
3. **Notes (planner)** — use the planner tools (`mcp__Harry_s_Planner__*`; load via ToolSearch):
   - **Build Log** — one block at the top of `Maths Tools — Build Log` for every session that changes something, tagged `agent:claude-code` or `agent:codex` (with an `Agent:` first line and the agent in the title; `AGENTS.md` says how when one agent writes for the other): *What changed for teachers*, *What we decided and why*, *Still to do / next*, branch name, and the matching `docs/PATCH_NOTES.md` entry. This is the deeper record the repo points to.
   - **Overview** — when a tool goes live or a feature ships, update `Maths Tools — Overview` (tools index, being worked on now, added in the last month; drop anything older than a month into the Build Log).
   - **Features** — update the matching section of `Maths Tools — Features` when something teachers see changed.
   - **Representations** — dated design decisions about the pictures, with open questions.
   - Never edit a locked block (Harry unlocks); read a block's `version` first (`get_block`); keep blocks plain English, in bullets, with any table cell holding more than one item bulleted inside the cell (`• item<br>• item`).

**The tracking habit — how the three areas stay true.** Do these every session, not just at the end; a session that skips them leaves the next one guessing.

| When | Do |
|---|---|
| **Start** | Read the planner note **Maths Tools — Handoff** and add your branch's block. Read `docs/TASKS.md` and the pathway files for what you will touch, the newest 2–3 `docs/PATCH_NOTES.md` entries, and — if you will touch tools — that tool's dashboard note (`GET /api/tool-notes`). Run `npm run facts` and check `git status`: a changed `toolFacts.json` means the code moved under the docs. |
| **As you change something** | One change, one home. A rule or API → `CLAUDE.md`. A decision about direction → the pathway file (its Progress or Next steps). A tool gained or lost a feature → run `npm run facts` and commit the JSON (the dashboard updates itself). A new idea → a pathway with status `idea`; a small job or loose end → `docs/TASKS.md`; never a comment in code. |
| **End** | The three-step routine above (repo entry → admin notes → planner Build Log and the pages you touched), then say in the final message what you updated in each, and what you chose not to. |

What belongs where, so nothing is typed twice:

| Event | Repo | Dashboard (`/admin`) | Planner notes |
|---|---|---|---|
| New or changed tool (options, levels, sub-tools, state) | `npm run facts` + commit; spec status; `docs/PATCH_NOTES.md` | Facts update by themselves; set its Review if it was reviewed | Build Log block; the Overview and Features if teachers see it |
| Something teachers see changed (not tied to one tool) | `docs/PATCH_NOTES.md` | — | Features section; Build Log |
| A decision or a design choice | The pathway file or `docs/TASKS.md` if it changes the plan | Open question on the tool, if it is about one tool | Build Log "What we decided and why"; Representations if it is about a picture |
| A tool goes live or not live | Registry (the code is the truth) + `npm run facts` | Plan status note | Overview (tools index) |
| A rule for building (convention, shared API) | `CLAUDE.md` | — | — |
| Depth bank, lesson or Teach deck added | `docs/PATCH_NOTES.md`, the Depth or Decks pathway | — | Characters if the cast changed |

**Where the working record lives (decided 2026-10-24).** Per-tool review status is kept **on the dashboard** and updated there as the work happens (through the API, or by Harry in `/admin`). The planner is brought up to date **at each session end** from it: the Build Log block says what changed and what was decided, and the Overview is kept current. There are no per-tool pages in the planner any more (retired 2026-10-28).

Rules for the habit:
1. **Never type what the code can count.** How many tools are live, which have Depth, which hide the answer step: read it from the dashboard / `toolFacts.json`, or write "as of <date>" beside it. Hand-typed counts rot first.
2. **If the sources disagree, the code is right, then the repo docs, then the notes.** Fix the wrong one in the same session; do not leave a note saying they differ.
3. **Link, don't restate.** A `docs/PATCH_NOTES.md` entry ends with a `Notes:` line naming its Build Log block; the Build Log block names the branch and the repo entry. Notes point to the dashboard for current facts.
4. **Planner mechanics.** Read a block's `version` first; one edit per block per `batch` call (versions do not advance inside a batch — a second edit to the same block fails the whole batch); locked blocks are left alone; say before deleting (deleted blocks sit in the trash for 30 days); keep language plain, in bullets, table cells holding several items bulleted inside the cell.
5. **A session is not done until** `npm run build` and `npm test` pass, the repo entry exists, the dashboard facts are regenerated, and the planner reflects what changed. If time runs out, write the missing steps into the Build Log block under "Still to do / next" rather than leaving them silent.
6. **Check before ending:** `npm run facts` leaves no diff; grep the docs for the old name of anything you renamed; open `/admin` (or fetch `/api/tool-notes`) and confirm a tool you set to "live" really is.

**The kickoff recipe (used both at session end and on demand).** When the user asks for a
"kickoff for `<pathway>`" — e.g. when firing off several sessions in a sitting — build one from
that pathway's `docs/pathways/<name>.md` file: a fenced code block (triple backtick, language `text`, so
the paste boundary is unmistakable) containing:

- a one-line **current-state** summary for the pathway;
- the **exact next task** — the specific option chosen from that pathway's *Next
  steps* (ask which, if it's not obvious), sized as **one small chunk** that can merge on its own (see "Small chunks, merged early");
- the **minimal files to read** (and which large files *not* to re-read whole);
- the **verification bar** before pushing (`npm run build` clean, `npm test`, any eyeball check);
- the standard setup line (confirm baseline current, `npm install`).

**Never name a specific branch to check out.** Every kickoff starts from an up-to-date `main`
and works on the session's own fresh branch (the harness assigns it) — the prompt must not
name one, and a session must never check out or reuse an old feature branch. Do **not** use
the old `>>>` … `<<<` delimiters — they render as nested blockquotes and break the boundary.

---

**Say who did the work.** Every `docs/PATCH_NOTES.md` entry carries an `Agent: Codex` or `Agent: Claude Code` line (before its `Notes:` line). Every planner Build Log block carries the matching tag, `agent:codex` or `agent:claude-code`, begins with the same `Agent:` line and ends its title with "(Codex)" or "(Claude Code)", so the log can be filtered by agent (`query_blocks` with that tag). Tag the agent that did the work, not the one writing it up: if one agent writes the record for the other, say so in the block's first line ("written by Claude Code on Codex's behalf"). If a session is shared, tag both.

If a step cannot be done (no network to the dashboard, the planner tool is unavailable), write it under *Still to do / next* in your patch-notes entry so the next session picks it up. Never leave it silent, and never state in a final message that something was updated when it was not.

## The floating project plan

In Developing tools mode, use the floating project button on the left for the live plan. On laptop-sized screens, the panel docks beside a scaled view of the current page in a rounded frame. Tool pages open their checklist; home and hubs open the project tree. The tree starts from the tool registry. You can add project branches, move work, pin priorities and link dependencies. Use the review queue only for a specific thing Harry can try. A request has its own prompt and shares the item's ID; completing the request clears the queue entry independently of the task's tick.

When starting project work, read the shared plan as well as the handoff. After changing the work, update the affected item, close completed checks, and record any specific review request. Keep technical history in the patch notes and Build Log.

Agents use `GET /api/project-plan` and `POST /api/project-plan` with the `x-project-plan-key` header. Read the plan, preserve all unrelated entries and stable IDs, and send the amended JSON with the revision you read. The response carries the new revision. On HTTP 409, read again and apply your specific edit to the latest plan. The record format and validation are in `api/_projectPlan.ts`. On the first run the browser adds the tool catalogue and starter branches when it writes the plan. Wait for that first save before editing existing catalogue items through the API.

Set a fresh server-only `DEVELOPING_TOOLS_PASSWORD` in Vercel. The site’s Developing tools prompt sets an HTTP-only session cookie for the plan, dashboard and decks on that site. Set the server-only `PROJECT_PLAN_KEY` for agent access to the plan and `DEVELOPING_TOOLS_API_KEY` for scripts that manage decks and tool notes. Keep both machine keys separate from the browser password; the existing private Blob store keeps the plan.

## The Tools dashboard (`/admin`) and its notes API

A Developing-tools-gated page (burger menu → Developing tools → **Tools dashboard**, or `/admin`). It does **not** replace the plan docs (`docs/TASKS.md`, `docs/pathways/`) or Harry's planner (the granular written history); it is the interactive, friendlier overview of the same ground. Two halves:

0. **Kinds — what counts as a tool.** Every registry entry gets a `kind` (`kindOf` in `scripts/toolFacts.mjs`: rules by id/category, plus `KIND_OVERRIDES`): `tool` (teaching tools — ToolShell/Decision/CS), `sandbox` (open-ended interactives, visualiser), `game`, `generator` (PDF generators), `workshop` (internal: Tool Shell template, Technique/Skill libraries, technique previews). The dashboard has one tab per kind and opens on **Tools**; counts, strands and feature filters are scoped to the tab, so a technique preview never weighs the same as a whole tool. A new entry that isn't a teaching tool needs a rule or override.
1. **Facts read from the code** (never edit by hand): `scripts/toolFacts.mjs` reads `src/registry.ts` and each tool file and writes `src/generated/toolFacts.json` — availability (live / in development / hidden / parked), shell, sub-tool count, Depth, lessons, Teach, developing picture, calibration, Smart Progressor, scaffold, smoke tests, spec, pictures used. It runs before every build; **after adding or changing a tool or the registry run `npm run facts`** and commit the JSON (a test fails if it is stale).
3. **Decks, Developments and the docs views** (read from the docs, never typed in the dashboard): a side menu (a bottom bar on a phone) has **Tools · Decks · Developments · Features · How a tool is built**; clicking a tool anywhere opens its profile in a side panel. **Decks** lists every deck (built-in and teachers' own) with strand, tool, slide count, slides by kind and published state, read from the decks themselves (`src/admin/DecksSection.tsx`); a deck opens in a side panel with Play and Edit. Developments has a drop-down: **Tasks** (`docs/TASKS.md`, smaller to-dos grouped by status), **Pathways** (`docs/pathways/*.md`, one file per large development: status idea / building / rolling out / done / paused, intention, progress, next steps; a rolling-out pathway names a tool fact as its `Measure` and shows x/n live tools) and **Feature tracker** (which tools have each feature beyond the standard, with the tools listed under each). Features shows `docs/FEATURES.md`; How a tool is built shows `docs/HOW_A_TOOL_IS_BUILT.md`. `scripts/adminDocs.mjs` turns those docs into `src/generated/adminDocs.json` (run by `npm run facts` and before every build; a test fails if stale), so **edit the docs, then run `npm run facts`** — never edit the JSON. (`docs/PROJECTS.md`, `docs/TIDY_UP.md` and `docs/FUTURE.md` were retired on 2026-10-28; settled decisions are in the planner archive.)
2. **Notes written by people** (live, shared): per tool, the profile shows a Review status (not reviewed / reviewing / reviewed: the `review` field), and, generated from the code and the docs, the tool's facts, what it does (its `<Tool>.about.ts`) and its recent patch-note entries, each section foldable. (The older Status, In development, What we want to change, Differs from, Representation and Open questions fields were deleted from the store on 2026-10-28; the API still accepts them but nothing reads them.) Stored as one private Vercel Blob (`tool-notes.json`) behind `api/tool-notes.ts`; the dashboard edits them, and Claude edits them through the same API. Tool ids are the registry `id`s. Until the Blob store is connected the dashboard falls back to notes on that device only (it says so in a banner).

**Claude reading and writing notes** (needs the environment's network policy to allow `maths-tools-phi.vercel.app`; key = the server-only `DEVELOPING_TOOLS_API_KEY` provided to the agent):

```bash
KEY="$DEVELOPING_TOOLS_API_KEY"; URL=https://maths-tools-phi.vercel.app/api/tool-notes
curl -s -H "x-admin-key: $KEY" $URL                                    # every tool's notes
curl -s -X POST -H "x-admin-key: $KEY" -H "content-type: application/json" \
  -d '{"tool":"indices","by":"Claude","fields":{"wantsToChange":"…"}}' $URL   # merge fields into one tool's note
curl -s -X POST -H "x-admin-key: $KEY" -H "content-type: application/json" \
  -d '{"tool":"old-id","remove":true}' $URL                                # delete the note of an id that no longer exists
```

**On a branch preview** (before the dashboard is merged, or to test API changes): previews sit behind Vercel login, so get past it with the Vercel connector — `list_deployments` (branch filter) for the latest preview URL, then `get_access_to_vercel_url` for a share link, then `curl -c jar -b jar "$PREVIEW/api/tool-notes?_vercel_share=<token>"` repeated every ~5 s until it returns **307** (the cookie is now in `jar`), and add `-b jar` to the GET/POST calls above with `URL=$PREVIEW/api/tool-notes`. Notes are one shared Blob, so a write from a preview shows on every deployment. Runtime errors: `get_runtime_logs` for the deployment.

POST sends only the fields you change (the server merges, so Harry's edits to other fields are kept; writes are ETag-checked). **At the end of a session that changes a tool, set that tool's Review status if it has been reviewed** so the dashboard stays true. The `maths-tools` project uses a private Blob store through `BLOB_READ_WRITE_TOKEN`. Scripts require `DEVELOPING_TOOLS_API_KEY` in Vercel and the caller’s environment. Claude also needs access to `*.vercel.app`. The function keeps the notes logic in `api/_notes.ts` (it must import with `.js` extensions and cannot import from `src/`) and takes the conditional-write ETag from `head()` (a download's ETag turns weak and is rejected).

---

## Hand-off between agents

The live hand-off is the planner's **Maths Tools — Handoff** note (in-flight work); the permanent one is below. Each patch-notes entry names the **branch**, the **files and areas touched**, and anything **deliberately not done**. The next agent starts by reading the top few entries and `git log origin/main` to see what changed under it. If the code, the repo docs and the notes disagree, the code is right, then the repo docs, then the notes; fix the wrong one in the same session.
