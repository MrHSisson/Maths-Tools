// Slide layouts: pre-arranged canvases a slide starts from. The built decks are written with them, the editor's
// "Add slide" offers them, and the Slide library (/decks/library) shows each one with its sample content.
// A layout only places ordinary elements: once made, every part of the slide can be moved, edited or deleted.
import type { BarModelData } from "../shared/barModel";
import type { RatioTableSpec, BoardGrid, CuratedQuestion, DeckElement, DeckFamily, FillMode, GeneratorPreset, Slide } from "./types";

export const INK = "#0f172a";
const MUTED = "#64748b";
const VIOLET = "#6d28d9";

type NoId<T> = T extends unknown ? Omit<T, "id"> : never;
/** Gives each element a stable id inside its slide. */
const make = (id: string, family: DeckFamily, title: string, els: NoId<DeckElement>[]): Slide =>
  ({ id, family, title, els: els.map((e, i) => ({ ...e, id: `${id}-${i + 1}` }) as DeckElement) });

const text = (x: number, y: number, w: number, h: number, t: string, size: number, more: Partial<Extract<DeckElement, { kind: "text" }>> = {}): NoId<DeckElement> =>
  ({ kind: "text", x, y, w, h, text: t, size, colour: INK, ...more });
const bullets = (items: string[]) => items.map((s) => `•  ${s}`).join("\n");

export const titleSlide = (id: string, title = "Estimation", subtitle = "Round first, then calculate") =>
  make(id, "structure", title, [
    text(100, 290, 1400, 170, title, 120, { bold: true, align: "center", middle: true }),
    ...(subtitle ? [text(100, 480, 1400, 90, subtitle, 56, { colour: MUTED, align: "center" })] : []),
  ]);

export const dividerSlide = (id: string, title = "Section title", subtitle = "") =>
  make(id, "structure", title, [
    text(100, 330, 1400, 150, title, 96, { bold: true, align: "center", middle: true }),
    ...(subtitle ? [text(100, 500, 1400, 80, subtitle, 48, { colour: MUTED, align: "center" })] : []),
  ]);

export const objectiveSlide = (id: string, objective = "Estimate the answer to a calculation by rounding each number to 1 significant figure.",
  success: string[] = ["Round a number to 1 significant figure", "Calculate with the rounded numbers"]) =>
  make(id, "structure", "Learning objective", [
    text(100, 100, 1400, 50, "LEARNING OBJECTIVE", 30, { bold: true, colour: MUTED }),
    text(100, 170, 1400, 230, objective, 60, { bold: true }),
    ...(success.length ? [text(100, 440, 1400, 380, bullets(success), 44, { colour: "#334155" })] : []),
  ]);

export const plenarySlide = (id: string, title = "Summary", points: string[] = ["First key point.", "Second key point.", "Third key point."]) =>
  make(id, "structure", title, [
    text(100, 100, 1400, 110, title, 72, { bold: true }),
    text(100, 260, 1400, 560, bullets(points), 50),
  ]);

export const vocabSlide = (id: string, terms: { term: string; meaning: string }[] = [
  { term: "Term", meaning: "What the word means, in formal wording a student can copy." },
  { term: "Another term", meaning: "Its meaning." },
], title = "Key vocabulary") =>
  make(id, "language", title, [
    text(100, 80, 1400, 110, title, 72, { bold: true }),
    ...terms.slice(0, 4).flatMap((t, i) => [
      text(100, 230 + i * 165, 380, 150, t.term, 44, { bold: true, colour: VIOLET }),
      text(510, 230 + i * 165, 990, 150, t.meaning, 40),
    ]),
  ]);

export const definitionSlide = (id: string, term = "Term", definition = "The definition, in formal non-contracted language suitable for copying.") =>
  make(id, "language", term, [
    text(100, 120, 1400, 50, "KEY DEFINITION", 30, { bold: true, colour: VIOLET }),
    text(100, 190, 1400, 140, term, 96, { bold: true }),
    text(100, 370, 1400, 420, definition, 52),
  ]);

