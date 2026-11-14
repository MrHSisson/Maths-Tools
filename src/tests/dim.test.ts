// Dimensional Analysis (specs/dimensional-analysis.md): the quantity library is checked from first principles, every worked situation is re-solved
// by a solver written here (not the generator's), and every generator output is re-derived from the dimensions alone.
import { describe, it, expect } from "vitest";
import { LIBRARY, qDim, defDim, dimEq, dimStr, unitsDim, parseUnits, dimOf, FORMULAS, consistentDims, termDim, fr, fstr, type Fr, type Dim3 } from "../shared/decision/dim";
import {
  genDimsName, genDimsNameFor, genDimsExpr, genDimsConst, genConsistent, genPowers, breakFormula, distractors, SITUATIONS, situationDims, situationsAtLevel, CONST_RELATIONS, constDim, type DimQuestion,
} from "../shared/decision/dimGen";
import { solveDim, modelChains } from "../shared/decision/dimSolve";
import { generateDimExam, DIM_CHAINS, type DimChain } from "../shared/decision/dimExam";
import type { DecisionProblem } from "../shared/decision/types";
import katex from "katex";
import { symTex, frTex, dimTex, M } from "../shared/decision/dimTex";
import { examSetHtml } from "../shared/decision/printExam";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import DimCanvas from "../shared/decision/DimWorking";
import { withSeededRandom } from "./seededRandom";

// an independent exact solver: the 3×3 system by Cramer's rule on plain fractions (numerator/denominator pairs)
const N = (f: Fr): number => f[0] / f[1];
function det3(m: number[][]): number {
  return m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
}
const close = (a: number, b: number) => Math.abs(a - b) < 1e-9;
/** solve Σ dim_i[col] · x_i = target[col] for 2 or 3 unknowns: Cramer's rule on a square sub-system, then the remaining equation must hold */
function cramer(factors: Dim3[], target: Dim3): number[] | null {
  const n = factors.length;
  const A = [0, 1, 2].map((r) => factors.map((d) => N(d[r])));
  const b = [0, 1, 2].map((r) => N(target[r]));
  let x: number[] | null = null;
  if (n === 3) {
    const D = det3(A);
    if (close(D, 0)) return null;
    x = [0, 1, 2].map((c) => det3(A.map((row, r) => row.map((v, k) => (k === c ? b[r] : v)))) / D);
  } else {
    for (let r1 = 0; r1 < 3 && !x; r1++) for (let r2 = r1 + 1; r2 < 3 && !x; r2++) {
      const D = A[r1][0] * A[r2][1] - A[r1][1] * A[r2][0];
      if (close(D, 0)) continue;
      x = [(b[r1] * A[r2][1] - A[r1][1] * b[r2]) / D, (A[r1][0] * b[r2] - b[r1] * A[r2][0]) / D];
    }
    if (!x) return null;
  }
  const ok = [0, 1, 2].every((r) => close(A[r].reduce((acc, v, k) => acc + v * x![k], 0), b[r]));
  return ok ? x : null;
}

describe("the quantity library", () => {
  it("every dimension is what its definition gives (first principles)", () => {
    for (const q of LIBRARY) expect(dimStr(defDim(q.id)), q.id).toBe(dimStr(qDim(q.id)));
  });
  it("every set of units gives the quantity's dimensions", () => {
    for (const q of LIBRARY.filter((x) => x.units)) expect(dimStr(unitsDim(q.units!)), q.id).toBe(dimStr(qDim(q.id)));
  });
  it("units parse", () => { expect(parseUnits("kg m⁻³")).toEqual([["kg", 1], ["m", -3]]); });
  it("the dimensions are written as the papers write them", () => {
    expect(dimStr(dimOf(1, 2, -3))).toBe("ML²T⁻³");
    expect(dimStr(dimOf(0, 0, 0))).toBe("1");
    expect(dimStr(qDim("G"))).toBe("M⁻¹L³T⁻²");
    expect(fstr(fr(-1, 3))).toBe("−⅓");
    expect(fstr(fr(3, 2))).toBe("3⁄2");
  });
});

