// The Simplex Algorithm: the engine against a brute-force vertex search, the designed numbers against the niceness budget, and the written working (every KaTeX
// string renders, every layout, every kind).
import { describe, it, expect } from "vitest";
import katex from "katex";
import { runSpec, objectiveOf, pathStats, readTab, type SxSpec } from "../shared/decision/lpSimplex";
import { wholeAnalysis, wholeNice } from "../shared/decision/lpSimplexWhole";
import { generateSimplex, isDegenerate, nice, BUDGET, type SxKind, type SxOptions } from "../shared/decision/lpSimplexGen";
import { solveSimplex, questionBlocks } from "../shared/decision/lpSimplexSolve";
import type { DecisionProblem, SxBlock } from "../shared/decision/types";

/** the best value of the question's own objective by trying every vertex (n variables: every choice of n tight constraints from the limits and the lower bounds) */
function brute(sp: SxSpec): number {
  const n = sp.c.length;
  const lo = sp.lower ?? Array.from({ length: n }, () => 0);
  const lines: Array<{ a: number[]; b: number }> = [...sp.cons.map((k) => ({ a: k.a, b: k.b })), ...lo.map((l, j) => ({ a: Array.from({ length: n }, (_, i) => (i === j ? 1 : 0)), b: l }))];
  const ok = (x: number[]): boolean => x.every((v, j) => v >= lo[j] - 1e-9) && sp.cons.every((k) => { const l = k.a.reduce((t, v, j) => t + v * x[j], 0); return k.op === "≤" ? l <= k.b + 1e-9 : k.op === "≥" ? l >= k.b - 1e-9 : Math.abs(l - k.b) < 1e-9; });
  let best: number | null = null;
  const pick = (start: number, chosen: number[]): void => {
    if (chosen.length === n) {
      const M = chosen.map((i) => [...lines[i].a, lines[i].b]);
      for (let c = 0; c < n; c++) {
        let r = c;
        for (let i = c + 1; i < n; i++) if (Math.abs(M[i][c]) > Math.abs(M[r][c])) r = i;
        if (Math.abs(M[r][c]) < 1e-12) return;
        [M[c], M[r]] = [M[r], M[c]];
        for (let i = 0; i < n; i++) if (i !== c) { const f = M[i][c] / M[c][c]; for (let k = c; k <= n; k++) M[i][k] -= f * M[c][k]; }
      }
      const x = M.map((row, i) => row[n] / M[i][i]);
      if (!ok(x)) return;
      const v = sp.c.reduce((t, c, j) => t + c * x[j], 0);
      if (best === null || (sp.sense === "max" ? v > best : v < best)) best = v;
      return;
    }
    for (let i = start; i < lines.length; i++) pick(i + 1, [...chosen, i]);
  };
  pick(0, []);
  return best ?? NaN;
}

const OPT = (kind: SxKind, over: Partial<SxOptions> = {}): SxOptions => ({ kind, vars: [2, 3, 4], cons: [2, 3, 4], forms: ["standard", "min", "ge", "lower", "eq"], context: ["bare", "story"], whole: false, given: true, pivotGiven: false, layout: "A", ...over });

describe("the engine", () => {
  it("finds the optimum a brute-force vertex search finds, in every starting form", () => {
    for (const level of [1, 2, 3]) for (let i = 0; i < 150; i++) {
      const q = generateSimplex(level, OPT("solve"));
      const sp = q.data.spec;
      const run = runSpec(sp);
      const got = objectiveOf(run, sp);
      const want = brute(sp);
      expect(got[0] / got[1], JSON.stringify(sp)).toBeCloseTo(want, 6);
    }
  });
  it("ends on a tableau with no negative entry in the objective row and unit columns for its basic variables", () => {
    for (let i = 0; i < 100; i++) {
      const run = runSpec(generateSimplex(3, OPT("solve")).data.spec);
      expect(run.final.rows[0].every((v) => v[0] >= 0)).toBe(true);
      const r = readTab(run.final);
      expect(r.basic.length).toBe(run.final.m);
      expect(r.values.every((v) => v[0] >= 0)).toBe(true);
    }
  });
});

