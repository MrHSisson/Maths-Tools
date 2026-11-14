# Tool Spec: Dimensional Analysis (Further Mechanics MA) — skill tools and exam-style questions

**Status:** implemented (2026-11-13; picture changed 2026-11-14). Built on `DecisionShell`: `src/tools/FurtherMechanics/DimensionalAnalysis.tsx`; maths `src/shared/decision/dim.ts`, generators `dimGen.ts`, working `dimSolve.ts`, exam chains `dimExam.ts`, picture `DimWorking.tsx` (rows `dimBuild.ts`, TeX `dimTex.ts`); tests `src/tests/dim.test.ts`, `mechanicsPairings.test.ts`. Differences from the draft: the powers are α, β, γ (not a, b, c) and all maths is LaTeX between `$…$` (`dimTex.ts`), with the working as the formal bracket chain `[F] = [ma] = [m][a] = M × LT⁻² = MLT⁻²`; *Given*, *Ask for* and *Context* are tick-several options (the shell's `multi`), *Answer format*, *Numbers in formulas* and *Dimensions given as* are single choices; the chooser has no tile art yet; no `about.ts` (the shell's purpose, option info and level labels carry the words).

Specification statements: **MA1** (find dimensions of quantities; check for dimensional consistency) and **MA2** (predict formulae; find powers in potential formulae). Both are in AS (7366) and A-level (7367), so the tool has no Course option. Hub entry: Further Mechanics, chapter MA, `/further-mechanics#MA`.

