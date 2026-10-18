# Exam Topic Report — Critical Path Analysis

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

**Topic:** Critical Path Analysis (activity networks, activity-on-node)
**Boards / spec codes covered:**

| Source | Board | Spec code | Level (AS / A-level / legacy) | Series covered | Questions on this topic |
|---|---|---|---|---|---|
| `Discrete - Critical Path Analysis - Current Spec AS.pdf` (Exampro compilation, "Meden School") | AQA (INFERRED: the board is not printed in the extracted text; the mark scheme uses AO codes and "Typical Solution" columns, and `Spec DE1–DE6` in `specs/exam/spec/aqa-discrete.md` match the content) | 7366 (INFERRED) | AS | not found (series, year and paper are not printed in the text) | 8 (Q1–Q8) |
| `Discrete - Critical Path Analysis - Current Spec A-Level.pdf` (same compiler) | AQA (INFERRED, as above) | 7367 (INFERRED) | A-level | not found | 6 on this topic (Q1–Q6); Q7 is a minimum spanning tree question and is **out of scope** |
| `Discrete - Critical Path Analysis - Legacy Spec.pdf` (same compiler) | not found (INFERRED: Edexcel D1, from the mark codes `M1 A1 B1 E1`, `ft`, `cso`, `cao`; and an examiner report that mentions a dynamic programming "stage/state table") | not found | legacy | not found | 24 (Q1–Q24) |

**Totals:** AS 8 · A-level 6 · legacy 24 · all 38 questions (AS 39 marks, A-level 39 marks, legacy 345 marks)

Citation form used below: `AS Qn`, `AL Qn` (A-level), `LG Qn` (legacy), meaning the question number inside that compilation. The board, series and paper are `not found`.

**Specification content statements** (quote each, then mark where it is examinable):

| Spec ref | Statement (quoted) | AS | A-level | Legacy only | Removed in current spec |
|---|---|---|---|---|---|
| DE1 | "Construct, represent and interpret a precedence (activity) network using activity-on-node." | Y | Y | N | N |
| DE2 | "Determine earliest and latest start and finish times for an activity network." | Y | Y | N | N |
| DE3 | "Identify critical activities, critical paths and the float of non-critical activities." | Y | Y | N | N |
| DE4 | "Refine models and understand the implications of possible changes in the context of critical path analysis." | Y | Y | N | N |
| DE5 | "Construct and interpret Gantt (cascade) diagrams and resource histograms." | N | Y | N | N |
| DE6 | "Carry out resource levelling (using heuristic procedures) and solve problems where resources are restricted." | N | Y | N | N |

(`Spec DE1–DE6`, `specs/exam/spec/aqa-discrete.md`. Legacy spec statements: not found; the legacy PDF contains only questions, mark schemes and examiner reports.)

**Notation and terms the spec requires students to use:**
- precedence (activity) network, activity-on-node (`Spec DE1`); the questions also say "activity diagram" (`LG Q1`), "activity network" (`AS Q1`).
- earliest start time, latest finish time, critical activity, critical path, float (`Spec DE2, DE3`); legacy papers also say "slack" (`LG Q3` mark scheme).
- Gantt diagram, cascade diagram/chart, resource histogram, resource levelling (`Spec DE5, DE6`).
- "immediate predecessor(s)" in every precedence table (`AS Q2`, `AL Q5`, `LG Q9`).

---

## 1. Question census

One row per question found. Do not skip any. Part task types use the names of Section 3. `network given` = the network is drawn in the question; `table given` = a precedence table is given and the student draws the network; `student-drawn` = student draws a Gantt chart or histogram.

| Source (Board Series Paper Qn) | Level | Total marks | Number of parts | Part task types in order (use names from Section 3) | Network/data given or drawn by student | Position in paper (early/mid/late) |
|---|---|---|---|---|---|---|
| AS Q1 | AS | 5 | 2 | timesOnNetwork (3), whatIfChange (2) | network given, 10 activities | not found |
| AS Q2 | AS | 6 | 2 | buildNetworkAndTimes (4), whatIfChange (2) | table given, 12 activities; student draws network | not found |
| AS Q3 | AS | 6 | 2 | buildNetworkAndTimes (4), claimComment (2) | table given, 10 activities (days); student draws network | not found |
| AS Q4 | AS | 7 | 5 | timesOnNetwork (3), minTime (1), criticalPath (1), claimComment (1), claimComment (1) | network given, 10 activities | not found |
| AS Q5 | AS | 3 (mark scheme lists 4) | 2 | criticalPath (1), whatIfChange (2) | completed network given, 11 activities | not found |
| AS Q6 | AS | 2 | 2 | unknownValues (1), unknownValues (1) | partial network, 3 activities; multiple choice | not found |
| AS Q7 | AS | 1 | 1 | unknownValues (1) | part of a network; multiple choice | not found |
| AS Q8 | AS | 9 | 6 | precedenceTable (1), timesOnNetwork (2), firstActivity (2), contextTime (1), precedenceTable (1), contextTime (2) | network given (9 activities), second small project of 3 activities, context: meal with clock time | not found |
| AL Q1 | A-level | 6 | 3 | timesOnNetwork (2), float (1), cascade (3) | network given, 10 activities | not found |
| AL Q2 | A-level | 7 | 3 | criticalPath (1), histogram (3), levelling (3) | completed network with workers per activity, 11 activities; student draws | not found |
| AL Q3 | A-level | 8 | 4 | timesOnNetwork (2), criticalPath (1), cascade (3), whatIfChange (2) | network given, 11 activities | not found |
| AL Q4 | A-level | 1 | 1 | levelling (1) | histogram given, 12 activities, 2 workers; tick the correct levelled histogram | not found |
| AL Q5 | A-level | 10 | 5 | buildNetworkAndTimes (2+3), criticalPath (1), histogram (2), levelling (2) | table given, 12 activities, one worker each | not found |
| AL Q6 | A-level | 7 | 3 | timesOnNetwork (2), speedUpWhich (3), modelLimitation (2) | network given, durations in hours | not found |
| LG Q1 | legacy | 13 | 7 | timesOnNetwork (4), precedenceTable (2), criticalPath (1), float (1), histogram (3), levelling (1), levelling (1) | network given, 11 activities (hours), one worker each | not found |
| LG Q2 | legacy | 14 | 5 | unknownValues (3), criticalPath (2), float (2), histogram (5), levelling (2) | network given with some times, 10 activities, workers table | not found |
| LG Q3 | legacy | 14 | 4 | timesOnNetwork (4), criticalPath (3), cascade (5), maxDurationInequality (2) | network given | not found |
| LG Q4 | legacy | 14 | 4 | timesOnNetwork (4), criticalPath + float (3), histogram (4), levelling (3) | network given, 12 activities, workers table | not found |
| LG Q5 | legacy | 13 | 4 | timesOnNetwork (4), criticalPath (3), float (2), cascade, late start (4) | network given | not found |
| LG Q6 | legacy | 13 | 4 | timesOnNetwork (2+2), float (1), criticalPath (3), histogram, late start (5) | network given, 10 activities, workers table | not found |
| LG Q7 | legacy | 13 | 4 | timesOnNetwork (4), criticalPath (3), cascade (3), whatIfChange (2+1) | network given | not found |
| LG Q8 | legacy | 14 | 3 | timesOnNetwork (2+2), criticalPath (3), histogram (4), levelling (3) | network given, 10 activities, workers table | not found |
| LG Q9 | legacy | 15 | 5 | buildNetworkAndTimes (2+4), criticalPath (2), histogram (4), levelling (3) | table given, 9 activities, workers | not found |
| LG Q10 | legacy | 12 | 4 | timesOnNetwork (4), criticalPath (3), cascade (3), whatIfChange (2) | network given | not found |
| LG Q11 | legacy | 18 | 7 | buildNetworkAndTimes (3+2+2), criticalPath (2), float (2), histogram (4), levelling (3) | table given, 9 activities, workers | not found |
| LG Q12 | legacy | 14 | 6 | buildNetworkAndTimes (3+2+2), criticalPath (1), float (2), cascade, late start (4) | table given, 9 activities | not found |
| LG Q13 | legacy | 13 | 5 | timesOnNetwork (2+2), criticalPath (1), float (1), cascade (3), whatIfChange (3+1) | network given | not found |
| LG Q14 | legacy | 12 | 5 | timesOnNetwork (2+2), criticalPath (1), floatList (1), histogram (3), levelling (2), workerAllocation (1) | network given, one worker each | not found |
| LG Q15 | legacy | 12 | 4 | timesOnNetwork (2+2), floatList (1), cascade (3), levelling (2), workerAllocation (2) | network given, 13 activities | not found |
| LG Q16 | legacy | 9 | 3 | buildNetworkAndTimes (3), minTime (2), cascade (4) | table given, 8 activities (driveway context) | not found |
| LG Q17 | legacy | 13 | 5 | precedenceTable (2), timesOnNetwork (4), criticalPath (1), cascade, late start (4), levelling (2) | network given, 10 activities (hours) | not found |
| LG Q18 | legacy | 13 | 5 | buildNetworkAndTimes (3+2+2), float (2), histogram (4) | table given, 9 activities, workers | not found |
| LG Q19 | legacy | 11 | 4 | timesOnNetwork (2+2), criticalPath (1), cascade (3), levelling (3) | network given | not found |
| LG Q20 | legacy | 20 | 6 | buildNetworkAndTimes (4+3+3), criticalPath (2), cascade (3), speedUpWhich (5) | table given, 13 activities, trades, fractional days | not found |
| LG Q21 | legacy | 20 | 6 | buildNetworkAndTimes (4+3+3), criticalPath (2), histogram (4), levelling (4) | table given, 9 activities, workers | not found |
| LG Q22 | legacy | 20 | 7 | buildNetworkAndTimes (4+3+3), criticalPath (2), cascade (4), histogram (2), workerAllocation (2) | table given, 9 activities, building context | not found |
| LG Q23 | legacy | 19 | 5 | buildNetworkAndTimes (4), timesOnNetwork + criticalPath (6), float (2), cascade + helpers (5), levelling (2) | table given, 9 activities | not found |
| LG Q24 | legacy | 16 | 4 | buildNetworkAndTimes (5, 11 with the passes), cascade (3), levelling (2) | table given, 8 activities, people per activity | not found |

---

## 2. Question archetypes

The recurring whole-question shapes. An archetype is a repeated sequence of part types.

