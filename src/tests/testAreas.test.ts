// The list of test areas (scripts/testAreas.mjs) must cover every test file exactly once, and route changed paths sensibly.
import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
// @ts-expect-error plain script, no types
import { AREA_ORDER, areaOfTest, areasForChange, toolFilter } from "../../scripts/testAreas.mjs";

const sorted = (x: string[] | "all") => (x === "all" ? x : [...x].sort());
const files = readdirSync("src/tests").filter((n) => n.endsWith(".test.ts"));
const filesIn = (areas: string[]) => files.filter((n) => areas.includes(areaOfTest(n)));

describe("test areas", () => {
  it("puts every test file in a known area", () => {
    for (const n of files) expect(AREA_ORDER, n).toContain(areaOfTest(n));
  });
  it("keeps the slow Decision tests out of a change that cannot affect them", () => {
    expect(areasForChange(["src/decks/store.ts"])).toEqual(["decks"]);
    expect(areasForChange(["docs/TASKS.md", "src/generated/adminDocs.json"])).toEqual(["docs"]);
    expect(sorted(areasForChange(["src/tools/Number/Indices.tsx"]))).toEqual(["cross", "docs", "tools"]);   // cross and docs hold the checks that read every tool
  });
  it("a mechanics change runs the mechanics tests, not Critical Path or Network Flows", () => {
    for (const f of ["src/tools/FurtherMechanics/DimensionalAnalysis.tsx", "src/shared/decision/dimSolve.ts", "src/shared/decision/DimWorking.tsx", "src/shared/mechanics/scene.ts"]) {
      const r = areasForChange([f]) as string[];
      expect(sorted(r), f).toEqual(["cross", "decision", "docs", "mechanics"]);
      const run = filesIn(r);
      expect(run, f).toContain("dim.test.ts");                                   // the hole: these used to be skipped for a change under FurtherMechanics
      expect(run, f).toContain("mechanicsPairings.test.ts");
      expect(run.some((n) => /^(cpa|flow)/.test(n)), f).toBe(false);
    }
  });
  it("each Decision topic runs its own tests plus the shell-wide ones, and a shell change runs them all", () => {
    expect(sorted(areasForChange(["src/shared/decision/cpa.ts"]))).toEqual(["cpa", "cross", "decision", "docs"]);
    expect(sorted(areasForChange(["src/shared/decision/flowGeometry.ts"]))).toEqual(["cross", "decision", "docs", "flow", "graphs"]);   // the graph topics use the flow geometry
    expect(sorted(areasForChange(["src/tools/Decision/TravellingSalesperson.tsx"]))).toEqual(["cross", "decision", "docs", "graphs"]);
    expect(sorted(areasForChange(["src/shared/decision/DecisionShell.tsx"]))).toEqual(["cpa", "cross", "decision", "docs", "flow", "graphs", "mechanics"]);
    expect(filesIn(areasForChange(["src/shared/decision/cpa.ts"]) as string[])).toContain("levellingMethod.test.ts");
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
    expect(areasForChange(["src/tests/cpaExam.test.ts"])).toEqual(["cpa"]);
    expect(areasForChange(["src/tests/dim.test.ts"])).toEqual(["mechanics"]);
  });
  it("the all-tool checks run for only the changed tools when that is all a change touches", () => {
    const indices = "src/tools/Number/Indices.tsx", rounding = "src/tools/Number/Rounding.tsx";
    expect(toolFilter([indices])).toEqual([indices]);
    expect(toolFilter([indices, "src/tools/Number/Indices.about.ts"])).toEqual([indices]);       // the tool's own words count as the tool
    expect(toolFilter([rounding, indices, "docs/TASKS.md", "src/decks/store.ts"])).toEqual([indices, rounding]);   // docs and deck files do not need the all-tool checks
    expect(toolFilter(["src/tools/Decision/CpaTimes.tsx"])).toEqual(["src/tools/Decision/CpaTimes.tsx"]);
  });
  it("a Decision topic's files map to the Decision tools they can affect", () => {
    const T = "src/tools/Decision/";
    expect(toolFilter(["src/shared/decision/cpaSolve.ts"])).toEqual([T + "CpaChanges.tsx", T + "CpaCharts.tsx", T + "CpaExam.tsx", T + "CpaNetworks.tsx", T + "CpaTimes.tsx"]);
    expect(toolFilter(["src/shared/decision/flowSolve.ts"])).toEqual([T + "NetworkFlows.tsx"]);
    expect(toolFilter(["src/shared/decision/dimSolve.ts"])).toEqual(["src/tools/FurtherMechanics/DimensionalAnalysis.tsx"]);
    // the graph tools build on two flow files, so those run the graph tools and the graph tests as well
    expect(toolFilter(["src/shared/decision/flowGeometry.ts"])).toEqual([T + "MinimumSpanningTree.tsx", T + "NetworkFlows.tsx", T + "RouteInspection.tsx", T + "TravellingSalesperson.tsx"]);
    expect(sorted(areasForChange(["src/shared/decision/flowTemplates.ts"]))).toEqual(["cross", "decision", "docs", "flow", "graphs"]);
    // the shell itself: every Decision and mechanics tool (and every Decision topic's tests)
    const shell = toolFilter(["src/shared/decision/DecisionShell.tsx"]) as string[];
    expect(shell).toEqual(expect.arrayContaining([T + "CpaTimes.tsx", T + "NetworkFlows.tsx", "src/tools/FurtherMechanics/DimensionalAnalysis.tsx"]));
    expect(shell.every((t) => /^src\/tools\/(Decision|FurtherMechanics)\//.test(t))).toBe(true);
  });
  it("and for every tool when anything else needs them", () => {
    expect(toolFilter(["src/tools/Number/Indices.tsx", "src/shared/helpers.ts"])).toBeNull();          // shared code
    expect(toolFilter(["src/tools/Proportion/ratioSimplifying.ts"])).toBeNull();                         // a helper in a tool folder: which tool uses it is not known
    expect(toolFilter(["src/tests/seedReplay.test.ts"])).toBeNull();                                      // the check itself changed
    expect(toolFilter(["docs/TASKS.md"])).toBeNull();                                                      // no tool file at all
  });
});
