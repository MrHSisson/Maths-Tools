// Order of Operations — the Times tables option. "Within 12 × 12" keeps every calculation inside the multiplication grid
// (so a printed grid is enough); "12 × 12 + stretch" also allows a two-digit number × 2, 3, 4 or 5 (36 × 3), fairly often.
import { describe, expect, it } from "vitest";
import { __test } from "../tools/Number/OrderOfOperations";

const { E, P, R, buildEval, genInsert, drawMistake, ttVerdict, ttCheck, EVAL_POOLS, MISTAKES_BY_LEVEL } = __test.engine;
const { generateQuestion } = __test as any;

const FAMILIES = Object.keys(EVAL_POOLS).flatMap((l) => (EVAL_POOLS as any)[l].focus.options.map((o: any) => [l, o.value] as const));
const LEVELS = ["level1", "level2", "level3"] as const;

describe("the grid rule", () => {
  const ok = (ast: any, mode: "strict" | "stretch" = "strict") => ttCheck(ast, mode).ok;
  it("× stays within 12 × 12", () => {
    expect(ok(E(12, "*", 12))).toBe(true);
    expect(ok(E(13, "*", 2))).toBe(false);
    expect(ok(E(7, "*", 0.5))).toBe(false); // whole numbers only
  });
  it("÷ is a fact from the grid: divisor and answer 12 or under", () => {
    expect(ok(E(144, "/", 12))).toBe(true);
    expect(ok(E(96, "/", 2))).toBe(false); // 48 isn't on the grid
    expect(ok(E(36, "/", 3))).toBe(true); // 3 × 12 is on the grid
    expect(ok(E(36, "/", 2))).toBe(false); // 18 is not
  });
  it("squares to 12², cubes to 4³, roots of the squares to 144", () => {
    expect(ok(E(P(12, 2), "+", 1))).toBe(true);
    expect(ok(E(P(13, 2), "+", 1))).toBe(false);
    expect(ok(E(P(4, 3), "+", 1))).toBe(true);
    expect(ok(E(P(5, 3), "+", 1))).toBe(false);
    expect(ok(E(R(144), "+", 1))).toBe(true);
    expect(ok(E(R(150), "+", 1))).toBe(false);
  });
  it("a stretch product is a two-digit number × 2, 3, 4 or 5, and only in stretch mode", () => {
    expect(ok(E(36, "*", 3), "strict")).toBe(false);
    expect(ttCheck(E(36, "*", 3), "stretch")).toEqual({ ok: true, stretch: 1 });
    expect(ok(E(36, "*", 5), "stretch")).toBe(true);
    expect(ok(E(36, "*", 6), "stretch")).toBe(false);
    expect(ok(E(36, "*", 12), "stretch")).toBe(false);
    expect(ok(E(100, "*", 3), "stretch")).toBe(false);
  });
});

describe("generation honours the rule at every Focus", () => {
  for (const mode of ["strict", "stretch"] as const)
    for (const [level, family] of FAMILIES)
      for (const nm of level === "level1" ? ["whole"] : ["whole", "negatives"])
        it(`${mode} · ${level} · ${family} · ${nm}`, () => {
          let made = 0;
          for (let i = 0; i < 25; i++) {
            const b = buildEval(level as any, family as any, nm as any, undefined, mode);
            if (!b) continue;
            made++;
            const v = ttCheck(b.ast, mode);
            expect(v.ok).toBe(true);
            if (mode === "strict") expect(v.stretch).toBe(0);
          }
          expect(made, "the pool is not starved").toBeGreaterThanOrEqual(20);
        });

  it("stretch mode really does produce stretch questions, a good share of them", () => {
    let withStretch = 0, total = 0;
    for (const [level, family] of FAMILIES) for (let i = 0; i < 20; i++) {
      const b = buildEval(level as any, family as any, "whole", undefined, "stretch");
      if (!b) continue;
      total++;
      if (ttCheck(b.ast, "stretch").stretch > 0) withStretch++;
    }
    expect(withStretch / total).toBeGreaterThan(0.2);
    expect(withStretch / total).toBeLessThan(0.8); // and most are still plain grid questions
  });
});

describe("the other question types", () => {
  it("Spot the mistake: the right AND the student's wrong working stay on the grid", () => {
    for (const level of LEVELS) for (const id of MISTAKES_BY_LEVEL[level]) for (let i = 0; i < 10; i++) {
      const msv: Record<string, boolean> = { ttStrict: true };
      for (const m of MISTAKES_BY_LEVEL[level]) msv[m] = m === id;
      // A draw can come back empty (about 1 in 700 for Level 1 "mulFirst" on the grid: nothing fitted in 400 tries); the question then falls back
      // to an Evaluate question, so the test asks for a mistake within a few draws rather than at the first.
      let d = drawMistake(level, msv);
      for (let k = 0; k < 5 && !d; k++) d = drawMistake(level, msv);
      expect(d, `${level} ${id}`).not.toBeNull();
      expect(ttCheck(d!.ast, "strict").ok).toBe(true);
      const log: any[] = [];
      d!.def.wrong(d!.ast, log);
      expect(ttVerdict(log, "strict").ok).toBe(true);
    }
  });
  it("Insert brackets stays on the grid", () => {
    for (const level of ["level2", "level3"] as const) for (let i = 0; i < 15; i++) {
      const d = genInsert(level, "strict");
      expect(d, level).not.toBeNull();
      expect(ttCheck(d!.bracketed, "strict").ok && ttCheck(d!.flat, "strict").ok).toBe(true);
    }
  });
  it("generateQuestion with each mode returns a question for every sub-tool and level, with no decimals", () => {
    for (const tool of ["evaluate", "fixIt"]) for (const level of LEVELS) for (const tt of ["ttStrict", "ttStretch"]) for (let i = 0; i < 15; i++) {
      const q = generateQuestion(tool, level, {}, "", { [tt]: true, ttOff: false, decimals: false });
      expect(JSON.stringify(q.lines ?? q.displayLatex)).not.toMatch(/\d\.\d/);
    }
  });
});
