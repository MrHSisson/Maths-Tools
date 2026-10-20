// Powers & Roots — evaluating numbers. Level 1 recaps squares, cubes and their roots; Level 2 is zero and negative powers;
// Level 3 is fractional and negative fractional powers. Every level takes a Bases selector (whole numbers, fractions, decimals).
// Each question carries `_idx` (base, exponent, result) so the tests can recompute the result with their own exact arithmetic.
import {
  type Built, type Kind, type Rat,
  rat, rpowInt, rpow, rrecip, req, isInt, choose, rnd, rep, step, shuffle,
  fracLatex, fracPlain, showBase, showNum, plainNum,
} from "./IndicesCore";

const WORK_OUT = "Work out:";
const FRAC_PROMPT = "Work out, giving a fraction in its simplest form:";
// small fractions (numerator and denominator up to 6, in lowest terms) and the decimals that have an exact reciprocal
const FRACS: [number, number][] = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5], [1, 5], [4, 5], [5, 6], [3, 2], [4, 3], [5, 2]];
const ROOT_FRACS: [number, number][] = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5], [1, 5], [4, 5], [5, 6], [1, 6], [5, 4]];
const RECIP_DECS: Rat[] = [rat(1, 10), rat(1, 5), rat(1, 4), rat(2, 5), rat(1, 2)];

const promptFor = (kind: Kind) => (kind === "frac" ? FRAC_PROMPT : WORK_OUT);
const idx = (op: string, kind: Kind, base: Rat, exp: Rat, result: Rat) => ({ op, kind, base, exp, result });

/** a question "base ^ exp = result", all exact */
const done = (kind: Kind, base: Rat, exp: Rat, result: Rat, display: string, working: Built["working"], prompt = promptFor(kind)): Built => ({
  prompt, displayLatex: display, answer: plainNum(result, kind), answerLatex: showNum(result, kind), working, _idx: idx("pow", kind, base, exp, result),
});
const sup = (e: string) => `^{${e}}`;
const rootSym = (n: number) => (n === 2 ? "\\sqrt" : `\\sqrt[${n}]`);

// ── Level 1: squares, cubes, square roots, cube roots ─────────────────────────
export const genPowerL1 = (kind: Kind): Built => {
  if (kind === "int") {
    const r = rnd(0, 3);
    const [b, e] = r === 0 ? [rnd(2, 15), 2] : r === 1 ? [rnd(2, 10), 3] : r === 2 ? [2, rnd(4, 6)] : [10, rnd(2, 3)];
    const v = b ** e;
    return done("int", rat(b), rat(e), rat(v), `${b}${sup(`${e}`)}`, [
      step(`Write out the repeated multiplication (${e} lots of ${b}):`, rep(`${b}`, e)),
      step("Answer:", `${v}`),
    ]);
  }
  const e = choose([2, 3] as const);
  if (kind === "frac") {
    const [a, b] = choose(FRACS);
    const base = rat(a, b), v = rpowInt(base, e);
    return done("frac", base, rat(e), v, `${showBase(base, "frac")}${sup(`${e}`)}`, [
      step("Power the top and the bottom separately:", [`${showBase(base, "frac")}${sup(`${e}`)}`, `= \\dfrac{${a}${sup(`${e}`)}}{${b}${sup(`${e}`)}}`, `= ${fracLatex(v)}`]),
    ]);
  }
  const d = rnd(1, 9), base = rat(d, 10), v = rpowInt(base, e);
  return done("dec", base, rat(e), v, `${showBase(base, "dec")}${sup(`${e}`)}`, [
    step(`Write out the repeated multiplication (${e} lots of 0.${d}):`, rep(`0.${d}`, e)),
    step("Multiply, counting the decimal places:", `= ${showNum(v, "dec")}`),
  ]);
};

export const genRootL1 = (kind: Kind): Built => {
  const n = choose([2, 2, 3] as const); // square roots a little more often than cube roots
  let r: Rat;
  if (kind === "int") r = rat(n === 2 ? rnd(2, 15) : choose([2, 3, 4, 5, 6, 7, 8, 9, 10] as const));
  else if (kind === "frac") { const [a, b] = choose(ROOT_FRACS); r = rat(a, b); }
  else r = rat(rnd(1, 9), 10);
  const base = rpowInt(r, n);
  const baseShown = showNum(base, kind);
  const sym = `${rootSym(n)}{${baseShown}}`;
  const times = rep(showNum(r, kind), n);
  const working = kind === "frac"
    ? [step(`Take the ${n === 2 ? "square" : "cube"} root of the top and of the bottom:`, [sym, `= \\dfrac{${rootSym(n)}{${r[0] ** n}}}{${rootSym(n)}{${r[1] ** n}}}`, `= ${fracLatex(r)}`])]
    : [step(`Which ${kind === "dec" ? "decimal" : "number"} ${n === 2 ? "multiplied by itself" : "multiplied by itself three times"} gives this?`, `${times} = ${baseShown}`), step("Answer:", showNum(r, kind))];
  return { prompt: promptFor(kind), displayLatex: sym, answer: plainNum(r, kind), answerLatex: showNum(r, kind), working, _idx: idx("root", kind, base, rat(1, n), r) };
};

