import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Home } from "lucide-react";

// Name Wheel: pick a name at random from a list, with optional extra entries per name. The list is kept on this device
// only (localStorage). Standalone classroom sandbox.

const KEY = "name-wheel-v1";
const TAU = Math.PI * 2;
const MAX_ENTRIES = 600;
const FONT = 'Georgia, "Times New Roman", serif';

interface Theme { name: string; empty: string; vars: Record<string, string>; wheel: { bg: string; fg: string }[] }
const THEMES: Record<string, Theme> = {
  christmas: { name: "Christmas", empty: "#145a41",
    vars: { pine: "#0d3b2c", deep: "#082a1f", glow: "#1d6a4c", berry: "#a81f2e", gold: "#d9b45b", light: "#f1dc9b", cream: "#fbf5e6", paper: "#f6e7c1", ink: "#3a1017" },
    wheel: [{ bg: "#a81f2e", fg: "#fbf5e6" }, { bg: "#1f7351", fg: "#fbf5e6" }, { bg: "#d9b45b", fg: "#3a1017" }, { bg: "#fbf5e6", fg: "#3a1017" }] },
  ocean: { name: "Ocean", empty: "#0f4a6b",
    vars: { pine: "#0b2a45", deep: "#061a2c", glow: "#1c6b8f", berry: "#e4572e", gold: "#5ec8d8", light: "#bdf0f5", cream: "#f2fbfc", paper: "#d4eef2", ink: "#0b2a45" },
    wheel: [{ bg: "#0e7490", fg: "#f2fbfc" }, { bg: "#e4572e", fg: "#0b2a45" }, { bg: "#5ec8d8", fg: "#0b2a45" }, { bg: "#f2fbfc", fg: "#0b2a45" }] },
  sunset: { name: "Sunset", empty: "#5a2a73",
    vars: { pine: "#3b1550", deep: "#230a33", glow: "#a33a6b", berry: "#ff6b35", gold: "#ffb347", light: "#ffd9a0", cream: "#fff4e6", paper: "#ffe0bd", ink: "#3b1550" },
    wheel: [{ bg: "#d6336c", fg: "#fff4e6" }, { bg: "#ff6b35", fg: "#2a0e3a" }, { bg: "#ffb347", fg: "#2a0e3a" }, { bg: "#fff4e6", fg: "#3b1550" }] },
  midnight: { name: "Midnight", empty: "#2a2566",
    vars: { pine: "#14122b", deep: "#0a0918", glow: "#3b2f8f", berry: "#ff3d81", gold: "#5ef2e0", light: "#b9fff4", cream: "#eef0ff", paper: "#d5d8ff", ink: "#14122b" },
    wheel: [{ bg: "#6c3df5", fg: "#eef0ff" }, { bg: "#ff3d81", fg: "#14122b" }, { bg: "#5ef2e0", fg: "#14122b" }, { bg: "#eef0ff", fg: "#14122b" }] },
  classroom: { name: "Classroom", empty: "#1c4a85",
    vars: { pine: "#12315a", deep: "#0a1f3d", glow: "#2b5da8", berry: "#e63946", gold: "#ffc93c", light: "#ffe38a", cream: "#fffdf5", paper: "#fff0c2", ink: "#12315a" },
    wheel: [{ bg: "#e63946", fg: "#fffdf5" }, { bg: "#3a86ff", fg: "#fffdf5" }, { bg: "#ffc93c", fg: "#12315a" }, { bg: "#2a9d5c", fg: "#fffdf5" }] },
  slate: { name: "Slate", empty: "#3a3f47",
    vars: { pine: "#2b2f36", deep: "#17191d", glow: "#4a505c", berry: "#e8590c", gold: "#ced4da", light: "#ffffff", cream: "#f8f9fa", paper: "#e9ecef", ink: "#212529" },
    wheel: [{ bg: "#495057", fg: "#f8f9fa" }, { bg: "#e8590c", fg: "#f8f9fa" }, { bg: "#ced4da", fg: "#212529" }, { bg: "#f8f9fa", fg: "#212529" }] },
};
const THEME_ORDER = ["christmas", "ocean", "sunset", "midnight", "classroom", "slate"];

interface Row { name: string; count: number }
interface Saved { rows: Row[]; winners: string[]; sound: boolean; theme: string }
interface Entry { name: string; row: number; pos: number }