Evidence: two question sets supplied by Harry (Exampro), 20 current-spec questions with mark schemes (read to question 11's scheme; the questions to 20) and 16 legacy questions (read to question 9). They stay in the git-ignored `specs/exam/sources/` folder if kept at all; this brief quotes shapes, never the questions.

## Why
MA is pure algebra on three base dimensions (M, L, T), and the papers test it as a small number of micro-skills that are each easy to drill on their own: recalling dimensions, finding the dimensions of an expression or a constant, checking a formula is consistent, and — the big mark-earner — equating powers of M, L and T into simultaneous equations and solving them. The tool drills each skill separately, then the exam-style chains put them back together the way the papers do: a chain of lettered parts with marks and a mark scheme.

## Decisions (Harry, 2026-11-13)
- **Few, rich sub-tools** rather than one per skill: each must be able to give hundreds of different questions, with **Question Options (QO)** doing the differentiating and **fewer than three levels** where three would be forced.
- **One abstract tool** for equating powers and solving the equations: the context is not needed to form and solve them, so the generator can run with no context at all. Real contexts are the limited resource (about 20), so they are an option, not the base.
- **Skills → exam style follows the Decision model** (Critical Path / Network Flows): a **Practice | Exam style** switch, exam chains as named tiles in the chooser plus "Any exam question", each question a chain of lettered parts with marks, model answer, mark scheme and stepped working behind the (?), Practice | Worksheet, printed paper then mark scheme. Built on `DecisionShell`.
- **Picture:** the **written working** (below), changed from an exponent grid on 2026-11-14: Harry preferred the picture to be the answer as a student would write it, building up line by line beside the steps that explain it.

## Shell and picture
- `DecisionShell` with `DecisionProblem.network` absent (made optional 2026-11-13); the tool's data field is `dim` (declare it on `DecisionProblem`, as `cpa` and `flow` are), drawn through `config.renderCanvas`. Sandbox and matrix off (`noSandbox`, `hideMatrix`).
- **The written working** (changed 2026-11-14; it was a table of exponents, and was reworked twice the same day). The picture is the page a student would write, beside a teacher's dictation in words. It has a **title** and small headings. **Given:** length, time, mass, speed and acceleration; every other quantity is **built** from them, each after its **formula is stated** (`dimBuild.ts`; kinetic energy `E = ½mv²` rather than work done), then kept in a short *known* strip. Written in full: `[F] = [ma] = [m][a] = M × LT⁻² = MLT⁻²`, a bracketed power written as `[v]²` then expanded `(LT⁻¹)² = L²T⁻²`, a number such as ½ as a bracket with dimensions 1, the powers added, the answer boxed; tall brackets round a fraction. **A division stays a fraction** (`[F]/[A]`, `MLT⁻²/L²`), common letters are cancelled (`M/(LT²)`), and the negative powers come only on the last line (`ML⁻¹T⁻²`), since `[A]⁻¹` and `(L²)⁻¹` invite sign slips. For a model: the powers expanded, collected, equated and solved with each substitution shown. **Layout:** a short follow-on step continues along the same line, a long one goes down, in line under the last equals of the line above; once a working has broken onto a new line, every later step goes on its own line under that same equals; rows have room to breathe, more beside a fraction. **No scrolling:** work goes stage by stage and builds collapse into the strip; the page is sized from its panel and shrunk to fit. Consistency formulas that are a quantity's own definition (ρ = m/V, p = F/A) are left out, since building the quantity from them would be circular. Each step carries the page so far (`DimViewState`).
- **Dimensions are written as the papers write them:** `ML²T⁻²` in the question and answers; a quantity's dimensions in square brackets, `[G] = M⁻¹L³T⁻²`. Dimensions, never units (the schemes score use of units A0): where a quantity is given in units (`kg m⁻³`) the question asks for its dimensions.

## The quantity library (one source for every sub-tool)
Each entry: name, symbol, dimensions `[M, L, T]` as exponent triples, and the units it is given in when a question gives units. Starting set (checked against the papers); the generator derives everything from these triples, never from stored strings (R5).

| Quantity | Dimensions | Quantity | Dimensions |
|---|---|---|---|
| length, height, radius, depth | L | angular speed ω, frequency | T⁻¹ |
| time | T | angular acceleration | T⁻² |
| mass | M | moment of inertia I | ML² |
| area / volume | L² / L³ | angular momentum | ML²T⁻¹ |
| speed, velocity | LT⁻¹ | stiffness (spring constant) k | MT⁻² |
| acceleration, g | LT⁻² | surface tension | MT⁻² |
| density ρ | ML⁻³ | G (gravitation) | M⁻¹L³T⁻² |
| force, weight | MLT⁻² | viscosity η | ML⁻¹T⁻¹ |
| momentum, impulse | MLT⁻¹ | pressure p | ML⁻¹T⁻² |
| energy, work, moment of a force | ML²T⁻² | mass per unit length q | ML⁻¹ |
| power | ML²T⁻³ | coefficient of restitution, angle, π, ½ | dimensionless |

## The skill sub-tools (Practice: Skills)
Three sub-tools. Each tile in the chooser carries a mini grid.

### 1. Find the dimensions (`dims`) — 2 levels
- **Level 1:** one step. A single quantity, or a product or quotient of two.
- **Level 2:** a constant found from a formula (`[k]`), three-factor expressions, powers and square roots, and quantities given in units.
- **QO:**
  - *Given* (exclusive): the quantity's name · its units · a formula to rearrange.
  - *Ask for* (exclusive): a quantity · an expression · a constant in a formula. (At Level 1 only the first two.)
  - *Answer format* (exclusive): write it · circle one of four. The three wrong options are plausible slips (a sign flipped, the wrong power of one base dimension, a missing factor) so a wrong choice names its misconception.
- **Pool:** the library gives ~35 quantities; expressions of two or three factors with powers in −2…2 give thousands. As extensive as the topic allows (no minimum).
- **Working:** the grid, one row per factor, adding exponents column by column.

### 2. Check consistency (`consistent`) — 2 levels
- **Level 1:** two-term formulas (each term one product of quantities) and "dimensionless constant" formulas.
- **Level 2:** three or more terms, and formulas with ½, 2π or an angle in them (dimensionless numbers).
- **QO:** *Ask for* (exclusive): show the formula is consistent · find the odd term out · find the missing power · which of four formulas is consistent (exactly one). *Include dimensionless numbers* (switch, default on at Level 2).
- **Generator:** start from a true formula built by the equations-first generator (below), then, for the "not consistent" cases, perturb one term by a quantity whose dimensions differ (never by one with the same dimensions, so the perturbation always breaks it). The "which of four" question needs exactly one consistent option.
- **Pool:** true formulas from the library times ~6 perturbations. As extensive as the topic allows (no minimum).

### 3. Find the powers (`powers`) — 3 levels (the abstract tool)
Form the M, L, T equations from `X = k p^a q^b r^c` and solve them.
- **Level 1:** two unknown powers (two quantities); one base dimension is absent so there is one easy equation.
- **Level 2:** three unknown powers, three quantities, a triangular system (one equation gives a power directly, the next uses it).
- **Level 3:** three unknown powers where the equations couple and the answers are fractions (halves, thirds) or zero.
- **QO:**
  - *Context* (exclusive): none (generic letters, the dimensions of each given) · named quantities (e.g. "a mass m, a length l, an acceleration g") · a worded situation (below).
  - *Ask for* (exclusive): find all the powers · show one power is zero (overdetermined: three equations, two unknowns) · decide the model cannot work (the equations have no solution).
  - *Dimensions given as*: the grid and the dimensions · units (the student first finds the dimensions; ties to sub-tool 1).
- **Generator (equations first, R5):** pick the powers first (integers −3…3 and halves, thirds at Level 3 only), pick the quantities' dimension triples from the library (or random small triples in context-free mode, kept linearly independent), compute the target's dimensions from them, then check the system has exactly one solution with an independent solver. The answer is never searched for afterwards.
- **Pool:** context-free mode is effectively unlimited (the powers and the triples both vary). The worded situations are the limited resource: **about 19**, listed next, used by this sub-tool and by the exam chains.

#### Worded situations (each checked: the powers are what the equations give)
| # | Situation | Model | Powers |
|---|---|---|---|
| 1 | simple pendulum | t = k l^a g^b (m^0) | a ½, b −½ (m has power 0) |
| 2 | mass on a spring | t = k m^a g^b s^c (stiffness s) | a ½, b 0, c −½ |
| 3 | orbit period | t = k r^a G^b m^c | a 3⁄2, b −½, c −½ |
| 4 | speed after a fall | v = k g^a h^b | ½, ½ |
| 5 | tank outflow | v = k g^a h^b ρ^c | a ½, b ½, c 0 |
| 6 | sea wave speed | v = k d^a ρ^b g^c | a ½, b 0, c ½ |
| 7 | (not built: shallow-water wave) | | |
| 8 | circular-orbit speed | v = G^a m^b r^c | ½, ½, −½ |
| 9 | drag on a sphere | F = k ρ^a r^b v^c | a 1, b 2, c 2 |
| 10 | (not built: pipe flow) | | |
| 11 | bead in a fluid | a = k m^α ρ^β v^γ | α −⅓, β ⅓, γ 2 |
| 12 | spinning disc | E = k m^a r^b ω^c | 1, 2, 2 |
| 13 | compound pendulum | T = k I^α W^β h^γ | α ½, β −½, γ −½ |
| 14 | vibrating string | t = k l^α F^β q^γ | α 1, β −½, γ ½ |
| 15 | planet lifetime | t = k m^a r^b G^c | a −½, b 3⁄2, c −½ |
| 16 | bouncing ball | h = k m^a u^b g^c | a 0, b 2, c −1 |
| 17 | falling bead, speed from height and mass | v = k m^a g^b h^c | a 0, b ½, c ½ |
| 18 | liquid in a tube: oscillation time | t = k ρ^a l^b g^c | a 0, b ½, c −½ |
| 19 | rotating disc: angular speed from energy | ω = k E^a m^b r^c | a ½, b −½, c −1 |

(The generator **recomputes** every row with the independent solver in the test, so this table is documentation, not data the tool trusts.)

## Exam-style questions (Practice: Exam style)
**Practice | Exam style** switch in the chooser. Tiles, plus **Any exam question** (`exAny`, the one the Further Mechanics hub card opens, as the Critical Path hub does with its mixed question). One level (no sizes to choose); the QO mirrors the skill tools only where a chain has a choice.

| Chain | Parts (marks) | Paper shape |
|---|---|---|
| **Circle your answer** (`exCircle`) | (a) circle the dimensions of a quantity, or the one consistent formula of four (1: B1 or R1) = **1** | the 1-mark questions |
| **State the dimensions, then find the powers** (`exFind`) | (a) state the dimensions of a quantity (1: B1) · (b) find two powers from a model (3: M1 M1 A1) = **4** | current Q6 |
| **Dimensions of a constant, then predict** (`exConstant`) | (a) show the constant has given dimensions (2: M1 A1) · (b) find the three powers in a model that uses it (3: M1 M1 A1) = **5** | current Q14, legacy Q7 |
| **Show it is consistent** (`exConsistent`) | (a) show the formula is dimensionally consistent, fully justified (3: M1 A1 R1) · (b) the dimensions of a constant, or what it represents (2: M1 E1) = **5** | current Q12, Q7, legacy Q1 |
| **Two models, reject one** (`exModels`) | (a) explain which model should be rejected (2: E1 E1) · (b) the powers that make the other consistent (2: M1 A1) = **4** | current Q19 |
| **Show a quantity does not matter** (`exZero`) | (a) show a power is 0 or that the result does not depend on a quantity (3: M1 A1 R1) · (b) the other powers (3: M1 M1 A1) = **6** | legacy Q6, Q8 |

- **Marks are the schemes' own** (B1 independent, M1 method, A1 accuracy, E1 explanation, R1 reasoned argument; a trailing F for follow-through). *Check at build time against the mark schemes of questions 12 to 20 and legacy 1 to 9, which this draft has not read: adjust the mark splits, never the shapes.*
- The student reveals each part's answer with its mark lines, marks themselves, and opens (?) for the stepped working on the pinned grid. No typed answers, no scoring (as Critical Path and Network Flows).
- **Parts library** (as `flowParts.ts`): `circleDims`, `stateDims`, `showDims`, `findPowers`, `showConsistent`, `explainReject`, `showZero`; each part is a skill generator run on the question's shared quantities and returns its model answer, marks and working, so the exam answers cannot drift from the skills. Recipes compose the parts into the chains above.
- **Context:** every chain draws its situation from the worded list above (and, for the circle and consistency chains, from the library), so the chains and the skill tool share their ~19 situations.
- **Worksheet:** generates a set; Print gives the paper (the grid with its cells blank where the student fills them) then the mark scheme (`printExam.ts`).

## Correctness (the tests check)
- **Independent solver:** a rational-arithmetic Gaussian elimination written in the test, not shared with the generator, solves every generated `powers` question and every exam `findPowers` part from the dimension triples alone; the tool's stated powers must equal its answer, the system must have exactly one solution (full rank) except in the *show one is zero* and *cannot work* cases, which must be overdetermined with a consistent / an inconsistent system respectively.
- **Round trip:** substitute the powers into the model and re-derive the target's dimensions (this is also the consistency check's own reference); every `consistent` question's verdict (consistent, the odd term, the missing power) is re-derived the same way, and "which of four" has exactly one consistent option.
- **The quantity library** has every entry's triple equal to the one a first-principles derivation gives (force = mass × acceleration, and so on), checked from a small table of defining relations in the test.
- **Mark codes and totals:** every chain builds with exactly the parts and marks above, valid mark codes, and a model answer and working for every part.
- **Seeded replay:** `seedReplay.test.ts` passes (a generator draws only through `Math.random`, keeps no state between calls, R45).
- Hub pairing test: the tool's sub-tools are placed exactly once on the Further Mechanics hub (as `decisionPairings.test.ts` does for Critical Path).