describe("the designed numbers", () => {
  for (const level of [1, 2, 3]) for (const kind of ["setup", "pivot", "solve", "interpret"] as SxKind[]) {
    it(`Level ${level} ${kind}: every tableau on the way is within the budget, with no ties`, () => {
      for (let i = 0; i < 60; i++) {
        const q = generateSimplex(level, OPT(kind));
        const run = runSpec(q.data.spec);
        expect(nice(run, level)).toBe(true);
        if (level === 1) expect(run.tie).toBe(false);
        const s = pathStats(run);
        expect(s.maxDen).toBeLessThanOrEqual(10);
        expect(BUDGET[level].dens.length).toBeGreaterThan(0);
      }
    });
  }
  it("Level 1 stays on two variables and standard form; the story is Levels 2 and 3 only", () => {
    for (let i = 0; i < 80; i++) {
      const d = generateSimplex(1, OPT("solve")).data;
      expect(d.spec.c.length).toBe(2);
      expect(d.startForm).toBe("standard");
      expect(d.story).toBeUndefined();
    }
  });
  it("a story problem has designed numbers once its data is simplified", () => {
    let stories = 0;
    for (let i = 0; i < 80; i++) {
      const q = generateSimplex(2, OPT("setup", { forms: ["standard"], context: ["story"], vars: [2], cons: [2] }));
      if (q.data.story) { stories++; expect(q.prompt).toMatch(/available/); expect(q.prompt).not.toMatch(/(?<![\d.])1 (litres|kgs|metres|hours|minutes|sheets|boxes)/); }
    }
    expect(stories).toBeGreaterThan(60);
  });
  it("asks for 30 different questions at each level", () => {
    for (const level of [1, 2, 3]) {
      const seen = new Set<string>();
      for (let i = 0; i < 400 && seen.size < 30; i++) seen.add(generateSimplex(level, OPT("solve", { forms: ["standard"], context: ["bare"] })).prompt);
      expect(seen.size).toBeGreaterThanOrEqual(30);
    }
  });
});

// ── the written working ──────────────────────────────────────────────────────
const bad = (t: string): boolean => { try { katex.renderToString(t, { throwOnError: true, displayMode: false }); return false; } catch { return true; } };
function texOf(b: SxBlock): string[] {
  if (b.k === "tab") return [...b.head.filter(Boolean), ...b.rows.flat(), ...(b.ops ?? []).filter(Boolean), ...(b.label ?? []).filter(Boolean), ...(b.opsHead && b.opsHead.includes("\\") ? [b.opsHead] : [])];
  return b.rows.flatMap((r) => (r.k === "tex" || r.k === "result" ? [r.t] : r.k === "gap" ? [] : (r.t.match(/\$[^$]+\$/g) ?? []).map((s) => s.slice(1, -1))));
}
const asProblem = (q: ReturnType<typeof generateSimplex>): DecisionProblem => ({ kind: q.data.kind, level: q.data.level, sx: q.data, prompt: q.prompt, answer: { text: q.answerText }, matrixMode: "off" });

