import {
  ToolShell, resolveMultiSelectValues,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type WorkingStep, type ToolMultiSelect,
  pick, mStep, pickActive,
} from "../../shared";
import {
  F, add, mul, div, neg, eq, absF, lt, powI, toNum, frTex, frAbsTex, frSmall, frPlain, series, powRat, polyTex,
  kxTex, kxPlain, modLt, termSubst, stepVisual, withExtra, opt, pool, askPool, toPool, entry, upToOf, rangeText, ascTex, descTex, isPosInt, nonZero, type Fr,
} from "../../shared/binomial";

// ═══════════════════════════════════════════════════════════
// Binomial expansion of fractions (A-Level Mathematics, AQA 7357, Year 2) — a fraction with ONE bracket in the denominator needs no partial fractions:
// write it as a product, e.g. (1 + x)/(1 − x) = (1 + x)(1 − x)⁻¹, expand each bracket (the numerator is a polynomial, the denominator a binomial series)
// and multiply. The same works for a whole fraction squared, cubed, square-rooted or cube-rooted. (Two or more different brackets in the denominator
// need partial fractions: see Binomial Expansion with Partial Fractions.) Spec: specs/binomial-expansion.md
//   One bracket below   — (px + q) / (r + sx)ⁿ
//   Power of a fraction — ((px + q) / (r + sx)) squared, cubed, √ or ∛
// ═══════════════════════════════════════════════════════════

// ── 1. TOOL_CONFIG ──────────────────────────────────────────

type SubTool = "one" | "power";

const writtenPool = pool("written", "Written as", [opt("exp", "Powers", true), opt("root", "Roots", true)]);
const denPool = pool("denPower", "Denominator power", [opt("two", "2"), opt("three", "3", false)]);
const raisedPool = (level: DifficultyLevel) => pool("raised", "Fraction raised to", level === "level1"
  ? [opt("square", "2")] : level === "level2" ? [opt("square", "2"), opt("cube", "3")] : [opt("root", "√"), opt("cuberoot", "∛", false)]);

const ONE_POOLS: Record<DifficultyLevel, ToolMultiSelect[]> = {
  level1: [askPool("level1"), toPool("level1")],
  level2: [askPool("level2"), toPool("level2")],
  level3: [denPool, askPool("level3"), toPool("level3")],
};
const POWER_POOLS: Record<DifficultyLevel, ToolMultiSelect[]> = {
  level1: [raisedPool("level1"), askPool("level1"), toPool("level1")],
  level2: [raisedPool("level2"), askPool("level2"), toPool("level2")],
  level3: [raisedPool("level3"), writtenPool, askPool("level3"), toPool("level3")],
};

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Binomial Expansion of Fractions",
  tools: {
    one: entry("One bracket below", ONE_POOLS, ["(px + q)/(1 + kx), up to x²", "(px + q)/(r + sx), take r out, up to x³", "(px + q)/(r + sx) squared or cubed in the denominator"]),
    power: entry("Power of a fraction", POWER_POOLS, ["((px + q)/(1 + kx))², up to x²", "A fraction squared or cubed, any constants, up to x³", "√ or ∛ of a fraction"]),
  },
};

const INFO_SECTIONS: InfoSection[] = [
  { title: "Scope", icon: "🎯", content: [
    { label: "AQA A-level Maths, Year 2", detail: "One bracket in the denominator needs no partial fractions: write (1 + x)/(1 − x) as (1 + x)(1 − x)⁻¹ and expand. Two or more different brackets in the denominator: see Binomial Expansion with Partial Fractions." },
  ]},
  { title: "Method", icon: "➗", content: [
    { label: "Steps", detail: "Take out constants, expand each bracket, multiply, then multiply by the constants. The range is the smaller of the brackets' ranges (a whole-number power of the numerator puts no limit on x)." },
    { label: "Levels", detail: "One bracket below — Green: (px + q)/(1 + kx). Yellow: (px + q)/(r + sx). Red: the denominator squared or cubed. Power of a fraction — Green: squared, denominator 1 + kx. Yellow: squared or cubed. Red: √ or ∛." },
  ]},
];

// ── 2. The fraction and its working ──────────────────────────

/** (c + dx)^n for the numerator (n > 0) and the denominator (n < 0) */
interface Part { c: number; d: Fr; n: Fr }
interface FracExpr { num: Part; den: Part }

function fractionWritten(fe: FracExpr, root: boolean): string {
  const N = descTex(fe.num.c, fe.num.d), D = ascTex(fe.den.c, fe.den.d);
  if (eq(fe.num.n, F(1)) && !eq(fe.den.n, F(-1))) return `\\dfrac{${N}}{\\left(${D}\\right)^{${-fe.den.n.n}}}`;
  const inner = `\\dfrac{${N}}{${D}}`;
  const e = fe.num.n;
  if (eq(e, F(1))) return inner;
  if (root && eq(e, F(1, 2))) return `\\sqrt{${inner}}`;
  if (root && eq(e, F(1, 3))) return `\\sqrt[3]{${inner}}`;
  return `\\left(${inner}\\right)^{${frSmall(e)}}`;
}

