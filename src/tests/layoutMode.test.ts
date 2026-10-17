import { describe, expect, it } from "vitest";
import { layoutModeOf } from "../shared/layoutMode";

describe("layout mode", () => {
  it("phone up to 640, tablet to 1180, laptop beyond", () => {
    expect(layoutModeOf(390)).toBe("phone");
    expect(layoutModeOf(640)).toBe("phone");
    expect(layoutModeOf(641)).toBe("tablet");
    expect(layoutModeOf(768)).toBe("tablet");
    expect(layoutModeOf(1024)).toBe("tablet");
    expect(layoutModeOf(1180)).toBe("tablet");
    expect(layoutModeOf(1181)).toBe("laptop");
    expect(layoutModeOf(1366)).toBe("laptop");
  });
  it("a touch-first device is a tablet up to 1400, e.g. an iPad Pro in landscape", () => {
    expect(layoutModeOf(1366, true)).toBe("tablet");
    expect(layoutModeOf(1400, true)).toBe("tablet");
    expect(layoutModeOf(1920, true)).toBe("laptop");
    expect(layoutModeOf(390, true)).toBe("phone");
  });
});
