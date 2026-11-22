// Build script for the "When the origin is not allowed" deck (plan: specs/decks/lp-simplex-not-origin.md): stage 6 of the simplex roadmap (docs/roadmaps/linear-programming.md).
// The look-card version: a title and the four slides that carry the new look (the shaded region with the origin outside it, the starting table with a negative right-hand side,
// the first move onto the region, and the two signals when minimising). Every number is computed here by the real engine (src/shared/decision/lpSimplex.ts) and asserted.
//   npm run deck -- build specs/decks/lp-simplex-not-origin.build.ts --out .deck-work/lp-origin.json
//   npm run deck -- review lp-simplex-not-origin --file .deck-work/lp-origin.json
import { LOOK, S, lineEl, makeSlide, textEl, titleEls } from "/src/decks/builder";
import { type Fr } from "/src/shared/decision/dim";
import { type Tab, runSpec } from "/src/shared/decision/lpSimplex";
import type { Slide } from "/src/decks/types";

const ID = "lp-simplex-not-origin";
const P = "no";
const { grey } = LOOK;
const t = textEl;
const must = (ok: boolean, msg: string) => { if (!ok) throw new Error(`plan check failed: ${msg}`); };

// ── problem A: the earlier problem with "at least 3 in total" added ──────────
const specA = { sense: "max" as const, c: [2, 3], cons: [{ a: [2, 1], op: "≤" as const, b: 10 }, { a: [1, 2], op: "≤" as const, b: 8 }, { a: [1, 1], op: "≥" as const, b: 3 }] };
const runA = runSpec(specA);
const [A0, A1] = runA.tabs;
must(runA.iters.length === 3 && runA.iters[0].start === true, "A: three iterations, the first is the start");
must(runA.iters[0].row === 3 && runA.iters[0].col === 1, "A: the first pivot is in the ≥ row, the x column");
const rhs = (tab: Tab, r: number): string => `${tab.rows[r][tab.rows[r].length - 1][0]}/${tab.rows[r][tab.rows[r].length - 1][1]}`;
must(rhs(A0, 3) === "-3/1", "A: the starting table has -3 in the ≥ row");
must(rhs(A1, 0) === "6/1" && rhs(A1, 3) === "3/1" && A1.basis[2] === 1, "A: after the first pivot x = 3 and P = 6");
const cornersA: Array<[number, number, number]> = [[3, 0, 6], [5, 0, 10], [4, 2, 14], [0, 4, 12], [0, 3, 9]];
for (const [x, y, p] of cornersA) must(2 * x + 3 * y === p && 2 * x + y <= 10 && x + 2 * y <= 8 && x + y >= 3, `A: corner (${x}, ${y})`);
must(!(0 + 0 >= 3), "A: the origin fails x + y >= 3");

// ── problem B: minimise, with the same warning sign ──────────────────────────
const specB = { sense: "min" as const, c: [3, 2], cons: [{ a: [1, 1], op: "≥" as const, b: 4 }, { a: [1, 1], op: "≤" as const, b: 6 }] };
const runB = runSpec(specB);
const [B0, B1, B2] = runB.tabs;
must(runB.iters.length === 2 && runB.iters[0].start === true, "B: two iterations, the first is the start");
must(B0.rows[0].slice(1, 3).every((f) => f[0] >= 0) && rhs(B0, 1) === "-4/1", "B: the bottom row has no negatives but the right-hand side has -4");
must(rhs(B2, 0) === "-8/1", "B: P = -8, so the minimum of C is 8");

