// Negative & Zero Indices and Fractional Indices — the laws with letters (and number bases) when the index is zero, negative or fractional.
// Every question carries `_alg` = { expr, result }: the expression asked and the answer as monomials, so a test can evaluate both at
// numeric points (arithmetic, not the generator's own rule). Answer form (positive indices / leave negatives) follows specs/indices-extended.md.
import {
  type Built, type Expr, type Form, type Mono, type Rat,
  rat, mono, mmul, mdiv, mpow, fmtMono, plainMono, fmtExp, bracket, hasNegativeIndex, isInt,
  rnd, choose, step, rneg, radd, rsub, rmul,
} from "./IndicesCore";
import type { WorkingStep } from "../../shared";

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

const SIMPLIFY = (form: Form) => (form === "positive" ? "Simplify, giving your answer with positive indices:" : "Simplify:");

/** assemble the question: the answer in the chosen form, and the working's last line (a negative index rewritten when the form asks) */
const build = (prompt: string, display: string, expr: Expr, result: Mono, form: Form, working: WorkingStep[], answerForm: Form = form): Built => {
  const w = [...working];
  if (answerForm === "positive" && hasNegativeIndex(result)) w.push(step("A negative index means one over the positive index:", `${show(result)} = ${fmtMono(result, "positive")}`));
  return { prompt, displayLatex: display, answer: plainMono(result, answerForm), answerLatex: fmtMono(result, answerForm), working: w, _idx: { expr, result } };
};
const frac = (top: string, bottom: string) => `\\dfrac{${top}}{${bottom}}`;

// ══ Negative & Zero Indices ═══════════════════════════════════════════════════════════════════════════════════════════════
const nz = (n: number) => { let v = 0; while (v === 0) v = rnd(-n, n); return v; };

/** Level 1: write between the forms — x^-3 ⇄ 1/x^3, 2x^-2 ⇄ 2/x^2 */
const genNegative = (): Built => {
  const l = letter(), p = rnd(1, 5), k = Math.random() < 0.35 ? rnd(2, 6) : 1;
  const neg = M(k, l, -p);
  if (Math.random() < 0.55) {
    return build("Write with a positive index:", show(neg), ex(neg), neg, "positive", [
      step(k === 1 ? "A negative index means one over the positive index:" : "Only the letter has the negative index:", [show(neg), `= ${fmtMono(neg, "positive")}`]),
    ].slice(0, 1));
  }
  const bottom = `${l}${p === 1 ? "" : sup(`${p}`)}`;
  return build(`Write as a power of ${l}:`, frac(`${k}`, bottom), ex(neg), neg, "leave", [
    step("One over a power is a negative power:", [frac(`${k}`, bottom), `= ${show(neg)}`]),
  ]);
};

/** Level 1: the zero index — x^0, 3x^0, (3x)^0, x^3 × x^0, x^m ÷ x^m */
const genZero = (): Built => {
  const l = letter(), k = rnd(2, 9), v = rnd(0, 4);
  if (v === 0) { const m = M(1, l, 0); return build("Simplify:", `${l}${sup("0")}`, ex(M(1, l, 0)), m, "leave", [step("Anything to the power zero is 1:", `${l}${sup("0")} = 1`)]); }
  if (v === 1) return build("Simplify:", `${k}${l}${sup("0")}`, ex(M(k, l, 0)), mono(k), "leave", [step("Only the letter is raised to the power zero:", [`${k}${l}${sup("0")}`, `= ${k} \\times 1`, `= ${k}`])]);
  if (v === 2) return build("Simplify:", `\\left(${k}${l}\\right)${sup("0")}`, { t: "pow", a: ex(M(k, l, 1)), r: rat(0) }, mono(1), "leave", [step("The whole bracket is raised to the power zero:", `\\left(${k}${l}\\right)${sup("0")} = 1`)]);
  if (v === 3) {
    const a = rnd(2, 8), r = mmul(M(1, l, a), M(1, l, 0));
    return build("Simplify:", `${l}${sup(`${a}`)} \\times ${l}${sup("0")}`, { t: "mul", a: ex(M(1, l, a)), b: ex(M(1, l, 0)) }, r, "leave", [
      step("Same base, so add the indices:", [`${l}${sup(`${a}`)} \\times ${l}${sup("0")}`, `= ${l}${sup(`${a}+0`)}`, `= ${show(r)}`]),
    ]);
  }
  const a = rnd(2, 7), r = mdiv(M(1, l, a), M(1, l, a));
  return build("Simplify:", `${l}${sup(`${a}`)} \\div ${l}${sup(`${a}`)}`, { t: "div", a: ex(M(1, l, a)), b: ex(M(1, l, a)) }, r, "leave", [
    step("Same base, so subtract the indices:", [`${l}${sup(`${a}`)} \\div ${l}${sup(`${a}`)}`, `= ${l}${sup(`${a}-${a}`)}`, `= ${l}${sup("0")}`]),
    step("Anything to the power zero is 1:", "= 1"),
  ]);
};