// ── Level 2: zero and negative powers ─────────────────────────────────────────
export const genZero = (kind: Kind): Built => {
  const base = kind === "int" ? rat(choose([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 20, 100] as const))
    : kind === "frac" ? rat(...choose(FRACS)) : rat(rnd(1, 9), 10);
  const shown = `${showBase(base, kind)}${sup("0")}`;
  const working = kind === "int"
    ? [step("Divide a power by itself, using the division law:", [`${base[0]}${sup("3")} \\div ${base[0]}${sup("3")}`, `= ${base[0]}${sup("3-3")}`, `= ${base[0]}${sup("0")}`]), step("Anything divided by itself is 1:", `${base[0]}${sup("0")} = 1`)]
    : [step("Any number (except 0) to the power 0 is 1:", `${shown} = 1`)];
  return done(kind, base, rat(0), rat(1), shown, working, WORK_OUT);
};

export const genNegative = (kind: Kind): Built => {
  const n = choose([1, 1, 2, 2, 3] as const);
  if (kind === "int") {
    const a = choose([2, 3, 4, 5, 6, 7, 8, 9, 10] as const), d = a ** n;
    return done("int", rat(a), rat(-n), rat(1, d), `${a}${sup(`-${n}`)}`, [
      step("A negative power means the reciprocal of the positive power:", `${a}${sup(`-${n}`)} = \\dfrac{1}{${a}${sup(`${n}`)}}`),
      step("Work out the power:", `= \\dfrac{1}{${d}}`),
    ], "Write as a fraction:");
  }
  if (kind === "frac") {
    const [a, b] = choose(FRACS), base = rat(a, b), flipped = rrecip(base), v = rpowInt(flipped, n);
    return done("frac", base, rat(-n), v, `${showBase(base, "frac")}${sup(`-${n}`)}`, [
      step("Flip the fraction to remove the negative:", `${showBase(base, "frac")}${sup(`-${n}`)} = ${showBase(flipped, "frac")}${sup(`${n}`)}`),
      step("Power the top and the bottom:", `= ${fracLatex(v)}`),
    ], WORK_OUT);
  }
  const base = choose(RECIP_DECS), flipped = rrecip(base), v = rpowInt(flipped, n);
  return done("dec", base, rat(-n), v, `${showBase(base, "dec")}${sup(`-${n}`)}`, [
    step("Write the decimal as a fraction:", `${showNum(base, "dec")} = ${fracLatex(base)}`),
    step("Flip it to remove the negative, then power it:", `${showBase(base, "dec")}${sup(`-${n}`)} = ${showBase(flipped, "frac")}${sup(`${n}`)} = ${showNum(v, "dec")}`),
  ], WORK_OUT);
};

export const genReverse = (): Built => {
  const a = choose([2, 3, 4, 5, 10] as const), n = rnd(1, 3), d = a ** n;
  const shown = a === 10 && Math.random() < 0.5 ? showNum(rat(1, d), "dec") : `\\dfrac{1}{${d}}`;
  return {
    prompt: `Write as a power of ${a}:`, displayLatex: shown, answer: `${a}^-${n}`, answerLatex: `${a}${sup(`-${n}`)}`,
    working: [
      step(`Write ${d} as a power of ${a}:`, `${shown} = \\dfrac{1}{${a}${sup(`${n}`)}}`),
      step("One over a power is a negative power:", `= ${a}${sup(`-${n}`)}`),
    ],
    _idx: idx("reverse", "int", rat(a), rat(-n), rat(1, d)),
  };
};

// ── Level 3: fractional and negative fractional powers ────────────────────────
type Root = { r: Rat; n: number };
/** a root r whose n-th power is a tidy base of the given kind */
const rootOf = (kind: Kind, n: number, max = 1000): Root => {
  for (let t = 0; t < 200; t++) {
    let r: Rat;
    if (kind === "int") r = rat(n === 2 ? rnd(2, 12) : n === 3 ? rnd(2, 6) : n === 4 ? choose([2, 3, 5] as const) : choose([2, 3] as const));
    else if (kind === "frac") { const [a, b] = choose(ROOT_FRACS); r = rat(a, b); if (n >= 4 && (a > 3 || b > 3)) continue; }
    else { if (n > 3) continue; r = rat(rnd(1, 9), 10); }
    const base = rpowInt(r, n);
    if (kind === "int" && base[0] > max) continue;
    return { r, n };
  }
  return { r: rat(2), n: 2 };
};

