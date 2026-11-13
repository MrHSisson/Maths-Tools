# Factors, common factors and HCF

**Status:** draft (revised after Harry's answers; nothing built yet)
**Class:** Set 6, low attainers · **Teaching time:** one lesson · **Calculator:** Casio fx-85
**Deck:** `factors-hcf-systematic-listing` · **Strand:** Number · **Tool:** none (every question is authored)

## Agreed approach (proposed)

Follows `multiples-systematic-listing`: systematic listing, hand-authored questions, no generator, no formula. Sequence as Harry set it: **list the factors of a number → find the common factors of two numbers → identify the HCF** (the highest of the common factors). Calculators are in pupils' hands, so the deck teaches exactly how to use one to find factors, with the key presses shown on the slide.

**The calculator method (taught explicitly, slide 3 to 5):**
1. A number is a factor if it divides exactly: type `n ÷ d =`. **A whole number on the display means d is a factor; anything else (a fraction such as 24/5 on the fx-85's natural display, or 4.8 after S⇔D) means it is not.**
2. Work through d = 1, 2, 3, ... in order. Each exact division gives a **pair**: d and the answer are both factors.
3. **Stop when the answer is smaller than the number you divided by** (24 ÷ 5 = 4.8 is smaller than 5, so stop). A repeated answer (36 ÷ 6 = 6) is written once.
4. To change the divisor without retyping, press the left arrow after `=` to bring the sum back and change the divisor (exact key wording to be checked against the pupils' fx-85 before building).
5. For common factors, list the smaller number's factors, then **test each on the other number** (18 ÷ 4 = 4.5, so 4 is not a common factor of 12 and 18).

Same house style as the multiples deck: no starter, no Level labels, worked numbers never reappear in a question of their own half, no pair repeats, every book answer is different, edge cases sit at the end. LCM is not taught, but the HCF discussion uses the common-multiple idea from last lesson as the trap.

## Teaching sequence

One lesson, so the plan is cut for pacing: **book sets are six questions (3 × 2), not nine**, the two models of the calculator method share one slide, and the HCF definition and model share one slide.

| # | Slide | Notes |
|---|---|---|
| 1 | Title | |
| 2 | Definition: factor | Divides exactly; always includes 1 and the number itself; contrast with a multiple (factors are finite, multiples never stop) |
| 3 | Calculator: is it a factor? | Keys for 24 ÷ 4 = 6 (whole: yes) and 24 ÷ 5 = 24/5 or 4.8 (not whole: no), revealed by click |
| 4 | Calculator: find all the factors of 24 | Structure-only board: divide by · display · whole? · pair. First row given (1 → 24), class fills the rest. Key point on the slide: stop when the answer is smaller than the number you divided by |
| 5 | Whiteboard x3 | Factors of 18, 20, 32 (answer shows the pairs and the ordered list) |
| 6 | Book work 3 × 2 | List all the factors, easiest first |
| 7 | Definition: common factor | A number that is a factor of both |
| 8 | Model: 12 and 18 | List both, circle 1, 2, 3, 6; calculator check on the smaller number's factors |
| 9 | Discussion | Kofi says the only common factor of 12 and 18 is 6. Key point: 1, 2 and 3 are too, and 1 is always a common factor |
| 10 | Whiteboard x3 | Common factors of 6 and 9, 10 and 15, 16 and 20 |
| 11 | Book work 3 × 2 | List all the common factors |
| 12 | Definition and model: highest common factor (HCF) | The largest of the common factors; the circled list from slide 8, pick the biggest: 6 |
| 13 | Discussion | Ruby says the HCF of 12 and 18 is 36. What did she find? (a common multiple.) A factor can never be bigger than the number |
| 14 | Whiteboard x3 | HCF of 9 and 12, 15 and 25, 20 and 30 |
| 15 | Book work 3 × 2 | Find the HCF |
| 16 | Exit ticket | See below |

If time runs short, the first cut is the discussion on slide 9 (keep slide 13), then the whiteboards on slide 10.

## Question ladder and checks

**Ladder:** whole numbers in the 10 to 50 range only. Listing: a small number with six factors (12), a square with three (25), a number that needs the stop rule (28), more factors (30), then a square with nine (36) and a prime (17) at the end. Common factors: the common set grows from two to four, with a coprime pair (14 and 15) at the end. HCF: each pair has a different answer, ending with a coprime pair (answer 1) and the largest pair (45 and 60).

**Traps** (each has a question where the wrong method gives a different, tempting answer):

| Trap | Where | Wrong-method result |
|---|---|---|
| Leaving out 1 and the number itself | list-1 to 3, book-1 to 6 | 18 listed as 2, 3, 6, 9 |
| Stopping too early (not reaching the pair partner) | list-3 (32), book-3 (28) | 32 listed as 1, 2, 4, 8 |
| Listing a multiple instead of a factor | book-4 (30), exit-1 | 30 listed as 30, 60, 90 |
| A square's middle factor written twice or missed | book-5 (36) | 1, 2, 3, 4, 6, 6, 9, ... |
| Giving only one common factor (the biggest, or the first) | cf-1 to 3, cfb-1 to 6 | 16 and 20: 4 only |
| Forgetting 1 is always a common factor | cfb-6 (14 and 15) | "no common factors" |
| HCF read as a common factor (not the highest) | hcf-1 to 3, hcfb-1 to 6 | 20 and 30: 5 or 2 |
| HCF confused with the common multiple from last lesson | slide 13 (12 and 18) | 36 instead of 6 |

**Conventions:** factors written in ascending order, separated by commas, starting 1; the two lists labelled; common factors circled; the HCF written as one number. Working lines match the multiples deck (two labelled lists, circle the match).

All answers below were recomputed by script (every factor list, every common set, every HCF; no pair repeated across the deck; the six HCF book answers are all different).

| Set | Task | Answer |
|---|---|---|
| list-1 | List the factors of 18 | 1, 2, 3, 6, 9, 18 |
| list-2 | List the factors of 20 | 1, 2, 4, 5, 10, 20 |
| list-3 | List the factors of 32 | 1, 2, 4, 8, 16, 32 |
| book-1 | Factors of 12 | 1, 2, 3, 4, 6, 12 |
| book-2 | Factors of 25 | 1, 5, 25 |
| book-3 | Factors of 28 | 1, 2, 4, 7, 14, 28 |
| book-4 | Factors of 30 | 1, 2, 3, 5, 6, 10, 15, 30 |
| book-5 | Factors of 36 | 1, 2, 3, 4, 6, 9, 12, 18, 36 |
| book-6 | Factors of 17 | 1, 17 |
| cf-1 | Common factors of 6 and 9 | 1, 3 |
| cf-2 | Common factors of 10 and 15 | 1, 5 |
| cf-3 | Common factors of 16 and 20 | 1, 2, 4 |
| cfb-1 | 4 and 6 | 1, 2 |
| cfb-2 | 8 and 20 | 1, 2, 4 |
| cfb-3 | 18 and 24 | 1, 2, 3, 6 |
| cfb-4 | 16 and 40 | 1, 2, 4, 8 |
| cfb-5 | 21 and 35 | 1, 7 |
| cfb-6 | 14 and 15 | 1 |
| hcf-1 | HCF of 9 and 12 | 3 |
| hcf-2 | HCF of 15 and 25 | 5 |
| hcf-3 | HCF of 20 and 30 | 10 |
| hcfb-1 | 6 and 8 | 2 |
| hcfb-2 | 12 and 16 | 4 |
| hcfb-3 | 18 and 27 | 9 |
| hcfb-4 | 28 and 42 | 14 |
| hcfb-5 | 14 and 25 | 1 |
| hcfb-6 | 45 and 60 | 15 |
| exit-1 | List the factors of 27 | 1, 3, 9, 27 |
| exit-2 | Common factors of 10 and 35 | 1, 5 |
| exit-3 | HCF of 16 and 36 | 4 |

Worked numbers: 24 (slide 4), 12 and 18 (slides 8 to 13, kept on purpose as one running example). 36 and 12 appear as numbers in other questions but never as a repeated pair.

## Decisions and what is still open

Decided by Harry: one lesson, Set 6 low attainers, Casio fx-85, book sets limited to about six for pacing.

Still to check before building: the exact fx-85 wording on slides 3 and 4. The natural display shows a non-whole answer as a fraction (24/5), so the slide says "a whole number means yes" and shows S⇔D for the decimal. The replay-key instruction depends on whether it is the GT Plus or the ClassWiz fx-85. Also: do the ladder, traps and numbers above look right?
