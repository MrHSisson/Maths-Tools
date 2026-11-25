Strand: Maths

## 2026-11-25 — Decision and Further Mechanics hubs: chapter pages redesigned

Branch `claude/jolly-lovelace-tn70so`. Area: `src/shared/components/SpecLanding.tsx` (the shared hub page; both hubs read it).

- **Generators first.** A chapter page is now one card per tool: the tool's skills as plain rows (AS first, then A2), an "Open the tool" link, and underneath "Covers in the specification", the statements those skills address. No chip clusters.
- **A2 reads at a glance.** What A2 adds to a statement sits on its own line with the A2 tag at the end; A2 skills carry the tag at the end of the row.
- **Nothing in the spec is dropped.** Statements no built skill covers go in a "Not built yet" card (with the planned, unbuilt skills named); a chapter with no tool shows its whole specification.
- **Hub home** cards now name the tools you can open ("Coming soon" where there are none) instead of a statement count.
- **Exam-style questions** are a lighter row after the tools, shown only where a chapter has them.
- **Hidden for now:** the older-papers card and page and each chapter's question banks (`SHOW_OLDER_PAPERS` in `SpecLanding.tsx`; the data stays in the spec files). The Legacy M2 / D1 labels moved out of the statement rows into a Developing-tools-only "The older specification" section at the bottom of each chapter, to be built out later.
- Checked by hand at laptop (1366) and phone (390) widths; tablet width not looked at separately.
- Not done: where the older specification finally lives (it is a placeholder drawer); the dashboard Review for the hub pages is not set.

Agent: Claude Code
Notes: No Build Log block written this session (planner not updated); the design previews were made as private artifacts.
