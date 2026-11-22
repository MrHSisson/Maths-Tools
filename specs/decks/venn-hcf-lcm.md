# Lesson sequence: Venn diagrams, then HCF and LCM from prime factors

**Status:** plan for review (nothing built; no task or pathway added: that waits for Harry) · **Decks:** `venn-diagrams`, `venn-prime-factors`, `venn-hcf-lcm` (three decks, one sequence) · **Strand:** Number · **Tool:** none (every question is authored, as in the factor and multiple decks)
**Follows:** `multiples-systematic-listing`, `factors-hcf-systematic-listing` (HCF and LCM by listing) and `prime-factor-trees` (trees, product of primes, index form). **Class:** not stated for this sequence: see open question 3.

**Aim:** pupils meet the Venn diagram with no numbers at all, learn to put the prime factors of two numbers into a Venn (given as tiles first), and then read the HCF (multiply the middle) and the LCM (multiply everything) straight off it. Heavy scaffold, every idea met several times, support taken away one step at a time.

---

## Please check these first (what I assumed)

1. **"Putting prime factors into a tree" I read as into the Venn**, not a factor tree: factor trees already have a deck (`prime-factor-trees`). The sequence assumes pupils have done it, with one retrieval step; the first Venn questions *give* the factorisation and the tiles, and only later start from the number (tree first). Say if you did mean something else.
2. **Three decks, one lesson-and-a-half each**, not one big deck: a deck is built for about two lessons, and this much scaffold would be 60 or more slides. Each deck ends on an exit ticket so any of them can stand alone.
3. **All questions authored, no generator**, and the maths is computed by the build script, never typed (the Venn contents, HCF and LCM are derived from the two numbers, as `factorTree` derives primality), so a wrong answer cannot be authored.
4. Wording: **"in both"** (the overlap) and **"neither"** (outside the circles, inside the box). Prime tiles are the coloured squares the site already uses.

---

## The sequence at a glance

| Deck | Slides | What pupils can do at the end | New code it needs |
|---|---|---|---|
| **A. Venn diagrams** (`venn-diagrams`) | about 19 | Read a two-circle Venn; place items (names, shapes, animals, then numbers) in the right region, including "in both" and "neither"; say why | Venn slide element |
| **B. Prime factors in a Venn** (`venn-prime-factors`) | about 25 | Given two prime factorisations, build the Venn (shared tile once in the middle, leftovers either side); check by multiplying each circle back; read a Venn backwards to find its two numbers; start from the numbers (tree, then tiles, then Venn) | Venn element (prime mode), prime tile row, picture questions |
| **C. HCF and LCM from a Venn** (`venn-hcf-lcm`) | about 28 | HCF = multiply the middle; LCM = multiply everything; both from one Venn; edge cases; a check by dividing | Nothing beyond B |

## The scaffold ladder (the fade, used in B and again in C)

Every skill is met at each rung before the next rung starts, and each rung is a model, three whiteboards and a book set share:

| Rung | What pupils are given | What they do |
|---|---|---|
| 1. Watch | Everything, built one click at a time | Follow and say what happens next |
| 2. Finish it | A Venn already filled in | Read it (the two numbers, then the HCF or LCM) |
| 3. Place the tiles | The two prime factorisations as coloured tiles, circles drawn | Place the tiles, then multiply |
| 4. Build it | The two factorisations as numbers (2 × 2 × 3) | Draw the Venn, place the tiles, multiply |
| 5. From the numbers | Just the two numbers | Tree, product of primes, Venn, answer |

Alongside it, the **help on a whiteboard climbs and then goes** (house style): partly placed, then a count in small grey brackets, then nothing; a book set is nine questions, three × three, the first six with a quiet hint and the last three none.
**Repeats:** each kind of Venn (below) appears in a model, a whiteboard and a book question. **Fresh numbers** (`assertFreshNumbers`): a worked number is never asked, none is asked twice inside a section, the exit ticket uses numbers asked nowhere else.

---

## Deck A: Venn diagrams (no numbers first)

