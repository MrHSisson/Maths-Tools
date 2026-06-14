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
| Defaults | <!-- only non-standard ones: numQuestions, numColumns, fixedColumns, font sizes, comingSoonLevels. Write "standard" if none — see note below for the standard values. --> |

**"Standard" values** (no `defaults` override needed): `numQuestions: 15`
(worksheet count, teacher-adjustable 1–24) · `numColumns: 3` (worksheet grid,
teacher-adjustable 1–4) · `displayFontSize: 2` (whiteboard/example, index
0–5, `2 = text-3xl`) · `worksheetFontSize: 1` (worksheet cells, index 0–5,
`1 = text-xl`). Only list a field here if it differs from these — e.g. an
SVG worksheet needing `fixedColumns: true, numColumns: 3` for a 3×5 grid.

`comingSoonLevels: ["level3"]` marks a level as built-but-disabled (greyed
out, "Coming soon" tooltip, excluded from Differentiated mode) — use when
this spec deliberately implements fewer than 3 levels and a future spec adds
the rest. Pair with `levels: ["level1","level2"]` on the `__test` export.

**Pedagogical intent (2–3 sentences):** what should a student be able to do
after a lesson built on this tool, and where does it sit in the teaching
sequence (what comes before and after it)?

---

## 2. Sub-tools

<!-- 1–5 sub-tools. One sub-tool = one tab = one question generator. -->

| Key | Tab label | Kind | Instruction line |
|---|---|---|---|
| `subtool1` | <!-- label --> | simple / worded / diagram | <!-- e.g. "Simplify:" or — --> |

`—` means no instruction line is shown above the question — the normal
choice for `worded` sub-tools, whose question text is self-contained.
`simple` and `diagram` sub-tools almost always need one (e.g. "Simplify:",
"Find x:").

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

**Differentiated worksheet mode:** its three columns are Level 1 / 2 / 3,
each generating `numQuestions` questions (the same count in every column)
using **that level's own QO state** — seeded from this level's
`difficultySettings` (or the tool-level defaults if none given), and
independently adjustable by the teacher via the Differentiated QO popover.
If QO should genuinely differ by level, define it under **Per-level
differences** so each differentiated column starts sensibly configured.

`difficultySettings` is not a separate thing to define — for level N it is
simply whatever you wrote under **Per-level differences** for level N (its
own multiSelect/dropdown/variables), or the tool-level QO config above if
**Per-level differences** says "none". Nothing extra to write here.

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

#### 3.2b Diagram spec (diagram sub-tools only — omit for simple/worded)

<!-- Diagram sub-tools are meaningfully more expensive to build — confirm
     with the teacher before committing to one (see TOOL_DESIGNER_PROMPT.md).
     Describe, in prose, enough for the implementer to build the SVG without
     guessing. -->

- **What's drawn:** the fixed geometry (e.g. "two parallel horizontal lines
  cut by a transversal").
- **What varies per question:** which values are randomised per level (e.g.
  "the angle at the top intersection, 20–160° excluding multiples of 90°")
  and any layout randomisation (e.g. rotation of the whole figure).
- **Labelling conventions:** how knowns vs unknowns are shown (e.g. known
  angles labelled `"<value>°"`, the unknown angle always labelled `x` — `y`
  for a second unknown in chained questions). State the convention once here
  rather than repeating it per level.
- **Reference implementation to follow:** name the closest existing diagram
  tool (e.g. `AnglesInParallelLines.tsx`, `BasicAngleFacts.tsx`) so the
  implementer reuses its SVG/print conventions.
- **Whiteboard / Worked Example display (default — only mention if this
  sub-tool deviates):** diagram sub-tools render the *same SVG* via
  `questionRenderer` in all three modes, just larger — worksheet cell
  (~180px) → whiteboard panel (~340px) → worked example/fullscreen
  (~500px). The unknown is shown as `x`/`y` until "Show answer" is toggled,
  which reveals its value directly on the diagram; Worked Example mode does
  **not** redraw or step through multiple copies of the diagram — the step
  list below it does the explaining. Only add detail here if this sub-tool
  needs something different (e.g. the figure must redraw between steps).

#### 3.3 Worked example script

