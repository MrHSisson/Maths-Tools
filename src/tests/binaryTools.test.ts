// Correctness checks for the CS binary tools: Number Bases conversions and
// Binary Shifts. The generic smoke tests (generators.test.ts) only check that
// questions render; these check the answers are the right numbers.
import { describe, it, expect } from "vitest";
import { __test as bases } from "../tools/Binary/NumberBases";
import { __test as arith } from "../tools/Binary/BinaryAddition";
import type { DifficultyLevel } from "../shared";

const N = 300;

describe("Number Bases", () => {
  const cases: [string, string][] = [
    ["denBin", "denToBin"], ["denBin", "binToDen"],
    ["denHex", "denToHex"], ["denHex", "hexToDen"],
    ["binHex", "binToHex"], ["binHex", "hexToBin"],
  ];
  const levels: DifficultyLevel[] = ["level1", "level2"];

  it("every sub-tool declares exactly two levels", () => {
    for (const t of Object.values(bases.TOOL_CONFIG.tools)) expect(t.levels).toEqual(levels);
  });

  for (const [tool, dir] of cases) {
    for (const level of levels) {
      it(`${tool} ${dir} ${level}: answers are correct and in range`, () => {
        const other = cases.find(([t, d]) => t === tool && d !== dir)![1];
        for (let i = 0; i < N; i++) {
          const q = bases.generateQuestion(tool, level, {}, "", { [dir]: true, [other]: false }) as any;
          const { n, width } = q._rawValues as { n: number; width: number };
          if (level === "level1") { expect(n).toBeGreaterThanOrEqual(1); expect(n).toBeLessThanOrEqual(15); expect(width).toBe(4); }
          else { expect(n).toBeGreaterThanOrEqual(16); expect(n).toBeLessThanOrEqual(255); expect(width).toBe(8); }
          const expected =
            dir.endsWith("ToBin") ? n.toString(2).padStart(width, "0") :
            dir.endsWith("ToHex") ? n.toString(16).toUpperCase() :
            String(n);
          expect(q.answer).toBe(expected);
        }
      });
    }
  }
});

describe("Binary Shifts", () => {
  const parse = (q: any) => {
    const m = /Shift \$([01]{8})\$ (\d) places? to the (left|right)/.exec(q.lines[0]);
    expect(m).not.toBeNull();
    return { v: parseInt(m![1], 2), places: Number(m![2]), dir: m![3] as "left" | "right" };
  };

  it("declares two levels", () => {
    expect(arith.TOOL_CONFIG.tools.binaryShifts.levels).toEqual(["level1", "level2"]);
  });

  for (const level of ["level1", "level2"] as DifficultyLevel[]) {
    for (const lost of ["never", "exclusive"]) {
      it(`${level}, bits lost = ${lost}: result is the logical shift, loss matches the setting`, () => {
        for (let i = 0; i < N; i++) {
          const q = arith.generateQuestion("binaryShifts", level, {}, lost, {}) as any;
          const { v, places, dir } = parse(q);
          const result = dir === "left" ? (v << places) & 0xff : v >> places;
          expect(q.answer).toBe(result.toString(2).padStart(8, "0"));
          expect(result).toBeGreaterThan(0);
          const exact = dir === "left" ? v * 2 ** places === result : v / 2 ** places === result;
          expect(exact).toBe(lost === "never");
          if (level === "level2") expect(q.lines).toHaveLength(2);
        }
      });
    }
  }
});
