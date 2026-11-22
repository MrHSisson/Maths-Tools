// Force and Speed (forcespeed): power = driving force × speed. The driving force at an instant, the speed or resistance at constant speed, the acceleration from F = ma,
// the power for a higher constant speed, and a resistance proportional to the speed (kv) or to its square (kv²): k, the maximum speed, the maximum power, the acceleration.
// Brief: specs/further-mechanics-mc.md §5.13. Equations first (R5): the physical inputs are picked (all exact), the given power is their product, and every answer is
// recomputed from the shown givens.
import { buildHorizontal, numTex, sfTex, sig, type MechProblemData } from "../../../shared/mechanics";
import { CONTEXTS, inRange, pickContext } from "../../../shared/mechanics/contexts";
import { cap, L, staged, u, ut, type Common } from "../workDone/common";
import { massIn, speedIn, speedText, type MassUnit, type SpeedUnit } from "../energy/common";
import { powerIn, vehicleSizes, vehicleSpeed, POWER_RANGE, type PowerUnit } from "./common";
import { generateTrain, generateVector } from "./train";

type Ask = "power" | "force" | "speed" | "resist" | "acc" | "newpower" | "k" | "maxspeed" | "maxpower";

interface ForceSpeedInput extends Common {
  ask: Ask;
  /** constant speed (the resultant force is zero) or accelerating at the instant: for a constant resistance */
  motion: "constant" | "accel";
  /** a constant resistance, or one proportional to v (n = 1) or v² (n = 2) */
  resist: "const" | "kv";
  n: 1 | 2;
  m: number;
  mUnit: MassUnit;
  vUnit: SpeedUnit;
  pUnit: PowerUnit;
  /** the picked physical quantities (all exact): the speed (or, for kv, the maximum speed), the second speed (newpower, and the instant in the kv acceleration question), the
   *  resistance (N), the acceleration, the coefficient k */
  v: number;
  v2: number;
  R: number;
  a: number;
  k: number;
  ctx: string;
}

const kUnit = (n: 1 | 2): string => (n === 1 ? "N s m⁻¹" : "N s² m⁻²");

/** the exact numbers of a question from its picked inputs: the power as it is shown, and the tractive force */
function physics(i: ForceSpeedInput): { P: number; Pmax: number; T: number; kk: number } {
  if (i.resist === "kv") {
    const Pmax = i.k * i.v ** (i.n + 1);
    return { P: Pmax, Pmax, T: Pmax / i.v, kk: i.k };
  }
  const T = i.motion === "accel" || i.ask === "acc" ? i.R + i.m * i.a : i.R;
  return { P: T * i.v, Pmax: T * i.v, T, kk: 0 };
}

