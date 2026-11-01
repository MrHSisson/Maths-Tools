# Primes and divisibility: the question sets, for review

**Status:** for Harry's review. Nothing here is in the deck yet; the deck is assembled once this is agreed. Plan: `specs/decks/primes-and-divisibility.md`.

**How these were checked** (`docs/design/DECK_BUILD_CHECKLIST.md`, "Authoring a question set"): every answer was recomputed by a different route from the one the working uses (brute-force division against the rule; the 11 and 7 rules followed down to a small number and compared with the division). Every digit sum, alternating sum and product in the working was recomputed. Every trap was checked to give a **different** answer from the right one. No number in a Depth card is used anywhere else in the deck.

**Conventions:** Yes / No answers show the rule used; a digit sum is added again only when it is over 30 (past the 10 × 10 tables); the alternating sum starts from the left (+, −, +, −); a negative result counts (−11 is a multiple of 11); for 7: double the last digit and subtract it from the rest. 1 is neither prime nor composite.

---

## The sets

### Set C: the rules for 2, 5 and 10 (slide: Set C)

| # | Question | Answer and working | Trap it targets | Wrong method gives |
|---|---|---|---|---|
| 1 | Which of 2, 5 and 10 does 47 divide by? | none of them | ends in 7: odd and not 0 or 5 |  |
| 2 | Which of 2, 5 and 10 does 120 divide by? | 2, 5 and 10 | ends in 0 passes all three |  |
| 3 | Which of 2, 5 and 10 does 85 divide by? | 5 only | 5 and 10 are the same rule | says 10 too |
| 4 | Which of 2, 5 and 10 does 346 divide by? | 2 only | last digit 6 is even but not 0 | says 10 too |
| 5 | Is 7 316 483 divisible by 5? | No | only the last digit matters |  |
| 6 | 523 has a 2 and a 5 in it. Is it divisible by 2? By 5? | neither | it contains a 2 and a 5 | says yes to 2 and 5 |

### Set D: the rule for 3

| # | Question | Answer and working | Trap it targets | Wrong method gives |
|---|---|---|---|---|
| 1 | Is 51 divisible by 3? Use the digit sum. | Yes (digit sum 6) | ends in 1, so the last digit says nothing | No |
| 2 | Is 74 divisible by 3? Use the digit sum. | No (digit sum 11) |  |  |
| 3 | Is 524 divisible by 3? Use the digit sum. | No (digit sum 11) |  |  |
| 4 | Is 8799 divisible by 3? Use the digit sum. | Yes (digit sum 33, then 6) | one digit sum is not enough |  |
| 5 | Is 1020 divisible by 3? Use the digit sum. | Yes (digit sum 3) | zeros add nothing | No |
| 6 | Is 173 divisible by 3? Use the digit sum. | No (digit sum 11) | ends in 3, so 'last digit 3' says yes | Yes |

### Set E: choose the rule, and combining (6)

| # | Question | Answer and working | Trap it targets | Wrong method gives |
|---|---|---|---|---|
| 1 | Which of 2, 3 and 5 does 60 divide by? | 2, 3 and 5 |  |  |
| 2 | Which of 2, 3 and 5 does 45 divide by? | 3 and 5 | 5 needs the last digit, not a 5 anywhere |  |
| 3 | Which of 2, 3 and 5 does 84 divide by? | 2 and 3 |  |  |
| 4 | Which of 2, 3 and 5 does 130 divide by? | 2 and 5 |  |  |
| 5 | Is 78 divisible by 6? Use the rules for 2 and 3. | Yes (even, and 7 + 8 = 15 is in the 3 table) |  |  |
| 6 | Is 93 divisible by 6? Use the rules for 2 and 3. | No (digit sum 12 fits 3, but 93 is odd) | 6 needs BOTH 2 and 3 | Yes |
| 7 | The number 4_6 is divisible by 3. What could the missing digit be? | 2, 5 or 8 (4 + _ + 6 = 12, 15 or 18) |  |  |

### Set A: prime or not? (after the rules)

| # | Question | Answer and working | Trap it targets | Wrong method gives |
|---|---|---|---|---|
| 1 | Is 85 prime? | Not prime: ends in 5, so 5 goes in (5 x 17) | odd means prime |  |
| 2 | Is 51 prime? | Not prime: digit sum 6, so 3 goes in (3 x 17) | not in my times tables means prime |  |
| 3 | Is 87 prime? | Not prime: digit sum 15, so 3 goes in (3 x 29) | not in my times tables means prime |  |
| 4 | Is 97 prime? | Prime: not even, digit sum 16, not 0 or 5, and 7 x 13 = 91 and 7 x 14 = 98 |  |  |
| 5 | Is 91 prime? | Not prime: passes 2, 3 and 5; 7 x 13 = 91 | the rules for 2, 3, 5 are not enough |  |
| 6 | Is 1 prime? | Not prime (and not composite): it has only one factor | 1 is prime |  |
| 7 | Is 2 prime? | Prime: its factors are 1 and 2. It is the only even prime | 2 is not prime because it is even |  |

