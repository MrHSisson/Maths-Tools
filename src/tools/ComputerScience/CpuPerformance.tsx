import {
  CSShell,
  type CSTopic, type SpecTag, type FlashCard, type ClozeExercise,
  type ExamQuestion, type SynopticQuestion, type MythItem,
  type Lesson, type InfoSection, type SchematicConfig,
} from "../../shared/cs";

// ═══════════════════════════════════════════════════════════════════════════════
// OCR J277 — 1.1.2 CPU Performance (authored as pure data)
//
// The first CS sub-topic written entirely against the CSTopic contract: no bespoke
// UI, no shell code — just this content object plus a two-line default export. The
// shell (CSShell) owns everything the student sees. It proves the payoff of the
// CS-shell extraction (see CS_SHELL_PLAN.md, increment 8), alongside the CSTopic
// validator that makes authoring-as-data safe.
//
// Content follows the same three principles as the 1.1.1 pilot:
//   1. Spec fidelity   — every core item carries a `specTag` tracing to an OCR
//                        "Required" bullet; enrichment is flagged beyondSpec.
//   2. Exam realism    — J277/01 formats and tariffs, plus a synoptic section
//                        spanning 1.1.1 (CPU architecture) and 1.1.3 (embedded).
//   3. Mobile-first    — inherited wholesale from the shell.
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// SPEC TAGS — the source of truth for coverage auditing. The four 1.1.2
// requirements, plus the synoptic partners drawn in for cross-topic questions.
// (Partners are bare sub-topic ids — they are not requirement tags of THIS topic.)
// ─────────────────────────────────────────────────────────────────────────────

const SPEC_DESCRIPTIONS: Record<SpecTag, string> = {
  "1.1.2-R1": "Required: clock speed — what it is, and the effect of changing it on system performance.",
  "1.1.2-R2": "Required: cache size — what it is, and the effect of changing it on system performance.",
  "1.1.2-R3": "Required: number of cores — what a core is, and the effect of changing the number of cores on performance.",
  "1.1.2-R4": "Required: the effects of changing more than one of these characteristics in combination.",
  "1.1.1":    "Sub-topic 1.1.1 — CPU architecture (cache's role in the fetch-execute cycle). Drawn in for synoptic links only.",
  "1.1.3":    "Sub-topic 1.1.3 — Embedded systems (performance traded against cost, power and size). Drawn in for synoptic links only.",
  "1.2.1":    "Sub-topic 1.2.1 — Primary storage / RAM. Drawn in for synoptic links only.",
};

// ─────────────────────────────────────────────────────────────────────────────
// GLOSSARY — 1.1.2 core terms (+ a couple of clearly beyond-spec ones).
// ─────────────────────────────────────────────────────────────────────────────

const GLOSSARY: Record<string, string> = {
  "clock speed":  "How many instruction cycles a CPU carries out each second, measured in hertz (Hz) — modern CPUs run in gigahertz (GHz).",
  "hertz":        "The unit clock speed is measured in: one hertz (Hz) is one cycle per second.",
  "hertz (Hz)":   "The unit clock speed is measured in: one hertz is one cycle per second.",
  "GHz":          "Gigahertz — one billion cycles per second, the usual unit for a CPU's clock speed.",
  "clock cycle":  "One 'tick' of the CPU's internal clock, in which it can carry out a basic step of processing.",
  "cache":        "Small, very fast memory built close to the CPU that stores frequently used data/instructions so the CPU doesn't have to wait for slower RAM.",
  "cache size":   "How much data the cache can hold — a bigger cache can keep more frequently used data close to the CPU.",
  "core":         "An independent processing unit inside a CPU that can fetch, decode and execute instructions on its own.",
  "cores":        "Independent processing units inside a CPU, each able to fetch, decode and execute instructions on its own.",
  "multi-core":   "A CPU containing more than one core, able to work on more than one task at the same time.",
  "RAM":          "Random Access Memory — the much larger, slower main memory holding the running program and its data.",
  // beyond spec
  "thread":       "Beyond spec — a sequence of instructions a program can be split into, so different cores can run parts of it at once.",
  "bottleneck":   "Beyond spec — the part of a system that limits overall performance, because everything else has to wait for it.",
  "cache hit":    "Beyond spec (useful vocabulary) — when the data the CPU needs is already in the cache.",
  "cache miss":   "Beyond spec (useful vocabulary) — when the data the CPU needs is not in the cache, so it must fetch it from slower RAM.",
  "overclocking": "Beyond spec — running a CPU above its stated clock speed for extra performance, at the cost of extra heat and power.",
};

