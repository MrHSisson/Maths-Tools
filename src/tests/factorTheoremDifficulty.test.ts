// Factor Theorem — difficulty is scored from the question itself. `CALIBRATE=1 npx vitest run src/tests/factorTheoremDifficulty.test.ts`
// rewrites the band table and docs/calibration/FACTOR_THEOREM_DIFFICULTY.md.
import { __test } from "../tools/Algebra/FactorTheorem";
import { BANDS } from "../tools/Algebra/FactorTheorem.calibration";
import { calibrationTests } from "./calibrationKit";

calibrationTests({
  name: "Factor Theorem",
  config: __test.TOOL_CONFIG,
  generate: __test.generateQuestion as never,
  bands: BANDS,
  tableFile: "src/tools/Algebra/FactorTheorem.calibration.ts",
  reportFile: "docs/calibration/FACTOR_THEOREM_DIFFICULTY.md",
  regenerate: "CALIBRATE=1 npx vitest run src/tests/factorTheoremDifficulty.test.ts",
  rubric: [
    "## How a question is scored", "",
    "The raw score is the work the question asks for, added up — **not** a weight on the option that produced it. Higher = harder.", "",
    "| Piece | Cost |", "|---|---|",
    "| Start | 0.5 |",
    "| Each step of the working | 0.35 |",
    "| Size of the numbers | 1 × log₁₀(biggest number in the question + 1) |",
    "| What is asked | is it a factor 0 · factorise 1 · show the factor then solve 1.5 · find an unknown 2 · find a factor then factorise 2.5 · only one real root 2.5 · find a factor then solve 3 · exact (surd) roots 3 · two unknowns 3.5 · a factor with k 3.5 · quartic 4 · a factor with a 4 |",
  ].join("\n"),
});
