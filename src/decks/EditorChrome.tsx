import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Check, ChevronDown, ChevronRight, Copy, GripVertical, List, Search, Trash2, LayoutGrid, X } from "lucide-react";
import { misconceptionLabel } from "../shared/misconceptions";
import { SlideCanvas } from "./SlideCanvas";
import { CANVAS_W, FAMILY_STYLE, type DeckElement, type Slide } from "./types";

// The editor's chrome (everything around the canvas): remembered panel sizes, dropdown menus, collapsible sections,
// the slide strip with its finder, and the list of what is on the slide. The canvas and the editing live in Editor.tsx.

/** A setting remembered on this device (a panel's width, whether a section is open). Falls back quietly without storage. */
export function usePref<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try { const raw = localStorage.getItem(`mt-deck-${key}`); return raw === null ? initial : (JSON.parse(raw) as T); } catch { return initial; }
  });
  const set = (v: T) => { setValue(v); try { localStorage.setItem(`mt-deck-${key}`, JSON.stringify(v)); } catch { /* ignore */ } };
  return [value, set];
}

/** A dropdown that closes on an outside click or Esc. `children` receives `close` so a menu item can shut it. The list is
 *  positioned on the screen (not inside its parent), so a narrow or scrolling panel never clips it. */
export function Menu({ button, title, label, align = "left", wide, up, full, bare, children }: { button: ReactNode; title?: string; label?: string; align?: "left" | "right"; wide?: boolean; up?: boolean; full?: boolean; bare?: boolean; children: (close: () => void) => ReactNode }) {
  const [pos, setPos] = useState<CSSProperties | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const open = pos !== null;
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setPos(null); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setPos(null); };
    window.addEventListener("pointerdown", down); window.addEventListener("keydown", key);
    return () => { window.removeEventListener("pointerdown", down); window.removeEventListener("keydown", key); };
  }, [open]);
  const toggle = () => {
    if (open) { setPos(null); return; }
    const r = ref.current?.getBoundingClientRect(); if (!r) return;
    const w = Math.min(window.innerWidth - 16, full ? Math.max(r.width, wide ? 320 : 240) : wide ? 320 : 240);
    const left = Math.max(8, Math.min(window.innerWidth - w - 8, align === "right" ? r.right - w : r.left));
    setPos(up ? { left, width: w, bottom: window.innerHeight - r.top + 4, maxHeight: r.top - 12 } : { left, width: w, top: r.bottom + 4, maxHeight: window.innerHeight - r.bottom - 12 });
  };
  return (
    <div ref={ref} className={`relative ${full ? "w-full" : ""}`}>
      <button type="button" title={title} aria-label={label} aria-expanded={open} onClick={toggle}
        className={bare
          ? `inline-flex h-8 items-center rounded-md px-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 ${open ? "bg-slate-100 text-slate-900" : ""}`
          : `inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 ${open ? "bg-slate-100" : ""} ${full ? "w-full justify-center border border-slate-300 bg-white" : ""}`}>
        {button}{!bare && <ChevronDown size={13} className="shrink-0 text-slate-400" />}
      </button>
      {pos && <div style={pos} className="fixed z-[2500] overflow-y-auto rounded-xl border border-slate-300 bg-white p-1 shadow-lift">{children(() => setPos(null))}</div>}
    </div>
  );
}

/** One row of a menu. `shortcut` shows the key on the right; `checked` makes it a tick-box row (a View setting). */
export const MenuItem = ({ icon, label, note, onClick, danger, disabled, shortcut, checked }: { icon?: ReactNode; label: string; note?: string; onClick: () => void; danger?: boolean; disabled?: boolean; shortcut?: string; checked?: boolean }) => (
  <button type="button" aria-pressed={checked} aria-label={label} disabled={disabled} onClick={onClick}
    className={`flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40 ${danger ? "text-red-700" : "text-slate-800"}`}>
    {checked !== undefined ? <span className="mt-0.5 w-3.5 shrink-0 text-blue-700">{checked && <Check size={14} />}</span> : icon && <span className="mt-0.5 shrink-0 text-slate-500">{icon}</span>}
    <span className="min-w-0 flex-1"><span className="font-medium">{label}</span>{note && <span className="block text-xs leading-snug text-slate-500">{note}</span>}</span>
    {shortcut && <kbd className="mt-0.5 shrink-0 font-sans text-xs text-slate-400">{shortcut}</kbd>}
  </button>
);

