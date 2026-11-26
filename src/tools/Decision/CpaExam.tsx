import { CpaTool, __seed as base } from "../../shared/decision/CpaTool";
import { CPA_EXAM } from "../../shared/decision/cpaHomes";

// Critical Path Exam Questions (the whole chapter): one of the four skill tools Critical Path Analysis is being split into
// (docs/pathways/critical-path-split.md). The tool itself is CpaTool in src/shared/decision/CpaTool.tsx; this file picks its tabs.
const HOME = CPA_EXAM;

export default function CpaExam() {
  return <CpaTool home={HOME} />;
}

// Seed-replay contract surface — discovered by src/tests/seedReplay.test.ts.
export const __seed = { generate: base.generate, subTools: base.subTools.filter((t: { key: string }) => HOME.subs.includes(t.key)) };
