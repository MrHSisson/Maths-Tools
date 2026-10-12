# Depth Bank Spec: Indices

**Status:** draft

Bank for the **Indices** tool (`specs/indices.md`), to live in `src/tools/Number/IndicesDepth.ts` and be exposed
as `__test.depthItems`. Depth has no gate — it ships with the tool. It pairs with the Teach deck
(`specs/decks/indices.md`): the deck *teaches* the write-it-out picture once; Depth then *tests whether it
stuck* and probes the misconceptions, so the worked examples don't have to repeat the teaching.

**Structure.** Depth levels follow the **ideas**, not the tool's Level 1–3 generator ladders, and every tab × level has diagnose, explain and extend
(the tests require it), so there are **4 tabs × 3 levels × 3 purposes = 36 items minimum** (this bank has 43) (items with no `tool` would show on every tab; here content is topic-specific, so every item names its `tool`).
Speakers come from the cast only (Ruby, Kofi, Mei, Ben, Amara, Leo, Priya, Jamal).

**Optional visual (nice-to-have, not blocking):** the deck's *factor tiles* as a Depth `visual: { type: "custom" }` with a **"Write it out"**
scaffold switch in the side rail, off by default, lit on the answer slide — shows the tiles for any item that is a ×, ÷ or power-of-a-power
of one base. Reuses the deck's tile component, so only worth doing if the deck is built.

---

## 1. The misconceptions

| Tab · Level | Misconception | The wrong answer it produces | Why a student thinks it |
|---|---|---|---|
| Powers · 1 | Power as multiplication | 4³ = 12 | Reads the small number as "times" |
| Powers · 1 | Root as halving | √36 = 18 | "A root cuts it down" |
| Powers · 2 | Sign outside the power | (−3)² = −9 | Applies the power to the 3, keeps the minus |
| Powers · 2 | Only one square root | x² = 49 → x = 7 | The √ symbol means the positive root, so one answer |
| Powers · 2 | Root over a sum | √16 + √9 = √25 | Treats √ as distributing |
| Powers · 2 | Multiplies before the power | 2 × 5² = 100 | Left-to-right |
| Powers · 3 | Power on the top only | (2/3)³ = 2/27 or 8/9 | Cubes only one part of the fraction |
| Powers · 3 | Root on the top only | √(9/25) = 3/25 | Same slip with the root sign |
| Laws · 1 | Multiply the indices | a² × a³ = a⁶ | Multiply "feels" like the operation |
| Laws · 1 | Add the indices (power of power) | (a²)³ = a⁵ | Same rule everywhere |
| Laws · 2 | Coefficient not powered | (2x³)² = 2x⁶ | Power goes to the letter only |
| Laws · 2 | Multiply the indices, multiply the coefficients | 3x² × 4x⁵ = 12x¹⁰ | "Everything gets multiplied" |
| Laws · 3 | Different bases combined | 2³ × 3² = 6⁵ | Treats base and index independently |
| Laws · 3 | Bases multiplied too | 2³ × 2⁴ = 4⁷ | Multiplies the bases as well as adding |
| Special · 1 | Zero power is zero / the base | 5⁰ = 0 or 5 | "Nothing to multiply" |
| Special · 1 | Root as halving | 25^{1/2} = 12.5 | "A half-power halves it" |
| Special · 2 | Flip missing / sign kept | (2/3)⁻² = 4/9 or −9/4 | Negative index = negative number |
| Special · 2 | Fractional power as ×, ÷ | 27^(2/3) = 18 | Reads 2/3 as a fraction to multiply by |
| Special · 2 | Zero power eats the coefficient | 3x⁰ = 1 | Power applied to 3x |
| Special · 3 | Negative fractional: sign kept | 8^{−2/3} = −4 | Negative index = negative answer |
| Special · 3 | Root misapplied | (16x⁴)^{−1/2} = 1/(4x⁴) | Square-roots the number only |
| Base · 1 | Divides instead of matches | 2ˣ = 32 → x = 16 | 32 ÷ 2 |
| Base · 1 | Wrong power of the base | 8 = 2⁴ | Counts to 8 in twos? Slips by one |
| Base · 2 | Converts only one side | 4ˣ = 8 → x = 3 | Rewrites 8 = 2³ and stops |
| Base · 2 | Laws before matching bases | 2⁵ × 4³ = 8⁸ | Adds indices, multiplies bases |
| Base · 3 | Multiplier applied to x only | 4^{x+1} = 2^{2x+1} | Forgets the +1 is inside the bracket |
| Base · 3 | 4ˣ is "2 or 4 times" 2ˣ | 4ˣ = 2a or 4a | Scales instead of squares |

