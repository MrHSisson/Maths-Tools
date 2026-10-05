// ═══════════════════════════════════════════════════════════════════════════════
// ORDER OF OPERATIONS (BIDMAS) — see specs/order-of-operations.md
//
// Two sub-tools:
//   Evaluate            — work out an expression; the working rewrites the line one
//                         BIDMAS stage at a time, highlighting what is done next.
//   Brackets & Mistakes — insert one pair of brackets to make a statement true, or
//                         find the mistake in a student's answer.
//
// Everything is driven by one small expression engine (section 1): an expression is
// a tree, the SAME stepper produces the working, the answer and the generator's
// validity checks, and a separate straight evaluator cross-checks it (tests).
// ═══════════════════════════════════════════════════════════════════════════════

import {
  ToolShell,
  type ToolConfig,
  type InfoSection,
  type DifficultyLevel,
  type AnyQuestion,
  type ToolMultiSelect,
  type WorkingStep,
  randInt, pick, mStep, tStep, pickActive, weightOf,
} from "../../shared";

// ═══════════════════════════════════════════════════════════════════════════════
// 1. EXPRESSION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

type Op = "+" | "-" | "*" | "/";
type Num = { t: "num"; v: number };
/** A run of terms joined by operators. As a TERM of another Seq it is a bracket group. */
type Seq = { t: "seq"; terms: Node[]; ops: Op[] };
type Pow = { t: "pow"; base: Node; exp: number };
type Root = { t: "root"; inner: Node };
/** A fraction bar — its top and bottom are always Seqs and behave like brackets. */
type Frac = { t: "frac"; num: Seq; den: Seq };
/** Unary minus in front of an index term: −3² (only ever the first term). */
type Neg = { t: "neg"; x: Node };
type Node = Num | Seq | Pow | Root | Frac | Neg;

/** Kills floating-point dust (0.1 + 0.2) so values stay exact to 8 dp. */
const rd = (x: number) => Math.round(x * 1e8) / 1e8;
const dpOf = (v: number) => {
  const s = String(rd(v));
  const i = s.indexOf(".");
  return i < 0 ? 0 : s.length - i - 1;
};

const N = (v: number): Num => ({ t: "num", v: rd(v) });
const asNode = (x: Node | number): Node => (typeof x === "number" ? N(x) : x);
/** Builds a Seq from alternating terms and operators: E(2, "+", 3, "*", E(4, "-", 1)). */
const E = (...parts: (Node | number | Op)[]): Seq => {
  const terms: Node[] = [];
  const ops: Op[] = [];
  parts.forEach((p, i) => {
    if (i % 2 === 0) terms.push(asNode(p as Node | number));
    else ops.push(p as Op);
  });
  return { t: "seq", terms, ops };
};
const P = (base: Node | number, exp: number): Pow => ({ t: "pow", base: asNode(base), exp });
const R = (inner: Node | number): Root => ({ t: "root", inner: asNode(inner) });
const F = (num: Seq, den: Seq): Frac => ({ t: "frac", num, den });
const NEG = (x: Node): Neg => ({ t: "neg", x });

const isSingleNum = (s: Seq) => s.terms.length === 1 && s.terms[0].t === "num";

// ── Rendering ────────────────────────────────────────────────────────────────

interface Hl {
  /** Individual nodes to box (an index term, a fraction, a bracket group). */
  nodes: Set<Node>;
  /** Inclusive term ranges of a Seq to box together with the operators between. */
  spans: Map<Seq, [number, number][]>;
}
const NO_HL: Hl = { nodes: new Set(), spans: new Map() };

const BOX_OPEN = "\\colorbox{#fde68a}{$\\textcolor{#111827}{";
const BOX_CLOSE = "}$}";
const OPS_TEX: Record<Op, string> = { "+": " + ", "-": " - ", "*": " \\times ", "/": " \\div " };

const numTex = (v: number) => String(rd(v));

function texBody(seq: Seq, hl: Hl): string {
  const spans = hl.spans.get(seq) ?? [];
  let out = "";
  seq.terms.forEach((t, i) => {
    if (spans.some((s) => s[0] === i)) out += BOX_OPEN;
    out += texTerm(t, hl, i === 0);
    if (spans.some((s) => s[1] === i)) out += BOX_CLOSE;
    if (i < seq.ops.length) out += OPS_TEX[seq.ops[i]];
  });
  return out;
}

function texTerm(n: Node, hl: Hl, first: boolean): string {
  const wrap = (s: string) => (hl.nodes.has(n) ? BOX_OPEN + s + BOX_CLOSE : s);
  switch (n.t) {
    case "num":
      // A negative number is bracketed everywhere except the very start of a line.
      return wrap(n.v < 0 && !first ? `(${numTex(n.v)})` : numTex(n.v));
    case "seq":
      return wrap(`\\left(${texBody(n, hl)}\\right)`);
    case "pow": {
      const b = n.base;
      const base = b.t === "num" ? (b.v < 0 ? `(${numTex(b.v)})` : numTex(b.v)) : texTerm(b, hl, true);
      return wrap(`${base}^{${n.exp}}`);
    }
    case "root":
      return wrap(`\\sqrt{${n.inner.t === "seq" ? texBody(n.inner, hl) : texTerm(n.inner, hl, true)}}`);
    case "frac":
      return wrap(`\\dfrac{${texBody(n.num, hl)}}{${texBody(n.den, hl)}}`);
    case "neg":
      return `-${texTerm(n.x, hl, false)}`;
  }
}

// ── Straight evaluation (the cross-check, and the source of "wrong" answers) ─────

/** Deliberate misconceptions, used to build "find the mistake" questions. */
interface EvalOpts {
  lr?: boolean;        // strictly left to right, ignoring precedence
  mulFirst?: boolean;  // all × before any ÷
  addFirst?: boolean;  // all + before any −
  powAsMult?: boolean; // 3² computed as 3 × 2
  negBug?: boolean;    // −3² computed as (−3)²
}

const applyOp = (a: number, op: Op, b: number) =>
  rd(op === "+" ? a + b : op === "-" ? a - b : op === "*" ? a * b : a / b);

