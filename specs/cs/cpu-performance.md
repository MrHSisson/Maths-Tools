# CS Topic Spec: CPU Performance

**Status:** implemented

---

## 1. Overview

| Field | Value |
|---|---|
| Topic name | CPU Performance |
| Spec sub-topic | 1.1.2 |
| Topic id / URL path | `/cpu-performance` (id `1.1.2`) |
| Paper / component | Component 1 (J277/01) — Computer Systems |
| Card description | Clock speed, cache size and cores — and why the CPU with the biggest single number isn't always the fastest. |
| Activities provided | All six: Learn · Study · Cards · Quiz (+ Spot the Mistake) · Fill · Exam |

**Revision intent (2–3 sentences):** After this session a student should be able to define clock speed, cache size and number of cores, and explain how changing each one affects performance on its own. They should also be able to reason about the three **in combination** — that a CPU is not "fast" or "slow" on one figure alone, and that software has to be written to take advantage of multiple cores. It connects backward to 1.1.1 (cache's role in the fetch-execute cycle) and forward to 1.1.3 (embedded systems, where performance is deliberately traded off against cost/power/size).

---

## 2. Spec tags (spec fidelity)

| Tag id | Spec statement |
|---|---|
| `1.1.2-R1` | Clock speed: what it is, and the effect of changing it on system performance. |
| `1.1.2-R2` | Cache size: what it is, and the effect of changing it on system performance. |
| `1.1.2-R3` | Number of cores: what a core is, and the effect of changing the number of cores on system performance. |
| `1.1.2-R4` | The effects of changing more than one of these characteristics in combination (e.g. why a single characteristic can't be judged in isolation). |

---

## 3. Glossary

| Term | Student-facing definition (one sentence) |
|---|---|
| clock speed | How many instruction cycles a CPU carries out each second, measured in hertz (Hz) — modern CPUs run in gigahertz (GHz). |
| hertz (Hz) | The unit clock speed is measured in: one hertz is one cycle per second. |
| GHz | Gigahertz — one billion cycles per second, the usual unit for a CPU's clock speed. |
| clock cycle | One "tick" of the CPU's internal clock, in which it can carry out a basic step of processing. |
| cache | Small, very fast memory built close to the CPU that stores frequently used data/instructions so the CPU doesn't have to wait for slower RAM. |
| cache size | How much data the cache can hold — a bigger cache can keep more frequently used data close to the CPU. |
| core | An independent processing unit inside a CPU that can fetch, decode and execute instructions on its own. |
| multi-core | A CPU containing more than one core, able to work on more than one task at the same time. |
| thread | *Beyond spec* — a sequence of instructions a program can be split into, so different cores can run parts of it at once. |
| bottleneck | *Beyond spec* — the part of a system that limits overall performance, because everything else has to wait for it. |

---

## 4. Learn — taught lessons

### Lesson: What makes a CPU fast? — covers `1.1.2-R1, 1.1.2-R2, 1.1.2-R3`
- **Representation / scene:** none — a `kind: "text"` lesson (reasons across all three characteristics; no single diagram fits without clutter).
- **Analogy:** Think of the CPU as a kitchen: clock speed is how fast the chef works, cache is the worktop right next to the chef holding ingredients ready to hand, and cores are how many chefs are cooking at once.
- **Beats:** intro (three characteristics) → predict (double clock speed) → cache → predict (more cores) → none tells the whole story.

### Lesson: Clock speed — covers `1.1.2-R1`
- Hertz/GHz definition → predict (3.5→4.0 GHz) → higher is generally better but not the whole story.

### Lesson: Cache size — covers `1.1.2-R2`
- Cache proximity → predict + hit flow (core→cache) → miss flow (core→RAM) → predict (bigger cache = more hits).

### Lesson: Number of cores — covers `1.1.2-R3`
- Core definition → single vs multi-core → predict (4-core ≠ always 4× faster; software must split).

### Lesson: Combining the characteristics — covers `1.1.2-R4`
- **Analogy:** A kitchen with a lightning-fast chef is still slow if the worktop is tiny and there's only one chef when six orders come in.
- All-together → predict (high clock, tiny cache) → predict (8 cores, software uses 1–2) → single number is misleading.

*(Full beat text, predict prompts and answers are authored verbatim in `src/tools/ComputerScience/CpuPerformance.tsx`.)*

---

## 5–11. Cards / Cloze / Exam / Synoptic / Myths / Beyond spec / Info

Authored verbatim in `src/tools/ComputerScience/CpuPerformance.tsx` from the original
brief: 12 core flashcards (+2 beyond-spec), 4 cloze exercises, 8 exam questions
(mcq → 8-mark extended, with mark schemes and model answers), 2 synoptic questions
(spanning 1.1.1 and 1.1.3, per-tag attribution), 5 myths, and the three info-modal
sections. The correctness reference (each exam answer ↔ its mark scheme; each cloze
slot ↔ its word pool) was verified before the tool was enabled, and is CI-guarded by
`validateTopic` (`src/shared/cs/validate.ts`, run by `src/tests/cs-topics.test.ts`).

---

## 12. Out of scope / future ideas

- **No `bar-compare` representation built for this topic** — reused the existing
  `BoxSchematic` for two focused diagrams (cache hit/miss; four cores) per the shell's
  "reuse before building" principle. This increment added a small shell affordance —
  per-lesson `scene` selection (`TopicScenes.schematics` + `Lesson.scene`) and a
  `kind: "text"` for diagram-free lessons — so a topic can carry more than one diagram.
- **No Von Neumann/register depth here** — that's 1.1.1's territory; this topic draws
  on cache's *existence* synoptically, not the fetch-execute mechanics.
- Natural next synoptic partner once built: **1.2.1 Primary storage (RAM)**.