describe("whole numbers: is it practical?", () => {
  const W = (level: number, o: Partial<SxOptions> = {}) => generateSimplex(level, OPT("practical", { forms: ["standard"], ...o }));
  /** the best whole-number plan by trying every point in a box that holds the feasible region */
  function bestWhole(sp: SxSpec): number {
    const n = sp.c.length;
    const box = Math.max(...sp.cons.map((k) => k.b)) + 1;
    let best = -Infinity;
    const walk = (j: number, pt: number[]): void => {
      if (j === n) { if (sp.cons.every((k) => k.a.reduce((t, v, i) => t + v * pt[i], 0) <= k.b)) best = Math.max(best, sp.c.reduce((t, v, i) => t + v * pt[i], 0)); return; }
      for (let v = 0; v <= box; v++) walk(j + 1, [...pt, v]);
    };
    walk(0, []);
    return best;
  }
  for (const level of [1, 2, 3]) {
    it(`Level ${level}: the optimum has a fraction, and the best practical plan is the true best whole-number plan and reaches the bound`, () => {
      for (let i = 0; i < 60; i++) {
        const q = W(level);
        const run = runSpec(q.data.spec);
        const w = wholeAnalysis(q.data.spec, run);
        expect(wholeNice(w, level)).toBe(true);
        expect(w.frac.length).toBeGreaterThan(0);
        expect(w.best.p).toBe(w.bound);
        if (q.data.spec.c.length <= 3) expect(w.best.p).toBe(bestWhole(q.data.spec));
        expect(q.data.whole).toBeTruthy();
      }
    });
  }
  it("Level 2 needs more than rounding down, and Level 3 has a nearest rounding that is not allowed", () => {
    for (let i = 0; i < 60; i++) {
      const a = wholeAnalysis(W(2).data.spec, runSpec(W(2).data.spec));
      void a;
      const q2 = W(2), q3 = W(3);
      const w2 = wholeAnalysis(q2.data.spec, runSpec(q2.data.spec)), w3 = wholeAnalysis(q3.data.spec, runSpec(q3.data.spec));
      expect(w2.best.pt.join()).not.toBe(w2.down.pt.join());
      expect(w3.nearest.ok).toBe(false);
    }
  });
  it("Solve asks the whole-number question of any optimum: some are practical as they stand, some are not", () => {
    let yes = 0, no = 0;
    for (let i = 0; i < 80; i++) {
      const q = generateSimplex(2, OPT("solve", { whole: true, forms: ["standard"], context: ["bare"] }));
      const w = wholeAnalysis(q.data.spec, runSpec(q.data.spec));
      if (w.frac.length) { no++; expect(q.answerText).toMatch(/best practical plan/); } else { yes++; expect(q.answerText).toMatch(/is practical/); }
    }
    expect(yes).toBeGreaterThan(10);
    expect(no).toBeGreaterThan(10);
  });
  it("ties and a θ of 0 turn up from Level 2 when degenerate cases are allowed, and the working says what to do", () => {
    let ties = 0, zeros = 0, noted = 0;
    for (let i = 0; i < 500; i++) {
      const q = generateSimplex(2, OPT("solve", { forms: ["standard"], context: ["bare"], allowDegenerate: true }));
      const run = runSpec(q.data.spec);
      if (run.tie) ties++;
      if (run.iters.some((it) => it.thetas.some((x) => x.value[0] === 0 && x.row === it.row))) zeros++;
      if (run.tie && solveSimplex(asProblem(q)).some((s) => /same entry|same θ/.test(s.caption))) noted++;
    }
    expect(ties).toBeGreaterThan(0);
    expect(zeros).toBeGreaterThan(0);
    expect(noted).toBe(ties);
  });
  it("degenerate cases are never drawn unless they are allowed", () => {
    for (const level of [2, 3]) for (let i = 0; i < 150; i++) {
      // (an equality is built through the optimum, so it is degenerate by design and is left out)
      const q = generateSimplex(level, OPT("solve", { forms: level === 3 ? ["min", "ge", "lower"] : ["standard"], context: ["bare"] }));
      expect(isDegenerate(runSpec(q.data.spec)), `level ${level}`).toBe(false);
    }
  });
  it("Solve can ask the whole-number question too, and the question says so", () => {
    for (const kind of ["solve"] as SxKind[]) {
      const q = generateSimplex(2, OPT(kind, { whole: true, forms: ["standard"] }));
      expect(q.prompt).toMatch(/practical/);
      expect(q.data.whole).toBeTruthy();
      const steps = solveSimplex(asProblem(q));
      expect(steps.map((s) => s.caption).join(" ")).toMatch(/practical solution|is practical/);
    }
  });
  it("with three or more fractional variables the working uses the room left, not every combination, and the set it finds fits", () => {
    let seen = 0;
    for (let i = 0; i < 80 && seen < 8; i++) {
      const q = generateSimplex(3, OPT("practical", { forms: ["standard"], vars: [3, 4], cons: [3, 4], context: ["bare"] }));
      const run = runSpec(q.data.spec);
      const w = wholeAnalysis(q.data.spec, run);
      if (w.frac.length < 3) continue;
      seen++;
      const steps = solveSimplex(asProblem(q));
      expect(steps.map((s) => s.caption).join(" ")).toMatch(/room is left|how much room/);
      expect(steps.some((s) => s.sxView!.blocks.some((b) => b.k === "tab" && b.rows.length > 12))).toBe(false);
      const sets = steps.flatMap((s) => s.sxView!.blocks).filter((b) => b.k === "tab" && b.head[0] === "\\text{Add 1 to}");
      expect(sets.length).toBe(1);
      const fits = sets.some((b) => b.k === "tab" && b.rows.some((r) => !r.slice(2).some((c) => c.includes("\\times"))));
      expect(fits).toBe(true);
    }
    expect(seen).toBeGreaterThan(0);
  });
  it("when the optimum is not given, the working solves with the simplex algorithm first", () => {
    for (let i = 0; i < 10; i++) {
      const q = W(2, { given: false });
      expect(q.prompt).toMatch(/Use the simplex algorithm/);
      const caps = solveSimplex(asProblem(q)).map((s) => s.caption).join(" ");
      expect(caps).toMatch(/pivot column/);
      expect(caps).toMatch(/not a practical solution/);
    }
  });
  it("the working ends on the best plan and states the upper bound", () => {
    const q = W(2);
    const steps = solveSimplex(asProblem(q));
    const w = wholeAnalysis(q.data.spec, runSpec(q.data.spec));
    expect(steps[steps.length - 1].caption).toContain(`upper bound of ${w.bound}`);
    expect(steps.map((s) => s.caption).join(" ")).toMatch(/round each fractional variable down and up|how much room is left/);
  });
});

