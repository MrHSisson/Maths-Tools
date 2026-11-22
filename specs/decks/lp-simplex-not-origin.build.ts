// Build script for the "When the origin is not allowed" deck (plan: specs/decks/lp-simplex-not-origin.md): stage 6 of the simplex roadmap (docs/roadmaps/linear-programming.md).
// One worked problem (the earlier deck's, with "at least 3 in total" added), then a minimise, a lower bound and an equality, each with a graph beside the table.
// Every number on a slide is computed here by the real engine (src/shared/decision/lpSimplex.ts) or by brute force, and asserted against what the slide says.
//   npm run deck -- build specs/decks/lp-simplex-not-origin.build.ts [--replace]
//   npm run deck -- check lp-simplex-not-origin --layout
import { LOOK, S, lineEl, makeSlide, textEl, titleEls } from "/src/decks/builder";
import { type Fr } from "/src/shared/decision/dim";
import { type Tab, runSpec } from "/src/shared/decision/lpSimplex";
import type { Slide } from "/src/decks/types";

const ID = "lp-simplex-not-origin";
const P = "no";
const { grey } = LOOK;
const t = textEl;
const must = (ok: boolean, msg: string) => { if (!ok) throw new Error(`plan check failed: ${msg}`); };

// ── problem A: the earlier deck's problem with "at least 3 in total" added ───
const specA = { sense: "max" as const, c: [2, 3], cons: [{ a: [2, 1], op: "≤" as const, b: 10 }, { a: [1, 2], op: "≤" as const, b: 8 }, { a: [1, 1], op: "≥" as const, b: 3 }] };
const runA = runSpec(specA);
const [A0, A1, A2, A3] = runA.tabs;
const COLS_A = ["P", "x", "y", "s_1", "s_2", "s_3"];
const rhsOf = (tab: Tab, r: number): number => Number(tab.rows[r][tab.rows[r].length - 1][0]) / Number(tab.rows[r][tab.rows[r].length - 1][1]);
/** the value of the variable in column `col`: its row's right-hand side if its column is a unit column of the basis, else 0 */
const valueOf = (tab: Tab, col: number): number => { const r = tab.basis.indexOf(col); return r < 0 ? 0 : rhsOf(tab, r + 1); };
const cornerOf = (tab: Tab): [number, number] => [valueOf(tab, 1), valueOf(tab, 2)];
must(runA.iters.length === 3 && runA.iters[0].start === true, "A: three iterations, the first is the start");
must(runA.iters[0].row === 3 && runA.iters[0].col === 1, "A: the first pivot is in the ≥ row, the x column");
must(rhsOf(A0, 3) === -3, "A: the starting table has -3 in the ≥ row");
must(JSON.stringify([A1, A2, A3].map(cornerOf)) === JSON.stringify([[3, 0], [5, 0], [4, 2]]), "A: the walk is (3, 0), (5, 0), (4, 2)");
must(rhsOf(A1, 0) === 6 && rhsOf(A2, 0) === 10 && rhsOf(A3, 0) === 14, "A: P is 6, 10, 14");
must(rhsOf(A1, 1) === 4 && rhsOf(A1, 2) === 5 && rhsOf(A1, 3) === 3, "A: after the first pivot s1 = 4, s2 = 5, x = 3");
const cornersA: Array<[number, number, number]> = [[3, 0, 6], [5, 0, 10], [4, 2, 14], [0, 4, 12], [0, 3, 9]];
for (const [x, y, p] of cornersA) must(2 * x + 3 * y === p && 2 * x + y <= 10 && x + 2 * y <= 8 && x + y >= 3, `A: corner (${x}, ${y})`);
must(!(0 + 0 >= 3), "A: the origin fails x + y >= 3");
// the other choice of pivot, on y: the corner (0, 3), and every right-hand side is still positive
must(10 - 3 === 7 && 8 - 2 * 3 === 2 && 2 * 0 + 3 * 3 === 9, "A: pivoting on y gives y = 3, s1 = 7, s2 = 2, P = 9");
const inOut = (run: ReturnType<typeof runSpec>, cols: string[], k: number): string => {
  const it = run.iters[k];
  return `${cols[it.col]} \\text{ in, } ${cols[run.tabs[k].basis[it.row - 1]]} \\text{ out}`;
};
must(inOut(runA, COLS_A, 0) === "x \\text{ in, } s_3 \\text{ out}" && inOut(runA, COLS_A, 1) === "s_3 \\text{ in, } s_1 \\text{ out}" && inOut(runA, COLS_A, 2) === "y \\text{ in, } s_2 \\text{ out}", "A: the entering and leaving variables");

