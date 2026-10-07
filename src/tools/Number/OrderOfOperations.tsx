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
  BidmasPyramid, MathRenderer, FitWidth, QuestionDisplay, AnswerDisplay,
  type PyramidTier,
  type ToolConfig,
  type InfoSection,
  type DifficultyLevel,
  type AnyQuestion,
  type ToolMultiSelect,
  type WorkingStep, type QOSnapshot,
  randInt, pick, mStep, tStep, pickActive, weightOf, resolveMultiSelectValues, maskUnmetOptions,
} from "../../shared";
import React, { useLayoutEffect, useRef, useState } from "react";
import { DEPTH_ITEMS } from "./OrderOfOperationsDepth";

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
  /** Term ranges of a Seq drawn with a left-to-right arrow over them: a run of equal-priority operations being worked in turn. */
  arrows?: Map<Seq, [number, number][]>;
}
const NO_HL: Hl = { nodes: new Set(), spans: new Map() };

// The move being made is UNDERLINED (as on a board), and a run of equal-priority operations gets a left-to-right arrow over it.
const BOX_OPEN = "\\textcolor{#1e3a8a}{\\underline{";
const BOX_CLOSE = "}}";
const ARROW_OPEN = "\\overrightarrow{\\vphantom{\\big(}"; // the strut lifts the arrow clear of the digits
const ARROW_CLOSE = "}";
const OPS_TEX: Record<Op, string> = { "+": " + ", "-": " - ", "*": " \\times ", "/": " \\div " };

const numTex = (v: number) => String(rd(v));

