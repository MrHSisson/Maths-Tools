# Linear Programming tools: audit (balance, arbitrariness, relevance)

**Written 2026-11-22**, after Formulating (F0 to F7 and the substituted-out relations) and the Simplex tool (S0 to S5, Is it practical?, ties, Pivot Given, tables). **Nothing was changed by this audit.** It lists what is there, what looks unbalanced or arbitrary, and what is unlikely to come up (marked **\***, an extension). Recommendations are for Harry to decide.

How the marks were decided: a thing is **book-supported** if a corpus row (`specs/corpus/linear-programming-styles.md`) shows it in a textbook; an **\*** is a thing no row shows, or a variant the books do not distinguish. The corpus rows come from the two textbooks only (no past papers yet), so an **\*** means "not seen in the books we have read", not "never examined".

## 1. What there is

| Tool | Sub-tools | Levels | Options (all) | Most shown at once |
|---|---|---|---|---|
| **Formulating** (`/lp-formulate`) | Write a constraint; Formulate a problem | 3 each | Variables, Constraint Styles, Percentages Of, Capacity Given As, Capacity Method (constraint); Variables, Objective, Integers, Data Shown (problem) | 4 |
| **The Simplex Algorithm** (`/lp-simplex`) | Set up the tableau; One pivot; Solve a problem; Read a tableau; Is it practical? | 3 each | Variables, Constraints, Direction, Wording, Starting Form, Pivot, Whole Numbers, Optimum, Tableau Layout | 6 (Set up, Solve) |
| Graphical | not started | | | |

Both tools are `enabled: false`. Nothing has been through the dashboard notes, a printer or a tablet.

## 2. Balance: where the tools are lopsided

1. **Whole numbers has three doors.** The sub-tool *Is it practical?*, the **Whole Numbers** option on *Solve a problem*, and the same option on *Read a tableau*. The sub-tool and the Solve option are both useful (one drills the whole-number part, the other chains it after a full solve). The Read a tableau option adds a third way to the same content, and it is thin there.
2. **Variables and Constraints are two separate options on all five Simplex sub-tools.** They are really one idea (the size of the problem), and most of the combinations of them are never chosen. One "Size" option, with the real combinations only, would be one option fewer on every sub-tool.
3. **Formulating, Write a constraint, Level 3: two options for one style.** *Capacity Given As* and *Capacity Method* both belong to the either-or limit alone, while Blends, the other Level 3 style, has none. Heavy on one style, nothing on the other.
4. **Formulating, Formulate a problem has no style control.** At Level 3 a question is drawn from standard, "exactly half", either-or, a remainder, a substituted-out relation and (when minimising) a blend, with no way to ask for one. That is deliberate (fewer options), but a teacher cannot drill "just the remainder".
5. **Formulating, Objective is coupled to the style.** Minimise Cost at Level 1 and 2 is a diet problem (amounts to supply), and at Level 3 it is a blend; there is no Level 3 diet-type problem and no blend with Maximise. So the Objective option decides the style as well, without saying so.
6. **Set up the tableau carries Tableau To Problem as its Direction option.** Reading a tableau and saying what problem it represents is the *Read a tableau* skill. It sits in *Set up* because *Set up* was the nearest home when it was built. That is the clearest case of something shoved where it fits less well.

## 3. Arbitrary or contrived (found by looking at generated questions)

1. **Minimise is only a sign-flipped maximise.** A generated Level 3 question reads "Minimise C = −5x − 12y subject to x + 2y ≤ 18, 4y ≤ 33, …", with every cost coefficient negative and every constraint a ≤. A real minimising problem has costs that are positive with ≥ constraints (a diet), or a mixed-sign objective. The simplex steps are correct, but the problem is not one a student would see.
2. **One pivot, Starting Form does nothing for most choices.** In a question that gives only the tableau, a minimise or a lower-bound problem looks identical to a standard one ("A simplex tableau for a maximising problem is shown"). Only the ≥ and equality starts (a negative right-hand side) change what the student sees. So three of the five choices make no difference to that sub-tool.
3. **An equality can be about one variable.** A generated question had "2y = 4" among its constraints (the equality passes through the optimum, but only involves y). It is a silly constraint; an equality in a book involves two or more variables.
4. **Whole Numbers on Read a tableau** (see 2.1): a tableau read, then a whole-number question, is a long chain for the sub-tool whose job is one reading.

