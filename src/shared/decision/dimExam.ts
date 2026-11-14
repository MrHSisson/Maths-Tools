// Dimensional Analysis: exam-style questions (specs/dimensional-analysis.md). Each question is a short chain of lettered parts with marks, a model answer, an
// AQA-style mark scheme and stepped working. Every part is a skill generator run on the question's own quantities, so the model answers and the working cannot
// drift from the skill tools. The situations (and the constants that feed them) are the same ~19 the Find the powers tool uses.
// All text is prose with maths between $…$; the model answers are the formal chains an examiner expects: [F] = [ma] = [m][a] = M × LT⁻² = MLT⁻².
import type { DecisionProblem, ExamMark, ExamPart, SolveStep } from "./types";
import { QBY, qDim, BASE, dimZero } from "./dim";
import { symTex, dimTex, frTex, andTex, eqLhsTex, numTex, M } from "./dimTex";
import {
  type DimProblemData, type DimQuestion, type Situation,
  SITUATIONS, CONST_RELATIONS, genDimsNameFor, genDimsConstFor, genConsistent, powersFromSituation, modelTex, joinAnd, pickOne, circleLine, shuffle,
} from "./dimGen";
import { solveDim, modelChains } from "./dimSolve";

export type DimChain = "circle" | "find" | "constant" | "consistent" | "models" | "zero";
export const DIM_CHAINS: DimChain[] = ["circle", "find", "constant", "consistent", "models", "zero"];

const m = (code: string, text: string): ExamMark => ({ code, text });
const asProblem = (data: DimProblemData, prompt: string): DecisionProblem => ({ dim: data, prompt, answer: { text: "" } }) as unknown as DecisionProblem;
const finalStep = (w: SolveStep[]): SolveStep | undefined => w[w.length - 1];
const the = (name: string): string => `${/^the /.test(name) ? "" : "the "}${name}`;
/** a situation factor's symbol: the library's, or the one the situation names */
const facSym = (f: Situation["factors"][number]): string => f[3] ?? QBY[f[0]].sym;

function part(label: string, prompt: string, scheme: ExamMark[], model: string[], data?: DimProblemData, practise?: ExamPart["practise"], partId?: string, explain?: string[]): ExamPart {
  const working = data ? solveDim(asProblem(data, prompt)) : undefined;
  return { label, prompt, marks: scheme.length, scheme, model, working, stepView: working ? finalStep(working) : undefined, practise, partId, explain };
}

/** the exam question as the shell expects it: the intro, the parts, and one picture (the grid of the question's main model) */
function build(chain: string, intro: string, parts: ExamPart[], main: DimProblemData, level: number): DecisionProblem {
  const totalMarks = parts.reduce((a, x) => a + x.marks, 0);
  return {
    kind: "dimExam", level, prompt: intro, answer: { text: "" }, matrixMode: "off", templateId: chain,
    dim: main,
    exam: { id: `dim-${chain}-${Math.random().toString(36).slice(2, 8)}`, intro, parts, totalMarks, minutes: Math.max(2, Math.ceil(totalMarks * 1.5)) },
  } as unknown as DecisionProblem;
}

/** the formal chain for a dimension question, one line of TeX each, as the model answer */
const chainModel = (d: DimProblemData): string[] => modelChains(d).map(M);

const stateDims = (qid: string, partLabel: string) => {
  const q = genDimsNameFor(qid, false, false);
  const tq = QBY[qid];
  return part(partLabel, `State the dimensions of ${tq.name} ${M(symTex(tq.sym))}.`, [m("B1", `States the dimensions of ${tq.name}: ${M(dimTex(qDim(qid)))}`)], chainModel(q.data), q.data, { subTool: "dims", options: {} }, "stateDims");
};

const modelIntro = (d: DimProblemData): string => `${d.context} It is suggested that ${M(d.formula!)}, where ${M("k")} is a dimensionless constant and ${andTex(d.unknowns)} are constants.`;
const powersScheme = (q: DimQuestion): ExamMark[] => [
  m("M1", "Forms equations by comparing the powers of M, L and T on both sides"),
  m("M1", "Obtains the value of at least one power from the equations"),
  m("A1", `Obtains all the correct powers: ${q.answerText}`),
];
/** the model answer for a find-the-powers part: the equations, then the powers */
const powersModel = (q: DimQuestion): string[] => [
  ...q.data.eqs.map((e) => M(`${e.col === 0 ? "M" : e.col === 1 ? "L" : "T"}: ${eqLine(e, q.data.unknowns)}`)),
  q.answerText,
];
const eqLine = (e: DimProblemData["eqs"][number], syms: string[]): string => `${eqLhsTex(e.coef, syms)} = ${frTex(e.rhs)}`;

