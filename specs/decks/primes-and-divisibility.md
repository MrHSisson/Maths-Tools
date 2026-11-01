# Lesson plan: Prime numbers and divisibility rules

**Status:** plan agreed (Harry, 2026-11-01); the Number grid and printable are built, the question sets are next · **Tool:** none (every question is authored) · **Class:** Year 9 · **First test of the authoring routine** (`docs/design/DECK_BUILD_CHECKLIST.md`, "Authoring a question set")

**Objective:** find the primes up to 100 with the sieve of Eratosthenes and say why it works; use divisibility rules for 2, 3 and 5 (and 10) without dividing. **Stretch:** the rule for 11, with the rule for 7 as an extra.

**Starting point:** secure on times tables up to 10 × 10 (so a "multiple" here just means "in a times table"). **Factors and multiples are the next topic**, so this lesson uses them lightly and does not teach finding every factor. Year 9. They sometimes define a prime as "a number with only one factor" (the slip is real, but 1 is the only number with one factor), yet they are good at saying "it only appears in its own times table", so there is **little uplift to find in the primes section**: it is kept short and the weight sits in the divisibility rules. Slips to plan for are in the traps tables below.

**Shape (decided with Harry):** little independent practice on primes themselves once the sieve has found them; the practice comes **after the divisibility rules**, where "show this is not prime" is a real use of the rules. Primes get definitions, discussion and Depth checks. One deck, about two lessons, picked up at the dividers (house style: `docs/design/LESSON_STYLE.md`). Calculators allowed, though none of this needs one. **No starter slide: Harry runs his own.** No Level labels on authored sets: difficulty is the ladder.

---

## What already exists, and what does not

| Need | Exists? | Plan |
|---|---|---|
| A generator for primes or divisibility | **No** | Every question is authored. No generator slides, no generator book activities, no pinned worksheets (those are generator-based). Say if you want a tool built later. |
| A 100 grid on a slide to sieve live | **No** (boards are tables; the ratio table and bar model are the only pictures) | **Build a "Number grid" slide piece** (side task done as part of this deck, below) |
| A printable 100 grid | **No** (`printables.ts` has sheets for tools; a deck can only print pinned worksheets) | **Build the printable**, and a Print button on the Number grid slide |
| Depth cards | **No bank** for this topic | Author two or three Depth-shaped slides in the deck (editable copies of authored cards) |
| Teach scenes `factorTree`, `primeVenn` | Yes, but the Teach tab is being retired | Not used |

## Slide piece to build: Number grid (1 to 100 only)

- A 1 to 100 grid in 10 columns, drawn on the slide. **Tap a cell** to mark it. Works in the player and on a touch screen.
- **Marks are scribbles, not coloured cells.** A loose hand-drawn stroke across the number, in **one colour per prime** (2 blue, 3 green, 5 orange, 7 purple); the prime itself is circled in its colour. The wobble is fixed by the number (seeded, never random on redraw), so it looks the same each time and when printed. The grid itself stays plain white with the numbers clear.
- **Choose the prime, then tap:** a small control row picks the active prime (2, 3, 5, 7); a tap scribbles that cell in its colour, and a second tap clears it.
- **Reveal by times table:** a "multiples of" click completes the rest of the chosen times table in one go. So the teacher taps the first five multiples of 2 and then one click finishes the 2 times table; marks already made are kept.
- **Staged for the sieve:** the slide can also carry a prepared run of those fills (2, then 3, then 5, then 7), one per slide click, so the whole sieve can be shown with no tapping; Back undoes a click.
- Three states, as the board has: **Filled in** (the finished sieve), **Structure only** (numbers only, to sieve live; the default), **Blank** (an empty grid for pupils to write in).
- **Print:** a Print button in the player's top bar on any slide that has a grid, opening an A4 sheet with **two grids per page** (one to sieve, one to keep) through the shared `printables.ts` path (`hundredSquareSheet()`). The printed grid is plain, for pupils to scribble on themselves.
- Checks: a unit test that the sieve leaves exactly the 25 primes below 100, that tapping then filling a times table never un-marks a cell, that the scribble for a number is the same every time, and the print markup.

## Flow (about two lessons)

