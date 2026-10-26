# Tool Spec: Perimeter & Area

**Status:** draft <!-- draft → ready → implemented. Claude Code only implements specs marked `ready`. -->

A rewrite from scratch of **Perimeter** (`/perimeter`, dev-gated since 2026-10-04, `src/tools/Geometry/PerimeterTool.tsx`). The audit (2026-10-26) found the missing-side working does not explain the arithmetic, mixed-unit questions use `0.02 m`, the pool is tiny with a random-id key that defeats the repeat check, the label placer tries 3ⁿ positions (531,441 for the 12-sided cross), and the working is plain text with no highlighting. Nothing is carried over as code. What is kept as ideas: **points → edges → perimeter and area from one set of coordinates**, tick marks for equal sides, the shared diagram split and `handleDiagramPrint`, and a Level 1 → 3 ladder from regular shapes to compound shapes to units.

Decisions (Harry, 2026-10-26): **Perimeter and Area together; arcs and circles are out** (Circle Properties owns them); **algebraic perimeter and area is its own sub-tool**; **a squared-grid counting sub-tool is in**; **stand-alone tool** (not folded into another).

---

## 1. Overview

| Field | Value |
|---|---|
| Tool name | Perimeter & Area |
| Tool id / URL path | `perimeter-and-area` · `/perimeter-and-area` (alias `/perimeter` keeps old links working) |
| Category | Geometry (group "Shapes & measures") |
| Card description | Find the perimeter and area of squares, rectangles, triangles, parallelograms, trapezia and compound shapes, on a grid and with algebra. |
| Defaults | `numQuestions: 9`, `numColumns: 3`, `maxColumns: 4`, `hideFontControls: true`, `toolTabRows: [2, 2]`, `hideAnswerStep: true` |

**Pedagogical intent:** a student can tell perimeter (distance round the edge, a length in cm) from area (surface covered, in cm²), pick the right measurements from a diagram that also shows distractors (a slant side beside a perpendicular height), find the sides a compound shape does not label, and carry all of it into algebra. It runs counting on a grid → standard shapes → compound shapes → algebra; Circle Properties picks up arcs and sectors afterwards.

**Ships dev-gated** (`enabled: false`) like every new tool, and goes live after Harry's review. **Migration:** new id `perimeter-and-area`, `aliases: ['/perimeter']`, copy the dashboard note of `perimeter` onto the new id then remove it once merged, delete `PerimeterTool.tsx` / `.about.ts`, update `organisation.test.ts`, run `npm run facts`.

---

## 2. Sub-tools

| Key | Tab label | Kind | Instruction line |
|---|---|---|---|
| `grid` | Counting on a Grid | simple (diagram) | — (each diagram carries its own prompt, see 3.0) |
| `shapes` | Standard Shapes | simple (diagram) | — |
| `compound` | Compound Shapes | simple (diagram) | — |
| `algebraic` | With Algebra | simple (diagram) | — |

All four are diagram sub-tools (one picture per question), so each prints through `handleDiagramPrint`. Tabs sit on two rows (`toolTabRows: [2, 2]`).

---

## 3. Sub-tool detail

### 3.0 Shared by every sub-tool

**One geometry model, never stored twice.** A shape is a list of points in grid units (`Pt[]`, optionally with `holes: Pt[][]`). Everything else is derived from it: edges (lengths), perimeter (outer plus every hole), area (shoelace minus holes), bounding box, which edges are horizontal or vertical, and which are equal. Pictures, answers, working and the tests all read the model; no length is typed twice.

**The prompt is in the picture.** Because the ask varies per question (a pool of Perimeter / Area), each diagram draws a one-line caption inside the SVG — "Find the perimeter." or "Find the area." — so a worksheet cell, a print and the whiteboard all say it, and `display` carries the same sentence. Use `diagramSplitQuestion(…, { promptInDiagram: true })` so the Worked Example shows the line once.

