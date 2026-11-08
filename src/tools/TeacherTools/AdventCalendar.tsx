import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Home, Lock, Maximize, Minimize, Settings } from "lucide-react";
import { Confetti } from "../../shared/components/Confetti";

// Advent Calendar: 24 doors (4 rows of 6), each hiding a name (or a greeting). The teacher types who is behind each door
// (or pastes a list to fill them in order or at random) and it is kept
// on this device only (localStorage); nothing is sent anywhere. A door opens to a large reveal card so the whole class
// can read it. With "open doors on a schedule" on, door 1 opens on a start date the teacher picks and one more door
// opens each day after it (optionally skipping weekends); until a door's day arrives it stays shut.
// Standalone classroom sandbox.

const DOORS = 24;
const KEY = "advent-calendar-v1";
const GREETING = "Merry Christmas!";

interface Saved { names?: string[]; assigned: string[]; opened: number[]; lock: boolean; start: string; skipWeekends: boolean }

const pad = (a: string[]) => { const r = a.slice(0, DOORS); while (r.length < DOORS) r.push(""); return r; };
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const parseNames = (t: string) => t.split(/\r?\n/).map(s => s.trim()).filter(Boolean);

function load(): Saved {
  let s: Partial<Saved> = {};
  try { s = JSON.parse(localStorage.getItem(KEY) ?? "{}") ?? {}; } catch { /* blocked or corrupt: start empty */ }
  const names = Array.isArray(s.names) ? s.names.map(String) : [];
  const assigned = Array.isArray(s.assigned) ? pad(s.assigned.map(String)) : shuffle(pad(names));
  const opened = Array.isArray(s.opened) ? s.opened.filter(n => Number.isInteger(n) && n >= 0 && n < DOORS) : [];
  const start = typeof s.start === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s.start) ? s.start : isoDate(defaultStart());
  return { assigned, opened, lock: s.lock === true, start, skipWeekends: s.skipWeekends !== false };
}

const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromIso = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
/** Today, or the coming Monday when today is a weekend: the usual first day of a class's calendar. */
function defaultStart(): Date {
  const d = midnight(new Date());
  while (isWeekend(d)) d.setDate(d.getDate() + 1);
  return d;
}
/** The day each door opens: door 1 on the start date, then one a day (or one a school day when weekends are skipped). */
function doorDates(startIso: string, skipWeekends: boolean): Date[] {
  const d = fromIso(startIso), out: Date[] = [];
  if (skipWeekends) while (isWeekend(d)) d.setDate(d.getDate() + 1);
  for (let i = 0; i < DOORS; i++) {
    out.push(new Date(d));
    d.setDate(d.getDate() + 1);
    if (skipWeekends) while (isWeekend(d)) d.setDate(d.getDate() + 1);
  }
  return out;
}
const short = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
const long = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

