# Faster builds, smaller merges and a steadier deck workflow
- **Status:** idea
- **Updated:** 2026-11-20

## Intention
The repo is now big enough that the way work is built, tested and merged slows everything down. Planned at Harry's request on 2026-11-20 after four problems came together:
1. **Every merge runs every test.** About 7 minutes of tests, run three times per merge (the session, the pull request, then `main` again), even for a docs-only change. Nearly all of it is Decision Maths.
2. **Branches live too long.** Several chats and Codex work at once; merging is left to the end of a 4000-line edit, and the same few files (patch notes, generated JSON, registry, tasks) conflict every time.
3. **Decks depend on the merge order.** The live deck service checks decks with the code on `main`, so deck content waits for a code merge, and pushing a deck needed the Auto mode switch.
4. **Decks vanished from the Decks page.** The device's storage (about 5 MB) was full, so downloaded decks were never saved, yet "Check for changes" said "Updated".

The aim: small chunks that each merge in minutes, checks that run only what a change could break, decks that can be pushed before the code they use is merged (showing a plain "code isn't available yet" message until then), and less to read at the start of every session.

## Progress
**2026-11-20, measured (nothing built yet):**
- **Test time.** The full suite is about 965 s of work across 153 files (about 6–7 min on the clock). Eight Decision Maths files take about 900 s of it: `levellingMethod` 200 s, `seedReplay` 166 s (160 s of it the Decision half), `cpaSkills` 101 s, `cpa` 90 s, `flowLayout` 88 s, `cpaExam` 87 s, `flowExam` 37 s, `flowReason` 35 s. The other 145 files take about a minute together.
- **Why Decision is slow.** Critical Path is 98% of Decision generation time (60 cells, 13.1 s for one problem each; Network Flows, TSP, MST and Route Inspection are about 1 ms). The generator makes random networks and throws away the ones that fail its rules: a Level 3 forward-pass problem tries about 3,800 random networks to find one that passes (under 1% pass), and the Resource histogram and Which-to-shorten questions try about 21,000 (about 1.8 s per problem). Each network is cheap (0.08 ms) but there are thousands, and the layout step is not the cost (0.8 ms). Level 1 needs about 37 tries and takes 1 ms. The tests then multiply this: `seedReplay` builds every Decision cell 10 times and `levellingMethod` runs 6–120 samples per check.
- **Network Flows layout tests** (`flowLayout`, 88 s; `pipeline9` alone 28 s) are slow for a different reason: the test checks every on/off combination of the optional parts (`1 << opt.length`). Not yet profiled.
- **CI.** `.github/workflows/ci.yml` runs on every pull request and again on every push to `main`: type check and build, lint, then all tests; a second job runs the shell smoke check. 340 runs so far; typical run 10–17 min. Nothing is selected by path.
- **Decks not visible.** Cause found: this browser's storage for the production address was full (the 13 live decks are about 1.5 million characters, one 11-slide starter alone is 845 KB, and each deck is held twice plus history). Incognito showed them. The shared copy was always fine. The live published list is empty (nothing published).
- **Docs cost.** `CLAUDE.md` 40 KB + `AGENTS.md` 24 KB are read every session (about 16,000 tokens); `docs/reference/decks.md` is 81 KB; `PATCH_NOTES.md` is 270 KB.
- **Tools added.** Plugins CI Optimizer, token-usage and Claude Education Skills Library; the Wolfram connector. Eedi still to be connected.

## Next steps
Each chunk is its own small branch and merge. Order matters: A and C2 first.

**A. Quicker builds and tests**
- **A1. Test areas and CI path filters.** Group tests by area (Decision, generators and shell, decks and the deck API, CS, docs only) and run only the groups whose files changed; type check and lint always run; a full run once a night and on request. Keep a plain list of which paths trigger which group, in the repo.
- **A2. Make the Critical Path generator build valid networks by design** instead of rejecting thousands: force the required features (an arrow that skips a column, a near-critical activity, the right number of critical paths) while building. Target under 50 ms a problem. The existing checks must still pass unchanged; compare the distribution of questions before and after so variety does not shrink. This is the real fix for Decision test time.
- **A3. Shrink the Decision tests safely.** After A2, trim the multiplied sampling (for example `seedReplay` seeds) only where coverage is not lost.
- **A4. Network Flows layout tests.** Profile `flowLayout`; replace the all-combinations check with a smaller one if equivalent.
- **A5. Split the tests across several runners** and stop re-running everything on `main` after a pull request that already passed.
- **A6. Run CI Optimizer's timings** on the real runs to confirm the savings.

