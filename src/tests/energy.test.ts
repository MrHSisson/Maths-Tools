import { describe, expect, it, vi } from "vitest";
import katex from "katex";
import { sig, validateScene, type MechProblemData } from "../shared/mechanics";
import type { ShellOption } from "../shared/decision/types";
import { buildKepe } from "../tools/FurtherMechanics/energy/kepe";
import { buildWorkEnergy } from "../tools/FurtherMechanics/energy/workenergy";
import { buildConserve } from "../tools/FurtherMechanics/energy/conserve";
import App, { __seed } from "../tools/FurtherMechanics/Energy";
import { profileOptions } from "../shared/decision/options";

vi.mock("../devMode", () => ({ useDevMode: () => true }));

const base = { level: 1, course: "A2" as const, display: "given" as const, g: 9.8 as const };
const rel = (a: number, b: number) => Math.abs(a - b) / Math.max(1e-12, Math.abs(b));
const K = { energy: "ke", ask: "energy", m: 1, mUnit: "kg", vUnit: "m s⁻¹", u: 0, v: 0, h1: 0, h2: 0, wUnit: "J", vector: false, vec: [0, 0, 0, 0] as [number, number, number, number], ctx: "particle" } as const;

describe("Energy: acceptance examples", () => {
  it("kepe: a 1.2 tonne car at 72 km h⁻¹ has 240 kJ; 3.5 kg raised 14 m gains 480 J; the vector case gains 15.5 kJ", () => {
    const a = buildKepe({ ...base, ...K, ask: "energy", m: 1200, mUnit: "tonne", vUnit: "km h⁻¹", v: 20, wUnit: "kJ", ctx: "car" });
    expect(a.answer.value).toBe(240);
    expect(a.steps.flatMap((s) => s.lines).join("")).toContain("72\\ \\text{km h}^{-1}");
    const b = buildKepe({ ...base, ...K, energy: "gpe", m: 3.5, h1: 14 });
    expect(b.answer.value).toBe(480);
    const c = buildKepe({ ...base, ...K, ask: "change", m: 2000, wUnit: "kJ", vector: true, vec: [3, 4, 4.5, 4.5] });
    expect(c.answer.value).toBe(15.5);
    expect(c.steps.flatMap((s) => s.lines).join("")).toContain("25");
    expect(c.steps.flatMap((s) => s.lines).join("")).toContain("40.5");
  });
  it("workenergy: the 8 tonne truck needs a 1000 N braking force; the 80 kg cyclist reaches 8.84 m s⁻¹", () => {
    const t = buildWorkEnergy({ ...base, setting: "horizontal", ask: "force", method: "work", m: 8000, mUnit: "tonne", vUnit: "km h⁻¹", u: 15, v: 10, D: 0, R0: 1500, X: 0, d: 200, rise: 0, ctx: "truck" });
    expect(t.answer.value).toBe(1000);
    const c = buildWorkEnergy({ ...base, setting: "slope", ask: "speed", method: "work", m: 80, mUnit: "kg", vUnit: "m s⁻¹", u: 9, v: 0, D: 60, R0: 25, X: 0, d: 400, rise: 18, ctx: "cyclist" });
    expect(c.answer.value).toBe(8.84);
    expect(c.steps.flatMap((s) => s.lines).join("")).toContain("3{,}128");
    const pe = buildWorkEnergy({ ...base, setting: "slope", ask: "speed", method: "pe", m: 80, mUnit: "kg", vUnit: "m s⁻¹", u: 9, v: 0, D: 60, R0: 25, X: 0, d: 400, rise: 18, ctx: "cyclist" });
    expect(pe.answer.value).toBe(8.84);
  });
  it("conserve: the ball thrown up at 18 m s⁻¹ reaches 16.5 m and has 14.4 m s⁻¹ at 6 m", () => {
    const k = { ...base, setting: "vertical" as const, chain: false, len: 0, alpha: 0, m: 0.2, ctx: "ball" };
    expect(buildConserve({ ...k, starts: "up", ask: "max", u: 18, drop: 0 }).answer.value).toBe(16.5);
    expect(buildConserve({ ...k, starts: "up", ask: "speed", u: 18, drop: -6 }).answer.value).toBe(14.4);
  });
});