| Archetype name | Part sequence with marks, e.g. `(a) forward pass 3, (b) backward pass 3, (c) critical activities 2` | Count AS | Count A-level | Count legacy | Total marks range | Example sources |
|---|---|---|---|---|---|---|
| **A. Table → network → times → what-if/claim** | (a) construct the network and times 4, (b) effect of a change or comment on a claim 2 | 3 (AS Q2, Q3, and Q1 as a variant with the network given) | 0 | 0 | 5–6 | AS Q2, AS Q3, AS Q1 |
| **B. Network given → times → critical activities → test a claim** | (a) times 3 + min time 1, (b) critical activities 1, (c) two claim parts 2 | 1 | 0 | 0 | 7 | AS Q4 |
| **C. Completed network → critical path → deduce the effect of a change** | (a) critical path 1, (b) effect on earliest start/latest finish 2–3 | 1 | 0 | 0 | 3–4 | AS Q5 |
| **D. Context with clock time and a second sub-project** | (a) precedence table 1 + times 2, (b) first activity + justify 2 + completion time 1, (c) second table 1 + latest start time 2 | 1 | 0 | 0 | 9 | AS Q8 |
| **E. Short multiple-choice** | find an unknown time 1–2, or a condition on a duration 1 | 3 | 1 (levelled histogram, AL Q4) | 0 | 1–2 | AS Q6, AS Q7, AL Q4 |
| **F. Network given → times → critical path → Gantt** | (a) times 2–4, (b) critical path (+ min time) 1–3, (c) cascade 3–5, optionally (d) effect of a change or an inequality 2–3 | 0 | 2 (AL Q1, Q3) | 8 (LG Q3, Q5, Q7, Q10, Q13, Q15, Q19, Q17) | 6–14 | LG Q3, LG Q7, AL Q3 |
| **G. Network given → times → critical path → float → histogram → levelling** | times 4, critical paths 3, float 1–2, histogram 3–5, restricted workers 1–3 | 0 | 1 (AL Q2, with the network completed) | 6 (LG Q1, Q2, Q4, Q6, Q8, Q14) | 7–14 | LG Q1, LG Q4, AL Q2 |
| **H. Table (with workers) → network → ES → LF → critical path → floats → histogram → levelling or allocation** | network 3–4, ES 2–3, LF 2–3, critical path + time 2, floats 2, histogram 2–4, levelling 3–4 | 0 | 1 (AL Q5, shorter) | 5 (LG Q9, Q11, Q18, Q21, Q22) | 10–20 | LG Q11, LG Q21, AL Q5 |
| **I. Table → network → times → Gantt → workers/helpers** | network 3–5, times 5–8, critical path 1–2, cascade 3–5, restricted workers 2 | 0 | 0 | 5 (LG Q12, Q16, Q20, Q23, Q24) | 9–20 | LG Q16, LG Q23 |
| **J. Model critique** | which activity to shorten, with reason 3–5; a limitation of the model 2 | 0 | 1 (AL Q6) | 1 (LG Q20 part (f), which tradesman to add, 5 marks) | 7–20 | AL Q6, LG Q20 |

**Archetypes that appear only at one level:**
- Claim and "comment on the validity" parts (`claimComment`), clock-time conversions (`contextTime`) and "first activity to start, with justification" appear only at AS (AS Q3, Q4, Q8: 3 parts, 2 parts, 1 part). Not found at A-level or legacy.
- Gantt/cascade diagrams (AL Q1, Q3: 2 parts; LG: 14 parts), resource histograms (AL Q2, Q5: 2 parts; LG: 11 parts) and resource levelling (AL: 3 parts; LG: 14 questions) appear at A-level and legacy; `Spec DE5, DE6` mark them "N" for AS. AS: 0 of 8 questions.
- Finding an unknown time in a partly filled network appears in AS Q6 and LG Q2 (multiple-choice at AS, written at legacy). Not found at A-level.
- "Maximum duration / inequality" (`maxDurationInequality`) appears only in LG Q3(d). Not found elsewhere.
- Model critique (`speedUpWhich`, `modelLimitation`) appears in AL Q6 and LG Q20(f).

**Changes over time** (e.g. older papers asked X, newer papers ask Y):
- Marks per question: legacy 9–20 per question (mean about 14), AS 1–9, A-level 1–10 (`LG Q1–Q24`, `AS Q1–Q8`, `AL Q1–Q6`). Cause not found.
- Legacy parts ask for the network to be drawn (10/24: LG Q9, 11, 12, 16, 18, 20, 21, 22, 23, 24); current papers draw it in 3/14 (AS Q2, Q3, AL Q5).
- Legacy asks for the explanation of why a project overruns with restricted workers in 4 questions (LG Q8, Q9, Q11, Q21); current A-level asks for an explained effect (AL Q5(c)(ii), 2 marks) and a minimum completion time (AL Q2(c), 3 marks).
- Current papers add reasoning and context: claims (AS Q3, Q4), what-if with a deduction (AS Q5), limitations of the model (AL Q6); the legacy what-if parts are numerical (LG Q7, Q10, Q13).
- A multiple-choice form (AS Q6, Q7, AL Q4) is not found in legacy.
- Legacy Gantt parts ask for "as late as possible" in 3 questions (LG Q5, Q12, Q17) and for a late-start histogram in LG Q6; current A-level asks for early start only (AL Q1, Q3).

---

## 3. Part-type catalogue

One block per task a single part can ask for.

### 3.1 — buildNetworkAndTimes

```yaml
name:                  buildNetworkAndTimes
count_AS:              2 of 20 parts (AS Q2a, Q3a)
count_Alevel:          1 (AL Q5a(i) and (ii) as two sub-parts)
count_legacy:          10 questions build the network (LG Q9, 11, 12, 16, 18, 20, 21, 22, 23, 24); 8 of them then ask for the times as separate parts
marks_range:           AS 4; A-level 2 + 3; legacy 3–5 for the network, then 2–3 + 2–3 for the times (LG Q11: 3+2+2)
marks_most_common:     legacy network 3 (LG Q11, 12, 16, 18); 4 (LG Q20, 21, 22, 23)
command_words:         [construct, draw, complete, fill in]
phrasing_examples:     ["Construct an activity network for the project and fill in the earliest start time and latest finish time for each activity.", "Complete the activity network for the project on Figure 1.", "Draw an activity network for the project."]
given:                 a precedence table (activity, immediate predecessors, duration, sometimes workers per activity)
produces:              the activity network (activity-on-node boxes with arrows), often also the earliest start and latest finish times in the boxes
produces_form:         drawn-on-diagram
diagram_state:         blank (the student draws it; some papers give a partly drawn or empty figure, e.g. LG Q9 completes G, H, I)
depends_on:            none
conditional_on:        none
```

**Mark scheme pattern**

| Mark code (M1/A1/B1/E1/R1/…) | What earns it | Dependent on | Follow-through allowed (Y/N) |
|---|---|---|---|
| M1 | network with most activities and at least 4 correct connections (AS Q3: "at least 9 activities and at least 4 correct connections"; AL Q5: "at least 10 labelled activities … at least 4 connections") | none | N |
| A1 | network fully correct (omitted arrowheads condoned: AS Q3, AL Q5) | M1 | N |
| A1 / B1 | each of the earliest start and the latest finish times correct | the correct network | Y: the latest finish is B1F "FT their earliest start times" (AS Q2) |
| legacy A3 (or A1 A1 A1) | all correct, "–1 EE" (one mark off for each error) | M1 | Y |

**Model answer form:** a network drawn left to right; activity-on-node with the AQA box (earliest start, duration, latest finish); "condone extra 'End' activity with duration 0" (AS Q2, AS Q4).

**Method steps in the order a teacher would write them on a board:**
1. Place the activities with no predecessor in the first column.
2. Place each next activity once all its predecessors are placed and draw its arrows.
3. Forward pass: earliest starts left to right, taking the largest earliest finish into each box.
4. Backward pass: latest finishes right to left, taking the smallest latest start out of each box.

**Acceptable alternatives noted in mark schemes:**
- extra End activity of duration 0 (AS Q2a, AS Q4a); arrowheads omitted (AS Q3a, AL Q5a); dummy activities are not mentioned in any source (`not found`).

### 3.2 — timesOnNetwork

```yaml
name:                  timesOnNetwork
count_AS:              5 of 20 parts (AS Q1a, Q2a, Q3a, Q4a(i), Q8a(ii))
count_Alevel:          4 (AL Q1a(i), Q3a(i), Q5a(ii), Q6a)
count_legacy:          22 of 24 questions (all except LG Q2, Q16)
marks_range:           AS 2–4; A-level 2–3; legacy 4 (in one part) or 2 + 2 (earliest then latest)
marks_most_common:     legacy 4 (14/22 questions); AS 3; A-level 2
command_words:         [find, complete, show, write on the diagram]
phrasing_examples:     ["Find the earliest start time and the latest finish time for each activity and insert their values on Figure 1.", "Complete the activity network showing the earliest start time and latest finish time for each activity."]
given:                 a complete network with durations
produces:              earliest start and latest finish times in the box of every activity
produces_form:         drawn-on-diagram
diagram_state:         given
depends_on:            buildNetworkAndTimes (when the network was built first) or none
conditional_on:        none
```

**Mark scheme pattern**

| Mark code (M1/A1/B1/E1/R1/…) | What earns it | Dependent on | Follow-through allowed (Y/N) |
|---|---|---|---|
| M1 | forward pass: a few key activities correct ("correct at two of D, E, F": LG Q1; AS Q1 "correct start times for C, D, E and F") | none | Y |
| A1 / B1 | all earliest starts correct | M1 | N |
| M1 | backward pass correct at the key activities ("correct at G AND H ft": LG Q1; "up to one slip ft": LG Q4) | none | Y |
| A1 / B1 | all latest finishes correct | M1 | Y (B1F in AS Q2) |

**Model answer form:** the filled network figure.

**Method steps in the order a teacher would write them on a board:**
1. Forward pass; where an activity has several predecessors write the largest earliest finish.
2. Minimum completion time = the largest earliest finish.
3. Backward pass from the End; where an activity has several followers take the smallest latest start.

**Acceptable alternatives noted in mark schemes:**
- "Condone one slip (follow through)" (LG Q3, Q5, Q7, Q8); "up to 2 errors ft from K" (LG Q10).

### 3.3 — criticalPath

```yaml
name:                  criticalPath
count_AS:              2 of 20 parts (AS Q4b critical activities; AS Q5a critical path)
count_Alevel:          3 (AL Q2a, Q3a(ii), Q5b)
count_legacy:          21 of 24 questions: critical paths, critical path, or critical activities (LG Q1–Q14, Q17, Q19–Q24)
marks_range:           1–3
marks_most_common:     legacy 3 when the minimum completion time is asked in the same part (12 parts); 1 when only the path is asked
command_words:         [find, identify, write down, state, list]
phrasing_examples:     ["Find the critical paths and state the minimum time for completion of the project.", "Write down the critical path.", "Write down the critical activities of the network."]
given:                 a network (or one the student has completed)
produces:              the critical path(s) as a list of letters, and often the minimum completion time
produces_form:         list
diagram_state:         shared-with-previous-part
depends_on:            timesOnNetwork
conditional_on:        none
```

