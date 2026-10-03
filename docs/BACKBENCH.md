# Back bench — parked until readdressed

Work that is **deliberately not being developed**. It is not retired and the code stays (still behind
the `parkedMode` gate where it was) — it is simply out of the active plan. **Revisit when** the
Techniques engine and the better worked solutions (see `docs/PROJECTS.md` → Techniques engine,
Worked solutions) are in place: both feed Skills and Teach decks directly, so these should be better
supported by then and may be redesigned rather than resumed.

Everything below was lifted **verbatim** from `docs/PROJECTS.md` (2026-10-04) so nothing is lost.
Inline cross-references that remain in `docs/PROJECTS.md` (e.g. a technique row mentioning its
matching skill) are left as background and point here.

Two parked prongs: **Skills library** and **Teach decks**. They are near-twins (a skill is the same
slide engine as a Teach deck, played as a drill-down), which is why they wait together.

---

## Skills library

> **Tier-2 (student-led) — paused, not currently pushed.** The site isn't currently positioning
> itself as a self-teaching tool, so this isn't a current investment target. Not being retired —
> just not where the next session's effort should default to.

**Where it's at.** Small slide-sequences that each teach **one prerequisite skill**
(`src/shared/skills/`), browsable at `/skills`, and the drill-downs behind `[[skill-id|term]]`
links in worked examples. **Two skills exist** (`lcm`, `lcm-prime-factors` — LCM two ways). CI
validates every skill. A clear backlog is tied to which representation each skill needs — the cheap
ones sit on scenes that already exist; the rest wait on the representation work below.

**Possible next steps (background, pre-audit — see the sequencing note above):**
- Build the **cheap, high-value cluster** on existing scenes — equivalent-fractions, simplify-fraction, HCF, share-in-ratio, fraction-of-amount, convert-mixed-improper.
- Sequence the skills that need a **new scene** (solve-linear-equation, expand-double-brackets, directed-number) alongside the representation work.
- **Unify skills with techniques** — let a skill's full teaching and a technique's full output share one source, so they can't drift; prototype on one skill.
- **Link `brief` technique steps to their skill** via `[[skill|term]]`, so an assumed move drills down to the full visual teaching.

