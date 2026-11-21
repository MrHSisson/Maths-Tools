// Force at an Angle (angle, A2): work = F d cos θ, only the component along the motion does work. Equations first (R5): F, θ and d are picked, W derived and given to 3 s.f.;
// every other unknown is recomputed from the shown givens. Brief: specs/further-mechanics-mc.md §5.3.
import { buildHorizontal, degrees, numTex, sfTex, sig, stageParts, work, radians, type MechProblemData } from "../../../shared/mechanics";
import { CONTEXTS, inRange, pickContext } from "../../../shared/mechanics/contexts";
import { cap, L, staged, u, ut, type Common } from "./common";

interface AngleInput extends Common {
  ask: "work" | "force" | "distance" | "angle" | "power";
  /** the force (N), the angle between it and the motion (degrees), the distance (m), the time (s, for power) */
  F: number;
  theta: number;
  d: number;
  t: number;
  wUnit: "J" | "kJ";
  /** a push down onto the body instead of a pull up and forward */
  push: boolean;
  ctx: string;
}

export function buildAngle(i: AngleInput): MechProblemData {
  const c = CONTEXTS.find((x) => x.id === i.ctx);
  const Wexact = work(i.F, i.d, i.theta);
  const Wgiven = i.ask === "work" || i.ask === "power" ? Wexact : sig(Wexact, 3);
  const cos = Math.cos(radians(i.theta));
  const k = i.wUnit === "kJ" ? 1000 : 1;
  const Wk = (x: number) => x / k;
  let value: number, unit: string;
  switch (i.ask) {
    case "work": value = sig(Wexact, 3) / k; unit = i.wUnit; break;
    case "force": value = sig(Wgiven / (i.d * cos), 3); unit = "N"; break;
    case "distance": value = sig(Wgiven / (i.F * cos), 3); unit = "m"; break;
    case "angle": value = sig(degrees(Math.acos(Wgiven / (i.F * i.d))), 3); unit = "°"; break;
    default: value = sig(Wexact / i.t, 3); unit = "W";
  }
  const thetaShown = i.ask === "angle" ? null : i.theta;

  const subject = c ? cap(c.a) : "A particle";
  const how = i.push ? "is pushed" : "is pulled";
  const forceP = i.ask === "force" ? "$F$ N" : ut(i.F, "N");
  const parts: string[] = [`${subject} ${how} along level ground by a constant force of ${forceP} acting at ${thetaShown === null ? "an angle $\\theta$" : `an angle of ${thetaShown}°`} ${i.push ? "below" : "above"} the horizontal.`];
  parts.push(i.ask === "distance" ? "It moves a distance of $d$ m." : `It moves ${ut(i.d, "m")} horizontally.`);
  if (i.ask === "force" || i.ask === "distance" || i.ask === "angle") parts.push(`The work done by the force is ${ut(Wk(Wgiven), i.wUnit)}.`);
  if (i.ask === "power") parts.push(`The motion takes ${ut(i.t, "s")}.`);
  parts.push(
    i.ask === "work" ? `Find the work done by the force${i.wUnit === "kJ" ? ", in kJ" : ""}.`
    : i.ask === "force" ? "Find the force."
    : i.ask === "distance" ? "Find the distance moved."
    : i.ask === "angle" ? "Find the angle, to the nearest 0.1°."
    : "Find the work done by the force and the average power developed by it.",
  );
  if (i.ask !== "angle") parts.push("Give your answer to 3 significant figures.");

  const known = [
    ...(i.ask === "force" ? [] : [`F = ${u(i.F, "N")}`]),
    ...(thetaShown === null ? [] : [`\\theta = ${thetaShown}^\\circ`]),
    ...(i.ask === "distance" ? [] : [`d = ${u(i.d, "m")}`]),
    ...(i.ask === "force" || i.ask === "distance" || i.ask === "angle" ? [`W = ${u(Wk(Wgiven), i.wUnit)}`] : []),
    ...(i.ask === "power" ? [`t = ${u(i.t, "s")}`] : []),
  ];

  const steps: MechProblemData["steps"] = [{ caption: "Only the component of the force along the motion does work", lines: ["W = F\\cos\\theta \\times d"] }];
  const th = numTex(i.theta);
  if (i.ask === "work" || i.ask === "power") {
    steps.push({ caption: "Substitute", lines: [`W = ${numTex(i.F)} \\cos ${th}^\\circ \\times ${numTex(i.d)}`, `\\approx ${sfTex(Wexact, 6)}\\ \\text{J}`] });
    steps.push({ caption: "Round to 3 s.f.", lines: [`W = ${u(sig(Wexact, 3), "J")}\\ (3\\text{ s.f.})`] });
    if (i.ask === "power") steps.push({ caption: "Average power is work done divided by time", lines: [`P = \\dfrac{W}{t} = \\dfrac{${sfTex(Wexact, 6)}}{${numTex(i.t)}}`, `P = ${u(value, "W")}\\ (3\\text{ s.f.})`] });
    else if (i.wUnit === "kJ") steps.push({ caption: "Give the answer in kJ", lines: [`W = ${u(value, "kJ")}`] });
  } else if (i.ask === "force") {
    steps.push({ caption: "Rearrange for F", lines: ["F = \\dfrac{W}{d\\cos\\theta}"] });
    steps.push({ caption: "Substitute", lines: [`F = \\dfrac{${numTex(Wgiven)}}{${numTex(i.d)} \\cos ${th}^\\circ}`, `\\approx ${sfTex(Wgiven / (i.d * cos), 6)}`, `F = ${u(value, "N")}\\ (3\\text{ s.f.})`] });
  } else if (i.ask === "distance") {
    steps.push({ caption: "Rearrange for d", lines: ["d = \\dfrac{W}{F\\cos\\theta}"] });
    steps.push({ caption: "Substitute", lines: [`d = \\dfrac{${numTex(Wgiven)}}{${numTex(i.F)} \\cos ${th}^\\circ}`, `\\approx ${sfTex(Wgiven / (i.F * cos), 6)}`, `d = ${u(value, "m")}\\ (3\\text{ s.f.})`] });
  } else {
    steps.push({ caption: "Rearrange for cos θ", lines: ["\\cos\\theta = \\dfrac{W}{Fd}"] });
    const ratio = Wgiven / (i.F * i.d);
    steps.push({ caption: "Substitute, then take the inverse cosine (calculator in degrees)", lines: [`\\cos\\theta = \\dfrac{${numTex(Wgiven)}}{${numTex(i.F)} \\times ${numTex(i.d)}}`, `= ${sfTex(ratio, 5)}`, `\\theta = \\cos^{-1}(${sfTex(ratio, 5)})`, `\\theta = ${value}^\\circ\\ (3\\text{ s.f.})`] });
  }

  const raw = buildHorizontal({
    body: c ? "block" : "particle", weightAndNormal: false, distance: { label: i.ask === "distance" ? L(`${i.d} m`, "d") : L(ut(i.d, "m")), from: "A", to: "B" },
    angled: { label: i.ask === "force" ? L(`${i.F} N`, "F") : L(ut(i.F, "N")), angle: i.theta, push: i.push, angleLabel: i.ask === "angle" ? L(`${i.theta}°`, "θ") : L(`${i.theta}°`), components: { along: L("F cos θ"), across: L("F sin θ") } },
  });
  // with the question the angle and its components are on the picture from the start; built up, they come last
  const scene = i.display === "given" ? stageParts(raw, { components: 0 }) : staged(raw, i.display, ["setting", "forces", "measure", "components"]);
  return { sub: "angle", level: i.level, prompt: parts.join(" "), course: i.course, a2: true, scene, display: i.display, known, steps, answer: { value, unit, tex: unit === "°" ? `${value}^\\circ` : u(value, unit), text: ut(value, unit) }, inputs: { ...i } };
}

export function generateAngle(level: number, o: { ask: string; format: string; context: string; display: Common["display"]; course: "AS" | "A2" }): MechProblemData {
  const asks = o.ask.split(",").filter(Boolean);
  const ask = (asks[Math.floor(Math.random() * asks.length)] ?? "work") as AngleInput["ask"];
  const ctx = o.context === "story" ? pickContext("angle") : undefined;
  const F = ctx ? inRange(ctx.force) : inRange([10, 120, 5]);
  const d = ctx ? inRange(ctx.dist) : inRange([5, 60, 5]);
  let theta = inRange([10, 60, 1]);
  if (ask === "angle") while ([30, 45, 60].includes(theta)) theta = inRange([8, 70, 1]);
  const t = inRange([4, 60, 2]);
  const wUnit: AngleInput["wUnit"] = o.format === "kj" && ask === "work" ? "kJ" : "J";
  return buildAngle({ level, course: o.course, display: o.display, ask, F, theta, d, t, wUnit, push: Math.random() < 0.3, ctx: ctx?.id ?? "particle" });
}
