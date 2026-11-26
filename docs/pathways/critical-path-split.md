# Critical Path Analysis: split into skill tools
- **Status:** building
- **Updated:** 2026-11-26 (design agreed; chunk 1 started)

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

## Next steps
1. Shared plumbing: the old-tab to new-home redirect table, hub pairings that can point at any tool, and a test that every old tab maps to a new home.
2. Times, Float and Critical Paths (the template for the others).
3. Activity Networks, then Changes and Reasoning, then Cascade Charts and Resources.
4. The exam page on the hub; retire the old tool.

## Where to read more
`src/tools/Decision/CriticalPath.tsx`, `criticalPathGenerate.ts`, `decisionSpec.ts`; `docs/pathways/resource-levelling.md`; `docs/pathways/decision-exam-questions.md`; `docs/architecture/DECISION_SHELL_PLAN.md`.
