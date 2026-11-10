# Area of rectilinear shapes — Year 7 top set
**Status:** implemented, revised after review 2026-11-10
**Length:** 60 minutes, with optional continuation. Pupils already know rectangle area. No retrieval starter.
**Primary resource:** native deck `year7-rectilinear-area`, not PowerPoint.

| Minutes | Route | Purpose |
| --- | --- | --- |
| 0–8 | Worked T-shape with partition visible; compare two splits | Establish split, multiply, add; move on promptly |
| 8–20 | Practice A, optional generator | One L, two Ts, staircase, cross and U; fade supplied splits |
| 20–32 | T addition model, staircase subtraction model, Practice B | Find lengths explicitly, then area; T/staircase/U/two-notch outlines |
| 32–43 | U cut-out discussion, two-notch method choice, frame model | Explain whole area minus every removed area; compare methods |
| 43–57 | Authored worksheet | Supplied splits → missing lengths → cut-outs/holes |
| 57–60 | New U-shape missing length/area and explanation | Check reasoning and units |

Optional continuation: six authored U/frame/two-notch questions and the Level 3 generator follow the cut-out models. Skip these initially if needed; return next lesson rather than rushing the discussion or worksheet.

## Worksheet composition
12 distinct authored questions: two L, two T, two staircases, one cross, two U, one two-notch and two frames. Keep L questions 1 and 3 as accessible anchors, then require new decisions. Three A4 pages with working room and a separate worked key.

| Questions | Scaffold / idea | Traps |
| --- | --- | --- |
| 1–2 | L/T, supplied splits and calculation prompts | Area vs perimeter; missing a rectangle |
| 3–5 | Rotated L, staircase, cross; supplied splits only | Dimensions from different rectangles; double counting |
| 6–8 | T, staircase, U; marked unknowns before area | Whole vs part; incorrect addition/subtraction |
| 9–12 | U, frame, two cut-outs, larger frame | Enclosing area includes extra material; subtract all holes/cut-outs |

## Labels and authoring
All authored questions use Q.rectilinear, through the tool's canonical geometry/solution. Authoring now supports L, T, stairs, cross, U, comb/two cut-outs and frame. Missing lengths work on eligible open outlines, never frames. New dimensions are editable in the deck.

Length labels use double-headed dimension arrows outside the outline, with witness lines to their exact endpoints. Every independent boundary length remains given, even if a component width would suffice for area. Only a labelled parallel edge with exactly the same coordinate span makes a length implied. Deliberately missing lengths show `?`; unrelated equal steps retain individual labels. Extra supplied component widths support early area work without replacing boundary labels. Captions, matching-marks text, generic Explain/Practice headings and model prompts above diagrams are removed. Slides 4–5 are combined: slide 4 now models a partitioned T-shape, A = 10 × 2 = 20, B = 4 × 5 = 20, total 40 cm². The deck has 19 slides.

## Verification and exports
Recompute all areas independently using polygon shoelace and rectangle sums/removals, and verify missing boundary lengths. Check distinct answers within each authored set. Run content/layout and browser print checks.

`year7-rectilinear-export.tsx` exports the native questions and shared-renderer assets. With the app running: `SMOKE_URL=http://localhost:5173 node specs/decks/_check/year7-rectilinear-assets.cjs work/year7-lesson`; set PLAYWRIGHT_PATH/CHROMIUM_PATH if required. Then `python specs/decks/_check/year7-rectilinear-print.py --work work/year7-lesson` generates the revised worksheet and key. The earlier PowerPoint export is superseded; it is not the lesson master.
