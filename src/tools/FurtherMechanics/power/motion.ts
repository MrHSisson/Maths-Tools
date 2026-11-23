// Power from Motion Data (motion): power = force × speed where the speed and acceleration come from motion data: a displacement function s(t) (differentiate for v and a) or a
// speed-time graph of a vehicle (accelerating, at constant speed, or braking). Brief: specs/further-mechanics-mc.md §5.15.
// Equations first (R5): the function's coefficients, the masses, resistances and graph breakpoints are picked so every speed and acceleration is exact; the answer is the exact power.
import { buildSpeedTime, numTex, sfTex, sig, type MechProblemData } from "../../../shared/mechanics";
import { CONTEXTS, inRange, pickContext } from "../../../shared/mechanics/contexts";
import { L, staged, u, ut, type Common } from "../workDone/common";
import { vehicleSizes } from "./common";

interface MotionInput extends Common {
  data: "function" | "graph";
  /** the function s = c2 t² + c1 t (+ c3 t³ when c3 is not 0) */
  c1: number;
  c2: number;
  c3: number;
  /** the mass (kg), a constant resistance (N, 0 for none) and the time of the instant (s) */
  m: number;
  R: number;
  t: number;
  /** the graph: speed 0 → V over [0, t1], constant to t2, then slowing to rest at t3 */
  phase: "accel" | "const" | "decel";
  V: number;
  t1: number;
  t2: number;
  t3: number;
  ctx: string;
}

/** the speed, the acceleration and the driving (or braking) force at the instant, from the inputs */
function motionAt(i: MotionInput): { v: number; a: number; F: number; B: number } {
  if (i.data === "function") {
    const v = 2 * i.c2 * i.t + i.c1 + 3 * i.c3 * i.t * i.t, a = 2 * i.c2 + 6 * i.c3 * i.t;
    return { v, a, F: i.m * a + i.R, B: 0 };
  }
  if (i.phase === "accel") { const a = i.V / i.t1; return { v: a * i.t, a, F: i.R + i.m * a, B: 0 }; }
  if (i.phase === "const") return { v: i.V, a: 0, F: i.R, B: 0 };
  const d = i.V / (i.t3 - i.t2);
  return { v: i.V - d * (i.t - i.t2), a: -d, F: 0, B: i.m * d - i.R };
}

