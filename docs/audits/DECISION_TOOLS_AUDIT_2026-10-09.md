# Decision tools — graph audit, rebuild and re-audit (2026-10-09)

Branch `claude/decision-tools-graph-audit-p2o26h` (not merged). Everything below is **dev-gated** (`enabled: false`) except Network Flows,
which stays live: only its Augment flow working changed.

## Read this first (the morning summary)

**What you asked for, and what happened**

| Ask | Result |
|---|---|
| Learn from the Network Flows work and apply it to the other graph tools | Done. MST and TSP were rebuilt on the same ideas (below). |
| Clipping on the step boxes | Fixed in the shell (cause + fix below). |
| Augment flow working (your two to-dos) | Fixed: potentials are labelled **once**, every later beat **reads** them; after each path the potentials **update** and the next path is found on the updated ones. Max flow uses the same rounds. |
| Full audit of the graph tools, AQA check, build out, UI check, re-audit | Done — this file. |
| Don't damage the published Network Flows | All 210 flow tests pass; only Augment flow's working and question wording changed. Nothing else in the flow tool was touched. |

**Which tools are graph-based:** Minimum Spanning Tree and Travelling Salesperson (both rebuilt), Network Flows (Augment fix only). Network
Sandbox is a rendering spike (no questions) and Mixed Strategies is a payoff-matrix tool, not a graph tool — neither was changed.

**What to look at first (all dev-gated, direct URLs)**
- `/minimum-spanning-tree` — three tabs: Kruskal's · Prim's · Prim's on a table. Try `?tool=primMatrix&level=3`.
- `/travelling-salesperson` — Nearest neighbour · Lower bound · Both bounds · Table of least distances. Try `?tool=bounds&level=2`.
- `/network-flows?tool=augment&level=2` — the new Augment flow working.

**Decisions I made that you may want to overrule**
1. **Augment flow now means "augment two or three times in turn"** (potentials updated between paths), not "list every augmenting path of the
   starting flow". That is the only reading of your second to-do that makes the potentials change. The old "every path" list is gone from this
   tab; Max flow still goes all the way to the end. If you want "list all the paths" back as a separate question style, it is a small add.
2. **All weights in an MST question are different**, so the tree and the order of every choice are unique (no tie-break rule needed). Exams
   allow ties; I judged a single correct working more valuable for a class-led worked example. Noted in the info modal.
3. **Complete TSP networks are not drawn to scale** (weights are different numbers from 16–31, and the question says so). Drawn to scale, a ring
   of towns makes the optimal tour, nearest-neighbour tour and lower bound all equal — no interval to find (measured: median gap 0 %).
4. **MST Level 3 is 8 vertices** (not 9) so the table fits on a projector; Levels = graph size, as in Network Flows.
5. AQA site could not be reached from the sandbox (network policy), so the spec check is from the existing exam-board check, AQA mark-scheme
   snippets and secondary sources — **please check the spec wording for the lower bound** (below).

**Bug found and fixed on the way (affects TSP, which was already in the repo):** `generateRandomNetwork` could return a **disconnected**
network (≈1 in 1,000 draws with `maxDegree: 4`) because a spanning-tree edge was refused at a vertex that already had four neighbours. It would
have made the TSP CI test fail at random. The tree now ignores the degree cap; regression test added.

**Next (not built):** Dijkstra, Route Inspection and Critical Path are the AQA graph topics with no tool yet; "find the best lower bound over
every deleted vertex" and "list every augmenting path" are small add-ons. Details at the foot.

---

## 1. What was learned from Network Flows (and where it went)

