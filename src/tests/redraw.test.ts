// A generator that fails less than about 1 time in 100 is simply asked again (src/shared/helpers.ts: drawAgain, used by makeUniqueQ).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { drawAgain, makeUniqueQ } from "../shared/helpers";

const q = (key: string, extra: object = {}) => ({ key, ...extra });

describe("drawing again when a generator fails", () => {
  it("asks again after a throw and after a fall-back, and keeps the first good question", () => {
    const script = [() => { throw new Error("no network found"); }, () => q("fb", { _fallback: true }), () => q("good")];
    let i = 0;
    expect(drawAgain(() => script[i++]()).key).toBe("good");
    expect(i).toBe(3);
  });
  it("keeps the fall-back, rather than an error, when every draw is a fall-back", () => {
    let n = 0;
    expect(drawAgain(() => { n++; return q("fb", { _fallback: true }); }).key).toBe("fb");
    expect(n).toBe(4);                                          // the first draw and three more
  });
  it("throws the last error when every draw throws, so the shell can still name a real fault", () => {
    let n = 0;
    expect(() => drawAgain(() => { n++; throw new Error(`broken ${n}`); })).toThrow("broken 4");
  });
  it("does not draw again when the first draw is fine", () => {
    let n = 0;
    drawAgain(() => { n++; return q("ok"); });
    expect(n).toBe(1);
  });
  it("makeUniqueQ uses it: one bad draw in the middle of a worksheet never reaches the sheet", () => {
    let n = 0;
    const gen = () => { n++; return n % 2 === 1 ? q(`fb-${n}`, { _fallback: true }) : q(`q-${n}`); };
    const unique = makeUniqueQ(gen as never);
    const used = new Set<string>();
    const out = Array.from({ length: 5 }, () => unique("t", "level1" as never, {}, "", used) as { key: string; _fallback?: boolean });
    expect(out.some((x) => x._fallback)).toBe(false);
  });
});

describe("a tool's fall-back questions say so", () => {
  it("every fall-back question in the Ratio Manipulation files is marked `_fallback` (so the shell draws again)", () => {
    for (const f of ["ratioSimplifying", "ratioEquivalent", "ratioFractionOf"]) {
      const lines = readFileSync(`src/tools/Proportion/${f}.ts`, "utf8").split("\n");
      lines.forEach((l, i) => { if (/-fallback-|rtf-fallback/.test(l)) expect(lines.slice(i, i + 3).join(" "), `${f}.ts line ${i + 1}`).toContain("_fallback"); });
    }
  });
});