export const MenuDivider = () => <div className="my-1 h-px bg-slate-200" />;

/** The thin rule between groups in the toolbar. */
export const BarDivider = () => <span className="mx-1 h-5 w-px shrink-0 bg-slate-200" />;

/** The keys, in a small window (View → Keyboard shortcuts, or `?`). Closes on Esc or a click outside. */
export function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[2600] flex items-center justify-center bg-slate-900/30 p-4" onPointerDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" onPointerDown={(e) => e.stopPropagation()} className="max-h-full w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-300 bg-white p-5 shadow-lift">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-900">Keyboard shortcuts</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><X size={16} /></button></div>
        {SHORTCUTS.map(([k, v]) => <div key={k} className="flex justify-between gap-4 border-t border-slate-100 py-1.5 text-sm"><span className="text-slate-600">{v}</span><kbd className="shrink-0 text-right font-sans font-semibold text-slate-800">{k}</kbd></div>)}
      </div>
    </div>
  );
}

export const MenuHeading = ({ children, colour }: { children: ReactNode; colour?: string }) => (
  <div className="flex items-center gap-1.5 px-2 pb-0.5 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{colour && <span className="h-2 w-2 rounded-full" style={{ background: colour }} />}{children}</div>
);

export const input = "w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none";
export const small = "inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40";

/** A collapsible group in the properties panel; open or shut is remembered per section. `badge` shows its state while shut. */
export function Section({ id, title, defaultOpen = false, badge, children }: { id: string; title: string; defaultOpen?: boolean; badge?: string; children: ReactNode }) {
  const [open, setOpen] = usePref(`sec-${id}`, defaultOpen);
  return (
    <div className="mt-3 border-t border-slate-200 pt-1">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-center gap-1 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 hover:text-slate-900">
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}{title}
        {!open && badge && <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium normal-case tracking-normal text-slate-600">{badge}</span>}
      </button>
      {open && <div className="pb-2">{children}</div>}
    </div>
  );
}

/** The drag edge between a panel and the canvas. `side` is the side of the edge the panel sits on. */
export function Splitter({ side, width, min, max, onChange }: { side: "left" | "right"; width: number; min: number; max: number; onChange: (w: number) => void }) {
  const down = (e: React.PointerEvent) => {
    e.preventDefault();
    const x0 = e.clientX, w0 = width;
    const move = (m: PointerEvent) => onChange(Math.max(min, Math.min(max, w0 + (side === "left" ? m.clientX - x0 : x0 - m.clientX))));
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  };
  return <div role="separator" aria-orientation="vertical" title="Drag to resize (double-click to reset)" onPointerDown={down} onDoubleClick={() => onChange(side === "left" ? 240 : 320)} className="w-1.5 shrink-0 cursor-col-resize bg-transparent hover:bg-blue-200 active:bg-blue-300" />;
}

// ── element names (the list of what is on the slide, and the properties header) ─────────────────────────────────

export const KIND_NAME: Record<string, string> = { ink: "Writing", text: "Text", maths: "Equation", shape: "Shape", line: "Line", image: "Image", board: "Board", ratioTable: "Ratio table", bar: "Bar model", questions: "Question set", practice: "Skill practice", generator: "Generator question", worksheet: "Book activity", grid: "Question grid", depth: "Depth question" };

/** A short, human description of one element for the objects list. */
function elementLabel(el: DeckElement): string {
  const clip = (s: string) => { const t = s.replace(/\s+/g, " ").trim(); return t.length > 34 ? `${t.slice(0, 33)}…` : t || "(empty)"; };
  switch (el.kind) {
    case "text": return clip(el.text);
    case "maths": return clip(el.latex);
    case "shape": return el.shape === "ellipse" ? "Ellipse" : "Rectangle";
    case "line": return el.arrow ? "Arrow" : "Line";
    case "board": return `Board, ${el.grid.rows.length} rows`;
    case "ratioTable": return `Ratio table, ${el.table.rows.length} rows`;
    case "ink": return `Writing, ${el.strokes.length} stroke${el.strokes.length === 1 ? "" : "s"}`;
    case "numberGrid": return `Number grid, 1 to 100${el.staged ? ", staged" : ""}`;
    case "bar": return `Bar model, ${el.bar.parts.reduce((n, p) => n + p.units, 0)} boxes`;
    case "practice": case "generator": case "worksheet": case "depth": return `${KIND_NAME[el.kind]} (${el.tool})`;
    case "questions": return `${KIND_NAME.questions}, ${el.items.length} questions`;
    case "grid": return `${KIND_NAME.grid}, ${(el.items ?? el.bank).length} questions`;
    default: return KIND_NAME[el.kind] ?? el.kind;
  }
}