**Units.** Lengths are whole numbers of cm unless a Units option says otherwise. The answer carries its unit as `answerSuffix` ("cm" for perimeter, "cm²" for area), never inside the maths. Where mixed units are on, metres only ever appear for lengths that are a multiple of 10 cm and at least 50 cm (`1.2 m`, `0.5 m`, never `0.03 m`) and millimetres for whole cm (`70 mm`); the working converts to one unit first and the answer is always asked in the unit stated in the caption ("Give your answer in cm.").

**Labels and ticks.** Side labels are plain text on a small pill placed by a simple greedy placer (try the four candidate positions per edge, keep the one furthest from the shape and the others; no brute force, O(n²)). Equal sides share tick marks (one tick, two ticks…) and equal angles are not marked; right angles are marked with the small square wherever the shape has them. Every picture that is not to scale says "Not drawn to scale." in small slate text, and the generator keeps it to scale wherever integer geometry allows (see Standard Shapes).

**Per-step emphasis.** Each working step carries `_stepFocus` (the edges and regions it is about) and the picture lights those and fades the rest (reference: `AnglesInTriangles`, `focus` prop). Adding the sides of a perimeter lights each edge as it enters the sum; an area split lights its rectangles in two colours; a missing-side step lights the matching edges.

**Working is `mStep` with fragments** (one mark per press: `= 6 + 4 + 6 …`), final line is the answer so `hideAnswerStep` holds. Never `tStep` for numbers.

**Code layout.** `src/tools/Geometry/PerimeterArea.tsx` (config, dispatcher, `__test`), `PerimeterArea.about.ts`, and a `perimeterArea/` folder: `model.ts` (points → measurements), `rectilinear.ts` (templates, missing sides), `standard.ts` (triple-based shapes), `algebraic.ts`, `labels.ts` (placer), `Diagram.tsx`. `labels.ts` is written as a shared helper so other geometry tools can use it later.

**Tests (`src/tests/perimeterArea.test.ts`).** Independently re-derive: perimeter and area from the points for every question, that every generated length is a whole number, the rectilinear missing side equals the one implied by the opposite edges, parallelogram / trapezium / isosceles slant sides satisfy Pythagoras with the drawn height, the metre rule above, and every answer matches the sample table's formulas. Generator smoke tests run through `__test`.

---

### Sub-tool: Counting on a Grid (`grid`)

A shape drawn on squared paper; one square is 1 cm (Levels 1–2) or a stated scale (Level 3). The student counts, no formula needed.

#### 3.1 Question options (QO)

- **multiSelect** `askFor` — "Ask for" (`balanced: true`): `perimeter` — "Perimeter" — defaultActive: true · `area` — "Area" — defaultActive: true.
- **Level 3 only:** **multiSelect** `scale` — "Scale" (`balanced: true`): `two` — "1 Square = 2 cm" — true · `five` — "1 Square = 5 cm" — false.
- **Per-level differences:** the Scale pool exists at Level 3 only.

#### 3.2 Levels

**Level 1 — rectangles and squares on a grid.**
- Parameters: width and height 2–8 squares, drawn on a grid at least one square larger each way.
- Constraints: all points on grid lines; the whole shape visible.
- Exclusions: 1-wide strips (a 1×n rectangle is a count of n, not a method); a repeated (w, h, ask).
- Misconceptions targeted: counting corners instead of edges for perimeter; counting the grid lines through the shape.

**Level 2 — rectilinear shapes (L, T, staircase).**
- Parameters: the Compound Shapes templates 3.2 L1 list, scaled to a 6–10 square bounding box.
- Constraints: orthogonally convex (no notch), so perimeter = bounding rectangle's; area ≥ 12 squares.
- Misconceptions targeted: counting only the outer edge of a corner twice; treating area as perimeter × something.

**Level 3 — a scale on the grid.**
- Parameters: a Level 2 shape (or a rectangle 5–9 × 3–6) with one square = 2 cm or 5 cm.
- Constraints: the working converts squares to cm before the answer: perimeter × scale, area × scale².
- Misconceptions targeted: multiplying area by the scale instead of the scale squared.

#### 3.3 Worked example script

