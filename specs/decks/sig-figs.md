# Teach Deck Spec: Significant figures (identifying, then rounding)

**Status:** draft <!-- Harry to approve → ready. Nothing is built from this yet. -->

Two lessons for the Rounding tool, built the way the Indices lessons are (`docs/design/LESSONS.md`, `specs/decks/indices.md`,
`src/tools/Number/IndicesLessons.ts`, `IndicesTeach.ts`): teach → practise → set → extend, decks of 16:9 slides, checks that play real Depth
items by id, hand-offs with presets, Developing-tools gated.

**Design principle: this is a hard concept, so be explicit.** One fixed set of rules (§1), one routine for every zero (§2), the same mark for
each kind of zero everywhere (§3), and a **Write this down** slide that ends every teaching deck. The wording in §1 is the single source: the decks,
the Depth items, the tool's Info panel and the worked-example notes all use it.

---

## 1. The rules (canonical wording — edit here, then everything follows)

Name the zero by **what is on each side of it**:

| Kind | Where it is | Rule | Examples |
|---|---|---|---|
| **Leading** zero | no non-zero digit to its **left** | **Never counts.** It only holds the place of the first digit. | 0.0**0**472 → 3 s.f. (4, 7, 2) |
| **Trapped** zero | a non-zero digit on **both** sides | **Always counts.** | 3**0**52 → 4 s.f.; 4.**0**071 → 5 s.f. |
| **Trailing** zero | no non-zero digit to its **right** | **Has a decimal point? Counts. No decimal point? Does not count.** | 120.**00** → 5 s.f.; 0.045**0** → 3 s.f.; 12**00** → 2 s.f. |

**Non-zero digits always count.** The **first significant figure** is the first non-zero digit, reading from the left.

Write-down version (the four lines on the Write-this-down slide):
1. The first significant figure is the first **non-zero** digit.
2. **Leading** zeros (before it) never count.
3. **Trapped** zeros (between non-zero digits) always count.
4. **Trailing** zeros (at the end) count **only if the number has a decimal point**.