**Mark scheme pattern**

| Mark code (M1/A1/B1/E1/R1/…) | What earns it | Dependent on | Follow-through allowed (Y/N) |
|---|---|---|---|
| B1 / M1 | first critical path correct | the times | Y in legacy (ft their critical path used in the Gantt, LG Q3c) |
| B1 / A1 | second critical path correct and **no others** (LG Q2, Q3, Q5, Q6, Q7, Q8, Q10 all have two paths; "withhold if extra path such as ADGJK given", LG Q10) | none | N |
| B1 | minimum completion time **stated** ("Must be stated, not just a value in box", LG Q10) | none | Y |

**Model answer form:** letters in order, e.g. BEGKN / DFILN.

**Method steps in the order a teacher would write them on a board:**
1. Mark every activity whose float is zero.
2. Trace each path from Start to End through critical activities only.
3. Check no extra path is listed and state the minimum time.

**Acceptable alternatives noted in mark schemes:**
- AQA: "States BDGJK and no others" (AL Q2), "States the correct critical path and no others" (AS Q5). Legacy: listing the critical activities scores no marks when the paths are asked (examiner report, LG Q7).

### 3.4 — float

```yaml
name:                  float
count_AS:              0 asked directly (AS Q1b uses a float in the reasoning)
count_Alevel:          1 (AL Q1a(ii))
count_legacy:          10 questions (LG Q1d, Q2c, Q4b(ii), Q5c, Q6b, Q11e, Q12e, Q13c, Q18d, Q23c)
marks_range:           1–2 for one activity; 2 for each non-critical activity
marks_most_common:     legacy 2 (5/10: largest float, or all floats)
command_words:         [find, state, determine]
phrasing_examples:     ["Find the float time of activity E.", "Find the activity with the largest float and state the value of this float.", "State the float time for each non-critical activity."]
given:                 the network with times
produces:              a number, or a list of floats, or the activity with the greatest float
produces_form:         number
diagram_state:         shared-with-previous-part
depends_on:            timesOnNetwork
conditional_on:        none
```

**Mark scheme pattern**

| Mark code (M1/A1/B1/E1/R1/…) | What earns it | Dependent on | Follow-through allowed (Y/N) |
|---|---|---|---|
| M1 | correct subtraction `latest finish − earliest start − duration` ("13 − 2 − 7", LG Q4) | none | Y |
| A1 / B1 | correct value (units condoned: AL Q1a(ii)) | M1 | Y ("ft their G values", LG Q6) |

**Model answer form:** a value, or a list such as `C 4, D 2, F 3, G 3` (LG Q12).

**Method steps in the order a teacher would write them on a board:**
1. Latest finish minus earliest start.
2. Subtract the duration.

**Acceptable alternatives noted in mark schemes:**
- "A1cso" (correct solution only) on the value for the greatest float (LG Q5c).

### 3.5 — minTime

```yaml
name:                  minTime
count_AS:              2 (AS Q4a(ii), Q8b(ii))
count_Alevel:          0 as a separate part
count_legacy:          1 as a separate part (LG Q16b); in 12 further questions it is stated together with the critical path
marks_range:           1–2
marks_most_common:     1
command_words:         [state, find, determine]
phrasing_examples:     ["State the minimum completion time for the project.", "Determine the earliest possible time at which the preparation of the meal can be completed."]
given:                 the completed network
produces:              the largest earliest finish (a number, or a clock time)
produces_form:         number
diagram_state:         shared-with-previous-part
depends_on:            timesOnNetwork
conditional_on:        none
```

**Mark scheme pattern**

| Mark code (M1/A1/B1/E1/R1/…) | What earns it | Dependent on | Follow-through allowed (Y/N) |
|---|---|---|---|
| B1F | correct minimum completion time from their network (units condoned: AS Q4a(ii)) | timesOnNetwork | Y |
| M1 | AS Q8: add the minimum completion time to the start time (6:30 pm + 25 min) | none | Y |

**Model answer form:** `36 days`; `6:55 pm` ("must see indication of pm", AS Q8).

**Method steps in the order a teacher would write them on a board:**
1. Read the earliest start of End (the largest earliest finish).
2. Add it to the clock start if the question has a start time.

**Acceptable alternatives noted in mark schemes:**
- AS Q4: "condone missing units".

### 3.6 — cascade

```yaml
name:                  cascade
count_AS:              0 of 8 questions (not examinable at AS: Spec DE5 = N)
count_Alevel:          2 (AL Q1b, Q3b)
count_legacy:          14 questions (LG Q3, Q5, Q7, Q10, Q12, Q13, Q15, Q16, Q17, Q19, Q20, Q22, Q23, Q24); 3 ask for late start (LG Q5, Q12, Q17); 1 completes a partly drawn chart (LG Q24)
marks_range:           3–5
marks_most_common:     legacy 3 (6/14) and 4 (5/14)
command_words:         [draw, construct, complete]
phrasing_examples:     ["On Figure 2 draw a cascade diagram (Gantt chart) for the project, assuming that each activity starts as early as possible.", "… as late as possible."]
given:                 the network with times (and a blank figure)
produces:              one bar per activity at its earliest (or latest) start, with the float shown for non-critical activities
produces_form:         drawn-on-diagram
diagram_state:         blank
depends_on:            timesOnNetwork, criticalPath
conditional_on:        none
```

**Mark scheme pattern**

| Mark code (M1/A1/B1/E1/R1/…) | What earns it | Dependent on | Follow-through allowed (Y/N) |
|---|---|---|---|
| M1 | AQA: the network translated into a diagram, all activities shown and labelled (AL Q1: "all 10 activities") | none | N |
| A1 | AQA: all the critical activities shown correctly, "either on individual rows or all on a single row" | M1 | N |
| A1 | AQA: fully correct diagram **including all floats** | A1 | N |
| M1 / A1 (legacy) | one critical path correct (ft their path); the critical activities correct; non-critical activities with the right start and duration; slack shown for each non-critical activity | none | Y (ft their CP) |

**Model answer form:** horizontal bars on a time axis, a row per activity or the critical activities in one row, floats as dashed or light lines.

**Method steps in the order a teacher would write them on a board:**
1. Draw the critical activities end to end.
2. Draw every other activity at its earliest start (latest for "as late as possible").
3. Show the float after (or before) each non-critical activity.

**Acceptable alternatives noted in mark schemes:**
- "Condone float of 5 for activity A if latest finish time is 17 in (a)(i)" (AL Q3); blocks or bars (LG Q3); critical activities on one row or on separate rows (AL Q1, Q3, LG Q10).

### 3.7 — histogram

```yaml
name:                  histogram
count_AS:              0 (Spec DE5 = N)
count_Alevel:          2 (AL Q2b, Q5c(i))
count_legacy:          11 questions (LG Q1, Q2, Q4, Q6, Q8, Q9, Q11, Q14, Q18, Q21, Q22); 1 asks for late start (LG Q6)
marks_range:           2–5
marks_most_common:     4 (5/13)
command_words:         [draw, construct]
phrasing_examples:     ["Using Figure 2, draw a resource histogram for the project to show how the project can be completed in the minimum possible time. Assume each activity starts as early as possible."]
given:                 the network, the duration and the number of workers needed by each activity (one worker each in AL Q5, LG Q14, Q22)
produces:              blocks of width = duration and height = workers needed, stacked with no gaps, each block labelled with its activity
produces_form:         drawn-on-diagram
diagram_state:         blank
depends_on:            timesOnNetwork, criticalPath
conditional_on:        the workers required per activity must be given
```

**Mark scheme pattern**

| Mark code (M1/A1/B1/E1/R1/…) | What earns it | Dependent on | Follow-through allowed (Y/N) |
|---|---|---|---|
| M1 | AQA: a histogram with at least 10 labelled activities / "a consistent vertical scale with at least 10 labelled regions"; "must have a correct critical path on the bottom row" (AL Q5) | none | N |
| A1 | activities A–E (or the first ones) drawn correctly | M1 | N |
| A1 | fully correct histogram ("condone floats, but do not condone overhangs", AL Q5) | A1 | N |
| legacy M1 A1 M1 A1 | correct height and width for the critical blocks, then the rest; "withhold first A1 if not clear which activities take place"; "withhold another A1 if 'holes' appear" (LG Q2) | none | Y |

**Model answer form:** a stacked-blocks diagram with labels in the blocks. Blocks are NOT always plain rectangles: where the blocks beneath change height a block above steps with them (AL Q2b model answer: H spans D and E and its bottom edge steps up; the critical path BDGJK along the bottom has blocks of different heights; the levelled histogram in AL Q2c does the same).

**Method steps in the order a teacher would write them on a board:**
1. Put the critical activities along the bottom.
2. Stack the rest at their earliest start with no gaps (move a block down, never leave a hole).
3. Label every block.

**Acceptable alternatives noted in mark schemes:**
- critical path need not be on the bottom row for the marks but it is good practice (examiner report, AL Q5); "condone floats seen" (LG Q1e).

### 3.8 — levelling

```yaml
name:                  levelling
count_AS:              0 (Spec DE6 = N)
count_Alevel:          3 (AL Q2c, Q4, Q5c(ii))
count_legacy:          13 questions with restricted workers (LG Q1f/g, Q2e, Q4d, Q8c(ii), Q9e, Q11g, Q14e(i), Q15d(i), Q17e, Q19d, Q21c, Q23e, Q24d) plus the allocation parts below
marks_range:           1–4
marks_most_common:     3 (7/16)
command_words:         [find, state, explain, use resource levelling, show]
phrasing_examples:     ["Find the minimum completion time for the project given that only four workers are available.", "Explain why the project will overrun and use resource levelling to say which activities need to be delayed, and the minimum extra time.", "Explain the effect on the minimum completion time of having only two members."]
given:                 the network, a worker limit (1, 2, 3, 4, 5, 6, 7, 8, 9, 18 in the sources), the workers per activity
produces:              the minimum completion time or the extra time, sometimes the delayed activities, a levelled histogram, or an explanation
produces_form:         number
diagram_state:         shared-with-previous-part
depends_on:            histogram
conditional_on:        a worker limit given in the question
```

**Mark scheme pattern**

