import { useMemo, useState } from "react";
import { Home, Info, Printer, RefreshCw, Settings, Check, X } from "lucide-react";
import { MathRenderer, InfoModal, type InfoSection } from "../../shared";
import { useLayoutMode } from "../../shared/layoutMode";
import { PAGE_BG } from "../../shared/colors";
import { PicView } from "../../shared/components/BingoPics";
import {
  PACKS, CLUE_KINDS, WIN_MODES, BOARD_SIZE, ALL_WORDS,
  buildBoard, maxBoardSize, mulberry32, newRoundOrder, pickClueIndex, checkClaim,
  type BingoWord, type ClueKind, type PackId, type WinMode,
} from "./WordsBingoData";

const INFO_SECTIONS: InfoSection[] = [
  {
    title: "How to play", icon: "🎯",
    content: [
      { label: "The board", detail: "25 maths words are shown. Students choose 9 and write them in a 3×3 grid." },
      { label: "The clues", detail: "The words are never read out. The class sees a definition, a symbol or a picture and works out which word it is." },
      { label: "Winning", detail: "The first student to complete the chosen pattern (a line, four corners or a full house) shouts bingo. Use Check bingo to verify the words they claim." },
    ],
  },
  {
    title: "Options", icon: "⚙️",
    content: [
      { label: "Topic packs", detail: "Pick one pack or mix several. A mixed board takes an even share from each pack." },
      { label: "Clue types", detail: "Choose which kinds of clue appear: definitions, symbols and numbers, pictures. Pictures only is a good way to support weaker readers." },
      { label: "Recycle words", detail: "When all 25 words have been called, a new round starts with the same 25 words and (where a word has more than one) a different clue. Students write down a fresh 9. Turn it off to stop after one round." },
    ],
  },
  {
    title: "Fair play", icon: "⚖️",
    content: [
      { label: "No ambiguous boards", detail: "Words that could share a clue (square and rectangle, addition and sum…) never appear on the same board." },
      { label: "Share a board", detail: "The page address holds the board and settings, so Copy the address to replay the same 25 words." },
    ],
  },
];

const KINDS_ALL: ClueKind[] = ["def", "sym", "pic"];
const PACKS_ALL: PackId[] = PACKS.map(p => p.id);

const readParams = () => {
  const q = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const packs = (q.get("packs") ?? "").split(",").filter((p): p is PackId => PACKS_ALL.includes(p as PackId));
  const kinds = (q.get("clues") ?? "").split(",").filter((k): k is ClueKind => KINDS_ALL.includes(k as ClueKind));
  const win = WIN_MODES.find(w => w.id === q.get("win"))?.id ?? "line";
  const seed = Number(q.get("seed"));
  return {
    packs: packs.length ? packs : PACKS_ALL.slice(),
    kinds: kinds.length ? kinds : KINDS_ALL.slice(),
    win: win as WinMode,
    recycle: q.get("recycle") !== "0",
    seed: Number.isFinite(seed) && seed > 0 ? seed : 0,
  };
};

interface Call { id: string; clueIdx: number }

