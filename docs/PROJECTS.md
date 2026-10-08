# Projects — the plan for everything in flight

The **single planning surface** for the whole repo. Where every prong is up to, what we
*could* do next, and the deep detail behind each.

**What counts as a prong.** A *development prong* is a feature or capability we build once and
roll out across tools (or a strand we build up). Things that are **ongoing practice** (reviewing each
tool, making everything work on a phone) are *not* prongs — they have their own short sections and are
always on. Work that is **paused** lives on the back bench (`docs/BACKBENCH.md`), not here.

**How it's laid out.** *How the work is organised*, an *At a glance* table, the ongoing practices,
then one section per prong. Each prong has:

- **Where it's at** — the honest current state, in a few sentences.
- **Possible next steps** — *options to spitball from*, not a fixed queue. We pick the right
  one on the day. Prune the ones we've done or ruled out.
- **Detail** — the deep lists. Skip it for the overview; open it when you actually pick the prong up.

**The loop.** You plan from this doc. When a session ships something, I log *what shipped* to
`docs/PATCH_NOTES.md` (the history) and refresh the prong's **Where it's at** + its *At a glance* row
here. One place you read, one place I record.

**Session kickoffs (on demand, never saved).** When you're firing off several sessions in a
sitting, ask **"kickoff for `<prong>`"** and I'll generate a fresh copy-paste starter block from
that prong's entry — a one-line where-we-are, the exact task we picked, the minimal files to
read, and the verification bar. These are generated fresh each time from the live status here;
we deliberately **don't** store standing prompts (they just rot). The recipe I build them from
lives in `CLAUDE.md` → "Ending a session / session kickoffs".

Status keys: ✅ done · 🚧 in progress · ⬜ not started · ⏸ paused (deliberately not a current priority).

---


| For… | See |
|---|---|
| Conventions / how to build | `CLAUDE.md` |
| The per-tool pedagogy + readiness audit (criteria and live findings) | `docs/TOOL_AUDIT.md` |
| Shell architecture + contracts | `docs/architecture/CS_SHELL_PLAN.md` · `docs/architecture/DECISION_SHELL_PLAN.md` |
| Paused work (Skills library, Teach decks) | `docs/BACKBENCH.md` |
| What actually shipped, session by session | `docs/PATCH_NOTES.md` |
| Canonical names for every element | `docs/GLOSSARY.md` |
| Designing a new build in chat (pre-code) | `docs/design/DESIGN_STUDIO.md` + the spec templates |

---

## How the work is organised

Four kinds of thing, kept apart on purpose (restructured 2026-10-04):

1. **Development prongs** — features and strands we build and roll out:
   **Techniques engine** (top build priority — it speeds up every new tool) · **Worked solutions** ·
   **Smart Progressor** · **Core representations** · **Sandboxes & viewports**.
2. **Standalone prongs** — whole areas that stand on their own: **Computer Science shell** and
   **Decision Maths** (which sits with the A-level strand, alongside the **P-Value Grapher**). Both parked as priorities.
3. **Ongoing practice** — always on, never "finished": the **Tool review cycle** (every tool gets its
   own note and is reviewed individually) and the **mobile / narrow view** (a standing rule: every tool
   must work on a phone).
4. **Back bench** — **Skills library** and **Teach decks**, extracted to `docs/BACKBENCH.md` until they
   are readdressed (they should be better supported once Techniques and Worked solutions land).

Stand-alone teacher tools with no prong: **Visualiser**, the four PDF
**Generators**. Old-shell migration is **closed** (backlog empty; CI-guarded by `organisation.test.ts`).

---

## At a glance

