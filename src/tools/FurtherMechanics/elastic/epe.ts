// Elastic Potential Energy (epe): EPE = λx²/2l. The energy stored for an extension or a length, the work done stretching between two lengths (a difference of squares), and
// finding the modulus or the length from the energy. Brief: specs/further-mechanics-mc.md §5.10. Equations first (R5): the physical inputs are picked; a given energy is
// rounded to 3 s.f. and the answer recomputed from the SHOWN value.
import { buildElasticHorizontal, numTex, sfTex, sig, type MechProblemData } from "../../../shared/mechanics";
import { inRange } from "../../../shared/mechanics/contexts";
import { L, staged, u, ut, type Common } from "../workDone/common";
import { lenIn, thing, type LenUnit } from "./common";

type Ask = "epe" | "work" | "modulus" | "length";

interface EpeInput extends Common {
  kind: "spring" | "string";
  ask: Ask;
  givenAs: "length" | "extension";
  compress: boolean;
  lUnit: LenUnit;
  /** the modulus (N), the natural length (m) and two extensions (m): the second is the one stored for an energy question, the first is the start of a work question */
  lam: number;
  l: number;
  x1: number;
  x2: number;
}

export function buildEpe(i: EpeInput): MechProblemData {
  const r3 = "\\ (3\\text{ s.f.})";
  const lu = i.lUnit, cm = lu === "cm";
  const lt = (x: number): string => ut(lenIn(x, lu), lu);
  const lx = (x: number): string => u(lenIn(x, lu), lu);
  const mSI = (x: number): string => u(x, "m");
  const known: string[] = [];
  const steps: MechProblemData["steps"] = [];
  const sub = (caption: string, lines: string[]) => steps.push({ caption, lines });
  const conv: string[] = [];
  const lenOf = (x: number): number => (i.compress ? i.l - x : i.l + x);
  const stretched = i.compress ? "compressed" : "stretched";
  const lamTxt = ut(i.lam, "N");
  const intro = `${thing(i.kind)} has natural length ${lt(i.l)} and modulus of elasticity ${lamTxt}.`;
  const E = (x: number): number => (i.lam * x * x) / (2 * i.l);
  let value = 0, unit = "J", prompt = "";
  const energyFormula = `E = \\dfrac{\\lambda x^{2}}{2l}`;

  if (i.ask === "epe") {
    value = sig(E(i.x2), 3);
    const len = lenOf(i.x2);
    prompt = `${intro} It is ${stretched} ${i.givenAs === "length" ? `until its length is ${lt(len)}` : `by ${lt(i.x2)}`}. Find the elastic potential energy stored in ${i.kind === "spring" ? "the spring" : "the string"}.`;
    known.push(`l = ${lx(i.l)}`, `\\lambda = ${u(i.lam, "N")}`, i.givenAs === "length" ? `\\text{length} = ${lx(len)}` : `x = ${lx(i.x2)}`);
    if (cm) conv.push(`${lx(i.l)} = ${mSI(i.l)}`, i.givenAs === "length" ? `${lx(len)} = ${mSI(len)}` : `${lx(i.x2)} = ${mSI(i.x2)}`);
    if (i.givenAs === "length") sub(`The ${i.compress ? "compression" : "extension"} is the difference between the length and the natural length`, [`x = ${i.compress ? `${numTex(i.l)} - ${numTex(len)}` : `${numTex(len)} - ${numTex(i.l)}`} = ${mSI(i.x2)}`]);
    sub("Elastic potential energy is λx² ÷ 2l", [`${energyFormula} = \\dfrac{${numTex(i.lam)}\\times${numTex(i.x2)}^{2}}{2\\times${numTex(i.l)}}`, `E = ${sfTex(E(i.x2), 6)}\\ \\text{J}`]);
    sub("Round to 3 s.f.", [`E = ${u(value, "J")}${r3}`]);
  } else if (i.ask === "work") {
    const w = E(i.x2) - E(i.x1);
    value = sig(w, 3);
    const l1 = lenOf(i.x1), l2 = lenOf(i.x2);
    prompt = `${intro} It is ${stretched} from a length of ${lt(l1)} to a length of ${lt(l2)}. Find the work done in ${stretched === "stretched" ? "stretching" : "compressing"} it.`;
    known.push(`l = ${lx(i.l)}`, `\\lambda = ${u(i.lam, "N")}`, `\\text{lengths } ${lx(l1)} \\text{ and } ${lx(l2)}`);
    if (cm) conv.push(`${lx(i.l)} = ${mSI(i.l)}`, `${lx(l1)} = ${mSI(l1)}`, `${lx(l2)} = ${mSI(l2)}`);
    sub(`Find the two ${i.compress ? "compressions" : "extensions"}: length and natural length differ by x`, [`x_{1} = ${i.compress ? `${numTex(i.l)} - ${numTex(l1)}` : `${numTex(l1)} - ${numTex(i.l)}`} = ${numTex(i.x1)}`, `x_{2} = ${i.compress ? `${numTex(i.l)} - ${numTex(l2)}` : `${numTex(l2)} - ${numTex(i.l)}`} = ${numTex(i.x2)}`]);
    sub("Work done is the energy stored at the end minus the energy stored at the start", [`W = \\dfrac{\\lambda}{2l}\\left(x_{2}^{2} - x_{1}^{2}\\right) = \\dfrac{${numTex(i.lam)}}{2\\times${numTex(i.l)}}\\left(${numTex(i.x2)}^{2} - ${numTex(i.x1)}^{2}\\right)`, `W = ${sfTex(w, 6)}\\ \\text{J}`]);
    sub("Round to 3 s.f.", [`W = ${u(value, "J")}${r3}`]);
  } else if (i.ask === "modulus") {
    const Es = sig(E(i.x2), 3);
    const lam = (2 * i.l * Es) / (i.x2 * i.x2);
    value = sig(lam, 3); unit = "N";
    prompt = `${thing(i.kind)} has natural length ${lt(i.l)}. When it is ${stretched} by ${lt(i.x2)} the elastic potential energy stored is ${ut(Es, "J")}. Find its modulus of elasticity.`;
    known.push(`l = ${lx(i.l)}`, `x = ${lx(i.x2)}`, `E = ${u(Es, "J")}`);
    if (cm) conv.push(`${lx(i.l)} = ${mSI(i.l)}`, `${lx(i.x2)} = ${mSI(i.x2)}`);
    sub("Elastic potential energy is λx² ÷ 2l, so λ = 2lE ÷ x²", [`\\lambda = \\dfrac{2lE}{x^{2}} = \\dfrac{2\\times${numTex(i.l)}\\times${numTex(Es)}}{${numTex(i.x2)}^{2}}`, `\\lambda = ${u(value, "N")}${r3}`]);
  } else {
    const Es = sig(E(i.x2), 3);
    const x = Math.sqrt((2 * i.l * Es) / i.lam);
    value = sig(lenIn(i.l + x, lu), 3); unit = lu;
    prompt = `An elastic string has natural length ${lt(i.l)} and modulus of elasticity ${lamTxt}. When it is stretched the elastic potential energy stored in it is ${ut(Es, "J")}. Find the length of the string${cm ? ", in cm" : ""}.`;
    known.push(`l = ${lx(i.l)}`, `\\lambda = ${u(i.lam, "N")}`, `E = ${u(Es, "J")}`);
    if (cm) conv.push(`${lx(i.l)} = ${mSI(i.l)}`);
    sub("Elastic potential energy is λx² ÷ 2l, so x² = 2lE ÷ λ", [`x^{2} = \\dfrac{2lE}{\\lambda} = \\dfrac{2\\times${numTex(i.l)}\\times${numTex(Es)}}{${numTex(i.lam)}} = ${sfTex((2 * i.l * Es) / i.lam, 6)}`, `x = ${sfTex(x, 6)}\\ \\text{m}`]);
    sub("The length is the natural length plus the extension", [`\\text{length} = ${numTex(i.l)} + ${sfTex(x, 6)} = ${sfTex(i.l + x, 6)}\\ \\text{m}`]);
    sub(cm ? "Write it in centimetres (multiply by 100) and round" : "Round to 3 s.f.", [`\\text{length} = ${u(value, unit)}${r3}`]);
  }
  if (conv.length) steps.unshift({ caption: "Convert to metres first", lines: conv });
  prompt += " Give your answer to 3 significant figures.";
  const raw = buildElasticHorizontal({ kind: i.kind === "spring" ? "spring" : "elastic", state: i.compress ? "compressed" : "extended", body: "block", mass: L("m"), natural: L(lt(i.l)), extension: L(lt(i.x2)), modulus: L(i.ask === "modulus" ? "λ" : lamTxt) });
  return { sub: "epe", level: i.level, prompt, course: i.course, a2: false, scene: staged(raw, i.display, ["setting", "spring", "lengths"]), display: i.display, known, steps, answer: { value, unit, tex: u(value, unit), text: ut(value, unit) }, inputs: { ...i } };
}