describe("a pivot given, and the data as a table", () => {
  it("One pivot with the pivot given names it, skips the choosing, and carries out the row operations", () => {
    for (const layout of ["A", "B"] as const) for (const level of [1, 2, 3]) for (let i = 0; i < 15; i++) {
      const q = generateSimplex(level, OPT("pivot", { pivotGiven: true, layout }));
      expect(q.data.pivotGiven).toBe(true);
      expect(q.prompt).toMatch(/The pivot is the/);
      const steps = solveSimplex(asProblem(q));
      expect(steps[0].caption).toMatch(/The pivot is given/);
      expect(steps.map((s) => s.caption).join(" ")).not.toMatch(/most negative|smallest θ/);
      expect(steps.some((s) => s.sxView!.blocks.some((b) => b.k === "tab" && (b.ops ?? []).some((o) => o.includes("\\times") || o.includes("\\div") || o.includes("-") || o.includes("+"))))).toBe(true);
      for (const st of steps) for (const b of st.sxView!.blocks) for (const t of texOf(b)) expect(bad(t), t).toBe(false);
    }
  });
  it("the pivot the question names is the pivot the working uses", () => {
    for (let i = 0; i < 40; i++) {
      const q = generateSimplex(2, OPT("pivot", { pivotGiven: true, layout: "A" }));
      const run = runSpec(q.data.spec);
      const it = run.iters[q.data.at];
      const shown = it.pivot[1] === 1 ? String(it.pivot[0]) : `${it.pivot[0]}/${it.pivot[1]}`;
      expect(q.prompt).toContain(`$${shown}$`);
      expect(q.prompt).toContain(`row R${it.row + 1}`);
    }
  });
  it("a situation can be given as a table: the picture is the table, and it holds every limit, use and profit", () => {
    for (const kind of ["setup", "solve"] as SxKind[]) for (let i = 0; i < 25; i++) {
      const q = generateSimplex(2, OPT(kind, { forms: ["standard"], context: ["table"], vars: [2, 3], cons: [2, 3] }));
      expect(q.data.table).toBe(true);
      expect(q.prompt).toMatch(/The table shows/);
      const blocks = questionBlocks(asProblem(q));
      expect(blocks.length).toBe(1);
      const t = blocks[0];
      expect(t.k).toBe("tab");
      if (t.k === "tab") {
        expect(t.rows.length).toBe(q.data.spec.cons.length + 1);
        expect(t.head.length).toBe(q.data.spec.c.length + 1);
        for (const s of texOf(t)) expect(bad(s), s).toBe(false);
        expect(t.rows[t.rows.length - 1].slice(0, -1)).toEqual(q.data.spec.c.map(String));
      }
    }
  });
});

