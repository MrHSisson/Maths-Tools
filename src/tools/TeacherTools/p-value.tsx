import { useState, useEffect, useCallback, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { Home, Menu, X } from "lucide-react";

// ── Maths helpers ─────────────────────────────────────────────────────────────

function logFact(n: number): number {
  let r = 0;
  for (let i = 2; i <= n; i++) r += Math.log(i);
  return r;
}

function binomPMF(k: number, n: number, p: number): number {
  if (p === 0) return k === 0 ? 1 : 0;
  if (p === 1) return k === n ? 1 : 0;
  return Math.exp(
    logFact(n) - logFact(k) - logFact(n - k) +
    k * Math.log(p) + (n - k) * Math.log(1 - p)
  );
}

type TailType = "two" | "right" | "left";

function computePValue(x: number, n: number, p0: number, tail: TailType): number {
  // For one-tailed tests: calculate the relevant tail directly.
  // For two-tailed (A-level method): calculate the one tail x fell in,
  // then compare to α/2 rather than α. The p-value returned here is
  // always the raw one-tail probability — the halving of α is handled
  // in the significance comparison.
  const mean = n * p0;
  if (tail === "right") {
    let p = 0;
    for (let k = x; k <= n; k++) p += binomPMF(k, n, p0);
    return Math.min(1, p);
  }
  if (tail === "left") {
    let p = 0;
    for (let k = 0; k <= x; k++) p += binomPMF(k, n, p0);
    return Math.min(1, p);
  }
  // Two-tailed: which tail did x fall in?
  if (x >= mean) {
    let p = 0;
    for (let k = x; k <= n; k++) p += binomPMF(k, n, p0);
    return Math.min(1, p);
  } else {
    let p = 0;
    for (let k = 0; k <= x; k++) p += binomPMF(k, n, p0);
    return Math.min(1, p);
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface BarDatum { k: number; pmf: number; inRegion: boolean }

// ── Custom tooltip ────────────────────────────────────────────────────────────

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: BarDatum }>;
}
function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl px-4 py-3 shadow-lg text-sm">
      <div className="font-bold text-gray-800">k = {d.k}</div>
      <div className="text-gray-500">P(X = {d.k}) = {d.pmf.toFixed(4)}</div>
      {d.inRegion && <div className="text-red-500 font-semibold text-xs mt-1">contributes to p-value</div>}
    </div>
  );
}

// ── Number input ──────────────────────────────────────────────────────────────

interface NumInputProps {
  label: string; id: string; value: number;
  min: number; max: number; step?: number;
  onChange: (v: number) => void;
}
function NumInput({ label, id, value, min, max, step = 1, onChange }: NumInputProps) {
  const [raw, setRaw] = useState(String(value));
  useEffect(() => { setRaw(String(value)); }, [value]);
  const commit = (str: string) => {
    const parsed = parseFloat(str);
    if (!isNaN(parsed)) {
      const clamped = Math.min(max, Math.max(min, parsed));
      onChange(clamped);
      setRaw(String(clamped));
    } else {
      setRaw(String(value));
    }
  };
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">
        {label}
      </label>
      <input
        id={id} type="number" min={min} max={max} step={step} value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") commit((e.target as HTMLInputElement).value); }}
        className="w-20 px-2 py-2 border-2 border-gray-300 rounded-lg text-base font-semibold text-center focus:outline-none focus:border-blue-900 transition-colors"
      />
      <span className="text-xs text-gray-400 text-center">{min} – {max}</span>
    </div>
  );
}

// ── Segmented button group (generic) ──────────────────────────────────────────