---

## 2. Items (43)

`needs` only where an item depends on a pool option (option `value`s from `specs/indices.md`); general items always show. Exactly one **Start here** (diagnose) per tab × level.
Slide pieces: S = speakers · W = working (tap the wrong line) · O = lettered options (each wrong one names its misconception) · V = optional "Write it out" tile visual.

### Tab: Powers & Roots (`powersRoots`)

| id | Lv | Purpose | Title (no answer) | Question · answer | Teacher note | Links |
|---|---|---|---|---|---|---|
| `indices-pr-four-cubed` | 1 | diagnose — **Start here** | Who is right about 4³? | S: Kofi "4³ = 12", Mei "4³ = 64". **Mei** — 4×4×4 = 16×4 = 64; Kofi did 4×3. | Ask: how many 4s are multiplied? | ifSecure → `indices-pr-sq-vs-double` |
| `indices-pr-sq-vs-double` | 1 | diagnose | Square or double? | O: What is 5²? A 10 *(doubles)* B 25 ✓ C 7 *(adds)* D 52 *(writes the digits)*. | `5×5`, not `5+5`. | |
| `indices-pr-root-halving` | 1 | explain `needs: root` | Ruby's square root | S: Ruby "√36 = 18 because a root halves it". Answer: 6×6 = 36 (18×18 = 324); a square root undoes squaring. | Use a square picture: side 6, area 36. | |
| `indices-pr-n-squared-gt-2n` | 1 | extend | When is n² bigger than 2n? | Always/sometimes/never: n² > 2n. **Sometimes** — n=1: 1<2; n=2: 4=4; n=3: 9>6. | Let them find the switch point. | |
| `indices-pr-root-of-sum` | 2 | diagnose — **Start here** `needs: root` | Root of a sum | S: Amara "√16 + √9 = √25", Ben "√16 + √9 = 7". **Ben** — 4 + 3 = 7; √25 = 5. A root doesn't split over a sum. | Check by working out both sides. | |
| `indices-pr-two-times-five-squared` | 2 | explain `needs: combined` | Ben's 2 × 5² | S: Ben "2 × 5² = 100". Answer: the power comes first: 5² = 25, then 2 × 25 = 50 (100 = (2×5)²). | Brackets change the answer. | |
| `indices-pr-neg-three-squared` | 2 | diagnose `needs: negatives` | (−3)² | O: A −9 *(keeps the minus outside)* B 9 ✓ C −6 *(−3 × 2)* D 6 *(3 × 2)*. | (−3)(−3): two negatives. | |
| `indices-pr-minus-three-squared` | 2 | explain `needs: negatives` | Ben's −3² | S: Ben "−3² = 9". **No**: the power applies to the 3 only: −(3×3) = −9; (−3)² = 9. | Ask where the bracket is. | |
| `indices-pr-two-square-roots` | 2 | extend `needs: root` | Solutions of x² = 49 | Convince me: how many solutions? **Two**, x = 7 and x = −7; √49 = 7 is only the positive root. | Compare √49 and "solve x² = 49". | |
| `indices-pr-two-thirds-cubed` | 3 | diagnose — **Start here** | (2/3)³ | O: A 8/27 ✓ B 2/27 *(cubes the denominator only)* C 6/9 *(multiplies by 3)* D 8/9 *(cubes the numerator only)*. | Cube the whole fraction. | |
| `indices-pr-root-fraction` | 3 | explain `needs: root` | Leo's fraction root | S: Leo "√(9/25) = 3/25". Answer: root both parts → 3/5. | Check: (3/25)² ≠ 9/25. | |
| `indices-pr-square-below-one` | 3 | extend | Squaring small numbers | Always/sometimes/never: squaring a number between 0 and 1 makes it smaller. **Always** (0.5² = 0.25). Contrast with numbers > 1. | Use (2/3)² = 4/9. | |

