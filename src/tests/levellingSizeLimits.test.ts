// Resource levelling, Level 3 question size: every size and worker set stays within its caps (split from levellingMethod.test.ts so no one file is the slowest).
import { describe, expect, it } from "vitest";
import { withSeededRandom } from "./seededRandom";
import { generateCpa, levelCounts, LEVEL_SIZES } from "../shared/decision";


describe("levelling — Level 3 question size: every generated question stays within its caps", () => {
  const sizes = ["short", "exam", "stretch"] as const;
  const workerSets = ["one", "several", "mixed"] as const;
  for (const size of sizes) for (const workers of workerSets) {
    it(`${size}, ${workers} workers: every generated question stays within tries ${LEVEL_SIZES[size].tries}, quick sums ${LEVEL_SIZES[size].sums}, knock-on clashes ${LEVEL_SIZES[size].clashes}`, () => {
      withSeededRandom(121100 + sizes.indexOf(size) * 10 + workerSets.indexOf(workers), () => {
        for (let i = 0; i < 12; i++) {
          const { data } = generateCpa(3, "cpaLevel", { paths: "one", levelLevel: 3, levelWorkers: workers, levelSize: size, histShape: "step" });
          const c = levelCounts(data.extra!.level!.method!), cap = LEVEL_SIZES[size];
          expect(c.tries).toBeGreaterThanOrEqual(2);
          expect(c.tries).toBeLessThanOrEqual(cap.tries);
          expect(c.sums).toBeLessThanOrEqual(cap.sums);
          expect(c.clashes).toBeLessThanOrEqual(cap.clashes);
        }
      });
    }, 240_000);
  }
});
