// The two settings of the Work-Energy Principle that need their own picture: a rough slope (A2: friction is μ times the normal reaction, which needs the weight resolved
// across the slope) and a load raised by a rope over a pulley with a constant pulling force. Brief: specs/further-mechanics-mc.md §5.7 (A2 friction on a slope, projection
// up a rough slope, the pulley case). Equations first (R5): a speed that is given is rounded to 3 s.f. and the answer recomputed from the SHOWN value.
import { buildForceDiagram, buildPulley, numTex, radians, sfTex, sig, type GValue, type MechProblemData } from "../../../shared/mechanics";
import { CONTEXTS, inRange } from "../../../shared/mechanics/contexts";
import { cap, L, staged, u, ut, type Common } from "../workDone/common";

// ── a rough slope (A2) ───────────────────────────────────────────────────────────────────────────────────────────────

interface RoughInput extends Common {
  ask: "speed" | "stop" | "mu";
  g: GValue;
  m: number;
  /** the slope's angle (degrees), the coefficient of friction, the distance slid down (m), the speed at the start (m s⁻¹), and (when asking for μ) the speed at the end */
  alpha: number;
  mu: number;
  d: number;
  u: number;
  v: number;
  ctx: string;
}

function buildRough(i: RoughInput): MechProblemData {
  const c = CONTEXTS.find((x) => x.id === i.ctx);
  const r3 = "\\ (3\\text{ s.f.})";
  const g = i.g, G = numTex(g), M = numTex(i.m);
  const sa = Math.sin(radians(i.alpha)), ca = Math.cos(radians(i.alpha));
  const subject = c ? cap(c.a) : "A particle";
  const steps: MechProblemData["steps"] = [];
  const sub = (caption: string, lines: string[]) => steps.push({ caption, lines });
  let value = 0, unit = "", prompt = "";
  const known: string[] = [`m = ${u(i.m, "kg")}`, `\\alpha = ${i.alpha}^\\circ`];
  const resolve = (): void => {
    sub("Resolve perpendicular to the slope: the normal reaction balances the weight's component into the slope", [`R = mg\\cos\\alpha = ${M}\\times${G}\\times\\cos ${i.alpha}^\\circ = ${sfTex(i.m * g * ca, 6)}\\ \\text{N}`]);
    sub("The friction is μ times the normal reaction", [`F = \\mu R = ${numTex(i.mu)}\\times${sfTex(i.m * g * ca, 6)} = ${sfTex(i.mu * i.m * g * ca, 6)}\\ \\text{N}`]);
  };
  if (i.ask === "stop") {
    const s = (i.u * i.u) / (2 * g * (sa + i.mu * ca));
    value = sig(s, 3); unit = "m";
    prompt = `${subject} of mass ${ut(i.m, "kg")} is projected up a line of greatest slope of a rough plane inclined at ${i.alpha}° to the horizontal, with speed ${ut(i.u, "m s⁻¹")}. The coefficient of friction between the particle and the plane is ${numTex(i.mu)}. Take $g = ${g}$. Find the distance the particle travels up the plane before it comes to rest.`;
    known.push(`u = ${u(i.u, "m s⁻¹")}`, `\\mu = ${numTex(i.mu)}`);
    resolve();
    sub("Work-energy principle up the slope: the kinetic energy lost is the work against gravity and against friction (the distance s along the slope)", [`\\tfrac{1}{2}m u^{2} = mg\\,s\\sin\\alpha + F s`, `\\tfrac{1}{2}(${M})(${numTex(i.u)})^{2} = ${sfTex(i.m * g * sa, 6)}s + ${sfTex(i.mu * i.m * g * ca, 6)}s`]);
    sub("Solve for s", [`s = \\dfrac{${sfTex(0.5 * i.m * i.u * i.u, 6)}}{${sfTex(i.m * g * (sa + i.mu * ca), 6)}}`, `s = ${u(value, unit)}${r3}`]);
  } else if (i.ask === "speed") {
    const v2 = i.u * i.u + 2 * g * i.d * (sa - i.mu * ca);
    value = sig(Math.sqrt(v2), 3); unit = "m s⁻¹";
    prompt = `${subject} of mass ${ut(i.m, "kg")} slides down a line of greatest slope of a rough plane inclined at ${i.alpha}° to the horizontal. It passes a point with speed ${ut(i.u, "m s⁻¹")} and moves ${ut(i.d, "m")} further down the plane. The coefficient of friction is ${numTex(i.mu)}. Take $g = ${g}$. Find the speed of the particle at the end of this distance.`;
    known.push(`u = ${u(i.u, "m s⁻¹")}`, `d = ${u(i.d, "m")}`, `\\mu = ${numTex(i.mu)}`);
    resolve();
    sub("Work-energy principle down the slope: the work done by the weight's component, minus the work against friction, is the gain in kinetic energy", [`mgd\\sin\\alpha - Fd = \\tfrac{1}{2}mv^{2} - \\tfrac{1}{2}mu^{2}`, `${sfTex(i.m * g * sa * i.d, 6)} - ${sfTex(i.mu * i.m * g * ca * i.d, 6)} = \\tfrac{1}{2}(${M})v^{2} - \\tfrac{1}{2}(${M})(${numTex(i.u)})^{2}`]);
    sub("Solve for v² and take the positive root", [`v^{2} = ${sfTex(v2, 6)}`, `v = ${u(value, unit)}${r3}`]);
  } else {
    const vs = sig(i.v, 3);
    const mu = sa / ca - (vs * vs - i.u * i.u) / (2 * g * i.d * ca);
    value = sig(mu, 3); unit = "";
    prompt = `${subject} of mass ${ut(i.m, "kg")} slides down a line of greatest slope of a rough plane inclined at ${i.alpha}° to the horizontal. It passes a point with speed ${ut(i.u, "m s⁻¹")} and, after moving ${ut(i.d, "m")} further down the plane, its speed is ${ut(vs, "m s⁻¹")}. Take $g = ${g}$. Find the coefficient of friction between the particle and the plane.`;
    known.push(`u = ${u(i.u, "m s⁻¹")}`, `v = ${u(vs, "m s⁻¹")}`, `d = ${u(i.d, "m")}`);
    sub("Resolve perpendicular to the slope: the normal reaction balances the weight's component into the slope, and F = μR", [`R = mg\\cos\\alpha = ${sfTex(i.m * g * ca, 6)}\\ \\text{N}`, `F = \\mu R = ${sfTex(i.m * g * ca, 6)}\\mu`]);
    sub("Work-energy principle down the slope", [`mgd\\sin\\alpha - Fd = \\tfrac{1}{2}mv^{2} - \\tfrac{1}{2}mu^{2}`, `${sfTex(i.m * g * sa * i.d, 6)} - ${sfTex(i.m * g * ca * i.d, 6)}\\mu = ${sfTex(0.5 * i.m * (vs * vs - i.u * i.u), 6)}`]);
    sub("Solve for μ", [`\\mu = \\dfrac{${sfTex(i.m * g * sa * i.d, 6)} - ${sfTex(0.5 * i.m * (vs * vs - i.u * i.u), 6)}}{${sfTex(i.m * g * ca * i.d, 6)}}`, `\\mu = ${numTex(value)}${r3}`]);
  }
  const AX = 20;
  const up = i.ask === "stop";
  const raw = buildForceDiagram({
    body: L(ut(i.m, "kg")), axisAngle: AX,
    forces: [{ kind: "weight", angle: 270, label: L("mg") }, { kind: "normal", angle: AX + 90, label: L("R") }, { kind: "friction", angle: up ? AX + 180 : AX, label: L("F") }],
    resolve: { force: 0, along: L("mg sin α"), across: L("mg cos α") }, angleMark: { from: 0, to: AX, label: L("α") },
  });
  return { sub: "workenergy", level: i.level, prompt, course: i.course, a2: true, scene: staged(raw, i.display, ["setting", "forces", "components"]), display: i.display, known, steps, answer: { value, unit, tex: unit ? u(value, unit) : numTex(value), text: unit ? ut(value, unit) : String(value) }, inputs: { ...i, setting: "rough" } };
}

