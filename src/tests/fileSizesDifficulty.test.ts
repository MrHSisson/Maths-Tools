// File Sizes — difficulty is scored from the question itself. `CALIBRATE=1 npx vitest run src/tests/fileSizesDifficulty.test.ts`
// rewrites the band table and docs/calibration/FILE_SIZES_DIFFICULTY.md.
import { __test } from "../tools/Binary/FileSizes";
import { BANDS } from "../tools/Binary/FileSizes.calibration";
import { calibrationTests } from "./calibrationKit";

calibrationTests({
  name: "File Sizes",
  config: __test.TOOL_CONFIG,
  generate: __test.generateQuestion as never,
  bands: BANDS,
  tableFile: "src/tools/Binary/FileSizes.calibration.ts",
  reportFile: "docs/calibration/FILE_SIZES_DIFFICULTY.md",
  regenerate: "CALIBRATE=1 npx vitest run src/tests/fileSizesDifficulty.test.ts",
  rubric: [
    "## How a question is scored", "",
    "The raw score is the work the question asks for, added up — **not** a weight on the option that produced it. Higher = harder.", "",
    "| Piece | Cost |", "|---|---|",
    "| Start | 0.5 |",
    "| Each step of the working | 0.6 |",
    "| Each unit conversion (bits ↔ bytes ↔ KB ↔ MB) | 1.4 |",
    "| The biggest number in the question | 0.4 per digit beyond the first |",
    "| What is asked | find a size or colours from bits 0 · compare ASCII/Unicode, fewest bits 1 · can n bits store, several images, logo 1.5 · find the characters or bits per character 2 · find the colour depth or pixels 2.5 |",
  ].join("\n"),
});
