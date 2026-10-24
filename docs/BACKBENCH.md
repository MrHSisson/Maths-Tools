# Back bench — parked until readdressed

Work that is **deliberately not being developed**. It is not retired and the code stays — it is simply out of the active plan.
Currently one thing: the **Skills library**. (Teach decks used to be benched here; they are active again as lesson decks —
see `docs/PROJECTS.md` → Lessons and Teach decks and `docs/design/LESSONS.md`.)

**Revisit when** the Techniques engine and the better worked solutions (see `docs/PROJECTS.md`) are in place: both feed Skills directly, so
the library should be better supported by then and may be redesigned rather than resumed.

---

## Skills library

> **Tier-2 (student-led) — paused, not currently pushed.** The site isn't currently positioning itself as a self-teaching tool, so this
> isn't a current investment target. Not being retired — just not where the next session's effort should default to.

**Where it's at.** Small slide-sequences that each teach **one prerequisite skill** (`src/shared/skills/`), browsable at `/skills`
(registered `enabled: false, parked: true`, so it needs `?parked=1`), and the drill-downs behind `[[skill-id|term]]` links in worked examples.
Because the library is parked, those links render as plain text for everyone today (three tools carry markers). **Two skills exist**
(`lcm`, `lcm-prime-factors` — LCM two ways). CI validates every skill. A backlog is tied to which representation each skill needs — the cheap
ones sit on scenes that already exist; the rest wait on the representation work.

**Possible next steps.**
- Build the **cheap, high-value cluster** on existing scenes — equivalent-fractions, simplify-fraction, HCF, share-in-ratio, fraction-of-amount, convert-mixed-improper.
- Sequence the skills that need a **new scene** (solve-linear-equation, expand-double-brackets, directed-number) alongside the representation work.
- **Unify skills with techniques** — let a skill's full teaching and a technique's full output share one source, so they can't drift.
- **Link `brief` technique steps to their skill** via `[[skill|term]]`, so an assumed move drills down to the full visual teaching.
- Link the two unlinked `lcm` consumers (`SimultaneousEquations` and `FractionToRatio` both compute an LCM and never mark it) — two `[[lcm|LCM]]` markers, the skill is built.

