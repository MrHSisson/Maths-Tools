import { describe, it, expect } from "vitest";
import { exactValues, decimalValues, radText, SPECIALS, degToRadWorking, radToDegWorking, norm360 } from "../tools/Interactive/unitCircleMath";

describe("unit circle exact values", () => {
  it("matches the standard table", () => {
    expect(exactValues(0)).toEqual({ sin: "0", cos: "1", tan: "0" });
    expect(exactValues(30)).toEqual({ sin: "1/2", cos: "√3/2", tan: "√3/3" });
    expect(exactValues(45)).toEqual({ sin: "√2/2", cos: "√2/2", tan: "1" });
    expect(exactValues(120)).toEqual({ sin: "√3/2", cos: "−1/2", tan: "−√3" });
    expect(exactValues(135)).toEqual({ sin: "√2/2", cos: "−√2/2", tan: "−1" });
    expect(exactValues(210)).toEqual({ sin: "−1/2", cos: "−√3/2", tan: "√3/3" });
    expect(exactValues(270)).toEqual({ sin: "−1", cos: "0", tan: "undefined" });
    expect(exactValues(330)).toEqual({ sin: "−1/2", cos: "√3/2", tan: "−√3/3" });
    expect(exactValues(50)).toBeNull();
  });
  it("agrees with the decimals for every marked angle", () => {
    const val = (t: string): number => {
      if (t === "undefined") return NaN;
      const neg = t.startsWith("−"); const b = neg ? t.slice(1) : t;
      const f = (x: string) => (x.startsWith("√") ? Math.sqrt(Number(x.slice(1))) : Number(x));
      const [n, d] = b.split("/");
      return (neg ? -1 : 1) * f(n) / (d ? f(d) : 1);
    };
    for (const s of SPECIALS) {
      const e = exactValues(s.deg)!, d = decimalValues(s.deg);
      expect(val(e.sin)).toBeCloseTo(d.sin, 9);
      expect(val(e.cos)).toBeCloseTo(d.cos, 9);
      if (d.tan === null) expect(e.tan).toBe("undefined"); else expect(val(e.tan)).toBeCloseTo(d.tan, 9);
    }
  });
  it("converts degrees and radians", () => {
    expect(radText(0)).toBe("0");
    expect(radText(30)).toBe("π/6");
    expect(radText(150)).toBe("5π/6");
    expect(radText(180)).toBe("π");
    expect(radText(270)).toBe("3π/2");
    expect(radText(360)).toBe("2π");
    expect(radText(50)).toBe("5π/18");
    expect(degToRadWorking(150)).toEqual(["150° × π/180", "150π/180", "5π/6"]);
    expect(radToDegWorking(150)).toEqual(["5π/6 × 180/π", "5 × 180/6", "150°"]);
    expect(radToDegWorking(180)).toEqual(["π × 180/π", "1 × 180", "180°"]);
  });
});

describe("unit circle radians", () => {
  it("writes negative angles in radians", () => {
    expect(radText(-30)).toBe("−π/6");
    expect(radText(-90)).toBe("−π/2");
    expect(radText(-150)).toBe("−5π/6");
  });
});

describe("unit circle beyond one turn", () => {
  it("finds the matching position within one turn", () => {
    expect(norm360(-30)).toBe(330);
    expect(norm360(390)).toBe(30);
    expect(norm360(-360)).toBe(0);
    expect(norm360(720)).toBe(0);
    expect(norm360(-180)).toBe(180);
  });
  it("gives exact values for negative angles and angles beyond a turn", () => {
    expect(exactValues(-30)).toEqual(exactValues(330));
    expect(exactValues(390)).toEqual(exactValues(30));
    expect(exactValues(-150)).toEqual({ sin: "−1/2", cos: "−√3/2", tan: "√3/3" });
  });
  it("converts them, with proper minus signs", () => {
    expect(radText(390)).toBe("13π/6");
    expect(radText(540)).toBe("3π");
    expect(radText(-360)).toBe("−2π");
    expect(degToRadWorking(-30)).toEqual(["−30° × π/180", "−30π/180", "−π/6"]);
    expect(degToRadWorking(390)).toEqual(["390° × π/180", "390π/180", "13π/6"]);
    expect(radToDegWorking(-30)).toEqual(["−π/6 × 180/π", "−1 × 180/6", "−30°"]);
    expect(radToDegWorking(540)).toEqual(["3π × 180/π", "3 × 180", "540°"]);
  });
});
