import { describe, expect, it, vi } from "vitest";
import katex from "katex";
import { validateScene, type MechProblemData } from "../shared/mechanics";
import type { ShellOption } from "../shared/decision/types";
import { buildAvgPower } from "../tools/FurtherMechanics/power/avgpower";
import { buildForceSpeed } from "../tools/FurtherMechanics/power/forcespeed";
import { buildPowerSlope } from "../tools/FurtherMechanics/power/powerslope";
import { buildMotion } from "../tools/FurtherMechanics/power/motion";
import App, { __seed } from "../tools/FurtherMechanics/Power";
import { profileOptions } from "../shared/decision/options";

vi.mock("../devMode", () => ({ useDevMode: () => true }));

const base = { level: 1, course: "A2" as const, display: "given" as const };
const rel = (a: number, b: number) => Math.abs(a - b) / Math.max(1e-12, Math.abs(b));
const AP = { ...base, g: 9.8 as const, m: 0, mUnit: "kg", h: 0, t: 0, tUnit: "s", u: 0, v: 0, vUnit: "m s⁻¹", Q: 0, P: 0, pUnit: "W", format: "W", ctx: "particle" } as const;
const FS = { ...base, motion: "constant", resist: "const", n: 1, m: 0, mUnit: "kg", vUnit: "m s⁻¹", pUnit: "W", v: 0, v2: 0, R: 0, a: 0, k: 0, ctx: "particle" } as const;
const PS = { ...base, dir: "up", resist: "const", angleAs: "deg", alpha: 0, nSine: 0, g: 9.8 as const, m: 0, mUnit: "kg", vUnit: "m s⁻¹", pUnit: "W", v: 0, R: 0, a: 0, d: 0, k: 0, P: 0, ctx: "particle" } as const;
const MT = { ...base, data: "function", c1: 0, c2: 0, c3: 0, m: 0, R: 0, t: 0, phase: "accel", V: 0, t1: 0, t2: 0, t3: 0, ctx: "particle" } as const;

describe("Power: acceptance examples", () => {
  it("avgpower: a 3.2 tonne block lifted 28 m in 40 s needs 22.0 kW", () => {
    const a = buildAvgPower({ ...AP, kind: "lift", m: 3200, mUnit: "tonne", h: 28, t: 40, format: "kW", ctx: "crane" });
    expect(a.answer.value).toBe(22);
    expect(a.steps.flatMap((s) => s.lines).join("")).toContain("878{,}080");
  });
  it("forcespeed: 36 kW at 72 km h⁻¹ means a 1800 N resistance; 30 kW at 15 m s⁻¹ against 900 N gives 1.0 m s⁻²; resistance 30v gives 0.8 m s⁻²", () => {
    const r = buildForceSpeed({ ...FS, ask: "resist", vUnit: "km h⁻¹", pUnit: "kW", v: 20, R: 1800, ctx: "car" });
    expect(r.answer.value).toBe(1800);
    expect(r.steps.flatMap((s) => s.lines).join("")).toContain("72\\ \\text{km h}^{-1}");
    const a = buildForceSpeed({ ...FS, ask: "acc", motion: "accel", m: 1100, v: 15, R: 900, a: 1 });
    expect(a.answer.value).toBe(1);
    const k = buildForceSpeed({ ...FS, ask: "acc", motion: "accel", resist: "kv", n: 1, m: 1200, v: 30, v2: 18, k: 30 });
    expect(k.answer.value).toBe(0.8);
  });
  it("powerslope: 24 kW up 5° against 600 N gives 59.4 km h⁻¹; the 4° case takes 7.44 s", () => {
    const s = buildPowerSlope({ ...PS, ask: "speed", m: 1000, vUnit: "km h⁻¹", pUnit: "kW", alpha: 5, R: 600, P: 24000, ctx: "car" });
    expect(s.answer.value).toBe(59.4);
    const t = buildPowerSlope({ ...PS, ask: "time", m: 1200, pUnit: "kW", alpha: 4, R: 700, P: 30000, v: 12, d: 90, ctx: "car" });
    expect(t.answer.value).toBe(7.44);
  });
  it("motion: s = 2t² + t for 0.4 kg gives 20.8 W at t = 3", () => {
    const m = buildMotion({ ...MT, data: "function", c1: 1, c2: 2, m: 0.4, t: 3 });
    expect(m.answer.value).toBe(20.8);
    expect(m.answer.unit).toBe("W");
  });
});

