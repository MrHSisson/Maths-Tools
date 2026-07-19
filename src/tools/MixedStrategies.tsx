import {
  ToolShell, MathRenderer, SmartGrapher, handleDiagramPrint,
  type ToolConfig, type InfoSection, type DifficultyLevel, type AnyQuestion, type WorkingStep, type QOSnapshot,
  type GraphSeries, type FOI,
  randInt, pick, mStep, tStep,
} from "../shared";

// ═══════════════════════════════════════════════════════════════════════════════
// MIXED STRATEGIES — optimal mixed strategies & value of a zero-sum game.
//
// Convention: payoffs are ROSE's winnings.
//   • Rose is the ROW player and MAXIMISES.
//   • Colin is the COLUMN player and MINIMISES.
//
// Every level is built from an honest "Level 1" 2×2 core (no saddle point, nice
// p*, and — when Colin's strategy is shown — nice q* and V), then wrapped:
//   Level 1 — the bare 2×2.
//   Level 2 — a 3×3 that dominance-reduces to the core 2×2.
//   Level 3 — a 2×3 graphical game (third column non-dominated but unused),
//             optionally wrapped up to a 3×3 or 3×4 that reduces to the 2×3.
//
// A maximin/minimax pure-strategy test opens every worked example, on the FULL
// matrix as presented and BEFORE any dominance. The additive-offset decoys can
// never win that test, so the "no saddle point" conclusion is guaranteed.
// ═══════════════════════════════════════════════════════════════════════════════

// ── Fraction helpers ────────────────────────────────────────────────────────────

interface Frac { n: number; d: number; }            // reduced, denominator > 0

const gcd = (a: number, b: number): number => {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a || 1;
};
const mkFrac = (n: number, d: number): Frac => {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
};
const fVal = (f: Frac): number => f.n / f.d;
const fLatex = (f: Frac): string => (f.d === 1 ? `${f.n}` : `${f.n < 0 ? "-" : ""}\\dfrac{${Math.abs(f.n)}}{${f.d}}`);
const fPlain = (f: Frac): string => (f.d === 1 ? `${f.n}` : `${f.n}/${f.d}`);
const oneMinus = (f: Frac): Frac => mkFrac(f.d - f.n, f.d);

// ── Expression formatting for working steps ─────────────────────────────────────

const cf = (n: number, v: string): string =>
  n === 0 ? `0${v}` : n === 1 ? v : n === -1 ? `-${v}` : `${n}${v}`;
const signed = (n: number): string => (n < 0 ? `- ${Math.abs(n)}` : `+ ${n}`);
// A column's expected payoff as a function of p = P(top row): top·p + bot·(1−p)
const colExpr = (top: number, bot: number): string => `${cf(top, "p")} ${signed(bot)}(1-p)`;
// A row's expected payoff as a function of q = P(left column): left·q + right·(1−q)
const rowExpr = (left: number, right: number): string => `${cf(left, "q")} ${signed(right)}(1-q)`;

// ── Matrix rendering (KaTeX array with row/column labels) ───────────────────────

const matrixLatex = (M: number[][], rLab: string[], cLab: string[]): string => {
  const spec = "c|" + "c".repeat(cLab.length);
  let s = `\\begin{array}{${spec}} & ${cLab.join(" & ")} \\\\ \\hline `;
  M.forEach((row, i) => { s += `${rLab[i]} & ${row.join(" & ")} \\\\ `; });
  return s + `\\end{array}`;
};
const rLabels = (m: number): string[] => Array.from({ length: m }, (_, i) => `R_${i + 1}`);
const cLabels = (n: number): string[] => Array.from({ length: n }, (_, i) => `C_${i + 1}`);

// ── Payoff matrix as a labelled SVG table (Rose = rows, Colin = columns) ─────────
// Rendered on screen and cloned into the worksheet PDF by handleDiagramPrint.

const SUBS = ["", "₁", "₂", "₃", "₄", "₅", "₆"];
// "C_1" → "C₁" for plain SVG <text> (which can't render KaTeX).
const uniSub = (s: string) => s.replace(/_(\d)/g, (_m, d) => SUBS[+d] ?? `_${d}`);
const TD = { nameW: 42, labW: 58, dataW: 58, headH: 30, lblH: 34, rowH: 42 };
const tblW = (n: number) => TD.nameW + TD.labW + n * TD.dataW;
const tblH = (m: number) => TD.headH + TD.lblH + m * TD.rowH;
const minus = (v: number) => (v < 0 ? `−${Math.abs(v)}` : `${v}`);

