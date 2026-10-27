import {
  CSShell,
  type CSTopic, type SpecTag, type FlashCard, type ClozeExercise,
  type ExamQuestion, type SynopticQuestion, type MythItem,
  type Lesson, type InfoSection, type SchematicConfig,
} from "../../shared/cs";

// ═══════════════════════════════════════════════════════════════════════════════
// OCR J277 — 1.1.3 Embedded Systems (authored as pure data on the CS shell)
//
// Replaces the 1.1.3 strand of the old hand-built System Architectures tool, in the
// same shape as 1.1.1 and 1.1.2: a content object, a spec tag on every core item,
// J277/01 formats and tariffs, and a two-line default export. The brief is
// specs/cs/embedded-systems.md.
//
// The J277 requirements for 1.1.3 are two bullets: the PURPOSE and CHARACTERISTICS of
// embedded systems, and EXAMPLES of them. Real-time operating systems are not in the
// GCSE spec; they were in the old tool, so they are kept here as clearly flagged
// beyond-spec enrichment (off in default sessions).
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// SPEC TAGS — the three 1.1.3 requirements, plus the synoptic partners drawn in for
// cross-topic questions (bare sub-topic ids are not requirement tags of THIS topic).
// ─────────────────────────────────────────────────────────────────────────────

const SPEC_DESCRIPTIONS: Record<SpecTag, string> = {
  "1.1.3-R1": "Required: the purpose of embedded systems — a computer built into a larger device to carry out one dedicated function.",
  "1.1.3-R2": "Required: the characteristics of embedded systems — low cost, low power, small, reliable, with a fixed program held in ROM.",
  "1.1.3-R3": "Required: examples of embedded systems, and being able to say why a device is (or is not) one.",
  "1.1.1":    "Sub-topic 1.1.1 — CPU architecture (the fetch-execute cycle every CPU carries out, including an embedded one). Drawn in for synoptic links only.",
  "1.1.2":    "Sub-topic 1.1.2 — CPU performance (performance traded against cost, power and size). Drawn in for synoptic links only.",
  "1.2.1":    "Sub-topic 1.2.1 — Primary storage (RAM and ROM, volatile and non-volatile). Drawn in for synoptic links only.",
};

// ─────────────────────────────────────────────────────────────────────────────
// GLOSSARY — 1.1.3 core terms (+ clearly beyond-spec ones).
// ─────────────────────────────────────────────────────────────────────────────

const GLOSSARY: Record<string, string> = {
  "embedded system":       "A computer built into a larger device to carry out one dedicated function, such as controlling a washing machine.",
  "general-purpose computer": "A computer that can run many different programs, such as a laptop or desktop PC.",
  "dedicated function":    "One fixed job that a device does all the time — an embedded system is built for it and nothing else.",
  "ROM":                   "Read-Only Memory — non-volatile memory that keeps its contents with the power off; it usually holds an embedded system's program.",
  "non-volatile":          "Memory that keeps its contents when the power is switched off (e.g. ROM).",
  "volatile":              "Memory that loses its contents when the power is switched off (e.g. RAM).",
  "RAM":                   "Random Access Memory — the main memory a general-purpose computer uses to hold the programs it is running; it is volatile.",
  // beyond spec
  "firmware":              "Beyond spec — the fixed program stored in an embedded device's ROM.",
  "microcontroller":       "Beyond spec — a single small chip holding the CPU, a little memory and the connections an embedded system needs.",
  "RTOS":                  "Beyond spec — Real-Time Operating System: guarantees a response within a fixed time, used where a delay would be dangerous.",
};

// ─────────────────────────────────────────────────────────────────────────────
// CARD DATA — core (Required) + clearly-flagged beyond-spec enrichment.
// ─────────────────────────────────────────────────────────────────────────────

