// The storage-unit ladder drawn as a vertical scale (PB at the top, bit at the bottom). Start unit filled, target unit
// outlined; every ×1000 hop carries its ×1024 in brackets. Shared by Data Units (whiteboard scaffold) and File Sizes
// (scaffold and the step picture). See `shared/dataUnits.ts`.

import { UNIT_FACTORS, UNIT_PLURAL } from "../dataUnits";

const TOP_DOWN = [7, 6, 5, 4, 3, 2, 1, 0];

export interface UnitLadderProps {
  /** start unit (index on the ladder) and target unit */
  a: number;
  b: number;
  /** Show Answer: the whole path lit, the target filled */
  showAnswer: boolean;
  /** only the units from the start to the target (larger, nothing to distract) */
  relevantOnly: boolean;
  /** Stepwise: the unit the walk has got to so far (a = nothing lit yet). Overrides the all-at-once `showAnswer` path. */
  reach?: number;
  /** Highest unit drawn (File Sizes stops at MB — GB, TB and PB would only distract) */
  maxUnit?: number;
}

export function UnitLadder({ a, b, showAnswer, relevantOnly, reach, maxUnit = 7 }: UnitLadderProps) {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const units = TOP_DOWN.filter((i) => i <= maxUnit && (!relevantOnly || (i >= lo && i <= hi)));
  const big = relevantOnly;   // fewer rows → bigger type
  const stepwise = reach !== undefined;
  // units the walk has passed (excluding the start): between a and `reach`, in the direction of b
  const dir = b >= a ? 1 : -1;
  const passed = (i: number) => (stepwise ? (i - a) * dir > 0 && (reach! - i) * dir >= 0 : showAnswer && i > lo && i < hi);
  const atTarget = stepwise ? reach === b : showAnswer;
  const pill = (i: number): string => {
    if (i === a) return "bg-blue-900 text-white border-2 border-blue-900";
    if (i === b) return atTarget ? "bg-emerald-600 text-white border-2 border-emerald-600" : "bg-amber-50 text-amber-800 border-2 border-dashed border-amber-500";
    if (passed(i)) return "bg-sky-100 text-slate-800 border-2 border-sky-300";
    return "bg-white text-slate-500 border-2 border-slate-300";
  };
  return (
    <div className="mx-auto flex flex-col items-center select-none" style={{ width: big ? 340 : 270 }}>
      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">The scale</div>
      {units.map((i) => {
        const f = i > 0 ? UNIT_FACTORS[i - 1] : 0;
        const hasLink = i > 0 && (!relevantOnly || i > lo);
        const onPath = stepwise ? (i - a) * dir > 0 && (reach! - i) * dir >= 0 : showAnswer && i > lo && i <= hi;
        const downCls = onPath && a > b ? "text-blue-900 font-bold" : "text-slate-500";
        const upCls = onPath && a < b ? "text-blue-900 font-bold" : "text-slate-500";
        return (
          <div key={i} className="w-full flex flex-col items-center">
            <div className={`${big ? "w-40 py-1.5 text-xl" : "w-32 py-0.5 text-base"} text-center rounded-lg font-bold ${pill(i)}`}>{i === 0 ? "bit" : i === 1 ? "nibble" : i === 2 ? "byte" : UNIT_PLURAL[i]}</div>
            {hasLink && (
              <div className={`w-full flex justify-between leading-tight ${big ? "text-base py-1.5" : "text-sm py-0.5"}`}>
                <span className={downCls}>↓ × {f}{f === 1000 ? " (× 1024)" : ""}</span>
                <span className={upCls}>↑ ÷ {f}{f === 1000 ? " (÷ 1024)" : ""}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
