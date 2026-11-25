Strand: Maths

## 2026-11-25 — Standard form deck: a book-work slide of numbers in parts

Branch `claude/relaxed-cannon-ppjzr2`. Area: `specs/decks/standard-form.build.ts`, `specs/decks/_check/standard-form-converting.json`, `src/decks/data/standard-form.json`.

- **New book-work slide `sf-book-parts` (slide 50 of 52)**: twelve numbers in parts on the standard 3 × 4 grid (plain numbers, answers on a click). It sits after the small numbers-in-parts whiteboards and before the Level 3 generator. Six too big and large (`12 × 10⁴`, `35 × 10⁶` …), three too big and small (`56 × 10⁻⁵` …), three with a first number below 1 (`0.3 × 10⁸` …).
- Every answer is recomputed by the build script and the independent check script (168 questions, none repeated). Layout checked with `deck verify`; pushed to the shared deck.
- Not done: the plan file `specs/decks/standard-form-converting.md` does not yet mention the slide.

Agent: Claude Code
Notes: Build Log block "Trig range bar, range on its own line, standard form numbers-in-parts (Claude Code)" (written after the merge).
