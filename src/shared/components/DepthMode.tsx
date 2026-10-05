import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Info, ListChecks, Maximize, Minimize } from "lucide-react";
import { InlineMath, MathRenderer } from "./MathRenderer";
import { BidmasPyramid } from "./BidmasPyramid";
import { Avatar, Badge, Mascot } from "./DepthArt";
import { LV_LABELS } from "../colors";
import { DEPTH_PURPOSES, depthUnmet, type DepthItem, type DepthOptionInfo, type DepthPurpose } from "../depth";
import type { DifficultyLevel } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// Depth mode — the picker, and each question as a two-slide mini presentation.
//
// A question is TWO slides: the question, then the answer (← / → / Space, or the Question | Answer
// switch). Each slide is designed like a classroom slide: a coloured 16:9 background, a white panel
// with a small brand badge on its top edge, cartoon speakers with speech bubbles, big type, and a
// mascot at the bottom. All sizes inside the slide are `em`, and the stage's base font scales with
// its width (container-query units), so the whole slide scales as one. Present fills the screen
// (an overlay that works everywhere, plus native fullscreen where the browser allows). On a phone
// the slide flows as a normal column.
//
// Controlled by ToolShell: the level toggle and the open item live there so both are shareable in the
// URL (`?mode=depth&level=2&item=<id>`).
// ─────────────────────────────────────────────────────────────────────────────

const PURPOSE_STYLE: Record<DepthPurpose, { badge: string; card: string }> = {
  diagnose: { badge: "bg-blue-100 text-blue-900", card: "border-blue-200 hover:border-blue-400" },
  explain: { badge: "bg-amber-100 text-amber-900", card: "border-amber-200 hover:border-amber-400" },
  extend: { badge: "bg-emerald-100 text-emerald-900", card: "border-emerald-200 hover:border-emerald-400" },
};
const LEVEL_ORDER: DifficultyLevel[] = ["level1", "level2", "level3"];
const SPEAKER_COLOURS = ["#7c3aed", "#e11d48", "#059669", "#d97706", "#2563eb"];
const NAVY = "#1e3a8a";
const PAPER = NAVY;
const PURPOSE_COLOURS: Record<string, string> = { diagnose: "#3b82f6", explain: "#f59e0b", extend: "#10b981" };
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
  /** The Question Options on offer now (value → pool/label) and which are switched on. With these, items whose
   *  `needs` aren't met are greyed out in the picker, so a class building up never gets a question it can't meet. */
  optionInfo?: DepthOptionInfo;
  activeOptions?: ReadonlySet<string>;
}