function collapseOps(vals: number[], ops: Op[], pred: (o: Op) => boolean) {
  for (;;) {
    const i = ops.findIndex(pred);
    if (i < 0) return;
    vals.splice(i, 2, applyOp(vals[i], ops[i], vals[i + 1]));
    ops.splice(i, 1);
  }
}

function evalNode(n: Node, o: EvalOpts = {}): number {
  switch (n.t) {
    case "num": return n.v;
    case "seq": {
      const vals = n.terms.map((t) => evalNode(t, o));
      const ops = [...n.ops];
      if (o.lr) {
        let acc = vals[0];
        ops.forEach((op, i) => { acc = applyOp(acc, op, vals[i + 1]); });
        return acc;
      }
      if (o.mulFirst) {
        collapseOps(vals, ops, (op) => op === "*");
        collapseOps(vals, ops, (op) => op === "/");
      } else {
        collapseOps(vals, ops, (op) => op === "*" || op === "/");
      }
      if (o.addFirst) {
        collapseOps(vals, ops, (op) => op === "+");
        collapseOps(vals, ops, (op) => op === "-");
      } else {
        collapseOps(vals, ops, (op) => op === "+" || op === "-");
      }
      return vals[0];
    }
    case "pow": {
      const b = evalNode(n.base, o);
      return rd(o.powAsMult ? b * n.exp : Math.pow(b, n.exp));
    }
    case "root": return rd(Math.sqrt(evalNode(n.inner, o)));
    case "frac": return rd(evalNode(n.num, o) / evalNode(n.den, o));
    case "neg":
      if (o.negBug && n.x.t === "pow") return rd(Math.pow(-evalNode(n.x.base, o), n.x.exp));
      return -evalNode(n.x, o);
  }
}

/** Splices every bracket group into its parent — what a student who "ignores the brackets" sees. */
function stripBrackets(s: Seq): Seq {
  const terms: Node[] = [];
  const ops: Op[] = [];
  s.terms.forEach((t, i) => {
    if (i > 0) ops.push(s.ops[i - 1]);
    if (t.t === "seq") {
      const inner = stripBrackets(t);
      terms.push(...inner.terms);
      ops.push(...inner.ops);
    } else {
      terms.push(t);
    }
  });
  return { t: "seq", terms, ops };
}

// ── The BIDMAS stepper ────────────────────────────────────────────────────────

type Kind = "bracket" | "root" | "num" | "den";
interface Leaf { seq: Seq; kind: Kind }

/** Finds the innermost bracket-like groups and the fractions ready to divide. */
function scan(root: Seq): { leaves: Leaf[]; fracs: Frac[] } {
  const leaves: Leaf[] = [];
  const fracs: Frac[] = [];
  // Returns whether the subtree contains a container (bracket / root group / fraction bar).
  const visitSeq = (s: Seq, kind: Kind | null): boolean => {
    let nested = false;
    for (const t of s.terms) if (visitTerm(t)) nested = true;
    if (kind && !nested) leaves.push({ seq: s, kind });
    return kind !== null || nested;
  };
  const visitTerm = (t: Node): boolean => {
    switch (t.t) {
      case "num": return false;
      case "seq": return visitSeq(t, "bracket");
      case "pow": return visitTerm(t.base);
      case "root": return t.inner.t === "seq" ? visitSeq(t.inner, "root") : visitTerm(t.inner);
      case "frac":
        visitSeq(t.num, "num");
        visitSeq(t.den, "den");
        if (isSingleNum(t.num) && isSingleNum(t.den)) fracs.push(t);
        return true;
      case "neg": return visitTerm(t.x);
    }
  };
  visitSeq(root, null);
  return { leaves, fracs };
}

const isIdxTerm = (t: Node) =>
  t.t === "pow" || t.t === "root" || (t.t === "neg" && (t.x.t === "pow" || t.x.t === "root"));
const idxNode = (t: Node): Node => (t.t === "neg" ? t.x : t);

interface FlatRes {
  seq: Seq;
  spans: [number, number][];
  nodes: Node[];
  /** Lower-case stage name: "indices", "multiply (left to right)", "add"… */
  name: string;
  produced: number[];
}

/** One BIDMAS stage on a seq whose terms are plain (no brackets left): indices, then ×÷, then +−. */
function stepFlat(seq: Seq): FlatRes {
  const produced: number[] = [];

  if (seq.terms.some(isIdxTerm)) {
    const nodes: Node[] = [];
    let pow = false, root = false;
    const terms = seq.terms.map((t) => {
      if (!isIdxTerm(t)) return t;
      const x = idxNode(t) as Pow | Root;
      nodes.push(x);
      const sign = t.t === "neg" ? -1 : 1;
      let v: number;
      if (x.t === "pow") { pow = true; v = Math.pow((x.base as Num).v, x.exp); }
      else { root = true; v = Math.sqrt((x.inner as Num).v); }
      produced.push(rd(sign * v));
      return N(sign * v);
    });
    const name = pow && root ? "indices and roots" : root ? "roots" : "indices";
    return { seq: { t: "seq", terms, ops: seq.ops }, spans: [], nodes, name, produced };
  }

  const isMD = (o: Op) => o === "*" || o === "/";
  const sel = new Set<number>();
  seq.ops.forEach((o, j) => {
    if (isMD(o) && (j === 0 || !isMD(seq.ops[j - 1]))) sel.add(j);
  });

  if (sel.size > 0) {
    const terms: Node[] = [];
    const ops: Op[] = [];
    const spans: [number, number][] = [];
    const used = new Set<Op>();
    let i = 0;
    while (i < seq.terms.length) {
      if (sel.has(i)) {
        const v = applyOp((seq.terms[i] as Num).v, seq.ops[i], (seq.terms[i + 1] as Num).v);
        used.add(seq.ops[i]);
        produced.push(v);
        spans.push([i, i + 1]);
        terms.push(N(v));
        if (i + 1 < seq.ops.length) ops.push(seq.ops[i + 1]);
        i += 2;
      } else {
        terms.push(seq.terms[i]);
        if (i < seq.ops.length) ops.push(seq.ops[i]);
        i += 1;
      }
    }
    const chained = seq.ops.some((o, j) => isMD(o) && !sel.has(j));
    const base = used.size === 2 ? "multiply and divide" : used.has("*") ? "multiply" : "divide";
    return { seq: { t: "seq", terms, ops }, spans, nodes: [], name: base + (chained ? " (left to right)" : ""), produced };
  }

  // Only + and − remain: one operation at a time, left to right.
  const v = applyOp((seq.terms[0] as Num).v, seq.ops[0], (seq.terms[1] as Num).v);
  produced.push(v);
  const base = seq.ops[0] === "+" ? "add" : "subtract";
  return {
    seq: { t: "seq", terms: [N(v), ...seq.terms.slice(2)], ops: seq.ops.slice(1) },
    spans: [[0, 1]],
    nodes: [],
    name: base + (seq.ops.length > 1 ? " (left to right)" : ""),
    produced,
  };
}

