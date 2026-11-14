// Dimensional Analysis: the question generators (specs/dimensional-analysis.md). Everything is drawn through Math.random and nothing is kept between
// calls (R45), and every question is built equations-first: the powers (or the dimensions) are chosen, the rest is computed from them once (R5).
// All maths in the question text, the options and the model answers is LaTeX between $…$ (see dimTex.ts); symbols are kept as plain characters in the data
// ("ρ", "α") and turned into TeX where they are written.
import {
  type Dim3, type DimEq, type Fr, type Formula, type Term, type Factor,
  LIBRARY, QBY, qDim, dimOf, dimAdd, dimSub, dimScale, dimEq, dimZero, BASE,
  fr, fadd, fneg, fzero, fint, ZERO, ONE,
  unitsDim, parseUnits, UNIT_BASE, baseUnits, solveLinear, rankOf, equationsFor, termDim, consistentDims, FORMULAS,
} from "./dim";
import { symTex, frTex, supTex, dimTex, dimPowTex, productTex, termTex, formulaTex, unitsTex, M, andTex } from "./dimTex";

// ── The question's data (what the picture and the working are drawn from) ───────────────────────────────────────────────────
type DimKind = "dimsName" | "dimsUnits" | "dimsExpr" | "dimsConst" | "consShow" | "consOdd" | "consMissing" | "consPick" | "powers";
export interface DimRow {
  /** the row's label as TeX ("[\rho]", "\mathrm{kg}", "at^{2}") */
  sym: string;
  name: string;
  dim: Dim3;
  /** the question gives these dimensions (otherwise the student recalls them and the working reveals them) */
  given: boolean;
  /** a factor's power in a product (dimension questions) */
  exp?: Fr;
  /** a factor's unknown power in a model: the symbol (α, β, γ) */
  power?: string;
  role: "target" | "factor" | "result" | "term";
}
/** a circled answer: dimensions or a formula as TeX; `why` names the slip a wrong one makes */
interface DimOption { text: string; correct: boolean; why: string }
export interface DimProblemData {
  kind: DimKind;
  rows: DimRow[];
  /** the power symbols of a model, in order (α, β, γ; n for a missing power) */
  unknowns: string[];
  answerPowers: Fr[];
  eqs: DimEq[];
  ask: "find" | "zero" | "cannot";
  /** "zero": which power the question asks to show is 0 */
  zeroIdx?: number;
  /** the model or formula as TeX */
  formula?: string;
  /** dimension questions: the answer */
  answerDim?: Dim3;
  options?: DimOption[];
  /** dimsName: the definition in words; dimsExpr: "root"; dimsConst: "denominator" when the constant divides */
  defText?: string;
  /** consistency: which row is the odd term out, and the power to find */
  oddIdx?: number;
  missing?: { sym: string; value: Fr; coef: Dim3; rest: Dim3; target: Dim3 };
  /** consistency: how each term's dimensions are worked out, a TeX line per row */
  calcs?: string[];
  /** a circled formula's check, a line per option (prose with maths) */
  notes?: string[];
  /** a circled formula's check as written, a TeX line per option ("A: L, L, LT^{-1}: not consistent") */
  checks?: string[];
  /** dimsConst: what the constant is (a library quantity with the same dimensions), for "what k represents" */
  represents?: string;
  /** the wording of the situation (worded and named models) */
  context?: string;
}
/** `prompt` and `answerText` are prose with maths between $…$ */
export interface DimQuestion { data: DimProblemData; prompt: string; answerText: string }

// ── Random helpers ───────────────────────────────────────────────────────────
const rint = (a: number, b: number): number => a + Math.floor(Math.random() * (b - a + 1));
const pickOne = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];
const shuffle = <T,>(xs: readonly T[]): T[] => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = rint(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sample = <T,>(xs: readonly T[], n: number): T[] => shuffle(xs).slice(0, n);
const maybe = (p: number): boolean => Math.random() < p;

const LETTERS = ["α", "β", "γ"];
const nameOf = (id: string): string => QBY[id].name;
const joinAnd = (xs: string[]): string => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const the = (name: string): string => `${/^the /.test(name) ? "" : "the "}${name}`;
const rowFor = (id: string, over: Partial<DimRow> = {}): DimRow => ({ sym: symTex(QBY[id].sym), name: QBY[id].name, dim: qDim(id), given: false, role: "factor", ...over });

// ── Wrong answers to a circled dimension, each naming its slip ──────────────────────────────────────────────────────────────
export function distractors(d: Dim3, n = 3): DimOption[] {
  const out: DimOption[] = [];
  const seen = new Set([dimTex(d)]);
  const add = (cand: Dim3, why: string) => {
    if (dimZero(cand) || cand.some((e) => Math.abs(e[0] / e[1]) > 4)) return;
    const k = dimTex(cand);
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ text: k, correct: false, why });
  };
  const cands: Array<[Dim3, string]> = [];
  d.forEach((e, i) => {
    if (fzero(e)) { cands.push([d.map((x, j) => (j === i ? ONE : x)) as unknown as Dim3, `an extra factor of ${BASE[i]}`]); return; }
    cands.push([d.map((x, j) => (j === i ? fneg(x) : x)) as unknown as Dim3, `the sign of the power of ${BASE[i]} is wrong`]);
    cands.push([d.map((x, j) => (j === i ? fadd(x, ONE) : x)) as unknown as Dim3, `the power of ${BASE[i]} is one too big`]);
    cands.push([d.map((x, j) => (j === i ? fadd(x, fneg(ONE)) : x)) as unknown as Dim3, `the power of ${BASE[i]} is one too small`]);
    cands.push([d.map((x, j) => (j === i ? ZERO : x)) as unknown as Dim3, `a factor of ${BASE[i]} is missing`]);
  });
  for (const [c, w] of shuffle(cands)) { if (out.length >= n) break; add(c, w); }
  return out;
}
/** the right option and the slips, in a random order, as a circle-your-answer list */
const circleList = (correct: string, wrong: DimOption[]): DimOption[] => shuffle([{ text: correct, correct: true, why: "" }, ...wrong]);
const circleLine = (opts: DimOption[]): string => `Circle your answer: ${opts.map((o) => M(o.text)).join("   ")}`;

