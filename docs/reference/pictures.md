# Pictures: representations, shapes, diagrams

**Read when:** Building a picture: choosing a representation (bar model, place value table, ratio table, counters…), the shape model, the split worked example, an SVG diagram tool and its print.

Moved out of `CLAUDE.md` unchanged, so every session need not load it. Every rule stated here is listed, one line each, in the **Rules checklist** in `CLAUDE.md`: a rule line carries its id in a comment (for example `R12`), and `src/tests/claudeDocs.test.ts` checks the two stay in step.

---

## Shape pictures — a polygon model and one renderer (`src/shared/shapes/`)

`model.ts` holds shapes as closed polygons (outline first, then holes) and derives every edge length, perimeter, area, bounding box and rectangle split from the points; `drawing.ts` is the plain data a generator hands a picture (edges with labels and ticks, dashed helpers, right-angle marks, coloured regions, a grid, the caption); `Diagram.tsx` draws any of them at worksheet or whiteboard size and lights what a step's `Focus` names; `labels.ts` places label pills by searching candidate spots (slid along the side, pushed out, inside the shape or on the line) and scoring each against the outline, helper lines, other pills, leaders and the picture's edge (`labelPlan` in `Diagram.tsx` returns the plan; `shapeLabels.test.ts` checks it). Reference user: `src/tools/Geometry/PerimeterArea.tsx` (with `perimeterArea/`). Use the same model for any future geometry tool that labels edges.

## Split worked example — the developing picture, three flavours

`stepVisualRenderer` turns Worked Example into a split: ONE picture that updates in place as the steps advance.
Everything is in the shared `WorkedExampleSteps` — a tool only supplies per-step data and a renderer.

| Flavour | Left list | Tool supplies | References |
|---|---|---|---|
| **Caption-only** (default) | each step's caption (`step.plain`) on a numbered timeline; the answer is a green **A** line (no box, no outline) | steps whose snapshot IS the working: `pvStep` + `placeValueStepVisual`; `rStepBuild` + `ratioTableStepVisual` (one ratio table growing a row per step); bar steps | `DecimalAddSub`, `PowersOfTen`, `SpeedDistanceTime`, `RatioSharingTool` |
| **Keep working** (`stepVisualKeepsWorking`) | flat numbered rows (same spine as the captions, no backing cards) carrying each step's own label and maths; picture sits beside them | steps stamped with the picture state | `EquationsOfLines`, `NonLinearSimEq`, `MixedStrategies` (graph) |
| **Picture on top** (`stepVisualPlacement="top"`) | as above, picture full width above | a wide short picture | `IntegerAddSub`, `Rounding` (number line) |

**Step-by-step graph builds.** `SmartGrapher` takes a `step` prop: any series / FOI (`config.fois`) / guide / region
carrying a `step` field is drawn only once `step >= its step`, and what appears exactly now is emphasised (heavier
curve, ringed dot). The frame is computed from the FULL set so the view never jumps. A tool describes the complete <!-- ref -->
graph once as a `GraphBuildSpec` (tagging parts with `step`), stamps each working step with
`graphStep(step, spec, n)` and passes `graphStepVisual` as `stepVisualRenderer` (+ `stepVisualKeepsWorking`).
Steps before the first stamped step render as plain full-width cards (the layout splits when the picture starts).

**Diagram tools (the geometry tools).** The question *is* the diagram, so use the shared `src/shared/diagramSplit.tsx`: `withDiagramSteps(generateQuestion)` stamps each working step with the question's `_diagram`, `diagramStepVisual(questionRenderer)` is the `stepVisualRenderer` (the diagram, answer revealed on the final step), and `diagramSplitQuestion(questionRenderer)` swaps the diagram above for the one-line prompt (`q.display`) in the worked example once the answer is showing (pass `{ promptInDiagram: true }` when the drawing carries its own prompt). Pass `stepVisualKeepsWorking` and create all three wrappers at module level. `withDiagramSteps` also splits a final inline chain (`x = 180° − 146°` · `= 34°`) into the working plus a separate green answer step via `splitAnswerStep` (helpers) — tools with `hideAnswerStep` and fragment-authored last steps should call it too. The picture copy also gets `_step` (the step index): a diagram can reveal values the working has just found (e.g. an angle with `appearsAt: n` is drawn from step n, in green). **Per-step emphasis:** give the question `_stepFocus` (one entry per working step — the tool decides the shape, e.g. angle indices); each step's picture gets its entry as `extras(q)._focus` in the tool's `questionRenderer`, which lights those parts and fades the rest (reference: `AnglesInTriangles`, `focus` prop on `TriangleDiagram`). References: any tool in `src/tools/Geometry/` (not Equations of Lines, which uses `graphStepVisual`).