export const twoColumnSlide = (id: string, title = "Title", left = "Left-hand text.", right = "Right-hand text.") =>
  make(id, "teach", title, [
    text(100, 80, 1400, 110, title, 64, { bold: true }),
    text(100, 230, 670, 590, left, 44),
    text(830, 230, 670, 590, right, 44),
  ]);

export const boardSlide = (id: string, title = "Board title", prompt = "A prompt for the class.",
  grid: BoardGrid = { head: ["Given", "Answer"], given: 1, rows: [["$48$", "$50$"], ["$0.39$", "$0.4$"], ["$794$", "$800$"]] }, fill: FillMode = "structure") =>
  make(id, "teach", title, [
    text(100, 60, 1400, 100, title, 64, { bold: true }),
    ...(prompt ? [text(100, 165, 1400, 60, prompt, 40, { colour: MUTED })] : []),
    { kind: "board", x: 100, y: 250, w: 1400, h: Math.min(600, (grid.rows.length + 1) * 105), grid, fill, size: 46 },
  ]);

/** A ratio table to model on: headings, a row per step and the factor between rows. Click-by-click with `staged`. */
export const ratioTableSlide = (id: string, title = "Ratio table", prompt = "", table: RatioTableSpec = { headers: ["Red", "Blue"], given: 1, rows: [["3", "2"], ["6", "4"], ["12", "8"]], operations: ["\\times 2", "\\times 2"] },
  fill: FillMode = "structure", staged = false) =>
  make(id, "teach", title, [
    text(100, 60, 1400, 100, title, 64, { bold: true }),
    ...(prompt ? [text(100, 165, 1400, 60, prompt, 40, { colour: MUTED })] : []),
    { kind: "ratioTable", x: 200, y: prompt ? 250 : 190, w: 1200, h: prompt ? 580 : 640, table, fill, size: 60, ...(staged ? { staged } : {}) },
  ]);

/** A starter in the usual fashion: four numbered boxes in a 2 × 2 grid, to be written in by hand (the editor's Pen) or typed into. The boxes
 *  are ordinary shapes and text, so they can be moved, resized or removed. */
export const starterSlide = (id: string, title = "Starter") =>
  make(id, "retrieval", title, [
    text(60, 22, 600, 44, "STARTER", 28, { bold: true, colour: MUTED }),
    ...[0, 1, 2, 3].flatMap((i) => {
      const x = 60 + (i % 2) * 750, y = 84 + Math.floor(i / 2) * 400;
      return [
        { kind: "shape", x, y, w: 730, h: 380, shape: "rect", stroke: "#cbd5e1", strokeWidth: 4, radius: 24 } as NoId<DeckElement>,
        text(x + 24, y + 14, 80, 56, String(i + 1), 40, { bold: true, colour: "#94a3b8" }),
      ];
    }),
  ]);

/** The 1 to 100 grid to tap on, or the finished sieve built a click at a time (`staged`, Filled in). Printing it is a button in the player. */
export const numberGridSlide = (id: string, title = "The sieve of Eratosthenes", prompt = "", fill: FillMode = "structure", staged = false) =>
  make(id, "teach", title, [
    text(70, 70, 620, 260, title, 64, { bold: true }),
    ...(prompt ? [text(70, 360, 620, 420, prompt, 42, { colour: MUTED })] : []),
    { kind: "numberGrid", x: 720, y: 50, w: 860, h: 820, fill, ...(staged ? { staged } : {}) },
  ]);

/** The ratio look (Ratio Sharing's): a row per quantity, aligned from the left, with a brace across the rows for the total. */
const RATIO_BAR: BarModelData = { parts: [], rows: [{ name: "Red", units: 3 }, { name: "Blue", units: 2 }], sideBrace: { label: "total: 5 parts" } };