describe("the written working", () => {
  for (const layout of ["A", "B"] as const) for (const kind of ["setup", "reverse", "pivot", "solve", "interpret", "practical"] as SxKind[]) {
    it(`${kind}, layout ${layout}: every step has a caption, blocks that render, and the question's picture renders`, () => {
      for (const level of [1, 2, 3]) for (let i = 0; i < 25; i++) {
        const p = asProblem(generateSimplex(level, OPT(kind, { layout })));
        const steps = solveSimplex(p);
        expect(steps.length).toBeGreaterThan(0);
        for (const st of steps) {
          expect(st.caption.length).toBeGreaterThan(5);
          expect(st.sxView).toBeTruthy();
          for (const b of st.sxView!.blocks) for (const t of texOf(b)) expect(bad(t), t).toBe(false);
          expect((st.sxView!.fresh ?? 0)).toBeLessThanOrEqual(st.sxView!.blocks.length);
          for (const t of (st.caption.match(/\$[^$]+\$/g) ?? [])) expect(bad(t.slice(1, -1)), t).toBe(false);
        }
        for (const b of questionBlocks(p)) for (const t of texOf(b)) expect(bad(t), t).toBe(false);
      }
    });
  }
  it("a layout B tableau has a Basic variable column and numbered rows; layout A writes NPR", () => {
    const a = solveSimplex(asProblem(generateSimplex(2, OPT("solve", { layout: "A", forms: ["standard"] }))));
    const b = solveSimplex(asProblem(generateSimplex(2, OPT("solve", { layout: "B", forms: ["standard"] }))));
    const tabs = (s: typeof a) => s.flatMap((x) => x.sxView!.blocks).filter((x) => x.k === "tab");
    expect(tabs(a).some((t) => t.k === "tab" && (t.ops ?? []).some((o) => o.includes("NPR")))).toBe(true);
    expect(tabs(b).every((t) => t.k === "tab" && !!t.label)).toBe(true);
    expect(tabs(b).some((t) => t.k === "tab" && (t.ops ?? []).some((o) => /R\d+\s*=/.test(o.replace(/\\mathrm\{R\}/g, "R"))))).toBe(true);
  });
  it("the solve working ends by stating the optimum the engine found", () => {
    for (let i = 0; i < 30; i++) {
      const q = generateSimplex(1, OPT("solve", { forms: ["standard"], context: ["bare"] }));
      const steps = solveSimplex(asProblem(q));
      const last = steps[steps.length - 1].sxView!.blocks.flatMap(texOf).join(" ");
      const o = objectiveOf(runSpec(q.data.spec), q.data.spec);
      expect(last).toContain(`P = ${o[1] === 1 ? o[0] : ""}`);
    }
  });
});

describe("audit changes: minimise, equality, size", () => {
  it("a minimise problem has a mixed-sign cost (some variables earn, some cost), not just a negated maximise", () => {
    for (const level of [3]) for (let i = 0; i < 60; i++) {
      const q = generateSimplex(level, OPT("solve", { forms: ["min"], context: ["bare"] }));
      expect(q.data.spec.sense).toBe("min");
      expect(q.data.spec.c.some((v) => v > 0)).toBe(true);
      expect(q.data.spec.c.some((v) => v < 0)).toBe(true);
      const sp = q.data.spec;
      expect(objectiveOf(runSpec(sp), sp)[0] / objectiveOf(runSpec(sp), sp)[1]).toBeCloseTo(brute(sp), 6);
    }
  });
  it("an equality constraint involves at least two of the variables", () => {
    for (let i = 0; i < 80; i++) {
      const q = generateSimplex(3, OPT("setup", { forms: ["eq"], context: ["bare"] }));
      for (const k of q.data.spec.cons) if (k.op === "=") expect(k.a.filter((v) => v !== 0).length).toBeGreaterThanOrEqual(2);
    }
  });
  it("a size is a variables-by-constraints pair, kept within the level", () => {
    for (let i = 0; i < 60; i++) {
      const q1 = generateSimplex(1, OPT("solve", { sizes: [[2, 2], [4, 4]] }));
      expect(q1.data.spec.c.length).toBe(2);
      const q3 = generateSimplex(3, OPT("solve", { sizes: [[3, 3]], forms: ["standard"], context: ["bare"] }));
      expect(q3.data.spec.c.length).toBe(3);
      expect(q3.data.spec.cons.length).toBeGreaterThanOrEqual(3); // a change of form (≥, an equality) can add a row
    }
  });
  it("Read a tableau can ask for the problem the tableau shows", () => {
    const q = generateSimplex(2, OPT("reverse", {}));
    expect(q.prompt).toMatch(/Write down the linear programming problem/);
    expect(solveSimplex(asProblem(q)).length).toBeGreaterThan(2);
  });
});

