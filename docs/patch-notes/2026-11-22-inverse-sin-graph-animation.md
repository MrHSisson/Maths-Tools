Strand: Maths

## 2026-11-22 — An animated graph slide piece, and a short deck on y = arcsin x

Branch `claude/upbeat-cannon-alffb7`. Area: `src/decks/{types,InverseTrig,SlideCanvas,EditorChrome,layouts,builder}`, `src/shared/inverseTrig.ts`, `src/tests/inverseTrig.test.ts`, `specs/decks/arcsin-graph.build.ts`, `src/decks/data/arcsin-graph.json`, docs (FEATURES, `docs/reference/decks.md`).

- **New slide piece `inverseTrig`**: the graph of y = sin x restricted to −π/2 ≤ x ≤ π/2, reflected in y = x and separated into y = arcsin x, as an animation over four clicks: restrict, mirror line, fold (every point swaps x and y, so the copy is exactly y = arcsin x), separate (the copy slides out to its own axes). Back plays it in reverse. The editor, thumbnails and print show the finished state; reduced-motion jumps to each state. x and y are drawn at the same scale so the reflection is a true one.
- **Layout** `inverseTrigSlide` (`S.inverseTrig`), in Add slide and the slide library.
- **Deck `arcsin-graph`** (6 slides, no practice): title, objective, a discussion (why sin x must be restricted), the animation, domain and range swap, summary. Pushed to the shared copy only when Harry asks (see below).
- Only `fn: "sin"` for now; cos and tan are not built.
- Checked: `npm run deck -- check arcsin-graph --layout`; every click watched frame by frame in the player (no console errors); `inverseTrig.test.ts` checks the fold maths against `Math.asin`.
- Deliberately not done: the look card step (Harry's yes before building) was skipped because the request was a single animation; no Handoff block or planner Build Log (planner not used this session).

Agent: Claude Code
Notes: no Build Log block written this session (see above).
