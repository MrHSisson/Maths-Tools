// Negative & Zero Indices and Fractional Indices — the laws with letters (and number bases) when the index is zero, negative or fractional.
// Every question carries `_alg` = { expr, result }: the expression asked and the answer as monomials, so a test can evaluate both at
// numeric points (arithmetic, not the generator's own rule). Answer form (positive indices / leave negatives) follows specs/indices-extended.md.
import {
  type Built, type Expr, type Form, type Mono, type Rat,
  rat, mono, mmul, mdiv, mpow, fmtMono, plainMono, fmtExp, bracket, hasNegativeIndex, isInt,
  rnd, choose, step, rneg, radd, rsub, rmul,
} from "./IndicesCore";
import type { WorkingStep } from "../../shared";
import { gcd } from "../../shared";

const LETTERS = ["x", "y", "a", "b", "m", "n", "p", "t"] as const;
const letter = () => choose(LETTERS);
const M = (k: number, l: string, e: number | Rat): Mono => mono(k, { [l]: e });
const ex = (m: Mono): Expr => ({ t: "mono", m });
const par = (r: Rat) => (r[0] < 0 ? `(${fmtExp(r)})` : fmtExp(r));
const sup = (e: string) => `^{${e}}`;
const show = (m: Mono) => fmtMono(m, "leave");
/** an index sum or difference written out with brackets round negatives: 3+(-2) */
const sumText = (a: Rat, b: Rat) => `${fmtExp(a)}+${par(b)}`;
const diffText = (a: Rat, b: Rat) => `${fmtExp(a)}-${par(b)}`;

// Negative & Zero Indices: leaving negative indices in the answer is "write in index form", not "simplify"
const SIMPLIFY = (form: Form) => (form === "positive" ? "Simplify, giving your answer with positive indices:" : "Simplify:");
const NZ_SIMPLIFY = (form: Form) => (form === "positive" ? SIMPLIFY(form) : "Write in index form:");

/** assemble the question: the answer in the chosen form, and the working's last line (a negative index rewritten when the form asks) */
const build = (prompt: string, display: string, expr: Expr, result: Mono, form: Form, working: WorkingStep[], answerForm: Form = form): Built => {
  const w = [...working];
  if (answerForm === "positive" && hasNegativeIndex(result)) w.push(step("A negative index means one over the positive index:", `${show(result)} = ${fmtMono(result, "positive")}`));
  return { prompt, displayLatex: display, answer: plainMono(result, answerForm), answerLatex: fmtMono(result, answerForm), working: w, _idx: { expr, result } };
};
const frac = (top: string, bottom: string) => `\\dfrac{${top}}{${bottom}}`;

// ══ Negative & Zero Indices ═══════════════════════════════════════════════════════════════════════════════════════════════
// Level 1 writes every law in power notation; Level 2 writes the same laws as fractions (a fraction bar, reciprocals); Level 3 adds
// coefficients, brackets, two letters and combined laws in either notation. Number bases (2, 3, 5, 10) run through every level, and their
// answers are a single power k^n (not evaluated). A "key" is the letter, or the number base as a string.
const nz = (n: number) => { let v = 0; while (v === 0) v = rnd(-n, n); return r0(v); };
const r0 = (v: number) => v;
const keyOf = (num: boolean): string => (num ? String(choose([2, 3, 5, 10] as const)) : letter());
const PROMPT = (form: Form, num: boolean) => (num ? (form === "positive" ? "Write as a single power, with a positive index:" : "Write as a single power:") : NZ_SIMPLIFY(form));
const F = (m: Mono) => fmtMono(m, "positive"); // fraction notation: a negative index is written as a fraction

/** an expression written out in power notation (the second line of the working) */
const powerText = (e: Expr): string =>
  e.t === "mono" ? show(e.m)
    : e.t === "mul" ? `${powerText(e.a)} \\times ${powerText(e.b)}`
    : e.t === "div" ? `${powerText(e.a)} \\div ${e.b.t === "mono" ? powerText(e.b) : `\\left(${powerText(e.b)}\\right)`}`
    : e.t === "pow" ? `\\left(${powerText(e.a)}\\right)${sup(fmtExp(e.r))}` : "";
/** the index arithmetic for a single-key expression: 3+(-2), (-2)\times(-4) */
const wrapIdx = (t: string) => (/^-|[+\-]/.test(t) || t.includes("\\times") ? `(${t})` : t);
const idxText = (e: Expr, k: string): string =>
  e.t === "mono" ? fmtExp(e.m.e[k] ?? rat(0))
    : e.t === "pow" ? `${wrapIdx(idxText(e.a, k))} \\times ${par(e.r)}`
    : e.t === "mul" ? `${idxText(e.a, k)}+${wrapIdx(idxText(e.b, k))}`
    : `${idxText(e.a, k)}-${wrapIdx(idxText(e.b, k))}`;

/** working for a one-key law question: (fraction notation first) write the negative indices, then apply the laws */
const lawSteps = (displayLatex: string, expr: Expr, k: string, result: Mono, fraction: boolean): WorkingStep[] => {
  const out: WorkingStep[] = [];
  if (fraction) out.push(step("A fraction one over a power is a negative index. Write each one that way:", [displayLatex, `= ${powerText(expr)}`]));
  const nested = expr.t !== "mono" && (expr.a.t !== "mono" || (expr.t !== "pow" && expr.b.t !== "mono"));
  const label = expr.t === "pow" ? "A power of a power: multiply the indices:" : nested ? "Multiplying adds the indices, dividing subtracts them:" : expr.t === "mul" ? "Same base, so add the indices:" : "Same base, so subtract the indices (taking away a negative adds):";
  out.push(step(label, [fraction ? "" : powerText(expr), `= ${k}${sup(idxText(expr, k))}`, `= ${show(result)}`].filter(Boolean)));
  return out;
};
const lawBuild = (display: string, expr: Expr, k: string, res: Mono, form: Form, num: boolean, fraction: boolean): Built =>
  build(PROMPT(form, num), display, expr, res, form, lawSteps(display, expr, k, res, fraction));

