// Build script for the "The simplex algorithm: what is the table doing?" deck (plan: specs/decks/lp-simplex-process.md).
// One worked problem from start to finish, with a graph beside the table so the class sees the table walk from corner to corner.
// Every number on a slide is computed here by the real engine (src/shared/decision/lpSimplex.ts), then asserted against what the slide says.
//   npm run deck -- build specs/decks/lp-simplex-process.build.ts --replace
//   npm run deck -- check lp-simplex-process --layout
import { LOOK, S, lineEl, makeSlide, textEl, titleEls } from "/src/decks/builder";
import { type Fr } from "/src/shared/decision/dim";
import { type Tab, runSpec } from "/src/shared/decision/lpSimplex";
import type { Slide } from "/src/decks/types";

const ID = "lp-simplex-process";
const P = "sx";
const { grey } = LOOK;
const t = textEl;
const must = (ok: boolean, msg: string) => { if (!ok) throw new Error(`plan check failed: ${msg}`); };

// ── the problem, and the real run of the algorithm ───────────────────────────
const spec = { sense: "max" as const, c: [2, 3], cons: [{ a: [2, 1], op: "≤" as const, b: 10 }, { a: [1, 2], op: "≤" as const, b: 8 }] };
const run = runSpec(spec);
const [T0, T1, T2] = run.tabs;
must(run.iters.length === 2, "the run has two iterations");
must(run.iters[0].col === 2 && run.iters[0].row === 2, "first pivot: the y column, the second constraint");
must(run.iters[1].col === 1 && run.iters[1].row === 1, "second pivot: the x column, the first constraint");
const val = (tab: Tab, r: number, c: number): string => `${tab.rows[r][c][0]}/${tab.rows[r][c][1]}`;
must(val(T2, 0, 5) === "14/1" && val(T2, 1, 5) === "4/1" && val(T2, 2, 5) === "2/1", "the optimum: P 14, x 4, y 2");
must(val(T1, 0, 5) === "12/1" && val(T1, 2, 5) === "4/1", "after the first pivot: P 12, y 4");
must(val(T1, 0, 1) === "-1/2", "the objective row's trade-off under x is -1/2");
must(val(T2, 0, 3) === "1/3" && val(T2, 0, 4) === "4/3", "the final objective row 1/3 and 4/3");
const corners: Array<[number, number, number]> = [[0, 0, 0], [5, 0, 10], [4, 2, 14], [0, 4, 12]];
for (const [x, y, p] of corners) must(2 * x + 3 * y === p && 2 * x + y <= 10 && x + 2 * y <= 8, `corner (${x}, ${y})`);
// the row operations, from the engine, so the slides cannot disagree with it
const ops = (k: number): string[] => {
  const it = run.iters[k];
  const out: string[] = [`\\mathrm{NPR} = \\mathrm{R}${it.row + 1} \\div ${it.pivot[1] === 1 ? it.pivot[0] : `\\tfrac{${it.pivot[0]}}{${it.pivot[1]}}`}`];
  for (const o of it.ops) {
    const f = o.factor;
    const mag = `${Math.abs(f[0])}${f[1] === 1 ? "" : `/${f[1]}`}`;
    out.push(`\\mathrm{R}${o.row + 1} ${f[0] > 0 ? "-" : "+"} ${mag === "1" ? "" : (f[1] === 1 ? `${Math.abs(f[0])}` : `\\tfrac{${Math.abs(f[0])}}{${f[1]}}`) + " \\times "}\\mathrm{NPR}`);
  }
  return out;
};
const OPS1 = ops(0), OPS2 = ops(1);
must(OPS1.length === 3 && OPS2.length === 3, "each iteration has a pivot row and two row operations");

