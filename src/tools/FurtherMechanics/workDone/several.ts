// Several Forces (several): totals — work by a driving force, against a resistance, by or against gravity, over one or two stages, and the two-step question that finds a
// distance first. Equations first (R5): the forces and distances are picked and every work derived from them. Brief: specs/further-mechanics-mc.md §5.4.
import { buildHorizontal, buildIncline, gravityWork, numTex, type GValue, type MechProblemData } from "../../../shared/mechanics";
import { CONTEXTS, inRange, pickContext } from "../../../shared/mechanics/contexts";
import { cap, L, staged, u, ut, type Common } from "./common";

export type Situation = "two" | "journey" | "twostep" | "stages";

interface SeveralInput extends Common {
  situation: Situation;
  g: GValue;
  ctx: string;
  /** mass (kg), driving force (N), resistance (N), the distance travelled (m) and the height the road rises (+) or falls (−) over it (m) */
  m: number;
  D: number;
  R: number;
  d: number;
  h: number;
  /** stages: a second resistance and distance after the first (d is the first stage) */
  R2: number;
  d2: number;
  /** two-step: the work done against the resistance (J), given in place of the distance */
  Wres: number;
  /** distances and forces written in kN and km? */
  big: boolean;
}

const fmtF = (x: number, big: boolean) => (big && x % 100 === 0 ? { v: x / 1000, unit: "kN" } : { v: x, unit: "N" });
const fmtD = (x: number, big: boolean) => (big && x % 100 === 0 ? { v: x / 1000, unit: "km" } : { v: x, unit: "m" });

