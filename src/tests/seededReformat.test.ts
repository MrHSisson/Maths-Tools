import { describe, it, expect } from "vitest";
import { generateSeeded, replaySeeded } from "../shared/seededGenerate";
import { normalizeMultiSelect } from "../shared/helpers";

const loaders = import.meta.glob("../tools/**/*.tsx");

// A `displayOnly` option promises the shell it only changes how the SAME question is shown: replaying the question from its
// seed with the option flipped must give the same answer. (A dropdown may reword the answer, so it only has to replay.)
describe("display-only options", () => {
  it("keep the same question when flipped and replayed from the seed", async () => {
    const problems: string[] = [];
    let checked = 0;
    for (const [p, load] of Object.entries(loaders)) {
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
          const gen = (v: Record<string, boolean>, d: string) => () => t.generateQuestion(k, level, v, d, ms);
          for (const v of (ds.variables ?? e.variables ?? []).filter((x: any) => x.displayOnly)) {
            for (let i = 0; i < 6; i++) {
              const q = generateSeeded(gen(vars, dd?.defaultValue ?? ""));
              const r = replaySeeded(q, gen({ ...vars, [v.key]: !vars[v.key] }, dd?.defaultValue ?? ""));
              checked++;
              if (!r || (r as any).answer !== (q as any).answer) problems.push(`${p} ${k} ${level} "${v.label}"`);
            }
          }
          if (dd && (dd.displayOnly || dd.workedExampleOnly)) {
            for (const o of dd.options) {
              const q = generateSeeded(gen(vars, dd.defaultValue));
              const r = replaySeeded(q, gen(vars, o.value));
              checked++;
              if (!r) problems.push(`${p} ${k} ${level} dropdown "${dd.label}" = ${o.value}`);
            }
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(50);
    expect([...new Set(problems)]).toEqual([]);
  }, 120000);
});
