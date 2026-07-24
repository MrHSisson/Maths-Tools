# Computer Science — Roadmap

The friendly reference for **what's next on the Computer Science side**. This is the CS
parallel to `DEV_ROADMAP.md` (which covers Maths). Pick this up to see what's built, what
state it's in, and where to go next.

Status keys: ✅ done · 🚧 in progress · ⬜ not started.

> The **how** — the shared CS shell architecture and the extraction steps — lives in
> `CS_SHELL_PLAN.md`. This file is the **what/next**. Conventions for the whole repo are
> in `CLAUDE.md` (see its "Two subjects — repository map").

---

## What Computer Science is here

An OCR **J277 GCSE Computer Science** revision area. CS tools are **knowledge/revision**
tools, not question generators — a different product from the Maths tools, with their own
shell. Each tool covers a spec sub-topic through six activities: **Learn · Study · Cards ·
Quiz (+ Spot the Mistake) · Fill · Exam** (with synoptic questions and self-marking).

Guiding principles (from the 1.1.1 pilot brief):
1. **Spec fidelity** — every card/question carries a `specTag`; off-spec content is a
   clearly-flagged "Beyond spec" layer, excluded from default sessions.
2. **Exam realism** — J277 formats and mark tariffs; a synoptic section spanning sub-topics.
3. **Mobile-first** — short phone-sized revision sessions are the primary use.

---

## Built so far

- ✅ **1.1.1 — CPU Architecture** (`/cpu-architecture`). The pilot and reference tool.
  Learn (taught diagram walkthroughs with predict beats, animated data flow, analogies and
  a value trace), Study, Cards, Quiz + Spot-the-Mistake, Fill, Exam (MCQ / state / short /
  scenario / extended + synoptic, self-marking, model answers, command-word guidance).
- ✅ **1.1 — System Architectures** (`/system-architecture`). The original tool, left in
  place. Superseded in approach by the 1.1.1 rebuild; not on the new shell.

---

## Next steps

### 1. Extract the CS shell (so the rest are fast to build)
🚧 Tracked in `CS_SHELL_PLAN.md`. Increment 1 (shared `src/shared/cs/{ui,tooltip}.tsx`)
has landed. Finish the extraction (types → modes → representations → `CSShell`) so new
sub-topics are authored as **one data file**, not bespoke code. Do this before building many
more sub-topics, using 1.1.1 as the canary.

### 2. Roll through Computer Systems (Component 1, Paper J277/01)
Build each as a data topic on the shell, in spec order:

- ⬜ **1.1.2 — CPU Performance** (clock speed, cores, cache). Natural first follow-on;
  1.1.1 already links to it synoptically. Likely needs a **bar-compare** representation.
- ⬜ **1.1.3 — Embedded Systems**. Mostly definitional; few/no new diagrams.
- ⬜ **1.2.1 — Primary storage (RAM/ROM)**. The other 1.1.1 synoptic partner (MAR/MDR ↔ RAM).
- ⬜ **1.2.2–1.2.4 — Secondary storage / units / data representation**. Data representation
  needs number-line / place-value style representations.
- ⬜ **1.3 — Networks**, **1.4 — Network security**, **1.5 — Systems software**,
  **1.6 — Ethical/legal/environmental**. Networks/1.3 will need a **stack/topology**
  representation; the later strands are largely prose + scenario.

### 3. Synoptic bank (cross-topic)
Currently the synoptic questions live inside the 1.1.1 file. Once ≥2 topics exist, move them
to a **shared synoptic bank** keyed by spec-tag pairs (the `specTags: string[]` type already
supports this), so a synoptic question can be surfaced from either topic it spans.

### 4. Representations to build (the recurring design cost)
The CS "core representations" (see `CS_SHELL_PLAN.md`). Existing from 1.1.1: the **box
schematic** (to be generalised) and the **trace table**. Likely additions: **bar-compare**
(1.1.2), **place-value / number line** (data representation), **network stack / topology**
(1.3). Budget ~1–2 new representations per *strand*, not per topic.

---

## Nice-to-haves (deferred)

- **Spaced repetition / progress** — a Leitner box + per-spec-tag mastery. Deferred: needs
  persistence, and there's currently no account/storage layer.
- **RAG self-rating** on recall — same reason.
- A CS **topic validator** in CI (see `CS_SHELL_PLAN.md`) — add it alongside the shell so
  authoring mistakes fail at CI.
