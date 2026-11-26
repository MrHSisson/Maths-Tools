import { CpaTool, __seed as base } from "./CriticalPath";
import { CPA_SKILL_TOOLS } from "./CriticalPathHomes";

// Activity Networks (DE1): one of the four skill tools Critical Path Analysis is being split into
// (docs/pathways/critical-path-split.md). The tool itself is CpaTool in CriticalPath.tsx; this file picks its tabs.
const HOME = CPA_SKILL_TOOLS.find((h) => h.id === "cpa-networks")!;

export default function CpaNetworks() {
  return <CpaTool home={HOME} />;
}

// Seed-replay contract surface — discovered by src/tests/seedReplay.test.ts.
export const __seed = { generate: base.generate, subTools: base.subTools.filter((t: { key: string }) => HOME.subs.includes(t.key)) };
