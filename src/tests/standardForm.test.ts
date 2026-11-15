import { describe, it, expect } from "vitest";
import { __test } from "../tools/Number/StandardForm";
import { decStr, exactCoef, ordinary, round3sf, standardise } from "../tools/Number/StandardFormCore";

// Standard Form: every question's answer is recomputed here, from the numbers printed in the question, by a different route
// (scaled integers through BigInt) so the generator cannot agree with itself by accident.

const gen: (tool: string, level: string, msv: Record<string, boolean>) => any = (tool, level, msv) => (__test.generateQuestion as any)(tool, level, {}, "", msv);
const cfg: any = __test.TOOL_CONFIG;
const defaults = (tool: string, level: string): Record<string, boolean> => {
  const m: Record<string, boolean> = {};
  for (const p of cfg.tools[tool].difficultySettings[level].multiSelect) for (const o of p.options) m[o.value] = !!o.defaultActive;
  return m;
};
const everything = (tool: string, level: string): Record<string, boolean> => {
  const m = defaults(tool, level);
  for (const k of Object.keys(m)) m[k] = true;
  return m;
};

/** "4.5 \times 10^{-3}" → the exact value as a scaled BigInt: [integer, power of ten it is multiplied by]. */
const parseSF = (s: string): [bigint, number] => {
  const m = s.match(/(\d+(?:\.\d+)?) \\times 10\^\{(-?\d+)\}/);
  if (!m) throw new Error(`not standard form: ${s}`);
  const dp = (m[1].split(".")[1] ?? "").length;
  return [BigInt(m[1].replace(".", "")), Number(m[2]) - dp];
};
/** Add or subtract two [integer, exp] values exactly. */
const combine = (a: [bigint, number], b: [bigint, number], sign: 1n | -1n): [bigint, number] => {
  const e = Math.min(a[1], b[1]);
  return [a[0] * 10n ** BigInt(a[1] - e) + sign * b[0] * 10n ** BigInt(b[1] - e), e];
};
const same = (a: [bigint, number], b: [bigint, number]): boolean => {
  const e = Math.min(a[1], b[1]);
  return a[0] * 10n ** BigInt(a[1] - e) === b[0] * 10n ** BigInt(b[1] - e);
};
const inStandardForm = (answerLatex: string): boolean => {
  const c = Number(answerLatex.match(/^(\d+(?:\.\d+)?)/)![1]);
  return c >= 1 && c < 10;
};
const exprParts = (line: string): string[] => [...line.matchAll(/\(([^()]*)\)/g)].map((m) => m[1]);

describe("standard form core", () => {
  it("builds ordinary numbers and decimals from digits", () => {
    expect(ordinary("45", 4)).toBe("45000");
    expect(ordinary("72", -4)).toBe("0.00072");
    expect(ordinary("41", -1)).toBe("0.41");
    expect(ordinary("32", 1)).toBe("32");
    expect(ordinary("5", 0)).toBe("5");
    expect(decStr(325, 2)).toBe("3.25");
    expect(decStr(40, 1)).toBe("4");
  });
  it("standardises, and rounds half up to 3 s.f.", () => {
    expect(standardise(28, 1)).toEqual({ cN: 28, cD: 10, k: 1 });
    expect(standardise(7, 8)).toEqual({ cN: 70, cD: 8, k: -1 });
    expect(exactCoef(70, 8, 2)).toBe("8.75");
    expect(exactCoef(1, 3, 2)).toBeNull();
    expect(round3sf(1625, 1000)).toBe("1.63");
    expect(round3sf(9996, 1000)).toBeNull();
  });
});

