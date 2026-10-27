// Perimeter & Area — Counting on a Grid. A shape on squared paper; the student counts squares and unit lengths.
import { mStep, randInt as ri, pickActive, resolveMultiSelectValues } from "../../../shared";
import { areaOf, edgeLengths, gridRows, perimeterOf, sum, type Pt } from "../../../shared/shapes/model";
import { buildRect } from "./rectilinear";
import type { DEdge, DRegion, Drawing } from "../../../shared/shapes/drawing";
import { addFrags, CM, CM2, pickOne, chance, type Beat, type Built } from "./build";
import { ASK, SCALE } from "./pools";

const rectangle = (w: number, h: number): Pt[][] => [[[0, 0], [w, 0], [w, h], [0, h]]];

export function genGrid(level: "level1" | "level2" | "level3", msv: Record<string, boolean>): Built {
  const pools = level === "level3" ? [ASK, SCALE] : [ASK];
  const v = resolveMultiSelectValues(pools, msv);
  const ask = pickActive(v, ASK.options) as "perimeter" | "area";
  const s = level === "level3" ? (pickActive(v, SCALE.options) === "five" ? 5 : 2) : 1;

  const polys = level === "level1" || (level === "level3" && chance(0.3))
    ? rectangle(level === "level1" ? ri(2, 8) : ri(5, 9), level === "level1" ? ri(2, 8) : ri(3, 6))
    : buildRect(pickOne(["L", "T", "stairs2", "stairs3"] as const), true);
  const outer = polys[0];
  const lens = edgeLengths(outer);
  const P = perimeterOf(polys), A = areaOf(polys);
  const box = { x0: -1, y0: -1, x1: Math.max(...outer.map((p) => p[0])) + 1, y1: Math.max(...outer.map((p) => p[1])) + 1 };

  const edges: DEdge[] = outer.map((a, i) => ({ a, b: outer[(i + 1) % outer.length], label: "", kind: "plain" }));
  const rows = gridRows(polys);
  const regions: DRegion[] = [];
  const totals: number[] = [];
  rows.forEach((r) => {
    totals.push(sum(r.spans.map(([a, b]) => b - a)));
    r.spans.forEach(([a, b], k) => regions.push({ id: `r${r.y}_${k}`, pts: [[a, r.y], [b, r.y], [b, r.y + 1], [a, r.y + 1]], color: r.y % 2 ? "#bbf7d0" : "#bfdbfe", text: String(b - a) }));
  });
  const rowIds = regions.map((r) => r.id);

  const beats: Beat[] = [];
  const value = ask === "perimeter" ? P : A;
  if (ask === "perimeter") {
    beats.push({ step: mStep("Count the squares along each side:", lens.join(",\\ ")), focus: { edges: edges.map((_, i) => i) } });
    beats.push({ step: mStep(s === 1 ? "Add them up:" : "Add them up (in squares):", addFrags(lens, P), s === 1 ? CM : undefined), focus: { edges: edges.map((_, i) => i) } });
    if (s > 1) beats.push({ step: mStep(`One square is ${s} cm, so multiply by ${s}:`, [`${P} \\times ${s}`, `= ${P * s}`], CM) });
  } else {
    beats.push({ step: mStep("Count the squares in each row:", totals.join(",\\ ")), focus: { regions: rowIds } });
    beats.push({ step: mStep(s === 1 ? "Add the rows:" : "Add the rows (in squares):", addFrags(totals, A), s === 1 ? CM2 : undefined), focus: { regions: rowIds } });
    if (s > 1) beats.push({ step: mStep(`One square has area ${s} × ${s} = ${s * s} cm², so multiply by ${s * s}:`, [`${A} \\times ${s * s}`, `= ${A * s * s}`], CM2) });
  }
  const final = s === 1 ? value : value * (ask === "perimeter" ? s : s * s);
  const unit = ask === "perimeter" ? CM : CM2;
  const drawing: Drawing = {
    polys, edges, helpers: [], corners: [], regions, grid: box,
    caption: [`Each square is ${s} cm by ${s} cm.`, `Find the ${ask}.`],
    answerLine: `${ask === "perimeter" ? "Perimeter" : "Area"} = ${final} ${unit}`,
  };
  return { tool: "grid", level, key: `grid-${level}-${JSON.stringify(outer)}-${ask}-${s}`, drawing, answer: String(final), suffix: unit, beats };
}
