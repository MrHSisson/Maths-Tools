// Power on a Slope (powerslope, A2): P = Tv with the weight resolved along the road. A steady speed up or down a slope, the power or the resistance, the angle from the power
// and an acceleration, the time to reach a speed from rest at constant power (the work-energy principle), and a resistance proportional to the speed (a quadratic in v).
// Brief: specs/further-mechanics-mc.md §5.14. The picture is the free-standing force diagram (D15) with the weight resolved: it draws a descending vehicle's forces the right
// way round, which the slope template cannot. Equations first (R5): a given power is rounded to 3 s.f. and every answer recomputed from the SHOWN givens.
import { buildForceDiagram, degrees, numTex, radians, sfTex, sig, type GValue, type MechProblemData } from "../../../shared/mechanics";
import { CONTEXTS, inRange, pickContext } from "../../../shared/mechanics/contexts";
import { cap, L, staged, u, ut, type Common } from "../workDone/common";
import { massIn, speedIn, speedText, type MassUnit, type SpeedUnit } from "../energy/common";
import { powerIn, vehicleSizes, vehicleSpeed, type PowerUnit } from "./common";

type Ask = "speed" | "power" | "resist" | "angle" | "time";

interface PowerSlopeInput extends Common {
  ask: Ask;
  dir: "up" | "down";
  /** the resistance is constant, or kv (the question then asks for the greatest steady speed) */
  resist: "const" | "kv";
  /** the slope as an angle in degrees, or as sin α = 1 / nSine */
  angleAs: "deg" | "sine";
  alpha: number;
  nSine: number;
  g: GValue;
  m: number;
  mUnit: MassUnit;
  vUnit: SpeedUnit;
  pUnit: PowerUnit;
  /** a speed (m s⁻¹): the speed in the power and resistance and angle questions, the speed reached in the time question */
  v: number;
  R: number;
  /** an acceleration (m s⁻²) for the angle question, a distance (m) for the time question, k for a resistance kv */
  a: number;
  d: number;
  k: number;
  /** the power as it is shown (W): the givens' one; unused (0) when the power is the answer */
  P: number;
  ctx: string;
}

const sinOf = (i: PowerSlopeInput): number => (i.angleAs === "sine" ? 1 / i.nSine : Math.sin(radians(i.alpha)));