function rebuild(n: Node, repl: Map<Node, Node>): Node {
  const r = repl.get(n);
  if (r) return r;
  switch (n.t) {
    case "num": return n;
    case "seq": return { t: "seq", terms: n.terms.map((t) => rebuild(t, repl)), ops: n.ops };
    case "pow": return { t: "pow", base: rebuild(n.base, repl), exp: n.exp };
    case "root": return { t: "root", inner: rebuild(n.inner, repl) };
    case "frac": return { t: "frac", num: rebuild(n.num, repl) as Seq, den: rebuild(n.den, repl) as Seq };
    case "neg": return { t: "neg", x: rebuild(n.x, repl) };
  }
}

/** Drops brackets that now hold a single number, and folds −(number) into a negative number. */
function normTerm(n: Node): Node {
  switch (n.t) {
    case "num": return n;
    case "seq": {
      const s = normSeq(n);
      return isSingleNum(s) ? s.terms[0] : s;
    }
    case "pow": return { t: "pow", base: normTerm(n.base), exp: n.exp };
    case "root": return { t: "root", inner: normTerm(n.inner) };
    case "frac": return { t: "frac", num: normSeq(n.num), den: normSeq(n.den) };
    case "neg": {
      const x = normTerm(n.x);
      return x.t === "num" ? N(-x.v) : { t: "neg", x };
    }
  }
}
const normSeq = (s: Seq): Seq => ({ t: "seq", terms: s.terms.map(normTerm), ops: s.ops });

