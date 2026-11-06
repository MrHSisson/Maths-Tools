import { useEffect, useMemo, useState } from "react";
import { Home } from "lucide-react";

// Advent Calendar: 25 doors, each hiding a name (or a greeting). Names are typed or pasted by the teacher and kept
// on this device only (localStorage); nothing is sent anywhere. Standalone classroom sandbox.

const DOORS = 25;
const KEY = "advent-calendar-v1";
const GREETING = "Merry Christmas!";

interface Saved { names: string[]; assigned: string[]; opened: number[] }

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
  return { names, assigned, opened };
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
.adv-cell:not(.open):hover .adv-door{transform:rotateY(-14deg)}
.adv-flake{position:absolute;top:-10px;border-radius:50%;background:#fff;animation:adv-fall linear infinite}
@keyframes adv-fall{to{transform:translate3d(var(--drift,20px),105vh,0)}}
@media (prefers-reduced-motion:reduce){.adv-door{transition:none}.adv-cell:not(.open):hover .adv-door{transform:none}.adv-flake{animation:none}}
`;

const btn = "rounded-full border-2 px-4 py-2 text-sm font-bold";
const FONT = 'Georgia, "Times New Roman", serif';

export default function AdventCalendar() {
  const [init] = useState(load);
  const [names, setNames] = useState(init.names);
  const [assigned, setAssigned] = useState(init.assigned);
  const [opened, setOpened] = useState(init.opened);
  const [text, setText] = useState(init.names.join("\n"));
  const [randomise, setRandomise] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ names, assigned, opened })); } catch { /* private mode */ }
  }, [names, assigned, opened]);

  const flakes = useMemo(() => Array.from({ length: 36 }, () => ({
    size: 2 + Math.random() * 4, left: Math.random() * 100, opacity: 0.3 + Math.random() * 0.5,
    dur: 9 + Math.random() * 12, delay: -Math.random() * 20, drift: Math.random() * 60 - 30,
  })), []);

  const toggle = (i: number) => setOpened(o => (o.includes(i) ? o.filter(x => x !== i) : [...o, i]));
  const save = () => {
    const list = parseNames(text);
    setNames(list); setAssigned(randomise ? shuffle(pad(list)) : pad(list)); setOpened([]);
    setStatus(`${list.length} name${list.length === 1 ? "" : "s"} saved.${list.length > DOORS ? ` Only the first ${DOORS} were used.` : ""}`);
  };
  const reshuffle = () => { setAssigned(shuffle(pad(names))); setOpened([]); setStatus("Names reshuffled. All doors closed."); };

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
      <header className="relative mx-auto mb-8 max-w-3xl text-center">
        <h1 className="text-5xl font-bold leading-none text-[#f1dc9b] max-sm:text-4xl" style={{ textShadow: "0 2px 0 rgba(0,0,0,.25)" }}>Advent Calendar</h1>
        <p className="mt-3 italic text-[#fbf5e6]/80">Open a door to see who’s behind it.</p>
      </header>

      <main aria-label="Advent calendar doors"
        className="relative mx-auto grid max-w-3xl grid-cols-3 gap-3 rounded-[18px] border-[3px] border-[#d9b45b] bg-[#082a1f] p-3 sm:grid-cols-4 sm:gap-4 sm:p-5 md:grid-cols-5"
        style={{ boxShadow: "0 0 0 6px rgba(217,180,91,.15), 0 24px 50px rgba(0,0,0,.45)" }}>
        {Array.from({ length: DOORS }, (_, i) => {
          const day = i + 1, name = assigned[i], isOpen = opened.includes(i);
          return (
            <button key={i} type="button" onClick={() => toggle(i)}
              className={`adv-cell${day % 2 === 0 ? " green" : ""}${day === DOORS ? " final" : ""}${isOpen ? " open" : ""}`}
              aria-label={`Door ${day}${isOpen ? `: ${name || GREETING} (tap to close)` : " (tap to open)"}`}>
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-lg p-1.5 text-center text-[#3a1017]"
                style={{ background: "radial-gradient(circle at 50% 40%, #fffaf0 0%, #f6e7c1 70%, #ecd59a 100%)", boxShadow: "inset 0 4px 10px rgba(0,0,0,.35)" }}>
                <span className="text-sm leading-none text-[#a81f2e]" aria-hidden="true">★</span>
                <span className={name ? "font-bold leading-tight [overflow-wrap:anywhere]" : "italic leading-tight"} style={{ fontSize: name ? "clamp(.95rem, 2.9vw, 1.55rem)" : "clamp(.8rem, 2.2vw, 1.1rem)" }}>{name || GREETING}</span>
                <span className="text-[11px] opacity-60">December {day}</span>
              </span>
              <span className="adv-door"><span className="adv-num font-bold text-[#f1dc9b]" style={{ fontSize: "clamp(1.4rem, 4.8vw, 2.5rem)", textShadow: "0 1px 0 rgba(0,0,0,.35)" }}>{day}</span></span>
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
            <label className="mt-3 inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={randomise} onChange={e => setRandomise(e.target.checked)} /> Randomise which door each name is behind
            </label>
            <div className="mt-3 flex flex-wrap gap-2.5">
              <button type="button" onClick={save} className={`${btn} border-[#d9b45b] bg-[#d9b45b] text-[#082a1f]`}>Save names</button>
              <button type="button" onClick={reshuffle} className={`${btn} border-[#d9b45b] text-[#f1dc9b]`}>Reshuffle doors</button>
              <button type="button" onClick={() => setOpened(Array.from({ length: DOORS }, (_, i) => i))} className={`${btn} border-[#d9b45b] text-[#f1dc9b]`}>Open all</button>
              <button type="button" onClick={() => { setOpened([]); setStatus("All doors closed."); }} className={`${btn} border-[#d9b45b] text-[#f1dc9b]`}>Close all</button>
            </div>
            <div role="status" aria-live="polite" className="mt-2.5 min-h-[1.3em] text-sm text-[#f1dc9b]">{status}</div>
          </div>
        </details>
      </section>
    </div>
  );
}
