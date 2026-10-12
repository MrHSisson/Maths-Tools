import { describe, expect, it } from "vitest";
import { spreadByBand } from "../shared";

const mk = (counts: Record<number, number>) => Object.entries(counts).flatMap(([b, c]) => Array.from({ length: c }, (_, i) => ({ key: `${b}-${i}`, _difficultyScore: Number(b) })));
const tally = (xs: any[]): Record<number, number> => xs.reduce((m: Record<number, number>, q: any) => ({ ...m, [q._difficultyScore]: (m[q._difficultyScore] ?? 0) + 1 }), {} as Record<number, number>);

describe("spreadByBand (generate extra, then pick)", () => {
  it("spreads n evenly across the bands present", () => {
    const t = tally(spreadByBand(mk({ 1: 50, 2: 50, 3: 50 }), 15));
    expect(Object.values(t)).toEqual([5, 5, 5]);
  });
  it("a remainder lands within one of an even split, and only on bands present", () => {
    const t = tally(spreadByBand(mk({ 2: 40, 5: 40, 7: 40 }), 10));
    expect(Object.keys(t).map(Number).sort()).toEqual([2, 5, 7]);
    expect(Math.max(...(Object.values(t) as number[])) - Math.min(...(Object.values(t) as number[]))).toBeLessThanOrEqual(1);
  });
  it("a short band hands its slots to the others", () => {
    const t = tally(spreadByBand(mk({ 1: 2, 2: 50, 3: 50 }), 12));
    expect(t[1]).toBe(2);
    expect(t[2] + t[3]).toBe(10);
  });
  it("returns n, ascending by band, with unique keys", () => {
    const out = spreadByBand(mk({ 1: 9, 4: 9, 8: 9 }), 14);
    expect(out).toHaveLength(14);
    expect(new Set(out.map((q) => q.key)).size).toBe(14);
    const bands = out.map((q: any) => q._difficultyScore);
    expect([...bands].sort((a, b) => a - b)).toEqual(bands);
  });
});
