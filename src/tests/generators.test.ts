// Generator smoke tests — run against every tool that exports `__test`.
//
// Each opted-in tool exposes:
//   export const __test = { TOOL_CONFIG, generateQuestion, levels? };
// (levels restricts testing when some levels are "coming soon".)
//
// For every sub-tool × level the suite generates a batch of questions with the
// tool's default QO settings and asserts: no throw, unique non-empty keys, and
// every KaTeX string (display, answer, working steps, $...$ in worded lines)
// renders without error. This catches the classroom-crash class of bugs —
// invalid LaTeX, `£`/`<` in KaTeX, \text{} misuse — at CI time.

import { describe, it, expect } from "vitest";
import katex from "katex";
import { makeUniqueQ, normalizeMultiSelect } from "../shared/helpers";
import type { AnyQuestion, DifficultyLevel, ToolConfig, ToolEntry } from "../shared/types";

interface ToolTestExport {
  TOOL_CONFIG: ToolConfig;
  generateQuestion: (
    tool: string,
    level: DifficultyLevel,
    variables: Record<string, boolean>,
    dropdownValue: string,
    multiSelectValues?: Record<string, boolean>,
  ) => AnyQuestion;
  levels?: DifficultyLevel[];
}

const QUESTIONS_PER_CASE = 40;
const ALL_LEVELS: DifficultyLevel[] = ["level1", "level2", "level3"];

// Default QO settings for a sub-tool at a level, honouring difficultySettings
// overrides — mirrors how ToolShell initialises state.
const settingsFor = (entry: ToolEntry, level: DifficultyLevel) => {
  const ds = entry.difficultySettings?.[level] ?? {};
  const variables = Object.fromEntries(
    (ds.variables ?? entry.variables ?? []).map((v) => [v.key, v.defaultValue]),
  );
  const dd = ds.dropdown !== undefined ? ds.dropdown : entry.dropdown;
  const dropdownValue = dd?.defaultValue ?? "";
  const groups = normalizeMultiSelect(ds.multiSelect ?? entry.multiSelect);
  const multiSelectValues: Record<string, boolean> = {};
  for (const g of groups) for (const o of g.options) multiSelectValues[o.value] = o.defaultActive;
  return { variables, dropdownValue, multiSelectValues };
};

// Every KaTeX string a question can carry, labelled for error messages.
const latexOf = (q: AnyQuestion): [string, string][] => {
  const out: [string, string][] = [];
  if (q.kind === "simple" && q.displayLatex) out.push(["displayLatex", q.displayLatex]);
  if (q.answerLatex) out.push(["answerLatex", q.answerLatex]);
  if (q.kind === "worded") {
    for (const line of q.lines) {
      for (const m of line.matchAll(/\$([^$]+)\$/g)) out.push(["worded line", m[1]]);
    }
  }
  q.working.forEach((s, i) => { if (s.latex) out.push([`working[${i}] (${s.type})`, s.latex]); });
  return out;
};

const renderOk = (label: string, latex: string, ctx: string) => {
  try {
    katex.renderToString(latex, { throwOnError: true });
  } catch (e) {
    throw new Error(`KaTeX failed for ${label} in ${ctx}:\n  "${latex}"\n  ${(e as Error).message}`);
  }
};

// Discover opted-in tools. Modules must import cleanly under node — if a
// legacy tool ever breaks discovery, exclude its path here with a comment.
const moduleLoaders = import.meta.glob("../tools/**/*.tsx");
const optedIn: [string, ToolTestExport][] = [];
const importFailures: [string, unknown][] = [];
for (const [path, load] of Object.entries(moduleLoaders)) {
  try {
    const mod = (await load()) as { __test?: ToolTestExport };
    if (mod.__test) optedIn.push([path, mod.__test]);
  } catch (e) {
    importFailures.push([path, e]);
  }
}

describe("tool module discovery", () => {
  it("imports every tool module", () => {
    const msgs = importFailures.map(([p, e]) => `${p}: ${(e as Error).message}`);
    expect(msgs).toEqual([]);
  });
  it("finds at least one tool exposing __test", () => {
    expect(optedIn.length).toBeGreaterThan(0);
  });
});

for (const [path, { TOOL_CONFIG, generateQuestion, levels }] of optedIn) {
  describe(path, () => {
    for (const [toolKey, entry] of Object.entries(TOOL_CONFIG.tools)) {
      for (const level of levels ?? ALL_LEVELS) {
        it(`${toolKey} ${level}: generates ${QUESTIONS_PER_CASE} valid, unique questions`, () => {
          const { variables, dropdownValue, multiSelectValues } = settingsFor(entry, level);
          const uniqueQ = makeUniqueQ(generateQuestion);
          const usedKeys = new Set<string>();
          for (let i = 0; i < QUESTIONS_PER_CASE; i++) {
            const q = uniqueQ(toolKey, level, variables, dropdownValue, usedKeys, multiSelectValues);
            const ctx = `${toolKey}/${level} #${i}`;
            expect(q.key, `${ctx}: key must be non-empty`).toBeTruthy();
            expect(q.working, `${ctx}: working steps must exist`).toBeInstanceOf(Array);
            for (const [label, latex] of latexOf(q)) renderOk(label, latex, ctx);
          }
          expect(usedKeys.size, "keys must be unique across the batch").toBe(QUESTIONS_PER_CASE);
        });
      }
    }
  });
}
