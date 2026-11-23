// Work-Energy Principle (workenergy): the work done by the forces equals the change in kinetic energy, on level ground or along a slope given by its length and its rise
// (so no resolving). Finds a speed, a distance, an unknown braking or resistive force, or the work done by the driver. Brief: specs/further-mechanics-mc.md §5.7.
// Equations first (R5): the state and forces are picked; the unknown is derived from them, rounded to 3 s.f., and recomputed from the shown givens where it is a given.
import { buildHorizontal, buildIncline, gravityWork, kineticEnergy, numTex, sfTex, sig, speedFromKE, type GValue, type MechProblemData } from "../../../shared/mechanics";
import { CONTEXTS, inRange, pickContext } from "../../../shared/mechanics/contexts";
import { cap, L, staged, u, ut, type Common } from "../workDone/common";
import { massIn, speedIn, speedText, type MassUnit, type SpeedUnit } from "./common";
import { generatePulleyEnergy, generateRough } from "./special";

interface WorkEnergyInput extends Common {
  setting: "horizontal" | "slope";
  ask: "speed" | "distance" | "force" | "work";
  /** gravity's part: "work" writes work done against or by gravity; "pe" writes GPE and KE on both sides */
  method: "work" | "pe";
  g: GValue;
  m: number;
  mUnit: MassUnit;
  vUnit: SpeedUnit;
  /** start and end speeds (m s⁻¹); the end is the answer when asking for the speed */
  u: number;
  v: number;
  /** a constant driving force, a known resistance (N), and (when asking for a force) the unknown opposing force X; the distance travelled (m); the rise along it (+) or fall (−) in m */
  D: number;
  R0: number;
  X: number;
  d: number;
  rise: number;
  ctx: string;
}

/** the numbers of the balance KE₁ = KE₀ + W_D − W_R − W_g, from the inputs, given the unknown: the one place the physics is written */
function balance(i: WorkEnergyInput): { KE0: number; WD: number; WR: number; Wg: number; KE1: number } {
  const KE0 = kineticEnergy(i.m, i.u), WD = i.D * i.d, WR = (i.R0 + i.X) * i.d, Wg = gravityWork(i.m, i.rise, i.g);
  return { KE0, WD, WR, Wg, KE1: KE0 + WD - WR - Wg };
}