const MatrixTable = ({ M, dataIndex }: { M: number[][]; dataIndex?: number }): JSX.Element => {
  const m = M.length, n = M[0].length;
  const { nameW, labW, dataW, headH, lblH, rowH } = TD;
  const W = tblW(n), H = tblH(m);
  const dataX = nameW + labW, bodyY = headH + lblH;
  const grid = "#94a3b8", headBg = "#f1f5f9", nameBg = "#e2e8f0", SW = 1.25;
  const fills: JSX.Element[] = [], lines: JSX.Element[] = [], texts: JSX.Element[] = [];
  let k = 0;
  const rect = (x: number, y: number, w: number, h: number, fill: string) =>
    fills.push(<rect key={"f" + k++} x={x} y={y} width={w} height={h} fill={fill} />);
  const hline = (x1: number, x2: number, y: number) =>
    lines.push(<line key={"l" + k++} x1={x1} y1={y} x2={x2} y2={y} stroke={grid} strokeWidth={SW} shapeRendering="crispEdges" />);
  const vline = (y1: number, y2: number, x: number) =>
    lines.push(<line key={"l" + k++} x1={x} y1={y1} x2={x} y2={y2} stroke={grid} strokeWidth={SW} shapeRendering="crispEdges" />);
  const txt = (x: number, y: number, s: string, o: { bold?: boolean; size?: number; fill?: string } = {}) =>
    texts.push(<text key={"t" + k++} x={x} y={y} fontSize={o.size ?? 17} fontWeight={o.bold ? 700 : 400} fill={o.fill ?? "#0f172a"} textAnchor="middle" dominantBaseline="central" fontFamily="Segoe UI, Arial, sans-serif">{s}</text>);

  // fills (no per-cell strokes — borders are drawn once, below, for uniformity)
  rect(dataX, 0, W - dataX, headH, nameBg);                    // Colin banner
  rect(0, headH, nameW, H - headH, nameBg);                    // Rose banner
  rect(nameW, headH, labW, lblH, headBg);                      // Strategy corner
  for (let j = 0; j < n; j++) rect(dataX + j * dataW, headH, dataW, lblH, headBg);
  for (let i = 0; i < m; i++) {
    rect(nameW, bodyY + i * rowH, labW, rowH, headBg);
    for (let j = 0; j < n; j++) rect(dataX + j * dataW, bodyY + i * rowH, dataW, rowH, "#ffffff");
  }

  // uniform internal grid lines (each drawn exactly once)
  hline(dataX, W, headH);                                      // under the Colin banner
  hline(nameW, W, bodyY);                                      // under the label row
  for (let i = 1; i < m; i++) hline(nameW, W, bodyY + i * rowH);
  vline(headH, H, nameW);                                      // right of the Rose banner
  vline(headH, H, dataX);                                      // right of Strategy / row labels
  for (let j = 1; j < n; j++) vline(headH, H, dataX + j * dataW);

  // texts
  txt(dataX + (W - dataX) / 2, headH / 2, "Colin", { bold: true, size: 15, fill: "#334155" });
  txt(nameW / 2, headH + (H - headH) / 2, "Rose", { bold: true, size: 15, fill: "#334155" });
  txt(nameW + labW / 2, headH + lblH / 2, "Strategy", { size: 13, fill: "#475569" });
  for (let j = 0; j < n; j++) txt(dataX + j * dataW + dataW / 2, headH + lblH / 2, "C" + SUBS[j + 1], { bold: true, fill: "#1e293b" });
  for (let i = 0; i < m; i++) {
    txt(nameW + labW / 2, bodyY + i * rowH + rowH / 2, "R" + SUBS[i + 1], { bold: true, fill: "#1e293b" });
    for (let j = 0; j < n; j++) txt(dataX + j * dataW + dataW / 2, bodyY + i * rowH + rowH / 2, minus(M[i][j]));
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ display: "block", width: "100%", height: "auto" }}
      preserveAspectRatio="xMidYMid meet" {...(dataIndex !== undefined ? { "data-q-index": dataIndex } : {})}>
      {fills}
      {/* notched outer frame (open top-left corner) */}
      <path d={`M ${dataX} 0 H ${W} V ${H} H 0 V ${headH} H ${dataX} Z`} fill="none" stroke={grid} strokeWidth={SW} shapeRendering="crispEdges" />
      {lines}
      {texts}
    </svg>
  );
};

const INSTRUCTION = "Find the optimal mixed strategy and the value of the game.";

