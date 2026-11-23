// Average Power (avgpower): power = work done ÷ time. Lifting a load (the power, the time, or the work from a power and a time), the average power of brakes, a pump
// (the potential and kinetic energy gained per second) and a vehicle accelerated at constant power (the time). Brief: specs/further-mechanics-mc.md §5.12.
// Equations first (R5): the physical inputs are picked, the answer derived; where a power is given it is rounded to 3 s.f. and the answer recomputed from the SHOWN value.
import { buildHorizontal, buildVertical, gravityWork, kineticEnergy, numTex, sfTex, sig, type GValue, type MechProblemData } from "../../../shared/mechanics";
import { CONTEXTS, inRange, pickContext } from "../../../shared/mechanics/contexts";
import { cap, L, staged, u, ut, type Common } from "../workDone/common";
import { massIn, speedIn, speedText, type MassUnit, type SpeedUnit } from "../energy/common";
import { kilo, powerIn, vehicleSizes, vehicleSpeed, POWER_RANGE, type PowerUnit } from "./common";

type Kind = "lift" | "liftTime" | "work" | "brake" | "pump" | "accel";

interface AvgPowerInput extends Common {
  kind: Kind;
  g: GValue;
  /** a load or a vehicle (kg, shown in mUnit) and, for a lift or a pump, the height (m) */
  m: number;
  mUnit: MassUnit;
  h: number;
  /** a time (s), shown in minutes when tUnit says so: given for the power and work questions, the answer's source for a time question */
  t: number;
  tUnit: "s" | "min";
  /** speeds (m s⁻¹): braking from u to v; accelerating from u to v; a pump ejects water at v */
  u: number;
  v: number;
  vUnit: SpeedUnit;
  /** a pump's flow in litres per minute */
  Q: number;
  /** a power given in the question (W), shown in pUnit */
  P: number;
  pUnit: PowerUnit;
  /** the unit an answer that is a power or an energy is written in */
  format: PowerUnit;
  ctx: string;
}

const minWord = (n: number): string => (n === 1 ? "minute" : "minutes");
const timeText = (t: number, tUnit: "s" | "min"): string => (tUnit === "min" ? `${ut(t / 60, minWord(t / 60))}` : ut(t, "s"));
const powerText = (P: number, unit: PowerUnit): string => ut(powerIn(P, unit), unit);

