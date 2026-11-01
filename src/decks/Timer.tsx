import { useCallback, useEffect, useState } from "react";
import { Pause, Play, Timer as TimerIcon, X } from "lucide-react";
import { TIMER_MINUTES, isFinished, isRunning, secondsLeft, startCountdown, timeText, timerColour, toggleCountdown, type Countdown } from "./timerMath";

/** The deck's timer: one countdown at a time, started from the menu, a key, or a slide's own setting. */
export function useTimer() {
  const [c, setC] = useState<Countdown | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!c || !isRunning(c)) return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [c]);
  const start = useCallback((minutes: number, running = true) => { const t = Date.now(); setNow(t); setC(startCountdown(minutes, t, running)); }, []);
  const toggle = useCallback(() => { const t = Date.now(); setNow(t); setC((x) => (x ? toggleCountdown(x, t) : x)); }, []);
  const clear = useCallback(() => setC(null), []);
  return { countdown: c, now, start, toggle, clear };
}

/** The strip under the slide: a line that shrinks as time runs out, with the time and a pause button at the right end. The player scales the
 *  slide down to make room for it, so it never covers the slide's own content. */
export function TimerLine({ countdown, now, onToggle, onClear }: { countdown: Countdown; now: number; onToggle: () => void; onClear: () => void }) {
  const left = secondsLeft(countdown, now), done = isFinished(countdown, now), running = isRunning(countdown) && !done;
  const fraction = countdown.total > 0 ? left / countdown.total : 0, colour = timerColour(fraction);
  return (
    <div data-timer="" className="flex h-8 items-center gap-2 rounded-xl border border-slate-300 bg-white pl-3 pr-1.5 shadow-card">
      <div onClick={onToggle} role="progressbar" aria-label="Time left" aria-valuemin={0} aria-valuemax={countdown.total} aria-valuenow={Math.round(left)} className="h-2 flex-1 cursor-pointer overflow-hidden rounded-full bg-slate-200">
        <div className={done ? "h-full animate-pulse" : "h-full"} style={{ width: done ? "100%" : `${fraction * 100}%`, background: colour, transition: "width 0.25s linear, background 0.4s" }} />
      </div>
      <span className="w-12 text-right text-sm font-semibold tabular-nums" style={{ color: done ? "#dc2626" : "#334155" }} aria-live="off">{done ? "Time" : timeText(left)}</span>
      <button onClick={onToggle} aria-label={running ? "Pause the timer" : done ? "Start the timer again" : "Start the timer"} className="flex h-6 w-6 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100">{running ? <Pause size={13} /> : <Play size={13} />}</button>
      <button onClick={onClear} aria-label="Remove the timer" className="flex h-6 w-6 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"><X size={13} /></button>
    </div>
  );
}

/** The button and its menu of 1 to 10 minutes: choosing one starts the timer straight away. `up` opens the menu above the button. */
export function TimerMenu({ open, onOpenChange, onPick, up = false, className }: { open: boolean; onOpenChange: (open: boolean) => void; onPick: (minutes: number) => void; up?: boolean; className: string }) {
  return (
    <div className="relative">
      <button className={className} onClick={() => onOpenChange(!open)} aria-label="Timer" aria-expanded={open} title="Timer: choose 1 to 10 minutes (T)"><TimerIcon size={18} /></button>
      {open && (
        <div role="menu" aria-label="Timer length" className={`absolute right-0 z-50 w-64 rounded-2xl border border-slate-300 bg-white p-3 shadow-lift ${up ? "bottom-full mb-2" : "top-full mt-2"}`}>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Timer, minutes</div>
          <div className="grid grid-cols-5 gap-1.5">
            {TIMER_MINUTES.map((m) => <button key={m} role="menuitem" onClick={() => { onPick(m); onOpenChange(false); }} className="h-11 rounded-xl border border-slate-300 bg-white text-base font-semibold text-slate-800 hover:bg-blue-50 hover:border-blue-300">{m}</button>)}
          </div>
        </div>
      )}
    </div>
  );
}