/** Level 1: x^3 ÷ x^5 — the bottom power is bigger, so the index goes negative */
const genDivideNegative = (form: Form): Built => {
  const l = letter(), m = rnd(2, 6), d = rnd(1, 3), n = m + d, withK = Math.random() < 0.4;
  const c = choose([2, 3, 4, 5] as const), k = c * rnd(2, 4), q = k / c;
  const a = withK ? M(k, l, m) : M(1, l, m), b = withK ? M(c, l, n) : M(1, l, n);
  const r = mdiv(a, b);
  const display = Math.random() < 0.4 ? frac(show(a), show(b)) : `${show(a)} \\div ${show(b)}`;
  const lead = withK ? step("Divide the numbers, and subtract the indices:", `${k} \\div ${c} = ${q}, \\quad ${l}${sup(`${m}-${n}`)} = ${l}${sup(`${m - n}`)}`)
    : step("Same base, so subtract the indices:", [display.includes("dfrac") ? `${l}${sup(`${m}`)} \\div ${l}${sup(`${n}`)}` : display, `= ${l}${sup(`${m}-${n}`)}`, `= ${l}${sup(`${m - n}`)}`]);
  return build(SIMPLIFY(form), display, { t: "div", a: ex(a), b: ex(b) }, r, form, [lead]);
};

/** Level 1: laws with a negative index — x^3 × x^-2, x^3 ÷ x^-2, x^-3 × x^-4 */
const genLawsNegative = (form: Form): Built => {
  const l = letter();
  for (let t = 0; t < 40; t++) {
    const kind = choose(["mulA", "mulB", "mulC", "divA", "divB"] as const);
    let a: number, b: number, mul = true;
    if (kind === "mulA") { a = rnd(2, 6); b = -rnd(1, 6); }          // x^3 × x^-2
    else if (kind === "mulB") { a = -rnd(1, 6); b = -rnd(1, 6); }     // x^-3 × x^-4
    else if (kind === "mulC") { a = -rnd(1, 6); b = rnd(2, 7); }      // x^-2 × x^5
    else if (kind === "divA") { a = rnd(2, 6); b = -rnd(1, 6); mul = false; } // x^3 ÷ x^-2
    else { a = -rnd(1, 5); b = -rnd(1, 6); mul = false; }             // x^-3 ÷ x^-5
    const r = mul ? radd(rat(a), rat(b)) : rsub(rat(a), rat(b));
    if (r[0] === 0) continue;
    const A = M(1, l, a), B = M(1, l, b), res = mul ? mmul(A, B) : mdiv(A, B);
    const display = mul ? `${show(A)} \\times ${show(B)}` : Math.random() < 0.4 ? frac(show(A), show(B)) : `${show(A)} \\div ${show(B)}`;
    const text = mul ? `${show(A)} \\times ${show(B)}` : `${show(A)} \\div ${show(B)}`;
    const working = [step(mul ? "Same base, so add the indices:" : "Same base, so subtract the indices (subtracting a negative adds):", [text, `= ${l}${sup(mul ? sumText(rat(a), rat(b)) : diffText(rat(a), rat(b)))}`, `= ${show(res)}`])];
    return build(SIMPLIFY(form), display, { t: mul ? "mul" : "div", a: ex(A), b: ex(B) }, res, form, working);
  }
  return genDivideNegative(form);
};

/** Level 2: powers of powers with a negative index — (x^-2)^-4, (x^-2)^3, (x^3)^-2 */
const genPowerOfPower = (form: Form): Built => {
  const l = letter();
  for (let t = 0; t < 40; t++) {
    const a = nz(5), b = nz(4);
    if (a > 0 && b > 0) continue;
    if (a * b === 0 || Math.abs(a * b) > 20) continue;
    const inner = M(1, l, a), res = mpow(inner, rat(b))!;
    return build(SIMPLIFY(form), `\\left(${show(inner)}\\right)${sup(`${b}`)}`, { t: "pow", a: ex(inner), r: rat(b) }, res, form, [
      step("Multiply the indices:", [`\\left(${show(inner)}\\right)${sup(`${b}`)}`, `= ${l}${sup(`${a} \\times ${par(rat(b))}`)}`, `= ${show(res)}`]),
    ]);
  }
  return genLawsNegative(form);
};

