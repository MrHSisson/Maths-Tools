// Kinetic and Potential Energy (kepe): KE = ½mv² and GPE = mgh evaluated, a mass, speed or height found from the energy, a gain or loss between two states, and (A2) KE with
// velocity vectors. Equations first (R5): the state is picked, the energy derived and, when it is a given, rounded to 3 s.f., with the answer recomputed from what is shown.
// Brief: specs/further-mechanics-mc.md §5.6.
import { buildHorizontal, buildVertical, gravityWork, kineticEnergy, numTex, sfTex, sig, speedFromKE, type GValue, type MechProblemData } from "../../../shared/mechanics";
import { CONTEXTS, inRange, pickContext } from "../../../shared/mechanics/contexts";
import { cap, L, staged, u, ut, type Common } from "../workDone/common";
import { massIn, speedIn, speedText, type MassUnit, type SpeedUnit } from "./common";

interface KepeInput extends Common {
  energy: "ke" | "gpe";
  ask: "energy" | "mass" | "speed" | "height" | "change";
  g: GValue;
  /** mass (kg) written in mUnit; speeds (m s⁻¹) written in vUnit; heights (m) */
  m: number;
  mUnit: MassUnit;
  vUnit: SpeedUnit;
  u: number;
  v: number;
  h1: number;
  h2: number;
  wUnit: "J" | "kJ";
  /** (A2) velocity vectors: the components of the first and second velocity, in m s⁻¹ */
  vector: boolean;
  vec: [number, number, number, number];
  ctx: string;
}