/** Level 1: write between the forms — x^-3 ⇄ 1/x^3, 2x^-2 ⇄ 2/x^2 (number bases: 2^-3 ⇄ 1/2^3, not evaluated) */
const genNegative = (num: boolean, coef: boolean | null = null): Built => {
  const l = keyOf(num), p = rnd(1, 5), k = !num && (coef ?? Math.random() < 0.35) ? rnd(2, 6) : 1;
  const neg = M(k, l, -p);
  if (Math.random() < 0.55)
    return build("Write with a positive index:", show(neg), ex(neg), neg, "positive", [
      step(k === 1 ? "A negative index means one over the positive index:" : "Only the letter has the negative index:", [show(neg), `= ${fmtMono(neg, "positive")}`]),
    ]);
  const bottom = `${l}${p === 1 ? "" : sup(`${p}`)}`;
  return build(`Write as a power of ${l}:`, frac(`${k}`, bottom), ex(neg), neg, "leave", [
    step("One over a power is a negative power:", [frac(`${k}`, bottom), `= ${show(neg)}`]),
  ]);
};

/** Level 1: the zero index */
const genZero = (form: Form, num: boolean): Built => {
  const l = keyOf(num), v = rnd(0, 4);   // Level 1: bare terms only (coefficients arrive at Level 2)
  const one = (display: string, expr: Expr, steps: WorkingStep[], res: Mono = mono(1)) => build(PROMPT(form, num), display, expr, res, form, steps);
  if (v === 0) return one(`${l}${sup("0")}`, ex(M(1, l, 0)), [step("Anything to the power zero is 1:", `${l}${sup("0")} = 1`)]);
  if (v === 2) { const a = rnd(2, 4), inner = M(1, l, a); return one(`\\left(${show(inner)}\\right)${sup("0")}`, { t: "pow", a: ex(inner), r: rat(0) }, [step("The whole bracket is raised to the power zero:", `\\left(${show(inner)}\\right)${sup("0")} = 1`)]); }
  if (v === 3 || v === 1) {
    const a = rnd(2, 8), r = mmul(M(1, l, a), M(1, l, 0));
    return one(`${l}${sup(`${a}`)} \\times ${l}${sup("0")}`, { t: "mul", a: ex(M(1, l, a)), b: ex(M(1, l, 0)) }, [step("Same base, so add the indices:", [`${l}${sup(`${a}`)} \\times ${l}${sup("0")}`, `= ${l}${sup(`${a}+0`)}`, `= ${show(r)}`])], r);
  }
  const a = rnd(2, 7), r = mdiv(M(1, l, a), M(1, l, a));
  return one(`${l}${sup(`${a}`)} \\div ${l}${sup(`${a}`)}`, { t: "div", a: ex(M(1, l, a)), b: ex(M(1, l, a)) }, [
    step("Same base, so subtract the indices:", [`${l}${sup(`${a}`)} \\div ${l}${sup(`${a}`)}`, `= ${l}${sup(`${a}-${a}`)}`, `= ${l}${sup("0")}`]),
    step("Anything to the power zero is 1:", "= 1"),
  ], r);
};

/** Level 1: x^3 ÷ x^5 — the bottom power is bigger, so the index goes negative */
const genDivideNegative = (form: Form, num: boolean): Built => {
  const l = keyOf(num), m = rnd(2, 6), d = rnd(1, 3), n = m + d;   // bare terms: coefficients arrive at Level 2
  const a = M(1, l, m), b = M(1, l, n);
  const r = mdiv(a, b);
  const display = `${show(a)} \\div ${show(b)}`;
  return lawBuild(display, { t: "div", a: ex(a), b: ex(b) }, l, r, form, num, false);
};

/** Level 1: laws with a negative index — x^3 × x^-2, x^3 ÷ x^-2, x^-3 × x^-4 */
const genLawsNegative = (form: Form, num: boolean): Built => {
  const l = keyOf(num);
  for (let t = 0; t < 40; t++) {
    const kind = choose(["mulA", "mulB", "mulC", "divA", "divB"] as const);
    let a: number, b: number, mul = true;
    if (kind === "mulA") { a = rnd(2, 6); b = -rnd(1, 6); }
    else if (kind === "mulB") { a = -rnd(1, 6); b = -rnd(1, 6); }
    else if (kind === "mulC") { a = -rnd(1, 6); b = rnd(2, 7); }
    else if (kind === "divA") { a = rnd(2, 6); b = -rnd(1, 6); mul = false; }
    else { a = -rnd(1, 5); b = -rnd(1, 6); mul = false; }
    if ((mul ? a + b : a - b) === 0) continue;
    const A = M(1, l, a), B = M(1, l, b), res = mul ? mmul(A, B) : mdiv(A, B);
    return lawBuild(`${show(A)} ${mul ? "\\times" : "\\div"} ${show(B)}`, { t: mul ? "mul" : "div", a: ex(A), b: ex(B) }, l, res, form, num, false);
  }
  return genDivideNegative(form, num);
};

