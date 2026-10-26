// Perimeter & Area — what a picture is made of. Generators return a Drawing (plain data); one renderer draws it, in every mode,
// at worksheet size or whiteboard size, and lights the parts a working step is about.
import type { Box, Pt } from "./model";

/** One boundary segment. `plain` edges show their `label` (an empty label shows none); `missing` and `find` edges show "?" until
 *  the working has found them, then their `value`. */
export interface DEdge { a: Pt; b: Pt; label: string; kind: "plain" | "missing" | "find"; value?: string; ticks?: number }
/** A dashed line that is not part of the outline: a perpendicular height, a split, the rectangle round a shape. */
export interface DHelper { id: string; a: Pt; b: Pt; label?: string; kind: "height" | "split" | "box" | "extend"; find?: boolean; value?: string; always?: boolean }
/** A coloured area, drawn when it is `always` shown or when a step has it in focus. */
export interface DRegion { id: string; pts: Pt[]; color: string; text?: string; always?: boolean }

export interface Drawing {
  polys: Pt[][];
  edges: DEdge[];
  helpers: DHelper[];
  corners: [Pt, Pt, Pt][];          // right-angle marks, the corner in the middle
  regions: DRegion[];
  grid?: Box;                       // squared paper behind the shape
  caption: string[];                // the prompt, drawn inside the picture so print and every mode say it
  answerLine: string;               // "Perimeter = 34 cm", shown on the whiteboard when the answer is revealed
}

/** What one working step is about. Anything not listed fades. */
export interface Focus {
  edges?: number[];
  helpers?: string[];
  regions?: string[];
  reveal?: number[];                // edges whose value this step has just found
  revealHelpers?: string[];
}

/** Flip a drawing left to right (a standard shape faces either way). */
export const mirrorDrawing = (d: Drawing): Drawing => {
  const f = (p: Pt): Pt => [-p[0], p[1]];
  return {
    ...d,
    polys: d.polys.map((p) => p.map(f)),
    edges: d.edges.map((e) => ({ ...e, a: f(e.a), b: f(e.b) })),
    helpers: d.helpers.map((h) => ({ ...h, a: f(h.a), b: f(h.b) })),
    corners: d.corners.map((c) => c.map(f) as [Pt, Pt, Pt]),
    regions: d.regions.map((r) => ({ ...r, pts: r.pts.map(f) })),
    grid: d.grid ? { x0: -d.grid.x1, x1: -d.grid.x0, y0: d.grid.y0, y1: d.grid.y1 } : undefined,
  };
};
