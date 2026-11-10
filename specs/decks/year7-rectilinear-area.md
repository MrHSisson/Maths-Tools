# Year 7 rectilinear area — revised sequence
Status: implemented after review, 2026-11-10. Native deck is the master. 60 minutes, with optional practice continuing next lesson. No retrieval starter. Rectangle area already secure.

| Minutes | Sequence |
| --- | --- |
| 0–10 | Four partition-only questions: L, T, staircase, cross. Draw rectangles; no areas yet. |
| 10–15 | Discuss valid partitions, gaps/overlaps, and which split makes dimensions easiest to identify. |
| 15–22 | T worked area model, then explicit internal-length models: staircase width by subtraction and cross width by addition. |
| 22–35 | Six varied authored questions: identify internal rectangle dimensions before areas. Live split-and-add generator, external sides all given. |
| 35–45 | Subtraction built from an L corner, to an M with two cut-outs, then an O frame. Authored practice and Level 3 generator as continuation if needed. |
| 45–57 | Worksheet mirrors the three stages. |
| 57–60 | Apply/justify a method; continue next lesson if needed. |

No external missing-length questions or generator settings remain. Worked solutions now explicitly derive any needed internal rectangle width/height before multiplication, using addition of contiguous spans or subtraction from a longer span. Example: staircase middle width = 14−4=10. This runs through the canonical tool builder, so authored and generated work agree.

Worksheet: four unpartitioned shapes to split only; four internal-dimension/area questions with fading split support; L, M and O cut-outs. Three pupil pages and three worked-key pages. The first key page shows possible partitions, accepts alternatives and gives no area calculations. Later key pages show internal-length arithmetic before rectangle areas.

The agreed diagram style remains: actual boundary arrows at 10 screen pixels from their own edge, all independent boundary labels retained, only aligned spans implied; no internal-width arrows, tabs, generic diagram headings or overall dimension frames.

Exports: run `_check/year7-rectilinear-assets.cjs` with the app running, then `_check/year7-rectilinear-print.py --work <folder>`. Native partition task is saved with each authored shape so editing dimensions preserves its partition-only purpose.
