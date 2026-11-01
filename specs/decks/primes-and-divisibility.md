# Lesson plan: Prime numbers and divisibility rules

**Status:** plan for review (nothing built yet) · **Tool:** none (every question is authored) · **Class:** to confirm · **First test of the authoring routine** (`docs/design/DECK_BUILD_CHECKLIST.md`, "Authoring a question set")

**Objective:** find the primes up to 100 with the sieve of Eratosthenes and say why it works; use divisibility rules for 2, 3 and 5 (and 10) without dividing. **Stretch:** the rules for 11 and 7.

**Starting point (to confirm):** they know the times tables, factors and multiples. Slips to plan for are in the traps tables below.

**Shape:** one deck, about two lessons, picked up at the dividers (house style: `docs/design/LESSON_STYLE.md`). Calculators allowed, though none of this needs one. No Level labels on authored sets: difficulty is the ladder.

---

## What already exists, and what does not

| Need | Exists? | Plan |
|---|---|---|
| A generator for primes or divisibility | **No** | Every question is authored. No generator slides, no generator book activities, no pinned worksheets (those are generator-based). Say if you want a tool built later. |
| A 100 grid on a slide to sieve live | **No** (boards are tables; the ratio table and bar model are the only pictures) | **Build a "Number grid" slide piece** (side task done as part of this deck, below) |
| A printable 100 grid | **No** (`printables.ts` has sheets for tools; a deck can only print pinned worksheets) | **Build the printable**, and a Print button on the Number grid slide |
| Depth cards | **No bank** for this topic | Author two or three Depth-shaped slides in the deck (editable copies; see decision 3) |
| Teach scenes `factorTree`, `primeVenn` | Yes, but the Teach tab is being retired | Not used |

## Slide piece to build: Number grid

- A 1 to 100 grid drawn on the slide in 10 columns. Cells can be **crossed out**, **circled**, or **filled in a colour**, by clicking a cell (cycle: clear, crossed, colour 1, colour 2 …).
- **Staged for the sieve:** the slide's clicks reveal the marks in order (cross out 1; circle 2 and cross out its multiples; and so on), driven by the existing `step` clicks, with Back undoing a click.
- Three states, as the board has: **Filled in** (the finished sieve), **Structure only** (numbers only, to sieve live), **Blank** (an empty grid, numbers hidden, for pupils to write in).
- **Print:** a Print button in the player's top bar on any slide that has a grid, opening an A4 sheet with **two grids per page** (one to sieve, one to keep), through the shared `printables.ts` path. A `hundredSquareSheet()` printable, so it is also available from any tool page that wants it.
- Checks: a unit test for the sieve marks (the primes it leaves are exactly the 25 primes below 100) and the print markup.

## Flow (about two lessons)

| # | Slide | Type |
|---|---|---|
| 1 | Title: Prime numbers and divisibility | Title |
| 2 | Objective and success criteria | Learning objective |
| 3 | **Starter:** factors and multiples recap (5 quick questions) | Retrieval starter (grid) |
| 4 | **Section 1: Primes and the sieve** | Divider |
| 5 | Factor, multiple, prime, composite | Vocabulary |
| 6 | A prime number has exactly two factors: 1 and itself | Key definition |
| 7 | Is 1 prime? (a claim to test) | Discussion |
| 8 | Factors of 2 to 12: how many factors each has, which are prime | Board (Structure only) |
| 9 | **Set A: prime or not?** | Deliberate practice |
| 10 | **The sieve of Eratosthenes**, built click by click | Number grid (staged) |
| 11 | Why can we stop sieving at 7? | Discussion |
| 12 | Sieve it yourself: the printable grid | Number grid (Structure only) with Print |
| 13 | **Set B: using the sieve** | Deliberate practice |
| 14 | Depth: two or three authored cards (is 1 prime; are all primes odd; a number that looks prime) | Depth |
| 15 | **Section 2: Divisibility rules** | Divider (recap of four quick questions on the next slide) |
| 16 | Recap: four quick questions on primes | Quick grid |
| 17 | Rules for 2, 5 and 10: look at the last digit | Board (Structure only) |
| 18 | **Set C: 2, 5, 10** | Deliberate practice |
| 19 | The rule for 3: add the digits | Board (digit sum column) |
| 20 | Why the digit rule works (discussion: 3 + 0 = 3, but 30 is it? pattern in 3, 6, 9, 12 …) | Discussion |
| 21 | **Set D: the rule for 3** | Deliberate practice |
| 22 | **Set E: choose the rule** (2, 3 or 5) and combining them (6, 15, 30) | Deliberate practice |
| 23 | Book work: 12 numbers, tick every number in the row each rule fits (copy into books) | Quick grid, 3 columns |
| 24 | **Stretch: 11 and 7** | Divider |
| 25 | Rule for 11: alternate add and subtract the digits | Board |
| 26 | **Set F: the rule for 11** | Deliberate practice |
| 27 | Rule for 7: double the last digit and subtract it from the rest (a procedure; see decision 4) | Board |
| 28 | **Set G: the rule for 7** | Deliberate practice |
| 29 | Exit ticket: 4 quick questions mixing the lesson | Quick grid |
| 30 | Summary | Summary |

