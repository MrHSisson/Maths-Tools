// Dimensional Analysis: the stepped working for every kind of question (the (?) in the exam view and the Solution of a skill question).
// Two halves, side by side. The picture is the page a student would WRITE: a title for the question, a few GIVEN quantities (length, time, mass, speed,
// acceleration), then any other quantity BUILT from them, each after the formula it comes from has been stated, then the main working. The caption beside it is
// a teacher talking you through it, in words. Finished builds move into a short "known" strip so the page stays small; the working is formal, as an
// examiner expects: F = ma, so [F] = [ma] = [m][a] = M × LT⁻² = MLT⁻².
import type { DecisionProblem, SolveStep } from "./types";
import { type Fr, type Dim3, BASE, QBY, qDim, fmul, fadd, fsub, fdiv, fzero, feq, fr, ZERO, ONE, solveLinear, parseUnits, unitsDim, dimOf } from "./dim";
import { symTex, frTex, supTex, dimTex, dimPowTex, productTex, eqLhsTex, brTex, numTex, M } from "./dimTex";
import { al, ct, lab, head, formulaRow, GAP, boxed, GIVEN_IDS, GIVEN_ITEMS, BASE_GIVEN, buildItem, buildOrder, keyName, derive, flatChain, NUMBER_WHY, type Piece, type Derivation } from "./dimBuild";
import type { DimProblemData, DimRow } from "./dimGen";