### Tab: Index Laws (`indexLaws`)

| id | Lv | Purpose | Title (no answer) | Question · answer | Teacher note | Links |
|---|---|---|---|---|---|---|
| `indices-il-a2-a3` | 1 | diagnose — **Start here** | a² × a³ | S: Jamal "a⁶", Priya "a⁵". **Priya** — a×a × a×a×a: five a's. | Have them write it out (deck slide 1). | ifNotSecure → `indices-il-power-of-power-six` |
| `indices-il-divide-count` | 1 | diagnose `needs: divide` | a⁶ ÷ a² | O: A a³ *(divided the indices)* B a⁴ ✓ C a⁸ *(added)* D 1⁴ *(cancelled the bases)*. | Cancel pairs. | |
| `indices-il-power-of-power-six` | 1 | explain `needs: powerOfPower` | (a²)³ by writing out | Explain why (a²)³ = a⁶, not a⁵: a²·a²·a² — three lots of two. | Two rows of three (area picture). | |
| `indices-il-multiply-or-add` | 1 | extend | Add or multiply the indices? | Always/sometimes/never: aᵐ × aⁿ = a^(m×n). **Sometimes** — only when m + n = m × n (m = n = 2). | A coincidence worth knowing. | |
| `indices-il-two-x-cubed-squared` | 2 | diagnose — **Start here** `needs: coefficients` | (2x³)² | O: A 2x⁶ *(coefficient not squared)* B 4x⁶ ✓ C 4x⁵ *(added the indices)* D 2x⁵ *(both slips)*. | Bracket is a power of everything inside. | |
| `indices-il-twelve-x-ten` | 2 | explain `needs: coefficients` | Mei's product | S: Mei "3x² × 4x⁵ = 12x¹⁰". Answer: coefficients multiply (12) but indices **add** (7): 12x⁷. | Split into two jobs. | |
| `indices-il-make-24x7` | 2 | extend `needs: coefficients` | Make 24x⁷ | Make your own: two terms with product 24x⁷. Examples: 6x² × 4x⁵, 3x × 8x⁶, 12x⁴ × 2x³. | Coefficient pairs of 24, indices summing to 7. | |
| `indices-il-two-then-three` | 3 | diagnose — **Start here** | Different bases | S: Kofi "2³ × 3² = 6⁵", Ruby "you can't combine the bases; it's 72". **Ruby** — 8 × 9 = 72; 6⁵ = 7776. | Laws need the same base. | ifNotSecure → `indices-il-bases-multiplied` |
| `indices-il-bases-multiplied` | 3 | diagnose | 2³ × 2⁴ | O: A 2⁷ ✓ B 4⁷ *(multiplied the bases too)* C 2¹² *(multiplied the indices)* D 4¹² *(both)*. | | |
| `indices-il-unsquared-coefficient` | 3 | explain `needs: coefficients` | Spot the error | W: (2x³y)² × 3xy⁴ — Line 1 "(2x³y)² = 2x⁶y²" ← first wrong (2 not squared); Line 2 "2 × 3 = 6"; Line 3 "= 6x⁷y⁶". Correct: 12x⁷y⁶. | | |
| `indices-il-x-ten-pairs` | 3 | extend | xᵐ × xⁿ = x¹⁰ | How many answers can you make? Positive integers m, n with m + n = 10: **9** ordered pairs (m = 1…9). | Ask for the pattern. | |

### Tab: Negative & Fractional (`specialPowers`)

