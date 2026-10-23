import { useEffect, useMemo, useState } from "react";
import { Info, Printer, RefreshCw, Settings, Check, X, LayoutGrid, SkipForward, Repeat2, BookOpen, Search } from "lucide-react";
import { InfoModal, MathRenderer, type InfoSection } from "../../shared";
import { useLayoutMode } from "../../shared/layoutMode";
import { PAGE_BG } from "../../shared/colors";
import { PicView } from "../../shared/mathsWords/Pics";
import { ClueView } from "../../shared/mathsWords/ClueView";
import { optionChip } from "../../shared/mathsWords/WordFilters";
import { SetupScreen } from "../../shared/mathsWords/SetupScreen";
import {
  PACKS, KEY_STAGES, ALL_WORDS, CONFLICTS, mulberry32, pickClueIndex,
  type MathsWord as BingoWord, type ClueKind, type PackId, type Ks, type WordFilter,
} from "../../shared/mathsWords/words";
import {
  WIN_MODES, BOARD_SIZE, buildBoard, maxBoardSize, newRoundOrder, checkClaim, swapWord, type WinMode,
} from "./WordsBingoData";

const INFO_SECTIONS: InfoSection[] = [
  {
    title: "How to play", icon: "🎯",
    content: [
      { label: "The board", detail: "All 25 words are shown full screen. Students choose 9 and write them in a 3×3 grid." },
      { label: "Cycle out unknown words", detail: "If the class hasn't met a word yet, tap it on the board to swap it for a fresh one before you start. During the game, Skip for now sends a word to later in the deck with a different clue." },
      { label: "Calling", detail: "Start collapses the board to leave just the clue. The class sees a definition, a symbol or a picture and works out which word it is. Reveal word flips the answer over." },
      { label: "Winning", detail: "The first student to complete the chosen pattern shouts bingo. Check bingo verifies the words they claim." },
    ],
  },
  {
    title: "Options", icon: "⚙️",
    content: [
      { label: "Topic packs", detail: "Pick one pack or mix several. A mixed board takes an even share from each." },
      { label: "Clue types", detail: "Definitions, symbols and numbers, pictures. Pictures only suits weaker readers." },
      { label: "Thinking time", detail: "An optional ring counts down on each clue and flips the word when time is up." },
    ],
  },
  {
    title: "Fair play", icon: "⚖️",
    content: [
      { label: "No ambiguous boards", detail: "Words that could share a clue (square and rectangle, addition and sum…) never appear on the same board." },
      { label: "Show board", detail: "Brings the 25 words back up during the game, with the ones already revealed ticked." },
    ],
  },
];

const KINDS_ALL: ClueKind[] = ["def", "sym", "pic"];
const PACKS_ALL: PackId[] = PACKS.map(p => p.id);
const TIMERS = [0, 10, 20, 30];

const readParams = () => {
  const q = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const packs = (q.get("packs") ?? "").split(",").filter((p): p is PackId => PACKS_ALL.includes(p as PackId));
  const kinds = (q.get("clues") ?? "").split(",").filter((k): k is ClueKind => KINDS_ALL.includes(k as ClueKind));
  const win = WIN_MODES.find(w => w.id === q.get("win"))?.id ?? "line";
  const ks = (q.get("ks") ?? "").split(",").map(Number).filter((k): k is Ks => k === 2 || k === 3 || k === 4);
  const seed = Number(q.get("seed"));
  const timer = Number(q.get("timer"));
  return {
    packs: packs.length ? packs : PACKS_ALL.slice(),
    kinds: kinds.length ? kinds : KINDS_ALL.slice(),
    ks: ks.length ? ks : ([2] as Ks[]),
    win: win as WinMode,
    timer: TIMERS.includes(timer) ? timer : 0,
    seed: Number.isFinite(seed) && seed > 0 ? seed : 0,
  };
};