/** Level 1: powers of powers with a negative index — (x^-2)^-4, (x^-2)^3, (x^3)^-2 */
const genPowerOfPower = (form: Form, num: boolean): Built => {
  const l = keyOf(num);
  for (let t = 0; t < 40; t++) {
    const a = nz(5), b = nz(4);
    if ((a > 0 && b > 0) || Math.abs(a * b) > 20) continue;
    const inner = M(1, l, a), res = mpow(inner, rat(b))!;
    return lawBuild(`\\left(${show(inner)}\\right)${sup(`${b}`)}`, { t: "pow", a: ex(inner), r: rat(b) }, l, res, form, num, false);
  }
  return genLawsNegative(form, num);
};

// ── Level 2: the same laws, written as fractions ──────────────────────────────────────────────────────────────────────────
/** Level 2: a fraction bar — x^3/x^5, (x^3 × x^2)/x^7 */
/** `simple`: only the one-over form x^a/x^b (Level 1 fraction notation), not a product on the top or bottom */
const genFractionBar = (form: Form, num: boolean, simple = false): Built => {
  const l = keyOf(num);
  for (let t = 0; t < 40; t++) {
    const kind = simple ? 0 : rnd(0, 2), a = rnd(1, 7), b = rnd(2, 7), c = rnd(2, 8);
    const A = M(1, l, a), B = M(1, l, b), C = M(1, l, c);
    let expr: Expr, display: string, res: Mono;
    if (kind === 0) { if (a === b) continue; expr = { t: "div", a: ex(A), b: ex(B) }; display = frac(show(A), show(B)); res = mdiv(A, B); }
    else if (kind === 1) { expr = { t: "div", a: { t: "mul", a: ex(A), b: ex(B) }, b: ex(C) }; display = frac(`${show(A)} \\times ${show(B)}`, show(C)); res = mdiv(mmul(A, B), C); }
    else { expr = { t: "div", a: ex(A), b: { t: "mul", a: ex(B), b: ex(C) } }; display = frac(show(A), `${show(B)} \\times ${show(C)}`); res = mdiv(A, mmul(B, C)); }
    if (res.e[l] === undefined) continue;
    return build(PROMPT(form, num), display, expr, res, form, [
      step(kind === 0 ? "Same base, so subtract the indices:" : "Multiplying adds the indices, dividing subtracts them:", [powerText(expr), `= ${l}${sup(idxText(expr, l))}`, `= ${show(res)}`]),
    ]);
  }
  return genFractionBar(form, num, simple);
};

/** Level 2: reciprocals multiplied — 1/x^3 × x^5, 1/x^2 × 1/x^5 */
const genReciprocal = (form: Form, num: boolean): Built => {
  const l = keyOf(num);
  for (let t = 0; t < 40; t++) {
    const kind = rnd(0, 2), a = rnd(2, 6), b = rnd(2, 7);
    const [x, y] = kind === 0 ? [-a, b] : kind === 1 ? [-a, -b] : [a, -b];
    if (x + y === 0) continue;
    const A = M(1, l, x), B = M(1, l, y), res = mmul(A, B);
    const display = `${F(A)} \\times ${F(B)}`;
    return lawBuild(display, { t: "mul", a: ex(A), b: ex(B) }, l, res, form, num, true);
  }
  return genReciprocal(form, num);
};

/** Level 2: dividing by a reciprocal — x^3 ÷ 1/x^2, 1/x^3 ÷ 1/x^5, x^3 over 1/x^4 */
const genDivideReciprocal = (form: Form, num: boolean): Built => {
  const l = keyOf(num);
  for (let t = 0; t < 40; t++) {
    const kind = rnd(0, 2), a = rnd(2, 6), b = rnd(2, 6);
    const x = kind === 1 ? -a : a;
    if (x + b === 0) continue;
    const A = M(1, l, x), B = M(1, l, -b), res = mdiv(A, B);
    const display = kind === 2 ? frac(F(A), F(B)) : `${F(A)} \\div ${F(B)}`;
    return lawBuild(display, { t: "div", a: ex(A), b: ex(B) }, l, res, form, num, true);
  }
  return genDivideReciprocal(form, num);
};

/** Level 2: a power of a fraction — (1/x^2)^3, (1/x^3)^-2, (x^2/x^5)^2 */
/** `simple`: only a power of one-over, (1/x^a)^b (Level 1 fraction notation), not a power of a ratio */
const genFractionPower = (form: Form, num: boolean, simple = false): Built => {
  const l = keyOf(num);
  for (let t = 0; t < 40; t++) {
    if (simple || Math.random() < 0.6) {
      const a = rnd(2, 5), b = choose([2, 3, -2, -3] as const);
      const inner = M(1, l, -a), res = mpow(inner, rat(b))!;
      return lawBuild(`\\left(${F(inner)}\\right)${sup(`${b}`)}`, { t: "pow", a: ex(inner), r: rat(b) }, l, res, form, num, true);
    }
    const a = rnd(1, 6), b = rnd(1, 6), c = choose([2, 3, -2] as const);
    if (a === b) continue;
    const A = M(1, l, a), B = M(1, l, b), inner = mdiv(A, B), res = mpow(inner, rat(c))!;
    const expr: Expr = { t: "pow", a: { t: "div", a: ex(A), b: ex(B) }, r: rat(c) };
    return build(PROMPT(form, num), `\\left(${frac(show(A), show(B))}\\right)${sup(`${c}`)}`, expr, res, form, [
      step("Subtract the indices inside the bracket first:", [`${frac(show(A), show(B))} = ${l}${sup(`${a}-${b}`)}`, `= ${show(inner)}`]),
      step("Then multiply the indices:", [`\\left(${show(inner)}\\right)${sup(`${c}`)}`, `= ${l}${sup(`${fmtExp(inner.e[l])} \\times ${par(rat(c))}`)}`, `= ${show(res)}`]),
    ]);
  }
  return genFractionPower(form, num, simple);
};