function texBody(seq: Seq, hl: Hl): string {
  const spans = hl.spans.get(seq) ?? [];
  const arrows = hl.arrows?.get(seq) ?? [];
  let out = "";
  seq.terms.forEach((t, i) => {
    if (arrows.some((s) => s[0] === i)) out += ARROW_OPEN;
    if (spans.some((s) => s[0] === i)) out += BOX_OPEN;
    out += texTerm(t, hl, i === 0);
    if (spans.some((s) => s[1] === i)) out += BOX_CLOSE;
    if (arrows.some((s) => s[1] === i)) out += ARROW_CLOSE;
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

/** Which pyramid tiers a step lights (see BidmasPyramid). */
interface Tiers { strong: PyramidTier[]; soft: PyramidTier[] }

interface FlatRes {
  seq: Seq;
  spans: [number, number][];
  nodes: Node[];
  /** Lower-case stage name: "indices", "multiply (left to right)", "add"… */
  name: string;
  produced: number[];
  /** Pyramid tiers this stage uses: the move itself, and its equal-priority partner. */
  tiers: Tiers;
  /** Term ranges holding a run of 2+ equal-priority operations: drawn with a left-to-right arrow. */
  arrows?: [number, number][];
}

const TIER_OF: Record<Op, PyramidTier> = { "+": "A", "-": "S", "*": "M", "/": "D" };
/** The other operation on the same pyramid tier row (× ⇄ ÷, + ⇄ −). */
const PARTNER: Record<Op, Op> = { "+": "-", "-": "+", "*": "/", "/": "*" };

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
    return { seq: { t: "seq", terms, ops: seq.ops }, spans: [], nodes, name, produced, tiers: { strong: ["I"], soft: [] } };
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
    const strong = [...used].map((o) => TIER_OF[o]);
    const soft = [...used].map((o) => PARTNER[o]).filter((o) => !used.has(o) && seq.ops.includes(o)).map((o) => TIER_OF[o]);
    // A run of two or more × ÷ in a row is walked left to right: draw the arrow over each such run.
    const arrows: [number, number][] = [];
    for (let j = 0; j < seq.ops.length; ) {
      if (!isMD(seq.ops[j])) { j++; continue; }
      let k = j;
      while (k + 1 < seq.ops.length && isMD(seq.ops[k + 1])) k++;
      if (k > j) arrows.push([j, k + 1]);
      j = k + 1;
    }
    return { seq: { t: "seq", terms, ops }, spans, nodes: [], name: base + (chained ? " (left to right)" : ""), produced, tiers: { strong, soft }, arrows };
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
    tiers: { strong: [TIER_OF[seq.ops[0]]], soft: seq.ops.includes(PARTNER[seq.ops[0]]) ? [TIER_OF[PARTNER[seq.ops[0]]]] : [] },
    // Only + and − left and more than one of them: the whole line is one run, worked left to right.
    arrows: seq.ops.length > 1 ? [[0, seq.terms.length - 1]] : [],
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
  tiers: Tiers;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** The next BIDMAS move on `root`, or null when it is already a single number. */
function nextStep(root: Seq): StepOut | null {
  const { leaves, fracs } = scan(root);
  const reducible = leaves.filter((l) => !isSingleNum(l.seq));

  // ── B: brackets first (innermost), with root signs and fraction bars acting as brackets ──
  if (reducible.length > 0 || fracs.length > 0) {
    const hl: Hl = { nodes: new Set(), spans: new Map(), arrows: new Map() };
    const repl = new Map<Node, Node>();
    const produced: number[] = [];
    const names = new Set<string>();
    const inner = new Set<PyramidTier>();
    for (const leaf of reducible) {
      const r = stepFlat(leaf.seq);
      repl.set(leaf.seq, r.seq);
      if (r.spans.length) hl.spans.set(leaf.seq, r.spans);
      if (r.arrows?.length) hl.arrows!.set(leaf.seq, r.arrows);
      r.nodes.forEach((x) => hl.nodes.add(x));
      produced.push(...r.produced);
      names.add(r.name);
      r.tiers.strong.forEach((t) => inner.add(t));
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
    // The move is "brackets"; the operation worked inside them shows softly.
    return { label: label + ":", hl, after, produced, tiers: { strong: ["B"], soft: [...inner] } };
  }

  // ── Everything left is a flat line: I, then DM, then AS ──
  if (isSingleNum(root)) return null;
  const r = stepFlat(root);
  const hl: Hl = {
    nodes: new Set(r.nodes),
    spans: r.spans.length ? new Map([[root, r.spans]]) : new Map(),
    arrows: r.arrows?.length ? new Map([[root, r.arrows]]) : new Map(),
  };
  return { label: cap(r.name) + ":", hl, after: normSeq(r.seq), produced: r.produced, tiers: r.tiers };
}

interface RunStep { label: string; before: Seq; hl: Hl; after: Seq; tiers: Tiers }
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
    steps.push({ label: s.label, before: cur, hl: s.hl, after: s.after, tiers: s.tiers });
    produced.push(...s.produced);
    cur = s.after;
  }
  return null;
}

/** Worked-example steps: each rewrites the line with the next move boxed, then the result. */
function workingSteps(ast: Seq): WorkingStep[] {
  const run = runSteps(ast);
  if (!run) return [tStep("Work through the brackets first, then indices, then × and ÷, then + and −.")];
  // `extra.pyramid` tells the Worked Example's picture slot which BIDMAS tiers to light.
  // `extra.ooo` carries the two lines for the board-style renderer below (line, arrow down, next line).
  return run.steps.map((s) => {
    const before = texBody(s.before, s.hl), after = texBody(s.after, NO_HL);
    return { ...mStep(s.label, [before, "= " + after]), extra: { pyramid: s.tiers, ooo: { before, after } } };
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

type NumMode = "whole" | "negatives" | "decimals";
/** Level 1: basic, chain, mixed · Level 2: brackets, indices, bracketsIndices · Level 3: roots, fraction, nested. */
type Family = "basic" | "chain" | "mixed" | "brackets" | "indices" | "bracketsIndices" | "roots" | "fraction" | "nested";
const LEVEL_OF: Record<Family, DifficultyLevel> = {
  basic: "level1", chain: "level1", mixed: "level1",
  brackets: "level2", indices: "level2", bracketsIndices: "level2",
  roots: "level3", fraction: "level3", nested: "level3",
};
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
  ],
  // Priority AND left-to-right in one line.
  mixed: [
    (c) => { const [x, d] = divPair(c, 2, 9); return E(x, "/", d, "*", M(c, 2, 9), "+", A(c, 1, 20)); },
    (c) => E(A(c, 20, 60), "-", A(c, 2, 12), "+", M(c, 2, 9), "*", M(c, 2, 9)),
    (c) => { const [x, d] = divPair(c, 2, 9); return E(A(c, 5, 30), "+", x, "/", d, "*", M(c, 2, 6)); },
    (c) => { const e = randInt(2, 9); return E(e * randInt(2, 6), "*", M(c, 2, 9), "/", e, "+", A(c, 1, 20)); },
    (c) => { const [x, d] = divPair(c, 2, 9); return E(A(c, 30, 70), "-", x, "/", d, "+", A(c, 1, 15)); },
    (c) => E(M(c, 2, 9), "*", M(c, 2, 9), "-", M(c, 2, 9), "*", M(c, 2, 9), "+", A(c, 1, 20)),
  ],
  brackets: [
    // Level 1 inside the bracket: the bracket itself needs "who goes first?"
    (c) => E(E(A(c, 2, 9), "+", M(c, 2, 5), "*", M(c, 2, 5)), "*", M(c, 2, 4)),
    (c) => E(A(c, 5, 30), "+", E(M(c, 2, 6), "*", M(c, 2, 6), "-", A(c, 1, 8))),
    (c) => { const [x, d] = divPair(c, 2, 5); return E(E(x, "/", d, "+", A(c, 1, 9)), "*", M(c, 2, 5)); },
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
    (c) => { const b = B(c, 2); return E(P(b, 2), "+", M(c, 2, 4), "*", P(B(c, 2), 2)); },
    (c) => {
      const b = randInt(2, 9);
      const divs = [2, 3, 4, 5, 6, 7, 8, 9].filter((d) => (b * b) % d === 0);
      return E(A(c, 5, 20), "+", A(c, 5, 20), "-", P(c.nm === "negatives" && Math.random() < 0.4 ? -b : b, 2), "/", pick(divs));
    },
    (c) => c.nm === "negatives" ? E(NEG(P(randInt(2, 7), 2)), "+", A(c, 1, 20)) : null,
    (c) => c.nm === "negatives" ? E(A(c, 1, 30), "-", NEG(P(randInt(2, 7), 2))) : null,
  ],
  bracketsIndices: [
    (c) => E(P(E(A(c, 1, 8), "+", A(c, 1, 8)), 2), "-", A(c, 1, 30)),
    (c) => E(P(E(A(c, 6, 15), "-", A(c, 1, 5)), 2), "+", A(c, 1, 20)),
    (c) => E(A(c, 1, 5), "+", M(c, 2, 4), "*", P(E(A(c, 1, 4), "+", A(c, 1, 4)), 2)),
    (c) => E(P(B(c, 2), 2), "+", E(A(c, 5, 15), "-", A(c, 1, 4)), "*", M(c, 2, 6)),
    (c) => { const e = pick([2, 3]); const t = e === 3 ? 3 : 7; return E(P(E(A(c, 1, t), "+", A(c, 1, t)), e), "+", A(c, 1, 20)); },
    (c) => { const [x, d] = divPair(c, 2, 5); return E(M(c, 2, 5), "*", P(E(x, "/", d), 2)); },
    (c) => {
      const s = randInt(3, 9);
      const divs = [2, 3, 4, 5, 6, 8, 9, 10, 12].filter((d) => (s * s) % d === 0);
      if (divs.length === 0) return null;
      const [a, b] = splitSum(c, s);
      return E(P(E(a, "+", b), 2), "/", pick(divs));
    },
  ],
  roots: [
    // √(a² + b²) and √(a² − b²) with whole-number roots, so "root of the first number only" is clean too.
    (c) => { const [x, y] = pick(TRIPLES); return E(R(E(x * x, "+", y * y)), "+", A(c, 1, 20)); },
    (c) => { const [x, y] = pick(TRIPLES); return E(M(c, 2, 5), "*", R(E(x * x, "+", y * y))); },
    (c) => { const [z, x] = pick<[number, number]>([[5, 3], [5, 4], [10, 6], [10, 8], [13, 5]]); return E(A(c, 10, 30), "-", R(E(z * z, "-", x * x))); },
    (c) => E(R(c.nm === "decimals" ? pick(DEC_SQUARES) : pick(SQUARES)), "+", A(c, 1, 20)),
    (c) => E(M(c, 2, 9), "*", R(c.nm === "decimals" ? pick(DEC_SQUARES) : pick(SQUARES))),
    (c) => E(R(c.nm === "decimals" ? pick(DEC_SQUARES) : pick(SQUARES.slice(0, 6))), "+", P(B(c, 2), 2)),
    (c) => E(M(c, 2, 6), "*", M(c, 2, 6), "-", R(c.nm === "decimals" ? pick(DEC_SQUARES) : pick(SQUARES.slice(0, 6)))),
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
    // Whole-number quotients on every part, so "treat the bar as ÷ only" gives a clean (wrong) number.
    (c) => { const d = randInt(2, 6), k1 = randInt(2, 7), k2 = randInt(2, 7); return E(F(E(d * k1, "+", d * k2), E(d)), "+", A(c, 1, 12)); },
    () => { const d = randInt(2, 6), k2 = randInt(2, 5), k1 = k2 + randInt(1, 5); return E(F(E(d * k1, "-", d * k2), E(d))); },
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

/**
 * Which level's IDEA an expression needs: 1 = just operations, 2 = needs a bracket or a power,
 * 3 = needs a root, a fraction bar or brackets inside brackets. Generation rejects any draw whose
 * level isn't the level being asked for, so a harder idea can never appear on an easier level.
 */
function levelOf(ast: Seq): 1 | 2 | 3 {
  let grouping = false, power = false, deep = false;
  const walk = (n: Node, depth: number) => {
    switch (n.t) {
      case "num": break;
      case "seq":
        if (depth > 0) grouping = true;
        if (depth > 1) deep = true;
        n.terms.forEach((t) => walk(t, depth + 1));
        break;
      case "pow": power = true; walk(n.base, depth); break;
      case "root": grouping = deep = true; walk(n.inner, depth); break;
      case "frac": grouping = deep = true; walk(n.num, depth); walk(n.den, depth); break;
      case "neg": walk(n.x, depth); break;
    }
  };
  walk(ast, 0);
  return deep ? 3 : grouping || power ? 2 : 1;
}
const levelNum = (l: DifficultyLevel) => (l === "level1" ? 1 : l === "level2" ? 2 : 3);

/** Does the BIDMAS order actually change the answer? (Guards the "no-trap" draws.) */
function orderMatters(ast: Seq, family: Family, answer: number): boolean {
  if (family === "basic" || family === "mixed") return rd(evalNode(ast, { lr: true })) !== answer;
  if (family === "brackets") return rd(evalNode(stripBrackets(ast))) !== answer;
  return true;
}

/** Every + − × ÷ an expression uses (a fraction bar counts as ÷; powers, roots and a leading minus are not operations). */
function opsUsed(ast: Node, out: Set<Op> = new Set()): Set<Op> {
  switch (ast.t) {
    case "seq": ast.ops.forEach((o) => out.add(o)); ast.terms.forEach((t) => opsUsed(t, out)); break;
    case "pow": opsUsed(ast.base, out); break;
    case "root": opsUsed(ast.inner, out); break;
    case "frac": out.add("/"); opsUsed(ast.num, out); opsUsed(ast.den, out); break;
    case "neg": opsUsed(ast.x, out); break;
  }
  return out;
}

/** `allowed` (optional): only draw expressions whose every operation is in the set. */
function buildEval(level: DifficultyLevel, family: Family, nm: NumMode, allowed?: ReadonlySet<Op>): { ast: Seq; info: Analysis } | null {
  const c: Ctx = { nm, level };
  for (let i = 0; i < 500; i++) {
    const ast = pick(SHAPES[family])(c);
    if (!ast) continue;
    if (allowed && [...opsUsed(ast)].some((o) => !allowed.has(o))) continue;
    if (levelOf(ast) !== levelNum(level)) continue;
    const info = analyse(ast, nm);
    if (info && orderMatters(ast, family, info.answer)) return { ast, info };
  }
  return null;
}

// ── QO pools ──────────────────────────────────────────────────────────────────
//
// The three levels are three IDEAS, each building on the one below:
//   1  Who goes first?          — × ÷ before + −, and equal priority goes left to right
//   2  Things that jump the queue — brackets and powers (clearing one leaves a Level 1 line)
//   3  Symbols that act as brackets — roots, fraction bars, brackets inside brackets
// A level's questions must need its idea (see levelOf), so levels never overlap.

// Level 1's Focus options need certain operations ticked (see OPS_POOL): × ÷ before + − (and Both) need one operation from
// each pair; Left to right needs a ÷ (24 ÷ 4 × 2, 36 ÷ 3 ÷ 2) or a − (20 − 8 + 3, 50 − 7 − 12). Unticking × and ÷ therefore
// greys out "× ÷ before + −" automatically, and ticking them again brings it back as it was.
const NEEDS_BOTH_PAIRS = [["opMul", "opDiv"], ["opAdd", "opSub"]];
const FOCUS: Record<DifficultyLevel, { family: Family; label: string; weight: number; requires?: (string | string[])[] }[]> = {
  level1: [
    { family: "basic", label: "× ÷ before + −", weight: 1, requires: NEEDS_BOTH_PAIRS },
    { family: "chain", label: "Left to right", weight: 2, requires: [["opDiv", "opSub"]] },
    { family: "mixed", label: "Both", weight: 3, requires: NEEDS_BOTH_PAIRS },
  ],
  level2: [
    { family: "brackets", label: "Brackets", weight: 1 },
    { family: "indices", label: "Powers", weight: 2 },
    { family: "bracketsIndices", label: "Both", weight: 3 },
  ],
  level3: [
    { family: "roots", label: "Roots", weight: 1 },
    { family: "fraction", label: "Fraction bar", weight: 2 },
    { family: "nested", label: "Nested brackets", weight: 3 },
  ],
};

const FOCUS_INFO: Record<DifficultyLevel, string> = {
  level1: "× ÷ before + −: mixed operations where multiplying or dividing comes first. Left to right: lines where equal-priority operations must be done in order (24 ÷ 4 × 2). Both: one line needing both ideas.",
  level2: "Brackets: a bracket changes what goes first. Powers: squares and cubes. Both: a bracket and a power in one line. Clearing them leaves a Level 1 question.",
  level3: "Roots and the fraction bar act as brackets: work out what is under the root, or the top and bottom of the fraction, first. Nested brackets: brackets inside brackets, innermost first.",
};

const focusPool = (level: DifficultyLevel): ToolMultiSelect => ({
  key: "focus",
  label: "Focus",
  info: FOCUS_INFO[level],
  options: FOCUS[level].map((f) => ({ value: f.family, label: f.label, weight: f.weight, defaultActive: true, ...(f.requires ? { requires: f.requires } : {}) })),
});

const NUM_OPTS: Record<NumMode, { label: string; weight: number }> = {
  whole: { label: "Whole numbers", weight: 1 },
  negatives: { label: "Negatives", weight: 2 },
  decimals: { label: "Decimals", weight: 3 },
};

const numPool = (offered: NumMode[]): ToolMultiSelect => ({
  key: "numbers",
  label: "Numbers",
  info: "What kind of numbers the question uses. Negatives bring in −3² against (−3)² and subtracting a negative.",
  options: offered.map((m) => ({
    value: m, label: NUM_OPTS[m].label, weight: NUM_OPTS[m].weight, defaultActive: m === "whole",
  })),
});

// Which operations a question may use. Unweighted (a variety / focus choice, not a difficulty rung). Evaluate only —
// Spot the Mistake's questions are built around specific mistakes, which already name their operations.
const OPS_BY_VALUE: Record<string, Op> = { opAdd: "+", opSub: "-", opMul: "*", opDiv: "/" };
const OPS_POOL: ToolMultiSelect = {
  key: "operations",
  label: "Operations",
  info: "Which operations can appear in a question (a fraction bar counts as ÷). Left to right needs two operations of the same priority: × and ÷, or + and −. × ÷ before + − needs at least one from each pair. If the ticked operations can't make that kind of question, ones that can are used instead, and only if none can does it use any operation.",
  options: [
    { value: "opAdd", label: "+ Add", defaultActive: true },
    { value: "opSub", label: "− Subtract", defaultActive: true },
    { value: "opMul", label: "× Multiply", defaultActive: true },
    { value: "opDiv", label: "÷ Divide", defaultActive: true },
  ],
};

const EVAL_POOLS: Record<DifficultyLevel, { focus: ToolMultiSelect; ops: ToolMultiSelect; nums: ToolMultiSelect | null }> = {
  level1: { focus: focusPool("level1"), ops: OPS_POOL, nums: null },
  level2: { focus: focusPool("level2"), ops: OPS_POOL, nums: numPool(["whole", "negatives"]) },
  level3: { focus: focusPool("level3"), ops: OPS_POOL, nums: numPool(["whole", "negatives", "decimals"]) },
};

// ── Mistakes (each belongs to the level whose idea it gets wrong) ──────────────

type MistakeId =
  | "leftToRight" | "mulFirst" | "addFirst"
  | "ignoreBrackets" | "powTimes" | "negSquare"
  | "rootGroup" | "fracGroup";

interface MistakeDef {
  label: string;
  level: DifficultyLevel;
  family: Family;
  nm: NumMode;
  /** The wrong value the student arrives at. */
  wrong: (ast: Seq) => number;
  /** Extra requirement on the drawn expression. */
  needs?: (ast: Seq) => boolean;
  /** Short note printed after the answer. */
  desc: string;
  /** Full explanation, the first step of the worked example. */
  explain: string;
}

/** Splices the contents of every root sign and fraction bar into the line — what a student sees if they
 *  treat √(9 + 16) as √9 + 16, or (a + b)/c as a + b/c. */
function flattenGroups(s: Seq): Seq {
  const terms: Node[] = [];
  const ops: Op[] = [];
  const push = (ts: Node[], os: Op[], lead?: Op) => {
    if (lead) ops.push(lead);
    ts.forEach((t, i) => { if (i > 0) ops.push(os[i - 1]); terms.push(t); });
  };
  s.terms.forEach((t, i) => {
    const lead = i > 0 ? s.ops[i - 1] : undefined;
    if (t.t === "root" && t.inner.t === "seq") {
      const inner = t.inner;
      push([R(inner.terms[0]), ...inner.terms.slice(1)], inner.ops, lead);
    } else if (t.t === "frac") {
      if (lead) ops.push(lead);
      t.num.terms.forEach((x, k) => { if (k > 0) ops.push(t.num.ops[k - 1]); terms.push(x); });
      ops.push("/");
      t.den.terms.forEach((x, k) => { if (k > 0) ops.push(t.den.ops[k - 1]); terms.push(x); });
    } else {
      push([t], [], lead);
    }
  });
  return { t: "seq", terms, ops };
}

const MISTAKES: Record<MistakeId, MistakeDef> = {
  leftToRight: {
    label: "Ignores priority", level: "level1", family: "basic", nm: "whole",
    wrong: (a) => evalNode(a, { lr: true }),
    desc: "ignored priority and worked left to right",
    explain: "The student worked strictly from left to right. Multiplication and division must be done before addition and subtraction.",
  },
  mulFirst: {
    label: "× before ÷", level: "level1", family: "chain", nm: "whole",
    wrong: (a) => evalNode(a, { mulFirst: true }),
    needs: (a) => a.ops.includes("/") && a.ops.includes("*"),
    desc: "multiplied before dividing",
    explain: "The student did the multiplication before the division. Division and multiplication share a tier of the pyramid, so they are done in order from left to right.",
  },
  addFirst: {
    label: "+ before −", level: "level1", family: "chain", nm: "whole",
    wrong: (a) => evalNode(a, { addFirst: true }),
    needs: (a) => a.ops.includes("+") && a.ops.includes("-"),
    desc: "added before subtracting",
    explain: "The student did the addition before the subtraction. Addition and subtraction share a tier of the pyramid, so they are done in order from left to right.",
  },
  ignoreBrackets: {
    label: "Ignores brackets", level: "level2", family: "brackets", nm: "whole",
    wrong: (a) => evalNode(stripBrackets(a)),
    desc: "ignored the brackets",
    explain: "The student ignored the brackets. Brackets come first, so the part inside must be worked out before anything else.",
  },
  powTimes: {
    label: "Power as ×", level: "level2", family: "indices", nm: "whole",
    wrong: (a) => evalNode(a, { powAsMult: true }),
    needs: (a) => a.terms.some((t) => t.t === "pow"),
    desc: "multiplied the base by the power",
    explain: "The student multiplied the base by the power. A power means repeated multiplication: for example 3 squared is 3 times 3, not 3 times 2.",
  },
  negSquare: {
    label: "−3² as 9", level: "level2", family: "indices", nm: "negatives",
    wrong: (a) => evalNode(a, { negBug: true }),
    needs: (a) => a.terms[0].t === "neg",
    desc: "squared the negative sign as well",
    explain: "The student squared the negative sign as well. Without brackets only the number is squared, so the answer to the square is negative; brackets are needed to square a negative number.",
  },
  rootGroup: {
    label: "Root of part only", level: "level3", family: "roots", nm: "whole",
    wrong: (a) => evalNode(flattenGroups(a)),
    needs: (a) => a.terms.some((t) => t.t === "root" && t.inner.t === "seq" && t.inner.terms.every((x) => x.t === "num")),
    desc: "took the root of only the first number",
    explain: "The student took the square root of only the first number. The root sign acts like a bracket: work out everything under it first, then take the root.",
  },
  fracGroup: {
    label: "Bar not a bracket", level: "level3", family: "fraction", nm: "whole",
    wrong: (a) => evalNode(flattenGroups(a)),
    needs: (a) => a.terms.some((t) => t.t === "frac" && (t.num.terms.length > 1 || t.den.terms.length > 1)),
    desc: "treated the fraction bar as a divide sign only",
    explain: "The student treated the fraction bar as a divide sign only. The bar acts like brackets round the top and the bottom: work out each first, then divide.",
  },
};

const MISTAKES_BY_LEVEL: Record<DifficultyLevel, MistakeId[]> = {
  level1: ["leftToRight", "mulFirst", "addFirst"],
  level2: ["ignoreBrackets", "powTimes", "negSquare"],
  level3: ["rootGroup", "fracGroup"],
};

const mistakePool = (level: DifficultyLevel): ToolMultiSelect => ({
  key: "mistake",
  label: "Mistake Types",
  options: MISTAKES_BY_LEVEL[level].map((m) => ({ value: m, label: MISTAKES[m].label, defaultActive: true })),
});

const MISTAKE_BY_LEVEL: Record<DifficultyLevel, ToolMultiSelect> = {
  level1: mistakePool("level1"),
  level2: mistakePool("level2"),
  level3: mistakePool("level3"),
};

// Insert brackets needs the idea of brackets, so it starts at Level 2.
const taskPool = (level: DifficultyLevel): ToolMultiSelect => ({
  key: "task",
  label: "Task",
  options: [
    ...(level === "level1" ? [] : [{ value: "insertBrackets", label: "Insert brackets", defaultActive: true }]),
    { value: "spotMistake", label: "Spot the mistake", defaultActive: true },
    { value: "isCorrect", label: "Is it correct?", defaultActive: true },
  ],
});
const TASK_BY_LEVEL: Record<DifficultyLevel, ToolMultiSelect> = {
  level1: taskPool("level1"),
  level2: taskPool("level2"),
  level3: taskPool("level3"),
};

// ── Insert brackets ───────────────────────────────────────────────────────────

interface InsertDraw { flat: Seq; bracketed: Seq; group: Seq; target: number }

function genInsert(level: DifficultyLevel): InsertDraw | null {
  // Brackets are the Level 2 idea, so this starts at Level 2: a plain line (3–4 numbers); Level 3
  // adds a power (4–5 numbers), using the Level 2 idea inside the harder line.
  const allowed: Op[] = ["+", "-", "*", "/"];
  for (let tries = 0; tries < 600; tries++) {
    const n = level === "level3" ? pick([4, 5]) : pick([3, 4, 4]);
    const terms: Node[] = Array.from({ length: n }, () => N(Math.random() < 0.12 ? 1 : randInt(2, 9)));
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
          ops: [...ops.slice(0, i), ...ops.slice(j)],
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
  const { focus, nums } = EVAL_POOLS[level];
  // Focus options the ticked operations can't make are skipped (they show greyed out in the popover).
  const masked = maskUnmetOptions([focus, OPS_POOL], resolveMultiSelectValues([focus, OPS_POOL], msv));
  const picked = pickActive(masked, focus.options) as Family;
  const nm = (nums ? pickActive(msv, nums.options) : "whole") as NumMode;
  // The ticked operations (none ticked = no restriction). If the picked Focus can't be made from them, try the
  // level's other active Focus options before giving the restriction up.
  const active = new Set(OPS_POOL.options.filter((o) => msv[o.value] ?? o.defaultActive).map((o) => OPS_BY_VALUE[o.value]));
  const allowed = active.size === 0 || active.size === 4 ? undefined : active;
  const others = focus.options.filter((o) => o.value !== picked && (masked[o.value] ?? o.defaultActive)).map((o) => o.value as Family).sort(() => Math.random() - 0.5);
  let family = picked;
  let built: { ast: Seq; info: Analysis } | null = null;
  if (allowed) {
    for (const f of [picked, ...others]) {
      built = buildEval(level, f, nm, allowed) ?? buildEval(level, f, "whole", allowed);
      if (built) { family = f; break; }
    }
  }
  built = built ?? buildEval(level, picked, nm) ?? buildEval(level, picked, "whole");
  const ast = built?.ast ?? FALLBACK;
  const answer = built?.info.answer ?? 23;
  const dl = texBody(ast, NO_HL);
  const score = weightOf(focus.options, family) + (nums ? weightOf(nums.options, nm) : 0);
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

// ── Students' working ─────────────────────────────────────────────────────────

type BugOrder = "lr" | "mulFirst" | "addFirst";

/** The lines a student writes (after the first) when doing a flat line in the wrong order. */
function buggyChain(seq: Seq, order: BugOrder): Seq[] {
  const lines: Seq[] = [];
  let cur = seq;
  while (cur.ops.length > 0) {
    const idx = (o: Op) => cur.ops.indexOf(o);
    const md = cur.ops.findIndex((o) => o === "*" || o === "/");
    let j = 0;
    if (order === "mulFirst") j = idx("*") >= 0 ? idx("*") : idx("/") >= 0 ? idx("/") : 0;
    else if (order === "addFirst") j = md >= 0 ? md : idx("+") >= 0 ? idx("+") : 0;
    const v = applyOp((cur.terms[j] as Num).v, cur.ops[j], (cur.terms[j + 1] as Num).v);
    cur = {
      t: "seq",
      terms: [...cur.terms.slice(0, j), N(v), ...cur.terms.slice(j + 2)],
      ops: [...cur.ops.slice(0, j), ...cur.ops.slice(j + 1)],
    };
    lines.push(cur);
  }
  return lines;
}

/** Lines of a student's working for a mistake, or null if this expression can't show it. */
function studentLines(id: MistakeId, ast: Seq): Seq[] | null {
  const flatNums = ast.terms.every((t) => t.t === "num");
  const finish = (first: Seq): Seq[] | null => {
    const run = runSteps(first);
    return run ? [first, ...run.steps.map((s) => s.after)] : null;
  };
  switch (id) {
    case "leftToRight": return flatNums ? buggyChain(ast, "lr") : null;
    case "mulFirst": return flatNums ? buggyChain(ast, "mulFirst") : null;
    case "addFirst": return flatNums ? buggyChain(ast, "addFirst") : null;
    case "ignoreBrackets": {
      const run = runSteps(stripBrackets(ast));
      return run ? run.steps.map((s) => s.after) : null;
    }
    case "rootGroup":
    case "fracGroup": {
      const run = runSteps(flattenGroups(ast));
      return run ? run.steps.map((s) => s.after) : null;
    }
    case "powTimes":
    case "negSquare": {
      const terms = ast.terms.map((t) => {
        if (id === "powTimes" && t.t === "pow" && t.base.t === "num") return N(t.base.v * t.exp);
        if (id === "negSquare" && t.t === "neg" && t.x.t === "pow" && t.x.base.t === "num") return N(Math.pow(t.x.base.v, t.x.exp));
        return t;
      });
      return finish({ t: "seq", terms, ops: ast.ops });
    }
  }
}

interface MistakeDraw { id: MistakeId; def: MistakeDef; ast: Seq; right: number; wrong: number; lines: Seq[] }

function drawMistake(level: DifficultyLevel, msv: Record<string, boolean>): MistakeDraw | null {
  const id = pickActive(msv, MISTAKE_BY_LEVEL[level].options) as MistakeId;
  const def = MISTAKES[id];
  for (let i = 0; i < 80; i++) {
    const built = buildEval(level, def.family, def.nm);
    if (!built || (def.needs && !def.needs(built.ast))) continue;
    const wrong = rd(def.wrong(built.ast));
    const right = built.info.answer;
    if (!Number.isFinite(wrong) || wrong === right || dpOf(wrong) > 2 || Math.abs(wrong) > 1000) continue;
    // The student's lines must actually arrive at the wrong answer.
    const lines = studentLines(id, built.ast);
    const last = lines?.[lines.length - 1];
    if (!lines || !last || !isSingleNum(last) || rd((last.terms[0] as Num).v) !== wrong) continue;
    return { id, def, ast: built.ast, right, wrong, lines };
  }
  return null;
}

const NAMES = ["Matthew", "Samuel", "Matilda", "Priya", "Jamal", "Elena", "Kofi", "Sana"];
const rnd = () => Math.floor(Math.random() * 1_000_000);

function genMistake(level: DifficultyLevel, msv: Record<string, boolean>): AnyQuestion {
  const d = drawMistake(level, msv);
  if (!d) return genEvaluate(level, {});
  const dl = texBody(d.ast, NO_HL);
  return {
    kind: "worded",
    lines: [
      "A student works out:",
      `$${dl}$`,
      ...d.lines.map((l) => `$= ${texBody(l, NO_HL)}$`),
      "Find the mistake and the correct answer.",
    ],
    answer: numTex(d.right),
    answerLatex: numTex(d.right),
    answerSuffix: `(they ${d.def.desc})`,
    working: [tStep(d.def.explain), ...workingSteps(d.ast)],
    _fix: {
      intro: "A student works out:",
      // one aligned block so every "=" lines up under the first
      mathTex: `\\begin{aligned}${dl} &= ${d.lines.map((l) => texBody(l, NO_HL)).join(" \\\\ &= ")}\\end{aligned}`,
      ask: "Find the mistake and the correct answer.",
      answerTex: numTex(d.right),
      note: `They ${d.def.desc}.`,
    } satisfies FixView,
    key: `ooo-mistake-${level}-${d.id}-${dl}-${rnd()}`,
    difficulty: level,
  } as unknown as AnyQuestion;
}

/** "Matthew says 9 + 3 × 2 = 15. Is Matthew correct?" — half true, half a plausible mistake. */
function genIsCorrect(level: DifficultyLevel, msv: Record<string, boolean>): AnyQuestion {
  const d = drawMistake(level, msv);
  if (!d) return genEvaluate(level, {});
  const name = pick(NAMES);
  const correct = Math.random() < 0.5;
  const claim = correct ? d.right : d.wrong;
  const dl = texBody(d.ast, NO_HL);
  const verdict = correct ? "Yes" : "No";
  return {
    kind: "worded",
    lines: [`${name} says $${dl} = ${numTex(claim)}$.`, `Is ${name} correct? Show how you know.`],
    answer: `${verdict}: ${numTex(d.right)}`,
    answerLatex: `\\mathrm{${verdict}:}\\; ${dl} = ${numTex(d.right)}`,
    working: correct ? workingSteps(d.ast) : [tStep(d.def.explain), ...workingSteps(d.ast)],
    _fix: {
      intro: `${name} says`,
      mathTex: `${dl} = ${numTex(claim)}`,
      ask: `Is ${name} correct? Show how you know.`,
      answerTex: `\\mathrm{${verdict}:}\\; ${dl} = ${numTex(d.right)}`,
    } satisfies FixView,
    key: `ooo-iscorrect-${level}-${d.id}-${dl}-${correct}-${rnd()}`,
    difficulty: level,
  } as unknown as AnyQuestion;
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
      { ...mStep("Brackets go here:", [flatTex, "\\longrightarrow " + brHl]), extra: { pyramid: { strong: ["B"], soft: [] } } },
      ...workingSteps(d.bracketed),
    ],
    _fix: {
      intro: "Insert one pair of brackets to make this correct:",
      mathTex: `${flatTex} = ${d.target}`,
      ask: "",
      answerTex: `${brTex} = ${d.target}`,
    } satisfies FixView,
    key: `ooo-insert-${level}-${flatTex}-${d.target}-${Math.floor(Math.random() * 1_000_000)}`,
    difficulty: level,
  } as unknown as AnyQuestion;
}

/** Maths that shrinks (never grows) to fit the width it is given, so a long line of working is scaled, not clipped or wrapped. */
function FitMath({ tex }: { tex: string }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const o = outer.current, i = inner.current;
    if (!o || !i) return;
    // `zoom` (unlike transform) changes layout, so the block's height follows its scale and nothing overlaps.
    const measure = () => {
      const natural = i.getBoundingClientRect().width / scaleRef.current;
      const next = natural > 0 ? Math.min(1, o.clientWidth / natural) : 1;
      if (Math.abs(next - scaleRef.current) > 0.005) { scaleRef.current = next; setScale(next); }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(o); ro.observe(i); // the inner box resizes once KaTeX has rendered
    return () => ro.disconnect();
  }, [tex]);
  const scaleRef = useRef(1);
  scaleRef.current = scale;
  return (
    <div ref={outer} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <div ref={inner} style={{ display: "inline-block", whiteSpace: "nowrap", flexShrink: 0, zoom: scale } as React.CSSProperties}>
        <MathRenderer latex={tex} />
      </div>
    </div>
  );
}

/** How a Spot-the-Mistake question is laid out: a short lead-in, ONE maths block, a short ask. */
interface FixView { intro: string; mathTex: string; ask: string; answerTex: string; note?: string }

// One step down from the question's size, for the lead-in / ask text around the maths.
const SMALLER: Record<string, string> = { "text-lg": "text-sm", "text-xl": "text-base", "text-2xl": "text-lg", "text-3xl": "text-xl", "text-4xl": "text-2xl", "text-5xl": "text-3xl", "text-7xl": "text-5xl" };

/** Spot-the-Mistake layout: small prose, the (aligned) working large, answer appended on the whiteboard.
 *  Evaluate questions fall through to the standard display. `compact` is true on a worksheet, undefined on the
 *  whiteboard, false in Worked Example / fullscreen (the Worked Example draws its own answer). */
const questionRenderer = (q: AnyQuestion, showAnswer: boolean, _cs: string, compact?: boolean, _idx?: number, qo?: QOSnapshot, fontClass = "text-3xl") => {
  const fix = (q as unknown as { _fix?: FixView })._fix;
  const inlineAnswer = showAnswer && (compact === undefined || !!qo?.fullscreen);
  if (!fix) {
    return (
      <>
        <QuestionDisplay q={q} cls={fontClass} />
        {inlineAnswer && <div className={`${fontClass} font-bold`} style={{ color: "#166534" }}><AnswerDisplay q={q} /></div>}
      </>
    );
  }
  const small = SMALLER[fontClass] ?? "text-base";
  return (
    <div className="flex flex-col items-center" style={{ gap: compact ? 4 : 12, width: "100%" }}>
      <div className={`${small} font-semibold`} style={{ color: "#374151" }}>{fix.intro}</div>
      <div className={`${fontClass} font-semibold`} style={{ color: "#000", width: "100%" }}>
        <FitMath tex={fix.mathTex} />
      </div>
      {fix.ask && <div className={`${small} font-semibold`} style={{ color: "#374151" }}>{fix.ask}</div>}
      {inlineAnswer && (
        <div className="flex flex-col items-center" style={{ gap: 2, color: "#166534", marginTop: 4 }}>
          <div className={`${fontClass} font-bold`} style={{ width: "100%" }}><FitMath tex={fix.answerTex} /></div>
          {fix.note && <div className={`${small} font-semibold`}>{fix.note}</div>}
        </div>
      )}
    </div>
  );
};

const generateQuestion = (
  tool: string,
  level: DifficultyLevel,
  _variables: Record<string, boolean>,
  _dropdownValue: string,
  multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  if (tool === "evaluate") return genEvaluate(level, multiSelectValues);
  const task = pickActive(multiSelectValues, TASK_BY_LEVEL[level].options);
  return task === "insertBrackets" ? genInsertQuestion(level)
    : task === "isCorrect" ? genIsCorrect(level, multiSelectValues)
    : genMistake(level, multiSelectValues);
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
      multiSelect: [EVAL_POOLS.level1.focus, OPS_POOL],
      difficultySettings: {
        level1: { variables: [], dropdown: null, multiSelect: [EVAL_POOLS.level1.focus, OPS_POOL] },
        level2: { variables: [], dropdown: null, multiSelect: [EVAL_POOLS.level2.focus, OPS_POOL, EVAL_POOLS.level2.nums as ToolMultiSelect] },
        level3: { variables: [], dropdown: null, multiSelect: [EVAL_POOLS.level3.focus, OPS_POOL, EVAL_POOLS.level3.nums as ToolMultiSelect] },
      },
    },
    fixIt: {
      name: "Spot the Mistake",
      variables: [],
      dropdown: null,
      multiSelect: [TASK_BY_LEVEL.level1, MISTAKE_BY_LEVEL.level1],
      difficultySettings: {
        level1: { variables: [], dropdown: null, multiSelect: [TASK_BY_LEVEL.level1, MISTAKE_BY_LEVEL.level1] },
        level2: { variables: [], dropdown: null, multiSelect: [TASK_BY_LEVEL.level2, MISTAKE_BY_LEVEL.level2] },
        level3: { variables: [], dropdown: null, multiSelect: [TASK_BY_LEVEL.level3, MISTAKE_BY_LEVEL.level3] },
      },
    },
  },
};

const INFO_SECTIONS: InfoSection[] = [
  { title: "How the levels build", icon: "🔺", content: [
    { label: "Level 1 — Who goes first?", detail: "Operations only. × and ÷ come before + and −, and operations on the same tier of the pyramid (× ÷, or + −) are done left to right." },
    { label: "Level 2 — Things that jump the queue", detail: "Brackets and powers (squares and cubes) go first. Once they are cleared, what is left is a Level 1 question." },
    { label: "Level 3 — Symbols that act as brackets", detail: "A root sign and a fraction bar work like brackets: do everything under the root, or on the top and bottom, first. Also brackets inside brackets, innermost first." },
    { label: "Never the same question twice over", detail: "Each level's questions need that level's idea, so a Level 3 question can't be a Level 1 or 2 one." },
  ]},
  { title: "Evaluate", icon: "🔢", content: [
    { label: "Overview", detail: "Work out an expression. The Worked Example rewrites the line one stage at a time, boxing the part that is done next, and lights the matching tier of the BIDMAS pyramid." },
    { label: "Focus", detail: "Which idea within the level to practise. Level 1: × ÷ before + −, Left to right, or Both. Level 2: Brackets, Powers, or Both. Level 3: Roots, Fraction bar, or Nested brackets." },
    { label: "Operations (Evaluate, all levels)", detail: "Which of + − × ÷ can appear (all four by default; a fraction bar counts as ÷). For example, with Left to right and only × ÷ ticked you get 24 ÷ 4 × 2 style lines; with only + − ticked, 20 − 8 + 3 style lines. × ÷ before + − needs at least one operation from each pair. If the ticked operations can't make the chosen Focus, another ticked Focus is used, and only if none can does the question use any operation." },
    { label: "Numbers (Levels 2–3)", detail: "Whole numbers (default), negatives, or decimals. Negatives bring in −3² against (−3)² and subtracting a negative." },
    { label: "BIDMAS pyramid", detail: "Whiteboard shows the pyramid in the working box (hide it with the box's button). B, then I, then D and M together, then A and S together. D ÷ = M × and A + = S − are each ONE tile with an equals sign: they have equal priority, and \"left to right\" means the order they appear in the question, not the order they sit on the pyramid." },
  ]},
  { title: "Spot the Mistake", icon: "🧐", content: [
    { label: "Spot the mistake", detail: "A student's working is shown, line by line, with a mistake in it; find the mistake and the correct answer." },
    { label: "Is it correct?", detail: "Someone says an expression equals a value — sometimes right, sometimes a classic mistake." },
    { label: "Insert brackets (Levels 2–3)", detail: "One pair of brackets must be added to make a statement true. Each question has exactly one correct place for them." },
    { label: "Mistakes by level", detail: "Level 1: ignoring priority, × before ÷, + before −. Level 2: ignoring brackets, treating a power as ×, squaring a negative sign. Level 3: taking the root of only part of what is under the sign, treating the fraction bar as only a divide sign." },
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard", detail: "One question with working space beside it, with the BIDMAS pyramid available." },
    { label: "Worked Example", detail: "Step by step: each press shows the next stage, with the part being worked out underlined (and a left-to-right arrow over a run of equal-priority operations), an arrow down to the next line, and its pyramid tier lit." },
    { label: "Worksheet", detail: "A grid of questions with PDF export. The Smart Progressor orders the sheet easy to hard." },
  ]},
];

// Worked Example, as written on a board: the line with the move underlined (and an arrow over a run of equal-priority
// operations), an arrow down, then the next line with the rest of the sum pulled down. The second line fades in on the
// next press, like a fragment-authored step; everywhere else (Show All, past steps) both lines are shown.
const oooStepRenderer = (s: WorkingStep, _cs: string, _qo?: QOSnapshot, reveal?: number): JSX.Element | null => {
  const o = (s.extra as { ooo?: { before: string; after: string } } | undefined)?.ooo;
  if (!o) return null;
  const showAfter = reveal === undefined || reveal >= 1;
  const fade = { opacity: showAfter ? 1 : 0, transition: "opacity 0.35s ease" };
  return (
    <div className="flex flex-col gap-1">
      <span className="text-left text-xl leading-snug">{s.label}</span>
      <div className="flex flex-col items-center text-2xl sm:text-3xl">
        <FitWidth><MathRenderer latex={o.before} /></FitWidth>
        <svg width="22" height="30" viewBox="0 0 22 30" style={{ display: "block", ...fade }} aria-hidden>
          <path d="M11 2 V22" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <polygon points="4,18 18,18 11,28" fill="#475569" />
        </svg>
        <div style={fade}><FitWidth><MathRenderer latex={o.after} /></FitWidth></div>
      </div>
    </div>
  );
};

const pyramidOf = (step: WorkingStep) => (step.extra as { pyramid?: { strong: PyramidTier[]; soft: PyramidTier[] } } | undefined)?.pyramid;

// Exposes internals to the generator smoke tests (src/tests/generators.test.ts) and to
// the engine tests (src/tests/orderOfOperations.test.ts).
export const __test = {
  TOOL_CONFIG,
  generateQuestion,
  depthItems: DEPTH_ITEMS,
  engine: { E, P, R, F, NEG, N, texBody, NO_HL, runSteps, evalNode, analyse, SHAPES, buildEval, opsUsed, MISTAKES, genInsert, drawMistake, studentLines, levelOf, LEVEL_OF, EVAL_POOLS, MISTAKES_BY_LEVEL },
};

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      questionRenderer={questionRenderer}
      answerRenderer={(q) => <AnswerDisplay q={q} />}
      // The pyramid is the picture beside the steps: the tier being used lights up each step.
      stepVisualRenderer={(step) => {
        const t = pyramidOf(step);
        return t ? <BidmasPyramid strong={t.strong} soft={t.soft} maxWidth={230} /> : null;
      }}
      stepRenderer={oooStepRenderer}
      stepVisualKeepsWorking
      depthItems={DEPTH_ITEMS}
      workingScaffold={{ label: "BIDMAS pyramid", placement: "workingCorner", cornerWidth: 190, render: () => <BidmasPyramid maxWidth={260} /> }}
      defaults={{ numColumns: 2 }}
    />
  );
}
