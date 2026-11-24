import { describe, expect, it, vi } from "vitest";
import katex from "katex";
import { bisect, sfText, validateScene, type MechProblemData } from "../shared/mechanics";
import type { ShellOption } from "../shared/decision/types";
import { buildHooke } from "../tools/FurtherMechanics/elastic/hooke";
import { buildEpe } from "../tools/FurtherMechanics/elastic/epe";
import { buildElastic } from "../tools/FurtherMechanics/elastic/elastic";
import App, { __seed } from "../tools/FurtherMechanics/Elastic";
import { profileOptions } from "../shared/decision/options";

vi.mock("../devMode", () => ({ useDevMode: () => true }));

const base = { level: 1, course: "A2" as const, display: "given" as const };
const rel = (a: number, b: number) => Math.abs(a - b) / Math.max(1e-12, Math.abs(b));
const HK = { ...base, setting: "horizontal", kind: "string", ask: "tension", givenAs: "length", compress: false, lUnit: "m", g: 9.8 as const, lam: 0, l: 0, x: 0, m: 0, F: 0, lam2: 0, l2: 0, x2: 0, D: 0 } as const;
const EP = { ...base, kind: "string", ask: "epe", givenAs: "extension", compress: false, lUnit: "m", lam: 0, l: 0, x1: 0, x2: 0 } as const;
const EL = { ...base, setting: "horizontal", kind: "spring", ask: "speedNat", g: 9.8 as const, m: 0, lam: 0, l: 0, x: 0, x2: 0, F: 0, compress: false, alpha: 0, show: false } as const;