export default function WordsBingo() {
  const init = useMemo(readParams, []);
  const { phone } = useLayoutMode();

  const [packs, setPacks] = useState<PackId[]>(init.packs);
  const [kinds, setKinds] = useState<ClueKind[]>(init.kinds);
  const [win, setWin] = useState<WinMode>(init.win);
  const [recycle, setRecycle] = useState(init.recycle);

  const [seed, setSeed] = useState(0);
  const [board, setBoard] = useState<BingoWord[]>([]);
  const [round, setRound] = useState(1);
  const [order, setOrder] = useState<string[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [used, setUsed] = useState<Record<string, number[]>>({});
  const [revealed, setRevealed] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [info, setInfo] = useState(false);

  const playing = board.length > 0;
  const available = maxBoardSize(packs, kinds);
  const canStart = available >= BOARD_SIZE;
  const byId = useMemo(() => new Map(ALL_WORDS.map(w => [w.id, w])), []);
  const current = calls.length > 0 ? calls[calls.length - 1] : null;
  const currentWord = current ? byId.get(current.id)! : null;
  const called = useMemo(() => new Set(calls.map(c => c.id)), [calls]);

  const writeUrl = (s: number) => {
    const q = new URLSearchParams({ packs: packs.join(","), clues: kinds.join(","), win, recycle: recycle ? "1" : "0", seed: String(s) });
    window.history.replaceState(null, "", `${window.location.pathname}?${q}`);
  };

  const callFrom = (ord: string[], prevCalls: Call[], prevUsed: Record<string, number[]>, boardWords: BingoWord[]) => {
    const id = ord[prevCalls.length];
    const w = boardWords.find(b => b.id === id)!;
    const clueIdx = pickClueIndex(w, kinds, prevUsed, Math.random);
    setCalls([...prevCalls, { id, clueIdx }]);
    setUsed({ ...prevUsed, [id]: [...(prevUsed[id] ?? []), clueIdx] });
  };

  const start = (withSeed: number) => {
    const s = withSeed || Math.floor(Math.random() * 900000) + 100000;
    const b = buildBoard(packs, kinds, mulberry32(s));
    if (!b) return;
    const ord = newRoundOrder(b, mulberry32(s + 1));
    setSeed(s); setBoard(b); setRound(1); setOrder(ord); setRevealed([]); setFinished(false); setClaiming(false);
    setCalls([]); setUsed({});
    writeUrl(s);
    const w = b.find(x => x.id === ord[0])!;
    const clueIdx = pickClueIndex(w, kinds, {}, Math.random);
    setCalls([{ id: ord[0], clueIdx }]);
    setUsed({ [ord[0]]: [clueIdx] });
  };

  const next = () => {
    if (!current) return;
    const rev = revealed.includes(current.id) ? revealed : [...revealed, current.id];
    if (calls.length < order.length) {
      setRevealed(rev);
      callFrom(order, calls, used, board);
    } else if (recycle) {
      const ord = newRoundOrder(board, mulberry32(seed + 1 + round));
      setRound(round + 1); setOrder(ord); setRevealed([]);
      callFrom(ord, [], used, board);
    } else {
      setRevealed(rev);
      setFinished(true);
    }
  };

  const reveal = () => {
    if (current && !revealed.includes(current.id)) setRevealed([...revealed, current.id]);
  };

  const toggle = <T,>(list: T[], v: T): T[] => (list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  const printSheet = () => {
    const win2 = window.open("", "_blank");
    if (!win2) return;
    const words = board.map(w => `<li>${w.word}</li>`).join("");
    const cells = Array.from({ length: 9 }, () => "<div class='c'></div>").join("");
    win2.document.write(`<!doctype html><html><head><title>Maths Words Bingo</title><style>
      body{font-family:system-ui,sans-serif;margin:24mm 18mm}
      h1{font-size:22pt;margin:0 0 4mm}p{margin:0 0 6mm;color:#475569}
      ul{columns:5;list-style:none;padding:0;margin:0 0 10mm;font-size:13pt}li{margin:0 0 3mm}
      .g{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:2px solid #1e3a8a;width:150mm;margin:0 auto}
      .c{height:42mm;border:1px solid #1e3a8a}
    </style></head><body><h1>Maths Words Bingo</h1>
    <p>Choose 9 of these words and write them in the grid. Listen to the clues!</p>
    <ul>${words}</ul><div class="g">${cells}</div></body></html>`);
    win2.document.close();
    win2.focus();
    win2.print();
  };

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen" style={{ background: PAGE_BG }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-4 pb-28">
        <div className="flex items-center justify-between gap-3 mb-4">
          <button onClick={() => { window.location.href = "/"; }} className="flex items-center gap-2 text-slate-700 hover:bg-white px-3 py-2 rounded-xl font-semibold">
            <Home size={20} /> Home
          </button>
          <div className="flex items-center gap-1">
            {playing && (
              <button onClick={() => setBoard([])} className="flex items-center gap-2 text-slate-600 hover:bg-white px-3 py-2 rounded-xl font-semibold">
                <Settings size={18} /> Setup
              </button>
            )}
            <button onClick={() => setInfo(true)} aria-label="Information" className="p-2 rounded-xl text-slate-500 hover:bg-white"><Info size={20} /></button>
          </div>
        </div>
        <h1 className="text-3xl font-semibold text-slate-900 mb-1">Maths Words Bingo</h1>
        <p className="text-slate-500 mb-5">Choose 9 words from the board. Watch the clues.</p>
        {children}
      </div>
      {info && <InfoModal infoSections={INFO_SECTIONS} onClose={() => setInfo(false)} />}
    </div>
  );

  // ── Setup ──────────────────────────────────────────────────────────────────
  if (!playing) {
    const chip = (on: boolean) =>
      `text-left rounded-2xl border p-4 transition-colors ${on ? "border-sky-500 bg-sky-50" : "border-slate-300 bg-white hover:bg-slate-50"}`;
    return shell(
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-300 shadow-card bg-white p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Topics</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {PACKS.map(p => (
              <button key={p.id} className={chip(packs.includes(p.id))} onClick={() => setPacks(toggle(packs, p.id))}>
                <div className="font-semibold text-slate-900">{p.name}</div>
                <div className="text-sm text-slate-500">{p.blurb}</div>
              </button>
            ))}
          </div>
          <h2 className="font-semibold text-slate-900 mt-6 mb-3">Clues</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {CLUE_KINDS.map(k => (
              <button key={k.id} className={chip(kinds.includes(k.id))} onClick={() => setKinds(toggle(kinds, k.id))}>
                <div className="font-semibold text-slate-900">{k.name}</div>
                <div className="text-sm text-slate-500">{k.blurb}</div>
              </button>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-slate-300 shadow-card bg-white p-5 flex flex-col">
          <h2 className="font-semibold text-slate-900 mb-3">Bingo is…</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {WIN_MODES.map(m => (
              <button key={m.id} className={chip(win === m.id)} onClick={() => setWin(m.id)}>
                <div className="font-semibold text-slate-900">{m.name}</div>
                <div className="text-sm text-slate-500">{m.blurb}</div>
              </button>
            ))}
          </div>
          <h2 className="font-semibold text-slate-900 mt-6 mb-3">Recycle words</h2>
          <button className={chip(recycle)} onClick={() => setRecycle(!recycle)}>
            <div className="font-semibold text-slate-900">{recycle ? "On" : "Off"}</div>
            <div className="text-sm text-slate-500">
              When all 25 have been called, start a new round with the same words and fresh clues.
            </div>
          </button>
          <div className="mt-auto pt-6">
            {!canStart && (
              <p className="text-sm text-amber-700 mb-2">
                Only {available} usable words with these choices — add a topic or a clue type (a board needs {BOARD_SIZE}).
              </p>
            )}
            <button
              disabled={!canStart}
              onClick={() => start(init.seed && !seed ? init.seed : 0)}
              className="w-full rounded-xl bg-blue-900 text-white font-semibold py-3 text-lg disabled:opacity-40"
            >
              Start game
            </button>
          </div>
        </section>
      </div>
    );
  }

  // ── Play ───────────────────────────────────────────────────────────────────
  const clue = currentWord && current ? currentWord.clues[current.clueIdx] : null;
  const isRevealed = !!current && revealed.includes(current.id);
  const need = WIN_MODES.find(m => m.id === win)!;

  const actions = (
    <>
      <button
        onClick={next}
        disabled={finished}
        className="flex-1 rounded-xl bg-blue-900 text-white font-semibold py-3 text-lg disabled:opacity-40"
      >
        {calls.length >= order.length ? (recycle ? "Next round" : "Finish") : "Next clue"}
      </button>
      <button onClick={reveal} disabled={isRevealed || finished} className="flex-1 rounded-xl border border-slate-300 bg-white font-semibold py-3 text-lg text-slate-800 disabled:opacity-40">
        Reveal word
      </button>
      <button onClick={() => setClaiming(true)} className="flex-1 rounded-xl border border-emerald-600 bg-emerald-50 font-semibold py-3 text-lg text-emerald-800">
        Check bingo
      </button>
    </>
  );

  return shell(
    <>
      <div className={phone ? "flex flex-col gap-4" : "grid gap-5 grid-cols-[1.2fr_1fr]"}>
        <section className="rounded-2xl border border-slate-300 shadow-card bg-white p-5 flex flex-col">
          <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
            <span>Round {round} · Clue {Math.min(calls.length, order.length)} of {order.length}</span>
            <span>Bingo: {need.name.toLowerCase()}</span>
          </div>
          <div className="flex items-center justify-center text-center" style={{ minHeight: phone ? 220 : 340 }}>
            {finished ? (
              <div>
                <div className="text-2xl font-semibold text-slate-900">All {order.length} words called</div>
                <button onClick={() => start(0)} className="mt-4 rounded-xl bg-blue-900 text-white font-semibold px-5 py-3">New board</button>
              </div>
            ) : clue ? (
              <div className="w-full">
                {clue.k === "def" && <p className={`${phone ? "text-2xl" : "text-4xl"} font-semibold text-slate-900 leading-snug`}>{clue.s}</p>}
                {clue.k === "sym" && (
                  <div style={{ fontSize: phone ? "2.4rem" : "4.2rem" }} className="text-slate-900"><MathRenderer latex={clue.s} /></div>
                )}
                {clue.k === "pic" && (
                  <div className="mx-auto" style={{ height: phone ? 200 : 300, maxWidth: 420 }}><PicView p={clue.p} /></div>
                )}
                {isRevealed && currentWord && (
                  <div className="mt-5 text-3xl font-semibold text-emerald-700">{currentWord.word}</div>
                )}
              </div>
            ) : null}
          </div>
          {!phone && <div className="flex gap-3 mt-4">{actions}</div>}
        </section>

        <section className="rounded-2xl border border-slate-300 shadow-card bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">The 25 words</h2>
            <div className="flex gap-1">
              <button onClick={printSheet} data-trusted-click title="Print sheet" className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"><Printer size={18} /></button>
              <button onClick={() => start(0)} title="New board" className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"><RefreshCw size={18} /></button>
            </div>
          </div>
          <div className={`grid gap-2 ${phone ? "grid-cols-3" : "grid-cols-5"}`}>
            {board.map(w => {
              const done = revealed.includes(w.id);
              return (
                <div key={w.id} className={`rounded-xl border px-2 flex items-center justify-center text-center text-sm font-semibold leading-tight ${done ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-white text-slate-800"}`} style={{ minHeight: 56 }}>
                  {w.word}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {phone && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-300 p-3 flex gap-2">{actions}</div>
      )}

      {claiming && (
        <Claim
          board={board} called={called} need={need.count} label={need.name}
          onClose={() => setClaiming(false)}
        />
      )}
    </>
  );
}

function Claim({ board, called, need, label, onClose }: {
  board: BingoWord[]; called: Set<string>; need: number; label: string; onClose: () => void;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const result = picked.length === need ? checkClaim(picked, called) : null;
  const names = (ids: string[]) => ids.map(id => board.find(b => b.id === id)!.word).join(", ");
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3" onClick={onClose}>
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
              <button
                key={w.id}
                onClick={() => setPicked(on ? picked.filter(x => x !== w.id) : picked.length < need ? [...picked, w.id] : picked)}
                className={`rounded-xl border px-2 text-sm font-semibold leading-tight ${on ? "border-sky-500 bg-sky-50 text-sky-900" : "border-slate-300 bg-white text-slate-800"}`}
                style={{ minHeight: 52 }}
              >
                {w.word}
              </button>
            );
          })}
        </div>
        {result && (
          <div className={`mt-4 rounded-xl p-4 flex items-start gap-3 ${result.ok ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"}`}>
            {result.ok ? <Check size={22} className="mt-0.5" /> : <X size={22} className="mt-0.5" />}
            <div className="font-semibold">
              {result.ok ? "Valid bingo — every one of those words has been called." : `Not yet — not called: ${names(result.missing)}.`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
