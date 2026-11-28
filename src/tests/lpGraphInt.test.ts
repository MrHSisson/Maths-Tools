// Integer solutions of Graphical LP (generateSolve with `integer`, and the integer steps of solveOptimise): the best whole point is found by plain integer loops (an independent route),
// it is always one of the four around the optimum, Level 1's nearest whole point is the best and Level 2's is not (the trap), and the display-only switches replay the same question.
import { describe, it, expect } from "vitest";
import katex from "katex";
import { generateSolve } from "../shared/decision/lpGraphSolveGen";
import { solveOptimise } from "../shared/decision/lpGraphSolve";
import { toNum } from "../shared/decision/lpGraph";
import type { GLine } from "../shared/decision/lpGraph";
import type { DecisionProblem } from "../shared/decision/types";
import { withSeededRandom } from "./seededRandom";

const gen = (level: number, start = "bare,story,diagram", im = "grid", shading = "out") =>
  generateSolve(level, { start: start.split(","), shading: shading.split(","), methods: ["line"] }, { imethods: im.split(",") });
const SEEDS = Array.from({ length: 80 }, (_, i) => 900 + i * 4421);
const draws = (level: number, start?: string, im?: string) => SEEDS.map((s) => withSeededRandom(s, () => gen(level, start, im)));
const problem = (q: ReturnType<typeof gen>): DecisionProblem => ({ kind: "integer", level: q.data.level, gx: q.data, prompt: q.prompt, answer: { text: q.answerText } });
const ok = (l: GLine, x: number, y: number): boolean => { const v = l.a * x + l.b * y; return l.op === "≤" ? v <= l.c : l.op === "<" ? v < l.c : l.op === "≥" ? v >= l.c : v > l.c; };

/** every whole point in the region by plain loops, and the best by the objective (written without the lpGraph helpers) */
function bruteBest(lines: readonly GLine[], p: number, q: number, xMax: number, yMax: number): { value: number; at: Array<[number, number]> } {
  let value = -Infinity, at: Array<[number, number]> = [];
  for (let x = 0; x <= xMax; x++) for (let y = 0; y <= yMax; y++) {
    if (!lines.every((l) => ok(l, x, y))) continue;
    const v = p * x + q * y;
    if (v > value) { value = v; at = [[x, y]]; } else if (v === value) at.push([x, y]);
  }
  return { value, at };
}

describe("the integer optimum", () => {
  for (const level of [1, 2]) {
    it(`Level ${level}: the optimum is not whole in either coordinate, and the best whole point matches a plain search`, () => {
      for (const q of draws(level)) {
        const d = q.data, o = d.obj!;
        expect(d.kind).toBe("integer");
        expect(d.best![0][1]).toBeGreaterThan(1); expect(d.best![1][1]).toBeGreaterThan(1);
        const bb = bruteBest(d.lines, o.p, o.q, d.win.xMax, d.win.yMax);
        expect(bb.at).toHaveLength(1);
        expect([toNum(d.integer!.best[0]), toNum(d.integer!.best[1])]).toEqual(bb.at[0]);
        expect(toNum(d.integer!.value)).toBe(bb.value);
        expect(toNum(d.integer!.value)).toBeLessThan(toNum(d.value!));
      }
    });
    it(`Level ${level}: the best whole point is one of the four around the optimum`, () => {
      for (const q of draws(level)) {
        const d = q.data, bx = toNum(d.best![0]), by = toNum(d.best![1]);
        const wx = toNum(d.integer!.best[0]), wy = toNum(d.integer!.best[1]);
        expect([Math.floor(bx), Math.ceil(bx)]).toContain(wx);
        expect([Math.floor(by), Math.ceil(by)]).toContain(wy);
      }
    });
  }
  it("Level 1: rounding to the nearest whole point gives the best; Level 2: it does not (infeasible, or feasible but worse)", () => {
    const near = (v: readonly [number, number]) => Math.floor((2 * v[0] + v[1]) / (2 * v[1]));
    for (const q of draws(1)) { const d = q.data; expect(d.integer!.trap).toBe(false); expect([near(d.best![0]), near(d.best![1])]).toEqual([toNum(d.integer!.best[0]), toNum(d.integer!.best[1])]); }
    for (const q of draws(2)) {
      const d = q.data;
      expect(d.integer!.trap).toBe(true);
      expect([near(d.best![0]), near(d.best![1])]).not.toEqual([toNum(d.integer!.best[0]), toNum(d.integer!.best[1])]);
    }
  });
  it("a fixed fall-back question is almost never needed", () => {
    for (const level of [1, 2]) {
      const used = draws(level, "bare").filter((q) => q.data.lines.length === 2 && q.data.lines[0].a === 5 && q.data.lines[0].b === 6 && q.data.lines[0].c === 50).length;
      expect(used).toBeLessThanOrEqual(1);
    }
  });
  it("the region has few enough whole points to show (150 at most), and the question says the items are whole", () => {
    for (const level of [1, 2]) for (const q of draws(level)) {
      expect(q.prompt).toMatch(/integers|whole numbers/);
      expect(q.prompt).toMatch(/greatest value/);
    }
  });
  it("Integer Method and Shading are display only: the same seed gives the same question", () => {
    for (const s of SEEDS.slice(0, 30)) for (const level of [1, 2]) {
      const a = withSeededRandom(s, () => gen(level, undefined, "grid", "out")), b = withSeededRandom(s, () => gen(level, undefined, "grid,table", "in"));
      expect(a.prompt).toBe(b.prompt); expect(a.data.lines).toEqual(b.data.lines); expect(a.data.obj).toEqual(b.data.obj);
      expect(a.data.imethods).toEqual(["grid"]); expect(b.data.imethods).toEqual(["grid", "table"]);
    }
  });
  it("replays exactly from a seed, and a 30-question worksheet has 30 different questions at each level", () => {
    for (const s of SEEDS.slice(0, 20)) for (const level of [1, 2]) expect(JSON.stringify(withSeededRandom(s, () => gen(level)))).toBe(JSON.stringify(withSeededRandom(s, () => gen(level))));
    // the shell redraws a repeat (recentQuestions), so the generator need not give 30 distinct draws every time; it does give nearly all
    for (const level of [1, 2]) expect(new Set(withSeededRandom(41, () => Array.from({ length: 30 }, () => gen(level, "bare").prompt))).size).toBeGreaterThanOrEqual(27);
  });
});

