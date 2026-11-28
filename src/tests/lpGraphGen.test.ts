// The Draw-the-region sub-tool of Graphical LP (lpGraphGen.ts, lpGraphSolve.ts): every level's rules and the working, checked from outside, over seeded draws
// (so no chance failures). The vertices are rechecked against the grapher's own clipped polygon, and each corner against the two lines the working says meet there.
import { describe, it, expect } from "vitest";
import katex from "katex";
import { computeFeasibleRegion } from "../shared/grapher/mathEngine";
import { generateRegion, usable, texLine, type GxData } from "../shared/decision/lpGraphGen";
import { solveRegion } from "../shared/decision/lpGraphSolve";
import { countsOk, isEnclosed, toNum } from "../shared/decision/lpGraph";
import type { DecisionProblem } from "../shared/decision/types";
import { withSeededRandom } from "./seededRandom";

const gen = (level: number, start = "bare,story", shading = "out,in") => generateRegion(level, { start: start.split(","), shading: shading.split(",") });
const SEEDS = Array.from({ length: 120 }, (_, i) => 1000 + i * 7919);
const draws = (level: number, start?: string) => SEEDS.map((s) => withSeededRandom(s, () => gen(level, start)));
const styles = (d: GxData) => d.styles;

describe("every level's rules", () => {
  for (const level of [1, 2, 3]) {
    it(`Level ${level}: usable, counts, active lines, small corners, a region to draw`, () => {
      for (const q of draws(level)) {
        const d = q.data;
        expect(usable(d.lines, level)).toBe(true);
        expect(countsOk(d.lines)).toBe(true);
        expect(d.lines.length).toBeLessThanOrEqual(5);
        for (const v of d.vertices) { expect(v[0][1]).toBeLessThanOrEqual(6); expect(v[1][1]).toBeLessThanOrEqual(6); }
        // a limit is never smaller than one of its own coefficients
        for (const l of d.lines) if (l.c !== 0 && l.a !== 0 && l.b !== 0) expect(l.c).toBeGreaterThanOrEqual(Math.max(l.a, l.b));
        // the window holds every corner
        for (const v of d.vertices) { expect(toNum(v[0])).toBeLessThanOrEqual(d.win.xMax); expect(toNum(v[1])).toBeLessThanOrEqual(d.win.yMax); }
        expect(d.enclosed).toBe(isEnclosed(d.lines));
      }
    });
  }
  it("Level 1 is only sloped ≤ lines; Level 2 has a bound and nothing harder; Level 3 has a ≥ line or a line through the origin (no higher level draws a lower question)", () => {
    for (const q of draws(1)) expect(styles(q.data).every((s) => s === "slope")).toBe(true);
    for (const q of draws(2)) { const s = styles(q.data); expect(s.some((x) => x === "vbound" || x === "hbound")).toBe(true); expect(s.some((x) => x === "supply" || x === "relation")).toBe(false); }
    for (const q of draws(3)) expect(styles(q.data).some((x) => x === "supply" || x === "relation")).toBe(true);
  });
  it("the corners are the grapher's own clipped polygon (enclosed regions)", () => {
    for (const level of [1, 2, 3]) for (const q of draws(level)) {
      if (!q.data.enclosed) continue;
      const poly = computeFeasibleRegion([{ a: 1, b: 0, c: 0, op: ">=" }, { a: 0, b: 1, c: 0, op: ">=" }, ...q.data.lines.map((l) => ({ a: l.a, b: l.b, c: l.c, op: l.op === "≥" || l.op === ">" ? ">=" : "<=" }) as const)]);
      const key = (x: number, y: number) => `${(Math.abs(x) < 1e-9 ? 0 : x).toFixed(5)},${(Math.abs(y) < 1e-9 ? 0 : y).toFixed(5)}`;
      expect(q.data.vertices.map((v) => key(toNum(v[0]), toNum(v[1]))).sort()).toEqual(poly.map((p) => key(p.x, p.y)).sort());
    }
  });
  it("every corner satisfies every constraint (a strict one counts as its closure), written independently with plain numbers", () => {
    for (const level of [1, 2, 3]) for (const q of draws(level)) for (const v of q.data.vertices) {
      const x = toNum(v[0]), y = toNum(v[1]);
      expect(x).toBeGreaterThanOrEqual(-1e-9); expect(y).toBeGreaterThanOrEqual(-1e-9);
      for (const l of q.data.lines) {
        const s = l.a * x + l.b * y;
        if (l.op === "≤" || l.op === "<") expect(s).toBeLessThanOrEqual(l.c + 1e-9); else expect(s).toBeGreaterThanOrEqual(l.c - 1e-9);
      }
    }
  });
  it("Level 3 can be open (no R) and Levels 1 and 2 never are", () => {
    expect(draws(1).every((q) => q.data.enclosed)).toBe(true);
    expect(draws(2).every((q) => q.data.enclosed)).toBe(true);
    expect(draws(3).some((q) => !q.data.enclosed)).toBe(true);
    expect(draws(3).some((q) => q.data.enclosed)).toBe(true);
  });
});