const clampCount = (v: string | number) => { const n = parseInt(String(v), 10); return Number.isNaN(n) || n < 1 ? 1 : Math.min(MAX_ENTRIES, n); };

function load(): Saved {
  const base: Saved = { rows: [{ name: "", count: 1 }], winners: [], sound: true, theme: "christmas" };
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (!s) return base;
    const rows = Array.isArray(s.rows) ? s.rows.map((r: Row) => ({ name: String(r?.name ?? ""), count: clampCount(r?.count ?? 1) })) : [];
    return {
      rows: rows.length ? rows : base.rows,
      winners: Array.isArray(s.winners) ? s.winners.map(String) : [],
      sound: s.sound !== false,
      theme: THEMES[s.theme] ? s.theme : "christmas",
    };
  } catch { return base; }
}

/** Each name's entries are spread evenly round the wheel instead of sitting in one block. */
function buildEntries(rows: Row[]): Entry[] {
  const valid = rows.map((r, i) => ({ r, i })).filter(x => x.r.name.trim());
  const m = valid.length, list: Entry[] = [];
  valid.forEach((x, k) => {
    const base = (k + 0.5) / m;
    for (let j = 0; j < x.r.count; j++) list.push({ name: x.r.name.trim(), row: x.i, pos: (j + base) / x.r.count });
  });
  return list.sort((a, b) => a.pos - b.pos);
}

const indexAt = (angle: number, n: number) => Math.floor(((((1.5 * Math.PI - angle) % TAU) + TAU) % TAU) / (TAU / n)) % n;