/** Level 2: a bracket with a coefficient and a negative index — (2x^-3)^2 */
const genBracket = (form: Form): Built => {
  const l = letter(), k = rnd(2, 5), a = rnd(0, 3) === 0 ? rnd(2, 4) : -rnd(1, 5), b = rnd(2, 3);
  const inner = M(k, l, a), res = mpow(inner, rat(b))!;
  return build(SIMPLIFY(form), bracket(inner, rat(b)), { t: "pow", a: ex(inner), r: rat(b) }, res, form, [
    step("The outer power applies to the number and to the letter:", [bracket(inner, rat(b)), `= ${k}${sup(`${b}`)} \\times \\left(${l}${sup(`${a}`)}\\right)${sup(`${b}`)}`]),
    step("Work out the number, and multiply the indices:", `= ${k ** b}${l}${sup(`${a} \\times ${b}`)} = ${show(res)}`),
  ]);
};

/** Level 2: multiplying terms with coefficients and a negative index — 4x^-2 × 3x^5 */
const genCoefficientsMultiply = (form: Form): Built => {
  const l = letter();
  for (let t = 0; t < 40; t++) {
    const k1 = rnd(2, 6), k2 = rnd(2, 6), a = nz(5), b = nz(6);
    if (a > 0 && b > 0) continue;
    if (a + b === 0) continue;
    const A = M(k1, l, a), B = M(k2, l, b), res = mmul(A, B);
    return build(SIMPLIFY(form), `${show(A)} \\times ${show(B)}`, { t: "mul", a: ex(A), b: ex(B) }, res, form, [
      step("Multiply the numbers, and add the indices:", `${k1} \\times ${k2} = ${k1 * k2}, \\quad ${l}${sup(sumText(rat(a), rat(b)))} = ${l}${sup(`${a + b}`)}`),
    ]);
  }
  return genBracket(form);
};

/** Level 3: dividing terms with coefficients — 12x^3 ÷ 4x^-2 */
const genCoefficientsDivide = (form: Form): Built => {
  const l = letter();
  for (let t = 0; t < 40; t++) {
    const c = rnd(2, 5), q = rnd(2, 5), a = nz(5), b = nz(5);
    if (a >= 0 && b >= 0) continue;
    if (a - b === 0) continue;
    const A = M(c * q, l, a), B = M(c, l, b), res = mdiv(A, B);
    const display = Math.random() < 0.4 ? frac(show(A), show(B)) : `${show(A)} \\div ${show(B)}`;
    return build(SIMPLIFY(form), display, { t: "div", a: ex(A), b: ex(B) }, res, form, [
      step("Divide the numbers, and subtract the indices:", `${c * q} \\div ${c} = ${q}, \\quad ${l}${sup(diffText(rat(a), rat(b)))} = ${l}${sup(`${a - b}`)}`),
    ]);
  }
  return genCoefficientsMultiply(form);
};

