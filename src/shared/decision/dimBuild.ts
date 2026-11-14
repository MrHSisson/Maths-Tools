// Dimensional Analysis: building a quantity's dimensions up from a few GIVEN ones, the way a student would write it.
// The page opens with what may be taken as known (lengths, time, mass, speed and acceleration). Any other quantity is built from them, in its own few lines, after
// the formula it comes from has been stated: F = ma, so [F] = [ma] = [m][a] = M × LT⁻² = MLT⁻². Nothing appears out of nowhere.
import { type Fr, type Dim3, QBY, BASE, qDim, unitsDim, fr, fmul, fadd, fsub, fzero, feq, dimOf, ONE, ZERO, dimScale } from "./dim";
import { symTex, supTex, frTex, dimTex, dimPowTex, productTex, brTex, numTex } from "./dimTex";
/** why a plain number has no dimensions */
export const NUMBER_WHY = "a dimensionless constant";

// ── rows of the written page ────────────────────────────────────────────────────────────────
/** "[F] &= [ma]": the left part, then the aligned equals */
export const al = (l: string, r: string): string => `${l} &= ${r}`;
/** "&= [m][a]": a continuation, aligned under the first equals */
export const ct = (r: string): string => `&= ${r}`;
/** "M: & α + β = 0": a labelled equation (the label is plain text) */
export const lab = (label: string, tex: string): string => `\\text{${label}:} & \\ ${tex}`;
/** a small plain-text heading on the page ("#Dimensions of force") */
export const head = (text: string): string => `#${text}`;
/** a formula stated before it is used */
export const formulaRow = (tex: string): string => `\\text{Formula:}\\ ${tex}`;
export const GAP = "";
export const boxed = (tex: string): string => `\\boxed{${tex}}`;

// ── what is given ───────────────────────────────────────────────────────────────────────────
/** lengths (however named), time, mass, speed and acceleration: the quantities whose dimensions may be taken as known */
export const GIVEN_IDS = ["len", "hgt", "rad", "dep", "ext", "opp", "adj", "hyp", "trigf", "time", "mass", "speed", "acc", "grav"];
/** the given set the page opens with, as "[l] = L" items */
export const BASE_GIVEN = ["len", "time", "mass", "speed", "acc"];
export const GIVEN_ITEMS: string[] = BASE_GIVEN.map((id) => `[${symTex(QBY[id].sym)}] = ${dimTex(qDim(id))}`);
/** the base units, which stand for the base dimensions */
const BASE_UNITS: Record<string, Dim3> = { kg: unitsDim("kg"), m: unitsDim("m"), s: unitsDim("s") };
/** derived units are built from base ones: a newton is a kg m s⁻² */
const UNIT_DEFS: Record<string, Array<[string, number]>> = {
  N: [["kg", 1], ["m", 1], ["s", -2]], J: [["N", 1], ["m", 1]], W: [["J", 1], ["s", -1]], Pa: [["N", 1], ["m", -2]], Hz: [["s", -1]],
};
const UNIT_FORMULA: Record<string, string> = {
  N: "\\mathrm{N} = \\mathrm{kg}\\,\\mathrm{m}\\,\\mathrm{s}^{-2}", J: "\\mathrm{J} = \\mathrm{N}\\,\\mathrm{m}", W: "\\mathrm{W} = \\mathrm{J}\\,\\mathrm{s}^{-1}",
  Pa: "\\mathrm{Pa} = \\mathrm{N}\\,\\mathrm{m}^{-2}", Hz: "\\mathrm{Hz} = \\mathrm{s}^{-1}",
};
const UNIT_SAY: Record<string, string> = {
  N: "a newton is a kilogram metre per second squared", J: "a joule is a newton metre", W: "a watt is a joule per second",
  Pa: "a pascal is a newton per square metre", Hz: "a hertz is one per second",
};
const unitTex = (u: string): string => `\\mathrm{${u}}`;

/** a quantity or derived unit can be taken as known without building */
export const isGiven = (key: string): boolean => (key.startsWith("u:") ? key.slice(2) in BASE_UNITS : GIVEN_IDS.includes(key));
/** how the dimensions of a key are written: "[a]" for a quantity, "[\mathrm{N}]" for a unit */
const keyBr = (key: string): string => (key.startsWith("u:") ? `[${unitTex(key.slice(2))}]` : `[${symTex(QBY[key].sym)}]`);
/** what a key is called in words */
export const keyName = (key: string): string => (key.startsWith("u:") ? `the ${key.slice(2) === "N" ? "newton" : key.slice(2) === "J" ? "joule" : key.slice(2) === "W" ? "watt" : key.slice(2) === "Pa" ? "pascal" : "hertz"}` : QBY[key].name);

