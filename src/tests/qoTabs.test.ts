import { describe, it, expect } from "vitest";

const loaders = import.meta.glob("../tools/**/*.tsx");

/** More choices than this on one level and the options popover must sort its groups onto tabs (`tab` on each group). */
const MAX_UNTABBED = 12;
const TABS = ["questions", "numbers", "method", "display"];

// A level with a wall of options sorts its groups onto at least two tabs of the popover (Questions · Numbers · Method · Display),
// so a teacher sees a few groups at a time. Untagged groups sit on Questions.
describe("options popover tabs", () => {
  it("every level with more than 12 choices spreads its groups over two or more tabs", async () => {
    const bad: string[] = [];
    for (const [p, load] of Object.entries(loaders)) {
      const t = ((await load()) as any).__test;
      if (!t?.TOOL_CONFIG?.tools) continue;
      for (const [k, e] of Object.entries<any>(t.TOOL_CONFIG.tools)) {
        for (const lv of ["level1", "level2", "level3"]) {
          const s = e.difficultySettings?.[lv] ?? {};
          const dd = s.dropdown ?? e.dropdown;
          const ms: any[] = [].concat(s.multiSelect ?? e.multiSelect ?? []);
          const vars: any[] = s.variables ?? e.variables ?? [];
          const groups = [...(dd ? [dd] : []), ...ms, ...vars];
          for (const g of groups) if (g.tab && !TABS.includes(g.tab)) bad.push(`${p} ${k} ${lv} ${g.label}: unknown tab "${g.tab}"`);
          const n = (dd ? dd.options.length : 0) + ms.reduce((a, g) => a + g.options.length, 0) + vars.length;
          const tabs = new Set(groups.map(g => g.tab ?? "questions"));
          if (n > MAX_UNTABBED && tabs.size < 2) bad.push(`${p} ${k} ${lv}: ${n} choices on one tab`);
        }
      }
    }
    expect(bad).toEqual([]);
  }, 120000);
});
