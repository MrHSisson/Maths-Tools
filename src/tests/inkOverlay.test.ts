import { describe, it, expect } from "vitest";
import { classifyPress, dockFromDrop, placeHotbar, defaultDock } from "../shared/components/InkOverlay";
import { eraseNear, eraseWholeNear } from "../shared/components/BoardTools";
import { eraseAt, DEFAULT_PREFS, PEN_WIDTHS, ERASER_SIZES } from "../shared/components/InkOverlay";

describe("Ink overlay press classification", () => {
  it("a short, still press is a tap to forward", () => {
    expect(classifyPress(0, 80, false)).toBe("tap");
    expect(classifyPress(5, 299, false)).toBe("tap");
  });
  it("moving further than the threshold is ink, however quick (a short dash is not a tap)", () => {
    expect(classifyPress(7, 60, false)).toBe("ink");
    expect(classifyPress(40, 500, false)).toBe("ink");
  });
  it("a long still press draws a dot; a stylus stroke is always ink", () => {
    expect(classifyPress(1, 400, false)).toBe("dot");
    expect(classifyPress(0, 50, true)).toBe("ink");
  });
  it("the eraser cuts a stroke rather than deleting it", () => {
    const line = { color: "#000", points: Array.from({ length: 21 }, (_, i) => ({ x: i * 10, y: 0 })) };
    const out = eraseNear([line], 100, 0);
    expect(out.length).toBe(2);
  });

  it("hotbar docking: side edges go vertical, bottom/top flat, the middle stays flat and free", () => {
    const at = (x: number, y: number, cx = x, cy = y) => dockFromDrop({ x, y }, { x: cx, y: cy }, 1200, 800);
    expect(at(20, 300)).toMatchObject({ v: true, cx: 0 });
    expect(at(1190, 300)).toMatchObject({ v: true, cx: 1 });
    expect(at(600, 790)).toMatchObject({ v: false, cy: 1 });
    expect(at(600, 20)).toMatchObject({ v: false, cy: 0 });
    expect(at(600, 400)).toMatchObject({ v: false, cx: 0.5, cy: 0.5 });
    expect(defaultDock(1280)).toMatchObject({ v: true, cx: 1 });
    expect(defaultDock(390)).toMatchObject({ v: false, cy: 1 });
  });
  it("left and right docking are symmetric even when the grabbed grip is far from the bar's centre", () => {
    // a flat bar grabbed at its left-end grip: the centre sits ~210px to the right of the pointer
    const left = dockFromDrop({ x: 20, y: 300 }, { x: 230, y: 300 }, 1200, 800);
    const right = dockFromDrop({ x: 1180, y: 300 }, { x: 1390, y: 300 }, 1200, 800);
    expect(left).toMatchObject({ v: true, cx: 0 });
    expect(right).toMatchObject({ v: true, cx: 1 });
  });
  it("a gentle drag away from an edge frees the bar (no sticky snap zone)", () => {
    // a vertical bar docked right has its grip ~35px from the edge; dragging it 15px away must NOT re-dock it
    const free = dockFromDrop({ x: 1200 - 50, y: 300 }, { x: 1200 - 50, y: 500 }, 1200, 800);
    expect(free.v).toBe(false);
    expect(dockFromDrop({ x: 1200 - 10, y: 300 }, { x: 1190, y: 300 }, 1200, 800)).toMatchObject({ v: true, cx: 1 });
  });
  it("the hotbar is always kept fully on screen", () => {
    for (const d of [{ v: true, cx: 1, cy: 0 }, { v: false, cx: 0, cy: 1 }, { v: true, cx: 0.5, cy: 0.5 }]) {
      const { left, top } = placeHotbar(d, 1000, 600, 60, 480);
      expect(left).toBeGreaterThanOrEqual(8); expect(left + 60).toBeLessThanOrEqual(992);
      expect(top).toBeGreaterThanOrEqual(8); expect(top + 480).toBeLessThanOrEqual(592);
    }
    // a bar taller than the screen pins to the top margin rather than going negative
    expect(placeHotbar({ v: true, cx: 1, cy: 0.5 }, 1000, 300, 60, 480).top).toBe(8);
  });

  const line = (w?: number) => ({ color: "#000", width: w, points: Array.from({ length: 21 }, (_, i) => ({ x: i * 10, y: 0 })) });
  it("eraser size changes how much a pass removes, and strokes keep their thickness when split", () => {
    const small = eraseNear([line(8)], 100, 0, 8), big = eraseNear([line(8)], 100, 0, 30);
    const kept = (r: { points: unknown[] }[]) => r.reduce((n, s) => n + s.points.length, 0);
    expect(kept(big)).toBeLessThan(kept(small));
    expect(small.every((s) => s.width === 8)).toBe(true);
  });
  it("whole-line mode deletes the entire continuous line, not a section", () => {
    const a = line(4), b = { color: "#f00", points: [{ x: 0, y: 200 }, { x: 200, y: 200 }] };
    const out = eraseWholeNear([a, b], 100, 6, 8);
    expect(out).toEqual([b]);                                   // a is gone completely, b untouched
    expect(eraseWholeNear([a, b], 100, 80, 8)).toEqual([a, b]); // a miss removes nothing
  });
  it("whole-line mode catches a sparsely sampled stroke between its recorded points", () => {
    const sparse = { color: "#000", points: [{ x: 0, y: 0 }, { x: 400, y: 0 }] };
    expect(eraseWholeNear([sparse], 200, 3, 8)).toEqual([]);    // 200px from either recorded point, but on the line
  });
  it("the thick pen is hit from further away than the thin one", () => {
    expect(eraseWholeNear([line(2)], 100, 14, 8)).toHaveLength(1);
    expect(eraseWholeNear([line(12)], 100, 14, 8)).toHaveLength(0);
  });
  it("eraseAt follows the chosen mode and size", () => {
    expect(eraseAt([line(4)], 100, 0, { ...DEFAULT_PREFS, eraseMode: "line" })).toEqual([]);
    expect(eraseAt([line(4)], 100, 0, { ...DEFAULT_PREFS, eraseMode: "part" }).length).toBe(2);
    expect(PEN_WIDTHS.length).toBe(3); expect(ERASER_SIZES.length).toBe(3);
  });
});
