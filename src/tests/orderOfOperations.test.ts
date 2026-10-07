// Order of Operations — engine tests. The BIDMAS stepper (which produces the working and
// the answer) is checked against a straight evaluator, and the brief's reference examples
// (specs/order-of-operations.md) are checked line by line.

import { describe, it, expect } from "vitest";
import { __test } from "../tools/Number/OrderOfOperations";

const { E, P, R, F, NEG, N, texBody, NO_HL, runSteps, evalNode, SHAPES, buildEval, MISTAKES, genInsert, analyse, drawMistake, studentLines, levelOf, LEVEL_OF, MISTAKES_BY_LEVEL } = __test.engine;
const { generateQuestion } = __test as any;

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
          const b = buildEval(LEVEL_OF[fam], fam, nm);
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
        const b = buildEval(def.level, def.family, def.nm);
        if (!b || (def.needs && !def.needs(b.ast))) continue;
        if (def.wrong(b.ast) !== b.info.answer) found++;
      }
      expect(found).toBeGreaterThan(0);
    });
  }
});

describe("insert brackets", () => {
  it("the bracketed line evaluates to the target and the target is unique", () => {
    for (const level of ["level2", "level3"] as const) {
      for (let i = 0; i < 40; i++) {
        const d = genInsert(level)!;
        expect(d).toBeTruthy();
        // Structure: removing the brackets gives back exactly the flat line (no operator lost).
        expect(d.bracketed.terms.length).toBe(d.bracketed.ops.length + 1);
        expect(texBody(d.bracketed, NO_HL).replace(/\\left\(|\\right\)/g, "")).toBe(texBody(d.flat, NO_HL));
        expect(evalNode(d.bracketed)).toBe(d.target);
        expect(evalNode(d.flat)).not.toBe(d.target);
        expect(analyse(d.bracketed, "whole")).toBeTruthy();
      }
    }
  });
});

describe("checked against the class worksheets", () => {
  const val = (ast: ReturnType<typeof E>) => runSteps(ast)!.final;
  it("Question 1–3 items evaluate to the worksheet values", () => {
    expect(val(E(7, "+", 2, "*", 3))).toBe(13);
    expect(val(E(100, "-", 40, "*", 2))).toBe(20);
    expect(val(E(E(8, "+", 9), "*", 3))).toBe(51);
    expect(val(E(90, "/", E(52, "-", 7)))).toBe(2);
    expect(val(E(10, "-", R(16)))).toBe(6);
    expect(val(E(R(E(2, "+", 14))))).toBe(4);
    expect(val(E(R(4), "+", P(3, 2)))).toBe(11);
    expect(val(E(P(E(7, "-", 2), 2)))).toBe(25);
    expect(val(E(P(E(2, "+", 8), 3)))).toBe(1000);
    expect(val(E(P(8, 2), "+", 2, "*", P(3, 2)))).toBe(82);
    expect(val(E(7, "*", P(E(8, "/", 4), 2)))).toBe(28);
    expect(val(E(11, "+", 11, "-", P(6, 2), "/", 2))).toBe(4);
    expect(val(E(50, "-", E(1, "+", 4), "*", 4))).toBe(30);
  });
  it("Question 4 (insert brackets) answers hold", () => {
    expect(evalNode(E(E(9, "+", P(3, 2)), "*", 10, "/", 2))).toBe(90);
    expect(evalNode(E(E(5, "+", 5), "/", 5))).toBe(2);
    expect(evalNode(E(E(18, "-", 6), "/", 2))).toBe(6);
    expect(evalNode(E(E(2, "*", 7, "+", 1), "*", 3))).toBe(45);
  });
  it("Q5: the student working 9 + 4 × 3 + 2 → 13 × 3 + 2 → 39 + 2 → 41 is the left-to-right mistake", () => {
    const ast = E(9, "+", 4, "*", 3, "+", 2);
    expect(runSteps(ast)!.final).toBe(23);
    const lines = studentLines("leftToRight", ast)!.map((l: any) => texBody(l, NO_HL));
    expect(lines).toEqual(["13 \\times 3 + 2", "39 + 2", "41"]);
  });
});