const rowBr = (r: DimRow): string => (/^(\[|\\left\[)/.test(r.sym) ? r.sym : brTex(r.sym));
const answerTex = (dim: Dim3): string => (dim.every(fzero) ? "1" : dimTex(dim));
/** a result with no dimensions says so */
const boxTex = (dim: Dim3): string => (dim.every(fzero) ? "1\\ \\text{(dimensionless)}" : dimTex(dim));
const piece = (r: DimRow): Piece => ({ br: rowBr(r), dim: r.dim, exp: r.exp ?? ONE });
const numPiece = (num: string): Piece => ({ br: `[${numTex(num)}]`, dim: dimOf(0, 0, 0), exp: ONE, dimless: NUMBER_WHY });
const par = (s: string): string => (s.startsWith("-") ? `(${s})` : s);
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** what may be taken as known when the page opens: the given set, lengths named otherwise, the base units, and anything the question itself states */
export function initialKnown(d: DimProblemData): string[] {
  const items = [...GIVEN_ITEMS];
  for (const id of d.needs ?? []) if (GIVEN_IDS.includes(id) && !BASE_GIVEN.includes(id)) items.push(`[${symTex(QBY[id].sym)}] = ${dimTex(qDim(id))}`);
  if (d.kind === "dimsUnits" || d.via === "units") items.push("\\mathrm{kg} \\to M", "\\mathrm{m} \\to L", "\\mathrm{s} \\to T");
  if (d.via === "given") for (const r of d.rows) if (r.given) items.push(`${rowBr(r)} = ${dimTex(r.dim)}`);
  return [...new Set(items)];
}
/** what the page shows before any working: the model or formula */
export function givenLines(d: DimProblemData): string[] {
  if (d.kind === "powers") return [`\\text{Model: } ${d.formula}`];
  if (d.kind === "consShow" || d.kind === "consOdd" || d.kind === "consMissing") return [`\\text{Formula: } ${d.formula}`];
  if (d.kind === "dimsConst" && d.relFormula) return [formulaRow(d.relFormula)];
  return [];
}

// ── the main derivation of a "find the dimensions" question ────────────────────────────────────────────────────────────────
interface Main { lhs: string; heading: string; intro: string; der: Derivation; final: string; root?: boolean }
function mainOf(d: DimProblemData): Main | null {
  const rows = d.rows;
  if (d.kind !== "dimsName" && d.kind !== "dimsUnits" && d.kind !== "dimsExpr") return null;
  const ans = answerTex(d.answerDim!);
  const result = rows[0];
  const factors = rows.slice(1);
  const name = result.name;
  if (d.kind === "dimsName") {
    const q = QBY[d.askId!];
    const pieces = [...(q.num ? [numPiece(q.num)] : []), ...factors.map(piece)];
    const expr = (q.num ? numTex(q.num) : "") + productTex(factors.map((r) => ({ sym: r.sym, p: r.exp ?? ONE })));
    return { lhs: result.sym, heading: `Now: the dimensions of ${name}`, intro: `Find the dimensions of ${name}. ${cap(q.say ?? name)}.`, der: derive(result.sym, expr, pieces, d.answerDim!, q.formula), final: `${result.sym} = ${boxTex(d.answerDim!)}` };
  }
  if (d.kind === "dimsUnits") {
    const units = factors.map((r) => `${r.sym}${supTex(r.exp ?? ONE)}`).join("\\,");
    const der = derive(result.sym, units, factors.map(piece), d.answerDim!);
    der.def = [der.def[0]];
    return { lhs: result.sym, heading: `Now: the dimensions of ${name}`, intro: "", der, final: `${result.sym} = ${boxTex(d.answerDim!)}` };
  }
  // an expression
  if (d.defText === "root") {
    const brs = factors.map((r) => `${rowBr(r)}${supTex(r.exp ?? ONE)}`).join("");
    const dims = factors.map((r) => dimPowTex(r.dim, r.exp ?? ONE)).join(" \\times ");
    const inner = dimTex(d.answerDim!.map((e) => fmul(e, fr(2))) as unknown as Dim3);
    const der: Derivation = { note: [], formula: [], def: [al(result.sym, `\\left(${brs}\\right)^{\\frac{1}{2}}`)], subst: [ct(`\\left(${dims}\\right)^{\\frac{1}{2}}`)], expand: [ct(`\\left(${inner}\\right)^{\\frac{1}{2}}`)], tidy: [], subtract: [], cancel: [], sum: [ct(ans)], divides: false };
    return { lhs: result.sym, heading: "Now: the dimensions of the expression", intro: "", der, final: `${result.sym} = ${boxTex(d.answerDim!)}`, root: true };
  }
  return { lhs: result.sym, heading: "Now: the dimensions of the expression", intro: "", der: derive(result.sym, null, factors.map(piece), d.answerDim!), final: `${result.sym} = ${boxTex(d.answerDim!)}` };
}

// ── the stage a derivation takes on the page ─────────────────────────────────────────────────────────────────────────────
interface Ctx { S: (caption: string, phase: string, ...add: string[]) => SolveStep; stage: (...carry: string[]) => void; learn: (item: string) => void; derivations: number }
interface DOpts {
  heading: string;
  /** the teacher introducing the formula (or, with no formula, the brackets) */
  intro: string;
  der: Derivation;
  /** the box round the final answer, for the main working */
  box?: string;
  /** what joins the known strip when it is finished */
  learn?: string;
  /** every step gets this phase tag (builds) */
  phase?: string;
  hasNumber?: boolean;
  captions?: Partial<{ brackets: string; subst: string; expand: string; sum: string }>;
}
const BRACKETS = "Put square brackets round both sides (they mean 'the dimensions of'), with a separate bracket for each factor.";
const SWAP = "Swap each bracket for its dimensions.";
const EXPAND = "Multiply every power inside the bracket by the power outside.";
const ADD = "Add the powers of each letter.";
const CANCEL = "Cancel the letters that are on both the top and the bottom.";
const TIDY = "Combine the powers on the top, and on the bottom.";
const SUBTRACT = "Subtract the bottom powers from the top.";
const SIMPLIFY = "Work out each power.";
const NEGATIVE = "Write without the fraction: a letter on the bottom becomes a negative power.";
const FRACTION = "Keep the division as a fraction: it is easier to cancel.";
// after the first derivation the teacher is brisker
const BRACKETS2 = "Brackets again, one for each factor.";
const SWAP2 = "Swap in the dimensions.";
const EXPAND2 = "Expand the powers.";
const ADD2 = "Add the powers.";
const CANCEL2 = "Cancel.";
const NEGATIVE2 = "Write with negative powers.";
function derivationSteps(c: Ctx, o: DOpts): SolveStep[] {
  const { der } = o;
  const again = c.derivations++ > 0;
  c.stage();
  const hasFormula = der.formula.length > 0;
  const groups: Array<{ rows: string[]; caption: string; phase: string }> = [];
  if (hasFormula) groups.push({ rows: [head(o.heading), ...der.formula], caption: o.intro, phase: "The formula" });
  groups.push({ rows: [...(hasFormula ? [] : [head(o.heading)]), ...der.note, ...der.def], caption: o.captions?.brackets ?? `${hasFormula ? "" : o.intro ? `${o.intro} ` : ""}${again ? BRACKETS2 : BRACKETS}${o.hasNumber ? " A plain number, like a half, has dimensions 1." : ""}${der.divides ? ` ${again ? "Keep the division as a fraction." : FRACTION}` : ""}`, phase: "Brackets" });
  groups.push({ rows: der.subst, caption: o.captions?.subst ?? (again ? SWAP2 : SWAP), phase: "Dimensions" });
  if (der.expand.length) groups.push({ rows: der.expand, caption: o.captions?.expand ?? (again ? EXPAND2 : EXPAND), phase: "Powers" });
  if (der.tidy.length) groups.push({ rows: der.tidy, caption: TIDY, phase: "Combine" });
  if (der.subtract.length) groups.push({ rows: der.subtract, caption: SUBTRACT, phase: "Subtract" });
  if (der.cancel.length) groups.push({ rows: der.cancel, caption: again ? CANCEL2 : CANCEL, phase: "Cancel" });
  if (der.sum.length) groups.push({ rows: der.sum, caption: o.captions?.sum ?? (der.subtract.length ? SIMPLIFY : der.divides ? (again ? NEGATIVE2 : NEGATIVE) : again ? ADD2 : ADD), phase: der.divides ? "Negative powers" : "Add the powers" });
  return groups.map((g, i) => {
    const last = i === groups.length - 1;
    if (last && o.learn) c.learn(o.learn);
    return c.S(g.caption, o.phase ?? (o.box && last ? "Answer" : g.phase), ...g.rows, ...(last && o.box ? [GAP, boxed(o.box)] : []));
  });
}

/** the steps that build each quantity in `keys` that is not given, dependencies first; each finished build joins the known strip */
function buildSteps(keys: string[], c: Ctx): SolveStep[] {
  const out: SolveStep[] = [];
  for (const key of buildOrder(keys)) {
    const item = buildItem(key)!;
    const name = keyName(key);
    const der = derive(item.lhs, item.expr, item.pieces, item.dim, item.formula);
    out.push(...derivationSteps(c, {
      heading: `First: the dimensions of ${name}`,
      intro: `${cap(name)} isn't given: build it. ${cap(item.say)}.`,
      der, learn: `${item.lhs} = ${dimTex(item.dim)}`, phase: `Build ${name}`, hasNumber: item.pieces.some((p) => p.dim.every(fzero)),
    }));
  }
  return out;
}

/** the model answers: for each build and the main working, the formula used and then the chain, each as one line of TeX (no $) */
export function modelChains(d: DimProblemData): string[] {
  const out: string[] = [];
  const chainOf = (der: Derivation) => flatChain([...der.def, ...der.subst, ...der.expand, ...der.tidy, ...der.subtract, ...der.cancel, ...der.sum]);
  for (const key of buildOrder(d.needs ?? [])) {
    const item = buildItem(key)!;
    if (item.formula) out.push(item.formula);
    out.push(chainOf(derive(item.lhs, item.expr, item.pieces, item.dim)));
  }
  if (d.kind === "consShow" || d.kind === "consOdd" || d.kind === "consMissing" || d.kind === "consPick") {
    const skip = d.kind === "consMissing" ? d.oddIdx : -1;
    (d.terms ?? []).forEach((t, i) => {
      if (i === skip) return;
      const { pieces, dim, lhs } = termPieces(t);
      out.push(pieces.length === 1 && feq(pieces[0].exp, ONE) ? `${lhs} = ${dimTex(dim)}` : chainOf(derive(lhs, null, pieces, dim)));
    });
    return out;
  }
  if (d.kind === "dimsConst") {
    const k = constPieces(d);
    if (d.relFormula) out.push(d.relFormula);
    out.push(flatChain([k.formulaRow]), chainOf(k.der));
    return out;
  }
  const m = mainOf(d);
  if (m) {
    if (m.der.formula.length && d.askId) out.push(QBY[d.askId].formula ?? "");
    out.push(chainOf(m.der));
  }
  return out.filter((x) => x !== "");
}

/** a formula's term as the pieces of a derivation: its factors, and a number with dimensions 1 */
function termPieces(t: NonNullable<DimProblemData["terms"]>[number]): { pieces: Piece[]; dim: Dim3; lhs: string } {
  const pieces: Piece[] = [...(t.num ? [numPiece(t.num)] : []), ...t.f.map((x): Piece => ({ br: `[${symTex(x.sym)}]`, dim: qDim(x.q), exp: x.p }))];
  const dim = t.f.reduce<Dim3>((acc, x) => [fadd(acc[0], fmul(qDim(x.q)[0], x.p)), fadd(acc[1], fmul(qDim(x.q)[1], x.p)), fadd(acc[2], fmul(qDim(x.q)[2], x.p))], [ZERO, ZERO, ZERO]);
  return { pieces, dim, lhs: brTex(t.tex) };
}
/** a constant in a formula: the formula in brackets, then [k] as the subject with the other dimensions put in */
function constPieces(d: DimProblemData): { formulaRow: string; der: Derivation } {
  const k = d.rows[0], target = d.rows[1], others = d.rows.slice(2);
  const denominator = d.defText === "denominator";
  const kr = rowBr(k);
  const brsOthers = others.map((r) => `${rowBr(r)}${supTex(r.exp ?? ONE)}`).join("");
  const numBr = d.relNum ? `[${numTex(d.relNum)}]` : "";
  const formulaR = al(rowBr(target), denominator ? `\\frac{${numBr}${brsOthers}}{${kr}}` : `${numBr}${kr}${brsOthers}`);
  const flipped = others.map((r): Piece => ({ br: rowBr(r), dim: r.dim, exp: fmul(r.exp ?? ONE, fr(-1)) }));
  const pieces: Piece[] = denominator ? [...others.map(piece), { br: rowBr(target), dim: target.dim, exp: fr(-1) }] : [{ br: rowBr(target), dim: target.dim, exp: ONE }, ...flipped];
  return { formulaRow: formulaR, der: derive(kr, null, pieces, d.answerDim!) };
}

export function solveDim(p: DecisionProblem): SolveStep[] {
  const d = p.dim;
  if (!d) throw new Error("no dimension data");
  const rows = d.rows;
  // the page: `W` is the working in the current stage, `known` the strip of facts; every step's view is a copy of both
  const known = initialKnown(d);
  let W: string[] = [];
  let knownFresh = 0;
  const c: Ctx = {
    S: (caption, phase, ...add) => {
      W.push(...add);
      const step: SolveStep = { caption, phase, edgeStates: {}, dimView: { title: d.title, known: [...known], knownFresh, lines: [...W], fresh: add.length } };
      knownFresh = 0;
      return step;
    },
    stage: (...carry) => { W = [...carry]; },
    learn: (item) => { if (!known.includes(item)) { known.push(item); knownFresh = 1; } },
    derivations: 0,
  };
  const S = c.S;
  const wrongNote = (): SolveStep[] => {
    const wrong = (d.options ?? []).filter((o) => !o.correct);
    return wrong.length ? [S(`The other options: ${wrong.map((o) => `${M(o.text)} (${o.why})`).join("; ")}.`, "The other options")] : [];
  };

  // ── Find the dimensions ──
  if (d.kind === "dimsName" || d.kind === "dimsUnits" || d.kind === "dimsExpr") {
    const steps = buildSteps(d.needs ?? [], c);
    const m = mainOf(d)!;
    const captions = d.kind === "dimsUnits"
      ? { brackets: "Put the units in square brackets. Kilograms, metres and seconds stand for the base dimensions.", subst: "Swap each unit for its dimension: kg is M, m is L, s is T." }
      : d.kind === "dimsExpr"
        ? { brackets: `Put brackets round each quantity; a power goes on its bracket.${m.root ? " A square root is a power of a half on everything under it." : ""}`, ...(m.root ? { expand: "Work out what is under the root first.", sum: "Halve every power." } : {}) }
        : {};
    steps.push(...derivationSteps(c, { heading: m.heading, intro: m.intro, der: m.der, box: m.final, captions, hasNumber: d.kind === "dimsName" && !!QBY[d.askId!].num }));
    steps.push(...wrongNote());
    return steps;
  }

  // ── Find the dimensions of a constant ──
  if (d.kind === "dimsConst") {
    const steps = buildSteps(d.needs ?? [], c);
    const k = rows[0];
    const { formulaRow: fr0, der } = constPieces(d);
    c.stage();
    steps.push(S(`Start from the formula: ${M(d.formula!)} is a constant.`, "The formula", formulaRow(d.relFormula!)));
    steps.push(S(`${d.relArg ? `The argument of a ${d.relArg} has no dimensions: say so. Then bracket it as a product.` : "Put brackets round both sides: they must have the same dimensions."}${d.relNum ? " A plain number, like a half, has dimensions 1." : ""}`, "Brackets", head(`The dimensions of ${M(d.formula!)}`), ...(d.relNum ? [`[${numTex(d.relNum)}] = 1 \\quad \\text{as it is ${NUMBER_WHY}}`] : []), ...(d.relArg ? [`${rowBr(d.rows[1])} = 1 \\quad \\text{as it is the argument of a ${d.relArg}}`] : []), fr0));
    steps.push(S(`Make ${M(rowBr(k))} the subject.${d.relNum ? " The half is only a number, so it drops out." : ""}${der.divides ? ` ${FRACTION}` : ""}`, "Rearrange for the constant", GAP, ...der.def));
    steps.push(S(SWAP, "Dimensions", ...der.subst));
    if (der.expand.length) steps.push(S(EXPAND, "Powers", ...der.expand));
    if (der.tidy.length) steps.push(S(TIDY, "Combine", ...der.tidy));
    if (der.subtract.length) steps.push(S(SUBTRACT, "Subtract", ...der.subtract));
    if (der.cancel.length) steps.push(S(CANCEL, "Cancel", ...der.cancel));
    const finalTex = `${rowBr(k)} = ${boxTex(d.answerDim!)}`;
    steps.push(S(der.sum.length ? (der.subtract.length ? SIMPLIFY : der.divides ? NEGATIVE : ADD) : "That is the answer; box it.", "Answer", ...der.sum, GAP, boxed(finalTex)));
    if (d.represents) steps.push(S(`These are the dimensions of ${d.represents}: that is what ${M(d.formula!)} is.`, "What it is", head(`These are the dimensions of ${d.represents}.`)));
    else if (d.answerDim!.every(fzero)) steps.push(S("No dimensions left: the constant is dimensionless.", "What it is", head("The constant has no dimensions: it is dimensionless.")));
    steps.push(...wrongNote());
    return steps;
  }

  // ── Consistency ──
  if (d.kind === "consShow" || d.kind === "consOdd" || d.kind === "consMissing" || d.kind === "consPick") {
    const steps = buildSteps(d.needs ?? [], c);
    const terms = d.terms ?? [];
    if (d.kind === "consPick") {
      c.stage();
      (d.options ?? []).forEach((_o, i) => steps.push(S(`Formula ${"ABCD"[i]}: are all its terms the same dimensions?`, "Check each formula", ...(i === 0 ? [head("Check each formula")] : []), d.checks![i])));
      steps.push(S("Only one formula has matching terms: circle it.", "Answer", GAP, boxed(d.formula!)));
      return steps;
    }
    const skip = d.kind === "consMissing" ? d.oddIdx! : -1;
    const dims: Dim3[] = [];
    terms.forEach((t, i) => {
      const { pieces, dim, lhs } = termPieces(t);
      dims.push(dim);
      if (i === skip) return;
      c.stage();
      const one = pieces.length === 1 && feq(pieces[0].exp, ONE);
      const rowsT = one ? [al(lhs, dimTex(dim))] : (() => { const der = derive(lhs, null, pieces, dim); return [...der.note, ...der.def, ...der.subst, ...der.expand, ...der.tidy, ...der.subtract, ...der.cancel, ...der.sum]; })();
      steps.push(S(`${i === 0 ? "First term" : "Next term"}: brackets, dimensions, then add the powers.${t.num ? " A number like a half has dimensions 1." : ""}`, "Dimensions of each term", head(`The dimensions of $${t.tex}$`), ...rowsT));
    });
    c.stage();
    const done = terms.map((t, i) => (i === skip ? null : brTex(t.tex))).filter((x): x is string => !!x);
    if (d.kind === "consShow") {
      steps.push(S("Every term has the same dimensions: the formula is consistent.", "Conclusion", head("Compare the terms"), `${done.join(" = ")} = ${dimTex(dims[0])}`, GAP, boxed("\\text{the formula is dimensionally consistent}")));
    } else if (d.kind === "consOdd") {
      steps.push(S("Compare the terms: the odd one out has different dimensions.", "Conclusion", head("Compare the terms"), boxed(`\\text{odd one out: } ${terms[d.oddIdx!].tex}`)));
    } else {
      const m = d.missing!;
      const eqRows = ([0, 1, 2] as const).map((col) => {
        if (fzero(m.coef[col])) return null;
        const rest = m.rest[col];
        const tail = fzero(rest) ? "" : ` ${rest[0] < 0 ? "-" : "+"} ${frTex(fr(Math.abs(rest[0]), rest[1]))}`;
        return lab(BASE[col], `${eqLhsTex([m.coef[col]], ["n"])}${tail} = ${frTex(m.target[col])}`);
      }).filter((x): x is string => !!x);
      steps.push(S(`Match the powers of each base dimension to the other terms.`, "Equate the dimensions", head("Equate the powers"), ...eqRows));
      steps.push(S(`Solve for ${M("n")}.`, "Answer", GAP, boxed(`n = ${frTex(m.value)}`)));
    }
    return steps;
  }

  // ── Find the powers ──
  const target = rows[0];
  const facs = rows.slice(1);
  const syms = d.unknowns;
  const steps: SolveStep[] = [];
  if (d.via === "units") {
    // each quantity's dimensions from its units; a derived unit (a newton) is built first
    const unitKeys = [...new Set((d.rowUnits ?? []).flatMap((u) => parseUnits(u).map(([x]) => `u:${x}`)))];
    steps.push(...buildSteps(unitKeys, c));
    rows.forEach((r, i) => {
      const toks = parseUnits(d.rowUnits![i]);
      const pieces = toks.map(([x, e]): Piece => ({ br: `\\mathrm{${x}}`, dim: unitsDim(x), exp: fr(e) }));
      const units = toks.map(([x, e]) => `\\mathrm{${x}}${e === 1 ? "" : `^{${e}}`}`).join("\\,");
      const der = derive(rowBr(r), units, pieces, r.dim);
      c.stage();
      c.learn(`${rowBr(r)} = ${dimTex(r.dim)}`);
      steps.push(S(`Find ${M(r.sym)} from its units: brackets, dimensions, then add the powers.`, "Dimensions from the units", head(`The dimensions of ${M(r.sym)}`), der.def[0], ...der.subst, ...der.expand, ...der.tidy, ...der.subtract, ...der.cancel, ...der.sum));
    });
  } else if (d.via === "defs") {
    steps.push(...buildSteps(d.needs ?? [], c));
  }
  // the model, with the dimensions put in, expanded and collected
  const model = `${brTex(target.sym)} = ${facs.map((r, i) => `${rowBr(r)}^{${symTex(syms[i])}}`).join("")}`;
  c.stage();
  steps.push(S(`${M("k")} has no dimensions: put square brackets round both sides.`, "The model", head("The model"), model));
  const withPower = (r: DimRow, i: number) => {
    const t = dimTex(r.dim);
    const letters = r.dim.filter((e) => !fzero(e)).length;
    const bare = letters === 1 && feq(r.dim.find((e) => !fzero(e))!, ONE);
    return `${bare ? t : `(${t})`}^{${symTex(syms[i])}}`;
  };
  const substituted = facs.map(withPower).join("");
  const expanded = facs.map((r, i) => ([0, 1, 2] as const).filter((col) => !fzero(r.dim[col])).map((col) => `${BASE[col]}^{${feq(r.dim[col], ONE) ? "" : frTex(r.dim[col])}${symTex(syms[i])}}`).join("")).join("\\,");
  const collected = ([0, 1, 2] as const).map((col) => `${BASE[col]}^{${eqLhsTex(d.eqs[col].coef, syms)}}`).filter((_, col) => d.eqs[col].coef.some((x) => !fzero(x))).join("");
  steps.push(S("Swap each bracket for its dimensions.", "The model", al(dimTex(target.dim), substituted)));
  if (expanded !== substituted) steps.push(S("Put each unknown power on every letter in its bracket.", "The model", ct(expanded)));
  steps.push(S(`Collect the powers of ${M("M")}, ${M("L")} and ${M("T")}.`, "The model", ct(collected)));
  // equate the powers
  c.stage(head("The model"), `${dimTex(target.dim)} = ${collected}`);
  d.eqs.forEach((e, col) => steps.push(S(`Powers of ${M(BASE[col])}: the right side must add up to ${M(frTex(e.rhs))}.`, "Equate the powers", ...(col === 0 ? [GAP, head("Equate the powers")] : []), lab(BASE[col], `${eqLhsTex(e.coef, syms)} = ${frTex(e.rhs)}`))));

  if (d.ask === "cannot") {
    // two independent equations fix both powers; the third then disagrees
    for (let r1 = 0; r1 < 3; r1++) for (let r2 = r1 + 1; r2 < 3; r2++) {
      const res = solveLinear([d.eqs[r1].coef, d.eqs[r2].coef], [d.eqs[r1].rhs, d.eqs[r2].rhs]);
      if (res.status !== "unique") continue;
      const r3 = 3 - r1 - r2;
      const [a, b] = res.x;
      const lhs = fadd(fmul(d.eqs[r3].coef[0], a), fmul(d.eqs[r3].coef[1], b));
      c.stage(head("Equate the powers"), ...d.eqs.map((e) => lab(BASE[e.col], `${eqLhsTex(e.coef, syms)} = ${frTex(e.rhs)}`)));
      steps.push(S(`Solve the ${BASE[r1]} and ${BASE[r2]} equations.`, "Solve", GAP, head("Solve"), al(symTex(syms[0]), frTex(a)), al(symTex(syms[1]), frTex(b))));
      steps.push(S(`Put them in the ${BASE[r3]} equation: it fails.`, "Contradiction", GAP, lab(BASE[r3], `${frTex(lhs)} \\neq ${frTex(d.eqs[r3].rhs)}`)));
      steps.push(S("No values work: the model cannot be right.", "Answer", GAP, boxed("\\text{no values work: the model cannot be right}")));
      return steps;
    }
    return steps;
  }

  // solve: an equation with one power left gives it, and the next uses it
  c.stage(head("Equate the powers"), ...d.eqs.map((e) => lab(BASE[e.col], `${eqLhsTex(e.coef, syms)} = ${frTex(e.rhs)}`)));
  const val: Array<Fr | null> = Array(syms.length).fill(null);
  let first = true;
  for (let guard = 0; val.some((v) => v === null) && guard < 6; guard++) {
    const e = d.eqs.find((q) => q.coef.filter((x, i) => val[i] === null && !fzero(x)).length === 1);
    if (!e) break;
    const i = e.coef.findIndex((x, k) => val[k] === null && !fzero(x));
    const used = e.coef.reduce<Fr>((acc, x, k) => (val[k] ? fadd(acc, fmul(x, val[k]!)) : acc), ZERO);
    const v = fdiv(fsub(e.rhs, used), e.coef[i]);
    const haveKnown = e.coef.some((x, k) => k !== i && val[k] && !fzero(x));
    val[i] = v;
    const withValues = e.coef.map((x, k) => (fzero(x) ? null : val[k] && k !== i ? `${feq(x, ONE) ? "" : frTex(x)}\\left(${frTex(val[k]!)}\\right)` : `${feq(x, ONE) ? "" : frTex(x)}${symTex(syms[k])}`)).filter(Boolean).join(" + ").replace(/\+ -/g, "- ");
    const numer = fzero(used) ? frTex(e.rhs) : `${frTex(e.rhs)} - ${par(frTex(used))}`;
    const expr = feq(e.coef[i], ONE) ? numer : `\\frac{${numer}}{${frTex(e.coef[i])}}`;
    const out = [...(first ? [GAP, head("Solve")] : []), ...(haveKnown ? [lab(BASE[e.col], `${withValues} = ${frTex(e.rhs)}`)] : []), al(symTex(syms[i]), expr), ...(expr !== frTex(v) ? [ct(frTex(v))] : [])];
    first = false;
    const zeroNote = fzero(v) ? " Zero: that quantity does not appear." : "";
    steps.push(S(haveKnown
      ? `Substitute the powers found into the ${BASE[e.col]} equation and solve for ${M(symTex(syms[i]))}.${zeroNote}`
      : `The ${BASE[e.col]} equation has only ${M(symTex(syms[i]))}${feq(e.coef[i], ONE) ? ": solve it" : `: divide both sides by ${M(frTex(e.coef[i]))}`}.${zeroNote}`, "Solve", ...out));
  }
  if (val.some((v) => v === null)) {
    const res = solveLinear(d.eqs.map((e) => e.coef), d.eqs.map((e) => e.rhs));
    const pending = val.map((v, i) => (v === null ? i : -1)).filter((i) => i >= 0);
    if (res.status === "unique") res.x.forEach((v, i) => { if (val[i] === null) val[i] = v; });
    steps.push(S("Eliminate one power from a pair of equations, then another.", "Solve", ...(first ? [GAP, head("Solve")] : []), ...pending.map((i) => al(symTex(syms[i]), frTex(val[i]!)))));
  }
  const answer = syms.map((s, i) => `${symTex(s)} = ${frTex(val[i]!)}`).join(",\\ ");
  steps.push(S("Check all three equations, then write the answer.", "Answer", GAP, boxed(answer)));
  return steps;
}