| Mark code (M1/A1/B1/E1/R1/…) | What earns it | Dependent on | Follow-through allowed (Y/N) |
|---|---|---|---|
| M1 | AQA: shows that two named activities cannot run together (AL Q2c "A, B and C cannot be carried out simultaneously"; AL Q5c(ii) "A and B cannot be done at the same time as this would require 3 members") | none | N |
| A1 / R1 | levelled histogram correct; explains the new minimum completion time (AL Q5: 66 days; AL Q2: 96 days) | M1 | N |
| legacy M1 A1 B1 | the problem identified, the activities delayed ("delay start of D (by 2 days), then G and I"), the extra time as a value (LG Q9e: 1 day; LG Q4d: 3 days; LG Q11g: 3 days) | none | Y |

**Model answer form:** a sentence naming the clashing activities, the delay, and the new total, or a levelled histogram.

**Method steps in the order a teacher would write them on a board:**
1. Find where the histogram exceeds the limit.
2. Delay a non-critical activity (or a critical one only if needed) into free float; keep precedence.
3. Redraw; the new finish minus the old is the extra time.

**Acceptable alternatives noted in mark schemes:**
- "A number of alternatives were possible with the events following G" (examiner report, LG Q4d); "assuming activities continuous" (LG Q2e).

### 3.9 — workerAllocation

```yaml
name:                  workerAllocation
count_AS:              0
count_Alevel:          0
count_legacy:          3 (LG Q14e(ii), Q15d(ii), Q22g)
marks_range:           1–2
marks_most_common:     2
command_words:         [allocate, show how, state how the activities could be divided]
phrasing_examples:     ["Allocate the activities to the two workers so that this new minimum time can be achieved."]
given:                 the network, the number of workers (2 or 3)
produces:              a list of activities per worker
produces_form:         list
diagram_state:         not-applicable
depends_on:            levelling
conditional_on:        a worker limit with one worker per activity
```

**Mark scheme pattern**

| Mark code (M1/A1/B1/E1/R1/…) | What earns it | Dependent on | Follow-through allowed (Y/N) |
|---|---|---|---|
| B1 | one worker does the critical path activities, others share the rest (LG Q14: "ACEGK and B D F (H) I J") | levelling | N (a critical path quoted from an earlier part is not enough, examiner report LG Q14) |
| B1 | the allocation respects precedence and OE is accepted | none | N |

**Model answer form:** `Worker 1 ABEHI, Worker 2 CG, Worker 3 DF` (LG Q22).

**Method steps in the order a teacher would write them on a board:**
1. Give the critical path to one worker.
2. Share the other activities, checking each starts after its predecessors.

**Acceptable alternatives noted in mark schemes:**
- "H either" (LG Q14); "OE" (LG Q15).

### 3.10 — whatIfChange

```yaml
name:                  whatIfChange
count_AS:              3 (AS Q1b, Q2b, Q5b)
count_Alevel:          1 (AL Q3c: an activity removed)
count_legacy:          4 questions with a duration change (LG Q7d, Q10d, Q13e, and Q3d as an inequality); LG Q20f is a speed-up (see speedUpWhich)
marks_range:           2–4
marks_most_common:     2
command_words:         [explain, determine, deduce, find]
phrasing_examples:     ["The duration of activity E will increase by up to 7 days. Explain whether the minimum completion time of the project increases.", "The duration of activity C is extended by 3 weeks. Determine the new minimum completion time.", "Deduce the effect, if any, on the earliest start time and latest finish time of I, J and K."]
given:                 the network, the changed duration (or a removed activity)
produces:              the new minimum completion time, or the effect on named activities' times, with a reason
produces_form:         written-statement
diagram_state:         shared-with-previous-part
depends_on:            timesOnNetwork
conditional_on:        none
```

**Mark scheme pattern**

| Mark code (M1/A1/B1/E1/R1/…) | What earns it | Dependent on | Follow-through allowed (Y/N) |
|---|---|---|---|
| M1 | states the float of the changed activity as the relevant threshold ("float 4, so a rise of 5 or more days increases the minimum time", AS Q1b) or amends the network (AS Q2b "PI by 42") | none | Y |
| R1 / A1F | infers the effect ("if the increase is 5 or more the minimum completion time will increase", AS Q1b); new minimum completion time (AS Q2b: 42, FT their 40) | M1 | Y |
| B1 + A1 (AQA Q5b) | states explicitly that K's earliest start and latest finish are unchanged; the earliest starts of I and J increase to 14 while their latest finishes are unchanged | M1 | N |
| E1 B1 (legacy) | the activity that is delayed and the new start time; the delay stated as a value ("K now starts day 17", LG Q7d) | none | Y |

**Model answer form:** one or two sentences naming the activity, its float and the consequence.

**Method steps in the order a teacher would write them on a board:**
1. Compare the increase with the float of the changed activity.
2. If the increase is more than the float, the new minimum time rises by the excess.
3. Name every later activity whose earliest start changes; latest finishes are unchanged when the project time is unchanged.

**Acceptable alternatives noted in mark schemes:**
- "Condone '42'" (AS Q2b); the inequality `x ≤ 10` (LG Q3d: "considering J latest − J earliest").

### 3.11 — claimComment

```yaml
name:                  claimComment
count_AS:              3 (AS Q3b, Q4c(i), Q4c(ii))
count_Alevel:          0
count_legacy:          0
marks_range:           1–2
marks_most_common:     1
command_words:         [comment on the validity of, show that, describe a situation]
phrasing_examples:     ["Robert claims the project can be completed in 20 days. Comment on the validity of Robert's claim.", "Glyn claims that the minimum completion time is found by adding together the durations of all the critical activities. Show that the claim is false for this network.", "Describe a situation in which Glyn's claim would be true."]
given:                 a claim about the network
produces:              a comparison with the model's minimum time and one reason the claim may fail, or the single condition under which it holds
produces_form:         written-statement
diagram_state:         shared-with-previous-part
depends_on:            timesOnNetwork, criticalPath
conditional_on:        none
```

**Mark scheme pattern**

| Mark code (M1/A1/B1/E1/R1/…) | What earns it | Dependent on | Follow-through allowed (Y/N) |
|---|---|---|---|
| E1F | compares their minimum completion time with the claimed 20 days and comments (AS Q3b) | timesOnNetwork | Y |
| E1 | gives a reason the claim may fail or a condition for it ("enough builders to start every activity at its earliest start", AS Q3b) | none | N |
| E1 | both values compared: the sum of the critical durations (60) and the minimum time (36), 36 ≠ 60 (AS Q4c(i)) | criticalPath | N |
| E1 | claim is true when all critical activities are on a single critical path (AS Q4c(ii)) | none | N |

**Model answer form:** a short sentence with both values stated.

**Method steps in the order a teacher would write them on a board:**
1. Compute the model's value and compare with the claimed value.
2. State why the real project might differ (workers, delays), or the condition under which the claim holds.

**Acceptable alternatives noted in mark schemes:**
- AS Q3b: three reasons given, any one accepted; AS Q4c(ii): other situations are not accepted unless equivalent to one critical path.

### 3.12 — unknownValues

```yaml
name:                  unknownValues
count_AS:              3 (AS Q6a, Q6b, Q7), all multiple choice
count_Alevel:          0
count_legacy:          1 (LG Q2a, three constants x, y, z)
marks_range:           1–3
marks_most_common:     1
command_words:         [find, circle]
phrasing_examples:     ["Find the value of x (circle your answer).", "ABC is part of the critical path. Which statement about the duration d of B is correct?"]
given:                 a network with some times missing or an unknown time
produces:              the missing time(s), or the range of a duration
produces_form:         number
diagram_state:         partly-filled
depends_on:            none
conditional_on:        none
```

**Mark scheme pattern**

| Mark code (M1/A1/B1/E1/R1/…) | What earns it | Dependent on | Follow-through allowed (Y/N) |
|---|---|---|---|
| B1 | each correct value (AS Q6a: 7; Q6b: 7; AS Q7: d = 10; LG Q2a: 4, 12, 13) | none | N |

**Model answer form:** a number, or the circled option.

**Method steps in the order a teacher would write them on a board:**
1. Do the forward pass up to the unknown.
2. Use the critical path to fix the unknown (an activity on the critical path has float 0).

**Acceptable alternatives noted in mark schemes:**
- none found.

### 3.13 — precedenceTable

```yaml
name:                  precedenceTable
count_AS:              2 (AS Q8a(i), Q8c(i))
count_Alevel:          0
count_legacy:          2 (LG Q1b, Q17a)
marks_range:           1–2
marks_most_common:     2 (legacy)
command_words:         [complete]
phrasing_examples:     ["On Figure 2 complete the precedence table.", "Use the figure shown to complete the table of immediate predecessors."]
given:                 the network
produces:              each activity's immediate predecessors
produces_form:         table
diagram_state:         given
depends_on:            none
conditional_on:        none
```

**Mark scheme pattern**

| Mark code (M1/A1/B1/E1/R1/…) | What earns it | Dependent on | Follow-through allowed (Y/N) |
|---|---|---|---|
| B1 / B2,1 | 6 or more rows correct; all rows correct (LG Q1b: B1 B1; LG Q17a: "B2, 1", minus one per error) | none | N |

**Model answer form:** a completed table with only immediate predecessors, e.g. `F: B, C` (LG Q1b).

**Method steps in the order a teacher would write them on a board:**
1. For each box, list the activities with an arrow into it.

**Acceptable alternatives noted in mark schemes:**
- redundant predecessors (for example `(B,) C`, LG Q17a) are accepted in brackets.

### 3.14 — contextTime

```yaml
name:                  contextTime
count_AS:              3 (AS Q8b(ii), Q8c(i), Q8c(ii))
count_Alevel:          0
count_legacy:          0
marks_range:           1–2
marks_most_common:     1
command_words:         [determine, state, complete]
phrasing_examples:     ["Determine the latest time at which the oven can be switched on in order for the spring rolls to be served at the same time as the rest of the meal."]
given:                 a clock start time and durations in mixed units (minutes and seconds)
produces:              a clock time (pm), or durations converted to one unit
produces_form:         number
diagram_state:         not-applicable
depends_on:            minTime, float
conditional_on:        a clock start time and mixed units
```

**Mark scheme pattern**

| Mark code (M1/A1/B1/E1/R1/…) | What earns it | Dependent on | Follow-through allowed (Y/N) |
|---|---|---|---|
| B1 | durations converted ("10.25, 8.25, 0.5 minutes"; "condone correct durations in seconds") | none | N |
| M1 | the second project's minimum time and 19 in consistent units give the float (25 − 19 = 6 minutes) | none | Y |
| A1 | the correct clock time (6:36 pm), "condone omission of pm" | M1 | N |

**Model answer form:** `6:36 pm`.

**Method steps in the order a teacher would write them on a board:**
1. Convert every duration to one unit.
2. Find the float of the second project against the first project's finish time.
3. Add it to the start time.

