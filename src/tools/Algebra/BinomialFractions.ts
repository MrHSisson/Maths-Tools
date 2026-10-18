import {
  type DifficultyLevel, type AnyQuestion, type WorkingStep, type ToolMultiSelect,
  pick, mStep, pickActive,
} from "../../shared";
import {
  F, add, mul, div, neg, eq, absF, lt, powI, toNum, frTex, frAbsTex, frSmall, frPlain, series, powRat, polyTex, rootTex,
  kxTex, kxPlain, modLt, termSubst, withExtra, opt, pool, askPool, toPool, upToOf, rangeText, ascTex, descTex, isPosInt, nonZero, type Fr,
} from "../../shared/binomial";

// ═══════════════════════════════════════════════════════════
// Binomial expansion of fractions — two sub-tools of the Binomial Expansion tool (A-Level Mathematics, AQA 7357, Year 2) — a fraction with ONE bracket in the denominator needs no partial fractions:
// write it as a product, e.g. (1 + x)/(1 − x) = (1 + x)(1 − x)⁻¹, expand each bracket (the numerator is a polynomial, the denominator a binomial series)
// and multiply. The same works for a whole fraction squared, cubed, square-rooted or cube-rooted. (Two or more different brackets in the denominator
// need partial fractions: see Binomial Expansion with Partial Fractions.) Spec: specs/binomial-expansion.md
//   One bracket below   — (px + q) / (r + sx)ⁿ
//   Power of a fraction — ((px + q) / (r + sx)) squared, cubed, √ or ∛
// ═══════════════════════════════════════════════════════════

// ── 1. TOOL_CONFIG ──────────────────────────────────────────

export type FractionTool = "one" | "power";

const writtenPool = pool("written", "Written as", [opt("exp", "Powers", true), opt("root", "Roots", true)]);
const denPool = pool("denPower", "Denominator power", [opt("one", "1"), opt("two", "2"), opt("three", "3"), opt("root", "√"), opt("cuberoot", "∛"), opt("quarters", "¼, ¾", false), opt("fifths", "⅕ to ⅘", false)]);
const raisedPool = pool("raised", "Fraction raised to", [opt("square", "2"), opt("cube", "3"), opt("root", "√"), opt("cuberoot", "∛"), opt("quarters", "¼, ¾", false), opt("fifths", "⅕ to ⅘", false)]);

/** the power an option stands for (quarters and fifths pick one of their fractions) */
const powerOf = (v: string): Fr => v === "two" || v === "square" ? F(2) : v === "three" || v === "cube" ? F(3) : v === "root" ? F(1, 2) : v === "cuberoot" ? F(1, 3)
  : v === "quarters" ? pick([F(1, 4), F(3, 4)]) : v === "fifths" ? pick([F(1, 5), F(2, 5), F(3, 5), F(4, 5)]) : F(1);

export const ONE_POOLS: Record<DifficultyLevel, ToolMultiSelect[]> = {
  level1: [denPool, askPool("level1"), toPool("level1")],
  level2: [denPool, askPool("level2"), toPool("level2")],
  level3: [denPool, askPool("level3"), toPool("level3")],
};
export const POWER_POOLS: Record<DifficultyLevel, ToolMultiSelect[]> = {
  level1: [raisedPool, writtenPool, askPool("level1"), toPool("level1")],
  level2: [raisedPool, writtenPool, askPool("level2"), toPool("level2")],
  level3: [raisedPool, writtenPool, askPool("level3"), toPool("level3")],
};

// The level is the DENOMINATOR bracket (the numerator is any px + q): 1 ± x, then 1 + kx, then a + bx. The power (2, 3, √, ∛) is an option on every level.
export const ONE_LEVELS = ["Denominator 1 ± x", "Denominator 1 + kx", "Denominator a + bx"];
export const POWER_LEVELS = ONE_LEVELS;

// ── 2. The fraction and its working ──────────────────────────

/** (c + dx)^n for the numerator (n > 0) and the denominator (n < 0) */
interface Part { c: number; d: Fr; n: Fr }
interface FracExpr { num: Part; den: Part }

function fractionWritten(fe: FracExpr, root: boolean): string {
  const N = descTex(fe.num.c, fe.num.d), D = ascTex(fe.den.c, fe.den.d);
  if (eq(fe.num.n, F(1)) && !eq(fe.den.n, F(-1))) {
    const dp = neg(fe.den.n);
    return `\\dfrac{${N}}{${dp.d === 1 ? `\\left(${D}\\right)^{${dp.n}}` : rootTex(D, dp)}}`;
  }
  const inner = `\\dfrac{${N}}{${D}}`;
  const e = fe.num.n;
  if (eq(e, F(1))) return inner;
  if (root && e.d !== 1) return rootTex(inner, e);
  return `\\left(${inner}\\right)^{${frSmall(e)}}`;
}

