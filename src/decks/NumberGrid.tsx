import { useState } from "react";
import { GRID_MAX, PRIME_COLOURS, SIEVE_PRIMES, circlePath, fillTimesTable, scribblePath, sieveAt, sieveSteps, type GridMark } from "../shared/numberGrid";
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
  const tap = (n: number) => setTaps((old) => { const next = new Map(old); if (next.has(n)) next.delete(n); else next.set(n, { colour: PRIME_COLOURS[active] ?? INK, circle: n === active }); return next; });
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
                {m && <path d={m.circle ? circlePath(n, CELL, CELL) : scribblePath(n, CELL, CELL)} fill="none" stroke={m.colour} strokeWidth={m.circle ? 6 : 4.5} strokeLinecap="round" strokeLinejoin="round" opacity={m.circle ? 0.9 : 0.8} data-mark={m.circle ? "circle" : "scribble"} />}
              </g>
            );
          })}
          <rect width={SIZE} height={SIZE} fill="none" stroke={INK} strokeWidth={5} pointerEvents="none" />
        </svg>
      </div>
      {tappable && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {primes.map((p) => <button key={p} aria-pressed={active === p} onClick={() => setActive(p)} style={{ ...slideButton, borderColor: PRIME_COLOURS[p], background: active === p ? PRIME_COLOURS[p] : "white", color: active === p ? "white" : PRIME_COLOURS[p] }}>{p}</button>)}
          <button onClick={() => setTaps((old) => fillTimesTable(old, active))} style={slideButton}>Finish the {active} times table</button>
          <button onClick={() => setTaps(new Map())} disabled={taps.size === 0} style={{ ...slideButton, fontSize: SLIDE_BUTTON_PX }}>Clear</button>
        </div>
      )}
    </div>
  );
}