describe("the formulas", () => {
  it("every formula is dimensionally consistent as written", () => {
    for (const f of FORMULAS) expect(consistentDims(f).ok, f.id).toBe(true);
  });
  it("a broken formula has exactly one term with different dimensions, and never stays consistent", () => {
    withSeededRandom(7, () => {
      for (const f of FORMULAS) for (let i = 0; i < 20; i++) {
        const b = breakFormula(f);
        if (!b) continue;
        const all = [...b.formula.lhs, ...b.formula.rhs];
        const dims = all.map(termDim);
        const base = [...f.lhs, ...f.rhs].map(termDim);
        const odd = dims.map((d, k) => (dimEq(d, base[k]) ? -1 : k)).filter((k) => k >= 0);
        expect(odd).toEqual([b.at]);
      }
    });
  });
});

describe("the worked situations", () => {
  it("each has the powers its equations give, found by Cramer's rule, and a unique solution", () => {
    for (const s of SITUATIONS) {
      const d = situationDims(s);
      const x = cramer(d.factors, d.target);
      expect(x, s.id).not.toBeNull();
      s.factors.forEach(([, n, den], i) => expect(close(x![i], n / den), `${s.id} power ${i}: ${x![i]} vs ${n}/${den}`).toBe(true));
    }
  });
  it("every level has some, and the ones that show a power is zero have one", () => {
    expect(situationsAtLevel(1).length).toBeGreaterThan(0);
    expect(situationsAtLevel(2).length).toBeGreaterThan(0);
    expect(situationsAtLevel(3).length).toBeGreaterThan(0);
    expect(situationsAtLevel(2, true).length).toBeGreaterThan(0);
  });
});

describe("the constant relations", () => {
  it("each constant's dimensions make its relation consistent", () => {
    for (const r of CONST_RELATIONS) {
      const k = constDim(r);
      [0, 1, 2].forEach((c) => {
        const total = N(k[c]) * r.kexp + r.others.reduce((acc, o) => acc + N(qDim(o.q)[c]) * N(o.p), 0);
        expect(close(total, N(qDim(r.lhs)[c])), r.text).toBe(true);
      });
    }
  });
});

const check = (q: DimQuestion) => {
  expect(q.prompt.length).toBeGreaterThan(10);
  expect(q.answerText.length).toBeGreaterThan(0);
};

describe("find the dimensions", () => {
  it("a named quantity's answer is its dimensions, at both levels, from the name and from the units, written or circled", () => {
    withSeededRandom(11, () => {
      for (const level of [1, 2]) for (const units of [false, true]) for (const circle of [false, true]) for (let i = 0; i < 40; i++) {
        const q = genDimsName(level, units, circle);
        check(q);
        const row = q.data.rows[0];
        expect(q.answerText, "answer").toBe(M(`${row.sym} = ${dimTex(row.dim)}`));
        // the factors give the same dimensions (units are the exception: their rows are the units' own dimensions, also summed)
        const t = [0, 0, 0];
        for (const r of q.data.rows.slice(1)) r.dim.forEach((e, k) => { t[k] += N(e) * N(r.exp!); });
        t.forEach((v, k) => expect(close(v, N(row.dim[k])), q.prompt).toBe(true));
        if (circle) {
          expect(q.data.options!.filter((o) => o.correct).length).toBe(1);
          expect(new Set(q.data.options!.map((o) => o.text)).size).toBe(4);
          expect(q.data.options!.find((o) => o.correct)!.text).toBe(dimTex(q.data.answerDim!));
        }
      }
    });
  });
  it("an expression's answer re-derives from its factors", () => {
    withSeededRandom(12, () => {
      for (const level of [1, 2]) for (let i = 0; i < 60; i++) {
        const q = genDimsExpr(level, i % 2 === 0);
        check(q);
        const rows = q.data.rows.slice(1);
        let t = [0, 0, 0];
        for (const r of rows) r.dim.forEach((e, k) => { t[k] += N(e) * N(r.exp!); });
        if (q.data.defText === "root") t = t.map((v) => v / 2);
        t.forEach((v, k) => expect(close(v, N(q.data.answerDim![k])), `${q.prompt} → ${q.answerText}`).toBe(true));
      }
    });
  });
  it("a constant's dimensions make the formula consistent", () => {
    withSeededRandom(13, () => {
      for (let i = 0; i < 80; i++) {
        const q = genDimsConst(i % 2 === 0);
        check(q);
        const rel = CONST_RELATIONS.find((r) => r.text === q.data.context)!;
        const k = q.data.answerDim!;
        const tot = [0, 1, 2].map((c) => N(k[c]) * rel.kexp + rel.others.reduce((a, o) => a + N(qDim(o.q)[c]) * N(o.p), 0));
        tot.forEach((v, c) => expect(close(v, N(qDim(rel.lhs)[c])), q.prompt).toBe(true));
      }
    });
  });
  it("wrong options are distinct from the right one and name their slip", () => {
    for (const q of LIBRARY) for (const o of distractors(qDim(q.id))) { expect(o.text).not.toBe(dimStr(qDim(q.id))); expect(o.why.length).toBeGreaterThan(3); }
  });
});