interface StepOut {
  label: string;
  hl: Hl;
  after: Seq;
  produced: number[];
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** The next BIDMAS move on `root`, or null when it is already a single number. */
function nextStep(root: Seq): StepOut | null {
  const { leaves, fracs } = scan(root);
  const reducible = leaves.filter((l) => !isSingleNum(l.seq));

  // ── B: brackets first (innermost), with root signs and fraction bars acting as brackets ──
  if (reducible.length > 0 || fracs.length > 0) {
    const hl: Hl = { nodes: new Set(), spans: new Map() };
    const repl = new Map<Node, Node>();
    const produced: number[] = [];
    const names = new Set<string>();
    for (const leaf of reducible) {
      const r = stepFlat(leaf.seq);
      repl.set(leaf.seq, r.seq);
      if (r.spans.length) hl.spans.set(leaf.seq, r.spans);
      r.nodes.forEach((x) => hl.nodes.add(x));
      produced.push(...r.produced);
      names.add(r.name);
    }
    for (const fr of fracs) {
      const v = rd((fr.num.terms[0] as Num).v / (fr.den.terms[0] as Num).v);
      repl.set(fr, N(v));
      hl.nodes.add(fr);
      produced.push(v);
    }
    let label: string;
    if (reducible.length === 0) {
      label = "Divide the top by the bottom";
    } else {
      const kinds = new Set(reducible.map((l) => l.kind));
      const prefix = fracs.length > 0 ? "Brackets"
        : kinds.size === 1 && kinds.has("root") ? "Under the root"
        : [...kinds].every((k) => k === "num" || k === "den") ? "Top and bottom of the fraction"
        : "Brackets";
      label = names.size === 1 ? `${prefix} — ${[...names][0]}` : prefix;
    }
    const after = normSeq(rebuild(root, repl) as Seq);
    return { label: label + ":", hl, after, produced };
  }

  // ── Everything left is a flat line: I, then DM, then AS ──
  if (isSingleNum(root)) return null;
  const r = stepFlat(root);
  const hl: Hl = {
    nodes: new Set(r.nodes),
    spans: r.spans.length ? new Map([[root, r.spans]]) : new Map(),
  };
  return { label: cap(r.name) + ":", hl, after: normSeq(r.seq), produced: r.produced };
}

interface RunStep { label: string; before: Seq; hl: Hl; after: Seq }
interface Run { steps: RunStep[]; final: number; produced: number[] }

function runSteps(ast: Seq): Run | null {
  const steps: RunStep[] = [];
  const produced: number[] = [];
  let cur = ast;
  for (let guard = 0; guard < 16; guard++) {
    const s = nextStep(cur);
    if (!s) {
      if (!isSingleNum(cur)) return null;
      return { steps, final: (cur.terms[0] as Num).v, produced };
    }
    steps.push({ label: s.label, before: cur, hl: s.hl, after: s.after });
    produced.push(...s.produced);
    cur = s.after;
  }
  return null;
}

/** Worked-example steps: each rewrites the line with the next move boxed, then the result. */
function workingSteps(ast: Seq): WorkingStep[] {
  const run = runSteps(ast);
  if (!run) return [tStep("Work through the brackets first, then indices, then × and ÷, then + and −.")];
  return run.steps.map((s) =>
    mStep(s.label, [texBody(s.before, s.hl), "= " + texBody(s.after, NO_HL)]),
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

type NumMode = "whole" | "negatives" | "decimals";
type Family = "basic" | "chain" | "brackets" | "indices" | "bracketsIndices" | "roots" | "fraction" | "nested";
interface Ctx { nm: NumMode; level: DifficultyLevel }

const LIMIT = 500;

// Operand sources. "A" = an additive-position operand, "M" = a multiplier/factor. In
// negatives mode some come out negative; in decimals mode some come out one-decimal.
const A = (c: Ctx, lo: number, hi: number): number => {
  if (c.nm === "negatives" && Math.random() < 0.4) return -randInt(lo, hi);
  if (c.nm === "decimals" && Math.random() < 0.5) return rd(randInt(lo * 10, hi * 10) / 10);
  return randInt(lo, hi);
};
const M = (c: Ctx, lo: number, hi: number): number => {
  if (c.nm === "negatives" && Math.random() < 0.35) return -randInt(lo, hi);
  if (c.nm === "decimals" && Math.random() < 0.35) return rd(randInt(lo * 10, hi * 10) / 10);
  return randInt(lo, hi);
};
/** [dividend, divisor] that divide exactly. The divisor is always a whole number. */
const divPair = (c: Ctx, qlo: number, qhi: number): [number, number] => {
  const d = c.nm === "negatives" && Math.random() < 0.25 ? -randInt(2, 9) : randInt(2, 9);
  return [rd(d * M(c, qlo, qhi)), d];
};
/** Splits a total s into a + (s − a). */
const splitSum = (c: Ctx, s: number): [number, number] => {
  const top = Math.max(2, Math.ceil(Math.abs(s)) - 1);
  const a = c.nm === "whole" ? randInt(1, top) : A(c, 1, top);
  return [a, rd(s - a)];
};
const expo = (c: Ctx) => (c.level === "level1" ? 2 : pick([2, 2, 3]));
/** A base to be raised to the power e. */
const B = (c: Ctx, e: number): number => {
  if (c.nm === "decimals" && e === 2) return pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1.2, 1.5, 2.5]);
  const v = e === 3 ? randInt(2, 5) : randInt(2, 9);
  return c.nm === "negatives" && Math.random() < 0.5 ? -v : v;
};

const SQUARES = [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144];
const DEC_SQUARES = [0.04, 0.09, 0.16, 0.25, 0.36, 0.49, 0.64, 0.81];
const TRIPLES: [number, number][] = [[3, 4], [6, 8], [5, 12]];

type Shape = (c: Ctx) => Seq | null;

const SHAPES: Record<Family, Shape[]> = {
  // Operations only — the multiplication/division-before-addition/subtraction core.
  basic: [
    (c) => E(A(c, 1, 20), "+", M(c, 2, 9), "*", M(c, 2, 9)),
    (c) => E(M(c, 2, 9), "*", M(c, 2, 9), "+", A(c, 1, 20)),
    (c) => E(A(c, 20, 60), "-", M(c, 2, 9), "*", M(c, 2, 9)),
    (c) => E(M(c, 2, 9), "*", M(c, 2, 9), "-", A(c, 1, 30)),
    (c) => { const [x, d] = divPair(c, 2, 9); return E(A(c, 1, 20), "+", x, "/", d); },
    (c) => { const [x, d] = divPair(c, 2, 9); return E(x, "/", d, "+", A(c, 1, 20)); },
    (c) => E(M(c, 2, 9), "*", M(c, 2, 9), "+", M(c, 2, 9), "*", M(c, 2, 9)),
    (c) => E(M(c, 2, 9), "*", M(c, 2, 9), "-", M(c, 2, 9), "*", M(c, 2, 9)),
    (c) => E(A(c, 1, 20), "+", M(c, 2, 9), "*", M(c, 2, 9), "-", A(c, 1, 20)),
    (c) => { const [x, d] = divPair(c, 2, 9); return E(A(c, 10, 40), "-", x, "/", d); },
  ],
  // Chains of ÷× or +− — same priority, so strictly left to right.
  chain: [
    (c) => { const [x, d] = divPair(c, 2, 9); return E(x, "/", d, "*", M(c, 2, 9)); },
    (c) => { const d = randInt(2, 9); return E(d * randInt(2, 6), "*", M(c, 2, 9), "/", d); },
    (c) => { const d1 = randInt(2, 5), d2 = randInt(2, 5); return E(rd(d1 * d2 * M(c, 2, 9)), "/", d1, "/", d2); },
    (c) => E(A(c, 10, 40), "-", A(c, 2, 15), "+", A(c, 2, 20)),
    (c) => E(A(c, 20, 60), "-", A(c, 2, 15), "-", A(c, 2, 20)),
    (c) => E(A(c, 20, 50), "-", A(c, 2, 12), "+", A(c, 2, 15), "-", A(c, 2, 12)),
    (c) => { const [x, d] = divPair(c, 2, 9); return E(x, "/", d, "*", M(c, 2, 9), "+", A(c, 1, 20)); },
  ],
  brackets: [
    (c) => E(E(A(c, 2, 12), "+", A(c, 2, 12)), "*", M(c, 2, 9)),
    (c) => E(E(A(c, 5, 20), "-", A(c, 1, 14)), "*", M(c, 2, 9)),
    (c) => E(M(c, 2, 9), "*", E(A(c, 2, 12), "+", A(c, 2, 12))),
    (c) => { const d = randInt(2, 6); const [a, b] = splitSum(c, rd(d * M(c, 2, 9))); return E(E(a, "+", b), "/", d); },
    (c) => E(A(c, 20, 60), "-", E(A(c, 2, 12), "+", A(c, 2, 12))),
    (c) => E(M(c, 2, 9), "*", E(A(c, 2, 12), "+", A(c, 2, 12)), "-", A(c, 1, 20)),
    (c) => E(E(A(c, 2, 12), "+", A(c, 2, 12)), "*", E(A(c, 6, 15), "-", A(c, 1, 5))),
    (c) => { const b = A(c, 1, 6), d2 = A(c, 1, 6); return E(rd((b + d2) * M(c, 2, 9)), "/", E(b, "+", d2)); },
    (c) => E(E(A(c, 2, 12), "+", A(c, 2, 12)), "*", M(c, 2, 9), "-", A(c, 1, 20)),
  ],
  indices: [
    (c) => { const e = expo(c); return E(A(c, 1, 30), "+", P(B(c, e), e)); },
    (c) => { const e = expo(c); return E(A(c, 20, 90), "-", P(B(c, e), e)); },
    (c) => { const e = expo(c); return E(P(B(c, e), e), "+", A(c, 1, 30)); },
    (c) => { const e = expo(c); return E(M(c, 2, 5), "*", P(B(c, e), e)); },
    (c) => { const e = expo(c); return E(A(c, 1, 20), "+", P(B(c, e), e), "-", A(c, 1, 20)); },
    (c) => { const e = expo(c); return E(M(c, 2, 4), "*", P(B(c, e), e), "+", A(c, 1, 20)); },
    (c) => { const e = expo(c); return E(P(B(c, e), e), "+", M(c, 2, 9), "*", M(c, 2, 9)); },
    (c) => { const e = expo(c); return E(P(B(c, e), e), "-", P(B(c, e), e)); },
    // The classic trap: −3² is −9, not 9 (negatives mode only).
    (c) => c.nm === "negatives" ? E(NEG(P(randInt(2, 7), 2)), "+", A(c, 1, 20)) : null,
    (c) => c.nm === "negatives" ? E(A(c, 1, 30), "-", NEG(P(randInt(2, 7), 2))) : null,
  ],
  bracketsIndices: [
    (c) => E(P(E(A(c, 1, 8), "+", A(c, 1, 8)), 2), "-", A(c, 1, 30)),
    (c) => E(P(E(A(c, 6, 15), "-", A(c, 1, 5)), 2), "+", A(c, 1, 20)),
    (c) => E(A(c, 1, 5), "+", M(c, 2, 4), "*", P(E(A(c, 1, 4), "+", A(c, 1, 4)), 2)),
    (c) => E(P(B(c, 2), 2), "+", E(A(c, 5, 15), "-", A(c, 1, 4)), "*", M(c, 2, 6)),
    (c) => {
      const s = randInt(3, 9);
      const divs = [2, 3, 4, 5, 6, 8, 9, 10, 12].filter((d) => (s * s) % d === 0);
      if (divs.length === 0) return null;
      const [a, b] = splitSum(c, s);
      return E(P(E(a, "+", b), 2), "/", pick(divs));
    },
  ],
  roots: [
    (c) => E(R(c.nm === "decimals" ? pick(DEC_SQUARES) : pick(SQUARES)), "+", A(c, 1, 20)),
    (c) => E(M(c, 2, 9), "*", R(c.nm === "decimals" ? pick(DEC_SQUARES) : pick(SQUARES))),
    (c) => E(A(c, 15, 40), "-", R(c.nm === "decimals" ? pick(DEC_SQUARES) : pick(SQUARES))),
    (c) => E(A(c, 1, 15), "+", M(c, 2, 5), "*", R(c.nm === "decimals" ? pick(DEC_SQUARES) : pick(SQUARES))),
    (c) => { const k = randInt(2, 10); const [a, b] = splitSum(c, k * k); return E(R(E(a, "+", b)), "*", M(c, 2, 6)); },
    (c) => {
      const [x, y] = pick(TRIPLES);
      const sc = c.nm === "decimals" ? 0.1 : 1;
      return E(R(E(P(rd(x * sc), 2), "+", P(rd(y * sc), 2))), "+", A(c, 1, 20));
    },
  ],
  fraction: [
    (c) => { const d = randInt(2, 9); const [a, b] = splitSum(c, rd(d * M(c, 2, 9))); return E(F(E(a, "+", b), E(d))); },
    (c) => { const d = randInt(2, 9); return E(F(E(d * randInt(2, 6), "*", M(c, 2, 9)), E(d))); },
    (c) => {
      const D = randInt(2, 6), dd = randInt(1, 9);
      const [a, b] = splitSum(c, rd(D * M(c, 2, 9)));
      return E(F(E(a, "+", b), E(dd + D, "-", dd)));
    },
    (c) => { const d = randInt(2, 9), b = A(c, 1, 20); return E(F(E(rd(b + d * M(c, 2, 9)), "-", b), E(d)), "+", A(c, 1, 20)); },
    (c) => {
      const d = randInt(2, 6), x = M(c, 2, 6), y = M(c, 2, 6);
      return E(F(E(rd(d * M(c, 2, 9) - x * y), "+", x, "*", y), E(d)));
    },
    (c) => {
      const d = randInt(2, 6), x = randInt(3, 9), b = rd(x * x - d * M(c, 2, 9));
      return E(F(E(P(x, 2), "-", b), E(d)));
    },
  ],
  nested: [
    (c) => E(M(c, 2, 6), "*", E(E(A(c, 1, 9), "+", A(c, 1, 9)), "-", A(c, 1, 6))),
    (c) => E(M(c, 2, 5), "*", E(A(c, 1, 9), "+", M(c, 2, 5), "*", E(A(c, 6, 12), "-", A(c, 1, 5)))),
    (c) => {
      const a = A(c, 1, 9), b = A(c, 1, 9), m = M(c, 2, 5);
      const e = randInt(2, 6), t = e * randInt(2, 9);
      return E(E(E(a, "+", b), "*", m, "-", rd((a + b) * m - t)), "/", e);
    },
  ],
};

interface Analysis { answer: number; steps: number }

function collectLits(n: Node, lits: number[], flags: { neg: boolean }) {
  switch (n.t) {
    case "num": lits.push(n.v); break;
    case "seq": n.terms.forEach((t) => collectLits(t, lits, flags)); break;
    case "pow": collectLits(n.base, lits, flags); break;
    case "root": collectLits(n.inner, lits, flags); break;
    case "frac": collectLits(n.num, lits, flags); collectLits(n.den, lits, flags); break;
    case "neg": flags.neg = true; collectLits(n.x, lits, flags); break;
  }
}

/** Is this expression a good question for the number mode? Runs the stepper and checks every value. */
function analyse(ast: Seq, nm: NumMode): Analysis | null {
  const lits: number[] = [];
  const flags = { neg: false };
  collectLits(ast, lits, flags);
  if (lits.some((v) => !Number.isFinite(v) || dpOf(v) > 2)) return null;
  if (nm === "whole" && (flags.neg || lits.some((v) => v < 0 || !Number.isInteger(v)))) return null;
  if (nm === "negatives" && (lits.some((v) => !Number.isInteger(v)) || !(flags.neg || lits.some((v) => v < 0)))) return null;
  if (nm === "decimals" && (flags.neg || lits.some((v) => v < 0) || !lits.some((v) => !Number.isInteger(v)))) return null;

  const run = runSteps(ast);
  if (!run || run.steps.length < 2 || run.steps.length > 9) return null;
  const maxDp = nm === "decimals" ? 2 : 0;
  for (const v of [...run.produced, run.final]) {
    if (!Number.isFinite(v) || Math.abs(v) > LIMIT || dpOf(v) > maxDp) return null;
    if (nm === "whole" && v < 0) return null;
  }
  if (rd(evalNode(ast)) !== run.final) return null;
  return { answer: run.final, steps: run.steps.length };
}

/** Does the BIDMAS order actually change the answer? (Guards the "no-trap" draws.) */
function orderMatters(ast: Seq, family: Family, answer: number): boolean {
  if (family === "basic") return rd(evalNode(ast, { lr: true })) !== answer;
  if (family === "brackets") return rd(evalNode(stripBrackets(ast))) !== answer;
  return true;
}

function buildEval(level: DifficultyLevel, family: Family, nm: NumMode): { ast: Seq; info: Analysis } | null {
  const c: Ctx = { nm, level };
  for (let i = 0; i < 500; i++) {
    const ast = pick(SHAPES[family])(c);
    if (!ast) continue;
    const info = analyse(ast, nm);
    if (info && orderMatters(ast, family, info.answer)) return { ast, info };
  }
  return null;
}

// ── QO pools ──────────────────────────────────────────────────────────────────

const STRUCT_OPTS: Record<Family, { label: string; weight: number }> = {
  basic: { label: "Operations", weight: 1 },
  chain: { label: "Left to right", weight: 2 },
  brackets: { label: "Brackets", weight: 2 },
  indices: { label: "Indices", weight: 3 },
  bracketsIndices: { label: "Brackets + indices", weight: 4 },
  roots: { label: "Roots", weight: 4 },
  fraction: { label: "Fraction bar", weight: 4 },
  nested: { label: "Nested brackets", weight: 5 },
};

const structPool = (on: Family[], offered: Family[]): ToolMultiSelect => ({
  key: "structure",
  label: "Question Types",
  info: "Which kinds of expression can appear. Roots and fraction bars act as brackets.",
  options: offered.map((f) => ({
    value: f, label: STRUCT_OPTS[f].label, weight: STRUCT_OPTS[f].weight, defaultActive: on.includes(f),
  })),
});

const NUM_OPTS: Record<NumMode, { label: string; weight: number }> = {
  whole: { label: "Whole numbers", weight: 1 },
  negatives: { label: "Negatives", weight: 2 },
  decimals: { label: "Decimals", weight: 3 },
};

const numPool = (on: NumMode[], offered: NumMode[]): ToolMultiSelect => ({
  key: "numbers",
  label: "Numbers",
  options: offered.map((m) => ({
    value: m, label: NUM_OPTS[m].label, weight: NUM_OPTS[m].weight, defaultActive: on.includes(m),
  })),
});

const ALL_FAMILIES: Family[] = ["basic", "chain", "brackets", "indices", "bracketsIndices", "roots", "fraction", "nested"];

const STRUCT_L1 = structPool(["basic", "brackets"], ["basic", "brackets", "chain", "indices"]);
const STRUCT_L2 = structPool(["chain", "brackets", "indices", "bracketsIndices"], ["basic", "chain", "brackets", "indices", "bracketsIndices", "roots", "fraction"]);
const STRUCT_L3 = structPool(["indices", "bracketsIndices", "roots", "fraction", "nested"], ALL_FAMILIES);
const NUM_L2 = numPool(["whole"], ["whole", "negatives"]);
const NUM_L3 = numPool(["negatives", "decimals"], ["whole", "negatives", "decimals"]);

const EVAL_POOLS: Record<DifficultyLevel, { struct: ToolMultiSelect; nums: ToolMultiSelect | null }> = {
  level1: { struct: STRUCT_L1, nums: null },
  level2: { struct: STRUCT_L2, nums: NUM_L2 },
  level3: { struct: STRUCT_L3, nums: NUM_L3 },
};

// ── Mistakes ──────────────────────────────────────────────────────────────────

type MistakeId = "leftToRight" | "ignoreBrackets" | "mulFirst" | "addFirst" | "powTimes" | "negSquare";

interface MistakeDef {
  label: string;
  family: Family;
  nm: NumMode;
  /** The wrong value the student arrives at (null if this draw doesn't show the mistake). */
  wrong: (ast: Seq) => number;
  /** Extra requirement on the drawn expression. */
  needs?: (ast: Seq) => boolean;
  /** Short note printed after the answer. */
  desc: string;
  /** Full explanation, the first step of the worked example. */
  explain: string;
}

const MISTAKES: Record<MistakeId, MistakeDef> = {
  leftToRight: {
    label: "Left to right", family: "basic", nm: "whole",
    wrong: (a) => evalNode(a, { lr: true }),
    desc: "worked left to right",
    explain: "The student worked strictly from left to right. Multiplication and division must be done before addition and subtraction.",
  },
  ignoreBrackets: {
    label: "Brackets ignored", family: "brackets", nm: "whole",
    wrong: (a) => evalNode(stripBrackets(a)),
    desc: "ignored the brackets",
    explain: "The student ignored the brackets. Brackets come first, so the part inside must be worked out before anything else.",
  },
  mulFirst: {
    label: "× before ÷", family: "chain", nm: "whole",
    wrong: (a) => evalNode(a, { mulFirst: true }),
    needs: (a) => a.ops.includes("/") && a.ops.includes("*"),
    desc: "multiplied before dividing",
    explain: "The student did the multiplication before the division. Division and multiplication have equal priority, so they are done in order from left to right.",
  },
  addFirst: {
    label: "+ before −", family: "chain", nm: "whole",
    wrong: (a) => evalNode(a, { addFirst: true }),
    needs: (a) => a.ops.includes("+") && a.ops.includes("-"),
    desc: "added before subtracting",
    explain: "The student did the addition before the subtraction. Addition and subtraction have equal priority, so they are done in order from left to right.",
  },
  powTimes: {
    label: "Base × index", family: "indices", nm: "whole",
    wrong: (a) => evalNode(a, { powAsMult: true }),
    needs: (a) => a.terms.some((t) => t.t === "pow"),
    desc: "multiplied the base by the index",
    explain: "The student multiplied the base by the index. An index means repeated multiplication: for example 3 squared is 3 times 3, not 3 times 2.",
  },
  negSquare: {
    label: "Negative squared", family: "indices", nm: "negatives",
    wrong: (a) => evalNode(a, { negBug: true }),
    needs: (a) => a.terms[0].t === "neg",
    desc: "squared the negative sign as well",
    explain: "The student squared the negative sign as well. Without brackets only the number is squared, so the answer to the square is negative; brackets are needed to square a negative number.",
  },
};

const MISTAKE_IDS: MistakeId[] = ["leftToRight", "ignoreBrackets", "mulFirst", "addFirst", "powTimes", "negSquare"];

const mistakePool = (offered: MistakeId[]): ToolMultiSelect => ({
  key: "mistake",
  label: "Mistake Types",
  options: offered.map((m) => ({ value: m, label: MISTAKES[m].label, defaultActive: true })),
});

const MISTAKE_BY_LEVEL: Record<DifficultyLevel, ToolMultiSelect> = {
  level1: mistakePool(["leftToRight", "ignoreBrackets"]),
  level2: mistakePool(["leftToRight", "ignoreBrackets", "mulFirst", "addFirst"]),
  level3: mistakePool(MISTAKE_IDS),
};

const TASK_POOL: ToolMultiSelect = {
  key: "task",
  label: "Task",
  options: [
    { value: "insertBrackets", label: "Insert brackets", defaultActive: true },
    { value: "spotMistake", label: "Spot the mistake", defaultActive: true },
  ],
};

// ── Insert brackets ───────────────────────────────────────────────────────────

interface InsertDraw { flat: Seq; bracketed: Seq; group: Seq; target: number }

function genInsert(level: DifficultyLevel): InsertDraw | null {
  const allowed: Op[] = level === "level1" ? ["+", "*"] : level === "level2" ? ["+", "-", "*", "/"] : ["+", "-", "*"];
  for (let tries = 0; tries < 600; tries++) {
    const n = level === "level1" ? pick([3, 4]) : 4;
    const terms: Node[] = Array.from({ length: n }, () => N(randInt(2, 9)));
    if (level === "level3") terms[randInt(0, n - 1)] = P(randInt(2, 5), 2);
    const ops: Op[] = Array.from({ length: n - 1 }, () => pick(allowed));
    if (!ops.some((o) => o === "+" || o === "-") || !ops.some((o) => o === "*" || o === "/")) continue;
    const flat: Seq = { t: "seq", terms, ops };
    const baseVal = rd(evalNode(flat));

    const placements: { i: number; j: number; seq: Seq; group: Seq; v: number }[] = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (i === 0 && j === n - 1) continue;
        const group: Seq = { t: "seq", terms: terms.slice(i, j + 1), ops: ops.slice(i, j) };
        const seq: Seq = {
          t: "seq",
          terms: [...terms.slice(0, i), group, ...terms.slice(j + 1)],
          ops: [...ops.slice(0, i), ...ops.slice(j + 1)],
        };
        placements.push({ i, j, seq, group, v: rd(evalNode(seq)) });
      }
    }
    const p = pick(placements);
    if (!Number.isFinite(p.v) || p.v !== Math.round(p.v) || p.v < 1 || p.v > 300 || p.v === baseVal) continue;
    if (placements.filter((q) => q.v === p.v).length !== 1) continue;
    if (!analyse(p.seq, "whole")) continue;
    return { flat, bracketed: p.seq, group: p.group, target: p.v };
  }
  return null;
}

