import { useState, useEffect, useCallback, useRef, CSSProperties } from "react";
import {
  Home, Menu, X, ChevronLeft, ChevronRight, Shuffle, RotateCcw, RefreshCw,
  BookOpen, Layers, CheckSquare, PenLine, FileText, Info, GraduationCap, Check, AlertTriangle,
} from "lucide-react";
import {
  NAVY, CARD_SHADOW, TAB_SHADOW, shuffleArr, parseCloze, useIsMobile, boldText,
  BeyondBadge, SegRow, registerTooltip, showTooltip, TooltipOverlay, parseGlossaryText,
  type CSTooltip,
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

type SpecTag = "1.1.1-R1" | "1.1.1-R2" | "1.1.1-R3" | "1.1.1-R4" | "1.1.2" | "1.2.1";

const SPEC_DESCRIPTIONS: Record<SpecTag, string> = {
  "1.1.1-R1": "Required: the actions that occur at each stage of the fetch-execute cycle.",
  "1.1.1-R2": "Required: the role/purpose of each CPU component (ALU, CU, cache, registers) during the fetch-execute cycle.",
  "1.1.1-R3": "Required: the purpose of each register and what it stores (data or an address).",
  "1.1.1-R4": "Required: the difference between storing data and storing an address.",
  "1.1.2":    "Sub-topic 1.1.2 — CPU performance (clock speed, cores, cache). Drawn in for synoptic links only.",
  "1.2.1":    "Sub-topic 1.2.1 — Primary storage / RAM. Drawn in for synoptic links only.",
};

const MARK_FORMATS = {
  mcq:      { label: "Multiple choice", short: "MCQ",       color: "#1e3a8a", bg: "#eff6ff", border: "#bfdbfe" },
  state:    { label: "State / Identify", short: "State",    color: "#065f46", bg: "#ecfdf5", border: "#a7f3d0" },
  short:    { label: "Short response",  short: "Short",     color: "#92400e", bg: "#fffbeb", border: "#fde68a" },
  scenario: { label: "Apply to scenario", short: "Scenario", color: "#7c2d12", bg: "#fff7ed", border: "#fed7aa" },
  extended: { label: "Extended response", short: "Extended", color: "#5b21b6", bg: "#f5f3ff", border: "#ddd6fe" },
} as const;

type ExamFormat = keyof typeof MARK_FORMATS;

// Visual tokens (NAVY, CARD_SHADOW, TAB_SHADOW) now come from ../../shared/cs.

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface FlashCard {
  id: number;
  specTag: SpecTag;
  beyondSpec?: boolean;      // enrichment — excluded from default sessions
  q: string;
  a: string;
  terms?: string[];          // glossary terms to underline; [] = none
  distractors?: string[];    // for MCQ / Quiz mode
  explain?: string;          // elaboration — the "why" / how-to-remember, shown as feedback
}

interface ClozeExercise {
  id: number;
  title: string;
  specTag: SpecTag;
  beyondSpec?: boolean;
  text: string;              // [WORD] marks a slot
  words: string[];           // correct answers + distractors
}

interface ExamQuestion {
  id: string;
  specTag: SpecTag;
  beyondSpec?: boolean;
  format: ExamFormat;
  marks: number;
  prompt: string;            // may contain {context}
  contexts?: string[];
  options?: string[];        // mcq only
  answerIndex?: number;      // mcq only
  hint: string;
  markScheme: string[];
  modelNotes?: Record<string, string[]>;
  modelAnswer?: string;      // a full prose model answer; **bold** marks the mark-earning parts
}

interface SynopticQuestion {
  id: string;
  specTags: SpecTag[];       // the sub-topics this question spans
  format: ExamFormat;
  marks: number;
  prompt: string;
  hint: string;
  // per-tag mark scheme attribution — which marks come from which sub-topic
  markScheme: { tag: SpecTag; points: string[] }[];
  modelAnswer?: string;
}

// Misconception check — Spot-the-Mistake / True-or-False
interface MythItem {
  id: number;
  specTag: SpecTag;
  statement: string;
  isTrue: boolean;
  why: string;               // the correction / explanation shown after answering
}

// Command-word guidance — what each exam format is really asking for
const COMMAND_GUIDE: Record<ExamFormat, string> = {
  mcq:      "Multiple choice: pick the single best option. One mark, no working.",
  state:    "State / Identify: give the fact only — no explanation is needed for the mark.",
  short:    "Describe: say what happens, clearly and in the right order. 'Why' is not required.",
  scenario: "Apply: use the idea in THIS scenario — refer to the specific details you're given.",
  extended: "Explain: make each point AND justify it ('… because …'), and link your ideas together.",
};


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
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const coreCards  = (showBeyond: boolean) => CARDS.filter(c => showBeyond || !c.beyondSpec);
const coreCloze  = (showBeyond: boolean) => CLOZE.filter(c => showBeyond || !c.beyondSpec);
const coreExam   = (showBeyond: boolean) => EXAM_QUESTIONS.filter(q => showBeyond || !q.beyondSpec);

const buildChoices = (card: FlashCard): string[] => {
  if (card.distractors && card.distractors.length >= 3)
    return shuffleArr([card.a, ...card.distractors.slice(0, 3)]);
  const others = CARDS.map(c => c.a).filter(a => a !== card.a);
  return shuffleArr([card.a, ...shuffleArr(others).slice(0, 3)]);
};

const resolvePrompt = (prompt: string, contexts?: string[]): { text: string; ctx: string | null } => {
  if (!contexts || !contexts.length) return { text: prompt, ctx: null };
  const ctx = contexts[Math.floor(Math.random() * contexts.length)];
  return { text: prompt.replace("{context}", ctx), ctx };
};

// ─────────────────────────────────────────────────────────────────────────────
// TOUCH-FIRST GLOSSARY TOOLTIP
// Tap a term to open; tap the backdrop or the × to close. No hover dependency.
// ─────────────────────────────────────────────────────────────────────────────

// GlossaryText / SpecBadge — thin topic-bound wrappers over the shared tooltip
// machinery (../../shared/cs). GlossaryText injects this topic's GLOSSARY; SpecBadge
// injects its SPEC_DESCRIPTIONS. The tooltip overlay + parsing live in the shell.

const GlossaryText = ({ text, terms, style, onCard = false }: { text: string; terms?: string[]; style?: CSSProperties; onCard?: boolean }) => {
  const segments = parseGlossaryText(GLOSSARY, text, terms);
  return (
    <span style={style}>
      {segments.map((seg, i) =>
        seg.type === "text"
          ? <span key={i}>{seg.value}</span>
          : <span key={i} onClick={e => { e.stopPropagation(); showTooltip(seg.value, seg.def!, e.currentTarget as HTMLElement); }}
              style={{ borderBottom: `2px dotted ${onCard ? "rgba(255,255,255,0.75)" : NAVY}`, cursor: "pointer", padding: "0 1px" }}>
              {seg.value}
            </span>
      )}
    </span>
  );
};

const SpecBadge = ({ tag }: { tag: SpecTag }) => (
  <button onClick={e => { e.stopPropagation(); showTooltip(tag, SPEC_DESCRIPTIONS[tag], e.currentTarget as HTMLElement); }}
    style={{ minHeight: 24, padding: "2px 9px", borderRadius: 20, border: "1.5px solid #cbd5e1",
      background: "#f8fafc", color: "#475569", fontSize: "0.68rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
    {tag}
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// MODE: LEARN — taught, stepped walkthroughs over one shared CPU schematic.
// This is the *teaching* surface (I-do): explanation + a diagram that highlights
// the part under discussion, revealed one beat per press. The schematic is the
// topic's core representation, reused across every lesson for consistency.
// ─────────────────────────────────────────────────────────────────────────────

interface Flow { from: string; to: string; label: string; kind?: "addr" | "data" }
interface LessonStep {
  text: string;
  highlight?: string[];
  legend?: boolean;
  flow?: Flow;                        // animated token travelling between parts
  predict?: string;                   // You-do: a question posed before the answer (text)
  trace?: Record<string, string>;     // register snapshot for kind:"trace" lessons
}
interface Lesson {
  id: string; title: string; specTags: SpecTag[];
  kind?: "diagram" | "trace";
  analogy?: string;                   // "Think of it like…" concrete anchor
  steps: LessonStep[];
}

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

const PARTS: Record<string, { x: number; y: number; w: number; h: number; label: string; role: "addr" | "data" | "instr" | "ctrl" | "mem" }> = {
  cu:    { x: 24,  y: 44,  w: 100, h: 40,  label: "Control Unit", role: "ctrl" },
  alu:   { x: 24,  y: 96,  w: 100, h: 40,  label: "ALU",          role: "ctrl" },
  cache: { x: 24,  y: 148, w: 100, h: 40,  label: "Cache",        role: "mem" },
  pc:    { x: 148, y: 52,  w: 92,  h: 28,  label: "PC",           role: "addr" },
  mar:   { x: 148, y: 86,  w: 92,  h: 28,  label: "MAR",          role: "addr" },
  mdr:   { x: 148, y: 120, w: 92,  h: 28,  label: "MDR",          role: "data" },
  acc:   { x: 148, y: 154, w: 92,  h: 28,  label: "ACC",          role: "data" },
  cir:   { x: 148, y: 188, w: 92,  h: 28,  label: "CIR",          role: "instr" },
  ram:   { x: 288, y: 92,  w: 84,  h: 96,  label: "RAM",          role: "mem" },
};
const ROLE_COLOR: Record<string, string> = { addr: "#2563eb", data: "#059669", instr: "#64748b", ctrl: "#475569", mem: "#475569" };
const ROLE_TINT:  Record<string, string> = { addr: "#dbeafe", data: "#d1fae5", instr: "#e2e8f0", ctrl: "#f1f5f9", mem: "#f1f5f9" };

const CpuDiagram = ({ highlight, flow, flowKey }: { highlight?: string[]; flow?: Flow; flowKey?: number }) => {
  const hl = highlight ?? [];
  const on = (id: string) => hl.includes(id);
  const dim = (id: string) => (hl.length && !on(id) ? 0.32 : 1);
  const ramHot = on("ram") || on("mar") || on("mdr");

  // animated token: sit at `from`, then transition to `to` one frame after mount
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!flow) return;
    setPhase(0);
    let r2 = 0;
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setPhase(1)); });
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
  }, [flowKey, flow]);

  return (
    <svg viewBox="0 0 380 244" style={{ display: "block", width: "100%", height: "auto", maxWidth: 520, margin: "0 auto" }} preserveAspectRatio="xMidYMid meet">
      {/* bus between CPU and RAM */}
      <line x1={256} y1={140} x2={288} y2={140} stroke={ramHot ? "#334155" : "#cbd5e1"} strokeWidth={ramHot ? 4 : 3} />
      {/* CPU outer box */}
      <rect x={8} y={16} width={248} height={220} rx={12} fill="none" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 4" />
      <text x={20} y={33} fontSize={13} fontWeight={800} fill="#334155">CPU</text>
      {/* registers group label */}
      <text x={194} y={44} fontSize={9} fontWeight={700} fill="#94a3b8" textAnchor="middle" letterSpacing="0.06em">REGISTERS</text>
      {Object.entries(PARTS).map(([id, p]) => {
        const c = ROLE_COLOR[p.role]; const isReg = ["pc", "mar", "mdr", "acc", "cir"].includes(id);
        return (
          <g key={id} opacity={dim(id)} style={{ transition: "opacity 0.25s" }}>
            <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={7}
              fill={on(id) ? ROLE_TINT[p.role] : "#fff"} stroke={c} strokeWidth={on(id) ? 3 : 1.4} />
            <text x={p.x + p.w / 2} y={p.y + p.h / 2 + 1} fontSize={isReg ? 12 : 12} fontWeight={700}
              fill={c} textAnchor="middle" dominantBaseline="central">{p.label}</text>
          </g>
        );
      })}
      <text x={330} y={210} fontSize={8.5} fontWeight={600} fill="#94a3b8" textAnchor="middle">main memory</text>

      {/* animated value token travelling from → to */}
      {flow && (() => {
        const f = PARTS[flow.from], t = PARTS[flow.to];
        if (!f || !t) return null;
        const fx = f.x + f.w / 2, fy = f.y + f.h / 2;
        const dx = (t.x + t.w / 2) - fx, dy = (t.y + t.h / 2) - fy;
        const col = flow.kind === "addr" ? "#2563eb" : "#059669";
        const tint = flow.kind === "addr" ? "#dbeafe" : "#d1fae5";
        const w = 46, h = 20;
        return (
          <g style={{ transition: "transform 0.85s ease", transform: `translate(${phase ? dx : 0}px, ${phase ? dy : 0}px)` }}>
            <rect x={fx - w / 2} y={fy - h / 2} width={w} height={h} rx={6} fill={tint} stroke={col} strokeWidth={2} />
            <text x={fx} y={fy + 1} fontSize={10} fontWeight={800} fill={col} textAnchor="middle" dominantBaseline="central">{flow.label}</text>
          </g>
        );
      })()}
    </svg>
  );
};

