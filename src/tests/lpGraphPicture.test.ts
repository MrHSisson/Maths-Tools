// The region picture of the Graphical LP tool (LpGraphPicture.tsx, lpGraphView.ts): geometry checked against areas worked out by hand, and the picture's rules
// (R31: one svg with data-q-index and no fixed pixel height; R32: it never changes size as it fills; strict lines dotted; R only in an enclosed region).
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { fr } from "../shared/decision/dim";
import LpGraphPicture, { type GraphView } from "../shared/decision/LpGraphPicture";
import { type GLine, type Objective, regionVertices, latticePoints } from "../shared/decision/lpGraph";
import { clipPoly, constraintText, fmtFr, fmtPt, graphWindow, lineSegment, polyArea, regionPolygon, unwantedPolygon } from "../shared/decision/lpGraphView";

const FERRY: GLine[] = [{ a: 5, b: 6, op: "≤", c: 50 }, { a: 2, b: 4, op: "≤", c: 25 }];
const OPEN: GLine[] = [{ a: 3, b: 2, op: "≥", c: 12 }, { a: 1, b: 3, op: "≥", c: 9 }];
const STRICT: GLine[] = [{ a: 1, b: 1, op: "<", c: 6 }, { a: 1, b: 0, op: ">", c: 1 }];
const html = (v: GraphView, q?: number) => renderToStaticMarkup(createElement(LpGraphPicture, { view: v, qIndex: q }));
const count = (s: string, needle: string) => s.split(needle).length - 1;

describe("geometry", () => {
  it("the window reaches past every intercept and corner, in whole steps", () => {
    const w = graphWindow(FERRY);
    expect(w.xMax).toBeGreaterThanOrEqual(10);
    expect(w.yMax).toBeGreaterThanOrEqual(10);
    expect(w.xMax % w.step).toBe(0);
    expect(w.yMax % w.step).toBe(0);
  });
  it("the region polygon of the ferry problem has the area of its four corners (shoelace by hand)", () => {
    const w = graphWindow(FERRY);
    const vs = regionVertices(FERRY).map((v) => [v[0][0] / v[0][1], v[1][0] / v[1][1]] as const);
    expect(polyArea(regionPolygon(FERRY, w))).toBeCloseTo(polyArea(vs), 9);
    expect(polyArea(vs)).toBeCloseTo(35.15625, 9); // shoelace by hand: 70.3125 / 2
  });
  it("what a constraint rules out and what it keeps fill the window between them", () => {
    const w = graphWindow(FERRY);
    for (const l of FERRY) {
      const out = polyArea(unwantedPolygon(l, w));
      const keep = polyArea(clipPoly([[0, 0], [w.xMax, 0], [w.xMax, w.yMax], [0, w.yMax]], l, "le"));
      expect(out + keep).toBeCloseTo(w.xMax * w.yMax, 6);
    }
  });
  it("a line's visible segment runs between its axis crossings or window edges", () => {
    const w = { xMax: 12, yMax: 10, step: 1 };
    expect(lineSegment({ a: 2, b: 3, c: 12 }, w)!.map((p) => p.join(",")).sort()).toEqual(["0,4", "6,0"]);
    expect(lineSegment({ a: 1, b: 0, c: 8 }, w)!.map((p) => p.join(",")).sort()).toEqual(["8,0", "8,10"]);
    expect(lineSegment({ a: 1, b: 0, c: 20 }, w)).toBeNull();
  });
  it("writes constraints and coordinates the way a reader does", () => {
    expect(constraintText({ a: 5, b: 6, op: "≤", c: 50 })).toBe("5x + 6y ≤ 50");
    expect(constraintText({ a: 1, b: -2, op: "≥", c: 0 })).toBe("x − 2y ≥ 0");
    expect(constraintText({ a: 0, b: 1, op: ">", c: 2 })).toBe("y > 2");
    expect(constraintText({ a: 1, b: 0, op: "≤", c: 8 })).toBe("x ≤ 8");
    expect(fmtFr(fr(25, 4))).toBe("6.25");
    expect(fmtFr(fr(18, 7))).toBe("18/7");
    expect(fmtPt([fr(25, 4), fr(25, 8)])).toBe("(6.25, 3.125)");
  });
});