| # | Slide | Type |
|---|---|---|
| 1 | Title: Prime numbers and divisibility | Title |
| 2 | Objective and success criteria | Learning objective |
| 3 | **Section 1: Primes and the sieve** (short) | Divider |
| 4 | Factor, multiple, prime, composite | Vocabulary |
| 5 | **A prime number** has exactly two factors: 1 and itself | Key definition |
| 6 | **A composite number** has more than two factors; 1 is neither | Key definition |
| 7 | Is 1 prime? ("only one factor" against "exactly two"; a claim to test) | Discussion |
| 8 | **The sieve of Eratosthenes:** tap, then reveal the times table | Number grid (tap + times-table fill) |
| 9 | Why can we stop sieving at 7? | Discussion |
| 10 | Sieve it yourself (printable) | Number grid (Structure only) with Print |
| 11 | Using the sieve: four questions (the primes between 10 and 30, how many under 50, twin primes) | Quick grid |
| 12 | **Depth:** two or three authored claims cards (is 1 prime; are all primes odd) | Depth |
| 13 | **Section 2: Divisibility rules** | Divider |
| 14 | Recap: four quick questions on the sieve and the times tables | Quick grid |
| 15 | **Divisible** means n goes into it exactly, with no remainder | Key definition |
| 16 | Rules for 2, 5 and 10: look at the last digit | Board (Structure only) |
| 17 | **Set C: 2, 5, 10** | Deliberate practice |
| 18 | The rule for 3: add the digits | Board (digit sum column) |
| 19 | Why the digit rule works | Discussion |
| 20 | **Set D: the rule for 3** | Deliberate practice |
| 21 | **Set E: choose the rule** (2, 3 or 5) and combining them (6, 15, 30) | Deliberate practice |
| 22 | Book work: 12 numbers, tick each rule that fits (copy into books) | Quick grid, 3 columns |
| 23 | **Depth:** one or two divisibility claims cards (6 needs 2 and 3; digit sums) | Depth |
| 24 | **Section 3: Using the rules on primes** | Divider |
| 25 | Show that 39 is not prime: test with the rules, worked on a board | Board |
| 26 | **Set A: show that a number is not prime** (a reason from a rule; no "is it prime?" questions) | Deliberate practice |
| 27 | **Stretch: the rule for 11** | Divider |
| 28 | Rule for 11: alternate add and subtract the digits | Board |
| 29 | **Set F: the rule for 11** | Deliberate practice |
| 30 | **Extra: the rule for 7** | Divider |
| 31 | Rule for 7: double the last digit and subtract it from the rest (a procedure, shown as an extra) | Board |
| 32 | **Set G: the rule for 7** | Deliberate practice |
| 33 | Exit ticket: 4 quick questions mixing the lesson | Quick grid |
| 34 | Summary | Summary |

Slide 22 (book work) is the take-home piece: copy-into-books, since a pinned worksheet needs a generator. There is deliberately **no prime-or-not set before the rules**: it is Set A on slide 26, and the sieve questions are the quick grid on slide 11. The extra on 7 is two slides plus its divider (my reading of "make 7 slides": say if you meant something else).

---

## The authored sets: ladder, traps, scale, conventions

**Conventions for the whole deck.**

- Factors are listed as ascending pairs: $1 \times 12$, $2 \times 6$, $3 \times 4$.
- Primes are listed in order with commas: 2, 3, 5, 7.
- A "show that n is not prime" answer names the rule and the factor it finds ("ends in 5, so 5 goes in: 85 = 5 × 17").
- A divisibility answer reads "Yes" or "No", with the working showing the rule used: "$1 + 2 + 3 = 6$, and 6 is in the 3 times table, so yes".
- A digit sum is repeated until it is a number we know ("$99$: $9 + 9 = 18$, $1 + 8 = 9$"). Each working line is one mark.
- 1 is neither prime nor composite. 0 is not used.
- Numbers are written without commas below 10 000 and mostly stay below 1000, except where the rung needs more.

### Set A: show that a number is not prime (6 questions; after the rules)

**Decided with Harry (2026-11-01): never ask "is X prime?"** because the class reads it off the sieve grid. Every question asks for a reason from a rule, or an explanation. The questions are in `specs/decks/primes-and-divisibility-questions.md`.

