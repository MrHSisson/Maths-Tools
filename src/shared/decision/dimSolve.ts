// Dimensional Analysis: the stepped working for every kind of question (the (?) in the exam view and the Solution of a skill question).
// Two halves, side by side. The picture is the page a student would WRITE: a few GIVEN quantities at the top (length, time, mass, speed), then any other
// quantity BUILT from them in its own lines before it is used, then the main working. The caption beside it (prose) says WHY each line is there, in words, and
// does not repeat the maths on the page. Finished builds move into a short "known" strip so the page stays small; the working is formal, as an examiner
// expects: [F] = [ma] = [m][a] = M × LT⁻² = MLT⁻².
import type { DecisionProblem, SolveStep } from "./types";
import { type Fr, type Dim3, BASE, QBY, qDim, fmul, fadd, fsub, fdiv, fzero, feq, fr, ZERO, ONE, solveLinear, parseUnits, unitsDim } from "./dim";
import { symTex, frTex, supTex, dimTex, dimPowTex, productTex, eqLhsTex, M } from "./dimTex";
import { al, ct, lab, GAP, boxed, GIVEN_IDS, GIVEN_ITEMS, buildItem, buildOrder, derive, flatChain, type Piece, type Derivation } from "./dimBuild";
import type { DimProblemData, DimRow } from "./dimGen";

const rowBr = (r: DimRow): string => (r.sym.startsWith("[") ? r.sym : `[${r.sym}]`);
const answerTex = (dim: Dim3): string => (dim.every(fzero) ? "1" : dimTex(dim));
const piece = (r: DimRow): Piece => ({ br: rowBr(r), dim: r.dim, exp: r.exp ?? ONE });
const par = (s: string): string => (s.startsWith("-") ? `(${s})` : s);
const BASE_FOUR = ["len", "time", "mass", "speed"];

/** what may be taken as known when the page opens: the given set, lengths named otherwise, the base units, and anything the question itself states */
export function initialKnown(d: DimProblemData): string[] {
  const items = [...GIVEN_ITEMS];
  for (const id of d.needs ?? []) if (GIVEN_IDS.includes(id) && !BASE_FOUR.includes(id)) items.push(`[${symTex(QBY[id].sym)}] = ${dimTex(qDim(id))}`);
  if (d.kind === "dimsUnits" || d.via === "units") items.push("\\mathrm{kg} \\to M", "\\mathrm{m} \\to L", "\\mathrm{s} \\to T");
  if (d.via === "given") for (const r of d.rows) if (r.given) items.push(`${rowBr(r)} = ${dimTex(r.dim)}`);
  return [...new Set(items)];
}
/** what the page shows before any working: the model or formula */
export function givenLines(d: DimProblemData): string[] {
  if (d.kind === "powers") return [`\\text{Model: } ${d.formula}`];
  if (d.kind === "consShow" || d.kind === "consOdd" || d.kind === "consMissing") return [`\\text{Formula: } ${d.formula}`];
  return [];
}

