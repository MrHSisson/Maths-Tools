// Shared checks for a calibrated tool (src/shared/calibration.ts). A tool's own test calls `calibrationTests` with its config, generator,
// committed band table and rubric text; `CALIBRATE=1 npx vitest run <test file>` then rewrites the band table and the report.
import { describe, expect, it } from "vitest";
import { bandFor, buildBandTable, bandTableSource, calibrationReport, sampleCalibration, calibrationKey, randomSetup, type BandTable, type ToolConfig, type AnyQuestion, type DifficultyLevel } from "../shared";

// (no @types/node here: reach Node through the global `process`)
const nodeProcess = (globalThis as unknown as { process?: { env?: Record<string, string | undefined>; getBuiltinModule?: (m: string) => { writeFileSync: (p: string, d: string) => void } } }).process;
const CALIBRATE = !!nodeProcess?.env?.CALIBRATE;
const writeFileSync = (path: string, data: string) => nodeProcess?.getBuiltinModule?.("fs").writeFileSync(path, data);

type Generate = (tool: string, level: DifficultyLevel, variables: Record<string, boolean>, dropdownValue: string, multiSelectValues?: Record<string, boolean>) => AnyQuestion;
type Q = { _rawDifficulty?: number; _category?: string; _difficultyScore?: number };

interface CalibrationSpec {
  /** Display name for the report title and test names. */
  name: string;
  config: ToolConfig;
  generate: Generate;
  bands: BandTable;
  /** Where the generated band table is written, e.g. "src/tools/Number/DecimalAddSub.calibration.ts". */
  tableFile: string;
  /** Where the report is written, e.g. "docs/calibration/DECIMAL_ADD_SUB_DIFFICULTY.md". */
  reportFile: string;
  /** The `CALIBRATE=1 npx vitest run …` line printed in both generated files. */
  regenerate: string;
  /** Markdown table / text describing how a question is scored. */
  rubric: string;
}

const cellsOf = (config: ToolConfig): { subTool: string; level: DifficultyLevel }[] =>
  Object.keys(config.tools).flatMap(subTool => (config.tools[subTool].levels ?? ["level1", "level2", "level3"] as DifficultyLevel[]).map(level => ({ subTool, level })));

export function calibrationTests(spec: CalibrationSpec): void {
  const { name, config, generate, bands } = spec;
  const cells = cellsOf(config);
  const bandIn = (subTool: string, level: DifficultyLevel, raw: number) => bandFor(bands[calibrationKey(subTool, level)] ?? [], raw);

  describe(`${name} calibration`, () => {
    it("the tool's config says it is calibrated (so the Worksheet shows the Smart Progressor switch)", () => {
      expect(config.calibrated).toBe(true);
    });
    it("every sub-tool × level has a table of seven rising cut points", () => {
      for (const { subTool, level } of cells) {
        const cuts = bands[calibrationKey(subTool, level)];
        expect(cuts, `${subTool} ${level}`).toHaveLength(7);
        expect([...cuts].sort((a, b) => a - b)).toEqual(cuts);
      }
    });
    it("every generated question carries its raw score, category and band (1–8)", () => {
      for (const { subTool, level } of cells) for (let i = 0; i < 25; i++) {
        const s = randomSetup(config, subTool, level);
        const q = generate(subTool, level, s.variables, s.dropdownValue, s.multiSelectValues) as unknown as Q;
        expect(typeof q._rawDifficulty, `${subTool} ${level}`).toBe("number");
        expect(typeof q._category).toBe("string");
        expect(Number.isInteger(q._difficultyScore), `${subTool} ${level}`).toBe(true);
        expect(q._difficultyScore).toBeGreaterThanOrEqual(1);
        expect(q._difficultyScore).toBeLessThanOrEqual(8);
        expect(q._difficultyScore).toBe(bandIn(subTool, level, q._rawDifficulty!));
      }
    });
    it("a fresh 1000+ sample over random option combinations uses (nearly) every band, none hogging", () => {
      const rows = sampleCalibration(config, generate, 1000);
      for (const { subTool, level } of cells) {
        const xs = rows.filter(r => r.subTool === subTool && r.level === level);
        expect(xs.length, `${subTool} ${level}`).toBeGreaterThanOrEqual(900);
        // scores can be lumpy (few distinct values at the easy end), so a band may be thin; most must be used and none may hog
        const shares = Array.from({ length: 8 }, (_, i) => xs.filter(r => bandIn(subTool, level, r.raw) === i + 1).length / xs.length);
        const distinct = new Set(xs.map(r => r.raw)).size;   // a level with few kinds of question can only fill that many bands
        expect(shares.filter(x => x > 0.04).length, `${subTool} ${level} ${shares.map(x => x.toFixed(2))}`).toBeGreaterThanOrEqual(Math.min(4, distinct));
        // identical scores can't be split across bands, so a band may hold the biggest tie plus a little
        const tie = Math.max(...[...new Set(xs.map(r => r.raw))].map(v => xs.filter(r => r.raw === v).length)) / xs.length;
        expect(Math.max(...shares), `${subTool} ${level} ${shares.map(x => x.toFixed(2))}`).toBeLessThan(Math.max(0.4, tie + 0.1));
      }
    }, 120_000);
  });

  describe.runIf(CALIBRATE)(`${name} calibration run`, () => {
    it(`writes ${spec.tableFile} and ${spec.reportFile} from 1500 questions per sub-tool × level`, () => {
      const rows = sampleCalibration(config, generate, 1500);
      const table = buildBandTable(rows);
      writeFileSync(spec.tableFile, bandTableSource(table, spec.regenerate));
      writeFileSync(spec.reportFile, calibrationReport(name, rows, table, spec.regenerate, spec.rubric));
      expect(Object.keys(table)).toHaveLength(cells.length);
    }, 300_000);
  });
}
