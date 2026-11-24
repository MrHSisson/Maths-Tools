# Composite shapes (area) — authored lesson plan

**Status:** implemented (revised 2026-11-24, see Revision 2) (build script `composite-shapes.build.ts`; pictures `composite-shapes-art.ts`). Option A (authored pictures) chosen by Harry.
**Audience:** Year 7, at the end of the area topic: secure on the area of a rectangle, a triangle and a parallelogram.
**Lesson:** about 60 minutes, stand-alone, fully authored (no generator, no new tool).
**Reference sheet:** Harry's Questions 3 to 5 (house shapes, shaded areas, trapezium-type shapes).
**Modelled on:** `year7-rectilinear-area` (split, find, add; then the cut-out alternative). Same house look (`docs/design/LESSON_STYLE.md`).

## Teaching sequence

| # | Slide | What happens |
| --- | --- | --- |
| 1 | Title and learning objective | "Work out the area of a shape made from simpler shapes." |
| 2 | Quick grid (retrieval) | Four single shapes: rectangle, triangle, parallelogram, and "which length is the height?" |
| 3 | Vocabulary / definition | Composite shape. Perpendicular height. |
| 4 | Discussion | One house shape: "How could you split it?" Two views; the class chooses. |
| 5 | Model: add | Rectangle + triangle, by click: split, label what each piece needs, area of each, add. |
| 6 | Whiteboard set A (6) | Add: rectangle + triangle, support fading, then a missing length. |
| 7 | Discussion (the trap) | "Sam used the sloping side as the height." Find the mistake. |
| 8 | Model: subtract | Rectangle with a triangle cut out (shaded). Whole minus hole. |
| 9 | Whiteboard set B (4) | Subtract: triangle hole, square hole, notch, triangle with a square hole. |
| 10 | Model + set C (3) | Parallelogram pieces: add and subtract. |
| 11 | Stretch: model | The trapezium as a composite (rectangle + triangle), then the formula it gives. |
| 12 | Whiteboard set D (4) | Trapezium split, formula check, decimal, trapezium + rectangle. |
| 13 | Book work | Six mixed shapes, (a) to (f), as on the reference sheet; answers on a click. |
| 14 | Exit ticket | Two shapes: one add, one subtract, with the method explained. |

## The ladder (each question changes one thing)

| Q | Shape | Rung | Answer | Trap it targets | Wrong method gives |
| --- | --- | --- | --- | --- | --- |
| A1 | Rectangle 6 × 4 with triangle on top, base 6, height 3 | all lengths given, standard house | 33 cm² | forgetting the ½ | 42 |
| A2 | Rectangle 10 × 6 with triangle, base 10, height 4 | same, bigger | 80 cm² | forgetting the ½ | 100 |
| A3 | Rectangle 8 × 5 with triangle on the right, base 5, height 3 | rotated: triangle beside, not on top | 47.5 cm² | ½ again, with a decimal result | 55 |
| A4 | Rectangle 12 × 7 with triangle, base 12, height 8; sloping sides 10 marked | extra length is a distractor (sloping sides drawn true: 6, 8, 10) | 132 cm² | slant side used as the height | 144 |
| A5 | Width 7, total height 8, apex 3 above the rectangle | missing length: 8 − 3 = 5 first | 45.5 cm² | total height used as the rectangle's | 66.5 |
| A6 | Base 10, left side 8, right side 12 (right-angled trapezium) | missing length: 12 − 8 = 4 first | 100 cm² | 12 used as the rectangle's height | 140 |
| B1 | Rectangle 13 × 7.5, triangle hole base 9, height 5 (shaded) | first subtract | 75 cm² | adding instead | 120 |
| B2 | Rectangle 20 × 12, square hole 5 × 5 | easy subtract, no triangle | 215 cm² | adding instead | 265 |
| B3 | Rectangle 18 × 10 with a triangular notch, base 8, height 6 | notch from an edge | 156 cm² | notch treated as a rectangle | 132 |
| B4 | Triangle base 14.4, height 12, rectangular hole 3 × 3.5 | decimals; hole inside a triangle | 75.9 cm² | adding instead | 96.9 |
| C1 | Parallelogram base 9, height 4 (slant 5) on a rectangle 9 × 3 | parallelogram + rectangle | 63 cm² | slant (5) used as the height | 72 |
| C2 | Parallelogram base 12, height 7, rectangular hole 4 × 3 | parallelogram minus a hole | 72 cm² | adding instead | 96 |
| C3 | Parallelogram base 10, height 6, triangle on top, base 10, height 4 | two different formulas | 80 cm² | forgetting the ½ | 100 |
| D1 | Trapezium, parallel sides 5 and 11, height 4, split rectangle + triangle | trapezium as a composite | 32 cm² | adding parallel sides, not halving | 64 |
| D2 | Trapezium, parallel sides 8 and 14, height 5 | link split to formula ½(a + b)h | 55 cm² | not halving | 110 |
| D3 | Trapezium, parallel sides 6.4 and 9, height 5 | decimal | 38.5 cm² | not halving | 77 |
| D4 | Rectangle 6 × 5 with a trapezium below (top 6, bottom 14, height 9) | trapezium inside a composite | 120 cm² | not halving | 210 |