| # | Slide | Kind | Notes |
|---|---|---|---|
| 1 | Title | Title | |
| 2 | Objective | Learning objective | I can read a Venn · place things in a Venn · explain where something goes |
| 3 | Divider: Reading a Venn | Divider | |
| 4 | **What a Venn shows** (pets in 8B) | Venn, staged | Box ("everyone in 8B"), circle "Has a dog", circle "Has a cat", the overlap lit as "both", the outside lit as "neither"; names appear last |
| 5 | Read it together | Venn, regions lit one click each | Who has a dog? Only a dog? Both? Neither? |
| 6 | Reading whiteboards × 3 | Whiteboards | Three fresh contexts (shapes, drinks, transport); help climbs: regions labelled, then a count, then none |
| 7 | Divider: Placing things | Divider | Recap of four quick questions after it (pick-up point) |
| 8 | Worked: sort ten animals ("Can fly" / "Has feathers") | Venn, one item per click | Penguin, bat, parrot, dog; the hardest (a bat flies without feathers; a dog neither) go last |
| 9 | Placing whiteboards × 3 | Whiteboards | Circles labelled with two items placed, then labels only, then blank |
| 10 | Discussion | Split discussion | "Mia has a dog and a cat, so she goes in both circles, once in each." Can both be right? Where does the claim go wrong? |
| 11 | Book work | Plain book, 6 questions (2 × 3) | Fresh contexts, hint on the first four. Fewer than the standard 12 because each one is a drawn Venn: see open question 6 |
| 12 | Depth | Depth card | "Neither" is not left out: it lives outside the circles, inside the box |
| 13 | Divider: Numbers in a Venn | Divider | |
| 14 | Worked: 1 to 12, "even" and "multiple of 3" | Venn, one number per click | 6 and 12 go in the middle; membership is computed from the rule |
| 15 | Number whiteboards × 3 | Whiteboards | "Multiple of 2 / of 5", "odd / more than 10", "square / odd" |
| 16 | Book work | Plain book, 6 questions | |
| 17 | Depth | Depth card | "Prime" and "odd": 2 is prime but not odd (the one edge case, at the end) |
| 18 | Exit ticket | One question to a row | Read a Venn · place four items · a number Venn |
| 19 | Summary | Summary | |

The factors-of and multiples-of Venns (the bridge to HCF and LCM) are deliberately not here: they open Deck C, where they answer "why does the middle give the HCF?".

## Deck B: Prime factors in a Venn

| # | Slide | Kind | Rung | Notes |
|---|---|---|---|---|
| 1 | Title | | | |
| 2 | Objective | | | I can put the prime factors of two numbers in a Venn |
| 3 | Divider: Prime tiles | | | |
| 4 | Retrieval, four quick ones | Quickfire | | Which of 2 to 19 are prime? Multiply the tiles back: 2, 2, 3 make which number? |
| 5 | **Prime tiles** | Tile row, staged | 1 | Each prime has its colour; a number is a row of tiles, smallest first; 12 = [2][2][3] |
| 6 | Tiles to number, 6 questions | Fixed set | | Quick, to be sure the tile idea is secure before the Venn |
| 7 | Divider: Two numbers, one Venn | | | Pick-up point, with a four-question recap after it |
| 8 | **The rule** (10 and 15) | Venn, staged | 1 | 1 write both as tiles · 2 a tile in both lists: **one goes in the middle, cross one off each list** · 3 leftovers go on their own side |
| 9 | Place the tiles × 3 | Whiteboards | 2 to 4 | Filled Venn to read, then tiles given and circles drawn, then the two factorisations only |
| 10 | **The check:** multiply each circle back | Venn, staged | 1 | Left circle (left side and middle) multiplies to the first number, the right circle to the second: the Venn proves itself |
| 11 | Divider: Repeated tiles | | | |
| 12 | Model: a prime repeated (8 and 12) | Venn, staged | 1 | Match tiles **one for one**: two 2s match two 2s, the third stays left |
| 13 | Discussion | Split discussion | | "Ella puts all three 2s of 8 in the middle because 2 is in both." Where does the check catch her? |
| 14 | Repeated-tile whiteboards × 3 | Whiteboards | 3 to 5 | |
| 15 | Book work | Plain book, 9 (3 × 3) | 3 to 5 | First six hinted, last three none |
| 16 | Divider: Special cases | | | |
| 17 | Two models: nothing in the middle; one number inside the other | Venn, staged | 1 | Nothing shared is a Venn with an empty middle (fine); one inside the other leaves one side empty |
| 18 | Special-case whiteboards × 3 | Whiteboards | 3 to 4 | |
| 19 | Divider: Backwards, and from scratch | | | |
| 20 | **Read a Venn backwards:** what are the two numbers? | Model, then whiteboards × 3 | 2 | Multiply left and middle; multiply right and middle |
| 21 | **From the numbers:** tree, tiles, Venn | Tree element beside Venn, staged | 5 | Reuses the factor tree slide piece; whiteboards × 3 with numbers only |
| 22 | Depth × 2 | Depth | | A tile in the middle that is not in both numbers; can the middle be empty? |
| 23 | Book work | Plain book, 9 (3 × 3) | 4 to 5 | Mixed, edge cases at the end |
| 24 | Exit ticket | | | |
| 25 | Summary | | | |

