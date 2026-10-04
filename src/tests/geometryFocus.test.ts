import { describe, it, expect } from "vitest";
import { __test } from "../tools/Geometry/AnglesInTriangles";

// Per-step emphasis for the split worked example: one focus entry per step, every index a real angle.
describe("Angles in Triangles — per-step focus", () => {
  for (const [level, dd] of [["level1", ""], ["level2", ""], ["level3", "splitTriangle"], ["level3", "exteriorAngle"]] as const) {
    it(`${level}${dd ? ` ${dd}` : ""}: every step's focus points at angles that exist`, () => {
      for (let n = 0; n < 200; n++) {
        const q: any = __test.generateQuestion("anglesInTriangles", level, {}, dd, {});
        const angles = q._diagram.angles as unknown[];
        expect(q._stepFocus).toHaveLength(q.working.length);
        for (const f of q._stepFocus as (number[] | undefined)[]) {
          if (!f) continue;
          expect(f.length).toBeGreaterThan(0);
          for (const i of f) { expect(i).toBeGreaterThanOrEqual(0); expect(i).toBeLessThan(angles.length); }
        }
        // the final step is always about the unknown
        const unknownIdx = (q._diagram.angles as { isUnknown: boolean }[]).findIndex((a) => a.isUnknown);
        const lastFocus = q._stepFocus[q._stepFocus.length - 1] as number[];
        if (level !== "level2") expect(lastFocus).toContain(unknownIdx);
      }
    });
  }
});