| id | Lv | Purpose | Title (no answer) | Question · answer | Teacher note | Links |
|---|---|---|---|---|---|---|
| `indices-sp-five-zero` | 1 | diagnose — **Start here** `needs: zero` | 5⁰ | O: A 0 *(nothing to multiply)* B 1 ✓ C 5 *(the base alone)* D 50 *(writes 5 then 0)*. | Link to 5³ ÷ 5³. | |
| `indices-sp-zero-division` | 1 | explain `needs: zero` | Why a⁰ = 1 | Use a³ ÷ a³ to show a⁰ = 1: anything ÷ itself = 1, and the law gives a^(3−3) = a⁰. | Deck slide 4. | |
| `indices-sp-half-power` | 1 | diagnose `needs: unitFraction` | 25^½ | S: Kofi "25^½ = 12.5", Amara "= 5". **Amara** — a ½ power is a square root. | 5×5 = 25. | |
| `indices-sp-two-to-minus-three` | 1 | extend `needs: negative` | Is 2⁻³ negative? | Convince me using the pattern 2³=8, 2²=4, 2¹=2, 2⁰=1, 2⁻¹=½ … 2⁻³ = 1/8. | Halve each time going down. | |
| `indices-sp-two-thirds-neg-two` | 2 | diagnose — **Start here** `needs: fractionBase` | (2/3)⁻² | O: A −4/9 *(negative sign)* B 9/4 ✓ C 4/9 *(squared, no flip)* D −9/4 *(flip and sign)*. | Flip, then square. | |
| `indices-sp-twenty-seven-two-thirds` | 2 | explain `needs: generalFraction` | Ben's 27^(2/3) | S: Ben "27^(2/3) = 18 (27 × 2 ÷ 3)". Answer: the denominator is a root, the numerator a power: (∛27)² = 3² = 9. | Root first keeps numbers small. | |
| `indices-sp-three-x-zero` | 2 | explain `needs: algebraic` | Priya's 3x⁰ | S: Priya "3x⁰ = 1". Answer: x⁰ = 1 so 3x⁰ = 3 × 1 = 3; (3x)⁰ = 1. | Compare 3x⁰ and (3x)⁰. | |
| `indices-sp-negative-sign` | 2 | extend `needs: negative` | Is a negative power negative? | Always/sometimes/never: a negative power gives a negative number. **Sometimes** — only if the base is negative: (−2)⁻³ = −1/8. 2⁻³ = 1/8. | Test positive and negative bases. | |
| `indices-sp-eight-neg-two-thirds` | 3 | diagnose — **Start here** `needs: combinedNegFrac` | 8^(−2/3) | O: A 1/4 ✓ B −4 *(negative index → negative answer)* C 1/64 *(power but no root)* D 4 *(no reciprocal)*. | Root, power, reciprocal. | |
| `indices-sp-sixteen-x-four` | 3 | explain `needs: algebraic` | Leo's (16x⁴)^(−½) | S: Leo "= 1/(4x⁴)". Answer: root the whole bracket: √16 = 4 and (x⁴)^½ = x², so 1/(4x²). | | |
| `indices-sp-one-quarter` | 3 | extend | Write 1/4 as a power | How many answers can you make? e.g. 2⁻², 4⁻¹, (½)², 16^(−½), 64^(−⅓), 8^(−⅔). | Mix integer and fractional indices. | |

### Tab: Common Base (`commonBase`)

