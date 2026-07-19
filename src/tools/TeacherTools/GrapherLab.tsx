// ─────────────────────────────────────────────────────────────────────────────
// GRAPHER LAB — the test bench for SmartGrapher (src/shared/grapher).
//
// A dev-only playground: pick a scenario from the grouped menu, edit only the
// numbers that matter for it, and watch the exact same <SmartGrapher/> the tools
// embed redraw live. "Looks right here" == "right in the tool".
//
// Registered with enabled:false, so it only appears on the landing page in
// Developing-tools mode. The route (/grapher) always works by direct URL.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from "react";
import { Home } from "lucide-react";
import {
  SmartGrapher, computeFOIs, findFunctionIntersections,
  quadraticInequality, linearInequality, linearQuadraticIntersection, areaBetweenCurves,
  sketchQuadratic, graphicalSolution, simultaneousLinear, transformation, tangentAtPoint, cubicInequality,
  linearProgramming,
  type EquationType, type FOI, type GraphSeries, type InequalityOp, type LinearConstraint,
} from "../../shared";

type Mode =
  | "preset" | "custom" | "simeq" | "mixed"
  | "quadineq" | "linineq" | "linquad" | "area"
  | "sketch" | "graphsolve" | "simlin" | "transform" | "tangent" | "cubicineq"
  | "linprog";

interface PresetDef {
  type: EquationType;
  label: string;
  coeffs: { key: string; label: string; def: number }[];
}

const PRESETS: PresetDef[] = [
  { type: "linear",    label: "Linear  y = mx + c",            coeffs: [
    { key: "m", label: "m", def: 2 }, { key: "c", label: "c", def: -1 } ] },
  { type: "quadratic", label: "Quadratic  y = ax² + bx + c",   coeffs: [
    { key: "a", label: "a", def: 1 }, { key: "b", label: "b", def: -2 }, { key: "c", label: "c", def: -3 } ] },
  { type: "cubic",     label: "Cubic  y = ax³ + bx² + cx + d", coeffs: [
    { key: "a", label: "a", def: 1 }, { key: "b", label: "b", def: 0 }, { key: "c", label: "c", def: -3 }, { key: "d", label: "d", def: 0 } ] },
  { type: "circle",    label: "Circle  (x−h)² + (y−k)² = r²",  coeffs: [
    { key: "h", label: "h (centre x)", def: 1 }, { key: "k", label: "k (centre y)", def: -1 }, { key: "r", label: "r (radius)", def: 3 } ] },
  { type: "reciprocal",  label: "Reciprocal  y = a/(x−h) + k",   coeffs: [
    { key: "a", label: "a", def: 1 }, { key: "h", label: "h", def: 0 }, { key: "k", label: "k", def: 0 } ] },
  { type: "exponential", label: "Exponential  y = a·bˣ + k",      coeffs: [
    { key: "a", label: "a", def: 1 }, { key: "b", label: "b", def: 2 }, { key: "k", label: "k", def: 0 } ] },
  { type: "logarithm",   label: "Logarithm  y = a·log_b(x−h)",    coeffs: [
    { key: "a", label: "a", def: 1 }, { key: "b", label: "b", def: 10 }, { key: "h", label: "h", def: 0 } ] },
  { type: "sine",        label: "Sine  y = A·sin(Bx + C) + D",    coeffs: [
    { key: "A", label: "A", def: 2 }, { key: "B", label: "B", def: 1 }, { key: "C", label: "C", def: 0 }, { key: "D", label: "D", def: 0 } ] },
  { type: "cosine",      label: "Cosine  y = A·cos(Bx + C) + D",  coeffs: [
    { key: "A", label: "A", def: 2 }, { key: "B", label: "B", def: 1 }, { key: "C", label: "C", def: 0 }, { key: "D", label: "D", def: 0 } ] },
  { type: "tangent",     label: "Tangent  y = A·tan(Bx + C) + D", coeffs: [
    { key: "A", label: "A", def: 1 }, { key: "B", label: "B", def: 1 }, { key: "C", label: "C", def: 0 }, { key: "D", label: "D", def: 0 } ] },
  { type: "absolute",    label: "Modulus  y = a·|x − h| + k",     coeffs: [
    { key: "a", label: "a", def: 1 }, { key: "h", label: "h", def: 0 }, { key: "k", label: "k", def: 0 } ] },
];

