# Depth Bank Spec: <Tool Name>

**Status:** draft <!-- draft → ready → implemented -->

A completed copy of this template is everything Claude Code needs to author a tool's **Depth bank**
(fixed, curated questions in the tool's **Depth** mode) with zero follow-up questions. Save completed
briefs as `specs/depth/<tool-id>.md`. Reference bank: `src/tools/Number/OrderOfOperationsDepth.ts`.

> **What Depth is** (CLAUDE.md → "Depth"). A bank of well-thought-out, *not* randomly generated questions
> that add a level of thinking the generators can't: **diagnose** misconceptions, **explain** reasoning,
> **extend** thinking. The teacher dips in by purpose and level, in any order — it replaces the planned
> PowerPoint with something adaptive. Each item is two beats: the question, then the answer + reasoning.
> Where a tool already shows the model (pyramid, place value table…), Depth doesn't need a model deck.

## 1. The misconceptions (start here)
List the real misconceptions for this tool's topic, per level. This is the spine of the bank.

| Level | Misconception | The wrong answer it produces | Why a student thinks it |
|---|---|---|---|
| 1 | <!-- e.g. ignores priority --> | <!-- 7 + 2 × 3 = 27 --> | <!-- works left to right --> |

## 2. Items
Aim for diagnose, explain **and** extend at every level (the tests require it), one **Start here** diagnose per level.
For each item note any **needs** — the Question Options it depends on (e.g. a roots question needs the Roots focus on). It is greyed out in the picker when they're off, so a class building up never meets a question it can't. Leave blank if it is always possible.

| id (`<tool>-<slug>`) | Level | Purpose | Title (no answer in it) | Question | Options (misconception per wrong option) | Answer / reasoning | Teacher note | If not secure → | If secure → |
|---|---|---|---|---|---|---|---|---|---|

Each item is **two slides**: the question, then the answer. Slide pieces to use (all optional): **speakers** (a character's claim as a cartoon face with a speech bubble — name them from the cast: Ruby, Kofi, Mei, Ben, Amara, Leo, Priya, Jamal; see `docs/design/CAST.md`) · **working** (lines of working with a mistake — the class taps the line they think is wrong; give the first wrong line) · **options** (lettered tiles; every wrong one names its misconception) · **visual** (a small picture in the panel's corner, e.g. the BIDMAS pyramid). The answer slide shows all `answer` lines at once, so write them as a short stack. A pyramid visual gets a Scaffold switch in the side rail so the teacher can hide it. **Feathers** (the owl) speaks on every slide: add a short class-facing `prompt` (question slide) and `takeaway` (answer slide, never the answer) where the default line from the item's shape isn't good enough.

Item types to draw on: *Who is right?* · *Explain this mistake* · *Spot the error in working* · multiple choice
with misconception distractors · *Always / sometimes / never* · *Convince me* · *What's the same, what's different?* ·
*Make your own* · *How many answers can you make?*

## 3. Acceptance reference
Every number in the bank is checked in a test. List the claims to assert (e.g. `7 + 2 × 3 = 13`, and the wrong value each option gives).
