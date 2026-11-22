// Hooke's Law (hooke): T = λx/l (or T = kx). The tension or thrust from a length or an extension, the extension, the stiffness k or the modulus λ, a mass hanging in
// equilibrium, and a particle held between two vertical strings. Brief: specs/further-mechanics-mc.md §5.9. Equations first (R5): the physical inputs are picked, a given
// force is rounded to 3 s.f., and the answer is recomputed from the SHOWN givens.
import { buildElasticHorizontal, buildElasticVertical, numTex, sfTex, sig, withParts, type GValue, type MechProblemData, type Scene, type SceneElement } from "../../../shared/mechanics";
import { inRange } from "../../../shared/mechanics/contexts";
import { L, staged, u, ut, type Common } from "../workDone/common";
import { lenIn, thing, theThing, type LenUnit } from "./common";

type Setting = "horizontal" | "hanging" | "two";
type Ask = "tension" | "extension" | "k" | "modulus" | "length" | "mass";

interface HookeInput extends Common {
  setting: Setting;
  kind: "spring" | "string";
  ask: Ask;
  /** horizontal tension question: the new length is given, or the extension */
  givenAs: "length" | "extension";
  /** a spring squashed rather than stretched (a thrust) */
  compress: boolean;
  lUnit: LenUnit;
  g: GValue;
  /** the (upper) string: modulus λ (N), natural length l (m) and extension x (m) */
  lam: number;
  l: number;
  x: number;
  /** a mass (kg) hanging; a force (N) as it is shown when it is a given */
  m: number;
  F: number;
  /** two strings: the lower string's modulus, natural length and extension, and the distance between the fixed points (m) */
  lam2: number;
  l2: number;
  x2: number;
  D: number;
}

/** the picture of a particle between two vertical strings: the fixed points A above and B below, and the particle P between them */
function twoStringsScene(i: HookeInput): Scene {
  const els: SceneElement[] = [];
  const Ay = 50, By = 300, x = 250;
  const py = Ay + ((By - Ay) * (i.l + i.x)) / Math.max(i.D, 1e-9);
  const y = Math.min(By - 60, Math.max(Ay + 60, py));
  els.push({ type: "surface", id: "ceiling", kind: "ceiling", a: { x: 150, y: Ay }, b: { x: 350, y: Ay }, hatch: true, hatchSide: 1 });
  els.push({ type: "surface", id: "ground", kind: "ground", a: { x: 150, y: By }, b: { x: 350, y: By }, hatch: true });
  els.push({ type: "spring", id: "string-up", kind: "elastic", a: { x, y: Ay }, b: { x, y } });
  els.push({ type: "spring", id: "string-down", kind: "elastic", a: { x, y: By }, b: { x, y } });
  els.push({ type: "body", id: "body", kind: "particle", at: { x, y: y + 7 }, label: L(ut(i.m, "kg")) });
  els.push({ type: "marker", id: "m-a", at: { x, y: Ay }, name: "A", dir: 135, dist: 22, hideDot: true });
  els.push({ type: "marker", id: "m-b", at: { x, y: By }, name: "B", dir: 225, dist: 22, hideDot: true });
  els.push({ type: "marker", id: "m-p", at: { x, y: y + 7 }, name: "P", dir: 0, dist: 30, hideDot: true });
  els.push({ type: "dim", id: "dim-ab", a: { x: 110, y: Ay }, b: { x: 110, y: By }, offset: 0, label: L(ut(i.D, "m")) });
  return withParts({ w: 440, h: 340, elements: els, alt: "A particle held between two elastic strings in a vertical line, A above it and B below it." },
    [{ id: "setting", label: "the fixed points and the strings", given: true }, { id: "mass", label: "the particle", given: true }, { id: "lengths", label: "the distance between the fixed points", given: true }],
    (id) => (id === "ceiling" || id === "ground" || id.startsWith("string") || id === "m-a" || id === "m-b" ? "setting" : id === "body" || id === "m-p" ? "mass" : "lengths"));
}