- **Perimeter, Level 1–2:** `mStep("Count the unit lengths round the edge:", ["…"])` is replaced by a walk: edges lit in turn, `mStep("Add the sides:", ["5", "+ 3", "+ 5", "+ 3", "= 16"])`, answer `16 cm`. Level 2 may take the bounding-rectangle route when the Compound Shapes Method option says so.
- **Area:** `mStep("Count the squares:", …)` lighting rows (`6 + 6 + 6 + 3 = 21`) or the equivalent split; answer `21 cm²`.
- **Level 3:** the same count in squares, then `mStep("One square is 2 cm, so multiply by 2:", ["22 × 2", "= 44"])` (area: `× 2²`).

#### 3.4 Sample questions (acceptance set)

| Level | Question as displayed | Answer | Working (one line) |
|---|---|---|---|
| 1 | Rectangle 5 wide, 3 high. Find the perimeter. | 16 cm | 5 + 3 + 5 + 3 |
| 1 | Square 4 × 4. Find the area. | 16 cm² | 4 rows of 4 |
| 1 | Rectangle 7 × 2. Find the area. | 14 cm² | 2 rows of 7 |
| 2 | L-shape (0,0)(6,0)(6,2)(3,2)(3,5)(0,5). Perimeter. | 22 cm | 6 + 2 + 3 + 3 + 3 + 5 |
| 2 | T-shape (0,0)(7,0)(7,2)(5,2)(5,5)(2,5)(2,2)(0,2). Area. | 23 cm² | 7×2 + 3×3 |
| 2 | Staircase (0,0)(6,0)(6,2)(4,2)(4,4)(2,4)(2,6)(0,6). Perimeter. | 24 cm | 2(6 + 6) |
| 3 | L-shape above, 1 square = 2 cm. Perimeter. | 44 cm | 22 squares × 2 |
| 3 | T-shape above, 1 square = 5 cm. Area. | 575 cm² | 23 squares × 25 |
| 3 | Rectangle 8 × 3, 1 square = 2 cm. Area. | 96 cm² | 24 squares × 4 |

#### 3.5 Uniqueness
Key parameters: tool, level, ask, the point list (as a string), scale. Pool: Level 1 ≈ 7×7 minus excluded ≈ 40 shapes × 2 asks; Level 2 ≈ 3 templates × ~15 size sets × 2 asks; both exceed 24.

---

### Sub-tool: Standard Shapes (`shapes`)

Perimeter and area of the standard shapes from side lengths and heights, with distractor measurements on the picture.

#### 3.1 Question options (QO)

- **multiSelect** `askFor` — "Ask for" (`balanced: true`), Levels 1–2: `perimeter` (true) · `area` (true).
- **multiSelect** `given` — "Given" (`balanced: true`), Level 3: `perimeter` (true) · `area` (true).
- **multiSelect** `shapes` — "Shapes" (`balanced: true`): at Level 1 `rectangle` (true), `square` (true), `regularPolygon` (true; `requires: ["perimeter"]`, so it greys out when only Area is asked); at Level 2 `rightTriangle` (true), `isoscelesTriangle` (true), `parallelogram` (true), `trapezium` (true); at Level 3 `rectangle` (true), `triangle` (true), `parallelogram` (true), `trapezium` (false).
- **multiSelect** `units` — "Units" (exclusive), Levels 2–3: `same` — "Same Units" (default) · `mixed` — "Mixed Units".
- **Per-level differences:** `shapes` differs by level as above; `given` exists at Level 3 only; `units` at Levels 2–3.

#### 3.2 Levels

**Level 1 — rectangles, squares, regular polygons.**
- Parameters: sides 3–20 cm; regular polygons are pentagon, hexagon, octagon (side 3–15).
- Constraints: a rectangle's two sides differ by at least 3 (it must not look square); all given in cm; polygons are Perimeter only.
- Misconceptions targeted: adding only two sides of a rectangle; area by adding.