Rounding to n significant figures (Lesson 2's write-down):
1. Count n significant figures from the first non-zero digit: the nth is the **rounding digit**.
2. Look at the next digit, the **decider**: 5 or more rounds up, less than 5 keeps.
3. After the rounding digit: **drop** the digits after a decimal point; **replace with zeros** the digits before the point (placeholders), so the size stays right.
4. **Keep trailing zeros after the point** in the answer (5.0, not 5): they show the accuracy. A 9 can carry (9.96 to 2 s.f. is 10).

## 2. The zero routine (three questions, asked of each zero in turn)

> **1. Is there a non-zero digit to my left?** No → I am a **leading** zero. **Does not count.**
> **2. Is there a non-zero digit to my right?** Yes → I am **trapped**. **Counts.**
> **3. (So I am trailing.) Does the number have a decimal point?** Yes → **counts.** No → **does not count.**

A deck slide plays this routine one question at a time on one zero; the tool's Worked Example and the Info panel say the same words.
Cover-and-count method for a whole number: cross out leading zeros, cross out trailing zeros if there is no decimal point, count what is left.

## 3. One mark for each kind (decks, tool picture, notes)

| Kind | Mark | Counts? |
|---|---|---|
| Non-zero digit | blue box | yes |
| Trapped zero | blue box with a **green underline** (already in the tool) | yes |
| Trailing zero, number has a point | blue box with an **amber underline** | yes |
| Trailing zero, whole number | grey box, struck "placeholder" | no |
| Leading zero | grey box | no |

The tool's digit boxes currently underline trapped zeros only; to match, add the amber underline for counting trailing zeros and keep a
one-line key under the boxes (only the kinds present).

## 4. Lesson 1 — Identifying significant figures (tab `identifySf`)

| # | Step | Content |
|---|---|---|
| 1 | **Teach, Level 1:** "Where do significant figures start?" (deck `sf-start`) | digit boxes build one press at a time on **4718**, then **3.526** (first non-zero digit, count to the nth); then a trapped zero on **3052** and **4.0071** (the zero is *between* — underlined, it counts); check (Depth `rnd-sfid-point`); **Write this down** (lines 1 and 3) |
| 2 | Practise, L1 | Whiteboard, Name one; Zeros none + trapped |
| 3 | Set it, L1 | worksheet, 10 |
| 4 | **Teach, Level 2:** "Zeros at the start and the end" (deck `sf-zeros`) | leading: **0.00305** (the zeros before the 3 only hold the place; grey); trailing with a point: **120.00**, **0.0450**; trailing without: **1200** and **45 000** (placeholders); the three-question routine on one zero at a time; a genuine hook for trailing zeros only: *12 cm and 12.00 cm* claim different accuracy; check (Depth `rnd-sfid-leading-zeros`, `rnd-sfid-trailing`); **Write this down** (all four lines + the routine) |
| 5 | Practise, L2 | all three tasks; leading + trailing |
| 6 | Set it, L2 | worksheet, 12 |
| 7 | Extend, L2 | Depth `rnd-sfid-zero-always` |
| 8–10 | Practise, Set it, Extend at L3 | all four kinds mixed; Depth `rnd-sfid-all-three` |

## 5. Lesson 2 — Rounding to significant figures (tab `sf`)

| # | Step | Content |
|---|---|---|
| 1 | **Think** (Depth bridge, new) | "Round 0.0472 to 2 decimal places and to 2 significant figures. Are they the same?" |
| 2 | **Teach, Level 1:** "Round to n significant figures" (deck `sf-round`) | **count n significant figures** (re-using lesson 1's rules): rounding digit, decider, keep or up, placeholders; worked **4,612 to 2 s.f.**, then a trapped zero as the decider **3.052 to 2 s.f. = 3.1**; check (new Depth); **Write this down** (rounding lines 1–3) |
| 3 | Practise, Set it, L1 | Zeros none + trapped; number line off (optional Labelled step shown once) |
| 4 | **Teach, Level 2:** "Zeros when you round" (deck `sf-round-zeros`) | leading zeros are skipped when counting: **0.0472 to 2 s.f. = 0.047**; trailing zeros kept in the answer: **4.96 to 2 s.f. = 5.0**; placeholders: **46,720 to 2 s.f. = 47,000**; check (new Depth); **Write this down** (all four rounding lines) |
| 5–6 | Practise, Set it, L2 | leading, trailing |
| 7 | Extend, L2 | new Depth |
| 8–10 | Practise, Set it, Extend at L3 | all four kinds mixed |

## 6. What needs building

- **Scenes** (extend `TeachScene` in `TeachingDeck.tsx`, beat count derived, opacity not mounting):
  - `sigFigs` — digit boxes `{ raw, focus: "first" | "nth" | "trapped" | "leading" | "trailing" | "all", n? }`: one mark per press (§3), an optional key, and the routine for a chosen zero.
  - `sfRound` — digit boxes with the nth significant figure as the rounding digit (blue), the decider (orange), a cut line, then the answer with placeholders / kept trailing zeros.
- **Decks** `sf-start`, `sf-zeros` (Identify) and `sf-round`, `sf-round-zeros` (Rounding), each ending on **Write this down** (a `note` block with the lines in §1) and a hand-off.
- **Depth:** the Identify bank already covers Lesson 1's checks. Lesson 2 needs a bridge and about six new items on the `sf` tab that follow the zeros ladder (the existing sf items follow the older "ideas" levels, so a lesson step can't name them).
- **Tool picture** gets the amber underline and the key line (§3); the Info panel and Worked Example text use §1's wording.
- **Tests:** `src/tests/sigFigLessons.test.ts` (the `indicesLessons.test.ts` pattern: every step names a real tab, level, option and Depth item) and a check that the deck's numbers agree with the independent significant-figure counter.
- **Docs:** `docs/PATCH_NOTES.md`, `docs/PROJECTS.md`, Harry's notes.

## 7. Defaults I have assumed (change any)

- Build **Lesson 1 first**, then use it to test the new scene before Lesson 2.
- Hook only for trailing zeros (measurement accuracy); the other decks open on the explanation.
- Lesson 2 opens on the d.p. versus s.f. bridge.
- The number line stays off in the lessons except one optional Labelled step in Lesson 2.