describe("converting", () => {
  for (const level of ["level1", "level2"]) {
    it(`${level}: the answer is the question's value, in the right form and range`, () => {
      for (let i = 0; i < 200; i++) {
        const q = gen("converting", level, everything("converting", level));
        const toStd = q.lines[0].startsWith("Write in standard form");
        const shown = q.lines[1].replace(/^\$|\$$/g, "").replace(/\{,\}/g, "");
        if (toStd) {
          // the ordinary number shown equals the standard form given as the answer
          const dp = (shown.split(".")[1] ?? "").length;
          expect(inStandardForm(q.answerLatex)).toBe(true);
          expect(same([BigInt(shown.replace(".", "")), -dp], parseSF(q.answerLatex))).toBe(true);
        } else {
          const [v, e] = parseSF(shown);
          const ord = q.answerLatex.replace(/\{,\}/g, "");
          const dp = (ord.split(".")[1] ?? "").length;
          expect(same([BigInt(ord.replace(".", "")), -dp], [v, e])).toBe(true);
        }
        const p = Number(q.answerLatex.match(/10\^\{(-?\d+)\}/)?.[1] ?? (q.lines[1].match(/10\^\{(-?\d+)\}/)?.[1]));
        if (level === "level1") expect(p).toBeGreaterThan(0);
        if (level === "level2") expect(p).toBeLessThan(0);
      }
    });
  }
  it("level 3: a coefficient outside 1 to 10 times a power is rewritten into standard form with the same value", () => {
    const seen = { big: 0, small: 0, pos: 0, neg: 0 };
    for (let i = 0; i < 300; i++) {
      const q = gen("converting", "level3", defaults("converting", "level3"));
      const shown = q.lines[1].replace(/^\$|\$$/g, "");
      const m = shown.match(/^(\d+(?:\.\d+)?) \\times 10\^\{(-?\d+)\}$/)!;
      const given = parseSF(shown), answer = parseSF(q.answerLatex);
      expect(same(given, answer)).toBe(true);
      expect(inStandardForm(q.answerLatex)).toBe(true);
      const c = Number(m[1]);
      expect(c < 1 || c >= 10).toBe(true);                 // the coefficient given is never already standard form
      if (c >= 10) seen.big++; else seen.small++;
      if (Number(m[2]) > 0) seen.pos++; else seen.neg++;
      expect(q.answerLatex).not.toMatch(/10\^\{0\}/);
      expect(q.lines[0]).toBe("Write in standard form:");
    }
    expect(Object.values(seen).every((n) => n > 40)).toBe(true);
  });
  it("level 3 options: Too Big and Too Small, Starting Power positive and negative, are each honoured", () => {
    const m = defaults("converting", "level3");
    for (const [coef, sign] of [["tooBig", 1], ["tooSmall", 1], ["tooBig", -1], ["tooSmall", -1]] as const) {
      m.tooBig = coef === "tooBig"; m.tooSmall = coef === "tooSmall"; m.startPos = sign === 1; m.startNeg = sign === -1;
      for (let i = 0; i < 40; i++) {
        const shown = gen("converting", "level3", m).lines[1].replace(/^\$|\$$/g, "");
        const [, c, n] = shown.match(/^(\d+(?:\.\d+)?) \\times 10\^\{(-?\d+)\}$/)!;
        expect(Number(c) >= 10).toBe(coef === "tooBig");
        expect(Math.sign(Number(n))).toBe(sign);
      }
    }
  });
  it("internal zeros: the coefficient has a 0 between non-zero digits", () => {
    const m = defaults("converting", "level1"); m.d3 = true; m.withZero = true; m.noZero = false;
    for (let i = 0; i < 50; i++) {
      const q = gen("converting", "level1", m);
      const coefficient = (q.answerLatex + q.lines[1]).match(/(\d\.\d+) \\times/)![1];
      expect(coefficient).toMatch(/^[1-9]\.0[1-9]$/);
    }
  });
});

describe("multiplying and dividing", () => {
  for (const level of ["level1", "level2", "level3"]) {
    it(`${level}: the answer is exact, in standard form, and the level's property holds`, () => {
      for (let i = 0; i < 300; i++) {
        const msv = everything("multiplyDivide", level);
        const q = gen("multiplyDivide", level, msv);
        const divide = q.lines[1].includes("\\div");
        const [a, b] = exprParts(q.lines[1]).map(parseSF);
        const calc = q.lines[0].includes("3 significant");
        const [r, re] = parseSF(q.answerLatex);
        expect(inStandardForm(q.answerLatex)).toBe(true);
        // a × b = r exactly, or r × b = a for division (a rounded answer is checked to 3 s.f. below)
        const lhs = divide ? a : [a[0] * b[0], a[1] + b[1]] as [bigint, number];
        const rhs = divide ? ([r * b[0], re + b[1]] as [bigint, number]) : ([r, re] as [bigint, number]);
        if (!calc) expect(same(lhs, rhs)).toBe(true);
        else {
          const truth = divide ? Number(a[0]) / Number(b[0]) * 10 ** (a[1] - b[1]) : Number(a[0] * b[0]) * 10 ** (a[1] + b[1]);
          const got = Number(r) * 10 ** re;
          expect(Math.abs(got - truth) / truth).toBeLessThan(0.006);
          expect(q.answerLatex).toMatch(/^\d\.\d\d \\times/);
        }
        const adjusted = q.working.some((w: any) => /must be between 1 and 10/.test(w.label ?? ""));
        expect(adjusted).toBe(level !== "level1");
        const powers = exprParts(q.lines[1]).map((s) => Number(s.match(/10\^\{(-?\d+)\}/)![1]));
        if (level === "level3") expect(powers.some((p) => p < 0)).toBe(true);
        else expect(powers.every((p) => p > 0)).toBe(true);
      }
    });
  }
});