// ── Level 3: coefficients, brackets, two letters and combined laws, in either notation ─────────────────────────────────────────
const disp = (m: Mono, fraction: boolean) => (fraction ? F(m) : show(m));

const genCoefficients = (form: Form): Built => {
  const l = letter();
  const fraction = Math.random() < 0.5;
  for (let t = 0; t < 60; t++) {
    const a = nz(5), b = nz(6);
    if (a > 0 && b > 0) continue;
    if (Math.random() < 0.5) { // multiply
      const k1 = rnd(2, 6), k2 = rnd(2, 6);
      if (a + b === 0) continue;
      const A = M(k1, l, a), B = M(k2, l, b), res = mmul(A, B);
      const display = `${disp(A, fraction)} \\times ${disp(B, fraction)}`;
      const w = [
        ...(fraction ? [step("Write each fraction with a negative index:", [display, `= ${show(A)} \\times ${show(B)}`])] : []),
        step("Multiply the numbers, and add the indices:", `${k1} \\times ${k2} = ${k1 * k2}, \\quad ${l}${sup(sumText(rat(a), rat(b)))} = ${l}${sup(`${a + b}`)}`),
      ];
      return build(NZ_SIMPLIFY(form), display, { t: "mul", a: ex(A), b: ex(B) }, res, form, w);
    }
    const c = rnd(2, 5), q = rnd(2, 5);
    if (a - b === 0) continue;
    const A = M(c * q, l, a), B = M(c, l, b), res = mdiv(A, B);
    const display = fraction ? `${F(A)} \\div ${F(B)}` : Math.random() < 0.4 ? frac(show(A), show(B)) : `${show(A)} \\div ${show(B)}`;
    const w = [
      ...(fraction ? [step("Write each fraction with a negative index:", [display, `= ${show(A)} \\div ${show(B)}`])] : []),
      step("Divide the numbers, and subtract the indices:", `${c * q} \\div ${c} = ${q}, \\quad ${l}${sup(diffText(rat(a), rat(b)))} = ${l}${sup(`${a - b}`)}`),
    ];
    return build(NZ_SIMPLIFY(form), display, { t: "div", a: ex(A), b: ex(B) }, res, form, w);
  }
  return genCoefficients(form);
};

const genBracket = (form: Form): Built => {
  const l = letter(), k = rnd(2, 5), a = rnd(0, 3) === 0 ? rnd(2, 4) : -rnd(1, 5), b = rnd(2, 3);
  const inner = M(k, l, a), res = mpow(inner, rat(b))!;
  const fraction = a < 0 && Math.random() < 0.5;
  const shown = fraction ? `\\left(${F(inner)}\\right)${sup(`${b}`)}` : bracket(inner, rat(b));
  return build(NZ_SIMPLIFY(form), shown, { t: "pow", a: ex(inner), r: rat(b) }, res, form, [
    ...(fraction ? [step("Write the fraction with a negative index:", [shown, `= ${bracket(inner, rat(b))}`])] : []),
    step("The outer power applies to the number and to the letter:", [bracket(inner, rat(b)), `= ${k}${sup(`${b}`)} \\times \\left(${l}${sup(`${a}`)}\\right)${sup(`${b}`)}`]),
    step("Work out the number, and multiply the indices:", `= ${k ** b}${l}${sup(`${a} \\times ${b}`)} = ${show(res)}`),
  ]);
};

const genTwoLetters = (form: Form): Built => {
  const [u, v] = choose([["x", "y"], ["a", "b"], ["m", "n"], ["p", "t"]] as const);
  const kind = rnd(0, 2), fraction = Math.random() < 0.5;
  if (kind === 0) {
    const k = rnd(2, 4), a = rnd(1, 4), b = -rnd(1, 3), e = rnd(2, 3);
    const inner = mono(k, { [u]: a, [v]: b }), res = mpow(inner, rat(e))!;
    const shown = fraction ? `\\left(${F(inner)}\\right)${sup(`${e}`)}` : bracket(inner, rat(e));
    return build(NZ_SIMPLIFY(form), shown, { t: "pow", a: ex(inner), r: rat(e) }, res, form, [
      ...(fraction ? [step("Write the fraction with a negative index:", [shown, `= ${bracket(inner, rat(e))}`])] : []),
      step("The outer power applies to the number and to each letter:", [bracket(inner, rat(e)), `= ${k}${sup(`${e}`)} \\times \\left(${u}${sup(`${a}`)}\\right)${sup(`${e}`)} \\times \\left(${v}${sup(`${b}`)}\\right)${sup(`${e}`)}`]),
      step("Work out the number, and multiply the indices:", `= ${show(res)}`),
    ]);
  }
  const c = rnd(2, 4), q = rnd(2, 4), a1 = rnd(1, 5), b1 = -rnd(1, 3), a2 = -rnd(1, 3), b2 = rnd(1, 2);
  const A = mono(c * q, { [u]: a1, [v]: b1 }), B = mono(c, { [u]: a2, [v]: b2 });
  const pre = (display: string, text: string) => (fraction ? [step("Write each fraction with a negative index:", [display, `= ${text}`])] : []);
  if (kind === 1) {
    const res = mdiv(A, B), display = `${disp(A, fraction)} \\div ${disp(B, fraction)}`;
    return build(NZ_SIMPLIFY(form), display, { t: "div", a: ex(A), b: ex(B) }, res, form, [
      ...pre(display, `${show(A)} \\div ${show(B)}`),
      step("Divide the numbers, then subtract the indices of each letter:", `${c * q} \\div ${c} = ${q}, \\quad ${u}${sup(diffText(rat(a1), rat(a2)))}, \\quad ${v}${sup(diffText(rat(b1), rat(b2)))}`),
      step("Put it together:", `= ${show(res)}`),
    ]);
  }
  const res = mmul(A, B), display = `${disp(A, fraction)} \\times ${disp(B, fraction)}`;
  return build(NZ_SIMPLIFY(form), display, { t: "mul", a: ex(A), b: ex(B) }, res, form, [
    ...pre(display, `${show(A)} \\times ${show(B)}`),
    step("Multiply the numbers, then add the indices of each letter:", `${c * q} \\times ${c} = ${c * c * q}, \\quad ${u}${sup(sumText(rat(a1), rat(a2)))}, \\quad ${v}${sup(sumText(rat(b1), rat(b2)))}`),
    step("Put it together:", `= ${show(res)}`),
  ]);
};

