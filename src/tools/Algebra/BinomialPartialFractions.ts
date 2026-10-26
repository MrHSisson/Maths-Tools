import {
  type DifficultyLevel, type AnyQuestion, type WorkingStep, type ToolMultiSelect,
  pick, mStep, pickActive,
} from "../../shared";
import {
  F, add, sub, mul, div, neg, eq, isZero, absF, lt, powI, toNum, frTex, frAbsTex, frPlain, series, polyTex, xPow,
  kxTex, linTex, modLt, condTex, coefPre, termSubst, withExtra, opt, pool, upToOf, rangeText, nonZero, type Fr,
} from "../../shared/binomial";

// ═══════════════════════════════════════════════════════════
// Binomial expansion with partial fractions — a sub-tool of the Binomial Expansion tool (A-Level Mathematics, AQA 7357, Year 2) — the denominator has TWO OR MORE different linear brackets, so
// the fraction is first written in partial fractions, each is expanded, the coefficients are added, and the range is the smaller of the ranges.
// (One bracket in the denominator needs no partial fractions: see Binomial Expansion of Fractions.) Spec: specs/binomial-expansion.md
// ═══════════════════════════════════════════════════════════

// ── 1. TOOL_CONFIG ──────────────────────────────────────────

const formPool = (level: DifficultyLevel): ToolMultiSelect[] => level !== "level3" ? [] : [pool("denom", "Denominator", [opt("repeated", "A repeated factor"), opt("improper", "Divide first*")])];
const numPool = (level: DifficultyLevel): ToolMultiSelect[] => level === "level3" ? [] : [pool("numer", "Numerator", [opt("linear", "Linear"), opt("constant", "Constant", false)])];
export const PARTIAL_POOLS: Record<DifficultyLevel, ToolMultiSelect[]> = {
  level1: [...numPool("level1"), pool("upTo", "Expand Up to", [opt("x2", "x²"), opt("x3", "x³", false)]), pool("ask", "Ask for", [opt("expansion", "The expansion", false), opt("range", "Expansion and range"), opt("coef", "One coefficient", false)])],
  level2: [...formPool("level2"), ...numPool("level2"), pool("upTo", "Expand Up to", [opt("x2", "x²", false), opt("x3", "x³")]), pool("ask", "Ask for", [opt("expansion", "The expansion", false), opt("range", "Expansion and range"), opt("coef", "One coefficient", false)])],
  level3: [...formPool("level3"), pool("upTo", "Expand Up to", [opt("x2", "x²"), opt("x3", "x³")]), pool("ask", "Ask for", [opt("expansion", "The expansion", false), opt("range", "Expansion and range"), opt("coef", "One coefficient", false)])],
};



// ── 2. With partial fractions ───────────────────────────────


/** a linear factor (c + dx), raised to m (1 or 2) */
interface Fac { c: Fr; d: Fr; m: 1 | 2 }
/** one partial fraction: A / (c + dx)^p */
interface PTerm { fi: number; p: 1 | 2; letter: string; A: Fr }
interface PRaw { facs: Fac[]; terms: PTerm[]; N: Fr[]; Q: Fr | null; improper: boolean }

type Poly = Fr[]; // ascending
const pMul = (a: Poly, b: Poly): Poly => { const out = Array.from({ length: a.length + b.length - 1 }, () => F(0)); a.forEach((x, i) => b.forEach((y, j) => { out[i + j] = add(out[i + j], mul(x, y)); })); return out; };
const pAdd = (a: Poly, b: Poly): Poly => Array.from({ length: Math.max(a.length, b.length) }, (_, i) => add(a[i] ?? F(0), b[i] ?? F(0)));
const pScale = (a: Poly, s: Fr): Poly => a.map((x) => mul(x, s));
const pEval = (a: Poly, x: Fr): Fr => a.reduceRight((acc, c) => add(mul(acc, x), c), F(0));
const facPoly = (f: Fac): Poly => (f.m === 2 ? pMul([f.c, f.d], [f.c, f.d]) : [f.c, f.d]);
const denomPoly = (facs: Fac[]): Poly => facs.reduce<Poly>((acc, f) => pMul(acc, facPoly(f)), [F(1)]);
const trimP = (a: Poly): Poly => { const o = [...a]; while (o.length > 1 && isZero(o[o.length - 1])) o.pop(); return o; };