export function buildHooke(i: HookeInput): MechProblemData {
  const r3 = "\\ (3\\text{ s.f.})";
  const g = i.g, G = numTex(g);
  const lu = i.lUnit, cm = lu === "cm";
  const lt = (x: number): string => ut(lenIn(x, lu), lu);
  const lx = (x: number): string => u(lenIn(x, lu), lu);
  const mSI = (x: number): string => u(x, "m");
  const known: string[] = [];
  const steps: MechProblemData["steps"] = [];
  const sub = (caption: string, lines: string[]) => steps.push({ caption, lines });
  const conv: string[] = [];
  const convL = (...xs: number[]) => { if (cm) for (const x of xs) conv.push(`${lx(x)} = ${mSI(x)}`); };
  let value = 0, unit = "", prompt = "";
  let extra: MechProblemData["extra"];
  let answerTex = "", answerText = "";
  let raw: Scene | undefined;
  let Dshown = i.D;
  const T = (i.lam * i.x) / i.l;
  const lamTxt = ut(i.lam, "N");

  if (i.setting === "horizontal") {
    const what = i.compress ? "thrust" : "tension";
    const state = i.compress ? "compressed" : "stretched";
    const intro = `${thing(i.kind)} has natural length ${lt(i.l)} and modulus of elasticity ${lamTxt}.`;
    if (i.ask === "tension") {
      value = sig(T, 3); unit = "N";
      const len = i.compress ? i.l - i.x : i.l + i.x;
      const how = i.givenAs === "length" ? `Its length is ${state === "stretched" ? "increased" : "decreased"} to ${lt(len)}` : `It is ${state} by ${lt(i.x)}`;
      prompt = `${intro} ${how}. Find the ${what} in ${theThing(i.kind)}.`;
      known.push(`l = ${lx(i.l)}`, `\\lambda = ${u(i.lam, "N")}`, i.givenAs === "length" ? `\\text{length} = ${lx(len)}` : `x = ${lx(i.x)}`);
      convL(i.l, ...(i.givenAs === "length" ? [len] : [i.x]));
      if (i.givenAs === "length") sub(`The ${i.compress ? "compression" : "extension"} is the difference between the length and the natural length`, [`x = ${i.compress ? `${numTex(i.l)} - ${numTex(len)}` : `${numTex(len)} - ${numTex(i.l)}`} = ${mSI(i.x)}`]);
      sub("Hooke's law: the " + what + " is λx ÷ l", [`T = \\dfrac{\\lambda x}{l} = \\dfrac{${numTex(i.lam)}\\times${numTex(i.x)}}{${numTex(i.l)}}`, `T = ${sfTex(T, 6)}\\ \\text{N}`]);
      sub("Round to 3 s.f.", [`T = ${u(value, "N")}${r3}`]);
    } else if (i.ask === "extension") {
      const Ts = sig(T, 3);
      const x = (Ts * i.l) / i.lam;
      value = sig(lenIn(x, lu), 3); unit = lu;
      prompt = `${intro} The ${what} in ${theThing(i.kind)} is ${ut(Ts, "N")}. Find the ${i.compress ? "compression" : "extension"}${cm ? ", in cm" : ""}.`;
      known.push(`l = ${lx(i.l)}`, `\\lambda = ${u(i.lam, "N")}`, `T = ${u(Ts, "N")}`);
      convL(i.l);
      sub("Hooke's law: T = λx ÷ l, so x = Tl ÷ λ", [`x = \\dfrac{Tl}{\\lambda} = \\dfrac{${numTex(Ts)}\\times${numTex(i.l)}}{${numTex(i.lam)}} = ${sfTex(x, 6)}\\ \\text{m}`]);
      sub(cm ? "Write it in centimetres (multiply by 100) and round" : "Round to 3 s.f.", [`x = ${u(value, unit)}${r3}`]);
    } else if (i.ask === "k") {
      const Ts = sig(T, 3);
      const k = Ts / i.x;
      value = sig(k, 3); unit = "N m⁻¹";
      prompt = `${thing(i.kind)} obeys Hooke's law $T = kx$, where $T$ N is the ${what} and $x$ m is the ${i.compress ? "compression" : "extension"}. A ${what} of ${ut(Ts, "N")} ${i.compress ? "compresses" : "stretches"} it by ${lt(i.x)}. Find the stiffness $k$.`;
      known.push(`T = ${u(Ts, "N")}`, `x = ${lx(i.x)}`);
      convL(i.x);
      sub("Hooke's law in the form T = kx, so k = T ÷ x", [`k = \\dfrac{T}{x} = \\dfrac{${numTex(Ts)}}{${numTex(i.x)}}`, `k = ${u(value, unit)}${r3}`]);
    } else {
      const Ts = sig(T, 3);
      const lam = (Ts * i.l) / i.x;
      value = sig(lam, 3); unit = "N";
      prompt = `${thing(i.kind)} has natural length ${lt(i.l)}. A ${what} of ${ut(Ts, "N")} ${i.compress ? "compresses" : "stretches"} it by ${lt(i.x)}. Find its modulus of elasticity.`;
      known.push(`l = ${lx(i.l)}`, `T = ${u(Ts, "N")}`, `x = ${lx(i.x)}`);
      convL(i.l, i.x);
      sub("Hooke's law: T = λx ÷ l, so λ = Tl ÷ x", [`\\lambda = \\dfrac{Tl}{x} = \\dfrac{${numTex(Ts)}\\times${numTex(i.l)}}{${numTex(i.x)}}`, `\\lambda = ${u(value, unit)}${r3}`]);
    }
    raw = buildElasticHorizontal({
      kind: i.kind === "spring" ? "spring" : "elastic", state: i.compress ? "compressed" : "extended", body: "block", mass: L("m"),
      natural: L(lt(i.l)), extension: L(lt(i.x), i.ask === "extension" ? "x" : undefined), modulus: L(i.ask === "modulus" ? "λ" : lamTxt),
      force: i.ask === "tension" ? L("T", "T") : L(ut(sig(T, 3), "N"), i.ask === "extension" || i.ask === "k" || i.ask === "modulus" ? undefined : "T"),
    });
  } else if (i.setting === "hanging") {
    const mTxt = ut(i.m, "kg");
    const intro = `A particle of mass ${mTxt} hangs in equilibrium from a fixed point by ${i.kind === "spring" ? "a light spring" : "an elastic string"}`;
    const mg = i.m * g;
    if (i.ask === "extension" || i.ask === "length") {
      const x = (mg * i.l) / i.lam;
      value = sig(lenIn(i.ask === "length" ? i.l + x : x, lu), 3); unit = lu;
      prompt = `${intro} of natural length ${lt(i.l)} and modulus of elasticity ${lamTxt}. Take $g = ${g}$. Find the ${i.ask === "length" ? "length of the string in equilibrium" : "extension"}${cm ? ", in cm" : ""}.`;
      known.push(`m = ${u(i.m, "kg")}`, `l = ${lx(i.l)}`, `\\lambda = ${u(i.lam, "N")}`, `g = ${G}\\ \\text{m s}^{-2}`);
      convL(i.l);
      sub("In equilibrium the tension balances the weight", [`T = mg = ${numTex(i.m)}\\times${G} = ${u(Number(mg.toPrecision(12)), "N")}`]);
      sub("Hooke's law: T = λx ÷ l, so x = Tl ÷ λ", [`x = \\dfrac{Tl}{\\lambda} = \\dfrac{${sfTex(mg, 6)}\\times${numTex(i.l)}}{${numTex(i.lam)}} = ${sfTex(x, 6)}\\ \\text{m}`]);
      if (i.ask === "length") sub("The length is the natural length plus the extension", [`\\text{length} = ${numTex(i.l)} + ${sfTex(x, 6)} = ${sfTex(i.l + x, 6)}\\ \\text{m}`]);
      sub(cm ? "Write it in centimetres (multiply by 100) and round" : "Round to 3 s.f.", [`${i.ask === "length" ? "\\text{length}" : "x"} = ${u(value, unit)}${r3}`]);
    } else if (i.ask === "modulus") {
      const x = (mg * i.l) / i.lam;
      const xs = sig(lenIn(x, lu), 3), xm = xs * (cm ? 0.01 : 1);
      const lam = (mg * i.l) / xm;
      value = sig(lam, 3); unit = "N";
      prompt = `${intro} of natural length ${lt(i.l)}. The extension in equilibrium is ${ut(xs, lu)}. Take $g = ${g}$. Find the modulus of elasticity.`;
      known.push(`m = ${u(i.m, "kg")}`, `l = ${lx(i.l)}`, `x = ${u(xs, lu)}`, `g = ${G}\\ \\text{m s}^{-2}`);
      conv.push(...(cm ? [`${u(xs, "cm")} = ${u(Number(xm.toPrecision(12)), "m")}`, `${lx(i.l)} = ${mSI(i.l)}`] : []));
      sub("In equilibrium the tension balances the weight", [`T = mg = ${numTex(i.m)}\\times${G} = ${u(Number(mg.toPrecision(12)), "N")}`]);
      sub("Hooke's law: T = λx ÷ l, so λ = Tl ÷ x", [`\\lambda = \\dfrac{Tl}{x} = \\dfrac{${sfTex(mg, 6)}\\times${numTex(i.l)}}{${numTex(xm)}}`, `\\lambda = ${u(value, unit)}${r3}`]);
    } else {
      const x = (mg * i.l) / i.lam;
      const xs = sig(lenIn(x, lu), 3), xm = xs * (cm ? 0.01 : 1);
      const m = (i.lam * xm) / (i.l * g);
      value = sig(m, 3); unit = "kg";
      prompt = `A particle hangs in equilibrium from a fixed point by ${i.kind === "spring" ? "a light spring" : "an elastic string"} of natural length ${lt(i.l)} and modulus of elasticity ${lamTxt}. The extension is ${ut(xs, lu)}. Take $g = ${g}$. Find the mass of the particle.`;
      known.push(`l = ${lx(i.l)}`, `\\lambda = ${u(i.lam, "N")}`, `x = ${u(xs, lu)}`, `g = ${G}\\ \\text{m s}^{-2}`);
      conv.push(...(cm ? [`${u(xs, "cm")} = ${u(Number(xm.toPrecision(12)), "m")}`, `${lx(i.l)} = ${mSI(i.l)}`] : []));
      sub("Hooke's law gives the tension", [`T = \\dfrac{\\lambda x}{l} = \\dfrac{${numTex(i.lam)}\\times${numTex(xm)}}{${numTex(i.l)}} = ${sfTex((i.lam * xm) / i.l, 6)}\\ \\text{N}`]);
      sub("In equilibrium the tension balances the weight, T = mg", [`m = \\dfrac{T}{g} = \\dfrac{${sfTex((i.lam * xm) / i.l, 6)}}{${G}}`, `m = ${u(value, unit)}${r3}`]);
    }
    raw = buildElasticVertical({ kind: i.kind === "spring" ? "spring" : "elastic", body: "particle", mass: L("m"), fixed: "O", natural: L(lt(i.l)), extension: L(lt((mg * i.l) / i.lam), i.ask === "extension" ? "x" : undefined), modulus: L("λ"), states: [{ ext: 0, ghost: true }, { ext: 0.5, weight: L("mg"), tension: L("T") }] });
  } else {
    // a particle between two vertical strings: the upper one A to P, the lower one B to P, with AB = D; the lower extension is picked, the upper derived
    const mg = i.m * g;
    const Ds = sig(i.l + i.l2 + i.x + i.x2, 3);
    Dshown = Ds;
    const x1 = ((i.lam2 * (Ds - i.l - i.l2)) / i.l2 + mg) / (i.lam / i.l + i.lam2 / i.l2);
    const x2 = Ds - i.l - i.l2 - x1;
    value = sig(x1, 3); unit = "m";
    extra = [{ value: Number(x2.toPrecision(12)), unit: "m" }];
    prompt = `A particle P of mass ${ut(i.m, "kg")} is attached to the ends of two elastic strings. The other ends are fixed to points A and B, with A vertically above B and $AB = ${numTex(Ds)}$ m. The string AP has natural length ${ut(i.l, "m")} and modulus ${ut(i.lam, "N")}; the string BP has natural length ${ut(i.l2, "m")} and modulus ${ut(i.lam2, "N")}. Both strings are stretched and P is in equilibrium. Take $g = ${g}$. Find the extension of AP.`;
    known.push(`m = ${u(i.m, "kg")}`, `AB = ${u(Ds, "m")}`, `l_{1} = ${u(i.l, "m")}`, `\\lambda_{1} = ${u(i.lam, "N")}`, `l_{2} = ${u(i.l2, "m")}`, `\\lambda_{2} = ${u(i.lam2, "N")}`);
    sub("Let the extensions be x₁ in AP and x₂ in BP. Together with the natural lengths they fill AB", [`x_{1} + x_{2} = ${numTex(Ds)} - ${numTex(i.l)} - ${numTex(i.l2)} = ${sfTex(Ds - i.l - i.l2, 6)}`]);
    sub("In equilibrium the upward tension in AP balances the weight and the downward tension in BP", [`T_{1} = T_{2} + mg`, `\\dfrac{${numTex(i.lam)}x_{1}}{${numTex(i.l)}} = \\dfrac{${numTex(i.lam2)}x_{2}}{${numTex(i.l2)}} + ${sfTex(mg, 6)}`]);
    sub("Replace x₂ by (AB − l₁ − l₂) − x₁ and solve for x₁", [`${sfTex(i.lam / i.l, 6)}x_{1} = ${sfTex(i.lam2 / i.l2, 6)}(${sfTex(Ds - i.l - i.l2, 6)} - x_{1}) + ${sfTex(mg, 6)}`, `x_{1} = ${u(value, "m")}${r3}`]);
    sub("Check: the extension of BP", [`x_{2} = ${sfTex(Ds - i.l - i.l2, 6)} - ${sfTex(x1, 6)} = ${sfTex(x2, 6)}\\ \\text{m}`]);
    raw = twoStringsScene({ ...i, D: Ds });
  }
  if (conv.length) steps.unshift({ caption: "Convert to metres first", lines: conv });
  prompt += " Give your answer to 3 significant figures.";
  if (!answerTex) { answerTex = u(value, unit); answerText = ut(value, unit); }
  const scene = raw ? staged(raw, i.display, ["setting", "mass", "spring", "lengths", "forces"]) : undefined;
  return { sub: "hooke", level: i.level, prompt, course: i.course, a2: false, scene, display: i.display, known, steps, answer: { value, unit, tex: answerTex, text: answerText }, extra, inputs: { ...i, D: Dshown } };
}