describe("check consistency", () => {
  it("every kind builds at both levels, with and without numbers, and the answer re-derives", () => {
    withSeededRandom(21, () => {
      for (const level of [1, 2]) for (const numbers of [false, true]) for (const ask of ["show", "odd", "missing", "pick"] as const) for (let i = 0; i < 25; i++) {
        const q = genConsistent(level, ask, numbers);
        check(q);
        const d = q.data;
        if (d.kind === "consShow") expect(d.rows.every((r) => dimEq(r.dim, d.rows[0].dim))).toBe(true);
        if (d.kind === "consOdd") {
          const odd = d.oddIdx!;
          const others = d.rows.filter((_, k) => k !== odd);
          expect(others.every((r) => dimEq(r.dim, others[0].dim))).toBe(true);
          expect(dimEq(d.rows[odd].dim, others[0].dim)).toBe(false);
        }
        if (d.kind === "consMissing") {
          expect(d.answerPowers.length).toBe(1);
          expect(d.formula).toContain("^{n}");
        }
        if (d.kind === "consPick") {
          expect(d.options!.length).toBe(4);
          expect(d.options!.filter((o) => o.correct).length).toBe(1);
          expect(d.options!.find((o) => o.correct)!.text).toBe(d.formula);
        }
      }
    });
  });
});

describe("find the powers", () => {
  const contexts = ["none", "named", "worded"] as const;
  it("every power satisfies the three equations, and the solution is unique, at every level and option", () => {
    withSeededRandom(31, () => {
      for (const level of [1, 2, 3]) for (const context of contexts) for (const ask of ["find", "zero"] as const) for (let i = 0; i < 30; i++) {
        const q = genPowers(level, { context, ask, given: i % 2 === 0 ? "dims" : "units" });
        check(q);
        const d = q.data;
        const target = d.rows[0].dim;
        const factors = d.rows.slice(1).map((r) => r.dim);
        if (d.ask === "cannot") continue;
        const x = cramer(factors, target);
        expect(x, q.prompt).not.toBeNull();
        d.answerPowers.forEach((p, k) => expect(close(x![k], N(p)), `${q.prompt} → ${q.answerText}`).toBe(true));
        // substituting the powers gives the target's dimensions
        [0, 1, 2].forEach((c) => expect(close(factors.reduce((a, f, k) => a + N(f[c]) * N(d.answerPowers[k]), 0), N(target[c]))).toBe(true));
        if (d.ask === "zero") expect(fstr(d.answerPowers[d.zeroIdx!])).toBe("0");
        expect(d.answerPowers.length).toBe(level === 1 ? 2 : 3);
      }
    });
  });
  it("a 'cannot work' model really has no solution", () => {
    withSeededRandom(32, () => {
      for (let i = 0; i < 40; i++) {
        const q = genPowers(1 + (i % 3), { context: i % 2 === 0 ? "none" : "named", ask: "cannot", given: "dims" });
        if (q.data.ask !== "cannot") continue; // fell back to a find question
        const d = q.data;
        const facs = d.rows.slice(1).map((r) => r.dim);
        // two unknowns, three equations: solve the first two independent ones and show the remaining one fails
        const target = d.rows[0].dim;
        let consistent = false;
        for (let r1 = 0; r1 < 3 && !consistent; r1++) for (let r2 = r1 + 1; r2 < 3 && !consistent; r2++) {
          const D = N(facs[0][r1]) * N(facs[1][r2]) - N(facs[1][r1]) * N(facs[0][r2]);
          if (close(D, 0)) continue;
          const a = (N(target[r1]) * N(facs[1][r2]) - N(facs[1][r1]) * N(target[r2])) / D;
          const b = (N(facs[0][r1]) * N(target[r2]) - N(target[r1]) * N(facs[0][r2])) / D;
          consistent = [0, 1, 2].every((c) => close(a * N(facs[0][c]) + b * N(facs[1][c]), N(target[c])));
        }
        expect(consistent).toBe(false);
      }
    });
  });
});

