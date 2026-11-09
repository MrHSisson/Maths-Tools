// Seed replay: a saved question (the print basket, pinned questions, a shared link) is stored as its recipe (sub-tool, level, options and
// the seed) and rebuilt by running the generator again. That only works if the same seed and options always give the very same question,
// so a generator must draw everything through Math.random and keep no memory between calls (no "not the same as last time" state at
// module level). This test generates every sub-tool x level twice from one seed and compares the whole question.
import { describe, it, expect } from "vitest";
import { generateFromSeed } from "../shared/seededGenerate";
import { normalizeMultiSelect } from "../shared/helpers";

const toolLoaders = import.meta.glob("../tools/**/*.tsx");
const decisionLoaders = import.meta.glob("../tools/Decision/*.tsx");

const SEEDS = [12345, 987654321, 2654435761, 31337, 4000000007];
const bigint = (_k: string, v: unknown) => (typeof v === "bigint" ? `n${v}` : v);
const same = (gen: () => object, seed: number) => JSON.stringify(generateFromSeed(seed, gen), bigint) === JSON.stringify(generateFromSeed(seed, gen), bigint);

describe("seed replay", () => {
  it("every Maths tool question rebuilds exactly from its seed", async () => {
    const problems: string[] = [];
    for (const [p, load] of Object.entries(toolLoaders)) {
      const t = ((await load()) as any).__test;
      if (!t?.TOOL_CONFIG || !t.generateQuestion) continue;
      for (const [k, e] of Object.entries<any>(t.TOOL_CONFIG.tools)) {
        for (const level of e.levels ?? t.levels ?? ["level1", "level2", "level3"]) {
          const ds = e.difficultySettings?.[level] ?? {};
          const vars: Record<string, boolean> = {};
          (ds.variables ?? e.variables ?? []).forEach((v: any) => { vars[v.key] = v.defaultValue; });
          const dd = ds.dropdown !== undefined ? ds.dropdown : e.dropdown;
          const ms: Record<string, boolean> = {};
          normalizeMultiSelect(ds.multiSelect ?? e.multiSelect).forEach((g: any) => g.options.forEach((o: any) => { ms[o.value] = o.defaultActive; }));
          const gen = () => t.generateQuestion(k, level, vars, dd?.defaultValue ?? "", ms);
          for (const seed of SEEDS) if (!same(gen, seed)) { problems.push(`${p.replace("../tools/", "")} ${k} ${level}`); break; }
        }
      }
    }
    expect(problems, "these give a different question from the same seed: look for module-level state or a source of randomness other than Math.random").toEqual([]);
  }, 300_000);

  it("every Decision tool problem rebuilds exactly from its seed", async () => {
    const problems: string[] = [];
    let cells = 0;
    for (const [p, load] of Object.entries(decisionLoaders)) {
      const m: any = await load();
      const cases: { gen: (level: number, ctx: any) => object; ctx: any; levels: number[] }[] = [];
      if (m.__problem) for (const s of m.__problem.subTools ?? []) cases.push({ gen: m.__problem.generate, ctx: typeof s === "string" ? { subTool: s, options: {} } : s, levels: m.__problem.levels ?? [1] });
      if (m.__seed) for (const s of m.__seed.subTools) cases.push({ gen: m.__seed.generate, ctx: { subTool: s.key, options: {} }, levels: Array.from({ length: s.levels ?? 1 }, (_, i) => i + 1) });
      for (const c of cases) for (const level of c.levels) {
        cells++;
        for (const seed of SEEDS) if (!same(() => c.gen(level, c.ctx), seed)) { problems.push(`${p.split("/").pop()} ${c.ctx.subTool} L${level}`); break; }
      }
    }
    expect(cells).toBeGreaterThan(50);
    expect(problems).toEqual([]);
  }, 300_000);
});
