// Slide layouts: pre-arranged canvases a slide starts from. The built decks are written with them, the editor's
// "Add slide" offers them, and the Slide library (/decks/library) shows each one with its sample content.
// A layout only places ordinary elements: once made, every part of the slide can be moved, edited or deleted.
import type { BoardGrid, DeckElement, DeckFamily, FillMode, GeneratorPreset, Slide } from "./types";

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

const twoColumnSlide = (id: string, title = "Title", left = "Left-hand text.", right = "Right-hand text.") =>
  make(id, "teach", title, [
    text(100, 80, 1400, 110, title, 64, { bold: true }),
    text(100, 230, 670, 590, left, 44),
    text(830, 230, 670, 590, right, 44),
  ]);

export const boardSlide = (id: string, title = "Board title", prompt = "A prompt for the class.",
  grid: BoardGrid = { head: ["Given", "Answer"], given: 1, rows: [["$48$", "$50$"], ["$0.39$", "$0.4$"], ["$794$", "$800$"]] }, fill: FillMode = "blank") =>
  make(id, "teach", title, [
    text(100, 60, 1050, 100, title, 64, { bold: true }),
    ...(prompt ? [text(100, 165, 1000, 60, prompt, 40, { colour: MUTED })] : []),
    { kind: "board", x: 100, y: 250, w: 1400, h: Math.min(600, (grid.rows.length + 1) * 105), grid, fill, size: 46 },
  ]);

export const practiceSlide = (id: string, tool = "estimation", intention = "estimation-calc-zeros", bank: string[] = ["est-01", "est-05"],
  generator: GeneratorPreset | undefined = { level: "level1", multiSelect: { add: false, subtract: false, multiply: true, divide: false } }, prompt = "Estimate.", title = "Practice") =>
  make(id, "practice", title, [
    { kind: "practice", x: 100, y: 70, w: 1400, h: 780, tool, intention, bank, generator, prompt, size: 120 },
  ]);

export const depthSlide = (id: string, tool = "estimation", item = "est-who-48x31", title = "Depth") =>
  make(id, "depth", title, [{ kind: "depth", x: 100, y: 60, w: 1400, h: 790, tool, item }]);

const PINK = "#be185d";
/** The split discussion: a fixed click order (prompt, then the key point, then the question, then its answer), so the
 *  question never shows before the class has talked. */
export const discussionSlide = (id: string, prompt = "Is $0.39$ nearer to $0$ or to $1$? How do you know?",
  keyPoint = "The first significant figure is the first digit that is not zero.", question = "Round $0.39$ to 1 significant figure.", answer = "0.4") =>
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
export const gridSlide = (id: string, title = "Quickfire", bank: string[] = ["est-01", "est-02", "est-03", "est-04"], cols = 2,
  family: DeckFamily = "practice", subtitle = "") =>
  make(id, family, title, [
    text(100, 60, 1400, 100, title, 64, { bold: true }),
    ...(subtitle ? [text(100, 160, 1400, 50, subtitle, 34, { colour: MUTED })] : []),
    { kind: "grid", x: 100, y: subtitle ? 230 : 190, w: 1400, h: subtitle ? 620 : 660, bank, cols },
  ]);

const blankSlide = (id: string) => make(id, "teach", "Blank", []);

/** Every layout, with its sample content and when to reach for it. */
export const LAYOUTS: { key: string; label: string; family: DeckFamily; use: string; make: (id: string) => Slide }[] = [
  { key: "title", label: "Title", family: "structure", use: "The first slide: the lesson's name and a short subtitle.", make: (id) => titleSlide(id) },
  { key: "objective", label: "Learning objective", family: "structure", use: "What the class will be able to do, with success criteria.", make: (id) => objectiveSlide(id) },
  { key: "divider", label: "Section divider", family: "structure", use: "Marks a new part of the lesson.", make: (id) => dividerSlide(id) },
  { key: "plenary", label: "Summary", family: "structure", use: "The key points to take away, at the end or between sections.", make: (id) => plenarySlide(id) },
  { key: "vocab", label: "Key vocabulary", family: "language", use: "Up to four words and their meanings.", make: (id) => vocabSlide(id) },
  { key: "definition", label: "Key definition", family: "language", use: "One definition to copy, in formal wording.", make: (id) => definitionSlide(id) },
  { key: "two-column", label: "Two columns", family: "teach", use: "Compare two things side by side, or text beside a picture.", make: (id) => twoColumnSlide(id) },
  { key: "board", label: "Board", family: "teach", use: "A table to fill in live, with Filled in / Structure only / Blank.", make: (id) => boardSlide(id) },
  { key: "practice", label: "Practice question", family: "practice", use: "One question aimed at one misconception; another question, answer and working on demand.", make: (id) => practiceSlide(id) },
  { key: "quickfire", label: "Quickfire block", family: "practice", use: "Four (or more) hand-picked questions for mini whiteboards; answers on demand.", make: (id) => gridSlide(id) },
  { key: "depth", label: "Depth question", family: "depth", use: "One of the tool's Depth items: who is right, spot the mistake, always / sometimes / never.", make: (id) => depthSlide(id) },
  { key: "discussion", label: "Split discussion", family: "discussion", use: "Discuss first; then, one click at a time, the key point, the question and its answer.", make: (id) => discussionSlide(id) },
  { key: "retrieval", label: "Retrieval starter", family: "retrieval", use: "Questions from earlier lessons to start with; answers on demand.", make: (id) => gridSlide(id, "Retrieval starter", ["est-01", "est-07", "est-12", "est-04"], 2, "retrieval", "From earlier lessons") },
  { key: "exit", label: "Exit ticket", family: "retrieval", use: "Three questions to finish: one answer each on a slip or whiteboard.", make: (id) => gridSlide(id, "Exit ticket", ["est-06", "est-11", "est-14"], 3, "retrieval") },
  { key: "blank", label: "Blank", family: "teach", use: "An empty canvas to build on.", make: (id) => blankSlide(id) },
];

/** Integrated pieces still to come (shown greyed in the library so it doubles as the plan). */
export const PLANNED: { label: string; family: string; use: string }[] = [
  { label: "Core representations", family: "Teach", use: "Ratio table, place value table, bar model and the rest, each with a blank state." },
  { label: "Timer", family: "Discussion", use: "A visible think-pair-share timer." },
  { label: "Match-up and sort", family: "Depth", use: "Cards to match or sort, dragged live." },
];