export function buildForceSpeed(i: ForceSpeedInput): MechProblemData {
  const c = CONTEXTS.find((x) => x.id === i.ctx);
  const r3 = "\\ (3\\text{ s.f.})";
  const { P, T } = physics(i);
  const kv = i.resist === "kv";
  const V = c ? cap(c.a) : "A vehicle";
  const accelNow = i.ask === "acc" || (!kv && i.motion === "accel" && (i.ask === "power" || i.ask === "speed" || i.ask === "resist"));
  const M = numTex(i.m);
  const Ptxt = ut(powerIn(P, i.pUnit), i.pUnit);
  const spd = (v: number): string => speedText(v, i.vUnit);
  const mTxt = ut(massIn(i.m, i.mUnit), i.mUnit);
  const resTxt = kv ? (i.n === 1 ? "$kv$ N" : "$kv^{2}$ N") : ut(i.R, "N");
  const kvWord = `Its resistance to motion is ${resTxt}, where $v$ m s⁻¹ is its speed, and its maximum speed is ${spd(i.v)}.`;
  const km = i.vUnit === "km h⁻¹";
  const kw = i.pUnit === "kW";

  // ── the answer and the question
  let value = 0, unit = "", prompt = "";
  const known: string[] = [];
  const steps: MechProblemData["steps"] = [];
  const conv: string[] = [];
  const speedsShown: number[] = [];
  const answerTail = (what: string, vv: number, un: string) => `${what} = ${u(vv, un)}${r3}`;
  const sub = (cap0: string, lines: string[]) => steps.push({ caption: cap0, lines });

  const givenP = i.ask !== "power" && i.ask !== "maxpower";
  if (givenP && kw) conv.push(`${u(powerIn(P, "kW"), "kW")} = ${u(P, "W")}`);
  const withM = i.ask === "acc" || (accelNow && i.ask !== "force");
  if (withM && i.mUnit !== "kg") conv.push(`${u(massIn(i.m, i.mUnit), i.mUnit)} = ${u(i.m, "kg")}`);

  switch (i.ask) {
    case "power": {
      value = sig(powerIn(P, i.pUnit), 3); unit = i.pUnit;
      if (accelNow) {
        prompt = `${V} of mass ${mTxt} is moving along a straight horizontal road at ${spd(i.v)} and is accelerating at ${ut(i.a, "m s⁻²")}. The resistance to its motion is a constant ${ut(i.R, "N")}. Find the power its engine is developing${kw ? ", in kW" : ""}.`;
        known.push(`m = ${u(massIn(i.m, i.mUnit), i.mUnit)}`, `v = ${u(speedIn(i.v, i.vUnit), i.vUnit)}`, `a = ${u(i.a, "m s⁻²")}`, `R = ${u(i.R, "N")}`); speedsShown.push(i.v);
        sub("Resultant force: driving force minus resistance, from F = ma", [`T - ${numTex(i.R)} = ${M}\\times${numTex(i.a)}`, `T = ${u(Number(T.toPrecision(12)), "N")}`]);
      } else {
        prompt = `${V} travels at a constant speed of ${spd(i.v)} along a straight horizontal road against a constant resistance to motion of ${ut(i.R, "N")}. Find the power at which its engine is working${kw ? ", in kW" : ""}.`;
        known.push(`v = ${u(speedIn(i.v, i.vUnit), i.vUnit)}`, `R = ${u(i.R, "N")}`); speedsShown.push(i.v);
        sub("Constant speed, so the resultant force is zero: the driving force equals the resistance", [`T = ${u(i.R, "N")}`]);
      }
      sub("Power = driving force × speed", [`P = Tv = ${numTex(T)}\\times${numTex(i.v)}`, `P = ${sfTex(P, 6)}\\ \\text{W}`]);
      sub(kw ? "Write it in kilowatts (divide by 1000) and round" : "Round to 3 s.f.", [answerTail("P", value, unit)]);
      break;
    }
    case "force": {
      value = sig(P / i.v, 3); unit = "N";
      prompt = `${V} is driven along a straight horizontal road by an engine working at a constant rate of ${Ptxt}. Find the driving force when its speed is ${spd(i.v)}.`;
      known.push(`P = ${u(powerIn(P, i.pUnit), i.pUnit)}`, `v = ${u(speedIn(i.v, i.vUnit), i.vUnit)}`); speedsShown.push(i.v);
      sub("Power = driving force × speed, so the driving force is power divided by speed", [`T = \\dfrac{P}{v} = \\dfrac{${numTex(P)}}{${numTex(i.v)}}`, answerTail("T", value, "N")]);
      break;
    }
    case "speed": {
      const v = i.v;
      value = sig(speedIn(v, i.vUnit), 3); unit = i.vUnit;
      if (accelNow) {
        prompt = `${V} of mass ${mTxt} has its engine working at a constant rate of ${Ptxt}. The resistance to its motion is a constant ${ut(i.R, "N")}. Find its speed when its acceleration is ${ut(i.a, "m s⁻²")}${km ? ", in km h⁻¹" : ""}.`;
        known.push(`m = ${u(massIn(i.m, i.mUnit), i.mUnit)}`, `P = ${u(powerIn(P, i.pUnit), i.pUnit)}`, `R = ${u(i.R, "N")}`, `a = ${u(i.a, "m s⁻²")}`);
        sub("Resultant force: driving force minus resistance, from F = ma", [`T - ${numTex(i.R)} = ${M}\\times${numTex(i.a)}`, `T = ${u(Number(T.toPrecision(12)), "N")}`]);
      } else {
        prompt = `${V} moves along a straight horizontal road at a constant speed, against a constant resistance to motion of ${ut(i.R, "N")}, with its engine working at a constant rate of ${Ptxt}. Find its speed${km ? ", in km h⁻¹" : ""}.`;
        known.push(`P = ${u(powerIn(P, i.pUnit), i.pUnit)}`, `R = ${u(i.R, "N")}`);
        sub("Constant speed, so the resultant force is zero: the driving force equals the resistance", [`T = ${u(i.R, "N")}`]);
      }
      sub("Power = driving force × speed, so the speed is power divided by the driving force", [`v = \\dfrac{P}{T} = \\dfrac{${numTex(P)}}{${numTex(T)}} = ${sfTex(v, 6)}\\ \\text{m s}^{-1}`]);
      if (km) sub("Convert to km h⁻¹: multiply by 3.6", [`${sfTex(v, 6)}\\times 3.6 = ${u(value, unit)}${r3}`]); else sub("Round to 3 s.f.", [answerTail("v", value, unit)]);
      break;
    }
    case "resist": {
      const R = i.R;
      value = sig(R, 3); unit = "N";
      if (accelNow) {
        prompt = `${V} of mass ${mTxt} has its engine working at a constant rate of ${Ptxt}. When its speed is ${spd(i.v)} it is accelerating at ${ut(i.a, "m s⁻²")}. Find the resistance to its motion, assumed constant.`;
        known.push(`m = ${u(massIn(i.m, i.mUnit), i.mUnit)}`, `P = ${u(powerIn(P, i.pUnit), i.pUnit)}`, `v = ${u(speedIn(i.v, i.vUnit), i.vUnit)}`, `a = ${u(i.a, "m s⁻²")}`); speedsShown.push(i.v);
        sub("Power = driving force × speed, so the driving force is power divided by speed", [`T = \\dfrac{P}{v} = \\dfrac{${numTex(P)}}{${numTex(i.v)}} = ${u(Number(T.toPrecision(12)), "N")}`]);
        sub("Resultant force = driving force minus resistance, and it equals ma", [`${numTex(T)} - R = ${M}\\times${numTex(i.a)}`, answerTail("R", value, "N")]);
      } else {
        prompt = `${V} travels at a constant speed of ${spd(i.v)} along a straight horizontal road with its engine working at a constant rate of ${Ptxt}. Find the resistance to its motion.`;
        known.push(`P = ${u(powerIn(P, i.pUnit), i.pUnit)}`, `v = ${u(speedIn(i.v, i.vUnit), i.vUnit)}`); speedsShown.push(i.v);
        sub("Power = driving force × speed, so the driving force is power divided by speed", [`T = \\dfrac{P}{v} = \\dfrac{${numTex(P)}}{${numTex(i.v)}} = ${u(Number(T.toPrecision(12)), "N")}`]);
        sub("Constant speed, so the resultant force is zero: the resistance equals the driving force", [answerTail("R", value, "N")]);
      }
      break;
    }
    case "acc": {
      if (kv) {
        const kkv = i.k;
        const a2 = (P / i.v2 - kkv * i.v2 ** i.n) / i.m;
        value = sig(a2, 3); unit = "m s⁻²";
        prompt = `${V} of mass ${mTxt} has its engine working at a constant rate of ${Ptxt}. ${kvWord} Find its acceleration when its speed is ${spd(i.v2)}.`;
        known.push(`m = ${u(massIn(i.m, i.mUnit), i.mUnit)}`, `P = ${u(powerIn(P, i.pUnit), i.pUnit)}`, `v_{\\max} = ${u(speedIn(i.v, i.vUnit), i.vUnit)}`); speedsShown.push(i.v, i.v2);
        sub("At the maximum speed the acceleration is zero, so the driving force equals the resistance", [`\\dfrac{P}{v_{\\max}} = k v_{\\max}${i.n === 2 ? "^{2}" : ""}`, `k = \\dfrac{${numTex(P)}}{${numTex(i.v)}${i.n === 2 ? "^{3}" : "^{2}"}} = ${numTex(kkv)}`]);
        sub("At the given speed: driving force = P ÷ v, and the resistance is kv", [`T = \\dfrac{${numTex(P)}}{${numTex(i.v2)}} = ${sfTex(P / i.v2, 6)}\\ \\text{N},\\quad R = ${numTex(kkv)}\\times${numTex(i.v2)}${i.n === 2 ? "^{2}" : ""} = ${sfTex(kkv * i.v2 ** i.n, 6)}\\ \\text{N}`]);
        sub("F = ma: driving force minus resistance gives the acceleration", [`${sfTex(P / i.v2, 6)} - ${sfTex(kkv * i.v2 ** i.n, 6)} = ${M}a`, answerTail("a", value, "m s⁻²")]);
      } else {
        value = sig((P / i.v - i.R) / i.m, 3); unit = "m s⁻²";
        prompt = `${V} of mass ${mTxt} has its engine working at a constant rate of ${Ptxt}. The resistance to its motion is a constant ${ut(i.R, "N")}. Find its acceleration when its speed is ${spd(i.v)}.`;
        known.push(`m = ${u(massIn(i.m, i.mUnit), i.mUnit)}`, `P = ${u(powerIn(P, i.pUnit), i.pUnit)}`, `R = ${u(i.R, "N")}`, `v = ${u(speedIn(i.v, i.vUnit), i.vUnit)}`); speedsShown.push(i.v);
        sub("Power = driving force × speed, so the driving force is power divided by speed", [`T = \\dfrac{P}{v} = \\dfrac{${numTex(P)}}{${numTex(i.v)}} = ${u(Number(T.toPrecision(12)), "N")}`]);
        sub("F = ma: driving force minus resistance gives the acceleration", [`${numTex(T)} - ${numTex(i.R)} = ${M}a`, `a = \\dfrac{${numTex(Number((T - i.R).toPrecision(12)))}}{${M}}`, answerTail("a", value, "m s⁻²")]);
      }
      break;
    }
    case "newpower": {
      value = sig(powerIn(i.R * i.v2, i.pUnit), 3); unit = i.pUnit;
      prompt = `${V} travels at a constant speed of ${spd(i.v)} along a straight horizontal road with its engine working at a constant rate of ${Ptxt}. The resistance to motion is constant. Find the power its engine must develop to travel at a constant ${spd(i.v2)}${kw ? ", in kW" : ""}.`;
      known.push(`P_1 = ${u(powerIn(P, i.pUnit), i.pUnit)}`, `v_1 = ${u(speedIn(i.v, i.vUnit), i.vUnit)}`, `v_2 = ${u(speedIn(i.v2, i.vUnit), i.vUnit)}`); speedsShown.push(i.v, i.v2);
      sub("At the first speed the driving force equals the resistance, and power = force × speed", [`R = T = \\dfrac{P_1}{v_1} = \\dfrac{${numTex(P)}}{${numTex(i.v)}} = ${u(Number(i.R.toPrecision(12)), "N")}`]);
      sub("The resistance is constant, so the new driving force is the same: new power = R × new speed", [`P_2 = ${numTex(i.R)}\\times${numTex(i.v2)} = ${sfTex(i.R * i.v2, 6)}\\ \\text{W}`]);
      sub(kw ? "Write it in kilowatts (divide by 1000) and round" : "Round to 3 s.f.", [answerTail("P_2", value, unit)]);
      break;
    }
    case "k": {
      value = sig(i.k, 3); unit = kUnit(i.n);
      prompt = `${V} has its engine working at a constant rate of ${Ptxt}. The resistance to its motion is ${resTxt}, where $v$ m s⁻¹ is its speed, and its maximum speed is ${spd(i.v)}. Find the value of $k$.`;
      known.push(`P = ${u(powerIn(P, i.pUnit), i.pUnit)}`, `v_{\\max} = ${u(speedIn(i.v, i.vUnit), i.vUnit)}`); speedsShown.push(i.v);
      sub("At the maximum speed the acceleration is zero, so the driving force equals the resistance", [`T = R`, `\\dfrac{P}{v_{\\max}} = k v_{\\max}${i.n === 2 ? "^{2}" : ""}`]);
      sub(`Multiply through by v: P = k v^{${i.n + 1}}, then solve for k`, [`k = \\dfrac{P}{v_{\\max}^{${i.n + 1}}} = \\dfrac{${numTex(P)}}{${numTex(i.v)}^{${i.n + 1}}}`, answerTail("k", value, unit)]);
      break;
    }
    case "maxspeed": {
      value = sig(speedIn(i.v, i.vUnit), 3); unit = i.vUnit;
      prompt = `${V} has its engine working at a constant rate of ${Ptxt}. The resistance to its motion is ${resTxt}, where $v$ m s⁻¹ is its speed, and $k = ${numTex(i.k)}$. Find its maximum speed${km ? ", in km h⁻¹" : ""}.`;
      known.push(`P = ${u(powerIn(P, i.pUnit), i.pUnit)}`, `k = ${u(i.k, kUnit(i.n))}`);
      sub("At the maximum speed the acceleration is zero, so the driving force equals the resistance", [`\\dfrac{P}{v} = k v${i.n === 2 ? "^{2}" : ""}`]);
      sub(`Multiply through by v and solve: v^{${i.n + 1}} = P ÷ k`, [`v^{${i.n + 1}} = \\dfrac{${numTex(P)}}{${numTex(i.k)}} = ${sfTex(P / i.k, 6)}`, `v = ${sfTex(i.v, 6)}\\ \\text{m s}^{-1}`]);
      if (km) sub("Convert to km h⁻¹: multiply by 3.6", [`${sfTex(i.v, 6)}\\times 3.6 = ${u(value, unit)}${r3}`]); else sub("Round to 3 s.f.", [answerTail("v", value, unit)]);
      break;
    }
    default: {
      value = sig(powerIn(P, i.pUnit), 3); unit = i.pUnit;
      prompt = `${V} has an engine whose maximum power is developed at its maximum speed of ${spd(i.v)}. The resistance to its motion is ${resTxt}, where $v$ m s⁻¹ is its speed, and $k = ${numTex(i.k)}$. Find the maximum power${kw ? ", in kW" : ""}.`;
      known.push(`v_{\\max} = ${u(speedIn(i.v, i.vUnit), i.vUnit)}`, `k = ${u(i.k, kUnit(i.n))}`); speedsShown.push(i.v);
      sub("At the maximum speed the driving force equals the resistance", [`T = R = ${numTex(i.k)}\\times${numTex(i.v)}${i.n === 2 ? "^{2}" : ""} = ${sfTex(i.k * i.v ** i.n, 6)}\\ \\text{N}`]);
      sub("Power = driving force × speed", [`P = Tv = ${sfTex(i.k * i.v ** i.n, 6)}\\times${numTex(i.v)} = ${sfTex(P, 6)}\\ \\text{W}`]);
      sub(kw ? "Write it in kilowatts (divide by 1000) and round" : "Round to 3 s.f.", [answerTail("P", value, unit)]);
    }
  }
  if (km) for (const s of [...new Set(speedsShown)]) conv.push(`${u(speedIn(s, "km h⁻¹"), "km h⁻¹")} = ${u(Number(s.toPrecision(12)), "m s⁻¹")}`);
  if (conv.length) steps.unshift({ caption: "Convert to SI units first", lines: conv });
  prompt += " Give your answer to 3 significant figures.";

  // ── the picture: the vehicle on a level road with its driving force, its resistance and its velocity
  const rLabel = kv ? L(i.n === 1 ? "kv" : "kv²") : i.ask === "resist" ? L(ut(i.R, "N"), "R") : ["power", "speed", "acc"].includes(i.ask) ? L(ut(i.R, "N")) : L("R");
  const speedAsked = i.ask === "speed" || i.ask === "maxspeed";
  const raw = buildHorizontal({
    body: c ? "block" : "particle", weightAndNormal: false, bodyLabel: withM ? L(ut(massIn(i.m, i.mUnit), i.mUnit)) : undefined,
    forces: [{ kind: "driving", label: i.ask === "force" ? L(ut(P / i.v, "N"), "T") : L("T") }, { kind: "resistance", label: rLabel }],
    velocity: speedAsked ? L(spd(i.v), "v") : L(spd(i.ask === "acc" && kv ? i.v2 : i.v)),
  });
  return { sub: "forcespeed", level: i.level, prompt, course: i.course, a2: false, scene: staged(raw, i.display, ["setting", "motion", "forces", "measure"]), display: i.display, known, steps, answer: { value, unit, tex: u(value, unit), text: ut(value, unit) }, inputs: { ...i } };
}