describe("an equality and a lower bound handled as rows", () => {
  it("an equation is a row with no slack variable: the first pivot is in that row, and the optimum is the same as by the pair of inequalities", () => {
    for (let i = 0; i < 60; i++) {
      const q = generateSimplex(3, OPT("solve", { forms: ["eq"], method: "rows", context: ["bare"] }));
      const sp = q.data.spec;
      expect(sp.eqAsRow).toBe(true);
      const run = runSpec(sp);
      const eqs = sp.cons.filter((k) => k.op === "=").length;
      expect(run.tabs[0].m).toBe(sp.cons.length);
      expect(run.tabs[0].ns).toBe(sp.cons.length - eqs);
      expect(run.iters[0].eqStart).toBe(true);
      const got = objectiveOf(run, sp);
      expect(got[0] / got[1]).toBeCloseTo(brute(sp), 6);
      const pair = runSpec({ ...sp, eqAsRow: false });
      const gp = objectiveOf(pair, { ...sp, eqAsRow: false });
      expect(gp[0] / gp[1]).toBeCloseTo(got[0] / got[1], 6);
      const caps = solveSimplex(asProblem(q)).map((s2) => s2.caption).join(" ");
      expect(caps).toMatch(/is an equation, so it has no slack variable/);
      for (const st of solveSimplex(asProblem(q))) for (const b of st.sxView!.blocks) for (const t of texOf(b)) expect(bad(t), t).toBe(false);
    }
  });
  it("a lower bound as a row is one more ≥ constraint: a negative right-hand side to start, the same optimum as by the substitution", () => {
    for (let i = 0; i < 60; i++) {
      const q = generateSimplex(3, OPT("solve", { forms: ["lower"], method: "rows", context: ["bare"] }));
      const sp = q.data.spec;
      expect(sp.lowerAsRow).toBe(true);
      const run = runSpec(sp);
      expect(run.iters[0].start).toBe(true);
      const got = objectiveOf(run, sp);
      expect(got[0] / got[1]).toBeCloseTo(brute(sp), 6);
      const sub = { ...sp, lowerAsRow: false };
      const gs = objectiveOf(runSpec(sub), sub);
      expect(gs[0] / gs[1]).toBeCloseTo(got[0] / got[1], 6);
      for (const st of solveSimplex(asProblem(q))) for (const b of st.sxView!.blocks) for (const t of texOf(b)) expect(bad(t), t).toBe(false);
    }
  });
});

describe("each level has its own questions", () => {
  it("Level 2 setup, solve and practical are always a situation in words or a table", () => {
    for (const kind of ["setup", "solve", "practical"] as SxKind[]) for (let i = 0; i < 25; i++) {
      const q = generateSimplex(2, OPT(kind, { context: ["bare", "story", "table"], forms: ["standard"] }));
      expect(q.data.story).toBeTruthy();
    }
  });
  it("Level 2 pivot is part-way through the run, and Level 2 read a tableau is optimal or not yet optimal; Level 1 is the first pivot and the optimal tableau", () => {
    for (let i = 0; i < 40; i++) {
      const p2 = generateSimplex(2, OPT("pivot"));
      expect(p2.data.at).toBeGreaterThanOrEqual(1);
      const i2 = generateSimplex(2, OPT("interpret"));
      const r2 = runSpec(i2.data.spec);
      expect(i2.data.at).toBeGreaterThanOrEqual(1); // Level 2 may be optimal or not yet optimal
      expect(i2.data.at).toBeLessThanOrEqual(r2.tabs.length - 1);
      expect(generateSimplex(1, OPT("pivot")).data.at).toBe(0);
      const i1 = generateSimplex(1, OPT("interpret"));
      expect(i1.data.at).toBe(runSpec(i1.data.spec).tabs.length - 1);
    }
  });
});

describe("maths in the working is typeset", () => {
  it("a slack variable (s_1) is never written as plain text in a caption, a sentence or a note: it is always between dollar signs", () => {
    const outside = (t: string): string => t.replace(/\$[^$]*\$/g, "");
    for (const kind of ["setup", "reverse", "pivot", "solve", "interpret", "practical"] as SxKind[]) for (const level of [1, 2, 3]) for (let i = 0; i < 10; i++) {
      const p = asProblem(generateSimplex(level, OPT(kind, { pivotGiven: i % 2 === 0, method: i % 3 === 0 ? "rows" : "substitute" })));
      for (const st of solveSimplex(p)) {
        expect(outside(st.caption), st.caption).not.toMatch(/\bs_|\bs\d/);
        for (const b of st.sxView!.blocks) if (b.k === "rows") for (const r of b.rows) if (r.k === "words" || r.k === "note" || r.k === "head") expect(outside(r.t), r.t).not.toMatch(/\bs_|\bs\d/);
      }
      expect(outside(p.prompt), p.prompt).not.toMatch(/\bs_|\bs\d/);
    }
  });
});