/** Level 3: two letters — (3x^2y^-1)^2, 6x^3y^-1 ÷ 2x^-2y */
const genTwoLetters = (form: Form): Built => {
  const [u, v] = choose([["x", "y"], ["a", "b"], ["m", "n"], ["p", "t"]] as const);
  const kind = rnd(0, 2);
  if (kind === 0) {
    const k = rnd(2, 4), a = rnd(1, 4), b = -rnd(1, 3), e = rnd(2, 3);
    const inner = mono(k, { [u]: a, [v]: b }), res = mpow(inner, rat(e))!;
    return build(SIMPLIFY(form), bracket(inner, rat(e)), { t: "pow", a: ex(inner), r: rat(e) }, res, form, [
      step("The outer power applies to the number and to each letter:", [bracket(inner, rat(e)), `= ${k}${sup(`${e}`)} \\times \\left(${u}${sup(`${a}`)}\\right)${sup(`${e}`)} \\times \\left(${v}${sup(`${b}`)}\\right)${sup(`${e}`)}`]),
      step("Work out the number, and multiply the indices:", `= ${show(res)}`),
    ]);
  }
  const c = rnd(2, 4), q = rnd(2, 4), a1 = rnd(1, 5), b1 = -rnd(1, 3), a2 = -rnd(1, 3), b2 = rnd(1, 2);
  const A = mono(c * q, { [u]: a1, [v]: b1 }), B = mono(c, { [u]: a2, [v]: b2 });
  if (kind === 1) {
    const res = mdiv(A, B);
    return build(SIMPLIFY(form), `${show(A)} \\div ${show(B)}`, { t: "div", a: ex(A), b: ex(B) }, res, form, [
      step("Divide the numbers, then subtract the indices of each letter:", `${c * q} \\div ${c} = ${q}, \\quad ${u}${sup(diffText(rat(a1), rat(a2)))}, \\quad ${v}${sup(diffText(rat(b1), rat(b2)))}`),
      step("Put it together:", `= ${show(res)}`),
    ]);
  }
  const res = mmul(A, B);
  return build(SIMPLIFY(form), `${show(A)} \\times ${show(B)}`, { t: "mul", a: ex(A), b: ex(B) }, res, form, [
    step("Multiply the numbers, then add the indices of each letter:", `${c * q} \\times ${c} = ${c * c * q}, \\quad ${u}${sup(sumText(rat(a1), rat(a2)))}, \\quad ${v}${sup(sumText(rat(b1), rat(b2)))}`),
    step("Put it together:", `= ${show(res)}`),
  ]);
};

/** Level 3: a bracket raised to a power, then multiplied — (2x^-3)^2 × 3x^5, (x^-2)^3 ÷ x^-4 */
const genCombined = (form: Form): Built => {
  const l = letter();
  if (Math.random() < 0.6) {
    const k = rnd(2, 3), a = -rnd(1, 4), e = rnd(2, 3), k2 = rnd(2, 4), b = rnd(2, 8);
    const inner = M(k, l, a), left = mpow(inner, rat(e))!, B = M(k2, l, b), res = mmul(left, B);
    if (Object.keys(res.e).length === 0) return genCombined(form);
    return build(SIMPLIFY(form), `${bracket(inner, rat(e))} \\times ${show(B)}`, { t: "mul", a: { t: "pow", a: ex(inner), r: rat(e) }, b: ex(B) }, res, form, [
      step("Expand the bracket first:", `${bracket(inner, rat(e))} = ${show(left)}`),
      step("Multiply the numbers, and add the indices:", `${show(left)} \\times ${show(B)} = ${show(res)}`),
    ]);
  }
  const a = -rnd(1, 3), e = rnd(2, 3), b = -rnd(1, 6);
  const inner = M(1, l, a), left = mpow(inner, rat(e))!, B = M(1, l, b), res = mdiv(left, B);
  if (res.e[l] === undefined) return genCombined(form);
  return build(SIMPLIFY(form), `\\left(${show(inner)}\\right)${sup(`${e}`)} \\div ${show(B)}`, { t: "div", a: { t: "pow", a: ex(inner), r: rat(e) }, b: ex(B) }, res, form, [
    step("Expand the bracket first:", `\\left(${show(inner)}\\right)${sup(`${e}`)} = ${show(left)}`),
    step("Subtract the indices:", `${show(left)} \\div ${show(B)} = ${l}${sup(diffText(rat(a * e), rat(b)))} = ${show(res)}`),
  ]);
};

/** Level 3: number bases — 2^-3 × 2^5 written as a single power */
const genNumbers = (form: Form): Built => {
  const base = choose([2, 3, 5, 10] as const), key = `${base}`;
  const kind = rnd(0, 2);
  const w = (m: Mono) => fmtMono(m, "leave");
  if (kind === 2) {
    const a = nz(3), e = choose([-3, -2, 2, 3] as const);
    const inner = mono(1, { [key]: a }), res = mpow(inner, rat(e))!;
    return build("Write as a single power of " + base + (form === "positive" ? ", with a positive index:" : ":"), `\\left(${w(inner)}\\right)${sup(`${e}`)}`, { t: "pow", a: ex(inner), r: rat(e) }, res, form, [
      step("Multiply the indices:", [`\\left(${w(inner)}\\right)${sup(`${e}`)}`, `= ${base}${sup(`${a} \\times ${par(rat(e))}`)}`, `= ${w(res)}`]),
    ]);
  }
  for (let t = 0; t < 40; t++) {
    const a = nz(6), b = nz(6);
    const mul = kind === 0, r = mul ? a + b : a - b;
    if (r === 0 || (a > 0 && b > 0 && mul)) continue;
    const A = mono(1, { [key]: a }), B = mono(1, { [key]: b }), res = mul ? mmul(A, B) : mdiv(A, B);
    return build("Write as a single power of " + base + (form === "positive" ? ", with a positive index:" : ":"), `${w(A)} ${mul ? "\\times" : "\\div"} ${w(B)}`, { t: mul ? "mul" : "div", a: ex(A), b: ex(B) }, res, form, [
      step(mul ? "Same base, so add the indices:" : "Same base, so subtract the indices:", [`${w(A)} ${mul ? "\\times" : "\\div"} ${w(B)}`, `= ${base}${sup(mul ? sumText(rat(a), rat(b)) : diffText(rat(a), rat(b)))}`, `= ${w(res)}`]),
    ]);
  }
  return genNumbers(form);
};