const CARDS: FlashCard[] = [
  // ── R1: purpose ─────────────────────────────────────────────────────────────
  { id: 1, specTag: "1.1.3-R1", q: "What is an embedded system?",
    a: "A computer system built into a larger device to carry out one dedicated function", terms: [],
    distractors: ["A portable computer used in factories", "A computer that only runs on battery power", "A system where the CPU and RAM are on the same chip"] },
  { id: 2, specTag: "1.1.3-R1", q: "How does an embedded system differ from a general-purpose computer?",
    a: "It does one specific job, whereas a general-purpose computer can run many different programs", terms: ["embedded system", "general-purpose computer"],
    distractors: ["An embedded system uses RAM; a general-purpose computer uses ROM", "An embedded system has no processor", "An embedded system is always connected to the internet"] },
  { id: 3, specTag: "1.1.3-R1", q: "Why does an embedded system not need to run lots of different programs?",
    a: "It is built for one dedicated function, so one fixed program is all it needs", terms: ["dedicated function"],
    distractors: ["It has no memory to store programs", "The user is not allowed to switch it on", "Its operating system forbids more than one program"] },

  // ── R2: characteristics ─────────────────────────────────────────────────────
  { id: 4, specTag: "1.1.3-R2", q: "What type of memory usually stores the program in an embedded system, and why?",
    a: "ROM — it is non-volatile, so the program is kept with the power off and cannot easily be overwritten", terms: ["ROM", "non-volatile"],
    distractors: ["RAM — it lets the program be updated at any time", "Cache — it lets the program run at maximum speed", "Virtual memory — it holds programs bigger than the chip"] },
  { id: 5, specTag: "1.1.3-R2", q: "Give two characteristics of an embedded system.",
    a: "Any two of: low cost, low power use, small size, reliable, one dedicated function, program stored in ROM", terms: [],
    distractors: ["Large storage and a powerful processor", "Runs any software and is easily upgraded", "Supports many users at once and has a large screen"] },
  { id: 6, specTag: "1.1.3-R2", q: "Why are embedded systems usually cheaper than general-purpose computers?",
    a: "They only need the hardware for their one job — no large screen, keyboard, hard drive or powerful processor", terms: ["embedded system"],
    distractors: ["They use older, second-hand parts", "They do not contain a processor at all", "They are always made in smaller numbers"] },
  { id: 7, specTag: "1.1.3-R2", q: "Why are embedded systems usually very reliable?",
    a: "They do one simple job with one fixed program, so there is less to go wrong", terms: [],
    distractors: ["They are replaced every month", "They are checked by the user before every use", "They never need electricity"] },
  { id: 8, specTag: "1.1.3-R2", q: "Why is low power use important for many embedded systems?",
    a: "Many run on batteries or are always switched on, so using little power makes them last longer and cost less to run", terms: [],
    distractors: ["It lets them run faster than a laptop", "It means they need no memory", "It lets them connect to a wider network"] },
  { id: 9, specTag: "1.1.3-R2", q: "Does an embedded system usually have a full screen and keyboard? Why?",
    a: "No — it only has the inputs and outputs its one job needs, such as a few buttons, sensors or a small display", terms: ["embedded system"],
    distractors: ["Yes — every computer needs a screen and keyboard", "Yes — otherwise the program could not run", "No — embedded systems cannot have any input at all"] },

  // ── R3: examples ────────────────────────────────────────────────────────────
  { id: 10, specTag: "1.1.3-R3", q: "Give two examples of embedded systems found in the home.",
    a: "Any two of: washing machine, microwave oven, central-heating controller, smart thermostat, television remote control", terms: [],
    distractors: ["A laptop and a desktop PC", "A games console and a tablet", "A file server and a router running many programs"] },
  { id: 11, specTag: "1.1.3-R3", q: "Give an example of an embedded system in a vehicle.",
    a: "Engine management, anti-lock braking, airbag control or cruise control", terms: [],
    distractors: ["The driver's own smartphone", "A satnav app running on a tablet", "A laptop left on the back seat"] },
  { id: 12, specTag: "1.1.3-R3", q: "Give an example of an embedded system where reliability is critical.",
    a: "A pacemaker, an aircraft autopilot or a car's braking system — failure could be life-threatening", terms: [],
    distractors: ["A digital photo frame — failure would lose some photos", "A games console — failure would stop a game", "A smart TV — failure would interrupt a programme"] },
  { id: 13, specTag: "1.1.3-R3", q: "Is a laptop an embedded system? Why or why not?",
    a: "No — it is a general-purpose computer that can run many different programs, not a computer built in to do one job", terms: ["general-purpose computer"],
    distractors: ["Yes — it contains a processor", "Yes — it is small enough to carry", "No — because it has no memory"] },

  // ── beyond spec ─────────────────────────────────────────────────────────────
  { id: 101, specTag: "1.1.3-R2", beyondSpec: true, q: "What is a real-time operating system (RTOS)?",
    a: "An operating system that guarantees a response to an input within a fixed time", terms: ["RTOS"],
    distractors: ["An operating system that streams video live", "An operating system that updates itself over the internet", "An operating system that only ever runs one process"],
    explain: "Not in the GCSE spec, but a good example of why embedded systems in safety-critical devices (a pacemaker, anti-lock brakes) can be more than a simple program on a chip." },
  { id: 102, specTag: "1.1.3-R2", beyondSpec: true, q: "What is firmware?",
    a: "The fixed program stored in an embedded device's ROM", terms: ["firmware", "ROM"],
    distractors: ["The physical case of the device", "The battery inside the device", "A program the user installs from the internet"] },
  { id: 103, specTag: "1.1.3-R1", beyondSpec: true, q: "What is a microcontroller?",
    a: "A single small chip containing a CPU, a little memory and the connections an embedded system needs", terms: ["microcontroller"],
    distractors: ["A large server processor", "A type of keyboard", "A memory card for a camera"] },
];