export const genUnitFraction = (kind: Kind): Built => {
  const n = kind === "int" ? choose([2, 2, 3, 3, 4, 5] as const) : kind === "frac" ? choose([2, 3, 2, 4] as const) : choose([2, 3] as const);
  const { r } = rootOf(kind, n), base = rpowInt(r, n);
  const shown = `${showBase(base, kind)}${sup(`\\frac{1}{${n}}`)}`;
  return done(kind, base, rat(1, n), r, shown, [
    step(`A power of one ${n === 2 ? "half" : n === 3 ? "third" : n === 4 ? "quarter" : "fifth"} is ${n === 2 ? "a square" : n === 3 ? "a cube" : `a ${n}th`} root:`, [shown, `= ${rootSym(n)}{${showNum(base, kind)}}`, `= ${showNum(r, kind)}`]),
  ]);
};

const GENERAL: [number, number][] = [[2, 3], [3, 2], [3, 4], [2, 5], [4, 3]]; // [m, n]: a^(m/n)
export const genGeneralFraction = (kind: Kind): Built => {
  for (let t = 0; t < 100; t++) {
    const [m, n] = kind === "dec" ? choose([[2, 3], [3, 2]] as const) : kind === "frac" ? choose([[2, 3], [3, 2], [3, 4], [2, 5]] as const) : choose(GENERAL);
    const { r } = rootOf(kind, n), base = rpowInt(r, n), v = rpowInt(r, m);
    if (kind === "int" && v[0] > 1000) continue;
    const shown = `${showBase(base, kind)}${sup(`\\frac{${m}}{${n}}`)}`;
    return done(kind, base, rat(m, n), v, shown, [
      step("The denominator is the root and the numerator is the power. Take the root first:", [shown, `= \\left(${rootSym(n)}{${showNum(base, kind)}}\\right)${sup(`${m}`)}`, `= ${showBase(r, kind)}${sup(`${m}`)}`]),
      step("Answer:", showNum(v, kind)),
    ]);
  }
  return genUnitFraction(kind);
};

export const genNegativeFraction = (kind: Kind): Built => {
  const pairs: [number, number][] = kind === "dec" ? [[1, 2], [1, 3], [2, 3], [3, 2]] : [[1, 2], [1, 3], [2, 3], [3, 2], [3, 4], [1, 4]];
  for (let t = 0; t < 100; t++) {
    const [m, n] = choose(pairs);
    let r: Rat;
    if (kind === "dec") r = choose([rat(1, 2), rat(1, 5), rat(1, 10)]);
    else r = rootOf(kind, n, 200).r;
    const base = rpowInt(r, n), v = rpowInt(rrecip(r), m);
    if (kind === "int" && (base[0] > 1000 || v[1] > 1000)) continue;
    if (kind !== "int" && !(rpow(base, rat(1, n)) && req(rpow(base, rat(1, n))!, r))) continue;
    const shown = `${showBase(base, kind)}${sup(`-\\frac{${m}}{${n}}`)}`;
    const flipped = rrecip(base);
    const first = kind === "frac" || kind === "dec"
      ? step("Flip to remove the negative (a decimal is first written as a fraction):", `${shown} = ${showBase(flipped, "frac")}${sup(`\\frac{${m}}{${n}}`)}`)
      : step("A negative power means the reciprocal:", `${shown} = \\dfrac{1}{${showBase(base, kind)}${sup(`\\frac{${m}}{${n}}`)}}`);
    const rootStep = kind === "int"
      ? step("Take the root first, then the power:", [`${showBase(base, kind)}${sup(`\\frac{${m}}{${n}}`)} = \\left(${rootSym(n)}{${base[0]}}\\right)${sup(`${m}`)}`, `= ${r[0]}${sup(`${m}`)}`, `= ${r[0] ** m}`])
      : step("Take the root first, then the power:", `\\left(${rootSym(n)}{${showNum(flipped, "frac")}}\\right)${sup(`${m}`)} = ${showBase(rrecip(r), "frac")}${sup(`${m}`)} = ${showNum(v, kind)}`);
    const out = kind === "int" ? step("Answer:", fracLatex(v)) : step("Answer:", showNum(v, kind));
    return done(kind, base, rat(-m, n), v, shown, [first, rootStep, out], kind === "frac" ? FRAC_PROMPT : kind === "int" ? "Work out, giving a fraction in its simplest form:" : WORK_OUT);
  }
  return genUnitFraction(kind);
};

export { shuffle, isInt, fracPlain };
