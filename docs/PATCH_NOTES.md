# Patch Notes — Maths Tools

A running, human-readable log of what each session shipped. Read this at the
**start of a new conversation** to see where we're up to; append to it at the
**end of a session** before pushing. It complements the other docs:

- `CLAUDE.md` — how to build (conventions, APIs, checklists). *The rules.*
- `docs/PROJECTS.md` — where every prong is up to and what's next. *The plan* (absorbs the old roadmaps).
- `docs/TOOL_AUDIT.md` — the Maths Tool Audit's methodology and live per-tool findings log. *The current priority.*
- `docs/architecture/CS_SHELL_PLAN.md` · `docs/architecture/DECISION_SHELL_PLAN.md` — the two purpose-built shells' architecture.
- `docs/GLOSSARY.md` — canonical names for every element. *The vocabulary.*
- **`docs/PATCH_NOTES.md` (this file)** — what actually happened, session by session. *The history.*

The site hosts **two subjects** and they are tracked separately below: **Maths**
(the bulk of the app, built on `ToolShell`) and **Computer Science** (a younger
strand on its own `CSShell`). See `CLAUDE.md` → "Two subjects — repository map".
Keep the split even when a session only touches one.

> **This file is history, not status.** For "where are we now / what's next", see
> `docs/PROJECTS.md` — the single planning surface. This file is the newest-first record
> of what each session shipped.

> **Dates** are the commit dates of the session's work. Newest first within each
> strand. An entry is a *session's worth* of work, not a per-commit changelog —
> group by what was actually built and link the tool/page it touched.

---

# Maths

### 2026-10-10 (25) — Cards and panes defined by borders and shadow, on a light page
- The cards were too close to the page. Fix is definition, not a dark backdrop: page `PAGE_BG` (`#f0f2f6`, `shared/colors.ts`) is only a touch darker than before; card borders `slate-200` → `slate-300`; `shadow-card` / `shadow-lift` are stronger; the grey panes inside cards (whiteboard question and working boxes, worked-example step cards and answer box) now have a `slate-300` border. ToolShell, DecisionShell and CSShell; the landing page and standalone sandboxes are unchanged.

### 2026-10-10 (24) — Worked example: the answer is the same size as the working
- Measured every ToolShell tool on a phone and desktop: the answer's maths was 1.21× the step maths in the card layouts (AnswerDisplay's own sizing), smaller than the maths rows in the keep-working timelines, and different again in the Decision shell, so it varied tool to tool (16 / 16.8 / 19.4 / 20.3 px on a phone).
- Now one rule in `WorkedExampleSteps`: the answer is bold green at the size of the working it follows — card layouts use the card body size (the user's text-size chevrons no longer resize only the answer), keep-working timelines the maths size, caption-only timelines (and tStep-only tools) the caption size. `AnswerDisplay` takes `matchSteps` for this; Order of Operations' redundant answerRenderer was removed so it follows the rule. Decision shell answer line = step caption size (was +2px).
### 2026-10-10 (23) — Phone worked example fixes; Decision shell matches the phone shell
- **Boxed steps:** in the caption-timeline worked examples (Speed, Distance & Time etc.) a step the picture doesn't claim (e.g. "Write as hours and minutes") was drawn as a grey "Step 8" card among flat rows; it is now the same flat row, carrying its maths.
- **Ratio table: why the middle row.** `rStepSolve` adds a beat when a ÷ then × chain goes through a middle row — "18 doesn't scale to 63 by a whole number. 9 is a common factor of 18 and 63 (18 ÷ 2 = 9, 9 × 7 = 63), so use 9 as a stepping stone." (Skipped when start → end is already a whole-number step.)
- **Angle / geometry tools on a phone:** the question view now shows the prompt ("Find x") with the diagram small; tap to enlarge, tap to shrink; once the answer starts it sits in the small picture slot as before. (`diagramSplitQuestion`; tools whose drawing carries its own prompt show the diagram only.)
- **Decision tools on a phone** now follow the ToolShell phone Worked Example: the whole question (not a collapsed one-liner), the picture, then — after Show answer — the working in its own scrolling box with the question shrunk to two lines (tap for all) and the colour key folded away; the stepper (‹ step n of N, Step-by-Step ⇄ Show All, progress segments, ›) is fixed above a bottom bar of Options · Show/Hide answer · New question.
### 2026-10-10 (22) — Phone Back steps through the start screens
- On a phone, Back (swipe) now goes tool → mode screen → topic screen → landing page, instead of straight to the landing page. `ToolShell` mirrors the start-screen stage into history (one entry per screen); tapping a breadcrumb or ‹ unwinds the skipped entries. Shareable-link URL sync now keeps the history marker. Verified in a 390px browser (multi-topic tool). `DecisionShell` uses the same scheme (verified on Network Flows, MST, TSP, Route Inspection).

### 2026-10-10 (21) — Decision Maths and CS tools go live
- Un-gated (`enabled: false` removed): Minimum Spanning Tree, Travelling Salesperson, Route Inspection (Decision Maths); 1.1.2 CPU Performance, Data Units, Binary Counting (Computer Science). Mixed Strategies, Network Sandbox, Simplifying Ratios and Perimeter stay gated. Open before wider use: AQA wording of the TSP lower bound; real-phone check.

### 2026-10-10 (20) — Ratio regrouped
- Ratio group (Fractions of Amounts, Simplifying Ratios (dev), Fractions ↔ Ratios, Ratio Sharing) in teaching order; Proportion & rates unchanged.

### 2026-10-10 (19) — Geometry regrouped
- Angles group: Angles: Facts, Angles: Triangles, Angles: Quadrilaterals, Angles: Parallel Lines, Bearings. Shapes & measures: Perimeter (dev), Circle Properties.

### 2026-10-10 (18) — Algebra regrouped
- Algebra is now Expressions (Collecting Like Terms, Expanding Brackets, Surds), Solving equations (Linear Equations, Simultaneous: Elimination, Simultaneous: Substitution, Completing the Square, Iteration) and Graphs (Equations of Lines, moved from Geometry). Tile renamed Linear Equations.

### 2026-10-10 (17) — Names and Number regrouping
- Landing-page tool names condensed (e.g. Powers of 10, Fractions +/−, Equations of Lines, Binary Arithmetic).
- Number is now Number sense (Ordering Numbers, Powers of 10, Rounding, Estimation), Calculation (Integers +/−, Decimals +/−, Order of Operations) and Fractions, decimals & percentages. Surds moved to Algebra → Expressions. Ratio & Proportion unchanged.

### 2026-10-10 (16) — Phone breadcrumb
- The phone nav bar shows a tappable breadcrumb under the title (topic › mode › level in the maths tools; option › question type › level in the network tools). Each part reopens the start screen where it was chosen (level opens Options).

### 2026-10-10 (15) — Colour schemes dev-gated; contained phone working box
- The Colour Scheme picker (menu) only appears with Developing-tools mode on, and ToolShell / DecisionShell force the default scheme otherwise.
- Phone worked example: the card is a fixed-height container (viewport minus header and dock); the picture sits in its own box and the working scrolls inside a closed, bordered box. No fade, no page scroll.

### 2026-10-10 (14) — Phone auto-scroll
- Phone worked example: every step press scrolls the newest line of working into view just above the docked controls (page and the split-picture list), so the last step is never hidden; the first paint is left alone.

### 2026-10-10 (13) — One phone dock
- Phone worked example: the stepper and the action bar are one dock on a shared grid: row 1 ‹ step label + progress track ›, row 2 Options · Show/Hide answer · New (icon), side buttons in matching 56px columns.

### 2026-10-10 (12) — Stepper docked to the bottom bar
- Phone worked example: the step controls are a full-width strip fixed directly above the bottom action bar (the bar drops its own top rule while steps show), with a spacer and a soft fade so the working scrolls cleanly behind it.

### 2026-10-10 (11) — Phone hotbar and level selector
- Ink hotbar on a phone-width flat bar is two rows (tools + close above, colours spread beneath). `DifficultyToggle` gains `fullWidth` (equal thirds) for the option sheets; topic chips use 1px borders.

### 2026-10-10 (10) — Phone click-through start
- Phone (ToolShell): topic → mode screens before the tool; the tool page has no menus at the top, and Options (topic, mode, level, question options) is a button in the fixed bottom bar (also in Depth). A link with `mode`/`tool`/`level` skips the start.
- Phone (DecisionShell): the big either/or option and question type are click-through screens; the tool page keeps only New question + Options at the bottom.

### 2026-10-10 (9) — Slim phone header
- Phone (ToolShell and DecisionShell): the nav bar carries the tool title (Home as an icon), and the mode tabs and Options share one row (Options names the topic and level). Everything above the question is about 95px, down from about 320px.

### 2026-10-10 (8) — Teach deck restyled
- Slide card and category menu use `shadow-card`, 1px borders, a thinner colour accent, semibold type, a softer phase badge and 1px nav buttons; category menu rows carry a colour dot instead of a thick left bar. Slides, scenes and beats unchanged.

### 2026-10-10 (7) — Sandboxes restyled
- Algebra Tiles, Negative Counters, Parallel Lines Explorer, Grapher Lab, Visualiser and the Decision sandbox board: cooler background, `shadow-card` / `shadow-lift`, 1px slate borders and dividers. Boards, tiles and toolbars otherwise unchanged.

### 2026-10-10 (6) — Phone sizing
- Phone worked example: question text fixed at `text-xl` (no desktop size controls), step pictures (ratio table, place value, graphs) shrink to fit a 24dvh box, and a custom question diagram to a 34dvh box.

### 2026-10-10 (5) — Phone pen tab; style through the Generators and library pages
- Phone: the ink opener is a slim edge tab mid-screen on the right (no longer a round button over the step buttons).
- Generators, p-value, Skill Library and Technique Library: cooler background, smaller semibold titles, `shadow-card`, 1px borders.

### 2026-10-10 (4) — Container shadows, more surfaces
- `shadow-card` / `shadow-lift` tokens (tailwind.config.js); containers across ToolShell, DecisionShell, Depth, Worksheet builder and landing tiles use them. CSShell and the Systems Architecture page pick up the cooler background, smaller title and flat pill tabs.

### 2026-10-10 (3) — Calmer chrome across ToolShell and DecisionShell
- Cooler page background, softer cards (1px borders, light shadow), smaller semibold titles without divider rules, sub-tool pills and underline mode tabs, quieter Level / Options controls and top-tier segmented switch. CLAUDE.md gains a short "Visual direction" section.

### 2026-10-10 (2) — Phone options sheet, Depth audit, calmer landing page
- Phone Question Options (ToolShell and DecisionShell) are a full-screen sheet of card sections with a bottom Done; the settings chip now says Options; Decision tools get the same fixed bottom New question bar.
- Depth audit: Rounding's items tagged by tab (nearest / dp / sf) with +14 items so every tab keeps diagnose/explain/extend per level. Order of Operations filters by its Focus options (needs) by design, not by tab.
- Landing page: removed the jump-back and strand chips; flat grey tiles, quiet strand headings with a colour dot, search-first hero, two underline subject tabs, no background blobs.

### 2026-10-10 — Depth by sub-tool, phone overhaul, landing page
- Depth: `DepthItem.tool` may be an array; Speed/Distance/Time's general items are now tagged by the quantity they ask for (+7 items so every tab keeps diagnose/explain/extend at each level).
- Phone (ToolShell): tighter question text, fixed bottom action bar (New / Show answer; Generate / Show all on worksheets), step nav pinned above it, compact header; ink button lifted clear of the bar.
- Landing page: "Jump back in" (last tools opened, per device) and sticky strand chips.
- Not yet audited: Rounding's untagged Depth items against its tabs.

### 2026-10-09 (late, 6) — Layout: desktop mode, phone stage, landing page
- Desktop mode (≈980px): Decision tools use a two-column grid instead of flex-wrap (no more fully vertical layout); ToolShell worked-example split starts at `md`; control-bar buttons no longer wrap their labels.
- Phone Decision tools: the question (collapsed to one line) and the picture are pinned above the scrolling working; a Graph | Table switch shares the stage (automatically Table on steps that build it).
- Landing page: tool cards are compact title tiles with an (i) that opens the description; tighter hero.

### 2026-10-09 (late, 5) — Travelling Salesperson: table of least distances built from scratch, matrix promoted
- The table starts empty and is filled row by row; each entry says whether the direct edge or a shorter route is used, so students see the shortest distance is not always the direct edge. When the initial weights already obey the triangle inequality, one check beat replaces the build.
- The matrix sits directly under the question (desktop right column; after the graph on phones).

### 2026-10-09 (late, 4) — Travelling Salesperson: no pre-filled box, phone order, beaten edges tested
- **Table steps:** the "Entries to find" chip box is gone. From the second step it listed every missing entry WITH its answer before the steps reached them (and cluttered the panel); the table now shows what is missing (a blank, or the direct edge a shorter route will beat) and each step fills in one entry. Tests assert no entry's answer appears before its own step.
- **Joined but beaten:** tests check that every level can set a direct edge beaten by a shorter route (Level 1 complete networks, Level 2 with 'breaks', Level 3), that its own step reads "A–D has a direct edge of 37, but A–B–E–D = 33 is shorter", and that the table shows the direct edge before and the replacement after.
- **Phone order (Decision tools):** question, then the graph, then the working steps (then the table). The desktop two-column layout is unchanged.

### 2026-10-09 (late, 3) — Travelling Salesperson: work on the complete network, then interpret the route
- After the table of least distances is complete it is DRAWN as the complete network K (every pair joined, each weight the table entry, changed entries purple); nearest neighbour and the deleted-vertex lower bound run on that picture, where every leg is a single edge, instead of on the sparse original. For an upper bound the working ends by interpreting the tour as a real route in the original network (each leg replaced by its shortest route, drawn on the original). The table question ends by drawing the complete network too.
- Plumbing: `SolveStep.network` (a beat can draw its own network; `edgeStates` then refer to its edges), `DecisionProblem.complete` (a complete network keeps its own layout; a practical one is redrawn on the bank's K4–K6 layout), validate.ts checks each beat's edges against the network it draws, the sandbox shows such beats as drawn.

### 2026-10-09 (late, 2) — Travelling Salesperson: "Initial weights" option (holds / broken / either)
- Distance questions matter too, so a new QO decides whether the INITIAL network obeys the triangle inequality: **Holds** (no direct edge beaten by a route; in-context questions use distances; Level 3 then needs a table entry with a route of 3+ edges), **Broken** (at least one beaten direct edge at every level; in-context questions use journey times or costs), **Either** (default mix). Every question still builds the table of least distances first and solves the classical problem on it. Applies to all four question types.

### 2026-10-09 (late) — Travelling Salesperson: initial networks need not be metric; tours no longer just round the outside
- **Model (agreed):** EVERY question starts from an initial network with arbitrary weights — no triangle inequality imposed, and pairs may be unjoined. The first step is always the complete network of LEAST distances (a metric by construction); the classical problem is then solved on that table. (An interim "table taken as given" path was built and removed: it solved the classical problem on a non-metric table, which is not the method.)
- **Levels:** 1 — a complete network (K4–K6) whose weights need not satisfy the inequality: 0–3 entries are beaten by a route through other vertices and replaced; 2 — a practical network with at most one beaten direct edge; 3 — one to three beaten direct edges. In-context questions describe the weights as distances only when nothing is beaten; otherwise as journey times or costs.
- **Outside ring:** weights are different whole numbers NOT scaled to the drawing (every question says the diagram is not to scale); a nearest-neighbour tour that is just the outline of the drawing is rejected; 60% of upper-bound questions require a tour that is not already optimal. Before: outside-ring 50% (L2) / 33% (L3), upper bound already optimal ~72%.

### 2026-10-09 (end of day) — fullscreen worked example: sizes and the remaining audit fixes
- Fullscreen working text back to about page size; the representation column is wider (two-thirds) and the picture scales up to fill it (`ScaleToFit` moved to `shared/components/ScaleToFit.tsx`). Control bar is one row at every width (icons under 1100 px). Esc closes an open popover before leaving fullscreen (`usePopover`). Decision's fullscreen: controls clear of the pen, bigger diagram share, smaller working text. `RatioTable` arrows now survive an ancestor's scale.

### 2026-10-09 (later still) — Network Flows: supersource / supersink
- New **Supersource / supersink** tab: several sources (each with a supply) and/or several sinks (each with a demand) are drawn without S and T and tagged "supply c" / "demand c"; the working adds the supersource / supersink with arcs of those capacities, runs the max-flow working, and reads the answer back per source and sink. New dedicated templates (`SUPER_TEMPLATES`), `superParts` / `chooseSuper` / `solveSuper`, `FlowViewState.nodeTags`; "Sources and sinks" option (Any / sources / sinks / both).

### 2026-10-09 (later) — Node capacities and the Route Inspection tool
- **Network Flows → Node capacities** (new tab): a vertex with a maximum throughput is shown ringed and tagged "max c"; the working splits it into X → X′ joined by an arc of that capacity, then runs the usual max-flow working on the split network and ends on the cut through a split arc. `splitNodes` / `chooseNodeCaps` / `solveNodeCap`; `FlowViewState` gained `net`, `labelPos`, `nodeCaps`. The Capacity-only / Min-and-max row is hidden on this tab.
- **Route Inspection** (new Decision tool, dev-gated): Degrees & type, Closed route, Start and finish. Networks from the graph bank (`GRAPH_POLICY.routeInspection`); unique cheapest pairing; working ends with a real route (Hierholzer). Independent CI reference in `validate.ts`. Spec: `specs/route-inspection.md`.

### 2026-10-09 — Network Flows set-value flows & cut line, bigger ratio tables, worked-example fullscreen
- **Cut values** now draws the dashed cut on the question at every level (Level 3 used to give only the node sets).
- **Find a flow** on min/max networks can ask for a feasible flow *of a set value* ("find a flow of 12"): the minimums are met first, then the flow is topped up on routes with room. New "Flow to find" option (Either / Any feasible flow / A flow of a set value); capacity-only networks always ask for a value.
- **Ratio table** is larger everywhere (text, padding, arrows, operation labels) and takes a `scale` prop.
- **Worked Example fullscreen** — new on `ToolShell` (button beside the text-size chevrons; Esc exits). Redesigned later the same day after review: it is now simply the ordinary worked example filling the screen — question centred at the top, then the steps with the picture beside them for split tools (side-by-side from tablet width), Back / Next pinned at the foot clear of the pen button, ← / → / Space step, under a slim bar with level, Question Options, New Question, Show Answer and Exit. Tools see the normal worked-example render (`qo.fullscreen` is NOT set — that flag means the whiteboard's fullscreen). `WorkedExampleSteps` gained a `fullscreen` prop. See `docs/audits/WORKED_EXAMPLE_FULLSCREEN_AUDIT_2026-10-09.md`. `DecisionShell`'s fullscreen gained the same controls row, the distance matrix, larger question text and a scrolling working column.

## 2026-10-09 — Decision tools: graph bank, static questions, sandbox overlay

- **Graph bank** (`shared/decision/graphBank.ts`): ~25 hand-authored undirected graphs — the nine Network Flows shapes plus wheels, prism, cube, grids, triangle strip, chorded polygons, house and K4–K6 — with weight-label positions optimised once and baked, and an independent clearance test for every drawing (and every mirrored variant). Minimum Spanning Tree and Travelling Salesperson now draw from it (no more per-question random layouts); questions are also mirrored and re-lettered for variety. A tool can add shapes to the bank for its own content.
- **Questions are static.** Vertices can no longer be dragged and the picture can no longer be panned or zoomed in a question (`NetworkView` is a pure static renderer; the zoom pill is gone).
- **Sandbox overlay.** A **Sandbox** button on every Decision picture (and in fullscreen) opens the same drawing in an overlay at the current step — with its own Back / Next, draggable vertices (flow labels re-lay-out live), pan / zoom, table, weights and grid switches. Works for Network Flows too (circled flows, potentials and the cut line carry over).
- **Network Sandbox page** rebuilt on the same board: pick any bank graph, random graph, new weights, mirror, click a weight to edit, show the table. Matches the question drawings exactly.
- Shared pieces: `PanZoom`, `SandboxBoard` / `SandboxOverlay`, `CanvasExtras` on `renderCanvas`.
- **Which graph for which tool:** an explicit policy in the bank (`GRAPH_POLICY`) — MST gets planar 5–12 vertex graphs, TSP only K4–K6 / sparse 4–6, Network Flows keeps its own source→sink shapes — enforced by tests. Seven large graphs (9–12 vertices) added for MST; Level 3 is now 8–9 vertices; new **Network size → Very large (10–12)** option on Kruskal's and Prim's. Label positions are baked per mirror orientation.

## 2026-10-09 — Decision graph tools: audit, rebuild, Augment flow working

- **Minimum Spanning Tree** rebuilt (dev-gated): Kruskal's, Prim's on the network and Prim's on a table; three levels (graph size); procedural crossing-free networks with all-different weights; named cycles; numbered chosen edges; sorted-edge and candidate chip lists; Setting and Ask-for options.
- **Travelling Salesperson** rebuilt (dev-gated): nearest neighbour (one or two starts), deleted-vertex lower bound, both bounds with the interval, table of least distances. Complete networks use different weights and are not drawn to scale; vertex counts balanced.
- **Network Flows (live): Augment flow working** — potentials labelled once and read, not recalculated; after each path the potentials update (changed arcs listed) and the next path is found on them; two or three augmentations, ending with the new flow value. Max flow shares the same rounds. Other flow questions untouched.
- **Shell:** step boxes no longer clip (padding, newest step shown from its top, smaller question on short screens, wrapping); zoom pill never covers a vertex; matrix scrolls sideways; chips card (also in fullscreen); per-problem legend / matrix mode; per-sub-tool level labels.
- **Fix:** `generateRandomNetwork` could return a disconnected network (a spanning-tree edge refused by the degree cap).
- **CI:** independent references for Prim / Kruskal order, the deleted-vertex bound (exhaustive) and the optimal tour (permutations); brute-force spanning-tree test; hand-worked K5.
- Full audit, AQA check and next steps: `docs/audits/DECISION_TOOLS_AUDIT_2026-10-09.md`.

## 2026-10-08 — Network Flows goes live

- Removed `enabled: false` from the `network-flows` registry entry: the tool now shows on the landing page (Decision Mathematics) for everyone. Other Decision tools (TSP, network sandbox) keep their own gates.
- Agreed next build: supersource / supersink and restricted capacity at a node (Edexcel and AQA exam items); phone check on a real device.

## 2026-10-08 — Decision shell: phone layout borrowed from ToolShell

- At ≤640px `DecisionShell` now follows ToolShell's narrow pattern: compact header and title, ONE settings banner ("Augment flow · Min and max / Level 2") with a **Change** drawer holding the network type, question type, level and Question Options (instead of the two tab rows and the control bar), a full-width New Question button, and a shorter canvas and answer area. The diagram fits the width; fullscreen (two columns when the phone is turned sideways) gives the detail. Other Decision tools (MST / TSP / CPA) get the same declutter for free.

## 2026-10-08 — Network Flows: audit fixes (display, shell, help)

- **Display**: the circled flow grows to hold three- and four-digit numbers; the bounds pill, potential arrows and flow circle now also keep clear of *other* arcs' lines (so the crossing arcs in the big network stay readable); on a phone the diagram keeps a readable size and pans sideways inside its own box (or goes fullscreen) instead of shrinking to a few pixels.
- **Shell**: options hidden for the current sub-tool no longer reach the generator or the URL; if question generation fails the page offers a reload; arrow keys no longer step while the info box is open or while typing.
- **Wording**: Missing flow says which earlier-found arc makes the next one solvable; capacity-only cut working no longer talks about minimums; the Max flow question says "maximum flow" throughout.
- **Help and docs**: in-app help now covers the Numbers option, the Find-a-flow method, fullscreen and Show all; `PROJECTS.md`, the spec and `DECISION_SHELL_PLAN.md` brought up to date.

## 2026-10-08 — Network Flows: fullscreen, Show all, Max flow working

- **Fullscreen** now takes the whole working area — the network, the question, the working and the step controls (and the colour key) — not just the diagram, with larger working text. Esc or Exit leaves it.
- **Show all** is a true toggle: pressing it again in the same place returns to the step you were on (it used to throw you back to the question). The arrow keys no longer step while the info box is open or while typing.
- **Max flow working** lists every potential that changes after each augmentation (old → new), then shows the final potentials in full, then reads the flows off them arc by arc (flow = maximum − potential increase) before the cut.
- **Cut confirmation** that is just the source (or sink) alone is allowed again, but only about one question in five at Levels 2–3 (Level 1 networks are small enough that it still comes up).

## 2026-10-08 — Network Flows: Find a flow is now a real method; cut labels

- **Find a flow**: the answer is built the way a student would, route by route (`buildFlowByPaths`). Capacity-only: take the route with the most spare capacity, send as much as it carries but no more than still needed, repeat until the target value. Min and max: take the arc furthest below its minimum, route through it (preferring routes through other arcs still below their minimum), send what it needs, repeat until every arc meets its minimum. The working states the method and tracks "still needed" / "still below their minimum" after each route; questions the method cannot solve in 2–5 routes are not set.
- **Cut labels** (+max / −min) are now placed clear of every other label, vertex, arc and the dashed line itself, staying close to the crossing they belong to.

## 2026-10-08 — Network Flows: more networks, bigger numbers, logic check

- **More networks**: two new templates ("Zigzag" at Level 1, "Tower" at Level 3) and more optional/reversible arcs on Mini hub and Double hub — 9 layouts, about 320 distinct networks (230 with a reversed arc).
- **Numbers option** (Question Options → Numbers): Small (up to ~20), Tens (10 to 200) or Hundreds (100 to 2000). Every capacity, minimum and flow is multiplied, so the maths is identical; the diagram is stretched left-to-right (×1.35 / ×1.45) so four-digit labels have room.
- **Label layout**: `layoutNetwork` now places every arc's labels together (an arc re-solves with its neighbours' labels as obstacles, and the bounds pill may slide), and `flowLayout.test.ts` checks every variant at all three number sizes.
- **Logic check** (`flowLogic.test.ts`, every sub-tool × level × mode × scale): the commodity is conserved at every inner vertex, nothing enters S or leaves T, whole numbers within bounds, no fixed `[k, k]` arc, value out of S = value into T, max flow = brute-force min cut, cut answers = brute force, and no stray un-scaled number in a prompt or working caption. It found one real bug: the Augment prompt said "three" paths when there were four.

## 2026-10-08 — Network Flows: audit fixes (layout, depth, variety)

- **Layout**: one shared geometry module (`flowGeometry.ts`) places every pill, flow circle and potential arrow; `flowLayout.test.ts` checks *every* variant of every template (each optional-arc subset × 0–2 reversed arcs, worst-case two-digit numbers, all label states) for overlaps and for labels nearer another arc than their own.
- **Depth**: Augment flow lists 2–3 paths (up to 4 at Level 3) with differing increases; Max flow runs up to 5 augmentations at Level 3, mostly by 2 or more, with an interior minimum cut.
- **Missing flow**: solved at vertices of degree 3+, an interior arc at Levels 2–3, chained pairs more common as networks grow; min/max arcs are no longer fixed `[k, k]`.
- **Variety**: new "Mini hub" (Level 1) and "Double hub" (Level 3) templates; capacity-only networks occasionally leave an arc unused so a potential decrease of 0 appears.

## 2026-10-08 — Network Flows: first build (Decision Maths, dev-gated)

- **`/network-flows`** (registry `enabled: false`): Potentials, Cut values, Augment flow, and Max flow & min cut,
  on capacity-only or min/max networks, Levels 1–3, each with a step-by-step worked solution.
- **Five network styles** from the textbook shapes — Diamond, Fan, Ladder, Hexagon and the big 8-node network
  (two declared crossing pairs; up to two arcs reversed at Level 3).
- **Maths in one place:** `src/shared/decision/flow.ts` (potentials, labelling, augmenting paths, max flow, cuts);
  questions are built flow-first (`flowGenerate.ts`) so a feasible flow always exists.
- **`FlowView`:** circled flow beside the arc, two small potential arrows (along / against) like the textbook, green
  augmenting path with dashed backward steps, shaded S side, red ticks and a dotted cut line.
- **`DecisionShell`** gained sub-tool tabs, Question Options (Capacity only / Min and max), a custom canvas and a canvas footer.
- CI: `src/tests/flow.test.ts` asserts the spec's reference numbers (flow 15 → 22 via SADET 2, SBCET 2, SBCFT 3;
  second network max flow 20; cut values 26, 28, 35) and sweeps every template × level × sub-tool × mode against a
  brute-force minimum cut.
- **Layout pass (same day):** every arc of all five templates has an explicit, hand-mapped position for its bounds label,
  circled flow and potential arrows; while augmenting, the flows and min/max labels are hidden (potentials + path only) and
  restored in a final "reinterpret" beat; `?tpl=<id>` pins a template for checking layouts.
- **Initial flow sub-tool (same day):** "Given paths" (take 3 along SABCT, 5 along SAT… write the flow on every arc) and
  "Find a flow" (any feasible flow on a min/max network, or a flow of value V on a capacity-only one). Many answers are
  valid, so the answer is one valid flow and `isFeasibleFlow` is the checker; the working builds the flow path by path
  (amounts add on shared arcs), then checks every vertex balances and every arc is within its bounds.
  `DecisionShell` options can now be limited to certain sub-tool tabs.
- **Visibility pass (same day):** the cut is now a smooth **dashed line** (`cutCurve.ts` — traced from the geometry, so it
  works for any cut, even one that loops round a node; the red ticks sit exactly where it crosses each cut arc). The
  Solution sidebar is now a **fading cascade** (earlier steps stay on screen, dimmed; the current step is highlighted),
  keeps the question on screen, and shows the final answer in its own card — for every Decision tool. Diagram labels are
  slightly larger.
- **One continuous cut line:** a cut is only ever set (and a minimum cut only ever drawn) when it can be shown as a single
  unbroken dashed line that crosses every cut arc exactly once and no other arc; the generator filters on this, CI asserts it
  for every cut question and every minimum cut.
- **Initial flow variety:** the question's paths are now chosen first (not recovered from a random flow), so routes through the
  cross arcs (SABT, SBCT, SABCT…) appear as often as the direct ones; Levels 2–3 always include one, Level 1 usually. The
  capacity-only "find a flow of value V" answer is the flow the question was built around, no longer a shortest-path build
  (which only ever used SAT, SBT, SCT).
- **Cuts and augmenting paths (same day):** the red ticks on the cut arcs are gone (the dashed line, shaded S side and the
  +max / −min labels remain). **Augment flow** now asks for ALL the flow-augmenting paths — always two or three (Level 1
  forward-only, Level 3 includes one with a backward step) — and the working finds each path and its bottleneck in turn, then
  lists them together (noting when they share arcs, so they cannot all be used at full amount at once).
- **New shell + levels by size (same day):** `DecisionShell` is rebuilt on the standard tool shell's page — nav bar, title, tool
  tabs, **Whiteboard / Worked Example** modes, a control bar (level toggle, Question Options popover, New Question, Show
  Answer or Back / Next / Show all), the menu with Info and Copy link, and the setup mirrored in the URL. The graph gets the
  width (a sticky large canvas in Worked Example, fullscreen on request); there is no worksheet or print mode for these tools.
  **Network Flows levels are now graph size** (1 = 4–5 vertices, 2 = 6–7, 3 = 8); Capacity only / Min and max is chosen only by the
  selector (default capacity only, kept when the level changes), as are Arcs (some reversed), Cuts (forward arcs only), Paths
  (include a backward step) and the Initial flow question style. Networks vary per question: optional arcs (the Fan's rungs, the
  Ladder's diagonal, the Big network's cross arcs) and a **hexagon hub** where any of S, A, B can feed the centre vertex and it can
  feed D, E, T (hundreds of networks); every arc has hand-mapped label positions.
- **One worked model (later the same day):** the Decision shell has no Whiteboard / Show Answer any more — every question is
  worked through (graph + fading steps, Back / Next / Show all), because every question of this complexity needs its steps.
  In the Potentials working an arc that shows its potentials drops its flow circle and min/max label (they swap arc by arc).
  Min/max questions now use real minimums: every arc carries flow and at most about one arc in seven has a minimum of 0.
- **Question, then Answer (later the same day):** every Decision question opens as the question alone (the network as given)
  with an empty **Answer** section and a "Show working" button; the working then builds up one step at a time like the other
  tools' worked examples — each new step fades in, earlier steps stay at half strength on a numbered timeline in a scrolling
  box that follows the newest step and fades out at the top — and the answer arrives last as a green "A" line. Controls: Back /
  Next / Show all ⇄ Step by step, a dot strip (question · steps · answer), arrow keys. The page header was tightened so the graph
  sits higher.
- **Controls at the foot; arrows either side (same day):** the step controls (◀ back · "Step n of N" · Show all ⇄ Step by step ·
  next ▶ · the dot strip) moved out of the question control bar to the foot of the Answer section, whose working area has a fixed
  height so they never move; the control bar keeps only level, Question Options and New Question. On the diagram the two
  potential arrows now sit on either side of the arc — the forward one beside it, the backward one on the opposite side.
- **Two tiers (same day):** Capacity only ⇄ Min and max is now the **top tier** (big either/or tabs above everything), with the
  question styles beneath it — Flow from paths, Find a flow, Potentials, Cut values, Augment flow, Max flow & min cut (Initial
  flow's two styles are separate tabs now). It is no longer in Question Options, which keeps only the small dials (Arcs, Cuts,
  Paths). `ShellOption.top` puts any option in the top tier.
- **Reverse is part of every question (same day):** the Arcs / Cuts / Paths options are gone — every network now has at least one arc
  pointing back against the flow (reversed rungs, hub arcs, cross arcs), every cut question includes an arc coming back across the
  cut, and every augment / max-flow question uses a backward step. Question Options is now just the top-tier Network switch. Cut
  labels sit on the opposite side of the arc from the flow circle.
- **Tabs reworked (same day):** dropped **Flow from paths**; added **Missing flow** (one or two arcs show "?" — find each with flow in =
  flow out at a vertex that has just one unknown; every missing arc is findable in order); reversed the potentials question to
  **Flow from potentials** (the arrows and bounds are shown, not the flows — each arc swaps to its flow as it is read off, then the
  flow value). Tabs now: Find a flow · Missing flow · Flow from potentials · Augment flow · Cut values · Max flow & min cut.
- **Wording and options (same day):** the potentials are now called **potential increase** (maximum − flow, along the arrow) and
  **potential decrease** (flow − minimum, against it) everywhere. A backward arc in a cut and a backward step in the paths are no
  longer forced into every question — they are Question Options ("Include a backward arc" on Cut values; "Include a backward step"
  on Augment flow and Max flow) — but every network still has at least one reversed arc so they can occur (they do in roughly
  35–85 % of questions anyway). Augment flow lists **every** flow-augmenting path, backward steps included.
- Phone width checked (stacks, no sideways scroll; the graph is sticky only on wide screens). Still to do: Harry's-notes update.

## 2026-10-07 — Notes and docs sweep: cast documented

- New `docs/design/CAST.md` (the eight named characters, Feathers, rules); linked from the `CLAUDE.md` documentation map.
- `DEPTH_SPEC_TEMPLATE.md` now names the cast for speakers and covers Feathers `prompt` / `takeaway` and the pyramid switch.
- `docs/PROJECTS.md` Depth section notes the cast and Feathers.
- Harry's notes refreshed: Characters, Build Log, Features, Prongs, Different From & Additional To Tool Shell (re-verified by search), Representations, Tool Index, and the Order of Operations, Speed Distance & Time and Rounding pages.

## 2026-10-07 — Depth: switch the BIDMAS pyramid off

Items that show the BIDMAS pyramid now have a **Scaffold → BIDMAS pyramid** switch in the slide's side rail (same place and style as the number line's switches). It starts **on**, applies to both the question and answer slides, and is kept between questions. Depth only.