| Prong | Status | One-line |
|---|---|---|
| **Techniques engine** | 🚧 top priority | Engine + viewer built; 3 tools converted (`NonLinearSimEq`, `Surds`, and `AnglesInTriangles`' solving — first non-algebra use, with a unit) — now to be **built out**, not just converted on demand |
| **Worked solutions** | 🚧 | The solved-example format: step-by-step reveal, one developing picture beside the steps (now also every Geometry diagram tool, with per-step highlighting on Triangles), answer as its own green step. Live in a growing set of tools; 19 still need a closing answer step |
| **Smart Progressor** | 🚧 | Mechanism done and piloted on `SpeedDistanceTime`; the work now is adopting it tool by tool (audit the other 26) |
| **Core representations** | 🚧 | The visual vocabulary, its progressions and pairings; where to use each, what tools and sandboxes to make |
| **Sandboxes & viewports** | 🚧 | Algebra Tiles, Negative Counters, SmartGrapher (+ Grapher Lab, Parallel Lines Explorer): standalone tools first, then embedded as viewports in question tools |
| **Depth** | ✅ live (3 tools) | Curated diagnose / explain / extend questions as a mode on any tool that supplies a bank; follows the Question Options; banks on Order of Operations, Rounding and Speed, Distance & Time (live) |
| **Computer Science shell** | ⏸ | Shell built; 2 topics shipped as data; next is authoring 1.1.3 |
| **Decision Maths** | ⏸ | MST shipped; TSP nearest-neighbour slice built (dev-gated); **Network Flows** built (dev-gated, 5 sub-tools); next TSP lower bound / Network Flows print |
| *Tool review cycle* | ♻ ongoing | Per-tool notes; not a prong |
| *Mobile / narrow view* | ♻ standing rule | Not a prong; shipped for every tool |
| *Skills library · Teach decks* | 🪑 bench | See `docs/BACKBENCH.md` |

---

# Ongoing practice

## Tool review cycle

**Not a prong** — a review each tool goes through when we get to it, so we think about what is best
for *that* tool instead of working to one global backlog. It replaces the old "Maths Tool Audit" and
"Tool expansion (Part 2)" sections.

- **Each tool has its own note** (the tool's page in Harry's planner, under its strand) with a **Review** block. When we reach a tool we fill it in.
- **The Review block asks:**
  - Content: new question types, broader sub-tool coverage, scope the tool should grow into?
  - Readiness: should it be live, stay gated, or change level/QO structure?
  - Sandbox fit: would a sandbox viewport (tiles, counters, graph) help — and does it integrate cleanly?
  - Techniques: which technique blocks would replace hand-rolled working?
  - Worked solution: does the last step state the answer; is there a developing picture that fits?
  - Smart Progressor: which boolean options are really difficulty rungs?
  - Mobile: checked on a narrow viewport?
- **Seeding the notes (done 2026-10-04):** all 35 ToolShell tool notes now have a seeded Review block (27 from the audit, 8 newer tools from specs and this plan; status "seeded from audit/specs", not yet reviewed in person). `docs/TOOL_AUDIT.md` holds the original per-tool findings (all 27 Maths tools, 2026-08) — its methodology is the checklist, and each tool's findings seed that tool's note. Don't keep two copies up to date: the note is the live one once a tool is reviewed.
- **Known source items** (carried over so none are lost): decimal-operations family (multiply/divide decimals on the shared place value table, a Teach deck for add/subtract — deck is benched, go-live sign-off); `BasicAngleFacts` and `AnglesInParallelLines` still on hand-rolled print handlers; the `SimplifyingRatiosTool` go-live call (audit recommended it stays gated).

**The 22 `enabled: false` tools** (the go-live queue is smaller than it looks):
- **Question tools dev-gated (2, decided 2026-10-04):** Simplifying Ratios (needs work: no question options) and Perimeter (most outdated, thin options). Surds went live the same day.
- **Decision Maths (4):** Network Sandbox, Minimum Spanning Tree, Travelling Salesperson, Mixed Strategies — go live with their strand.
- **Computer Science (1):** 1.1.2 CPU Performance.
- **Internal / library pages, not meant to go live (14):** Skill Library (parked), Technique Library, the 11 Technique Preview pages, Grapher Lab.
- Friday Phonecalls (`call-selector`) was deleted 2026-10-04.

## Mobile / narrow view

**Not a prong — a standing rule, always considered.** Every tool must work on a phone. `ToolShell`
already swaps to a compact single-column layout at ≤640px for every tool at zero per-tool cost
(settings banner + drawer, Worked Example / Worksheet toggle, a light scrollable worksheet list; no
Whiteboard, Teach or print in narrow). New tools get it for free; new bespoke renderers and sandboxes
must be checked at phone width before shipping. Outstanding checks live in each tool's Review block:
a diagram tool, a tool with a heavy QO surface, and what `?diff=1` should do on a phone.

---

# Development prongs

> **Two separate gates — do not conflate them (2026-08-18).** **Developing-tools mode**
> (`src/devMode.ts`, the visible toggle on the landing page) is for things currently *in the
> pipeline* — `enabled:false` tools, the step-by-step **Worked Example**'s fragment reveal, the
> **Technique Library** (`/techniques`), **Grapher Lab** (`/grapher`). **Parked mode**
> (`src/parkedMode.ts`) is a separate, stronger, unadvertised gate for content that exists but is
> neither live nor currently being built (now the back bench — see `docs/BACKBENCH.md`). It has no UI
> toggle (unlocked only via `?parked=1`) and its routes 404 outright without the flag.

## Techniques engine

> **Top build priority (2026-10-04).** This is the prong that most speeds up building tools, so it is
> now to be **built out**, not only converted on demand: the blocks, the grain toggle and the tool
> conversions. It feeds Worked solutions directly (techniques *are* the solving steps) and is a
> precondition for the benched Skills / Teach decks coming back.

**Where it's at.** When tools moved onto the shared ToolShell they lost their hand-written working
steps and fell back to thin "jump to the answer" wrappers. The **techniques engine**
(`src/shared/techniques/`) restores that pedagogy *once, reusably* — titled, fragmented,
grain-aware (brief / standard / full) working blocks. The **engine and its viewer (`/techniques`)
are built**, and ten techniques exist — but **only three tools have been converted** (`NonLinearSimEq`,
`Surds`, and — 2026-10-04 — `AnglesInTriangles`, whose solving blocks call `solveLinearEquationSteps` at full
grain with a degree unit), so most tools still show thin working. Open gaps from that conversion: the
answer-step split (`splitAnswerStep`) only recognises the full-grain inline chain — the technique should mark
its own result as the answer so brief/standard grain split too; no `collectLikeTerms` or angle-facts
technique yet (the setup lines are still hand-written); `GRAIN` is a per-tool constant until the grain toggle exists. The value is real but latent until the sweep
happens. **The viewer itself was reworked 2026-08-17**: every technique (including the composed
Full Worked Example) now has its own real tool page (`/techniques/<slug>`, e.g.
`/techniques/quadratic-formula`) built on a shared `TechniquePreviewPage`, rendering through the same
`WorkedExampleSteps` component (now extracted out of `ToolShell.tsx`) every real tool's Worked
Example uses — replacing the earlier popup overlay, which is now removed. That's the pattern for any
new technique going forward: a thin page + a `pageUrl` entry in `TechniqueLibrary.tsx`, not a popup.
See `docs/PATCH_NOTES.md` for the full list of rendering bugs fixed along the way.

**Surds promotion (the first tool-first conversion).** `Surds.tsx` originally built its own
four grain-aware step-builders locally (`surdsMath.ts` + `surdsSteps.ts`), deliberately shaped
to the engine's own `(inputs, grain) => WorkingStep[]` contract but kept local per this prong's
"build on demand, not a sweep" rule. Once the tool had proven the shape out in production across
five sub-tools, they were promoted near-verbatim into `src/shared/techniques/index.ts`
(`simplifySurdSteps`, `collectLikeSurdsSteps`, `expandSurdBracketsSteps`,
`rationaliseDenominatorSteps`) with the pure computation layer promoted alongside them into
`src/shared/surds.ts` (`SurdTerm`/`SurdFraction` + arithmetic + LaTeX formatting) — `Surds.tsx`
now pulls all of it back through `"../../shared"` like any other tool would, and the two local
files are gone. `expandBracketsSteps` was renamed `expandSurdBracketsSteps` on the way in: it
operates on `SurdTerm`, not general algebraic terms, so it's a sibling of — not the same
technique as — the still-unbuilt generic `expandBrackets` row below (that one needs a different
arg shape before `ExpandingBrackets`/`NonLinearSimEq` can use it). All four now have their own
`/techniques/<slug>` preview page, same as the original six. This is the reference shape for any
future "build it in a tool first, promote once proven" conversion.

**Grain audit, post-promotion.** Being promoted (and library-listed with a "3 grains" badge)
surfaced a real gap: three of the four promoted techniques (`collectLikeSurdsSteps`,
`expandSurdBracketsSteps`, `rationaliseDenominatorSteps`) had `standard`/`full` producing
byte-identical output in every case — verified empirically (500+ random draws each), not just by
reading the code — so "3 grains" was an overclaim the moment they joined the public library.
Built out genuine `full` grains for all three: `collectLikeSurdsSteps`/`expandSurdBracketsSteps`
now emit one step per term that needs simplifying and one step per radicand-group's coefficient-add
(via two new private helpers, `individualSimplifySteps`/`collectGroupSteps`), rather than folding a
whole expression's tidying into one step; `expandSurdBracketsSteps` also splits its
difference-of-two-squares case into "evaluate each square" + "subtract", and gives monomial×monomial
its own "multiply the coefficients" / "multiply the numbers under the root" breakdown (delegating
the follow-on simplify to `simplifySurdSteps`); `rationaliseDenominatorSteps` propagates the real
grain into its two `expandSurdBracketsSteps` sub-calls (previously hardcoded to `"standard"`)
instead of leaving `full` to fall through to `standard`'s behaviour. `simplifySurdSteps` itself was
left as-is — it's genuinely 3-grain already, just conditionally (only when a coefficient is present
AND the radicand isn't already square-free), which was always documented, not a bug.
Verified via three separate stress-test passes before shipping: (1) `standard`/`brief` output is
byte-identical to the pre-rework version across 3000+ draws (compared old vs. new implementations
directly, not just re-reading the diff); (2) `full` now differs from `standard` in 100% of draws
across every shape (monomial×monomial with a coefficient, double-bracket collect, difference of
squares, monomial and binomial denominators); (3) Surds' `hideAnswerStep` invariant (last working
step must state the exact final answer) still holds across all 5 sub-tools × 3 levels post-rework —
this mattered because Level 1 Add/Sub, Multiply/Divide, and Rationalise all genuinely exercise the
new `full`-grain code paths live, not just in the Technique Library preview.

**Surds now calls every one of its four techniques at `full` grain, at every level.** Previously
only Level 1 did (Add/Sub, Multiply/Divide, Rationalise); Level 2/3 used `standard`, and Expand
never used `full` at any level. Rationale: Surds is the tool where a student meets these techniques
for the first time — it isn't a downstream tool composing them as an already-mastered prerequisite
(the way, say, a future quadratics tool might call `rationaliseDenominatorSteps` at `brief` grain
in passing). Since the whole point of being *in* Surds is learning the mechanics, every level should
get the full taught breakdown, not a truncated one at higher levels. Re-ran the 3-way stress-test
suite after the change (all 5 sub-tools × 3 levels × 500 draws = 7500 questions) to confirm the
`hideAnswerStep` invariant still holds now that every level exercises the richer code paths.

**Possible next steps (background, pre-audit — see the sequencing note above):**
- Add a runtime **"Detailed working" toggle** so a teacher can flip grain (brief ↔ full) live — the one shell change on the list.
- **Sweep more tools** onto the engine — start with the high-frequency moves below.
- Grow the technique library as the sweep needs new moves.
- Add a **CI shape-check** (every method emits ≥N titled steps, no duplicate consecutive lines) once enough tools are converted.
- Close the known medium-grain gaps in `NonLinearSimEq`, both **confirmed still present at the exact
  generator-code level** by the Tool Audit's Algebra pass: (1) the `(2x−5)²` expansion isn't shown —
  `buildWorking`'s substitute/expand-and-rearrange steps never compute an unsimplified intermediate,
  and the `BankEntry`/`FormBankEntry` data model has nowhere to store one even if a step were added,
  so this needs a data-model change, not just a new `w.step()` call; (2) the cosmetic `−1x`-should-
  be-`−x` bug lives specifically in the `linear` sub-tool's own `solvePos`/`solveNeg` helpers, which
  interpolate a computed combined coefficient raw instead of routing it through the file's own
  `nextT`/`coef()` sanitizer that every other code path in the file already uses correctly — the fix
  is to route that one value through the existing sanitizer, or better, to stop hand-rolling that
  sub-tool's solve chain and call the already-built `solveLinearEquationSteps` instead (see the
  technique-audit table below).

**Detail — techniques built:** `quadraticFormulaSteps` (grain-aware), `solveLinearEquationSteps`
(grain-aware, optional `unit` — e.g. degrees; first non-algebra use: `AnglesInTriangles`, full grain), `solveFactorsSteps`, `substituteBackSteps`, `makeSubjectSteps`, `solveLinearlySteps`,
`simplifySurdSteps` (grain-aware), `collectLikeSurdsSteps` (grain-aware), `expandSurdBracketsSteps`
(grain-aware), `rationaliseDenominatorSteps` (grain-aware, composes the previous two). Reference
conversions: `NonLinearSimEq.tsx` (uses `standard` grain), `Surds.tsx` (uses `full`/`standard`
per level — see the promotion note above).

**Detail — the technique audit (build backlog; start high-frequency).** Status: ✅ built · 🚧 partial · ⬜ needed.

*Algebra & cross-cutting*