### Set F: the rule for 11 (stretch)

| # | Question | Answer and working | Trap it targets | Wrong method gives |
|---|---|---|---|---|
| 1 | Is 44 divisible by 11? Use the alternating sum. | Yes (alternating sum 0) |  |  |
| 2 | Is 253 divisible by 11? Use the alternating sum. | Yes (alternating sum 0) | result 0 means yes |  |
| 3 | Is 134 divisible by 11? Use the alternating sum. | No (alternating sum 2) |  |  |
| 4 | Is 209 divisible by 11? Use the alternating sum. | Yes (alternating sum 11) | result 11 means yes |  |
| 5 | Is 3817 divisible by 11? Use the alternating sum. | Yes (alternating sum -11) | a negative result (-11) still means yes |  |
| 6 | Is 5128 divisible by 11? Use the alternating sum. | No (alternating sum -2) | a negative result (-2) is not a multiple of 11 |  |

### Set G: the rule for 7 (an extra)

| # | Question | Answer and working | Trap it targets | Wrong method gives |
|---|---|---|---|---|
| 1 | Is 63 divisible by 7? Double the last digit and subtract it. | Yes (6 - 6 = 0) |  |  |
| 2 | Is 203 divisible by 7? Double the last digit and subtract it. | Yes (20 - 6 = 14, in the 7 table) |  |  |
| 3 | Is 95 divisible by 7? Double the last digit and subtract it. | No (9 - 10 = -1) |  |  |
| 4 | Is 1295 divisible by 7? Double the last digit and subtract it. | Yes (129 - 10 = 119, then 11 - 18 = -7) | two steps needed |  |
| 5 | Is 119 divisible by 7? Double the last digit and subtract it. | Yes (11 - 18 = -7) | 119 looks prime: 7 x 17 |  |
| 6 | Is 2468 divisible by 7? Double the last digit and subtract it. | No (246 - 16 = 230, then 23 - 0 = 23) |  |  |

### Quick grid: using the sieve (4)

| # | Question | Answer |
|---|---|---|
| 1 | Which are the primes between 10 and 30? | 11, 13, 17, 19, 23, 29 |
| 2 | How many primes are there below 50? | 15 |
| 3 | Two primes between 40 and 50 differ by 2. Which? | 41 and 43 |
| 4 | How many primes are there below 100? | 25 |

### Quick grid: recap (4)

| # | Question | Answer |
|---|---|---|
| 1 | Which prime number is even? | 2 |
| 2 | Which times table crosses out 49 in the sieve? | 7 (7 x 7) |
| 3 | Write the first five multiples of 6. | 6, 12, 18, 24, 30 |
| 4 | How many primes are below 10? | 4 (2, 3, 5, 7) |

### Quick grid: exit ticket (4)

| # | Question | Answer |
|---|---|---|
| 1 | Is 135 divisible by 3? | Yes (1 + 3 + 5 = 9) |
| 2 | Is 2346 divisible by 5? | No (ends in 6) |
| 3 | Is 83 prime? | Prime (not 2, 3, 5 or 7) |
| 4 | Is 132 divisible by 6? | Yes (even, and 1 + 3 + 2 = 6) |

### Book work: which of 2, 3 and 5 does each number divide by? (12, three columns)

| # | Question | Answer |
|---|---|---|
| 1 | Which of 2, 3 and 5 does 36 divide by? | 2 and 3 |
| 2 | Which of 2, 3 and 5 does 77 divide by? | none of them |
| 3 | Which of 2, 3 and 5 does 70 divide by? | 2 and 5 |
| 4 | Which of 2, 3 and 5 does 124 divide by? | 2 |
| 5 | Which of 2, 3 and 5 does 135 divide by? | 3 and 5 |
| 6 | Which of 2, 3 and 5 does 210 divide by? | 2, 3 and 5 |
| 7 | Which of 2, 3 and 5 does 255 divide by? | 3 and 5 |
| 8 | Which of 2, 3 and 5 does 368 divide by? | 2 |
| 9 | Which of 2, 3 and 5 does 441 divide by? | 3 |
| 10 | Which of 2, 3 and 5 does 500 divide by? | 2 and 5 |
| 11 | Which of 2, 3 and 5 does 623 divide by? | none of them |
| 12 | Which of 2, 3 and 5 does 114 divide by? | 2 and 3 |

---

## The other content

### Boards (Structure only: the left column shows, the class fills the rest)