describe("adding and subtracting", () => {
  for (const level of ["level1", "level2", "level3"]) {
    it(`${level}: the answer is exact and the gap between the powers is the level's`, () => {
      for (let i = 0; i < 300; i++) {
        const q = gen("addSubtract", level, everything("addSubtract", level));
        const sub = q.lines[1].includes(") - (");
        const [a, b] = exprParts(q.lines[1]).map(parseSF);
        const [r, re] = parseSF(q.answerLatex);
        expect(same(combine(a, b, sub ? -1n : 1n), [r, re])).toBe(true);
        expect(inStandardForm(q.answerLatex)).toBe(true);
        expect(r > 0n).toBe(true);
        const powers = exprParts(q.lines[1]).map((s) => Number(s.match(/10\^\{(-?\d+)\}/)![1]));
        const gap = Math.abs(powers[0] - powers[1]);
        if (level === "level1") expect(gap).toBe(0);
        if (level === "level2") expect(gap).toBe(1);
        if (level === "level3") expect(gap).toBeGreaterThanOrEqual(2);
      }
    });
  }
  it("the Result option is honoured (levels 1 and 2): Already Standard means no adjusting step, Needs Adjusting means one", () => {
    for (const level of ["level1", "level2"]) {
      for (const [opt, expected] of [["std", false], ["adjust", true]] as const) {
        const m = defaults("addSubtract", level);
        m.std = opt === "std"; m.adjust = opt === "adjust"; m.toSmaller = false; m.toLarger = true;
        for (let i = 0; i < 40; i++) {
          const q = gen("addSubtract", level, m);
          expect(q.working.some((w: any) => /must be between 1 and 10/.test(w.label ?? ""))).toBe(expected);
        }
      }
    }
  });
  it("level 3: matching to the larger power never needs adjusting, matching to the smaller always does", () => {
    for (const [smaller, expected] of [[false, false], [true, true]] as const) {
      const m = defaults("addSubtract", "level3"); m.toSmaller = smaller; m.toLarger = !smaller;
      for (let i = 0; i < 60; i++) expect(gen("addSubtract", "level3", m).working.some((w: any) => /must be between 1 and 10/.test(w.label ?? ""))).toBe(expected);
    }
  });
  it("every combination of options still makes a question", () => {
    for (const level of ["level1", "level2", "level3"]) for (const std of [true, false]) for (const sm of [true, false]) {
      const m = defaults("addSubtract", level); m.std = std; m.adjust = !std; m.toSmaller = sm; m.toLarger = !sm; m.add = true; m.subtract = false;
      for (let i = 0; i < 15; i++) expect(() => gen("addSubtract", level, m)).not.toThrow();
    }
  });
});

