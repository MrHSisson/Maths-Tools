import { DECK_PAGE } from "./theme";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  AlignCenterHorizontal, AlignCenterVertical, AlignEndHorizontal, AlignEndVertical, AlignHorizontalDistributeCenter, AlignStartHorizontal, AlignStartVertical,
  AlignVerticalDistributeCenter, ArrowDown, ArrowUp, ChevronsDown, ChevronsUp, Circle, Copy, Download, Image as ImageIcon, Minus, MoveUpRight,
  AlignCenter, AlignLeft, AlignRight, ArrowLeft, Bold, BookOpen, ChevronLeft, ChevronRight, Clipboard, ClipboardPaste, Dices, Globe, Keyboard, Layers, LayoutGrid, ListTree, MessagesSquare,
  BarChartHorizontal, FileText, PaintBucket, PanelLeft, PanelRight, Pencil, Play, Plus, Redo2, RotateCcw, Shapes, Sigma, Square, Table2, Trash2, Type, Undo2, Upload,
} from "lucide-react";
import { MathRenderer } from "../shared/components/MathRenderer";
import { loadKaTeX } from "../shared/katex";
import { useLayoutMode } from "../shared/layoutMode";
import { useCloudState } from "./cloud";
import { fetchPublishedIndex, publishDeck, unpublishDeck, type PublishedEntry } from "./published";
import { LessonMap } from "./LessonMap";
import { EquationEditor } from "./EquationEditor";
import { GeneratorDialog, type GeneratorElement } from "./GeneratorDialog";
import { WorksheetsDialog, SheetProps } from "./WorksheetsDialog";
import { MAX_PINNED, nextSheetTitle, pinnedSheets } from "./worksheets";
import { BarProps, BoardProps, GeneratorProps, RatioTableProps, Label, Num, SNAP, Swatches, inlineErrors, input, readImage, reId, reIdSlide, small, snap, toolBtn, uid } from "./EditorPanels";
import { BarDivider, Menu, MenuDivider, MenuHeading, MenuItem, ObjectList, ShortcutsDialog, KIND_NAME, Section, SlideStrip, Splitter, usePref } from "./EditorChrome";
import { GENERATOR_TOOLS } from "./generators";
import { align, bbox, distribute, intersects, moveIndex, snapBox, snapEdge, snapTargets, unionBox, type AlignHow, type Guide, type Rect } from "./geometry";
import { INK, LAYOUTS } from "./layouts";
import { SlideCanvas } from "./SlideCanvas";
import { QuestionWorkspace } from "./QuestionWorkspace";
import { legacyItems, materializeDeck } from "./questions";
import { withBriefs } from "./questionBrief";
import { bankQuestion, builtDeck, resetDeck, saveDeck } from "./store";
import { CANVAS_H, CANVAS_W, FAMILY_STYLE, MIN_TEXT, type CuratedQuestion, type DeckDef, type DeckElement, type DeckFamily, type Slide } from "./types";

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
const PIECE_NOTE: Record<string, string> = {
  Board: "A table to fill in live, with Filled in / Structure only / Blank.",
  "Ratio table": "Quantities across the top, a row per step, the factor between rows; Filled in / Structure only / Blank, or one row per click.",
  "Bar model": "Boxes in coloured parts with braces for the parts and the total; Filled in / Structure only / Blank, or one step per click.",
  "Depth question": "A curated question with named wrong answers, drawn flat on the slide.",
  "Question grid": "Several hand-picked questions at once, for mini whiteboards.",
  "Generator question": "The tool's generator live: New question, answer and working.",
  "Book activity": "A numbered set of generated questions.",
  "Skill practice": "Write a fixed set of questions for this slide’s skill.",
};
const GUIDE_PX = 7;                                    // how close (on screen) an edge must come to a guide to snap to it

type Handle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "p1" | "p2";
type Drag =
  | { mode: "move"; x0: number; y0: number; origs: DeckElement[]; before: DeckDef; moved: boolean }
  | { mode: Handle; x0: number; y0: number; orig: DeckElement; before: DeckDef; moved: boolean }
  | { mode: "marquee"; cx: number; cy: number; base: string[] };

type Clip = { els?: DeckElement[]; el?: DeckElement; slide?: Slide };

export function Editor(props: { start: DeckDef; startIndex: number; onPresent: (deck: DeckDef, index: number) => void }) {
  const [ready, setReady] = useState<DeckDef | null>(null);
  const [problem, setProblem] = useState("");
  useEffect(() => { let active = true; void materializeDeck(props.start, bankQuestion).then((d) => { if (active) setReady(withBriefs(d)); }).catch(() => { if (active) setProblem("The questions could not be prepared. Reload to retry; the saved deck has not changed."); }); return () => { active = false; }; }, [props.start]);
  if (!ready) return <div className="p-8" role="status">{problem || "Preparing your deck’s question copies…"}</div>;
  return <EditorInner {...props} start={ready} />;
}