// Renders the payoff table (+ short instruction off the worksheet) in every mode.
// In the embedded whiteboard (compact === undefined) the shell suppresses its own
// answer block, so we render the answer inline here when it is revealed.
const questionRenderer = (q: AnyQuestion, showAns: boolean, _cs: string, compact?: boolean, idx?: number, qo?: QOSnapshot, fontClass?: string): JSX.Element | null => {
  const M = (q as any)._matrix as number[][] | undefined;
  if (!M) return null;
  const n = M[0].length;
  const isFS = qo?.fullscreen === true;
  // Whiteboard — embedded (compact === undefined) or fullscreen — shows the answer
  // IN PLACE OF the matrix when revealed. Worked example is compact === false but
  // not fullscreen, so it keeps the matrix and its own separate answer box. The
  // font-size class matches the standard answer sizing; fullscreen has room for
  // the Level 3 graph.
  if ((compact === undefined || isFS) && showAns) {
    // No width:100% — under a flex/align-center parent (and inside ScaleToFit in
    // fullscreen) the box then sizes to its content, so the fullscreen scaler can
    // measure the real width and shrink it to fit instead of clipping.
    return <div className={fontClass} style={{ color: "#166534", fontWeight: 700 }}>{answerBody(q, isFS)}</div>;
  }
  const maxW = compact === true ? (n >= 4 ? 260 : 230) : compact === undefined ? 380 : 470;
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      {compact !== true && (
        <div style={{ fontSize: compact === false ? 22 : 18, fontWeight: 600, color: "#000", textAlign: "center" }}>{INSTRUCTION}</div>
      )}
      <div style={{ width: "100%", maxWidth: maxW, margin: "0 auto" }}>
        <MatrixTable M={M} dataIndex={idx} />
      </div>
    </div>
  );
};

// ── Pure-strategy (saddle point) analysis of any matrix ─────────────────────────

interface Saddle { rowMins: number[]; colMaxs: number[]; maximin: number; minimax: number; noSaddle: boolean; }
const saddle = (M: number[][]): Saddle => {
  const rowMins = M.map((r) => Math.min(...r));
  const nCols = M[0].length;
  const colMaxs = Array.from({ length: nCols }, (_, j) => Math.max(...M.map((r) => r[j])));
  const maximin = Math.max(...rowMins);
  const minimax = Math.min(...colMaxs);
  return { rowMins, colMaxs, maximin, minimax, noSaddle: maximin < minimax };
};

// ── 2×2 core solution: p* (Rose), q* (Colin), value V ───────────────────────────

interface Core2 { a: number; b: number; c: number; d: number; D: number; p: Frac; q: Frac; V: Frac; }
const solve2 = (a: number, b: number, c: number, d: number): Core2 => {
  const D = a + d - b - c;
  return { a, b, c, d, D, p: mkFrac(d - c, D), q: mkFrac(d - b, D), V: mkFrac(a * d - b * c, D) };
};

// ═══════════════════════════════════════════════════════════════════════════════
// GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

const DENOM_POOL = [2, 3, 4, 5, 6, 7, 8, 9];   // acceptable denominators for p* and q*
const inPool = (d: number) => d >= 2 && d <= 9;

// A random valid 2×2 core. To spread the answers evenly across denominators
// (rather than clustering on p = 1/2), we pick a TARGET denominator up front and
// return the first matrix that hits it; if none turns up we fall back to any
// valid matrix. The value V is allowed any single-digit denominator — insisting
// on an integer/half-integer was what forced the low-denominator clustering.
const genCore = (needColin: boolean): Core2 => {
  const target = pick(DENOM_POOL);
  let fallback: Core2 | null = null;
  for (let i = 0; i < 60000; i++) {
    const a = randInt(-8, 8), b = randInt(-8, 8), c = randInt(-8, 8), d = randInt(-8, 8);
    if (!saddle([[a, b], [c, d]]).noSaddle) continue;   // must require mixing
    // A game where every payoff has the same sign is degenerate in context
    // (one player always wins/loses), so require a genuine mix of signs. The
    // core cells always survive into the displayed matrix, so this suffices.
    const hasPos = a > 0 || b > 0 || c > 0 || d > 0;
    const hasNeg = a < 0 || b < 0 || c < 0 || d < 0;
    if (!hasPos || !hasNeg) continue;
    const co = solve2(a, b, c, d);
    if (co.D === 0) continue;
    const pv = fVal(co.p), qv = fVal(co.q);
    if (pv <= 0 || pv >= 1 || qv <= 0 || qv >= 1) continue;   // strictly interior
    if (!inPool(co.p.d)) continue;
    if (needColin && !inPool(co.q.d)) continue;
    if (co.V.d > 9) continue;                          // keep V a single-digit denominator
    if (!fallback) fallback = co;
    if (co.p.d === target) return co;                  // hit the target → even spread
  }
  return fallback ?? solve2(3, -1, 0, 2);              // guaranteed-valid fallback
};

// ── Decoy construction (additive offset — dominance holds at the corner for free)

