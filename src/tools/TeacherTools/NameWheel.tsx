import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Home, Plus, Copy, Trash2, X } from "lucide-react";
import { PAGE_BG } from "../../shared/colors";
import { useLayoutMode } from "../../shared/layoutMode";

// Name Wheel: pick a name at random from a list, with optional extra entries per name. Several wheels can be saved
// (one per class, say) and are kept on this device only (localStorage); nothing is sent anywhere. Standalone classroom sandbox.

const KEY = "name-wheels-v2";
const OLD_KEY = "name-wheel-v1";   // the single-wheel version: carried over as the first wheel
const TAU = Math.PI * 2;
const MAX_ENTRIES = 600;
const SANS = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";

interface Palette { name: string; colours: { bg: string; fg: string }[] }
const PALETTES: Record<string, Palette> = {
  bright: { name: "Bright", colours: [{ bg: "#2563eb", fg: "#ffffff" }, { bg: "#f59e0b", fg: "#1e293b" }, { bg: "#10b981", fg: "#ffffff" }, { bg: "#e11d48", fg: "#ffffff" }, { bg: "#7c3aed", fg: "#ffffff" }, { bg: "#0891b2", fg: "#ffffff" }] },
  soft: { name: "Soft", colours: [{ bg: "#bfdbfe", fg: "#1e293b" }, { bg: "#fde68a", fg: "#1e293b" }, { bg: "#bbf7d0", fg: "#1e293b" }, { bg: "#fecdd3", fg: "#1e293b" }, { bg: "#ddd6fe", fg: "#1e293b" }, { bg: "#a5f3fc", fg: "#1e293b" }] },
  blues: { name: "Blues", colours: [{ bg: "#1e3a8a", fg: "#ffffff" }, { bg: "#2563eb", fg: "#ffffff" }, { bg: "#60a5fa", fg: "#1e293b" }, { bg: "#dbeafe", fg: "#1e293b" }] },
  festive: { name: "Festive", colours: [{ bg: "#a81f2e", fg: "#fbf5e6" }, { bg: "#1f7351", fg: "#fbf5e6" }, { bg: "#d9b45b", fg: "#3a1017" }, { bg: "#fbf5e6", fg: "#3a1017" }] },
};
const PALETTE_ORDER = ["bright", "soft", "blues", "festive"];

interface Row { name: string; count: number }
interface Wheel { id: string; name: string; rows: Row[]; winners: string[]; palette: string }
interface Store { active: string; wheels: Wheel[]; sound: boolean }
interface Entry { name: string; row: number; pos: number }

const newId = () => Math.random().toString(36).slice(2, 9);
const emptyWheel = (name: string): Wheel => ({ id: newId(), name, rows: [{ name: "", count: 1 }], winners: [], palette: "bright" });
const clampCount = (v: string | number) => { const n = parseInt(String(v), 10); return Number.isNaN(n) || n < 1 ? 1 : Math.min(MAX_ENTRIES, n); };
const cleanRows = (rows: unknown): Row[] => {
  const r = Array.isArray(rows) ? rows.map((x: Row) => ({ name: String(x?.name ?? ""), count: clampCount(x?.count ?? 1) })) : [];
  return r.length ? r : [{ name: "", count: 1 }];
};

function load(): Store {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (s && Array.isArray(s.wheels) && s.wheels.length) {
      const wheels: Wheel[] = s.wheels.map((w: Wheel) => ({
        id: String(w.id || newId()), name: String(w.name || "Wheel"), rows: cleanRows(w.rows),
        winners: Array.isArray(w.winners) ? w.winners.map(String) : [], palette: PALETTES[w.palette] ? w.palette : "bright",
      }));
      return { wheels, active: wheels.some(w => w.id === s.active) ? s.active : wheels[0].id, sound: s.sound !== false };
    }
    const old = JSON.parse(localStorage.getItem(OLD_KEY) ?? "null");
    if (old && Array.isArray(old.rows)) {
      const w: Wheel = { ...emptyWheel("My class"), rows: cleanRows(old.rows), winners: Array.isArray(old.winners) ? old.winners.map(String) : [] };
      return { wheels: [w], active: w.id, sound: old.sound !== false };
    }
  } catch { /* blocked or corrupt: start fresh */ }
  const w = emptyWheel("My class");
  return { wheels: [w], active: w.id, sound: true };
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

const card = "rounded-2xl border border-slate-300 bg-white shadow-card";
const primary = "inline-flex h-11 items-center justify-center rounded-xl bg-blue-900 px-6 text-base font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40";
const secondary = "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";
const field = "w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-base text-slate-900";