| Technique | Move | Priority | Status |
|---|---|---|---|
| `solveLinearEquation` | isolate, collect, divide to solve `ax+b=c` | **high** | 🚧 grain-aware version exists — needed by `SolvingLinearEquations` (zero-new-import integration point — already re-exported from `"../../shared"`) and now wired into `NonLinearSimEq`'s `linear` sub-tool (Tier 0, 2026-08-15), fixing the confirmed `−1x`-should-be-`−x` display bug — but **dev-mode-only for now**: a live user still sees the old hand-rolled chain (`legacySolvePos`/`legacySolveNeg`) until this is reviewed and promoted |
| `expandBrackets` | single / double / squared brackets (FOIL, grid) | **high** | ⬜ — needed by `ExpandingBrackets` (also needs a squared-single-bracket question type its own spec calls for but the tool lacks) and `NonLinearSimEq` (confirmed gap: `(2x−5)²` expansion never shown, no field in the data model to hold it). A `SurdTerm`-flavoured sibling, `expandSurdBracketsSteps`, is ✅ built and proven across three contexts in `Surds.tsx` — same FOIL/difference-of-squares pedagogy, but this row's own arg shape (general algebraic terms) still needs building before `ExpandingBrackets`/`NonLinearSimEq` can use it |
| `substitute` | substitute a value/expression into an equation or formula | **high** | 🚧 substitute-back only — needed by `NonLinearSimEq` |
| `collectLikeTerms` | gather like terms | med | ⬜ — needed by `CollectingLikeTerms`, `ExpandingBrackets`, and (for its opening "reduce x's" move) `SolvingLinearEquations` |
| `makeSubject` / rearrange | rearrange for one variable | med | 🚧 brief only — needed by `NonLinearSimEq` |
| `factoriseQuadratic` | factorise → set factors to zero → roots | med | 🚧 read-the-roots half exists — needed by `NonLinearSimEq` |
| `quadraticFormula` | formula → substitute → discriminant → roots | med | ✅ |
| `completeTheSquare` | half the x-coefficient, form `(x+p)²+q` | low | ⬜ — note: `CompletingTheSquare.tsx` is the repo's named shell-wiring reference but is itself fully unconverted on this axis (Tool Audit, Algebra pass) |
| `solveByElimination` | scale, add/subtract to eliminate | med | ⬜ — needed by `SimultaneousEquations`; cheaper than a fresh build since two of its three moves (substitute-back, solve-linearly) already exist in the engine and this tool already hand-derives correct elimination logic to lift |
| `solveByIteration` | change-of-sign interval, iterate, bound-test | **med** *(bumped from low)* | ⬜ — `Iterations`' three sub-tools (iterate / rearrange-then-iterate / bound-test) map almost 1:1 onto this technique, a complete ready-made spec rather than an inferred need (Tool Audit, Algebra pass) |

*Number*

| Technique | Move | Priority | Status |
|---|---|---|---|
| `simplifyFraction` | divide num & den by a common factor | **high** | ⬜ |
| `fractionOfAmount` | ÷ by denominator, × by numerator | **high** | ⬜ — needed by `FractionsOfAmounts` (Tool Audit, Ratio & Proportion pass) |
| `convertMixedImproper` | mixed ⇄ improper | med | ⬜ |
| `addSubtractFractions` | common denominator (LCM), add/subtract, regroup | med | ⬜ — needed by `FractionsAddSub` |
| `multiplyDivideFractions` | keep-flip-change, multiply across | med | ⬜ — needed by `FractionMultDiv` |
| `roundToSigFig` | round each value to 1 s.f. | med | ⬜ — needed by `Estimation` |
| `directedNumberAddSub` | start position → jump direction/size from sign rules → land | low | ⬜ — new, needed by `IntegerAddSub` (Tool Audit, Number pass) |
| `scaleByPowerOfTen` | count the zeros → state direction → show the digit shift | low | ⬜ — new, needed by `PowersOfTen` (Tool Audit, Number pass) |
| `percentageOfAmount` | multiplier vs. chunking decomposition | med | ⬜ — new, needed by `Percentages` (Tool Audit, Number pass) |
| `percentageChange` | build multiplier from 100 ± % | med | ⬜ — new, needed by `Percentages` (Tool Audit, Number pass) |
| `reversePercentage` | unitary method — find 1%, then scale | med | ⬜ — new, needed by `Percentages` (Tool Audit, Number pass) |

*Ratio & Proportion*

| Technique | Move | Priority | Status |
|---|---|---|---|
| `shareInRatio` | total parts → 1 part → each share | **high** | ⬜ — needed by `RatioSharingTool`, the category's sole real demand signal |
| `convertFractionRatio` | fraction ⇄ ratio | med | ⬜ — needed by `FractionToRatio`; that tool also needs `simplifyRatio` (below) for its `formingRatios` sub-tool |
| `simplifyRatio` | divide parts by a common factor | med | ⬜ — needed by `FractionToRatio` (`formingRatios`) and `SimplifyingRatiosTool` (numeric sub-tool); `SimplifyingRatiosTool`'s algebraic sub-tool is genuinely broader than this row's spec (also cancels shared variables/powers) — fold that scope in when built |
| `unitPriceCompare` | price ÷ quantity, compare | low | ⬜ — needed by `BestBuys`; the row's current spec only covers the `unitCost` sub-tool — `specialOffers`' real move is "resolve a deal structure to an effective price, then compare," a compound move one stage ahead — broaden the description or add a sibling row |
| `scaleRecipe` | scale ingredients by a factor | low | ⬜ — needed by `RecipesTool`'s `linearScaling` sub-tool; the row's spec doesn't cover `constraints`' actual move ("find each ingredient's per-serving rate, divide stock, take the minimum") — needs a second bullet or a sibling row (e.g. `limitingIngredient`) |

*Geometry*

| Technique | Move | Priority | Status |
|---|---|---|---|
| `applyAngleFact` | sum to 180/360, isosceles, exterior, on a line/point | **high** | ⬜ — needed by `BasicAngleFacts`, `AnglesInTriangles` (the cleanest demand signal — "the reasoning IS the move" genuinely holds there), `AnglesInQuadrilaterals` (richest demand signal, working already states the rule name every branch), `AnglesInParallelLines` (partial fit — rule-naming without shown arithmetic), and `Bearings` (a specific unstated back-bearing justification) — five of eight Geometry tools (Tool Audit, Geometry pass) |
| `gradientIntercept` | gradient formula, `y = mx + c`, solve for c | med | ⬜ — needed by `EquationsOfLines`; an unusually cheap conversion, since the tool already hand-computes the exact three-step shape correctly (Tool Audit, Geometry pass) |
| `circleFormula` | circumference / area / arc / sector | med | ⬜ — needed by `CircleProperties`, an unusually complete match: the tool alone demonstrates all four named sub-moves (Tool Audit, Geometry pass) |
| `sumPerimeter` / `deriveMissingSide` | add all given sides; for rectilinear shapes, use opposite-side equality to find missing lengths first | low–med | ⬜ — new, needed by `PerimeterTool`; none of the other three Geometry rows cover this move (Tool Audit, Geometry pass) |

~24 candidates, six built. Frequency concentrates on a handful — `solveLinearEquation`,
`expandBrackets`, `substitute`, `simplifyFraction`, `collectLikeTerms`, `makeSubject`,
`shareInRatio`, `fractionOfAmount`, `applyAngleFact` — build those first; each doubles as a needed
skill. Old-shell rows (`fractionOfAmount`, `convertFractionRatio`, `applyAngleFact`) are inferred —
confirm the exact moves when those tools migrate. **This table is exactly the kind of thing the
Tool Audit's Part 1 (Infrastructure alignment) cross-references per tool** — as each tool is
audited, update the priority/status columns here with real demand rather than the inferred
guesses above.

**Build order (carried over from the old cross-prong roadmap; skill halves moved to the back bench).**
- **Tier 0 — wire what's built** (dev-mode only, awaiting sign-off): `NonLinearSimEq`'s `linear` sub-tool on `solveLinearEquationSteps`; the original hand-rolled chain is kept as `legacySolvePos`/`legacySolveNeg` until the dev-mode branch is promoted or deleted.
- **Tier 2 — highest leverage:** `applyAngleFact` (5 of 8 Geometry tools, the biggest single demand signal); `collectLikeTerms` (3 consumers); `solveLinearEquation` adoption in `SolvingLinearEquations` (zero-new-import integration point).
- **Tier 3 — two-consumer items, opportunistic:** `expandBrackets` (blocked on the area-model call, see Core representations).
- **Tier 4 — single-tool items:** everything else in the tables above.
- **Shell-level:** the runtime grain toggle ("Detailed working", brief ↔ full) — see Worked solutions.


## Worked solutions