/** the numerator that gives these partial fractions over these factors (plus Q × denominator when improper) */
function numeratorOf(facs: Fac[], terms: PTerm[], Q: Fr | null): Poly {
  let N: Poly = [F(0)];
  for (const t of terms) {
    let piece: Poly = [t.A];
    facs.forEach((f, j) => { const left = j === t.fi ? f.m - t.p : f.m; for (let i = 0; i < left; i++) piece = pMul(piece, [f.c, f.d]); });
    N = pAdd(N, piece);
  }
  if (Q) N = pAdd(N, pScale(denomPoly(facs), Q));
  return trimP(N);
}

/** the series of N/D up to x^m by dividing term by term (an independent route used to check the partial-fraction result) */
function seriesDivide(N: Poly, D: Poly, m: number): Fr[] {
  const out: Fr[] = [];
  for (let r = 0; r <= m; r++) {
    let acc = N[r] ?? F(0);
    for (let i = 1; i <= r; i++) acc = sub(acc, mul(D[i] ?? F(0), out[r - i]));
    out.push(div(acc, D[0]));
  }
  return out;
}


function makePartial(level: DifficultyLevel, form: string, numer: string): PRaw {
  for (let guard = 0; guard < 500; guard++) {
    let facs: Fac[]; let terms: PTerm[]; let Q: Fr | null = null;
    if (level === "level3") {
      const a = pick([1, -1, 2, -2, 3, -3]); let b = pick([1, -1, 2, -2, 3, -3]);
      if (Math.abs(a) === Math.abs(b)) continue;
      if (form === "improper") {
        facs = [{ c: F(1), d: F(a), m: 1 }, { c: F(1), d: F(b), m: 1 }];
        terms = [{ fi: 0, p: 1, letter: "A", A: F(nonZero(-4, 4)) }, { fi: 1, p: 1, letter: "B", A: F(nonZero(-4, 4)) }];
        Q = F(nonZero(-3, 3));
      } else if (Math.random() < 0.7) {
        facs = [{ c: F(1), d: F(a), m: 1 }, { c: F(1), d: F(b), m: 2 }];
        terms = [{ fi: 0, p: 1, letter: "A", A: F(nonZero(-3, 3)) }, { fi: 1, p: 1, letter: "B", A: F(nonZero(-3, 3)) }, { fi: 1, p: 2, letter: "C", A: F(nonZero(-3, 3)) }];
      } else {
        facs = [{ c: F(1), d: F(a), m: 2 }];
        terms = [{ fi: 0, p: 1, letter: "A", A: F(nonZero(-4, 4)) }, { fi: 0, p: 2, letter: "B", A: F(nonZero(-4, 4)) }];
      }
    } else {
      const scaled = level === "level2";
      const c1 = scaled ? pick([1, 2, 3, 4]) : 1, c2 = scaled ? pick([1, 2, 3, 4]) : 1;
      const d1 = pick([1, -1, 2, -2, 3, -3]), d2 = pick([1, -1, 2, -2, 3, -3]);
      if (c1 * d2 === c2 * d1) continue; // the same root: not two different factors
      if (scaled && c1 === 1 && c2 === 1) continue;
      let A = nonZero(-4, 4), B = nonZero(-4, 4);
      if (numer === "constant") { const s = pick([1, -1, 2]); A = d1 * s; B = -d2 * s; }
      facs = [{ c: F(c1), d: F(d1), m: 1 }, { c: F(c2), d: F(d2), m: 1 }];
      terms = [{ fi: 0, p: 1, letter: "A", A: F(A) }, { fi: 1, p: 1, letter: "B", A: F(B) }];
    }
    // the two ranges must differ so that taking the smaller is a real decision
    const bounds = facs.map((f) => absF(div(f.c, f.d)));
    if (bounds.length > 1 && bounds.some((x, i) => bounds.some((y, j) => i < j && eq(x, y)))) continue;
    const N = numeratorOf(facs, terms, Q);
    if (N.length === 1 && isZero(N[0])) continue;
    if (N.some((c) => Math.abs(c.n) > 60)) continue;
    return { facs, terms, N, Q, improper: Q !== null };
  }
  throw new Error("binomial expansion: no partial-fraction question found");
}