export interface Piece { br: string; dim: Dim3; exp: Fr; /** why it has no dimensions ("a dimensionless constant"): stated in the working as "[2] = 1" */ dimless?: string }
interface BuildItem { key: string; lhs: string; expr: string; pieces: Piece[]; dim: Dim3; formula: string; say: string }
const NO_DIM: Dim3 = dimOf(0, 0, 0);
/** what a non-given quantity (or derived unit) is built from, with the formula it comes from; null for a given one */
export function buildItem(key: string): BuildItem | null {
  if (isGiven(key)) return null;
  if (key.startsWith("u:")) {
    const u = key.slice(2);
    const def = UNIT_DEFS[u];
    if (!def) return null;
    const pieces = def.map(([x, p]): Piece => ({ br: `[${unitTex(x)}]`, dim: unitsDim(x), exp: fr(p) }));
    return { key, lhs: keyBr(key), expr: def.map(([x, p]) => `${unitTex(x)}${p === 1 ? "" : `^{${p}}`}`).join("\\,"), pieces, dim: unitsDim(u), formula: UNIT_FORMULA[u], say: UNIT_SAY[u] };
  }
  const q = QBY[key];
  if (!q.def) return null;
  const pieces = q.def.map(([f, p]): Piece => ({ br: keyBr(f), dim: qDim(f), exp: fr(p) }));
  // a number in the formula (the half of kinetic energy) has no dimensions, and is written as such
  if (q.num) pieces.unshift({ br: `[${numTex(q.num)}]`, dim: NO_DIM, exp: ONE, dimless: NUMBER_WHY });
  const expr = (q.num ?? "") + productTex(q.def.map(([f, p]) => ({ sym: QBY[f].sym, p: fr(p) })));
  return { key, lhs: keyBr(key), expr, pieces, dim: qDim(key), formula: q.formula ?? "", say: q.say ?? q.name };
}
/** the quantities (or units) that must be built, dependencies first, each once */
export function buildOrder(keys: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const visit = (key: string) => {
    if (isGiven(key) || seen.has(key)) return;
    seen.add(key);
    const item = buildItem(key);
    if (!item) return;
    // a definition's own parts are built first
    if (key.startsWith("u:")) (UNIT_DEFS[key.slice(2)] ?? []).forEach(([x]) => visit(`u:${x}`));
    else (QBY[key].def ?? []).forEach(([f]) => visit(f));
    out.push(key);
  };
  keys.forEach(visit);
  return out;
}

// ── a derivation, in the rows a student writes ──────────────────────────────────────────────
export interface Derivation {
  /** a number or argument with no dimensions, stated before it is used: "[2] = 1 as it is a dimensionless constant" */
  note: string[];
  /** the formula it comes from, stated first ("Formula: F = ma"); empty when the question gave it */
  formula: string[];
  /** what it is written as, in brackets: "[F] = [ma] = [m][a]" (two rows when the expression differs from the brackets); a division stays a fraction: "[F]/[A]" */
  def: string[];
  /** the known dimensions put in: "= M × LT^{-2}", or "= (MLT^{-2}) / (L^{2})" for a division */
  subst: string[];
  /** each bracketed power expanded: "(LT^{-1})^{2} = L^{2}T^{-2}", when there is one */
  expand: string[];
  /** a division with a negative power on the bottom: top and bottom each combined to one power per letter ("= ML^{2}T^{-2} / L^{3}T^{-1}") */
  tidy: string[];
  /** …then the bottom powers taken from the top, written out ("= ML^{2-3}T^{-2-(-1)}"), so a minus-a-minus is never done in the head */
  subtract: string[];
  /** a division only: the fraction cancelled down ("= MT^{-2} / L"), before it is written with negative powers */
  cancel: string[];
  /** the powers added, then the result: "= L^{1}T^{-1-1}", "= LT^{-2}"; for a division, the result written with negative powers */
  sum: string[];
  /** the working divides: it is written as a fraction and cancelled, and the negative powers come last */
  divides: boolean;
}
/** a bracketed dimension to a power is worked out by raising each base dimension in it to that power */
const multiLetter = (d: Dim3): boolean => d.filter((e) => !fzero(e)).length > 1 || (d.filter((e) => !fzero(e)).length === 1 && !feq(d.find((e) => !fzero(e))!, ONE));
const frac = (n: string, d: string): string => `\\frac{${n || "1"}}{${d}}`;
/** the working of "lhs = [expr] = product of brackets = product of dimensions = (expanded) = sum of powers = result" in aligned rows.
 *  A division is kept as a fraction, which is easier to cancel than a negative power is to get right; the negative powers come only at the very end. */
