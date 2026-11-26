import { CpaTool, __seed as base } from "./CriticalPath";
import { CPA_SKILL_TOOLS } from "./CriticalPathHomes";

// Cascade Charts and Resources (DE5, DE6): one of the four skill tools Critical Path Analysis is being split into
// (docs/pathways/critical-path-split.md). The tool itself is CpaTool in CriticalPath.tsx; this file picks its tabs.
const HOME = CPA_SKILL_TOOLS.find((h) => h.id === "cpa-charts")!;

export default function CpaCharts() {
  return <CpaTool home={HOME} />;
}

// Seed-replay contract surface — discovered by src/tests/seedReplay.test.ts.
export const __seed = { generate: base.generate, subTools: base.subTools.filter((t: { key: string }) => HOME.subs.includes(t.key)) };