export function buildWorkEnergy(i: WorkEnergyInput): MechProblemData {
  const c = CONTEXTS.find((x) => x.id === i.ctx);
  const slope = i.setting === "slope";
  const b = balance(i);
  const shownV = i.ask === "speed" ? NaN : i.v;
  // what is given is rounded to 3 s.f. where it was derived; the answer is recomputed from the shown values
  const Vg = i.ask === "speed" ? NaN : sig(i.v, 3);
  const ke1g = i.ask === "speed" ? NaN : kineticEnergy(i.m, Vg);
  let value: number, unit: string;
  switch (i.ask) {
    case "speed": value = speedIn(sig(speedFromKE(i.m, b.KE1), 3), i.vUnit); unit = i.vUnit; if (i.vUnit === "km h⁻¹") value = sig(speedIn(speedFromKE(i.m, b.KE1), i.vUnit), 3); break;
    case "distance": value = sig((ke1g - b.KE0) / (i.D - i.R0 - i.X), 3); unit = "m"; break;
    case "force": value = sig((b.KE0 + i.D * i.d - i.R0 * i.d - b.Wg - ke1g) / i.d, 3); unit = "N"; break;
    default: value = sig(ke1g - b.KE0 + (i.R0 + i.X) * i.d + b.Wg, 3); unit = "J";
  }
  void shownV;
  const subject = c ? cap(c.a) : "A particle";
  const rises = i.rise >= 0, R = Math.abs(i.rise);
  const mTxt = ut(massIn(i.m, i.mUnit), i.mUnit);
  const parts: string[] = [];
  const road = slope ? `along a straight road that ${rises ? "rises" : "falls"} ${ut(R, "m")} over this distance` : "along a straight horizontal road";
  const dist = i.ask === "distance" ? "a distance $d$ m" : ut(i.d, "m");
  parts.push(`${subject} of mass ${mTxt} travels ${dist} ${road}. Its speed at the start is ${speedText(i.u, i.vUnit)}${i.ask === "speed" ? "." : ` and its speed at the end is ${speedText(Vg, i.vUnit)}.`}`);
  const forces: string[] = [];
  if (i.D > 0) forces.push(`a constant driving force of ${ut(i.D, "N")}`);
  if (i.R0 > 0) forces.push(`a constant resistance to motion of ${ut(i.R0, "N")}`);
  if (i.ask === "force") forces.push(i.D > 0 || i.R0 > 0 ? "a further constant resisting force of $X$ N" : "a constant resisting force of $X$ N");
  if (forces.length) parts.push(`${forces.length === 1 ? "There is" : "There are"} ${forces.join(" and ")}.`);
  if (i.ask === "work") parts.push(`The driver's engine produces a constant driving force; find the work it does.`);
  if (slope) parts.push(`Take $g = ${i.g}$ m s⁻².`);
  parts.push(i.ask === "speed" ? `Find the speed at the end${i.vUnit === "km h⁻¹" ? ", in km h⁻¹" : ""}.` : i.ask === "distance" ? "Find the distance travelled." : i.ask === "force" ? "Find the value of $X$." : "Find the work done by the driving force.");
  parts.push("Give your answer to 3 significant figures.");
  if (i.ask === "work") parts[parts.length - 2] = "Find the work done by the driving force.";

  const known = [
    `m = ${u(massIn(i.m, i.mUnit), i.mUnit)}`, `u = ${u(speedIn(i.u, i.vUnit), i.vUnit)}`,
    ...(i.ask === "speed" ? [] : [`v = ${u(speedIn(Vg, i.vUnit), i.vUnit)}`]),
    ...(i.ask === "distance" ? [] : [`d = ${u(i.d, "m")}`]),
    ...(i.D > 0 && i.ask !== "work" ? [`D = ${u(i.D, "N")}`] : []), ...(i.R0 > 0 ? [`R = ${u(i.R0, "N")}`] : []),
    ...(slope ? [`\\text{${rises ? "rise" : "fall"}} = ${u(R, "m")}`] : []),
  ];

  const steps: MechProblemData["steps"] = [];
  const gword = rises ? "against" : "by";
  steps.push({ caption: "Work-energy principle: the work done by the forces is the change in kinetic energy", lines: ["\\text{Work done by the forces} = \\tfrac{1}{2}mv^{2} - \\tfrac{1}{2}mu^{2}"] });
  const conv: string[] = [];
  if (i.mUnit !== "kg") conv.push(`${u(massIn(i.m, i.mUnit), i.mUnit)} = ${u(i.m, "kg")}`);
  if (i.vUnit === "km h⁻¹") for (const x of i.ask === "speed" ? [i.u] : [i.u, Vg]) conv.push(`${u(speedIn(x, "km h⁻¹"), "km h⁻¹")} = ${u(Number(x.toPrecision(12)), "m s⁻¹")}`);
  if (conv.length) steps.push({ caption: "Convert to SI units first", lines: conv });

  const pe = slope && i.method === "pe";
  const U = numTex(i.u), M = numTex(i.m);
  const wlines: string[] = [];
  if (i.D > 0 && i.ask !== "work") wlines.push(`\\text{WD by driving force} = ${numTex(i.D)} \\times ${numTex(i.d)} = ${u(b.WD, "J")}`);
  if (i.R0 > 0 && i.ask !== "distance") wlines.push(`\\text{WD against resistance} = ${numTex(i.R0)} \\times ${numTex(i.d)} = ${u(i.R0 * i.d, "J")}`);
  if (slope && !pe) wlines.push(`\\text{WD ${gword} gravity} = ${M} \\times ${numTex(i.g)} \\times ${numTex(R)} = ${u(Number(Math.abs(b.Wg).toPrecision(12)), "J")}`);
  if (wlines.length && i.ask !== "force" && i.ask !== "distance") steps.push({ caption: "Find each work done on its own line", lines: wlines });

  const f = (x: number) => sfTex(x, 6);
  if (i.ask === "speed") {
    const eq = pe
      ? `\\tfrac{1}{2}(${M})v^{2} + ${M}\\times${numTex(i.g)}\\times${numTex(Math.max(0, i.rise))} = \\tfrac{1}{2}(${M})(${U})^{2} + ${numTex(b.WD)} - ${numTex(i.R0 * i.d)} + ${M}\\times${numTex(i.g)}\\times${numTex(Math.max(0, -i.rise))}`
      : `\\tfrac{1}{2}(${M})v^{2} = \\tfrac{1}{2}(${M})(${U})^{2} + ${numTex(b.WD)} - ${numTex(i.R0 * i.d)}${slope ? ` ${rises ? "-" : "+"} ${numTex(Math.abs(b.Wg))}` : ""}`;
    steps.push({ caption: pe ? "Energy equation (zero level of GPE at the start): initial GPE + KE + work by driving force − work against resistance = final GPE + KE" : "Write the work-energy equation with the numbers", lines: [eq] });
    steps.push({ caption: "Solve for the kinetic energy, then the speed (positive root)", lines: [`\\tfrac{1}{2}(${M})v^{2} = ${u(Number(b.KE1.toPrecision(12)), "J")}`, `v^{2} = ${f((2 * b.KE1) / i.m)}`, `v = ${f(speedFromKE(i.m, b.KE1))}\\ \\text{m s}^{-1}`] });
    if (i.vUnit === "km h⁻¹") steps.push({ caption: "Convert to km h⁻¹: multiply by 3.6", lines: [`${f(speedFromKE(i.m, b.KE1))} \\times 3.6 = ${u(value, "km h⁻¹")}\\ (3\\text{ s.f.})`] });
    else steps.push({ caption: "Round to 3 s.f.", lines: [`v = ${u(value, "m s⁻¹")}\\ (3\\text{ s.f.})`] });
  } else if (i.ask === "distance") {
    steps.push({ caption: "The work done by the net force is the change in kinetic energy", lines: [`(${numTex(i.D)} - ${numTex(i.R0)})\\,d = \\tfrac{1}{2}(${M})(${numTex(Vg)})^{2} - \\tfrac{1}{2}(${M})(${U})^{2}`, `${numTex(i.D - i.R0)}\\,d = ${u(Number((ke1g - b.KE0).toPrecision(12)), "J")}`, `d = ${u(value, "m")}\\ (3\\text{ s.f.})`] });
  } else if (i.ask === "force") {
    const net = ke1g - b.KE0;
    const others = b.WD - i.R0 * i.d - b.Wg;
    const terms = [...(i.D > 0 ? [`${numTex(i.D)} \\times ${numTex(i.d)}`] : []), ...(i.R0 > 0 ? [`- ${numTex(i.R0)} \\times ${numTex(i.d)}`] : []), `- X \\times ${numTex(i.d)}`, ...(slope ? [`${rises ? "-" : "+"} ${numTex(Math.abs(b.Wg))}`] : [])];
    steps.push({ caption: "Write the work-energy equation, with X as the unknown force", lines: [`${terms.join(" ").replace(/^- /, "-")} = \\tfrac{1}{2}(${M})(${numTex(Vg)})^{2} - \\tfrac{1}{2}(${M})(${U})^{2}`, `${numTex(Number(others.toPrecision(12)))} - ${numTex(i.d)}X = ${numTex(Number(net.toPrecision(12)))}`] });
    steps.push({ caption: "Solve for X", lines: [`X = \\dfrac{${numTex(Number(others.toPrecision(12)))} - ${numTex(Number(net.toPrecision(12)))}}{${numTex(i.d)}}`, `X = ${u(value, "N")}\\ (3\\text{ s.f.})`] });
  } else {
    steps.push({ caption: "Work done by the driving force = change in KE + work against resistance + work against gravity", lines: [`W_D = \\tfrac{1}{2}(${M})(${numTex(Vg)})^{2} - \\tfrac{1}{2}(${M})(${U})^{2}${i.R0 > 0 ? ` + ${numTex(i.R0 * i.d)}` : ""}${slope ? ` ${rises ? "+" : "-"} ${numTex(Math.abs(b.Wg))}` : ""}`, `W_D = ${u(value, "J")}\\ (3\\text{ s.f.})`] });
  }

  const raw = slope
    ? buildIncline({ angle: 14, body: c ? "block" : "particle", forces: [...(i.D > 0 ? [{ kind: "driving" as const, label: L(ut(i.D, "N")) }] : []), ...(i.R0 > 0 || i.ask === "force" ? [{ kind: "resistance" as const, label: i.ask === "force" ? L("X", "X") : L(ut(i.R0, "N")) }] : [])], distance: { label: i.ask === "distance" ? L("d", "d") : L(ut(i.d, "m")), from: rises ? "A" : "B", to: rises ? "B" : "A" }, height: L(ut(R, "m")) })
    : buildHorizontal({ body: c ? "block" : "particle", weightAndNormal: false, forces: [...(i.D > 0 ? [{ kind: "driving" as const, label: L(ut(i.D, "N")) }] : []), ...(i.R0 > 0 || i.ask === "force" ? [{ kind: "resistance" as const, label: i.ask === "force" ? L("X", "X") : L(ut(i.R0, "N")) }] : [])], distance: { label: i.ask === "distance" ? L("d", "d") : L(ut(i.d, "m")), from: "A", to: "B" } });
  return { sub: "workenergy", level: i.level, prompt: parts.join(" "), course: i.course, a2: false, scene: staged(raw, i.display, ["setting", "forces", "measure"]), display: i.display, known, steps, answer: { value, unit, tex: u(value, unit), text: ut(value, unit) }, inputs: { ...i } };
}

