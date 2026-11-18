# Lesson plan: Prime factorisation with factor trees (and index form)

**Status:** plan agreed in chat, updated 2026-11-18 (the Factor tree slide piece is built; the deck is not) · **Deck id:** `prime-factor-trees` · **Strand:** Number · **Tool:** none (every question is authored; no generator)
**Follows:** Harry's LCM and HCF lesson. **Banked as:** "Prime factorisation lesson (factor trees)" in `docs/TASKS.md`.
**Class:** weak group; **weak on times tables**; **no calculators**. **They have been taught the divisibility rules but are not confident on them.**

**Objective:** draw a factor tree for a number, circling each prime as it appears, until every branch ends in a circled prime; write the number as a product of primes; then write that product in index form (for example $2 \times 2 \times 3 = 2^2 \times 3$).

**Not in this lesson:** using the trees for HCF or LCM (not planned for now). **No printables** (decided: no blank tree sheet).

---

## Decisions (agreed with Harry unless marked)

1. **One deck, aimed at one lesson, built in one go.** The aim is ambitious for this group, so every slide is tagged **Core** (the lesson), **If time** (drop freely) or **Overflow** (carries to the next lesson). Dividers are the pick-up points; nothing is a separate deck. Index form keeps its own section and slow build, because that is the stated weak spot.
2. **Which primes can appear (decided with Harry).**
   - **2, 3, 5 and 7** can appear with any index.
   - **11, 13, 17 and 19** can appear, but **only ever to the power of 1**, and **only with the small primes 2, 3 or 5**: never with 7, never with each other. So $2 \times 2 \times 13$ and $2 \times 2 \times 5 \times 11$ are fine; $7 \times 13$, $11 \times 13$ and $11^2$ are not.
   - The build script asserts this for every number in the deck.
3. **No times table above 10 × 10 is needed, and the first split of every number uses the 2, 3, 5 or 10 table.** A big prime is found by splitting off a small one ($52 = 2 \times 26$, then $26 = 2 \times 13$; $220 = 10 \times 22$). No calculator is ever needed.
4. **Divisibility rules are a quiet support, not a new lesson.** They know them but are not confident, so (a) a short **"Which prime goes in first?"** slide with four quick questions opens the tree section, and (b) every tree slide carries a small grey reminder line: *Even: 2 goes in · Ends in 0 or 5: 5 goes in · Digits add to a 3 table number: 3 goes in*.
5. **Any split is allowed** (12 as $2 \times 6$ or $3 \times 4$ gives the same primes). We teach "split into two numbers from a times table you know, or use a divisibility rule to find a small prime that goes in". A discussion slide shows two trees for one number reaching the same primes.
6. **A permanent "Primes to 20" strip** (2 3 5 7 11 13 17 19) sits on every tree slide, small and grey, so "is it prime?" is a look-up, not a worry.
7. **Circle the prime the moment you see it** (that branch stops). Circles are in the prime's own colour, the same colours as the number grid (2 blue, 3 green, 5 orange, 7 purple; 11 to 19 a neutral dark ring), so the pupils *see* the three blue 2s before they are asked to count them. This is the bridge to index form.
8. **Index form is taught as counting, in a tally table:** prime · how many · index form. Only after that does the shorthand appear.
9. **Words (my default, say if you want otherwise):** "index" is the word used; "power" appears once on the vocabulary slide.
10. **One new slide piece is needed: a Factor tree** (below). Go-ahead given.

---

## What already exists, and what does not

| Need | Exists? | Plan |
|---|---|---|
| A generator for prime factorisation | **No** | Every question is authored. No generator slides, no pinned worksheets (those need a generator). |
| A factor tree as a slide piece | **No.** The deck model has text, shapes, lines, ratio table, bar model, board, number grid. | **Build the "Factor tree" slide piece** (next section). |
| Fixed question slides that show a tree | **No** (fixed questions cannot hold a picture) | Practice is "tree whiteboards": the number is the question, the tree is the answer, revealed a split per click (same idea as `S.whiteboard`). Book work is numbers in a grid, with answers written out. |
| Depth cards | **No bank** for this topic | Author three Depth cards in the deck (below), as the primes deck did. |
| Misconception tags | **None** for primes or index | Add four (listed below) as part of the build. |

## Slide piece to build: Factor tree