| Slide | Columns | Rows |
|---|---|---|
| How many factors? | Number · Factors · How many · Prime? | 2 (1, 2; 2; yes) · 3 (1, 3; 2; yes) · 4 (1, 2, 4; 3; no) · 5 · 6 (1, 2, 3, 6; 4; no) · 7 · 8 (4; no) · 9 (1, 3, 9; 3; no) · 10 (4; no) · 11 · 12 (1, 2, 3, 4, 6, 12; 6; no) |
| Rules for 2, 5 and 10 | Number · Last digit · 2? · 5? · 10? | 30 (all) · 65 (5) · 98 (2) · 115 (5) · 240 (all) · 37 (none) |
| The rule for 3 | Number · Digit sum · In the 3 table? · Divisible by 3? | 24 (6, yes) · 52 (7, no) · 123 (6, yes) · 400 (4, no) · 711 (9, yes) · 836 (17, no) |
| Is 39 prime? | Test · Does 39 fit? · Because | Even? no (ends in 9) · Ends in 0 or 5? no · Digit sum in the 3 table? yes (3 + 9 = 12) · So 39 is not prime (3 × 13) |
| The rule for 11 | Number · Alternating sum · Divisible by 11? | 132 (0, yes) · 143 (0, yes) · 163 (−2, no) · 319 (11, yes) · 2728 (−11, yes) |
| The rule for 7 (extra) | Number · Last digit doubled · Rest − doubled · Divisible by 7? | 35 (10; −7; yes) · 74 (8; −1; no) · 161 (2; 14; yes) · 392 (4; 35; yes) |

### Discussions (prompt · key point · question · answer)

1. **"Only one factor"** (after the definitions): *Mei says "a prime number is a number with only one factor." What do you think?* Key point: *A prime has exactly two factors: 1 and itself. The number 1 has only one factor, so it is not prime.* Question: *Is 1 prime?* Answer: *No: it has one factor, not two.*
2. **Why stop at 7?**: *To find the primes up to 100 we sieve with 2, 3, 5 and 7, and then stop. Why can we stop?* Key point: *The next prime is 11. Its smaller multiples (22, 33, 44 …) were already crossed out by smaller primes, and 11 × 11 = 121 is past 100.* Question: *What is the first number 7 crosses out that 2, 3 and 5 have not?* Answer: *49 (7 × 7).*
3. **Why the digit rule works**: *10 is 9 + 1, 100 is 99 + 1, 1000 is 999 + 1. What remainder does 100 leave when divided by 3?* Key point: *Each place value is one more than a number in the 3 times table, so a digit counts only for itself: add the digits and see if that is in the 3 table.* Question: *What remainder does 100 leave when divided by 3?* Answer: *1.*

### Definitions

- **Prime number:** a number with exactly two factors: 1 and itself.
- **Composite number:** a number with more than two factors. 1 is neither prime nor composite.
- **Divisible:** a number is divisible by n if n goes into it exactly, with no remainder.
- **Vocabulary slide:** factor, multiple, prime, composite.

### Depth cards (authored claims cards; numbers not used elsewhere)

| Slide | Claims | Answer | The wrong options show |
|---|---|---|---|
| Primes | **Mei:** "All prime numbers are odd." **Ben:** "2 is prime, and it is even." Who is right? | Ben (2 has exactly two factors, 1 and 2) | Mei: thinks primes cannot be even because most are odd. Both right: thinks a number cannot be both |
| Primes | **Amara:** "121 is prime: it is not in the 2, 3, 5 or 7 times tables." **Leo:** "121 is not prime: 11 × 11 = 121." Who is right? | Leo (the sieve to 100 stops at 7 only because 11 × 11 is already past 100) | Amara: thinks passing the tests up to 7 always means prime |
| Divisibility | **Priya:** "A number is divisible by 6 if it ends in an even digit or has a digit sum in the 3 table." **Jamal:** "It must pass both the rule for 2 and the rule for 3." Use 9 and 14. Who is right? | Jamal (9 passes only 3, 14 passes only 2, and neither is divisible by 6) | Priya: thinks either rule is enough |
| Divisibility | **Jamal:** "133 is divisible by 3 because it ends in 3." **Ruby:** "133 is not divisible by 3: 1 + 3 + 3 = 7, which is not in the 3 table." Who is right? | Ruby (133 = 7 × 19) | Jamal: uses the last digit for the rule for 3 |

## Open points for you

1. **Is anything here too hard or too easy for Y9?** Set C and the book work are the easiest; Set F (a four-digit number with a negative alternating sum) and Set G rung 4 (two steps) are the hardest.
2. **Set C has repeated answers** ("2 only", "5 only") because there are only four possible answers to "which of 2, 5 and 10". It uses a Yes / No question for rung 5 to break that up. OK?
3. **The book work** is "which of 2, 3 and 5 does N divide by?", not "tick the rules". Right?
