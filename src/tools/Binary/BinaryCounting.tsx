import { useState, useEffect } from "react";
import { Home, Play, Pause, ChevronLeft, ChevronRight, RotateCcw, Plus } from "lucide-react";
import {
  PlaceValueTable, pvColumnSet, pvBaseColumnSet, pvBaseCells, pvCells,
  type PlaceValueTableData, type PVRow, type PVCell,
} from "../../shared";

// Binary Counting — an interactive sandbox. A column of full place value tables counts 0, 1, 2 … side by side in
// denary, binary (and optionally hex), so students can see (1) the rollover is the same idea in every base, and
// (2) every n-bit pattern is the (n−1)-bit pattern again, once with a 0 in front and once with a 1.
//
// Up to 8 bits. Past 4 bits the table shows one page of 16 rows (all 256 would be unreadable) — and the page
// itself shows the idea again: the last four bits run 0000 → 1111 on every page, only the leading bits change.

const MAX_BITS = 8;
const PAGE = 16;
const CELL_H = 40;

const popcount = (n: number) => n.toString(2).split("").filter((c) => c === "1").length;

export default function BinaryCounting() {
  const [bits, setBits] = useState(3);
  const [count, setCount] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [pattern, setPattern] = useState(true);
  const [words, setWords] = useState(false);
  const [showHex, setShowHex] = useState(false);
  // After "Add a bit" the second half (the copy with a 1 in front) stays hidden until the teacher reveals it.
  const [halfHidden, setHalfHidden] = useState(false);

  const size = 2 ** bits;
  const half = size / 2;
  const paged = bits > 4;
  const start = paged ? Math.floor(count / PAGE) * PAGE : 0;
  const last = halfHidden ? half - 1 : size - 1;

  const setBitsTo = (b: number, hide: boolean) => {
    setBits(b);
    setCount((c) => Math.min(c, hide ? 2 ** (b - 1) - 1 : 2 ** b - 1));
    setHalfHidden(hide && b >= 2 && b <= 4);
    setPlaying(false);
  };

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setCount((c) => {
        if (c >= last) { setPlaying(false); return c; }
        return c + 1;
      });
    }, 750);
    return () => window.clearInterval(id);
  }, [playing, last]);

  const step = (d: number) => setCount((c) => Math.max(0, Math.min(last, c + d)));

  // ── Build the three tables ─────────────────────────────────────────────────
  const rowNums = Array.from({ length: Math.min(size, PAGE) }, (_, i) => start + i);
  const topCols = !pattern ? 0 : paged ? bits - 4 : bits >= 2 ? 1 : 0;   // the columns that are "new" on this table/page

  const rowsFor = (cellsOf: (n: number) => string[], tintTop: boolean): PVRow[] =>
    rowNums.map((n) => {
      const hidden = halfHidden && n >= half;
      const shown = cellsOf(n);
      const cells: PVCell[] = shown.map((v, i) => ({
        v: hidden ? "" : v,
        tone: !hidden && n === count ? "current" : !hidden && tintTop && i < topCols ? "highlight" : undefined,
      }));
      return { kind: "cells", cells, rule: !paged && bits >= 2 && n === half };
    });

  const base = { showPoint: false, cellHeight: CELL_H, headerStyle: (words ? "words" : "letters") as "words" | "letters" };

  const denDigits = Math.max(2, String(size - 1).length);
  const den = pvColumnSet(denDigits, 0);
  const denTable: PlaceValueTableData = { ...base, columns: den.columns, columnNames: den.columnNames, onesIndex: den.onesIndex, colWidth: 52, rows: rowsFor((n) => pvCells(String(n), den.columns, den.onesIndex), false) };

  const bin = pvBaseColumnSet(2, bits);
  const binTable: PlaceValueTableData = { ...base, columns: bin.columns, columnNames: bin.columnNames, onesIndex: bin.onesIndex, groupEvery: paged || showHex ? 4 : undefined, rows: rowsFor((n) => pvBaseCells(n, 2, bits), true) };

  const hexDigits = Math.ceil(bits / 4);
  const hex = pvBaseColumnSet(16, hexDigits);
  const hexTable: PlaceValueTableData = { ...base, columns: hex.columns, columnNames: hex.columnNames, onesIndex: hex.onesIndex, colWidth: 52, rows: rowsFor((n) => pvBaseCells(n, 16, hexDigits), false) };

  // ── Readout under the tables ───────────────────────────────────────────────
  const bitStr = pvBaseCells(count, 2, bits).join("");
  const parts = Array.from({ length: bits }, (_, i) => 2 ** (bits - 1 - i)).filter((pv) => (count & pv) !== 0);
  const flips = count > 0 ? popcount(count ^ (count - 1)) : 0;
  const caption = paged
    ? `Rows ${start}–${start + PAGE - 1}. The last four bits run 0000 → 1111 on every page — only the leading bits change.`
    : bits < 2 ? "One bit: just 0 and 1."
    : halfHidden ? `This is the ${bits - 1}-bit table, with a 0 added in front. What will the next ${half} rows look like?`
    : `The bottom ${half} rows are the top ${half} rows again, with a 1 in front (+${half} in denary).`;

  const Chip = ({ on, onClick, children, title }: { on: boolean; onClick: () => void; children: React.ReactNode; title?: string }) => (
    <button onClick={onClick} title={title}
      className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-sm font-semibold border-2 transition-colors ${on ? "bg-blue-900 text-white border-blue-900" : "bg-white text-slate-700 border-slate-300 hover:border-blue-400"}`}>
      {children}
    </button>
  );
  const Round = ({ onClick, disabled, children, title }: { onClick: () => void; disabled?: boolean; children: React.ReactNode; title: string }) => (
    <button onClick={onClick} disabled={disabled} title={title}
      className="p-2.5 rounded-lg bg-white border-2 border-slate-300 text-slate-700 hover:border-blue-400 disabled:opacity-35 disabled:hover:border-slate-300">
      {children}
    </button>
  );
  const Title = ({ t }: { t: string }) => <div className="text-center text-sm font-bold uppercase tracking-wider text-slate-500 mb-1">{t}</div>;

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="bg-blue-900 shadow-lg">
        <div className="px-4 sm:px-8 py-4 flex items-center justify-between">
          <button onClick={() => { window.location.href = "/"; }}
            className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors"
            style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 16, fontWeight: 600 }}>
            <Home size={24} color="#fff" /><span className="text-white font-semibold text-lg">Home</span>
          </button>
          <h1 className="text-white font-bold text-xl sm:text-2xl">Binary Counting</h1>
          <div className="w-24" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold text-slate-600 mr-1">Bits</span>
            {Array.from({ length: MAX_BITS }, (_, i) => i + 1).map((b) => (
              <Chip key={b} on={bits === b} onClick={() => setBitsTo(b, false)}>{b}</Chip>
            ))}
            <button onClick={() => setBitsTo(bits + 1, true)} disabled={bits >= MAX_BITS} title="Add a bit — the new table is the old one with a 0 in front"
              className="ml-1 flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-35">
              <Plus size={16} />Add a bit
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <Round onClick={() => { setCount(0); setPlaying(false); }} title="Back to 0"><RotateCcw size={18} /></Round>
            <Round onClick={() => step(-1)} disabled={count <= 0} title="Count down"><ChevronLeft size={18} /></Round>
            <Round onClick={() => (count >= last ? (setCount(0), setPlaying(true)) : setPlaying((p) => !p))} title={playing ? "Pause" : "Count up automatically"}>
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </Round>
            <Round onClick={() => step(1)} disabled={count >= last} title="Count up"><ChevronRight size={18} /></Round>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip on={pattern} onClick={() => setPattern((p) => !p)} title="Colour the leading bit(s) that are new">Highlight new bits</Chip>
            <Chip on={showHex} onClick={() => setShowHex((p) => !p)} title="Show hexadecimal alongside">Hex</Chip>
            <Chip on={words} onClick={() => setWords((p) => !p)} title="Headings as powers of 2 (2⁷ … 2⁰)">Powers</Chip>
          </div>
        </div>

        {/* Tables — side by side, stacked on a phone */}
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="w-full sm:w-auto sm:flex-none"><Title t="Denary" /><PlaceValueTable data={denTable} /></div>
          <div className="w-full sm:flex-1 min-w-0"><Title t="Binary" /><PlaceValueTable data={binTable} /></div>
          {showHex && <div className="w-full sm:w-auto sm:flex-none"><Title t="Hex" /><PlaceValueTable data={hexTable} /></div>}
        </div>

        {/* Reveal the second half */}
        {halfHidden && (
          <div className="mt-4 text-center">
            <button onClick={() => setHalfHidden(false)}
              className="px-5 py-2.5 rounded-lg bg-amber-500 text-white font-bold hover:bg-amber-600">
              Copy it again with a 1 in front
            </button>
          </div>
        )}

        <p className="mt-4 text-center text-lg text-slate-700">{caption}</p>

        {/* Readout for the current count */}
        <div className="mt-3 rounded-xl bg-white border-2 border-slate-200 px-4 py-3 text-center text-slate-800">
          <div className="text-2xl font-bold">
            {count} <span className="text-slate-400">=</span> {bitStr.slice(0, bits > 4 ? bits - 4 : 0)}{bits > 4 && " "}{bitStr.slice(bits > 4 ? bits - 4 : 0)}
            {showHex && <span className="text-slate-400"> = {pvBaseCells(count, 16, hexDigits).join("")}<sub>16</sub></span>}
          </div>
          <div className="text-slate-600 mt-1">
            {count === 0 ? "Nothing to add up" : parts.join(" + ") + (parts.length > 1 ? ` = ${count}` : "")}
          </div>
          {flips > 0 && (
            <div className="text-sm text-slate-500 mt-1">
              {count - 1} → {count}: {flips} bit{flips > 1 ? "s" : ""} change{flips === 1 ? "s" : ""}
              {flips > 1 && " — a carry, just like 9 → 10 in denary"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
