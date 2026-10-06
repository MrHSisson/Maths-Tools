# Depth Bank: Rounding

**Status:** implemented (dev-gated, awaiting review) — `src/tools/Number/RoundingDepth.ts` (+ `RoundingDepthLine.ts`), 26 items.

**Gating.** Unlike other Depth banks, Rounding's bank only shows with **Developing-tools mode** on: `Rounding.tsx` passes
`depthItems={devMode ? DEPTH_ITEMS : undefined}`. Remove the `useDevMode` gate to take it live. `__test.depthItems` is always
exported so CI checks the bank either way.

## Structure

Depth levels follow the **ideas**, not the tool's number-line presentation levels (labelled line / blank line / question only).
Items with no `tool` show on every tab (nearest · d.p. · s.f.); tab-specific items name `tool` and the pool option they use as `needs`.
Every tab × level has diagnose, explain and extend items from the general set, so no tab is ever empty.

**Number-line visual.** Level 1 and the "keep the rest" items draw a number line (ends, marker, and — on the answer slide — the
halfway value, the half the number sits in and the ringed answer) via `visual: { type: "custom", render }` — a small shared hook
in `src/shared/depth.ts` / `DepthMode.tsx`; the line itself lives in `RoundingDepthLine.ts`. It is a **scaffold**: two separate switches in the slide's side rail ("Number line", then "Plot the point") — both off to begin with, kept between questions; the answer slide always shows the plotted line.

## 1. The misconceptions

| Level | Misconception | The wrong answer it produces | Why a student thinks it |
|---|---|---|---|
| 1 | Reads the tens digit and stops | 47 → 40 | Rounding = "keep the first digit"; never checks the other neighbour |
| 1 | Neighbours of the wrong size | 3,482 → between 3,480 and 3,490 | Mixes up what the target (10 / 100 / 1000) decides |
| 1 | Halfway stays down | 350 → 300 | "5 is not *more than* 5" |
| 1 | Already-nice numbers "need rounding" | 340 → "did something wrong" | Expects rounding always to change the number |
| 2 | **Rounds the digit but keeps everything else** | 31.04 → 30.04 · 482.6 → 500.6 | Treats rounding as editing one digit; common when decimals meet whole-number targets |
| 2 | Rounding digit confused with decider | 3,482 → decider "4" | Doesn't separate the digit kept from the digit that decides |
| 2 | Truncates instead of rounds | 2.678 → 2.67 | Cuts at the position without looking on |
| 2 | Rounds in stages | 3,462 → 3,460 → 3,500 → 4,000 | Each step "feels" like rounding, so repeat to the target |
| 2 | Drops the trailing zero | 4.296 → 4.3 | "A zero at the end is the same number" — loses the accuracy |
| 3 | Carry over a 9 mishandled | 396 → 390 · 3,100 | Cuts off, or writes 10 in a single place |
| 3 | Leading zeros counted as significant | 0.00472 → 0.0 | Counts from the decimal point, not the first non-zero digit |
| 3 | Digits dropped, not zeroed (s.f.) | 4,726 → 47 | Forgets place-holder zeros keep the size |
| 3 | Double rounding | 2.46 → 2.5 → 3 | A first rounding feels safe to build on |

## 2. Items (26)

`needs` is only used where an item depends on a pool option; general items always show. One **Start here** per level.

| Level | Diagnose | Explain | Extend |
|---|---|---|---|
| 1 Which way? | Leo/Mia 47 (**Start here**) · two neighbours of 3,482 (*nearest, 100*) · exactly halfway 350 | Sam 86 → 80 · Zara 340 unchanged | Always/sometimes/never: bigger than the original · smallest and largest that round to 500 |
| 2 Which digit decides? | Nina/Omar 31.04 (**Start here**, number line) · which digit decides, 3,482 (*nearest, 100*) · which digit decides, 6.738 (*d.p., 2*) · round or cut off 2.678 (*d.p., 2*) | Tia's staged rounding (*nearest, 1000*) · Priya 482.6 → 500.6 · Kai 4.296 → 4.3 (*d.p., 2*) | Always ends in 0 (47.3) · how many numbers round to 70 |
| 3 Edge cases & accuracy | Carrying over 396 (**Start here**) · leading zeros 0.00472 (*s.f., 2*) · keep the size 4,726 (*s.f., 2*) · carry 0.0996 (*d.p., 2*) | Eli's double rounding 2.46 · Zoe 0.0384 → 0.04 (*s.f., 2*) | Smallest/largest that round to 2.4 · s.f. vs d.p. accuracy (*s.f.*) · convince me 2.995 → 3.00 (*d.p., 2*) |

Follow-up routes (`ifNotSecure` / `ifSecure`) point easier items back to the level-1 line items and extensions to the range / double-rounding items.

## 3. Acceptance reference

Asserted in `src/tests/roundingDepth.test.ts` with an independent integer-only half-up rounder:

- L1: 47 → 50, 86 → 90, 340 → 340, 3,482 → 3,500 (halfway 3,450), 350 → 400, range 450–549 → 500 (100 numbers).
- L2: 31.04 → 30, 482.6 → 500, 47.3 → 50, 3,462 → 3,000 (stages: 3,460 → 3,500 → 4,000), 6.738 → 6.74, 2.678 → 2.68 (2.7 at 1 d.p.), 4.296 → 4.30, 65–74 → 70 (10 numbers; 100 at 1 d.p.).
- L3: 396 → 400, 0.00472 → 0.0047 (0.005 at 1 s.f.), 4,726 → 4,700 (4,730 at 3 s.f.), 0.0384 → 0.038 (0.04 at 1 s.f.), 0.0996 → 0.10, 2.995 → 3.00, 2.46 → 2 directly but 2.46 → 2.5 → 3, 2.35 ≤ x < 2.45 → 2.4, s.f. vs d.p. on 0.00472 and 472.3.

## 4. Tool follow-ups (not built)

- **"Keep the rest" in the tool itself.** Today's generator never gives a decimal to a *whole-number* target (nearest 10/100/1000 uses integers), so the 31.04 → 30.04 mistake cannot be practised or modelled in the tool. Candidate: a *Decimals in the number* option on the nearest sub-tool (Level 3 and worked example), with the working's last step stating that everything after the rounding digit is dropped.