/** Everything on the slide, front first: click to select (Shift adds), arrows change the layer. Finds what is hidden behind something else. */
export function ObjectList({ els, selected, onSelect, onLayer }: { els: DeckElement[]; selected: Set<string>; onSelect: (id: string, add: boolean) => void; onLayer: (id: string, dir: 1 | -1) => void }) {
  if (!els.length) return <p className="text-xs text-slate-500">Nothing on this slide yet. Add something from Insert, or the bar above.</p>;
  return (
    <ul className="space-y-0.5">
      {[...els].reverse().map((el) => (
        <li key={el.id} className={`group flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs ${selected.has(el.id) ? "bg-blue-50 ring-1 ring-blue-400" : "hover:bg-slate-50"}`}>
          <button type="button" onClick={(e) => onSelect(el.id, e.shiftKey)} className="min-w-0 flex-1 truncate text-left text-slate-800" title={elementLabel(el)}>
            <span className="mr-1 font-semibold text-slate-500">{KIND_NAME[el.kind] ?? el.kind}</span>{el.kind === "text" || el.kind === "maths" ? elementLabel(el) : ""}
            {(el.step ?? 0) > 0 && <span className="ml-1 rounded-full bg-pink-700 px-1.5 text-[10px] font-semibold text-white">{el.step}</span>}
          </button>
          <button type="button" aria-label="Bring forward" title="Bring forward" className="rounded p-0.5 text-slate-400 opacity-0 hover:bg-slate-200 hover:text-slate-700 group-hover:opacity-100 focus:opacity-100" onClick={() => onLayer(el.id, 1)}><ArrowUp size={12} /></button>
          <button type="button" aria-label="Send back" title="Send back" className="rounded p-0.5 text-slate-400 opacity-0 hover:bg-slate-200 hover:text-slate-700 group-hover:opacity-100 focus:opacity-100" onClick={() => onLayer(el.id, -1)}><ArrowDown size={12} /></button>
        </li>
      ))}
    </ul>
  );
}

// ── the slide strip ──────────────────────────────────────────────────────────────────────────────────────────────

/** The name a slide has in the list: its title without `$…$` markers, and a bare "Practice" says which misconception it aims at. */
function slideLabel(s: Slide): string {
  const title = s.title.replace(/\$/g, "").trim();
  const practice = s.els.find((e) => e.kind === "practice");
  return practice && practice.kind === "practice" && practice.intention && /^practice$/i.test(title) ? `Practice: ${misconceptionLabel(practice.intention)}` : title || "(untitled)";
}

/** What a slide says, lower-case, for the finder: its title, its kind, and the words on it. */
const slideText = (s: Slide): string => [slideLabel(s), FAMILY_STYLE[s.family].label, s.brief ?? "", ...s.els.map((e) => (e.kind === "text" ? e.text : e.kind === "maths" ? e.latex : e.kind === "questions" ? e.items.map((q) => `${q.title} ${q.question.join(" ")}`).join(" ") : KIND_NAME[e.kind] ?? ""))].join(" ").toLowerCase();