export function generateWorkEnergy(level: number, o: { setting: string; ask: string; forces: string; method: string; units: string; context: string; g: GValue; display: Common["display"]; course: "AS" | "A2" }): MechProblemData {
  if (o.setting === "rough" && o.course === "A2") return generateRough(level, o);
  if (o.setting === "pulley") return generatePulleyEnergy(level, o);
  const asks = o.ask.split(",").filter((a) => a !== "mu");
  const slope = o.setting === "slope" || o.setting === "rough";
  let ask = (asks[Math.floor(Math.random() * asks.length)] ?? "speed") as WorkEnergyInput["ask"];
  if (slope && ask === "distance") ask = "speed";
  const conv = o.units === "conv";
  const ctx = o.context === "story" ? pickContext("energy", conv ? true : undefined) : undefined;
  for (let tries = 0; tries < 400; tries++) {
    const m = ctx ? inRange(ctx.mass) : inRange([2, 60, 2]);
    const km = conv && !!ctx;
    const vUnit: SpeedUnit = km ? "km h⁻¹" : "m s⁻¹";
    const uu = km ? 18 * inRange([1, 5, 1]) / 3.6 : (ctx?.speed ? inRange(ctx.speed) : inRange([2, 20, 1]));
    const d = ctx ? inRange(ctx.dist) : inRange([10, 200, 10]);
    const forcesOpt = o.forces;
    const D = forcesOpt === "resist" ? 0 : (ctx ? inRange(ctx.force) : inRange([20, 400, 20]));
    const R0 = forcesOpt === "drive" ? 0 : (ctx ? inRange(ctx.force) : inRange([10, 200, 10]));
    const rise = slope ? (Math.random() < 0.5 ? -1 : 1) * inRange([2, 30, 1]) : 0;
    const base = { level, course: o.course, display: o.display, setting: (slope ? "slope" : "horizontal") as WorkEnergyInput["setting"], method: (o.method === "pe" ? "pe" : "work") as WorkEnergyInput["method"], g: o.g, m, mUnit: "kg" as MassUnit, vUnit, u: uu, D, R0, X: 0, d, rise, ctx: ctx?.id ?? "particle" };
    if (ask === "speed" || ask === "work") {
      const KE1 = balance({ ...base, ask, v: 0 }).KE1;
      if (KE1 <= 0) continue;
      const v = speedFromKE(m, KE1);
      if (v < 1.5 || v > 45) continue;
      return buildWorkEnergy({ ...base, ask, v });
    }
    // asking for a distance or a force: the end speed is a given, so pick a clean one and require a sensible answer
    const v = km ? 18 * inRange([1, 6, 1]) / 3.6 : Math.max(1, uu + inRange([-6, 6, 1]));
    if (v === uu && ask === "force") continue;
    if (ask === "distance") {
      if (D - R0 <= 0 && v >= uu) continue;
      const dd = (kineticEnergy(m, v) - kineticEnergy(m, uu)) / (D - R0);
      if (!(dd > 5) || dd > 2000 || D === R0) continue;
      return buildWorkEnergy({ ...base, ask, v, d: Math.round(dd) });
    }
    const X = (D - R0) - ((kineticEnergy(m, v) - kineticEnergy(m, uu)) + gravityWork(m, rise, o.g)) / d;
    if (!(X > 5)) continue;
    return buildWorkEnergy({ ...base, ask, v });
  }
  return buildWorkEnergy({ level, course: o.course, display: o.display, setting: "horizontal", method: "work", g: o.g, m: 8000, mUnit: "kg", vUnit: "m s⁻¹", u: 15, v: 10, D: 0, R0: 1500, X: 0, d: 200, rise: 0, ask: "force", ctx: "truck" });
}