- **What it draws:** a tree from a root number, each non-prime splitting into two branches. Each node is a number; a prime is **circled and stops**. Spreads to fit (never a fixed pixel height) and is sized for a projector, as the board is.
- **Click by click:** one click per split, so the class predicts the next split before it appears. The last click circles the final primes, and a **tally panel** beside the tree gathers them: prime · how many · index form (also staged).
- **Fill modes, as for the board:** *Filled in* (the whole tree), *Structure only* (the default: the root and the boxes where numbers go, unknown boxes drawn as "?", as the ratio table does), *Blank* (just the root). The player's existing Filled in / Structure only / Blank control and `B` key work on it.
- **A supported tree:** the author can give some nodes (for example $4 \times 7$ given, the 4 still to split) so the first whiteboard in a set is partly completed.
- **Data:** a node is `{ n, kids?: [node, node] }`; a prime has no kids and is circled automatically (primality comes from the number, so a wrong circle cannot be authored).
- **Checks (unit tests):** every leaf is prime; the leaves multiply back to the root; a split never uses 1; the tally matches the leaves; layout is the same each time it is drawn; a tree draws within its box at the phone, tablet and laptop sizes. The deck build also checks the big-prime rule in decision 2.
- **Branch note (`AGENTS.md`):** a new element kind is new code, and the live server refuses a deck that uses it until it is on `main`. So the piece goes in its own small merge first, then the deck is pushed.

---

## Flow (one lesson as the aim; tags show what to cut or carry over)

| # | Slide | Type | Tag | Notes |
|---|---|---|---|---|
| 1 | Title: Prime factor trees | Title | Core | |
| 2 | Objective and success criteria | Learning objective | Core | Three "I can" lines: draw a tree; write the primes; write in index form |
| 3 | **Section 1: What is a prime?** | Divider | Core | |
| 4 | Prime, factor, product, index (the words) | Vocabulary | Core | **Product** is the answer to a multiplication; "power" mentioned here once |
| 5 | **A prime number** has exactly two factors: 1 and itself | Key definition | Core | |
| 6 | Quick check: circle the primes in a grid of 12 numbers up to 20 | Quick grid | If time | Introduces the "Primes to 20" strip |
| 7 | **Section 2: Factor trees** | Divider | Core | |
| 8 | **Which prime goes in first?** Even: 2 · ends in 0 or 5: 5 · digits add to a 3 table number: 3 | Key point + quick grid | Core | Four questions, "which of 2, 3, 5 goes in?": 65 (5) · 34 (2) · 51 (3) · 78 (2 and 3) |
| 9 | Build a tree for 20, step by step | Factor tree, staged | Core | Rules on the slide: 1 split into two numbers · 2 prime? circle it, it stops · 3 not prime? split again. Ends: $2 \times 2 \times 5$ |
| 10 | Your turn, stage 1: tree whiteboards, partly drawn / a count / nothing | Tree whiteboard × 3 | Core | 28 · 45 · 30 |
| 11 | Discussion: two trees for 24 ($2 \times 12$ and $4 \times 6$); can both be right? | Split discussion | Core | Same primes either way. A claim to test |
| 12 | Why we never split with 1 ($1 \times 20$ never ends) | Key point | Core | Short; the trap is real for weak groups |
| 13 | Book work: draw a tree for each (copy into books) | Plain book 3 × 3 | Core | Set B1 below |
| 14 | **Section 3: Writing it as a product** | Divider | Core | |
| 15 | Read the primes off the tree, smallest first: $2 \times 2 \times 5$ | Factor tree, staged | Core | Colours help the ordering |
| 16 | Check: multiply the primes back to the number | Board (Structure only) | If time | Small numbers only: $2 \times 2 \times 5 = 20$ |
| 17 | **Section 4: Index form** | Divider | Core | The slow build |
| 18 | How many of each? Count the colours | Factor tree + tally | Core | For 18: one 2, two 3s |
| 19 | Key definition: **index form** writes repeats with a small raised number, $3 \times 3 = 3^2$ | Key definition | Core | "The small number counts how many times the big number is written" |
| 20 | What the small number means (and does not): $3^2$ is $3 \times 3$ | Board (Structure only) | Core | $3^2 = 9$, not $6$; $2^3 = 2 \times 2 \times 2 = 8$, not 6 |
| 21 | **Set C: write in index form** (6, ladder below) | Deliberate practice | Core | Products of primes given |
| 22 | Index form of 18 from the tree | Factor tree + tally, staged | Core | $2 \times 3^2$; a prime that appears once has no raised number |
| 23 | Tree to index form, stage 2: partly drawn / a count / nothing | Tree whiteboard × 3 | Core | 72 · 100 · 80 |
| 24 | **Depth:** one card (index meaning) | Depth | Overflow | |
| 25 | Book work: tree, then index form (copy into books) | Plain book 3 × 3 | Overflow | Set B2 below |
| 26 | **Depth:** two cards (two trees; the circled non-prime) | Depth | Overflow | Never three in a row, so a book set sits between 24 and these |
| 27 | Exit ticket: three questions, one to a row | Exit ticket | Core | Numbers used nowhere else |
| 28 | Summary | Summary | Core | |

