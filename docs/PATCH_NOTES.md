# Patch Notes — Maths Tools

A running, human-readable log of what each session shipped. At the **start of a new
conversation** read only the top few entries to see where we're up to (older
months are in `docs/history/`); add an entry at the **end of a session** before pushing. It complements the other docs:

- `CLAUDE.md` — how to build (conventions, APIs, checklists). *The rules.*
- `docs/TASKS.md` · `docs/pathways/` — what is open and what is being built. *The plan.*
- `docs/architecture/CS_SHELL_PLAN.md` · `docs/architecture/DECISION_SHELL_PLAN.md` — the two purpose-built shells' architecture.
- `docs/GLOSSARY.md` — canonical names for every element. *The vocabulary.*
- **`docs/PATCH_NOTES.md` (this file)** — what actually happened, session by session. *The history.*

The site hosts **two subjects** and they are tracked separately below: **Maths**
(the bulk of the app, built on `ToolShell`) and **Computer Science** (a younger
strand on its own `CSShell`). See `CLAUDE.md` → "Two subjects — repository map".
Keep the split even when a session only touches one.

> **This file is history, not status.** For "where are we now / what's next", see
> `docs/TASKS.md` and `docs/pathways/` — the planning surfaces. This file is the newest-first record
> of what each session shipped.

> **Entries name the agent.** Each entry ends with an `Agent: Codex` or `Agent: Claude Code` line and a `Notes:` line naming its planner Build Log block (tagged `agent:codex` or `agent:claude-code`). Entries go inside the Maths or Computer Science section below, never above this introduction.

> **Dates** are the commit dates of the session's work. Newest first within each
> strand. An entry is a *session's worth* of work, not a per-commit changelog —
> group by what was actually built and link the tool/page it touched.

---

# Maths

## 2026-11-10 — Decision Maths hub: generator sub-tools under each specification statement

Branch `claude/loving-bell-i2troy`. Areas: `src/tools/Decision/decisionSpec.ts` (`DECISION_PAIRINGS`, `DECISION_GROUPS`), `src/tools/Decision/DecisionOverview.tsx`, `src/shared/components/SpecLanding.tsx`, `src/tests/decisionPairings.test.ts`.

- **Statements are paired with the sub-tools that practise them** (Critical Path chapter, DE1 to DE6): each statement lists its sub-tools as links that open the tool on that sub-tool (`?tool=…&o_course=…&o_practice=…`). DE1: Network from a table, Table from a network. DE2: Forward pass, Full analysis, Missing time. DE3: Full analysis, Float and critical paths. DE4: Delays and changes, Explain and justify, and at A-level Which to shorten and Limits of the model. DE5: Cascade/Gantt chart, Resource histogram. DE6: Resource levelling.
- **Exam-style questions** (AS and A-level) and the **older-papers-only** sub-tools (the two worker-allocation ones) are listed under the statements. The AS tab shows the AS sub-tools; the A-level tab adds the A-level ones.
- **A test keeps the pairing honest** (`decisionPairings.test.ts`): every paired sub-tool exists in the tool with the same name, course and practice, and every Critical Path sub-tool is placed somewhere, so adding one fails until it is paired.
- **Banked:** a Backward pass sub-tool (docs/TASKS.md): DE2 asks for latest times and only Full analysis practises them.
- All 25 links checked in headless Chromium: each opens its sub-tool.

Agent: Claude Code
Notes: no planner Build Log block written this session.

## 2026-11-09 — Decision Maths: one hub, by specification code

Branch `claude/loving-bell-i2troy`. Areas: `src/registry.ts` (`hub`), `src/components/LandingPage.tsx`, `src/shared/components/SpecLanding.tsx`, `src/tools/Decision/DecisionOverview.tsx`.

- **One card for Decision.** The A-Level tab shows a single **Decision Maths** card; the other seven tools carry `hub: 'decision-overview'` and no longer have a card of their own (the search box still finds them, routes are unchanged). The hub is live for everyone and `/decision` redirects to it.
- **The hub is the way in by spec code.** Chapters DA to DG with an AS / A-level switch; a chapter opens to its generators first, then its specification statements. Live generators only for teachers, "Coming soon" where none is live, "not built yet" where there is none; a chapter has its own address (`#DB`), also when pasted into the page already open. Network Sandbox is listed as a workspace.
- **Planning material stays in Developing-tools mode:** legacy D1 and D2 links and notes, question banks, the older-papers page, Dev badges and tools not yet live. `SpecLanding` takes a `public` option for this; Further Mechanics does not use it and is unchanged (still behind the password).
- Checked in headless Chromium at 1366×768 and 390×800 (no horizontal overflow). Full suite and build pass.

Agent: Claude Code
Notes: no planner Build Log block written this session.

## 2026-11-09 — Saved questions: named lists that mix tools; pins and the print basket are one saved list; Advent Calendar names backup; every generator rebuilds from its seed

Branch `claude/loving-bell-i2troy`. Areas: `src/shared/components/PinButton.tsx`, `src/shared/questionKeeper.ts`, `src/shared/decision/` (`usePrintBasket.tsx`, `DecisionShell.tsx`), `src/tools/TeacherTools/AdventCalendar.tsx`, `src/tools/Binary/FileSizes.tsx`, `src/tools/Algebra/NonLinearSimEq.tsx`, `src/tests/seedReplay.test.ts`, `docs/pathways/saved-questions.md`.

**Saved questions** (both shells)
- **Named lists that mix tools.** The pin panel gains a list picker (new, rename, delete; always one called Saved) and saved questions now live in site-wide lists (`src/shared/savedLists.ts`, `mt-saved-lists`, 30 per list, 20 lists), each remembering its tool page. A question from another tool shows with its tool's name; picking it goes to that tool with the question restored (`?pick=`). A page's old basket joins the open list on its first load. The print page prints only the current tool's questions and marks the rest. Tests: `savedLists.test.ts`.
- **One saved list.** The pin saves the question on screen as a recipe (tool or sub-tool, level, options, seed) kept on the device under the page's key, up to 30, so a saved question survives a reload and comes back exactly as it was (tool, level and options too). It is the list the Decision print basket prints; a saved question without a print sheet is marked and left out of a print. Each carries a fingerprint, and a restore that no longer matches says the tool has changed. Recent stays memory only. `src/shared/questionKeeper.ts` (a `SavedAdapter` per shell), `savedRecipe.ts`, `decision/usePrintBasket.tsx`, `ToolShellCore.tsx`, `DecisionShell.tsx`; tests in `savedQuestions.test.ts`.
- **One control.** The pin button is now a joined split control. The main half pins; the chevron opens one panel with Pin, Add to / Remove from print basket and **Open print basket** (Decision tools; the basket opens even when the question on screen cannot be saved), the Pinned list and the Recent list. The separate basket button is gone. On phone widths the panel spans the screen above the bottom bar. The burger menu and the basket's own dialog are unchanged.
- **Plan:** `docs/pathways/saved-questions.md` (pins and the basket become one saved list kept on the device, printing an ability of a saved question).

**Seeds**
- Audit of every generator: all Maths-shell and Decision generators rebuild the same question from the same seed except `FileSizes` (all levels) and `NonLinearSimEq` (level 3), which kept "don't repeat" memory at module level. That memory is removed; the shell's own content check still refuses identical questions. `src/tests/seedReplay.test.ts` now fails on any generator that differs from the same seed (rule R45).

**Advent Calendar:** Teacher controls gain **Download names** and **Load names from file** (a small JSON file with the names and schedule), so the names survive a browser that clears its storage and move between devices.

Tests: the full suite (126 files) and the build pass. Checked in headless Chromium at 1366×768, 1024×768 and 390×800.

Agent: Claude Code
Notes: no planner Build Log block written this session.

## 2026-11-08 — Advent Calendar: 24 doors, a name per door, full screen, password; histogram print grid, print basket Reload, "Show N − 1 is not enough"

