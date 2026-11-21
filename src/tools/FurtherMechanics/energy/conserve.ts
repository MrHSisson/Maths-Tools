// Conservation of Energy (conserve): only gravity does work, so GPE + KE is constant. A fall from rest, a projection up or down, the maximum height, and a slide down a slope given
// by its length and its drop (A2 adds the slope given by its angle, and how far a projection up it goes). The chain mode asks KE, PE lost, KE at the bottom and the speed as lettered
// parts. Equations first (R5). Brief: specs/further-mechanics-mc.md §5.8.
import { buildIncline, buildVertical, gravityWork, kineticEnergy, numTex, radians, sfTex, sig, slopeHeight, type GValue, type MechProblemData } from "../../../shared/mechanics";
import { CONTEXTS, inRange, pickContext } from "../../../shared/mechanics/contexts";
import { cap, L, staged, u, ut, type Common } from "../workDone/common";

interface ConserveInput extends Common {
  setting: "vertical" | "slope";
  starts: "rest" | "down" | "up";
  ask: "speed" | "max" | "stop";
  chain: boolean;
  g: GValue;
  m: number;
  /** the starting speed (m s⁻¹); the fall (+) or rise (−) in height between the two positions (m) */
  u: number;
  drop: number;
  /** slope: its length (m) and, at A2, its angle (degrees; 0 means the drop is given instead) */
  len: number;
  alpha: number;
  ctx: string;
}

