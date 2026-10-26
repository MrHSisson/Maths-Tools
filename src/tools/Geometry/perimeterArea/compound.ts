// Perimeter & Area — Compound Shapes: shapes made of rectangles. Missing sides are found from the opposite sides (and the working says
// so, lighting the edges involved); area is found by splitting the shape or by taking pieces away from the rectangle round it.
import { mStep, randInt as ri, pickActive, resolveMultiSelectValues, type DifficultyLevel } from "../../../shared";
import { areaOf, boxOf, cutRects, edgeLengths, OPPOSITE, perimeterOf, rectArea, sideOf, splitRects, sum, type Pt, type Rect } from "../../../shared/shapes/model";
import { buildRect, CONVEX, type RectKind } from "./rectilinear";
import type { DEdge, DHelper, DRegion, Drawing, Focus } from "../../../shared/shapes/drawing";
import { addFrags, CM, CM2, pickOne, showLength, type Beat, type Built } from "./build";
import { AREA_METHOD, ASK, PERIMETER_METHOD, SIDES_1, SIDES_2, SIDES_3, UNITS } from "./pools";

const COLORS = ["#bfdbfe", "#bbf7d0", "#fde68a", "#fbcfe8", "#ddd6fe"];
const LETTERS = ["A", "B", "C", "D", "E", "F"];
const rect = (r: Rect): Pt[] => [[r.x0, r.y0], [r.x1, r.y0], [r.x1, r.y1], [r.x0, r.y1]];
const range = (n: number, from = 0) => Array.from({ length: n }, (_, i) => i + from);

/** One side that is not labelled. `sum`: it follows from adding or taking away other sides (only used for a "?" side). `twin`: it is
 *  the same length as a labelled side that is opposite it or next to it, so no sum is needed . */
interface Hide { i: number; how: "sum" | "twin"; twin?: number }

/** Sides that may be "?": found from the opposite sides by adding or taking away, and not the same length as any other side
 *  (else a student could just copy it). */
function missingCandidates(polys: Pt[][]): { horiz: Hide[]; vert: Hide[] } {
  const lens = polys.map(edgeLengths), flatLens = lens.flat();
  const outer = polys[0], n = outer.length;
  const horiz: Hide[] = [], vert: Hide[] = [];
  if (polys.length > 1) return { horiz, vert };
  for (let i = 0; i < n; i++) {
    const side = sideOf(outer[i], outer[(i + 1) % n]);
    const around = Array.from({ length: n }, (_, j) => j).filter((j) => j !== i);
    const same = around.filter((j) => sideOf(outer[j], outer[(j + 1) % n]) === side).length;
    const opp = around.filter((j) => sideOf(outer[j], outer[(j + 1) % n]) === OPPOSITE[side]).length;
    const copy = flatLens.some((l, j) => j !== i && l === lens[0][i]);
    if (same + opp >= 2 && !copy) (outer[i][1] === outer[(i + 1) % n][1] ? horiz : vert).push({ i, how: "sum" });
  }
  return { horiz, vert };
}

/** Condensed: two sides are twins when they are parallel, the same length, and a student can see they are equal. That is when they
 *  are opposite each other (the same stretch of the shape, like the two inner legs of an n-shape or the two outer sides), or when they are
 *  two treads (or risers) of one staircase, one step apart. The top and bottom of a notch are not twins, however equal they happen to be.
 *  Each side left out is directly opposite, or next to, one that stays labelled, so nothing needs working out and nothing is ticked. */
