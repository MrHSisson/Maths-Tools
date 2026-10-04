import { useState, useEffect } from "react";
import { Home, Play, Pause, ChevronLeft, ChevronRight, RotateCcw, Minus, Plus, Menu, X, Check } from "lucide-react";
import {
  PlaceValueTable, pvColumnSet, pvBaseColumnSet, pvBaseCells, pvCells, rippleIncrement,
  type PlaceValueTableData, type PVRow, type PVCell,
} from "../../shared";

// Binary Counting — an interactive sandbox. Odometers for denary, binary (and optionally hex) sit side by side and
// count up together, so students can see (1) a carry is the same idea in every base, and (2) every n-bit pattern is
// the (n−1)-bit pattern again, with a 0 and then a 1 in front.
//
// One press = one whole count. The carry chain is shown all at once (carry marks above the columns, the digits that
// turned over tinted) with a short summary underneath — nothing is revealed in stages. Pressing → on all ones shows
// the overflow and wraps to 0. A second view lists every number as a row (paged past 4 bits — 256 rows would be
// unreadable, and the last four bits repeat on every page anyway).

const MAX_BITS = 8;
const PAGE = 16;
const LIST_H = 40;
const ODO_H = 88;   // odometer row — big enough to read from the back of a classroom
const ODO_W = 64;
const PLAY_MS = { normal: 1800, slow: 3200 } as const;

const popcount = (n: number) => n.toString(2).split("").filter((c) => c === "1").length;

/** The number on screen, and the number it just counted up from (null until a count has happened). */
interface Counter { count: number; prev: number | null }

