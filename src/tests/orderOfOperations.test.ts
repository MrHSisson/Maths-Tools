// Order of Operations — engine tests. The BIDMAS stepper (which produces the working and
// the answer) is checked against a straight evaluator, and the brief's reference examples
// (specs/order-of-operations.md) are checked line by line.

import { describe, it, expect } from "vitest";
import { __test } from "../tools/Number/OrderOfOperations";

const { E, P, R, F, NEG, texBody, NO_HL, runSteps, evalNode, SHAPES, buildEval, MISTAKES, genInsert, analyse } = __test.engine;

const lines = (ast: ReturnType<typeof E>) => {
  const run = runSteps(ast)!;
  return [texBody(ast, NO_HL), ...run.steps.map((s) => texBody(s.after, NO_HL))];
};

describe("BIDMAS stepper — reference examples", () => {
  it("3 + 4 × 2² : indices, multiply, add", () => {
    const ast = E(3, "+", 4, "*", P(2, 2));
    expect(lines(ast)).toEqual(["3 + 4 \\times 2^{2}", "3 + 4 \\times 4", "3 + 16", "19"]);
    expect(runSteps(ast)!.steps.map((s) => s.label)).toEqual(["Indices:", "Multiply:", "Add:"]);
  });

  it("8 ÷ 2 × 3 is done left to right", () => {
    const ast = E(8, "/", 2, "*", 3);
    expect(lines(ast)).toEqual(["8 \\div 2 \\times 3", "4 \\times 3", "12"]);
    expect(runSteps(ast)!.steps[0].label).toBe("Divide (left to right):");
  });

  it("10 − 3 + 4 is done left to right", () => {
    const ast = E(10, "-", 3, "+", 4);
    expect(lines(ast)).toEqual(["10 - 3 + 4", "7 + 4", "11"]);
  });

  it("brackets first, innermost first: 2 × ((3 + 4) − 1)", () => {
    const ast = E(2, "*", E(E(3, "+", 4), "-", 1));
    expect(lines(ast)).toEqual([
      "2 \\times \\left(\\left(3 + 4\\right) - 1\\right)",
      "2 \\times \\left(7 - 1\\right)",
      "2 \\times 6",
      "12",
    ]);
    expect(runSteps(ast)!.steps[0].label).toBe("Brackets — add:");
  });

  it("independent operations share a step: 2 × 3 + 4 × 5", () => {
    const ast = E(2, "*", 3, "+", 4, "*", 5);
    expect(lines(ast)).toEqual(["2 \\times 3 + 4 \\times 5", "6 + 20", "26"]);
  });

  it("−3² + 5 is −4, but (−3)² + 5 is 14", () => {
    expect(runSteps(E(NEG(P(3, 2)), "+", 5))!.final).toBe(-4);
    expect(runSteps(E(P(-3, 2), "+", 5))!.final).toBe(14);
    expect(texBody(E(5, "-", P(-3, 2)), NO_HL)).toBe("5 - (-3)^{2}");
  });

  it("negative results are bracketed after an operator: 4 − 2 × (−3)", () => {
    expect(lines(E(4, "-", 2, "*", -3))).toEqual(["4 - 2 \\times (-3)", "4 - (-6)", "10"]);
  });

  it("root and fraction bar act as brackets: √(9 + 16) + 12/(5 − 1)", () => {
    const ast = E(R(E(9, "+", 16)), "+", F(E(12), E(5, "-", 1)));
    expect(runSteps(ast)!.final).toBe(8);
    expect(lines(ast)).toEqual([
      "\\sqrt{9 + 16} + \\dfrac{12}{5 - 1}",
      "\\sqrt{25} + \\dfrac{12}{4}",
      "\\sqrt{25} + 3",
      "5 + 3",
      "8",
    ]);
  });

  it("decimals stay exact: 0.1 + 0.2 × 3", () => {
    expect(runSteps(E(0.1, "+", 0.2, "*", 3))!.final).toBe(0.7);
  });
});

describe("stepper agrees with straight evaluation", () => {
  const families = Object.keys(SHAPES) as (keyof typeof SHAPES)[];
  for (const nm of ["whole", "negatives", "decimals"] as const) {
    for (const fam of families) {
      it(`${fam} / ${nm}`, () => {
        let built = 0;
        for (let i = 0; i < 60; i++) {
          const b = buildEval("level3", fam, nm);
          if (!b) continue;
          built++;
          expect(b.info.answer).toBe(evalNode(b.ast));
          const run = runSteps(b.ast)!;
          expect(run.final).toBe(b.info.answer);
        }
        // Every family must be able to produce questions in the modes the QO offers it in.
        expect(built).toBeGreaterThan(20);
      });
    }
  }
});

describe("mistake questions", () => {
  for (const [id, def] of Object.entries(MISTAKES)) {
    it(`${id}: the wrong answer differs from the right one`, () => {
      let found = 0;
      for (let i = 0; i < 40; i++) {
        const b = buildEval("level3", def.family, def.nm);
        if (!b || (def.needs && !def.needs(b.ast))) continue;
        if (def.wrong(b.ast) !== b.info.answer) found++;
      }
      expect(found).toBeGreaterThan(0);
    });
  }
});

describe("insert brackets", () => {
  it("the bracketed line evaluates to the target and the target is unique", () => {
    for (const level of ["level1", "level2", "level3"] as const) {
      for (let i = 0; i < 40; i++) {
        const d = genInsert(level)!;
        expect(d).toBeTruthy();
        expect(evalNode(d.bracketed)).toBe(d.target);
        expect(evalNode(d.flat)).not.toBe(d.target);
        expect(analyse(d.bracketed, "whole")).toBeTruthy();
      }
    }
  });
});
