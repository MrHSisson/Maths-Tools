// Practice slides for the inverse-trig-graphs deck: three sets worked through on the board, then a textbook sheet in the same three
// styles with different numbers. Every answer is recomputed from scratch below, and the build stops if one disagrees.
//   A: exact values   B: function then inverse   C: solving inverse equations
import { Q, S } from "/src/decks/builder";
import type { CuratedQuestion } from "/src/decks/types";

const T = "inverse-trig-graphs";
const { PI, sin, cos, tan, asin, acos, atan, sqrt } = Math;

/** [what is asked (KaTeX), the value computed from scratch, the answer (KaTeX), the value that answer means] */
type Item = [string, number, string, number];
const checked = (items: Item[]): Item[] => {
  items.forEach(([q, v, a, w]) => { if (Math.abs(v - w) > 1e-9) throw new Error(`inverse trig: ${q} is ${v}, not ${a} (${w})`); });
  return items;
};

// ---------- the textbook sheet (the homework questions use none of these numbers) ----------
const exactSheet = checked([
  ["\\arccos\\frac{1}{2}", acos(1 / 2), "\\frac{\\pi}{3}", PI / 3],
  ["\\arctan\\frac{1}{\\sqrt{3}}", atan(1 / sqrt(3)), "\\frac{\\pi}{6}", PI / 6],
  ["\\arcsin\\frac{\\sqrt{2}}{2}", asin(sqrt(2) / 2), "\\frac{\\pi}{4}", PI / 4],
  ["\\arccos 0", acos(0), "\\frac{\\pi}{2}", PI / 2],
  ["\\arcsin\\left(-\\frac{\\sqrt{3}}{2}\\right)", asin(-sqrt(3) / 2), "-\\frac{\\pi}{3}", -PI / 3],
  ["\\arctan(-1)", atan(-1), "-\\frac{\\pi}{4}", -PI / 4],
  ["\\arccos\\left(-\\frac{\\sqrt{3}}{2}\\right)", acos(-sqrt(3) / 2), "\\frac{5\\pi}{6}", 5 * PI / 6],
  ["\\arccos(-1)", acos(-1), "\\pi", PI],
]);
const undoSheet = checked([
  ["\\arcsin\\left(\\sin\\left(-\\frac{\\pi}{6}\\right)\\right)", asin(sin(-PI / 6)), "-\\frac{\\pi}{6}", -PI / 6],
  ["\\arccos\\left(\\cos\\frac{\\pi}{4}\\right)", acos(cos(PI / 4)), "\\frac{\\pi}{4}", PI / 4],
  ["\\arctan\\left(\\tan\\left(-\\frac{\\pi}{3}\\right)\\right)", atan(tan(-PI / 3)), "-\\frac{\\pi}{3}", -PI / 3],
  ["\\arccos\\left(\\cos\\frac{4\\pi}{3}\\right)", acos(cos(4 * PI / 3)), "\\frac{2\\pi}{3}", 2 * PI / 3],
  ["\\arctan\\left(\\tan\\frac{3\\pi}{4}\\right)", atan(tan(3 * PI / 4)), "-\\frac{\\pi}{4}", -PI / 4],
  ["\\arcsin\\left(\\sin\\frac{5\\pi}{4}\\right)", asin(sin(5 * PI / 4)), "-\\frac{\\pi}{4}", -PI / 4],
]);
const solveSheet = checked([
  ["\\arcsin x = \\frac{\\pi}{6}", sin(PI / 6), "\\frac{1}{2}", 1 / 2],
  ["\\arccos x = \\frac{\\pi}{4}", cos(PI / 4), "\\frac{\\sqrt{2}}{2}", sqrt(2) / 2],
  ["\\arcsin 3x = \\frac{\\pi}{2}", sin(PI / 2) / 3, "\\frac{1}{3}", 1 / 3],
  ["\\arccos(x + 1) = \\frac{2\\pi}{3}", cos(2 * PI / 3) - 1, "-\\frac{3}{2}", -3 / 2],
  ["\\arctan(2x + 1) = -\\frac{\\pi}{3}", (tan(-PI / 3) - 1) / 2, "\\frac{-1 - \\sqrt{3}}{2}", (-1 - sqrt(3)) / 2],
]);
// the last equation has no solution: 2π/3 is outside arcsin's range (-π/2 to π/2)
if (!(2 * PI / 3 > PI / 2)) throw new Error("inverse trig: 2π/3 should be outside arcsin's range");

// ---------- three on the board for each style (not on the sheet and not in the homework) ----------
const exactBoard = checked([
  ["\\arctan\\sqrt{3}", atan(sqrt(3)), "\\frac{\\pi}{3}", PI / 3],
  ["\\arcsin\\left(-\\frac{1}{2}\\right)", asin(-1 / 2), "-\\frac{\\pi}{6}", -PI / 6],
  ["\\arccos\\left(-\\frac{1}{2}\\right)", acos(-1 / 2), "\\frac{2\\pi}{3}", 2 * PI / 3],
]);
const undoBoard = checked([
  ["\\arctan\\left(\\tan\\frac{\\pi}{6}\\right)", atan(tan(PI / 6)), "\\frac{\\pi}{6}", PI / 6],
  ["\\arcsin\\left(\\sin\\frac{5\\pi}{6}\\right)", asin(sin(5 * PI / 6)), "\\frac{\\pi}{6}", PI / 6],
  ["\\arccos\\left(\\cos\\frac{7\\pi}{6}\\right)", acos(cos(7 * PI / 6)), "\\frac{5\\pi}{6}", 5 * PI / 6],
]);
const solveBoard = checked([
  ["\\arccos x = \\frac{\\pi}{3}", cos(PI / 3), "\\frac{1}{2}", 1 / 2],
  ["\\arctan 2x = \\frac{\\pi}{3}", tan(PI / 3) / 2, "\\frac{\\sqrt{3}}{2}", sqrt(3) / 2],
]);

