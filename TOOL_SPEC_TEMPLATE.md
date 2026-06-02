# New Tool Spec

Copy this file, fill it in, and hand it to Claude. The more detail you provide here, the faster and more accurately the tool gets built with no back-and-forth.

---

## Overview

**Tool name:** (display name shown on landing page and at top of tool, e.g. "Multiplying Fractions")

**URL path:** (e.g. `/multiplying-fractions`)

**Category:** (Generators / Number / Algebra / Ratio & Proportion / Geometry / Probability & Statistics / Teacher Tools / Computer Science)

**Landing page description:** (one sentence, e.g. "Multiply pairs of fractions, including mixed numbers and improper fractions.")

---

## Sub-tools

(List the tab button names — 1 to 5. Each becomes a separate question generator.)

1. 
2. 
3. 

---

## Sub-tool Detail

Repeat this block for each sub-tool above.

---

### Sub-tool: [Name]

**Question type:** (simple — single expression with one answer / worded — multi-line context question)

**Instruction line:** (shown above the question, e.g. "Simplify:", "Solve:", "Find:" — leave blank if none)

**Use substantial boxes:** (yes / no — yes for multi-line worded questions, no for compact single-line)

---

#### Levels

**Level 1 (easiest):**
(Describe what makes it easy — e.g. "positive integers only, denominators 2–5")

**Level 2 (medium):**
(What extra difficulty is added — e.g. "includes negative values")

**Level 3 (hardest):**
(What makes it hardest — e.g. "fractional denominators, mixed numbers")

---

#### Question Options (QO)

What controls should the teacher have to customise the question pool?

**Multi-select pool** (tick-box options the teacher can turn on/off — default choice):

| Option label | What it does | On by default? |
|---|---|---|
| e.g. "Proper fractions" | Only generates proper fractions | Yes |
| e.g. "Mixed numbers" | Includes mixed numbers | No |

**Dropdown** (single mutually-exclusive setting — use only if one option must be active at a time):

| Option label | What it does | Default? |
|---|---|---|
| | | |

**Toggles** (independent on/off switches — use sparingly):

| Toggle label | What it controls | Default |
|---|---|---|
| | | |

(Delete the controls you don't need)

---

#### Worked Example Steps

How is the solution explained, step by step? Write it out as a teacher would on a board.
Label each step and show the maths clearly — Claude will convert this to KaTeX.

**Level 1 example:**

- Step 1 — [label]: [maths]
- Step 2 — [label]: [maths]
- Step 3 — [label]: [maths]

**Level 2 example:** (describe if steps differ from Level 1, otherwise write "same as Level 1")

**Level 3 example:** (describe if steps differ, otherwise write "same as Level 2")

---

## Display Defaults

(Leave blank to use standard defaults)

**Starting font size:** (small / medium / large / x-large — default is large)

**Starting question count:** (default is 15)

**Fixed question count:** (yes / no — yes hides the question count input entirely)

**Max columns:** (default is 4 — set to 3 if 4-column layout never makes sense for this question type)

**Fixed columns:** (yes / no — yes hides the column input entirely)

---

## Extra Notes

(Anything else Claude should know — edge cases to avoid, specific number ranges, formatting preferences, real-world context for worded questions, etc.)