**Acceptable alternatives noted in mark schemes:**
- condone omission of pm in (c)(ii) but not in (b)(ii).

### 3.15 — firstActivity

```yaml
name:                  firstActivity
count_AS:              1 (AS Q8b(i))
count_Alevel:          0
count_legacy:          0
marks_range:           2
marks_most_common:     2
command_words:         [state, fully justify]
phrasing_examples:     ["State the activity which must be started first so that the meal is served in the shortest possible time. Fully justify your answer."]
given:                 a network with several activities with no predecessor
produces:              the activity and a reason (it is critical, float zero)
produces_form:         written-statement
diagram_state:         shared-with-previous-part
depends_on:            criticalPath
conditional_on:        more than one starting activity
```

**Mark scheme pattern**

| Mark code (M1/A1/B1/E1/R1/…) | What earns it | Dependent on | Follow-through allowed (Y/N) |
|---|---|---|---|
| B1F | the activity from their network ("only FT if their answer is A, D or G") | timesOnNetwork | Y |
| E1F | identifies it as critical, or its float is zero | B1F | Y |

**Model answer form:** `D (Chop vegetables): D is the first activity on the critical path`.

**Method steps in the order a teacher would write them on a board:**
1. Among the starting activities find the one with float zero.

**Acceptable alternatives noted in mark schemes:**
- activity given by label or in words (AS Q8b(i)).

### 3.16 — speedUpWhich

```yaml
name:                  speedUpWhich
count_AS:              0
count_Alevel:          1 (AL Q6b)
count_legacy:          1 (LG Q20f)
marks_range:           3–5
marks_most_common:     3–5
command_words:         [state with a reason, explain]
phrasing_examples:     ["The company can reduce the duration of a single activity to 1 hour. State, with a reason, which activity should be reduced to minimise the completion time.", "Explain which extra tradesman the foreman should use, and find the new minimum time."]
given:                 the network and the option set (every activity, or three trades with percentage reductions)
produces:              the chosen activity (or tradesman), the compared effect of each option, the new minimum time
produces_form:         written-statement
diagram_state:         shared-with-previous-part
depends_on:            criticalPath
conditional_on:        none
```

**Mark scheme pattern**

| Mark code (M1/A1/B1/E1/R1/…) | What earns it | Dependent on | Follow-through allowed (Y/N) |
|---|---|---|---|
| M1 | evaluates the effect of reducing one activity on the completion time (AL Q6b: E gives 14 hours, every other gives 15 or more) | none | N |
| M1 | compares the effect of reducing each critical activity | M1 | N |
| R1 | deduces the right activity from correct reasoning | M1 M1 | N |
| legacy M1 A1 M1 A1 cao | the time saved on each trade's critical activities, "use joiner: electric not critical", the new completion time | none | N |

**Model answer form:** "Reducing E to 1 hour gives 14 hours, any other 15 or more, so E."

**Method steps in the order a teacher would write them on a board:**
1. Consider only critical activities (a non-critical reduction changes nothing).
2. For each, compute the new minimum time; a parallel critical path limits the saving.
3. Choose the largest saving.

**Acceptable alternatives noted in mark schemes:**
- none found.

### 3.17 — modelLimitation

```yaml
name:                  modelLimitation
count_AS:              0
count_Alevel:          1 (AL Q6c)
count_legacy:          0
marks_range:           2
marks_most_common:     2
command_words:         [state one limitation, explain how it affects]
phrasing_examples:     ["State one limitation in the building project used by the company. Explain how this limitation affects the project."]
given:                 a context
produces:              a limitation (for example travel time between activities not included) and its effect
produces_form:         written-statement
diagram_state:         not-applicable
depends_on:            none
conditional_on:        a context
```

**Mark scheme pattern**

| Mark code (M1/A1/B1/E1/R1/…) | What earns it | Dependent on | Follow-through allowed (Y/N) |
|---|---|---|---|
| B1 | identifies a limitation in context ("time between one activity ending and the next starting is not taken into account") | none | N |
| E1 | how it affects the project in time or money terms | B1 | N |

**Model answer form:** one limitation and one consequence.

**Method steps in the order a teacher would write them on a board:**
1. Name one thing the model leaves out.
2. Say how it changes the project time or cost.

**Acceptable alternatives noted in mark schemes:**
- not found.

### 3.18 — maxDurationInequality

```yaml
name:                  maxDurationInequality
count_AS:              0
count_Alevel:          0
count_legacy:          1 (LG Q3d)
marks_range:           2
marks_most_common:     2
command_words:         [find a further inequality]
phrasing_examples:     ["Activity J takes x days, x ≥ 3. The minimum completion time is unchanged. Find a further inequality for the maximum value of x."]
given:                 the network with one activity's duration replaced by x
produces:              an upper bound on x
produces_form:         written-statement
diagram_state:         shared-with-previous-part
depends_on:            timesOnNetwork
conditional_on:        none
```

**Mark scheme pattern**

| Mark code (M1/A1/B1/E1/R1/…) | What earns it | Dependent on | Follow-through allowed (Y/N) |
|---|---|---|---|
| M1 | considers J latest finish minus J earliest start | none | Y |
| A1 cao | `x ≤ 10`; "condone x < 11 for SC2"; "NMS x ≤ 10 award M1 A1" | M1 | N |

**Model answer form:** `x ≤ 10`.

**Method steps in the order a teacher would write them on a board:**
1. Total time available for J = latest finish − earliest start of J only.
2. x is at most that value.

**Acceptable alternatives noted in mark schemes:**
- "Quite a large number did not realise the need to use the difference for J only" (examiner report LG Q3).

---

## 4. Pairings and sequences

How part types connect across a question.

| Follows (previous part type) | Part type | Count | Uses previous result (Y/N) | Shares the same figure (Y/N) |
|---|---|---|---|---|
| (start of question, table given) | buildNetworkAndTimes | 13 (AS Q2, Q3, AL Q5, LG Q9, 11, 12, 16, 18, 20, 21, 22, 23, 24) | N | Y (the network drawn is reused by every later part) |
| (start of question, network given) | timesOnNetwork | 24 (AS Q1, Q4, Q8; AL Q1, Q3, Q6; legacy Q1, 3–8, 10, 13–15, 17, 19) | N | Y |
| buildNetworkAndTimes or timesOnNetwork | criticalPath | 26 | Y | Y |
| criticalPath | float | 6 (LG Q1, Q2, Q4, Q5, Q6, Q13) | Y | Y |
| timesOnNetwork | float | 6 (AL Q1, LG Q11, Q12, Q18, Q23, Q6) | Y | Y |
| criticalPath | cascade | 12 | Y | N (a new figure is drawn) |
| criticalPath | histogram | 10 | Y | N |
| histogram | levelling | 12 (AL Q2, Q5; LG Q1, 2, 4, 8, 9, 11, 14, 21, 22(allocation), 18 no) | Y | Y (the histogram is used to find where it exceeds the limit) |
| cascade | levelling | 6 (LG Q15, 17, 19, 23, 24, 16 no) | Y | N |
| timesOnNetwork | whatIfChange | 8 (AS Q1, Q2, Q5; AL Q3; LG Q7, Q10, Q13, Q3) | Y | Y (the same network, with one duration changed) |
| timesOnNetwork or criticalPath | claimComment | 3 (AS Q3, Q4 twice) | Y | Y |
| levelling | workerAllocation | 3 (LG Q14, Q15, Q22) | Y | N |

**Conditional parts** (appear only when the question has a particular feature):

| Part type | Appears only when | Count |
|---|---|---|
| histogram | the question gives the number of workers per activity (or one worker each) | 13 of 13 |
| levelling | the question gives a worker limit | 16 of 16 |
| cascade | the question asks for a Gantt/cascade diagram | 16 of 16 |
| claimComment | AS only | 3 of 3 |
| precedenceTable | the network is given and the table is asked for | 4 of 4 |
| speedUpWhich | the question names a reduction option (one hour, or trade percentages) | 2 of 2 |

**Parts always asked together (never alone):**
- timesOnNetwork then criticalPath (22 of 22 questions that ask for times also ask for the critical path or float; the exceptions are LG Q16 and LG Q18 where only a minimum time or floats follow).
- histogram then levelling (every levelling part of the form "extra time with N workers" follows a histogram, except AL Q4 which gives the histogram).

**Parts that are never asked together:**
- cascade and histogram in the same question (0 of 38). A cascade chart and a resource histogram appear in different questions (examiner reports confuse them: AL Q1, AL Q5, LG Q13, LG Q14, LG Q18).
- claimComment and histogram or cascade (AS excludes both).

---

## 5. Givens and data conventions

What the question supplies, and the sizes it uses.

| Feature | AS observed range | A-level observed range | Legacy observed range | Count with the feature (of all questions) |
|---|---|---|---|---|
| Size of structure (activities) | 3 (AS Q6) to 12 (AS Q2); the usual is 10 (AS Q1, Q3, Q4) | 10 to 12 (AL Q1 10, Q2 11, Q3 11, Q4 12, Q5 12) | 8 to 13 (LG Q16 8; Q9, 11, 12, 18, 21, 22, 23 9; Q2, 6, 8 10; Q1 11; Q4 12; Q15, Q20 13) | all 38 |
| Size of numbers (durations) | days 1–15, weeks 3–15, minutes 1–18 plus seconds (AS Q8) | 6–17 days (AL Q5), hours in AL Q6 | 1–16 days; fractions 0.5–2 (LG Q20) | all 38 |
| Number of special elements (workers per activity) | not found | 1 (AL Q2, Q5) up to workers table | 1–8 per activity (LG Q21: 4–8) | 15 of 38 |
| Optional feature: starting activities (more than one with no predecessor) | 2–3 (AS Q2 two, Q3 two, Q8 three) | 2–3 (AL Q5 three) | 1–2 | not counted separately |
| Optional feature: more than one critical path | 1 (AS Q4, 7 critical activities) | 1 (AL Q5, two paths) | 7 (LG Q2, 3, 5, 6, 7, 8, 10) | 9 of 38 |
| Optional feature: clock start time and mixed units | 1 (AS Q8) | 0 | 0 | 1 of 38 |
| Optional feature: workers limit | 0 | 2 workers (AL Q4, Q5), 4 (AL Q2) | 1, 2, 3, 5, 6, 7, 8, 9, 18 | 16 of 38 |
| Optional feature: "start as late as possible" | 0 | 0 | 4 (LG Q5, 6, 12, 17) | 4 of 38 |

**Labelling and notation conventions by board** (how nodes, arcs, tables and values are labelled):

