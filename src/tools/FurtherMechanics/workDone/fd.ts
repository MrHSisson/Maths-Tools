// Force and Distance (fd): work = force × distance along the line of motion. Equations first (R5): the force and distance are picked in the context's range, the work
// is derived from them, and the unknown asked for is whichever the "Ask for" option names. Brief: specs/further-mechanics-mc.md §5.1.
import { buildHorizontal, fromSI, numTex, work, type MechProblemData, type Unit } from "../../../shared/mechanics";
import { CONTEXTS, inRange, pickContext, type MechContext } from "../../../shared/mechanics/contexts";
import { cap, L, staged, u, ut, type Common } from "./common";

interface FdInput extends Common {
  ask: "work" | "force" | "distance";
  against: boolean;
  /** the force and the distance in SI (N, m) */
  F: number;
  d: number;
  /** the units they are written in */
  fUnit: "N" | "kN";
  dUnit: "m" | "km";
  wUnit: "J" | "kJ";
  /** the context id, or "particle" */
  ctx: string;
}

const phrase = (c: MechContext | undefined, against: boolean, F: string): string => {
  if (!c) return against ? `A particle moves in a straight line against a constant resistance ${F}.` : `A particle moves in a straight line under a constant force ${F} acting in the direction of its motion.`;
  if (c.style === "pulled") return against ? `${cap(c.a)} is dragged along level ground against a constant resistance ${F}.` : `${cap(c.a)} is pulled along level ground by a constant horizontal force ${F}.`;
  return against ? `${cap(c.a)} travels along a level road against a constant resistance ${F}.` : `${cap(c.a)} is driven along a level road by a constant driving force ${F}.`;
};

/** Build the whole question (prose, picture, working, answer) from the inputs. The generator picks the inputs; the acceptance tests call this with their own. */
export function buildFd(i: FdInput): MechProblemData {
  const c = CONTEXTS.find((x) => x.id === i.ctx);
  const W = work(i.F, i.d);
  const Fv = fromSI(i.F, i.fUnit), dv = fromSI(i.d, i.dUnit), Wv = fromSI(W, i.wUnit as Unit);
  const what = i.against ? "resistance" : "force";
  const forceP = i.ask === "force" ? "of magnitude $F$ N" : `of ${ut(Fv, i.fUnit)}`;
  const parts: string[] = [phrase(c, i.against, forceP)];
  parts.push(i.ask === "distance" ? "It moves a distance of $d$ m." : `It moves ${ut(dv, i.dUnit)}.`);
  if (i.ask !== "work") parts.push(`The work done ${i.against ? "against the resistance" : "by the force"} is ${ut(Wv, i.wUnit)}.`);
  parts.push(i.ask === "work" ? `Find the work done ${i.against ? "against the resistance" : "by the force"}${i.wUnit === "kJ" ? ", in kJ" : ""}.` : i.ask === "force" ? `Find the ${what}.` : "Find the distance it moves.");

  const known = [
    ...(i.ask === "force" ? [] : [`${i.against ? "R" : "F"} = ${u(Fv, i.fUnit)}`]),
    ...(i.ask === "distance" ? [] : [`d = ${u(dv, i.dUnit)}`]),
    ...(i.ask === "work" ? [] : [`W = ${u(Wv, i.wUnit)}`]),
  ];

  const sym = i.against ? "R" : "F";
  const conv: string[] = [];
  if (i.fUnit === "kN" && i.ask !== "force") conv.push(`${u(Fv, "kN")} = ${u(i.F, "N")}`);
  if (i.dUnit === "km" && i.ask !== "distance") conv.push(`${u(dv, "km")} = ${u(i.d, "m")}`);
  if (i.wUnit === "kJ" && i.ask !== "work") conv.push(`${u(Wv, "kJ")} = ${u(W, "J")}`);
  const steps: MechProblemData["steps"] = [{ caption: "Use the definition of work done", lines: ["\\text{Work done} = \\text{force} \\times \\text{distance}", i.ask === "work" ? `W = ${sym} \\times d` : i.ask === "force" ? `${sym} = W \\div d` : `d = W \\div ${sym}`] }];
  if (conv.length) steps.push({ caption: "Convert to SI units first", lines: conv });
  let answer: MechProblemData["answer"];
  if (i.ask === "work") {
    steps.push({ caption: "Substitute", lines: [`W = ${numTex(i.F)} \\times ${numTex(i.d)}`, `= ${u(W, "J")}`] });
    if (i.wUnit === "kJ") steps.push({ caption: "Give the answer in kJ", lines: [`= ${u(Wv, "kJ")}`] });
    answer = { value: Wv, unit: i.wUnit, tex: u(Wv, i.wUnit), text: ut(Wv, i.wUnit) };
  } else if (i.ask === "force") {
    steps.push({ caption: "Substitute", lines: [`${sym} = ${numTex(W)} \\div ${numTex(i.d)}`, `= ${u(i.F, "N")}`] });
    answer = { value: i.F, unit: "N", tex: u(i.F, "N"), text: ut(i.F, "N") };
  } else {
    steps.push({ caption: "Substitute", lines: [`d = ${numTex(W)} \\div ${numTex(i.F)}`, `= ${u(i.d, "m")}`] });
    answer = { value: i.d, unit: "m", tex: u(i.d, "m"), text: ut(i.d, "m") };
  }

  const forceLabel = i.ask === "force" ? L(`${i.F} N`, sym) : L(ut(Fv, i.fUnit));
  const distLabel = i.ask === "distance" ? L(`${i.d} m`, "d") : L(ut(dv, i.dUnit));
  const scene = staged(
    buildHorizontal({ body: c ? "block" : "particle", forces: [{ kind: i.against ? "resistance" : "driving", label: forceLabel }], weightAndNormal: false, distance: { label: distLabel, from: "A", to: "B" } }),
    i.display, ["setting", "forces", "measure"],
  );
  return { sub: "fd", level: i.level, prompt: parts.join(" "), course: i.course, a2: false, scene, display: i.display, known, steps, answer, inputs: { ...i } };
}

