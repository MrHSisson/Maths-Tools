// The working of a Graphical LP "Draw the region" question: write the constraints (from a situation), draw each line from two points, test a point to see which
// side to shade, label the region R, then find every corner by solving the two lines that meet there. Every number comes from the exact maths of lpGraph.ts.
import { type Fr, fadd, fdiv, fmul, feq, fr } from "./dim";
import { frTex } from "./dimTex";
import { type GLine, type Objective, type Pt, greatestYTable, nearestWhole, objValue, surroundingPoints, testPoint, toNum } from "./lpGraph";
import { texEq, texLine } from "./lpGraphGen";
import { objLhs, objTex } from "./lpGraphSolveGen";
import type { DecisionProblem, LpRow, SolveStep } from "./types";

const NAME = "ABCDEF";
const coef = (k: number): string => (k === 1 ? "" : String(k));
const ptTex = (v: Pt): string => `(${frTex(v[0])},\\,${frTex(v[1])})`;
const wholeTex = (x: number, y: number): string => `(${x},\\,${y})`;

/** `diagram`: the region is given already drawn, so the working starts at the corners */
export function solveRegion(p: DecisionProblem, diagram = false): SolveStep[] {
  const d = p.gx;
  if (!d) return [];
  const { lines } = d;
  const steps: SolveStep[] = [];
  const rows: LpRow[] = [];
  let drawn = diagram ? lines.length : 0, shaded = diagram ? lines.length : 0, region = diagram, vertices = 0;
  let skip = diagram;
  const push = (caption: string, add: LpRow[]): void => {
    if (skip) return;
    rows.push(...add);
    steps.push({ caption, edgeStates: {}, gxView: { drawn, shaded, region, vertices, rows: [...rows], fresh: add.length } });
  };
  const strictNote = (l: GLine): LpRow[] => (l.op === "<" || l.op === ">" ? [{ k: "note", t: "The inequality is strict, so the boundary is not part of the region: draw the line dotted." }] : []);

  // 1. the constraints as inequalities, when they came from a situation
  if (d.start === "situation") {
    push(`Write each limit as an inequality${d.obj ? ", and the aim as an objective" : ""}. The numbers of items cannot be negative, so $x \\ge 0$ and $y \\ge 0$ as well.`, [
      { k: "head", t: "The constraints" },
      ...lines.map((l, i): LpRow => ({ k: "tex", t: `${NAME[i]}:\\; ${texLine(l)}` })),
      { k: "tex", t: "x\\ge 0,\\; y\\ge 0" },
      ...(d.obj ? [{ k: "head", t: "The objective" } as LpRow, { k: "tex", t: objTex(d.obj) } as LpRow] : []),
    ]);
  }

  // 2. each line: draw it, then shade
  lines.forEach((l, i) => {
    if (diagram) return;
    const eq = texEq(l);
    const add: LpRow[] = [{ k: "head", t: `Line ${NAME[i]}` }, { k: "tex", t: eq }];
    const style = d.styles[i];
    if (style === "slope" || style === "supply") {
      const ix = l.c / l.a, iy = l.c / l.b;
      // with a coefficient of 1 the equation already says the answer: no arrow
      add.push({ k: "tex", t: l.b === 1 ? `x=0:\\;y=${iy}` : `x=0:\\;${coef(l.b)}y=${l.c}\\Rightarrow y=${iy}` }, { k: "tex", t: l.a === 1 ? `y=0:\\;x=${ix}` : `y=0:\\;${coef(l.a)}x=${l.c}\\Rightarrow x=${ix}` });
      add.push({ k: "words", t: `Join $${wholeTex(0, iy)}$ and $${wholeTex(ix, 0)}$.` });
    } else if (style === "vbound") add.push({ k: "words", t: `A vertical line through $${wholeTex(l.c, 0)}$.` });
    else if (style === "hbound") add.push({ k: "words", t: `A horizontal line through $${wholeTex(0, l.c)}$.` });
    else {
      const m = Math.abs(l.a === 1 ? l.b : l.a);
      const k = Math.max(1, Math.floor((0.7 * Math.min(d.win.xMax, d.win.yMax)) / m));
      const [x0, y0] = l.a === 1 ? [m * k, k] : [k, m * k];
      add.push({ k: "words", t: `It passes through the origin. When $${l.a === 1 ? `y=${k}` : `x=${k}`}$, $${l.a === 1 ? `x=${x0}` : `y=${y0}`}$, so it also passes through $${wholeTex(x0, y0)}$.` });
    }
    add.push(...strictNote(l));
    if (i === 0) add.push({ k: "note", t: "The axes are the lines $x=0$ and $y=0$; only the first quadrant is needed." });
    drawn = i + 1;
    push(`Draw line ${NAME[i]}: change the sign to $=$ and plot two points.`, add);

    const t = testPoint(l);
    const tx = t.at[0][0], ty = t.at[1][0];
    const v = l.a * tx + l.b * ty;
    const parts = [[l.a, tx], [l.b, ty]].filter(([k]) => k !== 0);
    const sub = parts.map(([k, v], n) => {
      const body = k === 1 || k === -1 ? String(v) : `${Math.abs(k)}(${v})`;
      return n === 0 ? (k < 0 ? `-${body}` : body) : k < 0 ? `-${body}` : `+${body}`;
    }).join("");
    const out = d.shading === "out";
    const words =
      (tx === 0 && ty === 0 ? "" : "The line passes through the origin, so test a point that is not on it. ") +
      (out
        ? t.holds ? `This is true, so $${wholeTex(tx, ty)}$ is on the wanted side: shade the other side.` : `This is false, so $${wholeTex(tx, ty)}$ is on the unwanted side: shade it.`
        : t.holds ? `This is true, so the region is on the same side as $${wholeTex(tx, ty)}$.` : `This is false, so the region is on the other side from $${wholeTex(tx, ty)}$.`);
    shaded = i + 1;
    push(`Test the point $${wholeTex(tx, ty)}$ in $${texLine(l)}$.`, [
      { k: "tex", t: `${sub}=${v}\\;${l.op === "≤" ? "\\le" : l.op === "≥" ? "\\ge" : l.op}\\;${l.c}\\ ?` },
      { k: "words", t: words },
    ]);
  });

  // 3. the region
  region = true;
  push(d.enclosed ? (d.shading === "out" ? "The part left unshaded is the feasible region. Label it $R$." : "The tinted part is the feasible region. Label it $R$.") : "The region is not enclosed: it goes on without limit, so there is no closed region to label.", [
    { k: "words", t: d.enclosed ? "The feasible region is the part that satisfies every constraint. Write $R$ in it." : "The feasible region satisfies every constraint but is open on one side." },
  ]);

  // 4. the corners
  const all: Array<{ name: string; a: number; b: number; c: number; tex: string }> = [
    ...lines.map((l, i) => ({ name: `line ${NAME[i]}`, a: l.a, b: l.b, c: l.c, tex: texEq(l) })),
    { name: "the $y$-axis", a: 1, b: 0, c: 0, tex: "x=0" },
    { name: "the $x$-axis", a: 0, b: 1, c: 0, tex: "y=0" },
  ];
  skip = false;
  d.vertices.forEach((vt, j) => {
    const on = all.filter((l) => feq(fadd(fmul(fr(l.a), vt[0]), fmul(fr(l.b), vt[1])), fr(l.c)));
    const first = on[0];
    const second = on.find((l) => l.a * first.b - l.b * first.a !== 0) ?? on[1];
    vertices = j + 1;
    push(`Find corner ${j + 1} by solving the equations of ${first.name} and ${second.name}.`, [
      { k: "head", t: `Corner ${j + 1}` },
      { k: "tex", t: first.tex },
      { k: "tex", t: second.tex },
      { k: "result", t: ptTex(vt) },
    ]);
  });

  push(`The vertices of ${d.enclosed ? "$R$" : "the region"} are ${d.vertices.map((v) => `$${ptTex(v)}$`).join(", ")}.`, [
    { k: "words", t: `The corners are ${d.vertices.map((v) => `$${ptTex(v)}$`).join(", ")}.` },
  ]);
  return steps;
}