Branch `claude/focused-hopper-nndnwu`. Areas: `src/tools/TeacherTools/AdventCalendar.tsx`, `src/registry.ts` (the card's description), `src/shared/decision/` (`HistogramView.tsx`, `cpaSheet.tsx`, `cpa.ts`, `cpaSolve.ts`, `usePrintBasket.tsx`, `PrintBasket.tsx`, `DecisionShell.tsx`), `src/tools/Decision/CriticalPath.tsx`, `src/tests/levellingMethod.test.ts`.

**Advent Calendar** (Classroom; still Developing-tools only)
- **24 doors in 4 rows of 6** (was 25 in a 5-column grid). On a phone the grid is 4 columns by 6 rows so the names stay readable; full screen is always 6 by 4. Saved calendars carry over (door 25 is dropped).
- **Who is behind each door is typed door by door** in Teacher controls (Door 1 … Door 24). A door left empty shows "Merry Christmas!". Pasting a list is still there, now "Fill doors from list" (in order, or at random). Reshuffle shuffles whatever is behind the doors now.
- **Full screen:** an expand icon beside the gear frames the 24 doors in the middle of the screen, sized to fit (checked at 1366×768, 1920×1080, 1180×820, 390×800 and 820×1180: nothing scrolls or overflows). Where the browser has no full-screen mode (an iPhone) the same layout fills the window. The same icon or Esc leaves it.
- **Teacher controls are behind the Developing-tools password** (`checkDevPassword`), asked every time the gear is pressed and locked again when the controls close, so a stray press never shows the names. It stops accidents; the password is in the page's code, so it is not secure against someone who looks. Developing-tools mode does not unlock it (decided with Harry).

**Critical Path — Histogram and print**
- **Fine grid on the blank histograms to draw** (print sheets only): a faint line at every time unit and a darker one at every fifth, so a value such as 63 on an 80-day axis is easy to find. Skipped past 120 units. Histograms already drawn, and the on-screen walkthrough, keep the dashed grid.
- **Print basket: Reload.** Each saved question has a Reload button that brings it back onto the page with the same seed, sub-tool, level and options, ready to work through.
- **Histogram Level 3, "Can it be N − 1?" is now "Show N − 1 is not enough".** The question asks to show the project cannot be done in the minimum time with N − 1 workers, and the working needs no levelling or sliding: total work (the sum of duration × workers) ÷ N − 1 is more than the project time; where that sum does not prove it, the activities that must run together at one time are shown instead. Three short steps (two for the must-run proof). The print sheet draws only the given or blank histogram (no "after cutting the peak" one). The question falls back to "Show N is enough" when no such proof exists, as before.

Tests: `levellingMethod` updated for the new walkthrough (no slide steps; the sum really exceeds the project time). Build, type-check and the full test suite pass.

Not done: the print grid, Reload and the shorter walkthrough were not checked by eye on a printed page, phone or tablet (only measured in headless Chromium for the Advent Calendar); the Advent Calendar has no dashboard note.

Agent: Claude Code
Notes: planner Build Log blocks for this work are for Harry to write.

## 2026-11-08 — Resource histogram and resource levelling reworked, with printing and a print basket

Branch `claude/new-session-6gg0my` (one entry for the whole piece of work; it replaces about a dozen working-day entries). Plan and decisions: `specs/resource-levelling.md` ("As built") and `docs/pathways/resource-levelling.md`. Areas: `src/shared/decision/` (`cpa.ts`, `cpaSolve.ts`, `cpaSheet.tsx`, `printCpa.ts`, `printBasket.ts`, `usePrintBasket.tsx`, `PrintBasket.tsx`, `DecisionShell.tsx`, `types.ts`, the `HistogramView`, `GanttView` and `ActivityNodeView` renderers), `src/tools/Decision/CriticalPath.tsx`, `src/shared/seededGenerate.ts`, `src/tests/`.

**Resource levelling (A-level)**
- Three levels: 1 one worker each and the first fix clears the clash; 2 one to four workers each (the largest needs at least three), the same; 3 the first fix leaves a clash (a knock-on), within a *Most tries* option (3 / 5 / 8). The limit always forces extra time, with at most two clashes and the peak at most two over the limit. Queue questions (most tasks needing over half the workers) are left out by the tries cap.
- Options: *Ask for* (minimum time, extra time, new start of the last activity, explain the effect of the limit), *Workers per activity* and *Most tries* (Level 3). The new start of the last activity needs a network that ends in one activity, so Level 3 asks for the time instead.
- **The method students use** (quick sums, one ranked list, smallest first, ties to an activity with float) is `levelMethod` beside the exhaustive solver `levelSchedule`; it matched the solver on the real exam questions and on random networks.
- **The worked example follows the method:** the histogram with clashes labelled "needs 10 / limit 9", the first clash with the rest dimmed (and the worker sum), a ranked quick-sum table, each try drawn as its own histogram with the held block ghosted and an arrow to its new place, a step for each knock-on clash, the check, and the final answer with a written **Write it up** card (numbered lines and the filled-in write-up). Steps are a line or two each.

**Resource histogram (A-level)**
- Level 1 draw it, one worker each (*Network size* option); Level 2 draw it, one to three workers each; Level 3 **cut the peak within the float**: fewest workers, show N is enough, or can it be N − 1 (*Ask for*), with the worker-days and must-run floors as the reason (must-run stretches shaded red on the cascade chart), at most two activities moving, early or late start, and *Workers per activity*. *Histogram: Given / Draw it* says whether the histogram is on the question or the student draws it first.
- The Level 3 working shows the network with its times and the critical path (and the cascade chart behind arrows), so precedence and knock-ons can be read.

**Pictures**
- **Drawing order** (both tabs): critical activities along the bottom, then the rest longest first, no holes or overhangs. An activity that needs workers is written **D(3)** on the network boxes, the cascade chart and the histogram blocks, and in the step text; one-worker questions keep plain letters. A fixed vertical scale across the steps, a white halo on labels, an arc arrow (straight for a short move) with the ghost under the blocks, and a fuller legend.

**Printing and the print basket**
- **Print this question** is an A4 sheet (Resource histogram and Resource levelling, any level): the question, a centred workers table, the network with times and the critical path, the cascade chart with floats, then the histograms (given, or blank to draw; Levels 1 and 2 leave the cascade chart off because it would show the drawing, and give the histogram the page). An answer sheet fills them in. Every one of 60 sheets rendered to A4 PDFs fit one page.
- **Print basket:** an icon beside the pin (and *Add to print basket* in the burger menu) saves the question, with a message ("Added to print basket (3) · Open basket"). The basket (up to 30, kept in the browser) prints questions, answers or both, each on its own page. A saved question is only its recipe (tab, level, options, seed), so a basket can be carried to another device as a link; a damaged link is ignored. Meant for short-term use (a later change to how questions are generated would change a saved one).

**Dashboard and docs**
- **Print basket is a listed feature:** `docs/FEATURES.md` has "Print sheets and the print basket" (it shows on the dashboard's Features page), and the dashboard reads a new fact `printBasket` from the code (`scripts/toolFacts.mjs`, `src/admin/facts.ts`): it appears in the Feature tracker, each tool's profile and the Matrix; today only Critical Path Analysis has it. `docs/reference/shell-extras.md` documents `forLevels`, `questionSheet` and the step-list flags; the glossary, Decision shell plan, spec and pathway are updated.

**Decision shell**
- New option field `forLevels` (an option appears only at its level), step-list flags `maxHeight` and `prose`, and `config.questionSheet` (the print sheets and basket). Chips wrap and long lists scroll instead of pushing the buttons down.

**Testing:** about 160 questions checked by an independent solver, about 1,300 drawn steps checked for overlaps and holes in the rendered SVG, 720 questions across 120 option combinations without a crash; every problem those five test agents found is fixed. New tests: `levellingMethod`, `criticalPathOptions`, `workerLabels`, `cpaSheet`, `printBasket`.

Not done: the exam-style chains still use the older levelling question and walkthrough; other Critical Path tabs and other Decision tools have no print sheet or basket; phone and tablet layouts of the new steps, the print basket and the toolbar icon were not checked (a quick check at 390 wide showed no sideways scroll); the Critical Path dashboard note.

Agent: Claude Code
Notes: planner Build Log blocks for this work are for Harry to write.

## 2026-11-07 — Landing page: subject drop-down on a phone

Branch `claude/gifted-pasteur-8ubr0a`. Areas: `src/components/LandingPage.tsx`.

- **On a phone the subject tabs (GCSE Maths, A-Level, Computer Science, Classroom) are a drop-down** instead of a row that scrolls sideways: one full-width button showing the current subject, opening a list of the four (large tap targets, a dot on the current one; a tap outside or Escape closes it). Tablet and laptop keep the underline tabs. It follows the "View as" setting (`useLayoutMode`).
- Checked in a browser at 390, 1024 and 1366 wide: a drop-down only on the phone, four options, choosing Classroom shows its tools and closes the list, an outside tap closes it, tabs on tablet and laptop, no sideways scroll, no console errors.

Not done: the planner Build Log was not written.

Agent: Claude Code
Notes: planner Build Log block not written this session.

## 2026-11-07 — Decision Maths landing page and legacy D1 / D2 map; shared spec landing page

Branch `claude/gifted-pasteur-8ubr0a`. Areas: `src/shared/components/SpecLanding.tsx` (new), `src/tools/Decision/decisionSpec.ts` and `DecisionOverview.tsx` (new), `src/tools/FurtherMechanics/`, `src/registry.ts`, `src/tests/organisation.test.ts`, `scripts/toolFacts.mjs`.

- **A Decision Maths landing page, `/decision-overview`** (Developing-tools only, in the Decision Mathematics strand; asks for the password itself). Seven chapter cards (DA Graphs, DB Networks, DC Network flows, DD Linear programming, DE Critical path analysis, DF Game theory, DG Binary operations) with an A-level / AS switch; a chapter opens to its statements (AS or A2 tag, legacy module, an (i) for why), the tools built for it and its question banks. The tools come from the registry, so a chapter's state (Live, Partly live, In development, Not built yet) is never typed; the page links to each tool.
- **The old course is two modules, D1 and D2, and they were mapped** by reading the AQA D1 and D2 combined papers on PMT (keyword counts, not a question-by-question read). D1: graphs, MST, route inspection, TSP bounds, graphical LP. D2: simplex, critical path with cascade diagrams and resource histograms, network flows, game theory. **Not found in either (so new to 7367): planar graphs and Euler's formula (DA3), Kuratowski (DA4), isomorphism (DA7), dominated strategies (DF4), games as linear programmes (DF6), upper and lower capacities and restricted nodes (DC6, DC7), and all of binary operations and groups (DG).** Legacy content the spec no longer asks for (sorting, bin packing, Dijkstra, matchings, allocation, dynamic programming) is listed under "Not in the current spec". All 74 links across both spaces were opened and return 200.
- **Further Mechanics and Decision now share one page component**, `SpecLanding` (the look, the AS filter, the chapter view, the papers view), each supplying only its data and words; the Further Mechanics page looks and behaves as before.
- **The year tabs read AS then A-level** on both landing pages (they were A-level then AS), and both now open on AS, the first tab.
- Checked in a browser at 390 and 1366 wide: the password gate, seven chapters, AS filter, the Networks chapter listing its three tools with Live / Dev, the not-in-spec list, mechanics unchanged, no sideways scroll, no console errors.

Deliberately not done: no pathway or task added for Decision (waiting for Harry); the Decision tools themselves were not touched; the network notation of the legacy CPA questions (arc or node) could not be read from the text; the planner Build Log was not written.

Agent: Claude Code
Notes: planner Build Log block not written this session.

## 2026-11-07 — Balloons rise when the wheel picks a name

Branch `claude/gifted-pasteur-8ubr0a`. Areas: `src/shared/components/Balloons.tsx` (new), `src/tools/TeacherTools/NameWheel.tsx`.

- **Balloons float up the screen with the confetti when the Name Wheel reveals a pick**: 16 on a laptop and 10 on a phone, in the wheel's own colours, shaded with a highlight, a knot and a wavy string, swaying as they rise and leaving at the top over about ten seconds. They never catch a tap (the Remove and Keep buttons work underneath), and a device set to reduced motion gets none. It is a shared component (`Balloons`) like `Confetti`.
- Checked in a browser at 390 and 1366 wide: nothing before a reveal, balloons painted during it and cleared by the end, none with reduced motion, no console errors.

Not done: the Advent Calendar has confetti but no balloons (not asked for); the planner Build Log was not written.

Agent: Claude Code
Notes: planner Build Log block not written this session.

## 2026-11-07 — Confetti when a name is revealed (Name Wheel, Advent Calendar)

Branch `claude/gifted-pasteur-8ubr0a`. Areas: `src/shared/components/Confetti.tsx` (new), `src/tools/TeacherTools/NameWheel.tsx`, `src/tools/TeacherTools/AdventCalendar.tsx`.

- **A confetti burst when a name is revealed**: two fountains from the lower corners and a shower from the top, about four seconds, fading out. On the Name Wheel it uses the wheel's own colours and fires with each pick; on the Advent Calendar it uses gold, red, green and cream and fires when a door with a name opens (not for a greeting door). It never catches a tap, and nothing plays for a device set to reduced motion.
- It is one shared component (`Confetti`) that any reveal can mount.
- Checked in a browser at 390 and 1366 wide: nothing painted before a reveal, confetti painted after it and gone by the end, it ignores the pointer, none for a greeting door, none with reduced motion, no console errors.

Not done: the planner Build Log was not written.

Agent: Claude Code
Notes: planner Build Log block not written this session.

## 2026-11-07 — Name Wheel: settings hidden from the board

Branch `claude/gifted-pasteur-8ubr0a`. Areas: `src/tools/TeacherTools/NameWheel.tsx`.

- **The page shows only the wheel, Spin and who has been picked.** The saved-wheels pills, the names table, paste a list, colours, sound, shuffle and clear are in a Wheel settings dialog opened from a small, faint gear in the top-right corner (a full-screen sheet on a phone; Done, Escape or a tap outside closes it on larger screens). The gear is hidden while the wheel spins. Shuffle and "Clear the picked list" moved into the dialog; the wheel's name shows quietly under the title.
- Checked in a browser at 390 and 1366 wide: no inputs or settings words on the page at the start, two wheels made and switched from the dialog, a spin, the picked list surviving a reload, no sideways scroll, no console errors.

Not done: the planner Build Log was not written.

Agent: Claude Code
Notes: planner Build Log block not written this session.

## 2026-11-07 — Advent Calendar: big reveal and doors that open on their date

Branch `claude/gifted-pasteur-8ubr0a`. Areas: `src/tools/TeacherTools/AdventCalendar.tsx`.

- **A big reveal.** Tapping a door swings it open and shows the name large on a card over the calendar, so the whole class can read it. The card has Done (or Escape, or a tap outside) and "Close this door again"; tapping an open door shows its card again. A door is no longer closed by tapping it.
- **Doors that open on a schedule you set (optional, in Teacher controls, default off, remembered).** Harry's class starts on a Monday in November, so doors are not tied to December dates. With it on you pick the day door 1 opens (it defaults to today, or the coming Monday at a weekend) and whether to skip weekends (on by default); one more door opens each day (each school day). Doors stay shut until their day: dimmed with a lock, and tapping one says when it opens. The door backs show their day, today's door glows, the subtitle says "Today is door N" (or when door 1 opens), and the controls show when door 25 opens and how many can be opened today. Open all opens only the open doors. With it off, any door opens at any time and the backs say "Door N".
- **The name entry and settings are hidden from the board.** The Teacher controls bar is gone from the page; everything (names, shuffle, schedule, open and close all) now sits in a dialog opened from a small, faint gear in the top-right corner (Done, Escape or a tap outside closes it). Nothing about names or controls shows while the calendar is on the board.
- Kept: the festive background, snow and doors, and the names saved on this device only.
- Checked in a browser (390 and 1366 wide) with the date fixed on a Saturday before the start, the Monday start, a Wednesday, a weekend and the second Monday (start Monday 9 November, school days): 0, 1, 3, 5 and 6 doors open, today's door marked only on school days, door 25 on Friday 11 December, the settings survive a reload, no sideways scroll, no console errors. (An earlier version of this entry tied doors to December 1 to 25; that did not fit a class starting in November.)

Not done: no saved calendars and no restyle to the site chrome (not asked for); the planner Build Log was not written.

Agent: Claude Code
Notes: planner Build Log block not written this session.

## 2026-11-06 — Classroom tab; Name Wheel in the site style with saved wheels; Further Mechanics as a landing page

Branch `claude/gifted-pasteur-8ubr0a`. Areas: `src/components/LandingPage.tsx`, `src/registry.ts`, `src/tools/TeacherTools/NameWheel.tsx`, `src/tools/FurtherMechanics/`, `CLAUDE.md`.

- **Classroom is its own landing tab.** The Visualiser, the classroom sandboxes and the Workshop pages no longer repeat at the bottom of GCSE Maths, A-Level and Computer Science: the strands that were subject "All subjects" are now subject "Classroom", and the tab row has four tabs (it scrolls sideways on a phone). Workshop still shows only in Developing-tools mode.
- **Name Wheel redone in the site's own style** (page background, white cards with the soft border and shadow, blue-900 buttons, pill and underline controls, a fixed bottom Spin bar on a phone), dropping the festive look; four colour sets, Festive being one. **Several wheels can be saved**: a row of pills switches between them, with New wheel, rename, duplicate and delete (with a confirm). Each wheel keeps its own names, entries, colours and picked list; the list from the earlier single-wheel version is carried over as the first wheel. Stored on this device only.
- **Further Mechanics stripped to a landing page.** Five chapter cards (with an A-level / AS switch; a chapter with no AS content is greyed) open to that chapter's statements, each with its AS or A2 tag, the printed formula, the legacy module and an (i) for the note on why. The stat tiles, the check write-up and the general links moved behind one "Older papers and question banks" card. Styled like the rest of the site; no longer the look of the supplied file. Still Developing-tools only.
- Checked in a browser at 390 and 1366 wide: the tabs, the Classroom tab's contents, two wheels surviving a reload, a spin, the AS filter, no sideways scroll, no console errors.

Not done: the Advent Calendar keeps the festive look it was built with (it is a Christmas tool); the planner Build Log was not written.

Agent: Claude Code
Notes: planner Build Log block not written this session.

## 2026-11-06 — Name Wheel and Advent Calendar (Classroom, dev-gated)

Branch `claude/gifted-pasteur-8ubr0a` (the same session as the Further Mechanics entry below). Areas: `src/tools/TeacherTools/NameWheel.tsx`, `src/tools/TeacherTools/AdventCalendar.tsx`, `src/registry.ts`, `src/tests/organisation.test.ts`, `scripts/toolFacts.mjs`.

- **Two classroom sandboxes, rebuilt in React from Harry's standalone HTML files.** Name Wheel: a wheel with extra entries per name, a chance column, paste-a-list, shuffle, a tick sound, six themes, a picked-so-far list and a "remove from wheel" prompt after each spin. Advent Calendar: 25 doors that swing open, a name or a greeting behind each, teacher controls to paste names, shuffle, open all and close all.
- Both keep their names on the device only (localStorage, same keys as the originals) and send nothing anywhere. Both are in the Classroom category with `enabled: false`, so they are listed only in Developing-tools mode; the dashboard files them as sandboxes.
- Kept from the originals: the festive look (Advent Calendar; Name Wheel's Christmas theme is the default) and the behaviour. Changed: Georgia in place of the Fraunces web font (the site loads no web fonts), no fixed `showEditor` setting, and a name-wheel label threshold that is now a fixed 100 entries.
- Checked in a browser at 390 and 1366 wide: names land on doors, open-all and the saved state survive a reload, a spin ends in the prompt and removes the winner's row, no sideways scroll, no console errors.

Deliberately not done: no About panel, no print, no phone-specific layout beyond responsive widths; the planner Build Log was not written.

Agent: Claude Code
Notes: planner Build Log block not written this session.

## 2026-11-06 — Further Mechanics space (AQA 7367 MA–ME), dev-gated

Branch `claude/gifted-pasteur-8ubr0a`. Areas: `specs/exam/spec/aqa-mechanics.md`, `src/tools/FurtherMechanics/` (page and data), `src/registry.ts`, `src/tests/organisation.test.ts`, `scripts/toolFacts.mjs`.

- **The spec is in the repo.** `specs/exam/spec/aqa-mechanics.md` holds the 25 mechanics statements (MA 2, MB 4, MC 7, MD 6, ME 6) quoted from the AQA A-level (7367) and AS (7366) specifications, with an AS / A2 column: 16 are in AS and 9 are A2 only (MD4 to MD6 and all of ME); MB1 to MB3, MC1 and MC7 are in both but without resolving, or without Fd cos θ, at AS.
- **A new space for it, `/further-mechanics`.** One page, a card per chapter: each statement with its AS or A2 badge, the AS limit, the printed formula, and the legacy AQA module it came from; a year filter (all / AS only) and a chapter filter; the question banks found for each chapter (45 links, each opened and returning 200). Developing-tools only: the registry entry is `enabled: false` (listed on the landing page only in Developing-tools mode, category "Further Mechanics" under A-Level) and the page asks for the Developing tools password itself. No question tools yet; each chapter card says "Tool: not built yet".
- **The first legacy map (made by Gemini) was checked** against the AQA legacy M1, M2 and M3 combined papers on PMT. Most of it holds; vertical circles, work by a variable force and centres of mass by integration moved from M4 to M2, impulse moved to M3, MC7 (Power) was missing, every topic-pack link was dead, and nothing in M4 / M5 could be checked (PMT has no AQA M4 / M5 papers; its M3 and M4 topic pages are Edexcel). The findings are on the page.
- Checked in a browser at 390, 1024 and 1366 wide: the password gate shows, 25 statements show, 16 under AS only, ME hides under AS only, no horizontal scroll, no console errors; with Developing tools off the landing page does not list it.

Deliberately not done: no pathway or task added (waiting for Harry); the planner Build Log, Handoff note and the dashboard note for this entry were not written; the legacy mapping for M4 is still unverified; no question generators.

Agent: Claude Code
Notes: planner Build Log block not written this session (see "Deliberately not done").

## 2026-11-05 — Flowchart loop arrow timing; Leave full screen back on the bar; timer in two rows

Branch `claude/hopeful-allen-l6enha`. Areas: `src/decks/flowchart.ts`, `src/decks/PlayerBar.tsx`, `src/decks/DeckPage.tsx`, the live deck `primes-divisibility`, tests, docs.

- **A flowchart arrow now appears on the later of its two ends' clicks.** The loop arrow on the key point for 7 pointed into the first box, so it appeared with that box on the first click, long before the box it leaves existed. It now arrives with that box (click 4); fixed in the live deck too (two pieces of that arrow), and a test covers it.
- **Leave full screen is on the bar again** (always one click away, no longer inside Slide options).
- **The timer buttons in Slide options are two rows of five** (1 to 10 minutes).
- Checked in a browser: after the first click on the 7 slide only the first box shows; the bar is 402 px wide with the leave button; two timer rows. Layout check passes on the deck (40 slides).

Agent: Claude Code
Notes: planner Build Log block "2026-11-05 — Print slides, Auto text sizing, deck editor ribbon, live deck copy and rollback, full-screen bar, primes deck (Claude Code)".

## 2026-11-05 — Full-screen controls: a steady, movable bar with a Slide options pop-out; deck list tidied; primes deck trimmed

Branch `claude/hopeful-allen-l6enha`. Areas: `src/decks/PlayerBar.tsx` (new), `src/decks/DeckPage.tsx`, `src/shared/components/InkOverlay.tsx` (a `data-ink-bar` marker only), the live deck `primes-divisibility`, `docs/reference/decks.md`.

- **The full-screen bar no longer changes size.** It used to gain and lose the fill-in group depending on the slide, so it jumped. It is now always a grip, Back, the count, Next and **Slide options**; the fill-in group, timer, Jump to a slide, Print slides, the grids and sheets, and Leave full screen are in the Slide options pop-out.
- **It can be dragged along the bottom** by its grip, and the place is remembered. It stops short of the ink pencil's corner and rises above the ink pencil or hotbar if one is in its way.
- **The deck list no longer shows the description and the "Up to date with your other devices" line** under its title.
- **Primes and divisibility (live deck, now 40 slides):** the discussion on why the rule for 3 works was removed (Harry's call), and the key point for 11 was rewritten to be clearer: the rule states the starting sign and when to stop, the flowchart shows "+ − + − …", and there is a second example with a negative result (3619, ignore the minus sign). The worked-example slide for 11 has the same wording.
- Checked in a browser at 1366 wide: the bar is the same size on four different slides; the pop-out shows the board's fill-in group on a board slide and a note on one without; dragging works and survives a reload; the right edge stops at the ink pencil's corner; no overlap with the pencil or the open ink hotbar. Not looked at on a phone or tablet.

Agent: Claude Code
Notes: planner Build Log block "2026-11-05 — Print slides, Auto text sizing, deck editor ribbon, live deck copy and rollback, full-screen bar, primes deck (Claude Code)".

## 2026-11-05 — Primes and divisibility: no Check 11, steady sieve, a key point for every rule

Branch `claude/hopeful-allen-l6enha`. Areas: `src/decks/NumberGrid.tsx`, `src/shared/numberGrid.ts`, `src/decks/flowchart.ts` (new), the live deck `primes-divisibility` (pulled, changed, pushed; repo snapshot refreshed), tests, docs.

- **Check 11 is removed from the sieve** (the button, the dashed 11 multiples and the message, with its logic and tests). Why the sieve can stop is left to the discussion slide that follows ("To find the primes up to 100 we sieve with 2, 3, 5 and 7... Why can we stop?"), which already says it. A prime can still only be circled.
- **The sieve no longer jumps.** The buttons sat in a row that could wrap onto a second line, and the Check 11 message appeared under the grid, so the grid resized as buttons were pressed. The row is now always there at one fixed height and never wraps. Checked in a browser at 1366, 1024 and 390 wide: pressing every prime, Finish and Clear gives one grid position throughout.
- **Every divisibility rule has its own key point slide** (6 new slides, 35 to 41): 2, 5 and 10 (before the last-digit board), 3 (before "The rule for 3"), 11 and 7 (before their boards). Each has the rule, an example and what it implies. **The rules that are a process (3, 11 and 7) have a flowchart**, revealed a step per click; the one for 7 includes the loop for a long number. The slides are the `language` family, so Print slides → Key points picks them up.
- **A reusable flowchart helper** (`flowchartEls`), built from ordinary shape, text and line elements, so the parts can be moved by hand in the editor.
- Checked: deck content and layout checks pass on all 41 slides (before pushing, and the live copy passes `check --live`); flowchart and sieve tests pass. My first example for 7 reused a number a Depth card already uses, so the example is 301 (30 − 2 × 1 = 28).
- Not done: the new slides have no worked questions of their own (the existing sets follow); 2, 5 and 10 are three separate short slides, easy to merge into one if you prefer.

Agent: Claude Code
Notes: planner Build Log block "2026-11-05 — Print slides, Auto text sizing, deck editor ribbon, live deck copy and rollback, full-screen bar, primes deck (Claude Code)".

## 2026-11-05 — Deck list waits for the shared copies too

Branch `claude/hopeful-allen-l6enha`. Areas: `src/decks/DeckPage.tsx`, `docs/reference/decks.md`.

- **The deck editor's list showed the old title and preview, then swapped them.** Cause: the list drew the device's copy (or the repo's) at once and only then pulled the shared copy, so a title Harry had changed (the capitalised titles) showed in its old form first. My earlier fix covered opening one deck but not the list. The list now says "Loading the latest decks…" for a moment (4 s at most; offline it uses the device's copies) and then draws the shared copies only.
- Checked with the cloud simulated: with a delayed newer title the old title never appears; unreachable, the list opens from the device in about 0.3 s. Not tried against the real service.

Agent: Claude Code
Notes: planner Build Log block "2026-11-05 — Print slides, Auto text sizing, deck editor ribbon, live deck copy and rollback, full-screen bar, primes deck (Claude Code)".

## 2026-11-05 — Deck editor: one-row menus, grouped dropdowns, content in popovers

Branch `claude/hopeful-allen-l6enha`. Areas: `src/decks/Editor.tsx`, `src/decks/EditorChrome.tsx`, `docs/reference/decks.md`.

- **The double menu stack is gone:** the File / Edit / Insert / Slide / Layout / View bar under the title is removed. **File** now leads the tab row and **View** ends it; Edit moved to Home (copy, paste, duplicate, delete, Select), Slide to Home (a Slide menu), Layout to Design, and Insert was a copy of the Insert tab.
- **Grouped dropdowns, a condensed ribbon:** Insert has Basics, then **Shapes**, **Questions** and **Tables** dropdowns (tables, ratio tables, number grids and bar models are under Tables). Arrange is **Align**, **Layer** and **Size** menus plus Reveal.
- **The right panel is only "On this slide".** A table's cells, the generator and worksheet settings and a text box's words now open as popovers from the ribbon (Edit table, Settings, Edit text).
- Checked in a browser at 1366, 1024 and 390 wide: all tabs, folding, no overflow, no errors; saw the board popover and the Tables dropdown at laptop size. Not looked at by eye on a phone or tablet.

Agent: Claude Code
Notes: planner Build Log block "2026-11-05 — Print slides, Auto text sizing, deck editor ribbon, live deck copy and rollback, full-screen bar, primes deck (Claude Code)".

## 2026-11-05 — Deck editor: PowerPoint-style ribbon, right panel emptied of settings

Branch `claude/hopeful-allen-l6enha`. Areas: `src/decks/Editor.tsx`, `src/decks/EditorChrome.tsx`, `src/decks/EditorPanels.tsx`, `docs/reference/decks.md`.

- **The top bar is now a ribbon with four tabs and labelled groups** (Harry's request: "more like PowerPoint"). **Home**: undo, slides (new slide, previous / next), edit (duplicate, delete), then the selection's groups: Font (size, Auto, bold, colour), Paragraph (align, Middle), Text, Equation, shape colours and shape, line, questions. **Insert**: basics, shapes and lines, lesson pieces, all as buttons. **Design**: the slide's title, kind, brief, timer and About the deck. **Arrange**: line up, layer, size and position, and when it appears. A chevron folds the ribbon to just the tabs; the open tab is remembered.
- **The right panel keeps only content:** the text itself, board / ratio table / number grid / bar / generator / worksheet setup, and the list of what is on the slide. Slide settings, deck settings, click order and position moved out of it.
- Checked in a browser at 1366, 1024 and 390 wide: all four tabs open, the ribbon folds, no page overflow, no errors; a selected board still gets its cell editor in the panel. Looked at the Home, Design, Arrange and Insert tabs at laptop size only.
- Not done: widening the panel for table headers; the click-through menu for rare features (not wanted for now).

Agent: Claude Code
Notes: planner Build Log block "2026-11-05 — Print slides, Auto text sizing, deck editor ribbon, live deck copy and rollback, full-screen bar, primes deck (Claude Code)".

## 2026-11-05 — Decks: the command line works on the live copy; repo backup

Branch `claude/hopeful-allen-l6enha`. Areas: `scripts/deck.mjs`, `scripts/deckLayoutSmoke.mjs`, `docs/reference/decks.md`, `docs/design/DECK_BUILD_CHECKLIST.md`.

- **`npm run deck -- check <id|all> --live`** checks the live (shared) copy directly, without reading or writing the repo; with `--layout` it draws the live copy (the smoke script takes `DECK_FILE`).
- **`npm run deck -- backup [<id>|all]`** writes the live copies into `src/decks/data` as the repo snapshot. A file with unpushed edits is left alone and reported, so a backup can never overwrite work in progress.
- **`publish <id>`** now publishes the live copy (what Harry sees), not the repo file (`--file` for the old behaviour), then backs it up into the repo. Commit the snapshot.
- Together with the earlier steps (waiting for the shared copy on open, and the shared version history) this completes the agreed plan: the shared copy is the live master, the repo is a backup and the fallback.
- Checked against a fake of the service: live check, backup (written / kept / up to date), publish sending the live copy, and `--layout` drawing a 3-slide live copy rather than the repo's 35. Not run against the real service.

Agent: Claude Code
Notes: planner Build Log block "2026-11-05 — Print slides, Auto text sizing, deck editor ribbon, live deck copy and rollback, full-screen bar, primes deck (Claude Code)".

## 2026-11-05 — Decks: shared version history (rollback for the live copy)

Branch `claude/hopeful-allen-l6enha`. Areas: `api/decks.ts`, `api/_decks.ts`, `src/decks/cloud.ts`, `src/decks/VersionsDialog.tsx`, `src/tests/decksHistory.test.ts`, `docs/reference/decks.md`.

- **The service now keeps rollback points of every deck.** Before a spell of editing changes the stored deck, it keeps the deck as it stood (at most one every 10 minutes, the last 40; a save that changes nothing makes none). They are the same on every device, unlike the old device-only versions.
- **File → Version history** lists them first ("Shared history"), then the device's own. Restore puts one back as your next save, so Undo reverses it.
- This is the safety net for the shared copy being the live one: a bad edit by either of us can be rolled back.
- Checked with the blob store simulated (snapshot content, burst grouping, gap, no-change saves, key checks) and in the browser with the history stubbed. **Not tried against the real storage, which only the deployed site has**: please try it once after deploy.
- Not done yet from the plan: the CLI reading and writing the live copy directly, and a repo backup snapshot on publish. A deleted deck keeps no snapshot.

Agent: Claude Code
Notes: planner Build Log block "2026-11-05 — Print slides, Auto text sizing, deck editor ribbon, live deck copy and rollback, full-screen bar, primes deck (Claude Code)".

## 2026-11-05 — Decks: the shared copy is the live one (step 1: no stale flash)

Branch `claude/hopeful-allen-l6enha`. Areas: `src/decks/DeckPage.tsx`, `docs/reference/decks.md`.

- **A deck now waits for the shared (cloud) copy before it shows**, instead of showing the repo or device copy and swapping when the cloud one arrived. It says "Loading the latest copy…" for a moment (4 s at most; offline it opens straight from the device's copy). Opening straight into the editor (`?edit=1`) now gets the latest copy too; before, it started from the older one and only noticed after 20 s.
- Checked with the cloud simulated (delayed newer copy: the old one is never shown; unreachable: opens from the device in about 0.3 s).
- **Still to do from the agreed plan:** the CLI (`pull`/`push`/`check`) reading and writing the live copy directly, a repo backup snapshot written on publish, and cloud-side version history so a bad edit can be rolled back. The repo JSON is still the first-run fallback and what CI reads.

Agent: Claude Code
Notes: planner Build Log block "2026-11-05 — Print slides, Auto text sizing, deck editor ribbon, live deck copy and rollback, full-screen bar, primes deck (Claude Code)".

## 2026-11-05 — Deck editor: hotbar sorted into categories, panel slimmed

Branch `claude/hopeful-allen-l6enha`. Areas: `src/decks/Editor.tsx`, `docs/reference/decks.md`.

- **Insert** is one grouped menu (Image; Shapes and lines; Questions, tables and pictures). Text, Equation and Pen stay as direct buttons.
- **Style** menu in the hotbar for the extras that were only in the right panel: type on the slide, insert equation, middle (text); shape type, outline width, corners (shapes); thickness (lines); columns and cell position (grids, book activities).
- **The right panel no longer repeats the bar:** duplicate / delete, size and Auto, bold, align, colour, shape and line settings and "Line up and layer" are gone from it. It keeps the text itself, the board / ratio / number-grid / bar / generator setup, click order, position and size, and the slide's object list.
- **Turning Auto off keeps the size on screen** (it becomes the hand-set size).
- Not done (asked to leave): the click-through menu for rarely used features (timer, brief, click order, position, layout). Checked at 1366, 1024 and 390 wide: Insert has 13 items, no page overflow. Not reviewed by eye on a phone or tablet.

Agent: Claude Code
Notes: planner Build Log block "2026-11-05 — Print slides, Auto text sizing, deck editor ribbon, live deck copy and rollback, full-screen bar, primes deck (Claude Code)".

## 2026-11-05 — Deck Auto text sizing reworked: 75% fill, exact fit, boards fitted by part

Branch `claude/hopeful-allen-l6enha`. Areas: `src/decks/SlideCanvas.tsx`, `docs/reference/decks.md`.

- **Auto now fills about 75% of the box** (text and equations by height, book work by cell), instead of packing to the edge (`FIT_FILL`, `BOOK_FILL`). Text still never goes above the size set.
- **Exact fit:** the search finds the largest whole size that fits (bisection) instead of stepping down 7% at a time, and only restarts when the content changes (maths or a font arriving).
- **Boards (example tables) fit the header row and the body separately**, so a long heading no longer shrinks the numbers or the reverse. Measured on primes slide 18: header 32px, numbers 43px.
- Same-role text boxes still share the smallest size (kept for consistency). Ratio tables still scale as one piece. Not changed: questions/generator sizing, and Auto is still the default for new elements.
- Checked: `tsc`, lint, deck layout check on three decks (no spills). Numbers are smaller than before on some slides by design; not yet reviewed by eye.

Agent: Claude Code
Notes: planner Build Log block "2026-11-05 — Print slides, Auto text sizing, deck editor ribbon, live deck copy and rollback, full-screen bar, primes deck (Claude Code)".

## 2026-11-05 — Print slides: copies of each slide, even spacing, cut lines

Branch `claude/hopeful-allen-l6enha`. Areas: `src/decks/slidePrint.ts`, `src/decks/PrintSlidesDialog.tsx`, `src/tests/slidePrint.test.ts`, `docs/reference/decks.md`, `docs/FEATURES.md`.

- **Copies of each slide (1 to 8)** in File → Print slides…: the same slide prints repeatedly, for cutting up and handing out.
- **Even spacing:** the page is shared into equal slots and each slide is centred in its slot, so 2 to an A4 sheet cuts exactly in half with both pieces identical (before, both sat at the top with spare paper at the bottom).
- **Cut lines** (on by default): a faint dashed line between slides, only as far as the filled slots. Borders are now off by default (still available).
- Checked with `tsc` and `slidePrint.test.ts`; not yet looked at in a real print preview.

Agent: Claude Code
Notes: planner Build Log block not written this session (planner not opened).

## 2026-11-04 — Deck editor layout warnings

Branch `ccr-14b1aa72-aohwgk`. Areas: `src/decks/layoutAudit.ts` (new), `src/decks/Editor.tsx`, `docs/reference/decks.md`, `docs/FEATURES.md`.

- **The editor now flags layout problems on the open slide** (Harry's request): text that spills below its box, runs off the slide, or overlaps other text. An amber "layout warning" button by the zoom controls lists them; clicking one selects the element, and flagged elements get a dashed amber outline. Only text is judged, so shapes and lines behind text (the false alarms the command-line check gives on Fractional Powers) are not flagged. The terminal check (`npm run deck -- check <id> --layout`, `scripts/deckLayoutSmoke.mjs`) now follows the same rules (text against text only; it also catches text off the left or top edge), so Fractional Powers no longer reports the box-behind-equation overlaps and all four decks pass.
- Checked in a headless browser: no warning on Fractional Powers slide 8; overfilling a text box on an Estimation slide raised one. Not tried on a phone or tablet.

Agent: Claude Code
Notes: planner Build Log block "2026-11-04 — Decks page, dashboard Decks section, Estimation decimals, Pen palm rejection, Depth-run rule (Claude Code)" (layout warnings appended to it).

## 2026-11-04 — Never three Depth slides in a row; Estimation decimals reordered

Branch `ccr-14b1aa72-aohwgk`. Areas: `src/decks/deckChecks.ts`, `src/tests/deckDepthRun.test.ts`, `docs/design/DECK_BUILD_CHECKLIST.md`, `src/decks/data/estimation.json`.

- **New deck rule (Harry): never three Depth slides back to back.** The deck check now reports a run of three (`deckDepthRun.test.ts`); the checklist lists it. Only Estimation broke it (Does the size make sense? / Over or under? / Make an estimate of 0.3): *Does the size make sense?* now sits between the decimals whiteboards and the book activity.
- **Estimation decimals:** the "dividing by less than 1 makes the answer bigger" discussion now comes before the eight whiteboard questions.
- Pushed to the shared copy with the whole-deck overwrite (slide order is not merged: the stored order wins), after confirming the shared copy matched my pull.

Agent: Claude Code
Notes: planner Build Log block "2026-11-04 — Decks page, dashboard Decks section, Estimation decimals, Pen palm rejection, Depth-run rule (Claude Code)".

## 2026-11-04 — Deck editor Pen: palm rejection

Branch `ccr-14b1aa72-aohwgk`. Areas: `src/decks/Editor.tsx`, `docs/reference/decks.md`.

- **With the Pen on, the side of the hand no longer selects boxes.** Cause: a touch the pen layer ignored still bubbled to the canvas, which started a box-select and deselected. Now the pen layer always swallows touches, and a contact that is large (over 32px) or lands within 0.8 s of the stylus touching or hovering is dropped completely (no draw, no pan, no pinch). One finger still pans and two still zoom when no stylus is near.
- Checked with simulated pointer events only; not yet tried with a real stylus and hand.

Agent: Claude Code
Notes: planner Build Log block "2026-11-04 — Decks page, dashboard Decks section, Estimation decimals, Pen palm rejection, Depth-run rule (Claude Code)".

## 2026-11-04 — Estimation Level 2: decimals below 1 and hundredths

Branch `ccr-14b1aa72-aohwgk`. Areas: `src/tools/Number/Estimation.tsx` (+ `.about.ts`), `src/tests/estimationLevel2.test.ts`, `src/decks/data/estimation.json`, `specs/decks/estimation-y9.md`.

- **New Level 2 pool, Sizes Of Number** (all on by default): *Tenths* (the old mix, 4.8 × 0.39), *Both Below 1* (0.38 × 0.72), *Hundredths* (a number whose first significant figure is in the hundredths place, 0.048, with a tenths-scale partner) and *Whole Numbers*. Answers for the new types are exact (0.0007, 0.18); division only offers pairs with a short exact estimate (0.6 ÷ 0.08 = 7.5).
- **Fixes on the way:** Whole Numbers add/subtract used to build multiples of 10 that were always rejected and fell back to 42 × 1.9; `isAlreadyRounded` mis-read 0.3 and 0.07 through floating point.
- **Estimation deck, inside the existing Decimals section (still 53 slides):** the whiteboard set before the generator is now eight questions (tenths, both below 1, hundredths; each operation), and the Decimals book activity is a hand-written **4 × 4 set of 16** (`y9-bd1…16`, four steps of four), no longer generated. The rounding set gains 0.073 and 0.087. The generator slides pick up the new Sizes Of Number by default. Pulled Harry's shared copy first (it matched the repo apart from one flag). **Not pushed to the shared copy**: `npm run deck -- push estimation` is still to do.

Agent: Claude Code
Notes: planner Build Log block "2026-11-04 — Decks page, dashboard Decks section, Estimation decimals, Pen palm rejection, Depth-run rule (Claude Code)".

## 2026-11-03 — Decks get their own page; deck cards full width on a phone; dashboard review

Branch `ccr-14b1aa72-aohwgk`. Areas: `src/components/LandingPage.tsx`, `DecksPage.tsx` (new), `DecksTab.tsx`, `DeckGallery.tsx`, `src/App.tsx`, `src/decks/DeckPage.tsx`, `AdminGate.tsx`, `docs/TASKS.md`.

- **Decks are no longer a tab.** The landing page keeps the three subject tabs (GCSE Maths, A-Level, Computer Science); a **Decks** button in the header, beside the menu (not inside it), opens the Decks page at `/deck-gallery`. The old `/?tab=decks` address redirects there, and the deck player's and editor's back links go to it. The search box is now always shown on the landing page.
- **Deck cards on a phone** are the full width of the screen and centred, with the slide preview scaling to the card (`FitPreview`); tablet and laptop keep the fixed 296px cards.
- **Dashboard review (findings, not yet acted on):** the generated facts and the doc paths are current. Found: the "Move planning docs" task was finished weeks ago (removed); no live tool has a Review status set (0 of 47 reviewed; one game is "in progress"); `ratio-manipulation` and `rounding` notes still hold retired fields that nothing displays; the Techniques pathway still needs its `techniques` fact; the dashboard has no view of decks.
- **Dashboard: new Decks section** (side menu / bottom bar): every deck with strand, tool, slide count, published date and slides by kind, searchable and filterable, with a side panel offering Play and Edit (`src/admin/DecksSection.tsx`). Read from the decks, nothing typed.

Agent: Claude Code
Notes: planner Build Log block "2026-11-04 — Decks page, dashboard Decks section, Estimation decimals, Pen palm rejection, Depth-run rule (Claude Code)".

## 2026-11-03 — Estimation split and Order of Operations, book work cells, print slides, sieve, pen dots, deck strands

Branch `claude/blissful-albattani-afnvgf`. Areas: `src/shared/estimationOrder.ts`, `src/tools/Number/EstimationOrder.ts` (+ `Estimation.tsx`, `.about.ts`), `src/decks/data/estimation.json`, `src/decks/SlideCanvas.tsx`, `PrintSlidesDialog.tsx`, `slidePrint.ts`, `NumberGrid.tsx`, `src/shared/components/InkOverlay.tsx`, `src/components/DecksTab.tsx`.

- **Estimation deck, add / subtract split from multiply / divide.** A new add-and-subtract book activity follows its whiteboards; a divider "Multiplying and dividing" (calculators out) opens the second half, whose whiteboards and book activity now cover only × and ÷, so the book work compares the two. Section **Order of operations** at the end (before the summary): divider, two boards (no brackets, brackets), seven authored questions, two generator slides, a book activity. Summary and objective mention it.
- **New sub-tool: Estimation → Order of Operations** (levels: × or ÷ with + or −; brackets; decimals and squares). One engine (`estimationOrder.ts`) parses an expression, rounds every number to 1 s.f., works it in order and gives the Original / Round / "Multiply first" / "Brackets first" / "Square first" / "Then …" steps, for the generator and the authored deck questions alike. Not calibrated yet (R25).
- **Book work:** generated and hand-written sets share one cell design (`BookCell`); Auto stops at a comfortable size (64), not the old 110.
- **Print slides** (File → Print slides…, player button): all, key points or a pick, 1 / 2 / 4 / 8 to an A4 sheet.
- **Primes sieve:** primes can only be circled, **Check 11** shows its multiples are already crossed out; the duplicate sieve slide went.
- **Fractional powers book work** is three hand-written sets of twelve (3 × 4, ordered as difficulty ladders; roots and powers is six one way, then six the other) instead of generated sets; hand-written book work is drawn like a generated one (small instruction, large maths, a shared instruction said once). Estimation's first product question changed to 34 × 22 because 36 × 23 reused a Depth number.
- **Book work cells:** Auto fills 70% of a cell (`BOOK_FILL`, one number), an `align` setting centres the question in its cell (editor: Questions in their cells), the open-row look stays. Boards, text, equations, ratio tables and question slides keep their own Auto rule (decided with Harry).
- **Pen:** a dab right after nearby writing is a dot, not a button press.
- **Decks tab and deck editor list** share one strand-grouped card layout (`src/components/DeckGallery.tsx`); with Developing tools on the tab also shows unpublished decks, tagged. A deck's strand is set under About the deck.
- **CI stability:** tests no longer time out at the default 5 s on CI's two cores (60 s test timeout, two retries on CI only), and the two statistical tests that failed by chance (`splitLayout`, `orderDifficulty` spread) draw from a seeded random stream (`src/tests/seededRandom.ts`). Cause found from the run history: heavy Decision Maths network tests plus unseeded small-sample thresholds.
- **Banked, not started:** worksheet formats (textbook style, more on a page) are a task in `docs/TASKS.md`.

Agent: Claude Code
Notes: planner Build Log block "2026-11-03 — Estimation split and Order of Operations, book work, print slides, deck categories (Claude Code)".

## 2026-11-02 — Manipulating ratios: Worksheet 3 is fully hand-written, still a printable worksheet

Branch `claude/relaxed-cerf-4tu512`. Areas: `src/decks/data/manipulating-ratios.json` (slide `mr-w3`), `specs/decks/_check/ratio-w3-build.py`, `docs/reference/decks.md`.

- **Worksheet 3 (a mixture) is twelve authored questions**, kept as the pinned printable worksheet (the slide stays the hand-out cue with the answers on a click; print and answer sheet come from File → Worksheets, one page each). They mix "of the total" and "of a part" so the class must decide, and climb: two parts (one simplifying twice), then three parts, three parts that simplify (12 : 20 : 28, then 9 : 12 : 15 asking for "not green"), two parts over one (small and large over medium) and finally one part over two (football over netball or hockey, 10 : 6 : 8). No four-part ratios (Harry). Answers 7/12, 3/8, 3/10, 2/5, 1/4, 7/16, 2/7, 3/5, 7/15, 6/7, 2/3, 5/7, each recomputed by counting equal parts, wrong-method answers all different.
- **One page, 3 columns × 4 rows, large type** (Harry: answers are written in books): the wording is cut right down ("Write cats as a fraction of dogs.", "What fraction is not pears?") and the sheet prints at 21px, which fits one A4 page (22 fits, 23 spills to two). The answers sheet is one page.
- **Question numbers no longer collide with the text** in printed cells (all printed worksheets, tool pages too): the number sits top-left and the text now starts below it (`NUM_CLEAR_MM`, `src/shared/print.ts`). **The answer sheet of a pinned worksheet has the same boxes as the question sheet** with only the answer in each, set larger (`answerScale`, 1.9 for pinned sheets); the compact answer list is no longer used for them (`src/decks/worksheets.ts`, `pinnedWorksheets.test.ts` updated).
- **`npm run smoke:deck-print` was checking nothing** (it stubbed `window.open`, so the print window had no layout engine and drew a blank page that always counted as 1 page). It now writes the sheet into an iframe whose opener is the page, and counts real pages.
- The set is the sheet's `frozen` copy, written by hand; it applies only while the seed (103) and setup are unchanged, so New set / a seed change would hand the sheet back to the generator.
- Not done: no working is kept in the frozen copy (as for any pinned sheet), and the first-ladder questions use new contexts only; nothing else in the deck was touched.

Agent: Claude Code
Notes: planner Build Log block "2026-11-02 — Manual text size on decks, Estimation 3 × 4 book work and Fraction + Term subtraction, Manipulating ratios Worksheet 3 (Claude Code)".

## 2026-11-02 — Decks: text size can be set by hand on every element; Estimation moves to 3 × 4 book work and Fraction + Term

Branch `claude/relaxed-cerf-4tu512`. Areas: `src/decks/{SlideCanvas,QuestionPresentation,Editor,EditorPanels,types,builder,shownSize}.ts(x)`, `src/index.css`, `src/decks/data/estimation.json`, `docs/reference/decks.md`.

- **Manual text size everywhere a size is predetermined.** The toolbar and the panel now have a size control (smaller, number, bigger) and an **Auto** pill on text, equations, boards, ratio tables, bars, questions, generators, book activities and grids. The number is the size on screen, so pressing bigger or smaller starts from the fitted size; it then holds exactly (`fixed`) until Auto is pressed. Equations, boards and book activities now fit their box automatically too (they did not before); a book-work sum no longer wraps onto two lines. Table in `docs/reference/decks.md` ("Automatic text sizing, and the manual override").
- **Estimation deck.** The three book-work slides (whole numbers, fractions, decimals) are now title-free, 12 questions in 3 columns (3 × 4), using the full slide. The authored fractions set (`est-p-frac`) now has four Fraction Bar questions then four **Fraction + Term** ones (a fraction plus or times a whole number, or a whole number minus a fraction: 76/21 + 17, 47/24 × 32, 83/41 + 18, 28/56 × 38), written with the tool's own working (Original, Round to 1 s.f., Fraction, Calculate) through the new `Q.fractionTerm` builder. The fractions generator slide offers both kinds. Fraction + Term now includes subtraction, set as term − fraction (the fraction is always under 10, so fraction − term could never be positive): the generator gained it and 27 − 94/32 is in the set.
- **Answers have their own text size** on book activities and grids (follow-up, same day): they fit by themselves instead of being tied to the question size, and a **Questions | Answers** switch in the editor toolbar shows the answers so their size can be set (smaller / bigger / Auto). Generator and question-set answers are in the step-by-step working and were not changed.
- **Fraction + Term is taught on the existing fractions board** (slide `est-board-frac`, Estimate a fraction): two more rows, `92/28 + 18` (estimate 23) and `38 − 61/19` (estimate 37), with the rounded working and the calculator value, under the original fraction-bar row; the subtitle now says to work out the fraction, then use the whole number.
- Not done: the other decks were not touched.

Agent: Claude Code
Notes: same planner Build Log block as the entry above (one block for the whole session).

## 2026-11-01 — Manipulating ratios: Worksheets 1 and 2 become hand-written book work on slides

Branch `ccr-07dce7b9-safdue`. Areas: `src/decks/data/manipulating-ratios.json` (slides `mr-w1`, `mr-w2`), `src/tests/ratioDeckQuestions.test.ts`, `specs/decks/_check/ratio-bookwork-build.py`, `specs/decks/manipulating-ratios-bookwork.md`.

- **Worksheet 1 (of the total) and Worksheet 2 (of a part) are no longer pinned A4 sheets.** Each is now one title-free slide of nine fully authored questions in a 3 × 3 grid, answered in books (Harry's decision, 2026-11-01). Worksheet 3 (a mixture) stays a pinned worksheet.
- **Hand-written, no tool change** (Harry): including the walk, car, bicycle "tyres" question, so `THREE` in `ratioFractionOf.ts` is untouched. Each question carries authored working with the bar model (a simplify step first where the ratio simplifies).
- **Checked:** every answer recomputed by counting equal parts, wrong-method answers differ, all nine answers distinct in each set (`ratio-bookwork-build.py` builds the slides and checks them in one run); `deck check --layout` passes on all 47 slides.
- Not done: **the shared copy was not pulled or pushed**. The decks service returned 500 (FUNCTION_INVOCATION_FAILED) on every call, so the change is in the repo copy only and has to go to Harry via File → Import slides (slides `mr-w1` and `mr-w2`) or a push once the service is back. Worksheet 3 not reviewed. The repo copy of the 1 : n book work has `mr-ba2` titled "4 : 10" with the question "4 : 12" and working from 4 : 10: Harry's slide, left alone.

Agent: Claude Code
Notes: Build Log block not written (planner not reached this session); to be added next session.

## 2026-11-01 — Session wrap-up: what is merged, and what is open

Branch `ccr-56b2b977-offcl9`, merged to `main` as PR #116. Agent: Claude Code. The entries below (newest first) are the detail; this one is the hand-off.

**Merged:** the Depth slide redesign (stable layout, no Feathers speech, no teacher notes, edit a Depth card); the deck player (constant bottom bar, true full screen, fits the visible screen); question layouts (workspaces reveal only the answer, full-width flipped, developing picture); shared editing of one deck by Harry and Claude (merge by slide and element); the Pen, per-slide ink while a deck is open, editor zoom; timers; the Number grid, the printable 100 grid and the Starter layout; title-free book work; the Prime numbers and divisibility deck; the authoring routine for question sets.

**Open, and who decides:**
- **Manipulating ratios (Harry's deck):** *(Superseded by the later 2026-11-01 entry: Worksheets 1 and 2 are now hand-written book work.)* Worksheet 1 to be replaced by the nine questions in `specs/decks/manipulating-ratios-bookwork.md` (waiting on Harry's check of the table, and on adding the walk, car, bicycle context to the tool, `THREE` in `ratioFractionOf.ts`). Two small changes of Claude's are waiting for the merge service to be deployed: text size on the 1 : n book work slide, and no titles on the Worksheet 2 and 3 answer slides. Worksheets 2 and 3: to be looked at later.
- **Estimation and Fractional powers:** the title-free book work was applied in the repo only (not pushed to the shared copies); push after the merge service is live.
- **Timer:** it clears when you change slide; Harry may prefer it to keep running (one line to change).
- **The merge service is live only after the deploy of PR #116.** Until then `npm run deck push` refuses (checks `x-deck-merge`).
- **Planner:** the Build Log block and the Characters note are written; the Overview and Features pages and the Handoff block were not updated, and neither was the dashboard Review status for the tools touched (Harry has not reviewed them). Not tested on a real tablet or with a real stylus: pinch (tested with simulated touch), stylus plus finger, the tablet screen fit.
- **Left alone on purpose:** a Factors and Multiples generator (planned in `specs/decks/primes-and-divisibility.md`, not built); handwriting recognition; live tablet-to-laptop writing (Harry casts the tablet instead); sound on the timer. Fractional powers slide 11 has an old layout-check overlap warning.

Notes: Build Log block "2026-11-01 — Depth redesign, shared deck editing, Pen, timers, Number grid and the Primes deck (Claude Code)".

## 2026-11-01 — The player and editor fit the visible screen on a tablet

Branch `ccr-56b2b977-offcl9`. Areas: `src/shared/visibleHeight.ts` (new), `src/index.css` (`.h-app`), `DeckPage.tsx`, `Editor.tsx`, `docs/reference/decks.md`.

- **Cause:** both were sized with `h-screen` (`100vh`), which on a tablet browser is the page with the address bar hidden, so with the bar showing the bottom of the slide was pushed off the visible screen.
- **Fix:** they are as tall as `window.innerHeight` (the visible screen, updated on resize and rotation), and the slide scales to fit what is there.
- **Checked:** a browser test where 100vh is 820 px but only 700 is visible: the player's root, slide and Next button, and the editor's slide, all sit within 700. Not tried on a real tablet.

Agent: Claude Code
Notes: Build Log block "2026-11-01 — Depth redesign, shared deck editing, Pen, timers, Number grid and the Primes deck (Claude Code)".

## 2026-11-01 — Zoom in the editor: two-finger pinch and pan, Ctrl + scroll and buttons

Branch `ccr-56b2b977-offcl9`. Areas: `src/decks/Editor.tsx` (the canvas area, now a scrolling stage with zoom buttons and gesture handling), `docs/reference/decks.md`.

- **Why:** to make one box of a 2 × 2 starter large enough to write in with the Pen.
- **How:** the slide is redrawn at another size inside a scrolling area (30% to 600%; 100% fits the window), so lines stay sharp and the pen, dragging and handles keep exact coordinates. Two fingers pinch to zoom and pan; Ctrl + scroll (and a trackpad pinch) zooms at the pointer; + / − and a % button (fit) at the bottom right. A second finger cancels a stroke or drag the first had started. With a stylus in use, one finger pans.
- **Checked:** a browser test with real touch input (two-finger pinch out and pan), Ctrl + scroll, the buttons, and a pen stroke drawn while zoomed landing at the right slide position. The stylus-plus-finger case was reasoned through but not tested with a real stylus.

Agent: Claude Code
Notes: Build Log block "2026-11-01 — Depth redesign, shared deck editing, Pen, timers, Number grid and the Primes deck (Claude Code)".

## 2026-11-01 — Timers on every slide (1 to 10 minutes), set from the player or saved on a slide

Branch `ccr-56b2b977-offcl9`. Areas: `src/decks/timerMath.ts` and `Timer.tsx` (new), `DeckPage.tsx`, `Editor.tsx` (slide settings), `types.ts` (`Slide.timer`), `deckChecks.ts`, `api/_decks.ts`, `layouts.ts` (starter), docs, test `deckTimer.test.ts`.

- **Always callable:** a clock button in the player (and in the full-screen controls) offers 1 to 10 minutes; picking one starts it at once and a strip under the slide counts it down (the slide scales down to make room, so it never covers content) (amber, then red; pause, play and close at the right). `T` opens the menu, or pauses and resumes a timer that is showing.
- **Saved on a slide:** Slide settings → Timer in the editor (none, or 1 to 10 minutes, with "starts when the slide appears"). The strip appears with the slide. `S.starter(id, title, minutes)` makes a starter with one.
- **A timer belongs to its slide:** moving to another slide clears it (easy to change if Harry would rather it kept running).
- **Checked:** unit tests for the countdown (found and fixed a bug in resuming a timer that had run out), the deck API and deck check; a browser test of the menu, the line, T, pause, running out, clearing on slide change and a slide's own timer.
- Also: the Starter slide layout (2 × 2).
- Not done: no sound at the end (off by default, by design for now).

Agent: Claude Code
Notes: Build Log block "2026-11-01 — Depth redesign, shared deck editing, Pen, timers, Number grid and the Primes deck (Claude Code)".

## 2026-11-01 — The pen: writing stays with its slide in the player, and a Pen in the editor saves writing on slides

Branch `ccr-56b2b977-offcl9`. Areas: `src/shared/inkBridge.ts` (new), `src/shared/components/InkOverlay.tsx`, `src/decks/` (`DeckPage`, `Editor`, `InkLayer.tsx` and `inkMath.ts` new, `SlideCanvas`, `types`, `deckChecks`, `EditorChrome`), `docs/reference/decks.md`, test `inkWriting.test.ts`.

- **Player:** the pen's marks stay with their slide while the deck is open (go to another slide and back and they are there), in slide units so they follow a resize or full screen; they are gone when the deck is closed.
- **Editor:** a **Pen** button writes onto the slide with a mouse, finger or stylus (five colours, four thicknesses, Rub out for whole lines, Clear, undo, Esc or Done to stop). It is saved as an `ink` element (one full-slide layer per slide), shows in the player, the slide strip and exports, and merges with edits from elsewhere like any element.
- **Checked:** unit tests for the eraser, the stroke maths, the unit conversion and merging; browser tests of the pen in the player (slide change, resize, full screen) and in the editor (draw, change colour, rub out, undo, saved, shown in the player).
- **Starter slide (2 × 2):** four numbered boxes in the usual starter fashion, to write in with the Pen or type; in New slide and the slide library, `S.starter` in a build script.
- Not done: handwriting is not turned into typed text or maths.

Agent: Claude Code
Notes: Build Log block "2026-11-01 — Depth redesign, shared deck editing, Pen, timers, Number grid and the Primes deck (Claude Code)".

## 2026-11-01 — Harry and Claude can edit the same deck: saves are merged by slide and element

Branch `ccr-56b2b977-offcl9`. Areas: `api/_deckMerge.ts` (new, pure), `api/decks.ts`, `src/decks/cloud.ts`, `store.ts`, `Editor.tsx`, `scripts/deck.mjs`, `.gitignore`, docs (`docs/reference/decks.md` "Sharing one deck between Harry and Claude", `DECK_BUILD_CHECKLIST.md` 4a), tests `deckMerge`, `decksSave`, `deckSync`.

- **Why:** the shared copy of a deck is the master and a save replaced the whole deck, so a push of mine would have wiped Harry's edits (and vice versa), and a deck Harry had edited showed only his version.
- **What:** every save carries the version it started from (its base); the server merges the save into what is stored. Different changes from both sides are both kept; if both changed the very same field Harry's wins and it is reported; an edit beats a delete. The open editor folds in changes from elsewhere (immediately after its own save, and every 20 seconds), including into its undo history. `npm run deck pull` records the base, `push` merges and reports; it refuses to push to a deployment that does not merge yet.
- **Checked:** unit tests for the rules (including Harry's and Claude's real edits to Manipulating ratios), the server path with an in-memory blob store (either order, retry on a conflicting write), the client base and adoption, and a browser test of an open editor picking up a change made elsewhere.
- **Not live until deployed:** the shared service on the live site does not merge until this branch is merged and deployed; until then a push is refused, and changes for decks Harry edits go to him as a list or as slides he imports. Not tested against the real Blob store.
- Not done: no live cursors or two people typing in one text box (Harry's text wins); no merge for pinned worksheets' frozen sets beyond ordinary field rules.

Agent: Claude Code
Notes: Build Log block "2026-11-01 — Depth redesign, shared deck editing, Pen, timers, Number grid and the Primes deck (Claude Code)".

## 2026-11-01 — Book work and worksheet slides lose their titles; Worksheet 1 to be replaced by nine questions in books

Branch `ccr-56b2b977-offcl9`. Areas: `src/decks/layouts.ts` (`bookWorkSlide`), `builder.ts` (`S.bookWork`), deck data for Estimation, Fractional powers, Manipulating ratios and Primes and divisibility, `docs/design/LESSON_STYLE.md`, `specs/decks/manipulating-ratios-bookwork.md` and its check script.

- **No titles on book work and worksheet slides** (Harry): the questions or the worksheet's answers fill the slide; only an instruction stays, in one line at the top. Applied to 12 existing slides (Estimation 3, Fractional powers 3, Manipulating ratios: the two book work slides and Worksheets 2 and 3; and the primes book work). The deck checks pass; the slides stay merge-safe (a rebuild keeps them).
- **Worksheet 1: of the total** is judged arbitrary (same rung as the fixed set and generator before it, finished too quickly). Plan: nine authored questions answered in books, climbing to three-part ratios and ending on a walk, car, bicycle "tyres" question. The questions are written and recomputed in `specs/decks/manipulating-ratios-bookwork.md`; the deck slide is **not changed yet** (waiting on Harry's check of the table and a decision on adding the context to the tool).
- Not done: the changed decks are not pushed to the shared copy. **Decided afterwards (Harry):** Claude does not push to a deck Harry edits (see `docs/design/DECK_BUILD_CHECKLIST.md` 4a). The repo copy of Manipulating ratios is therefore Harry's latest, with none of the title-free or text-size changes above; those changes remain on the other decks in the repo only.

Agent: Claude Code
Notes: Build Log block "2026-11-01 — Depth redesign, shared deck editing, Pen, timers, Number grid and the Primes deck (Claude Code)".

## 2026-11-01 — Prime numbers and divisibility deck (36 slides), the first deck built with no tool behind it

Branch `ccr-56b2b977-offcl9`. Deck: `src/decks/data/primes-divisibility.json`, built from `specs/decks/primes-and-divisibility.md` (plan) and `specs/decks/primes-and-divisibility-questions.md` (every set, with rung, answer, trap and wrong-method result). Build script kept in the session scratchpad, as for every deck.

- **Shape:** Primes and the sieve (definitions, the "only one factor" discussion, the Number grid sieve, why stop at 7, print-it-yourself, two Depth cards) · Divisibility rules (2, 5, 10; 3 with why it works; choosing the rule and 6; book work; two Depth cards) · Showing a number is not prime (Set A) · Stretch: the rule for 11 · Extra: the rule for 7 · exit ticket and summary. No starter (Harry's own) and no generators.
- **Decided with Harry:** no "is it prime?" questions anywhere (the class reads the answer off the grid); every prime question asks for a reason from a rule or an explanation. Practice on primes themselves is light; the practice sits after the divisibility rules.
- **Checked:** every answer recomputed by a different route (`specs/decks/_check/primes-sets-check.py`, all pass); `npm run deck -- verify primes-divisibility` passes (content, layout, Depth cards). The deck check caught a Depth card repeating numbers used elsewhere (121), so that card is 961.
- Also changed: the Number grid slide layout is now the title and prompt on the left and a large square grid on the right.
- Not done: the deck has not been taught; not pushed to the shared copy or published unless stated in the session; no generator (a Factors and Multiples tool is planned in the spec, not built).

Agent: Claude Code
Notes: Build Log block "2026-11-01 — Depth redesign, shared deck editing, Pen, timers, Number grid and the Primes deck (Claude Code)".

## 2026-11-01 — Number grid slide piece and the printable 100 grid (first build for the Primes and divisibility deck)

Branch `ccr-56b2b977-offcl9`. Areas: `src/shared/numberGrid.ts` (new), `src/shared/printables.ts` (`hundredSquareSheet`), `src/decks/` (`NumberGrid.tsx` new, SlideCanvas, DeckPage, Editor, EditorPanels, EditorChrome, layouts, builder, deckChecks, types), docs, `src/tests/numberGrid.test.ts` (new). Plan: `specs/decks/primes-and-divisibility.md`.

- **Number grid:** 1 to 100, tap to scribble in a prime's colour (one colour per prime, prime circled), **Finish the n times table** completes the rest and keeps tapped marks; Filled in is the finished sieve, staged one click per step; Blank is empty. Scribbles are seeded by the number so they are identical on every redraw. **Print grids** in the player's top bar prints two plain grids per A4.
- Tests: the sieve leaves exactly the 25 primes; tap-then-fill never loses a mark; scribbles are deterministic; the printable has 1 to 100 once each with no marks.
- Not built, by decision: a Factors and Multiples generator (planned in the spec; Harry may later want a "is X divisible by 2?" generator or a "circle the factors X is divisible by" set).

Agent: Claude Code
Notes: Build Log block "2026-11-01 — Depth redesign, shared deck editing, Pen, timers, Number grid and the Primes deck (Claude Code)".

## 2026-11-01 — Question layouts: workspaces reveal only the answer; full-width gets a flip and a developing picture

Branch `ccr-56b2b977-offcl9`. Areas: `src/shared/components/SolutionStepper.tsx` and `.css`, `src/decks/` (SlideCanvas generator, QuestionPresentation, QuestionFrame, QuestionLayoutPicker, EditorPanels), `api/_questionDisplay.ts`, `docs/reference/decks.md`.

- **Workspace right / left:** only the answer is revealed, set large and centred under the question with no heading or marker; the steps and their controls are gone (button: Show answer / Hide answer).
- **Full-width:** unchanged without a picture (steps left, question right). With a ratio table or bar model in the working, the question sits in the top third on the left, the steps under it, and the developing picture builds on the right (the latest picture step shown so far).
- **New layout `full-inverted` (Full-width, flipped):** the mirror of the above. Saved decks stay valid (a new value only); the picker now offers four layouts.
- Not done: no phone-size arrangement for the picture panel (under 420px wide it is hidden and the steps show captions only); the question-layouts smoke script still names the three older layouts.

- **Depth cards can be opened and tweaked:** in the deck editor, Edit card (double-click or toolbar) makes the deck's own copy to change wording, options and answer; from a tool's Depth section, Edit in a deck (Developing-tools mode) adds an editable copy to a deck. The copy is marked `source.edited` so the deck loader no longer turns it back into a bank reference (it used to). The bank is never changed; no "new Depth card" builder, by decision.
- **Authored questions have no levels:** the "Level n" label is gone from written-question slides and the editor's Level control is removed (generator slides keep theirs). The saved `level` value stays as an unused default because the saved format requires it; difficulty is the ladder in the plan.
- **Authoring routine written** (`docs/design/DECK_BUILD_CHECKLIST.md`, "Authoring a question set"): no new tooling, by decision. Authored sets are held to the generators' bar by a routine: agree the ladder, traps, scale and conventions first, write, recompute every answer by another route, show Harry a table, close out.

Agent: Claude Code
Notes: Build Log block "2026-11-01 — Depth redesign, shared deck editing, Pen, timers, Number grid and the Primes deck (Claude Code)".

## 2026-11-01 — Depth slides calmed down; deck player bar and real full screen

Branch `ccr-56b2b977-offcl9`. Areas: `src/shared/components/DepthSlide.tsx`, `DepthMode.tsx`, `src/shared/TeachingDeck.tsx`, `src/decks/DeckPage.tsx`, `SlideCanvas.tsx`, `QuestionPresentation.tsx`, `src/tools/Proportion/RatioManipulationDepth.ts`, docs (`CLAUDE.md` R34, `docs/reference/depth-teach-lessons.md`, `docs/FEATURES.md`).

- **The question never moves.** A Depth slide draws its speakers, working, prompt and options the same on both beats; the answer ticks the right option in place and fades into a gap reserved below. Audited on the five Manipulating ratios Depth cards: the slide's position and size are identical on both beats.
- **Smaller, quieter type.** Deck base 58px to 40px (tool page 2.9cqw to 2cqw); question about 1.05em, options 0.95em, answer 0.8em. The "Shows: misconception" captions are no longer drawn (the answer lines already name each mistake; the data is kept for tags).
- **Feathers is a mascot only**, at the left of the answer gap: no speech bubble, no Feathers button, no `f` key. **Teacher notes are gone** from the slide and the tool page; the Ratio bank's `teacherNote`, `prompt` and `takeaway` were deleted.
- **Deck player.** The bottom bar is the same on every slide (Back, progress and count, Next); Print sheet, Answer sheet and the Filled in / Structure / Blank control moved to the top bar; the "click x of y" text and the Show answer button on a deck Depth slide were dropped (Next, Back, Space and `a` reveal). **Full screen** now hides all chrome and scales the slide to fill the screen (browser fullscreen where allowed); a control pill shows on mouse move and fades; Esc leaves.
- **Follow-up, same day:** the retired `teacherNote` / `prompt` / `takeaway` fields were deleted from every Depth bank, `feathersLine` and the `DepthFeathers` component were removed, and the deck question editor's "Feathers' speech bubbles" section is gone. A deck Depth question keeps a `depth` marker with empty prompt and takeaway (so saved decks and the API check still validate). Audited all 308 Depth items in the six banks (no overflow, no page errors) and looked at a random five across tools.
- **Type and place, second pass:** the purpose and level label is pinned top-left outside the fitted area and the content is anchored to the top (`FitBox anchor="top"`), so nothing drifts to the middle; speakers alternate sides (first left, second right) with bubbles as wide as their text; one type scale for every item (question 1.15em, speakers and options 1em, answer 0.9em, working 0.85em) on a 48px deck base. Audit: 297 of 308 items need no shrink below 0.85, the worst is 0.77.
- **Deliberately not done:** the other decks' Depth slides have been audited but only a sample looked at by eye.

Agent: Claude Code
Notes: Build Log block "2026-11-01 — Depth redesign, shared deck editing, Pen, timers, Number grid and the Primes deck (Claude Code)".

## 2026-10-31 — Deck engine: automatic sizing, one Depth design, safe rebuilds, the deck process

Branch `claude/great-hamilton-9xk13c`. Areas: `src/decks/` (SlideCanvas, QuestionPresentation, Editor, store, deckChecks, builder, new `merge.ts` `normalise.ts` `preflight.ts` `relayout.ts` `slideButton.ts` `VersionsDialog.tsx`), `src/shared/components/` (new `DepthSlide.tsx` `FitBox.tsx`; `DepthMode` rebuilt on `DepthSlide`), `scripts/` (`deck.mjs` commands, `deckPrintSmoke.mjs`, `depthSlideAudit.mjs`), Ratio Manipulation (generator fixes, Depth bank, builders), docs.

- **Text fits itself.** Text boxes and grids shrink to their box; boxes of one role on a slide share one size; a hand-set size stays fixed (Auto size button). One `slideButton` look for every slide button.
- **One Depth design.** `DepthSlide` is drawn by the deck's Depth card and by the tool page's Depth section. A deck Depth card is a reference to the bank (older copies are turned into references when read). Presenting, Next shows the answer. Audited all 308 Depth items in both beats (`npm run smoke:depth-slides`).
- **Decks.** Back goes to the Decks menu; grids answer in place with double-tap; a Worksheets button in the player and editor top bars; the text boxes, books and buttons were tuned against feedback (see the checklist).
- **Rebuilds are safe.** Slides carry a `built` hash, so `build --replace` keeps what was edited in the editor. New commands: `preflight`, `verify`, `diff`, `builders`, `sheet`, `new`. The editor has Version history, a Layout menu (change layout, keep content) and slide templates.
- **The process is written down:** `docs/design/DECK_BUILD_CHECKLIST.md` (what went wrong and the guard for each, the lesson skeleton), linked from CLAUDE.md. New content checks: a discussion must ask a question; no repeated question on the next slide.
- **Ratio Manipulation.** Level 3 of Ratio to Fraction was almost all "of the total" (the kind was chosen afresh on each attempt); it is now chosen once per run and tested. Money names read £1 / 50p / £10 / £5. Simplifying's "Ask for" can mix forms.
- **Deliberately not done:** Level 2 and 3 Fraction to Ratio builders for decks; more slide pieces (place value, number line, area model, counters); Depth banks for tools without one; phone and tablet checks; the deck has not been taught.
- Agent: Claude Code
- Notes: planner Build Log block "Deck engine and the deck process (Claude Code)".

## 2026-10-31 — Ratio Manipulation Depth bank; Fraction to Ratio and Forming Ratios shared with the deck builder

- **Depth bank for Ratio Manipulation** (`RatioManipulationDepth.ts`, 21 items, 10 new misconception tags). Nine general items (diagnose, explain, extend at each level, one Start here per level) plus items for the forming/simplifying/equivalent tabs and for the two fraction tabs. Spec: `specs/depth/ratio-manipulation.md`.
- **Five Depth cards** in the Manipulating ratios deck (now 47 slides), one at the end of each section.
- **Question builders shared with the deck builder**: `src/tools/Proportion/ratioFromFraction.ts` holds `fractionOfTotalToRatio`, `fractionOfPartToRatio` and `formTwoPartRatio`; the tool's generator picks the numbers and calls them, and `Q.ratioFromFraction` / `Q.ratioForm` call them with fixed numbers, so the deck's "Writing a ratio" and "Write the ratio" sets now carry the tool's own wording and working.
- Agent: Claude Code
- Notes: planner Build Log not updated this session.

### 2026-10-31 — The Manipulating ratios deck, and tables and bars in fixed questions

- **New deck `manipulating-ratios`** (42 slides, `src/decks/data/manipulating-ratios.json`, plan in `specs/decks/manipulating-ratios.md`): a recap of what a ratio is (the cake, 1 egg to 300 g of flour), simplifying with a ratio table built by click, 1 : n and n : 1, a fraction of the total (Level 1), of a part (Level 2) and a mixture (Level 3) with bar models, and a ratio from a fraction. Each stage has a fixed set, a generator slide, and (for the three fraction stages) a **pinned A5 worksheet** of 8 questions with an answer sheet.
- **Fixed questions can show a ratio table or a bar model in their working.** `Q.ratioSimplify` and `Q.ratioFraction` build a question from the Ratio Manipulation generator's own code with fixed numbers (so wording and working match the tool, and the answer is checked from the parts); `fromWorked` converts any generated question to a fixed one; a picture step is kept as an `@ratiotable` or `@bar` line and drawn by `WorkedPicture`. The generators gained `wholeQuestion` and `fractionQuestion`.
- **Simplifying: 1 : n and n : 1 spread their answers** (they used to give 1 : 1.5 or 1.5 : 1 about two times in five at Level 1): these two asks draw from a wider range of parts.
- A Worksheet slide now says "Hand out the worksheet. Press A for the answers."
- Not done: a Depth bank for the tool; the phase 2 tool extras; the deck has not been taught.
- Agent: Claude Code
- Notes: Build Log block to be added (planner not updated this session).

### 2026-10-31 — Printable worksheets pinned to a lesson

- **A lesson (deck) can pin up to three printable worksheets.** Tick *Pin to the lesson* on a book activity, or Add slide → **Worksheet**; File → **Worksheets…** lists them with **Print**, **Answer sheet** and **Both**. Each prints on an **A5 page** (print two to an A4 sheet with "Pages per sheet: 2") through the same layout engine as the tool pages' Worksheet (grid or list, columns, borders, text size). The answer sheet is a compact numbered list in larger type. A kept copy of the questions (`frozen`) means a printed sheet and its answers do not change if a generator does. The Worksheet slide shows the answers on a click (`a`), the cue to hand the sheet out.
- `handlePrint` gained `opts { paper, fontPx, compactAnswers }`; A4 behaviour is unchanged. Code: `src/decks/worksheets.ts`, `WorksheetsDialog.tsx`. Tests: `pinnedWorksheets.test.ts`.
- Not done: the three sheets for the ratio lesson are not made yet (it needs the deck), and nothing prints two copies per A4 sheet by itself.
- Agent: Claude Code
- Notes: Build Log block to be added (planner not updated this session).

### 2026-10-31 — Ratio to Fraction re-levelled, with options and a bar scaffold

- **Ratio to Fraction now has the level as the kind of fraction:** Level 1 of the total, Level 2 of a part, Level 3 a mixture where the pupil decides from the wording (brief `specs/ratio-manipulation-fraction-of.md`). Level 1 and Level 2 default to what Levels 1 and 3 made before; **today's Level 2 (three-part totals, one part or two together) is Level 1 with Three Parts on.** Anyone with a saved link or worksheet at Level 2 or 3 now gets a different kind of question.
- **New Question Options:** Parts (Two / Three), Numerator (One Part / Two Parts Together, replacing the Target dropdown), Fraction Of (One Other Part / The Rest at Level 2; The Total / One Other Part / The Rest at Level 3), **Part Asked About** (first, second or third, so it is not always the first in the ratio), **Part Named** ("red" or "not red"), Answer Size (less or more than 1), Simplest Form, and a Numerical method switch (the bar is the scaffold at Levels 1 and 2, off at Level 3 by default).
- **The ratio is on a line of its own** (`red : blue = 3 : 5`) with the question beneath. Wording follows rules checked by tests: a total question never names another part as the reference, a part question never says total or "of the beads", "the rest" always names its parts. Equal parts and whole-number answers are no longer generated.
- **Fraction to Ratio Level 1: Fraction Given As** (The Total or The Other Part: "red is $\frac23$ of blue" gives $2 : 3$).
- **Decks:** generator slides now draw ratio-table and fraction-bar working (previously blank) and set long worded questions smaller; book activities wrap a two-line ratio question. The shared bar model gained row roles (numerator, denominator, faded) and a brace across chosen rows.
- Tests: `ratioFractionOf.test.ts` (levels, every option, language, answers). Not done: Level 3 extras (Convert Between Fractions, Include An Amount), Fraction Given As at Levels 2 and 3, a ratio table inside fixed questions, the Depth bank, the deck itself.
- Agent: Claude Code
- Notes: Build Log block to be added (planner not updated this session).

### 2026-10-30 — Ratio table and bar model as slide pieces

- **Two new pieces on a slide** (Insert menu, Add slide, Slide library): a **ratio table** (the site's `RatioTable`: quantities as columns, a row per step, the factor between rows as an arrow) and a **bar model** (equal boxes in coloured parts, braces above or below, such as "red: 3", "total: 5"). Both use the board's Filled in / Structure only / Blank control (B), and can be built up one click at a time (a row per click, or a part then a brace per click, with the layout fixed so nothing moves). Editor panels edit headings, cells, factors, parts and braces; deck checks render the maths and name a bar or table that cannot be drawn.
- **The bar model has two looks.** The **ratio look** copies Ratio Sharing's stacked layout (a row per quantity aligned from the left, white boxes with a navy border, a value in each box, "= total" at the end, purple extra boxes for a difference, a brace across the rows) and is the default; the single coloured bar (parts and braces) stays for fractions. A ratio table is laid out at its full size from the first click (rows not yet shown are hidden in place) and fitted to its box once, so four- and five-step tables do not rescale as steps arrive.
- The bar model is a new shared core picture, `src/shared/barModel.ts` and `components/BarModel.tsx` (data, stages, stacked braces), ready for the ratio tools' working. Tests: `barModel.test.ts`, `deckRepresentations.test.ts`.
- Plan for the Manipulating ratios lesson updated (`specs/decks/manipulating-ratios.md`). Not done: ratio-table working in generator slides, ratio tables inside fixed questions, the Ratio Manipulation tool changes.
- Agent: Claude Code
- Notes: Build Log block to be added (planner not updated this session).

### 2026-10-29 — Fractional powers deck, and bigger book activities

- **New deck `fractional-powers`** (39 slides, `src/decks/data/fractional-powers.json`, plan in `specs/decks/fractional-powers.md`), on the Indices tool: recap of the laws (positive, negative, zero) → $a^{\frac12}$ and $a^{\frac13}$ found from the laws → $a^{\frac23}$ by power of a power → numbers → letters (index form to root form, root form to index form) → the laws with fractional indices → negative fractional powers at the end. Three new graphics are built from ordinary slide elements (tiles, arrows, maths) with click-by-click reveals. Fixed sets are checked against the Indices tool's working; Depth cards are existing ones whose numbers the deck does not use.
- **Review changes:** the mirrored second letters board was removed (one board, then two different sets); the "square root" discussion now ends on a new question ($49^{\frac12}$) instead of restating its key point.
- **Book activities are much bigger** (`SlideCanvas.tsx`): default size 48 → 60; a worded question's maths line is set at full size, and an instruction shared by every question ("Work out:") is shown once above the set instead of in each cell. Affects every deck's book activity.
- `scripts/deckLayoutSmoke.mjs` now turns Developing-tools mode on (the working copy did not render without it, so the check stalled).
- Not done: the deck has not been pushed to the shared copy (it did not exist there: `pull` returned 404) or published; layout check reports only the intended text-on-tile overlaps of the graphics.
- **Writing Indices: new "Ask for" option** (Powers / Roots), so a root question can be set one way only (give the root and ask for the power, or give the power and ask for the root); both on is the old random mix. Greyed out unless a root question type is on. The deck's letters section now has a generator slide for each direction straight after its question set, then the mixed one.
- **Boards in decks are Structure only, never Blank** (the rule is in `docs/design/LESSON_STYLE.md`; the board layout now defaults to it, and the Fractional powers deck's boards are all set).
- One small mixed-direction book activity (8 questions, 2 columns, Level 2 Writing Indices, both Ask for options on) closes the letters section; book activity instructions now stay on one line.
- **Book activities are now 12 questions in 3 columns, 4 rows, as the standard** (new-slide defaults, `docs/design/LESSON_STYLE.md`, and this deck's three book slides; Estimation's older 8-in-2 slides were left as they are). When each question has its own instruction (mixed directions) the answer shows under the question; sets no longer contain the same question twice (`generateSet` also compares content, not only keys).
- **Book activities on slides now work like the worksheet:** a small regenerate button on each cell (hidden until the activity is pressed, fading again after a few seconds) rerolls just that question (never a repeat of one already shown), a double-tap on a cell flips it between question and answer, and Show answers puts each answer in place of its question (so long answers no longer need room beside it). `questionContent` in `src/decks/generators.ts` is the shared "same question" test.
- **Writing Indices: a root answer shows one form** (e.g. $(\sqrt[3]{x})^2$), not both equivalent forms joined by an equals sign; the working still shows that the two forms are equal. The deck's fixed "write using a root" answers match.
- Harry's edits to the shared deck were pulled first and kept (he removed the $a^0$ discussion slide and set two boards to Structure only).
- Agent: Claude Code
- Notes: Build Log block to be added (planner not updated this session).


### 2026-10-29 — Dashboard, burger menu and Decks tab tidy-up
- **What:** dashboard Tasks are two-column cards (like Features); Pathways and the Feature tracker are two columns, not three; "How a tool is built" sits in a centred column with the text left-aligned. Published-deck cards show the first slide with an (i) beside it that opens the title, summary, slide count and date. The burger menu's "Two-sided layouts" is a collapsible row (closed by default) and "Show tool tips again" is a row like "Developing tools", with a "Will show again" note once pressed.
- **Not done:** nothing is published yet, so the Decks tab was checked only with simulated decks.
- Files: `src/admin/{PlanPages,DevelopmentsPage,ui}.tsx`, `src/components/{LandingPage,DecksTab}.tsx`, `scripts/publishedDecksSmoke.mjs`.
- Agent: Claude Code
- Notes: planner Build Log, "2026-10-29 — Decks as data, Year 9 Estimation deck, deck builder and published decks (Claude Code)".

### 2026-10-29 — Published decks and a Decks tab
- **What:** a deck can be published: **Publish this deck** in the editor's File menu (or `npm run deck -- publish <id>`) stores a frozen, read-only copy that anyone can play. A new **Decks** tab on the landing page lists the published decks as cards with a preview of the first slide (as in the deck list), and has a **Deck editor** button. The editor (`?edit=1`), the deck list (`/decks`) and the slide library now ask for the admin password (the Developing-tools password and switch); without it `/decks/<id>` shows only the published copy, with no Edit button. The old "Decks →" link in the burger menu is gone. API: published decks have their own blobs and two open read endpoints; publishing and unpublishing need the admin key.
- **Not done:** nothing is published yet (the endpoints exist only once this is merged and deployed); the preview is the first slide only (left out if it holds a large picture); the password is a light check, not security (it is in the site's code, as for Developing tools).
- Files: `api/{decks,_decks}.ts`, `src/decks/{published.ts,AdminGate.tsx,DeckPage.tsx,Editor.tsx}`, `src/components/{DecksTab.tsx,LandingPage.tsx}`, `scripts/{deck.mjs,publishedDecksSmoke.mjs}`, tests, docs.
- Agent: Claude Code
- Notes: planner Build Log, "2026-10-29 — Decks as data, Year 9 Estimation deck, deck builder and published decks (Claude Code)".

### 2026-10-29 — Deck builder and deck checks
- **What:** `src/decks/builder.ts` (slide kinds `S` and question builders `Q` that write the tool's working and check it against an independent calculation) and `src/decks/deckChecks.ts` (maths renders, answers where the working ends, practice sets of at least 5, Depth cards ask new numbers, generators exist, run at their level and do not pile on one answer, text fits its box). `npm run deck -- build <script>` builds a deck from a short script and writes its JSON; `npm run deck -- check <id|all> [--layout]` runs the checks and, with `--layout`, starts the app and measures every slide. Tests: `deckBuilder.test.ts`, which also checks every built deck.
- **Not done:** only the Estimation and Rounding question builders exist; each new tool needs its own `Q` builder when a deck uses it.
- Files: `src/decks/{builder,deckChecks}.ts`, `src/decks/layouts.ts` (exports), `scripts/deck.mjs`, `scripts/deckLayoutSmoke.mjs`, `src/tests/deckBuilder.test.ts`, docs.
- Agent: Claude Code
- Notes: planner Build Log, "2026-10-29 — Decks as data, Year 9 Estimation deck, deck builder and published decks (Claude Code)".

### 2026-10-29 — Estimation deck: fractions book activity; slide collisions fixed
- **What:** a fractions book activity (8 Level 3 questions, two columns) in the fractions section. A browser audit of all slides found three collisions on board slides: a wrapped title running into its prompt (Round decimals), a fraction in a large title (Estimate a fraction) and a wrapped prompt running into the board (decimal division). Board titles and prompts now use the full slide width in the layout and in the deck, and the fraction title reads "Estimate a fraction". New `npm run smoke:deck-layout -- <deck id>` repeats the audit for any deck. The Print button is removed from book activity slides (answers on demand and New set remain).
- **Not done:** the other smoke scripts still need their slide numbers refreshed for the new deck.
- Files: `src/decks/layouts.ts`, `src/decks/data/estimation.json`, `scripts/deckLayoutSmoke.mjs`, docs.
- Agent: Claude Code
- Notes: planner Build Log, "2026-10-29 — Decks as data, Year 9 Estimation deck, deck builder and published decks (Claude Code)".

### 2026-10-29 — Decks: quieter question controls and practice labels
- **What:** the "Solution options" and "More" menus and the teacher-guidance button are gone from deck question slides. **Show all / Step-by-Step** now sits between the previous and next step arrows (the step count moved beside "Worked solution"); the progress dots went with the menu. Generated questions that are short are centred like authored ones. Authored questions are labelled **Deliberate practice · Level n** (was "General practice" / "Targeted practice") and generator slides now carry **General practice · Level n** in the same style. Keys stay: `a` answer, `w` next step, and `f` hides or shows Feathers on a Depth card (it used to live under More).
- **Not done:** the Playwright smoke scripts were edited to drop the removed controls but not run; several still point at slide numbers from the first Estimation deck and need refreshing. Teacher guidance still exists in the editor's Teaching details.
- Files: `src/shared/components/SolutionStepper.{tsx,css}`, `src/decks/{QuestionPresentation,SlideCanvas}.tsx`, `src/decks/SlideMore.tsx` (deleted), `scripts/*Smoke.mjs`, docs.
- Agent: Claude Code
- Notes: planner Build Log, "2026-10-29 — Decks as data, Year 9 Estimation deck, deck builder and published decks (Claude Code)".

### 2026-10-29 — Estimation: division answers spread across the times tables; one rounding set in the deck
- **What:** Estimation division (Level 1 and Level 2) now picks the answer first, then a pair of numbers that gives it, so answers spread across the 2 to 12 tables (about 65% of questions) and the rest (14, 15, 20, 30…). Before, Level 1 division gave only 9 different answers and 10 and 5 were 71% of them. The rule is unchanged: both numbers are rounded to 1 s.f. (so a question like 360 ÷ 40 cannot arise, since 360 is not a 1 s.f. number). In the deck, the three authored rounding sets became one set of seven (48, 84, 794, 6,820, then the edges 95, 450, 305), and Harry's longer whole-number book activity (12 questions, 3 columns) is kept.
- **Not done:** Level 3 fractions and the other operations are unchanged (their answers are already varied); no compatible-numbers option for division.
- Files: `src/tools/Number/Estimation.tsx`, `src/decks/data/estimation.json`, `specs/decks/estimation-y9.md`.
- Agent: Claude Code
- Notes: planner Build Log, "2026-10-29 — Decks as data, Year 9 Estimation deck, deck builder and published decks (Claude Code)".

### 2026-10-29 — Estimation deck rebuilt for Year 9; seven new Estimation Depth cards
- **What:** the Estimation deck is rebuilt from `specs/decks/estimation-y9.md`: one deck of 45 slides in four sections (rounding to 1 s.f., whole numbers, fractions, decimals), each with a worked board (with the calculator answer beside the estimate), a five-question authored set and a generator slide; the definition of *estimate* to write down; book activities; exit tickets. Rounding practice builds from two-digit numbers to a short edge-case set (95, 996, 450, 305, 349). Seven new Depth cards for Estimation: Rounding 649, The calculator slip, Nearly equal numbers, Does the size make sense?, Over or under?, Make an estimate of 0.3, Stopping part-way; three new misconception tags. The Rounding tool now runs in deck generator slides (nearest, decimal places, significant figures); its digit-box picture moved to `src/shared/components/RoundDigits.tsx`, and deck generator slides draw prose working steps wrapped.
- **Not done:** the legacy bank code is still in place; teacher notes and an outline view are not built; no class has used the deck yet.
- Files: `src/decks/data/estimation.json`, `src/tools/Number/EstimationDepth.ts`, `src/shared/{misconceptions.ts,components/RoundDigits.tsx}`, `src/decks/{SlideCanvas,generators}.ts(x)`, `src/tools/Number/Rounding.tsx`, tests that named old slides, docs.
- Agent: Claude Code
- Notes: planner Build Log, "2026-10-29 — Decks as data, Year 9 Estimation deck, deck builder and published decks (Claude Code)".

### 2026-10-29 — Decks are data; lesson-plan template and slide features list
- **What:** a deck is now a JSON file in `src/decks/data/` (listed automatically; Estimation moved there, with Harry's saved edits merged in: his extra Whiteboard slide and the reworded discussion slide). The shared copy is the master: `npm run deck -- pull|push|list` (`scripts/deck.mjs`). Added `docs/design/templates/LESSON_PLAN_TEMPLATE.md` (short, everything optional) and `docs/design/SLIDE_FEATURES.md` (what can go on a slide); `specs/decks/README.md` rewritten. The test that demanded a brief on every question slide now treats briefs as optional.
- **Not done:** legacy bank code still in place; teacher notes and an outline view not built. (The merged Estimation JSON was later replaced by the Year 9 rebuild below and pushed to the shared copy.)
- Files: `src/decks/{index,estimation,layouts}.ts`, `src/decks/data/estimation.json`, `scripts/deck.mjs`, `src/tests/decks.test.ts`, docs above.
- Agent: Claude Code
- Notes: planner Build Log, "2026-10-29 — Decks as data, Year 9 Estimation deck, deck builder and published decks (Claude Code)".

### 2026-10-29 — Decks: one optional slide brief; a cleaner question editor
- **What:** the four teaching-note boxes per slide (purpose, question focus, look for, next move) and the question brief form (count, avoid, progression, examples, solution reference) are replaced by one optional **slide brief**: a sentence or two on what the slide's questions test, or the key skill. Edit it under This slide in the properties panel, at the top of the question editor (with **Copy for chat**), or in **Lesson thread**, which is now one list of every slide with its brief box and **Copy briefs for chat**. The slide strip no longer shows "Purpose not yet written" on every slide.
- Estimation keeps briefs on its 15 question, generator and Depth slides only (purpose and question focus merged into one note); the other slides have none. Older saved decks still load: their notes fold into the one brief when the editor opens them (`withBriefs`), and the save API still accepts the old fields.
- **Question editor** rebuilt: questions listed down the left (amber number = unfinished, **Add question** underneath), the selected question's fields in the middle with icon buttons (duplicate, move, remove) and a small **Σ Insert maths** link per field, and the live preview on the right with a compact layout switch. Everything is on screen at once on a laptop; columns stack on smaller screens.
- **No more blue tint:** slides, writing spaces and question previews are plain white, and the page around them (player, editor, deck list) uses the site's usual light grey (`src/decks/theme.ts`).
- Rule **R43** rewritten (`CLAUDE.md`): a brief is optional; Claude writes one per question slide when planning, not for every slide.
- Code: `src/decks/questionBrief.ts` (new helpers), `LessonMap.tsx`, `QuestionWorkspace.tsx`, `QuestionAuthor.tsx`, `QuestionLayoutPicker.tsx` (compact), `Editor.tsx`, `EditorChrome.tsx`, `GeneratorDialog.tsx`, `estimation.ts`, `types.ts`, `api/_decks.ts`; `QuestionBrief.tsx` removed. Tests and the questions, layouts and lesson-thread smoke scripts updated. Docs: `docs/reference/decks.md`, `GLOSSARY.md`, `FEATURES.md`, `design/LESSONS.md`, `specs/decks/README.md`, `pathways/decks.md`.
- **Not done:** branch not merged; no PR opened.
- Agent: Claude Code.
- Notes: Build Log block "Decks: one slide brief, cleaner question editor (Claude Code)".

### 2026-10-28 — Deck editor: menu bar, toolbar and cleaner menus
- **What:** the deck editor's single row of unlabelled icons is replaced by two rows. The header has a back arrow to the deck list, the deck's name with the save status, a menu bar (**File**, **Edit**, **Insert**, **Slide**, **View**, each item with its key where it has one), the panel toggles, **Lesson thread** and **Present**. The toolbar has undo / redo, **New slide** (layouts grouped by kind), Text, Equation, Image, **Shapes** and **Questions** (was "Lesson pieces"), then controls that follow the selection: slide navigation when nothing is selected; size, bold, alignment and colour for text; edit, size and colour for an equation; fill and outline for a shape; colour and arrowhead for a line; Edit questions / Configure for question sets and generators; **Arrange**, duplicate and delete for anything.
- The slide buttons (earlier, later, duplicate, copy, delete) moved from the properties panel to the Slide menu (the strip still has hover duplicate / delete). Keyboard shortcuts open in a window (View menu or `?`). On a phone both panels start shut and only one opens at a time, so the slide gets the screen.
- Checked at 1920, 1366, 1180, 1024 and 390 wide; the toolbar fits on one line down to 1024. Build, tests, lint and the questions, layouts, Depth artwork, lesson thread and whiteboard smoke tests pass.
- Code: `src/decks/Editor.tsx`, `src/decks/EditorChrome.tsx` (`MenuItem` shortcut / tick rows, `MenuDivider`, `BarDivider`, `ShortcutsDialog`, bare menu-bar buttons), `src/index.css` (`no-scrollbar`). Docs: `docs/reference/decks.md`, `docs/FEATURES.md`, `docs/pathways/decks.md`.
- **Not done:** branch not merged; no PR opened.
- Agent: Claude Code.
- Notes: Build Log block "Deck editor: menu bar and toolbar (Claude Code)".

### 2026-10-28 — Planning docs replaced by tasks and pathways; agent hand-off; Overview note
- **What:** `docs/PROJECTS.md`, `docs/TIDY_UP.md` and `docs/FUTURE.md` are retired. The plan is now `docs/TASKS.md` (smaller to-dos), `docs/pathways/` (one file per large development: status, intention, progress, next steps). The dashboard's Developments tab has a drop-down between Tasks, Pathways and Feature tracker (the old Tool notes view without the in-development / wants-to-change boxes) (pathways show one stage chip; pathways grouped in progress, ideas, done, paused; a rolling-out pathway shows x/n live tools from a tool fact); the old To look at, Settled decisions and Future views are gone. Settled decisions moved to a planner archive note.
- Dashboard rebuilt: a side menu (bottom bar on a phone), a drawer for detail (tool profile, tasks, pathways, features), pathways stacked (in progress, then ideas, with Done and Paused folded), tasks as compact rows, features and the build guide as plain single columns; status shown as a dot and a word instead of chips; the Next up view removed; the tool profile now shows what the tool does (from its About words), its recent patch-note entries and last-changed date, a Review status dropdown just under the Has dots, each section foldable; the Matrix is a real table on a phone too (name column sticky, all columns fit at 390 wide) (the status, in-development, wants-to-change, differs-from, representation and open-question note fields were deleted from the shared store; only the Review of Maths Words Bingo was kept). Code: `src/admin/` (`AdminPage`, `ToolsSection`, `ToolProfile`, `ui`, `PlanPages`, `DevelopmentsPage`).
- **Agents:** anyone can work anywhere, one agent per area at a time, coordinated through the planner note Maths Tools - Handoff (`AGENTS.md`, `CLAUDE.md`). New planner note Maths Tools - Overview (tools index, being worked on, added in the last month).
- Code: `scripts/adminDocs.mjs` (reads tasks and pathways), `src/admin/PlanPages.tsx`, `AdminPage.tsx`, `DevelopmentsPage.tsx` (now "Tool notes"). References to the old docs updated across docs, specs and code comments.
- **Slimmed:** October entries up to the 26th moved to `docs/history/PATCH_NOTES_2026-10.md` (the planner Build Log already holds the per-session record); `CLAUDE.md` cut from 538 to about 400 lines (the session workflow, record routine and dashboard notes API moved to `AGENTS.md`); the planner's per-tool pages, Tool Index, Feature Guide, Development Prongs, Future Developments and Different From notes deleted (in the planner trash for 30 days; Network Flows' page was kept because it carries two completed to-dos). `scripts/notesPages.mjs` and its dump test removed.
- **Not done:** branch not merged.
- Agent: Claude Code.
- Notes: planner Build Log, "2026-10-28 — Tasks and pathways replace the planning docs (Claude Code)".

### 2026-10-28 — CI on main was red: a rare Order of Operations mistake question
- CI on `main` failed on the merges of #109 and #110 in `orderOfOperations.test.ts` (build, lint and the shell smoke check passed). Cause: the "−3² as 9" mistake question only applies when the random expression starts with a negative number, and the generator tried 80 times before giving up (a teacher would then silently get a different question type) while the test sampled 40; both missed about 1 run in 60. The generator now tries 400 times and the test samples 400, which passed 60 runs in a row.
- Agent: Claude Code.
- Notes: planner Build Log, "2026-10-28 — Whiteboard fits and swaps to the answer, Swap sides, scalene triangles, AGENTS.md (Claude Code)".

### 2026-10-28 — Swap sides: question left or right in every two-sided layout of the shell
- **What:** a per-device setting that mirrors the Whiteboard's question and working box (embedded and fullscreen, with the divider drag measured from the question's side) and the Worked Example's steps and picture. Set from the landing-page menu ("Two-sided layouts: Question left / Question right"), each tool's menu ("Swap Sides") and a button on the fullscreen bars. Phone and tablet layouts are single column and are unchanged.
- Code: `useSwapSides` / `setSwapSides` in `layoutMode.ts`, `SwapSidesButton.tsx`, `WhiteboardView.tsx`, `WorkedExampleSteps.tsx`, `MenuDropdown.tsx`, `LandingPage.tsx`. Not yet: DecisionShell's own splits. Reference: `docs/reference/toolshell.md`; Features: "Swap sides".
- Agent: Claude Code.
- Notes: planner Build Log, "2026-10-28 — Whiteboard fits and swaps to the answer, Swap sides, scalene triangles, AGENTS.md (Claude Code)".

### 2026-10-28 — Whiteboard: answer replaces the question, content fits the box; scalene triangles in Perimeter & Area
- **Fits the box:** the Whiteboard's question box now shrinks its content to fit (it only grew content when the working panel was collapsed), so a tall diagram or a wordy question, with or without its answer, no longer runs out of the box. Perimeter & Area overflowed by up to 111px at laptop size; now 0, and Percentages, Ratio Sharing, Best Buys, Speed Distance Time and Ratio Manipulation measure 0 at laptop and tablet sizes.
- **Answer replaces the question:** on the Whiteboard (embedded and fullscreen) a text question is swapped for its answer, large and green, in the same place, as a Worksheet cell already does; the box is sized for the larger of the two so nothing shrinks or jumps. Picture tools (their own `questionRenderer`) keep the picture; Perimeter & Area now reserves room for its answer line so the picture does not shrink when the answer appears. The other picture tools still add their answer beneath the picture and are not yet changed.
- **Scalene triangles** (Perimeter & Area, Standard Shapes, Level 2, on by default): eight whole-number triangles built from two Pythagorean triples sharing the height, with all three sides and the height labelled; Level 3 (find a missing length) now offers right-angled, isosceles and scalene triangles: the area is given and either the height or the width is the marked length (the "Triangle" option is renamed Right-Angled Triangle). The working draws the dashed rectangle round the triangle: area of the rectangle = 2 × area of the triangle; area of the rectangle = width × height; then width or height = area ÷ the other. Tests added (`perimeterArea.test.ts`).
- Code: `WhiteboardView.tsx` (`questionOrAnswer`, `fit`), `ScaleToFit.tsx`, `perimeterArea/shapes.ts` (`SCALENE`), `pools.ts`.
- Agent: Claude Code.
- Notes: planner Build Log, "2026-10-28 — Whiteboard fits and swaps to the answer, Swap sides, scalene triangles, AGENTS.md (Claude Code)".

### 2026-10-28 — Keep Depth cards standalone

Depth now uses a full-slide question face and a full-slide answer face, preserving the cast, speech bubbles, Feathers, diagnostic feedback, diagrams and complete reasoning. Removed its workspace layout picker and split solution stepper, plus redundant navigation on single cards. Saved older workspace settings are ignored during presentation and normalized on edit/export without changing content. Shared layouts remain available for ordinary fixed question sets and live generators; Depth retains its own menu entry.

Agent: Codex.
Notes: planner Build Log, "2026-10-28 — Decks: questions workspace, generator window, layouts, Depth restored, solution stepper (Codex)"; preview branch `codex/deck-generator-dialog-preview`.

### 2026-10-28 — Restore Depth characters and blue-white deck paper

Restored the existing Depth cast, speech bubbles and Feathers in the shared question renderer and card picker. The old conversion preserved claims as text but omitted the artwork and owl prompts. Cards now keep their canonical question nudge and answer takeaway through save/export, with optional editing and the existing Feathers mute preference. Older Depth copies gain missing artwork hints without replacing teacher edits. All three question layouts remain available. Deck paper, writing spaces, previews and the surrounding page now use a light blue-white tint instead of a white canvas.

Agent: Codex.
Notes: planner Build Log, "2026-10-28 — Decks: questions workspace, generator window, layouts, Depth restored, solution stepper (Codex)"; preview branch `codex/deck-generator-dialog-preview`.

### 2026-10-28 — Shared question layouts and quieter workspaces

Fixed sets, live generators and Depth cards now share three editor-selected layouts: Full-width, Workspace right and Workspace left. Question content, briefs and order remain independent of display, with Apply/Cancel, undo and draft recovery covering layout settings. A fixed set’s camera remains connected between questions and while viewing teaching guidance. Camera actions/device selection sit under one Workspace options menu; permanent camera headers were removed. Question entries are grouped in Add slide and the library. Reduced page margins, panel padding and built-layout insets give more space to the lesson; saved custom element positions remain intact.

Agent: Codex.
Notes: planner Build Log, "2026-10-28 — Decks: questions workspace, generator window, layouts, Depth restored, solution stepper (Codex)"; preview branch `codex/deck-generator-dialog-preview`.

### 2026-10-28 — Whiteboard generator slides with optional visualiser

Added a Whiteboard generator layout: generated question left, blank writing workspace right; solution reveal moves the question upward and unfolds canonical steps beneath it while retaining the workspace. Add it through the slide layouts, generator configuration or Send to a deck. The Estimation whole-number Whiteboards slide demonstrates it. Camera visualiser is optional per slide and starts only on request during presentation, with device selection, retry and a return to blank working. Reused the tool-shell camera hook and fixed stream cleanup, including camera requests completing after exit. Editor previews remain camera-free.

Agent: Codex.
Notes: planner Build Log, "2026-10-28 — Decks: questions workspace, generator window, layouts, Depth restored, solution stepper (Codex)"; preview branch `codex/deck-generator-dialog-preview`.

### 2026-10-28 — Slide-owned skill sets and question briefs

Replaced shared-bank browsing with a direct Skill practice editor: question, answer and worked steps, Add my own question, ordered sets, optional teaching details and classroom preview. Briefs record the skill focus, exclusions, count, progression, examples and generator solution reference; they can be copied into chat and saved with the set in one undo step. The same briefing process applies when Claude plans a lesson independently. Depth has its own picker. Estimation’s practice and exit questions are embedded with their slides, retaining notes and legacy import support. Fixed working now includes Original and matches generator reveal construction, including fraction grouping, through a shared helper.

Agent: Codex.
Notes: planner Build Log, "2026-10-28 — Decks: questions workspace, generator window, layouts, Depth restored, solution stepper (Codex)"; preview branch `codex/deck-generator-dialog-preview`.

### 2026-10-28 — Deck lesson thread and calmer question controls

Added a saved teaching brief for each slide and a central Lesson thread editor with the ordered purposes visible together. Filled every Estimation slide’s brief, including generator inclusion/exclusion criteria and evidence for the next move; generator configuration now shows that brief. Added the authoring rule so AI-built decks record the intended questions before selecting presets. Question displays tuck secondary answer/guidance actions and solution jumps into disclosure controls, leaving the question and progressive working primary.

Agent: Codex.
Notes: planner Build Log, "2026-10-28 — Decks: questions workspace, generator window, layouts, Depth restored, solution stepper (Codex)"; preview branch `codex/deck-generator-dialog-preview`.

### 2026-10-28 — Deck solutions: question right, unfolding working left
- Curated and generator questions now share a side-by-side solution stepper matching the tools’ numbered timeline: the question moves smoothly right as the working opens on the left; earlier steps dim and the current step is highlighted.
- Previous/Next step, progress dots and Show All / Step-by-Step give control over the solution. The answer is the final green A row. Hiding working returns to the centred question; changing question resets the solution.
- Classroom and popup previews use the same component. Long working scrolls within its column; narrow popup previews stack question above working; reduced-motion settings remove transitions and fades.
- Added state tests and `npm run smoke:solutions` for layout, answer disclosure, backwards steps, keyboard navigation, generator resets, diagnostics and responsive previews. Updated the existing workspace browser check for the new controls.
- Agent: Codex.
- Notes: planner Build Log, "2026-10-28 — Decks: questions workspace, generator window, layouts, Depth restored, solution stepper (Codex)"; repo reference, feature guide and project status updated.

### 2026-10-27 — Five questions per misconception-practice slide
- Added build rule R42 and the authoring checklist: start each misconception-practice slide with at least five distinct, fixed examples at the intended level, with deliberate variation and question-specific teaching guidance.
- Expanded Estimation from 14 to 40 fixed questions: all eight practice sequences now have five questions. Short diagnostic checks and exit tickets keep their intended role; teachers can still choose shorter sequences.
- Built-deck tests enforce the minimum and distinct content. An Estimation check verifies correct rounding and the specific wrong method against every recorded answer and expected response.
- Updated the deck reference, lesson-building checklist, spec guidance and project status.
- Agent: Codex.
- Notes: planner Build Log, "2026-10-28 — Decks: questions workspace, generator window, layouts, Depth restored, solution stepper (Codex)".

### 2026-10-27 — Questions workspace: misconception-led authoring and deck-owned sequences
- Replaced side-panel question pickers with a central **Questions** workspace: rendered library cards, filters, built practice and existing Depth material, authoring, sequence ordering and classroom preview.
- Added open-response, multiple-choice, compare-claims and find-the-error content, with misconception descriptions, rationale, expected wrong responses and follow-ups. Custom descriptions and labelled drafts support other tools.
- Edits belong to the deck; Apply is one undo step, library saving creates an explicit new copy, and exports embed question content. Legacy questions adapt without changing their sources; missing references stay visible. Built-in Depth visuals are preserved as references and protected against incompatible content edits.
- Player: previous/next question, count and sequence end; answers hidden initially; staged explanations and clearly marked teacher guidance. Curated sequences no longer fall through to general generators. Tool-page captures open the same workspace.
- Estimation: added example-specific guidance and corrected two examples whose wrong method gave the correct answer (451 − 123 and (58 + 47) / 19 now distinguish those methods).
- Verification: content/API regression tests and browser checks for draft recovery, source isolation, undo/redo, portable export, diagnostics, custom authoring, diagrams and phone/tablet/laptop layouts. `npm run smoke:questions` repeats the core browser flow without writing shared teacher content.
- Agent: Codex.
- Notes: planner Build Log, "2026-10-28 — Decks: questions workspace, generator window, layouts, Depth restored, solution stepper (Codex)"; repo reference, feature guide, glossary and project status updated.

### 2026-10-27 — Deck generators: central configuration popup
- Generator questions, book activities and practice backups now open **Configure generator**, with the tool’s tabs, shared level controls, roomy Question Options and a slide preview. The side panel holds a summary and the Configure button.
- New generator elements and layouts open configuration automatically; existing ones also open on double-click. Apply saves the draft as one undo step; Cancel, Escape and the backdrop discard it. The dialog traps focus and suspends editor shortcuts, with stacked controls and preview on narrow screens.
- Question pools retain a choice unless optional, dependent options honour their requirements, and changing question type keeps a supported level. Custom instructions update immediately on the slide.
- Agent: Codex.
- Notes: planner Build Log, "2026-10-28 — Decks: questions workspace, generator window, layouts, Depth restored, solution stepper (Codex)"; repo documentation updated.

### 2026-10-27 — Deck editor: findable slides, hideable and resizable panels, grouped menus
- **Panels:** the slide strip and the properties panel hide, resize and remember their state; `\` hides or shows both for a bigger canvas.
- **Finding things:** a slide finder, a compact list view, drag to reorder, hover duplicate / delete, "Practice" slides named by their misconception; an "On this slide" list of every element (front first) to select what is hidden and change its layer.
- **Menus:** Add slide grouped by kind with what each is for; Lesson pieces (board, practice, Depth, grid, generator, book activity) with a line each; File (export, import, reset); a keys panel replaces the paragraph under the properties.
- **Properties** are collapsible sections that remember open or shut; the selection's own controls come first.
- **Generators and questions:** a searchable tool picker grouped by strand; a live preview of what a generator or book-activity slide will ask (with the answer); a question browser for the hand-picked bank (filters, search, rendered maths and answers, add several at once, misconception matches first); "Back to the tool's defaults". Menus no longer clip inside the narrow panels.
- **Estimation deck, from Harry's feedback:** the board's Filled in / Structure only / Blank control moved from above the board (where it collided with the slide's prompt) to the player's bottom bar, with `b` to cycle; the discussion slide now asks where the first significant figure is in $0.039$ instead of "nearer 0 or 1" (not about significant figures).
- **Pictures:** paste an image straight from the clipboard, or drop an image file onto the slide, instead of going through a file.
- Code: `src/decks/EditorChrome.tsx` (new), `moveIndex` in `geometry.ts` (tested). Reference: `docs/reference/decks.md`.
- Notes: planner Build Log, "2026-10-27 — Decks: editor navigation and panels".

### 2026-10-27 — Generators wired into decks: generator slides, book activities, Send to a deck
- **Every question tool's generator works in a deck** (`src/decks/generators.ts`): loaded through the registry and the tool's own `__test` export, with its own tabs, levels and Question Options, and its defaults wherever a slide says nothing. Tools with their own picture print are left out for now. A test loads every listed tool and asks a question on every tab and level.
- **Generator slide:** the tool's generator live, like its Whiteboard: opens on the same question every time (a seed), New question, the working one step at a time, the answer.
- **Book activity slide:** eight (or any number of) numbered generated questions, answers on demand, New set, and Print through the tool page's worksheet print.
- **Send to a deck** (tool page burger menu, Developing-tools mode): the current setup as a generator slide or book activity, or the question on screen as a hand-picked practice slide, added to the end of a deck.
- The editor's generator panel (also the practice question's backup) offers the tool's own tabs, levels, option pools, switches and dropdown. Practice questions may leave the misconception unnamed; worded questions and text steps carry over.
- Estimation deck: two Whiteboard generator slides and a decimals book activity (28 slides).
- Notes: planner Build Log, "2026-10-27 — Decks: whole lessons with a slide editor (Estimation)".

### 2026-10-27 — Deck editor: type on the slide, equation editor, alignment; Depth, discussion and grids; shared between devices
- **Type on the slide:** double-click a text box (or Enter) and type in place; the box grows to fit; one undo step per edit; a new text box opens ready to type.
- **Equation editor** (`src/decks/EquationEditor.tsx`): a visual maths field (MathLive 0.111.0, loaded only when opened, using the bundled KaTeX fonts), a palette of structures and symbols, and the LaTeX underneath. Adds an equation element, edits one, inserts maths at the caret, and opens from the question editor's fields.
- **Alignment:** Shift-click and drag-a-box selection; pink smart guides snap edges and centres to the slide and to other elements; resize edges snap too; line up and space evenly; layers for a selection; pictures keep their shape. Pure geometry in `src/decks/geometry.ts` (tested).
- **New elements and layouts:** a Depth item drawn flat on the slide (no stage or panel inside the slide), a question grid (quickfire block, retrieval starter, exit ticket), click order ("appears on click n") with the split discussion layout (prompt, key point, question, answer). New families Depth, Discussion, Retrieval.
- **Estimation Depth bank** (`src/tools/Number/EstimationDepth.ts`, 12 items, a Start here per level), on the tool page and in the deck. Its numbers differ from the deck's practice questions and boards (they first shared 48 × 31, 6.1 ÷ 0.48 and (34 + 21) ÷ 11, so a Depth check repeated what the class had just done); `decks.test.ts` now fails on any Depth slide that reuses a deck's numbers. Wrong options carry the shared misconception tag (new optional `DepthOption.tag`). The Estimation deck is now 25 slides with three Depth checks, a discussion and an exit ticket.
- **Shared between devices:** saves go in the background to `/api/decks` (private Vercel Blob: a blob per deck, an ETag-guarded index and question store); opening the list or a deck pulls newer copies; offline it keeps working on the device.
- Tests: `deckGeometry.test.ts`, `estimationDepth.test.ts`, `decksApi.test.ts`, and Depth / grid / step checks in `decks.test.ts`.
- Notes: planner Build Log, "2026-10-27 — Decks: whole lessons with a slide editor (Estimation)".

### 2026-10-27 — Decks: whole lessons on their own page, with a slide editor (Estimation first)
- **New `/decks` page, player and editor** (`src/decks/`, `docs/reference/decks.md`). A deck is a whole lesson for the projector; a slide is a 16:9 canvas of elements. Listed from the landing page's Developing-tools menu and from the tool's burger menu ("Deck: Estimation", Developing-tools mode).
- **Player:** arrow keys / Space, progress bar, jump list (`j`), full screen, one accent colour per slide family (none green, yellow or red). Ink is on every presented slide and clears when the slide changes (`mt-ink-clear` in `InkOverlay`); it stays when a board's fill mode changes, and is off in the editor.
- **Elements:** text with `$…$` maths, rectangles and ellipses, lines and arrows, images, a **board** (a table with a corner control: Filled in / Structure only / Blank) and a **practice question** (a hand-picked bank written against one misconception, "Another question", separate answer / working / teacher-notes reveals, and the tool's own generator as the backup).
- **Editor** (Edit in the player): slide strip with Add slide from ten layouts, drag / resize / layer, snapping, undo / redo, a properties panel per element, a **question editor** (write a new question or edit a built one; KaTeX checked as you type), copy / paste between slides and decks, Export and Import slides, Reset to the original. Edits and new decks are saved on the device.
- **Slide library** (`/decks/library`): every layout with sample content, grouped by family, and the planned pieces.
- **Misconception tags** (`src/shared/misconceptions.ts`): one vocabulary for deck questions and, as it grows, Depth options. Seven for Estimation.
- **Estimation deck:** 20 slides, 14 hand-picked questions across the three levels, each practice slide aimed at one trap.
- `src/tests/decks.test.ts` checks every bank question, misconception, layout and built slide (on the canvas, text size, KaTeX, boards) and every practice element (known intention, questions written against it, the generator preset runs). Checked in Chromium at 1366×768 (player, editor, question editor, image upload, library, new deck).
- Notes: planner Build Log, "2026-10-27 — Decks: whole lessons with a slide editor (Estimation)".

### 2026-10-27 — Tabs in the options popover; tidy-up list cleared; Future under Developments
- **Tabs in the Question Options popover.** A level with many options now shows small pill tabs at the top of the popover (**Questions · Numbers · Method · Display**) and one tab's groups at a time, on the laptop popover, the differentiated-worksheet popover and the phone / tablet options sheet. A group says where it sits with `tab` (`QOTab` in `src/shared/types.ts`); untagged groups sit on Questions, and tabs only appear when a level's groups fall on two or more. The six walls are tagged: Rounding, Comparing & Ordering Numbers, Binomial Expansion (through the shared `pool` helper in `shared/binomial.tsx`), File Sizes, Speed Distance Time and Order of Operations. `src/tests/qoTabs.test.ts` fails on a level with more than 12 choices on one tab, or an unknown tab name. Checked at laptop and phone sizes. A tabbed popover stays one narrow column (no tab holds more than four groups), so the wide two-column layout now only applies to an untabbed popover with more than four groups, and the `qoColumns` default that forced it (Rounding only) is gone.
- **Rolled out to every tool.** Every option group on all 42 tools with Question Options now carries a tab, and groups are always listed Questions → Numbers → Method → Display. The popover picks its layout from the level's size (`qoLayout`): more than 8 choices → tabs; 8 or fewer → just the order (small headers for middle-sized levels were tried and dropped). The shared Place value groups carry their own tab. `qoTabs.test.ts` now fails on any untagged group, and on a level above 8 choices whose groups sit on one tab (Solving Linear Equations Level 1's "Larger x on" moved to Questions for this).
- **Tidy-up list cleared.** "Question Options that are walls" is settled by the tabs; "Built, but only on a handful of tools" is settled as *grow each capability in that tool's review*. Both moved to Settled decisions in `docs/TIDY_UP.md`.
- **Dashboard:** Future developments is now an entry in the Developments drop-down rather than its own top tab.
- Notes: planner Build Log, "Options popover tabs; tidy-up list cleared".

### 2026-10-27 — No repeats in the last 15 questions (Whiteboard, Worked Example, Decision tools)
- **New Question never repeats one of the last 15 on screen.** `src/shared/recentQuestions.ts` fingerprints a question by its content (a stable JSON of the question without its bookkeeping fields: `key`, `_seed`, `_qo`, the difficulty scores, `_category`, `working`), keeps the last 15 fingerprints, and regenerates up to 30 times until the new one is not among them. `ToolShellCore` (Whiteboard, Worked Example, phone view) and `DecisionShell` (window of 8, since its pools are smaller) both use it. Replaying a seed, restoring a recent or pinned question, and share links are untouched.
- **Errs towards refusing.** A question has two fingerprints and is a repeat if either matches: the full content, and the shown one (the wording, the answer and the text drawn on the picture: any `label`, `text` or `caption` field of the picture data). So a repeat that differs only in a field the student never sees (a random id, a shuffled order) is still caught; the cost is that a question whose picture alone differs, with the same wording and answer, is refused too. A picture-only question has no shown fingerprint, so it is not refused as "the same" as every other. Measured over all 344 tool-levels at default options: 1.15 generations per click on average, and only Indices > Common Base (level 1) runs out of different questions and accepts a repeat.
- **Why a fingerprint rather than the `key`:** measured over the generators, 114 of 344 tool-levels can produce two questions with identical content but different keys (the random id), and 3 have hand-written keys so coarse that different questions collide. The check is built to over-refuse rather than under-refuse (see above). A pool too small to avoid a repeat accepts one after 30 tries.
- **Worksheets use the same check (Harry's call).** `makeUniqueQ` (worksheets, differentiated sheets, Smart Progressor pools), a single-cell regenerate (both shells) and the advanced WorksheetBuilder's regenerate now refuse a question whose fingerprints match one already on the sheet, instead of comparing keys. `makeUniqueQ` also renames a colliding key (`~2`) so every cell keeps its own key (cell identity, flips) without ever refusing a different question for it. This settles rule R2: **never append a random id to a key**; `CLAUDE.md` and both reference files say so. Measured over a 30-question sheet at default options: 1.94 generations per question (the key check, fooled by random ids, was 1.01), and 8 tool-levels (Circle Properties circumference and area, Non-Linear Simultaneous Equations level 3, Indices Common Base, Basic Angle Facts right angle) have fewer than 30 different questions, so a long sheet repeats after 100 tries. The key check used to hide that. Tools with their own key-based `generateUniqueQ` (Angles in Parallel Lines, Equations of Lines, Bearings, Circle Properties) are not changed.
- **Pools widened so a 30-question sheet never repeats (Harry's call).** Non-Linear Simultaneous Equations level 3 (both sub-tools): 19 and 20 circle-and-line questions became 73 and 70 (generated by script and checked: both intersections lie on the circle and the line, and the quadratic's roots match; the banks' random key suffix is gone, the key is the entry's own). Indices > Common Base level 1: indices up to 2^8, 3^5, 5^4, 10^5 instead of 5, and either side of the equals sign for "Write as a power" and "Solve for x" (16 became 44). Circle Properties: dimensions 2–36 instead of a list of 20 (decimals 1.5–34.5), giving 32 for whole numbers. Basic Angle Facts > 90° level 3 was a fault of the check, not the generator: its question is the picture, so the **shown fingerprint now includes the text drawn on the picture** (any `label`, `text` or `caption` field), which tells "Find x" with different angle expressions apart (26 became 237). `src/tests/recentQuestions.test.ts` now fails if any tool level cannot fill a 30-question sheet at default options. Indices is calibrated, so its bands were regenerated (`CALIBRATE=1 npx vitest run src/tests/indicesDifficulty.test.ts`, with `docs/calibration/INDICES_DIFFICULTY.md`); the cut points moved by about a tenth of a point in several sub-tools as well as Common Base.
- **Left as is (Harry's call):** Circle Properties has 32 whole-number questions at default options, so a sheet of more than 32 will repeat; the new pool test allows one repeat in 30 and would flag a level that falls below a full sheet.
- Tests: `src/tests/recentQuestions.test.ts` (16): both fingerprints, the 15-question window, `makeUniqueQ` (random id, colliding key), every tool level against the 15-question window, and every tool level filling a 30-question sheet.
- Notes: planner Build Log, "No repeats in the last 15 questions".

### 2026-10-27 — CLAUDE.md split: reference moved to docs/reference/, rules kept in a checklist
- `CLAUDE.md` went from about 35,000 to about 14,000 tokens. The shared-library reference moved, byte for byte, into six files in **`docs/reference/`** (`toolshell`, `options-and-calibration`, `questions-and-working`, `pictures`, `depth-teach-lessons`, `shell-extras`), indexed from `CLAUDE.md` with a "read when" line each. Only seven lines of the original changed (pointers).
- **Rules checklist** in `CLAUDE.md`: every never / always / must rule from the moved text, one line each (R1–R41). Each rule's id is written in a comment beside the sentence it summarises in the reference file.
- **`src/tests/claudeDocs.test.ts`** keeps the two in step: every reference file is indexed and every link resolves; every never / always / must line in a reference file carries a rule id (or `ref` for a plain description); every id is in the checklist and every checklist rule is tagged; and `CLAUDE.md` is capped at 64,000 characters so it cannot quietly regrow.
- Source comments and docs that named a moved `CLAUDE.md` section now name the reference file. The reference both said to append a random id to a question key and that a random number in the key defeats the repeat check (R2); settled later the same day (see "No repeats in the last 15 questions").
- Notes: planner Build Log, "Perimeter & Area live, 1.1.3 Embedded Systems, Future tab, CLAUDE.md split".

### 2026-10-27 — Future developments tab and note; back bench trimmed
- **Future developments** is a new home for ideas that are not scheduled, so they are not lost and not read while working: `docs/FUTURE.md` (layered Question Options popover, skill drill-downs, complexity stepper, and an Accessibility section holding colour schemes), shown on a new **Future** tab on the Tools dashboard (`scripts/adminDocs.mjs` writes a `future` section into `adminDocs.json`), with a matching planner note **Maths Tools — Future Developments**. `CLAUDE.md` says to open it only when Harry asks. The back bench (`docs/BACKBENCH.md`) is the Skills library only again.
- **Tidy-up list:** very large files and parked ideas are no longer loose items; `.pptx` export, the slide-strip builder, slide templates and saved lessons were removed from the ideas (they will be looked at in a different capacity).
- Notes: planner Build Log, "Perimeter & Area live, 1.1.3 Embedded Systems, Future tab, CLAUDE.md split".

*Older entries are in `docs/history/` (October 2026 up to the 26th in `PATCH_NOTES_2026-10.md`; before October in `PATCH_NOTES_to_2026-09.md`). The fuller record of each session is the planner Build Log.*

---

# Computer Science


### 2026-10-27 — 1.1.3 Embedded Systems; System Architectures retired
- **New tool `embedded-systems`** (`/embedded-systems`, id `1.1.3`), on the CS shell like 1.1.1 and 1.1.2 (pure data, `__topic` checked by `validateTopic`): four Learn lessons (one with a box schematic of a washing machine's embedded controller: inputs, CPU, ROM program, outputs), 13 core cards, 4 fill-ins, 6 misconception checks, 8 exam questions with a 6-mark discussion, 3 synoptic questions (with 1.1.1, 1.1.2 and 1.2.1). Brief `specs/cs/embedded-systems.md` (implemented). The J277 wording for 1.1.3 is purpose, characteristics and examples; real-time operating systems, firmware and microcontrollers are not in it, so they are flagged beyond spec (the old tool taught RTOS as core).
- **Retired the original `system-architecture` tool** (all of 1.1 in one hand-built file): 1.1.1, 1.1.2 and now 1.1.3 each have their own tool. Its registry entry, file and test entry are gone.
- Dashboard note for `system-architecture` stays until this branch is merged, then is removed with the other old ids.
- Notes: planner Build Log, "Perimeter & Area live, 1.1.3 Embedded Systems, Future tab, CLAUDE.md split".