function EditorInner({ start, startIndex, onPresent }: { start: DeckDef; startIndex: number; onPresent: (deck: DeckDef, index: number) => void }) {
  const [deck, setDeck] = useState(start);
  const [si, setSi] = useState(Math.min(startIndex, start.slides.length - 1));
  const [sel, setSel] = useState<string[]>([]);
  const [editing, setEditing] = useState<string | null>(null);          // the text box being typed into on the slide
  const [guides, setGuides] = useState<Guide[]>([]);
  const [marquee, setMarquee] = useState<Rect | null>(null);
  const [status, setStatus] = useState("");
  const [lessonMap, setLessonMap] = useState(false);
  const [keys, setKeys] = useState(false);                              // the keyboard shortcuts window
  const [sheetsOpen, setSheetsOpen] = useState(false);                  // File → Worksheets
  const [question, setQuestion] = useState<{ id: string; items: CuratedQuestion[]; grid: boolean } | null>(null);
  const [equation, setEquation] = useState<{ mode: "new" | "edit" | "insert"; id?: string; latex: string } | null>(null);
  const [generator, setGenerator] = useState<GeneratorElement | null>(null);
  const [bankVersion, setBankVersion] = useState(0);
  const [leftPref, setLeftPref] = usePref("left-open", true);          // panel sizes and views are remembered on this device
  const [rightPref, setRightPref] = usePref("right-open", true);
  // On a phone the slide gets the screen: both panels start shut and only one opens at a time (not remembered).
  const { phone } = useLayoutMode();
  const [phonePanel, setPhonePanel] = useState<"left" | "right" | null>(null);
  const leftOpen = phone ? phonePanel === "left" : leftPref, rightOpen = phone ? phonePanel === "right" : rightPref;
  const setLeftOpen = (v: boolean) => (phone ? setPhonePanel(v ? "left" : null) : setLeftPref(v));
  const setRightOpen = (v: boolean) => (phone ? setPhonePanel(v ? "right" : null) : setRightPref(v));
  const [leftW, setLeftW] = usePref("left-w", 240);
  const [rightW, setRightW] = usePref("right-w", 320);
  const [stripView, setStripView] = usePref<"thumbs" | "list">("strip-view", "thumbs");
  const [scale, setScale] = useState(0.5);
  const [, setHist] = useState(0);
  const cloud = useCloudState();
  const [published, setPublished] = useState<PublishedEntry | null | undefined>(undefined);   // undefined: not known (no connection)
  const [publishNote, setPublishNote] = useState("");
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
  const patchEl = (d: DeckDef, id: string, patch: Partial<DeckElement>): DeckDef => ({ ...d, slides: d.slides.map((s) => s.els.some((e) => e.id === id) ? { ...s, els: s.els.map((e) => e.id === id ? ({ ...e, ...patch } as DeckElement) : e) } : s) });
  const setEl = (id: string, patch: Partial<DeckElement>) => apply((d) => patchEl(d, id, patch));
  const addEls = (els: DeckElement[]) => { setSlide((s) => ({ ...s, els: [...s.els, ...els] })); setSel(els.map((e) => e.id)); const g = els.find((e) => e.kind === "generator" || e.kind === "worksheet"); if (g) setGenerator(g as GeneratorElement); };
  const openQuestions = async (el: DeckElement) => {
    stopEditing();
    if (el.kind === "questions") setQuestion({ id: el.id, items: el.items, grid: false });
    else if (el.kind === "grid") setQuestion({ id: el.id, items: legacyItems(el, bankQuestion), grid: true });
    else if (el.kind === "practice" || el.kind === "depth") {
      const prepared = await materializeDeck({ ...deckRef.current, slides: [{ ...slide, els: [el] }] }, bankQuestion);
      const next = prepared.slides[0].els[0];
      if (next.kind === "questions") { setEl(el.id, next); setQuestion({ id: el.id, items: next.items, grid: false }); }
    }
  };
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
  const addSlide = (s0: Slide) => { const s: Slide = { ...s0, els: s0.els.map((e) => (e.kind === "worksheet" && e.pin ? { ...e, pin: { ...e.pin, title: nextSheetTitle(deckRef.current) } } : e)) }; stopEditing(); apply((d) => ({ ...d, slides: [...d.slides.slice(0, si + 1), s, ...d.slides.slice(si + 1)] })); setSi(si + 1); setSel([]); const g = s.els.find((e) => e.kind === "generator" || e.kind === "worksheet"); if (g) setGenerator(g as GeneratorElement); const q = s.els.find((e) => ["questions", "practice", "depth", "grid"].includes(e.kind)); if (q) void openQuestions(q); };
  const moveSlide = (d: number) => { const j = si + d; if (j < 0 || j >= deck.slides.length) return; apply((x) => { const ss = [...x.slides]; [ss[si], ss[j]] = [ss[j], ss[si]]; return { ...x, slides: ss }; }); setSi(j); };
  const deleteAt = (i: number) => { if (deck.slides.length < 2) return; stopEditing(); apply((d) => ({ ...d, slides: d.slides.filter((_, k) => k !== i) })); setSi(i <= si ? Math.max(0, si - 1) : si); setSel([]); };
  const duplicateAt = (i: number) => { stopEditing(); apply((d) => ({ ...d, slides: [...d.slides.slice(0, i + 1), reIdSlide(d.slides[i]), ...d.slides.slice(i + 1)] })); setSi(i + 1); setSel([]); };
  /** Drag in the slide strip: the open slide stays open wherever it ends up. */
  const reorderSlide = (from: number, to: number) => { const next = moveIndex(deck.slides, from, to); apply((d) => ({ ...d, slides: moveIndex(d.slides, from, to) })); setSi(next.findIndex((s) => s.id === slide.id)); };
  /** From the list of what is on the slide: select it (Shift adds or removes). */
  const pickFromList = (id: string, add: boolean) => { stopEditing(); setSel((cur) => (add ? (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]) : [id])); };
  /** One layer step for one element, from the list (+1 is nearer the front). */
  const layerOne = (id: string, dir: 1 | -1) => setSlide((s) => {
    const i = s.els.findIndex((e) => e.id === id), j = i + dir;
    return i < 0 || j < 0 || j >= s.els.length ? s : { ...s, els: moveIndex(s.els, i, j) };
  });

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
  const BASIC: { label: string; icon: ReactNode; note?: string; run: () => void }[] = [
    { label: "Text", icon: <Type size={16} />, note: "A text box, ready to type into", run: addText },
    { label: "Equation", icon: <Sigma size={16} />, note: "Fractions, powers, roots: built visually", run: () => setEquation({ mode: "new", latex: "" }) },
    { label: "Image", icon: <ImageIcon size={16} />, note: "A picture from a file (or paste or drop one onto the slide)", run: () => fileRef.current?.click() },
  ];
  const SHAPES: { label: string; icon: ReactNode; note?: string; run: () => void }[] = [
    { label: "Rectangle", icon: <Square size={16} />, run: () => addEls([{ id: uid(slide.id), kind: "shape", shape: "rect", ...centre(400, 250), fill: "#dbeafe", stroke: "#1e3a8a", strokeWidth: 4, radius: 16 }]) },
    { label: "Ellipse", icon: <Circle size={16} />, run: () => addEls([{ id: uid(slide.id), kind: "shape", shape: "ellipse", ...centre(300, 300), fill: "#ede9fe", stroke: "#7c3aed", strokeWidth: 4 }]) },
    { label: "Line", icon: <Minus size={16} />, run: () => addEls([{ id: uid(slide.id), kind: "line", x: 600, y: 450, w: 400, h: 0, colour: INK, width: 6 }]) },
    { label: "Arrow", icon: <MoveUpRight size={16} />, run: () => addEls([{ id: uid(slide.id), kind: "line", x: 600, y: 450, w: 400, h: 0, colour: INK, width: 6, arrow: true }]) },
  ];
  const PIECES: { label: string; icon: ReactNode; note?: string; run: () => void }[] = [
    { label: "Skill practice", icon: <MessagesSquare size={16} />, run: () => { const el: DeckElement = { id: uid(slide.id), kind: "questions", x: 24, y: 24, w: 1552, h: 852, items: [] }; addEls([el]); setQuestion({ id: el.id, items: [], grid: false }); } },
    { label: "Question grid", icon: <LayoutGrid size={16} />, run: () => { const el: DeckElement = { id: uid(slide.id), kind: "grid", x: 100, y: 190, w: 1400, h: 660, bank: [], items: [], cols: 2 }; addEls([el]); setQuestion({ id: el.id, items: [], grid: true }); } },
    { label: "Generator question", icon: <Dices size={16} />, run: () => addEls([{ id: uid(slide.id), kind: "generator", x: 24, y: 24, w: 1552, h: 852, tool: deck.tool ?? GENERATOR_TOOLS[0][0], preset: { level: "level1" }, seed: 1 }]) },
    { label: "Book activity", icon: <BookOpen size={16} />, run: () => addEls([{ id: uid(slide.id), kind: "worksheet", x: 100, y: 170, w: 1400, h: 690, tool: deck.tool ?? GENERATOR_TOOLS[0][0], preset: { level: "level1" }, count: 12, cols: 3, seed: 1 }]) },
    { label: "Ratio table", icon: <Table2 size={16} />, note: "Quantities across the top, a row per step, the factor between rows.", run: () => addEls([{ id: uid(slide.id), kind: "ratioTable", ...centre(1000, 420), table: { headers: ["Red", "Blue"], given: 1, rows: [["3", "2"], ["6", "4"], ["12", "8"]], operations: ["\\times 2", "\\times 2"] }, fill: "filled", size: 56 }]) },
    { label: "Bar model", icon: <BarChartHorizontal size={16} />, note: "Boxes in coloured parts, with braces for the parts and the total.", run: () => addEls([{ id: uid(slide.id), kind: "bar", ...centre(1200, 420), bar: { parts: [], rows: [{ name: "Red", units: 3 }, { name: "Blue", units: 2 }], sideBrace: { label: "total: 5 parts" } }, fill: "filled", size: 64 }]) },
    { label: "Board", icon: <Table2 size={16} />, run: () => addEls([{ id: uid(slide.id), kind: "board", ...centre(1000, 400), grid: { head: ["", ""], given: 1, rows: [["", ""], ["", ""], ["", ""]] }, fill: "filled", size: 46 }]) },
  ];


  const onImage = async (file: File | undefined) => {
    if (!file) return;
    try {
      const img = await readImage(file);
      const k = Math.min(1, 800 / img.w, 600 / img.h);
      addEls([{ id: uid(slide.id), kind: "image", src: img.src, ...centre(Math.round(img.w * k), Math.round(img.h * k)) }]);
    } catch { setStatus("That file could not be read as an image"); }
  };

  const exportDeck = async () => {
    const portable = await materializeDeck(deckRef.current, bankQuestion);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(portable, null, 2)], { type: "application/json" }));
    a.download = `${deck.id}.deck.json`; a.click(); URL.revokeObjectURL(a.href);
  };
  useEffect(() => { let on = true; void fetchPublishedIndex().then((d) => { if (on) setPublished(d ? d[start.id] ?? null : undefined); }); return () => { on = false; }; }, [start.id]);
  const publish = async () => {
    setPublishNote("Publishing…");
    const portable = await materializeDeck(deckRef.current, bankQuestion);
    const result = await publishDeck({ ...portable, updatedAt: new Date().toISOString() });
    if (result.ok) { setPublished(result.entry ?? null); setPublishNote(`Published: ${portable.slides.length} slides, read-only for everyone`); }
    else setPublishNote(`Not published: ${result.message}`);
  };
  const unpublish = async () => {
    const result = await unpublishDeck(deckRef.current.id);
    if (result.ok) { setPublished(null); setPublishNote("Taken down: no longer published"); } else setPublishNote(`Not taken down: ${result.message}`);
  };
  const importSlides = async (file: File | undefined) => {
    if (!file) return;
    try {
      const raw = JSON.parse(await file.text()) as DeckDef;
      if (!Array.isArray(raw.slides) || !raw.slides.every((s) => Array.isArray(s.els) && typeof s.family === "string" && s.family in FAMILY_STYLE)) throw new Error();
      const d = withBriefs(await materializeDeck(raw, bankQuestion));
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
      if (question || equation || generator || keys || lessonMap) return;
      const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
      if (mod && k === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      if (mod && k === "y") { e.preventDefault(); redo(); return; }
      if (e.key === "?" && !mod) { e.preventDefault(); setKeys(true); return; }
      if (e.key === "\\" && !mod) { e.preventDefault(); const show = !(leftOpen || rightOpen); setLeftOpen(show); setRightOpen(show); return; }
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

  // Paste: a picture on the clipboard (a screenshot, a copied image) becomes an image element; otherwise the copied elements or slide.
  // This is the paste event, not the Ctrl+V key, so the browser hands over the clipboard's files.
  useEffect(() => {
    const h = (e: ClipboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea,select,[contenteditable],math-field")) return;
      if (question || equation) return;
      const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith("image/"));
      e.preventDefault();
      if (file) void onImage(file); else paste();
    };
    window.addEventListener("paste", h);
    return () => window.removeEventListener("paste", h);
  });   // eslint-disable-line react-hooks/exhaustive-deps -- deliberate: re-bound every render so it always sees the current slide

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

  const present = () => { stopEditing(); onPresent(deckRef.current, si); };
  const openThread = () => { stopEditing(); setLessonMap(true); };
  /** The layouts a new slide can start from, grouped by kind (New slide in the toolbar, Add slide under the strip). */
  const slideLayouts = (close: () => void) => (
    <>
      <div><MenuHeading colour="#1e3a8a">Questions</MenuHeading>{LAYOUTS.filter((l) => l.group === "Questions").map((l) => <MenuItem key={l.key} label={l.label} note={l.use} onClick={() => { close(); addSlide(l.make(uid("slide"))); }} />)}</div>
      {(Object.keys(FAMILY_STYLE) as DeckFamily[]).filter((f) => LAYOUTS.some((l) => !l.group && l.family === f)).map((f) => (
        <div key={f}><MenuHeading colour={FAMILY_STYLE[f].colour}>{FAMILY_STYLE[f].label}</MenuHeading>
          {LAYOUTS.filter((l) => !l.group && l.family === f).map((l) => <MenuItem key={l.key} label={l.label} note={l.use} onClick={() => { close(); addSlide(l.make(uid("slide"))); }} />)}</div>
      ))}
      <MenuDivider /><MenuItem icon={<ClipboardPaste size={14} />} label="Paste a copied slide" onClick={() => { close(); paste(); }} />
    </>
  );
  const iconOn = (b: boolean) => (b ? "!bg-blue-50 !text-blue-800 ring-1 ring-blue-200" : "");
  const colourMenu = (label: string, value: string | undefined, onChange: (c: string | undefined) => void, none = false, icon?: ReactNode) => (
    <Menu label={label} title={label} button={<>{icon}<span className="h-4 w-4 rounded border border-slate-300" style={{ background: value ?? "transparent" }} /></>}>
      {() => <div className="p-2"><div className="mb-1.5 text-xs font-semibold text-slate-500">{label}</div><Swatches value={value} none={none} onChange={onChange} /></div>}
    </Menu>
  );
  const sizeField = (value: number, onChange: (n: number) => void) => (
    <div className="flex h-9 shrink-0 items-center rounded-lg border border-slate-300" title="Text size">
      <button className="h-full rounded-l-lg px-1.5 text-slate-600 hover:bg-slate-100" aria-label="Smaller" onClick={() => onChange(Math.max(MIN_TEXT, value - 4))}><Minus size={14} /></button>
      <input type="number" aria-label="Size" value={Math.round(value)} min={MIN_TEXT} onChange={(e) => { const n = Number(e.target.value); if (Number.isFinite(n) && n > 0) onChange(n); }}
        className={`h-full w-11 border-x border-slate-200 text-center text-sm tabular-nums focus:outline-none ${value < MIN_TEXT ? "text-amber-700" : "text-slate-800"}`} />
      <button className="h-full rounded-r-lg px-1.5 text-slate-600 hover:bg-slate-100" aria-label="Bigger" onClick={() => onChange(value + 4)}><Plus size={14} /></button>
    </div>
  );
  const alignButtons = (value: "left" | "center" | "right", onChange: (a: "left" | "center" | "right") => void) =>
    ([["left", <AlignLeft size={16} />, "Align left"], ["center", <AlignCenter size={16} />, "Centre"], ["right", <AlignRight size={16} />, "Align right"]] as const).map(([a, icon, t]) => (
      <button key={a} className={`${toolBtn} ${iconOn(value === a)}`} title={t} aria-label={t} aria-pressed={value === a} onClick={() => onChange(a)}>{icon}</button>
    ));
  /** The quick controls for what is selected; the full set stays in the properties panel. */
  const quick = one && (
    <div className="flex shrink-0 items-center gap-0.5">
      <span className="mr-1 hidden whitespace-nowrap rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 xl:inline">{KIND_NAME[one.kind] ?? one.kind}</span>
      {one.kind === "text" && <>
        {sizeField(one.size, (size) => setEl(one.id, { size, fixed: true }))}
        <button className={`${toolBtn} ${iconOn(!!one.bold)}`} title="Bold" aria-label="Bold" aria-pressed={!!one.bold} onClick={() => setEl(one.id, { bold: !one.bold })}><Bold size={16} /></button>
        {alignButtons(one.align ?? "left", (a) => setEl(one.id, { align: a }))}
        {colourMenu("Text colour", one.colour ?? INK, (colour) => setEl(one.id, { colour: colour ?? INK }))}
      </>}
      {one.kind === "maths" && <>
        <button className={toolBtn} onClick={() => setEquation({ mode: "edit", id: one.id, latex: one.latex })}><Sigma size={16} />Edit</button>
        {sizeField(one.size, (size) => setEl(one.id, { size }))}
        {alignButtons(one.align ?? "center", (a) => setEl(one.id, { align: a }))}
        {colourMenu("Colour", one.colour ?? INK, (colour) => setEl(one.id, { colour: colour ?? INK }))}
      </>}
      {one.kind === "shape" && <>
        {colourMenu("Fill", one.fill, (fill) => setEl(one.id, { fill }), true, <PaintBucket size={16} />)}
        {colourMenu("Outline", one.stroke, (stroke) => setEl(one.id, { stroke }), true, <Square size={16} />)}
      </>}
      {one.kind === "line" && <>
        {colourMenu("Colour", one.colour ?? INK, (colour) => setEl(one.id, { colour: colour ?? INK }))}
        <button className={`${toolBtn} ${iconOn(!!one.arrow)}`} title="Arrowhead" aria-label="Arrowhead" aria-pressed={!!one.arrow} onClick={() => setEl(one.id, { arrow: !one.arrow })}><MoveUpRight size={16} /></button>
      </>}
      {(one.kind === "questions" || one.kind === "practice" || one.kind === "depth" || one.kind === "grid") && <button className={toolBtn} onClick={() => { void openQuestions(one); }}><Pencil size={16} />Edit questions</button>}
      {(one.kind === "generator" || one.kind === "worksheet") && <button className={toolBtn} onClick={() => { stopEditing(); setGenerator(one); }}><Dices size={16} />Configure</button>}
    </div>
  );
  const many = chosen.length > 1 && <span className="mr-1 whitespace-nowrap rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{chosen.length} selected</span>;

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
    <div className="flex h-screen flex-col" style={{ background: DECK_PAGE }}>
      {/* header: back, the deck's name, the menus, Lesson thread and Present */}
      <div className="flex items-center gap-1 border-b border-slate-200 bg-white px-2 py-1.5 sm:px-3">
        <a href="/decks" title="All decks" aria-label="All decks" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><ArrowLeft size={18} /></a>
        <div className="flex min-w-0 flex-col">
          <input value={deck.title} onChange={(e) => apply((d) => ({ ...d, title: e.target.value }))} size={Math.max(8, Math.min(32, deck.title.length + 1))}
            className="min-w-0 rounded-md px-1.5 text-base font-semibold text-slate-900 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Deck title" />
          <nav aria-label="Editor menus" className="-ml-1 flex items-center">
            <Menu bare button="File" title="Export, import, reset">
              {(close) => (
                <>
                  <MenuItem icon={<Download size={14} />} label="Export this deck" note="Download it as a file." onClick={() => { close(); exportDeck(); }} />
                  <MenuItem icon={<Upload size={14} />} label="Import slides" note="Add the slides from a deck file." onClick={() => { close(); importRef.current?.click(); }} />
                  <MenuDivider />
                  <MenuItem icon={<Globe size={14} />} label={published ? "Publish again" : "Publish this deck"} note={published ? `Published ${new Date(published.publishedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}. Replaces it with this version.` : "A read-only copy for everyone to play, listed on the Decks tab."} onClick={() => { close(); void publish(); }} />
                  {published && <MenuItem icon={<Globe size={14} />} label="Unpublish" note="Takes the published copy down. This working copy stays." onClick={() => { close(); if (window.confirm("Take the published copy of this deck down? Anyone with the link will lose it.")) void unpublish(); }} />}
                  <MenuDivider />
                  <MenuItem icon={<FileText size={14} />} label="Worksheets…" note="Print the worksheets pinned to this lesson, and their answer sheets." onClick={() => { close(); setSheetsOpen(true); }} />
                  <MenuItem icon={<Play size={14} />} label="Present from this slide" onClick={() => { close(); present(); }} />
                  <MenuItem icon={<ArrowLeft size={14} />} label="Back to all decks" onClick={() => { close(); window.location.href = "/decks"; }} />
                  <MenuDivider />
                  <MenuItem danger icon={isBuilt ? <RotateCcw size={14} /> : <Trash2 size={14} />} label={isBuilt ? "Reset to the original" : "Delete this deck"} note={isBuilt ? "Your changes on this device are lost." : "Removes it from this device."}
                    onClick={() => { close(); if (window.confirm(isBuilt ? "Put this deck back to the original? Your changes on this device are lost." : "Delete this deck from this device?")) { resetDeck(deck.id); window.location.href = isBuilt ? `/decks/${deck.id}` : "/decks"; } }} />
                </>
              )}
            </Menu>
            <Menu bare button="Edit">
              {(close) => (
                <>
                  <MenuItem icon={<Undo2 size={14} />} label="Undo" shortcut="Ctrl+Z" disabled={!hist.canUndo} onClick={() => { close(); undo(); }} />
                  <MenuItem icon={<Redo2 size={14} />} label="Redo" shortcut="Ctrl+Shift+Z" disabled={!hist.canRedo} onClick={() => { close(); redo(); }} />
                  <MenuDivider />
                  <MenuItem icon={<Copy size={14} />} label="Copy" shortcut="Ctrl+C" disabled={!chosen.length} onClick={() => { close(); copy({ els: chosen }); }} />
                  <MenuItem icon={<ClipboardPaste size={14} />} label="Paste" shortcut="Ctrl+V" onClick={() => { close(); paste(); }} />
                  <MenuItem icon={<Copy size={14} />} label="Duplicate" shortcut="Ctrl+D" disabled={!chosen.length} onClick={() => { close(); duplicateSel(); }} />
                  <MenuItem icon={<Trash2 size={14} />} label="Delete" shortcut="Del" disabled={!chosen.length} onClick={() => { close(); deleteSel(); }} />
                  <MenuDivider />
                  <MenuItem label="Select all on this slide" shortcut="Ctrl+A" disabled={!slide.els.length} onClick={() => { close(); stopEditing(); setSel(slide.els.map((x) => x.id)); }} />
                  <MenuItem label="Select nothing" shortcut="Esc" disabled={!chosen.length} onClick={() => { close(); stopEditing(); setSel([]); }} />
                </>
              )}
            </Menu>
            <Menu bare button="Insert" wide>
              {(close) => (
                <>
                  {BASIC.map((a) => <MenuItem key={a.label} icon={a.icon} label={a.label} note={a.note} onClick={() => { close(); a.run(); }} />)}
                  <MenuHeading>Shapes and lines</MenuHeading>
                  {SHAPES.map((a) => <MenuItem key={a.label} icon={a.icon} label={a.label} onClick={() => { close(); a.run(); }} />)}
                  <MenuHeading>Lesson pieces</MenuHeading>
                  {PIECES.map((a) => <MenuItem key={a.label} icon={a.icon} label={a.label} note={PIECE_NOTE[a.label]} onClick={() => { close(); a.run(); }} />)}
                </>
              )}
            </Menu>
            <Menu bare button="Slide">
              {(close) => (
                <>
                  <MenuItem icon={<Copy size={14} />} label="Duplicate slide" onClick={() => { close(); duplicateAt(si); }} />
                  <MenuItem icon={<Clipboard size={14} />} label="Copy slide" note="Paste it here or into another deck." onClick={() => { close(); copy({ slide }); }} />
                  <MenuItem icon={<ClipboardPaste size={14} />} label="Paste a copied slide" onClick={() => { close(); paste(); }} />
                  <MenuDivider />
                  <MenuItem icon={<ArrowUp size={14} />} label="Move slide earlier" disabled={si === 0} onClick={() => { close(); moveSlide(-1); }} />
                  <MenuItem icon={<ArrowDown size={14} />} label="Move slide later" disabled={si === deck.slides.length - 1} onClick={() => { close(); moveSlide(1); }} />
                  <MenuItem danger icon={<Trash2 size={14} />} label="Delete slide" disabled={deck.slides.length < 2} onClick={() => { close(); deleteAt(si); }} />
                  <MenuDivider />
                  <MenuItem icon={<ChevronLeft size={14} />} label="Previous slide" shortcut="PgUp" disabled={si === 0} onClick={() => { close(); goSlide(si - 1); }} />
                  <MenuItem icon={<ChevronRight size={14} />} label="Next slide" shortcut="PgDn" disabled={si === deck.slides.length - 1} onClick={() => { close(); goSlide(si + 1); }} />
                  <MenuDivider />
                  <MenuItem icon={<ListTree size={14} />} label="Lesson thread…" note="Each slide's purpose and question brief, in order." onClick={() => { close(); openThread(); }} />
                </>
              )}
            </Menu>
            <Menu bare button="View">
              {(close) => (
                <>
                  <MenuItem label="Slide list" checked={leftOpen} onClick={() => { close(); setLeftOpen(!leftOpen); }} />
                  <MenuItem label="Properties" checked={rightOpen} onClick={() => { close(); setRightOpen(!rightOpen); }} />
                  <MenuItem label="Hide both panels" shortcut={"\\"} checked={!leftOpen && !rightOpen} onClick={() => { close(); const show = !leftOpen && !rightOpen; setLeftOpen(show); setRightOpen(show); }} />
                  <MenuDivider />
                  <MenuItem label="Slide list as pictures" checked={stripView === "thumbs"} onClick={() => { close(); setStripView("thumbs"); setLeftOpen(true); }} />
                  <MenuItem label="Slide list as a compact list" checked={stripView === "list"} onClick={() => { close(); setStripView("list"); setLeftOpen(true); }} />
                  <MenuDivider />
                  <MenuItem icon={<Keyboard size={14} />} label="Keyboard shortcuts" shortcut="?" onClick={() => { close(); setKeys(true); }} />
                </>
              )}
            </Menu>
          </nav>
        </div>
        <span role="status" className="ml-auto hidden min-w-0 truncate px-2 text-right text-xs leading-tight text-slate-500 md:block" title={cloud.message || undefined}>
          {status || "Changes save on this device"}
          {publishNote && <span className="block truncate text-slate-600">{publishNote}</span>}
          {cloud.message && <span className={`block truncate ${cloud.mode === "error" ? "text-red-600" : cloud.mode === "shared" ? "text-emerald-700" : "text-slate-400"}`}>{cloud.message}</span>}
        </span>
        <button className={`${toolBtn} hidden md:inline-flex ${leftOpen ? "bg-slate-100 text-slate-900" : "text-slate-500"}`} onClick={() => setLeftOpen(!leftOpen)} title="Show or hide the slide list" aria-label="Slide list" aria-pressed={leftOpen}><PanelLeft size={16} /></button>
        <button className={`${toolBtn} hidden md:inline-flex ${rightOpen ? "bg-slate-100 text-slate-900" : "text-slate-500"}`} onClick={() => setRightOpen(!rightOpen)} title="Show or hide the properties" aria-label="Properties" aria-pressed={rightOpen}><PanelRight size={16} /></button>
        <BarDivider />
        <button className={`${toolBtn} ml-auto md:ml-0`} onClick={openThread} aria-label="Lesson thread" title="Each slide's purpose and question brief, in order"><ListTree size={16} /><span className="hidden sm:inline">Lesson thread</span></button>
        {pinnedSheets(deck).length > 0 && <button onClick={() => setSheetsOpen(true)} aria-label="Worksheets" title="Print the worksheets pinned to this lesson" className="ml-1 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><FileText size={16} /><span className="hidden sm:inline">Worksheets</span></button>}
        <button onClick={present} aria-label="Present" className="ml-1 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-blue-900 px-3 text-sm font-semibold text-white hover:bg-blue-800"><Play size={16} /><span className="hidden sm:inline">Present</span></button>
        <input ref={importRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => { void importSlides(e.target.files?.[0]); e.target.value = ""; }} />
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { void onImage(e.target.files?.[0]); e.target.value = ""; }} />
      </div>

      {/* toolbar: undo, new slide, insert; then the selection's own quick controls; then the panels */}
      <div role="toolbar" aria-label="Slide tools" className="no-scrollbar flex items-center gap-0.5 overflow-x-auto border-b border-slate-200 bg-white px-2 py-1 sm:px-3">
        <button className={toolBtn} onClick={undo} disabled={!hist.canUndo} title="Undo (Ctrl+Z)" aria-label="Undo"><Undo2 size={16} /></button>
        <button className={toolBtn} onClick={redo} disabled={!hist.canRedo} title="Redo (Ctrl+Shift+Z)" aria-label="Redo"><Redo2 size={16} /></button>
        <BarDivider />
        <Menu wide title="Add a slide after this one" button={<><Plus size={16} />New slide</>}>{(close) => slideLayouts(close)}</Menu>
        <BarDivider />
        {BASIC.map((a) => <button key={a.label} className={toolBtn} onClick={a.run} title={a.note} aria-label={`Add ${a.label.toLowerCase()}`}>{a.icon}<span className="hidden xl:inline">{a.label}</span></button>)}
        <Menu title="Rectangles, ellipses, lines and arrows" label="Shapes" button={<><Shapes size={16} /><span className="hidden xl:inline">Shapes</span></>}>
          {(close) => SHAPES.map((a) => <MenuItem key={a.label} icon={a.icon} label={a.label} onClick={() => { close(); a.run(); }} />)}
        </Menu>
        <Menu wide title="Questions, generators and boards from the site" label="Questions" button={<><MessagesSquare size={16} /><span className="hidden xl:inline">Questions</span></>}>
          {(close) => PIECES.map((a) => <MenuItem key={a.label} icon={a.icon} label={a.label} note={PIECE_NOTE[a.label]} onClick={() => { close(); a.run(); }} />)}
        </Menu>
        <BarDivider />
        {!chosen.length && (
          <div className="flex shrink-0 items-center gap-0.5 text-sm text-slate-600">
            <button className={toolBtn} onClick={() => goSlide(si - 1)} disabled={si === 0} title="Previous slide (Page Up)" aria-label="Previous slide"><ChevronLeft size={16} /></button>
            <span className="whitespace-nowrap px-1 tabular-nums">Slide {si + 1} of {deck.slides.length}</span>
            <button className={toolBtn} onClick={() => goSlide(si + 1)} disabled={si === deck.slides.length - 1} title="Next slide (Page Down)" aria-label="Next slide"><ChevronRight size={16} /></button>
          </div>
        )}
        {quick}{many}
        {chosen.length > 0 && <>
          <Menu wide label="Arrange" title="Line up, space out and layer" button={<><Layers size={16} /><span className="hidden 2xl:inline">Arrange</span></>}>{() => <div className="px-2 pb-2">{alignRow}</div>}</Menu>
          <button className={toolBtn} onClick={duplicateSel} title="Duplicate (Ctrl+D)" aria-label="Duplicate"><Copy size={16} /></button>
          <button className={`${toolBtn} hover:text-red-700`} onClick={deleteSel} title="Delete (Del)" aria-label="Delete"><Trash2 size={16} /></button>
        </>}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* slide strip */}
        {leftOpen && <div style={{ width: leftW }} className="shrink-0 overflow-hidden border-r border-slate-200 bg-white">
          <SlideStrip slides={deck.slides} si={si} width={leftW} view={stripView} setView={setStripView} onGo={goSlide} onReorder={reorderSlide} onDuplicate={duplicateAt} onDelete={deleteAt} bankVersion={bankVersion}
            add={(
              <Menu up full wide button={<><Plus size={14} />Add slide</>}>{(close) => slideLayouts(close)}</Menu>
            )} />
        </div>}
        {leftOpen && <Splitter side="left" width={leftW} min={170} max={420} onChange={setLeftW} />}

        {/* canvas */}
        <div ref={stageRef} className="flex min-w-0 flex-1 items-center justify-center p-2" onPointerDown={() => { stopEditing(); setSel([]); }}
          onDragOver={(e) => { if ([...e.dataTransfer.types].includes("Files")) e.preventDefault(); }}
          onDrop={(e) => { const f = [...e.dataTransfer.files].find((x) => x.type.startsWith("image/")); if (f) { e.preventDefault(); void onImage(f); } }}>
          <div ref={canvasRef} className="rounded-sm shadow-card" onPointerDown={pressCanvas}>
            <SlideCanvas key={`${slide.id}-${bankVersion}`} slide={slide} scale={scale} hidden={editing ? new Set([editing]) : undefined}>
              {slide.els.map((el) => {
                const b = bbox(el);
                const pad = el.kind === "line" ? 14 / scale : 0;
                const picked = selSet.has(el.id);
                return (
                  <div key={el.id} onPointerDown={(e) => pressElement(e, el)}
                    onDoubleClick={() => { if (el.kind === "text") startEditing(el.id); else if (el.kind === "maths") setEquation({ mode: "edit", id: el.id, latex: el.latex }); else if (el.kind === "generator" || el.kind === "worksheet") setGenerator(el); else if (["questions", "practice", "depth", "grid"].includes(el.kind)) void openQuestions(el); }}
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
        {rightOpen && <Splitter side="right" width={rightW} min={260} max={560} onChange={setRightW} />}
        {rightOpen && <div style={{ width: rightW }} className="shrink-0 overflow-y-auto border-l border-slate-200 bg-white p-3 text-sm">
          {!chosen.length && (
            <>
              <div className="font-semibold text-slate-900">Slide {si + 1} of {deck.slides.length}</div>
              <p className="mt-0.5 text-xs text-slate-500">Click something on the slide to change it. Move, copy or delete the slide from the Slide menu.</p>
              <Section id="slide" title="This slide" defaultOpen>
                <Label>Title (for the slide list)</Label>
                <input value={slide.title} onChange={(e) => setSlide((s) => ({ ...s, title: e.target.value }))} className={input} />
                <Label>Brief (optional)</Label>
                <textarea value={slide.brief ?? ""} rows={2} onChange={(e) => setSlide((s) => ({ ...s, brief: e.target.value || undefined }))} className={input}
                  placeholder="What should this slide's questions test, or the key skill?" aria-label="Slide brief" />
                <Label>Kind of slide (its colour)</Label>
                <div className="flex flex-wrap gap-1">{(Object.keys(FAMILY_STYLE) as DeckFamily[]).map((f) => (
                  <button key={f} onClick={() => setSlide((s) => ({ ...s, family: f }))} className={`${small} ${slide.family === f ? "ring-2 ring-blue-500" : ""}`}>
                    <span className="h-2 w-2 rounded-full" style={{ background: FAMILY_STYLE[f].colour }} />{FAMILY_STYLE[f].label}</button>))}</div>
              </Section>
              <Section id="objects" title="On this slide" defaultOpen badge={`${slide.els.length}`}>
                <ObjectList els={slide.els} selected={selSet} onSelect={pickFromList} onLayer={layerOne} />
              </Section>
              <Section id="deck" title="About the deck">
                <textarea value={deck.summary} onChange={(e) => apply((d) => ({ ...d, summary: e.target.value }))} rows={3} className={input} placeholder="One sentence: what this lesson covers." />
              </Section>
            </>
          )}
          {chosen.length > 1 && (
            <>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-slate-900">{chosen.length} selected</span>
                <button className={`${small} ml-auto`} onClick={duplicateSel} title="Duplicate (Ctrl+D)"><Copy size={12} /></button>
                <button className={small} onClick={deleteSel} title="Delete"><Trash2 size={12} /></button>
              </div>
              <Section id="arrange-many" title="Line up and layer" defaultOpen>{alignRow}</Section>
              <Section id="objects" title="On this slide" defaultOpen badge={`${slide.els.length}`}>
                <ObjectList els={slide.els} selected={selSet} onSelect={pickFromList} onLayer={layerOne} />
              </Section>
            </>
          )}
          {one && (
            <>
              <div className="flex items-center gap-1">
                <span className="font-semibold capitalize text-slate-900">{KIND_NAME[one.kind] ?? one.kind}</span>
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
                    <Num label="Size" value={one.size} min={MIN_TEXT} onChange={(size) => setEl(one.id, { size, fixed: true })} />
                    <button className={`${small} ${on(!one.fixed)}`} title="Fit the text to its box: this size is the most it will be. Setting a size by hand keeps it exactly as set." onClick={() => setEl(one.id, { fixed: !one.fixed })}>Auto size</button>
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
              {one.kind === "worksheet" && <SheetProps el={one} set={(p) => setEl(one.id, p)} canPin={pinnedSheets(deck).length < MAX_PINNED} />}
              {one.kind === "image" && <p className="mt-2 text-xs text-slate-500">Drag a corner to resize; the picture keeps its shape (hold Shift to stretch it).</p>}
              {one.kind === "board" && <BoardProps el={one} set={(p) => setEl(one.id, p)} />}
              {one.kind === "ratioTable" && <RatioTableProps el={one} set={(p) => setEl(one.id, p)} />}
              {one.kind === "bar" && <BarProps el={one} set={(p) => setEl(one.id, p)} />}
              {(one.kind === "questions" || one.kind === "practice" || one.kind === "depth" || one.kind === "grid") && <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="font-semibold">{one.kind === "questions" ? one.items.length : one.kind === "grid" ? (one.items ?? one.bank).length : one.kind === "practice" ? one.bank.length : 1} questions</div>
                <p className="mt-1 text-xs text-slate-500">Questions written for this slide, with their answers and working.</p>
                <button className={`${small} mt-3 min-h-11 w-full justify-center`} onClick={() => { void openQuestions(one); }}>Edit questions…</button>
                {one.kind === "grid" && <div className="mt-3"><Num label="Columns" value={one.cols} min={1} onChange={(cols) => setEl(one.id, { cols: Math.max(1, Math.min(4, cols)) })} /></div>}
              </div>}
              {(one.kind === "generator" || one.kind === "worksheet") && <GeneratorProps el={one} onConfigure={() => { stopEditing(); setGenerator(one); }} />}
              <Section id="presenting" title="Click order" badge={one.step ? `On click ${one.step}` : "With the slide"}>
                <select value={one.step ?? 0} onChange={(e) => setEl(one.id, { step: Number(e.target.value) || undefined })} className={input} aria-label="Appears when presenting">
                  <option value={0}>Appears with the slide</option>
                  {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>Appears on click {n}</option>)}
                </select>
              </Section>
              <Section id="arrange-one" title="Line up and layer">{alignRow}</Section>
              <Section id="position" title="Position and size" badge={`${Math.round(one.w)} × ${Math.round(one.h)}`}>
                <div className="grid grid-cols-2 gap-1">
                  <Num label="X" value={one.x} onChange={(x) => setEl(one.id, { x })} /><Num label="Y" value={one.y} onChange={(y) => setEl(one.id, { y })} />
                  <Num label="W" value={one.w} onChange={(ww) => setEl(one.id, { w: ww })} /><Num label="H" value={one.h} onChange={(h) => setEl(one.id, { h })} />
                </div>
              </Section>
              <Section id="objects" title="On this slide" badge={`${slide.els.length}`}>
                <ObjectList els={slide.els} selected={selSet} onSelect={pickFromList} onLayer={layerOne} />
              </Section>
            </>
          )}
        </div>}
      </div>

      {keys && <ShortcutsDialog onClose={() => setKeys(false)} />}
      {sheetsOpen && <WorksheetsDialog deck={deck} onClose={() => setSheetsOpen(false)} onPatch={(id, patch) => setEl(id, patch)} onGo={(n) => goSlide(n - 1)}
        onAdd={() => { const l = LAYOUTS.find((x) => x.key === "worksheet"); if (l) addSlide(l.make(uid("slide"))); }} />}
      {lessonMap && <LessonMap deckTitle={deck.title} slides={deck.slides} index={si} onClose={() => setLessonMap(false)} onApply={(slides) => { apply((d) => ({ ...d, slides })); setLessonMap(false); }} />}
      {generator && <GeneratorDialog start={generator} brief={slide.brief} onClose={() => setGenerator(null)} onApply={(el) => { setEl(el.id, el); setGenerator(null); }} />}

      {question && <QuestionWorkspace context={{ title: slide.title, brief: slide.brief }} identity={`${deck.title} / ${slide.id}`} mode={slide.family === "depth" ? "depth" : "skill"} display={(() => { const el = slide.els.find((e) => e.id === question.id); return el?.kind === "questions" ? { presentation: el.presentation, visualiser: el.visualiser } : {}; })()} start={question.items} tool={deck.tool ?? "estimation"} draftKey={`${deck.id}:${question.id}`} grid={question.grid} onClose={() => setQuestion(null)} onApply={(items, context, display) => {
        setSlide((s) => ({ ...s, title: context.title, brief: context.brief?.trim() ? context.brief : undefined, els: s.els.map((e) => e.id === question.id ? ({ ...e, ...(question.grid ? { items, bank: [] } : { kind: "questions", items, ...display }) } as DeckElement) : e.kind === "text" && e.text === s.title ? { ...e, text: context.title } : e) }));
      }} />}
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
