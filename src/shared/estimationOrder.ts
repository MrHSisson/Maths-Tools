// Estimating an expression with more than one operation: round every number to 1 s.f., then work the rounded expression in the order
// of operations (brackets or squares first, then × ÷, then + −). One small engine builds the question, its answer and its working from
// an expression such as "38 + 21 * 4.9" or "(48 - 19) / 6.1", so the Estimation generator and the questions authored in a deck use the
// same method, labels and reveal steps. Operators in the text form: + - * /, brackets, and ^2 for a square.
import { mStep } from "./helpers";
import { formatNumber, texNumber } from "./math";
import { estimationWorking, roundEstimationOperand } from "./estimationWorking";
import type { AnyQuestion, WorkingStep } from "./types";

type Op = "+" | "-" | "*" | "/";
export type OrderNode =
  | { t: "n"; v: number }
  | { t: "op"; op: Op; l: OrderNode; r: OrderNode; paren?: boolean }
  | { t: "sq"; x: OrderNode };

// ── parsing: expr := term ((+|-) term)* ; term := factor ((*|/) factor)* ; factor := (number | "(" expr ")") ["^2"] ──
export function parseOrder(text: string): OrderNode {
  const src = text.replace(/\s+/g, "");
  let i = 0;
  const peek = () => src[i];
  const factor = (): OrderNode => {
    let node: OrderNode;
    if (peek() === "(") { i++; node = expr(); if (peek() !== ")") throw new Error(`Missing ) in ${text}`); i++; if (node.t === "op") node = { ...node, paren: true }; }
    else {
      const m = /^\d+(\.\d+)?/.exec(src.slice(i));
      if (!m) throw new Error(`Expected a number at "${src.slice(i)}" in ${text}`);
      i += m[0].length; node = { t: "n", v: Number(m[0]) };
    }
    if (src.startsWith("^2", i)) { i += 2; node = { t: "sq", x: node }; }
    return node;
  };
  const term = (): OrderNode => { let l = factor(); while (peek() === "*" || peek() === "/") { const op = src[i++] as Op; l = { t: "op", op, l, r: factor() }; } return l; };
  const expr = (): OrderNode => { let l = term(); while (peek() === "+" || peek() === "-") { const op = src[i++] as Op; l = { t: "op", op, l, r: term() }; } return l; };
  const root = expr();
  if (i !== src.length) throw new Error(`Unexpected "${src.slice(i)}" in ${text}`);
  return root;
}

const apply = (op: Op, a: number, b: number): number => (op === "+" ? a + b : op === "-" ? a - b : op === "*" ? a * b : a / b);
const clean = (x: number): number => Number(x.toPrecision(12));
export function evalOrder(n: OrderNode): number {
  if (n.t === "n") return n.v;
  if (n.t === "sq") return clean(evalOrder(n.x) ** 2);
  return clean(apply(n.op, evalOrder(n.l), evalOrder(n.r)));
}
/** The same expression with every number rounded to 1 s.f. */
export const roundOrder = (n: OrderNode): OrderNode =>
  n.t === "n" ? { t: "n", v: roundEstimationOperand(n.v) } : n.t === "sq" ? { t: "sq", x: roundOrder(n.x) } : { ...n, l: roundOrder(n.l), r: roundOrder(n.r) };
/** Every number in reading order. */
export const leavesOf = (n: OrderNode): number[] => (n.t === "n" ? [n.v] : n.t === "sq" ? leavesOf(n.x) : [...leavesOf(n.l), ...leavesOf(n.r)]);

