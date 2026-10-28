// The slide editor's geometry: guides, align and distribute (src/decks/geometry.ts).
import { describe, it, expect } from "vitest";
import { align, bbox, distribute, moveIndex, snapBox, snapEdge, snapTargets, unionBox } from "../decks/geometry";
import type { DeckElement } from "../decks/types";

const box = (id: string, x: number, y: number, w: number, h: number): DeckElement => ({ id, kind: "shape", shape: "rect", x, y, w, h });

describe("deck geometry", () => {
  it("a line's box runs between its two points", () => {
    expect(bbox({ id: "l", kind: "line", x: 300, y: 200, w: -100, h: 50 })).toEqual({ x: 200, y: 200, w: 100, h: 50 });
  });
  it("union box", () => { expect(unionBox([{ x: 0, y: 0, w: 10, h: 10 }, { x: 20, y: 5, w: 10, h: 20 }])).toEqual({ x: 0, y: 0, w: 30, h: 25 }); });
  it("snaps a box's centre to the slide's centre line, and its left edge to another element", () => {
    const t = snapTargets([box("a", 100, 100, 200, 100), box("m", 0, 0, 10, 10)], new Set(["m"]));
    const s = snapBox({ x: 696, y: 104, w: 200, h: 50 }, t, 8);
    expect(s.dx).toBe(4);                           // centre 796 → 800
    expect(s.dy).toBe(-4);                          // top 104 → 100 (element a's top)
    expect(s.guides).toEqual([{ axis: "x", at: 800 }, { axis: "y", at: 100 }]);
    expect(snapBox({ x: 500, y: 600, w: 10, h: 10 }, t, 8)).toEqual({ dx: 0, dy: 0, guides: [] });
  });
  it("snaps an edge being resized", () => { expect(snapEdge(1595, [1600], 8)).toEqual({ v: 1600, at: 1600 }); });
  it("aligns one element to the slide and several to their shared box", () => {
    const els = [box("a", 100, 100, 200, 100), box("b", 500, 300, 100, 100)];
    expect(align(els, new Set(["a"]), "centre")[0].x).toBe(700);
    const r = align(els, new Set(["a", "b"]), "right");
    expect([r[0].x + r[0].w, r[1].x + r[1].w]).toEqual([600, 600]);
    expect(align(els, new Set(["a", "b"]), "bottom").map((e) => e.y + e.h)).toEqual([400, 400]);
  });
  it("distributes with equal gaps", () => {
    const els = [box("a", 0, 0, 100, 10), box("b", 150, 0, 300, 10), box("c", 900, 0, 100, 10)];
    const r = distribute(els, new Set(["a", "b", "c"]), "x");
    expect(r.map((e) => e.x)).toEqual([0, 350, 900]);   // gaps of 250 either side of b
  });
});

describe("moveIndex", () => {
  it("moves an item forward and back, and ignores out-of-range moves", () => {
    expect(moveIndex(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(moveIndex(["a", "b", "c", "d"], 3, 1)).toEqual(["a", "d", "b", "c"]);
    expect(moveIndex(["a", "b"], 1, 1)).toEqual(["a", "b"]);
    expect(moveIndex(["a", "b"], 0, 5)).toEqual(["a", "b"]);
  });
});