## 4. Unlikely to come up (extensions, marked \*)

**Formulating**
- **\*** Four variables (in both sub-tools). The books formulate with two or three (a four-variable table appears once, in a *simplex* exercise, not in formulating).
- **\*** *Capacity Given As*: "rate and time", "time per item" and "share of a requirement" (the book's either-or, "enough for A or for B", is the "most" form).
- **\*** "p% more than" and "p% less than" (x = 1.2y) in the percentage style: the books show shares of a total, not "more than".
- **\*** Profit given as **price minus cost**: the books give the profit directly.
- **\*** The reversed wording of a relation ("the power smoothies are half of the boost smoothies"): a teaching trap we added.
- **\*** A relation with a **multiple of 3** ("three times"): the books show twice and half.
- **\*** *Capacity Method: Both* (showing the fractions and the common-units method together).

**The Simplex Algorithm**
- **\*** Four variables and four constraints (the books show one four-variable table).
- **\*** *Is it practical?* **method**: the upper-bound argument (the optimum rounded down), the table of whole-number points either side of the optimum, the "room left" method. The books' integer method is to list the greatest feasible y for each integer x (corpus L28), and to ask "explain why not practical, find a practical plan" (L81).
- **\*** *Is it practical?* **with three or four variables**, the **nearest-rounding trap**, and the **Whole Numbers option** on Solve and Read a tableau.
- **\*** **Ties and degenerate problems** built on purpose (the books show a zero ratio once).
- **\*** The **θ-values written beside the tableau**: the Cambridge book writes its ratios in the working, not in a column.
- **\*** **Tableau Layout**'s Oxford style as the same question in a second layout is book-supported, but the number of each row (R5 = R1 + 8 × R6) beyond what the book shows is ours.

**Book-supported, no mark:** the substituted-out relation and the remainder (L06, L08, L12, L72), a constant in the relation (L72), strict inequalities (L74), a pack variable (L13), unit conversions (L12, L68), percentages and blends (L07, L64, L65), decimal per-item amounts (L60), the either-or limit (L03), the data in a table (L04, L80), the single-variable objective (L71), the ≥ start, the lower bound and the equality pair (L77 to L79), Pivot Given (L46), reading the slack's meaning in the story (L51, L56, L82).

## 5. Recommendations (nothing done yet)

| # | Change | Why |
|---|---|---|
| 1 | Minimise: build it from a positive cost and ≥ constraints (a diet) or a mixed-sign objective, not a negated maximise | 3.1 |
| 2 | One pivot: Starting Form reduced to "Standard form" and "Negative right-hand side start" | 3.2 |
| 3 | Equality: an equation in two or more variables | 3.3 |
| 4 | Move Tableau To Problem from Set up to Read a tableau | 2.6 |
| 5 | Take Whole Numbers off Read a tableau (keep the sub-tool and the Solve option) | 2.1, 3.4 |
| 6 | Merge Variables and Constraints into one Size option | 2.2 |
| 7 | Fold Capacity Method into the working display, or give Blends something to match | 2.3 |
| 8 | Show the asterisks to a teacher (an asterisk in the option's information note, and in the dashboard notes) | section 4 |
| 9 | Style control for Formulate a problem, only if a teacher asks | 2.4, 2.5 |

Nothing here removes a question type. Items 1 to 3 change the numbers and wording a question is built from; 4 to 7 change where an option sits.

## 6. Status (2026-11-22, later)

Recommendations 1 to 6 and 8 **applied**: a mixed-sign minimise; One pivot's Start option; equalities in two or more variables; Tableau To Problem moved to Read a tableau (Ask For); Whole Numbers off Read a tableau; one Size option; asterisks on the option buttons (Formulating: 4*, Rate And Time*, Time Per Item*, Share Of A Requirement*, More Or Less Than*, Both*; Simplex: 4 × 4*, Ask If Practical*). Recommendation 7 judged already met (Capacity Method is a display-only option in its own tab). Recommendation 9 is left until a teacher asks. The asterisked things that are not options (price minus cost, three times, the reversed half wording, built-on-purpose ties, the θ column, the Is it practical? method) are marked in section 4 only.
