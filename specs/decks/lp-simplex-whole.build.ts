// Build script for the "Why rounding fails" deck (plan: specs/decks/lp-simplex-whole.md): stage 5 of the simplex roadmap (docs/roadmaps/linear-programming.md).
// One worked problem: a stall makes tables and chairs, the simplex gives a fractional optimum, and the class finds the best whole-number plan the way the Is it practical? tool does
// (an upper bound, the whole-number points either side of the optimum, the best of them). Every number is computed here by the real engine (src/shared/decision/lpSimplex.ts) or by
// brute force, and asserted against what the slide says.
//   npm run deck -- build specs/decks/lp-simplex-whole.build.ts [--replace]
//   npm run deck -- check lp-simplex-whole --layout
import { LOOK, S, lineEl, makeSlide, textEl, titleEls } from "/src/decks/builder";
import { type Tab, runSpec } from "/src/shared/decision/lpSimplex";
import type { Slide } from "/src/decks/types";

const ID = "lp-simplex-whole";
const P = "wh";
const { grey } = LOOK;
const t = textEl;
const must = (ok: boolean, msg: string) => { if (!ok) throw new Error(`plan check failed: ${msg}`); };

// ── the problem: maximise P = 3x + 4y subject to x + y <= 6, x + 3y <= 11 ────
const spec = { sense: "max" as const, c: [3, 4], cons: [{ a: [1, 1], op: "≤" as const, b: 6 }, { a: [1, 3], op: "≤" as const, b: 11 }] };
const run = runSpec(spec);
const fin: Tab = run.tabs[run.tabs.length - 1];
const frac = (tab: Tab, r: number): [number, number] => [Number(tab.rows[r][tab.rows[r].length - 1][0]), Number(tab.rows[r][tab.rows[r].length - 1][1])];
const val = (tab: Tab, col: number): [number, number] => { const r = tab.basis.indexOf(col); return r < 0 ? [0, 1] : frac(tab, r + 1); };
must(JSON.stringify(val(fin, 1)) === "[7,2]" && JSON.stringify(val(fin, 2)) === "[5,2]" && JSON.stringify(frac(fin, 0)) === "[41,2]", "the simplex gives x = 7/2, y = 5/2, P = 41/2");
const feas = (x: number, y: number): boolean => x >= 0 && y >= 0 && x + y <= 6 && x + 3 * y <= 11;
const pv = (x: number, y: number): number => 3 * x + 4 * y;
must(pv(3.5, 2.5) === 20.5 && Math.floor(20.5) === 20, "P is 20.5 at the optimum, so a practical plan has P at most 20");
// every whole-number point of the region, and the best of them, by brute force
const lattice: Array<[number, number]> = [];
for (let x = 0; x <= 7; x++) for (let y = 0; y <= 7; y++) if (feas(x, y)) lattice.push([x, y]);
const bestP = Math.max(...lattice.map(([x, y]) => pv(x, y)));
const bests = lattice.filter(([x, y]) => pv(x, y) === bestP);
must(bestP === 20 && bests.length === 1 && bests[0][0] === 4 && bests[0][1] === 2, "the best whole-number plan is (4, 2) with P = 20, and it is the only one");
must(!feas(4, 3) && 4 + 3 > 6 && 4 + 3 * 3 > 11, "rounding to the nearest, (4, 3), breaks both limits");
must(feas(3, 2) && pv(3, 2) === 17, "rounding down, (3, 2), is practical with P = 17, but not the best");
const four: Array<[number, number]> = [[3, 2], [4, 2], [3, 3], [4, 3]];
must(JSON.stringify(four.map(([x, y]) => feas(x, y))) === JSON.stringify([true, true, false, false]), "of the four points around the optimum, (3, 2) and (4, 2) are practical");
must(bestP === Math.floor(pv(3.5, 2.5)), "the best practical plan reaches the upper bound");
// the corners of the region
for (const [x, y] of [[0, 0], [6, 0], [3.5, 2.5]] as Array<[number, number]>) must(feas(x, y), `corner (${x}, ${y})`);
must(Math.abs(0 + 3 * (11 / 3) - 11) < 1e-9, "the corner (0, 11/3)");

const GREEN = "#15803d";
const RED = "#b91c1c";
const BLUE = "#1d4ed8";
const PURPLE = "#7c3aed";
const ORANGE = "#c2410c";
const maths = (x: number, y: number, w: number, h: number, latex: string, size: number, more: Record<string, unknown> = {}) =>
  ({ kind: "maths", x, y, w, h, latex, size, ...more }) as never;
const ml = (x: number, y: number, w: number, h: number, latex: string, size = 48, more: Record<string, unknown> = {}) => maths(x, y, w, h, latex, size, { align: "left", ...more });