/** "Here $\rho$ is the density and $v$ is the speed." */
const symLine = (rows: Array<{ sym: string; name: string }>): string => {
  const seen = new Set<string>();
  const parts = rows.filter((r) => (seen.has(r.sym) ? false : (seen.add(r.sym), true))).map((r) => `${M(symTex(r.sym))} is ${the(r.name)}`);
  return parts.length ? `Here ${joinAnd(parts)}.` : "";
};

// ── Find the dimensions ──────────────────────────────────────────────────────────────────────────────────────────────────────
const NAME_L1 = ["speed", "acc", "area", "vol", "dens", "force", "weight", "mom", "imp", "energy", "power", "freq", "linmass"];
const NAME_L2 = ["press", "omega", "moment", "inertia", "stiff", "surf", "visc", "G"];
const UNIT_NAMES: Record<string, string> = { N: "newton, N = kg m s⁻²", J: "joule, J = N m", W: "watt, W = J s⁻¹", Pa: "pascal, Pa = N m⁻²", Hz: "hertz, Hz = s⁻¹" };

/** the dimensions of a named quantity, worked out from its definition (or from its units) */
export function genDimsName(level: number, units: boolean, circle: boolean): DimQuestion {
  // from units: only quantities whose units are more than one symbol (not "F is measured in N"), and base units only at Level 1
  const manyUnits = (i: string) => parseUnits(QBY[i].units!).length >= 2;
  return genDimsNameFor(pickOne(units ? (level === 1 ? NAME_L1.filter((i) => manyUnits(i) && !QBY[i].units!.match(/[NJWP]/)) : [...NAME_L2, ...NAME_L1].filter(manyUnits)) : level === 1 ? NAME_L1 : NAME_L2), units, circle);
}

/** the dimensions of a named quantity (a chosen one), from its definition or its units */
export function genDimsNameFor(id: string, units: boolean, circle: boolean): DimQuestion {
  const q = QBY[id];
  const answerDim = qDim(id);
  const ans = dimTex(answerDim);
  const resultSym = `[${symTex(q.sym)}]`;
  let rows: DimRow[];
  let prompt: string;
  let kind: DimKind;
  if (units) {
    kind = "dimsUnits";
    const toks = parseUnits(q.units!);
    rows = [{ sym: resultSym, name: q.name, dim: answerDim, given: false, role: "result" },
      ...toks.map(([u, p]): DimRow => ({ sym: `\\mathrm{${u}}`, name: UNIT_BASE[u] ?? UNIT_NAMES[u] ?? u, dim: unitsDim(u), given: false, exp: fr(p), role: "factor" }))];
    prompt = `${M(symTex(q.sym))} is measured in ${M(unitsTex(q.units!))}. State the dimensions of ${q.name}.`;
  } else {
    kind = "dimsName";
    rows = [{ sym: resultSym, name: q.name, dim: answerDim, given: false, role: "result" },
      ...q.def!.map(([f, p]): DimRow => rowFor(f, { exp: fr(p) }))];
    prompt = `State the dimensions of ${q.name}.`;
  }
  const options = circle ? circleList(ans, distractors(answerDim)) : undefined;
  if (options) prompt += ` ${circleLine(options)}`;
  return { data: { kind, rows, unknowns: [], answerPowers: [], eqs: [], ask: "find", answerDim, options, defText: q.defText, represents: q.name }, prompt, answerText: M(`${resultSym} = ${ans}`) };
}

const INGREDIENTS = ["len", "time", "mass", "speed", "acc", "grav", "area", "vol", "dens", "force", "mom", "energy", "power", "press", "omega", "stiff", "inertia", "linmass", "visc", "G", "hgt", "rad", "dep"];

/** the dimensions of an expression in named quantities */
export function genDimsExpr(level: number, circle: boolean): DimQuestion {
  for (let guard = 0; guard < 200; guard++) {
    const n = level === 1 ? 2 : 3;
    const ids = sample(INGREDIENTS, n);
    if (new Set(ids.map((i) => QBY[i].sym)).size < n) continue;
    const root = level === 2 && maybe(0.3);
    const exps: Fr[] = ids.map(() => fr(level === 1 ? pickOne([1, 1, -1]) : root ? pickOne([1, -1]) : pickOne([1, 2, -1, -2])));
    if (exps.every((e) => e[0] > 0) && level === 1 && maybe(0.5)) exps[n - 1] = fneg(exps[n - 1]); // mostly a product and a quotient
    if (ids.filter((_, i) => exps[i][0] < 0).length === n) continue;
    const rows: DimRow[] = ids.map((id, i) => rowFor(id, { exp: exps[i] }));
    let dim = rows.reduce<Dim3>((acc, r) => dimAdd(acc, dimScale(r.dim, r.exp!)), dimOf(0, 0, 0));
    if (root) { dim = dimScale(dim, fr(1, 2)); if (!dim.every(fint)) continue; }
    if (dimZero(dim)) continue;
    const text = productTex(ids.map((id, i) => ({ sym: QBY[id].sym, p: exps[i] })), root);
    const ans = dimTex(dim);
    const options = circle ? circleList(ans, distractors(dim)) : undefined;
    const prompt = `${symLine(ids.map((id) => ({ sym: QBY[id].sym, name: QBY[id].name })))} Find the dimensions of ${M(text)}.${options ? ` ${circleLine(options)}` : ""}`;
    return { data: { kind: "dimsExpr", rows: [{ sym: `[${text}]`, name: "the expression", dim, given: false, role: "result" }, ...rows], unknowns: [], answerPowers: [], eqs: [], ask: "find", answerDim: dim, options, formula: text, defText: root ? "root" : undefined }, prompt, answerText: M(`[${text}] = ${ans}`) };
  }
  throw new Error("no expression");
}