| Board | Convention |
|---|---|
| AQA (INFERRED) | Activity-on-node. Each box: the activity letter, then "earliest start time, duration, latest finish time" (`AS Q1` Figure; `AL Q2`: "earliest start time, duration, latest finish time and the number of workers required for each activity"). Arrows run to the next activity. An extra `End` activity of duration 0 is condoned. |
| Legacy (Edexcel, INFERRED) | Activity-on-node with the boxes drawn as in AQA; the examiner reports state "almost every candidate drew an 'activity on node' diagram" (LG Q18). Earliest start and latest finish "inserted on Figure 1". Slack drawn as dotted or light lines on cascade charts; histogram blocks labelled with the activity letter. |

**How the structure is presented** (diagram only / table only / both; student-drawn or given):
- Network given as a diagram: AS Q1, Q4, Q5, Q8; AL Q1, Q3, Q6; LG Q1–Q8, Q10, Q13–Q15, Q17, Q19 (22 questions, counting AS Q6, Q7).
- Precedence table given and student draws the network: AS Q2, Q3; AL Q5; LG Q9, 11, 12, 16, 18, 20, 21, 22, 23, 24 (13 questions).
- Both a network and a worker table: AL Q2, LG Q2, Q4, Q6, Q8 (workers table next to a given network).

**Answer-space and printed-figure conventions** (blank figures supplied, how many per question, what they are for):
- A blank network figure (`Figure 1`) with only the precedence skeleton drawn, to be filled with times: every "times on network" part.
- `Figure 2` / `Figure 3`: blank grids for the Gantt chart (time on the horizontal axis, activities listed) or the histogram (time horizontal, workers vertical) and a second grid for the levelled version (AL Q2 Figure 3, AL Q5 Figure 3, LG Q4 Figure 3).
- Graph paper is provided for the histogram in LG Q18, LG Q22 and LG Q23.

---

## 6. Variation space

What changes between questions, and what never does. This decides what a generator may randomise.

| Parameter | Observed values / range | Frequency of each | Safe to randomise (Y/N) | Notes |
|---|---|---|---|---|
| Number of activities | 3–13 | 8–9: 9 questions; 10: 8; 11: 5; 12: 4; 13: 2 | Y | AS exam size 10–12; legacy 9–13 |
| Number of starting activities | 1–3 | 1: 17; 2: 14; 3: 3 | Y | |
| Precedence structure | at most 2–3 predecessors per activity; one activity with a long skip arrow in several | | Y | the existing generator already enforces "immediate predecessors only" |
| Durations | integers 1–22, fractions only in LG Q20 | | Y | keep the project time 17–60 days as seen |
| Number of critical paths | 1 or 2 | 2 paths: 9 of 38 | Y | AQA mark scheme also asks "no others" |
| Float values | 1–13 | | Y | smallest observed float 1 (AS Q2), commonest 2–4 |
| Workers per activity | 1–8 | | Y | total workers needed at peak 7–14 in the sources |
| Worker limit | 1, 2, 3, 4, 5, 6, 7, 8, 9, 18 | | Y (must be below the unlimited peak) | the limit must force a delay of 1–6 days (extra time observed 1–6; AL Q5: 6 days; AL Q2: 96 vs the unlimited time) |
| Early or late start for Gantt/histogram | early (14 + 2), late (3 + 1) | | Y | legacy "late" asked in 4 of 24 |
| Change size (what-if) | 3 weeks (AS Q2), up to 7 days (AS Q1), doubled (AS Q5), 9 instead of 2 (LG Q7), 5 days longer (LG Q10, LG Q13) | | Y | |
| Setting | project plain; building (LG Q3, Q22, AL Q3, Q6), cleaning (LG Q5), meal (AS Q8), motor racing (AL Q5), driveway (LG Q16), society programme (LG Q23) | | Y | context words only |

**Things that never vary** (keep fixed in a generator):
- activity-on-node boxes with earliest start, duration, latest finish.
- the cascade chart shows floats (examiners deduct if absent: AL Q1, LG Q3, LG Q5, LG Q12, LG Q16).
- the resource histogram has no holes and labels every block (LG Q2, Q6, Q8, Q9, AL Q5).
- "state the minimum time" must be stated, not only seen in the End box (LG Q5, Q6, Q10).
- critical paths are asked as "critical paths … and no others".
- the worker-limit question follows a histogram, never precedes it.

**Difficulty drivers** (what makes one question harder than another), ranked, with the evidence for each:
1. **Resource levelling** (restricted workers). AS excluded it. AL Q2c: under one-third fully correct; AL Q5c(ii): "only a few" reached 66 days; LG Q22g: "too challenging"; LG Q19d: "the hardest question on the paper"; LG Q2e: "only the best candidates".
2. **Explaining/justifying** a change or claim (what-if, AS Q1b, Q3b, Q4c(i), AL Q6): AS Q3b very few got both marks; AS Q4c(i) about one-third; AS Q1b most struggled.
3. **A diagram with float (cascade) or with no holes (histogram)**: AL Q1b just over half; AL Q2b just over a third; AL Q5c(i) "not answered as well".
4. **The backward pass (latest finish)**: errors in every set of reports (AS Q1, Q4, Q8; AL Q3 "A as 17 instead of 18"; LG Q24 "slips for activity B").
5. **Network size and more than one critical path**: extra paths listed (LG Q8: BDHJ; LG Q10: ADGJK).
6. Mixed units and clock time (AS Q8c): the minority related the second project's time to its start.

**AS vs A-level vs legacy difficulty differences:**
- AS: no Gantt, histogram or levelling, so questions are 1–9 marks and test passes, critical path, float and reasoning (`Spec DE5, DE6`).
- A-level: the AS content plus Gantt, histogram and levelling, in 7–10 mark questions.
- Legacy: 9–20 marks, longer chains, and the "no limit to workers" histogram is a standard part.

---

## 7. Mark scheme conventions

| Convention | Meaning in these papers | Example source |
|---|---|---|
| ft / follow through | marks are awarded on the student's own values; "B1F", "A1F", "E1F" in AQA, `ft`, `A3F`, `A2F` in legacy | AS Q2 (B1F, A1F), LG Q16 (A3F) |
| cao | correct answer only | LG Q3d `A1 cao`, LG Q9e |
| dependent marks (dep) | a later mark needs an earlier one; "PI" = possibly implied (AQA) | AS Q1b (M1 PI by …), AL Q5c(ii) (PI by Figure 3 or increase of 6 days) |
| isw / oe / any other abbreviations used | `oe` (or equivalent), `OE`, `PI`, `cso` (correct solution only), `EE`/`–1 EE` (one mark deducted per error), `SCA` appears as a label on the network mark line (e.g. LG Q11a "Activity network SCA"); the abbreviation is not defined in the sources | LG Q11, LG Q18, LG Q24 |

**Common penalties and "do not accept" rulings:**
- extra non-critical paths listed lose the second critical-path mark (LG Q8, LG Q10).
- the minimum completion time must be stated, "not just a value in box" (LG Q10).
- "withhold" marks if it is unclear which activities take place at a given time (histogram, LG Q1, Q2, Q6, Q9).
- "withhold" if "holes" appear in the histogram (LG Q2).
- cascade slack must be shown as dotted or otherwise, not overlapping another activity (LG Q7 examiner report).
- AQA: overhangs are not condoned on a histogram (AL Q5); floats are condoned on a histogram.
- AQA Gantt: float must be shown for full marks (AL Q1, Q3).
- AS: units are condoned in minimum-time and float parts; clock times need pm (AS Q8b(ii)).

**Marking of justification and explanation parts.** For each, give the exact points the mark scheme requires (short quotes allowed):

| Part type | Required justification points | Example source |
|---|---|---|
| whatIfChange | the float of the changed activity as the threshold; the effect on earliest starts and latest finishes explicitly stated, for named activities ("states explicitly that the earliest start time and latest finish time of K remain unchanged") | AS Q1b, AS Q5b |
| whatIfChange (removing an activity) | the other activity becomes critical; the saving is the difference between the two durations ("G has a duration 2 weeks less than F") | AL Q3c |
| claimComment | compare the model's time with the claim; one reason the claim may fail, or one condition for it ("enough builders to allow each activity to begin at its earliest start time") | AS Q3b |
| claimComment (Glyn) | both values stated (the sum of the critical durations and the minimum time) | AS Q4c(i) |
| levelling | name the activities that cannot run together and say how many workers that would need ("A and B cannot be done at the same time as this would require 3 members") and the new total | AL Q5c(ii) |
| speedUpWhich | evaluate each critical activity's reduction and name the one with the largest saving ("E gives 14, all others 15 or more") | AL Q6b |
| modelLimitation | name a limitation in context and its effect on time or cost | AL Q6c |
| firstActivity | the activity is critical or its float is zero | AS Q8b(i) |

---

## 8. Examiner report evidence

For each error, tie it to a part type from Section 3.

| Part type | Common error or misconception (state as: students did X when they should have Y) | Mentioned in how many reports | Marks usually lost | Example source |
|---|---|---|---|---|
| timesOnNetwork | numerical slip in a latest finish value, carried through | 12 of 38 (AS Q1, Q3, Q4, Q8; AL Q1, Q3, Q5; LG Q7, Q19, Q24 plus the "very high scoring" ones) | 1 | AS Q1(a), AL Q3(a)(i) |
| timesOnNetwork | latest finish of A given as 17 when it should be 18 | 1 | 1 | AL Q3(a)(i) |
| timesOnNetwork | a latest finish lower than the earliest start | 1 | 1 | AS Q8(a) |
| criticalPath | listed an extra path (BDHJ; ADGJK) or three paths | 5 (LG Q2, Q8, Q10, AL Q5, Q7) | 1 | LG Q10 |
| criticalPath | listed critical activities instead of critical paths | 1 | up to 3 | LG Q7(b) |
| criticalPath | did not state the minimum time (only the value in the End box) | 3 (LG Q5, Q6, Q10) | 1 | LG Q5(b) |
| float | did not know how to calculate it | 1 | 2 | LG Q4(b)(ii) |
| cascade | did not show slack on non-critical activities | 8 (LG Q3, Q5, Q7, Q10, Q12, Q16, AL Q1, AL Q3) | 1–2 | LG Q3(c), AL Q1(b) |
| cascade | drew a resource histogram instead of a cascade diagram, or split an activity into two sections | 3 (LG Q3, Q5, AL Q1) | 1–3 | AL Q1(b) |
| cascade | started activities as early as possible when asked for late | 3 (LG Q5, Q6, Q12) | 1–2 | LG Q5(d) |
| histogram | left "holes" or "cantilevers" in blocks | 7 (LG Q1, Q2, Q4, Q6, Q8, Q9, AL Q5) | 1 | LG Q9(d) |
| histogram | did not label which activities are in each block | 3 (LG Q1, Q2, Q11) | 1 | LG Q1(e) |
| histogram | drew a Gantt chart instead of a histogram, or showed float on it | 4 (LG Q6, Q14, Q18, AL Q5) | up to 4 | LG Q18(e) |
| levelling | could not deal with the restriction: only the best found the minimum extra time and which activities to delay | 7 (LG Q2, Q4, Q8, Q11, Q19, AL Q2, AL Q5) | 2–3 | AL Q2(c) |
| levelling | suggested delaying an activity that did not need to be delayed (G), or started K before H finished | 2 (LG Q8, Q4) | 1 | LG Q8(c)(ii) |
| levelling | picked the answer with the lowest completion time instead of respecting precedence | 1 | 1 | AL Q4 |
| whatIfChange | explained the effect relative to the float vaguely, not stating what the question asked | 2 (AS Q1b, AS Q5b) | 1–2 | AS Q5(b) |
| whatIfChange | did not mention the new earliest start for K or L | 1 | 1 | LG Q7(d) |
| claimComment | did not see the ambiguity in the claim (needs enough builders / no delays) | 1 | 1 | AS Q3(b) |
| claimComment | gave only one of the two values to compare | 1 | 1 | AS Q4(c)(i) |
| maxDurationInequality | did not use the difference between latest finish and earliest start for J only | 1 | 2 | LG Q3(d) |
| workerAllocation | did not state which worker does which task; quoted the critical path of an earlier part | 1 | 1 | LG Q14(e)(ii) |
| contextTime | did not relate the second project's time to the time it should start | 1 | 1 | AS Q8(c) |

