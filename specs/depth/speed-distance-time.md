# Depth Bank: Speed, Distance & Time

**Status:** implemented — live — `src/tools/Proportion/SpeedDistanceTimeDepth.ts`, 32 items.

**Gating.** None — live for everyone. `__test.depthItems` exposes the bank to CI.

## Structure

Depth levels follow the **ideas**, not the tool's time-presentation levels (whole hours / factors of 60 / compound & awkward).
Items with no `tool` show on all four tabs (Speed · Distance · Time · Mixed); tab-specific items name `tool`, and where they depend on a
Question Option (m/s units, compound time, awkward minutes) they name it in `needs`. General items link only to general items, so a
follow-up button is never missing on a tab. The **Mixed** tab (random Speed / Distance / Time) has its own items about naming the unknown.

## 1. The misconceptions

| Level | Misconception | The wrong answer it produces | Why a student thinks it |
|---|---|---|---|
| 1 | Operates on whichever numbers are given | 150 miles in 3 h → 150 × 3 | Never asks what a speed means or which quantity is wanted |
| 1 | Speed means distance or time | "60 mph = 60 miles long / 60 hours" | Doesn't read "per hour" |
| 1 | Divides every time (or multiplies every time) | 80 km/h × 3 h → 80 ÷ 3 | One rule applied to all three questions |
| 1 | Units from habit | 100 m in 20 s → 5 km/h | Takes the unit from the template, not the quantities |
| 2 | Minutes treated as a decimal of an hour | 45 min → 0.45 h · 15 min → 0.15 h | An hour "has 100 minutes" |
| 2 | Per-hour speed times a time in minutes | 60 mph × 30 min = 1800 miles | Doesn't convert the time |
| 2 | Speed in the wrong unit | 6 km in 30 min → 0.2 km/h | Misses that 0.2 is per minute |
| 3 | Compound time as one string | 1 h 20 → 1.2 h · 130 | Reads the digits, not the units |
| 3 | Decimal hours read as minutes | 1.75 h → 1 h 75 min | Treats the decimal part as minutes |
| 3 | Average of speeds | 30 and 60 mph → 45 mph | Ignores the time spent at each speed |
| 3 | Unit conversion in one direction only | 72 km/h → 72 000 m/s | Changes km to m but not hours to seconds |

## 2. Items (32)

One **Start here** per level (Who is right? 150 miles in 3 hours · Minutes as hours · Hours and minutes).

| Level | Diagnose | Explain | Extend |
|---|---|---|---|
| 1 Which calculation? | Ali/Bea 150 mi in 3 h (**Start here**) · what a speed tells you · Time: 60 km at 15 km/h · Distance: 80 km/h for 3 h · Speed: 100 m in 20 s (*m/s*) · Mixed: which question needs 150 ÷ 3 | 12 km/h for 5 h divided · Zane without calculating · Mixed: Ravi's "bigger ÷ smaller" | Twice as long, twice as far? (sometimes) · three journeys at 40 mph |
| 2 Minutes and hours | 45 min as hours (**Start here**) · Kai/Lena 30 min · Speed: 8 km in 20 min · Distance: 90 km/h for 20 min · Time: 40 miles at 80 mph · Mixed: 45 miles in 30 min | 48 mph for 15 min (0.15 h) · Mo's 0.2 km/h · Mixed: time = distance × speed | A mile a minute · which is faster |
| 3 Awkward times & averages | 1 h 20 as hours (**Start here**) · Speed: 30 km in 1 h 30 (*compound*) · Distance: 12 km/h for 40 min (*awkward*) · Time: 140 km at 80 km/h · 72 km/h in m/s | Dev's average speed · 2.4 h as 2 h 40 | Doubling the speed halves the time (always) · km per minute vs km/h · Mixed: one journey, three questions |

## 3. Acceptance reference

Asserted in `src/tests/speedDistanceTimeDepth.test.ts` with exact fractions:

- L1: 150 ÷ 3 = 50 mph · 60 ÷ 15 = 4 h · 80 × 3 = 240 km · 100 ÷ 20 = 5 m/s (= 18 km/h) · 12 × 5 = 60 km · 60 × 2 = 120 miles · 3 ÷ 150 = 0.02 h (72 s) · 5 × 20 = 100 m.
- L2: 45 min = 0.75 h · 60 × 0.5 = 30 · 8 km in 20 min = 24 km/h · 90 km/h × 20 min = 30 km · 40 ÷ 80 = 0.5 h = 30 min · 45 miles in 30 min = 90 mph · 48 × 0.25 = 12 (not 7.2) · 6 km in 30 min = 12 km/h · 90 ÷ 60 = 1.5 h · 20 miles in 30 min = 40 mph vs 35 mph.
- L3: 1 h 20 = 4/3 h · 30 km in 1.5 h = 20 km/h · 12 km/h × 40 min = 8 km · 140 ÷ 80 = 1.75 h = 1 h 45 · 72 km/h = 20 m/s · 60 mi at 30 then 60 mph: 2 h + 1 h = 3 h, 120 mi → 40 mph · 2.4 h = 2 h 24 · 16 km in 80 min = 0.2 km/min = 12 km/h · 16 km/h × 1.5 h = 24 km.

## 4. Follow-ups (not built)

- A visual scaffold for the bank (ratio table scaling to 60 minutes) using the generic `custom` visual hook, as Rounding does with its number line.
