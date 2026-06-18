// Regression guard for the subtraction-case classification in Collecting Like
// Terms. "Crossing zero" is a property of a group's RUNNING TOTAL in display
// order, not of the final answer, so we re-parse the displayed expression back
// into per-group ordered coefficients and assert the partial sums obey the case:
//   • subtractionPositive — every partial sum stays > 0, with a real subtraction
//   • crossingZero        — partial sums genuinely cross zero, and BOTH
//                           directions (positive and negative results) occur.

import { describe, it, expect } from "vitest";
import { __test } from "../tools/Algebra/CollectingLikeTerms";

const { generateQuestion } = __test;

// Parse "4s^{2} + 6t - 9t - 2x" → Map(groupKey → coeffs in display order).
function groupsFromDisplay(display: string): Map<string, number[]> {
  const norm = display.replace(/\s*([+-])\s*/g, " $1").trim();
  const toks = norm.split(/\s+(?=[+-]?\d|[+-]?[a-z])/i).filter(Boolean);
  const groups = new Map<string, number[]>();
  for (const raw of toks) {
    const tok = raw.replace(/\s+/g, "");
    const m = tok.match(/^([+-]?)(\d*)(.*)$/);
    if (!m) continue;
    const coef = (m[1] === "-" ? -1 : 1) * (m[2] === "" ? 1 : parseInt(m[2], 10));
    const key = m[3] === "" ? "const" : m[3];
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(coef);
  }
  return groups;
}

const partials = (cs: number[]) => { let s = 0; return cs.map((c) => (s += c)); };
const crosses = (cs: number[]) => { const p = partials(cs); return Math.min(...p) < 0 && Math.max(...p) > 0; };
const staysPositive = (cs: number[]) => Math.min(...partials(cs)) > 0;

const TOOLS = ["subtool2", "subtool3"] as const;
const LEVELS = ["level1", "level2", "level3"] as const;

// All term-type flavours on so square / constant / three-variable groups are
// exercised too; the case under test is the only active subtraction case.
const base = {
  includeConstant: true, includeSquare: true, threeVariables: true,
  includeCubicQuartic: true, noCoefficients: false, split22: true, split31: true,
};

function run(caseKey: "subtractionPositive" | "crossingZero") {
  const ms = {
    ...base,
    positiveOnly: false,
    subtractionPositive: caseKey === "subtractionPositive",
    crossingZero: caseKey === "crossingZero",
  };
  let pos = 0, neg = 0, checked = 0;
  for (const tool of TOOLS) {
    for (const level of LEVELS) {
      for (let i = 0; i < 50; i++) {
        const q = generateQuestion(tool, level, {}, "", ms) as { display: string };
        for (const [, cs] of groupsFromDisplay(q.display)) {
          if (cs.length < 2) continue;          // singletons can't cross
          checked++;
          const sum = cs.reduce((a, b) => a + b, 0);
          if (sum > 0) pos++; else if (sum < 0) neg++;
          if (caseKey === "subtractionPositive") {
            expect(staysPositive(cs), `stay-positive violated: "${q.display}" group=[${cs}]`).toBe(true);
            expect(cs.some((c) => c < 0), `needs a subtraction: "${q.display}"`).toBe(true);
          } else {
            expect(crosses(cs), `must cross zero: "${q.display}" group=[${cs}]`).toBe(true);
          }
        }
      }
    }
  }
  return { pos, neg, checked };
}

describe("Collecting Like Terms — subtraction cases", () => {
  it("subtraction (stays positive) never crosses zero, always positive result", () => {
    const { neg, checked } = run("subtractionPositive");
    expect(checked).toBeGreaterThan(100);
    expect(neg, "no group should produce a negative result").toBe(0);
  });

  it("crossing zero genuinely crosses, in both directions", () => {
    const { pos, neg, checked } = run("crossingZero");
    expect(checked).toBeGreaterThan(100);
    expect(pos, "up-crosses (positive results) must occur").toBeGreaterThan(0);
    expect(neg, "down-crosses (negative results) must occur").toBeGreaterThan(0);
  });
});