export const genNegZero = (value: string, form: Form): Built =>
  value === "negative" ? genNegative() : value === "zero" ? genZero() : value === "divideNegative" ? genDivideNegative(form)
  : value === "lawsNegative" ? genLawsNegative(form) : value === "powerOfPower" ? genPowerOfPower(form) : value === "bracket" ? genBracket(form)
  : value === "coefficients" ? genCoefficientsMultiply(form) : value === "divideCoefficients" ? genCoefficientsDivide(form)
  : value === "twoLetters" ? genTwoLetters(form) : value === "combined" ? genCombined(form) : genNumbers(form);

// ══ Fractional Indices ════════════════════════════════════════════════════════════════════════════════════════════════════
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
const rootSym = (n: number) => (n === 2 ? "\\sqrt" : `\\sqrt[${n}]`);
const half = (n: number): Rat => rat(1, n);
/** m/n in lowest terms with the given ranges */
const proper = (nMax: number, mMax: number): Rat => { for (;;) { const n = rnd(2, nMax), m = rnd(1, mMax); if (gcd(m, n) === 1) return rat(m, n); } };

/** Level 1: write between the root and the index forms */
const genFractionalForms = (type: "unit" | "mixed" | "negative"): Built => {
  const onNumber = Math.random() < 0.3;
  const sym = onNumber ? `${rnd(2, 9) === 1 ? 2 : choose([2, 3, 5, 6, 7, 10, 11] as const)}` : letter();
  const n = type === "unit" ? choose([2, 2, 3, 3, 4, 5] as const) : choose([2, 3, 3, 4, 5] as const);
  let m = 1;
  if (type !== "unit") for (;;) { m = rnd(1, 4); if (gcd(m, n) === 1 && !(type === "mixed" && m === 1)) break; }
  const e = rat(type === "negative" ? -m : m, n);
  const indexForm = `${sym}${sup(fmtExp(e))}`;
  const rootCore = m === 1 ? `${rootSym(n)}{${sym}}` : Math.random() < 0.5 ? `${rootSym(n)}{${sym}${sup(`${m}`)}}` : `\\left(${rootSym(n)}{${sym}}\\right)${sup(`${m}`)}`;
  const otherRoot = m === 1 ? null : rootCore.startsWith("\\left") ? `${rootSym(n)}{${sym}${sup(`${m}`)}}` : `\\left(${rootSym(n)}{${sym}}\\right)${sup(`${m}`)}`;
  const rootForm = type === "negative" ? frac("1", rootCore) : rootCore;
  const rootBoth = otherRoot ? `${type === "negative" ? frac("1", rootCore) : rootCore} = ${type === "negative" ? frac("1", otherRoot) : otherRoot}` : rootForm;
  const toIndex = Math.random() < 0.5;
  const idx = { expr: ex(M(1, sym, e)), result: M(1, sym, e) };
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

export const genFractional = (value: string, form: Form): Built =>
  value === "unit" || value === "mixed" || value === "negativeForms" ? genFractionalForms(value === "negativeForms" ? "negative" : value)
  : value === "multiply" || value === "divide" || value === "powerOfPower" || value === "unlike" || value === "negative" ? genFractionalLaws(value, form)
  : genFractionalCoefficients(value === "rootBracket" ? "rootBracket" : value === "coefficientsNegative" ? "negative" : "coefficients", form);

void FRACTIONAL_NEGATIVE_LAWS; void proper; void rmul;
