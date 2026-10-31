import { useFullscreenFlag } from "../fullscreenFlag";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Info, ListChecks, Maximize, MessageCircle, Minimize } from "lucide-react";
import { InlineMath } from "./MathRenderer";
import { DepthSlide } from "./DepthSlide";
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
  /** A Teach deck plays ONE item as two beats (question, then answer): the deck owns the slide index and the keys, and the
   *  picker, slide switch, Present and follow-on buttons are left out. Same stage, speakers, options and Feathers. */
  embedded?: { slide: 0 | 1; /** where to draw Feathers / Teacher notes (the deck's own button row); until it exists nothing is drawn */ controlsHost?: HTMLElement | null };
}

export function DepthMode({ items, level, onLevelChange, itemId, onItemChange, narrow = false, optionInfo, activeOptions, embedded }: DepthModeProps) {
  const [purpose, setPurpose] = useState<DepthPurpose | "all">("all");
  const [slideState, setSlide] = useState<0 | 1>(0); // 0 = the question slide, 1 = the answer slide
  const slide: 0 | 1 = embedded ? embedded.slide : slideState;
  const [check, setCheck] = useState<number | null>(null); // index into `starts` while a quick check runs
  const [showNote, setShowNote] = useState(false);
  const [present, setPresent] = useState(false);
  useFullscreenFlag(present);
  // Feathers' speech bubble: on by default, switched off per device from the controls under the slide.
  const [feathersOn, setFeathersOn] = useState(() => { try { return localStorage.getItem("mt-depth-feathers") !== "off"; } catch { return true; } });
  const toggleFeathers = () => setFeathersOn((v) => { const n = !v; try { localStorage.setItem("mt-depth-feathers", n ? "on" : "off"); } catch { /* storage unavailable: session only */ } return n; });
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
  useEffect(() => { setSlide(0); setShowNote(false); }, [itemId]);
  // Arriving with ?item=<id> and no (or a different) level adopts the item's level; a level change made
  // by the teacher under an open item closes it. (Comparing with the previous level, not a one-shot flag,
  // keeps this correct when React runs effects twice in development.)
  const prevLevel = useRef(level);
  useEffect(() => {
    const was = prevLevel.current;
    prevLevel.current = level;
    if (embedded || !current || current.level === level) return;
    if (was === level) onLevelChange(current.level); else onItemChange(null);
  }, [level]); // eslint-disable-line react-hooks/exhaustive-deps -- deliberate: reacts to the level changing, not to the callbacks or the open item

  const toQuestion = useCallback(() => setSlide(0), []);
  const toAnswer = useCallback(() => setSlide(1), []);

  // Slide keys while an item is open: → / Space / PageDown go to the answer, ← / PageUp back; Esc leaves Present.
  useEffect(() => {
    if (!current || embedded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); toAnswer(); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); toQuestion(); }
      else if (e.key === "Escape" && present) setPresent(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, present, toAnswer, toQuestion, embedded]);

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
      <div className={`rounded-2xl border border-slate-200 shadow-card bg-white ${narrow ? "p-4" : "p-8"}`}>
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
                className={`px-4 py-1.5 rounded-full font-semibold text-sm border transition-colors ${on ? "bg-blue-900 text-white border-blue-900" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}>
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
                  className={`text-left rounded-2xl border bg-white p-4 shadow-card transition-colors flex flex-col ${narrow ? "" : "min-h-[8.5rem]"} ${unmet ? "border-gray-200 opacity-50 cursor-not-allowed" : PURPOSE_STYLE[it.purpose].card}`}>
                  <span className={`self-start px-2.5 py-0.5 rounded-full text-xs font-semibold ${PURPOSE_STYLE[it.purpose].badge}`}>{purposeLabel(it.purpose)}</span>
                  <div className="mt-2 font-semibold text-gray-900 text-lg leading-snug"><InlineMath text={it.title} /></div>
                  <div className="mt-auto pt-2 text-xs text-gray-500">
                    {unmet ? <span className="font-semibold text-gray-600">{unmet}</span> : it.options ? `${it.options.length} choices` : "Open question"}
                  </div>
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

  // The item itself is the same slide the deck draws (DepthSlide); this component adds the picker, the level, the follow-on buttons
  // and Present around it. Wide screens show it on a 16:9 stage; a phone lets it flow as a column.
  const face = (
    <DepthSlide item={current} answer={onAnswer} live base={narrow ? "16px" : "2.9cqw"} fit={!narrow} frame feathersOn={feathersOn} tag={inCheck ? `Quick check ${check! + 1} of ${starts.length}` : undefined} />
  );
  const stage = narrow ? face : (
    <div style={{ background: "#f8f9fb", aspectRatio: "16 / 9", padding: "1.2cqw", boxSizing: "border-box", borderRadius: present ? 0 : "0.9rem", overflow: "hidden" }}>{face}</div>
  );

  const ghost = present ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-blue-900";
  const embeddedControls = embedded?.controlsHost ? createPortal(
    <span className="relative flex items-center gap-2">
      <button onClick={toggleFeathers} aria-pressed={feathersOn} title="Show or hide Feathers' prompts"
        className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 border ${feathersOn ? "bg-blue-100 text-blue-900 border-blue-200" : "bg-white text-gray-500 border-slate-200 hover:bg-gray-50"}`}>
        <MessageCircle size={14} /> Feathers
      </button>
      {current.teacherNote && (
        <button onClick={() => setShowNote((v) => !v)} aria-pressed={showNote}
          className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 border ${showNote ? "bg-amber-200 text-amber-900 border-amber-300" : "bg-white text-gray-700 border-slate-200 hover:bg-gray-50"}`}>
          <Info size={14} /> Teacher notes
        </button>
      )}
      {showNote && current.teacherNote && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900 shadow-lift text-left" style={{ width: "min(34rem, 90vw)", zIndex: 5 }}><span className="font-semibold">Teacher: </span><InlineMath text={current.teacherNote} /></div>
      )}
    </span>,
    embedded.controlsHost,
  ) : null;
  const controls = embedded ? embeddedControls : (
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
        <button onClick={toggleFeathers} aria-pressed={feathersOn} title="Show or hide Feathers' prompts"
          className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 ${feathersOn ? "bg-blue-100 text-blue-900" : "bg-white text-gray-500 shadow hover:bg-gray-50"}`}>
          <MessageCircle size={15} /> Feathers
        </button>
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
            <button onClick={() => open(notSecure.id)} className="px-4 py-2 rounded-lg border border-slate-200 bg-white font-bold text-sm text-gray-800 hover:bg-gray-50 text-left">
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
