// Numeric claims in the Rounding Depth bank (src/tools/Number/RoundingDepth.ts).
// An independent, integer-only half-up rounder (no floating point) checks every fixed number.

import { describe, it, expect } from "vitest";

/** Round a decimal string to the unit 10^e (e may be negative), halfway rounds up. Returns the plain number as a string. */
function roundUnit(value: string, e: number): string {
  const [w, f = ""] = value.split(".");
  const scale = Math.max(f.length, -e, 0);
  const digits = BigInt(w + f.padEnd(scale, "0"));          // value × 10^scale
  const unit = BigInt(10) ** BigInt(e + scale);              // 10^e in the same scale (e + scale ≥ 0)
  const q = digits / unit, r = digits % unit;
  const rounded = (r * BigInt(2) >= unit ? q + BigInt(1) : q) * unit;
  const s = rounded.toString().padStart(scale + 1, "0");
  const out = scale === 0 ? s : `${s.slice(0, s.length - scale)}.${s.slice(s.length - scale)}`;
  return e < 0 ? out.slice(0, out.indexOf(".") + 1 + -e) : out.replace(/\.0*$/, "");
}
const dp = (v: string, n: number) => roundUnit(v, -n);
const sf = (v: string, n: number) => {
  const digs = v.replace(".", "").replace(/^0+/, "");
  const lead = (v.includes(".") ? v.split(".")[0].replace(/^0+/, "").length || -(v.split(".")[1].length - v.split(".")[1].replace(/^0+/, "").length + 1) + 1 : v.length);
  return roundUnit(v, (digs.length ? lead : 0) - n);
};

describe("Rounding Depth bank numeric claims", () => {
  it("helper sanity", () => {
    expect(roundUnit("350", 2)).toBe("400");
    expect(roundUnit("349", 2)).toBe("300");
    expect(dp("2.995", 2)).toBe("3.00");
  });
  it("Level 1", () => {
    expect(roundUnit("47", 1)).toBe("50");
    expect(roundUnit("86", 1)).toBe("90");
    expect(roundUnit("340", 1)).toBe("340");
    expect(roundUnit("3482", 2)).toBe("3500");
    expect(3450 < 3482).toBe(true);                       // halfway for 3,400–3,500
    expect(roundUnit("350", 2)).toBe("400");              // halfway rounds up
    expect(roundUnit("450", 2)).toBe("500");
    expect(roundUnit("449", 2)).toBe("400");
    expect(roundUnit("549", 2)).toBe("500");
    expect(roundUnit("550", 2)).toBe("600");
    expect(549 - 450 + 1).toBe(100);
    expect(roundUnit("43", 1)).toBe("40");
  });
  it("Level 2", () => {
    expect(roundUnit("31.04", 1)).toBe("30");
    expect(31.04 < 35).toBe(true);
    expect(roundUnit("482.6", 2)).toBe("500");
    expect(roundUnit("47.3", 1)).toBe("50");
    expect(roundUnit("3462", 3)).toBe("3000");
    expect(roundUnit("3462", 1)).toBe("3460");            // Tia's stages
    expect(roundUnit("3460", 2)).toBe("3500");
    expect(roundUnit("3500", 3)).toBe("4000");
    expect(dp("6.738", 2)).toBe("6.74");
    expect(dp("2.678", 2)).toBe("2.68");
    expect(dp("2.678", 1)).toBe("2.7");
    expect(dp("4.296", 2)).toBe("4.30");
    expect(roundUnit("64", 1)).toBe("60");
    expect(roundUnit("65", 1)).toBe("70");
    expect(roundUnit("74", 1)).toBe("70");
    expect(roundUnit("75", 1)).toBe("80");
    expect(74 - 65 + 1).toBe(10);
    expect(roundUnit("65.0", 1)).toBe("70");
    expect(roundUnit("74.9", 1)).toBe("70");
    expect(Math.round((74.9 - 65.0) * 10) + 1).toBe(100);
  });
  it("Level 3", () => {
    expect(roundUnit("396", 1)).toBe("400");
    expect(396 - 390).toBe(6); expect(400 - 396).toBe(4);
    expect(sf("0.00472", 2)).toBe("0.0047");
    expect(sf("0.00472", 1)).toBe("0.005");
    expect(sf("4726", 2)).toBe("4700");
    expect(sf("4726", 3)).toBe("4730");
    expect(sf("0.0384", 2)).toBe("0.038");
    expect(sf("0.0384", 1)).toBe("0.04");
    expect(dp("0.0996", 2)).toBe("0.10");
    expect(dp("2.995", 2)).toBe("3.00");
    // double rounding
    expect(roundUnit("2.46", 0)).toBe("2");
    expect(dp("2.46", 1)).toBe("2.5");
    expect(roundUnit("2.5", 0)).toBe("3");
    // the interval that rounds to 2.4 (1 d.p.)
    expect(dp("2.35", 1)).toBe("2.4");
    expect(dp("2.349", 1)).toBe("2.3");
    expect(dp("2.45", 1)).toBe("2.5");
    expect(dp("2.449", 1)).toBe("2.4");
    // sig figs vs decimal places
    expect(sf("0.00472", 3)).toBe("0.00472");
    expect(dp("0.00472", 2)).toBe("0.00");
    expect(sf("472.3", 3)).toBe("472");
    expect(dp("472.3", 2)).toBe("472.30");
  });
});