export function buildConserve(i: ConserveInput): MechProblemData {
  const c = CONTEXTS.find((x) => x.id === i.ctx);
  const slope = i.setting === "slope";
  const subject = c ? cap(c.a) : "A particle";
  const g = i.g;
  const byAngle = slope && i.alpha > 0;
  const drop = byAngle && i.ask !== "stop" ? slopeHeight(i.len, i.alpha) : i.drop;
  const v2 = i.u ** 2 + 2 * g * drop;
  let value: number, unit: string;
  if (i.ask === "max") { value = sig(i.u ** 2 / (2 * g), 3); unit = "m"; }
  else if (i.ask === "stop") { value = sig(i.u ** 2 / (2 * g * Math.sin(radians(i.alpha))), 3); unit = "m"; }
  else { value = sig(Math.sqrt(v2), 3); unit = "m s⁻¹"; }

  // ── question
  const parts: string[] = [];
  const mTxt = ut(i.m, "kg");
  const startTxt = i.starts === "rest" ? "released from rest" : i.starts === "down" ? `projected downwards with speed ${ut(i.u, "m s⁻¹")}` : `projected upwards with speed ${ut(i.u, "m s⁻¹")}`;
  if (!slope) {
    if (i.ask === "max") parts.push(`${subject} of mass ${mTxt} is projected vertically upwards from the ground with speed ${ut(i.u, "m s⁻¹")}. Ignore air resistance. Take $g = ${g}$.`);
    else if (i.starts === "up") parts.push(`${subject} of mass ${mTxt} is projected vertically upwards from the ground with speed ${ut(i.u, "m s⁻¹")}. Ignore air resistance. Take $g = ${g}$. Find its speed when it is ${ut(Math.abs(i.drop), "m")} above the ground.`);
    else parts.push(`${subject} of mass ${mTxt} is ${startTxt} from a point ${ut(i.drop, "m")} above the ground. Ignore air resistance. Take $g = ${g}$. Find its speed as it reaches the ground.`);
  } else if (i.ask === "stop") {
    parts.push(`${subject} of mass ${mTxt} is projected up a smooth slope inclined at ${i.alpha}° to the horizontal with speed ${ut(i.u, "m s⁻¹")}. Take $g = ${g}$. Find the distance it travels up the slope before it comes to rest.`);
  } else {
    parts.push(`${subject} of mass ${mTxt} is ${startTxt} at the top of a smooth slope ${byAngle ? `of length ${ut(i.len, "m")} inclined at ${i.alpha}° to the horizontal` : `of length ${ut(i.len, "m")} whose top is ${ut(i.drop, "m")} above its foot`}. Take $g = ${g}$. Find its speed at the bottom.`);
  }
  if (i.chain) parts.push(`Find (a) the kinetic energy at the start, (b) the potential energy lost, (c) the kinetic energy at the bottom, (d) the speed at the bottom.`);
  parts.push("Give your answer to 3 significant figures.");
  const known = [`m = ${u(i.m, "kg")}`, ...(i.starts === "rest" ? [] : [`u = ${u(i.u, "m s⁻¹")}`]), ...(i.ask === "max" ? [] : slope ? (byAngle ? [`\\text{length} = ${u(i.len, "m")}`, `\\alpha = ${i.alpha}^\\circ`] : [`\\text{length} = ${u(i.len, "m")}`, `\\text{drop} = ${u(i.drop, "m")}`]) : [`h = ${u(Math.abs(i.drop), "m")}`]), `g = ${g}\\ \\text{m s}^{-2}`];

  // ── working
  const steps: MechProblemData["steps"] = [];
  const M = numTex(i.m), G = numTex(g);
  const r3 = "\\ (3\\text{ s.f.})";
  if (i.ask === "max") {
    steps.push({ caption: "Only gravity does work, so GPE + KE is conserved. Zero level of GPE at the ground; at the top the speed is zero", lines: ["\\text{GPE}_1 + \\text{KE}_1 = \\text{GPE}_2 + \\text{KE}_2", `0 + \\tfrac{1}{2}m(${numTex(i.u)})^{2} = mgH + 0`] });
    steps.push({ caption: "The mass cancels", lines: [`H = \\dfrac{${numTex(i.u)}^{2}}{2 \\times ${G}}`, `H = ${u(value, "m")}${r3}`] });
  } else if (i.ask === "stop") {
    steps.push({ caption: "Only gravity does work, so GPE + KE is conserved. It rises a height s sin α up the slope and stops", lines: ["\\text{GPE}_1 + \\text{KE}_1 = \\text{GPE}_2 + \\text{KE}_2", `0 + \\tfrac{1}{2}m(${numTex(i.u)})^{2} = mg\\,(s\\sin ${i.alpha}^\\circ) + 0`] });
    steps.push({ caption: "The mass cancels; solve for s", lines: [`s = \\dfrac{${numTex(i.u)}^{2}}{2 \\times ${G} \\times \\sin ${i.alpha}^\\circ}`, `s = ${u(value, "m")}${r3}`] });
  } else {
    const falls = i.drop > 0;
    const zero = falls ? "at the bottom (the finish)" : "at the starting point";
    steps.push({ caption: `Only gravity does work, so GPE + KE is conserved. Zero level of GPE ${zero}`, lines: ["\\text{GPE}_1 + \\text{KE}_1 = \\text{GPE}_2 + \\text{KE}_2"] });
    if (byAngle) steps.push({ caption: "The drop is the length times sin α", lines: [`h = ${numTex(i.len)} \\sin ${i.alpha}^\\circ \\approx ${sfTex(drop, 6)}\\ \\text{m}`] });
    const hh = byAngle ? sfTex(drop, 6) : numTex(Math.abs(i.drop));
    steps.push({ caption: i.chain ? "Write the equation with the numbers; the mass is needed here" : "Write the equation with the numbers; the mass cancels", lines: [falls ? `${M}\\times${G}\\times${hh} + \\tfrac{1}{2}(${M})(${numTex(i.u)})^{2} = 0 + \\tfrac{1}{2}(${M})v^{2}` : `0 + \\tfrac{1}{2}(${M})(${numTex(i.u)})^{2} = ${M}\\times${G}\\times${hh} + \\tfrac{1}{2}(${M})v^{2}`] });
    if (i.chain) {
      const ke0 = kineticEnergy(i.m, i.u), pe = gravityWork(i.m, drop, g);
      steps.push({ caption: "(a) Kinetic energy at the start", lines: ["#(a)", `\\text{KE} = \\tfrac{1}{2} \\times ${M} \\times ${numTex(i.u)}^{2} = ${u(Number(ke0.toPrecision(12)), "J")}`] });
      steps.push({ caption: "(b) Potential energy lost is mgh", lines: ["#(b)", `\\text{PE lost} = ${M} \\times ${G} \\times ${hh} = ${u(Number(pe.toPrecision(12)), "J")}`] });
      steps.push({ caption: "(c) Kinetic energy at the bottom = KE at the start + PE lost", lines: ["#(c)", `\\text{KE} = ${numTex(Number(ke0.toPrecision(12)))} + ${numTex(Number(pe.toPrecision(12)))} = ${u(Number((ke0 + pe).toPrecision(12)), "J")}`] });
      steps.push({ caption: "(d) Use KE = ½mv² to find the speed", lines: ["#(d)", `\\tfrac{1}{2}(${M})v^{2} = ${numTex(Number((ke0 + pe).toPrecision(12)))}`, `v = ${u(value, "m s⁻¹")}${r3}`] });
    } else {
      steps.push({ caption: "Cancel the mass and solve for v² (v is positive)", lines: [`v^{2} = ${numTex(i.u)}^{2} ${falls ? "+" : "-"} 2 \\times ${G} \\times ${hh}`, `v^{2} = ${sfTex(v2, 6)}`, `v = ${sfTex(Math.sqrt(v2), 6)}`, `v = ${u(value, "m s⁻¹")}${r3}`] });
    }
  }

  // ── picture
  let raw;
  if (slope) {
    raw = buildIncline({ angle: byAngle ? i.alpha : 14, angleLabel: byAngle ? L(`${i.alpha}°`) : undefined, body: c ? "block" : "particle", length: L(ut(i.len, "m")), height: i.ask === "stop" || byAngle ? undefined : L(ut(i.drop, "m")), velocity: i.starts === "rest" ? undefined : L(ut(i.u, "m s⁻¹")) });
  } else if (i.ask === "max") {
    raw = buildVertical({ body: c ? "block" : "particle", start: { rel: 0, speed: L(ut(i.u, "m s⁻¹")), moving: "up" }, end: { rel: 1, height: L("H", "H") } });
  } else if (i.starts === "up") {
    raw = buildVertical({ body: c ? "block" : "particle", start: { rel: 0, speed: L(ut(i.u, "m s⁻¹")), moving: "up" }, end: { rel: 0.6, height: L(ut(Math.abs(i.drop), "m")), speed: L("v", "v"), moving: "up" } });
  } else {
    raw = buildVertical({ body: c ? "block" : "particle", start: { rel: 1, height: L(ut(i.drop, "m")), speed: i.starts === "rest" ? undefined : L(ut(i.u, "m s⁻¹")), moving: "down" }, end: { rel: 0, speed: L("v", "v"), moving: "down" }, weight: L("mg") });
  }
  const answer = i.chain
    ? (() => { const ke0 = kineticEnergy(i.m, i.u), pe = gravityWork(i.m, drop, g); return { value: Number(ke0.toPrecision(12)), unit: "J", tex: `\\text{(a)}\\ ${u(Number(ke0.toPrecision(12)), "J")},\\ \\text{(b)}\\ ${u(Number(pe.toPrecision(12)), "J")},\\ \\text{(c)}\\ ${u(Number((ke0 + pe).toPrecision(12)), "J")},\\ \\text{(d)}\\ ${u(value, "m s⁻¹")}`, text: `(a) ${ut(Number(ke0.toPrecision(12)), "J")}, (b) ${ut(Number(pe.toPrecision(12)), "J")}, (c) ${ut(Number((ke0 + pe).toPrecision(12)), "J")}, (d) ${ut(value, "m s⁻¹")}` }; })()
    : { value, unit, tex: u(value, unit), text: ut(value, unit) };
  const extra = i.chain ? [{ value: Number(gravityWork(i.m, drop, g).toPrecision(12)), unit: "J" }, { value: Number((kineticEnergy(i.m, i.u) + gravityWork(i.m, drop, g)).toPrecision(12)), unit: "J" }, { value, unit }] : undefined;
  return { sub: "conserve", level: i.level, prompt: parts.join(" "), course: i.course, a2: byAngle || i.ask === "stop", scene: staged(raw, i.display, ["setting", "motion", "heights", "forces"]), display: i.display, known, steps, answer, extra, inputs: { ...i } };
}

