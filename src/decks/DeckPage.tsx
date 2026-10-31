import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, FileText, ListOrdered, Maximize, Minimize, Pencil, Plus, Printer } from "lucide-react";
import { WorksheetsDialog } from "./WorksheetsDialog";
import { pinnedSheets, printSheet } from "./worksheets";
import { DECK_PAGE } from "./theme";
import { loadKaTeX } from "../shared/katex";
import { AdminGate } from "./AdminGate";
import { Editor } from "./Editor";
import { fetchPublishedDeck, usePublishedIndex } from "./published";
import { useDevMode } from "../devMode";
import { LAYOUTS, PLANNED, titleSlide } from "./layouts";
import { FILL_LABELS, SlideCanvas, slideSteps } from "./SlideCanvas";
import { useCloudState } from "./cloud";
import { allDecks, loadDeck, newDeckId, saveDeck, syncFromCloud } from "./store";
import { CANVAS_H, CANVAS_W, FAMILY_STYLE, type DeckDef, type FillMode } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// /decks lists decks, /decks/library shows every slide layout, /decks/<id> plays one, and ?edit=1 opens it in the
// editor. A deck is a board, not a presentation: slides are static, the teacher writes on them with the site's ink
// layer (mounted once in App; cleared here on every slide change) and chooses how much a board shows.
// ─────────────────────────────────────────────────────────────────────────────

const clearInk = () => window.dispatchEvent(new Event("mt-ink-clear"));