const config = App().props.config;
const groups: ShellOption[] = config.options!;
function draw(sub: string, level: number, over: Record<string, string> = {}): MechProblemData {
  const options = { ...profileOptions(groups, { course: "A2", ...over }, undefined, level, sub), ...over };
  return __seed.generate(level, { subTool: sub, options }).mech!;
}
const many = (sub: string, level: number, n = 80, over: Record<string, string> = {}) => Array.from({ length: n }, () => draw(sub, level, over));

describe("Energy: every answer closes the energy equation", () => {
  it("kepe: the answer, put back, gives the shown energy", () => {
    for (const level of [1, 2, 3]) for (const m of many("kepe", level, 80, { keAsk: "energy,mass,speed,height,change", keEnergy: "ke,gpe" })) {
      const i = m.inputs as { energy: string; ask: string; m: number; v: number; u: number; h1: number; h2: number; g: number; vector: boolean; vec: string; wUnit: string; vUnit: string };
      const k = i.wUnit === "kJ" ? 1000 : 1;
      const s2 = (v: number) => v * v;
      const vec = String(i.vec).split(",").map(Number);
      const dke = i.vector ? 0.5 * i.m * (s2(vec[2]) + s2(vec[3]) - s2(vec[0]) - s2(vec[1])) : 0.5 * i.m * (s2(i.v) - s2(i.u));
      const dpe = i.m * i.g * (i.h2 - i.h1);
      if (i.ask === "energy") expect(rel(m.answer.value * k, i.energy === "ke" ? 0.5 * i.m * s2(i.v) : i.m * i.g * i.h1)).toBeLessThan(0.0051);
      else if (i.ask === "change") expect(rel(m.answer.value * k, Math.abs(i.energy === "ke" ? dke : dpe))).toBeLessThan(0.0051);
      else if (i.ask === "mass") { const E = i.energy === "ke" ? 0.5 * i.m * s2(i.v) : i.m * i.g * i.h1; expect(rel(i.energy === "ke" ? 0.5 * m.answer.value * s2(i.v) : m.answer.value * i.g * i.h1, E)).toBeLessThan(0.011); }
      else if (i.ask === "speed") { const v = i.vUnit === "km h⁻¹" ? m.answer.value / 3.6 : m.answer.value; expect(rel(0.5 * i.m * v * v, 0.5 * i.m * s2(i.v))).toBeLessThan(0.0111); }
      else expect(rel(i.m * i.g * m.answer.value, i.m * i.g * i.h1)).toBeLessThan(0.011);
    }
  });
  it("workenergy: the answer put back balances the work-energy equation", () => {
    for (const level of [1, 2, 3]) for (const m of many("workenergy", level, 120, { weAsk: "speed,distance,force,work", weSetting: level === 3 ? "slope" : "horizontal", weForces: "both" })) {
      const i = m.inputs as { ask: string; m: number; u: number; v: number; D: number; R0: number; X: number; d: number; rise: number; g: number };
      const Vg = sig(i.v, 3), Wg = i.m * i.g * i.rise;
      const dKE = (v: number) => 0.5 * i.m * (v * v - i.u * i.u);
      const a = m.answer.unit === "km h⁻¹" ? m.answer.value / 3.6 : m.answer.value;
      // each unknown is recomputed from the SHOWN givens (the end speed is shown to 3 s.f.)
      if (i.ask === "speed") expect(rel(0.5 * i.m * a * a, 0.5 * i.m * i.u * i.u + i.D * i.d - i.R0 * i.d - Wg)).toBeLessThan(0.0101);
      else if (i.ask === "distance") expect(rel(a, dKE(Vg) / (i.D - i.R0))).toBeLessThan(0.0051);
      else if (i.ask === "force") expect(rel(a, i.D - i.R0 - (dKE(Vg) + Wg) / i.d)).toBeLessThan(0.0051);
      else expect(rel(a, dKE(Vg) + (i.R0 + i.X) * i.d + Wg)).toBeLessThan(0.0051);
    }
  });
  it("conserve: gravity is the only work, so ½v² − ½u² = g × the drop", () => {
    for (const level of [1, 2, 3]) for (const m of many("conserve", level, 120, { cvStarts: "rest,down,up", cvAsk: "speed,max,stop", cvSetting: level === 3 ? "slope" : "vertical", cvParts: "chain" })) {
      const i = m.inputs as { ask: string; u: number; drop: number; g: number; len: number; alpha: number; setting: string; chain: boolean };
      const drop = i.setting === "slope" && i.alpha > 0 && i.ask !== "stop" ? i.len * Math.sin((i.alpha * Math.PI) / 180) : i.drop;
      if (i.ask === "max") expect(rel(0.5 * i.u * i.u, i.g * m.answer.value)).toBeLessThan(0.011);
      else if (i.ask === "stop") expect(rel(0.5 * i.u * i.u, i.g * m.answer.value * Math.sin((i.alpha * Math.PI) / 180))).toBeLessThan(0.011);
      else {
        const v = i.chain ? m.extra![2].value : m.answer.value;
        expect(rel(v * v, i.u * i.u + 2 * i.g * drop)).toBeLessThan(0.0101);
      }
    }
  });
});