## Deck C: HCF and LCM from a Venn

| # | Slide | Kind | Rung | Notes |
|---|---|---|---|---|
| 1 | Title | | | |
| 2 | Objective | | | I can find the HCF and LCM of two numbers from a Venn of their prime factors |
| 3 | Retrieval: build the Venn, four quick ones | Quickfire | | From Deck B |
| 4 | Divider: HCF | | | |
| 5 | **Why the middle?** | Two Venns side by side, staged | 1 | 12 and 18 as a Venn of their factor *lists* (overlap 1, 2, 3, 6; the biggest is 6), then as a Venn of prime tiles (middle 2 and 3, and 2 × 3 = 6): same answer, and the tile way still works when the lists are long |
| 6 | **Key point: HCF = multiply the tiles in the middle** | Key point + Venn | 1 | The middle is what both numbers are built from |
| 7 | Model: HCF | Venn, staged | 1 | |
| 8 | HCF whiteboards × 3: Venn given | Whiteboards | 2 | |
| 9 | HCF whiteboards × 3: tiles given | Whiteboards | 3 | |
| 10 | HCF whiteboards × 3: factorisations given | Whiteboards | 4 | |
| 11 | Book work | Plain book, 9 (3 × 3) | 3 to 5 | |
| 12 | Divider: LCM | | | Pick-up point, recap of four after it |
| 13 | **Key point: LCM = multiply every tile in the Venn** | Key point + Venn | 1 | The same 12 and 18 Venn as slide 7, so only the multiplying changes. Why: to build both numbers you need every tile, but a shared tile only once |
| 14 | Discussion | Split discussion | | "LCM of 12 and 18 is 12 × 18 = 216." Is it a common multiple? Is it the lowest? What did multiplying both numbers count twice? |
| 15 | LCM whiteboards × 3: Venn given | Whiteboards | 2 | |
| 16 | LCM whiteboards × 3: tiles given | Whiteboards | 3 | |
| 17 | LCM whiteboards × 3: factorisations given | Whiteboards | 4 | |
| 18 | Book work | Plain book, 9 (3 × 3) | 3 to 5 | |
| 19 | Divider: Both from one Venn | | | |
| 20 | **Which one is it?** Claims about HCF and LCM | Split discussion | | "Multiply the middle", "multiply everything", "the answer is always bigger than both numbers" (false for HCF), "the HCF can be one of the numbers" |
| 21 | Models: nothing shared (HCF 1, LCM the two multiplied) · one inside the other (HCF the smaller, LCM the larger) | Venn, staged | 1 | |
| 22 | HCF and LCM whiteboards × 3 | Whiteboards | 5 | From the numbers: tree, Venn, both answers |
| 23 | **Check it:** divide | Key point | | The HCF divides both numbers exactly; the LCM divides exactly by both (calculator or by hand). If time: HCF × LCM = the two numbers multiplied |
| 24 | Book work | Plain book, 9 (3 × 3) | 5 | Mixed HCF and LCM; edge cases last |
| 25 | Depth × 2 | Depth | | HCF read from the outer tiles; a Venn with an empty middle |
| 26 | If time: where does it come up? | Fixed set, 4 | | Two buses leave together then every 12 and 18 minutes (LCM); cut two lengths into equal pieces (HCF) |
| 27 | Exit ticket | | | An HCF, an LCM, and one Venn asked for both |
| 28 | Summary | | | |

If a lesson runs short: cut in this order (Deck C): slide 26, the second Depth, slide 23's extra line, then the book sets, which carry to the next lesson from the dividers.

---

## The question ladder, the traps, and the numbers

**Kinds of Venn (each appears as a model, a whiteboard and a book question).** The numbers come from the build script, which computes every region, the HCF and the LCM and asserts each (a check of the candidates below is in the table; the script draws the full set from these rules).

