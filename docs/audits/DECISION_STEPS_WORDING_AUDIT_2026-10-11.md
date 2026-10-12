# Decision tools — step wording audit (2026-10-11)

**Ask:** across the Decision tools the worked-solution steps are too wordy, and the diagram already does a lot of the job. Long
captions put people off reading them; the set notation in MST is unnecessary (you can see what is joined). Audit the steps and find
where wording can be condensed and where the diagram already says it.

**Scope:** Minimum Spanning Tree (Kruskal, Prim network, Prim table), Travelling Salesperson (table, nearest neighbour, lower bound,
both bounds), Route Inspection, Network Flows (all eight question styles), Mixed Strategies. Network Sandbox has no steps.
**Status: implemented (2026-10-11)** after Harry's answers — definitions behind an underlined-term glossary, Flows reinterpret/balance checks collapsed to one line, Prim on a table merged at Levels 2–3. (The findings below are kept as the record; the augmentation merge went to two beats per round — path with its smallest potential, then the update — instead of one, so the diagram keeps showing the potentials before and after.) Word counts are from real generated solutions (Levels 1 and 3,
all sub-tools; Network Flows at Level 2); the "after" figures are estimates from the proposed wording.

---

## Read this first

| Tool / sub-tool | Steps | Words today | Longest step | Estimated after |
|---|---|---|---|---|
| MST · Kruskal (L3) | 12 | 438 | 57 | ~130 |
| MST · Prim, network (L3) | 9 | 346 | 88 | ~120 |
| MST · Prim, table (L3) | 18 | 574 | 91 | ~190 |
| TSP · both bounds (L3) | 29 | 1,082 | 91 | ~420 |
| TSP · table of least distances (L3) | 7 | 315 | 74 | ~90 |
| Route Inspection · closed (L3) | 6 | 275 | 55 | ~110 |
| Network Flows · max flow | 12 | 466 | 82 | ~200 |
| Network Flows · node capacities | 15 | 669 | 88 | ~300 |
| Network Flows · supersource / supersink | 12 | 501 | 80 | ~220 |
| Mixed Strategies (L3) | 12 | ~330 | 39 | ~230 |

A typical step is 25–40 words; the worst are 80–100. About **60% of the words can go** without losing a fact a student needs, because
they repeat something a chip row, badge, trail or the picture already shows.

### Why they are long — five causes, in order of how many words they cost

1. **The caption restates what is already on screen.** Every beat already has a *phase badge* ("Edge 3 of 5"), a *chip row* (edges in
   order, edges on offer, odd-vertex distances, pairings), a *running-total badge* ("Weight so far"), a *route trail* (the tour so far)
   and a *picture* (edges coloured accepted / rejected, tree edges highlighted, cells highlighted, labels drawn). Captions then say all
   of it again in a sentence.
2. **Every sub-tool opens by re-teaching the algorithm** (40–60 words), though the question prompt already names the method and the
   class know it.
3. **Every sub-tool closes by re-summarising the working** — the edges again, the sum again, plus a commentary sentence.
4. **Lead-in boilerplate** on every beat — "Consider X, the next smallest edge.", "Every step has a potential above 0:", "Now interpret…".
5. **One beat per tiny sub-step.** A single decision is spread over two or three presses (Prim table: look, then choose; Flows: path,
   then minimum, then update), so the class presses more and reads the same context repeatedly.

### Proposed house style (for `docs/architecture/DECISION_SHELL_PLAN.md` → Shell UX, if you agree)

- **A caption is what a teacher would write on the board**: a number, a small equation or one short phrase. Typical ≤ 12 words, never > 25.
- **Never restate** what a chip row, badge, trail or the diagram shows. If the picture shows it, the caption points at the decision, not the data.
- **One beat = one decision.** Merge "look" and "choose" into a single beat.
- **First beat is one line**; any definition ("a piece is…", "a cycle is…") goes behind an (i) / teacher note, not into the step.
- **Last beat = result only**: the answer and the one sum that makes it. No commentary, no comparison with another method.
- **Boilerplate is said once** (first augmentation, first row) and then dropped.

---

## Findings by tool

### 1. Minimum Spanning Tree