## Acceptance reference (answers the build must reproduce)
| Sub-tool | Question | Answer |
|---|---|---|
| `dims` L1, name | Dimensions of power | ML²T⁻³ |
| `dims` L1, name | Dimensions of impulse | MLT⁻¹ |
| `dims` L2, constant | E = ½kx² (x a length, E energy): [k] | MT⁻² |
| `dims` L2, units | η in kg m⁻¹ s⁻¹: [η] | ML⁻¹T⁻¹ |
| `consistent` | s = ut − ½gt² | consistent (every term L) |
| `consistent` | s = ut − ½gt (the t² missing) | not consistent: the last term is LT⁻¹, not L |
| `powers` L1, no context | [X] = M²LT⁻⁵, [p] = MLT⁻², [q] = L, [r] = T⁻¹, X = p^a q^b r^c | a 2, b −1, c 1 (equations M: a = 2; L: a + b = 1; T: −2a − c = −5) |
| `powers` L2, situation 1 | pendulum, t = k m^a l^b g^c | a 0, b ½, c −½ (M: a = 0; L: b + c = 0; T: −2c = 1) |
| `powers` L3, situation 11 | bead, a = k m^α ρ^β v^γ | α −⅓, β ⅓, γ 2 |
| `exConstant` | F = Gm₁m₂/d²; t = k m^a r^b G^c | [G] = M⁻¹L³T⁻²; a −½, b 3⁄2, c −½ |
| `exModels` | v ∝ g^a h^b ρ^c against v ∝ g^a h^b | reject the first (ρ has dimension M and nothing cancels it); a ½, b ½ |

