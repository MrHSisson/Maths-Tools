Strand: Maths

## 2026-11-22 — Simplex: the print carries the tableau and the working; the roadmap as a page

Branch `claude/beautiful-noether-aczmnn`. Area: `src/shared/decision/{printExam,types,DecisionShell,SxWorking}.ts(x)`, `src/tools/Decision/{SimplexAlgorithm,SimplexRoadmap,decisionSpec}`, `src/registry.ts`, `src/tests/simplexPrint.test.ts`, `docs/roadmaps/linear-programming.md`.

- **Printing a Simplex question was unusable** (found by generating every sub-tool and level): the pin's "Print saved questions" printed only the words and a blank box, so "a tableau is shown" printed with no tableau, a table of data did not print, and the answers page was one line ("pivot: row 2, column x"). Now a new `config.skillPrint` (`figure`, `working`, `perPage`) lets a Decision tool add to a printed skill question: the tableau or table of data is drawn under the question, each question has a page to work in (a large Working box), and the answers page has the whole model working (the stepped solution, every tableau and row operation). `SxPrintFigure` and `SxPrintWorking` in `SxWorking.tsx` (flow layout, inline styles, so they hold in a print window). Other Decision tools are unchanged.
- **How to print**: pin the questions (the pin beside New Question), open its panel, Print saved questions, choose Print questions, Print answers or Print both.
- **The roadmap as a page**: `/lp-roadmap` (Simplex Roadmap, `enabled: false`, listed under the Decision hub's DD card in Developing-tools mode). Six stages from `docs/roadmaps/linear-programming.md`, each with what students can do, one button per piece of practice (opens the Simplex tool on the right sub-tool, level and option through the `?tool=&level=&o_…` link), the deck link, the textbook stop-offs, and a Mark done tick kept on the device.
- **Checked**: every sub-tool and level printed to PDF in headless Chromium; the real flow (pin, Print both) on One pivot; the roadmap at laptop and phone width (no overflow, no console errors, links land on the right sub-tool and level, the tick survives a reload). A test checks that every question that says a tableau or table is shown prints one.
- **Deliberately not done:** a check on a real printer and on a tablet (still open); the deck `lp-simplex-process` is unpublished, so its roadmap button needs it published first; the textbook exercise numbers are still those recorded when the chapters were read, to be checked against Harry's copies; Review is not changed (the tool stays "in progress").

Agent: Claude Code
Notes: Maths Tools — Handoff block "claude/beautiful-noether-aczmnn".
