import { useState } from "react";
import { CHECK_PRIME, GRID_MAX, PRIME_COLOURS, SIEVE_PRIMES, checkEleven, circlePath, fillTimesTable, scribblePath, sieveAt, sieveSteps, tapMark, type GridMark } from "../shared/numberGrid";
import { SLIDE_BUTTON_PX, slideButton } from "./slideButton";
import type { DeckElement, FillMode } from "./types";

type El = Extract<DeckElement, { kind: "numberGrid" }>;
const CELL = 100, COLS = 10, SIZE = CELL * COLS;
const INK = "#1e293b", LINE = "#cbd5e1";

/** The 1 to 100 grid as a slide piece. Structure only (the default) is the plain numbers, tapped to scribble in the chosen prime's
 *  colour, with one button to finish that prime's times table; Filled in is the finished sieve (one click per step when staged); Blank
 *  is the empty grid. Taps are the teacher's live marks: they live in the player only and are cleared when the slide changes. */
export function NumberGridEl({ el, fill, stage, live }: { el: El; fill: FillMode; stage: number; live: boolean }) {
  const primes = el.stages ?? SIEVE_PRIMES;
  const [taps, setTaps] = useState<ReadonlyMap<number, GridMark>>(new Map());
  const [active, setActive] = useState(primes[0] ?? 2);
  const steps = sieveSteps(primes);
  const sieve = fill === "filled" ? sieveAt(el.staged ? Math.min(steps, Math.max(0, stage)) : steps, primes) : null;
  const marks = sieve ?? taps;
  const tappable = live && fill === "structure";
  // A prime is only ever circled, so it cannot be scribbled out by a slip; everything else is scribbled in the active prime's colour.
  const tap = (n: number) => setTaps((old) => { const next = new Map(old); if (next.has(n)) next.delete(n); else next.set(n, tapMark(n, active)); return next; });
  // 11 is checked last: it is circled, and its multiples are shown to be crossed out already, so the sieve can stop.
  const [checking, setChecking] = useState(false);
  const eleven = checkEleven(taps);
  const showCheck = tappable && checking;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ flex: 1, minHeight: 0 }}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%", display: "block" }} role="img" aria-label="Numbers 1 to 100 in a grid">
          {Array.from({ length: GRID_MAX }, (_, i) => {
            const n = i + 1, x = (i % COLS) * CELL, y = Math.floor(i / COLS) * CELL, m = marks.get(n);
            return (
              <g key={n} transform={`translate(${x} ${y})`} data-cell={n} onClick={tappable ? () => tap(n) : undefined} style={{ cursor: tappable ? "pointer" : "default" }}>
                <rect width={CELL} height={CELL} fill="white" stroke={LINE} strokeWidth={2} />
                {fill !== "blank" && <text x={CELL / 2} y={CELL / 2 + 15} textAnchor="middle" fontSize={44} fontWeight={600} fill={INK} fontFamily="'Segoe UI',Arial,sans-serif">{n}</text>}
                {showCheck && eleven.multiples.includes(n) && <rect x={5} y={5} width={CELL - 10} height={CELL - 10} rx={14} fill={PRIME_COLOURS[CHECK_PRIME]} fillOpacity={0.12} stroke={PRIME_COLOURS[CHECK_PRIME]} strokeWidth={5} strokeDasharray="10 8" pointerEvents="none" />}
                {m && <path d={m.circle ? circlePath(n, CELL, CELL) : scribblePath(n, CELL, CELL)} fill="none" stroke={m.colour} strokeWidth={m.circle ? 6 : 4.5} strokeLinecap="round" strokeLinejoin="round" opacity={m.circle ? 0.9 : 0.8} data-mark={m.circle ? "circle" : "scribble"} />}
              </g>
            );
          })}
          <rect width={SIZE} height={SIZE} fill="none" stroke={INK} strokeWidth={5} pointerEvents="none" />
        </svg>
      </div>
      {tappable && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {primes.map((p) => <button key={p} aria-pressed={active === p && !checking} onClick={() => { setActive(p); setChecking(false); }} style={{ ...slideButton, borderColor: PRIME_COLOURS[p], background: active === p && !checking ? PRIME_COLOURS[p] : "white", color: active === p && !checking ? "white" : PRIME_COLOURS[p] }}>{p}</button>)}
          <button onClick={() => setTaps((old) => fillTimesTable(old, active))} disabled={checking} style={slideButton}>Finish the {active} times table</button>
          <button aria-pressed={checking} onClick={() => { setChecking(true); setTaps((old) => (old.has(CHECK_PRIME) ? old : new Map(old).set(CHECK_PRIME, tapMark(CHECK_PRIME, CHECK_PRIME)))); }}
            style={{ ...slideButton, borderColor: PRIME_COLOURS[CHECK_PRIME], background: checking ? PRIME_COLOURS[CHECK_PRIME] : "white", color: checking ? "white" : PRIME_COLOURS[CHECK_PRIME] }}>Check {CHECK_PRIME}</button>
          <button onClick={() => { setTaps(new Map()); setChecking(false); }} disabled={taps.size === 0} style={{ ...slideButton, fontSize: SLIDE_BUTTON_PX }}>Clear</button>
        </div>
      )}
      {showCheck && (
        <div role="status" style={{ textAlign: "center", fontSize: 30, fontWeight: 600, color: PRIME_COLOURS[CHECK_PRIME] }}>
          {eleven.notYet.length === 0
            ? `Every multiple of ${CHECK_PRIME} (${eleven.multiples.slice(0, 3).join(", ")} … ${eleven.multiples[eleven.multiples.length - 1]}) is already crossed out, so there is nothing new to cross out. We can stop.`
            : `${eleven.notYet.length} multiple${eleven.notYet.length > 1 ? "s" : ""} of ${CHECK_PRIME} not crossed out yet: finish 2, 3, 5 and 7 first.`}
        </div>
      )}
    </div>
  );
}