/** Pick the inputs for a level and options, then build. */
export function generateFd(level: number, o: { ask: string; units: string; force: string; format: string; context: string; display: Common["display"]; course: "AS" | "A2" }): MechProblemData {
  const asks = o.ask.split(",").filter(Boolean);
  const ask = (asks[Math.floor(Math.random() * asks.length)] ?? "work") as FdInput["ask"];
  const conv = o.units === "conv";
  const story = o.context === "story";
  const ctx = story ? pickContext("fd", conv ? true : undefined) : undefined;
  let F: number, d: number;
  if (conv) {
    F = inRange([1000, 6000, 100]);      // 4.2 kN
    d = inRange([100, 900, 10]);          // 0.35 km
    if (ctx && !ctx.large) { F = inRange(ctx.force); d = inRange(ctx.dist); }
  } else if (ctx) { F = inRange(ctx.force); d = inRange(ctx.dist); }
  else { F = inRange(level === 1 ? [5, 60, 1] : [10, 400, 5]); d = inRange(level === 1 ? [2, 25, 1] : [5, 80, 1]); }
  const fUnit: FdInput["fUnit"] = conv && F >= 1000 && F % 100 === 0 ? "kN" : "N";
  const dUnit: FdInput["dUnit"] = conv && d >= 100 && d % 10 === 0 ? "km" : "m";
  const wUnit: FdInput["wUnit"] = o.format === "kj" && (ask === "work" || conv) ? "kJ" : "J";
  const W = work(F, d);
  // a work in kJ must be a short decimal, so that its conversion is plain
  const wOk = wUnit !== "kJ" || Number.isInteger(W / 100);
  return buildFd({ level, course: o.course, display: o.display, ask, against: o.force === "against", F, d, fUnit: wOk ? fUnit : "N", dUnit: wOk ? dUnit : "m", wUnit: wOk ? wUnit : "J", ctx: ctx?.id ?? "particle" });
}
