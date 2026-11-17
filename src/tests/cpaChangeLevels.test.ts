import { describe, expect, it } from "vitest";
import { __seed } from "../tools/Decision/CriticalPath";
import { withSeededRandom } from "./seededRandom";

describe("Delays and changes: question level is independent of network size", () => {
  for (const level of [1, 2, 3]) for (const size of ["small", "medium"]) {
    it(`Level ${level}, ${size}: correct activity count and question kind`, () => {
      withSeededRandom(710 + level, () => {
        const modes = new Set<string>();
        for (let n = 0; n < 8; n++) {
          const p = __seed.generate(level, { subTool: "change", options: { changeSize: size, size: "medium" } });
          const c = p.cpa!;
          expect(c.acts.length).toBeGreaterThanOrEqual(size === "small" ? 6 : 8);
          expect(c.acts.length).toBeLessThanOrEqual(size === "small" ? 7 : 9);
          const mode = c.extra!.change!.mode;
          modes.add(mode);
          expect(level === 1 ? ["less", "equal", "more"] : level === 2 ? ["shorten"] : ["range", "remove"]).toContain(mode);
          expect(p.level).toBe(level);
        }
        if (level === 3) expect([...modes].sort()).toEqual(["range", "remove"]);
      });
    });
  }
  it("defaults every question level to a medium network", () => {
    withSeededRandom(725, () => {
      for (const level of [1, 2, 3]) {
        expect(__seed.generate(level, { subTool: "change", options: {} }).cpa!.acts.length).toBeGreaterThanOrEqual(8);
      }
    });
  });
});