const genCombined = (form: Form, asFraction?: boolean): Built => {
  const l = letter(), fraction = asFraction ?? Math.random() < 0.5;
  if (Math.random() < 0.6) {
    const k = rnd(2, 3), a = -rnd(1, 4), e = rnd(2, 3), k2 = rnd(2, 4), b = rnd(2, 8);
    const inner = M(k, l, a), left = mpow(inner, rat(e))!, B = M(k2, l, b), res = mmul(left, B);
    if (Object.keys(res.e).length === 0) return genCombined(form, asFraction);
    const first = fraction ? `\\left(${F(inner)}\\right)${sup(`${e}`)}` : bracket(inner, rat(e));
    const display = `${first} \\times ${show(B)}`;
    return build(NZ_SIMPLIFY(form), display, { t: "mul", a: { t: "pow", a: ex(inner), r: rat(e) }, b: ex(B) }, res, form, [
      ...(fraction ? [step("Write the fraction with a negative index:", [first, `= ${bracket(inner, rat(e))}`])] : []),
      step("Expand the bracket first:", `${bracket(inner, rat(e))} = ${show(left)}`),
      step("Multiply the numbers, and add the indices:", `${show(left)} \\times ${show(B)} = ${show(res)}`),
    ]);
  }
  const a = -rnd(1, 3), e = rnd(2, 3), b = -rnd(1, 6);
  const inner = M(1, l, a), left = mpow(inner, rat(e))!, B = M(1, l, b), res = mdiv(left, B);
  if (res.e[l] === undefined) return genCombined(form, asFraction);
  const first = fraction ? `\\left(${F(inner)}\\right)${sup(`${e}`)}` : `\\left(${show(inner)}\\right)${sup(`${e}`)}`;
  const second = fraction ? F(B) : show(B);
  return build(NZ_SIMPLIFY(form), `${first} \\div ${second}`, { t: "div", a: { t: "pow", a: ex(inner), r: rat(e) }, b: ex(B) }, res, form, [
    ...(fraction ? [step("Write each fraction with a negative index:", [`${first} \\div ${second}`, `= \\left(${show(inner)}\\right)${sup(`${e}`)} \\div ${show(B)}`])] : []),
    step("Expand the bracket first:", `\\left(${show(inner)}\\right)${sup(`${e}`)} = ${show(left)}`),
    step("Subtract the indices:", `${show(left)} \\div ${show(B)} = ${l}${sup(diffText(rat(a * e), rat(b)))} = ${show(res)}`),
  ]);
};

/** Level 3 with number bases: several bases, each written once as a single power — 2^-3 × 5^2 × 2^5 × 5^-4 */
const genSeveralBases = (value: string, form: Form): Built => {
  const [p, q] = choose([[2, 3], [2, 5], [3, 5], [2, 10], [3, 10]] as const), kp = `${p}`, kq = `${q}`;
  const prompt = form === "positive" ? "Simplify, writing each base once and with positive indices:" : "Simplify, writing each base once:";
  for (let t = 0; t < 60; t++) {
    const a = nz(5), b = nz(5), c = nz(5), d = nz(5);
    if (value === "bracket" || value === "combined") {
      const e = rnd(2, 3), inner = mono(1, { [kp]: a, [kq]: b }), left = mpow(inner, rat(e))!;
      if (value === "bracket") return build(prompt, bracket(inner, rat(e)), { t: "pow", a: ex(inner), r: rat(e) }, left, form, [
        step("The outer power applies to each base:", [bracket(inner, rat(e)), `= ${p}${sup(`${a} \\times ${e}`)} \\times ${q}${sup(`${b} \\times ${e}`)}`]),
        step("Multiply the indices:", `= ${show(left)}`),
      ]);
      const B = mono(1, { [kp]: c, [kq]: d }), res = mmul(left, B);
      if (Object.values(res.e).length < 2) continue;
      return build(prompt, `${bracket(inner, rat(e))} \\times ${show(B)}`, { t: "mul", a: { t: "pow", a: ex(inner), r: rat(e) }, b: ex(B) }, res, form, [
        step("Expand the bracket first:", `${bracket(inner, rat(e))} = ${show(left)}`),
        step("Put the same bases together and add their indices:", `${show(left)} \\times ${show(B)} = ${show(res)}`),
      ]);
    }
    const A = mono(1, { [kp]: a, [kq]: b }), B = mono(1, { [kp]: c, [kq]: d });
    const mul = value === "coefficients" ? true : false;
    const res = mul ? mmul(A, B) : mdiv(A, B);
    if (Object.values(res.e).length < 2) continue;
    const sym = mul ? "\\times" : "\\div";
    return build(prompt, `${show(A)} ${sym} ${show(B)}`, { t: mul ? "mul" : "div", a: ex(A), b: ex(B) }, res, form, [
      step(mul ? "Put the same bases together and add their indices:" : "Put the same bases together and subtract their indices:", [`${show(A)} ${sym} ${show(B)}`, `= ${p}${sup(mul ? sumText(rat(a), rat(c)) : diffText(rat(a), rat(c)))} \\times ${q}${sup(mul ? sumText(rat(b), rat(d)) : diffText(rat(b), rat(d)))}`, `= ${show(res)}`]),
    ]);
  }
  return genSeveralBases("bracket", form);
};