**Where it's at.** The solved-example format, delivered by `ToolShell`'s Worked Example mode and
shared `WorkedExampleSteps` — a tool only supplies per-step data and renderers. Built so far:
- **Step-by-step reveal** — the cascade (earlier steps stay on screen, dimmed) with Show All as the alternative, and **working-step fragments** that reveal one written mark per press (live modelling).
- **Developing picture** — `stepVisualRenderer`: one picture that updates in place beside (or above) the steps. Three layouts — captions beside the picture, full working beside the picture (`stepVisualKeepsWorking`), and picture on top (`stepVisualPlacement="top"`).
- **Step-by-step graph builds** — SmartGrapher plots and highlights with the working (`graphStep` / `graphStepVisual`).
- **Single answer** — where the last working step already states the answer, `hideAnswerStep` shows it in a green ring with no separate answer box; in the picture layouts the answer is a plain green **A** line.
- **Flat rows, one look** (2026-10-04) — the keep-working layout lost its backing cards: numbered rows on the same spine as the caption timeline, each carrying its own label and maths (maths one size larger).
- **Diagram tools** (`src/shared/diagramSplit.tsx`) — the question *is* the diagram, so the geometry tools show it in the picture slot beside the steps (`withDiagramSteps` · `diagramStepVisual` · `diagramSplitQuestion`); per-step emphasis (`_stepFocus` → `_focus`) and values the working finds (`_step`, e.g. an angle drawn from the step that finds it).
- **Answer as its own step** — a final inline chain (`x = 180° − 146°` · `= 34°`) splits into the working plus an **"Answer:"** step in large green maths (`splitAnswerStep`).
- **Rewrite-the-line working** (2026-10-05) — Order of Operations rewrites the whole expression each step with the next move boxed (`\colorbox` fragments), no new representation; a pattern for any equation-led tool whose working is a sequence of rewrites.
- **Gradient triangle** — Properties of Line Equations draws the right-angled triangle on the graph (labelled Δy / Δx legs — the shared grapher `Segment`), then divides.
- **Instruction lines** — ToolShell no longer hides a sub-tool's instruction when the tool has a custom renderer (it was missing in 5 tools).

**Live in.**
- Developing picture: Adding & Subtracting Decimals · Multiplying & Dividing by 10ⁿ · Comparing & Ordering · Ratio Sharing · Speed, Distance & Time.
- Graph builds: Properties of Line Equations (gradient triangle) · Simultaneous Equations (Substitution) · Mixed Strategies (L3).
- Diagram split (Geometry): Basic Angle Facts · Angles in Triangles (per-step highlighting, derived angles, technique solving, answer step) · Angles in Quadrilaterals · Angles in Parallel Lines · Properties of Circles · Bearings · Perimeter.
- Place value table working (Computer Science): Number Bases · Binary Operations (addition columns with carries, shifts with lost bits).
- Number line on top: Adding & Subtracting Integers · Rounding (number-line method).
- Single answer (16): Surds · Expanding Brackets · Unknowns on Both Sides · Angles in Quadrilaterals · Angles in Triangles · Bearings · Properties of Circles · Perimeter · Estimation · Multiplying & Dividing Fractions · Adding & Subtracting Integers · Percentages · Rounding · Simplifying Ratios · Binary Operations · Number Bases.

**Possible next steps.**
- **Closing answer step for the other 19 tools** — each needs its working to end on the answer first:
  - last step is a method note: Simultaneous Equations (Substitution), Comparing & Ordering, Multiplying & Dividing by 10ⁿ, Adding & Subtracting Decimals, Converting Fractions and Ratios, Fractions of Amounts;
  - last step is only part of the answer: Simultaneous Equations (Elimination), Ratio Sharing, Recipes, Angles in Parallel Lines, Basic Angle Facts, Mixed Strategies, Best Buys;
  - last step is a different form of the answer: Completing the Square, Properties of Line Equations, Iteration, Adding & Subtracting Fractions, Speed Distance & Time;
  - answers are lettered options: Collecting Like Terms.
- **More diagram highlighting:** per-step emphasis and derived values for Quadrilaterals, Basic Angle Facts, Parallel Lines, Bearings, Circles, Perimeter (Triangles is the reference); technique-based solving for the angle tools.
- **Make the answer-step split automatic** for every tool whose last step is an inline chain, and grain-robust (see Techniques engine).
- **More pictures:** Iteration and Completing the Square graph builds · Rounding digit-rule picture · Recipes (ratio table) · fractions and percentages (bar model) · Estimation and fractions on a number line.
- **Sandbox integration** — embedding Algebra Tiles / Negative Counters / SmartGrapher as viewports in the solving steps (see Sandboxes & viewports).
- **Techniques as the steps** — converting hand-rolled working onto the engine so every tool's solution is built from shared blocks (see Techniques engine).
- **Runtime grain toggle** ("Detailed working", brief ↔ full) — the one shell-level change still outstanding.
- Picture composites: a step carrying two pictures (ratio table + graph for gradients).

## Depth

**Where it's at.** Built 2026-10-05 as the evolution of the parked Teach decks: not a presentation to press through, but a **bank of fixed, well-thought-out questions** a teacher dips into by purpose (diagnose · explain · extend) and level, to be adaptive to the class and still give depth of reasoning. Shared mode in `ToolShell` (`depthItems` prop, "Depth" tab; **live 2026-10-05** for any tool that passes a bank): picker by level and purpose, two-beat question → answer with named misconceptions per wrong option, adaptive "class secure / not secure" links, a cross-level **Start here** quick check, deep links (`?mode=depth&level=&item=`), phone layout. Each question is **two slides** (question, then answer; ← / → / Space) designed like a classroom slide — coloured background, white panel with a DEPTH badge, cartoon speakers with speech bubbles, an owl mascot, tap-the-wrong-line working, a corner pyramid — with a Present mode that works in every browser. Pilot: 21 items on **Order of Operations** (`OrderOfOperationsDepth.ts`). Spec template: `docs/design/templates/DEPTH_SPEC_TEMPLATE.md`.

**Rounding bank (2026-10-06, live):** 25 items, `RoundingDepth.ts`, spec `specs/depth/rounding.md`; number-line scaffold (two side-rail switches) via the generic `custom` visual hook.

**Cast and Feathers (2026-10-07):** speakers use a named cast of eight (`docs/design/CAST.md`); Feathers the owl speaks on every Depth slide (mutable; Depth only); the BIDMAS pyramid has a hide switch; OOO bank is 32 items.

**Speed, Distance & Time bank (2026-10-07, live):** 32 items, `SpeedDistanceTimeDepth.ts`, spec `specs/depth/speed-distance-time.md`; shown on all four tabs (Speed · Distance · Time · Mixed), with tab-specific items via `tool` and `needs`.

**Possible next steps:**
- Harry reviews the live Speed, Distance & Time bank (wording, routes, whether average speed belongs at Level 3).
- Harry reviews the live Rounding bank (wording, missing misconceptions, routes).
- Harry reviews the BIDMAS bank for wording, missing misconceptions and the follow-up routes.
- Add a Depth section to the tool spec template and write banks as tools pass through the Tool review cycle (diagnostic bank per tool, level by level).
- A printable hinge-question sheet from a chosen set of items.
- Whether Teach decks are retired for tools that adopt Depth (`docs/BACKBENCH.md`).

---

## Smart Progressor


> **Where the work is now (2026-10-04).** The mechanism is finished; this prong is **adoption**: audit
> the other 26 ToolShell tools and turn every boolean that really means "harder" into a rung of an
> ordinal pool. Which tools to do first is decided in each tool's Review block (see Tool review
> cycle) — this prong owns the mechanism and the rule, the review owns the order.

> Orders a generated worksheet's questions easy-to-hard instead of randomly, using difficulty
> *weights* already declared on a tool's own QO options — no per-tool progression logic. The
> mechanism is generic and lives once in `ToolShell`/`shared/helpers.ts`; each tool only benefits
> once it is opted in, which is what this prong now drives.