// ── the graph: the region, its whole-number points, the objective line ───────
const SC = 105, OX = 930, OY = 790;
const px = (x: number) => OX + SC * x, py = (y: number) => OY - SC * y;
const dot = (x: number, y: number, c: string, r: number, step = 0) => ({ kind: "shape", shape: "ellipse", x: px(x) - r, y: py(y) - r, w: 2 * r, h: 2 * r, fill: c, stroke: c, strokeWidth: 2, ...(step ? { step } : {}) }) as never;
const seg = (x1: number, y1: number, x2: number, y2: number, colour: string, width: number, step = 0, arrow = false) =>
  lineEl(px(x1), py(y1), px(x2) - px(x1), py(y2) - py(y1), { colour, width, ...(arrow ? { arrow: true } : {}), ...(step ? { step } : {}) });
function region(points: Array<[number, number]>, fill = "#93c5fd"): unknown {
  const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const w = (x1 - x0) * SC, h = (y1 - y0) * SC;
  const pts = points.map(([x, y]) => `${(x - x0) * SC},${(y1 - y) * SC}`).join(" ");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polygon points="${pts}" fill="${fill}" fill-opacity="0.55"/></svg>`;
  return { kind: "image", x: px(x0), y: py(y1), w, h, src: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` } as never;
}
const tag = (x: number, y: number, text: string, colour: string, where: "below" | "right" | "above", step = 0): unknown => {
  const o = { colour, bold: true, align: "left" as const, ...(step ? { step } : {}) };
  if (where === "right") return t(px(x) + 24, py(y) - 22, 260, 46, text, 30, o);
  if (where === "above") return t(px(x) + 14, py(y) - 84, 300, 46, text, 30, o);
  return t(px(x) - 30, py(y) + 18, 260, 46, text, 30, o);
};
/** the numbers along the axes, so a whole-number point can be read off */
const ticks = (): unknown[] => [
  ...[1, 2, 3, 4, 5, 6].map((i) => t(px(i) - 20, py(0) + 10, 40, 34, `$${i}$`, 26, { colour: grey })),
  ...[1, 2, 3, 4].map((j) => t(px(0) - 50, py(j) - 17, 36, 34, `$${j}$`, 26, { colour: grey, align: "right" })),
];
interface GOpts { points?: boolean; neighbours?: number; optimum?: number; lines?: boolean }
function graph(o: GOpts = {}): unknown[] {
  const els: unknown[] = [
    region([[0, 0], [6, 0], [3.5, 2.5], [0, 11 / 3]]),
    seg(0, 0, 6.3, 0, LOOK.ink, 6), seg(0, 0, 0, 4.4, LOOK.ink, 6),
    t(px(6.3) + 5, py(0) - 26, 60, 50, "$x$", 40, { colour: LOOK.ink }), t(px(0) + 16, py(4.4) - 24, 60, 50, "$y$", 40, { colour: LOOK.ink }),
    seg(6.2, -0.2, 1.8, 4.2, BLUE, 7), seg(0, 11 / 3, 6.2, 1.6, PURPLE, 7),
    ...ticks(),
  ];
  if (o.lines !== false) els.push(t(px(5.65), py(0.5), 300, 44, "$x + y = 6$", 28, { colour: BLUE, bold: true, align: "left" }), t(px(4.55), py(2.55), 340, 44, "$x + 3y = 11$", 28, { colour: PURPLE, bold: true, align: "left" }));
  if (o.points) for (const [x, y] of lattice) els.push(dot(x, y, "#475569", 7, o.points === true ? 0 : 0));
  if (o.optimum !== undefined) els.push(dot(3.5, 2.5, ORANGE, 14, o.optimum), maths(px(3.5) + 14, py(2.5) - 92, 300, 70, "(\\tfrac{7}{2}, \\tfrac{5}{2})", 30, { colour: ORANGE, align: "left", ...(o.optimum ? { step: o.optimum } : {}) }));
  return els;
}

const slide = (id: string, title: string, els: unknown[], brief?: string): Slide => makeSlide(id, "teach", title, els as never, brief);
const left = (text: string, y = 250, h = 560, size = 42, more: Record<string, unknown> = {}) => t(60, y, 780, h, text, size, more);

