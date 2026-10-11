// Order of Operations — difficulty is scored from the question itself (difficultyOf), not from the options that made it.
// These tests pin the ordering the rubric must give, and `CALIBRATE=1 npx vitest run src/tests/orderDifficulty.test.ts`
// regenerates docs/calibration/ORDER_OF_OPERATIONS_DIFFICULTY.md from a few thousand generated questions.
import { describe, expect, it } from "vitest";
// (no @types/node here: reach Node through the global `process`)
const nodeProcess = (globalThis as unknown as { process?: { env?: Record<string, string | undefined>; getBuiltinModule?: (m: string) => { writeFileSync: (p: string, d: string) => void } } }).process;
const CALIBRATE = !!nodeProcess?.env?.CALIBRATE;
const writeFileSync = (path: string, data: string) => nodeProcess?.getBuiltinModule?.("fs").writeFileSync(path, data);
import { __test } from "../tools/Number/OrderOfOperations";

const { E, P, N, texBody, NO_HL, buildEval, difficultyOf, difficultySignature, EVAL_POOLS } = __test.engine;
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
const pct = (xs: number[], p: number) => xs[Math.min(xs.length - 1, Math.floor((p / 100) * xs.length))];

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

describe.runIf(CALIBRATE)("calibration report", () => {
  it("writes docs/calibration/ORDER_OF_OPERATIONS_DIFFICULTY.md", () => {
    const rows = sample(200);
    const out: string[] = [];
    out.push("# Order of Operations — difficulty calibration", "",
      `Generated from **${rows.length}** questions (every Focus at every level, whole / negative / decimal numbers where offered). Regenerate: \`CALIBRATE=1 npx vitest run src/tests/orderDifficulty.test.ts\`.`, "",
      "## How a question is scored", "",
      "The score is the cost of the work the question asks for, added up — **not** a weight on the option that produced it. Higher = harder. A question's score is what the Smart Progressor sorts a worksheet by.", "",
      "| Piece | Cost |", "|---|---|",
      "| × recall | ×1 or ×10: 0.5 · both ≤ 5: 1 · one factor 6–10, the other ≤ 5: 2 · both 6–9: 3 · ×11 / ×12 with a factor ≤ 5: 2.5, with a factor ≥ 6: 3.5 · two-digit × 2–5: 3 (3.5 above 50) · two-digit × 6–9: 4 · two-digit × two-digit: 6 · decimal: +2 · negative: +0.8 |",
      "| ÷ | the matching × fact + 0.7 (division is the multiplication read backwards); not exact: 4 (+1.5 if a decimal) |",
      "| + − | operands ≤ 10: 0.5 · two-digit: 1 · bigger: 2 · a carry or exchange: +0.7 · decimals: +1.2 · a negative: +1.5 |",
      "| Powers | square: base ≤ 5: 1.2, 6–9: 2, 10: 1, 11–12: 2.5 · cube: 2 (≤ 3), 3 (4), 3.5 (5) · negative base: +1.2 |",
      "| Roots | √ of ≤ 25: 1.5, ≤ 100: 2, ≤ 144: 2.5 |",
      "| Reading the line | each bracket 0.6 · brackets inside brackets or a fraction bar +1 · fraction bar 1.5 · a root over a sum 0.6 · a leading minus before a power 1 |", "");
    const byLevel = ["level1", "level2", "level3"].map((l) => {
      const x = rows.filter((r) => r.level === l).map((r) => r.score).sort((a, b) => a - b);
      return `| ${l} | ${x.length} | ${x[0]} | ${pct(x, 25)} | ${pct(x, 50)} | ${pct(x, 75)} | ${x[x.length - 1]} |`;
    });
    out.push("## Spread by level", "", "| Level | Questions | Min | 25th | Median | 75th | Max |", "|---|---|---|---|---|---|---|", ...byLevel, "");
    const byFam = new Map<string, number[]>();
    for (const r of rows) byFam.set(`${r.level} · ${r.family} · ${r.nm}`, [...(byFam.get(`${r.level} · ${r.family} · ${r.nm}`) ?? []), r.score]);
    out.push("## Spread by option (Focus · Numbers)", "", "| Level · Focus · Numbers | n | Median | Range |", "|---|---|---|---|");
    for (const [k, v] of [...byFam.entries()]) { v.sort((a, b) => a - b); out.push(`| ${k} | ${v.length} | ${pct(v, 50)} | ${v[0]}–${v[v.length - 1]} |`); }
    out.push("");
    const bySig = new Map<string, { scores: number[]; ex: string }>();
    for (const r of rows) { const g = bySig.get(r.sig) ?? { scores: [], ex: r.tex }; g.scores.push(r.score); bySig.set(r.sig, g); }
    const cats = [...bySig.entries()].map(([sig, g]) => ({ sig, n: g.scores.length, mean: g.scores.reduce((a, b) => a + b, 0) / g.scores.length, lo: Math.min(...g.scores), hi: Math.max(...g.scores), ex: g.ex })).sort((a, b) => a.mean - b.mean);
    out.push(`## Categories, easiest to hardest (${cats.length} found)`, "", "A category is the operations in the order they happen, the hardest recall they need (E easy, M mid, H hard, X beyond the grid) and what makes the line awkward. Within a category the score still varies with the actual numbers.", "",
      "| # | Category | n | Mean score | Range | Example |", "|---|---|---|---|---|---|");
    cats.forEach((c, i) => out.push(`| ${i + 1} | ${c.sig} | ${c.n} | ${c.mean.toFixed(1)} | ${c.lo}–${c.hi} | $${c.ex.replace(/\|/g, "\\|")}$ |`));
    writeFileSync("docs/calibration/ORDER_OF_OPERATIONS_DIFFICULTY.md", out.join("\n") + "\n");
    expect(cats.length).toBeGreaterThan(20);
  });
});
