// LaTeX for every piece of maths in a Dimensional Analysis question, its working and its model answers.
// Prose carries maths between $…$ (rendered on screen by the shell's InlineMath, on paper by KaTeX); these build what goes between the dollars.
import { type Fr, type Dim3, type DimEq, type Term, type Factor, BASE, fr, fmul, fneg, feq, fzero, ONE, parseUnits } from "./dim";

const GREEK: Record<string, string> = { ρ: "\\rho ", κ: "\\kappa ", ω: "\\omega ", η: "\\eta ", σ: "\\sigma ", τ: "\\tau ", π: "\\pi ", μ: "\\mu ", α: "\\alpha ", β: "\\beta ", γ: "\\gamma ", "₁": "_1", "₂": "_2" };
/** a quantity's or power's symbol as TeX ("ρ" → "\rho", "m₁" → "m_1") */
export const symTex = (s: string): string => s.replace(/[ρκωησταβγμπ₁₂]/g, (c) => GREEK[c]); // a Greek command keeps its trailing space, so "\\rho g" never runs together
/** a fraction as TeX: "2", "-1", "\frac{1}{2}", "-\frac{1}{3}" */
export function frTex(a: Fr): string {
  const neg = a[0] < 0 ? "-" : "";
  return a[1] === 1 ? `${neg}${Math.abs(a[0])}` : `${neg}\\frac{${Math.abs(a[0])}}{${a[1]}}`;
}
/** an exponent: "^{2}", "^{-1}", "^{\frac{1}{2}}"; nothing for 1 */
export const supTex = (a: Fr): string => (feq(a, ONE) ? "" : `^{${frTex(a)}}`);
/** dimensions as the papers write them: "ML^{2}T^{-2}"; "1" when dimensionless */
export function dimTex(d: Dim3): string {
  const s = d.map((e, i) => (fzero(e) ? "" : BASE[i] + supTex(e))).join("");
  return s || "1";
}
/** a dimension raised to a power, bracketed when it is more than one base letter: "(ML^{-3})^{2}", "T^{-1}" */
export function dimPowTex(d: Dim3, p: Fr): string {
  const base = dimTex(d);
  if (feq(p, ONE)) return base;
  const letters = d.filter((e) => !fzero(e)).length;
  const bare = letters === 1 && feq(d.find((e) => !fzero(e))!, ONE);
  return `${letters <= 1 && (bare || letters === 0) ? base : `(${base})`}${supTex(p)}`;
}
/** "[\rho] = ML^{-3}" */
export const bracketTex = (symT: string, d: Dim3): string => `[${symT}] = ${dimTex(d)}`;
/** "\alpha + \gamma", "2\alpha - \beta": the left-hand side of an equation of powers */
export function eqLhsTex(coef: Fr[], syms: string[]): string {
  let out = "";
  coef.forEach((c, i) => {
    if (fzero(c)) return;
    const neg = c[0] < 0;
    const mag = fr(Math.abs(c[0]), c[1]);
    const body = (feq(mag, ONE) ? "" : frTex(mag)) + symTex(syms[i]);
    out += out === "" ? (neg ? "-" : "") + body : ` ${neg ? "-" : "+"} ${body}`;
  });
  return out || "0";
}
/** "M: \alpha + \gamma = 0": the column label as plain text, then the equation as TeX (the grid colours the label) */
export const eqTexLine = (e: DimEq, syms: string[]): string => `${BASE[e.col]}: ${eqLhsTex(e.coef, syms)} = ${frTex(e.rhs)}`;
const NUM_TEX: Record<string, string> = { "½": "\\frac{1}{2}", "2π": "2\\pi ", "2": "2" };
/** a product of factors: numerator over denominator as a fraction, a root over the lot when asked; `override` writes a factor itself (the unknown power n) */
export function productTex(fs: Array<{ sym: string; p: Fr }>, root = false, override?: (x: { sym: string; p: Fr }) => string | null): string {
  const piece = (x: { sym: string; p: Fr }, p: Fr) => override?.(x) ?? symTex(x.sym) + supTex(p);
  const nums = fs.filter((x) => x.p[0] > 0 || override?.(x) != null);
  const dens = fs.filter((x) => x.p[0] < 0 && override?.(x) == null);
  const num = nums.map((x) => piece(x, x.p)).join("");
  const den = dens.map((x) => piece(x, fneg(x.p))).join("");
  const body = den ? `\\frac{${num || "1"}}{${den}}` : num;
  return root ? `\\sqrt{${body}}` : body;
}
/** one term as written: "\frac{1}{2}at^{2}", "\frac{mv^{2}}{r}", "2\pi \sqrt{\frac{l}{g}}" */
export function termTex(t: Term, override?: (x: Factor) => string | null): string {
  const half = !override && t.f.length > 0 && t.f.every((x) => x.p[1] === 2 && Math.abs(x.p[0]) === 1);
  const body = half ? productTex(t.f.map((x) => ({ sym: x.sym, p: fmul(x.p, fr(2)) })), true) : productTex(t.f, false, override as never);
  return (t.num ? NUM_TEX[t.num] ?? t.num : "") + body;
}
export const sideTex = (ts: Term[], override?: (x: Factor) => string | null): string =>
  ts.map((t, i) => (i === 0 ? (t.sign === "−" ? "-" : "") : ` ${t.sign === "−" ? "-" : "+"} `) + termTex(t, override)).join("");
export const formulaTex = (f: { lhs: Term[]; rhs: Term[] }, override?: (x: Factor) => string | null): string => `${sideTex(f.lhs, override)} = ${sideTex(f.rhs, override)}`;
/** units as TeX: "kg m⁻³" → "\mathrm{kg}\,\mathrm{m}^{-3}" */
export const unitsTex = (u: string): string => parseUnits(u).map(([n, p]) => `\\mathrm{${n}}${p === 1 ? "" : `^{${p}}`}`).join("\\,");
/** wrap maths for prose */
export const M = (tex: string): string => `$${tex}$`;
/** "$a$, $b$ and $c$" */
export const andTex = (syms: string[]): string => {
  const xs = syms.map((s) => M(symTex(s)));
  return xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
};
