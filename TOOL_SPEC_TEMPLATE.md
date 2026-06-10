# Tool Spec: <Tool Name>

**Status:** draft <!-- draft → ready → implemented. Claude Code only implements specs marked `ready`. -->

A completed copy of this template is everything Claude Code needs to build the
tool end-to-end with **zero follow-up questions**. Every section is required
unless marked optional. Save completed specs as `specs/<tool-id>.md`.

---

## 1. Overview

| Field | Value |
|---|---|
| Tool name | <!-- display name, e.g. "Multiplying Fractions" --> |
| Tool id / URL path | <!-- `/multiplying-fractions` — the id is the path without the slash --> |
| Category | <!-- Generators / Number / Algebra / Ratio & Proportion / Geometry / Probability & Statistics / Teacher Tools / Computer Science --> |
| Card description | <!-- one sentence for the landing page card --> |
| Defaults | <!-- only non-standard ones: numQuestions, numColumns, fixedColumns, font sizes, comingSoonLevels. Write "standard" if none. --> |

**Pedagogical intent (2–3 sentences):** what should a student be able to do
after a lesson built on this tool, and where does it sit in the teaching
sequence (what comes before and after it)?

---

## 2. Sub-tools

<!-- 1–5 sub-tools. One sub-tool = one tab = one question generator. -->

| Key | Tab label | Kind | Instruction line |
|---|---|---|---|
| `subtool1` | <!-- label --> | simple / worded / diagram | <!-- e.g. "Simplify:" or — --> |

---

## 3. Sub-tool detail

<!-- Repeat this whole section for each sub-tool. -->

### Sub-tool: <Tab label> (`key`)

#### 3.1 Question options (QO)

<!-- Exact control configs. multiSelect is the default choice. State every
     option's value, label, and whether it is defaultActive. If controls
     differ by level, give the per-level breakdown. Write "none" if no QO. -->

- **multiSelect** `questionPool` — "Question Types":
  - `typeA` — "Label A" — defaultActive: true
  - `typeB` — "Label B" — defaultActive: false
- **dropdown / variables:** none
- **Per-level differences:** none

#### 3.2 Levels

<!-- The heart of the spec. For each level give:
     Parameters — every random value with its exact range or set.
     Constraints — invariants every generated question must satisfy
       (e.g. "answer is always a positive integer").
     Exclusions — degenerate cases to reject (e.g. a = b, answer = 0,
       multiplying by 1, ratio already simplified).
     Misconceptions targeted — the wrong thinking this level exposes, and how
       parameters are chosen so the misconception produces a visibly wrong
       answer (not accidentally the right one). -->

**Level 1 (confidence builder — simplest complete form of the skill):**
- Parameters:
- Constraints:
- Exclusions:
- Misconceptions targeted:

**Level 2 (the standard KS3/GCSE domain of the skill):**
- Parameters:
- Constraints:
- Exclusions:
- Misconceptions targeted:

**Level 3 (stretch — reverse questions, problem solving, negatives/algebra):**
- Parameters:
- Constraints:
- Exclusions:
- Misconceptions targeted:

#### 3.3 Worked example script

<!-- The exact step sequence shown in Worked Example mode, written in the
     site's step grammar:
       mStep("<prose label>", <maths>)  — labelled step (the default)
       step(<maths>)                    — bare maths (chains of equals)
       tStep("<prose>")                 — numberless prose (rare)
     Give the script per level (or once if identical), each with one fully
     worked numeric example. Prose never goes inside the maths. -->

**Level 1 example — question: `<display>`**
1. `mStep("…:", "…")`
2. `mStep("Answer:", "…", "<unit>")`

**Level 2:** same as Level 1 / <script>

**Level 3:** <script>

#### 3.4 Sample questions (acceptance set)

<!-- At least 3 per level, using realistic values from the ranges in 3.2.
     These define correctness: Claude Code verifies its generator produces
     questions of exactly these shapes with matching answers and working. -->

| Level | Question as displayed | Answer | Working (one line) |
|---|---|---|---|
| 1 | | | |
| 1 | | | |
| 1 | | | |
| 2 | | | |
| 2 | | | |
| 2 | | | |
| 3 | | | |
| 3 | | | |
| 3 | | | |

#### 3.5 Uniqueness

<!-- Which parameters must appear in the question key so two visually
     identical questions can never share a worksheet. -->

Key parameters:

---

## 4. Variety requirements

<!-- What stops a worksheet feeling samey: operation/type mix, context and
     name pools for worded questions, parameter distribution notes (e.g.
     "spread denominators across the full set — don't cluster on 2"),
     anything the generator should actively balance. -->

---

## 5. Info modal content

<!-- Draft INFO_SECTIONS: one section per sub-tool (Overview + what each
     level contains), plus anything a teacher needs to choose the right level
     for a class. Written for a teacher, not a student. -->

---

## 6. Out of scope / future ideas (optional)

<!-- Deliberate exclusions, possible extensions, diagram versions — so the
     implementer doesn't guess or scope-creep. -->