| Network Flows lesson | Applied to MST / TSP |
|---|---|
| **One fact, one computation.** The working reads numbers off the solver, never recomputes. | `mst.ts` / `tspBounds.ts` hold traces (Kruskal entries with their cycle, Prim candidates, lower-bound tree and links); `mstSolve.ts` / `tspSolve.ts` only format them. Same rule fixed Augment flow (potentials computed once). |
| **Generator builds the question around a clean answer** (flow-first, tie-free). | All weights different (MST); NN tie-free, shortest routes unique, lower-bound tree/links unique (TSP). The generator rejects anything ambiguous. |
| **Independent validation**, not the tool marking its own homework. | `validate.ts` has from-scratch references: Prim and Kruskal order, an exhaustive minimum-spanning-tree search for the lower bound (so a *tie* shows up), Dijkstra tables, and a permutation search proving **lower ≤ optimal ≤ upper** for every Both-bounds question. Plus `mst.test.ts` brute-forces every spanning tree. |
| **Joint label layout** so numbers never touch. | MST networks use `placeEdgeLabels` (labels clear of nodes, edges, each other); generation retries until it succeeds. |
| **Levels are graph size; difficulty dials are options.** | MST: 5–6 / 7 / 8 vertices. TSP: complete / practical / practical with a shortcut. |
| **Question Options** (setting, ask-for, start vertices). | MST: Setting (plain / in context), Ask for (order+weight / weight / order). TSP: Start vertices (one / two), Setting. |
| **Whole-area fullscreen, Show all that returns, phone drawer.** | Inherited from the shell — and checked at 1280×720 and 390 px (below). |
| **Pictures carry the working** (circled flows, potential arrows, the cut line). | New renderers: numbered edges (order chosen), chip lists (sorted edges / candidates / row of distances), matrix columns numbered and rows crossed out, a deleted vertex, purple "edges back" for the lower bound. |

## 2. Audit findings (before) and what was done

### Minimum Spanning Tree (was: 1 template, Kruskal only, 1 level, 6 vertices)
| # | Weakness | Fix |
|---|---|---|
| M1 | One fixed network shape, so every question looked the same | Procedural crossing-free networks (5–8 vertices, 6–15 edges, 150/150 distinct layouts in the sweep) |
| M2 | Kruskal only; AQA marks Prim's too, **including on a table** (June 2025 7367/3D used Prim from a stated start) | Prim's on the network (start vertex given) and Prim's on a table (column numbered, row crossed out) |
| M3 | One level | Three levels = graph size; Level 3 must reject ≥ 3 edges |
| M4 | Ties possible → two correct answers, and no tie-break stated | All weights different |
| M5 | Rejection said only "forms a cycle" | Names the cycle: "A and C are already joined by A–F–C… cycle A–F–C–A", with the tree edges of the cycle lit amber |
| M6 | No picture of the *order* | Chosen edges carry badges 1, 2, 3… |
| M7 | No sorted-edge list, no "pieces so far" | Chip list of all edges in order (added green / rejected struck); "Pieces now: {A,B} {C}…" in each beat |
| M8 | Edge named back to front ("FB") | Edges always named alphabetically ("BF") — test-enforced |
| M9 | No context / ask-for variety | Setting and Ask-for options |
| M10 | Prim's "starts anywhere" never exercised | Start vertex given; Prim's must meet a real choice at ≥ 2 steps and must disagree with Kruskal on order |

### Travelling Salesperson (was: nearest neighbour only, K4–K6 and practical)
| # | Weakness | Fix |
|---|---|---|
| T1 | **No lower bound** (the deleted-vertex method is core to the topic) | Lower bound: delete a vertex, Kruskal on the rest of the table (cycles named), add the two shortest edges; edges back drawn purple |
| T2 | No "interval" question | Both bounds → "57 ≤ optimal ≤ 65" |
| T3 | One start only | Two starts → the better upper bound |
| T4 | No standalone table question | Table of least distances (with the route for each entry) |
| T5 | **Complete networks to scale made every bound equal** | Different weights 16–31 (strict triangle inequality, no ties), "not drawn to scale" stated; bound gap now about 8–20 % |
| T6 | Small networks over-represented (n = 4 in 63 % of Level 1) | Vertex count chosen first; now 21/20/19 for n = 4/5/6 |
| T7 | Table route passing *through the deleted vertex* unexplained | Caption says the value is still the least distance |
| T8 | `generateRandomNetwork` could return a disconnected network | Fixed; regression test |
| T9 | One-line answers only | Setting option (driver, representative, surveyor…) |

