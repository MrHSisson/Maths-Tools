Strand: Maths

## 2026-11-26 — Critical Path Analysis: exam questions get their own page, and the old tool is retired

Branch `claude/gallant-fermat-iio2ap`. Area: `src/shared/decision/{CpaTool.tsx,cpaHomes.ts,cpaGenerate.ts,cpaAsync.ts,cpa.worker.ts}` (moved from `src/tools/Decision/`), `src/tools/Decision/{CpaExam.tsx,decisionSpec.ts}`, `src/registry.ts`, `src/App.tsx`, `scripts/{toolFacts,testAreas}.mjs`, `docs/pathways/critical-path-split.md`.

The split of Critical Path Analysis is finished. **Critical Path Exam Questions** (`/cpa-exam`) holds the eleven multi-part exam-style chains (five AS, six A-level) in one chooser of plain text tiles under two headings (no little pictures), and no AS / A-level or Skills / Exam style switch; the Decision Maths hub's exam card opens it. The old single tool is gone: its skills are in Activity Networks, Times, Float and Critical Paths, Changes and Reasoning and Cascade Charts and Resources, and `/critical-path` now only redirects an old link (saved list, printed sheet, lesson deck) to the tool and tab it names. The dashboard facts for the five tools now count each tool's own tabs and features. Questions, working and printing are unchanged. Not changed: the `resource-levelling` deck still names the old address (its button still works).

Agent: Claude Code
Notes: Handoff block "split Critical Path Analysis into four skill tools"; Build Log block to follow.
