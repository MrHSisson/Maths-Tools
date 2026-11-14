# Further Mechanics (AQA 7367 MA–ME)
- **Status:** building
- **Updated:** 2026-11-14

## Intention
A place for every chapter of the AQA Further Maths mechanics option (MA Dimensional analysis, MB Momentum and collisions, MC Work, energy and power, MD Circular motion, ME Centres of mass and moments), built on the specification, so that teachers can practise exactly what the A-level and AS papers examine. The questions are a mix: generators for the skills that vary by numbers (as in the maths tools) and exam-style chains of parts, a picture per part, a mark scheme and stepped working (as in the Decision tools). The current spec only has about eight years of papers, so each statement is linked back to the legacy AQA M1 to M3 papers (and Edexcel M3 and M4 as extra material), which are a much deeper bank to take question shapes from.

The space is Developing-tools only until a chapter is ready; a chapter goes live on its own when its tool does.

## Progress
- 2026-11-06. The specification is in the repo as data: `specs/exam/spec/aqa-mechanics.md` (25 statements quoted from AQA 7367 and, for the AS column, 7366) and the page `src/tools/FurtherMechanics/` at `/further-mechanics` (dev-gated), which shows each chapter's statements, their AS or A2 status, the printed formulae, the legacy module each came from and the question banks found for it.
- AS or A2 is settled from the spec (the same codes in both): ME and MD4 to MD6 are A2 only; the rest is in AS. MB1 to MB3 and MC7 are "resolving not required" at AS, and MC1 has no Fd cos θ at AS, so those chapters carry an AS and an A2 version of the same statement.
- The Gemini legacy map was checked against the AQA M1 to M3 combined papers. M1 to M3 hold up with a few changes (vertical circles, variable-force work and centres of mass by integration are in M2, not M4; impulse is in M3). Nothing assigned to M4 or M5 could be checked.
- 2026-11-13. **Dimensional Analysis (MA) is built** as the pilot of the whole route, on `DecisionShell` with the written working as its picture (the page a student would write, building a line at a time beside the steps that explain it) (`DecisionProblem.network` is now optional, so a non-network tool carries its own data field): three skill tools (Find the dimensions, Check consistency, Find the powers; the last runs in letters, with named quantities or in ~19 worded situations) and six exam-style chains plus a mixed one, with tests that re-derive every answer independently. Still Developing-tools only (`enabled: false`). Brief: `specs/dimensional-analysis.md`. The hub page now shows the chapter's tool, its exam card and its practice chips (the same layout as Decision Maths).
- No other chapter tool exists yet.

## Proposed structure
One tool per chapter, each with a sub-tool per cluster of statements. This is the starting shape, to be argued with before anything is built.

| Tool | Statements | Sub-tools (draft) | AS / A2 |
|---|---|---|---|
| Dimensional Analysis | MA1, MA2 | Find dimensions and check consistency · Predict a formula (find the powers) | AS |
| Momentum and Collisions | MB1 to MB4 | Conservation of momentum · Restitution and impacts with a smooth surface · Impulse (constant force) · Impulse of a variable force | AS and A2: resolving is the A2 layer |
| Work, Energy and Power | MC1 to MC7 | Work, GPE, KE and the work-energy principle · Elastic strings and springs (Hooke, EPE) · Work by a variable force · Power | AS and A2: Fd cos θ and resolving are the A2 layer |
| Circular Motion | MD1 to MD6 | Angular speed, speed and acceleration · Vectors in circular motion · Conical pendulum · Vertical circles | MD1 to MD3 AS; MD4 to MD6 A2 |
| Centres of Mass and Moments | ME1 to ME6 | Particles and composite bodies · By integration (laminas, solids of revolution) · Sliding and toppling · Equilibrium, moments and couples | A2 |

Legacy source for each statement is in the page (M1 for straight-line momentum; M2 for most of work, energy, circles, centres of mass and equilibrium; M3 for dimensions, restitution and impulse).

## Next steps
Open decisions first, since each changes the shape of what is built.
- **Which shell?** Generators on `ToolShell` for the number-driven skills, exam chains on a `DecisionShell`-style parts library for the multi-part questions, or both in one tool. Decide per chapter; MA is pure algebra with no picture and may sit on `ToolShell` alone.
- **How AS and A2 show.** A year option in the tool (the same sub-tool at AS or A2 wording) or the Levels. MB, MC and MD each have AS and A2 versions of the same statement, so it cannot be a tool-per-year split.
- **The mechanics picture.** Decide the representation for force and motion diagrams (resolved forces, a particle on a string, a lamina with its centre of mass) before any question needing a picture; this wants the eight core representations considered first (`docs/reference/pictures.md`).
- **Build order.** Suggested: Dimensional Analysis first as a small pilot of the whole route (spec statement, corpus, generator, exam chain, go-live); then Momentum and Collisions, Work, Energy and Power, Circular Motion, Centres of Mass and Moments.
- **A corpus.** Tag the 7367/3M papers' questions as part chains in `specs/corpus/` (as for Network Flows) so the generators and exam chains match what is asked; the legacy AQA M1 to M3 papers are the extra bank.
- Check what is still unverified: the M4 and M5 legacy mapping, and the one-example evidence for MB4 (impulse of a variable force).
- A go-live checklist per chapter, as for the Decision tools: exam chains, corpus, validators that re-derive each answer, phone / tablet / laptop check, then remove `enabled: false`.

## Where to read more
`specs/exam/spec/aqa-mechanics.md` (the statements, the AS column and the legacy-map check), `src/tools/FurtherMechanics/mechanicsSpec.ts` (the data behind the page), `docs/pathways/decision-exam-questions.md` and `docs/architecture/DECISION_SHELL_PLAN.md` (the exam-chain pattern), `specs/corpus/network-flows.md` (a tagged corpus), `docs/reference/pictures.md`.