All 17 recomputed by a second route (and again inside the build script, from each picture's own pieces) (the wrong-method column was produced by running the wrong method; none equals the right answer). Book work (a to f: 63, 114, 99, 111, 60, 80) and the exit ticket (77 and 133) use fresh numbers; nothing above is reused.

## The traps (shared vocabulary)

1. Forgetting the ½ for a triangle.
2. Using the sloping side as the height.
3. Adding when the shape is shaded (should subtract).
4. Using the total height for the rectangle (missing-length step skipped).
5. Trapezium: not halving the sum of the parallel sides.

## Pictures (decided: option A)

No tool in the repo draws a shape that mixes triangles, parallelograms and trapezia: the Rectilinear Shapes picture only does right-angled outlines. Two ways to get the pictures:

| Option | What it means | Cost |
| --- | --- | --- |
| **A. Authored pictures (recommended)** | Each shape is a clean drawn picture (one SVG per shape, labelled like the reference sheet: lengths in blue, right-angle marks, dashed heights, shading). The slide shows the picture beside the question; the working appears step by step on click. The book work is a whole page of six, as on the reference sheet. | Needs no new site code, so it can be pushed to the deck service straight away. Pictures are fixed (you cannot edit a length in the editor). |
| B. A new Composite Shapes picture in the editor | A new shape spec (like Rectilinear Shapes), so a teacher can change a length and the picture, answer and working update together; prints as a worksheet. | New code, tests and a merge before the deck can be pushed. Far more than "not too much time". |

## Not doing

- No generator, no new tool, no Depth bank (unless asked).
- No printed worksheet pinned to the lesson (the book-work slide serves); easy to add after.

## Revision 2 (Harry's feedback, 2026-11-24): fit one lesson, an authored worksheet, at most one decimal

- **Trimmed to 21 slides** (about 60 minutes). Whiteboard questions: A1 to A4 and C1 (add), B1 and B2 (subtract), D1 and D2 (trapezium stretch), three models (add, subtract, trapezium). The notch, the triangle with a rectangular hole, decimal trapezia, the parallelogram models and the dividers were dropped: the plan does not have to reproduce the whole reference sheet.
- **Authored worksheet of eight** (a pinned picture sheet, printed four to an A4 page with a worked answer copy; new code `src/decks/pictureSheet.ts`): 1 house (63), 2 rectangle and triangle beside (87), 3 house with the total height given (70), 4 triangular hole (104), 5 square hole, 9.5 wide (124), 6 parallelogram with a hole (64), 7 trapezium (45), 8 trapezium on a rectangle (50). Support fades: the split is drawn for 1 and 2, then independent. Fresh numbers; the book-work page of six was removed.
- **Decimal rule:** one decimal place at most, and two decimals are never multiplied. The build script checks it for every question: at most one decimal length in a picture, and every piece's area to one decimal place at most (B1 has 7.5; the worksheet has 9.5).
- Timing guide: recall, objective, vocabulary and the opening discussion 10 min; adding 17 min (model, four questions, the trap slide); subtracting 8; trapezia 8; worksheet 12; exit and summary 5.

## Revision 3 (Harry's feedback, 2026-11-24): the pictures give the total, trapezia are not split

- **Houses and shapes with a triangle beside them give the wall height (or the rectangle's width) and the total, not the triangle's height.** The triangle's height is the first line of the working (a subtraction). This applies to every house, to the "triangle beside" shape and to the trapezium-plus-triangle and rectangle-plus-trapezium shapes. The separate "total height given" house (old A4) was dropped, because every house now has that step.
- **Trapezia use the formula, not a split.** Pupils already know the area of a trapezium, so a trapezium is a piece of a composite shape worked with the formula: M4 rectangle (10 by 3) with a trapezium on top (6 and 10, total height 7): 62; D1 trapezium (12 and 8, height 5) with a 3 by 2 hole: 44; D2 trapezium (14 and 8, height 5) with a triangle on top (total height 9): 71. Worksheet 7 is now a trapezium with a triangle on top (12 and 6, height 5, total 8): 54; worksheet 8 is a rectangle with a trapezium on top (50). The recall grid now asks a trapezium (6 and 10, height 4: 32).
- Worksheet answers: 63, 87, 60, 104, 124, 64, 54, 50. All lengths are whole numbers except 7.5 (B1) and 9.5 (worksheet 5).

## Revision 4 (Harry's feedback, 2026-11-24): the diagrams, arrows and labels

The pictures were redrawn in the site's own rectilinear style (`specs/decks/composite-shapes-art.ts`): indigo outline; lengths and arrows in one dark blue; an arrow runs parallel to its own edge at a fixed gap, with the label in a break in the arrow (rotated on an upright edge, a short arrow keeps its label just outside); a thin dashed lead line where a length reaches past the shape (a total height or width); a dashed height has no arrow, only a plain label beside it, at 40% of the way up from the base; a sloping edge has its label along it; a hole's edge has a label beside it, inside the hole when the outside would run into the outline; right-angle marks; lettered pieces with a white halo so they read over the colours. Text keeps one size at every scale. Three holes were widened so the height label fits: M2 (base 6, height 3: 45), worksheet 4 (base 8, height 4: 104) and the exit ticket (base 8, height 5: 133).

## Revision 5 (Harry's feedback, 2026-11-24): fewer houses

A bowtie (a box with an identical triangle on each side) replaces two of the houses: A2 (width 7, height 6, triangles 4 wide, total width 15, sloping side 5 marked as the distractor: 66) and worksheet 3 (width 10, height 4, triangles 5 wide, total 20: 60). The picture gives the rectangle's width and the total width, so the first line of working is (total - width) / 2. Houses remain in the model, A1, worksheet 1 and the exit ticket. Worksheet answers: 63, 87, 60, 104, 124, 64, 54, 50.

## Revision 6 (Harry's feedback, 2026-11-24)

- **B2 is a triangle inside a triangle** (whole triangle base 20, height 12: 120; hole base 8, height 5: 20; shaded 100), replacing the square hole in a rectangle. The square-hole shape stays in worksheet question 5.
- **C1 (rectangle and parallelogram) gives the whole shape's height and the rectangle's**, not the parallelogram's own height: the first line of working is 7 − 3 = 4.
- **Why the worksheet looked like rectilinear shapes:** the live site runs `main`, which does not have the picture-sheet code, so it drew the worksheet element as an ordinary generated worksheet using the Perimeter & Area rectilinear generator. It shows the eight composite pictures correctly once the picture-sheet code is merged.

## Revision 7 (Harry's feedback, 2026-11-24): worksheet questions 3, 5 and 6

Questions 1, 2, 4, 7 and 8 stay. Question 3 (the bowtie) is taller: rectangle 9 by 6, triangles 4 wide, total width 17: 78. Question 5 is a parallelogram with a triangle on top (base 12, height 5, total height 9, so the triangle's height is 4: 60 + 24 = 84). Question 6 is a right-angled triangle (20 by 12) with a parallelogram cut out (base 8, height 3: 120 − 24 = 96). Worksheet answers: 63, 87, 78, 104, 84, 96, 54, 50. No worksheet question has a decimal now.