describe("converting: the place value grid (digits move a column at a time, the power changes by 1)", () => {
  const SUPMAP: Record<string, string> = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-" };
  const exponentOf = (heading: string): number => Number([...heading.slice(2)].map((c) => SUPMAP[c]).join(""));
  const PLACES = ["M", "HTh", "TTh", "Th", "H", "T", "O", "t", "h", "th", "tth", "hth", "mth"];
  /** The exponent of a place value heading: O is 10⁰, T is 10¹, t is 10⁻¹ … */
  const placeExp = (heading: string): number => { const i = PLACES.indexOf(heading); if (i < 0) throw new Error(`not a place value heading: ${heading}`); return 6 - i; };
  const table = (step: any) => step.extra.table;
  /** The rows a step has written (a blank row has no power). */
  const written = (t: any) => t.rows.map((r: any) => r.cells.map((c: any) => (typeof c === "string" ? { v: c } : c))).filter((cells: any[]) => cells[cells.length - 1].v !== "");
  const OFFSET = 40;
  /** The exact value of a row: its digits at their column exponents, times the power beside it (scaled by 10^OFFSET so it is an integer). */
  const valueOf = (t: any, cells: any[]): bigint => {
    const power = exponentOf(cells[cells.length - 1].v);
    let v = 0n;
    cells.slice(0, -1).forEach((c: any, i: number) => { if (c.v !== "") v += BigInt(c.v) * 10n ** BigInt(placeExp(t.columns[i]) + power + OFFSET); });
    return v;
  };
  const truth = (q: any): bigint => {
    const text = q.lines[1].replace(/^\$|\$$/g, "").replace(/\{,\}/g, "");
    if (text.includes("\\times")) { const [i, e] = parseSF(text); return i * 10n ** BigInt(e + OFFSET); }
    const dp = (text.split(".")[1] ?? "").length;
    return BigInt(text.replace(".", "")) * 10n ** BigInt(OFFSET - dp);
  };

  for (const level of ["level1", "level2", "level3"]) {
    it(`${level}: every row is the same value, the power changes by 1 a row, and it ends in the right place`, () => {
      for (let i = 0; i < 150; i++) {
        const q = gen("converting", level, everything("converting", level));
        const toOrd = q.lines[0].startsWith("Write as");
        const spec = q._grid;
        expect(q.working.length).toBe(Math.abs(spec.fEnd - spec.fStart) + 1);
        const want = truth(q);
        let previous: number | null = null;
        q.working.forEach((step: any, k: number) => {
          const t = table(step);
          const rows = written(t);
          expect(rows.length).toBe(k + 1);                                       // one more row written each step
          expect(t.columns[t.columns.length - 1]).toBe("Power");
          rows.forEach((cells: any[]) => expect(valueOf(t, cells)).toBe(want));  // the digits and the power always make the same number
          const power = exponentOf(rows[rows.length - 1][rows[rows.length - 1].length - 1].v);
          if (previous !== null) expect(Math.abs(power - previous)).toBe(1);
          previous = power;
          expect(t.rows.length).toBe(q.working.length);                          // the table never changes size
        });
        // the last row: standard form has its first digit in the ones column; an ordinary number has the power 10⁰
        const t = table(q.working[q.working.length - 1]);
        const cells = written(t)[q.working.length - 1];
        const onesCol = t.onesIndex;
        const finalPower = exponentOf(cells[cells.length - 1].v);
        if (toOrd) expect(finalPower).toBe(0);
        else {
          expect(cells[onesCol].v).not.toBe("");
          expect(cells[onesCol].v).not.toBe("0");
          expect(cells.slice(0, onesCol).every((c: any) => c.v === "")).toBe(true);
          expect(finalPower).toBe(Number(q.answerLatex.match(/10\^\{(-?\d+)\}/)![1]));
        }
      }
    });
  }
  it("the headings are the standard place value letters, consecutive, with the ones column where the point is drawn", () => {
    for (const level of ["level1", "level2", "level3"]) for (let i = 0; i < 100; i++) {
      const q = gen("converting", level, everything("converting", level));
      const t = table(q.working[0]);
      const places = t.columns.slice(0, -1);
      places.forEach((h: string, k: number) => { if (k > 0) expect(placeExp(h)).toBe(placeExp(places[k - 1]) - 1); });
      expect(places[t.onesIndex]).toBe("O");
      expect(t.columnNames[t.onesIndex]).toBe("Ones");
    }
  });
  it("the digits move right and the power goes up for large numbers, left and down for small ones", () => {
    const up = gen("converting", "level1", { toStd: true, toOrd: false, d2: true, noZero: true });
    const rows = written(table(up.working[up.working.length - 1]));
    const powers = rows.map((c: any[]) => exponentOf(c[c.length - 1].v));
    expect(powers).toEqual(powers.map((_: number, i: number) => i));            // 10⁰, 10¹, 10², …
    const down = gen("converting", "level2", { toStd: true, toOrd: false, d2: true, noZero: true });
    const powers2 = written(table(down.working[down.working.length - 1])).map((c: any[]) => exponentOf(c[c.length - 1].v));
    expect(powers2).toEqual(powers2.map((_: number, i: number) => (i === 0 ? 0 : -i)));         // 10⁰, 10⁻¹, 10⁻², …
  });
  it("the whiteboard scaffold: an empty grid, and the same size once the answer is shown", async () => {
    const { gridBlank, gridFinal } = await import("../tools/Number/StandardFormGrid");
    for (const level of ["level1", "level2", "level3"]) for (let i = 0; i < 40; i++) {
      const q = gen("converting", level, everything("converting", level));
      const blank = gridBlank(q._grid), filled = gridFinal(q._grid);
      expect(blank.columns).toEqual(filled.columns);
      expect(blank.rows.length).toBe(filled.rows.length);
      expect(blank.rows.every((r: any) => r.cells.every((c: any) => c === ""))).toBe(true);
      expect(filled.rows.every((r: any) => r.cells[r.cells.length - 1] !== "")).toBe(true);
    }
  });
});
