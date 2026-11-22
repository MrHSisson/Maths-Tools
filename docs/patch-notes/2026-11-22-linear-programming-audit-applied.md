Strand: Maths

## 2026-11-22 — Linear Programming audit applied: balance, arbitrariness, asterisks, not live

Branch `claude/sleepy-sagan-7zueyf`. Area: `lpSimplexGen.ts`, `src/tools/Decision/SimplexAlgorithm.tsx`, `src/tools/Decision/FormulatingLP.tsx`, `src/tests/lpSimplex.test.ts`. The audit is `specs/linear-programming-audit.md`.

- **Minimise is a real minimise:** the cost is mixed-sign (some variables earn, some cost: "Minimise C = 3x − 5y"), not a negated maximise.
- **One pivot:** Starting Form is replaced by **Start** (Standard Tableau, or A Negative Right-Hand Side), because the other forms looked identical in a question that gives only the tableau.
- **An equality** now involves at least two variables.
- **Tableau To Problem moved** from Set up to Read a tableau, as the option **Ask For** (What It Says, or The Problem It Shows).
- **Whole Numbers** is now on Solve a problem only (the Is it practical? sub-tool is unchanged); it was thin on Read a tableau.
- **Size** replaces Variables and Constraints in the Simplex tool: 2 × 2, 2 × 3, 3 × 3, 4 × 4* (variables × constraints), by level.
- **Asterisks:** an extension that is unlikely to come up has an asterisk on its option button (Formulating: 4* variables, Rate And Time*, Time Per Item*, Share Of A Requirement*, More Or Less Than*, Both*; Simplex: 4 × 4*, Ask If Practical*), and the option's information says what an asterisk means.
- **Left as it was:** Capacity Method is already a display-only option in its own tab, so it is not among the Question Options (recommendation 7); a Formulate a problem style control (recommendation 9) only if a teacher asks.
- **Tests:** a minimise has both signs and still matches the brute-force optimum; an equality has two or more variables; a size is a variables-by-constraints pair; Read a tableau can ask for the problem.

Agent: Claude Code
Notes: Build Log block "Linear Programming: audit applied (Claude Code)" (tag agent:claude-code), branch `claude/sleepy-sagan-7zueyf`.
