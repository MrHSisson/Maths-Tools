# Sandboxes and viewports
- **Status:** building
- **Updated:** 2026-10-28

## Intention
Build each sandbox as a tool on its own first, usable in a lesson, then build it into question tools as a viewport on the solving. Pattern: standalone tool, then a Developing-tools lab bench that feeds it question data, then an embedded viewport. All share a layout and toolbar (`DrawHotbar`).

## Progress
- Algebra Tiles and Negative Counters live, standalone. `CounterBoard` already draws counters in worked solutions; using it as a viewport in Integer Add/Sub is held until the sandbox is right.
- SmartGrapher (`src/shared/grapher/`) is mature and already a viewport in Properties of Line Equations, Simultaneous Equations (Substitution) and Mixed Strategies. Grapher Lab (`/grapher`, dev) is its test bench and the model for the others.
- Parallel Lines Explorer live.

## Next steps
- Lab benches for counters and tiles; define the viewport pattern (embedded via `questionRenderer` / `stepVisualRenderer`).
- Extract an Algebra Tiles representation component; counters as a viewport in Integer Add/Sub.
- SmartGrapher on Completing the Square (parabola and vertex) and Iteration (curve and root, the top unwired candidate); an ellipse preset for Simultaneous Equations (Substitution).

## Where to read more
`docs/reference/pictures.md`, `docs/reference/shell-extras.md`.