**Pacing, for one lesson of about 50 minutes (a guide, not timings):** Core slides carry the lesson. If it runs short, cut the **If time** slides (6, 16) first, then carry the **Overflow** slides (24 to 26: Depth and the second book set) to the start of the next lesson; the Section 4 divider is the pick-up point. The exit ticket (27) stays at the end of whichever lesson finishes the index section.

**Take-home piece:** book work only (slides 13 and 25). No printables.

---

## The authored sets: ladder, traps, scale, conventions

**Conventions for the whole deck.**

- The product of primes is written **smallest to largest**, with $\times$ between: $2 \times 2 \times 3$.
- Index form uses the same order: $2^2 \times 3$. A prime that appears once is written alone (never $2^1$). The raised number is the **index**.
- A split is always two numbers greater than 1.
- The answer line reads "$20 = 2 \times 2 \times 5$", and in index form "$20 = 2^2 \times 5$".
- 11, 13, 17 and 19 only ever appear once and only alongside 2, 3 or 5 (decision 2).
- No calculators: every first split uses the 2, 3, 5 or 10 table, and answers are checked by multiplying small numbers back.

### Slide 8: which prime goes in first? (quick grid of four)

| Number | Which of 2, 3, 5 goes in? | Rule it uses |
|---|---|---|
| 65 | 5 | ends in 5 |
| 34 | 2 | even; digit sum 7 so not 3 |
| 51 | 3 | digit sum 6 (not 2: odd; not 5: ends in 1) |
| 78 | 2 and 3 | even; digit sum 15 |

### Whiteboards, stage 1 (slide 10): trees to primes (partly drawn, a count, nothing)

| # | Number | Help | Answer | Tempting wrong method |
|---|---|---|---|---|
| 1 | 28 | partly drawn: $4 \times 7$ given, the 4 to split | $2 \times 2 \times 7$ | stopping at 4 and 7 (4 is not prime) |
| 2 | 45 | a count: "(3 primes at the end)" | $3 \times 3 \times 5$ | $5 \times 9$ and stopping, or 3 and 5 listed once |
| 3 | 30 | none | $2 \times 3 \times 5$ | $5 \times 6$, circling 6 |

### Set B1: draw a tree (book work, slide 13; 9 questions, 3 × 3; the first six with a quiet hint, the last three without)

| Rung | Number | Hint | Answer (primes) |
|---|---|---|---|
| 1 | 14 | 2 primes | $2 \times 7$ |
| 1 | 22 | 2 primes | $2 \times 11$ |
| 2 | 12 | 3 primes | $2 \times 2 \times 3$ |
| 2 | 27 | 3 primes | $3 \times 3 \times 3$ |
| 3 | 52 | 3 primes | $2 \times 2 \times 13$ |
| 3 | 40 | 4 primes | $2 \times 2 \times 2 \times 5$ |
| stretch | 63 | none | $3 \times 3 \times 7$ ($3 \times 21$ works if $7 \times 9$ is shaky) |
| stretch | 90 | none | $2 \times 3 \times 3 \times 5$ |
| stretch | 220 | none | $2 \times 2 \times 5 \times 11$ |

**Ladder:** two primes, then three, then four; the big primes (11, 13) appear in the middle and at the end, never repeated. Each question changes one thing.

### Set C: index form from a product (slide 21; 6 questions, deliberate practice)

| Rung | Question | Answer | Trap |
|---|---|---|---|
| 1 | $5 \times 5$ | $5^2$ | writing $5 \times 2$ or $10$ |
| 2 | $2 \times 2 \times 2 \times 2$ | $2^4$ | $2^3$ (miscounting) |
| 3 | $2 \times 2 \times 5$ | $2^2 \times 5$ | $2^2 \times 5^1$, or $2^25$ |
| 4 | $2 \times 3 \times 3 \times 3$ | $2 \times 3^3$ | $2^3 \times 3$ (index on the wrong prime) |
| 5 | $2 \times 2 \times 3 \times 3 \times 5$ | $2^2 \times 3^2 \times 5$ | $2^2 \times 3^2 \times 5^2$ |
| 6 (edge, last) | Is $2^3$ the same as $2 \times 3$? Explain | $2^3 = 8$, $2 \times 3 = 6$; no | "index means multiply" |

### Whiteboards, stage 2 (slide 23): tree to index form

| # | Number | Help | Answer | Tempting wrong method |
|---|---|---|---|---|
| 1 | 72 | partly drawn: $8 \times 9$ given | $2^3 \times 3^2$ | $2^3 \times 3^3$, or $2 \times 3$ |
| 2 | 100 | a count: "(2 different primes)" | $2^2 \times 5^2$ | $10 \times 10$, stopping |
| 3 | 80 | none | $2^4 \times 5$ | $2^3 \times 5$ (miscounting the 2s) |

### Set B2: tree to index form (book work, slide 25; 9 questions, 3 × 3; the first six hinted)