// ── Question builders ─────────────────────────────────────────────────────────

const FALLBACK = E(3, "+", 4, "*", 5);

function genEvaluate(level: DifficultyLevel, msv: Record<string, boolean>): AnyQuestion {
  const { struct, nums } = EVAL_POOLS[level];
  const family = pickActive(msv, struct.options) as Family;
  const nm = (nums ? pickActive(msv, nums.options) : "whole") as NumMode;
  const built = buildEval(level, family, nm) ?? buildEval(level, family, "whole");
  const ast = built?.ast ?? FALLBACK;
  const answer = built?.info.answer ?? 23;
  const dl = texBody(ast, NO_HL);
  const score = weightOf(struct.options, family) + (nums ? weightOf(nums.options, nm) : 0);
  return {
    kind: "simple",
    display: dl,
    displayLatex: dl,
    answer: numTex(answer),
    answerLatex: numTex(answer),
    working: workingSteps(ast),
    key: `ooo-eval-${level}-${dl}-${Math.floor(Math.random() * 1_000_000)}`,
    difficulty: level,
    _difficultyScore: score,
  } as unknown as AnyQuestion;
}

function genMistake(level: DifficultyLevel, msv: Record<string, boolean>): AnyQuestion {
  const pool = MISTAKE_BY_LEVEL[level];
  const id = pickActive(msv, pool.options) as MistakeId;
  const def = MISTAKES[id];
  for (let i = 0; i < 80; i++) {
    const built = buildEval(level, def.family, def.nm);
    if (!built || (def.needs && !def.needs(built.ast))) continue;
    const wrong = rd(def.wrong(built.ast));
    const right = built.info.answer;
    if (!Number.isFinite(wrong) || wrong === right || dpOf(wrong) > 2 || Math.abs(wrong) > 1000) continue;
    const dl = texBody(built.ast, NO_HL);
    return {
      kind: "worded",
      lines: [
        "A student writes:",
        `$${dl} = ${numTex(wrong)}$`,
        "Find the correct answer and the mistake they made.",
      ],
      answer: numTex(right),
      answerLatex: numTex(right),
      answerSuffix: `(they ${def.desc})`,
      working: [tStep(def.explain), ...workingSteps(built.ast)],
      key: `ooo-mistake-${level}-${id}-${dl}-${Math.floor(Math.random() * 1_000_000)}`,
      difficulty: level,
    } as unknown as AnyQuestion;
  }
  return genEvaluate(level, {});
}

