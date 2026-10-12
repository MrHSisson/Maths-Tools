// Calibration — the standard way a tool earns its Smart Progressor ordering once we are happy with it.
//
//   1. Every question the generator returns carries `_rawDifficulty` (a score computed from the QUESTION — numbers, operations, awkwardness —
//      never from the option that made it) and `_category` (a coarse fingerprint, for the report).
//   2. A calibration run generates 1000+ questions per sub-tool × level across RANDOM combinations of all its options (`randomSetup`),
//      then cuts the raw scores into eight bands holding about an eighth each (`quantileCuts`) and writes the cut table + a report.
//   3. At generation time the tool turns `_rawDifficulty` into a band 1–8 with `bandFromTable` and stores it as `_difficultyScore`.
//      ToolShell's worksheet sort already orders by `_difficultyScore`; questions in the same band mingle in random order.
//
// Bands are relative to the sub-tool + level (a Level 1 sheet runs 1–8 across ITS questions). Recalibrate after any generator change:
// the tool's calibration test fails when a band's share drifts too far.
import type { AnyQuestion, DifficultyLevel, ToolConfig, ToolMultiSelect, ToolDropdown, ToolVariable } from "./types";
import { normalizeMultiSelect } from "./helpers";

export const BAND_COUNT = 8;
/** One list of `BAND_COUNT − 1` cut points per `"<subTool>:<level>"`; a raw score ≥ the n-th cut is above band n. */
export type BandTable = Record<string, number[]>;

export const calibrationKey = (subTool: string, level: DifficultyLevel): string => `${subTool}:${level}`;

/** The 1/8 … 7/8 quantiles of `values` (rounded to 0.1, kept strictly rising so no band is empty by construction). */
export function quantileCuts(values: number[], bands = BAND_COUNT): number[] {
  const xs = [...values].sort((a, b) => a - b);
  if (!xs.length) return [];
  const cuts: number[] = [];
  for (let i = 1; i < bands; i++) {
    let c = Math.round(xs[Math.min(xs.length - 1, Math.floor((i / bands) * xs.length))] * 10) / 10;
    if (cuts.length && c <= cuts[cuts.length - 1]) c = Math.round((cuts[cuts.length - 1] + 0.1) * 10) / 10;
    cuts.push(c);
  }
  return cuts;
}

/** Band 1 … `cuts.length + 1` for a raw score. */
export const bandFor = (cuts: number[], raw: number): number => 1 + cuts.filter((c) => raw >= c).length;

/** The band a raw score falls in for this sub-tool + level — or the raw score itself while the tool has no calibration yet
 *  (still sortable, just not banded). */
export const bandFromTable = (table: BandTable, subTool: string, level: DifficultyLevel, raw: number): number => {
  const cuts = table[calibrationKey(subTool, level)];
  return cuts && cuts.length ? bandFor(cuts, raw) : raw;
};

export interface QuestionSetup {
  variables: Record<string, boolean>;
  dropdownValue: string;
  multiSelectValues: Record<string, boolean>;
}

/** A random but valid Question Options state for a sub-tool + level: single-choice pools pick one option, other pools a random
 *  non-empty subset (any subset if `allowEmpty`), variables and the dropdown at random. Every option value is set explicitly. */
export function randomSetup(config: ToolConfig, subTool: string, level: DifficultyLevel, rng: () => number = Math.random): QuestionSetup {
  const t = config.tools[subTool];
  const ds = t.difficultySettings?.[level];
  const pools: ToolMultiSelect[] = normalizeMultiSelect(ds?.multiSelect ?? t.multiSelect);
  const vars: ToolVariable[] = ds?.variables ?? t.variables;
  const dd: ToolDropdown | null = ds?.dropdown ?? t.dropdown;
  const multiSelectValues: Record<string, boolean> = {};
  for (const g of pools) {
    const n = g.options.length;
    let on: boolean[];
    if (g.exclusive) {
      const k = Math.floor(rng() * n);
      on = g.options.map((_, i) => i === k);
    } else {
      do on = g.options.map(() => rng() < 0.5); while (!g.allowEmpty && !on.some(Boolean));
    }
    g.options.forEach((o, i) => { multiSelectValues[o.value] = on[i]; });
  }
  const variables: Record<string, boolean> = {};
  for (const v of vars) variables[v.key] = rng() < 0.5;
  return { variables, dropdownValue: dd ? dd.options[Math.floor(rng() * dd.options.length)].value : "", multiSelectValues };
}

export interface CalibrationRow { subTool: string; level: DifficultyLevel; raw: number; category: string; tex: string }

type Generate = (tool: string, level: DifficultyLevel, variables: Record<string, boolean>, dropdownValue: string, multiSelectValues?: Record<string, boolean>) => AnyQuestion;

/** Generates `perCell` questions for each sub-tool × level (default 1500) under random option setups, reading each question's
 *  `_rawDifficulty` / `_category`. Questions without a raw score are skipped. */
