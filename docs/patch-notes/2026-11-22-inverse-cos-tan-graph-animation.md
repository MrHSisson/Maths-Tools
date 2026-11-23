Strand: Maths

## 2026-11-22 — The inverse-graph animation for cos x and tan x, and two more decks

Branch `claude/upbeat-cannon-alffb7`. Area: `src/decks/{InverseTrig,types,layouts}`, `src/shared/inverseTrig.ts`, `src/tests/inverseTrig.test.ts`, `specs/decks/{arccos,arctan}-graph.build.ts`, `src/decks/data/{arccos,arctan}-graph.json`, docs.

- **`inverseTrig` now takes `fn`: `sin`, `cos` or `tan`.** cos x is restricted to 0 ≤ x ≤ π (filled end points, reflected to y = arccos x with range 0 to π). tan x is restricted to −π/2 < x < π/2 between dashed vertical asymptotes; they fold into the horizontal asymptotes y = ±π/2 of y = arctan x (domain all real x). The other three clicks are the same. `S.inverseTrig(id, fn)`.
- **Decks `arccos-graph` and `arctan-graph`** (6 slides each, same shape as `arcsin-graph`, no practice). Their discussion slides use cos(π/3) = cos(5π/3) = 0.5 and tan(π/4) = tan(5π/4) = 1.
- Checked: deck check with layout for all three decks, every click watched in the player, a test that each folded curve equals `Math.asin`, `Math.acos`, `Math.atan` and that each restriction is one-to-one.
- **Axis labelling** (Harry's feedback): ±π/2 and ±π sit below the x axis and left of the y axis, ±1 on the other side so labels no longer collide; a 0 at the origin; white-edged labels drawn over the curves and asymptotes so none is hidden; end points of sin and cos carry their coordinates, e.g. (π/2, 1) becoming (1, π/2), so the swap of x and y can be read off the graph; the y = x label sits clear of its line.
- Not on the shared deck service yet (the live site needs this branch merged first).

Agent: Claude Code
Notes: no Build Log block written this session.
