import { useCallback, useEffect, useMemo, useState } from "react";
import { Settings, Info, Lightbulb, Shuffle, Eye } from "lucide-react";
import { InfoModal, type InfoSection } from "../../shared";
import { PAGE_BG } from "../../shared/colors";
import { useLayoutMode } from "../../shared/layoutMode";
import { ClueView } from "../../shared/mathsWords/ClueView";
import { SetupScreen } from "../../shared/mathsWords/SetupScreen";
import { optionChip } from "../../shared/mathsWords/WordFilters";
import { readFilter, writeParams } from "../../shared/mathsWords/params";
import {
  eligibleWords, maxDistinct, shuffle,
  type MathsWord, type WordFilter,
} from "../../shared/mathsWords/words";

const INFO_SECTIONS: InfoSection[] = [
  {
    title: "How to play", icon: "🎈",
    content: [
      { label: "The clue", detail: "The class sees a definition, symbol or picture and works out the hidden word. Guess letters; each wrong guess pops a balloon." },
      { label: "Another clue", detail: "Stuck? Show a different clue for the same word if there is one. It costs nothing." },
      { label: "Reveal a letter", detail: "Gives away a letter but pops a balloon." },
      { label: "Winning", detail: "Fill in the word before the last balloon pops and the basket floats away safely." },
    ],
  },
  {
    title: "Options", icon: "⚙️",
    content: [
      { label: "Topics, level and clues", detail: "Choose the packs, key stages (KS2 / KS3 / KS4) and clue types the words come from." },
      { label: "Balloons", detail: "More balloons means more mistakes allowed." },
      { label: "Long words", detail: "Words with more than 15 letters are left out so a round never drags." },
    ],
  },
];

const MAX_LETTERS = 15;
const LIVES = [6, 8, 10];
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const COLOURS = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#a855f7", "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16"];

const CSS = `
@keyframes hm-pop{0%{transform:scale(1);opacity:1}40%{transform:scale(1.5);opacity:1}100%{transform:scale(2);opacity:0}}
@keyframes hm-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
@keyframes hm-up{0%{transform:translateY(0)}100%{transform:translateY(-30px)}}
@keyframes hm-fall{0%{transform:none}100%{transform:translateY(34px) rotate(14deg)}}
@keyframes hm-in{0%{opacity:0;transform:scale(.5)}100%{opacity:1;transform:none}}
.hm-pop{animation:hm-pop .35s both;transform-box:fill-box;transform-origin:center}
.hm-float{animation:hm-float 2.2s ease-in-out infinite}
.hm-up{animation:hm-up .8s ease-out both}
.hm-fall{animation:hm-fall .9s ease-in both}
.hm-in{animation:hm-in .3s both}
`;

const lettersOf = (w: MathsWord) => w.word.replace(/[^a-z]/gi, "");

/** Which balloons pop first: alternate from the ends so the arc empties evenly. */
const popOrder = (n: number) => {
  const o: number[] = [];
  for (let i = 0; o.length < n; i++) { o.push(i); if (n - 1 - i !== i && o.length < n) o.push(n - 1 - i); }
  return o;
};

function Balloons({ lives, wrong, status }: { lives: number; wrong: number; status: "playing" | "won" | "lost" }) {
  const order = useMemo(() => popOrder(lives), [lives]);
  const popped = new Set(order.slice(0, wrong));
  const pos = (i: number) => {
    const t = lives === 1 ? 0.5 : i / (lives - 1);
    return { x: 24 + t * 152, y: 30 + 36 * Math.pow(2 * t - 1, 2) };
  };
  return (
    <svg viewBox="0 0 200 170" style={{ display: "block", width: "100%", height: "100%" }}>
      <g className={status === "won" ? "hm-up" : status === "lost" ? "hm-fall" : "hm-float"} style={{ transformBox: "fill-box" }}>
        {Array.from({ length: lives }, (_, i) => {
          const { x, y } = pos(i);
          const gone = popped.has(i);
          return (
            <g key={i}>
              {!gone && <line x1={x} y1={y + 19} x2={100} y2={128} stroke="#64748b" strokeWidth={1.5} />}
              {gone
                ? <ellipse key={`p${i}`} className="hm-pop" cx={x} cy={y} rx={15} ry={19} fill={COLOURS[i % COLOURS.length]} />
                : <ellipse cx={x} cy={y} rx={15} ry={19} fill={COLOURS[i % COLOURS.length]} stroke="#fff" strokeWidth={2} />}
              {!gone && <ellipse cx={x - 5} cy={y - 7} rx={4} ry={6} fill="#fff" opacity={0.45} />}
            </g>
          );
        })}
        <polygon points="78,128 122,128 114,152 86,152" fill="#b45309" stroke="#78350f" strokeWidth={3} strokeLinejoin="round" />
        <line x1={82} y1={138} x2={118} y2={138} stroke="#78350f" strokeWidth={2} />
      </g>
    </svg>
  );
}