| id | Lv | Purpose | Title (no answer) | Question · answer | Teacher note | Links |
|---|---|---|---|---|---|---|
| `indices-cb-two-to-x-32` | 1 | diagnose — **Start here** `needs: solveIndex` | Solve 2ˣ = 32 | S: Ben "x = 16", Amara "x = 5". **Amara** — 32 = 2⁵; 16 ×2 = 32 is a ×, not a power. | Match the bases. | |
| `indices-cb-eight-is-two-four` | 1 | explain `needs: writeAsPower` | Ruby's 8 = 2⁴ | S: Ruby "8 = 2⁴". Answer: 2⁴ = 16; 8 = 2×2×2 = 2³. | Counting factors of 2. | |
| `indices-cb-powers-up-to-100` | 1 | extend `needs: writeAsPower` | Powers up to 100 | How many answers can you make? Powers of 2 up to 100: 2, 4, 8, 16, 32, 64 (6); of 3: 3, 9, 27, 81 (4). Any in both lists? (None, except 1 = 2⁰ = 3⁰.) | Powers table. | |
| `indices-cb-four-to-x-eight` | 2 | diagnose — **Start here** `needs: solveIndex` | Solve 4ˣ = 8 | O: A x = 2 *(4×2 = 8)* B x = 3/2 ✓ C x = 3 *(converted only the 8)* D x = 1/2 *(4 ÷ 8)*. | Both to base 2. | |
| `indices-cb-eight-to-the-eight` | 2 | explain `needs: evaluate` | Jamal's product | S: Jamal "2⁵ × 4³ = 8⁸". Answer: different bases — write 4³ = 2⁶, so 2⁵ × 2⁶ = 2¹¹ = 2048. | | |
| `indices-cb-two-x-four-x` | 2 | extend | 2ˣ × 4ˣ | Convince me: 2ˣ × 4ˣ = 8ˣ for every x. 4ˣ = 2²ˣ, so 2^(x+2x) = 2^(3x) = 8ˣ. | | |
| `indices-cb-four-x-in-a` | 3 | diagnose — **Start here** | 4ˣ in terms of a | S/O: Given 2ˣ = a. A a² ✓ B 2a *(4 = 2×2, so doubles)* C 4a *(4 times)* D a⁴ *(squares twice)*. | 4ˣ = (2ˣ)². | |
| `indices-cb-forgot-the-one` | 3 | explain `needs: solveIndex` | Spot the error | W: 4^(x+1) = 8^(x−1). Line 1 "2^(2x+1) = 2^(3x−3)" ← first wrong (+1 not doubled; should be 2x+2); Line 2 "2x + 1 = 3x − 3"; Line 3 "x = 4". Correct x = 5. | Multiply the whole index. | |
| `indices-cb-four-eq-eight` | 3 | extend `needs: solveIndex` | 4ˣ = 8ˣ | Convince me there is only one solution: 2^(2x) = 2^(3x) → x = 0 (4⁰ = 8⁰ = 1). | | |

### Follow-up routes

`ifNotSecure` / `ifSecure` point each tab's L2 diagnose back to its L1 write-it-out item and each L3 diagnose back to its L2 explain.

---

## 3. Acceptance reference

Asserted in `src/tests/indicesDepth.test.ts` with an independent integer/rational calculator:

- Powers: 4³ = 64 (not 12); 5² = 25; 6² = 36 (18² = 324); (−3)² = 9, −3² = −9; (2/3)³ = 8/27 (2/27, 8/9 wrong); √(9/25) = 3/5; √16 + √9 = 7 ≠ √25 = 5; 2 × 5² = 50 (100 = (2×5)²).
- Laws: a²×a³ = a⁵; a⁶÷a² = a⁴; (a²)³ = a⁶; 2³×3² = 72, 6⁵ = 7776; 2³×2⁴ = 2⁷ = 128 (4⁷ = 16384); (2x³)² = 4x⁶; 3x²×4x⁵ = 12x⁷; (2x³y)² × 3xy⁴ = 12x⁷y⁶; xᵐ×xⁿ = x¹⁰ has 9 pairs.
- Special: 5⁰ = 1; 25^½ = 5; (2/3)⁻² = 9/4; 27^(2/3) = 9 (18 wrong); 3x⁰ = 3; 8^(−2/3) = 1/4 (−4, 1/64, 4 wrong); (16x⁴)^(−½) = 1/(4x²); every one of 2⁻², 4⁻¹, (½)², 16^(−½), 64^(−⅓), 8^(−⅔) equals 1/4.
- Base: 2⁵ = 32; 4^(3/2) = 8; 2⁵ × 4³ = 2¹¹ = 2048 (8⁸ wrong); 4^(x+1) = 8^(x−1) → x = 5 (check 4⁶ = 8⁴ = 4096; the wrong line gives x = 4 which fails); powers of 2 up to 100 = 6, of 3 = 4; 4ˣ = 8ˣ only at x = 0.
- Structure: unique ids `indices-<slug>`, diagnose + explain + extend per tab × level, one Start here per tab × level, every wrong option names a misconception, every `needs` names a real option, every default-option set still shows all three purposes per tab and level, and no single option leaves fewer than 3 items.

## 4. Tool follow-ups

- The Level 1 `-power-of-power-six` item needs the `powerOfPower` option; its answer slide is the best place for the "Write it out" scaffold.
- Depth items do not replace the generator's "Is it correct?" ideas; if wanted later, a mistake-spotting sub-tool would be its own spec.