/** `notation` "fraction" writes the Level 1 laws with fraction bars and reciprocals (x³ ÷ 1/x², x³/x⁵); "power" keeps them in power notation */
export const genNegZero = (value: string, form: Form, num = false, notation: "power" | "fraction" = "power"): Built => {
  if (num && (value === "coefficients" || value === "bracket" || value === "twoLetters" || value === "combined")) return genSeveralBases(value === "twoLetters" ? "divide" : value, form);
  const frac = notation === "fraction";
  if (frac && value === "divideNegative") return genFractionBar(form, num, true);
  if (frac && value === "lawsNegative") return genReciprocal(form, num);
  if (frac && value === "powerOfPower") return genFractionPower(form, num, true);
  return value === "negative" ? genNegative(num) : value === "zero" ? genZero(form, num) : value === "divideNegative" ? genDivideNegative(form, num)
    : value === "lawsNegative" ? genLawsNegative(form, num) : value === "powerOfPower" ? genPowerOfPower(form, num)
    : value === "fractionBar" ? genFractionBar(form, num) : value === "reciprocal" ? genReciprocal(form, num)
    : value === "divideReciprocal" ? genDivideReciprocal(form, num) : value === "fractionPower" ? genFractionPower(form, num)
    : value === "coefficients" ? genCoefficients(form) : value === "bracket" ? genBracket(form)
    : value === "twoLetters" ? genTwoLetters(form) : genCombined(form, frac);
};

// ══ Fractional Indices ════════════════════════════════════════════════════════════════════════════════════════════════════
const rootSym = (n: number) => (n === 2 ? "\\sqrt" : `\\sqrt[${n}]`);
const half = (n: number): Rat => rat(1, n);
/** m/n in lowest terms with the given ranges */
const proper = (nMax: number, mMax: number): Rat => { for (;;) { const n = rnd(2, nMax), m = rnd(1, mMax); if (gcd(m, n) === 1) return rat(m, n); } };

/** Level 1: write between the root and the index forms */
const genFractionalForms = (type: "unit" | "mixed" | "negative", num = false, coef = false, dir?: "toIndex" | "toRoot"): Built => {
  const sym = num ? `${choose([2, 3, 5, 6, 7, 10, 11] as const)}` : letter();
  const k = coef && !num ? rnd(2, 6) : 1, kc = k === 1 ? "" : `${k}`;
  const n = type === "unit" ? choose([2, 2, 3, 3, 4, 5] as const) : choose([2, 3, 3, 4, 5] as const);
  let m = 1;
  if (type !== "unit") for (;;) { m = rnd(1, 4); if (gcd(m, n) === 1 && !(type === "mixed" && m === 1)) break; }
  const e = rat(type === "negative" ? -m : m, n);
  const indexForm = `${kc}${sym}${sup(fmtExp(e))}`;
  const rootCore = m === 1 ? `${rootSym(n)}{${sym}}` : Math.random() < 0.5 ? `${rootSym(n)}{${sym}${sup(`${m}`)}}` : `\\left(${rootSym(n)}{${sym}}\\right)${sup(`${m}`)}`;
  const otherRoot = m === 1 ? null : rootCore.startsWith("\\left") ? `${rootSym(n)}{${sym}${sup(`${m}`)}}` : `\\left(${rootSym(n)}{${sym}}\\right)${sup(`${m}`)}`;
  const rootForm = type === "negative" ? frac(`${k}`, rootCore) : `${kc}${rootCore}`;
  const rootBoth = otherRoot ? `${rootForm} = ${type === "negative" ? frac(`${k}`, otherRoot) : `${kc}${otherRoot}`}` : rootForm;
  const toIndex = dir ? dir === "toIndex" : Math.random() < 0.5;
  const idx = { expr: ex(M(k, sym, e)), result: M(k, sym, e) };
  if (toIndex) {
    return {
      prompt: `Write as a power of ${sym}:`, displayLatex: rootForm, answer: `${sym}^${isInt(e) ? e[0] : `(${e[0]}/${e[1]})`}`, answerLatex: indexForm,
      working: [
        step(`The ${n === 2 ? "square" : n === 3 ? "cube" : `${n}th`} root is the power ${fmtExp(half(n))}${m === 1 ? "" : `, and the power ${m} goes on top`}${type === "negative" ? ", and a negative index is the reciprocal" : ""}:`, [rootForm, `= ${indexForm}`]),
      ],
      _idx: idx,
    };
  }
  return {
    prompt: "Write using a root:", displayLatex: indexForm, answer: rootBoth.replace(/\\/g, ""), answerLatex: rootBoth,
    working: [
      step(`The denominator ${n} is the root${m === 1 ? "" : ` and the numerator ${m} is the power`}${type === "negative" ? "; the negative index makes it one over" : ""}:`, [indexForm, `= ${rootBoth}`]),
    ],
    _idx: idx,
  };
};