// ── problem B: minimise, with the same warning sign ──────────────────────────
const specB = { sense: "min" as const, c: [3, 2], cons: [{ a: [1, 1], op: "≥" as const, b: 4 }, { a: [1, 1], op: "≤" as const, b: 6 }] };
const runB = runSpec(specB);
const [B0, B1, B2] = runB.tabs;
const COLS_B = ["P", "x", "y", "s_1", "s_2"];
must(runB.iters.length === 2 && runB.iters[0].start === true, "B: two iterations, the first is the start");
must(B0.rows[0].slice(1, 3).every((f) => f[0] >= 0) && rhsOf(B0, 1) === -4, "B: the bottom row has no negatives but the right-hand side has -4");
must(JSON.stringify([B1, B2].map(cornerOf)) === JSON.stringify([[4, 0], [0, 4]]), "B: the walk is (4, 0) then (0, 4)");
must(rhsOf(B1, 0) === -12 && rhsOf(B2, 0) === -8, "B: P = -12 then -8, so C = 12 then 8");
must(inOut(runB, COLS_B, 0) === "x \\text{ in, } s_1 \\text{ out}" && inOut(runB, COLS_B, 1) === "y \\text{ in, } x \\text{ out}", "B: the entering and leaving variables");
const cornersB: Array<[number, number, number]> = [[4, 0, 12], [6, 0, 18], [0, 6, 12], [0, 4, 8]];
for (const [x, y, c] of cornersB) must(3 * x + 2 * y === c && x + y >= 4 && x + y <= 6, `B: corner (${x}, ${y})`);
must(Math.min(...cornersB.map((c) => c[2])) === 8, "B: the minimum of C is 8");

// ── problem C: a lower bound, y >= 1, on the earlier problem ─────────────────
const runC = runSpec({ sense: "max" as const, c: [2, 3], cons: [{ a: [2, 1], op: "≤" as const, b: 9 }, { a: [1, 2], op: "≤" as const, b: 6 }] });
const fC = runC.tabs[runC.tabs.length - 1];
must(valueOf(fC, 1) === 4 && valueOf(fC, 2) === 1 && rhsOf(fC, 0) === 11, "C: with Y = y - 1 the optimum is x = 4, Y = 1, P' = 11");
must(11 + 3 === 14 && 1 + 1 === 2, "C: P = 11 + 3 = 14 and y = Y + 1 = 2, the same optimum");
must(2 * 4.5 + 1 === 10 && 4.5 + 2 * 1 <= 8, "C: the corner (4.5, 1)");
for (const [x, Y] of [[0, 0], [4.5, 0], [4, 1], [0, 3]] as Array<[number, number]>) must(2 * x + Y <= 9 && x + 2 * Y <= 6 && 2 * x + (Y + 1) <= 10 && x + 2 * (Y + 1) <= 8, `C: the corner (x, Y) = (${x}, ${Y})`);
must(2 * 4.5 + 0 === 9 && 4 + 2 * 1 === 6 && 2 * 4 + 1 === 9 && 0 + 2 * 3 === 6, "C: the corners lie on the new lines");

// ── problem D: an equality, x + y = 5, on the earlier problem ────────────────
must(2 + 3 === 5 && 2 + 2 * 3 === 8 && 2 * 5 + 0 === 10 && 5 + 0 === 5, "D: the line x + y = 5 meets the region from (2, 3) to (5, 0)");
must(2 * 2 + 3 * 3 === 13 && 2 * 5 === 10 && Math.max(13, 10) === 13, "D: P = 13 at (2, 3) is the best");

// ── tableaux as maths ────────────────────────────────────────────────────────
const F = (f: Fr): string => (f[1] === 1 ? String(f[0]) : `${f[0] < 0 ? "-" : ""}\\tfrac{${Math.abs(f[0])}}{${f[1]}}`);
const YELLOW = "#fde047";
const BLUE = "#1d4ed8";
const RED = "#b91c1c";
const GREEN = "#15803d";
const ORANGE = "#c2410c";
const PURPLE = "#7c3aed";
/** a tableau (no basic-variable column); `negRow` colours the row with the negative right-hand side red, `pivot` marks one cell, `hiRow` colours a row blue */
function tabTex(tab: Tab, cols: string[], o: { pivot?: [number, number]; negRow?: number; hiRow?: number } = {}): string {
  const n = cols.length;
  const cell = (i: number, j: number): string => {
    const s = F(tab.rows[i][j]);
    if (o.pivot && o.pivot[0] === i && o.pivot[1] === j) return `\\colorbox{${YELLOW}}{$\\;${s}\\;$}`;
    if (o.negRow === i && j === n) return `\\textcolor{${RED}}{\\mathbf{${s}}}`;
    if (o.hiRow === i) return `\\textcolor{${BLUE}}{${s}}`;
    return s;
  };
  const head = `${cols.join("&")}&\\text{RHS}`;
  const rows = tab.rows.map((_, i) => `${Array.from({ length: n }, (_, j) => cell(i, j)).join("&")}&${cell(i, n)}`);
  return `\\begin{array}{${"c".repeat(n)}|c}${head}\\\\[0.6ex]\\hline ${rows[0]}\\\\[0.8ex]\\hline ${rows.slice(1).join("\\\\[1ex]")}\\end{array}`;
}
/** the row operations of one iteration, written from the engine's own operations */
function ops(run: ReturnType<typeof runSpec>, k: number): string[] {
  const it = run.iters[k];
  const out: string[] = [`\\mathrm{NPR} = \\mathrm{R}${it.row + 1} \\div ${it.pivot[0] < 0 ? `(${it.pivot[0]})` : it.pivot[0]}`];
  for (const o of it.ops) {
    const f = o.factor;
    const mag = f[1] === 1 ? String(Math.abs(f[0])) : `\\tfrac{${Math.abs(f[0])}}{${f[1]}}`;
    out.push(`\\mathrm{R}${o.row + 1} ${f[0] > 0 ? "-" : "+"} ${mag === "1" ? "" : mag + " \\times "}\\mathrm{NPR}`);
  }
  return out;
}
const OPS_A = ops(runA, 0);
must(OPS_A.length === 4, "A: the first iteration is a pivot row and three row operations");
const maths = (x: number, y: number, w: number, h: number, latex: string, size: number, more: Record<string, unknown> = {}) =>
  ({ kind: "maths", x, y, w, h, latex, size, ...more }) as never;
