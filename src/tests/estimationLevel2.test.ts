import { describe, it, expect } from "vitest";
import { __test } from "../tools/Number/Estimation";
import { withSeededRandom } from "./seededRandom";

const { generateQuestion } = __test;
const OPS = ["add", "subtract", "multiply", "divide"];
const TYPES = ["num-mixed", "num-below1", "num-hundredths", "num-whole"];

const round1 = (x: number) => { const m = Math.pow(10, Math.floor(Math.log10(x))); return Number((Math.round(x / m) * m).toPrecision(1)); };
const ask = (op: string, type: string) => {
  const ms: Record<string, boolean> = Object.fromEntries([...OPS.map((o) => [o, o === op]), ...TYPES.map((t) => [t, t === type])]);
  const q = generateQuestion("estimation", "level2", {}, "", ms) as { display: string; answer: string };
  const [a, sym, b] = q.display.split(" ");
  return { a: Number(a.replace(/,/g, "")), b: Number(b.replace(/,/g, "")), sym, answer: Number(q.answer.replace(/,/g, "")) };
};
const apply = (sym: string, x: number, y: number) => sym === "+" ? x + y : sym === "−" ? x - y : sym === "×" ? x * y : x / y;

describe("Estimation Level 2 number types", () => {
  for (const type of TYPES) for (const op of OPS) {
    it(`${type} / ${op}: the answer is the product of the 1 s.f. numbers`, () => withSeededRandom(7, () => {
      for (let i = 0; i < 60; i++) {
        const { a, b, sym, answer } = ask(op, type);
        expect(Number(apply(sym, round1(a), round1(b)).toPrecision(10))).toBeCloseTo(answer, 8);
        if (type === "num-below1") { expect(a).toBeLessThan(1); expect(b).toBeLessThan(1); }
        if (type === "num-hundredths") expect(Math.min(a, b)).toBeLessThan(0.1);
        if (type === "num-hundredths") expect(Math.min(a, b)).toBeGreaterThanOrEqual(0.01);
        if (type === "num-whole") { expect(Number.isInteger(a) && Number.isInteger(b)).toBe(true); }
      }
    }));
  }
  it("hundredths questions include numbers that round at the hundredths place", () => withSeededRandom(3, () => {
    const seen = new Set<number>();
    for (let i = 0; i < 80; i++) { const { a, b } = ask("multiply", "num-hundredths"); [a, b].filter((v) => v < 0.1).forEach((v) => seen.add(round1(v))); }
    expect([...seen].every((v) => v >= 0.01 && v <= 0.1)).toBe(true);
    expect(seen.size).toBeGreaterThan(4);
  }));
});