const CSS = `
.adv-cell{position:relative;aspect-ratio:1/1.08;padding:0;border:0;background:none;perspective:700px;cursor:pointer;font:inherit;color:inherit;-webkit-tap-highlight-color:transparent}
.adv-cell:focus-visible{outline:3px solid #f1dc9b;outline-offset:3px;border-radius:10px}
.adv-door{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;border-radius:8px;
  background:linear-gradient(135deg,rgba(255,255,255,.12),rgba(255,255,255,0) 45%),#a81f2e;border:2px solid #d9b45b;
  box-shadow:inset 0 0 0 5px rgba(0,0,0,.14),0 2px 5px rgba(0,0,0,.4);transform-origin:left center;
  transition:transform .85s cubic-bezier(.22,.7,.2,1);backface-visibility:hidden;-webkit-backface-visibility:hidden}
.adv-cell.green .adv-door{background:linear-gradient(135deg,rgba(255,255,255,.14),rgba(255,255,255,0) 45%),#1f7351}
.adv-cell.final .adv-door{background:linear-gradient(135deg,rgba(255,255,255,.35),rgba(255,255,255,0) 50%),linear-gradient(180deg,#e7c870,#b98f2f);border-color:#fbf5e6}
.adv-cell.final .adv-num{color:#7d1522;text-shadow:0 1px 0 rgba(255,255,255,.4)}
.adv-door::after{content:"";position:absolute;right:9%;top:50%;width:7px;height:7px;margin-top:-3px;border-radius:50%;background:#f1dc9b;box-shadow:0 1px 2px rgba(0,0,0,.5)}
.adv-cell.open .adv-door{transform:rotateY(-118deg)}
.adv-cell:not(.open):not(.locked):hover .adv-door{transform:rotateY(-14deg)}
.adv-cell.locked{cursor:not-allowed}
.adv-cell.locked .adv-door{filter:saturate(.35) brightness(.72)}
.adv-cell.today:not(.open) .adv-door{animation:adv-glow 2s ease-in-out infinite}
@keyframes adv-glow{0%,100%{box-shadow:inset 0 0 0 5px rgba(0,0,0,.14),0 0 0 3px #f1dc9b,0 0 10px rgba(241,220,155,.5)}50%{box-shadow:inset 0 0 0 5px rgba(0,0,0,.14),0 0 0 3px #f1dc9b,0 0 26px rgba(241,220,155,.95)}}
.adv-flake{position:absolute;top:-10px;border-radius:50%;background:#fff;animation:adv-fall linear infinite}
@keyframes adv-fall{to{transform:translate3d(var(--drift,20px),105vh,0)}}
.adv-pop{animation:adv-pop .35s cubic-bezier(.2,.9,.3,1.2)}
@keyframes adv-pop{from{transform:scale(.8);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.adv-door{transition:none}.adv-cell:not(.open):not(.locked):hover .adv-door{transform:none}.adv-flake,.adv-cell.today:not(.open) .adv-door,.adv-pop{animation:none}}
`;

const btn = "rounded-full border-2 px-4 py-2 text-sm font-semibold";
const FONT = 'Georgia, "Times New Roman", serif';

