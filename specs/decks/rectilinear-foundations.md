# Rectilinear area — editor foundations

**Status:** implemented
**Audience:** Year 7 top set, secure rectangle area, new to rectilinear shapes.
**Lesson:** 60 minutes, with a natural continuation if it overruns.

## Agreed teaching sequence
No retrieval starter. Introduce rectilinear shapes and discuss possible splits; model splitting and adding; authored practice with fading support; live general practice; find deliberately marked missing lengths by addition then subtraction before calculating area; discuss the alternative of removing a cut-out; independent authored worksheet; exit check. Reduced labelling is used throughout. It only omits geometrically implied equals; the mid-lesson missing-length phase marks a deliberate unknown with `?` and calculates it before area.

The discussion compares one 8 cm × 6 cm L-shape with a 3 cm × 2 cm corner removed: 8 × 4 + 5 × 2 = 42 cm², and 8 × 6 − 3 × 2 = 42 cm². The outline stays the same when the method changes. This task builds the editor capabilities; it does not claim the full lesson has been authored.

## Revised 60-minute sequence
| Minutes | Focus |
| --- | --- |
| 0–5 | Introduce rectilinear shapes and possible splits; no retrieval starter |
| 5–13 | Model splitting into rectangles and adding areas |
| 13–24 | Authored practice followed by live general practice, all necessary lengths given or implied |
| 24–35 | Model finding missing lengths: addition first, then subtraction; use each result to find area |
| 35–43 | Discuss finding the same area by removing a cut-out |
| 43–57 | Scaffolded worksheet, moving from supplied splits to independent work and missing lengths |
| 57–60 | Exit check: missing length, then area, with an explanation of method |

## Required foundations
- Offer only the supported Rectilinear Shapes sub-tool in the deck generator picker, using the existing generator and options.
- Retain the shape diagram and step focus in slides; reset working on a new question and preserve earlier revealed lengths through later steps.
- Board edge labels are larger (30 SVG units); worksheet labels remain 12 with unchanged print geometry.
- Reduced labelling defaults on for every rectilinear level; explicit teacher overrides remain available.
- Chosen-dimension L, T and staircase questions, with rotation/reflection and split/add or subtraction. Dimension edits update the shape, answer and working together; invalid dimensions prevent Apply. Same units, whole centimetres. L-shapes additionally choose All necessary lengths, missing by addition, or missing by subtraction. Known splits do not disclose the unknown through helper labels.
- Use the same solution path as the live tool, independently checking the area from chosen dimensions. Do not encode drawings as text or HTML in the saved question.
- A fixed practice set can become an independent authored worksheet, subject to the existing three-sheet limit. Worksheet questions can be edited without changing the source slide and survive shared save, copy and portable export/import.
- Three support choices: supplied split plus calculation prompts, supplied split only, independent work. Supplied internal dimensions avoid unintended missing-length calculations. A4 six questions per page, generous working space, separate worked answers in matching order. Existing generated worksheets retain compatibility.

## Acceptance
- The 42 cm² comparison works for both methods in all eight orientations; T and staircase areas are independently checked.
- Malformed/out-of-range dimensions are rejected by browser and API validation.
- Live diagrams render in full-width and workspace layouts; authored questions and printed sheets use the shared shape renderer.
- Browser flow covers invalid dimensions, edit/apply, save/reload, worksheet copy, actual print buttons and PDF pagination. Test API traffic is isolated from live teacher data.
- Build, tests, lint and phone/tablet/laptop checks pass.

## Review draft
Shared draft `my-rectilinear-foundations-mwb163ic` (eight slides): a modelled split, live general practice, two fixed missing-length models, missing-length generator practice, a cut-out discussion using the same outline, and a six-question authored worksheet with fading scaffolds and two missing-length questions. Snapshot: `src/decks/data/my-rectilinear-foundations-mwb163ic.json`. It demonstrates the foundations, is not the complete 60-minute lesson, and is not published.
