import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  AlignCenterHorizontal, AlignCenterVertical, AlignEndHorizontal, AlignEndVertical, AlignHorizontalDistributeCenter, AlignStartHorizontal, AlignStartVertical,
  AlignVerticalDistributeCenter, ArrowDown, ArrowUp, ChevronsDown, ChevronsUp, Circle, Copy, Download, Image as ImageIcon, ListChecks, Minus, MoveUpRight,
  LayoutGrid, MessagesSquare, Play, Plus, Redo2, RotateCcw, Sigma, Square, Table2, Trash2, Type, Undo2, Upload,
} from "lucide-react";
import { MathRenderer } from "../shared/components/MathRenderer";
import { loadKaTeX } from "../shared/katex";
import { MISCONCEPTIONS } from "../shared/misconceptions";
import { useCloudState } from "./cloud";
import { EquationEditor } from "./EquationEditor";
import { BoardProps, DepthProps, GridProps, Label, Num, PracticeProps, QuestionEditor, SNAP, Swatches, inlineErrors, input, readImage, reId, reIdSlide, small, snap, toolBtn, uid } from "./EditorPanels";
import { GENERATOR_TOOLS } from "./generators";
import { align, bbox, distribute, intersects, snapBox, snapEdge, snapTargets, unionBox, type AlignHow, type Guide, type Rect } from "./geometry";
import { INK, LAYOUTS } from "./layouts";
import { SlideCanvas } from "./SlideCanvas";
import { builtDeck, resetDeck, saveDeck, saveQuestion } from "./store";
import { CANVAS_H, CANVAS_W, FAMILY_STYLE, MIN_TEXT, type BankQuestion, type DeckDef, type DeckElement, type DeckFamily, type Slide } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// The deck editor: a small slide editor around the site's own pieces. Slide strip on the left, the canvas in the
// middle, the selection's properties on the right. On the canvas: click to select (Shift-click adds; drag on empty
// space draws a selection box), drag to move with smart guides (edges and centres of the slide and of other
// elements; grid otherwise; Alt places freely), handles to resize, double-click text to type into it on the slide,
// double-click an equation to edit it. Every change is saved on this device as it happens; Undo / Redo cover the
// session. Keys: Delete · Ctrl+Z / Ctrl+Shift+Z · Ctrl+A · Ctrl+D · Ctrl+C / Ctrl+V (also between decks) · arrows
// nudge · Enter types into a selected text box · Esc stops typing, then clears the selection.
// ─────────────────────────────────────────────────────────────────────────────

const HISTORY_MAX = 100;
const CLIP_KEY = "mt-deck-clip";
const GUIDE_PX = 7;                                    // how close (on screen) an edge must come to a guide to snap to it

type Handle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "p1" | "p2";
type Drag =
  | { mode: "move"; x0: number; y0: number; origs: DeckElement[]; before: DeckDef; moved: boolean }
  | { mode: Handle; x0: number; y0: number; orig: DeckElement; before: DeckDef; moved: boolean }
  | { mode: "marquee"; cx: number; cy: number; base: string[] };

type Clip = { els?: DeckElement[]; el?: DeckElement; slide?: Slide };

