# Projects — where each prong is up to

The one place to see **where every active project stands** and **what we *could* do next**.
Read this to orient at the start of a session ("today, let's look at teaching decks"); it
tells you where that prong is up to, and offers some candidate directions to pick from.

**How to read it.** Each prong has a short **Where it's at** (the honest current state) and
**Possible next steps** — these are *options to spitball from*, not a fixed queue. We choose
the right one on the day. Add, cross out, and re-order the bullets freely.

**What this doc is not.** It's the readable overview, not the deep detail. The full tables
(technique audit, skills-by-representation, J277 spec order) live in the roadmaps; the
session-by-session history lives in `PATCH_NOTES.md`; the rules live in `CLAUDE.md`.

| For… | See |
|---|---|
| Deep Maths plan (audit tables, skill lists) | `DEV_ROADMAP.md` |
| Deep CS plan + shell architecture | `CS_ROADMAP.md` · `CS_SHELL_PLAN.md` |
| Decision shell architecture + contracts | `DECISION_SHELL_PLAN.md` |
| What actually shipped, session by session | `PATCH_NOTES.md` |
| Conventions / how to build | `CLAUDE.md` |

---

## At a glance

| Prong | Status | One-line |
|---|---|---|
| Computer Science shell | 🚧 | Shell done; 2 of ~15 J277 topics authored as data |
| Decision Maths | 🚧 | New shell live; first tool (MST) shipped as a thin slice |
| Teach decks | 🚧 | Engine built; one partial deck exists |
| Core representations | 🚧 | 3 of 6 visual families have Teach scenes |
| Techniques engine | 🚧 | Engine built; only 1 tool converted so far |
| Skills library | 🚧 | Engine + backlog ready; 2 skills built |
| SmartGrapher | ✅ | Mature, embeddable; used in 2 tools |
| Old-shell migration | 🚧 | Most tools migrated; a handful remain |

*(Maths pedagogy prongs — teach decks, representations, techniques, skills — are deliberately
interlocked: a skill is usually a technique's full teaching rendered on a representation, and a
Teach deck strings those together. Progress on one often unblocks the others.)*

---

## Computer Science shell

**Where it's at.** The CS side is a GCSE (OCR J277) revision area with its own shell,
`CSShell` — separate from the Maths tools because these are knowledge/revision tools, not
question generators. The shell is **fully built**: six activity modes (Learn · Study · Cards ·
Quiz · Fill · Exam) driven by a single `topic` data object, with two representations so far
(box schematic, trace table) and a CI validator that checks every topic. The payoff is proven —
**two topics now ship as pure data files**: 1.1.1 CPU Architecture (the pilot/reference) and
1.1.2 CPU Performance. So the remaining spec is authoring, not engineering.

**Possible next steps (spitball — pick on the day):**
- Author the next sub-topic as data — **1.1.3 Embedded Systems** is the natural follow-on (mostly definitional, few new diagrams).
- Or do a synoptic partner first — **1.2.1 Primary storage (RAM/ROM)** pairs tightly with 1.1.1.
- Pull synoptic questions out of individual topic files into a **shared cross-topic bank** (now worthwhile with >1 topic).
- Build a new representation when a topic demands it (data representation → place-value/number-line; networks → stack/topology).
- Keep the pipeline honest — a `Status: ready` brief in `specs/cs/` before each topic.

---

## Decision Maths

**Where it's at.** A brand-new, network-native shell (`DecisionShell`), parallel to the others.
**Increment 1 just shipped**: the first end-to-end slice — pure `NetworkView` + `MatrixView`
renderers, a thin shell with a **Question** mode and a **Solution** stepper (forward/back through
the algorithm one beat at a time, with a running total and a "show all"), and one tool —
**Minimum Spanning Tree**, using Kruskal's algorithm. CI checks each tool's solver against an
independent brute-force reference. It's deliberately narrow so far: one network template, one
question type, one level.

**Possible next steps (spitball — pick on the day):**
- Broaden MST — add **Prim's** (network walk + Prim-on-the-matrix), more question types (apply Prim from node X, list rejected edges), Levels 1–3, more templates.
- Add the **expand-to-sandbox** — open the generated network in an interactive, annotatable canvas.
- Add **worksheet print** via the existing diagram-print engine.
- Start a **second tool** once MST feels complete — TSP reuses the same renderers; CPA needs two new views.

---

## Teach decks

**Where it's at.** A slide-based "teaching part of the lesson" (`TeachingDeck`), dev-gated. The
**engine is built and proven** — hand-authored, misconception-driven slides the teacher presses
through one beat at a time. **Content is the thin part**: only `FractionsAddSub` has a deck, and
only its *Concepts* category (an I-do → We-do → You-do sequence on equivalent fractions). Its
other two categories (True/False, Spot the Mistake) are stubbed "Coming soon", and no other tool
has a deck yet. So the open question is less "what to build" and more "what proves the format".