/** the series of each partial fraction A/(c + dx)^p, up to x^m */
function termSeries(f: Fac, t: PTerm, m: number): { core: Fr[]; mult: Fr; full: Fr[] } {
  const k = div(f.d, f.c);
  const mult = mul(t.A, powI(f.c, -t.p));
  const core = series(F(-t.p), k, m);
  return { core, mult, full: core.map((c) => mul(c, mult)) };
}

const facTex = (f: Fac): string => `\\left(${linTex(f.c, f.d)}\\right)${f.m === 2 ? "^{2}" : ""}`;
const facsTex = (facs: Fac[]) => facs.map(facTex).join("");
const termTex = (f: Fac, t: PTerm) => `\\dfrac{${frTex(t.A)}}{${t.p === 2 ? `\\left(${linTex(f.c, f.d)}\\right)^{2}` : linTex(f.c, f.d)}}`;
const pfSum = (raw: PRaw): string => {
  const body = raw.terms.map((t, i) => { const s = termTex(raw.facs[t.fi], t); return i === 0 ? s : s.startsWith("\\dfrac{-") ? ` - ${s.replace("\\dfrac{-", "\\dfrac{")}` : ` + ${s}`; }).join("");
  return raw.Q ? `${frTex(raw.Q)} ${body.startsWith(" -") ? body : ` + ${body}`}` : body;
};