export function Editor({ start, startIndex, onPresent }: { start: DeckDef; startIndex: number; onPresent: (deck: DeckDef, index: number) => void }) {
  const [deck, setDeck] = useState(start);
  const [si, setSi] = useState(Math.min(startIndex, start.slides.length - 1));
  const [sel, setSel] = useState<string[]>([]);
  const [editing, setEditing] = useState<string | null>(null);          // the text box being typed into on the slide
  const [guides, setGuides] = useState<Guide[]>([]);
  const [marquee, setMarquee] = useState<Rect | null>(null);
  const [status, setStatus] = useState("");
  const [layoutMenu, setLayoutMenu] = useState(false);
  const [question, setQuestion] = useState<{ q: BankQuestion; add: boolean } | null>(null);
  const [equation, setEquation] = useState<{ mode: "new" | "edit" | "insert"; id?: string; latex: string } | null>(null);
  const [bankVersion, setBankVersion] = useState(0);
  const [scale, setScale] = useState(0.5);
  const [, setHist] = useState(0);
  const cloud = useCloudState();
  const past = useRef<DeckDef[]>([]);
  const future = useRef<DeckDef[]>([]);
  const drag = useRef<Drag | null>(null);
  const editStart = useRef<DeckDef | null>(null);
  const caret = useRef<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const inlineRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => { void loadKaTeX().then(() => setBankVersion((v) => v + 1)); }, []);

  // keep the canvas as large as the middle column allows
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const fit = () => setScale(Math.max(0.2, Math.min((el.clientWidth - 16) / CANVAS_W, (el.clientHeight - 16) / CANVAS_H)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // every change is saved on this device as it happens
  const saved = useRef(start);                                     // opening the editor is not an edit; undoing back to the start is
  useEffect(() => {
    if (deck === saved.current) return;
    saved.current = deck;
    setStatus(saveDeck(deck) ? "Saved on this device" : "Not saved: this device's storage is full (try smaller images)");
  }, [deck]);

  // History lives in refs and is changed outside state updaters (development mode runs an updater twice).
  const deckRef = useRef(deck);
  deckRef.current = deck;
  const record = (before: DeckDef) => { past.current = [...past.current.slice(-(HISTORY_MAX - 1)), before]; future.current = []; setHist((h) => h + 1); };
  const apply = useCallback((fn: (d: DeckDef) => DeckDef) => {
    const d = deckRef.current, n = fn(d);
    if (n === d) return;
    record(d); deckRef.current = n; setDeck(n);
  }, []);
  /** A change made many times a second (dragging, typing): no history entry here; the caller records once at the end. */
  const live = (fn: (d: DeckDef) => DeckDef) => { const n = fn(deckRef.current); deckRef.current = n; setDeck(n); };
  const undo = useCallback(() => { const p = past.current.pop(); if (!p) return; future.current.push(deckRef.current); deckRef.current = p; setDeck(p); setHist((h) => h + 1); }, []);
  const redo = useCallback(() => { const f = future.current.pop(); if (!f) return; past.current.push(deckRef.current); deckRef.current = f; setDeck(f); setHist((h) => h + 1); }, []);

  const slide = deck.slides[Math.min(si, deck.slides.length - 1)];
  const selSet = new Set(sel);
  const chosen = slide.els.filter((e) => selSet.has(e.id));
  const one = chosen.length === 1 ? chosen[0] : null;
  const mapSlide = (d: DeckDef, fn: (s: Slide) => Slide): DeckDef => ({ ...d, slides: d.slides.map((s) => (s.id === slide.id ? fn(s) : s)) });
  const setSlide = (fn: (s: Slide) => Slide) => apply((d) => mapSlide(d, fn));
  const patchEl = (d: DeckDef, id: string, patch: Partial<DeckElement>) => mapSlide(d, (s) => ({ ...s, els: s.els.map((e) => (e.id === id ? ({ ...e, ...patch } as DeckElement) : e)) }));
  const setEl = (id: string, patch: Partial<DeckElement>) => apply((d) => patchEl(d, id, patch));
  const addEls = (els: DeckElement[]) => { setSlide((s) => ({ ...s, els: [...s.els, ...els] })); setSel(els.map((e) => e.id)); };
  const deleteSel = () => { setSlide((s) => ({ ...s, els: s.els.filter((e) => !selSet.has(e.id)) })); setSel([]); };
  const duplicateSel = () => addEls(chosen.map((e) => ({ ...reId(e, slide.id), x: e.x + 30, y: e.y + 30 })));
  const layer = (to: "front" | "back" | "up" | "down") => setSlide((s) => {
    const moving = s.els.filter((e) => selSet.has(e.id)), rest = s.els.filter((e) => !selSet.has(e.id));
    if (!moving.length) return s;
    if (to === "front") return { ...s, els: [...rest, ...moving] };
    if (to === "back") return { ...s, els: [...moving, ...rest] };
    const els = [...s.els];
    const order = to === "up" ? [...els.keys()].reverse() : [...els.keys()];
    for (const i of order) {
      if (!selSet.has(els[i].id)) continue;
      const j = to === "up" ? i + 1 : i - 1;
      if (j < 0 || j >= els.length || selSet.has(els[j].id)) continue;
      [els[i], els[j]] = [els[j], els[i]];
    }
    return { ...s, els };
  });
  const doAlign = (how: AlignHow) => setSlide((s) => ({ ...s, els: align(s.els, selSet, how) }));
  const doDistribute = (axis: "x" | "y") => setSlide((s) => ({ ...s, els: distribute(s.els, selSet, axis) }));

  // ── typing on the slide ──
  const stopEditing = useCallback(() => {
    if (editStart.current && editStart.current !== deckRef.current) record(editStart.current);
    editStart.current = null; caret.current = null;
    setEditing(null);
  }, []);
  const startEditing = (id: string, selectAll = false) => {
    stopEditing();
    editStart.current = deckRef.current;
    setSel([id]); setEditing(id);
    requestAnimationFrame(() => { const ta = inlineRef.current; if (!ta) return; ta.focus(); if (selectAll) ta.select(); else ta.setSelectionRange(ta.value.length, ta.value.length); });
  };
  const editingEl = editing ? slide.els.find((e) => e.id === editing && e.kind === "text") as Extract<DeckElement, { kind: "text" }> | undefined : undefined;
  // a text box grows to fit what is typed into it
  useLayoutEffect(() => {
    const ta = inlineRef.current;
    if (!ta || !editingEl) return;
    ta.style.height = "auto";
    const need = Math.ceil(ta.scrollHeight);
    ta.style.height = "";
    if (need > editingEl.h + 1) live((d) => patchEl(d, editingEl.id, { h: Math.min(need, CANVAS_H - editingEl.y) }));
  });   // eslint-disable-line react-hooks/exhaustive-deps -- deliberate: measures after every render while a box is being typed into
  /** Puts `$latex$` where the caret was in the text box being typed into (or the selected one, at its end). */
  const insertMaths = (latex: string) => {
    const el = editingEl ?? (one?.kind === "text" ? one : null);
    if (!el) return;
    const at = editingEl && caret.current !== null ? caret.current : el.text.length;
    const piece = `$${latex}$`;
    const text = el.text.slice(0, at) + piece + el.text.slice(at);
    if (editingEl) { live((d) => patchEl(d, el.id, { text })); caret.current = at + piece.length; requestAnimationFrame(() => { const ta = inlineRef.current; if (ta) { ta.focus(); ta.setSelectionRange(at + piece.length, at + piece.length); } }); }
    else setEl(el.id, { text });
  };

  // ── slides ──
  const goSlide = (i: number) => { stopEditing(); setSi(Math.max(0, Math.min(deck.slides.length - 1, i))); setSel([]); };
  const addSlide = (s: Slide) => { stopEditing(); apply((d) => ({ ...d, slides: [...d.slides.slice(0, si + 1), s, ...d.slides.slice(si + 1)] })); setSi(si + 1); setSel([]); setLayoutMenu(false); };
  const moveSlide = (d: number) => { const j = si + d; if (j < 0 || j >= deck.slides.length) return; apply((x) => { const ss = [...x.slides]; [ss[si], ss[j]] = [ss[j], ss[si]]; return { ...x, slides: ss }; }); setSi(j); };
  const deleteSlide = () => { if (deck.slides.length < 2) return; apply((d) => ({ ...d, slides: d.slides.filter((_, i) => i !== si) })); setSi(Math.max(0, si - 1)); setSel([]); };

  const copy = (what: Clip) => { try { localStorage.setItem(CLIP_KEY, JSON.stringify(what)); setStatus(what.slide ? "Copied the slide" : `Copied ${what.els?.length === 1 ? "the element" : `${what.els?.length} elements`}`); } catch { /* ignore */ } };
  const paste = () => {
    let clip: Clip = {};
    try { clip = JSON.parse(localStorage.getItem(CLIP_KEY) ?? "{}") as Clip; } catch { /* ignore */ }
    const els = clip.els ?? (clip.el ? [clip.el] : []);
    if (els.length) addEls(els.map((e) => reId(e, slide.id)));
    else if (clip.slide) addSlide(reIdSlide(clip.slide));
  };

  // ── adding ──
  const centre = (w2: number, h2: number) => ({ x: snap((CANVAS_W - w2) / 2, false), y: snap((CANVAS_H - h2) / 2, false), w: w2, h: h2 });
  const addText = () => { const el: DeckElement = { id: uid(slide.id), kind: "text", ...centre(800, 80), text: "New text", size: 56, colour: INK }; addEls([el]); setTimeout(() => startEditing(el.id, true), 0); };
  const ADD: { label: string; icon: ReactNode; run: () => void }[] = [
    { label: "Text", icon: <Type size={16} />, run: addText },
    { label: "Equation", icon: <Sigma size={16} />, run: () => setEquation({ mode: "new", latex: "" }) },
    { label: "Rectangle", icon: <Square size={16} />, run: () => addEls([{ id: uid(slide.id), kind: "shape", shape: "rect", ...centre(400, 250), fill: "#dbeafe", stroke: "#1e3a8a", strokeWidth: 4, radius: 16 }]) },
    { label: "Ellipse", icon: <Circle size={16} />, run: () => addEls([{ id: uid(slide.id), kind: "shape", shape: "ellipse", ...centre(300, 300), fill: "#ede9fe", stroke: "#7c3aed", strokeWidth: 4 }]) },
    { label: "Line", icon: <Minus size={16} />, run: () => addEls([{ id: uid(slide.id), kind: "line", x: 600, y: 450, w: 400, h: 0, colour: INK, width: 6 }]) },
    { label: "Arrow", icon: <MoveUpRight size={16} />, run: () => addEls([{ id: uid(slide.id), kind: "line", x: 600, y: 450, w: 400, h: 0, colour: INK, width: 6, arrow: true }]) },
    { label: "Board", icon: <Table2 size={16} />, run: () => addEls([{ id: uid(slide.id), kind: "board", ...centre(1000, 400), grid: { head: ["", ""], given: 1, rows: [["", ""], ["", ""], ["", ""]] }, fill: "filled", size: 46 }]) },
    { label: "Depth question", icon: <MessagesSquare size={16} />, run: () => addEls([{ id: uid(slide.id), kind: "depth", x: 80, y: 40, w: 1440, h: 830, tool: deck.tool ?? GENERATOR_TOOLS[0][0], item: "" }]) },
    { label: "Question grid", icon: <LayoutGrid size={16} />, run: () => addEls([{ id: uid(slide.id), kind: "grid", x: 100, y: 190, w: 1400, h: 660, bank: [], cols: 2 }]) },
    { label: "Practice question", icon: <ListChecks size={16} />, run: () => addEls([{ id: uid(slide.id), kind: "practice", x: 100, y: 70, w: 1400, h: 780, tool: deck.tool ?? GENERATOR_TOOLS[0][0], intention: Object.keys(MISCONCEPTIONS)[0], bank: [], prompt: "Estimate.", size: 120 }]) },
  ];

  const onImage = async (file: File | undefined) => {
    if (!file) return;
    try {
      const img = await readImage(file);
      const k = Math.min(1, 800 / img.w, 600 / img.h);
      addEls([{ id: uid(slide.id), kind: "image", src: img.src, ...centre(Math.round(img.w * k), Math.round(img.h * k)) }]);
    } catch { setStatus("That file could not be read as an image"); }
  };

  const exportDeck = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(deck, null, 2)], { type: "application/json" }));
    a.download = `${deck.id}.deck.json`; a.click(); URL.revokeObjectURL(a.href);
  };
  const importSlides = async (file: File | undefined) => {
    if (!file) return;
    try {
      const d = JSON.parse(await file.text()) as DeckDef;
      if (!Array.isArray(d.slides)) throw new Error();
      apply((x) => ({ ...x, slides: [...x.slides, ...d.slides.map(reIdSlide)] }));
      setStatus(`Added ${d.slides.length} slides from ${d.title ?? "the file"}`);
    } catch { setStatus("That file is not a deck"); }
  };

  // ── pointer: select, move, resize, select-by-box ──
  const toCanvas = (e: { clientX: number; clientY: number }) => {
    const r = canvasRef.current?.getBoundingClientRect();
    return r ? { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale } : { x: 0, y: 0 };
  };
  const pressElement = (e: React.PointerEvent, el: DeckElement) => {
    e.stopPropagation();
    if (editing === el.id) return;                               // clicks inside the box being typed into stay there
    e.preventDefault();
    stopEditing();
    const additive = e.shiftKey || e.ctrlKey || e.metaKey;
    let next = sel;
    if (additive) next = selSet.has(el.id) ? sel.filter((x) => x !== el.id) : [...sel, el.id];
    else if (!selSet.has(el.id)) next = [el.id];
    setSel(next);
    if (additive && !next.includes(el.id)) return;
    const ids = new Set(next);
    drag.current = { mode: "move", x0: e.clientX, y0: e.clientY, origs: slide.els.filter((x) => ids.has(x.id)), before: deck, moved: false };
  };
  const pressHandle = (e: React.PointerEvent, el: DeckElement, mode: Handle) => {
    e.stopPropagation(); e.preventDefault();
    drag.current = { mode, x0: e.clientX, y0: e.clientY, orig: el, before: deck, moved: false };
  };
  const pressCanvas = (e: React.PointerEvent) => {
    e.stopPropagation();
    stopEditing();
    const p = toCanvas(e);
    const base = e.shiftKey ? sel : [];
    setSel(base);
    drag.current = { mode: "marquee", cx: p.x, cy: p.y, base };
  };

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current; if (!d) return;
      if (d.mode === "marquee") {
        const p = toCanvas(e);
        const r = { x: Math.min(d.cx, p.x), y: Math.min(d.cy, p.y), w: Math.abs(p.x - d.cx), h: Math.abs(p.y - d.cy) };
        setMarquee(r);
        const hit = deckRef.current.slides.find((s) => s.id === slide.id)?.els.filter((el) => intersects(bbox(el), r)).map((el) => el.id) ?? [];
        setSel([...new Set([...d.base, ...hit])]);
        return;
      }
      const dx = (e.clientX - d.x0) / scale, dy = (e.clientY - d.y0) / scale;
      if (!d.moved && Math.hypot(dx, dy) * scale < 3) return;
      d.moved = true;
      const free = e.altKey, thr = GUIDE_PX / scale;
      if (d.mode === "move") {
        const box = unionBox(d.origs.map(bbox));
        const moved = { ...box, x: box.x + dx, y: box.y + dy };
        const s = free ? { dx: 0, dy: 0, guides: [] as Guide[] } : snapBox(moved, snapTargets(slide.els, new Set(d.origs.map((o) => o.id))), thr);
        const gx = s.guides.some((g) => g.axis === "x") ? s.dx : free ? 0 : snap(moved.x, false) - moved.x;
        const gy = s.guides.some((g) => g.axis === "y") ? s.dy : free ? 0 : snap(moved.y, false) - moved.y;
        setGuides(s.guides);
        const byId = new Map(d.origs.map((o) => [o.id, o]));
        live((x) => mapSlide(x, (sl) => ({ ...sl, els: sl.els.map((el) => { const o = byId.get(el.id); return o ? { ...el, x: Math.round(o.x + dx + gx), y: Math.round(o.y + dy + gy) } : el; }) })));
        return;
      }
      // resizing: snap whichever edges (or line end) are moving
      const o = d.orig, t = snapTargets(slide.els, new Set([o.id]));
      const g: Guide[] = [];
      const sx = (v: number) => { if (free) return Math.round(v); const r = snapEdge(v, t.xs, thr); if (r.at !== null) { g.push({ axis: "x", at: r.at }); return r.v; } return snap(v, false); };
      const sy = (v: number) => { if (free) return Math.round(v); const r = snapEdge(v, t.ys, thr); if (r.at !== null) { g.push({ axis: "y", at: r.at }); return r.v; } return snap(v, false); };
      let patch: Partial<DeckElement>;
      if (d.mode === "p1") { const x = sx(o.x + dx), y = sy(o.y + dy); patch = { x, y, w: o.x + o.w - x, h: o.y + o.h - y }; }
      else if (d.mode === "p2") patch = { w: sx(o.x + o.w + dx) - o.x, h: sy(o.y + o.h + dy) - o.y };
      else {
        const m = d.mode, min = 20;
        let L = o.x, R = o.x + o.w, T = o.y, B = o.y + o.h;
        if (m.includes("w")) L = Math.min(sx(L + dx), R - min);
        if (m.includes("e")) R = Math.max(sx(R + dx), L + min);
        if (m === "n" || m === "ne" || m === "nw") T = Math.min(sy(T + dy), B - min);
        if (m === "s" || m === "se" || m === "sw") B = Math.max(sy(B + dy), T + min);
        if (o.kind === "image" && m.length === 2 && !e.shiftKey) {          // a picture keeps its shape from a corner (Shift to stretch)
          const k = Math.max((R - L) / o.w, (B - T) / o.h);
          const W = Math.round(o.w * k), H = Math.round(o.h * k);
          if (m.includes("w")) L = R - W; else R = L + W;
          if (m.includes("n")) T = B - H; else B = T + H;
        }
        patch = { x: L, y: T, w: R - L, h: B - T };
      }
      setGuides(g);
      live((x) => patchEl(x, o.id, patch));
    };
    const up = () => {
      const d = drag.current; drag.current = null;
      setGuides([]); setMarquee(null);
      if (d && d.mode !== "marquee" && d.moved) record(d.before);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  });   // eslint-disable-line react-hooks/exhaustive-deps -- deliberate: re-bound every render so it always sees the current slide and scale

  // ── keys ──
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea,select,[contenteditable],math-field")) return;
      if (question || equation) return;
      const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
      if (mod && k === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      if (mod && k === "y") { e.preventDefault(); redo(); return; }
      if (mod && k === "v") { e.preventDefault(); paste(); return; }
      if (mod && k === "a") { e.preventDefault(); setSel(slide.els.map((x) => x.id)); return; }
      if (chosen.length) {
        if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); deleteSel(); }
        else if (mod && k === "d") { e.preventDefault(); duplicateSel(); }
        else if (mod && k === "c") { e.preventDefault(); copy({ els: chosen }); }
        else if (e.key === "Escape") setSel([]);
        else if (e.key === "Enter" && one?.kind === "text") { e.preventDefault(); startEditing(one.id); }
        else if (e.key.startsWith("Arrow")) {
          e.preventDefault();
          const step = e.shiftKey ? 1 : SNAP;
          const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0, dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
          setSlide((s) => ({ ...s, els: s.els.map((el) => (selSet.has(el.id) ? { ...el, x: el.x + dx, y: el.y + dy } : el)) }));
        }
      } else if (e.key === "PageDown") goSlide(si + 1);
      else if (e.key === "PageUp") goSlide(si - 1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });   // eslint-disable-line react-hooks/exhaustive-deps -- deliberate: re-bound every render so it always sees the current slide and selection

  const handles = (el: DeckElement) => {
    const pts = el.kind === "line"
      ? [["p1", el.x, el.y], ["p2", el.x + el.w, el.y + el.h]] as const
      : ([["nw", 0, 0], ["n", 0.5, 0], ["ne", 1, 0], ["e", 1, 0.5], ["se", 1, 1], ["s", 0.5, 1], ["sw", 0, 1], ["w", 0, 0.5]] as const).map(([m, fx, fy]) => [m, el.x + el.w * fx, el.y + el.h * fy] as const);
    const r = 8 / scale;
    return pts.map(([m, x, y]) => (
      <div key={m} onPointerDown={(e) => pressHandle(e, el, m)}
        style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: 999, background: "white", border: `${2 / scale}px solid #2563eb`, cursor: m === "p1" || m === "p2" ? "crosshair" : `${m}-resize`, zIndex: 10 }} />
    ));
  };

  const hist = { canUndo: past.current.length > 0, canRedo: future.current.length > 0 };
  const isBuilt = !!builtDeck(deck.id);
  const group = chosen.length > 1 ? unionBox(chosen.map(bbox)) : null;
  const on = (b: boolean) => (b ? "!bg-slate-800 !text-white" : "");

  const alignRow = (
    <>
      <Label>{chosen.length > 1 ? "Line up the selection" : "Line up on the slide"}</Label>
      <div className="flex flex-wrap gap-1">
        {([["left", <AlignStartVertical size={14} />, "Left edges"], ["centre", <AlignCenterVertical size={14} />, "Centres (across)"], ["right", <AlignEndVertical size={14} />, "Right edges"],
          ["top", <AlignStartHorizontal size={14} />, "Tops"], ["middle", <AlignCenterHorizontal size={14} />, "Middles (down)"], ["bottom", <AlignEndHorizontal size={14} />, "Bottoms"]] as const).map(([how, icon, title]) => (
          <button key={how} className={small} title={title} onClick={() => doAlign(how)}>{icon}</button>
        ))}
        {chosen.length > 2 && <>
          <button className={small} title="Space evenly across" onClick={() => doDistribute("x")}><AlignHorizontalDistributeCenter size={14} /></button>
          <button className={small} title="Space evenly down" onClick={() => doDistribute("y")}><AlignVerticalDistributeCenter size={14} /></button>
        </>}
      </div>
      <Label>Layer</Label>
      <div className="flex flex-wrap gap-1">
        <button className={small} onClick={() => layer("front")}><ChevronsUp size={12} />Front</button>
        <button className={small} onClick={() => layer("up")}><ArrowUp size={12} />Forward</button>
        <button className={small} onClick={() => layer("down")}><ArrowDown size={12} />Back</button>
        <button className={small} onClick={() => layer("back")}><ChevronsDown size={12} />Behind all</button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen flex-col bg-[#f8f9fb]">
      {/* top bar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-white px-3 py-2">
        <input value={deck.title} onChange={(e) => apply((d) => ({ ...d, title: e.target.value }))} className="w-52 rounded-lg px-2 py-1 text-lg font-semibold text-slate-900 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Deck title" />
        <span className="mx-1 h-6 w-px bg-slate-200" />
        {ADD.map((a) => <button key={a.label} className={toolBtn} onClick={a.run} title={`Add ${a.label.toLowerCase()}`}>{a.icon}<span className="hidden 2xl:inline">{a.label}</span></button>)}
        <button className={toolBtn} onClick={() => fileRef.current?.click()} title="Add an image"><ImageIcon size={16} /><span className="hidden 2xl:inline">Image</span></button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { void onImage(e.target.files?.[0]); e.target.value = ""; }} />
        <span className="mx-1 h-6 w-px bg-slate-200" />
        <button className={toolBtn} onClick={undo} disabled={!hist.canUndo} title="Undo (Ctrl+Z)"><Undo2 size={16} /></button>
        <button className={toolBtn} onClick={redo} disabled={!hist.canRedo} title="Redo (Ctrl+Shift+Z)"><Redo2 size={16} /></button>
        <span className="ml-auto mr-2 text-right text-xs leading-tight text-slate-500">{status}{cloud.message && <span className={`block ${cloud.mode === "error" ? "text-red-600" : cloud.mode === "shared" ? "text-emerald-700" : "text-slate-400"}`}>{cloud.message}</span>}</span>
        <button className={toolBtn} onClick={exportDeck} title="Download this deck as a file"><Download size={16} /><span className="hidden xl:inline">Export</span></button>
        <button className={toolBtn} onClick={() => importRef.current?.click()} title="Add the slides from a deck file"><Upload size={16} /><span className="hidden xl:inline">Import slides</span></button>
        <input ref={importRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => { void importSlides(e.target.files?.[0]); e.target.value = ""; }} />
        <button className={toolBtn} onClick={() => { if (window.confirm(isBuilt ? "Put this deck back to the original? Your changes on this device are lost." : "Delete this deck from this device?")) { resetDeck(deck.id); window.location.href = isBuilt ? `/decks/${deck.id}` : "/decks"; } }}
          title={isBuilt ? "Back to the original deck" : "Delete this deck"}>{isBuilt ? <RotateCcw size={16} /> : <Trash2 size={16} />}<span className="hidden xl:inline">{isBuilt ? "Reset" : "Delete"}</span></button>
        <button onClick={() => { stopEditing(); onPresent(deckRef.current, si); }} className="ml-1 inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-900 px-3 text-sm font-semibold text-white hover:bg-blue-800"><Play size={16} />Present</button>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* slide strip */}
        <div className="w-56 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-2">
          {deck.slides.map((s, i) => (
            <div key={s.id} role="button" tabIndex={0} onClick={() => goSlide(i)} onKeyDown={(e) => { if (e.key === "Enter") goSlide(i); }} className={`mb-2 block w-full cursor-pointer rounded-lg p-1 text-left ${i === si ? "ring-2 ring-blue-500" : "hover:bg-slate-50"}`}>
              <div className="flex items-start gap-1">
                <span className="w-4 pt-0.5 text-[10px] text-slate-400">{i + 1}</span>
                <div className="overflow-hidden rounded border border-slate-200"><SlideCanvas key={`${s.id}-${bankVersion}`} slide={s} scale={0.115} /></div>
              </div>
            </div>
          ))}
          <div className="relative mt-1">
            <button className={`${small} w-full justify-center py-2`} onClick={() => setLayoutMenu((v) => !v)}><Plus size={14} />Add slide</button>
            {layoutMenu && (
              <div className="absolute bottom-full left-0 z-20 mb-1 w-64 rounded-xl border border-slate-300 bg-white p-1 shadow-lift">
                {LAYOUTS.map((l) => (
                  <button key={l.key} onClick={() => addSlide(l.make(uid("slide")))} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-50">
                    <span className="h-2 w-2 rounded-full" style={{ background: FAMILY_STYLE[l.family].colour }} />{l.label}
                  </button>
                ))}
                <button onClick={paste} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-50"><Copy size={12} />Paste a copied slide</button>
              </div>
            )}
          </div>
        </div>

        {/* canvas */}
        <div ref={stageRef} className="flex min-w-0 flex-1 items-center justify-center p-2" onPointerDown={() => { stopEditing(); setSel([]); }}>
          <div ref={canvasRef} className="rounded-sm shadow-card" onPointerDown={pressCanvas}>
            <SlideCanvas key={`${slide.id}-${bankVersion}`} slide={slide} scale={scale} hidden={editing ? new Set([editing]) : undefined}>
              {slide.els.map((el) => {
                const b = bbox(el);
                const pad = el.kind === "line" ? 14 / scale : 0;
                const picked = selSet.has(el.id);
                return (
                  <div key={el.id} onPointerDown={(e) => pressElement(e, el)}
                    onDoubleClick={() => { if (el.kind === "text") startEditing(el.id); else if (el.kind === "maths") setEquation({ mode: "edit", id: el.id, latex: el.latex }); }}
                    style={{ position: "absolute", left: b.x - pad, top: b.y - pad, width: b.w + pad * 2, height: b.h + pad * 2, cursor: el.kind === "text" ? "text" : "move",
                      outline: picked ? `${2 / scale}px solid #2563eb` : undefined, outlineOffset: 2 / scale }}
                    className={picked ? "" : "hover:outline hover:outline-1 hover:outline-blue-300"} />
                );
              })}
              {editingEl && (
                <textarea ref={inlineRef} value={editingEl.text} spellCheck={false}
                  onPointerDown={(e) => e.stopPropagation()}
                  onChange={(e) => { caret.current = e.target.selectionStart; const text = e.target.value; live((d) => patchEl(d, editingEl.id, { text })); }}
                  onSelect={(e) => { caret.current = (e.target as HTMLTextAreaElement).selectionStart; }}
                  onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); stopEditing(); } }}
                  style={{ position: "absolute", left: editingEl.x, top: editingEl.y, width: editingEl.w, height: editingEl.h, fontSize: editingEl.size, lineHeight: 1.25,
                    fontWeight: editingEl.bold ? 600 : 400, color: editingEl.colour ?? INK, textAlign: editingEl.align ?? "left", fontFamily: "inherit",
                    background: "rgba(255,255,255,0.96)", outline: `${2 / scale}px solid #2563eb`, border: "none", resize: "none", padding: 0, margin: 0, overflow: "hidden", zIndex: 20 }} />
              )}
              {slide.els.filter((el) => (el.step ?? 0) > 0).map((el) => { const b = bbox(el); const r = 18 / scale; return (
                <div key={`step-${el.id}`} title={`Appears on click ${el.step}`} style={{ position: "absolute", left: b.x - r, top: b.y - r, width: r * 2, height: r * 2, borderRadius: 999, background: "#be185d", color: "white",
                  fontSize: 20 / scale, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 15 }}>{el.step}</div>); })}
              {one && !editing && handles(one)}
              {group && <div style={{ position: "absolute", left: group.x, top: group.y, width: group.w, height: group.h, outline: `${1.5 / scale}px dashed #2563eb`, pointerEvents: "none" }} />}
              {guides.map((g, i) => <div key={i} style={g.axis === "x"
                ? { position: "absolute", left: g.at - 1 / scale, top: 0, width: 2 / scale, height: CANVAS_H, background: "#db2777", pointerEvents: "none", zIndex: 30 }
                : { position: "absolute", top: g.at - 1 / scale, left: 0, height: 2 / scale, width: CANVAS_W, background: "#db2777", pointerEvents: "none", zIndex: 30 }} />)}
              {marquee && <div style={{ position: "absolute", left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h, background: "rgba(37,99,235,0.08)", outline: `${1.5 / scale}px solid #2563eb`, pointerEvents: "none" }} />}
            </SlideCanvas>
          </div>
        </div>

        {/* properties */}
        <div className="w-80 shrink-0 overflow-y-auto border-l border-slate-200 bg-white p-3 text-sm">
          {!chosen.length && (
            <>
              <div className="font-semibold text-slate-900">Slide {si + 1}</div>
              <Label>Title (for the slide list)</Label>
              <input value={slide.title} onChange={(e) => setSlide((s) => ({ ...s, title: e.target.value }))} className={input} />
              <Label>Kind of slide (its colour)</Label>
              <div className="flex flex-wrap gap-1">{(Object.keys(FAMILY_STYLE) as DeckFamily[]).map((f) => (
                <button key={f} onClick={() => setSlide((s) => ({ ...s, family: f }))} className={`${small} ${slide.family === f ? "ring-2 ring-blue-500" : ""}`}>
                  <span className="h-2 w-2 rounded-full" style={{ background: FAMILY_STYLE[f].colour }} />{FAMILY_STYLE[f].label}</button>))}</div>
              <Label>Slide</Label>
              <div className="flex flex-wrap gap-1">
                <button className={small} onClick={() => moveSlide(-1)} disabled={si === 0}><ArrowUp size={12} />Earlier</button>
                <button className={small} onClick={() => moveSlide(1)} disabled={si === deck.slides.length - 1}><ArrowDown size={12} />Later</button>
                <button className={small} onClick={() => addSlide(reIdSlide(slide))}><Copy size={12} />Duplicate</button>
                <button className={small} onClick={() => copy({ slide })}><Copy size={12} />Copy</button>
                <button className={small} onClick={deleteSlide} disabled={deck.slides.length < 2}><Trash2 size={12} />Delete</button>
              </div>
              <Label>Deck</Label>
              <textarea value={deck.summary} onChange={(e) => apply((d) => ({ ...d, summary: e.target.value }))} rows={3} className={input} placeholder="One sentence: what this lesson covers." />
              <p className="mt-4 text-xs leading-relaxed text-slate-500">Click something to select it (Shift-click to add more, or drag a box around several). Drag to move: pink guides show when edges or centres line up (hold Alt to place freely). Double-click text to type on the slide; double-click an equation to change it. Copy and paste works between slides and between decks.</p>
            </>
          )}
          {chosen.length > 1 && (
            <>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-slate-900">{chosen.length} selected</span>
                <button className={`${small} ml-auto`} onClick={duplicateSel} title="Duplicate (Ctrl+D)"><Copy size={12} /></button>
                <button className={small} onClick={deleteSel} title="Delete"><Trash2 size={12} /></button>
              </div>
              {alignRow}
            </>
          )}
          {one && (
            <>
              <div className="flex items-center gap-1">
                <span className="font-semibold capitalize text-slate-900">{one.kind === "practice" ? "Practice question" : one.kind === "maths" ? "Equation" : one.kind}</span>
                <button className={`${small} ml-auto`} onClick={duplicateSel} title="Duplicate (Ctrl+D)"><Copy size={12} /></button>
                <button className={small} onClick={deleteSel} title="Delete"><Trash2 size={12} /></button>
              </div>
              {one.kind === "text" && (
                <>
                  <Label>Text</Label>
                  <div className="flex flex-wrap gap-1">
                    <button className={small} onClick={() => startEditing(one.id)}><Type size={12} />Type on the slide</button>
                    <button className={small} onPointerDown={(e) => e.preventDefault()} onClick={() => setEquation({ mode: "insert", latex: "" })}><Sigma size={12} />Insert equation</button>
                  </div>
                  <textarea value={one.text} rows={4} onChange={(e) => setEl(one.id, { text: e.target.value })} className={`${input} mt-2 ${inlineErrors(one.text).length ? "border-red-400" : ""}`} />
                  {inlineErrors(one.text).map((er, i) => <div key={i} className="text-xs text-red-600">{er}</div>)}
                  <div className="mt-2 flex items-center gap-2">
                    <Num label="Size" value={one.size} min={MIN_TEXT} onChange={(size) => setEl(one.id, { size })} />
                    <button className={`${small} ${on(!!one.bold)}`} onClick={() => setEl(one.id, { bold: !one.bold })}>Bold</button>
                  </div>
                  {one.size < MIN_TEXT && <div className="mt-1 text-xs text-amber-700">Smaller than {MIN_TEXT}: hard to read from the back of the room.</div>}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(["left", "center", "right"] as const).map((a) => <button key={a} className={`${small} ${on((one.align ?? "left") === a)}`} onClick={() => setEl(one.id, { align: a })}>{a === "center" ? "Centre" : a[0].toUpperCase() + a.slice(1)}</button>)}
                    <button className={`${small} ${on(!!one.middle)}`} onClick={() => setEl(one.id, { middle: !one.middle })}>Middle</button>
                  </div>
                  <Label>Colour</Label><Swatches value={one.colour} onChange={(colour) => setEl(one.id, { colour: colour ?? INK })} />
                </>
              )}
              {one.kind === "maths" && (
                <>
                  <div className="mt-2 rounded-lg bg-slate-50 px-2 py-2 text-2xl"><MathRenderer latex={one.latex} /></div>
                  <button className={`${small} mt-2`} onClick={() => setEquation({ mode: "edit", id: one.id, latex: one.latex })}><Sigma size={12} />Edit equation</button>
                  <div className="mt-2"><Num label="Size" value={one.size} min={MIN_TEXT} onChange={(size) => setEl(one.id, { size })} /></div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(["left", "center", "right"] as const).map((a) => <button key={a} className={`${small} ${on((one.align ?? "center") === a)}`} onClick={() => setEl(one.id, { align: a })}>{a === "center" ? "Centre" : a[0].toUpperCase() + a.slice(1)}</button>)}
                  </div>
                  <Label>Colour</Label><Swatches value={one.colour} onChange={(colour) => setEl(one.id, { colour: colour ?? INK })} />
                </>
              )}
              {one.kind === "shape" && (
                <>
                  <Label>Shape</Label>
                  <div className="flex gap-1">{(["rect", "ellipse"] as const).map((s) => <button key={s} className={`${small} ${on(one.shape === s)}`} onClick={() => setEl(one.id, { shape: s })}>{s === "rect" ? "Rectangle" : "Ellipse"}</button>)}</div>
                  <Label>Fill</Label><Swatches value={one.fill} none onChange={(fill) => setEl(one.id, { fill })} />
                  <Label>Outline</Label><Swatches value={one.stroke} none onChange={(stroke) => setEl(one.id, { stroke })} />
                  <div className="mt-2 flex gap-2"><Num label="Outline" value={one.strokeWidth ?? 4} min={0} onChange={(strokeWidth) => setEl(one.id, { strokeWidth })} />
                    {one.shape === "rect" && <Num label="Corners" value={one.radius ?? 0} min={0} onChange={(radius) => setEl(one.id, { radius })} />}</div>
                </>
              )}
              {one.kind === "line" && (
                <>
                  <Label>Colour</Label><Swatches value={one.colour} onChange={(colour) => setEl(one.id, { colour: colour ?? INK })} />
                  <div className="mt-2 flex items-center gap-2"><Num label="Thickness" value={one.width ?? 6} min={1} onChange={(width) => setEl(one.id, { width })} />
                    <button className={`${small} ${on(!!one.arrow)}`} onClick={() => setEl(one.id, { arrow: !one.arrow })}>Arrowhead</button></div>
                </>
              )}
              {one.kind === "image" && <p className="mt-2 text-xs text-slate-500">Drag a corner to resize; the picture keeps its shape (hold Shift to stretch it).</p>}
              {one.kind === "board" && <BoardProps el={one} set={(p) => setEl(one.id, p)} />}
              {one.kind === "practice" && <PracticeProps el={one} set={(p) => setEl(one.id, p)} onEditQuestion={(q, add) => setQuestion({ q, add })} />}
              {one.kind === "depth" && <DepthProps el={one} set={(p) => setEl(one.id, p)} />}
              {one.kind === "grid" && <GridProps el={one} set={(p) => setEl(one.id, p)} onEditQuestion={(q, add) => setQuestion({ q, add })} />}
              <Label>Appears when presenting</Label>
              <select value={one.step ?? 0} onChange={(e) => setEl(one.id, { step: Number(e.target.value) || undefined })} className={input}>
                <option value={0}>With the slide</option>
                {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>On click {n}</option>)}
              </select>
              {alignRow}
              <Label>Position and size</Label>
              <div className="grid grid-cols-2 gap-1">
                <Num label="X" value={one.x} onChange={(x) => setEl(one.id, { x })} /><Num label="Y" value={one.y} onChange={(y) => setEl(one.id, { y })} />
                <Num label="W" value={one.w} onChange={(ww) => setEl(one.id, { w: ww })} /><Num label="H" value={one.h} onChange={(h) => setEl(one.id, { h })} />
              </div>
            </>
          )}
        </div>
      </div>

      {question && (
        <QuestionEditor start={question.q} onClose={() => { setQuestion(null); setBankVersion((v) => v + 1); }}
          onSave={(q) => {
            setStatus(saveQuestion(q) ? "Question saved on this device" : "Not saved: storage is full");
            if (question.add && (one?.kind === "practice" || one?.kind === "grid")) setEl(one.id, { bank: [...one.bank, q.id] });
            setQuestion(null); setBankVersion((v) => v + 1);
          }} />
      )}
      {equation && (
        <EquationEditor initial={equation.latex} title={equation.mode === "edit" ? "Edit equation" : "Equation"} action={equation.mode === "insert" ? "Insert" : equation.mode === "new" ? "Add to slide" : "Done"}
          onClose={() => { setEquation(null); if (editing) requestAnimationFrame(() => inlineRef.current?.focus()); }}
          onDone={(latex) => {
            if (equation.mode === "new") addEls([{ id: uid(slide.id), kind: "maths", latex, size: 72, ...centre(800, 160) }]);
            else if (equation.mode === "edit" && equation.id) setEl(equation.id, { latex });
            else insertMaths(latex);
            setEquation(null);
          }} />
      )}
    </div>
  );
}