const config = App().props.config;
const groups: ShellOption[] = config.options!;
function draw(sub: string, level: number, over: Record<string, string> = {}): MechProblemData {
  const options = { ...profileOptions(groups, { course: "A2", ...over }, undefined, level, sub), ...over };
  return __seed.generate(level, { subTool: sub, options }).mech!;
}
const many = (sub: string, level: number, n = 80, over: Record<string, string> = {}) => Array.from({ length: n }, () => draw(sub, level, over));
const T3 = 0.0051;

describe("Power: every answer is re-derived by another route", () => {
  it("avgpower: put the answer back into work = power × time", () => {
    for (const level of [1, 2, 3]) for (const m of many("avgpower", level, 120, { apDoing: "lift,brake,pump,accel", apAsk: "power,work,time" })) {
      const i = m.inputs as { kind: string; g: number; m: number; h: number; t: number; u: number; v: number; Q: number; P: number; format: string };
      const k = i.format === "kW" ? 1000 : 1;
      const mgh = i.m * i.g * i.h;
      if (i.kind === "lift") expect(rel(m.answer.value * k * i.t, mgh)).toBeLessThan(T3);
      else if (i.kind === "liftTime") expect(rel(i.P * m.answer.value, mgh)).toBeLessThan(T3);
      else if (i.kind === "work") expect(rel(m.answer.value * (i.format === "kW" ? 1000 : 1), i.P * i.t)).toBeLessThan(T3);
      else if (i.kind === "brake") expect(rel(m.answer.value * k * i.t, 0.5 * i.m * (i.u ** 2 - i.v ** 2))).toBeLessThan(T3);
      else if (i.kind === "pump") expect(rel(m.extra![1].value * k, (i.Q / 60) * (i.g * i.h + 0.5 * i.v * i.v))).toBeLessThan(T3);
      else expect(rel(i.P * m.answer.value, 0.5 * i.m * (i.v ** 2 - i.u ** 2))).toBeLessThan(T3);
    }
  });
  it("forcespeed: every answer closes P = (R + ma) v", () => {
    const over = { fsAsk: "power,force,speed,resist,acc,newpower", fsMotion: "accel" };
    for (const level of [1, 2]) for (const m of many("forcespeed", level, 150, { ...over, fsResist: "const" })) {
      const i = m.inputs as { ask: string; motion: string; m: number; v: number; v2: number; R: number; a: number; pUnit: string; vUnit: string };
      const T0 = i.motion === "accel" || i.ask === "acc" ? i.R + i.m * i.a : i.R;
      const P = T0 * i.v, ans = m.answer.value;
      const kv = i.vUnit === "km h⁻¹" ? 1 / 3.6 : 1;
      if (i.ask === "power") expect(rel(ans * (i.pUnit === "kW" ? 1000 : 1), P)).toBeLessThan(T3);
      else if (i.ask === "force") expect(rel(ans * i.v, P)).toBeLessThan(T3);
      else if (i.ask === "speed") expect(rel(ans * kv * T0, P)).toBeLessThan(T3);
      else if (i.ask === "resist") expect(rel(ans, P / i.v - (i.motion === "accel" ? i.m * i.a : 0))).toBeLessThan(T3);
      else if (i.ask === "acc") expect(rel(i.m * ans + i.R, P / i.v)).toBeLessThan(0.0101);
      else expect(rel(ans * (i.pUnit === "kW" ? 1000 : 1), (P / i.v) * i.v2)).toBeLessThan(T3);
    }
    for (const n of ["speed", "speed2"]) for (const m of many("forcespeed", 3, 150, { fsAsk: "k,maxspeed,maxpower,acc", fsResist: n })) {
      const i = m.inputs as { ask: string; m: number; v: number; v2: number; k: number; n: number; pUnit: string; vUnit: string };
      const P = i.k * i.v ** (i.n + 1), ans = m.answer.value;
      if (i.ask === "k") expect(rel(ans * i.v ** (i.n + 1), P)).toBeLessThan(T3);
      else if (i.ask === "maxspeed") expect(rel(i.k * (ans * (i.vUnit === "km h⁻¹" ? 1 / 3.6 : 1)) ** (i.n + 1), P)).toBeLessThan(0.0151);
      else if (i.ask === "maxpower") expect(rel(ans * (i.pUnit === "kW" ? 1000 : 1), P)).toBeLessThan(T3);
      else expect(rel(i.m * ans + i.k * i.v2 ** i.n, P / i.v2)).toBeLessThan(0.0101);
    }
  });
  it("powerslope: every answer closes P = Tv with T = R ± mg sin α", () => {
    for (const level of [1, 2, 3]) for (const angleAs of ["deg", "sine"]) for (const m of many("powerslope", level, 120, { psAsk: "speed,power,resist,angle,time", psDir: "up,down", psAngle: angleAs })) {
      const i = m.inputs as { ask: string; dir: string; angleAs: string; alpha: number; nSine: number; g: number; m: number; v: number; R: number; a: number; d: number; k: number; P: number; pUnit: string; vUnit: string };
      const S = i.m * i.g * (i.angleAs === "sine" ? 1 / i.nSine : Math.sin((i.alpha * Math.PI) / 180)), sgn = i.dir === "up" ? 1 : -1;
      const ans = m.answer.value;
      if (i.ask === "power") expect(rel(ans * (i.pUnit === "kW" ? 1000 : 1), (i.R + sgn * S) * i.v)).toBeLessThan(T3);
      else if (i.ask === "speed") expect(rel(ans * (i.vUnit === "km h⁻¹" ? 1 / 3.6 : 1) * (i.R + sgn * S), i.P)).toBeLessThan(T3);
      else if (i.ask === "resist") expect(rel(ans + sgn * S, i.P / i.v)).toBeLessThan(0.0101);
      else if (i.ask === "angle") expect(rel(i.P / i.v, i.R + i.m * i.a + i.m * i.g * Math.sin((ans * Math.PI) / 180))).toBeLessThan(0.0101);
      else expect(rel(i.P * ans, i.R * i.d + 0.5 * i.m * i.v ** 2 + S * i.d)).toBeLessThan(T3);
    }
    for (const m of many("powerslope", 3, 120, { psResist: "kv", psDir: "up" })) {
      const i = m.inputs as { g: number; m: number; angleAs: string; alpha: number; nSine: number; k: number; P: number; vUnit: string };
      const S = i.m * i.g * (i.angleAs === "sine" ? 1 / i.nSine : Math.sin((i.alpha * Math.PI) / 180));
      const v = m.answer.value * (i.vUnit === "km h⁻¹" ? 1 / 3.6 : 1);
      expect(rel(i.P / v, i.k * v + S)).toBeLessThan(0.0101);
    }
  });
  it("motion: a numerical derivative of the data gives the same power", () => {
    for (const level of [1, 2]) for (const m of many("motion", level, 120, { mtData: level === 1 ? "function" : "graph", mtResist: "none,const" })) {
      const i = m.inputs as { data: string; c1: number; c2: number; c3: number; m: number; R: number; t: number; phase: string; V: number; t1: number; t2: number; t3: number };
      let v: number, a: number;
      const h = 1e-4;
      if (i.data === "function") {
        const s = (t: number) => i.c3 * t ** 3 + i.c2 * t * t + i.c1 * t;
        v = (s(i.t + h) - s(i.t - h)) / (2 * h);
        a = (s(i.t + h) - 2 * s(i.t) + s(i.t - h)) / (h * h);
      } else {
        const pts: Array<[number, number]> = [[0, 0], [i.t1, i.V], [i.t2, i.V], [i.t3, 0]];
        const vt = (t: number) => { for (let k = 0; k < 3; k++) { const [x0, y0] = pts[k], [x1, y1] = pts[k + 1]; if (t >= x0 && t <= x1) return y0 + ((y1 - y0) * (t - x0)) / (x1 - x0); } return 0; };
        v = vt(i.t); a = (vt(i.t + 0.01) - vt(i.t - 0.01)) / 0.02;
      }
      const P = (i.data === "graph" && i.phase === "decel" ? -i.m * a - i.R : i.m * a + i.R) * v;
      expect(rel(m.answer.value * (m.answer.unit === "kW" ? 1000 : 1), P), `${i.data} ${i.phase}`).toBeLessThan(0.0061);
    }
  });
});

