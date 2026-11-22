Strand: Maths

## 2026-11-22 — Formulating: styles regrouped, resource limits, Level 3 situations, display toggles, not live

Branch `claude/sleepy-sagan-7zueyf`. Area: `lpGenL23.ts`, `lpProblem.ts`, `lpGen.ts`, `lpSolve.ts`, `src/tools/Decision/FormulatingLP.tsx`, the Formulating tests. Harry's notes from the preview.

- **Percentages Of is gone as a separate option.** It could be ticked with no percentage style selected. The four things a percentage is taken of are now styles of their own: **Percentage Of One Kind, Percentage Of Several Kinds, Percentage Of The Total, More Or Less Than\***. Ratios and shares are two styles too (**Ratios**, **Shares Of The Total**).
- **Time Per Item and Share Of A Requirement are Level 2, not Level 3.** The student is given the amount each item uses, so they are fractional coefficients: they are now the Level 2 style **Fractional Amounts** ("each loaf takes 1 minute, each cake 4/3 minutes"; "each uses 1/60 of the oven, at least 1 in all"). Capacity Given As at Level 3 keeps the two forms in which the student must work the coefficients out: **Most You Could Make** and **Rate And Time\***.
- **Resource Limits (Formulate a problem):** One, Two or Three. Three limits need a new context, a **florist** (spring, summer, wedding and market bouquets; roses, tulips and sunflowers, one limit each). A question draws the count it can supply.
- **Situations (Formulate a problem, Level 3):** Resource Limits, Exactly Half, Either-Or Limits, A Remainder, A Relation Between Kinds, A Blend To Minimise. The Objective option now applies to Levels 1 and 2 only (a blend is the Level 3 minimise). A remainder or a relation says which letters to use: "Formulate this as a linear programming problem, **using only x and y**, to maximise the profit."
- **Display toggles:** **Common Slips** and **Number Check** (Shown or Hidden) in the display tab. They redraw the same question without those steps.
- **Tests:** three limits in a florist, the Situations option picks the model and the wording names the letters, the toggles remove exactly the check and the slip steps.

Agent: Claude Code
Notes: Build Log block "Linear Programming: Formulating notes from the preview (Claude Code)" (tag agent:claude-code), branch `claude/sleepy-sagan-7zueyf`.