const ml = (x: number, y: number, w: number, h: number, latex: string, size = 48, more: Record<string, unknown> = {}) => maths(x, y, w, h, latex, size, { align: "left", ...more });

// ── graphs: a shaded region, lines, corners and the walk ─────────────────────
/** a graph with its origin at (ox, oy) and `sc` slide units to a graph unit */
function frame(sc: number, ox: number, oy: number) {
  const px = (x: number) => ox + sc * x, py = (y: number) => oy - sc * y;
  const dot = (x: number, y: number, c: string, step = 0, r = 12) => ({ kind: "shape", shape: "ellipse", x: px(x) - r, y: py(y) - r, w: 2 * r, h: 2 * r, fill: c, stroke: c, strokeWidth: 2, ...(step ? { step } : {}) }) as never;
  const seg = (x1: number, y1: number, x2: number, y2: number, colour: string, width: number, step = 0, arrow = false) =>
    lineEl(px(x1), py(y1), px(x2) - px(x1), py(y2) - py(y1), { colour, width, ...(arrow ? { arrow: true } : {}), ...(step ? { step } : {}) });
  /** the feasible region as a shaded picture: a polygon in graph units, drawn as an image the size of its bounding box */
  const region = (points: Array<[number, number]>, fill = "#93c5fd"): unknown => {
    const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const w = (x1 - x0) * sc, h = (y1 - y0) * sc;
    const pts = points.map(([x, y]) => `${(x - x0) * sc},${(y1 - y) * sc}`).join(" ");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polygon points="${pts}" fill="${fill}" fill-opacity="0.55"/></svg>`;
    return { kind: "image", x: px(x0), y: py(y1), w, h, src: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` } as never;
  };
  const axes = (mx: number, my: number): unknown[] => [
    seg(0, 0, mx, 0, LOOK.ink, 6), seg(0, 0, 0, my, LOOK.ink, 6),
    t(px(mx) + 5, py(0) - 26, 60, 50, "$x$", 40, { colour: LOOK.ink }), t(px(0) + 16, py(my) - 24, 60, 50, "$y$", 40, { colour: LOOK.ink }),
  ];
  /** a label placed beside a point: below it, or to its left (right-aligned) */
  const tag = (x: number, y: number, text: string, colour: string, side: "below" | "left" | "above-right" | "below-left", step = 0): unknown => {
    const o = { colour, bold: true, ...(step ? { step } : {}) };
    if (side === "left") return t(px(x) - 270, py(y) - 22, 240, 46, text, 30, { ...o, align: "right" });
    if (side === "below-left") return t(px(x) - 270, py(y) + 34, 240, 46, text, 30, { ...o, align: "right" });
    if (side === "above-right") return t(px(x) + 24, py(y) - 76, 240, 46, text, 30, { ...o, align: "left" });
    return t(px(x) - 30, py(y) + 20, 240, 46, text, 30, { ...o, align: "left" });
  };
  return { px, py, dot, seg, region, axes, tag };
}

// the graph of the earlier problem, at the right of the slide
const GA = frame(100, 985, 790);
interface Walk { from: [number, number]; to: [number, number]; step?: number }
interface AOpts {
  /** the shaded region: with the origin in it, or with it cut off by x + y >= 3 */
  shade?: "origin" | "cut";
  /** the new limit's line (true: with the slide; a number: on that click) */
  orange?: boolean | number;
  /** the names of the limits */
  labels?: boolean;
  /** the origin: allowed (green) or not (red), with its words, from a click */
  origin?: { ok: boolean; step?: number; words?: boolean };
  dots?: Array<{ at: [number, number]; colour: string; step?: number; tag?: string; side?: "below" | "left" | "above-right" }>;
  walk?: Walk[];
}
function graphA(o: AOpts = {}): unknown[] {
  const { px, py, dot, seg, region, axes, tag } = GA;
  const els: unknown[] = [];
  if (o.shade === "origin") els.push(region([[0, 0], [5, 0], [4, 2], [0, 4]]));
  if (o.shade === "cut") els.push(region([[3, 0], [5, 0], [4, 2], [0, 4], [0, 3]]));
  els.push(...axes(5.4, 4.6), seg(5, 0, 2.75, 4.5, BLUE, 7), seg(0, 4, 5.3, 1.35, PURPLE, 7));
  if (o.labels !== false) els.push(t(px(2.9), py(4.55) - 8, 300, 44, "$2x + y = 10$", 30, { colour: BLUE, bold: true }), t(px(4.2), py(2.6), 330, 44, "$x + 2y = 8$", 30, { colour: PURPLE, bold: true, align: "left" }));
  if (o.orange !== undefined && o.orange !== false) {
    const step = typeof o.orange === "number" ? o.orange : 0;
    els.push(seg(3.4, -0.4, 0, 3, ORANGE, 7, step), t(px(0.1), py(0.95), 330, 44, "$x + y = 3$", 30, { colour: ORANGE, bold: true, align: "left", ...(step ? { step } : {}) }));
  }
  for (const w of o.walk ?? []) els.push(seg(w.from[0], w.from[1], w.to[0], w.to[1], GREEN, 12, w.step ?? 0, true));
  for (const d of o.dots ?? []) {
    els.push(dot(d.at[0], d.at[1], d.colour, d.step ?? 0, 15));
    if (d.tag) els.push(tag(d.at[0], d.at[1], d.tag, d.colour, d.side ?? "below", d.step ?? 0));
  }
  if (o.origin) {
    const c = o.origin.ok ? GREEN : RED, step = o.origin.step ?? 0;
    els.push(dot(0, 0, c, step, 15));
    if (o.origin.words) els.push(t(px(0.25), py(0) + 22, 420, 46, o.origin.ok ? "$(0, 0)$ is allowed" : "$(0, 0)$ is not allowed", 30, { colour: c, bold: true, align: "left", ...(step ? { step } : {}) }));
  }
  return els;
}

