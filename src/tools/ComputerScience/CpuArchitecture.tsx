import {
  CSShell,
  type CSTopic, type SpecTag, type FlashCard, type ClozeExercise,
  type ExamQuestion, type SynopticQuestion, type MythItem,
  type Lesson, type InfoSection, type SchematicConfig, type TraceConfig,
} from "../../shared/cs";

// ═══════════════════════════════════════════════════════════════════════════════
// OCR J277 — 1.1.1 CPU Architecture (redesign pilot)
//
// This is a ground-up rebuild of the 1.1.1 sub-topic against three principles:
//   1. Spec fidelity   — every item carries a `specTag` tracing to an OCR
//                        "Required" bullet; nothing off-spec sits in the core deck.
//   2. Exam realism    — question `format`s and mark tariffs mirror J277/01, plus
//                        a dedicated synoptic section (questions spanning sub-topics).
//   3. Mobile-first    — single compact nav (bottom bar on phones), 44px touch
//                        targets, tap-to-open glossary, viewport-aware card sizing,
//                        swipe navigation. Not a responsive afterthought.
//
// It is a NEW tool at its own route; the original /system-architecture is untouched.
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// SPEC TAGS — the source of truth for coverage auditing
// ─────────────────────────────────────────────────────────────────────────────

const SPEC_DESCRIPTIONS: Record<SpecTag, string> = {
  "1.1.1-R1": "Required: the actions that occur at each stage of the fetch-execute cycle.",
  "1.1.1-R2": "Required: the role/purpose of each CPU component (ALU, CU, cache, registers) during the fetch-execute cycle.",
  "1.1.1-R3": "Required: the purpose of each register and what it stores (data or an address).",
  "1.1.1-R4": "Required: the difference between storing data and storing an address.",
  "1.1.2":    "Sub-topic 1.1.2 — CPU performance (clock speed, cores, cache). Drawn in for synoptic links only.",
  "1.2.1":    "Sub-topic 1.2.1 — Primary storage / RAM. Drawn in for synoptic links only.",
};

// Types, MARK_FORMATS, ExamFormat and COMMAND_GUIDE now come from ../../shared/cs.



// ─────────────────────────────────────────────────────────────────────────────
// GLOSSARY — 1.1.1 core terms (+ a few beyond-spec ones used in enrichment)
// ─────────────────────────────────────────────────────────────────────────────

const GLOSSARY: Record<string, string> = {
  "CPU":          "Central Processing Unit — fetches, decodes and executes instructions.",
  "ALU":          "Arithmetic Logic Unit — performs arithmetic calculations and logical comparisons.",
  "CU":           "Control Unit — coordinates the CPU's components and controls the flow of data.",
  "Control Unit": "Coordinates the CPU's components and controls the flow of data during the cycle.",
  "cache":        "Small, very fast memory close to the CPU holding frequently used data/instructions.",
  "register":     "A very fast, small storage location inside the CPU holding a value it is using now.",
  "registers":    "Very fast, small storage locations inside the CPU holding values it is using now.",
  "PC":           "Program Counter — stores the ADDRESS of the next instruction to fetch.",
  "Program Counter": "Stores the ADDRESS of the next instruction to be fetched.",
  "MAR":          "Memory Address Register — stores the ADDRESS of the memory location to access.",
  "MDR":          "Memory Data Register — stores the DATA read from, or to be written to, memory.",
  "ACC":          "Accumulator — stores the DATA result of a calculation done by the ALU.",
  "Accumulator":  "Stores the DATA result of a calculation performed by the ALU.",
  "RAM":          "Random Access Memory — volatile main memory holding programs/data in use.",
  "address":      "A number identifying WHERE a value is stored in memory (not the value itself).",
  "data":         "The actual value being stored or processed (not where it is).",
  "fetch":        "Stage 1 — the next instruction is copied from memory into the CPU.",
  "decode":       "Stage 2 — the Control Unit works out what the instruction means.",
  "execute":      "Stage 3 — the instruction is carried out (e.g. the ALU calculates).",
  "Von Neumann":  "Architecture where one memory stores both instructions and data.",
  // beyond spec
  "CIR":          "Current Instruction Register — holds the instruction being decoded/executed. (Beyond the named-register list.)",
  "data bus":     "Beyond spec — carries data between CPU and memory (bidirectional).",
  "address bus":  "Beyond spec — carries addresses from CPU to memory (unidirectional).",
  "control bus":  "Beyond spec — carries control signals (read/write/clock).",
  "L1":           "Beyond spec — smallest, fastest cache, inside each core.",
  "L2":           "Beyond spec — larger, slightly slower cache.",
  "L3":           "Beyond spec — largest, slowest cache, shared between cores.",
};

// ─────────────────────────────────────────────────────────────────────────────
// CARD DATA — core (Required) + clearly-flagged beyond-spec enrichment
// ─────────────────────────────────────────────────────────────────────────────

