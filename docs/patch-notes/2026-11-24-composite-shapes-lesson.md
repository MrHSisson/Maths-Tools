Strand: Maths

## 2026-11-24 — Composite shapes: a Year 7 authored lesson deck

Branch `claude/clever-pascal-4ckijk`. Area: `specs/decks/composite-shapes*.ts`, `src/decks/data/composite-shapes.json`.

A new authored lesson deck, 34 slides, no generator. Recall grid, vocabulary, a "how would you split it?" discussion, then four sections each opened by a modelled example: adding (rectangle + triangle, with missing lengths), subtracting a cut-out (shaded shapes), parallelograms, and trapezia as the stretch (a rectangle and triangles, then the formula agrees). A "find the mistake" slide names the sloping-side trap once. It finishes with six mixed shapes as book work, (a) to (f), like the reference sheet, an exit ticket and a summary. 17 whiteboard questions on a ladder agreed with Harry (`specs/decks/composite-shapes.md`); every answer is recomputed inside the build script from the picture's own pieces, so a picture and its answer cannot disagree.
Pictures: no existing tool draws triangles, parallelograms and trapezia in one outline, so each shape is an authored SVG saved in the deck as an image (`specs/decks/composite-shapes-art.ts`); a click shows it split into lettered pieces and the working appears a line a click. No new site code, so the deck can be pushed straight away. Lengths are therefore fixed (not editable in the slide editor). A shape-spec picture in the editor (like Rectilinear Shapes) is the alternative if lengths ever need to be editable or printable.
Checks: deck content and layout checks pass on all 34 slides; type check and lint clean.
Not done: no printed worksheet pinned; no Depth bank.
Agent: Claude Code
Notes: Build Log block to be added by the next planner update (planner not updated this session).