export function buildAvgPower(i: AvgPowerInput): MechProblemData {
  const c = CONTEXTS.find((x) => x.id === i.ctx);
  const g = i.g;
  const r3 = "\\ (3\\text{ s.f.})";
  const kw = i.format === "kW";
  const M = numTex(i.m), G = numTex(g), H = numTex(i.h);
  const steps: MechProblemData["steps"] = [];
  const known: string[] = [];
  const conv: string[] = [];
  if (i.mUnit !== "kg" && (i.kind === "lift" || i.kind === "liftTime" || i.kind === "brake" || i.kind === "accel")) conv.push(`${u(massIn(i.m, i.mUnit), i.mUnit)} = ${u(i.m, "kg")}`);
  if (i.tUnit === "min" && (i.kind === "lift" || i.kind === "work" || i.kind === "brake")) conv.push(`${u(i.t / 60, "min")} = ${u(i.t, "s")}`);
  if (i.vUnit === "km h⁻¹" && (i.kind === "brake" || i.kind === "accel")) for (const x of i.kind === "brake" && i.v > 0 ? [i.u, i.v] : i.kind === "accel" && i.u > 0 ? [i.u, i.v] : [i.kind === "brake" ? i.u : i.v]) conv.push(`${u(speedIn(x, "km h⁻¹"), "km h⁻¹")} = ${u(Number(x.toPrecision(12)), "m s⁻¹")}`);
  if (i.pUnit === "kW" && (i.kind === "liftTime" || i.kind === "work" || i.kind === "accel")) conv.push(`${u(powerIn(i.P, "kW"), "kW")} = ${u(i.P, "W")}`);
  const convStep = () => { if (conv.length) steps.push({ caption: "Convert to SI units first", lines: conv }); };
  let prompt = "", value = 0, unit = "", extra: MechProblemData["extra"], answerTex = "", answerText = "";
  let raw;

  if (i.kind === "lift" || i.kind === "liftTime") {
    const W = gravityWork(i.m, i.h, g);
    const what = c?.id === "climber" ? `A climber of mass ${ut(massIn(i.m, i.mUnit), i.mUnit)} climbs a vertical height of ${ut(i.h, "m")}` : c?.id === "crane" ? `A crane lifts a block of mass ${ut(massIn(i.m, i.mUnit), i.mUnit)} through a vertical height of ${ut(i.h, "m")}` : `A motor raises a load of mass ${ut(massIn(i.m, i.mUnit), i.mUnit)} through a vertical height of ${ut(i.h, "m")}`;
    if (i.kind === "lift") {
      value = sig(powerIn(W / i.t, i.format), 3); unit = i.format;
      prompt = `${what} in ${timeText(i.t, i.tUnit)}. Take $g = ${g}$. Find the average power ${c?.id === "climber" ? "of the climber" : "used"}.`;
      known.push(`m = ${u(massIn(i.m, i.mUnit), i.mUnit)}`, `h = ${u(i.h, "m")}`, `t = ${u(i.tUnit === "min" ? i.t / 60 : i.t, i.tUnit)}`);
      convStep();
      steps.push({ caption: "Work done in lifting the load is the gain in potential energy, mgh", lines: [`W = mgh = ${M}\\times${G}\\times${H}`, `W = ${u(Number(W.toPrecision(12)), "J")}`] });
      steps.push({ caption: "Power is work done divided by the time taken", lines: [`P = \\dfrac{W}{t} = \\dfrac{${numTex(W)}}{${numTex(i.t)}}`, `P = ${sfTex(W / i.t, 6)}\\ \\text{W}`] });
      steps.push({ caption: kw ? "Write it in kilowatts (divide by 1000) and round" : "Round to 3 s.f.", lines: [`P = ${u(value, unit)}${r3}`] });
      answerTex = u(value, unit); answerText = ut(value, unit);
    } else {
      value = sig(W / i.P, 3); unit = "s";
      prompt = `${what}. The motor works at a constant rate of ${powerText(i.P, i.pUnit)}. Take $g = ${g}$. Find the time taken, assuming all of the motor's power does work against gravity.`;
      known.push(`m = ${u(massIn(i.m, i.mUnit), i.mUnit)}`, `h = ${u(i.h, "m")}`, `P = ${u(powerIn(i.P, i.pUnit), i.pUnit)}`);
      convStep();
      steps.push({ caption: "Work done in lifting the load is the gain in potential energy, mgh", lines: [`W = mgh = ${M}\\times${G}\\times${H}`, `W = ${u(Number(W.toPrecision(12)), "J")}`] });
      steps.push({ caption: "Power is work done divided by time, so time is work done divided by power", lines: [`t = \\dfrac{W}{P} = \\dfrac{${numTex(W)}}{${numTex(i.P)}}`, `t = ${u(value, "s")}${r3}`] });
      answerTex = u(value, "s"); answerText = ut(value, "s");
    }
    raw = buildVertical({ body: c ? "block" : "particle", start: { rel: 0 }, end: { rel: 1, height: L(ut(i.h, "m")) } });
  } else if (i.kind === "work") {
    const W = i.P * i.t, k = kw;
    const wUnit = k ? "kJ" : "J";
    value = sig(kilo(W, k), 3); unit = wUnit;
    prompt = `${c?.id === "climber" ? "A climber" : c?.id === "crane" ? "The motor of a crane" : "A motor"} works at a constant rate of ${powerText(i.P, i.pUnit)} for ${timeText(i.t, i.tUnit)}. Find the work done${k ? ", in kJ" : ""}.`;
    known.push(`P = ${u(powerIn(i.P, i.pUnit), i.pUnit)}`, `t = ${u(i.tUnit === "min" ? i.t / 60 : i.t, i.tUnit)}`);
    convStep();
    steps.push({ caption: "Work done is power multiplied by time", lines: [`W = Pt = ${numTex(i.P)}\\times${numTex(i.t)}`, `W = ${u(Number(W.toPrecision(12)), "J")}`] });
    steps.push({ caption: k ? "Write it in kilojoules (divide by 1000) and round" : "Round to 3 s.f.", lines: [`W = ${u(value, wUnit)}${r3}`] });
    answerTex = u(value, wUnit); answerText = ut(value, wUnit);
  } else if (i.kind === "brake") {
    const ke0 = kineticEnergy(i.m, i.u), ke1 = kineticEnergy(i.m, i.v), dKE = ke0 - ke1;
    value = sig(powerIn(dKE / i.t, i.format), 3); unit = i.format;
    const vehicle = c ? cap(c.a) : "A vehicle";
    prompt = `${vehicle} of mass ${ut(massIn(i.m, i.mUnit), i.mUnit)} slows from ${speedText(i.u, i.vUnit)} to ${i.v === 0 ? "rest" : speedText(i.v, i.vUnit)} in ${timeText(i.t, i.tUnit)} under the action of its brakes alone. Find the average power of the brakes${kw ? ", in kW" : ""}.`;
    known.push(`m = ${u(massIn(i.m, i.mUnit), i.mUnit)}`, `u = ${u(speedIn(i.u, i.vUnit), i.vUnit)}`, ...(i.v > 0 ? [`v = ${u(speedIn(i.v, i.vUnit), i.vUnit)}`] : []), `t = ${u(i.tUnit === "min" ? i.t / 60 : i.t, i.tUnit)}`);
    convStep();
    steps.push({ caption: "The work done by the brakes is the kinetic energy lost", lines: [`W = \\tfrac{1}{2}m(u^{2} - v^{2}) = \\tfrac{1}{2}(${M})(${numTex(i.u)}^{2}${i.v > 0 ? ` - ${numTex(i.v)}^{2}` : ""})`, `W = ${u(Number(dKE.toPrecision(12)), "J")}`] });
    steps.push({ caption: "Average power is work done divided by time", lines: [`P = \\dfrac{W}{t} = \\dfrac{${numTex(dKE)}}{${numTex(i.t)}}`, `P = ${sfTex(dKE / i.t, 6)}\\ \\text{W}`] });
    steps.push({ caption: kw ? "Write it in kilowatts (divide by 1000) and round" : "Round to 3 s.f.", lines: [`P = ${u(value, unit)}${r3}`] });
    answerTex = u(value, unit); answerText = ut(value, unit);
    raw = buildHorizontal({ body: c ? "block" : "particle", weightAndNormal: false, velocity: L(speedText(i.u, i.vUnit)), forces: [{ kind: "resistance", label: L("brakes") }] });
  } else if (i.kind === "pump") {
    const rate = i.Q / 60, pe = rate * g * i.h, ke = 0.5 * rate * i.v * i.v, P = pe + ke;
    value = Number(pe.toPrecision(12)); unit = "J s⁻¹";
    extra = [{ value: Number(ke.toPrecision(12)), unit: "J s⁻¹" }, { value: sig(powerIn(P, i.format), 3), unit: i.format }];
    const total = sig(powerIn(P, i.format), 3);
    prompt = `A pump raises water through a vertical height of ${ut(i.h, "m")} and delivers it through a pipe at a speed of ${ut(i.v, "m s⁻¹")}. It pumps ${ut(i.Q, "litres")} of water per minute. Take $g = ${g}$ and the mass of 1 litre of water as 1 kg. Find (a) the potential energy gained by the water each second, (b) the kinetic energy gained each second, (c) the power of the pump${kw ? ", in kW" : ""}.`;
    known.push(`Q = ${u(i.Q, "litres")}\\ \\text{per minute}`, `h = ${u(i.h, "m")}`, `v = ${u(i.v, "m s⁻¹")}`);
    steps.push({ caption: "Mass of water pumped each second: 1 litre has mass 1 kg, and there are 60 seconds in a minute", lines: [`\\text{mass per second} = \\dfrac{${numTex(i.Q)}}{60} = ${sfTex(rate, 6)}\\ \\text{kg s}^{-1}`] });
    steps.push({ caption: "(a) Potential energy gained per second is (mass per second) × g × h", lines: ["#(a)", `${sfTex(rate, 6)}\\times${G}\\times${H} = ${sfTex(pe, 6)}\\ \\text{J s}^{-1}`] });
    steps.push({ caption: "(b) Kinetic energy gained per second is ½ × (mass per second) × v²", lines: ["#(b)", `\\tfrac{1}{2}\\times${sfTex(rate, 6)}\\times${numTex(i.v)}^{2} = ${sfTex(ke, 6)}\\ \\text{J s}^{-1}`] });
    steps.push({ caption: "(c) The power is the energy gained per second: add the two", lines: ["#(c)", `P = ${sfTex(pe, 6)} + ${sfTex(ke, 6)} = ${sfTex(P, 6)}\\ \\text{W}`, `P = ${u(total, i.format)}${r3}`] });
    answerTex = `\\text{(a)}\\ ${u(sig(pe, 3), "W")},\\ \\text{(b)}\\ ${u(sig(ke, 3), "W")},\\ \\text{(c)}\\ ${u(total, i.format)}`;
    answerText = `(a) ${ut(sig(pe, 3), "J s⁻¹")}, (b) ${ut(sig(ke, 3), "J s⁻¹")}, (c) ${ut(total, i.format)}`;
  } else {
    const dKE = 0.5 * i.m * (i.v * i.v - i.u * i.u);
    value = sig(dKE / i.P, 3); unit = "s";
    const vehicle = c ? cap(c.a) : "A vehicle";
    prompt = `${vehicle} of mass ${ut(massIn(i.m, i.mUnit), i.mUnit)} is accelerated ${i.u === 0 ? "from rest" : `from ${speedText(i.u, i.vUnit)}`} to ${speedText(i.v, i.vUnit)} by an engine working at a constant rate of ${powerText(i.P, i.pUnit)}. Ignore any resistance to motion and find the time taken.`;
    known.push(`m = ${u(massIn(i.m, i.mUnit), i.mUnit)}`, ...(i.u > 0 ? [`u = ${u(speedIn(i.u, i.vUnit), i.vUnit)}`] : []), `v = ${u(speedIn(i.v, i.vUnit), i.vUnit)}`, `P = ${u(powerIn(i.P, i.pUnit), i.pUnit)}`);
    convStep();
    steps.push({ caption: "With no resistance the work done by the engine is the gain in kinetic energy", lines: [`W = \\tfrac{1}{2}m(v^{2} - u^{2}) = \\tfrac{1}{2}(${M})(${numTex(i.v)}^{2}${i.u > 0 ? ` - ${numTex(i.u)}^{2}` : ""})`, `W = ${u(Number(dKE.toPrecision(12)), "J")}`] });
    steps.push({ caption: "The engine does work Pt, so time is work divided by power", lines: [`t = \\dfrac{W}{P} = \\dfrac{${numTex(dKE)}}{${numTex(i.P)}}`, `t = ${u(value, "s")}${r3}`] });
    answerTex = u(value, "s"); answerText = ut(value, "s");
    raw = buildHorizontal({ body: c ? "block" : "particle", weightAndNormal: false, velocity: L("v", "v"), forces: [{ kind: "driving", label: L("F") }] });
  }
  const scene = raw ? staged(raw, i.display, ["setting", "motion", "forces", "measure"]) : undefined;
  return { sub: "avgpower", level: i.level, prompt: `${prompt} Give your answer to 3 significant figures.`, course: i.course, a2: false, scene, display: i.display, known, steps, answer: { value, unit, tex: answerTex, text: answerText }, extra, inputs: { ...i } };
}