const CARDS: FlashCard[] = [
  // ── R1: fetch-execute cycle stages ──────────────────────────────────────────
  { id: 1, specTag: "1.1.1-R1", q: "What are the three stages of the fetch-execute cycle?",
    a: "Fetch, decode and execute", terms: ["fetch", "decode", "execute"],
    distractors: ["Read, process, write", "Load, compute, store", "Input, process, output"] },
  { id: 2, specTag: "1.1.1-R1", q: "What happens during the FETCH stage?",
    a: "The next instruction is copied from memory into the CPU", terms: ["CPU"],
    distractors: ["The Control Unit works out what the instruction means", "The ALU performs the calculation", "The result is written back to memory"] },
  { id: 3, specTag: "1.1.1-R1", q: "What happens during the DECODE stage?",
    a: "The Control Unit works out what the instruction means", terms: ["Control Unit"],
    distractors: ["The instruction is copied from memory into the CPU", "The ALU carries out the calculation", "The Program Counter is reset to zero"] },
  { id: 4, specTag: "1.1.1-R1", q: "What happens during the EXECUTE stage?",
    a: "The instruction is carried out — for example the ALU performs a calculation", terms: ["ALU"],
    distractors: ["The next instruction is fetched from memory", "The Control Unit decodes the instruction", "The address of the next instruction is stored"] },
  { id: 5, specTag: "1.1.1-R1", q: "What happens to the Program Counter during the fetch stage?",
    a: "It is incremented so it holds the address of the next instruction", terms: ["address"],
    distractors: ["It stores the result of the calculation", "It is copied into the Accumulator", "It is reset to zero after every instruction"],
    explain: "Incrementing the PC is what keeps the program moving — without it the CPU would fetch the same instruction forever. It happens during fetch, before the instruction is executed." },

  // ── R2: component roles ─────────────────────────────────────────────────────
  { id: 6, specTag: "1.1.1-R2", q: "What is the role of the ALU?",
    a: "Performs arithmetic calculations and logical comparisons", terms: [],
    distractors: ["Coordinates all of the CPU's components", "Stores the address of the next instruction", "Holds frequently used data close to the CPU"] },
  { id: 7, specTag: "1.1.1-R2", q: "What is the role of the Control Unit (CU)?",
    a: "Coordinates the CPU's components and controls the flow of data during the cycle", terms: ["CPU"],
    distractors: ["Performs all arithmetic and logical operations", "Stores the result of the last calculation", "Holds the data fetched from memory"],
    explain: "Easy to mix up with the ALU: the CU *directs*, the ALU *calculates*. The Control Unit never does arithmetic itself — it just tells everything else when to act." },
  { id: 8, specTag: "1.1.1-R2", q: "What is the purpose of cache in the CPU?",
    a: "Stores frequently used data and instructions close to the CPU for fast access", terms: ["CPU"],
    distractors: ["Permanently stores the operating system", "Stores the address of the next instruction", "Performs logical comparisons for the CPU"],
    explain: "Cache is fast because it is small and physically close to the CPU. This is the bridge to 1.1.2: more cache → fewer slow trips to RAM → better performance." },
  { id: 9, specTag: "1.1.1-R2", q: "What is the role of the registers in the CPU?",
    a: "Very fast, small storage locations that hold the values the CPU is working with right now", terms: ["CPU"],
    distractors: ["Large stores that replace the need for RAM", "Permanent storage for the operating system", "The part that decodes each instruction"] },

  // ── R3: each register and what it stores (data or address) ──────────────────
  { id: 10, specTag: "1.1.1-R3", q: "What does the Program Counter (PC) store?",
    a: "The address of the next instruction to be fetched", terms: ["address"],
    distractors: ["The result of the last calculation", "The data fetched from memory", "The instruction being decoded"],
    explain: "The PC stores an ADDRESS (where the next instruction is), not the instruction itself — holding the actual instruction is the CIR's job." },
  { id: 11, specTag: "1.1.1-R3", q: "What does the Memory Address Register (MAR) store?",
    a: "The address of the memory location to be read from or written to", terms: ["address"],
    distractors: ["The data read from memory", "The result of the last ALU operation", "The number of instructions executed"],
    explain: "The name gives it away: MAR = Memory ADDRESS Register → it holds an ADDRESS. It answers 'which location?', never 'what value?'." },
  { id: 12, specTag: "1.1.1-R3", q: "What does the Memory Data Register (MDR) store?",
    a: "The data that has just been read from, or is about to be written to, memory", terms: ["data"],
    distractors: ["The address of the memory location being used", "The address of the next instruction", "The result of a logical comparison"],
    explain: "MDR = Memory DATA Register → it holds DATA. Pair it with the MAR: the MAR picks the location, the MDR carries the value to or from it." },
  { id: 13, specTag: "1.1.1-R3", q: "What does the Accumulator (ACC) store?",
    a: "The data result of a calculation carried out by the ALU", terms: ["data", "ALU"],
    distractors: ["The address of the next instruction", "The address of the memory location to access", "The instruction currently being decoded"],
    explain: "The Accumulator 'accumulates' results — it holds DATA (a value), never an address. It's filled during the execute stage by the ALU." },
  { id: 14, specTag: "1.1.1-R3", q: "In the Von Neumann architecture, which four registers are used?",
    a: "The MAR, MDR, Program Counter and Accumulator", terms: ["MAR", "MDR", "Program Counter", "Accumulator"],
    distractors: ["The ALU, CU, cache and PC", "The PC, CIR, data bus and address bus", "The L1, L2, L3 and MDR"] },

  // ── R4: the difference between storing data and an address (the gap) ────────
  { id: 15, specTag: "1.1.1-R4", q: "What is the difference between storing an ADDRESS and storing DATA?",
    a: "An address says WHERE a value is in memory; data is the actual value itself", terms: ["address", "data"],
    distractors: ["An address is always larger than a piece of data", "Data is stored in the CPU, an address is stored in RAM", "There is no difference — the terms mean the same thing"],
    explain: "Think of a locker: the address is the locker *number* (where); the data is what's *inside* it (what). Both are just numbers — it's what they mean that differs." },
  { id: 16, specTag: "1.1.1-R4", q: "Which registers store an ADDRESS, and which store DATA?",
    a: "Addresses: the PC and MAR. Data: the MDR and Accumulator", terms: ["PC", "MAR", "MDR", "Accumulator"],
    distractors: ["Addresses: MDR and ACC. Data: PC and MAR", "All four registers store only data", "All four registers store only addresses"],
    explain: "A memory hook: the register whose name contains 'ADDRESS' (MAR) plus the PC hold addresses; the one containing 'DATA' (MDR) plus the ACC hold data." },
  { id: 17, specTag: "1.1.1-R4", q: "The MAR holds an address and the MDR holds data. Why does this matter?",
    a: "The MAR's address selects which memory location to use; the MDR then carries the value in or out of it", terms: ["MAR", "MDR"],
    distractors: ["Both actually hold the same address twice for safety", "The MDR chooses the location and the MAR holds the value", "Neither is needed if cache is used instead"],
    explain: "This is *why* there are two separate registers: one to say where (MAR) and one to carry what (MDR). Splitting the job keeps addressing and data-transfer independent." },

  // ── Beyond spec (excluded by default; clearly flagged in the UI) ────────────
  { id: 101, specTag: "1.1.1-R1", beyondSpec: true, q: "What does the Current Instruction Register (CIR) store?",
    a: "The instruction currently being decoded and executed", terms: [],
    distractors: ["The address of the next instruction", "The result of the last calculation", "The data read from memory"] },
  { id: 102, specTag: "1.1.1-R2", beyondSpec: true, q: "What are the three buses of the system bus?",
    a: "The data bus, the address bus and the control bus", terms: ["data bus", "address bus", "control bus"],
    distractors: ["The input, output and memory buses", "The fetch, decode and execute buses", "The L1, L2 and L3 buses"] },
  { id: 103, specTag: "1.1.1-R2", beyondSpec: true, q: "Is the address bus unidirectional or bidirectional?",
    a: "Unidirectional — addresses only travel from the CPU to memory", terms: ["address bus"],
    distractors: ["Bidirectional — addresses travel both ways", "Unidirectional — from memory to the CPU only", "It has no fixed direction"] },
  { id: 104, specTag: "1.1.1-R2", beyondSpec: true, q: "How do the three cache levels compare?",
    a: "L1 is smallest and fastest (per core), L2 is larger, L3 is largest and slowest (shared)", terms: ["L1", "L2", "L3"],
    distractors: ["L1 is largest and slowest, L3 is smallest and fastest", "All three levels are the same size", "L3 is inside each core, L1 is shared"] },
];

