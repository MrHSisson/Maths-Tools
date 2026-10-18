# Corpus: Network Flows — every paper question as a chain of parts

**Status:** tagged 2026-10-18 (first pass, to be corrected by the teacher). Read by `src/tests/flowCorpus.test.ts`.

Each row is one paper question written as the parts it asks, in order, with each part's marks. A part is an id from the parts library (`src/shared/decision/flowParts.ts`). `gap:<name>` marks a part the library cannot build yet, and the test lists them; `skip:<name>` marks a part left out by decision (multiple choice). Wording of the questions is not reproduced; this is only their shape.

Sources: **AL** = current A-level specification questions, **AS** = current AS specification questions, **L** = legacy specification questions in the order they appear in the supplied pack.

| Source | Q | Marks | Parts |
|---|---|---|---|
| AL | 1 | 6 | superAddA(2) → cutBack(1) → claimFlowCut(2) → superWords(1) |
| AL | 2 | 8 | superAddA(2) → augment(4) → switchOff(2) |
| AL | 3 | 5 | superWords(2) → cutBack(1) → claimFlowCut(2) |
| AL | 4 | 10 | superAddA(2) → augment(4) → proveMax(2) → claimPipe(2) |
| AL | 5 | 1 | skip:mcqCutValue(1) |
| AL | 6 | 10 | cutBack(1) → cutMeaning(1) → potentials(2) → augment(4) → upgradeOne(2) |
| AL | 7 | 11 | forcedArc(1) → forcedArc(1) → impossibleFlow(1) → potentials(2) → augment(3) → proveMax(1) → restrictionImpact(2) |
| AS | 1 | 1 | skip:mcqFlowCutDeduce(1) |
| AS | 2 | 7 | gap:sourceSinkFlows(3) → missingFlows(2) → proveAtMost(2) |
| AS | 3 | 1 | skip:mcqSupersourceNodes(1) |
| AS | 4 | 4 | cutValue(1) → cutWrite(1) → boundTwo(2) |
| AS | 5 | 4 | cutValue(1) → cutValue(1) → addSuper(2) |
| AS | 6 | 1 | skip:mcqCutImplies(1) |
| AS | 7 | 1 | skip:mcqCutValue(1) |
| AS | 8 | 6 | cutValue(1) → deduceCut(1) → listSS(1) → addSuper(1) → listSS(1) → addSuper(1) |
| AS | 9 | 4 | gap:cutTable(1) → gap:maxFlowReason(1) → gap:drawFlow(2) |
| L | 1 | 6 | flowCutCompare(2) → flowCutCompare(2) → flowCutCompare(1) → gap:infeasibleVertex(1) |
| L | 2 | 9 | routeMax(3) → augment(4) → gap:drawFlow(1) → proveMax(1) |
| L | 3 | 8 | gap:readNetwork(3) → missingFlows(3) → gap:flowValue(1) → cutValue(1) |
| L | 4 | 11 | addSuper(2) → routeMax(2) → augment(5) → gap:drawFlow(1) → proveMax(1) |
| L | 5 | 14 | cutBack(1) → missingFlows(2) → potentials(2) → augment(6) → gap:drawFlow(2) → proveMax(1) |
| L | 6 | 16 | cutShowThat(1) → gap:cutTable(2) → gap:maxFlowReason(1) → gap:drawFlow(2) → gap:capacityIncrease(4) → augment(4) → gap:drawFlow(2) |
| L | 7 | 11 | addSuper(2) → routeMax(2) → potentials(1) → augment(5) → proveMax(1) |
| L | 8 | 13 | cutValue(1) → routeMax(3) → augment(5) → gap:drawFlow(1) → blockedMax(3) |
| L | 9 | 15 | cutShowThat(1) → gap:cutTable(3) → gap:maxFlowReason(1) → gap:drawFlow(1) → gap:capacityIncrease(2) → augment(5) → gap:drawFlow(2) |
| L | 10 | 14 | cutBack(1) → missingFlows(2) → potentials(2) → augment(6) → gap:drawFlow(2) → proveMax(1) |
| L | 11 | 14 | listSS(1) → cutValue(1) → routeMax(2) → augment(6) → gap:drawFlow(2) → blockedMax(2) |
| L | 12 | 16 | cutBack(1) → missingFlows(3) → potentials(2) → augment(6) → gap:drawFlow(2) → proveMax(2) |
| L | 13 | 13 | addSuper(2) → cutValue(1) → deduceCut(1) → routeMax(2) → potentials(1) → augment(4) → gap:flowInArc(2) |
| L | 14 | 13 | cutBack(1) → cutMeaning(1) → missingFlows(3) → potentials(2) → augment(5) → gap:drawFlow(1) |
| L | 15 | 15 | cutValue(1) → deduceCut(1) → routeMax(3) → augment(5) → gap:drawFlow(2) → proveMax(3) |
| L | 16 | 15 | cutBack(1) → cutMeaning(1) → missingFlows(4) → potentials(2) → augment(5) → gap:drawFlow(2) |
| L | 17 | 14 | missingFlows(4) → augment(6) → gap:drawFlow(2) → proveMax(2) |
| L | 18 | 16 | gap:readNetwork(1) → cutValue(1) → routeMax(2) → augment(5) → gap:drawFlow(2) → proveMax(2) → blockedMax(3) |
| L | 19 | 15 | cutBack(1) → cutMeaning(1) → routeMax(2) → augment(6) → gap:drawFlow(2) → proveMax(3) |
| L | 20 | 8 | cutValue(2) → gap:drawFlow(2) → restricted(2) → restricted(2) |
| L | 21 | 7 | augment(4) → proveMax(1) → newArc(2) |
| L | 22 | 11 | listSS(1) → gap:readNetwork(1) → cutValue(1) → augment(4) → gap:maxFlowReason(1) → restricted(3) |
| L | 23 | 11 | listSS(2) → gap:flowValue(1) → missingFlows(2) → gap:flowOfValue(6) |
| L | 24 | 10 | cutValue(2) → augment(8) |
| L | 25 | 10 | cutValue(2) → gap:flowOfValue(2) → blockedMax(3) → blockedMax(3) |
| L | 26 | 12 | addSuper(2) → routeMax(2) → augment(5) → proveMax(3) |
| L | 27 | 10 | flowCutCompare(2) → gap:infeasibleVertex(2) → augment(4) → proveMax(2) |
| L | 28 | 8 | augment(6) → proveMax(2) |
| L | 30 | 10 | gap:findCutOfValue(1) → gap:augmentByPath(3) → proveMax(2) → gap:capacityIncrease(4) |
| L | 31 | 12 | augment(6) → proveMax(2) → gap:arcBound(4) |
| L | 32 | 16 | addSuper(3) → cutShowThat(1) → cutWrite(1) → gap:flowOfValue(5) → proveMax(2) → gap:supplyShowThat(4) |
| L | 33 | 11 | cutValue(2) → missingFlows(4) → gap:augmentByPath(3) → gap:noMorePaths(2) |
| L | 34 | 10 | addSuper(3) → gap:flowOfValue(4) → proveMax(3) |
| L | 35 | 6 | augment(4) → proveMax(2) |
| L | 36 | 11 | augment(6) → proveMax(2) → gap:augmentAfterChange(3) |