**`hideAnswerStep` with a split:** a split tool that sets `hideAnswerStep` drops its A line, so only set it when
the last step is itself the answer.

## Core representations — the visual vocabulary

Every taught visual on the site (skill slides, Teach decks, and eventually whiteboard visualisers) is built from **eight core representations**. Consistency is the point: a student who met the bar model in fractions meets the *same* bar in ratio — the representation library is the site's visual scheme of work.

| Representation | Carries | Scene family (TeachingDeck) |
|---|---|---|
| **Bar model** | fractions, ratio, proportion, percentages | `split` · `combine` · `equivalents` |
| **Number line** | integers, rounding, inequalities, sequences, multiples | `multiples` |
| **Area model** | multiplication, expanding brackets, completing the square | *(none yet)* |
| **Algebra tiles** | collecting terms, solving equations, factorising | *(manipulative exists; no scenes yet)* |
| **Negative counters** | directed numbers, integer add/sub, zero pairs | *(shared component + sandbox built; no Teach scenes yet)* |
| **Prime factor tiles** | HCF/LCM, factors, prime decomposition | `factorTree` · `primeVenn` |
| **Place value table** | place value itself — ×/÷ powers of 10, adding/subtracting decimals | *(question/working-step representation; no Teach scene yet)* |
| **Ratio table** | proportional scaling — speed/distance/time, currency conversion, recipe scaling | *(working-step representation; no Teach scene yet)* |

**Representations evolve, and sometimes pair.** The vocabulary is a progression — double number line → ratio table; negative counters → bar model with negatives → number line — so a topic's pictures should be chosen as the *next step* from what the student already knows, not in isolation. A question may also need **two at once** (e.g. a ratio table beside the grapher for gradients). Plan and status: `docs/PROJECTS.md` → "Representation progressions & composites".

**The rule: before authoring any new visual, pick one of these.** A brand-new representation needs a reason. New scenes extend an existing family in `TeachingDeck.tsx` (grouped by family comments in the `TeachScene` union) and follow the standing scene contract: beat count derived from the scene, reserve space for everything (opacity, not mounting), animate only opacity/transform. <!-- R27 -->

