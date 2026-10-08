# Tool Spec: Network Flows

**Status:** in progress — potentials, cut values, augment flow and max flow & min cut are built (`enabled: false`); **initial flow** and print are still to do. <!-- draft → ready → implemented. -->

Built on **`DecisionShell`** (`src/shared/decision/`), not `ToolShell` — see
`docs/architecture/DECISION_SHELL_PLAN.md`. This is a **Decision Maths** tool (D2 network flows), so the
template's ToolShell-specific parts (`TOOL_CONFIG`, `INFO_SECTIONS`, `__test`) map onto the
Decision-shell equivalents named in section 7.

---

## 1. Overview

| Field | Value |
|---|---|
| Tool name | Network Flows |
| Tool id / URL path | `/network-flows` |
| Category | Decision Mathematics (`src/tools/Decision/NetworkFlows.tsx`) |
| Card description | Find initial flows, cut values, potentials and flow-augmenting paths on a capacity or minimum/maximum network, walked through step by step. |
| Registry | `enabled: false` until reviewed (Dev badge), like the other Decision tools |
| Defaults | standard where the shell supports it (see §7 for the shell work this needs) |

**Pedagogical intent.** After a lesson a student can: write down a feasible flow on a network (including
one that must meet *minimum* arc values); find the capacity of a cut, including the backward-arc rule;
label the **potential** (spare room) in both directions on every arc; and use the labelling procedure to
find a flow-augmenting path and update the flow. It follows route-finding / critical path in the D2
sequence and leads straight into max-flow min-cut, supply/demand and LP.

**Several network styles.** Questions are drawn from **five authored network templates** taken from the
textbook shapes — Diamond, Fan, Ladder, Hexagon and the Big network (S, A–F, T, two crossing pairs) — by
varying the bounds, the flow and (Big network only) which arcs are reversed. Smaller shapes are used at
lower levels (§3.2). More styles are added by authoring one entry in `flowTemplates.ts`.

---

## 2. Sub-tools

| Key | Tab label | Kind | Instruction line |
|---|---|---|---|
| `initialFlow` | Initial flow | diagram | "Find a feasible flow:" / "Write the flow in each arc:" |
| `cutValue` | Cut values | diagram | "Find the capacity of the cut:" |
| `potentials` | Potentials | diagram | "Label the potentials on each arc:" |
| `augment` | Augment flow | diagram | "Find a flow-augmenting path:" |
| `maxFlow` | Max flow & min cut | diagram | "Find the maximum flow:" |

**Build order** (each increment ships green): ① shell extensions + solver + `potentials` →
② `cutValue`, `augment` → ③ `initialFlow` → ④ `maxFlow`. Increment ① alone is a usable tool.

---

## 3. The network (shared by every sub-tool)

### 3.1 Vocabulary (use these words on screen)

- **Capacity-only network** (`cap`): each arc has one number, its **capacity** (upper bound); every minimum is 0.
- **Minimum/maximum network** (`minmax`): each arc is labelled `min, max`, as in the textbooks (`2, 10`).
- A **flow** puts an integer on every arc, shown **circled**, with: every arc between its min and max;
  at every node except S and T, flow in = flow out. **Flow value** = total leaving S.
- **Potentials** on an arc with bounds `(lo, hi)` carrying flow `f`:
  - **forward potential** = `hi − f` (how much more can be pushed along the arrow);
  - **backward potential** = `f − lo` (how much can be taken back, against the arrow).
  - For a capacity-only network `lo = 0`, so backward potential = `f`.
- **Flow-augmenting path** (S→T): every forward step has forward potential > 0, every backward step
  (against an arrow) has backward potential > 0. Its **bottleneck** = smallest potential on the path;
  augmenting adds the bottleneck on forward steps and subtracts it on backward steps.
- **Cut**: a partition of the nodes into an S-side set containing S and a T-side set containing T.
  **Capacity of a cut** = (sum of **max** on arcs going S-side → T-side) **−** (sum of **min** on arcs going
  T-side → S-side). For capacity-only networks the second sum is 0 (backward arcs are ignored — still
  taught explicitly, see misconceptions).