export function buildSeveral(i: SeveralInput): MechProblemData {
  const c = CONTEXTS.find((x) => x.id === i.ctx);
  const subject = c ? cap(c.a) : "A particle";
  const driven = c ? c.style === "driven" : false;
  const eng = driven ? "driving force" : "applied force";
  const Df = fmtF(i.D, i.big), Rf = fmtF(i.R, i.big), df = fmtD(i.d, i.big), R2f = fmtF(i.R2, i.big), d2f = fmtD(i.d2, i.big);
  const steps: MechProblemData["steps"] = [];
  const known: string[] = [];
  const results: Array<{ value: number; unit: string; text: string; tex: string }> = [];
  const add = (v: number, unit: string) => results.push({ value: v, unit, text: ut(v, unit), tex: u(v, unit) });
  const conv = (pairs: Array<[string, number, string, number, string]>): string[] => pairs.filter(([, , ua]) => ua !== "N" && ua !== "m").map(([, a, ua, b, ub]) => `${u(a, ua)} = ${u(b, ub)}`);
  let prompt = "";
  let raw;
  let order: (string | string[])[] = ["setting", "forces", "measure"];
  const q = (t: string[]) => t.map((s, k) => `(${String.fromCharCode(97 + k)}) ${s}`).join(" ");

  if (i.situation === "two") {
    const W1 = i.D * i.d, W2 = i.R * i.d;
    prompt = `${subject} moves ${ut(df.v, df.unit)} along a straight horizontal path ${driven ? "with" : "under"} a constant ${eng} of ${ut(Df.v, Df.unit)} against a constant resistance of ${ut(Rf.v, Rf.unit)}. Find ${q(["the work done by the " + eng, "the work done against the resistance"])}.`;
    known.push(`D = ${u(Df.v, Df.unit)}`, `R = ${u(Rf.v, Rf.unit)}`, `d = ${u(df.v, df.unit)}`);
    const cv = conv([["D", Df.v, Df.unit, i.D, "N"], ["R", Rf.v, Rf.unit, i.R, "N"], ["d", df.v, df.unit, i.d, "m"]]);
    if (cv.length) steps.push({ caption: "Convert to SI units first", lines: cv });
    steps.push({ caption: "(a) Work done by the force = force × distance", lines: ["#(a)", `W_D = ${numTex(i.D)} \\times ${numTex(i.d)}`, `= ${u(W1, "J")}`] });
    steps.push({ caption: "(b) Work done against the resistance = resistance × distance", lines: ["#(b)", `W_R = ${numTex(i.R)} \\times ${numTex(i.d)}`, `= ${u(W2, "J")}`] });
    add(W1, "J"); add(W2, "J");
    raw = buildHorizontal({ body: c ? "block" : "particle", forces: [{ kind: "driving", label: L(ut(Df.v, Df.unit)) }, { kind: "resistance", label: L(ut(Rf.v, Rf.unit)) }], weightAndNormal: false, distance: { label: L(ut(df.v, df.unit)), from: "A", to: "B" } });
  } else if (i.situation === "journey") {
    const rise = i.h > 0, H = Math.abs(i.h);
    const W1 = i.D * i.d, Wg = Number(gravityWork(i.m, H, i.g).toPrecision(12)), W2 = i.R * i.d;
    const gword = rise ? "against" : "by";
    prompt = `${subject} of mass ${ut(i.m, "kg")} is driven ${ut(df.v, df.unit)} along a straight road ${rise ? "that rises" : "that falls"} ${ut(H, "m")} over this distance. The ${eng} is a constant ${ut(Df.v, Df.unit)} and the resistance to motion is a constant ${ut(Rf.v, Rf.unit)}. Take $g = ${i.g}$ m s⁻². Find ${q(["the work done by the " + eng, `the work done ${gword} gravity`, "the work done against the resistance"])}.`;
    known.push(`m = ${u(i.m, "kg")}`, `D = ${u(Df.v, Df.unit)}`, `R = ${u(Rf.v, Rf.unit)}`, `d = ${u(df.v, df.unit)}`, `\\text{${rise ? "rise" : "fall"}} = ${u(H, "m")}`);
    const cv = conv([["D", Df.v, Df.unit, i.D, "N"], ["R", Rf.v, Rf.unit, i.R, "N"], ["d", df.v, df.unit, i.d, "m"]]);
    if (cv.length) steps.push({ caption: "Convert to SI units first", lines: cv });
    steps.push({ caption: "(a) Work done by the force = force × distance along the road", lines: ["#(a)", `W_D = ${numTex(i.D)} \\times ${numTex(i.d)}`, `= ${u(W1, "J")}`] });
    steps.push({ caption: `(b) Gravity acts through the ${rise ? "rise" : "fall"} in height, not the distance along the road`, lines: ["#(b)", `W_g = mgh = ${numTex(i.m)} \\times ${numTex(i.g)} \\times ${numTex(H)}`, `= ${u(Wg, "J")}\\ \\text{${gword} gravity}`] });
    steps.push({ caption: "(c) Work done against the resistance = resistance × distance", lines: ["#(c)", `W_R = ${numTex(i.R)} \\times ${numTex(i.d)}`, `= ${u(W2, "J")}`] });
    add(W1, "J"); add(Wg, "J"); add(W2, "J");
    // a road that falls is drawn with the finish at the top-left name swapped, so the names run A to B in the direction of travel
    raw = buildIncline({ angle: 14, body: c ? "block" : "particle", bodyLabel: undefined, distance: { label: L(ut(df.v, df.unit)), from: rise ? "A" : "B", to: rise ? "B" : "A" }, height: L(ut(H, "m")) });
  } else if (i.situation === "twostep") {
    const dist = i.Wres / i.R, W1 = i.D * dist;
    prompt = `${subject} travels along a straight horizontal path against a constant resistance of ${ut(Rf.v, Rf.unit)}. The work done against the resistance is ${ut(i.Wres / 1000, "kJ")}. The ${eng} is a constant ${ut(Df.v, Df.unit)}. Find ${q(["the distance travelled", "the work done by the " + eng])}.`;
    known.push(`R = ${u(Rf.v, Rf.unit)}`, `W_R = ${u(i.Wres / 1000, "kJ")}`, `D = ${u(Df.v, Df.unit)}`);
    const cv: string[] = [];
    if (Rf.unit === "kN") cv.push(`${u(Rf.v, "kN")} = ${u(i.R, "N")}`);
    if (Df.unit === "kN") cv.push(`${u(Df.v, "kN")} = ${u(i.D, "N")}`);
    cv.push(`${u(i.Wres / 1000, "kJ")} = ${u(i.Wres, "J")}`);
    steps.push({ caption: "Convert to SI units first", lines: cv });
    steps.push({ caption: "(a) Work against the resistance = resistance × distance, so find the distance first", lines: ["#(a)", `${numTex(i.Wres)} = ${numTex(i.R)} \\times d`, `d = \\dfrac{${numTex(i.Wres)}}{${numTex(i.R)}} = ${u(dist, "m")}`] });
    steps.push({ caption: "(b) Work done by the force = force × the distance just found", lines: ["#(b)", `W_D = ${numTex(i.D)} \\times ${numTex(dist)}`, `= ${u(W1, "J")}`] });
    add(dist, "m"); add(W1, "J");
    raw = buildHorizontal({ body: c ? "block" : "particle", forces: [{ kind: "driving", label: L(ut(Df.v, Df.unit)) }, { kind: "resistance", label: L(ut(Rf.v, Rf.unit)) }], weightAndNormal: false, distance: { label: L("d", "d"), from: "A", to: "B" } });
  } else {
    const WR = i.R * i.d + i.R2 * i.d2, WD = i.D * (i.d + i.d2);
    prompt = `${subject} travels along a straight horizontal path. Over the first ${ut(df.v, df.unit)} the resistance to motion is a constant ${ut(Rf.v, Rf.unit)}; over the next ${ut(d2f.v, d2f.unit)} it is a constant ${ut(R2f.v, R2f.unit)}. The ${eng} is a constant ${ut(Df.v, Df.unit)} throughout. Find ${q(["the total work done against the resistance", "the work done by the " + eng + " over the whole journey"])}.`;
    known.push(`R_1 = ${u(Rf.v, Rf.unit)},\\ d_1 = ${u(df.v, df.unit)}`, `R_2 = ${u(R2f.v, R2f.unit)},\\ d_2 = ${u(d2f.v, d2f.unit)}`, `D = ${u(Df.v, Df.unit)}`);
    const cv = conv([["R1", Rf.v, Rf.unit, i.R, "N"], ["d1", df.v, df.unit, i.d, "m"], ["R2", R2f.v, R2f.unit, i.R2, "N"], ["d2", d2f.v, d2f.unit, i.d2, "m"], ["D", Df.v, Df.unit, i.D, "N"]]);
    if (cv.length) steps.push({ caption: "Convert to SI units first", lines: cv });
    steps.push({ caption: "(a) Total work against resistance = work in the first stage + work in the second", lines: ["#(a)", `W_R = ${numTex(i.R)} \\times ${numTex(i.d)} + ${numTex(i.R2)} \\times ${numTex(i.d2)}`, `= ${numTex(i.R * i.d)} + ${numTex(i.R2 * i.d2)}`, `= ${u(WR, "J")}`] });
    steps.push({ caption: "(b) The driving force is constant, so use the whole distance", lines: ["#(b)", `W_D = ${numTex(i.D)} \\times (${numTex(i.d)} + ${numTex(i.d2)})`, `= ${u(WD, "J")}`] });
    add(WR, "J"); add(WD, "J");
    raw = buildHorizontal({ body: c ? "block" : "particle", forces: [{ kind: "driving", label: L(ut(Df.v, Df.unit)) }, { kind: "resistance", label: L("R₁ then R₂") }], weightAndNormal: false, distance: { label: L("d₁ then d₂"), from: "A", to: "B" } });
    order = ["setting", "forces", "measure"];
  }
  const first = results[0];
  const answerText = results.map((r, k) => `(${String.fromCharCode(97 + k)}) ${r.text}`).join(",  ");
  const answerTex = results.map((r, k) => `\\text{(${String.fromCharCode(97 + k)})}\\ ${r.tex}`).join(",\\ \\ ");
  return {
    sub: "several", level: i.level, prompt, course: i.course, a2: false, scene: staged(raw, i.display, order), display: i.display, known, steps,
    answer: { value: first.value, unit: first.unit, tex: answerTex, text: answerText }, extra: results.slice(1).map((r) => ({ value: r.value, unit: r.unit })), inputs: { ...i },
  };
}

