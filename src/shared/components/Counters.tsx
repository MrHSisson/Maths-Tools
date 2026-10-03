import type React from "react";
import type { Counter, CounterBoardData, CounterState } from "../counters";
import { COUNTER_POS, COUNTER_NEG } from "../counters";
import type { QOSnapshot, WorkingStep } from "../types";

// Negative counters — see src/shared/counters.ts. Plain HTML circles so they scale with text and need no SVG
// sizing. A yellow counter is +1, a red one −1; each is labelled with its value so colour is never the only cue.

const DARK_POS = "#a16207";
const DARK_NEG = "#b91c1c";
/** Outline colour of a zero pair's box. */
export const PAIR_BOX = "#38a9e0";

/** One counter. `size` is the diameter in px. */
export function CounterDot({ c, size = 44 }: { c: Counter; size?: number }) {
  const pos = c.sign > 0;
  const state: CounterState = c.state ?? "normal";
  const removed = state === "removed";
  return (
    <div
      aria-label={pos ? "positive counter" : "negative counter"}
      style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: pos ? COUNTER_POS : COUNTER_NEG,
        border: `${Math.max(2, size / 16)}px ${removed ? "dashed" : "solid"} ${pos ? DARK_POS : DARK_NEG}`,
        color: pos ? "#713f12" : "#fff",
        fontWeight: 800, fontSize: size * 0.4, lineHeight: 1, letterSpacing: -0.5,
        opacity: removed ? 0.28 : 1,
        // a zero pair is shown by boxing the + over the − (PairBox), not by ringing each counter; new = just placed
        boxShadow: state === "new" ? "0 0 0 3px #fff, 0 0 0 5px #0f172a" : undefined,
        transition: "opacity 0.3s ease, box-shadow 0.3s ease",
      }}
    >
      {pos ? "+1" : "−1"}
    </div>
  );
}

/** Frame style for a zero pair: a rounded blue box around a + stacked over a −. */
export const pairBoxStyle: React.CSSProperties = { border: `3px solid ${PAIR_BOX}`, borderRadius: 14, boxSizing: "border-box" };

/** A zero pair: a yellow counter above a red one, boxed together. */
export function PairBox({ size = 44 }: { size?: number }) {
  return (
    <div style={{ ...pairBoxStyle, display: "flex", flexDirection: "column", alignItems: "center", gap: Math.round(size * 0.18), padding: `${Math.round(size * 0.14)}px ${Math.round(size * 0.12)}px` }}>
      <CounterDot c={{ sign: 1, state: "paired" }} size={size} />
      <CounterDot c={{ sign: -1, state: "paired" }} size={size} />
    </div>
  );
}

/** The representation table: a + row above a − row, counters aligned in columns. A column holding both a + and
 *  a − is a zero pair and is boxed. The label column is split from the counters by a vertical rule
 *  and the rows by a horizontal one, so everything stays in place. */