// the relations the constant questions are drawn from: a formula in words (maths between $…$), the quantity on the left, the other factors, and the power of the constant
interface ConstRel { text: string; lhs: string; lhsSym: string; others: Factor[]; kSym: string; kName: string; kexp: number }
const CR = (text: string, lhs: string, lhsSym: string, others: Array<[string, string, number]>, kSym: string, kName: string, kexp = 1): ConstRel =>
  ({ text, lhs, lhsSym, others: others.map(([sym, q, p]) => ({ sym, q, p: fr(p) })), kSym, kName, kexp });
export const CONST_RELATIONS: ConstRel[] = [
  CR("The elastic energy $E$ stored in a stretched spring is given by $E = \\frac{1}{2}kx^{2}$, where $x$ is the extension of the spring.", "energy", "E", [["x", "ext", 2]], "k", "the stiffness of the spring"),
  CR("The magnitude of the gravitational force $F$ between two bodies of masses $m_1$ and $m_2$ a distance $d$ apart is $F = \\frac{Gm_1m_2}{d^{2}}$, where $G$ is a constant.", "force", "F", [["m₁", "mass", 1], ["m₂", "mass", 1], ["d", "dep", -2]], "G", "the gravitational constant"),
  CR("The kinetic energy $E$ of a rotating body is $E = \\frac{1}{2}I\\omega^{2}$, where $\\omega$ is its angular speed and $I$ is a quantity called the moment of inertia.", "energy", "E", [["ω", "omega", 2]], "I", "the moment of inertia"),
  CR("A body moving slowly through a fluid at speed $v$ experiences a resistance $F = kv$, where $k$ is a constant.", "force", "F", [["v", "speed", 1]], "k", "a resistance constant"),
  CR("A body moving quickly through air at speed $v$ experiences a resistance $F = kv^{2}$, where $k$ is a constant.", "force", "F", [["v", "speed", 2]], "k", "a resistance constant"),
  CR("The viscous force $F$ on a plate of area $A$ moving at speed $v$ at a distance $d$ from a fixed plate is $F = \\frac{\\eta Av}{d}$, where $\\eta$ is the viscosity.", "force", "F", [["A", "area", 1], ["v", "speed", 1], ["d", "dep", -1]], "η", "the viscosity"),
  CR("A particle moves in a circle of radius $r$ with speed $v = r\\omega$, where $\\omega$ is its angular speed.", "speed", "v", [["r", "rad", 1]], "ω", "angular speed"),
  CR("The friction force $F$ between two surfaces is $F = \\mu R$, where $R$ is the normal reaction and $\\mu$ is the coefficient of friction.", "force", "F", [["R", "force", 1]], "μ", "the coefficient of friction"),
  CR("A formula for the wavelength $w$ of a deep water wave is $w = \\frac{gt^{2}}{k}$, where $g$ is the acceleration due to gravity and $t$ is the time between waves.", "len", "w", [["g", "grav", 1], ["t", "time", 2]], "k", "a constant", -1),
  CR("The height $y$ of a ball above its point of projection is $y = x - \\frac{kx^{2}}{u^{2}}$, where $x$ is the horizontal distance and $u$ is the speed of projection.", "len", "y", [["x", "len", 2], ["u", "speed", -2]], "k", "a constant"),
  CR("The surface tension $\\sigma$ of a liquid film is defined by $F = \\sigma l$, where $F$ is the force along an edge of length $l$.", "force", "F", [["l", "len", 1]], "σ", "the surface tension", 1),
];
/** [k] from  lhs = k^kexp · Π others */
export const constDim = (r: ConstRel): Dim3 => {
  const rest = r.others.reduce<Dim3>((acc, x) => dimAdd(acc, dimScale(qDim(x.q), x.p)), dimOf(0, 0, 0));
  return dimScale(dimSub(qDim(r.lhs), rest), fr(r.kexp)); // kexp is 1 or −1, so dividing and multiplying agree
};

/** the dimensions of a constant in a formula */
export function genDimsConst(circle: boolean): DimQuestion { return genDimsConstFor(pickOne(CONST_RELATIONS), circle); }
export function genDimsConstFor(rel: ConstRel, circle: boolean): DimQuestion {
  const kd = constDim(rel);
  const ans = dimTex(kd);
  const kSym = symTex(rel.kSym);
  const rows: DimRow[] = [
    { sym: `[${kSym}]`, name: rel.kName, dim: kd, given: false, role: "result" },
    { sym: symTex(rel.lhsSym), name: nameOf(rel.lhs), dim: qDim(rel.lhs), given: false, role: "target" },
    ...rel.others.map((x): DimRow => ({ sym: symTex(x.sym), name: nameOf(x.q), dim: qDim(x.q), given: false, exp: x.p, role: "factor" })),
  ];
  const repr = LIBRARY.find((q) => dimEq(qDim(q.id), kd) && q.id !== "hgt");
  const options = circle ? circleList(ans, distractors(kd)) : undefined;
  const prompt = `${rel.text} Find the dimensions of ${M(kSym)}.${options ? ` ${circleLine(options)}` : ""}`;
  return {
    data: { kind: "dimsConst", rows, unknowns: [], answerPowers: [], eqs: [], ask: "find", answerDim: kd, options, defText: rel.kexp < 0 ? "denominator" : undefined, represents: repr && !dimZero(kd) ? repr.name : undefined, formula: kSym, context: rel.text },
    prompt,
    answerText: dimZero(kd) ? `${M(`[${kSym}] = 1`)} (dimensionless)` : M(`[${kSym}] = ${ans}`),
  };
}