export default function NameWheel() {
  const { phone } = useLayoutMode();
  const [store, setStore] = useState(load);
  const wheel = store.wheels.find(w => w.id === store.active) ?? store.wheels[0];
  const [spinning, setSpinning] = useState(false);
  const [current, setCurrent] = useState("");
  const [result, setResult] = useState<{ name: string; row: number; count: number } | null>(null);
  const [bulk, setBulk] = useState("");
  const [focusRow, setFocusRow] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotRef = useRef(0);
  const rafRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);
  const lastTickRef = useRef(0);
  const nameInputs = useRef<(HTMLInputElement | null)[]>([]);

  const palette = PALETTES[wheel.palette] ?? PALETTES.bright;
  const entries = useMemo(() => buildEntries(wheel.rows), [wheel.rows]);
  const names = wheel.rows.filter(r => r.name.trim()).length;
  const total = entries.length;
  const tiny = total > 100;   // labels too small to read; the name at the pointer shows while it spins
  const canSpin = !spinning && names >= 2;

  const patch = useCallback((p: Partial<Wheel>) => setStore(s => ({ ...s, wheels: s.wheels.map(w => (w.id === s.active ? { ...w, ...p } : w)) })), []);
  const setRows = (f: (rs: Row[]) => Row[]) => setStore(s => ({ ...s, wheels: s.wheels.map(w => (w.id === s.active ? { ...w, rows: f(w.rows) } : w)) }));

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { /* private mode */ }
  }, [store]);
  useEffect(() => { if (focusRow !== null) { nameInputs.current[focusRow]?.focus(); setFocusRow(null); } }, [focusRow, wheel.rows]);
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);
  useEffect(() => { setConfirmDelete(false); }, [store.active]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current, ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const size = canvas.clientWidth || 500, dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(size * dpr)) canvas.width = canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    const cx = size / 2, cy = size / 2, R = size / 2 - 3, r = R - 6, n = entries.length, rot = rotRef.current;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fillStyle = "#ffffff"; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = "#cbd5e1"; ctx.stroke();
    if (n === 0) {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fillStyle = "#f1f5f9"; ctx.fill();
      ctx.fillStyle = "#64748b"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = `500 ${Math.round(size * 0.045)}px ${SANS}`;
      ctx.fillText("Add some names", cx, cy - size * 0.14);
      return;
    }
    const slice = TAU / n;
    for (let i = 0; i < n; i++) {
      let ci = i % palette.colours.length;
      if (i === n - 1 && n > 1 && ci === 0) ci = 2 % palette.colours.length;
      const a0 = rot + i * slice, col = palette.colours[ci];
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a0, a0 + slice + (n > 120 ? 0.004 : 0)); ctx.closePath();
      ctx.fillStyle = col.bg; ctx.fill();
      if (n > 1 && n <= 120) { ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 1; ctx.stroke(); }
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(a0 + slice / 2);
      ctx.fillStyle = col.fg; ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.font = `600 ${Math.max(2, Math.min(28, 0.38 * r * slice))}px ${SANS}`;
      const maxW = r * 0.7;
      let label = entries[i].name;
      if (ctx.measureText(label).width > maxW) {
        while (label.length > 1 && ctx.measureText(label + "…").width > maxW) label = label.slice(0, -1);
        label += "…";
      }
      ctx.fillText(label, r - 14, 0);
      ctx.restore();
    }
  }, [entries, palette]);

  useEffect(() => { draw(); }, [draw]);
  useEffect(() => {
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  const tick = () => {
    const audio = audioRef.current;
    if (!store.sound || !audio) return;
    const now = performance.now();
    if (now - lastTickRef.current < 35) return;
    lastTickRef.current = now;
    try {
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = "triangle"; o.frequency.value = 880;
      g.gain.setValueAtTime(0.06, audio.currentTime);
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
      setResult({ name: entry.name, row: entry.row, count: wheel.rows[entry.row]?.count ?? 1 });
      setStore(st => ({ ...st, wheels: st.wheels.map(w => (w.id === st.active ? { ...w, winners: [...w.winners, entry.name] } : w)) }));
    };
    rafRef.current = requestAnimationFrame(step);
  };

  const removeRow = (i: number) => setRows(rs => { const next = rs.filter((_, k) => k !== i); return next.length ? next : [{ name: "", count: 1 }]; });
  const addRow = (at?: number) => {
    const idx = at ?? wheel.rows.length;
    setRows(rs => [...rs.slice(0, idx), { name: "", count: 1 }, ...rs.slice(idx)]);
    setFocusRow(idx);
  };
  const edit = (i: number, p: Partial<Row>) => setRows(rs => rs.map((r, k) => (k === i ? { ...r, ...p } : r)));
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

  // several wheels
  const addWheel = () => { const w = emptyWheel(`Wheel ${store.wheels.length + 1}`); setStore(s => ({ ...s, wheels: [...s.wheels, w], active: w.id })); };
  const duplicateWheel = () => {
    const w: Wheel = { ...wheel, id: newId(), name: `${wheel.name} copy`, rows: wheel.rows.map(r => ({ ...r })), winners: [] };
    setStore(s => ({ ...s, wheels: [...s.wheels, w], active: w.id }));
  };
  const deleteWheel = () => setStore(s => {
    const left = s.wheels.filter(w => w.id !== s.active);
    if (!left.length) { const w = emptyWheel("My class"); return { ...s, wheels: [w], active: w.id }; }
    return { ...s, wheels: left, active: left[0].id };
  });

  const closeDialog = useCallback(() => setResult(null), []);
  useEffect(() => {
    if (!result) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") closeDialog(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [result, closeDialog]);

  const actions = (
    <>
      <button type="button" onClick={spin} disabled={!canSpin} className={`${primary} ${phone ? "flex-1" : "px-10"}`}>Spin</button>
      <button type="button" onClick={shuffleRows} disabled={!canSpin} className={secondary}>Shuffle</button>
    </>
  );

  return (
    <div className="min-h-screen" style={{ background: PAGE_BG }}>
      <div className={`mx-auto max-w-5xl ${phone ? "px-4 pb-28 pt-4" : "px-6 py-8"}`}>
        <button onClick={() => { window.location.href = "/"; }} className="mb-3 inline-flex items-center gap-2 rounded-xl py-1 pr-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <Home size={18} /> Home
        </button>
        <h1 className="text-3xl font-semibold text-slate-900">Name Wheel</h1>

        {/* saved wheels */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1" role="group" aria-label="Saved wheels">
          {store.wheels.map(w => (
            <button key={w.id} type="button" disabled={spinning} aria-pressed={w.id === store.active}
              onClick={() => setStore(s => ({ ...s, active: w.id }))}
              className={`h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors disabled:opacity-50 ${w.id === store.active ? "bg-slate-900 text-white" : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-100"}`}>
              {w.name || "Untitled"}
            </button>
          ))}
          <button type="button" onClick={addWheel} disabled={spinning} aria-label="New wheel"
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-dashed border-slate-400 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50">
            <Plus size={16} /> New wheel
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          {/* the wheel */}
          <div>
            <div className="relative mx-auto aspect-square w-full max-w-[520px]">
              <canvas ref={canvasRef} onClick={spin} aria-label="Name wheel. Click to spin." className="block h-full w-full cursor-pointer rounded-full shadow-lift" />
              <svg viewBox="0 0 36 44" aria-hidden="true" className="pointer-events-none absolute -top-1 left-1/2 z-10 h-11 w-9 -translate-x-1/2 drop-shadow">
                <path d="M18 44 L2 8 Q18 -6 34 8 Z" fill="#1e3a8a" stroke="#ffffff" strokeWidth="3" strokeLinejoin="round" />
              </svg>
              <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 flex aspect-square w-[16%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-300 bg-white text-[11px] font-semibold text-blue-900 shadow-card sm:text-sm">SPIN</div>
            </div>
            <p className="mt-3 min-h-[1.75em] text-center text-xl font-semibold text-slate-800 [overflow-wrap:anywhere]" aria-hidden="true">{current}</p>
            {!phone && <div className="mt-2 flex justify-center gap-3">{actions}</div>}
          </div>

          {/* names */}
          <div className={`${card} p-4`}>
            <div className="flex items-center gap-2">
              <input value={wheel.name} onChange={e => patch({ name: e.target.value })} aria-label="Wheel name" placeholder="Wheel name"
                className="min-w-0 flex-1 rounded-lg border border-transparent px-1.5 py-1 text-lg font-semibold text-slate-900 hover:border-slate-300 focus:border-slate-300" />
              <button type="button" onClick={duplicateWheel} disabled={spinning} aria-label="Duplicate this wheel" title="Duplicate" className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40"><Copy size={18} /></button>
              {confirmDelete ? (
                <button type="button" onClick={deleteWheel} className="h-10 rounded-lg bg-red-600 px-3 text-sm font-semibold text-white">Delete?</button>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)} disabled={spinning} aria-label="Delete this wheel" title="Delete" className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40"><Trash2 size={18} /></button>
              )}
            </div>

            <fieldset disabled={spinning} className="m-0 mt-3 min-w-0 border-0 p-0">
              <div className="grid grid-cols-[minmax(0,1fr)_64px_44px_40px] items-center gap-x-2 gap-y-1.5 px-0.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <span>Name</span><span className="text-center">Entries</span><span className="text-right">Chance</span><span />
              </div>
              <div className="mt-1.5 max-h-[320px] space-y-1.5 overflow-y-auto pr-0.5">
                {wheel.rows.map((r, i) => (
                  <div key={i} className="grid grid-cols-[minmax(0,1fr)_64px_44px_40px] items-center gap-x-2">
                    <input ref={el => { nameInputs.current[i] = el; }} type="text" value={r.name} placeholder="Name" aria-label={`Name, row ${i + 1}`}
                      onChange={e => edit(i, { name: e.target.value })}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addRow(i + 1); } }}
                      className={field} />
                    <input type="number" min={1} max={MAX_ENTRIES} value={r.count} aria-label={`Entries, row ${i + 1}`}
                      onChange={e => { if (e.target.value !== "") edit(i, { count: clampCount(e.target.value) }); }}
                      className={`${field} text-center`} />
                    <span className="text-right text-xs text-slate-500">{r.name.trim() && total ? `${Math.round((r.count / total) * 1000) / 10}%` : "–"}</span>
                    <button type="button" onClick={() => removeRow(i)} aria-label={`Remove row ${i + 1}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={16} /></button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => addRow()} className={`${secondary} mt-3`}><Plus size={16} /> Add a name</button>

              <details className="mt-3 rounded-xl border border-slate-200">
                <summary className="cursor-pointer px-3 py-2.5 text-sm font-semibold text-slate-700">Paste a list</summary>
                <div className="px-3 pb-3">
                  <p className="mb-2 text-sm text-slate-500">One name per line. For extra entries add a comma and a number, like “Harry, 10”.</p>
                  <textarea value={bulk} onChange={e => setBulk(e.target.value)} spellCheck={false} placeholder={"Amira\nBen\nHarry, 10"} className={`${field} h-28 resize-y`} />
                  <button type="button" onClick={addBulk} className={`${secondary} mt-2`}>Add to table</button>
                </div>
              </details>
            </fieldset>

            <p className="mt-3 text-sm text-slate-500">
              {names < 2 ? "Add at least two names to spin." : `${names} names, ${total} entries${tiny ? ". Labels are tiny at this size, so the name at the pointer shows while it spins." : "."}`}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-slate-200 pt-4">
              <div className="flex items-center gap-2" role="group" aria-label="Colours">
                <span className="text-sm text-slate-600">Colours</span>
                {PALETTE_ORDER.map(k => {
                  const c = PALETTES[k].colours;
                  return (
                    <button key={k} type="button" title={PALETTES[k].name} aria-label={`${PALETTES[k].name} colours`} aria-pressed={k === wheel.palette} onClick={() => patch({ palette: k })}
                      className={`h-8 w-8 rounded-full border border-slate-300 ${k === wheel.palette ? "outline outline-2 outline-offset-2 outline-blue-900" : ""}`}
                      style={{ background: `conic-gradient(${c[0].bg} 0 25%, ${c[1].bg} 0 50%, ${c[2].bg} 0 75%, ${c[3 % c.length].bg} 0)` }} />
                  );
                })}
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={store.sound} onChange={e => setStore(s => ({ ...s, sound: e.target.checked }))} /> Tick sound</label>
            </div>

            <div className="mt-4 border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">Picked so far</h2>
                {wheel.winners.length > 0 && <button type="button" onClick={() => patch({ winners: [] })} className="text-sm font-semibold text-slate-500 hover:text-slate-800">Clear</button>}
              </div>
              {wheel.winners.length === 0
                ? <p className="mt-1 text-sm italic text-slate-400">Nobody yet.</p>
                : <ol className="mt-1.5 list-decimal pl-6 text-slate-800">{wheel.winners.map((w, i) => <li key={i}>{w}</li>)}</ol>}
            </div>
          </div>
        </div>
      </div>

      {phone && <div className="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-slate-200 bg-white px-4 py-3">{actions}</div>}

      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-5" onClick={e => { if (e.target === e.currentTarget) closeDialog(); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="winner-name" className={`${card} w-full max-w-[420px] p-6 text-center shadow-lift`}>
            <p className="text-sm text-slate-500">The wheel picked</p>
            <p id="winner-name" className="mb-6 mt-1 text-4xl font-semibold leading-tight text-slate-900 [overflow-wrap:anywhere]">{result.name}</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button type="button" className={primary} onClick={() => { removeRow(result.row); closeDialog(); }}>
                {result.count > 1 ? `Remove all ${result.count} entries` : "Remove from wheel"}
              </button>
              <button type="button" autoFocus className={secondary} onClick={closeDialog}>Keep on wheel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
