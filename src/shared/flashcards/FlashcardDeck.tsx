// Flashcards for Further Maths: choose a set of cards, flip, say whether you knew it, and the cards you did not know come back sooner. The ratings are kept on the student's
// device (store.ts), nothing leaves it. Every card has a header (Definition, Formula, Derive…), is essential or derived, and can carry a mechanics diagram. Design:
// specs/flashcards/further-mechanics-mc.md. The page around it (title, Home) is the tool's.
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Eye, Shuffle } from "lucide-react";
import { useLayoutMode } from "../layoutMode";
import { MechDiagram } from "../mechanics";
import { MathText } from "./MathText";
import { buildSession, promptsOf, rate, tally, weakestStatements, type Memory } from "./schedule";
import { clearMemory, loadMemory, loadPrefs, saveMemory, savePrefs, type Prefs } from "./store";
import type { CardKind, CardSet, Prompt, Rating } from "./types";

/** The header of each kind of card: its name and its colours (the word is always shown, so colour is never the only cue). */
const HEADER: Record<CardKind, { label: string; tone: string }> = {
  definition: { label: "Definition", tone: "border-indigo-200 bg-indigo-50 text-indigo-800" },
  formula: { label: "Formula", tone: "border-blue-200 bg-blue-50 text-blue-800" },
  derive: { label: "Derive", tone: "border-violet-200 bg-violet-50 text-violet-800" },
  property: { label: "Property", tone: "border-teal-200 bg-teal-50 text-teal-800" },
  unit: { label: "Unit", tone: "border-slate-300 bg-slate-100 text-slate-700" },
  method: { label: "Method", tone: "border-amber-200 bg-amber-50 text-amber-900" },
  error: { label: "Common error", tone: "border-rose-200 bg-rose-50 text-rose-800" },
  diagram: { label: "Diagram", tone: "border-emerald-200 bg-emerald-50 text-emerald-800" },
};
const KINDS = Object.keys(HEADER) as CardKind[];
const SIZES: (number | null)[] = [10, 20, null];

const chip = (on: boolean) =>
  `inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors ${on ? "border-blue-900 bg-blue-900 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"}`;
const panel = "rounded-2xl border border-slate-300 bg-white shadow-card";
const heading = "text-xs font-semibold uppercase tracking-wide text-slate-500";

type Stage = "setup" | "run" | "done";
interface Result { key: string; statement: string; rating: Rating }

/** Text size follows the length of what is on the card, so a short formula is large and a sentence still fits a phone. */
const sizeFor = (t: string): string => (t.length > 150 ? "text-lg" : t.length > 80 ? "text-xl" : "text-2xl");

const reduceMotion = (): boolean => { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } };

