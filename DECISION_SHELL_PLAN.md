# Decision Mathematics Shell — architecture plan

Status: **increment 1 shipped → increment 2 next.** A spike exists
(`src/tools/Decision/NetworkSandbox.tsx`, `enabled:false`) that proves the *presentation*: a
full-screen, pannable/zoomable weighted-network canvas with a live distance matrix. Increment 1
turned it into the first vertical slice — a pure-renderer representation library (`NetworkView` +
`MatrixView`), a thin `DecisionShell` (Question + Solution stepper), and a Kruskal-based
`MinimumSpanningTree` tool, all CI-validated. This doc grows that into a family of
**question-generator tools** (MST, TSP, CPA — independent tools sharing one representation library and
one shell), the way `CS_SHELL_PLAN.md` turned `CpuArchitecture` into the CS shell.

Read this before building any Decision Maths tool.

Target exam board: **AQA A-level Further Maths — Optional Application 3: Discrete Mathematics**
(graphs & networks, MST via Prim/Kruskal, Dijkstra, route inspection / Chinese postman, TSP,
critical path analysis, network flows, linear programming).

---

## ▶ Resume here — next session (keep current)

Copy-paste kickoff for the next conversation, inside a fenced code block. **Whoever lands an
increment rewrites this block** so it always points at the true next step (end-of-session rule in
`PATCH_NOTES.md`). When the shell is finished, replace with "Shell complete — author tools as data".

```text
Build increment 2 of the Decision Maths shell (Maths-Tools repo): MST breadth.

Setup: work on THIS session's assigned branch (already cut fresh from main at session start). Do NOT
check out any other branch. Confirm the baseline is current (git fetch origin main; branch level with
origin/main). Then: npm install (node_modules isn't present in a fresh container).

Where we're up to: increment 1 is SHIPPED — the MST thin vertical slice is live end-to-end. Read
DECISION_SHELL_PLAN.md (esp. the Contracts + Increment plan). The shell + library are small; read
them, do NOT re-read ToolShell or the whole sandbox:
  - src/shared/decision/types.ts (contracts), templating.ts (sampleTemplate), validate.ts
    (validateProblem + independent Prim reference)
  - src/shared/decision/DecisionShell.tsx (Question + Solution stepper — thin)
  - src/shared/decision/representations/NetworkView.tsx + MatrixView.tsx (pure renderers,
    edge states idle/considering/tree/rejected, matrix highlight/strike)
  - src/tools/Decision/MinimumSpanningTree.tsx (ONE template + Kruskal → SolveStep[], __problem export)
  - src/tests/decision.test.ts (the __problem contract suite)

Increment 2 (MST breadth) — grow the one tool, do NOT start TSP/CPA:
  1. Prim's algorithm as a second method — network walk PLUS Prim-on-the-matrix (tick a column per
     step). Reuse SolveStep; matrixCells already supports highlight/strike. Emit the running total.
  2. More question types as named variants within the tool (prompt + answer + solve variant): e.g.
     "apply Prim starting from node X", "list the rejected edges / the order edges are added".
  3. Levels 1–3 (wire config.levels + generate(level)) and MORE templates (varied shapes, not just
     weights) so questions vary in structure. Keep every template's mandatory edges spanning.
  4. Keep validate.ts honest: it already brute-forces the MST weight with Prim — make sure each new
     method/variant/level is covered (extend the __problem export / validateProblem levels).

The shell may need a light QO surface (method + question-type + level selectors) — add it minimally,
still no print / no sandbox-expand (those are increments 3–4).

Verify before pushing: npm run build (0 TS errors), npm test (all pass, count grows), and eyeball ONE
screenshot (a Prim walk mid-step + the matrix column ticked). Then tick increment 2 in
DECISION_SHELL_PLAN.md, refresh this block to point at increment 3 (sandbox expand-from-question +
representations/editing.ts), add a PATCH_NOTES entry (Maths strand), commit + push.

Do NOT build TSP/CPA/print/sandbox in increment 2 — they are later increments.
```

---

## The five locked decisions (design session, 2026-07-28)

1. **A new `DecisionShell`** — purpose-built, network-native question-generator shell, parallel to
   `ToolShell`/`CSShell`, sharing none of ToolShell's code. (Not extending ToolShell.)
