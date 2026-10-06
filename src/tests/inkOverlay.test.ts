import { describe, it, expect } from "vitest";
import { classifyPress } from "../shared/components/InkOverlay";
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
});