const WORK_EXACT: string[][] = [
  ["$\\tan\\frac{\\pi}{3} = \\sqrt{3}$, and $\\frac{\\pi}{3}$ is in the range of arctan.", "$\\arctan\\sqrt{3} = \\frac{\\pi}{3}$"],
  ["$\\sin\\frac{\\pi}{6} = \\frac{1}{2}$, so $\\sin\\left(-\\frac{\\pi}{6}\\right) = -\\frac{1}{2}$.", "$-\\frac{\\pi}{6}$ is in the range of arcsin, so $\\arcsin\\left(-\\frac{1}{2}\\right) = -\\frac{\\pi}{6}$"],
  ["arccos only gives angles from $0$ to $\\pi$, so the answer cannot be negative.", "$\\cos\\frac{\\pi}{3} = \\frac{1}{2}$, so $\\cos\\left(\\pi - \\frac{\\pi}{3}\\right) = -\\frac{1}{2}$.", "$\\arccos\\left(-\\frac{1}{2}\\right) = \\frac{2\\pi}{3}$"],
];
const WORK_UNDO: string[][] = [
  ["$\\frac{\\pi}{6}$ is already between $-\\frac{\\pi}{2}$ and $\\frac{\\pi}{2}$.", "$\\arctan\\left(\\tan\\frac{\\pi}{6}\\right) = \\frac{\\pi}{6}$"],
  ["$\\sin\\frac{5\\pi}{6} = \\frac{1}{2}$.", "$\\arcsin\\frac{1}{2} = \\frac{\\pi}{6}$, because $\\frac{5\\pi}{6}$ is outside $-\\frac{\\pi}{2}$ to $\\frac{\\pi}{2}$."],
  ["$\\cos\\frac{7\\pi}{6} = -\\frac{\\sqrt{3}}{2}$.", "The angle from $0$ to $\\pi$ with that cosine is $\\frac{5\\pi}{6}$.", "$\\arccos\\left(\\cos\\frac{7\\pi}{6}\\right) = \\frac{5\\pi}{6}$"],
];
const WORK_SOLVE: string[][] = [
  ["Take cos of both sides: $x = \\cos\\frac{\\pi}{3}$.", "$x = \\frac{1}{2}$"],
  ["Take tan of both sides: $2x = \\tan\\frac{\\pi}{3} = \\sqrt{3}$.", "$x = \\frac{\\sqrt{3}}{2}$"],
];

const boardQ = (id: string, ask: string, q: string, answer: string, working: string[]): CuratedQuestion => {
  const line = ask.replace("@", q);
  return { ...Q.open(`it-${id}`, T, "level1", line, answer, working), title: line.replace(/\$/g, "").slice(0, 60) };
};
const FIND = "Find the exact value of $@$.";
const exactQs = exactBoard.map(([q, , a], i) => boardQ(`ex-${i + 1}`, FIND, q, `$${a}$`, WORK_EXACT[i]));
const undoQs = undoBoard.map(([q, , a], i) => boardQ(`un-${i + 1}`, FIND, q, `$${a}$`, WORK_UNDO[i]));
const solveQs = [
  ...solveBoard.map(([q, , a], i) => boardQ(`so-${i + 1}`, "Solve $@$.", q, `$x = ${a}$`, WORK_SOLVE[i])),
  boardQ("so-3", "Solve $@$.", "\\arccos x = -\\frac{\\pi}{4}", "No solution",
    ["arccos only gives angles from $0$ to $\\pi$.", "$-\\frac{\\pi}{4}$ is outside that range, so no value of $x$ works."]),
];

const sheet = {
  title: "Inverse trigonometric functions",
  note: "Write your answers in your book. Show your working.",
  blocks: [
    { instruction: "Without using a calculator, find the exact value in radians.", cols: 4, parts: exactSheet.map((r) => r[0]), answers: exactSheet.map((r) => r[2]) },
    { instruction: "Without using a calculator, find the exact value.", cols: 3, parts: undoSheet.map((r) => r[0]), answers: undoSheet.map((r) => r[2]) },
    { instruction: "Without using a calculator, solve each equation. If there is no solution, say so.", cols: 2,
      parts: [...solveSheet.map((r) => r[0]), "\\arcsin x = \\frac{2\\pi}{3}"], answers: [...solveSheet.map((r) => r[2]), "\\text{no solution}"] },
  ],
};

export const practiceSlides = () => [
  S.whiteboard("it-wb-exact", "Exact values", exactQs, "Three to talk through: a positive value, a negative one, and arccos of a negative (never a negative angle)."),
  S.whiteboard("it-wb-undo", "Function, then its inverse", undoQs, "Three to talk through: inside the range, outside it (sin), outside it (cos). Bring the angle into the restricted domain first."),
  S.whiteboard("it-wb-solve", "Solving inverse equations", solveQs, "Three to talk through: take the function of both sides; the last has no solution because the angle is outside the range."),
  S.textbookSheet("it-sheet", sheet, T),
];