export default function BinaryCounting() {
  const [bits, setBits] = useState(4);
  const [c, setC] = useState<Counter>({ count: 0, prev: null });
  const [playing, setPlaying] = useState(false);
  const [view, setView] = useState<"odometer" | "list">("odometer");
  const [menuOpen, setMenuOpen] = useState(false);
  // Settings (in the menu)
  const [showHex, setShowHex] = useState(false);
  const [powers, setPowers] = useState(false);
  const [pattern, setPattern] = useState(true);
  const [explain, setExplain] = useState(true);
  const [slow, setSlow] = useState(false);

  const { count, prev } = c;
  const list = view === "list";
  const size = 2 ** bits;
  const paged = list && bits > 4;
  const start = paged ? Math.floor(count / PAGE) * PAGE : 0;

  const stepUp = () => setC((o) => {
    if (list) return { count: Math.min(size - 1, o.count + 1), prev: null };
    return { count: (o.count + 1) % size, prev: o.count };   // the odometer wraps round (overflow)
  });
  const stepDown = () => setC((o) => ({ count: Math.max(0, o.count - 1), prev: null }));
  const reset = () => { setC({ count: 0, prev: null }); setPlaying(false); };
  const setBitsTo = (b: number) => { setBits(b); setC((o) => ({ count: Math.min(o.count, 2 ** b - 1), prev: null })); setPlaying(false); };

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(stepUp, list ? 800 : PLAY_MS[slow ? "slow" : "normal"]);
    return () => window.clearInterval(id);
  }, [playing, list, slow, bits]);   // eslint-disable-line react-hooks/exhaustive-deps
  const wrapped = !list && prev === size - 1 && count === 0;
  useEffect(() => { if (playing && (wrapped || (list && count >= size - 1))) setPlaying(false); }, [playing, wrapped, list, count, size]);

  // ── What just happened (odometer only) ─────────────────────────────────────
  const ripple = !list && prev !== null && (prev + 1) % size === count ? rippleIncrement(prev, 2, bits) : null;
  const finalBeat = ripple ? ripple.beats[ripple.beats.length - 1] : null;
  const carryCols = new Set(ripple ? ripple.beats.map((b) => b.carryCol).filter((x) => x >= 0) : []);
  const overflow = !!ripple?.overflow;

  // ── Tables ─────────────────────────────────────────────────────────────────
  const topCols = !pattern ? 0 : paged ? bits - 4 : bits >= 2 ? 1 : 0;   // leading columns that are "new" at this width

  const rowsFor = (cellsOf: (n: number) => string[], binary: boolean): PVRow[] => {
    if (list) {
      return Array.from({ length: Math.min(size, PAGE) }, (_, i) => start + i).map((n) => ({
        kind: "cells" as const,
        cells: cellsOf(n).map((v, i): PVCell => ({
          v, tone: n === count ? "current" : binary && i < topCols ? "highlight" : undefined,
        })),
        rule: !paged && bits >= 2 && n === size / 2,
      }));
    }
    const before = prev !== null ? cellsOf(prev) : null;
    return [{
      kind: "cells",
      cells: cellsOf(count).map((v, i): PVCell => ({
        v,
        tone: (binary && finalBeat ? finalBeat.changed[i] : before && before[i] !== v) ? "current" : binary && i < topCols ? "highlight" : undefined,
        above: binary && carryCols.has(i) ? "1" : undefined,
      })),
    }];
  };

  const base = { showPoint: false, cellHeight: list ? LIST_H : ODO_H, headerStyle: (powers ? "words" : "letters") as "words" | "letters", colWidth: list ? undefined : ODO_W };
  const denDigits = Math.max(2, String(size - 1).length);
  const den = pvColumnSet(denDigits, 0);
  const denTable: PlaceValueTableData = { ...base, columns: den.columns, columnNames: den.columnNames, onesIndex: den.onesIndex, colWidth: list ? 52 : ODO_W, rows: rowsFor((n) => pvCells(String(n), den.columns, den.onesIndex), false) };
  const bin = pvBaseColumnSet(2, bits);
  const binTable: PlaceValueTableData = { ...base, columns: bin.columns, columnNames: bin.columnNames, onesIndex: bin.onesIndex, groupEvery: bits > 4 ? 4 : undefined, rows: rowsFor((n) => pvBaseCells(n, 2, bits), true) };
  const hexDigits = Math.ceil(bits / 4);
  const hex = pvBaseColumnSet(16, hexDigits);
  const hexTable: PlaceValueTableData = { ...base, columns: hex.columns, columnNames: hex.columnNames, onesIndex: hex.onesIndex, colWidth: list ? 52 : ODO_W, rows: rowsFor((n) => pvBaseCells(n, 16, hexDigits), false) };

  // ── Words under the tables ─────────────────────────────────────────────────
  const parts = Array.from({ length: bits }, (_, i) => 2 ** (bits - 1 - i)).filter((pv) => (count & pv) !== 0);
  const sumLine = count === 0 ? "0" : parts.length > 1 ? `${parts.join(" + ")} = ${count}` : `${count}`;
  const listNote = paged
    ? `Rows ${start}–${start + PAGE - 1}. The last four bits run 0000 → 1111 on every page — only the leading bits change.`
    : bits < 2 ? "One bit: just 0 and 1."
    : `The bottom ${size / 2} rows are the top ${size / 2} rows again, with a 1 in front (+${size / 2} in denary).`;

  // ── Small UI pieces ────────────────────────────────────────────────────────
  const Seg = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick} className={`px-4 py-1.5 text-sm font-semibold transition-colors ${on ? "bg-blue-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}>{children}</button>
  );
  const IconBtn = ({ onClick, disabled, title, children, primary }: { onClick: () => void; disabled?: boolean; title: string; children: React.ReactNode; primary?: boolean }) => (
    <button onClick={onClick} disabled={disabled} title={title} aria-label={title}
      className={`rounded-xl border-2 transition-colors disabled:opacity-35 ${primary ? "p-3.5 bg-blue-900 border-blue-900 text-white hover:bg-blue-800" : "p-2.5 bg-white border-slate-300 text-slate-700 hover:border-blue-400"}`}>
      {children}
    </button>
  );
  const Title = ({ t, warn }: { t: string; warn?: boolean }) => (
    <div className={`text-center text-sm font-bold uppercase tracking-wider mb-1.5 ${warn ? "text-red-600" : "text-slate-500"}`}>{t}</div>
  );
  const Toggle = ({ on, set, label }: { on: boolean; set: (v: boolean) => void; label: string }) => (
    <button onClick={() => set(!on)} className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-slate-800 hover:bg-slate-100">
      <span className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${on ? "bg-blue-900 border-blue-900" : "border-slate-400"}`}>{on && <Check size={14} color="#fff" />}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header: Home · title · settings menu */}
      <div className="bg-blue-900 shadow-lg">
        <div className="px-4 sm:px-8 py-4 flex items-center justify-between">
          <button onClick={() => { window.location.href = "/"; }}
            className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors"
            style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 16, fontWeight: 600 }}>
            <Home size={24} color="#fff" /><span className="text-white font-semibold text-lg">Home</span>
          </button>
          <h1 className="text-white font-bold text-xl sm:text-2xl">Binary Counting</h1>
          <div className="relative">
            <button onClick={() => setMenuOpen((o) => !o)} aria-label="Settings" className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors" style={{ border: "none", background: "transparent", cursor: "pointer" }}>
              {menuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-30 py-2 overflow-hidden">
                  <div className="px-4 py-1 text-xs font-bold uppercase tracking-wider text-slate-400">Show</div>
                  <Toggle on={showHex} set={setShowHex} label="Hexadecimal" />
                  <Toggle on={powers} set={setPowers} label="Headings as powers (2⁷, 2⁶ …)" />
                  <Toggle on={pattern} set={setPattern} label="Highlight the leading bit(s)" />
                  <div className="px-4 pt-2 pb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Counting</div>
                  <Toggle on={explain} set={setExplain} label="Explain each count" />
                  <Toggle on={slow} set={setSlow} label="Slower auto-play" />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5">
        {/* One toolbar: bits · counting controls · view */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mb-6">
          <div className="flex items-center gap-2">
            <IconBtn onClick={() => setBitsTo(bits - 1)} disabled={bits <= 1} title="Fewer bits"><Minus size={18} /></IconBtn>
            <div className="w-20 text-center"><span className="text-2xl font-bold text-slate-800">{bits}</span><span className="text-slate-500 ml-1">{bits === 1 ? "bit" : "bits"}</span></div>
            <IconBtn onClick={() => setBitsTo(bits + 1)} disabled={bits >= MAX_BITS} title="More bits"><Plus size={18} /></IconBtn>
          </div>
          <div className="flex items-center gap-2">
            <IconBtn onClick={reset} title="Back to 0"><RotateCcw size={18} /></IconBtn>
            <IconBtn onClick={stepDown} disabled={count <= 0} title="Count down"><ChevronLeft size={20} /></IconBtn>
            <IconBtn onClick={() => (list && count >= size - 1 ? (reset(), setPlaying(true)) : setPlaying((p) => !p))} title={playing ? "Pause" : "Count up automatically"}>{playing ? <Pause size={18} /> : <Play size={18} />}</IconBtn>
            <IconBtn onClick={stepUp} disabled={list && count >= size - 1} title="Add 1" primary><ChevronRight size={22} /></IconBtn>
          </div>
          <div className="inline-flex rounded-xl overflow-hidden border-2 border-slate-300">
            <Seg on={!list} onClick={() => { setView("odometer"); setPlaying(false); setC((o) => ({ ...o, prev: null })); }}>Odometer</Seg>
            <Seg on={list} onClick={() => { setView("list"); setPlaying(false); setC((o) => ({ ...o, prev: null })); }}>List</Seg>
          </div>
        </div>

        {/* The odometers, side by side (wrapping on a narrow screen) */}
        <div className={list ? "flex flex-col sm:flex-row gap-5 items-start justify-center" : "flex flex-wrap gap-x-8 gap-y-6 items-start justify-center"}>
          <div className={list ? "w-full sm:w-auto sm:flex-none" : "max-w-full"}><Title t="Denary" /><PlaceValueTable data={denTable} /></div>
          <div className={list ? "w-full sm:flex-1 min-w-0" : "max-w-full"}><Title t={overflow ? "Binary — overflow!" : "Binary"} warn={overflow} /><PlaceValueTable data={binTable} /></div>
          {showHex && <div className={list ? "w-full sm:w-auto sm:flex-none" : "max-w-full"}><Title t="Hex" /><PlaceValueTable data={hexTable} /></div>}
        </div>

        {/* What it shows — one card, nothing in stages */}
        <div className="mt-6 max-w-2xl mx-auto">
          {list ? (
            <p className="text-center text-lg text-slate-700">{listNote}</p>
          ) : (
            <div className={`rounded-2xl border-2 px-5 py-4 ${overflow ? "bg-red-50 border-red-300" : "bg-white border-slate-200"}`}>
              <div className="text-center text-2xl font-bold text-slate-800">
                {ripple && prev !== null ? <>{prev} + 1 = {count}</> : <>{count}</>}
                {!overflow && parts.length > 1 && <span className="text-slate-400 font-medium text-lg ml-3">({sumLine})</span>}
              </div>
              {explain && (ripple ? (
                <div className="mt-3 space-y-1.5 text-base text-slate-700">
                  {ripple.beats.map((b, i) => (
                    <div key={i} className={`flex gap-2 ${b.kind === "overflow" ? "font-semibold text-red-800" : ""}`}>
                      <span className="text-slate-400 select-none">{b.kind === "overflow" ? "!" : "•"}</span><span>{b.short}</span>
                    </div>
                  ))}
                  {overflow
                    ? <p className="pt-2 text-sm text-red-800">{bits} bits can only hold up to {size - 1}, so {size - 1} + 1 wraps round to 0. A binary addition does the same when its answer is too big for the register.</p>
                    : ripple.beats.length > 1 && <p className="pt-2 text-sm text-slate-500">A carry, just like 9 + 1 = 10 in denary: {popcount(count ^ (prev as number))} bits change.</p>}
                </div>
              ) : (
                <p className="mt-2 text-center text-slate-500">
                  {count === size - 1 ? "All ones — press → to see what happens when we add 1." : "Press → to add 1."}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