export default function NameWheel() {
  const [init] = useState(load);
  const [rows, setRows] = useState(init.rows);
  const [winners, setWinners] = useState(init.winners);
  const [sound, setSound] = useState(init.sound);
  const [themeKey, setThemeKey] = useState(init.theme);
  const [spinning, setSpinning] = useState(false);
  const [current, setCurrent] = useState("");
  const [result, setResult] = useState<{ name: string; row: number; count: number } | null>(null);
  const [bulk, setBulk] = useState("");
  const [focusRow, setFocusRow] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotRef = useRef(0);
  const rafRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);
  const lastTickRef = useRef(0);
  const nameInputs = useRef<(HTMLInputElement | null)[]>([]);

  const theme = THEMES[themeKey] ?? THEMES.christmas;
  const entries = useMemo(() => buildEntries(rows), [rows]);
  const names = rows.filter(r => r.name.trim()).length;
  const total = entries.length;
  const tiny = total > 100;   // labels too small to read; the name at the pointer shows while it spins
  const canSpin = !spinning && names >= 2;

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ rows, winners, sound, theme: themeKey })); } catch { /* private mode */ }
  }, [rows, winners, sound, themeKey]);

  useEffect(() => {
    if (focusRow !== null) { nameInputs.current[focusRow]?.focus(); setFocusRow(null); }
  }, [focusRow, rows]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current, ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const size = canvas.clientWidth || 500, dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(size * dpr)) canvas.width = canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    const cx = size / 2, cy = size / 2, R = size / 2 - 4, r = R - 10, n = entries.length, rot = rotRef.current;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fillStyle = theme.vars.gold; ctx.fill();
    if (n === 0) {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fillStyle = theme.empty; ctx.fill();
      ctx.fillStyle = theme.vars.cream; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = `italic 500 ${Math.round(size * 0.05)}px ${FONT}`;
      ctx.fillText("Add some names", cx, cy - size * 0.12);
      return;
    }
    const slice = TAU / n;
    for (let i = 0; i < n; i++) {
      let ci = i % theme.wheel.length;
      if (i === n - 1 && n > 1 && ci === 0) ci = 2;
      const a0 = rot + i * slice, col = theme.wheel[ci];
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a0, a0 + slice + (n > 120 ? 0.004 : 0)); ctx.closePath();
      ctx.fillStyle = col.bg; ctx.fill();
      if (n > 1 && n <= 120) { ctx.strokeStyle = "rgba(0,0,0,.18)"; ctx.lineWidth = 1; ctx.stroke(); }
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(a0 + slice / 2);
      ctx.fillStyle = col.fg; ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.font = `700 ${Math.max(2, Math.min(30, 0.38 * r * slice))}px ${FONT}`;
      const maxW = r * 0.72;
      let label = entries[i].name;
      if (ctx.measureText(label).width > maxW) {
        while (label.length > 1 && ctx.measureText(label + "…").width > maxW) label = label.slice(0, -1);
        label += "…";
      }
      ctx.fillText(label, r - 16, 0);
      ctx.restore();
    }
    const studs = Math.max(12, Math.min(36, n * 2));
    for (let k = 0; k < studs; k++) {
      const ang = rot + k * (TAU / studs);
      ctx.beginPath(); ctx.arc(cx + Math.cos(ang) * (R - 5), cy + Math.sin(ang) * (R - 5), 2.2, 0, TAU);
      ctx.fillStyle = theme.vars.cream; ctx.fill();
    }
  }, [entries, theme]);

  useEffect(() => { draw(); }, [draw]);
  useEffect(() => {
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  const tick = () => {
    const audio = audioRef.current;
    if (!sound || !audio) return;
    const now = performance.now();
    if (now - lastTickRef.current < 35) return;
    lastTickRef.current = now;
    try {
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = "triangle"; o.frequency.value = 880;
      g.gain.setValueAtTime(0.07, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.05);
      o.connect(g); g.connect(audio.destination);
      o.start(); o.stop(audio.currentTime + 0.06);
    } catch { /* audio unavailable */ }
  };

  const spin = () => {
    const n = entries.length;
    if (!canSpin || n < 2) return;
    if (!audioRef.current) {
      try {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AC) audioRef.current = new AC();
      } catch { /* no audio */ }
    }
    void audioRef.current?.resume?.();
    setSpinning(true); setCurrent("");
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const from = rotRef.current;
    const to = from + TAU * (5 + Math.floor(Math.random() * 4)) + Math.random() * TAU;
    const dur = reduce ? 1200 : 5000 + Math.random() * 1800;
    const start = performance.now();
    let last = indexAt(from, n);
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - t, 4);
      rotRef.current = from + (to - from) * e;
      draw();
      const idx = indexAt(rotRef.current, n);
      if (idx !== last) { tick(); last = idx; if (n > 100) setCurrent(entries[idx].name); }
      if (t < 1) { rafRef.current = requestAnimationFrame(step); return; }
      const entry = entries[idx];
      setSpinning(false); setCurrent("");
      setResult({ name: entry.name, row: entry.row, count: rows[entry.row]?.count ?? 1 });
      setWinners(w => [...w, entry.name]);
    };
    rafRef.current = requestAnimationFrame(step);
  };

  const removeRow = (i: number) => setRows(rs => { const next = rs.filter((_, k) => k !== i); return next.length ? next : [{ name: "", count: 1 }]; });
  const addRow = (at?: number) => {
    const idx = at ?? rows.length;
    setRows(rs => [...rs.slice(0, idx), { name: "", count: 1 }, ...rs.slice(idx)]);
    setFocusRow(idx);
  };
  const edit = (i: number, patch: Partial<Row>) => setRows(rs => rs.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  const shuffleRows = () => setRows(rs => {
    const a = rs.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  });
  const addBulk = () => {
    const added: Row[] = [];
    bulk.split(/\r?\n/).forEach(line => {
      line = line.trim();
      if (!line) return;
      const m = line.match(/^(.+?)\s*[,;\t]\s*(\d+)$/) ?? line.match(/^(.+?)\s+[x×]\s*(\d+)$/i);
      added.push(m ? { name: m[1].trim(), count: clampCount(m[2]) } : { name: line, count: 1 });
    });
    if (!added.length) return;
    setRows(rs => [...(rs.length === 1 && !rs[0].name.trim() ? [] : rs), ...added]);
    setBulk("");
  };
  const closeDialog = useCallback(() => setResult(null), []);
  useEffect(() => {
    if (!result) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") closeDialog(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [result, closeDialog]);

  const v = theme.vars;
  const ghost = { border: `2px solid ${v.gold}`, color: v.light } as const;
  const btn = "rounded-full px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-45";
  const cell = "w-full rounded-md border px-2 py-1.5 text-base";
  const cellStyle = { borderColor: v.gold, background: v.cream, color: v.ink } as const;

  return (
    <div className="min-h-screen px-5 pb-14 pt-8" style={{ fontFamily: FONT, color: v.cream, background: `radial-gradient(ellipse at 50% -10%, ${v.glow} 0%, transparent 60%), linear-gradient(180deg, ${v.pine} 0%, ${v.deep} 100%)` }}>
      <button onClick={() => { window.location.href = "/"; }} className="mb-2 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: v.light }}>
        <Home size={18} /> Home
      </button>
      <h1 className="mb-6 text-center text-4xl font-bold leading-tight sm:text-5xl" style={{ color: v.light, textShadow: "0 2px 0 rgba(0,0,0,.25)" }}>Name Wheel</h1>

      <div className="mx-auto grid max-w-5xl items-start gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <div className="relative mx-auto aspect-square w-full max-w-[560px]">
            <canvas ref={canvasRef} onClick={spin} aria-label="Name wheel. Click to spin."
              className="block h-full w-full cursor-pointer rounded-full" style={{ filter: "drop-shadow(0 18px 30px rgba(0,0,0,.45))" }} />
            <div className="pointer-events-none absolute left-1/2 -top-1.5 z-10 h-11 w-9 -translate-x-1/2" aria-hidden="true" style={{ filter: "drop-shadow(0 3px 3px rgba(0,0,0,.5))" }}>
              <svg viewBox="0 0 36 44" className="block h-full w-full"><path d="M18 44 L2 8 Q18 -6 34 8 Z" fill={v.cream} stroke={v.gold} strokeWidth="3" strokeLinejoin="round" /><circle cx="18" cy="14" r="4" fill={v.berry} /></svg>
            </div>
            <div className="pointer-events-none absolute left-1/2 top-1/2 flex aspect-square w-[17%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-center text-xs font-bold sm:text-base"
              style={{ border: `4px solid ${v.gold}`, background: v.cream, color: v.berry, boxShadow: "0 3px 8px rgba(0,0,0,.4)" }} aria-hidden="true">SPIN</div>
          </div>
          <p className="mt-4 min-h-[1.7em] text-center text-2xl font-bold [overflow-wrap:anywhere]" style={{ color: v.light }} aria-hidden="true">{current}</p>
        </div>

        <div className="rounded-2xl p-4" style={{ border: `2px solid ${v.gold}`, background: `${v.deep}bf`, boxShadow: `0 0 0 5px ${v.gold}1f` }}>
          <h2 className="mb-2 text-lg font-bold" style={{ color: v.light }}>Names and entries</h2>
          <fieldset disabled={spinning} className="m-0 min-w-0 border-0 p-0">
            <div className="max-h-[300px] overflow-auto rounded-lg" style={{ border: `1px solid ${v.gold}`, background: "rgba(0,0,0,.18)" }}>
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ background: v.deep, color: v.light }} className="sticky top-0 z-[1] text-left text-sm">
                    <th className="p-2">Name</th><th className="p-2">Entries</th><th className="p-2">Chance</th><th className="p-2"><span className="sr-only">Remove</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td className="p-1">
                        <input ref={el => { nameInputs.current[i] = el; }} type="text" value={r.name} placeholder="Name" aria-label={`Name, row ${i + 1}`}
                          onChange={e => edit(i, { name: e.target.value })}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addRow(i + 1); } }}
                          className={cell} style={cellStyle} />
                      </td>
                      <td className="p-1">
                        <input type="number" min={1} max={MAX_ENTRIES} value={r.count} aria-label={`Entries, row ${i + 1}`}
                          onChange={e => { if (e.target.value !== "") edit(i, { count: clampCount(e.target.value) }); }}
                          className={`${cell} !w-[68px] text-center`} style={cellStyle} />
                      </td>
                      <td className="w-[52px] whitespace-nowrap p-1 text-right text-sm" style={{ color: `${v.cream}cc` }}>
                        {r.name.trim() && total ? `${Math.round((r.count / total) * 1000) / 10}%` : "–"}
                      </td>
                      <td className="p-1">
                        <button type="button" onClick={() => removeRow(i)} aria-label={`Remove row ${i + 1}`}
                          className="h-[30px] w-[30px] rounded-full text-lg leading-none" style={{ border: `1px solid ${v.gold}99`, color: v.light }}>×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2.5"><button type="button" onClick={() => addRow()} className={btn} style={ghost}>Add a name</button></div>
            <details className="mt-3 rounded-lg" style={{ border: `1px solid ${v.gold}80` }}>
              <summary className="cursor-pointer px-3 py-2 text-sm" style={{ color: v.light }}>Paste a list</summary>
              <div className="px-3 pb-3">
                <p className="mb-2 text-sm leading-snug" style={{ color: `${v.cream}cc` }}>One name per line. To give someone extra entries, add a comma and a number, like “Harry, 10”.</p>
                <textarea value={bulk} onChange={e => setBulk(e.target.value)} spellCheck={false} placeholder={"Amira\nBen\nHarry, 10"}
                  className="h-[130px] w-full resize-y rounded-lg border p-2.5 text-base" style={cellStyle} />
                <div className="mt-2"><button type="button" onClick={addBulk} className={btn} style={ghost}>Add to table</button></div>
              </div>
            </details>
          </fieldset>
          <p className="mt-2 text-sm" style={{ color: `${v.cream}cc` }}>
            {names < 2 ? "Add at least two names to spin." : `${names} names, ${total} entries on the wheel${tiny ? ". Labels are tiny at this size, so the name at the pointer shows while it spins." : ""}`}
          </p>

          <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
            <button type="button" onClick={spin} disabled={!canSpin} className={`${btn} !px-7 !py-3 !text-lg`} style={{ background: v.gold, color: v.deep, border: `2px solid ${v.gold}` }}>Spin</button>
            <button type="button" onClick={shuffleRows} disabled={!canSpin} className={btn} style={ghost}>Shuffle</button>
          </div>
          <label className="mt-3.5 flex items-center gap-2 text-sm"><input type="checkbox" checked={sound} onChange={e => setSound(e.target.checked)} /> Tick sound</label>
          <div className="mt-3.5 flex flex-wrap items-center gap-2" role="group" aria-label="Theme">
            <span className="text-sm">Theme</span>
            {THEME_ORDER.map(k => {
              const w = THEMES[k].wheel;
              return (
                <button key={k} type="button" title={THEMES[k].name} aria-label={`${THEMES[k].name} theme`} aria-pressed={k === themeKey} onClick={() => setThemeKey(k)}
                  className="h-8 w-8 rounded-full p-0"
                  style={{ border: `2px solid ${v.cream}`, outline: k === themeKey ? `3px solid ${v.light}` : "none", outlineOffset: 2,
                    background: `conic-gradient(${w[0].bg} 0 25%, ${w[1].bg} 0 50%, ${w[2].bg} 0 75%, ${w[3].bg} 0)` }} />
              );
            })}
            <span className="text-sm">{theme.name}</span>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-bold" style={{ color: v.light }}>Picked so far</h2>
            {winners.length === 0
              ? <p className="mt-1.5 italic" style={{ color: `${v.cream}b3` }}>Nobody yet.</p>
              : <ol className="mt-1.5 list-decimal pl-6 leading-relaxed">{winners.map((w, i) => <li key={i}>{w}</li>)}</ol>}
            <div className="mt-3.5"><button type="button" onClick={() => setWinners([])} className={btn} style={ghost}>Clear list</button></div>
          </div>
        </div>
      </div>

      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5" style={{ background: "rgba(5,20,15,.78)" }}
          onClick={e => { if (e.target === e.currentTarget) closeDialog(); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="winner-name" className="w-full max-w-[440px] rounded-2xl px-6 pb-6 pt-8 text-center"
            style={{ border: `3px solid ${v.gold}`, background: `radial-gradient(circle at 50% 30%, ${v.cream} 0%, ${v.paper} 80%)`, color: v.ink, boxShadow: "0 24px 60px rgba(0,0,0,.55)" }}>
            <p className="m-0 text-lg italic" style={{ color: v.berry }}>The wheel picked</p>
            <p id="winner-name" className="mb-6 mt-2.5 text-5xl font-bold leading-tight [overflow-wrap:anywhere] max-sm:text-4xl">{result.name}</p>
            <div className="flex flex-wrap justify-center gap-2.5">
              <button type="button" className={btn} style={{ background: v.berry, color: v.cream, border: `2px solid ${v.berry}` }}
                onClick={() => { removeRow(result.row); closeDialog(); }}>
                {result.count > 1 ? `Remove all ${result.count} entries` : "Remove from wheel"}
              </button>
              <button type="button" autoFocus className={btn} style={{ border: `2px solid ${v.berry}`, color: v.berry }} onClick={closeDialog}>Keep on wheel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
