# Strands

Areas of the site that stand on their own and grow over time. They are not development pathways (see `docs/pathways/`) and not tasks (`docs/TASKS.md`). Which tools are live, and what each has, is on the dashboard. This file records where each strand is up to and what could come next.

## Pure Maths (A-level)
Factor Theorem, Partial Fractions and Binomial Expansion (AQA Year 2; seven tabs: Expand, Fractions: one bracket, Power of a fraction, With partial fractions, Range of validity, Find the unknown, Approximation) are live, with a shared (i) level guide, asterisked extensions and exam-style parts.
**Next:** exam-style questions (Factor Theorem first) and a class review of Binomial Expansion.

## Maths word games (Words Bingo, Hangman, Pairs)
Standalone, projector-first games on one shared word bank (`src/shared/mathsWords/`; 237 words in six packs, tagged KS2 / KS3 / KS4; clue types definition, symbol, picture). Landing page: Interactive Tools, Games. Bingo is live; Hangman and Pairs are built and Developing-tools only (a classroom test is in `docs/TASKS.md`).
**Banked ideas (not started):** Connect 4, Odd one out, Sort it, Guess the word, Taboo-style describing, a "Maths Word Games" landing hub, drag-to-match for Pairs. **Possible next:** more KS2 words for the thin packs (Algebra, Data), more pictures.

## Computer Science
Parked as a priority; worked on on request. OCR J277 GCSE. Revision tools are knowledge tools on their own shell, `CSShell` (`src/shared/cs/`): Learn, Study, Cards, Quiz, Fill, Exam; every card carries a `specTag`. Architecture: `docs/architecture/CS_SHELL_PLAN.md`.
- **Revision topics live:** 1.1.1 CPU Architecture (the reference), 1.1.2 CPU Performance, 1.1.3 Embedded Systems (all of 1.1). The old System Architectures tool was retired 2026-10-27.
- **Next when unparked:** 1.2.1 Primary storage; a shared cross-topic synoptic bank; a new representation when a topic demands one; a `Status: ready` brief in `specs/cs/` before each topic. Later: 1.2.2 to 1.2.4, 1.3 Networks, 1.4 Network security, 1.5 Systems software, 1.6 Ethical, legal and environmental. Spaced repetition needs a persistence layer that does not exist.
- **Procedural generators** (on `ToolShell`, `src/tools/Binary/`, group "Binary & number bases"): Binary Operations, Number Bases, Data Units, Binary Counting, File Sizes, all on the shared place value table and carry ripple. **Next:** the units ladder as an evolving picture in Data Units; compression (J277 1.2.5) as its own tool; the deferred pixel-picture and sampled-wave sub-tools; classroom feedback.

## Decision Maths (A-level)
AQA Further Maths Discrete Mathematics on `DecisionShell` (`src/shared/decision/`); contracts in `docs/architecture/DECISION_SHELL_PLAN.md`, a brief per tool in `specs/`. The P-Value Grapher (statistics) belongs to the same A-level strand.
- **Live:** Network Flows (`specs/flow-networks.md`; three tabs Developing-tools only), Minimum Spanning Tree, Critical Path Analysis (`specs/cpa-skill-tools.md`, `specs/cpa-exam-questions.md`).
- **Not live:** Travelling Salesperson, Route Inspection, Mixed Strategies (needs an answer check and review) and the Network Sandbox support page. They go live through the pathway `docs/pathways/decision-exam-questions.md`.
- Shared: the graph bank and sandbox overlay, CI validators that re-derive each answer, recent and pinned questions in both shells.
- **Next tools:** Dijkstra; Route Inspection extras (adding an edge to make a network Eulerian, six odd vertices); best lower bound over every vertex for TSP.
