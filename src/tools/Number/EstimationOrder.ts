import { pickActive, type AnyQuestion, type DifficultyLevel } from "../../shared";
import { evalOrder, orderQuestion, parseOrder, roundOrder, leavesOf, type OrderNode } from "../../shared/estimationOrder";
import { roundEstimationOperand } from "../../shared/estimationWorking";

// Estimating an expression with more than one operation (the "Order of Operations" sub-tool). Each level is a pool of expression shapes
// (a, b, c are numbers filled in at random); the shared engine (src/shared/estimationOrder.ts) rounds, orders and works each one.

const rnd = (lo: number, hi: number) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const choose = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];
const isRounded = (n: number) => roundEstimationOperand(n) === n;
const awkward = (n: number) => { const s = String(n); return s[0] === "5" || (s[0] === "9" && s[1] >= "5"); };

const n2 = () => rnd(12, 98), n3 = () => rnd(112, 988);
const d1 = () => Math.round((Math.random() * 8.6 + 1.2) * 10) / 10;   // 1.2 to 9.8, one decimal place

export const ORDER_OPTIONS: Record<string, { key: string; options: { value: string; label: string; defaultActive: boolean }[] }> = {
  level1: { key: "order1", options: [
    { value: "multiply", label: "× with + or −", defaultActive: true },
    { value: "divide",   label: "÷ with + or −", defaultActive: true },
  ] },
  level2: { key: "order2", options: [
    { value: "bracketMultiply", label: "Brackets and ×", defaultActive: true },
    { value: "bracketDivide",   label: "Brackets and ÷", defaultActive: true },
  ] },
  level3: { key: "order3", options: [
    { value: "decimals", label: "Decimals",  defaultActive: true },
    { value: "squares",  label: "Squares",   defaultActive: true },
  ] },
};

/** Each shape with the letters that may be a three-digit number in the whole-number levels (a term added or taken away, or the number
 *  divided): every other number is two-digit, so a product of two numbers stays a product of two two-digit numbers. */
const SHAPES: Record<string, [string, string][]> = {
  multiply: [["a + b * c", "a"], ["a - b * c", "a"], ["a * b + c", "c"], ["a * b - c", "c"]],
  divide: [["a + b / c", "ab"], ["a - b / c", "ab"], ["a / b + c", "ac"], ["a / b - c", "ac"]],
  bracketMultiply: [["(a + b) * c", ""], ["(a - b) * c", "a"], ["c * (a + b)", ""], ["c * (a - b)", "a"]],
  bracketDivide: [["(a + b) / c", ""], ["(a - b) / c", "a"], ["a / (b + c)", "a"], ["a / (b - c)", "a"]],
  squares: [["a ^ 2 + b", ""], ["a ^ 2 - b", ""], ["b + a ^ 2", ""], ["b - a ^ 2", ""], ["(a + b) ^ 2", ""], ["(a - b) ^ 2", ""]],
};
// decimals: every shape of the first two levels, with decimal numbers
const DECIMAL_SHAPES = [...SHAPES.multiply, ...SHAPES.divide, ...SHAPES.bracketMultiply, ...SHAPES.bracketDivide];
const hasDivision = (n: OrderNode): boolean => n.t === "n" ? false : n.t === "sq" ? hasDivision(n.x) : n.op === "/" || hasDivision(n.l) || hasDivision(n.r);

/** Every value the working passes through (each nested part and the whole), to check them. */
const values = (n: OrderNode): number[] => (n.t === "n" ? [] : n.t === "sq" ? [evalOrder(n), ...values(n.x)] : [evalOrder(n), ...values(n.l), ...values(n.r)]);
const oneDp = (x: number) => Math.abs(x * 10 - Math.round(x * 10)) < 1e-9;

function fill(shape: [string, string], level: DifficultyLevel, decimals: boolean): string {
  const [template, wide] = shape;
  return template.replace(/[abc]/g, (letter) => String(decimals ? (Math.random() < 0.75 ? d1() : n2()) : level !== "level3" && wide.includes(letter) && Math.random() < 0.5 ? n3() : n2()));
}

function build(level: DifficultyLevel, kind: string): AnyQuestion | null {
  const shapes = kind === "decimals" ? DECIMAL_SHAPES : SHAPES[kind];
  const decimals = kind === "decimals" || kind === "squares";
  const text = fill(choose(shapes), level, decimals);
  const raw = parseOrder(text), rounded = roundOrder(raw);
  const nums = leavesOf(raw);
  if (nums.some(isRounded) || new Set(nums).size !== nums.length) return null;           // every number needs rounding, and none repeats
  if (level !== "level3" && nums.some(awkward)) return null;                              // no leading 5 or 95+ in the whole-number levels
  const vs = values(rounded);
  if (vs.some((v) => v <= 0 || !oneDp(v) || v > 9999)) return null;
  if (level !== "level3" && vs.some((v) => !Number.isInteger(v))) return null;            // whole-number levels stay whole at every step
  if (level === "level3" && vs.some((v) => v >= 1000)) return null;
  if (leavesOf(rounded).some((v) => v === 1)) return null;                                   // no ×1 or ÷1 to skip over
  if (hasDivision(rounded) && vs.some((v, i) => v === 1 && i < vs.length)) return null;      // a quotient of 1 teaches nothing
  if (kind === "decimals" && vs.some((v) => !Number.isInteger(v)) && Math.random() < 0.5) return null;   // mostly whole steps, an occasional .5
  return orderQuestion(text, level as "level1" | "level2" | "level3", `est-oo-${text.replace(/\s+/g, "")}`);
}

const FALLBACK: Record<string, string> = { level1: "38 + 21 * 42", level2: "(48 + 31) * 19", level3: "7.8 ^ 2 + 19" };

export function generateOrder(level: DifficultyLevel, values_: Record<string, boolean>): AnyQuestion {
  const o = ORDER_OPTIONS[level];
  const kind = pickActive(values_, o.options);
  for (let att = 0; att < 400; att++) { const q = build(level, kind); if (q) return q; }
  return orderQuestion(FALLBACK[level], level as "level1" | "level2" | "level3");
}