// ─────────────────────────────────────────────────────────────────────────────
// MISCONCEPTIONS — Spot-the-Mistake / True-or-False. Each targets a classic
// 1.1.3 error; the student judges it, then sees the correction.
// ─────────────────────────────────────────────────────────────────────────────

const MYTHS: MythItem[] = [
  { id: 1, specTag: "1.1.3-R1", statement: "An embedded system can run any software, just like a desktop computer.", isTrue: false,
    why: "An embedded system is built for one dedicated function and runs one fixed program. A general-purpose computer is the one that can run many different programs." },
  { id: 2, specTag: "1.1.3-R2", statement: "An embedded system's program is usually stored in RAM, so it is lost when the power goes off.", isTrue: false,
    why: "The program is normally stored in ROM, which is non-volatile, so it is kept with the power off and is not lost or easily overwritten. RAM is volatile." },
  { id: 3, specTag: "1.1.3-R3", statement: "Embedded systems are only ever found in tiny devices, never in big machines.", isTrue: false,
    why: "A car, an aircraft or a factory machine can each contain many embedded systems. 'Embedded' means built into a larger device, not that the device is small." },
  { id: 4, specTag: "1.1.3-R3", statement: "A laptop is an embedded system because it has a processor inside it.", isTrue: false,
    why: "Nearly every computer has a processor. A laptop is a general-purpose computer that runs many programs; an embedded system is built into a device for one dedicated function." },
  { id: 5, specTag: "1.1.3-R2", statement: "Because an embedded system is a computer, it must be as powerful as a desktop PC.", isTrue: false,
    why: "Embedded systems usually have a small, low-power, low-cost processor, because one dedicated function does not need much processing power." },
  { id: 6, specTag: "1.1.3-R3", statement: "The controller in a washing machine is an embedded system because it does one fixed job.", isTrue: true,
    why: "Correct: it is a computer built into the washing machine to carry out one dedicated function (controlling the wash cycle) using a fixed program." },
];

// ─────────────────────────────────────────────────────────────────────────────
// FILL-IN (cloze) — one per requirement area. Every [slot] answer is in the word pool.
// ─────────────────────────────────────────────────────────────────────────────