**Where it's at.** Core mechanism shipped 2026-09-15: `ToolMultiSelect.options[].weight?: number`
(`src/shared/types.ts`), the `weightOf`/`sortByDifficulty` helpers (`src/shared/helpers.ts`,
exported from `"../../shared"`), and a sort step in `ToolShell`'s `handleGenerateWorksheet` that
orders each worksheet block (or, for a differentiated sheet, each level's own block) ascending by
a question's `_difficultyScore` — a no-op for any tool that never sets one, so every un-migrated
tool is unaffected. A generator opts in by picking a QO value via `pickActive` as normal, then
looking up `weightOf(pool.options, value)` and attaching it as `_difficultyScore` on the returned
question (see reference below). **One tool piloted**: `SpeedDistanceTime`'s Level 2, which used to
combine an independent `tablesLimit` multiSelect (10×/20×) with a separate
`ALLOW_TERMINATING_DECIMALS` boolean — collapsed into one ordinal pool `DIFFICULTY_TIER_L2`
(`tables10` weight 1 → `tables20` weight 2 → `decimals` weight 3). Refined same-day to be
**mutually exclusive, not overlapping caps**: `tables10` draws its scale factor `k` from 1-10 and
`tables20` from 11-20 *only* (previously `tables20` was "up to 20", silently including every 1-10
fact too, so it didn't read as strictly harder); `decimals` now **guarantees** a genuinely
non-whole answer every draw (`buildDecimalValues` rejects any draw whose speed is a multiple of
the shape's `pp`, the one condition that makes the distance come out whole — verified over 1000
draws, was previously only ~82% decimal, so ~18% of "decimals-tier" questions used to render as a
plain whole number, indistinguishable from the easier rungs on a printed sheet). The general rule
this pilot established: **a boolean QO option that represents "harder", not just "different",
should be a rung in an ordinal `multiSelect` pool, not an independent `ToolVariable`** — only a
per-question pool pick (via `pickActive`) gives the sort step something to see; a worksheet-wide
boolean toggle can't be progressively ramped within one generation call. A second rule this
refinement adds: **rungs should be mutually exclusive ranges (or a guaranteed property), not
independent caps that silently overlap** — an "up to N" cap that a lower rung's range is already a
subset of doesn't read as harder, and a "sometimes" property undermines the visible ramp on a
printed worksheet.

**Split-balancing shipped same day, 2026-09-15 — the "question 1 isn't guaranteed easy" gap is now
mostly closed.** The original mechanism only *ordered* whatever the batch's random draws happened
to produce — over ~15 questions, `pickActive`'s per-question independent draw could occasionally
land quite skewed (e.g. 9/4/2) across three active rungs, no different from any other multiSelect
pool. `buildQuotaOverrides` (`src/shared/helpers.ts`, wired into `ToolShell`'s
`handleGenerateWorksheet`, never called from a tool file) softens this generically: before
generating a worksheet, it finds every multiSelect group carrying at least one weighted option and
builds a per-question-slot `multiSelectValues` override — each slot still an independent random
draw, but the whole batch is retried (bounded, falling back to an exact largest-remainder split
after 200 tries) until every active option's count lands within ±1 of its fair share. **First cut
of this forced an exact split every time (5/5/5, always)** — corrected same session after the user
clarified the actual ask was "roughly 33%", explicitly fine with an outcome like 6/5/4: "I don't
want to go against it here, but I think the idea of ending up with a 6/5/4 wouldn't be awful. Hence
why I said roughly 33%." The ±1-tolerance retry keeps real variety across generations (4/5/6,
6/5/4, 5/5/5, … all normal, verified directly: 100 repeated runs at 15 questions/3 rungs produced
7 distinct permutations of {4,5,6}, never anything more skewed) while still ruling out a lopsided
worksheet. Combined with the ascending sort, a worksheet's tier *blocks* stay contiguous and
correctly ordered whatever the exact split turns out to be — a 6/5/4 split still means the first 6
questions are the easiest rung, the last 4 the hardest; only the block sizes vary, by design.
**Scoped to weighted groups only**: a group with no weighted option (e.g. SDT's "Units"
mph/km·h/m/s pool) is passed through completely untouched and keeps varying randomly per question,
per the user's own framing — that requirement doesn't apply to "something like km/h vs mph".
**What's still not a hard guarantee:** which *specific* question lands in which position within a
tier is still random (only the tier a slot belongs to, and roughly how many slots it gets, is
constrained), and the original "Option B" (narrowing the QO snapshot passed into
`generateQuestion` itself, per question index) still isn't expected to be needed — the balancing
mechanism gets a good-enough practical outcome without touching `generateQuestion`'s contract.

**The audit's deciding test, sharpened 2026-09-15: mutual exclusivity, not difficulty.** A boolean
is a conversion candidate only if it's genuinely mutually exclusive with its sibling options (only
one applies to a given question) — that's what makes it fit a `multiSelect` pool at all, difficulty
weighting is a separate add-on on top. A boolean that can *combine* with a sibling on the same
question (rare, but real — e.g. two independent flags both true at once) must stay independent:
either its own `ToolVariable`, or its own separate multiSelect pool — never folded into a pool
alongside something it can coexist with. See CLAUDE.md's "QO control types" section for the full
rule. The quota-balancing mechanism itself needs no extra work for this: `buildQuotaOverrides` is
already generic over the active-option count (verified directly for 2, 4 and 5 active options,
including tight ratios like 5 options over only 15 questions or 4 over 6 — genuine variety, always
within tolerance, no per-count special-casing).

**Scoped to standard worksheet mode, with a teacher-facing off switch — both shipped 2026-09-15.**
The advanced `WorksheetBuilder` (the "Advanced" toggle) was already exempt by construction —
it generates through its own independent code path and never called `sortByDifficulty`/
`buildQuotaOverrides`, since both live entirely inside `ToolShell`'s `handleGenerateWorksheet`,
which only the standard Worksheet tab calls (confirmed by reading both files, not assumed). Added
a genuine teacher-facing "Smart Progressor" toggle in the Worksheet tab's Settings popover
(alongside "Borders"), on by default, session-persisted per tool route — turning it off restores
generation to exactly how it worked before this prong existed (every question slot gets the same
unmodified `multiSelectValues`, no quota override; the generated batch is left in its raw random
order, no sort). The toggle only renders for a tool that actually has a weighted multiSelect pool
at all (`toolHasWeightedPool`, checked across every level) — invisible clutter otherwise, since
it'd be a no-op for the other 26 tools today. Verified live in the running app (not just build/
test): the toggle appears in SpeedDistanceTime's Settings popover, is absent from
CompletingTheSquare's (no weighted pool), and toggling it off + generating produces zero console
errors.

**Every existing boolean QO is a 2-option-pool candidate, not just 3+-option ones — the mental
model needs to widen.** Sharpened via a concrete example: a quadratic tool's "allow negative
coefficients" can't stay a single `allowNegative: boolean` if it's meant to participate in the
Smart Progressor, because a worksheet-wide toggle can't let question 3 draw "non-negative" while
question 9 draws "negative" — that per-question distinction is exactly what a `multiSelect` pool
gives you, even with only two rungs (`nonNegative` weight 1, `negative` weight 2). Expect most of
the audit below to turn booleans into 2-option pools, not just tools that already had 3+ named
states like SDT's Times Tables.

