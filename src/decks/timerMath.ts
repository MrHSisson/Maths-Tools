// The deck timer's arithmetic, apart from the screen: a countdown is its total, the seconds left when it was last paused, and (while it
// runs) the clock time it will end at, so reading it never depends on how often anything redraws.
export const TIMER_MINUTES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export const isTimerMinutes = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 10;

export interface Countdown { total: number; left: number; endsAt: number | null }

export const startCountdown = (minutes: number, now: number, running = true): Countdown => ({ total: minutes * 60, left: minutes * 60, endsAt: running ? now + minutes * 60000 : null });
/** Seconds left at `now`. */
export const secondsLeft = (c: Countdown, now: number): number => (c.endsAt === null ? c.left : Math.max(0, (c.endsAt - now) / 1000));
export const isRunning = (c: Countdown) => c.endsAt !== null;
export const isFinished = (c: Countdown, now: number) => secondsLeft(c, now) <= 0;
export const pauseCountdown = (c: Countdown, now: number): Countdown => ({ ...c, left: secondsLeft(c, now), endsAt: null });
/** Starts it again from where it was paused; a finished timer starts over from its full length. */
export const resumeCountdown = (c: Countdown, now: number): Countdown => { const l = secondsLeft(c, now), left = l > 0 ? l : c.total; return { ...c, left, endsAt: now + left * 1000 }; };
/** The one control: pause a running timer, resume a paused one, start a finished one over. */
export const toggleCountdown = (c: Countdown, now: number): Countdown => (isRunning(c) && !isFinished(c, now) ? pauseCountdown(c, now) : resumeCountdown(c, now));

/** m:ss, rounded up so it never reads 0:00 while there is still time. */
export const timeText = (seconds: number): string => { const s = Math.ceil(Math.max(0, seconds)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
/** Blue most of the way, amber in the last quarter, red in the last tenth. */
export const timerColour = (fraction: number): string => (fraction > 0.25 ? "#2563eb" : fraction > 0.1 ? "#d97706" : "#dc2626");