// Grouped navigation. Preset rows carry a typeIdx; everything else is a mode.
interface MenuItem { label: string; mode: Mode; typeIdx?: number }
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const MENU: { group: string; items: MenuItem[] }[] = [
  { group: "Curves", items: PRESETS.map((p, i) => ({ label: cap(p.type), mode: "preset" as Mode, typeIdx: i })) },
  { group: "Two lines & intersections", items: [
    { label: "Simultaneous equations", mode: "simeq" },
    { label: "Simultaneous linear (recipe)", mode: "simlin" },
    { label: "Line ∩ parabola", mode: "linquad" },
    { label: "Area between curves", mode: "area" },
  ] },
  { group: "Inequalities & regions", items: [
    { label: "Quadratic inequality", mode: "quadineq" },
    { label: "Linear inequality", mode: "linineq" },
    { label: "Cubic inequality", mode: "cubicineq" },
    { label: "Linear programming", mode: "linprog" },
  ] },
  { group: "Sketch & solve", items: [
    { label: "Sketch quadratic", mode: "sketch" },
    { label: "Solve f(x) = k", mode: "graphsolve" },
    { label: "Transformation", mode: "transform" },
    { label: "Tangent at a point", mode: "tangent" },
  ] },
  { group: "Applications", items: [
    { label: "Mixed strategy", mode: "mixed" },
    { label: "Custom probability", mode: "custom" },
  ] },
];

// One-line description for the scenarios that have no adjustable inputs.
const BLURB: Partial<Record<Mode, string>> = {
  mixed: "Two payoff lines over p ∈ [0, 1]; their intersection is the equilibrium.",
  custom: "fn(p) = −4p² + 3p, domain-locked to [0, 1] with renamed axes and a supplied FOI.",
  linquad: "A parabola and a line; the crossings are auto-solved and dotted.",
  area: "The shaded region between y = x² and y = x + 2, clamped to the crossings.",
  sketch: "Roots, vertex, y-intercept and the axis of symmetry (dashed).",
  graphsolve: "Draws y = f(x) and the line y = k; dots the solutions.",
  simlin: "Two lines with only the solution point marked (intercepts suppressed).",
  transform: "y = x² overlaid (dashed) with y = (x − 2)² + 1.",
  tangent: "The curve plus its tangent at x = 2 and the point of tangency.",
  linprog: "Feasible region of four constraints; each vertex dotted, the optimum labelled.",
};

const round = (n: number) => {
  const r = Math.round(n * 1000) / 1000;
  return Object.is(r, -0) ? 0 : r;
};