| Kind | Rule it tests | Candidate pairs (all recomputed) |
|---|---|---|
| a. One shared prime | One tile in the middle, one leftover each side | 10 & 15 (HCF 5, LCM 30) · 14 & 21 (7, 42) · 6 & 10 (2, 30) |
| b. Two shared primes | Two different tiles in the middle | 12 & 18 (6, 36) *worked in C* · 20 & 30 (10, 60) · 28 & 42 (14, 84) · 30 & 45 (15, 90) |
| c. A repeated prime, shared in part | Match one for one | 8 & 12 (4, 24) · 18 & 24 (6, 72) · 45 & 75 (15, 225) |
| d. A repeated prime, shared in full | The same prime in the middle twice or more | 16 & 24 (8, 48) · 24 & 40 (8, 120) · 50 & 75 (25, 150) |
| e. Bigger, stretch | Three or four tiles in the middle | 36 & 48 (12, 144) · 60 & 84 (12, 420) · 40 & 100 (20, 200) · 32 & 48 (16, 96) |
| f. One inside the other | One side empty | 9 & 18 (9, 18) · 6 & 30 (6, 30) · 21 & 63 (21, 63) |
| g. Nothing shared | Empty middle: HCF 1, LCM the product | 8 & 15 (1, 120) · 15 & 28 (1, 420) |

The ladder climbs a to e, with f and g (the edge cases) at the end of a set, one of each and never several in a row. The first sets use 2, 3, 5 and 7 only; 11 appears once, only beside a small prime (as in the trees deck: 35 & 55 is the example).

**Traps (each has a question where the wrong method gives a different, tempting answer).** New misconception tags in `src/shared/misconceptions.ts`: only the `primes-*` ones exist today, so these are added (names provisional):

| Trap | Where it bites | Wrong method, example 12 & 18 |
|---|---|---|
| `venn-all-copies-middle` Every copy of a shared prime goes in the middle | b, c, d | 8 & 12: all three 2s in the middle |
| `venn-tile-both-sides` A shared tile is written in both circles and counted twice | b to e | LCM 2 × 2 × 3 × 3 × 2 × 3 or 12 × 18 = 216 |
| `hcf-multiply-everything` HCF from the whole diagram | any HCF | 36 for the HCF |
| `lcm-multiply-outsides` LCM from the two leftover sides only | any LCM | 2 × 3 = 6 for the LCM |
| `venn-empty-middle-zero` Empty middle taken as "no answer" or 0 | g | 8 & 15: HCF 0 |
| `venn-one-side-lost` One number inside the other: the number "disappears" | f | 9 & 18: HCF 18 |
| `venn-neither-forgotten` An item in neither is dropped | Deck A | |

**Scale.** Numbers to 100 in the main sets; LCMs reach 420 only in the stretch rows. This is a pitch decision (calculators? open question 3).

---

## What exists, and what has to be made new