const slide = (id: string, title: string, els: unknown[], brief?: string): Slide => makeSlide(id, "teach", title, els as never, brief);
const left = (text: string, y = 250, h = 560, size = 42, more: Record<string, unknown> = {}) => t(60, y, 880, h, text, size, more);

// ── the slides ───────────────────────────────────────────────────────────────
const slides: Slide[] = [
  S.title(`${P}-title`, "When the origin is not allowed", "Starting the simplex from a ≥ limit or a minimise"),
  S.objective(`${P}-objective`, "Explain why the simplex needs a changed start, and make the change.", [
    "See why a ≥ limit can make the origin not allowed",
    "Use the first pivot to get onto the region",
    "Minimise by maximising −C",
  ]),

  slide(`${P}-start`, "Where the simplex starts", [
    ...titleEls("Where the simplex starts", "At the origin, the corner where $x = 0$ and $y = 0$"),
    ml(60, 250, 880, 340, "\\begin{array}{l}\\text{Maximise } P = 2x + 3y\\\\[2ex]2x + y \\le 10\\\\[1ex] x + 2y \\le 8\\\\[1ex] x \\ge 0,\\; y \\ge 0\\end{array}", 56),
    left("The origin is in the region, so the table can start there.", 640, 130, 42, { step: 1 }),
    t(60, 790, 880, 90, "This is the problem from the last lesson.", 38, { colour: grey, step: 2 }),
    ...graphA({ shade: "origin", origin: { ok: true, step: 1, words: true } }),
  ], "Recap: the earlier deck's problem. The origin is a corner of the region, so the table can start there."),

  slide(`${P}-origin`, "Is the origin allowed?", [
    ...titleEls("Is the origin allowed?", "A new limit: at least 3 items in total"),
    ml(60, 250, 880, 360, "\\begin{array}{l}2x + y \\le 10\\\\[1.2ex] x + 2y \\le 8\\\\[1.2ex] \\textcolor{" + ORANGE + "}{x + y \\ge 3}\\\\[1.2ex] x \\ge 0,\\; y \\ge 0\\end{array}", 58),
    left("Test the origin in the new limit:", 640, 70, 40, { colour: grey, step: 1 }),
    ml(60, 720, 880, 100, "0 + 0 \\ge 3 \\quad \\textcolor{" + RED + "}{\\text{false}}", 62, { step: 2 }),
    ...graphA({ shade: "cut", orange: true, origin: { ok: false, step: 2, words: true } }),
  ], "The new limit cuts the origin off. The shaded region is what is allowed."),

  slide(`${P}-flip`, "Writing a ≥ limit for the table", [
    ...titleEls("Writing a ≥ limit for the table", "The table only has ≤ limits, so turn it round"),
    ml(60, 260, 880, 130, "x + y \\ge 3", 64),
    ml(60, 400, 880, 130, "-x - y \\le -3 \\quad \\text{(multiply by } -1\\text{)}", 50, { step: 1 }),
    left("Multiplying by $-1$ flips the sign: $\\ge$ becomes $\\le$.", 560, 100, 40, { colour: grey, step: 2 }),
    ml(60, 690, 880, 130, "-x - y + s_3 = -3", 64, { step: 3 }),
    t(60, 830, 880, 70, "Now it has a slack variable, like the other two.", 38, { colour: grey, step: 3 }),
    ...graphA({ shade: "cut", orange: true }),
  ], "The same limit, written the way the table needs it. The right-hand side becomes negative: that is the point of the next slide."),

  slide(`${P}-table0`, "The table says the same", [
    ...titleEls("The table says the same", "Read the right-hand side"),
    maths(40, 250, 900, 340, tabTex(A0, COLS_A, { negRow: 3 }), 52),
    t(60, 620, 880, 100, "$s_3 = -3$: we would have $-3$ left over. That cannot happen.", 42, { step: 1 }),
    t(60, 740, 880, 130, "A negative right-hand side means this start is not allowed.", 44, { bold: true, step: 2 }),
    ...graphA({ shade: "cut", orange: true, origin: { ok: false, words: true } }),
  ], "The start is still x = 0, y = 0, which is exactly why s3 comes out negative."),

  slide(`${P}-which`, "Which entry do we pivot on?", [
    ...titleEls("Which entry do we pivot on?", "In the row with the negative right-hand side"),
    ml(60, 250, 880, 100, "-x - y + s_3 = -3", 54),
    left("Pick a negative entry in this row: the $x$ entry or the $y$ entry. Both are $-1$.", 370, 130, 40, { step: 1 }),
    t(60, 520, 420, 50, "Pivot on $x$", 40, { bold: true, colour: GREEN, step: 2 }),
    t(60, 575, 420, 160, "$x = 3$, $s_1 = 4$, $s_2 = 5$\nEvery right-hand side is positive.", 34, { step: 2 }),
    t(510, 520, 420, 50, "Pivot on $y$", 40, { bold: true, colour: ORANGE, step: 3 }),
    t(510, 575, 420, 160, "$y = 3$, $s_1 = 7$, $s_2 = 2$\nEvery right-hand side is positive.", 34, { step: 3 }),
    t(60, 780, 880, 100, "Either works. We take $x$. If a right-hand side would go negative, try the other entry.", 38, { bold: true, step: 4 }),
    ...graphA({ shade: "cut", orange: true, dots: [{ at: [3, 0], colour: GREEN, step: 2, tag: "$(3, 0)$" }, { at: [0, 3], colour: ORANGE, step: 3, tag: "$(0, 3)$", side: "left" }] }),
  ], "Either negative entry gives a corner of the region here. In general the new right-hand sides must all be positive; if one would be negative, try another entry."),

  slide(`${P}-move`, "Moving onto the region", [
    ...titleEls("Moving onto the region", "Divide the pivot row, then clear the column"),
    ml(60, 235, 880, 215, `\\begin{array}{l}${OPS_A[0]} \\quad \\text{(divide the pivot row)}\\\\[1ex] ${OPS_A[1]}\\\\[1ex] ${OPS_A[2]}\\\\[1ex] ${OPS_A[3]}\\end{array}`, 38),
    maths(40, 470, 900, 320, tabTex(A1, COLS_A, { hiRow: 3 }), 52, { step: 1 }),
    t(60, 795, 880, 100, "Every right-hand side is positive: $x = 3$, $y = 0$, $P = 6$. We are on the region.", 40, { bold: true, step: 2 }),
    ...graphA({ shade: "cut", orange: true, origin: { ok: false, words: false }, walk: [{ from: [0.15, 0], to: [2.8, 0], step: 2 }], dots: [{ at: [3, 0], colour: GREEN, step: 2, tag: "$(3, 0)$" }] }),
  ], "The first pivot's job is only to get onto the region. After it, the algorithm carries on as before."),

  slide(`${P}-why`, "What did the pivot do?", [
    ...titleEls("What did the pivot do?", "It took $s_3$ out of the table"),
    left("Before: $s_3 = -3$. The limit $x + y \\ge 3$ was broken.", 250, 110, 42),
    left("After: $s_3 = 0$, so $x + y = 3$ exactly. The limit is used up, and we are on its line.", 400, 190, 42, { step: 1 }),
    left("$x$ came in to take its place, along the $x$ axis, until it met the limit at $(3, 0)$.", 630, 190, 42, { step: 2 }),
    ...graphA({ shade: "cut", orange: true, origin: { ok: false }, walk: [{ from: [0.15, 0], to: [2.8, 0], step: 2 }], dots: [{ at: [3, 0], colour: GREEN, step: 1, tag: "$(3, 0)$" }] }),
  ], "Why it works: a negative slack is a broken limit; making it zero puts us exactly on the limit's line."),

  slide(`${P}-carry`, "Then carry on as before", [
    ...titleEls("Then carry on as before", "From the region, the usual steps"),
    maths(40, 250, 900, 320, `\\begin{array}{c|c|c|c}\\text{step}&\\text{in / out}&\\text{corner}&P\\\\\\hline \\text{start}&&(0,0) \\text{ not allowed}&\\\\ 1&${inOut(runA, COLS_A, 0)}&(3,0)&6\\\\ 2&${inOut(runA, COLS_A, 1)}&(5,0)&10\\\\ 3&${inOut(runA, COLS_A, 2)}&(4,2)&14\\end{array}`, 40),
    t(60, 620, 880, 100, "After the first pivot: the most negative entry, then the smallest ratio.", 40, { step: 1 }),
    t(60, 740, 880, 130, "Maximum: $P = 14$ at $x = 4$, $y = 2$. The same as before: the new limit was never the one that mattered.", 40, { bold: true, step: 2 }),
    ...graphA({ shade: "cut", orange: true, walk: [{ from: [3, 0], to: [4.85, 0] }, { from: [5, 0], to: [4.1, 1.8] }], dots: [{ at: [3, 0], colour: GREEN }, { at: [5, 0], colour: GREEN }, { at: [4, 2], colour: GREEN }] }),
  ], "The first pivot gets onto the region; the rest is the algorithm from the earlier deck."),

  // ── minimising ─────────────────────────────────────────────────────────────
  (() => {
    const g = frame(88, 985, 770);
    const els: unknown[] = [
      g.region([[4, 0], [6, 0], [0, 6], [0, 4]]),
      ...g.axes(6.4, 6.4), g.seg(4.4, -0.4, 0, 4, ORANGE, 7), g.seg(6.4, -0.4, 0, 6, BLUE, 7),
      t(g.px(0.3), g.py(1.6), 300, 44, "$x + y = 4$", 30, { colour: ORANGE, bold: true, align: "left" }), t(g.px(3.5), g.py(3.7), 300, 44, "$x + y = 6$", 30, { colour: BLUE, bold: true, align: "left" }),
    ];
    // each corner with its C, and (on the next click) its P = -C
    const lab: Array<[number, number, string, string]> = [[4, 0, "12", "-12"], [6, 0, "18", "-18"], [0, 6, "12", "-12"], [0, 4, "8", "-8"]];
    lab.forEach(([x, y, c, p], i) => {
      els.push(g.dot(x, y, LOOK.ink, 1, 11));
      const lx = i === 2 || i === 3 ? g.px(x) - 310 : g.px(x) - 90, ly = i === 2 || i === 3 ? g.py(y) - 56 : g.py(y) + 18;
      const al = i === 2 || i === 3 ? "right" : "left";
      els.push(t(lx, ly, 250, 46, `$C = ${c}$`, 30, { colour: LOOK.ink, align: al, step: 1 }), t(lx, ly + 40, 250, 46, `$P = ${p}$`, 30, { colour: grey, bold: true, align: al, step: 2 }));
    });
    els.push(g.dot(0, 4, GREEN, 3, 17));
    return slide(`${P}-min`, "Minimising", [
      ...titleEls("Minimising", "Smallest $C$ is the same as largest $-C$"),
      ml(60, 250, 880, 190, "\\begin{array}{l}\\text{Minimise } C = 3x + 2y\\\\[1.4ex] x + y \\ge 4\\\\[1ex] x + y \\le 6\\end{array}", 48),
      t(60, 470, 880, 100, "The table maximises, so we give it $P = -C$.", 42, { step: 2 }),
      t(60, 590, 880, 140, "$-8$ is bigger than $-12$ and $-18$. The largest $P$ is the smallest $C$.", 42, { step: 2 }),
      t(60, 760, 880, 110, "Smallest $C$: $8$, at $(0, 4)$.", 46, { bold: true, step: 3 }),
      ...els,
    ], "Minimise C = 3x + 2y on a strip. Check each corner by hand: C is 12, 18, 12 and 8. P = −C turns the smallest C into the largest P.");
  })(),

  (() => {
    const g = frame(88, 985, 770);
    const els: unknown[] = [
      g.region([[4, 0], [6, 0], [0, 6], [0, 4]]),
      ...g.axes(6.4, 6.4), g.seg(4.4, -0.4, 0, 4, ORANGE, 7), g.seg(6.4, -0.4, 0, 6, BLUE, 7),
      t(g.px(0.3), g.py(1.6), 300, 44, "$x + y = 4$", 30, { colour: ORANGE, bold: true, align: "left" }), t(g.px(3.5), g.py(3.7), 300, 44, "$x + y = 6$", 30, { colour: BLUE, bold: true, align: "left" }),
      g.dot(0, 0, RED, 0, 15), t(g.px(0.25), g.py(0) + 22, 420, 46, "$(0, 0)$ is not allowed", 30, { colour: RED, bold: true, align: "left" }),
    ];
    return slide(`${P}-two`, "Minimising: two signals", [
      ...titleEls("Minimising: two signals", "Maximise $P = -C$, and look at the table"),
      maths(40, 240, 900, 330, tabTex(B0, COLS_B, { negRow: 1, hiRow: 0 }), 56),
      t(60, 600, 880, 70, "Bottom row: no negatives, so it says stop.", 42, { step: 1 }),
      t(60, 680, 880, 70, "Right-hand side: $-4$, so it says this start is not allowed.", 42, { colour: RED, step: 2 }),
      t(60, 780, 880, 100, "The right-hand side comes first: we have not got a corner to stop at.", 42, { bold: true, step: 3 }),
      ...els,
    ], "Minimise C = 3x + 2y subject to x + y ≥ 4 and x + y ≤ 6, as maximise P = −C. The bottom row has no negatives at the start, which is the trap.");
  })(),

  (() => {
    const g = frame(88, 985, 770);
    const els: unknown[] = [
      g.region([[4, 0], [6, 0], [0, 6], [0, 4]]),
      ...g.axes(6.4, 6.4), g.seg(4.4, -0.4, 0, 4, ORANGE, 7), g.seg(6.4, -0.4, 0, 6, BLUE, 7),
      g.seg(0.15, 0, 3.8, 0, GREEN, 12, 0, true), g.seg(3.9, 0.1, 0.1, 3.9, GREEN, 12, 1, true),
      g.dot(4, 0, GREEN, 0, 15), g.dot(0, 4, GREEN, 1, 15),
      t(g.px(4) - 30, g.py(0) + 20, 240, 46, "$(4, 0)$", 30, { colour: GREEN, bold: true, align: "left" }),
      t(g.px(0) - 270, g.py(4) - 22, 240, 46, "$(0, 4)$", 30, { colour: GREEN, bold: true, align: "right", step: 1 }),
    ];
    return slide(`${P}-answer`, "The answer, with its sign", [
      ...titleEls("The answer, with its sign", "The table answers for $P$, not $C$"),
      maths(40, 250, 900, 300, `\\begin{array}{c|c|c|c}\\text{step}&\\text{in / out}&\\text{corner}&P\\\\\\hline 1&${inOut(runB, COLS_B, 0)}&(4,0)&-12\\\\ 2&${inOut(runB, COLS_B, 1)}&(0,4)&-8\\end{array}`, 44),
      t(60, 590, 880, 100, "No negatives left in the bottom row: $P = -8$ is the maximum.", 42, { step: 1 }),
      t(60, 710, 880, 150, "$C = -P = 8$. The minimum cost is $8$, at $x = 0$, $y = 4$.", 46, { bold: true, step: 2 }),
      ...els,
    ], "Two pivots from the start: (4, 0) with P = −12, then (0, 4) with P = −8. The minimum of C is 8, not −8.");
  })(),

  // ── the two other starts that miss the origin ──────────────────────────────
  (() => {
    const g = frame(100, 985, 790);
    const els: unknown[] = [
      g.region([[0, 1], [4.5, 1], [4, 2], [0, 4]]),
      ...g.axes(5.4, 4.6), g.seg(5, 0, 2.75, 4.5, BLUE, 7), g.seg(0, 4, 5.3, 1.35, PURPLE, 7), g.seg(-0.2, 1, 5.2, 1, ORANGE, 7),
      t(g.px(2.9), g.py(4.55) - 8, 300, 44, "$2x + y = 10$", 30, { colour: BLUE, bold: true }), t(g.px(4.2), g.py(2.6), 330, 44, "$x + 2y = 8$", 30, { colour: PURPLE, bold: true, align: "left" }),
      t(g.px(3.3), g.py(1) + 14, 330, 44, "$y = 1$", 30, { colour: ORANGE, bold: true, align: "left" }),
      g.dot(0, 0, RED, 0, 15), g.dot(0, 1, GREEN, 3, 15),
      t(g.px(0.25), g.py(0) + 22, 420, 46, "$(0, 0)$ is not allowed", 30, { colour: RED, bold: true, align: "left" }),
      t(g.px(0.25), g.py(1) + 14, 330, 44, "new origin", 30, { colour: GREEN, bold: true, align: "left", step: 3 }),
    ];
    return slide(`${P}-lower`, "A lower bound moves the origin", [
      ...titleEls("A lower bound moves the origin", "Say $y \\ge 1$ on the earlier problem"),
      ml(60, 245, 880, 100, "\\text{Let } Y = y - 1, \\text{ so } y = Y + 1 \\text{ and } Y \\ge 0", 38),
      ml(60, 370, 880, 270, "\\begin{array}{l}2x + (Y + 1) \\le 10 \\;\\to\\; 2x + Y \\le 9\\\\[1.2ex] x + 2(Y + 1) \\le 8 \\;\\to\\; x + 2Y \\le 6\\\\[1.2ex] P = 2x + 3(Y + 1) = 2x + 3Y + 3\\end{array}", 38, { step: 1 }),
      t(60, 670, 880, 90, "The origin $(x, Y) = (0, 0)$ is allowed: it is $(0, 1)$ on our graph.", 40, { step: 3 }),
      t(60, 780, 880, 100, "Solve as usual: $x = 4$, $Y = 1$, so $y = 2$ and $P = 11 + 3 = 14$.", 40, { bold: true, step: 4 }),
      ...els,
    ], "A lower bound y ≥ 1 moves the origin to (0, 1). With Y = y − 1 the origin is allowed again and the problem is in standard form. The optimum is the same point as before, (4, 2), P = 14.");
  })(),

  // the same lower bound, redrawn in the new coordinates: Y is measured from the line y = 1, so the graph starts at 0
  (() => {
    const g = frame(100, 985, 790);
    const els: unknown[] = [
      g.region([[0, 0], [4.5, 0], [4, 1], [0, 3]]),
      ...g.axes(5.4, 3.9),
      g.seg(4.7, -0.4, 3.3, 2.4, BLUE, 7), g.seg(0, 3, 5.2, 0.4, PURPLE, 7),
      t(g.px(3.95), g.py(2.45), 330, 44, "$2x + Y = 9$", 30, { colour: BLUE, bold: true, align: "left" }), t(g.px(2.3), g.py(2.95), 330, 44, "$x + 2Y = 6$", 30, { colour: PURPLE, bold: true, align: "left" }),
      // the new axis is the old line y = 1: say so beside the axis
      t(g.px(0) - 260, g.py(0) - 22, 230, 46, "$Y = 0$, $y = 1$", 28, { colour: GREEN, bold: true, align: "right" }),
      t(g.px(0) - 260, g.py(3) - 22, 230, 46, "$Y = 3$, $y = 4$", 28, { colour: grey, bold: true, align: "right" }),
      g.dot(0, 0, GREEN, 0, 17),
      t(g.px(0.3), g.py(0) + 22, 420, 46, "starts at $(0, 0)$", 30, { colour: GREEN, bold: true, align: "left" }),
      g.dot(4, 1, GREEN, 3, 15), t(g.px(4) + 30, g.py(1) - 74, 240, 46, "$(4, 1)$", 30, { colour: GREEN, bold: true, align: "left", step: 3 }),
    ];
    return slide(`${P}-lower2`, "The new graph starts at 0", [
      ...titleEls("The new graph starts at 0", "Measure $Y$ up from the line $y = 1$"),
      t(60, 250, 640, 150, "$Y = y - 1$: the line $y = 1$ is now $Y = 0$, so it is the new $x$ axis.", 38),
      ml(60, 410, 640, 190, "\\begin{array}{l}2x + Y \\le 9\\\\[1ex] x + 2Y \\le 6\\\\[1ex] x \\ge 0,\\; Y \\ge 0\\end{array}", 46, { step: 1 }),
      t(60, 620, 640, 130, "The origin $(x, Y) = (0, 0)$ is allowed, so the table can start there.", 38, { step: 2 }),
      t(60, 760, 640, 120, "The best point is $(x, Y) = (4, 1)$, which is $(x, y) = (4, 2)$.", 38, { bold: true, step: 3 }),
      ...els,
    ], "The same problem in the new variables: the region is the same shape, with the line y = 1 as the x axis, so the origin is the corner (0, 1) of the old graph. The optimum (4, 1) in (x, Y) is (4, 2) in (x, y).");
  })(),

  (() => {
    const g = frame(100, 985, 790);
    const els: unknown[] = [
      ...g.axes(5.4, 4.6), g.seg(5, 0, 2.75, 4.5, BLUE, 7), g.seg(0, 4, 5.3, 1.35, PURPLE, 7), g.seg(5.2, -0.2, 0.4, 4.6, ORANGE, 7),
      t(g.px(2.9), g.py(4.55) - 8, 300, 44, "$2x + y = 10$", 30, { colour: BLUE, bold: true }), t(g.px(4.2), g.py(2.6), 330, 44, "$x + 2y = 8$", 30, { colour: PURPLE, bold: true, align: "left" }),
      t(g.px(0.1), g.py(0.95), 330, 44, "$x + y = 5$", 30, { colour: ORANGE, bold: true, align: "left" }),
      g.seg(2, 3, 5, 0, GREEN, 14, 1), g.dot(2, 3, GREEN, 1, 15), g.dot(5, 0, GREEN, 1, 15),
      t(g.px(2) - 270, g.py(3) + 34, 240, 46, "$(2, 3)$", 30, { colour: GREEN, bold: true, align: "right", step: 1 }),
      t(g.px(5) - 30, g.py(0) + 20, 240, 46, "$(5, 0)$", 30, { colour: GREEN, bold: true, align: "left", step: 1 }),
    ];
    return slide(`${P}-equal`, "An equality: the region is a line", [
      ...titleEls("An equality: the region is a line", "Say $x + y = 5$ on the earlier problem"),
      left("A point must be exactly on the line, so write it as two limits:", 250, 130, 40),
      ml(60, 400, 880, 150, "\\begin{array}{l}x + y \\le 5\\\\[1ex] x + y \\ge 5\\end{array}", 54, { step: 1 }),
      left("The $\\ge$ limit makes the start negative, so it is handled just as before.", 580, 130, 40, { step: 2 }),
      t(60, 740, 880, 140, "Only the line from $(2, 3)$ to $(5, 0)$ is allowed. Best: $P = 13$ at $(2, 3)$.", 42, { bold: true, step: 3 }),
      ...els,
    ], "An equality is both a ≤ and a ≥ limit. The region collapses to the line segment inside the other limits, from (2, 3) to (5, 0); P is 13 at (2, 3) and 10 at (5, 0).");
  })(),

  S.summary(`${P}-checks`, "Before you start the simplex", [
    "Maximise? If it is a minimise, use $P = -C$.",
    "Every limit ≤? A ≥ limit: multiply by −1, and the sign flips.",
    "A lower bound? Take it away: $Y = y - 1$. An equality? Write it as two limits.",
    "Any negative right-hand side? Pivot in that row on a negative entry, so every right-hand side ends positive. Then carry on as usual.",
  ]),

  S.summary(`${P}-mistakes`, "Watch out", [
    "Multiplying a ≥ limit by −1 also flips the sign.",
    "A negative right-hand side comes first, even if the bottom row has no negatives.",
    "After the first pivot, check every right-hand side is positive before carrying on.",
    "A minimise gives $P = -C$: the answer is $C = -P$, so the minimum is 8, not −8.",
  ]),
];

export default () => ({
  id: ID, title: "When the origin is not allowed", strand: "Decision Mathematics", questionVersion: 2,
  summary: "Why the simplex needs a changed start. A ≥ limit puts the origin outside the region, which the table shows as a negative right-hand side, and the first pivot moves onto the region; minimising by maximising −C; and the two other starts that miss the origin (a lower bound and an equality). A graph beside the table shows each move.",
  tool: "lp-simplex", toolPath: "/lp-simplex",
  slides,
});