// ── the chains ──────────────────────────────────────────────────────────────

/** 1 mark: circle the dimensions of a quantity, or the one consistent formula */
function exCircle(level: number): DecisionProblem {
  if (Math.random() < 0.3) {
    const q = genConsistent(2, "pick", true);
    const opts = q.data.options!;
    const intro = q.prompt.split(" Circle your answer:")[0];
    const p = part("(a)", circleLine(opts), [m("R1", `Circles the formula that is dimensionally consistent: ${q.answerText}`)], [q.answerText], q.data, { subTool: "consistent", options: { consAsk: "pick" } }, "circleFormula",
      opts.filter((o) => !o.correct).map((o) => `${M(o.text)}: ${o.why}`));
    return build("circle", intro, [p], q.data, level);
  }
  const q = genDimsNameFor(pickOne(["dens", "force", "mom", "imp", "energy", "power", "press", "omega", "stiff", "inertia"]), false, true);
  const opts = q.data.options!;
  const intro = q.prompt.split(" Circle your answer:")[0];
  const p = part("(a)", circleLine(opts), [m("B1", `Circles the correct dimensions: ${M(dimTex(q.data.answerDim!))}`)], chainModel(q.data), q.data, { subTool: "dims", options: { dimsForm: "circle" } }, "circleDims",
    opts.filter((o) => !o.correct).map((o) => `${M(o.text)}: ${o.why}`));
  return build("circle", intro, [p], q.data, level);
}

/** state the dimensions of a quantity, then find the powers in a model */
function exFind(level: number): DecisionProblem {
  // a quantity of the model whose dimensions are worked out from a definition (length, time and mass are base quantities, and speed and acceleration are given: nothing to work out)
  const askable = (sit: (typeof SITUATIONS)[number]) => [sit.target, ...sit.factors.map(([id]) => id)].filter((id) => QBY[id].def && !QBY[id].given);
  const sit = pickOne(SITUATIONS.filter((x) => askable(x).length > 0));
  const q = powersFromSituation(sit);
  const derived = askable(sit);
  const a = stateDims(pickOne(derived), "(a)");
  const b = part("(b)", `Use dimensional analysis to find the values of ${andTex(q.data.unknowns)}.`, powersScheme(q), powersModel(q), q.data, { subTool: "powers", options: { powCtx: "worded" } }, "findPowers");
  return build("find", modelIntro(q.data), [a, b], q.data, level);
}

// the constants that feed a model, with the situations that use them
const CONSTANT_PAIRS: Array<{ rel: number; sits: string[] }> = [
  { rel: 1, sits: ["orbit", "circ", "lifetime"] },
  { rel: 2, sits: ["compound"] },
];
/** show a constant's dimensions from a formula, then use them in a model */
function exConstant(level: number): DecisionProblem {
  const pair = pickOne(CONSTANT_PAIRS);
  const rel = CONST_RELATIONS[pair.rel];
  const sitId = pickOne(pair.sits);
  const sit = SITUATIONS.find((s) => s.id === sitId)!;
  const k = genDimsConstFor(rel, false);
  const kd = dimTex(k.data.answerDim!);
  const ks = symTex(rel.kSym);
  const numMark = rel.num ? [m("B1", `States that the number is dimensionless: ${M(`[${numTex(rel.num)}] = 1`)}`)] : [];
  // a "show that" question: the method, then a rigorous argument (current Q14(a): M1 R1); a number in the formula earns a mark of its own (current Q5: B1 for [2π] = 1)
  const a = part("(a)", `Show that ${M(ks)} has dimensions ${M(kd)}.`, [
    ...numMark,
    m("M1", `Uses dimensional analysis on the formula to find the dimensions of ${M(ks)}`),
    m("R1", `Completes a rigorous argument, using the dimensions of each quantity, to show that ${M(`[${ks}] = ${kd}`)}`),
  ], chainModel(k.data), k.data, { subTool: "dims", options: { dimsAsk: "constant" } }, "showConstant");
  const q = powersFromSituation(sit);
  const b = part("(b)", `${modelIntro(q.data)} Find the values of ${andTex(q.data.unknowns)}.`, powersScheme(q), powersModel(q), q.data, { subTool: "powers", options: { powCtx: "worded" } }, "findPowers");
  return build("constant", rel.text, [a, b], q.data, level);
}

