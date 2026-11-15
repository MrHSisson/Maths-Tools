// Build script for the "Sharing in a ratio" deck (plan: specs/decks/ratio-sharing.md; every question and its checks: specs/decks/ratio-sharing-sets.ts
// and src/tests/ratioSharingSets.test.ts; the table Harry read: specs/decks/ratio-sharing-questions.md).
//   npm run deck -- looks specs/decks/ratio-sharing.build.ts      the look card (one slide of each kind, every state; the repo is untouched)
//   npm run deck -- build specs/decks/ratio-sharing.build.ts --replace
//   npm run deck -- review ratio-sharing                         contact sheets of every slide: LOOK at them before showing the deck
import { Q, S, assertFreshNumbers, makeSlide, textEl } from "/src/decks/builder";
import { pinnedSheetSlide } from "/src/decks/layouts";
import { barStages } from "/src/shared/barModel";
import { gcdAll } from "/src/shared";
import { buildSharing, buildKnown, buildDifference, CONTEXTS } from "/src/tools/Proportion/ratioSharing";
import { ALL_SETS, type SetQuestion } from "/specs/decks/ratio-sharing-sets";
import type { CuratedQuestion, DeckElement, Slide } from "/src/decks/types";

const ID = "ratio-sharing";
const P = "rsh";
const T = "ratio-sharing";
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const must = (ok: boolean, msg: string) => { if (!ok) throw new Error(`plan check failed: ${msg}`); };

// ---------- a question of the sets, from the numbers a pupil sees ----------
const partsOf = (q: SetQuestion) => { const g = gcdAll(q.ratio); return { g, parts: q.ratio.map((p) => p / g) }; };
function pvOf(q: SetQuestion) {
  const { parts } = partsOf(q);
  return q.total !== undefined ? q.total / sum(parts) : q.known ? q.known.amount / parts[q.known.who] : q.diff!.amount / Math.abs(parts[q.diff!.a] - parts[q.diff!.b]);
}
function worded(q: SetQuestion) {
  const { g, parts } = partsOf(q);
  const names = q.names ?? q.ratio.map((_, i) => String.fromCharCode(65 + i));
  const base = { names, parts, partValue: pvOf(q), ctx: q.ctx, display: g > 1 ? q.ratio : undefined, bar: false };
  const w = q.total !== undefined ? buildSharing({ ...base, ask: q.ask === "both" ? "both" : (q.ask as number) })
    : q.known ? buildKnown({ ...base, known: q.known.who, ask: q.ask as "total" | number })
    : buildDifference({ ...base, a: q.diff!.a, b: q.diff!.b, style: q.diff!.style, ask: q.ask as "total" | number });
  must(w.answer === q.answer, `${q.id}: the tool's builder gives "${w.answer}", the set says "${q.answer}"`);
  return w;
}
const amountOf = (q: SetQuestion) => q.total ?? q.known?.amount ?? q.diff!.amount;
const money = (q: SetQuestion, n: number) => CONTEXTS[q.ctx ?? "money"].short(n);
/** The headline number of a question is its amount only, so the ratio's small numbers are not "asked about twice". */
const headline = (q: SetQuestion): CuratedQuestion => ({ ...Q.open(`${P}-${q.id.toLowerCase()}`, T, "level1", money(q, amountOf(q)), q.answer), title: money(q, amountOf(q)) });

// ---------- Set A: the 3 x 3 grid (an amount over a ratio; every cell asks for every share) ----------
const gridCell = (q: SetQuestion): CuratedQuestion => {
  const { parts } = partsOf(q);
  const C = CONTEXTS[q.ctx ?? "money"];
  const answer = parts.map((p) => C.short(p * pvOf(q)));
  const text = answer.length === 2 ? answer.join(" and ") : `${answer.slice(0, -1).join(", ")} and ${answer[answer.length - 1]}`;
  must(text === q.answer, `${q.id}: the grid answer ${text} is not ${q.answer}`);
  return { ...headline(q), question: [money(q, amountOf(q)), `$${q.ratio.join(" : ")}$`], answer: [text], explanation: [] };
};
const setA = ALL_SETS.A.map(gridCell);