describe("student working always arrives at the wrong answer", () => {
  for (const level of ["level1", "level2", "level3"] as const) {
    it(level, () => {
      const msv: Record<string, boolean> = {};
      for (let i = 0; i < 80; i++) {
        const d = drawMistake(level, msv)!;
        expect(d).toBeTruthy();
        const last = d.lines[d.lines.length - 1];
        expect((last.terms[0] as any).v).toBe(d.wrong);
        expect(d.wrong).not.toBe(d.right);
      }
    });
  }
  it("Is-it-correct questions verdict matches the claim", () => {
    for (let i = 0; i < 100; i++) {
      const q = generateQuestion("fixIt", "level3", {}, "", { isCorrect: true, insertBrackets: false, spotMistake: false });
      expect(q.kind).toBe("worded");
      expect(q.answerLatex).toMatch(/mathrm\{(Yes|No):\}/);
    }
  });
});

describe("the levels build on each other and never overlap", () => {
  const families = Object.keys(SHAPES) as (keyof typeof SHAPES)[];
  for (const fam of families) {
    it(`${fam}: every question needs exactly its level's idea`, () => {
      const want = { level1: 1, level2: 2, level3: 3 }[LEVEL_OF[fam] as "level1"];
      for (const nm of ["whole", "negatives", "decimals"] as const) {
        for (let i = 0; i < 25; i++) {
          const b = buildEval(LEVEL_OF[fam], fam, nm);
          if (b) expect(levelOf(b.ast)).toBe(want);
        }
      }
    });
  }
  it("levelOf classifies by idea", () => {
    expect(levelOf(E(7, "+", 2, "*", 3))).toBe(1);
    expect(levelOf(E(8, "/", 2, "*", 3))).toBe(1);
    expect(levelOf(E(E(7, "+", 2), "*", 3))).toBe(2);
    expect(levelOf(E(5, "-", P(2, 2)))).toBe(2);
    expect(levelOf(E(NEG(P(3, 2)), "+", 5))).toBe(2);
    expect(levelOf(E(10, "-", R(16)))).toBe(3);
    expect(levelOf(E(F(E(8, "+", 4), E(5, "-", 1))))).toBe(3);
    expect(levelOf(E(2, "*", E(E(3, "+", 4), "-", 1)))).toBe(3);
  });
  it("Level 2 brackets can use the Level 1 idea inside (a Level 1 line is the sub-problem)", () => {
    const ast = E(E(3, "+", 4, "*", 2), "*", 5);
    expect(levelOf(ast)).toBe(2);
    const steps = runSteps(ast)!.steps;
    expect(steps[0].label).toBe("Brackets — multiply:");
    expect(texBody(steps[0].after, NO_HL)).toBe("\\left(3 + 8\\right) \\times 5");
  });
  it("each level offers only its own mistakes and Insert brackets starts at Level 2", () => {
    expect(MISTAKES_BY_LEVEL.level1).toEqual(["leftToRight", "mulFirst", "addFirst"]);
    expect(MISTAKES_BY_LEVEL.level2).toEqual(["ignoreBrackets", "powTimes", "negSquare"]);
    expect(MISTAKES_BY_LEVEL.level3).toEqual(["rootGroup", "fracGroup"]);
    const q1 = (__test.TOOL_CONFIG.tools.fixIt.difficultySettings as any).level1.multiSelect[0].options.map((o: any) => o.value);
    const q2 = (__test.TOOL_CONFIG.tools.fixIt.difficultySettings as any).level2.multiSelect[0].options.map((o: any) => o.value);
    expect(q1).not.toContain("insertBrackets");
    expect(q2).toContain("insertBrackets");
  });
  it("selectors are small: at most 3 options per group (the four operations are the one exception)", () => {
    for (const tool of Object.values(__test.TOOL_CONFIG.tools) as any[]) {
      for (const ds of Object.values(tool.difficultySettings) as any[]) {
        for (const g of [].concat(ds.multiSelect)) expect((g as any).options.length).toBeLessThanOrEqual((g as any).key === "operations" ? 4 : 3);
      }
    }
  });
});