| Rung | Number | Hint | Answer |
|---|---|---|---|
| 1 | 16 | 1 prime | $2^4$ |
| 1 | 25 | 1 prime | $5^2$ |
| 2 | 54 | 2 primes | $2 \times 3^3$ |
| 2 | 32 | 1 prime | $2^5$ |
| 3 | 75 | 2 primes | $3 \times 5^2$ |
| 3 | 42 | 3 primes | $2 \times 3 \times 7$ (no raised numbers: a trap in itself) |
| stretch | 120 | none | $2^3 \times 3 \times 5$ |
| stretch | 88 | none | $2^3 \times 11$ (11 stays to the power 1) |
| stretch | 200 | none | $2^3 \times 5^2$ |

**Scale.** Numbers climb from 14 to 220. Every first split uses 2, 3, 5 or 10.

### Worked examples and discussions (never asked in a question)

20 (the first tree) · 24 (two trees) · 18 (index form, tally) · 36 (spare). The build script asserts that no question asks about them, none is asked twice in a section, the exit ticket uses numbers asked nowhere else, and no number repeats. **Recomputed by script (2026-11-18):** every factorisation in this plan, the big-prime rule for every number, and no repeats across the deck (including slide 8's 65, 34, 51 and 78).

### Exit ticket (slide 27; one question to a row)

1. Draw a tree for 33. (answer $3 \times 11$)
2. Write 60 as a product of primes in index form. (answer $2^2 \times 3 \times 5$)
3. Write $2 \times 2 \times 3 \times 3 \times 3$ in index form. (answer $2^2 \times 3^3$)

### Depth cards (authored, claims shape, three cards, numbers the deck does not use elsewhere)

Each has a claim to test, a named misconception on every wrong option, speakers from the eight named cast (Feathers is a mascot only), and the question zone never moves when the answer is revealed.

| Card | Claim | What it tests | Numbers |
|---|---|---|---|
| 1 | "$5^3 = 15$" | The index is a count of repeats, not "times" | $5^3 = 125$; a spare option $5 \times 3$ |
| 2 | Two pupils draw 70 as $7 \times 10$ and $2 \times 35$: only one can be right | Different trees, same primes ($2 \times 5 \times 7$) | 70 |
| 3 | A pupil's tree for 48 stops at $6 \times 8$ with both circled | Circling a number that is not prime | 48 ($2^4 \times 3$) |

**New misconception tags to add** (`src/shared/misconceptions.ts`): `index-as-multiply` ($2^3 = 6$) · `circle-non-prime` (circling 4, 6, 8 or 9) · `stop-after-one-split` (a tree with only one split) · `repeat-prime-once` (listing a repeated prime once, such as 12 as $2 \times 3$).

---

## Traps (each has a question built so the wrong method gives a tempting, different answer)

| Trap | Where |
|---|---|
| Stopping at a number that is not prime (circling 4, 6, 8, 9) | Whiteboards 1 and 3, B1, Depth 3 |
| Listing a repeated prime once ($12 = 2 \times 3$) | B1 (12, 27, 40), Set C |
| $2^3 = 6$ (index means multiply) | slide 20, Set C-6, Depth 1 |
| Splitting with 1 | slide 12 |
| Index on the wrong prime or on every prime | Set C-4 and C-5 |
| Writing $3^1$ for a prime that appears once | slide 22, B2 |
| Giving a big prime an index, or thinking 13 or 17 can still split | 52, 220, 88 (the end primes stay alone) |

---

## Look and feel

- Plain big numbers, the primes strip and the rules line small and grey, hints quiet (`hintLine`, `quiet`), whiteboards full-width, book work 3 × 3 at size 100 with the instruction once at the top, titles in the standard place.
- Check the tree at the three screen sizes (a phone only previews decks), and run the layout check on every state, including the tally open.
- The look card comes first: one slide of each kind in every state (the tree at each click, the three help levels, the tally, a book grid, a Depth card). **No full deck is built until you say yes on those pictures.**

## Steps

1. **Build the Factor tree piece and its tests, as its own small merge to `main`** (needed before the deck can be pushed). *Built 2026-11-18 on branch `ccr-8fd397fb-lwfz38`; merge pending.*
2. Write the sets from this plan and send you the table (rung, answer, trap, wrong-method result), recomputed by a different route.
3. Add the four misconception tags.
4. `npm run deck -- looks <script>`: the look card for you to approve.
5. Build, then `verify`, `review` (every contact sheet looked at), and push.
6. Record: patch note, the task update, the planner Build Log and the Tools dashboard note.

## Still open

1. **Words:** I have defaulted to "index", with "power" mentioned once (decision 9). Say if you want otherwise.
2. **Slide 8** (which prime goes in first) is new, because the rules are known but not confident. Tell me if it should be cut or made longer.