// ---------- the printed sheets: hand-written, kept with the deck, in the textbook layout ----------
/** "Jack: £60" as "Jack = £60" (the printer puts "= " in front of an answer with no "=" in it) and as maths with the words kept as text, so the cue slide and the answer sheet set it the same way. */
const answerForSheet = (answer: string) => {
  const text = answer.replace(/: /g, " = ");
  const latex = text.split(/(£?\d+(?:\.\d+)?)/).filter(Boolean).map((part) => (/^£?\d/.test(part) ? (part.startsWith("£") ? `\\pounds ${part.slice(1)}` : part) : `\\text{${part}}`)).join(" ");
  return { answer: text, answerLatex: latex };
};
function sheetSlide(id: string, title: string, qs: SetQuestion[], seed: number, brief: string, instruction: string, size?: number, fontPx = 17, cols = 2): Slide {
  const s = pinnedSheetSlide(id, T, { sub: "mixed", level: "level1" }, qs.length, cols, title, seed);
  const sheet = s.els.find((e) => e.kind === "worksheet") as Extract<DeckElement, { kind: "worksheet" }>;
  sheet.pin = { title, paper: "A4", layout: "list", borders: false, fontPx };
  sheet.prompt = instruction;
  if (size) sheet.size = size;   // the answers on the cue slide: smaller when there are fifteen
  if (qs.length > 9) { sheet.x = 40; sheet.w = 1520; }   // four columns of answers need the width
  const sig = JSON.stringify([sheet.tool, sheet.preset, sheet.count, sheet.seed ?? 1]);
  sheet.frozen = { sig, questions: qs.map((q) => { const w = worded(q); return { ...w, ...answerForSheet(w.answer ?? ""), working: [], key: `${id}-${q.id}`, difficulty: "level1" as const }; }) };
  return { ...s, brief };
}

// ---------- worked examples (a bar model built a click at a time, then the working) ----------
function workedBar(id: string, title: string, prompt: string, rows: { name: string; units: number; known?: boolean; total?: string; extraFrom?: number }[], brace: string | undefined,
  lines: { text: string; bold?: boolean }[], brief: string): Slide {
  const bar = { parts: [], rows, ...(brace ? { sideBrace: { label: brace } } : {}) };
  const s = S.bar(id, title, prompt, bar, "filled", true);
  const stages = barStages(bar);
  const els = s.els.map((e) => (e.kind === "bar" ? { ...e, h: 400 } : e)) as DeckElement[];
  const out = lines.map((l, i) => ({ ...textEl(100, 680 + i * 70, 1400, 66, l.text, 44, { bold: !!l.bold, step: stages + 1 + i }), id: `${id}-w${i + 1}` }) as DeckElement);
  return { ...s, els: [...els, ...out], brief };
}
// Round part values on purpose (10, 10, 20): a worked example shows the method, not the arithmetic, and the numbers a slide shows
// must not be asked about anywhere (a number with two or more significant figures is what the rule counts).
const workedA = workedBar(`${P}-worked-a`, "Share £80 in the ratio 3 : 5", "Ana and Ben share £80 in the ratio $3 : 5$.",
  [{ name: "Ana", units: 3 }, { name: "Ben", units: 5 }], "total: 8 parts",
  [{ text: "1 part: $80 \\div 8 = 10$, so £10" }, { text: "Ana: $3 \\times 10 = 30$.  Ben: $5 \\times 10 = 50$", bold: true }, { text: "Check: $30 + 50 = 80$" }],
  "The bar model for sharing a total: the parts add to the total, one part, then multiply back, then check.");
