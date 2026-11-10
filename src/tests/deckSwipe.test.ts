// Swiping through a deck on a phone, and what counts as a phone (editing decks is removed from a phone, which only previews them).
import { describe, it, expect } from "vitest";
import { swipeOf } from "../decks/swipe";
import { phoneDeviceOf } from "../shared/layoutMode";

describe("deck swipe", () => {
  it("right to left goes forward, left to right goes back", () => {
    expect(swipeOf(-120, 5, 200)).toBe("forward");
    expect(swipeOf(120, -5, 200)).toBe("back");
  });
  it("a short, slow or mostly vertical movement is not a swipe", () => {
    expect(swipeOf(-30, 0, 200)).toBeNull();
    expect(swipeOf(-120, 0, 1200)).toBeNull();
    expect(swipeOf(-100, 90, 200)).toBeNull();
    expect(swipeOf(0, 150, 200)).toBeNull();
  });
  it("on a page turned a quarter turn clockwise, the slide's right-to-left is a swipe up the screen", () => {
    expect(swipeOf(4, -120, 200, true)).toBe("forward");
    expect(swipeOf(-4, 120, 200, true)).toBe("back");
    // the screen's own sideways movement is the slide's vertical one: not a swipe
    expect(swipeOf(-120, 4, 200, true)).toBeNull();
  });
});

describe("what a phone is", () => {
  const dev = (o: Partial<Parameters<typeof phoneDeviceOf>[0]>) => phoneDeviceOf({ width: 1366, coarse: false, shortSide: 768, override: null, ...o });
  it("a touch screen whose short side is at most 600px, upright or held sideways", () => {
    expect(dev({ width: 390, coarse: true, shortSide: 390 })).toBe(true);
    expect(dev({ width: 844, coarse: true, shortSide: 390 })).toBe(true);   // a phone in landscape
  });
  it("a tablet, a laptop, or a narrow browser window with a mouse is not one", () => {
    expect(dev({ width: 1133, coarse: true, shortSide: 744 })).toBe(false);  // an iPad mini, landscape
    expect(dev({ width: 1366, coarse: false, shortSide: 768 })).toBe(false);
    expect(dev({ width: 844, coarse: false, shortSide: 390 })).toBe(false);  // a wide window with a mouse is not a phone
    expect(dev({ width: 390, coarse: false, shortSide: 900 })).toBe(false);  // a laptop's window narrowed to phone width keeps the editor
  });
  it("View as decides: Mobile is a phone, Tablet and Desktop are not", () => {
    expect(dev({ override: "phone" })).toBe(true);
    expect(dev({ override: "tablet", width: 390, coarse: true, shortSide: 390 })).toBe(false);
    expect(dev({ override: "laptop", width: 390 })).toBe(false);
  });
});
