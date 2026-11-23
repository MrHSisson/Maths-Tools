// Practice slides for the inverse-trig-graphs deck: three sets worked through on the board, then a textbook sheet in the same three
// styles with different numbers. Every answer is recomputed from scratch below, and the build stops if one disagrees.
//   A: exact values   B: function then inverse   C: solving inverse equations
import { Q, S } from "/src/decks/builder";
import type { CuratedQuestion, Slide } from "/src/decks/types";

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
  ["\\arctan\\left(-\\frac{1}{\\sqrt{3}}\\right)", atan(-1 / sqrt(3)), "-\\frac{\\pi}{6}", -PI / 6],
  ["\\arccos\\left(-\\frac{\\sqrt{3}}{2}\\right)", acos(-sqrt(3) / 2), "\\frac{5\\pi}{6}", 5 * PI / 6],
  ["\\arccos(-1)", acos(-1), "\\pi", PI],
]);
const undoSheet = checked([
  ["\\arcsin\\left(\\sin\\left(-\\frac{\\pi}{6}\\right)\\right)", asin(sin(-PI / 6)), "-\\frac{\\pi}{6}", -PI / 6],
  ["\\arccos\\left(\\cos\\frac{\\pi}{4}\\right)", acos(cos(PI / 4)), "\\frac{\\pi}{4}", PI / 4],
  ["\\arctan\\left(\\tan\\left(-\\frac{\\pi}{3}\\right)\\right)", atan(tan(-PI / 3)), "-\\frac{\\pi}{3}", -PI / 3],
  ["\\arcsin\\left(\\sin\\frac{3\\pi}{4}\\right)", asin(sin(3 * PI / 4)), "\\frac{\\pi}{4}", PI / 4],
  ["\\arccos\\left(\\cos\\frac{4\\pi}{3}\\right)", acos(cos(4 * PI / 3)), "\\frac{2\\pi}{3}", 2 * PI / 3],
  ["\\arctan\\left(\\tan\\frac{3\\pi}{4}\\right)", atan(tan(3 * PI / 4)), "-\\frac{\\pi}{4}", -PI / 4],
  ["\\arccos\\left(\\cos\\left(-\\frac{\\pi}{3}\\right)\\right)", acos(cos(-PI / 3)), "\\frac{\\pi}{3}", PI / 3],
  ["\\arctan\\left(\\tan\\frac{4\\pi}{3}\\right)", atan(tan(4 * PI / 3)), "\\frac{\\pi}{3}", PI / 3],
  ["\\arcsin\\left(\\sin\\frac{5\\pi}{4}\\right)", asin(sin(5 * PI / 4)), "-\\frac{\\pi}{4}", -PI / 4],
]);
const solveSheet = checked([
  ["\\arcsin x = \\frac{\\pi}{6}", sin(PI / 6), "\\frac{1}{2}", 1 / 2],
  ["\\arccos x = \\frac{\\pi}{4}", cos(PI / 4), "\\frac{\\sqrt{2}}{2}", sqrt(2) / 2],
  ["\\arctan x = \\frac{\\pi}{4}", tan(PI / 4), "1", 1],
  ["\\arctan x = \\frac{\\pi}{6}", tan(PI / 6), "\\frac{\\sqrt{3}}{3}", sqrt(3) / 3],
  ["\\arcsin 3x = \\frac{\\pi}{2}", sin(PI / 2) / 3, "\\frac{1}{3}", 1 / 3],
  ["\\arccos 2x = \\frac{\\pi}{3}", cos(PI / 3) / 2, "\\frac{1}{4}", 1 / 4],
  ["\\arctan 3x = -\\frac{\\pi}{4}", tan(-PI / 4) / 3, "-\\frac{1}{3}", -1 / 3],
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

// The working starts from a sketch of the restricted graph, then uses its symmetry: the habit the equations in the lesson need.
const WORK_EXACT: string[][] = [
  ["Sketch $y = \\tan x$ between $-\\frac{\\pi}{2}$ and $\\frac{\\pi}{2}$. Where does it reach $\\sqrt{3}$?", "$\\tan\\frac{\\pi}{3} = \\sqrt{3}$, and $\\frac{\\pi}{3}$ is on that part of the graph.", "$\\arctan\\sqrt{3} = \\frac{\\pi}{3}$"],
  ["Sketch $y = \\sin x$ between $-\\frac{\\pi}{2}$ and $\\frac{\\pi}{2}$. It has half-turn symmetry about the origin.", "So $\\sin\\left(-\\frac{\\pi}{6}\\right) = -\\sin\\frac{\\pi}{6} = -\\frac{1}{2}$.", "$\\arcsin\\left(-\\frac{1}{2}\\right) = -\\frac{\\pi}{6}$"],
  ["Sketch $y = \\cos x$ between $0$ and $\\pi$: only angles from $0$ to $\\pi$, so the answer cannot be negative.", "The curve has half-turn symmetry about $\\left(\\frac{\\pi}{2}, 0\\right)$, so $\\cos(\\pi - \\theta) = -\\cos\\theta$.", "$\\cos\\frac{\\pi}{3} = \\frac{1}{2}$, so $\\cos\\frac{2\\pi}{3} = -\\frac{1}{2}$ and $\\arccos\\left(-\\frac{1}{2}\\right) = \\frac{2\\pi}{3}$"],
];
const WORK_UNDO: string[][] = [
  ["Sketch $y = \\tan x$ between $-\\frac{\\pi}{2}$ and $\\frac{\\pi}{2}$. $\\frac{\\pi}{6}$ is already on that part of the graph.", "$\\arctan\\left(\\tan\\frac{\\pi}{6}\\right) = \\frac{\\pi}{6}$"],
  ["Sketch $y = \\sin x$. $\\sin\\frac{5\\pi}{6} = \\frac{1}{2}$, but $\\frac{5\\pi}{6}$ is outside $-\\frac{\\pi}{2}$ to $\\frac{\\pi}{2}$.", "The curve is symmetrical about $x = \\frac{\\pi}{2}$, so the same height is at $\\pi - \\frac{5\\pi}{6} = \\frac{\\pi}{6}$, which is inside.", "$\\arcsin\\left(\\sin\\frac{5\\pi}{6}\\right) = \\frac{\\pi}{6}$"],
  ["Sketch $y = \\cos x$. $\\cos\\frac{7\\pi}{6} = -\\frac{\\sqrt{3}}{2}$, but $\\frac{7\\pi}{6}$ is outside $0$ to $\\pi$.", "The curve is symmetrical about $x = \\pi$, so the same height is at $2\\pi - \\frac{7\\pi}{6} = \\frac{5\\pi}{6}$, which is inside.", "$\\arccos\\left(\\cos\\frac{7\\pi}{6}\\right) = \\frac{5\\pi}{6}$"],
];
const WORK_SOLVE: string[][] = [
  ["Sketch $y = \\arccos x$: its heights run from $0$ to $\\pi$, so $\\frac{\\pi}{3}$ is possible.", "Take cos of both sides: $x = \\cos\\frac{\\pi}{3}$.", "$x = \\frac{1}{2}$"],
  ["Sketch $y = \\arctan x$: its heights are between $-\\frac{\\pi}{2}$ and $\\frac{\\pi}{2}$, so $\\frac{\\pi}{3}$ is possible.", "Take tan of both sides: $2x = \\tan\\frac{\\pi}{3} = \\sqrt{3}$.", "$x = \\frac{\\sqrt{3}}{2}$"],
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
    ["Sketch $y = \\arccos x$: its heights only run from $0$ to $\\pi$.", "$-\\frac{\\pi}{4}$ is below the whole graph, so no value of $x$ works."]),
];

// ---------- solving in an interval, counter-examples, rearranging: answers found by scanning for roots, not by the symmetry the pupils use ----------
/** Every root of f on [lo, hi] (a sign change between neighbouring points, not across a tan asymptote), sorted. */
const roots = (f: (x: number) => number, lo: number, hi: number): number[] => {
  const out: number[] = [], N = 40000;
  let a = lo, fa = f(a);
  for (let i = 1; i <= N; i++) {
    const b = lo + (hi - lo) * i / N, fb = f(b);
    if (Math.abs(fa) < 1e-12) out.push(a);
    else if (fa * fb < 0 && Math.abs(fa) < 50 && Math.abs(fb) < 50) { let l = a, h = b; for (let k = 0; k < 60; k++) { const m = (l + h) / 2; if (f(l) * f(m) <= 0) h = m; else l = m; } out.push((l + h) / 2); }
    a = b; fa = fb;
  }
  if (Math.abs(fa) < 1e-12) out.push(a);
  return out.filter((r, i) => i === 0 || Math.abs(r - out[i - 1]) > 1e-6);
};
/** x as a multiple of π, written in KaTeX (denominators 1, 2, 3, 4, 6, 8, 9 or 12 only). */
const piTex = (x: number): string => {
  const n = x / PI;
  for (const q of [1, 2, 3, 4, 6, 8, 9, 12]) {
    const p = Math.round(n * q);
    if (Math.abs(n * q - p) > 1e-6) continue;
    if (p === 0) return "0";
    const sign = p < 0 ? "-" : "", m = Math.abs(p);
    if (q === 1) return `${sign}${m === 1 ? "" : m}\\pi`;
    return `${sign}\\frac{${m === 1 ? "" : m}\\pi}{${q}}`;
  }
  throw new Error(`inverse trig: ${x} is not a simple multiple of π`);
};
const INTERVAL = (v: string, lo: number, hi: number) => `${piTex(lo)} \\le ${v} \\le ${piTex(hi)}`;
type Solve = [string, (x: number) => number, number, number];   // the equation, its left side minus its right side, the interval
// fractions are set full size (\dfrac) so they read as clearly as on worksheet 1
const big = (t: string) => t.replace(/\\frac/g, "\\dfrac");
const solveIn = (rows: Solve[], v = "x") => ({
  parts: rows.map(([eq, , lo, hi]) => big(`${eq}, \\qquad ${INTERVAL(v, lo, hi)}`)),
  answers: rows.map(([eq, f, lo, hi]) => { const r = roots(f, lo, hi); if (!r.length) throw new Error(`inverse trig: ${eq} has no solution in the interval`); return big(`${v} = ${r.map(piTex).join(",\\ ")}`); }),
});
const R2 = sqrt(2), R3 = sqrt(3);
const intervalSheet = solveIn([
  ["\\sin x = -\\frac{1}{2}", (x) => sin(x) + 1 / 2, 0, 2 * PI],
  ["\\cos x = -\\frac{\\sqrt{2}}{2}", (x) => cos(x) + R2 / 2, 0, 2 * PI],
  ["\\tan x = \\sqrt{3}", (x) => tan(x) - R3, 0, 2 * PI],
  ["\\tan x = -\\frac{\\sqrt{3}}{3}", (x) => tan(x) + R3 / 3, 0, 2 * PI],
  ["\\sin x = \\frac{1}{2}", (x) => sin(x) - 1 / 2, -PI, PI],
  ["\\cos x = \\frac{1}{2}", (x) => cos(x) - 1 / 2, -PI, PI],
  ["\\tan x = -\\sqrt{3}", (x) => tan(x) + R3, -PI, PI],
  ["\\cos x = 0", (x) => cos(x), -PI, PI],
  ["\\sin x = -\\frac{\\sqrt{3}}{2}", (x) => sin(x) + R3 / 2, 0, 4 * PI],
  ["\\sin x = -\\frac{\\sqrt{2}}{2}", (x) => sin(x) + R2 / 2, -2 * PI, 2 * PI],
]);
const rearrangeSheet = solveIn([
  ["2\\cos x - 1 = 0", (x) => 2 * cos(x) - 1, 0, 2 * PI],
  ["2\\sin x + \\sqrt{3} = 0", (x) => 2 * sin(x) + R3, 0, 2 * PI],
  ["\\sqrt{3}\\tan x - 1 = 0", (x) => R3 * tan(x) - 1, 0, 2 * PI],
  ["2\\tan x + 2 = 0", (x) => 2 * tan(x) + 2, -PI, PI],
]);
// a multiple of the angle: the interval for the angle inside the brackets is wider (e.g. 0 to 2π becomes 0 to 6π for 3θ)
const multipleSheet = solveIn([
  ["\\sin 2\\theta = \\frac{1}{2}", (t) => sin(2 * t) - 1 / 2, 0, 2 * PI],
  ["\\tan 2\\theta = 1", (t) => tan(2 * t) - 1, 0, PI],
  ["\\cos 3\\theta = \\frac{1}{2}", (t) => cos(3 * t) - 1 / 2, 0, PI],
  ["\\sin 3\\theta = \\frac{\\sqrt{3}}{2}", (t) => sin(3 * t) - R3 / 2, 0, 2 * PI],
], "\\theta");
// counter-examples: [the false statement, the value x it fails at, what the left side really is (as a number and in KaTeX), the right side x]
type Counter = [string, string, number, string, number, string, number];
const counterSheet = ((rows: Counter[]) => ({
  parts: rows.map((r) => r[0]),
  answers: rows.map(([, xTex, x, fn, lhs, lhsTex]) => {
    if (fn !== "undefined" && Math.abs(lhs - { arcsinsin: asin(sin(x)), arccoscos: acos(cos(x)), arctantan: atan(tan(x)) }[fn]!) > 1e-9) throw new Error(`inverse trig: counter-example ${fn} at ${xTex} is not ${lhsTex}`);
    if (Math.abs(lhs - x) < 1e-9) throw new Error(`inverse trig: ${xTex} is not a counter-example`);
    return `x = ${xTex}: \\text{ the left side is } ${lhsTex}`;
  }),
}))([
  ["\\arcsin(\\sin x) = x \\text{ for all } x", "\\pi", PI, "arcsinsin", 0, "0", 0],
  ["\\arccos(\\cos x) = x \\text{ for all } x", "2\\pi", 2 * PI, "arccoscos", 0, "0", 0],
]);

const sheet = {
  title: "Inverse trigonometric functions",
  note: "Write your answers in your book. Show your working.",
  blocks: [
    { instruction: "Without using a calculator, find the exact value in radians.", cols: 3, parts: exactSheet.map((r) => r[0]), answers: exactSheet.map((r) => r[2]) },
    { instruction: "Without using a calculator, find the exact value.", cols: 3, parts: undoSheet.map((r) => r[0]), answers: undoSheet.map((r) => r[2]) },
    { instruction: "Without using a calculator, solve each equation. If there is no solution, say so.", cols: 2,
      parts: [...solveSheet.map((r) => r[0]), "\\arcsin x = \\frac{2\\pi}{3}"], answers: [...solveSheet.map((r) => r[2]), "\\text{no solution}"] },
  ],
};

// The second worksheet: solving in an interval, rearranging, a multiple of the angle, then counter-examples last.
const sheet2 = {
  title: "Solving trigonometric equations",
  note: "Write your answers in your book. Sketch a graph first, then use symmetry. Give exact answers.",
  blocks: [
    { instruction: "Find every solution in the given interval.", cols: 2, ...intervalSheet },
    { instruction: "Rearrange, then find every solution in the given interval.", cols: 2, few: true, ...rearrangeSheet },
    { instruction: "Write down the interval for the angle inside the brackets first, then find every solution.", cols: 2, few: true, ...multipleSheet },
    { instruction: "Each statement is false. Give a counter-example.", cols: 2, few: true, ...counterSheet },
  ],
};

export const worksheetSlides = () => [S.textbookSheet("it-sheet", sheet, T), S.textbookSheet("it-sheet-solve", sheet2, T)];

/** Question left, writing and drawing space right (only the answer is revealed, so the working is the pupils' and the teacher's to draw). */
const split = (id: string, title: string, qs: CuratedQuestion[], brief: string): Slide => {
  const s = S.whiteboard(id, title, qs, brief);
  return { ...s, els: s.els.map((e) => (e.kind === "questions" ? { ...e, x: 24, y: 24, w: 1552, h: 852, presentation: "whiteboard", visualiser: true, size: 44 } : e)) as Slide["els"] };
};

export const practiceSlides = () => [
  split("it-wb-exact", "Exact values", exactQs, "Three to talk through, each starting from a sketch of the restricted graph: a positive value, a negative one (symmetry about the origin), and arccos of a negative (never a negative angle)."),
  split("it-wb-undo", "Function, then its inverse", undoQs, "Three to talk through, each from a sketch: inside the range, outside it (sin, symmetry about x = π/2), outside it (cos, symmetry about x = π). Bring the angle into the restricted domain first."),
  split("it-wb-solve", "Solving inverse equations", solveQs, "Three to talk through: sketch the inverse graph to see which heights are possible, then take the function of both sides; the last has no solution."),
];