2. **Parameterised templates** for network generation — a curated set of hand-authored *shapes*
   (fixed, crossing-free layouts) with declared degrees of freedom (weight ranges, optional edges,
   node-count bands). Generation samples within bounds → fresh but always-clean, always-solvable.
   An **advanced "free" bypass** (manual/procedural) sits behind a "may affect diagram clarity"
   warning.
3. **Stepper + show-all** for the worked answer — a forward/back walkthrough animating edge
   highlight/discount + matrix/table in sync, PLUS a "show full solution" end-state.
4. **Sandbox = both** — an "Expand" opens the current generated network as an interactive,
   annotatable sandbox (read-only structure, drag-to-tidy), AND a separate free-build mode where a
   teacher edits any network from scratch. The free-build mode and the template bypass share the
   same editing primitives.
5. **MST thin slice first** — prove Layers 1+2+one tool end-to-end (one question type, Kruskal, one
   level) before breadth. Prim / more question types / levels / sandbox-expand / print all follow.

---

## Why a separate shell (not the maths ToolShell)

`src/shared/ToolShell.tsx` is built around **short question generation**: a rigid whiteboard split
(a `480px` working panel beside a `480px`-tall question box, inside `max-w-6xl`), a question model
that is a **KaTeX string** (`displayLatex` + `answerLatex`) with a flat `WorkingStep[]`, and a print
path for many small questions per page.

Decision Maths problems are a different product:
- A problem **is a data structure** — `{ nodes, edges }`, activity lists, LP constraints — not a
  string. It renders as a **full-canvas diagram + matrix + table**, together, not in a 480px pane.
- The working is a **stateful walkthrough over that structure** — highlight this edge into the tree,
  discount that one (it forms a cycle), tick the matrix column — which a flat KaTeX `WorkingStep[]`
  cannot express.

This is the same conclusion the CS strand reached (`CS_SHELL_PLAN.md` → "Why a separate shell"):
build a **parallel shell** that borrows ToolShell's *philosophy* (data-driven authoring, a shared
component library, a curated set of core representations, CI-validated content) but shares none of
its code. The one thing worth **reusing** is the diagram print engine (`handleDiagramPrint` /
`computeWorksheetLayout`) — see "Print".

---

## The grapher precedent — representations as embeddable windows

`src/shared/grapher/SmartGrapher.tsx` is the model for Layer 1. It is a **data-driven renderer**
(`GrapherConfig` + `series`) with an **inline static thumbnail** and an **Expand** button that opens
full interactivity (`interactive`, `allowExpand`). Tools embed it and it re-frames on a `frameKey`
change. Our representations follow the same shape: pure renderers, embeddable inline in the shell,
expandable into an interactive sandbox window.

---

## Three-layer architecture

```
Layer 3  Tools (independent)      MinimumSpanningTree · TravellingSalesperson · CriticalPath
           each = generator + question(s) + answer + solve() → SolveStep[]
              │ shares
Layer 2  DecisionShell            Question · Solution (stepper+show-all) · Sandbox(expand+free) · Print
           one <DecisionShell problem={…} solve={…} /> drives all chrome
              │ renders through
Layer 1  Representation library   NetworkView · MatrixView · TableView   (+ ActivityNetworkView · GanttView)
           pure renderers of data + an optional SolveStep; each embeddable + expandable
```

A new tool is **one generator + one algorithm**, not a new UI — the same payoff CSShell gives
(`CS_SHELL_PLAN.md` → "Payoff").

### Module layout (target)

```
src/shared/decision/
  index.ts            barrel export
  types.ts            NetworkTemplate, DecisionProblem, SolveStep, EdgeState, DecisionShellProps
  templating.ts       sampleTemplate(template, seed) → concrete network within declared bounds
  DecisionShell.tsx   header · mode nav · Question · Solution stepper · Sandbox launch · Print
  stepper.tsx         the SolveStep forward/back engine (shared with the Teach-style beat model)
  representations/
    NetworkView.tsx   the sandbox's SVG graph, now driven by network + optional SolveStep
    MatrixView.tsx    distance/adjacency matrix with per-cell highlight/strike
    TableView.tsx     generic stepped table (Prim order, Dijkstra labels, CPA passes)
    editing.ts        shared node/edge editing primitives (free-build sandbox + template bypass)
    ActivityNetworkView.tsx  ⬜ CPA (later increment)
    GanttView.tsx            ⬜ CPA (later increment)
  validate.ts         validateProblem — CI contract checker (analog of cs/validate.ts)
```