function genInsertQuestion(level: DifficultyLevel): AnyQuestion {
  const d = genInsert(level);
  if (!d) return genEvaluate(level, {});
  const flatTex = texBody(d.flat, NO_HL);
  const brTex = texBody(d.bracketed, NO_HL);
  const brHl = texBody(d.bracketed, { nodes: new Set([d.group]), spans: new Map() });
  return {
    kind: "worded",
    lines: [
      "Insert one pair of brackets to make this calculation correct:",
      `$${flatTex} = ${d.target}$`,
    ],
    answer: `${brTex} = ${d.target}`,
    answerLatex: `${brTex} = ${d.target}`,
    working: [
      mStep("Brackets go here:", [flatTex, "\\longrightarrow " + brHl]),
      ...workingSteps(d.bracketed),
    ],
    key: `ooo-insert-${level}-${flatTex}-${d.target}-${Math.floor(Math.random() * 1_000_000)}`,
    difficulty: level,
  } as unknown as AnyQuestion;
}

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  _variables: Record<string, boolean>,
  _dropdownValue: string,
  multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  if (tool === "evaluate") return genEvaluate(level, multiSelectValues);
  const task = pickActive(multiSelectValues, TASK_POOL.options);
  return task === "insertBrackets" ? genInsertQuestion(level) : genMistake(level, multiSelectValues);
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. TOOL_CONFIG / INFO
// ═══════════════════════════════════════════════════════════════════════════════

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Order of Operations (BIDMAS)",
  tools: {
    evaluate: {
      name: "Evaluate",
      instruction: "Work out:",
      variables: [],
      dropdown: null,
      multiSelect: [STRUCT_L2, NUM_L2],
      difficultySettings: {
        level1: { variables: [], dropdown: null, multiSelect: [STRUCT_L1] },
        level2: { variables: [], dropdown: null, multiSelect: [STRUCT_L2, NUM_L2] },
        level3: { variables: [], dropdown: null, multiSelect: [STRUCT_L3, NUM_L3] },
      },
    },
    fixIt: {
      name: "Brackets & Mistakes",
      variables: [],
      dropdown: null,
      multiSelect: [TASK_POOL, MISTAKE_BY_LEVEL.level1],
      difficultySettings: {
        level1: { variables: [], dropdown: null, multiSelect: [TASK_POOL, MISTAKE_BY_LEVEL.level1] },
        level2: { variables: [], dropdown: null, multiSelect: [TASK_POOL, MISTAKE_BY_LEVEL.level2] },
        level3: { variables: [], dropdown: null, multiSelect: [TASK_POOL, MISTAKE_BY_LEVEL.level3] },
      },
    },
  },
};