// ─────────────────────────────────────────────────────────────────────────────
// CARD DATA — core (Required) + clearly-flagged beyond-spec enrichment.
// ─────────────────────────────────────────────────────────────────────────────

const CARDS: FlashCard[] = [
  // ── R1: clock speed ─────────────────────────────────────────────────────────
  { id: 1, specTag: "1.1.2-R1", q: "What is clock speed?",
    a: "How many instruction cycles the CPU carries out each second", terms: ["clock speed"],
    distractors: ["The amount of data the CPU can store at once", "The number of cores in the CPU", "The speed data travels along the CPU's buses"] },
  { id: 2, specTag: "1.1.2-R1", q: "What unit is clock speed measured in?",
    a: "Hertz (Hz) — usually gigahertz (GHz) for modern CPUs", terms: ["hertz (Hz)", "GHz"],
    distractors: ["Bytes", "Bits per second", "Volts"] },
  { id: 3, specTag: "1.1.2-R1", q: "What effect does increasing clock speed have on performance (all else equal)?",
    a: "Performance improves — more cycles happen every second, so more instructions can be carried out", terms: ["clock speed"],
    distractors: ["Performance gets worse", "No effect", "It only affects storage capacity"] },
  { id: 101, specTag: "1.1.2-R1", beyondSpec: true, q: "Why can't clock speed just be increased indefinitely to make CPUs faster?",
    a: "Running the CPU faster generates more heat, which can damage the CPU or has to be managed", terms: [],
    distractors: ["It would use less electricity", "It would make the cache smaller", "Cores would stop working"],
    explain: "Not explicit in the spec wording, but useful context for the 'why not just crank up the clock speed' point examiners like in extended answers — heat and power are physical limits." },

  // ── R2: cache size ──────────────────────────────────────────────────────────
  { id: 4, specTag: "1.1.2-R2", q: "What is cache?",
    a: "Small, very fast memory built close to the CPU that stores frequently used data/instructions", terms: ["cache"],
    distractors: ["The CPU's main long-term storage", "A type of core", "The CPU's internal clock"] },
  { id: 5, specTag: "1.1.2-R2", q: "Why is cache faster to access than RAM?",
    a: "It is much smaller and physically much closer to the CPU", terms: ["cache", "RAM"],
    distractors: ["It uses a different type of electricity", "It only stores instructions, never data", "It runs at a higher clock speed than RAM"] },
  { id: 6, specTag: "1.1.2-R2", q: "What effect does increasing cache size have on performance?",
    a: "Performance tends to improve — more frequently used data can be kept close to the CPU, meaning fewer slow trips to RAM", terms: ["cache size", "RAM"],
    distractors: ["Performance always gets worse", "No effect on performance", "It only affects the number of cores"] },
  { id: 102, specTag: "1.1.2-R2", beyondSpec: true, q: "What is a \"cache hit\"?",
    a: "When the data the CPU needs is already in the cache", terms: ["cache hit"],
    distractors: ["When the cache is completely full", "When the CPU accesses RAM instead", "When two cores need the same data"] },

  // ── R3: number of cores ─────────────────────────────────────────────────────
  { id: 7, specTag: "1.1.2-R3", q: "What is a core?",
    a: "An independent processing unit inside the CPU that can fetch, decode and execute instructions on its own", terms: ["core"],
    distractors: ["A type of cache", "The unit clock speed is measured in", "The CPU's main storage device"] },
  { id: 8, specTag: "1.1.2-R3", q: "What can a multi-core CPU do that a single-core CPU can't?",
    a: "Work on more than one task/instruction stream at the same time", terms: ["multi-core"],
    distractors: ["Run at a higher clock speed automatically", "Store more data permanently", "Access RAM without needing a MAR/MDR"] },
  { id: 9, specTag: "1.1.2-R3", q: "What effect does increasing the number of cores generally have on performance?",
    a: "It can improve performance, especially for tasks that can be split and run at the same time", terms: ["cores"],
    distractors: ["It always doubles performance", "It has no effect on performance", "It reduces cache size"] },

  // ── R4: combining the characteristics ───────────────────────────────────────
  { id: 10, specTag: "1.1.2-R4", q: "Is a CPU with a higher clock speed always faster overall than one with a lower clock speed?",
    a: "Not necessarily — cache size and number of cores also affect overall performance", terms: ["clock speed", "cache size", "cores"],
    distractors: ["Yes, always", "No, clock speed has no effect on performance", "Only if it also has more RAM"],
    explain: "The classic misconception. A single headline number never captures real performance — the three characteristics only make sense together." },
  { id: 11, specTag: "1.1.2-R4", q: "Why might extra cores make little difference to performance for some software?",
    a: "If the software hasn't been written to split its work across multiple cores, the extra cores sit largely unused", terms: ["cores"],
    distractors: ["Extra cores always slow a CPU down", "Cores and clock speed can't be used together", "More cores always means less cache"] },
  { id: 12, specTag: "1.1.2-R4", q: "A CPU has a very high clock speed but a very small cache. Why might performance still suffer?",
    a: "It will keep having to make slow trips to RAM instead of using cache, so the high clock speed can't be fully used", terms: ["clock speed", "cache", "RAM"],
    distractors: ["A small cache always increases clock speed", "A small cache disables extra cores", "Clock speed and cache can't affect each other"] },
];