| Need | Exists? | Plan |
|---|---|---|
| Factor trees, primes, index form | Yes (deck `prime-factor-trees`, the `factorTree` slide piece) | Reused: the tree beside a Venn on Deck B slide 21 |
| Number grid, prime colours | Yes | Prime colour palette: **there are two slightly different ones** (`PRIME_COLOURS` in `numberGrid.ts`: 2 blue, 3 green, 5 orange, 7 purple; and `PRIME_TILE_COLORS` in `TeachingDeck.tsx`: sky, emerald, amber, purple, plus 11 and 13). The Venn and the tree must use one, so decide once (the number grid's, since the tree uses it) |
| Whiteboard, book work, discussion, exit ticket, Depth slides | Yes (`S.whiteboard`, `S.plainBook`, `S.discuss`, `S.exitRows`, authored Depth) | As they are |
| **A Venn slide element** | **No.** The Teach scene `primeVenn` is retired with the Teach tab and does not run in decks; the `mathsWords` Venn is a decorative icon | **Build.** See below |
| **Venn pictures inside fixed questions** | **No.** Only rectilinear shapes can sit in a fixed question; a ratio table or fraction bar can be a generator's working but not an authored question's | **Build** (or avoid: see the choice below) |
| **A row of prime tiles** (12 = [2][2][3], tiles crossed off) | Only inside the retired Teach scene | **Build**, as part of the Venn element (its source lists) and on its own for Deck B slide 5. It is the "prime factor tiles" piece already on the decks pathway's side-task list |
| HCF / LCM misconception tags | No | Add (above) |
| A generator for HCF and LCM | No | **Not built for this sequence.** It is Phase 3 in `specs/decks/primes-and-divisibility.md`; the Skill library's `hcf` skill still has two named consumers waiting (`FractionsOfAmounts`, `RecipesTool`). Build it from the same Venn logic later |
| Depth cards | No bank | Authored in each deck (claims, named misconceptions, the eight cast) |
| A printed Venn mat, tile strips | No | Optional, open question 6 |

### The new pieces in order

1. **`src/shared/venn.ts` (pure logic, with tests, no React).** Splits two prime factorisations into left, middle and right (by multiset, so repeats match one for one); HCF and LCM from the regions; region membership from a number rule ("even", "multiple of 3", "prime", "factor of 12"); `vennProblems` (like `treeProblems`: a wrong region cannot be authored). Small and the foundation for everything else; `TeachingDeck`'s `vennParts` is the existing starting point.
2. **The Venn slide element** (`kind: "venn"`, drawn by `Venn.tsx`, with an editor panel, an entry in Add slide and the library, deck check, normalise and merge). Modes: **categories** (names, shapes, animals: items authored) and **numbers** (membership computed from a rule) and **primes** (give two numbers, the regions are computed). Parts: the box with an optional label, two circles with rule labels, region labels ("both", "neither") shown or hidden, items as chips or as prime tiles, source tile lists above the Venn that cross tiles off as they are placed, a lit region, and the reveal lines (**HCF = 2 × 3 = 6**, **LCM = 2 × 2 × 3 × 3 = 36**, the circle check). Staged by click; **Filled in / Structure only / Blank** like the board (Structure only is the default: circles and labels, the given items placed, the rest empty). Works at the phone, tablet and laptop sizes through the normal slide canvas.
3. **`Q.venn` picture questions.** A fixed question that carries a Venn (its numbers or items, what is given, what is asked) so a question slide shows the Venn in the workspace and the answer reveal fills it in. It is the largest piece and a **data-format change**: the server validates deck questions with the code on `main` (`api/_questions.ts`), so it merges before any deck that uses it. Without it, the practice slides can still run as the trees deck does: Harry draws the Venn on the board and the answer on a click is text ("middle: 2, 3 · left: 2 · right: 3 · HCF 6").
4. **Misconception tags and tests**, then the docs: `docs/FEATURES.md`, `docs/design/SLIDE_FEATURES.md`, `docs/reference/pictures.md` (the Venn as a representation; see open question 7) and `docs/reference/decks.md`, then `npm run facts`.
5. Later, only if wanted: tap an item then a region to place it (a live Venn in the player), a printable Venn mat and tile strips, the HCF and LCM generator.

### Build order (small merges, each green on its own; look card before any deck)

| Merge | Content | Needs |
|---|---|---|
| 1 | Shared logic and tests; misconception tags; the palette decision | Nothing |
| 2 | Venn element, editor, library, deck check, docs | 1 |
| 3 | **Deck A** (look card first), then push | 2 |
| 4 | `Q.venn` picture questions (merged before any deck uses it) | 1, 2 |
| 5 | **Deck B** | 2 (and 4 if pictures in questions) |
| 6 | **Deck C** | 5 |

Decks A to C can also be built from merge 2 alone with text answers, then upgraded when 4 lands.

---

## Open questions for Harry

1. **"Tree"** in your note: the Venn, as I assumed, or a factor tree? (Trees already have a deck.)
2. **Three decks** as above, or one?
3. **The class and calculators.** The trees deck was a weak group with no calculators; the HCF deck had Casio fx-85s. This sets how big the LCMs can get and whether the check by dividing is a calculator step.
4. **Practice style** (recommended: build `Q.venn`, merge 4): Venn pictures in the question slides, answer fills the Venn in; or the cheaper route where you draw the Venn live and the answer is a line of text.
5. **Open Deck C with the listing Venn** (factors of 12 and 18 as lists, then the tiles) so pupils see why the middle gives the HCF, or go straight to the tiles?
6. **Printables:** a blank two-circle Venn sheet and cut-out prime tiles would save pupils drawing circles (a weak group loses a lot of time on that). You decided no printables for the trees; is a Venn different? Book sets in Deck A are 6 questions (2 × 3), not 12, because each is a drawn Venn: fine?
7. **Is the Venn a ninth core representation**, or part of the prime factor tiles family? My view: a ninth, because it is useful beyond HCF and LCM (sets, probability, data); a new representation needs a reason (R27) and `docs/pathways/core-representations.md` is where it is recorded.
8. **Worded problems** (buses, cutting lengths): include as an If time slide, as drawn above, or leave to a later lesson?