export default function WordsHangman() {
  const { phone } = useLayoutMode();
  const [filter, setFilter] = useState<WordFilter>(readFilter);
  const [lives, setLives] = useState(() => {
    const n = Number(new URLSearchParams(window.location.search).get("lives"));
    return LIVES.includes(n) ? n : 6;
  });
  const [playing, setPlaying] = useState(false);
  const [info, setInfo] = useState(false);

  const [queue, setQueue] = useState<MathsWord[]>([]);
  const [word, setWord] = useState<MathsWord | null>(null);
  const [clueIdx, setClueIdx] = useState(0);
  const [guessed, setGuessed] = useState<string[]>([]);
  const [extraWrong, setExtraWrong] = useState(0);
  const [score, setScore] = useState({ saved: 0, lost: 0 });

  const pool = () => eligibleWords(filter).filter(w => lettersOf(w).length <= MAX_LETTERS);
  const available = useMemo(() => Math.min(maxDistinct(filter), pool().length), [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const wrongLetters = word ? guessed.filter(l => !lettersOf(word).toUpperCase().includes(l)) : [];
  const wrong = wrongLetters.length + extraWrong;
  const complete = !!word && [...lettersOf(word).toUpperCase()].every(l => guessed.includes(l));
  const status: "playing" | "won" | "lost" = !word ? "playing" : complete ? "won" : wrong >= lives ? "lost" : "playing";

  const startWord = useCallback((w: MathsWord) => {
    setWord(w); setGuessed([]); setExtraWrong(0);
    const eligible = w.clues.map((c, i) => (filter.kinds.includes(c.k) ? i : -1)).filter(i => i >= 0);
    setClueIdx(eligible[Math.floor(Math.random() * eligible.length)]);
  }, [filter.kinds]);

  const nextWord = () => {
    let q = queue;
    if (q.length === 0) q = shuffle(pool(), Math.random);
    startWord(q[0]);
    setQueue(q.slice(1));
  };

  const start = () => {
    writeParams(filter, { lives: String(lives) });
    const q = shuffle(pool(), Math.random);
    setScore({ saved: 0, lost: 0 });
    setPlaying(true);
    startWord(q[0]);
    setQueue(q.slice(1));
  };

  const guess = useCallback((l: string) => {
    if (!word || status !== "playing" || guessed.includes(l)) return;
    const next = [...guessed, l];
    setGuessed(next);
    const w = next.filter(x => !lettersOf(word).toUpperCase().includes(x)).length + extraWrong;
    const done = [...lettersOf(word).toUpperCase()].every(x => next.includes(x));
    if (done) setScore(s => ({ ...s, saved: s.saved + 1 }));
    else if (w >= lives) setScore(s => ({ ...s, lost: s.lost + 1 }));
  }, [word, status, guessed, extraWrong, lives]);

  useEffect(() => {
    if (!playing) return;
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const l = e.key.toUpperCase();
      if (/^[A-Z]$/.test(l)) guess(l);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [playing, guess]);

  const otherClues = word ? word.clues.map((c, i) => (filter.kinds.includes(c.k) ? i : -1)).filter(i => i >= 0) : [];
  const anotherClue = () => {
    const at = otherClues.indexOf(clueIdx);
    setClueIdx(otherClues[(at + 1) % otherClues.length]);
  };

  const revealLetter = () => {
    if (!word || status !== "playing") return;
    const left = [...new Set(lettersOf(word).toUpperCase())].filter(l => !guessed.includes(l));
    if (left.length <= 1) return;           // never hand over the last letter
    const l = left[Math.floor(Math.random() * left.length)];
    const next = [...guessed, l];
    setGuessed(next);
    const w = next.filter(x => !lettersOf(word).toUpperCase().includes(x)).length + extraWrong + 1;
    setExtraWrong(extraWrong + 1);
    if (w >= lives) setScore(s => ({ ...s, lost: s.lost + 1 }));
  };

  // ── Setup ──────────────────────────────────────────────────────────────────
  if (!playing) {
    return (
      <>
        <SetupScreen
          title="Maths Hangman" subtitle="Work out the hidden word from the clue. Don't pop all the balloons."
          filter={filter} onFilter={setFilter} available={available} needed={1}
          startLabel="Start game" onStart={start} onInfo={() => setInfo(true)}
        >
          <h2 className="font-semibold text-slate-900 mb-3">Balloons</h2>
          <div className="grid grid-cols-3 gap-3">
            {LIVES.map(n => (
              <button key={n} onClick={() => setLives(n)} className={`${optionChip(lives === n)} text-center font-semibold text-slate-900`}>{n}</button>
            ))}
          </div>
        </SetupScreen>
        {info && <InfoModal infoSections={INFO_SECTIONS} onClose={() => setInfo(false)} />}
      </>
    );
  }

  // ── Play ───────────────────────────────────────────────────────────────────
  const clue = word ? word.clues[clueIdx] : null;
  const shown = word ? [...word.word] : [];
  const key = (l: string) => {
    if (!word) return "";
    const used = guessed.includes(l);
    const hit = lettersOf(word).toUpperCase().includes(l);
    return used ? (hit ? "bg-emerald-100 border-emerald-500 text-emerald-800" : "bg-rose-50 border-rose-300 text-rose-300") : "bg-white border-slate-300 text-slate-800 hover:bg-sky-50 active:scale-95";
  };
  const sub = "flex items-center justify-center gap-2 rounded-xl px-3 py-2 font-semibold text-slate-700 border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40";

  return (
    <div className="fixed inset-0 z-30 flex flex-col p-3 sm:p-5 gap-3" style={{ background: PAGE_BG }}>
      <style>{CSS}</style>
      <div className="flex items-center justify-between">
        <button onClick={() => setPlaying(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-slate-600 hover:bg-white"><Settings size={18} />Setup</button>
        <div className="text-slate-500 font-semibold">Saved {score.saved} · Lost {score.lost}</div>
        <button onClick={() => setInfo(true)} aria-label="Information" className="p-2 rounded-xl text-slate-500 hover:bg-white"><Info size={20} /></button>
      </div>

      <div className={`flex-1 min-h-0 grid gap-3 sm:gap-4 ${phone ? "grid-rows-[1fr_auto]" : "grid-cols-2"}`}>
        <div className="min-h-0 rounded-3xl border border-slate-300 shadow-card bg-white p-4 sm:p-6 flex items-center justify-center">
          {clue && <div key={`${word?.id}-${clueIdx}`} className="hm-in w-full h-full flex items-center justify-center"><ClueView clue={clue} phone={phone} /></div>}
        </div>

        <div className="min-h-0 flex flex-col gap-3">
          <div className="rounded-3xl border border-slate-300 shadow-card bg-white p-3 flex-1 min-h-0" style={{ maxHeight: phone ? 150 : undefined }}>
            <Balloons lives={lives} wrong={Math.min(wrong, lives)} status={status} />
          </div>

          <div className="flex flex-wrap justify-center gap-x-1.5 gap-y-2 px-1" aria-label="The hidden word">
            {shown.map((ch, i) => {
              if (!/[a-z]/i.test(ch)) return <span key={i} className="self-end text-2xl sm:text-4xl font-semibold text-slate-500 w-4 text-center">{ch === " " ? "" : ch}</span>;
              const on = guessed.includes(ch.toUpperCase()) || status !== "playing";
              const missed = status === "lost" && !guessed.includes(ch.toUpperCase());
              return (
                <span key={i} className={`border-b-4 border-slate-700 w-7 sm:w-11 text-center text-2xl sm:text-4xl font-semibold ${missed ? "text-rose-500" : "text-slate-900"}`} style={{ minHeight: "1.4em" }}>
                  {on && <span key={`${i}-${on}`} className="hm-in inline-block">{ch.toUpperCase()}</span>}
                </span>
              );
            })}
          </div>

          {status !== "playing" ? (
            <div className="hm-in flex items-center justify-between gap-3 rounded-2xl bg-white border border-slate-300 px-4 py-3">
              <div className={`text-xl sm:text-2xl font-semibold ${status === "won" ? "text-emerald-700" : "text-rose-600"}`}>
                {status === "won" ? "Saved! " : "Popped! "}<span className="text-slate-900">{word?.word}</span>
              </div>
              <button onClick={nextWord} className="rounded-xl bg-blue-900 text-white font-semibold px-5 py-3">Next word</button>
            </div>
          ) : (
            <div className="grid grid-cols-9 gap-1.5 sm:gap-2" style={{ gridTemplateColumns: "repeat(9, minmax(0, 1fr))" }}>
              {LETTERS.map(l => (
                <button key={l} onClick={() => guess(l)} disabled={guessed.includes(l)}
                  className={`rounded-lg border font-semibold text-lg sm:text-2xl py-1.5 sm:py-2.5 transition-all ${key(l)}`}>
                  {l}
                </button>
              ))}
            </div>
          )}

          {status === "playing" && (
            <div className="flex gap-2 justify-center flex-wrap">
              <button onClick={anotherClue} disabled={otherClues.length < 2} className={sub}><Shuffle size={16} />Another clue</button>
              <button onClick={revealLetter} className={sub}><Lightbulb size={16} />Reveal a letter (−1 balloon)</button>
              <button onClick={() => { setExtraWrong(lives); setScore(s => ({ ...s, lost: s.lost + 1 })); }} className={sub}><Eye size={16} />Give up</button>
            </div>
          )}
        </div>
      </div>
      {info && <InfoModal infoSections={INFO_SECTIONS} onClose={() => setInfo(false)} />}
    </div>
  );
}