// ─────────────────────────────────────────────────────────────────────────────
// MISCONCEPTIONS — Spot-the-Mistake / True-or-False. Each targets a classic
// 1.1.2 error; the student judges it, then sees the correction.
// ─────────────────────────────────────────────────────────────────────────────

const MYTHS: MythItem[] = [
  { id: 1, specTag: "1.1.2-R1", statement: "A CPU with a higher clock speed is always faster than one with a lower clock speed.", isTrue: false,
    why: "Clock speed is only one factor — cache size and number of cores also affect overall performance, so a higher clock speed doesn't guarantee a faster CPU overall." },
  { id: 2, specTag: "1.1.2-R3", statement: "Doubling the number of cores always doubles a CPU's performance.", isTrue: false,
    why: "Extra cores only help if the software is written to split its work across multiple cores; software that isn't will see little or no benefit from the extra cores." },
  { id: 3, specTag: "1.1.2-R2", statement: "The CPU's cache and RAM store data in exactly the same way — cache is just faster.", isTrue: false,
    why: "Cache is much smaller and only holds frequently used data close to the CPU; RAM is the much larger main memory holding the whole running program and its data." },
  { id: 4, specTag: "1.1.2-R4", statement: "A bigger cache will always make a computer faster, no matter how slow its clock speed or how few cores it has.", isTrue: false,
    why: "Performance depends on all three characteristics together — a large cache can't make up for a very slow clock speed or too few cores for the task being run." },
  { id: 5, specTag: "1.1.2-R3", statement: "More cores means each individual instruction is carried out faster.", isTrue: false,
    why: "More cores let the CPU work on more instructions/tasks at the same time (in parallel) — it's a higher clock speed, not more cores, that carries out each individual instruction faster." },
];

// ─────────────────────────────────────────────────────────────────────────────
// FILL-IN (cloze) — one per requirement. Every [slot] answer is in the word pool.
// ─────────────────────────────────────────────────────────────────────────────

