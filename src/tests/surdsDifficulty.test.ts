// Surds — difficulty is scored from the question itself. `CALIBRATE=1 npx vitest run src/tests/surdsDifficulty.test.ts`
// rewrites the band table and docs/calibration/SURDS_DIFFICULTY.md.
import { __test } from "../tools/Number/Surds";
import { BANDS } from "../tools/Number/Surds.calibration";
import { calibrationTests } from "./calibrationKit";

calibrationTests({
  name: "Surds",
  config: __test.TOOL_CONFIG,
  generate: __test.generateQuestion as never,
  bands: BANDS,
  tableFile: "src/tools/Number/Surds.calibration.ts",
  reportFile: "docs/calibration/SURDS_DIFFICULTY.md",
  regenerate: "CALIBRATE=1 npx vitest run src/tests/surdsDifficulty.test.ts",
  rubric: [
    "## How a question is scored", "",
    "The raw score is the work the question asks for, added up — **not** a weight on the option that produced it. Higher = harder.", "",
    "| Piece | Cost |", "|---|---|",
    "| Start | 0.5 |",
    "| Each step of the working | 0.35 |",
    "| Size of the numbers | 0.9 × log₁₀(biggest number in the question + 1) |",
    "| Surds in the question | 0.4 each (up to 5) |",
    "| Brackets | 0.6 each (up to 2) |",
    "| A fraction | +1 |",
    "| Letters | 0.5 per different letter (up to 2) |",
  ].join("\n"),
});
