// The Solve sub-tool of Graphical LP (lpGraphSolveGen.ts, solveOptimise in lpGraphSolve.ts): every level's rules, the answer re-derived by a fine-grid scan of the whole region,
// the sliding-line values, the display-only Method switch and the working. Seeded draws, so no chance failures.
import { describe, it, expect } from "vitest";
import katex from "katex";
import { generateSolve, objTex } from "../shared/decision/lpGraphSolveGen";
import { FALLBACK, usable } from "../shared/decision/lpGraphGen";
import { solveOptimise } from "../shared/decision/lpGraphSolve";
import { inRegion, notParallelToAnEdge, regionVertices, toNum } from "../shared/decision/lpGraph";
import { fr } from "../shared/decision/dim";
import type { DecisionProblem } from "../shared/decision/types";
import { withSeededRandom } from "./seededRandom";

const gen = (level: number, start = "bare,story,diagram", methods = "line", shading = "out") =>
  generateSolve(level, { start: start.split(","), shading: shading.split(","), methods: methods.split(",") });
const SEEDS = Array.from({ length: 100 }, (_, i) => 500 + i * 6151);
const draws = (level: number, start?: string, methods?: string) => SEEDS.map((s) => withSeededRandom(s, () => gen(level, start, methods)));
const problem = (q: ReturnType<typeof gen>): DecisionProblem => ({ kind: "solve", level: q.data.level, gx: q.data, prompt: q.prompt, answer: { text: q.answerText } });
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));

describe("the objective at every level", () => {
  it("Level 1 maximises with positive coefficients, Level 2 maximises with one negative, Level 3 minimises a cost (no higher level draws a lower question)", () => {
    for (const q of draws(1)) { const o = q.data.obj!; expect(o.sense).toBe("max"); expect(o.p).toBeGreaterThan(0); expect(o.q).toBeGreaterThan(0); }
    for (const q of draws(2)) { const o = q.data.obj!; expect(o.sense).toBe("max"); expect(o.p * o.q).toBeLessThan(0); }
    for (const q of draws(3)) { const o = q.data.obj!; expect(o.sense).toBe("min"); expect(o.p).toBeGreaterThan(0); expect(o.q).toBeGreaterThan(0); }
  });
  for (const level of [1, 2, 3]) {
    it(`Level ${level}: the region is the level's, the best corner is single, not the origin, not on a strict line, and not parallel to an edge`, () => {
      for (const q of draws(level)) {
        const d = q.data;
        expect(usable(d.lines, level)).toBe(true);
        expect(notParallelToAnEdge(d.lines, d.obj!)).toBe(true);
        expect(d.value![0]).not.toBe(0);
        const x = toNum(d.best![0]), y = toNum(d.best![1]);
        for (const l of d.lines) if (l.op === "<" || l.op === ">") expect(l.a * x + l.b * y).not.toBe(l.c);
        const vals = regionVertices(d.lines).map((v) => d.obj!.p * toNum(v[0]) + d.obj!.q * toNum(v[1]));
        const bestVal = d.obj!.sense === "max" ? Math.max(...vals) : Math.min(...vals);
        expect(vals.filter((v) => Math.abs(v - bestVal) < 1e-9)).toHaveLength(1);
        expect(toNum(d.value!)).toBeCloseTo(bestVal, 9);
      }
    });
  }
  it("the answer equals a scan of a fine grid over the whole region (an independent route), and the best point is in the region", () => {
    for (const level of [1, 2, 3]) for (const q of draws(level).slice(0, 40)) {
      const d = q.data, o = d.obj!;
      expect(inRegion(d.lines, d.best!)).toBe(true);
      let top = o.sense === "max" ? -Infinity : Infinity;
      for (let i = 0; i <= d.win.xMax * 8; i++) for (let j = 0; j <= d.win.yMax * 8; j++) {
        const pt = [fr(i, 8), fr(j, 8)] as const;
        if (!inRegion(d.lines, pt)) continue;
        const v = o.p * (i / 8) + o.q * (j / 8);
        top = o.sense === "max" ? Math.max(top, v) : Math.min(top, v);
      }
      const gap = (Math.abs(o.p) + Math.abs(o.q)) / 8 + 1e-9;
      if (o.sense === "max") { expect(top).toBeLessThanOrEqual(toNum(d.value!) + 1e-9); expect(toNum(d.value!) - top).toBeLessThanOrEqual(gap); } else { expect(top).toBeGreaterThanOrEqual(toNum(d.value!) - 1e-9); expect(top - toNum(d.value!)).toBeLessThanOrEqual(gap); }
    }
  });
  it("a single-variable optimum (a corner on an axis) is the exception, not the rule", () => {
    for (const level of [1, 2, 3]) {
      const qs = draws(level);
      const onAxis = qs.filter((q) => q.data.best![0][0] === 0 || q.data.best![1][0] === 0).length;
      expect(onAxis / qs.length).toBeLessThan(0.3);
    }
  });
  it("a fixed fall-back question is almost never needed", () => {
    for (const level of [1, 2, 3]) {
      const used = SEEDS.map((sd) => withSeededRandom(sd, () => gen(level, "bare")).data.lines).filter((ls) => JSON.stringify(ls) === JSON.stringify(FALLBACK[level])).length;
      expect(used).toBeLessThanOrEqual(1);
    }
  });
  it("the two first objective lines have whole intercepts (the values are multiples of lcm of the coefficients) and cut the region", () => {
    for (const level of [1, 2, 3]) for (const q of draws(level)) {
      const d = q.data, o = d.obj!;
      const L = (Math.abs(o.p) * Math.abs(o.q)) / gcd(o.p, o.q);
      const [k1, k2] = d.ks!;
      expect(k1[1]).toBe(1); expect(k2[1]).toBe(1);
      expect(Math.abs(k1[0] % L)).toBe(0); expect(k2[0] - k1[0]).toBe(L);
      const vals = regionVertices(d.lines).map((v) => o.p * toNum(v[0]) + o.q * toNum(v[1]));
      expect(k1[0]).toBeGreaterThan(Math.min(...vals)); expect(k1[0]).toBeLessThan(Math.max(...vals));
    }
  });
});

