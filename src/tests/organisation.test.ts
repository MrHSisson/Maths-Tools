// Organisation / drift checks — keep the repo's hand-maintained "which tool is
// on which shell" bookkeeping honest, so docs can't silently rot.
//
// THIS FILE IS THE AUTHORITATIVE, CI-CHECKED SHELL STATUS FOR EVERY TOOL.
// CLAUDE.md's migration section is a human summary that points here; when the two
// disagree, this file wins. Adding or migrating a tool sometimes means updating a
// list below — that is the point: the failure message tells you exactly which one.
//
// What it enforces:
//   1. Every tool file is categorised (ToolShell, or one of the three lists).
//   2. The lists have no stale entries, no overlaps.
//   3. A tool in the migration backlog has NOT already been migrated.
//   4. Every ToolShell (question-generator) tool exports `__test` — so it is
//      covered by the generator smoke suite.
//   5. Every tool file on disk is registered in src/registry.ts (no orphans).

import { describe, it, expect } from "vitest";

// ── Read every tool's SOURCE text, keyed by "Category/Name" (no extension) ──────
const rawTools = import.meta.glob("../tools/**/*.tsx", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const registrySrc = Object.values(
  import.meta.glob("../registry.ts", { query: "?raw", import: "default", eager: true }) as Record<
    string,
    string
  >,
)[0];

const key = (globPath: string) => globPath.replace(/^\.\.\/tools\//, "").replace(/\.tsx$/, "");
const src: Record<string, string> = Object.fromEntries(
  Object.entries(rawTools).map(([p, s]) => [key(p), s]),
);
const ALL_KEYS = Object.keys(src).sort();

const rendersToolShell = (k: string) => /<ToolShell[\s/>]/.test(src[k]);
const exportsTest = (k: string) => /export const __test\b/.test(src[k]);

// ── The categorisation (seeded from the state at creation; keep it current) ─────

// Question-generator tools that still hand-roll an old embedded shell and should
// eventually move onto ToolShell. Remove a tool here once it renders <ToolShell/>.
const MIGRATION_BACKLOG = [
  "Generators/FunctionalSkillsGenerator",
  "Generators/MultiplicationGenerator",
  "Generators/NegativeOperationsGenerator",
  "Generators/TimesTablesGenerator",
  "Geometry/AnglesInTriangles",
  "Geometry/PerimeterTool",
  "Number/IntegerAddSub",
  "Number/PowersOfTen",
  "Proportion/FractionToRatio",
  "Proportion/FractionsOfAmounts",
  "Proportion/SimplifyingRatiosTool",
];

// Not question generators — standalone by design (manipulatives, dev-only pages,
// bespoke tools). These never migrate to ToolShell and never need __test.
const STANDALONE_BY_DESIGN = [
  "TeacherTools/AlgebraTiles",
  "TeacherTools/CallSelector",
  "TeacherTools/GrapherLab",
  "TeacherTools/SkillLibrary",
  "TeacherTools/TechniqueLibrary",
  "TeacherTools/Visualiser",
  "TeacherTools/p-value",
];

// Computer Science tools — a separate subject on CSShell, never ToolShell.
// Their build/migration work is tracked in CS_ROADMAP.md / CS_SHELL_PLAN.md.
const CS_TOOLS = [
  "ComputerScience/CpuArchitecture",
  "ComputerScience/SystemArchitecture",
];

const NON_TOOLSHELL_LISTS = [
  ["MIGRATION_BACKLOG", MIGRATION_BACKLOG] as const,
  ["STANDALONE_BY_DESIGN", STANDALONE_BY_DESIGN] as const,
  ["CS_TOOLS", CS_TOOLS] as const,
];

describe("organisation — shell status bookkeeping", () => {
  it("every list entry is a real tool file (no stale/renamed entries)", () => {
    for (const [name, list] of NON_TOOLSHELL_LISTS)
      for (const k of list)
        expect(ALL_KEYS, `${name} lists "${k}", which is not a tool file — remove or fix it`).toContain(k);
  });

  it("the three lists do not overlap", () => {
    const seen = new Map<string, string>();
    for (const [name, list] of NON_TOOLSHELL_LISTS)
      for (const k of list) {
        expect(seen.has(k), `"${k}" is in both ${seen.get(k)} and ${name} — it belongs in one`).toBe(false);
        seen.set(k, name);
      }
  });

  it("every non-ToolShell tool is categorised in exactly one list", () => {
    const categorised = new Set([...MIGRATION_BACKLOG, ...STANDALONE_BY_DESIGN, ...CS_TOOLS]);
    for (const k of ALL_KEYS) {
      if (rendersToolShell(k)) continue;
      expect(
        categorised.has(k),
        `"${k}" does not render <ToolShell/> and is not categorised. Add it to MIGRATION_BACKLOG ` +
          `(a generator to be migrated), STANDALONE_BY_DESIGN (never migrates), or CS_TOOLS in ` +
          `src/tests/organisation.test.ts.`,
      ).toBe(true);
    }
  });

  it("no backlog / standalone / CS tool secretly renders <ToolShell/>", () => {
    for (const k of MIGRATION_BACKLOG)
      expect(
        rendersToolShell(k),
        `"${k}" now renders <ToolShell/> — it has been migrated. Remove it from MIGRATION_BACKLOG.`,
      ).toBe(false);
    for (const [name, list] of [
      ["STANDALONE_BY_DESIGN", STANDALONE_BY_DESIGN] as const,
      ["CS_TOOLS", CS_TOOLS] as const,
    ])
      for (const k of list)
        expect(
          rendersToolShell(k),
          `"${k}" is in ${name} but renders <ToolShell/> — reclassify it (it looks like a generator now).`,
        ).toBe(false);
  });
});

describe("organisation — test coverage", () => {
  it("every ToolShell tool exports __test (so the smoke suite covers it)", () => {
    for (const k of ALL_KEYS) {
      if (!rendersToolShell(k)) continue;
      expect(
        exportsTest(k),
        `"${k}" renders <ToolShell/> but has no \`export const __test\` — add it so the generator ` +
          `smoke tests (generators.test.ts) cover this tool.`,
      ).toBe(true);
    }
  });
});

describe("organisation — registry integrity", () => {
  it("every tool file on disk is registered in src/registry.ts", () => {
    for (const k of ALL_KEYS)
      expect(
        registrySrc.includes(`import('./tools/${k}')`),
        `"${k}" exists under src/tools but is not registered in src/registry.ts ` +
          `(no \`import('./tools/${k}')\`). Register it, or it is unreachable and untested.`,
      ).toBe(true);
  });
});