export function DepthMode({ items, level, onLevelChange, itemId, onItemChange, narrow = false, optionInfo, activeOptions }: DepthModeProps) {
  const [purpose, setPurpose] = useState<DepthPurpose | "all">("all");
  const [slide, setSlide] = useState<0 | 1>(0); // 0 = the question slide, 1 = the answer slide
  const [check, setCheck] = useState<number | null>(null); // index into `starts` while a quick check runs
  const [picked, setPicked] = useState<number | null>(null); // tapped line of working
  const [showNote, setShowNote] = useState(false);
  const [present, setPresent] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const current = itemId ? byId.get(itemId) : undefined;
  const starts = useMemo(
    () => items.filter((i) => i.startHere).sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level)),
    [items],
  );
  const atLevel = useMemo(() => items.filter((i) => i.level === level), [items, level]);
  // Why an item (at this level) can't be met with the current Question Options, or null.
  const unmetOf = useCallback(
    (i: DepthItem) => (optionInfo && activeOptions ? depthUnmet(i, activeOptions, optionInfo) : null),
    [optionInfo, activeOptions],
  );
  const inPurpose = atLevel.filter((i) => purpose === "all" || i.purpose === purpose);
  // Items that can be met come first; the rest follow, greyed out with what they need.
  const visible = [...inPurpose.filter((i) => !unmetOf(i)), ...inPurpose.filter((i) => unmetOf(i))];
  const nUnmet = atLevel.filter((i) => unmetOf(i)).length;

  // New item → back to the question slide.
  useEffect(() => { setSlide(0); setPicked(null); setShowNote(false); }, [itemId]);
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

  const toQuestion = useCallback(() => setSlide(0), []);
  const toAnswer = useCallback(() => setSlide(1), []);

  // Slide keys while an item is open: → / Space / PageDown go to the answer, ← / PageUp back; Esc leaves Present.
  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); toAnswer(); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); toQuestion(); }
      else if (e.key === "Escape" && present) setPresent(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, present, toAnswer, toQuestion]);

  // Present: a full-screen overlay (works in every browser), and native fullscreen on top where the
  // browser allows it. Leaving native fullscreen (Esc) also leaves Present.
  useEffect(() => {
    if (!present) return;
    const el = wrapRef.current as (HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> }) | null;
    try { void (el?.requestFullscreen?.() ?? el?.webkitRequestFullscreen?.())?.catch?.(() => {}); } catch { /* overlay is enough */ }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onFs = () => { if (!document.fullscreenElement) setPresent(false); };
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      document.body.style.overflow = prevOverflow;
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    };
  }, [present]);

  const open = (id: string) => {
    const it = byId.get(id);
    if (!it) return;
    if (it.level !== level) onLevelChange(it.level);
    onItemChange(id);
  };
  const toPicker = () => { setCheck(null); setPresent(false); onItemChange(null); };
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
            const pool = atLevel.filter((i) => !unmetOf(i));
            const n = p.key === "all" ? pool.length : pool.filter((i) => i.purpose === p.key).length;
            const on = purpose === p.key;
            return (
              <button key={p.key} onClick={() => setPurpose(p.key)}
                className={`px-4 py-1.5 rounded-full font-bold text-sm border-2 transition-colors ${on ? "bg-blue-900 text-white border-blue-900" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}>
                {p.label} <span className={on ? "opacity-80" : "text-gray-400"}>{n}</span>
              </button>
            );
          })}
        </div>

        {nUnmet > 0 && (
          <p className="text-xs text-gray-500 -mt-2 mb-3">{nUnmet} greyed out: they need a Question Option that is switched off. Change the options above to bring them back.</p>
        )}

        {visible.length === 0 ? (
          <p className="text-gray-500 py-8 text-center">No questions here yet for this level.</p>
        ) : (
          <div className={`grid gap-3 ${narrow ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3"}`}>
            {visible.map((it) => {
              const unmet = unmetOf(it);
              return (
                <button key={it.id} onClick={() => open(it.id)} disabled={!!unmet} title={unmet ? `${unmet} (switch it on in Question Options)` : undefined}
                  className={`text-left rounded-xl border-2 bg-white p-4 shadow-sm transition-colors ${unmet ? "border-gray-200 opacity-50 cursor-not-allowed" : PURPOSE_STYLE[it.purpose].card}`}>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${PURPOSE_STYLE[it.purpose].badge}`}>{purposeLabel(it.purpose)}</span>
                  <div className="mt-2 font-bold text-gray-900 text-lg leading-snug">{it.title}</div>
                  {unmet
                    ? <div className="mt-1 text-xs font-semibold text-gray-600">{unmet}</div>
                    : it.options && <div className="mt-1 text-xs text-gray-500">{it.options.length} choices</div>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── The slides ────────────────────────────────────────────────────────────
  const onAnswer = slide === 1;
  const inCheck = check !== null;
  const notSecure = current.ifNotSecure ? byId.get(current.ifNotSecure) : undefined;
  const secure = current.ifSecure ? byId.get(current.ifSecure) : undefined;

  const options = current.options && (
    <div className="grid" style={{ gap: "0.6em", width: "100%", gridTemplateColumns: narrow ? "1fr" : `repeat(${Math.min(current.options.length, 3)}, minmax(0, 1fr))` }}>
      {current.options.map((o, i) => {
        const right = onAnswer && o.correct;
        const wrong = onAnswer && !o.correct;
        return (
          <div key={i} style={{
            borderRadius: "0.9em", padding: "0.5em 0.8em", display: "flex", flexDirection: "column", gap: "0.25em",
            border: `0.14em solid ${right ? "#16a34a" : "#cbd5e1"}`,
            background: right ? "#f0fdf4" : wrong ? "#f8fafc" : "#fff",
            opacity: wrong ? 0.9 : 1,
          }}>
            <div className="flex items-center" style={{ gap: "0.6em" }}>
              <span className="flex-shrink-0 flex items-center justify-center font-bold text-white"
                style={{ width: "1.9em", height: "1.9em", borderRadius: "50%", background: right ? "#16a34a" : NAVY, fontSize: "0.9em" }}>
                {String.fromCharCode(65 + i)}
              </span>
              <span style={{ fontSize: "1.3em", fontWeight: 650, lineHeight: 1.2 }}><InlineMath text={o.text} /></span>
              {right && <span style={{ marginLeft: "auto", fontSize: "0.8em", fontWeight: 800, color: "#15803d" }}>Correct</span>}
            </div>
            {wrong && o.misconception && (
              <div style={{ fontSize: "0.78em", color: "#475569", lineHeight: 1.3 }}><span style={{ fontWeight: 800 }}>Shows: </span><InlineMath text={o.misconception} /></div>
            )}
          </div>
        );
      })}
    </div>
  );

  const working = current.working && (
    <div style={{ width: "100%" }}>
      {current.working.intro && !onAnswer && <div style={{ fontSize: "1.1em", marginBottom: "0.3em", textAlign: "left" }}><InlineMath text={current.working.intro} /></div>}
      <div className="flex flex-col" style={{ gap: "0.25em" }}>
        {current.working.lines.map((ln, i) => {
          const w = current.working!;
          const isWrong = onAnswer && i === w.wrongLine;
          const after = onAnswer && i > w.wrongLine;
          const isPick = !onAnswer && picked === i;
          return (
            <button key={i} onClick={() => !onAnswer && setPicked((p) => (p === i ? null : i))}
              className="flex items-center text-left transition-colors"
              style={{
                gap: "0.7em", padding: "0.15em 0.7em", borderRadius: "0.5em", opacity: after ? 0.45 : 1, cursor: onAnswer ? "default" : "pointer",
                border: `0.12em solid ${isWrong ? "#dc2626" : isPick ? "#d97706" : "#e2e8f0"}`,
                background: isWrong ? "#fef2f2" : isPick ? "#fffbeb" : "#fff",
              }}>
              <span className="flex-shrink-0 text-center font-bold" style={{ width: "1.4em", fontSize: "0.7em", color: "#94a3b8" }}>{i + 1}</span>
              <span style={{ fontSize: "1.25em" }}><MathRenderer latex={ln} style={{ fontSize: "1em" }} /></span>
              {isWrong && <span style={{ marginLeft: "auto", fontSize: "0.7em", fontWeight: 800, color: "#dc2626" }}>First mistake</span>}
              {isPick && <span style={{ marginLeft: "auto", fontSize: "0.65em", fontWeight: 700, color: "#b45309" }}>Our pick</span>}
            </button>
          );
        })}
      </div>
    </div>
  );

  // ---- Slide 1: the question ----
  const questionSlide = (
    <>
      {current.speakers && (
        <div className="flex flex-col" style={{ gap: "0.5em", width: "100%" }}>
          {current.speakers.map((sp, i) => {
            const col = SPEAKER_COLOURS[i % SPEAKER_COLOURS.length];
            return (
              <div key={i} className="flex items-center" style={{ gap: "0.7em" }}>
                <Avatar index={i} size="4.2em" />
                <div style={{ position: "relative", border: `0.14em solid ${col}`, borderRadius: "1.2em", padding: "0.4em 1.1em", background: "#fff", minWidth: 0, flex: 1 }}>
                  {/* tail pointing back at the speaker */}
                  <span style={{ position: "absolute", left: "-0.55em", top: "50%", width: "0.9em", height: "0.9em", background: "#fff", borderLeft: `0.14em solid ${col}`, borderBottom: `0.14em solid ${col}`, transform: "translateY(-50%) rotate(45deg)" }} />
                  <div style={{ fontSize: "0.62em", fontWeight: 800, color: col, textTransform: "uppercase", letterSpacing: "0.1em" }}>{sp.name}</div>
                  {sp.says.map((line, k) => <div key={k} style={{ fontSize: "1.3em", fontWeight: 600, lineHeight: 1.3 }}><InlineMath text={line} /></div>)}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {working}
      <div className="flex flex-col items-start text-left" style={{ gap: "0.15em" }}>
        {current.question.map((line, i) => (
          <div key={i} style={{ fontSize: "1.45em", fontWeight: 650, lineHeight: 1.3, color: "#111827" }}><InlineMath text={line} /></div>
        ))}
      </div>
      {options}
    </>
  );

  // ---- Slide 2: the answer ----
  const answerSlide = (
    <>
      <div style={{ fontSize: "0.7em", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#15803d" }}>Answer</div>
      {working}
      {options}
      <div className="flex flex-col" style={{ gap: "0.3em", width: "100%", borderLeft: "0.3em solid #16a34a", paddingLeft: "0.9em" }}>
        {current.answer.map((line, i) => (
          <div key={i} style={{ fontSize: current.options || current.working ? "1.2em" : "1.4em", lineHeight: 1.35, color: "#111827" }}><InlineMath text={line} /></div>
        ))}
      </div>
    </>
  );

  const accent = PURPOSE_COLOURS[current.purpose];
  const stageStyle = narrow
    ? { background: PAPER, borderRadius: "0.9rem", fontSize: "16px", padding: "0.8em" }
    : { background: PAPER, aspectRatio: "16 / 9", fontSize: "1.9cqw", borderRadius: present ? 0 : "0.9rem" };
  const pill = (bg: string, fg: string): React.CSSProperties => ({ fontSize: "0.7em", fontWeight: 800, padding: "0.2em 0.8em", borderRadius: "999px", background: bg, color: fg, whiteSpace: "nowrap" });

  const levelPill = <span style={pill("rgba(255,255,255,0.92)", NAVY)}>{LV_LABELS[current.level]}{inCheck ? ` · ${check! + 1} of ${starts.length}` : ""}</span>;
  const purposePill = <span style={pill("#fff", accent)}>{purposeLabel(current.purpose)}</span>;

  const stage = (
    <div style={{ position: "relative", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.18)", ...stageStyle } as React.CSSProperties}>
      {/* left rail (desktop) / header row (phone): wordmark, pills, owl */}
      {narrow ? (
        <div className="flex items-center justify-between" style={{ marginBottom: "0.6em", gap: "0.5em" }}>
          <Badge colour="#fff" />
          <div className="flex items-center" style={{ gap: "0.4em" }}>{levelPill}{purposePill}</div>
        </div>
      ) : (
        <div className="flex flex-col items-start justify-between" style={{ position: "absolute", top: "1.4em", bottom: "0.8em", left: "1.6em", width: "13%", zIndex: 2 }}>
          <div className="flex flex-col items-start" style={{ gap: "0.7em" }}>
            <Badge colour="#fff" />
            <div className="flex flex-col items-start" style={{ gap: "0.35em" }}>{levelPill}{purposePill}</div>
          </div>
          <Mascot mood={onAnswer ? "know" : "think"} size="6.2em" tone="light" />
        </div>
      )}

      {/* the white panel */}
      <div className="flex flex-col items-start justify-center"
        style={narrow
          ? { position: "relative", background: "#fff", borderRadius: "1em", borderTop: `0.4em solid ${accent}`, boxShadow: "0 0.15em 0.6em rgba(0,0,0,0.08)", padding: "1em", gap: "0.7em" }
          : { position: "absolute", top: "1.2em", bottom: "1.2em", left: "19%", right: "2.5%", background: "#fff", borderRadius: "1.1em", borderTop: `0.4em solid ${accent}`, boxShadow: "0 0.2em 0.9em rgba(0,0,0,0.08)", padding: "1.4em 1.8em 1.3em", gap: "0.65em", overflow: "auto" }}>
        <div className="flex flex-col items-start justify-center" style={{ gap: narrow ? "0.7em" : "0.65em", width: "100%", margin: "auto 0" }}>
          {onAnswer ? answerSlide : questionSlide}
        </div>
        {/* the key lives in the panel's corner: visible from the start, lit on the answer slide */}
        {current.visual?.type === "pyramid" && (
          <div style={{ position: "absolute", top: "0.9em", right: "1.1em", width: narrow ? "6em" : "7.2em" }}>
            <BidmasPyramid strong={onAnswer ? current.visual.strong : []} soft={onAnswer ? current.visual.soft : []} maxWidth={200} />
          </div>
        )}
      </div>

      {narrow && <div style={{ display: "flex", justifyContent: "flex-start", marginTop: "0.4em" }}><Mascot mood={onAnswer ? "know" : "think"} size="4.4em" tone="light" /></div>}
    </div>
  );

  const ghost = present ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-blue-900";
  const controls = (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${present ? "px-4 py-3 w-full max-w-5xl" : "mt-4"}`}>
      <button onClick={toPicker} className={`flex items-center gap-1.5 text-sm font-bold ${ghost}`}>
        <ArrowLeft size={16} /> {inCheck ? "End quick check" : "All questions"}
      </button>

      <div className="flex items-center gap-2">
        <button onClick={toQuestion} disabled={slide === 0} aria-label="Question slide"
          className="w-10 h-10 rounded-full bg-white text-blue-900 shadow flex items-center justify-center disabled:opacity-30 hover:bg-gray-50"><ChevronLeft size={22} /></button>
        <div className="flex rounded-full overflow-hidden shadow" role="tablist" aria-label="Slides">
          {(["Question", "Answer"] as const).map((label, i) => (
            <button key={label} role="tab" aria-selected={slide === i} onClick={() => setSlide(i as 0 | 1)}
              className={`px-5 py-2 text-sm font-bold ${slide === i ? "bg-blue-900 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}>{label}</button>
          ))}
        </div>
        <button onClick={toAnswer} disabled={slide === 1} aria-label="Answer slide"
          className="w-10 h-10 rounded-full bg-white text-blue-900 shadow flex items-center justify-center disabled:opacity-30 hover:bg-gray-50"><ChevronRight size={22} /></button>
      </div>

      <div className="flex items-center gap-2">
        {current.teacherNote && (
          <button onClick={() => setShowNote((v) => !v)} aria-pressed={showNote}
            className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 ${showNote ? "bg-amber-200 text-amber-900" : "bg-white text-gray-700 shadow hover:bg-gray-50"}`}>
            <Info size={15} /> Teacher notes
          </button>
        )}
        <button onClick={() => setPresent((v) => !v)} className="px-3 py-2 rounded-lg bg-white text-gray-700 shadow text-sm font-bold flex items-center gap-1.5 hover:bg-gray-50">
          {present ? <><Minimize size={15} /> Exit</> : <><Maximize size={15} /> Present</>}
        </button>
      </div>

      {showNote && current.teacherNote && (
        <div className="basis-full rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900"><span className="font-bold">Teacher: </span><InlineMath text={current.teacherNote} /></div>
      )}

      {onAnswer && (notSecure || secure || inCheck) && (
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
    <div ref={wrapRef}
      className={present ? "flex flex-col items-center justify-center" : ""}
      style={present ? { position: "fixed", inset: 0, zIndex: 1000, background: "#0f172a", overflowY: "auto" } : undefined}>
      <div style={{
        containerType: "inline-size",
        width: narrow ? "100%" : present ? "min(calc(100vw - 1.5rem), calc((100vh - 9rem) * 16 / 9))" : "100%",
      } as React.CSSProperties}>
        {stage}
      </div>
      {controls}
    </div>
  );
}
