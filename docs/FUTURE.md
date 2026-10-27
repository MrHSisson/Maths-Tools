# Future developments

**Ideas kept so they are not lost. Not scheduled, and not part of the plan.** Do not read this file when working on a tool, planning a session or tidying: it is only opened when Harry asks for it. The dashboard shows it under its own **Future** tab, and Harry's planner keeps a matching note (**Maths Tools — Future Developments**). Add an idea here (and to the note) rather than leaving it in a code comment; take one out when it is picked up and moved into `docs/PROJECTS.md`.

Format: one `## ` heading per idea (or per group of ideas), each with bullets: what it is, why it waits, what it pairs with.

## Layered Question Options popover
- **What it is:** the options popover split into six layers (what is asked, the numbers, notation, method, the answer, support), so a teacher meets a few groups first and opens the rest only when they want them.
- **Why it waits:** it is the fix for the Question Option walls (Rounding, Ordering Numbers, Binomial Expansion, File Sizes, Speed Distance Time and Order of Operations have 13 to 20 options). It makes sense once those tools' options have been regrouped into the six groups, tool by tool, during each tool's review.
- **Pairs with:** the tool review cycle; the Question Options items in `docs/TIDY_UP.md`.

## Skill drill-downs
- **What it is:** a `[[skill|term]]` marker in a working step opens a short slide sequence teaching that one skill (for example the lowest common multiple) and then returns to the step.
- **Why it waits:** it depends on the Skills library, which is on the back bench (`docs/BACKBENCH.md`). The markers stay in three tools, inert until the library is un-parked, and the smoke tests still check each marker names a real skill.
- **Pairs with:** the Techniques engine and better worked solutions, which feed the library directly.

## Complexity stepper
- **What it is:** a way for a student to move up through a generator's levels without changing them by hand: the questions get harder as they succeed.
- **Why it waits:** it is a student use case, probably tangled up with the Smart Progressor's difficulty rankings, and needs a lot of work (a record of how a student is doing, a rule for when to step up or down) before it is worth building.
- **Pairs with:** the Smart Progressor and the calibrated difficulty bands.

## Accessibility
- **Colour schemes:** a long-term accessibility update (a projector-friendly or dyslexia-friendly background and contrast). The old picker was removed from every tool because the approach was wrong; a return means rebuilding it on colour tokens.
- **A home for the rest:** other accessibility ideas belong here too (text size, motion, reading support, keyboard use), so they are gathered rather than scattered.