describe("the working", () => {
  const asProblem = (q: DimQuestion): DecisionProblem => ({ dim: q.data, prompt: q.prompt, answer: { text: q.answerText } }) as DecisionProblem;
  it("every kind of question has working that ends on the answer, with a caption on every step and only valid rows revealed", () => {
    withSeededRandom(41, () => {
      const qs: DimQuestion[] = [];
      for (let i = 0; i < 25; i++) {
        qs.push(genDimsName(1 + (i % 2), i % 3 === 0, i % 2 === 0), genDimsExpr(1 + (i % 2), i % 2 === 0), genDimsConst(i % 2 === 0));
        for (const ask of ["show", "odd", "missing", "pick"] as const) qs.push(genConsistent(1 + (i % 2), ask, true));
        for (const level of [1, 2, 3]) for (const context of ["none", "named", "worded"] as const) qs.push(genPowers(level, { context, ask: i % 4 === 0 ? "zero" : "find", given: "dims" }));
        qs.push(genPowers(1 + (i % 3), { context: "named", ask: "cannot", given: "dims" }));
      }
      for (const q of qs) {
        const steps = solveDim(asProblem(q));
        expect(steps.length, q.prompt).toBeGreaterThan(1);
        let before: string[] = [];
        for (const s of steps) {
          expect(s.caption.length, q.prompt).toBeGreaterThan(3);
          const v = s.dimView!;
          // what is known only ever grows, a step's new rows are at most all of its rows, and a page stays small enough to fit its panel without scrolling
          expect(v.known.slice(0, before.length), q.prompt).toEqual(before);
          expect(v.fresh!, q.prompt).toBeLessThanOrEqual(v.lines.length);
          expect(v.lines.length, q.prompt).toBeLessThanOrEqual(20);
          expect(v.known.length, q.prompt).toBeLessThanOrEqual(14);
          before = v.known;
        }
        // the last page ends on the boxed answer
        expect(steps[steps.length - 1].dimView!.lines.concat(steps.flatMap((s) => s.dimView!.lines)).some((r) => r.startsWith("\\boxed{")), q.prompt).toBe(true);
        const last = steps.filter((s) => s.phase === "Answer" || s.phase === "Conclusion").pop();
        expect(last, q.prompt).toBeDefined();
        if (q.data.kind === "powers" && q.data.ask !== "cannot") {
          // the boxed answer on the last page is the intended powers
          const boxedRow = last!.dimView!.lines.find((r) => r.startsWith("\\boxed{"))!;
          q.data.unknowns.forEach((u, i) => expect(boxedRow, q.prompt).toContain(`${symTex(u)} = ${frTex(q.data.answerPowers[i])}`));
        }
      }
    });
  });
});