const SYM: Record<Op, { tex: string; plain: string }> = { "+": { tex: "+", plain: "+" }, "-": { tex: "-", plain: "−" }, "*": { tex: "\\times", plain: "×" }, "/": { tex: "\\div", plain: "÷" } };
const render = (n: OrderNode, tex: boolean): string => {
  const num = (v: number) => (tex ? texNumber(v) : formatNumber(v));
  if (n.t === "n") return num(n.v);
  if (n.t === "sq") return n.x.t === "n" ? `${num(n.x.v)}${tex ? "^2" : "²"}` : `${n.x.t === "op" && n.x.paren ? render(n.x, tex) : `(${render(n.x, tex)})`}${tex ? "^2" : "²"}`;
  const body = `${render(n.l, tex)} ${tex ? SYM[n.op].tex : SYM[n.op].plain} ${render(n.r, tex)}`;
  return n.paren ? `(${body})` : body;
};
const orderLatex = (n: OrderNode) => render(n, true);
const orderPlain = (n: OrderNode) => render(n, false);

const isLeaf = (n: OrderNode) => n.t === "n";
const FIRST: Record<Op, string> = { "+": "Add first:", "-": "Subtract first:", "*": "Multiply first:", "/": "Divide first:" };
const THEN: Record<Op, string> = { "+": "Then add:", "-": "Then subtract:", "*": "Then multiply:", "/": "Then divide:" };

/** The calculation steps for an already-rounded expression: the inner operation first, then the outer one. */
function orderSteps(rounded: OrderNode): WorkingStep[] {
  const num = (v: number) => texNumber(v);
  if (rounded.t === "sq") {
    if (isLeaf(rounded.x)) return [mStep("Calculate:", `${orderLatex(rounded)} = ${num(evalOrder(rounded))}`)];
    const inner = evalOrder(rounded.x);
    return [mStep("Brackets first:", `${orderLatex(rounded.x.t === "op" ? { ...rounded.x, paren: true } : rounded.x)} = ${num(inner)}`), mStep("Then square:", `${num(inner)}^2 = ${num(evalOrder(rounded))}`)];
  }
  if (rounded.t === "n") return [];
  const innerSide = isLeaf(rounded.l) ? "r" : "l";
  const inner = innerSide === "l" ? rounded.l : rounded.r;
  if (isLeaf(rounded.l) && isLeaf(rounded.r)) return [mStep("Calculate:", `${orderLatex(rounded)} = ${num(evalOrder(rounded))}`)];
  if (!isLeaf(rounded.l) && !isLeaf(rounded.r)) throw new Error("orderSteps handles one nested operation");
  const innerValue = evalOrder(inner);
  const innerLabel = inner.t === "sq" ? "Square first:" : inner.t === "op" && inner.paren ? "Brackets first:" : FIRST[(inner as Extract<OrderNode, { t: "op" }>).op];
  const innerLatex = orderLatex(inner);
  const outer = innerSide === "l" ? { ...rounded, l: { t: "n", v: innerValue } as OrderNode, paren: false } : { ...rounded, r: { t: "n", v: innerValue } as OrderNode, paren: false };
  return [mStep(innerLabel, `${innerLatex} = ${num(innerValue)}`), mStep(THEN[rounded.op], `${orderLatex(outer)} = ${num(evalOrder(rounded))}`)];
}

/** One estimate question for an expression, with the same working as the Estimation generator. `difficulty` is the tool level. */
export function orderQuestion(expression: string, difficulty: "level1" | "level2" | "level3", key?: string): AnyQuestion {
  const raw = parseOrder(expression), rounded = roundOrder(raw);
  const answer = evalOrder(rounded);
  const rounding = leavesOf(raw).map((v, i) => `${texNumber(v)} \\to ${texNumber(leavesOf(rounded)[i])}`).join(", \\quad ");
  return {
    kind: "simple",
    display: orderPlain(raw),
    displayLatex: orderLatex(raw),
    answer: formatNumber(Number.isInteger(answer) ? answer : Number(answer.toFixed(1))),
    working: estimationWorking(orderLatex(raw), rounding, orderSteps(rounded)),
    key: key ?? `est-oo-${expression.replace(/\s+/g, "")}`,
    difficulty,
  };
}