## Notes on the gaps
- `gap:drawFlow` — "illustrate / indicate a possible flow on each edge" for the maximum flow found. The augmentation part ends with the flow drawn in its answer picture, so most of these are a mark inside `augment`; a stand-alone part is wanted for questions that ask for it separately.
- `gap:cutTable` / `gap:maxFlowReason` — the table of all cuts and "state the maximum flow, with a reason". The skills tab exists; the exam part does not.
- `gap:capacityIncrease` — new maximum after raising the capacity of named arcs, starting from the previous maximum flow.
- `gap:flowOfValue` — find a flow of a stated value by augmenting from zero (the maximum flow part with a target).
- `gap:infeasibleVertex` — why no flow exists on a min/max network, from the totals at one vertex (the forced-arc idea at the extreme).
- `gap:sourceSinkFlows`, `gap:readNetwork`, `gap:flowValue`, `gap:flowInArc` — short reading and conservation parts.
- `gap:augmentByPath`, `gap:noMorePaths`, `gap:augmentAfterChange`, `gap:arcBound`, `gap:supplyShowThat`, `gap:findCutOfValue` — one-off legacy shapes, built last if at all.
- `routeMax → augment` in the legacy rows needs the augmentation to start from the route flows, which the current `augment` part (which starts from the question's own flow) does not do yet.
