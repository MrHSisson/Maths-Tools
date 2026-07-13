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

// ── Critical region ───────────────────────────────────────────────────────────
//
// The critical (rejection) region is the fixed set of X values that would lead
// us to reject H₀ *before* seeing the data — it depends only on n, p₀, tail and α,
// not on the observed x. For each relevant tail we find the extreme critical
// value c such that the tail probability first drops to ≤ the tail's α budget
// (α for one-tailed, α/2 for each tail of a two-tailed test). The *actual*
// significance level is the true probability of landing in that region, which
// is usually a little below the nominal α because X is discrete.

interface CriticalRegion {
  lower: number | null;   // reject when X ≤ lower (left tail); null if that tail has no region
  upper: number | null;   // reject when X ≥ upper (right tail); null if that tail has no region
  actualSig: number;      // true P(reject H₀ | H₀), i.e. total probability of the region
}

function computeCriticalRegion(n: number, p0: number, tail: TailType, alpha: number): CriticalRegion {
  const pmf = (k: number) => binomPMF(k, n, p0);

  // Largest c with P(X ≤ c) ≤ budget (lower tail), or null if even P(X = 0) exceeds it.
  const lowerCrit = (budget: number): number | null => {
    let cum = 0, crit: number | null = null;
    for (let k = 0; k <= n; k++) {
      cum += pmf(k);
      if (cum <= budget) crit = k; else break;
    }
    return crit;
  };
  // Smallest c with P(X ≥ c) ≤ budget (upper tail), or null if even P(X = n) exceeds it.
  const upperCrit = (budget: number): number | null => {
    let cum = 0, crit: number | null = null;
    for (let k = n; k >= 0; k--) {
      cum += pmf(k);
      if (cum <= budget) crit = k; else break;
    }
    return crit;
  };
  const tailBelow = (c: number) => { let p = 0; for (let k = 0; k <= c; k++) p += pmf(k); return p; };
  const tailAbove = (c: number) => { let p = 0; for (let k = c; k <= n; k++) p += pmf(k); return p; };

  let lower: number | null = null;
  let upper: number | null = null;
  if (tail === "left")  lower = lowerCrit(alpha);
  else if (tail === "right") upper = upperCrit(alpha);
  else { lower = lowerCrit(alpha / 2); upper = upperCrit(alpha / 2); }

  // Guard against the (degenerate, very-large-α) case where the two tails would meet.
  if (lower !== null && upper !== null && lower >= upper) { upper = lower + 1 > n ? null : upper; }

  const actualSig =
    (lower !== null ? tailBelow(lower) : 0) +
    (upper !== null ? tailAbove(upper) : 0);

  return { lower, upper, actualSig };
}

function inCriticalRegion(k: number, cr: CriticalRegion): boolean {
  return (cr.lower !== null && k <= cr.lower) || (cr.upper !== null && k >= cr.upper);
}

function criticalRegionDesc(cr: CriticalRegion): string {
  const parts: string[] = [];
  if (cr.lower !== null) parts.push(`X ≤ ${cr.lower}`);
  if (cr.upper !== null) parts.push(`X ≥ ${cr.upper}`);
  return parts.length ? parts.join(" or ") : "none";
}

function criticalValuesStr(cr: CriticalRegion): string {
  const parts: string[] = [];
  if (cr.lower !== null) parts.push(String(cr.lower));
  if (cr.upper !== null) parts.push(String(cr.upper));
  return parts.length ? parts.join(", ") : "—";
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface BarDatum { k: number; pmf: number; inRegion: boolean; inCritical: boolean }

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
      {d.inCritical && <div className="text-amber-500 font-semibold text-xs mt-0.5">in critical region</div>}
    </div>
  );
}

// ── Parameter slider ──────────────────────────────────────────────────────────

interface ParamSliderProps {
  label: string; sub: string; id: string; value: number;
  min: number; max: number; step?: number;
  onChange: (v: number) => void;
}
function ParamSlider({ label, sub, id, value, min, max, step = 1, onChange }: ParamSliderProps) {
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
    <div className="bg-white rounded-2xl border-2 border-gray-200 px-5 py-4 flex flex-col gap-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <label htmlFor={id} className="text-sm font-bold text-blue-900 leading-none">{label}</label>
          <span className="text-xs text-gray-400 mt-1 leading-none">{sub}</span>
        </div>
        <input
          id={id} type="number" min={min} max={max} step={step} value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commit((e.target as HTMLInputElement).value); }}
          className="w-20 px-2 py-1.5 border-2 border-gray-200 rounded-lg text-xl font-bold tabular-nums text-center text-gray-800 focus:outline-none focus:border-blue-900 transition-colors"
        />
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-blue-900 cursor-pointer"
        aria-label={label}
      />
      <div className="flex justify-between text-[11px] font-semibold text-gray-400 tabular-nums">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}

// ── Segmented button (single) ─────────────────────────────────────────────────