export function generateConserve(level: number, o: { setting: string; starts: string; ask: string; parts: string; context: string; g: GValue; display: Common["display"]; course: "AS" | "A2" }): MechProblemData {
  const slope = o.setting === "slope";
  const pickIn = (s: string, f: string) => { const xs = s.split(",").filter(Boolean); return xs[Math.floor(Math.random() * xs.length)] ?? f; };
  let starts = pickIn(o.starts, "rest") as ConserveInput["starts"];
  let ask = pickIn(o.ask, "speed") as ConserveInput["ask"];
  if (ask === "max") starts = "up";
  if (ask === "stop" && (!slope || o.course !== "A2")) ask = "speed";
  if (slope && starts === "up" && ask !== "stop") starts = "down";
  if (!slope && ask === "stop") ask = "speed";
  // a ball or stone is thrown; a skier, sledge or crate slides
  const ctx = o.context === "story" ? (() => { for (let k = 0; k < 50; k++) { const c = pickContext("energy"); if (slope ? ["skier", "sledge", "crate"].includes(c.id) : ["ball", "stone"].includes(c.id)) return c; } return CONTEXTS.find((c) => c.id === (slope ? "skier" : "ball")); })() : undefined;
  const m = ctx ? inRange(ctx.mass) : inRange([1, 20, 1]);
  const uu = starts === "rest" ? 0 : starts === "up" ? inRange([9, 24, 1]) : inRange([2, 24, 1]);
  const h = ctx?.height ? inRange(ctx.height) : inRange([3, 40, 1]);
  // a projection up is asked about a height it really reaches: below the top, which is at least 4 m for a start of 9 m s⁻¹ or more
  const drop = starts === "up" ? -Math.min(h, Math.max(1, Math.floor((uu * uu) / (2 * o.g)) - 1)) : h;
  const alpha = slope && o.course === "A2" && (ask === "stop" || Math.random() < 0.5) ? inRange([10, 40, 2]) : 0;
  const len = inRange([20, 120, 10]);
  const slopeDrop = slope && alpha === 0 ? inRange([3, 18, 1]) : drop;
  const chain = pickIn(o.parts, "one") === "chain" && !slope && starts !== "rest" && ask === "speed" && starts !== "up";
  return buildConserve({ level, course: o.course, display: o.display, setting: slope ? "slope" : "vertical", starts: ask === "stop" ? "up" : starts, ask, chain, g: o.g, m, u: ask === "stop" && uu === 0 ? inRange([3, 15, 1]) : uu, drop: slope ? slopeDrop : drop, len, alpha, ctx: ctx?.id ?? "particle" });
}