**Detail — skills to develop** (a skill is the drill-down teaching for a prerequisite a tool *uses
but doesn't teach*; the representation column signals effort — existing scene = cheap).

| Skill (id) | Teaches | Representation / scene | Priority | Status |
|---|---|---|---|---|
| `lcm` / `lcm-prime-factors` | lowest common multiple | number line `multiples`; prime tiles `factorTree`/`primeVenn` | — | ✅ — unlinked consumers found: `SimultaneousEquations`' `lcm` sub-tool (Algebra pass), `FractionToRatio`'s L2 "LCD:" step (Ratio & Proportion pass) — both compute the value but never link it |
| `equivalent-fractions` | scale num & den by the same factor | **bar model** `split`/`equivalents` *(exist)* | **high** | ⬜ — needed by `FractionsAddSub` |
| `simplify-fraction` | divide num & den by the HCF | **bar model** *(exists)* | **high** | ⬜ — needed by `FractionsAddSub`, `FractionMultDiv`, and now `FractionsOfAmounts` (its `asFraction` sub-tool, three consumers total) |
| `hcf` | highest common factor | **prime tiles** `primeVenn` *(exists)* | **high** | ⬜ — needed by `FractionsOfAmounts` (`asFraction`'s HCF step) and `RecipesTool` (its L2 HCF-based scaling step) — first named consumers |
| `share-in-ratio` | total parts → 1 part → each share | **bar model** *(exists)* | **high** | ⬜ — needed by `RatioSharingTool`, the category's sole real demand signal |
| `fraction-of-amount` | ÷ by denominator, × by numerator | **bar model** *(exists)* | **high** | ⬜ — needed by `FractionsOfAmounts`, a near-exact fit since the tool's own working already narrates the bar-model method; `CircleProperties`' `sectors` sub-tool (θ/360 × formula) is also a structurally identical, cross-topic unnamed consumer |
| `convert-fraction-ratio` | express a fraction as a complementary part:part ratio, and the reverse | **bar model** *(existing `split`/`equivalents` scenes — cheap)* | med | ⬜ — new, needed by `FractionToRatio`; its `convertFractionRatio` technique row had no matching skill row before this pass, breaking the pairing pattern every other row follows |
| `solve-linear-equation` | do the same to both sides | **algebra tiles** / number line *(no tile scene yet)* | **high** | ⬜ — needed by `SolvingLinearEquations`, and now also `BasicAngleFacts` (its L3 algebraic sub-tools) and `AnglesInQuadrilaterals` (its algebra-form questions) — two more unlinked consumers |
| `expand-double-brackets` | grid / area of each term pair | **area model** *(no scene yet)* | **high** | ⬜ — needed by `ExpandingBrackets` |
| `collect-like-terms` | group matching terms | **algebra tiles** *(no scene yet)* | med | ⬜ — needed by `CollectingLikeTerms`, `ExpandingBrackets` |
| `convert-mixed-improper` | mixed ⇄ improper fraction | **bar model** *(exists)* | med | ⬜ — needed by `FractionsAddSub`, `FractionMultDiv` |
| `round-to-significant-figure` | find the place value, round | **number line** *(exists)* | med | ⬜ — needed by `Estimation` |
| `factorise-quadratic` | find the factor pair | **area model** *(no scene yet)* | med | ⬜ — needed by `NonLinearSimEq` |
| `substitute-into-formula` | replace letters with values | *(none — text)* | med | ⬜ — needed by `NonLinearSimEq`, and now also `EquationsOfLines` ("Substitute into y = mx + c") |
| `rearrange-formula` | inverse operations to change subject | *(none — text / algebra tiles)* | med | ⬜ — needed by `Iterations`, `NonLinearSimEq` and `CircleProperties` (L3 rearranging `C=2πr`/`A=πr²`) — a third and fourth consumer |
| `simplify-ratio` | divide parts by a common factor | **bar model** *(exists)* | med | ⬜ — needed by `FractionToRatio` (`formingRatios`) and `SimplifyingRatiosTool` (numeric sub-tool) |
| `directed-number` | add/subtract/multiply negatives | **negative counters** *(no scene yet)* | med | ⬜ — needed by `IntegerAddSub` |
| `factor-pairs` | list the factor pairs of n | **prime tiles** *(exists)* | low | ⬜ |
| `place-value` | read the column value of a digit | *(none — closest fit is number line; PowersOfTen's own grid doesn't map onto any of the eight)* | low | ⬜ — new, needed by `PowersOfTen` |
| `keep-flip-change` | reciprocal + multiply for fraction division | **bar model** *(no scene authored yet for this specific move)* | low | ⬜ — new, needed by `FractionMultDiv` |
| `percentage-to-multiplier` | convert a percentage to a decimal multiplier | **bar model** *(exists)* | med | ⬜ — new, needed by `Percentages` |
| `unitary-method` | find 1%, then scale to the target | **bar model** *(exists)* | med | ⬜ — new, needed by `Percentages`, and now also `RecipesTool` and `BestBuys` — three tools across two categories hand-roll this exact reasoning unlinked, the clearest cross-category demand signal found so far |
| `apply-angle-fact` | identify which angle rule applies (sum to 180/360, isosceles, exterior, vertically opposite) | *(none — angle diagrams sit outside the eight-representation vocabulary; open question, see Core representations)* | **high** | ⬜ — new, pairs with the `applyAngleFact` technique; needed by `AnglesInQuadrilaterals` (richest demand signal), `BasicAngleFacts`, `AnglesInTriangles`, `AnglesInParallelLines`, `Bearings` — `PROJECTS.md`'s skills table had zero Geometry rows before this pass |
| `unit-conversion` | convert between units of the same quantity (mm/cm/m, etc.) before calculating | *(none — closest fit is number line, same open-question status as `place-value`)* | med | ⬜ — new, needed by `PerimeterTool` (both sub-tools' L3) and `FractionsOfAmounts` (`worded` sub-tool) — two cross-category demand signals |

Build the cheap cluster (top six after `lcm`) first — all on existing bar-model / prime-tile scenes,
each a prerequisite several tools link to. The equally-wanted `solve-linear-equation`,
`expand-double-brackets`, `collect-like-terms`, `factorise-quadratic`, `directed-number` need a **new
scene type**, so sequence them with the representation work.

## The gate (reference)

**Parked mode** (`src/parkedMode.ts`) is the stronger, unadvertised gate (`?parked=1`, routes 404 without it) that hides the **Skill Library** (`/skills`). It is separate from **Developing-tools mode**, which reveals work in the pipeline (including Teach decks and lessons). Unparking is a deliberate decision, not a side-effect of turning on Developing-tools mode.
