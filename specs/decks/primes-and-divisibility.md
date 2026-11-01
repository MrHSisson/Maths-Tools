# Lesson plan: Prime numbers and divisibility rules

**Status:** plan for review, revised after Harry's first reply (nothing built yet) · **Tool:** none (every question is authored) · **Class:** to confirm · **First test of the authoring routine** (`docs/design/DECK_BUILD_CHECKLIST.md`, "Authoring a question set")

**Objective:** find the primes up to 100 with the sieve of Eratosthenes and say why it works; use divisibility rules for 2, 3 and 5 (and 10) without dividing. **Stretch:** the rules for 11 and 7.

**Starting point:** secure on times tables up to 10 × 10 (so a "multiple" here just means "in a times table"). **Factors and multiples are the next topic**, so this lesson uses them lightly and does not teach finding every factor. Year group to confirm. Slips to plan for are in the traps tables below.

**Shape (decided with Harry):** little independent practice on primes themselves once the sieve has found them; the practice comes **after the divisibility rules**, where "show this is not prime" is a real use of the rules. Primes get definitions, discussion and Depth checks. One deck, about two lessons, picked up at the dividers (house style: `docs/design/LESSON_STYLE.md`). Calculators allowed, though none of this needs one. No Level labels on authored sets: difficulty is the ladder.

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

- A 1 to 100 grid in 10 columns, drawn on the slide. **Tap a cell** to mark it (cycle: clear, crossed out, circled, then a colour per prime). Tap works in the player and on a touch screen.
- **Reveal by times table:** a "multiples of" control (2, 3, 5, 7) fills in **the rest of a times table in one click**. So the teacher taps the first five multiples of 2 and then one click completes the 2 times table; marks already made by tapping are kept. The prime itself is circled and its other multiples crossed out.
- **Staged for the sieve:** the slide can also carry a prepared run of those fills (2, then 3, then 5, then 7), one per slide click, so the whole sieve can be shown with no tapping; Back undoes a click.
- Three states, as the board has: **Filled in** (the finished sieve), **Structure only** (numbers only, to sieve live; the default), **Blank** (an empty grid for pupils to write in).
- **Print:** a Print button in the player's top bar on any slide that has a grid, opening an A4 sheet with **two grids per page** (one to sieve, one to keep), through the shared `printables.ts` path (`hundredSquareSheet()`).
- Checks: a unit test that the sieve leaves exactly the 25 primes below 100, that tapping then filling a times table never un-marks a cell, and the print markup.

## Flow (about two lessons)

| # | Slide | Type |
|---|---|---|
| 1 | Title: Prime numbers and divisibility | Title |
| 2 | Objective and success criteria | Learning objective |
| 3 | **Starter:** times tables retrieval (5 quick questions, e.g. which tables is 24 in?) | Retrieval starter (grid) |
| 4 | **Section 1: Primes and the sieve** | Divider |
| 5 | Factor, multiple, prime, composite | Vocabulary |
| 6 | **A prime number** has exactly two factors: 1 and itself | Key definition |
| 7 | **A composite number** has more than two factors; 1 is neither | Key definition |
| 8 | Is 1 prime? (a claim to test) | Discussion |
| 9 | How many factors? 2 to 12 (short: factors are the next topic) | Board (Structure only) |
| 10 | Prime or composite? four small numbers | Quick grid |
| 11 | **The sieve of Eratosthenes:** tap, then reveal the times table | Number grid (tap + times-table fill) |
| 12 | Why can we stop sieving at 7? | Discussion |
| 13 | Sieve it yourself (printable) | Number grid (Structure only) with Print |
| 14 | Using the sieve: four questions (the primes between 10 and 30, how many under 50, twin primes) | Quick grid |
| 15 | **Depth:** two or three authored claims cards (is 1 prime; are all primes odd) | Depth |
| 16 | **Section 2: Divisibility rules** | Divider |
| 17 | Recap: four quick questions on the sieve and the times tables | Quick grid |
| 18 | **Divisible** means n goes into it exactly, with no remainder | Key definition |
| 19 | Rules for 2, 5 and 10: look at the last digit | Board (Structure only) |
| 20 | **Set C: 2, 5, 10** | Deliberate practice |
| 21 | The rule for 3: add the digits | Board (digit sum column) |
| 22 | Why the digit rule works | Discussion |
| 23 | **Set D: the rule for 3** | Deliberate practice |
| 24 | **Set E: choose the rule** (2, 3 or 5) and combining them (6, 15, 30) | Deliberate practice |
| 25 | Book work: 12 numbers, tick each rule that fits (copy into books) | Quick grid, 3 columns |
| 26 | **Depth:** one or two divisibility claims cards (6 needs 2 and 3; digit sums) | Depth |
| 27 | **Section 3: Using the rules on primes** | Divider |
| 28 | Is 51 prime? Test with the rules, worked on a board | Board |
| 29 | **Set A: prime or not?** (now with the rules) | Deliberate practice |
| 30 | **Stretch: 11 and 7** | Divider |
| 31 | Rule for 11: alternate add and subtract the digits | Board |
| 32 | **Set F: the rule for 11** | Deliberate practice |
| 33 | Rule for 7: double the last digit and subtract it from the rest (a procedure; see open question 1) | Board |
| 34 | **Set G: the rule for 7** | Deliberate practice |
| 35 | Exit ticket: 4 quick questions mixing the lesson | Quick grid |
| 36 | Summary | Summary |

