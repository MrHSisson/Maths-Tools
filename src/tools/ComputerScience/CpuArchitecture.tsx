import { useState, useEffect, useCallback, useRef, CSSProperties } from "react";
import {
  Home, Menu, X, ChevronLeft, ChevronRight, Shuffle, RotateCcw, RefreshCw,
  BookOpen, Layers, CheckSquare, PenLine, FileText, Info,
} from "lucide-react";

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
}

interface GlossarySegment { type: "text" | "term"; value: string; def?: string }
interface TooltipState { title: string; def: string; rect: DOMRect }

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

const parseGlossaryText = (text: string, overrideTerms?: string[]): GlossarySegment[] => {
  const termKeys = overrideTerms?.length
    ? overrideTerms.filter(t => GLOSSARY[t])
    : Object.keys(GLOSSARY).filter(t => {
        const re = new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
        return re.test(text);
      });
  const sorted = [...termKeys].sort((a, b) => b.length - a.length);
  if (!sorted.length) return [{ type: "text", value: text }];
  const pattern = sorted.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const re = new RegExp(`(${pattern})`, "gi");
  const parts = text.split(re);
  const used = new Set<string>();
  return parts.filter(p => p !== "").map(part => {
    const matchedKey = sorted.find(t => t.toLowerCase() === part.toLowerCase());
    if (matchedKey && !used.has(matchedKey.toLowerCase())) {
      used.add(matchedKey.toLowerCase());
      return { type: "term" as const, value: part, def: GLOSSARY[matchedKey] };
    }
    return { type: "text" as const, value: part };
  });
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
    distractors: ["It stores the result of the calculation", "It is copied into the Accumulator", "It is reset to zero after every instruction"] },

  // ── R2: component roles ─────────────────────────────────────────────────────
  { id: 6, specTag: "1.1.1-R2", q: "What is the role of the ALU?",
    a: "Performs arithmetic calculations and logical comparisons", terms: [],
    distractors: ["Coordinates all of the CPU's components", "Stores the address of the next instruction", "Holds frequently used data close to the CPU"] },
  { id: 7, specTag: "1.1.1-R2", q: "What is the role of the Control Unit (CU)?",
    a: "Coordinates the CPU's components and controls the flow of data during the cycle", terms: ["CPU"],
    distractors: ["Performs all arithmetic and logical operations", "Stores the result of the last calculation", "Holds the data fetched from memory"] },
  { id: 8, specTag: "1.1.1-R2", q: "What is the purpose of cache in the CPU?",
    a: "Stores frequently used data and instructions close to the CPU for fast access", terms: ["CPU"],
    distractors: ["Permanently stores the operating system", "Stores the address of the next instruction", "Performs logical comparisons for the CPU"] },
  { id: 9, specTag: "1.1.1-R2", q: "What is the role of the registers in the CPU?",
    a: "Very fast, small storage locations that hold the values the CPU is working with right now", terms: ["CPU"],
    distractors: ["Large stores that replace the need for RAM", "Permanent storage for the operating system", "The part that decodes each instruction"] },

  // ── R3: each register and what it stores (data or address) ──────────────────
  { id: 10, specTag: "1.1.1-R3", q: "What does the Program Counter (PC) store?",
    a: "The address of the next instruction to be fetched", terms: ["address"],
    distractors: ["The result of the last calculation", "The data fetched from memory", "The instruction being decoded"] },
  { id: 11, specTag: "1.1.1-R3", q: "What does the Memory Address Register (MAR) store?",
    a: "The address of the memory location to be read from or written to", terms: ["address"],
    distractors: ["The data read from memory", "The result of the last ALU operation", "The number of instructions executed"] },
  { id: 12, specTag: "1.1.1-R3", q: "What does the Memory Data Register (MDR) store?",
    a: "The data that has just been read from, or is about to be written to, memory", terms: ["data"],
    distractors: ["The address of the memory location being used", "The address of the next instruction", "The result of a logical comparison"] },
  { id: 13, specTag: "1.1.1-R3", q: "What does the Accumulator (ACC) store?",
    a: "The data result of a calculation carried out by the ALU", terms: ["data", "ALU"],
    distractors: ["The address of the next instruction", "The address of the memory location to access", "The instruction currently being decoded"] },
  { id: 14, specTag: "1.1.1-R3", q: "In the Von Neumann architecture, which four registers are used?",
    a: "The MAR, MDR, Program Counter and Accumulator", terms: ["MAR", "MDR", "Program Counter", "Accumulator"],
    distractors: ["The ALU, CU, cache and PC", "The PC, CIR, data bus and address bus", "The L1, L2, L3 and MDR"] },

  // ── R4: the difference between storing data and an address (the gap) ────────
  { id: 15, specTag: "1.1.1-R4", q: "What is the difference between storing an ADDRESS and storing DATA?",
    a: "An address says WHERE a value is in memory; data is the actual value itself", terms: ["address", "data"],
    distractors: ["An address is always larger than a piece of data", "Data is stored in the CPU, an address is stored in RAM", "There is no difference — the terms mean the same thing"] },
  { id: 16, specTag: "1.1.1-R4", q: "Which registers store an ADDRESS, and which store DATA?",
    a: "Addresses: the PC and MAR. Data: the MDR and Accumulator", terms: ["PC", "MAR", "MDR", "Accumulator"],
    distractors: ["Addresses: MDR and ACC. Data: PC and MAR", "All four registers store only data", "All four registers store only addresses"] },
  { id: 17, specTag: "1.1.1-R4", q: "The MAR holds an address and the MDR holds data. Why does this matter?",
    a: "The MAR's address selects which memory location to use; the MDR then carries the value in or out of it", terms: ["MAR", "MDR"],
    distractors: ["Both actually hold the same address twice for safety", "The MDR chooses the location and the MAR holds the value", "Neither is needed if cache is used instead"] },

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
  },
  {
    id: "x6", specTag: "1.1.1-R4", format: "short", marks: 2,
    prompt: "Explain the difference between storing data and storing an address.",
    hint: "Define each, and make the contrast explicit.",
    markScheme: [
      "An address identifies where a value is located in memory (1)",
      "Data is the actual value stored/processed, not its location (1)",
    ],
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
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const shuffleArr = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const coreCards  = (showBeyond: boolean) => CARDS.filter(c => showBeyond || !c.beyondSpec);
const coreCloze  = (showBeyond: boolean) => CLOZE.filter(c => showBeyond || !c.beyondSpec);
const coreExam   = (showBeyond: boolean) => EXAM_QUESTIONS.filter(q => showBeyond || !q.beyondSpec);

const buildChoices = (card: FlashCard): string[] => {
  if (card.distractors && card.distractors.length >= 3)
    return shuffleArr([card.a, ...card.distractors.slice(0, 3)]);
  const others = CARDS.map(c => c.a).filter(a => a !== card.a);
  return shuffleArr([card.a, ...shuffleArr(others).slice(0, 3)]);
};

const parseCloze = (text: string): { type: "text" | "slot"; value: string }[] => {
  const parts = text.split(/(\[[^\]]+\])/g);
  return parts.map(p =>
    p.startsWith("[") && p.endsWith("]")
      ? { type: "slot" as const, value: p.slice(1, -1) }
      : { type: "text" as const, value: p });
};