export function generateEpe(level: number, o: { ask: string; givenAs: string; kind: string; units: string; display: Common["display"]; course: "AS" | "A2" }): MechProblemData {
  const pickIn = (s: string, f: string): string => { const xs = s.split(",").filter(Boolean); return xs[Math.floor(Math.random() * xs.length)] ?? f; };
  const kind = (pickIn(o.kind, "string") === "spring" ? "spring" : "string") as "spring" | "string";
  const conv = o.units === "conv";
  const asks = o.ask.split(",").filter((a) => ["epe", "work", "modulus", "length"].includes(a)) as Ask[];
  let ask = asks.length ? asks[Math.floor(Math.random() * asks.length)] : "epe";
  if (ask === "length" && kind === "spring") ask = "modulus";
  for (let tries = 0; tries < 400; tries++) {
    const lam = inRange([20, 200, 5]), l = inRange([0.4, 2.4, 0.1]);
    const compress = kind === "spring" && ask !== "length" && Math.random() < 0.35;
    const xMax = compress ? Math.min(0.5, l - 0.1) : 1;
    const x2 = inRange([0.1, xMax, 0.05]);
    const x1 = ask === "work" ? inRange([0.05, x2 - 0.05, 0.05]) : 0;
    if (ask === "work" && !(x1 > 0 && x1 < x2)) continue;
    const lUnit: LenUnit = conv && Math.random() < 0.6 ? "cm" : "m";
    if (lUnit === "cm" && [l, x1, x2, compress ? l - x1 : l + x1, compress ? l - x2 : l + x2].some((x) => Math.abs(lenIn(x, "cm") - Math.round(lenIn(x, "cm"))) > 1e-9)) continue;
    const E = (lam * x2 * x2) / (2 * l);
    if (E < 0.1 || E > 500) continue;
    return buildEpe({ level, course: o.course, display: o.display, kind, ask, givenAs: (pickIn(o.givenAs, "extension") === "length" ? "length" : "extension") as "length" | "extension", compress, lUnit, lam, l, x1, x2 });
  }
  return buildEpe({ level, course: o.course, display: o.display, kind: "string", ask: "epe", givenAs: "extension", compress: false, lUnit: "m", lam: 60, l: 0.8, x1: 0, x2: 0.5 });
}