// ── Check consistency ────────────────────────────────────────────────────────────────────────────────────────────────────────
const cloneTerm = (t: Term): Term => ({ ...t, f: t.f.map((x) => ({ ...x })) });
const cloneFormula = (f: Formula): Formula => ({ ...f, lhs: f.lhs.map(cloneTerm), rhs: f.rhs.map(cloneTerm) });
const SWAPS = ["time", "mass", "len", "speed", "acc"];

/** break one term (never in a way that leaves it with the same dimensions): returns the broken formula and which term (index into lhs then rhs) was changed */
export function breakFormula(f: Formula): { formula: Formula; at: number; how: string } | null {
  for (let guard = 0; guard < 40; guard++) {
    const g = cloneFormula(f);
    const all = [...g.lhs, ...g.rhs];
    const at = rint(0, all.length - 1);
    const t = all[at];
    const fi = rint(0, t.f.length - 1);
    const x = t.f[fi];
    let how: string;
    const mode = rint(0, 2);
    if (mode === 0 && fint(x.p)) {
      const np = fadd(x.p, fr(pickOne([1, -1])));
      if (fzero(np)) continue;
      x.p = np;
      how = `the power of ${x.sym} is wrong`;
    } else if (mode === 1) {
      const id = pickOne(SWAPS.filter((i) => i !== x.q && !dimEq(qDim(i), qDim(x.q))));
      const sym = QBY[id].sym;
      if (all.some((tt) => tt.f.some((y) => y.sym === sym && y.q !== id))) continue;
      t.f[fi] = { sym, q: id, p: x.p };
      how = `${x.sym} is replaced by ${sym}`;
    } else {
      if (t.f.length < 2) continue;
      t.f.splice(fi, 1);
      how = `a factor ${x.sym} is missing`;
    }
    const { ok, dims } = consistentDims(g);
    if (ok || dims.some((d) => d.some((e) => Math.abs(e[0] / e[1]) > 6))) continue;
    const base = [...f.lhs, ...f.rhs].map(termDim);
    // exactly the one term differs from the others
    const odd = dims.map((d, i) => (dimEq(d, base[i]) ? -1 : i)).filter((i) => i >= 0);
    if (odd.length !== 1 || odd[0] !== at) continue;
    return { formula: g, at, how };
  }
  return null;
}

const termsOf = (f: Formula): Term[] => [...f.lhs, ...f.rhs];
const factorQuantities = (f: Formula): Array<{ sym: string; name: string }> => {
  const seen = new Map<string, string>();
  for (const t of termsOf(f)) for (const x of t.f) if (!seen.has(x.sym)) seen.set(x.sym, QBY[x.q].name);
  return [...seen].map(([sym, name]) => ({ sym, name }));
};
/** "[at^{2}] = [a][t]^{2} = LT^{-2} \times T^{2} = L": the term in brackets, then each factor's dimensions, then the product */
function termCalc(t: Term): string {
  const br = t.f.map((x) => `[${symTex(x.sym)}]${supTex(x.p)}`).join("");
  const parts = t.f.map((x) => dimPowTex(qDim(x.q), x.p));
  return `[${termTex(t)}] = ${br} = ${parts.join(" \\times ")} = ${dimTex(termDim(t))}${t.num ? "\\quad \\text{(the number has no dimensions)}" : ""}`;
}
const termCalcs = (f: Formula): string[] => termsOf(f).map(termCalc);
const termRows = (f: Formula): DimRow[] => termsOf(f).map((t) => ({ sym: termTex(t), name: "", dim: termDim(t), given: false, role: "term" }));

