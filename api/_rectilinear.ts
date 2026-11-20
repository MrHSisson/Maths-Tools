// Portable dimensions for authored rectilinear questions; browser and API share validation.
export interface RectilinearSpec {
  version: 1;
  task?: "partition" | "area";
  shape: "L" | "T" | "stairs3" | "stairs4" | "cross" | "I" | "U" | "N" | "comb" | "frame";
  width: number; height: number; cutWidth: number; cutHeight: number;
  method: "split" | "subtract";
  orientation: number;
  reducedLabels: boolean;
  /** Optional later-lesson stage; omitted on older questions. Available when the outline has a distinct sum/difference length. */
  missingLength?: "addition" | "subtraction";
  /** Full prompts, the split only, or independent work. Applies to the printed sheet. */
  scaffold: "full" | "split" | "none";
  /** Draw the lengths of the notch edges (the steps of a staircase, the corners of a cross) inside the shape. */
  insideLengths?: boolean;
  /** Staircases only: the width each step goes in by, and the height of each step but the last, so the steps need not all match (stairs3 takes two of each, stairs4 three). Omitted: every step is `cutWidth` by `cutHeight`. */
  stepWidths?: number[]; stepHeights?: number[];
}
const stepsOf = (shape: string) => shape === "stairs4" ? 3 : shape === "stairs3" ? 2 : 0;
export const RECTILINEAR_SHAPES = ["L", "T", "stairs3", "stairs4", "cross", "I", "U", "N", "comb", "frame"];
/** A spec this code does not know how to read yet: a later version, or a shape it has not been taught. (A known shape with bad numbers is not this: it is invalid.) */
export const isNewerRectilinear = (value: unknown): boolean => !!value && typeof value === "object" && !Array.isArray(value) && (typeof (value as { version?: unknown }).version === "number" && (value as { version: number }).version !== 1 || ((value as { version?: unknown }).version === 1 && typeof (value as { shape?: unknown }).shape === "string" && !RECTILINEAR_SHAPES.includes((value as { shape: string }).shape)));
export function isRectilinearSpec(value: unknown): value is RectilinearSpec {
  if (!value || typeof value !== "object") return false;
  const s = value as RectilinearSpec;
  if (s.version !== 1 || !["L", "T", "stairs3", "stairs4", "cross", "I", "U", "N", "comb", "frame"].includes(s.shape) || !["split", "subtract"].includes(s.method)
    || !["full", "split", "none"].includes(s.scaffold) || typeof s.reducedLabels !== "boolean"
    || !Number.isInteger(s.orientation) || s.orientation < 0 || s.orientation > 7) return false;
  if (![s.width, s.height, s.cutWidth, s.cutHeight].every(n => Number.isInteger(n) && n >= 1 && n <= 100)) return false;
  if (s.insideLengths !== undefined && typeof s.insideLengths !== "boolean") return false;
  if (s.task !== undefined && !["partition", "area"].includes(s.task)) return false;
  const { width: w, height: h, cutWidth: a, cutHeight: b, shape } = s;
  const stepped = s.stepWidths !== undefined || s.stepHeights !== undefined;
  if (stepped) {
    const n = stepsOf(shape), ok = (v: unknown) => Array.isArray(v) && v.length === n && v.every(x => Number.isInteger(x) && x >= 1 && x <= 100);
    if (!n || !ok(s.stepWidths) || !ok(s.stepHeights) || s.stepWidths!.reduce((t, x) => t + x, 0) >= w || s.stepHeights!.reduce((t, x) => t + x, 0) >= h) return false;
  }
  const fits = stepped ? true : shape === "frame" ? a <= w - 2 && b <= h - 2
    : (shape === "comb" || shape === "N") ? 2 * a <= w - 3 && b < h
    : (shape === "I" || shape === "cross") ? 2 * a < w && 2 * b < h
    : shape === "U" ? a <= w - 2 && b < h
    : a * (shape === "L" ? 1 : shape === "stairs4" ? 3 : 2) < w && b * (shape === "stairs4" ? 3 : ["stairs3", "cross"].includes(shape) ? 2 : 1) < h;
  if (!fits) return false;
  if (s.missingLength !== undefined) {
    if (!["addition", "subtraction"].includes(s.missingLength) || shape === "frame") return false;
    const poly = rectilinearPolygons(s)[0];
    const edges = poly.map((p, i) => { const q = poly[(i + 1) % poly.length]; return { dx: Math.sign(q[0] - p[0]), dy: Math.sign(q[1] - p[1]), len: Math.abs(q[0] - p[0]) + Math.abs(q[1] - p[1]) }; });
    if (!edges.some((e, i) => {
      if (edges.some((f, j) => i !== j && f.len === e.len)) return false;
      const same = edges.filter((f, j) => j !== i && f.dx === e.dx && f.dy === e.dy).length;
      const opposite = edges.filter(f => f.dx === -e.dx && f.dy === -e.dy).length;
      return same + opposite >= 2 && (s.missingLength === "addition" ? same === 0 : same > 0);
    })) return false;
  }
  return true;
}