export function generateHooke(level: number, o: { setting: string; ask: string; givenAs: string; kind: string; units: string; g: GValue; display: Common["display"]; course: "AS" | "A2" }): MechProblemData {
  const pickIn = (s: string, f: string): string => { const xs = s.split(",").filter(Boolean); return xs[Math.floor(Math.random() * xs.length)] ?? f; };
  const setting = pickIn(o.setting, "horizontal") as Setting;
  const kind = (pickIn(o.kind, "string") === "spring" ? "spring" : "string") as "spring" | "string";
  const conv = o.units === "conv";
  const validAsk: Record<Setting, Ask[]> = { horizontal: ["tension", "extension", "k", "modulus"], hanging: ["extension", "length", "modulus", "mass"], two: ["extension"] };
  const asks = o.ask.split(",").filter((a) => validAsk[setting].includes(a as Ask)) as Ask[];
  const ask = asks.length ? asks[Math.floor(Math.random() * asks.length)] : validAsk[setting][0];
  for (let tries = 0; tries < 400; tries++) {
    const lam = inRange([20, 200, 5]), l = inRange([0.4, 3, 0.1]);
    const lUnit: LenUnit = conv && setting !== "two" && Math.random() < 0.6 ? "cm" : "m";
    const compress = kind === "spring" && setting === "horizontal" && Math.random() < 0.4;
    const x = compress ? inRange([0.05, Math.min(0.4, l - 0.1), 0.05]) : inRange([0.05, 1, 0.05]);
    const m = inRange([0.2, 6, 0.1]);
    const base = { level, course: o.course, display: o.display, setting, kind, ask, givenAs: (pickIn(o.givenAs, "length") === "extension" ? "extension" : "length") as "length" | "extension", compress, lUnit, g: o.g, lam, l, x, m, F: 0, lam2: 0, l2: 0, x2: 0, D: 0 };
    if (setting === "hanging") {
      const ex = (m * o.g * l) / lam;
      if (!(ex >= 0.05 && ex <= 1.5 * l)) continue;
      if (lUnit === "cm" && Math.abs(lenIn(l, "cm") - Math.round(lenIn(l, "cm"))) > 1e-9) continue;
      return buildHooke(base);
    }
    if (setting === "two") {
      const lam2 = inRange([20, 200, 5]), l2 = inRange([0.4, 3, 0.1]), x2 = inRange([0.05, 0.5, 0.05]);
      const mg = m * o.g;
      const x1 = ((mg + (lam2 * x2) / l2) * l) / lam;
      if (!(x1 >= 0.05 && x1 <= 1.5)) continue;
      const Ds = sig(l + l2 + x1 + x2, 3);
      const x1s = ((lam2 * (Ds - l - l2)) / l2 + mg) / (lam / l + lam2 / l2);
      if (!(x1s > 0.02 && Ds - l - l2 - x1s > 0.02)) continue;
      return buildHooke({ ...base, lam2, l2, x2, lUnit: "m", x: x1 });
    }
    if (lUnit === "cm" && Math.abs(lenIn(l, "cm") - Math.round(lenIn(l, "cm"))) > 1e-9) continue;
    if (lUnit === "cm" && Math.abs(lenIn(x, "cm") - Math.round(lenIn(x, "cm"))) > 1e-9) continue;
    const T = (lam * x) / l;
    if (T < 2 || T > 2000) continue;
    return buildHooke(base);
  }
  return buildHooke({ level, course: o.course, display: o.display, setting: "horizontal", kind: "string", ask: "tension", givenAs: "length", compress: false, lUnit: "m", g: o.g, lam: 90, l: 1.5, x: 0.4, m: 0, F: 0, lam2: 0, l2: 0, x2: 0, D: 0 });
}
