// Speed, Distance, Time — difficulty is scored from the question itself. `CALIBRATE=1 npx vitest run src/tests/speedDistanceTimeDifficulty.test.ts`
// rewrites the band table and docs/calibration/SPEED_DISTANCE_TIME_DIFFICULTY.md.
import { __test } from "../tools/Proportion/SpeedDistanceTime";
import { BANDS } from "../tools/Proportion/SpeedDistanceTime.calibration";
import { calibrationTests } from "./calibrationKit";

calibrationTests({
  name: "Speed, Distance, Time",
  config: __test.TOOL_CONFIG,
  generate: __test.generateQuestion as never,
  bands: BANDS,
  tableFile: "src/tools/Proportion/SpeedDistanceTime.calibration.ts",
  reportFile: "docs/calibration/SPEED_DISTANCE_TIME_DIFFICULTY.md",
  regenerate: "CALIBRATE=1 npx vitest run src/tests/speedDistanceTimeDifficulty.test.ts",
  rubric: [
    "## How a question is scored", "",
    "The raw score is the work the question asks for, added up — **not** a weight on the option that produced it. Higher = harder.", "",
    "| Piece | Cost |", "|---|---|",
    "| Start | 1 |",
    "| The time | whole hours 0 · minutes (30 min) 1.5 · compound (1 hr 30) 3 · awkward minutes (40 min) 3.5 |",
    "| Scaling steps in the ratio table | 0.8 each (a ÷ then a ×) |",
    "| A decimal in the numbers | +1.5 |",
    "| Size of the numbers | 1.2 × log₁₀(the larger of distance and speed) + 0.6 × log₁₀(the smaller + 1) |",
    "| Asking for the time | +0.5 |",
  ].join("\n"),
});