/** A bar model to model on: boxes in coloured parts, braces for parts and total. */
export const barSlide = (id: string, title = "Bar model", prompt = "", bar: BarModelData = RATIO_BAR,
  fill: FillMode = "structure", staged = false) =>
  make(id, "teach", title, [
    text(100, 60, 1400, 100, title, 64, { bold: true }),
    ...(prompt ? [text(100, 165, 1400, 60, prompt, 40, { colour: MUTED })] : []),
    { kind: "bar", x: 100, y: prompt ? 260 : 200, w: 1400, h: prompt ? 560 : 620, bar, fill, size: 72, ...(staged ? { staged } : {}) },
  ]);

/** A worksheet pinned to the lesson: the cue to hand the sheet out, and its answers on a click. The sheet itself prints from File → Worksheets. */
export const pinnedSheetSlide = (id: string, tool = "estimation", preset: GeneratorPreset = { sub: "estimation", level: "level1" }, count = 12, cols = 2, title = "Worksheet", seed = 1) =>
  make(id, "practice", title, [
    text(100, 50, 1400, 100, title, 64, { bold: true }),
    text(100, 150, 1400, 56, "Hand out the worksheet. Press A for the answers.", 36, { colour: MUTED }),
    { kind: "worksheet", x: 100, y: 230, w: 1400, h: 630, tool, preset, count, cols, seed, view: "key", pin: { title, paper: "A5", layout: "grid", borders: true, fontPx: 16 } },
  ]);

export const practiceSlide = (id: string, tool = "estimation", intention = "estimation-calc-zeros", bank: string[] = ["est-01", "est-05", "est-15", "est-16", "est-17"],
  generator: GeneratorPreset | undefined = { level: "level1", multiSelect: { add: false, subtract: false, multiply: true, divide: false } }, prompt = "Estimate.", title = "Practice") =>
  make(id, "practice", title, [
    { kind: "practice", x: 100, y: 70, w: 1400, h: 780, tool, intention, bank, generator, prompt, size: 120 },
  ]);


/** Fixed, slide-owned skill questions. No library registration or generator fallback. */
export const skillSlide = (id: string, title = "Skill practice", items: CuratedQuestion[] = []) =>
  make(id, "practice", title, [{ kind: "questions", x: 24, y: 24, w: 1552, h: 852, size: 46, items: structuredClone(items) }]);

export const depthSlide = (id: string, tool = "estimation", item = "est-who-l1", title = "Depth") =>
  make(id, "depth", title, [{ kind: "depth", x: 24, y: 24, w: 1552, h: 852, tool, item }]);

const PINK = "#be185d";
/** The split discussion: a fixed click order (prompt, then the key point, then the question, then its answer), so the
 *  question never shows before the class has talked. */
export const discussionSlide = (id: string, prompt = "Look at $0.039$. Which digit is the first significant figure? Is it the $0$? How do you know?",
  keyPoint = "The first significant figure is the first digit that is not zero. The zeros before it only hold the place.", question = "Round $0.039$ to 1 significant figure.", answer = "0.04") =>
  make(id, "discussion", "Discuss", [
    text(100, 100, 660, 50, "DISCUSS", 30, { bold: true, colour: PINK }),
    text(100, 170, 660, 300, prompt, 48),
    { kind: "line", x: 800, y: 100, w: 0, h: 720, colour: "#e2e8f0", width: 4 },
    text(100, 520, 660, 50, "KEY POINT", 30, { bold: true, colour: MUTED, step: 1 }),
    text(100, 580, 660, 260, keyPoint, 44, { bold: true, step: 1 }),
    text(860, 100, 640, 50, "QUESTION", 30, { bold: true, colour: MUTED, step: 2 }),
    text(860, 170, 640, 260, question, 52, { step: 2 }),
    text(860, 520, 640, 50, "ANSWER", 30, { bold: true, colour: MUTED, step: 3 }),
    { kind: "maths", x: 860, y: 580, w: 640, h: 200, latex: answer, size: 96, colour: "#1e3a8a", align: "left", step: 3 },
  ]);