describe("BIDMAS pyramid tiers", () => {
  const tiers = (ast: ReturnType<typeof E>) => runSteps(ast)!.steps.map((s) => s.tiers);
  it("7 + 2 × 3 lights M then A", () => {
    expect(tiers(E(7, "+", 2, "*", 3))).toEqual([{ strong: ["M"], soft: [] }, { strong: ["A"], soft: [] }]);
  });
  it("8 ÷ 2 × 3 lights D with M as its equal-priority partner, then M", () => {
    const t = tiers(E(8, "/", 2, "*", 3));
    expect(t[0]).toEqual({ strong: ["D"], soft: ["M"] });
    expect(t[1]).toEqual({ strong: ["M"], soft: [] });
  });
  it("10 − 3 + 4 lights S with A softly", () => {
    expect(tiers(E(10, "-", 3, "+", 4))[0]).toEqual({ strong: ["S"], soft: ["A"] });
  });
  it("a bracket step lights B, with the operation inside softly; a power lights I", () => {
    const t = tiers(E(E(3, "+", 4), "*", P(2, 2)));
    expect(t[0]).toEqual({ strong: ["B"], soft: ["A"] });
    expect(t[1]).toEqual({ strong: ["I"], soft: [] });
  });
  it("every Evaluate working step carries a pyramid", () => {
    for (const lv of ["level1", "level2", "level3"] as const) {
      for (let i = 0; i < 30; i++) {
        const q: any = generateQuestion("evaluate", lv, {}, "", {});
        for (const w of q.working) expect(w.extra?.pyramid?.strong?.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("Depth bank numeric claims (src/tools/Number/OrderOfOperationsDepth.ts)", () => {
  const v = (ast: ReturnType<typeof E>) => evalNode(ast);
  it("Level 1", () => {
    expect(v(E(7, "+", 2, "*", 3))).toBe(13);
    expect(evalNode(E(7, "+", 2, "*", 3), { lr: true })).toBe(27);
    expect(v(E(20, "-", 8, "+", 3))).toBe(15);
    expect(evalNode(E(20, "-", 8, "+", 3), { addFirst: true })).toBe(9);
    expect(v(E(24, "/", 4, "*", 2))).toBe(12);
    expect(evalNode(E(24, "/", 4, "*", 2), { mulFirst: true })).toBe(3);
    // the "add first" items: 15 − 6 + 4, 30 − 12 + 5, 30 + 12 − 5, 20 + 8 − 3, 3 + 20 − 8, 20 + (−8) + 3
    expect(v(E(15, "-", 6, "+", 4))).toBe(13);
    expect(evalNode(E(15, "-", 6, "+", 4), { addFirst: true })).toBe(5);
    expect(v(E(30, "-", 12, "+", 5))).toBe(23);
    expect(evalNode(E(30, "-", 12, "+", 5), { addFirst: true })).toBe(13);
    expect(v(E(30, "+", 12, "-", 5))).toBe(37);
    expect(evalNode(E(30, "+", 12, "-", 5), { addFirst: true })).toBe(37);
    expect(v(E(20, "+", 8, "-", 3))).toBe(25);
    expect(evalNode(E(20, "+", 8, "-", 3), { addFirst: true })).toBe(25);
    expect(v(E(3, "+", 20, "-", 8))).toBe(15);
    expect(20 + -8 + 3).toBe(15);
    expect(v(E(9, "+", 3, "*", 2))).toBe(15);
    expect(evalNode(E(9, "+", 3, "*", 2), { lr: true })).toBe(24);
    expect(v(E(9, "+", 4, "*", 3, "+", 2))).toBe(23);
    expect(evalNode(E(9, "+", 4, "*", 3, "+", 2), { lr: true })).toBe(41);
    expect(v(E(2, "+", 3, "*", 4))).toBe(14);
    expect(v(E(2, "+", 3, "+", 4))).toBe(9);
    expect(v(E(2, "*", 3, "+", 4))).toBe(10);
    expect(v(E(2, "*", 3, "*", 4))).toBe(24);
    expect(v(E(2, "-", 3, "*", 4))).toBe(-10);
    expect(v(E(4, "-", 2, "*", 3))).toBe(-2);
  });
  it("Level 1 (added explain items)", () => {
    expect(v(E(10, "-", 4, "+", 3))).toBe(9);
    expect(evalNode(E(10, "-", 4, "+", 3), { addFirst: true })).toBe(3);
    expect(v(E(36, "/", 6, "*", 3))).toBe(18);
    expect(evalNode(E(36, "/", 6, "*", 3), { mulFirst: true })).toBe(2);
  });
  it("Level 2 (added items)", () => {
    expect(v(E(3, "*", E(4, "+", 2)))).toBe(18);
    expect(3 * 4 + 2).toBe(14);
    expect(v(E(NEG(P(4, 2))))).toBe(-16);
    expect(v(E(P(-4, 2)))).toBe(16);
    expect(v(E(2, "*", P(3, 2)))).toBe(18);
    expect(v(E(P(E(2, "*", 3), 2)))).toBe(36);
    expect(v(E(NEG(P(3, 2))))).toBe(-9);
    expect(v(E(NEG(P(-3, 2))))).toBe(-9);
    expect(Math.abs(v(E(NEG(P(0, 2)))))).toBe(0);
  });
  it("Level 3 (added items)", () => {
    const inner = E(5, "+", E(8, "-", 2), "*", 3);
    expect(v(E(2, "*", inner))).toBe(46);
    expect(2 * ((5 + 6) * 3)).toBe(66);
  });
  it("Level 2", () => {
    expect(v(E(5, "+", E(4, "+", 2), "*", 3))).toBe(23);
    expect(v(E(E(5, "+", 4, "+", 2), "*", 3))).toBe(33);
    expect(v(E(5, "+", 4, "+", 2, "*", 3))).toBe(15);
    expect(v(E(3, "*", P(2, 2)))).toBe(12);
    expect(v(E(P(E(3, "*", 2), 2)))).toBe(36);
    expect(v(E(NEG(P(3, 2))))).toBe(-9);
    expect(v(E(P(-3, 2)))).toBe(9);
    expect(v(E(P(E(3, "+", 4), 2)))).toBe(49);
    expect(v(E(P(3, 2), "+", P(4, 2)))).toBe(25);
    expect(v(E(2, "+", P(3, 2)))).toBe(11);
    expect(v(E(P(E(2, "+", 3), 2)))).toBe(25);
    // one pair of brackets in 2 + 3 × 4 + 1 gives exactly {15, 17, 21}
    const t = [2, 3, 4, 1], o = ["+", "*", "+"] as const;
    const answers = new Set<number>();
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
      if (i === 0 && j === 3) continue;
      const terms: any[] = [...t.slice(0, i), { t: "seq", terms: t.slice(i, j + 1).map((x) => N(x)), ops: o.slice(i, j) as any }, ...t.slice(j + 1)].map((x) => (typeof x === "number" ? N(x) : x));
      answers.add(evalNode({ t: "seq", terms, ops: [...o.slice(0, i), ...o.slice(j)] as any }));
    }
    answers.add(v(E(2, "+", 3, "*", 4, "+", 1)));
    expect([...answers].sort((a, b) => a - b)).toEqual([15, 17, 21]);
  });
  it("Level 3", () => {
    expect(v(E(R(E(9, "+", 16))))).toBe(5);
    expect(v(E(R(9), "+", 16))).toBe(19);
    expect(v(E(R(9), "+", R(16)))).toBe(7);
    expect(v(E(F(E(8, "+", 4), E(5, "-", 1))))).toBe(3);
    expect(v(E(8, "+", 4, "/", 5, "-", 1))).toBe(7.8);
    expect(v(E(E(8, "+", 4), "/", 5, "-", 1))).toBe(1.4);
    expect(v(E(2, "*", E(3, "+", E(4, "-", 1), "*", 5)))).toBe(36);
    expect(v(E(2, "*", E(E(3, "+", 3), "*", 5)))).toBe(60);
    expect(v(E(2, "*", 3, "+", E(4, "-", 1), "*", 5))).toBe(21);
    expect(v(E(F(E(12), E(4, "+", 2))))).toBe(2);
    expect(v(E(12, "/", 4, "+", 2))).toBe(5);
    expect(v(E(F(E(R(E(9, "+", 16)), "+", 3), E(2))))).toBe(4);
    expect(v(E(R(F(E(32), E(2)))))).toBe(4);
  });
});

describe("Spot the Mistake layout data", () => {
  it("every fixIt question carries a renderable _fix block", async () => {
    const katex = (await import("katex")).default;
    const { __test } = await import("../tools/Number/OrderOfOperations");
    for (const level of ["level1", "level2", "level3"] as const) {
      for (let i = 0; i < 60; i++) {
        const q = __test.generateQuestion("fixIt", level, {}, "", {}) as any;
        const fix = q._fix;
        expect(fix, `${level} missing _fix`).toBeTruthy();
        for (const tex of [fix.mathTex, fix.answerTex]) {
          expect(() => katex.renderToString(tex, { throwOnError: true })).not.toThrow();
        }
      }
    }
  });
});

describe("Operations QO (Evaluate)", () => {
  const sym: Record<string, RegExp> = { opAdd: /\+/, opSub: /-/, opMul: /\\times/, opDiv: /\\div/ };
  const msv = (on: string[], focus: Record<string, boolean>) => ({
    opAdd: on.includes("opAdd"), opSub: on.includes("opSub"), opMul: on.includes("opMul"), opDiv: on.includes("opDiv"), ...focus,
  });
  const only = (fam: string) => ({ basic: fam === "basic", chain: fam === "chain", mixed: fam === "mixed" });

  it("Left to right with only × ÷ never shows + or −; with only + − never shows × or ÷", () => {
    for (let i = 0; i < 60; i++) {
      const a = generateQuestion("evaluate", "level1", {}, "", msv(["opMul", "opDiv"], only("chain"))).displayLatex as string;
      expect(a, a).not.toMatch(sym.opAdd); expect(a, a).not.toMatch(sym.opSub);
      const b = generateQuestion("evaluate", "level1", {}, "", msv(["opAdd", "opSub"], only("chain"))).displayLatex as string;
      expect(b, b).not.toMatch(sym.opMul); expect(b, b).not.toMatch(sym.opDiv);
    }
  });
  it("a single ticked operation per pair works for × ÷ before + −", () => {
    for (let i = 0; i < 60; i++) {
      const q = generateQuestion("evaluate", "level1", {}, "", msv(["opMul", "opAdd"], only("basic"))).displayLatex as string;
      expect(q, q).toMatch(sym.opMul); expect(q, q).not.toMatch(sym.opDiv); expect(q, q).not.toMatch(sym.opSub);
    }
  });
  it("with every Focus on, an operation set that only suits one Focus uses that Focus", () => {
    const all = { basic: true, chain: true, mixed: true };
    for (let i = 0; i < 80; i++) {
      const q = generateQuestion("evaluate", "level1", {}, "", msv(["opAdd", "opSub"], all)).displayLatex as string;
      expect(q, q).not.toMatch(sym.opMul); expect(q, q).not.toMatch(sym.opDiv);
    }
  });
  it("an impossible combination still produces a valid question; all four ticked changes nothing", () => {
    for (let i = 0; i < 20; i++) {
      expect(generateQuestion("evaluate", "level1", {}, "", msv(["opAdd"], only("chain"))).displayLatex).toBeTruthy();
      expect(generateQuestion("evaluate", "level1", {}, "", msv([], only("basic"))).displayLatex).toBeTruthy();
    }
  });
  it("every level honours a + − only restriction where a shape allows it", () => {
    const { opsUsed } = __test.engine;
    for (const [lvl, fam] of [["level1", "chain"], ["level2", "brackets"], ["level2", "indices"], ["level3", "roots"]] as const) {
      const b = buildEval(lvl, fam, "whole", new Set(["+", "-"]));
      expect(b, `${lvl} ${fam}`).toBeTruthy();
      expect([...opsUsed(b!.ast)].every((o: string) => o === "+" || o === "-")).toBe(true);
    }
  });

  it("unticking × ÷ greys out × ÷ before + − and Both; unticking + − greys out the same two; Left to right stays", async () => {
    const { unmetRequires, maskUnmetOptions } = await import("../shared");
    const pools = [__test.engine.EVAL_POOLS.level1.focus, __test.engine.EVAL_POOLS.level1.ops];
    const all = { basic: true, chain: true, mixed: true, opAdd: true, opSub: true, opMul: true, opDiv: true };
    const unmet = (vals: Record<string, boolean>) => pools[0].options.filter((o: any) => unmetRequires(o.requires, vals).length).map((o: any) => o.value);
    expect(unmet(all)).toEqual([]);
    expect(unmet({ ...all, opMul: false, opDiv: false })).toEqual(["basic", "mixed"]);
    expect(unmet({ ...all, opAdd: false, opSub: false })).toEqual(["basic", "mixed"]);
    expect(unmet({ ...all, opMul: false })).toEqual([]);                      // ÷ still gives both pairs
    expect(unmet({ ...all, opMul: false, opDiv: false, opSub: false })).toEqual(["basic", "chain", "mixed"]);   // only + left
    // masked values drop the greyed options but keep the teacher's tick otherwise
    const masked = maskUnmetOptions(pools, { ...all, opMul: false, opDiv: false });
    expect(masked).toMatchObject({ basic: false, mixed: false, chain: true });
    // never empties a pool
    expect(maskUnmetOptions(pools, { basic: true, chain: false, mixed: false, opAdd: true, opSub: false, opMul: false, opDiv: false }).basic).toBe(true);
    // and generation follows: only Left to right questions come out
    for (let i = 0; i < 40; i++) {
      const q = generateQuestion("evaluate", "level1", {}, "", { ...all, opMul: false, opDiv: false }).displayLatex as string;
      expect(q, q).not.toMatch(/\\times|\\div/);
    }
  });
});

describe("Board-style working: underline the move, left-to-right arrow over a run", () => {
  it("3 + 5 × 2 − 9: underline 5 × 2, then an arrow over 3 + 10 − 9, then 13 − 9, then 4", () => {
    const run = runSteps(E(3, "+", 5, "*", 2, "-", 9))!;
    const before = run.steps.map((s) => texBody(s.before, s.hl));
    expect(before[0]).toBe("3 + \\textcolor{#1e3a8a}{\\underline{5 \\times 2}} - 9");   // no arrow: one multiplication
    expect(before[1]).toBe("\\overrightarrow{\\vphantom{\\big(}\\textcolor{#1e3a8a}{\\underline{3 + 10}} - 9}"); // run of + −: arrow over it
    expect(before[2]).toBe("\\textcolor{#1e3a8a}{\\underline{13 - 9}}");                    // one operation left: no arrow
    expect(texBody(run.steps[2].after, NO_HL)).toBe("4");
    expect(run.final).toBe(4);
  });
  it("a × ÷ run gets the arrow over just that run; a lone operation never does", () => {
    const run = runSteps(E(2, "+", 24, "/", 4, "*", 2))!;
    expect(texBody(run.steps[0].before, run.steps[0].hl)).toBe("2 + \\overrightarrow{\\vphantom{\\big(}\\textcolor{#1e3a8a}{\\underline{24 \\div 4}} \\times 2}");
    const lone = runSteps(E(3, "+", 5, "*", 2))!;
    expect(texBody(lone.steps[0].before, lone.steps[0].hl)).not.toContain("overrightarrow");
  });
});