const resolvePrompt = (prompt: string, contexts?: string[]): { text: string; ctx: string | null } => {
  if (!contexts || !contexts.length) return { text: prompt, ctx: null };
  const ctx = contexts[Math.floor(Math.random() * contexts.length)];
  return { text: prompt.replace("{context}", ctx), ctx };
};

// mobile detection
const useIsMobile = (): boolean => {
  const [m, setM] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const h = () => setM(mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return m;
};

// ─────────────────────────────────────────────────────────────────────────────
// TOUCH-FIRST GLOSSARY TOOLTIP
// Tap a term to open; tap the backdrop or the × to close. No hover dependency.
// ─────────────────────────────────────────────────────────────────────────────

let _setActiveTooltip: ((t: TooltipState | null) => void) | null = null;

const TooltipOverlay = ({ tip, onClose }: { tip: TooltipState; onClose: () => void }) => {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const tipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tipRef.current) return;
    const tw = tipRef.current.offsetWidth || 260;
    const th = tipRef.current.offsetHeight || 90;
    const cx = tip.rect.left + tip.rect.width / 2;
    let left = cx - tw / 2;
    left = Math.max(10, Math.min(left, window.innerWidth - tw - 10));
    let top = tip.rect.top + window.scrollY - th - 12;
    if (top < window.scrollY + 8) top = tip.rect.bottom + window.scrollY + 12; // flip below if no room
    setPos({ top, left });
  }, [tip]);

  return (
    <>
      {/* Backdrop — any tap dismisses. Works identically for touch and mouse. */}
      <div onClick={onClose} onTouchStart={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 9998, background: "transparent" }} />
      <div ref={tipRef}
        style={{
          position: "absolute", top: pos.top, left: pos.left, zIndex: 9999,
          background: "#0f172a", color: "#f8fafc", borderRadius: 12, padding: "12px 16px",
          fontSize: "0.85rem", lineHeight: 1.6, fontWeight: 500, width: 260,
          boxShadow: "0 8px 30px rgba(0,0,0,0.45)",
        }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 4 }}>
          <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#7dd3fc" }}>{tip.title}</span>
          <button onClick={onClose}
            style={{ flexShrink: 0, width: 28, height: 28, marginTop: -2, marginRight: -6, borderRadius: 8, border: "none",
              background: "rgba(255,255,255,0.12)", color: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={15} />
          </button>
        </div>
        <span style={{ color: "rgba(248,250,252,0.9)" }}>{tip.def}</span>
      </div>
    </>
  );
};

