# Year 7 rectilinear area — complete rebuild

Implemented 2026-11-10. Native shared deck `year7-rectilinear-area` is the master. Top set Year 7, rectangle area already secure. No retrieval starter or discussion slides. All slide/question IDs start `rectilinear-r2-`; the previous lesson has been replaced, rather than edited into this version.

## Slide sequence

| Slide | Visible header | Content and progression |
| --- | --- | --- |
| 1 | Area of rectilinear shapes | Title and the three stages. |
| 2 | Split into rectangles | ONE question sequence: four unpartitioned L, T, staircase and cross shapes. Draw rectangles only, no area calculation. Reveal one valid partition. |
| 3 | Area by splitting | ONE sequence: T, L, T, L. Each starts unpartitioned; no internal-length arithmetic yet. Model the first and check the others. |
| 4 | Find internal lengths first | Staircase model/check, then cross model/check. Models have supplied partitions. Derive required internal dimensions before multiplying; all external sides given or directly implied. |
| 5 | Internal lengths: practice | Six graded questions: staircase/cross, reflected and rotated shapes, then a four-step staircase requiring two internal widths. Final questions can continue next lesson. |
| 6 | Remove one part: L and U | L model/check, then U model/check. Reveal enclosing rectangle and cut-out; subtract areas. |
| 7 | Remove two parts: M and N | M model/check with same-side notches; N model/check with opposing offset notches. Subtract both cut-outs. Derive the enclosing width first where necessary. |
| 8 | Remove a hole: O shapes | Frame model/check. Outer rectangle area minus inner rectangle area. |
| 9 | Independent practice | The pinned authored worksheet, three sections of four questions. |
| 10 | Check your method | Four short method reminders; no discussion task or new question. |
| 11 | Optional: internal-length practice | Level 2 live generator, all external sides given/directly implied. Continuation only. |
| 12 | Optional: cut-out practice | Level 3 live U/N/M/O generator, all external sides given/directly implied. Continuation only. |

## Sixty-minute teaching route

Allow 0–8 minutes for partitions, 8–15 for the T/L area sequence, 15–24 for internal-length model/check pairs, and 24–31 for internal-length practice. Use the first practice questions in class; the final four-step staircase is an extension. Allow 31–43 for cut-out models, with paired checks available if pace permits, then 43–58 for the worksheet and 58–60 for checking methods. Keep unfinished checks/practice for the next lesson. Slides 11–12 are additional continuation material.

## Worksheet scaffold

Three A4 pupil pages, four questions per section, with a matching three-page worked key:

- **A — Partition only:** T, L, staircase, cross. First T has a supplied partition to identify; the remaining three require pupils to draw partitions. No area calculations.
- **B — Internal lengths then area:** three-step staircase, rotated staircase, cross, four-step staircase. First has a supplied partition and an internal-length calculation blank before rectangle area prompts; support fades completely for the remaining three.
- **C — Remove cut-outs:** U, N, M, O. No L in independent cut-out practice. First U demonstrates the enclosing rectangle and shaded removed part, with whole/removed/remaining area prompts. Others are unscaffolded.

All answers are recomputed independently from the exported polygons, component rectangles and edge vectors. The key shows internal/enclosing dimension arithmetic before areas where needed. Partition answers accept alternative valid splits.

## Diagram and verification contract

Visible headers are separate text elements. Generic per-question captions are suppressed. Actual boundary arrows remain 10 CSS pixels from their own edges on the board. All independent boundary lengths remain labelled; only matching aligned spans are implied. No external missing-length tasks, internal-width arrows, floating pills, equality tabs or overall dimension frames.

Build source: `year7-rectilinear-area.build.ts`. Export with `_check/year7-rectilinear-assets.cjs`, then `_check/year7-rectilinear-print.py --work <folder>`. The snapshot regression test checks grouped partition questions, T/L order, no premature internal arithmetic, worksheet scaffolds, fresh IDs and headers. The edge-gap browser check covers laptop, tablet and phone.