function fractionWorking(fe: FracExpr, m: number, root: boolean): { steps: WorkingStep[]; answer: Fr[]; bound: Fr } {
  const facs = [fe.num, fe.den];
  const parts = facs.map((f) => {
    const k = div(f.d, F(f.c));
    const mult = f.n.d === 1 ? powI(F(f.c), f.n.n) : (powRat(f.c, f.n) as Fr);
    return { ...f, k, mult, core: series(f.n, k, m) };
  });
  const mult = parts.reduce<Fr>((acc, q) => mul(acc, q.mult), F(1));
  const prod: Fr[] = Array.from({ length: m + 1 }, (_, r) => parts[0].core.reduce<Fr>((acc, c, i) => (i <= r ? add(acc, mul(c, parts[1].core[r - i] ?? F(0))) : acc), F(0)));
  const full = prod.map((c) => mul(c, mult));
  const brk = (q: typeof parts[number]) => `\\left(1 ${q.k.n < 0 ? "-" : "+"} ${eq(absF(q.k), F(1)) ? "" : frAbsTex(absF(q.k))}x\\right)^{${frSmall(q.n)}}`;
  const steps: WorkingStep[] = [];
  if (!eq(mult, F(1))) steps.push(mStep("Take out the constants:", [fractionWritten(fe, root), ` = ${frTex(mult)}${parts.map(brk).join("")}`]));
  else steps.push(mStep("Write as a product:", [fractionWritten(fe, root), ` = ${parts.map(brk).join("")}`]));
  parts.forEach((q) => {
    if (isPosInt(q.n)) {
      steps.push(mStep(`Expand ${q.n.n === 1 ? "the numerator" : "the bracket"}:`, [brk(q), ` = ${polyTex(q.core)}`]));
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

function makeFraction(tool: SubTool, level: DifficultyLevel, pk: (key: string) => string): FracExpr {
  for (let guard = 0; guard < 1000; guard++) {
    const q = nonZero(-4, 4), s = nonZero(-4, 4);
    if (tool === "one") {
      const p = pick([1, 2, 3, 4]);
      const r = level === "level1" ? 1 : level === "level2" ? pick([2, 3, 4, 5]) : pick([1, 2, 3, 4, 5]);
      const m = level === "level3" ? (pk("denPower") === "three" ? 3 : 2) : 1;
      if (p * s === r * q) continue; // the same bracket: nothing left of the fraction
      return { num: { c: p, d: F(q), n: F(1) }, den: { c: r, d: F(s), n: F(-m) } };
    }
    const raised = pk("raised");
    const e = raised === "square" ? F(2) : raised === "cube" ? F(3) : raised === "root" ? F(1, 2) : F(1, 3);
    const consts = e.d === 1 ? [1, 2, 3, 4, 5] : e.d === 2 ? [1, 4, 9] : [1, 8, 27];
    const p = pick(consts), r = level === "level1" ? 1 : pick(consts);
    if (e.d !== 1 && p === 1 && r === 1) continue; // at least one constant to take out
    if (p * s === r * q) continue;
    if (e.d !== 1 && Math.abs(p / q) === Math.abs(r / s)) continue; // the two ranges must differ, so taking the smaller is a real decision
    return { num: { c: p, d: F(q), n: e }, den: { c: r, d: F(s), n: neg(e) } };
  }
  throw new Error("binomial fractions: no question found");
}

function fractionQuestion(tool: SubTool, level: DifficultyLevel, msv: Record<string, boolean>): AnyQuestion {
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
    : [`Expand $${expr}$ up to $x^{${m}}$.`, ...(ask === "range" ? ["State the range of validity of the expansion."] : [])];
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

// ── 4. generateQuestion ─────────────────────────────────────

const generateQuestion = (
  tool: string, level: DifficultyLevel,
  _vars: Record<string, boolean>, _dropdownValue: string, multiSelectValues: Record<string, boolean> = {},
): AnyQuestion => {
  const t = tool as SubTool;
  const pools = t === "one" ? ONE_POOLS[level] : POWER_POOLS[level];
  return fractionQuestion(t, level, resolveMultiSelectValues(pools, multiSelectValues));
};

export const __test = { TOOL_CONFIG, generateQuestion, helpers: { fractionWorking } };

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      stepVisualRenderer={stepVisual}
      stepVisualKeepsWorking
      stepVisualPlacement="top"
      defaults={{ numQuestions: 6, numColumns: 2, collapseWorkingByDefault: true }}
    />
  );
}
