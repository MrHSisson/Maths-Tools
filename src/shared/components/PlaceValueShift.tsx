import { useLayoutEffect, useRef, useState } from "react";
import { PV_WORD_HEADERS_KEY } from "../placeValue";
import type { QOSnapshot, WorkingStep } from "../types";

// Place value shift: the standard place value grid with ONE row of digits and a Power cell beside it (Standard Form's Converting picture).
// A tool works out each step as a `PlaceValueShiftFrame` and carries it on a step as `PlaceValueShiftStep`; this draws it.
// From step to step the SAME grid stays on screen: each digit slides one column (a CSS transition on its position),
// place-holding zeros fade in and out, and the power rolls over like an odometer. Reduced-motion turns every movement off.

/** One picture: the digits in their columns, the zeros that hold places, and the power beside them. */
export interface PlaceValueShiftFrame {
  /** Column headings, left to right (letters and the full names), and which column is the ones column (the point is drawn on its right edge). */
  headings: string[];
  names: string[];
  onesIndex: number;
  /** The significant digits in order, each with the column it sits in. The same digit keeps its place in this list from step to step, so it can slide. */
  digits: { ch: string; col: number }[];
  /** Columns holding a zero that only keeps a place (before the first digit, or after the last, as far as the ones column). */
  zeroCols: number[];
  /** The power of 10 beside the digits; null for the empty grid. */
  power: number | null;
  /** The last step: the first digit is circled and the digits turn green. */
  finish: boolean;
}

/** How a step carries a frame (on `WorkingStep.extra`), with the caption it is listed under. */
export interface PlaceValueShiftStep { kind: "placeValueShift"; caption: string; frame: PlaceValueShiftFrame; }

const SUP: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
/** A power of ten as text: 10⁵, 10⁻³. */
export const power10 = (n: number): string => `10${String(n).split("").map((c) => SUP[c]).join("")}`;

const SLIDE_MS = 650, ROLL_MS = 550, FADE_MS = 350;
const HEAD_H = 40, ROW_H = 64;

const CSS = `
.pvs-roll-in-up   { animation: pvs-in-up   ${ROLL_MS}ms ease-in-out both; }
.pvs-roll-out-up  { animation: pvs-out-up  ${ROLL_MS}ms ease-in-out both; }
.pvs-roll-in-down { animation: pvs-in-down ${ROLL_MS}ms ease-in-out both; }
.pvs-roll-out-down{ animation: pvs-out-down ${ROLL_MS}ms ease-in-out both; }
@keyframes pvs-in-up    { from { transform: translateY(100%); }  to { transform: translateY(0); } }
@keyframes pvs-out-up   { from { transform: translateY(0); }     to { transform: translateY(-100%); } }
@keyframes pvs-in-down  { from { transform: translateY(-100%); } to { transform: translateY(0); } }
@keyframes pvs-out-down { from { transform: translateY(0); }     to { transform: translateY(100%); } }
@media (prefers-reduced-motion: reduce) {
  .pvs-roll-in-up, .pvs-roll-out-up, .pvs-roll-in-down, .pvs-roll-out-down { animation: none !important; }
  .pvs-slide, .pvs-fade { transition: none !important; }
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
    <div className="relative overflow-hidden" style={{ height: ROW_H }} data-testid="pv-shift-power">
      {out && <div key={`out-${out.text}`} className={`absolute inset-0 flex items-center justify-center text-3xl font-semibold text-black pvs-roll-out-${out.dir}`} onAnimationEnd={() => setOut(null)}>{out.text}</div>}
      <div key={text} className={`absolute inset-0 flex items-center justify-center text-3xl font-semibold text-black ${out ? `pvs-roll-in-${dir}` : ""}`}>{text}</div>
    </div>
  );
}

export function PlaceValueShift({ frame, words = false }: { frame: PlaceValueShiftFrame; words?: boolean }) {
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
                <div key={`z${i}`} className="pvs-fade absolute top-0 flex items-center justify-center text-3xl font-semibold text-blue-600"
                  style={{ left: `${i * colW}%`, width: `${colW}%`, height: ROW_H, opacity: frame.zeroCols.includes(i) ? 1 : 0, transition: `opacity ${FADE_MS}ms ease-in-out` }}>0</div>
              ))}
              {frame.digits.map((d, i) => (
                <div key={`d${i}`} className="pvs-slide absolute left-0 top-0 flex items-center justify-center text-3xl font-semibold"
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

const dataOf = (step: WorkingStep): PlaceValueShiftStep | null => {
  const e = step.extra as PlaceValueShiftStep | undefined;
  return e?.kind === "placeValueShift" ? e : null;
};

/** `stepVisualRenderer`: the grid alone, so the cascade keeps ONE grid on screen and the digits slide between steps. */
export const placeValueShiftStepVisual = (step: WorkingStep, qo?: QOSnapshot): JSX.Element | null => {
  const d = dataOf(step);
  return d ? <PlaceValueShift frame={d.frame} words={!!qo?.variables?.[PV_WORD_HEADERS_KEY]} /> : null;
};

/** `stepRenderer`: the caption and the grid together, where there is no separate picture. */
export const placeValueShiftStepRenderer = (step: WorkingStep, qo?: QOSnapshot): JSX.Element | null => {
  const d = dataOf(step);
  return d ? (
    <div className="flex flex-col gap-3">
      <p className="text-left" style={{ minHeight: "2.6em", lineHeight: 1.3 }}>{d.caption}</p>
      <PlaceValueShift frame={d.frame} words={!!qo?.variables?.[PV_WORD_HEADERS_KEY]} />
    </div>
  ) : null;
};