export function buildKepe(i: KepeInput): MechProblemData {
  const c = CONTEXTS.find((x) => x.id === i.ctx);
  const k = i.wUnit === "kJ" ? 1000 : 1;
  const ke = i.energy === "ke";
  const s2a = i.vector ? i.vec[0] ** 2 + i.vec[1] ** 2 : i.u ** 2, s2b = i.vector ? i.vec[2] ** 2 + i.vec[3] ** 2 : i.v ** 2;
  // the true energy for the state(s), then the given (3 s.f. if it is not the answer)
  const E = ke ? kineticEnergy(i.m, i.v) : gravityWork(i.m, i.h1, i.g);
  const dE = ke ? 0.5 * i.m * (s2b - s2a) : gravityWork(i.m, i.h2 - i.h1, i.g);
  const Eg = i.ask === "change" ? sig(dE, 3) : sig(E, 3);
  let value: number, unit: string;
  switch (i.ask) {
    case "energy": value = sig(E, 3) / k; unit = i.wUnit; break;
    case "mass": value = sig(ke ? (2 * Eg) / i.v ** 2 : Eg / (i.g * i.h1), 3); unit = "kg"; break;
    case "speed": value = speedIn(sig(speedFromKE(i.m, Eg), 3), i.vUnit); unit = i.vUnit; break;
    case "height": value = sig(Eg / (i.m * i.g), 3); unit = "m"; break;
    default: value = Math.abs(sig(dE, 3)) / k; unit = i.wUnit;
  }
  if (i.ask === "speed") value = sig(speedIn(speedFromKE(i.m, Eg), i.vUnit), 3);
  const gain = dE >= 0;
  const what = ke ? "kinetic energy" : "gravitational potential energy";
  const subject = c ? cap(c.a) : "A particle";
  const mText = i.ask === "mass" ? "of mass $m$ kg" : `of mass ${ut(massIn(i.m, i.mUnit), i.mUnit)}`;
  const state = (b: boolean): string => (b ? "moves" : "moves");
  void state;
  const parts: string[] = [];
  if (i.vector) {
    parts.push(`${subject} ${mText} moves with velocity $(${i.vec[0]}\\mathbf{i} + ${i.vec[1]}\\mathbf{j})$ m s⁻¹ and later with velocity $(${i.vec[2]}\\mathbf{i} + ${i.vec[3]}\\mathbf{j})$ m s⁻¹.`);
  } else if (ke && i.ask === "change") {
    parts.push(`${subject} ${mText} changes speed from ${speedText(i.u, i.vUnit)} to ${speedText(i.v, i.vUnit)}.`);
  } else if (ke) {
    parts.push(`${subject} ${mText} is moving ${i.ask === "speed" ? "" : `with a speed of ${speedText(i.v, i.vUnit)}`}`.trim() + ".");
  } else if (i.ask === "change") {
    parts.push(`${subject} ${mText} moves from a height of ${ut(i.h1, "m")} to a height of ${ut(i.h2, "m")} above the ground.`);
  } else {
    parts.push(`${subject} ${mText} is ${i.ask === "height" ? "at a height of $h$ m" : `at a height of ${ut(i.h1, "m")}`} above the ground.`);
  }
  if (i.ask === "mass" || i.ask === "speed" || i.ask === "height") parts.push(`Its ${what} is ${ut(Eg / k, i.wUnit)}.`);
  if (i.ask === "mass" && ke) parts[0] = `${subject} ${mText} is moving with a speed of ${speedText(i.v, i.vUnit)}.`;
  if (i.ask === "speed") parts[0] = `${subject} ${mText} is moving.`;
  const wantGain = i.ask === "change" ? (gain ? "gain" : "loss") : "";
  if (!ke) parts.push(`Take $g = ${i.g}$ m s⁻².`);
  parts.push(i.ask === "energy" ? `Find its ${what}${i.wUnit === "kJ" ? ", in kJ" : ""}.` : i.ask === "mass" ? "Find the mass." : i.ask === "speed" ? `Find its speed${i.vUnit === "km h⁻¹" ? ", in km h⁻¹" : ""}.` : i.ask === "height" ? "Find the height." : `Find the ${wantGain} in its ${what}${i.wUnit === "kJ" ? ", in kJ" : ""}.`);
  parts.push("Give your answer to 3 significant figures.");

  const known = [
    ...(i.ask === "mass" ? [] : [`m = ${u(massIn(i.m, i.mUnit), i.mUnit)}`]),
    ...(ke && !i.vector && i.ask !== "speed" && i.ask !== "mass" ? (i.ask === "change" ? [`u = ${u(speedIn(i.u, i.vUnit), i.vUnit)}`, `v = ${u(speedIn(i.v, i.vUnit), i.vUnit)}`] : [`v = ${u(speedIn(i.v, i.vUnit), i.vUnit)}`]) : []),
    ...(ke && i.ask === "mass" ? [`v = ${u(speedIn(i.v, i.vUnit), i.vUnit)}`] : []),
    ...(i.vector ? [`\\mathbf{v}_1 = ${i.vec[0]}\\mathbf{i} + ${i.vec[1]}\\mathbf{j}`, `\\mathbf{v}_2 = ${i.vec[2]}\\mathbf{i} + ${i.vec[3]}\\mathbf{j}`] : []),
    ...(!ke ? (i.ask === "change" ? [`h_1 = ${u(i.h1, "m")}`, `h_2 = ${u(i.h2, "m")}`] : i.ask === "height" ? [] : [`h = ${u(i.h1, "m")}`]) : []),
    ...(i.ask === "mass" || i.ask === "speed" || i.ask === "height" ? [`${ke ? "KE" : "GPE"} = ${u(Eg / k, i.wUnit)}`] : []),
    ...(ke ? [] : [`g = ${i.g}\\ \\text{m s}^{-2}`]),
  ];

  const steps: MechProblemData["steps"] = [];
  steps.push({ caption: ke ? "Kinetic energy is half the mass times the speed squared" : "Gravitational potential energy is mass times g times height", lines: [ke ? "\\text{KE} = \\tfrac{1}{2}mv^{2}" : "\\text{GPE} = mgh"] });
  const conv: string[] = [];
  if (i.mUnit !== "kg" && i.ask !== "mass") conv.push(`${u(massIn(i.m, i.mUnit), i.mUnit)} = ${u(i.m, "kg")}`);
  if (i.vUnit === "km h⁻¹" && ke && i.ask !== "speed") {
    const vs = i.ask === "change" ? [i.u, i.v] : [i.v];
    for (const x of vs) conv.push(`${u(speedIn(x, "km h⁻¹"), "km h⁻¹")} = ${numTex(speedIn(x, "km h⁻¹"))} \\div 3.6 = ${u(x, "m s⁻¹")}`);
  }
  if (i.wUnit === "kJ" && (i.ask === "mass" || i.ask === "speed" || i.ask === "height")) conv.push(`${u(Eg / k, "kJ")} = ${u(Eg, "J")}`);
  if (conv.length) steps.push({ caption: "Convert to SI units first", lines: conv });
  const r3 = (x: number) => `\\text{ (3 s.f.)}`.replace("\\text{ (3 s.f.)}", "\\ (3\\text{ s.f.})") + (x === 0 ? "" : "");
  if (i.ask === "energy") {
    steps.push({ caption: "Substitute", lines: ke ? [`\\text{KE} = \\tfrac{1}{2} \\times ${numTex(i.m)} \\times ${numTex(i.v)}^{2}`, `= ${u(E, "J")}`] : [`\\text{GPE} = ${numTex(i.m)} \\times ${numTex(i.g)} \\times ${numTex(i.h1)}`, `= ${u(Number(E.toPrecision(12)), "J")}`] });
    steps.push({ caption: i.wUnit === "kJ" ? "Round to 3 s.f., in kJ" : "Round to 3 s.f.", lines: [`${ke ? "\\text{KE}" : "\\text{GPE}"} = ${u(value, i.wUnit)}${r3(0)}`] });
  } else if (i.ask === "mass") {
    steps.push({ caption: "Rearrange for m", lines: [ke ? "m = \\dfrac{2\\,\\text{KE}}{v^{2}}" : "m = \\dfrac{\\text{GPE}}{gh}"] });
    steps.push({ caption: "Substitute", lines: [ke ? `m = \\dfrac{2 \\times ${numTex(Eg)}}{${numTex(i.v)}^{2}}` : `m = \\dfrac{${numTex(Eg)}}{${numTex(i.g)} \\times ${numTex(i.h1)}}`, `m = ${u(value, "kg")}${r3(0)}`] });
  } else if (i.ask === "speed") {
    const v2 = (2 * Eg) / i.m;
    steps.push({ caption: "Rearrange for v², then take the positive square root (a speed cannot be negative)", lines: ["v^{2} = \\dfrac{2\\,\\text{KE}}{m}"] });
    steps.push({ caption: "Substitute", lines: [`v^{2} = \\dfrac{2 \\times ${numTex(Eg)}}{${numTex(i.m)}} = ${sfTex(v2, 6)}`, `v = ${sfTex(Math.sqrt(v2), 6)}\\ \\text{m s}^{-1}`] });
    if (i.vUnit === "km h⁻¹") steps.push({ caption: "Convert to km h⁻¹: multiply by 3.6", lines: [`${sfTex(Math.sqrt(v2), 6)} \\times 3.6 = ${u(value, "km h⁻¹")}${r3(0)}`] });
    else steps.push({ caption: "Round to 3 s.f.", lines: [`v = ${u(value, "m s⁻¹")}${r3(0)}`] });
  } else if (i.ask === "height") {
    steps.push({ caption: "Rearrange for h", lines: ["h = \\dfrac{\\text{GPE}}{mg}"] });
    steps.push({ caption: "Substitute", lines: [`h = \\dfrac{${numTex(Eg)}}{${numTex(i.m)} \\times ${numTex(i.g)}}`, `h = ${u(value, "m")}${r3(0)}`] });
  } else if (i.vector) {
    steps.push({ caption: "Speed squared is the sum of the squares of the components", lines: [`v_{1}^{2} = ${i.vec[0]}^{2} + ${i.vec[1]}^{2} = ${numTex(s2a)}`, `v_{2}^{2} = ${i.vec[2]}^{2} + ${i.vec[3]}^{2} = ${numTex(s2b)}`] });
    steps.push({ caption: `The ${gain ? "gain" : "loss"} in kinetic energy`, lines: [`\\Delta\\text{KE} = \\tfrac{1}{2} \\times ${numTex(i.m)} \\times (${numTex(s2b)} - ${numTex(s2a)})`, `= ${u(Number(dE.toPrecision(12)), "J")}`, `\\text{${gain ? "gain" : "loss"}} = ${u(value, i.wUnit)}${r3(0)}`] });
  } else if (ke) {
    steps.push({ caption: `The ${gain ? "gain" : "loss"} in kinetic energy is the difference between the two`, lines: [`\\Delta\\text{KE} = \\tfrac{1}{2} \\times ${numTex(i.m)} \\times (${numTex(i.v)}^{2} - ${numTex(i.u)}^{2})`, `= ${u(Number(dE.toPrecision(12)), "J")}`, `\\text{${gain ? "gain" : "loss"}} = ${u(value, i.wUnit)}${r3(0)}`] });
  } else {
    steps.push({ caption: `The ${gain ? "gain" : "loss"} in potential energy is mg times the change in height`, lines: [`\\Delta\\text{GPE} = ${numTex(i.m)} \\times ${numTex(i.g)} \\times (${numTex(i.h2)} - ${numTex(i.h1)})`, `= ${u(Number(dE.toPrecision(12)), "J")}`, `\\text{${gain ? "gain" : "loss"}} = ${u(value, i.wUnit)}${r3(0)}`] });
  }

  let scene;
  if (ke || i.vector) {
    scene = buildHorizontal({ body: c ? "block" : "particle", weightAndNormal: false, velocity: L(i.ask === "change" ? "u → v" : i.ask === "speed" ? "v" : speedText(i.v, i.vUnit), i.ask === "speed" ? "v" : undefined), bodyLabel: c && i.ask !== "mass" ? L(ut(massIn(i.m, i.mUnit), i.mUnit)) : undefined });
  } else {
    const up = i.h2 > i.h1;
    scene = buildVertical({
      body: c ? "block" : "particle", bodyLabel: c && i.ask !== "mass" ? L(ut(massIn(i.m, i.mUnit), i.mUnit)) : undefined,
      start: i.ask === "change" ? { rel: up ? 0.4 : 1, height: L(ut(i.h1, "m")) } : { rel: 1, height: i.ask === "height" ? L(`${i.h1} m`, "h") : L(ut(i.h1, "m")) },
      end: i.ask === "change" ? { rel: up ? 1 : 0.4, height: L(ut(i.h2, "m")) } : undefined, weight: L("mg"),
    });
  }
  return {
    sub: "kepe", level: i.level, prompt: parts.join(" "), course: i.course, a2: i.vector, scene: staged(scene, i.display, ["setting", "motion", "forces", "heights"]), display: i.vector ? "hidden" : ke ? "hidden" : i.display,
    known, steps, answer: { value, unit, tex: u(value, unit), text: ut(value, unit) }, inputs: { ...i, vec: i.vec.join(",") },
  };
}