describe("Power: strings, pictures, course and worksheet", () => {
  it("every KaTeX line renders and every scene validates in every display mode", () => {
    for (const sub of ["avgpower", "forcespeed", "powerslope", "motion"]) for (const level of [1, 2, 3]) for (const display of ["given", "build", "hidden"]) {
      if (sub === "motion" && level === 3) continue;
      for (const m of many(sub, level, 25, { diagram: display, apDoing: "lift,brake,pump,accel", apAsk: "power,work,time", fsAsk: "power,force,speed,resist,acc,newpower,k,maxspeed,maxpower", fsResist: level === 3 ? "speed2" : "const", fsMotion: "accel", psAsk: "speed,power,resist,angle,time", psDir: "up,down", mtData: level === 1 ? "function" : "graph" })) {
        for (const r of [...m.known, ...m.steps.flatMap((s) => s.lines), m.answer.tex]) if (r !== "" && !r.startsWith("#")) expect(() => katex.renderToString(r, { throwOnError: true }), `${sub} L${level}: ${r}`).not.toThrow();
        for (const seg of m.prompt.split("$").filter((_, k) => k % 2 === 1)) expect(() => katex.renderToString(seg, { throwOnError: true }), m.prompt).not.toThrow();
        if (m.scene) expect(validateScene(m.scene), `${sub} L${level}`).toEqual([]);
      }
    }
  });
  it("nothing A2-only at AS, and Power on a Slope is offered at A2 only", () => {
    for (const sub of ["avgpower", "forcespeed", "motion"]) for (const level of [1, 2, 3]) for (let k = 0; k < 40; k++) {
      if (sub === "motion" && level === 3) continue;
      expect(__seed.generate(level, { subTool: sub, options: { ...profileOptions(groups, { course: "AS" }, undefined, level, sub), course: "AS" } }).mech!.a2, `${sub} L${level}`).toBe(false);
    }
    const slope = __seed.subTools.find((s) => s.key === "powerslope")!;
    expect(slope.when).toEqual([{ key: "course", values: ["A2"] }]);
  });
  it("a worksheet of 30 has different questions at default options at every level", () => {
    for (const sub of ["avgpower", "forcespeed", "powerslope", "motion"]) for (const level of sub === "motion" ? [1, 2] : [1, 2, 3]) {
      const seen = new Set<string>();
      for (let k = 0; k < 800 && seen.size < 30; k++) seen.add(draw(sub, level).prompt);
      expect(seen.size, `${sub} L${level}`).toBeGreaterThanOrEqual(30);
    }
  });
});