export function buildMotion(i: MotionInput): MechProblemData {
  const c = CONTEXTS.find((x) => x.id === i.ctx);
  const r3 = "\\ (3\\text{ s.f.})";
  const { v, a, F, B } = motionAt(i);
  const decel = i.data === "graph" && i.phase === "decel";
  const P = (decel ? B : F) * v;
  const kw = P >= 5000;
  const value = sig(kw ? P / 1000 : P, 3), unit = kw ? "kW" : "W";
  const M = numTex(i.m);
  const steps: MechProblemData["steps"] = [];
  const known: string[] = [];
  const sub = (caption: string, lines: string[]) => steps.push({ caption, lines });
  let prompt = "";
  let scene;
  if (i.data === "function") {
    const cubic = i.c3 !== 0;
    const sTex = `${cubic ? `${numTex(i.c3)}t^{3} + ` : ""}${numTex(i.c2)}t^{2} + ${numTex(i.c1)}t`;
    const vTex = `${cubic ? `${numTex(3 * i.c3)}t^{2} + ` : ""}${numTex(2 * i.c2)}t + ${numTex(i.c1)}`;
    const aTex = cubic ? `${numTex(6 * i.c3)}t + ${numTex(2 * i.c2)}` : numTex(2 * i.c2);
    prompt = `A particle of mass ${ut(i.m, "kg")} moves in a straight line ${i.R > 0 ? `against a constant resistance of ${ut(i.R, "N")}` : "with no resistance to its motion"}, driven by an engine. At time $t$ seconds its displacement from a fixed point is $s$ metres, where $s = ${sTex}$. Find the power of the engine when $t = ${i.t}$.`;
    known.push(`m = ${u(i.m, "kg")}`, `s = ${sTex}`, ...(i.R > 0 ? [`R = ${u(i.R, "N")}`] : []), `t = ${u(i.t, "s")}`);
    sub("The velocity is the derivative of the displacement", [`v = \\dfrac{ds}{dt} = ${vTex}`]);
    sub("The acceleration is the derivative of the velocity", [`a = \\dfrac{dv}{dt} = ${aTex}`]);
    sub(`Substitute t = ${i.t} to find the speed and the acceleration`, [`v = ${u(Number(v.toPrecision(12)), "m s⁻¹")}`, `a = ${u(Number(a.toPrecision(12)), "m s⁻²")}`]);
    sub(i.R > 0 ? "F = ma: driving force minus resistance gives the resultant force" : "F = ma: with no resistance the driving force is the resultant force", [i.R > 0 ? `T - ${numTex(i.R)} = ${M}\\times${numTex(a)}` : `T = ${M}\\times${numTex(a)}`, `T = ${u(Number(F.toPrecision(12)), "N")}`]);
  } else {
    const agent = decel ? "brakes" : "engine";
    const role = i.phase === "accel" ? " The engine exerts a constant driving force while the vehicle accelerates." : decel ? " The vehicle is slowed by its brakes alone, which exert a constant force." : "";
    prompt = `The speed-time graph of ${c ? c.a : "a vehicle"} of mass ${ut(i.m, "kg")} on a straight horizontal road is shown: it accelerates uniformly from rest to ${ut(i.V, "m s⁻¹")} at $t = ${i.t1}$, moves at that speed until $t = ${i.t2}$, then slows uniformly to rest at $t = ${i.t3}$. ${i.R > 0 ? `The resistance to its motion is a constant ${ut(i.R, "N")}.` : "Ignore any resistance."}${role} Find the power of the ${agent} at $t = ${i.t}$.`;
    known.push(`m = ${u(i.m, "kg")}`, ...(i.R > 0 ? [`R = ${u(i.R, "N")}`] : []), `t = ${u(i.t, "s")}`);
    const graph = buildSpeedTime({ shape: "trapezium", times: [L(String(i.t1)), L(String(i.t2)), L(String(i.t3))], speed: L(numTex(i.V)) });
    scene = graph;
    if (i.phase === "accel") {
      sub("Read the acceleration from the gradient of the first part of the graph", [`a = \\dfrac{${numTex(i.V)} - 0}{${numTex(i.t1)} - 0} = ${u(Number(a.toPrecision(12)), "m s⁻²")}`, `v = ${numTex(a)}\\times${numTex(i.t)} = ${u(Number(v.toPrecision(12)), "m s⁻¹")}`]);
      sub("F = ma: driving force minus resistance gives the resultant force", [i.R > 0 ? `T - ${numTex(i.R)} = ${M}\\times${numTex(a)}` : `T = ${M}\\times${numTex(a)}`, `T = ${u(Number(F.toPrecision(12)), "N")}`]);
    } else if (i.phase === "const") {
      sub("The graph is horizontal, so the speed is constant", [`v = ${u(i.V, "m s⁻¹")}`]);
      sub("Constant speed, so the resultant force is zero: the driving force equals the resistance", [`T = ${u(i.R, "N")}`]);
    } else {
      const d = i.V / (i.t3 - i.t2);
      sub("Read the deceleration from the gradient of the last part of the graph, and the speed at the time", [`\\text{deceleration} = \\dfrac{${numTex(i.V)}}{${numTex(i.t3)} - ${numTex(i.t2)}} = ${u(Number(d.toPrecision(12)), "m s⁻²")}`, `v = ${numTex(i.V)} - ${numTex(d)}\\times(${numTex(i.t)} - ${numTex(i.t2)}) = ${u(Number(v.toPrecision(12)), "m s⁻¹")}`]);
      sub("F = ma: the brakes and the resistance together slow it down", [i.R > 0 ? `B + ${numTex(i.R)} = ${M}\\times${numTex(d)}` : `B = ${M}\\times${numTex(d)}`, `B = ${u(Number(B.toPrecision(12)), "N")}`]);
    }
  }
  const force = decel ? B : F;
  sub("Power = force × speed", [`P = ${decel ? "B" : "T"}v = ${numTex(force)}\\times${numTex(v)} = ${sfTex(P, 6)}\\ \\text{W}`]);
  sub(kw ? "Write it in kilowatts (divide by 1000) and round" : "Round to 3 s.f.", [`P = ${u(value, unit)}${r3}`]);
  prompt += ` Give your answer to 3 significant figures${kw ? ", in kW" : ""}.`;
  return { sub: "motion", level: i.level, prompt, course: i.course, a2: false, scene: scene ? staged(scene, i.display, ["graph"]) : undefined, display: i.display, known, steps, answer: { value, unit, tex: u(value, unit), text: ut(value, unit) }, inputs: { ...i } };
}