describe("the picture", () => {
  it("is one svg with data-q-index and no fixed pixel height (R31)", () => {
    const h = html({ lines: FERRY, vertices: regionVertices(FERRY), region: true }, 3);
    expect(count(h, "<svg")).toBe(1);
    expect(h).toContain('data-q-index="3"');
    expect(h).not.toMatch(/<svg[^>]*\sheight=/);
    expect(h).toMatch(/viewBox="0 0 \d+ \d+"/);
    expect(h).toContain("height:auto");
  });
  it("has no data-q-index when it is not a worksheet question", () => expect(html({ lines: FERRY })).not.toContain("data-q-index"));
  it("never changes size as it fills (R32): the same viewBox and window at every step", () => {
    const w = graphWindow(FERRY);
    const steps: GraphView[] = [
      { lines: FERRY, drawn: 0, win: w }, { lines: FERRY, drawn: 1, win: w }, { lines: FERRY, drawn: 2, shaded: 2, win: w },
      { lines: FERRY, region: true, vertices: regionVertices(FERRY), win: w },
    ];
    const boxes = steps.map((v) => html(v).match(/viewBox="[^"]+"/)![0]);
    expect(new Set(boxes).size).toBe(1);
  });
  it("draws a strict boundary dotted and a non-strict one continuous", () => {
    const h = html({ lines: STRICT });
    expect(count(h, "data-dotted")).toBe(2);
    expect(count(html({ lines: FERRY }), "data-dotted")).toBe(0);
  });
  it("puts ticks on the unwanted side of each shaded line (shade out), or tints the region once (shade in)", () => {
    expect(count(html({ lines: FERRY, shading: "out" }), "data-shade-out")).toBe(2);
    expect(count(html({ lines: FERRY, shading: "out", shaded: 1 }), "data-shade-out")).toBe(1);
    const inn = html({ lines: FERRY, shading: "in" });
    expect(count(inn, "data-shade-out")).toBe(0);
    expect(inn).toContain("#bfdbfe");
  });
  it("writes R only in an enclosed region", () => {
    expect(html({ lines: FERRY, region: true })).toContain("data-r");
    expect(html({ lines: OPEN, region: true })).not.toContain("data-r");
    expect(html({ lines: FERRY })).not.toContain("data-r");
  });
  it("labels every drawn line with its constraint and every corner with its coordinates", () => {
    const h = html({ lines: FERRY, vertices: regionVertices(FERRY) });
    expect(h).toContain("5x + 6y ≤ 50");
    expect(h).toContain("2x + 4y ≤ 25");
    // the equations are in the key below the graph, not on the lines: each is written once, inside the key group
    const key = h.slice(h.indexOf("data-key"));
    expect(key).toContain("5x + 6y ≤ 50");
    expect(h.slice(0, h.indexOf("data-key"))).not.toContain("5x + 6y ≤ 50");
    expect(count(h, "data-vertex")).toBe(4);
    expect(h).toContain("(6.25, 3.125)");
    expect(count(html({ lines: FERRY, drawn: 1 }), "data-line=")).toBe(1);
  });
  it("draws the sliding objective lines, the arrow, the whole points and rings the best one", () => {
    const o: Objective = { p: 3, q: 5, sense: "max" };
    const h = html({ lines: FERRY, objective: { o, ks: [fr(15), fr(34)], arrow: true }, lattice: { pts: latticePoints(FERRY), best: [[fr(6), fr(3)]] } });
    expect(count(h, "data-objective=")).toBe(2);
    expect(h).toContain("data-arrow");
    expect(count(h, "data-best")).toBe(1);
  });
});
