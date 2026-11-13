# Factors, common factors and HCF

**Status:** implemented (deck `src/decks/data/factors-hcf-systematic-listing.json`, 16 slides, built 2026-11-13; awaiting Harry's visual check)
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
| 5 | Whiteboard x3 | Factors of 48 (pairs partly completed, partners blank), 60 (three pairs given and "3 more pairs" as `__ × __`) and **30 with no scaffold**. The answer shows the full pairs and the ordered list |
| 6 | Book work 3 × 2 | List all the factors, scaffold weaning off: questions 1-2 partly completed pairs, 3-4 two pairs given and a count of the rest, 5-6 only a hint of how many pairs |
| 7 | Definition: common factor | A number that is a factor of both |
| 8 | Model: 12 and 18 | List both, circle 1, 2, 3, 6; calculator check on the smaller number's factors |
| 9 | Discussion | Kofi says the only common factor of 12 and 18 is 6. Key point: 1, 2 and 3 are too, and 1 is always a common factor |
| 10 | Whiteboard x3 | Common factors of 24 and 36 (both lists partly completed), 40 and 56 (hint: 4 common factors) and **20 and 30 with no scaffold** |
| 11 | Book work 3 × 2 | List all the common factors; questions 1-2 partly completed lists, 3-4 a hint of how many common factors, 5-6 no help |
| 12 | Definition and model: highest common factor (HCF) | The largest of the common factors; the circled list from slide 8, pick the biggest: 6 |
| 13 | Discussion | Ruby says the HCF of 12 and 18 is 36. What did she find? (a common multiple.) A factor can never be bigger than the number |
| 14 | Whiteboard x3 | HCF of 32 and 48 (both lists partly completed), 36 and 54 (hint: 6 common factors) and **18 and 30 with no scaffold** |
| 15 | Book work 3 × 2 | Find the HCF; questions 1-2 partly completed lists, 3-4 a hint of how many common factors, 5-6 no help |
| 16 | Exit ticket | See below |

**Scaffolding, and weaning it off (decided with Harry).** Whiteboard numbers are bigger than the book numbers so a factor is not seen at a glance (small numbers let pupils skip the process). Early on, most of the working is given so pupils still run the calculator method without spending forever on it; the support is then taken away, in the same order in every section: a whiteboard set goes *partly completed, then a count or hint, then no scaffold* (the last whiteboard uses a friendly number, such as 30), and each six-question book set goes *two partly completed, two with a count, two with only a hint (or nothing)*. Confidence is built at the start, and by the end of the deck pupils work unaided. Scaffold forms:

- **Partly completed:** pairs shown as `1 × 48, 2 × 24, 3 × __, ...` with the partner left blank (factor lists with a few numbers blanked for common factors and HCF).
- **Pairs and a count:** two pairs given, then `__ × __` once for each pair still to find, with the number of missing pairs written on the slide.
- **Hint:** one line saying how many factor pairs the number has (or how many common factors).
- **No scaffold:** the number and the instruction only.

The full method is shown on the worked slides (4, 8, 12) and in each whiteboard's answer.

If time runs short, the first cut is the discussion on slide 9 (keep slide 13), then the whiteboards on slide 10.

## Question ladder and checks

**Ladder:** two things climb together: the numbers (whiteboards use 30 to 72, book sets 36 to 80 for listing and 12 to 75 for common factors and HCF) and the support falling away (see "Scaffolding, and weaning it off"). Listing book set: 40 and 56 (partly completed), 42 and 80 (two pairs and a count), 36 (square) and 70 (hint only). Common factors: the common set size varies from 1 to 6, with a coprime pair (14 and 15, no scaffold) last. HCF: every book answer is different, ending with a coprime pair (answer 1) and 45 and 75 (answer 15).

**Traps** (each has a question where the wrong method gives a different, tempting answer):

| Trap | Where | Wrong-method result |
|---|---|---|
| Leaving out 1 and the number itself | list-1 to 3, book-1 to 6 | 30 listed as 2, 3, 5, 6, 10, 15 |
| Stopping too early (not reaching the pair partner) | list-2 (60), book-4 (80) | 80 listed as 1, 2, 4, 5, 8, 10 |
| Assuming a factor in a gap without testing it (or skipping a divisor) | list-1 (5 and 7 for 48), book-1 (3 for 40) | 5 added to the factors of 48 |
| Listing a multiple instead of a factor | list-3 (30), exit-1 | 30 listed as 30, 60, 90 |
| A square's middle factor written twice or missed | book-5 (36) | 1, 2, 3, 4, 6, 6, 9, ... |
| Giving only one common factor (the biggest, or the first) | cf-1 to 3, cfb-1 to 6 | 20 and 30: 10 only |
| Forgetting 1 is always a common factor | cfb-6 (14 and 15) | "no common factors" |
| HCF read as a common factor (not the highest) | hcf-1 to 3, hcfb-1 to 6 | 18 and 30: 3 or 2 |
| HCF confused with the common multiple from last lesson | slide 13 (12 and 18) | 36 instead of 6 |

**Conventions:** factors written in ascending order, separated by commas, starting 1; the two lists labelled; common factors circled; the HCF written as one number. Working lines match the multiples deck (two labelled lists, circle the match).

All answers below were recomputed by script (every factor list, every common set, every HCF; no pair repeated across the deck; the six HCF book answers are all different (10, 9, 12, 5, 1, 15), and the stated counts of pairs and common factors).

| Set | Task | Answer |
| --- | --- | --- |
| list-1 | Factors of 48. Given: 1 × 48, 2 × 24, 3 × __, 4 × 12, 6 × __ | 3 × 16, 6 × 8; 5 and 7 are not factors (9.6, 6.86); 1, 2, 3, 4, 6, 8, 12, 16, 24, 48 |
| list-2 | Factors of 60. Given: 1 × 60, 2 × 30, 3 × 20, then `__ × __` three more times (3 more pairs) | 4 × 15, 5 × 12, 6 × 10; 7 (8.57) is not, 8 (7.5 is smaller than 8) stop; 1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60 |
| list-3 | Factors of 30 (no scaffold) | 1, 2, 3, 5, 6, 10, 15, 30 |
| book-1 | Factors of 40. Given: 1 × 40, 2 × 20, 4 × __, 5 × __ | 4 × 10, 5 × 8; 3 is not a factor (13.3); 1, 2, 4, 5, 8, 10, 20, 40 |
| book-2 | Factors of 56. Given: 1 × 56, 2 × __, 4 × 14, 7 × __ | 2 × 28, 7 × 8; 3, 5, 6 are not factors; 1, 2, 4, 7, 8, 14, 28, 56 |
| book-3 | Factors of 42. Given: 1 × 42, 2 × 21, then `__ × __` twice (2 more pairs) | 3 × 14, 6 × 7; 1, 2, 3, 6, 7, 14, 21, 42 |
| book-4 | Factors of 80. Given: 1 × 80, 2 × 40, then `__ × __` three times (3 more pairs) | 4 × 20, 5 × 16, 8 × 10; 1, 2, 4, 5, 8, 10, 16, 20, 40, 80 |
| book-5 | Factors of 36. Hint: 5 factor pairs | 1 × 36, 2 × 18, 3 × 12, 4 × 9, 6 × 6; 1, 2, 3, 4, 6, 9, 12, 18, 36 |
| book-6 | Factors of 70. Hint: 4 factor pairs | 1 × 70, 2 × 35, 5 × 14, 7 × 10; 1, 2, 5, 7, 10, 14, 35, 70 |
| cf-1 | Common factors of 24 and 36. Given: 24: 1, 2, 3, 4, __, 8, __, 24; 36: 1, 2, 3, __, 6, 9, 12, __, 36 | Blanks 6, 12 and 4, 18; common: 1, 2, 3, 4, 6, 12 |
| cf-2 | Common factors of 40 and 56. Hint: 4 common factors | 40: 1, 2, 4, 5, 8, 10, 20, 40; 56: 1, 2, 4, 7, 8, 14, 28, 56; common: 1, 2, 4, 8 |
| cf-3 | Common factors of 20 and 30 (no scaffold) | 1, 2, 5, 10 |
| cfb-1 | 18 and 27. Given: 18: 1, 2, __, 6, __, 18; 27: 1, __, 9, 27 | Blanks 3, 9 and 3; common: 1, 3, 9 |
| cfb-2 | 28 and 42. Given: 28: 1, 2, __, 7, __, 28; 42: 1, 2, 3, __, 7, __, 21, 42 | Blanks 4, 14 and 6, 14; common: 1, 2, 7, 14 |
| cfb-3 | 16 and 40. Hint: 4 common factors | 1, 2, 4, 8 |
| cfb-4 | 21 and 35. Hint: 2 common factors | 1, 7 |
| cfb-5 | 12 and 30 (no scaffold) | 1, 2, 3, 6 |
| cfb-6 | 14 and 15 (no scaffold) | 1 |
| hcf-1 | HCF of 32 and 48. Given: 32: 1, 2, __, 8, __, 32; 48: 1, 2, 3, __, 6, 8, __, 16, 24, 48 | Blanks 4, 16 and 4, 12; common: 1, 2, 4, 8, 16; HCF 16 |
| hcf-2 | HCF of 36 and 54. Hint: 6 common factors | Common: 1, 2, 3, 6, 9, 18; HCF 18 |
| hcf-3 | HCF of 18 and 30 (no scaffold) | Common: 1, 2, 3, 6; HCF 6 |
| hcfb-1 | 20 and 50. Given: 20: 1, 2, __, 5, __, 20; 50: 1, 2, 5, __, 25, 50 | Blanks 4, 10 and 10; common: 1, 2, 5, 10; HCF 10 |
| hcfb-2 | 27 and 36. Given: 27: 1, __, 9, 27; 36: 1, 2, 3, __, 6, 9, __, 18, 36 | Blanks 3 and 4, 12; common: 1, 3, 9; HCF 9 |
| hcfb-3 | 24 and 60. Hint: 6 common factors | Common: 1, 2, 3, 4, 6, 12; HCF 12 |
| hcfb-4 | 15 and 40. Hint: 2 common factors | Common: 1, 5; HCF 5 |
| hcfb-5 | 14 and 25 (no scaffold) | Common: 1; HCF 1 |
| hcfb-6 | 45 and 75 (no scaffold) | Common: 1, 3, 5, 15; HCF 15 |
| exit-1 | List the factors of 27 | 1, 3, 9, 27 |
| exit-2 | Common factors of 10 and 35 | 1, 5 |
| exit-3 | HCF of 16 and 36 | 4 |

The 'Given' text is exactly what appears on the slide, and the answer slide fills every blank. Worked numbers: 24 (slide 4), 12 and 18 (slides 8 to 13, kept on purpose as one running example). 36 and 12 appear as numbers in other questions but never as a repeated pair.

## Decisions and what is still open

Decided by Harry: one lesson, Set 6 low attainers, Casio fx-85, book sets limited to about six for pacing, bigger whiteboard numbers with partly completed working, and scaffolding weaned off through each set and through the deck (a final unscaffolded whiteboard with a friendly number such as 30).

Calculator confirmed: Casio fx-85GT CW (ClassWiz). Its natural display shows a non-whole answer as a fraction (24/5), so slides 3 and 4 say "a whole number means yes" and show S⇔D for the decimal. The replay-key wording is to be checked on a real calculator. Also: do the ladder, traps and numbers above look right?