| Rung | Question shape |
|---|---|
| 1 | Show a number ending in 5 is not prime (the rule for 5) |
| 2 | Show an odd two-digit number is not prime (the rule for 3) |
| 3 | The same with a three-digit number that looks prime |
| 4 | A number where more than one rule works ("which rules work?") |
| 5 | Explain why no even number above 2 is prime |
| 6 | Find a number that disproves "if 2, 3 and 5 do not go into it, it is prime" (49, 77, 91) |

**Traps.** "Odd means prime." "Not in my times tables means prime." "All primes are odd" and "2 is not prime because it is even." "The rules for 2, 3 and 5 are enough."

**Scale.** Numbers to 231; the last rung stays below 100 and uses the 7 times table (7 × 7), which is why the deck also has the rules for 11 and 7.

### Using the sieve (quick grid: 4 questions, not a set)

Read from the finished sieve: the primes between 10 and 30, how many primes under 50, and one clue question (a pair of primes that differ by 2: "twin primes"). No working beyond a line.

### Sets C, D, E: the rules for 2, 3, 5 (5 to 7 questions each)

| Set | Ladder |
|---|---|
| C: 2, 5, 10 | 1 a number that fails both; 2 ends in 0 (passes all three); 3 ends in 5 (5 only); 4 ends in an even digit that is not 0 (2 only); 5 a large number where only the last digit matters; 6 edge case: a number that *contains* even and 5 digits but ends differently (e.g. 523) |
| D: the rule for 3 | 1 a two-digit number with digit sum 3, 6, 9 or 12; 2 a two-digit number that fails; 3 a three-digit number; 4 a digit sum that needs a second step (99, 999); 5 a number with a zero in it (303, 1020); 6 edge case: a number that looks like it fits because of its last digit (e.g. 93 passes by digit sum, 94 does not, 36 and 63 are the same digits) |
| E: choose the rule | 1 one number, which of 2, 3, 5 divide it; 2 a number divisible by two of them; 3 a number divisible by all three (30, 60, 90 and then 120, 210); 4 combining: 6 is 2 and 3 (include 9 and 4 as traps); 5 find the missing digit (e.g. 4_6 is divisible by 3) |

**Traps.** "Divisible by 3 if the last digit is 3, 6 or 9." "Divisible by 2 if it ends in 2." "5 and 10 are the same rule." Not repeating a digit sum. A number divisible by 6 needs both 2 *and* 3, not just one.

**Scale.** Two and three digits, up to 4 digits on the last rung only.

### Sets F, G: the rule for 11 (stretch), then 7 (an extra); 4 to 6 questions each

| Set | Ladder |
|---|---|
| F: 11 | 1 two-digit repeated digits (33, 77); 2 a three-digit number divisible by 11 (alternating sum 0, e.g. 253); 3 one that fails; 4 alternating sum of 11 (e.g. 209: $2 - 0 + 9 = 11$); 5 four digits |
| G: 7 | 1 a two-digit multiple of 7 (use the rule: double the last digit, subtract from the rest); 2 a three-digit multiple of 7 needing one step; 3 a number that needs two steps; 4 one that fails; 5 the traps 91 and 119 which look prime |

**Traps.** Starting the alternating sum from the wrong end (it gives the same answer up to sign, which is worth saying). A result of 0 is divisible. A negative alternating sum still counts (-11). For 7, subtracting the wrong digit or forgetting to double.

### Recap and exit ticket (quick grids; the starter is Harry's own)

- **Recap:** four items on the sieve and times tables, with numbers not used in the sieve slides or its quick grid.
- **Exit ticket:** four items mixing the lesson (a rule for 3, a rule for 5, "show that 111 is not prime", a rule for 6), with numbers not used in the sets.

### Depth (authored, claims shape, three or four cards)

Each has a claim and a reply to test, with a named misconception on every wrong option, and uses numbers the deck does not use elsewhere. Candidates: "1 is prime because it only divides by itself" (primes); "Every prime number is odd" (primes); "A number is divisible by 6 if it ends in 6", or "if either 2 or 3 goes in" (divisibility); "51 is prime because 3 does not go into 5 or 1" (divisibility, the digit-rule trap).

---

## Later, plan only: a Factors and Multiples tool (nothing is built for this now)

Harry's idea: a generator for factors, multiples, common factors and multiples, HCF and LCM. The next topic after this deck is factors and multiples, so a first small tool could serve it. How it could be done, in small steps. **None of this is in scope for the primes deck.**