/** Fits a 16:9 canvas into the element it is measured from. */
function useFit(ref: React.RefObject<HTMLDivElement | null>) {
  const [scale, setScale] = useState(0.5);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => setScale(Math.max(0.1, Math.min(el.clientWidth / CANVAS_W, el.clientHeight / CANVAS_H)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return scale;
}

// ── Deck list ────────────────────────────────────────────────────────────────

function DeckIndex() {
  const navigate = useNavigate();
  const [, refresh] = useState(0);
  const cloud = useCloudState();
  useEffect(() => { void syncFromCloud().then((changed) => { if (changed) refresh((n) => n + 1); }); }, []);
  const published = usePublishedIndex();
  const decks = allDecks();
  const create = () => {
    const id = newDeckId();
    saveDeck({ id, title: "New deck", summary: "", slides: [titleSlide(`${id}-title`, "New deck", "")] });
    navigate(`/decks/${id}?edit=1`);
  };
  return (
    <div className="min-h-screen px-4 py-8" style={{ background: DECK_PAGE }}>
      <div className="mx-auto max-w-3xl">
        <Link to="/?tab=decks" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-800"><ArrowLeft size={15} />Decks</Link>
        <div className="mt-3 flex items-center gap-3">
          <h1 className="text-3xl font-semibold text-slate-900">Deck editor</h1>
          <Link to="/decks/library" className="ml-auto rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-card hover:bg-slate-50">Slide library</Link>
          <button onClick={create} className="inline-flex items-center gap-1 rounded-xl bg-blue-900 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"><Plus size={16} />New deck</button>
        </div>
        <p className="mt-1 text-slate-500">Every deck, published or not. Open one to teach from your working copy, press Edit to change any slide, and publish from the editor's File menu when it is ready for everyone.</p>
        {cloud.message && <p className={`mt-1 text-xs ${cloud.mode === "shared" ? "text-emerald-700" : "text-slate-400"}`}>{cloud.message}</p>}
        <div className="mt-6 grid gap-3">
          {decks.map(({ deck, mine, edited }) => (
            <div key={deck.id} className="flex items-center gap-4 rounded-2xl border border-slate-300 bg-white p-4 shadow-card">
              <Link to={`/decks/${deck.id}`} className="shrink-0 overflow-hidden rounded-lg border border-slate-200"><SlideCanvas slide={deck.slides[0]} scale={0.1} /></Link>
              <Link to={`/decks/${deck.id}`} className="min-w-0 flex-1">
                <div className="text-lg font-semibold text-slate-900">{deck.title}</div>
                <div className="mt-0.5 text-sm text-slate-500">{deck.summary}</div>
                <div className="mt-1 text-xs text-slate-400">{deck.slides.length} slides{mine ? " · your deck" : ""}{edited ? " · edited on this device" : ""}{published?.[deck.id] ? " · published" : ""}</div>
              </Link>
              <Link to={`/decks/${deck.id}?edit=1`} className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Pencil size={14} />Edit</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Slide library ────────────────────────────────────────────────────────────

function Library() {
  useEffect(() => { void loadKaTeX(); }, []);
  const families = [...new Set(LAYOUTS.filter((l) => !l.group).map((l) => l.family))];
  const groups = [{ label: "Questions", colour: "#1e3a8a", layouts: LAYOUTS.filter((l) => l.group === "Questions") }, ...families.map((family) => ({ label: FAMILY_STYLE[family].label, colour: FAMILY_STYLE[family].colour, layouts: LAYOUTS.filter((l) => !l.group && l.family === family) }))];
  return (
    <div className="min-h-screen px-4 py-8" style={{ background: DECK_PAGE }}>
      <div className="mx-auto max-w-6xl">
        <Link to="/decks" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-800"><ArrowLeft size={15} />Decks</Link>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Slide library</h1>
        <p className="mt-1 text-slate-500">Every layout a slide can start from, with sample content. In the editor, Add slide offers these; once added, every part can be moved, changed or deleted.</p>
        {groups.map((group) => (
          <section key={group.label} className="mt-8">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800"><span className="h-2.5 w-2.5 rounded-full" style={{ background: group.colour }} />{group.label}</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.layouts.map((l) => (
                <div key={l.key} className="rounded-2xl border border-slate-300 bg-white p-3 shadow-card">
                  <div className="overflow-hidden rounded-lg border border-slate-200"><SlideCanvas slide={l.make(`library-${l.key}`)} scale={0.215} /></div>
                  <div className="mt-2 font-semibold text-slate-900">{l.label}</div>
                  <div className="text-sm text-slate-500">{l.use}</div>
                </div>
              ))}
            </div>
          </section>
        ))}
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-800">Planned</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PLANNED.map((p) => (
              <div key={p.label} className="rounded-2xl border border-dashed border-slate-300 p-4 text-slate-400">
                <div className="text-xs font-semibold uppercase tracking-wide">{p.family}</div>
                <div className="font-semibold text-slate-500">{p.label}</div>
                <div className="text-sm">{p.use}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// ── The player ───────────────────────────────────────────────────────────────

function Player({ deck, onEdit, badge, backTo }: { deck: DeckDef; onEdit?: (index: number) => void; badge?: string; backTo?: string }) {
  const [params, setParams] = useSearchParams();
  const total = deck.slides.length;
  const raw = Number(params.get("s") ?? 1);
  const index = Math.min(total - 1, Math.max(0, (Number.isFinite(raw) ? raw : 1) - 1));
  const [fills, setFills] = useState<Record<string, FillMode>>({});
  const [jump, setJump] = useState(false);
  const [full, setFull] = useState(false);
  const [sheetsOpen, setSheetsOpen] = useState(false);
  const sheets = useMemo(() => pinnedSheets(deck), [deck]);
  const here = sheets.filter((p) => p.slide.id === deck.slides[index].id);
  const stage = useRef<HTMLDivElement>(null);
  const scale = useFit(stage);

  const [beat, setBeat] = useState(0);                // how many of the slide's clicks have been shown
  const go = useCallback((i: number, b = 0) => {
    const next = Math.min(total - 1, Math.max(0, i));
    if (next === index) return;
    clearInk();                                   // annotations belong to a slide
    setParams({ s: String(next + 1) }, { replace: true });
    setBeat(b);
    setJump(false);
  }, [index, total, setParams]);
  const steps = slideSteps(deck.slides[index]);
  /** Next shows the slide's next click before moving on; Back hides the last one, or goes back to a slide fully built. */
  const forward = useCallback(() => { if (beat < steps) setBeat(beat + 1); else go(index + 1); }, [beat, steps, go, index]);
  const backward = useCallback(() => { if (beat > 0) setBeat(beat - 1); else if (index > 0) go(index - 1, slideSteps(deck.slides[index - 1])); }, [beat, go, index, deck.slides]);

  // the pieces with a fill state: boards, ratio tables and bar models share the one control
  const boards = useMemo(() => deck.slides[index].els.filter((e) => e.kind === "board" || e.kind === "ratioTable" || e.kind === "bar"), [deck.slides, index]);
  const fillNow: FillMode = boards.length ? fills[boards[0].id] ?? (boards[0] as { fill?: FillMode }).fill ?? "filled" : "filled";
  /** One control for every board on the slide, kept in the bar under the slide so it can never cover anything on it. */
  const setFill = useCallback((m: FillMode) => setFills((f) => ({ ...f, ...Object.fromEntries(boards.map((e) => [e.id, m])) })), [boards]);
  const cycleFill = useCallback(() => { const order = FILL_LABELS.map(([m]) => m); setFill(order[(order.indexOf(fillNow) + 1) % order.length]); }, [fillNow, setFill]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input,textarea,select")) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); forward(); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); backward(); }
      else if (e.key === " " && !t.closest("button,a,summary")) { e.preventDefault(); forward(); }
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(total - 1);
      else if (e.key === "j") setJump((v) => !v);
      else if (e.key === "b" && boards.length) cycleFill();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [go, forward, backward, total, boards, cycleFill]);

  useEffect(() => {
    const h = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);
  const toggleFull = () => { try { if (document.fullscreenElement) void document.exitFullscreen(); else void document.documentElement.requestFullscreen(); } catch { /* not allowed here */ } };

  const slide = deck.slides[index];
  const family = FAMILY_STYLE[slide.family];
  const iconBtn = "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 text-sm font-semibold text-slate-700 shadow-card hover:bg-slate-50 disabled:opacity-40";

  return (
    <div className="flex h-screen flex-col p-2" style={{ background: DECK_PAGE }}>
      <div className="flex items-center gap-3 pb-2">
        <Link to={backTo ?? deck.toolPath ?? "/decks"} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-800"><ArrowLeft size={15} />{deck.title}</Link>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500"><span className="h-2 w-2 rounded-full" style={{ background: family.colour }} />{family.label}</span>
        {badge && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">{badge}</span>}
        <div className="ml-auto flex items-center gap-2">
          {onEdit && <button className={iconBtn} onClick={() => onEdit(index)} title="Edit this deck"><Pencil size={16} />Edit</button>}
          {sheets.length > 0 && <button className={iconBtn} onClick={() => setSheetsOpen(true)} aria-label="Worksheets" title="Print the worksheets pinned to this lesson"><FileText size={16} />Worksheets</button>}
          <button className={iconBtn} onClick={() => setJump((v) => !v)} aria-label="Jump to a slide" title="Jump to a slide (J)"><ListOrdered size={18} /></button>
          <button className={iconBtn} onClick={toggleFull} aria-label={full ? "Leave full screen" : "Full screen"}>{full ? <Minimize size={18} /> : <Maximize size={18} />}</button>
        </div>
      </div>

      <div ref={stage} className="relative flex min-h-0 flex-1 items-center justify-center">
        <div className="overflow-hidden rounded-2xl border border-slate-300 shadow-card">
          <SlideCanvas key={slide.id} slide={slide} scale={scale * 0.995} live upTo={beat} fills={fills} />
        </div>
        {jump && (
          <div className="absolute inset-0 z-20 overflow-auto rounded-2xl bg-white/95 p-6">
            <div className="mx-auto max-w-xl space-y-1">
              {deck.slides.map((s, i) => (
                <button key={s.id} onClick={() => go(i)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-lg ${i === index ? "bg-slate-100 font-semibold" : "hover:bg-slate-50"}`}>
                  <span className="w-6 text-sm text-slate-400">{i + 1}</span>
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: FAMILY_STYLE[s.family].colour }} />
                  <span className="truncate text-slate-800">{s.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 pr-16 pt-3">   {/* room on the right for the ink pencil, which docks there */}
        <button className={iconBtn} onClick={backward} disabled={index === 0 && beat === 0} aria-label="Back"><ChevronLeft size={20} /></button>
        {here.length > 0 && (
          <div className="flex shrink-0 gap-1">
            <button className={iconBtn} onClick={() => void printSheet(here[0].el, "questions")}><Printer size={16} />Print sheet</button>
            <button className={iconBtn} onClick={() => void printSheet(here[0].el, "answers")}><Printer size={16} />Answer sheet</button>
          </div>
        )}
        {boards.length > 0 && (
          <div role="group" aria-label="How much of the board, table or picture is filled in" title="How much is filled in (B)" className="flex shrink-0 gap-0.5 rounded-xl border border-slate-300 bg-white p-0.5 shadow-card">
            {FILL_LABELS.map(([m, label]) => (
              <button key={m} onClick={() => setFill(m)} aria-pressed={fillNow === m} className={`h-9 rounded-lg px-3 text-sm font-semibold ${fillNow === m ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{label}</button>
            ))}
          </div>
        )}
        <div className="flex flex-1 items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full" style={{ width: `${((index + 1) / total) * 100}%`, background: family.colour }} /></div>
          <span className="text-sm font-semibold tabular-nums text-slate-500">{steps > 0 && <span className="mr-2 text-xs font-normal text-slate-400">click {beat} of {steps}</span>}{index + 1} / {total}</span>
        </div>
        <button className={iconBtn} onClick={forward} disabled={index === total - 1 && beat >= steps} aria-label="Next"><ChevronRight size={20} /></button>
      </div>
      {sheetsOpen && <WorksheetsDialog deck={deck} onClose={() => setSheetsOpen(false)} onPatch={() => undefined} onGo={(n) => { go(n - 1); setSheetsOpen(false); }} />}
    </div>
  );
}

function DeckView({ id }: { id: string }) {
  const [params, setParams] = useSearchParams();
  const editing = params.get("edit") === "1";
  const [deck, setDeck] = useState(() => loadDeck(id));
  const s = Number(params.get("s") ?? 1);
  useEffect(() => { setDeck(loadDeck(id)); }, [id, editing]);
  // a newer copy saved on another device replaces this one (not while editing, so nothing is pulled from under the teacher)
  useEffect(() => { if (!editing) void syncFromCloud(id).then((changed) => { if (changed) setDeck(loadDeck(id)); }); }, [id, editing]);
  if (!deck) return <div className="p-8"><Link to="/decks" className="font-semibold text-blue-900">← No such deck. See all decks</Link></div>;
  if (editing) return <Editor start={deck} startIndex={Math.max(0, (Number.isFinite(s) ? s : 1) - 1)} onPresent={(d, i) => { setDeck(d); clearInk(); setParams({ s: String(i + 1) }); }} />;
  return <Player deck={deck} badge="Working copy" onEdit={(i) => { clearInk(); setParams({ s: String(i + 1), edit: "1" }); }} />;
}

/** The published copy: what anyone sees. No editing, no working copy, nothing read from this device. */
function PublishedView({ id }: { id: string }) {
  const [deck, setDeck] = useState<DeckDef | "missing" | null | undefined>(undefined);
  useEffect(() => { let on = true; void fetchPublishedDeck(id).then((d) => { if (on) setDeck(d); }); return () => { on = false; }; }, [id]);
  useEffect(() => { document.title = deck && deck !== "missing" ? `${deck.title} · Maths Tools` : "Deck · Maths Tools"; }, [deck]);
  if (deck === undefined) return <div className="flex min-h-screen items-center justify-center" style={{ background: DECK_PAGE }}><p className="font-medium text-slate-500">Loading…</p></div>;
  if (deck === "missing" || deck === null) return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: DECK_PAGE }}>
      <div className="max-w-md rounded-2xl border border-slate-300 bg-white p-6 text-center shadow-card">
        <h1 className="text-xl font-semibold text-slate-900">{deck === "missing" ? "This deck isn't published" : "Decks can't be loaded here"}</h1>
        <p className="mt-1 text-sm text-slate-500">{deck === "missing" ? "It may not be ready yet, or it has been taken down." : "Published decks come from the website, so they need a connection."}</p>
        <Link to="/?tab=decks" className="mt-4 inline-block rounded-xl bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">See the decks</Link>
      </div>
    </div>
  );
  return <Player deck={deck} badge="Published" backTo="/?tab=decks" />;
}

export default function DeckPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const admin = useDevMode();
  useEffect(() => { document.title = id === "library" ? "Slide library · Maths Tools" : id ? `${loadDeck(id)?.title ?? "Deck"} · Maths Tools` : "Deck editor · Maths Tools"; }, [id]);
  // The deck list, the slide library and the editor need the admin password; the player shows the published copy to everyone else.
  if (!id) return <AdminGate what="deck editor"><DeckIndex /></AdminGate>;
  if (id === "library") return <AdminGate what="slide library"><Library /></AdminGate>;
  if (params.get("edit") === "1" && !admin) return <AdminGate what="deck editor"><></></AdminGate>;
  if (!admin || params.has("published")) return <PublishedView key={id} id={id} />;
  return <DeckView key={id} id={id} />;
}
