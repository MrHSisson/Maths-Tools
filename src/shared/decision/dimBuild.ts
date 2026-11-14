// Dimensional Analysis: building a quantity's dimensions up from a few GIVEN ones, the way a student would write it.
// The page opens with what may be taken as known (lengths, time, mass and speed). Any other quantity is built from them, in its own few lines, before it is
// used: [a] = [v/t] = [v][t]⁻¹ = LT⁻¹ × T⁻¹ = LT⁻². Nothing appears out of nowhere.
import { type Fr, type Dim3, QBY, BASE, qDim, unitsDim, fr, fmul, fzero } from "./dim";
import { symTex, supTex, frTex, dimTex, dimPowTex, productTex } from "./dimTex";

// ── rows of the written page ────────────────────────────────────────────────────────────────
/** "[F] &= [ma]": the left part, then the aligned equals */
export const al = (l: string, r: string): string => `${l} &= ${r}`;
/** "&= [m][a]": a continuation, aligned under the first equals */
export const ct = (r: string): string => `&= ${r}`;
/** "M: & α + β = 0": a labelled equation (the label is plain text) */
export const lab = (label: string, tex: string): string => `\\text{${label}:} & \\ ${tex}`;
export const GAP = "";
export const boxed = (tex: string): string => `\\boxed{${tex}}`;

// ── what is given ───────────────────────────────────────────────────────────────────────────
/** lengths (however named), time, mass and speed: the quantities whose dimensions may be taken as known */
export const GIVEN_IDS = ["len", "hgt", "rad", "dep", "ext", "time", "mass", "speed"];
/** the given set the page opens with, as "[l] = L" items */
export const GIVEN_ITEMS: string[] = ["len", "time", "mass", "speed"].map((id) => `[${symTex(QBY[id].sym)}] = ${dimTex(qDim(id))}`);
/** the base units, which stand for the base dimensions */
const BASE_UNITS: Record<string, Dim3> = { kg: unitsDim("kg"), m: unitsDim("m"), s: unitsDim("s") };
/** derived units are built from base ones: a newton is a kg m s⁻² */
const UNIT_DEFS: Record<string, Array<[string, number]>> = {
  N: [["kg", 1], ["m", 1], ["s", -2]], J: [["N", 1], ["m", 1]], W: [["J", 1], ["s", -1]], Pa: [["N", 1], ["m", -2]], Hz: [["s", -1]],
};
const UNIT_WORDS: Record<string, string> = { N: "a newton is a kilogram metre per second squared", J: "a joule is a newton metre", W: "a watt is a joule per second", Pa: "a pascal is a newton per square metre", Hz: "a hertz is one per second" };
const unitTex = (u: string): string => `\\mathrm{${u}}`;

/** a quantity or a derived unit can be taken as known without building */
export const isGiven = (key: string): boolean => (key.startsWith("u:") ? key.slice(2) in BASE_UNITS : GIVEN_IDS.includes(key));
/** how the dimensions of a key are written: "[a]" for a quantity, "[\mathrm{N}]" for a unit */
const keyBr = (key: string): string => (key.startsWith("u:") ? `[${unitTex(key.slice(2))}]` : `[${symTex(QBY[key].sym)}]`);

export interface Piece { br: string; dim: Dim3; exp: Fr }
interface BuildItem { key: string; lhs: string; expr: string; pieces: Piece[]; dim: Dim3; words: string }
/** what a non-given quantity (or derived unit) is built from; null for a given one */
export function buildItem(key: string): BuildItem | null {
  if (isGiven(key)) return null;
  if (key.startsWith("u:")) {
    const u = key.slice(2);
    const def = UNIT_DEFS[u];
    if (!def) return null;
    const pieces = def.map(([x, p]): Piece => ({ br: `[${unitTex(x)}]`, dim: unitsDim(x), exp: fr(p) }));
    return { key, lhs: keyBr(key), expr: def.map(([x, p]) => `${unitTex(x)}${p === 1 ? "" : `^{${p}}`}`).join("\\,"), pieces, dim: unitsDim(u), words: UNIT_WORDS[u] ?? u };
  }
  const q = QBY[key];
  if (!q.def) return null;
  const pieces = q.def.map(([f, p]): Piece => ({ br: keyBr(f), dim: qDim(f), exp: fr(p) }));
  return { key, lhs: keyBr(key), expr: productTex(q.def.map(([f, p]) => ({ sym: QBY[f].sym, p: fr(p) }))), pieces, dim: qDim(key), words: q.defText ?? q.name };
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
  /** what it is defined as, in brackets: "[a] = [v/t] = [v][t]^{-1}" (two rows when the expression differs from the brackets) */
  def: string[];
  /** the known dimensions put in: "= LT^{-1} \times T^{-1}" */
  subst: string[];
  /** the powers added, then the result: "= L^{1}T^{-1-1}", "= LT^{-2}" (the result alone when nothing is added) */
  sum: string[];
}
/** the working of "lhs = [expr] = product of brackets = product of dimensions = sum of powers = result" in aligned rows */
export function derive(lhs: string, expr: string | null, pieces: Piece[], result: Dim3): Derivation {
  const brs = pieces.map((p) => `${p.br}${supTex(p.exp)}`).join("");
  const def = expr ? [al(lhs, `[${expr}]`), ct(brs)] : [al(lhs, brs)];
  const dims = pieces.map((p) => dimPowTex(p.dim, p.exp)).join(" \\times ");
  const subst = [ct(dims)];
  const sum: string[] = [];
  // the powers of each base dimension that each piece adds, when some dimension gets two or more
  const cols = ([0, 1, 2] as const).map((c) => pieces.map((p) => fmul(p.dim[c], p.exp)).filter((e) => !fzero(e)));
  if (cols.some((l) => l.length >= 2)) {
    sum.push(ct(cols.map((l, c) => (l.length ? `${BASE[c]}^{${l.map((e, i) => (i === 0 ? frTex(e) : e[0] < 0 ? `(${frTex(e)})` : frTex(e))).join(" + ")}}` : "")).join("")));
  }
  const final = ct(dimTex(result));
  if (final !== subst[0] && final !== sum[sum.length - 1]) sum.push(final);
  return { def, subst, sum };
}
/** a derivation as one flat chain "[a] = [v/t] = [v][t]^{-1} = LT^{-1} \times T^{-1} = LT^{-2}", for the model answer */
export function flatChain(rows: string[]): string {
  return rows.map((r) => r.replace(/^&= /, "").replace(" &= ", " = ")).join(" = ");
}