---

## Contracts (the authoring surface)

These are the shapes a tool author fills in. Exact fields firm up as increment 1 lands; this is the
intended contract.

```ts
// ── A network, concrete or templated ──────────────────────────────────────
interface GNode { id: string; x: number; y: number; label?: string; }
interface GEdge { id: string; from: string; to: string; weight: number; directed?: boolean; }
interface Network { nodes: GNode[]; edges: GEdge[]; }

// A hand-authored SHAPE with declared degrees of freedom. sampleTemplate() draws
// a concrete Network within these bounds — always crossing-free, always solvable.
interface NetworkTemplate {
  id: string;
  nodes: GNode[];                       // fixed positions (the clean layout)
  edges: Array<{
    id: string; from: string; to: string;
    weight: [min: number, max: number]; // sampled per generation
    optional?: boolean;                 // may or may not appear this time
  }>;
  // optional node-count bands etc. added as generators need them
}

// ── A generated problem the shell renders ─────────────────────────────────
interface DecisionProblem {
  network: Network;
  prompt: string;                       // "Find the minimum spanning tree and its total weight."
  answer: { text: string; edges?: string[]; value?: number };  // definite, checkable
  templateId?: string;                  // provenance (undefined for the free bypass)
}

// ── One beat of an algorithm walkthrough — the crux primitive ─────────────
type EdgeState = "idle" | "considering" | "tree" | "rejected";
interface SolveStep {
  caption: string;                      // the teaching voice for this beat
  edgeStates: Record<string, EdgeState>;      // edgeId → state
  nodeStates?: Record<string, string>;         // nodeId → label/annotation (Dijkstra values, CPA times)
  matrixCells?: Array<{ r: string; c: string; state: "highlight" | "strike" }>;
  runningTotal?: number;                // e.g. MST weight so far
}

// A tool provides these; the shell does the rest.
interface DecisionShellProps {
  generate: (level: number) => DecisionProblem;   // parameterised-template sampling inside
  solve: (p: DecisionProblem) => SolveStep[];      // the algorithm, as ordered beats
  config: { pageTitle: string; instruction?: string; levels?: number };
  // later: sandbox?, print?, questionTypes?, info?
}
```

**Board-writing rule (inherited from the working-step fragments doctrine in `CLAUDE.md`):** one
`SolveStep` = the next move a teacher would make at the board (consider an edge, then accept/reject
it), never two moves at once.

---

## Templating model (decision 2, in detail)

- **Common path — parameterised templates.** `sampleTemplate(template, seed)` walks the template's
  edges, samples each `weight` in its `[min,max]`, includes each `optional` edge by a coin-flip, and
  returns a concrete `Network`. Because node positions are authored, the diagram is always clean and
  crossing-free; because bounds are authored, the question is always solvable and its difficulty is
  controlled. This is where ~all questions come from.
- **Escape hatch — free bypass.** An "advanced / free network" path lets a user hand-build or
  procedurally generate a network outside any template, behind a **"may affect diagram clarity"**
  warning. It reuses `representations/editing.ts` (shared with the free-build sandbox).
- A tool ships several templates so questions vary in shape, not just weights.

---

## Solution UX (decision 3)

`DecisionShell`'s **Solution mode** plays `solve(problem)` as a stepper: forward/back over the
`SolveStep[]`, each beat updating `NetworkView` (edge highlight/discount) + `MatrixView` +
`TableView` in sync, with the caption as the voice and a running total. A **"show all"** control
jumps to the terminal state (final MST bold, rejected edges dashed, summary table). Reuse the
Teach-deck beat engine's discipline: reserve space for everything, animate opacity/transform only,
back exactly retraces forward.

---

## Sandbox (decision 4)

- **Expand-from-question** (grapher-style): an Expand button opens the *current* generated network
  in an interactive window — pan/zoom/drag-to-tidy, annotate, but structure read-only. For live
  explanation off the generated question.