export function generateForceSpeed(level: number, o: { ask: string; motion: string; resist: string; vehicle: string; units: string; context: string; display: Common["display"]; course: "AS" | "A2" }): MechProblemData {
  const conv = o.units === "conv";
  const kv = o.resist !== "const";
  const n = (o.resist === "speed2" ? 2 : 1) as 1 | 2;
  if (o.vehicle === "train") return generateTrain(level, o);
  const valid: string[] = [...(kv ? ["k", "maxspeed", "maxpower", "acc"] : ["power", "force", "speed", "resist", "acc", "newpower"]), ...(o.course === "A2" ? ["vector"] : [])];
  const asks = o.ask.split(",").filter((a) => valid.includes(a));
  const picked = asks.length ? asks[Math.floor(Math.random() * asks.length)] : valid[0];
  if (picked === "vector") return generateVector(level, o);
  const ask = picked as Ask;
  const motion = (ask === "acc" || (o.motion === "accel" && ask !== "newpower" && ask !== "force") ? "accel" : "constant") as "constant" | "accel";
  const c = o.context === "story" ? pickContext("power", conv ? true : undefined) : undefined;
  const sizes = vehicleSizes(c);
  for (let tries = 0; tries < 600; tries++) {
    const km = conv && !!c;
    const vUnit: SpeedUnit = km ? "km h⁻¹" : "m s⁻¹";
    const m = inRange(sizes.mass);
    const mUnit: MassUnit = conv && m >= 1000 && m % 1000 === 0 ? "tonne" : "kg";
    const v = vehicleSpeed(c, km, sizes);
    const R = inRange(sizes.resist);
    const a = inRange([0.2, c?.id === "cyclist" ? 1 : 2, 0.1]);
    const k = kv ? (n === 1 ? inRange([1, 80, 1]) : inRange([0.5, 3, 0.5])) : 0;
    let v2 = 0;
    const base = { level, course: o.course, display: o.display, ask, motion, resist: (kv ? "kv" : "const") as "const" | "kv", n, m, mUnit, vUnit, v, v2, R, a, k, ctx: c?.id ?? "particle" };
    const probe = buildPhysics(base);
    const pr = POWER_RANGE[c?.id ?? "particle"];
    if (probe.P < pr[0] * 0.5 || probe.P > pr[1] * 1.3) continue;
    if (c?.id === "cyclist" && probe.P > 1500) continue;
    const pUnit: PowerUnit = conv && probe.P >= 2000 ? "kW" : "W";
    if (ask === "newpower") {
      v2 = vehicleSpeed(c, km, sizes);
      if (v2 === v) continue;
    }
    if (ask === "acc" && kv) {
      v2 = vehicleSpeed(c, km, sizes);
      if (!(v2 < v && v2 >= 0.3 * v)) continue;
      const acc = (probe.P / v2 - k * v2 ** n) / m;
      if (!(acc >= 0.05 && acc <= 3)) continue;
    }
    if (kv && !(probe.P / v <= 1e7)) continue;
    return buildForceSpeed({ ...base, v2, pUnit });
  }
  return buildForceSpeed({ level, course: o.course, display: o.display, ask: "resist", motion: "constant", resist: "const", n: 1, m: 1000, mUnit: "kg", vUnit: "m s⁻¹", pUnit: "kW", v: 20, v2: 0, R: 1800, a: 0, k: 0, ctx: "car" });
}

const buildPhysics = (b: Omit<ForceSpeedInput, "pUnit">): { P: number } => ({ P: physics({ ...b, pUnit: "W" }).P });
