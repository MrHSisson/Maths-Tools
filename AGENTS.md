# Maths Tools — instructions for coding agents (Codex, Claude Code)

This file is read automatically by Codex. **`CLAUDE.md` is the rulebook for everyone**: read it before you change anything, and follow it exactly as you would if you were Claude Code. It holds the conventions, the Rules checklist, how to build a tool, the three-source tracking habit and the index to `docs/reference/`. This file does not repeat those rules; it covers the points where two agents working at the same time need to agree.

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
```

A session is not finished until build, tests and lint pass. Prefer cheap checks (tsc, tests, DOM assertions) to reading screenshots back; take a screenshot only for real layout judgement. Check phone, tablet and laptop sizes for anything visual (see `CLAUDE.md`).

## Branches and merging

- **One fresh branch per session, from an up-to-date `main`.** Never push to `main`, never reuse or stack onto an old feature branch, never rewrite history on another agent's branch.
- **Anyone can work anywhere, but one agent per area at a time.** Neither agent owns files or tools. Before starting, read the planner note **Maths Tools — Handoff** and add a block for your branch (agent, branch, goal, the files, tool or prong you are touching, state). If an unmerged block already covers your area, do not start: tell Harry or wait. At the end, update your block (state, done, deliberately not done, next, blockers); delete it once merged, since the Build Log and `docs/PATCH_NOTES.md` keep the permanent record. If the planner is unreachable, say so and put the same facts at the top of your patch-notes entry.
- **Shared files are the usual collision points**: `src/registry.ts`, `src/shared/index.ts`, `docs/PATCH_NOTES.md`, `docs/PROJECTS.md`, `docs/FEATURES.md`, `package-lock.json`. Edit them minimally and add, never reformat.
- **Generated files** (`src/generated/toolFacts.json`, `src/generated/adminDocs.json`) are never merged by hand: take either side, then run `npm run facts` and commit the result.
- **Merge order:** whichever branch is finished first merges first. The second merges `main` into its own branch (a merge commit, resolved by hand, never with a broad script), runs install, build, tests, lint and `npm run facts`, then merges.
- **Do not open a pull request unless Harry asks.** Commit and push to your own branch.

## The record: repo, dashboard, planner

`CLAUDE.md` ("End of a session" and "The tracking habit") is the full routine. In short, at the end of every session that changes something:

1. **Repo:** add a `docs/PATCH_NOTES.md` entry (newest first, **inside** the Maths or Computer Science strand, never above the file's introduction) ending with an `Agent:` line and a `Notes:` line that names your planner Build Log block; refresh the prong in `docs/PROJECTS.md`; update `docs/FEATURES.md` for anything a teacher sees and `docs/reference/` where an interface or rule changed.
2. **Dashboard (`/admin`):** run `npm run facts`, then update the notes of each tool you touched through the `api/tool-notes` API as described in `CLAUDE.md`.
3. **Planner** (the `mcp__Harry_s_Planner__*` tools): one block at the top of `Maths Tools — Build Log` per session: *What changed for teachers*, *What we decided and why*, *Still to do / next*, your branch name and the matching patch-notes entry. Update the Features section and the pages of any tool you changed. Mechanics: read a block's `version` first (`get_block`); one edit per block per `batch` call; never touch a locked block or a tool page's Review block; keep language plain and in bullets; say before deleting.

**Say who did the work.** Every `docs/PATCH_NOTES.md` entry carries an `Agent: Codex` or `Agent: Claude Code` line (before its `Notes:` line). Every planner Build Log block carries the matching tag, `agent:codex` or `agent:claude-code`, begins with the same `Agent:` line and ends its title with "(Codex)" or "(Claude Code)", so the log can be filtered by agent (`query_blocks` with that tag). Tag the agent that did the work, not the one writing it up: if one agent writes the record for the other, say so in the block's first line ("written by Claude Code on Codex's behalf"). If a session is shared, tag both.

If a step cannot be done (no network to the dashboard, the planner tool is unavailable), write it under *Still to do / next* in your patch-notes entry so the next session picks it up. Never leave it silent, and never state in a final message that something was updated when it was not.

## Hand-off between agents

The live hand-off is the planner's **Maths Tools — Handoff** note (in-flight work); the permanent one is below. Each patch-notes entry names the **branch**, the **files and areas touched**, and anything **deliberately not done**. The next agent starts by reading the top few entries and `git log origin/main` to see what changed under it. If the code, the repo docs and the notes disagree, the code is right, then the repo docs, then the notes; fix the wrong one in the same session.
