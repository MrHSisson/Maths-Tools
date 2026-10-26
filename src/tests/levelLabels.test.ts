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


// Decision tools declare their options inside the component's config, so the check reads the source: every option (a `key:` line followed by
// a `label:` line) must be followed by an `info:` sentence.
describe("decision option notes", () => {
  const raw = import.meta.glob("../tools/Decision/*.tsx", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
  it("every Decision tool option is explained", () => {
    const bad: string[] = [];
    for (const [p, src] of Object.entries(raw)) {
      for (const m of src.matchAll(/\n[ \t]*key: "(\w+)",\n[ \t]*label: "[^"\n]*",(\n[ \t]*info: ")?/g)) if (!m[2]) bad.push(`${p} ${m[1]}`);
    }
    expect(bad).toEqual([]);
  });
});

// Question Option group labels are one vocabulary: the same words, spelt the same way, wherever they appear. A pool you can tick several of
// is plural ("Question Types", "Operations"); "Ask for" names what a question asks for (never "Find" or "Ask").
describe("question option labels", () => {
  it("use one spelling per label across the site", async () => {
    const pools = new Map<string, Set<string>>();     // singular form → spellings, tick-several pools
    const any = new Map<string, Set<string>>();       // lower case → spellings, pools and dropdowns
    const add = (m: Map<string, Set<string>>, k: string, label: string) => m.set(k, (m.get(k) ?? new Set()).add(label));
    const synonyms: string[] = [];
    for (const [p, load] of Object.entries(loaders)) {
      if (p.includes("TeacherTools/ToolShell")) continue;
      const t = ((await load()) as any).__test;
      if (!t?.TOOL_CONFIG?.tools) continue;
      for (const [k, e] of Object.entries<any>(t.TOOL_CONFIG.tools)) {
        for (const x of [e, ...Object.values<any>(e.difficultySettings ?? {})]) {
          const ms = x?.multiSelect ? (Array.isArray(x.multiSelect) ? x.multiSelect : [x.multiSelect]) : [];
          for (const m of ms) {
            if (!m.label) continue;
            add(pools, m.label.toLowerCase().replace(/s$/, ""), m.label);
            add(any, m.label.toLowerCase(), m.label);
            if (/^(find|ask)$/i.test(m.label)) synonyms.push(`${p} ${k}: "${m.label}" should be "Ask for"`);
          }
          if (x?.dropdown?.label) add(any, x.dropdown.label.toLowerCase(), x.dropdown.label);
        }
      }
    }
    const clash = (m: Map<string, Set<string>>) => [...m.values()].filter(s => s.size > 1).map(s => [...s].join(" / "));
    expect(clash(pools)).toEqual([]);
    expect(clash(any)).toEqual([]);
    expect(synonyms).toEqual([]);
  }, 120000);
});
