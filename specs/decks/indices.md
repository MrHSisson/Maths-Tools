# Teach Deck Spec: Indices

**Status:** draft <!-- needs one new scene type (`indexExpand`) — see §3 and §5 -->

Deck for the **Indices** tool (`specs/indices.md`, `src/tools/Number/Indices.tsx` once built). Paired with the
Depth bank in `specs/depth/indices.md`. **Parked-gated** like every deck today (`parkedMode`, `?parked=1`);
it must never be *needed* by the tool — the worked example stands alone (see `specs/indices.md` §3 "Shared
rules" — the expand-first line stays in the Level 1 worked examples).

---

## 1. Overview

| Field | Value |
|---|---|
| Tool this deck attaches to | Indices (`teachingSlides` is one array per tool, not per tab — the deck covers all four topics in order) |
| Topic taught | Why the laws of indices work: write the powers out in full, count the factors. The same picture then explains the zero power and the negative power. |
| Categories filled | Concepts · True or False · Spot the Mistake (all three) |

**Teaching intent.** The laws are usually taught as three rules to memorise, and every misconception in the
SoL (`a²×a³ = a⁶`, `(a²)³ = a⁵`, `a⁰ = 0`, `2⁻³ = −8`) comes from holding a rule without the picture
behind it. The deck writes each power out as a row of identical **factor tiles**, so students *count* where
the law comes from — and the zero and negative powers fall out of the division picture instead of being
declared. It removes the need to re-expand in every worked example.

---

## 2. Categories

| Category | Providing now? | One-line aim |
|---|---|---|
| Concepts (`concept`) | Yes | I-do ×, We-do ÷ (the inverse of the I-do), You-do power of a power; then zero and negative powers from the same ÷ picture; same base only. |
| True or False (`trueFalse`) | Yes | Six statements, each a classic wrong rule or its correct twin. |
| Spot the Mistake (`spotMistake`) | Yes | Three wrong lines of working, each a different law. |

---

## 3. Slides — per category

### The one new scene: `indexExpand`

**New scene type needed? Yes.** Add to `TeachScene`:

```ts
| { type: "indexExpand"; law: "multiply" | "divide" | "power";
    base: string | number;   // "x" or a prime 2/3/5/7
    m: number; n: number;    // see below
    predict?: boolean }      // inserts one extra beat after the tiles are drawn: the count and result stay hidden ("?") while the class decides (You-do), like `split`
```

**Representation (closest core family: prime-factor tiles).** One **factor tile** = one copy of the base,
drawn like the existing prime tiles: numeric bases 2/3/5/7 use the existing `tileColor` keyed by the prime;
letter bases use a navy tile with the letter. Same base → same tile, always. Groups (`x³`, `x⁵`) are marked by a
labelled bracket underneath, not by colour, because the *whole point* is that they are the same factor. This
is an extension of prime-factor tiles ("a tile is one factor"), not a seventh representation; the power-of-a-power
layout is an **array of n rows × m tiles**, which is also the area-model picture students meet later.

Standing scene contract applies: beat count derived from the scene, all space reserved up front (opacity,
not mounting), animate only opacity/transform. Tiles are authored large; ≤ 8 tiles in a row, ≤ 12 in total.

| law | m, n | beats (max step = beats − 1) | what each press does |
|---|---|---|---|
| `multiply` | `x^m × x^n` | 5 (+1 `predict`) | 0 shows `x^m × x^n` · 1 writes `x^m` as m tiles · 2 writes `x^n` as n tiles · 3 one bracket over all m+n tiles, counted · 4 `= x^{m+n}` |
| `divide` | `x^m ÷ x^n` as a fraction | 6 (+1 `predict`) | 0 the fraction `x^m / x^n` · 1 top written out (m tiles) · 2 bottom written out (n tiles) · 3 the tiles cancel in matching pairs (n pairs struck; the unmatched stay lit) · 4 what is left is counted (m−n on top if m>n; **nothing — a single 1** if m=n; n−m on the bottom if n>m) · 5 the result: `x^{m−n}`; for m=n `1 = x^0`; for n>m `1/x^{n−m} = x^{−(n−m)}` |
| `power` | `(x^m)^n` | 5 (+1 `predict`) | 0 shows `(x^m)^n` · 1 writes n copies of the bracket `x^m` · 2 opens each bracket into m tiles → an n × m array · 3 counts the tiles: n rows of m · 4 `= x^{m×n}` |

Beats are *max step + 1*; `sceneMaxStep` gains the three cases above. Captions below are one per beat (fewer
is allowed, the last persists — avoid that with `predict`). Add the new scene to the `TeachScene` union under a
new `// ── factor tiles (index laws) ──` comment, render in `SceneView`, test the beat counts alongside the
existing scene tests.

### Category: Concepts

One coherent example throughout: **base x, with the indices 3 and 5** (so the I-do and We-do are inverses of
each other, and the You-do reuses the 3).

#### Slide 1 — kind: `anim` — phase: `iDo` — title: "Multiplying powers"
- **Scene:** `indexExpand`: law `multiply`, base `x`, m 3, n 5
- **New scene type needed?** yes (above)
- **Captions (one per beat):**
  1. "Here is $x^3 \\times x^5$. Two powers of the same base."
  2. "$x^3$ means three $x$'s multiplied: $x \\times x \\times x$."
  3. "$x^5$ means five $x$'s multiplied."
  4. "Join them. How many $x$'s are being multiplied altogether? Count: 8."
  5. "So $x^3 \\times x^5 = x^8$. The indices were **added**: $3 + 5 = 8$."
- **Misconception targeted:** `x³ × x⁵ = x¹⁵` (multiplying the indices), and `2³ × 2⁴ = 4⁷` (multiplying the bases — the tiles stay the same tile).

#### Slide 2 — kind: `anim` — phase: `weDo` — title: "Dividing powers"
- **Scene:** `indexExpand`: law `divide`, base `x`, m 8, n 3
- **Captions:**
  1. "Now undo it: $x^8 \\div x^3$, written as a fraction."
  2. "The top is eight $x$'s."
  3. "The bottom is three $x$'s."
  4. "Anything on the top matches something on the bottom: cancel them in pairs. (Ask: how many pairs?)"
  5. "Five $x$'s are left on the top."
  6. "So $x^8 \\div x^3 = x^5$. The indices were **subtracted**: $8 - 3 = 5$."
- **Misconception targeted:** cancelling bases (`2⁵ ÷ 2² = 1³`); dividing the indices (`x⁸ ÷ x² = x⁴` is a coincidence, so the numbers avoid it).

#### Slide 3 — kind: `anim` — phase: `youDo` — title: "Power of a power"
- **Scene:** `indexExpand`: law `power`, base `x`, m 3, n 2, `predict: true`
- **Captions (6 beats = 5 + the predict beat):**
  1. "$(x^3)^2$ means two lots of $x^3$."
  2. "Write out the two lots."
  3. "Open each bracket: three $x$'s in each. Two rows of three."
  4. "Predict: how many $x$'s altogether? Decide before we count." *(predict beat — count and result hidden)*
  5. "Count them: 6."
  6. "So $(x^3)^2 = x^6$. The indices were **multiplied**: $3 \\times 2 = 6$."
- **Misconception targeted:** `(x³)² = x⁵` (adding), and the link to `x³ × x² = x⁵` — same numbers, different picture, different answer.

#### Slide 4 — kind: `anim` — phase: `weDo` — title: "Zero power"
- **Scene:** `indexExpand`: law `divide`, base `x`, m 3, n 3
- **Captions:** 1. "$x^3 \\div x^3$. Something divided by itself." · 2. "Top: three $x$'s." · 3. "Bottom: three $x$'s." · 4. "Every $x$ on the top cancels one on the bottom." · 5. "Nothing is left — just 1." · 6. "But the law says $x^{3-3} = x^0$. So $x^0 = 1$."
- **Misconception targeted:** `x⁰ = 0`; `x⁰ = x`.

#### Slide 5 — kind: `anim` — phase: `weDo` — title: "Negative power"
- **Scene:** `indexExpand`: law `divide`, base `x`, m 3, n 5
- **Captions:** 1. "$x^3 \\div x^5$. The bottom is bigger this time." · 2. "Top: three $x$'s." · 3. "Bottom: five $x$'s." · 4. "Cancel in pairs: three pairs." · 5. "Two $x$'s are left — on the bottom: $\\dfrac{1}{x^2}$." · 6. "The law says $x^{3-5} = x^{-2}$. So $x^{-2} = \\dfrac{1}{x^2}$: a negative power means 'one over', not a negative number."
- **Misconception targeted:** `2⁻³ = −8`.

#### Slide 6 — kind: `static` — phase: `weDo` — title: "Same base only"
- **Body:**
  - text: "Compare $x^3 \\times x^5$ with $2^3 \\times 3^2$."
  - text: "In the first, every factor is the same tile, so we can count them. In the second there are two **different** tiles: $2 \\times 2 \\times 2 \\times 3 \\times 3$."
- **Reveal:** note (tone `good`, label "Remember"): "You can only add indices when the base is the same. $2^3 \\times 3^2 = 72$, which is not $6^5$."
- **Misconception targeted:** `2³ × 3² = 6⁵`.

### Category: True or False — all `static`, phase `youDo`

Each: `body` = the statement as `title` plus "Decide first." · `reveal` = `verdict` then a `note`.

| # | `title` (statement) | Verdict | Reveal note |
|---|---|---|---|
| 1 | $x^3 \times x^5 = x^{15}$ | false | Correct (good): three $x$'s then five more is $x^8$ — add the indices. |
| 2 | $2^3 \times 2^4 = 4^7$ | false | The base stays $2$ (the tile is unchanged): $2^3 \times 2^4 = 2^7$. |
| 3 | $(x^3)^2 = x^6$ | true | Two rows of three $x$'s = 6. |
| 4 | $x^0 = 0$ | false | $x^3 \div x^3 = 1$, and the law gives $x^0$. |
| 5 | $2^3 \times 3^2 = 6^5$ | false | Different bases: $8 \times 9 = 72$. $6^5 = 7776$. |
| 6 | $x^{-2}$ is a negative number | false | For positive $x$ it is $\dfrac{1}{x^2}$, which is positive. |

### Category: Spot the Mistake — all `static`, phase `youDo`

| # | `body` (the working shown) | `reveal` |
|---|---|---|
| 1 | text: "Kofi simplifies $x^6 \\div x^2$." · math: "$x^6 \\div x^2 = x^3$" | note (bad, "Mistake"): he divided the indices, $6 \\div 2$. · note (good, "Fix"): subtract — $6 - 2 = 4$, so $x^4$. |
| 2 | text: "Mei expands $(2x^3)^2$." · math: "$(2x^3)^2 = 2x^6$" | note (bad): the bracket squares **everything** inside, including the $2$. · note (good): $(2x^3)^2 = 4x^6$. |
| 3 | text: "Leo simplifies $3x^2 \\times 4x^5$." · math: "$3x^2 \\times 4x^5 = 12x^{10}$" | note (bad): he multiplied the indices. · note (good): multiply the numbers, **add** the indices: $12x^7$. |

---

## 4. The coherent example(s)

- **Concepts:** base `x`; indices 3 and 5 (×, then ÷ undoing it: $x^3 \times x^5 = x^8$, $x^8 \div x^3 = x^5$); You-do $(x^3)^2 = x^6$ reuses the 3; zero power from $x^3 \div x^3 = 1$; negative power from $x^3 \div x^5 = \dfrac{1}{x^2} = x^{-2}$. Every number on every slide is re-checked in a test (counts of tiles, left-over count, result index).
- **True or False:** six statements as in §3; each verdict checked arithmetically (e.g. $2^3 \times 3^2 = 72$, $6^5 = 7776$).
- **Spot the Mistake:** the three corrected lines ($x^4$, $4x^6$, $12x^7$) checked.

## 5. Out of scope / future ideas

- **Changing the base** (4 = 2², 8 = 2³, then `4ˣ = 8`) and **fractional powers** are better as Depth items and the worked example than as a first-pass scene; a later `rewriteBase` scene could show two 2-tiles collapsing into one "4" tile. Not in this build.
- **Pattern table** for $2^3, 2^2, 2^1, 2^0, 2^{-1}…$ as an alternative route to the zero/negative power — design decision lives in `specs/indices.md` §6.
- **Ship status:** dev-gated like all decks. Coming out from behind `parkedMode` needs the deck-bar decision in `docs/BACKBENCH.md`; this deck would be a good second proof-of-format deck alongside Fractions +/−.
- A Skills-library drill-down could reuse the same scene later (`[[index-laws|laws of indices]]`); not planned.