function twinHides(polys: Pt[][]): Hide[] {
  const offsets = polys.map((_, k) => polys.slice(0, k).reduce((a, q) => a + q.length, 0));
  const flatEdges = polys.flatMap((p, pi) => p.map((a, k) => ({ a, b: p[(k + 1) % p.length], pi, k, n: p.length })));
  type E = (typeof flatEdges)[number];
  const at = (e: E, d: number) => flatEdges[offsets[e.pi] + ((e.k + d + e.n) % e.n)];
  const horizontal = (e: E) => e.a[1] === e.b[1];
  const dir = (e: E) => `${Math.sign(e.b[0] - e.a[0])},${Math.sign(e.b[1] - e.a[1])}`;
  const span = (e: E) => (horizontal(e) ? [Math.min(e.a[0], e.b[0]), Math.max(e.a[0], e.b[0])] : [Math.min(e.a[1], e.b[1]), Math.max(e.a[1], e.b[1])]);
  const linked = flatEdges.map(() => new Set<number>());
  flatEdges.forEach((e, i) => flatEdges.forEach((f, j) => {
    if (j <= i || e.pi !== f.pi || horizontal(e) !== horizontal(f)) return;
    const [e0, e1] = span(e), [f0, f1] = span(f);
    if (e1 - e0 !== f1 - f0) return;
    const opposite = e0 === f0 && e1 === f1;
    // a staircase: the little edge between them carries on in the same direction either before the first or after the second
    const [first, second] = (e.k + 2) % e.n === f.k ? [e, f] : (f.k + 2) % e.n === e.k ? [f, e] : [undefined, undefined];
    const step = !!first && !!second && (dir(at(first, 1)) === dir(at(first, -1)) || dir(at(first, 1)) === dir(at(second, 1)));
    if (opposite || step) { linked[i].add(j); linked[j].add(i); }
  }));
  // components of twins: label one side, leave out those directly linked to it
  const seen = new Set<number>(), hides: Hide[] = [];
  flatEdges.forEach((_, i) => {
    if (seen.has(i) || !linked[i].size) return;
    const comp = [i];
    for (let c = 0; c < comp.length; c++) linked[comp[c]].forEach((j) => { if (!comp.includes(j)) comp.push(j); });
    comp.forEach((x) => seen.add(x));
    const keep = pickOne(comp);
    linked[keep].forEach((j) => hides.push({ i: j, how: "twin", twin: keep }));
  });
  return hides;
}

