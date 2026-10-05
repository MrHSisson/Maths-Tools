// Adding & Subtracting Decimals — the Level 2 "Carries / Exchanges needed" pool and the
// Level 3 "Decimal places" pool must do what they say.

import { describe, it, expect } from "vitest";
import { __test } from "../tools/Number/DecimalAddSub";
import type { DifficultyLevel } from "../shared/types";

const { TOOL_CONFIG, generateQuestion } = __test as any;

const active = (tool: string, level: DifficultyLevel, only: Record<string, boolean>) => {
  const groups = ([] as any[]).concat(TOOL_CONFIG.tools[tool].difficultySettings[level].multiSelect);
  const v: Record<string, boolean> = {};
  for (const g of groups) for (const o of g.options) v[o.value] = false;
  return { ...v, ...only };
};
const text = (q: any) => q.working.map((w: any) => w.plain).join("\n");
const count = (re: RegExp, s: string) => (s.match(re) ?? []).length;
const dps = (q: any) => [q._pv.a.dp, q._pv.b.dp];

describe("Level 2 carries / exchanges needed", () => {
  for (const [x, ok] of [["x1", (n: number) => n === 1], ["x2", (n: number) => n === 2], ["x3", (n: number) => n >= 3]] as const) {
    for (const dp of ["dp1", "dp2", "dp3"]) {
      it(`adding, ${x}, ${dp}`, () => {
        for (let i = 0; i < 30; i++) {
          const q = generateQuestion("add", "level2", {}, "", active("add", "level2", { [x]: true, [dp]: true }));
          expect(ok(count(/and carry/g, text(q)))).toBe(true);
        }
      });
      it(`subtracting, ${x}, ${dp}`, () => {
        for (let i = 0; i < 30; i++) {
          const q = generateQuestion("subtract", "level2", {}, "", active("subtract", "level2", { [x]: true, [dp]: true }));
          expect(ok(count(/exchange 1/gi, text(q)))).toBe(true);
        }
      });
    }
  }
});

describe("Level 3 max decimal places", () => {
  for (const tool of ["add", "subtract"]) {
    for (const cap of [1, 2, 3]) {
      it(`${tool}: longest number has at most ${cap} d.p. (never below the 2 d.p. the shapes need at cap 1)`, () => {
        const seen = new Set<number>();
        for (let i = 0; i < 150; i++) {
          const q = generateQuestion(tool, "level3", {}, "", { ...active(tool, "level3", { [`dp${cap}`]: true }), wholePlus: true, wholeMinus: true, trimZero: true, diffPlaces: true, padZero: true, acrossZero: true, longerTop: true });
          const m = Math.max(...dps(q));
          expect(m).toBeLessThanOrEqual(Math.max(cap, 2));
          seen.add(m);
        }
        // A max is a range: at 3 the longest number is sometimes shorter than 3.
        if (cap === 3) expect(seen.size).toBeGreaterThan(1);
      });
    }
  }
});