- **Max-flow min-cut theorem**: value of any flow ≤ capacity of any cut; equality ⇒ both are optimal.

### 3.2 The templates (`src/shared/decision/flowTemplates.ts`)

Each template fixes the **topology and layout only** (node positions, arc list, declared crossings, where each
arc's labels sit); bounds and flows are sampled per question (§3.3). A level draws a random template from its list.

| Template | Nodes | Arcs | Crossings | Used at |
|---|---|---|---|---|
| Diamond | S, A, B, T | SA SB AB AT BT | none | Level 1 |
| Fan | S, A, B, C, T | SA SB SC AB BC AT BT CT | none | Levels 1–2 |
| Ladder | S, A, B, C, D, T | SA SB AB AC AD BD CD CT DT | none | Level 2 |
| Hexagon | S, A–E, T | SA SB AC AD BC BE CT DT ET | none | Levels 2–3 |
| Big network | S, A–F, T | SA SB AC AD BC BD CE CF DE DF ET FT | **AD×BC, CF×DE (declared)** | Level 3 |

Arcs run left to right; in the Big network the four cross arcs (AD, BC, CF, DE) are **flippable** (Level 3
reverses up to two, keeping the network acyclic). CI checks that exactly the declared crossings cross, geometrically.
Arc labels sit near the **tail** (bounds), the **head** (circled flow) and mid-arc (potentials); a flipped arc
mirrors these so labels keep their physical place. The §5 reference network N0 is the Big network.

### 3.3 Generation algorithm (every sub-tool)

1. Pick a template for the level; for the Big network at Level 3, flip up to two flippable arcs (retry if cyclic).
2. **Build a feasible flow first** by pushing 3–5 random S→T paths (amounts 1–6; arc flow ≤ 15; value 8–24), then
   **derive the bounds around it** so a feasible flow always exists:
   - `hi = flow + slack` (slack 0–6; at least a quarter of the used arcs have slack 0); unused arcs get `hi` 2–8;
   - `minmax`: `lo` ∈ [1, flow] on ~45 % of used arcs (≥ 2 arcs), else 0; `cap`: `lo = 0` everywhere.
3. Apply the sub-tool/level constraints (§4) by rejection sampling; the solver (§6) is the only source of answers.

**Network type default:** Level 1 → capacity-only; Levels 2–3 → min/max. A teacher can switch either way at any
level (constraints that only make sense with minimums are dropped in capacity-only).

---

## 4. Sub-tool detail

### Shared QO (all sub-tools)

- **dropdown** `bounds` — "Network type": `cap` "Capacity only" · `minmax` "Min and max". Default per level as above.
- **variables:** `showFlow` — "Show flow on arcs" (on where a flow is given; ignored where the answer *is* a flow).
- Everything else is per sub-tool.

**Differentiated worksheet:** Level 1/2/3 columns each use their own level defaults above.

---

### Sub-tool: Potentials (`potentials`)

A flow is **given** (circled on every arc). Student writes the forward and backward potential on every arc.

#### QO
- multiSelect `scope` — "Label": `all` "Every arc" (default) · `path` "Arcs on one path S→T only (3–5 arcs)".
- Per level: Level 1 default `all`; Levels 2–3 default `all`.

#### Levels
- **Level 1:** capacity-only, smaller networks (§3.2). Constraints: no arc has flow 0 or flow = capacity
  more than twice (so both potentials are mostly non-zero and non-trivial).
- **Level 2:** min/max, 10–12 arcs. Constraints: ≥ 2 arcs have a non-zero minimum that the flow exceeds
  (so backward potential `f − lo ≠ f`) and ≥ 1 arc at its maximum (forward potential 0).
- **Level 3:** min/max, full network with flips. Constraints: ≥ 1 arc at its minimum (backward potential 0)
  **and** ≥ 1 flipped arc carries flow.
- **Exclusions (all):** no arc where forward and backward potentials are both 0 (that needs `lo = hi = f`).
- **Misconceptions targeted:** forward potential taken as `hi` or as `hi − lo` (ignoring flow);
  backward potential taken as `f` instead of `f − lo` in a min/max network; potentials written the wrong way
  round on a flipped arc.

#### Display
The diagram shows the network with `lo, hi` (or capacity) labels and the circled flow. Student answer:
**two small numbers per arc** beside it — forward number near the arrowhead side, backward number on the
tail side, in a different colour (forward blue, backward orange — the textbook uses blue). Answer
reveal draws those numbers on the diagram.

#### Worked example script (one step per arc group; fragments author per arc)
Per arc (reading arcs left to right as `SA, SB, AC, …`):
1. `mStep("Arc SA: forward potential is maximum minus flow:", ["10 - 8", "= 2"])`
2. `mStep("Backward potential is flow minus minimum:", ["8 - 2", "= 6"])`
Whole-network beat: label all arcs of the same column together (S, A/B, C/D, E/F) so the stepper has
≈ 4–5 beats, not 24.

---

### Sub-tool: Cut values (`cutValue`)

#### QO
- variables: `showCutLine` — "Draw the cut line": default **on** at Levels 1–2, **off** at Level 3 (the
  cut is then given only as a set of nodes).
- multiSelect `cutKind` — "Cut types": `forwardOnly` "Forward arcs only" · `withBackward` "Includes backward arcs" · `minimal` "A minimal cut". Level 1: `forwardOnly` only; Level 2: `forwardOnly` + `withBackward`; Level 3: all three.

#### Levels
- **Level 1:** capacity-only, reduced network. A cut S-side set is drawn; every arc crossing it goes S→T
  (no backward arc). Student adds the capacities of the crossing arcs.
- **Level 2:** min/max (default). The cut crosses **at least one backward arc with a non-zero minimum**.
  Student computes `Σ max(forward) − Σ min(backward)`.
- **Level 3:** the cut is described by the S-side node set only (e.g. "the cut that separates {S, A, B, D}
  from {C, E, F, T}"). May include flipped arcs. Student must work out which arcs cross and in which direction.
- **Constraints (all):** cut capacity between 12 and 45; the S-side set is a "sensible" cut (S-side contains
  ≥ 2 nodes and the T-side ≥ 2 nodes — never `{S}` or `{T}` alone).
- **Misconceptions targeted:** counting all arcs touching the cut, including backward ones, **added** instead
  of subtracted; subtracting the *maximum* of the backward arcs (not the minimum); using flow instead of capacity.

#### Display
Cut drawn with the **S-side nodes shaded**, a **red tick on every arc crossing the cut**, and a dashed red
curve through the ticks if that renders cleanly (v1 may omit the dashed curve — the shading and ticks are
the contract). The cut's named set is stated under the diagram: "Cut {S, A, B} | {C, D, E, F, T}".
Answer reveal annotates each crossing arc: forward in green (`+max`), backward in orange (`−min`).

#### Worked example script
1. `tStep("The cut separates {S, A, B} from {C, D, E, F, T}.")`
2. `mStep("Arcs going from the S side to the T side (forward) — add their maximums:", ["8 + 5 + 7 + 12", "= 32"])`
3. `mStep("Arcs coming back from the T side (backward) — subtract their minimums:", ["32 - 6", "= 26"])`
   (omit this step when there are no backward arcs — never write a vacuous step)
4. `mStep("Capacity of the cut:", "26")`

---

### Sub-tool: Augment flow (`augment`)

A feasible, non-maximal flow `f0` is **given**. Student finds a flow-augmenting path and the amount, and
(Level 2+) writes the updated flow.

#### QO
- multiSelect `show` — "Help shown": `potentials` "Potentials on the diagram" (default **on** at Level 1, off at Levels 2–3) · `circles` "Flow on the diagram" (always on).

#### Levels
- **Level 1:** capacity-only. **Exactly one** flow-augmenting path exists (verify by exhaustive search in
  the residual network) and it uses **forward arcs only**. Potentials are shown on the diagram. Student
  states the path and how much the flow can increase.
- **Level 2:** min/max. One to three augmenting paths exist; answer = "any valid path"; the worked example
  shows the **canonical** one (breadth-first labelling, nodes tried alphabetically, §6). Student states the path,
  the increase, and the **new flow value**.
- **Level 3:** min/max, **the path must use at least one backward step** (and a unique path exists).
  Student states the path, the increase, and the new flow on **each arc of the path**.
- **Constraints (all):** bottleneck ≥ 2; flow value after augmenting ≤ max flow (always true); `f0` valid.
- **Misconceptions targeted:** using forward potential on a backward step; adding the bottleneck to every arc
  of the path (instead of subtracting on backward steps); taking the largest potential rather than the
  smallest (bottleneck); including an arc whose potential is 0.

#### Display
Network with `lo, hi` labels and circled flow `f0`. Answer reveal highlights the path in green (backward
steps drawn dashed and arrowed against the arc) and writes the new flow beside each path arc.

#### Worked example script — reference network N1 (§5), flow f0
1. `mStep("Label the potentials:", …)` (potential-snapshot beat — the diagram shows them; no maths line needed → `tStep`)
2. `mStep("Find a path from S to T using only arcs with potential greater than 0:", "S \\to A \\to D \\to E \\to T")`
3. `mStep("The bottleneck is the smallest potential on the path:", ["\\min(2, 8, 2, 4)", "= 2"])`
4. `mStep("Add 2 to every forward arc on the path:", "SA: 8 \\to 10, \\quad AD: 0 \\to 2, \\quad DE: 0 \\to 2, \\quad ET: 8 \\to 10")`
   (a backward step adds `Subtract 2 from every backward arc …`)
5. `mStep("New flow value:", ["15 + 2", "= 17"])`

---

### Sub-tool: Initial flow (`initialFlow`)

#### QO
- multiSelect `style` — "Question style": `paths` "Given paths" · `findFlow` "Find any feasible flow".
  Level 1: `paths` only. Level 2: `paths` + `findFlow`. Level 3: `findFlow`.
  (`findFlow` is only meaningful on a min/max network; on a capacity-only network it asks for a flow of a stated value instead — see below.)

#### Levels
- **Level 1 (`paths`, capacity-only):** "Take an initial flow of **a** along `SACET`, **b** along `SBDFT`."
  Student writes the resulting flow on every arc (arcs used by both paths add). 2 paths, no shared arc.
- **Level 2:** `paths` with 3 paths where **two paths share an arc** (flows add; the sum must not exceed the
  capacity — guaranteed by construction) **or** `findFlow` on a min/max network with ≤ 2 forced-flow arcs.
- **Level 3 (`findFlow`, min/max):** "Find a feasible flow." Every arc's minimum must be met; the network is
  feasible by construction (§3.3) but the minimums force flow through **both** branches and ≥ 2 shared arcs.
  *Capacity-only variant:* "Find a flow of value *V* on this network" with `V` = ⌈70%⌉ of the maximum flow.
- **Answer note:** `findFlow` has **many valid answers**. The answer shown (and printed on worksheet answer
  pages) is one valid flow, labelled "one possible flow". A built-in checker (`isFeasibleFlow`) is used by tests
  and, later, by any self-mark feature.
- **Misconceptions targeted:** meeting lower bounds on some arcs but forgetting conservation at a node; exceeding
  a maximum when two paths share an arc; ignoring the minimum on arcs not on the first path found.

#### Worked example script — N0 (§5), "find a feasible flow"
1. `tStep("List the arcs with a minimum above 0 — each must carry at least that much.")` + diagram highlights those arcs.
2. `mStep("Send the forced flow along a path that covers them:", "S \\to A \\to C \\to E \\to T")` (amount stated in the caption).
3. `mStep("Cover the remaining minimum arcs:", "S \\to B \\to D \\to F \\to T")`
4. `tStep("Check every node: flow in equals flow out.")` — conservation table in the matrix panel.
5. `tStep("Check every arc is between its minimum and maximum.")`

---

### Sub-tool: Max flow & min cut (`maxFlow`)

A feasible non-maximal flow `f0` is **given**. Student repeats augmentation until none remains, then confirms with a cut.

#### QO
- variables: `showPotentials` — "Show potentials": off by default.
- multiSelect `finish` — "Finish with": `cut` "Name the min cut and confirm" (default) · `valueOnly` "Maximum flow value only".

#### Levels
- **Level 1:** capacity-only, reduced network; **exactly 1–2 augmentations** needed; min cut may be `{S}` or `{T}`.
- **Level 2:** min/max, 10–12 arcs; **2–3 augmentations**; **min cut is not `{S}` and not `{T}`.**
- **Level 3:** min/max, full network (flips); **3–4 augmentations, at least one with a backward step**; min cut is not `{S}`/`{T}`.
- **Constraints (all):** the flow never needs an augmentation of bottleneck < 1; max flow ≤ 40.
- **Answer:** maximum flow value, and the **minimum cut = the set of nodes labelled in the final
  labelling** (reachable from S in the residual network — the canonical min cut), with its capacity.
- **Misconceptions targeted:** stopping when some arcs are saturated but a path with a backward step still exists;
  taking the cut with the smallest *number* of arcs instead of the smallest capacity; checking a cut that isn't tight.

#### Worked example script
Repeat per augmentation: label → path → bottleneck → update (as in `augment`), then:
`mStep("No more flow-augmenting path: labelling stops at {S, A, B, C, D}.", …)`,
`mStep("Cut {S,A,B,C,D} | {E,F,T}:", ["8 + 3 + 2 + 7", "= 20"])`,
`tStep("Maximum flow = minimum cut, so the flow of 20 is maximal.")`.

---

## 5. Correctness reference (acceptance set)

Claude Code verifies the solver against these exactly (all values integer).

### Reference network N0 (the textbook image)

| Arc | min, max | flow f0 |   | Arc | min, max | flow f0 |
|---|---|---|---|---|---|---|
| SA | 2, 10 | 8 |   | CE | 6, 10 | 8 |
| SB | 3, 12 | 7 |   | CF | 0, 3 | 0 |
| AC | 0, 8 | 8 |   | DE | 0, 8 | 0 |
| AD | 0, 8 | 0 |   | DF | 5, 7 | 7 |
| BC | 0, 5 | 0 |   | ET | 6, 12 | 8 |
| BD | 0, 10 | 7 |   | FT | 5, 13 | 7 |

- `f0` is **feasible** (conservation at A, B, C, D, E, F; all bounds met). **Flow value 15.**
- **Potentials (forward / backward)** at `f0`: SA 2/6 · SB 5/4 · AC 0/8 · AD 8/0 · BC 5/0 · BD 3/7 ·
  CE 2/2 · CF 3/0 · DE 8/0 · DF 0/2 · ET 4/2 · FT 6/2.
- **Canonical augmentations** (breadth-first, nodes alphabetical): `SADET` bottleneck **2** → value 17; then
  `SBCET` **2** → 19; then `SBCFT` **3** → **22**. Final flows: SA 10, SB 12, AC 8, AD 2, BC 5, BD 7,
  CE 10, CF 3, DE 2, DF 7, ET 12, FT 10 (conservation checked). **Maximum flow 22**; the final labelling reaches
  only `{S}`, so the min cut is `{S} | rest` of capacity `10 + 12 = 22`.
  (A mechanics example only — it has the trivial source cut; generated Level 2–3 `maxFlow` questions must not.)
- **Cut** `{S, A, B, D, E} | {C, F, T}`: forward `AC 8 + BC 5 + DF 7 + ET 12 = 32`; backward `CE` min `6`;
  capacity **32 − 6 = 26**.
- **Cut** `{S, A, B, C, D} | {E, F, T}`: forward `CE 10 + CF 3 + DE 8 + DF 7 = 28`; no backward arcs; capacity **28**.
- **Cut** `{S, A, C, E} | {B, D, F, T}`: forward `SB 12 + AD 8 + CF 3 + ET 12 = 35`; backward `BC`, `DE` have min 0; capacity **35**.

### Reference network N1 (N0 with `CE = (6, 8)` and `DE = (0, 2)`, same `f0`) — non-trivial min cut
- Canonical augmentations: `SADET` **2** → 17; `SBCFT` **3** → **20**.
- **Maximum flow 20.** Final labelling reaches `{S, A, B, C, D}`; min cut `{S,A,B,C,D} | {E,F,T}` with
  capacity `CE 8 + CF 3 + DE 2 + DF 7 = 20` = the flow, so by max-flow min-cut it is maximal. This is the
  **worked example for `maxFlow`**.

---

## 6. Solver and validation

New pure module `src/shared/decision/flow.ts` (no React), all integer arithmetic:

- `potentials(net, flow)` → `{ forward, backward }` per arc
- `findAugmentingPath(net, flow)` → canonical path (BFS from S, nodes tried in alphabetical order; arcs outward
  before backward steps) as `{ steps: {arc, dir: "fwd" | "back"}[], bottleneck }` or `null`
- `allAugmentingPaths(net, flow)` (simple-path enumeration, used only to enforce uniqueness constraints)
- `augment(net, flow, path)` → new flow
- `maxFlow(net, flow0)` → `{ flow, value, steps[], labelled: Set<node> }`
- `cutCapacity(net, sSide)` → `{ forward: arc[], backward: arc[], capacity }`
- `isFeasibleFlow(net, flow)` → `{ ok, violations[] }` (conservation + bounds)
- `buildFeasibleFlow(net, rng)` (for generation)
- `minCut(net, flow)` → canonical min cut S-side set from the final labelling

**Tests** (`src/tests/flow.test.ts` + the Decision `__problem` validation):
- Every §5 number above is asserted.
- Property tests over generated questions at every level × mode: the generated `f0` is feasible; the
  max-flow value equals an **independently coded** min-cut brute force (enumerate all S-side subsets of 8
  nodes — 64 cuts — and take the smallest capacity); the final flow is feasible; potentials are non-negative;
  the network is acyclic; declared crossings are exactly the geometric crossings.
- `augment` constraints: Level 1 → exactly one augmenting path, forward-only; Level 3 → at least one backward step.
- Every KaTeX string in every `SolveStep` caption renders.

---

## 7. Shell and representation work this needs

`DecisionShell` is currently thin (one weight per edge, no QO, no print, MST/TSP only). The spec needs:

1. **Data**: extend `GEdge` (or add `FlowEdge`) with `lo`, `hi`, `flow`, and optional `flipped`. **Single source:**
   store `lo/hi/flow` only; every label (`lo, hi`, circled flow, potentials, cut contributions) is *derived*, never stored twice.
2. **`FlowView`** (new representation, built on `NetworkView`'s SVG): arcs with arrowheads, `lo, hi` label near the
   tail, circled flow, **two-number potential labels** (forward blue / backward orange), highlighted augmenting path
   with dashed backward steps, shaded S-side set + red cut ticks, S/T styling. It must render **declared crossings**
   cleanly (labels near tail) and support `qIndex` for the print path.
3. **Shell**: multiple sub-tools (tabs), the `bounds` dropdown / variables / multiSelects (QO), levels 1–3, and
   Question | Solution stepper with show-all — reuse the shell's existing stepper; extend only what the existing MST/TSP
   tools don't already provide. Print via `handleDiagramPrint` (planned increment 4) — **not** required for the first
   ship; mark the tool `enabled: false` until print exists.
4. **`SolveStep`** gains optional `flowStates` (per-arc flow / highlighted potentials / path / cut set); follow the
   board-writing rule: one beat = the next mark a teacher would write.
5. **Info modal** content (drafted below), the registry entry, `docs/PROJECTS.md` row and `docs/PATCH_NOTES.md` line.
6. Phone width: `FlowView` must scale to the viewport with legible labels at 360 px (check by hand).

---

## 8. Sample questions (acceptance set)

| Sub-tool | Level | Question as displayed | Answer | Working (one line) |
|---|---|---|---|---|
| potentials | 2 | N0 + circled `f0`; "Label the potentials on each arc" | table in §5 | `hi − f` forward, `f − lo` backward |
| potentials | 1 | reduced capacity network, SA cap 7 flow 3 | SA: 4 forward, 3 backward | `7 − 3 = 4`, `3 − 0 = 3` |
| cutValue | 2 | N0, cut {S,A,B,D,E} \| {C,F,T} | 26 | `8+5+7+12 − 6` |
| cutValue | 1 | N0 (cap-only) cut {S,A,B,C,D} \| {E,F,T} | 28 | `10+3+8+7` |
| cutValue | 3 | N0 cut given as a set only: separates {S,A,C,E} from rest | 35 | forward `12+8+3+12`; backward min 0 |
| augment | 2 | N0, `f0` | `SADET`, increase 2, new value 17 | bottleneck `min(2,8,8,4)` |
| augment | 3 | a network where the unique augmenting path includes a backward step | path with ≥ 1 backward step | back-steps subtract the bottleneck |
| initialFlow | 1 | "initial flow of 5 along SACET and 7 along SBDFT" | arc flows listed | one flow per arc, shared arcs add |
| initialFlow | 3 | N0 bounds, no flow shown | any feasible flow, e.g. `f0` | lower bounds first, then conservation |
| maxFlow | 2 | N1 + `f0` | **max flow 20**, cut {S,A,B,C,D} | augment twice, cut 20 |
| maxFlow | 3 | a flipped-arc network needing a backward step | max flow + non-trivial cut | max-flow = min-cut |

(Generated questions will have different numbers; the above fix the *shapes* and the §5 numbers.)

---

## 9. Uniqueness and pool size

Key parameters: arc set (which cross arcs, which flipped), every `lo`/`hi`/`flow` value, sub-tool, the cut S-side set
(`cutValue`), plus a random id. **Pool size:** Level 1 draws 2–3 cross-arc choices × many bound values; with
integer ranges 1–15 across ≥ 9 arcs the pool is effectively unlimited. Sanity-check the Level 1
`augment` pool (unique-path requirement is the tightest) generates ≥ 24 distinct keys within the retry limit.

---

## 10. Variety requirements

- Spread the three S-side shapes of cut (small S-side, large S-side, "split" like `{S,A,B,D,E}`) across a worksheet.
- Vary which crossing pair is present at Levels 1–2 and which arcs are flipped at Level 3.
- Never allow two questions on one sheet with the same arc set *and* the same flow.
- Keep integer values small and unequal: avoid ties for the bottleneck (so the "smallest" is visible), except
  deliberately at Level 3.

---

## 11. Info modal content (draft)

**Network Flows** — *Overview*: "Flows through a network from a source S to a sink T, on capacity-only or
minimum/maximum networks. The same network is used throughout so students learn one picture well."
- **Potentials** — "Forward potential = maximum − flow; backward potential = flow − minimum. The foundation of the labelling procedure."
- **Cut values** — "Capacity of a cut = sum of maximums of arcs going S-side → T-side, minus the minimums of arcs coming back. Level 3 gives the cut only as a set of nodes."
- **Augment flow** — "Find a path of positive potentials from S to T, add the bottleneck on forward steps, subtract it on backward steps."
- **Initial flow** — "Write down a flow that meets every bound and balances at every node. Many answers are valid."
- **Max flow & min cut** — "Augment until no path remains, then confirm with a cut of equal capacity."
- **Levels** — "Level 1 capacity-only, smaller network; Level 2 minimum/maximum, full-size network; Level 3 adds backward steps and reversed arcs."

---

## 12. Out of scope / future ideas

- Other network shapes / templates (the free-build network sandbox and `generateRandomNetwork` are a later increment).
- Multiple sources or sinks (supersource / supersink), arc **and** node capacities.
- **Infeasible** networks ("show that no feasible flow exists") — needs a separate sub-tool and a proof-style answer.
- Interactive labelling (student clicks the path / types potentials and is checked) — the `isFeasibleFlow` checker is built now so this can follow.
- Teach deck / Depth bank (parked / later) — e.g. Depth items on "which cut value is wrong?".
- Supply & demand / transportation extensions and LP formulation of max-flow.