export function buildPowerSlope(i: PowerSlopeInput): MechProblemData {
  const c = CONTEXTS.find((x) => x.id === i.ctx);
  const r3 = "\\ (3\\text{ s.f.})";
  const g = i.g, up = i.dir === "up", kv = i.resist === "kv";
  const s = sinOf(i), S = i.m * g * s, sgn = up ? 1 : -1;
  const V = c ? cap(c.a) : "A vehicle";
  const M = numTex(i.m), G = numTex(g);
  const km = i.vUnit === "km h⁻¹", kw = i.pUnit === "kW";
  const spd = (v: number): string => speedText(v, i.vUnit);
  const mTxt = ut(massIn(i.m, i.mUnit), i.mUnit);
  const slope = i.angleAs === "sine" ? `an angle $\\alpha$ to the horizontal, where $\\sin\\alpha = \\tfrac{1}{${i.nSine}}$` : `${i.alpha}° to the horizontal`;
  const road = `a straight road inclined at ${i.ask === "angle" ? "an angle $\\alpha$ to the horizontal" : slope}`;
  const Pshown = ut(powerIn(i.P, i.pUnit), i.pUnit);
  const sinTex = i.angleAs === "sine" ? `\\tfrac{1}{${i.nSine}}` : `\\sin ${i.alpha}^\\circ`;
  const Ttxt = (T: number) => u(Number(T.toPrecision(12)), "N");

  const known: string[] = [`m = ${u(massIn(i.m, i.mUnit), i.mUnit)}`, ...(i.ask === "angle" ? [] : [i.angleAs === "sine" ? `\\sin\\alpha = \\tfrac{1}{${i.nSine}}` : `\\alpha = ${i.alpha}^\\circ`])];
  const steps: MechProblemData["steps"] = [];
  const conv: string[] = [];
  if (i.mUnit !== "kg") conv.push(`${u(massIn(i.m, i.mUnit), i.mUnit)} = ${u(i.m, "kg")}`);
  const sub = (caption: string, lines: string[]) => steps.push({ caption, lines });
  const speedsShown: number[] = [];
  const givenP = i.ask !== "power";
  if (givenP && kw) conv.push(`${u(powerIn(i.P, "kW"), "kW")} = ${u(i.P, "W")}`);
  const resolve = () => sub(`Resolve along the road: the weight has a component down the slope of mg sin α`, [`mg\\sin\\alpha = ${M}\\times${G}\\times${sinTex} = ${sfTex(S, 6)}\\ \\text{N}`]);

  let value = 0, unit = "", prompt = "";
  const motion = `${up ? "up" : "down"}`;
  if (i.ask === "angle") {
    const T = i.P / i.v;
    const sa = (T - i.R - i.m * i.a) / (i.m * g);
    value = sig(degrees(Math.asin(sa)), 3); unit = "°";
    prompt = `${V} of mass ${mTxt} is driven up ${road}, against a constant resistance of ${ut(i.R, "N")}. Its engine works at a constant rate of ${Pshown}. When its speed is ${spd(i.v)} its acceleration is ${ut(i.a, "m s⁻²")}. Take $g = ${g}$. Find $\\alpha$, giving your answer in degrees.`;
    known.push(`P = ${u(powerIn(i.P, i.pUnit), i.pUnit)}`, `v = ${u(speedIn(i.v, i.vUnit), i.vUnit)}`, `R = ${u(i.R, "N")}`, `a = ${u(i.a, "m s⁻²")}`); speedsShown.push(i.v);
    sub("Power = driving force × speed, so the driving force is power divided by speed", [`T = \\dfrac{P}{v} = \\dfrac{${numTex(i.P)}}{${numTex(i.v)}} = ${sfTex(T, 6)}\\ \\text{N}`]);
    sub("F = ma along the road: driving force, minus resistance, minus the weight's component down the slope", [`T - R - mg\\sin\\alpha = ma`, `${sfTex(T, 6)} - ${numTex(i.R)} - ${M}\\times${G}\\sin\\alpha = ${M}\\times${numTex(i.a)}`]);
    sub("Solve for sin α, then take the inverse sine", [`\\sin\\alpha = \\dfrac{${sfTex(T, 6)} - ${numTex(i.R)} - ${numTex(i.m * i.a)}}{${numTex(i.m * g)}} = ${sfTex(sa, 6)}`, `\\alpha = ${u(value, unit)}${r3}`.replace("\\ \\text{°}", "^\\circ")]);
  } else if (i.ask === "time") {
    const W = i.R * i.d + 0.5 * i.m * i.v ** 2 + S * i.d;
    value = sig(W / i.P, 3); unit = "s";
    prompt = `${V} of mass ${mTxt} starts from rest and moves up ${road}. Its engine works at a constant rate of ${Pshown} and the resistance to its motion is a constant ${ut(i.R, "N")}. It reaches a speed of ${spd(i.v)} after travelling ${ut(i.d, "m")} along the road. Take $g = ${g}$. Find the time taken.`;
    known.push(`P = ${u(powerIn(i.P, i.pUnit), i.pUnit)}`, `R = ${u(i.R, "N")}`, `v = ${u(speedIn(i.v, i.vUnit), i.vUnit)}`, `d = ${u(i.d, "m")}`); speedsShown.push(i.v);
    sub("The height gained along the road is d sin α, so the work against gravity is mgd sin α", [`mgd\\sin\\alpha = ${M}\\times${G}\\times${numTex(i.d)}\\times${sinTex} = ${sfTex(S * i.d, 6)}\\ \\text{J}`]);
    sub("Work done by the engine = work against resistance + gain in KE + gain in PE", [`W = ${numTex(i.R)}\\times${numTex(i.d)} + \\tfrac{1}{2}(${M})(${numTex(i.v)})^{2} + ${sfTex(S * i.d, 6)}`, `W = ${sfTex(W, 6)}\\ \\text{J}`]);
    sub("The engine does work Pt at a constant rate, so time is work divided by power", [`t = \\dfrac{W}{P} = \\dfrac{${sfTex(W, 6)}}{${numTex(i.P)}}`, `t = ${u(value, "s")}${r3}`]);
  } else if (kv) {
    const v = (-S + Math.sqrt(S * S + 4 * i.k * i.P)) / (2 * i.k);
    value = sig(speedIn(v, i.vUnit), 3); unit = i.vUnit;
    prompt = `${V} of mass ${mTxt} has its engine working at a constant rate of ${Pshown}. It moves up a straight road inclined at ${slope}. The resistance to its motion is $${numTex(i.k)}v$ N, where $v$ m s⁻¹ is its speed. Take $g = ${g}$. Find the greatest steady speed${km ? ", in km h⁻¹" : ""} it can maintain up the road.`;
    known.push(`P = ${u(powerIn(i.P, i.pUnit), i.pUnit)}`, `k = ${u(i.k, "N s m⁻¹")}`);
    resolve();
    sub("At a steady speed the driving force equals the resistance plus the weight's component, and T = P ÷ v", [`\\dfrac{P}{v} = ${numTex(i.k)}v + ${sfTex(S, 6)}`, `${numTex(i.k)}v^{2} + ${sfTex(S, 6)}v - ${numTex(i.P)} = 0`]);
    sub("Solve the quadratic, taking the positive root", [`v = \\dfrac{-${sfTex(S, 6)} + \\sqrt{${sfTex(S, 6)}^{2} + 4\\times${numTex(i.k)}\\times${numTex(i.P)}}}{2\\times${numTex(i.k)}} = ${sfTex(v, 6)}\\ \\text{m s}^{-1}`]);
    if (km) sub("Convert to km h⁻¹: multiply by 3.6", [`${sfTex(v, 6)}\\times 3.6 = ${u(value, unit)}${r3}`]); else sub("Round to 3 s.f.", [`v = ${u(value, unit)}${r3}`]);
  } else {
    const T = i.R + sgn * S;
    const what = i.ask;
    if (what === "power") {
      value = sig(powerIn(T * i.v, i.pUnit), 3); unit = i.pUnit;
      prompt = `${V} of mass ${mTxt} travels at a constant speed of ${spd(i.v)} ${motion} ${road}. The resistance to its motion is a constant ${ut(i.R, "N")}. Take $g = ${g}$. Find the power its engine is developing${kw ? ", in kW" : ""}.`;
      known.push(`v = ${u(speedIn(i.v, i.vUnit), i.vUnit)}`, `R = ${u(i.R, "N")}`); speedsShown.push(i.v);
    } else if (what === "resist") {
      const R = i.P / i.v - sgn * S;
      value = sig(R, 3); unit = "N";
      prompt = `${V} of mass ${mTxt} travels at a constant speed of ${spd(i.v)} ${motion} ${road}, with its engine working at a constant rate of ${Pshown}. Take $g = ${g}$. Find the resistance to its motion.`;
      known.push(`P = ${u(powerIn(i.P, i.pUnit), i.pUnit)}`, `v = ${u(speedIn(i.v, i.vUnit), i.vUnit)}`); speedsShown.push(i.v);
    } else {
      const v = i.P / T;
      value = sig(speedIn(v, i.vUnit), 3); unit = i.vUnit;
      prompt = `${V} of mass ${mTxt} has its engine working at a constant rate of ${Pshown}. It moves at a constant speed ${motion} ${road}, against a constant resistance of ${ut(i.R, "N")}. Take $g = ${g}$. Find its speed${km ? ", in km h⁻¹" : ""}.`;
      known.push(`P = ${u(powerIn(i.P, i.pUnit), i.pUnit)}`, `R = ${u(i.R, "N")}`);
    }
    resolve();
    const along = up ? `T = R + mg\\sin\\alpha` : `T + mg\\sin\\alpha = R`;
    sub(`Constant speed, so the resultant force along the road is zero: ${up ? "the driving force up the slope balances the resistance and the weight's component" : "the driving force and the weight's component down the slope balance the resistance"}`, what === "resist"
      ? [`T = \\dfrac{P}{v} = \\dfrac{${numTex(i.P)}}{${numTex(i.v)}} = ${Ttxt(i.P / i.v)}`, along, up ? `R = ${sfTex(i.P / i.v, 6)} - ${sfTex(S, 6)}` : `R = ${sfTex(i.P / i.v, 6)} + ${sfTex(S, 6)}`]
      : [along, up ? `T = ${numTex(i.R)} + ${sfTex(S, 6)} = ${sfTex(T, 6)}\\ \\text{N}` : `T = ${numTex(i.R)} - ${sfTex(S, 6)} = ${sfTex(T, 6)}\\ \\text{N}`]);
    if (what === "power") {
      sub("Power = driving force × speed", [`P = Tv = ${sfTex(T, 6)}\\times${numTex(i.v)} = ${sfTex(T * i.v, 6)}\\ \\text{W}`]);
      sub(kw ? "Write it in kilowatts (divide by 1000) and round" : "Round to 3 s.f.", [`P = ${u(value, unit)}${r3}`]);
    } else if (what === "resist") {
      sub("Round to 3 s.f.", [`R = ${u(value, "N")}${r3}`]);
    } else {
      sub("Power = driving force × speed, so the speed is power divided by the driving force", [`v = \\dfrac{P}{T} = \\dfrac{${numTex(i.P)}}{${sfTex(T, 6)}} = ${sfTex(i.P / T, 6)}\\ \\text{m s}^{-1}`]);
      if (km) sub("Convert to km h⁻¹: multiply by 3.6", [`${sfTex(i.P / T, 6)}\\times 3.6 = ${u(value, unit)}${r3}`]); else sub("Round to 3 s.f.", [`v = ${u(value, unit)}${r3}`]);
    }
  }
  if (km) for (const x of [...new Set([...speedsShown, ...(i.ask === "time" ? [i.v] : [])])]) conv.push(`${u(speedIn(x, "km h⁻¹"), "km h⁻¹")} = ${u(Number(x.toPrecision(12)), "m s⁻¹")}`);
  if (conv.length) steps.unshift({ caption: "Convert to SI units first", lines: conv });
  prompt += " Give your answer to 3 significant figures.";

  // ── the picture: a particle on the road's axis (drawn at 20° so the components can be read) with every force at its true direction
  const AX = 20;
  const upDir = AX, downDir = AX + 180;
  const driveAt = i.ask === "time" || up ? upDir : downDir;
  const resAt = driveAt === upDir ? downDir : upDir;
  const rLabel = kv ? L(`${numTex(i.k)}v`) : i.ask === "resist" ? L(ut(i.R, "N"), "R") : L(ut(i.R, "N"));
  const raw = buildForceDiagram({
    body: L(ut(massIn(i.m, i.mUnit), i.mUnit)), axisAngle: AX,
    forces: [{ kind: "weight", angle: 270, label: L("mg") }, { kind: "normal", angle: AX + 90, label: L("N") }, { kind: "driving", angle: driveAt, label: L("T") }, { kind: "resistance", angle: resAt, label: rLabel }],
    resolve: { force: 0, along: L("mg sin α"), across: L("mg cos α") },
    angleMark: { from: 0, to: AX, label: L("α") },
  });
  return { sub: "powerslope", level: i.level, prompt, course: i.course, a2: true, scene: staged(raw, i.display, ["setting", "forces", "components"]), display: i.display, known, steps, answer: { value, unit, tex: u(value, unit).replace("\\ \\text{°}", "^\\circ"), text: ut(value, unit).replace(" °", "°") }, inputs: { ...i } };
}

