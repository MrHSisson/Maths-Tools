// The working of a Graphical LP "Draw the region" question: write the constraints (from a situation), draw each line from two points, test a point to see which
// side to shade, label the region R, then find every corner by solving the two lines that meet there. Every number comes from the exact maths of lpGraph.ts.
import { fadd, fmul, feq, fr } from "./dim";
import { frTex } from "./dimTex";
import { type GLine, type Pt, testPoint } from "./lpGraph";
import { texEq, texLine } from "./lpGraphGen";
import type { DecisionProblem, LpRow, SolveStep } from "./types";

const NAME = "ABCDEF";
const coef = (k: number): string => (k === 1 ? "" : String(k));
const ptTex = (v: Pt): string => `(${frTex(v[0])},\\,${frTex(v[1])})`;
const wholeTex = (x: number, y: number): string => `(${x},\\,${y})`;

export function solveRegion(p: DecisionProblem): SolveStep[] {
  const d = p.gx;
  if (!d) return [];
  const { lines } = d;
  const steps: SolveStep[] = [];
  const rows: LpRow[] = [];
  let drawn = 0, shaded = 0, region = false, vertices = 0;
  const push = (caption: string, add: LpRow[]): void => {
    rows.push(...add);
    steps.push({ caption, edgeStates: {}, gxView: { drawn, shaded, region, vertices, rows: [...rows], fresh: add.length } });
  };
  const strictNote = (l: GLine): LpRow[] => (l.op === "<" || l.op === ">" ? [{ k: "note", t: "The inequality is strict, so the boundary is not part of the region: draw the line dotted." }] : []);

  // 1. the constraints as inequalities, when they came from a situation
  if (d.start === "situation") {
    push("Write each limit as an inequality. The numbers of items cannot be negative, so $x \\ge 0$ and $y \\ge 0$ as well.", [
      { k: "head", t: "The constraints" },
      ...lines.map((l, i): LpRow => ({ k: "tex", t: `${NAME[i]}:\\; ${texLine(l)}` })),
      { k: "tex", t: "x\\ge 0,\\; y\\ge 0" },
    ]);
  }

  // 2. each line: draw it, then shade
  lines.forEach((l, i) => {
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
  d.vertices.forEach((vt, j) => {
    const on = all.filter((l) => feq(fadd(fmul(fr(l.a), vt[0]), fmul(fr(l.b), vt[1])), fr(l.c)));
    const first = on[0];
    const second = on.find((l) => l.a * first.b - l.b * first.a !== 0) ?? on[1];
    vertices = j + 1;
    push(`Find corner ${j + 1} by solving the equations of ${first.name} and ${second.name}.`, [
      { k: "head", t: `Corner ${j + 1}` },
      { k: "tex", t: first.tex },
      { k: "tex", t: second.tex },
      { k: "result", t: `x=${frTex(vt[0])},\\;y=${frTex(vt[1])}\\quad${ptTex(vt)}` },
    ]);
  });

  push(`The vertices of ${d.enclosed ? "$R$" : "the region"} are ${d.vertices.map((v) => `$${ptTex(v)}$`).join(", ")}.`, [
    { k: "result", t: d.vertices.map(ptTex).join(",\\; ") },
  ]);
  return steps;
}