const workedB = workedBar(`${P}-worked-b`, "Ana gets £20 in the ratio 2 : 3", "Ana and Ben share money in the ratio $2 : 3$. Ana gets £20. Find the total.",
  [{ name: "Ana", units: 2, known: true, total: "£20" }, { name: "Ben", units: 3 }], "total: 5 parts",
  [{ text: "£20 is $2$ parts, so 1 part: $20 \\div 2 = 10$, so £10" }, { text: "Total: $5 \\times 10 = 50$", bold: true }, { text: "Check: Ana £20 and Ben $3 \\times 10 = 30$ are in the ratio $2 : 3$" }],
  "The known share stands for its own parts, not for one part and not for the total.");
const workedC = workedBar(`${P}-worked-c`, "Ben gets £60 more than Ana", "Ana and Ben share money in the ratio $1 : 4$. Ben gets £60 more than Ana. Find the total.",
  [{ name: "Ana", units: 1 }, { name: "Ben", units: 4, extraFrom: 1, total: "£60 more" }], undefined,
  [{ text: "The difference is $4 - 1 = 3$ parts: £60. 1 part: $60 \\div 3 = 20$, so £20" }, { text: "Ana £20, Ben £80.  Total: $20 + 80 = 100$", bold: true }, { text: "Check: $80 - 20 = 60$" }],
  "The difference is the extra boxes only: the parts that differ, not all the parts.");

// ---------- starter, recap, exit ----------
const quick = (id: string, question: string, answer: string, title: string): CuratedQuestion => ({ ...Q.open(id, T, "level1", question, answer), title });
const starter = S.quick(`${P}-starter`, "Starter", [
  quick(`${P}-st-1`, "Simplify $9 : 21$.", "$3 : 7$", "simplify"),
  quick(`${P}-st-2`, "Add the parts of $3 : 5 : 7$.", "$15$", "add"),
  quick(`${P}-st-3`, "Complete: $2 : 5 = 8 : \\,?$", "$20$", "scale"),
  quick(`${P}-st-4`, "£56 shared equally between $7$ people. How much each?", "£8", "divide"),
], 2, "From earlier lessons");
const recapSpec: SetQuestion[] = [
  { id: "R1", rung: "recap", ratio: [3, 4], names: ["Kit", "Lou"], total: 77, ask: 0, answer: "Kit: £33", trap: "", wrong: "none" },
  { id: "R2", rung: "recap", ratio: [1, 4], names: ["Meg", "Nat"], known: { who: 0, amount: 17 }, ask: 1, answer: "Nat: £68", trap: "", wrong: "none" },
  { id: "R3", rung: "recap", ratio: [1, 4], names: ["Oli", "Pam"], diff: { a: 0, b: 1, amount: 63, style: 1 }, ask: "total", answer: "Total: £105", trap: "", wrong: "none" },
];
/** A worded question on one line: its sentences joined with full stops. */
const oneLine = (q: SetQuestion): CuratedQuestion => { const w = worded(q); return { ...headline(q), question: [w.lines.map((l, i) => (i < w.lines.length - 1 && !/[.?]$/.test(l) ? `${l}.` : l)).join(" ")], answer: [w.answer ?? ""] }; };
const recap = S.quick(`${P}-recap`, "Recap", recapSpec.map(oneLine), 1, "Lesson 2: three from last time");
const exitSpec: SetQuestion[] = [
  { id: "X1", rung: "exit", ratio: [4, 5], names: ["Quin", "Rae"], total: 81, ask: "both", answer: "Quin: £36, Rae: £45", trap: "", wrong: "none" },
  { id: "X2", rung: "exit", ratio: [2, 3], names: ["Sid", "Tia"], known: { who: 0, amount: 38 }, ask: "total", answer: "Total: £95", trap: "", wrong: "none" },
  { id: "X3", rung: "exit", ratio: [3, 5], names: ["Uri", "Val"], diff: { a: 0, b: 1, amount: 46, style: 1 }, ask: "total", answer: "Total: £184", trap: "", wrong: "none" },
];
const exitItems = exitSpec.map(oneLine);