/** A block of hand-picked questions for mini whiteboards, a retrieval starter or an exit ticket. */
export const gridSlide = (id: string, title = "Quickfire", bank: string[] = [], cols = 2,
  family: DeckFamily = "practice", subtitle = "") =>
  make(id, family, title, [
    text(100, 60, 1400, 100, title, 64, { bold: true }),
    ...(subtitle ? [text(100, 160, 1400, 50, subtitle, 34, { colour: MUTED })] : []),
    { kind: "grid", x: 100, y: subtitle ? 230 : 190, w: 1400, h: subtitle ? 620 : 660, bank, cols },
  ]);

/** Book work: numbered questions to copy into books, filling the slide. No title: the more room the better for projecting. Only an
 *  instruction the pupils need ("Copy into books and simplify") goes above the grid. */
export const bookWorkSlide = (id: string, items: CuratedQuestion[] = [], cols = 3, instruction = "", title = "Book work") =>
  make(id, "retrieval", title, [
    ...(instruction ? [text(60, 46, 1480, 64, instruction, 38, { colour: MUTED })] : []),
    { kind: "grid", x: 60, y: instruction ? 124 : 46, w: 1480, h: instruction ? 748 : 826, bank: [], items: structuredClone(items), cols },
  ]);

/** The tool's generator running live, like its Whiteboard: preset level and options, New question, step-by-step working. */
export const generatorSlide = (id: string, tool = "estimation", preset: GeneratorPreset = { sub: "estimation", level: "level1" }, title = "Whiteboards", seed = 1) =>
  make(id, "practice", title, [{ kind: "generator", x: 24, y: 24, w: 1552, h: 852, tool, preset, seed }]);

/** Whiteboard layout: generated question and vertical solution on the left, writing/camera on the right. */
export const whiteboardSlide = (id: string, tool = "estimation", preset: GeneratorPreset = { sub: "estimation", level: "level1" }, title = "Whiteboard", seed = 1): Slide => ({
  ...generatorSlide(id, tool, preset, title, seed),
  els: [{ id: `${id}-1`, kind: "generator", x: 24, y: 24, w: 1552, h: 852, tool, preset, seed, presentation: "whiteboard", visualiser: true }],
});

/** A book activity: a numbered set of generated questions to copy and answer. */
export const worksheetSlide = (id: string, tool = "estimation", preset: GeneratorPreset = { sub: "estimation", level: "level1" }, count = 12, cols = 3, title = "Book activity", seed = 1) =>
  make(id, "practice", title, [
    text(100, 50, 1400, 100, title, 64, { bold: true }),
    { kind: "worksheet", x: 100, y: 170, w: 1400, h: 690, tool, preset, count, cols, seed },
  ]);

const blankSlide = (id: string) => make(id, "teach", "Blank", []);