**Level 2 — triangles, parallelograms, trapezia, built from Pythagorean triples so the picture is to scale.**
- Parameters: choose a triple (p, h, s) from (3,4,5), (6,8,10), (5,12,13), (9,12,15), (8,15,17), (12,16,20); scale it ×1 or ×2 where lengths stay ≤ 40.
  - **Right-angled triangle:** legs a, b and hypotenuse c from a triple (a, b, c). Area = ½ab.
  - **Isosceles triangle:** base 2p, height h, equal sides s. Area = ½·2p·h.
  - **Parallelogram:** base b (5–20), slant side s, perpendicular height h (dashed, with its right-angle mark), horizontal offset p. Perimeter = 2(b + s); area = b·h.
  - **Isosceles trapezium:** parallel sides a > b with a − b = 2p, height h, slant sides s. Perimeter = a + b + 2s; area = ½(a + b)h.
- Constraints: for the Ask asked, the picture shows exactly the lengths needed **and the distractors of the other ask** (a Perimeter question also shows the height; an Area question also shows the slant side), which is what the question is testing. Units option: `mixed` shows two of the lengths in mm or m under the Section 3.0 rule.
- Exclusions: a parallelogram with h = s (a rectangle); lengths above 40.
- Misconceptions targeted: using the slant side as the height; forgetting the ½ in a triangle; adding all given lengths for an area.

**Level 3 — find a missing length from the perimeter or area.**
- Parameters: rectangle (given perimeter P or area A and one side), triangle (area and base, find height), parallelogram (area and base, find height), optionally trapezium (area, height and one parallel side, find the other).
- Constraints: the answer is a whole number of cm; the working is a short rearrangement, not an equation-solving chain; the question states which length to find with a `?` on the picture and the given measurement in the caption ("The perimeter is 36 cm.").
- Units option: the given measurement or a side is in m or mm per Section 3.0.
- Misconceptions targeted: halving the perimeter but forgetting to subtract the known side; dividing the area by the wrong length.

#### 3.3 Worked example script

- **Level 1 rectangle perimeter** (12 × 5): `mStep("Add all four sides:", ["12", "+ 5", "+ 12", "+ 5", "= 34"], "cm")`; or `mStep("Two lengths and two widths:", ["2 × 12 + 2 × 5", "= 24 + 10", "= 34"], "cm")` (picked at random and stated). Area: `mStep("Area = length × width:", ["12 × 5", "= 60"], "cm²")`.
- **Level 2 triangle area** (right-angled 6, 8, 10): `mStep("The base and the height meet at the right angle, so use 6 and 8:", …)`, then `mStep("Area = ½ × base × height:", ["½ × 6 × 8", "= 24"], "cm²")`. The hypotenuse is lit grey ("not needed") in that step. Perimeter: `mStep("Add the three sides:", ["6", "+ 8", "+ 10", "= 24"], "cm")`.
- **Level 2 parallelogram area** (9, slant 5, height 3): `mStep("Use the perpendicular height, not the slant side:", ["9 × 3", "= 27"], "cm²")`.
- **Level 3 rectangle, perimeter 36, side 11:** `mStep("Two sides add to half the perimeter:", ["36 ÷ 2", "= 18"])`, `mStep("Take away the side you know:", ["18 − 11", "= 7"], "cm")`.
- **Level 3 triangle, area 30, base 12:** `mStep("Area = ½ × base × height, so height = 2 × area ÷ base:", ["2 × 30 ÷ 12", "= 5"], "cm")`.

#### 3.4 Sample questions (acceptance set)

