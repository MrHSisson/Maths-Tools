# Critical Path Analysis: split into skill tools
- **Status:** building
- **Updated:** 2026-11-26 (chunk 3: Activity Networks built)

## Intention
Critical Path Analysis is one tool with 26 sub-tools. Its top is a collapsible panel of picture tiles with two filter switches (AS / A-level, Skills / Exam style), built before the Decision Maths hub existed, and it pushes the question off a laptop screen. Split it into four skill tools by specification statement, each with a single row of tab pills and only its own Question Options. The hub (DE chapter) does the choosing. The multi-part exam chains leave the tools and are opened from the hub.

| Tool | Tabs | Spec |
|---|---|---|
| Activity Networks | Network from a table, Table from a network | DE1 |
| Times, Float and Critical Paths | Forward pass, Backward pass, Full analysis, Float and critical paths, Missing time | DE2, DE3 |
| Changes and Reasoning | Delays and changes, Explain and justify, Which to shorten, Limits of the model | DE4 |
| Cascade Charts and Resources (A-level) | Cascade chart, Resource histogram, Resource levelling, Worker allocation | DE5, DE6 |

Decided with Harry (2026-11-26): the shared generators and solver stay as they are; old `/critical-path?tool=...` links redirect to the right new tool and tab; exam questions are opened from the hub for now (a thin exam page over the existing chains), with a proper exam-paper tool as the eventual aim.

## Progress
- 2026-11-26: design agreed; current layout reviewed at laptop and phone size.
- 2026-11-26 (chunk 1): `CriticalPathHomes.ts` (the map of old tab to new tool) and `cpaRedirect`, with `criticalPathSplit.test.ts`.
- 2026-11-26 (chunk 2): **Times, Float and Critical Paths** (`/cpa-times`, `CpaTimes.tsx`) is live on the hub. The old tool's component is now `CpaTool` in `CriticalPath.tsx`, which takes a `home` (its tabs; a row of pills instead of the topic chooser; no Course or Practice switch; only the options those tabs use), so the remaining tools are a few lines each. `CPA_LIVE` in `CriticalPathHomes.ts` lists the new tools that exist: a tab that has moved opens its new tool from an old link; the other tabs stay in the old tool until their chunk. The hub's DE links for the moved tabs point at the new tool.
- 2026-11-26 (chunk 3): **Activity Networks** (`/cpa-networks`, `CpaNetworks.tsx`) is live on the hub, built the way the chunk 2 note describes. Print templates now show only on tools that draw charts.

## Next steps
1. Changes and Reasoning, then Cascade Charts and Resources (each: its id in `CPA_LIVE`, a `Cpa…tsx` file like `CpaTimes.tsx`, a registry entry, a hub `toolIds` entry, the file in `scripts/testAreas.mjs` and the organisation test).
2. The exam page on the hub; retire the old tool.

## Where to read more
`src/tools/Decision/CriticalPath.tsx`, `criticalPathGenerate.ts`, `decisionSpec.ts`; `docs/pathways/resource-levelling.md`; `docs/pathways/decision-exam-questions.md`; `docs/architecture/DECISION_SHELL_PLAN.md`.
