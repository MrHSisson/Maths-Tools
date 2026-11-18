# Lesson plan: Prime factorisation with factor trees (and index form)

**Status:** plan for review, updated for one deck in one go (nothing built) · **Deck id:** `prime-factor-trees` · **Strand:** Number · **Tool:** none (every question is authored; no generator)
**Follows:** Harry's LCM and HCF lesson. **Banked as:** "Prime factorisation lesson (factor trees)" in `docs/TASKS.md`.
**Class:** weak group; **weak on times tables**; **no calculators** (decided in the request). Check the profile below.

**Objective:** draw a factor tree for a number, circling each prime as it appears, until every branch ends in a circled prime; write the number as a product of primes; then write that product in index form (for example $2 \times 2 \times 3 = 2^2 \times 3$).

**Not in this lesson:** using the trees for HCF or LCM (the natural next lesson), and divisibility-rule tricks beyond a one-line hint.

---

## Decisions I have made (shout if wrong)

1. **One deck, aimed at one lesson, built in one go (decided with Harry).** The aim is ambitious for this group, so every slide is tagged **Core** (the lesson), **If time** (drop freely) or **Overflow** (the natural start of the next lesson). Dividers are the pick-up points, so if the class only reaches index form the deck simply carries on next time; nothing is a separate deck. Index form keeps its own section and slow build, because that is the stated weak spot.
2. **Numbers are chosen so that no times table above 10 × 10 is needed, and the first split of every number uses the 2, 3, 5 or 10 times table.** A 7 or 11 only ever turns up as an end prime. No calculator is ever needed (the largest numbers are 120 and 200, built from 10 ×).
3. **Any split is allowed** (12 as 2 × 6 or 3 × 4 gives the same primes). We teach "split into two numbers from a times table you know". The discussion slide shows two different trees for the same number reaching the same primes.
4. **A permanent "Primes to 20" strip** (2 3 5 7 11 13 17 19) sits on every tree slide, so "is it prime?" is a look-up, not a worry.
5. **Circle the prime the moment you see it** (that branch stops). Circles are in the prime's own colour, the same colours as the number grid (2 blue, 3 green, 5 orange, 7 purple; others a neutral dark ring), so the pupils *see* the three blue 2s before they are asked to count them. This is the bridge to index form.
6. **Index form is taught as counting, in a tally table:** prime · how many · index form. Only after that does the shorthand appear.
7. **One new slide piece is needed: a Factor tree** (below). It is the one real build in this plan.

---

## What already exists, and what does not

| Need | Exists? | Plan |
|---|---|---|
| A generator for prime factorisation | **No** | Every question is authored. No generator slides, no pinned worksheets (those need a generator). Say if you want a tool built later. |
| A factor tree as a slide piece | **No.** The deck model has text, shapes, lines, ratio table, bar model, board, number grid. Slide pieces list "prime factor tiles" as not built. A `factorTree` exists only in the retiring Teach scenes. | **Build a "Factor tree" slide piece** (next section). Fallback if you would rather not: draw each tree on a Blank slide from circles and lines. It works but is fiddly to build and edit, has no fill modes and cannot reveal a split per click. |
| Fixed question slides that show a tree | **No** (fixed questions cannot hold a picture) | Practice is "tree whiteboards": the number is the question, the tree is the answer, revealed a split per click (same idea as `S.whiteboard`). Book work is numbers in a grid, with answers written out. |
| Depth cards | **No bank** for this topic | Author three Depth cards in the deck (below), as the primes deck did. |
| Misconception tags | **None** for primes or index (`src/shared/misconceptions.ts` has estimation and ratio only) | Add four (listed below) as part of the build. |
| A printable of blank tree frames | **No** | Offer one (open question 3): an A4 sheet of empty tree shapes for weak drawers. Optional. |

## Slide piece to build: Factor tree

- **What it draws:** a tree from a root number, each non-prime splitting into two branches. Each node is a number; a prime is **circled and stops**. Spreads to fit (never a fixed pixel height) and is sized for a projector, as the board is.
- **Click by click:** one click per split, so the class predicts the next split before it appears. The last click circles the final primes and a **tally panel** beside the tree gathers them: prime · how many · index form (also staged).
- **Fill modes, as for the board:** *Filled in* (the whole tree), *Structure only* (the default: the root and the boxes where numbers go, unknown boxes drawn as "?", as the ratio table does), *Blank* (just the root). The player's existing Filled in / Structure only / Blank control and `B` key work on it.
- **A supported tree:** the author can give some nodes ("3 × □") so the first whiteboard in a set is partly completed.
- **Data:** a node is `{ n, kids?: [node, node] }`; a prime has no kids and is circled automatically (primality comes from the number, not the author, so a wrong circle cannot be authored).
- **Checks:** unit tests that every leaf is prime, the leaves multiply back to the root, a tree never splits using 1, the tally matches the leaves, and the same layout renders the same each time.
- **Branch note (`AGENTS.md`):** a new element kind is new code, and the live server refuses a deck that uses it until it is on `main`. So the piece goes in its own small merge first, then the deck is pushed.