function SegGroup<T extends string>({
  label, options, value, onChange,
}: {
  label: string;
  options: { value: T; label: string; sub?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{label}</div>
      <div className="flex gap-2">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              onClick={() => onChange(o.value)}
              className={`flex flex-col items-center px-4 py-2 rounded-xl border-2 font-bold transition-colors whitespace-nowrap ${
                active
                  ? "bg-blue-900 border-blue-900 text-white"
                  : "bg-white border-gray-200 text-gray-700 hover:border-blue-900 hover:text-blue-900"
              }`}
            >
              <span className="text-sm font-bold leading-tight">{o.label}</span>
              {o.sub && (
                <span className={`text-xs font-normal leading-tight mt-0.5 ${active ? "text-blue-200" : "text-gray-400"}`}>
                  {o.sub}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Metric card ───────────────────────────────────────────────────────────────

function Metric({ label, value, valueClass = "text-gray-800" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 px-4 py-3 flex-1">
      <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-2xl font-bold tabular-nums ${valueClass}`}>{value}</div>
    </div>
  );
}

// ── Header bar ────────────────────────────────────────────────────────────────

function HeaderBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuOpen]);
  return (
    <div className="bg-blue-900 shadow-lg">
      <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
        <button
          onClick={() => { window.location.href = "/"; }}
          className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors"
        >
          <Home size={24} /><span className="font-semibold text-lg">Home</span>
        </button>
        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen((o) => !o)} className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors">
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden" style={{ minWidth: 200 }}>
              <div className="py-1">
                <div className="px-4 py-3 text-sm border-b border-gray-100">
                  <p className="font-bold text-gray-800 text-sm">Binomial Hypothesis Test</p>
                  <p className="text-xs text-gray-500 mt-0.5">Interactive teaching tool</p>
                </div>
                <button
                  onClick={() => { window.location.href = "/"; }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Home size={16} className="text-gray-400" />Return to Home
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TAIL_OPTIONS = [
  { value: "two"   as TailType, label: "Two-tailed",   sub: "p vs α/2 each tail" },
  { value: "right" as TailType, label: "Right-tailed",  sub: "P(X ≥ x)"        },
  { value: "left"  as TailType, label: "Left-tailed",   sub: "P(X ≤ x)"        },
];

const ALPHA_OPTIONS = [
  { value: "0.01", label: "1%",  sub: "α = 0.01" },
  { value: "0.05", label: "5%",  sub: "α = 0.05" },
  { value: "0.10", label: "10%", sub: "α = 0.10" },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function BinomialPValueExplorer() {
  const [p0, setP0]   = useState(0.5);
  const [n, setN]     = useState(20);
  const [x, setX]     = useState(14);
  const [tail, setTail]   = useState<TailType>("two");
  const [alphaStr, setAlphaStr] = useState("0.05");

  useEffect(() => { if (x > n) setX(n); }, [n, x]);

  const alpha = parseFloat(alphaStr);

  const buildData = useCallback((): BarDatum[] => {
    return Array.from({ length: n + 1 }, (_, k) => {
      const pmf = binomPMF(k, n, p0);
      let inRegion = false;
      const distMean = n * p0;
      if (tail === "right") {
        inRegion = k >= x;
      } else if (tail === "left") {
        inRegion = k <= x;
      } else {
        // Two-tailed: shade only the tail x fell in
        // The p-value is compared to α/2, so we only need one tail
        inRegion = x >= distMean ? k >= x : k <= x;
      }
      return { k, pmf, inRegion };
    });
  }, [p0, n, x, tail]);

  const data  = buildData();
  const pv    = computePValue(x, n, p0, tail);
  const pvStr = pv < 0.0001 ? "< 0.0001" : pv.toFixed(4);
  // Two-tailed compares p-value to α/2; one-tailed compares to α
  const alphaThreshold = tail === "two" ? alpha / 2 : alpha;
  const sig   = pv < alphaThreshold;
  const mean  = p0 * n;
  const sd    = Math.sqrt(n * p0 * (1 - p0)).toFixed(2);

  const side = x >= mean ? "upper" : "lower";
  const oneTailDesc = x >= mean ? `P(X ≥ ${x})` : `P(X ≤ ${x})`;
  const threshold = tail === "two" ? alpha / 2 : alpha;
  const thresholdStr = tail === "two" ? `α/2 = ${(alpha/2).toFixed(3)}` : `α = ${alphaStr}`;

  const tailDesc =
    tail === "right" ? "right-tailed" : tail === "left" ? "left-tailed" : "two-tailed";

  const twoTailNote = tail === "two"
    ? ` x = ${x} fell in the ${side} tail (E(X) = ${mean.toFixed(1)}), so p-value = ${oneTailDesc} = ${pvStr}. Comparing to ${thresholdStr}.`
    : "";

  const interpText =
    `H₀: p = ${p0.toFixed(2)}, X ∼ B(${n}, ${p0.toFixed(2)}). Observed x = ${x}.` +
    twoTailNote +
    (sig
      ? ` p-value < ${thresholdStr} — reject H₀. Sufficient evidence that p ≠ ${p0.toFixed(2)}.`
      : ` p-value ≥ ${thresholdStr} — fail to reject H₀. Insufficient evidence that p ≠ ${p0.toFixed(2)}.`);

  const tickEvery = n <= 20 ? 1 : n <= 50 ? 5 : 10;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f5f3f0" }}>
      <HeaderBar />

      <div className="p-8">
        <div className="max-w-6xl mx-auto">

          <h1 className="text-5xl font-bold text-center mb-8" style={{ color: "#000" }}>
            Binomial Hypothesis Test
          </h1>
          <div className="flex justify-center mb-8">
            <div style={{ width: "90%", height: "2px", backgroundColor: "#d1d5db" }} />
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col gap-6">

            {/* ── Controls row ── */}
            <div className="flex items-end gap-5 flex-wrap">
              <NumInput label="p₀" id="bpe-p0" value={p0} min={0.01} max={0.99} step={0.01} onChange={setP0} />
              <NumInput label="n"  id="bpe-n"  value={n}  min={1}    max={100}  step={1}    onChange={(v) => setN(Math.round(v))} />
              <NumInput label="x"  id="bpe-x"  value={x}  min={0}    max={n}    step={1}    onChange={(v) => setX(Math.round(v))} />
              <div style={{ width: "2px", alignSelf: "stretch", backgroundColor: "#d1d5db", flexShrink: 0, margin: "0 4px" }} />
              <SegGroup label="Tail type"          options={TAIL_OPTIONS}  value={tail}     onChange={setTail} />
              <div style={{ width: "2px", alignSelf: "stretch", backgroundColor: "#d1d5db", flexShrink: 0, margin: "0 4px" }} />
              <SegGroup label="Significance level" options={ALPHA_OPTIONS} value={alphaStr} onChange={setAlphaStr} />
            </div>

            {/* Divider */}
            <div style={{ height: "2px", backgroundColor: "#d1d5db" }} />

            {/* ── Legend ── */}
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#85B7EB" }} />
                P(X = k)
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#E24B4A" }} />
                p-value region
              </span>
            </div>

            {/* ── Chart ── */}
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 28 }} barCategoryGap="10%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.07)" vertical={false} />
                  <XAxis
                    dataKey="k"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    label={{ value: "Number of successes (k)", position: "insideBottom", offset: -18, fontSize: 12, fill: "#6b7280" }}
                    tickFormatter={(v: number) => (v % tickEvery === 0 ? String(v) : "")}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickFormatter={(v: number) => v.toFixed(3)}
                    label={{ value: "P(X = k)", angle: -90, position: "insideLeft", offset: 12, fontSize: 12, fill: "#6b7280" }}
                    width={60}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                  <Bar dataKey="pmf" isAnimationActive={false}>
                    {data.map((d) => (
                      <Cell key={d.k} fill={d.inRegion ? "#E24B4A" : "#85B7EB"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Divider */}
            <div style={{ height: "2px", backgroundColor: "#d1d5db" }} />

            {/* ── Output metrics row ── */}
            <div className="flex gap-4">
              <Metric label="p-value"  value={pvStr} valueClass={sig ? "text-green-700" : "text-gray-800"} />
              <Metric label={tail === "two" ? "α/2 (threshold)" : "α (threshold)"} value={tail === "two" ? (alpha / 2).toFixed(3) : alphaStr} />
              <Metric label="Verdict"  value={sig ? "Reject H₀" : "Accept H₀"} valueClass={sig ? "text-green-700" : "text-gray-400"} />
              <Metric label="Mean (np)" value={mean.toFixed(2)} />
              <Metric label="Std dev"  value={sd} />
              <div className="bg-white rounded-xl border-2 border-gray-200 px-4 py-3 flex-[2]">
                <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Interpretation</div>
                <p className="text-sm text-gray-600 leading-relaxed">{interpText}</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