/** show a formula is consistent, then find the dimensions of a constant (and what it represents) */
function exConsistent(level: number): DecisionProblem {
  const q = genConsistent(2, "show", true);
  const d = q.data;
  const dim = dimTex(d.answerDim!);
  const chain = `${d.rows.map((r) => `[${r.sym}]`).join(" = ")} = ${dim}`;
  // current Q12 (4 marks): B1 recalls the dimensions, E1 says a number such as ½ or 2 is dimensionless, M1 substitutes, R1 completes the argument (legacy Q1 ends on E1)
  const hasNumber = !!d.terms?.some((t) => t.num);
  const a = part("(a)", "Show that the formula is dimensionally consistent. Fully justify your answer.", [
    m("B1", "Recalls the dimensions of the quantities in the formula"),
    ...(hasNumber ? [m("E1", `Explains that a number in the formula (such as ${M("\\frac{1}{2}")} or ${M("2")}) is dimensionless`)] : []),
    m("M1", "Substitutes the dimensions of the quantities into each term"),
    m("R1", `Completes a reasoned argument that every term has dimensions ${M(dim)}, so the formula is dimensionally consistent`),
  ], [...chainModel(d), `${M(chain)}, so the formula is dimensionally consistent.`], d, { subTool: "consistent", options: { consAsk: "show" } }, "showConsistent");
  const c = genDimsConstFor(pickOne(CONST_RELATIONS), false);
  const rep = c.data.represents;
  const kd = c.data.answerDim!;
  const cprompt = rep ? `${c.prompt.replace(/\.$/, "")} and state what quantity it could represent.` : c.prompt;
  const ks = c.data.formula!;
  // finding a constant's dimensions: the number's dimension, the method, the answer; and (legacy Q7, current Q7b) a mark for what it represents
  const b = part("(b)", cprompt, [
    ...(c.data.relNum ? [m("B1", `States that the number is dimensionless: ${M(`[${numTex(c.data.relNum)}] = 1`)}`)] : []),
    m("M1", `Uses dimensional analysis to find the dimensions of ${M(ks)}`),
    m("A1", `Obtains ${M(`[${ks}] = ${dimZero(kd) ? "1" : dimTex(kd)}`)}`),
    ...(rep ? [m("E1", `Deduces that ${M(ks)} could represent ${rep}`)] : []),
  ], [...chainModel(c.data), ...(rep ? [`${M(ks)} could represent ${rep}`] : [])], c.data, { subTool: "dims", options: { dimsAsk: "constant" } }, "constantDims");
  return build("consistent", `${q.prompt.split(" Show that")[0]} A student suggests the formula ${M(d.formula!)}.`, [a, b], d, level);
}

/** the situations where one quantity's power must be zero because nothing else carries one of its base dimensions */
const carriedAlone = (s: Situation): { idx: number; col: number } | null => {
  const idx = s.factors.findIndex(([, n]) => n === 0);
  if (idx < 0) return null;
  const dz = qDim(s.factors[idx][0]);
  const tdim = qDim(s.target);
  for (let c = 0; c < 3; c++) {
    if (dz[c][0] === 0 || tdim[c][0] !== 0) continue;
    if (s.factors.every(([id], i) => i === idx || qDim(id)[c][0] === 0)) return { idx, col: c };
  }
  return null;
};
const MODEL_SITS = SITUATIONS.filter((s) => carriedAlone(s));

