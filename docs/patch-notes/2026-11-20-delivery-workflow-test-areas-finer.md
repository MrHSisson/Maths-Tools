Strand: Maths

## 2026-11-20 — Test areas split finer: a mechanics change no longer runs the Critical Path tests

Branch `claude/great-heisenberg-5a3nko`. Area: `scripts/testAreas.mjs`, `scripts/selectTests.mjs`, `src/tests/testAreas.test.ts`, `AGENTS.md`.

- **Decision tests are five areas, not one:** Critical Path, Network Flows, the small graph topics, mechanics (Dimensional Analysis) and the checks that span the Decision shell; the old "tools" area is the checks that run over every tool plus each tool's own tests. A change to one topic runs that topic and the shared checks, a change to the Decision shell itself still runs every topic. A mechanics change now runs about 70 seconds of tests instead of about 10 minutes.
- **A hole closed:** a change under `src/tools/FurtherMechanics/` used to skip the Dimensional Analysis tests. A test now checks it.
- **Reviewed for further splitting:** a separate mechanics or Critical Path shell would not save more than this, so it was not done. The candidates for later (running the all-tool checks for only the changed tool, and splitting Network Flows' layout tests from its solver tests) are in the pathway.

Agent: Claude Code
Notes: Build Log block "2026-11-20 — Delivery workflow: faster builds, smaller merges, a steadier deck workflow (Claude Code)" (tag agent:claude-code).