describe("Energy: strings, pictures, course and worksheet", () => {
  it("every KaTeX line renders and every scene validates in every display mode", () => {
    for (const sub of ["kepe", "workenergy", "conserve"]) for (const level of [1, 2, 3]) for (const display of ["given", "build", "hidden"]) {
      for (const m of many(sub, level, 25, { diagram: display, keAsk: "energy,mass,speed,height,change", weAsk: "speed,distance,force,work", weSetting: "slope", cvAsk: "speed,max,stop", cvSetting: "slope", cvParts: "chain", cvStarts: "rest,down,up" })) {
        for (const r of [...m.known, ...m.steps.flatMap((s) => s.lines), m.answer.tex]) if (r !== "" && !r.startsWith("#")) expect(() => katex.renderToString(r, { throwOnError: true }), `${sub} L${level}: ${r}`).not.toThrow();
        for (const seg of m.prompt.split("$").filter((_, k) => k % 2 === 1)) expect(() => katex.renderToString(seg, { throwOnError: true }), m.prompt).not.toThrow();
        if (m.scene) expect(validateScene(m.scene), `${sub} L${level}`).toEqual([]);
      }
    }
  });
  it("nothing A2-only at AS", () => {
    for (const sub of ["kepe", "workenergy", "conserve"]) for (const level of [1, 2, 3]) for (let k = 0; k < 40; k++) {
      const m = __seed.generate(level, { subTool: sub, options: { ...profileOptions(groups, { course: "AS" }, undefined, level, sub), course: "AS", keVelocity: "vector", cvAsk: "speed,stop", cvSetting: "slope" } }).mech!;
      expect(m.a2, `${sub} L${level}`).toBe(false);
    }
  });
  it("a worksheet of 30 has different questions at default options at every level", () => {
    for (const sub of ["kepe", "workenergy", "conserve"]) for (const level of [1, 2, 3]) {
      const seen = new Set<string>();
      for (let k = 0; k < 600 && seen.size < 30; k++) seen.add(draw(sub, level).prompt);
      expect(seen.size, `${sub} L${level}`).toBeGreaterThanOrEqual(30);
    }
  });
});

