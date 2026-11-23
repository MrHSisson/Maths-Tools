// Force and Speed, two more kinds of question: a train of an engine and coaches (the acceleration of the whole train from P = Fv and F = ma, then the tension in the coupling
// to the coaches by treating them alone), and (A2) a constant force and a displacement as vectors, the work done as F·d and the average power. Brief: §5.13 (a train with
// coaches; vector displacement and the work done, S63). Equations first (R5): the physical inputs are picked and the power shown is their product.
import { buildHorizontal, numTex, sfTex, sig, type MechProblemData } from "../../../shared/mechanics";
import { inRange } from "../../../shared/mechanics/contexts";
import { L, staged, u, ut, type Common } from "../workDone/common";
import { powerIn } from "./common";

interface TrainInput extends Common {
  /** the number of coaches, the mass of the engine and of one coach (kg), the resistance on the engine and on one coach (N) */
  n: number;
  mE: number;
  mC: number;
  RE: number;
  rC: number;
  /** the speed (m s⁻¹) and the acceleration the question is built from (m s⁻²) */
  v: number;
  a: number;
}

const tonnes = (kg: number): string => `${ut(kg / 1000, "tonne")}`;

function buildTrain(i: TrainInput): MechProblemData {
  const r3 = "\\ (3\\text{ s.f.})";
  const M = i.mE + i.n * i.mC, Rtot = i.RE + i.n * i.rC;
  const T = Rtot + M * i.a, P = T * i.v;
  const Pk = powerIn(P, "kW");
  const a = (P / i.v - Rtot) / M;
  const Tc = i.n * i.rC + i.n * i.mC * a;
  const prompt = `A train consists of an engine of mass ${tonnes(i.mE)} and ${i.n} coaches, each of mass ${tonnes(i.mC)}. The resistance to the motion of the engine is ${ut(i.RE / 1000, "kN")} and the resistance to the motion of each coach is ${ut(i.rC / 1000, "kN")}. The train moves along a straight horizontal track with the engine working at a constant rate of ${ut(Pk, "kW")}. When the speed of the train is ${ut(i.v, "m s⁻¹")}, find (a) the acceleration of the train, (b) the tension in the coupling between the engine and the first coach. Give your answers to 3 significant figures.`;
  const known = [`m_E = ${u(i.mE / 1000, "tonne")}`, `m_C = ${u(i.mC / 1000, "tonne")}\\ \\text{each},\\ n = ${i.n}`, `R_E = ${u(i.RE / 1000, "kN")}`, `r_C = ${u(i.rC / 1000, "kN")}\\ \\text{each}`, `P = ${u(Pk, "kW")}`, `v = ${u(i.v, "m s⁻¹")}`];
  const steps: MechProblemData["steps"] = [
    { caption: "Convert to SI units first", lines: [`${u(i.mE / 1000, "tonne")} = ${u(i.mE, "kg")},\\quad ${u(i.mC / 1000, "tonne")} = ${u(i.mC, "kg")}`, `${u(i.RE / 1000, "kN")} = ${u(i.RE, "N")},\\quad ${u(i.rC / 1000, "kN")} = ${u(i.rC, "N")}`, `${u(Pk, "kW")} = ${u(P, "W")}`] },
    { caption: "(a) Power = driving force × speed, so find the driving force", lines: ["#(a)", `T = \\dfrac{P}{v} = \\dfrac{${numTex(P)}}{${numTex(i.v)}} = ${u(Number((P / i.v).toPrecision(12)), "N")}`] },
    { caption: "The whole train: its total mass and the total resistance", lines: [`M = ${numTex(i.mE)} + ${i.n}\\times${numTex(i.mC)} = ${u(M, "kg")}`, `R = ${numTex(i.RE)} + ${i.n}\\times${numTex(i.rC)} = ${u(Rtot, "N")}`] },
    { caption: "F = ma for the whole train: driving force minus total resistance", lines: [`${sfTex(P / i.v, 6)} - ${numTex(Rtot)} = ${numTex(M)}a`, `a = ${u(sig(a, 3), "m s⁻²")}${r3}`] },
    { caption: "(b) Treat the coaches alone: the coupling pulls them forward against their resistance, F = ma", lines: ["#(b)", `T_{c} - ${i.n}\\times${numTex(i.rC)} = ${i.n}\\times${numTex(i.mC)}\\times${sfTex(a, 6)}`, `T_{c} = ${sfTex(Tc, 6)}\\ \\text{N}`, `T_{c} = ${u(sig(Tc, 3), "N")}${r3}`] },
  ];
  const raw = buildHorizontal({ body: "block", bodyLabel: L("train"), weightAndNormal: false, forces: [{ kind: "driving", label: L("T") }, { kind: "resistance", label: L("R") }], velocity: L(ut(i.v, "m s⁻¹")) });
  return {
    sub: "forcespeed", level: i.level, prompt, course: i.course, a2: false, scene: staged(raw, i.display, ["setting", "forces", "measure"]), display: i.display, known, steps,
    answer: { value: sig(a, 3), unit: "m s⁻²", tex: `\\text{(a)}\\ ${u(sig(a, 3), "m s⁻²")},\\ \\text{(b)}\\ ${u(sig(Tc, 3), "N")}`, text: `(a) ${ut(sig(a, 3), "m s⁻²")}, (b) ${ut(sig(Tc, 3), "N")}` },
    extra: [{ value: sig(Tc, 3), unit: "N" }], inputs: { ...i, ask: "train" },
  };
}