describe("the question", () => {
  it("Inequalities: 'Maximise/Minimise … subject to …' with every constraint and the axes", () => {
    for (const level of [1, 2, 3]) for (const q of draws(level, "bare")) {
      expect(q.data.start).toBe("inequalities");
      expect(q.prompt).toMatch(/^(Maximise|Minimise) \$[PC]=[^$]+\$ subject to /);
      expect(q.prompt).toContain("$x \\ge 0$");
      expect(q.prompt).toContain(`$${objTex(q.data.obj!)}$`);
    }
  });
  it("A Situation (Levels 1 and 3): the profit or cost sentence is there; Level 2 is never a situation, even if ticked", () => {
    for (const q of draws(1, "story")) { expect(q.data.start).toBe("situation"); expect(q.prompt).toMatch(/a profit of £/); }
    for (const q of draws(3, "story")) { expect(q.data.start).toBe("situation"); expect(q.prompt).toMatch(/costs £/); }
    for (const q of draws(2, "story")) expect(q.data.start).toBe("inequalities");
  });
  it("Diagram Given: the prompt points at the region shown and does not list the constraints", () => {
    for (const level of [1, 2, 3]) for (const q of draws(level, "diagram")) {
      expect(q.data.start).toBe("diagram");
      expect(q.prompt).toMatch(/over the feasible region .*shown/);
      expect(q.prompt).not.toContain("subject to");
    }
  });
  it("Method and Shading are display only: the same seed gives the same question, whatever is ticked", () => {
    for (const s of SEEDS.slice(0, 40)) for (const level of [1, 2, 3]) {
      const a = withSeededRandom(s, () => gen(level, undefined, "line", "out")), b = withSeededRandom(s, () => gen(level, undefined, "line,table", "in"));
      expect(a.prompt).toBe(b.prompt);
      expect(a.data.lines).toEqual(b.data.lines);
      expect(a.data.obj).toEqual(b.data.obj);
      expect(a.data.methods).toEqual(["line"]); expect(b.data.methods).toEqual(["line", "table"]);
    }
  });
  it("replays exactly from a seed, and a 30-question worksheet has 30 different questions at every level", () => {
    for (const s of SEEDS.slice(0, 30)) for (const level of [1, 2, 3]) expect(JSON.stringify(withSeededRandom(s, () => gen(level)))).toBe(JSON.stringify(withSeededRandom(s, () => gen(level))));
    for (const level of [1, 2, 3]) expect(new Set(withSeededRandom(31, () => Array.from({ length: 30 }, () => gen(level, "bare").prompt))).size).toBe(30);
  });
});