| Level | Question as displayed | Answer | Working (one line) |
|---|---|---|---|
| 1 | Rectangle 12 cm × 5 cm. Find the perimeter. | 34 cm | 2×12 + 2×5 |
| 1 | Square, side 9 cm. Find the area. | 81 cm² | 9 × 9 |
| 1 | Regular hexagon, side 7 cm. Find the perimeter. | 42 cm | 6 × 7 |
| 2 | Right-angled triangle, sides 6, 8, 10 cm. Find the area. | 24 cm² | ½ × 6 × 8 |
| 2 | Isosceles triangle, sides 5, 5, 6 cm, height 4 cm. Find the area. | 12 cm² | ½ × 6 × 4 |
| 2 | Parallelogram, base 9, slant side 5, height 3. Find the area. | 27 cm² | 9 × 3 |
| 2 | Isosceles trapezium, parallel sides 14 and 8, height 4, slant sides 5. Find the perimeter. | 32 cm | 14 + 8 + 5 + 5 |
| 2 | The same trapezium. Find the area. | 44 cm² | ½ × (14 + 8) × 4 |
| 3 | Rectangle, perimeter 36 cm, one side 11 cm. Find the other side. | 7 cm | 36 ÷ 2 − 11 |
| 3 | Rectangle, area 48 cm², one side 6 cm. Find the other side. | 8 cm | 48 ÷ 6 |
| 3 | Triangle, area 30 cm², base 12 cm. Find the height. | 5 cm | 2 × 30 ÷ 12 |
| 3 | Parallelogram, area 54 cm², base 9 cm. Find the height. | 6 cm | 54 ÷ 9 |

#### 3.5 Uniqueness
Key parameters: tool, level, shape, the dimensions as a string, ask or given, units. Pools: Level 1 ≈ 18 × 15 rectangles plus squares plus polygons; Level 2 ≈ 6 triples × 2 scales × 2 asks × the sizes of the free dimension; Level 3 likewise. Each is above 24.

---

### Sub-tool: Compound Shapes (`compound`)

Rectilinear shapes: perimeter with sides to find, and area by splitting or subtracting.

#### 3.1 Question options (QO)

- **multiSelect** `askFor` — "Ask for" (`balanced: true`): `perimeter` (true) · `area` (true).
- **multiSelect** `sidesGiven` — "Sides Given" (Levels 1–2, exclusive): `all` — "All Sides" (default Level 1) · `missing` — "Some Missing" (default Level 2). At Level 3 the same pool offers `missing` only.
- **multiSelect** `perimeterMethod` — "Method for Perimeter" (exclusive, `displayOnly`, Levels 1–2): `addSides` — "Add the Sides" (default) · `boundingRectangle` — "Bounding Rectangle".
- **multiSelect** `areaMethod` — "Method for Area" (exclusive, `displayOnly`): `split` — "Split Up" (default) · `subtract` — "Subtract". At Level 3, shapes with a hole or notch always use `subtract` regardless.
- **multiSelect** `units` — "Units" (exclusive), Level 3: `same` (default) · `mixed`.
- **variables** `showSplit` — "Show the dashed split lines", `displayOnly`, default on at Level 1, off at Levels 2–3 (the picture draws the dashed lines of the chosen area method on the question, not only in the working).

#### 3.2 Levels

