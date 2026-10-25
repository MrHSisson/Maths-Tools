import { describe, it, expect } from "vitest";

import { unexplainedOptions } from "../shared/about";

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

// "About this tool" opens with the tool's purpose and lists each sub-tool with its own: both must be there, short and plain, and
// the level text (shared with the level (i)) must stay short.
describe("about copy", () => {
  it("every ToolShell tool has a purpose, every sub-tool has a purpose, and the level text is short and jargon-light", async () => {
    const bad: string[] = [];
    const JARGON = /\b(QO|QOs|distractor|defaultActive|toggleable?|radicand|monic)\b/i;
    for (const [p, load] of Object.entries(loaders)) {
      if (p.includes("TeacherTools/ToolShell")) continue;
      const t = ((await load()) as any).__test;
      if (!t?.TOOL_CONFIG?.tools) continue;
      const cfg = t.TOOL_CONFIG;
      if (!cfg.purpose?.trim() || cfg.purpose.length > 220) bad.push(`${p} purpose`);
      for (const [k, e] of Object.entries<any>(cfg.tools)) {
        if (!e.purpose?.trim() || e.purpose.length > 140) bad.push(`${p} ${k} purpose`);
        for (const l of e.levelLabels ?? []) if (l.length > 130 || JARGON.test(l)) bad.push(`${p} ${k} level: ${l.slice(0, 50)}`);
      }
    }
    expect(bad).toEqual([]);
  }, 120000);
});

// Every Question Option group (pool, switch, dropdown) says what it is for, in plain words, in <Tool>.about.ts: "About this tool" shows that
// text, and the hover note in the options popover is the same text.
describe("question option notes", () => {
  it("every Question Option of every ToolShell sub-tool is explained", async () => {
    const bad: string[] = [];
    for (const [p, load] of Object.entries(loaders)) {
      if (p.includes("TeacherTools/ToolShell")) continue;
      const t = ((await load()) as any).__test;
      if (!t?.TOOL_CONFIG?.tools) continue;
      for (const [k, e] of Object.entries<any>(t.TOOL_CONFIG.tools)) for (const id of unexplainedOptions(e)) bad.push(`${p} ${k} ${id}`);
    }
    expect(bad).toEqual([]);
  }, 120000);
});

