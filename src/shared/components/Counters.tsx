import type { Counter, CounterBoardData, CounterState } from "../counters";
import { COUNTER_POS, COUNTER_NEG } from "../counters";
import type { QOSnapshot, WorkingStep } from "../types";

// Negative counters — see src/shared/counters.ts. Plain HTML circles so they scale with text and need no SVG
// sizing. A yellow counter is +1, a red one −1; each is labelled with its value so colour is never the only cue.

const DARK_POS = "#a16207";
const DARK_NEG = "#b91c1c";

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
        // paired = circled as one zero pair; new = just placed
        boxShadow: state === "paired" ? "0 0 0 3px #fff, 0 0 0 6px #4f46e5" : state === "new" ? "0 0 0 3px #fff, 0 0 0 5px #0f172a" : undefined,
        transition: "opacity 0.3s ease, box-shadow 0.3s ease",
      }}
    >
      {pos ? "+1" : "−1"}
    </div>
  );
}

/** A board of counters in labelled rows. Rows keep a fixed minimum height so the board never resizes between steps. */
export function CounterBoard({ data, size = 44 }: { data: CounterBoardData; size?: number }) {
  const hasLabel = data.rows.some((r) => r.label);
  return (
    <div className="w-full flex flex-col gap-3">
      {data.rows.map((row, ri) => (
        <div key={ri} className="flex items-center gap-4 rounded-xl border-2 border-slate-200 bg-white px-4 py-3" style={{ minHeight: size + 24 }}>
          {hasLabel && <div className="w-24 shrink-0 text-left text-sm font-bold text-slate-500">{row.label ?? ""}</div>}
          <div className="flex flex-wrap items-center gap-2">
            {row.counters.map((c, ci) => <CounterDot key={ci} c={c} size={size} />)}
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