export function generateSeveral(level: number, o: { situation: string; units: string; g: GValue; context: string; display: Common["display"]; course: "AS" | "A2" }): MechProblemData {
  const situation = (o.situation.split(",").filter(Boolean)[Math.floor(Math.random() * o.situation.split(",").filter(Boolean).length)] ?? "two") as Situation;
  const conv = o.units === "conv";
  const story = o.context === "story";
  const ctx = story ? pickContext("several", conv ? true : undefined) : undefined;
  const big = conv && (ctx ? ctx.large : true);
  let D: number, R: number, d: number;
  if (big) { R = inRange([300, 1500, 50]); D = R + inRange([100, 2000, 100]); d = inRange([500, 3000, 100]); }
  else if (ctx) { R = inRange([ctx.force[0], Math.round(ctx.force[1] * 0.5 / ctx.force[2]) * ctx.force[2], ctx.force[2]]); D = R + inRange([ctx.force[2] * 2, ctx.force[1] * 0.5, ctx.force[2]]); d = inRange(ctx.dist); }
  else { R = inRange([10, 80, 5]); D = R + inRange([10, 100, 5]); d = inRange([10, 200, 5]); }
  if (big) { R = Math.round(R / 100) * 100 || 300; D = Math.round(D / 100) * 100; if (D <= R) D = R + 100; }
  const m = ctx && ctx.mass[0] >= 500 ? inRange(ctx.mass) : inRange([800, 1800, 50]);
  const h = (Math.random() < 0.5 ? -1 : 1) * inRange([5, 40, 1]);
  const d2 = big ? inRange([500, 2500, 100]) : inRange([10, 150, 5]);
  const R2 = big ? Math.round(inRange([300, 1500, 100]) / 100) * 100 : inRange([10, 80, 5]);
  const Wres = R * d;
  return buildSeveral({ level, course: o.course, display: o.display, situation, g: o.g, ctx: ctx?.id ?? "particle", m, D, R, d, h, R2, d2, Wres, big });
}
