// Work and Gravity (grav): work done by or against gravity = m g h, on a vertical lift or fall and (A2) along a slope, where h = d sin α. Equations first (R5): the mass and
// height (or the distance and angle) are picked, the work is derived and rounded to 3 s.f. as a GIVEN, and the answer is re-computed from the shown givens, so what is
// printed is self-consistent. Brief: specs/further-mechanics-mc.md §5.2.
import { buildIncline, buildVertical, fromSI, gravityWork, numTex, sfTex, sig, slopeHeight, type GValue, type MechProblemData } from "../../../shared/mechanics";
import { CONTEXTS, inRange, pickContext, type MechContext } from "../../../shared/mechanics/contexts";
import { cap, L, staged, u, ut, type Common } from "./common";

interface GravInput extends Common {
  ask: "work" | "height" | "mass";
  /** work done against gravity (a lift or climb) or by gravity (a fall) */
  against: boolean;
  g: GValue;
  setting: "vertical" | "slope";
  /** mass in kg, written in mUnit */
  m: number;
  mUnit: "kg" | "g" | "tonne";
  /** vertical: the height h (m). slope: the distance d along it (m) and its angle α (degrees) */
  h: number;
  d: number;
  alpha: number;
  wUnit: "J" | "kJ";
  /** "vertical": the working uses the angle to the vertical, as the textbook does; "sin": m g d sin α */
  method: "vertical" | "sin";
  ctx: string;
}

export function buildGrav(i: GravInput): MechProblemData {
  const c = CONTEXTS.find((x) => x.id === i.ctx);
  const slope = i.setting === "slope";
  const height = slope ? slopeHeight(i.d, i.alpha) : i.h;
  const Wexact = gravityWork(i.m, height, i.g);
  // the work is given to 3 s.f. when it is a given; the answer is recomputed from what is shown
  const Wgiven = i.ask === "work" ? Wexact : sig(Wexact, 3);
  const mShown = fromSI(i.m, i.mUnit);
  const wShown = (x: number): number => fromSI(x, i.wUnit);
  const asked = i.ask;
  let answerValue: number, answerUnit: string;
  if (asked === "work") { answerValue = sig(Wexact, 3) / (i.wUnit === "kJ" ? 1000 : 1); answerUnit = i.wUnit; }
  else if (asked === "height") { answerValue = sig(Wgiven / (i.m * i.g), 3); answerUnit = "m"; }
  else { answerValue = sig(slope ? Wgiven / (i.g * height) : Wgiven / (i.g * i.h), 3); answerUnit = "kg"; }
  const by = i.against ? "against" : "by";

  // ── the question
  const subject = c ? cap(c.a) : "A particle";
  const mText = asked === "mass" ? "of mass $m$ kg" : `of mass ${ut(mShown, i.mUnit)}`;
  const parts: string[] = [];
  if (slope) {
    parts.push(`${subject} ${mText} ${i.against ? "is pulled up" : "slides down"} a straight slope inclined at ${i.alpha}° to the horizontal, moving ${ut(i.d, "m")} along the slope.`);
  } else if (i.against) {
    parts.push(`${subject} ${mText} is raised vertically through ${asked === "height" ? "a height $h$ m" : `a height of ${ut(i.h, "m")}`}.`);
  } else {
    parts.push(`${subject} ${mText} falls vertically through ${asked === "height" ? "a height $h$ m" : `a height of ${ut(i.h, "m")}`}.`);
  }
  if (asked !== "work") parts.push(`The work done ${by} gravity is ${ut(wShown(Wgiven), i.wUnit)}.`);
  parts.push(`Take $g = ${i.g}$ m s⁻². ${asked === "work" ? `Find the work done ${by} gravity${i.wUnit === "kJ" ? ", in kJ" : ""}.` : asked === "height" ? "Find the height." : "Find the mass."} Give your answer to 3 significant figures.`);

  const known = [
    ...(asked === "mass" ? [] : [`m = ${u(mShown, i.mUnit)}`]),
    ...(slope ? [`d = ${u(i.d, "m")}`, `\\alpha = ${i.alpha}^\\circ`] : asked === "height" ? [] : [`h = ${u(i.h, "m")}`]),
    ...(asked === "work" ? [] : [`W = ${u(wShown(Wgiven), i.wUnit)}`]),
    `g = ${i.g}\\ \\text{m s}^{-2}`,
  ];

  // ── the working
  const steps: MechProblemData["steps"] = [];
  steps.push({ caption: `Work done ${by} gravity is weight × height gained`, lines: ["\\text{Work done} = mg \\times h"] });
  const conv: string[] = [];
  if (i.mUnit !== "kg" && asked !== "mass") conv.push(`${u(mShown, i.mUnit)} = ${u(i.m, "kg")}`);
  if (i.wUnit === "kJ" && asked !== "work") conv.push(`${u(wShown(Wgiven), "kJ")} = ${u(Wgiven, "J")}`);
  if (conv.length) steps.push({ caption: "Convert to SI units first", lines: conv });
  if (slope) {
    const h = height;
    steps.push(i.method === "vertical"
      ? { caption: "The angle to the vertical is 90° minus the angle to the horizontal", lines: [`h = ${numTex(i.d)} \\cos ${90 - i.alpha}^\\circ`, `\\approx ${sfTex(h, 5)}\\ \\text{m}`] }
      : { caption: "The height gained along the slope is d sin α", lines: [`h = ${numTex(i.d)} \\sin ${i.alpha}^\\circ`, `\\approx ${sfTex(h, 5)}\\ \\text{m}`] });
  }
  const hs = slope ? sfTex(height, 5) : numTex(i.h);
  const approxMark = slope ? "\\approx" : "=";
  if (asked === "work") {
    steps.push({ caption: "Substitute", lines: [`W = ${numTex(i.m)} \\times ${numTex(i.g)} \\times ${hs}`, `${approxMark} ${sfTex(Wexact, 6)}\\ \\text{J}`] });
    steps.push({ caption: "Round to 3 s.f.", lines: [`W = ${u(sig(Wexact, 3), "J")}\\ (3\\text{ s.f.})`] });
    if (i.wUnit === "kJ") steps.push({ caption: "Give the answer in kJ", lines: [`W = ${u(answerValue, "kJ")}`] });
  } else if (asked === "height") {
    steps.push({ caption: "Rearrange for h", lines: ["h = \\dfrac{W}{mg}"] });
    steps.push({ caption: "Substitute", lines: [`h = \\dfrac{${numTex(Wgiven)}}{${numTex(i.m)} \\times ${numTex(i.g)}}`, `\\approx ${sfTex(Wgiven / (i.m * i.g), 6)}`, `h = ${u(answerValue, "m")}\\ (3\\text{ s.f.})`] });
  } else {
    steps.push({ caption: "Rearrange for m", lines: ["m = \\dfrac{W}{gh}"] });
    const hv = slope ? hs : numTex(i.h);
    steps.push({ caption: "Substitute", lines: [`m = \\dfrac{${numTex(Wgiven)}}{${numTex(i.g)} \\times ${hv}}`, `\\approx ${sfTex(answerValue, 6)}`, `m = ${u(answerValue, "kg")}\\ (3\\text{ s.f.})`] });
  }

  const hLabel = asked === "height" ? L(`${i.h} m`, "h") : L(ut(i.h, "m"));
  const mLabel = asked === "mass" ? L(`${i.m} kg`, "m") : L(ut(mShown, i.mUnit));
  const raw = slope
    ? buildIncline({ angle: i.alpha, angleLabel: L(`${i.alpha}°`), body: c ? "block" : "particle", bodyLabel: c ? mLabel : undefined, distance: { label: L(ut(i.d, "m")), from: i.against ? "A" : "B", to: i.against ? "B" : "A" }, height: L("h") })
    : buildVertical(i.against
      ? { body: c ? "block" : "particle", bodyLabel: c ? mLabel : undefined, start: { rel: 0 }, end: { rel: 1, height: hLabel }, weight: L("mg") }
      : { body: c ? "block" : "particle", bodyLabel: c ? mLabel : undefined, start: { rel: 1, height: hLabel }, end: { rel: 0 }, weight: L("mg") });
  const scene = staged(raw, i.display, slope ? ["setting", "measure"] : ["setting", "forces", "heights"]);
  return { sub: "grav", level: i.level, prompt: parts.join(" "), course: i.course, a2: slope, scene, display: i.display, known, steps, answer: { value: answerValue, unit: answerUnit, tex: u(answerValue, answerUnit), text: ut(answerValue, answerUnit) }, inputs: { ...i } };
}

