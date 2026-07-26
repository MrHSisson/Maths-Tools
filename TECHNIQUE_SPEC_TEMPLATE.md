# Technique Spec: <Technique Name>

**Status:** draft <!-- draft → ready → implemented. Claude Code only implements specs marked `ready`. -->

A completed copy of this template is everything Claude Code needs to add a
**technique** to `src/shared/techniques/` with **zero follow-up questions**.
Save completed briefs as `specs/techniques/<technique-id>.md`.

> **What a technique is** (see `GLOSSARY.md` §4 and `src/shared/techniques/index.ts`).
> A **technique** encodes the pedagogy of **one recurring maths move** — its
> **step titles** and its live-model **fragments** — authored **once** and reused
> across many tools. The same move renders at three **grains**:
>
> - **brief** — assume the student can already do this move; one line, keep going.
>   What a higher-order tool wants for a *prerequisite* it doesn't teach.
> - **standard** — the default worked-example grain: one step per conceptual move,
>   arithmetic folded into the result.
> - **full** — every micro-step ("Subtract 3 from both sides", "Divide by 2"). The
>   fundamental teaching pattern; this grain **is the text spine of the matching
>   skill**.
>
> The tool chooses the grain per call. Your job here is to design the **pedagogy
> of the move at each grain** — the titles, the order, the fragments — not the
> code. Read the existing techniques in `index.ts` (e.g. `quadraticFormulaSteps`,
> `solveLinearEquationSteps`) to match their shape.
>
> **Fragments = live modelling.** A step's maths line can reveal one **fragment**
> at a time, in the order a teacher writes it on the board. A fragment is *the
> next mark a teacher would write* — a whole decision (an operator with its
> operand, a complete `= …` link), never a lone token. 2–4 fragments per step is
> the norm; a single indivisible fact has none.

---

## 1. Overview

| Field | Value |
|---|---|
| Technique name | <!-- human name, e.g. "Solve a linear equation" --> |
| Technique id | <!-- the exported function name, e.g. `solveLinearEquationSteps` --> |
| The one move it encodes | <!-- one sentence: "do the same to both sides to isolate the variable" --> |
| Inputs (in plain terms) | <!-- what the function is handed, e.g. "coefficients a, b, c of a·x + b = c, and the variable name" --> |
| Tools that will reuse it | <!-- which tools call this, and at which grain — e.g. "the sim-eq tool (brief, as a sub-step); a future linear-equations tool (full, as the taught move)" --> |

**Why a technique (not bespoke steps):** name at least two places this move
recurs. A move used in only one tool is usually just that tool's working — a
technique earns its keep by being **reused**.

---

## 2. Relationship to a skill

<!-- A technique narrates a move in WORKING STEPS; a skill (src/shared/skills/)
     teaches a prerequisite in SLIDES. The FULL grain of a technique is the text
     spine of the matching skill. State the relationship: -->

- **Matching skill:** <!-- id if it exists (e.g. `solve-linear`), "should be authored alongside", or "none — this move is never a drill-down" -->
- If a skill should exist and doesn't, note it so Claude Code authors it in the
  same commit (see `CLAUDE.md` → "Skill library").

---

## 3. The three grains

<!-- For each grain, say what it shows and when a tool asks for it. If a grain is
     genuinely identical to another for this move, say so rather than padding. -->

- **brief:** <!-- what the single line shows -->
- **standard:** <!-- the conceptual-move steps -->
- **full:** <!-- every micro-step -->

---

## 4. Step titles per grain (ordered)

<!-- The prose STEP TITLES, in order, for each grain. Titles are how the move is
     taught ("Subtract 3 from both sides", "Divide both sides by 2"). A title may
     carry a [[skill-id|term]] skill link where it names a prerequisite the move
     uses but doesn't teach. Give the titles only here; the maths lives in §5. -->

**brief**
1. 

**standard**
1. 
2. 

**full**
1. 
2. 
3. 

---

## 5. Worked numeric example at each grain

<!-- Pick ONE concrete example and write the full output at each grain in the
     site's step grammar, showing the FRAGMENTS as an ordered list per line:
       mStep("<title>", ["<frag 1>", "<frag 2>", "<frag 3>"])
       step(["<frag 1>", "<frag 2>"])          — bare maths, no title
       tStep("<prose>")                          — numberless prose (rare)
     Prose never goes inside the maths; a trailing unit is a plain-text 3rd arg to
     mStep. This is the correctness reference — Claude Code matches these shapes. -->

**Example inputs:** <!-- e.g. a = 2, b = 3, c = 11, variable x  →  2x + 3 = 11 --> 

**brief**
1. `mStep("…", ["…"])`

**standard**
1. `mStep("…", ["…", "…"])`
2. …

**full**
1. `mStep("…", ["…", "…", "…"])`
2. …

---

## 6. Edge cases

<!-- The degenerate inputs the step-builder must handle cleanly, and how:
       - coefficient 1 → skip the "divide by 1" step entirely (never emit it).
       - negative b → the title reads "Add" not "Subtract"; signs render correctly.
       - non-integer / fractional result → how it's displayed (reduced fraction?).
       - a step that would be vacuous for some inputs → omit it, don't show an
         empty move.
     List every case a real call could hit. -->

- 

---

## 7. Out of scope / future ideas (optional)

<!-- Related moves that are their OWN techniques (not this one), grains you chose
     not to differentiate yet, etc. -->