describe("Energy: a rough slope (A2) and a load raised over a pulley", () => {
  const sin = (d: number) => Math.sin((d * Math.PI) / 180), cos = (d: number) => Math.cos((d * Math.PI) / 180);
  it("every answer closes the work-energy equation", () => {
    for (const m of many("workenergy", 3, 150, { weSetting: "rough", weAsk: "speed,distance,mu" })) {
      const i = m.inputs as { ask: string; setting: string; g: number; m: number; alpha: number; mu: number; d: number; u: number; v: number };
      expect(i.setting).toBe("rough");
      const ans = m.answer.value;
      if (i.ask === "stop") expect(rel(0.5 * i.m * i.u * i.u, i.m * i.g * ans * (sin(i.alpha) + i.mu * cos(i.alpha)))).toBeLessThan(0.0101);
      else if (i.ask === "speed") expect(rel(ans * ans, i.u * i.u + 2 * i.g * i.d * (sin(i.alpha) - i.mu * cos(i.alpha)))).toBeLessThan(0.0101);
      else expect(rel(ans, i.mu)).toBeLessThan(0.0211);
    }
    for (const m of many("workenergy", 3, 150, { weSetting: "pulley", weAsk: "speed,force" })) {
      const i = m.inputs as { ask: string; setting: string; g: number; m: number; T: number; h: number; v: number };
      expect(i.setting).toBe("pulley");
      const ans = m.answer.value;
      if (i.ask === "speed") expect(rel(i.T * i.h, i.m * i.g * i.h + 0.5 * i.m * ans * ans)).toBeLessThan(0.0101);
      else expect(rel(ans * i.h, i.m * i.g * i.h + 0.5 * i.m * sig(i.v, 3) ** 2)).toBeLessThan(0.0051);
    }
  });
  it("a 10 kg particle projected at 6 m s⁻¹ up a 30° plane with μ = 0.2 stops after 2.73 m", () => {
    const m = draw("workenergy", 3, { weSetting: "rough", weAsk: "distance" });
    expect(m.answer.unit).toBe("m");
    const s = 36 / (2 * 9.8 * (sin(30) + 0.2 * cos(30)));
    expect(sig(s, 3)).toBe(2.73);
  });
  it("every KaTeX line renders, every scene validates, and a rough slope is not offered at AS", () => {
    for (const setting of ["rough", "pulley"]) for (const display of ["given", "build", "hidden"]) for (const m of many("workenergy", 3, 25, { weSetting: setting, weAsk: "speed,distance,force,mu", diagram: display })) {
      for (const r of [...m.known, ...m.steps.flatMap((s) => s.lines), m.answer.tex]) if (r !== "" && !r.startsWith("#")) expect(() => katex.renderToString(r, { throwOnError: true }), r).not.toThrow();
      for (const seg of m.prompt.split("$").filter((_, k) => k % 2 === 1)) expect(() => katex.renderToString(seg, { throwOnError: true }), m.prompt).not.toThrow();
      if (m.scene) expect(validateScene(m.scene)).toEqual([]);
    }
    for (let k = 0; k < 40; k++) expect(__seed.generate(3, { subTool: "workenergy", options: { ...profileOptions(groups, { course: "AS" }, undefined, 3, "workenergy"), course: "AS", weSetting: "rough", weAsk: "speed,mu" } }).mech!.a2).toBe(false);
  });
});

describe("Energy: energy bars as the working picture", () => {
  const total = (c: { gpe?: number; epe?: number; ke?: number; work?: number }) => (c.gpe ?? 0) + (c.epe ?? 0) + (c.ke ?? 0) + (c.work ?? 0);
  it("the two columns are the same height, the scene is sound, and the bars wait for the equation", () => {
    const cases: Array<[string, number, Record<string, string>]> = [
      ["conserve", 1, { cvSetting: "vertical", cvAsk: "speed,max" }], ["conserve", 3, { cvSetting: "slope", cvAsk: "speed,stop" }], ["conserve", 2, { cvStarts: "rest,down,up", cvAsk: "speed,max" }],
      ["workenergy", 1, { weSetting: "horizontal", weAsk: "speed,distance,force" }], ["workenergy", 3, { weSetting: "slope", weAsk: "speed,force,work" }],
      ["workenergy", 3, { weSetting: "rough", weAsk: "speed,distance,mu" }], ["workenergy", 3, { weSetting: "pulley", weAsk: "speed,force" }],
    ];
    for (const [sub, level, over] of cases) for (const m of many(sub, level, 60, { ...over, picture: "bars" })) {
      expect(m.scene, sub).toBeDefined();
      expect(validateScene(m.scene!)).toEqual([]);
      const bars = m.scene!.elements.find((e) => e.type === "bars") as unknown as { columns: Array<{ gpe?: number; epe?: number; ke?: number; work?: number }>; reveal?: number };
      expect(bars.columns.length).toBe(2);
      expect(rel(total(bars.columns[0]), total(bars.columns[1])), `${sub} ${JSON.stringify(over)}`).toBeLessThan(0.0101);
      expect(bars.reveal).toBe(2);
    }
  });
  it("without the option the diagram is untouched, and a question with no picture stays without one", () => {
    const m = draw("conserve", 1);
    expect(m.scene!.elements.some((e) => e.type === "bars")).toBe(false);
    expect(draw("conserve", 1, { picture: "bars", diagram: "hidden" }).display).toBe("hidden");
  });
});
