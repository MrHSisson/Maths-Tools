Strand: Maths

## 2026-11-20 — Delivery workflow, step A1: test areas and CI path filters

Branch `claude/great-heisenberg-5a3nko`. Area: `.github/workflows/ci.yml`, `scripts/testAreas.mjs`, `scripts/selectTests.mjs`, `src/tests/testAreas.test.ts`, `AGENTS.md`.

- **Pull requests run only what a change can break.** Tests are grouped into five areas (Decision Maths, decks and the deck API, Computer Science, docs, and tools). A pull request runs the areas its changed files touch; type check, build and lint always run. A docs-only or deck-only change no longer runs the Decision tests (about 900 s of the suite).
- **Run everything when unsure:** shared code, the registry, config, the workflow itself or any path the list does not know runs the full suite. Pushes to `main`, a nightly run (02:17 UTC) and a manual run with "full" ticked also run everything.
- The plain list is `scripts/testAreas.mjs`; a test fails if a test file is in no area. `node scripts/selectTests.mjs origin/main` shows what a branch would run.
- Not yet: a change to any tool still runs the "tools" area, which includes `seedReplay`'s slow Decision half (A2/A3); `main` still re-runs everything after a pull request (A5).

Agent: Claude Code
Notes: Build Log block "2026-11-20 — Delivery workflow: faster builds, smaller merges, a steadier deck workflow (Claude Code)" (tag agent:claude-code).