## The Further Mechanics hub (when the tool exists)
- `mechanicsSpec.ts`: chapter MA gets `toolIds: ["dimensional-analysis"]` and the pairings below; the hub shows the **Exam style** card (`exAny`) and an **Open Dimensional Analysis** button. All MA statements are in AS, so there is no A-level-only row.
- MA1: Find the dimensions, Check consistency. MA2: Find the powers. (Each sub-tool listed under one statement only, as for Critical Path.)
- Registry: id `dimensional-analysis`, path `/dimensional-analysis`, `hub: 'further-mechanics'`, `enabled: false` until the go-live checklist is done (the whole Mechanics space is Developing-tools only today).
- `about.ts` words (`DimensionalAnalysis.about.ts`): the tool's purpose, each sub-tool's purpose and one plain line per level, from this brief.

## Not in this brief
- Printable skill worksheets beyond the exam Worksheet: decide as for Critical Path (its question sheets) once the skills exist.
- Units arithmetic (converting between units) and dimensional analysis beyond M, L, T (no temperature, charge or angle as a dimension).
- A Depth bank and a Teach deck for MA (separate briefs).
- Renaming `DecisionShell` and its folder (a separate tidy-up; see `docs/architecture/DECISION_SHELL_PLAN.md`).

## Decisions on the open questions (Harry, 2026-11-13)
1. **Moment of a force and energy:** keep both (they share ML²T⁻², and a question may ask for each).
2. **Pool size:** no 30-question minimum. A level's pool is as extensive as the topic allows with three base dimensions and what an A-level student knows; if that is fewer than 30 distinct questions, that is fine. (`recentQuestions.test.ts` only checks tools that export the ToolShell `__test`; this is a `DecisionShell` tool and is not in it. Confirm at build time and, if the test does pick it up, say so rather than padding the pool.) Do not add contrived variants to reach a number; the worksheet may repeat a question only when the pool is genuinely smaller than the sheet.
3. **Circle-your-answer wrong options:** the slips listed (a flipped sign, a wrong power of one base dimension, a missing factor), each wrong option naming its misconception.