export function generateMotion(level: number, o: { data: string; phase: string; resist: string; context: string; display: Common["display"]; course: "AS" | "A2" }): MechProblemData {
  const pickIn = (s: string, f: string): string => { const xs = s.split(",").filter(Boolean); return xs[Math.floor(Math.random() * xs.length)] ?? f; };
  const data = (o.data === "graph" ? "graph" : "function") as "function" | "graph";
  const withR = pickIn(o.resist, "none") === "const";
  for (let tries = 0; tries < 300; tries++) {
    const base = { level, course: o.course, display: o.display, c1: 0, c2: 0, c3: 0, V: 0, t1: 0, t2: 0, t3: 0 };
    if (data === "function") {
      const cubic = level >= 2 && Math.random() < 0.6;
      const c2 = inRange([0.5, 4, 0.5]), c1 = inRange([1, 6, 1]), c3 = cubic ? inRange([0.5, 2, 0.5]) : 0;
      const m = inRange([0.2, 5, 0.2]), R = withR ? inRange([0.2, 3, 0.2]) : 0;
      const t = inRange([2, 6, 1]);
      return buildMotion({ ...base, data, c1, c2, c3, m, R, t, phase: "accel", ctx: "particle" });
    }
    const c = o.context === "story" ? pickContext("power", true) : undefined;
    const sizes = vehicleSizes(c);
    let phase = pickIn(o.phase, "accel") as MotionInput["phase"];
    if (!withR && phase === "const") phase = "accel";
    const m = inRange(sizes.mass);
    const R = withR ? inRange(sizes.resist) : 0;
    const a1 = inRange([0.5, 2.5, 0.5]), t1 = inRange([4, 12, 1]);
    const V = a1 * t1;
    if (V > 35 || V < 6) continue;
    const t2 = t1 + inRange([10, 40, 5]);
    const t3 = t2 + [4, 5, 8, 10, 20][Math.floor(Math.random() * 5)];
    const t = phase === "accel" ? inRange([1, t1 - 1, 1]) : phase === "const" ? t2 - inRange([2, 8, 1]) : t2 + inRange([1, t3 - t2 - 1, 1]);
    if (phase === "decel" && !(m * (V / (t3 - t2)) - R > 0)) continue;
    if (t <= (phase === "const" ? t1 : 0)) continue;
    return buildMotion({ ...base, data, V, t1, t2, t3, m, R, t, phase, ctx: c?.id ?? "particle" });
  }
  return buildMotion({ level, course: o.course, display: o.display, data: "function", c1: 1, c2: 2, c3: 0, m: 0.4, R: 0, t: 3, phase: "accel", V: 0, t1: 0, t2: 0, t3: 0, ctx: "particle" });
}
