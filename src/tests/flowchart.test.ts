import { describe, it, expect } from "vitest";
import { flowchartEls, layoutNodes, routeEdge, type FlowNode } from "../decks/flowchart";

const area = { x: 760, y: 60, w: 780, h: 780 };
const nodes: FlowNode[] = [
  { id: "a", text: "Add the digits", kind: "step", col: 0.5, row: 0, step: 1 },
  { id: "d", text: "In the 3 times table?", kind: "decision", col: 0.5, row: 1, step: 2 },
  { id: "y", text: "Divisible", kind: "yes", col: 0, row: 2, step: 3 },
  { id: "n", text: "Not divisible", kind: "no", col: 1, row: 2, step: 3 },
];

describe("flowchart layout", () => {
  it("keeps every node inside the area and nodes in different cells apart", () => {
    const box = layoutNodes(nodes, area);
    for (const b of Object.values(box)) { expect(b.x).toBeGreaterThanOrEqual(area.x - 0.01); expect(b.x + b.w).toBeLessThanOrEqual(area.x + area.w + 0.01); expect(b.y).toBeGreaterThanOrEqual(area.y - 0.01); expect(b.y + b.h).toBeLessThanOrEqual(area.y + area.h + 0.01); }
    const ids = Object.keys(box);
    for (const p of ids) for (const q of ids) if (p < q) { const A = box[p], B = box[q]; expect(A.x + A.w <= B.x || B.x + B.w <= A.x || A.y + A.h <= B.y || B.y + B.h <= A.y).toBe(true); }
  });
  it("a straight arrow runs from the edge of one node to the edge of the next, pointing the right way", () => {
    const box = layoutNodes(nodes, area);
    const [p, q] = routeEdge(box.a, box.d);
    expect(p.x).toBe(q.x); expect(q.y).toBeGreaterThan(p.y); expect(p.y).toBeGreaterThan(box.a.y + box.a.h - 1); expect(q.y).toBeLessThan(box.d.y + 1);
  });
  it("an arrow between nodes not in line bends once and ends pointing into the target", () => {
    const box = layoutNodes(nodes, area);
    const pts = routeEdge(box.d, box.y, "hv");
    expect(pts).toHaveLength(3);
    expect(pts[2].x).toBe(box.y.cx); expect(pts[2].y).toBeLessThan(box.y.y + 1);
  });
  it("makes shapes, then text, then arrows with only the last piece of each arrow pointed, and reveals each part with its node", () => {
    const els = flowchartEls("t", nodes, [{ from: "a", to: "d" }, { from: "d", to: "y", label: "Yes", route: "hv" }, { from: "d", to: "n", label: "No", route: "hv" }], area);
    const kinds = els.map((e) => e.kind);
    expect(kinds.indexOf("text")).toBeGreaterThan(kinds.lastIndexOf("shape") - 1);
    expect(kinds.indexOf("line")).toBeGreaterThan(kinds.lastIndexOf("shape"));
    const arrows = els.filter((e) => e.kind === "line");
    expect(arrows).toHaveLength(1 + 2 + 2);                                   // one straight, two bent
    expect(arrows.filter((e) => e.kind === "line" && e.arrow)).toHaveLength(3);
    expect(els.find((e) => e.id === "t-a-1-1")).toMatchObject({ step: 3 });    // the arrow into "Divisible" arrives with it
    expect(new Set(els.map((e) => e.id)).size).toBe(els.length);
  });
  it("names a missing node instead of drawing nonsense", () => {
    expect(() => flowchartEls("t", nodes, [{ from: "a", to: "zzz" }], area)).toThrow(/zzz/);
  });
});