const CLOZE: ClozeExercise[] = [
  {
    id: 1, specTag: "1.1.3-R1", title: "What an embedded system is",
    text: "An embedded system is a [computer] built into a larger [device] to carry out one [dedicated] function. A [general-purpose] computer, such as a laptop, can run many different programs.",
    words: ["computer", "device", "dedicated", "general-purpose", "network", "temporary"],
  },
  {
    id: 2, specTag: "1.1.3-R2", title: "Characteristics",
    text: "Embedded systems are usually [small], use little [power] and are low [cost]. Their program is stored in [ROM], so it is not lost when the power is switched off.",
    words: ["small", "power", "cost", "ROM", "large", "RAM"],
  },
  {
    id: 3, specTag: "1.1.3-R2", title: "Memory in an embedded system",
    text: "ROM is [non-volatile], so an embedded system keeps its program when the power is [off]. RAM is [volatile] and would lose it.",
    words: ["non-volatile", "off", "volatile", "on"],
  },
  {
    id: 4, specTag: "1.1.3-R3", title: "Examples",
    text: "A device that does one fixed job, like a [washing machine], is controlled by an [embedded] system. A [laptop] is a general-purpose computer instead.",
    words: ["washing machine", "embedded", "laptop", "general-purpose", "ROM"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXAM QUESTIONS — realistic J277/01 formats and tariffs, all tagged 1.1.3.
// ─────────────────────────────────────────────────────────────────────────────

const EXAM_QUESTIONS: ExamQuestion[] = [
  {
    id: "x1", specTag: "1.1.3-R3", format: "mcq", marks: 1,
    prompt: "Which of these is an example of an embedded system?",
    options: ["A laptop", "The controller in a washing machine", "A desktop PC", "A school's file server"],
    answerIndex: 1,
    hint: "Think: built into a larger device to do one job.",
    markScheme: ["The controller in a washing machine (1)"],
    modelAnswer: "**The controller in a washing machine.**",
  },
  {
    id: "x2", specTag: "1.1.3-R2", format: "mcq", marks: 1,
    prompt: "Which type of memory usually stores the program in an embedded system?",
    options: ["RAM", "ROM", "Cache", "Virtual memory"],
    answerIndex: 1,
    hint: "The program must still be there when the power is switched off.",
    markScheme: ["ROM (1)"],
    modelAnswer: "**ROM.**",
  },
  {
    id: "x3", specTag: "1.1.3-R1", format: "state", marks: 1,
    prompt: "State what is meant by an embedded system.",
    hint: "It is built into something bigger, for one job.",
    markScheme: ["A computer built into a larger device to carry out a dedicated/specific function (1)"],
    modelAnswer: "An embedded system is **a computer built into a larger device to carry out one dedicated function.**",
  },
  {
    id: "x4", specTag: "1.1.3-R2", format: "short", marks: 2,
    prompt: "Give two characteristics of an embedded system.",
    hint: "Think about cost, power, size, reliability and what it does.",
    markScheme: [
      "Any two from: low cost / low power use / small size / reliable / one dedicated function / program stored in ROM (1 each)",
    ],
    modelAnswer: "**It is low cost** and **it carries out one dedicated function** (also acceptable: low power, small, reliable, program stored in ROM).",
  },
  {
    id: "x5", specTag: "1.1.3-R1", format: "short", marks: 3,
    prompt: "Describe the difference between an embedded system and a general-purpose computer.",
    hint: "Compare what each is for, and what each can run.",
    markScheme: [
      "An embedded system is built into a larger device (1)",
      "To carry out one dedicated/specific function, running one fixed program (1)",
      "A general-purpose computer can run many different programs / do many different jobs (1)",
    ],
    modelAnswer: "**An embedded system is built into a larger device to carry out one dedicated function, running one fixed program.** **A general-purpose computer, such as a laptop, can run many different programs and do many different jobs.**",
  },
  {
    id: "x6", specTag: "1.1.3-R3", format: "scenario", marks: 3,
    prompt: "Explain why {context} is suitable to be controlled by an embedded system.",
    contexts: ["a washing machine", "a set of traffic lights", "a microwave oven", "a car's anti-lock braking system", "a pacemaker"],
    hint: "Think: one dedicated function, then an advantage that matters for this device.",
    markScheme: [
      "It performs one single, dedicated function (1)",
      "A relevant advantage of an embedded system for this device (e.g. low cost, low power, reliable, small) (1)",
      "The advantage is linked to this device's use with a reason (1)",
    ],
    modelNotes: {
      "a washing machine": ["Single function: controlling the wash cycle (1); low cost keeps the product affordable (1); program in ROM so it cannot be accidentally overwritten and is kept with the power off (1)"],
      "a set of traffic lights": ["Single function: sequencing the signals (1); reliable because the same fixed program runs all day (1); low power suits outdoor, always-on use (1)"],
      "a microwave oven": ["Single function: controlling the heating cycle (1); cheap embedded system keeps the price of the product low (1); ROM means the program is kept when unplugged (1)"],
      "a car's anti-lock braking system": ["Single function: stopping the wheels locking (1); must be very reliable because failure affects safety (1); small, so it fits within the braking system (1)"],
      "a pacemaker": ["Single function: regulating the heartbeat (1); must be extremely reliable because failure is life-threatening (1); low power so the battery lasts as long as possible inside the body (1)"],
    },
    modelAnswer: "The device does **one dedicated job**, so **an embedded system with one fixed program is enough**. An embedded system is **low cost, low power and reliable**, which suits this device because it runs the same program all the time and needs no more hardware than that job requires.",
  },
  {
    id: "x7", specTag: "1.1.3-R1", format: "scenario", marks: 4,
    prompt: "A company is designing {context}. Discuss whether an embedded system or a general-purpose computer would be more appropriate.",
    contexts: [
      "a new smart thermostat for home heating",
      "a handheld barcode scanner for a warehouse",
      "a machine that automatically inspects products on a factory line",
      "a device worn by athletes to monitor heart rate and GPS position",
    ],
    hint: "Consider the device's function, cost, power and size, then reach a judgement.",
    markScheme: [
      "The device has a specific, limited function that suits an embedded system (1)",
      "An advantage of an embedded system for this device, e.g. low cost, low power, small (1)",
      "A reason a general-purpose computer might be considered instead (e.g. it can run many programs and be updated) (1)",
      "A justified conclusion about which is more appropriate (1)",
    ],
    modelAnswer: "The device has **one specific job**, which suits **an embedded system**: it is **low cost, low power and small**, and it needs only one fixed program. **A general-purpose computer could run many programs and be reprogrammed easily, but it would be more expensive, use more power and be larger than the job needs.** So **an embedded system is more appropriate**.",
  },
  {
    id: "x8", specTag: "1.1.3-R2", format: "extended", marks: 6,
    prompt: "A manufacturer is deciding whether a new dishwasher should be controlled by an embedded system or by a general-purpose computer such as a small laptop-style PC. Discuss which the manufacturer should choose.",
    hint: "Cover the characteristics of each, link them to the dishwasher, then reach a conclusion.",
    markScheme: [
      "A dishwasher has one dedicated function (washing in a fixed sequence of stages), which suits an embedded system (1)",
      "An embedded system is low cost, which keeps the price of the dishwasher down (1)",
      "An embedded system is low power / small, so it needs little electricity and fits inside the machine (1)",
      "Its program is stored in ROM, so it is kept when switched off and cannot easily be overwritten (1)",
      "A general-purpose computer can run many programs, but the dishwasher does not need that flexibility, and it would cost more and use more power (1)",
      "A justified conclusion that an embedded system is the better choice (1)",
    ],
    modelAnswer: "**A dishwasher has one dedicated function: running a fixed sequence of washing stages**, so **an embedded system is a good fit.** **An embedded system is low cost, which keeps the price of the dishwasher down, and it is low power and small, so it fits inside the machine.** **Its program is stored in ROM, so it is kept when the dishwasher is switched off and cannot easily be overwritten.** **A general-purpose computer can run many different programs, but a dishwasher never needs that flexibility, and the computer would cost more and use more power.** **So the manufacturer should choose an embedded system.**",
  },
  // ── beyond spec ─────────────────────────────────────────────────────────────
  {
    id: "x9", specTag: "1.1.3-R2", beyondSpec: true, format: "extended", marks: 6,
    prompt: "Evaluate the use of a real-time operating system (RTOS) in {context}.",
    contexts: ["a pacemaker", "an aircraft autopilot", "a car's anti-lock braking system"],
    hint: "Say what an RTOS guarantees, why that matters here, a drawback, then a judgement.",
    markScheme: [
      "An RTOS guarantees a response within a fixed time (1)",
      "A delayed response in this device could be dangerous (1)",
      "A second advantage, e.g. consistent, predictable behaviour (1)",
      "A limitation or cost, e.g. harder and more expensive to develop and test (1)",
      "Recognises the trade-off may be justified by the safety requirement (1)",
      "A reasoned conclusion, not just restated points (1)",
    ],
    modelNotes: {
      "a pacemaker": ["Guarantees the response time (1); a late heartbeat could be fatal (1); predictable behaviour (1); costly to develop and certify (1); safety justifies the cost (1); clearly appropriate (1)"],
      "an aircraft autopilot": ["Guarantees the response time (1); a late response could lose the aircraft (1); handles many sensor inputs predictably (1); complex to certify (1); safety justifies the cost (1); essential here (1)"],
      "a car's anti-lock braking system": ["Guarantees braking response within milliseconds (1); a late response at speed could cause a crash (1); behaves consistently in all conditions (1); adds development cost (1); safety standards require it (1); clearly justified (1)"],
    },
    modelAnswer: "**An RTOS guarantees a response within a fixed time.** In this kind of device, **a delayed response could be dangerous**, so **predictable, consistent behaviour matters.** **The drawback is that it is harder and more expensive to develop and test.** **Because of the safety risk, that cost is justified**, so **using an RTOS is appropriate.**",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SYNOPTIC QUESTIONS — span sub-topics, with per-tag mark attribution. Every
// attributed tag is declared in SPEC_DESCRIPTIONS (the validator checks these).
// ─────────────────────────────────────────────────────────────────────────────

const SYNOPTIC_QUESTIONS: SynopticQuestion[] = [
  {
    id: "s1", specTags: ["1.1.3", "1.2.1"] as SpecTag[], format: "short", marks: 3,
    prompt: "An embedded system stores its program in ROM rather than RAM. Explain why.",
    hint: "Link what the program needs (1.1.3) to how ROM and RAM differ (1.2.1).",
    markScheme: [
      { tag: "1.1.3-R2", points: [
        "An embedded system runs one fixed program all the time, which must not be lost or changed by accident (1)",
      ]},
      { tag: "1.2.1", points: [
        "ROM is non-volatile, so it keeps its contents with the power off (1)",
        "RAM is volatile, so the program would be lost whenever the power went off (1)",
      ]},
    ],
    modelAnswer: "**An embedded system runs one fixed program that must not be lost.** **ROM is non-volatile, so the program is kept when the power is off**, whereas **RAM is volatile and would lose the program every time it was switched off.**",
  },
  {
    id: "s2", specTags: ["1.1.1", "1.1.3"] as SpecTag[], format: "short", marks: 3,
    prompt: "The controller in a washing machine contains a CPU. Explain how this CPU carries out the program and why the CPU can be simple.",
    hint: "Link the fetch-decode-execute cycle (1.1.1) to the one dedicated function (1.1.3).",
    markScheme: [
      { tag: "1.1.1", points: [
        "The CPU fetches each instruction of the program from memory, decodes it and executes it (the fetch-decode-execute cycle) (1)",
      ]},
      { tag: "1.1.3-R1", points: [
        "The system has only one dedicated function, so only one fixed program is run (1)",
      ]},
      { tag: "1.1.3-R2", points: [
        "So a simple, low-cost, low-power CPU is enough (1)",
      ]},
    ],
    modelAnswer: "**The CPU fetches each instruction from memory, decodes it and executes it, repeating the fetch-decode-execute cycle.** **Because the washing machine has only one dedicated function and runs one fixed program**, **a simple, low-cost, low-power CPU is enough.**",
  },
  {
    id: "s3", specTags: ["1.1.2", "1.1.3"] as SpecTag[], format: "short", marks: 3,
    prompt: "A smart thermostat uses a CPU with a low clock speed and one core. Explain why this suits an embedded system.",
    hint: "Link clock speed and cores (1.1.2) to what an embedded system needs (1.1.3).",
    markScheme: [
      { tag: "1.1.2", points: [
        "A lower clock speed and fewer cores use less power and give off less heat (1)",
      ]},
      { tag: "1.1.3-R2", points: [
        "Embedded systems need to be low cost, low power and small (1)",
        "One dedicated job needs little processing power, so the performance is still enough (1)",
      ]},
    ],
    modelAnswer: "**A low clock speed and a single core use less power and give off less heat**, which suits **an embedded system that must be low cost, low power and small.** **Its one dedicated job needs little processing power**, so **the performance is still enough.**",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LESSONS — Learn mode: taught, stepped walkthroughs. The first uses one focused
// diagram (an embedded controller in a washing machine); the rest reason across
// examples and so are deliberately diagram-free (kind: "text").
// ─────────────────────────────────────────────────────────────────────────────

const LESSONS: Lesson[] = [
  {
    id: "what", title: "What is an embedded system?", specTags: ["1.1.3-R1"], scene: "washer",
    analogy: "Think of a washing machine's brain: a tiny computer that does one thing — run the wash — and never needs to do anything else.",
    steps: [
      { text: "An **embedded system** is a computer **built into a larger device** to carry out **one dedicated function**. Here the device is a washing machine.", highlight: ["cpu", "rom"] },
      { text: "The program is stored in **ROM**, and the **CPU** runs it, fetching and carrying out the instructions.", highlight: ["cpu", "rom"], flow: { from: "rom", to: "cpu", label: "program", kind: "data" } },
      { text: "**Inputs** (buttons, a water-level sensor) tell the CPU what is happening.", highlight: ["inputs", "cpu"], flow: { from: "inputs", to: "cpu", label: "water level", kind: "data" } },
      { predict: "Once the CPU has read the inputs, what does it do with the result?", text: "It switches the **outputs** — the motor, heater and pump — to carry out the next stage of the wash.", highlight: ["cpu", "outputs"], flow: { from: "cpu", to: "outputs", label: "start motor", kind: "data" } },
      { predict: "Could this same controller also be used to run a spreadsheet?", text: "No — it is built for one job and runs one fixed program. A **general-purpose computer** such as a laptop can run many different programs." },
    ],
  },
  {
    id: "characteristics", title: "Characteristics of embedded systems", specTags: ["1.1.3-R2"], kind: "text",
    analogy: "A kitchen timer, not a kitchen: it only needs what the one job needs.",
    steps: [
      { text: "Because an embedded system has **one dedicated function**, it only needs the hardware for that job — so it is usually **low cost**, **small** and **low power**." },
      { predict: "Why does low power matter for a pacemaker or a remote control?", text: "They run on batteries, so using less power makes the batteries last longer." },
      { text: "The same fixed program runs every time, so embedded systems are usually very **reliable**: there is less that can go wrong." },
      { predict: "The program is held in memory that must not be lost when the power goes off. Is that **RAM** or **ROM**?", text: "**ROM** — it is non-volatile, so the program is kept with the power off and cannot easily be overwritten. RAM is volatile." },
      { text: "Most embedded systems have no full screen or keyboard — only the few buttons, sensors or small display the job needs." },
    ],
  },
  {
    id: "examples", title: "Examples of embedded systems", specTags: ["1.1.3-R3"], kind: "text",
    steps: [
      { text: "In the **home**: washing machines, microwave ovens, central-heating controllers and smart thermostats, television remote controls." },
      { text: "In **vehicles**: engine management, anti-lock braking, airbag control and cruise control. A car may contain dozens of embedded systems." },
      { text: "In **public places and medicine**: traffic lights, ticket machines, and pacemakers, where reliability is critical." },
      { predict: "Is a laptop an embedded system?", text: "No — it is a general-purpose computer that runs many different programs. 'Embedded' means built into a larger device for one dedicated function." },
      { predict: "Does 'embedded' mean the device has to be tiny?", text: "No — an aircraft or a factory machine can contain many embedded systems. It is about being built in for one job, not about size." },
    ],
  },
  {
    id: "choose", title: "Embedded or general-purpose?", specTags: ["1.1.3-R1", "1.1.3-R2"], kind: "text",
    analogy: "A Swiss Army knife can do lots of jobs; a bottle opener does one job cheaply and never breaks.",
    steps: [
      { text: "To decide, ask: does the device have **one fixed job**? If so, an **embedded system** is usually the better choice." },
      { predict: "A dishwasher has one fixed sequence of stages. Embedded or general-purpose?", text: "Embedded: low cost, low power, small, reliable, and the program never needs to change." },
      { predict: "A school needs one machine to run a spreadsheet, a web browser and a drawing package. Embedded or general-purpose?", text: "General-purpose: it must run many different programs, so a fixed embedded program is no use." },
      { text: "In an exam, name the **dedicated function**, give **one advantage** that matters for that device, and **link** them." },
    ],
  },
];

// ── Embedded-system representation as data (see docs/architecture/CS_SHELL_PLAN.md) ──────────────
// One focused box schematic: inputs → CPU (with its ROM program) → outputs, all inside the
// device. Reuses the existing schematic representation — no new renderer.
const ROLE_COLOR: Record<string, string> = { core: "#2563eb", mem: "#475569", io: "#d97706", data: "#059669", addr: "#2563eb", slow: "#d97706" };
const ROLE_TINT:  Record<string, string> = { core: "#dbeafe", mem: "#f1f5f9", io: "#fef3c7", data: "#d1fae5", addr: "#dbeafe", slow: "#fef3c7" };

const WASHER_SCHEMATIC: SchematicConfig = {
  viewBox: "0 0 440 224",
  maxWidth: 520,
  roleColor: ROLE_COLOR,
  roleTint: ROLE_TINT,
  nodes: [
    { id: "inputs",  x: 14,  y: 92,  w: 100, h: 56, label: "Inputs",       role: "io" },
    { id: "cpu",     x: 164, y: 64,  w: 112, h: 48, label: "CPU",          role: "core" },
    { id: "rom",     x: 164, y: 134, w: 112, h: 44, label: "ROM program",  role: "mem" },
    { id: "outputs", x: 326, y: 92,  w: 100, h: 56, label: "Outputs",      role: "io" },
  ],
  buses: [
    { x1: 114, y1: 120, x2: 164, y2: 88,  hotWhen: ["inputs", "cpu"] },
    { x1: 276, y1: 88,  x2: 326, y2: 120, hotWhen: ["cpu", "outputs"] },
    { x1: 220, y1: 112, x2: 220, y2: 134, hotWhen: ["rom", "cpu"] },
  ],
  containers: [
    { x: 4, y: 8, w: 432, h: 208, label: "Washing machine" },
    { x: 150, y: 30, w: 140, h: 160, dashed: true, label: "Embedded system" },
  ],
  texts: [
    { x: 64, y: 166, text: "buttons, sensors", size: 8.5, weight: 600 },
    { x: 376, y: 166, text: "motor, heater, pump", size: 8.5, weight: 600 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// INFO — the topic-info modal content.
// ─────────────────────────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  { title: "What's in scope (1.1.3)", items: [
    { label: "Purpose (R1)", detail: "An embedded system is a computer built into a larger device to carry out one dedicated function." },
    { label: "Characteristics (R2)", detail: "Low cost, low power, small and reliable, with a fixed program stored in ROM." },
    { label: "Examples (R3)", detail: "Washing machines, microwaves, thermostats, traffic lights, car braking and engine control, pacemakers — and being able to say why a laptop is not one." },
  ]},
  { title: "Beyond spec (toggle in menu)", items: [
    { label: "RTOS, firmware, microcontrollers", detail: "Real-time operating systems, firmware and microcontrollers are useful context but not required for 1.1.3. Kept out of default study, quiz and exam sessions; turn on 'Beyond spec' to include them, clearly flagged." },
  ]},
  { title: "How the modes differ", items: [
    { label: "Learn", detail: "Taught walkthroughs with predict-first prompts and one diagram of a washing machine's embedded controller. Start here." },
    { label: "Study", detail: "First-pass reading — recognition, low effort." },
    { label: "Flashcards", detail: "Active recall — answer before you flip. The core revision mode." },
    { label: "Quiz", detail: "MCQ warm-up, or Spot-the-Mistake to confront ideas like 'a laptop is an embedded system'." },
    { label: "Exam", detail: "Real J277 formats and tariffs, including a 6-mark discussion; self-mark against the scheme, reveal model answers, plus synoptic questions linking to 1.1.1, 1.1.2 and 1.2.1." },
  ]},
  { title: "Exam tip", items: [
    { label: "Key word: dedicated", detail: "Name the dedicated function, give one advantage that matters for that device, and link the two. Link ROM to non-volatile." },
  ]},
];

// ─────────────────────────────────────────────────────────────────────────────
// TOPIC — assemble all of the above into one CSTopic. The shell owns every piece of UI.
// ─────────────────────────────────────────────────────────────────────────────

const EMBEDDED_SYSTEMS: CSTopic = {
  id: "1.1.3",
  title: "Embedded Systems",
  specTags: SPEC_DESCRIPTIONS,
  glossary: GLOSSARY,
  lessons: LESSONS,
  scenes: { schematics: { washer: WASHER_SCHEMATIC } },
  cards: CARDS,
  cloze: CLOZE,
  myths: MYTHS,
  exam: EXAM_QUESTIONS,
  synoptic: SYNOPTIC_QUESTIONS,
  info: INFO_SECTIONS,
};

// Named export so the CSTopic validator (src/tests/cs-topics.test.ts) can discover
// and check this topic without rendering the shell — the CS analog of `__test`.
export const __topic = EMBEDDED_SYSTEMS;

export default function App() {
  return <CSShell topic={EMBEDDED_SYSTEMS} />;
}
