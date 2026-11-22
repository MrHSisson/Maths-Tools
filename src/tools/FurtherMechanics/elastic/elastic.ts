// Elastic Energy Problems (elastic): conservation of energy with an elastic term, GPE + EPE + KE. A spring or string released on a smooth table (the energy stored, then the speed
// at the natural length or at a given extension), a particle dropped from the support on a string (the maximum extension, the acceleration at the lowest point, the greatest
// speed, the distance below the support), and at A2 a rough table (friction takes work). Brief: specs/further-mechanics-mc.md §5.11. The brief's note on splitting this sub-tool:
// with three settings in one pool it stays one. Equations first (R5): the physical inputs are picked and every answer is computed from them.
import { buildElasticHorizontal, buildElasticVertical, numTex, sfTex, sig, type GValue, type MechProblemData } from "../../../shared/mechanics";
import { inRange } from "../../../shared/mechanics/contexts";
import { L, staged, u, ut, type Common } from "../workDone/common";
import { thing } from "./common";

type Setting = "horizontal" | "vertical" | "rough";
type Ask = "speedNat" | "speedAt" | "maxext" | "acc" | "maxspeed" | "rest" | "stop";

interface ElasticInput extends Common {
  setting: Setting;
  kind: "spring" | "string";
  ask: Ask;
  g: GValue;
  m: number;
  lam: number;
  l: number;
  /** the extension (or compression) it is released from (horizontal and rough), and the extension at the point asked about (speedAt) */
  x: number;
  x2: number;
  /** a constant frictional force on the rough table (N) */
  F: number;
  compress: boolean;
}

/** the largest extension of a string that drops from its support: λx² − 2mgl x − 2mgl² = 0, positive root */
const maxExtension = (m: number, g: number, l: number, lam: number): number => (m * g * l + Math.sqrt((m * g * l) ** 2 + 2 * lam * m * g * l * l)) / lam;