---

## Flow (one lesson as the aim; tags show what to cut or carry over)

| # | Slide | Type | Tag | Notes |
|---|---|---|---|---|
| 1 | Title: Prime factor trees | Title | Core | |
| 2 | Objective and success criteria | Learning objective | Core | Three "I can" lines: draw a tree; write the primes; write in index form |
| 3 | **Section 1: What is a prime?** (short recap) | Divider | Core | |
| 4 | Prime, factor, product (the three words) | Vocabulary | Core | **Product** is the new word: the answer to a multiplication |
| 5 | **A prime number** has exactly two factors: 1 and itself | Key definition | Core | |
| 6 | Quick check: circle the primes in a grid of 12 numbers up to 20 (2 to 19) | Quick grid | If time | Introduces the "Primes to 20" strip |
| 7 | **Section 2: Factor trees** | Divider | Core | |
| 8 | Build a tree for 20, three steps | Factor tree, staged | Core | Rules on the slide: 1 split into two numbers from a times table · 2 prime? circle it, it stops · 3 not prime? split again. Ends: $2 \times 2 \times 5$ |
| 9 | Your turn, stage 1: tree whiteboards, partly drawn / a count / nothing | Tree whiteboard × 3 | Core | 28 · 45 · 30 |
| 10 | Discussion: two trees for 24 (2 × 12 and 4 × 6); can both be right? | Split discussion | Core | Same primes either way. Claim to test |
| 11 | Why we never split with 1 (1 × 20 never ends) | Key point | Core | Short; the trap is real for weak groups |
| 12 | Book work: draw a tree for each (copy into books) | Plain book 3 × 3 | Core | Set B1 below |
| 13 | **Section 3: Writing it as a product** | Divider | Core | Recap slide after the divider: 4 quick trees' primes (pick-up point) |
| 14 | Read the primes off the tree, smallest first: $2 \times 2 \times 5$ | Factor tree, staged | Core | Colours help ordering |
| 15 | Check: multiply the primes back to the number | Board (Structure only) | If time | Small numbers only: $2 \times 2 \times 5 = 20$ |
| 16 | Exit ticket mini-check (optional cut) | | If time | Cut first if short on time |
| 17 | **Section 4: Index form** | Divider | Core | The slow build |
| 18 | How many of each? Count the colours | Factor tree + tally | Core | For 18: one 2, two 3s |
| 19 | Key definition: **index form** writes repeats with a small raised number, $3 \times 3 = 3^2$ | Key definition | Core | "The small number counts how many times the big number is written" |
| 20 | What the small number means (and does not): $3^2$ is $3 \times 3$ | Board (Structure only) | Core | $3^2 = 9$, not $6$; $2^3 = 2 \times 2 \times 2 = 8$, not 6 |
| 21 | **Set C: write in index form** (6, ladder below) | Deliberate practice | Core | Products of primes given |
| 22 | Index form of 18 from the tree | Factor tree + tally, staged | Core | $2 \times 3^2$; a prime that appears once has no raised number |
| 23 | Tree to index form, stage 2: partly drawn / a count / nothing | Tree whiteboard × 3 | Core | 72 · 100 · 80 |
| 24 | **Depth:** one card (index meaning) | Depth | Overflow | |
| 25 | Book work: write each in index form (copy into books) | Plain book 3 × 3 | Overflow | Set B2 below |
| 26 | **Depth:** two cards (two trees; the circled non-prime) | Depth | Overflow | Never three in a row, so a book set sits between 24 and these |
| 27 | Exit ticket: three questions, one to a row | Exit ticket | Core | Numbers used nowhere else |
| 28 | Summary | Summary | Core | |

**Pacing, for one lesson of about 50 minutes (a guide, not timings):** Core slides carry the lesson. If it runs short, cut the **If time** slides (6, 15, 16) first, then carry the **Overflow** slides (24 to 26: Depth and the second book set) to the start of the next lesson; the recap-style slide after the Section 3 and 4 dividers works as that restart. The exit ticket (27) stays at the end of whichever lesson finishes the index section.

**Take-home piece:** book work only (slides 12 and 25), not both book work and a pinned worksheet. Optional: a printable of blank tree frames (open question 3).

---