### Shell (DecisionShell)
| # | Weakness | Fix |
|---|---|---|
| S1 | **Step boxes clipped.** (a) The scroll box had no top padding, so the ring round the *first/active* step was cut off; (b) a step taller than the box was scrolled to its *bottom*, hiding its first line; (c) fullscreen on a short screen (720 p) gave the answer box ~190 px, squeezed by a big question block | (a) padding and `overflow-x: hidden`; (b) a step taller than the box now scrolls to its **top**, shorter ones keep the end in view; (c) question text shrinks on short screens (`max-height: 820px`) so the box gets ~250 px; long unbroken text wraps |
| S2 | On a phone the zoom pill covered a vertex | The clear band above the picture is now ~46 px on screen, whatever size the picture is drawn |
| S3 | Wide tables could be cut off | Matrix card scrolls sideways |
| S4 | Lists (Kruskal's edges etc.) had nowhere to live, and fullscreen dropped the route/trail cards | New chips card, shown in fullscreen too |
| S5 | Legend / matrix visibility were per tool, not per question type | Per-problem overrides (`legend`, `matrixMode`, `vertexOnlyQuestion`) |

### Network Flows → Augment flow (your two to-dos)
| # | Problem | Fix |
|---|---|---|
| F1 | Step 1 labelled the potentials, then every path step recomputed them (`hi − flow = …`) | Formula appears once (the labelling beat); path beats **read** values off the picture ("SA 2, AD 5, DT 4") — test asserts no subtraction in those beats |
| F2 | After a path was found the potentials did not change | Each augmentation = find the path → smallest potential → **update** (only changed arcs listed, old → new); the next path is found on the updated potentials. Max flow shares the same rounds (it already updated; its duplicate recalculation is gone too) |

## 3. AQA Further Maths (7367, Paper 3 Discrete) check

Source limits: aqa.org.uk is blocked from this sandbox, so this uses the repo's earlier exam-board check, AQA mark-scheme snippets and
secondary notes. **Verify the wording of the TSP lower-bound item against the spec PDF (section 3.5).**

| Spec item (as understood) | Status |
|---|---|
| Solve network optimisation problems using spanning trees — Kruskal | ✅ network |
| — Prim's (seen in AQA 7367/3D mark schemes, e.g. "starting from B") | ✅ network, ✅ on a table |
| TSP: upper bound by nearest neighbour | ✅ one or two starts; complete and practical networks |
| TSP: lower bound by deleted vertex (MST of the rest + two shortest edges) | ✅ — *source for the method is Edexcel notes; AQA wording unverified* |
| Practical → classical via a table of least distances | ✅ incl. a direct edge that a detour beats |
| Interpret the bounds (interval for the optimal tour) | ✅ Both bounds |
| "Best" lower bound over several deleted vertices | ⬜ small add (compare each vertex, take the largest) |
| Network flows, cuts, augmentation | ✅ (Network Flows, live) |
| Dijkstra · Route inspection · Critical path analysis | ⬜ **no tool yet** — recommended next, reuse the same shell |

## 4. Re-audit (second pass, after the build)

Done by: generating and hand-checking whole worked solutions (Kruskal L1, Prim-table L1, TSP lower L2, Both bounds L2, two-start NN L1 — every
number re-derived by hand: all correct); a 150-question sweep per tool/level (generation ≤ 11 ms for MST, ≤ 50 ms for TSP; 0 errors; answers
never over 160 chars so the green "A" line always shows; longest caption 250 chars; longest working 27 steps); 13,500 extra MST generations
for connectivity; screenshots of Kruskal, Prim, Prim-table, lower bound, fullscreen at 1280×720 and a 390 px phone view; full `npm test`
(all pass) and `npm run build` (clean).

Found on re-audit and fixed: comma missing in "starting at D, to find…"; the second nearest-neighbour start repeating the first start's intro;
"CE = 6 = 6" for a one-edge tree; "FB" naming; the rare disconnected network; a rejected edge showing "Edge 5 of 6" (now "Makes a cycle");
the TSP bounds interval too narrow to be interesting at Level 1 (now ≥ 8 % and ≥ 3 apart).

Known and accepted: MST Level 3's Prim-on-a-table working is 16 beats (two per edge, as a teacher writes it); the lists are chips, not
numbered rows; the question picture is not interactive for the table question (vertices only, by design).

## 5. Suggested next steps
1. **Dijkstra** (shortest path — same labels-on-vertices pattern; `nodeStates` badges already render), **Route Inspection** (the generator's
   `routeInspection` mode exists), **Critical Path** (needs the two new views in the plan).
2. TSP: best lower bound over every vertex; tour-improvement is *not* AQA, skip.
3. MST: Kruskal on a table; "which edge could be swapped" extension; allow tied weights as an advanced option with a stated tie-break.
4. Network Flows: supersource / supersink, node restrictions (already agreed); an "all augmenting paths" question style if wanted.
5. Teacher check on a real phone for all three tools.