// Insert a value into an array at position pos, returning a new array.
const insertAt = <T,>(arr: T[], pos: number, val: T): T[] => {
  const out = arr.slice(); out.splice(pos, 0, val); return out;
};

interface Assembled {
  M: number[][];
  rLab: string[]; cLab: string[];
  bindRows: number[]; bindCols: number[];           // display indices of the surviving core
  rowDecoy?: { at: number; by: number };            // dominated row (by a binding row)
  colDecoy?: { at: number; by: number };            // dominated column (by a binding column)
}

// Add a dominated ROW (Rose maximises → decoy = a binding row − δ, term by term).
const addRow = (A: Assembled): Assembled => {
  const delta = randInt(1, 3);
  const domIdx = A.bindRows[randInt(0, 1)];          // which binding row dominates
  const decoy = A.M[domIdx].map((v) => v - delta);
  const pos = randInt(0, A.M.length);                // insertion position among rows
  const M = insertAt(A.M, pos, decoy);
  const shift = (i: number) => (pos <= i ? i + 1 : i);
  return {
    M,
    rLab: rLabels(M.length),
    cLab: A.cLab,
    bindRows: A.bindRows.map(shift),
    bindCols: A.bindCols,
    rowDecoy: { at: pos, by: shift(domIdx) },
    colDecoy: A.colDecoy,
  };
};

// Add a dominated COLUMN (Colin minimises → decoy = a binding column + ε, term by term).
const addCol = (A: Assembled): Assembled => {
  const eps = randInt(1, 3);
  const domIdx = A.bindCols[randInt(0, 1)];          // which binding column dominates
  const pos = randInt(0, A.M[0].length);             // insertion position among columns
  const M = A.M.map((row) => insertAt(row, pos, row[domIdx] + eps));
  const shift = (j: number) => (pos <= j ? j + 1 : j);
  return {
    M,
    rLab: A.rLab,
    cLab: cLabels(M[0].length),
    bindRows: A.bindRows,
    bindCols: A.bindCols.map(shift),
    rowDecoy: A.rowDecoy,
    colDecoy: { at: pos, by: shift(domIdx) },
  };
};

// A non-dominated third column for Level 3: straddles BOTH binding columns
// (one entry below, one above) so neither dominates it, yet its line sits above
// the value at p* so Colin never uses it — forcing the graph.
const genC3 = (co: Core2): [number, number] | null => {
  const cands: [number, number][] = [];
  for (let e = -8; e <= 8; e++) for (let f = -8; f <= 8; f++) {
    const straddle1 = (e - co.a) * (f - co.c) < 0;   // straddles binding col 1
    const straddle2 = (e - co.b) * (f - co.d) < 0;   // straddles binding col 2
    if (!straddle1 || !straddle2) continue;
    // Height constraint in EXACT integers: E3(p*) > V, where p* = p.n/p.d.
    // E3(p*)·p.d = e·p.n + f·(p.d − p.n); compare against V = V.n/V.d by
    // cross-multiplying (p.d, V.d > 0). Strict > excludes triple concurrency.
    const e3num = e * co.p.n + f * (co.p.d - co.p.n);   // = E3(p*)·p.d
    if (e3num * co.V.d <= co.V.n * co.p.d) continue;
    cands.push([e, f]);
  }
  return cands.length ? pick(cands) : null;
};

// ═══════════════════════════════════════════════════════════════════════════════
// WORKING
// ═══════════════════════════════════════════════════════════════════════════════

// Opening pure-strategy test, always on the full matrix as presented.
const saddleSteps = (s: Saddle): WorkingStep[] => [
  tStep("First test for a pure strategy (a saddle point) before mixing."),
  mStep("Smallest entry in each row → the maximin is the largest of these:",
    `${s.rowMins.join(",\\ ")}\\ \\Rightarrow\\ ${s.maximin}`),
  mStep("Largest entry in each column → the minimax is the smallest of these:",
    `${s.colMaxs.join(",\\ ")}\\ \\Rightarrow\\ ${s.minimax}`),
  mStep("Maximin < minimax, so there is no saddle point — a mixed strategy is needed:",
    `${s.maximin} < ${s.minimax}`),
];

