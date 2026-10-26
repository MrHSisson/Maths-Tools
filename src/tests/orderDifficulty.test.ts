// Order of Operations — difficulty is scored from the question itself (difficultyOf), not from the options that made it.
// These tests pin the ordering the rubric must give, and `CALIBRATE=1 npx vitest run src/tests/orderDifficulty.test.ts`
// regenerates docs/calibration/ORDER_OF_OPERATIONS_DIFFICULTY.md from a few thousand generated questions.
import { describe, expect, it } from "vitest";
// (no @types/node here: reach Node through the global `process`)
const nodeProcess = (globalThis as unknown as { process?: { env?: Record<string, string | undefined>; getBuiltinModule?: (m: string) => { writeFileSync: (p: string, d: string) => void } } }).process;
const CALIBRATE = !!nodeProcess?.env?.CALIBRATE;
const writeFileSync = (path: string, data: string) => nodeProcess?.getBuiltinModule?.("fs").writeFileSync(path, data);
import { __test } from "../tools/Number/OrderOfOperations";

import { BANDS } from "../tools/Number/OrderOfOperations.calibration";
import { bandFor, buildBandTable, bandTableSource, calibrationReport, sampleCalibration, calibrationKey, quantileCuts, randomSetup } from "../shared";

const { E, P, N, texBody, NO_HL, buildEval, difficultyOf, difficultySignature, EVAL_POOLS } = __test.engine;
const TOOL_CONFIG = (__test as any).TOOL_CONFIG;
const { generateQuestion } = __test as any;
const score = (ast: any) => difficultyOf(ast);

describe("the rubric orders questions the way a teacher would", () => {
  const harderThan: Array<[string, any, string, any]> = [
    ["(11 × 9) − (12 × 7)", E(E(11, "*", 9), "-", E(12, "*", 7)), "9 ÷ 3 + 2", E(9, "/", 3, "+", 2)],
    ["(11 × 6) − (9 × 4)", E(E(11, "*", 6), "-", E(9, "*", 4)), "14 × 2 − 6", E(14, "*", 2, "-", 6)],
    ["8 × 7 + 6 × 9", E(8, "*", 7, "+", 6, "*", 9), "3 × 4 + 2", E(3, "*", 4, "+", 2)],
    ["7 × 8 − 3", E(7, "*", 8, "-", 3), "2 × 3 − 1", E(2, "*", 3, "-", 1)],
    ["72 ÷ 9 + 7 × 6", E(72, "/", 9, "+", 7, "*", 6), "12 ÷ 4 + 2", E(12, "/", 4, "+", 2)],
    ["5 − (−3) × 4", E(5, "-", N(-3), "*", 4), "5 − 3 × 4", E(20, "-", 3, "*", 4)],
    ["4³ − 5", E(P(4, 3), "-", 5), "4² − 5", E(P(4, 2), "-", 5)],
    ["9² + 7 × 8", E(P(9, 2), "+", 7, "*", 8), "2² + 3", E(P(2, 2), "+", 3)],
    ["47 + 38 − 19", E(47, "+", 38, "-", 19), "4 + 3 − 2", E(4, "+", 3, "-", 2)],
  ];
  for (const [hn, h, en, e] of harderThan)
    it(`${hn} is harder than ${en}`, () => expect(score(h)).toBeGreaterThan(score(e)));
});

// A big, even sample: every Focus at every level, whole and negative numbers (and decimals where offered).
function sample(perCell: number) {
  const rows: { level: string; family: string; nm: string; score: number; sig: string; tex: string }[] = [];
  for (const level of ["level1", "level2", "level3"] as const) {
    const pools = (EVAL_POOLS as any)[level];
    const nms = pools.nums ? pools.nums.options.map((o: any) => o.value) : ["whole"];
    for (const f of pools.focus.options) for (const nm of nms) for (let i = 0; i < perCell; i++) {
      const b = buildEval(level, f.value, nm);
      if (!b) continue;
      rows.push({ level, family: f.value, nm, score: difficultyOf(b.ast), sig: difficultySignature(b.ast), tex: texBody(b.ast, NO_HL) });
    }
  }
  return rows;
}