// ─────────────────────────────────────────────────────────────────────────────
// MISCONCEPTIONS — Spot-the-Mistake / True-or-False. Each statement targets a
// classic 1.1.1 error; the student judges it, then sees the correction.
// ─────────────────────────────────────────────────────────────────────────────

const MYTHS: MythItem[] = [
  { id: 1, specTag: "1.1.1-R3", statement: "The MDR holds the address of the memory location to be used.", isTrue: false,
    why: "That's the MAR's job. The MDR holds the DATA read from or written to memory — not the address." },
  { id: 2, specTag: "1.1.1-R3", statement: "The Program Counter stores the instruction currently being executed.", isTrue: false,
    why: "The PC stores the ADDRESS of the next instruction. The instruction being executed is held in the CIR." },
  { id: 3, specTag: "1.1.1-R2", statement: "Cache is just another name for RAM.", isTrue: false,
    why: "Cache is much smaller and faster than RAM, and sits inside or right next to the CPU to cut down slow RAM accesses." },
  { id: 4, specTag: "1.1.1-R4", statement: "The Accumulator stores an address.", isTrue: false,
    why: "The Accumulator stores DATA — the result of an ALU calculation. Addresses are held by the PC and MAR." },
  { id: 5, specTag: "1.1.1-R2", statement: "The Control Unit performs calculations.", isTrue: false,
    why: "The ALU performs calculations. The Control Unit only coordinates and directs — it never does arithmetic." },
  { id: 6, specTag: "1.1.1-R1", statement: "After an instruction is fetched, the PC is incremented to point to the next instruction.", isTrue: true,
    why: "Correct — this is what keeps the program moving from one instruction to the next." },
  { id: 7, specTag: "1.1.1-R1", statement: "During the fetch stage, the instruction is copied from RAM into the CPU.", isTrue: true,
    why: "Correct — fetch brings the next instruction from memory into the CPU, ready to be decoded." },
  { id: 8, specTag: "1.1.1-R2", statement: "The ALU decodes each instruction.", isTrue: false,
    why: "Decoding is done by the Control Unit. The ALU only executes arithmetic and logic once the instruction is decoded." },
  { id: 9, specTag: "1.1.1-R2", statement: "Registers are larger but slower than RAM.", isTrue: false,
    why: "The opposite: registers are tiny but the fastest storage in the whole computer — faster even than cache." },
  { id: 10, specTag: "1.1.1-R4", statement: "An address and a piece of data can look identical — both are just numbers.", isTrue: true,
    why: "Correct — the difference is meaning, not appearance: an address says WHERE, data is the value stored there." },
];