Decks for this style are 30 to 45 slides, so this is on the short side by design. Slide 23 is the take-home piece: a copy-into-books activity, since a pinned worksheet needs a generator.

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

### Set A: prime or not? (5 to 7 questions)

| Rung | Question shape |
|---|---|
| 1 | A small number with an obvious factor (even, or ends in 5) |
| 2 | A small prime that is odd and not in the usual lists |
| 3 | A two-digit odd number that looks prime and is not (3 or 7 as the hidden factor) |
| 4 | A number whose smallest factor is 7 or 11 |
| 5 | Edge case at the end: 1 (and 2, the one even prime), one of each kind |

**Traps.** "1 is prime." "2 is not prime because it is even" (or "all primes are odd"). "Odd means prime" (so 9, 15, 21, 27, 33, 39). "Not in my times tables means prime" (so 51, 57, 87, 91). Each trap needs a question where the wrong thinking gives the wrong answer.

**Scale.** Mostly 2 to 100 here so Set B and the sieve agree; one or two in the 100s for the last rungs.

### Set B: using the sieve (5 to 7 questions)

| Rung | Question shape |
|---|---|
| 1 | List the primes in a given short interval from the finished sieve (10 to 30) |
| 2 | How many primes are there under 50 (and under 100) |
| 3 | Find the pair of primes that fit a clue (differ by 2: "twin"; a prime between 90 and 100) |
| 4 | Say what the sieve would cross out next (e.g. "the next multiple of 3 not yet crossed") and why it was already crossed |
| 5 | Why 49 is crossed out only when we reach 7 |

**Traps.** Crossing out the prime itself with its multiples; forgetting that 1 is crossed out first; thinking the sieve has to go beyond 7 for 100.

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

### Starter, recap and exit ticket (quick grids)

Starter: five retrieval items (factor, multiple, "is 15 in the 3 times table", list the factors of 12, one prime you know). Recap (slide 16) and exit ticket (slide 29) are four items each, drawn from sets A, B, D, E, with different numbers from the sets themselves.

### Depth (authored, two or three cards)

Claims shape, with the claim and a correct reply. Candidates: "1 is prime because it only divides by itself" (Ruby), "Every prime number is odd" (Kofi), "51 is prime because 3 does not go into 5 or 1 as a last digit" (a trap on the digit rule). Numbers not used elsewhere in the deck.

---

## Decisions I need from you

1. **The Number grid piece.** OK to build it as described (click to cross out, circle, colour; staged by click; Filled in / Structure only / Blank; Print with two grids per A4)? Anything to add (a 120 grid, a 2 to 100 grid without 1)?
2. **No generators.** All practice is authored, and the take-home piece is copy-into-books on slide 23 rather than a pinned worksheet. Right, or do you want a Prime or not tool built so the deck can have general practice and worksheets?
3. **Depth.** Two or three authored claims cards in the deck (editable copies), not a Depth bank for a tool. OK?
4. **7 and 11.** Both as stretch, 11 first. The rule for 7 is a procedure that is hard to explain (11 can be shown with the alternating sum pattern). Keep 7 as stretch, make it optional on the slide, or drop it?
5. **The class and the starting point.** Which year, and are they secure on factors and multiples? That sets the starter and the first rung of Set A.
6. **Also confirm** that 0 is never used, 1 is neither prime nor composite, and the ladders and traps above are what you would want asked.

## Steps once this is agreed

1. Build the Number grid piece and the printable (with tests).
2. Write the sets from this plan and send you the **table** (rung, answer, trap, wrong-method result) before the deck is assembled.
3. Recompute every answer in the session by a different route (a script for the numeric sets).
4. Build the deck script, run `npm run deck -- verify <id>` and `--layout`, and show you.
