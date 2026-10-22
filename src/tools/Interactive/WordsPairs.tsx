import { useEffect, useMemo, useState } from "react";
import { Settings, Info, RefreshCw, Shuffle } from "lucide-react";
import { InfoModal, type InfoSection } from "../../shared";
import { PAGE_BG } from "../../shared/colors";
import { useLayoutMode } from "../../shared/layoutMode";
import { ClueView } from "../../shared/mathsWords/ClueView";
import { Confetti } from "../../shared/mathsWords/Confetti";
import { SetupScreen } from "../../shared/mathsWords/SetupScreen";
import { optionChip } from "../../shared/mathsWords/WordFilters";
import { readFilter, writeParams } from "../../shared/mathsWords/params";
import {
  maxDistinct, pickWords, pickClueIndex, shuffle,
  type Clue, type MathsWord, type WordFilter,
} from "../../shared/mathsWords/words";

const INFO_SECTIONS: InfoSection[] = [
  {
    title: "How to play", icon: "🃏",
    content: [
      { label: "The cards", detail: "Every word has a partner card showing a definition, symbol or picture. Turn over two cards at a time; if they are a word and its clue, they are a pair." },
      { label: "Two teams", detail: "Teams take turns. A pair earns a point and another go; a miss passes the turn. Most pairs wins." },
      { label: "Solo", detail: "One player counting attempts: fewer is better." },
      { label: "Peek", detail: "Optionally show every card face up for a few seconds before they flip over." },
    ],
  },
  {
    title: "Fair play", icon: "⚖️",
    content: [
      { label: "No ambiguous pairs", detail: "Words that could share a clue (square and rectangle, addition and sum…) never appear in the same game." },
      { label: "Topics, level and clues", detail: "Choose the packs, key stages (KS2 / KS3 / KS4) and clue types the cards come from." },
    ],
  },
];

const SIZES = [6, 8, 10];
const TEAMS = [{ n: 1, label: "Solo" }, { n: 2, label: "Two teams" }];
const TEAM_COL = ["#0ea5e9", "#f59e0b"];

const CSS = `
.pr-card{perspective:800px}
.pr-inner{position:relative;width:100%;height:100%;transition:transform .5s;transform-style:preserve-3d}
.pr-card.up .pr-inner{transform:rotateY(180deg)}
.pr-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:1rem;display:flex;align-items:center;justify-content:center;overflow:hidden}
.pr-front{transform:rotateY(180deg)}
@keyframes pr-in{0%{opacity:0;transform:scale(.7)}100%{opacity:1;transform:none}}
@keyframes pr-match{0%{transform:scale(1)}40%{transform:scale(1.08)}100%{transform:scale(1)}}
.pr-deal{animation:pr-in .4s both}
.pr-matched .pr-inner{animation:pr-match .45s}
`;

interface Card { id: string; kind: "word" | "clue"; label: string; clue?: Clue }