const CSS = `
@keyframes wb-pop{0%{opacity:0;transform:scale(.6) translateY(14px)}70%{transform:scale(1.04)}100%{opacity:1;transform:none}}
@keyframes wb-out{0%{opacity:1;transform:none}100%{opacity:0;transform:scale(.3) translateY(60px)}}
@keyframes wb-in{0%{opacity:0;transform:translateY(24px) scale(.92)}100%{opacity:1;transform:none}}
@keyframes wb-flip{0%{opacity:0;transform:perspective(500px) rotateX(-90deg)}100%{opacity:1;transform:perspective(500px) rotateX(0)}}
@keyframes wb-bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-18px);opacity:1}}
@keyframes wb-ring{from{stroke-dashoffset:0}to{stroke-dashoffset:176}}
@keyframes wb-fall{0%{transform:translateY(-10vh) rotate(0);opacity:1}100%{transform:translateY(105vh) rotate(720deg);opacity:.9}}
@keyframes wb-shake{0%,100%{transform:none}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
.wb-pop{animation:wb-pop .45s both}.wb-out{animation:wb-out .45s both}.wb-in{animation:wb-in .4s both}
.wb-flip{animation:wb-flip .5s both}.wb-shake{animation:wb-shake .35s}
`;

interface Call { id: string; clueIdx: number }
type Phase = "setup" | "board" | "play" | "bank";