function SegButton({ active, label, sub, onClick }: {
  active: boolean; label: string; sub?: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 min-w-0 flex flex-col items-center justify-center px-2 py-2.5 rounded-xl border-2 font-bold transition-all ${
        active
          ? "bg-blue-900 border-blue-900 text-white shadow-md"
          : "bg-white border-gray-200 text-gray-700 hover:border-blue-900 hover:text-blue-900 hover:shadow-sm"
      }`}
    >
      <span className="text-sm font-bold leading-tight">{label}</span>
      {sub && (
        <span className={`text-xs font-normal leading-tight mt-0.5 ${active ? "text-blue-200" : "text-gray-400"}`}>
          {sub}
        </span>
      )}
    </button>
  );
}

// ── Metric card ───────────────────────────────────────────────────────────────

function Metric({ label, value, valueClass = "text-gray-800", small = false }: { label: string; value: string; valueClass?: string; small?: boolean }) {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 px-4 py-3 flex-1 min-w-[150px]">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 whitespace-nowrap">{label}</div>
      <div className={`${small ? "text-lg" : "text-2xl"} font-bold tabular-nums leading-tight ${valueClass}`}>{value}</div>
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
  { value: "two"   as TailType, label: "Two-tailed",   sub: "α/2 per tail"    },
  { value: "right" as TailType, label: "Right-tailed",  sub: "P(X ≥ x)"        },
  { value: "left"  as TailType, label: "Left-tailed",   sub: "P(X ≤ x)"        },
];

const ALPHA_OPTIONS = [
  { value: "0.01", label: "1%",  sub: "α = 0.01" },
  { value: "0.05", label: "5%",  sub: "α = 0.05" },
  { value: "0.10", label: "10%", sub: "α = 0.10" },
];

const MODE_OPTIONS = [
  { value: "pvalue"   as const, label: "p-value",  sub: "region" },
  { value: "critical" as const, label: "Critical", sub: "region" },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function BinomialPValueExplorer() {
  const [p0, setP0]   = useState(0.5);
  const [n, setN]     = useState(20);
  const [x, setX]     = useState(14);
  const [tail, setTail]   = useState<TailType>("two");
  const [alphaStr, setAlphaStr] = useState("0.05");
  const [mode, setMode] = useState<"pvalue" | "critical">("pvalue");

  useEffect(() => { if (x > n) setX(n); }, [n, x]);

  const alpha = parseFloat(alphaStr);
  const showCritical = mode === "critical";
  const cr = computeCriticalRegion(n, p0, tail, alpha);

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
      return { k, pmf, inRegion, inCritical: showCritical && inCriticalRegion(k, cr) };
    });
  }, [p0, n, x, tail, showCritical, cr]);

  const data  = buildData();
  const pv    = computePValue(x, n, p0, tail);
  const pvStr = pv < 0.0001 ? "< 0.0001" : pv.toFixed(4);
  // Two-tailed compares p-value to α/2; one-tailed compares to α
  const alphaThreshold = tail === "two" ? alpha / 2 : alpha;
  const sig   = pv < alphaThreshold;
  const mean  = p0 * n;
  const sd    = Math.sqrt(n * p0 * (1 - p0)).toFixed(2);

  // Critical-region derived values
  const xInCrit    = inCriticalRegion(x, cr);
  const critDesc   = criticalRegionDesc(cr);
  const critVals   = criticalValuesStr(cr);
  const actualSig  = cr.actualSig;
  const actualSigStr = actualSig < 0.0001 ? "< 0.0001" : actualSig.toFixed(4);

  // Verdict reflects whichever method is on screen (the two always agree).
  const rejected = showCritical ? (critDesc !== "none" && xInCrit) : sig;

  const side = x >= mean ? "upper" : "lower";
  const oneTailDesc = x >= mean ? `P(X ≥ ${x})` : `P(X ≤ ${x})`;
  const thresholdStr = tail === "two" ? `α/2 = ${(alpha/2).toFixed(3)}` : `α = ${alphaStr}`;

  const twoTailNote = tail === "two"
    ? ` x = ${x} fell in the ${side} tail (E(X) = ${mean.toFixed(1)}), so p-value = ${oneTailDesc} = ${pvStr}. Comparing to ${thresholdStr}.`
    : "";

  const header = `H₀: p = ${p0.toFixed(2)}, X ∼ B(${n}, ${p0.toFixed(2)}). Observed x = ${x}.`;

  const pvalueInterp =
    header +
    twoTailNote +
    (sig
      ? ` p-value < ${thresholdStr} — reject H₀. Sufficient evidence that p ≠ ${p0.toFixed(2)}.`
      : ` p-value ≥ ${thresholdStr} — fail to reject H₀. Insufficient evidence that p ≠ ${p0.toFixed(2)}.`);

  const criticalInterp =
    header +
    ` Critical region: ${critDesc === "none" ? "none exists at this α" : critDesc} ` +
    `(actual significance level ${actualSigStr}).` +
    (critDesc === "none"
      ? " No value of x is extreme enough to reject H₀ at this significance level."
      : xInCrit
        ? ` x = ${x} lies in the critical region — reject H₀. Sufficient evidence that p ≠ ${p0.toFixed(2)}.`
        : ` x = ${x} lies outside the critical region — fail to reject H₀. Insufficient evidence that p ≠ ${p0.toFixed(2)}.`);

  const interpText = showCritical ? criticalInterp : pvalueInterp;

  // One region on screen at a time: p-value mode shades the observed tail (red),
  // critical mode shades the fixed rejection zone (amber).
  const barFill = (d: BarDatum): string => {
    if (showCritical) return d.inCritical ? "#F5A623" : "#85B7EB";
    return d.inRegion ? "#E24B4A" : "#85B7EB";
  };

  const tickEvery = n <= 20 ? 1 : n <= 50 ? 5 : n <= 100 ? 10 : 20;

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

            {/* ── Controls ── */}
            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-5 md:p-6 flex flex-col gap-6">
              {/* Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ParamSlider label="p₀" sub="hypothesised probability" id="bpe-p0" value={p0} min={0.01} max={0.99} step={0.01} onChange={setP0} />
                <ParamSlider label="n"  sub="number of trials"          id="bpe-n"  value={n}  min={1}    max={200}  step={1}    onChange={(v) => setN(Math.round(v))} />
                <ParamSlider label="x"  sub="observed successes"        id="bpe-x"  value={x}  min={0}    max={n}    step={1}    onChange={(v) => setX(Math.round(v))} />
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200" />

              {/* Options — three 3:3:2 flex groups so every button resolves to the
                  same width, with subtle dividers separating the groups. Labels and
                  buttons share the same structure so they stay aligned. */}
              <div className="flex flex-col gap-2.5">
                <div className="flex gap-2.5">
                  <div className="flex-[3] text-xs font-bold text-gray-500 uppercase tracking-wide text-center">Tail type</div>
                  <div className="w-px" />
                  <div className="flex-[3] text-xs font-bold text-gray-500 uppercase tracking-wide text-center">Significance level</div>
                  <div className="w-px" />
                  <div className="flex-[2] text-xs font-bold text-gray-500 uppercase tracking-wide text-center">Region shown</div>
                </div>
                <div className="flex items-stretch gap-2.5">
                  <div className="flex-[3] flex gap-2.5">
                    {TAIL_OPTIONS.map((o) => (
                      <SegButton key={o.value} active={tail === o.value} label={o.label} sub={o.sub} onClick={() => setTail(o.value)} />
                    ))}
                  </div>
                  <div className="w-px bg-gray-300 self-stretch my-1" />
                  <div className="flex-[3] flex gap-2.5">
                    {ALPHA_OPTIONS.map((o) => (
                      <SegButton key={o.value} active={alphaStr === o.value} label={o.label} sub={o.sub} onClick={() => setAlphaStr(o.value)} />
                    ))}
                  </div>
                  <div className="w-px bg-gray-300 self-stretch my-1" />
                  <div className="flex-[2] flex gap-2.5">
                    {MODE_OPTIONS.map((o) => (
                      <SegButton key={o.value} active={mode === o.value} label={o.label} sub={o.sub} onClick={() => setMode(o.value)} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Legend ── */}
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#85B7EB" }} />
                P(X = k)
              </span>
              {showCritical ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#F5A623" }} />
                  critical region
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#E24B4A" }} />
                  p-value region
                </span>
              )}
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
                      <Cell key={d.k} fill={barFill(d)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Divider */}
            <div style={{ height: "2px", backgroundColor: "#d1d5db" }} />

            {/* ── Output metrics ── */}
            <div className="flex gap-4 flex-wrap">
              {showCritical ? (
                <>
                  <Metric label="Critical value(s)" value={critVals} />
                  <Metric
                    label="Critical region"
                    value={critDesc}
                    small
                    valueClass={critDesc === "none" ? "text-gray-400" : "text-gray-800"}
                  />
                  <Metric label="Actual sig. level" value={actualSigStr} />
                </>
              ) : (
                <>
                  <Metric label="p-value" value={pvStr} valueClass={sig ? "text-green-700" : "text-gray-800"} />
                  <Metric label={tail === "two" ? "α/2 (threshold)" : "α (threshold)"} value={tail === "two" ? (alpha / 2).toFixed(3) : alphaStr} />
                </>
              )}
              <Metric label="Verdict"  value={rejected ? "Reject H₀" : "Accept H₀"} valueClass={rejected ? "text-green-700" : "text-gray-400"} />
              <Metric label="Mean (np)" value={mean.toFixed(2)} />
              <Metric label="Std dev"  value={sd} />
            </div>

            {/* ── Interpretation ── */}
            <div className="bg-white rounded-xl border-2 border-gray-200 px-5 py-4">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Interpretation</div>
              <p className="text-sm text-gray-600 leading-relaxed">{interpText}</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