/** Whole-number outlines shared by portable validation and the tool-backed authoring path. */
export function rectilinearPolygons(s: RectilinearSpec): [number, number][][] {
  const { width: w, height: h, cutWidth: a, cutHeight: b, shape } = s;
  const o = Math.floor((w - a) / 2), y = Math.floor((h - b) / 2);
  if (shape === "frame") return [[[0,0],[w,0],[w,h],[0,h]], [[o,y],[o,y+b],[o+a,y+b],[o+a,y]]];
  if (shape === "U") return [[[0,0],[w,0],[w,h],[o+a,h],[o+a,h-b],[o,h-b],[o,h],[0,h]]];
  if (shape === "N") {
    const bridge = Math.floor((w - 2*a)/3), left = bridge, right = 2*bridge+a;
    return [[[0,0],[left,0],[left,b],[left+a,b],[left+a,0],[w,0],[w,h],[right+a,h],[right+a,h-b],[right,h-b],[right,h],[0,h]]];
  }
  const sw = s.stepWidths ?? [a, a, a], sh = s.stepHeights ?? [b, b, b];
  if (shape === "stairs4") { const x1 = w - sw[0], x2 = x1 - sw[1], x3 = x2 - sw[2], y1 = sh[0], y2 = y1 + sh[1], y3 = y2 + sh[2]; return [[[0,0],[w,0],[w,y1],[x1,y1],[x1,y2],[x2,y2],[x2,y3],[x3,y3],[x3,h],[0,h]]]; }
  if (shape === "I") return [[[0,0],[w,0],[w,b],[w-a,b],[w-a,h-b],[w,h-b],[w,h],[0,h],[0,h-b],[a,h-b],[a,b],[0,b]]];
  if (shape === "comb") {
    const bridge = Math.floor((w - 2*a)/3), x = bridge, z = 2*bridge+a;
    return [[[0,0],[w,0],[w,h],[z+a,h],[z+a,h-b],[z,h-b],[z,h],[x+a,h],[x+a,h-b],[x,h-b],[x,h],[0,h]]];
  }
  if (shape === "cross") return [[[a,0],[w-a,0],[w-a,b],[w,b],[w,h-b],[w-a,h-b],[w-a,h],[a,h],[a,h-b],[0,h-b],[0,b],[a,b]]];
  if (shape === "L") return [[[0,0],[w,0],[w,h-b],[w-a,h-b],[w-a,h],[0,h]]];
  if (shape === "T") return [[[0,0],[w,0],[w,h-b],[w-a,h-b],[w-a,h],[a,h],[a,h-b],[0,h-b]]];
  { const x1 = w - sw[0], x2 = x1 - sw[1], y1 = sh[0], y2 = y1 + sh[1]; return [[[0,0],[w,0],[w,y1],[x1,y1],[x1,y2],[x2,y2],[x2,h],[0,h]]]; }
}
export const defaultRectilinear = (): RectilinearSpec => ({ version: 1, shape: "L", width: 8, height: 6, cutWidth: 3, cutHeight: 2, method: "split", orientation: 0, reducedLabels: true, scaffold: "full" });