function CounterMat({ data, size = 44 }: { data: CounterBoardData; size?: number }) {
  const pos = data.rows[0]?.counters ?? [], neg = data.rows[1]?.counters ?? [];
  const cols = Math.max(pos.length, neg.length, 1);
  const laneH = size + 20, slot = size + 18;
  const paired = (i: number) => pos[i] !== undefined && neg[i] !== undefined && pos[i].state !== "removed" && neg[i].state !== "removed";
  const cell = (cs: Counter[], i: number) => (
    <div key={i} style={{ width: slot, height: laneH, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {cs[i] && <CounterDot c={cs[i]} size={size} />}
    </div>
  );
  return (
    <div className="w-full flex flex-col gap-3">
      <div className="mx-auto max-w-full overflow-x-auto">
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: `56px repeat(${cols}, ${slot}px)`, gridTemplateRows: `${laneH}px ${laneH}px`, border: "2px solid #cbd5e1", borderRadius: 12, background: "#fff", width: "max-content" }}>
          {/* a +/− pair in one column is a zero pair: box it, like the pairs in the free-standing rows */}
          {Array.from({ length: cols }, (_, i) => paired(i) && (
            <div key={`b${i}`} style={{ ...pairBoxStyle, position: "absolute", left: 56 + i * slot + 3, top: 4, width: slot - 6, height: laneH * 2 - 8, zIndex: 2, pointerEvents: "none" }} />
          ))}
          {/* label column + the two rules */}
          <div style={{ gridColumn: 1, gridRow: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, fontWeight: 800, color: "#a16207", borderRight: "3px solid #334155", borderBottom: "3px solid #334155", zIndex: 1 }}>+</div>
          <div style={{ gridColumn: 1, gridRow: 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, fontWeight: 800, color: "#b91c1c", borderRight: "3px solid #334155", zIndex: 1 }}>−</div>
          {Array.from({ length: cols }, (_, i) => (
            <div key={`t${i}`} style={{ gridColumn: i + 2, gridRow: 1, borderBottom: "3px solid #334155", zIndex: 1 }}>{cell(pos, i)}</div>
          ))}
          {Array.from({ length: cols }, (_, i) => (
            <div key={`u${i}`} style={{ gridColumn: i + 2, gridRow: 2, zIndex: 1 }}>{cell(neg, i)}</div>
          ))}
        </div>
      </div>
      {data.footer && <div className="text-center text-xl font-bold text-slate-800">{data.footer}</div>}
    </div>
  );
}

/** A board of counters in labelled rows. Rows keep a fixed minimum height so the board never resizes between steps. */
export function CounterBoard({ data, size = 44 }: { data: CounterBoardData; size?: number }) {
  if (data.layout === "mat") return <CounterMat data={data} size={size} />;
  const hasLabel = data.rows.some((r) => r.label);
  return (
    <div className="w-full flex flex-col gap-3">
      {data.rows.map((row, ri) => (
        <div key={ri} className="flex items-center gap-4 rounded-xl border-2 border-slate-200 bg-white px-4 py-3" style={{ minHeight: size + 24 }}>
          {hasLabel && <div className="w-24 shrink-0 text-left text-sm font-bold text-slate-500">{row.label ?? ""}</div>}
          <div className="flex flex-wrap items-center gap-2">
            {row.counters.map((c, ci, all) => {
              // a paired + followed by a paired − is one zero pair: stack them in a box
              if (c.state === "paired" && c.sign > 0 && all[ci + 1]?.state === "paired" && all[ci + 1].sign < 0) return <PairBox key={ci} size={size} />;
              if (c.state === "paired" && c.sign < 0 && all[ci - 1]?.state === "paired" && all[ci - 1].sign > 0) return null;
              return <CounterDot key={ci} c={c} size={size} />;
            })}
          </div>
        </div>
      ))}
      {data.footer && <div className="text-center text-xl font-bold text-slate-800">{data.footer}</div>}
    </div>
  );
}

type Snapshot = { kind?: string; caption?: string; board?: CounterBoardData };

/** `stepRenderer` for `cStep` tools: caption plus the board. Null for any other step. */
export const countersStepRenderer = (step: WorkingStep, _cs?: string, _qo?: QOSnapshot): JSX.Element | null => {
  const x = step.extra as Snapshot | undefined;
  if (x?.kind !== "countersSnapshot" || !x.board) return null;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-left" style={{ minHeight: "2.6em", lineHeight: 1.3 }}>{x.caption}</p>
      <CounterBoard data={x.board} />
    </div>
  );
};

/** `stepVisualRenderer` for `cStep` tools: just the board, so one board updates in place beside the captions. */
export const countersStepVisual = (step: WorkingStep): JSX.Element | null => {
  const x = step.extra as Snapshot | undefined;
  if (x?.kind !== "countersSnapshot" || !x.board) return null;
  return <CounterBoard data={x.board} />;
};