const GlossaryText = ({ text, terms, style, onCard = false }: { text: string; terms?: string[]; style?: CSSProperties; onCard?: boolean }) => {
  const segments = parseGlossaryText(text, terms);
  const open = (e: React.MouseEvent, term: string, def: string) => {
    e.stopPropagation();
    _setActiveTooltip?.({ title: term, def, rect: (e.currentTarget as HTMLElement).getBoundingClientRect() });
  };
  return (
    <span style={style}>
      {segments.map((seg, i) =>
        seg.type === "text"
          ? <span key={i}>{seg.value}</span>
          : <span key={i} onClick={e => open(e, seg.value, seg.def!)}
              style={{ borderBottom: `2px dotted ${onCard ? "rgba(255,255,255,0.75)" : "#1e3a8a"}`, cursor: "pointer", padding: "0 1px" }}>
              {seg.value}
            </span>
      )}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED SMALL UI
// ─────────────────────────────────────────────────────────────────────────────

const SpecBadge = ({ tag }: { tag: SpecTag }) => {
  const open = (e: React.MouseEvent) => {
    e.stopPropagation();
    _setActiveTooltip?.({ title: tag, def: SPEC_DESCRIPTIONS[tag], rect: (e.currentTarget as HTMLElement).getBoundingClientRect() });
  };
  return (
    <button onClick={open}
      style={{ minHeight: 24, padding: "2px 9px", borderRadius: 20, border: "1.5px solid #cbd5e1",
        background: "#f8fafc", color: "#475569", fontSize: "0.68rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
      {tag}
    </button>
  );
};

const BeyondBadge = () => (
  <span style={{ padding: "2px 9px", borderRadius: 20, border: "1.5px solid #fbbf24", background: "#fffbeb",
    color: "#92400e", fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.03em", whiteSpace: "nowrap" }}>
    BEYOND SPEC
  </span>
);

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
        <div key={card.id} style={{ background: "#fff", borderRadius: 14, border: `2px solid ${revealed.has(card.id) ? "#a7f3d0" : "#e5e7eb"}`, overflow: "hidden", cursor: "pointer" }}>
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
      <div style={{ background: "#fff", borderRadius: 16, border: "2px solid #e5e7eb", padding: "20px 22px", textAlign: "center" }}>
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
      {selected !== null && (
        <button onClick={nextQ} style={{ alignSelf: "center", minHeight: 44, padding: "0 32px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" }}>
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

      <div style={{ background: "#fff", borderRadius: 16, border: "2px solid #e5e7eb", padding: "22px 22px", lineHeight: 2.4, fontSize: "1rem", fontWeight: 500, color: "#111827" }}>
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

  const setup = useCallback((i: number) => {
    setIndex(i); setRevealed(false); setSelected(null);
    const q = list[i];
    setCtx(!isSyn && q ? resolvePrompt((q as ExamQuestion).prompt, (q as ExamQuestion).contexts).ctx : null);
  }, [list, isSyn]);

  useEffect(() => { setup(0); }, [section, setup]);

  if (!list.length) return <div style={{ textAlign: "center", padding: 60, color: "#9ca3af", fontWeight: 600 }}>No questions in this section.</div>;

  const q = list[index];
  const format = q.format;
  const cfg = MARK_FORMATS[format];
  const promptText = !isSyn ? (ctx ? (q as ExamQuestion).prompt.replace("{context}", ctx) : (q as ExamQuestion).prompt) : (q as SynopticQuestion).prompt;

  const nav = (dir: number) => { const n = index + dir; if (n >= 0 && n < list.length) setup(n); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 720, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ minHeight: 24, display: "inline-flex", alignItems: "center", padding: "3px 12px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, background: cfg.bg, color: cfg.color, border: `2px solid ${cfg.border}` }}>{cfg.label}</span>
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6b7280" }}>[{q.marks} mark{q.marks !== 1 ? "s" : ""}]</span>
          {isSyn && (q as SynopticQuestion).specTags.map(t => <SpecBadge key={t} tag={t} />)}
          {!isSyn && <SpecBadge tag={(q as ExamQuestion).specTag} />}
        </div>
        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#9ca3af" }}>{index + 1} of {list.length}</span>
      </div>

      {isSyn && (
        <div style={{ background: "#eef2ff", border: "1.5px solid #c7d2fe", borderRadius: 10, padding: "8px 14px" }}>
          <p style={{ fontSize: "0.78rem", color: "#4338ca", fontWeight: 600, margin: 0 }}>Synoptic — this question combines understanding from more than one sub-topic, as real J277 questions do.</p>
        </div>
      )}

      {/* Question card */}
      <div style={{ background: "#fff", borderRadius: 16, border: `2px solid ${cfg.border}`, padding: "22px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
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
        <div style={{ background: "#fff", borderRadius: 16, border: `2px solid ${cfg.border}`, overflow: "hidden" }}>
          <div style={{ background: cfg.bg, padding: "12px 18px", borderBottom: `2px solid ${cfg.border}` }}>
            <p style={{ fontWeight: 700, fontSize: "0.85rem", color: cfg.color, margin: 0 }}>Mark scheme — {q.marks} mark{q.marks !== 1 ? "s" : ""}</p>
          </div>
          <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
            {isSyn
              ? (q as SynopticQuestion).markScheme.map(group => (
                  <div key={group.tag}>
                    <div style={{ marginBottom: 8 }}><SpecBadge tag={group.tag} /></div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 2 }}>
                      {group.points.map((pt, i) => (
                        <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                          <span style={{ flexShrink: 0, width: 8, height: 8, borderRadius: "50%", background: cfg.border, marginTop: 7 }} />
                          <p style={{ fontSize: "0.9rem", color: "#374151", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{pt}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              : (q as ExamQuestion).markScheme.map((pt, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: "50%", background: cfg.bg, border: `2px solid ${cfg.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, color: cfg.color, marginTop: 1 }}>{i + 1}</span>
                    <p style={{ fontSize: "0.9rem", color: "#374151", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{pt}</p>
                  </div>
                ))}

            {/* context-specific model notes (non-synoptic) */}
            {!isSyn && ctx && (q as ExamQuestion).modelNotes?.[ctx] && (
              <div style={{ marginTop: 4, padding: "12px 14px", background: "#f8fafc", borderRadius: 10, borderLeft: `4px solid ${cfg.border}` }}>
                <p style={{ fontSize: "0.74rem", fontWeight: 700, color: "#6b7280", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Model notes for this version</p>
                {(q as ExamQuestion).modelNotes![ctx].map((n, i) => (
                  <p key={i} style={{ fontSize: "0.85rem", color: "#374151", lineHeight: 1.6, margin: i ? "6px 0 0" : 0 }}>{n}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <button onClick={() => nav(-1)} disabled={index === 0} style={{ minHeight: 44, display: "flex", alignItems: "center", gap: 6, padding: "0 16px", borderRadius: 12, fontWeight: 700, fontSize: "0.88rem", border: "2px solid", cursor: index === 0 ? "not-allowed" : "pointer", background: index === 0 ? "#f3f4f6" : "#fff", color: index === 0 ? "#d1d5db" : "#374151", borderColor: index === 0 ? "#e5e7eb" : "#d1d5db" }}><ChevronLeft size={18} /> Prev</button>
        {!isSyn && (q as ExamQuestion).contexts && (
          <button onClick={() => setup(index)} title="New version" style={{ minHeight: 44, display: "flex", alignItems: "center", gap: 6, padding: "0 14px", borderRadius: 12, fontWeight: 700, fontSize: "0.82rem", border: `2px solid ${cfg.border}`, background: cfg.bg, color: cfg.color, cursor: "pointer" }}><RefreshCw size={15} /> New</button>
        )}
        <button onClick={() => nav(1)} disabled={index === list.length - 1} style={{ minHeight: 44, display: "flex", alignItems: "center", gap: 6, padding: "0 16px", borderRadius: 12, fontWeight: 700, fontSize: "0.88rem", border: "2px solid", cursor: index === list.length - 1 ? "not-allowed" : "pointer", background: index === list.length - 1 ? "#f3f4f6" : "#1e3a8a", color: index === list.length - 1 ? "#d1d5db" : "#fff", borderColor: index === list.length - 1 ? "#e5e7eb" : "#1e3a8a" }}>Next <ChevronRight size={18} /></button>
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
    { label: "Study", detail: "First-pass reading — recognition, low effort. Start here." },
    { label: "Flashcards", detail: "Active recall — answer before you flip. The core revision mode." },
    { label: "Quiz", detail: "MCQ warm-up — recognising is easier than recalling. Not a readiness signal." },
    { label: "Exam", detail: "Real J277 formats and tariffs, plus synoptic questions spanning sub-topics." },
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
  { key: "study",     label: "Study",  icon: BookOpen,    blurb: "Read first — recognition, low effort. Start here." },
  { key: "flashcard", label: "Cards",  icon: Layers,      blurb: "Active recall — answer before you flip." },
  { key: "quiz",      label: "Quiz",   icon: CheckSquare, blurb: "MCQ warm-up — a high score here isn't exam-readiness." },
  { key: "fillin",    label: "Fill In", icon: PenLine,    blurb: "Tap a term, then tap a slot to place it." },
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

const SegRow = ({ options, value, onChange }: { options: { key: string; label: string }[]; value: string; onChange: (v: string) => void }) => (
  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
    {options.map(o => {
      const active = value === o.key;
      return (
        <button key={o.key} onClick={() => onChange(o.key)}
          style={{ minHeight: 40, padding: "0 14px", borderRadius: 10, fontWeight: 700, fontSize: "0.82rem", border: "2px solid", cursor: "pointer",
            background: active ? "#1e3a8a" : "#fff", color: active ? "#fff" : "#4b5563", borderColor: active ? "#1e3a8a" : "#e5e7eb" }}>
          {o.label}
        </button>
      );
    })}
  </div>
);

const BottomNav = ({ activity, setActivity }: { activity: string; setActivity: (a: string) => void }) => (
  <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 90, background: "#fff", borderTop: "1px solid #e5e7eb", boxShadow: "0 -4px 20px rgba(0,0,0,0.06)", display: "flex", paddingBottom: "env(safe-area-inset-bottom)" }}>
    {ACTIVITIES.map(a => {
      const active = activity === a.key; const Icon = a.icon;
      return (
        <button key={a.key} onClick={() => setActivity(a.key)}
          style={{ flex: 1, minHeight: 56, border: "none", background: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, color: active ? "#1e3a8a" : "#9ca3af", padding: "6px 2px" }}>
          <Icon size={20} strokeWidth={active ? 2.4 : 2} />
          <span style={{ fontSize: "0.66rem", fontWeight: 700 }}>{a.label}</span>
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
          style={{ minHeight: 44, display: "flex", alignItems: "center", gap: 8, padding: "0 20px", borderRadius: 12, fontWeight: 700, fontSize: "0.92rem", border: "2px solid", cursor: "pointer",
            background: active ? "#1e3a8a" : "#fff", color: active ? "#fff" : "#4b5563", borderColor: active ? "#1e3a8a" : "#e5e7eb", boxShadow: active ? "0 2px 8px rgba(30,58,138,0.2)" : "none" }}>
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
  const [activity, setActivity] = useState("study");
  const [examSection, setExamSection] = useState("all");
  const [showHints, setShowHints] = useState(true);
  const [showBeyond, setShowBeyond] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [tip, setTip] = useState<TooltipState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  _setActiveTooltip = setTip;

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    if (menuOpen) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuOpen]);

  const cards = coreCards(showBeyond);
  const cloze = coreCloze(showBeyond);
  const exam = coreExam(showBeyond);
  const activeBlurb = ACTIVITIES.find(a => a.key === activity)?.blurb ?? "";
  const contentKey = `${activity}-${examSection}-${showBeyond}`;

  return (
    <>
      {tip && <TooltipOverlay tip={tip} onClose={() => setTip(null)} />}

      {/* Header */}
      <div className="bg-blue-900 shadow-lg" style={{ position: "sticky", top: 0, zIndex: 95 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "10px 14px" : "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => { window.location.href = "/"; }} className="flex items-center gap-2 text-white hover:bg-blue-800 rounded-lg transition-colors" style={{ minHeight: 44, padding: "0 12px" }}>
            <Home size={22} /><span className="font-semibold" style={{ fontSize: isMobile ? "0.95rem" : "1.1rem" }}>{isMobile ? "1.1.1 CPU" : "1.1.1 CPU Architecture"}</span>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button onClick={() => setInfoOpen(true)} className="text-white hover:bg-blue-800 rounded-lg transition-colors" style={{ minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}><Info size={22} /></button>
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
      </div>

      {infoOpen && <InfoModal onClose={() => setInfoOpen(false)} />}

      {/* Page */}
      <div style={{ minHeight: "100vh", backgroundColor: "#f5f3f0", padding: isMobile ? "14px 12px 84px" : "24px 20px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

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
          {activity === "study"     && <StudyMode     key={contentKey} cards={cards} />}
          {activity === "flashcard" && <FlashcardMode key={contentKey} cards={cards} />}
          {activity === "quiz"      && <QuizMode      key={contentKey} cards={cards} />}
          {activity === "fillin"    && <FillInMode    key={contentKey} exercises={cloze} />}
          {activity === "exam"      && <ExamMode      key={contentKey} questions={exam} synoptic={SYNOPTIC_QUESTIONS} section={examSection} showHints={showHints} />}

        </div>
      </div>

      {isMobile && <BottomNav activity={activity} setActivity={setActivity} />}
    </>
  );
}