// each step's rows are the whole page so far, so the last step's are all of them
const arrays = (q: ReturnType<typeof gen>) => { const steps = solveOptimise(problem(q)); return steps[steps.length - 1].gxView!.rows.filter((r) => r.t.includes("\\begin{array}")); };
const seps = (t: string) => t.split("\\\\ \\hline").length - 1; // header, between rows and the end: rows + 1

describe("the working", () => {
  it("Lattice Grid: one row for each of the four points, 'yes' for exactly those in the region (counted by plain loops)", () => {
    for (const level of [1, 2]) for (const q of draws(level, undefined, "grid").slice(0, 40)) {
      const t = arrays(q);
      expect(t).toHaveLength(1);
      expect(seps(t[0].t)).toBe(5);
      const bx = toNum(q.data.best![0]), by = toNum(q.data.best![1]);
      const feasible = [Math.floor(bx), Math.ceil(bx)].flatMap((x) => [Math.floor(by), Math.ceil(by)].map((y) => q.data.lines.every((l) => ok(l, x, y)))).filter(Boolean).length;
      expect(t[0].t.split("\\mathrm{yes}").length - 1).toBe(feasible);
      expect(t[0].t.split("\\mathrm{no}").length - 1).toBe(4 - feasible);
    }
  });
  it("Greatest y For Each x: a row for each whole x near the optimum, each y the greatest feasible whole y (plain loops)", () => {
    for (const level of [1, 2]) for (const q of draws(level, undefined, "table").slice(0, 40)) {
      const t = arrays(q);
      expect(t).toHaveLength(1);
      const rows = [...t[0].t.matchAll(/\\hline (\d+) & (\d+) & ([^\\]+) /g)].map((m) => [Number(m[1]), Number(m[2])]);
      expect(rows.length).toBeGreaterThanOrEqual(2);
      for (const [x, y] of rows) {
        let best = -1;
        for (let yy = 0; yy <= q.data.win.yMax; yy++) if (q.data.lines.every((l) => ok(l, x, yy))) best = yy;
        expect(y).toBe(best);
      }
    }
  });
  it("both ticked: the grid first and then the table; the whole points show from the first step and the best whole point is ringed at the end, not before", () => {
    for (const level of [1, 2]) for (const q of draws(level, undefined, "grid,table").slice(0, 30)) {
      const steps = solveOptimise(problem(q));
      const views = steps.map((s) => s.gxView!);
      const first = views.findIndex((v) => v.lattice);
      expect(first).toBeGreaterThan(-1);
      expect(views[first].lattice).toEqual({ pts: true, around: false, best: false });
      expect(views.filter((v) => v.lattice?.best)).toHaveLength(1);
      expect(views[views.length - 1].lattice!.best).toBe(true);
      expect(views[views.length - 1].mark).toBe(false);
      expect(arrays(q)).toHaveLength(2);
    }
  });
  it("the trap is named at Level 2 (the nearest point is not in R, or is worse); Level 1 says the nearest is best", () => {
    for (const q of draws(2, undefined, "grid").slice(0, 30)) expect(solveOptimise(problem(q)).flatMap((s) => s.gxView!.rows).some((r) => /to the nearest whole point gives/.test(r.t))).toBe(true);
    for (const q of draws(1, undefined, "grid").slice(0, 30)) expect(solveOptimise(problem(q)).flatMap((s) => s.gxView!.rows).some((r) => /is also the best/.test(r.t))).toBe(true);
  });
  it("every TeX row and every $…$ in a caption or the prompt renders in KaTeX", () => {
    for (const level of [1, 2]) for (const q of draws(level, undefined, "grid,table").slice(0, 30)) {
      for (const st of solveOptimise(problem(q))) {
        const texts = [...st.caption.matchAll(/\$([^$]+)\$/g)].map((m) => m[1]);
        for (const r of st.gxView!.rows) { if (r.k === "tex" || r.k === "result") texts.push(r.t); else texts.push(...[...r.t.matchAll(/\$([^$]+)\$/g)].map((m) => m[1])); }
        for (const t of texts) expect(() => katex.renderToString(t, { throwOnError: true })).not.toThrow();
      }
      for (const m of [...q.prompt.matchAll(/\$([^$]+)\$/g)]) expect(() => katex.renderToString(m[1], { throwOnError: true })).not.toThrow();
    }
  });
});