function partialWorking(raw: PRaw, m: number, ask: string): { steps: WorkingStep[]; answer: Fr[]; bound: Fr; pf: string } {
  const { facs, terms, N, Q } = raw;
  const D = denomPoly(facs);
  const steps: WorkingStep[] = [];
  let R = N;
  if (Q) {
    R = trimP(pAdd(N, pScale(D, neg(Q))));
    steps.push(mStep("Divide first:", [
      `\\dfrac{${polyTexDesc(N)}}{${polyTexDesc(D)}}`,
      ` = ${frTex(Q)} + \\dfrac{${polyTexDesc(R)}}{${polyTexDesc(D)}}`,
    ]));
  }
  const factorOf = (t: PTerm) => `${t.p === 2 ? `\\left(${linTex(facs[t.fi].c, facs[t.fi].d)}\\right)^{2}` : linTex(facs[t.fi].c, facs[t.fi].d)}`;
  const rest = (t: PTerm) => facs.map((f, j) => { const left = j === t.fi ? f.m - t.p : f.m; return left === 0 ? "" : `\\left(${linTex(f.c, f.d)}\\right)${left === 2 ? "^{2}" : ""}`; }).join("");
  steps.push(mStep("Partial fractions:", [
    `\\dfrac{${polyTexDesc(R)}}{${facsTex(facs)}} \\equiv ${terms.map((t, i) => `${i ? " + " : ""}\\dfrac{${t.letter}}{${factorOf(t)}}`).join("")}`,
    ` \\Rightarrow ${polyTexDesc(R)} \\equiv ${terms.map((t, i) => `${i ? " + " : ""}${t.letter}${rest(t)}`).join("")}`,
  ]));
  // the top-power constants by substitution, the one leftover (the single power of a repeated factor) by equating coefficients; both checked against the question
  facs.forEach((f, j) => {
    const top = terms.find((t) => t.fi === j && t.p === f.m)!;
    const root = neg(div(f.c, f.d));
    const cof = facs.reduce<Fr>((acc, g, i) => (i === j ? acc : mul(acc, powI(add(g.c, mul(g.d, root)), g.m))), F(1));
    const val = div(pEval(R, root), cof);
    if (!eq(val, top.A)) throw new Error("binomial expansion: constant mismatch");
    steps.push(mStep(`x = ${frPlain(root)}:`, [`${frTex(pEval(R, root))} = ${eq(cof, F(1)) ? "" : `${frTex(cof)}`}${top.letter}`, ` \\Rightarrow ${top.letter} = ${frTex(val)}`]));
  });
  // the one constant the roots cannot reach (the single power of a repeated factor): let x = 0, giving an equation in every constant (A + B + C = …),
  // then use the two already found. (If a root were 0 that term would vanish, so another value of x is used.)
  terms.filter((t) => t.p < facs[t.fi].m).forEach((t) => {
    const mult = (u: PTerm, v: Fr): Fr => facs.reduce<Fr>((acc, f, j) => { const left = j === u.fi ? f.m - u.p : f.m; return mul(acc, powI(add(f.c, mul(f.d, v)), left)); }, F(1));
    const v = [0, 1, -1, 2, -2, 3, -3].map((x) => F(x)).find((x) => terms.every((u) => !isZero(mult(u, x))))!;
    const left = pEval(R, v);
    const known = terms.filter((u) => u !== t);
    const solved = div(sub(left, known.reduce<Fr>((acc, u) => add(acc, mul(mult(u, v), u.A)), F(0))), mult(t, v));
    if (!eq(solved, t.A)) throw new Error("binomial expansion: substitution mismatch");
    const join = (parts: string[]) => parts.map((q, i) => (i === 0 ? q : q.startsWith("-") ? ` - ${q.slice(1)}` : ` + ${q}`)).join("");
    const coefOf = (m2: Fr, body: string) => (eq(m2, F(1)) ? body : eq(m2, F(-1)) ? `-${body}` : `${frTex(m2)}${body}`);
    steps.push(mStep(`x = ${frPlain(v)}:`, [`${frTex(left)} = ${join(terms.map((u) => coefOf(mult(u, v), u.letter)))}`]));
    steps.push(mStep(`Use ${known.map((u) => `${u.letter} = ${frPlain(u.A)}`).join(" and ")}:`, [
      `${frTex(left)} = ${join(terms.map((u) => (u === t ? coefOf(mult(u, v), u.letter) : coefOf(mult(u, v), `\\left(${frTex(u.A)}\\right)`))))}`,
      ` \\Rightarrow ${t.letter} = ${frTex(t.A)}`,
    ]));
  });
  const pf = pfSum(raw);
  // one step per fraction: constant × (1 + kx)^-p, expanded
  const perTerm = terms.map((t) => termSeries(facs[t.fi], t, m));
  terms.forEach((t, i) => {
    const f = facs[t.fi]; const k = div(f.d, f.c); const kx = kxTex(k);
    const br = `\\left(1 ${k.n < 0 ? "-" : "+"} ${eq(absF(k), F(1)) ? "" : frAbsTex(k)}x\\right)^{-${t.p}}`;
    steps.push(mStep(`Expand ${terms.length > 1 ? `the ${["first", "second", "third"][i]} fraction` : "the fraction"}:`, [
      `${termTex(f, t)} = ${coefPre(perTerm[i].mult)}${br}`,
      ` = ${coefPre(perTerm[i].mult)}\\left(1 + ${termSubst(F(-t.p), 1, kx)}${m >= 2 ? ` + ${termSubst(F(-t.p), 2, kx)}` : ""}${m >= 3 ? " + \\dots" : ""}\\right)`,
      ` = ${polyTex(perTerm[i].full)}`,
    ]));
  });
  // collect: one line, each power's coefficients added
  const total: Fr[] = Array.from({ length: m + 1 }, (_, r) => perTerm.reduce<Fr>((acc, s2) => add(acc, s2.full[r]), r === 0 && Q ? Q : F(0)));
  const check = seriesDivide(N, D, m);
  if (total.some((c, r) => !eq(c, check[r]))) throw new Error("binomial expansion: series mismatch");
  const sums = total.map((_, r) => {
    const parts = [...(r === 0 && Q ? [Q] : []), ...perTerm.map((s2) => s2.full[r])];
    const inside = parts.map((p2, i) => (i === 0 ? frTex(p2) : ` ${p2.n < 0 ? "-" : "+"} ${frAbsTex(p2)}`)).join("");
    return `\\left(${inside}\\right)${xPow(r)}`;
  });
  steps.push(mStep("Add like terms:", [...sums.map((t2, r) => (r === 0 ? t2 : ` + ${t2}`)), ` = ${polyTex(total)}`]));
  // range: each fraction's own, then the smaller
  const bounds = facs.map((f) => absF(div(f.c, f.d)));
  const bound = bounds.reduce((mn, b2) => (lt(b2, mn) ? b2 : mn), bounds[0]);
  const rows = facs.map((_f, j) => ({ label: modLt(bounds[j]), c: toNum(bounds[j]), plain: frPlain(bounds[j]) }));
  steps.push(withExtra(mStep("Each fraction needs |kx| < 1:", facs.map((f, j) => `${j ? ",\\ " : ""}${condTex(div(f.d, f.c), bounds[j])}`)), { kind: "binInterval", rows }));
  if (facs.length > 1) steps.push(withExtra(mStep("All must hold, so take the smaller:", [modLt(bound)]), { kind: "binInterval", rows, overlap: true }));
  void ask;
  return { steps, answer: total, bound, pf };
}