export default function AdventCalendar() {
  const [init] = useState(load);
  const [assigned, setAssigned] = useState(init.assigned);
  const [opened, setOpened] = useState(init.opened);
  const [lock, setLock] = useState(init.lock);
  const [start, setStart] = useState(init.start);
  const [skipWeekends, setSkipWeekends] = useState(init.skipWeekends);
  const [text, setText] = useState("");
  const [randomise, setRandomise] = useState(true);
  const [status, setStatus] = useState("");
  const [notice, setNotice] = useState("");
  const [revealed, setRevealed] = useState<number | null>(null);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const noticeTimer = useRef(0);
  const doneRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  // full screen: the 24 doors are framed in the middle of the screen, sized to fit it (the browser's full screen where it has one, the same layout without it where it does not, as on a phone)
  const [fs, setFs] = useState(false);
  const enterFs = () => { setFs(true); try { void rootRef.current?.requestFullscreen?.()?.catch(() => { /* the layout still fills the window */ }); } catch { /* same */ } };
  const exitFs = () => { setFs(false); try { if (document.fullscreenElement) void document.exitFullscreen(); } catch { /* same */ } };
  useEffect(() => {
    const h = () => { if (!document.fullscreenElement) setFs(false); };
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ assigned, opened, lock, start, skipWeekends })); } catch { /* private mode */ }
  }, [assigned, opened, lock, start, skipWeekends]);

  // a day later when the page has been left open on a board: look again when it is next used
  useEffect(() => {
    const refresh = () => setNow(new Date());
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, []);
  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);

  const flakes = useMemo(() => Array.from({ length: 36 }, () => ({
    size: 2 + Math.random() * 4, left: Math.random() * 100, opacity: 0.3 + Math.random() * 0.5,
    dur: 9 + Math.random() * 12, delay: -Math.random() * 20, drift: Math.random() * 60 - 30,
  })), []);

  const dates = useMemo(() => doorDates(start, skipWeekends), [start, skipWeekends]);
  const todayMid = midnight(now).getTime();
  const isLocked = (day: number) => lock && dates[day - 1].getTime() > todayMid;
  const todayDoor = lock ? dates.findIndex(d => d.getTime() === todayMid) + 1 : 0;   // 0 when no door falls on today
  const unlockedCount = lock ? dates.filter(d => d.getTime() <= todayMid).length : DOORS;
  const doorLabel = (day: number) => (lock ? short(dates[day - 1]) : `Door ${day}`);
  const subtitle = !lock ? "Open a door to see who’s behind it."
    : todayMid < dates[0].getTime() ? `Door 1 opens on ${long(dates[0])}.`
    : todayDoor ? `Today is door ${todayDoor}. Open a door to see who’s behind it.`
    : "Open a door to see who’s behind it.";

  const say = (msg: string) => {
    setNotice(msg);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 3500);
  };

  const press = (i: number) => {
    const day = i + 1;
    if (isLocked(day)) { say(`Door ${day} opens on ${long(dates[i])}.`); return; }
    setOpened(o => (o.includes(i) ? o : [...o, i]));
    setRevealed(i);
  };
  const closeReveal = useCallback(() => setRevealed(null), []);
  useEffect(() => {
    if (!controlsOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setControlsOpen(false); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [controlsOpen]);
  useEffect(() => {
    if (revealed === null) return;
    doneRef.current?.focus();
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") closeReveal(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [revealed, closeReveal]);

  const save = () => {
    const list = parseNames(text);
    setAssigned(randomise ? shuffle(pad(list)) : pad(list)); setOpened([]);
    setStatus(`${list.length} name${list.length === 1 ? "" : "s"} placed behind the doors.${list.length > DOORS ? ` Only the first ${DOORS} were used.` : ""}`);
  };
  const reshuffle = () => { setAssigned(a => shuffle(a)); setOpened([]); setStatus("Names reshuffled. All doors closed."); };
  const setDoorName = (i: number, v: string) => setAssigned(a => a.map((x, k) => (k === i ? v : x)));
  const openAll = () => {
    const ids = Array.from({ length: DOORS }, (_, i) => i).filter(i => !isLocked(i + 1));
    setOpened(ids);
    setStatus(lock && ids.length < DOORS ? `Opened ${ids.length} door${ids.length === 1 ? "" : "s"}. The rest are shut until their day.` : "");
  };

  const revealName = revealed === null ? "" : assigned[revealed] || GREETING;

  return (
    <div ref={rootRef} className={`relative overflow-hidden text-[#fbf5e6] ${fs ? "fixed inset-0 z-30 flex flex-col items-center justify-center px-3 py-3" : "min-h-screen px-5 pb-16 pt-10"}`}
      style={{ fontFamily: FONT, background: "radial-gradient(ellipse at 50% -10%, #1d6a4c 0%, rgba(29,106,76,0) 60%), linear-gradient(180deg, #0d3b2c 0%, #082a1f 100%)" }}>
      <style>{CSS}</style>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {flakes.map((f, i) => (
          <span key={i} className="adv-flake" style={{ width: f.size, height: f.size, left: `${f.left}%`, opacity: f.opacity,
            animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s`, ["--drift" as string]: `${f.drift}px` }} />
        ))}
      </div>

      {!fs && <button onClick={() => { window.location.href = "/"; }} className="relative mb-2 inline-flex items-center gap-2 text-sm font-semibold text-[#f1dc9b]">
        <Home size={18} /> Home
      </button>}
      <button type="button" onClick={fs ? exitFs : enterFs} aria-label={fs ? "Exit full screen" : "Full screen"} title={fs ? "Exit full screen" : "Full screen"}
        className="absolute right-14 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full text-[#f1dc9b] opacity-30 transition-opacity hover:opacity-100 focus-visible:opacity-100">
        {fs ? <Minimize size={20} /> : <Maximize size={20} />}
      </button>
      <button type="button" onClick={() => setControlsOpen(true)} aria-label="Teacher controls" title="Teacher controls"
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full text-[#f1dc9b] opacity-30 transition-opacity hover:opacity-100 focus-visible:opacity-100">
        <Settings size={20} />
      </button>
      <header className={`relative mx-auto max-w-3xl text-center ${fs ? "mb-2" : "mb-6"}`}>
        <h1 className={`font-bold leading-none text-[#f1dc9b] ${fs ? "text-3xl" : "text-5xl max-sm:text-4xl"}`} style={{ textShadow: "0 2px 0 rgba(0,0,0,.25)" }}>Advent Calendar</h1>
        <p className={`italic text-[#fbf5e6]/80 ${fs ? "mt-1 text-sm" : "mt-3"}`}>
          {subtitle}
        </p>
        <p role="status" aria-live="polite" className="mt-1 min-h-[1.5em] text-sm font-semibold text-[#f1dc9b]">{notice}</p>
      </header>

      <main aria-label="Advent calendar doors"
        className={`relative mx-auto grid rounded-[18px] border-[3px] border-[#d9b45b] bg-[#082a1f] ${fs ? "grid-cols-6 gap-2 p-2.5 sm:gap-3 sm:p-4" : "max-w-5xl grid-cols-4 gap-2.5 p-3 sm:grid-cols-6 sm:gap-4 sm:p-5"}`}
        style={fs ? { width: "min(calc(100vw - 1.5rem), calc((100vh - 7.5rem) * 1.3))", boxShadow: "0 0 0 6px rgba(217,180,91,.15), 0 24px 50px rgba(0,0,0,.45)" } : { boxShadow: "0 0 0 6px rgba(217,180,91,.15), 0 24px 50px rgba(0,0,0,.45)" }}>
        {Array.from({ length: DOORS }, (_, i) => {
          const day = i + 1, name = assigned[i], isOpen = opened.includes(i), locked = isLocked(day);
          return (
            <button key={i} type="button" onClick={() => press(i)} aria-disabled={locked || undefined}
              className={`adv-cell${day % 2 === 0 ? " green" : ""}${day === DOORS ? " final" : ""}${isOpen ? " open" : ""}${locked ? " locked" : ""}${day === todayDoor ? " today" : ""}`}
              aria-label={locked ? `Door ${day}, opens on ${long(dates[i])}` : isOpen ? `Door ${day}: ${name || GREETING} (tap to show again)` : `Door ${day}${day === todayDoor ? ", today" : ""} (tap to open)`}>
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-lg p-1.5 text-center text-[#3a1017]"
                style={{ background: "radial-gradient(circle at 50% 40%, #fffaf0 0%, #f6e7c1 70%, #ecd59a 100%)", boxShadow: "inset 0 4px 10px rgba(0,0,0,.35)" }}>
                <span className="text-sm leading-none text-[#a81f2e]" aria-hidden="true">★</span>
                <span className={name ? "font-bold leading-tight [overflow-wrap:anywhere]" : "italic leading-tight"} style={{ fontSize: name ? "clamp(.8rem, 2.2vw, 1.4rem)" : "clamp(.8rem, 2.2vw, 1.1rem)" }}>{name || GREETING}</span>
                <span className="text-[11px] opacity-60">{doorLabel(day)}</span>
              </span>
              <span className="adv-door">
                <span className="adv-num font-bold text-[#f1dc9b]" style={{ fontSize: "clamp(1.4rem, 4.8vw, 2.5rem)", textShadow: "0 1px 0 rgba(0,0,0,.35)" }}>{day}</span>
                {locked && <Lock size={14} aria-hidden="true" className="absolute left-[9%] top-[9%] text-[#f1dc9b]/80" />}
              </span>
            </button>
          );
        })}
      </main>

      {/* Teacher controls: hidden from the board until opened from the small gear in the corner */}
      {controlsOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-3 sm:items-center sm:p-5" onClick={e => { if (e.target === e.currentTarget) setControlsOpen(false); }}>
          <div role="dialog" aria-modal="true" aria-label="Teacher controls" className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border-2 border-[#d9b45b] bg-[#082a1f] p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#f1dc9b]">Teacher controls</h2>
              <button type="button" onClick={() => setControlsOpen(false)} className={`${btn} border-[#d9b45b] bg-[#d9b45b] text-[#082a1f]`}>Done</button>
            </div>
            <div>
            <p className="mb-2 text-sm leading-snug text-[#fbf5e6]/85">Type who is behind each door. A door left empty shows a Christmas greeting. Names stay on this device.</p>
            <div className="grid grid-cols-1 gap-x-3 gap-y-1.5 sm:grid-cols-2">
              {assigned.map((n, i) => (
                <label key={i} className="flex items-center gap-2 text-sm">
                  <span className="w-14 shrink-0 text-right text-[#f1dc9b]">Door {i + 1}</span>
                  <input type="text" value={n} onChange={e => setDoorName(i, e.target.value)} spellCheck={false}
                    className="min-w-0 flex-1 rounded-lg border border-[#d9b45b] bg-[#fbf5e6] px-2 py-1 text-base text-[#3a1017]" />
                </label>
              ))}
            </div>
            <p className="mb-1 mt-4 text-sm leading-snug text-[#fbf5e6]/85">Or paste a list, one name per line, to fill the doors. The first {DOORS} names are used.</p>
            <textarea value={text} onChange={e => setText(e.target.value)} spellCheck={false} placeholder={"Amira\nBen\nChloe\n…"}
              className="min-h-[110px] w-full resize-y rounded-lg border border-[#d9b45b] bg-[#fbf5e6] p-3 text-base leading-relaxed text-[#3a1017]" />
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={randomise} onChange={e => setRandomise(e.target.checked)} /> Randomise which door each pasted name goes behind
            </label>
            <label className="mt-2 flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1" checked={lock} onChange={e => setLock(e.target.checked)} />
              <span>Open doors on a schedule <span className="block text-[13px] text-[#fbf5e6]/70">Door 1 opens on the day you choose, then one more each day. Doors stay shut until their day. Untick to open any door at any time.</span></span>
            </label>
            {lock && (
              <div className="ml-6 mt-2 space-y-2 text-sm">
                <label className="flex flex-wrap items-center gap-2">Door 1 opens on
                  <input type="date" value={start} onChange={e => { if (e.target.value) setStart(e.target.value); }}
                    className="rounded-lg border border-[#d9b45b] bg-[#fbf5e6] px-2 py-1 text-[#3a1017]" />
                </label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={skipWeekends} onChange={e => setSkipWeekends(e.target.checked)} /> Skip weekends (school days only)</label>
                <p className="text-[13px] text-[#fbf5e6]/70">Door 24 opens on {long(dates[DOORS - 1])}. {unlockedCount} of {DOORS} doors can be opened today.</p>
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2.5">
              <button type="button" onClick={save} className={`${btn} border-[#d9b45b] bg-[#d9b45b] text-[#082a1f]`}>Fill doors from list</button>
              <button type="button" onClick={reshuffle} className={`${btn} border-[#d9b45b] text-[#f1dc9b]`}>Reshuffle doors</button>
              <button type="button" onClick={openAll} className={`${btn} border-[#d9b45b] text-[#f1dc9b]`}>Open all</button>
              <button type="button" onClick={() => { setOpened([]); setStatus("All doors closed."); }} className={`${btn} border-[#d9b45b] text-[#f1dc9b]`}>Close all</button>
            </div>
            <div role="status" aria-live="polite" className="mt-2.5 min-h-[1.3em] text-sm text-[#f1dc9b]">{status}</div>
            </div>
          </div>
        </div>
      )}

      {revealed !== null && assigned[revealed] && <Confetti key={revealed} colours={["#d9b45b", "#f1dc9b", "#a81f2e", "#1f7351", "#fbf5e6"]} />}
      {revealed !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5" style={{ background: "rgba(5,20,15,.82)" }}
          onClick={e => { if (e.target === e.currentTarget) closeReveal(); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="adv-reveal-name"
            className="adv-pop w-full max-w-[640px] rounded-2xl border-[3px] border-[#d9b45b] px-6 pb-6 pt-8 text-center text-[#3a1017]"
            style={{ background: "radial-gradient(circle at 50% 30%, #fffaf0 0%, #f6e7c1 80%)", boxShadow: "0 24px 60px rgba(0,0,0,.55)" }}>
            <p className="text-lg italic text-[#a81f2e]"><span aria-hidden="true">★ </span>{lock ? long(dates[revealed]) : `Door ${revealed + 1}`}<span aria-hidden="true"> ★</span></p>
            <p id="adv-reveal-name" className="my-5 font-bold leading-tight [overflow-wrap:anywhere]"
              style={{ fontSize: assigned[revealed] ? "clamp(2.6rem, 11vw, 5.5rem)" : "clamp(2rem, 8vw, 3.5rem)", fontStyle: assigned[revealed] ? "normal" : "italic" }}>{revealName}</p>
            <div className="flex flex-wrap justify-center gap-2.5">
              <button ref={doneRef} type="button" onClick={closeReveal} className="rounded-full border-2 border-[#a81f2e] bg-[#a81f2e] px-6 py-2.5 text-base font-semibold text-[#fbf5e6]">Done</button>
              <button type="button" onClick={() => { setOpened(o => o.filter(x => x !== revealed)); closeReveal(); }}
                className="rounded-full border-2 border-[#a81f2e] px-5 py-2.5 text-base font-semibold text-[#a81f2e]">Close this door again</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