export function SlideStrip({ slides, si, width, view, setView, onGo, onReorder, onDuplicate, onDelete, bankVersion, add }: {
  slides: Slide[]; si: number; width: number; view: "thumbs" | "list"; setView: (v: "thumbs" | "list") => void;
  onGo: (i: number) => void; onReorder: (from: number, to: number) => void; onDuplicate: (i: number) => void; onDelete: (i: number) => void; bankVersion: number; add: ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const activeRef = useRef<HTMLDivElement>(null);
  const q = query.trim().toLowerCase();
  const shown = slides.map((s, i) => ({ s, i })).filter(({ s }) => !q || slideText(s).includes(q));
  useEffect(() => { activeRef.current?.scrollIntoView({ block: "nearest" }); }, [si, view]);
  const scale = Math.max(0.08, (width - 52) / CANVAS_W);
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-slate-200 p-2">
        <div className="relative min-w-0 flex-1">
          <Search size={13} className="pointer-events-none absolute left-2 top-2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a slide" aria-label="Find a slide" className="w-full rounded-lg border border-slate-300 bg-white py-1 pl-7 pr-6 text-xs focus:border-blue-500 focus:outline-none" />
          {query && <button type="button" aria-label="Clear" onClick={() => setQuery("")} className="absolute right-1.5 top-1.5 text-slate-400 hover:text-slate-700"><X size={13} /></button>}
        </div>
        <button type="button" title={view === "list" ? "Show pictures" : "Show a compact list"} onClick={() => setView(view === "list" ? "thumbs" : "list")} className="rounded-lg border border-slate-300 bg-white p-1.5 text-slate-600 hover:bg-slate-50">{view === "list" ? <LayoutGrid size={14} /> : <List size={14} />}</button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {!shown.length && <p className="px-1 text-xs text-slate-500">No slide matches “{query}”.</p>}
        {shown.map(({ s, i }) => (
          <div key={s.id} ref={i === si ? activeRef : undefined} role="button" tabIndex={0} draggable={!q}
            onClick={() => onGo(i)} onKeyDown={(e) => { if (e.key === "Enter") onGo(i); }}
            onDragStart={(e) => { setDragging(i); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(i)); }}
            onDragOver={(e) => { if (dragging !== null) { e.preventDefault(); setOver(i); } }}
            onDrop={(e) => { e.preventDefault(); if (dragging !== null && dragging !== i) onReorder(dragging, i); setDragging(null); setOver(null); }}
            onDragEnd={() => { setDragging(null); setOver(null); }}
            className={`group relative mb-1.5 cursor-pointer rounded-lg p-1 ${i === si ? "ring-2 ring-blue-500" : "hover:bg-slate-50"} ${over === i && dragging !== null && dragging !== i ? "border-t-4 border-blue-400" : ""} ${dragging === i ? "opacity-40" : ""}`}>
            {view === "thumbs" && s.brief && <div className="mb-1 line-clamp-2 text-[10px] text-slate-500" title={s.brief}>{s.brief}</div>}
            {view === "thumbs" ? (
              <div className="flex items-start gap-1">
                <span className="w-4 shrink-0 pt-0.5 text-[10px] text-slate-400">{i + 1}</span>
                <div className="overflow-hidden rounded border border-slate-200"><SlideCanvas key={`${s.id}-${bankVersion}`} slide={s} scale={scale} /></div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs">
                <GripVertical size={12} className="shrink-0 text-slate-300" />
                <span className="w-5 shrink-0 text-right text-slate-400">{i + 1}</span>
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: FAMILY_STYLE[s.family].colour }} />
                <span className="truncate font-medium text-slate-800">{slideLabel(s)}</span>
              </div>
            )}
            <div className={`absolute right-1 top-1 hidden gap-0.5 group-hover:flex group-focus-within:flex ${view === "thumbs" ? "" : "top-0.5"}`}>
              <button type="button" aria-label="Duplicate slide" title="Duplicate slide" onClick={(e) => { e.stopPropagation(); onDuplicate(i); }} className="rounded bg-white/90 p-1 text-slate-500 shadow-sm hover:text-slate-900"><Copy size={12} /></button>
              <button type="button" aria-label="Delete slide" title="Delete slide" disabled={slides.length < 2} onClick={(e) => { e.stopPropagation(); onDelete(i); }} className="rounded bg-white/90 p-1 text-slate-500 shadow-sm hover:text-red-700 disabled:opacity-40"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-200 p-2">{add}</div>
    </div>
  );
}

/** The keys, as a menu panel (the old paragraph under the properties). */
const SHORTCUTS: [string, string][] = [
  ["Click / Shift-click / drag a box", "Select / add / select several"], ["Double-click", "Type in text, edit an equation"], ["Ctrl+A", "Select everything on the slide"],
  ["Arrows (Shift = 1)", "Nudge the selection"], ["Alt while dragging", "Place freely (no snapping)"], ["Ctrl+D", "Duplicate"], ["Ctrl+C / Ctrl+V", "Copy and paste, also between decks"], ["Ctrl+V with a picture copied", "Paste it onto the slide (or drop an image file)"],
  ["Ctrl+Z / Ctrl+Shift+Z", "Undo / redo"], ["Page Up / Page Down", "Previous / next slide"], ["Delete", "Delete the selection"], ["\\", "Hide or show both side panels"], ["?", "Show these shortcuts"],
];
