// Numeric claims in the Speed, Distance & Time Depth bank (src/tools/Proportion/SpeedDistanceTimeDepth.ts).
// Exact fractions (no floating point) check every fixed number.

import { describe, it, expect } from "vitest";
import { DEPTH_ITEMS } from "../tools/Proportion/SpeedDistanceTimeDepth";

type Q = [number, number]; // [numerator, denominator]
const q = (n: number, d = 1): Q => { const g = (a: number, b: number): number => (b ? g(b, a % b) : Math.abs(a)); const k = g(n, d) || 1; return [n / k, d / k]; };
const mul = (a: Q, b: Q) => q(a[0] * b[0], a[1] * b[1]);
const div = (a: Q, b: Q) => q(a[0] * b[1], a[1] * b[0]);
const eq = (a: Q, n: number, d = 1) => expect(a).toEqual(q(n, d));
const hours = (h: number, m = 0): Q => q(60 * h + m, 60);

describe("Speed, Distance & Time Depth bank numeric claims", () => {
  it("bank has the expected size and every tab-specific tool exists", () => {
    expect(DEPTH_ITEMS.length).toBe(39);
    for (const i of DEPTH_ITEMS) if (i.tool) for (const k of ([] as string[]).concat(i.tool)) expect(["speed", "distance", "time", "mixed"]).toContain(k);
  });
  it("Level 1", () => {
    eq(div(q(150), q(3)), 50);                 // Bea: 150 miles in 3 h = 50 mph
    eq(mul(q(150), q(3)), 450);                // Ali's wrong 450
    eq(div(q(60), q(15)), 4);                  // cyclist 60 km at 15 km/h = 4 h
    eq(mul(q(80), q(3)), 240);                 // train 80 km/h for 3 h
    eq(div(q(100), q(20)), 5);                 // 100 m in 20 s = 5 m/s
    eq(mul(q(5), q(18, 5)), 18);               // 5 m/s = 18 km/h (x 3.6)
    eq(mul(q(12), q(5)), 60);                  // explain-multiply: 12 km/h for 5 h
    expect(12 / 5).toBeCloseTo(2.4);
    eq(mul(q(60), q(2)), 120);                 // Zane
    eq(div(q(3), q(150)), 1, 50);              // 3 km at 150 km/h = 0.02 h
    expect((3 / 150) * 60 * 60).toBeCloseTo(72); // 1 min 12 s = 72 s
    eq(div(q(20), q(5)), 4);                   // Ravi's rule gives 4
    eq(mul(q(5), q(20)), 100);
    eq(mul(q(40), q(2)), 80); eq(mul(q(40), q(3)), 120);
  });
  it("Added items", () => {
    eq(div(q(120), q(2)), 60); eq(div(q(90), q(30)), 3); eq(div(q(30), q(60)), 1, 2);
    eq(mul(q(18), hours(0, 20)), 6); eq(mul(q(12), hours(0, 30)), 6);
    eq(mul(q(45), hours(1, 20)), 60); eq(div(q(15), q(20)), 3, 4); expect(45 * 1.2).toBeCloseTo(54);
  });
  it("Level 2", () => {
    eq(hours(0, 45), 3, 4);                    // 45 min = 0.75 h
    expect(0.45 * 60).toBeCloseTo(27);
    eq(mul(q(60), hours(0, 30)), 30);          // Lena
    eq(div(q(8), hours(0, 20)), 24);           // 8 km in 20 min = 24 km/h
    eq(div(q(8), q(20)), 2, 5);                // 0.4 km per minute
    eq(mul(q(90), hours(0, 20)), 30);          // 90 km/h for 20 min
    eq(div(q(40), q(80)), 1, 2);               // 0.5 h = 30 min
    eq(mul(div(q(40), q(80)), q(60)), 30);
    eq(div(q(45), hours(0, 30)), 90);          // 45 miles in 30 min
    eq(hours(0, 15), 1, 4);                    // 15 min = 0.25 h, not 0.15
    eq(mul(q(48), hours(0, 15)), 12);
    expect(0.15 * 60).toBeCloseTo(9);
    expect(48 * 0.15).toBeCloseTo(7.2);
    eq(div(q(6), q(30)), 1, 5);                // Mo: 0.2 km per minute
    eq(mul(div(q(6), q(30)), q(60)), 12);
    eq(div(q(6), hours(0, 30)), 12);
    eq(div(q(90), q(60)), 3, 2);               // 1.5 h
    expect(5400 / 24).toBeGreaterThan(200);    // 5400 h = 225 days
    eq(mul(q(60), div(q(1), q(60))), 1);       // 60 mph = 1 mile per minute
    eq(mul(q(60), hours(1, 30)), 90);
    eq(div(q(20), hours(0, 30)), 40);          // journey A
    eq(div(q(35), q(1)), 35);                  // journey B
  });
  it("Level 3", () => {
    eq(hours(1, 20), 4, 3);                    // 1 h 20 min = 4/3 h
    expect(1.2 * 60).toBeCloseTo(72);          // 1.2 h = 1 h 12 min
    eq(div(q(30), hours(1, 30)), 20);          // 30 km in 1 h 30
    expect(30 / 130).toBeCloseTo(0.23, 2);
    eq(mul(q(30), q(3, 2)), 45);               // 30 km/h for 1.5 h
    eq(mul(q(12), hours(0, 40)), 8);           // 12 km/h for 40 min
    expect(12 * 0.4).toBeCloseTo(4.8);
    expect(0.4 * 60).toBeCloseTo(24);
    eq(div(q(140), q(80)), 7, 4);              // 1.75 h
    eq(mul(q(3, 4), q(60)), 45);               // 0.75 h = 45 min
    eq(div(q(72000), q(3600)), 20);            // 72 km/h = 20 m/s
    expect(72 * 3.6).toBeCloseTo(259.2);
    eq(div(q(60), q(30)), 2); eq(div(q(60), q(60)), 1);   // Dev: 2 h out, 1 h back
    eq(div(q(120), q(3)), 40);                 // average 40 mph, not 45
    eq(div(q(120), q(40)), 3); eq(div(q(120), q(80)), 3, 2); // double speed halves time
    eq(hours(1, 20), 4, 3);
    eq(div(q(16), q(80)), 1, 5);               // 0.2 km per minute
    eq(mul(div(q(16), q(80)), q(60)), 12);
    eq(div(q(16), hours(1, 20)), 12);
    eq(mul(q(16), hours(1, 30)), 24);          // mixed make-your-own
    eq(div(q(24), hours(1, 30)), 16);
    eq(div(q(24), q(16)), 3, 2);
    expect(0.4 * 100).toBe(40);                // the wrong step
    expect(2 + 40 / 60).toBeCloseTo(2.667, 2); // 2 h 40 min
  });
});