describe("exam-style chains", () => {
  const TOTALS: Record<DimChain, number> = { circle: 1, find: 4, constant: 5, consistent: 5, models: 4, zero: 6 };
  const PARTS: Record<DimChain, number> = { circle: 1, find: 2, constant: 2, consistent: 2, models: 2, zero: 2 };
  it("every chain builds with exactly the parts and marks the brief gives, valid mark codes, and a model answer and working for every part", () => {
    withSeededRandom(51, () => {
      for (const chain of DIM_CHAINS) for (let i = 0; i < 40; i++) {
        const p = generateDimExam(1, chain);
        const exam = p.exam!;
        expect(exam.parts.length, chain).toBe(PARTS[chain]);
        expect(exam.totalMarks, chain).toBe(TOTALS[chain]);
        expect(exam.intro.length).toBeGreaterThan(10);
        for (const part of exam.parts) {
          expect(part.marks).toBe(part.scheme.length);
          expect(part.model.length).toBeGreaterThan(0);
          expect(part.working && part.working.length).toBeGreaterThan(0);
          for (const mk of part.scheme) expect(mk.code, chain).toMatch(/^[BMAER]1F?$/);
        }
        expect(p.dim).toBeDefined();
      }
    });
  });
  it("the powers a part asks for are the situation's powers, found independently", () => {
    withSeededRandom(52, () => {
      for (const chain of ["find", "constant", "models", "zero"] as const) for (let i = 0; i < 40; i++) {
        const p = generateDimExam(1, chain);
        const d = p.dim!;
        const factors = d.rows.slice(1).map((r) => r.dim);
        const x = cramer(factors, d.rows[0].dim);
        expect(x, chain).not.toBeNull();
        d.answerPowers.forEach((pw, k) => expect(close(x![k], N(pw)), `${chain}: ${p.prompt}`).toBe(true));
      }
    });
  });
  it("in a two-models question the rejected quantity is the only one with a base dimension the target lacks", () => {
    withSeededRandom(53, () => {
      for (let i = 0; i < 40; i++) {
        const p = generateDimExam(1, "models");
        const a = p.exam!.parts[0].model[0];
        expect(a).toMatch(/should be rejected/);
        expect(a).toMatch(/only quantity with dimension \$[MLT]\$/);
      }
    });
  });
});

describe("the written working page", () => {
  it("renders for the question and every step of every part (the exam paper prints it with renderToStaticMarkup)", () => {
    withSeededRandom(61, () => {
      for (const chain of DIM_CHAINS) for (let i = 0; i < 8; i++) {
        const p = generateDimExam(1, chain);
        expect(renderToStaticMarkup(createElement(DimCanvas, { p, step: undefined }))).toContain("Known");
        for (const part of p.exam!.parts) {
          for (const st of part.working ?? []) {
            const html = renderToStaticMarkup(createElement(DimCanvas, { p, step: st }));
            expect(html.length).toBeGreaterThan(100);
            expect(html, "a row failed to render in KaTeX").not.toContain("katex-error");
          }
          if (part.stepView) expect(renderToStaticMarkup(createElement(DimCanvas, { p, step: part.stepView }))).toContain("Known");
        }
      }
    });
  });
});