**Where it sits.** A ToolShell tool in Number ("Factors & Multiples", `/factors-multiples`), registered `enabled: false` until ready, with `<Tool>.about.ts`, the `__test` export and calibration, like any tool (`docs/reference/toolshell.md`, `options-and-calibration.md`).

**Phase 1: two sub-tools only (the lower levels).**

| Sub-tool | Levels | What is asked |
|---|---|---|
| Factors | L1 list all factors of a number to 30 (as pairs); L2 to 100; L3 numbers with 8 or more factors, or "is n a factor of m" | Question Types pool: *List the factors*, *Factor pairs*, *Is it a factor?*, *How many factors?* |
| Multiples | L1 first five multiples (times tables to 10 × 10); L2 multiples between two bounds; L3 "is n a multiple of m" | Question Types pool: *List multiples*, *Is it a multiple?*, *Between* |

Both would use the **Number grid** from this deck as their picture (multiples on a 100 grid; factor pairs as a table) so the tool and the decks share one representation (`docs/reference/pictures.md`: pick a core representation first).

**Phase 2: common factors and multiples.** A tab for *common factors and HCF* (list both, circle the shared; L1 two numbers to 30) and one for *common multiples and LCM* (list until they meet; L1 numbers to 12). Working is the two lists side by side. Question Options: a Method pool (listing; later, prime factors). The HCF/LCM questions need answers that are not always the product (a test that counts the kinds over many questions, as the Ratio deck's checklist warns).

**Phase 3: prime factors.** Prime factorisation (factor tree or ladder), then HCF and LCM by prime factors and the Venn diagram. Existing assets: the `factorTree` and `primeVenn` Teach scenes and the `lcm` and `lcm-prime-factors` skills (Skill library, back-benched) hold the exemplar numbers and the stepping; both inform the working but are not reused as they stand.

**Deck support.** Once Phase 1 exists: a `Q.*` builder per question kind (so authored sets carry the tool's own working), a Depth bank (language: "factor" against "multiple", "1 is a factor of everything"), and generator and book slides for the factors and multiples deck. The primes deck's authored sets (conventions: ascending factor pairs, answers with the rule shown) are written so a later generator can match them.

**Possible small first use inside this deck (Harry, 2026-11-01; undecided):** a generator that asks "is X divisible by 2?", or a set that says "circle which of 2, 3, 5, 7, 11 this number is divisible by". It would be a Question Type in the first sub-tool, not a separate tool.

**Open questions for later.** Whether HCF and LCM are separate tools from factors and multiples (probably one tool with tabs for Y7 to 9, then a Y10 tab on prime factors); whether a Venn picture is a core representation; who owns the calibration.

---

## Decided with Harry (replies 1 and 2)

- The grid goes to 100 only. Cells are tapped; a click reveals the rest of a times table (tap the first five multiples of 2, then one click completes it).
- Primes get little independent practice; "show it is not prime" waits until after the rules. There should be Depth checks, and definition slides.
- Times tables to 10 × 10 are secure; factors and multiples are the next topic.

- **Starter:** Harry's own; not in the deck.
- **The rule for 7:** an extra (shown after 11, which is the stretch); built as slides, not required.
- **Year 9.** They say "a prime has only one factor" sometimes, but are good at "it only appears in its own times table": little uplift, so section 1 is short and the weight is on the rules.
- **Grid marks are scribbles in one colour per prime**, never coloured cells.
- **A Factors and Multiples generator** is a later project, planned above and not built.

## Still open

1. **"Make 7 slides"**: I read this as "build the rule-for-7 slides as an extra" (a divider, a board and Set G). Say if you meant seven slides, or something else.
2. **The ladders and traps** above (Sets A, C, D, E, F, G, and the Depth claims): are these what you would want asked?

## Steps once this is agreed

1. Build the Number grid piece (scribbles, tap, times-table fill, staged, Print) and the printable, with tests.
2. Write the sets from this plan and send you the **table** (rung, answer, trap, wrong-method result) before the deck is assembled.
3. Recompute every answer in the session by a different route (a script for the numeric sets).
4. Build the deck script, run `npm run deck -- verify <id>` and `--layout`, and show you.