// ── tableaux as maths ────────────────────────────────────────────────────────
const F = (f: Fr): string => (f[1] === 1 ? String(f[0]) : `${f[0] < 0 ? "-" : ""}\\tfrac{${Math.abs(f[0])}}{${f[1]}}`);
const COLS = ["P", "x", "y", "s_1", "s_2"];
const YELLOW = "#fde047";
const COL_HI = "#1d4ed8";
/** a tableau (P, the variables, the slacks, then the right-hand side: no basic-variable column); `col` colours a column, `pivot` marks one cell, `hiRow` colours a row */
function tabTex(tab: Tab, o: { col?: number; pivot?: [number, number]; hiRow?: number } = {}): string {
  const cell = (i: number, j: number): string => {
    let s = F(tab.rows[i][j]);
    if (o.pivot && o.pivot[0] === i && o.pivot[1] === j) return `\\colorbox{${YELLOW}}{$\\;${s}\\;$}`;
    if (o.col === j || o.hiRow === i) s = `\\textcolor{${COL_HI}}{${s}}`;
    return s;
  };
  const head = `${COLS.map((c, j) => (o.col === j ? `\\textcolor{${COL_HI}}{${c}}` : c)).join("&")}&\\text{RHS}`;
  const rows = tab.rows.map((_, i) => `${[0, 1, 2, 3, 4].map((j) => cell(i, j)).join("&")}&${o.hiRow === i ? `\\textcolor{${COL_HI}}{${F(tab.rows[i][5])}}` : F(tab.rows[i][5])}`);
  return `\\begin{array}{ccccc|c}${head}\\\\[0.6ex]\\hline ${rows[0]}\\\\[0.8ex]\\hline ${rows.slice(1).join("\\\\[1ex]")}\\end{array}`;
}
const maths = (x: number, y: number, w: number, h: number, latex: string, size: number, more: Record<string, unknown> = {}) =>
  ({ kind: "maths", x, y, w, h, latex, size, ...more }) as never;

// ── the graph: the region, its corners, and where the table has walked to ────
const OX = 985, OY = 790, SC = 100;
const px = (x: number) => OX + SC * x, py = (y: number) => OY - SC * y;
const dot = (x: number, y: number, c: string, step = 0, r = 12) => ({ kind: "shape", shape: "ellipse", x: px(x) - r, y: py(y) - r, w: 2 * r, h: 2 * r, fill: c, stroke: c, strokeWidth: 2, ...(step ? { step } : {}) }) as never;
const seg = (x1: number, y1: number, x2: number, y2: number, colour: string, width: number, step = 0, arrow = false) =>
  lineEl(px(x1), py(y1), px(x2) - px(x1), py(y2) - py(y1), { colour, width, ...(arrow ? { arrow: true } : {}), ...(step ? { step } : {}) });