describe("scores spread sensibly across the generated questions", () => {
  const rows = sample(60);
  it("a few thousand questions, with a wide range of scores", () => {
    expect(rows.length).toBeGreaterThan(1000);
    const sc = rows.map((r) => r.score).sort((a, b) => a - b);
    expect(sc[0]).toBeLessThan(4);
    expect(sc[sc.length - 1]).toBeGreaterThan(14);
  });
  it("each level is harder on average than the one below", () => {
    const mean = (l: string) => { const x = rows.filter((r) => r.level === l).map((r) => r.score); return x.reduce((a, b) => a + b, 0) / x.length; };
    expect(mean("level1")).toBeLessThan(mean("level2"));
    expect(mean("level2")).toBeLessThan(mean("level3"));
  });
  it("negatives are harder than whole numbers, and decimals harder still, on average", () => {
    const mean = (nm: string, level: string) => { const x = rows.filter((r) => r.nm === nm && r.level === level).map((r) => r.score); return x.reduce((a, b) => a + b, 0) / x.length; };
    expect(mean("negatives", "level2")).toBeGreaterThan(mean("whole", "level2"));
    expect(mean("negatives", "level3")).toBeGreaterThan(mean("whole", "level3"));
    expect(mean("decimals", "level3")).toBeGreaterThan(mean("whole", "level3"));
  });
});

const LEVELS = ["level1", "level2", "level3"] as const;
const bandIn = (subTool: string, level: string, raw: number) => bandFor(BANDS[calibrationKey(subTool, level as any)] ?? [], raw);

it("the config says the tool is calibrated", () => { expect(TOOL_CONFIG.calibrated).toBe(true); });

describe("the eight bands a worksheet is ordered by (calibrated per sub-tool and level)", () => {
  it("every sub-tool × level has a calibrated table of seven rising cut points", () => {
    for (const subTool of ["evaluate", "fixIt"]) for (const level of LEVELS) {
      const cuts = BANDS[calibrationKey(subTool, level)];
      expect(cuts, `${subTool} ${level}`).toHaveLength(7);
      expect([...cuts].sort((a, b) => a - b)).toEqual(cuts);
    }
  });
  it("a fresh 1000+ sample over random option combinations uses (nearly) every band, none hogging", () => {
    const rows = sampleCalibration(TOOL_CONFIG, generateQuestion, 1000);
    for (const subTool of ["evaluate", "fixIt"]) for (const level of LEVELS) {
      const xs = rows.filter((r) => r.subTool === subTool && r.level === level);
      expect(xs.length).toBeGreaterThanOrEqual(1000);
      // scores are lumpy (few distinct values at the easy end), so a band can be thin or empty — but most must be used and none may hog
      const shares = Array.from({ length: 8 }, (_, i) => xs.filter((r) => bandIn(subTool, level, r.raw) === i + 1).length / xs.length);
      expect(shares.filter((x) => x > 0.04).length, `${subTool} ${level} ${shares.map((x) => x.toFixed(2))}`).toBeGreaterThanOrEqual(6);
      expect(Math.max(...shares), `${subTool} ${level}`).toBeLessThan(0.25);
    }
  }, 60_000);
  it("every generated question carries its raw score, category and band (1–8)", () => {
    for (const tool of ["evaluate", "fixIt"]) for (const level of LEVELS) for (let i = 0; i < 25; i++) {
      const s = randomSetup(TOOL_CONFIG, tool, level);
      const q = generateQuestion(tool, level, s.variables, s.dropdownValue, s.multiSelectValues);
      expect(typeof q._rawDifficulty).toBe("number");
      expect(typeof q._category).toBe("string");
      expect(Number.isInteger(q._difficultyScore), `${tool} ${level}`).toBe(true);
      expect(q._difficultyScore).toBeGreaterThanOrEqual(1);
      expect(q._difficultyScore).toBeLessThanOrEqual(8);
      expect(q._difficultyScore).toBe(bandIn(tool, level, q._rawDifficulty));
    }
  });
  it("(11 × 9) − (12 × 7) is in a higher band than 9 ÷ 3 + 2 at every level", () => {
    for (const level of LEVELS)
      expect(bandIn("evaluate", level, difficultyOf(E(E(11, "*", 9), "-", E(12, "*", 7))))).toBeGreaterThan(bandIn("evaluate", level, difficultyOf(E(9, "/", 3, "+", 2))));
  });
});