export function genConsistent(level: number, ask: "show" | "odd" | "missing" | "pick", numbers: boolean): DimQuestion {
  const plain = (f: Formula) => numbers || !termsOf(f).some((t) => t.num || t.f.some((x) => !fint(x.p)));
  const pool = FORMULAS.filter((f) => (level === 1 ? f.level === 1 : true) && plain(f));
  const base = pickOne(pool.length ? pool : FORMULAS.filter((f) => f.level === 1));
  if (ask === "show") {
    const dims = termsOf(base).map(termDim);
    return { data: { kind: "consShow", rows: termRows(base), unknowns: [], answerPowers: [], eqs: [], ask: "find", formula: formulaTex(base), answerDim: dims[0], calcs: termCalcs(base) }, prompt: `${symLine(factorQuantities(base))} Show that the formula ${M(formulaTex(base))} is dimensionally consistent.`, answerText: `every term has dimensions ${M(dimTex(dims[0]))}` };
  }
  if (ask === "odd") {
    // "one term differs from the others" needs at least three terms to mean anything
    const three = FORMULAS.filter((f) => termsOf(f).length >= 3 && plain(f));
    const oddBase = pickOne(three.length ? three : FORMULAS.filter((f) => termsOf(f).length >= 3));
    for (let g = 0; g < 40; g++) {
      const b = breakFormula(oddBase);
      if (!b) continue;
      const ts = termsOf(b.formula);
      const letters = ["A", "B", "C", "D", "E"];
      return { data: { kind: "consOdd", rows: termRows(b.formula), unknowns: [], answerPowers: [], eqs: [], ask: "find", formula: formulaTex(b.formula), oddIdx: b.at, calcs: termCalcs(b.formula) }, prompt: `${symLine(factorQuantities(b.formula))} In the formula ${M(formulaTex(b.formula))} one term does not have the same dimensions as the others. Which term is it? (${ts.map((t, i) => `${letters[i]}: ${M(termTex(t))}`).join(", ")})`, answerText: `${letters[b.at]}: ${M(termTex(ts[b.at]))}` };
    }
    return genConsistent(level, "show", numbers);
  }
  if (ask === "missing") {
    for (let g = 0; g < 60; g++) {
      const f = cloneFormula(base);
      const all = termsOf(f);
      const t = pickOne(all);
      const cand = t.f.filter((x) => fint(x.p) && !fzero(x.p) && !dimZero(qDim(x.q)));
      if (!cand.length || all.length < 2) continue;
      const x = pickOne(cand);
      const value = x.p;
      const idx = all.indexOf(t);
      // the power becomes n; the other terms fix it
      const over = (y: Factor): string | null => (y === x ? `${symTex(y.sym)}^{n}` : null);
      const formula = formulaTex(f, over);
      const coef = qDim(x.q);
      const rest = dimSub(termDim(t), dimScale(coef, x.p));
      const targetDim = termDim(all.find((_, i) => i !== idx)!);
      return { data: { kind: "consMissing", rows: termRows(f), unknowns: ["n"], answerPowers: [value], eqs: [], ask: "find", formula, oddIdx: idx, missing: { sym: x.sym, value, coef, rest, target: targetDim }, calcs: termCalcs(f) }, prompt: `${symLine(factorQuantities(base))} The formula ${M(formula)} is dimensionally consistent. Find the value of ${M("n")}.`, answerText: M(`n = ${frTex(value)}`) };
    }
    return genConsistent(level, "show", numbers);
  }
  // pick: one consistent formula among four
  const wrong: Formula[] = [];
  const seen = new Set([formulaTex(base)]);
  for (let g = 0; g < 80 && wrong.length < 3; g++) {
    const b = breakFormula(base);
    if (!b) continue;
    const s = formulaTex(b.formula);
    if (seen.has(s)) continue;
    seen.add(s);
    wrong.push(b.formula);
  }
  if (wrong.length < 3) return genConsistent(level, "show", numbers);
  const opts = shuffle<DimOption>([{ text: formulaTex(base), correct: true, why: "" }, ...wrong.map((w) => ({ text: formulaTex(w), correct: false, why: "a term has different dimensions" }))]);
  const all = new Map<string, string>();
  [base, ...wrong].forEach((f) => factorQuantities(f).forEach((x) => all.set(x.sym, x.name)));
  const noteOf = (f: Formula): string => { const c = consistentDims(f); return `the terms have dimensions ${c.dims.map((d) => M(dimTex(d))).join(", ")}: ${c.ok ? "consistent" : "not consistent"}`; };
  const wrongFormulas = new Map(wrong.map((w) => [formulaTex(w), w]));
  const notes = opts.map((o) => noteOf(o.correct ? base : wrongFormulas.get(o.text)!));
  const checkOf = (f: Formula, i: number): string => { const c = consistentDims(f); return `\\text{${"ABCD"[i]}: }${c.dims.map(dimTex).join(",\\ ")}\\quad \\text{${c.ok ? "consistent" : "not consistent"}}`; };
  const checks = opts.map((o, i) => checkOf(o.correct ? base : wrongFormulas.get(o.text)!, i));
  return { data: { kind: "consPick", rows: termRows(base), unknowns: [], answerPowers: [], eqs: [], ask: "find", formula: formulaTex(base), options: opts, answerDim: termDim(termsOf(base)[0]), notes, checks, calcs: termCalcs(base) }, prompt: `${symLine([...all].map(([sym, name]) => ({ sym, name })))} One of these formulas is dimensionally consistent. ${circleLine(opts)}`, answerText: M(formulaTex(base)) };
}

// ── Find the powers ──────────────────────────────────────────────────────────────────────────────────────────────────────────
/** the worked situations, each checked by the independent solver in the test (these are documentation, not data the tool trusts). A factor is
 *  [quantity id, power numerator, power denominator, symbol if the situation names it differently from the library]. */
