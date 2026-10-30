// Building a deck from a short script: the slide kinds, and question builders that write the working the way the tool
// does and check it against an independent calculation. A build script default-exports a function returning a deck
// (`npm run deck -- build <script>`); `buildDeck` makes it a deck the player opens and `deckChecks.ts` checks it.
import { roundEstimationOperand as sf1 } from "../shared/estimationWorking";
import { texNumber } from "../shared/math";
import { ALL_TOOLS } from "../registry";
import { barSlide, boardSlide, definitionSlide, depthSlide, discussionSlide, dividerSlide, gridSlide, objectiveSlide, plenarySlide, skillSlide, titleSlide, vocabSlide, ratioTableSlide, whiteboardSlide, worksheetSlide } from "./layouts";
import { materializeDeck, newQuestion } from "./questions";
import type { CuratedQuestion, DeckDef, GeneratorPreset, Slide } from "./types";

type Level = CuratedQuestion["level"];
type Op = "+" | "-" | "\\times" | "\\div";
type Mistake = { response: string; reasoning: string };
const calc = (a: number, op: Op, b: number) => (op === "+" ? a + b : op === "-" ? a - b : op === "\\times" ? a * b : a / b);
const num = (x: number) => String(Number(x.toPrecision(12)));

/** A side of a fraction: a number, or `[a, op, b]`. */
type Side = string | [string, Op, string];
const sideNumbers = (s: Side) => (typeof s === "string" ? [s] : [s[0], s[2]]);
const sideRaw = (s: Side) => (typeof s === "string" ? s : `${s[0]} ${s[1]} ${s[2]}`);
const sideValue = (s: Side, round: boolean) => { const r = (x: string) => (round ? sf1(Number(x)) : Number(x)); return typeof s === "string" ? r(s) : calc(r(s[0]), s[1], r(s[2])); };

export const Q = {
  /** Any question: one line of question, one of answer, one reveal per line of working. */
  open: (id: string, tool: string, level: Level, question: string, answer: string, explanation: string[] = [], mistakes: Mistake[] = []): CuratedQuestion =>
    ({ ...newQuestion(tool), id, title: question.replace(/\.$/, ""), level, format: "open", status: "ready", question: [question], answer: [answer], explanation, expectedErrors: mistakes }),

  /** "Round n to 1 significant figure", worked as the Rounding tool's digit rule: rounding digit and decider, the decider's verdict, the answer. */
  rounding: (id: string, n: string, level: Level, mistakes: Mistake[] = []): CuratedQuestion => {
    const digits = n.replace(".", ""), at = digits.search(/[1-9]/);
    const rd = digits[at], decider = Number(digits[at + 1] ?? "0"), up = decider >= 5;
    const answer = texNumber(Number(sf1(Number(n)).toPrecision(12))), shown = texNumber(Number(n));
    return Q.open(id, "rounding", level, `Round $${shown}$ to 1 significant figure.`, `$${answer}$`, [
      `The first significant figure is the first non-zero digit, so the rounding digit is $${rd}$ and the decider, the digit after it, is $${decider}$.`,
      `The decider is $${decider}$, which is ${up ? "$5$ or more, so round up" : "less than $5$, so round down"}: $${decider} ${up ? "\\ge" : "\\lt"} 5$`,
      `${up ? "Add 1 to the rounding digit and drop (or zero) everything after it:" : "Keep the rounding digit and drop (or zero) everything after it:"} $${answer}$`,
    ], mistakes);
  },

  /** "Estimate a op b", worked as the Estimation tool does. Each number is a string so 0.50 stays as typed. */
  estimate: (id: string, level: Level, a: string, op: Op, b: string, mistakes: Mistake[] = []): CuratedQuestion => {
    const ra = sf1(Number(a)), rb = sf1(Number(b)), value = num(calc(ra, op, rb)), answer = texNumber(Number(value));
    const original = `${a} ${op} ${b}`;
    return Q.open(id, "estimation", level, `Estimate: $${original}$`, `$\\approx ${answer}$`, [
      `Original: $${original}$`, `Round to 1 s.f.: $${a} \\to ${texNumber(ra)}, \\quad ${b} \\to ${texNumber(rb)}$`, `Calculate: $${texNumber(ra)} ${op} ${texNumber(rb)} = ${answer}$`,
    ], mistakes);
  },

  /** A fraction bar: numerator over denominator, each a number or `[a, op, b]`, with the tool's Numerator and Denominator steps. */
  fraction: (id: string, level: Level, top: Side, bottom: Side, mistakes: Mistake[] = []): CuratedQuestion => {
    const numeratorValue = sideValue(top, true), denominatorValue = sideValue(bottom, true), value = num(numeratorValue / denominatorValue);
    const wrap = (s: Side) => (typeof s === "string" ? s : `(${sideRaw(s)})`);
    const roundedSide = (s: Side) => (typeof s === "string" ? texNumber(sf1(Number(s))) : `(${texNumber(sf1(Number(s[0])))} ${s[1]} ${texNumber(sf1(Number(s[2])))})`);
    const rounding = [...sideNumbers(top), ...sideNumbers(bottom)].map((x) => `${x} \\to ${texNumber(sf1(Number(x)))}`).join(", \\;");
    const display = `\\dfrac{${sideRaw(top)}}{${sideRaw(bottom)}}`;
    return Q.open(id, "estimation", level, `Estimate: $${display}$`, `$\\approx ${texNumber(Number(value))}$`, [
      `Original: $\\dfrac{${wrap(top)}}{${wrap(bottom)}}$`, `Round to 1 s.f.: $${rounding}$`,
      ...(typeof top === "string" ? [] : [`Numerator: $${roundedSide(top)} = ${num(numeratorValue)}$`]),
      ...(typeof bottom === "string" ? [] : [`Denominator: $${roundedSide(bottom)} = ${num(denominatorValue)}$`]),
      `Calculate: $${num(numeratorValue)} \\div ${num(denominatorValue)} = ${texNumber(Number(value))}$`,
    ], mistakes);
  },
};