export function sampleCalibration(config: ToolConfig, generate: Generate, perCell = 1500, rng: () => number = Math.random): CalibrationRow[] {
  const rows: CalibrationRow[] = [];
  for (const subTool of Object.keys(config.tools)) {
    const levels: DifficultyLevel[] = config.tools[subTool].levels ?? ["level1", "level2", "level3"];
    for (const level of levels) for (let i = 0; i < perCell; i++) {
      const s = randomSetup(config, subTool, level, rng);
      const q = generate(subTool, level, s.variables, s.dropdownValue, s.multiSelectValues) as unknown as { _rawDifficulty?: number; _category?: string; display?: string; displayLatex?: string };
      if (typeof q._rawDifficulty !== "number") continue;
      rows.push({ subTool, level, raw: q._rawDifficulty, category: q._category ?? "-", tex: q.displayLatex ?? q.display ?? "" });
    }
  }
  return rows;
}

/** The cut table for a sample. */
export function buildBandTable(rows: CalibrationRow[]): BandTable {
  const table: BandTable = {};
  const keys = new Set(rows.map((r) => calibrationKey(r.subTool, r.level)));
  for (const k of keys) table[k] = quantileCuts(rows.filter((r) => calibrationKey(r.subTool, r.level) === k).map((r) => r.raw));
  return table;
}

/** Source text for a committed `<Tool>.calibration.ts` file. */
export const bandTableSource = (table: BandTable, regenerate: string): string =>
  `// GENERATED — do not edit by hand. Regenerate: ${regenerate}\n// Raw-score cut points per "<subTool>:<level>" (see src/shared/calibration.ts).\nimport type { BandTable } from "../../shared/calibration";\n\nexport const BANDS: BandTable = ${JSON.stringify(table, null, 2)};\n`;

const pct = (xs: number[], p: number) => xs[Math.min(xs.length - 1, Math.floor((p / 100) * xs.length))];

/** A markdown calibration report: sample size, band cuts and shares, score spread, and every category easiest → hardest. */
export function calibrationReport(title: string, rows: CalibrationRow[], table: BandTable, regenerate: string, rubric = ""): string {
  const out: string[] = [`# ${title} — difficulty calibration`, "",
    `Generated from **${rows.length}** questions — each sub-tool × level sampled across random combinations of ALL its Question Options. Regenerate: \`${regenerate}\`.`, ""];
  if (rubric) out.push(rubric, "");
  out.push("## The eight bands", "",
    "A worksheet is ordered by **band** (1 easiest … 8 hardest); questions in a band mingle in random order. Bands are relative to the sub-tool + level: the cut points are the 12.5% … 87.5% quantiles of what that level can generate.", "",
    "| Sub-tool · level | n | Cut points | Share per band (1 … 8) | Min | Median | Max |", "|---|---|---|---|---|---|---|");
  const keys = [...new Set(rows.map((r) => calibrationKey(r.subTool, r.level)))];
  for (const k of keys) {
    const xs = rows.filter((r) => calibrationKey(r.subTool, r.level) === k);
    const sc = xs.map((r) => r.raw).sort((a, b) => a - b);
    const cuts = table[k] ?? [];
    const share = Array.from({ length: BAND_COUNT }, (_, i) => Math.round((100 * xs.filter((r) => bandFor(cuts, r.raw) === i + 1).length) / xs.length) + "%").join(" ");
    out.push(`| ${k} | ${xs.length} | ${cuts.join(" · ")} | ${share} | ${sc[0]} | ${pct(sc, 50)} | ${sc[sc.length - 1]} |`);
  }
  const byCat = new Map<string, { scores: number[]; bands: Set<string>; ex: string }>();
  for (const r of rows) {
    const id = `${r.subTool} · ${r.category}`;
    const g = byCat.get(id) ?? { scores: [], bands: new Set<string>(), ex: r.tex };
    g.scores.push(r.raw);
    g.bands.add(`${r.level.replace("level", "L")}:${bandFor(table[calibrationKey(r.subTool, r.level)] ?? [], r.raw)}`);
    byCat.set(id, g);
  }
  const cats = [...byCat.entries()].map(([id, g]) => ({ id, n: g.scores.length, mean: g.scores.reduce((a, b) => a + b, 0) / g.scores.length, lo: Math.min(...g.scores), hi: Math.max(...g.scores), ex: g.ex, bands: [...g.bands].sort().join(" ") })).sort((a, b) => a.mean - b.mean);
  out.push("", `## Categories, easiest to hardest (${cats.length} found)`, "", "A category is a coarse fingerprint of the question's structure; within it the score still varies with the actual numbers.", "",
    "| # | Category | n | Mean | Range | Bands (level:band) | Example |", "|---|---|---|---|---|---|---|");
  cats.forEach((c, i) => out.push(`| ${i + 1} | ${c.id} | ${c.n} | ${c.mean.toFixed(1)} | ${c.lo}–${c.hi} | ${c.bands} | $${c.ex.replace(/\|/g, "\\|")}$ |`));
  return out.join("\n") + "\n";
}