**Detail — skills to develop** (a skill is the drill-down teaching for a prerequisite a tool *uses
but doesn't teach*; the representation column signals effort — existing scene = cheap).

| Skill (id) | Teaches | Representation / scene | Priority | Status |
|---|---|---|---|---|
| `lcm` / `lcm-prime-factors` | lowest common multiple | number line `multiples`; prime tiles `factorTree`/`primeVenn` | — | ✅ — unlinked consumers found: `SimultaneousEquations`' `lcm` sub-tool (Algebra pass), `FractionToRatio`'s L2 "LCD:" step (Ratio & Proportion pass) — both compute the value but never link it |
| `equivalent-fractions` | scale num & den by the same factor | **bar model** `split`/`equivalents` *(exist)* | **high** | ⬜ — needed by `FractionsAddSub` |
| `simplify-fraction` | divide num & den by the HCF | **bar model** *(exists)* | **high** | ⬜ — needed by `FractionsAddSub`, `FractionMultDiv`, and now `FractionsOfAmounts` (its `asFraction` sub-tool, three consumers total) |
| `hcf` | highest common factor | **prime tiles** `primeVenn` *(exists)* | **high** | ⬜ — needed by `FractionsOfAmounts` (`asFraction`'s HCF step) and `RecipesTool` (its L2 HCF-based scaling step) — first named consumers |
| `share-in-ratio` | total parts → 1 part → each share | **bar model** *(exists)* | **high** | ⬜ — needed by `RatioSharingTool`, the category's sole real demand signal |
| `fraction-of-amount` | ÷ by denominator, × by numerator | **bar model** *(exists)* | **high** | ⬜ — needed by `FractionsOfAmounts`, a near-exact fit since the tool's own working already narrates the bar-model method; `CircleProperties`' `sectors` sub-tool (θ/360 × formula) is also a structurally identical, cross-topic unnamed consumer (Tool Audit, Geometry pass) |
| `convert-fraction-ratio` | express a fraction as a complementary part:part ratio, and the reverse | **bar model** *(existing `split`/`equivalents` scenes — cheap)* | med | ⬜ — new, needed by `FractionToRatio` (Tool Audit, Ratio & Proportion pass); its `convertFractionRatio` technique row had no matching skill row before this pass, breaking the pairing pattern every other row follows |
| `solve-linear-equation` | do the same to both sides | **algebra tiles** / number line *(no tile scene yet)* | **high** | ⬜ — needed by `SolvingLinearEquations`, and now also `BasicAngleFacts` (its L3 algebraic sub-tools) and `AnglesInQuadrilaterals` (its algebra-form questions) — two more unlinked consumers (Tool Audit, Geometry pass) |
| `expand-double-brackets` | grid / area of each term pair | **area model** *(no scene yet)* | **high** | ⬜ — needed by `ExpandingBrackets` |
| `collect-like-terms` | group matching terms | **algebra tiles** *(no scene yet)* | med | ⬜ — needed by `CollectingLikeTerms`, `ExpandingBrackets` |
| `convert-mixed-improper` | mixed ⇄ improper fraction | **bar model** *(exists)* | med | ⬜ — needed by `FractionsAddSub`, `FractionMultDiv` |
| `round-to-significant-figure` | find the place value, round | **number line** *(exists)* | med | ⬜ — needed by `Estimation` |
| `factorise-quadratic` | find the factor pair | **area model** *(no scene yet)* | med | ⬜ — needed by `NonLinearSimEq` |
| `substitute-into-formula` | replace letters with values | *(none — text)* | med | ⬜ — needed by `NonLinearSimEq`, and now also `EquationsOfLines` ("Substitute into y = mx + c") (Tool Audit, Geometry pass) |
| `rearrange-formula` | inverse operations to change subject | *(none — text / algebra tiles)* | med | ⬜ — needed by `Iterations`, `NonLinearSimEq`, and now also `EquationsOfLines` (`missing` sub-tool) and `CircleProperties` (L3 rearranging `C=2πr`/`A=πr²`) — a third and fourth consumer (Tool Audit, Geometry pass) |
| `simplify-ratio` | divide parts by a common factor | **bar model** *(exists)* | med | ⬜ — needed by `FractionToRatio` (`formingRatios`) and `SimplifyingRatiosTool` (numeric sub-tool) |
| `directed-number` | add/subtract/multiply negatives | **negative counters** *(no scene yet)* | med | ⬜ — needed by `IntegerAddSub` |
| `factor-pairs` | list the factor pairs of n | **prime tiles** *(exists)* | low | ⬜ |
| `place-value` | read the column value of a digit | *(none — closest fit is number line; PowersOfTen's own grid doesn't map onto any of the six)* | low | ⬜ — new, needed by `PowersOfTen` (Tool Audit, Number pass) |
| `keep-flip-change` | reciprocal + multiply for fraction division | **bar model** *(no scene authored yet for this specific move)* | low | ⬜ — new, needed by `FractionMultDiv` (Tool Audit, Number pass) |
| `percentage-to-multiplier` | convert a percentage to a decimal multiplier | **bar model** *(exists)* | med | ⬜ — new, needed by `Percentages` (Tool Audit, Number pass) |
| `unitary-method` | find 1%, then scale to the target | **bar model** *(exists)* | med | ⬜ — new, needed by `Percentages` (Tool Audit, Number pass), and now also `RecipesTool` and `BestBuys` (Tool Audit, Ratio & Proportion pass) — three tools across two categories hand-roll this exact reasoning unlinked, the clearest cross-category demand signal found so far |
| `apply-angle-fact` | identify which angle rule applies (sum to 180/360, isosceles, exterior, vertically opposite) | *(none — angle diagrams sit outside the six-representation vocabulary; open question, see Core representations)* | **high** | ⬜ — new, pairs with the `applyAngleFact` technique; needed by `AnglesInQuadrilaterals` (richest demand signal), `BasicAngleFacts`, `AnglesInTriangles`, `AnglesInParallelLines`, `Bearings` (Tool Audit, Geometry pass) — `PROJECTS.md`'s skills table had zero Geometry rows before this pass |
| `unit-conversion` | convert between units of the same quantity (mm/cm/m, etc.) before calculating | *(none — closest fit is number line, same open-question status as `place-value`)* | med | ⬜ — new, needed by `PerimeterTool` (both sub-tools' L3) and `FractionsOfAmounts` (`worded` sub-tool) — two cross-category demand signals (Tool Audit, Ratio & Proportion and Geometry passes) |

Build the cheap cluster (top six after `lcm`) first — all on existing bar-model / prime-tile scenes,
each a prerequisite several tools link to. The equally-wanted `solve-linear-equation`,
`expand-double-brackets`, `collect-like-terms`, `factorise-quadratic`, `directed-number` need a **new
scene type**, so sequence them with the representation work.

---

## Teach decks

> **Teacher-facing in nature, but secondary in practice.** Front-of-class lesson delivery is
> squarely tier-1, but this is the least mature, most authoring-heavy prong — one partial deck for
> one tool. Behind new-tool/utility work until a session specifically wants to prove the format
> further, not because it's the wrong audience.

**Where it's at.** A slide-based "teaching part of the lesson" (`TeachingDeck`), dev-gated. The
**engine is built and proven** — hand-authored, misconception-driven slides the teacher presses
through one beat at a time. **Content is the thin part**: only `FractionsAddSub` has a deck, and
only its *Concepts* category (an I-do → We-do → You-do sequence on equivalent fractions). Its other
two categories (True/False, Spot the Mistake) are stubbed "Coming soon", and no other tool has a
deck yet. So the open question is less "what to build" and more "what proves the format".

**Possible next steps (background, pre-audit — see the sequencing note above):**
- Deepen the exemplar — fill out FractionsAddSub's remaining categories so one deck is complete end-to-end.
- Or prove breadth — author a first deck for a *different* tool, to test the format on another topic.
- Sketch a deck for a non-fraction topic (angles, ratio) to check the scene library actually covers it.
- Reconsider what categories a deck should even have — the current three (Concepts / True-False / Spot-the-Mistake) are a starting guess, not settled.
- Decide the bar for **coming out from behind the dev gate** (`showTeach` in `ToolShell.tsx`) — needs ≥1 genuinely classroom-ready deck.

**Detail.** Authoring guide is in `CLAUDE.md` → "Teaching slides". Slides are specific, hand-authored,
misconception-driven — *not* generated (the varied side is what Whiteboard/Worksheet are for). Prefer
I-do → We-do → You-do within a category on one coherent example. Reference: `FractionsAddSub.tsx`
(`TEACHING_SLIDES`).

---

## Roadmap items lifted from the old "Part 1 roadmap"

These were the Skill / Teach-deck entries in the old cross-prong build order. The Technique items from
the same roadmap now live in `docs/PROJECTS.md` → Techniques engine.

- **Tier 0 — [Skill]** Link the two unlinked `lcm` consumers — `SimultaneousEquations` and `FractionToRatio` both compute an LCM and never mark it, and the skill is already built. Two `[[lcm|LCM]]` markers. Built, dev-mode only.
- **Tier 2 — [Technique + Skill]** `applyAngleFact` / `apply-angle-fact` (5 of 8 Geometry tools — the technique half stays in Techniques).
- **Tier 2 — [Skill]** `rearrange-formula` — 4 consumers (`Iterations`, `NonLinearSimEq`, `EquationsOfLines`, `CircleProperties`), text-only, no blockers.
- **Tier 2 — [Skill]** `unitary-method` — 3 consumers across two categories (`Percentages`, `RecipesTool`, `BestBuys`), bar model already exists.
- **Tier 2 — [Skill]** `simplify-fraction` — 3 consumers (`FractionsAddSub`, `FractionMultDiv`, `FractionsOfAmounts`), bar model already exists.
- **Tier 3 — [Skill]** `fraction-of-amount`, `hcf`, `substitute-into-formula`, `convert-mixed-improper`, `simplify-ratio`, `unit-conversion`; **[Technique + Skill]** `expandBrackets` / `expand-double-brackets` (blocked on the area-model decision).
- **Tier 4** — single-tool skills: everything else in the skills table above.
- **Cross-cutting — [Deck]** Teach decks stay the least mature prong (1 deck, 1 category built) — reasonable to leave last unless a second proof-of-format deck is wanted as a parallel, low-stakes task.
- **Representation scenes** that exist only to serve skills / decks: algebra-tile scenes (`solve-linear-equation`, `collect-like-terms`), area-model scenes (`expand-double-brackets`, `factorise-quadratic`), negative-counter scenes (`directed-number`). The representations themselves are developed in `docs/PROJECTS.md` → Core representations / Sandboxes.

## Two gates (reference)

**Developing-tools mode** (`src/devMode.ts`) is for things in the pipeline; **parked mode**
(`src/parkedMode.ts`) is the stronger, unadvertised gate (`?parked=1`, routes 404 without it) that
currently hides the **Skill Library** (`/skills`) and the **Teach** deck mode. Unparking either is a
deliberate decision, not a side-effect of turning on Developing-tools mode.