/** (c + dx)^n for a positive whole n, as coefficients up to x^m */
function polyPow(c: number, d: Fr, n: number, m: number): Fr[] {
  let acc: Fr[] = [F(1), ...Array.from({ length: m }, () => F(0))];
  for (let i = 0; i < n; i++) acc = acc.map((_, r) => add(mul(acc[r], F(c)), r > 0 ? mul(acc[r - 1], d) : F(0)));
  return acc;
}

function fractionWorking(fe: FracExpr, m: number, root: boolean): { steps: WorkingStep[]; answer: Fr[]; bound: Fr } {
  const facs = [fe.num, fe.den];
  // a numerator raised to a positive whole number is already a polynomial: expand it as it stands, never take its constant out
  const parts = facs.map((f) => {
    const k = div(f.d, F(f.c));
    const keep = isPosInt(f.n);
    const mult = keep ? F(1) : f.n.d === 1 ? powI(F(f.c), f.n.n) : (powRat(f.c, f.n) as Fr);
    return { ...f, k, keep, mult, core: keep ? polyPow(f.c, f.d, f.n.n, m) : series(f.n, k, m) };
  });
  const mult = parts.reduce<Fr>((acc, q) => mul(acc, q.mult), F(1));
  const prod: Fr[] = Array.from({ length: m + 1 }, (_, r) => parts[0].core.reduce<Fr>((acc, c, i) => (i <= r ? add(acc, mul(c, parts[1].core[r - i] ?? F(0))) : acc), F(0)));
  const full = prod.map((c) => mul(c, mult));
  const unit = (q: typeof parts[number]) => `\\left(1 ${q.k.n < 0 ? "-" : "+"} ${eq(absF(q.k), F(1)) ? "" : frAbsTex(absF(q.k))}x\\right)^{${frSmall(q.n)}}`;
  const brk = (q: typeof parts[number]) => (q.keep ? `\\left(${descTex(q.c, q.d)}\\right)${q.n.n === 1 ? "" : `^{${q.n.n}}`}` : unit(q));
  // each bracket as it is before its constant comes out: the constant to the power the bracket carries, so where the 1/27 comes from is on the page
  const withConst = (q: typeof parts[number]) => (q.keep || q.c === 1 ? brk(q) : `${q.c}^{${frSmall(q.n)}}${unit(q)}`);
  const steps: WorkingStep[] = [];
  if (!eq(mult, F(1))) {
    steps.push(mStep("Take the constants out of the brackets:", [fractionWritten(fe, root), ` = ${parts.map(withConst).join("")}`, ` = ${frTex(mult)}${parts.map(brk).join("")}`]));
  } else steps.push(mStep("Write as a product:", [fractionWritten(fe, root), ` = ${parts.map(brk).join("")}`]));
  parts.forEach((q) => {
    if (q.keep) {
      if (q.n.n > 1) steps.push(mStep("Expand the numerator:", [brk(q), ` = ${polyTex(q.core)}`]));
    } else {
      const kx = kxTex(q.k);
      steps.push(mStep(`Expand, with n = ${frPlain(q.n)}, u = ${kxPlain(q.k)}:`, [
        brk(q), ` = 1 + ${termSubst(q.n, 1, kx)}`,
        ...Array.from({ length: m - 1 }, (_, i) => ` + ${termSubst(q.n, i + 2, kx)}`),
        ` = ${polyTex(q.core)}`,
      ]));
    }
  });
  steps.push(mStep(`Multiply, up to x${m === 1 ? "" : m === 2 ? "²" : m === 3 ? "³" : "⁴"}:`, [`\\left(${polyTex(parts[0].core)}\\right)\\left(${polyTex(parts[1].core)}\\right)`, ` = ${polyTex(prod)}`]));
  if (!eq(mult, F(1))) steps.push(mStep(`Multiply by ${frPlain(mult)}:`, [`${frTex(mult)}\\left(${polyTex(prod)}\\right)`, ` = ${polyTex(full)}`]));
  const restricted = parts.filter((q) => !isPosInt(q.n));
  const bounds = restricted.map((q) => absF(div(F(q.c), q.d)));
  const bound = bounds.reduce((mn, b) => (lt(b, mn) ? b : mn), bounds[0]);
  const rows = restricted.map((_q, i) => ({ label: modLt(bounds[i]), c: toNum(bounds[i]), plain: frPlain(bounds[i]) }));
  steps.push(withExtra(mStep(restricted.length > 1 ? "Each bracket needs |kx| < 1:" : "Valid for |u| < 1:", restricted.map((q, i) => `${i ? ",\\ " : ""}\\left|${kxTex(q.k)}\\right| < 1 \\Rightarrow ${modLt(bounds[i])}`)), { kind: "binInterval", rows }));
  if (restricted.length > 1) steps.push(withExtra(mStep("Both must hold, so take the smaller:", [modLt(bound)]), { kind: "binInterval", rows, overlap: true }));
  return { steps, answer: full, bound };
}