describe("the maths is LaTeX", () => {
  const segs = (s: string): string[] => { const parts = s.split(/\$/); expect(parts.length % 2, `unbalanced $ in: ${s}`).toBe(1); return parts.filter((_, i) => i % 2 === 1); };
  const renders = (tex: string, where: string) => { try { katex.renderToString(tex, { throwOnError: true }); } catch (e) { throw new Error(`${where}: ${tex}\n${(e as Error).message}`); } };
  const prose = (s: string, where: string) => {
    segs(s).forEach((tex) => renders(tex, where));
    // no raw Unicode superscripts or Greek power symbols left outside $…$ in the question wording
    expect(s.replace(/\$[^$]*\$/g, ""), `${where}: ${s}`).not.toMatch(/[⁰¹²³⁴⁻ᵃᵇᶜⁿ]|[αβγ]/);
  };
  it("every prompt, answer, step, line and exam text has balanced dollars and every formula renders in KaTeX", () => {
    withSeededRandom(71, () => {
      const qs: DimQuestion[] = [];
      for (let i = 0; i < 20; i++) {
        qs.push(genDimsName(1 + (i % 2), i % 3 === 0, i % 2 === 0), genDimsExpr(1 + (i % 2), i % 2 === 0), genDimsConst(i % 2 === 0));
        for (const ask of ["show", "odd", "missing", "pick"] as const) qs.push(genConsistent(1 + (i % 2), ask, true));
        for (const level of [1, 2, 3]) for (const context of ["none", "named", "worded"] as const) qs.push(genPowers(level, { context, ask: i % 4 === 0 ? "zero" : "find", given: i % 2 ? "units" : "dims" }));
        qs.push(genPowers(1 + (i % 3), { context: "named", ask: "cannot", given: "dims" }));
      }
      for (const q of qs) {
        prose(q.prompt, "prompt");
        prose(q.answerText, "answer");
        if (q.data.formula) renders(q.data.formula, "formula");
        q.data.rows.forEach((r) => renders(r.sym, "row"));
        (q.data.terms ?? []).forEach((t) => renders(t.tex, "term"));
        modelChains(q.data).forEach((c) => renders(c, "model chain"));
        (q.data.options ?? []).forEach((o) => renders(o.text, "option"));
        for (const st of solveDim({ dim: q.data, prompt: q.prompt, answer: { text: q.answerText } } as DecisionProblem)) {
          prose(st.caption, `caption (${q.data.kind})`);
          for (const row of st.dimView!.lines) if (row.startsWith("#")) prose(row.slice(1), `heading (${q.data.kind})`); else if (row !== "") renders(row.includes("&") ? `\\begin{aligned}${row}\\end{aligned}` : row, `written row (${q.data.kind})`);
          for (const k of st.dimView!.known) renders(k, `known item (${q.data.kind})`);
        }
      }
      for (const chain of DIM_CHAINS) for (let i = 0; i < 10; i++) {
        const ex = generateDimExam(1, chain).exam!;
        prose(ex.intro, `intro (${chain})`);
        for (const pt of ex.parts) {
          prose(pt.prompt, `part prompt (${chain})`);
          pt.model.forEach((l) => prose(l, `model (${chain})`));
          pt.scheme.forEach((mk) => prose(mk.text, `scheme (${chain})`));
          (pt.explain ?? []).forEach((l) => prose(l, `explain (${chain})`));
        }
      }
    });
  });
  it("the model answers state the formula, then read as the formal chain with square brackets", () => {
    const q = genDimsNameFor("force", false, false);
    // acceleration is given, so force is found straight from Newton's second law
    expect(modelChains(q.data)).toEqual(["F = ma", "[F] = [ma] = [m][a] = M \\times LT^{-2} = MLT^{-2}"]);
    // a power in a bracket is written as a power of the bracket, then expanded: [v^2] = [v]^2 = (LT^-1)^2 = L^2 T^-2
    const e = genDimsNameFor("energy", false, false);
    expect(modelChains(e.data)).toEqual(["E = \\frac{1}{2}mv^{2}", "[E] = \\left[\\frac{1}{2}mv^{2}\\right] = [\\frac{1}{2}][m][v]^{2} = 1 \\times M \\times (LT^{-1})^{2} = 1 \\times M \\times L^{2}T^{-2} = ML^{2}T^{-2}"]);
    const u = genDimsNameFor("dens", true, false);
    expect(modelChains(u.data).join(" ")).toContain("= \\frac{M}{L^{3}} = ML^{-3}");
  });
  it("a division is kept as a fraction, cancelled, and only then written with negative powers", () => {
    const q = genDimsNameFor("press", false, false);
    const chains = modelChains(q.data);
    expect(chains[chains.length - 1]).toBe("[p] = \\left[\\frac{F}{A}\\right] = \\frac{[F]}{[A]} = \\frac{MLT^{-2}}{L^{2}} = \\frac{M}{LT^{2}} = ML^{-1}T^{-2}");
    // no row of the working writes a bracket to a negative power: that is what the fraction avoids
    const steps = solveDim({ dim: q.data, prompt: q.prompt, answer: { text: q.answerText } } as DecisionProblem);
    for (const st of steps) for (const r of st.dimView!.lines) expect(r, "a negative power on a bracket").not.toMatch(/\][\^]\{-|\)\^\{-/);
    // the steps go: brackets as a fraction, dimensions in, cancel, then the negative powers
    const phases = steps.map((x) => x.phase);
    expect(phases.indexOf("Cancel")).toBeGreaterThan(phases.indexOf("Dimensions"));
    const last = steps.filter((x) => x.phase === "Answer").pop()!;
    expect(phases.lastIndexOf("Answer")).toBeGreaterThan(phases.lastIndexOf("Cancel"));
    expect(last.caption).toMatch(/negative power/);
  });
  it("a quantity that is not given is built before it is used, after its formula is stated, and the page never shows it as a fact first", () => {
    const q = genDimsNameFor("power", false, false);
    const steps = solveDim({ dim: q.data, prompt: q.prompt, answer: { text: q.answerText } } as DecisionProblem);
    const firstMain = steps.findIndex((s) => s.phase === "The formula");
    expect(steps.some((s) => (s.phase ?? "").startsWith("Build"))).toBe(true);
    expect(steps.findIndex((s) => (s.phase ?? "").startsWith("Build"))).toBeLessThan(firstMain);
    // energy is built (from kinetic energy) and joins the known strip when finished, and not before
    expect(steps[0].dimView!.known.some((k) => k.startsWith("[E]"))).toBe(false);
    expect(steps[firstMain].dimView!.known).toContain("[E] = ML^{2}T^{-2}");
    // the formula is stated before the brackets are written
    expect(steps[0].dimView!.lines.some((r) => r.startsWith("\\text{Formula:}"))).toBe(true);
    // the given set is length, time, mass, speed and acceleration
    expect(steps[0].dimView!.known.slice(0, 5)).toEqual(["[l] = L", "[t] = T", "[m] = M", "[v] = LT^{-1}", "[a] = LT^{-2}"]);
    // the page has a title
    expect(q.data.title).toBe("Find the dimensions of power");
  });
  it("a question that states dimensions (letters) builds nothing: they are given", () => {
    withSeededRandom(5, () => {
      const q = genPowers(2, { context: "none", ask: "find", given: "dims" });
      const steps = solveDim({ dim: q.data, prompt: q.prompt, answer: { text: q.answerText } } as DecisionProblem);
      expect(steps.some((s) => (s.phase ?? "").startsWith("Build"))).toBe(false);
    });
  });
});

describe("the printed exam paper", () => {
  it("turns each $…$ in the question, the model answers and the mark scheme into a KaTeX span, escapes the prose, and renders after the page loads", () => {
    withSeededRandom(81, () => {
      for (const chain of DIM_CHAINS) {
        const p = generateDimExam(1, chain);
        const html = examSetHtml([{ title: "Dimensional Analysis", exam: p.exam!, questionFigure: "<div></div>", answerFigures: p.exam!.parts.map(() => null) }]);
        expect(html, chain).toContain('class="katex-render"');
        expect(html, chain).toContain("katex.min.css");
        expect(html, chain).toContain("katex.render(");
        // no dollar signs are left in the visible text (they are all inside the data-latex attributes' spans)
        const visible = html.replace(/<span class="katex-render"[^>]*><\/span>/g, "").replace(/<script>[\s\S]*?<\/script>/g, "").replace(/<style>[\s\S]*?<\/style>/g, "");
        expect(visible, chain).not.toContain("$");
      }
    });
  });
});
