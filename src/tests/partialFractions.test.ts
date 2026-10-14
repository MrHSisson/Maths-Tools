// Partial Fractions — every generated question is an identity: N/D ≡ Q + Σ A/(factor)^k, checked with exact fractions at several x,
// the working never throws (it re-derives every constant itself), and every form on every tab/level is reachable.
import { describe, it, expect } from "vitest";
import { __test } from "../tools/Algebra/PartialFractions";

const { TOOL_CONFIG, generateQuestion, helpers } = __test as unknown as {
  TOOL_CONFIG: { tools: Record<string, { difficultySettings: Record<string, { multiSelect: { key: string; options: { value: string }[] }[] }> }> };
  generateQuestion: (t: string, l: string, v: Record<string, boolean>, dd: string, ms: Record<string, boolean>) => any;
  helpers: any;
};
const { prodPoly, polyEvalF, F, addF, mulF, divF, eqF } = helpers;

const check = (q: any) => {
  const { facs, terms, N, Q } = q._raw as { facs: { p: number; q: number; m: number }[]; terms: { fi: number; k: number; A: { n: number; d: number } }[]; N: number[]; Q: number[] | null };
  const D = prodPoly(facs);
  for (const xv of [F(7, 3), F(-11, 5), F(13), F(1, 7)]) {
    const lhs = divF(polyEvalF(N, xv), polyEvalF(D, xv));
    let rhs = Q ? polyEvalF(Q, xv) : F(0);
    for (const t of terms) {
      const f = facs[t.fi];
      let den = F(1);
      for (let i = 0; i < t.k; i++) den = mulF(den, addF(mulF(F(f.p), xv), F(f.q)));
      rhs = addF(rhs, divF(t.A, den));
    }
    expect(eqF(lhs, rhs)).toBe(true);
  }
};

describe("Partial Fractions", () => {
  it("with negative x terms off, every x coefficient of the numerator is positive", () => {
    for (const tool of Object.keys(TOOL_CONFIG.tools)) for (const level of ["level1", "level2", "level3"]) {
      for (let i = 0; i < 25; i++) {
        const q = generateQuestion(tool, level, { negX: false }, "full", {});
        check(q);
        const N = (q._raw as { N: number[] }).N;
        expect(N.slice(0, -1).every((c) => c >= 0), `${tool} ${level} ${N}`).toBe(true);
      }
    }
  });

  for (const [tool, def] of Object.entries(TOOL_CONFIG.tools)) {
    for (const [level, s] of Object.entries(def.difficultySettings)) {
      const forms = s.multiSelect[0].options.map((o) => o.value);
      for (const form of forms) for (const shown of ["factorised", "expanded"]) for (const consts of ["whole", "fractions"]) {
        it(`${tool} ${level} ${form} (${shown}, ${consts}): identity holds and the working is derivable`, () => {
          const ms: Record<string, boolean> = {};
          forms.forEach((f) => (ms[f] = f === form));
          ms.factorised = shown === "factorised"; ms.expanded = shown === "expanded";
          ms.whole = consts === "whole"; ms.fractions = consts === "fractions";
          for (let i = 0; i < 40; i++) {
            const q = generateQuestion(tool, level, {}, i % 2 ? "short" : "full", ms);
            check(q);
            expect(q.working.length).toBeGreaterThanOrEqual(1);
            expect(q._raw.facs.some((f: { m: number }) => f.m === 2)).toBe(/repeat/i.test(form) || form === "repeated3");
            if (consts === "fractions" && form !== "repeated2") expect(q._raw.terms.some((x: { A: { d: number } }) => x.A.d > 1)).toBe(true);
            else if (consts === "whole") expect(q._raw.terms.every((x: { A: { d: number } }) => x.A.d === 1)).toBe(true);
            for (const f of q._raw.facs) if (f.p < 0) expect(f.q).toBeGreaterThan(0);
          }
        });
      }
    }
  }

  it("Fractions always gives a fractional constant (except a lone monic repeated factor, which is whole); every option combination generates", () => {
    for (const [tool, def] of Object.entries(TOOL_CONFIG.tools)) for (const [level, s] of Object.entries(def.difficultySettings)) {
      const pools = s.multiSelect;
      for (const f of pools[0].options) for (const c of pools[2].options) for (const negX of [false, true]) {
        const ms: Record<string, boolean> = {};
        pools.forEach((p) => p.options.forEach((o) => (ms[o.value] = false)));
        ms[f.value] = true; ms[pools[1].options[0].value] = true; ms[c.value] = true;
        for (let i = 0; i < 25; i++) {
          const q = generateQuestion(tool, level, { negX }, "full", ms);
          check(q);
          const terms = q._raw.terms as { A: { d: number } }[];
          if (c.value === "fractions" && f.value !== "repeated2") expect(terms.some((x) => x.A.d > 1), `${tool} ${level} ${f.value}`).toBe(true);
          if (f.value === "repeated2") expect(terms.every((x) => x.A.d === 1)).toBe(true);
        }
      }
    }
  });

  it("Fractions is greyed at Level 3 Two fractions unless a form that can give fractions is on", () => {
    const opts = TOOL_CONFIG.tools.two.difficultySettings.level3.multiSelect[2].options;
    const fr = opts.find((o) => o.value === "fractions") as { requires?: unknown };
    expect(fr.requires).toEqual([["repeatedNonMonic2", "repeatedNeg2"]]);
  });
});
