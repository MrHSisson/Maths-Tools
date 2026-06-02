import { useState, useEffect, useCallback, useRef, CSSProperties } from "react";
import { Home, Menu, X, ChevronLeft, ChevronRight, Shuffle, RotateCcw, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type QuestionType = "explain" | "compare" | "apply" | "evaluate";

interface FlashCard {
  id: number;
  q: string;
  a: string;
  terms?: string[];
  distractors?: string[];
}

interface Bank {
  label: string;
  cards: FlashCard[];
}

interface ClozeExercise {
  id: number;
  title: string;
  text: string;
  words: string[];
}

interface ExamQuestion {
  id: string;
  type: QuestionType;
  marks: number;
  template: string;
  contexts: string[];
  hint: string;
  markScheme: string[];
  contextNotes: Record<string, string[]>;
}

interface GlossarySegment {
  type: "text" | "term";
  value: string;
  def?: string;
}

interface TooltipState {
  term: string;
  def: string;
  rect: DOMRect;
}

interface QuizState {
  deck: FlashCard[];
  index: number;
  score: number;
  selected: string | null;
  complete: boolean;
  choices: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLOSSARY — terms defined once, auto-matched against card answers
// Max 3 chips shown per card. Cards can override with terms: ["CPU", "ALU"]
// ═══════════════════════════════════════════════════════════════════════════════

const GLOSSARY: Record<string, string> = {
  "CPU":            "Central Processing Unit — the brain of the computer that fetches, decodes and executes instructions.",
  "ALU":            "Arithmetic Logic Unit — performs all arithmetic calculations and logical comparisons.",
  "CU":             "Control Unit — coordinates the activities of the CPU and controls data flow.",
  "Control Unit":   "Coordinates the activities of the CPU and controls the flow of data between components.",
  "register":       "An extremely fast, small storage location inside the CPU for data currently being processed.",
  "PC":             "Program Counter — holds the address of the next instruction to be fetched.",
  "ACC":            "Accumulator — holds the result of the most recent ALU calculation.",
  "MAR":            "Memory Address Register — holds the address of the memory location being accessed.",
  "MDR":            "Memory Data Register — holds data just fetched from, or about to be written to, memory.",
  "CIR":            "Current Instruction Register — holds the instruction currently being decoded and executed.",
  "cache":          "A small, very fast memory store near the CPU that reduces the time spent fetching from RAM.",
  "RAM":            "Random Access Memory — volatile main memory that holds data and programs currently in use.",
  "ROM":            "Read-Only Memory — non-volatile memory whose contents persist without power.",
  "von Neumann":    "Architecture where a single memory stores both instructions and data, connected by a single bus.",
  "bus":            "A set of parallel wires that carry data, addresses or control signals between components.",
  "data bus":       "Carries actual data between the CPU and memory/devices. Bidirectional.",
  "address bus":    "Carries memory addresses from the CPU to memory. Unidirectional.",
  "control bus":    "Carries control signals (read, write, clock) to coordinate operations. Bidirectional.",
  "clock speed":    "The number of fetch-decode-execute cycles per second, measured in Hz (typically GHz).",
  "core":           "An independent processing unit within a CPU that can execute instructions on its own.",
  "L1":             "Fastest, smallest cache — located inside each CPU core.",
  "L2":             "Second-level cache — larger than L1, slightly slower, usually per core.",
  "L3":             "Third-level cache — largest and slowest cache, shared between all cores.",
  "parallel":       "Processing multiple tasks simultaneously, typically by using multiple CPU cores.",
  "embedded system":"A computer built into a larger device to perform one specific, dedicated function.",
  "RTOS":           "Real-Time Operating System — guarantees a response within a fixed time. Used in safety-critical systems.",
  "non-volatile":   "Memory that retains its contents when power is removed (e.g. ROM, flash storage).",
  "volatile":       "Memory that loses its contents when power is removed (e.g. RAM).",
  "fetch":          "The first stage of the FDE cycle — the CPU retrieves the next instruction from RAM.",
  "decode":         "The second stage of the FDE cycle — the Control Unit interprets the fetched instruction.",
  "execute":        "The third stage of the FDE cycle — the instruction is carried out by the ALU or CU.",
};

// ── Parse answer text into segments, wrapping glossary terms ──────────────────
// Terms sorted longest-first so "Control Unit" matches before "Unit", etc.
// Returns: Array<{ type: "text"|"term", value: string, def?: string }>
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

// ═══════════════════════════════════════════════════════════════════════════════
// CLOZE PARAGRAPHS — drag-and-drop fill-in exercises, multiple per sub-topic
// Each paragraph: { id, title, text: string with [WORD] slots, words: string[] }
// words[] must include the correct answers AND optional distractors
// ═══════════════════════════════════════════════════════════════════════════════

const CLOZE: Record<string, ClozeExercise[]> = {
  "1.1.1": [
    {
      id: 1,
      title: "The Fetch-Decode-Execute Cycle",
      text: "The [CPU] continuously repeats the fetch-decode-execute cycle. First, the address of the next instruction is held in the [Program Counter]. This address is copied to the [MAR], and the instruction is fetched into the [MDR]. The instruction then moves to the [CIR] where the [Control Unit] decodes it. Finally, the [ALU] or Control Unit executes the instruction. After fetching, the Program Counter is [incremented] so it points to the next instruction.",
      words: ["CPU", "Program Counter", "MAR", "MDR", "CIR", "Control Unit", "ALU", "incremented", "decremented", "Accumulator", "cache", "RAM"],
    },
    {
      id: 2,
      title: "The System Bus",
      text: "The CPU communicates with memory via three buses. The [address bus] carries memory locations from the CPU to memory and is [unidirectional]. The [data bus] carries the actual data between components and is [bidirectional]. The [control bus] carries signals such as read and write commands to coordinate operations. Together these form the [system bus]. Increasing the width of the data bus means [more] data can be transferred per cycle.",
      words: ["address bus", "unidirectional", "data bus", "bidirectional", "control bus", "system bus", "more", "less", "input bus", "output bus", "omnidirectional", "fewer"],
    },
    {
      id: 3,
      title: "CPU Components",
      text: "The CPU contains several key components. The [ALU] performs all arithmetic and logical operations. The [Control Unit] coordinates all activities and directs the flow of data. Results of calculations are temporarily stored in the [Accumulator]. Frequently used data is kept in [cache] memory to avoid slower [RAM] accesses. The entire design, where instructions and data share a single memory, is called [von Neumann] architecture.",
      words: ["ALU", "Control Unit", "Accumulator", "cache", "RAM", "von Neumann", "Harvard", "ROM", "Program Counter", "register", "MDR"],
    },
  ],
  "1.1.2": [
    {
      id: 1,
      title: "Factors Affecting CPU Performance",
      text: "Three main factors affect CPU performance. [Clock speed], measured in [GHz], determines how many fetch-decode-execute cycles occur per second — a higher value means more instructions processed. Having more [cores] allows [parallel] processing of tasks, though this only helps if the software is [multi-threaded]. Finally, larger [cache] memory reduces the number of times the CPU must access the slower [RAM], improving overall speed.",
      words: ["Clock speed", "GHz", "cores", "parallel", "multi-threaded", "cache", "RAM", "MHz", "sequential", "single-threaded", "ROM", "registers"],
    },
    {
      id: 2,
      title: "Cache Memory",
      text: "Cache memory is a small, [fast] memory store located close to the CPU. It has three levels. [L1] cache is the smallest and fastest and is located inside each core. [L2] cache is larger but slightly slower. [L3] cache is the [largest] and is [shared] between all cores. When the CPU finds data in cache this is called a cache [hit]. When it does not, it must fetch from RAM — a cache [miss].",
      words: ["fast", "L1", "L2", "L3", "largest", "shared", "hit", "miss", "slow", "L4", "dedicated", "smallest"],
    },
  ],
  "1.1.3": [
    {
      id: 1,
      title: "Embedded Systems",
      text: "An embedded system is a computer built into a larger device to perform a [dedicated] function. Unlike a [general-purpose] computer, it cannot be reprogrammed to run different software. The program is stored in [ROM] so it is [non-volatile] and persists without power. Embedded systems are typically [low cost] and consume [less] power than general-purpose computers. Examples include [pacemakers], washing machines and traffic lights.",
      words: ["dedicated", "general-purpose", "ROM", "non-volatile", "low cost", "less", "pacemakers", "RAM", "volatile", "high cost", "more", "laptops"],
    },
    {
      id: 2,
      title: "Real-Time Operating Systems",
      text: "Some embedded systems use a [Real-Time Operating System] (RTOS). An RTOS guarantees that the system will respond to inputs within a [fixed] time period. This is critical in [safety]-critical applications where a delayed response could be [dangerous]. For example, in a [pacemaker] a delayed response could be life-threatening. An RTOS differs from a standard OS because response [time] is guaranteed rather than just fast on average.",
      words: ["Real-Time Operating System", "fixed", "safety", "dangerous", "pacemaker", "time", "variable", "convenience", "harmless", "dishwasher", "speed"],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXAM QUESTIONS — parameterised longer-form questions
//
// Each question has:
//   type: "explain" | "compare" | "apply" | "evaluate"
//   marks: number
//   template: string with {context} placeholder (or no placeholder if fixed)
//   contexts: string[] — one is picked randomly each time the card is drawn
//   markScheme: string[] — one bullet per mark point
//   contextNotes: Record<string, string[]> — optional extra marks for specific contexts
//   hint: string — shown before reveal, helps students structure their answer
//
// Rendering:
//   - A random context is drawn when the question is first shown
//   - Student sees the question and a structure hint
//   - On reveal: mark scheme bullets appear, each worth 1 mark
//   - contextNotes for the drawn context are appended if present
// ═══════════════════════════════════════════════════════════════════════════════

const EXAM_QUESTIONS: Record<string, ExamQuestion[]> = {
  "1.1.1": [
    {
      id: "e1",
      type: "explain",
      marks: 3,
      template: "Explain the role of the {context} in the fetch-decode-execute cycle.",
      contexts: ["Program Counter", "Memory Address Register (MAR)", "Memory Data Register (MDR)", "Current Instruction Register (CIR)", "Accumulator"],
      hint: "Think: what does it hold, and when is it used in the cycle?",
      markScheme: [
        "States what the register holds (1)",
        "Explains when/how it is used during the FDE cycle (1)",
        "Links it clearly to the correct stage (fetch, decode, or execute) (1)",
      ],
      contextNotes: {
        "Program Counter":                   ["e.g. holds address of next instruction (1); copied to MAR at start of fetch (1); incremented after fetch so cycle continues (1)"],
        "Memory Address Register (MAR)":     ["e.g. holds the address of memory to be read/written (1); receives address from PC during fetch (1); used to locate correct memory location (1)"],
        "Memory Data Register (MDR)":        ["e.g. holds data just fetched from / about to be written to memory (1); acts as a buffer between CPU and RAM (1); passes instruction to CIR after fetch (1)"],
        "Current Instruction Register (CIR)":["e.g. holds the current instruction being processed (1); receives instruction from MDR (1); held here during decode and execute stages (1)"],
        "Accumulator":                       ["e.g. holds result of most recent ALU calculation (1); used during execute stage (1); result may be stored back to memory or used in next instruction (1)"],
      },
    },
    {
      id: "e2",
      type: "explain",
      marks: 3,
      template: "Explain the purpose of the {context} in a computer system.",
      contexts: ["address bus", "data bus", "control bus"],
      hint: "Think: what does it carry, which direction, and why?",
      markScheme: [
        "States what the bus carries (1)",
        "States the direction (unidirectional / bidirectional) with a correct reason (1)",
        "Explains why this matters / how it fits into the wider system (1)",
      ],
      contextNotes: {
        "address bus": ["e.g. carries memory addresses (1); unidirectional — CPU sends to memory only (1); width determines how much memory can be addressed (1)"],
        "data bus":    ["e.g. carries actual data being transferred (1); bidirectional — data moves both to and from CPU (1); width determines how much data transferred per cycle (1)"],
        "control bus": ["e.g. carries control signals e.g. read, write, clock (1); bidirectional — coordinates all components (1); ensures components act at the right time (1)"],
      },
    },
    {
      id: "e3",
      type: "compare",
      marks: 4,
      template: "Compare {context} in terms of their role within the CPU.",
      contexts: ["the ALU and the Control Unit", "registers and cache memory", "the Program Counter and the Accumulator"],
      hint: "Give at least one similarity and one difference, with reasons.",
      markScheme: [
        "Correct description of first component's role (1)",
        "Correct description of second component's role (1)",
        "Valid similarity between them (1)",
        "Valid difference between them with a reason (1)",
      ],
      contextNotes: {
        "the ALU and the Control Unit":            ["ALU performs arithmetic/logic operations (1); CU coordinates and directs data flow (1); both are inside the CPU (1); ALU processes data, CU does not perform calculations (1)"],
        "registers and cache memory":              ["registers store data being immediately processed (1); cache stores frequently used data nearby (1); both are faster than RAM (1); registers are inside the CPU core, cache may be slightly further away (1)"],
        "the Program Counter and the Accumulator": ["PC holds address of next instruction (1); ACC holds result of last calculation (1); both are registers inside the CPU (1); PC is used in the fetch stage, ACC in the execute stage (1)"],
      },
    },
    {
      id: "e4",
      type: "apply",
      marks: 4,
      template: "A programmer is writing an application that performs {context}. Explain how the fetch-decode-execute cycle would be involved in running this program.",
      contexts: [
        "thousands of calculations per second",
        "a loop that checks sensor readings every millisecond",
        "sorting a large list of numbers",
        "displaying graphics on screen 60 times per second",
      ],
      hint: "Walk through the FDE stages. What specifically happens for this type of program?",
      markScheme: [
        "Correct description of the fetch stage in context (1)",
        "Correct description of the decode stage in context (1)",
        "Correct description of the execute stage in context (1)",
        "Explains how the cycle repeating continuously enables the application to run (1)",
      ],
      contextNotes: {},
    },
    {
      id: "e5",
      type: "evaluate",
      marks: 6,
      template: "Evaluate the claim that '{context}' when designing a CPU.",
      contexts: [
        "increasing clock speed is always the best way to improve performance",
        "having more cores is always better than a faster clock speed",
        "cache memory is more important than the number of cores",
        "a wider data bus always leads to better CPU performance",
      ],
      hint: "Structure: argue for the claim, argue against it, then give a conclusion that depends on context.",
      markScheme: [
        "Correct point supporting the claim with explanation (1)",
        "Second point supporting the claim (1)",
        "Valid limitation or counter-argument to the claim (1)",
        "Second limitation or counter-argument (1)",
        "Recognition that the answer depends on context or use case (1)",
        "Reasoned conclusion that goes beyond just restating the claim (1)",
      ],
      contextNotes: {
        "increasing clock speed is always the best way to improve performance": [
          "For: higher clock speed means more FDE cycles per second; more instructions processed (1)(1)",
          "Against: generates more heat / overheating risk; single-threaded bottleneck still limits some tasks (1)(1)",
          "Context: best for single-threaded tasks; cores or cache may help more for other workloads (1)(1)",
        ],
        "having more cores is always better than a faster clock speed": [
          "For: parallel processing allows multiple tasks simultaneously; better for multi-threaded software (1)(1)",
          "Against: only helps if software is written to use multiple cores; single-threaded tasks see no benefit (1)(1)",
          "Context: cores better for video editing/gaming; clock speed matters more for single sequential tasks (1)(1)",
        ],
        "cache memory is more important than the number of cores": [
          "For: cache reduces slow RAM accesses for all tasks; even single-core programs benefit (1)(1)",
          "Against: more cores enable parallelism that cache cannot provide; for multi-threaded workloads cores dominate (1)(1)",
          "Context: depends on the task; cache benefits all workloads, cores only help parallelisable ones (1)(1)",
        ],
        "a wider data bus always leads to better CPU performance": [
          "For: more data transferred per cycle; reduces bottleneck between CPU and memory (1)(1)",
          "Against: only beneficial if the rest of the system can keep up; diminishing returns beyond a point (1)(1)",
          "Context: matters most when memory-bound; less impact for CPU-bound tasks (1)(1)",
        ],
      },
    },
  ],

  "1.1.2": [
    {
      id: "e1",
      type: "explain",
      marks: 3,
      template: "Explain how {context} affects the performance of a CPU.",
      contexts: ["clock speed", "the number of cores", "the size of the cache"],
      hint: "State the factor, explain the mechanism, then give a limitation or trade-off.",
      markScheme: [
        "Correct statement of how the factor affects performance (1)",
        "Explanation of the mechanism (why/how it works) (1)",
        "Limitation or trade-off acknowledged (1)",
      ],
      contextNotes: {
        "clock speed":          ["Higher clock speed → more FDE cycles per second (1); more instructions processed in the same time (1); but generates more heat and uses more power (1)"],
        "the number of cores":  ["More cores → multiple tasks processed simultaneously (1); parallel processing improves multi-threaded performance (1); but only helps if software is written to use multiple cores (1)"],
        "the size of the cache":["Larger cache → more frequently used data stored near CPU (1); fewer slow RAM accesses needed (1); but larger cache is expensive and takes up chip space (1)"],
      },
    },
    {
      id: "e2",
      type: "compare",
      marks: 4,
      template: "Compare {context}, explaining how each affects CPU performance differently.",
      contexts: ["L1 and L3 cache", "clock speed and number of cores", "a cache hit and a cache miss"],
      hint: "Describe each, then explain a key difference in how they affect performance.",
      markScheme: [
        "Correct description of the first item (1)",
        "Correct description of the second item (1)",
        "Explains a performance difference between them (1)",
        "Gives a reason for that difference (1)",
      ],
      contextNotes: {
        "L1 and L3 cache":              ["L1 is smallest and fastest, inside each core (1); L3 is largest and slowest, shared between cores (1); L1 hit is faster so reduces latency more (1); because L1 is physically closer to the core (1)"],
        "clock speed and number of cores":["Clock speed increases FDE cycles per second (1); more cores allow parallel execution of tasks (1); clock speed helps all tasks, cores only help multi-threaded ones (1); because sequential tasks cannot be split across cores (1)"],
        "a cache hit and a cache miss":  ["Cache hit: data found in cache, fast access (1); cache miss: data not in cache, must fetch from slower RAM (1); cache miss significantly slower (1); because RAM has higher latency than cache (1)"],
      },
    },
    {
      id: "e3",
      type: "apply",
      marks: 4,
      template: "A {context} is being built. Explain which CPU performance factor should be prioritised and why.",
      contexts: [
        "high-end gaming PC",
        "video editing workstation",
        "web server handling thousands of simultaneous requests",
        "laptop for basic office tasks",
        "computer for running scientific simulations",
      ],
      hint: "Identify the most important factor, explain why it suits this use case, and mention why another factor is less important here.",
      markScheme: [
        "Identifies the most appropriate performance factor for this use case (1)",
        "Explains why this factor matters for the specific scenario (1)",
        "Identifies a secondary factor and explains its role (1)",
        "Explains why one factor is less critical for this use case than another (1)",
      ],
      contextNotes: {},
    },
  ],

  "1.1.3": [
    {
      id: "e1",
      type: "explain",
      marks: 3,
      template: "Explain why {context} is suitable to be controlled by an embedded system.",
      contexts: [
        "a pacemaker",
        "a washing machine",
        "a set of traffic lights",
        "an aircraft autopilot",
        "a microwave oven",
        "a car's anti-lock braking system",
      ],
      hint: "Think: dedicated function, reliability, ROM storage, power/cost advantages.",
      markScheme: [
        "Identifies that the device performs a single, dedicated function (1)",
        "Explains a relevant advantage of an embedded system for this device (e.g. low power, reliable, cheap) (1)",
        "Links the advantage specifically to the device's use case with a reason (1)",
      ],
      contextNotes: {
        "a pacemaker":                     ["Single function: regulate heartbeat (1); must be highly reliable / use RTOS as failure is life-threatening (1); low power extends battery life inside the body (1)"],
        "a washing machine":               ["Single function: control wash cycle (1); low cost keeps the product affordable (1); ROM storage means program cannot be accidentally overwritten (1)"],
        "a set of traffic lights":         ["Single function: manage signal sequencing (1); must respond in real time to sensors / RTOS (1); low power suitable for outdoor 24/7 operation (1)"],
        "an aircraft autopilot":           ["Single function: maintain flight path (1); RTOS guarantees response within fixed time — critical for safety (1); highly reliable — failure could be catastrophic (1)"],
        "a microwave oven":                ["Single function: control heating cycle (1); cheap embedded system keeps product price low (1); ROM means program persists without power (1)"],
        "a car's anti-lock braking system":["Single function: prevent wheel lock-up (1); RTOS essential — must respond within milliseconds (1); reliability critical as failure affects driver safety (1)"],
      },
    },
    {
      id: "e2",
      type: "compare",
      marks: 4,
      template: "Compare an embedded system with a general-purpose computer in the context of {context}.",
      contexts: [
        "controlling a hospital patient monitoring system",
        "running a business's accounting software",
        "managing a smart home heating system",
        "processing video for a streaming service",
      ],
      hint: "Describe what each type of system does, then compare their suitability for this context.",
      markScheme: [
        "Correct description of embedded system characteristics relevant to context (1)",
        "Correct description of general-purpose computer characteristics relevant to context (1)",
        "Valid advantage of embedded system in this context (1)",
        "Valid advantage of general-purpose computer in this context (1)",
      ],
      contextNotes: {},
    },
    {
      id: "e3",
      type: "evaluate",
      marks: 6,
      template: "Evaluate the use of a real-time operating system (RTOS) in {context}.",
      contexts: [
        "a pacemaker",
        "an aircraft autopilot system",
        "a car's anti-lock braking system",
        "a nuclear power plant control system",
      ],
      hint: "Structure: advantages of RTOS here, limitations or costs, conclusion about whether RTOS is justified.",
      markScheme: [
        "Explains what an RTOS does — guaranteed response within a fixed time (1)",
        "Explains why guaranteed response time is critical in this context (1)",
        "Gives a second advantage of RTOS for this application (1)",
        "Identifies a limitation or cost of using an RTOS (1)",
        "Acknowledges that the trade-off may still be justified given safety requirements (1)",
        "Reasoned conclusion — not just restating points (1)",
      ],
      contextNotes: {
        "a pacemaker":                          ["RTOS guarantees response time (1); missed heartbeat regulation could be fatal (1); high reliability (1); expensive to develop and certify (1); safety justifies cost (1); RTOS is clearly appropriate given life-critical nature (1)"],
        "an aircraft autopilot system":         ["RTOS guarantees response time (1); delayed response could cause loss of aircraft (1); can manage multiple sensor inputs reliably (1); complex certification process (1); safety risk justifies development cost (1); RTOS essential for any safety-critical aviation system (1)"],
        "a car's anti-lock braking system":     ["RTOS guarantees brake response within milliseconds (1); delayed response at speed could cause accident (1); consistent behaviour in all conditions (1); adds to vehicle development cost (1); legal and safety standards require it (1); RTOS clearly justified given safety implications (1)"],
        "a nuclear power plant control system": ["RTOS guarantees sensor response time (1); delayed response to temperature/pressure anomaly could be catastrophic (1); multiple simultaneous inputs managed reliably (1); extremely high development and testing cost (1); regulatory requirement — no alternative (1); RTOS is mandatory and clearly appropriate (1)"],
      },
    },
    {
      id: "e4",
      type: "apply",
      marks: 4,
      template: "A company is designing {context}. Discuss whether an embedded system or a general-purpose computer would be more appropriate.",
      contexts: [
        "a new smart thermostat for home heating",
        "a handheld barcode scanner for a warehouse",
        "a machine that automatically inspects products on a factory line",
        "a device worn by athletes to monitor heart rate and GPS position",
      ],
      hint: "Consider the device's function, environment, cost, power, and reliability requirements.",
      markScheme: [
        "Identifies that the device has a specific, limited function suitable for an embedded system (1)",
        "Explains an advantage of embedded system for this specific device (1)",
        "Identifies a scenario where a general-purpose computer might be considered instead (1)",
        "Gives a justified conclusion about which is more appropriate (1)",
      ],
      contextNotes: {},
    },
  ],
};

const getExamQuestions = (key: string): ExamQuestion[] =>
  key === "mixed" ? shuffleArr(Object.values(EXAM_QUESTIONS).flat()) : (EXAM_QUESTIONS[key] ?? []);

const resolveQuestion = (q: ExamQuestion): { text: string; ctx: string | null } => {
  const ctx = q.contexts.length ? q.contexts[Math.floor(Math.random() * q.contexts.length)] : null;
  return { text: ctx ? q.template.replace("{context}", ctx) : q.template, ctx };
};

// ═══════════════════════════════════════════════════════════════════════════════
// CARD DATA
// ═══════════════════════════════════════════════════════════════════════════════

const BANKS: Record<string, Bank> = {
  "1.1.1": {
    label: "1.1.1 — CPU Architecture",
    cards: [
      { id: 1,  q: "What does CPU stand for?", a: "Central Processing Unit", terms: ["CPU"],
        distractors: ["Central Processing Utility", "Core Processing Unit", "Central Program Undertaker"] },
      // id 2: answer already uses fetch/decode/execute as verbs in context — show CPU instead
      { id: 2,  q: "What is the purpose of the CPU?", a: "To fetch, decode and execute instructions", terms: ["CPU"],
        distractors: ["To store programs permanently", "To manage input and output devices only", "To decode and store data in RAM"] },
      // id 3: answer IS the definition of the ALU — no useful underline possible
      { id: 3,  q: "What is the role of the ALU?", a: "Performs arithmetic calculations and logical operations", terms: [],
        distractors: ["Controls and coordinates all CPU components", "Stores the result of the last instruction", "Fetches instructions from main memory"] },
      // id 4: answer IS the definition of the CU — underline CPU so students can check what it stands for
      { id: 4,  q: "What is the role of the Control Unit (CU)?", a: "Controls and coordinates CPU activities, directing the flow of data between the CPU and other devices", terms: ["CPU"],
        distractors: ["Performs all arithmetic and logical calculations", "Stores frequently used data close to the CPU", "Holds the address of the next instruction to execute"] },
      // id 5: answer IS the definition of a register — underline CPU as a useful cross-reference
      { id: 5,  q: "What is a register?", a: "A small, extremely fast storage location inside the CPU used to hold data currently being processed", terms: ["CPU"],
        distractors: ["A section of RAM reserved for the operating system", "A large cache store shared between CPU cores", "Permanent storage on the motherboard for BIOS settings"] },
      // id 6: answer references the PC implicitly — underline nothing (question asks what PC holds, answer defines it)
      { id: 6,  q: "What does the Program Counter (PC) hold?", a: "The memory address of the next instruction to be fetched and executed", terms: [],
        distractors: ["The result of the most recent ALU calculation", "The instruction currently being decoded", "A count of how many instructions have been executed"] },
      // id 7: answer IS the definition of the ACC — underline ALU as useful cross-reference
      { id: 7,  q: "What does the Accumulator (ACC) hold?", a: "The result of the most recent calculation performed by the ALU", terms: ["ALU"],
        distractors: ["The address of the next instruction to fetch", "The instruction currently being decoded by the CU", "The data most recently written to main memory"] },
      // id 8: answer IS the definition of the MAR — no useful underline
      { id: 8,  q: "What does the Memory Address Register (MAR) hold?", a: "The address of the memory location currently being read from or written to", terms: [],
        distractors: ["The data that has just been fetched from memory", "The result of the last arithmetic operation", "The instruction currently being executed"] },
      // id 9: answer IS the definition of the MDR — no useful underline
      { id: 9,  q: "What does the Memory Data Register (MDR) hold?", a: "The data that has just been fetched from, or is about to be written to, memory", terms: [],
        distractors: ["The address of the memory location being accessed", "The instruction currently being decoded", "The number of the next instruction to execute"] },
      // id 10: answer IS the definition of the CIR — no useful underline
      { id: 10, q: "What does the Current Instruction Register (CIR) hold?", a: "The instruction that is currently being decoded and executed", terms: [],
        distractors: ["The address of the next instruction to fetch", "The result of the last ALU operation", "The data most recently read from RAM"] },
      // id 11: answer explains all three stages inline — underlining fetch/decode/execute adds nothing
      { id: 11, q: "What are the three stages of the Fetch-Decode-Execute cycle?", a: "Fetch (get instruction from RAM via PC), Decode (CU interprets it), Execute (ALU or CU carries it out)", terms: ["RAM", "ALU"],
        distractors: ["Read, Process, Write", "Load, Compute, Store", "Input, Process, Output"] },
      // id 12: answer references PC implicitly — underline nothing (question is about the PC)
      { id: 12, q: "What happens to the Program Counter after an instruction is fetched?", a: "It is incremented by 1, pointing to the address of the next instruction", terms: [],
        distractors: ["It resets to zero ready for the next cycle", "It stores the result of the executed instruction", "It is copied into the CIR before incrementing"] },
      // id 13: answer IS a list of the three buses — underline each so students can check definitions
      { id: 13, q: "What are the three buses that make up the system bus?", a: "The data bus, the address bus, and the control bus", terms: ["data bus", "address bus", "control bus"],
        distractors: ["The input bus, the output bus, and the memory bus", "The instruction bus, the data bus, and the clock bus", "The fetch bus, the decode bus, and the execute bus"] },
      // id 14: answer IS the definition of address bus direction — underline CPU as cross-reference
      { id: 14, q: "Is the address bus unidirectional or bidirectional?", a: "Unidirectional — addresses only travel from the CPU to memory", terms: ["CPU"],
        distractors: ["Bidirectional — addresses travel both to and from the CPU", "Bidirectional — the CPU and memory both send addresses", "Unidirectional — addresses travel from memory to the CPU only"] },
      // id 15: answer IS the definition of data bus direction — underline CPU as cross-reference
      { id: 15, q: "Is the data bus unidirectional or bidirectional?", a: "Bidirectional — data can travel to and from the CPU", terms: ["CPU"],
        distractors: ["Unidirectional — data only travels from memory to the CPU", "Unidirectional — data only travels from the CPU to memory", "Unidirectional — data travels from the ALU to registers only"] },
      // id 16: answer IS the definition of cache — underline RAM as useful cross-reference
      { id: 16, q: "What is cache memory?", a: "A small, very fast memory store near the CPU that holds frequently used data to reduce fetch time from RAM", terms: ["RAM"],
        distractors: ["A large store of ROM that holds the operating system", "Virtual memory used when RAM is full", "A section of the hard drive used to speed up loading times"] },
      // id 17: answer IS the definition of von Neumann — underline bus as useful cross-reference
      { id: 17, q: "What is the von Neumann architecture?", a: "A design where a single shared memory stores both instructions and data, connected to the CPU by a single bus", terms: ["bus"],
        distractors: ["A design with separate memory for instructions and data", "A multi-core architecture where each core has its own memory", "An architecture where the CPU and memory are integrated on one chip"] },
    ],
  },
  "1.1.2": {
    label: "1.1.2 — CPU Performance",
    cards: [
      // id 1: answer IS the definition of clock speed — no useful underline
      { id: 1,  q: "What is clock speed?", a: "The number of fetch-decode-execute cycles the CPU performs per second, measured in Hz (typically GHz)", terms: ["CPU"],
        distractors: ["The speed at which data travels along the data bus", "The rate at which data is transferred between RAM and the CPU", "The number of cores available to process instructions simultaneously"] },
      // id 2: useful to underline clock speed as a cross-reference
      { id: 2,  q: "How does increasing clock speed affect performance?", a: "More instructions are processed per second, increasing performance — but more heat is generated", terms: ["clock speed"],
        distractors: ["More cores become available, allowing parallel processing", "The cache becomes larger, reducing RAM accesses", "Data travels faster along the bus, reducing latency"] },
      // id 3: answer IS the definition of a core — underline CPU as cross-reference
      { id: 3,  q: "What is a CPU core?", a: "An independent processing unit within a CPU that can fetch, decode, and execute instructions on its own", terms: ["CPU"],
        distractors: ["A level of cache memory shared between all processors", "The control unit at the centre of the CPU", "A register used to store intermediate results"] },
      // id 4: answer explains parallel inline — underline core as useful cross-reference
      { id: 4,  q: "How does having more cores affect performance?", a: "Allows multiple tasks to be processed simultaneously (parallel processing), improving multi-threaded performance", terms: ["core"],
        distractors: ["Increases the clock speed of each individual core", "Increases the size of L1 cache available per core", "Reduces the heat generated during processing"] },
      // id 5: answer IS the definition of L1/L2/L3 — underlining them here adds nothing
      { id: 5,  q: "What are the three levels of cache and how do they compare?", a: "L1 (smallest, fastest, per core), L2 (larger, slightly slower), L3 (largest, shared between cores)", terms: [],
        distractors: ["L1 (largest, slowest), L2 (medium), L3 (smallest, fastest, per core)", "L1 (shared between all cores), L2 (per core), L3 (on motherboard)", "L1 (on motherboard), L2 (per core), L3 (inside the ALU)"] },
      // id 6: answer explains cache hit inline — underline RAM and cache as cross-references
      { id: 6,  q: "What is a cache hit?", a: "When the CPU finds the data it needs in cache, avoiding a slower RAM access", terms: ["cache", "RAM"],
        distractors: ["When the CPU successfully writes data to RAM", "When the clock speed reaches its maximum rated value", "When two cores access the same data simultaneously"] },
      // id 7: answer explains cache miss inline — underline RAM and cache as cross-references
      { id: 7,  q: "What is a cache miss?", a: "When the data is not in cache, so the CPU must fetch it from the slower RAM", terms: ["cache", "RAM"],
        distractors: ["When the CPU fails to execute an instruction correctly", "When the cache becomes full and must be cleared", "When the address bus sends an incorrect memory address"] },
      // id 8: answer is a list — all three are worth underlining for cross-reference
      { id: 8,  q: "Name three factors that affect CPU performance.", a: "Clock speed, number of cores, and cache size", terms: ["clock speed", "core", "cache"],
        distractors: ["RAM size, hard drive speed, and screen resolution", "Bus width, ROM size, and number of registers", "Power supply, cooling system, and motherboard type"] },
      // id 9: answer references cores and parallelism — underline core
      { id: 9,  q: "Why doesn't doubling cores always double performance?", a: "Not all software is written to use multiple cores; some tasks are sequential and cannot be parallelised", terms: ["core"],
        distractors: ["The clock speed is halved when more cores are added", "Cache must be shared across more cores, reducing each core's allocation", "The control unit can only coordinate one core at a time"] },
      // id 10: answer IS the trade-off explanation — underline clock speed as cross-reference
      { id: 10, q: "What is the trade-off of increasing clock speed?", a: "Higher speeds generate more heat and consume more power, risking overheating without adequate cooling", terms: ["clock speed"],
        distractors: ["Higher clock speeds reduce the size of the cache", "Higher speeds mean fewer cores can be used simultaneously", "Higher clock speeds reduce the width of the data bus"] },
    ],
  },
  "1.1.3": {
    label: "1.1.3 — Embedded Systems",
    cards: [
      // id 1: answer IS the definition of embedded system — no useful underline
      { id: 1,  q: "What is an embedded system?", a: "A computer system built into a larger device to perform a specific, dedicated function", terms: [],
        distractors: ["A portable computer designed for use in industrial environments", "A computer that runs exclusively on battery power", "A system where the CPU and RAM are on the same chip"] },
      // id 2: useful to cross-reference embedded system
      { id: 2,  q: "How does an embedded system differ from a general-purpose computer?", a: "It performs one specific task; a general-purpose computer can run many different programs", terms: ["embedded system"],
        distractors: ["An embedded system uses RAM; a general-purpose computer uses ROM", "An embedded system has no processor; it uses dedicated logic circuits only", "An embedded system is always connected to the internet; a PC is not"] },
      // id 3: ROM and non-volatile are genuinely useful here — answer names them without explaining
      { id: 3,  q: "What type of memory stores the program in an embedded system, and why?", a: "ROM — it is non-volatile so the program persists without power and cannot be accidentally overwritten", terms: ["ROM", "non-volatile"],
        distractors: ["RAM — it allows the program to be updated remotely at any time", "Cache — it allows the program to run at maximum speed", "Virtual memory — it allows larger programs than the chip can hold"] },
      // id 4: answer IS a list of advantages — no single term to underline usefully
      { id: 4,  q: "Give two advantages of embedded systems.", a: "Low cost, low power consumption, compact size, and high reliability for their specific task", terms: [],
        distractors: ["They can run any software and are easily upgraded", "They have large storage capacity and high processing power", "They support multiple users and are easy to program"] },
      // id 5: answer IS the definition of RTOS — no useful underline
      { id: 5,  q: "What is a real-time operating system (RTOS)?", a: "An OS that processes input and produces output within a guaranteed time frame — critical for safety systems", terms: [],
        distractors: ["An OS that streams data live over the internet with no delay", "An OS that updates itself in real time from a remote server", "An OS that only runs one process at a time to ensure speed"] },
      // id 6: underline RTOS as useful cross-reference to what it means
      { id: 6,  q: "Give an example of an embedded system where reliability is critical.", a: "A pacemaker or aircraft autopilot — failure could be life-threatening", terms: [],
        distractors: ["A digital photo frame — failure would cause data loss", "A smart television — failure would disrupt entertainment services", "A games console — failure would prevent recreational use"] },
      // id 7: underline embedded system as cross-reference
      { id: 7,  q: "Why are embedded systems typically less expensive than general-purpose computers?", a: "They only need hardware for their specific function — no screen, keyboard, or large storage required", terms: ["embedded system"],
        distractors: ["They use cheaper, slower processors that require less cooling", "They do not require an operating system of any kind", "They are mass-produced in smaller quantities, reducing unit cost"] },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const shuffleArr = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const getAllCards = (): FlashCard[] => Object.values(BANKS).flatMap(b => b.cards);
const getCards   = (key: string): FlashCard[] => key === "mixed" ? getAllCards() : (BANKS[key]?.cards ?? []);
const getCloze   = (key: string): ClozeExercise[] => {
  if (key === "mixed") return shuffleArr(Object.values(CLOZE).flat());
  return CLOZE[key] ?? [];
};

const buildChoices = (card: FlashCard, pool: FlashCard[]): string[] => {
  if (card.distractors && card.distractors.length >= 3)
    return shuffleArr([card.a, ...card.distractors.slice(0, 3)]);
  const others = pool.map(c => c.a).filter(a => a !== card.a);
  return shuffleArr([card.a, ...shuffleArr(others).slice(0, 3)]);
};

const parseCloze = (text: string): { type: "text" | "slot"; value: string }[] => {
  const parts = text.split(/(\[[^\]]+\])/g);
  return parts.map(p => {
    if (p.startsWith("[") && p.endsWith("]")) return { type: "slot" as const, value: p.slice(1, -1) };
    return { type: "text" as const, value: p };
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOOLTIP PORTAL — renders at fixed position relative to viewport so it is
// never clipped by overflow:hidden ancestors (cards, browse items, etc.)
// ═══════════════════════════════════════════════════════════════════════════════

const TooltipPortal = ({ term, def, anchorRect, onHide }: { term: string; def: string; anchorRect: DOMRect; onHide: () => void }) => {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const tipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!anchorRect || !tipRef.current) return;
    const tw = tipRef.current.offsetWidth || 240;
    const th = tipRef.current.offsetHeight || 80;
    const cx = anchorRect.left + anchorRect.width / 2;
    let left = cx - tw / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
    setPos({ top: anchorRect.top + window.scrollY - th - 10, left });
  }, [anchorRect]);

  return (
    <div ref={tipRef} onMouseEnter={onHide} style={{ position: "absolute", top: pos.top, left: pos.left, zIndex: 9999, background: "#0f172a", color: "#f8fafc", borderRadius: 10, padding: "10px 14px", fontSize: "0.78rem", lineHeight: 1.6, fontWeight: 500, width: 240, boxShadow: "0 4px 20px rgba(0,0,0,0.4)", pointerEvents: "none" }}>
      <span style={{ display: "block", fontWeight: 700, fontSize: "0.8rem", marginBottom: 3, color: "#7dd3fc" }}>{term}</span>
      <span style={{ color: "rgba(248,250,252,0.85)" }}>{def}</span>
      <span style={{ position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)", width: 12, height: 6, background: "#0f172a", clipPath: "polygon(0 0, 100% 0, 50% 100%)", display: "block" }} />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// GLOSSARY TEXT — renders answer text with hoverable underlined glossary terms
// ═══════════════════════════════════════════════════════════════════════════════

let _setActiveTooltip: ((t: TooltipState | null) => void) | null = null;

const GlossaryText = ({ text, terms: overrideTerms, style, onCard = false }: { text: string; terms?: string[]; style?: CSSProperties; onCard?: boolean }) => {
  const segments = parseGlossaryText(text, overrideTerms);
  const show = (e: React.MouseEvent, term: string, def: string) => { e.stopPropagation(); _setActiveTooltip?.({ term, def, rect: e.currentTarget.getBoundingClientRect() }); };
  const hide = (e: React.MouseEvent) => { e.stopPropagation(); _setActiveTooltip?.(null); };
  return (
    <span style={style}>
      {segments.map((seg, i) => {
        if (seg.type === "text") return <span key={i}>{seg.value}</span>;
        return (
          <span key={i} onMouseEnter={e => show(e, seg.value, seg.def!)} onMouseLeave={hide} onClick={e => show(e, seg.value, seg.def!)}
            style={{ borderBottom: `2px solid ${onCard ? "rgba(255,255,255,0.65)" : "#1e3a8a"}`, cursor: "help", display: "inline" }}>
            {seg.value}
          </span>
        );
      })}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// FLIP CARD
// ═══════════════════════════════════════════════════════════════════════════════

const FlipCard = ({ front, card, isFlipped, onClick, fontSize, onFontInc, onFontDec }: {
  front: string; card: FlashCard; isFlipped: boolean; onClick: () => void;
  fontSize: number; onFontInc: () => void; onFontDec: () => void;
}) => {
  const back = card.a;
  const base = [1.0, 1.15, 1.3, 1.5, 1.7][fontSize] ?? 1.3;
  const fSize = front.length > 110 ? `${base * 0.76}rem` : front.length > 75 ? `${base * 0.88}rem` : `${base}rem`;
  const aSize = back.length  > 130 ? `${base * 0.7}rem`  : back.length  > 90  ? `${base * 0.82}rem` : back.length > 55 ? `${base * 0.92}rem` : `${base}rem`;

  const fsBtn = (enabled: boolean, handler: () => void, icon: React.ReactNode) => (
    <button
      onClick={e => { e.stopPropagation(); enabled && handler(); }}
      style={{
        width: 28, height: 28, borderRadius: 7, border: "none",
        background: "rgba(255,255,255,0.18)", cursor: enabled ? "pointer" : "not-allowed",
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: enabled ? 1 : 0.35, backdropFilter: "blur(4px)",
      }}
    >{icon}</button>
  );

  return (
    <div onClick={onClick} style={{ perspective: "1200px", width: "100%", maxWidth: 680, height: 300, cursor: "pointer", margin: "0 auto" }}>
      <div style={{
        position: "relative", width: "100%", height: "100%",
        transformStyle: "preserve-3d",
        transition: "transform 0.55s cubic-bezier(0.45,0.05,0.55,0.95)",
        transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
      }}>
        {/* Front — Question */}
        <div style={{
          position: "absolute", inset: 0,
          backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
          borderRadius: 20, background: "linear-gradient(140deg,#1e3a8a 0%,#1d4ed8 100%)",
          boxShadow: "0 8px 40px rgba(30,58,138,0.28)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "36px 48px", gap: 14,
        }}>
          {/* Font size controls — top right, always visible */}
          <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 4 }}>
            {fsBtn(fontSize > 0, onFontDec, <ChevronDown size={14} color="rgba(255,255,255,0.85)" />)}
            {fsBtn(fontSize < 4, onFontInc, <ChevronUp   size={14} color="rgba(255,255,255,0.85)" />)}
          </div>
          <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>
            Question — click to reveal
          </span>
          <p style={{ color: "#fff", fontSize: fSize, fontWeight: 600, textAlign: "center", lineHeight: 1.55, margin: 0 }}>{front}</p>
        </div>
        {/* Back — Answer */}
        <div style={{
          position: "absolute", inset: 0,
          backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          borderRadius: 20, background: "linear-gradient(140deg,#064e3b 0%,#059669 100%)",
          boxShadow: "0 8px 40px rgba(6,78,59,0.28)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "36px 48px", gap: 14, overflow: "visible",
        }}>
          {/* Font size controls — mirrored on back face (pre-rotated so they appear top-right) */}
          <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 4, transform: "rotateY(0deg)" }}>
            {fsBtn(fontSize > 0, onFontDec, <ChevronDown size={14} color="rgba(255,255,255,0.85)" />)}
            {fsBtn(fontSize < 4, onFontInc, <ChevronUp   size={14} color="rgba(255,255,255,0.85)" />)}
          </div>
          <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>
            Answer — hover underlined words for definitions
          </span>
          <GlossaryText
            text={back}
            terms={card.terms}
            onCard={true}
            style={{ color: "#fff", fontSize: aSize, fontWeight: 600, textAlign: "center", lineHeight: 1.7 }}
          />
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODE: FLASHCARD
// ═══════════════════════════════════════════════════════════════════════════════

const FlashcardMode = ({ cards }: { cards: FlashCard[] }) => {
  const [deck, setDeck]         = useState(cards);
  const [index, setIndex]       = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [fontSize, setFontSize] = useState(2);

  useEffect(() => { setDeck(cards); setIndex(0); setIsFlipped(false); setIsShuffled(false); }, [cards]);

  const goTo = useCallback((i: number) => { setIsFlipped(false); setTimeout(() => setIndex(i), 170); }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if      (e.key === "ArrowLeft"  && index > 0)              goTo(index - 1);
      else if (e.key === "ArrowRight" && index < deck.length - 1) goTo(index + 1);
      else if ((e.key === " " || e.key === "Enter") && e.target === document.body) { e.preventDefault(); setIsFlipped(f => !f); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [index, deck.length, goTo]);

  const current = deck[index];
  if (!current) return null;

  const iconBtn: React.CSSProperties = { width: 42, height: 42, borderRadius: 12, border: "2px solid #d1d5db", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" };
  const navBtn  = (active: boolean, primary: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: 6, padding: "10px 20px",
    borderRadius: 12, fontWeight: 700, fontSize: "0.9rem", border: "2px solid", cursor: active ? "pointer" : "not-allowed",
    background: !active ? "#f3f4f6" : primary ? "#1e3a8a" : "#fff",
    color: !active ? "#d1d5db" : primary ? "#fff" : "#374151",
    borderColor: !active ? "#e5e7eb" : primary ? "#1e3a8a" : "#d1d5db",
    transition: "all 0.15s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <FlipCard
        front={current.q} card={current} isFlipped={isFlipped}
        onClick={() => setIsFlipped(f => !f)} fontSize={fontSize}
        onFontInc={() => fontSize < 4 && setFontSize(f => f + 1)}
        onFontDec={() => fontSize > 0 && setFontSize(f => f - 1)}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#6b7280", letterSpacing: "0.07em", textTransform: "uppercase" }}>
          Card {index + 1} of {deck.length}
        </span>
        {isShuffled && <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#1d4ed8", background: "#eff6ff", padding: "2px 10px", borderRadius: 20 }}>Shuffled</span>}
      </div>

      <div style={{ width: "100%", maxWidth: 480, height: 5, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${((index + 1) / deck.length) * 100}%`, height: "100%", background: "#1e3a8a", borderRadius: 4, transition: "width 0.3s" }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button style={navBtn(index > 0, false)} onClick={() => index > 0 && goTo(index - 1)}><ChevronLeft size={18} /> Previous</button>
        <button style={iconBtn} title="Shuffle"       onClick={() => { setDeck(shuffleArr(deck)); setIndex(0); setIsFlipped(false); setIsShuffled(true); }}><Shuffle size={17} /></button>
        <button style={iconBtn} title="Reset order"   onClick={() => { setDeck(cards); setIndex(0); setIsFlipped(false); setIsShuffled(false); }}><RotateCcw size={17} /></button>
        <button style={navBtn(index < deck.length - 1, true)} onClick={() => index < deck.length - 1 && goTo(index + 1)}>Next <ChevronRight size={18} /></button>
      </div>

      <p style={{ fontSize: "0.72rem", color: "#9ca3af", fontWeight: 500 }}>← → arrow keys · Space or Enter to flip</p>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODE: BROWSE
// ═══════════════════════════════════════════════════════════════════════════════

const BrowseMode = ({ cards }: { cards: FlashCard[] }) => {
  const [revealed, setRevealed] = useState(new Set<number>());
  useEffect(() => setRevealed(new Set()), [cards]);

  const toggle   = (id: number) => setRevealed(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allShown = revealed.size === cards.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#6b7280" }}>{cards.length} cards</span>
        <button onClick={() => allShown ? setRevealed(new Set()) : setRevealed(new Set(cards.map(c => c.id)))}
          style={{ padding: "8px 18px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
          {allShown ? "Hide All" : "Reveal All"}
        </button>
      </div>
      {cards.map((card, idx) => (
        <div key={card.id} style={{ background: "#fff", borderRadius: 14, border: `2px solid ${revealed.has(card.id) ? "#a7f3d0" : "#e5e7eb"}`, overflow: "hidden", cursor: "pointer", transition: "border-color 0.15s" }}>
          <div onClick={() => toggle(card.id)} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 18px" }}>
            <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: "50%", background: "#1e3a8a", color: "#fff", fontSize: "0.7rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>{idx + 1}</span>
            <p style={{ fontWeight: 600, color: "#111827", lineHeight: 1.55, flex: 1, margin: 0, fontSize: "0.95rem" }}>{card.q}</p>
            <ChevronDown size={16} color="#9ca3af" style={{ flexShrink: 0, marginTop: 4, transform: revealed.has(card.id) ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
          </div>
          {revealed.has(card.id) && (
            <div style={{ padding: "12px 18px 14px 58px", borderTop: "2px solid #a7f3d0", background: "#ecfdf5" }}>
              <GlossaryText
                text={card.a}
                terms={card.terms}
                onCard={false}
                style={{ color: "#065f46", fontWeight: 600, lineHeight: 1.8, fontSize: "0.9rem", display: "block" }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODE: QUIZ — with question count selector
// ═══════════════════════════════════════════════════════════════════════════════

const QuizMode = ({ cards, allCards }: { cards: FlashCard[]; allCards: FlashCard[] }) => {
  const [quizAll,    setQuizAll]    = useState(false);
  const [quizCount,  setQuizCount]  = useState(Math.min(10, cards.length));
  const [started,    setStarted]    = useState(false);
  const [st,         setSt]         = useState<QuizState | null>(null);

  // Reset when cards change
  useEffect(() => {
    setStarted(false); setSt(null);
    setQuizCount(Math.min(10, cards.length));
    setQuizAll(false);
  }, [cards]);

  const effectiveCount = quizAll ? cards.length : Math.min(quizCount, cards.length);

  const startQuiz = () => {
    const d = shuffleArr(cards).slice(0, effectiveCount);
    setSt({ deck: d, index: 0, score: 0, selected: null, complete: false, choices: buildChoices(d[0], allCards) });
    setStarted(true);
  };

  // — Setup screen —
  if (!started) {
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", maxWidth: 420, width: "100%", display: "flex", flexDirection: "column", gap: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <div>
            <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>How many questions?</p>
            <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: 0 }}>{cards.length} cards available — questions picked randomly</p>
          </div>

          {/* Scroll-wheel number input + All checkbox — matches ToolShell worksheet generator */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "#374151" }}>Questions:</label>
              <input
                type="number"
                min={1}
                max={cards.length}
                value={quizCount}
                disabled={quizAll}
                onChange={e => setQuizCount(Math.max(1, Math.min(cards.length, parseInt(e.target.value) || 1)))}
                style={{
                  width: 72, padding: "8px 12px", border: "2px solid",
                  borderColor: quizAll ? "#e5e7eb" : "#d1d5db",
                  borderRadius: 10, fontSize: "1rem", fontWeight: 700,
                  textAlign: "center", outline: "none",
                  background: quizAll ? "#f3f4f6" : "#fff",
                  color: quizAll ? "#9ca3af" : "#111827",
                  cursor: quizAll ? "not-allowed" : "auto",
                }}
              />
            </div>

            {/* All checkbox */}
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <div
                onClick={() => setQuizAll(v => !v)}
                style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: quizAll ? "#1e3a8a" : "#d1d5db",
                  position: "relative", flexShrink: 0, cursor: "pointer",
                  transition: "background 0.2s",
                }}
              >
                <div style={{
                  position: "absolute", top: 4, width: 16, height: 16,
                  borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  transition: "transform 0.2s",
                  transform: quizAll ? "translateX(24px)" : "translateX(4px)",
                }} />
              </div>
              <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#374151" }}>All ({cards.length})</span>
            </label>
          </div>

          <button
            onClick={startQuiz}
            style={{ padding: "13px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "1rem", cursor: "pointer" }}
          >
            Start Quiz — {effectiveCount} question{effectiveCount !== 1 ? "s" : ""} →
          </button>
        </div>
      </div>
    );
  }

  // — Active quiz —
  if (!st) return null;
  const { deck, index, score, selected, complete, choices } = st;

  const handleSelect = (choice: string) => {
    if (selected !== null) return;
    setSt(s => s ? { ...s, selected: choice, score: choice === s.deck[s.index].a ? s.score + 1 : s.score } : s);
  };
  const handleNext = () => {
    const next = index + 1;
    if (next >= deck.length) { setSt(s => s ? { ...s, complete: true } : s); return; }
    setSt(s => s ? { ...s, index: next, selected: null, choices: buildChoices(deck[next], allCards) } : s);
  };

  if (complete) {
    const pct = Math.round((score / deck.length) * 100);
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: "48px 40px", maxWidth: 400, width: "100%", textAlign: "center", display: "flex", flexDirection: "column", gap: 16, alignItems: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: "3rem" }}>{pct >= 80 ? "🎉" : pct >= 50 ? "💪" : "📚"}</div>
          <p style={{ fontSize: "1.4rem", fontWeight: 700, color: "#111827", margin: 0 }}>Quiz Complete!</p>
          <div>
            <p style={{ fontSize: "3.5rem", fontWeight: 800, color: "#1e3a8a", margin: 0, lineHeight: 1 }}>{score}/{deck.length}</p>
            <p style={{ color: "#6b7280", fontWeight: 600, margin: "4px 0 0" }}>{pct}% correct</p>
          </div>
          <p style={{ color: "#6b7280", lineHeight: 1.6, fontSize: "0.9rem", margin: 0 }}>
            {pct >= 80 ? "Excellent — you know this topic well!" : pct >= 50 ? "Good effort — review the ones you missed." : "Keep revising — try Browse mode first."}
          </p>
          <div style={{ display: "flex", gap: 10, width: "100%" }}>
            <button onClick={() => { setStarted(false); setSt(null); }} style={{ flex: 1, padding: 12, background: "#fff", color: "#1e3a8a", border: "2px solid #1e3a8a", borderRadius: 12, fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>Change Count</button>
            <button onClick={startQuiz} style={{ flex: 1, padding: 12, background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  const current = deck[index];
  if (!current) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 660, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>Question {index + 1} of {deck.length}</span>
        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e3a8a" }}>Score: {score}/{index}</span>
      </div>
      <div style={{ width: "100%", height: 5, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${(index / deck.length) * 100}%`, height: "100%", background: "#1e3a8a", borderRadius: 4, transition: "width 0.3s" }} />
      </div>
      <div style={{ background: "#fff", borderRadius: 16, border: "2px solid #e5e7eb", padding: "24px 28px", textAlign: "center" }}>
        <p style={{ fontSize: "1.05rem", fontWeight: 600, color: "#111827", lineHeight: 1.6, margin: 0 }}>{current.q}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {choices.map((choice: string, i: number) => {
          let bg = "#fff", border = "#e5e7eb", color = "#111827", lc = "#9ca3af";
          if (selected !== null) {
            if (choice === current.a)    { bg = "#ecfdf5"; border = "#10b981"; color = "#065f46"; lc = "#065f46"; }
            else if (choice === selected) { bg = "#fef2f2"; border = "#ef4444"; color = "#991b1b"; lc = "#991b1b"; }
            else                          { bg = "#f9fafb"; color = "#9ca3af"; }
          }
          return (
            <button key={i} onClick={() => handleSelect(choice)}
              style={{ width: "100%", padding: "13px 18px", textAlign: "left", borderRadius: 12, border: `2px solid ${border}`, background: bg, color, fontWeight: 600, fontSize: "0.9rem", cursor: selected ? "default" : "pointer", transition: "all 0.15s", lineHeight: 1.5 }}>
              <span style={{ fontWeight: 700, color: lc, marginRight: 10 }}>{["A","B","C","D"][i]}.</span>{choice}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
          <button onClick={handleNext} style={{ padding: "12px 32px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" }}>
            {index + 1 >= deck.length ? "See Results" : "Next Question →"}
          </button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODE: FILL IN (drag-and-drop cloze)
// Supports both drag-and-drop (desktop) and tap-to-select + tap-to-place (mobile)
// ═══════════════════════════════════════════════════════════════════════════════

const FillInMode = ({ bankKey }: { bankKey: string }) => {
  const [exercises]               = useState<ClozeExercise[]>(() => getCloze(bankKey));
  const [exIdx, setExIdx]         = useState(0);
  const [slots, setSlots]         = useState<Record<number, string>>({});
  const [wordBank, setWordBank]   = useState<string[]>([]);
  const [checked, setChecked]     = useState(false);
  const [selected, setSelected]   = useState<string | null>(null);
  const dragWord                  = useRef<string | null>(null);

  const ex = exercises[exIdx];

  const initExercise = useCallback((exercise: ClozeExercise) => {
    setSlots({});
    setChecked(false);
    setSelected(null);
    setWordBank(shuffleArr(exercise.words));
  }, []);

  useEffect(() => { if (ex) initExercise(ex); }, [ex]);

  if (!ex) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <p style={{ color: "#9ca3af", fontWeight: 600, fontSize: "1.1rem" }}>No fill-in exercises available.</p>
      </div>
    );
  }

  const segments = parseCloze(ex.text);
  const slotSegments = segments.filter(s => s.type === "slot");
  const totalSlots = slotSegments.length;
  const filled = Object.keys(slots).length;

  const placeWord = (slotIdx: number, word: string) => {
    setSlots(prev => { const evicted = prev[slotIdx]; const next = { ...prev, [slotIdx]: word }; if (evicted) setWordBank(wb => shuffleArr([...wb, evicted])); return next; });
    setWordBank(wb => wb.filter(w => w !== word)); setSelected(null);
  };
  const removeFromSlot = (slotIdx: number) => {
    if (checked) return; const word = slots[slotIdx]; if (!word) return;
    setSlots(prev => { const n = { ...prev }; delete n[slotIdx]; return n; });
    setWordBank(wb => shuffleArr([...wb, word]));
  };
  const handleSlotClick  = (slotIdx: number) => { if (checked) return; if (slots[slotIdx]) { removeFromSlot(slotIdx); return; } if (selected !== null) placeWord(slotIdx, selected); };
  const handleWordClick  = (word: string) => { if (checked) return; setSelected(s => s === word ? null : word); };
  const onDragStart      = (word: string) => { dragWord.current = word; };
  const onDropSlot       = (e: React.DragEvent, slotIdx: number) => { e.preventDefault(); if (!dragWord.current || checked) return; placeWord(slotIdx, dragWord.current); dragWord.current = null; };

  let slotCounter = -1;
  const isCorrect  = (si: number) => slotSegments[si] && slots[si] === slotSegments[si].value;
  const allCorrect = slotSegments.every((_, i) => isCorrect(i));
  const score      = checked ? slotSegments.filter((_, i) => isCorrect(i)).length : 0;

  return (
    <div style={{ maxWidth: 740, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 2px" }}>
            Exercise {exIdx + 1} of {exercises.length}
          </p>
          <p style={{ fontSize: "1rem", fontWeight: 700, color: "#111827", margin: 0 }}>{ex.title}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {exercises.length > 1 && (
            <>
              <button disabled={exIdx === 0} onClick={() => setExIdx(i => i - 1)}
                style={{ width: 36, height: 36, borderRadius: 10, border: "2px solid #d1d5db", background: "#fff", cursor: exIdx === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: exIdx === 0 ? 0.35 : 1 }}>
                <ChevronLeft size={16} color="#6b7280" />
              </button>
              <button disabled={exIdx === exercises.length - 1} onClick={() => setExIdx(i => i + 1)}
                style={{ width: 36, height: 36, borderRadius: 10, border: "2px solid #d1d5db", background: "#fff", cursor: exIdx === exercises.length - 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: exIdx === exercises.length - 1 ? 0.35 : 1 }}>
                <ChevronRight size={16} color="#6b7280" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Paragraph with slots */}
      <div style={{ background: "#fff", borderRadius: 16, border: "2px solid #e5e7eb", padding: "28px 32px", lineHeight: 2.2, fontSize: "1rem", fontWeight: 500, color: "#111827" }}>
        {segments.map((seg, i) => {
          if (seg.type === "text") return <span key={i}>{seg.value}</span>;
          slotCounter++;
          const si = slotCounter;
          const placed = slots[si];
          let borderColor = "#cbd5e1", bg = "#f8fafc", textColor = "#111827";
          if (checked) {
            if (isCorrect(si))  { borderColor = "#10b981"; bg = "#ecfdf5"; textColor = "#065f46"; }
            else if (placed)    { borderColor = "#ef4444"; bg = "#fef2f2"; textColor = "#991b1b"; }
          } else if (placed)    { borderColor = "#1e3a8a"; bg = "#eff6ff"; textColor = "#1e3a8a"; }
          else if (selected)    { borderColor = "#1e3a8a"; bg = "#f0f7ff"; }

          return (
            <span
              key={i}
              onClick={() => handleSlotClick(si)}
              onDragOver={e => e.preventDefault()}
              onDrop={e => onDropSlot(e, si)}
              style={{
                display: "inline-block", minWidth: 110, padding: "2px 12px",
                margin: "0 4px", borderRadius: 8, border: `2px dashed ${borderColor}`,
                background: bg, color: textColor, fontWeight: 700, fontSize: "0.9rem",
                textAlign: "center", verticalAlign: "middle", cursor: checked ? "default" : "pointer",
                transition: "all 0.15s", lineHeight: 1.8,
              }}
            >
              {placed || (selected ? "← tap to place" : "_______")}
            </span>
          );
        })}
      </div>

      {/* Score feedback */}
      {checked && (
        <div style={{ background: allCorrect ? "#ecfdf5" : "#fef9c3", border: `2px solid ${allCorrect ? "#10b981" : "#fcd34d"}`, borderRadius: 12, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, color: allCorrect ? "#065f46" : "#92400e", fontSize: "0.95rem" }}>
            {allCorrect ? "🎉 Perfect! All correct." : `${score} of ${totalSlots} correct — check the highlighted slots.`}
          </span>
          <button onClick={() => initExercise(ex)} style={{ padding: "6px 16px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={14} /> Reset
          </button>
        </div>
      )}

      {/* Word bank */}
      <div>
        <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>
          Word Bank — {checked ? "exercise complete" : selected ? `'${selected}' selected — tap a slot` : "tap a word, then tap a slot · or drag and drop"}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {wordBank.map((word, i) => (
            <div
              key={`${word}-${i}`}
              draggable={!checked}
              onDragStart={() => onDragStart(word)}
              onClick={() => handleWordClick(word)}
              style={{
                padding: "7px 16px", borderRadius: 20, fontWeight: 700, fontSize: "0.88rem",
                border: "2px solid", cursor: checked ? "default" : "pointer", transition: "all 0.15s",
                background: selected === word ? "#1e3a8a" : "#fff",
                color: selected === word ? "#fff" : "#374151",
                borderColor: selected === word ? "#1e3a8a" : "#d1d5db",
                boxShadow: selected === word ? "0 2px 12px rgba(30,58,138,0.25)" : "0 1px 3px rgba(0,0,0,0.06)",
                userSelect: "none",
              }}
            >
              {word}
            </div>
          ))}
          {wordBank.length === 0 && !checked && (
            <p style={{ color: "#9ca3af", fontSize: "0.85rem", fontStyle: "italic" }}>All words placed</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
        {!checked && (
          <button
            onClick={() => setChecked(true)}
            disabled={filled < totalSlots}
            style={{ padding: "12px 32px", background: filled < totalSlots ? "#e5e7eb" : "#1e3a8a", color: filled < totalSlots ? "#9ca3af" : "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "0.95rem", cursor: filled < totalSlots ? "not-allowed" : "pointer" }}>
            Check Answers ({filled}/{totalSlots} filled)
          </button>
        )}
        {checked && !allCorrect && (
          <button onClick={() => initExercise(ex)} style={{ padding: "12px 32px", background: "#fff", color: "#1e3a8a", border: "2px solid #1e3a8a", borderRadius: 12, fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" }}>
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODE: EXAM QUESTIONS — parameterised longer-form questions with mark schemes
// ═══════════════════════════════════════════════════════════════════════════════

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  explain:  { label: "Explain",  color: "#1e3a8a", bg: "#eff6ff", border: "#bfdbfe" },
  compare:  { label: "Compare",  color: "#065f46", bg: "#ecfdf5", border: "#a7f3d0" },
  apply:    { label: "Apply",    color: "#92400e", bg: "#fffbeb", border: "#fde68a" },
  evaluate: { label: "Evaluate", color: "#7c2d12", bg: "#fff7ed", border: "#fed7aa" },
};

const ExamMode = ({ bankKey, typeFilter, showHints }: { bankKey: string; typeFilter: string; showHints: boolean }) => {
  const [allQuestions]             = useState<ExamQuestion[]>(() => getExamQuestions(bankKey));
  const questions                  = typeFilter === "all" ? allQuestions : allQuestions.filter(q => q.type === typeFilter);
  const [index, setIndex]          = useState(0);
  const [revealed, setRevealed]    = useState(false);
  const [resolved, setResolved]    = useState<{ text: string; ctx: string | null }>(() => resolveQuestion(questions[0] ?? { contexts: [], template: "" } as unknown as ExamQuestion));

  const goTo = (i: number) => { setIndex(i); setRevealed(false); setResolved(resolveQuestion(questions[i])); };
  const reroll = () => { setRevealed(false); setResolved(resolveQuestion(questions[index])); };

  if (!questions.length) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <p style={{ color: "#9ca3af", fontWeight: 600 }}>No exam questions available.</p>
      </div>
    );
  }

  const q   = questions[index];
  const cfg = TYPE_CONFIG[q.type] ?? TYPE_CONFIG.explain;
  const contextMarks = resolved.ctx ? (q.contextNotes?.[resolved.ctx] ?? []) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 720, margin: "0 auto" }}>

      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            padding: "4px 12px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 700,
            background: cfg.bg, color: cfg.color, border: `2px solid ${cfg.border}`,
          }}>
            {cfg.label}
          </span>
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#6b7280" }}>
            [{q.marks} mark{q.marks !== 1 ? "s" : ""}]
          </span>
        </div>
        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#9ca3af" }}>
          {index + 1} of {questions.length}
        </span>
      </div>

      {/* Question card */}
      <div style={{
        background: "#fff", borderRadius: 16,
        border: `2px solid ${cfg.border}`,
        padding: "28px 32px", display: "flex", flexDirection: "column", gap: 16,
      }}>
        <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", lineHeight: 1.6, margin: 0 }}>
          {resolved.text}
        </p>

        {/* Hint — only shown when hints are enabled */}
        {showHints && (
          <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 16px", borderLeft: `4px solid ${cfg.border}` }}>
            <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#6b7280", margin: 0 }}>
              <span style={{ color: cfg.color }}>Hint:</span> {q.hint}
            </p>
          </div>
        )}

        {/* Mark tariff */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {Array.from({ length: q.marks }).map((_, i) => (
            <div key={i} style={{
              width: 28, height: 28, borderRadius: "50%", border: `2px solid ${cfg.border}`,
              background: revealed ? cfg.bg : "#f9fafb",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.7rem", fontWeight: 700, color: cfg.color, transition: "all 0.2s",
            }}>
              {revealed ? "✓" : i + 1}
            </div>
          ))}
          <span style={{ fontSize: "0.8rem", color: "#9ca3af", fontWeight: 500, alignSelf: "center", marginLeft: 4 }}>
            {revealed ? "Mark scheme below" : "Write your answer, then reveal"}
          </span>
        </div>
      </div>

      {/* Reveal button */}
      {!revealed && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            onClick={() => setRevealed(true)}
            style={{ padding: "12px 36px", background: cfg.color, color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" }}
          >
            Reveal Mark Scheme
          </button>
        </div>
      )}

      {/* Mark scheme */}
      {revealed && (
        <div style={{ background: "#fff", borderRadius: 16, border: `2px solid ${cfg.border}`, overflow: "hidden" }}>
          <div style={{ background: cfg.bg, padding: "14px 24px", borderBottom: `2px solid ${cfg.border}` }}>
            <p style={{ fontWeight: 700, fontSize: "0.85rem", color: cfg.color, margin: 0 }}>
              Mark Scheme — {q.marks} mark{q.marks !== 1 ? "s" : ""}
            </p>
          </div>
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
            {q.markScheme.map((point, i) => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{
                  flexShrink: 0, width: 26, height: 26, borderRadius: "50%",
                  background: cfg.bg, border: `2px solid ${cfg.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.72rem", fontWeight: 700, color: cfg.color, marginTop: 1,
                }}>
                  {i + 1}
                </span>
                <p style={{ fontSize: "0.9rem", color: "#374151", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                  {point}
                </p>
              </div>
            ))}

            {/* Context-specific model notes */}
            {contextMarks.length > 0 && (
              <div style={{ marginTop: 8, padding: "14px 16px", background: "#f8fafc", borderRadius: 10, borderLeft: `4px solid ${cfg.border}` }}>
                <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6b7280", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Model answer notes for this context
                </p>
                {contextMarks.map((note, i) => (
                  <p key={i} style={{ fontSize: "0.85rem", color: "#374151", lineHeight: 1.6, margin: i > 0 ? "6px 0 0" : 0 }}>
                    {note}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
        <button
          onClick={() => index > 0 && goTo(index - 1)}
          disabled={index === 0}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "10px 20px",
            borderRadius: 12, fontWeight: 700, fontSize: "0.9rem", border: "2px solid",
            cursor: index === 0 ? "not-allowed" : "pointer",
            background: index === 0 ? "#f3f4f6" : "#fff",
            color: index === 0 ? "#d1d5db" : "#374151",
            borderColor: index === 0 ? "#e5e7eb" : "#d1d5db",
          }}
        >
          <ChevronLeft size={18} /> Previous
        </button>

        <button
          onClick={reroll}
          title="New context for this question"
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "10px 18px",
            borderRadius: 12, fontWeight: 700, fontSize: "0.85rem",
            border: `2px solid ${cfg.border}`, background: cfg.bg, color: cfg.color, cursor: "pointer",
          }}
        >
          <RefreshCw size={15} /> New variant
        </button>

        <button
          onClick={() => index < questions.length - 1 && goTo(index + 1)}
          disabled={index === questions.length - 1}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "10px 20px",
            borderRadius: 12, fontWeight: 700, fontSize: "0.9rem", border: "2px solid",
            cursor: index === questions.length - 1 ? "not-allowed" : "pointer",
            background: index === questions.length - 1 ? "#f3f4f6" : "#1e3a8a",
            color: index === questions.length - 1 ? "#d1d5db" : "#fff",
            borderColor: index === questions.length - 1 ? "#e5e7eb" : "#1e3a8a",
          }}
        >
          Next <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};



const INFO = [
  { title: "1.1.1 CPU Architecture", icon: "🖥️", items: [
    { label: "Key components",       detail: "ALU (arithmetic/logic), Control Unit (coordination), Registers (PC, ACC, MAR, MDR, CIR), Cache." },
    { label: "Fetch-Decode-Execute", detail: "PC → MAR → MDR → CIR → decode → execute → PC increments. Repeats continuously." },
    { label: "System bus",           detail: "Address bus (unidirectional), Data bus (bidirectional), Control bus (read/write/clock)." },
  ]},
  { title: "1.1.2 CPU Performance", icon: "⚡", items: [
    { label: "Three factors", detail: "Clock speed (GHz), number of cores, and cache size. Examiners expect all three." },
    { label: "Cache levels", detail: "L1 = fastest, smallest, per core. L2 = larger, per core. L3 = largest, shared between cores." },
    { label: "Trade-offs",   detail: "More cores only help if software is multi-threaded. Higher clock speed = more heat." },
  ]},
  { title: "1.1.3 Embedded Systems", icon: "🔧", items: [
    { label: "Definition", detail: "Built into a device, dedicated single function (e.g. pacemaker, washing machine controller)." },
    { label: "ROM storage", detail: "Non-volatile — program persists without power and cannot be accidentally overwritten." },
    { label: "RTOS",        detail: "Guarantees response within a fixed time. Essential for safety-critical systems." },
  ]},
  { title: "Exam tips", icon: "📝", items: [
    { label: "Registers",     detail: "Know exactly what each one stores — PC, ACC, MAR, MDR and CIR tested individually." },
    { label: "Always justify",detail: "'More cache is better because it reduces accesses to slower RAM' earns the mark." },
    { label: "Embedded",      detail: "Key word: dedicated. Link ROM to non-volatile and single unchanging function." },
  ]},
];

const InfoModal = ({ onClose }: { onClose: () => void }) => (
  <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 600, maxHeight: "80vh", margin: "0 1rem", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 28px", borderBottom: "1px solid #f3f4f6" }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: "1.2rem", color: "#111827", margin: 0 }}>Topic Information</h2>
          <p style={{ color: "#6b7280", fontSize: "0.8rem", margin: "2px 0 0" }}>Key facts and revision guidance</p>
        </div>
        <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: "#f3f4f6", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={18} color="#6b7280" /></button>
      </div>
      <div style={{ overflowY: "auto", padding: "20px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
        {INFO.map(s => (
          <div key={s.title}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>{s.icon}</span>
              <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "#1e3a8a", margin: 0 }}>{s.title}</h3>
            </div>
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
      <div style={{ padding: "14px 28px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ padding: "8px 20px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>Close</button>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MENU DROPDOWN
// ═══════════════════════════════════════════════════════════════════════════════

const MenuDropdown = ({ onClose, onInfo }: { onClose: () => void; onInfo: () => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return (
    <div ref={ref} style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", border: "1px solid #e5e7eb", minWidth: 200, zIndex: 50, overflow: "hidden" }}>
      <button onClick={() => { onInfo(); onClose(); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "none", border: "none", cursor: "pointer", fontSize: "0.88rem", fontWeight: 600, color: "#374151" }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#9ca3af" strokeWidth="1.5"/><path d="M8 7v5M8 5v.5" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/></svg>
        Topic Information
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════

const ACTIVITIES = [
  { key: "recall",  label: "Recall"        },
  { key: "fillin",  label: "Fill In"       },
  { key: "exam",    label: "Exam Practice" },
];

const RECALL_MODES = [
  { key: "flashcard", label: "Flashcard" },
  { key: "browse",    label: "Browse"    },
  { key: "quiz",      label: "Quiz"      },
];

const EXAM_TYPES = [
  { key: "all",      label: "All"      },
  { key: "explain",  label: "Explain"  },
  { key: "compare",  label: "Compare"  },
  { key: "apply",    label: "Apply"    },
  { key: "evaluate", label: "Evaluate" },
];

// ── Tier 1 & 2: loose pill buttons (same size, same spec everywhere) ──────────
const PillBtn = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button onClick={onClick} style={{
    padding: "9px 22px", borderRadius: 10, fontWeight: 700, fontSize: "0.9rem",
    border: "2px solid", cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
    background:  active ? "#1e3a8a" : "#fff",
    color:       active ? "#fff"    : "#4b5563",
    borderColor: active ? "#1e3a8a" : "#e5e7eb",
    boxShadow:   active ? "0 2px 8px rgba(30,58,138,0.2)" : "none",
  }}>
    {label}
  </button>
);

// ── Tier 3: joined segmented control — reads as one unit, always centred ─────
const SegControl = ({ options, value, onChange }: { options: { key: string; label: string }[]; value: string; onChange: (v: string) => void }) => (
  <div style={{
    display: "inline-flex", borderRadius: 10, overflow: "hidden",
    border: "2px solid #e5e7eb", background: "#f9fafb",
  }}>
    {options.map((opt, i) => {
      const active = value === opt.key;
      return (
        <button key={opt.key} onClick={() => onChange(opt.key)} style={{
          padding: "8px 20px", fontWeight: 700, fontSize: "0.88rem",
          border: "none", borderLeft: i > 0 ? "1.5px solid #e5e7eb" : "none",
          cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
          background: active ? "#1e3a8a" : "transparent",
          color:      active ? "#fff"    : "#4b5563",
        }}>
          {opt.label}
        </button>
      );
    })}
  </div>
);

const TogglePill = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flexShrink: 0 }}>
    <div onClick={() => onChange(!checked)} style={{ width: 48, height: 24, borderRadius: 12, position: "relative", background: checked ? "#1e3a8a" : "#d1d5db", transition: "background 0.2s", cursor: "pointer", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 4, width: 16, height: 16, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "transform 0.2s", transform: checked ? "translateX(28px)" : "translateX(4px)" }} />
    </div>
    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", userSelect: "none" }}>{label}</span>
  </label>
);

const NavPanel = ({ bankKeys, bankKey, setBankKey, bankLabel, activity, setActivity, recallMode, setRecallMode, examType, setExamType, showHints, setShowHints, cards }: {
  bankKeys: string[]; bankKey: string; setBankKey: (k: string) => void; bankLabel: (k: string) => string;
  activity: string; setActivity: (a: string) => void;
  recallMode: string; setRecallMode: (m: string) => void;
  examType: string; setExamType: (t: string) => void;
  showHints: boolean; setShowHints: (v: boolean) => void;
  cards: FlashCard[];
}) => {
  const hasThirdRow = activity === "recall" || activity === "exam";

  return (
    <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)", marginBottom: 32, overflow: "hidden", border: "1px solid #f3f4f6" }}>
      {/* Row 1 — Sub-topic */}
      <div style={{ padding: "16px 20px", display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {bankKeys.map(k => (
          <PillBtn key={k} label={bankLabel(k)} active={bankKey === k} onClick={() => setBankKey(k)} />
        ))}
      </div>

      {/* Row 2 — Activity (slightly tinted background to distinguish) */}
      <div style={{ borderTop: "1.5px solid #f3f4f6", background: "#fafafa", padding: "14px 20px", display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {ACTIVITIES.map(a => (
          <PillBtn key={a.key} label={a.label} active={activity === a.key} onClick={() => setActivity(a.key)} />
        ))}
      </div>

      {/* Row 3 — Sub-controls: centred segmented control */}
      {hasThirdRow && (
        <div style={{ borderTop: "1.5px solid #f3f4f6", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
          {activity === "recall" && (
            <>
              <SegControl options={RECALL_MODES} value={recallMode} onChange={setRecallMode} />
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#9ca3af", flexShrink: 0 }}>
                {cards.length} card{cards.length !== 1 ? "s" : ""}
              </span>
            </>
          )}
          {activity === "exam" && (
            <>
              <SegControl options={EXAM_TYPES} value={examType} onChange={setExamType} />
              <TogglePill checked={showHints} onChange={setShowHints} label="Hints" />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const bankKeys = ["1.1.1", "1.1.2", "1.1.3", "mixed"];

  const [bankKey,    setBankKey]    = useState("1.1.1");
  const [activity,   setActivity]   = useState("recall");
  const [recallMode, setRecallMode] = useState("flashcard");
  const [examType,   setExamType]   = useState("all");
  const [showHints,  setShowHints]  = useState(true);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [infoOpen,   setInfoOpen]   = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<TooltipState | null>(null);

  _setActiveTooltip = setActiveTooltip;

  const cards      = getCards(bankKey);
  const allCards   = getAllCards();
  const bankLabel  = (key: string) => key === "mixed" ? "Mixed" : (BANKS[key]?.label ?? key);
  const contentKey = `${bankKey}-${activity}-${recallMode}-${examType}`;

  return (
    <>
      {activeTooltip && (
        <TooltipPortal term={activeTooltip.term} def={activeTooltip.def} anchorRect={activeTooltip.rect} onHide={() => setActiveTooltip(null)} />
      )}

      {/* Navbar — ToolShell spec */}
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <button onClick={() => { window.location.href = "/"; }} className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors">
            <Home size={24} /><span className="font-semibold text-lg">Home</span>
          </button>
          <div className="relative">
            <button onClick={() => setMenuOpen(o => !o)} className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors">
              {menuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
            {menuOpen && <MenuDropdown onClose={() => setMenuOpen(false)} onInfo={() => setInfoOpen(true)} />}
          </div>
        </div>
      </div>

      {infoOpen && <InfoModal onClose={() => setInfoOpen(false)} />}

      {/* Page — ToolShell spec */}
      <div className="min-h-screen p-8" style={{ backgroundColor: "#f5f3f0" }}>
        <div className="max-w-6xl mx-auto">

          <h1 className="text-5xl font-bold text-center mb-8" style={{ color: "#000" }}>
            1.1 Systems Architecture
          </h1>

          <NavPanel
            bankKeys={bankKeys} bankKey={bankKey} setBankKey={setBankKey} bankLabel={bankLabel}
            activity={activity} setActivity={setActivity}
            recallMode={recallMode} setRecallMode={setRecallMode}
            examType={examType} setExamType={setExamType}
            showHints={showHints} setShowHints={setShowHints}
            cards={cards}
          />

          {activity === "recall" && recallMode === "flashcard" && <FlashcardMode key={contentKey} cards={cards} />}
          {activity === "recall" && recallMode === "browse"    && <BrowseMode    key={contentKey} cards={cards} />}
          {activity === "recall" && recallMode === "quiz"      && <QuizMode      key={contentKey} cards={cards} allCards={allCards} />}
          {activity === "fillin"                               && <FillInMode    key={contentKey} bankKey={bankKey} />}
          {activity === "exam"                                 && <ExamMode      key={contentKey} bankKey={bankKey} typeFilter={examType} showHints={showHints} />}

        </div>
      </div>
    </>
  );
}