**Level 1 — L, T and staircase shapes, every side given.** Templates (all orthogonally convex): L-shape, T-shape, two- and three-step staircase. Bounding box 8–16 × 6–12, every part at least 3. All lengths shown.
**Level 2 — the same convex family (and the plus/cross), some sides missing.** One or two sides are shown as `?`; each is derivable from the opposite edges and the picture and working say why. Never two missing sides in the same direction on the same side of the shape.
**Level 3 — notches and holes.** U-shape (notch from the top), comb, and a rectangular frame (a hole inside). Area uses subtraction (outer − cut-out); perimeter adds the inside edges of a notch or hole (a frame's perimeter is the outer **plus** the inner boundary). Mixed Units as an option.
- Misconceptions targeted: forgetting the inner boundary of a hole; reading the bounding-rectangle shortcut as valid for a notch; the missing side found by adding instead of subtracting.

**Constraints, all levels:** the shape comes from `rectilinear.ts` templates (points, so the model derives edges); every missing side is a whole number ≥ 2; area ≥ 20; no edge shorter than 2.

#### 3.3 Worked example script

- **Missing side (the core idea, lit on the picture):** `mStep("The top edges add up to the same as the bottom edge:", ["x + 7 + 7", "= 20"])` then `mStep("So the missing side is:", ["20 − 14", "= 6"], "cm")`, with the matching horizontal edges lit. The vertical version reads "the two sides on the left add up to the right side".
- **Perimeter, Add the Sides:** `mStep("Add every side:", ["6", "+ 4", "+ 7", …, "= 60"], "cm")`.
- **Perimeter, Bounding Rectangle:** `mStep("This shape has no notch, so its perimeter equals the rectangle round it:", ["2 × (width + height)", "= 2 × (10 + 8)", "= 36"], "cm")` with the dashed bounding rectangle drawn.
- **Area, Split Up:** two coloured rectangles, `mStep("Split it into two rectangles:", …)`, `mStep("Area A:", ["9 × 4", "= 36"])`, `mStep("Area B:", ["5 × 4", "= 20"])`, `mStep("Add them:", ["36 + 20", "= 56"], "cm²")`. **Subtract:** the outer rectangle in one colour, the missing corner hatched, `mStep("Whole rectangle minus the missing corner:", ["9 × 8 − 4 × 4", "= 72 − 16", "= 56"], "cm²")`.
- **Level 3 frame:** `mStep("The outside edge:", ["2 × (12 + 9)", "= 42"])`, `mStep("The inside edge counts too:", ["2 × (6 + 3)", "= 18"])`, `mStep("Add them:", ["42 + 18", "= 60"], "cm")`.

#### 3.4 Sample questions (acceptance set)

| Level | Question as displayed | Answer | Working (one line) |
|---|---|---|---|
| 1 | L-shape (0,0)(9,0)(9,4)(5,4)(5,8)(0,8), all sides given. Perimeter. | 34 cm | 9+4+4+4+5+8 (= 2×(9+8)) |
| 1 | The same L-shape. Area. | 56 cm² | 9×4 + 5×4 |
| 1 | T-shape (0,0)(14,0)(14,4)(9,4)(9,10)(5,10)(5,4)(0,4). Area. | 80 cm² | 14×4 + 4×6 |
| 1 | Staircase (0,0)(12,0)(12,3)(8,3)(8,6)(4,6)(4,9)(0,9). Perimeter. | 42 cm | 2×(12+9) |
| 2 | L-shape (0,0)(10,0)(10,3)(4,3)(4,8)(0,8), sides 6 and 5 missing. Perimeter. | 36 cm | 6 = 10 − 4, 5 = 8 − 3; 2×(10+8) |
| 2 | The same L-shape. Area. | 50 cm² | 10×3 + 4×5 |
| 2 | Cross (3,0)(7,0)(7,3)(10,3)(10,7)(7,7)(7,10)(3,10)(3,7)(0,7)(0,3)(3,3), two sides missing. Area. | 64 cm² | 4×10 + 2×(3×4) |
| 3 | U-shape (0,0)(14,0)(14,10)(10,10)(10,3)(4,3)(4,10)(0,10), outer 14 × 10, notch 6 wide, 7 deep. Area. | 98 cm² | 14×10 − 6×7 |
| 3 | The same U-shape. Perimeter. | 62 cm | 2×(14+10) + 2×7 |
| 3 | Frame, outer 12 × 9, hole 6 × 3. Perimeter. | 60 cm | 2×(12+9) + 2×(6+3) |
| 3 | Frame, outer 12 × 9, hole 6 × 3. Area. | 90 cm² | 12×9 − 6×3 |
| 3 | L-shape (0,0)(150,0)(150,60)(90,60)(90,130)(0,130), labels in m and cm. Perimeter in cm. | 560 cm | 2×(150+130) |

#### 3.5 Uniqueness
Key parameters: tool, level, template id, the point list, ask, which sides are missing, units. Pool: 4–6 templates per level × ~30 size sets × 2 asks, above 24 at every level.

---

### Sub-tool: With Algebra (`algebraic`)

Perimeter and area with sides written as expressions in `x`. Lengths are in cm and stated in the caption ("All lengths are in cm."), never inside the maths.

#### 3.1 Question options (QO)

- **Levels 1–2** are about perimeter only; area comes in at Level 3, so there is no Ask for pool on this tab.
- **Level 1 — multiSelect** `shapes` — "Shapes" (`balanced: true`): `rectangle` · `triangle` · `square` (all true).
- **Level 2 — multiSelect** `shapes` as at Level 1 (the perimeter is always a number and the equation is solved).
- **Level 3 — multiSelect** `questionTypes` — "Question Types" (`balanced: true`): `areaExpression` — "Area, Expanded" (true) · `lShapePerimeter` — "L-Shape Perimeter" (true).
- **Per-level differences:** as above.

#### 3.2 Levels

**Level 1 — write and simplify the perimeter.** Rectangle sides from {`x`, `x + a`, `2x`, `2x + a`, `3x − a`}, triangle with three such sides, square side `kx + a`. Constants 1–6, coefficients 1–3, every side positive for the stated x (the caption gives x > 3 for any `3x − a`).
- Constraints: the answer is fully simplified, written `px + q` with q > 0.
- Misconceptions targeted: adding only two sides of a rectangle; failing to multiply a bracket's constant by 2 for a square; `x + x = x²`.

**Level 2 — solve for x from a given perimeter.** The perimeter is a number; form `px + q = P`, solve for x (a whole number 2–9), then often find a side.
- Constraints: x and every resulting side are positive whole numbers; triangle sides obey the triangle inequality; the working shows the equation, then the solution, then the check (`sides are 11 cm and 13 cm`).
- Misconceptions targeted: forgetting the doubling for a rectangle; solving `6x + 6 = 48` as `x = 8`.

**Level 3 — algebra with area and compound shapes.**
- *Area, Expanded:* rectangle with sides `x` and `x + a` → `x² + ax`; `(x + a)(x + b)` → `x² + (a + b)x + ab`; triangle with base `(x + a)` and a numeric height → `½h(x + a)` simplified.
- *L-Shape Perimeter:* an L-shape (columns of widths `x + a`, `kx`, heights `x + b`, `x`) with two of its sides unlabelled; the perimeter equals the bounding rectangle's, so the working finds `2(W + H)` and simplifies.
- Misconceptions targeted: `(x + 2)(x + 7) = x² + 14`; leaving the missing sides out of an L-shape's perimeter.

#### 3.3 Worked example script

- **Level 1 rectangle (x + 3) by 2x:** `mStep("Add all four sides:", ["(x + 3)", "+ 2x", "+ (x + 3)", "+ 2x"])`, `mStep("Collect the x terms and the numbers:", ["x + 2x + x + 2x + 3 + 3", "= 6x + 6"])`; answer `6x + 6`.
- **Level 2 rectangle (x + 4) by (2x − 1), perimeter 48:** `mStep("Write the perimeter as an expression:", ["2(x + 4) + 2(2x − 1)", "= 6x + 6"])`, `mStep("It equals 48:", ["6x + 6 = 48"])`, `mStep("Solve:", ["6x = 42", "x = 7"])`, `mStep("Check the sides:", ["11 and 13"], "cm")`; answer `x = 7`.
- **Level 3 area:** `mStep("Multiply every term in one bracket by every term in the other:", ["(x + 2)(x + 7)", "= x² + 7x + 2x + 14", "= x² + 9x + 14"])`. **L-shape:** `mStep("No notch, so the perimeter is the rectangle round it:", ["2(3x + 1 + x + 3)", "= 2(4x + 4)", "= 8x + 8"])`.

#### 3.4 Sample questions (acceptance set)

| Level | Question as displayed | Answer | Working (one line) |
|---|---|---|---|
| 1 | Rectangle with sides x + 3 and 2x. Perimeter. | 6x + 6 | 2(x + 3) + 2(2x) |
| 1 | Triangle with sides x, x + 2, 2x − 1. Perimeter. | 4x + 1 | x + (x + 2) + (2x − 1) |
| 1 | Square, side 2x + 1. Perimeter. | 8x + 4 | 4(2x + 1) |
| 2 | Rectangle (x + 4) by (2x − 1), perimeter 48 cm. Find x. | x = 7 | 6x + 6 = 48 |
| 2 | Triangle x + 2, 2x, 3x − 1, perimeter 37 cm. Find x. | x = 6 | 6x + 1 = 37 |
| 2 | Square, side 3x − 2, perimeter 40 cm. Find x. | x = 4 | 12x − 8 = 40 |
| 3 | Rectangle, sides x and x + 5. Area. | x² + 5x | x(x + 5) |
| 3 | Rectangle, sides x + 2 and x + 7. Area. | x² + 9x + 14 | (x + 2)(x + 7) |
| 3 | Triangle, base x + 4, height 6. Area. | 3x + 12 | ½ × 6 × (x + 4) |
| 3 | L-shape: bottom 3x + 1, left x + 3, top x + 1, right x. Perimeter. | 8x + 8 | 2(3x + 1 + x + 3) |

#### 3.5 Uniqueness
Key parameters: tool, level, shape or question type, the side expressions as a string, the given perimeter. Pools: Level 1 ≈ 5 × 5 × 4 combinations per shape; Level 2 constrained by integer solutions (≥ 30 after filtering); Level 3 ≈ 6 × 6 per type. The generator checks the pool is at least 24 per level in a test.

---

## 4. Variety requirements

Grid and Compound sub-tools reflect (mirror) and rotate their templates by 90° at random, so an L-shape faces four ways. Standard Shapes spreads shapes by the `balanced` pools, and the distractor measurement (height beside a perimeter question, slant side beside an area question) is always drawn. Algebra spreads the letter of the coefficient (`2x` not always first) and the order of the expression. Mixed-unit questions never put every label in the same unit.

---

## 5. Info modal content (`PerimeterArea.about.ts`)

- Purpose: "Find the perimeter and area of shapes, from counting squares to compound shapes and algebra."
- `grid` — purpose "Count the length round a shape and the squares inside it." Levels: "Rectangles and squares on a grid" · "L, T and staircase shapes on a grid" · "A scale on the grid: one square is 2 cm or 5 cm".
- `shapes` — purpose "Use side lengths and heights to find perimeter and area, or to find a missing length." Levels: "Rectangles, squares and regular polygons" · "Triangles, parallelograms and trapezia, with the extra lengths shown" · "Find a missing length from the perimeter or area".
- `compound` — purpose "Find the perimeter and area of shapes made from rectangles." Levels: "L, T and staircase shapes with every side given" · "Some sides missing: find them from the opposite sides" · "Notches and holes, where the inside edge counts".
- `algebraic` — purpose "Write and use perimeter and area with sides in terms of x." Levels: "Write and simplify the perimeter" · "Solve for x from a given perimeter" · "Expand areas and find the perimeter of an L-shape".
- Options (one explainer per option by id, no relisting of choices): `askFor` "What the question asks you to find." · `given` "Whether the perimeter or the area is given." · `shapes` "Which shapes can come up." · `units` "Whether all the lengths are in the same unit or you must convert." · `scale` "How long one square on the grid is." · `sidesGiven` "Whether every side is labelled." · `perimeterMethod` "How the perimeter is worked out in the working." · `areaMethod` "How the area is worked out in the working." · `showSplit` "Whether the dashed lines for the area method are drawn on the question." · `questionTypes` "The kind of algebra question."

---

## 6. Out of scope / future ideas

- **Arcs, circles and sectors** (Circle Properties already has sector perimeter and area).
- **Surface area and volume** (a separate 3D tool).
- A **squared-paper printable** for the Grid tab: it needs a new sheet in `printables.ts` and "Squared grid" added to the blank-representation list that `printables.test.ts` accepts.
- A Depth bank (perimeter-versus-area diagnoses, "which length do I use?") and a lesson once the tool is reviewed.
- Worded problems (fencing a garden, tiling a floor), and perimeter with Pythagoras for a missing side.
- Calibration (Smart Progressor) once the tool is settled.