// ---------- the sets as sections (for the fresh-number rules) ----------
const sets = { A: setA, B: ALL_SETS.B.map(headline), C: ALL_SETS.C.map(headline), D: ALL_SETS.D.map(headline) };
must(setA.length === 9 && ALL_SETS.B.length === 9 && ALL_SETS.C.length === 9 && ALL_SETS.D.length === 15, "set sizes");
assertFreshNumbers({
  worked: [80, 30, 50, 10, 20, 100, 60].filter((n) => String(n).replace(/0+$/, "").length >= 2),   // as the deck check counts them: two or more significant figures
  sections: { "set A": sets.A, "set B": sets.B, "set C": sets.C, "worksheet D": sets.D, recap: recapSpec.map(headline) },
  exit: exitItems,
});

const sheetB = sheetSlide(`${P}-sheet-b`, "Worksheet: a known share", ALL_SETS.B, 1,
  "Printed sheet of nine, easiest first. Not everyone will finish: a secure class can start at question 4. Question 1 starts with the known share as one part, where treating it as one part happens to work.",
  "Work out each answer. Show your working in your book.", 44);
const sheetC = sheetSlide(`${P}-sheet-c`, "Worksheet: a difference", ALL_SETS.C, 2,
  "Printed sheet of nine, easiest first. Not everyone will finish. Questions 4, 6 and 7 ask for the total, where dividing the difference by all the parts and multiplying back gives the difference itself.",
  "Work out each answer. Show your working in your book.", 44);
const sheetD = sheetSlide(`${P}-sheet-d`, "Worksheet: mixed", ALL_SETS.D, 3,
  "Fifteen mixed questions: five sharing a total, five a known share, five a difference, never labelled. Pupils first decide which kind it is. Not everyone will finish; the last five have three parts.",
  "Work out each answer. Show your working in your book.", 40, 13, 2);

export default () => ({
  id: ID, title: "Sharing in a Ratio", strand: "Ratio & Proportion", tool: T, pitch: "middle", questionVersion: 2,
  summary: "A recap lesson, built around the mistakes: sharing a total, a known share and a given difference in a ratio of two or three parts. Each section starts with a Depth card (who is right?), then a worked bar model. Nine questions on the board for sharing a total; printed sheets for the known share, the difference and a mixed set of fifteen.",
  slides: [
    S.title(`${P}-title`, "Sharing in a Ratio", "Find the parts. Find one part. Check."),
    S.objective(`${P}-objective`, "Share an amount in a ratio of two or three parts, and use a known share or a difference to find the shares and the total.",
      ["Share a total in a ratio", "Use a known share or a difference to find one part", "Check that the shares add to the total"]),
    starter,
    S.divider(`${P}-div-a`, "Sharing a total", "Add the parts. Find one part. Multiply."),
    S.depth(`${P}-depth-who`, T, "rs-who-is-right", "Who is right?"),
    workedA,
    S.depth(`${P}-depth-three`, T, "rs-three-parts", "Three parts"),
    S.plainBook(`${P}-grid-a`, setA, 3, "Share each amount in the ratio given.", "Sharing a total"),
    S.divider(`${P}-div-b`, "A known share", "One person's share is given. How many parts is it?"),
    S.depth(`${P}-depth-known`, T, "rs-known-share", "Who is right?"),
    workedB,
    sheetB,
    S.divider(`${P}-div-c`, "A difference", "The gap between two shares. How many parts is it?"),
    recap,
    S.depth(`${P}-depth-diff`, T, "rs-diff-total", "What is the total?"),
    workedC,
    sheetC,
    S.divider(`${P}-div-d`, "Mixed", "Which kind of question is it? Decide, then solve."),
    S.depth(`${P}-depth-first`, T, "rs-first-step", "Which first step?"),
    sheetD,
    S.exitRows(`${P}-exit`, exitItems, "Work on your own."),
    S.summary(`${P}-summary`, "What I check every time", ["What am I given: the total, a known share or a difference?", "How many parts is it?", "Do the shares add to the total?", "Did I answer what was asked?"]),
  ] as Slide[],
});
void makeSlide;
