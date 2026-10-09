# Worked Example fullscreen — usability audit (2026-10-09)

**Scope:** the fullscreen worked example added to `ToolShell` (`WorkedExampleSteps` `fullscreen` prop, `renderWorkedExample`) and `DecisionShell`'s fullscreen working area.
**Method:** headless Chromium driving the live dev build. ToolShell: 9 tools (plain text, side picture ×3, top picture, diagram, graph, custom renderer) × 5 viewports (1920×1080, 1366×768, 1024×768, 768×1024, 390×844) — open the worked example, Show Answer, Fullscreen, step to the end; per run it measured overflow, whether the Next button is in view and clear of other controls, whether the last step is visible, toolbar height, console errors. Behaviours (Esc, arrow keys, New Question, Question Options popover) were tested at 1366×768. DecisionShell: Network Flows at three viewports. Final-beat screenshots were inspected for 1366×768 and 768×1024. Not tested: touch input, a real projector, screen readers, other Decision tools.

## What works (measured)
- The Back / Next controls were inside the viewport in every run (36 of 36 ToolShell fullscreen runs; all 3 Decision runs). No horizontal page or overlay scroll, no console errors.
- Esc exits; the Question Options popover opens above the overlay and fully in view; level changes and New Question work inside fullscreen.
- Steps follow the current beat and the footer stays pinned; step text is much larger than in the page (readable from a distance).
- Phone width (≤ 640 px) keeps the page's compact layout and shows no fullscreen button — by design.

## Findings

### High
| # | Finding | Evidence | Suggested fix |
|---|---|---|---|
| H1 | **The ink pencil button sits on top of Next** (and clips the end of the step-dot strip). Both shells. A teacher pressing Next hits the pen. | The Next button and the app-level pencil button rectangles overlap in every desktop / tablet run (ToolShell 36/36; Decision at 1366, 1024 and 768 wide). Screenshots show the pencil covering the right chevron. | Reserve a right-hand gutter (~64 px) on the footer in fullscreen, or centre the controls; do not move the pen (it is app-level). |
| H2 | **No keyboard stepping in the ToolShell fullscreen.** ← / → do nothing; only Esc works. Decision's fullscreen does step with the arrows. A presenter with a clicker or keyboard cannot advance. | ArrowRight left the page content unchanged. | Add ← / → (and Space) while `weFullscreen`, ignoring typing targets and open popovers, as `DecisionShell` does. Reuse for the page view too. |
| H3 | **Last step can be cut off in tablet portrait** when a picture sits beside the steps: the footer covers "Answer: x = 60°". | Angles in Triangles at 768×1024: the scroll area is scrollable but not at the bottom after the final beat (screenshot shows the answer half hidden). Cause: auto-scroll follows only the inner list; in the stacked (< lg) split the outer scroller has no ref. | Give the outer wrapper the scroll ref in split mode too (scroll both on every beat). |
| H4 | **Question text is cropped sideways in tablet portrait.** | Equations of Lines at 768×1024: "(3, 4) and (7, 8)" shows as ", 10) and (5, 1" — the fit-scaler enlarges the question beyond the panel width in the stacked column layout. | Cap the scale by panel width as well as height; give the stacked panel a definite height. |

### Medium
| # | Finding | Evidence | Suggested fix |
|---|---|---|---|
| M1 | **Esc with the Question Options popover open leaves fullscreen** instead of closing the popover first. | Tested: popover open → Esc → overlay gone. | Let the popover consume Esc (or check for an open popover before exiting). |
| M2 | **Pictures do not grow into the big panel.** Triangle diagram, BIDMAS pyramid and graph occupy roughly a third of their panel at 1366×768 while the step text is very large — the picture is the smaller thing on screen. | Screenshots at 1366×768 and 768×1024. | Fit-scale the visual into its panel in fullscreen (as the Whiteboard's `fitFS` does), up to a sensible maximum. |
| M3 | **Toolbar eats the screen on short or narrow displays:** 9 % of height at 1366×768, 13 % at 768×1024, **17 % at 1024×768** (wraps to two rows). | Measured toolbar height per run. | Compact toolbar below ~1100 px (icon-only New Question / Exit, level toggle collapsed into the Options popover). |
| M4 | **New Question inside fullscreen drops the answer** and the layout jumps: the steps panel disappears and the question goes full width until Show Answer is pressed. Decision's fullscreen keeps its layout. | Tested at 1366×768. | Keep the two-panel layout with a "Press Show Answer" placeholder, or keep Show Answer on when it was on. |
| M5 | **Question reads small next to the steps** when the answer is showing (question scaled to at most 1.4× in a 36 % panel, steps at ~48 px). | 1366×768 screenshots (Fractions, Decimals, Speed Distance Time). | Allow the question panel to scale more while the steps still fit; or let the teacher drag the divider (the Whiteboard has one). |

### Low
- **L1:** the Back / Next chevrons have no accessible name or tooltip in the ToolShell fullscreen (only the dots have titles); Decision's do. Add `aria-label` / `title`.
- **L2:** in Decision's fullscreen at 1366×768 and Level 3 the potential / flow labels are ~9–10 px — hard to read from the back of a room; the network is fitted to a canvas that shares width with a 2/5-wide working panel. Consider a wider canvas share or a size control.
- **L3:** fullscreen is not remembered or in the URL (Whiteboard behaves the same) — acceptable.
- **L4:** phones cannot enter fullscreen from the worked example (compact layout only). Fine unless a phone is mirrored to a screen.

## Recommended order
1. H1, H2 (every teacher hits them), then H3, H4 (tablet correctness).
2. M1–M4.
3. M2 / M5 and the lows as polish.

Reproduce: start `npx vite`, open any ToolShell tool with `?mode=example`, press Show Answer, then the expand button beside the text-size chevrons; for Decision open `/network-flows` and press the expand button on the diagram.