export default function App() {
  const [mode, setMode] = useState<Mode>("preset");
  const [typeIdx, setTypeIdx] = useState(1); // quadratic
  const [op, setOp] = useState<InequalityOp>(">");
  const [values, setValues] = useState<Record<string, number>>(() => {
    const v: Record<string, number> = {};
    for (const p of PRESETS) for (const c of p.coeffs) v[`${p.type}.${c.key}`] = c.def;
    v["l1.m"] = 1;  v["l1.c"] = 1;
    v["l2.m"] = -1; v["l2.c"] = 5;
    return v;
  });

  const set = (key: string, raw: string) => {
    const n = parseFloat(raw);
    setValues((v) => ({ ...v, [key]: Number.isFinite(n) ? n : 0 }));
  };
  const num = (k: string, d = 0) => values[k] ?? d;

  const preset = PRESETS[typeIdx];
  const params = useMemo(
    () => preset.coeffs.map((c) => values[`${preset.type}.${c.key}`] ?? c.def),
    [preset, values],
  );

  const mixLeft = (p: number) => 3 * p;
  const mixRight = (p: number) => 4 - 3 * p;

  // Build the live grapher + key-point summary for the active scenario.
  const { grapher, fois } = useMemo(() => {
    if (mode === "custom") {
      const PROB_FOIS: FOI[] = [{ x: 0.375, y: 9 / 16, kind: "vertex", label: "optimal p" }];
      return {
        fois: PROB_FOIS,
        grapher: (
          <SmartGrapher
            equationType="custom"
            fn={(p) => -4 * p * p + 3 * p}
            config={{ domain: { xMin: 0, xMax: 1 }, lockDomain: true, axisLabels: { x: "p", y: "E(payoff)" }, fois: PROB_FOIS }}
            height={360}
            title="Expected payoff vs p"
          />
        ),
      };
    }
    if (mode === "simeq") {
      const l1 = (x: number) => num("l1.m") * x + num("l1.c");
      const l2 = (x: number) => num("l2.m") * x + num("l2.c");
      const inter = findFunctionIntersections(l1, l2, -50, 50);
      const series: GraphSeries[] = [
        { equationType: "linear", params: [num("l1.m"), num("l1.c")], label: `y = ${num("l1.m")}x + ${num("l1.c")}` },
        { equationType: "linear", params: [num("l2.m"), num("l2.c")], label: `y = ${num("l2.m")}x + ${num("l2.c")}` },
      ];
      return {
        fois: inter.map((p) => ({ x: p.x, y: p.y, kind: "point", label: "solution" } as FOI)),
        grapher: <SmartGrapher series={series} height={360} title="Simultaneous equations" />,
      };
    }
    if (mode === "mixed") {
      const inter = findFunctionIntersections(mixLeft, mixRight, 0, 1);
      const series: GraphSeries[] = [
        { equationType: "custom", fn: mixLeft, label: "vs opponent plays L" },
        { equationType: "custom", fn: mixRight, label: "vs opponent plays R" },
      ];
      return {
        fois: inter.map((p) => ({ x: p.x, y: p.y, kind: "point", label: "equilibrium" } as FOI)),
        grapher: (
          <SmartGrapher
            series={series}
            config={{ domain: { xMin: 0, xMax: 1 }, lockDomain: true, axisLabels: { x: "p", y: "payoff" } }}
            height={360}
            title="Mixed strategy — value of the game"
          />
        ),
      };
    }
    if (mode === "quadineq") {
      const qa = num("quadratic.a", 1), qb = num("quadratic.b", -2), qc = num("quadratic.c", -3);
      const recipe = quadraticInequality(qa, qb, qc, op);
      return {
        fois: recipe.config?.fois ?? [],
        grapher: <SmartGrapher {...recipe} height={360} title={`${qa}x² + ${qb}x + ${qc} ${op} 0`} />,
      };
    }
    if (mode === "linineq") {
      const recipe = linearInequality(1, 1, op);
      return { fois: [], grapher: <SmartGrapher {...recipe} height={360} title={`y ${op} x + 1`} /> };
    }
    if (mode === "linquad") {
      const recipe = linearQuadraticIntersection([1, -1, -2], [1, 1], { quadLabel: "y = x² − x − 2", lineLabel: "y = x + 1" });
      const inter = findFunctionIntersections((x) => x * x - x - 2, (x) => x + 1, -50, 50);
      return {
        fois: inter.map((p) => ({ x: p.x, y: p.y, kind: "point", label: "solution" } as FOI)),
        grapher: <SmartGrapher {...recipe} height={360} title="Line meets parabola" />,
      };
    }
    if (mode === "area") {
      const recipe = areaBetweenCurves(
        { equationType: "quadratic", params: [1, 0, 0], label: "y = x²" },
        { equationType: "linear", params: [1, 2], label: "y = x + 2" },
      );
      const inter = findFunctionIntersections((x) => x * x, (x) => x + 2, -50, 50);
      return {
        fois: inter.map((p) => ({ x: p.x, y: p.y, kind: "point", label: "bound" } as FOI)),
        grapher: <SmartGrapher {...recipe} height={360} title="Area between y = x² and y = x + 2" />,
      };
    }
    if (mode === "sketch") {
      const recipe = sketchQuadratic(1, -2, -3);
      return { fois: recipe.config?.fois ?? [], grapher: <SmartGrapher {...recipe} height={360} title="Sketch: y = x² − 2x − 3" /> };
    }
    if (mode === "graphsolve") {
      const recipe = graphicalSolution({ equationType: "quadratic", params: [1, 0, -4] }, 3);
      const inter = findFunctionIntersections((x) => x * x - 4, () => 3, -50, 50);
      return {
        fois: inter.map((p) => ({ x: p.x, y: p.y, kind: "point", label: "solution" } as FOI)),
        grapher: <SmartGrapher {...recipe} height={360} title="Solve x² − 4 = 3 graphically" />,
      };
    }
    if (mode === "simlin") {
      const recipe = simultaneousLinear([1, 1], [-1, 5]);
      const inter = findFunctionIntersections((x) => x + 1, (x) => -x + 5, -50, 50);
      return {
        fois: inter.map((p) => ({ x: p.x, y: p.y, kind: "point", label: "solution" } as FOI)),
        grapher: <SmartGrapher {...recipe} height={360} title="Simultaneous linear equations" />,
      };
    }
    if (mode === "transform") {
      const recipe = transformation({ equationType: "quadratic", params: [1, 0, 0] }, { c: -2, d: 1 }, { baseLabel: "y = x²", label: "y = (x − 2)² + 1" });
      return { fois: [], grapher: <SmartGrapher {...recipe} height={360} title="Transformation of y = x²" /> };
    }
    if (mode === "tangent") {
      const recipe = tangentAtPoint({ equationType: "quadratic", params: [1, 0, 0] }, 2);
      return { fois: recipe.config?.fois ?? [], grapher: <SmartGrapher {...recipe} height={360} title="Tangent to y = x² at x = 2" /> };
    }
    if (mode === "cubicineq") {
      const recipe = cubicInequality(1, 0, -1, 0, op);
      return { fois: recipe.config?.fois ?? [], grapher: <SmartGrapher {...recipe} height={360} title={`x³ − x ${op} 0`} /> };
    }
    if (mode === "linprog") {
      const constraints: LinearConstraint[] = [
        { a: 1, b: 0, c: 0, op: ">=" },
        { a: 0, b: 1, c: 0, op: ">=" },
        { a: 1, b: 1, c: 6, op: "<=" },
        { a: 1, b: 2, c: 8, op: "<=" },
      ];
      const recipe = linearProgramming(constraints, { objective: { a: 3, b: 2 }, maximise: true });
      return { fois: recipe.config?.fois ?? [], grapher: <SmartGrapher {...recipe} height={360} title="Maximise 3x + 2y" /> };
    }
    return {
      fois: computeFOIs(preset.type, params),
      grapher: <SmartGrapher equationType={preset.type} params={params} height={360} title={preset.label} />,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, typeIdx, op, JSON.stringify(params), JSON.stringify(values)]);

  // ── Contextual controls (only what the active scenario needs) ───────────────
  const numberField = (key: string, label: string, def = 0) => (
    <label key={key} className="flex items-center gap-2 text-sm text-slate-600">
      <span className="text-slate-500 min-w-max">{label}</span>
      <input type="number" step="any" value={values[key] ?? def} onChange={(e) => set(key, e.target.value)}
        className="w-full px-2 py-1 rounded-lg border border-slate-300 focus:border-blue-500 outline-none" />
    </label>
  );

  const opSelector = (
    <div className="flex gap-2">
      {([">", ">=", "<", "<="] as const).map((o) => (
        <button key={o} onClick={() => setOp(o)}
          className={`px-3 py-1.5 rounded-lg text-sm border font-mono transition-colors ${
            op === o ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
          }`}>{o}</button>
      ))}
    </div>
  );

  const renderControls = () => {
    if (mode === "preset") {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {preset.coeffs.map((c) => numberField(`${preset.type}.${c.key}`, c.label, c.def))}
        </div>
      );
    }
    if (mode === "quadineq") {
      return (
        <div className="space-y-3">
          {opSelector}
          <div className="grid grid-cols-3 gap-3">{["a", "b", "c"].map((k) => numberField(`quadratic.${k}`, k))}</div>
        </div>
      );
    }
    if (mode === "linineq" || mode === "cubicineq") return opSelector;
    if (mode === "simeq") {
      return (
        <div className="space-y-2">
          {(["l1", "l2"] as const).map((ln, i) => (
            <div key={ln} className="grid grid-cols-2 gap-3">
              {numberField(`${ln}.m`, `line ${i + 1}:  m`)}
              {numberField(`${ln}.c`, "c")}
            </div>
          ))}
        </div>
      );
    }
    return <p className="text-sm text-slate-500">{BLURB[mode] ?? "No adjustable parameters for this scenario."}</p>;
  };

  const isActive = (item: MenuItem) =>
    item.mode === "preset" ? mode === "preset" && typeIdx === item.typeIdx : mode === item.mode;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f5f3f0" }}>
      {/* Header — matches the Skill Library house style */}
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => { window.location.href = "/"; }}
            className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors"
          >
            <Home size={24} /><span className="font-semibold text-lg">Home</span>
          </button>
          <h1 className="text-xl font-bold text-white">Grapher Lab</h1>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-white/10 border border-white/20 rounded px-2 py-1">Dev</span>
          <span className="ml-auto text-sm text-blue-200 hidden sm:block">Pick a scenario · edit its numbers · Expand for full interactivity</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 p-6 max-w-6xl mx-auto">
        {/* ── Sidebar menu ── */}
        <nav className="md:w-60 shrink-0 bg-white rounded-xl shadow p-3 h-max">
          {MENU.map((section) => (
            <div key={section.group} className="mb-4 last:mb-0">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 mb-1">{section.group}</div>
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => { setMode(item.mode); if (item.typeIdx !== undefined) setTypeIdx(item.typeIdx); }}
                    className={`text-left px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                      isActive(item) ? "bg-blue-900 text-white font-medium" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Main preview pane ── */}
        <main className="flex-1 min-w-0 space-y-6">
          <div className="bg-white rounded-xl shadow p-5">{grapher}</div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow p-5">
              <div className="text-sm font-semibold text-slate-700 mb-3">Controls</div>
              {renderControls()}
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <div className="text-sm font-semibold text-slate-700 mb-3">Key points</div>
              {fois.length === 0 ? (
                <div className="text-sm text-slate-400">none derived</div>
              ) : (
                <ul className="text-sm text-slate-600 space-y-0.5">
                  {fois.map((f, i) => (
                    <li key={i} className="font-mono">{f.label ?? f.kind}: ({round(f.x)}, {round(f.y)})</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