// Rose's mixing calculation on the binding 2×2 core, plus the value.
const roseSteps = (co: Core2, rTop: string, cLeft: string): WorkingStep[] => {
  const { a, b, c, d, D, p, V } = co;
  const numP = D < 0 ? -(d - c) : d - c, denP = Math.abs(D);
  return [
    mStep(`Let Rose play $${rTop}$ with probability $p$. Make Colin indifferent — equate the columns:`,
      [`${colExpr(a, c)}`, `= ${colExpr(b, d)}`]),
    mStep("Collect the $p$ terms:",
      [`${cf(a - c, "p")} ${signed(c)}`, `= ${cf(b - d, "p")} ${signed(d)}`]),
    mStep("Solve for $p$:",
      [`${cf(a - b - c + d, "p")} = ${d - c}`, `p = \\dfrac{${numP}}{${denP}} = ${fLatex(p)}`]),
    mStep(`Substitute into $${cLeft}$ for the value of the game:`,
      [`V = ${a}(${fLatex(p)}) ${signed(c)}(1-${fLatex(p)})`, `= ${fLatex(V)}`]),
  ];
};

// Colin's mixing calculation (Levels 1 & 2 only, when the toggle is on).
const colinSteps = (co: Core2, cLeft: string): WorkingStep[] => {
  const { a, b, c, d, D, q } = co;
  const numP = D < 0 ? -(d - b) : d - b, denP = Math.abs(D);
  return [
    mStep(`Now Colin. Let Colin play $${cLeft}$ with probability $q$. Equate Rose's rows:`,
      [`${rowExpr(a, b)}`, `= ${rowExpr(c, d)}`]),
    mStep("Solve for $q$:",
      [`${cf(a - b - c + d, "q")} = ${d - b}`, `q = \\dfrac{${numP}}{${denP}} = ${fLatex(q)}`]),
  ];
};

// Level 3 graphical reasoning around the third (unused) column.
const graphSteps = (co: Core2, c3: [number, number], c3Lab: string, cA: string, cB: string, graph: GraphData): WorkingStep[] => {
  const [e, f] = c3;
  const E3 = mkFrac(e * co.p.n + f * (co.p.d - co.p.n), co.p.d);   // E3(p*)
  // The plotting step carries the graph data so the worked-example stepRenderer
  // can draw the SmartGrapher right where the method says to plot it.
  const plot: WorkingStep = tStep("Plot each column's expected payoff as a line against $p$. Colin takes the lowest line, so Rose maximises the lower envelope — its highest point is the answer.");
  plot.extra = { graph };
  return [
    plot,
    mStep(`The lower envelope peaks where columns $${cA}$ and $${cB}$ cross, giving the $p$ found below.`,
      `p = ${fLatex(co.p)}`),
    mStep(`Check the third line $${c3Lab}$ at that $p$:`,
      [`E = ${e}(${fLatex(co.p)}) ${signed(f)}(1-${fLatex(co.p)})`, `= ${fLatex(E3)}`]),
    mStep(`This lies above the value, so Colin never plays $${c3Lab}$ — the graph was needed to see it:`,
      `${fLatex(E3)} > ${fLatex(co.V)}`),
  ];
};

// ── Answer block ────────────────────────────────────────────────────────────────

const answerLatex = (co: Core2, rTop: string, rBot: string, cLeft: string, cRight: string,
                     showColin: boolean, isL3: boolean, c3Lab?: string): string => {
  const lines: string[] = [];
  lines.push(`&\\text{Rose plays } (${rTop},\\,${rBot}) = (${fLatex(co.p)},\\ ${fLatex(oneMinus(co.p))})`);
  if (isL3) {
    lines.push(`&\\text{Colin uses } ${cLeft},\\,${cRight}\\text{ only}${c3Lab ? `\\;(${c3Lab}\\text{ unused})` : ""}`);
  } else if (showColin) {
    lines.push(`&\\text{Colin plays } (${cLeft},\\,${cRight}) = (${fLatex(co.q)},\\ ${fLatex(oneMinus(co.q))})`);
  }
  lines.push(`&\\text{Value } V = ${fLatex(co.V)}`);
  return `\\begin{aligned} ${lines.join(" \\\\ ")} \\end{aligned}`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// LEVEL 3 GRAPH (the lower-envelope plot, shown with the answer)
// ═══════════════════════════════════════════════════════════════════════════════

interface GraphLine { label: string; top: number; bot: number; binding: boolean; }
interface GraphData {
  lines: GraphLine[];
  p: number; pLatex: string; V: number; vLatex: string;
  rTop: string; rBot: string;
}

const LINE_COLORS = ["#2563eb", "#059669", "#d97706"];   // one per column line

// The lower-envelope plot, rendered by the shared SmartGrapher: each column's
// expected payoff is a line E(p) = top·p + bot·(1−p) over p ∈ [0, 1], all three
// solid and colour-coded. Only the peak of the lower envelope is highlighted (a
// ringed marker, no coordinate) — students still have to solve the two line
// equations to find p and the value. Expandable to fullscreen via the embed.
const GraphView = ({ g }: { g: GraphData }): JSX.Element => {
  const series: GraphSeries[] = g.lines.map((l, i) => ({
    equationType: "linear",
    params: [l.top - l.bot, l.bot],                 // E(p) = (top − bot)·p + bot
    label: uniSub(l.label),
    color: LINE_COLORS[i % LINE_COLORS.length],
  }));
  const fois: FOI[] = [{ x: g.p, y: g.V, kind: "point", highlight: true }];
  return (
    <SmartGrapher
      series={series}
      height={300}
      config={{
        domain: { xMin: 0, xMax: 1 },
        lockDomain: true,
        axisLabels: { x: `p = P(${uniSub(g.rTop)})`, y: "Expected payoff" },
        autoIntersections: false,   // only the peak is marked, not every crossing
        autoFois: false,
        fois,
        style: { foi: "#dc2626" },
      }}
    />
  );
};

// The answer body: algebraic answer, plus the graph for Level 3. Shared by the
// answerRenderer (worked example / worksheet) and the whiteboard questionRenderer
// (the shell suppresses its own answer block when a questionRenderer is present).
const answerBody = (q: AnyQuestion, withGraph: boolean): JSX.Element => {
  const g = (q as any)._graph as GraphData | undefined;
  const latex = (q as any).answerLatex as string | undefined;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      {latex && <MathRenderer latex={latex} />}
      {withGraph && g && (
        <div style={{ width: "100%", maxWidth: 480 }}>
          <GraphView g={g} />
        </div>
      )}
    </div>
  );
};
// Worked example / worksheet answers get the graph; the whiteboard answer is
// rendered text-only from questionRenderer (its box is too small for the plot).
const answerRenderer = (q: AnyQuestion): JSX.Element | null => answerBody(q, true);