const face: CSSProperties = { gridArea: "1 / 1", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" };

export default function FlashcardDeck({ set }: { set: CardSet }) {
  const { phone } = useLayoutMode();
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs(set.id));
  const [mem, setMem] = useState<Memory>(() => loadMemory(set.id));
  const [stage, setStage] = useState<Stage>("setup");
  const [queue, setQueue] = useState<Prompt[]>([]);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [confirmReset, setConfirmReset] = useState(false);
  const requeued = useRef<Set<string>>(new Set());
  const cardRef = useRef<HTMLDivElement>(null);

  const update = (p: Partial<Prefs>) => { const next = { ...prefs, ...p }; setPrefs(next); savePrefs(set.id, next); };

  // the cards the chosen filters leave, and the prompts they make (a card and a direction)
  const inScope = (c: CardSet["cards"][number], p: Prefs, ignore?: "tier") =>
    (p.statements.length === 0 || p.statements.includes(c.statement)) && (p.course === "all" || c.course === "AS") && (p.kinds.length === 0 || p.kinds.includes(c.kind)) && (ignore === "tier" || p.tier === "all" || c.tier === "essential");
  const cards = useMemo(() => set.cards.filter((c) => inScope(c, prefs)), [set.cards, prefs]);
  const prompts = useMemo(() => promptsOf(cards, prefs.bothWays), [cards, prefs.bothWays]);
  const now = Date.now();
  const counts = tally(prompts.map((p) => p.key), mem, now);
  const byKey = useMemo(() => new Map(prompts.map((p) => [p.key, p])), [prompts]);

  const begin = useCallback((list: Prompt[]) => {
    requeued.current = new Set();
    setQueue(list); setPos(0); setFlipped(false); setResults([]); setStage(list.length ? "run" : "setup");
  }, []);

  const start = () => begin(buildSession(prompts.map((p) => p.key), mem, Date.now(), prefs.size).flatMap((k) => (byKey.get(k) ? [byKey.get(k)!] : [])));

  const current = queue[pos];
  const answer = useCallback((rating: Rating) => {
    if (!current) return;
    const next = rate(mem, current.key, rating, Date.now());
    setMem(next); saveMemory(set.id, next);
    setResults((r) => [...r.filter((x) => x.key !== current.key), { key: current.key, statement: current.card.statement, rating }]);
    // a card marked Not yet comes round once more before the session ends
    if (rating === "again" && !requeued.current.has(current.key)) { requeued.current.add(current.key); setQueue((q) => [...q, current]); }
    setFlipped(false);
    setPos((p) => p + 1);
  }, [current, mem, set.id]);

  // when the card turns over on a phone the card can be taller than the screen: keep it in view
  useEffect(() => { if (flipped) cardRef.current?.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "nearest" }); }, [flipped]);
  // finished when the pointer passes the end of the (possibly extended) queue
  useEffect(() => { if (stage === "run" && pos >= queue.length && queue.length > 0) setStage("done"); }, [stage, pos, queue.length]);

  useEffect(() => {
    if (stage !== "run") return;
    const h = (e: KeyboardEvent) => {
      if (e.target !== document.body) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); setFlipped((f) => !f); }
      else if (flipped && e.key === "1") answer("again");
      else if (flipped && e.key === "2") answer("got");
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [stage, flipped, answer]);

  const toggle = <T,>(list: T[], v: T): T[] => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  // ── setup ──────────────────────────────────────────────────────────────────────────────────────
  if (stage === "setup") {
    const kindsPresent = KINDS.filter((k) => set.cards.some((c) => c.kind === k));
    const countOf = (code: string) => set.cards.filter((c) => c.statement === code && inScope({ ...c, statement: code }, { ...prefs, statements: [], kinds: [] })).length;
    const tierCount = (tier: "essential" | "all") => promptsOf(set.cards.filter((c) => inScope(c, { ...prefs, tier })), false).length;
    const size = prefs.size ?? prompts.length;
    return (
      <div className="space-y-4">
        <section className={`${panel} p-4 sm:p-5`}>
          <h2 className={heading}>Cards</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className={chip(prefs.tier === "essential")} onClick={() => update({ tier: "essential" })}>Essentials only <span className="text-xs opacity-70">{tierCount("essential")}</span></button>
            <button type="button" className={chip(prefs.tier === "all")} onClick={() => update({ tier: "all" })}>Essentials and derivations <span className="text-xs opacity-70">{tierCount("all")}</span></button>
          </div>
          <p className="mt-2 text-sm text-slate-500">Essentials are the results and facts to know. Derivations ask you to work something out from them: good practice, but not for memorising.</p>

          <h2 className={`${heading} mt-5`}>Statements</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className={chip(prefs.statements.length === 0)} onClick={() => update({ statements: [] })}>All</button>
            {set.statements.map((s) => (
              <button key={s.code} type="button" title={s.name} className={chip(prefs.statements.includes(s.code))} onClick={() => update({ statements: toggle(prefs.statements, s.code) })}>
                {s.code} <span className="font-normal opacity-80">{s.name}</span> <span className="text-xs opacity-70">{countOf(s.code)}</span>
              </button>
            ))}
          </div>

          <h2 className={`${heading} mt-5`}>Course</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className={chip(prefs.course === "AS")} onClick={() => update({ course: "AS" })}>AS cards only</button>
            <button type="button" className={chip(prefs.course === "all")} onClick={() => update({ course: "all" })}>AS and A2</button>
          </div>

          <h2 className={`${heading} mt-5`}>Kinds of card</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className={chip(prefs.kinds.length === 0)} onClick={() => update({ kinds: [] })}>All</button>
            {kindsPresent.map((k) => <button key={k} type="button" className={chip(prefs.kinds.includes(k))} onClick={() => update({ kinds: toggle(prefs.kinds, k) })}>{HEADER[k].label}</button>)}
          </div>

          <h2 className={`${heading} mt-5`}>Session</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {SIZES.map((n) => <button key={String(n)} type="button" className={chip(prefs.size === n)} onClick={() => update({ size: n })}>{n == null ? "Every card" : `${n} cards`}</button>)}
            <button type="button" className={chip(prefs.bothWays)} aria-pressed={prefs.bothWays} onClick={() => update({ bothWays: !prefs.bothWays })}>
              <Shuffle size={15} /> Both ways round
            </button>
          </div>
        </section>

        <section className={`${panel} flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5`}>
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{prompts.length}</span> cards in this choice
            {counts.new > 0 && <> · <span className="font-semibold text-slate-900">{counts.new}</span> new</>}
            {counts.learning + counts.due > 0 && <> · <span className="font-semibold text-slate-900">{counts.learning + counts.due}</span> to revisit</>}
          </p>
          <button type="button" disabled={prompts.length === 0} onClick={start}
            className="min-h-[44px] rounded-xl bg-blue-900 px-6 text-sm font-semibold text-white shadow-card transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300">
            {prompts.length === 0 ? "No cards match" : `Start · ${Math.min(size, prompts.length)} cards`}
          </button>
        </section>

        <div className="flex flex-wrap items-center gap-3 px-1 text-sm text-slate-500">
          <span>Your ratings are kept on this device only.</span>
          {!confirmReset
            ? <button type="button" className="font-semibold text-slate-600 underline-offset-2 hover:underline" onClick={() => setConfirmReset(true)}>Reset my progress</button>
            : <span className="inline-flex items-center gap-2">
                Forget every rating for this set?
                <button type="button" className="font-semibold text-red-700 hover:underline" onClick={() => { clearMemory(set.id); setMem({}); setConfirmReset(false); }}>Yes, reset</button>
                <button type="button" className="font-semibold text-slate-600 hover:underline" onClick={() => setConfirmReset(false)}>Cancel</button>
              </span>}
        </div>
      </div>
    );
  }

  // ── finished ───────────────────────────────────────────────────────────────────────────────────
  if (stage === "done") {
    const n = (r: Rating) => results.filter((x) => x.rating === r).length;
    const weak = weakestStatements(results);
    const missed = results.filter((r) => r.rating !== "got").flatMap((r) => (byKey.get(r.key) ? [byKey.get(r.key)!] : []));
    return (
      <div className="space-y-4">
        <section className={`${panel} p-5 text-center`}>
          <h2 className="text-2xl font-semibold text-slate-900">Session complete</h2>
          <div className="mx-auto mt-4 grid max-w-sm grid-cols-2 gap-3">
            {([["got", "Got it", "text-emerald-700"], ["again", "Not yet", "text-red-700"]] as const).map(([r, label, tone]) => (
              <div key={r} className="rounded-xl border border-slate-200 bg-slate-50 py-3">
                <div className={`text-3xl font-semibold ${tone}`}>{n(r)}</div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
              </div>
            ))}
          </div>
          {weak.length > 0 && (
            <p className="mt-4 text-sm text-slate-600">
              Go back over: {weak.slice(0, 3).map((w, i) => <span key={w.statement}>{i > 0 && ", "}<span className="font-semibold text-slate-900">{w.statement}</span> ({w.missed} of {w.of})</span>)}
            </p>
          )}
        </section>
        <div className="flex flex-wrap justify-center gap-2">
          {missed.length > 0 && <button type="button" className="min-h-[44px] rounded-xl bg-blue-900 px-5 text-sm font-semibold text-white shadow-card hover:bg-blue-800" onClick={() => begin(missed)}>Practise the {missed.length} I missed</button>}
          <button type="button" className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:border-slate-400" onClick={start}>New session</button>
          <button type="button" className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:border-slate-400" onClick={() => setStage("setup")}>Change the choice</button>
        </div>
      </div>
    );
  }

  // ── a card ─────────────────────────────────────────────────────────────────────────────────────
  if (!current) return null;
  const { card, reversed } = current;
  const front = reversed ? card.back : card.front;
  const back = reversed ? card.front : card.back;
  const pic = card.picture;
  const header = reversed ? "Name it" : HEADER[card.kind].label;
  const headerTone = reversed ? "border-slate-300 bg-slate-100 text-slate-700" : HEADER[card.kind].tone;
  const showPicFront = !!pic && (pic.on === "front" || pic.on === "both");
  const showPicBack = !!pic && (pic.on === "back" || pic.on === "both");
  const motion = reduceMotion() ? "none" : "transform 0.55s cubic-bezier(0.4, 0.1, 0.2, 1)";

  const top = (answerSide: boolean) => (
    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
      <span className={`rounded-full border px-3 py-1 text-sm uppercase tracking-wide ${headerTone}`}>{header}</span>
      <span className="inline-flex items-center gap-1.5 text-slate-500"><span className="h-2 w-2 rounded-full bg-indigo-500" />{card.statement}</span>
      {card.course === "A2" && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-violet-800">A2</span>}
      {card.tier === "derived" && card.kind !== "derive" && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">Derived</span>}
      {answerSide && <span className="ml-auto text-emerald-700">Answer</span>}
    </div>
  );
  const picture = (answerSide: boolean) => <div className={`mx-auto w-full ${phone ? "max-w-[300px]" : "max-w-[420px]"}`}><MechDiagram scene={pic!.scene} size="board" showAnswer={answerSide} /></div>;

  const buttons = !flipped ? (
    <button type="button" onClick={() => setFlipped(true)} className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-blue-900 text-sm font-semibold text-white shadow-card hover:bg-blue-800">
      <Eye size={18} /> Turn over
    </button>
  ) : (
    <div className="grid grid-cols-2 gap-3">
      <button type="button" onClick={() => answer("again")} className="flex min-h-[48px] flex-col items-center justify-center rounded-xl border border-red-300 bg-red-50 text-sm font-semibold leading-tight text-red-800 hover:bg-red-100">
        Not yet{!phone && <span className="text-[10px] font-normal opacity-60">press 1</span>}
      </button>
      <button type="button" onClick={() => answer("got")} className="flex min-h-[48px] flex-col items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 text-sm font-semibold leading-tight text-emerald-900 hover:bg-emerald-100">
        Got it{!phone && <span className="text-[10px] font-normal opacity-60">press 2</span>}
      </button>
    </div>
  );

  return (
    <div className={`space-y-4 ${phone ? "pb-24" : ""}`}>
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-900 transition-all" style={{ width: `${(pos / queue.length) * 100}%` }} /></div>
        <span className="text-xs font-semibold tabular-nums text-slate-500">{pos + 1} / {queue.length}</span>
        <button type="button" onClick={() => setStage("setup")} className="text-xs font-semibold text-slate-500 hover:text-slate-800">End</button>
      </div>

      {/* the card: two faces in one grid cell, so it is as tall as the taller face; the whole card turns over about its vertical axis */}
      <div ref={cardRef} key={current.key} style={{ perspective: "1600px" }} onClick={() => setFlipped((f) => !f)} className="cursor-pointer" role="group" aria-label={flipped ? "Answer side of the card" : "Question side of the card"}>
        <div style={{ display: "grid", transformStyle: "preserve-3d", transition: motion, transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
          <section style={face} aria-hidden={flipped} className={`${panel} flex min-h-[320px] flex-col p-5 sm:p-7`}>
            {top(false)}
            <div className="mt-5 flex flex-1 flex-col justify-center gap-5">
              <p className={`${sizeFor(front)} text-center font-semibold leading-snug text-slate-900`}><MathText text={front} /></p>
              {showPicFront && picture(false)}
            </div>
            <p className="mt-4 text-center text-xs text-slate-400">Tap the card, or press space, to turn it over</p>
          </section>
          <section style={{ ...face, transform: "rotateY(180deg)" }} aria-hidden={!flipped} className={`${panel} flex min-h-[320px] flex-col p-5 sm:p-7`}>
            {top(true)}
            <div className="mt-5 flex flex-1 flex-col justify-center gap-5">
              <p className="text-center text-sm font-semibold text-slate-500"><MathText text={front} /></p>
              {showPicBack && picture(true)}
              <p className={`${sizeFor(back)} text-center font-semibold leading-snug text-slate-900`}><MathText text={back} /></p>
              {card.note && <p className="text-center text-sm text-slate-500"><MathText text={card.note} /></p>}
            </div>
          </section>
        </div>
      </div>

      {phone
        ? <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-4 pt-3 backdrop-blur" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>{buttons}</div>
        : <div className="mx-auto max-w-md">{buttons}</div>}
    </div>
  );
}