export function generateKepe(level: number, o: { energy: string; ask: string; units: string; format: string; velocity: string; context: string; g: GValue; display: Common["display"]; course: "AS" | "A2" }): MechProblemData {
  const asks = o.ask.split(",").filter(Boolean), energies = o.energy.split(",").filter(Boolean);
  const energy = (energies[Math.floor(Math.random() * energies.length)] ?? "ke") as KepeInput["energy"];
  let ask = (asks[Math.floor(Math.random() * asks.length)] ?? "energy") as KepeInput["ask"];
  // a kinetic energy has no height to find, a potential energy no speed
  if ((energy === "ke" && ask === "height") || (energy === "gpe" && ask === "speed")) ask = "energy";
  const conv = o.units === "conv";
  const ctx = o.context === "story" ? pickContext("energy", conv ? true : undefined) : undefined;
  let m = ctx ? inRange(ctx.mass) : inRange([2, 60, 2]);
  let mUnit: MassUnit = "kg";
  if (conv) { if (m >= 1000 && m % 100 === 0) mUnit = "tonne"; else if (m < 1) mUnit = "g"; }
  let vUnit: SpeedUnit = "m s⁻¹";
  let v = ctx?.speed ? inRange(ctx.speed) : inRange([3, 30, 1]);
  let uu = Math.max(1, v - inRange([1, 8, 1]));
  if (conv && energy === "ke") { vUnit = "km h⁻¹"; const kv = inRange([2, 6, 1]); v = 18 * kv; uu = 18 * inRange([1, kv - 1, 1]); }
  const h1 = ctx ? inRange(ctx.height) : inRange([3, 40, 1]);
  const h2 = Math.max(1, h1 + (Math.random() < 0.5 ? -1 : 1) * inRange([2, 20, 1]));
  const vector = o.velocity === "vector" && o.course === "A2" && energy === "ke" && ask === "change";
  let vec: KepeInput["vec"] = [3, 4, 4.5, 4.5];
  if (vector) { const a = inRange([1, 8, 1]), b = inRange([1, 8, 1]); vec = [a, b, a + inRange([1, 4, 1]), b + inRange([1, 4, 1])]; m = inRange([200, 2000, 100]); mUnit = "kg"; }
  const wUnit: KepeInput["wUnit"] = o.format === "kj" ? "kJ" : "J";
  const toSI = (x: number) => (vUnit === "km h⁻¹" ? x / 3.6 : x);
  return buildKepe({ level, course: o.course, display: o.display, energy, ask, g: o.g, m, mUnit, vUnit, u: toSI(uu), v: toSI(v), h1, h2, wUnit, vector, vec, ctx: ctx?.id ?? "particle" });
}