export default function WordsBingo() {
  const init = useMemo(readParams, []);
  const { phone } = useLayoutMode();

  const [packs, setPacks] = useState<PackId[]>(init.packs);
  const [kinds, setKinds] = useState<ClueKind[]>(init.kinds);
  const [ks, setKs] = useState<Ks[]>(init.ks);
  const filter: WordFilter = { packs, kinds, ks };
  const [win, setWin] = useState<WinMode>(init.win);
  const [timer, setTimer] = useState(init.timer);

  const [phase, setPhase] = useState<Phase>("setup");
  const [seed, setSeed] = useState(0);
  const [board, setBoard] = useState<BingoWord[]>([]);
  const [cycled, setCycled] = useState<string[]>([]);
  const [swapKey, setSwapKey] = useState<Record<string, number>>({});
  const [shake, setShake] = useState("");
  const [collapsing, setCollapsing] = useState(false);
  const [order, setOrder] = useState<string[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [used, setUsed] = useState<Record<string, number[]>>({});
  const [revealed, setRevealed] = useState<string[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [info, setInfo] = useState(false);
  const [bankFrom, setBankFrom] = useState<Phase>("setup");
  const [bankPack, setBankPack] = useState<PackId | "all">("all");
  const [query, setQuery] = useState("");
  const [bankKs, setBankKs] = useState<Ks[]>([2, 3, 4]);

  const openBank = (from: Phase) => { setBankFrom(from); setPhase("bank"); };

  const available = maxBoardSize(filter);
  const byId = useMemo(() => new Map(ALL_WORDS.map(w => [w.id, w])), []);
  const current = calls.length > 0 ? calls[calls.length - 1] : null;
  const currentWord = current ? byId.get(current.id)! : null;
  const called = useMemo(() => new Set(calls.map(c => c.id)), [calls]);
  const isRevealed = !!current && revealed.includes(current.id);
  const need = WIN_MODES.find(m => m.id === win)!;

  // Thinking-time timer: flip the word when it runs out.
  useEffect(() => {
    if (phase !== "play" || !timer || !current || drawing || isRevealed || finished) return;
    const t = window.setTimeout(() => setRevealed(r => (r.includes(current.id) ? r : [...r, current.id])), timer * 1000);
    return () => window.clearTimeout(t);
  }, [phase, timer, current, drawing, isRevealed, finished]);

  const writeUrl = (s: number) => {
    const q = new URLSearchParams({ packs: packs.join(","), clues: kinds.join(","), ks: ks.join(","), win, timer: String(timer), seed: String(s) });
    window.history.replaceState(null, "", `${window.location.pathname}?${q}`);
  };

  const buildNew = (withSeed = 0) => {
    const s = withSeed || Math.floor(Math.random() * 900000) + 100000;
    const b = buildBoard(filter, mulberry32(s));
    if (!b) return;
    setSeed(s); setBoard(b); setCycled([]); setSwapKey({}); setPhase("board"); setCollapsing(false);
    writeUrl(s);
  };

  const swap = (id: string) => {
    const w = swapWord(board, id, filter, new Set(cycled), Math.random);
    if (!w) { setShake(id); window.setTimeout(() => setShake(""), 400); return; }
    setBoard(board.map(b => (b.id === id ? w : b)));
    setCycled([...cycled, id]);
    setSwapKey({ ...swapKey, [w.id]: (swapKey[w.id] ?? 0) + 1 });
  };

  const callAt = (ord: string[], index: number, prevUsed: Record<string, number[]>, prevCalls: Call[]) => {
    const id = ord[index];
    const w = board.find(b => b.id === id)!;
    const clueIdx = pickClueIndex(w, kinds, prevUsed, Math.random);
    setDrawing(true);
    window.setTimeout(() => setDrawing(false), 650);
    setCalls([...prevCalls, { id, clueIdx }]);
    setUsed({ ...prevUsed, [id]: [...(prevUsed[id] ?? []), clueIdx] });
  };

  const beginRound = (fresh: boolean) => {
    const ord = newRoundOrder(board, mulberry32((seed || 1) + (fresh ? Math.floor(Math.random() * 1e6) : 1)));
    setOrder(ord); setRevealed([]); setFinished(false); setClaiming(false); setShowBoard(false);
    setPhase("play");
    callAt(ord, 0, fresh ? used : {}, []);
  };

  const startCalling = () => {
    setCollapsing(true);
    window.setTimeout(() => { setCollapsing(false); setUsed({}); beginRound(false); }, 600);
  };

  const next = () => {
    if (!current) return;
    const rev = revealed.includes(current.id) ? revealed : [...revealed, current.id];
    setRevealed(rev);
    if (calls.length < order.length) callAt(order, calls.length, used, calls);
    else setFinished(true);
  };

  const reveal = () => { if (current && !isRevealed) setRevealed([...revealed, current.id]); };

  // "Not known yet": send this word later in the deck; it returns with a different clue.
  const skip = () => {
    if (!current || calls.length >= order.length) return;
    const rest = order.slice(calls.length);                 // words not yet called
    const at = calls.length + 1 + Math.floor(Math.random() * rest.length);
    const ord = order.filter(id => id !== current.id);
    ord.splice(Math.min(at - 1, ord.length), 0, current.id);
    const before = calls.slice(0, -1);
    setOrder(ord);
    callAt(ord, before.length, used, before);
  };


  const printSheet = () => {
    const w2 = window.open("", "_blank");
    if (!w2) return;
    const words = board.map(w => `<li>${w.word}</li>`).join("");
    const cells = Array.from({ length: 9 }, () => "<div class='c'></div>").join("");
    w2.document.write(`<!doctype html><html><head><title>Maths Words Bingo</title><style>
      body{font-family:system-ui,sans-serif;margin:24mm 18mm}
      h1{font-size:22pt;margin:0 0 4mm}p{margin:0 0 6mm;color:#475569}
      ul{columns:5;list-style:none;padding:0;margin:0 0 10mm;font-size:13pt}li{margin:0 0 3mm}
      .g{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:2px solid #1e3a8a;width:150mm;margin:0 auto}
      .c{height:42mm;border:1px solid #1e3a8a}
    </style></head><body><h1>Maths Words Bingo</h1>
    <p>Choose 9 of these words and write them in the grid. Listen to the clues!</p>
    <ul>${words}</ul><div class="g">${cells}</div></body></html>`);
    w2.document.close(); w2.focus(); w2.print();
  };

  const topBtn = "flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-slate-600 hover:bg-white";

  // ── Setup ──────────────────────────────────────────────────────────────────
  if (phase === "setup") {
    const chip = optionChip;
    return (
      <>
        <SetupScreen
          title="Maths Words Bingo" subtitle="Choose 9 words from the board. Watch the clues."
          filter={filter} onFilter={f => { setPacks(f.packs); setKinds(f.kinds); setKs(f.ks); }}
          available={available} needed={BOARD_SIZE}
          startLabel="Show the 25 words" onStart={() => buildNew(init.seed && !seed ? init.seed : 0)} onInfo={() => setInfo(true)}
          actions={<button onClick={() => openBank("setup")} className={topBtn}><BookOpen size={18} />Word bank</button>}
          optionsTitle="Bingo is…"
        >
          <div className="grid gap-3">
            {WIN_MODES.map(m => (
              <button key={m.id} className={chip(win === m.id)} onClick={() => setWin(m.id)}>
                <div className="font-semibold text-slate-900">{m.name}</div>
                <div className="text-sm text-slate-500">{m.blurb}</div>
              </button>
            ))}
          </div>
          <h2 className="font-semibold text-slate-900 mt-5 mb-3">Thinking time per clue</h2>
          <div className="grid grid-cols-4 gap-2">
            {TIMERS.map(t => (
              <button key={t} className={`${chip(timer === t)} !p-3 text-center font-semibold text-slate-900`} onClick={() => setTimer(t)}>
                {t === 0 ? "Off" : `${t}s`}
              </button>
            ))}
          </div>
        </SetupScreen>
        {info && <InfoModal infoSections={INFO_SECTIONS} onClose={() => setInfo(false)} />}
      </>
    );
  }

  // ── Word bank: every word and every clue ───────────────────────────────────
  if (phase === "bank") {
    const q = query.trim().toLowerCase();
    const shown = ALL_WORDS.filter(w =>
      (bankPack === "all" || w.pack === bankPack) && bankKs.includes(w.ks) &&
      (!q || w.word.toLowerCase().includes(q) || w.clues.some(c => c.k === "def" && c.s.toLowerCase().includes(q))));
    const clash = (id: string) => CONFLICTS.filter(g => g.includes(id)).flat().filter(x => x !== id).map(x => byId.get(x)!.word);
    const tab = (on: boolean) => `px-3 py-2 font-semibold border-b-2 whitespace-nowrap ${on ? "border-blue-900 text-blue-900" : "border-transparent text-slate-500 hover:text-slate-800"}`;
    return (
      <div className="min-h-screen" style={{ background: PAGE_BG }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-4 pb-12">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setPhase(bankFrom)} className={topBtn}><X size={18} />Close</button>
            <span className="text-slate-500 text-sm">{shown.length} of {ALL_WORDS.length} words</span>
          </div>
          <h1 className="text-3xl font-semibold text-slate-900 mb-4">Word bank</h1>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 mb-4">
            <div className="flex overflow-x-auto">
              <button className={tab(bankPack === "all")} onClick={() => setBankPack("all")}>All</button>
              {PACKS.map(p => (
                <button key={p.id} className={tab(bankPack === p.id)} onClick={() => setBankPack(p.id)}>
                  {p.name} <span className="text-slate-400 font-normal">{ALL_WORDS.filter(w => w.pack === p.id).length}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-1 mb-2">
              {KEY_STAGES.map(k => (
                <button key={k.id} onClick={() => setBankKs(bankKs.includes(k.id) ? bankKs.filter(x => x !== k.id) : [...bankKs, k.id])}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${bankKs.includes(k.id) ? "border-sky-500 bg-sky-50 text-sky-900" : "border-slate-300 bg-white text-slate-400"}`}>
                  {k.name}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 mb-2">
              <Search size={16} className="text-slate-400" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search words or definitions" className="outline-none text-sm w-56 bg-transparent" />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map(w => {
              const apart = clash(w.id);
              return (
                <div key={w.id} className="rounded-2xl border border-slate-300 shadow-card bg-white p-4">
                  <div className="flex items-baseline justify-between gap-2 mb-2">
                    <h2 className="font-semibold text-slate-900 text-lg">{w.word}</h2>
                    <span className="text-xs text-slate-400">{PACKS.find(p => p.id === w.pack)!.name} · KS{w.ks}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {w.clues.map((c, i) => (
                      <div key={i} className="rounded-xl bg-slate-50 px-3 py-2 text-slate-800">
                        {c.k === "def" && <span className="text-sm">{c.s}</span>}
                        {c.k === "sym" && <div className="text-xl"><MathRenderer latex={c.s} /></div>}
                        {c.k === "pic" && <div className="mx-auto" style={{ height: 90, maxWidth: 220 }}><PicView p={c.p} /></div>}
                      </div>
                    ))}
                  </div>
                  {apart.length > 0 && <p className="text-xs text-slate-400 mt-2">Never on the same board as: {apart.join(", ")}</p>}
                </div>
              );
            })}
            {shown.length === 0 && <p className="text-slate-500">No words match.</p>}
          </div>
        </div>
      </div>
    );
  }

  // ── Board: all 25 words, full screen ───────────────────────────────────────
  const boardGrid = (interactive: boolean) => (
    <div className={`flex-1 min-h-0 grid gap-2 sm:gap-3 ${phone ? "grid-cols-3 overflow-auto content-start" : "grid-cols-5 grid-rows-5"}`}>
      {board.map((w, i) => {
        const done = revealed.includes(w.id);
        return (
          <button
            key={`${w.id}-${swapKey[w.id] ?? 0}`}
            disabled={!interactive}
            onClick={() => interactive && swap(w.id)}
            className={`relative rounded-2xl border shadow-card flex items-center justify-center text-center font-semibold leading-tight px-2 transition-colors
              ${collapsing ? "wb-out" : swapKey[w.id] ? "wb-flip" : "wb-pop"} ${shake === w.id ? "wb-shake" : ""}
              ${done ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-white text-slate-800"}
              ${interactive ? "hover:border-sky-400 hover:bg-sky-50 active:scale-95" : "cursor-default"}`}
            style={{
              animationDelay: collapsing ? `${(i % 5) * 30 + Math.floor(i / 5) * 20}ms` : swapKey[w.id] ? "0ms" : `${i * 22}ms`,
              fontSize: phone ? "1rem" : "clamp(1rem, 2.2vw, 2.3rem)",
              minHeight: phone ? 64 : undefined,
            }}
          >
            {w.word}
            {done && <Check size={18} className="absolute top-2 right-2" />}
            {interactive && !phone && <Repeat2 size={16} className="absolute top-2 right-2 text-slate-300" />}
          </button>
        );
      })}
    </div>
  );

  if (phase === "board") {
    return (
      <div className="fixed inset-0 z-30 flex flex-col p-3 sm:p-5 gap-3" style={{ background: PAGE_BG }}>
        <style>{CSS}</style>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-3xl font-semibold text-slate-900">Choose 9 of these words</h1>
            <p className="text-sm sm:text-base text-slate-500">Don't know a word yet? Tap it to swap it out.</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={printSheet} data-trusted-click title="Print sheet" className={topBtn}><Printer size={18} />{!phone && "Print"}</button>
            <button onClick={() => openBank("board")} className={topBtn}><BookOpen size={18} />{!phone && "Word bank"}</button>
            <button onClick={() => buildNew(0)} className={topBtn}><RefreshCw size={18} />{!phone && "New words"}</button>
            <button onClick={() => setPhase("setup")} className={topBtn}><Settings size={18} />{!phone && "Setup"}</button>
            <button onClick={() => setInfo(true)} aria-label="Information" className="p-2 rounded-xl text-slate-500 hover:bg-white"><Info size={20} /></button>
          </div>
        </div>
        {boardGrid(!collapsing)}
        <button onClick={startCalling} disabled={collapsing}
          className="rounded-2xl bg-blue-900 text-white font-semibold py-3 sm:py-4 text-xl shadow-lift disabled:opacity-60">
          Start calling
        </button>
        {info && <InfoModal infoSections={INFO_SECTIONS} onClose={() => setInfo(false)} />}
      </div>
    );
  }

  // ── Play: just the clue ────────────────────────────────────────────────────
  const clue = currentWord && current ? currentWord.clues[current.clueIdx] : null;
  const btn = "flex-1 rounded-2xl font-semibold py-3 sm:py-4 text-lg sm:text-xl";
  const sub = "flex items-center justify-center gap-2 rounded-xl px-4 py-2 font-semibold text-slate-700 border border-slate-300 bg-white hover:bg-slate-50";

  return (
    <div className="fixed inset-0 z-30 flex flex-col p-3 sm:p-6 gap-3" style={{ background: PAGE_BG }}>
      <style>{CSS}</style>
      <div className="flex items-center justify-between">
        <button onClick={() => setPhase("board")} className={topBtn}><Settings size={18} />Board</button>
        <div className="text-slate-500 font-semibold">Bingo: {need.name.toLowerCase()}</div>
        <button onClick={() => setInfo(true)} aria-label="Information" className="p-2 rounded-xl text-slate-500 hover:bg-white"><Info size={20} /></button>
      </div>

      <div className="relative flex-1 min-h-0 rounded-3xl border border-slate-300 shadow-card bg-white flex flex-col p-4 sm:p-6 overflow-hidden">
        <div className="flex-1 min-h-0 flex items-center justify-center text-center">
          {finished ? (
            <div className="wb-in">
              <div className="text-3xl sm:text-5xl font-semibold text-slate-900">All {order.length} words called</div>
              <div className="mt-6 flex gap-3 justify-center flex-wrap">
                <button onClick={() => beginRound(true)} className="rounded-xl bg-blue-900 text-white font-semibold px-5 py-3">Play again, same words</button>
                <button onClick={() => buildNew(0)} className="rounded-xl border border-slate-300 font-semibold px-5 py-3">New words</button>
              </div>
            </div>
          ) : drawing ? (
            <div className="flex gap-3" aria-label="Drawing the next clue">
              {[0, 1, 2].map(i => (
                <span key={i} className="block w-6 h-6 rounded-full bg-sky-500" style={{ animation: "wb-bounce .6s infinite", animationDelay: `${i * 120}ms` }} />
              ))}
            </div>
          ) : clue && current ? (
            <div key={calls.length} className="wb-in w-full h-full flex items-center justify-center">
              <ClueView clue={clue} phone={phone} />
            </div>
          ) : null}
        </div>

        {/* The word has its own reserved row, so revealing it never covers the clue or the dots. */}
        <div className="shrink-0 flex items-center justify-center" style={{ height: phone ? "3.5rem" : "5.5rem" }}>
          {isRevealed && currentWord && !finished && (
            <div key={currentWord.id} className="wb-flip text-4xl sm:text-6xl font-semibold text-emerald-700">{currentWord.word}</div>
          )}
        </div>

        {timer > 0 && !drawing && !finished && current && !isRevealed && (
          <svg key={`ring-${calls.length}`} className="absolute top-4 right-4" width={64} height={64} viewBox="0 0 64 64">
            <circle cx={32} cy={32} r={28} fill="none" stroke="#e2e8f0" strokeWidth={6} />
            <circle cx={32} cy={32} r={28} fill="none" stroke="#0ea5e9" strokeWidth={6} strokeLinecap="round"
              strokeDasharray={176} transform="rotate(-90 32 32)"
              style={{ animation: `wb-ring ${timer}s linear forwards` }} />
          </svg>
        )}

        <div className="shrink-0 text-center text-xl sm:text-2xl font-semibold text-slate-400 tabular-nums">
          {Math.min(calls.length, order.length)}/{order.length}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={next} disabled={finished || drawing} className={`${btn} bg-blue-900 text-white disabled:opacity-40`}>
          {calls.length >= order.length ? "Finish" : "Next clue"}
        </button>
        <button onClick={reveal} disabled={isRevealed || finished || drawing} className={`${btn} border border-slate-300 bg-white text-slate-800 disabled:opacity-40`}>
          Reveal word
        </button>
      </div>
      <div className="flex gap-2 justify-center flex-wrap">
        <button onClick={skip} disabled={finished || drawing || calls.length >= order.length} className={`${sub} disabled:opacity-40`}><SkipForward size={18} />Skip for now</button>
        <button onClick={() => setShowBoard(true)} className={sub}><LayoutGrid size={18} />Show board</button>
        <button onClick={() => setClaiming(true)} className={`${sub} !border-emerald-600 !bg-emerald-50 !text-emerald-800`}><Check size={18} />Check bingo</button>
      </div>

      {showBoard && (
        <div className="fixed inset-0 z-40 flex flex-col p-3 sm:p-5 gap-3" style={{ background: PAGE_BG }}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-3xl font-semibold text-slate-900">The 25 words</h2>
            <button onClick={() => setShowBoard(false)} aria-label="Close" className="p-2 rounded-xl text-slate-500 hover:bg-white"><X size={24} /></button>
          </div>
          {boardGrid(false)}
        </div>
      )}
      {claiming && <Claim board={board} called={called} need={need.count} label={need.name} onClose={() => setClaiming(false)} />}
      {info && <InfoModal infoSections={INFO_SECTIONS} onClose={() => setInfo(false)} />}
    </div>
  );
}

const CONFETTI = Array.from({ length: 48 }, (_, i) => ({
  left: (i * 37) % 100, delay: ((i * 53) % 100) / 100, dur: 1.8 + ((i * 29) % 15) / 10, hue: (i * 47) % 360,
}));

function Claim({ board, called, need, label, onClose }: {
  board: BingoWord[]; called: Set<string>; need: number; label: string; onClose: () => void;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const result = picked.length === need ? checkClaim(picked, called) : null;
  const names = (ids: string[]) => ids.map(id => board.find(b => b.id === id)!.word).join(", ");
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3" onClick={onClose}>
      {result?.ok && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
          {CONFETTI.map((c, i) => (
            <span key={i} className="absolute top-0 block w-3 h-5 rounded-sm"
              style={{ left: `${c.left}%`, background: `hsl(${c.hue} 80% 55%)`, animation: `wb-fall ${c.dur}s ${c.delay}s linear both` }} />
          ))}
        </div>
      )}
      <div className="bg-white rounded-2xl shadow-lift w-full max-w-3xl max-h-[92vh] overflow-y-auto p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Check bingo — {label.toLowerCase()}</h2>
            <p className="text-sm text-slate-500">Tick the {need} words the student is claiming ({picked.length} of {need}).</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"><X size={20} /></button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {board.map(w => {
            const on = picked.includes(w.id);
            return (
              <button key={w.id}
                onClick={() => setPicked(on ? picked.filter(x => x !== w.id) : picked.length < need ? [...picked, w.id] : picked)}
                className={`rounded-xl border px-2 text-sm font-semibold leading-tight ${on ? "border-sky-500 bg-sky-50 text-sky-900" : "border-slate-300 bg-white text-slate-800"}`}
                style={{ minHeight: 52 }}>
                {w.word}
              </button>
            );
          })}
        </div>
        {result && (
          <div className={`mt-4 rounded-xl p-4 flex items-start gap-3 ${result.ok ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"}`}>
            {result.ok ? <Check size={22} className="mt-0.5" /> : <X size={22} className="mt-0.5" />}
            <div className="font-semibold">
              {result.ok ? "BINGO! Every one of those words has been called." : `Not yet — not called: ${names(result.missing)}.`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
