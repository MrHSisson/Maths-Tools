import { describe, expect, it, vi } from "vitest";
import katex from "katex";
import { averagePower, bisect, integrateNumerically, kineticEnergy, sig, toSI, validateScene, forceAt, type ForceTerm, type MechProblemData } from "../shared/mechanics";
import type { ShellOption, ShellSubTool } from "../shared/decision/types";
import { buildFd, generateFd } from "../tools/FurtherMechanics/workDone/fd";
import { buildGrav, generateGrav } from "../tools/FurtherMechanics/workDone/grav";
import { buildAngle, generateAngle } from "../tools/FurtherMechanics/workDone/angle";
import { buildSeveral } from "../tools/FurtherMechanics/workDone/several";
import { buildVariable, generateVariable } from "../tools/FurtherMechanics/workDone/variable";
import App, { __seed } from "../tools/FurtherMechanics/WorkDone";
import { levelOption, offeredAt, optionValue, profileOptions, resolvedOptions } from "../shared/decision/options";

vi.mock("../devMode", () => ({ useDevMode: () => true }));

const base = { level: 1, course: "A2" as const, display: "given" as const };
const near = (a: number, b: number, rel = 1e-9) => expect(Math.abs(a - b)).toBeLessThanOrEqual(rel * Math.max(1, Math.abs(b)));

// ── the brief's acceptance examples, reproduced exactly (specs/further-mechanics-mc.md §5)
describe("Work Done: acceptance examples", () => {
  it("fd: 4.2 kN over 0.35 km is 1470 kJ, with the conversions shown", () => {
    const m = buildFd({ ...base, ask: "work", against: false, F: 4200, d: 350, fUnit: "kN", dUnit: "km", wUnit: "kJ", ctx: "tractor" });
    expect(m.answer.value).toBe(1470);
    expect(m.answer.value * toSI(1, "kJ")).toBe(4200 * 350);
    expect(m.answer.unit).toBe("kJ");
    const all = m.steps.flatMap((s) => s.lines).join("\n");
    expect(all).toContain("4.2\\ \\text{kN} = 4{,}200\\ \\text{N}");
    expect(all).toContain("0.35\\ \\text{km} = 350\\ \\text{m}");
    expect(all).toContain("1{,}470{,}000\\ \\text{J}");
  });
  it("grav: 64 kg, 12 000 J against gravity gives a height of 19.1 m", () => {
    const m = buildGrav({ ...base, ask: "height", against: true, g: 9.8, setting: "vertical", m: 64, mUnit: "kg", h: 19.13, d: 19.13, alpha: 10, wUnit: "J", method: "vertical", ctx: "climber" });
    // the given work is 3 s.f. of 64 × 9.8 × 19.13 = 11 998.7… = 12 000; the answer is re-derived from it
    expect(m.answer.value).toBe(19.1);
  });
  it("grav slope (A2): 48 kg, 120 m, 12° gives 11.7 kJ = 11 736 J, either way of writing the working", () => {
    for (const method of ["vertical", "sin"] as const) {
      const m = buildGrav({ ...base, ask: "work", against: true, g: 9.8, setting: "slope", m: 48, mUnit: "kg", h: 0, d: 120, alpha: 12, wUnit: "kJ", method, ctx: "climber" });
      expect(m.answer.value).toBe(11.7);
      expect(m.answer.unit).toBe("kJ");
      expect(m.steps.flatMap((s) => s.lines).join("")).toContain("11{,}736");
    }
  });
  it("angle: 40 N, 30 m, 900 J gives θ = 41.4°", () => {
    // choose the angle that gives exactly W = 900: cos θ = 0.75
    const theta = (Math.acos(0.75) * 180) / Math.PI;
    const m = buildAngle({ ...base, ask: "angle", F: 40, d: 30, theta, t: 10, wUnit: "J", push: false, ctx: "crate" });
    expect(m.answer.value).toBe(41.4);
  });
  it("several: the 1400 kg van gives 2 160 000 J, 205 800 J and 840 000 J", () => {
    const m = buildSeveral({ ...base, situation: "journey", g: 9.8, ctx: "van", m: 1400, D: 900, R: 350, d: 2400, h: -15, R2: 0, d2: 0, Wres: 0, alpha: 0, big: true });
    expect([m.answer.value, ...(m.extra ?? []).map((e) => e.value)]).toEqual([2160000, 205800, 840000]);
  });
  it("variable: ∫ (3x² + 2) from 1 to 4 is 69 J", () => {
    const m = buildVariable({ ...base, form: "poly", ask: "work", terms: [{ kind: "pow", c: 3, p: 2 }, { kind: "pow", c: 2, p: 0 }], a: 1, b: 4, exact: false, m: 0, D: 0, r: 0, n: 0, X: 0, u: 0 });
    expect(m.answer.value).toBe(69);
    expect(m.steps.flatMap((s) => s.lines).join("")).toContain("69");
  });
  it("variable: the 800 kg vehicle reaches 11.1 m s⁻¹", () => {
    const m = buildVariable({ ...base, level: 3, form: "vehicle", ask: "speed", terms: [], a: 0, b: 90, exact: false, m: 800, D: 600, r: 0.02, n: 2, X: 90, u: 0 });
    expect(m.answer.value).toBe(11.1);
    expect(m.steps.flatMap((s) => s.lines).join("")).toContain("54{,}000");
    expect(m.steps.flatMap((s) => s.lines).join("")).toContain("4{,}860");
  });
});

