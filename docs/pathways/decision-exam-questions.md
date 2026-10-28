# Decision exam-style questions
- **Status:** building
- **Updated:** 2026-10-28

## Intention
Exam-style questions are the shape every Decision tool should end up with. A question is an exam chain of parts (intro, marks, minutes, model answer, mark scheme, stepped working behind the (?), a picture per part) composed from a parts library and recipes, shown one part at a time and printed as paper then mark scheme. For the three Decision tools that are not live it is also the route to go-live.

## Progress
- Decided 2026-10-26. Network Flows has the full pattern (parts library, recipes, Explain and justify, two-figure questions, Practice and Worksheet).
- Critical Path Analysis has 11 exam chains but is not yet on the parts and recipes pattern.
- Minimum Spanning Tree is live as skill practice only. Travelling Salesperson, Route Inspection and Mixed Strategies are dev-gated with no exam chains.
- Paper questions are tagged as part chains in `specs/corpus/<tool>.md` and checked by a corpus test.

## Next steps
- Move CPA onto the parts library and recipes.
- Exam chains for Minimum Spanning Tree, then Route Inspection and Travelling Salesperson (corpus tagged first).
- Mixed Strategies: an answer check and review, then exam parts (decide whether game theory shares the recipes or only the exam view).
- A go-live checklist per tool: exam chains, corpus, validators that re-derive each answer, phone / tablet / laptop check, then remove `enabled: false`.
- After those: Dijkstra, Route Inspection extras, best lower bound over every vertex for TSP.

## Where to read more
`docs/architecture/DECISION_SHELL_PLAN.md`, `specs/flow-parts-library.md`, `specs/flow-exam-questions.md`, `specs/cpa-exam-questions.md`.
