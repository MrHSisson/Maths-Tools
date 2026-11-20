// The list of test areas (scripts/testAreas.mjs) must cover every test file exactly once, and route changed paths sensibly.
import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
// @ts-expect-error plain script, no types
import { AREA_ORDER, areaOfTest, areasForChange } from "../../scripts/testAreas.mjs";

describe("test areas", () => {
  const files = readdirSync("src/tests").filter((n) => n.endsWith(".test.ts"));
  it("puts every test file in a known area", () => {
    for (const n of files) expect(AREA_ORDER, n).toContain(areaOfTest(n));
  });
  it("keeps the slow Decision tests out of a change that cannot affect them", () => {
    expect(areasForChange(["src/decks/store.ts"])).toEqual(["decks"]);
    expect(areasForChange(["docs/TASKS.md", "src/generated/adminDocs.json"])).toEqual(["docs"]);
    expect(areasForChange(["src/tools/Algebra/Indices.tsx"]).sort()).toEqual(["docs", "tools"]);   // docs holds the checks that read every tool (labels, About files)
  });
  it("runs the Decision area (and the cross-tool checks) for a Decision change", () => {
    expect(areasForChange(["src/shared/decision/cpa.ts"]).sort()).toEqual(["decision", "docs", "tools"]);
  });
  it("runs everything for shared code, config, the registry or an unknown path", () => {
    for (const f of ["src/shared/helpers.ts", "src/registry.ts", "package.json", ".github/workflows/ci.yml", "somewhere/else.txt"]) expect(areasForChange([f]), f).toBe("all");
  });
  it("the guards for generated files and for newer-code placeholders run when their own files change", () => {
    expect(areaOfTest("patchNotes.test.ts")).toBe("docs");
    expect(areasForChange(["docs/patch-notes/2026-11-20-x.md"])).toEqual(["docs"]);
    expect(areaOfTest("newerCode.test.ts")).toBe("decks");
    expect(areasForChange(["src/decks/newerCode.tsx"])).toEqual(["decks"]);
  });
  it("a changed test file runs its own area", () => {
    expect(areasForChange(["src/tests/cpaExam.test.ts"])).toEqual(["decision"]);
  });
});