export function generateAvgPower(level: number, o: { doing: string; ask: string; units: string; format: string; context: string; g: GValue; display: Common["display"]; course: "AS" | "A2" }): MechProblemData {
  const pick = (s: string, f: string): string => { const xs = s.split(",").filter(Boolean); return xs[Math.floor(Math.random() * xs.length)] ?? f; };
  const conv = o.units === "conv";
  const doing = pick(o.doing, "lift");
  const valid: Record<string, string[]> = { lift: ["power", "time", "work"], brake: ["power"], pump: ["power"], accel: ["time"] };
  const asks = o.ask.split(",").filter((a) => valid[doing].includes(a));
  const ask = asks.length ? asks[Math.floor(Math.random() * asks.length)] : valid[doing][0];
  const format = (o.format === "kw" ? "kW" : "W") as PowerUnit;
  const story = o.context === "story";
  for (let tries = 0; tries < 400; tries++) {
    const base = { level, course: o.course, display: o.display, g: o.g, format, pUnit: (conv ? "kW" : "W") as PowerUnit };
    if (doing === "lift") {
      const c = story ? (Math.random() < 0.5 ? CONTEXTS.find((x) => x.id === "crane")! : CONTEXTS.find((x) => x.id === "climber")!) : undefined;
      const m = c ? inRange(c.mass) : inRange([100, 2000, 100]);
      const mUnit: MassUnit = conv && m >= 1000 && m % 100 === 0 && !(c?.id === "climber") ? "tonne" : "kg";
      const h = c ? inRange(c.height) : inRange([5, 60, 1]);
      const tMin = conv && Math.random() < 0.6;
      const t = tMin ? 60 * inRange([1, 10, 1]) : c?.id === "climber" ? inRange([30, 600, 10]) : inRange([10, 120, 5]);
      const W = gravityWork(m, h, o.g);
      const P = W / t;
      if (P < 50 || P > 600000) continue;
      const common = { ...base, m, mUnit, h, t, tUnit: (tMin ? "min" : "s") as "s" | "min", u: 0, v: 0, vUnit: "m s⁻¹" as SpeedUnit, Q: 0, ctx: c?.id ?? "particle" };
      if (ask === "power") return buildAvgPower({ ...common, kind: "lift", P: 0 });
      if (ask === "time") {
        const shown = sig(powerIn(P, base.pUnit), 3);
        const Pw = shown * (base.pUnit === "kW" ? 1000 : 1);
        if (!(W / Pw >= 5)) continue;
        return buildAvgPower({ ...common, kind: "liftTime", P: Pw });
      }
      const pr = POWER_RANGE[c?.id ?? "particle"];
      const Pw = inRange(pr);
      const k = conv && Pw % 1000 === 0;
      return buildAvgPower({ ...common, ...(k ? { pUnit: "kW" as PowerUnit } : { pUnit: "W" as PowerUnit }), kind: "work", P: Pw, m: 0, h: 0 });
    }
    if (doing === "brake") {
      const c = story ? pickContext("power", true) : undefined;
      const km = conv && !!c;
      const sizes = vehicleSizes(c);
      const m = c ? inRange(c.mass) : inRange([500, 2000, 100]);
      const uu = vehicleSpeed(c, km, sizes);
      const stops = Math.random() < 0.6;
      const v = stops ? 0 : 5 * Math.max(1, Math.floor(uu / 10));
      if (v >= uu) continue;
      const t = inRange([4, 30, 1]);
      const P = (kineticEnergy(m, uu) - kineticEnergy(m, v)) / t;
      if (P < 500 || P > 2000000) continue;
      const mUnit: MassUnit = conv && m >= 1000 && m % 1000 === 0 ? "tonne" : "kg";
      return buildAvgPower({ ...base, kind: "brake", m, mUnit, h: 0, t, tUnit: "s", u: uu, v, vUnit: km ? "km h⁻¹" : "m s⁻¹", Q: 0, P: 0, ctx: c?.id ?? "particle" });
    }
    if (doing === "pump") {
      const Q = inRange([300, 3000, 100]);
      const h = inRange([3, 40, 1]), v = inRange([2, 12, 1]);
      return buildAvgPower({ ...base, kind: "pump", m: 0, mUnit: "kg", h, t: 0, tUnit: "s", u: 0, v, vUnit: "m s⁻¹", Q, P: 0, ctx: "particle" });
    }
    // accelerate at constant power, no resistance: the power is shown to 3 s.f. and the time recomputed from it
    const c = story ? pickContext("power", true) : undefined;
    const km = conv && !!c;
    const sizes = vehicleSizes(c);
    const m = c ? inRange(c.mass) : inRange([500, 2000, 100]);
    const v = vehicleSpeed(c, km, sizes);
    const uu = Math.random() < 0.5 ? 0 : 5 * Math.max(1, Math.floor(v / 10));
    if (uu >= v) continue;
    const t = inRange([5, 40, 1]);
    const dKE = 0.5 * m * (v * v - uu * uu);
    const unitP: PowerUnit = dKE / t >= 10000 ? "kW" : "W";
    const shown = sig(powerIn(dKE / t, unitP), 3);
    const Pw = shown * (unitP === "kW" ? 1000 : 1);
    const tt = dKE / Pw;
    if (!(tt >= 3 && tt <= 120)) continue;
    const mUnit: MassUnit = conv && m >= 1000 && m % 1000 === 0 ? "tonne" : "kg";
    return buildAvgPower({ ...base, pUnit: unitP, kind: "accel", m, mUnit, h: 0, t: 0, tUnit: "s", u: uu, v, vUnit: km ? "km h⁻¹" : "m s⁻¹", Q: 0, P: Pw, ctx: c?.id ?? "particle" });
  }
  return buildAvgPower({ level, course: o.course, display: o.display, g: o.g, format: "kW", pUnit: "W", kind: "lift", m: 3200, mUnit: "kg", h: 28, t: 40, tUnit: "s", u: 0, v: 0, vUnit: "m s⁻¹", Q: 0, P: 0, ctx: "crane" });
}
