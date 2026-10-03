import { describe, it, expect } from "vitest";
import { ctr, zeroPairs, netValue, pairCount, cStep, COUNTER_POS, COUNTER_NEG } from "../shared";

describe("negative counters helpers", () => {
  it("builds yellow then red counters", () => {
    const c = ctr(3, 2);
    expect(c).toHaveLength(5);
    expect(c.slice(0, 3).every((x) => x.sign === 1)).toBe(true);
    expect(c.slice(3).every((x) => x.sign === -1)).toBe(true);
  });
  it("net value ignores removed counters", () => {
    expect(netValue(ctr(3, 5))).toBe(-2);
    expect(netValue([...ctr(2, 0), ...ctr(0, 2, "removed")])).toBe(2);
  });
  it("zero pairs net to zero and alternate yellow/red", () => {
    const z = zeroPairs(3);
    expect(netValue(z)).toBe(0);
    expect(z[0].sign).toBe(1);
    expect(z[1].sign).toBe(-1);
  });
  it("counts whole zero pairs", () => {
    expect(pairCount(4, 6)).toBe(4);
    expect(pairCount(0, 3)).toBe(0);
  });
  it("cStep carries the board and a plain caption", () => {
    const s = cStep("Start with 2 positives", { rows: [{ counters: ctr(2, 0) }] });
    expect(s.plain).toBe("Start with 2 positives");
    expect((s.extra as { kind: string }).kind).toBe("countersSnapshot");
  });
  it("uses the algebra-tile yellow and red", () => {
    expect(COUNTER_POS).toBe("#facc15");
    expect(COUNTER_NEG).toBe("#ef4444");
  });
});