**Possible next steps (spitball — pick on the day):**
- Deepen the exemplar — fill out FractionsAddSub's remaining categories so one deck is complete end-to-end.
- Or prove breadth — author a first deck for a *different* tool, to test the format on another topic.
- Sketch a deck for a non-fraction topic (angles, ratio) to check the scene library actually covers it.
- Decide the bar for **coming out from behind the dev gate** (needs ≥1 genuinely classroom-ready deck).
- Reconsider what categories a deck should even have — the current three (Concepts / True-False / Spot-the-Mistake) are a starting guess, not settled.

---

## Core representations

**Where it's at.** The site commits to **six core visual representations** as a shared vocabulary,
so the same bar model a student meets in fractions reappears in ratio. **Three have animated Teach
scene families built**: bar model (split / combine / equivalents), number line (multiples), prime
factor tiles (factor tree / prime Venn). **Three don't yet**: area model (no scenes), algebra
tiles (a standalone manipulative exists at `/algebra-tiles`, but no scenes), negative counters (no
manipulative or scenes at all). These are the biggest lever on the Maths pedagogy side — each new
representation unlocks a cluster of skills and decks.

**Possible next steps (spitball — pick on the day):**
- Build an **area-model** scene family (unlocks expanding brackets, completing the square, factorising).
- Build **algebra-tile** scenes (unlocks solving equations, collecting like terms).
- Build **negative counters** (unlocks directed number — used almost everywhere).
- Prioritise by blockage — pick the representation whose absence is gating the most wanted skills, rather than by novelty.

---

## Techniques engine

**Where it's at.** When tools moved onto the shared ToolShell they lost their hand-written working
steps and fell back to thin "jump to the answer" wrappers. The **techniques engine** restores that
pedagogy *once, reusably* — titled, fragmented, grain-aware (brief / standard / full) working
blocks. The **engine and its viewer (`/techniques`) are built**, and six techniques exist — but
**only one tool (`NonLinearSimEq`) has been converted**, so most tools still show thin working.
The value is real but latent until the sweep happens.

**Possible next steps (spitball — pick on the day):**
- Add a runtime **"Detailed working" toggle** so teachers can flip grain (brief ↔ full) live.
- **Sweep more tools** onto the engine — start with the high-frequency moves (solve linear equation, expand brackets, substitute, simplify fraction).
- Grow the technique library as the sweep needs new moves.
- Add a **CI shape-check** (every method emits ≥N titled steps, no duplicate lines) once enough tools are converted.

---

## Skills library

**Where it's at.** Small slide-sequences that each teach **one prerequisite skill**
(`src/shared/skills/`), browsable at `/skills`, and the drill-downs behind `[[skill|term]]` links
in worked examples. **Two skills exist** (LCM, taught two ways). CI validates every skill. There's
a clear backlog tied to which representation each skill needs — the cheap ones sit on scenes that
already exist; the rest wait on the representation work above.

**Possible next steps (spitball — pick on the day):**
- Build the **cheap, high-value cluster** on existing scenes — equivalent-fractions, simplify-fraction, HCF, share-in-ratio, fraction-of-amount.
- Sequence the skills that need a **new scene** (solve-linear-equation, expand-double-brackets, directed-number) alongside the representation work.
- **Unify skills with techniques** — let a skill's full teaching and a technique's full output share one source, so they can't drift.

---

## SmartGrapher

**Where it's at.** A **mature**, embeddable, data-driven graph component (`src/shared/grapher/`)
with its own test bench at `/grapher`. Live in two tools (Mixed Strategies Level 3, NonLinearSimEq)
and **self-validating** — it refuses to draw if the graph and the stored answer disagree. Presets
cover linear / quadratic / cubic / circle / custom (no ellipse). This one is less a "project" and
more a reusable utility to reach for.

**Possible next steps (spitball — pick on the day):**
- Add graphs to more tools — Equations of Lines, Completing the Square (parabola + vertex), Iterations.
- Add an **ellipse preset** if/when a tool needs ellipse-and-line.
- Mostly: pull it in opportunistically when building or migrating any coordinate/quadratic tool.

---

## Old-shell migration

**Where it's at.** Older tools hand-roll their own UI; v2.3 tools use the shared ToolShell
(~250–350 lines). **Most are migrated**, and a CI test enforces the "which tool is on which shell"
bookkeeping. A few remain: one user-facing tool and a few dev-gated ones. Migration is also the
natural moment to add techniques-based working and, where relevant, a graph.

**Possible next steps (spitball — pick on the day):**
- Migrate the remaining enabled tool — **FractionToRatio**.
- **Decide finish-vs-delete** on the dev-gated leftovers (IntegerAddSub, SimplifyingRatiosTool, PerimeterTool).
- Pair each migration with a **techniques pass**, so a tool regains its pedagogy, not just the shell.

---

*Keeping this current: when a session moves a prong, update its **Where it's at** line (and the
at-a-glance row) here, alongside the usual `PATCH_NOTES.md` entry. Next-step bullets are
spitball — prune the ones we've done or ruled out.*