interface GraphOpts {
  /** the corners and (on a later click) their values of P; `step` 0 = with the slide */
  corners?: { step: number; labels?: number };
  /** the walk so far: [from, to, step] (indexes into CORNERS) */
  path?: Array<[number, number, number]>;
  /** a green marker on a corner */
  at?: number;
  /** the names of the two limits */
  labels?: boolean;
}
const CORNERS: Array<[number, number]> = [[0, 0], [0, 4], [4, 2], [5, 0]];
const PVAL = [0, 12, 14, 10];
const GREEN = "#15803d";
function graph(o: GraphOpts = {}) {
  const els: unknown[] = [
    seg(0, 0, 5.4, 0, LOOK.ink, 6), seg(0, 0, 0, 4.6, LOOK.ink, 6),
    t(px(5.45), py(0) - 26, 60, 50, "$x$", 40, { colour: LOOK.ink }), t(px(0) + 16, py(4.6) - 24, 60, 50, "$y$", 40, { colour: LOOK.ink }),
    seg(5, 0, 2.75, 4.5, "#1d4ed8", 7), seg(0, 4, 5.3, 1.35, "#7c3aed", 7),
    ...(o.labels === false ? [] : [t(px(2.9), py(4.55) - 8, 300, 44, "$2x + y = 10$", 30, { colour: "#1d4ed8", bold: true }), t(px(0.15), py(2.6), 330, 44, "$x + 2y = 8$", 30, { colour: "#7c3aed", bold: true })]),
  ];
  const cs = o.corners;
  CORNERS.forEach(([x, y], i) => {
    const step = cs && i !== 0 ? cs.step : 0;
    els.push(dot(x, y, LOOK.ink, step, 11));
    // labels go where no line runs: (0, 4) to the left of the axis, (4, 2) above and to the right (outside both limits)
    const lx = i === 1 ? px(x) - 178 : i === 2 ? px(x) + 26 : px(x) + (i === 3 ? -70 : 14);
    const ly = i === 1 ? py(y) - 40 : i === 2 ? py(y) - 100 : py(y) + 14;
    const al = i === 1 ? { align: "right" } : {};
    if (cs) els.push(t(lx, ly, 130, 46, `$(${x}, ${y})$`, 30, { colour: LOOK.ink, ...al, ...(step ? { step } : {}) }));
    if (cs && cs.labels !== undefined) els.push(t(lx, ly + 40, 130, 46, `$P = ${PVAL[i]}$`, 30, { colour: grey, bold: true, ...al, ...(cs.labels ? { step: cs.labels } : {}) }));
  });
  for (const [a, b, step] of o.path ?? []) els.push(seg(CORNERS[a][0], CORNERS[a][1], CORNERS[b][0], CORNERS[b][1], GREEN, 12, step, true));
  if (o.at !== undefined) els.push(dot(CORNERS[o.at][0], CORNERS[o.at][1], GREEN, 0, 18));
  return els;
}

/** pure maths on the slide: drawn as a maths element, because maths inside a text box reads smaller than the words around it */
const ml = (x: number, y: number, w: number, h: number, latex: string, size = 48, more: Record<string, unknown> = {}) => maths(x, y, w, h, latex, size, { align: "left", ...more });
const slide = (id: string, title: string, els: unknown[], brief?: string): Slide => makeSlide(id, "teach", title, els as never, brief);
const left = (text: string, y = 250, h = 560, size = 42, more: Record<string, unknown> = {}) => t(60, y, 880, h, text, size, more);

