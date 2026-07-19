// ─────────────────────────────────────────────────────────────────────────────
// GRAPHER LAB — the test bench for SmartGrapher (src/shared/grapher).
//
// A dev-only playground: pick a curve type or a multi-line scenario, edit the
// numbers, toggle the custom-condition switches, and watch the exact same
// <SmartGrapher/> the tools embed redraw live. "Looks right here" == "right in
// the tool", because it renders the shared component.
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
  type EquationType, type FOI, type GraphSeries, type InequalityOp,
} from "../../shared";

type Mode =
  | "preset" | "custom" | "simeq" | "mixed"
  | "quadineq" | "linineq" | "linquad" | "area"
  | "sketch" | "graphsolve" | "simlin" | "transform" | "tangent" | "cubicineq";

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

// Custom probability case: E(p) = -4p² + 3p, locked to p ∈ [0, 1].
const PROB_A = -4, PROB_B = 3;
const probFn = (p: number) => PROB_A * p * p + PROB_B * p;
const probMaxP = -PROB_B / (2 * PROB_A);
const PROB_FOIS: FOI[] = [{ x: probMaxP, y: probFn(probMaxP), kind: "vertex", label: "optimal p" }];

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
    // Simultaneous-equation line coefficients.
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

  // Mixed-strategy demo: player-A payoff against opponent's two pure strategies,
  // as a function of A's probability p of playing strategy 1.
  //   vs opponent-left : 3p + 0(1−p) = 3p
  //   vs opponent-right: 1p + 4(1−p) = 4 − 3p
  const mixLeft = (p: number) => 3 * p;
  const mixRight = (p: number) => 4 - 3 * p;

  // Build the series + FOI summary for whichever mode is active.
  const { grapher, fois } = useMemo(() => {
    if (mode === "custom") {
      return {
        fois: PROB_FOIS,
        grapher: (
          <SmartGrapher
            equationType="custom"
            fn={probFn}
            config={{ domain: { xMin: 0, xMax: 1 }, lockDomain: true, axisLabels: { x: "p", y: "E(payoff)" }, fois: PROB_FOIS }}
            height={340}
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
        grapher: <SmartGrapher series={series} height={340} title="Simultaneous equations" />,
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
            height={340}
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
        grapher: <SmartGrapher {...recipe} height={340} title={`${qa}x² + ${qb}x + ${qc} ${op} 0`} />,
      };
    }
    if (mode === "linineq") {
      const recipe = linearInequality(1, 1, op); // y ⋛ x + 1
      return {
        fois: [],
        grapher: <SmartGrapher {...recipe} height={340} title={`y ${op} x + 1`} />,
      };
    }
    if (mode === "linquad") {
      const recipe = linearQuadraticIntersection([1, -1, -2], [1, 1], { quadLabel: "y = x² − x − 2", lineLabel: "y = x + 1" });
      const inter = findFunctionIntersections((x) => x * x - x - 2, (x) => x + 1, -50, 50);
      return {
        fois: inter.map((p) => ({ x: p.x, y: p.y, kind: "point", label: "solution" } as FOI)),
        grapher: <SmartGrapher {...recipe} height={340} title="Line meets parabola" />,
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
        grapher: <SmartGrapher {...recipe} height={340} title="Area between y = x² and y = x + 2" />,
      };
    }
    if (mode === "sketch") {
      const recipe = sketchQuadratic(1, -2, -3);
      return { fois: recipe.config?.fois ?? [], grapher: <SmartGrapher {...recipe} height={340} title="Sketch: y = x² − 2x − 3" /> };
    }
    if (mode === "graphsolve") {
      const recipe = graphicalSolution({ equationType: "quadratic", params: [1, 0, -4] }, 3);
      const inter = findFunctionIntersections((x) => x * x - 4, () => 3, -50, 50);
      return {
        fois: inter.map((p) => ({ x: p.x, y: p.y, kind: "point", label: "solution" } as FOI)),
        grapher: <SmartGrapher {...recipe} height={340} title="Solve x² − 4 = 3 graphically" />,
      };
    }
    if (mode === "simlin") {
      const recipe = simultaneousLinear([1, 1], [-1, 5]);
      const inter = findFunctionIntersections((x) => x + 1, (x) => -x + 5, -50, 50);
      return {
        fois: inter.map((p) => ({ x: p.x, y: p.y, kind: "point", label: "solution" } as FOI)),
        grapher: <SmartGrapher {...recipe} height={340} title="Simultaneous linear equations" />,
      };
    }
    if (mode === "transform") {
      const recipe = transformation({ equationType: "quadratic", params: [1, 0, 0] }, { c: -2, d: 1 }, { baseLabel: "y = x²", label: "y = (x − 2)² + 1" });
      return { fois: [], grapher: <SmartGrapher {...recipe} height={340} title="Transformation of y = x²" /> };
    }
    if (mode === "tangent") {
      const recipe = tangentAtPoint({ equationType: "quadratic", params: [1, 0, 0] }, 2);
      return { fois: recipe.config?.fois ?? [], grapher: <SmartGrapher {...recipe} height={340} title="Tangent to y = x² at x = 2" /> };
    }
    if (mode === "cubicineq") {
      const recipe = cubicInequality(1, 0, -1, 0, op); // x³ − x ⋛ 0
      return { fois: recipe.config?.fois ?? [], grapher: <SmartGrapher {...recipe} height={340} title={`x³ − x ${op} 0`} /> };
    }
    // preset
    return {
      fois: computeFOIs(preset.type, params),
      grapher: <SmartGrapher equationType={preset.type} params={params} height={340} title={preset.label} />,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, typeIdx, op, JSON.stringify(params), JSON.stringify(values)]);

  const modeBtn = (m: Mode, label: string, accent: string) => (
    <button
      onClick={() => setMode(m)}
      className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
        mode === m ? `text-white ${accent}` : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => { window.location.href = "/"; }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
          >
            <Home size={18} /> Home
          </button>
          <h1 className="text-2xl font-bold text-slate-800">Grapher Lab</h1>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">Dev</span>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* ── Controls ── */}
          <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-700 mb-2">Mode</div>
              <div className="flex flex-wrap gap-2">
                {modeBtn("preset", "single curve", "bg-blue-600 border-blue-600")}
                {modeBtn("simeq", "simultaneous eqs", "bg-emerald-600 border-emerald-600")}
                {modeBtn("mixed", "mixed strategy", "bg-purple-600 border-purple-600")}
                {modeBtn("custom", "custom probability", "bg-fuchsia-600 border-fuchsia-600")}
              </div>
              <div className="text-sm font-semibold text-slate-700 mt-3 mb-2">Regions &amp; recipes</div>
              <div className="flex flex-wrap gap-2">
                {modeBtn("quadineq", "quadratic inequality", "bg-blue-600 border-blue-600")}
                {modeBtn("linineq", "linear inequality", "bg-blue-600 border-blue-600")}
                {modeBtn("linquad", "line ∩ parabola", "bg-blue-600 border-blue-600")}
                {modeBtn("area", "area between curves", "bg-blue-600 border-blue-600")}
                {modeBtn("cubicineq", "cubic inequality", "bg-blue-600 border-blue-600")}
              </div>
              <div className="text-sm font-semibold text-slate-700 mt-3 mb-2">Sketch &amp; solve</div>
              <div className="flex flex-wrap gap-2">
                {modeBtn("sketch", "sketch quadratic", "bg-indigo-600 border-indigo-600")}
                {modeBtn("graphsolve", "solve f(x)=k", "bg-indigo-600 border-indigo-600")}
                {modeBtn("simlin", "simultaneous linear", "bg-indigo-600 border-indigo-600")}
                {modeBtn("transform", "transformation", "bg-indigo-600 border-indigo-600")}
                {modeBtn("tangent", "tangent at point", "bg-indigo-600 border-indigo-600")}
              </div>
            </div>

            {(mode === "quadineq" || mode === "linineq" || mode === "cubicineq") && (
              <div>
                <div className="text-sm font-semibold text-slate-700 mb-2">Inequality</div>
                <div className="flex gap-2">
                  {(([">", ">=", "<", "<="] as const)).map((o) => (
                    <button key={o} onClick={() => setOp(o)}
                      className={`px-3 py-1.5 rounded-lg text-sm border font-mono transition-colors ${
                        op === o ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                      }`}>{o}</button>
                  ))}
                </div>
                {mode === "quadineq" && (
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    {["a", "b", "c"].map((k) => (
                      <label key={k} className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="w-4">{k}</span>
                        <input type="number" step="any" value={values[`quadratic.${k}`] ?? 0}
                          onChange={(e) => set(`quadratic.${k}`, e.target.value)}
                          className="w-full px-2 py-1 rounded border border-slate-300 focus:border-blue-500 outline-none" />
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {mode === "preset" && (
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESETS.map((p, i) => (
                    <button
                      key={p.type}
                      onClick={() => setTypeIdx(i)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                        typeIdx === i ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-400"
                      }`}
                    >
                      {p.type}
                    </button>
                  ))}
                </div>
                <div className="text-sm font-semibold text-slate-700 mb-2">{preset.label}</div>
                <div className="grid grid-cols-2 gap-3">
                  {preset.coeffs.map((c) => (
                    <label key={c.key} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="w-24">{c.label}</span>
                      <input type="number" step="any" value={values[`${preset.type}.${c.key}`] ?? c.def}
                        onChange={(e) => set(`${preset.type}.${c.key}`, e.target.value)}
                        className="w-full px-2 py-1 rounded border border-slate-300 focus:border-blue-500 outline-none" />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {mode === "simeq" && (
              <div>
                <div className="text-sm font-semibold text-slate-700 mb-2">Two lines — the intersection is the solution</div>
                {(["l1", "l2"] as const).map((ln, idx) => (
                  <div key={ln} className="grid grid-cols-2 gap-3 mb-2">
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="w-20">line {idx + 1}: m</span>
                      <input type="number" step="any" value={num(`${ln}.m`)} onChange={(e) => set(`${ln}.m`, e.target.value)}
                        className="w-full px-2 py-1 rounded border border-slate-300 focus:border-emerald-500 outline-none" />
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="w-8">c</span>
                      <input type="number" step="any" value={num(`${ln}.c`)} onChange={(e) => set(`${ln}.c`, e.target.value)}
                        className="w-full px-2 py-1 rounded border border-slate-300 focus:border-emerald-500 outline-none" />
                    </label>
                  </div>
                ))}
              </div>
            )}

            {mode === "mixed" && (
              <div className="text-sm text-slate-600 space-y-2">
                <div className="font-semibold text-slate-700">Mixed strategy — value of the game</div>
                <p>Two payoff lines over A's probability <code className="bg-slate-100 px-1 rounded">p ∈ [0, 1]</code>:
                  <br />vs L: <code className="bg-slate-100 px-1 rounded">3p</code>,
                  vs R: <code className="bg-slate-100 px-1 rounded">4 − 3p</code>.</p>
                <p>Their intersection is the equilibrium — auto-detected and framed.</p>
              </div>
            )}

            {mode === "custom" && (
              <div className="text-sm text-slate-600 space-y-2">
                <div className="font-semibold text-slate-700">Custom probability curve</div>
                <p><code className="bg-slate-100 px-1 rounded">fn(p) = −4p² + 3p</code>, domain-locked to
                  <code className="bg-slate-100 px-1 rounded">p ∈ [0, 1]</code>, axes renamed, optimal p supplied as a FOI.</p>
              </div>
            )}

            <div className="border-t border-slate-100 pt-3">
              <div className="text-sm font-semibold text-slate-700 mb-1">Key points</div>
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

          {/* ── Live graph ── */}
          <div className="bg-white rounded-xl shadow p-5">
            <div className="text-sm font-semibold text-slate-700 mb-3">
              Live embed — click <span className="text-blue-600">Expand</span> for full interactivity
            </div>
            {grapher}
          </div>
        </div>
      </div>
    </div>
  );
}