**B. A merge flow for many branches**
- **B1. Small-chunk rule** in `AGENTS.md` and the kickoff: each merge leaves `main` working but need not be a finished tool. Layers: shared piece with its test, then the tool behind `enabled: false` or Developing-tools mode, then deck content, then the switch that makes it live. Merge a chunk as soon as it is green; the next chunk starts from the new `main`.
- **B2. Stop the common conflicts.** A patch-notes file per session instead of one shared file (a script builds the combined view); generated files rebuilt automatically, never merged by hand.
- **B3. Merge queue or auto-merge.** Check what the GitHub plan allows. If a merge queue is available use it; if not, auto-merge plus an automatic "update branch".
- **B4. Parallel sessions.** One worktree and branch per session (Claude chats and Codex), with the Handoff note as the claim list, so two sessions never take the same area.

**C. Decks**
- **C1. Fix stale docs.** `docs/TASKS.md` ("Decks: see and push deck changes before they are merged") still describes Vercel Blob; storage is Neon, and previews share the production database.
- **C2. Safety net for storage (small, first).** When a deck cannot be saved on the device: free space by dropping history and base copies of other decks, retry, and say "Storage full" if it still fails, instead of reporting "Updated".
- **C3. Store less on the device.** The Decks page lists decks from a small summary (title, slide count, category, first-slide preview) from the shared copy; opening a deck fetches it; the device keeps only recently opened decks and drops the least recently used. Needs a summary endpoint in `api/decks.ts`.
- **C4. "Code isn't available yet" message.** The deck service stops checking what only the latest code understands: it checks structure and size (so malformed data is still refused) and accepts unfamiliar optional fields and shapes. A slide or question the site cannot draw yet shows a clear placeholder ("This needs a newer version of the site; it will appear once its code is merged") instead of failing or crashing the slide, and the deck check lists such slides. Deck content can then be pushed before the code it uses merges.
- **C5. Pushing without the Auto switch.** Commit `.claude/settings.json` with allow rules for the routine deck commands (`pull`, `push`, `check`, `list`, `backup`), leaving `publish` and deletes to Harry. Test whether Accept edits then never prompts. If Auto still blocks, record that in `AGENTS.md`.
- **C6. Safe previews (optional, after C4).** A separate Neon database branch for Preview and a Vercel bypass secret, so a branch preview can receive deck pushes without touching the live decks. Needs about five minutes from Harry in the Vercel dashboard.

**D. Fewer tokens**
- **D1. Baseline** with the token-usage report on a few recent sessions.
- **D2. Slim the startup docs.** `CLAUDE.md` to the rules and a short index; split `docs/reference/decks.md` into topic files read one at a time; keep the docs size test in step.
- **D3. Try Graphify on a throwaway branch** only if D1 shows file reading is the main cost, and compare with the baseline.

**E. Quality of generated maths and lessons**
- **E1. Spot-check A-level generators with Wolfram** (Solving Trig Equations first) as an independent second opinion to the repo's own checks.
- **E2. Eedi** (once connected): look at how well-tested questions word wrong options, for Depth banks and misconception tags. Do not copy their questions into decks; check the licence first.
- **E3. Education Skills Library:** use it for lesson planning ideas (worked-example fading, practice sequencing, error analysis); keep it off by default if it adds noticeable startup tokens.

**Needs from Harry:** connect Eedi; the Vercel steps in C6; check the GitHub plan for B3; approve the `.claude/settings.json` change in C5.

## Where to read more
`.github/workflows/ci.yml`, `src/tests/` (the Decision files named above), `src/shared/decision/cpa.ts` (`candidate`, `acceptable`, `generateCpa`), `AGENTS.md` ("Decks Harry edits", "Pushing a deck", "Deck data format"), `docs/reference/decks.md` ("Deck data and the live server", "Sharing one deck between Harry and Claude"), `docs/TASKS.md`, `src/decks/store.ts`, `src/decks/cloud.ts`, `api/decks.ts`, `api/_decks.ts`.
