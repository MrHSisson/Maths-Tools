import { describe, it, expect } from "vitest";
import { barLeft, liftAbove } from "../decks/PlayerBar";

describe("the full-screen bar's place", () => {
  it("sits where it was left, kept on the screen", () => {
    expect(barLeft(0.5, 400, 1400)).toBe(500);                       // centred
    expect(barLeft(0, 400, 1400)).toBe(8);                            // dragged off the left: held at the margin
  });
  it("never reaches the ink pencil's corner on a wide screen", () => {
    expect(barLeft(1, 400, 1400) + 400).toBeLessThanOrEqual(1400 - 74);
  });
  it("on a phone the pencil is a side tab, so only the screen's margin limits it", () => {
    expect(barLeft(1, 300, 390) + 300).toBe(390 - 8);
  });
  it("a screen too narrow for the bar and the pencil's corner puts it at the margin", () => {
    expect(barLeft(0.5, 700, 760)).toBe(8);
  });
  it("rises above an ink control it would overlap, and stays put when nothing is in the way", () => {
    const bar = { left: 500, right: 900, height: 52 };
    expect(liftAbove(bar, 768, [])).toBe(0);
    expect(liftAbove(bar, 768, [{ left: 1300, right: 1346, top: 706, bottom: 752 }])).toBe(0);            // the pencil in the corner, well to the right
    expect(liftAbove(bar, 768, [{ left: 600, right: 700, top: 700, bottom: 750 }])).toBeGreaterThan(0);  // a hotbar docked along the bottom
    expect(liftAbove(bar, 768, [{ left: 0, right: 60, top: 100, bottom: 600 }])).toBe(0);                // a vertical hotbar at the side
  });
  it("the lift clears the ink control with a gap", () => {
    const bar = { left: 500, right: 900, height: 52 }, ink = { left: 600, right: 700, top: 700, bottom: 750 };
    const lift = liftAbove(bar, 768, [ink]);
    const barBottom = 768 - 16 - lift;                                 // y of the raised bar's bottom edge
    expect(barBottom).toBeLessThanOrEqual(ink.top - 8 + 0.01);
  });
});