Slide 25 is the take-home piece: copy-into-books, since a pinned worksheet needs a generator. There is deliberately **no prime-or-not set before the rules** (old Sets A and B are gone: Set A moves to slide 29 and the sieve questions become the quick grid on slide 14).

---

## The authored sets: ladder, traps, scale, conventions

**Conventions for the whole deck.**

- Factors are listed as ascending pairs: $1 \times 12$, $2 \times 6$, $3 \times 4$.
- Primes are listed in order with commas: 2, 3, 5, 7.
- A prime or not question's answer reads "Prime" or "Not prime" and the working gives the factor found that shows it ("$51 = 3 \times 17$").
- A divisibility answer reads "Yes" or "No", with the working showing the rule used: "$1 + 2 + 3 = 6$, and 6 is in the 3 times table, so yes".
- A digit sum is repeated until it is a number we know ("$99$: $9 + 9 = 18$, $1 + 8 = 9$"). Each working line is one mark.
- 1 is neither prime nor composite. 0 is not used.
- Numbers are written without commas below 10 000 and mostly stay below 1000, except where the rung needs more.

### Set A: prime or not? (5 to 7 questions; slide 29, after the rules)

The question is "Is it prime?" and the working uses the rules: "ends in 5, so 5 goes into it", "$5 + 1 = 6$, so 3 goes into it". Showing a number is prime means testing 2, 3, 5 and 7, which is why the sieve stops at 7.

| Rung | Question shape |
|---|---|
| 1 | Even, or ends in 5, so not prime by the first rule |
| 2 | Odd, digit sum a multiple of 3 (51, 57, 87), so not prime by the rule for 3 |
| 3 | A prime near 100 that passes the rules for 2, 3 and 5 (to show it is prime, also test 7) |
| 4 | A number that passes 2, 3 and 5 but is divisible by 7 (49, 77, 91): the rules so far are not enough |
| 5 | Edge cases at the end, one of each kind: 1 (neither) and 2 (the one even prime) |

**Traps.** "1 is prime." "2 is not prime because it is even." "Odd means prime" (9, 15, 21, 27, 33, 39). "Not in my times tables means prime" (51, 57, 87, 91). Each trap needs a question where the wrong thinking gives the wrong answer.

**Scale.** Numbers to 100 only, so the set agrees with the sieve; the rung 4 numbers are products of 7 within the 10 × 10 times tables.

### Using the sieve (quick grid, slide 14: 4 questions, not a set)

Read from the finished sieve: the primes between 10 and 30, how many primes under 50, and one clue question (a pair of primes that differ by 2: "twin primes"). No working beyond a line.

### Sets C, D, E: the rules for 2, 3, 5 (5 to 7 questions each)