// ── the slides (look card: the five that carry the new look) ─────────────────
const slides: Slide[] = [
  S.title(`${P}-title`, "Why rounding fails", "Whole numbers and the simplex answer"),

  slide(`${P}-problem`, "The simplex answer", [
    ...titleEls("The simplex answer", "A stall makes tables ($x$) and chairs ($y$)"),
    ml(60, 250, 780, 330, "\\begin{array}{l}\\text{Maximise } P = 3x + 4y\\\\[2ex] x + y \\le 6\\\\[1ex] x + 3y \\le 11\\\\[1ex] x \\ge 0,\\; y \\ge 0\\end{array}", 56),
    left("The simplex gives", 600, 60, 40, { colour: grey, step: 1 }),
    ml(60, 665, 780, 100, "x = \\tfrac{7}{2},\\; y = \\tfrac{5}{2},\\; P = \\tfrac{41}{2}", 52, { step: 1 }),
    left("We cannot make $3\\tfrac{1}{2}$ tables. Only whole numbers of each can be made.", 780, 110, 40, { bold: true, step: 2 }),
    ...graph({ optimum: 1 }),
  ], "The one worked problem for the whole deck. Whole numbers only: the optimum is a corner with fractions in it."),

  slide(`${P}-points`, "The whole-number points", [
    ...titleEls("The whole-number points", "Only these are plans we can make"),
    left("Each dot is a whole-number point inside the region.", 250, 110, 42),
    left("The four around the optimum:", 400, 70, 40, { colour: grey, step: 1 }),
    ml(60, 480, 780, 200, "\\begin{array}{l}\\textcolor{" + RED + "}{(3, 3)} \\quad \\textcolor{" + RED + "}{(4, 3)}\\\\[1.4ex]\\textcolor{" + GREEN + "}{(3, 2)} \\quad \\textcolor{" + GREEN + "}{(4, 2)}\\end{array}", 54, { step: 1 }),
    left("Green are inside the region. Red are not.", 700, 100, 42, { bold: true, step: 2 }),
    ...graph({ points: true, optimum: 0 }),
    dot(3, 2, GREEN, 13, 1), dot(4, 2, GREEN, 13, 1), dot(3, 3, RED, 13, 1), dot(4, 3, RED, 13, 1),
  ], "The lattice points of the region are drawn from the same check the script asserts."),

  slide(`${P}-test`, "Test the four points", [
    ...titleEls("Test the four points", "A point is a plan only if it satisfies every limit"),
    maths(40, 250, 840, 380, `\\begin{array}{c|c|c|c}(x, y)&x + y \\le 6&x + 3y \\le 11&P\\\\\\hline \\textcolor{${GREEN}}{(3, 2)}&5\\ \\checkmark&9\\ \\checkmark&17\\\\[1ex] \\textcolor{${GREEN}}{(4, 2)}&6\\ \\checkmark&10\\ \\checkmark&20\\\\[1ex] \\textcolor{${RED}}{(3, 3)}&6\\ \\checkmark&12\\ \\times&\\\\[1ex] \\textcolor{${RED}}{(4, 3)}&7\\ \\times&13\\ \\times&\\end{array}`, 46),
    t(60, 680, 780, 100, "$(4, 3)$ is what rounding to the nearest gives. It breaks both limits.", 42, { step: 1 }),
    t(60, 790, 780, 90, "Rounding to the nearest is not safe: test every point.", 40, { bold: true, step: 2 }),
    ...graph({ points: true, lines: false }),
    dot(3, 2, GREEN, 13), dot(4, 2, GREEN, 13), dot(3, 3, RED, 13), dot(4, 3, RED, 13),
  ], "(3, 3) breaks only the second limit; (4, 3) breaks both."),

  slide(`${P}-best`, "The best practical plan", [
    ...titleEls("The best practical plan", "Nothing above $P = 20$ is a whole-number point"),
    ml(60, 250, 780, 170, "\\begin{array}{l}P = \\tfrac{41}{2} \\text{ at the optimum}\\\\[1.2ex]P \\le 20 \\text{ for a whole-number plan}\\end{array}", 46),
    t(60, 440, 780, 150, "$(4, 2)$ has $P = 20$. It reaches the bound, so no practical plan can do better.", 40, { bold: true, step: 1 }),
    t(60, 600, 780, 110, "The orange sliver is every point with $P > 20$. It holds no whole-number point.", 36, { colour: ORANGE, step: 1 }),
    t(60, 740, 780, 140, "Rounding every value down gives $(3, 2)$, $P = 17$. It is practical, but not the best.", 38, { step: 2 }),
    ...graph({ points: true, optimum: 0 }),
    // the part of the region with P > 20: a thin sliver at the corner, and no whole-number point in it
    { ...(region([[4, 2], [3.5, 2.5], [3.2, 2.6]], "#fb923c") as object), step: 1 },
    seg(2.6, 3.05, 4.6, 1.55, GREEN, 7, 1),
    dot(4, 2, GREEN, 15, 1), dot(3, 2, GREEN, 11, 2),
    t(px(4.15), py(3.35), 200, 44, "$P > 20$", 30, { colour: ORANGE, bold: true, align: "left", step: 1 }),
    seg(4.15, 3.2, 3.6, 2.6, ORANGE, 4, 1),
  ], "The region with P above 20 is the thin sliver by the optimum, and it holds no whole-number point: (4, 2), with P = 20, is the best. The green line is P = 20."),
];

export default () => ({
  id: ID, title: "Why rounding fails", strand: "Decision Mathematics", questionVersion: 2,
  summary: "Why the simplex answer is not always a plan: whole numbers only, the optimum as an upper bound, the whole-number points either side of it, and the best practical plan. A graph beside the working shows the region, its whole-number points and the profit line.",
  tool: "lp-simplex", toolPath: "/lp-simplex",
  slides,
});