// ── Trace-table representation (the trace lesson): register contents step by step
const TRACE_ROWS: { key: string; role: "addr" | "data" | "instr"; holds: string }[] = [
  { key: "PC",  role: "addr",  holds: "an address" },
  { key: "MAR", role: "addr",  holds: "an address" },
  { key: "MDR", role: "data",  holds: "data" },
  { key: "CIR", role: "instr", holds: "the instruction" },
  { key: "ACC", role: "data",  holds: "data" },
];

const TraceTable = ({ snapshot, hot }: { snapshot?: Record<string, string>; hot?: string[] }) => {
  const snap = snapshot ?? {};
  const hotSet = new Set(hot ?? []);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 440, margin: "0 auto" }}>
      {TRACE_ROWS.map(r => {
        const c = ROLE_COLOR[r.role]; const val = snap[r.key]; const isHot = hotSet.has(r.key);
        return (
          <div key={r.key} style={{ display: "grid", gridTemplateColumns: "48px 1fr 74px", alignItems: "center", gap: 8,
            background: isHot ? ROLE_TINT[r.role] : "#fff", border: `2px solid ${isHot ? c : "#e5e7eb"}`, borderRadius: 10, padding: "8px 10px", transition: "all 0.25s" }}>
            <span style={{ fontWeight: 800, fontSize: "0.9rem", color: c }}>{r.key}</span>
            <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#94a3b8" }}>holds {r.holds}</span>
            <span style={{ justifySelf: "stretch", textAlign: "center", fontWeight: 800, fontSize: "0.95rem",
              color: val ? c : "#cbd5e1", border: val ? `2px solid ${c}` : "2px dashed #e5e7eb", borderRadius: 8, padding: "3px 6px", transition: "all 0.25s" }}>
              {val ?? "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
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

const LearnMode = () => {
  const [lessonIdx, setLessonIdx] = useState(0);
  const [step, setStep] = useState(0);
  const [predicted, setPredicted] = useState(false);   // has the You-do answer been revealed?

  const lesson = LESSONS[lessonIdx];
  const maxStep = lesson.steps.length - 1;
  // Clamp: when switching to a shorter lesson, `step` is briefly out of range
  // for one render before the reset effect fires — guard against undefined.
  const s = Math.min(step, maxStep);
  const cur = lesson.steps[s];
  const isTrace = lesson.kind === "trace";
  const gated = !!cur.predict && !predicted;            // must predict before advancing
  const showFlow = !!cur.flow && !gated;

  useEffect(() => { setStep(0); }, [lessonIdx]);
  useEffect(() => { setPredicted(false); }, [step, lessonIdx]);

  const next = useCallback(() => setStep(s => Math.min(maxStep, s + 1)), [maxStep]);
  const prev = useCallback(() => setStep(s => Math.max(0, s - 1)), []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target !== document.body) return;
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); if (!gated) next(); }
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [next, prev, gated]);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
      {/* lesson picker */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {LESSONS.map((l, i) => (
          <button key={l.id} onClick={() => setLessonIdx(i)}
            style={{ minHeight: 40, padding: "0 14px", borderRadius: 10, fontWeight: 700, fontSize: "0.8rem", border: "2px solid", cursor: "pointer",
              background: i === lessonIdx ? "#1e3a8a" : "#fff", color: i === lessonIdx ? "#fff" : "#4b5563", borderColor: i === lessonIdx ? "#1e3a8a" : "#e5e7eb" }}>
            {i + 1}. {l.title}
          </button>
        ))}
      </div>

      {/* lesson card */}
      <div style={{ background: "#fff", borderRadius: 16, border: "2px solid #e5e7eb", boxShadow: CARD_SHADOW, padding: "18px 18px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <p style={{ fontWeight: 800, fontSize: "1rem", color: "#1e3a8a", margin: 0 }}>{lesson.title}</p>
          <div style={{ display: "flex", gap: 6 }}>{lesson.specTags.map(t => <SpecBadge key={t} tag={t} />)}</div>
        </div>

        <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 10px 10px" }}>
          {isTrace
            ? <TraceTable snapshot={cur.trace} hot={cur.highlight} />
            : <CpuDiagram highlight={gated ? [] : cur.highlight} flow={showFlow ? cur.flow : undefined} flowKey={s} />}
          {cur.legend && LEGEND}
        </div>

        {/* explanation — one beat at a time; predict steps ask first (You-do) */}
        {gated ? (
          <div style={{ minHeight: 84, background: "#f5f3ff", borderRadius: 12, borderLeft: "4px solid #7c3aed", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7c3aed" }}>Your turn — predict first</span>
            <p style={{ fontSize: "1rem", color: "#334155", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{boldText(cur.predict!)}</p>
            <button onClick={() => setPredicted(true)}
              style={{ alignSelf: "flex-start", minHeight: 40, padding: "0 18px", borderRadius: 10, fontWeight: 700, fontSize: "0.85rem", border: "none", cursor: "pointer", background: "#7c3aed", color: "#fff" }}>
              Show answer
            </button>
          </div>
        ) : (
          <div style={{ minHeight: 84, background: "#eff6ff", borderRadius: 12, borderLeft: "4px solid #1e3a8a", padding: "14px 16px", display: "flex", alignItems: "center" }}>
            <p style={{ fontSize: "1rem", color: "#334155", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{boldText(cur.text)}</p>
          </div>
        )}

        {/* analogy — a concrete anchor for the whole lesson */}
        {lesson.analogy && (
          <div style={{ background: "#fffbeb", borderRadius: 12, border: "1.5px solid #fde68a", padding: "10px 14px" }}>
            <span style={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#b45309" }}>Think of it like…</span>
            <p style={{ fontSize: "0.86rem", color: "#78350f", lineHeight: 1.55, margin: "3px 0 0", fontWeight: 500 }}>{boldText(lesson.analogy)}</p>
          </div>
        )}

        {/* progress dots */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
          {lesson.steps.map((_, i) => (
            <span key={i} style={{ width: i === s ? 22 : 8, height: 8, borderRadius: 4, background: i === s ? "#1e3a8a" : i < s ? "#93c5fd" : "#e5e7eb", transition: "all 0.2s" }} />
          ))}
        </div>

        {/* nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <button onClick={prev} disabled={s === 0}
            style={{ minHeight: 44, display: "flex", alignItems: "center", gap: 6, padding: "0 18px", borderRadius: 12, fontWeight: 700, fontSize: "0.9rem", border: "2px solid", cursor: s === 0 ? "not-allowed" : "pointer", background: s === 0 ? "#f3f4f6" : "#fff", color: s === 0 ? "#d1d5db" : "#374151", borderColor: s === 0 ? "#e5e7eb" : "#d1d5db" }}>
            <ChevronLeft size={18} /> Back
          </button>
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#9ca3af" }}>{s + 1} / {lesson.steps.length}</span>
          {s < maxStep ? (
            <button onClick={next} disabled={gated} title={gated ? "Predict first" : undefined}
              style={{ minHeight: 44, display: "flex", alignItems: "center", gap: 6, padding: "0 22px", borderRadius: 12, fontWeight: 700, fontSize: "0.9rem", border: "2px solid", cursor: gated ? "not-allowed" : "pointer",
                background: gated ? "#f3f4f6" : "#1e3a8a", color: gated ? "#d1d5db" : "#fff", borderColor: gated ? "#e5e7eb" : "#1e3a8a" }}>
              Next <ChevronRight size={18} />
            </button>
          ) : lessonIdx < LESSONS.length - 1 ? (
            <button onClick={() => setLessonIdx(i => i + 1)}
              style={{ minHeight: 44, display: "flex", alignItems: "center", gap: 6, padding: "0 18px", borderRadius: 12, fontWeight: 700, fontSize: "0.88rem", border: "2px solid #059669", cursor: "pointer", background: "#059669", color: "#fff" }}>
              Next lesson <ChevronRight size={18} />
            </button>
          ) : (
            <span style={{ minHeight: 44, display: "flex", alignItems: "center", padding: "0 18px", fontSize: "0.82rem", fontWeight: 700, color: "#059669" }}>Lesson complete ✓</span>
          )}
        </div>
      </div>

      <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#9ca3af", fontWeight: 500, margin: 0 }}>Press → or space to step forward · ← to go back</p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// FLIP CARD — viewport-aware sizing + swipe navigation
// ─────────────────────────────────────────────────────────────────────────────

const FlipCard = ({ card, isFlipped, onFlip, onSwipeLeft, onSwipeRight }: {
  card: FlashCard; isFlipped: boolean; onFlip: () => void;
  onSwipeLeft: () => void; onSwipeRight: () => void;
}) => {
  const touchX = useRef<number | null>(null);
  const touchY = useRef<number | null>(null);
  const moved  = useRef(false);

  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; touchY.current = e.touches[0].clientY; moved.current = false; };
  const onTouchMove  = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    if (Math.abs(e.touches[0].clientX - touchX.current) > 12) moved.current = true;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null || touchY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    const dy = e.changedTouches[0].clientY - touchY.current;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      dx < 0 ? onSwipeLeft() : onSwipeRight();
    } else if (!moved.current) {
      onFlip();
    }
    touchX.current = touchY.current = null;
  };

  // viewport-aware: clamp() scales with vw between sensible floors/ceilings; the
  // length tier only sets the ceiling, so long answers shrink harder on phones.
  const qMax = card.q.length > 90 ? 1.25 : card.q.length > 55 ? 1.5 : 1.8;
  const aMax = card.a.length > 110 ? 1.1 : card.a.length > 70 ? 1.3 : card.a.length > 45 ? 1.5 : 1.7;
  const qSize = `clamp(1.05rem, 5.2vw, ${qMax}rem)`;
  const aSize = `clamp(1rem, 4.6vw, ${aMax}rem)`;

  const face: CSSProperties = {
    position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
    borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    padding: "clamp(24px, 6vw, 44px)", gap: 14, textAlign: "center",
  };

  return (
    <div
      onClick={onFlip}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
      style={{ perspective: "1200px", width: "100%", maxWidth: 680, height: "clamp(230px, 44vh, 360px)", cursor: "pointer", margin: "0 auto", touchAction: "pan-y" }}
    >
      <div style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d",
        transition: "transform 0.5s cubic-bezier(0.45,0.05,0.55,0.95)", transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
        {/* Front */}
        <div style={{ ...face, background: "linear-gradient(140deg,#1e3a8a 0%,#1d4ed8 100%)", boxShadow: "0 8px 40px rgba(30,58,138,0.28)" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>Question</span>
            {card.beyondSpec && <BeyondBadge />}
          </div>
          <p style={{ color: "#fff", fontSize: qSize, fontWeight: 600, lineHeight: 1.5, margin: 0 }}>{card.q}</p>
          <span style={{ fontSize: "0.66rem", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Tap to reveal · swipe to move</span>
        </div>
        {/* Back */}
        <div style={{ ...face, transform: "rotateY(180deg)", background: "linear-gradient(140deg,#064e3b 0%,#059669 100%)", boxShadow: "0 8px 40px rgba(6,78,59,0.28)" }}>
          <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>Answer — tap a dotted word</span>
          <GlossaryText text={card.a} terms={card.terms} onCard
            style={{ color: "#fff", fontSize: aSize, fontWeight: 600, lineHeight: 1.6 }} />
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MODE: FLASHCARDS (active recall)
// ─────────────────────────────────────────────────────────────────────────────

const FlashcardMode = ({ cards }: { cards: FlashCard[] }) => {
  const [deck, setDeck] = useState(cards);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffled, setShuffled] = useState(false);

  useEffect(() => { setDeck(cards); setIndex(0); setIsFlipped(false); setShuffled(false); }, [cards]);

  const goTo = useCallback((i: number) => { setIsFlipped(false); setTimeout(() => setIndex(i), 160); }, []);
  const next = useCallback(() => { if (index < deck.length - 1) goTo(index + 1); }, [index, deck.length, goTo]);
  const prev = useCallback(() => { if (index > 0) goTo(index - 1); }, [index, goTo]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if ((e.key === " " || e.key === "Enter") && e.target === document.body) { e.preventDefault(); setIsFlipped(f => !f); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [next, prev]);

  const current = deck[index];
  if (!current) return null;

  const iconBtn: CSSProperties = { minWidth: 44, minHeight: 44, borderRadius: 12, border: "2px solid #d1d5db", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" };
  const navBtn = (active: boolean, primary: boolean): CSSProperties => ({
    display: "flex", alignItems: "center", gap: 6, padding: "0 18px", minHeight: 44,
    borderRadius: 12, fontWeight: 700, fontSize: "0.9rem", border: "2px solid", cursor: active ? "pointer" : "not-allowed",
    background: !active ? "#f3f4f6" : primary ? "#1e3a8a" : "#fff",
    color: !active ? "#d1d5db" : primary ? "#fff" : "#374151",
    borderColor: !active ? "#e5e7eb" : primary ? "#1e3a8a" : "#d1d5db",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <FlipCard card={current} isFlipped={isFlipped} onFlip={() => setIsFlipped(f => !f)} onSwipeLeft={next} onSwipeRight={prev} />

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6b7280", letterSpacing: "0.06em", textTransform: "uppercase" }}>Card {index + 1} of {deck.length}</span>
        <SpecBadge tag={current.specTag} />
        {shuffled && <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#1d4ed8", background: "#eff6ff", padding: "2px 10px", borderRadius: 20 }}>Shuffled</span>}
      </div>

      <div style={{ width: "100%", maxWidth: 480, height: 5, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${((index + 1) / deck.length) * 100}%`, height: "100%", background: "#1e3a8a", transition: "width 0.3s" }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button style={navBtn(index > 0, false)} onClick={prev}><ChevronLeft size={18} /> Prev</button>
        <button style={iconBtn} title="Shuffle" onClick={() => { setDeck(shuffleArr(deck)); setIndex(0); setIsFlipped(false); setShuffled(true); }}><Shuffle size={17} /></button>
        <button style={iconBtn} title="Reset order" onClick={() => { setDeck(cards); setIndex(0); setIsFlipped(false); setShuffled(false); }}><RotateCcw size={17} /></button>
        <button style={navBtn(index < deck.length - 1, true)} onClick={next}>Next <ChevronRight size={18} /></button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MODE: STUDY (formerly Browse) — first-pass reading, recognition only
// ─────────────────────────────────────────────────────────────────────────────

const StudyMode = ({ cards }: { cards: FlashCard[] }) => {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  useEffect(() => setRevealed(new Set()), [cards]);
  const toggle = (id: number) => setRevealed(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allShown = revealed.size === cards.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#6b7280" }}>{cards.length} cards</span>
        <button onClick={() => setRevealed(allShown ? new Set() : new Set(cards.map(c => c.id)))}
          style={{ minHeight: 44, padding: "0 18px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
          {allShown ? "Hide all" : "Reveal all"}
        </button>
      </div>
      {cards.map((card, idx) => (
        <div key={card.id} style={{ background: "#fff", borderRadius: 14, border: `2px solid ${revealed.has(card.id) ? "#a7f3d0" : "#e5e7eb"}`, boxShadow: CARD_SHADOW, overflow: "hidden", cursor: "pointer" }}>
          <div onClick={() => toggle(card.id)} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", minHeight: 44 }}>
            <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: "50%", background: "#1e3a8a", color: "#fff", fontSize: "0.7rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>{idx + 1}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, color: "#111827", lineHeight: 1.5, margin: 0, fontSize: "0.95rem" }}>{card.q}</p>
              <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center", flexWrap: "wrap" }}>
                <SpecBadge tag={card.specTag} />{card.beyondSpec && <BeyondBadge />}
              </div>
            </div>
          </div>
          {revealed.has(card.id) && (
            <div style={{ padding: "12px 16px 14px 54px", borderTop: "2px solid #a7f3d0", background: "#ecfdf5" }}>
              <GlossaryText text={card.a} terms={card.terms} style={{ color: "#065f46", fontWeight: 600, lineHeight: 1.7, fontSize: "0.9rem", display: "block" }} />
              {card.explain && (
                <p style={{ margin: "10px 0 0", fontSize: "0.82rem", color: "#047857", lineHeight: 1.55, fontWeight: 500 }}>
                  <span style={{ fontWeight: 800 }}>Why: </span>{boldText(card.explain)}
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MODE: QUIZ (MCQ) — warm-up / confidence check, explicitly lower-rigor
// ─────────────────────────────────────────────────────────────────────────────

interface QuizState { deck: FlashCard[]; index: number; score: number; selected: string | null; complete: boolean; choices: string[] }

const QuizMode = ({ cards }: { cards: FlashCard[] }) => {
  const [st, setSt] = useState<QuizState>(() => {
    const d = shuffleArr(cards).slice(0, Math.min(10, cards.length));
    return { deck: d, index: 0, score: 0, selected: null, complete: false, choices: d[0] ? buildChoices(d[0]) : [] };
  });

  const start = useCallback(() => {
    const d = shuffleArr(cards).slice(0, Math.min(10, cards.length));
    setSt({ deck: d, index: 0, score: 0, selected: null, complete: false, choices: d[0] ? buildChoices(d[0]) : [] });
  }, [cards]);

  useEffect(() => { start(); }, [start]);

  const { deck, index, score, selected, complete, choices } = st;

  const select = (choice: string) =>
    setSt(s => s.selected !== null ? s : { ...s, selected: choice, score: choice === s.deck[s.index].a ? s.score + 1 : s.score });
  const nextQ = () => setSt(s => {
    const n = s.index + 1;
    if (n >= s.deck.length) return { ...s, complete: true };
    return { ...s, index: n, selected: null, choices: buildChoices(s.deck[n]) };
  });

  if (complete) {
    const pct = Math.round((score / deck.length) * 100);
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: "40px 28px", maxWidth: 400, width: "100%", textAlign: "center", display: "flex", flexDirection: "column", gap: 14, alignItems: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <p style={{ fontSize: "1.3rem", fontWeight: 700, color: "#111827", margin: 0 }}>Warm-up complete</p>
          <p style={{ fontSize: "3rem", fontWeight: 800, color: "#1e3a8a", margin: 0, lineHeight: 1 }}>{score}/{deck.length}</p>
          <p style={{ color: "#6b7280", fontWeight: 600, margin: 0 }}>{pct}% recognised</p>
          <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 12, padding: "10px 14px" }}>
            <p style={{ fontSize: "0.82rem", color: "#92400e", lineHeight: 1.5, margin: 0 }}>
              Recognising an answer is easier than recalling it. A high score here isn't exam-readiness — test yourself with <strong>Flashcards</strong> and <strong>Exam</strong> next.
            </p>
          </div>
          <button onClick={start} style={{ minHeight: 44, padding: "0 24px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", width: "100%" }}>Try again</button>
        </div>
      </div>
    );
  }

  const current = deck[index];
  if (!current) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 660, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Q{index + 1} of {deck.length}</span>
        <SpecBadge tag={current.specTag} />
      </div>
      <div style={{ width: "100%", height: 5, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${(index / deck.length) * 100}%`, height: "100%", background: "#1e3a8a", transition: "width 0.3s" }} />
      </div>
      <div style={{ background: "#fff", borderRadius: 16, border: "2px solid #e5e7eb", boxShadow: CARD_SHADOW, padding: "20px 22px", textAlign: "center" }}>
        <p style={{ fontSize: "1.05rem", fontWeight: 600, color: "#111827", lineHeight: 1.5, margin: 0 }}>{current.q}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {choices.map((choice, i) => {
          let bg = "#fff", border = "#e5e7eb", color = "#111827", lc = "#9ca3af";
          if (selected !== null) {
            if (choice === current.a) { bg = "#ecfdf5"; border = "#10b981"; color = "#065f46"; lc = "#065f46"; }
            else if (choice === selected) { bg = "#fef2f2"; border = "#ef4444"; color = "#991b1b"; lc = "#991b1b"; }
            else { bg = "#f9fafb"; color = "#9ca3af"; }
          }
          return (
            <button key={i} onClick={() => select(choice)}
              style={{ width: "100%", minHeight: 44, padding: "12px 16px", textAlign: "left", borderRadius: 12, border: `2px solid ${border}`, background: bg, color, fontWeight: 600, fontSize: "0.9rem", cursor: selected ? "default" : "pointer", lineHeight: 1.5 }}>
              <span style={{ fontWeight: 700, color: lc, marginRight: 10 }}>{["A", "B", "C", "D"][i]}.</span>{choice}
            </button>
          );
        })}
      </div>
      {selected !== null && current.explain && (
        <div style={{ background: "#eff6ff", borderLeft: "4px solid #1e3a8a", borderRadius: 10, padding: "10px 14px" }}>
          <p style={{ fontSize: "0.84rem", color: "#334155", lineHeight: 1.55, margin: 0, fontWeight: 500 }}>
            <span style={{ fontWeight: 800, color: selected === current.a ? "#059669" : "#b45309" }}>{selected === current.a ? "Why: " : "Not quite — "}</span>
            {boldText(current.explain)}
          </p>
        </div>
      )}
      {selected !== null && (
        <button onClick={nextQ} style={{ alignSelf: "center", minHeight: 44, padding: "0 32px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" }}>
          {index + 1 >= deck.length ? "See results" : "Next →"}
        </button>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MODE: SPOT THE MISTAKE — misconception check. Judge each statement true/false,
// then see the correction. Targets the classic 1.1.1 confusions head-on.
// ─────────────────────────────────────────────────────────────────────────────

const SpotMistakeMode = ({ myths }: { myths: MythItem[] }) => {
  const [deck, setDeck] = useState<MythItem[]>(() => shuffleArr(myths));
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const restart = useCallback(() => { setDeck(shuffleArr(myths)); setIndex(0); setChoice(null); setScore(0); setDone(false); }, [myths]);
  useEffect(() => { restart(); }, [restart]);

  if (done) {
    const pct = Math.round((score / deck.length) * 100);
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: "40px 28px", maxWidth: 400, width: "100%", textAlign: "center", display: "flex", flexDirection: "column", gap: 14, alignItems: "center", boxShadow: CARD_SHADOW }}>
          <p style={{ fontSize: "1.3rem", fontWeight: 700, color: "#111827", margin: 0 }}>Misconception check done</p>
          <p style={{ fontSize: "3rem", fontWeight: 800, color: "#1e3a8a", margin: 0, lineHeight: 1 }}>{score}/{deck.length}</p>
          <p style={{ color: "#6b7280", fontWeight: 600, margin: 0 }}>{pct}% spotted</p>
          <p style={{ fontSize: "0.84rem", color: "#6b7280", lineHeight: 1.5, margin: 0 }}>Re-read the corrections on any you missed — these are the traps examiners set.</p>
          <button onClick={restart} style={{ minHeight: 44, padding: "0 24px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", width: "100%" }}>Try again</button>
        </div>
      </div>
    );
  }

  const cur = deck[index];
  if (!cur) return null;
  const answered = choice !== null;
  const gotIt = answered && choice === cur.isTrue;

  const answer = (val: boolean) => { if (answered) return; setChoice(val); if (val === cur.isTrue) setScore(s => s + 1); };
  const next = () => { if (index + 1 >= deck.length) { setDone(true); return; } setIndex(i => i + 1); setChoice(null); };

  const verdictBtn = (val: boolean, label: string) => {
    let bg = "#fff", border = "#e5e7eb", color = "#374151";
    if (answered) {
      if (val === cur.isTrue) { bg = "#ecfdf5"; border = "#10b981"; color = "#065f46"; }
      else if (val === choice) { bg = "#fef2f2"; border = "#ef4444"; color = "#991b1b"; }
    }
    return (
      <button onClick={() => answer(val)} disabled={answered}
        style={{ flex: 1, minHeight: 52, borderRadius: 12, border: `2px solid ${border}`, background: bg, color, fontWeight: 800, fontSize: "1rem", cursor: answered ? "default" : "pointer" }}>
        {label}
      </button>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 640, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Statement {index + 1} of {deck.length}</span>
        <SpecBadge tag={cur.specTag} />
      </div>
      <div style={{ width: "100%", height: 5, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${(index / deck.length) * 100}%`, height: "100%", background: "#1e3a8a", transition: "width 0.3s" }} />
      </div>

      <div style={{ background: "#fff", borderRadius: 16, border: "2px solid #e5e7eb", boxShadow: CARD_SHADOW, padding: "22px 22px", textAlign: "center", display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9ca3af" }}>True or false?</span>
        <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", lineHeight: 1.5, margin: 0 }}>{cur.statement}</p>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        {verdictBtn(true, "True")}
        {verdictBtn(false, "False")}
      </div>

      {answered && (
        <div style={{ background: gotIt ? "#ecfdf5" : "#fef2f2", border: `2px solid ${gotIt ? "#10b981" : "#ef4444"}`, borderRadius: 12, padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ flexShrink: 0, marginTop: 1, color: gotIt ? "#059669" : "#dc2626" }}>{gotIt ? <Check size={18} strokeWidth={3} /> : <AlertTriangle size={18} />}</span>
          <div>
            <p style={{ fontSize: "0.86rem", fontWeight: 800, color: gotIt ? "#065f46" : "#991b1b", margin: "0 0 3px" }}>
              {gotIt ? "Correct" : "Careful"} — this statement is {cur.isTrue ? "TRUE" : "FALSE"}.
            </p>
            <p style={{ fontSize: "0.85rem", color: "#334155", lineHeight: 1.55, margin: 0, fontWeight: 500 }}>{boldText(cur.why)}</p>
          </div>
        </div>
      )}

      {answered && (
        <button onClick={next} style={{ alignSelf: "center", minHeight: 44, padding: "0 32px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" }}>
          {index + 1 >= deck.length ? "See results" : "Next →"}
        </button>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MODE: FILL IN — tap-to-select + tap-to-place (drag also supported on desktop)
// ─────────────────────────────────────────────────────────────────────────────

const FillInMode = ({ exercises }: { exercises: ClozeExercise[] }) => {
  const [exIdx, setExIdx] = useState(0);
  const [slots, setSlots] = useState<Record<number, string>>({});
  const [wordBank, setWordBank] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const dragWord = useRef<string | null>(null);

  const ex = exercises[exIdx];

  const initExercise = useCallback((exercise: ClozeExercise) => {
    setSlots({}); setChecked(false); setSelected(null); setWordBank(shuffleArr(exercise.words));
  }, []);

  useEffect(() => { setExIdx(0); }, [exercises]);
  useEffect(() => { if (ex) initExercise(ex); }, [ex, initExercise]);

  if (!ex) return <div style={{ textAlign: "center", padding: 60, color: "#9ca3af", fontWeight: 600 }}>No exercises available.</div>;

  const segments = parseCloze(ex.text);
  const slotSegments = segments.filter(s => s.type === "slot");
  const totalSlots = slotSegments.length;
  const filled = Object.keys(slots).length;

  const placeWord = (slotIdx: number, word: string) => {
    setSlots(prev => { const evicted = prev[slotIdx]; const nxt = { ...prev, [slotIdx]: word }; if (evicted) setWordBank(wb => shuffleArr([...wb, evicted])); return nxt; });
    setWordBank(wb => wb.filter(w => w !== word)); setSelected(null);
  };
  const removeFromSlot = (slotIdx: number) => {
    if (checked) return; const word = slots[slotIdx]; if (!word) return;
    setSlots(prev => { const n = { ...prev }; delete n[slotIdx]; return n; });
    setWordBank(wb => shuffleArr([...wb, word]));
  };
  const slotClick = (slotIdx: number) => { if (checked) return; if (slots[slotIdx]) { removeFromSlot(slotIdx); return; } if (selected !== null) placeWord(slotIdx, selected); };
  const wordClick = (word: string) => { if (checked) return; setSelected(s => s === word ? null : word); };

  let slotCounter = -1;
  const isCorrect = (si: number) => slotSegments[si] && slots[si] === slotSegments[si].value;
  const allCorrect = slotSegments.every((_, i) => isCorrect(i));
  const score = checked ? slotSegments.filter((_, i) => isCorrect(i)).length : 0;

  return (
    <div style={{ maxWidth: 740, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div>
          <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 3px" }}>Exercise {exIdx + 1} of {exercises.length}</p>
          <p style={{ fontSize: "1rem", fontWeight: 700, color: "#111827", margin: 0 }}>{ex.title}</p>
          <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}><SpecBadge tag={ex.specTag} />{ex.beyondSpec && <BeyondBadge />}</div>
        </div>
        {exercises.length > 1 && (
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button disabled={exIdx === 0} onClick={() => setExIdx(i => i - 1)} style={{ minWidth: 44, minHeight: 44, borderRadius: 10, border: "2px solid #d1d5db", background: "#fff", cursor: exIdx === 0 ? "not-allowed" : "pointer", opacity: exIdx === 0 ? 0.35 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronLeft size={16} color="#6b7280" /></button>
            <button disabled={exIdx === exercises.length - 1} onClick={() => setExIdx(i => i + 1)} style={{ minWidth: 44, minHeight: 44, borderRadius: 10, border: "2px solid #d1d5db", background: "#fff", cursor: exIdx === exercises.length - 1 ? "not-allowed" : "pointer", opacity: exIdx === exercises.length - 1 ? 0.35 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronRight size={16} color="#6b7280" /></button>
          </div>
        )}
      </div>

      <div style={{ background: "#fff", borderRadius: 16, border: "2px solid #e5e7eb", boxShadow: CARD_SHADOW, padding: "22px 22px", lineHeight: 2.4, fontSize: "1rem", fontWeight: 500, color: "#111827" }}>
        {segments.map((seg, i) => {
          if (seg.type === "text") return <span key={i}>{seg.value}</span>;
          slotCounter++; const si = slotCounter; const placed = slots[si];
          let borderColor = "#cbd5e1", bg = "#f8fafc", textColor = "#111827";
          if (checked) { if (isCorrect(si)) { borderColor = "#10b981"; bg = "#ecfdf5"; textColor = "#065f46"; } else if (placed) { borderColor = "#ef4444"; bg = "#fef2f2"; textColor = "#991b1b"; } }
          else if (placed) { borderColor = "#1e3a8a"; bg = "#eff6ff"; textColor = "#1e3a8a"; }
          else if (selected) { borderColor = "#1e3a8a"; bg = "#f0f7ff"; }
          return (
            <span key={i} onClick={() => slotClick(si)} onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); if (dragWord.current && !checked) { placeWord(si, dragWord.current); dragWord.current = null; } }}
              style={{ display: "inline-block", minWidth: 108, minHeight: 34, padding: "4px 12px", margin: "0 4px", borderRadius: 8, border: `2px dashed ${borderColor}`, background: bg, color: textColor, fontWeight: 700, fontSize: "0.9rem", textAlign: "center", verticalAlign: "middle", cursor: checked ? "default" : "pointer", lineHeight: 1.6 }}>
              {placed || (selected ? "tap to place" : "______")}
            </span>
          );
        })}
      </div>

      {checked && (
        <div style={{ background: allCorrect ? "#ecfdf5" : "#fef9c3", border: `2px solid ${allCorrect ? "#10b981" : "#fcd34d"}`, borderRadius: 12, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <span style={{ fontWeight: 700, color: allCorrect ? "#065f46" : "#92400e", fontSize: "0.9rem" }}>{allCorrect ? "Perfect — all correct." : `${score} of ${totalSlots} correct.`}</span>
          <button onClick={() => initExercise(ex)} style={{ minHeight: 44, padding: "0 16px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><RefreshCw size={14} /> Reset</button>
        </div>
      )}

      <div>
        <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
          Word bank — {checked ? "complete" : selected ? `'${selected}' selected — tap a slot` : "tap a word, then a slot"}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {wordBank.map((word, i) => (
            <div key={`${word}-${i}`} draggable={!checked} onDragStart={() => { dragWord.current = word; }} onClick={() => wordClick(word)}
              style={{ minHeight: 44, display: "flex", alignItems: "center", padding: "0 16px", borderRadius: 22, fontWeight: 700, fontSize: "0.88rem", border: "2px solid", cursor: checked ? "default" : "pointer",
                background: selected === word ? "#1e3a8a" : "#fff", color: selected === word ? "#fff" : "#374151", borderColor: selected === word ? "#1e3a8a" : "#d1d5db", userSelect: "none" }}>
              {word}
            </div>
          ))}
          {wordBank.length === 0 && !checked && <p style={{ color: "#9ca3af", fontSize: "0.85rem", fontStyle: "italic" }}>All words placed</p>}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
        {!checked && (
          <button onClick={() => setChecked(true)} disabled={filled < totalSlots}
            style={{ minHeight: 44, padding: "0 28px", background: filled < totalSlots ? "#e5e7eb" : "#1e3a8a", color: filled < totalSlots ? "#9ca3af" : "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "0.95rem", cursor: filled < totalSlots ? "not-allowed" : "pointer" }}>
            Check ({filled}/{totalSlots})
          </button>
        )}
        {checked && !allCorrect && (
          <button onClick={() => initExercise(ex)} style={{ minHeight: 44, padding: "0 28px", background: "#fff", color: "#1e3a8a", border: "2px solid #1e3a8a", borderRadius: 12, fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" }}>Try again</button>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MODE: EXAM — MCQ/state/short/scenario/extended + a Synoptic section
// ─────────────────────────────────────────────────────────────────────────────

const MarkPips = ({ marks, revealed, cfg }: { marks: number; revealed: boolean; cfg: { color: string; bg: string; border: string } }) => (
  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
    {Array.from({ length: marks }).map((_, i) => (
      <div key={i} style={{ width: 26, height: 26, borderRadius: "50%", border: `2px solid ${cfg.border}`, background: revealed ? cfg.bg : "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", fontWeight: 700, color: cfg.color }}>{revealed ? "✓" : i + 1}</div>
    ))}
    <span style={{ fontSize: "0.78rem", color: "#9ca3af", fontWeight: 500, marginLeft: 4 }}>{revealed ? "mark scheme below" : "answer, then reveal"}</span>
  </div>
);

const ExamMode = ({ questions, synoptic, section, showHints }: {
  questions: ExamQuestion[]; synoptic: SynopticQuestion[]; section: string; showHints: boolean;
}) => {
  const isSyn = section === "synoptic";
  const list = isSyn ? synoptic : (section === "all" ? questions : questions.filter(q => q.format === section));
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [ctx, setCtx] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [ticks, setTicks] = useState<Set<string>>(new Set());   // self-marked points
  const [showModel, setShowModel] = useState(false);

  const pickCtx = (i: number): string | null => {
    const q = list[i];
    return !isSyn && q ? resolvePrompt((q as ExamQuestion).prompt, (q as ExamQuestion).contexts).ctx : null;
  };
  const setup = (i: number) => { setIndex(i); setRevealed(false); setSelected(null); setTicks(new Set()); setShowModel(false); setCtx(pickCtx(i)); };
  const toggleTick = (k: string) => setTicks(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });

  // Reset ONLY when the section changes — not on every render. (list is a fresh
  // array each render, so depending on it here would reset the reveal instantly.)
  useEffect(() => { setIndex(0); setRevealed(false); setSelected(null); setTicks(new Set()); setShowModel(false); setCtx(pickCtx(0)); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  if (!list.length) return <div style={{ textAlign: "center", padding: 60, color: "#9ca3af", fontWeight: 600 }}>No questions in this section.</div>;

  // Clamp: switching to a shorter section leaves `index` out of range for one
  // render before the reset effect runs — guard against reading undefined.
  const idx = Math.min(index, list.length - 1);
  const q = list[idx];
  const format = q.format;
  const cfg = MARK_FORMATS[format];
  const promptText = !isSyn ? (ctx ? (q as ExamQuestion).prompt.replace("{context}", ctx) : (q as ExamQuestion).prompt) : (q as SynopticQuestion).prompt;

  const nav = (dir: number) => { const n = idx + dir; if (n >= 0 && n < list.length) setup(n); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 720, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button onClick={e => { e.stopPropagation(); showTooltip(`${cfg.label} — what it's asking`, COMMAND_GUIDE[format], e.currentTarget as HTMLElement); }}
            title="What this command word wants"
            style={{ minHeight: 24, display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 12px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, background: cfg.bg, color: cfg.color, border: `2px solid ${cfg.border}`, cursor: "pointer" }}>
            {cfg.label} <Info size={12} />
          </button>
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6b7280" }}>[{q.marks} mark{q.marks !== 1 ? "s" : ""}]</span>
          {isSyn && (q as SynopticQuestion).specTags.map(t => <SpecBadge key={t} tag={t} />)}
          {!isSyn && <SpecBadge tag={(q as ExamQuestion).specTag} />}
        </div>
        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#9ca3af" }}>{idx + 1} of {list.length}</span>
      </div>

      {isSyn && (
        <div style={{ background: "#eef2ff", border: "1.5px solid #c7d2fe", borderRadius: 10, padding: "8px 14px" }}>
          <p style={{ fontSize: "0.78rem", color: "#4338ca", fontWeight: 600, margin: 0 }}>Synoptic — this question combines understanding from more than one sub-topic, as real J277 questions do.</p>
        </div>
      )}

      {/* Question card */}
      <div style={{ background: "#fff", borderRadius: 16, border: `2px solid ${cfg.border}`, boxShadow: CARD_SHADOW, padding: "22px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
        <p style={{ fontSize: "1.08rem", fontWeight: 700, color: "#111827", lineHeight: 1.5, margin: 0 }}>{promptText}</p>

        {/* MCQ options */}
        {format === "mcq" && !isSyn && (q as ExamQuestion).options && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(q as ExamQuestion).options!.map((opt, i) => {
              const ans = (q as ExamQuestion).answerIndex;
              let bg = "#fff", border = "#e5e7eb", color = "#111827";
              if (revealed || selected !== null) {
                if (i === ans) { bg = "#ecfdf5"; border = "#10b981"; color = "#065f46"; }
                else if (i === selected) { bg = "#fef2f2"; border = "#ef4444"; color = "#991b1b"; }
              }
              return (
                <button key={i} onClick={() => { if (selected === null) { setSelected(i); setRevealed(true); } }}
                  style={{ minHeight: 44, textAlign: "left", padding: "10px 14px", borderRadius: 10, border: `2px solid ${border}`, background: bg, color, fontWeight: 600, fontSize: "0.9rem", cursor: selected === null ? "pointer" : "default", lineHeight: 1.4 }}>
                  <span style={{ fontWeight: 700, marginRight: 8 }}>{["A", "B", "C", "D"][i]}.</span>{opt}
                </button>
              );
            })}
          </div>
        )}

        {showHints && (
          <div style={{ background: "#f8fafc", borderRadius: 10, padding: "9px 14px", borderLeft: `4px solid ${cfg.border}` }}>
            <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#6b7280", margin: 0 }}><span style={{ color: cfg.color }}>Hint:</span> {q.hint}</p>
          </div>
        )}

        {format !== "mcq" && <MarkPips marks={q.marks} revealed={revealed} cfg={cfg} />}
      </div>

      {/* Reveal button (non-MCQ; MCQ reveals on select) */}
      {!revealed && format !== "mcq" && (
        <button onClick={() => setRevealed(true)} style={{ alignSelf: "center", minHeight: 44, padding: "0 32px", background: cfg.color, color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" }}>Reveal mark scheme</button>
      )}

      {/* Mark scheme */}
      {revealed && (
        <div style={{ background: "#fff", borderRadius: 16, border: `2px solid ${cfg.border}`, boxShadow: CARD_SHADOW, overflow: "hidden" }}>
          <div style={{ background: cfg.bg, padding: "12px 18px", borderBottom: `2px solid ${cfg.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <p style={{ fontWeight: 700, fontSize: "0.85rem", color: cfg.color, margin: 0 }}>Mark scheme — {q.marks} mark{q.marks !== 1 ? "s" : ""}</p>
            {format !== "mcq" && <span style={{ fontSize: "0.82rem", fontWeight: 800, color: cfg.color }}>You: {Math.min(ticks.size, q.marks)} / {q.marks}</span>}
          </div>
          <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
            {format !== "mcq" && (
              <p style={{ fontSize: "0.78rem", color: "#6b7280", fontWeight: 600, margin: 0 }}>Tick each point you actually made — mark yourself honestly.</p>
            )}
            {isSyn
              ? (q as SynopticQuestion).markScheme.map((group, gi) => (
                  <div key={group.tag}>
                    <div style={{ marginBottom: 8 }}><SpecBadge tag={group.tag} /></div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 2 }}>
                      {group.points.map((pt, i) => {
                        const key = `${gi}-${i}`; const ticked = ticks.has(key);
                        return (
                          <div key={i} onClick={() => toggleTick(key)} style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", background: ticked ? "#ecfdf5" : "transparent", borderRadius: 8, padding: "4px 6px", margin: "-2px -4px" }}>
                            <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 6, border: `2px solid ${ticked ? "#10b981" : cfg.border}`, background: ticked ? "#10b981" : "#fff", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>{ticked && <Check size={15} strokeWidth={3} />}</span>
                            <p style={{ fontSize: "0.9rem", color: "#374151", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{pt}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              : (q as ExamQuestion).markScheme.map((pt, i) => {
                  const key = String(i); const ticked = ticks.has(key); const tickable = format !== "mcq";
                  return (
                    <div key={i} onClick={tickable ? () => toggleTick(key) : undefined}
                      style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: tickable ? "pointer" : "default", background: ticked ? "#ecfdf5" : "transparent", borderRadius: 8, padding: "4px 6px", margin: "-2px -4px" }}>
                      {tickable
                        ? <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 6, border: `2px solid ${ticked ? "#10b981" : cfg.border}`, background: ticked ? "#10b981" : "#fff", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>{ticked && <Check size={15} strokeWidth={3} />}</span>
                        : <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: "50%", background: cfg.bg, border: `2px solid ${cfg.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, color: cfg.color, marginTop: 1 }}>{i + 1}</span>}
                      <p style={{ fontSize: "0.9rem", color: "#374151", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{pt}</p>
                    </div>
                  );
                })}

            {/* context-specific model notes (non-synoptic) */}
            {!isSyn && ctx && (q as ExamQuestion).modelNotes?.[ctx] && (
              <div style={{ marginTop: 4, padding: "12px 14px", background: "#f8fafc", borderRadius: 10, borderLeft: `4px solid ${cfg.border}` }}>
                <p style={{ fontSize: "0.74rem", fontWeight: 700, color: "#6b7280", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Model notes for this version</p>
                {(q as ExamQuestion).modelNotes![ctx].map((n, i) => (
                  <p key={i} style={{ fontSize: "0.85rem", color: "#374151", lineHeight: 1.6, margin: i ? "6px 0 0" : 0 }}>{n}</p>
                ))}
              </div>
            )}

            {/* worked model answer — how to turn the mark points into a real answer */}
            {q.modelAnswer && (
              <div>
                <button onClick={() => setShowModel(m => !m)}
                  style={{ minHeight: 40, padding: "0 16px", borderRadius: 10, fontWeight: 700, fontSize: "0.82rem", border: `2px solid ${cfg.border}`, background: showModel ? cfg.bg : "#fff", color: cfg.color, cursor: "pointer" }}>
                  {showModel ? "Hide model answer" : "Show model answer"}
                </button>
                {showModel && (
                  <div style={{ marginTop: 10, background: "#f8fafc", borderRadius: 10, borderLeft: `4px solid ${cfg.border}`, padding: "12px 14px" }}>
                    <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Model answer — bold shows where the marks are</p>
                    <p style={{ fontSize: "0.9rem", color: "#334155", lineHeight: 1.7, margin: 0 }}>{boldText(q.modelAnswer)}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <button onClick={() => nav(-1)} disabled={idx === 0} style={{ minHeight: 44, display: "flex", alignItems: "center", gap: 6, padding: "0 16px", borderRadius: 12, fontWeight: 700, fontSize: "0.88rem", border: "2px solid", cursor: idx === 0 ? "not-allowed" : "pointer", background: idx === 0 ? "#f3f4f6" : "#fff", color: idx === 0 ? "#d1d5db" : "#374151", borderColor: idx === 0 ? "#e5e7eb" : "#d1d5db" }}><ChevronLeft size={18} /> Prev</button>
        {!isSyn && (q as ExamQuestion).contexts && (
          <button onClick={() => setup(idx)} title="New version" style={{ minHeight: 44, display: "flex", alignItems: "center", gap: 6, padding: "0 14px", borderRadius: 12, fontWeight: 700, fontSize: "0.82rem", border: `2px solid ${cfg.border}`, background: cfg.bg, color: cfg.color, cursor: "pointer" }}><RefreshCw size={15} /> New</button>
        )}
        <button onClick={() => nav(1)} disabled={idx === list.length - 1} style={{ minHeight: 44, display: "flex", alignItems: "center", gap: 6, padding: "0 16px", borderRadius: 12, fontWeight: 700, fontSize: "0.88rem", border: "2px solid", cursor: idx === list.length - 1 ? "not-allowed" : "pointer", background: idx === list.length - 1 ? "#f3f4f6" : "#1e3a8a", color: idx === list.length - 1 ? "#d1d5db" : "#fff", borderColor: idx === list.length - 1 ? "#e5e7eb" : "#1e3a8a" }}>Next <ChevronRight size={18} /></button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// INFO MODAL
// ─────────────────────────────────────────────────────────────────────────────

const INFO_SECTIONS = [
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

const InfoModal = ({ onClose }: { onClose: () => void }) => (
  <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
    <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 560, maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: "1px solid #f3f4f6" }}>
        <h2 style={{ fontWeight: 800, fontSize: "1.15rem", color: "#111827", margin: 0 }}>1.1.1 CPU Architecture</h2>
        <button onClick={onClose} style={{ minWidth: 44, minHeight: 44, borderRadius: "50%", border: "none", background: "#f3f4f6", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={18} color="#6b7280" /></button>
      </div>
      <div style={{ overflowY: "auto", padding: "18px 22px", display: "flex", flexDirection: "column", gap: 22 }}>
        {INFO_SECTIONS.map(s => (
          <div key={s.title}>
            <h3 style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e3a8a", margin: "0 0 10px" }}>{s.title}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {s.items.map(item => (
                <div key={item.label} style={{ background: "#f9fafb", borderRadius: 10, padding: "10px 14px" }}>
                  <p style={{ fontWeight: 700, fontSize: "0.82rem", color: "#374151", margin: "0 0 2px" }}>{item.label}</p>
                  <p style={{ fontSize: "0.82rem", color: "#6b7280", lineHeight: 1.6, margin: 0 }}>{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// NAV — compact top segmented (desktop) / fixed bottom bar (mobile)
// ─────────────────────────────────────────────────────────────────────────────

const ACTIVITIES = [
  { key: "learn",     label: "Learn",  icon: GraduationCap, blurb: "Taught walkthroughs with a diagram — start here to understand it before testing yourself." },
  { key: "study",     label: "Study",  icon: BookOpen,    blurb: "Read the question-and-answer cards — recognition, low effort." },
  { key: "flashcard", label: "Cards",  icon: Layers,      blurb: "Active recall — answer before you flip." },
  { key: "quiz",      label: "Quiz",   icon: CheckSquare, blurb: "MCQ warm-up — a high score here isn't exam-readiness." },
  { key: "fillin",    label: "Fill",   icon: PenLine,     blurb: "Tap a term, then tap a slot to place it." },
  { key: "exam",      label: "Exam",   icon: FileText,    blurb: "Real J277 formats, tariffs and synoptic questions." },
] as const;

const EXAM_SECTIONS = [
  { key: "all", label: "All" },
  { key: "mcq", label: "MCQ" },
  { key: "state", label: "State" },
  { key: "short", label: "Short" },
  { key: "scenario", label: "Scenario" },
  { key: "extended", label: "Extended" },
  { key: "synoptic", label: "Synoptic" },
];

const BottomNav = ({ activity, setActivity }: { activity: string; setActivity: (a: string) => void }) => (
  <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 90, background: "#fff", borderTop: "1px solid #e5e7eb", boxShadow: "0 -4px 20px rgba(0,0,0,0.06)", display: "flex", paddingBottom: "env(safe-area-inset-bottom)" }}>
    {ACTIVITIES.map(a => {
      const active = activity === a.key; const Icon = a.icon;
      return (
        <button key={a.key} onClick={() => setActivity(a.key)}
          style={{ flex: 1, minWidth: 0, minHeight: 56, border: "none", background: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, color: active ? "#1e3a8a" : "#9ca3af", padding: "6px 1px" }}>
          <Icon size={19} strokeWidth={active ? 2.4 : 2} />
          <span style={{ fontSize: "0.62rem", fontWeight: 700 }}>{a.label}</span>
        </button>
      );
    })}
  </div>
);

const DesktopTabs = ({ activity, setActivity }: { activity: string; setActivity: (a: string) => void }) => (
  <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
    {ACTIVITIES.map(a => {
      const active = activity === a.key; const Icon = a.icon;
      return (
        <button key={a.key} onClick={() => setActivity(a.key)}
          style={{ minHeight: 48, display: "flex", alignItems: "center", gap: 8, padding: "0 22px", borderRadius: 12, fontWeight: 700, fontSize: "1.05rem", border: "none", cursor: "pointer", transition: "all 0.15s",
            background: active ? NAVY : "#fff", color: active ? "#fff" : "#1f2937", boxShadow: TAB_SHADOW }}>
          <Icon size={18} /> {a.label}
        </button>
      );
    })}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const isMobile = useIsMobile();
  const [activity, setActivity] = useState("learn");
  const [examSection, setExamSection] = useState("all");
  const [quizMode, setQuizMode] = useState("mcq");   // "mcq" | "spot"
  const [showHints, setShowHints] = useState(true);
  const [showBeyond, setShowBeyond] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [tip, setTip] = useState<CSTooltip | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { registerTooltip(setTip); return () => registerTooltip(null); }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    if (menuOpen) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuOpen]);

  const cards = coreCards(showBeyond);
  const cloze = coreCloze(showBeyond);
  const exam = coreExam(showBeyond);
  const activeBlurb = activity === "quiz" && quizMode === "spot"
    ? "Spot the mistake — judge each statement, then read the correction. Targets the classic traps."
    : (ACTIVITIES.find(a => a.key === activity)?.blurb ?? "");
  const contentKey = `${activity}-${examSection}-${quizMode}-${showBeyond}`;

  return (
    <>
      {tip && <TooltipOverlay tip={tip} onClose={() => setTip(null)} />}

      {/* Header */}
      <div className="bg-blue-900 shadow-lg" style={{ position: "sticky", top: 0, zIndex: 95 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "6px 10px" : "12px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => { window.location.href = "/"; }} className="text-white hover:bg-blue-800 rounded-lg transition-colors" style={{ minHeight: 44, display: "flex", alignItems: "center", gap: 8, padding: "0 10px" }}>
            <Home size={24} /><span className="font-semibold" style={{ fontSize: "1.1rem" }}>Home</span>
          </button>
          <div className="relative" ref={menuRef}>
              <button onClick={() => setMenuOpen(o => !o)} className="text-white hover:bg-blue-800 rounded-lg transition-colors" style={{ minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>{menuOpen ? <X size={24} /> : <Menu size={24} />}</button>
              {menuOpen && (
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", border: "1px solid #e5e7eb", minWidth: 240, zIndex: 100, overflow: "hidden" }}>
                  <button onClick={() => { setInfoOpen(true); setMenuOpen(false); }} style={{ width: "100%", minHeight: 48, display: "flex", alignItems: "center", gap: 10, padding: "0 16px", background: "none", border: "none", borderBottom: "1px solid #f3f4f6", cursor: "pointer", fontSize: "0.88rem", fontWeight: 600, color: "#374151" }}><Info size={16} color="#9ca3af" /> Topic information</button>
                  <label style={{ width: "100%", minHeight: 48, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "0 16px", cursor: "pointer" }}>
                    <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#374151" }}>Beyond spec</span>
                    <div onClick={e => { e.preventDefault(); setShowBeyond(v => !v); }} style={{ width: 44, height: 24, borderRadius: 12, background: showBeyond ? "#1e3a8a" : "#d1d5db", position: "relative", flexShrink: 0 }}>
                      <div style={{ position: "absolute", top: 4, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "transform 0.2s", transform: showBeyond ? "translateX(24px)" : "translateX(4px)" }} />
                    </div>
                  </label>
                </div>
              )}
            </div>
        </div>
      </div>

      {infoOpen && <InfoModal onClose={() => setInfoOpen(false)} />}

      {/* Page */}
      <div style={{ minHeight: "100vh", backgroundColor: "#f5f3f0", padding: isMobile ? "14px 12px 84px" : "24px 20px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          {/* Page title — big centred heading + divider, matching the maths tools */}
          <h1 style={{ textAlign: "center", fontWeight: 800, color: "#000", margin: isMobile ? "2px 0 8px" : "4px 0 12px", fontSize: isMobile ? "1.7rem" : "3rem", lineHeight: 1.12 }}>
            1.1.1 CPU Architecture
          </h1>
          <div style={{ height: 1, background: "#d1d5db", maxWidth: 880, margin: isMobile ? "0 auto 14px" : "0 auto 22px" }} />

          {/* Desktop tabs (mobile uses bottom bar) */}
          {!isMobile && (
            <div style={{ marginBottom: 18 }}>
              <DesktopTabs activity={activity} setActivity={setActivity} />
            </div>
          )}

          {/* Beyond-spec banner */}
          {showBeyond && (
            <div style={{ maxWidth: 720, margin: "0 auto 12px", background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 10, padding: "8px 14px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <BeyondBadge /><span style={{ fontSize: "0.8rem", color: "#92400e", fontWeight: 600 }}>content included — not required for 1.1.1</span>
            </div>
          )}

          {/* Activity blurb — makes the rigor of each mode explicit */}
          <p style={{ textAlign: "center", fontSize: "0.82rem", color: "#6b7280", fontWeight: 500, margin: "0 auto 14px", maxWidth: 560, lineHeight: 1.5 }}>{activeBlurb}</p>

          {/* Quiz sub-controls — MCQ warm-up vs Spot-the-Mistake */}
          {activity === "quiz" && (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
              <SegRow options={[{ key: "mcq", label: "Multiple choice" }, { key: "spot", label: "Spot the mistake" }]} value={quizMode} onChange={setQuizMode} />
            </div>
          )}

          {/* Exam / mode sub-controls */}
          {activity === "exam" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <SegRow options={EXAM_SECTIONS} value={examSection} onChange={setExamSection} />
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <div onClick={() => setShowHints(v => !v)} style={{ width: 44, height: 24, borderRadius: 12, background: showHints ? "#1e3a8a" : "#d1d5db", position: "relative" }}>
                  <div style={{ position: "absolute", top: 4, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "transform 0.2s", transform: showHints ? "translateX(24px)" : "translateX(4px)" }} />
                </div>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151" }}>Hints</span>
              </label>
            </div>
          )}

          {/* Content */}
          {activity === "learn"     && <LearnMode     key={contentKey} />}
          {activity === "study"     && <StudyMode     key={contentKey} cards={cards} />}
          {activity === "flashcard" && <FlashcardMode key={contentKey} cards={cards} />}
          {activity === "quiz"      && (quizMode === "spot"
            ? <SpotMistakeMode key={contentKey} myths={MYTHS} />
            : <QuizMode        key={contentKey} cards={cards} />)}
          {activity === "fillin"    && <FillInMode    key={contentKey} exercises={cloze} />}
          {activity === "exam"      && <ExamMode      key={contentKey} questions={exam} synoptic={SYNOPTIC_QUESTIONS} section={examSection} showHints={showHints} />}

        </div>
      </div>

      {isMobile && <BottomNav activity={activity} setActivity={setActivity} />}
    </>
  );
}