## The authored sets: ladder, traps, scale, conventions

**Conventions for the whole deck.**

- The product of primes is written **smallest to largest**, with $\times$ between: $2 \times 2 \times 3$.
- Index form uses the same order: $2^2 \times 3$. A prime that appears once is written alone (never $2^1$). The raised number is called the **index** (and "power" appears once on the vocabulary slide).
- A tree is read off **left to right, bottom row**, with each circled prime in its colour; tallies are one row per prime.
- A split is always two numbers greater than 1.
- The answer line reads "$20 = 2 \times 2 \times 5$", and in index form "$20 = 2^2 \times 5$".
- No calculators: no question needs a times fact beyond 10 × 10 for a first split, and the answers are checked by multiplying small numbers back.

### Whiteboards, stage 1 (slide 9): trees to primes (blanks, a count, nothing)

| # | Number | Help | Answer | Tempting wrong method |
|---|---|---|---|---|
| 1 | 28 | partly drawn: $4 \times 7$ given, 4 to split | Core | $2 \times 2 \times 7$ | stopping at 4 and 7 (4 not prime) |
| 2 | 45 | a count: "(3 primes at the end)" | Core | $3 \times 3 \times 5$ | $5 \times 9$ and stopping, or listing 3 and 5 once |
| 3 | 30 | none | Core | $2 \times 3 \times 5$ | $5 \times 6$, circling 6 |

### Set B1: draw a tree (book work, slide 12; 9 questions, 3 × 3; the first six with a quiet hint, the last three without)

| Rung | Numbers | Hint | Answer (primes) |
|---|---|---|---|
| 1 | 14 | 2 primes | Core | $2 \times 7$ |
| 1 | 22 | 2 primes | Core | $2 \times 11$ |
| 2 | 12 | 3 primes | Core | $2 \times 2 \times 3$ |
| 2 | 27 | 3 primes | Core | $3 \times 3 \times 3$ |
| 3 | 40 | 4 primes | Core | $2 \times 2 \times 2 \times 5$ |
| 3 | 50 | 3 primes | Core | $2 \times 5 \times 5$ |
| stretch | 56 | none | $2 \times 2 \times 2 \times 7$ |
| stretch | 63 | none | $3 \times 3 \times 7$ (3 × 21 works if 7 × 9 is shaky) |
| stretch | 90 | none | $2 \times 3 \times 3 \times 5$ |

**Ladder:** two primes, then three, then four (still with the same shape), and the stretch needs two splits more than the first rung. Each question changes one thing.

### Set C: index form from a product (slide 21; 6 questions, deliberate practice)

| Rung | Question | Answer | Trap |
|---|---|---|---|
| 1 | $5 \times 5$ | $5^2$ | Core | writing $5 \times 2$ or $10$ |
| 2 | $2 \times 2 \times 2 \times 2$ | $2^4$ | Core | $2^3$ (miscounting) |
| 3 | $2 \times 2 \times 5$ | $2^2 \times 5$ | Core | $2^2 \times 5^1$, or $2^25$ |
| 4 | $2 \times 3 \times 3 \times 3$ | $2 \times 3^3$ | Core | $2^3 \times 3$ (index on the wrong prime) |
| 5 | $2 \times 2 \times 3 \times 3 \times 5$ | $2^2 \times 3^2 \times 5$ | Core | $2^2 \times 3^2 \times 5^2$ |
| 6 | Explain: is $2^3$ the same as $2 \times 3$? | $2^3 = 8$, $2 \times 3 = 6$; no | If time | "index means multiply" |

### Whiteboards, stage 2 (slide 23): tree to index form

| # | Number | Help | Answer | Tempting wrong method |
|---|---|---|---|---|
| 1 | 72 | partly drawn: $8 \times 9$ given | Core | $2^3 \times 3^2$ | $2^3 \times 3^3$ or $2 \times 3$ |
| 2 | 100 | a count: "(2 different primes)" | Core | $2^2 \times 5^2$ | $10 \times 10$, stopping |
| 3 | 80 | none | Core | $2^4 \times 5$ | $2^3 \times 5$ (miscounting 2s) |

### Set B2: tree to index form (book work, slide 25; 9 questions, 3 × 3; the first six hinted)

| Rung | Numbers | Hint | Answer |
|---|---|---|---|
| 1 | 16 | 1 prime | Core | $2^4$ |
| 1 | 25 | 1 prime | Core | $5^2$ |
| 2 | 54 | 2 primes | Core | $2 \times 3^3$ |
| 2 | 32 | 1 prime | Core | $2^5$ |
| 3 | 75 | 2 primes | Core | $3 \times 5^2$ |
| 3 | 42 | 3 primes | Core | $2 \times 3 \times 7$ (no raised numbers: a trap in itself) |
| stretch | 120 | none | $2^3 \times 3 \times 5$ |
| stretch | 84 | none | $2^2 \times 3 \times 7$ |
| stretch | 200 | none | $2^3 \times 5^2$ |

