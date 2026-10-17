# Exam Topic Report — <TOPIC>

> **HOW TO FILL THIS IN (instructions for the report writer — keep this box in the output)**
>
> You are given: the specification, AS past-paper questions, A-level past-paper questions, and the legacy specification, all on **<TOPIC>**. Fill in every section below, in order, keeping the headings and table columns exactly as written. This report is read by a developer who builds an exam-style question generator from it, so precision matters more than prose.
>
> Rules:
> 1. **Evidence, not adjectives.** Never write "usually", "often" or "typically" without a count. Write `14/22` (14 of 22 questions) and cite sources.
> 2. **Cite every claim** as `Board Series Paper Qn` (e.g. `Edexcel Jun-19 D1 Q5`), or `Spec <ref>`.
> 3. **Keep AS, A-level and legacy separate** wherever they differ. Use the columns provided. If they are the same, say so once.
> 4. **Paraphrase** question wording. Quote only short mark-scheme phrases (a line or less) where the exact wording matters.
> 5. **Do not infer.** If the sources do not show something, write `not found`. If you are inferring, write `INFERRED:` first.
> 6. **Fill every table row you can; delete no columns.** Add rows as needed.
> 7. Where a field says `one of: …`, use only those values.
> 8. Do not add commentary outside the sections. Put doubts in Section 11.

---

## 0. Sources and scope

**Topic:** <TOPIC>
**Boards / spec codes covered:**

| Source | Board | Spec code | Level (AS / A-level / legacy) | Series covered | Questions on this topic |
|---|---|---|---|---|---|
|  |  |  |  |  |  |

**Totals:** AS ___ · A-level ___ · legacy ___ · all ___ questions

**Specification content statements** (quote each, then mark where it is examinable):

| Spec ref | Statement (quoted) | AS | A-level | Legacy only | Removed in current spec |
|---|---|---|---|---|---|
|  |  | Y/N | Y/N | Y/N | Y/N |

**Notation and terms the spec requires students to use:**
-

---

## 1. Question census

One row per question found. Do not skip any.

| Source (Board Series Paper Qn) | Level | Total marks | Number of parts | Part task types in order (use names from Section 3) | Network/data given or drawn by student | Position in paper (early/mid/late) |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |

---

## 2. Question archetypes

The recurring whole-question shapes. An archetype is a repeated sequence of part types. Group the census into archetypes.

| Archetype name | Part sequence with marks, e.g. `(a) forward pass 3, (b) backward pass 3, (c) critical activities 2` | Count AS | Count A-level | Count legacy | Total marks range | Example sources |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |

**Archetypes that appear only at one level:**
-

**Changes over time** (e.g. older papers asked X, newer papers ask Y):
-

---

## 3. Part-type catalogue

One block per task a single part can ask for. Copy the block for each part type. Name each part type with a short, stable name used everywhere else in this report.

### 3.N — <part type name>

```yaml
name:                  # short stable name
count_AS:              # n of N parts
count_Alevel:
count_legacy:
marks_range:           # e.g. 2-4
marks_most_common:
command_words:         # e.g. [state, find, show that, explain, draw]
phrasing_examples:     # 2-3 PARAPHRASED prompts, no numbers
given:                 # what the question supplies
produces:              # what the student must produce
produces_form:         # one of: number | list | table | drawn-on-diagram | written-statement | algorithm-trace | other
diagram_state:         # one of: given | blank | partly-filled | answer-drawn-on | not-applicable | shared-with-previous-part
depends_on:            # earlier part types whose result this uses, or none
conditional_on:        # feature that must exist for this part to appear, or none
```

**Mark scheme pattern** (one row per mark; list marks in the order they appear):

| Mark code (M1/A1/B1/E1/R1/…) | What earns it | Dependent on | Follow-through allowed (Y/N) |
|---|---|---|---|
|  |  |  |  |

**Model answer form:** (how the answer is laid out in the mark scheme)

**Method steps in the order a teacher would write them on a board:**
1.
2.

**Acceptable alternatives noted in mark schemes:**
-

---

## 4. Pairings and sequences

How part types connect across a question.

| Follows (previous part type) | Part type | Count | Uses previous result (Y/N) | Shares the same figure (Y/N) |
|---|---|---|---|---|
|  |  |  |  |  |

