// ─────────────────────────────────────────────────────────────────────────────
// GRAPHER LAB — the test bench for SmartGrapher (src/shared/grapher).
//
// A dev-only playground: pick a curve type, type coefficients, toggle the
// custom-condition switches (domain lock, axis labels), and watch the exact
// same <SmartGrapher/> the tools embed redraw live. Because it renders the
// shared component, "looks right here" == "right in the tool".
//
// Registered with enabled:false, so it only appears on the landing page in
// Developing-tools mode. The route (/grapher) always works by direct URL.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from "react";
import { Home } from "lucide-react";
import { SmartGrapher, computeFOIs, type EquationType, type FOI } from "../../shared";

interface PresetDef {
  type: EquationType;
  label: string;
  coeffs: { key: string; label: string; def: number }[];
}

const PRESETS: PresetDef[] = [
  { type: "linear",    label: "Linear  y = mx + c",              coeffs: [
    { key: "m", label: "m", def: 2 }, { key: "c", label: "c", def: -1 } ] },
  { type: "quadratic", label: "Quadratic  y = ax² + bx + c",     coeffs: [
    { key: "a", label: "a", def: 1 }, { key: "b", label: "b", def: -2 }, { key: "c", label: "c", def: -3 } ] },
  { type: "cubic",     label: "Cubic  y = ax³ + bx² + cx + d",   coeffs: [
    { key: "a", label: "a", def: 1 }, { key: "b", label: "b", def: 0 }, { key: "c", label: "c", def: -3 }, { key: "d", label: "d", def: 0 } ] },
  { type: "circle",    label: "Circle  (x−h)² + (y−k)² = r²",    coeffs: [
    { key: "h", label: "h (centre x)", def: 1 }, { key: "k", label: "k (centre y)", def: -1 }, { key: "r", label: "r (radius)", def: 3 } ] },
];

// A worked custom case: Mixed-Strategy expected payoff E(p) over p ∈ [0, 1],
// with the axes renamed and the maximum marked as a supplied FOI.
const PROB_A = -4, PROB_B = 3, PROB_C = 0; // E(p) = -4p² + 3p
const probFn = (p: number) => PROB_A * p * p + PROB_B * p + PROB_C;
const probMaxP = -PROB_B / (2 * PROB_A);
const PROB_FOIS: FOI[] = [{ x: probMaxP, y: probFn(probMaxP), kind: "vertex", label: "optimal p" }];

export default function App() {
  const [typeIdx, setTypeIdx] = useState(1); // quadratic by default
  const [custom, setCustom] = useState(false);
  const [values, setValues] = useState<Record<string, number>>(() => {
    const v: Record<string, number> = {};
    for (const p of PRESETS) for (const c of p.coeffs) v[`${p.type}.${c.key}`] = c.def;
    return v;
  });

  const preset = PRESETS[typeIdx];
  const params = useMemo(
    () => preset.coeffs.map((c) => values[`${preset.type}.${c.key}`] ?? c.def),
    [preset, values],
  );

  const set = (key: string, raw: string) => {
    const n = parseFloat(raw);
    setValues((v) => ({ ...v, [key]: Number.isFinite(n) ? n : 0 }));
  };

  // FOIs for the info panel (presets derive; custom uses the supplied list).
  const fois: FOI[] = custom ? PROB_FOIS : computeFOIs(preset.type, params);

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
              <div className="text-sm font-semibold text-slate-700 mb-2">Curve</div>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p, i) => (
                  <button
                    key={p.type}
                    onClick={() => { setCustom(false); setTypeIdx(i); }}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      !custom && typeIdx === i
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-400"
                    }`}
                  >
                    {p.type}
                  </button>
                ))}
                <button
                  onClick={() => setCustom(true)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    custom
                      ? "bg-fuchsia-600 text-white border-fuchsia-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-fuchsia-400"
                  }`}
                >
                  custom (probability)
                </button>
              </div>
            </div>

            {!custom ? (
              <div>
                <div className="text-sm font-semibold text-slate-700 mb-2">{preset.label}</div>
                <div className="grid grid-cols-2 gap-3">
                  {preset.coeffs.map((c) => (
                    <label key={c.key} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="w-24">{c.label}</span>
                      <input
                        type="number"
                        step="any"
                        value={values[`${preset.type}.${c.key}`] ?? c.def}
                        onChange={(e) => set(`${preset.type}.${c.key}`, e.target.value)}
                        className="w-full px-2 py-1 rounded border border-slate-300 focus:border-blue-500 outline-none"
                      />
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-600 space-y-2">
                <div className="font-semibold text-slate-700">Mixed-Strategy expected payoff</div>
                <p>
                  A custom curve <code className="bg-slate-100 px-1 rounded">fn(p) = −4p² + 3p</code>,
                  domain-locked to <code className="bg-slate-100 px-1 rounded">p ∈ [0, 1]</code>, axes
                  renamed to <code className="bg-slate-100 px-1 rounded">p</code> /
                  <code className="bg-slate-100 px-1 rounded">E(payoff)</code>, and the optimal
                  probability supplied as a Feature of Interest.
                </p>
                <p>Demonstrates custom mode + special conditions in one embed.</p>
              </div>
            )}

            <div className="border-t border-slate-100 pt-3">
              <div className="text-sm font-semibold text-slate-700 mb-1">Features of Interest</div>
              {fois.length === 0 ? (
                <div className="text-sm text-slate-400">none derived</div>
              ) : (
                <ul className="text-sm text-slate-600 space-y-0.5">
                  {fois.map((f, i) => (
                    <li key={i} className="font-mono">
                      {f.kind}: ({round(f.x)}, {round(f.y)})
                    </li>
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
            {custom ? (
              <SmartGrapher
                equationType="custom"
                fn={probFn}
                config={{
                  domain: { xMin: 0, xMax: 1 },
                  lockDomain: true,
                  axisLabels: { x: "p", y: "E(payoff)" },
                  fois: PROB_FOIS,
                }}
                height={340}
                title="Expected payoff vs p"
              />
            ) : (
              <SmartGrapher
                equationType={preset.type}
                params={params}
                height={340}
                title={preset.label}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const round = (n: number) => {
  const r = Math.round(n * 1000) / 1000;
  return Object.is(r, -0) ? 0 : r;
};