## 2026-10-07 — Depth: Feathers talks

The owl now speaks on every Depth slide, in a bubble beside him at the foot of the slide (and beside him under the slide on a phone): a **nudge to the class on the question slide** ("Decide who you agree with, then say why.") and a **takeaway on the answer slide** ("Same row of the pyramid means equal priority: start from the left."). Every item gets a default from its shape (tap-the-line, who-is-right, multiple choice, explain, extend) via `feathersLine`, and an item may override with its own `prompt` / `takeaway` (eight Order of Operations items carry hand-written takeaways). A **Feathers** button under the slide switches the bubbles off per device. Depth only for now. Tests: every item has a short line and every authored one renders.

## 2026-10-07 — Depth: the cast is named; the owl is Feathers

The eight characters have names — **Ruby, Kofi, Mei, Ben, Amara, Leo, Priya, Jamal** — and the owl is **Feathers** (`CAST_NAMES`, `MASCOT_NAME`). Every speaker in the Order of Operations, Rounding and Speed, Distance & Time banks now uses one of these names (no more one-off Jack / Zoe / Dev…), so a name always draws its own face (`assignCast` matches cast names directly). Cross-references between items were updated, and lines that used he/she for a named speaker were reworded to avoid pronouns. New speaker names should come from the cast; glossary updated.

## 2026-10-07 — Depth: a cast of eight, drawn like the owl (then made more natural and detailed)

*Braid:* removed — that character now has plain long straight hair with a side parting.

*Fixes:* the fringe was drawn lower than the top of the head, so a pale crescent of skin showed above the hair (everyone looked bald-ish) — every hairstyle now covers the crown; and the open-mouth tongue poked out below the mouth — it is now clipped inside it.

*Follow-up:* the cast is now plainer and richer — natural hair and colours only (no spiky or bright hair, no headband or earrings), muted tops with their own details (crew neck, polo collar and buttons, hoodie with drawstrings, cardigan over a tee, stripes), strand lines and sheen on the hair, ears, a nose with bridge light, lips, soft chin shadow and, on some, lashes, freckles or thin glasses.

The Depth speakers are now a **cast of eight** (`CAST` in `DepthArt.tsx`) in the owl's style: bust-length figures with soft gradients on skin, hair and clothes, big shiny eyes (white, iris, pupil, two highlights), blush, a gradient shirt with collar and a ground shadow. Each has their own hair (long wavy, fade, bob, messy, afro puff, spiky, braid with headband, curls), and some freckles, glasses or earrings. A speaker's name picks one of the eight and keeps it, and two speakers on one slide never share a face (`assignCast`). `Avatar` now takes `member` instead of `index`/`name`.

## 2026-10-07 — Order of Operations: no repeated lines in the working

Each Worked Example step is now **one line** — the sum as it stands, with the move underlined (and the left-to-right arrow over a run) — and an arrow down to the next step's line, or to the Answer. Previously every step also wrote its result, which was then repeated as the next step's first line and again as the Answer.

## 2026-10-07 — Depth: friendlier people; two overlapping Order of Operations items cut

**Depth speakers redrawn** (`Avatar` in `DepthArt.tsx`): head-and-shoulders in a round "profile picture" with a pastel backdrop, six skin tones, seven hair colours, six hairstyles (short, side fringe, long, curly, bun, pigtails), a shirt, brows, nose, cheeks, three smiles and optional glasses. A character is now keyed by **name**, so Ayla (or Ben, Zoe…) looks the same on every slide in every tool. **Order of Operations bank (now 32):** cut *Reading the pyramid* and *Sana's subtraction* (the add-first Explain items overlapped Zoe's and Tia's); routes re-pointed.

## 2026-10-07 — Order of Operations: working written like a board; pyramid says "&"

**Worked Example** now follows how it is written on a board: the line with the move **underlined** (not boxed), an **arrow down** to the next line with the rest of the sum pulled down, and — when two or more equal-priority operations are left in a row — a **left-to-right arrow over that run** (`3 + 5 × 2 − 9` → underline `5 × 2` → `3 + 10 − 9` with the arrow over it → `13 − 9` → `4`). The second line fades in on the next press. A lone × or ÷ gets no arrow; a `× ÷` run inside a longer sum gets the arrow over just that run. Engine: `Hl.arrows` + `stepFlat` runs; renderer `oooStepRenderer`. Shell: `stepRenderer` now receives the fragment `reveal` index as a 4th argument (documented in `CLAUDE.md`). **Pyramid:** the equal-priority tiles read `D ÷ & M ×` / `A + & S −` (was "="). Checked in the live app; tests assert the exact lines.

## 2026-10-07 — Order of Operations: the pyramid stops implying an order; six Depth items on "add first"

From a Y9 class: students did **add before subtract** (BIDMAS letters read as a list) and read the pyramid's left-to-right *across a tier* as an order of working (A is left of S, so add first). Two fixes. (1) **The BIDMAS pyramid** (shared `BidmasPyramid`): D M and A S are no longer split in half by a vertical rule; each is now **one tile** reading `D ÷ = M ×` / `A + = S −` with the caption "equal priority: left to right in the question"; when a step is being worked its operation is underlined. (2) **Six new Level 1 Depth items** (bank now 34): *Reading the pyramid*, *BIDMAS says A then S* (Ayla vs Ben), *Zoe and the pyramid*, *Spot the error* (`30 − 12 + 5 → 13`), *The sign stays with its number* (`20 − 8 + 3 = 20 + (−8) + 3`), and *Add first: always, sometimes or never?*. Numbers asserted in `orderOfOperations.test.ts`; spec `specs/depth/order-of-operations.md` updated.

## 2026-10-07 — Order of Operations: Focus follows the ticked operations

Unticking an operation now greys out the Level 1 Focus options it makes impossible: untick × and ÷ (or + and −) and *× ÷ before + −* and *Both* grey out (struck through, with a "Needs × or ÷ and + or −" tooltip) while *Left to right* stays; tick them again and they come back as they were. New shared, opt-in mechanism: a multiSelect option's `requires` (shape of `DepthItem.needs`), rendered by the QO popover, with `unmetRequires` / `maskUnmetOptions` helpers the generator uses so a greyed option is never drawn. Documented in `CLAUDE.md`.

## 2026-10-07 — Order of Operations: choose the operations

New **Operations** Question Option on Evaluate (all levels): tick which of + − × ÷ can appear. Left to right with only × ÷ gives 24 ÷ 4 × 2 style lines, with only + − gives 20 − 8 + 3; × ÷ before + − can be limited to, say, × and +. A fraction bar counts as ÷. All four on by default (nothing changes); if the ticked operations can't make the chosen Focus another ticked Focus is used, and only then is the restriction dropped. Spot the Mistake is unchanged (its questions are built around named mistakes). Tests in `orderOfOperations.test.ts`.

## 2026-10-07 — Speed, Distance & Time: the ratio table starts with what we know

The worked example's ratio table no longer arrives with its rows complete. New shared helper `rStepSolve` (`src/shared/ratioTable.ts`): the known values go in first with the unknown cell as a grey "?" (5 mph for 6 hours starts as 5 | 1 over ? | 6), then one press each for *how do we get from 1 to 6?* (the arrow on the time side only), *do the same to the miles* (the arrow on the other side), and the calculation filling the blank (5 × 6 = 30, the new cell highlighted). Multi-step Level 3 chains repeat the three presses per row. Used by all three sub-tools (a find-the-time question drives from the distance side). `RatioTableData` gains `opSides` and `fresh`; `rStepBuild` is unchanged for other tools. Tested in `src/tests/ratioTableSolve.test.ts`.

## 2026-10-07 — Speed, Distance & Time: Depth bank

32 curated diagnose / explain / extend items (`SpeedDistanceTimeDepth.ts`, spec `specs/depth/speed-distance-time.md`), levelled by idea — *Which calculation?* · *Minutes and hours* · *Awkward times & averages* — and live on all four tabs. The tool already had its fourth **Mixed** sub-tool (random Speed / Distance / Time), so the bank covers it with its own items ("Which question fits?", "Does the rule always work?", "One journey, three questions") alongside the shared ones; Speed, Distance and Time each get tab-specific diagnose items. Misconceptions covered include multiplying/dividing the wrong way, 30 min as 0.30 h, 1 h 20 as 1.2 h, 1.75 h as 1 h 75 min, and averaging two speeds. Numbers asserted in `src/tests/speedDistanceTimeDepth.test.ts`.

## 2026-10-06 — Ink overlay and the Rounding Depth bank go live

Both pieces built on this branch are now **ungated**: the **ink overlay** (write anywhere on any tool page — pen, eraser with part / whole-line modes, thickness and size menus, undo, a movable hotbar that docks to the side edges; see the entries below) and the **Rounding Depth bank** (25 items with the number-line scaffold). The overlay is mounted once in `App.tsx` (every tool page; not the landing page or the two sandboxes, which have their own board) and the bank is passed straight to `ToolShell`. Convention added to `CLAUDE.md`: a control that needs a genuine click (a popup — Print) carries `data-trusted-click`.

## 2026-10-06 — Ink overlay: write anywhere on a tool page (built dev-gated)

A transparent layer over every tool page (`src/shared/components/InkOverlay.tsx`, mounted once in `App.tsx`; **Developing-tools mode only**; not on the landing page or the two sandboxes, which have their own board). A pencil button opens a hotbar: **Freeze** (page live, ink stays) · **Pen** · **Eraser** · Undo · Clear · colours. In Draw, a **drag inks** and a **short still tap is forwarded** to the element underneath (pointer/mouse/click events), a long still press draws a dot, and a stylus always inks. Forwarded taps are synthetic, so anything needing a real click is marked `data-trusted-click` (currently the Print buttons): tapping it freezes the layer with "Frozen — tap again". The hotbar is **movable**: drag the grip — docked against a side edge it turns vertical (default: right edge, middle; flat along the bottom on a phone), anywhere else it lies flat; the position is remembered (`mt-ink-hotbar`) and a double-click on the grip resets it. **Pen and eraser options:** four pen thicknesses (stored per stroke) and three eraser sizes (a ring shows the size at the pointer). The options live in small **flyout menus** that open perpendicular to the bar (a column above/below a flat bar, a row to the side of a vertical one) when you tap the already-active Pen or Eraser — a corner tick marks the buttons that have one — so the hotbar itself never changes size or placement; the eraser works in **Part** mode (rubs out just the bit it passes over, splitting a line) or **Whole line** mode (deletes the entire continuous line it touches, measured to the line segments so fast strokes are caught); choices are remembered (`mt-ink-prefs`). **Performance:** the stroke being drawn is one `<path>` written straight to the DOM once a frame (coalesced pointer events for fidelity, near-duplicate points dropped), committed strokes are memoised, the eraser ring is moved without React state, and erasers return the same array when nothing was hit — main-thread work per pointer move fell from ~1.6 ms (3.0 ms with 150 strokes) to ~0.3 ms regardless of how much ink is on screen, and an eraser sweep over empty space from 3.4 ms to 0.3 ms. **Undo** is now a real history (strokes, erase gestures and Clear each undo as one step; Ctrl/Cmd+Z). The snap zone is tight (28 px) and the edge you are about to dock to lights up while dragging; a plain click on the grip leaves the dock alone, and the drop uses the release position (not a render-lagged state). Ink is stored in screen (viewport) coordinates, like a screen-annotation tool — it stays put when the page re-lays out (the Whiteboard fullscreen changes page height and scroll, which made page-anchored ink slide), clears on route change and is hidden when printing. Tested in `src/tests/inkOverlay.test.ts` and headlessly (gating, drag, tap-forward, freeze, hint, erase, fullscreen).

## 2026-10-06 — Depth: no scrollbars, optional number line, new owl

Depth slides never scroll: the panel content is now fit-scaled (`FitBox` in `DepthMode.tsx`) to the 16:9 panel at every screen size. A tool-drawn picture (`visual.type: "custom"`) is now a scaffold with two separate switches in the slide's side rail — **Number line** and **Plot the point** (the second needs the first) — both off to begin with and kept between questions; the answer slide always shows the fully plotted picture. The owl mascot is redrawn (gradient body, feather chest, tufts, brows, talons).

## 2026-10-05 — Rounding: Depth bank (dev-gated)

25 curated diagnose / explain / extend items on **Rounding** (`RoundingDepth.ts`, spec `specs/depth/rounding.md`), levelled by idea — *Which way?* · *Which digit decides?* · *Edge cases & accuracy* — and shown on every tab, with d.p. / s.f.-specific items scoped by `tool` + `needs`. Includes the "round the digit but keep everything else" misconception (31.04 → 30.04). **Dev-gated:** the bank only appears with Developing-tools mode on. Level 1–2 items draw a number line through a new generic `visual: { type: "custom", render }` hook in the shared Depth mode (`RoundingDepthLine.ts` is the line). Numbers asserted in `src/tests/roundingDepth.test.ts`. Not built: letting the tool itself generate decimals under a whole-number target (see the spec's follow-ups).

## 2026-10-05 — Order of Operations and Depth go live; landing-page grouping
- **Un-gated:** Order of Operations no longer carries `enabled: false`, and the Depth mode no longer needs Developing-tools mode — it shows for any tool that passes `depthItems`.
- **Landing-page grouping:** the lone "Order of operations" group (which could never hold a second tool) is replaced by a broader **"Operations & calculation"** group holding Adding & Subtracting Integers and Order of Operations, with room for the rest of the four operations (multiplication/division methods, negatives, powers) to join it. Same fix as the Functional Skills catch-all: a group should name a strand of the scheme of work, not one tool.

## 2026-10-05 — Depth: filling the thin spots
- Audited every Question Option on its own (each sub-tool × level × option, other pools at default) for how many Depth items stay available. Several settings had no Explain or Extend item at all (Left to right, ×-first, +-first, Brackets, Powers, −3² as 9, Nested brackets).
- Seven new items (bank is now 28): Sana's subtraction and Samuel's division (L1 explain), Matilda's brackets and Amir's negative (L2 explain), two L2 always/sometimes/never items (`2a² = (2a)²`, `−n²` is negative), Lena's nested brackets (L3 explain). Worked numbers are asserted in `orderOfOperations.test.ts`.
- New guard in `depth.test.ts`: no single Question Option may leave fewer than 3 items, or only diagnose items, for any tab and level. Every setting now has at least 3 items and a non-diagnose one.

## 2026-10-05 — Depth follows the Question Options
- Depth now shows the same Question Options control as the other modes and reads the same state, so what is ticked in Whiteboard / Worked Example / Worksheet is what Depth sees.
- New optional `needs` on a Depth item (clauses that must all hold; each an option value or an array of which one must be on). Items whose needs aren't met are greyed out in the picker with what they need ("Needs Focus: Roots") and listed after the available ones; purpose counts count only what's available.
- Only items at the current level are filtered; the Start here check and cross-level follow-up links are never blocked. A clause naming no option offered on the current sub-tool/level is skipped, so one list serves Evaluate's focus families and Spot the Mistake's mistake types.
- Order of Operations bank: all items except "make your own" and "how many answers" now carry `needs` (e.g. root questions need Roots, `−3²` also needs Negatives).
- New shared `depthUnmet` helper; tests check every named option exists at the item's level, that default options still leave diagnose + explain + extend at every level on every tab, and the clause logic.

## 2026-10-05 — Order of Operations: Spot the Mistake fits its question box
- Spot the Mistake used the default worded display, so every line was set at full size and overflowed the whiteboard box. It now has its own `questionRenderer`: a small lead-in, ONE aligned block of working (every `=` lines up), a small ask line, and the answer (plus "they …" note) appended on the whiteboard.
- Questions carry a `_fix` block (`intro`, `mathTex`, `ask`, `answerTex`, `note`) next to the existing `lines`, so print/worksheet text is unchanged. The maths scales down (never up) to the width it is given using CSS `zoom`, so long root/fraction lines shrink instead of clipping.
- Evaluate questions fall through to the standard display. Test added: every generated fixIt question has renderable KaTeX in `_fix`.
- Checked: all 45 questions per level fit the box with the answer shown at 1280 and 1024 wide; no horizontal overflow at phone width in whiteboard, worked example and worksheet.

## 2026-10-05 — Depth slides redesigned: two slides, designed not app-like, voting removed
- A Depth question is now **two slides** — question, then answer (← / → / Space or a Question | Answer switch) — instead of progressive builds.
- Designed like a classroom slide (after the White Rose examples, not copying them): navy (site blue) 16:9 stage, left rail (DEPTH wordmark, level + purpose pills, owl), left-aligned white panel with a purpose-coloured top bar (restyled away from the White Rose look), **cartoon speakers with speech bubbles**, big type, and an original owl **mascot** (question mark / tick). New `DepthArt.tsx` (SVG `Avatar`, `Mascot`, `Badge`).
- **Voting removed** (+ / − tallies and the "In the room" line). Tap-the-wrong-line working and the corner pyramid stay.
- **Present fixed**: it is now a full-screen overlay that works in every browser (it used to rely on the element-fullscreen API alone, which fails silently on Safari / iPad / embedded views), with native fullscreen added where available; Esc leaves. The stage reserves room for the controls so nothing is cropped.
- In-browser audit: all 21 questions fit their stage on both slides at 1280 and 1024 wide.

## 2026-10-05 — BIDMAS pyramid moved into the question
- Whiteboard: the pyramid is now a small scaffold pinned to the **top-left of the working box** (new shared `workingScaffold` placement `"workingCorner"`, `cornerWidth`), instead of filling the box, which stays free to write in. (`"question"` placement now also works without a `questionRenderer`.) `ToolShell` now renders a question-placed scaffold with the default question display too (it used to need a `questionRenderer`).
- Worked Example: the picture beside the steps is smaller.
- Depth slide: the pyramid sits small in the corner of the question section (visible from the start, lit once the answer is revealed) instead of in the reasoning band.

## 2026-10-05 — Depth questions become interactive 16:9 slides
- A Depth question is now a **slide**: a fixed 16:9 stage that scales with its width (phones keep a flowing column), a title bar with level and purpose, and a **Present** (fullscreen) button.
- **Builds like PowerPoint**: `→` / `Space` / Next steps through question → answer → one reasoning line per press; `←` goes back; Show all / Hide answer.
- **Interactive**: speech bubbles for "Jack says…"; tap the line of working you think is wrong (the answer marks the first mistake and dims what follows); **class votes** under each choice with percentages and an **"In the room"** line naming the most common misconception; the BIDMAS pyramid beside the reasoning (e.g. A and S lit together for `20 − 8 + 3`). Teacher notes moved behind a toggle so a projected slide never shows them.
- BIDMAS bank upgraded to use them (speakers on the Jack/Jo, Matthew, Priya, Kofi, Elena, Jamal, Ana items; tappable working; pyramid on 6 items).
- Fix: opening `?mode=depth&item=<id>` without a level now adopts the item's level (it used to fall back to the picker).
- Tests: bank test covers speakers / working / visuals; an in-browser audit confirmed all 21 slides fit their stage at 1280 and 1024 wide. 542 tests pass; build clean.

## 2026-10-05 — Depth: curated diagnose / explain / extend questions (pilot on Order of Operations)
- New ToolShell mode **Depth** (`depthItems` prop; `src/shared/depth.ts`, `src/shared/components/DepthMode.tsx`): a bank of fixed, hand-written questions picked by purpose (Diagnose · Explain · Extend) and level, instead of a pre-planned deck. Two beats per item (question → answer + reasoning), named misconceptions on every wrong option, adaptive "class secure / not secure" links (can cross levels), a cross-level **Start here** quick check, deep links (`?mode=depth&level=2&item=<id>`), phone layout. Dev-gated (Developing-tools mode) while piloted.
- Pilot bank: 21 items on Order of Operations (`OrderOfOperationsDepth.ts`) — 7 per level, covering the Matthew/Jack/Jo "who is right" style, the student-working error, `−3²` vs `(−3)²`, `√(9+16)`, the fraction bar, always/sometimes/never, and build-your-own.
- `src/tests/depth.test.ts` validates any bank (ids, one correct option per multiple choice, a misconception for every wrong option, links resolve, every purpose at every level, one Start here per level, every `$…$` renders); `orderOfOperations.test.ts` asserts every number the bank states.
- Docs: CLAUDE.md "Depth" section, `DEPTH_SPEC_TEMPLATE.md`, glossary, PROJECTS prong. 541 tests pass; build clean.

## 2026-10-05 — Order of Operations rebuilt around ideas; BIDMAS pyramid
- **Levels are now ideas, each building on the one below** (spec: `specs/order-of-operations.md`): L1 *Who goes first?* (× ÷ before + −, left to right) · L2 *Things that jump the queue* (brackets, powers; a bracket may contain a Level 1 line) · L3 *Symbols that act as brackets* (roots, fraction bar, nested brackets). `levelOf` rejects any draw that isn't its level, so a harder idea never appears lower and levels never overlap. Tests assert it.
- Selectors cut from an 8-way row to **Focus** (3 options per level) and a separate **Numbers** choice (L2–3, default Whole). Mistakes and tasks align to the levels; Insert brackets starts at Level 2. Sub-tool 2 renamed "Spot the Mistake".
- New mistakes at Level 3: root of part only, fraction bar not a bracket (`flattenGroups`).
- **New shared `BidmasPyramid`** (B ( ) / I ² ³ / D ÷ | M × / A + | S −): a whiteboard scaffold, and in the Worked Example the picture beside the steps, lighting the tier in use (equal-priority partner softly). Steps carry `extra.pyramid`.
- 530 tests pass; build clean.

## 2026-10-05 — BIDMAS checked against worksheets; Decimal Add/Sub Level 3 d.p. is a max
- Order of Operations: students' working is now shown line by line in Spot the mistake (reproduces the worksheet's 9 + 4 × 3 + 2 → 13 × 3 + 2 → 39 + 2 → 41); new **Is it correct?** task ("Matthew says … Is Matthew correct?"); extra shapes from the worksheets (a² + b × c², 7 × (8 ÷ 4)², (a + b)³, √s + b², …) and longer insert-brackets lines (3–5 terms, ÷, occasional 1).
- **Bug fix:** Insert brackets dropped an operator when the brackets were not at the end of the line (e.g. `(3² + 6) − 71`). The test now strips the brackets back out and compares with the original line.
- Decimals Add/Sub Level 3: "Decimal places" is now a single-choice **Max decimal places** (with an info icon) — the longest number has up to that many d.p.

## 2026-10-05 — Decimal Add/Sub: exchanges at Level 2, decimal places at Level 3
- Level 2: new **Carries needed** (Adding) / **Exchanges needed** (Subtracting) pool — 1, 2 or 3+ — one drawn per question and weighted so the Smart Progressor orders a worksheet 1 → 3+. 3+ subtraction uses wholes up to 999 and shows the hundreds column.
- Level 3 (both sub-tools): a **Decimal places** pool now applies (made a max in the entry above).
- `compute` now returns the carry and exchange counts; `src/tests/decimalAddSub.test.ts` checks both pools.

## 2026-10-05 — Order of Operations (BIDMAS): new tool, dev-gated
- New ToolShell tool `src/tools/Number/OrderOfOperations.tsx` (Number → "Order of operations", `enabled: false`; brief: `specs/order-of-operations.md`). It grows the Functional Skills generator's BIDMAS skill into whiteboard / worked example / worksheet with negatives, decimals, squares and cubes, square roots, fraction bars and nested brackets.
- Two sub-tools: **Evaluate**, and **Brackets & Mistakes** (insert one pair of brackets to make a statement true, or find a student's BIDMAS mistake — six mistake types by level).
- Worked example rewrites the line one stage at a time and boxes the part being done (amber `\colorbox`), labelled by stage ("Indices:", "Divide (left to right):", "Brackets — add:"). Roots and fraction bars act as brackets; same-priority chains go one operation per step so left-to-right is visible.
- One small expression engine (tree + BIDMAS stepper + straight evaluator) produces the working, the answer and the generator's validity checks, so they cannot drift. Content is two weighted pools (Question Types × Numbers) per level, so the Smart Progressor orders a sheet easy to hard.
- `src/tests/orderOfOperations.test.ts`: the brief's reference examples line by line, stepper vs evaluator across every family × number mode, mistake answers differ from the right ones, inserted brackets are unique. Build clean; 476 tests pass.

## 2026-10-04 — The answer as its own step (inline chains)
- A final step written as an inline chain ending in a result ("x = 180° − 146°" · "= 34°") used to turn the whole step green with the answer tucked on the end. It now splits into two steps: the working, then the answer as a step of its own, labelled "Answer:" — numbered, green dot, large bold green maths ("x = 34°"). New shared helper `splitAnswerStep(steps)` (src/shared/helpers.ts) does the split from the chain's own left-hand side; `withDiagramSteps` applies it automatically, so every diagram tool gets it, and the picture reveals the answer on that answer step (not a step early). Answer steps (the last step when `hideAnswerStep` is set) are drawn larger and green in the split timeline.
- Other split tools can adopt it with one call on their working; a general automatic version for non-diagram tools is the obvious follow-up.

## 2026-10-04 — Angles in Triangles: real solving steps (via the techniques engine); bigger, centred maths
- The working is now authored the way the techniques engine writes it: a labelled reason step with its equation centred and large ("Angles in a triangle add up to 180°" → x + x + 58° = 180°), then the solving as explicit moves from `solveLinearEquationSteps` at full grain ("Subtract 58° from both sides", "Divide both sides by 2"). Covers Level 1, isosceles (apex- and base-given), both split-triangle variants and the exterior-angle questions; ∠D₁/∠D₂ and the interior angle are solved the same way, so they are solved steps in the picture as well as the working. When the techniques prong lands (grain toggle, more techniques) these steps are already in the right shape — change `GRAIN` or swap a block.
- `solveLinearEquationSteps` gained an optional `unit` (LaTeX suffix for the constants, e.g. `^\circ`), with plain-text step titles (°). Also fixed a pre-existing slip: its two fragments per move repeated the left-hand side and ran together ("2x = 180 − 582x = 122"); they now chain ("2x = 180° − 58° = 122°") — improves the dev-mode linear solve in `NonLinearSimEq` too.
- Keep-working rows (all split tools): maths one size larger (text-3xl; 2xl on a phone).
- Angle labels: when several labels crowd one vertex the best-separated spot is used; 0 overlaps across 50 Level 3 questions checked.

## 2026-10-04 — Split worked example: one look; diagrams show what the working finds
- The two split flavours now share one look: the keep-working steps (geometry tools, Equations of Lines, the simultaneous equations tools, Mixed Strategies) lost their grey backing cards and sit as flat numbered rows on the same spine as the caption timeline, each still carrying its own label and maths; the answer is the same green "A" line. Earlier steps still fade back.
- Angles in Triangles diagrams now show values the working finds, once it finds them: the interior angle at the exterior vertex (step 2), ∠D in the split triangles (both the first ∠D and the straight-line partner), and the second equal base angle in isosceles questions — drawn in green so "found" reads differently from "given". Mechanism: `_step` (the step index) is on each step's picture copy alongside `_focus`; angles carry `appearsAt` / `showAtStep`. Labels on a shared vertex no longer overlap (collision-avoiding label placement).

## 2026-10-04 — Instruction lines no longer lost when a tool has a custom renderer
- ToolShell suppressed a sub-tool's instruction ("Find the gradient of the line connecting:", "Simplify:", "Solve simultaneously:", "Work out:", "Find the perimeter:") on the Whiteboard, fullscreen and Worked Example whenever the tool supplied its own `questionRenderer`, and none of those renderers drew it themselves — so it never appeared. The shell now always shows the configured instruction above the question (worksheets already did). Affects Properties of Line Equations, Collecting Like Terms, Simultaneous Equations (substitution), Decimal Add/Sub and Perimeter; tools with no instruction (the angle / circle / bearing diagrams) are unchanged.

## 2026-10-04 — Line Equations: gradient worked as a triangle
- Properties of Line Equations (Gradients and Line Equations tabs): the gradient working is now drawn as a triangle on the graph — mark the points; join them and complete a right-angled triangle (shaded); read the change in y (green vertical leg, labelled Δy = …); then the change in x (purple horizontal leg, Δx = …); then divide, m = Δy ÷ Δx. Signed values follow the order the points were given, so negative gradients and swapped point order read correctly. The Line Equations tab reuses it, then substitutes and solves for c.
- Shared grapher: new `Segment` primitive (labelled line segment between two points, appears at a build step; legs of a gradient triangle, rise / run markers) — `segments` on `SmartGrapher` / `GraphBuildSpec`, drawn in `drawGraph`.

## 2026-10-04 — Per-step highlighting: Angles in Triangles
- In the split Worked Example, each step now lights the angles it is about: they glow amber (arc, wedge and label) while the others fade, with the unknown kept in blue — e.g. "sum to 180°" lights all three, "known + known + x" lights the two given angles, "x = 180° − …" lights x. Covers every question type (Level 1, isosceles, split triangle both variants, exterior angle both ways); the unlabelled angle at D shows no emphasis.
- Mechanism: a question carries `_stepFocus` (one entry per step); `withDiagramSteps` puts each on the per-step copy as `_focus`, and the tool's own renderer reads it (`TriangleDiagram` takes a `focus` prop). Test `src/tests/geometryFocus.test.ts` checks every focus index is a real angle. Other geometry tools next (same pattern).

## 2026-10-04 — Geometry tools on the two-view (split) worked example
- Basic Angle Facts, Angles in Triangles, Angles in Quadrilaterals, Angles in Parallel Lines, Properties of Circles, Bearings and Perimeter now use the split Worked Example: the diagram sits in the picture slot beside the steps (above them on a phone), each step keeping its working, with the answer drawn on the final step. Once the answer is showing, the question box above shrinks to the one-line prompt ("Find x") so the diagram is never shown twice (Bearings and Circles, whose drawings carry their own prompt, show none). Whiteboard, worksheets and printing are unchanged. Equations of Lines already used the split.
- Built once in shared: `src/shared/diagramSplit.tsx` (`withDiagramSteps`, `diagramStepVisual`, `diagramSplitQuestion`), switched on per tool with three one-liners — any diagram tool that stores its drawing on `_diagram` can opt in. Per-step highlighting (lighting the angles each step uses) is the natural next step — **started with Angles in Triangles** (next entry). Build clean, 426 tests pass.

## 2026-10-04 — Functional Skills Generator: topic tabs
- The skill picker now shows one topic at a time: a row of topic tabs at the top of the left half only (Number facts · Calculation (arithmetic, negatives and BIDMAS) · Place value · Properties · Fractions · FDP & units — one row on a desktop, two on a narrower laptop, scrolling sideways on a phone), level with the worksheet builder on the right with a count badge of the skills already picked in each, then only that topic's tiles. The page is far shorter (about 1,430px → about 980px with a few skills picked) and is slightly wider (max-w-6xl) so the tabs fit. Each skill's **options now live in the left container**: once a skill is added its tile gets an Options bar, and the open skill's options show in a panel under the tiles (tiles keep their places); a skill's options **open automatically when it is added**; the right-hand "Your worksheet" panel keeps just the − / + counts and remove buttons, with a small options icon that jumps to the skill on the left. Decluttered: smaller title and a shorter subtitle, Clear all moved beside the skill count (Settings alone in the panel header). Settings and PDF generation unchanged; tiles slightly larger and easier to read.

## 2026-10-04 — Go-live calls: Surds live, Perimeter dev-gated
- Surds: `enabled: false` removed; now live on the landing page.
- Perimeter: set `enabled: false` (dev-gated) — thin options and outdated; Simplifying Ratios stays gated pending work.
- Dropped the "(BETA)" from Perimeter's display name.
- Build clean, 402 tests pass.

## 2026-10-04 — Tool Review blocks seeded (planner)
- All 35 ToolShell tool notes in Harry's planner now carry a filled Review block: content, readiness, sandbox fit, techniques, worked solution, Smart Progressor, mobile, audit findings.
- 27 were seeded from `docs/TOOL_AUDIT.md`; 8 newer tools (Rounding, Comparing & Ordering, Adding & Subtracting Decimals, Speed Distance & Time, Mixed Strategies, Surds, Binary Operations, Number Bases) from specs and `docs/PROJECTS.md`.
- Worked-solution lines reflect the live single-answer / picture status and the 19 tools still needing a closing answer step.
- Status field is "seeded from audit" or "seeded from specs" until each tool is reviewed in person.

## 2026-10-03 — Negative counters (shared representation + sandbox)

- **Shared representation:** `src/shared/counters.ts` + `components/Counters.tsx` — yellow = +1, red = −1 (the algebra tiles'
  yellow/red), zero pairs, ghosted "taken away" counters, each labelled +1 / −1 so colour isn't the only cue. Working-step support
  (`cStep`, `countersStepRenderer`, `countersStepVisual`) so a board can develop beside the captions like the place value table.
- **Sandbox tool:** `/negative-counters` (Interactive Tools) — drag from the tray or tap, Move / Flip / Take away, Add zero pair,
  Remove zero pairs, Tidy, live value readout, and a "When +1 meets −1" setting: pair up (circled zero pair) or collapse to nothing. Standalone by design (like Algebra Tiles).
- **Representation table ("mat"):** a + row above a − row (rules between rows and labels), counters aligned in columns so a + over a − is a
  zero pair. Shared as `matBoard` / `layout: "mat"`; in the sandbox as a draggable **Table** board (counters snap into columns of their own row, swapping if the cell is taken;
  flip moves a counter between rows; pair up shades matched columns, collapse cancels them).
- **Notes workflow:** Harry's planner now holds the human-readable layer (Build Log, Feature Tracker with linked feature blocks, Representations); `CLAUDE.md` "Ending a session" gained a step to update it each session.
- Not yet wired into a question tool — Integer Add/Sub is the first target (representation switch: counters → number line).
- **Sandbox layout now matches Algebra Tiles:** blue header with burger menu (Value Summary toggle), narrow panel (Table / Collapse / + Pair / ZP buttons, undo / clear / tidy, Positive and Negative counters), dot-grid canvas with a floating dark Move / Flip / Take away hotbar, and a Value bar along the bottom. Behaviour unchanged.
- **Sandbox has the full Algebra Tiles toolbar:** floating bottom bar with Select, Grab/pan, Pen, Eraser, Clear drawings and the five pen colours, plus Flip and Take away. Ink, counters, table and dot grid pan and zoom together (burger menu: Zoom, Reset view). The bar and ink helpers now live in `src/shared/components/BoardTools.tsx` (`DrawHotbar`, `HotBtn`, `eraseNear`, `strokePath`) and Algebra Tiles imports them from there, so the two stay identical.
- **Sandbox tuning:** counters are smaller (38 px, was 52) so the board and boxes are in proportion; in the Table, pressing the **+** or **−** row label adds a counter to that row; a zero pair now behaves like a PowerPoint group — one press picks up both (boxed pair highlights, Table: the whole column moves and swaps with the target column), a quick second press breaks it apart and moves just that counter. Fixes table counters jumping when dragged (they had no x / y of their own).
- **Removed Friday Phonecalls** (`CallSelector`, `/call-selector`): file, registry entry and drift-check line deleted; doc mentions cleaned up.
- **Zero pairs are boxed, not circled:** a + stacked over a − inside a rounded blue frame (shared `PairBox` / `pairBoxStyle`), instead of a ring on each counter plus a shaded column. Applies to the mat table, free-standing `zeroPairs` rows, and the sandbox (Free: pairs stack and box when dropped together or added with + Pair; Table: each matched column is boxed). Unpaired counters sit outside the boxes.

## 2026-10-03 — Developing worked-example visuals rolled out (graphs, ratio tables, place value, number lines)

- **Split layout polish:** the answer in the split is a green **A** line on the timeline (no box/outline); thin custom
  scrollbar (`.thin-scroll`); `detachLast` on the place value table sets Comparing & Ordering's Order column apart.
- **SmartGrapher step builds:** new `step` prop + `step` tags on series / points / guides / regions; `graphStep` /
  `graphStepVisual` helpers. New split variant `stepVisualKeepsWorking` (maths cards stay beside the picture).
- **Wired:** Equations of Lines (points plot, line drawn, y-intercept picked out; new "mark the points" step; graph now
  also in Worked Example), Non-linear Sim. Eq. (curve, then line, then solutions), Mixed Strategies L3 (lines, then peak).
- **Ratio table:** `rStepBuild` grows one table a row per step; Speed/Distance/Time moved onto the caption-only split.
- **Powers of 10:** the grid now develops (number placed, direction, digits slide) beside captions.
- **Number lines:** Integer Add/Sub (start point, then the jump) and Rounding's number-line method (ends, number and halfway,
  half shaded, answer ringed) develop full width above the steps (`stepVisualPlacement="top"`).