/** Slide kinds, each already laid out; Harry can move anything afterwards. */
export const S = {
  title: titleSlide, objective: objectiveSlide, vocab: vocabSlide, definition: definitionSlide, divider: dividerSlide, board: boardSlide, ratioTable: ratioTableSlide, bar: barSlide, discuss: discussionSlide, summary: plenarySlide,
  /** Deliberate practice: one authored set. */
  deliberate: (id: string, title: string, items: CuratedQuestion[], brief?: string): Slide => ({ ...skillSlide(id, title, items), ...(brief ? { brief } : {}) }),
  /** General practice: the tool's generator, Workspace right. */
  general: (id: string, title: string, tool: string, preset: GeneratorPreset, seed: number, brief?: string): Slide => ({ ...whiteboardSlide(id, tool, preset, title, seed), ...(brief ? { brief } : {}) }),
  /** A numbered set of generated questions to copy into books. */
  book: (id: string, title: string, tool: string, preset: GeneratorPreset, count: number, cols: number, seed: number, brief?: string): Slide => ({ ...worksheetSlide(id, tool, preset, count, cols, title, seed), ...(brief ? { brief } : {}) }),
  /** Several short questions at once: a starter, a recap or an exit ticket. */
  quick: (id: string, title: string, items: CuratedQuestion[], cols: number, subtitle = ""): Slide => {
    const slide = gridSlide(id, title, [], cols, "retrieval", subtitle);
    return { ...slide, els: slide.els.map((e) => (e.kind === "grid" ? { ...e, items } : e)) as Slide["els"] };
  },
  depth: depthSlide,
};

/** The deck the player opens: embedded questions (nothing left to look up) and the tool's page filled in. */
export async function buildDeck(def: Omit<DeckDef, "toolPath"> & { toolPath?: string }): Promise<DeckDef> {
  const toolPath = def.toolPath ?? (def.tool ? ALL_TOOLS.find((t) => t.id === def.tool)?.path : undefined);
  return materializeDeck({ ...def, ...(toolPath ? { toolPath } : {}) }, () => undefined);
}