// ── tableaux as maths ────────────────────────────────────────────────────────
const F = (f: Fr): string => (f[1] === 1 ? String(f[0]) : `${f[0] < 0 ? "-" : ""}\\tfrac{${Math.abs(f[0])}}{${f[1]}}`);
const COLS = ["P", "x", "y", "s_1", "s_2", "s_3"];
const YELLOW = "#fde047";
const BLUE = "#1d4ed8";
const RED = "#b91c1c";
/** a tableau with its basic-variable column; `negRow` colours the row with the negative right-hand side red, `pivot` marks one cell, `hiRow` colours a row blue */
function tabTex(tab: Tab, nCons: number, o: { pivot?: [number, number]; negRow?: number; hiRow?: number; cols?: string[] } = {}): string {
  const cols = (o.cols ?? COLS).slice(0, 3 + nCons);
  const n = cols.length;
  const cell = (i: number, j: number): string => {
    const s = F(tab.rows[i][j]);
    if (o.pivot && o.pivot[0] === i && o.pivot[1] === j) return `\\colorbox{${YELLOW}}{$\\;${s}\\;$}`;
    if (o.negRow === i && j === n) return `\\textcolor{${RED}}{\\mathbf{${s}}}`;
    if (o.hiRow === i) return `\\textcolor{${BLUE}}{${s}}`;
    return s;
  };
  const head = `\\text{basic}&${cols.join("&")}&\\text{RHS}`;
  const label = (i: number): string => (i === 0 ? "P" : cols[tab.basis[i - 1]]);
  const rows = tab.rows.map((_, i) => `${label(i)}&${Array.from({ length: n }, (_, j) => cell(i, j)).join("&")}&${cell(i, n)}`);
  return `\\begin{array}{c|${"c".repeat(n)}|c}${head}\\\\[0.6ex]\\hline ${rows[0]}\\\\[0.8ex]\\hline ${rows.slice(1).join("\\\\[1ex]")}\\end{array}`;
}
const maths = (x: number, y: number, w: number, h: number, latex: string, size: number, more: Record<string, unknown> = {}) =>
  ({ kind: "maths", x, y, w, h, latex, size, ...more }) as never;
const ml = (x: number, y: number, w: number, h: number, latex: string, size = 48, more: Record<string, unknown> = {}) => maths(x, y, w, h, latex, size, { align: "left", ...more });

// ── the graph: the shaded region, its corners, the origin ────────────────────
const OX = 985, OY = 790, SC = 100;
const px = (x: number) => OX + SC * x, py = (y: number) => OY - SC * y;
const dot = (x: number, y: number, c: string, step = 0, r = 12) => ({ kind: "shape", shape: "ellipse", x: px(x) - r, y: py(y) - r, w: 2 * r, h: 2 * r, fill: c, stroke: c, strokeWidth: 2, ...(step ? { step } : {}) }) as never;
const seg = (x1: number, y1: number, x2: number, y2: number, colour: string, width: number, step = 0, arrow = false) =>
  lineEl(px(x1), py(y1), px(x2) - px(x1), py(y2) - py(y1), { colour, width, ...(arrow ? { arrow: true } : {}), ...(step ? { step } : {}) });
