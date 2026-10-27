// The numbers in the Estimation Depth bank (src/tools/Number/EstimationDepth.ts).
import { describe, it, expect } from "vitest";
import { ESTIMATION_DEPTH } from "../tools/Number/EstimationDepth";
import { MISCONCEPTIONS } from "../shared/misconceptions";

const sf1 = (n: number) => { const m = 10 ** Math.floor(Math.log10(Math.abs(n))); return Math.round(n / m) * m; };
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
const r2 = (n: number) => Math.round(n * 100) / 100;

describe("Estimation Depth bank", () => {
  it("rounds and calculates as the items say", () => {
    expect([sf1(39), sf1(72), sf1(39) * sf1(72), 30 * 70]).toEqual([40, 70, 2800, 2100]);
    expect([sf1(386), sf1(587), sf1(29), sf1(587) / sf1(29), r2(590 / 30)]).toEqual([400, 600, 30, 20, 19.67]);
    expect([sf1(47), sf1(25), sf1(47) - sf1(25), 47 - 25]).toEqual([50, 30, 20, 22]);
    expect(near(sf1(0.28), 0.3) && near(sf1(8.2) / sf1(0.51), 16) && near(sf1(7.2) * sf1(0.31), 2.1)).toBe(true);
    for (const [a, b] of [[3.9, 0.21], [4.2, 0.19], [41, 1.9]]) expect(near(sf1(a) / sf1(b), 20)).toBe(true);
    expect(near(sf1(9.6) * sf1(2.1), 20)).toBe(true);
    expect([(sf1(24) + sf1(33)) / sf1(12), sf1(24 + 33) / sf1(12), (24 + 33) / 12]).toEqual([5, 6, 4.75]);
    expect([(sf1(61) * sf1(39)) / sf1(29), Math.round((61 * 39) / 29)]).toEqual([80, 82]);
    expect([(sf1(47) + sf1(36)) / sf1(23), sf1(47 + 36) / sf1(23), r2((47 + 36) / 23)]).toEqual([4.5, 4, 3.61]);
    expect([(sf1(15) * sf1(15)) / sf1(15), Math.round((20 / 15 - 1) * 100)]).toEqual([20, 33]);
  });
  it("every tag names a shared misconception", () => {
    for (const i of ESTIMATION_DEPTH) for (const o of i.options ?? []) if (o.tag) expect(MISCONCEPTIONS[o.tag], `${i.id}: ${o.tag}`).toBeTruthy();
  });
});