**Percentage of students scoring each mark** (where the reports give it):

| Source | Part | Mark | % scoring |
|---|---|---|---|
| AS Q1 | (a) | at least 2 of 3 | nearly 90% |
| AS Q1 | (a) | all 3 | about two-thirds |
| AS Q3 | (a) | all 4 | over three-quarters |
| AS Q4 | (b) | the mark | just over a half |
| AS Q4 | (c)(i) | the mark | about one-third |
| AS Q4 | (c)(ii) | the mark | about half |
| AS Q5 | (b) | all 3 marks | just under half |
| AS Q8 | (a) | network with no errors | just under two-thirds |
| AL Q1 | (a)(i) | both marks | nearly 90% |
| AL Q1 | (b) | all 3 | just over a half |
| AL Q1 | (b) | at least 2 | nearly 90% |
| AL Q2 | (b) | all 3 | just over a third |
| AL Q2 | (b) | at least 2 | over two-thirds |
| AL Q2 | (c) | fully correct | just under one-third |
| AL Q3 | (b) | the first two marks | nearly 90% |
| AL Q3 | (c) | both marks | over half |

**Examiner advice** on technique, layout or working (quote briefly, with source):
- use a ruler for diagrams (AS Q3, LG Q3, LG Q5).
- use graph paper for histograms and Gantt charts (LG Q14, LG Q17, LG Q18, LG Q19).
- "Best solutions … used bullet points or a small table to clearly show the effects asked for" (AS Q5b).
- work the critical path on the network diagram to save time later (LG Q20, Q22).
- "Whilst it is not necessary to have critical path activities on the bottom row … it is good practice" (AL Q5c).
- Use Figure 3 for levelling "the most successful responses made use of this figure" (AL Q5(c)(ii)).

**Presentation issues** (answers written in wrong place, missing labels, unclear working):
- histogram blocks without activity labels (LG Q1, Q2, Q11).
- cascade chart start and finish times not clear when drawn in the answer booklet (LG Q17).
- minimum completion time written only in the End box (LG Q5, Q6, Q10).
- activity J drawn as two sections, so the cascade diagram resembles a histogram (LG Q3, Q5).

---

## 9. Annotated exemplars

Three to five representative questions, one for each main archetype in Section 2. The numbers below are those printed in the sources' text; the networks are drawn in the PDFs (images not reproduced) so the activity boxes are given by the tables and the answers quoted from the mark schemes.

### 9.1 — Table to network, times and a what-if — AS Q2

**Skeleton:** restoration project, weeks; precedence table: A –,10; B –,5; C B,12; D A,8; E C D,4; F C D,3; G C D,7; H E F,8; I G,6; J G,15; K H I,5; L K,4.

**Parts:**

| Part | Prompt (paraphrased) | Marks | Mark scheme (one line per mark: code — what earns it) | Model answer | Method steps (board order) | Diagram state |
|---|---|---|---|---|---|---|
| (a) | construct the activity network, fill in earliest start and latest finish | 4 | M1 activities A–G with correct arcs · A1 all activities and arcs · B1 earliest starts · B1F latest finishes (ft earliest) | minimum completion time 40 weeks (from the (b) FT note "ft their 40") | table → network → forward pass → backward pass | blank |
| (b) | duration of C extended by 3 weeks; determine the new minimum completion time | 2 | M1 evaluates the effect (float of C is 1, or amends network; PI by 42) · A1F 42 weeks | C has float 1, so a delay of 3 weeks raises the project time by 2 to 42 weeks | float of C = 1 → 3 − 1 = 2 more | shared-with-previous-part |

**Examiner report notes for this question:** not found (the AS report in the source skips Q2).

### 9.2 — Network given, times, critical activities, test a claim — AS Q4

**Skeleton:** community project, 10 activities A–J, durations in days; critical activities A, C, D, F, G, H, J with durations 12, 8, 4, 10, 12, 6, 8 (sum 60); minimum completion time 36 days.

**Parts:**

| Part | Prompt (paraphrased) | Marks | Mark scheme (one line per mark: code — what earns it) | Model answer | Method steps (board order) | Diagram state |
|---|---|---|---|---|---|---|
| (a)(i) | complete the network with earliest start and latest finish | 3 | M1 earliest start of H or J · A1 all earliest starts · B1 all latest finishes | filled network | forward pass, backward pass | given |
| (a)(ii) | state the minimum completion time | 1 | B1F | 36 days | read End | shared-with-previous-part |
| (b) | write down the critical activities | 1 | B1 all and no others | A, C, D, F, G, H, J | float 0 | shared-with-previous-part |
| (c)(i) | show Glyn's claim (sum of critical durations equals the minimum time) is false | 1 | E1 sum 12+8+4+10+12+6+8 = 60 compared with 36 | 60 ≠ 36 | add durations; compare | not-applicable |
| (c)(ii) | describe a situation where the claim is true | 1 | E1 all critical activities on a single critical path | one critical path through every critical activity | | not-applicable |

**Examiner report notes for this question:** (a)(i) most got at least 2 of 3; latest finishes were the usual error; (b) just over half; (c)(i) one third (missing comparison of the two values); (c)(ii) about half.

### 9.3 — Times, float and cascade — AL Q1 / Q3

**Skeleton:** AL Q3: building project, 11 activities, weeks; critical path BEFJK (5 activities); removing activity F makes G critical and reduces the time by 2 weeks, to 47 weeks.

**Parts:**

| Part | Prompt (paraphrased) | Marks | Mark scheme (one line per mark: code — what earns it) | Model answer | Method steps (board order) | Diagram state |
|---|---|---|---|---|---|---|
| (a)(i) | earliest start and latest finish on Figure 1 | 2 | B1 earliest starts · B1 latest finishes | filled network | forward and backward pass | given |
| (a)(ii) | write down the critical path | 1 | B1 | BEFJK | float 0 | shared-with-previous-part |
| (b) | draw a cascade diagram, each activity as early as possible | 3 | M1 all 11 labelled · A1 all 5 critical activities correct (one row or separate) · A1 fully correct with all floats | cascade with floats | critical row, then others with float | blank |
| (c) | explain the effect of removing activity F on the minimum completion time | 2 | B1 G becomes critical (or earliest starts of H, I, J decrease by 2) · B1 the minimum time reduces by 2 weeks (to 47) | | compare F and G durations | shared-with-previous-part |

**Examiner report notes for this question:** (a)(i) "stating the latest finish of activity A as 17 instead of 18"; (b) nearly 90% got the first two marks, the usual loss was no float; (c) over half got both marks.

### 9.4 — Table to network, histogram and levelling — AL Q5

**Skeleton:** motor racing team, one member per activity; precedence table: A –,7; B –,6; C –,15; D A B,9; E D,8; F C D,6; G C,7; H E,14; I F G,17; J H I,9; K I,8; L J K,12; two critical paths A–D–F–I–J–L and C–G–I–J–L.

**Parts:**

| Part | Prompt (paraphrased) | Marks | Mark scheme (one line per mark: code — what earns it) | Model answer | Method steps (board order) | Diagram state |
|---|---|---|---|---|---|---|
| (a)(i) | complete the activity network | 2 | M1 at least 10 labelled activities and at least 4 connections · A1 fully correct | network | table → network | blank |
| (a)(ii) | earliest start and latest finish on Figure 1 | 3 | M1 E, F, G earliest starts · A1 all earliest starts · B1 all latest finishes | filled network | forward and backward pass | shared-with-previous-part |
| (b) | write down the critical path(s) | 1 | B1 both paths and no others | A-D-F-I-J-L and C-G-I-J-L | | shared-with-previous-part |
| (c)(i) | draw a resource histogram, each activity as early as possible | 2 | M1 consistent scale, ≥10 labelled regions, critical path on the bottom row · A1 correct histogram | histogram | critical path along the bottom | blank |
| (c)(ii) | two members only: explain the effect on the minimum completion time | 2 | M1 A and B cannot be done together (would need 3) · R1 minimum completion time increases to 66 days | D starts at 13 | level the histogram | shared-with-previous-part |

**Examiner report notes for this question:** (a) nearly all drew the network; numerical errors in the times led to one or three critical paths in (b); (c)(i) many left gaps, drew Gantt charts or showed float; (c)(ii) only a few reached 66.

### 9.5 — Context with clock time — AS Q8

**Skeleton:** meal started at 6:30 pm; 9 activities A–I (weigh rice 1, cook rice 18, drain rice 1, chop vegetables 10, fry vegetables 12, combine 1, prepare sauce 4, boil sauce 12, serve 2); minimum completion time 25 minutes; extra activities J, K, L with durations 15 s, 10 min, 15 s, 8 min, 30 s.

**Parts:**