/** a polynomial as written on top of a fraction: a linear one constant first (3 − x), quadratics and above highest power first; series answers stay ascending */
const polyTexDesc = (p: Poly): string => {
  if (trimP(p).length <= 2) return polyTex(trimP(p));
  let out = "";
  for (let r = p.length - 1; r >= 0; r--) {
    const c = p[r];
    if (isZero(c)) continue;
    const body = r > 0 && Math.abs(c.n) === 1 && c.d === 1 ? xPow(r) : `${frAbsTex(c)}${xPow(r)}`;
    out += out === "" ? `${c.n < 0 ? "-" : ""}${body}` : ` ${c.n < 0 ? "-" : "+"} ${body}`;
  }
  return out === "" ? "0" : out;
};

function partialQuestion(level: DifficultyLevel, msv: Record<string, boolean>): AnyQuestion {
  const pools = PARTIAL_POOLS[level];
  const form = pools.find((p) => p.key === "denom") ? pickActive(msv, pools.find((p) => p.key === "denom")!.options) : level === "level2" ? "scaled" : "distinct";
  const numer = pools.find((p) => p.key === "numer") ? pickActive(msv, pools.find((p) => p.key === "numer")!.options) : "linear";
  const ask = pickActive(msv, pools.find((p) => p.key === "ask")!.options);
  const m = upToOf(pickActive(msv, pools.find((p) => p.key === "upTo")!.options));
  const raw = makePartial(level, form, numer);
  const { steps, answer, bound, pf } = partialWorking(raw, m, ask);
  const fx = `f(x) = \\dfrac{${polyTexDesc(raw.N)}}{${facsTex(raw.facs)}}`;
  const lines = [
    `(a) ${raw.improper ? `Express $${fx}$ as a constant plus partial fractions.` : `Express $${fx}$ in partial fractions.`}`,
    ask === "coef"
      ? `(b) Hence find the coefficient of $x^{${m}}$ in the expansion of $f(x)$.`
      : `(b) Hence expand $f(x)$ up to $x^{${m}}$.`,
    ...(ask === "range" ? ["(c) State the range of values of $x$ for which the expansion is valid."] : []),
  ];
  const expLatex = ask === "coef" ? frTex(answer[m]) : polyTex(answer);
  return {
    kind: "worded", lines,
    answer: ask === "coef" ? frPlain(answer[m]) : polyTex(answer),
    answerLatex: `${pf} \\;\\Rightarrow\\; ${expLatex}`,
    answerSuffix: ask === "range" ? `, ${rangeText(bound)}` : undefined,
    working: steps,
    key: `be-partial-${level}-${raw.facs.map((f) => `${frPlain(f.c)}_${frPlain(f.d)}_${f.m}`).join("-")}-${raw.N.map(frPlain).join(",")}-${m}-${ask}`,
    difficulty: level,
    _raw: raw,
  } as unknown as AnyQuestion;
}

// ── 3. Entry point used by the Binomial Expansion tool ────────

export const generatePartial = (level: DifficultyLevel, msv: Record<string, boolean>): AnyQuestion => partialQuestion(level, msv);
export const partialHelpers = { makePartial, partialWorking, numeratorOf, denomPoly, seriesDivide };