**The set notation (your example) — `mstSolve.ts:76` and the "Pieces now" line.** Every Kruskal step writes
`C is in {C} and E is in {E}: different pieces, so adding CE makes no cycle. Add it.` and then `Pieces now: {A} {B} {C, E} {D} {F}`.
The picture already shows which edges are in the tree, so which vertices are joined is visible; the piece lists get longer as the
tree grows (the Level 3 steps carry `{A, B, C, D, E, F, G, H}`) and are the main reason Kruskal steps reach 35–42 words.

| Today | Proposed |
|---|---|
| Consider CE (3), the smallest edge. C is in {C} and E is in {E}: different pieces, so adding CE makes no cycle. Add it. Pieces now: {A} {B} {C, E} {D} {F} (33 w) | **CE (3): add.** (3 w) |
| Consider CD (8), the next smallest edge. C and D are already joined by C–E–D, so adding CD would make the cycle C–E–D–C. Reject it. (25 w) | **CD (8): C–E–D already joined → cycle. Reject.** (9 w) |
| Intro: Kruskal's algorithm. List the edges in order of weight (smallest first). Take them in turn, adding an edge to the tree unless it would form a cycle. Stop when the tree has 5 edges (one fewer than the 6 vertices). (40 w) | **Smallest edge first; add it unless it makes a cycle. Stop at 5 edges.** (14 w) |
| Result: The tree has 5 edges (one fewer than the 6 vertices) and joins every vertex, so it is a minimum spanning tree. Edges in the order chosen: … Total weight = … BC, AB were never needed. (51 w) | **5 edges, all vertices joined. Order: CE, BD, DF, DE, AC. Total = 3 + 4 + 5 + 6 + 15 = 33.** (22 w) |

- "Consider … the next smallest edge" is also shown by the chip row (current edge highlighted) and "Edge 3 of 5" (phase badge) — drop it.
- "BC, AB were never needed" adds nothing; drop it.
- Keep the cycle path (`C–E–D`) on rejects: it is the one thing the picture does *not* name.
- Keep set notation **nowhere** in MST. (It is a good idea only if a spec/exam asks for components — it does not here.)

**Prim, network — `mstSolve.ts:143`.** `Tree: {B, D, E}. Edges joining the tree to a new vertex: CD 6, CE 13, BC 17, AB 19.` is the
chip row ("Edges on offer") written out a second time, with the tree as a set the picture already highlights.

| Today | Proposed |
|---|---|
| Tree: {B, D, E}. Edges joining the tree to a new vertex: CD 6, CE 13, BC 17, AB 19. The smallest is CD (6): add CD, bringing in C. (30 w) | **Smallest on offer: CD (6) → C.** (7 w) |
| Intro (43 w) | **Start at E. Add the smallest edge from the tree to a new vertex, until all 5 are in.** (19 w) |
| Result ends with *"Every edge chosen touched the tree already built, so the tree grew outwards from E. Kruskal's algorithm would give this same tree … but the edges would be added in a different order."* (79 w step) | **Result only (≈ 20 w).** Move the Kruskal comparison to a teacher note, or drop it. |

**Prim on a table — `mstSolve.ts:199`, `:217`.** Two beats per edge (*look*, then *choose*); the look beat lists every entry
(`CD 6, ED 13, BD 18 (row then column)`) though the table already highlights the candidate cells; the choose beat's "Weight so far 6"
duplicates the running-total badge.

| Today (two beats, 51 w) | Proposed (one beat) |
|---|---|
| Numbered columns: A, C, D. Entries in rows that are not crossed out: FA 5, FC 10, BA 11, ED 13, BD 18 (row then column). The smallest is 5, in row F, column A. / Choose AF (5): write 4 above column F and cross out row F. Add AF to the tree. Weight so far 15. | **Smallest: 5 (row F, column A). Number F 4, cross out row F. Add AF.** (≈ 15 w) |

L3 goes from 18 beats to 9 beats and ~574 → ~190 words. The "write 4 above column F and cross out row F" action stays — that *is* the
algorithm on a table — but the entries list goes.

### 2. Travelling Salesperson

**Table of least distances — `tspSolve.ts:82`, `:107`.** One beat per row, with one sentence per cell. Direct edges, the common case, are
the longest and least informative: `AB: the direct edge, 5, is the shortest route (nothing through other vertices is shorter). Enter 5.`
Level 3 has 15 cells ⇒ ~280 words for a table whose interesting entries are the three or four **indirect** ones.

