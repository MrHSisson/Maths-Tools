import { extras } from "../shared/questionExtras";
import type { Drawing, Focus } from "../shared/shapes/drawing";
import { isRectilinearSpec, type RectilinearSpec } from "../../api/_rectilinear";
import { buildCompound } from "../tools/Geometry/perimeterArea/compound";
import { toQuestion } from "../tools/Geometry/perimeterArea/build";
import { boxOf, orient, type Pt } from "../shared/shapes/model";
import { replaySeeded } from "../shared/seededGenerate";
import type { AnyQuestion } from "../shared";
import type { CuratedQuestion } from "./types";
import { fromWorked } from "./questions";

/** Chosen dimensions go through the same geometry, labelling and worked solution as the live tool. */
export function rectilinearQuestion(spec: RectilinearSpec): AnyQuestion {
  if (!isRectilinearSpec(spec)) throw new Error("The cut-out must fit inside the shape; use positive whole-number lengths.");
  const { width: w, height: h, cutWidth: a, cutHeight: b, shape } = spec;
  const outline: Pt[] = shape === "L" ? [[0, 0], [w, 0], [w, h - b], [w - a, h - b], [w - a, h], [0, h]]
    : shape === "T" ? [[0, 0], [w, 0], [w, h - b], [w - a, h - b], [w - a, h], [a, h], [a, h - b], [0, h - b]]
    : [[0, 0], [w, 0], [w, b], [w - a, b], [w - a, 2 * b], [w - 2 * a, 2 * b], [w - 2 * a, h], [0, h]];
  const expected = shape === "L" ? w * h - a * b : shape === "T" ? w * (h - b) + (w - 2 * a) * b
    : w * b + (w - a) * b + (w - 2 * a) * (h - 2 * b);
  const rotated: Pt[] = outline.map(([x0, y0]) => {
    let x = spec.orientation >= 4 ? -x0 : x0, y = y0;
    for (let turn = 0; turn < spec.orientation % 4; turn++) [x, y] = [-y, x];
    return [x, y];
  });
  const bounds = boxOf([rotated]);
  const polys = orient([rotated.map(([x, y]) => [x - bounds.x0, y - bounds.y0] as Pt)]);
  const q = replaySeeded({ _seed: 1 } as unknown as AnyQuestion, () => toQuestion(buildCompound(polys, {
    kind: shape, level: "level1", ask: "area", mixed: false, showSplit: spec.scaffold !== "none", reduced: spec.reducedLabels, subtract: spec.method === "subtract",
  })));
  if (!q) throw new Error("The rectilinear question could not be built.");
  if (Number(q.answer) !== expected) throw new Error("The shape's area does not match its dimensions.");
  // On supplied splits, label component dimensions that have no directly aligned boundary label.
  // This keeps the scaffold about area, rather than an unannounced missing-length calculation.
  const drawing = extras(q)._diagram as Drawing;
  const focuses = extras(q)._stepFocus as (Focus | undefined)[];
  const added = new Set<string>();
  for (const region of drawing.regions.filter(r => r.id !== "outer")) {
    const xs = region.pts.map(p => p[0]), ys = region.pts.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    for (const [axis, a, b] of [[0, [x0, y0], [x1, y0]], [1, [x0, y0], [x0, y1]]] as [number, Pt, Pt][]) {
      const lo = a[axis], hi = b[axis], key = `${axis}:${lo}:${hi}`;
      const implied = drawing.edges.some(e => e.kind === "plain" && (axis === 0 ? e.a[1] === e.b[1] : e.a[0] === e.b[0])
        && Math.min(e.a[axis], e.b[axis]) === lo && Math.max(e.a[axis], e.b[axis]) === hi);
      if (implied || added.has(key)) continue;
      added.add(key);
      const id = `dimension-${region.id}-${axis}`;
      drawing.helpers.push({ id, a, b, kind: "split", label: `${hi - lo} cm`, always: spec.scaffold !== "none" });
      focuses.forEach(f => { if (f?.regions?.includes(region.id)) f.helpers = [...(f.helpers ?? []), id]; });
    }
  }
  return q;
}
export function authoredRectilinear(id: string, spec: RectilinearSpec, previous?: CuratedQuestion): CuratedQuestion {
  const q = fromWorked(rectilinearQuestion(spec), { id, tool: "perimeter-and-area", level: "level1" });
  return { ...previous, ...q, rationale: previous?.rationale ?? "", expectedErrors: previous?.expectedErrors ?? [], followUp: previous?.followUp ?? "", purpose: previous?.purpose ?? "practice", answer: q.answer.map(line => `${line} cm²`), title: previous?.title || "Rectilinear area", rectilinear: structuredClone(spec) };
}
