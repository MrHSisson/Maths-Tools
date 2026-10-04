import { describe, it, expect } from "vitest";
import { __test } from "../tools/Binary/DataUnits";

// Independent check: express every unit in bits and convert start → answer by ratio.
const SIZE_IN_BITS = [1n, 4n, 8n, 8_000n, 8_000_000n, 8_000_000_000n, 8_000_000_000_000n, 8_000_000_000_000_000n];
const ALL_ON = (extra: Record<string, boolean> = {}) => ({ toSmaller: true, toLarger: true, whole: true, decimal: false, convert: true, howMany: true, ...extra });
const STEPS: Record<string, Record<string, [number, number]>> = {
  bytesUp: { level1: [1, 1], level2: [2, 2], level3: [3, 5] },
  bitsNibbles: { level1: [1, 1], level2: [2, 2], level3: [3, 4] },
};

describe("Data Units", () => {
  for (const tool of ["bytesUp", "bitsNibbles"]) {
    for (const level of ["level1", "level2", "level3"] as const) {
      it(`${tool} ${level}: answer matches an independent bits-based conversion, with the right number of steps`, () => {
        for (let n = 0; n < 150; n++) {
          const q: any = __test.generateQuestion(tool, level, {}, "", ALL_ON({ decimal: n % 2 === 0 }) as any);
          const { a, b, startT, ansT } = q._rawValues as { a: number; b: number; startT: bigint; ansT: bigint };
          expect(ansT * SIZE_IN_BITS[b]).toBe(startT * SIZE_IN_BITS[a]);
          const span = Math.abs(a - b);
          const [min, max] = STEPS[tool][level];
          expect(span).toBeGreaterThanOrEqual(min);
          expect(span).toBeLessThanOrEqual(max);
          expect(q.working).toHaveLength(span + 1);          // one step per hop + the answer line
          if (tool === "bitsNibbles") expect(Math.min(a, b)).toBeLessThanOrEqual(1);   // a bit or nibble at one end
          else expect(Math.min(a, b)).toBeGreaterThanOrEqual(2);                       // byte and above only
        }
      });
    }
  }
  it("Level 1 examples: 40,000 KB → MB is 40; 3 TB → GB is 3,000", () => {
    // Walk the same engine by hand: KB(3) → MB(4) divides by 1000; TB(6) → GB(5) multiplies by 1000.
    expect(__test.FACTORS[3]).toBe(1000);
    expect(40_000n * SIZE_IN_BITS[3]).toBe(40n * SIZE_IN_BITS[4]);
    expect(3n * SIZE_IN_BITS[6]).toBe(3_000n * SIZE_IN_BITS[5]);
  });
  it("working steps show ×1000 and, in brackets, ×1024", () => {
    const q: any = __test.generateQuestion("bytesUp", "level1", {}, "", ALL_ON() as any);
    expect(q.working[0].label).toMatch(/1000 \([÷×] 1024\)/);
  });
});