/** the feasible region as a shaded picture: a polygon in graph units, drawn as an image the size of its bounding box */
function region(points: Array<[number, number]>, fill = "#93c5fd"): unknown {
  const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const w = (x1 - x0) * SC, h = (y1 - y0) * SC;
  const pts = points.map(([x, y]) => `${(x - x0) * SC},${(y1 - y) * SC}`).join(" ");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polygon points="${pts}" fill="${fill}" fill-opacity="0.55"/></svg>`;
  return { kind: "image", x: px(x0), y: py(y1), w, h, src: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` } as never;
}
const GREEN = "#15803d";
const ORANGE = "#c2410c";
function graphA(o: { origin?: number; jump?: number; at?: boolean; lines?: boolean } = {}) {
  const els: unknown[] = [
    region([[3, 0], [5, 0], [4, 2], [0, 4], [0, 3]]),
    seg(0, 0, 5.4, 0, LOOK.ink, 6), seg(0, 0, 0, 4.6, LOOK.ink, 6),
    t(px(5.45), py(0) - 26, 60, 50, "$x$", 40, { colour: LOOK.ink }), t(px(0) + 16, py(4.6) - 24, 60, 50, "$y$", 40, { colour: LOOK.ink }),
    seg(5, 0, 2.75, 4.5, BLUE, 7), seg(0, 4, 5.3, 1.35, "#7c3aed", 7), seg(3.4, -0.4, -0.4, 3.4, ORANGE, 7),
    t(px(2.9), py(4.55) - 8, 300, 44, "$2x + y = 10$", 30, { colour: BLUE, bold: true }), t(px(3.45), py(2.95), 330, 44, "$x + 2y = 8$", 30, { colour: "#7c3aed", bold: true }),
    t(px(1.0), py(1.35), 330, 44, "$x + y = 3$", 30, { colour: ORANGE, bold: true }),
  ];
  if (o.origin !== undefined) {
    els.push(dot(0, 0, RED, o.origin, 15));
    els.push(t(px(-0.35), py(0) + 22, 420, 46, "$(0, 0)$ is not allowed", 30, { colour: RED, bold: true, align: "left", ...(o.origin ? { step: o.origin } : {}) }));
  }
  if (o.jump !== undefined) els.push(seg(0.15, 0, 2.8, 0, GREEN, 12, o.jump, true));
  if (o.at) els.push(dot(3, 0, GREEN, o.jump ?? 0, 18), t(px(3) - 10, py(0) + 70, 160, 46, "$(3, 0)$", 30, { colour: GREEN, bold: true, ...(o.jump ? { step: o.jump } : {}) }));
  return els;
}
/** problem B: the strip between x + y = 4 and x + y = 6 */
function graphB(o: { at?: [number, number]; jump?: boolean } = {}) {
  const S2 = 88, ox = 985, oy = 770;
  const qx = (x: number) => ox + S2 * x, qy = (y: number) => oy - S2 * y;
  const ln = (x1: number, y1: number, x2: number, y2: number, colour: string, width: number, step = 0, arrow = false) => lineEl(qx(x1), qy(y1), qx(x2) - qx(x1), qy(y2) - qy(y1), { colour, width, ...(arrow ? { arrow: true } : {}), ...(step ? { step } : {}) });
  const pts: Array<[number, number]> = [[4, 0], [6, 0], [0, 6], [0, 4]];
  const w = 6 * S2, h = 6 * S2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polygon points="${pts.map(([x, y]) => `${x * S2},${(6 - y) * S2}`).join(" ")}" fill="#93c5fd" fill-opacity="0.55"/></svg>`;
  const els: unknown[] = [
    { kind: "image", x: qx(0), y: qy(6), w, h, src: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` },
    ln(0, 0, 6.4, 0, LOOK.ink, 6), ln(0, 0, 0, 6.4, LOOK.ink, 6),
    t(qx(6.5), qy(0) - 26, 60, 50, "$x$", 40, { colour: LOOK.ink }), t(qx(0) + 16, qy(6.4) - 24, 60, 50, "$y$", 40, { colour: LOOK.ink }),
    ln(4.4, -0.4, -0.4, 4.4, ORANGE, 7), ln(6.4, -0.4, -0.4, 6.4, BLUE, 7),
    t(qx(3.2), qy(0) - 64, 300, 44, "$x + y = 4$", 30, { colour: ORANGE, bold: true }), t(qx(3.4), qy(2.95) - 52, 300, 44, "$x + y = 6$", 30, { colour: BLUE, bold: true }),
    dot(0, 0, RED, 0, 15), t(qx(-0.35), qy(0) + 22, 420, 46, "$(0, 0)$ is not allowed", 30, { colour: RED, bold: true, align: "left" }),
  ];
  return els;
}

const slide = (id: string, title: string, els: unknown[], brief?: string): Slide => makeSlide(id, "teach", title, els as never, brief);
const left = (text: string, y = 250, h = 560, size = 42, more: Record<string, unknown> = {}) => t(60, y, 880, h, text, size, more);

