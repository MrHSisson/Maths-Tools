// Sharing the chosen test files over the CI runners (scripts/testShards.mjs).
import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
// @ts-expect-error plain script, no types
import { balance, loadTimes, weights } from "../../scripts/testShards.mjs";

const files = readdirSync("src/tests").filter((n) => n.endsWith(".test.ts")).map((n) => `src/tests/${n}`);

describe("test shards", () => {
  it("gives every file to exactly one runner", () => {
    const shards = balance(files, weights(loadTimes()), 4) as { files: string[] }[];
    expect(shards).toHaveLength(4);
    expect(shards.flatMap((s) => s.files).sort()).toEqual([...files].sort());
  });
  it("keeps the runners within a quarter of each other when no one file dominates", () => {
    const shards = balance(files, weights(loadTimes()), 4) as { load: number }[];
    const loads = shards.map((s) => s.load);
    expect(Math.max(...loads) / Math.min(...loads)).toBeLessThan(1.25);
  });
  it("is the same every time, and counts a file with no recorded time as the median", () => {
    const w = weights({ "a.test.ts": 10, "b.test.ts": 2, "c.test.ts": 4 });
    expect(w("src/tests/zzz.test.ts")).toBeCloseTo(4.6);                       // the median 4, plus the fixed start-up of 0.6
    const a = balance(["x", "y", "z", "w"], (f: string) => ({ x: 8, y: 5, z: 4, w: 3 })[f] ?? 1, 2);
    expect(a.map((s: { files: string[] }) => s.files)).toEqual([["w", "x"], ["y", "z"]].map((g) => g.sort()).map((g) => g));
  });
  it("counts a light-running check as light", () => {
    const w = weights({ "seedReplay.test.ts": 26 }, (f: string) => (f.includes("seedReplay") ? 0.15 : 1));
    expect(w("src/tests/seedReplay.test.ts")).toBeCloseTo(26 * 0.15 + 0.6);
  });
});
