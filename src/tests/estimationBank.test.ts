import { describe, expect, it } from "vitest";
import { ESTIMATION_BANK } from "../decks/estimationBank";

// Read the authored expressions rather than maintain a second copy of the numbers or answers.
const sf = (n: number) => { if (!n) return 0; const unit = 10 ** Math.floor(Math.log10(n)); return Number((Math.round(n / unit) * unit).toPrecision(12)); };
const truncate = (n: number) => { if (!n) return 0; const unit = 10 ** Math.floor(Math.log10(n)); return Number((Math.floor(n / unit) * unit).toPrecision(12)); };
function parse(latex: string) {
  const fraction = latex.match(/^\\dfrac\{(.+)\}\{([\d.]+)\}$/);
  const expression = (fraction?.[1] ?? latex).match(/^([\d.]+)\s*(\\times|\\div|\+|-)\s*([\d.]+)$/);
  if (!expression) throw new Error(`Unsupported Estimation bank expression: ${latex}`);
  return { a: Number(expression[1]), b: Number(expression[3]), op: expression[2], denominator: fraction ? Number(fraction[2]) : undefined };
}
const calculate = (a: number, b: number, op: string) => op === "+" ? a + b : op === "-" ? a - b : op === "\\times" ? a * b : a / b;
const responseValue = (s: string) => { const bare = s.replace(/\$/g, ""); const fraction = bare.match(/^\\dfrac\{([\d.]+)\}\{([\d.]+)\}$/); return fraction ? Number(fraction[1]) / Number(fraction[2]) : Number(bare); };

describe("authored Estimation sequences", () => {
  for (const q of ESTIMATION_BANK) it(`${q.id}: correct rounding and the named wrong method produce the recorded results`, () => {
    const { a, b, op, denominator } = parse(q.latex);
    const divisor = denominator === undefined ? 1 : sf(denominator);
    const correct = calculate(sf(a), sf(b), op) / divisor;
    expect(Number(q.answer)).toBeCloseTo(correct, 10);
    const rounding = [...q.working[0].latex.matchAll(/([\d.]+)\s*\\to\s*([\d.]+)/g)];
    expect(rounding.length).toBe(denominator === undefined ? 2 : 3);
    for (const [, before, after] of rounding) expect(Number(after)).toBeCloseTo(sf(Number(before)), 10);
    let wrong: number;
    switch (q.tag) {
      case "estimation-calc-zeros": wrong = correct / 10; break;
      case "estimation-round-truncate": wrong = calculate(truncate(a), truncate(b), op) / divisor; break;
      case "estimation-round-wrong-place": wrong = calculate(Math.round(a / 10) * 10, Math.round(b / 10) * 10, op) / divisor; break;
      case "estimation-leading-zeros": wrong = calculate(a < 1 ? 0 : sf(a), b < 1 ? 0 : sf(b), op) / divisor; break;
      case "estimation-round-to-whole": wrong = calculate(Math.round(a), Math.round(b), op) / divisor; break;
      case "estimation-divide-decimal": wrong = sf(a) * sf(b); break;
      case "estimation-round-result": wrong = sf(calculate(a, b, op)) / divisor; break;
      default: throw new Error(`No misconception check for ${q.tag}`);
    }
    expect(responseValue(q.teaching!.expectedErrors[0].response)).toBeCloseTo(wrong, 10);
    expect(Math.abs(wrong - correct)).toBeGreaterThan(1e-9);
  });
});