## Audit round (2026-11-14)

Four read-only audits (accuracy, structure and design, ease of use, pitch) led to these changes. **Given quantities** (`Quantity.given`: speed, acceleration, g) are never asked for ("find the dimensions of speed"); area, volume and weight stay. **g** is always introduced as "the acceleration due to gravity" (a test checks every prompt). **Dimensionless things are stated**: `[½] = 1 as it is a dimensionless constant` (`Piece.dimless`, `Derivation.note`), a result with no dimensions is boxed "(dimensionless)". **Angle and trig**: `angle`, `sin`, `cos`, `tan` are library quantities defined by ratios of lengths (`o/h`, `a/h`, `o/a`, `s/r`), so their dimensions are worked from first principles (L/L = 1); two constants questions (`x = A sin(ωt)` gives [ω] = T⁻¹; `y = A cos(kx)` gives [k] = L⁻¹) state that the argument of a trig function has no dimensions (`ConstRel.arg`). A division with a negative power on the bottom shows the top and bottom combined, then the subtraction in full (`T^{-2-(-1)}`). A powers working with no equation of one unknown now shows the elimination (`solveSystem`) and a check of all three equations. On paper the written-working picture is not drawn (the student writes their own); the exam picture does not give the model away. **Not built yet:** trig inside the consistency formulas, root expressions through the combine/subtract rows, a "Quantities I know" option for the long builds, an `about.ts`, widening the small constant and exam pools, and the curated wording for the "named" powers context.

**Builds as one step (2026-11-14).** `buildSteps` makes each build one step (`oneStep`: the page as it ends, every line of the build fresh) carrying its parts in `SolveStep.more`; `StepCascade` shows "Show the steps (n)" and `DecisionShell` replaces the opened step with its parts. Option `dimsBuilds` (`displayOnly`: redrawn from the seed) sets One step each (default) or Every step (`DimProblemData.expandBuilds`).
