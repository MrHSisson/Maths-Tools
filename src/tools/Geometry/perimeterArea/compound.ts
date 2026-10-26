// Perimeter & Area — Compound Shapes: shapes made of rectangles. Missing sides are found from the opposite sides (and the working says
// so, lighting the edges involved); area is found by splitting the shape or by taking pieces away from the rectangle round it.
import { mStep, randInt as ri, pickActive, resolveMultiSelectValues, type DifficultyLevel } from "../../../shared";
import { areaOf, boxOf, cutRects, edgeLengths, OPPOSITE, perimeterOf, rectArea, sideOf, splitRects, sum, type Pt, type Rect } from "../../../shared/shapes/model";
import { buildRect, CONVEX, type RectKind } from "./rectilinear";
import type { DEdge, DHelper, DRegion, Drawing, Focus } from "../../../shared/shapes/drawing";
import { addFrags, CM, CM2, pickOne, showLength, type Beat, type Built } from "./build";
import { AREA_METHOD, ASK, PERIMETER_METHOD, SIDES_1, SIDES_2, UNITS } from "./pools";

const COLORS = ["#bfdbfe", "#bbf7d0", "#fde68a", "#fbcfe8", "#ddd6fe"];
const LETTERS = ["A", "B", "C", "D", "E", "F"];
const rect = (r: Rect): Pt[] => [[r.x0, r.y0], [r.x1, r.y0], [r.x1, r.y1], [r.x0, r.y1]];
const range = (n: number, from = 0) => Array.from({ length: n }, (_, i) => i + from);

export function genCompound(level: DifficultyLevel, msv: Record<string, boolean>, vars: Record<string, boolean>): Built {
  const pools = level === "level3" ? [ASK, UNITS] : [ASK, level === "level1" ? SIDES_1 : SIDES_2, PERIMETER_METHOD, AREA_METHOD];
  const v = resolveMultiSelectValues(pools, msv);
  const ask = pickActive(v, ASK.options) as "perimeter" | "area";
  const kind: RectKind = level === "level1" ? pickOne(["L", "T", "stairs2", "stairs3"]) : level === "level2" ? pickOne(["L", "T", "stairs2", "stairs3", "cross"]) : pickOne(["U", "U", "comb", "frame", "frame"]);
  const mixed = level === "level3" && !!v.mixed;
  const showSplit = vars.showSplit ?? level === "level1";

  const base = buildRect(kind);
  const polys: Pt[][] = mixed ? base.map((p) => p.map(([x, y]) => [x * 10, y * 10] as Pt)) : base;
  const outer = polys[0];
  const holes = polys.slice(1);
  const hasHole = holes.length > 0;
  const lens = polys.map(edgeLengths);
  const flat: { a: Pt; b: Pt; len: number; poly: number }[] = polys.flatMap((p, pi) => p.map((a, k) => ({ a, b: p[(k + 1) % p.length], len: lens[pi][k], poly: pi })));
  const nOuter = outer.length;
  const P = perimeterOf(polys), A = areaOf(polys), box = boxOf([outer]);
  const W = box.x1 - box.x0, H = box.y1 - box.y0;

  // which outer edges are missing: at most one across and one up, so each can be found from the others
  const wantMissing = !hasHole && (level === "level3" || !!v.missing);
  const missing: number[] = [];
  if (wantMissing) {
    const horiz = range(nOuter).filter((i) => outer[i][1] === outer[(i + 1) % nOuter][1]), vert = range(nOuter).filter((i) => outer[i][0] === outer[(i + 1) % nOuter][0]);
    const count = level === "level2" ? ri(1, 2) : 1;
    const first = pickOne(Math.random() < 0.5 ? horiz : vert);
    missing.push(first);
    if (count === 2) missing.push(pickOne(horiz.includes(first) ? vert : horiz));
  }

  // labels: every edge shows its length, except a missing one
  const convs: { cm: number; conv: string }[] = [];
  const edges: DEdge[] = flat.map((e, i) => {
    if (missing.includes(i)) return { a: e.a, b: e.b, label: "", kind: "missing", value: `${e.len} cm` };
    const s = showLength(e.len, mixed);
    if (s.conv) convs.push({ cm: e.len, conv: s.conv });
    return { a: e.a, b: e.b, label: s.text, kind: "plain" };
  });
  const allEdges = range(flat.length);
  const outerEdges = range(nOuter), holeEdges = range(flat.length - nOuter, nOuter);

  const beats: Beat[] = [];
  if (convs.length) beats.push({ step: mStep("Write every length in cm:", convs.map((c, i) => (i ? `,\\ ${c.conv}` : c.conv))) });

  // find each missing side from the opposite sides
  for (const i of missing) {
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
  return { tool: "compound", level, key: `compound-${level}-${JSON.stringify(polys)}-${ask}-${missing.join(",")}-${mixed ? "m" : "s"}`, drawing, answer: String(value), suffix: unit, beats };
}
