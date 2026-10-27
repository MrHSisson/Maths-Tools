// The numbers in the Estimation Depth bank (src/tools/Number/EstimationDepth.ts).
import { describe, it, expect } from "vitest";
import { ESTIMATION_DEPTH } from "../tools/Number/EstimationDepth";
import { MISCONCEPTIONS } from "../shared/misconceptions";

const sf1 = (n: number) => { const m = 10 ** Math.floor(Math.log10(Math.abs(n))); return Math.round(n / m) * m; };
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;

describe("Estimation Depth bank", () => {
  it("rounds and calculates as the items say", () => {
    expect([sf1(48), sf1(31), sf1(48) * sf1(31), 48 * 31]).toEqual([50, 30, 1500, 1488]);
    expect([sf1(794), sf1(587), sf1(31), sf1(587) / sf1(31)]).toEqual([800, 600, 30, 20]);
    expect([sf1(48), sf1(26), sf1(48) - sf1(26), 48 - 26]).toEqual([50, 30, 20, 22]);
    expect(near(sf1(0.39), 0.4) && near(sf1(6.1) / sf1(0.48), 12) && near(sf1(4.8) * sf1(0.39), 2)).toBe(true);
    for (const [a, b] of [[5.8, 0.47], [6.3, 0.52], [59, 4.8]]) expect(near(sf1(a) / sf1(b), 12)).toBe(true);
    expect(near(sf1(2.9) * sf1(4.1), 12)).toBe(true);
    expect((sf1(34) + sf1(21)) / sf1(11)).toBe(5);
    expect(sf1(34 + 21) / sf1(11)).toBe(6);
    expect([(sf1(82) * sf1(19)) / sf1(41), (82 * 19) / 41]).toEqual([40, 38]);
    expect([(sf1(47) + sf1(36)) / sf1(19), sf1(47 + 36) / sf1(19), Math.round(((47 + 36) / 19) * 100) / 100]).toEqual([4.5, 4, 4.37]);
    expect([(sf1(15) * sf1(15)) / sf1(15), Math.round((20 / 15 - 1) * 100)]).toEqual([20, 33]);
  });
  it("every tag names a shared misconception", () => {
    for (const i of ESTIMATION_DEPTH) for (const o of i.options ?? []) if (o.tag) expect(MISCONCEPTIONS[o.tag], `${i.id}: ${o.tag}`).toBeTruthy();
  });
});