export interface Situation { id: string; ctx: string; target: string; factors: Array<[string, number, number, string?]>; sym?: string }
const S = (id: string, ctx: string, target: string, factors: Array<[string, number, number, string?]>, sym?: string): Situation => ({ id, ctx, target, factors, sym });
export const SITUATIONS: Situation[] = [
  S("pendulum", "The time $t$ for one swing of a simple pendulum is thought to depend on its mass $m$, its length $l$ and the acceleration due to gravity $g$.", "time", [["mass", 0, 1], ["len", 1, 2], ["grav", -1, 2]]),
  S("pendulum2", "The time $t$ for one swing of a simple pendulum is thought to depend only on its length $l$ and the acceleration due to gravity $g$.", "time", [["len", 1, 2], ["grav", -1, 2]]),
  S("spring2", "The time $t$ for one oscillation of a mass $m$ on a spring of stiffness $\\kappa$ is thought to depend only on $m$ and $\\kappa$.", "time", [["mass", 1, 2], ["stiff", -1, 2]]),
  S("spring3", "A particle of mass $m$ hangs from a spring of stiffness $\\kappa$ and oscillates vertically. The time $t$ for one oscillation is thought to depend on $m$, $g$ and $\\kappa$.", "time", [["mass", 1, 2], ["grav", 0, 1], ["stiff", -1, 2]]),
  S("orbit", "A satellite orbits the Earth, of mass $m$, at radius $r$. The time $t$ for one orbit is thought to depend on $r$, on $G$ and on $m$.", "time", [["rad", 3, 2], ["G", -1, 2], ["mass", -1, 2]]),
  S("fall", "A ball is dropped from rest from a height $h$. Its speed $v$ on reaching the ground is thought to depend only on $h$ and the acceleration due to gravity $g$.", "speed", [["grav", 1, 2], ["hgt", 1, 2]]),
  S("tank", "A tank is full of liquid of density $\\rho$ to a height $h$, with a small hole in its base. The speed $v$ at which the liquid escapes is thought to depend on $g$, $h$ and $\\rho$.", "speed", [["grav", 1, 2], ["hgt", 1, 2], ["dens", 0, 1]]),
  S("sea", "The speed $v$ of a wave on the surface of the sea is thought to depend on the depth $d$ of the sea, the density $\\rho$ of the water and the acceleration due to gravity $g$.", "speed", [["dep", 1, 2], ["dens", 0, 1], ["grav", 1, 2]]),
  S("circ", "A satellite of the Earth, of mass $m$, moves in a circle of radius $r$. Its speed $v$ is thought to depend on $G$, $m$ and $r$.", "speed", [["G", 1, 2], ["mass", 1, 2], ["rad", -1, 2]]),
  S("drag", "A sphere of radius $r$ falls through a fluid of density $\\rho$ at speed $v$. The resistance force $F$ is thought to depend on $\\rho$, $r$ and $v$.", "force", [["dens", 1, 1], ["rad", 2, 1], ["speed", 2, 1]]),
  S("bead", "A bead of mass $m$ moves along a smooth wire through a fluid of density $\\rho$. When its speed is $v$, its acceleration $a$ is thought to depend on $m$, $\\rho$ and $v$.", "acc", [["mass", -1, 3], ["dens", 1, 3], ["speed", 2, 1]]),
  S("disc", "A disc of mass $m$ and radius $r$ rotates with angular speed $\\omega$. Its kinetic energy $E$ is thought to depend on $m$, $r$ and $\\omega$.", "energy", [["mass", 1, 1], ["rad", 2, 1], ["omega", 2, 1]]),
  S("compound", "The time $t$ for one swing of a compound pendulum is thought to depend on its moment of inertia $I$, its weight $W$ and the distance $h$ of its centre of mass from the pivot.", "time", [["inertia", 1, 2], ["weight", -1, 2], ["hgt", -1, 2]]),
  S("string", "The time $t$ for a single vibration of a taut string is thought to depend on its length $l$, the tension $F$ in it and its mass per unit length $q$.", "time", [["len", 1, 1], ["force", -1, 2], ["linmass", 1, 2]]),
  S("lifetime", "The lifetime $t$ of a planet is thought to depend on its mass $m$, its radius $r$ and the gravitational constant $G$.", "time", [["mass", -1, 2], ["rad", 3, 2], ["G", -1, 2]]),
  S("bounce", "A ball of mass $m$ hits the floor at speed $u$ and bounces to a height $h$. The height $h$ is thought to depend on $m$, $u$ and $g$.", "hgt", [["mass", 0, 1], ["speed", 2, 1, "u"], ["grav", -1, 1]]),
  S("fallm", "A bead of mass $m$ is released from rest at a height $h$. Its speed $v$ on reaching the ground is thought to depend on $m$, $g$ and $h$.", "speed", [["mass", 0, 1], ["grav", 1, 2], ["hgt", 1, 2]]),
  S("tube", "Liquid of density $\\rho$ oscillates in a U-tube. The time $t$ for one oscillation is thought to depend on $\\rho$, the length $l$ of the liquid column and $g$.", "time", [["dens", 0, 1], ["len", 1, 2], ["grav", -1, 2]]),
  S("discw", "A disc of mass $m$ and radius $r$ has kinetic energy $E$. Its angular speed $\\omega$ is thought to depend on $E$, $m$ and $r$.", "omega", [["energy", 1, 2], ["mass", -1, 2], ["rad", -1, 1]]),
];
interface SituationDims { target: Dim3; factors: Dim3[] }
export const situationDims = (s: Situation): SituationDims => ({ target: qDim(s.target), factors: s.factors.map(([id]) => qDim(id)) });
const fmulNum = (e: Fr): number => e[0] / e[1];
const sitLevel = (s: Situation): 1 | 2 | 3 => {
  if (s.factors.length === 2) return 1;
  const ex = s.factors.map(([, n, d]) => fr(n, d));
  const maxDen = Math.max(...ex.map((e) => e[1]));
  return maxDen === 1 || (maxDen === 2 && ex.every((e) => Math.abs(fmulNum(e)) <= 1)) ? 2 : 3;
};
export const situationsAtLevel = (level: number, zero = false): Situation[] =>
  SITUATIONS.filter((s) => sitLevel(s) === level && (!zero || s.factors.some(([, n]) => n === 0)));

const ING_POW = ["len", "time", "mass", "speed", "acc", "dens", "force", "mom", "energy", "power", "press", "omega", "stiff", "inertia", "linmass", "visc", "G"];
const TARGETS = ["time", "speed", "acc", "force", "energy", "power", "press", "len", "omega", "mom"];

const goodExps = (xs: Fr[], level: number, ask: string): boolean => {
  if (xs.some((e) => Math.abs(fmulNum(e)) > 3 || (e[1] !== 1 && e[1] !== 2 && e[1] !== 3))) return false;
  const nonint = xs.some((e) => !fint(e));
  const zeros = xs.filter(fzero).length;
  if (level === 1) return xs.length === 2 && !nonint && zeros === 0 && xs.every((e) => Math.abs(fmulNum(e)) <= 2);
  if (ask === "zero") { if (zeros !== 1) return false; } else if (zeros > 1) return false;
  if (level === 2) return !nonint || xs.every((e) => e[1] <= 2 && Math.abs(fmulNum(e)) <= 1);
  return nonint;
};
/** a column of the dimension matrix with one power in it: the system has an equation that gives a power directly */
const hasDirectEq = (factors: Dim3[]): boolean => [0, 1, 2].some((c) => factors.filter((d) => !fzero(d[c])).length === 1);

