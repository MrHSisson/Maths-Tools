import { aspectOf } from "../shared/shapes/Diagram";
import { extras } from "../shared/questionExtras";
import type { Drawing, Focus } from "../shared/shapes/drawing";
import { isRectilinearSpec, rectilinearPolygons, type RectilinearSpec } from "../../api/_rectilinear";
import { buildCompound, chosenMissingSide } from "../tools/Geometry/perimeterArea/compound";
import { toQuestion } from "../tools/Geometry/perimeterArea/build";
import { boxOf, orient, type Pt } from "../shared/shapes/model";
import { replaySeeded } from "../shared/seededGenerate";
import type { AnyQuestion } from "../shared";
import type { CuratedQuestion } from "./types";
import { fromWorked } from "./questions";

/** Chosen dimensions go through the same geometry, labelling and worked solution as the live tool. */
export function rectilinearQuestion(spec: RectilinearSpec): AnyQuestion {
  if (!isRectilinearSpec(spec)) throw new Error("The cut-out must fit inside the shape; use positive whole-number lengths.");
  const { shape } = spec;
  const outlines = rectilinearPolygons(spec);
  const polyArea = (poly: Pt[]) => Math.abs(poly.reduce((t, p, i) => t + p[0] * poly[(i + 1) % poly.length][1] - poly[(i + 1) % poly.length][0] * p[1], 0)) / 2;
  const expected = outlines.slice(1).reduce((t, hole) => t - polyArea(hole), polyArea(outlines[0]));
  const rotated: Pt[][] = outlines.map(outline => outline.map(([x0, y0]) => {
    let x = spec.orientation >= 4 ? -x0 : x0, y = y0;
    for (let turn = 0; turn < spec.orientation % 4; turn++) [x, y] = [-y, x];
    return [x, y];
  }));
  const bounds = boxOf(rotated);
  const polys = orient(rotated.map(poly => poly.map(([x, y]) => [x - bounds.x0, y - bounds.y0] as Pt)));
  const q = replaySeeded({ _seed: 1 } as unknown as AnyQuestion, () => toQuestion(buildCompound(polys, {
    kind: shape === "I" ? "cross" : shape, level: "level1", ask: "area", mixed: false, showSplit: spec.scaffold !== "none", reduced: spec.reducedLabels, missing: spec.missingLength ? [chosenMissingSide(polys, spec.missingLength)] : [], subtract: spec.method === "subtract",
  })));
  if (!q) throw new Error("The rectilinear question could not be built.");
  if (Number(q.answer) !== expected) throw new Error("The shape's area does not match its dimensions.");
  // On supplied splits, label component dimensions that have no directly aligned boundary label.
  // This keeps the scaffold about area, rather than an unannounced missing-length calculation.
  const drawing = extras(q)._diagram as Drawing;
  if (spec.missingLength) { drawing.caption = ["Find the missing length, then the area."]; if (q.kind === "worded") q.lines = drawing.caption; else q.display = drawing.caption[0]; }
  const focuses = extras(q)._stepFocus as (Focus | undefined)[];
  const added = new Set<string>();
  for (const region of (spec.missingLength ? [] : drawing.regions).filter(r => r.id !== "outer")) {
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
  // Boundary arrows use only the outline edges. Component dimensions remain in the worked
  // solution; they never replace an edge label or add an overall dimension frame.
  if(spec.method === "subtract" && spec.scaffold !== "none")drawing.regions.forEach(r=>r.always=true);
  if(spec.task === "partition") {
    drawing.caption=["Split this shape into rectangles."];
    if(q.kind === "worded")q.lines=[...drawing.caption];else q.display=drawing.caption[0];
    drawing.regions.forEach(r=>r.always=spec.scaffold !== "none" && r.id.startsWith("s"));drawing.helpers.forEach(h=>h.always=false);
    q.working=[{plain:"One valid rectangle partition is shown.",type:"mStep",label:"One valid partition:",latex:"\\text{Rectangles cover the shape exactly once}"}];
    focuses.splice(0,focuses.length,{regions:drawing.regions.filter(r=>r.id.startsWith("s")).map(r=>r.id)});
  }
  if (spec.insideLengths) {
    // At a 270° corner the two lengths that meet there sit side by side in the same notch. Draw ONE of the pair inside the
    // shape (the longer side, which has the room; the horizontal one if they tie) and leave every other length outside.
    const poly = drawing.polys[0], n = poly.length;
    const sign = Math.sign(poly.reduce((t, p, i) => t + p[0] * poly[(i + 1) % n][1] - poly[(i + 1) % n][0] * p[1], 0));
    const edgeOf = (a: Pt, b: Pt) => drawing.edges.find(e => e.kind === "plain" && !!e.label && ((e.a[0] === a[0] && e.a[1] === a[1] && e.b[0] === b[0] && e.b[1] === b[1]) || (e.a[0] === b[0] && e.a[1] === b[1] && e.b[0] === a[0] && e.b[1] === a[1])));
    const length = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let i = 0; i < n; i++) {
      const prev = poly[(i + n - 1) % n], v = poly[i], next = poly[(i + 1) % n];
      const cross = (v[0] - prev[0]) * (next[1] - v[1]) - (v[1] - prev[1]) * (next[0] - v[0]);
      if (cross * sign >= 0) continue;                                   // a 90° corner, not a 270° one
      const before = edgeOf(prev, v), after = edgeOf(v, next);
      if (!before || !after || before.inside || after.inside) continue;  // a side with no label does not crowd its neighbour
      const lb = length(prev, v), la = length(v, next);
      (lb > la || (lb === la && prev[1] === v[1]) ? before : after).inside = true;
    }
  }
  extras(q)._aspect = aspectOf(drawing);
  return q;
}
export function authoredRectilinear(id: string, spec: RectilinearSpec, previous?: CuratedQuestion): CuratedQuestion {
  const q = fromWorked(rectilinearQuestion(spec), { id, tool: "perimeter-and-area", level: "level1" });
  return { ...previous, ...q, rationale: previous?.rationale ?? "", expectedErrors: previous?.expectedErrors ?? [], followUp: previous?.followUp ?? "", purpose: previous?.purpose ?? "practice", answer: spec.task === "partition" ? ["One valid rectangle partition; other valid partitions are accepted."] : q.answer.map(line => `${line} cm²`), title: previous?.title || "Rectilinear area", rectilinear: structuredClone(spec) };
}