// ── the main derivation of a "find the dimensions" question, in groups of rows (one group per step) ──────────────────────────
interface Main { lhs: string; groups: string[][]; chains: string[]; final: string }
function mainOf(d: DimProblemData): Main | null {
  if (d.kind !== "dimsName" && d.kind !== "dimsUnits" && d.kind !== "dimsExpr" && d.kind !== "dimsConst") return null;
  const rows = d.rows;
  const ans = answerTex(d.answerDim!);
  const chain = (der: Derivation) => flatChain([...der.def, ...der.subst, ...der.sum]);
  if (d.kind === "dimsName") {
    const result = rows[0];
    const factors = rows.slice(1);
    const der = derive(result.sym, productTex(factors.map((r) => ({ sym: r.sym, p: r.exp ?? ONE }))), factors.map(piece), d.answerDim!);
    return { lhs: result.sym, groups: [der.def, der.subst, der.sum], chains: [chain(der)], final: `${result.sym} = ${ans}` };
  }
  if (d.kind === "dimsUnits") {
    const result = rows[0];
    const factors = rows.slice(1);
    const units = factors.map((r) => `${r.sym}${supTex(r.exp ?? ONE)}`).join("\\,");
    const der = derive(result.sym, units, factors.map(piece), d.answerDim!);
    const def = [der.def[0]];
    return { lhs: result.sym, groups: [def, der.subst, der.sum], chains: [flatChain([...def, ...der.subst, ...der.sum])], final: `${result.sym} = ${ans}` };
  }
  if (d.kind === "dimsExpr") {
    const result = rows[0];
    const factors = rows.slice(1);
    if (d.defText === "root") {
      const brs = factors.map((r) => `${rowBr(r)}${supTex(r.exp ?? ONE)}`).join("");
      const dims = factors.map((r) => dimPowTex(r.dim, r.exp ?? ONE)).join(" \\times ");
      const inner = dimTex(d.answerDim!.map((e) => fmul(e, fr(2))) as unknown as Dim3);
      const g = [[al(result.sym, `\\left(${brs}\\right)^{\\frac{1}{2}}`)], [ct(`\\left(${dims}\\right)^{\\frac{1}{2}}`)], [ct(`\\left(${inner}\\right)^{\\frac{1}{2}}`)], [ct(ans)]];
      return { lhs: result.sym, groups: g, chains: [flatChain(g.flat())], final: `${result.sym} = ${ans}` };
    }
    const der = derive(result.sym, null, factors.map(piece), d.answerDim!);
    return { lhs: result.sym, groups: [der.def, der.subst, der.sum], chains: [chain(der)], final: `${result.sym} = ${ans}` };
  }
  if (d.kind === "dimsConst") {
    const k = rows[0], target = rows[1], others = rows.slice(2);
    const denominator = d.defText === "denominator";
    const kr = rowBr(k);
    const brsOthers = others.map((r) => `${rowBr(r)}${supTex(r.exp ?? ONE)}`).join("");
    const formulaRow = al(rowBr(target), denominator ? `${brsOthers}${kr}^{-1}` : `${kr}${brsOthers}`);
    // [k] = [target] times each other factor to the opposite power (or the other factors times [target]^{-1} when k is in the denominator)
    const flipped = others.map((r): Piece => ({ br: rowBr(r), dim: r.dim, exp: fmul(r.exp ?? ONE, fr(-1)) }));
    const pieces: Piece[] = denominator ? [...others.map(piece), { br: rowBr(target), dim: target.dim, exp: fr(-1) }] : [{ br: rowBr(target), dim: target.dim, exp: ONE }, ...flipped];
    const der = derive(kr, null, pieces, d.answerDim!);
    return { lhs: kr, groups: [[formulaRow], der.def, der.subst, der.sum], chains: [flatChain([formulaRow]), chain(der)], final: `${kr} = ${ans}` };
  }
  return null;
}

/** the steps that build each quantity in `keys` that is not given, dependencies first; each finished build joins the known strip */
interface Ctx { S: (caption: string, phase: string, ...add: string[]) => SolveStep; stage: (...carry: string[]) => void; learn: (item: string) => void }
function buildSteps(keys: string[], c: Ctx): SolveStep[] {
  const out: SolveStep[] = [];
  for (const key of buildOrder(keys)) {
    const item = buildItem(key)!;
    const der = derive(item.lhs, item.expr, item.pieces, item.dim);
    const phase = `Build ${key.startsWith("u:") ? key.slice(2) : QBY[key].name}`;
    const known = `${item.lhs} = ${dimTex(item.dim)}`;
    c.stage();
    out.push(c.S(`${M(item.lhs)} is not given, so build it from the quantities we know: ${item.words}.`, phase, ...der.def));
    if (der.sum.length) {
      out.push(c.S("Put in the dimensions we know.", phase, ...der.subst));
      c.learn(known);
      out.push(c.S("Add the powers of each base dimension.", phase, ...der.sum));
    } else {
      c.learn(known);
      out.push(c.S("Put in the dimensions we know.", phase, ...der.subst));
    }
  }
  return out;
}

