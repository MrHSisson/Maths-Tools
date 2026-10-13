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
});
