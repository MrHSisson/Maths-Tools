Strand: Maths

## 2026-11-21 — Linear Programming (Decision Maths, chapter DD): planned, nothing built

Branch `claude/wonderful-gates-jfutd2`. Area: `specs/`, `docs/pathways/linear-programming.md` (documents only; no code, no tool, nothing teachers see).

- **The question styles are listed.** `specs/corpus/linear-programming-styles.md` holds 76 styles (shapes only), from two textbook chapters Harry sent: each worked example and exercise style is matched to a planned sub-tool. Two corrections made on the way: three-variable formulation and the 2015 exam chain are AS content, not A-level.
- **Three tools planned** (`specs/linear-programming-tools.md`): Formulating (DD1), Graphical (DD2) and the Simplex Algorithm (DD3 and DD4, A-level only), instead of one tool. The textbook's simplex layout (objective row first, no θ or basic-variable column, ratios in the working, minimising as Q = −P, ≥ constraints only after rewriting as ≤) is recorded in `specs/linear-programming.md` section 9a.
- **Formulating is briefed** (`specs/linear-programming-formulate.md`): two sub-tools, three levels each. **Write a constraint** asks for exactly one constraint (whole-number coefficients, lowest terms) from a short situation, with the variables named in the question; Level 1 resource use and direct comparisons, Level 2 percentages, fractions, ratios and decimal amounts, Level 3 blends and averages and the either-or limit ("at most 60 of one or 45 of another" giving x/60 + y/45 ≤ 1, then 3x + 4y ≤ 180). **Formulate a problem** is the whole model, with the student assigning the variables. Variables (2, 3 or 4) and constraint styles are multi-selects; strict inequalities (more than, fewer than) appear throughout, with no option. One rule covers every relationship ("x at least twice y and z combined", "x exactly 40% of the total", blends), and the generators build each constraint from its whole-number form first. The brief has the maths, the slips to name, the options, generation, tests and build chunks F0 to F8; the `constraint` sub-tool is `ready`.
- **Not done:** nothing is built; the Graphical and Simplex tools have no brief yet; the AQA examiner reports are unread.

Agent: Claude Code
Notes: Build Log block "Linear Programming: planned (Claude Code)" (tag agent:claude-code), branch `claude/wonderful-gates-jfutd2`.