const CLOZE: ClozeExercise[] = [
  {
    id: 1, specTag: "1.1.2-R1", title: "Clock speed",
    text: "Clock speed is measured in [hertz], and tells you how many [cycles] the CPU carries out every second.",
    words: ["hertz", "cycles", "bytes", "cores"],
  },
  {
    id: 2, specTag: "1.1.2-R2", title: "Cache size",
    text: "A bigger [cache] means more frequently used data is kept close to the CPU, so it needs fewer slow trips to [RAM].",
    words: ["cache", "RAM", "core", "hertz"],
  },
  {
    id: 3, specTag: "1.1.2-R3", title: "Cores",
    text: "A CPU with more [cores] can work on more than one [task] at the same time.",
    words: ["cores", "task", "cache", "cycles"],
  },
  {
    id: 4, specTag: "1.1.2-R4", title: "Combining factors",
    text: "Extra cores only improve performance if the [software] has been written to make use of more than one core.",
    words: ["software", "RAM", "clock", "cache"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXAM QUESTIONS — realistic J277/01 formats and tariffs, all tagged 1.1.2.
// ─────────────────────────────────────────────────────────────────────────────

const EXAM_QUESTIONS: ExamQuestion[] = [
  {
    id: "x1", specTag: "1.1.2-R1", format: "mcq", marks: 1,
    prompt: "What unit is a CPU's clock speed measured in?",
    options: ["Bytes", "Hertz (Hz)", "Cores", "Bits"],
    answerIndex: 1,
    hint: "It's the same unit used for frequency generally.",
    markScheme: ["Hertz (Hz) (1)"],
    modelAnswer: "**Hertz (Hz).**",
  },
  {
    id: "x2", specTag: "1.1.2-R2", format: "mcq", marks: 1,
    prompt: "What is the main purpose of a CPU's cache?",
    options: [
      "To permanently store the operating system",
      "To hold frequently used data/instructions close to the CPU for fast access",
      "To increase the number of cores available",
      "To measure the CPU's clock speed",
    ],
    answerIndex: 1,
    hint: "Think about what happens on a cache hit.",
    markScheme: ["To hold frequently used data/instructions close to the CPU for fast access (1)"],
    modelAnswer: "**To hold frequently used data/instructions close to the CPU for fast access.**",
  },
  {
    id: "x3", specTag: "1.1.2-R3", format: "state", marks: 1,
    prompt: "State what is meant by a \"core\" in a CPU.",
    hint: "It's a unit, not a measurement.",
    markScheme: ["An independent processing unit within the CPU that can fetch, decode and execute instructions on its own (1)"],
    modelAnswer: "A core is **an independent processing unit inside the CPU that can fetch, decode and execute instructions on its own.**",
  },
  {
    id: "x4", specTag: "1.1.2-R1", format: "short", marks: 2,
    prompt: "Describe the effect of increasing a CPU's clock speed on its performance.",
    hint: "Link clock speed to how many cycles happen each second.",
    markScheme: [
      "A higher clock speed means more clock cycles occur per second (1)",
      "So the CPU can carry out (fetch/decode/execute) more instructions in the same amount of time, improving performance (1)",
    ],
    modelAnswer: "**A higher clock speed means more clock cycles happen every second.** As a result, **the CPU can carry out more instructions in the same amount of time**, so performance improves.",
  },
  {
    id: "x5", specTag: "1.1.2-R2", format: "short", marks: 3,
    prompt: "Describe the effect of increasing a CPU's cache size on its performance.",
    hint: "Think about how often the CPU has to go to RAM instead.",
    markScheme: [
      "A larger cache can store more frequently used data/instructions close to the CPU (1)",
      "This increases the chance the CPU finds what it needs in the cache (a 'hit') rather than RAM (1)",
      "This reduces the number of slower accesses to RAM, improving performance (1)",
    ],
    modelAnswer: "**A larger cache can hold more frequently used data close to the CPU.** This means **the CPU is more likely to find the data it needs in the cache rather than having to fetch it from RAM**, and **because cache is much faster than RAM, this reduces the time spent waiting**, improving overall performance.",
  },
  {
    id: "x6", specTag: "1.1.2-R3", format: "scenario", marks: 4,
    prompt: "{context} is deciding between a CPU with 2 cores and a CPU with 8 cores, both with the same clock speed and cache size. Explain how the number of cores could affect the performance {context} experiences.",
    contexts: [
      "A video editor rendering effects across many frames at once",
      "A student running one simple word-processing task",
    ],
    hint: "Think about whether the task can be split up to run on more than one core at the same time.",
    markScheme: [
      "More cores mean the CPU can work on more than one task/thread at the same time (1)",
      "If the software (e.g. video rendering) can split its work across cores, an 8-core CPU can complete it faster than a 2-core CPU (1)",
      "If the task isn't written to use multiple cores (e.g. simple word processing), most of the extra cores go unused (1)",
      "So the benefit of extra cores depends on whether the software can take advantage of them (1)",
    ],
    modelAnswer: "**A CPU with more cores can work on more than one task or thread at the same time.** For video rendering, which **can be split across many cores**, the 8-core CPU is likely to finish noticeably faster than the 2-core CPU. **For a simple word-processing task that isn't written to use multiple cores, most of the extra cores sit unused**, so the 8-core CPU may give little or no benefit over the 2-core one. **Overall, the benefit of extra cores depends on whether the software can actually make use of them.**",
  },
  {
    id: "x7", specTag: "1.1.2-R4", format: "scenario", marks: 4,
    prompt: "{context} buys a new laptop advertised as having \"the highest clock speed on the market\", but finds it feels no faster than their old laptop for everyday use. Suggest reasons why.",
    contexts: ["A student", "An office worker"],
    hint: "Clock speed is only one of three characteristics that affect performance.",
    markScheme: [
      "Performance depends on cache size and number of cores as well as clock speed, not clock speed alone (1)",
      "If the new laptop has a small cache, the CPU may still spend a lot of time waiting on slower RAM (1)",
      "If the new laptop doesn't have more/faster cores, tasks that rely on multiple cores won't improve (1)",
      "Everyday software may not be demanding enough to show a difference even with a faster clock speed (1)",
    ],
    modelAnswer: "**Performance depends on cache size and the number of cores as well as clock speed — a high clock speed alone doesn't guarantee a faster-feeling computer.** If the new laptop **has a small cache, the CPU may still make frequent slow trips to RAM**, cancelling out the benefit of the faster clock. Similarly, if the **number of cores hasn't improved**, tasks that could run in parallel won't speed up. Finally, **everyday tasks may simply not push the CPU hard enough** for the higher clock speed to be noticeable.",
  },
  {
    id: "x8", specTag: "1.1.2-R4", format: "extended", marks: 8,
    prompt: "A school is buying new computers and is choosing between several CPUs. Explain how clock speed, cache size and number of cores each affect a CPU's performance, and discuss why choosing the CPU with the single highest clock speed may not give the school the best-performing computers.",
    hint: "Cover all three characteristics individually, then explain why they must be considered together.",
    markScheme: [
      "Clock speed = number of cycles per second; a higher clock speed lets the CPU carry out more instructions per second (1)",
      "Cache size = amount of fast memory holding frequently used data close to the CPU; a bigger cache means fewer slow trips to RAM (1)",
      "Number of cores = how many independent processing units the CPU has; more cores allow more tasks/threads to run at the same time (1)",
      "A CPU with a high clock speed but small cache may still be slowed by frequent RAM access (1)",
      "A CPU with many cores only benefits software that is written to use multiple cores; single-threaded software sees little gain (1)",
      "Therefore overall performance depends on the combination of all three characteristics, not any one alone (1)",
      "A sensible, justified recommendation or comparison for the school's likely workload (e.g. balancing all three rather than maximising one) (1)",
      "Answer is well-structured with a sustained line of reasoning linking the characteristics together (1)",
    ],
    modelAnswer: "**Clock speed is the number of clock cycles the CPU carries out per second**, so **a higher clock speed generally lets the CPU process more instructions in the same time.** **Cache size is how much fast memory sits close to the CPU holding frequently used data**, so **a bigger cache reduces how often the CPU has to make slower trips to RAM.** **The number of cores is how many independent processing units the CPU has**, so **more cores let the CPU work on more tasks, or parts of the same task, at the same time — but only if the software is written to use them.** Choosing a CPU purely on the highest clock speed can be misleading: **a fast clock speed paired with a small cache may leave the CPU frequently waiting on RAM**, and **extra cores give little benefit to software that isn't designed to run across multiple cores.** **Overall performance depends on the combination of clock speed, cache size and number of cores together**, so **the school should weigh up all three against the kind of software the computers will actually run, rather than choosing on clock speed alone.**",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SYNOPTIC QUESTIONS — span sub-topics, with per-tag mark attribution.
// Per-tag markScheme tags are all declared in SPEC_DESCRIPTIONS (the validator
// checks these, NOT the bare top-level specTags — see CS_SHELL_PLAN.md caveat).
// ─────────────────────────────────────────────────────────────────────────────

const SYNOPTIC_QUESTIONS: SynopticQuestion[] = [
  {
    id: "s1", specTags: ["1.1.1", "1.1.2"] as SpecTag[], format: "scenario", marks: 4,
    prompt: "A CPU's cache size is increased. Explain the effect this has on the number of times the CPU needs to access RAM during the fetch-execute cycle, and what effect this has on performance.",
    hint: "Link what cache does during fetch (1.1.1) to why a bigger cache changes performance (1.1.2).",
    markScheme: [
      { tag: "1.1.1", points: [
        "Cache stores frequently used data/instructions close to the CPU (1)",
        "During fetch, the CPU can use data/instructions from cache instead of going to RAM (1)",
      ]},
      { tag: "1.1.2-R2", points: [
        "A bigger cache increases the chance of a cache hit, reducing the number of slow accesses to RAM needed (1)",
        "This reduces the time the CPU spends waiting during fetch, improving performance (1)",
      ]},
    ],
    modelAnswer: "**Cache stores frequently used data and instructions close to the CPU, so during the fetch stage the CPU can sometimes retrieve what it needs from cache instead of RAM.** **Increasing cache size increases the chance of a 'hit'**, meaning **fewer fetches need to go all the way out to the much slower RAM**, which reduces the time the CPU spends waiting and so **improves overall performance.**",
  },
  {
    id: "s2", specTags: ["1.1.2", "1.1.3"] as SpecTag[], format: "short", marks: 3,
    prompt: "Embedded systems (1.1.3) often use CPUs with a lower clock speed and fewer cores than a desktop computer. Suggest why this is an acceptable trade-off for many embedded systems.",
    hint: "Think about what an embedded system is actually built to do, and what it needs to save on.",
    markScheme: [
      { tag: "1.1.3", points: [
        "Embedded systems are built for one dedicated task, not general-purpose processing (1)",
        "They often need to be low-cost, low-power, and physically small (1)",
      ]},
      { tag: "1.1.2-R4", points: [
        "A lower clock speed/fewer cores use less power and generate less heat, which suits these constraints, while still being enough performance for the system's single dedicated task (1)",
      ]},
    ],
    modelAnswer: "**Embedded systems are designed to carry out one dedicated task, not general-purpose processing**, so they **don't need the high performance a desktop CPU offers.** Since embedded systems are often **required to be low-cost, low-power and physically small**, using **a CPU with a lower clock speed and fewer cores reduces power use and heat generation while still providing enough performance for that one task.**",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LESSONS — Learn mode: taught, stepped walkthroughs. Each diagram lesson names a
// FOCUSED scene (via `scene`) so the visual carries only what that lesson teaches:
// the cache lesson gets a CPU/cache/RAM hit-vs-miss diagram, the cores lesson gets
// a multi-core diagram. The overview, clock-speed and combining lessons are
// deliberately diagram-free (kind: "text") — they reason across all three
// characteristics, which no single diagram captures without clutter.
// ─────────────────────────────────────────────────────────────────────────────

const ALL_CORES = ["core1", "core2", "core3", "core4"];

const LESSONS: Lesson[] = [
  {
    id: "overview", title: "What makes a CPU fast?", specTags: ["1.1.2-R1", "1.1.2-R2", "1.1.2-R3"], kind: "text",
    analogy: "Think of the CPU as a kitchen: **clock speed** is how fast the chef works, **cache** is the worktop right next to the chef holding ingredients ready to hand, and **cores** are how many chefs are cooking at once.",
    steps: [
      { text: "Three characteristics affect how fast a CPU is: its **clock speed**, its **cache size**, and its **number of cores**. The next lessons take each in turn." },
      { predict: "If you doubled a CPU's **clock speed** and changed nothing else, what would you expect to happen?", text: "Roughly twice as many cycles happen every second, so instructions are carried out faster." },
      { text: "A bigger **cache** means more frequently-used data is kept close to the CPU, so it needs fewer slow trips out to RAM." },
      { predict: "If a CPU has more **cores**, what can it do that a single core can't?", text: "It can work on more than one task at the same time, instead of doing everything one instruction after another." },
      { text: "None of these figures tells the whole story on its own — the next lessons look at each in depth, then the last one looks at what happens when they're **combined**." },
    ],
  },
  {
    id: "clock", title: "Clock speed", specTags: ["1.1.2-R1"], kind: "text",
    steps: [
      { text: "**Clock speed** is measured in **hertz (Hz)** — the number of clock cycles the CPU carries out per second. A modern CPU runs at a few **gigahertz (GHz)** — billions of cycles every second." },
      { predict: "A CPU running at 3.5 GHz is upgraded to one running at 4.0 GHz, with nothing else changed. What happens to its performance?", text: "It can process more instructions per second, so performance increases." },
      { text: "A higher clock speed generally means better performance — but clock speed on its own doesn't decide how fast a computer feels; the other characteristics still matter." },
    ],
  },
  {
    id: "cache", title: "Cache size", specTags: ["1.1.2-R2"], scene: "cache",
    steps: [
      { text: "**Cache** sits inside/right next to the CPU. When the core needs data it has used recently, it checks the cache first.", highlight: ["cache", "core"] },
      { predict: "If the data the core wants **is** in the cache, is that faster or slower than going to RAM?", text: "Much faster — this is called a cache **hit**. The value only has to travel a short way.", highlight: ["cache", "core"], flow: { from: "core", to: "cache", label: "found it!", kind: "data" } },
      { text: "If the data isn't in the cache, the core has to fetch it from the much slower **RAM** instead — a cache **miss**. Notice how much further the value has to travel.", highlight: ["ram", "core"], flow: { from: "core", to: "ram", label: "wait…", kind: "slow" } },
      { predict: "So if you increase the **size** of the cache, what happens to the chance of a hit versus a miss?", text: "More data can be kept close by, so more requests are hits, and the CPU spends less time waiting on RAM — performance improves.", highlight: ["cache"] },
    ],
  },
  {
    id: "cores", title: "Number of cores", specTags: ["1.1.2-R3"], scene: "cores",
    steps: [
      { text: "A **core** is a complete, independent processing unit inside the CPU — it can fetch, decode and execute instructions on its own.", highlight: ["core1"] },
      { text: "A single-core CPU can only work on one instruction stream at a time. A **multi-core** CPU can run several at once — here all four are busy together.", highlight: ALL_CORES },
      { predict: "Would a 4-core CPU always run a single task four times faster than a 1-core CPU?", text: "Not necessarily — that task also needs to be written so it can be split across multiple cores; not all software is.", highlight: ALL_CORES },
    ],
  },
  {
    id: "combining", title: "Combining the characteristics", specTags: ["1.1.2-R4"], kind: "text",
    analogy: "A kitchen with a lightning-fast chef (clock speed) is still slow if the worktop is tiny (cache) and there's only one chef (cores) when six orders come in at once.",
    steps: [
      { text: "These three characteristics don't act alone — a CPU's overall performance depends on **all of them together**." },
      { predict: "A CPU has a very high clock speed but a tiny cache. Why might it still perform poorly on some tasks?", text: "It keeps having to wait on slow trips to RAM instead of using the cache, so the fast clock speed can't be fully used." },
      { predict: "A laptop has 8 cores but most everyday software only uses 1–2 of them. Will buying a laptop with even more cores make that software faster?", text: "Not by much — extra cores only help once software is written to use them; otherwise most cores sit idle." },
      { text: "So comparing CPUs on a single number (just clock speed, or just core count) can be misleading — real performance depends on the **combination**." },
    ],
  },
];

// ── CPU-performance representations as data (see CS_SHELL_PLAN.md) ─────────────
// TWO focused BoxSchematics, each named so its lesson picks it via `scene`. Reuses
// the existing schematic representation — no new scene renderer (the brief's
// "reuse before building" principle). A lesson with no diagram is kind: "text".
const ROLE_COLOR: Record<string, string> = { core: "#2563eb", cache: "#059669", mem: "#475569", data: "#059669", addr: "#2563eb", slow: "#d97706" };
const ROLE_TINT:  Record<string, string> = { core: "#dbeafe", cache: "#d1fae5", mem: "#f1f5f9", data: "#d1fae5", addr: "#dbeafe", slow: "#fef3c7" };

// Cache lesson: one core inside the CPU checks the cache (a short green "hit" hop) or
// has to reach all the way out to RAM (a long amber "miss" trip). The travel distance
// and the token colour together carry the speed contrast.
const CACHE_SCHEMATIC: SchematicConfig = {
  viewBox: "0 0 400 232",
  maxWidth: 520,
  roleColor: ROLE_COLOR,
  roleTint: ROLE_TINT,
  nodes: [
    { id: "core",  x: 36,  y: 54,  w: 150, h: 48, label: "Core",  role: "core" },
    { id: "cache", x: 36,  y: 140, w: 150, h: 44, label: "Cache", role: "cache" },
    { id: "ram",   x: 292, y: 74,  w: 92,  h: 92, label: "RAM",   role: "mem" },
  ],
  buses: [
    { x1: 222, y1: 120, x2: 292, y2: 120, hotWhen: ["ram", "core"] },
  ],
  containers: [
    { x: 12, y: 24, w: 210, h: 184, label: "CPU" },
  ],
  texts: [
    { x: 338, y: 182, text: "main memory", size: 8.5, weight: 600 },
  ],
};

// Cores lesson: four independent cores in the CPU, highlighted together to show
// parallel work. No RAM/flow — the teaching point is "how many run at once".
const CORES_SCHEMATIC: SchematicConfig = {
  viewBox: "0 0 372 176",
  maxWidth: 520,
  roleColor: ROLE_COLOR,
  roleTint: ROLE_TINT,
  nodes: [
    { id: "core1", x: 30,  y: 58, w: 72, h: 74, label: "Core 1", role: "core" },
    { id: "core2", x: 112, y: 58, w: 72, h: 74, label: "Core 2", role: "core" },
    { id: "core3", x: 194, y: 58, w: 72, h: 74, label: "Core 3", role: "core" },
    { id: "core4", x: 276, y: 58, w: 72, h: 74, label: "Core 4", role: "core" },
  ],
  containers: [
    { x: 12, y: 22, w: 348, h: 132, label: "CPU" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// INFO — the topic-info modal content.
// ─────────────────────────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  { title: "What's in scope (1.1.2)", items: [
    { label: "Clock speed (R1)", detail: "What it is, and the effect of changing it on performance." },
    { label: "Cache size (R2)", detail: "What it is, and the effect of changing it on performance." },
    { label: "Number of cores (R3)", detail: "What a core is, and the effect of changing the number of cores on performance." },
    { label: "Combined effects (R4)", detail: "Why the three characteristics have to be considered together — including that extra cores need software written to use them." },
  ]},
  { title: "Beyond spec (toggle in menu)", items: [
    { label: "Throttling, overclocking, hit/miss", detail: "Thermal throttling, overclocking and the 'hit'/'miss' terms are useful context but not required for 1.1.2. Kept out of default study, quiz and exam sessions; turn on 'Beyond spec' to include them, clearly flagged." },
  ]},
  { title: "How the modes differ", items: [
    { label: "Learn", detail: "Taught walkthroughs with predict-first prompts and an analogy, plus two focused diagrams — a cache hit/miss diagram and a multi-core diagram. Start here." },
    { label: "Study", detail: "First-pass reading — recognition, low effort." },
    { label: "Flashcards", detail: "Active recall — answer before you flip. The core revision mode." },
    { label: "Quiz", detail: "MCQ warm-up, or Spot-the-Mistake to confront the classic 'bigger number = always faster' misconceptions." },
    { label: "Exam", detail: "Real J277 formats and tariffs, including an 8-mark extended response spanning all three characteristics; self-mark against the scheme, reveal model answers, plus synoptic questions linking to 1.1.1 and 1.1.3." },
  ]},
];

// ─────────────────────────────────────────────────────────────────────────────
// TOPIC — assemble all of the above into one CSTopic. The shell owns every piece
// of UI. This file is pure data — the payoff of the CS-shell extraction.
// ─────────────────────────────────────────────────────────────────────────────

const CPU_PERFORMANCE: CSTopic = {
  id: "1.1.2",
  title: "CPU Performance",
  specTags: SPEC_DESCRIPTIONS,
  glossary: GLOSSARY,
  lessons: LESSONS,
  scenes: { schematics: { cache: CACHE_SCHEMATIC, cores: CORES_SCHEMATIC } },
  cards: CARDS,
  cloze: CLOZE,
  myths: MYTHS,
  exam: EXAM_QUESTIONS,
  synoptic: SYNOPTIC_QUESTIONS,
  info: INFO_SECTIONS,
};

// Named export so the CSTopic validator (src/tests/cs-topics.test.ts) can discover
// and check this topic without rendering the shell — the CS analog of `__test`.
export const __topic = CPU_PERFORMANCE;

export default function App() {
  return <CSShell topic={CPU_PERFORMANCE} />;
}