export function generateRough(level: number, o: { ask: string; g: GValue; context: string; display: Common["display"]; course: "AS" | "A2" }): MechProblemData {
  const asks = o.ask.split(",").filter((a) => a === "speed" || a === "distance" || a === "mu");
  const pick = asks.length ? asks[Math.floor(Math.random() * asks.length)] : "speed";
  const ask = (pick === "distance" ? "stop" : pick) as RoughInput["ask"];
  const ctx = o.context === "story" ? CONTEXTS.find((c) => c.id === (["crate", "sledge", "skier"][Math.floor(Math.random() * 3)])) : undefined;
  for (let tries = 0; tries < 400; tries++) {
    const m = ctx ? inRange(ctx.mass) : inRange([2, 60, 2]);
    const alpha = inRange([15, 40, 1]);
    const mu = inRange([0.1, 0.5, 0.05]);
    const sa = Math.sin(radians(alpha)), ca = Math.cos(radians(alpha));
    const base = { level, course: o.course, display: o.display, g: o.g, m, alpha, mu, d: inRange([5, 40, 1]), u: inRange([1, 12, 1]), v: 0, ctx: ctx?.id ?? "particle" };
    if (ask === "stop") {
      const s = (base.u * base.u) / (2 * o.g * (sa + mu * ca));
      if (!(s >= 1 && s <= 40) || base.u < 4) continue;
      return buildRough({ ...base, ask });
    }
    const v2 = base.u * base.u + 2 * o.g * base.d * (sa - mu * ca);
    if (!(sa - mu * ca > 0.1) || !(v2 > 4)) continue;
    if (ask === "speed") return buildRough({ ...base, ask });
    const vv = Math.sqrt(v2), vs = sig(vv, 3);
    const muBack = sa / ca - (vs * vs - base.u * base.u) / (2 * o.g * base.d * ca);
    if (Math.abs(muBack - mu) / mu > 0.02 || vv < 3 || vv > 40) continue;
    return buildRough({ ...base, ask, v: vv });
  }
  return buildRough({ level, course: o.course, display: o.display, ask: "speed", g: o.g, m: 10, alpha: 30, mu: 0.2, d: 10, u: 2, v: 0, ctx: "particle" });
}