// ── 3. Questions ─────────────────────────────────────────────

function makeFraction(tool: FractionTool, level: DifficultyLevel, pk: (key: string) => string): FracExpr {
  // one bracket below: only the DENOMINATOR is raised (the numerator stays px + q); power of a fraction: both brackets
  const e = tool === "one" ? F(1) : powerOf(pk("raised"));
  const dp = tool === "one" ? powerOf(pk("denPower")) : e;
  const numRooty = e.d !== 1, denRooty = dp.d !== 1;
  // a root needs a rational constant from each bracket raised to it: perfect q-th powers (1 counts, which is why roots are fine from Level 1)
  const perfect = (q: number) => [1, 2 ** q, 3 ** q];
  for (let guard = 0; guard < 2000; guard++) {
    // the denominator is what the level is about
    let r: number, s: number;
    if (level === "level1") { r = 1; s = pick([1, -1]); }
    else if (level === "level2") { r = 1; s = pick([2, 3, 4, 5, -2, -3, -4, -5]); }
    else { r = denRooty ? pick(perfect(dp.d).filter((x) => x > 1)) : pick([2, 3, 4, 5]); s = nonZero(-4, 4); }
    // the numerator is any px + q only when it is a positive whole number power; raised to a root it is expanded too, so it follows the same ladder as the
    // denominator (1 ± x, then 1 + kx, then a + bx with a a perfect power)
    let p: number, q: number;
    if (!numRooty) { p = pick([1, 2, 3, 4]); q = nonZero(-5, 5); }
    else if (level === "level1") { p = 1; q = pick([1, -1]); }
    else if (level === "level2") { p = 1; q = nonZero(-5, 5); }
    else { p = pick(perfect(e.d)); q = nonZero(-4, 4); }
    if (p * s === r * q) continue; // the same bracket: nothing left of the fraction
    if (numRooty && level !== "level1" && Math.abs(p / q) === Math.abs(r / s)) continue; // two ranges that differ, so taking the smaller is a real decision
    return { num: { c: p, d: F(q), n: e }, den: { c: r, d: F(s), n: neg(dp) } };
  }
  throw new Error("binomial fractions: no question found");
}

function fractionQuestion(tool: FractionTool, level: DifficultyLevel, msv: Record<string, boolean>): AnyQuestion {
  const pools = tool === "one" ? ONE_POOLS[level] : POWER_POOLS[level];
  const pk = (key: string) => pickActive(msv, pools.find((q) => q.key === key)!.options);
  const ask = pk("ask");
  const m = upToOf(pk("upTo"));
  const root = tool === "power" && level === "level3" && pk("written") === "root";
  const fe = makeFraction(tool, level, (k) => (pools.some((q) => q.key === k) ? pk(k) : ""));
  const { steps, answer, bound } = fractionWorking(fe, m, root);
  const expr = fractionWritten(fe, root);
  const lines = ask === "coef"
    ? [`Find the coefficient of $x^{${m}}$ in the expansion of $${expr}$.`]
    : ask === "range"
      ? [`(a) Expand $${expr}$ up to $x^{${m}}$.`, "(b) State the range of values of $x$ for which the expansion is valid."]
      : [`Expand $${expr}$ up to $x^{${m}}$.`];
  const id = Math.floor(Math.random() * 1_000_000);
  return {
    kind: "worded", lines,
    answer: ask === "coef" ? frPlain(answer[m]) : polyTex(answer),
    answerLatex: ask === "coef" ? frTex(answer[m]) : polyTex(answer),
    answerSuffix: ask === "range" ? `, ${rangeText(bound)}` : undefined,
    working: steps,
    key: `bf-${tool}-${level}-${fe.num.c}_${frPlain(fe.num.d)}_${frPlain(fe.num.n)}-${fe.den.c}_${frPlain(fe.den.d)}_${frPlain(fe.den.n)}-${m}-${ask}-${root ? "r" : "p"}-${id}`,
    difficulty: level,
    _raw: { fe, m, ask, tool },
  } as unknown as AnyQuestion;
}

// ── 4. Entry point used by the Binomial Expansion tool ────────

export const generateFraction = (tool: FractionTool, level: DifficultyLevel, msv: Record<string, boolean>): AnyQuestion => fractionQuestion(tool, level, msv);
export const fractionHelpers = { fractionWorking };
