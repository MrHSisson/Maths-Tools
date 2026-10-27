import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, EyeOff, ListOrdered, Maximize, Minimize, RefreshCw } from "lucide-react";
import { InlineMath, MathRenderer } from "../shared/components/MathRenderer";
import { PAGE_BG } from "../shared/colors";
import { misconceptionLabel } from "../shared/misconceptions";
import type { AnyQuestion } from "../shared";
import { DECKS, bankById, deckById } from "./index";
import { loadGenerator } from "./generators";
import { FAMILY_OF, FAMILY_STYLE, slideTitle, type BankQuestion, type BoardGrid, type DeckDef, type FillMode, type SlideConfig } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// The deck page: /decks lists decks, /decks/<id> plays one. A deck is a board, not a presentation: slides are static,
// the teacher writes on them with the site's ink layer (mounted once in App; cleared here on every slide change) and
// chooses how much a board shows. Projector-first: big type, high contrast, arrow keys.
// ─────────────────────────────────────────────────────────────────────────────

const clearInk = () => window.dispatchEvent(new Event("mt-ink-clear"));
const TEXT = "text-slate-900";

// ── Deck list ────────────────────────────────────────────────────────────────

function DeckIndex() {
  return (
    <div className="min-h-screen px-4 py-8" style={{ background: PAGE_BG }}>
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-800"><ArrowLeft size={15} />Home</Link>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Decks</h1>
        <p className="mt-1 text-slate-500">Whole lessons for the projector. Each deck stays in one place: no jumping out to a tool page.</p>
        <div className="mt-6 grid gap-3">
          {DECKS.map((d) => (
            <Link key={d.id} to={`/decks/${d.id}`} className="rounded-2xl border border-slate-300 bg-white p-5 shadow-card hover:shadow-lift transition-shadow">
              <div className="text-lg font-semibold text-slate-900">{d.title}</div>
              <div className="mt-0.5 text-sm text-slate-500">{d.summary}</div>
              <div className="mt-2 text-xs text-slate-400">{d.slides.length} slides</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Slide faces ──────────────────────────────────────────────────────────────

const Big = ({ children, className = "" }: { children: ReactNode; className?: string }) =>
  <div className={`${TEXT} ${className}`} style={{ fontSize: "clamp(1.5rem, 3.4vw, 3.4rem)", lineHeight: 1.25 }}>{children}</div>;

function Board({ grid, fill }: { grid: BoardGrid; fill: FillMode }) {
  const given = grid.given ?? 1;
  return (
    <table className="w-full border-collapse" style={{ fontSize: "clamp(1.2rem, min(2.6vw, 4.4vh), 3rem)" }}>
      <thead>
        <tr>{grid.head.map((h, i) => <th key={i} className="border border-slate-300 bg-slate-100 px-4 py-3 text-left font-semibold text-slate-800"><InlineMath text={h} /></th>)}</tr>
      </thead>
      <tbody>
        {grid.rows.map((row, r) => (
          <tr key={r}>
            {row.map((cell, c) => {
              const shown = fill === "filled" || (fill === "structure" && c < given);
              // a fixed height so the table never resizes between modes: the teacher is writing on it
              return <td key={c} className="border border-slate-300 px-4 text-slate-900" style={{ height: "1.9em" }}>{shown ? <InlineMath text={cell} /> : null}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const FILL_LABELS: [FillMode, string][] = [["filled", "Filled in"], ["structure", "Structure only"], ["blank", "Blank"]];

/** The corner control that sets how much of a board is filled in; changing it never touches the ink. */
function FillControl({ value, onChange }: { value: FillMode; onChange: (m: FillMode) => void }) {
  return (
    <div className="absolute right-3 top-3 flex rounded-full border border-slate-300 bg-white p-0.5 text-xs shadow-card" role="group" aria-label="How much is filled in">
      {FILL_LABELS.map(([m, label]) => (
        <button key={m} onClick={() => onChange(m)} aria-pressed={value === m}
          className={`rounded-full px-3 py-1.5 font-semibold transition-colors ${value === m ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{label}</button>
      ))}
    </div>
  );
}

interface Shown { latex: string; answer: string; working: { label: string; latex: string }[]; source: string }

const fromBank = (b: BankQuestion, n: number, total: number): Shown => ({ latex: b.latex, answer: b.answer, working: b.working, source: `Hand-picked ${n} of ${total}` });
const fromGenerated = (q: AnyQuestion): Shown => ({
  latex: q.kind === "simple" ? (q.displayLatex ?? q.display) : q.lines.join(" "),
  answer: q.answerLatex ?? q.answer,
  working: q.working.map((w) => ({ label: w.label ?? "", latex: w.latex })),
  source: "Generated",
});

function Practice({ slide, tool }: { slide: Extract<SlideConfig, { type: "practice" }>; tool: string }) {
  const bank = useMemo(() => slide.bank.map((id) => bankById(id)).filter((b): b is BankQuestion => !!b), [slide]);
  const [n, setN] = useState(0);                       // how many questions have been shown (0 = the first hand-picked one)
  const [gen, setGen] = useState<Shown | null>(null);
  const [answer, setAnswer] = useState(false);
  const [working, setWorking] = useState(false);
  const [teacher, setTeacher] = useState(false);

  const current: Shown | null = n < bank.length ? fromBank(bank[n], n + 1, bank.length) : gen;

  const refresh = useCallback(async () => {
    setAnswer(false); setWorking(false);
    const next = n + 1;
    if (next < bank.length) { setN(next); return; }                          // more hand-picked questions to come
    const generate = slide.generator ? await loadGenerator(tool) : null;
    if (generate && slide.generator) {
      const g = slide.generator;
      setGen(fromGenerated(generate(tool, g.level, g.variables ?? {}, g.dropdown ?? "", g.multiSelect ?? {})));
      setN(Math.max(next, bank.length));
    } else setN(bank.length ? next % bank.length : 0);                       // no generator: cycle the bank
  }, [n, bank, slide.generator, tool]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea,select")) return;
      if (e.key === "a") setAnswer((v) => !v);
      else if (e.key === "w") setWorking((v) => !v);
      else if (e.key === "r") void refresh();
      else if (e.key === "t") setTeacher((v) => !v);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [refresh]);

  if (!current) return <Big>This slide has no questions.</Big>;
  const btn = "inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-card hover:bg-slate-50";
  return (
    <div className="flex h-full flex-col">
      {slide.prompt && <div className="text-slate-500" style={{ fontSize: "clamp(1.1rem, 2vw, 2rem)" }}>{slide.prompt}</div>}
      <div className="flex flex-1 items-center justify-center">
        <div className={TEXT} style={{ fontSize: "clamp(2.2rem, 6vw, 6rem)" }}><MathRenderer latex={current.latex} style={{ fontSize: "1em" }} /></div>
      </div>
      <div className="min-h-[7rem]" style={{ fontSize: "clamp(1.2rem, 2.6vw, 2.6rem)" }}>
        {answer && <div className="text-center font-semibold text-blue-900">≈ <MathRenderer latex={current.answer} style={{ fontSize: "1em" }} /></div>}
        {working && <div className="mx-auto mt-3 max-w-2xl text-slate-700">{current.working.map((w, i) => (
          <div key={i} className="flex gap-4 border-b border-slate-200 py-1"><span className="w-56 shrink-0 text-slate-500">{w.label}</span><MathRenderer latex={w.latex} style={{ fontSize: "1em" }} /></div>))}</div>}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button className={btn} onClick={() => setAnswer((v) => !v)}>{answer ? <EyeOff size={16} /> : <Eye size={16} />}{answer ? "Hide answer" : "Show answer"}</button>
        <button className={btn} onClick={() => setWorking((v) => !v)}>{working ? "Hide working" : "Show working"}</button>
        <button className={btn} onClick={() => void refresh()}><RefreshCw size={16} />Another question</button>
        <button onClick={() => setTeacher((v) => !v)} className="ml-auto text-xs font-semibold text-slate-400 hover:text-slate-600">{teacher ? "Hide teacher notes" : "Teacher notes"}</button>
      </div>
      {teacher && (
        <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
          <span className="font-semibold">Catches:</span> {misconceptionLabel(slide.intention)} · <span className="font-semibold">Source:</span> {current.source}
        </div>
      )}
    </div>
  );
}

function Face({ slide, fill, setFill, tool }: { slide: SlideConfig; fill: FillMode; setFill: (m: FillMode) => void; tool: string }) {
  switch (slide.type) {
    case "title":
      return <div className="flex h-full flex-col items-center justify-center text-center"><h1 className="font-semibold text-slate-900" style={{ fontSize: "clamp(3rem, 8vw, 8rem)" }}>{slide.title}</h1>{slide.subtitle && <Big className="mt-4 text-slate-500">{slide.subtitle}</Big>}</div>;
    case "divider":
      return <div className="flex h-full flex-col items-center justify-center text-center"><h2 className="font-semibold text-slate-900" style={{ fontSize: "clamp(2.4rem, 6vw, 6rem)" }}>{slide.title}</h2>{slide.subtitle && <Big className="mt-3 text-slate-500">{slide.subtitle}</Big>}</div>;
    case "objective":
      return (
        <div className="flex h-full flex-col justify-center gap-6">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Learning objective</div>
          <Big className="font-semibold">{slide.objective}</Big>
          {slide.success && <ul className="space-y-2 text-slate-700" style={{ fontSize: "clamp(1.2rem, 2.4vw, 2.4rem)" }}>{slide.success.map((s, i) => <li key={i} className="flex gap-3"><span className="text-slate-400">•</span>{s}</li>)}</ul>}
        </div>
      );
    case "plenary":
      return (
        <div className="flex h-full flex-col justify-center gap-6">
          <h2 className="font-semibold text-slate-900" style={{ fontSize: "clamp(2rem, 4.4vw, 4.4rem)" }}>{slide.title ?? "Summary"}</h2>
          <ul className="space-y-3" style={{ fontSize: "clamp(1.3rem, 2.8vw, 2.8rem)" }}>{slide.points.map((p, i) => <li key={i} className="flex gap-3 text-slate-800"><span className="text-slate-400">•</span><InlineMath text={p} /></li>)}</ul>
        </div>
      );
    case "vocab":
      return (
        <div className="flex h-full flex-col justify-center gap-5">
          <h2 className="font-semibold text-slate-900" style={{ fontSize: "clamp(2rem, 4.4vw, 4.4rem)" }}>{slide.title ?? "Key vocabulary"}</h2>
          <dl className="space-y-4" style={{ fontSize: "clamp(1.2rem, 2.5vw, 2.5rem)" }}>{slide.terms.map((t, i) => (
            <div key={i} className="grid grid-cols-[minmax(8rem,22%)_1fr] gap-6 border-b border-slate-200 pb-3"><dt className="font-semibold text-violet-800">{t.term}</dt><dd className="text-slate-800"><InlineMath text={t.meaning} /></dd></div>))}</dl>
        </div>
      );
    case "definition":
      return (
        <div className="flex h-full flex-col justify-center gap-6">
          <div className="text-sm font-semibold uppercase tracking-wide text-violet-700">Key definition</div>
          <h2 className="font-semibold text-slate-900" style={{ fontSize: "clamp(2.4rem, 5.4vw, 5.4rem)" }}>{slide.term}</h2>
          <Big className="text-slate-800"><InlineMath text={slide.definition} /></Big>
        </div>
      );
    case "board":
      return (
        <div className="relative flex h-full flex-col gap-4">
          <FillControl value={fill} onChange={setFill} />
          <h2 className="pr-80 font-semibold text-slate-900" style={{ fontSize: "clamp(1.8rem, 3.6vw, 3.6rem)" }}><InlineMath text={slide.title} /></h2>
          {slide.prompt && <div className="text-slate-500" style={{ fontSize: "clamp(1.1rem, 2vw, 2rem)" }}>{slide.prompt}</div>}
          <div className="flex-1 min-h-0 overflow-auto"><Board grid={slide.grid} fill={fill} /></div>
        </div>
      );
    case "practice":
      return <Practice slide={slide} tool={tool} />;
  }
}

// ── The player ───────────────────────────────────────────────────────────────

function Player({ deck }: { deck: DeckDef }) {
  const [params, setParams] = useSearchParams();
  const total = deck.slides.length;
  const raw = Number(params.get("s") ?? 1);
  const index = Math.min(total - 1, Math.max(0, (Number.isFinite(raw) ? raw : 1) - 1));
  const [fills, setFills] = useState<Record<number, FillMode>>({});
  const [jump, setJump] = useState(false);
  const [full, setFull] = useState(false);
  const stage = useRef<HTMLDivElement>(null);

  const go = useCallback((i: number) => {
    const next = Math.min(total - 1, Math.max(0, i));
    if (next === index) return;
    clearInk();                                   // annotations belong to a slide
    setParams({ s: String(next + 1) }, { replace: true });
    setJump(false);
  }, [index, total, setParams]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input,textarea,select")) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); go(index + 1); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(index - 1); }
      else if (e.key === " " && !t.closest("button,a")) { e.preventDefault(); go(index + 1); }
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(total - 1);
      else if (e.key === "j") setJump((v) => !v);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [go, index, total]);

  useEffect(() => {
    const h = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);
  const toggleFull = () => { try { if (document.fullscreenElement) void document.exitFullscreen(); else void document.documentElement.requestFullscreen(); } catch { /* not allowed here */ } };

  const slide = deck.slides[index];
  const family = FAMILY_STYLE[FAMILY_OF[slide.type]];
  const fill: FillMode = fills[index] ?? (slide.type === "board" ? slide.fill ?? "filled" : "filled");
  const iconBtn = "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 shadow-card hover:bg-slate-50 disabled:opacity-40";

  return (
    <div className="flex h-screen flex-col px-4 py-3" style={{ background: PAGE_BG }}>
      <div className="flex items-center gap-3 pb-2">
        <Link to={deck.toolPath} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-800"><ArrowLeft size={15} />{deck.title}</Link>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500"><span className="h-2 w-2 rounded-full" style={{ background: family.colour }} />{family.label}</span>
        <div className="ml-auto flex items-center gap-2">
          <button className={iconBtn} onClick={() => setJump((v) => !v)} aria-label="Jump to a slide" title="Jump to a slide (J)"><ListOrdered size={18} /></button>
          <button className={iconBtn} onClick={toggleFull} aria-label={full ? "Leave full screen" : "Full screen"}>{full ? <Minimize size={18} /> : <Maximize size={18} />}</button>
        </div>
      </div>

      <div ref={stage} className="relative flex-1 min-h-0 rounded-2xl border border-slate-300 bg-white p-[clamp(1rem,3vw,3rem)] shadow-card" style={{ borderTop: `6px solid ${family.colour}` }}>
        <Face key={index} slide={slide} fill={fill} setFill={(m) => setFills((f) => ({ ...f, [index]: m }))} tool={deck.tool} />
        {jump && (
          <div className="absolute inset-0 z-20 overflow-auto rounded-2xl bg-white/95 p-6">
            <div className="mx-auto max-w-xl space-y-1">
              {deck.slides.map((s, i) => (
                <button key={i} onClick={() => go(i)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-lg ${i === index ? "bg-slate-100 font-semibold" : "hover:bg-slate-50"}`}>
                  <span className="w-6 text-sm text-slate-400">{i + 1}</span>
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: FAMILY_STYLE[FAMILY_OF[s.type]].colour }} />
                  <span className="truncate text-slate-800"><InlineMath text={slideTitle(s)} /></span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 pt-3 pr-16">   {/* room for the ink pencil, which docks at the bottom right */}
        <button className={iconBtn} onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous slide"><ChevronLeft size={20} /></button>
        <div className="flex flex-1 items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full" style={{ width: `${((index + 1) / total) * 100}%`, background: family.colour }} /></div>
          <span className="text-sm font-semibold tabular-nums text-slate-500">{index + 1} / {total}</span>
        </div>
        <button className={iconBtn} onClick={() => go(index + 1)} disabled={index === total - 1} aria-label="Next slide"><ChevronRight size={20} /></button>
      </div>
    </div>
  );
}

export default function DeckPage() {
  const { id } = useParams();
  useEffect(() => { document.title = id ? `${deckById(id)?.title ?? "Deck"} · Maths Tools` : "Decks · Maths Tools"; }, [id]);
  if (!id) return <DeckIndex />;
  const deck = deckById(id);
  if (!deck) return <div className="p-8"><Link to="/decks" className="font-semibold text-blue-900">← No such deck. See all decks</Link></div>;
  return <Player deck={deck} />;
}
