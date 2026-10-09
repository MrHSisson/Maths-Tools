# Route Inspection (Chinese postman) — Decision Maths

**Status:** implemented (dev-gated, `enabled: false`). Tool: `src/tools/Decision/RouteInspection.tsx` · maths `src/shared/decision/routeInspection.ts` · working `routeInspectionSolve.ts` · independent reference `referenceRoute` in `validate.ts` · tests `src/tests/routeInspection.test.ts`.

## What it teaches
Edexcel D1 / AQA Further Maths (Discrete): degrees and odd vertices, Eulerian / semi-Eulerian, and the shortest route that uses every edge at least once.

## Question types (sub-tools)
| Tab | Question | Answer |
|---|---|---|
| Degrees & type (`routeClassify`) | Find every degree, the odd vertices, and say Eulerian / semi-Eulerian / neither | number of odd vertices and the type |
| Closed route (`routeClosed`) | Shortest route that starts and finishes at X and uses every edge at least once | length (+ the routes repeated) |
| Start and finish (`routeOpen`) | …starting at X and finishing at Y (two odd vertices) | length (+ the routes repeated) |

## Levels (graph size) and options
- Level 1: 5–6 vertices · Level 2: 7 · Level 3: 8. Networks come from the graph bank (`GRAPH_POLICY.routeInspection`: planar, 5–8 vertices).
- **Odd vertices** option: any (2 or 4; Degrees & type also draws 0) / two / four. **Setting** option (route tabs): plain / in context (postman, gritter, inspector, street cleaner).
- Above Level 1 at least one pair of odd vertices has a shortest connection that is NOT the edge joining them.

## Correctness
- The cheapest pairing of the odd vertices is unique and each repeated route is the unique shortest route (so the picture of repeated edges is unambiguous).
- Hand-worked reference (in `routeInspection.test.ts`): odd vertices A, B, D, E; pairings AB+DE = 7, AD+BE = 14, AE+BD = 14; total weight 38 → route 45; open A→B → 41.
- Every working ends with an actual route (Hierholzer over the network plus the repeated routes) whose length equals the answer.

## Working
Total weight → degrees / odd vertices (amber, degree on the shoulder) → shortest connection between each pair → every pairing with its cost (cheapest green) → repeated edges (purple) → total and one route.
