// Indices — difficulty is scored from the question itself. `CALIBRATE=1 npx vitest run src/tests/indicesDifficulty.test.ts`
// rewrites the band table and docs/calibration/INDICES_DIFFICULTY.md.
import { __test } from "../tools/Number/Indices";
import { BANDS } from "../tools/Number/Indices.calibration";
import { calibrationTests } from "./calibrationKit";

calibrationTests({
  name: "Indices",
  config: (__test as any).TOOL_CONFIG,
  generate: (__test as any).generateQuestion,
  bands: BANDS,
  tableFile: "src/tools/Number/Indices.calibration.ts",
  reportFile: "docs/calibration/INDICES_DIFFICULTY.md",
  regenerate: "CALIBRATE=1 npx vitest run src/tests/indicesDifficulty.test.ts",
  rubric: [
    "## How a question is scored", "",
    "The raw score is the work the question asks for, added up — **not** a weight on the option that produced it. Higher = harder.", "",
    "| Piece | Cost |", "|---|---|",
    "| Start | 0.5 |",
    "| Each step of the working | 0.35 |",
    "| Size of the numbers | 1 × log₁₀(biggest number in the question + 1) |",
    "| Roots | 0.8 each (up to 2) |",
    "| A negative index | +1 |",
    "| Fractions | +0.9 |",
    "| Brackets | 0.5 each (up to 3) |",
    "| Letters | 0.4 per different letter (up to 3) |",
  ].join("\n"),
});