describe("Power: a train with coaches and vector work (A2)", () => {
  it("train: the acceleration closes P = Fv with the total resistance, and the coupling carries the coaches", () => {
    for (const m of many("forcespeed", 3, 100, { fsVehicle: "train" })) {
      const i = m.inputs as { n: number; mE: number; mC: number; RE: number; rC: number; v: number; a: number };
      const M = i.mE + i.n * i.mC, R = i.RE + i.n * i.rC, P = (R + M * i.a) * i.v;
      expect(rel(m.answer.value, i.a)).toBeLessThan(T3);
      expect(rel(P / i.v - R, M * m.answer.value)).toBeLessThan(0.0101);
      expect(rel(m.extra![0].value, i.n * i.rC + i.n * i.mC * i.a)).toBeLessThan(0.0101);
    }
  });
  it("vectors: the work is F·d and the power is the work over the time", () => {
    for (const m of many("forcespeed", 3, 100, { fsAsk: "vector", fsResist: "const" })) {
      const i = m.inputs as { F: string; A: string; B: string; t: number; ask: string };
      expect(i.ask).toBe("vector");
      const F = i.F.split(",").map(Number), A = i.A.split(",").map(Number), B = i.B.split(",").map(Number);
      const W = F[0] * (B[0] - A[0]) + F[1] * (B[1] - A[1]);
      expect(m.answer.value).toBe(W);
      expect(rel(m.extra![0].value, W / i.t)).toBeLessThan(T3);
      expect(m.a2).toBe(true);
    }
  });
  it("every line renders, and vectors are not offered at AS", () => {
    for (const over of [{ fsVehicle: "train" }, { fsAsk: "vector", fsResist: "const" }] as Array<Record<string, string>>) for (const display of ["given", "build", "hidden"]) for (const m of many("forcespeed", 3, 25, { ...over, diagram: display })) {
      for (const r of [...m.known, ...m.steps.flatMap((s) => s.lines), m.answer.tex]) if (r !== "" && !r.startsWith("#")) expect(() => katex.renderToString(r, { throwOnError: true }), r).not.toThrow();
      for (const seg of m.prompt.split("$").filter((_, k) => k % 2 === 1)) expect(() => katex.renderToString(seg, { throwOnError: true }), m.prompt).not.toThrow();
      if (m.scene) expect(validateScene(m.scene)).toEqual([]);
    }
    for (let k = 0; k < 40; k++) expect(__seed.generate(3, { subTool: "forcespeed", options: { ...profileOptions(groups, { course: "AS" }, undefined, 3, "forcespeed"), course: "AS", fsAsk: "vector", fsResist: "const" } }).mech!.a2).toBe(false);
  });
});
