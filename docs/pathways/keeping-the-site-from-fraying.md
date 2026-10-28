# Keeping the site from fraying
- **Status:** idea
- **Updated:** 2026-10-28

## Intention
Structures so new work does not leave split ends: fewer mechanisms, each with an owner and a rollout list, and tests that catch drift.

## Progress
Not started. Much of this already exists as tests (option label vocabulary, registry ids, file-local exports, hook-dependency reasons, the generated dashboard facts).

## Next steps
- One state per tool (live or not), derived by the dashboard, instead of several switches.
- A definition of live: a short checklist the dashboard computes (tests, spec, within the option limit, reviewed).
- A capability has a status (rolling out / done / retired) and a rollout list; the pathways page now shows this.
- Retire before you add: a new way of doing something names the old way it replaces.
- Write down how we build and roll out (see the matching task in `docs/TASKS.md`).

## Where to read more
`docs/HOW_A_TOOL_IS_BUILT.md`, `CLAUDE.md`.
