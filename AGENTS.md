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
```

A session is not finished until build, tests and lint pass. Prefer cheap checks (tsc, tests, DOM assertions) to reading screenshots back; take a screenshot only for real layout judgement. Check phone, tablet and laptop sizes for anything visual (see `CLAUDE.md`).

## Branches and merging

- **One fresh branch per session, from an up-to-date `main`.** Never push to `main`, never reuse or stack onto an old feature branch, never rewrite history on another agent's branch.
- **Anyone can work anywhere, but one agent per area at a time.** Neither agent owns files or tools. Before starting, read the planner note **Maths Tools — Handoff** and add a block for your branch (agent, branch, goal, the files, tool or pathway you are touching, state). If an unmerged block already covers your area, do not start: tell Harry or wait. At the end, update your block (state, done, deliberately not done, next, blockers); delete it once merged, since the Build Log and `docs/PATCH_NOTES.md` keep the permanent record. If the planner is unreachable, say so and put the same facts at the top of your patch-notes entry.
- **Shared files are the usual collision points**: `src/registry.ts`, `src/shared/index.ts`, `docs/PATCH_NOTES.md`, `docs/TASKS.md`, `docs/FEATURES.md`, `package-lock.json`. Edit them minimally and add, never reformat.
- **Generated files** (`src/generated/toolFacts.json`, `src/generated/adminDocs.json`) are never merged by hand: take either side, then run `npm run facts` and commit the result.
- **Merge order:** whichever branch is finished first merges first. The second merges `main` into its own branch (a merge commit, resolved by hand, never with a broad script), runs install, build, tests, lint and `npm run facts`, then merges.
- **Do not open a pull request unless Harry asks.** Commit and push to your own branch.

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
**Progress** and **Next steps** (and its `Status`, `Updated`) in `docs/pathways/<name>.md`, and add the `docs/PATCH_NOTES.md` history
entry. If the user wants to carry straight on, also output a kickoff block in chat (below) —
but only in chat; never write it into a doc.

**End of a session — keep the three sources in step** (see "How the three sources work together"):
1. **Repo:** add the `docs/PATCH_NOTES.md` entry (ending with an `Agent: Claude Code` or `Agent: Codex` line and a `Notes:` line that names the Build Log block) and update the pathway file in `docs/pathways/` (as above); move or add the task in `docs/TASKS.md` if one changed.
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
  steps* (ask which, if it's not obvious);
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

## The Tools dashboard (`/admin`) and its notes API

A Developing-tools-gated page (burger menu → Developing tools → **Tools dashboard**, or `/admin`). It does **not** replace the plan docs (`docs/TASKS.md`, `docs/pathways/`) or Harry's planner (the granular written history); it is the interactive, friendlier overview of the same ground. Two halves:

0. **Kinds — what counts as a tool.** Every registry entry gets a `kind` (`kindOf` in `scripts/toolFacts.mjs`: rules by id/category, plus `KIND_OVERRIDES`): `tool` (teaching tools — ToolShell/Decision/CS), `sandbox` (open-ended interactives, visualiser), `game`, `generator` (PDF generators), `workshop` (internal: Tool Shell template, Technique/Skill libraries, technique previews). The dashboard has one tab per kind and opens on **Tools**; counts, strands and feature filters are scoped to the tab, so a technique preview never weighs the same as a whole tool. A new entry that isn't a teaching tool needs a rule or override.
1. **Facts read from the code** (never edit by hand): `scripts/toolFacts.mjs` reads `src/registry.ts` and each tool file and writes `src/generated/toolFacts.json` — availability (live / in development / hidden / parked), shell, sub-tool count, Depth, lessons, Teach, developing picture, calibration, Smart Progressor, scaffold, smoke tests, spec, pictures used. It runs before every build; **after adding or changing a tool or the registry run `npm run facts`** and commit the JSON (a test fails if it is stale).
3. **Developments and the docs views** (read from the docs, never typed in the dashboard): a side menu (a bottom bar on a phone) has **Tools · Developments · Features · How a tool is built**; clicking a tool anywhere opens its profile in a side panel. Developments has a drop-down: **Tasks** (`docs/TASKS.md`, smaller to-dos grouped by status), **Pathways** (`docs/pathways/*.md`, one file per large development: status idea / building / rolling out / done / paused, intention, progress, next steps; a rolling-out pathway names a tool fact as its `Measure` and shows x/n live tools) and **Feature tracker** (which tools have each feature beyond the standard, with the tools listed under each). Features shows `docs/FEATURES.md`; How a tool is built shows `docs/HOW_A_TOOL_IS_BUILT.md`. `scripts/adminDocs.mjs` turns those docs into `src/generated/adminDocs.json` (run by `npm run facts` and before every build; a test fails if stale), so **edit the docs, then run `npm run facts`** — never edit the JSON. (`docs/PROJECTS.md`, `docs/TIDY_UP.md` and `docs/FUTURE.md` were retired on 2026-10-28; settled decisions are in the planner archive.)
2. **Notes written by people** (live, shared): per tool, the profile shows a Review status (not reviewed / reviewing / reviewed: the `review` field), and, generated from the code and the docs, the tool's facts, what it does (its `<Tool>.about.ts`) and its recent patch-note entries, each section foldable. (The older Status, In development, What we want to change, Differs from, Representation and Open questions fields were deleted from the store on 2026-10-28; the API still accepts them but nothing reads them.) Stored as one private Vercel Blob (`tool-notes.json`) behind `api/tool-notes.ts`; the dashboard edits them, and Claude edits them through the same API. Tool ids are the registry `id`s. Until the Blob store is connected the dashboard falls back to notes on that device only (it says so in a banner).

**Claude reading and writing notes** (needs the environment's network policy to allow `maths-tools-phi.vercel.app`; key = the Developing-tools password in `src/devAccess.ts`):

```bash
KEY=$(grep -o 'DEV_PASSWORD = "[^"]*"' src/devAccess.ts | cut -d'"' -f2); URL=https://maths-tools-phi.vercel.app/api/tool-notes
curl -s -H "x-admin-key: $KEY" $URL                                    # every tool's notes
curl -s -X POST -H "x-admin-key: $KEY" -H "content-type: application/json" \
  -d '{"tool":"indices","by":"Claude","fields":{"wantsToChange":"…"}}' $URL   # merge fields into one tool's note
curl -s -X POST -H "x-admin-key: $KEY" -H "content-type: application/json" \
  -d '{"tool":"old-id","remove":true}' $URL                                # delete the note of an id that no longer exists
```

**On a branch preview** (before the dashboard is merged, or to test API changes): previews sit behind Vercel login, so get past it with the Vercel connector — `list_deployments` (branch filter) for the latest preview URL, then `get_access_to_vercel_url` for a share link, then `curl -c jar -b jar "$PREVIEW/api/tool-notes?_vercel_share=<token>"` repeated every ~5 s until it returns **307** (the cookie is now in `jar`), and add `-b jar` to the GET/POST calls above with `URL=$PREVIEW/api/tool-notes`. Notes are one shared Blob, so a write from a preview shows on every deployment. Runtime errors: `get_runtime_logs` for the deployment.

POST sends only the fields you change (the server merges, so Harry's edits to other fields are kept; writes are ETag-checked). **At the end of a session that changes a tool, set that tool's Review status if it has been reviewed** so the dashboard stays true. Setup (done, 2026-10-22): a private Blob store connected to the `maths-tools` project (gives `BLOB_READ_WRITE_TOKEN`), an `ADMIN_KEY` env var (Production + Preview) equal to the Developing-tools password, and `*.vercel.app` in the Claude environment's allowed domains. The function keeps the notes logic in `api/_notes.ts` (it must import with `.js` extensions and cannot import from `src/`) and takes the conditional-write ETag from `head()` (a download's ETag turns weak and is rejected).

---

## Hand-off between agents

The live hand-off is the planner's **Maths Tools — Handoff** note (in-flight work); the permanent one is below. Each patch-notes entry names the **branch**, the **files and areas touched**, and anything **deliberately not done**. The next agent starts by reading the top few entries and `git log origin/main` to see what changed under it. If the code, the repo docs and the notes disagree, the code is right, then the repo docs, then the notes; fix the wrong one in the same session.