// The worked example draws the graph inline at the plotting step (which carries
// the graph data on step.extra), so it appears exactly where the method says to
// plot it. All other steps fall through to the shell's default rendering.
const stepRenderer = (s: WorkingStep): JSX.Element | null => {
  const g = (s.extra as { graph?: GraphData } | undefined)?.graph;
  if (!g) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <span>{s.plain}</span>
      <div style={{ width: "100%", maxWidth: 480, margin: "0 auto" }}>
        <GraphView g={g} />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const COLIN_VAR = { key: "colinStrategy", label: "Show Colin's strategy", defaultValue: false };
const WRAPPER_DD = {
  key: "wrapper", label: "Starting matrix",
  options: [
    { value: "direct", label: "2×3" },
    { value: "w33", label: "3×3 → 2×3" },
    { value: "w34", label: "3×4 → 2×3" },
  ],
  defaultValue: "direct",
};

const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Mixed Strategies",
  tools: {
    mixed: {
      name: "Mixed Strategies",
      instruction: INSTRUCTION,
      variables: [],
      dropdown: null,
      difficultySettings: {
        level1: { variables: [COLIN_VAR], dropdown: null },
        level2: { variables: [COLIN_VAR], dropdown: null },
        level3: { variables: [], dropdown: WRAPPER_DD },
      },
    },
  },
};

// ── INFO ────────────────────────────────────────────────────────────────────────

const INFO_SECTIONS: InfoSection[] = [
  { title: "Mixed Strategies", icon: "⚖️", content: [
    { label: "Overview", detail: "Zero-sum games where neither player has a pure best strategy. Payoffs are Rose's winnings: Rose (rows) maximises, Colin (columns) minimises." },
    { label: "Level 1 — Green", detail: "A 2×2 game. Test for a saddle point, then equate the columns to find Rose's mix p, and substitute back for the value V." },
    { label: "Level 2 — Yellow", detail: "A 3×3 game. Remove the dominated row and column first, then solve the resulting 2×2 as in Level 1." },
    { label: "Level 3 — Red", detail: "A 2×3 game solved graphically: plot each column's payoff line and read the peak of the lower envelope. The third column is deliberately non-dominated but unused." },
  ]},
  { title: "The method", icon: "📐", content: [
    { label: "Pure-strategy test", detail: "Every solution starts by checking maximin against minimax on the full matrix. If they differ there is no saddle point and mixing is required." },
    { label: "Dominance", detail: "For Rose a row is dominated if another row beats it in every column; for Colin a column is dominated if another column is smaller in every row. Dominated strategies are deleted." },
    { label: "Value of the game", detail: "The single expected payoff at the optimum — Rose's expected winnings and Colin's expected loss." },
  ]},
  { title: "Question Options", icon: "⚙️", content: [
    { label: "Show Colin's strategy", detail: "Levels 1 & 2. When on, the working also finds Colin's mix q by equating Rose's rows. Level 3 (graphical) reports Rose's mix and the value only." },
    { label: "Starting matrix", detail: "Level 3. Solve a 2×3 directly, or start from a 3×3 / 3×4 that must be dominance-reduced to a 2×3 before graphing." },
    { label: "Differentiated", detail: "Worksheet mode produces three columns — one per level — simultaneously." },
  ]},
  { title: "Modes", icon: "🖥️", content: [
    { label: "Whiteboard", detail: "One game with a working space alongside." },
    { label: "Worked Example", detail: "The full step-by-step solution, revealed on demand." },
    { label: "Worksheet", detail: "A grid of games with PDF export." },
  ]},
];