**The popover-weight worry this raises was real, and it's solved — 2026-09-15.** If most booleans
turn into 2-option pools, a tool with several such properties would stack a full pill-row block per
pool, making the QO popover "incredibly heavy" (the user's own words) exactly as differentiation
needs grow. Fix: a 2-option pool where **both** options carry `weight` now renders as one compact
click-to-cycle button (**None → Mixed → Exclusive**, i.e. easier-only → both active → harder-only)
instead of a two-cell pill row — several sit inline in one row rather than each claiming a
full-width block. Purely a rendering choice: same `ToolMultiSelect` data, same
`pickActive`/`weightOf`/`buildQuotaOverrides`/`sortByDifficulty` pipeline underneath (`CycleSelect`
in `src/shared/components/QOPopovers.tsx`, detected automatically — a 2-option *peer* pool with no
weight, like two unit families, still renders as the normal pill row). Built and verified live in
the running app (not just build/test): with an unweighted 2-option pool (SDT's Units) and a
weighted 3-option pool (SDT's Difficulty) both confirmed to render unchanged (regression-checked),
and a new dev-gated worked example added at `/tool-shell` (Sub-Tool 1's "Negative Coefficients
(demo)" pool, visible only with Developing-tools mode on) confirmed end-to-end: absent when dev
mode is off, present and cycling None→Mixed→Exclusive→None correctly when on, `generateQuestion`
reading the picked value and attaching a real `_difficultyScore`, zero console errors.

**The CycleSelect visual decoupled from Smart Progressor semantics — 2026-09-19, surfaced by
Surds.** Not every 2-option pool that wants the compact cycle button is a difficulty ladder — Surds'
Simplifying tool has a genuine common/rare *trap* pair (obvious extraction vs. a rare "already a
perfect square" case, meant to stay ~8%, read via a new `pickRare` picker rather than
`pickActive`), and giving it `weight` just to get the cycle-button look would have silently pulled
it into `buildQuotaOverrides`' even-split balancing — turning an intentionally-rare trap into a
forced ~50/50. Added `cycleDisplay?: true` to `ToolMultiSelect` (`src/shared/types.ts`) as an
alternative trigger for the same button (`isCycleGroup` in
`src/shared/components/QOPopovers.tsx` now checks `cycleDisplay || both options weighted`), so a
tool can opt into the compact visual without opting into the balancing — a genuinely rare pool
stays rare, a genuine difficulty ladder still gets both via `weight` as before. Reference:
`SIMPLIFY_RADICAND_L1_MS` (`cycleDisplay`, no weight, read via `pickRare`) vs. `SIMPLIFY_COEFF_L3_MS`
(`weight` on both options, a real easy/hard choice) in `src/tools/Number/Surds.tsx`.

**Two correctness bugs fixed 2026-09-16, surfaced while extending the pilot from L2-only to all
three levels of `SpeedDistanceTime`** (the user noticed L1 still showed "Allow decimal answers" as
a plain boolean and asked for genuine full-tool coverage):
- **Regenerating a single worksheet question lost its Smart Progressor tier.** `ToolShell`'s
  `handleGenerateWorksheet` stamped every question in a block with the SAME `_qo` snapshot (the
  shared pre-balancing `multiSelectValues`, all rungs active), not the per-slot override
  `buildQuotaOverrides` actually generated it from — so `regenQuestion` re-rolled against the full
  unbalanced pool instead of the question's own rung. Fixed by stamping each slot with its own
  override (`src/shared/ToolShell.tsx`, both the differentiated and flat branches).
- **The "decimals" rung's guarantee wasn't target-aware — it could guarantee the wrong quantity.**
  A time shape's `D = k·qq` and `S = k·pp` can only BOTH be forced decimal (via `k = n+0.5`) when
  both pp and qq are odd, which never holds for L3's compound-time shapes (pp is always even by
  construction) and never holds for L2 shapes at all (qq is always exactly 1, so S = k·pp is only
  decimal when pp itself is odd — true for just 3 of the 9 L2 minute values). The fix makes
  `pickShape`/`buildValues` **target-aware**: `buildCommon` takes a `target: "S" | "D"` (genSpeed
  passes `"S"`, genDistance/genTime pass `"D"`), and shape selection picks a TM whose reduced
  pp/qq lines up with whichever field THIS subtool's own answer actually is — so a Speed
  question's "decimals" tier now genuinely guarantees a decimal speed, not just a decimal
  distance it never asks for. Also let the old L2-only `buildDecimalValues` helper be deleted
  entirely — the unified `buildValues` (with its `forceDecimal` flag) now covers all three levels,
  since L2's qq=1 turned out to be the same shape as L1's pp=1, just mirrored.

**Possible next steps:**
- Audit the other 26 tools' `variables`/`multiSelect` against the mutual-exclusivity test above:
  convert genuinely mutually-exclusive, difficulty-ordinal booleans (per the SDT pattern); leave
  combinable/independent ones as `variables`; split anything that's mutually exclusive but *not*
  difficulty-ordinal (pure variety) into its own unweighted pool rather than forcing it into a
  difficulty ladder — same shape as the Techniques engine's per-tool sweep, worth tracking as a
  table here or in `docs/TOOL_AUDIT.md` once a few more conversions establish the pattern.
- Consider a light shuffle-within-band (rather than a strict stable sort) if pure ascending order
  ever reads as too mechanical on a printed sheet — not needed yet, no evidence of it being a
  problem.
- If a tool ever needs more than one weighted group active at once (quotas today are computed
  independently per group, not cross-multiplied), watch for whether that reads oddly on a printed
  sheet — no tool has hit this yet.
- When a second tool is piloted, check whether its "decimals"-style guarantee (if it has one) needs
  the same target-awareness fix above — any tool where the difficulty rung's guarantee depends on
  which of two derived quantities is the actual displayed answer is at risk of the same bug.

**Reference implementation:** `src/tools/Proportion/SpeedDistanceTime.tsx` — `DIFFICULTY_TIER`
(pool + weights, shared across all 3 levels), `TABLES_TIER` (value → params lookup), `pickShape`'s
target-aware shape selection, and `generateQuestion`'s unified tier branch (pick → `weightOf` →
attach `_difficultyScore`).

## Core representations

> **Active development prong (2026-10-04).** The remit: where each representation is used, which
> tools need making, which sandboxes need making (see Sandboxes & viewports), and how the pictures
> evolve into each other. The Teach-deck / skill consumers of these scenes are benched
> (`docs/BACKBENCH.md`); the working-step and sandbox consumers are live.

**Where it's at.** The site commits to **seven core visual representations** as a shared vocabulary,
so the same bar model a student meets in fractions reappears in ratio. New visuals must reuse one of
the seven; new Teach-deck scenes extend an existing `TeachScene` family in `TeachingDeck.tsx`. **Three
have animated scene families built**: bar model (`split`/`combine`/`equivalents`), number line
(`multiples`), prime factor tiles (`factorTree`/`primeVenn`). **Three don't yet** (area model, algebra
tiles, negative counters) — these remain the biggest lever on the Teach-deck side, each unlocking a
cluster of skills and decks. **The seventh, ratio table** (added 2026-09-12, `src/shared/ratioTable.ts`
+ `src/shared/components/RatioTable.tsx`), is a *working-step* representation rather than a Teach-deck
scene — it's already live in `SpeedDistanceTime`'s worked examples and doesn't have (or need) a
`TeachScene` family, so it sits outside the six-vs-seven Teach-deck tally above.
**2026-10-04 additions.** The **place value table** now also carries **binary and hex** (place-value headings 128…1 / 16, 1; nibble rule; `current` and `lost` tones; `pvBaseColumnSet`) and is the working picture for Number Bases and Binary Operations; the **carry ripple** model (`src/shared/carry.ts`) narrates carries and overflow in any base; the grapher gained a labelled **`Segment`** (gradient triangle); the Geometry diagrams now **evolve** (per-step emphasis, derived values in green) — see the open question below, which this partly informs.
**Open question surfaced by the Tool Audit's Geometry pass:** none of the six obviously cover an
angle/circle/polygon SVG diagram — every Geometry tool independently hit this same gap, and the
diagram itself appears to function as its own representation, outside the six-vocabulary system
entirely. Recorded as a standing open question (`docs/TOOL_AUDIT.md`'s Geometry category summary),
not assigned an owner — a decision on whether Geometry needs a seventh representation, or is
legitimately exempt, is still open.

**Possible next steps — see the open questions above.** Kept here for background only: build an area-model scene family
(unlocks `expand-double-brackets`, `factorise-quadratic`, `completeTheSquare`); build algebra-tile
scenes (unlocks `solve-linear-equation`, `collect-like-terms`); build negative counters (unlocks
`directed-number`). **The audit resolved the "prioritise by blockage" call this list used to leave
open**: algebra tiles now gates 5 tool-consumers across its two skills vs. area model's ~3 — algebra
tiles has the stronger case, ahead of negative counters' single consumer (`directed-number`,
`IntegerAddSub` only).

### Representation progressions & composites (direction agreed 2026-10-03 — planning, nothing built yet)

The goal is not just a complete set of agreed representations but **how they evolve into each other**, and
**where one question needs two at once**. The developing-picture layout (`stepVisualRenderer` — see
`CLAUDE.md`'s "Split worked example") is the delivery vehicle for all of it.

**Status (2026-10-03):** negative counters are built as a shared component + `/negative-counters` sandbox; signed bar model, double number line and the representation switch are not started.

**Progressions** — the same idea carried from concrete to abstract, so a student meets one picture become the next:

| Strand | Progression | Where it lands first |
|---|---|---|
| Ratio & proportion | **double number line → ratio table** (the table is the double line with the lines turned into rows/columns, scale arrows kept) | Ratio sharing / speed-distance-time / recipes (ratio table already live) |
| Directed numbers | **negative counters → bar model with negatives → number line** (zero pairs → signed bars either side of zero → jumps) | Integer Add/Sub (number line already live) |

**Composites** — a question that needs two representations on screen together, each developing on the same steps:

- **Finding gradients: ratio table + SmartGrapher** — rise and run as a ratio table (scale to "per 1 across") beside the
  line being plotted; the unit row of the table is the gradient the graph shows. First candidate: `EquationsOfLines`'
  gradient sub-tool.
- (Others to be identified as tools are audited — e.g. a place value table beside a number line for rounding decimals.)

**What's needed to build this (none of it started):**
1. **The missing representations as shared components**, like `PlaceValueTable`/`RatioTable`: negative counters,
   a *signed* bar model (the existing bar model is parts-of-a-whole; this one has direction either side of zero — needs one
   agreed colour/side scheme so counters and bars match), a double number line.
2. **A representation switch** on tools that span a progression (a `workedExampleOnly` dropdown like Rounding's
   "Working method", or per-level — open: counters at L1, bars at L2, number line at L3, or teacher's choice). Same question
   and answer; only the picture and its stage stamps change.
3. **Composite visuals** — today a step stamps ONE picture. A composite needs a step to carry two (stacked in the panel),
   each with its own stage. Likely a small extension to `stepVisualRenderer`'s contract rather than a new layout.
4. **Teach decks / skills** can then play the *same* example through successive representations (counters → bars → line),
   which is the stated purpose of the vocabulary above.

**Open questions:** per-level vs teacher-chosen representation; whether the signed bar model is a new family or a
variant of the bar model; how the progression is recorded for skills ("evolves from" links?).

**Detail — the six and their scene status.** Bar model ✅ (`split`/`combine`/`equivalents`) · number
line ✅ (`multiples`) · prime factor tiles ✅ (`factorTree`/`primeVenn`) · area model ⬜ (no scenes) ·
algebra tiles ⬜ (manipulative only) · negative counters ⬜ (nothing yet). Prime tiles are coloured by
the prime (2 sky, 3 emerald, 5 amber, 7 purple, 11 pink) so the same prime looks the same everywhere;
composites stay plain numbers. Adding a scene type: extend the `TeachScene` union, add its beat count
to `sceneMaxStep`, render it in `SceneView` — animate opacity/transform only, reserve space for
everything (the standing scene contract).

**Open questions to look at as we work (not for answering now).**
- Which ships next — **algebra tiles or the area model**? Algebra tiles gates more (5 tool-consumers: `solve-linear-equation`, `collect-like-terms`) than the area model (~3: `expand-double-brackets`, `factorise-quadratic`, `completeTheSquare`).
- Does an angle / circle / polygon diagram need a **seventh representation**, or is "the diagram is its own representation" a legitimate standing exemption? Raised independently by all 8 Geometry tools in the audit.
- Per-level vs teacher-chosen representation; whether the signed bar model is a new family or a bar-model variant; how "evolves from" is recorded.


## Sandboxes & viewports

**The idea.** An interactive sandbox is built **as a tool on its own first**, usable standalone in a
lesson, and then **built into question tools as a viewport** on the solving. Sandboxes share a page
layout and toolbar so they feel like one family.

**The three-step pattern (agreed 2026-10-04).** Every sandbox goes through the same stages:
1. **Standalone tool** — usable on its own in a lesson (Algebra Tiles, Negative Counters, SmartGrapher's use in tools).
2. **Lab / preview bench** — an intermediate page to *see how it looks and behaves driven by question data before it is embedded*, so "looks right here" means "right in the tool". Grapher Lab already does this for SmartGrapher (pick a scenario, edit the numbers, watch the exact embeddable component redraw). **Counters and tiles need the same:** a bench that feeds the embeddable representation component (counter board / tile board) the same data a question would, at each working step, in the real viewport size.
3. **Embedded viewport** — the same component inside a question's solving steps.

This keeps Grapher Lab in this prong as the model for the other two benches. A typed-function Desmos-style graphing sandbox is a possible later build, not now.

**Where it's at.**
- **Algebra Tiles** (`/algebra-tiles`) — live, standalone. Tiles, multiplication grids, zero pairs, pen / eraser / pan, expression builder. Not yet a viewport anywhere; needs a shared representation component (like counters have) before it can be embedded.
- **Negative Counters** (`/negative-counters`) — live, standalone, same page layout as Algebra Tiles; yellow +1 / red −1, boxed zero pairs that move as a group, a + / − table, the shared toolbar. Its shared `CounterBoard` already draws the same counters and pair boxes inside worked solutions; making Integer Add/Sub use it as a viewport is **deliberately held** until the sandbox itself is right.
- **SmartGrapher** (`src/shared/grapher/`) — a mature, embeddable graph, already a viewport in Properties of Line Equations, Simultaneous Equations (Substitution) and Mixed Strategies, with step-by-step builds. It is a sandbox that needs **better use**, not a project of its own.
- **Grapher Lab** (`/grapher`, dev-gated) — SmartGrapher's test bench; part of this prong.
- **Parallel Lines Explorer** (`/parallel-lines-interactive`) — live interactive, part of this prong.
- **Shared toolbar** — Select / Grab / Pen / Eraser / Clear drawings / colours (`DrawHotbar` in `src/shared/components/BoardTools.tsx`); new sandboxes reuse it.

**Possible next steps.**
- Build the **lab benches** for counters and tiles (step 2 above) — each is a dev-gated page, like Grapher Lab, that renders the shared representation component from sample question data.
- Define the **viewport pattern**: how a sandbox is embedded in a question tool (via `questionRenderer` / `stepVisualRenderer`), driven by the question's data, and whether the student/teacher can then drive it or it plays the working.
- Extract an **Algebra Tiles representation component** so it can sit in solutions.
- Counters as a viewport in Integer Add/Sub (held), then the signed bar model → number line progression.
- SmartGrapher: Completing the Square (parabola + vertex) and Iteration (curve and root — the top unwired candidate); an ellipse preset for `NonLinearSimEq`.
- Decide which other interactives count as sandboxes as they appear.

### SmartGrapher (detail)

> A sandbox that needs **better use** (not a prong of its own): a quick in-lesson graph instead of
> leaving the software, and an embeddable viewport for solutions. Wiring it into more tools is a
> Sandboxes & viewports next step and a per-tool call in the Tool review cycle.

**Where it's at.** A **mature**, embeddable, data-driven graph component (`src/shared/grapher/`)
with its own test bench at `/grapher`. Live in three tools (Mixed Strategies L3 lower-envelope,
NonLinearSimEq two-curves-plus-intersection, and — wired 2026-08-18 — EquationsOfLines'
line-through-the-known-points graph across all three sub-tools) and **self-validating** — it
derives the graph from the
answer data and refuses to draw if they disagree, so a data inconsistency omits the graph rather than
drawing wrong geometry. Less a "project", more a reusable utility to reach for. The Tool Audit's
Algebra pass confirmed both `CompletingTheSquare` and `Iterations` are still fully unwired (zero
grapher usage found in either file) despite already being named candidates below — `Iterations` in
particular is now flagged as the highest-leverage unwired candidate found so far, since the tool is
fundamentally about visualising convergence to a root yet has zero visual content today, and the
`quadratic`/`cubic`/`custom` presets already cover its formula types directly. Also confirmed:
`NonLinearSimEq`'s own ellipse limitation (only pure circles get a graph — two-thirds of its Level-3
non-linear questions draw no curve, since ellipse isn't a supported series type) is disclosed in the
tool's own info modal, not a silent gap.

**Possible next steps (background, pre-audit — SmartGrapher fit is now also part of the Tool Audit's
Part 1 per tool, see `docs/TOOL_AUDIT.md`):**
- ✅ **Equations of Lines** wired (2026-08-18) — a line-through-the-known-points graph for all
  three sub-tools (`gradient`/`equation`/`missing`), revealed on the Whiteboard alongside the answer.
- Add graphs to the remaining candidates — **Completing the Square** (parabola + vertex, confirmed
  still unwired), **Iterations** (the curve and the root being approached, confirmed still unwired
  and now the top candidate).
- Add an **ellipse preset** if/when a tool needs ellipse-and-line (presets today: linear · quadratic · cubic · circle · custom) — would close `NonLinearSimEq`'s disclosed ellipse gap.
- Mostly: pull it in opportunistically when building or migrating any coordinate/quadratic tool.

---

# Standalone prongs

# Computer Science

> **⏸ Parked as a priority** (standalone prong); worked on on request.

An OCR **J277 GCSE Computer Science** revision area. CS tools are **knowledge/revision** tools,
not question generators — a different product from the Maths tools, on their own shell (`CSShell`,
`src/shared/cs/`). Each tool covers a spec sub-topic through six activities: **Learn · Study ·
Cards · Quiz (+ Spot the Mistake) · Fill · Exam** (synoptic questions, self-marking). Guiding
principles: **spec fidelity** (every card/question carries a `specTag`; off-spec content is a
flagged "Beyond spec" layer), **exam realism** (J277 formats + mark tariffs), **mobile-first**.

## CS revision shell

**Where it's at.** The shell is **fully built** — six modes driven by a single `topic` data
object, two representations so far (box schematic, trace table), and a CI validator
(`validateTopic`) that checks every topic. The payoff is proven: **two topics now ship as pure
data files** — 1.1.1 CPU Architecture (the pilot/reference) and 1.1.2 CPU Performance. So the
remaining spec is *authoring*, not engineering. The architecture and extraction steps live in
`docs/architecture/CS_SHELL_PLAN.md`.

**Possible next steps (spitball — pick on the day, once unparked):**
- Author the next sub-topic as data — **1.1.3 Embedded Systems** is the natural follow-on (mostly definitional, few new diagrams).
- Or do a synoptic partner first — **1.2.1 Primary storage (RAM/ROM)** pairs tightly with 1.1.1 (MAR/MDR ↔ RAM).
- Pull synoptic questions out of individual topic files into a **shared cross-topic bank** keyed by tag-pairs (now worthwhile with >1 topic).
- Build a new representation when a topic demands it (data representation → place-value/number-line; networks → stack/topology).
- Keep the pipeline honest — a `Status: ready` brief in `specs/cs/` before each topic.

**Detail.**

*Built so far:*
- ✅ **1.1.1 CPU Architecture** (`/cpu-architecture`) — the pilot/reference. Full six modes with taught diagram walkthroughs, predict beats, animated data flow, a value trace; exam with MCQ/state/short/scenario/extended + synoptic, self-marking, model answers, command-word guidance.
- ✅ **1.1.2 CPU Performance** (`/cpu-performance`) — authored entirely as a `CSTopic` data object.
- ✅ **1.1 System Architectures** (`/system-architecture`) — the original tool, left in place; superseded in approach by the 1.1.1 rebuild; not on the new shell.

*Spec order to roll through (Component 1, Paper J277/01), each a data topic:*
- ⬜ **1.1.3 Embedded Systems** — mostly definitional.
- ⬜ **1.2.1 Primary storage (RAM/ROM)** — the other 1.1.1 synoptic partner.
- ⬜ **1.2.2–1.2.4 Secondary storage / units / data representation** — data representation needs number-line / place-value representations.

## CS procedural generators (on `ToolShell`)

**Where it's at.** The procedural half of J277 1.2.4 (Numbers) is built as `ToolShell` question
generators in `src/tools/Binary/` (category "Binary & Number Bases"), not `CSShell` topics — they
are practice skills, not recall. `ToolEntry.levels` lets each sub-tool have only the levels the spec
supports. **Binary Operations** (`/binary-addition`, live) — Addition (3 levels) + Shifts
(2 levels: do the shift; then state the denary effect; "Bits lost" Never/Mixed/Exclusive for
overflow/underflow). **Number Bases** (`/number-bases`, live) — Denary↔Binary, Denary↔Hex,
Binary↔Hex, 2 levels each (nibble / byte), a Direction pool per tab.

**Possible next steps:**
- ✅ **Stage 1 done:** Binary Counting sandbox (`/binary-counting`, dev-gated) + base-aware shared place value table (`pvBaseColumnSet`, `groupEvery`). Brief: `specs/cs/binary-counting.md`.
- Reuse `rippleIncrement` (`src/shared/carry.ts`) for the carry/overflow explanations in stages 2–3, so the same wording appears in Binary Counting, Number Bases and Binary Operations.
- ✅ **Stage 2 done:** Number Bases worked examples now use the shared place value table (`pvStep`, headings 128…1 / 16, 1).
- ✅ **Stage 3 done:** Binary Operations worked examples (addition columns with carries above, shifts with lost bits outside the register) are on the shared table; the duplicated KaTeX grid is retired. Worksheet/print layouts unchanged (text questions, no grid) — revisit only if grids are wanted on the printed sheet.
- ✅ **Data Units** (`/data-units`, dev-gated) built — bits/nibbles/bytes → PB on the ×1000 scale; brief `specs/data-units.md`. Next: ladder as an evolving worked-example picture; file-size calculations on the same ladder.
- Gather classroom feedback on Number Bases and Binary Operations (both live), and on Binary Counting before it goes live.
- Other procedural 1.2.x skills that fit the same pattern: file-size / units calculations (1.2.2), bitmap and sound file sizes (1.2.4 Images/Sound).
- ⬜ **1.3 Networks**, **1.4 Network security**, **1.5 Systems software**, **1.6 Ethical/legal/environmental** — Networks needs a stack/topology representation; the later strands are largely prose + scenario.

*Representations (the recurring design cost):* existing from 1.1.1 are the **box schematic** (to be generalised) and the **trace table**. Likely additions: **bar-compare** (1.1.2), **place-value/number-line** (data representation), **network stack/topology** (1.3). Budget ~1–2 new representations per *strand*, not per topic.

*Nice-to-haves (deferred):* spaced-repetition / Leitner progress + per-spec-tag mastery, and RAG self-rating — both need a persistence/account layer that doesn't exist yet.

---

# Decision Maths (A-level strand)

> The A-level strand is **Decision Maths** together with the **P-Value Grapher** (statistics). P-Value Grapher is a live interactive tool and belongs to this strand, not to the Sandboxes prong.


> **⏸ Parked as a priority** (standalone prong), but worked on on request: a first **Travelling Salesperson** slice landed 2026-09-23 (below). Every Decision tool stays **dev-gated** (`enabled: false`) until the strand is deliberately taken live.

AQA A-level Further Maths, **Discrete Mathematics** (graphs & networks: MST, TSP, CPA, Dijkstra,
route inspection, flows, LP). A network-native shell (`DecisionShell`, `src/shared/decision/`),
parallel to the others; contracts and the full increment plan live in `docs/architecture/DECISION_SHELL_PLAN.md`.

## Decision tools

**Where it's at.** **Increment 1 shipped** — the first end-to-end slice: pure `NetworkView` +
`MatrixView` renderers, a thin shell with a **Question** mode and a **Solution** stepper
(forward/back through the algorithm one beat at a time, with a running total and a "show all"),
and one tool — **Minimum Spanning Tree** (Kruskal's algorithm). CI checks each tool's solver
against an independent brute-force reference. Deliberately narrow so far: one network template,
one question type, one level. Also now available: `src/shared/decision/randomNetwork.ts`'s
`generateRandomNetwork()` — a procedural, provably crossing-free network generator (Euclidean MST +
crossing-checked extra edges) harvested from an old archived draft, with a best-effort
`routeInspection` mode for a future Route Inspection / Chinese Postman tool. Not wired into any
tool yet — see `DECISION_SHELL_PLAN.md` → "Templating model" for the detail.

**Network Flows — built (2026-10-08, dev-gated — `enabled: false`).** `/network-flows`, spec `specs/flow-networks.md`.
Top tier **Capacity only ⇄ Min and max**; beneath it six question styles — **Find a flow** (a real route-by-route method),
**Missing flow**, **Flow from potentials**, **Augment flow** (every augmenting path), **Cut values** (one dashed line) and
**Max flow & min cut** — at three levels that are graph size (4–5, 6–7, 8 vertices). **Nine network styles** (Diamond, Fan,
Mini hub, Zigzag, Ladder, Hexagon, Double hub, Tower, the big 8-node network), ~320 variants once optional/reversible arcs are
counted; every question has at least one reversed arc. Question Options: backward arc (cuts), backward step (augment / max flow),
and **Numbers** (small / tens / hundreds — the picture stretches to fit four-digit labels). Pure solver in `shared/decision/flow.ts`;
flow-first generator (`flowGenerate.ts`); worked solution in `flowSolve.ts`; `FlowView` + shared label geometry
(`flowGeometry.ts`, joint `layoutNetwork`), tested exhaustively by `flowLayout.test.ts` and `flowLogic.test.ts`.
`DecisionShell` gained sub-tool tabs, top-tier options, per-sub-tool options, a custom canvas and footer, whole-area fullscreen,
a Show all toggle that returns to the same step, and a "reload the page" fallback if generation fails.
**Exam-board check (Edexcel D2 / AQA Further Maths Discrete):** content and method match; Missing flow and Flow from potentials are deliberate stepping stones; bare S–T networks (no real-world context) are fine for this tool. **Next build (agreed):** **supersource / supersink** (several sources or sinks, with the capacities on the added arcs) and **restricted capacity at a node** (split the node into two joined by an arc) — both listed as exam items; the info modal / terminology should be re-checked against a real mark scheme when one is to hand.
**Next:** info-modal review with Harry, phone check on a real device, Harry's-notes update, then go-live decision.

**Travelling Salesperson — first slice shipped (2026-09-23, dev-gated — keep `enabled: false`).**
`/travelling-salesperson` does the **nearest-neighbour upper bound** at three levels: complete K4–K6
networks (L1); practical networks completed into a table of least distances first, then NN, with
the tour expanded back into the real network (L2); and the same with a direct edge that a detour
beats (L3). Shared helpers in `src/shared/decision/tsp.ts`; the shell gained a level picker and
matrix-in-question. CI checks each answer against an independent Dijkstra + NN.
**Layout pass (same session, user-reviewed):** one layout in both modes — the network on a white card
left, a sidebar of cards right (question / step caption with phase badge + running total, "Route so
far" trail, matrix), a colour-key strip under the network, zoom controls moved to a compact top-right
pill away from the stepper, visit-order badges. Applies to MST too.
**Not yet:** lower bound, NN-from-every-start, print, sandbox-expand, and a classroom trial.

**Possible next steps (spitball — pick on the day, once unparked):**
- Broaden MST — add **Prim's** (network walk + Prim-on-the-matrix), more question types (apply Prim from node X, list rejected edges), Levels 1–3, more templates.
- Add the **expand-to-sandbox** — open the generated network in an interactive, annotatable canvas.
- Add **worksheet print** via the existing diagram-print engine.
- **TSP lower bound (recommended next)** — the deleted-vertex **lower bound** (MST of the rest + two shortest edges back), then question types that combine them ("the optimal tour T satisfies lower ≤ T ≤ upper"), NN from every start / best upper bound, and tour-improvement. The `leastDistances` table and `MatrixView` override are already in place.
- **CPA** needs two new views (`ActivityNetworkView`, `GanttView`).
- Build **Route Inspection (Chinese Postman)** on top of `generateRandomNetwork`'s `routeInspection` mode — the odd-degree-nudge groundwork already exists.

**Detail.** The full increment ladder (MST breadth → sandbox → print → TSP → CPA → onward) and the
per-strand representation budget live in `docs/architecture/DECISION_SHELL_PLAN.md` → "Increment plan" — that doc owns
the ladder. **Increment 1 ✅**, and the first slice of **increment 5 (TSP — nearest neighbour) ✅** was
built ahead of order at the user's request. Next is either the TSP lower bound (continuing the TSP
thread) or **increment 2 (MST breadth)**.

---

*Keeping this current: when a session moves a prong, update its **Where it's at** line and its *At a
glance* row here, alongside the `docs/PATCH_NOTES.md` history entry. Next-step bullets are spitball — prune
the done/ruled-out ones. Paused work is tracked in `docs/BACKBENCH.md`. The original per-tool audit
findings live in `docs/TOOL_AUDIT.md`; the live per-tool review lives in each tool's note.
(Standing authoring principles — e.g. "never store the same fact twice" — live in `CLAUDE.md`, not here.)*