describe("Elastic: acceptance examples", () => {
  it("hooke: λ 90 N, l 1.5 m, length 1.9 m gives 24 N; 0.8 kg on l 0.6 m, λ 40 N extends 0.118 m", () => {
    expect(buildHooke({ ...HK, lam: 90, l: 1.5, x: 0.4 }).answer.value).toBe(24);
    const h = buildHooke({ ...HK, setting: "hanging", ask: "extension", lam: 40, l: 0.6, m: 0.8 });
    expect(h.answer.value).toBe(0.118);
  });
  it("epe: λ 60 N, l 0.8 m, stretched from 1.0 m to 1.3 m does 7.88 J of work", () => {
    const e = buildEpe({ ...EP, ask: "work", lam: 60, l: 0.8, x1: 0.2, x2: 0.5 });
    expect(e.answer.value).toBe(7.88);
    expect(e.steps.flatMap((s) => s.lines).join("")).toContain("7.875");
  });
  it("elastic: the 0.6 kg spring stores 4.8 J and reaches 4.0 m s⁻¹; the 2 kg drop reaches x = 0.790 m, a = 39.6 m s⁻² and 5.01 m s⁻¹", () => {
    const a = buildElastic({ ...EL, m: 0.6, lam: 120, l: 0.5, x: 0.2, compress: true });
    expect(a.answer.value).toBe(4.8);
    expect(a.extra![0].value).toBe(4);
    const v = { ...EL, setting: "vertical" as const, kind: "string" as const, m: 2, lam: 150, l: 1.2 };
    expect(buildElastic({ ...v, ask: "maxext" }).answer.value).toBe(0.79);
    expect(buildElastic({ ...v, ask: "acc" }).answer.value).toBe(39.6);
    expect(buildElastic({ ...v, ask: "maxspeed" }).answer.value).toBe(5.01);
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

describe("Elastic: every answer is re-derived by another route", () => {
  it("hooke: the answer, put back, gives Hooke's law and equilibrium", () => {
    for (const level of [1, 2, 3]) for (const m of many("hooke", level, 150, { hkSetting: "horizontal,hanging,two", hkAsk: "tension,extension,length,k,modulus,mass", kind: "string,spring" })) {
      const i = m.inputs as { setting: string; ask: string; lUnit: string; g: number; lam: number; l: number; x: number; m: number; lam2: number; l2: number; x2: number; D: number };
      const ans = m.answer.value, cm = i.lUnit === "cm" ? 0.01 : 1;
      if (i.setting === "horizontal") {
        if (i.ask === "tension") expect(rel(ans, (i.lam * i.x) / i.l)).toBeLessThan(T3);
        else if (i.ask === "extension") expect(rel(ans * cm, i.x)).toBeLessThan(0.0101);
        else if (i.ask === "k") expect(rel(ans, i.lam / i.l)).toBeLessThan(0.0101);
        else expect(rel(ans, i.lam)).toBeLessThan(0.0101);
      } else if (i.setting === "hanging") {
        const x = (i.m * i.g * i.l) / i.lam;
        if (i.ask === "extension") expect(rel(ans * cm, x)).toBeLessThan(T3);
        else if (i.ask === "length") expect(rel(ans * cm, i.l + x)).toBeLessThan(T3);
        else if (i.ask === "modulus") expect(rel(ans, i.lam)).toBeLessThan(0.0101);
        else expect(rel(ans, i.m)).toBeLessThan(0.0101);
      } else {
        const x1 = i.D - i.l - i.l2 - m.extra![0].value;
        expect(rel((i.lam * x1) / i.l - (i.lam2 * m.extra![0].value) / i.l2, i.m * i.g)).toBeLessThan(1e-9);
        expect(rel(ans, x1)).toBeLessThan(T3);
      }
    }
  });
  it("epe: the answer is λx²/2l for the picked lengths", () => {
    for (const level of [1, 2]) for (const m of many("epe", level, 150, { epAsk: "epe,work,modulus,length", kind: "string,spring" })) {
      const i = m.inputs as { ask: string; lUnit: string; lam: number; l: number; x1: number; x2: number };
      const E = (x: number) => (i.lam * x * x) / (2 * i.l), ans = m.answer.value;
      if (i.ask === "epe") expect(rel(ans, E(i.x2))).toBeLessThan(T3);
      else if (i.ask === "work") expect(rel(ans, E(i.x2) - E(i.x1))).toBeLessThan(T3);
      else if (i.ask === "modulus") expect(rel(ans, i.lam)).toBeLessThan(0.0101);
      else expect(rel(ans * (i.lUnit === "cm" ? 0.01 : 1), i.l + i.x2)).toBeLessThan(0.0101);
    }
  });
  it("elastic: every answer closes its energy equation (the drop's root by bisection)", () => {
    for (const level of [1, 2, 3]) for (const m of many("elastic", level, 200, { elSetting: "horizontal,vertical,rough", elAsk: "speedNat,speedAt,stop,maxext,acc,maxspeed,rest" })) {
      const i = m.inputs as { setting: string; ask: string; g: number; m: number; lam: number; l: number; x: number; x2: number; F: number };
      const E = (x: number) => (i.lam * x * x) / (2 * i.l), ans = m.answer.value, mg = i.m * i.g;
      if (i.setting === "vertical") {
        const x = bisect((t) => mg * (i.l + t) - E(t), 0, 50);
        if (i.ask === "maxext") expect(rel(ans, x)).toBeLessThan(T3);
        else if (i.ask === "rest") expect(rel(ans, i.l + x)).toBeLessThan(T3);
        else if (i.ask === "acc") expect(rel(i.m * (ans + i.g), (i.lam * x) / i.l)).toBeLessThan(0.0101);
        else { const e = (mg * i.l) / i.lam; expect(rel(0.5 * i.m * ans * ans + E(e), mg * (i.l + e))).toBeLessThan(0.0101); }
      } else if (i.ask === "stop") expect(rel(i.F * (i.x + ans), E(i.x))).toBeLessThan(T3);
      else if (i.ask === "speedAt") expect(rel(0.5 * i.m * ans * ans + E(i.x2) + i.F * (i.x - i.x2), E(i.x))).toBeLessThan(0.0101);
      else {
        const v = i.setting === "rough" ? ans : m.extra![0].value;
        expect(rel(0.5 * i.m * v * v + i.F * i.x, E(i.x))).toBeLessThan(0.0101);
      }
    }
  });
});

describe("Elastic: strings, pictures, course and worksheet", () => {
  it("every KaTeX line renders and every scene validates in every display mode", () => {
    for (const sub of ["hooke", "epe", "elastic"]) for (const level of sub === "epe" ? [1, 2] : [1, 2, 3]) for (const display of ["given", "build", "hidden"]) {
      for (const m of many(sub, level, 25, { diagram: display, hkSetting: "horizontal,hanging,two,points", hkAsk: "tension,extension,length,k,modulus,mass", epAsk: "epe,work,modulus,length", elSetting: "horizontal,vertical,rough", elAsk: "speedNat,speedAt,stop,maxext,acc,maxspeed,rest" })) {
        for (const r of [...m.known, ...m.steps.flatMap((s) => s.lines), m.answer.tex]) if (r !== "" && !r.startsWith("#")) expect(() => katex.renderToString(r, { throwOnError: true }), `${sub} L${level}: ${r}`).not.toThrow();
        for (const seg of m.prompt.split("$").filter((_, k) => k % 2 === 1)) expect(() => katex.renderToString(seg, { throwOnError: true }), m.prompt).not.toThrow();
        if (m.scene) expect(validateScene(m.scene), `${sub} L${level}`).toEqual([]);
      }
    }
  });
  it("a worksheet of 30 has different questions at default options at every level", () => {
    for (const sub of ["hooke", "epe", "elastic"]) for (const level of sub === "epe" ? [1, 2] : [1, 2, 3]) {
      const seen = new Set<string>();
      for (let k = 0; k < 800 && seen.size < 30; k++) seen.add(draw(sub, level).prompt);
      expect(seen.size, `${sub} L${level}`).toBeGreaterThanOrEqual(30);
    }
  });
});

describe("Elastic: energy bars as the working picture", () => {
  it("the two columns are the same height in every setting", () => {
    const total = (c: { gpe?: number; epe?: number; ke?: number; work?: number }) => (c.gpe ?? 0) + (c.epe ?? 0) + (c.ke ?? 0) + (c.work ?? 0);
    for (const level of [1, 2, 3]) for (const m of many("elastic", level, 150, { elSetting: "horizontal,vertical,rough", elAsk: "speedNat,speedAt,stop,maxext,acc,maxspeed,rest", picture: "bars" })) {
      expect(validateScene(m.scene!)).toEqual([]);
      const bars = m.scene!.elements.find((e) => e.type === "bars") as unknown as { columns: Array<{ gpe?: number; epe?: number; ke?: number; work?: number }> };
      expect(rel(total(bars.columns[0]), total(bars.columns[1])), JSON.stringify(m.inputs)).toBeLessThan(0.0101);
    }
  });
});

describe("Elastic: a slope, two fixed points and Show That (A2)", () => {
  const sin = (d: number) => Math.sin((d * Math.PI) / 180);
  it("a drop down a smooth slope closes its energy equation, with g sin α for g", () => {
    for (const m of many("elastic", 3, 150, { elSetting: "slope", elAsk: "maxext,rest,acc,maxspeed" })) {
      const i = m.inputs as { setting: string; ask: string; g: number; m: number; lam: number; l: number; alpha: number };
      expect(i.setting).toBe("slope");
      const ge = i.g * sin(i.alpha), mg = i.m * ge, E = (x: number) => (i.lam * x * x) / (2 * i.l), ans = m.answer.value;
      const x = bisect((t) => mg * (i.l + t) - E(t), 0, 50);
      if (i.ask === "maxext") expect(rel(ans, x)).toBeLessThan(T3);
      else if (i.ask === "rest") expect(rel(ans, i.l + x)).toBeLessThan(T3);
      else if (i.ask === "acc") expect(rel(i.m * (ans + ge), (i.lam * x) / i.l)).toBeLessThan(0.0101);
      else { const e = (mg * i.l) / i.lam; expect(rel(0.5 * i.m * ans * ans + E(e), mg * (i.l + e))).toBeLessThan(0.0101); }
    }
  });
  it("two strings to two points: the answers close the horizontal and vertical equations", () => {
    for (const m of many("hooke", 3, 150, { hkSetting: "points" })) {
      const i = m.inputs as { setting: string; g: number; lam: number; l: number; x: number; l2: number; x2: number; D: number };
      expect(i.setting).toBe("points");
      const a = i.l + i.x, b = i.l2 + i.x2, D = i.D;
      const cosA = (a * a + D * D - b * b) / (2 * a * D), cosB = (b * b + D * D - a * a) / (2 * b * D);
      const TA = (i.lam * i.x) / i.l, TB = (m.answer.value * i.x2) / i.l2;
      expect(rel(TA * cosA, TB * cosB)).toBeLessThan(T3);
      expect(rel(TA * Math.sqrt(1 - cosA * cosA) + TB * Math.sqrt(1 - cosB * cosB), m.extra![0].value * i.g)).toBeLessThan(0.0101);
    }
  });
  it("Show That gives the answer in the question", () => {
    for (const m of many("elastic", 2, 60, { elSetting: "vertical", elAsk: "maxext,rest,maxspeed", elShow: "on" })) {
      expect(m.prompt).toContain("Show that");
      expect(m.prompt).toContain(sfText(m.answer.value, 3));
    }
  });
});