// ═══════════════════════════════════════════════════════════════════════════════
// generateQuestion
// ═══════════════════════════════════════════════════════════════════════════════

const generateQuestion = (
  _tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  dropdownValue: string,
): AnyQuestion => {
  const id = Math.floor(Math.random() * 1_000_000);
  const showColin = variables["colinStrategy"] ?? false;

  // ── Level 1: bare 2×2 ─────────────────────────────────────────────────────────
  if (level === "level1") {
    const co = genCore(showColin);
    const M = [[co.a, co.b], [co.c, co.d]];
    const rLab = rLabels(2), cLab = cLabels(2);
    const working = [
      ...saddleSteps(saddle(M)),
      ...roseSteps(co, rLab[0], cLab[0]),
      ...(showColin ? colinSteps(co, cLab[0]) : []),
    ];
    return {
      kind: "simple",
      display: `[[${co.a},${co.b}],[${co.c},${co.d}]]`,
      displayLatex: matrixLatex(M, rLab, cLab),
      answer: `p = ${fPlain(co.p)}, V = ${fPlain(co.V)}`,
      answerLatex: answerLatex(co, rLab[0], rLab[1], cLab[0], cLab[1], showColin, false),
      working,
      _matrix: M, _aspect: tblW(2) / tblH(2),
      key: `l1-${co.a}-${co.b}-${co.c}-${co.d}-${showColin}-${id}`,
      difficulty: level,
    } as unknown as AnyQuestion;
  }

  // ── Level 2: 3×3 dominance-reduces to the 2×2 core ────────────────────────────
  if (level === "level2") {
    let co = genCore(showColin);
    let A: Assembled = { M: [[co.a, co.b], [co.c, co.d]], rLab: rLabels(2), cLab: cLabels(2), bindRows: [0, 1], bindCols: [0, 1] };
    for (let tries = 0; tries <= 200; tries++) {
      co = genCore(showColin);
      A = addCol(addRow({ M: [[co.a, co.b], [co.c, co.d]], rLab: rLabels(2), cLab: cLabels(2), bindRows: [0, 1], bindCols: [0, 1] }));
      const flat = A.M.flat();
      if (saddle(A.M).noSaddle && Math.max(...flat) <= 12 && Math.min(...flat) >= -12) break;
    }
    const rd = A.rowDecoy!, cd = A.colDecoy!;
    const coreM = [[co.a, co.b], [co.c, co.d]];
    const working: WorkingStep[] = [
      ...saddleSteps(saddle(A.M)),
      mStep(`Row $${A.rLab[rd.at]}$ is dominated by row $${A.rLab[rd.by]}$ (smaller in every column), so Rose never plays it — delete it:`,
        `${A.rLab[rd.at]} < ${A.rLab[rd.by]}`),
      mStep(`Column $${A.cLab[cd.at]}$ is dominated by column $${A.cLab[cd.by]}$ (larger in every row, worse for Colin) — delete it:`,
        `${A.cLab[cd.at]} > ${A.cLab[cd.by]}`),
      mStep("This leaves the 2×2 game:", matrixLatex(coreM, rLabels(2), cLabels(2))),
      ...roseSteps(co, "R_1", "C_1"),
      ...(showColin ? colinSteps(co, "C_1") : []),
    ];
    return {
      kind: "simple",
      display: A.M.map((r) => `[${r.join(",")}]`).join(""),
      displayLatex: matrixLatex(A.M, A.rLab, A.cLab),
      answer: `p = ${fPlain(co.p)}, V = ${fPlain(co.V)}`,
      answerLatex: answerLatex(co, A.rLab[A.bindRows[0]], A.rLab[A.bindRows[1]], A.cLab[A.bindCols[0]], A.cLab[A.bindCols[1]], showColin, false),
      working,
      _matrix: A.M, _aspect: tblW(A.M[0].length) / tblH(A.M.length),
      key: `l2-${co.a}-${co.b}-${co.c}-${co.d}-${rd.at}-${cd.at}-${showColin}-${id}`,
      difficulty: level,
    } as unknown as AnyQuestion;
  }

  // ── Level 3: 2×3 graphical, optional 3×3 / 3×4 wrapper ────────────────────────
  const wrapper = dropdownValue || "direct";
  let co = genCore(false);
  let c3: [number, number] = [0, 0];
  let A: Assembled = { M: [[co.a, co.b], [co.c, co.d]], rLab: rLabels(2), cLab: cLabels(2), bindRows: [0, 1], bindCols: [0, 1] };
  for (let tries = 0; tries <= 400; tries++) {
    co = genCore(false);
    const maybe = genC3(co);
    if (!maybe) continue;
    c3 = maybe;
    const c3pos = randInt(0, 2);                      // position of the third column
    let base: Assembled = {
      M: [insertAt([co.a, co.b], c3pos, c3[0]), insertAt([co.c, co.d], c3pos, c3[1])],
      rLab: rLabels(2), cLab: cLabels(3),
      bindRows: [0, 1],
      bindCols: [0, 1, 2].filter((j) => j !== c3pos),
    };
    if (wrapper === "w33") base = addRow(base);
    else if (wrapper === "w34") base = addCol(addRow(base));
    A = base;
    const flat = A.M.flat();
    const okSize = wrapper === "direct" ? A.M.length === 2 : A.M.length === 3;
    if (saddle(A.M).noSaddle && okSize && Math.max(...flat) <= 12 && Math.min(...flat) >= -12) break;
  }
  // The third (graph) column is the surviving column that is neither binding nor a decoy.
  const c3Idx = A.cLab.findIndex((_, j) => !A.bindCols.includes(j) && (!A.colDecoy || j !== A.colDecoy.at));
  const c3Lab = A.cLab[c3Idx];
  const cA = A.cLab[A.bindCols[0]], cB = A.cLab[A.bindCols[1]];
  const working: WorkingStep[] = [...saddleSteps(saddle(A.M))];
  if (A.rowDecoy) {
    working.push(mStep(`Row $${A.rLab[A.rowDecoy.at]}$ is dominated by row $${A.rLab[A.rowDecoy.by]}$, so delete it:`,
      `${A.rLab[A.rowDecoy.at]} < ${A.rLab[A.rowDecoy.by]}`));
  }
  if (A.colDecoy) {
    working.push(mStep(`Column $${A.cLab[A.colDecoy.at]}$ is dominated by column $${A.cLab[A.colDecoy.by]}$, so delete it:`,
      `${A.cLab[A.colDecoy.at]} > ${A.cLab[A.colDecoy.by]}`));
    working.push(tStep(`The remaining columns $${cA}$, $${cB}$ and $${c3Lab}$ have no dominance between them — a graph is needed.`));
  }
  const graph: GraphData = {
    lines: [
      { label: cA, top: co.a, bot: co.c, binding: true },
      { label: cB, top: co.b, bot: co.d, binding: true },
      { label: c3Lab, top: c3[0], bot: c3[1], binding: false },
    ],
    p: fVal(co.p), pLatex: fLatex(co.p), vLatex: fLatex(co.V), V: fVal(co.V),
    rTop: A.rLab[A.bindRows[0]], rBot: A.rLab[A.bindRows[1]],
  };
  working.push(...graphSteps(co, c3, c3Lab, cA, cB, graph));
  working.push(...roseSteps(co, A.rLab[A.bindRows[0]], cA));

  return {
    kind: "simple",
    display: A.M.map((r) => `[${r.join(",")}]`).join(""),
    displayLatex: matrixLatex(A.M, A.rLab, A.cLab),
    answer: `p = ${fPlain(co.p)}, V = ${fPlain(co.V)}`,
    answerLatex: answerLatex(co, A.rLab[A.bindRows[0]], A.rLab[A.bindRows[1]], cA, cB, false, true, c3Lab),
    working,
    _graph: graph,
    _matrix: A.M, _aspect: tblW(A.M[0].length) / tblH(A.M.length),
    key: `l3-${wrapper}-${co.a}-${co.b}-${co.c}-${co.d}-${c3[0]}-${c3[1]}-${id}`,
    difficulty: level,
  } as unknown as AnyQuestion;
};

// Exposed for the generator smoke-test suite (src/tests/generators.test.ts).
export const __test = { TOOL_CONFIG, generateQuestion };

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      infoSections={INFO_SECTIONS}
      generateQuestion={generateQuestion}
      questionRenderer={questionRenderer}
      answerRenderer={answerRenderer}
      stepRenderer={stepRenderer}
      customPrintHandler={handleDiagramPrint}
      defaults={{ numQuestions: 6, numColumns: 2, maxColumns: 3, hideFontControls: true }}
    />
  );
}
