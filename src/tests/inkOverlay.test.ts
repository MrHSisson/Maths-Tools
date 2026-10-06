import { describe, it, expect } from "vitest";
import { classifyPress, dockFromDrop, placeHotbar, defaultDock } from "../shared/components/InkOverlay";
import { eraseNear } from "../shared/components/BoardTools";

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
    expect(dockFromDrop(20, 300, 1200, 800)).toMatchObject({ v: true, cx: 0 });
    expect(dockFromDrop(1190, 300, 1200, 800)).toMatchObject({ v: true, cx: 1 });
    expect(dockFromDrop(600, 790, 1200, 800)).toMatchObject({ v: false, cy: 1 });
    expect(dockFromDrop(600, 20, 1200, 800)).toMatchObject({ v: false, cy: 0 });
    expect(dockFromDrop(600, 400, 1200, 800)).toMatchObject({ v: false, cx: 0.5, cy: 0.5 });
    expect(defaultDock(1280)).toMatchObject({ v: true, cx: 1 });
    expect(defaultDock(390)).toMatchObject({ v: false, cy: 1 });
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
});