// ── a load raised by a rope over a pulley ────────────────────────────────────────────────────────────────────────────

interface PulleyInput extends Common {
  ask: "speed" | "force";
  g: GValue;
  /** the load (kg), the constant pulling force (N), the height it is raised through from rest (m), and (when asking for the force) the speed at the top (m s⁻¹) */
  m: number;
  T: number;
  h: number;
  v: number;
}

function buildPulleyEnergy(i: PulleyInput): MechProblemData {
  const r3 = "\\ (3\\text{ s.f.})";
  const g = i.g, G = numTex(g), M = numTex(i.m);
  const steps: MechProblemData["steps"] = [];
  const sub = (caption: string, lines: string[]) => steps.push({ caption, lines });
  let value = 0, unit = "", prompt = "";
  const known: string[] = [`m = ${u(i.m, "kg")}`, `h = ${u(i.h, "m")}`];
  const intro = `A load of mass ${ut(i.m, "kg")} is raised from rest through a vertical height of ${ut(i.h, "m")} by a rope that passes over a smooth pulley, the rope being pulled with a constant force`;
  if (i.ask === "speed") {
    const v2 = (2 * i.h * (i.T - i.m * g)) / i.m;
    value = sig(Math.sqrt(v2), 3); unit = "m s⁻¹";
    prompt = `${intro} of ${ut(i.T, "N")}. Take $g = ${g}$. Find the speed of the load at the top.`;
    known.push(`T = ${u(i.T, "N")}`, `g = ${G}\\ \\text{m s}^{-2}`);
    sub("Work done by the pulling force = gain in potential energy + gain in kinetic energy (it starts from rest)", [`Th = mgh + \\tfrac{1}{2}mv^{2}`, `${numTex(i.T)}\\times${numTex(i.h)} = ${M}\\times${G}\\times${numTex(i.h)} + \\tfrac{1}{2}(${M})v^{2}`]);
    sub("Solve for v² and take the positive root", [`\\tfrac{1}{2}(${M})v^{2} = ${sfTex(i.h * (i.T - i.m * g), 6)}`, `v^{2} = ${sfTex(v2, 6)}`, `v = ${u(value, unit)}${r3}`]);
  } else {
    const vs = sig(i.v, 3);
    const T = i.m * g + (i.m * vs * vs) / (2 * i.h);
    value = sig(T, 3); unit = "N";
    prompt = `${intro} $T$ N. The speed of the load at the top is ${ut(vs, "m s⁻¹")}. Take $g = ${g}$. Find the value of $T$.`;
    known.push(`v = ${u(vs, "m s⁻¹")}`, `g = ${G}\\ \\text{m s}^{-2}`);
    sub("Work done by the pulling force = gain in potential energy + gain in kinetic energy (it starts from rest)", [`Th = mgh + \\tfrac{1}{2}mv^{2}`, `T\\times${numTex(i.h)} = ${M}\\times${G}\\times${numTex(i.h)} + \\tfrac{1}{2}(${M})(${numTex(vs)})^{2}`]);
    sub("Solve for T", [`T = \\dfrac{${sfTex(i.m * g * i.h, 6)} + ${sfTex(0.5 * i.m * vs * vs, 6)}}{${numTex(i.h)}} = ${sfTex(T, 6)}`, `T = ${u(value, unit)}${r3}`]);
  }
  const raw = buildPulley({ load: L(ut(i.m, "kg")), tension: L(i.ask === "force" ? "T" : ut(i.T, "N"), i.ask === "force" ? "T" : undefined), height: L(ut(i.h, "m")), speed: L(i.ask === "speed" ? "v" : ut(sig(i.v, 3), "m s⁻¹"), i.ask === "speed" ? "v" : undefined) });
  return { sub: "workenergy", level: i.level, prompt, course: i.course, a2: false, scene: staged(raw, i.display, ["setting", "height", "forces"]), display: i.display, known, steps, answer: { value, unit, tex: u(value, unit), text: ut(value, unit) }, inputs: { ...i, setting: "pulley" } };
}

export function generatePulleyEnergy(level: number, o: { ask: string; g: GValue; display: Common["display"]; course: "AS" | "A2" }): MechProblemData {
  const asks = o.ask.split(",").filter((a) => a === "speed" || a === "force");
  const ask = (asks.length ? asks[Math.floor(Math.random() * asks.length)] : "speed") as PulleyInput["ask"];
  for (let tries = 0; tries < 300; tries++) {
    const m = inRange([5, 100, 5]), h = inRange([3, 30, 1]);
    const a = inRange([0.2, 2, 0.1]);
    const T = sig(m * (o.g + a), 3);
    const base = { level, course: o.course, display: o.display, g: o.g, m, h, T, v: 0 };
    if (ask === "speed") {
      const v2 = (2 * h * (T - m * o.g)) / m;
      if (!(v2 > 1)) continue;
      return buildPulleyEnergy({ ...base, ask });
    }
    const vv = Math.sqrt(2 * a * h);
    if (vv < 1.5 || vv > 20) continue;
    return buildPulleyEnergy({ ...base, ask, v: vv });
  }
  return buildPulleyEnergy({ level, course: o.course, display: o.display, ask: "speed", g: o.g, m: 20, h: 10, T: 250, v: 0 });
}