export function buildElastic(i: ElasticInput): MechProblemData {
  const r3 = "\\ (3\\text{ s.f.})";
  const g = i.g, G = numTex(g), M = numTex(i.m);
  const known: string[] = [`m = ${u(i.m, "kg")}`, `l = ${u(i.l, "m")}`, `\\lambda = ${u(i.lam, "N")}`];
  const steps: MechProblemData["steps"] = [];
  const sub = (caption: string, lines: string[]) => steps.push({ caption, lines });
  const epe = (x: number): number => (i.lam * x * x) / (2 * i.l);
  let value = 0, unit = "", prompt = "", answerTex = "", answerText = "";
  let extra: MechProblemData["extra"];
  let raw;

  if (i.setting === "vertical") {
    const x = maxExtension(i.m, g, i.l, i.lam), mg = i.m * g;
    const a = i.lam / (2 * i.l), b = mg, c = mg * i.l;
    const e = (mg * i.l) / i.lam;
    prompt = `A particle of mass ${ut(i.m, "kg")} is attached to one end of a light elastic string of natural length ${ut(i.l, "m")} and modulus of elasticity ${ut(i.lam, "N")}. The other end of the string is fixed at a point O. The particle is released from rest at O and falls vertically. Take $g = ${g}$. `;
    known.push(`g = ${G}\\ \\text{m s}^{-2}`);
    const quadratic = () => {
      sub("Conservation of energy from O to the lowest point, with the zero level of GPE at the lowest point. At O: KE = 0 (from rest) and EPE = 0 (string slack). At the lowest point: KE = 0 and GPE = 0", ["\\text{GPE}_{1} + \\text{EPE}_{1} + \\text{KE}_{1} = \\text{GPE}_{2} + \\text{EPE}_{2} + \\text{KE}_{2}", `mg(l + x) + 0 + 0 = 0 + \\dfrac{\\lambda x^{2}}{2l} + 0`, `${M}\\times${G}\\times(${numTex(i.l)} + x) = \\dfrac{${numTex(i.lam)}x^{2}}{2\\times${numTex(i.l)}}`]);
      sub("Rearrange into a quadratic in x", [`${sfTex(a, 6)}x^{2} - ${sfTex(b, 6)}x - ${sfTex(c, 6)} = 0`]);
      sub("Solve, taking the positive root (x is a length)", [`x = \\dfrac{${sfTex(b, 6)} + \\sqrt{${sfTex(b, 6)}^{2} + 4\\times${sfTex(a, 6)}\\times${sfTex(c, 6)}}}{2\\times${sfTex(a, 6)}} = ${sfTex(x, 6)}\\ \\text{m}`]);
    };
    if (i.ask === "maxext") {
      value = sig(x, 3); unit = "m";
      prompt += "Find the greatest extension of the string.";
      quadratic();
      sub("Round to 3 s.f.", [`x = ${u(value, unit)}${r3}`]);
    } else if (i.ask === "rest") {
      value = sig(i.l + x, 3); unit = "m";
      prompt += "Find the greatest distance of the particle below O.";
      quadratic();
      sub("The distance below O is the natural length plus the extension", [`\\text{distance} = ${numTex(i.l)} + ${sfTex(x, 6)} = ${sfTex(i.l + x, 6)}\\ \\text{m}`, `\\text{distance} = ${u(value, unit)}${r3}`]);
    } else if (i.ask === "acc") {
      const acc = (i.lam * x) / (i.l * i.m) - g;
      value = sig(acc, 3); unit = "m s⁻²";
      prompt += "Find the acceleration of the particle at its lowest point.";
      quadratic();
      sub("At the lowest point the tension is T = λx ÷ l, upwards, and the weight acts downwards", [`T = \\dfrac{${numTex(i.lam)}\\times${sfTex(x, 6)}}{${numTex(i.l)}} = ${sfTex((i.lam * x) / i.l, 6)}\\ \\text{N}`]);
      sub("F = ma, taking upwards as positive", [`T - mg = ma`, `${sfTex((i.lam * x) / i.l, 6)} - ${sfTex(mg, 6)} = ${M}a`, `a = ${u(value, unit)}${r3}\\ \\text{upwards}`]);
    } else {
      const v2 = 2 * (mg * (i.l + e) - (i.lam * e * e) / (2 * i.l)) / i.m;
      value = sig(Math.sqrt(v2), 3); unit = "m s⁻¹";
      prompt += "Find the greatest speed of the particle.";
      sub("The speed is greatest when the acceleration is zero, so the tension equals the weight", [`T = mg`, `\\dfrac{\\lambda e}{l} = mg \\Rightarrow e = \\dfrac{mgl}{\\lambda} = \\dfrac{${M}\\times${G}\\times${numTex(i.l)}}{${numTex(i.lam)}} = ${sfTex(e, 6)}\\ \\text{m}`]);
      sub("Conservation of energy from O to this point, with the zero level of GPE here. At O: KE = 0 (from rest) and EPE = 0 (string slack)", ["mg(l + e) = \\dfrac{\\lambda e^{2}}{2l} + \\tfrac{1}{2}mv^{2}", `${M}\\times${G}\\times(${numTex(i.l)} + ${sfTex(e, 6)}) = \\dfrac{${numTex(i.lam)}\\times${sfTex(e, 6)}^{2}}{2\\times${numTex(i.l)}} + \\tfrac{1}{2}(${M})v^{2}`]);
      sub("Solve for v² and take the positive root", [`v^{2} = ${sfTex(v2, 6)}`, `v = ${u(value, unit)}${r3}`]);
    }
    raw = buildElasticVertical({ kind: "elastic", body: "particle", mass: L("m"), fixed: "O", natural: L(ut(i.l, "m")), extension: L("x", "x"), modulus: L("λ"), states: [{ ext: 0, ghost: true, name: "O" }, { ext: 0.8, name: "B", weight: L("mg"), tension: L("T") }] });
  } else {
    // a spring or string released from rest on a table: smooth, or rough (A2, a constant friction F)
    const rough = i.setting === "rough";
    const state = i.compress ? "compressed" : "stretched";
    const E0 = epe(i.x);
    const fr = rough ? i.F * i.x : 0;
    prompt = `${thing(i.kind)}, of natural length ${ut(i.l, "m")} and modulus of elasticity ${ut(i.lam, "N")}, has one end fixed to a wall. The other end is attached to a particle of mass ${ut(i.m, "kg")} on a ${rough ? "rough" : "smooth"} horizontal table. The particle is held with the ${i.kind} ${state} by ${ut(i.x, "m")} and released from rest.${rough ? ` The friction on the particle is a constant ${ut(i.F, "N")}.` : ""} `;
    if (rough) known.push(`F = ${u(i.F, "N")}`);
    known.push(`x = ${u(i.x, "m")}`);
    const energyLines = (withFriction: boolean) => [`\\text{EPE}_{1} = \\dfrac{\\lambda x^{2}}{2l} = \\dfrac{${numTex(i.lam)}\\times${numTex(i.x)}^{2}}{2\\times${numTex(i.l)}} = ${sfTex(E0, 6)}\\ \\text{J}`, ...(withFriction ? [`\\text{work against friction} = Fx = ${numTex(i.F)}\\times${numTex(i.x)} = ${sfTex(fr, 6)}\\ \\text{J}`] : [])];
    if (i.ask === "stop") {
      const s = (E0 - fr) / i.F;
      value = sig(s, 3); unit = "m";
      prompt += "Find how far the particle slides after the string goes slack, before it comes to rest.";
      sub("The energy stored", energyLines(true));
      sub("By the natural length the string goes slack with the energy left over as kinetic energy (KE₁ = 0 and EPE₂ = 0)", [`\\text{EPE}_{1} = \\tfrac{1}{2}mv^{2} + Fx`, `\\tfrac{1}{2}mv^{2} = ${sfTex(E0 - fr, 6)}\\ \\text{J}`]);
      sub("Then friction alone brings it to rest: the work done against friction is the kinetic energy", [`F s = ${sfTex(E0 - fr, 6)}`, `s = \\dfrac{${sfTex(E0 - fr, 6)}}{${numTex(i.F)}} = ${u(value, unit)}${r3}`]);
    } else if (i.ask === "speedAt") {
      const v2 = (2 * (epe(i.x) - epe(i.x2) - (rough ? i.F * (i.x - i.x2) : 0))) / i.m;
      value = sig(Math.sqrt(v2), 3); unit = "m s⁻¹";
      prompt += `Find the speed of the particle when the ${i.kind} is ${state} by ${ut(i.x2, "m")}.`;
      known.push(`x_{2} = ${u(i.x2, "m")}`);
      sub(`Energy equation between the two positions. At the start KE = 0 (from rest)${rough ? "; friction acts over the distance moved" : ""}`, [rough ? `\\tfrac{\\lambda x^{2}}{2l} = \\tfrac{\\lambda x_{2}^{2}}{2l} + \\tfrac{1}{2}mv^{2} + F(x - x_{2})` : `\\tfrac{\\lambda x^{2}}{2l} = \\tfrac{\\lambda x_{2}^{2}}{2l} + \\tfrac{1}{2}mv^{2}`, `${sfTex(E0, 6)} = ${sfTex(epe(i.x2), 6)} + \\tfrac{1}{2}(${M})v^{2}${rough ? ` + ${sfTex(i.F * (i.x - i.x2), 6)}` : ""}`]);
      sub("Solve for v² and take the positive root", [`v^{2} = ${sfTex(v2, 6)}`, `v = ${u(value, unit)}${r3}`]);
    } else {
      const v2 = (2 * (E0 - fr)) / i.m;
      value = sig(Math.sqrt(v2), 3); unit = "m s⁻¹";
      extra = rough ? undefined : [{ value: sig(Math.sqrt(v2), 3), unit: "m s⁻¹" }];
      prompt += rough ? `Find the speed of the particle when the ${i.kind} reaches its natural length.` : `Find (a) the elastic potential energy stored initially, (b) the speed of the particle when the ${i.kind} reaches its natural length.`;
      sub("The energy stored", energyLines(rough));
      sub(`Conservation of energy to the natural length. KE = 0 at the start (from rest) and EPE = 0 at the natural length${rough ? "; friction acts over the distance x" : ""}`, [rough ? "\\text{EPE}_{1} = \\tfrac{1}{2}mv^{2} + Fx" : "\\text{EPE}_{1} = \\tfrac{1}{2}mv^{2}", `${sfTex(E0, 6)} = \\tfrac{1}{2}(${M})v^{2}${rough ? ` + ${sfTex(fr, 6)}` : ""}`]);
      sub("Solve for v² and take the positive root", [`v^{2} = ${sfTex(v2, 6)}`, `v = ${u(value, unit)}${r3}`]);
      if (!rough) { value = Number(E0.toPrecision(12)); unit = "J"; extra = [{ value: sig(Math.sqrt(v2), 3), unit: "m s⁻¹" }]; answerTex = `\\text{(a)}\\ ${u(sig(E0, 3), "J")},\\ \\text{(b)}\\ ${u(sig(Math.sqrt(v2), 3), "m s⁻¹")}`; answerText = `(a) ${ut(sig(E0, 3), "J")}, (b) ${ut(sig(Math.sqrt(v2), 3), "m s⁻¹")}`; }
    }
    raw = buildElasticHorizontal({ kind: i.kind === "spring" ? "spring" : "elastic", state: i.compress ? "compressed" : "extended", body: "block", mass: L("m"), natural: L(ut(i.l, "m")), extension: L(ut(i.x, "m")), modulus: L(ut(i.lam, "N")) });
  }
  prompt += " Give your answers to 3 significant figures.";
  if (!answerTex) { answerTex = u(value, unit); answerText = ut(value, unit); }
  return { sub: "elastic", level: i.level, prompt, course: i.course, a2: i.setting === "rough", scene: staged(raw, i.display, ["setting", "mass", "spring", "lengths", "forces"]), display: i.display, known, steps, answer: { value, unit, tex: answerTex, text: answerText }, extra, inputs: { ...i } };
}

