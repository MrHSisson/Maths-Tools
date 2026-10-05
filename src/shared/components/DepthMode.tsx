import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Info, ListChecks, Maximize, Minimize, Minus, Plus } from "lucide-react";
import { InlineMath, MathRenderer } from "./MathRenderer";
import { BidmasPyramid } from "./BidmasPyramid";
import { LV_LABELS } from "../colors";
import { DEPTH_PURPOSES, type DepthItem, type DepthPurpose } from "../depth";
import type { DifficultyLevel } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// Depth mode — the picker, and each question as an interactive 16:9 slide.
//
// The slide works like a PowerPoint slide: a fixed 16:9 stage whose type scales with its width
// (container-query units), builds on → / Space (question → answer → one reasoning line per press),
// and a Present button that fills the screen. It is interactive: tap + / − under a choice to log the
// class's votes (the answer then shows the most common misconception in the room), tap the line
// of working you think is wrong, and speech bubbles carry "Jack says…". All sizes inside the slide
// are in `em`, so the whole slide scales as one. On a phone the slide flows as a normal column.
//
// Controlled by ToolShell: the level toggle and the open item live there so both are shareable in the
// URL (`?mode=depth&level=2&item=<id>`).
// ─────────────────────────────────────────────────────────────────────────────

const PURPOSE_STYLE: Record<DepthPurpose, { badge: string; card: string; solid: string }> = {
  diagnose: { badge: "bg-blue-100 text-blue-900", card: "border-blue-200 hover:border-blue-400", solid: "#2563eb" },
  explain: { badge: "bg-amber-100 text-amber-900", card: "border-amber-200 hover:border-amber-400", solid: "#d97706" },
  extend: { badge: "bg-emerald-100 text-emerald-900", card: "border-emerald-200 hover:border-emerald-400", solid: "#059669" },
};
const LEVEL_ORDER: DifficultyLevel[] = ["level1", "level2", "level3"];
const LEVEL_SOLID: Record<DifficultyLevel, string> = { level1: "#16a34a", level2: "#ca8a04", level3: "#dc2626" };
const SPEAKER_COLOURS = ["#2563eb", "#e11d48", "#059669", "#d97706", "#7c3aed"];
const NAVY = "#1e3a8a";
const purposeLabel = (p: DepthPurpose) => DEPTH_PURPOSES.find((x) => x.key === p)?.label ?? p;

export interface DepthModeProps {
  /** The items for the current sub-tool (all levels). */
  items: DepthItem[];
  level: DifficultyLevel;
  onLevelChange: (l: DifficultyLevel) => void;
  /** The open item, or null for the picker. */
  itemId: string | null;
  onItemChange: (id: string | null) => void;
  /** Phone layout: the slide flows as a normal column instead of a fixed 16:9 stage. */
  narrow?: boolean;
}