**Ratio table** (`src/shared/ratioTable.ts` + `src/shared/components/RatioTable.tsx`) is a *working-step* representation rather than a Teach-deck scene, rendered as **one continuous bordered `<table>`** — matching how a ratio table is conventionally drawn on paper: **quantities as columns** (the header row, e.g. "Miles", "Hours"), **each scale-step as a row going down**, rows sharing borders directly (no gap/divider row between them). The scale factor between two adjacent value-rows sits **outside** the table as a curved arrow (bulging away from the table, mirrored left/right via CSS rather than two authored paths) running from the vertical **centre** of one row to the centre of the next, with the factor labelled beside it — never inside a table cell. That centre-to-centre position is measured in real pixels (refs + `getBoundingClientRect` on each `<tr>`, in a plain — not layout — `useEffect` so it runs after `MathRenderer`'s own child effect has painted the KaTeX content), not CSS percentages: a percentage-height div inside a `<td>` does not reliably resolve against the cell's height in this rendering engine (found to collapse to 0, stacking every arrow at the same spot) — the same measurement approach `WorkedExampleSteps.tsx`'s `FitWidth` already uses elsewhere in this codebase. A single combined scale factor is **never shown as one fraction or decimal multiply** (e.g. `×2/3`) — author it via `rStep(label, headers, rows, operations)` as a chain of whole-number steps instead: `rows` is one array of values per step (`rows[step][quantityIndex]`, not one array per quantity) and `operations` (length `rows.length − 1`) is the whole-number `×n`/`÷n` between each consecutive step, so a fractional factor becomes an extra "unit" row in between (e.g. `100, 75` →(÷5)→ `20, 15` →(×4)→ `80, 60`, never a single `×4/5`). Pass the shared `ratioTableStepRenderer` as the tool's `stepRenderer` — it returns `null` for every non-ratio-table step, so `mStep`/`tStep`/`step` still render through ToolShell's normal path. There is no fragment-level reveal inside a single ratio table — a multi-step scale is just more rows/operations in one call. Reference implementation: `src/tools/Proportion/SpeedDistanceTime.tsx` (`buildScaleSteps` decomposes ÷qq then ×pp, or the reverse, only when both factors are non-trivial — i.e. only at Level 3; Levels 1–2 already have one factor equal to 1, so the chain collapses back to a single step). <!-- R28 -->

**Place value table** (`src/shared/placeValue.ts` + `src/shared/components/PlaceValueTable.tsx`, extracted from Powers of 10) is a fixed set of columns (e.g. `PV_COLS_DECIMAL` = H T O · t h th) with the decimal point drawn on the right edge of the Ones column, so digits in one column always share a place value. Data is `PlaceValueTableData` (columns, `onesIndex`, rows of cells / banners); `pvCells(numStr, columns, onesIndex)` places a decimal string into columns. Cells can carry a tone (`zero` = blue placeholder zero, `answer`), a struck digit, and a small `above` digit (a carry, or the new value after an exchange); `highlightCol` tints the current column; when rows carry operator labels (+ / − / =) the gutter is mirrored on the right so the table body itself is centred; optional `colWidth` (px) fixes the column width so a table with fewer columns is narrower rather than stretched. `PlaceValueSvg` (+ `pvSvgAspect(data, hasTitle, rowH?)` for the question's `_aspect`, `pvSvgRowHForAspect` to stretch rows to a wanted aspect, `fill` for print) draws the same data as an SVG for worksheet cells — tag it `idx` (question) and a hidden `answerIdx` twin and print with `handleDiagramPrint`. For worked examples author steps with `pvStep(caption, table)` (one table snapshot per step) and pass `placeValueStepRenderer` as `stepRenderer` and `placeValueStepVisual` as `stepVisualRenderer` (each returns `null` for any other step) — the cascade then shows one table updating in place beside the step captions instead of reprinting it per step. References: `src/tools/Number/PowersOfTen.tsx` (grid), `src/tools/Number/DecimalAddSub.tsx` (stepped carries/exchanges). Build column sets with `pvColumnSet(whole, dec)` (one canonical letters + words catalogue), offer `PV_WORD_HEADERS_VAR` so teachers can switch headings between letters and words (read live from `qo` — `pvDisplay(table, qo)` for scaffolds, `placeValueStepRenderer` does it for steps), use `PV_CELL_H` so the table never resizes between states, and `pvSlice` to show only the columns a question range needs. Cells can also carry `circle` (ring the deciding digit) and `badge` (filled value, e.g. a rank); non-place columns (Sign, Order) are just extra entries in `columns`. Reference for a comparison table: `src/tools/Number/ComparingOrderingNumbers.tsx`. <!-- R29 -->

**Negative counters** (`src/shared/counters.ts` + `src/shared/components/Counters.tsx`): a **yellow counter is +1, a red counter is −1** (the same yellow and red as the algebra tiles' unit and negative tiles, `COUNTER_POS`/`COUNTER_NEG`), and one of each is a **zero pair**. Every counter is labelled **+1 / −1** so colour is never the only cue. Data is `CounterBoardData` (`rows` of `Counter {sign, state}`; `state` = `normal` · `paired` (part of a boxed zero pair) · `removed` (ghosted, taken away) · `new`); build with `ctr(pos, neg, state?)` / `zeroPairs(n)`, read with `netValue` / `pairCount`. Render with `CounterBoard` / `CounterDot`. **The representation table ("mat")** — `layout: "mat"`, built with `matBoard(pos, neg, { pairs?, collapsed?, footer? })`: a **+ row above a − row**, split from the labels by a vertical rule and from each other by a horizontal rule, counters aligned in columns so a + over a − is a zero pair (each pair boxed in a rounded blue frame, `PairBox` / `pairBoxStyle`) and what's left over is the answer; `collapsed` ghosts the pairs instead. It keeps everything in place for a class to read and count. For worked examples author steps with `cStep(caption, board)` (one board snapshot per step) and pass `countersStepRenderer` as `stepRenderer` and `countersStepVisual` as `stepVisualRenderer` — one board updating in place beside the captions, exactly like the place value table. The interactive sandbox is `src/tools/Interactive/NegativeCounters.tsx` (a **Free / Table** board switch — Table is the + / − representation table: drag counters into their own row and they snap into columns (dropping onto an occupied cell swaps), so a + over a − is a zero pair; drag from the tray, move / flip / take away, add zero pair, remove zero pairs, tidy, live value; a **"When +1 meets −1" setting** chooses whether a dropped counter *pairs up* with its opposite as a boxed zero pair (a + stacked over a −) or both *collapse* to nothing) — it uses the same `CounterDot`, so the sandbox and the question solutions look identical. The sandbox page deliberately mirrors the Algebra Tiles layout (header + burger menu, narrow panel, dot-grid canvas with floating hotbar, bottom summary bar) — keep the two in step when changing either. The bottom toolbar (Select / Grab / Pen / Eraser / Clear drawings / colours) is the shared `DrawHotbar` in `src/shared/components/BoardTools.tsx` — new sandboxes should reuse it (its `extra` prop adds tool-specific buttons). Next in the progression: signed bar model, then number line (see "Representation progressions" in `docs/PROJECTS.md`). <!-- R30 -->

Prime factor tiles are **coloured squares keyed by the prime** (2 sky, 3 emerald, 5 amber, 7 purple, 11 pink — `tileColor` in TeachingDeck), so the same prime looks the same in a factor tree, a Venn region, and a factor list. Composites stay plain numbers; only primes become tiles.

---

## Diagram tools — custom renderers and SVG printing

For SVG-based tools (angle geometry, number lines, etc.).

**Reference implementations:** `src/tools/Geometry/AnglesInQuadrilaterals.tsx` (the print pattern below), `src/tools/Geometry/AnglesInParallelLines.tsx` (a diagram tool that prints the reasoning behind each answer, `_printAnswer`) and `src/tools/Geometry/BasicAngleFacts.tsx`. All diagram tools print through the shared `handleDiagramPrint`; the one hand-rolled print handler left is Recipes' (see `docs/TIDY_UP.md`), whose "Needed / You Have" tables are not pictures.

### Storing diagram data

```ts
return {
  kind: "simple",
  display: "find x",
  answer: `x = ${xVal}°`,
  working: [...],
  key: `tool-level-${id}`,
  difficulty: level,
  _diagram: diagramData,
} as unknown as AnyQuestion;
// Retrieve: const d = extras(q)._diagram as DiagramData | undefined;
```

### `questionRenderer` — compact context table

| `compact` value | Context | Typical maxWidth |
|---|---|---|
| `true` | Worksheet cell | ~180px |
| `undefined` | Regular whiteboard panel (480px fixed) | ~340px |
| `false` | Worked example or fullscreen whiteboard | ~500px |

```tsx
const questionRenderer = (q, showAnswer, compact, idx, _qo) => {
  const d = extras(q)._diagram as DiagramData | undefined;
  if (!d) return null;
  const maxW = compact === true ? 180 : compact === undefined ? 340 : 500;
  return (
    <div style={{ width: "100%", maxWidth: maxW, margin: "0 auto" }}>
      <MySVGDiagram d={d} showAnswer={showAnswer} qIndex={idx} />
    </div>
  );
};
```

### SVG element requirements

```tsx
<svg
  viewBox="0 0 500 500"
  style={{ display: "block", width: "100%", height: "auto" }}
  preserveAspectRatio="xMidYMid meet"
  {...(qIndex !== undefined ? { "data-q-index": qIndex } : {})}
>
```

- Never use a fixed pixel height — causes overflow in the whiteboard panel <!-- R31 -->
- `data-q-index` is required for the print handler to locate the SVG in the DOM

### Printing SVG worksheets — use the shared `handleDiagramPrint`

**Do not hand-write a `customPrintHandler` with a fixed grid.** Pass the shared <!-- R31 -->
`handleDiagramPrint` (exported from `"../../shared"`) straight to ToolShell:

```ts
import { ToolShell, handleDiagramPrint } from "../../shared";

<ToolShell
  questionRenderer={questionRenderer}
  customPrintHandler={handleDiagramPrint}
  defaults={{ numColumns: 3, maxColumns: 4, hideFontControls: true }}
/>
```

How it works: a diagram has no measured height — only an aspect ratio — so
`handleDiagramPrint` *derives* a synthetic cell height from the column width and
feeds it to the same unit-tested `computeWorksheetLayout` engine the text path
uses. The fed height is capped at a **density floor** (~40 mm) so a page packs
~5 rows rather than a few oversized squares; at
render time each cell is grown back toward the full column width, but never past <!-- ref -->
it, so few-question sheets still get big diagrams without floating in whitespace.
Everything is computed app-side and written as static HTML — no probe, no
measurement round-trip.

This means SVG worksheets get, for free and with no per-tool code:
- **Variable columns = density/size** — more columns → more per row (denser),
  fewer columns → wider cells and bigger diagrams. Expose it by *not* setting
  `fixedColumns` (use `maxColumns` to cap, default columns via `numColumns`).
- **Sections** (advanced worksheets) — per-section columns, headers, dividers.
- **Differentiated** three-column layout and **arbitrary question counts** that
  flow across pages.

There is no fixed question preset, but the density holds: 15 questions in 3
columns fit one page, while pages with only a few diagrams render them larger.

**Requirements on the tool:** the worksheet `questionRenderer` must emit an <!-- R31 -->
`<svg data-q-index={idx}>` (see SVG element requirements above) so the handler can
clone it. For non-square diagrams, store `_aspect` (= viewBoxWidth ÷ viewBoxHeight)
on the question; it defaults to 1. A question may also carry `_printAnswer` (one line per `\n`) when the printed answer should say more than `answer`: it replaces `answer` in the answer cells.

**Reference:** `src/tools/Geometry/AnglesInQuadrilaterals.tsx`.

---
