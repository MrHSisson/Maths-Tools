// Rebuild through the deck CLI; all authored diagrams and solutions use the live tool's builder.
import { Q, S, buildDeck } from "/src/decks/builder";
import { defaultRectilinear, type RectilinearSpec } from "/api/_rectilinear";
import { authoredSheetSlide } from "/src/decks/worksheets";
import type { CuratedQuestion, Slide } from "/src/decks/types";
export const ID = "year7-rectilinear-area";
const make = (id: string, patch: Partial<RectilinearSpec> = {}, purpose: CuratedQuestion["purpose"] = "practice") => ({ ...Q.rectilinear(id, { ...defaultRectilinear(), ...patch, reducedLabels: true }), purpose });
export const models = {
  split: make("y7-model-split", {}, "explain"),
  add: make("y7-model-add", { shape: "T", width: 13, height: 9, cutWidth: 3, cutHeight: 4, missingLength: "addition", scaffold: "none" }, "explain"),
  subtract: make("y7-model-subtract", { shape: "stairs3", width: 14, height: 12, cutWidth: 3, cutHeight: 4, missingLength: "subtraction", scaffold: "none" }, "explain"),
  cutout: make("y7-model-cutout", { shape: "U", width: 14, height: 10, cutWidth: 6, cutHeight: 6, method: "subtract", scaffold: "none" }, "explain"),
  frame: make("y7-frame-model", { shape: "frame", width: 13, height: 10, cutWidth: 5, cutHeight: 4, method: "subtract", scaffold: "none" }, "explain"),
  choice: make("y7-method-choice", { shape: "comb", width: 16, height: 11, cutWidth: 3, cutHeight: 6, method: "subtract", scaffold: "none" }, "explain"),
  exit: make("y7-exit-area", { shape: "U", width: 18, height: 13, cutWidth: 7, cutHeight: 8, missingLength: "subtraction", method: "subtract", scaffold: "none" }, "diagnose"),
};
export const practiceOne: CuratedQuestion[] = [
  make("y7-p1", { width: 7, height: 6, cutWidth: 2, cutHeight: 3 }),
  make("y7-p2", { shape: "T", width: 11, height: 8, cutWidth: 3, cutHeight: 5 }),
  make("y7-p3", { shape: "T", width: 13, height: 9, cutWidth: 4, cutHeight: 5, orientation: 1, scaffold: "split" }),
  make("y7-p4", { shape: "stairs3", width: 14, height: 10, cutWidth: 4, cutHeight: 3, scaffold: "split" }),
  make("y7-p5", { shape: "cross", width: 13, height: 11, cutWidth: 3, cutHeight: 4, scaffold: "none" }),
  make("y7-p6", { shape: "U", width: 15, height: 9, cutWidth: 5, cutHeight: 6, scaffold: "none" }),
];
export const practiceTwo: CuratedQuestion[] = [
  make("y7-m1", { shape: "T", width: 12, height: 8, cutWidth: 3, cutHeight: 5, missingLength: "addition", scaffold: "none" }),
  make("y7-m2", { shape: "stairs3", width: 13, height: 12, cutWidth: 3, cutHeight: 4, missingLength: "addition", orientation: 1, scaffold: "none" }),
  make("y7-m3", { shape: "stairs3", width: 16, height: 13, cutWidth: 4, cutHeight: 3, missingLength: "subtraction", scaffold: "none" }),
  make("y7-m4", { shape: "U", width: 16, height: 11, cutWidth: 5, cutHeight: 7, missingLength: "subtraction", orientation: 4, scaffold: "none" }),
  make("y7-m5", { shape: "T", width: 15, height: 11, cutWidth: 4, cutHeight: 6, missingLength: "subtraction", scaffold: "none" }),
  make("y7-m6", { shape: "comb", width: 19, height: 12, cutWidth: 4, cutHeight: 7, missingLength: "subtraction", orientation: 3, scaffold: "none" }),
];
export const cutoutPractice: CuratedQuestion[] = [
  make("y7-c1", { shape: "U", width: 13, height: 10, cutWidth: 5, cutHeight: 6, method: "subtract", scaffold: "none" }),
  make("y7-c2", { shape: "frame", width: 12, height: 9, cutWidth: 6, cutHeight: 5, method: "subtract", scaffold: "none" }),
  make("y7-c3", { shape: "comb", width: 17, height: 10, cutWidth: 3, cutHeight: 6, method: "subtract", scaffold: "none" }),
  make("y7-c4", { shape: "U", width: 16, height: 12, cutWidth: 6, cutHeight: 7, orientation: 1, method: "subtract", scaffold: "none" }),
  make("y7-c5", { shape: "frame", width: 15, height: 11, cutWidth: 7, cutHeight: 6, method: "subtract", scaffold: "none" }),
  make("y7-c6", { shape: "comb", width: 20, height: 13, cutWidth: 4, cutHeight: 8, orientation: 4, method: "subtract", scaffold: "none" }),
];
export const worksheetQuestions: CuratedQuestion[] = [
  make("y7-w1", { width: 9, height: 5, cutWidth: 4, cutHeight: 2 }),
  make("y7-w2", { shape: "T", width: 12, height: 8, cutWidth: 3, cutHeight: 5 }),
  make("y7-w3", { width: 10, height: 8, cutWidth: 6, cutHeight: 3, orientation: 1, scaffold: "split" }),
  make("y7-w4", { shape: "stairs3", width: 15, height: 11, cutWidth: 4, cutHeight: 3, scaffold: "split" }),
  make("y7-w5", { shape: "cross", width: 14, height: 12, cutWidth: 3, cutHeight: 4, scaffold: "split" }),
  make("y7-w6", { shape: "T", width: 14, height: 10, cutWidth: 4, cutHeight: 6, missingLength: "addition", scaffold: "none" }),
  make("y7-w7", { shape: "stairs3", width: 17, height: 12, cutWidth: 4, cutHeight: 3, missingLength: "subtraction", scaffold: "none" }),
  make("y7-w8", { shape: "U", width: 17, height: 11, cutWidth: 6, cutHeight: 7, missingLength: "subtraction", scaffold: "none" }),
  make("y7-w9", { shape: "U", width: 18, height: 12, cutWidth: 7, cutHeight: 8, method: "subtract", scaffold: "none" }),
  make("y7-w10", { shape: "frame", width: 14, height: 11, cutWidth: 6, cutHeight: 5, method: "subtract", scaffold: "none" }),
  make("y7-w11", { shape: "comb", width: 19, height: 13, cutWidth: 4, cutHeight: 8, method: "subtract", scaffold: "none" }),
  make("y7-w12", { shape: "frame", width: 17, height: 13, cutWidth: 9, cutHeight: 7, method: "subtract", scaffold: "none" }),
];
const model = (sid: string, title: string, item: CuratedQuestion, prompt?: string): Slide => {
  const s = { ...S.deliberate(sid, title, [item], "Discuss the diagram before revealing the tool's canonical working. Every omitted label is implied; a question mark is deliberately unknown."), family: "teach" as const };
  if (prompt) { s.els = s.els.map(e => e.kind === "questions" ? { ...e, y: 140, h: 735 } : e); s.els.push({ id: sid + "-prompt", kind: "text", x: 60, y: 32, w: 1480, h: 88, size: 44, bold: true, text: prompt }); }
  return s;
};
const generator = (sid: string, missing: boolean): Slide => ({ id: sid, title: missing ? "Missing lengths, then area" : "General practice", family: "practice", brief: missing ? "Find marked missing lengths by adding or subtracting, then calculate area. Use fresh questions as needed; full-width reveals the shared working." : "Area only, with all necessary boundary lengths given or directly implied; ask pupils to suggest a split before revealing the working.", els: [{ id: sid + "-el", kind: "generator", tool: "perimeter-and-area", preset: { sub: "compound", level: missing ? "level2" : "level1", multiSelect: { area: true, perimeter: false, all: !missing, missing, split: true, subtract: false }, variables: { reducedLabels: true, showSplit: false } }, seed: missing ? 421 : 123, presentation: "full", x: 24, y: 24, w: 1552, h: 852 }] });
export default async function lesson() {
  const why = { ...Q.open("y7-exit-explain", "perimeter-and-area", "level1", "Explain why we add rectangle areas when splitting, but subtract the cut-out area when using the whole rectangle.", "Splitting covers the shape exactly once. The enclosing rectangle includes an extra cut-out, so remove its area. Give area in cm²."), purpose: "explain" as const };
  return buildDeck({ id: ID, title: "Area of rectilinear shapes", summary: "Year 7: split and add, find missing lengths, compare removing cut-outs, and practise on a scaffolded authored worksheet.", tool: "perimeter-and-area", slides: [
    S.title(ID + "-title", "Area of rectilinear shapes", "Year 7 · Split, calculate and explain"),
    S.objective(ID + "-objective", "Find the area of a rectilinear shape and explain your method.", ["Split into rectangles and add their areas", "Find a missing length before calculating area", "Compare splitting with removing a cut-out"]),
    S.definition(ID + "-definition", "Rectilinear shape", "A 2D shape with straight sides meeting at right angles. Its area is the amount of surface it covers, measured in square units."),
    model(ID + "-explore", "Where could we split?", { ...models.split, id: "y7-explore-q", rectilinear: { ...models.split.rectilinear!, scaffold: "none" } }, "Where could we split this shape?"),
    model(ID + "-split", "Split, calculate, add", models.split),
    S.discuss(ID + "-two-splits", "Could two different splits both be correct?", "Each rectangle must lie inside the shape. Cover the whole shape exactly once, with no gaps or overlaps.", "$8 \\times 4 + 5 \\times 2$ or $5 \\times 6 + 3 \\times 4$?", "42\\,\\mathrm{cm}^2"),
    S.deliberate(ID + "-practice-one", "Split and add: practice", practiceOne, "One short L warm-up, then two T-shapes, a staircase, a cross and a U-shape. Reduce support deliberately; keep required component lengths visible."),
    generator(ID + "-general-one", false),
    model(ID + "-missing-add", "Find a length by adding", models.add, "Find the missing length first."),
    model(ID + "-missing-subtract", "Find a length by subtracting", models.subtract, "Which lengths add to the whole?"),
    S.deliberate(ID + "-practice-two", "Missing lengths: practice", practiceTwo, "Varied T, staircase, U and two-notch outlines: addition first, then subtraction. Find the question-mark length before calculating each area."),
    generator(ID + "-general-two", true),
    model(ID + "-cutout", "Discuss removing a cut-out", models.cutout, "Could we remove a cut-out instead?"),
    model(ID + "-method-choice", "Choose an efficient method", models.choice, "Which method would you choose? Why?"),
    model(ID + "-frame-model", "A hole inside the shape", models.frame, "What area must we remove?"),
    S.deliberate(ID + "-cutout-practice", "Cut-outs and frames: practice", cutoutPractice, "U-shapes, enclosed holes and two cut-outs. Optional continuation if needed; ask for whole area minus all removed areas."),
    { ...generator(ID + "-general-three", false), title: "Cut-outs and frames: general practice", brief: "Level 3 styles: U-shapes, two notches and frames. Area only, reduced labels; discuss subtraction before revealing the solution.", els: [{ id: ID + "-general-three-el", kind: "generator", tool: "perimeter-and-area", preset: { sub: "compound", level: "level3", multiSelect: { area: true, perimeter: false, all: true, missing: false, cmOnly: true, mixed: false }, variables: { reducedLabels: true, showSplit: false } }, seed: 317, presentation: "full", x: 24, y: 24, w: 1552, h: 852 }] },
    authoredSheetSlide(ID + "-worksheet", "Rectilinear area — independent practice", worksheetQuestions),
    S.summary(ID + "-summary", "Choose a method", ["Split into rectangles: multiply, then add", "Find any missing lengths first", "Or use the whole rectangle minus the cut-out", "Check every part is counted once; use cm²"]),
    { ...S.deliberate(ID + "-exit", "Exit check", [models.exit, why], "One new missing-length area question and one explanation of the two methods. Use this to decide where the next lesson should resume."), family: "retrieval" as const },
  ] });
}