/** two students' models: reject the one with a quantity that cannot appear, then find the powers for the other */
function exModels(level: number): DecisionProblem {
  const sit = pickOne(MODEL_SITS);
  const { idx, col } = carriedAlone(sit)!;
  const tq = QBY[sit.target];
  const tsym = sit.sym ?? tq.sym;
  const full = powersFromSituation(sit);
  const kept = powersFromSituation(sit, { drop: idx });
  const zq = QBY[sit.factors[idx][0]];
  const zsym = facSym(sit.factors[idx]);
  const symsFull = full.data.unknowns;
  const facs = sit.factors.map((f) => ({ sym: facSym(f) }));
  const withModel = modelTex(tsym, facs, symsFull, true);
  const withoutModel = modelTex(tsym, facs.filter((_, i) => i !== idx), kept.data.unknowns, true);
  const [s1, s2] = shuffle(["Anna", "Ben"]);
  const names = sit.factors.map((f) => `${the(QBY[f[0]].name)} ${M(symTex(facSym(f)))}`);
  const intro = `Two students propose models for ${the(tq.name)} ${M(symTex(tsym))}, which is thought to depend on ${joinAnd(names)}. ${s1} thinks that ${M(withModel)}. ${s2} thinks that ${M(symTex(tsym))} does not depend on ${the(zq.name)} ${M(symTex(zsym))} and suggests ${M(withoutModel)}. In each model the powers are constants.`;
  const a = part("(a)", "By considering dimensions, explain which student's model should be rejected.", [
    m("M1", `Shows that the power of ${M(symTex(zsym))} is 0 by considering the dimensions: it is the only quantity with dimension ${M(BASE[col])}`),
    m("A1", `Rejects ${s1}'s model, because ${M(symTex(tsym))} is shown not to depend on ${M(symTex(zsym))}`),
  ], [`${s1}'s model should be rejected. ${the(zq.name)[0].toUpperCase()}${the(zq.name).slice(1)} ${M(symTex(zsym))} is the only quantity with dimension ${M(BASE[col])}, and ${M(symTex(tsym))} has none, so nothing could cancel it: its power would have to be 0.`], full.data, { subTool: "powers", options: { powAsk: "zero" } }, "explainReject");
  const b = part("(b)", `Find the values of ${andTex(kept.data.unknowns)} for the model that you did not reject, so that it is dimensionally consistent.`, [
    m("M1", "Forms equations by comparing the powers of the base dimensions"),
    m("A1", `Obtains the correct powers: ${kept.answerText}`),
  ], powersModel(kept), kept.data, { subTool: "powers", options: { powCtx: "worded" } }, "findPowers");
  return build("models", intro, [a, b], kept.data, level);
}

/** show a power is zero, then find the others */
function exZero(level: number): DecisionProblem {
  const sit = pickOne(SITUATIONS.filter((s) => s.factors.some(([, n]) => n === 0)));
  const q = powersFromSituation(sit, { ask: "zero" });
  const d = q.data;
  const zs = d.unknowns[d.zeroIdx!];
  const others = d.unknowns.filter((_, i) => i !== d.zeroIdx);
  const zf = sit.factors[d.zeroIdx!];
  const zq = QBY[zf[0]];
  const otherAnswers = others.map((s) => `${symTex(s)} = ${frTex(d.answerPowers[d.unknowns.indexOf(s)])}`).join(",\\ ");
  const a = part("(a)", `Show that ${M(`${symTex(zs)} = 0`)}.`, [
    m("M1", "Forms equations by comparing the powers of the base dimensions"),
    m("A1", `Obtains ${M(`${symTex(zs)} = 0`)} from the equations`),
    m("E1", `Explains that ${the(zq.name)} ${M(symTex(facSym(zf)))} does not appear in the formula`),
  ], [...powersModel(q).slice(0, 3), `${M(`${symTex(zs)} = 0`)}, so ${the(zq.name)} ${M(symTex(facSym(zf)))} does not appear.`], d, { subTool: "powers", options: { powAsk: "zero" } }, "showZero");
  const b = part("(b)", `Find the values of ${andTex(others)}.`, [
    m("M1", "Forms equations by comparing the powers of M, L and T on both sides"),
    m("M1", "Obtains the value of one of the other powers"),
    m("A1", `Obtains both: ${M(otherAnswers)}`),
  ], [M(otherAnswers)], d, { subTool: "powers", options: { powCtx: "worded" } }, "findPowers");
  return build("zero", modelIntro(d), [a, b], d, level);
}

const BUILD: Record<DimChain, (level: number) => DecisionProblem> = { circle: exCircle, find: exFind, constant: exConstant, consistent: exConsistent, models: exModels, zero: exZero };
/** an exam-style question of one chain, or a mixed one ("any") */
export function generateDimExam(level: number, chain: DimChain | "any"): DecisionProblem {
  const c = chain === "any" ? pickOne(DIM_CHAINS) : chain;
  return BUILD[c](level);
}