const INFO_SECTIONS: InfoSection[] = [
  { title: "Evaluate", icon: "🔢", content: [
    { label: "Overview", detail: "Work out an expression using the order of operations. The Worked Example rewrites the line one stage at a time, boxing the part that is done next, so the order is visible." },
    { label: "Level 1 — Green", detail: "Whole numbers: + − × ÷ with and without brackets. Squares are available as an option." },
    { label: "Level 2 — Yellow", detail: "Brackets and indices (squares and cubes), left-to-right chains such as 24 ÷ 4 × 2, with roots and fraction bars available. Negative numbers are an option." },
    { label: "Level 3 — Red", detail: "Everything: indices, brackets and indices together, square roots, fraction bars and nested brackets, with negative numbers and decimals (including the trap −3² against (−3)²)." },
    { label: "Order used", detail: "Brackets first (the top and bottom of a fraction bar and the inside of a root sign act as brackets), then indices and roots, then × and ÷ left to right, then + and − left to right." },
  ]},
  { title: "Brackets & Mistakes", icon: "🧐", content: [
    { label: "Insert brackets", detail: "One pair of brackets must be added to make a statement true. Each question has exactly one correct place for them." },
    { label: "Spot the mistake", detail: "A student's wrong answer is shown; find the correct answer and the mistake. Choose which mistakes can appear in the Question Options." },
    { label: "Levels", detail: "Level 1: working left to right and ignoring brackets. Level 2 adds × before ÷ and + before −. Level 3 adds multiplying the base by the index and squaring a negative sign." },
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard", detail: "One question with working space beside it." },
    { label: "Worked Example", detail: "Step by step: each press shows the next stage, with the part being worked out boxed." },
    { label: "Worksheet", detail: "A grid of questions with PDF export. The Smart Progressor orders the sheet easy to hard." },
  ]},
  { title: "Question Options", icon: "⚙️", content: [
    { label: "Question Types", detail: "Which kinds of expression can appear (operations, left-to-right chains, brackets, indices, roots, fraction bars, nested brackets)." },
    { label: "Numbers", detail: "Whole numbers, negative numbers or decimals — one is chosen for each question." },
  ]},
];

// Exposes internals to the generator smoke tests (src/tests/generators.test.ts) and to
// the engine tests (src/tests/orderOfOperations.test.ts).
export const __test = {
  TOOL_CONFIG,
  generateQuestion,
  engine: { E, P, R, F, NEG, N, texBody, NO_HL, runSteps, evalNode, analyse, SHAPES, buildEval, MISTAKES, genInsert },
};

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      defaults={{ numColumns: 2 }}
    />
  );
}