- **Free-build mode**: a distinct mode where a teacher builds/edits any network — add/move/delete
  nodes & edges, set weights — via `representations/editing.ts`. Shares its primitives with the
  template bypass, so it is built once.
- Both are **later increments**, not increment 1.

---

## Print (reuse, don't rebuild)

Network worksheets reuse the existing **`handleDiagramPrint` / `computeWorksheetLayout`** engine
(`src/shared/printDiagram.ts`) — the same path the Geometry SVG tools use for variable columns,
sections and differentiated layout. The `NetworkView` worksheet renderer must emit an
`<svg data-q-index={idx}>` with an `_aspect`, per `CLAUDE.md` → "Printing SVG worksheets". This is
the one deliberate borrow from the ToolShell world. A later increment.

---

## CI: a `validateProblem` validator (`validate.ts`)

The analog of the CS `validateTopic` / the maths generator smoke test. Discover every
`__problem`-exporting Decision tool and assert:

- each `NetworkTemplate` samples to a network whose edges reference real nodes;
- sampled weights fall in their declared ranges;
- the tool's `solve()` answer **matches an independent brute-force reference** (e.g. a from-scratch
  MST weight) — this is what makes "generate fast" safe;
- every `SolveStep.edgeStates` / `matrixCells` references edges/cells that exist;
- the final `SolveStep` state agrees with `problem.answer`.

Wire into vitest so authoring mistakes fail at CI. Add the tool to whatever the organisation-test
bookkeeping needs (a Decision list, mirroring `CS_TOOLS`).

---

## Increment plan (each ships green; the sandbox spike stays the reference)

1. **MST thin slice** ✅ *shipped 2026-07-28*. NetworkView + MatrixView as `SolveStep` renderers in
   `src/shared/decision/`; thin `DecisionShell` (Question + Solution stepper + show-all); MST tool
   (one template, Kruskal, one question type, one level); `validate.ts` + test. No print, no
   sandbox-expand, no Prim.
2. **MST breadth** ← next. Prim's (network + Prim-on-matrix), more question types (apply Prim from node X /
   list rejected edges), Levels 1–3, more templates.
3. **Sandbox — expand-from-question** + `representations/editing.ts`.
4. **Print** via `handleDiagramPrint`; **free-build sandbox** mode.
5. **TSP** — nearest-neighbour upper bound, MST-based lower bound (reuses NetworkView + MatrixView).
6. **CPA** — new `ActivityNetworkView` + `GanttView`; forward/backward pass + float as `SolveStep`s.
7. Onward: Dijkstra, route inspection, network flows, LP (new representations budgeted per *strand*,
   not per tool — same doctrine as CS).

---

## Session rhythm — when to break

Same economics as `CS_SHELL_PLAN.md`: per-turn cost grows with session length; reading screenshots
back is expensive and persists. **Break at an increment boundary** — each is committed, pushed, and
leaves the build green. Aim for ~1 increment per session. A fresh session reintegrates from this
doc + the small `src/shared/decision/*` files + the sandbox spike; it should **not** re-read
ToolShell or the whole sandbox. Prefer headless assertions (`pageerrors=0`, a DOM check) over
screenshots; reserve a screenshot for genuine layout judgement, ~one per session.

---

## Open decisions / risks

- **Auto-layout is deliberately avoided** in the common path — templates carry authored positions.
  Only the free bypass / free-build sandbox needs any layout help, and even there drag-to-tidy may
  be enough before investing in force-directed layout.
- **Representations are the recurring cost.** MST/TSP need only NetworkView + MatrixView + TableView;
  CPA needs two new views; flows/LP more. Budget ~1–2 new renderers per *strand*.
- **Question-type breadth vs generator complexity.** Each new question type ("apply Prim from X")
  needs its own prompt + answer + `solve()` variant. Keep them as named variants within a tool, not
  new tools.
- **Update `CLAUDE.md`** to document `DecisionShell` the way it documents ToolShell/CSShell, once the
  shell stabilises (after increment 2), so future sessions author tools as data.

---

## Payoff

A new Decision Maths tool becomes **one file** — a set of `NetworkTemplate`s + a `generate` +
a `solve` — rendering through a shared, consistent, CI-validated shell, with the algorithm
walkthrough, matrix, sandbox and print all provided. MST, TSP and CPA stay independent tools but
share every pixel of representation and every line of shell.