describe("the question", () => {
  it("Inequalities: every constraint is in the prompt as TeX, with the axes, and R is asked for only if the region is enclosed", () => {
    for (const level of [1, 2, 3]) for (const q of draws(level, "bare")) {
      expect(q.data.start).toBe("inequalities");
      for (const l of q.data.lines) expect(q.prompt).toContain(`$${texLine(l)}$`);
      expect(q.prompt).toContain("$x \\ge 0$");
      expect(q.prompt.includes("$R$")).toBe(q.data.enclosed);
    }
  });
  it("A Situation: one sentence per line, and the variables are defined", () => {
    for (const level of [1, 2, 3]) for (const q of draws(level, "story")) {
      expect(q.data.start).toBe("situation");
      expect(q.data.sentences).toHaveLength(q.data.lines.length);
      for (const s of q.data.sentences ?? []) expect(q.prompt).toContain(s);
      expect(q.prompt).toMatch(/Let \$x\$ be the number of/);
    }
  });
  it("a strict bound reads 'more than' or 'fewer than' in a situation, and the line is strict", () => {
    const strict = draws(2, "story").filter((q) => q.data.lines.some((l) => l.op === "<" || l.op === ">"));
    expect(strict.length).toBeGreaterThan(5);
    for (const q of strict) expect(q.data.sentences!.some((s) => /^(More than|Fewer than)/.test(s))).toBe(true);
  });
  it("Shading is display only: the same seed gives the same question whichever side is shaded", () => {
    for (const s of SEEDS.slice(0, 40)) {
      const a = withSeededRandom(s, () => gen(2, "bare,story", "out")), b = withSeededRandom(s, () => gen(2, "bare,story", "in"));
      expect(a.prompt).toBe(b.prompt);
      expect(a.data.lines).toEqual(b.data.lines);
      expect(a.data.shading).toBe("out"); expect(b.data.shading).toBe("in");
    }
  });
  it("replays exactly from a seed", () => {
    for (const s of SEEDS.slice(0, 40)) for (const level of [1, 2, 3]) expect(JSON.stringify(withSeededRandom(s, () => gen(level)))).toBe(JSON.stringify(withSeededRandom(s, () => gen(level))));
  });
  it("a 30-question worksheet has 30 different questions at every level", () => {
    for (const level of [1, 2, 3]) {
      const qs = withSeededRandom(77, () => Array.from({ length: 30 }, () => gen(level, "bare").prompt));
      expect(new Set(qs).size).toBe(30);
    }
  });
});

const problem = (q: ReturnType<typeof gen>): DecisionProblem => ({ kind: "region", level: q.data.level, gx: q.data, prompt: q.prompt, answer: { text: q.answerText } });
describe("the working", () => {
  it("builds the graph a line at a time: lines drawn, then shaded, then R, then each corner", () => {
    for (const level of [1, 2, 3]) for (const q of draws(level).slice(0, 40)) {
      const steps = solveRegion(problem(q));
      const n = q.data.lines.length, v = q.data.vertices.length;
      expect(steps).toHaveLength((q.data.start === "situation" ? 1 : 0) + 2 * n + 1 + v + 1);
      const views = steps.map((s) => s.gxView!);
      expect(views.every(Boolean)).toBe(true);
      expect(views[views.length - 1].drawn).toBe(n);
      expect(views[views.length - 1].shaded).toBe(n);
      expect(views[views.length - 1].vertices).toBe(v);
      expect(views[views.length - 1].region).toBe(true);
      for (let i = 1; i < views.length; i++) { expect(views[i].drawn).toBeGreaterThanOrEqual(views[i - 1].drawn); expect(views[i].rows.length).toBe(views[i - 1].rows.length + views[i].fresh); }
    }
  });
  it("each corner is where two non-parallel lines meet", () => {
    for (const level of [1, 2, 3]) for (const q of draws(level).slice(0, 40)) {
      const d = q.data;
      for (const vt of d.vertices) {
        const x = toNum(vt[0]), y = toNum(vt[1]);
        const meeting = [...d.lines, { a: 1, b: 0, c: 0 }, { a: 0, b: 1, c: 0 }].filter((l) => Math.abs(l.a * x + l.b * y - l.c) < 1e-9);
        expect(meeting.length).toBeGreaterThanOrEqual(2);
        expect(meeting.some((l1) => meeting.some((l2) => l1.a * l2.b - l1.b * l2.a !== 0))).toBe(true);
      }
    }
  });
  it("every TeX row and every $…$ in a caption or the prompt renders in KaTeX", () => {
    for (const level of [1, 2, 3]) for (const q of draws(level).slice(0, 40)) {
      for (const st of solveRegion(problem(q))) {
        const texts = [...st.caption.matchAll(/\$([^$]+)\$/g)].map((m) => m[1]);
        for (const r of st.gxView!.rows) { if (r.k === "tex" || r.k === "result") texts.push(r.t); else texts.push(...[...r.t.matchAll(/\$([^$]+)\$/g)].map((m) => m[1])); }
        for (const t of texts) expect(() => katex.renderToString(t, { throwOnError: true })).not.toThrow();
      }
      for (const m of [...q.prompt.matchAll(/\$([^$]+)\$/g)]) expect(() => katex.renderToString(m[1], { throwOnError: true })).not.toThrow();
    }
  });
});