**Scale.** Whiteboards and book sets climb from 14 to 200. The biggest numbers all split by 10, 2 or 5 first.

### Worked examples and discussions (never asked in a question)

20 (the first tree) · 24 (two trees) · 18 (index form, tally) · 36 (spare). The build script asserts that no question asks about them, none is asked twice in a section, the exit ticket uses numbers asked nowhere else, and no number repeats. I recomputed every factorisation above by script, and there are no repeats.

### Exit ticket (slide 27; one question to a row)

1. Draw a tree for 33. (answer $3 \times 11$)
2. Write 60 as a product of primes in index form. (answer $2^2 \times 3 \times 5$)
3. Write $2 \times 2 \times 3 \times 3 \times 3$ in index form. (answer $2^2 \times 3^3$)

### Depth cards (authored, claims shape, three cards, numbers the deck does not use)

Each has a claim to test, a named misconception on every wrong option, speakers from the eight named cast (Feathers is a mascot only), and the question zone never moves when the answer is revealed.

| Card | Claim | What it tests | Numbers |
|---|---|---|---|
| 1 | "$5^3 = 15$" | The index is a count of repeats, not "times" | Core | $5^3 = 125$; a spare option $5 \times 3$ |
| 2 | Two pupils draw 70 as $7 \times 10$ and $2 \times 35$: only one can be right | Different trees, same primes ($2 \times 5 \times 7$) | Core | 70 |
| 3 | A pupil's tree for 48 stops at $6 \times 8$ with both circled | Circling a number that is not prime | Core | 48 ($2^4 \times 3$) |

**New misconception tags to add** (`src/shared/misconceptions.ts`): `index-as-multiply` ($2^3 = 6$) · `circle-non-prime` (circling 4, 6, 8 or 9) · `stop-after-one-split` (a tree with only one split) · `repeat-prime-once` (listing a repeated prime once, such as 12 as $2 \times 3$).

---

## Traps (each has a question built so the wrong method gives a tempting, different answer)

| Trap | Where |
|---|---|
| Stopping at a number that is not prime (circling 4, 6, 8, 9) | Whiteboard 1 and 3, B1-3, Depth 3 |
| Listing a repeated prime once ($12 = 2 \times 3$) | B1-3 to 6, set C |
| $2^3 = 6$ (index means multiply) | slide 20, Set C-6, Depth 1 |
| Splitting with 1 | slide 11 |
| Putting an index on the wrong prime or on every prime | Set C-4 and C-5 |
| Writing $3^1$ for a prime that appears once | slide 22, B2 |

---

## Look and feel

- Plain big numbers, the primes strip small and grey, hints quiet (`hintLine`, `quiet`), whiteboards full-width, book work 3 × 3 at size 100 with the instruction once at the top, titles in the standard place.
- Check the tree at the three screen sizes (phone is previews only for decks), and run the layout check on every state, including the tally open.
- The look card comes first: one slide of each kind in every state (the tree at each click, the three help levels, the tally, a book grid, a Depth card). **No full deck is built until you say yes on those pictures.**

## Steps once this is agreed

1. Build the **Factor tree** piece and its tests, as its own small merge to `main` (needed before the deck can be pushed).
2. Write the sets from this plan and send you the table (rung, answer, trap, wrong-method result), recomputed by a different route.
3. Add the four misconception tags.
4. `npm run deck -- looks <script>`: the look card for you to approve.
5. Build, then `verify`, `review` (every contact sheet looked at), and push.
6. Record: patch note, the pathway/task update, the planner Build Log and the Tools dashboard note.

## Open questions for Harry

1. ~~How long?~~ **Decided:** one deck, aimed at one lesson, built in one go; tagged Core / If time / Overflow so it can run over.
2. **Primes strip:** primes to 20 on every tree slide, or only to 13 to keep it quiet?
3. **A printable of blank tree frames** (A4, empty tree shapes to draw on): yes, or only draw in books?
4. **Do they use the divisibility rules** (even ends in 2 → 2 goes in, ends in 5 or 0 → 5 goes in)? I have only put them in as an optional hint, not taught.
5. **The Factor tree piece:** go ahead (recommended), or use the fallback of hand-drawn circles and lines on Blank slides?
6. **Words:** "index" and "power" both, or only "index"?
7. **Next lesson:** HCF and LCM from the prime factors, built on these trees, later?