const FRACTIONAL_NEGATIVE_LAWS = ["mul", "div"] as const;

/** Level 2: the laws with fractional indices */
const genFractionalLaws = (type: "multiply" | "divide" | "powerOfPower" | "unlike" | "negative", form: Form): Built => {
  const l = letter();
  const out = (display: string, expr: Expr, res: Mono, working: WorkingStep[]) => build(SIMPLIFY(form), display, expr, res, form, working);
  const sx = (r: Rat) => `${l}${sup(fmtExp(r))}`;
  if (type === "powerOfPower") {
    const a = choose([rat(2, 3), rat(1, 2), rat(3, 2), rat(3, 4), rat(1, 3), rat(2, 5)] as const), b = rnd(2, 4);
    const inner = M(1, l, a), res = mpow(inner, rat(b))!;
    return out(`\\left(${sx(a)}\\right)${sup(`${b}`)}`, { t: "pow", a: ex(inner), r: rat(b) }, res, [
      step("Multiply the indices:", [`\\left(${sx(a)}\\right)${sup(`${b}`)}`, `= ${l}${sup(`${fmtExp(a)} \\times ${b}`)}`, `= ${show(res)}`]),
    ]);
  }
  for (let t = 0; t < 60; t++) {
    let a: Rat, b: Rat, mul = Math.random() < 0.55;
    if (type === "multiply" || type === "divide") {
      const n = choose([2, 3, 4] as const), p1 = rnd(1, 2 * n), p2 = rnd(1, 2 * n);
      mul = type === "multiply"; a = rat(p1, n); b = rat(p2, n);
      if (isInt(a) && isInt(b)) continue; // a fractional index must appear
      if (!mul && p1 <= p2) continue;
    } else if (type === "unlike") {
      const [n1, n2] = choose([[2, 3], [2, 4], [3, 4], [2, 5], [3, 6]] as const);
      a = rat(rnd(1, n1), n1); b = rat(rnd(1, n2), n2);
      if (a[1] === b[1]) continue;
      if (!mul && rsub(a, b)[0] <= 0) continue;
    } else { // negative
      const n = choose([2, 3, 4] as const);
      a = rat(-rnd(1, n), n); b = rat(rnd(1, 2 * n), n);
      if (Math.random() < 0.5) { const t2 = a; a = b; b = t2; }
      if (!mul) b = rneg(b);
    }
    const r = mul ? radd(a, b) : rsub(a, b);
    if (r[0] === 0) continue;
    const A = M(1, l, a), B = M(1, l, b), res = mul ? mmul(A, B) : mdiv(A, B);
    const sym = mul ? "\\times" : "\\div";
    const display = !mul && Math.random() < 0.4 ? frac(show(A), show(B)) : `${show(A)} ${sym} ${show(B)}`;
    const lcd = a[1] !== b[1] ? ` (common denominator first)` : "";
    return out(display, { t: mul ? "mul" : "div", a: ex(A), b: ex(B) }, res, [
      step(`Same base, so ${mul ? "add" : "subtract"} the indices${lcd}:`, [`${show(A)} ${sym} ${show(B)}`, `= ${l}${sup(mul ? sumText(a, b) : diffText(a, b))}`, `= ${show(res)}`]),
    ]);
  }
  return genFractionalLaws("multiply", form);
};

/** Level 3: laws with coefficients, a root of a bracket, and negative fractional indices */
const genFractionalCoefficients = (type: "rootBracket" | "coefficients" | "negative", form: Form): Built => {
  const l = letter();
  if (type === "coefficients") {
    const n = choose([2, 3, 4] as const);
    if (Math.random() < 0.5) {
      const k1 = rnd(2, 6), k2 = rnd(2, 6), a = rat(rnd(1, 2 * n), n), b = rat(rnd(1, 2 * n), n);
      const A = M(k1, l, a), B = M(k2, l, b), res = mmul(A, B);
      return build(SIMPLIFY(form), `${show(A)} \\times ${show(B)}`, { t: "mul", a: ex(A), b: ex(B) }, res, form, [
        step("Multiply the numbers, and add the indices:", `${k1} \\times ${k2} = ${k1 * k2}, \\quad ${l}${sup(sumText(a, b))} = ${l}${sup(fmtExp(radd(a, b)))}`),
      ]);
    }
    for (let t = 0; t < 40; t++) {
      const c = rnd(2, 5), q = rnd(2, 5), p1 = rnd(2, 2 * n + 2), p2 = rnd(1, p1 - 1);
      const a = rat(p1, n), b = rat(p2, n);
      const A = M(c * q, l, a), B = M(c, l, b), res = mdiv(A, B);
      if (Object.keys(res.e).length === 0) continue;
      const display = Math.random() < 0.4 ? frac(show(A), show(B)) : `${show(A)} \\div ${show(B)}`;
      return build(SIMPLIFY(form), display, { t: "div", a: ex(A), b: ex(B) }, res, form, [
        step("Divide the numbers, and subtract the indices:", `${c * q} \\div ${c} = ${q}, \\quad ${l}${sup(diffText(a, b))} = ${l}${sup(fmtExp(rsub(a, b)))}`),
      ]);
    }
  }
  // a root of a bracket: (c^n x^(n j))^(m/n)
  for (let t = 0; t < 60; t++) {
    const n = choose([2, 2, 3, 3, 4] as const), m = rnd(1, 3);
    if (gcd(m, n) !== 1) continue;
    const c = n === 2 ? rnd(2, 9) : n === 3 ? rnd(2, 4) : rnd(2, 3), j = rnd(1, 4);
    const inner = M(c ** n, l, n * j);
    const outer = type === "negative" ? rat(-m, n) : rat(m, n);
    const res = mpow(inner, outer);
    if (!res) continue;
    if (type === "negative" && c ** m > 100) continue;
    const display = bracket(inner, outer);
    const rootStep = step(`The denominator ${n} is the root: take the ${n === 2 ? "square" : n === 3 ? "cube" : `${n}th`} root of the number and of the letter part:`, `${rootSym(n)}{${c ** n}} = ${c}, \\quad \\left(${l}${sup(`${n * j}`)}\\right)${sup(fmtExp(half(n)))} = ${l}${sup(`${j}`)}`);
    const working = [
      rootStep,
      step(m === 1 ? "Put the parts together:" : `The numerator ${m} is a power of the number and of the letter:`, `${show(M(c, l, j))}${m === 1 ? "" : `, then to the power ${m}: ${show(mpow(M(c, l, j), rat(m))!)}`}`),
    ];
    // a negative outer index always gives a fractional coefficient, so the answer is asked with positive indices
    return build(type === "negative" ? "Simplify, giving your answer with positive indices:" : SIMPLIFY(form), display, { t: "pow", a: ex(inner), r: outer }, res, type === "negative" ? "positive" : form, working, type === "negative" ? "positive" : form);
  }
  return genFractionalCoefficients("coefficients", form);
};

