# Rectilinear area — editor foundations

**Status:** implemented
**Audience:** Year 7 top set, secure rectangle area, new to rectilinear shapes.
**Lesson:** 60 minutes, with a natural continuation if it overruns.

## Agreed teaching sequence
No retrieval starter. Introduce rectilinear shapes and discuss possible splits; model splitting and adding; authored practice with fading support; live general practice; discuss the alternative of removing a cut-out; independent authored worksheet; exit check. Calculating missing boundary lengths is separate from reduced labelling.

The discussion compares one 8 cm × 6 cm L-shape with a 3 cm × 2 cm corner removed: 8 × 4 + 5 × 2 = 42 cm², and 8 × 6 − 3 × 2 = 42 cm². The outline stays the same when the method changes. This task builds the editor capabilities; it does not claim the full lesson has been authored.

## Required foundations
- Offer only the supported Rectilinear Shapes sub-tool in the deck generator picker, using the existing generator and options.
- Retain the shape diagram and step focus in slides; reset working on a new question and preserve earlier revealed lengths through later steps.
- Chosen-dimension L, T and staircase questions, with rotation/reflection and split/add or subtraction. Dimension edits update the shape, answer and working together; invalid dimensions prevent Apply. Same units, whole centimetres.
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
Shared draft `my-rectilinear-foundations-mwb163ic` (five slides): a modelled split, live general practice, a cut-out discussion using the same outline, and a six-question authored worksheet with fading scaffolds. Snapshot: `src/decks/data/my-rectilinear-foundations-mwb163ic.json`. It demonstrates the foundations, is not the complete 60-minute lesson, and is not published.