export function generatePowerSlope(level: number, o: { ask: string; dir: string; resist: string; angleAs: string; units: string; context: string; g: GValue; display: Common["display"]; course: "AS" | "A2" }): MechProblemData {
  const conv = o.units === "conv";
  const kv = o.resist === "kv";
  const sineMode = o.angleAs === "sine";
  const pickIn = (s: string, f: string): string => { const xs = s.split(",").filter(Boolean); return xs[Math.floor(Math.random() * xs.length)] ?? f; };
  let ask = (kv ? "speed" : pickIn(o.ask, "speed")) as Ask;
  if (ask === "angle" && sineMode) ask = "speed";
  const dir = (kv || ask === "angle" || ask === "time" ? "up" : pickIn(o.dir, "up")) as "up" | "down";
  const c = o.context === "story" ? pickContext("power", conv ? true : undefined) : undefined;
  const sizes = vehicleSizes(c);
  const g = o.g;
  for (let tries = 0; tries < 600; tries++) {
    const km = conv && !!c;
    const m = inRange(sizes.mass);
    const mUnit: MassUnit = conv && m >= 1000 && m % 1000 === 0 ? "tonne" : "kg";
    const v = vehicleSpeed(c, km, sizes);
    const R = inRange(sizes.resist);
    const nSine = inRange([10, 40, 5]);
    const alpha = ask === "angle" ? inRange([3, 12, 1]) : inRange([2, 10, 1]);
    const base = { level, course: o.course, display: o.display, ask, dir, resist: (kv ? "kv" : "const") as "const" | "kv", angleAs: (sineMode ? "sine" : "deg") as "deg" | "sine", alpha: sineMode ? 0 : alpha, nSine: sineMode ? nSine : 0, g, m, mUnit, vUnit: (km ? "km h⁻¹" : "m s⁻¹") as SpeedUnit, v, R, a: 0, d: 0, k: 0, ctx: c?.id ?? "particle" };
    const s = sineMode ? 1 / nSine : Math.sin(radians(alpha));
    const S = m * g * s, sgn = dir === "up" ? 1 : -1;
    const asP = (P: number): { P: number; pUnit: PowerUnit } => { const pUnit: PowerUnit = conv && P >= 2000 ? "kW" : "W"; const shown = sig(powerIn(P, pUnit), 3); return { P: shown * (pUnit === "kW" ? 1000 : 1), pUnit }; };
    let T = R + sgn * S;
    if (!(T >= 100)) continue;
    if (ask === "power") {
      if (!(T * v >= 500 && T * v <= 250000)) continue;
      return buildPowerSlope({ ...base, P: 0, pUnit: conv && T * v >= 2000 ? "kW" : "W" });
    }
    if (kv) {
      const k = inRange([10, 40, 5]);
      const P0 = v * (k * v + S);
      const sh = asP(P0);
      const vv = (-S + Math.sqrt(S * S + 4 * k * sh.P)) / (2 * k);
      if (!(vv >= 3 && vv <= 45) || !(sh.P <= 250000)) continue;
      return buildPowerSlope({ ...base, k, ...sh });
    }
    if (ask === "angle") {
      const a = inRange([0.1, 0.6, 0.1]);
      T = R + m * a + S;
      const sh = asP(T * v);
      const sa = (sh.P / v - R - m * a) / (m * g);
      if (!(sa > 0.03 && sa < 0.25) || sh.P > 250000) continue;
      return buildPowerSlope({ ...base, a, ...sh });
    }
    if (ask === "time") {
      const d = inRange([50, 400, 10]);
      const W = R * d + 0.5 * m * v * v + S * d;
      const t0 = inRange([5, 60, 1]);
      const sh = asP(W / t0);
      const t = W / sh.P;
      if (!(t >= 3 && t <= 90) || sh.P > 250000) continue;
      return buildPowerSlope({ ...base, d, ...sh });
    }
    const sh = asP(T * v);
    const vAns = sh.P / T;
    const RAns = sh.P / v - sgn * S;
    if (ask === "speed" && !(vAns >= 3 && vAns <= 45)) continue;
    if (ask === "resist" && !(RAns >= 50)) continue;
    if (sh.P > 250000) continue;
    return buildPowerSlope({ ...base, ...sh });
  }
  return buildPowerSlope({ level, course: o.course, display: o.display, ask: "power", dir: "up", resist: "const", angleAs: "deg", alpha: 5, nSine: 0, g, m: 1000, mUnit: "kg", vUnit: "m s⁻¹", pUnit: "W", v: 15, R: 600, a: 0, d: 0, k: 0, P: 0, ctx: "car" });
}
