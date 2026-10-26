// Partial Fractions — difficulty is scored from the question itself. `CALIBRATE=1 npx vitest run src/tests/partialFractionsDifficulty.test.ts`
// rewrites the band table and docs/calibration/PARTIAL_FRACTIONS_DIFFICULTY.md.
import { __test } from "../tools/Algebra/PartialFractions";
import { BANDS } from "../tools/Algebra/PartialFractions.calibration";
import { calibrationTests } from "./calibrationKit";

calibrationTests({
  name: "Partial Fractions",
  config: __test.TOOL_CONFIG,
  generate: __test.generateQuestion as never,
  bands: BANDS,
  tableFile: "src/tools/Algebra/PartialFractions.calibration.ts",
  reportFile: "docs/calibration/PARTIAL_FRACTIONS_DIFFICULTY.md",
  regenerate: "CALIBRATE=1 npx vitest run src/tests/partialFractionsDifficulty.test.ts",
  rubric: [
    "## How a question is scored", "",
    "The raw score is the work the question asks for, added up — **not** a weight on the option that produced it. Higher = harder.", "",
    "| Piece | Cost |", "|---|---|",
    "| Start | 1 |",
    "| Each partial fraction to find | 1 |",
    "| A repeated factor | +1.5 |",
    "| Each factor with a coefficient on x (px + q) | +0.8 |",
    "| A negative x term (a − bx) | +0.8 |",
    "| Fractional constants | +1.2 |",
    "| Denominator shown expanded | +0.7 |",
    "| A division first | +1.5, +0.5 per extra term of the quotient |",
    "| Size of the numbers | 0.8 × log₁₀(biggest coefficient + 1) |",
  ].join("\n"),
});