describe("the calibration helpers", () => {
  it("quantileCuts gives rising cut points that split a sample into near-equal bands", () => {
    const v = Array.from({ length: 800 }, (_, i) => i / 10);
    const cuts = quantileCuts(v);
    expect(cuts).toHaveLength(7);
    for (let b = 1; b <= 8; b++) expect(v.filter((x) => bandFor(cuts, x) === b).length).toBeGreaterThan(90);
  });
});

describe.runIf(CALIBRATE)("calibration run", () => {
  it("writes the band table and docs/calibration/ORDER_OF_OPERATIONS_DIFFICULTY.md from 1500 questions per sub-tool × level", () => {
    const regen = "CALIBRATE=1 npx vitest run src/tests/orderDifficulty.test.ts";
    const rows = sampleCalibration(TOOL_CONFIG, generateQuestion, 1500);
    const table = buildBandTable(rows);
    writeFileSync("src/tools/Number/OrderOfOperations.calibration.ts", bandTableSource(table, regen).replace('"../../shared/calibration"', '"../../shared/calibration"'));
    const rubric = [
      "## How a question is scored", "",
      "The raw score is the cost of the work the question asks for, added up — **not** a weight on the option that produced it. Higher = harder.", "",
      "| Piece | Cost |", "|---|---|",
      "| × recall | ×1 or ×10: 0.5 · both ≤ 5: 1 · one factor 6–10, the other ≤ 5: 2 · both 6–9: 3 · ×11 / ×12 with a factor ≤ 5: 2.5, with a factor ≥ 6: 3.5 · two-digit × 2–5: 3 (3.5 above 50) · two-digit × 6–9: 4 · two-digit × two-digit: 6 · decimal: +2 · negative: +0.8 |",
      "| ÷ | the matching × fact + 0.7; not exact: 4 (+1.5 if a decimal) |",
      "| + − | operands ≤ 10: 0.5 · two-digit: 1 · bigger: 2 · a carry or exchange: +0.7 · decimals: +1.2 · a negative: +1.5 |",
      "| Powers | square: base ≤ 5: 1.2, 6–9: 2, 10: 1, 11–12: 2.5 · cube: 2 (≤ 3), 3 (4), 3.5 (5) · negative base: +1.2 |",
      "| Roots | √ of ≤ 25: 1.5, ≤ 100: 2, ≤ 144: 2.5 |",
      "| Reading the line | each bracket 0.6 · brackets inside brackets or a fraction bar +1 · fraction bar 1.5 · a root over a sum 0.6 · a leading minus before a power 1 |",
    ].join("\n");
    writeFileSync("docs/calibration/ORDER_OF_OPERATIONS_DIFFICULTY.md", calibrationReport("Order of Operations", rows, table, regen, rubric));
    expect(Object.keys(table)).toHaveLength(6);
  }, 120_000);
});

describe("a worksheet drawn by generate-extra-then-pick", () => {
  it("15 questions spread evenly over the bands the ticked options reach, easy to hard", async () => {
    const { spreadByBand } = await import("../shared");
    for (const level of LEVELS) {
      const s = randomSetup(TOOL_CONFIG, "evaluate", level);
      const pool = Array.from({ length: 120 }, () => generateQuestion("evaluate", level, s.variables, s.dropdownValue, s.multiSelectValues));
      const sheet = spreadByBand(pool, 15) as any[];
      expect(sheet).toHaveLength(15);
      const bands = sheet.map((q) => q._difficultyScore);
      expect([...bands].sort((a, b) => a - b)).toEqual(bands);
      const counts = Object.values(bands.reduce((m: Record<number, number>, b: number) => ({ ...m, [b]: (m[b] ?? 0) + 1 }), {} as Record<number, number>)) as number[];
      const present = new Set(pool.map((q: any) => q._difficultyScore)).size;
      expect(Math.max(...counts)).toBeLessThanOrEqual(Math.ceil(15 / Math.min(present, 15)) + 1);
    }
  });
});
