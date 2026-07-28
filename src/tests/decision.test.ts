// ─────────────────────────────────────────────────────────────────────────────
// Decision Maths __problem contract tests — the analog of generators.test.ts /
// cs-topics.test.ts. Every Decision tool that exports `__problem` is discovered and
// run through validateProblem, so authoring-as-data mistakes fail at CI:
//   • templates sample to a network whose edges reference real nodes;
//   • sampled weights fall in their declared ranges;
//   • the sampled network is connected;
//   • every SolveStep references edges/cells that exist;
//   • solve()'s running total AND the declared answer both match an INDEPENDENT
//     brute-force MST (Prim's, in validate.ts) — what makes generate-fast safe.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, expect, it } from "vitest";
import { validateProblem } from "../shared/decision";
import type { DecisionProblemExport } from "../shared/decision";

// Discover every Decision tool exporting a `__problem`. Modules must import cleanly
// under node — a broken tool surfaces as an import failure below.
const moduleLoaders = import.meta.glob("../tools/Decision/**/*.tsx");
const problems: [string, DecisionProblemExport][] = [];
const importFailures: [string, unknown][] = [];
for (const [path, load] of Object.entries(moduleLoaders)) {
  try {
    const mod = (await load()) as { __problem?: DecisionProblemExport };
    if (mod.__problem) problems.push([path, mod.__problem]);
  } catch (e) {
    importFailures.push([path, e]);
  }
}

describe("Decision problem discovery", () => {
  it("imports every Decision tool module", () => {
    const msgs = importFailures.map(([p, e]) => `${p}: ${(e as Error).message}`);
    expect(msgs).toEqual([]);
  });
  it("finds at least the MST tool", () => {
    expect(problems.length).toBeGreaterThanOrEqual(1);
  });
});

for (const [path, exp] of problems) {
  describe(`${path}`, () => {
    it("is a well-formed Decision problem (validateProblem)", () => {
      expect(validateProblem(exp)).toEqual([]);
    });
  });
}
