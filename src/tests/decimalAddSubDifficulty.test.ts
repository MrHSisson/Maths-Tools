// Decimal Add/Sub — difficulty is scored from the question itself. `CALIBRATE=1 npx vitest run src/tests/decimalAddSubDifficulty.test.ts`
// rewrites the band table and docs/calibration/DECIMAL_ADD_SUB_DIFFICULTY.md.
import { describe, expect, it } from "vitest";
import { __test } from "../tools/Number/DecimalAddSub";
import { BANDS } from "../tools/Number/DecimalAddSub.calibration";
import { calibrationTests } from "./calibrationKit";

const REGEN = "CALIBRATE=1 npx vitest run src/tests/decimalAddSubDifficulty.test.ts";
const RUBRIC = [
  "## How a question is scored", "",
  "The raw score is the work the question asks for, added up — **not** a weight on the option that produced it. Higher = harder.", "",
  "| Piece | Cost |", "|---|---|",
  "| Start | 0.8 |",
  "| Decimal places | 0.6 per place of the longest number |",
  "| Whole-number digits | 0.5 per digit beyond the first |",
  "| Carries (adding) / exchanges (subtracting) | 1.2 each (up to 5) |",
  "| Different lengths (a placeholder 0 is needed) | +1.2 |",
  "| A whole-number operand | +0.8 |",
  "| An exchange that travels across a zero | +1.5 |",
].join("\n");

calibrationTests({
  name: "Decimal Add/Sub",
  config: __test.TOOL_CONFIG,
  generate: __test.generateQuestion as never,
  bands: BANDS,
  tableFile: "src/tools/Number/DecimalAddSub.calibration.ts",
  reportFile: "docs/calibration/DECIMAL_ADD_SUB_DIFFICULTY.md",
  regenerate: REGEN,
  rubric: RUBRIC,
});

describe("the rubric orders questions the way a teacher would", () => {
  const g = __test.generateQuestion as never as (...a: unknown[]) => { _rawDifficulty: number };
  const mean = (tool: string, level: string, ms: Record<string, boolean>) => { let t = 0; for (let i = 0; i < 80; i++) t += g(tool, level, {}, "", ms)._rawDifficulty; return t / 80; };
  it("more carries make an addition harder (Level 2)", () => {
    const only = (x: string) => ({ x1: x === "x1", x2: x === "x2", x3: x === "x3" });
    expect(mean("add", "level2", only("x1"))).toBeLessThan(mean("add", "level2", only("x3")));
  });
  it("each level is harder than the one below", () => {
    for (const tool of ["add", "subtract"]) {
      expect(mean(tool, "level1", {})).toBeLessThan(mean(tool, "level3", {}));
    }
  });
});