/** Every layout, with its sample content and when to reach for it. */
export const LAYOUTS: { key: string; label: string; family: DeckFamily; group?: "Questions"; use: string; make: (id: string) => Slide }[] = [
  { key: "title", label: "Title", family: "structure", use: "The first slide: the lesson's name and a short subtitle.", make: (id) => titleSlide(id) },
  { key: "objective", label: "Learning objective", family: "structure", use: "What the class will be able to do, with success criteria.", make: (id) => objectiveSlide(id) },
  { key: "divider", label: "Section divider", family: "structure", use: "Marks a new part of the lesson.", make: (id) => dividerSlide(id) },
  { key: "plenary", label: "Summary", family: "structure", use: "The key points to take away, at the end or between sections.", make: (id) => plenarySlide(id) },
  { key: "vocab", label: "Key vocabulary", family: "language", use: "Up to four words and their meanings.", make: (id) => vocabSlide(id) },
  { key: "definition", label: "Key definition", family: "language", use: "One definition to copy, in formal wording.", make: (id) => definitionSlide(id) },
  { key: "two-column", label: "Two columns", family: "teach", use: "Compare two things side by side, or text beside a picture.", make: (id) => twoColumnSlide(id) },
  { key: "board", label: "Board", family: "teach", use: "A table to fill in live, with Filled in / Structure only / Blank.", make: (id) => boardSlide(id) },
  { key: "starter", label: "Starter (2 × 2)", family: "retrieval", use: "Four numbered boxes in a 2 × 2 grid for a starter: write in them with the Pen or type. Add a timer line along the bottom if the slide has one.", make: (id) => starterSlide(id) },
  { key: "number-grid", label: "Number grid (1 to 100)", family: "teach", use: "The 1 to 100 grid: tap to scribble in a prime's colour and finish a times table in one click, or the finished sieve built a click at a time. Printable.", make: (id) => numberGridSlide(id) },
  { key: "ratio-table", label: "Ratio table", family: "teach", use: "A ratio table to model on: headings, a row per step and the factor between rows; Filled in / Structure only / Blank, or one row per click.", make: (id) => ratioTableSlide(id) },
  { key: "bar-model", label: "Bar model", family: "teach", use: "Boxes in coloured parts with braces for the parts and the total; Filled in / Structure only / Blank, or one step per click.", make: (id) => barSlide(id) },
  { key: "practice", group: "Questions", label: "Fixed question set", family: "practice", use: "Write a set of questions for this slide’s skill, with answers and generator-consistent working.", make: (id) => skillSlide(id) },
  { key: "generator", group: "Questions", label: "Live generator", family: "practice", use: "The tool's generator live, like the Whiteboard: set the level and options; New question, the answer and the working step by step.", make: (id) => generatorSlide(id) },
  { key: "worksheet", label: "Worksheet", family: "practice", use: "A worksheet to print (A5, with an answer sheet) and hand out: the slide shows its answers on a click. Pin up to three per lesson.", make: (id) => pinnedSheetSlide(id) },
  { key: "book", label: "Book activity", family: "practice", use: "A numbered set of generated questions for books, answers on demand and a new set.", make: (id) => worksheetSlide(id) },
  { key: "quickfire", label: "Quickfire block", family: "practice", use: "Four (or more) hand-picked questions for mini whiteboards; answers on demand.", make: (id) => gridSlide(id) },
  { key: "depth", label: "Depth card", family: "depth", use: "Choose a Depth card with its diagnostic interactions and diagrams.", make: (id) => depthSlide(id) },
  { key: "discussion", label: "Split discussion", family: "discussion", use: "Discuss first; then, one click at a time, the key point, the question and its answer.", make: (id) => discussionSlide(id) },
  { key: "retrieval", label: "Retrieval starter", family: "retrieval", use: "Questions from earlier lessons to start with; answers on demand.", make: (id) => gridSlide(id, "Retrieval starter", [], 2, "retrieval", "From earlier lessons") },
  { key: "exit", label: "Exit ticket", family: "retrieval", use: "Three questions to finish: one answer each on a slip or whiteboard.", make: (id) => gridSlide(id, "Exit ticket", [], 3, "retrieval") },
  { key: "blank", label: "Blank", family: "teach", use: "An empty canvas to build on.", make: (id) => blankSlide(id) },
];

/** Integrated pieces still to come (shown greyed in the library so it doubles as the plan). */
export const PLANNED: { label: string; family: string; use: string }[] = [
  { label: "More core representations", family: "Teach", use: "Place value table, number line, area model, algebra tiles, counters and prime factor tiles, each with a blank state (ratio table and bar model are built)." },
  { label: "Timer", family: "Discussion", use: "A visible think-pair-share timer." },
  { label: "Match-up and sort", family: "Depth", use: "Cards to match or sort, dragged live." },
];