| Part | Prompt (paraphrased) | Marks | Mark scheme (one line per mark: code — what earns it) | Model answer | Method steps (board order) | Diagram state |
|---|---|---|---|---|---|---|
| (a)(i) | complete the precedence table from Figure 2 | 1 | B1 | D; C, E; G; F, H | read arrows | given |
| (a)(ii) | earliest start and latest finish on Figure 2 | 2 | B1 earliest · B1 latest | | passes | given |
| (b)(i) | which activity must start first for the shortest time, fully justified | 2 | B1F D from their network · E1F it is critical (float zero) | D, chop vegetables | critical path | shared-with-previous-part |
| (b)(ii) | earliest time the preparation can be completed | 1 | B1F 6:30 pm + their minimum time | 6:55 pm | add 25 minutes | not-applicable |
| (c)(i) | complete the second table of durations | 1 | B1 | 10.25, 8.25, 0.5 minutes | convert seconds | not-applicable |
| (c)(ii) | latest time the oven can be switched on | 2 | M1 float of the second project 25 − 19 = 6 · A1 6:36 pm | | float, then add | not-applicable |

**Examiner report notes for this question:** just under two-thirds had no error in the network (errors carried forward; latest finishes lower than earliest starts); a minority gave only the minimum completion time rather than the clock time; in (c) most scored on (c)(i) and one mark on (c)(ii).

---

## 10. Targeted-tool candidates

The small skills inside the topic that a focused tool (not an exam generator) could drill. List each as one procedure.

| Skill name | Procedure (steps) | Prerequisite skills | Typical errors (from Section 8) | Appears in part types | Suggested levels (what changes between easy and hard) |
|---|---|---|---|---|---|
| **Network from a table** (built: tab `cpaNetwork`) | place the start activities, add each activity after all its predecessors, draw the arrows, add Start and End | none | missing or extra arrows; redundant predecessors | buildNetworkAndTimes | size 6–7, 8–9, 10–13 activities; skip arrows |
| **Table from a network** (not built) | list the activities with arrows into each box; only immediate predecessors | network reading | missing a predecessor; listing a redundant one | precedenceTable | size of network; a skip arrow |
| **Forward and backward pass** (built: `cpaForward`, `cpaFull`) | largest earliest finish into each box going forward; smallest latest start out of each box going back | network from table | latest finish slips; latest finish lower than earliest start | timesOnNetwork, minTime | size; activities with 2–3 predecessors; a skip arrow |
| **Critical paths: all of them, and no others** (partly built: Critical paths option) | float 0 activities; trace every Start–End chain through them; check no extra; state the time | forward and backward pass | extra paths; critical activities listed instead of paths; time not stated | criticalPath | one path, two paths, near-critical path |
| **Float** (built: `cpaFloat`) | latest finish − earliest start − duration; greatest float; list floats | forward and backward pass | arithmetic; not knowing the formula | float, floatList | one activity, greatest float, all floats |
| **Missing times in a partly filled network** (not built) | forward pass up to the gap; use the critical path to fix the unknown; or circle the right value | forward and backward pass | | unknownValues | 1, 2 or 3 unknowns; multiple choice |
| **Changes and delays** (not built, AS content) | compare the delay with the float; raise the project time by the excess; name the later activities whose earliest start moves; maximum delay = float; an inequality for a duration | float | vague explanation; forgot that latest finishes may not change | whatIfChange, maxDurationInequality | extend by less than, equal to, more than the float; remove an activity; critical vs non-critical |
| **Cascade (Gantt) chart** (not built, A-level) | critical activities as a row; every other activity at its earliest (or latest) start; float after (before) it | float | no float shown; started too late/early; confused with a histogram | cascade | early only; late; float shown or hidden; critical activities in one row |
| **Resource histogram** (not built, A-level) | critical path along the bottom; stack the rest at earliest start; no holes; label every block | float | holes; no labels; float drawn; Gantt drawn | histogram | one worker each; several; late start |
| **Resource levelling and allocation** (not built, A-level) | find where the histogram exceeds the limit; delay a non-critical activity into its float; keep precedence; new time and extra time; assign to workers | histogram | delayed an activity that did not need delaying; precedence ignored | levelling, workerAllocation | limit just below the peak; two clashes; the clash needs a critical activity delayed |
| **Which activity to shorten** (not built) | consider critical activities; compute each new time; a second critical path limits the saving | critical paths | | speedUpWhich | one critical path; two critical paths |
| **Context and units** (not built) | convert units; add the clock start; float of a second small project | forward pass | | contextTime | minutes only; seconds; clock times |

**Representations used in mark schemes and examiner reports** (e.g. network diagram, table, Gantt chart, cascade chart, tree, graph). For each, state how often it is needed and what the student must do with it:

| Representation | Count | Student must… |
|---|---|---|
| Activity-on-node network | 38 of 38 | read it, or draw it from a table; write earliest start and latest finish into the boxes |
| Precedence table | 15 of 38 (13 given as the starting data, 2 completed by the student: AS Q8, LG Q1, Q17) | read it to draw the network, or complete it from the network |
| Gantt (cascade) chart | 16 of 38 (AL 2; LG 14) | draw it from the network with floats; complete a partly drawn one (LG Q24) |
| Resource histogram | 13 of 38 (AL 2 + AL Q4 given; LG 11 + levelled versions) | draw it with no holes and labelled blocks; interpret a given one (AL Q4) |

---

## 11. Gaps, disagreements and confidence

**Not found in the sources** (things a generator would need but the papers do not show):
- Board, series, year and paper for every question (the compilations print only "Meden School | copyright Exampro").
- The networks as text: the figures are images, so box positions and arrow layouts are not in the extracted text; the activity data are in the tables only for 17 of the 38 questions.
- Dummy activities (activity on arc): not found in any question.
- Free float or independent float: not found.
- Gantt or histogram in AS questions: 0 of 8 (consistent with `Spec DE5, DE6` = N).
- Marks per question for time-limit hints ("about 1 minute a mark"): not found in these PDFs.
- The AS "Q5(b)" printed mark total: see below.

**Board disagreements** (where Edexcel, AQA, OCR or others differ in method, notation or marking):

| Point | Board A says | Board B says |
|---|---|---|
| Cascade chart float | AQA: "including all floats" required for full marks (AL Q1, Q3) | legacy: slack shown "dotted etc" is required for the final A1 (LG Q10) |
| Critical path on the histogram | AQA: critical path "on the bottom row" required for the M1 (AL Q5) and "condone floats, but do not condone overhangs" | legacy: "holes" and unlabelled blocks penalised; floats condoned (LG Q1) |
| Resource limit question | AQA: A-level asks the minimum completion time, or the effect in words (AL Q2, Q5) | legacy: asks the extra time, which activities are delayed, and often a worker allocation (LG Q8, Q9, Q14, Q15, Q22) |
| Latest finish for A in a cascade question | AQA mark scheme: "condone float of 5 for activity A if latest finish time is 17 in (a)(i)" (AL Q3) | not found |

**Inferred rather than observed** (every `INFERRED:` item, listed again here):
- INFERRED: the AS PDF is AQA 7366, the A-level PDF is AQA 7367 (from the AO codes and the spec statements DE1–DE6 and the repository's `specs/exam/spec/aqa-discrete.md`).
- INFERRED: the legacy PDF is Edexcel D1 (from the mark codes and the mention of a "stage/state table").
- The abbreviation `SCA` on legacy network mark lines is not defined in the sources.

**Question types in the papers that need a diagram or representation not described above** (flag for a build decision):
- the cascade (Gantt) chart with floats and the resource histogram with labelled blocks (new representations; `docs/PROJECTS.md` lists them as later increments of Critical Path Analysis).
- a levelled histogram supplied as multiple-choice (AL Q4).
- a clock/time axis question with mixed units (AS Q8).
- a network with some times missing (AS Q6, LG Q2).

**Source inconsistencies noted**
- AS Q5(b): the printed part mark is (2) and the question total is 3, but the mark scheme lists M1 B1 A1 for part (b) (total 4); the examiner report says "all 3 marks" for part (b).
- LG Q13: the examiner report also describes a dynamic programming "stage/state table" part, which is not in the critical path question text.
- AL Q1, Q3 mark scheme describe the answer as including "all floats" and the report says the commonest loss was missing floats, the cascade diagrams being confused with histograms.

**Confidence in Sections 2–6** (one of: high / medium / low) and why:
- Section 1–3: **high** for the AS and A-level questions (every part, mark and mark scheme line is in the text); **medium** for the legacy questions (the networks are images, so the number of activities is taken from the tables or the mark schemes where the table is absent: LG Q1, Q2, Q3, Q4, Q5, Q6, Q7, Q8, Q10, Q13, Q14, Q15, Q19).
- Section 5–6: **medium**, since sizes are counted from tables only for 17 of 38 questions and from mark schemes for the rest.

---

## 12. Re-check of the current-spec questions against the built tools (2026-10-18)

The AS and A-level papers were re-read end to end against the 13 tabs in `specs/cpa-skill-tools.md`.

**Confirmed:** worker allocation has no AS or A-level question (AL Q5(c)(ii) is levelling); the AL cascade questions are early start only; stepped histogram blocks and the 96 / 66-day levelling answers are in AL Q2 and Q5.

**Current-spec question types no tab covers**

| # | Source | What is asked | Gap |
|---|---|---|---|
| 1 | AS Q3b, AS Q4c(i), AS Q4c(ii), AL Q6c | written reasoning: comment on a claim (20 days: depends on enough builders / simultaneous work); show that "sum of critical durations = minimum time" is false (60 vs 36); a case where it is true (a single critical path); a limitation of the model (travel time) and its effect | no tab asks for a written explanation |
| 2 | AS Q1b | a delay "up to 7 days": does the minimum time increase? (float 4, so 5 or more does) | the delays tab uses one specific amount, not a range / threshold |
| 3 | AS Q5b | effect of doubling G on the earliest start and latest finish of named activities I, J, K | the working recalculates the boxes, but the question and answer ask only for the project time |
| 4 | AL Q3c | an activity is removed (F): G becomes critical, the time falls by 2 | "shorten" never removes an activity |
| 5 | AS Q8b(i), Q8c | which activity must start first, with the reason (critical, float 0); a second project in seconds converted to minutes, working back from the finish time to the latest switch-on time | the clock tab has neither the "first activity" question nor unit conversion / a second project |
| 6 | AL Q4 | choose the correctly levelled histogram from options (the trap: the lowest finish time ignores precedence) | the levelling tab never asks for a choice between pictures |
| 7 | AS Q6, Q7 | missing values x, y and d in tiny networks, multiple choice (Q7: ABC critical, B takes d, so d = 10) | the missing-time tab is close but a different shape |

**Status (2026-10-18):** all seven gaps above are now built (see `specs/cpa-skill-tools.md`, "Closing the current-spec gaps"): #2–#4 in Delays and changes, #5 in Clock times and Critical paths, #6 in Resource levelling, #7 in Missing time, and #1 in the new Explain and justify (AS) and Limits of the model (A-level) tabs.
