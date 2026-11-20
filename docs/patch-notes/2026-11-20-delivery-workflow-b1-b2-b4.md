Strand: Maths

## 2026-11-20 — Delivery workflow, steps B1, B2 and B4: small chunks and fewer merge conflicts

Branch `claude/great-heisenberg-5a3nko`. Area: `AGENTS.md`, `docs/patch-notes/`, `scripts/patchNotes.mjs`, `scripts/gitSetup.mjs`, `.gitattributes`, `package.json` scripts.

- **Patch notes are one file per session** (`docs/patch-notes/YYYY-MM-DD-<slug>.md`). `docs/PATCH_NOTES.md` is now built from them (`npm run facts`), so two sessions no longer edit the same 270 KB file. All earlier entries are in `docs/patch-notes/_base.md`.
- **Generated files no longer conflict.** `npm install` sets a git merge rule so a merge keeps your copy of `toolFacts.json`, `adminDocs.json` and `PATCH_NOTES.md`; run `npm run facts` after the merge.
- **Rules in `AGENTS.md`:** build in small chunks that each merge early (shared piece, tool behind a flag, deck content, the switch), kickoffs ask for one chunk, and parallel sessions each use their own worktree and branch with the Handoff note as the claim list.
- Not done: the merge queue or auto-merge (B3) needs a check of the repository settings by Harry.

Agent: Claude Code
Notes: Build Log block not yet written.