function modelRows(target: { sym: string; name: string; dim: Dim3 }, facs: Array<{ sym: string; name: string; dim: Dim3 }>, given: boolean, syms: string[]): DimRow[] {
  return [
    { sym: symTex(target.sym), name: target.name, dim: target.dim, given, role: "target" },
    ...facs.map((f, i): DimRow => ({ sym: symTex(f.sym), name: f.name, dim: f.dim, given, power: syms[i], role: "factor" })),
  ];
}
/** "t = k\,m^{\alpha}\,l^{\beta}": the model as TeX (`prop` writes ∝ for a student's proportionality) */
export const modelTex = (target: string, facs: Array<{ sym: string }>, syms: string[], prop = false): string =>
  `${symTex(target)} ${prop ? "\\propto" : "="} ${prop ? "" : "k\\,"}${facs.map((f, i) => `${symTex(f.sym)}^{${symTex(syms[i])}}`).join("\\,")}`;
/** "$\alpha = \frac{1}{2},\ \beta = -\frac{1}{2}$" */
const eqsAnswer = (v: Fr[], syms: string[]): string => M(v.map((x, i) => `${symTex(syms[i])} = ${frTex(x)}`).join(",\\ "));

interface PowersOpts { context: "none" | "named" | "worded"; ask: "find" | "zero" | "cannot"; given: "dims" | "units" }

/** a question about one of the worked situations; `drop` leaves one quantity out of the model (the student who thinks it does not matter) */
export function powersFromSituation(sit: Situation, o: { ask?: "find" | "zero"; given?: "dims" | "units"; drop?: number } = {}): DimQuestion {
  const keep = sit.factors.map((_, i) => i).filter((i) => i !== o.drop);
  const facsRaw = keep.map((i) => sit.factors[i]);
  const n = facsRaw.length;
  const syms = LETTERS.slice(0, n);
  const exps = facsRaw.map(([, nn, d]) => fr(nn, d));
  const tq = QBY[sit.target];
  const tsym = sit.sym ?? tq.sym;
  const facs = facsRaw.map(([id, , , s]) => ({ sym: s ?? QBY[id].sym, name: QBY[id].name, dim: qDim(id) }));
  const target = qDim(sit.target);
  const model = modelTex(tsym, facs, syms);
  const zeroIdx = o.ask === "zero" ? exps.findIndex(fzero) : -1;
  const rows = modelRows({ sym: tsym, name: tq.name, dim: target }, facs, false, syms);
  const eqs = equationsFor(target, facs.map((f) => f.dim));
  const unitsLine = o.given === "units"
    ? ` ${[{ sym: tsym, id: sit.target }, ...facsRaw.map(([id, , , s]) => ({ sym: s ?? QBY[id].sym, id }))].filter((x) => QBY[x.id].units).map((x) => `${M(symTex(x.sym))} is measured in ${M(unitsTex(QBY[x.id].units!))}`).join(", ")}.`
    : "";
  const tail = zeroIdx >= 0
    ? `Show that ${M(`${symTex(syms[zeroIdx])} = 0`)} and find the values of ${andTex(syms.filter((_, i) => i !== zeroIdx))}.`
    : `Use dimensional analysis to find the values of ${andTex(syms)}.`;
  return {
    data: { kind: "powers", rows, unknowns: syms, answerPowers: exps, eqs, ask: zeroIdx >= 0 ? "zero" : "find", zeroIdx: zeroIdx >= 0 ? zeroIdx : undefined, formula: model, context: sit.ctx },
    prompt: `${sit.ctx}${unitsLine} It is suggested that ${M(model)}, where ${M("k")} is a dimensionless constant and ${andTex(syms)} are constants. ${tail}`,
    answerText: eqsAnswer(exps, syms),
  };
}