export function genCompound(level: DifficultyLevel, msv: Record<string, boolean>, vars: Record<string, boolean>): Built {
  const pools = level === "level3" ? [ASK, SIDES_3, UNITS] : [ASK, level === "level1" ? SIDES_1 : SIDES_2, PERIMETER_METHOD, AREA_METHOD];
  const v = resolveMultiSelectValues(pools, msv);
  const ask = pickActive(v, ASK.options) as "perimeter" | "area";
  const mixed = level === "level3" && !!v.mixed;
  const showSplit = vars.showSplit ?? level === "level1";
  const mode: "missing" | "condensed" | null = v.missing ? "missing" : v.condensed ? "condensed" : null;

  // pick a shape (and the sides to leave out) so that every side we leave out really is a sum or difference of others, never a copy
  let kind: RectKind = "L", polys: Pt[][] = [], hidden: Hide[] = [];
  for (let attempt = 0; attempt < 400; attempt++) {
    kind = attempt > 80 ? (mode === "condensed" ? "T" : "L") : level === "level1" ? pickOne(["L", "T", "stairs2", "stairs3"]) : level === "level2" ? pickOne(["L", "T", "stairs2", "stairs3", "cross"]) : pickOne(["U", "U", "comb", "frame", "frame"]);
    const base = buildRect(kind);
    polys = mixed ? base.map((p) => p.map(([x, y]) => [x * 10, y * 10] as Pt)) : base;
    hidden = [];
    if (!mode || (mode === "missing" && polys.length > 1)) break;          // nothing to leave out (a hole's sides are never "?")
    if (mode === "condensed") {
      hidden = twinHides(polys);
    } else {
      const c = missingCandidates(polys);
      const count = level === "level2" ? ri(1, 2) : 1;
      const lists = [c.horiz, c.vert].filter((x) => x.length);
      if (lists.length) {
        const first = pickOne(lists[Math.floor(Math.random() * lists.length)]);
        hidden.push(first);
        const other = c.horiz.includes(first) ? c.vert : c.horiz;
        if (count === 2 && other.length) hidden.push(pickOne(other));
      }
    }
    if (hidden.length) break;
  }
  const outer = polys[0];
  const holes = polys.slice(1);
  const hasHole = holes.length > 0;
  const lens = polys.map(edgeLengths);
  const flat: { a: Pt; b: Pt; len: number; poly: number }[] = polys.flatMap((p, pi) => p.map((a, k) => ({ a, b: p[(k + 1) % p.length], len: lens[pi][k], poly: pi })));
  const nOuter = outer.length;
  const P = perimeterOf(polys), A = areaOf(polys), box = boxOf([outer]);
  const W = box.x1 - box.x0, H = box.y1 - box.y0;
  const hideKind = mode === "condensed" ? "hidden" : "missing";
  const hiddenIdx = hidden.map((h) => h.i);

  // labels: every side shows its length, except the ones left out
  const convs: { cm: number; conv: string }[] = [];
  const edges: DEdge[] = flat.map((e, i) => {
    if (hiddenIdx.includes(i)) return { a: e.a, b: e.b, label: "", kind: hideKind, value: `${e.len} cm` };
    const s = showLength(e.len, mixed);
    if (s.conv) convs.push({ cm: e.len, conv: s.conv });
    return { a: e.a, b: e.b, label: s.text, kind: "plain" };
  });
  const allEdges = range(flat.length);
  const outerEdges = range(nOuter), holeEdges = range(flat.length - nOuter, nOuter);

  const beats: Beat[] = [];
  if (convs.length) beats.push({ step: mStep("Write every length in cm:", convs.map((c, i) => (i ? `,\\ ${c.conv}` : c.conv))) });

  // find each side that was left out
  for (const h of hidden) {
    const i = h.i;
    if (h.how === "twin") {
      beats.push({
        step: mStep("Equal sides are the same length:", [`${flat[h.twin!].len}`], CM),
        focus: { edges: [i, h.twin!], reveal: [i] },
      });
      continue;
    }
    const side = sideOf(outer[i], outer[(i + 1) % nOuter]);
    const same = outerEdges.filter((j) => j !== i && sideOf(outer[j], outer[(j + 1) % nOuter]) === side);
    const opp = outerEdges.filter((j) => sideOf(outer[j], outer[(j + 1) % nOuter]) === OPPOSITE[side]);
    const sameL = same.map((j) => flat[j].len), oppL = opp.map((j) => flat[j].len);
    const oppExpr = oppL.length > 1 ? `(${oppL.join(" + ")})` : `${oppL[0]}`;
    beats.push({
      step: mStep(`The sides along the ${side} add up to the same as the sides along the ${OPPOSITE[side]}:`, [`${[...sameL, "?"].join(" + ")}`, `= ${oppL.join(" + ")}`]),
      focus: { edges: [i, ...same, ...opp] },
    });
    beats.push({
      step: mStep("So the missing side is:", [`${oppExpr}${sameL.map((l) => ` - ${l}`).join("")}`, `= ${flat[i].len}`], CM),
      focus: { edges: [i, ...same, ...opp], reveal: [i] },
    });
  }
  const everything: Focus = { edges: allEdges };

  const helpers: DHelper[] = [];
  const regions: DRegion[] = [];
  if (ask === "perimeter") {
    const bounding = !!v.boundingRectangle && level !== "level3" && CONVEX.includes(kind);
    if (hasHole) {
      const hb = boxOf([holes[0]]), hw = hb.x1 - hb.x0, hh = hb.y1 - hb.y0;
      beats.push({ step: mStep("The outside edge:", [`2 \\times (${W} + ${H})`, `= ${2 * (W + H)}`]), focus: { edges: outerEdges } });
      beats.push({ step: mStep("The inside edge counts too:", [`2 \\times (${hw} + ${hh})`, `= ${2 * (hw + hh)}`]), focus: { edges: holeEdges } });
      beats.push({ step: mStep("Add them:", [`${2 * (W + H)} + ${2 * (hw + hh)}`, `= ${P}`], CM), focus: everything });
    } else if (bounding) {
      const corners: Pt[] = [[box.x0, box.y0], [box.x1, box.y0], [box.x1, box.y1], [box.x0, box.y1]];
      corners.forEach((c, k) => helpers.push({ id: `box${k}`, a: c, b: corners[(k + 1) % 4], kind: "box" }));
      beats.push({
        step: mStep("This shape has no notch, so its perimeter is the same as the rectangle round it, 2 × (width + height):", [`2 \\times (${W} + ${H})`, `= 2 \\times ${W + H}`, `= ${P}`], CM),
        focus: { edges: allEdges, helpers: range(4).map((k) => `box${k}`) },
      });
    } else {
      beats.push({ step: mStep("Add every side:", addFrags(flat.map((e) => e.len), P), CM), focus: everything });
    }
  } else if (hasHole || level === "level3" || !!v.subtract) {
    const cuts = hasHole ? [boxOf([holes[0]])] : cutRects(polys);
    regions.push({ id: "outer", pts: rect({ x0: box.x0, y0: box.y0, x1: box.x1, y1: box.y1 }), color: "#e2e8f0" });
    cuts.forEach((r, k) => regions.push({ id: `c${k}`, pts: rect(r), color: "#fde68a", text: "", always: showSplit }));
    const cutAreas = cuts.map(rectArea), cutTotal = sum(cutAreas);
    const cutIds = cuts.map((_, k) => `c${k}`);
    beats.push({ step: mStep("The rectangle round the whole shape:", [`${W} \\times ${H}`, `= ${W * H}`]), focus: { regions: ["outer"] } });
    beats.push({
      step: mStep(hasHole ? "The hole:" : "The parts that are missing:", [...cuts.map((r, k) => `${k ? "+ " : ""}${r.x1 - r.x0} \\times ${r.y1 - r.y0}`), ...(cuts.length > 1 ? [`= ${cutTotal}`] : [`= ${cutTotal}`])]),
      focus: { regions: cutIds },
    });
    beats.push({ step: mStep("Take them away:", [`${W * H} - ${cutTotal}`, `= ${A}`], CM2), focus: { regions: ["outer", ...cutIds] } });
  } else {
    const rects = splitRects(polys), areas = rects.map(rectArea);
    rects.forEach((r, k) => regions.push({ id: `s${k}`, pts: rect(r), color: COLORS[k % COLORS.length], text: LETTERS[k], always: showSplit }));
    const ids = rects.map((_, k) => `s${k}`);
    beats.push({
      step: mStep("Split it into rectangles and find each area:", rects.map((r, k) => `${k ? ",\\ " : ""}${LETTERS[k]} = ${r.x1 - r.x0} \\times ${r.y1 - r.y0} = ${areas[k]}`)),
      focus: { regions: ids },
    });
    beats.push({ step: mStep("Add the areas:", addFrags(areas, A), CM2), focus: { regions: ids } });
  }

  const value = ask === "perimeter" ? P : A, unit = ask === "perimeter" ? CM : CM2;
  const drawing: Drawing = {
    polys, edges, helpers, corners: [], regions,
    caption: [...(mixed ? ["Give your answer in cm."] : []), `Find the ${ask}.`],
    answerLine: `${ask === "perimeter" ? "Perimeter" : "Area"} = ${value} ${unit}`,
  };
  return { tool: "compound", level, key: `compound-${level}-${JSON.stringify(polys)}-${ask}-${hiddenIdx.join(",")}-${hideKind}-${mixed ? "m" : "s"}`, drawing, answer: String(value), suffix: unit, beats };
}