| Today | Proposed |
|---|---|
| Intro (42 w) + five row beats (91 + 74 + 55 + 40 + 19 w) | **Beat 1 — "Direct edges go straight in."** (table fills; ≈ 6 w) **Beat 2 — only the indirect entries:** `AD = A–B–D = 5 + 15 = 20`, `AE = A–F–E = 9 + 21 = 30`, `BC = B–A–C = 16`, … (one line each). Entries where the direct edge is *not* shortest keep the "shorter route" note (`DE: D–C–E = 18, not 30`). |

≈ 315 → ~90 words. (If you want to keep the row-by-row rhythm for Level 1 only, that is a one-line condition.)

**Complete network beat — `tspSolve.ts` (63 w).** The triangle-inequality sentence is theory the picture and the table do not need at this
moment. → **"Draw the table as a complete network (new or changed edges purple)."** Triangle inequality → teacher note.

**Nearest neighbour — `tspSolve.ts:180`.** `In row F, the smallest entry to an unvisited vertex is 9, to A. Travel F → A. Running total 15.` (21 w) ×6.
The route trail already shows the tour so far and the badge the running total. → **`F → A (9)`** (4 w). The closing beat
("Nearest-neighbour tour: …, total 76. This is an upper bound — the optimal tour is no longer than 76. Next, interpret this tour as a route in
the original network.", 43 w) → **"Upper bound: 76."** The "Now interpret…" lead-in (81 w) → list **only the legs that differ**
(`E → C: E–F–C (27)`); direct legs are in the trail.

**Lower bound, Kruskal sub-run — `tspSolve.ts` (≈ 9 beats, ~270 w).** It repeats the full MST/Kruskal wording (`Consider AC (11), the next
smallest edge. A and C are already joined by A–F–C, so adding AC would make the cycle A–F–C–A. Reject it.`). → Reuse the **MST micro-captions**
(`AB (5): add` / `AC (11): A–F–C already joined → reject`), or collapse to one beat (**"MST of the other 5: AB 5, CF 6, AF 9, EF 21 = 41"**)
with the chip row and picture showing the accepted edges.

| Today | Proposed |
|---|---|
| Lower bound = tree + the two edges at D = 41 + 29 = 70. The optimal tour is at least 70: whatever tour is chosen, take D out and what is left joins the other vertices (at least 41), and the tour enters and leaves D by two edges (at least 29). (54 w) | **Lower bound = 41 + 29 = 70.** The justification sentence goes behind an (i) / teacher note. |
| Step intro: Lower bound. Delete vertex D and all its edges. Find a minimum spanning tree of the other 5 vertices using the table of least distances, then add the two shortest edges from D back in. (35 w) + "Step 1: a minimum spanning tree … by Kruskal's algorithm …" (39 w) + "Step 2: put D back …" (42 w) | One line per stage: **"Delete D. MST of the rest."**, **"Put D back: two shortest edges, DE 14 + DB 15 = 29."** |

Whole both-bounds Level 3 solution: 29 beats / 1,082 words → ~16 beats / ~420 words.

### 3. Route Inspection

| Step | Today | Proposed |
|---|---|---|
| Total weight (`routeInspectionSolve.ts:75`) | Every edge has to be used at least once, so the route is at least as long as all the edges added up: 9 + 11 + … = 96. Total weight of the network = 96. (51 w) — the total is stated **twice** | **Total weight = 9 + 11 + … = 96.** (≈ 20 w, mostly the sum) |
| Odd vertices (`:55`) | A route that uses each edge exactly once needs every vertex to be even (apart from the start and finish of an open route). Find the degrees: A: 2, B: 3 … The odd vertices are B, C, E and H: four of them. (55 w) | The picture already rings odd vertices with their degree. → **Odd vertices: B, C, E, H.** (6 w) The Euler explanation goes behind (i). |
| Shortest connections (`:133`) | Lead-in sentence + six lines `BC = 20 (B–A–C) …` (47 w) **and** a chip row listing the same six | Drop the six lines; the chip row carries them. → **"Shortest route for each pair."** |
| Pairings (`:144`) | "3 ways to pair…" + three sums + "The cheapest is…" (52 w) **and** a chip row of the same sums | → **"Cheapest pairing: BE + CH = 25."** |
| Repeat these edges | These edges (BE, CF, FH) will be used twice, so every vertex is now even. Extra distance = 4 + 21 = 25. (31 w) | **Repeat B–E and C–F–H: +25.** (≈ 8 w) |
| Length | Every vertex is now even, so a route can use every edge (the repeated ones twice) and return to its start. Length = 96 + 25 = 121. A route …: F–C–A… (39 w) | **Length = 96 + 25 = 121.** Route: F–C–A… (keep the route; it is asked for) |
| Open route, "Start and finish" | 48 w explaining why starting and finishing at the odd vertices repeats nothing | **Only E and A are odd: start at one, finish at the other. Nothing repeated.** (≈ 15 w) |
| Classify, conclusion | 4 vertices are odd (more than two), so the network is neither Eulerian nor semi-Eulerian: no route can use every edge exactly once. Some edges must be repeated — that is the route inspection problem. (35 w) | **4 odd vertices: neither Eulerian nor semi-Eulerian.** |

Closed Level 3: 275 → ~110 words.

### 4. Network Flows

**Augment / Max flow / Node capacities / Supersource — three beats per augmentation — `flowSolve.ts:216` and friends.**
Path → minimum → update. The update beat (67–76 w) lists every changed arc as `SA: increase 3 → 1, decrease 4 → 6` and ends *"All other potentials are
unchanged."* The diagram redraws those numbers on the path.

| Today (3 beats, ~110 w) | Proposed (1 beat, ≈ 18 w) |
|---|---|
| Augmentation 1. A flow-augmenting path: S → A → D → T. Every step has a potential above 0: SA 3, AD 6, DT 2. / Augmentation 1. The flow can be increased by the smallest potential on the path. min(3, 6, 2) = 2 / Augmentation 1. Update the potentials along the path: on each step along an arrow the potential increase goes down by 2 and the potential decrease goes up by 2. SA: increase 3 → 1 … All other potentials are unchanged. The flow value is now 14. | **Path S → A → D → T: potentials 3, 6, 2. Increase by 2 → flow 14.** The potential changes are drawn on the diagram (old value struck through, as `prevFlow` already does for flow circles) instead of written out. First augmentation only: one line "increase decreases by 2, decrease increases by 2 along the path". |

That halves Max flow from 12 beats to about 6 and removes ~230 words. **Needs one small picture change:** show old potentials struck through
beside the new ones on the path (the flow circles already do this).

| Beat | Today | Proposed |
|---|---|---|
| Final potentials (`:254`, 82 w) | Lists all ten arcs' `increase, decrease` | The diagram shows them. → **"No path reaches T. Reached from S: {S, A, B, D}. Flow is maximal."** |
| Reinterpret as flows (`:256`, 78 w) | Ten lines `SA: 7 − 1 = 6` | Show the flow circles on the diagram; **"Flow = capacity − potential increase. Max flow = 15."** (Keep a compact list only if the specification wants the working shown.) |
| Opening beats | "The flow shown has value 12. Keep finding flow-augmenting paths until there are none left." + "Label the potentials…" (31 w) | One beat: **"Label the potentials, then augment until no path is left."** (≈ 10 w) |
| Cut (`:262`) | Cut {S, A, B, D} \| {C, E, T}: forward arcs BC, BE, DC, DT, 4 + 5 + 2 + 4 = 15. Capacity of the cut = 15. (30 w) | Keep the sum; drop the repeated words → **Cut: BC + BE + DC + DT = 4 + 5 + 2 + 4 = 15.** The S-side is already shaded. The set notation can stay *here* (exams ask for the cut) but only once. |
| Closing (23 w) | The flow of 15 equals the capacity of a cut, 15. By the maximum flow – minimum cut theorem, the flow is maximal. | **Flow 15 = cut 15, so maximal.** |

**Node capacities — `flowSolve.ts:316`.** The first two beats (57 + 64 w) restate the prompt (`Vertex B has a maximum throughput of 6: no more than 6 can flow
through it …`) and the "max 6" tags drawn on the vertices. → **"Split B and A in two: B₁ takes the arcs arriving, B₂ the arcs leaving, joined by an arc of
capacity 6."** (one beat, ≈ 20 w). The sentence "An arc's capacity limits the flow along it, but a vertex has no such limit…" is useful once → (i).

**Supersource / supersink — `flowSolve.ts:289`.** Beat 2 (80 w) lists every new arc and every new flow (`S → S₁ = 1, S → S₂ = 8, T₁ → T = 1 …`); the picture draws the new arcs.
→ **"Add supersource S → S₁, S₂ and supersink T₁, T₂ → T, capacities = supplies and demands."** (≈ 15 w).

**Find a flow — `flowSolve.ts:39`, `:67`.** "Method: choose a route from S to T with spare capacity, and send as much as it will carry … but no more than is still needed. Repeat …"
(44 w) → **"Send flow along routes S → T until the value is 7."** The balance check (63 w; four lines `A: in 2 = 2, out 0 + 0 + 2 = 2`) → **"Check in = out at A, B, C, D ✓."** and, if you want
the working visible, a single toggle ("Show check").

**Already tight — leave alone:** Missing flow (3 beats, 70 w), Cut values (4 beats, 70 w) and Flow from potentials (7 beats, ≤ 37 w each) are close to the house style.

### 5. Mixed Strategies (ToolShell)

Mostly concise already (12–35 w), but the saddle-point test is three beats and the algebra has a trivial "collect the terms" beat:

- Merge **Smallest entry in each row…**, **Largest entry in each column…**, **Maximin < minimax, so there is no saddle point…** into one beat:
  *"Row minima −3, −4 → maximin −3. Column maxima 0, 5 → minimax 0. −3 < 0: no saddle point."* (3 beats → 1)
- Merge **Collect the p terms** into **Solve for p** (the equation line shows both).
- Level 3: the sentence *"This lies above the value, so Colin never plays C₂ — the graph was needed to see it"* → **"C₂ is above the value: never played."**

---

## Where the diagram can take over (summary)

| Information | Already on screen as | Step wording to remove |
|---|---|---|
| Which edges are in the tree / which vertices are joined | edge colours (accepted / rejected / current) | MST pieces `{A, B}…`, "is in … and … is in …", "Tree: {…}" |
| Candidate edges (Prim), sorted edges (Kruskal), odd-vertex distances, pairings | chip row under the picture | the same list written in the caption |
| Candidate entries (Prim table) | highlighted table cells | `ED 13, BD 18 (row then column)` |
| "Edge 3 of 5", "Weight so far 15", "Running total 49" | phase badge, running-total badge | the same words in the caption |
| Tour so far | route trail | "Running total…", leg-by-leg sentence |
| Odd vertices and their degrees | ringed vertices with degree | "A: 2, B: 3 …" list, "four of them" |
| Potentials after an augmentation, final potentials | arc labels | per-arc `3 → 1` lists, "all other potentials are unchanged" |
| Flows after reinterpretation | flow circles | ten `capacity − potential = flow` lines |
| Restricted vertices, supplies and demands | "max 6" / "supply 7" tags | the prompt restated in beat 1 |
| Cut S-side and crossing arcs | shaded S-side, cut line | repeated set `{S, A, B, D}` |

## Suggested order of work

1. **MST Kruskal + Prim** (smallest change, your explicit example; one file, `mstSolve.ts`).
2. **TSP table + nearest neighbour + lower bound** (biggest saving; Kruskal sub-run can reuse the MST wording).
3. **Route Inspection** (small, mostly deletions).
4. **Network Flows** (the augmentation merge needs the "old potential struck through" picture change first).
5. **Mixed Strategies** merges.

Each step is a text change in a `*Solve.ts` file plus the tests that quote captions (grep the tests before changing), so it is low risk; the
only picture work is the struck-through potentials in Flows.

## Decisions for you

1. Are you happy for the **definitions** (what a cycle is, why odd vertices need repeating, the lower-bound justification, the triangle inequality, Kruskal vs Prim)
   to move behind an (i) / teacher note rather than disappear? (I'd keep them somewhere because they are what a student asks next.)
2. **Flows reinterpret-as-flows list** and **Find-a-flow balance check:** exam mark schemes show this working. Collapse to one line and show the numbers
   on the diagram (recommended), or keep a compact table?
3. Should the **Prim table** keep the two-beat rhythm for Level 1 (teaching) and merge only at Levels 2–3?