**Conditional parts** (appear only when the question has a particular feature):

| Part type | Appears only when | Count |
|---|---|---|
|  |  |  |

**Parts always asked together (never alone):**
-

**Parts that are never asked together:**
-

---

## 5. Givens and data conventions

What the question supplies, and the sizes it uses.

| Feature | AS observed range | A-level observed range | Legacy observed range | Count with the feature (of all questions) |
|---|---|---|---|---|
| Size of structure (e.g. vertices / activities / rows) |  |  |  |  |
| Size of numbers (min–max, integer or decimal) |  |  |  |  |
| Number of special elements (e.g. sources, sinks, restrictions, dummies) |  |  |  |  |
| Optional features (list each as its own row) |  |  |  |  |

**Labelling and notation conventions by board** (how nodes, arcs, tables and values are labelled):

| Board | Convention |
|---|---|
|  |  |

**How the structure is presented** (diagram only / table only / both; student-drawn or given):
-

**Answer-space and printed-figure conventions** (blank figures supplied, how many per question, what they are for):
-

---

## 6. Variation space

What changes between questions, and what never does. This decides what a generator may randomise.

| Parameter | Observed values / range | Frequency of each | Safe to randomise (Y/N) | Notes |
|---|---|---|---|---|
|  |  |  |  |  |

**Things that never vary** (keep fixed in a generator):
-

**Difficulty drivers** (what makes one question harder than another), ranked, with the evidence for each:
1.

**AS vs A-level vs legacy difficulty differences:**
-

---

## 7. Mark scheme conventions

| Convention | Meaning in these papers | Example source |
|---|---|---|
| ft / follow through |  |  |
| cao |  |  |
| dependent marks (dep) |  |  |
| isw / oe / any other abbreviations used |  |  |

**Common penalties and "do not accept" rulings:**
-

**Marking of justification and explanation parts.** For each, give the exact points the mark scheme requires (short quotes allowed):

| Part type | Required justification points | Example source |
|---|---|---|
|  |  |  |

---

## 8. Examiner report evidence

For each error, tie it to a part type from Section 3.

| Part type | Common error or misconception (state as: students did X when they should have Y) | Mentioned in how many reports | Marks usually lost | Example source |
|---|---|---|---|---|
|  |  |  |  |  |

**Percentage of students scoring each mark** (where the reports give it):

| Source | Part | Mark | % scoring |
|---|---|---|---|
|  |  |  |  |

**Examiner advice** on technique, layout or working (quote briefly, with source):
-

**Presentation issues** (answers written in wrong place, missing labels, unclear working):
-

---

## 9. Annotated exemplars

Three to five representative questions, **one for each main archetype in Section 2**. Use the real numbers from the source; these are the developer's acceptance reference and will not be published.

### 9.N — <archetype name> — <source>

**Skeleton** (context, structure, every value needed to reproduce it):

**Parts:**

| Part | Prompt (paraphrased) | Marks | Mark scheme (one line per mark: code — what earns it) | Model answer | Method steps (board order) | Diagram state |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |

**Examiner report notes for this question:**

---

## 10. Targeted-tool candidates

The small skills inside the topic that a focused tool (not an exam generator) could drill. List each as one procedure.

| Skill name | Procedure (steps) | Prerequisite skills | Typical errors (from Section 8) | Appears in part types | Suggested levels (what changes between easy and hard) |
|---|---|---|---|---|---|
|  |  |  |  |  |  |

**Representations used in mark schemes and examiner reports** (e.g. network diagram, table, Gantt chart, cascade chart, tree, graph). For each, state how often it is needed and what the student must do with it:

| Representation | Count | Student must… |
|---|---|---|
|  |  |  |

---

## 11. Gaps, disagreements and confidence

**Not found in the sources** (things a generator would need but the papers do not show):
-

**Board disagreements** (where Edexcel, AQA, OCR or others differ in method, notation or marking):

| Point | Board A says | Board B says |
|---|---|---|
|  |  |  |

**Inferred rather than observed** (every `INFERRED:` item, listed again here):
-

**Question types in the papers that need a diagram or representation not described above** (flag for a build decision):
-

**Confidence in Sections 2–6** (one of: high / medium / low) and why:
-