export function generateGrav(level: number, o: { ask: string; setting: string; by: string; g: GValue; units: string; format: string; method: string; context: string; display: Common["display"]; course: "AS" | "A2" }): MechProblemData {
  const asks = o.ask.split(",").filter(Boolean);
  const slope = o.setting === "slope" && o.course === "A2";
  let ask = (asks[Math.floor(Math.random() * asks.length)] ?? "work") as GravInput["ask"];
  if (slope && ask === "height") ask = "work";
  const conv = o.units === "conv";
  const ctx: MechContext | undefined = o.context === "story" ? pickContext("grav", conv ? undefined : undefined) : undefined;
  let m: number, mUnit: GravInput["mUnit"] = "kg";
  if (ctx) m = inRange(ctx.mass); else m = inRange([2, 80, 2]);
  if (conv) { if (m >= 1000) mUnit = "tonne"; else if (m < 1 || !ctx) { mUnit = "g"; if (!ctx) m = inRange([200, 900, 50]) / 1000; } }
  if (mUnit === "g" && !Number.isInteger(m * 1000)) mUnit = "kg";
  if (mUnit === "tonne" && !Number.isInteger(m / 100)) mUnit = "kg";
  const h = ctx ? inRange(ctx.height) : inRange([3, 40, 1]);
  const d = slope ? inRange([40, 300, 10]) : h;
  const alpha = 6 + Math.floor(Math.random() * 30);
  const against = o.by !== "by";
  const wUnit: GravInput["wUnit"] = o.format === "kj" ? "kJ" : "J";
  return buildGrav({ level, course: o.course, display: o.display, ask, against, g: o.g, setting: slope ? "slope" : "vertical", m, mUnit, h, d, alpha, wUnit, method: o.method === "sin" ? "sin" : "vertical", ctx: ctx?.id ?? "particle" });
}
