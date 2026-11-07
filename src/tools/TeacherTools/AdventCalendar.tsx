import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Home, Lock } from "lucide-react";

// Advent Calendar: 25 doors, each hiding a name (or a greeting). Names are typed or pasted by the teacher and kept
// on this device only (localStorage); nothing is sent anywhere. A door opens to a large reveal card so the whole class
// can read it. With "doors open on their date" on, only today's door and earlier can be opened (December 1 to 25).
// Standalone classroom sandbox.

const DOORS = 25;
const KEY = "advent-calendar-v1";
const GREETING = "Merry Christmas!";

interface Saved { names: string[]; assigned: string[]; opened: number[]; lock: boolean }

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
  const assigned = Array.isArray(s.assigned) && s.assigned.length === DOORS ? s.assigned.map(String) : shuffle(pad(names));
  const opened = Array.isArray(s.opened) ? s.opened.filter(n => Number.isInteger(n) && n >= 0 && n < DOORS) : [];
  return { names, assigned, opened, lock: s.lock === true };
}

/** The last door that may be opened today: December's date, 0 before December. (Jan to Nov: nothing yet; after the 25th: all.) */
function availableDoor(now: Date): number {
  return now.getMonth() === 11 ? Math.min(DOORS, now.getDate()) : 0;
}

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
  const [names, setNames] = useState(init.names);
  const [assigned, setAssigned] = useState(init.assigned);
  const [opened, setOpened] = useState(init.opened);
  const [lock, setLock] = useState(init.lock);
  const [text, setText] = useState(init.names.join("\n"));
  const [randomise, setRandomise] = useState(true);
  const [status, setStatus] = useState("");
  const [notice, setNotice] = useState("");
  const [revealed, setRevealed] = useState<number | null>(null);
  const [now, setNow] = useState(() => new Date());
  const noticeTimer = useRef(0);
  const doneRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ names, assigned, opened, lock })); } catch { /* private mode */ }
  }, [names, assigned, opened, lock]);

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

  const available = availableDoor(now);
  const inAdvent = now.getMonth() === 11 && now.getDate() <= DOORS;
  const today = inAdvent ? now.getDate() : 0;
  const isLocked = (day: number) => lock && day > available;
  const daysToGo = inAdvent && today < DOORS ? DOORS - today : null;

  const say = (msg: string) => {
    setNotice(msg);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 3500);
  };

  const press = (i: number) => {
    const day = i + 1;
    if (isLocked(day)) { say(`Door ${day} opens on December ${day}.`); return; }
    setOpened(o => (o.includes(i) ? o : [...o, i]));
    setRevealed(i);
  };
  const closeReveal = useCallback(() => setRevealed(null), []);
  useEffect(() => {
    if (revealed === null) return;
    doneRef.current?.focus();
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") closeReveal(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [revealed, closeReveal]);

  const save = () => {
    const list = parseNames(text);
    setNames(list); setAssigned(randomise ? shuffle(pad(list)) : pad(list)); setOpened([]);
    setStatus(`${list.length} name${list.length === 1 ? "" : "s"} saved.${list.length > DOORS ? ` Only the first ${DOORS} were used.` : ""}`);
  };
  const reshuffle = () => { setAssigned(shuffle(pad(names))); setOpened([]); setStatus("Names reshuffled. All doors closed."); };
  const openAll = () => {
    const ids = Array.from({ length: DOORS }, (_, i) => i).filter(i => !isLocked(i + 1));
    setOpened(ids);
    setStatus(lock && ids.length < DOORS ? `Opened doors 1 to ${ids.length}. The rest are locked until their date.` : "");
  };

  const revealName = revealed === null ? "" : assigned[revealed] || GREETING;

  return (
    <div className="relative min-h-screen overflow-hidden px-5 pb-16 pt-10 text-[#fbf5e6]"
      style={{ fontFamily: FONT, background: "radial-gradient(ellipse at 50% -10%, #1d6a4c 0%, rgba(29,106,76,0) 60%), linear-gradient(180deg, #0d3b2c 0%, #082a1f 100%)" }}>
      <style>{CSS}</style>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {flakes.map((f, i) => (
          <span key={i} className="adv-flake" style={{ width: f.size, height: f.size, left: `${f.left}%`, opacity: f.opacity,
            animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s`, ["--drift" as string]: `${f.drift}px` }} />
        ))}
      </div>

      <button onClick={() => { window.location.href = "/"; }} className="relative mb-2 inline-flex items-center gap-2 text-sm font-semibold text-[#f1dc9b]">
        <Home size={18} /> Home
      </button>
      <header className="relative mx-auto mb-6 max-w-3xl text-center">
        <h1 className="text-5xl font-bold leading-none text-[#f1dc9b] max-sm:text-4xl" style={{ textShadow: "0 2px 0 rgba(0,0,0,.25)" }}>Advent Calendar</h1>
        <p className="mt-3 italic text-[#fbf5e6]/80">
          {daysToGo !== null ? `${daysToGo} day${daysToGo === 1 ? "" : "s"} until Christmas Day. Open a door to see who’s behind it.` : "Open a door to see who’s behind it."}
        </p>
        <p role="status" aria-live="polite" className="mt-2 min-h-[1.5em] text-sm font-semibold text-[#f1dc9b]">{notice}</p>
      </header>

      <main aria-label="Advent calendar doors"
        className="relative mx-auto grid max-w-3xl grid-cols-3 gap-3 rounded-[18px] border-[3px] border-[#d9b45b] bg-[#082a1f] p-3 sm:grid-cols-4 sm:gap-4 sm:p-5 md:grid-cols-5"
        style={{ boxShadow: "0 0 0 6px rgba(217,180,91,.15), 0 24px 50px rgba(0,0,0,.45)" }}>
        {Array.from({ length: DOORS }, (_, i) => {
          const day = i + 1, name = assigned[i], isOpen = opened.includes(i), locked = isLocked(day);
          return (
            <button key={i} type="button" onClick={() => press(i)} aria-disabled={locked || undefined}
              className={`adv-cell${day % 2 === 0 ? " green" : ""}${day === DOORS ? " final" : ""}${isOpen ? " open" : ""}${locked ? " locked" : ""}${day === today ? " today" : ""}`}
              aria-label={locked ? `Door ${day}, locked until December ${day}` : isOpen ? `Door ${day}: ${name || GREETING} (tap to show again)` : `Door ${day}${day === today ? ", today" : ""} (tap to open)`}>
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-lg p-1.5 text-center text-[#3a1017]"
                style={{ background: "radial-gradient(circle at 50% 40%, #fffaf0 0%, #f6e7c1 70%, #ecd59a 100%)", boxShadow: "inset 0 4px 10px rgba(0,0,0,.35)" }}>
                <span className="text-sm leading-none text-[#a81f2e]" aria-hidden="true">★</span>
                <span className={name ? "font-bold leading-tight [overflow-wrap:anywhere]" : "italic leading-tight"} style={{ fontSize: name ? "clamp(.95rem, 2.9vw, 1.55rem)" : "clamp(.8rem, 2.2vw, 1.1rem)" }}>{name || GREETING}</span>
                <span className="text-[11px] opacity-60">December {day}</span>
              </span>
              <span className="adv-door">
                <span className="adv-num font-bold text-[#f1dc9b]" style={{ fontSize: "clamp(1.4rem, 4.8vw, 2.5rem)", textShadow: "0 1px 0 rgba(0,0,0,.35)" }}>{day}</span>
                {locked && <Lock size={14} aria-hidden="true" className="absolute left-[9%] top-[9%] text-[#f1dc9b]/80" />}
              </span>
            </button>
          );
        })}
      </main>

      <section className="relative mx-auto mt-7 max-w-3xl">
        <details className="rounded-xl border border-[#d9b45b]/50 bg-[#082a1f]/70">
          <summary className="cursor-pointer px-4 py-3 font-medium text-[#f1dc9b]">Teacher controls</summary>
          <div className="px-4 pb-5">
            <p className="mb-2 text-sm leading-snug text-[#fbf5e6]/85">Type one name per line. The first {DOORS} names are used. Any doors left over show a Christmas greeting. Names stay on this device.</p>
            <textarea value={text} onChange={e => setText(e.target.value)} spellCheck={false} placeholder={"Amira\nBen\nChloe\n…"}
              className="min-h-[190px] w-full resize-y rounded-lg border border-[#d9b45b] bg-[#fbf5e6] p-3 text-base leading-relaxed text-[#3a1017]" />
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={randomise} onChange={e => setRandomise(e.target.checked)} /> Randomise which door each name is behind
            </label>
            <label className="mt-2 flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1" checked={lock} onChange={e => setLock(e.target.checked)} />
              <span>Doors open on their own date <span className="block text-[13px] text-[#fbf5e6]/70">Only today’s door and earlier can be opened, from December 1 to 25. Untick to open any door at any time.</span></span>
            </label>
            <div className="mt-3 flex flex-wrap gap-2.5">
              <button type="button" onClick={save} className={`${btn} border-[#d9b45b] bg-[#d9b45b] text-[#082a1f]`}>Save names</button>
              <button type="button" onClick={reshuffle} className={`${btn} border-[#d9b45b] text-[#f1dc9b]`}>Reshuffle doors</button>
              <button type="button" onClick={openAll} className={`${btn} border-[#d9b45b] text-[#f1dc9b]`}>Open all</button>
              <button type="button" onClick={() => { setOpened([]); setStatus("All doors closed."); }} className={`${btn} border-[#d9b45b] text-[#f1dc9b]`}>Close all</button>
            </div>
            <div role="status" aria-live="polite" className="mt-2.5 min-h-[1.3em] text-sm text-[#f1dc9b]">{status}</div>
          </div>
        </details>
      </section>

      {revealed !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5" style={{ background: "rgba(5,20,15,.82)" }}
          onClick={e => { if (e.target === e.currentTarget) closeReveal(); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="adv-reveal-name"
            className="adv-pop w-full max-w-[640px] rounded-2xl border-[3px] border-[#d9b45b] px-6 pb-6 pt-8 text-center text-[#3a1017]"
            style={{ background: "radial-gradient(circle at 50% 30%, #fffaf0 0%, #f6e7c1 80%)", boxShadow: "0 24px 60px rgba(0,0,0,.55)" }}>
            <p className="text-lg italic text-[#a81f2e]"><span aria-hidden="true">★ </span>December {revealed + 1}<span aria-hidden="true"> ★</span></p>
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
