// Working Shown for Graphical LP: Full Working, Answer And Vertices, Answer Only. It is display only: the question is the same whatever is chosen, only the steps change.
import { describe, it, expect } from "vitest";
import katex from "katex";
import { generateRegion } from "../shared/decision/lpGraphGen";
import { generateSolve } from "../shared/decision/lpGraphSolveGen";
import { solveOptimise, solveRegion } from "../shared/decision/lpGraphSolve";
import type { DecisionProblem } from "../shared/decision/types";
import { withSeededRandom } from "./seededRandom";

type Show = "full" | "vertices" | "answer";
const SEEDS = Array.from({ length: 40 }, (_, i) => 300 + i * 3571);
const region = (level: number, show: Show, sd: number) => withSeededRandom(sd, () => generateRegion(level, { start: ["bare", "story"], shading: ["out"], show }));
const solve = (level: number, show: Show, sd: number) => withSeededRandom(sd, () => generateSolve(level, { start: ["bare", "story", "diagram"], shading: ["out"], methods: ["line", "table"], show }));
const integer = (level: number, show: Show, sd: number) => withSeededRandom(sd, () => generateSolve(level, { start: ["bare", "story", "diagram"], shading: ["out"], methods: ["line"], show }, { imethods: ["grid", "table"], senses: ["max", "min"] }));
const problem = (q: ReturnType<typeof region>): DecisionProblem => ({ kind: q.data.kind, level: q.data.level, gx: q.data, prompt: q.prompt, answer: { text: q.answerText } });
const stepsOf = (q: ReturnType<typeof region>) => (q.data.kind === "region" ? solveRegion(problem(q)) : solveOptimise(problem(q)));

const KINDS: Array<[string, (level: number, show: Show, sd: number) => ReturnType<typeof region>, number[]]> = [["region", region, [1, 2, 3]], ["solve", solve, [1, 2, 3]], ["integer", integer, [1, 2]]];

describe("Working Shown", () => {
  for (const [name, make, levels] of KINDS) {
    for (const level of levels) {
      it(`${name} Level ${level}: the question is the same whatever is shown; Full has the most steps, Answer And Vertices fewer, Answer Only one`, () => {
        for (const sd of SEEDS) {
          const [f, v, a] = (["full", "vertices", "answer"] as const).map((sh) => make(level, sh, sd));
          expect(v.prompt).toBe(f.prompt); expect(a.prompt).toBe(f.prompt);
          expect(JSON.stringify({ ...v.data, show: 0 })).toBe(JSON.stringify({ ...f.data, show: 0 }));
          const nf = stepsOf(f).length, nv = stepsOf(v).length, na = stepsOf(a).length;
          expect(na).toBe(1);
          expect(nv).toBeGreaterThanOrEqual(na); expect(nv).toBeLessThanOrEqual(2);
          expect(nf).toBeGreaterThan(nv);
          // Answer And Vertices of a region is the step that lists the corners (also the last); of a question that optimises it is that step and the last
          expect(nv).toBe(name === "region" ? 1 : 2);
        }
      });
    }
  }
  it("a kept step shows only the rows it adds, on the finished graph; Answer Only still ends on the answer", () => {
    for (const [name, make, levels] of KINDS) for (const level of levels) for (const sd of SEEDS.slice(0, 15)) {
      const full = stepsOf(make(level, "full", sd));
      const ans = stepsOf(make(level, "answer", sd));
      const lastFull = full[full.length - 1].gxView!;
      const v = ans[0].gxView!;
      expect(ans[0].caption).toBe(full[full.length - 1].caption);
      expect(v.rows).toEqual(lastFull.rows.slice(lastFull.rows.length - lastFull.fresh));
      expect(v.fresh).toBe(v.rows.length);
      expect(v.drawn).toBe(lastFull.drawn); expect(v.vertices).toBe(lastFull.vertices);
      expect(name).toBeTruthy();
    }
  });
  it("Answer And Vertices keeps the corner step, with its rows (the corners listed), and the answer after it", () => {
    for (const sd of SEEDS.slice(0, 15)) {
      const q = solve(1, "vertices", sd);
      const steps = solveOptimise(problem(q));
      expect(steps[0].gxView!.tag).toBe("corners");
      expect(steps[0].gxView!.rows.map((r) => r.t).join(" ")).toMatch(/The corners are/);
      expect(steps[1].gxView!.rows.some((r) => r.k === "result")).toBe(true);
    }
  });
  it("every kept step still renders in KaTeX", () => {
    for (const [, make, levels] of KINDS) for (const level of levels) for (const sh of ["vertices", "answer"] as const) for (const sd of SEEDS.slice(0, 10)) {
      for (const st of stepsOf(make(level, sh, sd))) {
        const texts = [...st.caption.matchAll(/\$([^$]+)\$/g)].map((m) => m[1]);
        for (const r of st.gxView!.rows) { if (r.k === "tex" || r.k === "result") texts.push(r.t); else texts.push(...[...r.t.matchAll(/\$([^$]+)\$/g)].map((m) => m[1])); }
        for (const t of texts) expect(() => katex.renderToString(t, { throwOnError: true })).not.toThrow();
      }
    }
  });
});