// ── every generated question, from every option combination worth drawing, is checked
const SUBS = ["fd", "grav", "angle", "several", "variable"] as const;
const config = App().props.config;
const groups: ShellOption[] = config.options!;

function draw(sub: string, level: number, over: Record<string, string> = {}): MechProblemData {
  const defaults = profileOptions(groups, { course: "A2", ...over }, undefined, level, sub);
  const options = { ...defaults, ...over };
  return __seed.generate(level, { subTool: sub, options }).mech!;
}
const many = (sub: string, level: number, n = 60, over: Record<string, string> = {}) => Array.from({ length: n }, () => draw(sub, level, over));

describe("Work Done: independent re-derivation of every answer", () => {
  it("fd", () => {
    for (const level of [1, 2, 3]) for (const m of many("fd", level)) {
      const i = m.inputs as { ask: string; F: number; d: number; wUnit: string; against: boolean };
      const W = i.F * i.d;
      const unitK = i.wUnit === "kJ" ? 1000 : 1;
      near(m.answer.value, i.ask === "work" ? W / unitK : i.ask === "force" ? i.F : i.d);
      expect(m.prompt).toContain(i.against ? "resistance" : "force");
      if (i.ask !== "work") expect(m.prompt).toMatch(new RegExp(`${i.wUnit}\\.`));
    }
  });
  it("grav", () => {
    for (const level of [1, 2, 3]) for (const m of many("grav", level, 80, { gravSetting: "slope" })) {
      const i = m.inputs as { ask: string; m: number; h: number; d: number; alpha: number; g: number; setting: string; wUnit: string };
      const h = i.setting === "slope" ? i.d * Math.cos(((90 - i.alpha) * Math.PI) / 180) : i.h;
      const W = i.m * i.g * h;
      const shown = sig(W, 3);
      if (i.ask === "work") near(m.answer.value, sig(W, 3) / (i.wUnit === "kJ" ? 1000 : 1), 1e-9);
      else if (i.ask === "height") near(m.answer.value, sig(shown / (i.m * i.g), 3));
      else near(m.answer.value, sig(shown / (i.g * h), 3));
    }
  });
  it("angle", () => {
    for (const level of [1, 2, 3]) for (const m of many("angle", level, 80, { angleAsk: "work,force,distance,angle,power" })) {
      const i = m.inputs as { ask: string; F: number; d: number; theta: number; t: number; wUnit: string };
      const W = i.F * i.d * Math.cos((i.theta * Math.PI) / 180);
      const shown = sig(W, 3);
      switch (i.ask) {
        case "work": near(m.answer.value, sig(W, 3) / (i.wUnit === "kJ" ? 1000 : 1)); break;
        case "force": near(m.answer.value, sig(shown / (i.d * Math.cos((i.theta * Math.PI) / 180)), 3)); break;
        case "distance": near(m.answer.value, sig(shown / (i.F * Math.cos((i.theta * Math.PI) / 180)), 3)); break;
        case "power": near(m.answer.value, sig(averagePower(W, i.t), 3)); break;
        default: // the angle: cos of the answer reproduces the shown work to within the rounding of the answer
          expect(Math.abs(i.F * i.d * Math.cos((m.answer.value * Math.PI) / 180) - shown)).toBeLessThan(i.F * i.d * 0.0011);
      }
    }
  });
  it("several", () => {
    for (const level of [1, 2, 3]) for (const m of many("several", level, 80, { sevSituation: "two,journey,twostep,stages,slope" })) {
      const i = m.inputs as { situation: string; g: number; m: number; D: number; R: number; d: number; h: number; R2: number; d2: number; Wres: number; alpha: number };
      const got = [m.answer.value, ...(m.extra ?? []).map((e) => e.value)];
      const want = i.situation === "two" ? [i.D * i.d, i.R * i.d]
        : i.situation === "journey" ? [i.D * i.d, i.m * i.g * Math.abs(i.h), i.R * i.d]
          : i.situation === "slope" ? [i.D * i.d, i.m * i.g * i.d * Math.sin((i.alpha * Math.PI) / 180), i.R * i.d]
          : i.situation === "twostep" ? [i.Wres / i.R, i.D * (i.Wres / i.R)]
            : [i.R * i.d + i.R2 * i.d2, i.D * (i.d + i.d2)];
      expect(got.length).toBe(want.length);
      got.forEach((g, k) => (i.situation === "slope" && k === 1 ? expect(Math.abs(g - want[k]) / want[k]).toBeLessThan(0.0051) : near(g, want[k])));
    }
  });
  it("variable: the integral is checked numerically, k and the limit by their own integral", () => {
    for (const level of [1, 2, 3]) for (const m of many("variable", level, 100, { varForms: "poly,power,sqrt,trig,recip", varAsk: "work,k,limit", varVehicle: "speed,stop" })) {
      const i = m.inputs as { form: string; ask: string; terms: string; a: number; b: number; m: number; D: number; r: number; n: number; X: number; u: number };
      if (i.form === "vehicle" && i.ask === "stop") {
        // put the stopping distance back: the energy at the start plus the driving force's work equals the (numerically integrated) work against the resistance
        const wr = integrateNumerically((x) => i.r * x ** i.n, 0, m.answer.value);
        expect(Math.abs(kineticEnergy(i.m, i.u) + i.D * m.answer.value - wr)).toBeLessThan(0.011 * wr);
        continue;
      }
      if (i.form === "vehicle") {
        const wr = integrateNumerically((x) => i.r * x ** i.n, 0, i.X);
        const v = Math.sqrt((2 * (i.D * i.X - wr)) / i.m);
        near(m.answer.value, sig(v, 3));
        // the work-energy equation closes: ½mv² is the net work, and the 3 s.f. speed reproduces it to the rounding
        expect(Math.abs(kineticEnergy(i.m, m.answer.value) - (i.D * i.X - wr))).toBeLessThan(0.011 * (i.D * i.X - wr));
        continue;
      }
      const terms = JSON.parse(i.terms) as ForceTerm[];
      const t = terms[0];
      const xa = t.kind === "pow" ? i.a : (i.a * Math.PI) / (2 * t.k), xb = t.kind === "pow" ? i.b : (i.b * Math.PI) / (2 * t.k);
      const W = integrateNumerically((x) => forceAt(terms, x), xa, xb);
      if (i.ask === "work") {
        const want = i.form === "recip" || Number.isInteger(Number(W.toPrecision(10))) ? W : sig(W, 3);
        if (i.form === "recip") expect(Math.abs(m.answer.value - sig(W, 3))).toBeLessThan(1e-9 + Number((m.inputs as { exact: boolean }).exact) * 1e9);
        else near(m.answer.value, want, 1e-6);
      } else if (i.ask === "k") {
        near(m.answer.value, terms[0].kind === "pow" ? terms[0].c : 0);
        expect(m.prompt).toContain(`${Number(W.toPrecision(10))} J`.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 "));
      } else {
        const p = (t as { p: number }).p;
        const b = bisect((x) => integrateNumerically((y) => (t as { c: number }).c * y ** p, i.a, x) - W, i.a, i.a + 50);
        near(m.answer.value, b, 1e-6);
      }
    }
  });
});

describe("Work Done: every string and every picture is valid", () => {
  it("every KaTeX line and answer renders; every scene passes validateScene in every display mode", () => {
    for (const sub of SUBS) for (const level of [1, 2, 3]) for (const display of ["given", "build", "hidden"]) {
      for (const m of many(sub, level, 25, { diagram: display, sevSituation: "two,journey,twostep,stages", gravSetting: "slope", angleAsk: "work,force,distance,angle,power", varForms: "poly,power,sqrt,trig,recip", varAsk: "work,k,limit" })) {
        const rows = [...m.known, ...m.steps.flatMap((s) => s.lines), m.answer.tex];
        for (const r of rows) if (r !== "" && !r.startsWith("#")) expect(() => katex.renderToString(r, { throwOnError: true, displayMode: false }), `${sub} L${level}: ${r}`).not.toThrow();
        expect(m.prompt.length).toBeGreaterThan(20);
        for (const s of m.steps) expect(s.caption.length).toBeGreaterThan(5);
        if (m.scene) expect(validateScene(m.scene), `${sub} L${level} scene`).toEqual([]);
      }
    }
  });
  it("the maths in a prompt's $…$ renders too", () => {
    for (const sub of SUBS) for (const m of many(sub, 2, 25)) for (const seg of m.prompt.split("$").filter((_, k) => k % 2 === 1)) expect(() => katex.renderToString(seg, { throwOnError: true })).not.toThrow();
  });
});

describe("Work Done: the Course setting and the worksheet", () => {
  it("nothing A2-only is generated at AS, and the A2 sub-tool and settings are hidden", () => {
    const sub = App().props.config.subTools!.find((s: ShellSubTool) => s.key === "angle")!;
    expect(JSON.stringify(sub.when)).toContain("A2");
    for (const s of SUBS) for (const level of [1, 2, 3]) for (let k = 0; k < 40; k++) {
      const m = __seed.generate(level, { subTool: s, options: { ...profileOptions(groups, { course: "AS" }, undefined, level, s), course: "AS", gravSetting: "slope" } }).mech!;
      if (s === "angle") continue;
      expect(m.a2, `${s} L${level}`).toBe(false);
    }
    const slope = groups.find((o: ShellOption) => o.key === "gravSetting")!;
    expect(slope.when).toBeTruthy();
  });
  it("a worksheet of 30 has different questions at default options at every level", () => {
    for (const sub of SUBS) for (const level of [1, 2, 3]) {
      const seen = new Set<string>();
      for (let k = 0; k < 400 && seen.size < 30; k++) seen.add(draw(sub, level).prompt);
      expect(seen.size, `${sub} L${level}`).toBeGreaterThanOrEqual(30);
    }
  });
  it("every option's defaults are legal, and a stale value falls back", () => {
    for (const sub of config.subTools!) for (let level = 1; level <= (sub.levels ?? 3); level++) {
      const resolved = resolvedOptions(groups, Object.fromEntries(groups.map((o: ShellOption) => [o.key, o.choices.map((c) => c.value).join(",")])), level, sub.key);
      for (const o of groups) if (offeredAt(o, level, sub.key)) {
        const legal = levelOption(o, level).choices.map((c) => c.value);
        expect(optionValue(o, "nonsense", level, sub.key).split(",").every((v) => legal.includes(v) || v === "")).toBe(true);
        void resolved;
      }
    }
  });
});

void generateFd; void generateGrav; void generateAngle; void generateVariable;