// ── the slides ───────────────────────────────────────────────────────────────
const slides: Slide[] = [
  S.title(`${P}-title`, "The simplex algorithm", "Climbing from corner to corner"),
  S.objective(`${P}-objective`, "Explain what each step of the simplex table is doing, and why it works.", [
    "Say what the starting table means",
    "Choose where to go next, and how far",
    "Know when to stop",
  ]),

  slide(`${P}-problem`, "The problem", [
    ...titleEls("The problem", "A plan is a corner of the region"),
    ml(60, 250, 880, 520, "\\begin{array}{l}\\text{Maximise } P = 2x + 3y\\\\[2ex]\\text{subject to}\\\\[1.4ex] 2x + y \\le 10\\\\[1ex] x + 2y \\le 8\\\\[1ex] x \\ge 0,\\; y \\ge 0\\end{array}", 58),
    t(60, 790, 860, 60, "Each corner is a possible plan.", 36, { colour: grey, step: 1 }),
    ...graph({ corners: { step: 1, labels: 2 } }),
  ], "The one worked problem for the whole deck. The corners come on the first click and their values of P on the second."),

  slide(`${P}-idea`, "The big idea", [
    ...titleEls("The big idea"),
    t(100, 230, 1400, 120, "1.  Start at the origin: $x = 0$ and $y = 0$.", 54),
    t(100, 380, 1400, 120, "2.  Move along an edge to a corner where $P$ is bigger.", 54, { step: 1 }),
    t(100, 530, 1400, 120, "3.  Stop when no edge goes uphill.", 54, { step: 2 }),
    t(100, 700, 1400, 110, "We do not check every corner. The table tells us which way to walk.", 44, { colour: grey, step: 3 }),
  ]),

  slide(`${P}-slack`, "Slack variables", [
    ...titleEls("Slack variables", "They turn each limit into an equation"),
    ml(60, 250, 880, 300, "\\begin{array}{l}2x + y + s_1 = 10\\\\[1.2ex] x + 2y + s_2 = 8\\\\[1.2ex] P - 2x - 3y = 0\\end{array}", 62),
    left("$s_1$ is the amount of the first limit not used.\n$s_2$ is the amount of the second not used.", 580, 200, 38, { colour: grey, step: 1 }),
    t(60, 780, 880, 90, "At the start $x = 0$ and $y = 0$, so $s_1 = 10$, $s_2 = 8$ and $P = 0$.", 44, { bold: true, step: 2 }),
    ...graph({ at: 0, labels: false }),
  ]),

  slide(`${P}-table0`, "The starting table", [
    ...titleEls("The starting table", "Each row is one of the equations"),
    maths(40, 250, 900, 330, tabTex(T0), 58),
    t(60, 620, 880, 230, "Read it: a column with a single 1 and 0s elsewhere is a variable that is not zero. Its value is on the right, in the row of the 1.\n$s_1 = 10$, $s_2 = 8$, $P = 0$, and $x = y = 0$.", 40, { step: 1 }),
    ...graph({ at: 0, labels: false }),
  ]),

  slide(`${P}-column`, "Which way? Look at the bottom row", [
    ...titleEls("Which way?", "The bottom row says how fast $P$ grows"),
    maths(40, 250, 900, 330, tabTex(T0, { hiRow: 0 }), 58),
    t(60, 620, 880, 90, "$-2$ under $x$: raise $x$ by 1 and $P$ goes up by 2.", 42, { step: 1 }),
    t(60, 710, 880, 90, "$-3$ under $y$: raise $y$ by 1 and $P$ goes up by 3.", 42, { step: 1 }),
    t(60, 810, 880, 70, "The most negative entry is the way to go: $y$.", 44, { bold: true, step: 2 }),
    ...graph({ at: 0, labels: false }),
  ]),

  slide(`${P}-ratio`, "How far? The ratios", [
    ...titleEls("How far?", "Raise $y$ until a limit runs out"),
    maths(40, 250, 900, 330, tabTex(T0, { col: 2, pivot: [2, 2] }), 58),
    t(60, 610, 880, 60, "First limit: $10 \\div 1 = 10$", 44, { step: 1 }),
    t(60, 680, 880, 60, "Second limit: $8 \\div 2 = 4$", 44, { step: 1 }),
    t(60, 770, 880, 100, "The smallest ratio is 4: the second limit runs out first. $y$ goes up to 4.", 42, { bold: true, step: 2 }),
    ...graph({ at: 0, labels: false, path: [[0, 1, 2]] }),
  ], "Only the positive entries in the chosen column are used for the ratios."),

  slide(`${P}-negative`, "Why only positive entries?", [
    ...titleEls("Why only positive entries?", "A ratio asks how far $y$ can go before a limit runs out"),
    t(80, 250, 700, 60, "The entry in row 2 is $2$", 40, { colour: grey, bold: true }),
    ml(80, 330, 700, 110, "s_2 = 8 - 2y", 62),
    t(80, 470, 700, 210, "Raise $y$: $s_2$ shrinks and reaches 0 at $y = 8 \\div 2 = 4$. A real limit.", 40, { step: 1 }),
    t(820, 250, 700, 60, "Imagine the entry were $-2$", 40, { colour: grey, bold: true, step: 2 }),
    ml(820, 330, 700, 110, "s = 8 + 2y", 62, { step: 2 }),
    t(820, 470, 700, 210, "Raise $y$: $s$ grows and never reaches 0. It is no limit at all.", 40, { step: 2 }),
    t(80, 700, 1440, 90, "$8 \\div (-2) = -4$ would be a limit behind us, at $y = -4$. So we skip negative entries.", 44, { bold: true, step: 3 }),
    t(80, 810, 1440, 60, "A zero entry does not touch that limit either, so it is skipped too.", 38, { colour: grey, step: 4 }),
  ], "Why the ratio test uses positive entries only. Row 2 of the starting table, with x = 0, is s2 = 8 - 2y: raising y shrinks s2, which runs out at y = 4. A negative entry would make the variable grow instead (s = 8 + 2y), so it never runs out; dividing would give a limit at y = -4, behind us."),

  slide(`${P}-pivot1`, "Moving there: row operations", [
    ...titleEls("Moving there", "Rewrite every equation from the new corner"),
    ml(60, 235, 880, 215, `\\begin{array}{l}${OPS1[0]} \\quad \\text{(divide the pivot row)}\\\\[1ex] ${OPS1[1]} \\quad \\text{(take } y \\text{ out of the bottom row)}\\\\[1ex] ${OPS1[2]} \\quad \\text{(take } y \\text{ out of the first limit)}\\end{array}`, 38),
    maths(40, 470, 900, 330, tabTex(T1), 58, { step: 1 }),
    t(60, 810, 880, 70, "Now the $y$ column is a single 1: $y = 4$, and $P = 12$.", 44, { bold: true, step: 2 }),
    ...graph({ labels: false, path: [[0, 1, 0]], at: 1 }),
  ], "The row operations first, then the new table on the first click."),

  slide(`${P}-corner1`, "Read the new corner", [
    ...titleEls("Read the new corner"),
    ml(60, 230, 880, 330, "\\begin{array}{l}y = 4,\\; x = 0\\\\[1.2ex] s_1 = 6,\\; s_2 = 0\\\\[1.2ex] P = 12\\end{array}", 66),
    left("$s_2 = 0$: the second limit is used up. That is why we stopped.", 580, 130, 38, { colour: grey, step: 1 }),
    left("Is there more to gain?", 740, 90, 44, { bold: true, step: 2 }),
    ...graph({ labels: false, path: [[0, 1, 0]], at: 1 }),
  ]),

  slide(`${P}-tradeoff`, "The trade-off", [
    ...titleEls("The trade-off", "The new bottom row is the news"),
    maths(40, 240, 900, 330, tabTex(T1, { hiRow: 0 }), 58),
    t(60, 590, 880, 80, "$-\\tfrac{1}{2}$ under $x$: raising $x$ still helps. By how much?", 42),
    t(60, 670, 880, 60, "Raise $x$ by 1: $P$ rises by $2$ directly.", 40, { step: 1 }),
    t(60, 735, 880, 60, "But $y$ must fall by $\\tfrac{1}{2}$: $P$ falls by $3 \\times \\tfrac{1}{2} = 1\\tfrac{1}{2}$.", 40, { step: 1 }),
    t(60, 810, 880, 70, "Net: $2 - 1\\tfrac{1}{2} = +\\tfrac{1}{2}$. The bottom row already did this sum.", 42, { bold: true, step: 2 }),
    ...graph({ labels: false, path: [[0, 1, 0]], at: 1 }),
  ], "The key idea: each entry in the bottom row is the net effect, after everything else adjusts."),

  slide(`${P}-ratio2`, "How far? The ratios again", [
    ...titleEls("How far?", "Raise $x$ until a limit runs out"),
    maths(40, 250, 900, 330, tabTex(T1, { col: 1, pivot: [1, 1] }), 58),
    t(60, 610, 880, 60, "First limit: $6 \\div \\tfrac{3}{2} = 4$", 44, { step: 1 }),
    t(60, 680, 880, 60, "$y$ row: $4 \\div \\tfrac{1}{2} = 8$", 44, { step: 1 }),
    t(60, 770, 880, 100, "The smallest is 4: the first limit runs out first. $x$ goes up to 4, and $y$ comes down to 2.", 42, { bold: true, step: 2 }),
    ...graph({ labels: false, path: [[0, 1, 0], [1, 2, 2]], at: 1 }),
  ]),

  slide(`${P}-pivot2`, "Moving again", [
    ...titleEls("Moving again"),
    ml(60, 235, 880, 215, `\\begin{array}{l}${OPS2[0]} \\quad \\text{(divide the pivot row)}\\\\[1ex] ${OPS2[1]} \\quad \\text{(take } x \\text{ out of the bottom row)}\\\\[1ex] ${OPS2[2]} \\quad \\text{(take } x \\text{ out of the } y \\text{ row)}\\end{array}`, 38),
    maths(40, 470, 900, 330, tabTex(T2), 58, { step: 1 }),
    t(60, 810, 880, 70, "Now $x = 4$, $y = 2$ and $P = 14$.", 44, { bold: true, step: 2 }),
    ...graph({ labels: false, path: [[0, 1, 0], [1, 2, 0]], at: 2 }),
  ]),

  slide(`${P}-stop`, "When do we stop?", [
    ...titleEls("When do we stop?", "When the bottom row has no negatives"),
    maths(40, 250, 900, 330, tabTex(T2, { hiRow: 0 }), 58),
    t(60, 600, 880, 70, "The bottom row says $P = 14 - \\tfrac{1}{3}s_1 - \\tfrac{4}{3}s_2$.", 42),
    t(60, 680, 880, 100, "$s_1$ and $s_2$ cannot be negative, so any move can only lower $P$.", 42, { step: 1 }),
    t(60, 790, 880, 90, "Maximum: $P = 14$ at $x = 4$, $y = 2$. Both limits are used up.", 42, { bold: true, step: 2 }),
    ...graph({ labels: false, path: [[0, 1, 0], [1, 2, 0]], at: 2 }),
  ]),

  slide(`${P}-journey`, "The whole journey", [
    ...titleEls("The whole journey"),
    maths(40, 240, 820, 320, "\\begin{array}{c|c|c|c}\\text{step}&\\text{in / out}&\\text{corner}&P\\\\\\hline \\text{start}&&(0,0)&0\\\\ 1&y \\text{ in, } s_2 \\text{ out}&(0,4)&12\\\\ 2&x \\text{ in, } s_1 \\text{ out}&(4,2)&14\\end{array}", 44),
    t(60, 600, 880, 100, "Each step moved to a better corner. We never visited $(5, 0)$, where $P = 10$.", 42, { step: 1 }),
    t(60, 730, 880, 120, "$y$ came in first, then went back down as $x$ came in: the walk is not always straight up.", 40, { colour: grey, step: 2 }),
    ...graph({ labels: false, corners: { step: 0, labels: 0 }, path: [[0, 1, 0], [1, 2, 0]] }),
  ]),

  S.summary(`${P}-rules`, "The simplex rules", [
    "Pivot column: the most negative entry in the bottom row.",
    "Pivot row: the smallest ratio, right-hand side divided by the positive entries in that column.",
    "Divide the pivot row by the pivot. Take away multiples of it from every other row.",
    "Stop when the bottom row has no negatives. A column with a single 1 is a variable that is not zero: its value is on the right, in the row of the 1. Every other variable is 0.",
  ]),

  S.summary(`${P}-mistakes`, "Watch out", [
    "Ratios: only for positive entries in the pivot column.",
    "Update the bottom row too: it is a row like the others.",
    "A variable whose column is not a single 1 is 0, even if you were using it a step ago.",
    "Stopping early: check the whole bottom row, not just the first entry.",
  ]),
];

export default () => ({
  id: ID, title: "The simplex algorithm: what is the table doing?", strand: "Decision Mathematics", questionVersion: 2,
  summary: "One worked problem from start to finish: slack variables, the starting table, which way to go (the bottom row), how far (the ratios), the row operations that move to the next corner, the trade-off in the new bottom row, and when to stop. A graph beside the table shows the walk from corner to corner.",
  tool: "lp-simplex", toolPath: "/lp-simplex",
  slides,
});