describe("the working", () => {
  it("Sliding Line: two parallel lines, the arrow, then the line through the best corner, which is ringed; the last step states the answer", () => {
    for (const level of [1, 2, 3]) for (const q of draws(level, undefined, "line").slice(0, 30)) {
      const steps = solveOptimise(problem(q));
      const views = steps.map((s) => s.gxView!);
      const withLines = views.filter((v) => v.objective);
      // the lines appear once and stay: two first, then the line through the best corner as well, with the arrow and the ring
      expect(withLines[0].objective!.ks).toHaveLength(2);
      expect(withLines[0].objective!.arrow).toBe(false);
      const slid = withLines.find((v) => v.objective!.ks.length === 3)!;
      expect(slid.objective!.arrow).toBe(true);
      expect(slid.mark).toBe(true);
      expect(views[views.length - 1].objective!.ks).toHaveLength(3);
      expect(views[views.length - 1].mark).toBe(true);
      expect(steps.some((s) => s.gxView!.rows.some((r) => r.t.includes("\\begin{array}")))).toBe(false);
    }
  });
  it("Vertex Table: one row for every vertex, the best marked; both ticked gives the line first and then the table", () => {
    for (const level of [1, 2, 3]) for (const q of draws(level, undefined, "table").slice(0, 30)) {
      const steps = solveOptimise(problem(q));
      expect(steps.some((s) => s.gxView!.objective)).toBe(false);
      const table = steps.flatMap((s) => s.gxView!.rows).find((r) => r.t.includes("\\begin{array}"))!;
      expect(table.t.split("\\\\ \\hline").length - 1).toBe(q.data.vertices.length + 1);
    }
    const both = withSeededRandom(5, () => gen(1, "bare", "line,table"));
    const steps = solveOptimise(problem(both));
    const firstLine = steps.findIndex((s) => s.gxView!.objective), firstTable = steps.findIndex((s) => s.gxView!.rows.some((r) => r.t.includes("\\begin{array}")));
    expect(firstLine).toBeGreaterThan(-1); expect(firstTable).toBeGreaterThan(firstLine);
  });
  it("Diagram Given starts at the corners with the region drawn; the others draw it first", () => {
    for (const q of draws(1, "diagram").slice(0, 20)) { const v = solveOptimise(problem(q))[0].gxView!; expect(v.drawn).toBe(q.data.lines.length); expect(v.region).toBe(true); expect(v.vertices).toBe(1); }
    for (const q of draws(1, "bare").slice(0, 20)) expect(solveOptimise(problem(q))[0].gxView!.drawn).toBe(1);
  });
  it("every TeX row and every $…$ in a caption or the prompt renders in KaTeX", () => {
    for (const level of [1, 2, 3]) for (const q of draws(level, undefined, "line,table").slice(0, 30)) {
      for (const st of solveOptimise(problem(q))) {
        const texts = [...st.caption.matchAll(/\$([^$]+)\$/g)].map((m) => m[1]);
        for (const r of st.gxView!.rows) { if (r.k === "tex" || r.k === "result") texts.push(r.t); else texts.push(...[...r.t.matchAll(/\$([^$]+)\$/g)].map((m) => m[1])); }
        for (const t of texts) expect(() => katex.renderToString(t, { throwOnError: true })).not.toThrow();
      }
      for (const m of [...q.prompt.matchAll(/\$([^$]+)\$/g)]) expect(() => katex.renderToString(m[1], { throwOnError: true })).not.toThrow();
    }
  });
});