export function derive(lhs: string, expr: string | null, pieces: Piece[], result: Dim3, formula?: string): Derivation {
  const divides = pieces.some((p) => p.exp[0] < 0);
  const top = pieces.filter((p) => p.exp[0] >= 0);
  const bottom = pieces.filter((p) => p.exp[0] < 0);
  const absExp = (p: Piece): Fr => (p.exp[0] < 0 ? fr(-p.exp[0], p.exp[1]) : p.exp);
  const joinT = (xs: string[]): string => xs.join(" \\times ");
  const brs = divides
    ? frac(top.map((p) => `${p.br}${supTex(p.exp)}`).join(""), bottom.map((p) => `${p.br}${supTex(absExp(p))}`).join(""))
    : pieces.map((p) => `${p.br}${supTex(p.exp)}`).join("");
  const note = [...new Map(pieces.filter((p) => p.dimless).map((p) => [p.br, `${p.br} = 1 \\quad \\text{as it is ${p.dimless}}`])).values()];
  const def = expr ? [al(lhs, brTex(expr)), ct(brs)] : [al(lhs, brs)];
  const dims = divides
    ? frac(joinT(top.map((p) => dimPowTex(p.dim, p.exp))), joinT(bottom.map((p) => dimPowTex(p.dim, absExp(p)))))
    : joinT(pieces.map((p) => dimPowTex(p.dim, p.exp)));
  const subst = [ct(dims)];
  // a bracket with a power outside it is expanded: (LT^{-1})^{2} becomes L^{2}T^{-2}
  const expand: string[] = [];
  const expanded = (p: Piece, e: Fr): string => (feq(e, ONE) ? dimPowTex(p.dim, e) : fzero(p.dim[0]) && fzero(p.dim[1]) && fzero(p.dim[2]) ? "1" : dimTex(dimScale(p.dim, e)));
  if (pieces.some((p) => !feq(absExp(p), ONE) && multiLetter(p.dim))) {
    const ex = divides ? frac(joinT(top.map((p) => expanded(p, p.exp))), joinT(bottom.map((p) => expanded(p, absExp(p))))) : joinT(pieces.map((p) => expanded(p, p.exp)));
    if (`&= ${ex}` !== subst[0]) expand.push(ct(ex));
  }
  const cancel: string[] = [];
  const tidy: string[] = [];
  const subtract: string[] = [];
  const sum: string[] = [];
  const final = ct(dimTex(result));
  if (divides) {
    // numerator and denominator as a power of each base letter; a letter on both sides is cancelled
    const N = [ZERO, ZERO, ZERO], D = [ZERO, ZERO, ZERO];
    for (const p of top) for (let c = 0; c < 3; c++) N[c] = fadd(N[c], fmul(p.dim[c], p.exp));
    for (const p of bottom) for (let c = 0; c < 3; c++) D[c] = fadd(D[c], fmul(p.dim[c], absExp(p)));
    // cancel and combine: each letter ends up on the top (net power above zero) or on the bottom (below zero), with a positive power either way
    const net = [0, 1, 2].map((c) => fsub(N[c], D[c]));
    const letters = (v: Fr[]): string => v.map((e, c) => (fzero(e) ? "" : BASE[c] + (feq(e, ONE) ? "" : `^{${frTex(e)}}`))).join("");
    const n = letters(net.map((e) => (e[0] > 0 ? e : ZERO)));
    const dn = letters(net.map((e) => (e[0] < 0 ? fr(-e[0], e[1]) : ZERO)));
    const row = ct(dn ? frac(n, dn) : n || "1");
    const prior = expand.length ? expand[expand.length - 1] : subst[0];
    if (D.some((e) => e[0] < 0)) {
      // dividing by a negative power is the hard part to see: write the top and bottom as one power per letter, then the subtraction in full
      const tidyRow = ct(frac(letters(N) || "1", letters(D)));
      if (tidyRow !== prior) tidy.push(tidyRow);
      const sub = [0, 1, 2].map((c) => {
        if (fzero(N[c]) && fzero(D[c])) return "";
        if (fzero(D[c])) return BASE[c] + (feq(N[c], ONE) ? "" : `^{${frTex(N[c])}}`);
        const d = D[c][0] < 0 ? `(${frTex(D[c])})` : frTex(D[c]);
        return `${BASE[c]}^{${fzero(N[c]) ? "" : frTex(N[c])}-${d}}`;
      }).join("\\,");
      subtract.push(ct(sub));
      if (final !== subtract[0]) sum.push(final);
    } else {
      if (row !== prior) cancel.push(row);
      const before = cancel.length ? cancel[cancel.length - 1] : prior;
      if (final !== before) sum.push(final);
    }
  } else {
    // the powers of each base dimension that each piece adds, when some dimension gets two or more
    const cols = ([0, 1, 2] as const).map((c) => pieces.map((p) => fmul(p.dim[c], p.exp)).filter((e) => !fzero(e)));
    if (cols.some((l) => l.length >= 2)) {
      sum.push(ct(cols.map((l, c) => (l.length ? `${BASE[c]}^{${l.map((e, i) => (i === 0 ? frTex(e) : e[0] < 0 ? `(${frTex(e)})` : frTex(e))).join(" + ")}}` : "")).join("")));
    }
    const prior = sum.length ? sum[sum.length - 1] : expand.length ? expand[expand.length - 1] : subst[0];
    if (final !== prior) sum.push(final);
  }
  return { note, formula: formula ? [formulaRow(formula)] : [], def, subst, expand, tidy, subtract, cancel, sum, divides };
}
/** a derivation as one flat chain "[a] = [v/t] = [v][t]^{-1} = LT^{-1} \times T^{-1} = LT^{-2}", for the model answer */
export function flatChain(rows: string[]): string {
  return rows.map((r) => r.replace(/^&= /, "").replace(" &= ", " = ")).join(" = ");
}