// ── the slides (look card) ───────────────────────────────────────────────────
const slides: Slide[] = [
  S.title(`${P}-title`, "When the origin is not allowed", "Starting the simplex from a ≥ limit or a minimise"),

  slide(`${P}-origin`, "Is the origin allowed?", [
    ...titleEls("Is the origin allowed?", "The simplex starts at $(0, 0)$"),
    ml(60, 250, 880, 360, "\\begin{array}{l}2x + y \\le 10\\\\[1.2ex] x + 2y \\le 8\\\\[1.2ex] \\textcolor{" + ORANGE + "}{x + y \\ge 3}\\\\[1.2ex] x \\ge 0,\\; y \\ge 0\\end{array}", 58),
    left("Test the origin in the new limit:", 640, 70, 40, { colour: grey, step: 1 }),
    ml(60, 720, 880, 100, "0 + 0 \\ge 3 \\quad \\textcolor{" + RED + "}{\\text{false}}", 62, { step: 2 }),
    ...graphA({ origin: 2 }),
  ], "The first slide of the deck proper. The region on the right is shaded; the origin sits outside it once the click comes."),

  slide(`${P}-table0`, "The table says the same", [
    ...titleEls("The table says the same", "A ≥ limit is written as a ≤ limit first"),
    ml(60, 235, 880, 200, "\\begin{array}{l}x + y \\ge 3\\\\[1ex] -x - y \\le -3 \\quad \\text{(multiply by } -1\\text{)}\\\\[1ex] -x - y + s_3 = -3\\end{array}", 42),
    maths(40, 450, 900, 330, tabTex(A0, 3, { negRow: 3 }), 52, { step: 1 }),
    t(60, 795, 880, 100, "$s_3 = -3$: we cannot have $-3$ left over. A negative right-hand side means the start is not allowed.", 38, { bold: true, step: 2 }),
    ...graphA({ origin: 0 }),
  ], "The start is still x = 0, y = 0, which is exactly why s₃ comes out negative."),

  slide(`${P}-move`, "Moving onto the region", [
    ...titleEls("Moving onto the region", "Pivot in the row with the negative right-hand side"),
    ml(60, 235, 880, 170, `\\begin{array}{l}\\text{Pivot: the } -1 \\text{ in row 4, the } x \\text{ column}\\\\[1ex] \\text{Row 4 is divided by } -1\\end{array}`, 40),
    maths(40, 430, 900, 350, tabTex(A1, 3, { hiRow: 3 }), 52, { step: 1 }),
    t(60, 795, 880, 100, "Every right-hand side is positive: $x = 3$, $y = 0$, $P = 6$. We are on the region.", 40, { bold: true, step: 2 }),
    ...graphA({ origin: 0, jump: 1, at: true }),
  ], "The first pivot's job is only to get onto the region. After it, the algorithm carries on as before."),

  slide(`${P}-two-signals`, "Minimising: two signals", [
    ...titleEls("Minimising: two signals", "Maximise $P = -C$, and look at the table"),
    maths(40, 240, 900, 330, tabTex(B0, 2, { negRow: 1, hiRow: 0, cols: ["P", "x", "y", "s_1", "s_2"] }), 56),
    t(60, 600, 880, 70, "Bottom row: no negatives, so it says stop.", 42, { step: 1 }),
    t(60, 680, 880, 70, "Right-hand side: $-4$, so it says this start is not allowed.", 42, { colour: RED, step: 2 }),
    t(60, 780, 880, 100, "A negative right-hand side comes first: we have not got a corner to stop at.", 42, { bold: true, step: 3 }),
    ...graphB(),
  ], "Minimise C = 3x + 2y subject to x + y ≥ 4 and x + y ≤ 6. P = −C. The bottom row has no negatives at the start, which is the trap."),
];

export default () => ({
  id: ID, title: "When the origin is not allowed", strand: "Decision Mathematics", questionVersion: 2,
  summary: "Why the simplex needs a changed start: a ≥ limit puts the origin outside the region, which the table shows as a negative right-hand side; the first pivot moves onto the region. Minimising by maximising −C, and the two other starts that miss the origin (a lower bound and an equality). A graph beside the table shows each move.",
  tool: "lp-simplex", toolPath: "/lp-simplex",
  slides,
});