| Set | Ladder |
|---|---|
| C: 2, 5, 10 | 1 a number that fails both; 2 ends in 0 (passes all three); 3 ends in 5 (5 only); 4 ends in an even digit that is not 0 (2 only); 5 a large number where only the last digit matters; 6 edge case: a number that *contains* even and 5 digits but ends differently (e.g. 523) |
| D: the rule for 3 | 1 a two-digit number with digit sum 3, 6, 9 or 12; 2 a two-digit number that fails; 3 a three-digit number; 4 a digit sum that needs a second step (99, 999); 5 a number with a zero in it (303, 1020); 6 edge case: a number that looks like it fits because of its last digit (e.g. 93 passes by digit sum, 94 does not, 36 and 63 are the same digits) |
| E: choose the rule | 1 one number, which of 2, 3, 5 divide it; 2 a number divisible by two of them; 3 a number divisible by all three (30, 60, 90 and then 120, 210); 4 combining: 6 is 2 and 3 (include 9 and 4 as traps); 5 find the missing digit (e.g. 4_6 is divisible by 3) |

**Traps.** "Divisible by 3 if the last digit is 3, 6 or 9." "Divisible by 2 if it ends in 2." "5 and 10 are the same rule." Not repeating a digit sum. A number divisible by 6 needs both 2 *and* 3, not just one.

**Scale.** Two and three digits, up to 4 digits on the last rung only.

### Sets F, G: the rule for 11, then 7 (stretch; 4 to 6 questions each)

| Set | Ladder |
|---|---|
| F: 11 | 1 two-digit repeated digits (33, 77); 2 a three-digit number divisible by 11 (alternating sum 0, e.g. 253); 3 one that fails; 4 alternating sum of 11 (e.g. 209: $2 - 0 + 9 = 11$); 5 four digits |
| G: 7 | 1 a two-digit multiple of 7 (use the rule: double the last digit, subtract from the rest); 2 a three-digit multiple of 7 needing one step; 3 a number that needs two steps; 4 one that fails; 5 the traps 91 and 119 which look prime |

**Traps.** Starting the alternating sum from the wrong end (it gives the same answer up to sign, which is worth saying). A result of 0 is divisible. A negative alternating sum still counts (-11). For 7, subtracting the wrong digit or forgetting to double.

### Starter, recaps and exit ticket (quick grids)

- **Starter (slide 3):** five times-table retrieval items, to 10 × 10 (which tables is 24 in, the 7 times table up to 70, is 56 a multiple of 8). Nothing on listing factors.
- **Recap (slide 17):** four items on the sieve and times tables, with numbers not used on slides 11 to 14.
- **Exit ticket (slide 35):** four items mixing the lesson (a rule for 3, a rule for 5, "is it prime", a Depth-style claim), with numbers not used in the sets.

### Depth (authored, claims shape, three or four cards)

Each has a claim and a reply to test, with a named misconception on every wrong option, and uses numbers the deck does not use elsewhere. Candidates: "1 is prime because it only divides by itself" (primes, slide 15); "Every prime number is odd" (slide 15); "A number is divisible by 6 if it ends in 6", or "if either 2 or 3 goes in" (slide 26); "51 is prime because 3 does not go into 5 or 1" (slide 26, the digit-rule trap).

---

## Decided with Harry (reply 1)

- The grid goes to 100 only. Cells are tapped; a click reveals the rest of a times table (tap the first five multiples of 2, then one click completes it).
- Primes get little independent practice; "show it is not prime" waits until after the rules. There should be Depth checks, and definition slides.
- Times tables to 10 × 10 are secure; factors and multiples are the next topic.

## Still open

1. **The rule for 7.** Keep as stretch, make it optional on its slide, or drop it? (11 can be shown with a pattern; 7 is a procedure that is hard to explain.)
2. **Year group**, and anything they usually say about primes that I should plan for.
3. **The ladders and traps** above (Sets A, C, D, E, F, G, and the Depth claims): are these what you would want asked?
4. **Marking colours:** one colour per prime on the grid (2 blue, 3 green, 5 orange, 7 purple), prime circled, multiples crossed. Right, or just crossed out?

## Steps once this is agreed

1. Build the Number grid piece and the printable (with tests).
2. Write the sets from this plan and send you the **table** (rung, answer, trap, wrong-method result) before the deck is assembled.
3. Recompute every answer in the session by a different route (a script for the numeric sets).
4. Build the deck script, run `npm run deck -- verify <id>` and `--layout`, and show you.