<!-- The exact step sequence shown in Worked Example mode, written in the
     site's step grammar:
       mStep("<prose label>", <maths>)  — labelled step (the default)
       step(<maths>)                    — bare maths (chains of equals)
       tStep("<prose>")                 — numberless prose (rare)
     Give the script per level (or once if identical), each with one fully
     worked numeric example. Prose never goes inside the maths.

     A unit after the final maths (e.g. "kg", "°", "cm²") is the THIRD
     argument to mStep — mStep("Answer:", "12", "kg") — never written inside
     the maths string and never wrapped in \text{}. This is the one and only
     way units appear: as plain text after the rendered maths.

     This script is the canonical example for a TYPICAL question at that
     level, not a step count enforced for every question. If the exclusions
     in 3.2 remove all degenerate cases, one fixed sequence is normal. If the
     level genuinely has distinct solution paths (e.g. "no real roots" vs
     "two roots"), describe each path as its own labelled sub-case with its
     own worked example — never include a step that would be vacuous (e.g.
     a "simplify" step when nothing simplifies). -->

**Level 1 example — question: `<display>`**
1. `mStep("…:", "…")`
2. `mStep("Answer:", "…", "<unit>")`

**Level 2:** same as Level 1 / <script>

**Level 3:** <script>

#### 3.4 Sample questions (acceptance set)

<!-- At least 3 per level, using realistic values from the ranges in 3.2.
     These define correctness: Claude Code verifies its generator produces
     questions of exactly these shapes with matching answers and working.

     PDF export: the worksheet's "Answers" pages show answerLatex/answer +
     answerSuffix only — never the working steps. House style for the answer
     itself (simplest form, decimal places, units, degree symbol etc.) is
     therefore part of THIS spec's Constraints (3.2), not a site-wide
     default — state it per level if it isn't obvious from the parameters.

     answerSuffix is just the plain-text unit/symbol shown after the answer
     — "kg", "cm²", "°", "%", etc. Write the Answer column below exactly as
     it should appear (e.g. "12 kg", "35°", "£4.50") — the implementer splits
     it into the maths part (answerLatex/answer) and the trailing plain-text
     answerSuffix. Nothing separate to define. -->

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

**Pool size:** each level's parameter space must yield at least
`numQuestions` (15 by default, teacher-adjustable to 24) distinct keys —
ToolShell's retry loop gives up after 100 attempts and silently allows a
repeat if the pool is smaller. This is easy to hit at Level 1 with a small
multiSelect/range. If a level's natural pool is small, either widen the
range/pool (preferred) or note the expected pool size here so the
implementer can sanity-check it against the default worksheet size.

---

## 4. Variety requirements

<!-- What stops a worksheet feeling samey: operation/type mix, context and
     name pools for worded questions, parameter distribution notes (e.g.
     "spread denominators across the full set — don't cluster on 2"),
     anything the generator should actively balance.

     Worded question names: there's no shared site-wide name pool yet — each
     tool defines its own. Reuse this existing pool unless the names matter
     pedagogically:
     ["Alice","Ben","Charlie","Diana","Emma","Finn","Grace","Harry","Isla",
      "Jack","Kate","Liam","Mia","Olivia","Noah","Peter"]
     (see RatioSharingTool.tsx). List a different/shorter pool here only if
     the context needs specific names (e.g. dish names for a recipes tool). -->

---

## 5. Info modal content

<!-- Draft INFO_SECTIONS: one section per sub-tool (Overview + what each
     level contains), plus anything a teacher needs to choose the right level
     for a class. Written for a teacher, not a student.

     Fixed structure per section — { title, icon, content: [{ label, detail }] }:
       - title: the sub-tool's tab label ("Modes" and "Question Options"
         sections are platform boilerplate Claude Code adds automatically —
         no need to draft those here)
       - icon: a single emoji
       - content: a list of { label, detail } rows — typically "Overview"
         plus one row per level (e.g. "Level 1 — Green": "...")
     Free markdown isn't supported — keep each detail to 1–2 sentences. -->

---

## 6. Out of scope / future ideas (optional)

<!-- Deliberate exclusions, possible extensions, diagram versions — so the
     implementer doesn't guess or scope-creep. -->
