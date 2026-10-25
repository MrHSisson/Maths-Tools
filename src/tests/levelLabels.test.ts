import { describe, it, expect } from "vitest";

const loaders = import.meta.glob("../tools/**/*.tsx");

// The level (i) beside the level buttons reads `levelLabels` from each sub-tool: every ToolShell sub-tool with
// more than one level must say what its levels mean (the template's placeholders are the only exception).
describe("level descriptions", () => {
  it("every ToolShell sub-tool has one description per level", async () => {
    const bad: string[] = [];
    for (const [p, load] of Object.entries(loaders)) {
      if (p.includes("TeacherTools/ToolShell")) continue;
      const t = ((await load()) as any).__test;
      if (!t?.TOOL_CONFIG) continue;
      for (const [k, e] of Object.entries<any>(t.TOOL_CONFIG.tools)) {
        const n = (e.levels ?? t.levels ?? ["level1", "level2", "level3"]).length;
        if (n < 2) continue;
        const l = e.levelLabels;
        if (!Array.isArray(l) || l.length < n || l.slice(0, n).some((x: string) => !x?.trim())) bad.push(`${p} ${k}`);
      }
    }
    expect(bad).toEqual([]);
  }, 120000);
});