const fracTex = (f: Fr): string => frTex(f);
/** an objective line p·x + q·y = k: the crossing with each axis, as the working writes it */
const crossings = (o: Objective, k: Fr): LpRow[] => [
  { k: "tex", t: `${objLhs(o)}=${fracTex(k)}` },
  { k: "tex", t: `x=0:\\;y=${fracTex(fdiv(k, fr(o.q)))}` },
  { k: "tex", t: `y=0:\\;x=${fracTex(fdiv(k, fr(o.p)))}` },
];

/** Solve: the region (unless it is given), then the objective by the sliding line and/or the vertex table, then the statement of the answer */
export function solveOptimise(p: DecisionProblem): SolveStep[] {
  const d = p.gx;
  if (!d || !d.obj || !d.best || !d.value || !d.ks) return [];
  const o = d.obj, maxim = o.sense === "max", L = maxim ? "P" : "C";
  const steps = solveRegion(p, d.start === "diagram");
  const last = steps[steps.length - 1].gxView!;
  const rows: LpRow[] = [...last.rows];
  const base = { drawn: d.lines.length, shaded: d.lines.length, region: true, vertices: d.vertices.length };
  // the objective lines stay on the graph once drawn
  let current: { ks: Fr[]; arrow: boolean } | undefined;
  let curLattice: { pts: boolean; around: boolean; best: boolean } | undefined;
  const push = (caption: string, add: LpRow[], extra: { objective?: { ks: Fr[]; arrow: boolean }; mark?: boolean; lattice?: { pts: boolean; around: boolean; best: boolean } } = {}): void => {
    rows.push(...add);
    if (extra.objective) current = extra.objective;
    if (extra.lattice) curLattice = extra.lattice;
    steps.push({ caption, edgeStates: {}, gxView: { ...base, rows: [...rows], fresh: add.length, ...extra, objective: current, lattice: curLattice } });
  };
  const [k1, k2] = d.ks;
  const bestTex = ptTex(d.best), valueTex = fracTex(d.value);
  const methods = d.methods ?? ["line"];
  const better = maxim ? "larger" : "smaller";

  if (methods.includes("line")) {
    push(`Draw two parallel objective lines, $${L}=${fracTex(k1)}$ and $${L}=${fracTex(k2)}$.`, [
      { k: "head", t: "Objective lines" },
      ...crossings(o, k1), ...crossings(o, k2),
      { k: "note", t: `Every line $${objLhs(o)}=k$ has the same slope, so these are parallel; choose values of $k$ that give whole intercepts.` },
    ], { objective: { ks: [k1, k2], arrow: false } });
    push(`Slide the ruler parallel to them, towards ${better} values of $${L}$, until the last point of ${d.enclosed ? "$R$" : "the region"} it touches.`, [
      { k: "words", t: `$${L}$ gets ${better} in the direction of the arrow. The last corner the line touches before it leaves the region is $${bestTex}$.` },
      { k: "tex", t: `${L}=${objLhs(o)}=${valueTex}` },
    ], { objective: { ks: [k1, k2, d.value], arrow: true }, mark: true });
  }
  if (methods.includes("table")) {
    const body = d.vertices.map((v) => `${ptTex(v)} & ${fracTex(objValue(o, v))}`).join(" \\\\ \\hline ");
    push(`Work out $${L}$ at every vertex.`, [
      { k: "head", t: "Vertex table" },
      { k: "tex", t: `\\begin{array}{|c|c|}\\hline \\mathrm{Vertex} & ${L} \\\\ \\hline ${body} \\\\ \\hline \\end{array}` },
    ]);
    push(`Pick the ${maxim ? "largest" : "smallest"} value of $${L}$.`, [{ k: "words", t: `The ${maxim ? "largest" : "smallest"} value is $${valueTex}$, at the vertex $${bestTex}$.` }], { mark: true });
  }
  const noun = d.nouns;
  if (d.integer) {
    // the items are whole: the best whole point is one of the four around the optimum
    const imethods = d.imethods ?? ["grid"];
    const around = surroundingPoints(d.lines, d.best);
    const near = nearestWhole(d.lines, d.best);
    const wb = d.integer.best, wbTex = ptTex(wb), wvTex = fracTex(d.integer.value);
    const nearTex = ptTex(near.at);
    push(`The optimum $${bestTex}$ is not a whole-number point, but $x$ and $y$ must be whole numbers.`, [
      { k: "head", t: "Whole numbers" },
      { k: "words", t: `No whole-number point can give more than $${L}=${valueTex}$. Look at the whole-number points close to $${bestTex}$.` },
    ], { mark: true, lattice: { pts: true, around: false, best: false } });
    if (imethods.includes("grid")) {
      const body = around.map((s) => `${ptTex(s.at)} & ${s.feasible ? "\\mathrm{yes}" : "\\mathrm{no}"} & ${s.feasible ? fracTex(objValue(o, s.at)) : "-"}`).join(" \\\\ \\hline ");
      const slip = d.integer.trap
        ? near.feasible
          ? `Rounding $${bestTex}$ to the nearest whole point gives $${nearTex}$, which is in $R$ but does not give the greatest ${L}.`
          : `Rounding $${bestTex}$ to the nearest whole point gives $${nearTex}$, which is not in $R$.`
        : `Here the nearest whole point, $${nearTex}$, is also the best.`;
      push("Test the four whole-number points around the optimum.", [
        { k: "head", t: "The four points" },
        { k: "tex", t: `\\begin{array}{|c|c|c|}\\hline (x,\\,y) & \\mathrm{In}\\ R? & ${L} \\\\ \\hline ${body} \\\\ \\hline \\end{array}` },
        { k: "words", t: slip },
      ], { mark: true, lattice: { pts: true, around: true, best: false } });
    }
    if (imethods.includes("table")) {
      const lo = Math.floor(toNum(d.best[0])) - 1, hi = Math.ceil(toNum(d.best[0])) + 1;
      const tab = greatestYTable(d.lines, o).filter((r) => r.x >= lo && r.x <= hi);
      const body = tab.map((r) => `${r.x} & ${r.y} & ${fracTex(r.value)}`).join(" \\\\ \\hline ");
      push("For each whole value of $x$ near the optimum, find the greatest whole value of $y$.", [
        { k: "head", t: "Greatest y for each x" },
        { k: "tex", t: `\\begin{array}{|c|c|c|}\\hline x & y_{\\max} & ${L} \\\\ \\hline ${body} \\\\ \\hline \\end{array}` },
        { k: "words", t: `The greatest value in the table is $${wvTex}$, at $${wbTex}$.` },
      ], { mark: true, lattice: { pts: true, around: false, best: false } });
    }
    push(`The best whole-number point is $${wbTex}$.`, [
      { k: "result", t: `${L}=${wvTex}\\quad\\mathrm{at}\\quad${wbTex}` },
      ...(d.start === "situation" && noun ? [{ k: "words", t: `Make $${wb[0][0]}$ ${noun[0].plural} and $${wb[1][0]}$ ${noun[1].plural}.` } as LpRow] : []),
      { k: "note", t: `This is less than $${valueTex}$, the best value when $x$ and $y$ need not be whole: the real value can be lower than the model's.` },
    ], { mark: false, lattice: { pts: true, around: false, best: true } });
    return steps;
  }
  const unit = d.start === "situation" && noun && o.p > 0 && o.q > 0 ? (maxim ? "maximum profit" : "minimum cost") : undefined;
  push(unit ? `So the ${unit} is £${fracTex(d.value)}.` : `State the ${maxim ? "maximum" : "minimum"} value and where it occurs.`, [
    { k: "result", t: `${L}_{\\${maxim ? "max" : "min"}}=${valueTex}\\quad\\mathrm{at}\\quad${bestTex}` },
    ...(unit && noun ? [{ k: "words", t: `Make $${fracTex(d.best[0])}$ ${noun[0].plural} and $${fracTex(d.best[1])}$ ${noun[1].plural} for a ${unit} of £$${valueTex}$.` } as LpRow] : []),
  ], { mark: true });
  return steps;
}
