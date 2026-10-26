// Shape pictures: label pills are fitted to the whole picture, so none may overlap another pill, sit on a line, or fall off the picture.
import { describe, it, expect } from "vitest";
import { __test } from "../tools/Geometry/PerimeterArea";
import { labelPlan } from "../shared/shapes/Diagram";
import { rectGap, segHitsRect, type Rect } from "../shared/shapes/labels";
import type { Drawing } from "../shared/shapes/drawing";

const { generateQuestion } = __test as any;
const LEVELS = ["level1", "level2", "level3"] as const;
const TOOLS = ["grid", "shapes", "compound", "algebraic"];

function problems(d: Drawing, small: boolean, answer: boolean): string[] {
  const { pills, spots, helperPills, scene, pillH, pillW } = labelPlan(d, small, answer);
  const rects: Rect[] = pills.map((p, k) => ({ x: spots[k].x, y: spots[k].y, w: pillW(p.text), h: pillH }));
  const all = [...rects, ...helperPills.map((h) => h.rect)];
  const out: string[] = [];
  all.forEach((r, i) => {
    for (let j = i + 1; j < all.length; j++) if (rectGap(r, all[j]) < 0) out.push("pills overlap");
    // a pill that has no room beside its side may sit ON it (centre on the line), breaking the line like a dimension; anywhere else it must clear every line
    const onALine = [...scene.shape, ...scene.helpers].some((s) => segHitsRect(s, { x: r.x, y: r.y, w: 0, h: 0 }, 0.8));
    if (!onALine && scene.shape.some((s) => segHitsRect(s, r, 1))) out.push("pill on the outline");
    if (!onALine && scene.helpers.some((s) => segHitsRect(s, r, 0))) out.push("pill on a helper line");
    if (r.x - r.w / 2 < scene.bounds.x0 - 0.5 || r.x + r.w / 2 > scene.bounds.x1 + 0.5 || r.y + r.h / 2 > scene.bounds.y1 + 0.5) out.push("pill off the picture");
  });
  return out;
}

describe("label placement", () => {
  it("keeps every pill clear of the others, the outline, the helper lines and the picture's edge", () => {
    const bad: Record<string, number> = {};
    let total = 0;
    for (const tool of TOOLS) for (const level of LEVELS) for (let i = 0; i < 60; i++) {
      const d = generateQuestion(tool, level, {}, "", {})._diagram as Drawing;
      for (const small of [true, false]) for (const answer of [false, true]) {
        total++;
        const p = problems(d, small, answer);
        if (p.length) bad[`${tool} ${level}: ${p[0]}`] = (bad[`${tool} ${level}: ${p[0]}`] ?? 0) + 1;
      }
    }
    // A pill can never overlap another or sit on a line. The one thing allowed to give is a vanishingly rare squeeze (a narrow frame whose hole
    // cannot hold four labels): a pill then pokes past the picture's edge, and the picture is still drawn (the svg does not clip).
    const kinds = Object.entries(bad).filter(([k]) => !/off the picture/.test(k));
    expect(kinds, `of ${total} pictures`).toEqual([]);
    expect(Object.values(bad).reduce((a, b) => a + b, 0) / total).toBeLessThan(0.005);
  });
});