export function generateElastic(level: number, o: { setting: string; ask: string; kind: string; g: GValue; display: Common["display"]; course: "AS" | "A2" }): MechProblemData {
  const pickIn = (s: string, f: string): string => { const xs = s.split(",").filter(Boolean); return xs[Math.floor(Math.random() * xs.length)] ?? f; };
  let setting = pickIn(o.setting, "horizontal") as Setting;
  if (setting === "rough" && o.course !== "A2") setting = "vertical";
  const validAsk: Record<Setting, Ask[]> = { horizontal: ["speedNat", "speedAt"], vertical: ["maxext", "acc", "maxspeed", "rest"], rough: ["speedNat", "speedAt", "stop"] };
  const asks = o.ask.split(",").filter((a) => validAsk[setting].includes(a as Ask)) as Ask[];
  const ask = asks.length ? asks[Math.floor(Math.random() * asks.length)] : validAsk[setting][0];
  const kind = (setting === "vertical" || pickIn(o.kind, "string") === "string" || ask === "stop" ? "string" : "spring") as "spring" | "string";
  for (let tries = 0; tries < 400; tries++) {
    const lam = inRange([20, 300, 10]), l = inRange([0.4, 2, 0.1]);
    const compress = kind === "spring" && setting !== "vertical" && ask !== "stop" && Math.random() < 0.4;
    const m = setting === "vertical" ? inRange([0.5, 5, 0.1]) : inRange([0.2, 4, 0.1]);
    const x = inRange([0.1, compress ? Math.min(0.5, l - 0.1) : 0.8, 0.05]);
    const x2 = inRange([0.05, Math.max(0.05, x - 0.05), 0.05]);
    const base = { level, course: o.course, display: o.display, setting, kind, ask, g: o.g, m, lam, l, x, x2, F: 0, compress };
    if (setting === "vertical") {
      const xm = maxExtension(m, o.g, l, lam);
      if (!(xm >= 0.1 && xm <= 3 * l && l + xm <= 6)) continue;
      return buildElastic(base);
    }
    const E0 = (lam * x * x) / (2 * l);
    const F = setting === "rough" ? inRange([1, 20, 1]) : 0;
    if (setting === "rough" && !(E0 - F * x > 0.2 * E0)) continue;
    if (ask === "speedAt" && !(x2 < x)) continue;
    if (ask === "speedAt" && E0 - (lam * x2 * x2) / (2 * l) - F * (x - x2) <= 0) continue;
    const v = Math.sqrt((2 * (E0 - F * x)) / m);
    if (!(v >= 0.5 && v <= 25)) continue;
    if (ask === "stop" && !((E0 - F * x) / F >= 0.2 && (E0 - F * x) / F <= 30)) continue;
    return buildElastic({ ...base, F });
  }
  return buildElastic({ level, course: o.course, display: o.display, setting: "horizontal", kind: "spring", ask: "speedNat", g: o.g, m: 0.6, lam: 120, l: 0.5, x: 0.2, x2: 0, F: 0, compress: true });
}