// ─────────────────────────────────────────────────────────────────────────────
// FILL-IN (cloze) — core keeps CIR as sequence scaffolding (allowed per spec note)
// ─────────────────────────────────────────────────────────────────────────────

const CLOZE: ClozeExercise[] = [
  {
    id: 1, specTag: "1.1.1-R1", title: "The fetch-execute cycle",
    text: "The CPU repeats the fetch-execute cycle. The [Program Counter] holds the [address] of the next instruction. This address is copied into the [MAR], and the instruction is fetched into the [MDR]. The [Control Unit] then [decodes] the instruction, and finally it is [executed]. After fetching, the Program Counter is [incremented].",
    words: ["Program Counter", "address", "MAR", "MDR", "Control Unit", "decodes", "executed", "incremented", "data", "ALU", "Accumulator", "reset"],
  },
  {
    id: 2, specTag: "1.1.1-R4", title: "Registers: data or address?",
    text: "Some registers store an address and some store data. The [PC] and the [MAR] both store an [address] — they say where a value is in memory. The [MDR] and the [Accumulator] both store [data] — the actual value. The [ALU] performs the calculation whose result is placed in the Accumulator.",
    words: ["PC", "MAR", "address", "MDR", "Accumulator", "data", "ALU", "CU", "cache", "instruction", "location"],
  },
  {
    id: 101, specTag: "1.1.1-R2", beyondSpec: true, title: "The system bus (beyond spec)",
    text: "The CPU talks to memory over three buses. The [address bus] carries locations and is [unidirectional]. The [data bus] carries values and is [bidirectional]. The [control bus] carries signals such as read and write.",
    words: ["address bus", "unidirectional", "data bus", "bidirectional", "control bus", "input bus", "omnidirectional", "output bus"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXAM QUESTIONS — realistic J277/01 formats and tariffs, all tagged 1.1.1
// ─────────────────────────────────────────────────────────────────────────────

const EXAM_QUESTIONS: ExamQuestion[] = [
  // MCQ (1) — now a first-class exam format, not just a side "quiz"
  {
    id: "x1", specTag: "1.1.1-R3", format: "mcq", marks: 1,
    prompt: "Which register holds the address of the next instruction to be fetched?",
    options: ["Memory Data Register (MDR)", "Program Counter (PC)", "Accumulator (ACC)", "Arithmetic Logic Unit (ALU)"],
    answerIndex: 1,
    hint: "Which one stores an address, and is used to keep the cycle moving?",
    markScheme: ["Program Counter (PC) (1)"],
  },
  {
    id: "x2", specTag: "1.1.1-R4", format: "mcq", marks: 1,
    prompt: "Which statement best describes the difference between an address and data?",
    options: [
      "An address is the value; data is where it is stored",
      "An address is where a value is stored; data is the value itself",
      "They are the same thing stored in two places",
      "An address is always bigger than a piece of data",
    ],
    answerIndex: 1,
    hint: "One tells you WHERE; the other is the actual value.",
    markScheme: ["An address is where a value is stored; data is the value itself (1)"],
  },
  // State / Identify (1) — direct recall, no scaffolding
  {
    id: "x3", specTag: "1.1.1-R2", format: "state", marks: 1,
    prompt: "State the purpose of the Arithmetic Logic Unit (ALU).",
    hint: "One clear job — think arithmetic and logic.",
    markScheme: ["Performs arithmetic calculations and/or logical comparisons (1)"],
  },
  {
    id: "x4", specTag: "1.1.1-R3", format: "state", marks: 1,
    prompt: "State what is stored in the {context}.",
    contexts: ["Memory Address Register (MAR)", "Memory Data Register (MDR)", "Program Counter (PC)", "Accumulator (ACC)"],
    hint: "Say what it holds — and whether that is data or an address.",
    markScheme: ["Correct description of what the register stores (1)"],
    modelNotes: {
      "Memory Address Register (MAR)": ["The address of the memory location being read from / written to (1)"],
      "Memory Data Register (MDR)":    ["The data read from, or about to be written to, memory (1)"],
      "Program Counter (PC)":          ["The address of the next instruction to be fetched (1)"],
      "Accumulator (ACC)":             ["The result (data) of the most recent ALU calculation (1)"],
    },
  },
  // Short response (2) — AO1, one or two linked points
  {
    id: "x5", specTag: "1.1.1-R2", format: "short", marks: 2,
    prompt: "Describe the role of the Control Unit during the fetch-execute cycle.",
    hint: "Give two linked points — what it coordinates and what it directs.",
    markScheme: [
      "Coordinates / controls the components of the CPU (1)",
      "Directs the flow of data / decodes instructions during the cycle (1)",
    ],
    modelAnswer: "The Control Unit **coordinates the components of the CPU**, and it **directs the flow of data between them and decodes each instruction** so the right action happens at the right time.",
  },
  {
    id: "x6", specTag: "1.1.1-R4", format: "short", marks: 2,
    prompt: "Explain the difference between storing data and storing an address.",
    hint: "Define each, and make the contrast explicit.",
    markScheme: [
      "An address identifies where a value is located in memory (1)",
      "Data is the actual value stored/processed, not its location (1)",
    ],
    modelAnswer: "**An address identifies where a value is located in memory**, whereas **data is the actual value being stored or processed** — the address tells you the location, the data is what is kept there.",
  },
  {
    id: "x7", specTag: "1.1.1-R1", format: "short", marks: 3,
    prompt: "Describe what happens during each stage of the fetch-execute cycle.",
    hint: "One mark per stage: fetch, decode, execute.",
    markScheme: [
      "Fetch: the next instruction is copied from memory into the CPU (1)",
      "Decode: the Control Unit interprets/works out the instruction (1)",
      "Execute: the instruction is carried out (e.g. the ALU calculates) (1)",
    ],
    modelAnswer: "During **fetch, the next instruction is copied from memory into the CPU**. During **decode, the Control Unit works out what the instruction means**. During **execute, the instruction is carried out** — for example the ALU performs the calculation.",
  },
  // Apply to scenario (4) — AO2, the component's largest weighting
  {
    id: "x8", specTag: "1.1.1-R1", format: "scenario", marks: 4,
    prompt: "A program contains an instruction that {context}. Describe how the fetch-execute cycle carries out this instruction.",
    contexts: [
      "adds two numbers together",
      "compares two values to decide which is larger",
      "copies a value from one memory location to another",
    ],
    hint: "Walk the cycle in context: fetch, decode, execute, then the cycle continuing.",
    markScheme: [
      "Fetch described in context — instruction brought into the CPU (1)",
      "Decode described in context — CU interprets the instruction (1)",
      "Execute described in context — the operation actually performed (1)",
      "The PC increments / the cycle repeats for the next instruction (1)",
    ],
    modelAnswer: "First the instruction is **fetched — brought from memory into the CPU**. The **Control Unit decodes it**, recognising the operation required (e.g. an addition). During **execute the operation is carried out — the ALU performs it on the values**. Finally the **PC increments so the cycle repeats** with the next instruction.",
  },
  // Extended response (6) — a genuinely descriptive, sustained question
  {
    id: "x9", specTag: "1.1.1-R3", format: "extended", marks: 6,
    prompt: "Describe the fetch-execute cycle, referring to the registers used at each stage.",
    hint: "Aim for a full sequence: PC → MAR → memory → MDR → CIR/decode → execute → PC increments. Name the register at each step and say whether it holds data or an address.",
    markScheme: [
      "The PC holds the address of the next instruction (1)",
      "The address is copied to the MAR (1)",
      "The instruction is fetched from memory into the MDR (1)",
      "The Control Unit decodes the instruction (1)",
      "The instruction is executed (e.g. ALU calculates; result may go to the Accumulator) (1)",
      "The PC is incremented and the cycle repeats (1)",
    ],
    modelAnswer: "**The Program Counter holds the address of the next instruction.** This **address is copied into the MAR**, which selects the memory location. **The instruction is fetched from memory into the MDR**, then passed to the CIR. **The Control Unit decodes the instruction** to work out what is required. **The instruction is then executed** — for example the ALU performs a calculation, with the result held in the Accumulator. Finally, **the PC is incremented** so the whole cycle repeats.",
  },

  // Beyond spec — excluded from default exam sessions
  {
    id: "b1", specTag: "1.1.1-R2", beyondSpec: true, format: "short", marks: 2,
    prompt: "Describe the purpose of the address bus and state its direction.",
    hint: "What it carries, and one-way or two-way?",
    markScheme: [
      "Carries memory addresses from the CPU to memory (1)",
      "Unidirectional — addresses travel one way only (1)",
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SYNOPTIC QUESTIONS — span sub-topics, with per-tag mark attribution
// Scoped for the 1.1.1 pilot to 1.1.1+1.1.2 and 1.1.1+1.2.1 (per the brief).
// ─────────────────────────────────────────────────────────────────────────────

const SYNOPTIC_QUESTIONS: SynopticQuestion[] = [
  {
    id: "s1", specTags: ["1.1.1", "1.2.1"] as SpecTag[], format: "scenario", marks: 4,
    prompt: "Explain how the CPU uses RAM during the fetch stage of the fetch-execute cycle.",
    hint: "Link the registers (MAR/MDR) to RAM's role as main memory.",
    markScheme: [
      { tag: "1.1.1-R3", points: [
        "The address in the MAR identifies the memory location (1)",
        "The instruction is loaded into the MDR (1)",
      ]},
      { tag: "1.2.1", points: [
        "RAM is the main/primary memory holding the running program (1)",
        "The instruction is read from RAM at that address (1)",
      ]},
    ],
    modelAnswer: "**RAM is the main memory that holds the running program.** During fetch, **the address in the MAR identifies the location in RAM** to read. **The instruction is then read from RAM at that address into the MDR**, ready to be decoded — so the CPU relies on RAM to supply each instruction in turn.",
  },
  {
    id: "s2", specTags: ["1.1.1", "1.1.2"] as SpecTag[], format: "scenario", marks: 4,
    prompt: "A computer's cache size is increased. Explain the effect this has on the number of times the CPU needs to access RAM during the fetch-execute cycle.",
    hint: "Connect what cache does (1.1.1) to why a bigger cache changes performance (1.1.2).",
    markScheme: [
      { tag: "1.1.1-R2", points: [
        "Cache stores frequently used instructions/data close to the CPU (1)",
        "During fetch, the CPU can take these from cache instead of RAM (1)",
      ]},
      { tag: "1.1.2", points: [
        "A larger cache holds more of the program, so more fetches are 'hits' (1)",
        "Fewer accesses to slower RAM are needed, improving performance (1)",
      ]},
    ],
    modelAnswer: "**Cache stores frequently used instructions close to the CPU**, so during fetch **the CPU can often take an instruction from cache instead of RAM**. **Increasing the cache lets it hold more of the program**, so more fetches are found in cache — meaning **fewer accesses to the slower RAM are needed**, which improves performance.",
  },
  {
    id: "s3", specTags: ["1.1.1", "1.1.2"] as SpecTag[], format: "extended", marks: 6,
    prompt: "A CPU's clock speed is increased. Explain the effect on the fetch-execute cycle and why this does not always improve real-world performance.",
    hint: "Define clock speed's effect on the cycle (1.1.1 mechanism), then bring in limits from 1.1.2.",
    markScheme: [
      { tag: "1.1.1-R1", points: [
        "The clock controls how often the fetch-execute cycle runs (1)",
        "A higher clock speed means more cycles per second (1)",
        "More instructions are fetched, decoded and executed each second (1)",
      ]},
      { tag: "1.1.2", points: [
        "Higher clock speed generates more heat / uses more power (1)",
        "Performance can be limited by slow RAM access, not just clock speed (1)",
        "Some tasks are limited by other factors (e.g. cores, memory), so gains are limited (1)",
      ]},
    ],
    modelAnswer: "**The clock controls how often the fetch-execute cycle runs**, so **a higher clock speed means more cycles per second** and therefore **more instructions fetched, decoded and executed each second**. However, **higher clock speeds generate more heat and use more power**, and **performance can still be limited by slow RAM access** or by tasks that depend on other factors such as the number of cores — so a faster clock does not always mean better real-world performance.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LESSONS — Learn mode: taught, stepped walkthroughs over one shared CPU
// schematic. This is the *teaching* surface (I-do): explanation + a diagram that
// highlights the part under discussion, revealed one beat per press. The schematic
// is the topic's core representation, reused across every lesson for consistency.
// ─────────────────────────────────────────────────────────────────────────────

const LESSONS: Lesson[] = [
  {
    id: "components", title: "What's inside the CPU?", specTags: ["1.1.1-R2"],
    analogy: "Think of the CPU as a kitchen: the Control Unit is the head chef calling out orders, the ALU is the chef doing the actual cooking, and the registers are the small worktop where ingredients sit while they're being used.",
    steps: [
      { text: "The **CPU** carries out instructions. Everything inside this box works together each time an instruction runs.", highlight: [] },
      { text: "The **Control Unit (CU)** is in charge. It coordinates the other parts and controls the flow of data around the CPU.", highlight: ["cu"] },
      { text: "The **ALU** (Arithmetic Logic Unit) does the actual work — arithmetic like adding, and logic like comparing two values.", highlight: ["alu"] },
      { text: "**Cache** is a small, very fast memory inside the CPU. It keeps frequently used data close, so the CPU waits less for slower RAM.", highlight: ["cache"] },
      { text: "**Registers** are tiny, extremely fast stores. Each one holds a single value the CPU is using right now. Next lesson looks at what each holds.", highlight: ["pc", "mar", "mdr", "acc", "cir"] },
    ],
  },
  {
    id: "registers", title: "Registers: address or data?", specTags: ["1.1.1-R3", "1.1.1-R4"],
    analogy: "Think of a locker room: an address is a locker *number* (which locker), and data is what's *inside* that locker. The number and the contents are both just 'stuff' — but they mean completely different things.",
    steps: [
      { text: "Some registers hold an **address** (blue — *where* a value is). Others hold **data** (green — the value *itself*). Watch the colours.", highlight: [], legend: true },
      { text: "The **Program Counter (PC)** holds an **address**: the location of the next instruction to be fetched.", highlight: ["pc"], legend: true },
      { text: "The **MAR** (Memory Address Register) holds an **address**: the location the CPU wants to read from or write to.", highlight: ["mar"], legend: true },
      { text: "The **MDR** (Memory Data Register) holds **data**: the value just read from, or about to be written to, memory.", highlight: ["mdr"], legend: true },
      { text: "The **Accumulator (ACC)** holds **data**: the result of a calculation done by the ALU.", highlight: ["acc"], legend: true },
      { text: "Big idea: an **address** tells you *where*; **data** is *what* is stored there. PC and MAR store where — MDR and ACC store what.", highlight: ["pc", "mar", "mdr", "acc"], legend: true },
    ],
  },
  {
    id: "cycle", title: "The fetch–execute cycle", specTags: ["1.1.1-R1"],
    steps: [
      { text: "Every instruction goes through three stages: **fetch**, then **decode**, then **execute**. Let's follow one all the way round.", highlight: [] },
      { text: "**Fetch.** The **PC** holds the address of the next instruction to run.", highlight: ["pc"] },
      { predict: "Your turn: where must that address go next, so memory knows which location to read?", text: "Right — it's copied into the **MAR**, which tells memory which location to look at.", highlight: ["mar"], flow: { from: "pc", to: "mar", label: "addr", kind: "addr" } },
      { text: "The instruction is read from **RAM** at that address…", highlight: ["mar", "ram"] },
      { text: "…and the value travels back into the **MDR**.", highlight: ["mdr", "ram"], flow: { from: "ram", to: "mdr", label: "instr", kind: "data" } },
      { text: "**Decode.** The instruction moves to the **CIR**, and the **Control Unit** works out what it means.", highlight: ["cir", "cu"], flow: { from: "mdr", to: "cir", label: "instr", kind: "data" } },
      { predict: "**Execute** time: which component carries out a calculation, and where does the result go?", text: "The **ALU** carries it out, leaving the result in the **ACC**.", highlight: ["alu", "acc"], flow: { from: "alu", to: "acc", label: "result", kind: "data" } },
      { text: "Finally the **PC** increments to point at the next instruction, and the whole cycle repeats.", highlight: ["pc"] },
    ],
  },
  {
    id: "trace", title: "Trace it with real values", specTags: ["1.1.1-R1", "1.1.1-R4"], kind: "trace",
    steps: [
      { text: "Let's trace one instruction — an **ADD**, stored at address **64**. Watch each register fill in.", trace: { PC: "64" }, highlight: ["PC"], legend: true },
      { text: "**Fetch:** the address **64** is copied from the PC into the **MAR**.", trace: { PC: "64", MAR: "64" }, highlight: ["MAR"], legend: true },
      { text: "The instruction **ADD** is read from RAM at 64 into the **MDR**.", trace: { PC: "64", MAR: "64", MDR: "ADD" }, highlight: ["MDR"], legend: true },
      { text: "The **PC** increments to **65**, ready for the next instruction.", trace: { PC: "65", MAR: "64", MDR: "ADD" }, highlight: ["PC"], legend: true },
      { text: "**Decode:** the instruction moves to the **CIR** and the Control Unit works out it means 'add'.", trace: { PC: "65", MAR: "64", MDR: "ADD", CIR: "ADD" }, highlight: ["CIR"], legend: true },
      { text: "**Execute:** the ALU adds, and the result **12** is stored in the **ACC**.", trace: { PC: "65", MAR: "64", MDR: "ADD", CIR: "ADD", ACC: "12" }, highlight: ["ACC"], legend: true },
      { text: "Notice: **64** and **65** are addresses (blue); **ADD** and **12** are data (green). One table — two very different kinds of value.", trace: { PC: "65", MAR: "64", MDR: "ADD", CIR: "ADD", ACC: "12" }, highlight: [], legend: true },
    ],
  },
];

// ── CPU representations as data (see CS_SHELL_PLAN.md) ────────────────────────
// The CPU box layout: nodes + roles + the dashed CPU boundary, the bus to RAM and
// the group annotations. Rendered by the shared BoxSchematic representation.
const ROLE_COLOR: Record<string, string> = { addr: "#2563eb", data: "#059669", instr: "#64748b", ctrl: "#475569", mem: "#475569" };
const ROLE_TINT:  Record<string, string> = { addr: "#dbeafe", data: "#d1fae5", instr: "#e2e8f0", ctrl: "#f1f5f9", mem: "#f1f5f9" };

const CPU_SCHEMATIC: SchematicConfig = {
  viewBox: "0 0 380 244",
  maxWidth: 520,
  roleColor: ROLE_COLOR,
  roleTint: ROLE_TINT,
  nodes: [
    { id: "cu",    x: 24,  y: 44,  w: 100, h: 40,  label: "Control Unit", role: "ctrl" },
    { id: "alu",   x: 24,  y: 96,  w: 100, h: 40,  label: "ALU",          role: "ctrl" },
    { id: "cache", x: 24,  y: 148, w: 100, h: 40,  label: "Cache",        role: "mem" },
    { id: "pc",    x: 148, y: 52,  w: 92,  h: 28,  label: "PC",           role: "addr" },
    { id: "mar",   x: 148, y: 86,  w: 92,  h: 28,  label: "MAR",          role: "addr" },
    { id: "mdr",   x: 148, y: 120, w: 92,  h: 28,  label: "MDR",          role: "data" },
    { id: "acc",   x: 148, y: 154, w: 92,  h: 28,  label: "ACC",          role: "data" },
    { id: "cir",   x: 148, y: 188, w: 92,  h: 28,  label: "CIR",          role: "instr" },
    { id: "ram",   x: 288, y: 92,  w: 84,  h: 96,  label: "RAM",          role: "mem" },
  ],
  buses: [
    { x1: 256, y1: 140, x2: 288, y2: 140, hotWhen: ["ram", "mar", "mdr"] },
  ],
  containers: [
    { x: 8, y: 16, w: 248, h: 220, label: "CPU" },
  ],
  texts: [
    { x: 194, y: 44,  text: "REGISTERS",   letterSpacing: "0.06em" },
    { x: 330, y: 210, text: "main memory", size: 8.5, weight: 600 },
  ],
};

// ── Trace-table representation (the trace lesson): register contents step by step
const CPU_TRACE: TraceConfig = {
  roleColor: ROLE_COLOR,
  roleTint: ROLE_TINT,
  rows: [
    { key: "PC",  role: "addr",  holds: "an address" },
    { key: "MAR", role: "addr",  holds: "an address" },
    { key: "MDR", role: "data",  holds: "data" },
    { key: "CIR", role: "instr", holds: "the instruction" },
    { key: "ACC", role: "data",  holds: "data" },
  ],
};

const LEGEND = (
  <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginTop: 4 }}>
    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", fontWeight: 700, color: "#2563eb" }}>
      <span style={{ width: 14, height: 14, borderRadius: 4, background: "#dbeafe", border: "2px solid #2563eb" }} /> address (where)
    </span>
    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", fontWeight: 700, color: "#059669" }}>
      <span style={{ width: 14, height: 14, borderRadius: 4, background: "#d1fae5", border: "2px solid #059669" }} /> data (what)
    </span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// INFO — the topic-info modal content.
// ─────────────────────────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  { title: "What's in scope (1.1.1)", items: [
    { label: "Fetch-execute cycle (R1)", detail: "The actions at each stage: fetch, decode, execute — and the PC incrementing." },
    { label: "Component roles (R2)", detail: "ALU (arithmetic/logic), Control Unit (coordination), cache, and registers." },
    { label: "Registers (R3)", detail: "PC, MAR, MDR and Accumulator — what each stores, and whether it's data or an address." },
    { label: "Data vs address (R4)", detail: "An address says WHERE a value is; data is the value itself." },
  ]},
  { title: "Beyond spec (toggle in menu)", items: [
    { label: "Buses, cache levels, CIR", detail: "Useful background but not required for 1.1.1. Kept out of default study, quiz and exam sessions; turn on 'Beyond spec' to include them, clearly flagged." },
  ]},
  { title: "How the modes differ", items: [
    { label: "Learn", detail: "Taught walkthroughs over a CPU diagram, with predict-first prompts, an animated cycle, analogies and a value trace. Start here." },
    { label: "Study", detail: "First-pass reading — recognition, low effort, with a 'why' note on key cards." },
    { label: "Flashcards", detail: "Active recall — answer before you flip. The core revision mode." },
    { label: "Quiz", detail: "MCQ warm-up, or Spot-the-Mistake to confront the classic misconceptions. Not a readiness signal." },
    { label: "Exam", detail: "Real J277 formats and tariffs; self-mark against the scheme, reveal model answers, plus synoptic questions." },
  ]},
];

// ─────────────────────────────────────────────────────────────────────────────
// TOPIC — assemble all of the above into one CSTopic. The shell (CSShell) owns
// every piece of UI: header, nav, beyond-spec filtering, info modal and the
// activity routing that renders the six modes + LearnMode. This file is now pure
// data (the payoff of the CS-shell extraction — see CS_SHELL_PLAN.md).
// ─────────────────────────────────────────────────────────────────────────────

const CPU_TOPIC: CSTopic = {
  id: "1.1.1",
  title: "CPU Architecture",
  specTags: SPEC_DESCRIPTIONS,
  glossary: GLOSSARY,
  lessons: LESSONS,
  scenes: { schematic: CPU_SCHEMATIC, trace: CPU_TRACE, legend: LEGEND },
  cards: CARDS,
  cloze: CLOZE,
  myths: MYTHS,
  exam: EXAM_QUESTIONS,
  synoptic: SYNOPTIC_QUESTIONS,
  info: INFO_SECTIONS,
};

export default function App() {
  return <CSShell topic={CPU_TOPIC} />;
}