export function DepthMode({ items, level, onLevelChange, itemId, onItemChange, narrow = false }: DepthModeProps) {
  const [purpose, setPurpose] = useState<DepthPurpose | "all">("all");
  const [beat, setBeat] = useState(0);
  const [check, setCheck] = useState<number | null>(null); // index into `starts` while a quick check runs
  const [votes, setVotes] = useState<Record<string, number[]>>({}); // class votes per item, kept for the session
  const [picked, setPicked] = useState<number | null>(null); // tapped line of working
  const [showNote, setShowNote] = useState(false);
  const [fs, setFs] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const current = itemId ? byId.get(itemId) : undefined;
  const starts = useMemo(
    () => items.filter((i) => i.startHere).sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level)),
    [items],
  );
  const atLevel = useMemo(() => items.filter((i) => i.level === level), [items, level]);
  const visible = atLevel.filter((i) => purpose === "all" || i.purpose === purpose);

  // New item → back to the first beat. A level change under an open item → back to the picker.
  useEffect(() => { setBeat(0); setPicked(null); setShowNote(false); }, [itemId]);
  // Arriving with ?item=<id> and no (or a different) level adopts the item's level; a level change made
  // by the teacher under an open item closes it. (Comparing with the previous level, not a one-shot flag,
  // keeps this correct when React runs effects twice in development.)
  const prevLevel = useRef(level);
  useEffect(() => {
    const was = prevLevel.current;
    prevLevel.current = level;
    if (!current || current.level === level) return;
    if (was === level) onLevelChange(current.level); else onItemChange(null);
  }, [level]); // eslint-disable-line react-hooks/exhaustive-deps

  const last = current ? current.answer.length : 0; // beats are 0..last: 0 = question, then one reasoning line per beat
  const next = useCallback(() => setBeat((b) => Math.min(b + 1, last)), [last]);
  const prev = useCallback(() => setBeat((b) => Math.max(b - 1, 0)), []);

  // Slide-style keys while an item is open.
  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); prev(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, next, prev]);

  // Present (fullscreen).
  useEffect(() => {
    const onFs = () => setFs(document.fullscreenElement === wrapRef.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);
  const togglePresent = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void wrapRef.current?.requestFullscreen?.();
  };

  const open = (id: string) => {
    const it = byId.get(id);
    if (!it) return;
    if (it.level !== level) onLevelChange(it.level);
    onItemChange(id);
  };
  const toPicker = () => { setCheck(null); onItemChange(null); };
  const startCheck = () => { if (starts.length) { setCheck(0); open(starts[0].id); } };
  const nextCheck = () => {
    if (check === null) return;
    if (check + 1 < starts.length) { setCheck(check + 1); open(starts[check + 1].id); } else toPicker();
  };

  // ── Picker ────────────────────────────────────────────────────────────────
  if (!current) {
    return (
      <div className={`rounded-xl shadow-lg bg-white ${narrow ? "p-4" : "p-8"}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div>
            <h2 className={`${narrow ? "text-lg" : "text-2xl"} font-bold text-gray-900`}>Depth</h2>
            <p className="text-sm text-gray-500">Fixed questions for diagnosing, explaining and extending. Pick one to suit the class.</p>
          </div>
          {starts.length > 0 && (
            <button onClick={startCheck} className="px-4 py-2 rounded-lg bg-blue-900 text-white font-bold text-sm shadow-sm hover:bg-blue-800 flex items-center gap-2">
              <ListChecks size={16} /> Start here
              <span className="font-normal opacity-80">one quick question per level</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 my-4">
          {([{ key: "all", label: "All" }, ...DEPTH_PURPOSES] as { key: DepthPurpose | "all"; label: string }[]).map((p) => {
            const n = p.key === "all" ? atLevel.length : atLevel.filter((i) => i.purpose === p.key).length;
            const on = purpose === p.key;
            return (
              <button key={p.key} onClick={() => setPurpose(p.key)}
                className={`px-4 py-1.5 rounded-full font-bold text-sm border-2 transition-colors ${on ? "bg-blue-900 text-white border-blue-900" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}>
                {p.label} <span className={on ? "opacity-80" : "text-gray-400"}>{n}</span>
              </button>
            );
          })}
        </div>

        {visible.length === 0 ? (
          <p className="text-gray-500 py-8 text-center">No questions here yet for this level.</p>
        ) : (
          <div className={`grid gap-3 ${narrow ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3"}`}>
            {visible.map((it) => (
              <button key={it.id} onClick={() => open(it.id)}
                className={`text-left rounded-xl border-2 bg-white p-4 shadow-sm transition-colors ${PURPOSE_STYLE[it.purpose].card}`}>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${PURPOSE_STYLE[it.purpose].badge}`}>{purposeLabel(it.purpose)}</span>
                <div className="mt-2 font-bold text-gray-900 text-lg leading-snug">{it.title}</div>
                {it.options && <div className="mt-1 text-xs text-gray-500">{it.options.length} choices</div>}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── The slide ─────────────────────────────────────────────────────────────
  const revealed = beat >= 1;
  const itemVotes = votes[current.id] ?? (current.options ?? []).map(() => 0);
  const totalVotes = itemVotes.reduce((a, b) => a + b, 0);
  const setVote = (i: number, d: number) =>
    setVotes((v) => {
      const cur = [...(v[current.id] ?? (current.options ?? []).map(() => 0))];
      cur[i] = Math.max(0, cur[i] + d);
      return { ...v, [current.id]: cur };
    });
  // The most common wrong idea in the room, once the answer is up.
  const topWrong = revealed && current.options
    ? current.options.map((o, i) => ({ o, n: itemVotes[i] })).filter((x) => !x.o.correct && x.n > 0).sort((a, b) => b.n - a.n)[0]
    : undefined;
  const inCheck = check !== null;
  const notSecure = current.ifNotSecure ? byId.get(current.ifNotSecure) : undefined;
  const secure = current.ifSecure ? byId.get(current.ifSecure) : undefined;
  const bannerColour = PURPOSE_STYLE[current.purpose].solid;

  const stage = (
    <div
      className="bg-white overflow-hidden flex flex-col"
      style={{
        aspectRatio: narrow ? undefined : "16 / 9",
        fontSize: narrow ? "16px" : "1.9cqw",
        borderRadius: narrow ? "0.75rem" : fs ? 0 : "0.75rem",
        boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
      }}
    >
      {/* Title bar */}
      <div className="flex items-center justify-between flex-shrink-0" style={{ background: NAVY, color: "#fff", padding: "0.55em 1.1em" }}>
        <div style={{ fontSize: "0.75em", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.9 }}>{current.title}</div>
        <div className="flex items-center" style={{ gap: "0.5em" }}>
          {inCheck && <span style={{ fontSize: "0.7em", opacity: 0.85 }}>Quick check {check! + 1} of {starts.length}</span>}
          <span style={{ fontSize: "0.7em", fontWeight: 800, padding: "0.15em 0.7em", borderRadius: "999px", background: LEVEL_SOLID[current.level] }}>{LV_LABELS[current.level]}</span>
          <span style={{ fontSize: "0.7em", fontWeight: 800, padding: "0.15em 0.7em", borderRadius: "999px", background: bannerColour }}>{purposeLabel(current.purpose)}</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto flex flex-col" style={{ padding: "0.8em 1.3em", gap: "0.6em" }}>
        {current.speakers && (
          <div className="flex flex-wrap" style={{ gap: "0.9em" }}>
            {current.speakers.map((s, i) => {
              const col = SPEAKER_COLOURS[i % SPEAKER_COLOURS.length];
              return (
                <div key={i} className="flex items-start" style={{ gap: "0.55em", flex: "1 1 14em", minWidth: 0 }}>
                  <div className="flex-shrink-0 flex items-center justify-center font-bold text-white"
                    style={{ width: "2.2em", height: "2.2em", borderRadius: "50%", background: col, fontSize: "0.9em" }}>{s.name.charAt(0)}</div>
                  <div style={{ border: `0.12em solid ${col}`, borderRadius: "0.2em 0.9em 0.9em 0.9em", padding: "0.45em 0.9em", background: "#fff", minWidth: 0 }}>
                    <div style={{ fontSize: "0.65em", fontWeight: 800, color: col, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.name} says</div>
                    {s.says.map((line, k) => <div key={k} style={{ fontSize: "1.2em", fontWeight: 600, lineHeight: 1.3 }}><InlineMath text={line} /></div>)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {current.working && (
          <div>
            {current.working.intro && <div style={{ fontSize: "1.05em", marginBottom: "0.35em" }}><InlineMath text={current.working.intro} /></div>}
            <div className="flex flex-col" style={{ gap: "0.3em" }}>
              {current.working.lines.map((ln, i) => {
                const w = current.working!;
                const isWrong = revealed && i === w.wrongLine;
                const after = revealed && i > w.wrongLine;
                const isPick = picked === i && !isWrong;
                return (
                  <button key={i} onClick={() => setPicked((p) => (p === i ? null : i))}
                    className="flex items-center text-left transition-colors"
                    style={{
                      gap: "0.7em", padding: "0.25em 0.7em", borderRadius: "0.5em", opacity: after ? 0.5 : 1,
                      border: `0.12em solid ${isWrong ? "#dc2626" : isPick ? "#d97706" : "#e5e7eb"}`,
                      background: isWrong ? "#fef2f2" : isPick ? "#fffbeb" : "#fff",
                    }}>
                    <span className="flex-shrink-0 text-center font-bold" style={{ width: "1.5em", fontSize: "0.7em", color: "#6b7280" }}>{i + 1}</span>
                    <span style={{ fontSize: "1.3em" }}><MathRenderer latex={ln} style={{ fontSize: "1em" }} /></span>
                    {isWrong && <span style={{ marginLeft: "auto", fontSize: "0.7em", fontWeight: 800, color: "#dc2626" }}>First mistake</span>}
                    {after && <span style={{ marginLeft: "auto", fontSize: "0.65em", color: "#6b7280" }}>follows from the mistake</span>}
                    {isPick && <span style={{ marginLeft: "auto", fontSize: "0.65em", fontWeight: 700, color: "#b45309" }}>Our pick</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-start justify-between" style={{ gap: "1em" }}>
          <div className="flex flex-col" style={{ gap: "0.15em", minWidth: 0 }}>
            {current.question.map((line, i) => (
              <div key={i} style={{ fontSize: "1.25em", fontWeight: 650, lineHeight: 1.3, color: "#111827" }}><InlineMath text={line} /></div>
            ))}
          </div>
          {/* The key lives in the question section: small, in the corner, and lit up once the answer is revealed. */}
          {current.visual?.type === "pyramid" && (
            <div className="flex-shrink-0" style={{ width: "8.5em", marginTop: "-0.2em" }}>
              <BidmasPyramid strong={revealed ? current.visual.strong : []} soft={revealed ? current.visual.soft : []} maxWidth={220} />
            </div>
          )}
        </div>

        {current.options && (
          <div className="grid" style={{ gap: "0.7em", gridTemplateColumns: narrow ? "1fr" : `repeat(${Math.min(current.options.length, 3)}, minmax(0, 1fr))` }}>
            {current.options.map((o, i) => {
              const right = revealed && o.correct;
              const wrong = revealed && !o.correct;
              const share = totalVotes > 0 ? itemVotes[i] / totalVotes : 0;
              return (
                <div key={i} className="flex flex-col" style={{
                  borderRadius: "0.8em", padding: "0.45em 0.75em", gap: "0.3em",
                  border: `0.14em solid ${right ? "#16a34a" : "#d1d5db"}`,
                  background: right ? "#f0fdf4" : wrong ? "#f9fafb" : "#fff",
                }}>
                  <div className="flex items-center" style={{ gap: "0.6em" }}>
                    <span className="flex-shrink-0 flex items-center justify-center font-bold text-white"
                      style={{ width: "1.9em", height: "1.9em", borderRadius: "50%", background: right ? "#16a34a" : NAVY, fontSize: "0.9em" }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span style={{ fontSize: "1.2em", fontWeight: 650 }}><InlineMath text={o.text} /></span>
                  </div>

                  {/* Class vote */}
                  <div className="flex items-center" style={{ gap: "0.45em" }}>
                    <button onClick={() => setVote(i, -1)} aria-label={`Remove a vote for ${String.fromCharCode(65 + i)}`}
                      className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600"
                      style={{ width: "1.5em", height: "1.5em", borderRadius: "50%", fontSize: "0.8em" }}><Minus size={12} /></button>
                    <span className="font-bold text-center" style={{ minWidth: "1.6em", fontSize: "0.9em" }}>{itemVotes[i]}</span>
                    <button onClick={() => setVote(i, 1)} aria-label={`Add a vote for ${String.fromCharCode(65 + i)}`}
                      className="flex items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-900"
                      style={{ width: "1.5em", height: "1.5em", borderRadius: "50%", fontSize: "0.8em" }}><Plus size={12} /></button>
                    <div className="flex-1 bg-gray-100 overflow-hidden" style={{ height: "0.55em", borderRadius: "999px" }}>
                      <div style={{ width: `${share * 100}%`, height: "100%", background: right ? "#16a34a" : "#93c5fd", transition: "width 200ms" }} />
                    </div>
                    {totalVotes > 0 && <span style={{ fontSize: "0.7em", color: "#6b7280", minWidth: "2.4em", textAlign: "right" }}>{Math.round(share * 100)}%</span>}
                  </div>

                  {right && <div style={{ fontSize: "0.75em", fontWeight: 800, color: "#15803d" }}>Correct</div>}
                  {wrong && o.misconception && <div style={{ fontSize: "0.75em", color: "#4b5563" }}><span style={{ fontWeight: 800 }}>Shows: </span><InlineMath text={o.misconception} /></div>}
                </div>
              );
            })}
          </div>
        )}

        {/* Reasoning: one line per build */}
        {revealed && (
          <div className="flex items-stretch" style={{ gap: "1em" }}>
            <div className="flex-1 flex flex-col" style={{ gap: "0.25em", border: "0.14em solid #86efac", background: "#f0fdf4", borderRadius: "0.8em", padding: "0.5em 0.9em", minWidth: 0 }}>
              {topWrong && (
                <div style={{ fontSize: "0.8em", color: "#92400e", background: "#fef3c7", borderRadius: "0.5em", padding: "0.25em 0.7em" }}>
                  <span style={{ fontWeight: 800 }}>In the room: </span>{topWrong.n} of {totalVotes} chose {String.fromCharCode(65 + current.options!.indexOf(topWrong.o))}
                  {topWrong.o.misconception ? <> — <InlineMath text={topWrong.o.misconception} /></> : null}
                </div>
              )}
              {current.answer.slice(0, beat).map((line, i) => (
                <div key={i} style={{ fontSize: "1.1em", lineHeight: 1.35, color: "#111827" }}><InlineMath text={line} /></div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const dots = Array.from({ length: last + 1 }, (_, i) => i);
  const controls = (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${fs ? "px-4 py-3" : "mt-4"}`}>
      <button onClick={toPicker} className={`flex items-center gap-1.5 text-sm font-bold ${fs ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-blue-900"}`}>
        <ArrowLeft size={16} /> {inCheck ? "End quick check" : "All questions"}
      </button>

      <div className="flex items-center gap-3">
        <button onClick={prev} disabled={beat === 0} aria-label="Previous build"
          className="w-11 h-11 rounded-full bg-white text-blue-900 shadow flex items-center justify-center disabled:opacity-30 hover:bg-gray-50"><ChevronLeft size={22} /></button>
        <div className="flex items-center gap-1.5">
          {dots.map((d) => <span key={d} className="rounded-full" style={{ width: 9, height: 9, background: d === beat ? "#1e3a8a" : d < beat ? "#93c5fd" : "#d1d5db" }} />)}
        </div>
        <button onClick={next} disabled={beat === last} aria-label={beat === 0 ? "Show answer" : "Next build"}
          className="h-11 px-5 rounded-full bg-blue-900 text-white shadow font-bold flex items-center gap-1.5 disabled:opacity-30 hover:bg-blue-800">
          {beat === 0 ? "Show answer" : "Next"} <ChevronRight size={20} />
        </button>
        {beat < last && beat > 0 && <button onClick={() => setBeat(last)} className={`text-xs font-bold underline ${fs ? "text-gray-300" : "text-gray-500"}`}>Show all</button>}
        {beat === last && last > 0 && <button onClick={() => setBeat(0)} className={`text-xs font-bold underline ${fs ? "text-gray-300" : "text-gray-500"}`}>Hide answer</button>}
      </div>

      <div className="flex items-center gap-2">
        {current.teacherNote && (
          <button onClick={() => setShowNote((s) => !s)} aria-pressed={showNote}
            className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 ${showNote ? "bg-amber-200 text-amber-900" : "bg-white text-gray-700 shadow hover:bg-gray-50"}`}>
            <Info size={15} /> Teacher notes
          </button>
        )}
        {!narrow && (
          <button onClick={togglePresent} className="px-3 py-2 rounded-lg bg-white text-gray-700 shadow text-sm font-bold flex items-center gap-1.5 hover:bg-gray-50">
            {fs ? <><Minimize size={15} /> Exit</> : <><Maximize size={15} /> Present</>}
          </button>
        )}
      </div>

      {(showNote && current.teacherNote) && (
        <div className="basis-full rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900"><span className="font-bold">Teacher: </span><InlineMath text={current.teacherNote} /></div>
      )}

      {beat === last && (notSecure || secure || inCheck) && (
        <div className="basis-full flex flex-wrap gap-3 justify-center">
          {notSecure && (
            <button onClick={() => open(notSecure.id)} className="px-4 py-2 rounded-lg border-2 border-gray-300 bg-white font-bold text-sm text-gray-800 hover:bg-gray-50 text-left">
              <span className="block text-xs text-gray-500">Class not secure</span>{notSecure.title}
            </button>
          )}
          {secure && (
            <button onClick={() => open(secure.id)} className="px-4 py-2 rounded-lg border-2 border-emerald-300 bg-emerald-50 font-bold text-sm text-emerald-900 hover:bg-emerald-100 text-left">
              <span className="block text-xs text-emerald-700">Class secure</span>{secure.title}
            </button>
          )}
          {inCheck && (
            <button onClick={nextCheck} className="px-4 py-2 rounded-lg bg-blue-900 text-white font-bold text-sm hover:bg-blue-800">
              {check! + 1 < starts.length ? "Next quick check question" : "Finish quick check"}
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div ref={wrapRef} className={fs ? "bg-gray-900 flex flex-col items-center justify-center" : ""} style={fs ? { minHeight: "100vh" } : undefined}>
      <div style={{
        containerType: "inline-size",
        width: narrow ? "100%" : fs ? "min(100vw, calc((100vh - 4.5rem) * 16 / 9))" : "100%",
      } as React.CSSProperties}>
        {stage}
      </div>
      {controls}
    </div>
  );
}