/** Writing Indices: change the form only — negative indices and roots, with letters or number bases */
export const genWriting = (value: string, num: boolean, dir?: "toIndex" | "toRoot"): Built =>
  value === "negative" ? genNegative(num, false) : value === "negativeCoef" ? genNegative(num, true)
  : value === "unit" ? genFractionalForms("unit", num, false, dir) : value === "mixed" ? genFractionalForms("mixed", num, false, dir)
  : value === "coefRoots" ? genFractionalForms("mixed", num, true, dir)
  : value === "coefNegFrac" ? genFractionalForms("negative", num, true, dir) : genFractionalForms("negative", num, false, dir);

/** Level 3: two letters with fractional indices — x^(1/2)y^(1/3) × x^(3/2)y^(2/3), or a root of a two-letter bracket */
const genFractionalTwoLetters = (form: Form): Built => {
  const [u, v] = choose([["x", "y"], ["a", "b"], ["m", "n"], ["p", "t"]] as const);
  if (Math.random() < 0.6) {
    for (let t = 0; t < 60; t++) {
      const n = choose([2, 3, 4] as const), mul = Math.random() < 0.55;
      const a1 = rat(rnd(1, 2 * n), n), b1 = rat(rnd(1, 2 * n), n), a2 = rat(rnd(1, 2 * n), n), b2 = rat(rnd(1, 2 * n), n);
      if (isInt(a1) && isInt(b1) && isInt(a2) && isInt(b2)) continue;
      const A = mono(1, { [u]: a1, [v]: b1 }), B = mono(1, { [u]: a2, [v]: b2 });
      const res = mul ? mmul(A, B) : mdiv(A, B);
      if (Object.keys(res.e).length < 2) continue;
      const op = mul ? sumText : diffText;
      return build(SIMPLIFY(form), `${show(A)} ${mul ? "\\times" : "\\div"} ${show(B)}`, { t: mul ? "mul" : "div", a: ex(A), b: ex(B) }, res, form, [
        step(`${mul ? "Add" : "Subtract"} the indices of each letter separately:`, `${u}${sup(op(a1, a2))}, \\quad ${v}${sup(op(b1, b2))}`),
      ]);
    }
  }
  for (let t = 0; t < 60; t++) {
    const n = choose([2, 3] as const), m = rnd(1, 3);
    if (gcd(m, n) !== 1) continue;
    const c = n === 2 ? rnd(2, 6) : rnd(2, 3), j = rnd(1, 3), h = rnd(1, 3);
    const inner = mono(c ** n, { [u]: n * j, [v]: n * h }), outer = rat(m, n), res = mpow(inner, outer);
    if (!res) continue;
    return build(SIMPLIFY(form), bracket(inner, outer), { t: "pow", a: ex(inner), r: outer }, res, form, [
      step(`The denominator ${n} is the root: take it of the number and of each letter part:`, `${rootSym(n)}{${c ** n}} = ${c}, \\quad ${u}${sup(`${n * j}`)} \\to ${u}${sup(`${j}`)}, \\quad ${v}${sup(`${n * h}`)} \\to ${v}${sup(`${h}`)}`),
      step(m === 1 ? "Put the parts together:" : `The numerator ${m} is a power of every part:`, `${show(mono(c, { [u]: j, [v]: h }))}${m === 1 ? "" : `, then to the power ${m}: ${show(res)}`}`),
    ]);
  }
  return genFractionalTwoLetters(form);
};

export const genFractional = (value: string, form: Form): Built =>
  value === "unit" || value === "mixed" || value === "negativeForms" ? genFractionalForms(value === "negativeForms" ? "negative" : value)
  : value === "multiply" || value === "divide" || value === "powerOfPower" || value === "unlike" || value === "negative" ? genFractionalLaws(value, form)
  : value === "twoLetters" ? genFractionalTwoLetters(form)
  : genFractionalCoefficients(value === "rootBracket" ? "rootBracket" : value === "coefficientsNegative" ? "negative" : "coefficients", form);

void FRACTIONAL_NEGATIVE_LAWS; void proper; void rmul;