## 2026-10-03 — Duplicate green answer box retired across ToolShell tools

- **Rolled `hideAnswerStep: true` out beyond Surds** to 15 more tools whose last working step already
  states the exact final answer (audited over ~150 draws per sub-tool × level, default and all-options-on QO):
  ExpandingBrackets, SolvingLinearEquations, AnglesInQuadrilaterals, AnglesInTriangles, Bearings,
  CircleProperties, PerimeterTool, Estimation, FractionMultDiv, IntegerAddSub, Percentages, Rounding,
  SimplifyingRatios, BinaryAddition, NumberBases. The final step now carries the green ring instead.
- **Not yet migrated** (last step is not the answer, so the flag would hide it): CollectingLikeTerms,
  CompletingTheSquare, Iterations, NonLinearSimEq, SimultaneousEquations, MixedStrategies,
  AnglesInParallelLines, BasicAngleFacts, EquationsOfLines, ComparingOrderingNumbers, DecimalAddSub,
  FractionsAddSub, PowersOfTen, BestBuys, FractionToRatio, FractionsOfAmounts, RatioSharing, Recipes,
  SpeedDistanceTime. Each needs its working to end on the answer first.

## 2026-10-01 — Full-screen app: light system bars, immersive on Android

Manifest `display` is now `fullscreen` (falls back to standalone) and `theme_color` /
`background_color` / `<meta name="theme-color">` / `html` background are the light page colour
(`#f5f3f0`), so the status/navigation bars never show as navy bars. Reinstall the home-screen app
for Android to pick up manifest changes.

## 2026-10-01 — Installable web app (full screen on mobile)

Added `public/manifest.webmanifest` (`display: standalone`, `fullscreen` preferred), app icons
(`favicon.svg`, 192/512 PNG, maskable 512, `apple-touch-icon.png`) and the iOS/Android meta tags
in `index.html` (`viewport-fit=cover`, theme colour, web-app-capable). Once "Add to Home Screen" is
used on a phone, the site opens with no browser address/search bar. No service worker (no offline
caching, so no stale-deploy risk).