/** the model answers: the builds and then the main chain, each as one flat line of TeX (no $) */
export function modelChains(d: DimProblemData): string[] {
  const out: string[] = [];
  for (const key of buildOrder(d.needs ?? [])) {
    const item = buildItem(key)!;
    const der = derive(item.lhs, item.expr, item.pieces, item.dim);
    out.push(flatChain([...der.def, ...der.subst, ...der.sum]));
  }
  if (d.kind === "consShow" || d.kind === "consOdd" || d.kind === "consMissing" || d.kind === "consPick") {
    const terms = d.terms ?? [];
    const skip = d.kind === "consMissing" ? d.oddIdx : -1;
    terms.forEach((t, i) => {
      if (i === skip) return;
      const dim = t.f.reduce<Dim3>((acc, x) => [fadd(acc[0], fmul(qDim(x.q)[0], x.p)), fadd(acc[1], fmul(qDim(x.q)[1], x.p)), fadd(acc[2], fmul(qDim(x.q)[2], x.p))], [ZERO, ZERO, ZERO]);
      const pieces = t.f.map((x): Piece => ({ br: `[${symTex(x.sym)}]`, dim: qDim(x.q), exp: x.p }));
      const lhs = `[${t.tex}]`;
      out.push(pieces.length === 1 && feq(pieces[0].exp, ONE) ? `${lhs} = ${dimTex(dim)}` : (() => { const der = derive(lhs, null, pieces, dim); return flatChain([...der.def, ...der.subst, ...der.sum]); })());
    });
    return out;
  }
  const m = mainOf(d);
  return m ? [...out, ...m.chains] : out;
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
      const step: SolveStep = { caption, phase, edgeStates: {}, dimView: { known: [...known], knownFresh, lines: [...W], fresh: add.length } };
      knownFresh = 0;
      return step;
    },
    stage: (...carry) => { W = [...carry]; },
    learn: (item) => { if (!known.includes(item)) { known.push(item); knownFresh = 1; } },
  };
  const S = c.S;
  const wrongNote = (): SolveStep[] => {
    const wrong = (d.options ?? []).filter((o) => !o.correct);
    return wrong.length ? [S(`The other options are slips: ${wrong.map((o) => `${M(o.text)} (${o.why})`).join("; ")}.`, "The other options")] : [];
  };

  // ── Find the dimensions ──
  if (d.kind === "dimsName" || d.kind === "dimsUnits" || d.kind === "dimsExpr" || d.kind === "dimsConst") {
    const steps = buildSteps(d.needs ?? [], c);
    const main = mainOf(d)!;
    c.stage();
    const captions: Record<string, string[]> = {
      dimsName: [`Now find ${M(main.lhs)}: ${d.defText}.`, "Put in the dimensions we know.", "Add the powers of each base dimension to finish."],
      dimsUnits: ["Write the units inside the brackets. Kilograms, metres and seconds stand for the base dimensions.", "Replace each unit by its dimension.", "Add the powers of each base dimension to finish."],
      dimsExpr: d.defText === "root"
        ? ["Write each quantity inside its own brackets, all under the root.", "Put in the dimensions we know.", "Add the powers of each base dimension under the root.", "The square root halves every power."]
        : ["Write each quantity inside its own brackets.", "Put in the dimensions we know.", "Add the powers of each base dimension to finish."],
      dimsConst: ["Write the formula using brackets for the dimensions of each side.", `Make ${M(main.lhs)} the subject.`, "Put in the dimensions we know.", "Add the powers of each base dimension to finish."],
    };
    const phases: Record<string, string[]> = {
      dimsName: ["Definition", "Dimensions of each part", "Combine"], dimsUnits: ["Units", "Dimensions of each part", "Combine"],
      dimsExpr: ["Brackets", "Dimensions of each part", "Combine", "Combine"], dimsConst: ["The formula", "Rearrange for the constant", "Dimensions of each part", "Combine"],
    };
    const groups = main.groups.filter((g) => g.length);
    const caps = captions[d.kind];
    const phs = phases[d.kind];
    groups.forEach((g, i) => {
      const last = i === groups.length - 1;
      steps.push(S(caps[i] ?? "Add the powers of each base dimension to finish.", last ? "Answer" : phs[i] ?? "Working", ...(i > 0 && d.kind === "dimsConst" && i === 1 ? [GAP] : []), ...g, ...(last ? [GAP, boxed(main.final)] : [])));
    });
    steps.push(...wrongNote());
    return steps;
  }

  // ── Consistency ──
  if (d.kind === "consShow" || d.kind === "consOdd" || d.kind === "consMissing" || d.kind === "consPick") {
    const steps = buildSteps(d.needs ?? [], c);
    const terms = d.terms ?? [];
    if (d.kind === "consPick") {
      c.stage();
      (d.options ?? []).forEach((_o, i) => steps.push(S(`Check formula ${"ABCD"[i]}: do all its terms have the same dimensions?`, "Check each formula", d.checks![i])));
      steps.push(S("Only one formula has terms that all have the same dimensions.", "Answer", GAP, boxed(d.formula!)));
      return steps;
    }
    const skip = d.kind === "consMissing" ? d.oddIdx! : -1;
    const dims: Dim3[] = [];
    terms.forEach((t, i) => {
      const pieces = t.f.map((x): Piece => ({ br: `[${symTex(x.sym)}]`, dim: qDim(x.q), exp: x.p }));
      const dim = t.f.reduce<Dim3>((acc, x) => [fadd(acc[0], fmul(qDim(x.q)[0], x.p)), fadd(acc[1], fmul(qDim(x.q)[1], x.p)), fadd(acc[2], fmul(qDim(x.q)[2], x.p))], [ZERO, ZERO, ZERO]);
      dims.push(dim);
      if (i === skip) return;
      c.stage();
      const lhs = `[${t.tex}]`;
      const one = pieces.length === 1 && feq(pieces[0].exp, ONE);
      const rowsT = one ? [al(lhs, dimTex(dim))] : (() => { const der = derive(lhs, null, pieces, dim); return [...der.def, ...der.subst, ...der.sum]; })();
      c.learn(`${lhs} = ${dimTex(dim)}`);
      steps.push(S(`Work out the dimensions of this term from its factors.${t.num ? " The number has no dimensions, so it is left out." : ""}`, "Dimensions of each term", ...rowsT));
    });
    c.stage();
    const done = terms.map((t, i) => (i === skip ? null : `[${t.tex}]`)).filter((x): x is string => !!x);
    if (d.kind === "consShow") {
      steps.push(S("Every term has the same dimensions, so the formula is dimensionally consistent.", "Conclusion", `\\therefore\\ ${done.join(" = ")} = ${dimTex(dims[0])}`, GAP, boxed("\\text{the formula is dimensionally consistent}")));
    } else if (d.kind === "consOdd") {
      const odd = d.oddIdx!;
      steps.push(S("Compare the terms: one has different dimensions from the others. It is the odd one out.", "Conclusion", boxed(`\\text{odd one out: } ${terms[odd].tex}`)));
    } else {
      const m = d.missing!;
      const eqRows = ([0, 1, 2] as const).map((col) => {
        if (fzero(m.coef[col])) return null;
        const rest = m.rest[col];
        const tail = fzero(rest) ? "" : ` ${rest[0] < 0 ? "-" : "+"} ${frTex(fr(Math.abs(rest[0]), rest[1]))}`;
        return lab(BASE[col], `${eqLhsTex([m.coef[col]], ["n"])}${tail} = ${frTex(m.target[col])}`);
      }).filter((x): x is string => !!x);
      const nTerm = terms[skip];
      steps.push(S(`The term ${M(nTerm.tex.replace(/\^\{[^}]*\}/, "^{n}"))} must have the same dimensions as the others. Compare the powers of each base dimension.`, "Equate the dimensions", ...eqRows));
      steps.push(S(`Solve for ${M("n")}.`, "Answer", GAP, boxed(`n = ${frTex(m.value)}`)));
    }
    return steps;
  }

  // ── Find the powers ──
  const target = rows[0];
  const facs = rows.slice(1);
  const syms = d.unknowns;
  const steps: SolveStep[] = [];
  const ids = d.needs ?? [];
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
      steps.push(S(`Find the dimensions of ${M(r.sym)} from the units it is measured in.`, "Dimensions from the units", der.def[0], ...der.subst, ...der.sum));
    });
  } else if (d.via === "defs") {
    steps.push(...buildSteps(ids, c));
    // quantities that are given outright still need to be on the page
    c.stage();
  }
  // the model, with the dimensions put in, expanded and collected
  const model = `[${target.sym}] = ${facs.map((r, i) => `[${r.sym}]^{${symTex(syms[i])}}`).join("")}`;
  c.stage();
  steps.push(S(`${M("k")} has no dimensions, so the dimensions of the two sides must be the same. Write the model using brackets.`, "The model", model));
  const withPower = (r: DimRow, i: number) => {
    const t = dimTex(r.dim);
    const letters = r.dim.filter((e) => !fzero(e)).length;
    const bare = letters === 1 && feq(r.dim.find((e) => !fzero(e))!, ONE);
    return `${bare ? t : `(${t})`}^{${symTex(syms[i])}}`;
  };
  const substituted = facs.map(withPower).join("");
  const expanded = facs.map((r, i) => ([0, 1, 2] as const).filter((col) => !fzero(r.dim[col])).map((col) => `${BASE[col]}^{${feq(r.dim[col], ONE) ? "" : frTex(r.dim[col])}${symTex(syms[i])}}`).join("")).join("\\,");
  const collected = ([0, 1, 2] as const).map((col) => `${BASE[col]}^{${eqLhsTex(d.eqs[col].coef, syms)}}`).filter((_, col) => d.eqs[col].coef.some((x) => !fzero(x))).join("");
  steps.push(S("Put in the dimensions of each quantity.", "The model", al(dimTex(target.dim), substituted)));
  if (expanded !== substituted) steps.push(S("Raise each base dimension in a bracket to the power outside it.", "The model", ct(expanded)));
  steps.push(S("Collect the powers of each base dimension.", "The model", ct(collected)));
  // equate the powers
  c.stage(`${dimTex(target.dim)} = ${collected}`);
  d.eqs.forEach((e, col) => steps.push(S(`Compare the powers of ${BASE[col]} on the two sides.`, "Equate the powers", ...(col === 0 ? [GAP] : []), lab(BASE[col], `${eqLhsTex(e.coef, syms)} = ${frTex(e.rhs)}`))));

  if (d.ask === "cannot") {
    // two independent equations fix both powers; the third then disagrees
    for (let r1 = 0; r1 < 3; r1++) for (let r2 = r1 + 1; r2 < 3; r2++) {
      const res = solveLinear([d.eqs[r1].coef, d.eqs[r2].coef], [d.eqs[r1].rhs, d.eqs[r2].rhs]);
      if (res.status !== "unique") continue;
      const r3 = 3 - r1 - r2;
      const [a, b] = res.x;
      const lhs = fadd(fmul(d.eqs[r3].coef[0], a), fmul(d.eqs[r3].coef[1], b));
      c.stage(...d.eqs.map((e) => lab(BASE[e.col], `${eqLhsTex(e.coef, syms)} = ${frTex(e.rhs)}`)));
      steps.push(S(`Use the ${BASE[r1]} and ${BASE[r2]} equations to find both powers.`, "Solve", GAP, al(symTex(syms[0]), frTex(a)), al(symTex(syms[1]), frTex(b))));
      steps.push(S(`Put them into the ${BASE[r3]} equation: it does not hold.`, "Contradiction", GAP, lab(BASE[r3], `${frTex(lhs)} \\neq ${frTex(d.eqs[r3].rhs)}`)));
      steps.push(S("No values of the powers work, so the model cannot be right.", "Answer", GAP, boxed("\\text{no values work: the model cannot be right}")));
      return steps;
    }
    return steps;
  }

  // solve: an equation with one power left gives it, and the next uses it
  c.stage(...d.eqs.map((e) => lab(BASE[e.col], `${eqLhsTex(e.coef, syms)} = ${frTex(e.rhs)}`)));
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
    const out = [...(first ? [GAP] : []), ...(haveKnown ? [lab(BASE[e.col], `${withValues} = ${frTex(e.rhs)}`)] : []), al(symTex(syms[i]), expr), ...(expr !== frTex(v) ? [ct(frTex(v))] : [])];
    first = false;
    steps.push(S(haveKnown
      ? `Put the powers already found into the ${BASE[e.col]} equation, then solve for ${M(symTex(syms[i]))}.${fzero(v) ? " This power is zero: that quantity does not appear." : ""}`
      : `The ${BASE[e.col]} equation has only ${M(symTex(syms[i]))} in it: solve it.${fzero(v) ? " This power is zero: that quantity does not appear." : ""}`, "Solve", ...out));
  }
  if (val.some((v) => v === null)) {
    const res = solveLinear(d.eqs.map((e) => e.coef), d.eqs.map((e) => e.rhs));
    const pending = val.map((v, i) => (v === null ? i : -1)).filter((i) => i >= 0);
    if (res.status === "unique") res.x.forEach((v, i) => { if (val[i] === null) val[i] = v; });
    steps.push(S("Solve the remaining equations together: eliminate one power from a pair of equations, then another.", "Solve", ...(first ? [GAP] : []), ...pending.map((i) => al(symTex(syms[i]), frTex(val[i]!)))));
  }
  const answer = syms.map((s, i) => `${symTex(s)} = ${frTex(val[i]!)}`).join(",\\ ");
  steps.push(S("Check that every column adds up, then write the answer clearly.", "Answer", GAP, boxed(answer)));
  return steps;
}