export function generateTrain(level: number, o: { display: Common["display"]; course: "AS" | "A2" }): MechProblemData {
  for (let tries = 0; tries < 300; tries++) {
    const n = inRange([2, 8, 1]);
    const mE = inRange([40, 90, 5]) * 1000, mC = inRange([20, 45, 5]) * 1000;
    const RE = inRange([4, 15, 1]) * 500, rC = inRange([1, 4, 1]) * 500;
    const v = inRange([10, 35, 5]), a = inRange([0.05, 0.4, 0.05]);
    const P = (RE + n * rC + (mE + n * mC) * a) * v;
    if (P < 500000 || P > 9000000) continue;
    return buildTrain({ level, course: o.course, display: o.display, n, mE, mC, RE, rC, v, a });
  }
  return buildTrain({ level, course: o.course, display: o.display, n: 4, mE: 60000, mC: 30000, RE: 4000, rC: 1000, v: 20, a: 0.2 });
}

// ── a constant force and a displacement as vectors (A2) ──────────────────────────────────────────────────────────────

interface VectorInput extends Common {
  /** the force (N), the start and finish positions (m), and the time (s) */
  F: string;
  A: string;
  B: string;
  t: number;
}

const vec = (p: number[]): string => `${p[0]}\\mathbf{i} ${p[1] < 0 ? "-" : "+"} ${Math.abs(p[1])}\\mathbf{j}`;
const vecText = (p: number[]): string => `(${p[0]}i ${p[1] < 0 ? "−" : "+"} ${Math.abs(p[1])}j)`;

function buildVector(i: VectorInput): MechProblemData {
  const r3 = "\\ (3\\text{ s.f.})";
  const F = i.F.split(",").map(Number), A = i.A.split(",").map(Number), B = i.B.split(",").map(Number);
  const d = [B[0] - A[0], B[1] - A[1]];
  const W = F[0] * d[0] + F[1] * d[1], P = W / i.t;
  const prompt = `A particle moves from the point with position vector ${vecText(A)} m to the point with position vector ${vecText(B)} m under the action of a constant force ${vecText(F)} N. The motion takes ${ut(i.t, "s")}. Find (a) the work done by the force, (b) the average power of the force. Give your answers to 3 significant figures.`;
  const known = [`\\mathbf{F} = ${vec(F)}\\ \\text{N}`, `\\mathbf{r}_{1} = ${vec(A)}\\ \\text{m}`, `\\mathbf{r}_{2} = ${vec(B)}\\ \\text{m}`, `t = ${u(i.t, "s")}`];
  const steps: MechProblemData["steps"] = [
    { caption: "(a) The displacement is the final position vector minus the starting one", lines: ["#(a)", `\\mathbf{d} = \\mathbf{r}_{2} - \\mathbf{r}_{1} = (${vec(B)}) - (${vec(A)}) = ${vec(d)}`] },
    { caption: "Work done is the scalar product of the force and the displacement: multiply the i components and the j components and add", lines: [`W = \\mathbf{F}\\cdot\\mathbf{d} = (${F[0]})(${d[0]}) + (${F[1]})(${d[1]})`, `W = ${u(W, "J")}`] },
    { caption: "(b) Average power is work done divided by time", lines: ["#(b)", `P = \\dfrac{W}{t} = \\dfrac{${numTex(W)}}{${numTex(i.t)}} = ${sfTex(P, 6)}\\ \\text{W}`, `P = ${u(sig(P, 3), "W")}${r3}`] },
  ];
  return {
    sub: "forcespeed", level: i.level, prompt, course: i.course, a2: true, display: i.display, known, steps,
    answer: { value: W, unit: "J", tex: `\\text{(a)}\\ ${u(W, "J")},\\ \\text{(b)}\\ ${u(sig(P, 3), "W")}`, text: `(a) ${ut(W, "J")}, (b) ${ut(sig(P, 3), "W")}` },
    extra: [{ value: sig(P, 3), unit: "W" }], inputs: { ...i, ask: "vector" },
  };
}

export function generateVector(level: number, o: { display: Common["display"]; course: "AS" | "A2" }): MechProblemData {
  const nz = (): number => { for (;;) { const x = inRange([-6, 8, 1]); if (x !== 0) return x; } };
  for (let tries = 0; tries < 300; tries++) {
    const F = [nz(), nz()], A = [inRange([-4, 6, 1]), inRange([-4, 6, 1])], B = [inRange([-4, 12, 1]), inRange([-4, 12, 1])];
    const W = F[0] * (B[0] - A[0]) + F[1] * (B[1] - A[1]);
    if (!(W >= 10) || (B[0] === A[0] && B[1] === A[1])) continue;
    return buildVector({ level, course: o.course, display: o.display, F: F.join(","), A: A.join(","), B: B.join(","), t: inRange([2, 20, 1]) });
  }
  return buildVector({ level, course: o.course, display: o.display, F: "3,4", A: "1,2", B: "5,6", t: 4 });
}
