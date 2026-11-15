import { useLayoutEffect, useRef, useState } from "react";
import { PV_WORD_HEADERS_KEY, type QOSnapshot, type WorkingStep } from "../../shared";
import { power10, type GridFrame, type ShiftStepData } from "./StandardFormGrid";

// The Converting picture, drawn: the standard place value grid with one row of digits and a Power cell beside it.
// From step to step the SAME grid stays on screen: each digit slides one column (a CSS transition on its position),
// place-holding zeros fade in and out, and the power rolls over like an odometer. Reduced-motion turns every movement off.

const SLIDE_MS = 650, ROLL_MS = 550, FADE_MS = 350;
const HEAD_H = 40, ROW_H = 64;

const CSS = `
.sf-roll-in-up   { animation: sf-in-up   ${ROLL_MS}ms ease-in-out both; }
.sf-roll-out-up  { animation: sf-out-up  ${ROLL_MS}ms ease-in-out both; }
.sf-roll-in-down { animation: sf-in-down ${ROLL_MS}ms ease-in-out both; }
.sf-roll-out-down{ animation: sf-out-down ${ROLL_MS}ms ease-in-out both; }
@keyframes sf-in-up    { from { transform: translateY(100%); }  to { transform: translateY(0); } }
@keyframes sf-out-up   { from { transform: translateY(0); }     to { transform: translateY(-100%); } }
@keyframes sf-in-down  { from { transform: translateY(-100%); } to { transform: translateY(0); } }
@keyframes sf-out-down { from { transform: translateY(0); }     to { transform: translateY(100%); } }
@media (prefers-reduced-motion: reduce) {
  .sf-roll-in-up, .sf-roll-out-up, .sf-roll-in-down, .sf-roll-out-down { animation: none !important; }
  .sf-slide, .sf-fade { transition: none !important; }
}`;

/** The power of 10: when it changes, the old value rolls out and the new one rolls in (up when it goes up, down when it goes down). */
function PowerRoll({ power }: { power: number | null }) {
  const last = useRef<number | null>(power);
  const [out, setOut] = useState<{ text: string; dir: "up" | "down" } | null>(null);
  const [dir, setDir] = useState<"up" | "down">("up");
  useLayoutEffect(() => {
    const before = last.current;
    last.current = power;
    if (before !== null && power !== null && before !== power) {
      const d = power > before ? "up" : "down";
      setDir(d);
      setOut({ text: power10(before), dir: d });
    } else setOut(null);
  }, [power]);
  const text = power === null ? "" : power10(power);
  return (
    <div className="relative overflow-hidden" style={{ height: ROW_H }} data-testid="sf-power">
      {out && <div key={`out-${out.text}`} className={`absolute inset-0 flex items-center justify-center text-3xl font-semibold text-black sf-roll-out-${out.dir}`} onAnimationEnd={() => setOut(null)}>{out.text}</div>}
      <div key={text} className={`absolute inset-0 flex items-center justify-center text-3xl font-semibold text-black ${out ? `sf-roll-in-${dir}` : ""}`}>{text}</div>
    </div>
  );
}

export function ShiftGrid({ frame, words = false }: { frame: GridFrame; words?: boolean }) {
  const n = frame.headings.length;
  const colW = 100 / n;
  const dotX = `${(frame.onesIndex + 1) * colW}%`;
  const green = frame.finish;
  return (
    <div className="w-full" style={{ containerType: "inline-size" }}>
      <style>{CSS}</style>
      <div className="flex items-start gap-6">
        <div className="relative min-w-0 flex-1">
          {/* headings */}
          <div className="grid" style={{ gridTemplateColumns: `repeat(${n}, 1fr)`, height: HEAD_H }}>
            {frame.headings.map((h, i) => (
              <div key={i} className={`flex items-center justify-center border-2 border-black bg-slate-100 font-bold text-black ${words ? "px-0.5 text-[10px] leading-tight sm:text-[11px]" : "text-base"}`}>
                {words ? frame.names[i] : h}
              </div>
            ))}
          </div>
          {/* the empty cells, and over them the digits and the zeros that hold places */}
          <div className="relative" style={{ height: ROW_H }}>
            <div className="grid h-full" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
              {frame.headings.map((_h, i) => <div key={i} className="border-2 border-black bg-white" />)}
            </div>
            <div className="pointer-events-none absolute inset-0">
              {frame.headings.map((_h, i) => (
                <div key={`z${i}`} className="sf-fade absolute top-0 flex items-center justify-center text-3xl font-semibold text-blue-600"
                  style={{ left: `${i * colW}%`, width: `${colW}%`, height: ROW_H, opacity: frame.zeroCols.includes(i) ? 1 : 0, transition: `opacity ${FADE_MS}ms ease-in-out` }}>0</div>
              ))}
              {frame.digits.map((d, i) => (
                <div key={`d${i}`} className="sf-slide absolute left-0 top-0 flex items-center justify-center text-3xl font-semibold"
                  style={{ width: `${colW}%`, height: ROW_H, transform: `translateX(${d.col * 100}%)`, transition: `transform ${SLIDE_MS}ms ease-in-out`, color: green ? "#166534" : "#000" }}>
                  {frame.finish && i === 0
                    ? <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-indigo-500">{d.ch}</span>
                    : d.ch}
                </div>
              ))}
            </div>
          </div>
          {/* the decimal point, fixed on the right edge of the ones column */}
          {[HEAD_H / 2, HEAD_H + ROW_H / 2].map((y) => (
            <div key={y} className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black" style={{ left: dotX, top: y, zIndex: 10 }} />
          ))}
        </div>
        {/* the power, set apart */}
        <div className="shrink-0" style={{ width: "min(14cqw, 140px)" }}>
          <div className="flex items-center justify-center border-2 border-black bg-indigo-50 text-base font-bold text-black" style={{ height: HEAD_H }}>Power</div>
          <div className="border-2 border-black bg-white" style={{ height: ROW_H }}><PowerRoll power={frame.power} /></div>
        </div>
      </div>
    </div>
  );
}

const dataOf = (step: WorkingStep): ShiftStepData | null => {
  const e = step.extra as ShiftStepData | undefined;
  return e?.kind === "sfShift" ? e : null;
};

/** `stepVisualRenderer`: the grid alone, so the cascade keeps ONE grid on screen and the digits slide between steps. */
export const shiftStepVisual = (step: WorkingStep, qo?: QOSnapshot): JSX.Element | null => {
  const d = dataOf(step);
  return d ? <ShiftGrid frame={d.frame} words={!!qo?.variables?.[PV_WORD_HEADERS_KEY]} /> : null;
};

/** `stepRenderer`: the caption and the grid together, where there is no separate picture. */
export const shiftStepRenderer = (step: WorkingStep, qo?: QOSnapshot): JSX.Element | null => {
  const d = dataOf(step);
  return d ? (
    <div className="flex flex-col gap-3">
      <p className="text-left" style={{ minHeight: "2.6em", lineHeight: 1.3 }}>{d.caption}</p>
      <ShiftGrid frame={d.frame} words={!!qo?.variables?.[PV_WORD_HEADERS_KEY]} />
    </div>
  ) : null;
};
