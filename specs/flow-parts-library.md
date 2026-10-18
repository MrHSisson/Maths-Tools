# Tool Spec: Network Flows — parts library, exam recipes and the Explain and justify tab

**Status:** implemented 2026-10-18 (chunks 1–7; the remaining corpus gaps are listed in `specs/corpus/network-flows.md`). Branch `claude/network-flow-difficulty-style-ek2mn9`.

## Why
Exam questions are chains of small parts, and each part is one skill with exam wording. Until now each chain in `flowExam.ts` wrote its parts by hand and the reasoning ideas in the current AS / A-level papers (flow vs cut, forced arcs, impossible flows, a pipe switched off, a capacity changed, a restriction, supersource in words) existed nowhere. This builds one **parts library**, makes every exam chain a **recipe** over it, and shows any reasoning part on its own in an **Explain and justify** tab.

## Decisions (teacher, 2026-10-18)
- Reasoning tab = **Explain and justify**, one sub-tool with an **Idea** option, in a lighter chooser group under Skills. Levels mean depth of reasoning, not network size. AS: deductions, claims, supersource in words. A-level: everything.
- Legacy-only ideas (a new road, initial flow from route maximums, "show that") are built behind an asterisk, off by default (as CPA's worker allocation).
- **No multiple choice.** Two-network questions ARE built (a question may carry two figures; this also helps generation).
- Existing exam questions may change wording / mark lines to follow the real schemes; tab keys and links keep working.
- Corpus of tagged paper questions lives in `specs/corpus/network-flows.md`; tests read it. Original wording only, no paper reproduced.

## Design
- `PartDef` (`src/shared/decision/flowParts.ts`): `{ id, idea, tier: "core" | "reasoning", course, legacy?, build(ctx) → ExamPart | null }`. `build` returns null when the network does not suit the part (so it doubles as the "needs" check) and may add facts to `ctx.facts` for later parts (cut, minimum cut, maximum flow).
- A **recipe** is an ordered list of slots, each a weighted pool of part ids. `composeFlowExam` samples a network, builds the slots in order, and retries (bounded) until every part builds. A measured acceptance rate per recipe is asserted in tests.
- The skill generators / solver supply every number and the (?) working; the library only supplies wording and mark lines.
- Explain and justify = a one-part exam composed from one Idea part. Every part carries `idea` and a practice link to the tab with that idea preset.

## Chunks (each committed and pushed on its own)
1. Contract + composer + AS chains ported to recipes (existing tests pass)
2. A-level chains ported
3. Reasoning parts (flow vs cut, claim correct/incorrect, supersource words, forced arc, impossible flow, pipe off, capacity change, restriction) + Explain and justify tab + recipes use them
4. Legacy-only parts behind an asterisk
5. Two-figure questions (ExamView + print)
6. Corpus + coverage test + Practise-this links
7. Docs, patch notes, planner notes
