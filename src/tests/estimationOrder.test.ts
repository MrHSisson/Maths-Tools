import { describe, it, expect } from "vitest";
import { evalOrder, orderQuestion, parseOrder, roundOrder } from "../shared/estimationOrder";
import { __test } from "../tools/Number/Estimation";

describe("estimating with the order of operations", () => {
  it("parses with the right precedence and rounds each number to 1 s.f.", () => {
    expect(evalOrder(roundOrder(parseOrder("38 + 21 * 42")))).toBe(40 + 20 * 40);
    expect(evalOrder(roundOrder(parseOrder("(38 + 21) * 42")))).toBe((40 + 20) * 40);
    expect(evalOrder(roundOrder(parseOrder("7.8 ^ 2 + 19")))).toBe(64 + 20);
    expect(evalOrder(roundOrder(parseOrder("(48 - 19) ^ 2")))).toBe(900);
    expect(evalOrder(roundOrder(parseOrder("486 / 21 - 14")))).toBe(500 / 20 - 10);
  });
  it("works the inner operation first, then the outer, with the matching labels", () => {
    const q = orderQuestion("38 + 21 * 42", "level1");
    expect(q.answer).toBe("840");
    expect(q.working.map((s) => s.label)).toEqual(["Original:", "Round to 1 s.f.:", "Multiply first:", "Then add:"]);
    const b = orderQuestion("(38 + 21) * 42", "level2");
    expect(b.answer).toBe("2,400");
    expect(b.working.map((s) => s.label)).toEqual(["Original:", "Round to 1 s.f.:", "Brackets first:", "Then multiply:"]);
    expect(orderQuestion("7.8 ^ 2 + 19", "level3").working.map((s) => s.label)).toContain("Square first:");
  });
  it("every generated question has a whole-number or 1 d.p. answer that matches its working", () => {
    const cfg = __test.TOOL_CONFIG.tools.orderOfOperations;
    expect(cfg).toBeTruthy();
    for (const level of ["level1", "level2", "level3"] as const) {
      for (let i = 0; i < 60; i++) {
        const q = __test.generateQuestion("orderOfOperations", level, {}, "", {});
        const text = (q as { display: string }).display.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/²/g, "^2").replace(/,/g, "");
        expect(String(evalOrder(roundOrder(parseOrder(text))))).toBe(q.answer.replace(/,/g, ""));
      }
    }
  });
});