export default function WordsPairs() {
  const { phone } = useLayoutMode();
  const [filter, setFilter] = useState<WordFilter>(readFilter);
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const [pairs, setPairs] = useState(SIZES.includes(Number(params.get("pairs"))) ? Number(params.get("pairs")) : 8);
  const [teams, setTeams] = useState(Number(params.get("teams")) === 2 ? 2 : 1);
  const [peek, setPeek] = useState(params.get("peek") === "1");
  const [info, setInfo] = useState(false);

  const [playing, setPlaying] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [owner, setOwner] = useState<Record<number, number>>({});
  const [turn, setTurn] = useState(0);
  const [scores, setScores] = useState([0, 0]);
  const [attempts, setAttempts] = useState(0);
  const [busy, setBusy] = useState(false);
  const [peeking, setPeeking] = useState(false);

  const available = useMemo(() => maxDistinct(filter), [filter]);
  const matched = Object.keys(owner).length;
  const done = cards.length > 0 && matched === cards.length;

  const deal = (words: MathsWord[]) => {
    const used: Record<string, number[]> = {};
    const list: Card[] = [];
    for (const w of words) {
      const idx = pickClueIndex(w, filter.kinds, used, Math.random);
      list.push({ id: w.id, kind: "word", label: w.word });
      list.push({ id: w.id, kind: "clue", label: w.word, clue: w.clues[idx] });
    }
    setCards(shuffle(list, Math.random));
    setFlipped([]); setOwner({}); setTurn(0); setScores([0, 0]); setAttempts(0); setBusy(false);
    if (peek) {
      setPeeking(true); setBusy(true);
      window.setTimeout(() => { setPeeking(false); setBusy(false); }, 3500);
    }
  };

  const [words, setWords] = useState<ReturnType<typeof pickWords>>(null);

  const start = (fresh = true) => {
    writeParams(filter, { pairs: String(pairs), teams: String(teams), peek: peek ? "1" : "0" });
    const w = fresh || !words ? pickWords(filter, Math.random, pairs) : words;
    if (!w) return;
    setWords(w); setPlaying(true); deal(w);
  };

  const flip = (i: number) => {
    if (busy || peeking || done || flipped.includes(i) || owner[i] !== undefined || flipped.length >= 2) return;
    const next = [...flipped, i];
    setFlipped(next);
    if (next.length < 2) return;
    setBusy(true);
    setAttempts(a => a + 1);
    const [a, b] = next.map(n => cards[n]);
    if (a.id === b.id && a.kind !== b.kind) {
      window.setTimeout(() => {
        setOwner(o => ({ ...o, [next[0]]: turn, [next[1]]: turn }));
        setScores(s => s.map((v, t) => (t === turn ? v + 1 : v)));
        setFlipped([]); setBusy(false);
      }, 650);
    } else {
      window.setTimeout(() => {
        setFlipped([]); setBusy(false);
        if (teams === 2) setTurn(t => 1 - t);
      }, 1300);
    }
  };

  useEffect(() => { if (!playing) setBusy(false); }, [playing]);

  // ── Setup ──────────────────────────────────────────────────────────────────
  if (!playing) {
    return (
      <>
        <SetupScreen
          title="Maths Pairs" subtitle="Match each word to its definition, symbol or picture."
          filter={filter} onFilter={setFilter} available={available} needed={pairs}
          startLabel="Deal the cards" onStart={() => start(true)} onInfo={() => setInfo(true)}
        >
          <h2 className="font-semibold text-slate-900 mb-3">Pairs</h2>
          <div className="grid grid-cols-3 gap-3">
            {SIZES.map(n => (
              <button key={n} onClick={() => setPairs(n)} className={`${optionChip(pairs === n)} text-center`}>
                <div className="font-semibold text-slate-900">{n} pairs</div>
                <div className="text-sm text-slate-500">{n * 2} cards</div>
              </button>
            ))}
          </div>
          <h2 className="font-semibold text-slate-900 mt-6 mb-3">Players</h2>
          <div className="grid grid-cols-2 gap-3">
            {TEAMS.map(t => (
              <button key={t.n} onClick={() => setTeams(t.n)} className={`${optionChip(teams === t.n)} text-center font-semibold text-slate-900`}>{t.label}</button>
            ))}
          </div>
          <h2 className="font-semibold text-slate-900 mt-6 mb-3">Peek at the start</h2>
          <button onClick={() => setPeek(!peek)} className={optionChip(peek)}>
            <div className="font-semibold text-slate-900">{peek ? "On" : "Off"}</div>
            <div className="text-sm text-slate-500">Show every card face up for a few seconds before they flip over.</div>
          </button>
        </SetupScreen>
        {info && <InfoModal infoSections={INFO_SECTIONS} onClose={() => setInfo(false)} />}
      </>
    );
  }

  // ── Play ───────────────────────────────────────────────────────────────────
  const cols = phone ? 3 : cards.length <= 12 ? 4 : cards.length <= 16 ? 4 : 5;
  const rows = Math.ceil(cards.length / cols);
  const winner = scores[0] === scores[1] ? -1 : scores[0] > scores[1] ? 0 : 1;
  const teamName = (t: number) => (teams === 1 ? "You" : `Team ${t + 1}`);

  return (
    <div className="fixed inset-0 z-30 flex flex-col p-3 sm:p-5 gap-3" style={{ background: PAGE_BG }}>
      <style>{CSS}</style>
      <div className="flex items-center justify-between gap-2">
        <button onClick={() => setPlaying(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-slate-600 hover:bg-white"><Settings size={18} />Setup</button>
        <div className="flex items-center gap-2 sm:gap-4 font-semibold">
          {teams === 2 ? [0, 1].map(t => (
            <span key={t} className="rounded-full px-4 py-1.5 text-white transition-all"
              style={{ background: TEAM_COL[t], opacity: turn === t && !done ? 1 : 0.45, transform: turn === t && !done ? "scale(1.08)" : "none" }}>
              Team {t + 1}: {scores[t]}
            </span>
          )) : <span className="text-slate-600">Pairs {scores[0]}/{pairs} · Attempts {attempts}</span>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => start(false)} title="Reshuffle the same words" className="p-2 rounded-xl text-slate-500 hover:bg-white"><Shuffle size={18} /></button>
          <button onClick={() => start(true)} title="New words" className="p-2 rounded-xl text-slate-500 hover:bg-white"><RefreshCw size={18} /></button>
          <button onClick={() => setInfo(true)} aria-label="Information" className="p-2 rounded-xl text-slate-500 hover:bg-white"><Info size={20} /></button>
        </div>
      </div>

      <div className={`flex-1 min-h-0 grid gap-2 sm:gap-3 ${phone ? "overflow-auto content-start" : ""}`}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: phone ? undefined : `repeat(${rows}, minmax(0, 1fr))` }}>
        {cards.map((c, i) => {
          const up = flipped.includes(i) || owner[i] !== undefined || peeking;
          const mine = owner[i];
          return (
            <button key={i} onClick={() => flip(i)} disabled={owner[i] !== undefined}
              className={`pr-card pr-deal ${up ? "up" : ""} ${mine !== undefined ? "pr-matched" : ""}`}
              style={{ animationDelay: `${i * 35}ms`, minHeight: phone ? 110 : undefined }}>
              <div className="pr-inner">
                <div className="pr-face bg-blue-900 text-white shadow-card text-4xl font-semibold">?</div>
                <div className="pr-face pr-front bg-white shadow-card p-2 sm:p-3"
                  style={{ border: `3px solid ${mine !== undefined ? (teams === 2 ? TEAM_COL[mine] : "#10b981") : "#cbd5e1"}` }}>
                  {c.kind === "word"
                    ? <span className="font-semibold text-slate-900 text-center leading-tight" style={{ fontSize: phone ? "1.1rem" : "clamp(1rem, 2vw, 2rem)" }}>{c.label}</span>
                    : <div className="w-full h-full flex items-center justify-center"><ClueView clue={c.clue!} phone={phone} scale={phone ? 0.5 : 0.42} /></div>}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {done && (
        <>
          <Confetti />
          <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-3xl shadow-lift p-8 text-center max-w-md">
              <div className="text-3xl font-semibold text-slate-900 mb-2">
                {teams === 1 ? "All pairs found!" : winner === -1 ? "It's a draw!" : `${teamName(winner)} wins!`}
              </div>
              <p className="text-slate-500 mb-5">
                {teams === 1 ? `${attempts} attempts for ${pairs} pairs.` : `Team 1: ${scores[0]} · Team 2: ${scores[1]}`}
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <button onClick={() => start(false)} className="rounded-xl bg-blue-900 text-white font-semibold px-5 py-3">Play again</button>
                <button onClick={() => start(true)} className="rounded-xl border border-slate-300 font-semibold px-5 py-3">New words</button>
              </div>
            </div>
          </div>
        </>
      )}
      {info && <InfoModal infoSections={INFO_SECTIONS} onClose={() => setInfo(false)} />}
    </div>
  );
}
