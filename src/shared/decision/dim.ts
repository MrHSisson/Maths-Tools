// Dimensional Analysis (Further Mechanics MA): the maths, with no React. See specs/dimensional-analysis.md.
// Dimensions are exponent triples (M, L, T); the powers a model asks for are rationals (halves, thirds), so everything here is exact fractions.
// The quantity library, the true formulas and the worded situations are the data every question is built from; the generators (dimGen.ts) pick
// from them equations-first, and the working (dimSolve.ts) and the exam chains (dimExam.ts) are built on the same numbers.

// ── Fractions ────────────────────────────────────────────────────────────────
export type Fr = readonly [number, number];
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
export const fr = (n: number, d = 1): Fr => {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1;
  return [n / g, d / g];
};
export const ZERO: Fr = [0, 1];
export const ONE: Fr = [1, 1];
export const fadd = (a: Fr, b: Fr): Fr => fr(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
export const fsub = (a: Fr, b: Fr): Fr => fr(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
export const fmul = (a: Fr, b: Fr): Fr => fr(a[0] * b[0], a[1] * b[1]);
export const fdiv = (a: Fr, b: Fr): Fr => fr(a[0] * b[1], a[1] * b[0]);
export const fneg = (a: Fr): Fr => fr(-a[0], a[1]);
export const feq = (a: Fr, b: Fr): boolean => a[0] === b[0] && a[1] === b[1];
export const fzero = (a: Fr): boolean => a[0] === 0;
export const fint = (a: Fr): boolean => a[1] === 1;

const VULGAR: Record<string, string> = { "1/2": "½", "1/3": "⅓", "2/3": "⅔", "1/4": "¼", "3/4": "¾" };
/** "2", "−1", "½", "−⅓", "3⁄2" */
export function fstr(a: Fr): string {
  const neg = a[0] < 0;
  const n = Math.abs(a[0]);
  const body = a[1] === 1 ? String(n) : VULGAR[`${n}/${a[1]}`] ?? `${n}⁄${a[1]}`;
  return (neg ? "−" : "") + body;
}
const SUP: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
/** an exponent as a superscript: integers as ², ⁻¹; a fraction as ^½ */
export const sup = (a: Fr): string => (fint(a) ? String(a[0]).split("").map((c) => SUP[c] ?? c).join("") : `^${fstr(a)}`);

// ── Dimensions ───────────────────────────────────────────────────────────────
export type Dim3 = readonly [Fr, Fr, Fr];
export const BASE = ["M", "L", "T"] as const;
export const dimOf = (m: number, l: number, t: number): Dim3 => [fr(m), fr(l), fr(t)];
export const dimZero = (d: Dim3): boolean => d.every(fzero);
export const dimEq = (a: Dim3, b: Dim3): boolean => a.every((x, i) => feq(x, b[i]));
export const dimAdd = (a: Dim3, b: Dim3): Dim3 => [fadd(a[0], b[0]), fadd(a[1], b[1]), fadd(a[2], b[2])];
export const dimSub = (a: Dim3, b: Dim3): Dim3 => [fsub(a[0], b[0]), fsub(a[1], b[1]), fsub(a[2], b[2])];
export const dimScale = (a: Dim3, k: Fr): Dim3 => [fmul(a[0], k), fmul(a[1], k), fmul(a[2], k)];
/** "ML²T⁻²"; "1" for a dimensionless quantity */
export function dimStr(d: Dim3): string {
  const s = d.map((e, i) => (fzero(e) ? "" : BASE[i] + (feq(e, ONE) ? "" : sup(e)))).join("");
  return s || "1";
}
/** "[ρ] = ML⁻³" */
export const bracket = (sym: string, d: Dim3): string => `[${sym}] = ${dimStr(d)}`;

// ── The quantity library ─────────────────────────────────────────────────────
export interface Quantity {
  id: string;
  /** "density" */
  name: string;
  sym: string;
  dim: readonly [number, number, number];
  /** how it is measured, in the units the papers give ("kg m⁻³"); a test checks they give `dim` */
  units?: string;
  /** what it is defined as, in terms of other quantities (id, power): a test checks this gives `dim`, so the library is checked from first principles */
  def?: ReadonlyArray<readonly [string, number]>;
  /** the formula the definition comes from, as TeX ("F = ma"), stated before it is used */
  formula?: string;
  /** what a teacher says about it ("Newton's second law: force is mass times acceleration") */
  say?: string;
  /** a number in the formula, with no dimensions (the ½ of kinetic energy), as TeX */
  num?: string;
}
const Q = (id: string, name: string, sym: string, dim: [number, number, number], units?: string, def?: Array<[string, number]>, extra: { formula?: string; say?: string; num?: string } = {}): Quantity =>
  ({ id, name, sym, dim, units, def, ...extra });

export const LIBRARY: Quantity[] = [
  Q("len", "length", "l", [0, 1, 0], "m"),
  Q("hgt", "height", "h", [0, 1, 0], "m"),
  Q("rad", "radius", "r", [0, 1, 0], "m"),
  Q("dep", "depth", "d", [0, 1, 0], "m"),
  Q("ext", "extension", "x", [0, 1, 0], "m"),
  Q("time", "time", "t", [0, 0, 1], "s"),
  Q("mass", "mass", "m", [1, 0, 0], "kg"),
  Q("speed", "speed", "v", [0, 1, -1], "m s⁻¹", [["len", 1], ["time", -1]], { formula: "v = \\frac{s}{t}", say: "speed is distance divided by time" }),
  Q("acc", "acceleration", "a", [0, 1, -2], "m s⁻²", [["speed", 1], ["time", -1]], { formula: "a = \\frac{v}{t}", say: "acceleration is the change in speed divided by time" }),
  Q("grav", "acceleration due to gravity", "g", [0, 1, -2], "m s⁻²", [["speed", 1], ["time", -1]], { formula: "g = \\frac{v}{t}", say: "acceleration due to gravity is an acceleration, the change in speed divided by time" }),
  Q("area", "area", "A", [0, 2, 0], "m²", [["len", 2]], { formula: "A = l^{2}", say: "area is a length times a length" }),
  Q("vol", "volume", "V", [0, 3, 0], "m³", [["len", 3]], { formula: "V = l^{3}", say: "volume is a length times a length times a length" }),
  Q("dens", "density", "ρ", [1, -3, 0], "kg m⁻³", [["mass", 1], ["vol", -1]], { formula: "\\rho = \\frac{m}{V}", say: "density is mass divided by volume" }),
  Q("force", "force", "F", [1, 1, -2], "N", [["mass", 1], ["acc", 1]], { formula: "F = ma", say: "Newton's second law: force is mass times acceleration" }),
  Q("weight", "weight", "W", [1, 1, -2], "N", [["mass", 1], ["grav", 1]], { formula: "W = mg", say: "weight is mass times the acceleration due to gravity" }),
  Q("mom", "momentum", "p", [1, 1, -1], "kg m s⁻¹", [["mass", 1], ["speed", 1]], { formula: "p = mv", say: "momentum is mass times velocity" }),
  Q("imp", "impulse", "J", [1, 1, -1], "N s", [["force", 1], ["time", 1]], { formula: "J = Ft", say: "impulse is force times the time it acts for" }),
  Q("energy", "energy", "E", [1, 2, -2], "J", [["mass", 1], ["speed", 2]], { formula: "E = \\frac{1}{2}mv^{2}", say: "kinetic energy is a half times mass times speed squared", num: "\\frac{1}{2}" }),
  Q("power", "power", "P", [1, 2, -3], "W", [["energy", 1], ["time", -1]], { formula: "P = \\frac{E}{t}", say: "power is work done, which is energy, divided by the time taken" }),
  Q("press", "pressure", "p", [1, -1, -2], "N m⁻²", [["force", 1], ["area", -1]], { formula: "p = \\frac{F}{A}", say: "pressure is force divided by the area it acts on" }),
  Q("omega", "angular speed", "ω", [0, 0, -1], "s⁻¹", [["speed", 1], ["rad", -1]], { formula: "\\omega = \\frac{v}{r}", say: "speed is radius times angular speed, so angular speed is speed divided by radius" }),
  Q("freq", "frequency", "f", [0, 0, -1], "s⁻¹", [["time", -1]], { formula: "f = \\frac{1}{t}", say: "frequency is one divided by the time for one cycle" }),
  Q("moment", "moment of a force", "τ", [1, 2, -2], "N m", [["force", 1], ["len", 1]], { formula: "\\tau = Fl", say: "a moment is force times perpendicular distance" }),
  Q("inertia", "moment of inertia", "I", [1, 2, 0], "kg m²", [["mass", 1], ["rad", 2]], { formula: "I = mr^{2}", say: "moment of inertia is mass times radius squared" }),
  Q("stiff", "stiffness", "κ", [1, 0, -2], "N m⁻¹", [["force", 1], ["ext", -1]], { formula: "\\kappa = \\frac{F}{x}", say: "Hooke's law: force is stiffness times extension, so stiffness is force divided by extension" }),
  Q("linmass", "mass per unit length", "q", [1, -1, 0], "kg m⁻¹", [["mass", 1], ["len", -1]], { formula: "q = \\frac{m}{l}", say: "mass per unit length is mass divided by length" }),
  Q("surf", "surface tension", "σ", [1, 0, -2], "N m⁻¹", [["force", 1], ["len", -1]], { formula: "\\sigma = \\frac{F}{l}", say: "surface tension is force per unit length" }),
  Q("visc", "viscosity", "η", [1, -1, -1], "kg m⁻¹ s⁻¹", [["force", 1], ["dep", 1], ["area", -1], ["speed", -1]], { formula: "\\eta = \\frac{Fd}{Av}", say: "viscous force is viscosity times area times speed, over the distance; rearrange for viscosity" }),
  Q("G", "the gravitational constant", "G", [-1, 3, -2], "N m² kg⁻²", [["force", 1], ["dep", 2], ["mass", -2]], { formula: "G = \\frac{Fd^{2}}{m^{2}}", say: "gravitational force is G times the two masses over the distance squared; rearrange for G" }),
];
export const QBY: Record<string, Quantity> = Object.fromEntries(LIBRARY.map((q) => [q.id, q]));
export const qDim = (id: string): Dim3 => { const q = QBY[id]; return dimOf(q.dim[0], q.dim[1], q.dim[2]); };
/** the quantity library read from its first-principles definition (a test compares it to `dim`) */
export function defDim(id: string): Dim3 {
  const q = QBY[id];
  if (!q.def) return qDim(id);
  return q.def.reduce<Dim3>((acc, [f, p]) => dimAdd(acc, dimScale(defDim(f), fr(p))), dimOf(0, 0, 0));
}
/** the quantities with a definition in terms of others (the ones "state the dimensions of" can be worked out for) */
export const DERIVED = LIBRARY.filter((q) => q.def);

// ── Units ────────────────────────────────────────────────────────────────────
const UNIT: Record<string, Dim3> = {
  kg: dimOf(1, 0, 0), m: dimOf(0, 1, 0), s: dimOf(0, 0, 1),
  N: dimOf(1, 1, -2), J: dimOf(1, 2, -2), W: dimOf(1, 2, -3), Pa: dimOf(1, -1, -2), Hz: dimOf(0, 0, -1),
};
const SUPBACK: Record<string, string> = Object.fromEntries(Object.entries(SUP).map(([k, v]) => [v, k]));
/** "kg m⁻³" → [kg, −… ] as (unit, power) pairs */
export function parseUnits(u: string): Array<[string, number]> {
  return u.split(/\s+/).filter(Boolean).map((tok) => {
    const m = tok.match(/^([A-Za-z]+)([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]*)$/);
    if (!m || !(m[1] in UNIT)) throw new Error(`unknown unit ${tok}`);
    const e = m[2] ? Number(m[2].split("").map((c) => SUPBACK[c]).join("")) : 1;
    return [m[1], e];
  });
}
export const unitsDim = (u: string): Dim3 => parseUnits(u).reduce<Dim3>((acc, [n, p]) => dimAdd(acc, dimScale(UNIT[n], fr(p))), dimOf(0, 0, 0));
/** a quantity's units written in base units ("kg m⁻¹ s⁻²"), for integer dimensions */
export function baseUnits(d: Dim3): string {
  const part = (u: string, e: Fr) => (fzero(e) ? "" : u + (feq(e, ONE) ? "" : sup(e)));
  return [part("kg", d[0]), part("m", d[1]), part("s", d[2])].filter(Boolean).join(" ");
}
/** the base dimension a base unit stands for */
export const UNIT_BASE: Record<string, string> = { kg: "mass", m: "length", s: "time" };

// ── Exact linear solving (a rational Gaussian elimination, written independently of every generator) ─────────────────────
type SolveResult = { status: "unique"; x: Fr[] } | { status: "none" } | { status: "many" };
/** A x = b for an m×n system of fractions */
export function solveLinear(A: Fr[][], b: Fr[]): SolveResult {
  const m = A.length, n = A[0]?.length ?? 0;
  const M: Fr[][] = A.map((row, i) => [...row, b[i]]);
  const piv: number[] = [];
  let r = 0;
  for (let c = 0; c < n && r < m; c++) {
    let p = r;
    while (p < m && fzero(M[p][c])) p++;
    if (p === m) continue;
    [M[r], M[p]] = [M[p], M[r]];
    const d = M[r][c];
    M[r] = M[r].map((v) => fdiv(v, d));
    for (let i = 0; i < m; i++) if (i !== r && !fzero(M[i][c])) {
      const k = M[i][c];
      M[i] = M[i].map((v, j) => fsub(v, fmul(k, M[r][j])));
    }
    piv.push(c);
    r++;
  }
  for (let i = r; i < m; i++) if (!fzero(M[i][n])) return { status: "none" };
  if (piv.length < n) return { status: "many" };
  const x: Fr[] = Array(n).fill(ZERO);
  piv.forEach((c, i) => { x[c] = M[i][n]; });
  return { status: "unique", x };
}
export const rankOf = (cols: Dim3[]): number => {
  // the rank of the 3×n matrix whose columns are the dimensions: solve for zero RHS and count pivots through a determinant-free method
  const A: Fr[][] = [0, 1, 2].map((r) => cols.map((c) => c[r]));
  const m = 3, n = cols.length;
  const M = A.map((row) => [...row]);
  let r = 0;
  for (let c = 0; c < n && r < m; c++) {
    let p = r;
    while (p < m && fzero(M[p][c])) p++;
    if (p === m) continue;
    [M[r], M[p]] = [M[p], M[r]];
    const d = M[r][c];
    M[r] = M[r].map((v) => fdiv(v, d));
    for (let i = 0; i < m; i++) if (i !== r && !fzero(M[i][c])) { const k = M[i][c]; M[i] = M[i].map((v, j) => fsub(v, fmul(k, M[r][j]))); }
    r++;
  }
  return r;
};

/** the three equations (M, L, T) of  target = k · Π factor^power : Σ dim_i[col] · power_i = target[col] */
export interface DimEq { col: 0 | 1 | 2; coef: Fr[]; rhs: Fr }
export function equationsFor(target: Dim3, factors: Dim3[]): DimEq[] {
  return ([0, 1, 2] as const).map((col) => ({ col, coef: factors.map((d) => d[col]), rhs: target[col] }));
}

// ── Formulas for the consistency questions ───────────────────────────────────
export interface Factor { sym: string; q: string; p: Fr }
export interface Term { sign: "+" | "−"; num?: string; f: Factor[] }
export interface Formula { id: string; lhs: Term[]; rhs: Term[]; level: 1 | 2 }
const F = (sym: string, q: string, p = 1): Factor => ({ sym, q, p: fr(p) });
const Fh = (sym: string, q: string, n: number, d: number): Factor => ({ sym, q, p: fr(n, d) });
const T = (f: Factor[], num?: string, sign: "+" | "−" = "+"): Term => ({ sign, num, f });

/** formulas that are dimensionally consistent as written, with the quantities each symbol stands for */
export const FORMULAS: Formula[] = [
  { id: "v=u+at", level: 1, lhs: [T([F("v", "speed")])], rhs: [T([F("u", "speed")]), T([F("a", "acc"), F("t", "time")])] },
  { id: "F=mv2/r", level: 1, lhs: [T([F("F", "force")])], rhs: [T([F("m", "mass"), F("v", "speed", 2), F("r", "rad", -1)])] },
  { id: "P=Fv", level: 1, lhs: [T([F("P", "power")])], rhs: [T([F("F", "force"), F("v", "speed")])] },
  { id: "a=v2/r", level: 1, lhs: [T([F("a", "acc")])], rhs: [T([F("v", "speed", 2), F("r", "rad", -1)])] },
  { id: "F=mrw2", level: 1, lhs: [T([F("F", "force")])], rhs: [T([F("m", "mass"), F("r", "rad"), F("ω", "omega", 2)])] },
  { id: "E=mgh", level: 1, lhs: [T([F("E", "energy")])], rhs: [T([F("m", "mass"), F("g", "grav"), F("h", "hgt")])] },
  { id: "v2=u2+2as", level: 2, lhs: [T([F("v", "speed", 2)])], rhs: [T([F("u", "speed", 2)]), T([F("a", "acc"), F("s", "len")], "2")] },
  { id: "s=ut+at2/2", level: 2, lhs: [T([F("s", "len")])], rhs: [T([F("u", "speed"), F("t", "time")]), T([F("a", "acc"), F("t", "time", 2)], "½")] },
  { id: "s=ut-gt2/2", level: 2, lhs: [T([F("s", "len")])], rhs: [T([F("u", "speed"), F("t", "time")]), T([F("g", "grav"), F("t", "time", 2)], "½", "−")] },
  { id: "E=mv2/2+mgh", level: 2, lhs: [T([F("E", "energy")])], rhs: [T([F("m", "mass"), F("v", "speed", 2)], "½"), T([F("m", "mass"), F("g", "grav"), F("h", "hgt")])] },
  { id: "E=kx2/2+mv2/2", level: 2, lhs: [T([F("E", "energy")])], rhs: [T([F("k", "stiff"), F("x", "ext", 2)], "½"), T([F("m", "mass"), F("v", "speed", 2)], "½")] },
  { id: "p+rgh", level: 2, lhs: [T([F("p", "press")]), T([F("ρ", "dens"), F("g", "grav"), F("h", "hgt")])], rhs: [T([F("P", "press")])] },
  { id: "F=ma+mg", level: 2, lhs: [T([F("F", "force")])], rhs: [T([F("m", "mass"), F("a", "acc")]), T([F("m", "mass"), F("g", "grav")])] },
  { id: "t=2pi sqrt(l/g)", level: 2, lhs: [T([F("t", "time")])], rhs: [T([Fh("l", "len", 1, 2), Fh("g", "grav", -1, 2)], "2π")] },
  { id: "t=2pi sqrt(m/k)", level: 2, lhs: [T([F("t", "time")])], rhs: [T([Fh("m", "mass", 1, 2), Fh("k", "stiff", -1, 2)], "2π")] },
  { id: "mgh=mv2/2", level: 2, lhs: [T([F("m", "mass"), F("g", "grav"), F("h", "hgt")])], rhs: [T([F("m", "mass"), F("v", "speed", 2)], "½")] },
];
export const termDim = (t: Term): Dim3 => t.f.reduce<Dim3>((acc, x) => dimAdd(acc, dimScale(qDim(x.q), x.p)), dimOf(0, 0, 0));
/** a formula is consistent when every term, on both sides, has the same dimensions */
export function consistentDims(f: { lhs: Term[]; rhs: Term[] }): { ok: boolean; dims: Dim3[] } {
  const dims = [...f.lhs, ...f.rhs].map(termDim);
  return { ok: dims.every((d) => dimEq(d, dims[0])), dims };
}