export function genPowers(level: number, o: PowersOpts): DimQuestion {
  const unitsGiven = o.given === "units";
  // an inconsistent model: two quantities that cannot make the target
  if (o.ask === "cannot") {
    for (let g = 0; g < 300; g++) {
      const ids = sample(ING_POW, 2);
      const facs = ids.map((i) => ({ sym: QBY[i].sym, name: QBY[i].name, dim: qDim(i) }));
      if (new Set(facs.map((f) => f.sym)).size < 2) continue;
      const cols = ids.map(qDim);
      if (rankOf(cols) !== 2) continue;
      const tid = pickOne(TARGETS.filter((t) => !ids.includes(t)));
      const target = qDim(tid);
      const eqs = equationsFor(target, cols);
      const res = solveLinear(eqs.map((e) => e.coef), eqs.map((e) => e.rhs));
      if (res.status !== "none") continue;
      const syms = LETTERS.slice(0, 2);
      const model = modelTex("X", facs, syms);
      const rows = modelRows({ sym: "X", name: nameOf(tid), dim: target }, facs, !unitsGiven && o.context === "none", syms);
      const lead = o.context === "none"
        ? `${facs.map((f) => M(`[${symTex(f.sym)}] = ${dimTex(f.dim)}`)).join(", ")}. A quantity ${M("X")} has dimensions ${M(dimTex(target))}.`
        : symLine([{ sym: "X", name: nameOf(tid) }, ...facs]);
      return {
        data: { kind: "powers", rows, unknowns: syms, answerPowers: [], eqs, ask: "cannot", formula: model },
        prompt: `${lead} It is suggested that ${M(model)}, where ${M("k")} is a dimensionless constant and ${andTex(syms)} are constants. Show that no values of ${andTex(syms)} make this model dimensionally consistent.`,
        answerText: `no values of ${andTex(syms)} work: the equations contradict each other`,
      };
    }
    return genPowers(level, { ...o, ask: "find" });
  }
  const n = level === 1 ? 2 : 3;
  const syms = LETTERS.slice(0, n);
  // a worded situation
  if (o.context === "worded") {
    const pool = situationsAtLevel(level, o.ask === "zero");
    const sit = pool.length ? pickOne(pool) : pickOne(situationsAtLevel(level));
    return powersFromSituation(sit, { ask: o.ask === "zero" ? "zero" : "find", given: o.given });
  }
  // context-free (letters) or named quantities, built equations-first
  for (let guard = 0; guard < 1500; guard++) {
    const ids = sample(ING_POW, n);
    const facs = ids.map((i) => ({ sym: QBY[i].sym, name: QBY[i].name, dim: qDim(i) }));
    if (new Set(facs.map((f) => f.sym)).size < n) continue;
    const cols = ids.map(qDim);
    if (rankOf(cols) !== n) continue;
    let exps: Fr[];
    let target: Dim3;
    let tid: string | undefined;
    if (o.context === "named") {
      tid = pickOne(TARGETS.filter((t) => !ids.includes(t)));
      target = qDim(tid);
      const eqs0 = equationsFor(target, cols);
      const res = solveLinear(eqs0.map((e) => e.coef), eqs0.map((e) => e.rhs));
      if (res.status !== "unique") continue;
      exps = res.x;
    } else {
      const choices = level === 3 ? [-3, -2, -1, 0, 1, 2, 3].flatMap((k) => [fr(k), fr(k, 2), fr(k, 3)]) : [-3, -2, -1, 0, 1, 2, 3].map((k) => fr(k));
      exps = ids.map(() => pickOne(choices));
      target = cols.reduce<Dim3>((acc, c, i) => dimAdd(acc, dimScale(c, exps[i])), dimOf(0, 0, 0));
      if (!target.every(fint) || target.some((e) => Math.abs(e[0]) > 6)) continue;
    }
    if (!goodExps(exps, level, o.ask)) continue;
    if (dimZero(target)) continue;
    if (level === 2 && !hasDirectEq(cols)) continue;
    const eqs = equationsFor(target, cols);
    const letters = o.context === "none" ? ["p", "q", "r"] : null;
    // in letters the grid says nothing of what they are (no name under the symbol)
    const shown = letters ? facs.map((f, i) => ({ ...f, sym: letters[i], name: "" })) : facs;
    const tsym = o.context === "none" ? "X" : QBY[tid!].sym;
    const tname = o.context === "none" ? "a quantity" : QBY[tid!].name;
    const rows = modelRows({ sym: tsym, name: tname, dim: target }, shown, o.context === "none" && !unitsGiven, syms);
    const model = modelTex(tsym, shown, syms);
    const zeroIdx = o.ask === "zero" ? exps.findIndex(fzero) : -1;
    const tail = zeroIdx >= 0
      ? `Show that ${M(`${symTex(syms[zeroIdx])} = 0`)} and find the values of ${andTex(syms.filter((_, i) => i !== zeroIdx))}.`
      : `Use dimensional analysis to find the values of ${andTex(syms)}.`;
    let lead: string;
    if (o.context === "none") {
      const given = unitsGiven
        ? `${shown.map((f, i) => `${M(symTex(f.sym))} is measured in ${M(unitsTex(QBY[ids[i]].units!))}`).join(", ")}, and ${M("X")} in ${M(unitsTexFromDim(target))}.`
        : `${shown.map((f) => M(`[${symTex(f.sym)}] = ${dimTex(f.dim)}`)).join(", ")}, and ${M("X")} has dimensions ${M(dimTex(target))}.`;
      lead = `The quantities ${andTex(shown.map((f) => f.sym))} are related to a quantity ${M("X")}. ${given}`;
    } else {
      const units = unitsGiven
        ? ` ${[{ s: tsym, id: tid! }, ...ids.map((id, i) => ({ s: shown[i].sym, id }))].filter((x) => QBY[x.id].units).map((x) => `${M(symTex(x.s))} is measured in ${M(unitsTex(QBY[x.id].units!))}`).join(", ")}.`
        : "";
      lead = `${the(tname)[0].toUpperCase()}${the(tname).slice(1)} ${M(symTex(tsym))} is thought to depend on ${joinAnd(shown.map((f) => `${the(f.name)} ${M(symTex(f.sym))}`))}.${units}`;
    }
    const ask = zeroIdx >= 0 ? "zero" : "find";
    return {
      data: { kind: "powers", rows, unknowns: syms, answerPowers: exps, eqs, ask, zeroIdx: zeroIdx >= 0 ? zeroIdx : undefined, formula: model },
      prompt: `${lead} It is suggested that ${M(model)}, where ${M("k")} is a dimensionless constant and ${andTex(syms)} are constants. ${tail}`,
      answerText: eqsAnswer(exps, syms),
    };
  }
  // the pool for these options is exhausted: fall back to the plainest question
  if (o.ask !== "find" || o.context !== "none") return genPowers(level, { context: "none", ask: "find", given: "dims" });
  throw new Error("no powers question");
}
/** a quantity's base units as TeX, for a dimension with whole powers ("\mathrm{kg}\,\mathrm{m}\,\mathrm{s}^{-2}") */
const unitsTexFromDim = (d: Dim3): string => unitsTex(baseUnits(d));

export { joinAnd, pickOne, shuffle, circleLine };