## 2026-10-01 — Worksheet text-size chevrons restored on text worksheets
`hideFontControls` (set for the whiteboard's scaled table/diagram) was also removing the text-size chevrons from the Worksheet, even when the sheet was plain text. New ToolShell default **`worksheetFontControls`**: with `hideFontControls` on, the Worksheet keeps its chevrons unless a question in the sheet sets `_fixedSizeCell: true` (a grid/diagram cell drawn at a fixed size). Set on Adding & Subtracting Decimals (grids on → `_fixedSizeCell`, chevrons hidden; grids off → chevrons back), Powers of 10 and Adding & Subtracting Integers (text-only worksheets). Checked headless: 2 chevrons on those text worksheets, 0 with decimal grids on, 0 on a diagram tool (Angles in Triangles) as before.

## 2026-10-01 — Mobile pass on the evolving-visual worked examples
Checked decimals, Comparing & Ordering and Ratio Sharing at 390px (phone): the picture panel was widening to its content (a grid item grows to fit) and overflowing the screen. Fixes: the layout is `grid-cols-1` with `min-w-0` panel and list (table and bars now fit the screen; the table is above the timeline on phones); `FitWidth` is now exported and also shrinks its box to the scaled height (it used to leave a blank gap) — Ratio Sharing's bar model uses it so long bars scale down instead of overflowing; the place value table is more compact on phones (smaller digits, narrower operator gutter) and in words-heading mode shows the letters on phones (the words do not fit a column; full words from `sm` up); Comparing & Ordering's question line shrinks on a phone (`min(1em, 5.5vw)`) so a list of numbers stays on screen. Measured: no element wider than the viewport on any of these worked examples or their whiteboards at 390px, no console errors; `npm test` 395, build clean.

## 2026-10-01 — Ratio Sharing on the evolving-visual cascade
Ratio Sharing's worked example now shows **one bar model updating in place** beside a timeline of captions, instead of redrawing the bars on several cards. Every bar step (`bStep`) now carries a one-line caption in `plain` (e.g. "Value of 1 part: £60 ÷ 5 = £12."), the bar drawing was pulled out into `barVisual` (the old heading cards reuse it), and `ratioStepVisual` is the tool's `stepVisualRenderer`. Shared change: `stepVisualRenderer` may now return `false` for a **caption-only step** — it sits in the timeline as a numbered line while the picture from the nearest earlier picture step stays on screen (the total / value-of-1-part / identify steps here). Sharing, known-amount, difference and mixed all checked headless (one visual panel on every press, no console errors); `npm test` 395 and build clean. Audit result for the other tools: nothing else repeats a picture per step.

## 2026-10-01 — Evolving-visual cascade: lighter look
The captions beside the evolving table are now a **timeline** instead of grey cards: numbered dots on a thin vertical line, the current step in a ringed navy dot with bold dark text, earlier steps muted and faded, bigger caption text, no boxes — so more history fits in the scroll area. The table sits in its own white bordered panel, centred. Applies only to steps with a `stepVisualRenderer` (decimals, Comparing & Ordering); ordinary step cards are unchanged.

## 2026-10-01 — Evolving-visual cascade: captions in a fixed scroll area
In the side-by-side layout (table + step captions) the captions now sit in a **fixed-height scroll area** the same height as the table, instead of growing the page: it follows the current step (smooth auto-scroll to the newest caption) and **fades out at the top** once older steps scroll away. The page height stays constant however many steps there are (decimals Level 3, six steps: page 1091px before and after, caption list scrolling 267px of 839px). On narrow screens the table sits on top and the caption list is capped at 20rem and scrolls.

## 2026-10-01 — Evolving visual in the cascade (one table, updating in place)
A table reprinted on every cascade card clogged the page, so steps whose working is a picture now use a **`stepVisualRenderer`** (new `ToolShell` / `WorkedExampleSteps` prop). For those steps the cascade list shows only the caption (`step.plain`), and a single visual — the current step's — sits beside the list (sticky on wide screens; above it on narrow ones) and updates in place on every press, with ← retracing it. Show All shows all the captions plus the final visual once. Steps with no visual renderer, and the `single` layout, are unchanged. Wired for the decimal add/subtract tool (`placeValueStepVisual`, new shared export) and Comparing & Ordering (its own visual, with the "Order: 1 = …" caption). Checked headless: after each of three presses on both tools the cards grow 2→3→4 while exactly one table is on the page.
Not yet applied: ratio tables (Speed/Distance/Time), whose steps are different tables rather than one evolving picture.

## 2026-10-01 — Cascading Step-by-Step Worked Example is live for every tool
Step-by-Step navigation in Worked Example is no longer Developing-tools-gated, and its default layout is now the **cascade** (`workedExampleLayout: "stacked"` — earlier steps stay visible, dimmed, the current one ringed, nav footer anchored) instead of the single replace-the-card layout. Show All remains the alternative via the toggle. A tool can still opt back into the single-card layout with `defaults.workedExampleLayout: "single"`. `ToolShell` no longer reads dev mode for this (`stepThroughEnabled` always on). Checked headless outside dev mode on fractions, decimals, comparing/ordering and Powers of 10: Step-by-Step toggle present, cards accumulate per press (decimals: 1→4 cards over three presses), no console errors; table steps stack cleanly.

## 2026-10-01 — Landing page: tool groups + search
New optional `group` on registry entries (`ToolMeta.group`); the landing page draws a small sub-heading per group inside a category, in order of first appearance (ungrouped categories render as before). Number is grouped in scheme-of-work order: Place value & decimals (Comparing & Ordering, ×÷ 10ⁿ, add/subtract decimals) · Rounding & estimation · Integers · Fractions & percentages · Roots & surds. New search box under the subject toggle filters cards by name/description/group at word starts ("round" finds Rounding, not "around a point"), hides empty categories, and shows a no-match message. Checked headless: group headings, search results and clear all work, no console errors.
**Grouping extended to Algebra** (Expressions · Equations · Quadratics & iteration), **Ratio & Proportion** (Ratio & sharing · Proportion & rates) and **Geometry** (Angles · Shapes & measures · Lines & bearings), each ordered by scheme of work. Left ungrouped: Generators, Interactive, Teacher, Decision Maths, Computer Science and Binary (4 or fewer tools each, or dev-only).

## 2026-10-01 — Comparing & Ordering moved onto the shared place value table
`ComparingOrderingNumbers` no longer has its own table: the Worked Example steps and a new whiteboard scaffold draw with the shared `PlaceValueTable` — `[Sign] · whole places · decimal places · Order`, decimal point on the Ones edge, same letters/words headings and "Words in column headings" switch as the other tools. **Shared table gained two cell features:** `circle` ("on" for a deciding digit, "dim" for an unwritten zero that decides) and `badge` (filled value, used for the rank), in both the HTML and SVG renderers. The column scan is now per place (whole numbers up to 20 at Level 2 get Tens + Ones columns and "the tens digit" / "the ones digit" steps, replacing the single "whole-number part" column). **Whiteboard:** the working box shows the numbers already written in (no circles, empty Order) with an "Order: 1 = smallest/largest" caption; Show Answer fills Order (no circles — see below); the table button hides it. **Whiteboard reveal kept simple:** Show Answer only fills the Order column — no circled digits (that detail lives in the Worked Example, so the plain reveal isn't cognitively heavy).
**Full-width layout:** the whiteboard scaffold uses `placement: "question"` with the working panel collapsed (as Powers of 10 / decimals do), via a small `questionRenderer` (tighter line spacing, answer line reserved so Show Answer never rescales the box; default text-xl) — the half-width box squeezed up to six rows. Shared fix: the empty rank badge / circle spans are `align-middle`, so an empty Order cell no longer makes its row taller than a filled one (the table was ~40px taller before Show Answer). Checked headless: table box identical before/after Show Answer on Order (512×201) and Compare. **Fix:** Order's display shuffle is now stored on the question, so a display-only change (headings switch, direction wording) no longer reshuffles the numbers.
Verified: `tsc`, `npm run build`, `npm test` (395) clean; headless — Compare L1, Order L2/L3 whiteboard and worked example render the shared table with letters and words headings, no console errors.

## 2026-10-01 — Place value table unification (shared columns, headings toggle) — Powers of 10 moved onto it
**Shared (`src/shared/placeValue.ts`, `PlaceValueTable.tsx`):** one canonical column catalogue, `pvColumnSet(whole, dec)` (M … O . t … mth) giving both letters (`H T O t h th`) and full words (`Tens`, `Tenths`…), so a place carries the same label in every tool. New `headerStyle: "letters" | "words"` + `columnNames` on `PlaceValueTableData` (HTML and SVG both honour it; long words shrink to fit). New shared `PV_WORD_HEADERS_VAR` ("Words in column headings" QO switch, read live at render time via `qo.variables`, so toggling it never regenerates the question), `pvDisplay` (shared row height, no tint, heading style), `pvSlice` (promoted from the decimal tool), `PV_CELL_H` and `PV_TABLE_START_DD`. `placeValueStepRenderer` now reads the heading switch from `qo`.
**Decimal add/subtract:** builds on the shared helpers, gains the headings switch (whiteboard, worked example, worksheet grids). No behaviour change otherwise.
**Powers of 10:** same tool, updated representation — shared column set (labels now `HTh TTh Th … tth hth mth`, replacing `HTt/TTt/Tt/htth`), shared row height, and the whiteboard grid is the same three-row table (input / move / output) empty or filled so it no longer resizes on Show Answer; headings switch added. Level 3 statement unchanged.
Verified: `npm test` (395) and `tsc` clean; headless — grid box 983×235 identical before/after Show Answer (levels 1–2), add/sub 804×248 unchanged, words headings render on both tools, no console errors.
**Next:** migrate Comparing & Ordering onto the shared table (needs a circled-digit cell, sign column, rank column).

## 2026-09-30 — Adding & Subtracting Decimals (Number) + shared place value table — live
New tool `/decimal-addition-subtraction` (`src/tools/Number/DecimalAddSub.tsx`, registered `enabled: false`). Two sub-tools, Adding and Subtracting, built on a **new shared place value table** (`src/shared/placeValue.ts`, `src/shared/components/PlaceValueTable.tsx`) extracted from the Powers of 10 grid; `PowersOfTen` now renders through it (same look, no behaviour change). Levels 1–2: same decimal places (QO pool: 1/2/3 d.p.) — L1 no carrying/exchanging, L2 needs it. Level 3: different decimal places via a question-type pool — Adding: different d.p., whole + decimal, answer ending in 0 (3.50 → 3.5); Subtracting: placeholder zero needed (4.1 − 3.23), whole − decimal (5 − 2.36), exchange across a zero (6.04 − 1.78), longer number first. Whiteboard shows an empty table to fill; Worked Example builds it step by step (write → placeholder zeros → each column right to left, carries/exchanges written above digits, trailing zero dropped). All arithmetic integer-based. Teach deck deliberately left out.
**New ToolShell concept — `workingScaffold`:** a tool can place content (here the place value table) inside the whiteboard's working box, with a toolbar toggle to hide/show it so the scaffold can be removed. The decimal tool's whiteboard now uses it (equation in the question box, table in the working box) instead of collapsing the panel; `workingScaffold` gained `placement: "question"` (scaffold inside the question box, full width with the working panel collapsed, hide button in the question box); both the decimal tool and Powers of 10 use it, so the place value table/grid can be hidden in both. Powers of 10's Worked Example still draws the filled grid via its question renderer.
**Stability pass:** the whiteboard table now keeps one row height whether empty, pre-filled or answered (was 96px empty → 72px answered, so it resized and rescaled on Show Answer); the equation reserves room for "= answer" so it no longer shifts; Worked Example captions reserve two lines so the card stays the same height from step to step. New display-only **"Table starts"** dropdown (Empty / Numbers in / Numbers + zeros, `workedExampleOnly` so hidden on worksheets) pre-populates the whiteboard table; it is handled by `reformatQuestion`, so changing it does not regenerate the question. Layout measured in headless Chromium: table box identical before/after Show Answer and across all Worked Example steps.
**Answer placement:** with the table showing, the whiteboard no longer writes "= answer" beside the equation — the answer appears only in the table's bottom row and the equation stays centred; with the table hidden the answer appears inline as before. New `QOSnapshot.scaffoldVisible` tells a renderer whether the working scaffold is on screen.
**Table sized to the question range:** the decimal table now shows only the columns the selected questions can need — decimal columns follow the active "Decimal places" options (Level 3 always 3), whole-number columns follow the tool/level (Level 1: Ones only; Subtracting L2–3: Tens + Ones; Adding L2–3: Hundreds + Tens + Ones) — at a fixed column width, so fewer columns means a narrower table with the same row height. All 3,600 sampled questions fit their table and every Worked Example step shares the question's columns. New optional `PlaceValueTableData.colWidth` in the shared table.
**ToolShell:** with the whiteboard's working panel collapsed (full-width mode) the Fullscreen / Exit Fullscreen button is no longer lost — it now sits in the question box's control cluster beside the re-open and scaffold-hide buttons, in both the embedded and fullscreen views, for every tool that collapses its panel. Checked on the decimal tool and Powers of 10: collapsed → Fullscreen → Exit Fullscreen works, and with the panel reopened there is exactly one Fullscreen button. Button order is now the same in both states — panel collapse/re-open, then Fullscreen last — so it doesn't swap when the panel opens or closes.
**Font size buttons return when the table is hidden:** a tool that hides its size chevrons (`hideFontControls`) because its question-box scaffold is the content now gets them back while that scaffold is hidden, and the question stops auto-growing to fill the box so the buttons actually resize it. Applies to the decimal tool and Powers of 10 (ToolShell-level). Decimal tool now starts at text-5xl. Checked: hidden → chevrons appear, up/down change the equation width; table shown again → chevrons gone.
**Worksheet grids (opt-in):** new "Grids on worksheet" toggle gives every worksheet question its own place value grid; the existing "Table starts" dropdown (now also visible on worksheets) sets whether it is empty / numbers in / numbers + zeros. Shared `PlaceValueSvg` + `pvSvgAspect` draw the same table data as an SVG cell, so it prints through `handleDiagramPrint` (the tool's print handler falls back to the text printer when grids are off). Answer pages use a hidden solved twin. Trade-offs: a gridded sheet prints in at most 2 columns (differentiated sheets keep one column per level) and fewer questions fit per page (density floor 46 mm ≈ 8 per page at 2 columns). Checked headless: grids on → 8 on-screen grids + 8 answer twins, printed 2 pages / 16 cells in 2 columns (3 asked); grids off → unchanged text print.
**Worksheet grids, round 2:** the switch is now worksheet-only (hidden from the Whiteboard / Worked Example options) and has an (i) explaining the 2-column limit. New generic `ToolVariable` flags: `worksheetOnly`, `info` (hover note), `capsColumns` (while on, worksheet columns are capped — on screen, in the Columns input and in print — so the worksheet you see is the one you print; turning it off restores the chosen count). Grids now print up to 10 per page (5 rows × 2) and stretch their rows so fewer questions fill the page (cells 92×63 mm at 8 questions, 92×88 at 4, 92×50 at 12); the print handler re-draws each grid with the page-fill row height (`pvSvgRowHForAspect`). Fixed grids overflowing their cell in print (`PlaceValueSvg fill`). Checked headless: switch absent on whiteboard, present on worksheet with one (i); 3 columns asked → 2 shown, Columns input max 2; 12 questions → 10 on page 1.
**Worksheet preview + centring fix:** the on-screen worksheet grids were stretching to the full cell width (huge); they now cap at about half scale and centre in the cell (320 px in a 536 px cell), print unchanged. The equation looked off-centre because the operator column (+ / − / =) sat to the left of the table, pulling the whole table body right of the equation; the shared table (HTML and SVG) now mirrors that column on the right, so the table body is exactly centred under the equation. Measured on the whiteboard: equation, table body and box centres all at the same x (650) on add/subtract at several levels.
**Live:** default text sizes lowered one step (whiteboard text-4xl, text-only worksheet text-lg) and the tool is un-dev-gated (`enabled: false` removed) — it now appears on the landing page.
Verified: 4.1 − 3.23 and 6.04 − 1.78 working matches by hand; `npm test` (395) and `npm run build` clean; live render checked in headless Chromium with no console errors.

## 2026-09-29 — Rounding (Number) — live
New tool `/rounding` (`src/tools/Number/Rounding.tsx`, registered `enabled: false`). Three sub-tools —
Nearest 10/100/1000/whole, Decimal Places (1–3), Significant Figures (1–3). Level 1: number line with
the number marked and labelled ends + midpoint (QO: "Every mark" labels the whole line). Level 2: same
line with blank boxes to fill in (QO: "Midpoint only" gives the ends). Level 3: question only. QO
"Include exact halfway values". All values derived from integers (no float drift); SVG worksheets
print via `handleDiagramPrint`.
Follow-up: "Exactly halfway" is now a 2-option weighted pool (ToolShell's click-to-cycle button: any position → mixed → exactly halfway). "Number on the line" (Plotted for them / Students plot it) is its own Levels 1–2 QO, so any labelling combines with either. **New ToolShell concept — staged reveal:** a question may set `_stagedReveal: "<label>"`; the whiteboard/worked-example reveal button then shows that label first ("Show Plot"), exposing `qo.preview` to the renderer, and only the next press shows the answer (Hide resets both). Opt-in per question; worksheets unaffected.
Follow-up: the staged-reveal button now sits inside the question box (separate from Show Answer). Rounding worksheets: ≤5 questions print one per row (fills the page), otherwise the chosen columns; max 12 per page via new opt-in `_densityFloorMm` in `handleDiagramPrint`; default 12 questions; all levels share one cell shape.
Follow-up: Level 3 is back to a normal text (`worded`) question — standard display, sizing and text print (scales to fit). Mixed/differentiated diagram sheets print L3 as a text cell via new opt-in `_printText` in `handleDiagramPrint`.
Follow-up: **Worked Example now teaches the digit rule and the line** — 6 steps: rounding-digit wording, a digit-box step (rounding digit blue, decider orange, dropped digits greyed, s.f. leading zeros noted), the ≥5 / <5 rule, a number-line step (boundaries, halfway, number), the halfway comparison, answer. Custom `stepRenderer` (`roundDigits` / `roundLine` steps). New QO *Digits past the rounding position* (one extra = on a tick / two extra = between ticks) on Levels 1–2. Answer pages now print the plotted line (hidden `data-q-answer-index` twin SVG), including for "Students plot it". "Exactly halfway" no longer feeds the Smart Progressor. Added `specs/rounding.md`.
Follow-up: dotted line between the rounding digit and decider in the digit step; "Digits past the rounding position" now applies to nearest 10/100/1000 too (Levels 1–2: 3480 on a mark vs 3482 between marks); Level 3 keeps natural digits.
Follow-up: **Working method selector** (Worked-Example-only dropdown): *Digit rule* (rounding digit + decider + 5-or-more, 4 steps) or *Number line* (two answers either side, halfway, which is closer, 4 steps) — one method per example instead of both. `reformatQuestion` rebuilds the steps for the same question on switch.
Follow-up: "Exactly halfway" is now a `cycleDisplay` common/rare pool — Off / Mixed (~5%) / Always — so Mixed is genuinely rare on the whiteboard *and* on worksheets (no `weight`, so no Smart Progressor even split).
Follow-up: new opt-in `ToolMultiSelect.exclusive` (single-choice / radio pool, handled in `MultiSelectSection`); Rounding's *Number line labels*, *Student fills in* and *Number on the line* pools now use it, so a worksheet can't mix them.
Follow-up: number line drawn larger (bigger marker/labels/boxes, 40-unit answer text, wider caps: whiteboard 442→653 px, worked example 640→900 px); custom Worked-Example step labels no longer bold — they match the standard step text.
Follow-up: in Worked Example mode the question box no longer shows the answer (text, circle, filled boxes) — it is found by stepping through the working; whiteboard/fullscreen unchanged.
Fix: the hidden answer-page twin on worksheet cells was drawing on screen (the SVG's inline `display:block` overrode the `hidden` class) — it now sits in a `display:none` wrapper; print still copies the twin.
New opt-in `defaults.qoColumns: 2`: the Question Options popover lays out in two balanced columns with a thin grey divider (twice as wide, centred under its button). Used by Rounding; applies to the standard popover (whiteboard / example / worksheet); its border is now a 2px mid-grey outline.
Fix: the advanced worksheet builder updated QO values from a stale copy, so a single-choice (`exclusive`) pool — which sets one option and clears the rest in one click — ended with both selected and stuck; `updateGroup` now takes a function of the latest group. The builder's QO panel also hides `workedExampleOnly` dropdowns (Rounding's working method).
Final changes: *Number on the line* now defaults to **Students plot it**; nearest options ordered 10 / 100 / 1000 / whole (a difficulty scale); **Rounding taken live** (`enabled: false` removed).

## 2026-09-28 — Comparing & Ordering Numbers (Number) — live
New tool `/comparing-ordering-numbers` (`src/tools/Number/ComparingOrderingNumbers.tsx`,
`specs/comparing-ordering-numbers.md`) — `Compare` (two numbers) and `Order` (3–6 numbers) built
from a shared decimal/negative-number engine designed around named, teacher-tailorable
misconceptions rather than random-shaped numbers. Five `trapType` options (multiSelect, teacher
picks which are active): `clean`, `longerIsSmaller` (`0.3` vs `0.25`), `shorterIsSmaller` (`0.2`
vs `0.25`, mathematically guaranteed by construction), `wrongPriority` (`0.311` vs `0.259`,
tenths decide despite a hundredths/thousandths decoy) and `ignoreWholePart` (`4.2` vs `3.9`, whole
part decides despite a tenths decoy) — capped at thousandths tool-wide. `wholeNumberPart` and
`sign` are 2-option weighted cycle pools (None → Mixed → Exclusive); `Notation` (Words/Symbols)
reformats instantly via `reformatQuestion` with no regeneration. Order draws each adjacent gap in
the sorted list independently from the active trap pool, so a list can genuinely stack several
different traps rather than guaranteeing exactly one. Levels run Decimals → Negative integers →
Decimals + sign. Verified with an ad-hoc scratch test (not committed) exercising every non-default
QO combination plus archetype-shape correctness for all four decimal traps, on top of the standard
`__test` smoke suite. Follow-up: swapped `Notation` to a weighted multiSelect cycle (Words →
Mixed → Symbols, so a worksheet can blend both) and `count` (Order) to the freed dropdown slot —
functionally the same per-level defaults, just different control types.

**Same-session refinements, landing on a place-value-table Worked Example:** `Notation`,
`wholeNumberPart` and `sign` moved to plain 2-cell toggle pairs (no cycle button); `sign` dropped
"positive only" for **Negative/Mixed** (Mixed = harder); Compare gained an `ask` pool
(Bigger/Smaller); Direction (Order) grew to 4 wording options (`ascending`/`descending`/`smallest
to largest`/`largest to smallest`), each rendering as a full sentence ("Write in ascending
order:", "Order from smallest to largest:"); Order dropped its Symbols/inequality-chain notation
entirely (words-only). The Worked Example step replaced its text narrative with a **place-value
table**: a genuine radix-sort-style column scan (sign → whole → tenths → hundredths →
thousandths) that splits still-tied numbers by digit value at each column, circling and
numbering — one row at a time, even when several settle in the same column pass — whichever
numbers become uniquely determined there. Each step narrates what happened ("Now placed: −0.8 is
the 3rd smallest." / "Every number still matches here."), highlights the whole column currently
being compared, and keeps every cell the same fixed size so nothing jumps as circles appear. Fixed
a real bug along the way: `wholeNumberPart` pinned to `zeroOnly` could still leak a non-zero whole
part through one fallback path. Verified throughout with the full test suite, targeted scratch
tests (deleted before commit) proving the column-scan and reveal-ordering logic, and browser
screenshots checked against the actual generated values. Now **live** on the landing page.

## 2026-09-23 — Decision Maths: Travelling Salesperson (nearest neighbour) on `DecisionShell`
New dev-gated tool `/travelling-salesperson` (`src/tools/Decision/TravellingSalesperson.tsx`) —
the first TSP slice, nearest-neighbour upper bound only, three levels: **L1** a complete K4–K6
network that already satisfies the triangle inequality; **L2** a practical (incomplete) network
where the solution first completes the *table of least distances* one shortest route per beat,
then runs NN on it and expands the tour back into the real network; **L3** as L2 but one direct
edge is beaten by a detour, so its entry must be replaced too. Questions are tie-free and every
indirect entry has a unique shortest route. New shared `src/shared/decision/tsp.ts`
(`leastDistances`, `nearestNeighbour`, `completeNetworkLayout`, `placeEdgeLabels` — K5/K6 can't be
drawn without crossings, so each edge now carries its own `labelAt` and labels are placed clear of
nodes/labels/other edges). Shell/contract growth: `DecisionShell` level picker
(`config.levels`/`levelLabels`) and `questionMatrix`; `SolveStep` gains `nodeRoles`, a `matrix`
override (with italic-blue indirect entries) and `matrixTitle`; `MatrixCell` gains
`considering`/`dim`; `DecisionProblem` gains `start` and `answer.tour`; `validateProblem` gains an
independent `"nearestNeighbour"` reference (Dijkstra + NN from scratch, tie check, tour match).
New `src/tests/decisionTsp.test.ts`. `npm run build` clean, `npm test` (348) passing.
**Layout pass (same day):** `DecisionShell` now keeps one layout in both modes: the network on a white
card on the left, and a sidebar of cards on the right (the question or the current step with a
phase badge and running total, a "Route so far" trail, and the matrix). All on a darker page
background for contrast. The colour key (`config.legend`) is a strip along the foot of the network
card. The zoom controls moved from bottom-right (right above Next) to a compact pill in the canvas's
top-right, with a clear band reserved so they never cover a vertex. Visit order is drawn as solid
navy badges. `SolveStep` gains `phase` and `route`; MST gets a key too.

## 2026-09-22 — Shared `AnswerDisplay`: match KaTeX answer size/weight to the unit text
`src/shared/components/QuestionDisplay.tsx`. Follow-up to the Speed/Distance/Time answer-format
fix below: giving Time's answer proper `answerLatex` made a pre-existing, site-wide sizing issue
obvious — visually confirmed via screenshot (`= 36 minutes` rendered with a tiny, thin, non-bold
KaTeX "36" dwarfed by a big bold plain-text "minutes"). `AnswerDisplay`'s `MathRenderer` call used
its default sizing (0.826em, no explicit weight), which is tuned for question text
(`font-semibold`); the answer line is `font-bold` and a size step larger, so the KaTeX number read
much smaller and thinner than the `answerSuffix` beside it, on every tool using this pattern (all
27 `ToolShell` tools' answers, not just this one). Overrode `MathRenderer`'s `style` to
`{ fontWeight: 700, fontSize: "1em" }` for the answer's KaTeX render specifically — screenshot-
verified (Speed's "= 10 km/h", Distance's "= 4 km", Time's "= 40 minutes", and the compound
"= 2 hours 15 minutes" from the `\text{}` fix below, which now inherits the same bold weight
uniformly since it's one KaTeX span). Scoped to `AnswerDisplay` only — `QuestionDisplay`/
`InlineMath` (font-semibold, less severe) untouched. `npm run build` clean, `npm test` (341 tests)
passing.

## 2026-09-22 — Speed, Distance & Time: consistent KaTeX answer formatting
`src/tools/Proportion/SpeedDistanceTime.tsx`. Fixed a visual inconsistency: Speed and Distance
answers always rendered their number via `answerLatex` (KaTeX) with the unit as plain-text
`answerSuffix`, but Time's answer never set `answerLatex` at all, so it fell back to fully
plain text (e.g. "= 1 hour 30 minutes" with no KaTeX styling) while Speed/Distance showed
"= 12 mph" with the number in KaTeX's math font. Added `buildTimeAnswer(shape, family)`: for the
three single-unit shapes (l1 hours/seconds, l2/l3awkward minutes) it now sets `answerLatex` +
`answerSuffix` exactly like Speed/Distance. The one genuine exception is the compound l3 shape
("1 hour 30 minutes") — two number+unit pairs can't fit the single-katex-span-plus-one-suffix
shape `print.ts`'s answer renderer expects, so both numbers stay together in one KaTeX string
using `\text{}` for the unit words (renders upright, visually identical to how `answerSuffix`
already looks next to every other answer on the site) rather than falling back to plain text.
`npm run build` clean, `npm test` (341 tests) passing — the generator smoke test renders every
`answerLatex` including the new `\text{}` compound strings via `katex.renderToString` with
`throwOnError`.

## 2026-09-21 — Speed, Distance & Time: 4th "Mixed" sub-tool + reverse wording
`src/tools/Proportion/SpeedDistanceTime.tsx`. Two additions requested together, both applying to
every level and (Wording) every sub-tool including the new one:
- **Mixed sub-tool** — added as a 4th `ToolType`, following `RatioSharingTool.tsx`'s own "Mixed"
  as the reference pattern: an `Include` multiSelect pool (`MIXED_QUESTION_TYPES`: Speed/Distance/
  Time, all active by default) that `generateQuestion` draws from via `pickActive` when the current
  tool is `"mixed"`, then falls through the same `genSpeed`/`genDistance`/`genTime` dispatch a
  direct sub-tool pick already used — every other axis (units, difficulty tier, notation, wording)
  stays shared rather than re-picked per type. `makeMixedSubtool()` mirrors `makeSubtool()`'s
  per-level `multiSelect` arrays with `MIXED_QUESTION_TYPES` added. Verified the distribution
  directly (900 draws at Level 2): ~316/271/313 across speed/distance/time, and confirmed
  excluding "Time" from `Include` correctly drops it to 0/600 while keeping the other two roughly
  even.
- **Reverse wording** — a new unweighted `WORDING_MS` pool (`Standard`/`Reverse`, off by default,
  same "new variety opts in" precedent as `TIME_NOTATION_L2`), present at every level of every
  sub-tool. `Standard` states the subject/distance/speed first then the time clause ("A car travels
  120 miles in 10 hours."); `Reverse` fronts the other clause instead ("In 10 hours, a car travels
  120 miles." / for Time, "At a speed of 30 km/h, a lorry travels 15 km.") — same D/S/answer either
  way, just reordered so students can't pattern-match the numbers by position. Extracted the
  question-line construction that used to be inline in each `genX` into one shared `buildLines(rv,
  wording)`, fed by new `subject`/`rateUnit`/`durationText` fields on `RawValues` (alongside a
  `lowerFirst` helper, since a capitalised subject like "A car" needs lowercasing once "Reverse"
  pushes it mid-sentence after the fronted clause). `reformatQuestion` now also rebuilds `lines`
  from the live `qo.multiSelectValues`' wording pick (previously it only rebuilt `working` for the
  Method dropdown), so toggling Wording swaps the question instantly, the same way Method already
  did — reusing the identical `buildLines` call generation uses, so there's one source for both
  paths. Verified both directions render correctly for all three question types, including the
  lowercasing.
- `npm run build` clean; `npm test` now 341 tests (+3, the generator smoke suite auto-discovered
  the new `mixed` tool across its three levels).
- **Follow-up (same session):** Distance's reverse wording fronted the given RATE with "In" ("In 10
  hours, a train travels at a speed of 20mph."), which reads wrong — "In X" implies a completed
  amount, fitting Speed's fronted DISTANCE clause, but Distance's fronted clause states a sustained
  rate, which needs "For X" instead ("For 10 hours, a train travels at a speed of 20mph."). Fixed
  in `buildLines`'s `"distance"` branch only — Speed's "In" and Time's "At" were already correct.
  `npm run build` clean, `npm test` (341 tests) green.
- **Second follow-up (same session):** feedback that Mixed "seems heavily skewed to speed" —
  `MIXED_QUESTION_TYPES` was built unweighted (following `RatioSharingTool.tsx`'s own unweighted
  Mixed pool), but this tool already has a genuinely weighted pool (`DIFFICULTY_TIER`) whose
  worksheets already get ToolShell's automatic roughly-even quota balancing; an unweighted pool
  gets none of that, so each question's type is pure independent chance. Measured directly:
  6000 raw draws land essentially even (1969/1994/2037), but the worst of 500 simulated
  15-question worksheets hit 67% Speed by chance alone — exactly the "can occasionally land quite
  skewed" scenario `CLAUDE.md`'s Smart Progressor section describes. Fix: gave all three
  `MIXED_QUESTION_TYPES` options an equal `weight: 1`, opting the pool into that same balancing —
  but deliberately WITHOUT folding it into `_difficultyScore` (still only `DIFFICULTY_TIER`), so
  the worksheet's easy-to-hard sort is untouched; only the type split is now balanced, not
  reordered. Re-verified: raw per-question draw still uniform (1039/980/981 over 3000), and
  `_difficultyScore` confirmed unaffected. `npm run build` clean, `npm test` (341 tests) green.

## 2026-09-20 — Surds: optional options default off, Divide's working steps deepened
`src/tools/Number/Surds.tsx`. Feedback on the Multiply/Divide redesign: (1) optional content
(algebraic coefficients, the two rare traps) was defaulting *on*, so a fresh worksheet silently
included a 50/50 mix of x-carrying questions nobody asked for, plus a smaller trap rate; (2) Divide's
working out was noticeably shallower than Multiply's — one folded step straight from the question to
the final answer, skipping the actual mechanics Multiply always shows.
- **Defaults**: `MULDIV_ALGEBRAIC_MS`'s "algebraic" option, and both rare-trap pools'
  (`MULDIV_RADICAND_L1_MS`/`MULDIV_RADICAND_L2_MS`) non-"Standard" option, now default `false`. A
  fresh Level 1/2 worksheet is plain multiply/divide practice; the cycle buttons start at "Off" and a
  teacher opts into algebra or the traps deliberately, rather than getting them baked into ~50%
  (algebraic) or ~10-20% (traps) of questions with no visible signal why. Verified against
  `ToolShell`'s actual initialisation code (`init[k][o.value] = o.defaultActive` for every option,
  not an empty object) — a naive direct-call test with `{}` misleadingly shows the OLD ~50% rate,
  since `pickActive`/`pickRare` treat an absent key as active; the real app never calls
  `generateQuestion` with an empty record, only after `ToolShell` seeds every option explicitly.
- **Divide's working now matches Multiply's own granularity.** New `divideUnderRootSteps` (plain
  numeric) and a rewritten `algebraicDivideSteps` (x-carrying) both now go "Divide the coefficients"
  → "Divide the numbers under the root" → combine or delegate to `simplifySurdSteps`'s full extraction
  chain — the exact move-for-move structure `expandSurdBracketsSteps`'s monomial branch already gives
  Multiply, instead of a single 3-fragment leap straight to the answer. Level 3's fraction-divide
  chain (keep-change-flip → multiply numerators/denominators → simplify → reduce) was already
  comparably deep and is unchanged.
- `npm test` (335 tests) and `npm run build` clean; spot-checked working-step output at every
  level/operation combination by hand.

## 2026-09-20 — Surds: Level 3 Multiply/Divide replaced with fraction multiply/divide
`src/tools/Number/Surds.tsx`. Second follow-up to the 3-level redesign below — Level 3's single-term
3-way ladder (general/√a×√a/perfect-square-product) is replaced outright with a genuine capstone:
two proper fractions, each carrying a surd on exactly one side (`(a√p)/b [op] c/(d√q)`), multiplied
or divided (with keep-change-flip) into one reduced fraction — never rationalising a denominator.
- **The key finding driving the design**: Multiply and Divide need *opposite* guarantees for this
  shape, which turned into the actual teaching point rather than an implementation detail. Multiply
  (`fracA × fracB = (ac/bd)·√(p/q)`) needs `p` guarded as a clean multiple of `q` (reusing
  `randomDivideRadicands`) or a surd would be stranded in the denominator. Divide's keep-change-flip
  (`fracA ÷ fracB = fracA × (d√q)/c`) relocates `fracB`'s surd out of the denominator *by the flip
  itself* — so any independent `p`, `q` stays clean, no guard needed at all. `buildFractionMultiplyDivide`
  implements both branches; a new `fractionSurdLatex` gcd-reduces the outer numeric fraction (the
  radicand never participates in that reduction — it's irrational, so it can't share a factor with
  the denominator, the same "reduce, then reattach" pattern as the algebraic-coefficient case).
- Level 3's QO surface simplifies to just Operation (multiply vs divide) — `MULDIV_COEFF_MS` and
  `MULDIV_RADICAND_MS` are now fully dead (every other reference was L1/L2-only) and were deleted
  rather than left unused. L1/L2 are unaffected — their own trap pools and algebraic option are
  untouched, this only replaces L3.
- Verified two ways: `npm test` (335 tests, including every new KaTeX string), and a throwaway
  stress test that independently recomputed the true decimal value of 3,000 random Level 3 questions
  from their raw parameters and compared against the parsed final answer — all 3,000 matched to 6
  d.p., confirming the "never leaves a surd in a denominator" guarantee actually holds, not just that
  it renders. `npm run build` clean.

## 2026-09-20 — Surds: redesigned Multiply/Divide's 3-level progression
`src/tools/Number/Surds.tsx`. Follow-up to the collapse-rate fix below — a walkthrough of the three
levels surfaced that they weren't a real ladder: Level 2's coefficient was an optional 50/50 toggle
instead of "always on" as its own info text claimed, Divide used identical number ranges and the
same collapse rate at every level (no progression at all), and Level 1/Level 2 shared the exact same
"Perfect Square Product" trap pool (same case, same numbers) rather than each level introducing
something new. Redesigned all three axes so no level can produce the same question shape as its
neighbour:
- **Coefficient is now a strict ladder.** L1 never (unchanged), L2 **always** (hardcoded — the
  `MULDIV_COEFF_MS` toggle no longer shows at L2), L3 a toggle again.
- **The radicand-collapse trap is a different case per level**, not the same pool shown twice. L1
  keeps the hidden case (`√2×√8=4`, rare ~10%, `MULDIV_RADICAND_L1_MS`). L2 gets a new pool
  (`MULDIV_RADICAND_L2_MS`) for the obvious case (`√a×√a=a`, moderate ~20%) instead. L3's existing
  3-way weighted ladder (both cases combined, unchanged) is now genuinely the level where L1 and
  L2's separate traps converge, rather than a third copy of the same idea.
- **Divide now scales with level** via a new `DIVIDE_SIZE` lookup and a generalised
  `randomDivideRadicands(rMax, mMax, sMax, rareRate, capA)` — number ranges and the rare full-
  collapse rate (10% → 12% → 15%) both step up L1→L2→L3, so Divide gets bigger and trickier exactly
  like Multiply's radicand range already did (20 → 35 → 50), instead of staying frozen.
- **New: an algebraic (x-carrying) coefficient QO at L1/L2** (`MULDIV_ALGEBRAIC_MS`,
  `buildAlgebraicMultiplyDivide`) — genuinely distinct from AddSub's algebraic case (there x-terms
  get COLLECTED into a bracket; here x just rides through the multiplication/division on one side,
  never bracketed, matching this sub-tool's own "never includes a bracket" rule). x only ever sits
  in the numerator/left factor — putting it on a divisor would leave x in a denominator. L1 keeps it
  bare (`x√a`); L2 always gives it a real numeric multiplier too (`ax√a`), consistent with L2 always
  carrying a coefficient. Not offered at L3 (its own 3-way ladder is already a full plate).
- Verified with a stress test (4,000 draws/level): L2 samples now always show an explicit numeric
  coefficient (previously ~50% were bare); L1 and L2's trap pools produce visibly different question
  shapes; Divide's max radicand seen climbs 160 → 297 → 500 across the three levels. `npm test` (335
  tests, including every new algebraic KaTeX string) and `npm run build` both clean.

## 2026-09-20 — Surds: fixed Multiply/Divide's runaway "perfect square" collapse rate
`src/tools/Number/Surds.tsx`. A stress test (4,000 draws/level) showed 76–84% of Multiply/Divide
questions collapsing to a plain integer answer (no surd surviving) — reported as "nearly every
answer does this". Two root causes, both fixed:
- **Divide always collapsed, 100% of the time.** `a`'s radicand was constructed as `b`'s radicand
  times an exact perfect square (`r·m²` over `r`), so the root cancelled completely on every single
  division question, at every level. New `randomDivideRadicands` adds a square-free residual factor
  `s` that usually survives (`a = r·m²·s`, `b = r`) — the division is still guaranteed clean (no
  messy fraction under the root), but the answer is now normally still a surd; a full collapse
  (`s = 1`) is the rare case (~10%), matching the multiply side's own rare trap.
- **Level 1/2's "Perfect square product" was a 50/50 coin flip, not a rare trap.** Unlike
  `SIMPLIFY_RADICAND_L1_MS` (Simplify's near-identical case, correctly read via `pickRare` at
  ~8%), `MULDIV_RADICAND_L1_MS` was read via plain `pickActive` — uniform over its two active
  options — so "Standard" vs "Perfect square product" split 50/50 by default instead of the
  intended occasional surprise. Now reads via `pickRare` (~10%), with the pool's `cycleDisplay`/
  `cycleStateLabels` updated to match the established rare-trap pattern. Level 3's three-way ladder
  (`MULDIV_RADICAND_MS`, weighted) is unchanged — that's a genuine difficulty ladder, consistent
  with every other L3 pool in this tool.
- Post-fix collapse rate: ~15% at Level 1/2 (both multiply and divide), ~42% at Level 3 (still
  dominated by the intentional 3-way ladder, not a bug). `npm test` (335 tests) and `npm run build`
  both clean.

## 2026-09-20 — Narrow-viewport: code review fixes (stuck reveal, mode flash, header dedup)
`src/shared/ToolShell.tsx`. `/code-review` on the session's diff caught two real bugs in the narrow
layout and one worthwhile simplification, all fixed:
- **Stuck per-card reveal.** Tapping a Worksheet card while "Show All" was already on wrote it into
  `narrowRevealed` even though it added nothing visible — so after "Hide All" turned
  `showWorksheetAnswers` back off, that one card stayed revealed with no visual explanation.
  `toggleNarrowReveal` is now a no-op while `showWorksheetAnswers` is true.
- **Mode-toggle flash on load.** A narrow-viewport page load with no `mode=` URL param initialized
  `mode` to `"whiteboard"` (the default), which matches neither narrow toggle button — so on the
  very first paint, *neither* "Worked Example" nor "Worksheet" read as selected until a correcting
  `useEffect` fired a tick later. `urlInit.mode`'s fallback now seeds `"single"` directly when the
  page is loading narrow, so the right button is highlighted from the first frame.
- **Header duplication.** The narrow and desktop shells each had their own copy of the Home-button/
  hamburger-menu header, sized differently. Extracted into one `renderNavBar(compact)` used by both,
  so a future header change can't land in one layout and be forgotten in the other.
- The review also surfaced a pre-existing, unrelated bug in `WorkedExampleSteps`' stacked layout (a
  keying issue that remounts/re-animates a card on Back instead of just updating it) — left alone
  since it predates this session's narrow-view work and is a separate fix.
- Re-verified live with Playwright: the highlighted-button-on-first-paint and no-stuck-reveal-after-
  Hide-All behaviours both confirmed; `npm run build`/`npm test` clean.

## 2026-09-20 — Narrow-viewport: shrink WorkedExampleSteps' own step text
`src/shared/components/WorkedExampleSteps.tsx`, `src/shared/ToolShell.tsx`. Live feedback (a real-
device screenshot of `Surds`, which uses `workedExampleLayout: "stacked"`) showed the step
card's own text — "Step N" heading, working line, revealed answer — still rendering at its
desktop/"stacked" size on a phone, oversized next to the rest of the already-shrunk narrow chrome.
The previous session's `renderWorkedExample(compact)` flag only trimmed the *outer* wrapper padding;
it never reached `WorkedExampleSteps`, which sizes its own cards internally. Added a new `compact`
prop on `WorkedExampleStepsProps` (independent of `layout`/its own `stacked` sizing, and always
wins when both apply) that shrinks the step heading/body font size and card padding further, applied
in every rendering path — Show All (the real end-user default), single-step navigation, and stacked
— so it's not limited to the dev-gated step-through mode the screenshot happened to show. Verified
live at 375px against `Surds` in both the dev-mode step-through view and, more importantly, the
default Show-All view a real user sees; `npm run build`/`npm test` clean.

## 2026-09-20 — Narrow-viewport polish: smaller sizing, centered worksheet controls, drop PDF button
`src/shared/ToolShell.tsx`, `src/components/LandingPage.tsx`. Follow-up to the same day's narrow
layout, after live feedback that it read as too zoomed in:
- `LandingPage.tsx` gets a proper mobile pass — header, hero title/paragraph, subject/category
  headers, tool cards and footer all get smaller mobile-first sizing (padding, font size, icon/badge
  boxes) with the existing `sm:`/`md:`/`lg:` breakpoints preserved, so desktop is pixel-identical to
  before. This wasn't part of ToolShell's narrow layout — it's a separate, pre-existing component
  that had never been sized for phone widths.
- `ToolShell`'s narrow shell: tightened nav/banner/button padding and font sizes throughout, and
  `renderWorkedExample` gained an optional `compact` flag (desktop call site unaffected) that trims
  its whiteboard-sized `p-8` padding down for a phone column.
- The narrow Worksheet mode's control row (Generate / question count / Show All) is now centered
  rather than left-aligned, and the PDF print/export button is dropped entirely from narrow — it
  was already demoted to secondary and cutting it simplifies the row further.
- Re-verified live with Playwright at 375px (both the landing page and `BestBuys`) and 1280px
  (landing page pixel-unchanged), `npm run build`/`npm test` clean.

## 2026-09-20 — Narrow-viewport layout for ToolShell
`src/shared/ToolShell.tsx`. New responsive layout, built into the shared shell rather than any tool
file, so all 27+ tools get it for free:
- Below a 640px viewport width (a phone, or a desktop window shrunk that far — handy for quickly
  previewing what a tool generates), `ToolShell` now renders a compact single-column shell limited to
  **Worked Example** and a new **light Worksheet list** mode — no Whiteboard, no Teach, no
  differentiated builder.
- The desktop tool-tab/mode-tab rows are replaced by a settings banner (topic · level) that opens a
  slide-in drawer for Topic / Difficulty / Question Options — the QO section reuses a new
  `InlineQOPanel` export from `QOPopovers.tsx` (the same `StandardQOPopover` content, without the
  floating-popover chrome), so no QO logic was duplicated.
- The Worksheet list is a scrollable stack of question cards with independent tap-to-reveal per
  card, a "Show All" toggle (reusing the desktop `showWorksheetAnswers` state), and print/export
  demoted to a small `PrintSplitButton` icon rather than the primary action.
- Seeds a smaller default question font size on narrow viewports — the desktop default is sized for
  a projected whiteboard and wrapped badly on a phone-width column.
- Diagram tools' `questionRenderer`/`answerRenderer` overrides are respected exactly as in the
  desktop paths, so no per-tool changes are needed — though only a plain worded-question tool
  (`BestBuys`) has been checked live so far; see `docs/PROJECTS.md` → "Narrow-viewport layout" for
  what's still unverified (diagram tools, heavier QO surfaces, differentiated links on a phone).
- Verified live with Playwright at 375px and 1280px (drawer open/close, reveal, worksheet generation,
  per-card reveal, zero console errors) alongside `npm run build` and `npm test` (both clean).

## 2026-09-19 — Surds: cascading Worked Example, retire the duplicate answer, promote its techniques
`src/tools/Number/Surds.tsx`, `src/shared/ToolShell.tsx`, `src/shared/components/WorkedExampleSteps.tsx`,
`src/shared/types.ts`, `src/shared/techniques/index.ts`, `src/shared/surds.ts` (new),
`src/tools/TeacherTools/{SimplifySurdPreview,CollectLikeSurdsPreview,ExpandSurdBracketsPreview,
RationaliseDenominatorPreview}.tsx` (new). Multi-part session piloting several shell-level changes
in Surds before any wider rollout:
- **Matched the Technique Library's cascading Worked Example layout** (`workedExampleLayout:
  "stacked"`) inside real ToolShell tools for the first time — a `useFullHeightShell` flag makes
  ToolShell's page a genuine viewport-derived flex column (only for `mode==="single" &&
  workedExampleLayout==="stacked"`), matching how `TechniquePreviewPage` already sized the same
  `WorkedExampleSteps` component. Found and fixed a real crushing bug along the way (`height:
  100vh` forced the whole shell into one viewport, crushing the scrollable step body to 8px —
  fixed with `minHeight: 100vh` instead, which fills the viewport when there's room and grows
  with a normal scroll when there isn't). Smoothed the new-card fade-in (a mount-triggered
  `EnterCard` wrapper, tuned to a 0.9s pure opacity fade after two rounds of feedback).
- **Redesigned Simplifying Surds' Level 1/2/3** so each level is genuinely distinct: Level 1 stays
  on a friendly extraction range (≤400); Level 2 introduces the "extracting a factor leaves a
  coefficient" skill on that SAME friendly range rather than compounding it with harder numbers;
  Level 3 combines that skill with a curated composite-radicand pool pushed past 400. Built
  `pickRare` (a `pickActive`-compatible but non-Smart-Progressor-balanced picker) so perfect-square
  and already-simplified "trap" cases stay genuinely rare (~8–10%) instead of the Smart
  Progressor's usual even-split behaviour, which would have made them 50/50.
- **Retired the duplicate green answer box** in Worked Example mode: every sub-tool's last working
  step already stated the exact final answer (verified via a 4500-draw scratch stress test before
  flipping anything), so the box was always repeating content already on screen. Wired
  `WorkedExampleSteps`' existing (but previously unused-by-any-real-tool) `hideAnswerStep` prop
  through a new `ToolShellDefaults.hideAnswerStep` flag. The terminal step now carries the ring
  itself — same blue ring every "current" step gets while you're working through it, switching to
  green only once you land on the last one, with no ring at all on any step you've moved past
  (several rounds of feedback correcting an initial "ring every step" misread).
- **Promoted all four of Surds' step-builders into the shared techniques engine.** Surds
  originally built `simplifySurdSteps`/`collectLikeSurdsSteps`/`expandBracketsSteps`/
  `rationaliseDenominatorSteps` locally, deliberately shaped to the techniques engine's own
  contract but kept local per docs/PROJECTS.md's "build on demand" rule. Once proven out across
  five sub-tools, cut near-verbatim into `src/shared/techniques/index.ts`, with the pure
  computation layer (`SurdTerm`/`SurdFraction` + arithmetic + LaTeX formatting) promoted alongside
  into new `src/shared/surds.ts`. `expandBracketsSteps` renamed `expandSurdBracketsSteps` on the
  way in — it's `SurdTerm`-specific, a sibling of (not the same technique as) the still-unbuilt
  generic `expandBrackets` the audit backlog tracks for `ExpandingBrackets`/`NonLinearSimEq`.
  `Surds.tsx` now pulls everything back through `"../../shared"`; the two local files
  (`surdsMath.ts`, `surdsSteps.ts`) are deleted. All four techniques got their own
  `/techniques/<slug>` preview page and a Technique Library card, same as the original six — the
  library now lists 10 techniques (11 preview pages including the composed Full Worked Example).
  Re-ran the last-step-matches-answer stress test after the move to confirm byte-for-byte
  unchanged behaviour. See `docs/PROJECTS.md`'s Techniques engine entry for the full writeup.
- **Built genuine `full` grains for the three promoted techniques that didn't have one.**
  Auditing the newly-public library surfaced that `collectLikeSurdsSteps`, `expandSurdBracketsSteps`
  and `rationaliseDenominatorSteps` had `standard`/`full` producing byte-identical output in every
  case (confirmed empirically, 500+ draws each, not just by reading the code) — a real "3 grains"
  overclaim on their Technique Library cards. Gave each a genuinely richer `full`: per-term simplify
  and per-radicand-group coefficient-add steps (two new shared private helpers) instead of one
  folded step per phase; `expandSurdBracketsSteps` additionally splits difference-of-two-squares
  into "evaluate each square" + "subtract" and gives monomial×monomial its own coefficient/radicand
  breakdown; `rationaliseDenominatorSteps` now propagates the real grain into its
  `expandSurdBracketsSteps` sub-calls instead of hardcoding `"standard"`. Verified with three
  stress-test passes: standard/brief output byte-identical to before (old vs. new implementations
  compared directly, 3000+ draws), full now differs from standard in 100% of draws across every
  shape, and Surds' `hideAnswerStep` invariant still holds across all 15 sub-tool×level
  combinations post-rework — Level 1 Add/Sub, Multiply/Divide and Rationalise all genuinely
  exercise the new code live. Caught and fixed one real bug along the way: an early draft's label
  embedded raw LaTeX source as prose text (`"Simplify \sqrt{8}:"` rendered literally instead of as
  math) — labels are plain text, not KaTeX, so this now reads a generic "Simplify:".
- **Switched every Surds sub-tool to `full` grain at every level, not just Level 1.** Surds is
  where a student meets these techniques for the first time, not a downstream tool composing an
  already-mastered prerequisite — so every level should get the full taught breakdown. Previously
  only Level 1 used `full` (Add/Sub, Multiply/Divide, Rationalise); Expand never used it at any
  level. Re-ran the full 5-sub-tool × 3-level × 500-draw stress test (7500 questions) to confirm
  the `hideAnswerStep` invariant still holds now that every level exercises the richer paths live.
- Also: fixed a real `CycleSelect` shared-component bug (a solo 2-option weighted pool stretched
  to the popover's full width), added opt-in multi-row sub-tool tabs (`toolTabRows`), and widened
  number ranges across Add/Sub, Multiply/Divide, Expand and Rationalise.
- **Refined Simplifying Surds' Level 1/2/3 once more**, on user feedback that Level 1's rare
  perfect-square trap should read as a single carousel control rather than a two-cell pool, and
  that Level 3 needed a real design rule for which "hidden factor" values are worth testing.
  Level 1's `obvious`/`perfectSquare` pool now opts into the compact cycle-button look via a new
  `cycleDisplay?: true` field on `ToolMultiSelect` (`src/shared/types.ts`,
  `src/shared/components/QOPopovers.tsx`'s `isCycleGroup`) — deliberately *not* `weight`, which
  would have pulled the pair into Smart Progressor balancing and forced the trap toward ~50/50
  instead of staying genuinely rare; `cycleDisplay` gets the same button with no such coupling.
  Level 2 widened its coefficient range (2-16, up from 2-6) while keeping the same friendly
  ≤400 radicand range as Level 1 — the new skill is carrying a coefficient through, not bigger
  numbers. Level 3 dropped the "already simplest form" trap entirely, replaced by a genuine
  weighted `withCoeff`/`none` QO choice (`SIMPLIFY_COEFF_L3_MS`), and its radicand is now always
  > 400, drawn from curated extraction values `x` whose square has more than one smaller square
  factor to spot (`isMultiStepExtractable(x)`, reusing the pre-existing `hasMultipleSquareFactors`
  check already used for Rationalise's hidden-factor radicands, applied to `x²`) — so a bare prime
  squared (2² = 4, 3² = 9, …) never appears, since it hides nothing, while composite extractions
  like 6² = 36 = 4×9 or 12² = 144 = 16×9 do. Verified with a fresh stress test (20,000 draws): every
  Level 3 radicand lands in (400, 2000] with a genuinely multi-step-extractable `x`; Level 2's
  coefficient spans the full new range; the rare-trap pool stays ~8% rather than drifting toward
  even; and the `hideAnswerStep` invariant still holds. Confirmed live via the dev server — both
  pools render as the intended single cycle button, no console errors.
- **Fixed a real layout bug in the "stacked" Worked Example: a tall empty box below short
  examples.** `WorkedExampleSteps`' stacked layout previously owned a bounded, internally-scrolling
  body with the nav pinned as a flex-shrink-0 footer, sized against a parent that `ToolShell` forced
  to (at least) a full viewport height (`useFullHeightShell`) purely so that bounded box would have
  something real to size against. For a short example (most Surds techniques are 1-3 steps), the
  scrolling body still stretched to fill all that forced height, leaving a large blank rectangle
  between the last card and the pinned footer — reported live via a screenshot showing exactly this
  under Surds Level 2. Fixed by dropping the bounded/internal-scroll approach entirely: the stacked
  card list and footer now flow with their own natural height (no `height:100%`, no
  `overflow-y-auto`), and the footer-position `window.scrollBy` compensation effect that already
  existed in the file (its own comment already described this as the intended behaviour: "the page
  itself grows and scrolls instead") now does the actual work of keeping the footer visually
  anchored as the list grows or shrinks, instead of sitting unused alongside a conflicting
  scrollbox. `ToolShell`'s `useFullHeightShell` mechanism (the forced `minHeight: 100vh` chain) is
  now unnecessary and removed; `TechniquePreviewPage.tsx` (the Technique Library's preview, sharing
  the same component) simplified the same way. Verified live: a short 2-step Simplify example now
  ends its card exactly at the content with no gap; a long 7-step Rationalise example (dev mode,
  stepped one beat at a time) still keeps its nav visibly anchored on each press, confirmed by
  reading `window.scrollY` climbing in lockstep with the footer's screen position across 8 presses.
- **Added the missing "split into two separate roots" fragment in `simplifySurdSteps`.** The
  factor-split chain jumped straight from `√(a×b)` to the extracted `c√b`, skipping the intermediate
  `= √a × √b` a teacher would actually write on the board (e.g. `√50 = √25×2 = √25×√2 = 5√2`) —
  flagged live from a Level 2 worked example screenshot. Added the missing fragment to the
  `coeff===1`, `standard` and `full` branches (brief stays a single line, as designed). Verified
  with an 8,000-draw stress test across all three Simplify levels: every generated fragment still
  renders under KaTeX, and the `hideAnswerStep` invariant (last fragment's value matches the
  question's computed answer) still holds.
- **`simplifySurdSteps` now ends with an explicit "Write the final answer:" step**, at every grain
  but `brief` — matching `rationaliseDenominatorSteps`' existing convention (a dedicated landing
  point for the conclusion, distinct from whatever the last operation happened to be), which
  Simplify was the one technique missing. Threaded a `writeFinalAnswer` flag through both
  `simplifySurdSteps` and `expandSurdBracketsSteps` (default `true`) so a NESTED call — the
  monomial×monomial branch composed inside `rationaliseDenominatorSteps`' "denominator becomes
  rational"/"multiply out the numerator" steps — can suppress its own inner copy: without this, an
  intermediate sub-result (e.g. the rationalised denominator's own value) and the question's real
  final answer both said "Write the final answer:", which read as genuinely confusing rather than
  merely repetitive. `rationaliseDenominatorSteps` passes `false` at both its nested call sites; a
  standalone call (Simplify itself, Multiply/Divide) keeps the default. Verified: exactly one
  "Write the final answer:" label per Rationalise question, always the last step, across 500 draws
  per level.
- **Fixed the compact cycle button's generic wording for Simplify's Level 1/2 perfect-square
  pool** — it showed "QUESTION TYPES" / "None" in the popover, saying nothing about what the toggle
  actually does. Added an opt-in `cycleStateLabels?: [string, string, string]` field to
  `ToolMultiSelect` (overriding the generic None/Mixed/Exclusive state labels only where a pool
  asks for it) and relabelled the pool itself `"Perfect Squares"` with states `["Off", "Mixed
  (~8%)", "Always"]` — the button now reads "PERFECT SQUARES" / "Mixed (~8%)", genuinely
  communicating the rare-trap probability instead of a meaningless generic word.
- **Redesigned Rationalising the Denominator's three levels** on user feedback that the previous
  split didn't read as a clear progression. New shape: **Level 1** — single-surd (monomial)
  denominator with an INTEGER numerator, now a genuine QO choice between a unit fraction
  (numerator 1) and a general integer numerator (previously always fixed at 1) — two independent
  pools (`RATIONALISE_DENOM_L1_MS` / `RATIONALISE_NUM_L1_MS`, since denominator-needs-simplifying
  and numerator-is-a-unit-fraction can combine on one question, so they're separate pools rather
  than one ladder). **Level 2** — same friendly monomial-denominator range as Level 1 (shared QO
  key, same pattern as Simplify's L1/L2 radicand pool), but the numerator is now ALWAYS a binomial
  (`k ± c√a`, sharing the denominator's own surd once simplified) — no longer a QO choice, since
  Level 1 now already covers the plain-integer-numerator case that Level 2's old "coefficient
  numerator" option duplicated. **Level 3** — unchanged: binomial denominator, requiring the
  conjugate, with numerator single-term or itself binomial (QO choice). Verified via a scratch
  Vitest file (deleted after use) exercising the real `generateQuestion` path: Level 1 genuinely
  reaches both denominator kinds and both numerator kinds; Level 2's numerator is always binomial
  (2 terms); Level 3's denominator always triggers a "conjugate" step; the `hideAnswerStep`
  invariant holds throughout.
- **Redesigned Adding & Subtracting's Level 1/2** — user feedback that Level 2 reading as "Level 1
  plus a toggle for a slightly different case" wasn't distinct enough. Added a genuine
  `ADDSUB_OPERATION_MS` QO pool ("Add"/"Subtract", a plain unweighted variety pool, present at
  every level) so a worksheet can be restricted to just adding, just subtracting, or a mixed
  default — previously the sign was always an untunable random 50/50. **Level 2 now always
  requires simplifying each term first** (no longer a QO choice against "already like surds",
  which WAS the old, too-similar L1→L2 distinction) — its own new QO axis is
  `ADDSUB_COEFF_L2_MS`, a genuine weighted toggle for whether each term additionally carries a
  coefficient on top of the part that needs extracting (e.g. `4√12 + 3√27` vs. the bare `√12 +
  √27`). Verified via a scratch Vitest file (deleted after use): the operation restriction
  genuinely produces add-only/subtract-only/mixed; Level 2 never produces the old "already like"
  shape; the coefficient toggle is reachable at both states; the `hideAnswerStep` invariant holds
  across all three levels.
- **Redesigned Adding & Subtracting's Level 3 with four genuinely distinct skills** — user
  feedback that the original Level 3 read as "Level 2 with some of its own cases folded in", not a
  real extension. Kept the existing false-positive **"not like surds"** trap; replaced
  "simplify first" (now redundant with Level 2) and "rational + surds" with three new cases
  discussed and chosen with the user: **"multiple surd families"** — 4 terms spanning two distinct
  radicands once simplified (e.g. `2√12 − 2√27 + 2√350 − 3√224`), testing sorting/grouping across
  families rather than spotting one pair; **"distribute a negative bracket"** — `(R1+C1√r) −
  (R2±C2√r)`, requiring the leading negative to be distributed across BOTH of the second bracket's
  terms before anything can combine, with its own new leading "Distribute the negative:" working
  step; **"algebraic coefficients"** — `(ax+b)√r ± cx√r`, collecting the algebraic coefficient into
  one bracketed term, same as any ordinary collect-like-surds move (e.g. `(4x+3)√11 − 2x√11 =
  (6x+3)√11` — see the follow-up fix below for the exact answer format). The latter two don't fit
  the shared `SurdTerm`/`collectLikeSurdsSteps` engine at all (an algebraic x-coefficient isn't
  representable in `SurdTerm{coeff:number}`, and a bracket-aware "distribute first" step needs its
  own working line) — both are bespoke, standalone builder functions
  (`buildNegativeBracketAddSub`/`buildAlgebraicCoeffAddSub`) that construct their own question and
  working directly rather than going through the shared technique. Verified via a scratch Vitest
  file (deleted after use): all four cases are reachable and produce valid KaTeX; the
  `hideAnswerStep` invariant holds for all of them; the negative-bracket case's display always
  shows two bracketed groups; the multi-group case always produces 4 raw terms. Live-verified in
  the browser (multi-group's 7-step worked example — simplify each of 4 terms, then two separate
  "add the coefficients of like surds" group-collects — reads as a clearly different skill from
  Level 2's single-pair case).
- **Moved the "doesn't combine" false-positive trap from Level 3 into Level 1 and Level 2**, as a
  rare (~10%) toggle rather than a Level 3-only weighted option — user feedback that it belongs
  alongside the levels where students are actively learning to combine like surds, not bundled in
  with Level 3's other, unrelated extensions. New shared-key pool `ADDSUB_TRAP_MS`
  (`cycleDisplay`, read via `pickRare` like Simplify's own perfect-square trap, so it stays
  genuinely rare rather than Smart-Progressor-balanced) added to both levels; removed from
  `ADDSUB_L3_MS`, which now has only its three genuine extensions. A Level 2 trap question no
  longer gets a `_difficultyScore` from the (irrelevant, for that question) coefficient pool.
- **Fixed `buildAlgebraicCoeffAddSub`'s answer format** — it previously deliberately guarded
  against the x-parts of the two terms cancelling out, treating "keep the x-term and constant term
  as two separate `√` terms" as the goal. User feedback (and their own original example, `(x+2)√3 −
  x√3 = 2√3`) corrected this: the algebraic coefficients should be added into ONE bracketed
  coefficient, exactly like any other collect-like-surds move — `(4x+3)√11 − 2x√11 = (6x+3)√11`,
  collapsing to a plain number when the x-parts happen to cancel. Removed the cancellation guard
  entirely (a cancelling answer is now a valid, unremarkable outcome, not something to avoid).
- **The compact cycle button now stretches to the QO container's full width when it's the only
  cycle-eligible pool in its row**, instead of a small fixed 220px box — user feedback that the
  narrow box looked out of place next to every other full-width QO control. Removed the width cap
  in `CycleSelect` (`src/shared/components/QOPopovers.tsx`) in favour of `w-full`; a row of 2+
  cycle pools is unaffected (still splits evenly via `flex-1`). Applies everywhere a solo cycle
  button appears (Simplify's L1/L2 trap, Add/Sub's new trap pool, etc.) since it's one shared
  component.

Everything above is scoped to Surds only (`hideAnswerStep`, `workedExampleLayout: "stacked"`,
`toolTabRows` are all opt-in `ToolShellDefaults`) — every other tool is pixel-identical to before,
verified via regression screenshots (Whiteboard, Worksheet, `CompletingTheSquare`'s "single"
layout). `npm run build`: 0 errors throughout. `npm test`: 335/335 passing.

## 2026-09-16 — Smart Progressor: extend Speed/Distance/Time to all 3 levels, fix two correctness bugs
`src/tools/Proportion/SpeedDistanceTime.tsx`, `src/shared/ToolShell.tsx`. User flagged that Level 1
still showed "Allow decimal answers" as a plain boolean (the Smart Progressor pilot had only
touched Level 2) and asked for the whole tool to demonstrate the mechanism, not just one level.
Extended `DIFFICULTY_TIER` (renamed from `DIFFICULTY_TIER_L2`, now one pool reused across all three
`difficultySettings`) so Levels 1 and 3 also get the tables10/tables20/decimals ladder in place of
their old independent Times-Tables pool + `ALLOW_DECIMALS` boolean. Surfaced and fixed two real
correctness bugs along the way (see `docs/PROJECTS.md`'s Smart Progressor entry for the full
writeup):
1. **Regenerating a single worksheet question ("Regenerate this question") lost its Smart
   Progressor tier** — every question in a generated block was stamped with the shared
   pre-balancing QO snapshot instead of its own per-slot override, so `ToolShell`'s `regenQuestion`
   re-rolled against the full unbalanced pool. Fixed in `ToolShell.tsx`'s `handleGenerateWorksheet`
   (both the differentiated and flat branches).
2. **The "decimals" rung's guarantee wasn't target-aware.** L3 compound-time shapes structurally
   can never yield a decimal SPEED (only a decimal distance — `pp` is always even by construction),
   and L2 shapes (qq always exactly 1) can only yield a decimal speed for 3 of the 9 minute values —
   so a Speed question's "decimals" tier could previously land on a whole-number answer. Made
   `pickShape`/`buildValues` target-aware (`buildCommon` takes `target: "S" | "D"`, genSpeed passes
   `"S"`, genDistance/genTime pass `"D"`) so shape selection always lines up pp or qq (whichever the
   calling subtool's own answer is) with the odd-factor requirement `forceDecimal` needs. Deleted
   the old L2-only `buildDecimalValues` helper entirely — the unified `buildValues` now covers all
   three levels. Verified with a throwaway Vitest file (removed after, not committed) generating
   500 questions per level × tier × subtool combination, asserting the picked tier's guarantee held
   every time and that a regenerated worksheet slot kept its tier; `npm run build` and `npm test`
   (320 tests) both clean.

## 2026-09-16 — Speed, Distance & Time: reinstate Level 2 worded-fraction time wording
`src/tools/Proportion/SpeedDistanceTime.tsx`. Reported: Level 2 seemed to have lost the option
for worded time fractions (e.g. "a quarter of an hour"). Checked `docs/PATCH_NOTES.md`'s own
history first — this feature had genuinely gone back and forth across an earlier session (added,
widened, hit a real bug where "Worded fraction only" silently fell back to plain-minutes wording
for any minute value without a natural spoken form, fixed, then deliberately removed as "a single
always-on option isn't a real choice" once every question had settled on plain-minutes wording).
Confirmed with the user this session's Smart Progressor QO work hadn't touched any of that logic,
then rebuilt it properly on request as a genuine, always-active choice: a new `TIME_NOTATION_L2`
multiSelect pool (Minutes / Worded fraction) — deliberately **unweighted** (pure wording variety,
not a difficulty axis, so it renders as the normal 2-cell pill row rather than this session's new
cycle-button control, and never enters the Smart Progressor's sort/balance). Root-caused and fixed
the historical bug's exact mechanism this time: `pickShape`'s Level 2 branch now takes the picked
notation directly and restricts its TM candidate pool to values with a natural spoken form
(`WORDED_FRACTIONS`) whenever "Worded fraction" is the active pick — with **no fallback to the
unfiltered pool**, verified to never be needed since every TM pool Level 2 can draw from (including
the "Decimals" Difficulty rung's `L2_DECIMAL_MINUTES`) has a non-empty intersection with the
worded-eligible set. `formatDuration` now takes the same notation and applies it to both a given
time (Speed/Distance) and an answer time (Time subtool). Verified with a throwaway test (removed
before commit): "Worded fraction" only produces a genuine spoken fraction on every draw across all
three subtools and all three Difficulty rungs (180 generations), "Minutes" only never produces one
(100 generations), both active produces a real mix of the two (200 generations), the Time
subtool's answer follows the pick too, and Levels 1/3 are unaffected. Also verified live in the
running app: the new pool renders as a normal pill row (not the cycle-button, confirming the
weight-gated detection is correct), and a generated worksheet genuinely shows worded-fraction
wording with the option on.

## 2026-09-16 — Smart Progressor: stack, centre, and evenly space the cycle button
`src/shared/components/QOPopovers.tsx`, `src/tools/TeacherTools/ToolShell.tsx`, `CLAUDE.md`.
Same-day follow-up to the cycle-button control below, three passes: (1) it originally laid the
group's label and state pill out horizontally (`flex items-center`), which read fine alone but
made the button too wide for two to sit on one row — defeating the point of a compact control.
Changed to a vertical stack (label above, state pill below, `self-stretch` so the pill matches the
label's width). (2) The stacked content was left-aligned; changed to `items-center`/`text-center`
to match the centred pill rows elsewhere in the popover. (3) The buttons still sized to their own
content (`flex-shrink-0`), so two side by side left a visibly uneven, ragged split — screenshotted
and confirmed. Switched to `flex-1 min-w-0` so both buttons evenly divide the row's width, matching
the equal-width cells of the standard pill-row groups.

Added a second dev-gated demo pool at `/tool-shell` ("Bigger nums (demo)", alongside "Negatives
(demo)", renamed from "Negative Coefficients (demo)" to fit) specifically so the demo page proves
the side-by-side packing this control exists for, not just a narrower single button — the two
weighted axes now also combine (`weightOf` summed) into one `_difficultyScore`, extending the
worked example. Verified live: a Playwright bounding-box check confirmed both buttons land on the
same row (`y` coordinates match) at the popover's default width, with a screenshot to eyeball it.

## 2026-09-15 — Smart Progressor: compact cycle-button control for 2-option pools
`src/shared/components/QOPopovers.tsx`, `src/tools/TeacherTools/ToolShell.tsx`, `CLAUDE.md`,
`docs/PROJECTS.md`. Addresses a real worry raised mid-session: if most boolean QO options turn
into 2-option weighted pools per this session's mutual-exclusivity rule, a tool with several such
properties would stack a full pill-row block per pool, making the QO popover "incredibly heavy".
Fix: `MultiSelectSection`'s replacement, `CycleSelect`, detects any multiSelect group with exactly
2 options where **both** carry `weight` and renders it as one compact click-to-cycle button
(**None → Mixed → Exclusive** — easier-only → both active → harder-only) instead of a two-cell
pill row; `MultiSelectGroups` now packs consecutive such groups into one `flex-wrap` row so several
sit inline rather than each claiming a full-width block. Purely a rendering choice — same
`ToolMultiSelect` data, same `pickActive`/`weightOf`/`buildQuotaOverrides`/`sortByDifficulty`
pipeline, automatic across all three popover surfaces (`StandardQOPopover`/`DiffQOPopover`/
`InlineQOPanel`) since they all route through `MultiSelectGroups`. A 2-option *peer* pool with no
weight (e.g. two unit families) is untouched — still the normal pill row.

Added a dev-gated worked example at `/tool-shell` (`src/tools/TeacherTools/ToolShell.tsx`, the
canonical new-tool scaffold): Sub-Tool 1 gets a "Negative Coefficients (demo)" 2-option weighted
pool, present in `TOOL_CONFIG` only when Developing-tools mode is on (reactive via `useDevMode()`
in `App()`, so toggling and returning shows/hides it without a hard reload) and read in
`generateQuestion` via the plain `getDevMode()` getter (same pattern `FractionToRatio.tsx` already
uses) — picking the value, negating the second addend when "negative" is drawn, and attaching a
real `_difficultyScore` via `weightOf`. Verified live via a Playwright script, not just build/test:
absent with dev mode off, present and correctly cycling None→Mixed→Exclusive→None with dev mode
on, and a regression check confirming SDT's existing unweighted 2-option pool (Units) and weighted
3-option pool (Difficulty) both render exactly as before — zero console errors throughout.

## 2026-09-15 — Smart Progressor: standard-mode scoping, teacher-facing off toggle
`src/shared/ToolShell.tsx`, `CLAUDE.md`, `docs/PROJECTS.md`. Closes out this session's Smart
Progressor work. Confirmed (by reading both files, not assuming) that the advanced
`WorksheetBuilder` ("Advanced" toggle) was already exempt from Smart Progressor by construction —
it generates through its own independent `generateQuestion`/`makeUniqueQ` path and never calls
`sortByDifficulty`/`buildQuotaOverrides`, both of which live entirely inside `ToolShell`'s
`handleGenerateWorksheet`, called only by the standard Worksheet tab. Added the actual new piece:
a teacher-facing "Smart Progressor" toggle in the Worksheet tab's Settings popover (next to
"Borders"), on by default and session-persisted per tool route (same mechanism as
`worksheetMode`/`worksheetBorders`) — switching it off restores generation to plain random order,
exactly as it worked before this prong existed (unmodified `multiSelectValues` per slot, no sort).
Only rendered when the current tool actually has a weighted multiSelect pool at all
(`toolHasWeightedPool`, checked across every level), so it's not dead UI on the other 26 tools.
Verified live in the running dev app via a Playwright script (not just build/test): the toggle
renders correctly in SpeedDistanceTime's Settings popover styled exactly like "Borders", is
correctly absent from CompletingTheSquare's (no weighted pool), and toggling it off + generating a
worksheet produces zero console errors. Also confirmed `buildQuotaOverrides` needs no changes to
generalize beyond 3 active options (2, 4, 5 all verified) and sharpened CLAUDE.md's conversion
rule with a concrete worked example: even a plain two-state boolean (e.g. a quadratic's "negative
coefficients") becomes a 2-option weighted `multiSelect` pool, not a toggle, once it needs to be a
genuine per-question draw rather than a worksheet-wide switch — most of the eventual 26-tool audit
is expected to produce pools this small, not just 3+-rung ladders like SDT's.

## 2026-09-15 — Smart Progressor: sharpen the multiSelect-vs-variables rule; verify quota generalizes
`CLAUDE.md`, `docs/PROJECTS.md`. Doc-only session close-out. Verified `buildQuotaOverrides` (the
even-split mechanism from the entry below) needs no extra work to generalize beyond 3 active
options — a throwaway test confirmed 2, 4 and 5 active options all stay within tolerance with
genuine variety across runs, including tight ratios (5 options over 15 questions, 4 over 6), then
removed. Also sharpened the audit's deciding test in CLAUDE.md's "QO control types" section:
whether a boolean is a `multiSelect` conversion candidate turns on **mutual exclusivity** (does
exactly one option ever apply to a given question), not "does it represent difficulty" — a boolean
that can genuinely combine with a sibling on the same question (rare, but real) must stay
independent, either as its own `ToolVariable` or its own separate pool, never folded into a pool
alongside something it can coexist with. `docs/PROJECTS.md`'s Smart Progressor prong carries the
same rule for the upcoming 26-tool audit.

## 2026-09-15 — Smart Progressor: loosen the even split to a tolerance, not an exact lock
`src/shared/helpers.ts`, `src/shared/ToolShell.tsx`. Same-day correction to the entry below: the
first cut of `buildQuotaOverrides` forced an *exact* split every time (15 questions / 3 active
rungs → always precisely 5/5/5). The user clarified that wasn't actually the ask — "I think the
idea of ending up with a 6/5/4 wouldn't be awful. Hence why I said roughly 33%." Replaced the
deterministic block assignment with `balancedSlots`: independent random draws per question slot
(genuine variety, matching how every other multiSelect pool already behaves), with the whole batch
retried — bounded at 200 attempts, falling back to the old exact largest-remainder split as a last
resort — until every active option's count lands within ±1 of its fair share. Verified with a
throwaway test: 100 repeated runs at 15 questions / 3 active rungs produced all 7 distinct
permutations of {4,5,6} (never anything more skewed, never locked to one exact split), then
removed. The ascending sort still keeps each rung's questions contiguous and correctly ordered
whatever the exact split turns out to be — only the block *sizes* now vary, which is the point.

## 2026-09-15 — Smart Progressor: guaranteed even split across active weighted rungs
`src/shared/helpers.ts`, `src/shared/index.ts`, `src/shared/ToolShell.tsx`. Closes the gap the
earlier core mechanism left open: sorting a worksheet by `_difficultyScore` only reorders whatever
`pickActive`'s independent per-question draw happened to produce, which over ~15 questions can
easily land 7/5/3 across three active rungs instead of 5/5/5. New `buildQuotaOverrides` helper
(internal — never called from a tool file) finds every multiSelect group carrying at least one
weighted option and builds a per-question `multiSelectValues` override forcing that group to
exactly one option, split as evenly as the question count allows (largest-remainder rounding for
an uneven split). `ToolShell`'s `handleGenerateWorksheet` now builds these overrides before its
generation loop, for both the standard and differentiated (per-level) worksheet paths. Scoped to
weighted groups only — an unweighted group (e.g. SDT's Units pool, mph/km·h/m·s) is passed through
untouched and keeps varying randomly per question, exactly as before. Verified with a throwaway
test: an even 5/5/5 split, a fair 4/3/3 uneven split, confirmation that an unweighted group is
untouched, and an end-to-end run through the real `SpeedDistanceTime` generator confirming an
exact 5/5/5 `_difficultyScore` distribution over 15 questions — then removed. Combined with the
existing sort, a worksheet's tier *boundaries* are now a hard guarantee (not just a bias) whenever
every weighted rung is active, closing most of the "question 1 isn't guaranteed easy" limitation
noted in the previous entry; `docs/PROJECTS.md`'s "Smart Progressor" prong has the full writeup.

## 2026-09-15 — Smart Progressor: SpeedDistanceTime L2 tiers made mutually exclusive
`src/tools/Proportion/SpeedDistanceTime.tsx`. Same-day refinement to the Smart Progressor pilot
below: the three Level 2 Difficulty rungs used to be overlapping caps rather than a genuine
ladder — `tables20` was "scale factor up to 20", which silently included every `tables10` fact
too, and `decimals` only made a genuine decimal answer *possible* (~82% of draws, confirmed by a
throwaway diagnostic test — the rest rendered as an indistinguishable whole number, e.g. a
half-hour time with an even speed). Fixed both: `buildValues` now takes an explicit `kMin` so
`tables10` draws its scale factor from 1-10 and `tables20` from 11-20 *only* (disjoint ranges);
`buildDecimalValues` now rejects any draw whose speed is a multiple of the shape's `pp` — the
exact condition that makes the distance come out whole — guaranteeing a genuine decimal on every
draw (verified over 1000 draws with a throwaway test, then removed). Added the general rule to
CLAUDE.md: Smart Progressor rungs must be mutually exclusive ranges (or a guaranteed property),
not overlapping caps or a "sometimes" property, or the ramp doesn't visibly hold on a printed
sheet.

## 2026-09-15 — Smart Progressor: core mechanism + SpeedDistanceTime L2 pilot
`src/shared/types.ts`, `src/shared/helpers.ts`, `src/shared/index.ts`, `src/shared/ToolShell.tsx`,
`src/tools/Proportion/SpeedDistanceTime.tsx`. New generic mechanism to order a generated worksheet
easy-to-hard instead of randomly: `ToolMultiSelect.options[]` gets an optional `weight?: number`;
two new helpers `weightOf` (look up a picked option's weight) and `sortByDifficulty` (stable
ascending sort by a question's `_difficultyScore`, no-op if none is set); `ToolShell`'s
`handleGenerateWorksheet` now sorts each worksheet block (each level's own block, for a
differentiated sheet) through it. Fully opt-in — no change to any tool that doesn't set
`_difficultyScore`, confirmed by the full `npm test` suite passing unchanged (320 tests). Piloted
on `SpeedDistanceTime`'s Level 2: collapsed the independent `tablesLimit` multiSelect (10×/20×) +
`ALLOW_TERMINATING_DECIMALS` boolean into one ordinal pool `DIFFICULTY_TIER_L2` (10×10 → 20×20 →
decimals, weights 1/2/3), so a Level 2 worksheet with more than one rung ticked now ramps up
instead of mixing difficulties at random. Established the general conversion rule (a boolean QO
option that means "harder" should be a multiSelect rung, not an independent toggle — only a
per-question pool pick gives the sort step something to see) — see `docs/PROJECTS.md`'s new
**Smart Progressor** prong for the rule, the remaining limitation (orders an already-generated
batch; doesn't guarantee a specific question index), and the next-steps audit across the other 26
tools.

## 2026-09-15 — Speed, Distance & Time: fix decimal-mode speed stuck at 1-10
`src/tools/Proportion/SpeedDistanceTime.tsx`. Reported: with "Allow terminating decimals" on,
the speed/rate was always 1-10 regardless of the Times Tables setting — traced to
`buildDecimalValues` (added earlier this session) picking the rate directly via
`randInt(1, tablesLimit)`, capping it at 10 by construction.
- The original (non-decimal) `buildValues` never caps the rate that directly — it bounds a
  multiplier `k` by `tablesLimit`, then the rate is `k × pp` (`pp` being the shape's small
  reduced divisor, e.g. 5 for "a fifth of an hour"), so rates up to `tablesLimit × pp` were
  always reachable. `buildDecimalValues` skipped that scaling. Fixed: the rate is now drawn from
  `randInt(1, tablesLimit * pp)`, matching the original scheme's effective range — the "fact a
  student inverts" is `D × pp = S`, not the raw size of `S`.
- Since this also fixed the underlying infeasibility, re-added TM=3 (a twentieth of an hour) to
  `L2_DECIMAL_MINUTES` — it terminates fine (0.05) and was only excluded because the old, too-
  narrow cap made it unreachable in practice.
- Verified with a temporary check (removed before commit): default "10×10" now reaches speeds
  from 5 up to 90 (mph) rather than only 5-10, while every value still stays within family
  ranges, at ≤2dp, and only the five intended TM values (twentieth/tenth/fifth/quarter/half)
  appear.
- Also investigated a related but separate report: Level 1 (whole-hour) speeds are *also*
  narrow (5-10 at "10×10", with or without "Allow decimal answers") — confirmed this is a
  different, working-as-intended property (not a bug): at Level 1 both the hours value and the
  speed are genuine multiplication factors of the distance, and both must stay ≤ the Times
  Tables limit to keep the fact within an N×N grid — there's no `pp`-style small fixed divisor
  to scale by the way L2's decimal mode has. Left as-is; flagged to the user rather than
  changed, since narrowing/widening it is a pedagogy call, not a fix.
- `npm run build` and `npm test` both clean (218 tests).

## 2026-09-15 — Speed, Distance & Time: "Allow terminating decimals" QO at Level 2
`src/tools/Proportion/SpeedDistanceTime.tsx`. Requested: a way to get genuine 1-2dp decimal
answers (e.g. 8 km/h for a fifth of an hour → 1.6 km, 9 mph for a quarter → 2.25 mi) — the
existing "Allow decimal answers" toggle only ever nudges the answer by a single ±0.5, never a
real 2dp value like 2.25.
- New Level 2-only `ToolVariable`, **"Allow terminating decimals (e.g. 1.6, 2.25)"**
  (`terminatingDecimals`) — replaces "Allow decimal answers" at Level 2 rather than sitting
  alongside it (a strict upgrade, so no redundant/conflicting toggle pair). Levels 1 and 3 keep
  the old toggle unchanged.
- New `L2_DECIMAL_MINUTES = [6, 12, 15, 30]` (a tenth/fifth/quarter/half of an hour) — the
  subset of `L2_MINUTES` whose fraction-of-an-hour both terminates AND leaves enough headroom
  under the Times Tables cap to reach a realistic distance. TM=3 (a twentieth) terminates too
  but needs a base rate of 20 just to reach 1 unit of distance, so it's excluded; the
  non-terminating values (2, 5, 10, 20 — e.g. 10 min = 1/6 hour = 0.1666…) are excluded as
  they must be, per the "no .3333333" requirement.
- New `buildDecimalValues`, used instead of `buildValues` for L2 shapes in this mode: rather
  than forcing distance/speed into clean multiples of the reduced pp/qq, it picks a whole-number
  rate freely (within the Times Tables cap) and derives the other quantity by scaling with the
  *exact* fraction, landing on a genuine terminating decimal. Uses a distance floor of 1 instead
  of the family's usual distMin (3) — otherwise the smaller fractions (a tenth, a fifth) would
  be unreachable under the Times Tables cap, the same class of issue found with TM=1 earlier
  this session.
- `numLatex` now delegates to the shared `fmt` helper (2dp, trailing zeros stripped) instead of
  its old 1dp-only `toFixed(1)` — needed since answers like 2.25 have 2 decimal places; verified
  this is a strict superset of the old formatting for existing whole/1dp cases.
- Verified with temporary regression checks (removed before commit): every decimal-mode number
  across all three subtools/both families/both Times Tables tiers has at most 2dp (5,400
  generations), distances/speeds stay within each family's realistic range, the exact numbers
  from this request's own examples reproduce correctly, and only the four intended TM values
  ever appear. Also spot-printed sample questions and working to confirm the ratio-table steps
  read correctly with decimal values (e.g. "9 km/h... in 15 minutes" → "2.25 : 15", "×4", "9 : 60").
  `npm run build` and `npm test` both clean (218 tests).

## 2026-09-15 — Speed, Distance & Time: name the unit in Speed; drop worded-fraction time wording
`src/tools/Proportion/SpeedDistanceTime.tsx`. Two clarity requests:
- **Speed**: the instruction line now names the required rate unit explicitly —
  `"Find its average speed in mph."` instead of the previous unit-less `"Find its average
  speed."` With three possible rate units (mph/km/h/m/s) the old wording left the expected
  answer unit ambiguous. Distance and Time weren't affected — their answer unit is already
  pinned by the given speed's own stated unit.
- **Time wording**: reversed this session's earlier worded-fraction reintroduction — a given
  or answer time is now always plain minutes ("15 minutes") or hours & minutes for a compound
  time ("1 hour 30 minutes"), never a spoken fraction ("a quarter of an hour"). Removed the
  now-pointless "Time Notation" QO (a single always-on option isn't a real choice) along with
  `WORDED_L2`, `wordedCompound`, `pickNotation`, and the `TimeNotation` type; `formatDuration`
  no longer takes a notation argument. `L2_MINUTES` (2/3/5/6/10/12/15/20/30) and the Times
  Tables exemption for Level 2 from the previous entry are unchanged — only the wording of the
  chosen minute value changed, not which values can be chosen.
- `npm run build` and `npm test` both clean (218 tests). Verified with temporary regression
  checks (removed before commit): Speed's prompt always names one of mph/km/h/m/s across 500
  generations, and no worded-fraction wording (half/third/quarter/fifth/sixth/tenth/twelfth)
  appears anywhere across all three subtools × all three levels (2,700 generations).

## 2026-09-15 — Speed, Distance & Time: reintroduce fifth/sixth/tenth/twelfth worded fractions
`src/tools/Proportion/SpeedDistanceTime.tsx`. Requested: reintroduce Level 2 worded fractions
previously restricted to just half/third/quarter, and widen the plain-minutes pool.
- `WORDED_L2` now also covers fifth (12 min), sixth (10 min), tenth (6 min) and twelfth (5 min),
  alongside the existing half/third/quarter — all 7 divisors of 60 that have a natural spoken
  fraction form.
- `L2_MINUTES` widened to add 2 and 3 minutes as plain-minutes-only values (no worded form).
  1 minute was considered but excluded: for both Level 2 unit families (mph, km/h — m/s isn't
  offered above Level 1), a 1-minute journey forces speed = 60×distance, which can't land inside
  either family's realistic distance/speed window (confirmed via a temporary 500-generation
  check per family/tablesLimit combo before this was ruled out — no valid pair exists, so it
  would have silently produced e.g. a "180 mph car").
- The Level 2 minute value is now exempt from the "Times Tables" QO cap (`pickShape`'s level2
  branch no longer filters through `withinTables`): since Level 2's TM is always an exact
  divisor of 60, its ratio-table scale factor is purely "minutes in an hour" — a fixed
  conversion fact, not an arbitrary times-tables one — so 2/3-minute values are reachable at
  any Times Tables setting rather than needing the wider "20×20" tier. L3's genuine times-tables
  gating (compound times, awkward minutes) is untouched.
- Verified with temporary regression checks (removed before commit): speeds stay within each
  family's realistic range across all tablesLimit/family combos (2,000 generations), all 7
  worded fractions surface over 3,000 generations, and TM=1 never appears. `npm run build` and
  `npm test` both clean (218 tests, including `organisation.test.ts`).

## 2026-09-15 — Speed, Distance & Time: fix "Time Notation" QO not restricting at Level 2
`src/tools/Proportion/SpeedDistanceTime.tsx`. Reported: unchecking "Minutes" in the Level 2
"Time Notation" QO (wanting worded-fraction-only questions) still produced plain "X minutes"
wording some of the time. Root cause: `pickShape` chose the Level 2 minute value (`TM`) before
`pickNotation` knew which notations were active — only 3 of the 7 `L2_MINUTES` values (15, 20,
30) have a natural worded phrasing, so whenever one of the other 4 (5, 6, 10, 12) was picked,
`pickNotation` fell back to "minutes" regardless of the QO, silently ignoring the restriction.
Fixed by threading the notation selection into `pickShape`: when "Minutes" is off and "Worded
fraction" is on, only TM values with a worded form (15/20/30) are offered, so the fallback path
is never reached. `npm run build` and `npm test` both clean (212 tests); added and removed a
temporary regression check (300 generations with Minutes unchecked, asserting no "minutes"
wording ever appears) to confirm the fix before committing.

## 2026-09-14 — Standard worksheet grid: explicit `gridAutoRows` for even cell heights
`src/shared/ToolShell.tsx` (`renderWorksheet`, the plain/non-differentiated grid). Reported
via a screenshot: worksheet cells in the same row were visibly different heights (a 3-line
wrapped question next to 2-line ones). The differentiated "Fit all levels" grid hit the same
class of issue previously and was fixed with explicit row tracks (`gridAutoRows: "1fr"` /
`subgrid`) rather than relying on the browser's default `auto` row-track sizing — the plain
worksheet grid never got that treatment and was still on the implicit default. Gave it the
same explicit `gridAutoRows: "1fr"` plus a flex `justifyContent: "center"` wrapper per cell
(matching the per-level list pattern already used elsewhere), so every row is forced to its
tallest occupant regardless of async KaTeX re-layout timing. Couldn't reproduce genuine
unevenness from the old default in ~300 headless-Chromium generate/measure cycles across
delays, so this is a defensive robustness fix matching established convention rather than a
confirmed root-cause fix — worth confirming against the originally reported case. `npm run
build` and `npm test` both clean (320 tests).

## 2026-09-14 — Speed, Distance & Time: "Times Tables" QO caps the tables fact required
`src/tools/Proportion/SpeedDistanceTime.tsx`. Previously the ratio-table scale factor `k`
(up to 30) and several shape divisors (L2 minute values, L3 compound times, L3 awkward
minutes) were unbounded, so questions like "104 km in 8 hours" could silently demand a
times-tables fact (`8 × 13`) well outside what a student had actually been taught — no
control existed to restrict or reason about this.
- New **"Times Tables" multiSelect** QO (all levels, all three subtools): "Up to 10×10"
  (on by default) and "Up to 20×20" (opt-in). Caps every multiplication/division fact the
  question and its ratio-table working rely on — the scale factor `k` and the shape's
  reduced `pp`/`qq` divisors — so a student is never asked to invert a fact outside the
  selected range.
- `pickShape` now takes `tablesLimit` and filters/bounds L1's whole-hour range, L2's minute
  divisors, L3's compound-time (H, minute-fraction) combos, and L3's awkward-minute search
  so every shape's `pp`/`qq` fit the limit; `buildValues`'s scale factor `k` is capped the
  same way.
- Widened the mph/kmh/mps distance & speed ranges slightly so 20×20 mode has room to
  generate genuinely bigger, more varied questions rather than just hitting the old caps.
- Verified with a throwaway vitest check (not committed): 500 generations per tool/level at
  10×10 never exceed a fact of 10; the same at 20×20 exceed 10 (confirming it's more
  expansive) but never exceed 20. `npm run build` and `npm test` both clean (320 tests).

## 2026-09-13 — Functional Skills Generator: remember-setup opt-out, landscape + squared paper (dev-gated)
`src/tools/Generators/FunctionalSkillsGenerator.tsx`. Four changes in one session:
- A **"Remember setup" toggle** (Settings) lets a teacher opt out of the existing per-browser
  `localStorage` mirroring of the tool's setup — off clears the saved setup immediately and
  stops future writes; the toggle's own value persists independently under its own key. Live for
  everyone, not dev-gated.
- A **landscape orientation** option (Settings) prints A4 landscape at 4 columns × up to 8 rows
  (32-question cap) instead of portrait's 3 columns × up to 15 rows (30-question cap);
  `handlePrint`'s page dimensions/columns/`@page` CSS are now orientation-aware.
- An optional **squared-paper page** (Settings) prepends one page of 1cm squared paper before
  each worksheet page's questions (repeats per week when generating multiple pages) — for
  booklets that need rough-working space. Drawn as SVG line strokes rather than a CSS
  `background-image`, since browsers silently drop background graphics from print unless the
  user enables it manually (confirmed by a blank print preview even with
  `print-color-adjust:exact` set); the grid is floored to whole 1cm squares and centred, so
  nothing is clipped at the page edge.
- Landscape and squared paper are both **dev-gated** (`useDevMode()` from `src/devMode.ts`) — the
  Settings controls, the info-modal copy, and their effect on `handlePrint` only activate in
  Developing-tools mode; a `saved.orientation`/`saved.squaredPaper` value from a prior dev
  session is still persisted but has no effect while dev mode is off (`effectiveOrientation` /
  `effectiveSquaredPaper` force portrait/no-squared-paper). The setup-remembering toggle above is
  the one change that is *not* dev-gated.

Verified with `npm run build` (zero TS errors) and `npm test` (320 passing) after each change.

## 2026-09-12 — "Colour levels" toggle for differentiated worksheets
Added a `diffColorLevels` setting (Settings menu, next to Question Cell Size, shown only when
differentiated) so a teacher can turn off each level's green/yellow/red tint — plain neutral
grey/white styling instead, for anyone who doesn't want the colour-coding. Default stays on
(unchanged appearance). Applied consistently on-screen (`ToolShell.tsx` — a new
`NEUTRAL_LV_COLORS` constant swaps in for `LV_COLORS` when the toggle is off, covering both the
level box background/border and its header text) and in PDF export (`print.ts`'s
`.diff-header.neutral` CSS class, `printDiagram.ts`'s neutral text/background constants) so the
preview and the printed sheet always match. Persisted as `diffColor=0` in the shareable link
(default omitted). Verified in a live browser (toggle on/off, screenshots) plus `npm run build`
(zero TS errors) and `npm test` (320 passing).

Follow-up tweaks: pressing "Differentiated" now auto-selects every available level (previously
it started from whichever single level was showing, needing a second click to add the rest) —
`toggleDiffMode` sets `diffLevels` to `availableLevels` on the on-transition. The two new
Settings options also gained their own "Differentiated" subheading, grouping Question Cell Size
and Colour levels the same way Layout groups Worksheet/Textbook and Borders.

## 2026-09-12 — Fix differentiated cell-height equalisation for real: pure CSS, no JS measurement
User-reported (with a live screenshot) that "Fit all levels" cells were still uneven on a real
device, despite passing every local check. The on-screen "Fit all levels" mode relied on a
`DiffCell` component measuring each cell's height via `ResizeObserver` + `requestAnimationFrame`
and applying the max as a JS-computed `minHeight` — this is inherently timing-dependent (it needs
the observer to fire and the resulting state update to land before the user looks), and despite
extensive attempts (narrow/mobile viewports, CPU + network throttling, a production build) it
could not be reproduced locally, but the deployed commit was confirmed (via the Vercel API) to
exactly match the code being tested — so the JS-timing theory, though unconfirmed, was the most
plausible explanation and, regardless, a strictly more fragile mechanism than necessary.

Replaced it with pure CSS: the outer differentiated grid now declares explicit row tracks
(`auto` for the header, `repeat(numQuestions, 1fr)` for the questions) and each level's coloured
box uses `grid-template-rows: subgrid` to reuse those same tracks — an auto-sized grid's `1fr`
rows always resolve to the height of their tallest occupant, so every level's row *N* ends up
exactly as tall as the tallest row *N* anywhere, recomputed natively by the browser on every
reflow (KaTeX finishing, a resize, anything) with no JavaScript or timing involved at all. This
gives row-by-row alignment across levels rather than one single global height for every cell,
which needs a browser reflow either way and is a more robust target than the old approach's
literal (but fragile) global uniform height. "Fit each level" already used the equivalent
per-column CSS trick and needed no change. Deleted the now-dead `DiffCell` component and its
`ResizeObserver`/state plumbing entirely. Print/PDF export was never affected (it always computed
sizing analytically, no measurement).

Verified in a live browser (both modes, mobile-width viewport) that every cell now renders at a
consistent, row-aligned height with centred content — plus `npm run build` (zero TS errors) and
`npm test` (320 passing). Could not reproduce the original failure locally even under heavy CPU/
network throttling, so this fix is judged by robustness of the new mechanism (deterministic CSS,
no async race) rather than a before/after repro.

## 2026-09-12 — Soften the Level 1/2/3 selector colours to pastel
The Level 1/2/3 selector buttons (worksheet mode's level row, the Whiteboard/Worked Example
`DifficultyToggle`, and the Worksheet Builder's per-section L1/L2/L3 pills) filled with
saturated green-600/yellow-500/red-600 when active — sitting three side by side clashed. Added
`LV_SELECTOR` to `colors.ts` (pastel fills with matching dark 900-shade text for contrast —
settled on green-100/yellow-100/red-100 after trying 200, per follow-up feedback wanting it
softer still) and switched all three call sites to it, removing their own inline/duplicated
colour arrays. Verified visually in a live browser across all three surfaces plus
`npm run build` (zero TS errors) and `npm test` (320 passing).

## 2026-09-12 — Worked-example-only dropdowns hidden from worksheets; differentiated cells centred
Two small fixes from review of the same-day differentiated-worksheet work below:
- **`ToolDropdown.workedExampleOnly`** (`types.ts`) — a new optional flag for a dropdown (e.g. a
  "Method" choice) whose options only change the displayed working, not the question or answer,
  so it has nothing to offer a printed worksheet. `StandardQOPopover`/`DiffQOPopover`
  (`QOPopovers.tsx`) now take a `hideWorkedExampleOnly` prop and drop such a dropdown from their
  render when set; `ToolShell.tsx` passes `hideWorkedExampleOnly: mode === "worksheet"`, so the
  option still shows normally in Whiteboard and Worked Example mode. Applied to the three
  dropdowns confirmed (by reading each `generateQuestion`/`reformatQuestion`) to be genuinely
  working-only: `SpeedDistanceTime`'s Ratio Table/Decimal method, `Percentages`'s
  Multiplier/Chunking method, and `ExpandingBrackets`'s FOIL/Grid/Both method. Left
  `SimultaneousEquations`'s "Method" dropdown alone — there it actually changes the generated
  coefficients, so it must stay visible on the worksheet. Documented in `CLAUDE.md`'s QO control
  types section.
- **Differentiated cell centring.** Cells sized taller than their own content (to match a
  level's tallest question, or every level's tallest under "Fit all levels") were top-aligning
  their content and leaving the slack space below — "wrap then pad", not what was wanted. The
  actual stretch happens on the per-cell wrapper div in the differentiated grid (via CSS Grid's
  row-stretch for "Fit each level", or the `minHeight` set for "Fit all levels") rather than
  inside `renderQCell` itself, so that wrapper is now a centred flex column
  (`justifyContent:"center"`); `renderQCell`'s own cell style also centres its content
  vertically, which incidentally already worked correctly for the ordinary (non-differentiated)
  worksheet grid, where `renderQCell` is the direct grid item. Verified visually (screenshots)
  and via measured bounding boxes in a live browser: top/bottom gaps are now equal instead of
  all sitting below the content, for both "Fit each level" (still correctly per-level-sized,
  distinct heights across levels) and "Fit all levels" (one shared height everywhere).

Verified with `npm run build` (zero TS errors), `npm test` (320 passing), and a live browser
(QO popover content per mode, and the differentiated grid screenshots/measurements above).

## 2026-09-12 — Differentiated worksheets: level row doubles as the picker, per-level cell sizing
Follow-up to the same-day level-subset work below, reworked once more after review. Final
shape, all in `ToolShell.tsx` unless noted:
- **The main Level 1/2/3 row is the level picker — no separate popover or chip row.**
  "Differentiated" is a plain toggle again (`diffToggle`), exactly like it originally was; its
  only job is to switch the level row between mutually-exclusive single-select (normal) and
  multi-select. In multi-select mode, clicking a level toggles its membership in `diffLevels`
  instead of replacing the selection. The worksheet is only *actually* differentiated once 2+
  levels are checked — `isDifferentiated` is now a derived value
  (`diffToggle && diffLevels.length >= 2`), not its own state — so checking a second level
  turns differentiation on by itself, and unchecking back down to one turns it back off and
  collapses cleanly to an ordinary single-level sheet (an effect keeps `diffLevels` mirroring
  `difficulty` whenever multi-select is off, so switching modes always starts from whatever
  level is on screen, however it got there). Toggling "Differentiated" off entirely collapses
  to whichever level was still checked.
- **Question cell size option relocated.** The `diffSameSize` setting ("Fit each level" vs
  "Fit all levels", renamed from "Same across levels") moved out of the (now-removed)
  Differentiated popover into the existing Settings menu (the one holding the
  Worksheet/Textbook layout and Borders toggle), shown only when the worksheet is actually
  differentiated. The underlying implementation (on-screen `DiffCell` measurement,
  `computeWorksheetLayout`'s `diffCellHByLevel`, PDF export in `print.ts`/`printDiagram.ts`) is
  unchanged from the same-day entry below.
- **Filtered QO popover** (`DiffQOPopover` in `QOPopovers.tsx`, still showing only the selected
  levels) is unchanged.

Verified in a live browser: mutual exclusivity when off, multi-select and the 2-selected
auto-differentiate rule when on, collapsing back to one level (and to the toggle turning off
entirely), the Settings-menu cell-size option and its relabelled options, QO popover filtering,
and that a difficulty change from the whiteboard's own difficulty toggle still starts
multi-select from the right level — plus `npm run build` (zero TS errors) and `npm test` (320
passing).

## 2026-09-12 — Standard-mode Differentiated worksheets: pick any 2-or-3 level subset
Standard-mode Differentiated worksheets (`ToolShell.tsx`) previously always split into all
three levels. Added a level-picker (L1/L2/L3 chips, shown once Differentiated is on) so a
teacher can target any subset of at least two levels — e.g. Level 1 & 3, skipping Level 2 —
matching what Advanced/Worksheet Builder already allowed via per-section levels. Selecting
fewer than three levels also works when a level is `comingSoonLevels`-gated (Differentiated
is now only disabled when fewer than two levels are available, rather than whenever any level
is coming soon). The selection is encoded in the shareable link (`diffLv=1,3`, backward
compatible with old `diff=1` links) and drives worksheet generation, the whiteboard/worked
example differentiated grid, and PDF export (`print.ts`, `printDiagram.ts` for SVG tools) —
`computeWorksheetLayout`'s per-level pagination math (`worksheetLayout.ts`) now divides by the
selected level count instead of a hardcoded 3. Verified in a live browser (level toggle, the
2-level lock, worksheet regeneration, URL persistence across reload) plus `npm test`.

## 2026-09-12 — New tool: Speed, Distance & Time + shared Ratio Table representation
Built `SpeedDistanceTime` (`src/tools/Proportion/SpeedDistanceTime.tsx`, Ratio & Proportion,
`enabled: false` pending review), with three subtools — Speed, Distance, Time — sharing one
generation model across three levels: L1 is a whole number of hours (or seconds for m/s); L2 is
a time in minutes that divides exactly into 60; L3 is either a compound time (e.g. "1 hour 30
minutes") or a minute value that isn't a factor of 60 (e.g. 40 minutes), both needing the
unitary method. Every question reduces its time to a fraction of an hour and scales a size knob
`k` so distance and speed always come out clean (whole, or a single terminating decimal when
"Allow decimal answers" is on) — verified with 1,080 randomised draws checked for internal
consistency (`D·hourRef == S·TM`) and exact decimal-hours text before removing the scratch test.
A "Time Notation" QO pool (minutes / decimal hours / compound / worded fraction) controls how a
split time is worded; the "decimal" option is only offered when the fraction genuinely
terminates (e.g. 5 minutes = 1/12 hour is excluded — caught by manual verification before this
shipped). Units are a per-level multiSelect pool (mph / km/h / m/s), with m/s gated to Level 1
only (no natural "per minute" convention exists for it at GCSE level).

Added a **seventh core representation**, the **ratio table** (`src/shared/ratioTable.ts` +
`src/shared/components/RatioTable.tsx`), alongside the existing six in CLAUDE.md — renders as one
continuous bordered `<table>` with quantities as columns and each scale-step as a row going down
(rows share borders directly, no gap row), the factor between adjacent rows shown as an arrow
outside the table running from the vertical centre of one row to the centre of the next, mirrored
left and right. Went through three rounds of user feedback before landing here: a borderless CSS
grid (quantities as columns, steps as rows) → transposed to quantities-as-rows → back to
quantities-as-columns with a real bordered table and an empty "divider row" for the arrows → this,
with the divider row removed entirely and the arrows measured in real pixels instead (refs +
`getBoundingClientRect` on each row, in a plain `useEffect` so it runs after `MathRenderer`'s own
child effect has painted the KaTeX) — a percentage-height div inside a `<td>` was found to collapse
to 0 in this rendering engine, stacking every arrow at the same spot; same measurement technique
`WorkedExampleSteps.tsx`'s `FitWidth` already uses elsewhere in this codebase. A single combined
scale factor is never shown as one fraction/decimal multiply: `buildScaleSteps` in
`SpeedDistanceTime.tsx` decomposes it into two whole-number `×n`/`÷n` steps through an intermediate
"unit" row whenever both factors are non-trivial (only possible at Level 3 — Levels 1–2 always have
one factor equal to 1, so the
chain collapses back to a single step), verified against 1,440 randomised draws. Authored via
`rStep(label, headers, rows, operations)` and rendered through the shared
`ratioTableStepRenderer`, which a tool passes as `stepRenderer` (returns `null` for every
non-ratio-table step, so `mStep`/`tStep`/`step` still render through ToolShell's normal path —
same fallback pattern a diagram tool's `questionRenderer` uses). Reusable by any future
proportional-scaling tool (currency conversion, recipe scaling, etc.).

Follow-up refinement: the "worded fraction" time notation (L2) was phrasing every divisor of 60 as
a fraction of an hour, including ones nobody actually says out loud — "a fifth of an hour" (12
min), "a sixth of an hour" (10 min), "a tenth of an hour" (6 min), "a twelfth of an hour" (5 min).
Restricted "worded" to only the genuinely natural spoken fractions (half, third, quarter — 30/20/15
min); the other minute values still generate normally, just never with a "worded" phrasing (they
fall back to minutes/decimal). Verified across 1,800 randomised draws that none of the retired
phrasings can appear.

Further refinement: decimal hours ("0.1 hours", "1.5 hours") never sit right as something a
*question* actually says, so removed "decimal" from the Time Notation pool entirely — a question
never phrases time that way now, only minutes/hours-and-minutes/a natural spoken fraction. The
decimal method still has real teaching value as an alternative to the ratio table, though, so
added a second, display-only **Method** dropdown (Ratio Table / Decimal), following the same
precedent already in the codebase (`ExpandingBrackets.tsx`'s FOIL/Grid dropdown): the question's
raw values (D, S, time-in-minutes, the reduced scale factor) are stored on the question as
`_rawValues`, and `reformatQuestion` rebuilds just the working steps from the same `buildWorking()`
function generateQuestion uses, without regenerating the question — so switching Method mid-question
keeps the same numbers and wording. The Decimal method (convert the time to decimal hours, then
divide/multiply by it directly) only differs from Ratio Table where that conversion is exact
(Level 2/3 shapes whose minutes give a terminating decimal); otherwise it silently falls back to
the Ratio Table working, since a rounded decimal wouldn't reproduce the exact answer. Verified
across 1,350 randomised draws: no question ever phrases a decimal number of hours, and the two
methods produce different working on ~40% of draws (the cases where Decimal genuinely applies).

Also fixed the ratio table's arrows on user feedback: they were straight vertical lines, but should
curve (bulging away from the table) — one SVG path, mirrored via CSS `scaleX(-1)` for the right-hand
gutter rather than authoring two paths.

Three further refinements from a closer read of the worked examples:
- **Arrowhead now rotates to match the curve's tangent** at its endpoint (a quadratic bezier, so the
  tangent is a clean 45°) instead of staying fixed pointing straight down while the curve visibly
  bends away from it — the arrowhead is authored in local coordinates and placed via
  `transform="translate(...) rotate(-45)"` rather than being drawn already-rotated in place.
- **Decimal method's compound-time conversion now goes straight to hours**: "45 min ÷ 60 = 0.75,
  then 1 + 0.75 = 1.75" instead of the previous "1×60+45=105, then 105÷60=1.75" detour through total
  minutes (Speed/Distance only — Time computes the decimal from D and S, it never starts from a
  given compound time).
- **Suppressed a numeric coincidence at Level 3** ("A car travels 37 miles in 37 minutes") that was
  showing up far too often: whenever the awkward minute value is coprime to 60, the reduced scale
  factor forces the distance to equal the time-in-minutes almost every draw (the speed range only
  leaves room for the one scaling factor that produces this exact coincidence). Fixed at the root —
  awkward-minutes shapes now require a shared factor with 60 — plus a defensive check in the value
  generator that skips/nudges any draw where distance would still equal the time value. Verified
  across 3,000 randomised Level 3 draws: zero coincidences.

## 2026-09-07 — ToolShell bug fix: differentiated worksheets ignoring multiSelect defaults
Fixed a shared-shell bug reported on Collecting Like Terms: a differentiated worksheet would
sometimes generate negative-coefficient or crossing-zero questions even with "Positive terms
only" selected. Root cause was in `ToolShell.tsx`, not the tool — the differentiated QO
popover's per-level multiSelect state (`levelMultiSelect`) only records a level's *explicit*
overrides, so a level nobody opened the popover for stayed `{}`. That raw `{}` was fed straight
into `pickActive()`, which treats "not `=== false`" as active — so every option (including ones
whose `defaultActive` is `false`, like "Subtraction" and "Crossing zero") counted as active,
regardless of the tool's configured default. Added `resolveMultiSelectValues` (`shared/helpers.ts`)
to fill in each option's own `defaultActive` before layering explicit overrides on top, and used it
both for worksheet generation (`handleGenerateWorksheet`) and the popover's own checkbox display
(previously showing every option unchecked for an untouched level) via a new
`getLevelMultiSelectValues` helper in `ToolShell.tsx`. This was a shell-level bug affecting every
tool with a `multiSelect` QO used in differentiated worksheets, not just Collecting Like Terms.
Added `src/tests/resolveMultiSelectValues.test.ts` to guard the fix. `npm run build` clean, `npm test`
308/308 passing.

## 2026-08-19 — Worksheet Builder: standalone Builder folded into the Advanced toggle
Removed the top-nav "Builder" tab as a separate mode. Auditing the difference between it and the
in-tool Worksheet mode's "Advanced" toggle found only two: the toggle rendered a `lockedTool`-locked
builder (every group forced to the current sub-tool, per-group tool selector hidden) with a header
slot hosting the toggle switch itself, while the nav tab rendered the same component unlocked
(sub-tools mixable) with no header slot and its own shareable `?mode=builder` URL. Locking added no
capability — it only removed the ability to change a group's sub-tool — so the two modes were a
near-duplicate surface with the same confusion risk the classic/full split had. Folded them into one:
the Advanced toggle now opens the same always-unlocked builder the nav tab used to, seeded via a new
`initialTool` prop (`WorksheetBuilder.tsx`) so the first group still defaults to whatever sub-tool the
teacher was on, rather than forcing them to stay there. Removed the nav-bar button, the `mode ===
"builder"` top-level mode, and `WorksheetBuilder`'s `lockedTool` prop + its now-dead group-remapping
effect. Old `?mode=builder` links still work — `modeMap` maps `builder` → `worksheet` and a new
`builderRequested` flag seeds `worksheetMode` as `"advanced"` on load, so bookmarks never break.
Verified in a live browser: nav bar has no Builder button, the Advanced toggle opens the unlocked
builder pre-seeded with the active sub-tool, and an old `?mode=builder` link correctly lands on
Worksheet mode with Advanced already on. `npm run build` clean, `npm test` 304/304 passing.

## 2026-08-19 — Worksheet Builder: drag-and-drop group reordering
Replaced the row number badge with a drag handle (`GripVertical`) and added native HTML5
drag-and-drop to `WorksheetBuilder`'s group list — groups can be reordered by dragging, including
across section boundaries. No new dependency: hand-rolled `dragstart`/`dragover`/`drop` handlers with
a blue insertion-line indicator, gated to the grip handle only so the tool select/level pills/count
stepper keep working without accidentally starting a drag. Section membership needed no separate
logic — a section is just a contiguous run of the flat `groups` array split by id-keyed dividers, so
moving a group's array position across a divider boundary already reassigns its section; verified
with a Playwright-driven drag in a live browser (order `[5,6,7,8]` → `[6,7,5,8]`, group correctly
landing in the target section). Also lets a solo, unsplit section use heading/shuffle via a quiet
"+ Add heading / shuffle" link, without requiring a fake split (previous entry only covered the
classic/full unification). Known limitation: HTML5 drag-and-drop has no touch support, so this only
works with mouse/trackpad — a deliberate trade-off to avoid adding a DnD library dependency.

## 2026-08-19 — Worksheet Builder unification: classic/full split removed
Built the prong scoped 2026-08-18. `WorksheetBuilder` (`src/shared/WorksheetBuilder.tsx`) is now a
single implementation — `classic={!devMode}` is gone, and worksheet-building no longer differs by
Developing-tools mode. Kept every "full" feature (sections, per-section heading/shuffle/columns) but
rebuilt the UI around classic's preferred model, since the complaint was the *structure*, not the
feature set:
- Persistent two-pane layout always (group list left, selected group's QO options in a fixed panel
  right) — replaces full's inline accordion-under-the-row, which reflowed the list on every edit.
- Sections are opt-in and invisible until used: a flat, unsplit list has zero section chrome, matching
  old classic exactly. Splitting creates section header strips (heading, Shuffle, per-section columns)
  only once they're needed.
- Section breaks are created **in place** via a hover-reveal "+ Split section" control in the gap
  between any two group rows, replacing full's append-only "Add section" button at the bottom of the
  list — a break can now go anywhere, not just at the end.
- Decluttered the section header strip (dropped divider pipes and the "col" label; smaller column
  picker) and made the global column picker in the Design line context-sensitive (shows only while
  unsplit; per-section pickers take over once split).
`ToolShell.tsx`'s two `<WorksheetBuilder>` call sites no longer pass `classic`. `npm run build` clean,
`npm test` 304/304 passing. Still open: URL-sync for the Builder's groups/sections, and a `CLAUDE.md`
`WorksheetBuilder` reference section — both tracked in `docs/PROJECTS.md`.

## 2026-08-18 — Worksheet Builder's undocumented classic/full split, scoped for tomorrow
Findings-only session, no code changed. `docs/PROJECTS.md` gains a new prong, **Worksheet Builder
unification**, scoping a previously undocumented gap for the next build session: `WorksheetBuilder`
(`src/shared/WorksheetBuilder.tsx`) silently renders two different builders depending on
Developing-tools mode (`classic={!devMode}`) — a flat classic mode (one global column count, no
sections) versus a full sectioned mode (per-section headings/shuffle/columns) — on top of a third,
separate "Standard Worksheet" surface in `ToolShell.tsx` that was never gated at all. The aim for
next session: unify classic/full into one always-live builder and remove the gate entirely — worksheet
mode should never differ by dev-mode state. The prong entry records the full current-state
breakdown plus the open design call (sectioning always-on vs opt-in vs hybrid) and a recommended
default, ready to pick up cold.

## 2026-08-18 — New `parkedMode` gate: Skill Library + Teach decks split off from Developing-tools mode
`Developing-tools mode` had been conflating two different things: work currently in the pipeline
(in-progress tools, the Technique Library, Grapher Lab) and content that's dormant/not a current
focus (the Skill Library, Teach decks) but isn't literally broken either. Flipping the one visible
toggle showed both at once, which read as "here's everything unfinished" when really only the first
group is.
- Added `src/parkedMode.ts` — a second, stronger gate with **no visible UI toggle**. It only unlocks
  via `?parked=1` in the URL (persisted in localStorage afterwards, same mechanism as `devMode`, and
  the param is stripped from the address bar once read).
- `registry.ts`'s `ToolMeta` gained a `parked?: boolean` field; the `skill-library` entry now sets it.
  `App.tsx` gained a `ParkedRoute` guard — a parked tool's route 404s outright without the flag,
  stronger than an ordinary `enabled: false` tool (whose route still works by direct URL).
- `LandingPage.tsx`'s `visibleIn()` now treats `parked` tools as requiring `parkedMode` specifically
  — Developing-tools mode alone no longer reveals them.
- `ToolShell.tsx`: `showTeach` and the Worked Example's `onOpenSkill` (the skill-link click handler)
  now key off `parkedMode` instead of `devMode`. The step-by-step fragment reveal itself
  (`stepThroughEnabled`) is unchanged — still gated by ordinary Developing-tools mode.
- Verified with a headless-browser check across all four states: `/skills` 404s with no flags and
  with `devMode` alone; unlocks with `?parked=1`; the Teach tab on `FractionsAddSub` behaves
  identically (present only once `parkedMode` is on, regardless of `devMode`). `npm run build`
  clean, `npm test` 304/304.
- Docs updated: `CLAUDE.md`'s Teach-deck and skill-link sections, `docs/PROJECTS.md`'s dev-gating
  callout (now "Two separate gates — do not conflate them").

## 2026-08-18 — Two tier-1 fixes from the retagged audit: EquationsOfLines grapher + CircleProperties print
Picked the two cheapest, highest-value `[T1 exception]` items surfaced by the retagging pass above.
- **`EquationsOfLines`** — wired SmartGrapher into all three sub-tools (`gradient`/`equation`/
  `missing`): a line through the known points (plus the missing-value point for that sub-tool)
  reveals on the Whiteboard once the answer is shown, matching the pattern `NonLinearSimEq` already
  established. Closes the tool's own "zero visual content despite its name" gap — the audit's single
  highest-leverage Part 1 finding for it.
- **`CircleProperties`** — migrated its hand-rolled, fixed-3×5-grid `customPrintHandler` onto the
  shared `handleDiagramPrint`, fixing the confirmed bug where the Differentiated toggle silently
  produced an identical flat sheet. Also dropped `fixedColumns: true` in favour of `maxColumns: 4`
  (restores the Columns control) and added `hideFontControls: true` to match every sibling diagram
  tool (the font-size chevrons had no effect on the diagram anyway). Diagrams are always square, so
  the default `_aspect` of 1 needed no extra work.
- Both verified with `npm run build` (zero TS errors), `npm test` (304/304 passing), and a headless
  browser check confirming both render with no console errors.

## 2026-08-18 — Project docs reorganised around a teacher/student/infra priority lens
`docs/PROJECTS.md` and `docs/TOOL_AUDIT.md` findings-only, no code changed.
- Added a `## Priorities` section to `PROJECTS.md` splitting all work into three tiers: **tier-1**
  teacher-facing advancement (new tools, in-lesson utilities like SmartGrapher — current priority),
  **tier-2** student-led self-teaching (Skills library, Worked Example fragment reveal — currently
  dormant), **tier-3** tool-building infrastructure (ToolShell, the Techniques engine — build on
  demand, not a standalone sweep). Flagged the At-a-glance table, the Part 1 roadmap, and each
  pedagogy-prong section (Techniques/Skills/Core representations/Teach decks/SmartGrapher)
  accordingly; elevated "Tool expansion (Part 2)" and SmartGrapher as the active backlog.
- Retagged all 27 `docs/TOOL_AUDIT.md` tool entries plus its 4 category summaries against the same
  lens: a `Priority tag` line under each Part 1 heading calling out tier-1 exceptions (confirmed
  live bugs, unwired SmartGrapher fits, cheap wins that fix something a teacher sees today) against
  the tier-2/3 default; the Working-step depth bullet is now split-tagged where it conflated
  working-step *content* quality (tier-1) with `string[]` *fragmentation* mechanics (tier-2/3, only
  matters for the dev-gated Worked Example reveal). No finding's substance changed — only which ones
  are flagged as worth picking up next.

## 2026-08-17 — Technique Library: popup → real per-technique pages
Reworked the Technique Library's preview from a near-fullscreen popup into what the previous
session's `NonLinearSimEq`/Tier 0 work made clear the audit needed: an **honest, page-level**
preview that renders through the exact same viewer a real tool's Worked Example uses, not a
bespoke mockup that can drift out of sync.
- Extracted `WorkedExampleSteps` (`src/shared/components/WorkedExampleSteps.tsx`) out of
  `ToolShell.tsx` — the single step-viewer both a real tool and every technique preview now render
  through. `ToolShell.tsx`'s own single-card behaviour is unchanged (verified pixel-for-pixel at every
  stage); the extraction only added an opt-in `layout: "single" | "stacked"` and `hideAnswerStep` prop,
  both defaulted off.
- Added a **Stacked** layout alongside the original **Single card** one — earlier steps stay visible
  or a scrolling trail as you press through, instead of replacing the card each time — after
  comparing both live and choosing Stacked as the preferred direction. Fixed several bugs surfaced by
  real (including real-mobile-device) testing along the way: wide KaTeX lines clipping instead of
  shrinking to fit (a proper flex-centred + `getBoundingClientRect` fix, not the naive `scrollWidth`
  approach that undercounts left-side overflow), the current step's emphasis ring being clipped by the
  scroll container's implicit `overflow-x`/`overflow-y` auto-clipping, inconsistent gaps before the
  answer box, and the answer's font size not matching the working cells'.
- Added `hideAnswerStep`: a technique preview has no data model for a genuinely separate "answer"
  distinct from its last working step, so reusing the last step's own latex as a fake "Answer" card
  showed the same content twice. Step-by-step now simply ends on the last real step; every live tool
  (which has a real, distinct answer) is unaffected — verified untouched.
- Converted **all seven** techniques (Quadratic Formula, Solving a Linear Equation, Reading Roots
  from Factors, Substituting Back, Making the Subject, Solving a Linear Chain, Full Worked Example)
  from the library's popup overlay to their own real tool pages at `/techniques/<slug>` — each a thin
  `TechniquePreviewPage` wrapper, `enabled:false` + `hidden:true` (reachable via its route and the
  library's own card, never listed as its own landing-page tile). The popup overlay itself, and its
  now-dead state, were removed from `TechniqueLibrary.tsx`.
- Reintroduced autoscroll in Stacked layout, this time correctly: diagnosed that the container's
  "bounded, internally-scrolling" design never actually engages (`TechniquePreviewPage`'s root only
  sets `minHeight:100vh`, not `height`, so nothing downstream is genuinely height-constrained — the
  internal scroll body's `scrollHeight` always equals its `clientHeight`, confirmed via Playwright; the
  whole *page* grows and scrolls instead). Replaced the old "scroll the current card into view" effect
  — which aligned the wrong element and let the nav footer creep off the bottom of the viewport — with
  one that captures the footer's on-screen position immediately before each Prev/Next/dot press and,
  once the new content has painted, scrolls the window by exactly how far the footer moved. Symmetric
  for growing forward and shrinking back; a no-op outside Stacked layout, so Single card and every live
  tool trigger zero window scrolls (verified).
- All dev-gated / exploratory (this is preview tooling for reviewing technique output, not a
  user-facing tool); build clean, all 304 tests pass.

## 2026-08-15 — Tier 0 of the Part 1 roadmap (Skill + Technique wiring), dev-gated
Both zero-new-engine-work items from `docs/PROJECTS.md`'s Part 1 roadmap Tier 0, built but kept
**behind Developing-tools mode** pending sign-off — non-dev users see unchanged output.
- **Skill**: linked the two unlinked `lcm` consumers found by the audit. `SimultaneousEquations`'
  `lcm` sub-tool now shows an explicit `[[lcm|LCM]]`-linked "find the LCM" step before scaling both
  equations (dev-mode only — the step didn't exist before, so it's gated rather than just the link);
  `FractionToRatio`'s existing "LCD:" working-step label becomes `[[lcm|LCM]]`-linked in dev mode
  (unchanged wording otherwise).
- **Technique**: `NonLinearSimEq`'s `linear` sub-tool now routes its post-substitution solve through
  the shared `solveLinearEquationSteps` technique instead of its hand-rolled `solvePos`/`solveNeg`
  chain, fixing the audit-confirmed `−1x`-should-be-`−x` display bug (the combined coefficient is
  now formatted through `solveLinearEquationSteps`' own `coef()`/`signed()` sanitizers instead of
  being interpolated raw) and adding an explicit "Expand the brackets" step. The original hand-rolled
  chain is kept verbatim as `legacySolvePos`/`legacySolveNeg` and stays what non-dev users see;
  `getDevMode()` picks the branch in `buildWorking`.
- Verified with scratch checks (not committed): 8000 sampled `linear` questions with `negEq1`/
  `zeroForm`/`negSol` on (the settings that actually allow negative coefficients, so the bug can
  fire) reproduced `-1x`/`-1b`/etc. 372 times with dev mode off, matching pre-existing behaviour;
  the same 8000-sample run with dev mode forced on showed zero occurrences, confirming both the fix
  and the gate. `npm run build` clean, `npm test` (304 tests) passing throughout.

## 2026-08-14 — Spot-checked the audit and fixed the CLAUDE.md doc-drift it found
No tool code changed — a verification pass on the completed Tool Audit, plus two doc corrections.
**Spot-check**: directly re-read source for 8 claims spanning 6 tools across 3 categories, including
the two highest-stakes findings in the whole audit — `NonLinearSimEq`'s `−1x`-should-be-`−x` bug and
missing `(2x−5)²` expansion (both confirmed exactly, including root cause: `solvePos`/`solveNeg`
interpolate a computed coefficient raw instead of routing it through the file's own `nextT`/`lead`
sanitizer, and `expandedLatex` is computed directly from final simplified coefficients with no
intermediate ever stored) — and `CircleProperties`' print-handler bug (confirmed: the function
signature literally only accepts 3 of the 4 `customPrintHandler` parameters, silently dropping
`ctx.isDifferentiated`). `CollectingLikeTerms`' info-modal/generator mismatch also confirmed exactly.
Found and fixed two small counting inaccuracies (`AnglesInQuadrilaterals`' Level 1 multiSelect count —
2 groups, not 1; `BasicAngleFacts`' distinct hex-token count — 19, not 18); one apparent discrepancy
(`FractionsOfAmounts`' "52 fragment uses") turned out to be the spot-check's own undercount, not an
audit error. **Doc-drift fixes**: added a caveat to `CLAUDE.md`'s Diagram-tools reference
implementations (`AnglesInParallelLines.tsx`/`BasicAngleFacts.tsx`) clarifying they're the reference
for SVG element conventions only, not the print-handler pattern — both hand-roll a fixed-grid
`customPrintHandler` that CLAUDE.md's own "Printing SVG worksheets" section tells tools not to do;
points readers to `AnglesInQuadrilaterals.tsx` for print instead. Corrected `docs/TOOL_AUDIT.md`'s own
methodology text, which had falsely claimed `FractionToRatio.tsx`/`RatioSharingTool.tsx` were "named
in `CLAUDE.md`" when only two of the four cited files actually are. Marked all three resolved findings
in their originating `TOOL_AUDIT.md` entries so they don't get rediscovered.

## 2026-08-14 — Built the Part 1 roadmap and Part 2 scope from the completed Tool Audit
No code changed — this session turned the completed Maths Tool Audit's findings into an actual build
order. Added a **"Part 1 roadmap"** to `docs/PROJECTS.md`'s Maths Tool Audit section: five tiers
sequencing the next build across all five infrastructure prongs (Techniques, Skills, Core
representations, Teach decks, SmartGrapher) together by leverage, rather than each prong picking its
own priority in isolation — Tier 0 is free wins (wiring already-built pieces), Tier 1 is the one
representation decision (algebra tiles now has a stronger leverage case than area model — 5
tool-consumers vs. ~3, reversing the pre-audit guess), Tier 2 is the highest-leverage builds that can
start immediately (`applyAngleFact`, needed by 5 of 8 Geometry tools, is the single biggest demand
signal found), Tier 3/4 are smaller items, plus a cross-cutting list (SmartGrapher wiring, the grain
toggle, Teach decks). Also scoped a **"Part 2 — Tool expansion"** section, explicitly defined as the
per-tool content-growth backlog needing a pedagogy/product decision (new question types, broader
sub-tool coverage) — deliberately excluding the two confirmed print-handler bugs and the
`SimplifyingRatiosTool` gating call, which are mechanical/sign-off items that don't need the same
depth of involvement and are called out separately. Updated the Core representations section's
"prioritise by blockage" bullet, which the audit's findings now actually answer. Confirmed via the
audit: exactly one tool (`SimplifyingRatiosTool`) is recommended for dev-gating, and it's already
gated — no live tool was recommended for new gating.

## 2026-08-14 — Ran the Maths Tool Audit's Geometry category (8 tools) — audit complete
No code changed — findings-only pass per `docs/TOOL_AUDIT.md`'s methodology. Audited all eight
Geometry tools (`AnglesInQuadrilaterals`, `BasicAngleFacts`, `AnglesInTriangles`,
`AnglesInParallelLines`, `Bearings`, `CircleProperties`, `EquationsOfLines`, `PerimeterTool`) and
logged the full per-tool entries — **this completes the Maths Tool Audit: all 27 tools across
Number, Algebra, Ratio & Proportion, and Geometry are now audited.** Headline Geometry findings: six
of the eight tools build every working step through `tStep()` only, making them structurally
incapable of the fragment-reveal convention (a category-wide finding, not six separate ones); only 4
of 8 tools use the shared `handleDiagramPrint` — the other 4 hand-roll a fixed-grid print handler
that directly contradicts `CLAUDE.md`'s explicit instruction, and two of those three hand-rolled
handlers have confirmed functional bugs (`BasicAngleFacts` silently drops section headers on
differentiated worksheets; `CircleProperties`' Differentiated toggle does nothing at all, with no
error). Notably, two of the three hand-rolled holdouts are the very files `CLAUDE.md` names as the
SVG/renderer reference implementations. `PerimeterTool` — named in `docs/TOOL_AUDIT.md`'s own intro
as the example of why a live `enabled` flag can't be trusted as a quality signal — confirmed exactly
that prediction: well-engineered shell migration, thinnest QO richness of the whole audit.
`EquationsOfLines` turned out not to be a diagram tool at all despite its category, confirming its
SmartGrapher gap is still fully unaddressed. `PROJECTS.md`'s skills table had zero Geometry rows
before this pass; two are now proposed (`apply-angle-fact`, `unit-conversion`) alongside a new
`sumPerimeter`/`deriveMissingSide` technique. Updated `docs/PROJECTS.md`'s technique/skill tables and
flipped the Maths Tool Audit's status to complete, with a short "possible next steps" list for
picking up the audit's findings (a sign-off pass on `SimplifyingRatiosTool`'s "stay gated"
recommendation, fixing the two confirmed print-handler bugs, and building from the refreshed
technique/skill demand signals rather than the pre-audit guesses). No `enabled` flags changed.

## 2026-08-14 — Ran the Maths Tool Audit's Ratio & Proportion category (6 tools)
No code changed — findings-only pass per `docs/TOOL_AUDIT.md`'s methodology. Audited all six Ratio &
Proportion tools (`RatioSharingTool`, `SimplifyingRatiosTool`, `RecipesTool`, `FractionToRatio`,
`FractionsOfAmounts`, `BestBuys`) and logged the full per-tool entries. Headline result: the clearest
live/gated contrast found in the audit so far — `SimplifyingRatiosTool` (dev-gated) is recommended to
**stay gated**, judged blind to its current status, being the only tool in the whole audit with
literally zero QO control and zero visual representation, while its live sibling `RatioSharingTool`
ships with both a working bar model and real controls. `FractionsOfAmounts` came out reference-quality
(52 genuine fragment-array uses, the strongest QO differentiation of the pass). Two existing technique
rows (`scaleRecipe`, `unitPriceCompare`) turned out to only describe half their tool's actual content —
`RecipesTool`'s Constraints sub-tool and `BestBuys`' Special Offers sub-tool each do a materially
different move. The `unitary-method` skill (proposed for `Percentages` in the Number pass) now has two
more unconsumed demand signals here — three tools across two categories hand-roll the same "find 1,
then scale" reasoning unlinked. A new skill, `convert-fraction-ratio`, is proposed for `FractionToRatio`,
whose technique row had no matching skill row at all. Two documentation-drift findings also surfaced:
`CLAUDE.md`'s reference-implementations table doesn't actually name `FractionToRatio.tsx` despite
`docs/TOOL_AUDIT.md`'s own methodology text citing it, and doesn't describe `RatioSharingTool.tsx` as a
"multi-group multiSelect" example (it's single-group throughout) — recorded as findings, not corrected.
Updated `docs/PROJECTS.md`'s technique/skill tables accordingly. No `enabled` flags changed (the
`SimplifyingRatiosTool` recommendation is recorded only, per the audit's own rule not to act on
recommendations mid-pass). Next: Geometry category (8 tools) — the final one.

## 2026-08-14 — Ran the Maths Tool Audit's Algebra category (7 tools)
No code changed — findings-only pass per `docs/TOOL_AUDIT.md`'s methodology. Audited all seven
Algebra tools (`CollectingLikeTerms`, `SolvingLinearEquations`, `CompletingTheSquare`, `Iterations`,
`SimultaneousEquations`, `NonLinearSimEq`, `ExpandingBrackets`) and logged the full per-tool entries.
Headline results: `NonLinearSimEq` — the repo's one techniques-engine conversion — turned out to be a
genuine hybrid rather than a full delegation (its highest-frequency `linear` sub-tool still hand-rolls
its solve chain), which is why both of its previously-known working-step gaps are now **confirmed
still present at the exact generator-code level**: the `(2x−5)²` expansion is never shown (the data
model has nowhere to store an unsimplified intermediate) and a computed ±1 coefficient renders as
literal `−1x` because that path bypasses the sanitizer used everywhere else in the file.
`CompletingTheSquare.tsx` — the repo's own named shell-wiring reference — is equally unconverted on
the techniques/fragment axis, a useful calibration that "reference implementation" is an
architectural claim, not a pedagogy-infrastructure one. `SimultaneousEquations` (the Elimination
sibling) is not carried along by `NonLinearSimEq`'s "converted" status, despite arguably broader Part
2 content — a clean example of Part 1/Part 2 findings diverging on sibling tools. Two unrelated
content bugs surfaced (not fixed): `CollectingLikeTerms`' info-modal text disagrees with its own
generator's option count, and `SolvingLinearEquations` has a redundant no-op working step in two of
three levels. `Iterations` was flagged as the highest-leverage unwired SmartGrapher candidate found so
far (already named in `PROJECTS.md`, proven elsewhere in the same category, zero visual content
today). Updated `docs/PROJECTS.md`'s technique/skill tables with new demand notes and one priority
bump (`solveByIteration`: low → med). No `enabled` flags changed. Next: Ratio & Proportion category (6
tools).

## 2026-08-14 — Ran the Maths Tool Audit's Number category (6 tools)
No code changed — findings-only pass per `docs/TOOL_AUDIT.md`'s methodology. Audited all six Number
tools (`IntegerAddSub`, `Estimation`, `PowersOfTen`, `FractionsAddSub`, `FractionMultDiv`,
`Percentages`) against Part 1 (infrastructure alignment) and Part 2 (standalone readiness), and
logged the full per-tool entries in `docs/TOOL_AUDIT.md`. Headline results: `FractionsAddSub` and
`Percentages` are close to reference quality (worded contexts, fragmented working, genuine level
restructuring) and are worth treating as Number-strand quality bars; the other four are "live but
flagged for expansion," with `PowersOfTen`'s two fixed-template working steps (no computed numeric
line) the weakest finding of the pass, and its Level 3 dropping its own place-value-grid
representation entirely. Surfaced several new Part 1 backlog items not previously tracked —
`directedNumberAddSub` and `scaleByPowerOfTen` techniques, a `place-value` skill, and a
previously-nonexistent percentages technique/skill family (`percentageOfAmount`, `percentageChange`,
`reversePercentage`, `percentage-to-multiplier`, `unitary-method`) — added to `docs/PROJECTS.md`'s
technique/skill tables with demand notes. No `enabled` flags changed. Next: Algebra category (7
tools).

## 2026-08-14 — Set up the Maths Tool Audit; reorganised the planning docs around it
No code changed — this session designed and documented a new initiative rather than shipping a
tool change. Created **`docs/TOOL_AUDIT.md`**: a self-contained methodology + live findings log
for a systematic pass over all 27 Maths ToolShell question generators (Number, Algebra, Ratio &
Proportion, Geometry). Each tool gets two separate assessments — **Part 1: infrastructure
alignment** (how far behind the techniques engine, skills library, core representations, Teach
decks, and SmartGrapher is this tool — an expected gap, feeds the existing prong backlogs) and
**Part 2: standalone readiness**, judged *blind to the tool's current `enabled` status* (question
variety vs GCSE spec coverage, QO richness, whether levels genuinely restructure the problem,
working-step depth, a conventions/anomaly scan for undocumented deviations from the ToolShell
baseline — column caps, hidden font controls, bespoke print handlers — and a recommended live/gated
status). Documented why neither git history (nearly all 27 tools share one bulk-import commit date)
nor the current `enabled` flag (has historically tracked shell-migration readiness, not content
quality — e.g. `PerimeterTool` went live on shell-verification grounds alone) can be trusted as
maturity signals, so both must be judged from the file content itself. Reorganised
**`docs/PROJECTS.md`**: added a new "Maths Tool Audit" prong as the current top priority, added a
sequencing note to the four pedagogy prongs (Techniques engine, Skills library, Core
representations, Teach decks) and SmartGrapher pointing their future next-steps at the audit rather
than ad hoc picks, and moved Computer Science and Decision Maths to the bottom of the doc marked
**⏸ Parked** while the audit is in progress. Updated `CLAUDE.md`'s documentation map with a
`docs/TOOL_AUDIT.md` row. The audit itself has not started — the next session should open
`docs/TOOL_AUDIT.md` and begin with the Number category.

## 2026-08-13 — Migrated SimplifyingRatiosTool onto ToolShell; reclassified the Generators as standalone
Brought `SimplifyingRatiosTool` (~820 lines, hand-rolled shell) onto **ToolShell** (~330 lines) —
the last entry in the old-shell migration backlog. Both sub-tools kept their maths verbatim:
**Numeric Ratios** (2-part at Levels 1–2, 3-part at Level 3, simplified by repeated prime division)
and **Algebraic Ratios** (cancelling a numeric common factor and any shared variable/power across
three escalating levels). Working steps now use `step`/`mStep` with proper KaTeX (the old algebraic
formatter used unicode superscripts, invalid in KaTeX — replaced with `^{n}`). Stays `enabled: false`
pending a go-live decision. Also reclassified the four Generators tools (`TimesTablesGenerator`,
`MultiplicationGenerator`, `NegativeOperationsGenerator`, `FunctionalSkillsGenerator`) in
`organisation.test.ts` from `MIGRATION_BACKLOG` to `STANDALONE_BY_DESIGN` — they batch-produce PDF
worksheets, a different purpose from ToolShell's whiteboard/worked-example/worksheet model, and were
never real migration candidates. The migration backlog is now empty. Updated `CLAUDE.md` and
`docs/PROJECTS.md` to match. Build clean, 304 tests pass (up from 298 — the new tool's `__test`
export is now covered by the generator smoke suite).

## 2026-08-13 — Moved Mixed Strategies into Decision Mathematics
Landing-page tweak: moved `mixed-strategies` (`src/tools/MixedStrategies.tsx` →
`src/tools/Decision/`) out of Probability & Statistics into Decision Mathematics, alongside Network
Sandbox and Minimum Spanning Tree — it's game-theory/zero-sum-game content, which fits the Decision
Maths strand better than classic probability/statistics. Fixed its now-one-level-deeper `../shared`
import to `../../shared`. Probability & Statistics is left defined with an empty tools list — the
landing page already renders a "Coming soon" placeholder for an empty category rather than showing
nothing, so the strand stays available for a real future probability/stats tool. Build clean, 298
tests pass, confirmed visually.

## 2026-08-13 — Moved P-Value Grapher into Interactive Tools
Landing-page tweak: moved `p-value` (`src/tools/TeacherTools/p-value.tsx` → `src/tools/Interactive/`)
out of Teacher Tools into the Interactive Tools category, alongside Algebra Tiles, Parallel Lines
Explorer and Grapher Lab — matching folder-per-category convention. Updated
`organisation.test.ts`'s `STANDALONE_BY_DESIGN` list to the new path. Build clean, 298 tests pass,
confirmed visually: the tool now appears under Interactive Tools and no longer under Teacher Tools.

## 2026-08-13 — Published Perimeter
Removed `enabled: false` from the registry entry now that the ToolShell migration (see the entry
above) is verified working — it's live on the landing page. Build clean, 298 tests pass.

## 2026-08-13 — Migrated Perimeter onto ToolShell (following the AnglesInTriangles pattern)
Brought `PerimeterTool` (1,372 lines, hand-rolled shell including a full camera/presenter feature)
onto **ToolShell** (~660 lines) using `AnglesInTriangles` as the template. Both sub-tools —
**Polygons** (regular shapes at Level 1, irregular tick-marked shapes at Level 2, mixed cm/mm/m
units at Level 3) and **Rectilinear Shapes** (all sides given, then 1–2 derived missing sides, then
mixed units) — keep their maths and the sophisticated pill-label placement algorithm (tries multiple
candidate positions per label, scores by mutual clearance) verbatim. Dropped the camera/presenter
feature entirely: it was generic whiteboard chrome unrelated to perimeter questions specifically,
and the shell's own fullscreen already covers "make the diagram big for the class." Swapped the
hand-rolled SVG-capture print/PDF generator for the shared `handleDiagramPrint`, which required
computing a real `_aspect` per rectilinear question (its bounding box isn't square, unlike polygons)
— extracted into a `rectSmallWH()` helper shared between generation-time sizing and the actual
worksheet-cell renderer so the two can never drift apart.

**Fixed a real bug found during the port**: the Level 3 "Mixed units" checkbox in the original tool
was wired into `TOOL_CONFIG` but never actually read by the generator — `mixUnits` was hardcoded to
`level === "level3"`, so toggling the checkbox off had no effect. Verified with a 40-sample direct
generation check: before the fix this would have shown 40/40 mixed regardless of the toggle; after,
it's 40/40 mixed when on and 0/40 when off, as the label promises.

**A deliberate simplification**: the original showed a per-shape prompt ("Find the perimeter of the
rhombus") plus a separate "Give your answer in cm" banner for mixed-unit questions. The shape-name
prompt now lives in the tool's own whiteboard/worked-example title (via a custom `questionRenderer`,
shown only there — worksheet cells are diagram-only, matching the `AnglesInTriangles` convention);
the separate mixed-units banner was dropped since the edge labels already show the mixed units
directly.

Verified with `npm run build` (0 errors), `npm test` (298 pass, 6 new), and a thorough headless
Playwright pass: both sub-tools × all three levels in whiteboard (blank and revealed — including
confirming the shell provides no automatic answer overlay in whiteboard mode, unlike worked example,
so the tool renders its own inline "= answer"), worked example (steps + the shell's own answer card,
confirmed to appear automatically without any tool-side code), standard and differentiated worksheets,
and the print/PDF output for both sub-tools (diagrams correctly proportioned, answers page matching)
— zero console errors throughout. Left `enabled: false` — not asked to publish it live this session.
Removed from `organisation.test.ts`'s `MIGRATION_BACKLOG` and `CLAUDE.md`/`docs/PROJECTS.md`'s
tracking lists; also caught and fixed two unrelated stale/incorrect lines in `docs/PROJECTS.md`
while auditing this section (a leftover "migrate FractionToRatio" bullet from a July migration, and
"the Generators" wrongly listed as never-migrate when four of them are in the CI-enforced backlog).

## 2026-08-13 — Published Adding & Subtracting Integers
Removed `enabled: false` from the registry entry now that the ToolShell migration (see the entry
above) is verified working — it's live on the landing page. Build clean, 292 tests pass.

## 2026-08-13 — Migrated Adding & Subtracting Integers onto ToolShell (number line as a full-width diagram)
Brought `IntegerAddSub` (472 lines, hand-rolled shell) onto **ToolShell** (~330 lines). The tool's
number line got the same treatment `PowersOfTen`'s place-value grid got: rendered entirely through
a custom `questionRenderer`, with the working panel starting collapsed
(`defaults.collapseWorkingByDefault`) so the question box goes full-width and `ScaleToFit` grows the
diagram into the reclaimed space. Two number-line states — a blank scaffold (line + arrowheads, no
ticks) and a worked diagram (ticks, start/end points, jump arrow) — switch on `showAnswer`, reused
identically across whiteboard and worked-example mode via one component (matching the grid's
blank/filled split). This is a behaviour improvement over the original, which only ever showed a
static blank line in whiteboard mode and never filled it in — Show Answer now fills the whiteboard's
number line too, consistent with how the place-value grid already behaves. SVGs use `viewBox` +
`width:100%` per the diagram-tool convention rather than the original's fixed pixel dimensions.
Level 1 keeps its Mixed/Addition/Subtraction dropdown via `difficultySettings` (Levels 2–3 have a
fixed operation, so the dropdown is `null` there — "add a negative" / "subtract a negative"
respectively). Worksheet stays text-only, so the default print handler needs no custom code. Left
`enabled: false` (dev-gated) — not asked to publish it live this session. Verified with `npm run
build` (0 errors), `npm test` (292 pass, 3 new), and a headless Playwright pass across all three
modes and all three levels: blank/filled whiteboard, worked example with working steps, worksheet
text grid, and the Level 2/3 dropdown correctly disappearing — zero console errors throughout.
Removed from `organisation.test.ts`'s `MIGRATION_BACKLOG` and `CLAUDE.md`/`docs/PROJECTS.md`'s
dev-gated-leftovers lists.

## 2026-08-13 — Retired the Unpublished/ archive folder
Deleted `Unpublished/GraphGenerator.tsx` (its planar-network-generation algorithm was harvested into
`src/shared/decision/randomNetwork.ts` this session — see the entry above) and
`Unpublished/ParallelLinesInteractive.tsx` (now near-byte-identical to the published
`src/tools/Interactive/ParallelLinesInteractive.tsx`, differing only by the two intentional fixes
made when it was published). With both gone the folder held nothing but its own `README.md`, so
removed the folder entirely along with its references: the `Unpublished/` section in `CLAUDE.md`,
the tree entries and `tsconfig.json` callout in `README.md`, and the now-unneeded
`"exclude": ["Unpublished"]` in `tsconfig.json`. Historical mentions in this file and in
`docs/architecture/DECISION_SHELL_PLAN.md` are left as-is — they're an accurate record of where
things came from, not live pointers. Build clean, 289 tests pass (unaffected — the folder was never
part of the app).

## 2026-08-13 — Harvested a procedural network generator for Decision Maths
Added `src/shared/decision/randomNetwork.ts`'s `generateRandomNetwork()`: given only a node count,
builds a connected, provably crossing-free weighted `Network` — the procedural counterpart to
`sampleTemplate()`'s hand-authored `NetworkTemplate` sampling, and the "free bypass" building block
`DECISION_SHELL_PLAN.md` had flagged but not built. Harvested from `Unpublished/GraphGenerator.tsx`
(an old, never-registered v1 draft) after recognising its planar-layout algorithm was directly
relevant to the Decision Maths work: it built a spanning tree plus extra edges while checking for
straight-line crossings, and had a "Route inspection" toggle that manipulates the graph until exactly
2 or 4 nodes have odd degree — precisely the solvability condition for the Route Inspection/Chinese
Postman problem, a Decision Maths topic still unbuilt.

The port was not verbatim. The draft's own crossing-avoidance had two real gaps, both caught by a
new independent CI check (`src/tests/decisionRandomNetwork.test.ts`, which re-implements the crossing
test rather than trusting the generator's own logic, mirroring `validate.ts`'s independent-brute-force
pattern): (1) its greedy "nearest reachable, skip if crossing" spanning-tree walk could paint itself
into a corner at higher node counts and fell back to adding a crossing edge anyway — fixed by building
the true Euclidean MST instead, which is geometrically guaranteed non-crossing by construction, so the
fallback (and its crossing risk) is no longer needed at all; (2) the degree-1-leaf patch and the
route-inspection nudge both called `addEdge` directly, bypassing the crossing check entirely — fixed
so every added edge everywhere goes through the same check, falling back to leaving a node unpatched
rather than accepting a crossing. Both gaps were silently invisible in the original draft because its
(also-ported-and-then-deliberately-dropped) curve-routing step visually papered over any crossing
afterward — `NetworkView` only renders straight edges, so this port keeps output restricted to what's
already renderable rather than extending the shell. The route-inspection nudge is now honestly
documented as best-effort (an empirical sweep showed it lands on 2-or-4 odd nodes the large majority
of the time but not always) rather than asserting a guarantee it can't keep under the no-crossing
constraint. Exported from the `src/shared/decision` barrel; not yet wired into any tool. Verified with
`npm run build` (0 errors) and `npm test` (289 pass, 9 new). `docs/architecture/DECISION_SHELL_PLAN.md`
and `docs/PROJECTS.md` updated with the finding and the module.

## 2026-08-13 — New "Interactive Tools" category; Parallel Lines Explorer published, GrapherLab and AlgebraTiles regrouped
Introduced a new landing-page category, **Interactive Tools** (`src/tools/Interactive/`, lime →
green gradient), for freeform manipulative/canvas tools as distinct from the worksheet-generator
tools on `ToolShell`. Moved `AlgebraTiles.tsx` and `GrapherLab.tsx` out of `TeacherTools/` into the
new folder (import paths, `organisation.test.ts`'s `STANDALONE_BY_DESIGN` list, and both `CLAUDE.md`
and `docs/PROJECTS.md`'s tool-location references updated to match); `GrapherLab` keeps its existing
`enabled: false` dev-gate — it's a test bench, not a finished classroom tool. Also published a new
**Parallel Lines Explorer** (`/parallel-lines-explorer`, live) into the category, built from the
archived `Unpublished/ParallelLinesInteractive.tsx` v1 draft: a full-screen, pannable canvas where a
transversal (drag the blue handle) crosses one or two parallel lines plus an optional non-parallel
line, with click-to-reveal angle sectors (A–H, plus M–P for the non-parallel line), a settings menu
(line visibility, angle-of-view presets, offset, handle visibility), recentre/reset/fullscreen
controls, and its own info modal — all pre-existing, working code. The only functional fix needed
was a missing Home-button handler (the draft's button had no `onClick` at all); the default export
was renamed to `App` to match the repo's convention. Left `Unpublished/ParallelLinesInteractive.tsx`
in place — a genuinely new build from it, not a migration, so it stays available as reference
material per `CLAUDE.md`'s rule for that folder. Verified with `npm run build` (0 errors), `npm test`
(280 pass, unchanged — the tool is standalone by design, no `__test` needed), and a headless
Playwright pass: both new routes load with zero console/page errors, and screenshots confirm the
canvas renders correctly (parallel lines, transversal, colour-coded angle sectors) and the landing
page shows the new category with Algebra Tiles and Parallel Lines Explorer live, Grapher Lab
correctly DEV-badged.

## 2026-08-13 — New Percentages tool, built from the archived v1 draft
Brought `Unpublished/Percentages.tsx` (an old, never-registered v1 draft) onto the shared
**ToolShell** as a fresh v2.3 build (`src/tools/Number/Percentages.tsx`, ~370 lines) and published
it live (no `enabled: false`). Three sub-tools: **Finding Percentages** (Multiplier vs. Chunking
methods, with a decimal-amounts toggle; Chunking builds the percentage from 10%/1% and, at Level 1,
50%/25% shortcuts), **Percentage Change** (increase/decrease/mixed direction, an optional "show
multiplier working" step, and a Level 3 compound two-step change), and **Reverse Percentages**
(sales/VAT/general contexts, an optional unitary-method working path, Level 3 large increases or
very small percentage changes). All maths was rewritten cleanly against the v2.3 conventions rather
than ported verbatim — money values are rounded to the nearest penny at *every* step via a dedicated
`money()` helper (a spot-check first caught the old approach compounding rounding error across a
chained calculation, e.g. a two-step change showing `£103.0302`; fixed by re-rounding after each
multiplication rather than only stripping floating-point noise). Verified with `npm run build`
(0 errors), `npm test` (280 pass, 9 new), and an ad-hoc 7,200-question generation sweep checking for
NaN/undefined/Infinity across every tool × level × QO combination, plus manual spot-checks of the
chunking, compound-change and unitary-method working. `Unpublished/Percentages.tsx` is left in place
per `CLAUDE.md`'s "leave alone" rule for that folder — this is a new build inspired by it, not a
migration of it.

## 2026-08-13 — Housekeeping: undev-gated Powers of Ten; deleted superseded Unpublished/ archives
`PowersOfTen` finished its ToolShell migration on 2026-07-26 but the registry's `enabled: false`
flag was never flipped afterward, leaving a done tool hidden behind Developing-tools mode — removed
it, so the tool is now publicly listed. Also deleted three files from `Unpublished/`
(`ExpandingBrackets.tsx`, `FractionMultDiv.tsx`, `FractionsAddSub.tsx`) — old v1.x drafts fully
superseded by their live v2.3 counterparts (`Algebra/ExpandingBrackets`, `Number/FractionMultDiv`,
`Number/FractionsAddSub`, all confirmed rendering `<ToolShell/>`). Left `Unpublished/Perimeter.tsx`
in place — it's byte-identical to `src/tools/Geometry/PerimeterTool.tsx`, which is itself still
on the old shell and dev-gated (`enabled: false`, BETA), so there is no newer version to treat it
as superseded by. Build clean (0 TS errors), 271 tests pass.

## 2026-07-29 — Docs reorganised into a `docs/` folder
Housekeeping: moved the loose organisational docs off the repo root into a
structured `docs/` tree, leaving only `CLAUDE.md` (auto-loaded, must stay at
root) and `README.md` beside the app config. New layout: `docs/PROJECTS.md`,
`docs/PATCH_NOTES.md`, `docs/GLOSSARY.md`; `docs/architecture/` (`CS_SHELL_PLAN.md`,
`DECISION_SHELL_PLAN.md`); `docs/design/` (`DESIGN_STUDIO.md`, `TOOL_DESIGNER_PROMPT.md`)
with the four fill-in templates under `docs/design/templates/`. All cross-references
(the `CLAUDE.md` documentation map, doc-to-doc pointers, `scripts/new-tool.mjs`
guidance, the `specs/**` READMEs, and `// See …` source comments) were updated to
the new repo-relative paths; the historical entries below keep their original
bare filenames. No code or behaviour changed — `npm run build` and `npm test`
clean. Also removed a stray duplicate `README.md` row from the doc map.

## 2026-07-28 — Decision Maths increment 1: the MST thin vertical slice
Built the first end-to-end path of the `DecisionShell` (Layers 1+2+one tool), per
`DECISION_SHELL_PLAN.md`. **Layer 1 — representation library** (`src/shared/decision/`): promoted the
Network Sandbox spike into two **pure renderers** — `NetworkView` (SVG graph, pan/zoom/drag, edges
coloured by a `SolveStep`'s states: idle/considering/tree/rejected; framed by an auto-fitted viewBox)
and `MatrixView` (distance matrix with per-cell highlight/strike) — plus `types.ts` (the authoring
contracts: `NetworkTemplate`, `DecisionProblem`, `SolveStep`, `DecisionShellProps`,
`DecisionProblemExport`) and `templating.ts` (`sampleTemplate`: samples each edge weight in its
`[min,max]`, coin-flips optional edges → a concrete, always-connected `Network`). **Layer 2 — thin
`DecisionShell`**: full-canvas navy chrome with **Question** mode (network + prompt) and **Solution**
mode (forward/back stepper over `SolveStep[]`, network + matrix + caption + running total updating in
sync, with a "show all" jump to the terminal state). No print, no sandbox-expand, no Prim yet. **The
tool** — `MinimumSpanningTree` (`enabled:false`): one crossing-free 6-node template (mandatory edges
span every node, two optional extras) + **Kruskal's algorithm** emitting one beat per considered edge
(accept into tree / reject as a cycle, with a running total), one question type, one level. **CI**:
`validate.ts` (`validateProblem` + an independent Prim MST reference) and `src/tests/decision.test.ts`
discover every `__problem`-exporting Decision tool and assert templates sample to real-node networks
with in-range weights, the network is connected, every `SolveStep` references real edges/cells, and
solve()'s total **matches the brute-force MST** — what makes generate-fast safe. Registered under
Decision Mathematics; added to the standalone list in `organisation.test.ts`. Build clean (0 TS
errors); `npm test` **271 pass** (new decision suite). Verified on screen: Question + Solution
mid-walk (green tree edges, a red-dashed rejected edge, matrix cell struck, running total).

## 2026-07-28 — Decision Maths: design session + DECISION_SHELL_PLAN.md
Turned the Network Sandbox spike into an agreed build plan. A design session settled five decisions:
(1) a **new `DecisionShell`** — a purpose-built, network-native question-generator shell parallel to
ToolShell/CSShell; (2) **parameterised templates** for generation — hand-authored crossing-free
network *shapes* with declared degrees of freedom (weight ranges, optional edges), plus an advanced
"free" bypass behind a clarity warning; (3) **stepper + show-all** worked answers (animate edge
highlight/discount + matrix/table in sync); (4) **sandbox = both** — expand-the-generated-network AND
a free-build mode sharing editing primitives with the bypass; (5) **MST thin slice first**. Wrote
**`DECISION_SHELL_PLAN.md`** (mirrors `CS_SHELL_PLAN.md`): a three-layer architecture (representation
library → DecisionShell → independent MST/TSP/CPA tools), the authoring contracts (`NetworkTemplate`,
`DecisionProblem`, `SolveStep`, `DecisionShellProps`), a `validateProblem` CI plan, a seven-step
increment plan (thin MST slice → breadth → sandbox → print → TSP → CPA → onward), and a "▶ Resume
here" kickoff block. Indexed it in the `CLAUDE.md` doc map. Docs-only — no `src/` changes.

## 2026-07-28 — Decision Maths spike: a standalone Network Sandbox (pre-shell exploration)
First step toward supporting **Decision / Discrete Mathematics** (AQA Further Maths: MST —
Prim/Kruskal, Dijkstra, Chinese postman, TSP, critical path analysis, network flows, LP).
Established *why* ToolShell is the wrong home for this family: its whiteboard is a rigid
`480px` working panel + `480px` question box inside `max-w-6xl`, and its question model is a
KaTeX string with a flat `WorkingStep[]` — whereas a decision-maths problem *is* a data
structure (`{nodes, edges}`, activity lists, LP constraints) rendered as a full-canvas diagram
+ matrix + stepped table. The CS strand's `CSShell` is the precedent: a parallel shell, not an
extension of ToolShell. Rather than design that shell up front, shipped a deliberate **spike**:
`src/tools/Decision/NetworkSandbox.tsx` — a standalone, full-screen, pannable/zoomable workspace
(chrome borrowed from `AlgebraTiles`, not the constrained ToolShell pane) that renders a weighted
network well: draggable nodes, edge weight labels, a live distance matrix, directed/undirected
and grid toggles, two sample networks. New **Decision Mathematics** category in `src/registry.ts`
(rose theme in `LandingPage.tsx`), tool `enabled: false` (dev-only) while we explore details
before committing to a `DecisionShell`. Added to `STANDALONE_BY_DESIGN` in `organisation.test.ts`.
Build clean, 268 tests pass, 0 page errors, rendering eyeballed.

## 2026-07-26 — Design Studio: a repo-linked brief pipeline for all four build types
Extended the maths-only spec pipeline (`TOOL_DESIGNER_PROMPT.md` + `TOOL_SPEC_TEMPLATE.md`
+ `specs/`) into a **single entry point for every kind of build** — designed *with Claude in
a normal chat, repo linked*, then handed to Claude Code. New **`DESIGN_STUDIO.md`** is the one
doc you point a chat at: it reads `GLOSSARY.md` + the relevant `CLAUDE.md` section + an
existing example, asks *"maths tool / CS tool / technique / Teach deck?"*, then routes to the
matching fill-in template. Added three new templates alongside the existing maths one —
**`CS_TOPIC_SPEC_TEMPLATE.md`** (J277 revision topics, mirroring the `CSTopic` shape: spec
tags, glossary, Learn beats, cards, cloze, exam mark schemes, synoptic, myths — the fact-based
sweet spot with almost no generation logic), **`TECHNIQUE_SPEC_TEMPLATE.md`** (a reusable
working-step move at brief/standard/full grains, with step titles + fragments), and
**`TEACH_DECK_SPEC_TEMPLATE.md`** (misconception-driven slides, I-do→We-do→You-do on one
coherent example, scenes from the existing families). Each template is self-teaching (inline
authoring guidance) and stays about **pedagogy/content, not code**. Completed briefs land in
typed homes — maths tools at `specs/`, and new `specs/cs/`, `specs/techniques/`, `specs/decks/`
subfolders (each with a README). Wired the new pipeline into `CLAUDE.md` (doc map +
"Implementing from a spec"), `README.md`, `specs/README.md`, and added a repo-linked note to
`TOOL_DESIGNER_PROMPT.md`. Docs-only — no `src/` changes; build and tests unaffected.

## 2026-07-26 — Migrated Powers of 10 onto ToolShell (full-width place value grid)
Brought `PowersOfTen` (the "Multiplying & Dividing by 10ⁿ" tool, ~1,240 lines) onto the
shared **`ToolShell`** (~400 lines). The tool's exceptional requirement is its **place value
grid** — a wide table (7 columns at L1, 13 at L2/L3) that must span the whole container, not
the shell's usual question/working split. The workaround needs **no shell changes**: the
entire grid renders through a custom **`questionRenderer`**, and the tool starts with the
working panel collapsed via `defaults.collapseWorkingByDefault`, so the question box goes
full-width and `ScaleToFit` grows the grid into the reclaimed space (the panel stays
recoverable via the shell's re-open button). Two grid states are preserved deliberately:
the **whiteboard** shows a blank scaffold to model on (Show Answer fills it in and reveals
`= answer`), the **worked example** shows the filled grid plus the shell's verbal working
steps + answer card, and the **worksheet** is text-only (`v × 10ⁿ = answer`) so the default
text print handler works with no custom code. Level 3's extreme numbers keep the original
"all digits move N places" statement instead of a grid. The `10ⁿ` toggle became a pure
`reformatQuestion` display switch (raw params stored on the question, display rebuilt on
toggle — no regeneration); display strings use KaTeX with `{,}` thousands separators and
`10^{n}`. All maths generators are preserved verbatim. Added the `__test` export and moved
the tool out of the migration backlog in `organisation.test.ts`, `CLAUDE.md` and
`DEV_ROADMAP.md`. Build clean, 264 tests pass.

## 2026-07-26 — Migrated Fractions & Ratios onto ToolShell
Brought `FractionToRatio` (the "Fractions & Ratios" tool, ~1,330 lines) onto the shared
**`ToolShell`** (~470 lines). All three sub-tools and their maths generators are preserved
verbatim: **Forming Ratios** (counts / total-with-remainder / constraint-based, with the
3-Way and Simplest Form toggles), **Fraction to Ratio** (complementary part / three-part
remainder / quantity-based, with the Different Denominators toggle and the Given
dropdown), and **Ratio to Fraction** (part-to-whole / composite / part-to-part, with the
Simplest Form toggle and Target dropdown). The bespoke shell was deleted in favour of
ToolShell's built-ins: the hand-rolled `handlePrint`, difficulty toggle, standard/
differentiated QO popovers, info modal, presenter/fullscreen chrome and the local KaTeX
loader all go away. Local `step`/`mStep`/`tStep`/`fracStr`/`mStr`/`randInt`/`pick` now come
from `../../shared`; the ratio-specific helpers (`frac`, `rLatex`, `rStr`, simplification,
common-denominator) stay local. Per-level Question Options map onto `difficultySettings`
dropdowns/variables, so whiteboard / worked-example / worksheet / differentiated /
share-links / PDF export all come for free. Added the `__test` export (smoke suite now
covers all three sub-tools × three levels) and moved the tool out of the migration backlog
in `organisation.test.ts` and `CLAUDE.md`. Build clean, 182 tests pass.

## 2026-07-26 — Migrated Angles in a Triangle onto ToolShell
Brought the largest remaining **live** old-shell tool (`AnglesInTriangles`, ~1,335
lines) onto the shared **`ToolShell`** (~625 lines) — the first **SVG/diagram** tool
migrated onto the shared shell's `handleDiagramPrint` path (after `AnglesInQuadrilaterals`
set the pattern). All the geometry and question generation is preserved verbatim:
Level 1 basic triangle (with the No/Sometimes/Always-90° dropdown and the below-20°
toggle), Level 2 isosceles (give apex / give base / mixed), and Level 3 extended
angles (split-triangle and exterior-angle variants). The bespoke shell — the
hand-rolled `handlePrint` with its fixed 3×5 grid, the difficulty toggle, dropdown/
variable popovers, info modal and fullscreen chrome (~745 lines) — was deleted in
favour of ToolShell's built-ins. The `TriangleDiagram` SVG now uses a **square viewBox**
(so it never overflows its panel and prints at aspect 1 with no per-question `_aspect`)
and a **reveal answer-band** baked into the SVG like the quadrilaterals tool. Per-level
Question Options map onto `difficultySettings` dropdowns/variables, so whiteboard /
worked-example / worksheet / differentiated / share-links / variable-column diagram
printing all come for free. Working steps use `tStep` (a faithful port of the old
plain-text lines; techniques wiring — `applyAngleFact` — is a later pass). Added the
`__test` export (smoke suite now covers all three levels) and moved the tool out of the
migration backlog in `organisation.test.ts`, `CLAUDE.md` and `DEV_ROADMAP.md`. Build
clean, 173 tests pass.

## 2026-07-26 — Migrated Fractions of Amounts onto ToolShell
Took the largest remaining old-shell **question generator** (`FractionsOfAmounts`,
~1,850 lines) and brought it onto the shared **`ToolShell`** (~600 lines). All the
maths generation — Finding Amounts (L1 unit / L2 non-unit / L3 fractional answers),
the worded contexts (L1 direct/indirect, L2 unit-conversion, L3 two-step keep/give
with money or items, optional "answer as fraction of original"), and Expressing as
a Fraction (L1 simplify-by-HCF, L2 direct/indirect contexts, L3 one/two-step) — is
preserved verbatim; only the return shape and shell changed. Questions now use the
shared `WordedQuestion` kind, working steps use `mStep`/`tStep` with **live-modelling
fragments** (each `= …` link reveals separately), and all the bespoke UI, popovers,
and hand-rolled PDF `handlePrint` were deleted in favour of ToolShell's built-ins.
Per-level Question Options (denominator range, question type, conversion hint, steps,
etc.) are re-expressed as ToolShell `difficultySettings` dropdowns/variables, so
whiteboard/worked-example/worksheet/differentiated/share-links all come for free.
Money is kept KaTeX-safe with `\pounds`. Dropped the non-functional Level-3 "Answer
Format" control (it never affected generation). Added the `__test` export (smoke
suite now covers all 9 sub-tool×level cases, 40 unique questions each) and moved the
tool out of the migration backlog in `organisation.test.ts`, `CLAUDE.md` and
`DEV_ROADMAP.md`. Build clean, 249 tests pass.

## 2026-07-25 — Repo consolidation + organisation audit
Housekeeping session, no tool code. **Consolidated three parallel branches into
`main`**: merged the CS/CPU work (PR #38) and this changelog (PR #39), and cleared
a stale already-merged branch — `main` is now the single source of truth again.
Ran an **organisation audit** and actioned four pickup-friction fixes: added a
**documentation map** to `CLAUDE.md` and `README.md` (one table saying which doc to
read when); **removed a contradiction** where a CS tool sat in the Maths migration
backlog (CS tools target `CSShell`, never `ToolShell`); made `npm run new-tool`
**refuse `--category ComputerScience`** (it only scaffolds the Maths `ToolShell`, so
CS tools were being pointed at the wrong shell); and **refreshed the README** to name
the two-subject architecture and link the doc set. Then added the **CI drift-check**
(`src/tests/organisation.test.ts`) — it reads every tool's source and fails the build
if a tool is un-categorised, if a migrated tool is left in the backlog, if a ToolShell
tool lacks `__test`, or if a tool file isn't registered; it's now the authoritative
shell-status list, with `CLAUDE.md` pointing to it. Considered and **dropped** the
`CLAUDE.md`/`SHARED_API.md` split — it trades away the single-file "no source needed"
guarantee for a shorter read, not worth it yet.

## 2026-07-21 → 07-23 — PDF generators: Functional Skills + Times Tables
**Functional Skills generator** got a full redesign: a two-pane browse/build
layout with tap-to-add skill tiles, a single worksheet editor, per-skill count
arrows, an anchored options pop-over, and instructions moved into a burger menu
with settings in a pop-out. Added **fraction arithmetic** (add, subtract,
multiply, divide) to the skill set. Tiles now stay two-wide at all widths.
**Times Tables generator** was realigned to the same house style: question
options moved into a popover, a centred flowing setup layout, and new fact
controls — exclude ×2/÷2, ×5/÷5, ×10/÷10 (grouped under one header),
suppress-commutative (n/n=1), and a "suppress n=1" option. Fixed the question
distribution over-representing squares and ×1 facts, and de-duplicated
missing-factor / division questions with a refreshable full preview.

## 2026-07-18 → 07-19 — SmartGrapher, techniques engine, and the reference docs
Big infrastructure session. Added **SmartGrapher**, an embeddable canvas graphing
component: multiple curves on one graph with auto-intersections, extended curve
families (trig, exp, log, reciprocal, modulus), linear-programming feasible
regions, a regions/guides shading layer, and Cluster A recipes (sketch, solve,
transform, tangent). It now renders the **Mixed Strategies** Level 3 graph and is
integrated into **NonLinearSimEq** (migrated to v2.3 in the same session).
Added the **techniques engine** (`src/shared/techniques/`) for reusable
pedagogical working steps — grain-aware (brief / standard / full) — with a
dev-only **Technique Library** viewer at `/techniques` and a **Grapher Lab** test
bench at `/grapher`. Created the reference docs **`DEV_ROADMAP.md`** and
**`GLOSSARY.md`**, plus a technique audit and a skills-to-develop backlog.

## 2026-07-16 — Mixed Strategies (game theory)
New **Mixed Strategies** tool (zero-sum game theory): find optimal mixed
strategies and the value of a game from its payoff matrix. Labelled payoff table,
KaTeX labels, the answer replaces the matrix on the whiteboard, and it's
dev-gated (`enabled: false`) for now.

## 2026-07-13 — Binomial hypothesis testing + Recipes migration
Added **critical regions** to the binomial hypothesis-test / p-value tool, made
p-value and critical region a mode toggle (one at a time), and reworked the
controls into a full-width panel with sliders and even option groups (max trials
raised to 200). Migrated **RecipesTool** to the v2.3 ToolShell.

## 2026-07-09 — Best Buys migration + slide/scaling polish
Migrated **Best Buys** to the shared ToolShell. Polished the teaching-slide
system: the skill overlay goes near-fullscreen, slides auto-scale to fit the card
(no scrollbars at any size), and `ScaleToFit` now shrinks below 1× when content
would clip (fixing fullscreen split view). Codified the "size for readability,
never to fill" slide principle in `CLAUDE.md`.

## 2026-07-05 → 07-08 — Skill library, Teach decks, worked-example fragments
The pedagogy engine landed. Added the **skill library** (`src/shared/skills/`,
browsable at `/skills`), **`[[skill-id|term]]` skill-link drill-downs**, and
**worked-example fragment reveal** (one board-mark per press) — all dev-gated.
Added the **Teach** slide-deck mode (`teachingSlides`) with a category menu,
phase badges (I-do/We-do/You-do), and animated scenes; reworked the **LCM** skill
as a beat-by-beat walkthrough and added **LCM from prime factors** with the core
**prime-factor tile** representation and Venn strike-off. Fixed fixed-height slide
cards so they don't jump. Migrated the **fraction** tools (add/subtract,
multiply/divide) to v2.3 and added the **Bearings** tool.

## 2026-06-28 — Developing-tools mode + worksheet builder + migrations
Added the global **Developing-tools mode** (homepage toggle, `src/devMode.ts`)
that gates all in-progress work. Worksheet builder gained a classic two-pane
layout for general use with sections kept dev-only, a builder column picker, and
tidier action rows. Migrated **Iteration** and **Simultaneous Equations
(Elimination)** to v2.3, fixed jittery zoom on the collapsible panel, and added
several **Algebra Tiles** manipulation improvements (Extract, overlap-safe
duplication).

## 2026-06-13 → 06-18 — Foundations: shell, worksheet builder, first tools
The v2.3 groundwork. Added the collapsible **working/visualiser panel** and
`hideFontControls`, the **WorksheetBuilder** for mixing sub-tools, and the
`Unpublished/` exclusion from build/test/deploy. Built **Angles in
Quadrilaterals** (three levels, SVG diagrams, exterior-angle overlays),
**Collecting Like Terms**, and refined **Multiple Variables**. Fixed a run of
SVG scaling / worksheet-cell clipping issues and made the font-size chevrons work
in custom renderers.

---

# Computer Science

## 2026-10-10 — File Sizes (`/file-sizes`, dev-gated) and the shared unit ladder
- New ToolShell tool, brief `specs/file-sizes.md`: **Text**, **Images**, **Sound** — number of things × bits per thing, then walk the ladder (bits ÷ 8 → bytes ÷ 1000 → KB → MB). Three levels each (L1 bits only; L2 the exam shape; L3 colours that are not powers of two, several images, kHz / minutes to convert, comparing, reverse questions), Question Options per level (task pool weighted for the Smart Progressor, characters / resolution / answer units), exact BigInt arithmetic, answers in KB / MB always whole or one decimal.
- New shared representation: **file-size recipe** (`shared/fileSizeRecipe.ts`, `components/FileSizeRecipe.tsx`) — three or four boxes joined by × and =, filling left to right, with the unit ladder lighting each hop, and a doubling chain (1 bit → 2 colours …) for colour questions. Whiteboard: the empty recipe and ladder in the working box, filled by Show Answer. Worked Example: one picture beside the working (keep-working flavour, so each line still shows its label and maths).
- **Extraction:** the ladder and the tenths helpers moved out of Data Units into `shared/dataUnits.ts` and `components/UnitLadder.tsx` (Data Units imports them back; its tests pass unchanged). `UnitLadder` gained a stepwise `reach` and `maxUnit`.
- Deviations from the brief: Worked Example uses the keep-working split (label + maths per step) rather than caption-only, so the maths stays on screen; names in "X saves a …" framings are not used; a reverse question whose size is given in bits (a sample row) has one step before the answer; question text starts one whiteboard font size smaller (`displayFontSize: 1`) because the questions are sentences.

## 2026-10-04 — Binary Operations on the shared place value table (stage 3 of 3)
- Binary Addition worked examples: one place value table (128 … 1, nibble rule) walks the sum a column at a time — the current column highlighted, each carry written above the column it lands in, the result row filling in — with captions in the same wording as Binary Counting ("1 + 1 = 2, which is 10 in binary: write the 0 and carry the 1…"). A run of all-zero columns on the left is one step. The register check ends on a "Carry of 1 lost — overflow" banner when the sum exceeds 255. Three-number sums are two tables (add the first two, then the third).
- Binary Shifts worked examples: the register plus spare columns on the side the bits leave from; row 1 the number (the bits about to be lost marked red), row 2 the result with the vacated cells as blue placeholder zeros and the lost bits in red outside the register. Level 2 adds the denary conversions (place-value sums) and the ×/÷ effect, with overflow / underflow explained.
- Shared table: new `lost` tone (red) for bits that leave the register. The duplicated KaTeX place-value grid is gone from the Binary tools; the green A line carries each answer (own "Answer:" steps and `hideAnswerStep` removed). Questions, levels, options and worksheets unchanged. Build clean, 426 tests pass. This completes the Binary place-value extension (Counting sandbox → Number Bases → Binary Operations).

## 2026-10-04 — Number Bases moved onto the shared place value table (stage 2 of 3)
- Number Bases' worked examples now use the shared place value table (`pvStep` snapshots with the base-aware columns: 128 … 1 for binary, 16 and 1 for hex, a heavier rule per nibble) instead of hand-built KaTeX grids — one table updates in place beside short plain-text captions (`stepRenderer` / `stepVisualRenderer`, as in Decimal Add/Sub). All six directions covered; the green A line now carries the answer (its own "Answer:" step and `hideAnswerStep` removed).
- Questions, levels, options and worksheets unchanged. Build clean, 426 tests pass. Stage 3 (Binary Operations: shifts and addition) still to do.

## 2026-10-04 — Data Units tool; Binary Counting controls tidied
- New ToolShell tool `/data-units` (`src/tools/Binary/DataUnits.tsx`, dev-gated): convert between bits, nibbles, bytes, KB, MB, GB, TB, PB on the OCR ×1000 scale, with ×1024 in brackets. Level = length of the walk along the scale (1 step / 2 steps / 3–5). Sub-tools: **Bytes & Above** (Direction, whole/decimal, wording pools) and **Bits & Nibbles** (×4 / ×2 hops, scenario wording). Whiteboard shows the scale as a ladder in the working box (start filled, target outlined, path lit on Show Answer). Exact BigInt maths. Brief: `specs/data-units.md`; test `src/tests/dataUnits.test.ts`.
- Data Units scale: centred in the working box; new QO switch "Scale: only the relevant units" shows just the start-to-target units, larger.
- Binary Counting: options menu moved out of the burger into the toolbar (an Options button); every toolbar button now shares one 44px size/style.

## 2026-10-04 — Binary Counting sandbox + base-aware place value table (stage 1 of 3)
- New standalone sandbox `/binary-counting` (`src/tools/Binary/BinaryCounting.tsx`, dev-gated): denary, binary and optional hex place value tables side by side, 1–8 bits, step / play counting, readout of the current number's place-value sum and how many bits flip.
- "Add a bit" builds the n-bit table from the (n−1)-bit one: the first half appears with a 0 in front, then "Copy it again with a 1 in front" reveals the second half (rule between halves, new bit tinted). Past 4 bits the table pages 16 rows at a time — the last four bits repeat on every page — instead of listing 256.
- Shared place value table now handles other bases: `pvBaseColumnSet(2|16, digits)` / `pvBaseCells` (headings are place values 128…1 / 16, 1; "Powers" gives 2⁷…2⁰), `groupEvery` (heavier rule per nibble), and a `current` row tone.
- Default view is an **odometer** — one big row per base that counts up in place, the digits that just turned over tinted blue — with the full list of rows as a second view ("Full list").
- **One press = one whole count** (no staged reveal). The odometers (denary · binary · optional hex) sit side by side; the whole carry chain shows at once — a carry mark above each column that received one, turned-over digits tinted — with one card listing each column ("2s: 1 + 1 = 2 (10 in binary) → write 0, carry 1"). At all ones the next press shows **overflow** (red) and wraps to 0.
- Cleaner controls: a bits stepper, count controls (reset / back / auto-play / big →) and an Odometer | List switch in one toolbar; everything else (hex, power headings, highlight, explanations, slower play) lives in the header menu. An earlier beat-by-beat "step 1 of 4" version was dropped as confusing.
- New shared model `src/shared/carry.ts` (`rippleIncrement(n, base, width)` — beats for any of base 2/10/16) so Number Bases / Binary Operations can narrate carries and overflow the same way.
- Brief: `specs/cs/binary-counting.md`. Stages 2–3 (move Number Bases, then Binary Operations shifts/addition onto the shared table) still to do.
- Build clean, 406 tests pass (new `placeValueBases.test.ts`).

> The CS strand is deliberately tracked apart from Maths: it's a different
> subject with its own pedagogy (knowledge/recall, not question generation), its
> own tools, and its own shell (`CSShell`, not `ToolShell`). It's younger than the
> Maths side — expect it to grow fast.

## 2026-09-27 — Binary Shifts phrased as ×/÷; base subscripts across Binary Operations & Number Bases
- **Binary Shifts** (`src/tools/Binary/BinaryAddition.tsx`) no longer phrases the question as "Shift
  $X$ n places to the left/right" — it's now the multiplication/division a shift performs, e.g.
  $00001101_2 \times 1000_2$ for a left shift of 3. New **Notation** multiSelect pool (peers, no
  weight): **Binary** shows both operands in binary (default); **Denary** shows them in denary
  instead (e.g. $13_{10} \times 8_{10}$) and asks for the binary working — leave both on to mix.
  Added `instruction: "Calculate:"` to the sub-tool.
- **Base subscripts** added throughout Binary Shifts and Number Bases (every sub-tool: Denary ↔
  Binary, Denary ↔ Hex, Binary ↔ Hex) — every value now carries a subscript showing its base
  (`_2` binary, `_{10}` denary, `_{16}` hex, the last kept upright via `\mathrm{}`) so the same
  digits (e.g. "10") can never be misread as the wrong base. **Binary Addition is the deliberate
  exception** — its 8-bit strings never appear alongside a denary value in the same expression, so
  it keeps its existing plain notation. Updated `src/tests/binaryTools.test.ts`'s Binary Shifts
  parser for the new phrasing/notation and `INFO_SECTIONS` copy for both tools.

## 2026-09-25 — Per-sub-tool levels; Binary Shifts; Number Bases tool
- **`ToolEntry.levels`** (`src/shared/types.ts`, `ToolShell.tsx`, `DifficultyToggle`,
  `WorksheetBuilder`, `generators.test.ts`): a sub-tool can declare the levels it actually has
  (e.g. `["level1", "level2"]`). Unlisted levels are hidden everywhere (not "coming soon"); one
  level hides the difficulty toggle; switching tab clamps the level; differentiated sheets use the
  available levels (two columns for two levels); stray `level=3` URLs fall back.
- **Binary Shifts** added as a second tab of the existing Binary Addition tool (now "Binary
  Addition & Shifts", same `/binary-addition` path; page title "Binary Arithmetic"). Two levels —
  L1 perform the shift, L2 also state the denary effect. "Bits lost" (Never/Mixed ~30%/Exclusive)
  guarantees whether a 1 is shifted out (overflow on the left, underflow/rounding on the right);
  Direction pool (left/right). Working: 8-bit place-value grid, shifted bits with the lost ones in
  red outside the register, then the ×/÷2ⁿ check.
- **Number Bases** (`/number-bases`, `src/tools/Binary/NumberBases.tsx`, `enabled: false`) — three
  tabs (Denary↔Binary, Denary↔Hex, Binary↔Hex), each covering both directions via a Direction pool,
  two levels (nibble 1–15 / byte 16–255, disjoint). Place-value working (subtract-the-place-value
  chain, 16s-and-remainder, nibble splitting).
- Tool card renamed **"Binary Operations"** (page title too; path unchanged). J277 needs only addition and shifts — no binary subtraction.
- Number Bases taken live (dropped `enabled: false`); Binary Operations was already live.
- Category renamed "Binary Arithmetic" → "Binary & Number Bases". New `src/tests/binaryTools.test.ts`
  checks every answer against an independent conversion/shift and the bits-lost guarantee.
  Headless check: level rows show only Level 1/2 on the new tabs, no console errors.
  `npm run build` clean, `npm test` (374) passing.

## 2026-09-21 — Binary Addition tool (new "Binary Arithmetic" category, on `ToolShell`, not `CSShell`)
Built **`BinaryAddition`** (`/binary-addition`, `src/tools/Binary/BinaryAddition.tsx`, `enabled:
false` pending review) — practice adding 8-bit binary integers and identifying overflow, following
OCR J277 1.2. Registered under a **new category, "Binary Arithmetic"** (`subject: 'Computer
Science'` in `src/registry.ts`), but deliberately built on the **Maths `ToolShell`**, not
`CSShell` — the brief (Levels 1–3, Whiteboard/Worked Example/Worksheet, a graded skill to
*practice*) is exactly ToolShell's shape, not CSShell's Learn/Study/Cards/Quiz/Fill/Exam
knowledge-recall model, so this is a one-off, confirmed-with-the-user exception to "CS tools are
always CSShell" — not a precedent for moving other CS content off CSShell. Content:
- Column method (`0+0=0, 0+1=1, 1+1=0 carry 1, 1+1+1=1 carry 1`) implemented as a constructive
  per-column generator (`genPair`) that *guarantees* each level's carry profile by construction
  (not by rejection sampling): **Level 1** always carries but never has a column receiving both a
  `1` and an incoming carry (`allowDoubleCarry=false`); **Level 2** always contains a genuine
  `1+1+1` column; **Level 3** chains two additions (first two numbers, then the third onto that
  result) with the first addition always containing a double-carry column.
- **Overflow** (a sum needing more than 8 bits) is targeted at ~35% of Level 1/2 questions via an
  explicit `targetOverflow` draw baked into the same constructive loop (natural 3-number sums at
  Level 3 already overflow ~80% of the time, so no forcing needed there) — the stored `answerLatex`
  is always the true (possibly wrong, truncated) 8-bit register value, with `answerSuffix` flagging
  the overflow error, matching how J277 mark schemes phrase it.
- Worked example renders each addition as a KaTeX `array` column table (carry row, both addends,
  a rule, the result — with the escaped 9th bit shown spilling past the register on overflow).
- Verified with a scratch script (not committed) running `generateQuestion` 2000–3000× per level:
  Level 1 never double-carries, Level 2/3 always do, `answerLatex` is always a valid 8-bit string,
  and overflow rates land where designed; hand-checked the arithmetic of several printed samples.
  `npm run build` clean, `npm test` (338 tests) green.
- **Follow-up (same session):** overflow was landing at ~35% (L1/L2) and ~80% (L3 — an unforced
  side effect of summing three random 8-bit numbers, never deliberately targeted). Pulled the rate
  into one `OVERFLOW_RATE` constant (now `0.2`) and gave Level 3 the same explicit control as
  Levels 1/2: the first addition is now always forced to stay within 8 bits
  (`genPair(true, true, true, false)`), and the third number is drawn from whichever half of
  `0–255` does/doesn't push the final sum past 255, so all three levels land at ~20% overflow.
  Re-verified with the same scratch-script method (4000 draws/level): 19.3% / 20.3% / 20.7%, carry
  guarantees unchanged. `npm run build` clean, `npm test` (338 tests) green.
- **Second follow-up (same session):** replaced the fixed `OVERFLOW_RATE` constant with a teacher-
  facing control — first tried as a 2-option weighted `multiSelect` (the compact auto-cycling
  Never/Mixed/Exclusive button `CLAUDE.md`'s Smart Progressor section documents), but that pattern
  hard-codes "Mixed" to ToolShell's own quota-balancing (`buildQuotaOverrides`), which always
  targets a ~50/50 split across active options and has no way to aim at an arbitrary rate — wrong
  once the actual ask ("Mixed should still be ~20%") came in. **Third follow-up, superseding the
  second:** switched to a plain 3-option `dropdown` (`OVERFLOW_DD`: Never/Mixed/Exclusive,
  `defaultValue: "never"`) instead — dropdowns get no automatic per-slot rebalancing in Worksheet
  mode, so `generateQuestion` can decide the probability itself (`MIXED_OVERFLOW_RATE = 0.2`) and
  have it hold in every mode, not just live questions. `_difficultyScore` is now set directly from
  whether the drawn question actually overflowed (`wantOverflow ? 2 : 1`), so Worksheet mode still
  sorts easier-before-harder for free without needing a weighted multiSelect. Verified all three
  states directly (3000 draws/level): Never → 0.0%, Mixed → 19.8–20.9%, Exclusive → 100.0%, at
  every level; re-ran the double-carry guarantee check alongside it (Level 1 still never
  double-carries, Level 2/3 still always do). `npm run build` clean, `npm test` (338 tests) green.
- **Fourth follow-up (same session):** the question display was a full ruled KaTeX `array` (both
  addends stacked, a `\hline` beneath, as if it were an answer box) — feedback was that the working
  (kept as-is) already carries that detail, and the question itself only needs the plain sum.
  Dropped `questionArrayLatex` and set `displayLatex`/`display` to the same plain `"A + B"` (or
  `"A + B + C"` for Level 3) string the other simple `ToolShell` tools use — no array, no rule.
  `npm run build` clean, `npm test` (338 tests) green.
- **Fifth follow-up (same session):** the "too much in the questions" feedback turned out to be
  about the `instruction` line repeated above every question ("Add these 8-bit binary numbers. Give
  your 8-bit answer, and state if an overflow error occurs."), not the vertical-array display fixed
  above — shortened to `"Add:"`, matching the terse style every other tool uses (`"Solve:"`,
  `"Simplify:"`); the fuller explanation already lives in `INFO_SECTIONS`. `npm run build` clean,
  `npm test` (338 tests) green.
- **Sixth follow-up (same session):** restored the vertical stacked-array question display (the
  "Fourth follow-up" removal above) — re-added `questionArrayLatex` and pointed `displayLatex` at
  it again for both the two- and three-number questions; the instruction-text shortening from the
  fifth follow-up stays. `npm run build` clean, `npm test` (338 tests) green.
- **Seventh follow-up:** un-dev-gated — dropped `enabled: false` from the `src/registry.ts` entry,
  so Binary Addition now shows on the landing page like any other live tool.

## 2026-07-27 — CS shell increment 8: 1.1.2 CPU Performance as pure data + the CSTopic validator
The payoff increment — the first sub-topic authored **entirely as data** on the `CSTopic`
contract, no bespoke code. Added **`src/tools/ComputerScience/CpuPerformance.tsx`**: one
`CPU_PERFORMANCE: CSTopic` object + `export const __topic` + `export default () => <CSShell
topic={CPU_PERFORMANCE} />`, registered in `src/registry.ts` (`enabled: false` pending the
user's content review) and added to `CS_TOOLS` in `organisation.test.ts`. Content is the OCR
J277 **1.1.2** spec — clock speed, cache size, number of cores, and combining them: specTags
(the four requirements + bare synoptic partners 1.1.1 / 1.1.3 / 1.2.1), glossary (+beyond-spec
thread/bottleneck/hit/miss/overclocking), **five Learn lessons** — two with their own FOCUSED
`BoxSchematic` (a CPU/cache/RAM diagram contrasting a short cache "hit" hop with a long "miss"
trip out to RAM, and a four-core diagram for parallel work), the overview / clock-speed /
combining lessons deliberately diagram-free — 12 core cards (+2 beyond-spec), 4 cloze, 5 myths,
8 exam questions (mcq → an 8-mark extended response, with mark schemes + `**bold**` model
answers) and 2 synoptic questions spanning 1.1.1 and 1.1.3 with per-tag attribution. Also
landed the deferred **`src/shared/cs/validate.ts`** (`validateTopic`) + **`src/tests/cs-topics.test.ts`**,
which discovers every `__topic`-exporting CS tool and asserts: card/exam/cloze specTags are
declared; MCQ `answerIndex` is in range; each cloze `[slot]` has a matching word; myth/card/
exam/cloze ids are unique; predict beats carry both a question and an answer; every diagram
lesson resolves a schematic (or is deliberately `kind: "text"`); and — the documented caveat —
the **per-tag synoptic markScheme attribution** is declared (not the bare top-level synoptic
`specTags`, which would false-fail the 1.1.1 canary). Added `export const __topic` to
`CpuArchitecture.tsx` too, so the canary is validated the same way. **Small shell enhancement
to support the two-diagram design:** `TopicScenes` gained a `schematics` map and `Lesson` a
`scene` key (a diagram lesson picks a named schematic; omitting it falls back to the topic's
single `schematic`, so the 1.1.1 canary is untouched) plus a `kind: "text"` for deliberately
diagram-free lessons; `LearnMode` resolves per lesson and drops the scene panel entirely for
text lessons. Both new diagrams were rendered and eyeballed before pushing. Green: build clean,
**268 tests pass** (+4). Ticked
increment 8 in `CS_SHELL_PLAN.md` and refreshed the Resume-here block. **Next (increment 9):**
roll the same data-only pattern through 1.1.3 → 1.6, and consider moving synoptic to a shared
cross-topic bank now that there is >1 topic.

## 2026-07-27 — CS shell increment 7: CSShell assembled (the final extraction)
Completed the `CSShell` extraction — the CS revision shell is now a real, reusable shell.
Introduced the **`CSTopic`** contract in `src/shared/cs/types.ts` (`id` / `title` /
`specTags` / `glossary` + all the content arrays — `lessons`, `scenes`, `cards`, `cloze`,
`myths`, `exam`, `synoptic`, `info`), the whole authoring surface for a knowledge topic.
Built **`src/shared/cs/CSShell.tsx`** by lifting the shell scaffold that lived in
`CpuArchitecture`'s `App()`: the sticky header + home button, the desktop top-tabs +
mobile `BottomNav`, the burger menu (topic-info + beyond-spec toggle), the topic-info
modal, the beyond-spec filtering (now inline `topic.cards/cloze/exam.filter`), the
quiz/spot sub-toggle, the exam-section chips + hints toggle, and the activity routing that
renders the six modes + `LearnMode` — all wired from a single `topic` prop and wrapped in
`<TopicProvider>` (the `SPEC_DESCRIPTIONS` / `GLOSSARY` wiring folded in). Reduced
**`CpuArchitecture.tsx` to pure data**: its content consts + a `CPU_TOPIC: CSTopic` object
+ `export default () => <CSShell topic={CPU_TOPIC} />` — **560 lines, down from 779**, and
it's the canary: builds clean, 264 tests pass, behaves pixel-identically. Exported
`CSShell` + the `CSTopic` / `TopicScenes` types from the barrel. Also added **content-driven
activity hiding**: `CSShell` derives which of the six activities a topic backs from its data
(Learn↔`lessons`, Study/Cards/Quiz↔`cards`, Spot↔`myths`, Fill↔`cloze`, Exam↔`exam`/`synoptic`)
and auto-hides the rest from the desktop tabs and mobile `BottomNav` (nav hidden entirely for
a single-activity topic); the Quiz MCQ/Spot sub-toggle and the exam-section chips filter the
same way — so a data-only topic can omit whole modes with no extra config. `CpuArchitecture`
backs all six, so it's unchanged. The `validate.ts` CSTopic
CI checker is deferred to increment 8 (documented in `CS_SHELL_PLAN.md`, with the synoptic
top-level-`specTags` caveat that would otherwise false-fail the canary). Ticked increment 7
in `CS_SHELL_PLAN.md` and refreshed the Resume-here block. **Next (increment 8):** author
**1.1.2 CPU Performance** as one pure-data `CSTopic` — the payoff proof — and add the
CSTopic validator alongside it.

## 2026-07-27 — CS shell increment 6: ExamMode
Continued the `CSShell` extraction from `CpuArchitecture` (the canary). Lifted **ExamMode**
— the exam/synoptic activity: command-word chips with a "what it's asking" guide, mark
tariffs, MCQ auto-mark, self-marking against a mark scheme, context re-rolls, and the
model-answer reveal — out of the tool and into **`src/shared/cs/modes/ExamMode.tsx`**. It's
now self-contained and content-driven: it takes `questions` (exam) + `synoptic` props and
reads spec descriptions from the topic context via `SpecBadge`; `MARK_FORMATS` /
`COMMAND_GUIDE` come from shared. The pure `resolvePrompt` helper and the `MarkPips`
sub-component moved into the mode with it. The topic's `EXAM_QUESTIONS` /
`SYNOPTIC_QUESTIONS` stay as **topic data** in `CpuArchitecture.tsx`, which now just renders
`<ExamMode questions={exam} synoptic={SYNOPTIC_QUESTIONS} … />` and shed its now-unused
imports. Exported `ExamMode` from the barrel. All six recall modes now live in the shell;
Exam behaves identically — builds clean and 264 tests pass. Ticked increment 6 in
`CS_SHELL_PLAN.md`. Next (final extraction): assemble `CSShell` and reduce `CpuArchitecture`
to `export default () => <CSShell topic={CPU_TOPIC} />`.

Also switched the session-handoff kickoff convention: kickoff blocks now use a fenced
`text` code block instead of the old `>>>` / `<<<` delimiters (which render as nested
blockquotes and break the paste boundary), and the rule now forbids naming a branch — every
kickoff starts from an up-to-date `main` on the session's own fresh branch. Updated
`CLAUDE.md` and the `CS_SHELL_PLAN.md` Resume-here block.

## 2026-07-27 — CS shell increment 5: LearnMode
Continued the `CSShell` extraction from `CpuArchitecture` (the canary). Lifted **LearnMode**
— the lesson picker plus the stepped predict / flow / analogy / trace engine — out of the
tool and into **`src/shared/cs/modes/LearnMode.tsx`**. The engine was already generic; the
coupling to unpick was that it hard-wired `BoxSchematic` / `TraceTable` and the topic's
`LESSONS` / `LEGEND` / `CPU_SCHEMATIC` / `CPU_TRACE` consts. It now takes `lessons` plus a
**`scenes` config** (`{ schematic?, trace?, legend? }`) and maps each lesson's `kind`
descriptor to a representation (schematic → `BoxSchematic`, trace → `TraceTable`), so the
mode is topic-agnostic. The lesson content and CPU representation configs stay as **topic
data** in `CpuArchitecture.tsx`, which now renders `<LearnMode lessons={LESSONS}
scenes={{ schematic: CPU_SCHEMATIC, trace: CPU_TRACE, legend: LEGEND }} />`. Exported
`LearnMode` + the `LearnScenes` type from the barrel. The extraction preserves every beat,
gate and keyboard control, so Learn behaves identically; builds clean and 264 tests pass.
Ticked increment 5 in `CS_SHELL_PLAN.md`. Next: ExamMode, then assemble `CSShell`.

## 2026-07-27 — CS shell increment 4: data-driven representations
Continued the `CSShell` extraction from `CpuArchitecture` (the canary). Generalised the
hard-coded `CpuDiagram` into a reusable **`BoxSchematic`** and lifted **`TraceTable`**,
both into **`src/shared/cs/representations/`**. Each is now driven purely by a config
object: `BoxSchematic` takes a `SchematicConfig` (nodes + roles + dashed containers +
buses + free annotations, with an animated value token flowing between two nodes), and
`TraceTable` takes a `TraceConfig` (rows + role palette). The CPU box layout that used to
live inside the component — `PARTS` / `ROLE_COLOR` / `ROLE_TINT` — is now **topic data**
(`CPU_SCHEMATIC` / `CPU_TRACE` in `CpuArchitecture.tsx`), so other CS topics can supply
their own layouts against the same primitive. Added the representation types to
`types.ts` and exported both components from the barrel. The extraction preserves every
coordinate and colour, so the CPU diagram renders identically; builds clean and 264
tests pass. Ticked increment 4 in `CS_SHELL_PLAN.md`. Next: LearnMode (scene registry),
then ExamMode, then assemble `CSShell`.

## 2026-07-27 — CS shell increment 3: self-contained recall modes
Continued the `CSShell` extraction from `CpuArchitecture` (the canary). Lifted the
five recall modes — **Study, Flashcards, Quiz, Spot-the-Mistake and Fill-in** — out
of the tool and into **`src/shared/cs/modes/`**, each parametrised purely by its
content prop (`cards` / `myths` / `exercises`) and reading glossary/spec data from the
topic context provider. The one topic-coupled helper (`buildChoices`, which drew MCQ
distractors from a module global) now takes the visible card pool as an argument, so
the modes carry no topic state. `CpuArchitecture.tsx` drops ~480 lines and imports the
modes from `../../shared/cs`; it builds clean and behaves identically (264 tests pass).
Ticked increment 3 in `CS_SHELL_PLAN.md`. Next: representations (`BoxSchematic`,
`TraceTable`), then LearnMode and ExamMode, then assemble `CSShell`.

## 2026-07-24 — CPU Architecture tool + CS shell foundations
The session that turned CS from a single quiz into a real strand. Built the
**`CpuArchitecture`** tool (`/cpu-architecture`, enabled) — spec-tagged,
exam-realistic, mobile-first OCR J277 1.1.1 revision with Learn mode,
self-marking, mark-scheme reveal and misconception handling. Began extracting a
reusable **`CSShell`** (`src/shared/cs/` — `types.ts`, `ui.tsx`, `tooltip.tsx`,
`context.tsx`) so future sub-topics (1.1.2 → 1.6) are authored as *data*, not
bespoke code — deliberately **separate** from the maths `ToolShell` (CS tools are
knowledge/recall, not generators). Reworked the **landing page** to band tools by
subject (Mathematics / Computer Science), and added the CS reference docs
**`CS_ROADMAP.md`** and **`CS_SHELL_PLAN.md`**. *(Merged to `main` as PR #38.)*

## Origins — `SystemArchitecture`
**`SystemArchitecture`** was the original and, until the CPU tool, only CS tool:
a standalone **quiz tool** ("1.1 — System Architectures"), never on the maths
shell by design. It's the reference for what the new `CSShell` is generalising.

---

## Keeping this current

At the **end of a session**, before you push:

1. Add an entry under the strand you touched (**Maths** or **Computer Science**),
   newest first, dated with the session's commit date.
2. Write it as *what shipped*, in plain English — one short paragraph, linking the
   tool/page/file it changed. Group the session's commits; don't transcribe them.
3. Update the moved prong's **Where it's at** line (and *At a glance* row) in
   `PROJECTS.md` — that is the single status/plan surface; this file is history only.
4. If the work is part of a **multi-session build**, give the user a copy-paste kickoff
   block in chat if they want to continue — but **do not save it anywhere**; kickoffs are
   generated on demand from `PROJECTS.md` (see *"Ending a session / session kickoffs"* in
   `CLAUDE.md`).
