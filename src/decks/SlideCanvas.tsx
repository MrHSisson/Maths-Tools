import { DECK_SURFACE } from "./theme";
import { QuestionFrame } from "./QuestionFrame";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { InlineMath, MathRenderer } from "../shared/components/MathRenderer";
import { RoundDigits } from "../shared/components/RoundDigits";
import { RatioTable } from "../shared/components/RatioTable";
import { BarModel } from "../shared/components/BarModel";
import { barAtStage, barStages } from "../shared/barModel";
import type { RatioTableData } from "../shared";
import type { AnyQuestion } from "../shared";
import { SolutionStepper, useSolutionStepper } from "../shared/components/SolutionStepper";
import { QuestionSequence, QuestionText } from "./QuestionPresentation";
import { legacyItems } from "./questions";
import { generateFrom, generateSet, instructionOf, loadConfig, loadDepthItems, questionContent } from "./generators";
import { isFrozen, sheetQuestions } from "./worksheets";
import { WorkedPicture } from "./WorkedPicture";
import { NumberGridEl } from "./NumberGrid";
import { InkLayer } from "./InkLayer";
import { sieveSteps } from "../shared/numberGrid";
import { SLIDE_BUTTON_PX, slideButton } from "./slideButton";
import { DepthSlide } from "../shared/components/DepthSlide";
import type { DepthItem } from "../shared/depth";
import { bankQuestion } from "./store";
import { CANVAS_H, CANVAS_W, FAMILY_STYLE, type BoardGrid, type DeckElement, type FillMode, type Slide } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Draws one slide: a CANVAS_W × CANVAS_H page scaled to fit, its elements absolutely placed in canvas units.
// `live` makes the integrated elements work (the player); off, they are drawn as they first appear (the editor,
// thumbnails and the library), so dragging them never presses their buttons.
// ─────────────────────────────────────────────────────────────────────────────

const ACCENT_H = 14;

export function Lines({ text }: { text: string }) {
  return <>{text.split("\n").map((line, i) => <div key={i} style={{ minHeight: "1.25em" }}><InlineMath text={line} /></div>)}</>;
}

export function Board({ grid, fill, size }: { grid: BoardGrid; fill: FillMode; size: number }) {
  const given = grid.given ?? 1;
  const rowH = `${100 / (grid.rows.length + 1)}%`;
  return (
    <table style={{ width: "100%", height: "100%", borderCollapse: "collapse", fontSize: size, tableLayout: "fixed" }}>
      <thead>
        <tr style={{ height: rowH }}>{grid.head.map((h, i) => <th key={i} style={{ border: "2px solid #cbd5e1", background: "#f1f5f9", padding: "0 0.5em", textAlign: "left", fontWeight: 600, color: "#1e293b", fontSize: "0.8em", lineHeight: 1.15 }}><InlineMath text={h} /></th>)}</tr>
      </thead>
      <tbody>
        {grid.rows.map((row, r) => (
          <tr key={r} style={{ height: rowH }}>
            {row.map((cell, c) => {
              const shown = fill === "filled" || (fill === "structure" && c < given);
              return <td key={c} style={{ border: "2px solid #cbd5e1", padding: "0 0.5em", color: "#0f172a" }}>{shown ? <InlineMath text={cell} /> : null}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Long worded questions (the ratio ones are two sentences) are set smaller so they still fit once the working opens beneath them. */
const wordedSize = (lines: string[]) => { const n = Math.max(...lines.map((l) => l.replace(/\$/g, "").length)); return n <= 60 ? 50 : n <= 90 ? 40 : n <= 120 ? 34 : 30; };

/** A ratio table slide piece. Filled in shows it all; Structure only keeps the headings and the given rows and hides the arrows;
 *  Blank is the headings and empty cells ("?"). Staged brings one more row in per click, with the arrow to it. */
function RatioTableEl({ el, fill, stage }: { el: Extract<DeckElement, { kind: "ratioTable" }>; fill: FillMode; stage: number }) {
  const t = el.table, given = t.given ?? 1;
  const last = t.rows.length - 1;
  const staged = !!el.staged && fill === "filled";
  const shownLast = staged ? Math.min(last, Math.max(0, stage)) : last;
  // The table is always laid out at its full size, with the rows not yet shown hidden in place, so a four- or five-step table
  // never rescales or moves as a row arrives; and it is fitted to its box once, from the whole table.
  const rows = t.rows.map((r, i) => (fill === "filled" || (fill === "structure" && i < given) ? r : r.map(() => "")));
  const data: RatioTableData = {
    headers: t.headers, rows, operations: t.operations,
    ...(fill === "filled" ? (staged ? { hideFrom: shownLast + 1 } : {}) : { opSides: t.operations.map(() => "none" as const) }),
  };
  const inner = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);
  useEffect(() => {
    const node = inner.current;
    if (!node) return;
    const measure = () => {
      const w = node.offsetWidth, h = node.offsetHeight;      // layout size: unaffected by the slide's scale or by `fit`
      if (w && h) setFit(Math.min(1, el.w / w, el.h / h));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, [el.w, el.h, el.size, t]);
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "visible" }}>
      <div ref={inner} style={{ transform: `scale(${fit})`, transformOrigin: "center", flexShrink: 0 }}><RatioTable data={data} scale={(el.size ?? 46) / 25.6} /></div>
    </div>
  );
}

/** A bar model slide piece: Filled in is the whole picture; Structure only the coloured boxes; Blank empty boxes to colour in. */
function BarEl({ el, fill, stage }: { el: Extract<DeckElement, { kind: "bar" }>; fill: FillMode; stage: number }) {
  const data = el.staged && fill === "filled" ? barAtStage(el.bar, stage) : el.bar;
  return <BarModel data={fill === "filled" ? data : { ...data, braces: [] }} layout={el.bar} width={el.w} height={el.h} size={el.size ?? 40} fill={fill} />;
}

export const FILL_LABELS: [FillMode, string][] = [["filled", "Filled in"], ["structure", "Structure only"], ["blank", "Blank"]];

interface Shown { latex: string; lines?: string[]; answer: string; suffix?: string; working: { label: string; latex: string; type?: string; plain?: string; extra?: unknown }[]; source: string }
export const fromGenerated = (q: AnyQuestion, source = "Generated"): Shown => ({
  latex: q.kind === "simple" ? (q.displayLatex ?? q.display) : "",
  lines: q.kind === "worded" ? q.lines : undefined,
  answer: q.answerLatex ?? q.answer,
  suffix: q.answerSuffix,
  working: q.working.map((w) => ({ label: w.label ?? "", latex: w.latex, type: w.type, plain: w.plain, extra: w.extra })),
  source,
});

/** A question as the class sees it: maths, or a worded question's lines (smaller, so a paragraph fits). */
const isMathsLine = (l: string) => /^\s*\$[^$]+\$\s*$/.test(l);
/** `book` is a book activity: a worded question there is one short instruction and one line of maths, so the maths
 *  line is set at the full question size and the instruction beside it a little smaller, never a paragraph's size. */
function QuestionView({ q, size, book }: { q: Pick<Shown, "latex" | "lines">; size: number; book?: boolean }) {
  return q.lines?.length
    ? <div style={{ fontSize: size * 0.45, lineHeight: 1.35, textAlign: "left" }}>{q.lines.map((l, i) => <div key={i} style={book ? { fontSize: isMathsLine(l) ? size : l.includes("$") ? size * 0.55 : size * 0.45, lineHeight: 1.2, ...(l.includes("$") ? { fontWeight: 600 } : {}), whiteSpace: l.includes("$") || l.length > 34 ? undefined : "nowrap" } : undefined}><InlineMath text={l} /></div>)}</div>
    : <MathRenderer latex={q.latex} style={{ fontSize: size }} />;
}
const AnswerView = ({ q }: { q: Pick<Shown, "answer" | "suffix"> }) => <><MathRenderer latex={q.answer} style={{ fontSize: "1em" }} />{q.suffix ? ` ${q.suffix}` : ""}</>;

function Practice({ el, live, depthSlide }: { el: Extract<DeckElement, { kind: "practice" }>; live: boolean; depthSlide?: boolean }) {
  const items = useMemo(() => legacyItems(el, bankQuestion), [el]);
  return <QuestionSequence items={items} live={live} depthSlide={depthSlide} />;
}
function DepthEl({ el, live, stage }: { el: Extract<DeckElement, { kind: "depth" }>; live: boolean; stage: number }) {
  const [item, setItem] = useState<DepthItem | null | undefined>();
  // Presenting, Next shows the answer (the slide's one click) and Back returns to the question; the button and `a` override that
  const beatAnswer = live && Number.isFinite(stage) && stage >= 1;
  const [manual, setManual] = useState<boolean | null>(null);
  useEffect(() => { setManual(null); }, [beatAnswer]);
  const answer = manual ?? beatAnswer;
  const setAnswer = (v: boolean) => setManual(v);
  useEffect(() => { let on = true; setManual(null); void loadDepthItems(el.tool).then((items) => { if (on) setItem(items.find((i) => i.id === el.item) ?? null); }); return () => { on = false; }; }, [el.tool, el.item]);
  if (item === undefined) return <div style={{ fontSize: 32 }}>Loading question…</div>;
  if (item === null) return <div role="alert" style={{ fontSize: 32, color: "#b91c1c" }}>Depth card {el.item} is not in {el.tool}'s bank. Choose another.</div>;
  // the same slide the tool's Depth section shows, on the deck's canvas
  return <DepthSlide item={item} answer={answer} onAnswerChange={setAnswer} live={live} base="48px" buttonSize={`${SLIDE_BUTTON_PX}px`} />;
}

const pill: CSSProperties = slideButton;

/** The tool's generator running live, like its Whiteboard: opens on the question its seed gives (the same every time
 *  the slide is shown), New question draws a fresh one, and the working comes one step at a time. Keys: n, a, s. */
function GeneratorEl({ el, live }: { el: Extract<DeckElement, { kind: "generator" }>; live: boolean }) {
  const [q, setQ] = useState<Shown | null | undefined>(undefined);
  const [prompt, setPrompt] = useState(el.prompt ?? "");
  const workspace = el.presentation === "whiteboard" || el.presentation === "whiteboard-inverted";   // a workspace reveals only the answer
  const solution = useSolutionStepper(workspace ? 0 : q?.working.length ?? 0, !!q);
  const { reset, next, toggleAnswer } = solution;
  const seen = useMemo(() => new Set<string>(), []);
  useEffect(() => {
    let on = true;
    void generateFrom(el.tool, el.preset, el.seed ?? 1).then((x) => { if (on) { reset(); setQ(x ? fromGenerated(x, "Generated") : null); } });
    setPrompt(el.prompt ?? "");
    if (!el.prompt) void loadConfig(el.tool).then((c) => { if (on && c) setPrompt(instructionOf(c, el.preset.sub)); });
    return () => { on = false; };
  }, [el.tool, el.preset, el.seed, el.prompt, reset]);
  const fresh = useCallback(async () => {
    reset();
    if (workspace) window.dispatchEvent(new Event("mt-ink-clear"));
    for (let i = 0; i < 20; i++) {                        // not one already shown on this slide
      const x = await generateFrom(el.tool, el.preset);
      if (!x) return;
      const key = x.key.replace(/-\d+$/, "");
      if (!seen.has(key) || i === 19) { seen.add(key); setQ(fromGenerated(x)); return; }
    }
  }, [el.tool, el.preset, workspace, seen, reset]);
  useEffect(() => {
    if (!live) return;
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea,select,[contenteditable],dialog")) return;
      if (e.key === "n") void fresh();
      else if (e.key === "a") toggleAnswer();
      else if (e.key === "s") next();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [live, fresh, toggleAnswer, next]);
  const B = live ? "button" : "span";
  const size = el.size ?? 110;
  if (q === undefined) return <div style={{ fontSize: 32, color: "#94a3b8" }}>Loading…</div>;
  if (q === null) return <div style={{ fontSize: 32, color: "#b91c1c" }}>The generator for "{el.tool}" could not be loaded.</div>;
  const total = q.working.length;
  const whiteboard = workspace;
  /** The working's ratio table or bar model: with one, full-width shows it developing beside the steps. */
  const pictureOf = (w: Shown["working"][number]) => w.type === "ratioTable" ? { type: "ratioTable" as const, data: w.extra, caption: w.plain } : w.type === "fracBar" ? { type: "bar" as const, data: w.extra, caption: w.plain } : null;
  const hasPicture = !whiteboard && q.working.some((w) => pictureOf(w));
  const latest = [...q.working.slice(0, solution.all ? q.working.length : solution.shown)].reverse().map(pictureOf).find(Boolean);
  const content = <SolutionStepper
    question={<div style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: !q.lines?.length || q.lines.join("").length < 100 ? "center" : "left" }}>{prompt && <div style={{ fontSize: "0.6em", color: "#64748b" }}><InlineMath text={prompt} /></div>}{q.lines?.length ? <QuestionText lines={q.lines} /> : <MathRenderer latex={q.latex} style={{ fontSize: "1em" }} />}</div>}
    steps={whiteboard ? [] : q.working.map((w, i) => <div key={i}>{w.label && <div style={{ fontSize: "0.75em", color: "#64748b", marginBottom: 8 }}>{w.label}</div>}{w.type === "roundDigits" ? <RoundDigits {...(w.extra as { numStr: string; e: number; sf: boolean })} /> : w.type === "tStep" ? <div style={{ fontSize: "0.75em", lineHeight: 1.4 }}>{w.plain}</div> : w.type === "ratioTable" || w.type === "fracBar" ? (hasPicture ? (w.plain && w.plain !== w.label ? <div style={{ fontSize: "0.75em", lineHeight: 1.4 }}>{w.plain}</div> : null) : <WorkedPicture type={w.type === "ratioTable" ? "ratioTable" : "bar"} data={w.extra} caption={w.type === "fracBar" ? w.plain : undefined} />) : <MathRenderer latex={w.latex} style={{ fontSize: "1em" }} />}</div>)}
    answer={<AnswerView q={q} />} state={solution} live={live} flip={el.presentation === "full-inverted"} picture={hasPicture ? (latest ? <WorkedPicture type={latest.type} data={latest.data} caption={latest.caption} /> : null) : undefined} fontSize={q.lines?.length ? Math.min(whiteboard ? 42 : 46, wordedSize(q.lines) + 4) : whiteboard ? 42 : 46} questionFontSize={q.lines?.length ? wordedSize(q.lines) : whiteboard ? Math.min(size, 90) : size} layout={whiteboard ? "stacked" : "split"}
  />;
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ fontSize: 28, color: "#64748b", fontWeight: 600, padding: "0 4px 8px" }}>General practice · Level {el.preset.level.slice(-1)}</div>
      <div style={{ flex: 1, minHeight: 0 }}><QuestionFrame display={el} live={live}>{content}</QuestionFrame></div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8, fontSize: 28 }}>
        <B style={pill} onClick={() => void fresh()}><RefreshCw size={SLIDE_BUTTON_PX} />New question</B>
        {whiteboard ? <B style={pill} onClick={solution.toggleAnswer}>{solution.answer ? "Hide answer" : "Show answer"}</B> : total > 0 && !solution.open && <B style={pill} onClick={solution.next}>Show working</B>}
      </div>
    </div>
  );
}

/** A book activity: a numbered set of generated questions (stable for its seed), answers on demand, a new set, and
 *  Keys: a answers. */
function WorksheetEl({ el, live }: { el: Extract<DeckElement, { kind: "worksheet" }>; live: boolean }) {
  const [qs, setQs] = useState<AnyQuestion[] | null>(null);
  const [seed, setSeed] = useState(el.seed ?? 1);
  const [answers, setAnswers] = useState(false);
  const [flips, setFlips] = useState<Set<string>>(new Set());   // cells flipped by a double-tap, by question key
  const lastTap = useRef<Record<string, number>>({});
  // The regenerate buttons stay out of the way: a press anywhere on the activity shows them, and they fade after a few seconds
  const [tools, setTools] = useState(false);
  const toolsTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const showTools = () => { setTools(true); clearTimeout(toolsTimer.current); toolsTimer.current = setTimeout(() => setTools(false), 3500); };
  useEffect(() => () => clearTimeout(toolsTimer.current), []);
  const [prompt, setPrompt] = useState(el.prompt ?? "");
  const frozen = el.pin && el.frozen && isFrozen(el) ? el.frozen.questions : null;
  useEffect(() => { setSeed(el.seed ?? 1); }, [el.seed]);
  useEffect(() => {
    let on = true;
    // a pinned worksheet shows the set kept with the deck, so the page on the desk and the slide always agree
    if (frozen) setQs(frozen);
    else void generateSet(el.tool, el.preset, el.count, seed).then((x) => { if (on) setQs(x); });
    setPrompt(el.prompt ?? "");
    if (!el.prompt) void loadConfig(el.tool).then((c) => { if (on && c) setPrompt(instructionOf(c, el.preset.sub)); });
    return () => { on = false; };
  }, [el.tool, el.preset, el.count, seed, el.prompt, frozen]);
  useEffect(() => {
    if (!live) return;
    const h = (e: KeyboardEvent) => { if (!(e.target as HTMLElement).closest("input,textarea,select") && e.key === "a") { setAnswers((v) => !v); setFlips(new Set()); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [live]);
  const flip = (key: string) => setFlips((f) => { const n = new Set(f); if (n.has(key)) n.delete(key); else n.add(key); return n; });
  /** A double-tap on a cell flips just that cell between its question and its answer. */
  const tap = (e: PointerEvent, key: string) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const now = Date.now();
    if (now - (lastTap.current[key] ?? 0) < 400) { lastTap.current[key] = 0; flip(key); } else lastTap.current[key] = now;
  };
  /** Replace one question with a new one that is not already on the slide. */
  const reroll = async (i: number) => {
    if (!qs) return;
    const have = new Set(qs.map(questionContent));
    for (let t = 0; t < 30; t++) {
      const q = await generateFrom(el.tool, el.preset, Math.floor(Math.random() * 1e9));
      if (!q) return;
      if (have.has(questionContent(q))) continue;
      setQs((cur) => (cur ? cur.map((x, j) => (j === i ? q : x)) : cur));
      setFlips((f) => { const n = new Set(f); n.delete(qs[i].key); return n; });
      return;
    }
  };
  const B = live ? "button" : "span";
  const size = el.size ?? 60;
  if (!qs) return <div style={{ fontSize: 32, color: "#94a3b8" }}>Loading…</div>;
  // Worded questions that all open with the same instruction ("Work out:") say it once above the set, not on every cell
  const shown = qs.map((q) => fromGenerated(q));
  const shared = shown[0]?.lines?.length === 2 && shown.every((s) => s.lines?.length === 2 && s.lines[0] === shown[0].lines![0] && isMathsLine(s.lines[1])) ? shown[0].lines![0] : "";
  const heading = prompt || shared;
  return (
    <div onPointerDown={live ? showTools : undefined} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {heading && <div style={{ fontSize: 40, color: "#64748b", marginBottom: 8 }}><InlineMath text={heading} /></div>}
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: `repeat(${Math.max(1, el.cols)}, 1fr)`, gridAutoRows: "1fr", columnGap: 40, rowGap: 6 }}>
        {qs.map((q, i) => {
          const s = shown[i], cell = shared && !prompt ? { ...s, lines: s.lines!.slice(1) } : s;
          const up = answers !== flips.has(q.key);   // this cell's answer is up: the set's switch, flipped by a double-tap on the cell
          return (
            <div key={q.key} onPointerUp={live ? (e) => tap(e, q.key) : undefined} title={live ? "Double-tap to flip between the question and its answer" : undefined}
              style={{ position: "relative", display: "flex", alignItems: "baseline", gap: 18, borderBottom: "1px solid #e2e8f0", minWidth: 0, userSelect: "none" }}>
              <span style={{ fontSize: size * 0.6, fontWeight: 600, color: "#94a3b8", width: "1.6em", flexShrink: 0 }}>{i + 1}</span>
              {/* the answer shows in place of the question, in the same box, so nothing resizes or moves */}
              <div style={{ display: "grid", flex: 1, minWidth: 0 }}>
                <div style={{ gridArea: "1 / 1", minWidth: 0, visibility: up ? "hidden" : "visible" }}><QuestionView q={cell} size={size} book /></div>
                <div style={{ gridArea: "1 / 1", alignSelf: "center", fontSize: size * 0.85, color: "#1e3a8a", fontWeight: 600, whiteSpace: "nowrap", visibility: up ? "visible" : "hidden" }}><AnswerView q={s} /></div>
              </div>
              {live && <button type="button" aria-label={`Regenerate question ${i + 1}`} title="Regenerate this question" onClick={() => { void reroll(i); showTools(); }} onFocus={showTools} onPointerUp={(e) => e.stopPropagation()}
                style={{ position: "absolute", top: 2, right: 0, width: 44, height: 44, display: "grid", placeItems: "center", borderRadius: 12, border: "none", background: "transparent", color: "#64748b", opacity: tools ? 0.75 : 0, pointerEvents: tools ? "auto" : "none", transition: "opacity 0.4s ease", cursor: "pointer" }}><RefreshCw size={24} /></button>}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 10, fontSize: 26 }}>
        <B style={pill} onClick={() => { setAnswers((v) => !v); setFlips(new Set()); }}>{answers ? <EyeOff size={26} /> : <Eye size={26} />}{answers ? "Hide answers" : "Show answers"}</B>
        {!el.pin && <B style={pill} onClick={() => { setSeed(Math.floor(Math.random() * 1e9)); setAnswers(false); setFlips(new Set()); }}><RefreshCw size={26} />New set</B>}
      </div>
    </div>
  );
}

/** The answer key of a worksheet that is pinned to the lesson: the cue to hand the sheet out, with the answers hidden until asked (`a`). */
function SheetKey({ el, live }: { el: Extract<DeckElement, { kind: "worksheet" }>; live: boolean }) {
  const [qs, setQs] = useState<AnyQuestion[] | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => { let on = true; void sheetQuestions(el).then((x) => { if (on) setQs(x); }); return () => { on = false; }; }, [el]);
  useEffect(() => {
    if (!live) return;
    const h = (e: KeyboardEvent) => { if (!(e.target as HTMLElement).closest("input,textarea,select") && e.key === "a") setShown((v) => !v); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [live]);
  const B = live ? "button" : "span";
  if (!qs) return <div style={{ fontSize: 32, color: "#94a3b8" }}>Loading…</div>;
  const cols = qs.length > 9 ? 4 : qs.length > 4 ? 3 : 2, size = el.size ?? 56;
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 34, color: "#64748b", marginBottom: 10 }}>Answers</div>
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gridAutoRows: "min-content", columnGap: 40, rowGap: 18, alignContent: "start" }}>
        {qs.map((q, i) => (
          <div key={`${q.key}-${i}`} style={{ display: "flex", alignItems: "baseline", gap: 18, borderBottom: "1px solid #e2e8f0", paddingBottom: 6, visibility: shown ? "visible" : "hidden" }}>
            <span style={{ fontSize: size * 0.6, fontWeight: 600, color: "#94a3b8", width: "1.6em", flexShrink: 0 }}>{i + 1}</span>
            <span style={{ fontSize: size, color: "#1e3a8a", fontWeight: 600 }}><AnswerView q={fromGenerated(q)} /></span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 26 }}>
        <B style={pill} onClick={() => setShown((v) => !v)}>{shown ? <EyeOff size={26} /> : <Eye size={26} />}{shown ? "Hide answers" : "Show answers"}</B>
      </div>
    </div>
  );
}

/** The largest font size, from `start` down to `min`, at which `overflows()` is false. Re-fits whenever `key` changes or the
 *  measured content changes size (KaTeX arriving, a font loading). Hand-set sizes (`fixed`) skip it. */
function useFitSize(start: number, min: number, key: string, overflows: () => boolean, watch: () => Element[], off = false): number {
  const [state, setState] = useState({ key, size: start });
  const [tick, setTick] = useState(0);
  const size = off ? start : state.key === key ? state.size : start;
  useLayoutEffect(() => {
    if (off) return;
    if (state.key !== key) { setState({ key, size: start }); return; }
    if (size > min && overflows()) setState({ key, size: Math.max(min, Math.floor(size * 0.93)) });
  }, [off, key, size, min, start, tick]); // eslint-disable-line react-hooks/exhaustive-deps -- deliberate: overflows and state are read fresh on each pass
  useEffect(() => {
    if (off || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setTick((t) => t + 1));
    watch().forEach((e) => ro.observe(e));
    return () => ro.disconnect();
  }, [off, key]); // eslint-disable-line react-hooks/exhaustive-deps -- deliberate: observe the elements present when the content changes
  return size;
}

/** Text boxes on one slide that play the same role share one size: each is fitted to its own box, then all of the role are shown at
 *  the smallest of those, so two prompts or two questions never sit at different sizes. Roles by size: titles (60 and over),
 *  body text (40 to 59) and labels (under 40). A box whose size was set by hand is left out. */
interface FitShare { sizes: Record<string, Record<string, number>>; report: (role: string, id: string, size: number | null) => void }
const FitShareCtx = createContext<FitShare | null>(null);
const roleOf = (size: number) => (size >= 60 ? "title" : size >= 40 ? "body" : "label");
function FitShareProvider({ children }: { children: ReactNode }) {
  const [sizes, setSizes] = useState<Record<string, Record<string, number>>>({});
  const report = useCallback((role: string, id: string, size: number | null) => setSizes((all) => {
    const cur = all[role] ?? {};
    if (size === null ? !(id in cur) : cur[id] === size) return all;
    const next = { ...cur };
    if (size === null) delete next[id]; else next[id] = size;
    return { ...all, [role]: next };
  }), []);
  const value = useMemo(() => ({ sizes, report }), [sizes, report]);
  return <FitShareCtx.Provider value={value}>{children}</FitShareCtx.Provider>;
}

/** A text box that shrinks its text to fit the box (never above the element's size), unless its size was set by hand. */
function TextEl({ el }: { el: Extract<DeckElement, { kind: "text" }> }) {
  const share = useContext(FitShareCtx);
  const measure = useRef<HTMLDivElement>(null), inner = useRef<HTMLDivElement>(null);
  const fitted = useFitSize(el.size, 20, `${el.text}|${el.size}|${el.bold}|${el.w}|${el.h}`,
    () => { const o = measure.current, i = inner.current; return !!o && !!i && (i.scrollHeight > o.clientHeight + 1 || i.scrollWidth > o.clientWidth + 1); },
    () => (inner.current ? [inner.current] : []), !!el.fixed);
  const role = roleOf(el.size);
  useEffect(() => {
    if (!share || el.fixed || !el.text.trim()) return;
    share.report(role, el.id, fitted);
    return () => share.report(role, el.id, null);
  }, [share?.report, role, el.id, el.fixed, el.text, fitted]); // eslint-disable-line react-hooks/exhaustive-deps -- deliberate: only the report function is needed from the context
  const peers = share && !el.fixed ? Object.values(share.sizes[role] ?? {}) : [];
  const shown = el.fixed ? el.size : Math.min(fitted, ...peers);
  const box = { width: "100%", height: "100%", lineHeight: 1.25, color: el.colour ?? "#0f172a", fontWeight: el.bold ? 600 : 400, textAlign: el.align ?? "left",
    display: "flex", flexDirection: "column", justifyContent: el.middle ? "center" : "flex-start" } as const;
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* the same text at its own fitted size, unseen, is what is measured: the shown size may be smaller than this box needs */}
      <div ref={measure} aria-hidden style={{ ...box, position: "absolute", inset: 0, fontSize: fitted, visibility: "hidden", pointerEvents: "none", overflow: "hidden" }}><div ref={inner}><Lines text={el.text} /></div></div>
      <div style={{ ...box, fontSize: shown, overflow: el.fixed ? "visible" : "hidden" }}><Lines text={el.text} /></div>
    </div>
  );
}

/** Several hand-picked questions in a grid, numbered; the answers appear on demand (or `a`). */
function GridEl({ el, live }: { el: Extract<DeckElement, { kind: "grid" }>; live: boolean }) {
  const qs = useMemo(() => legacyItems(el, bankQuestion), [el]);
  const [answers, setAnswers] = useState(false);
  const [flips, setFlips] = useState<Set<string>>(new Set());   // cells flipped by a double-tap
  const lastTap = useRef<Record<string, number>>({});
  useEffect(() => {
    if (!live) return;
    const h = (e: KeyboardEvent) => { if (!(e.target as HTMLElement).closest("input,textarea,select") && e.key === "a") { setAnswers((v) => !v); setFlips(new Set()); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [live]);
  const B = live ? "button" : "span";
  // the text is as large as the boxes allow (down to 20), unless the size was set by hand
  const gridRef = useRef<HTMLDivElement>(null);
  const size = useFitSize(el.fixed ? el.size ?? 56 : 110, 20, `${qs.map((q) => q.id + q.question.join("|") + q.answer.join("|")).join("~")}|${el.cols}|${el.w}|${el.h}`,
    () => [...(gridRef.current?.children ?? [])].some((c) => c.scrollHeight > c.clientHeight + 1 || c.scrollWidth > c.clientWidth + 1),
    () => [...(gridRef.current?.children ?? [])], !!el.fixed || qs.length === 0);
  const tap = (id: string) => {
    if (!live) return;
    const now = Date.now();
    if (now - (lastTap.current[id] ?? 0) < 400) setFlips((f) => { const n = new Set(f); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    lastTap.current[id] = now;
  };
  if (!qs.length) return <div style={{ fontSize: 36, color: "#64748b" }}>Add questions to this grid (Edit → choose it → Questions).</div>;
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div ref={gridRef} style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: `repeat(${Math.max(1, el.cols)}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${Math.ceil(qs.length / Math.max(1, el.cols))}, minmax(0, 1fr))`, gap: 16 }}>
        {qs.map((q, i) => {
          const showAnswer = answers !== flips.has(q.id);
          // question and answer share one cell, so the cell never changes size; the answer replaces the question
          return (
            <div key={q.id} onPointerDown={() => tap(q.id)} style={{ border: "2px solid #e2e8f0", borderRadius: 18, padding: "10px 58px", display: "grid", alignItems: "center", position: "relative", userSelect: "none" }}>
              <span style={{ position: "absolute", left: 14, top: 8, fontSize: 24, fontWeight: 600, color: "#94a3b8" }}>{i + 1}</span>
              <div style={{ gridArea: "1 / 1", textAlign: "center", color: "#0f172a", fontSize: size * 0.7, visibility: showAnswer ? "hidden" : "visible" }}><QuestionText lines={q.question} /></div>
              <div style={{ gridArea: "1 / 1", textAlign: "center", color: "#1e3a8a", fontWeight: 600, fontSize: size * 0.7, visibility: showAnswer ? "visible" : "hidden" }}><QuestionText lines={q.answer} /></div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 12, fontSize: 26 }}>
        <B onClick={() => { setAnswers((v) => !v); setFlips(new Set()); }} style={slideButton}>
          {answers ? <EyeOff size={26} /> : <Eye size={26} />}{answers ? "Show questions" : "Show answers"}</B>
        {live && <span style={{ marginLeft: 18, fontSize: 22, color: "#94a3b8" }}>Double-tap a box for its answer</span>}
      </div>
    </div>
  );
}

/** The line drawn from (x, y) to (x + w, y + h), in a box padded so the stroke and arrowhead are never clipped. */
function LineEl({ el }: { el: Extract<DeckElement, { kind: "line" }> }) {
  const sw = el.width ?? 6, pad = sw * 4;
  const x0 = Math.min(0, el.w), y0 = Math.min(0, el.h);
  const W = Math.abs(el.w) + pad * 2, H = Math.abs(el.h) + pad * 2;
  const ax = -x0 + pad, ay = -y0 + pad, bx = el.w - x0 + pad, by = el.h - y0 + pad;
  const len = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / len, uy = (by - ay) / len, head = sw * 4;
  const colour = el.colour ?? "#0f172a";
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: x0 - pad, top: y0 - pad, overflow: "visible" }}>
      <line x1={ax} y1={ay} x2={el.arrow ? bx - ux * head * 0.8 : bx} y2={el.arrow ? by - uy * head * 0.8 : by} stroke={colour} strokeWidth={sw} strokeLinecap="round" />
      {el.arrow && <polygon points={`${bx},${by} ${bx - ux * head - uy * head * 0.6},${by - uy * head + ux * head * 0.6} ${bx - ux * head + uy * head * 0.6},${by - uy * head - ux * head * 0.6}`} fill={colour} />}
    </svg>
  );
}

function ElementView({ el, live, fill, depthSlide, stage }: { el: DeckElement; live: boolean; depthSlide?: boolean; fill?: FillMode; stage: number }) {
  switch (el.kind) {
    case "text":
      return <TextEl el={el} />;
    case "maths":
      return (
        <div style={{ width: "100%", height: "100%", fontSize: el.size, color: el.colour ?? "#0f172a", display: "flex", alignItems: "center",
          justifyContent: el.align === "left" ? "flex-start" : el.align === "right" ? "flex-end" : "center" }}><MathRenderer latex={el.latex} style={{ fontSize: "1em" }} /></div>
      );
    case "shape": {
      const sw = el.strokeWidth ?? 4;
      return (
        <svg width="100%" height="100%" viewBox={`0 0 ${el.w} ${el.h}`} preserveAspectRatio="none" style={{ overflow: "visible" }}>
          {el.shape === "rect"
            ? <rect x={sw / 2} y={sw / 2} width={Math.max(0, el.w - sw)} height={Math.max(0, el.h - sw)} rx={el.radius ?? 0} fill={el.fill ?? "none"} stroke={el.stroke ?? "none"} strokeWidth={sw} />
            : <ellipse cx={el.w / 2} cy={el.h / 2} rx={Math.max(0, el.w / 2 - sw / 2)} ry={Math.max(0, el.h / 2 - sw / 2)} fill={el.fill ?? "none"} stroke={el.stroke ?? "none"} strokeWidth={sw} />}
        </svg>
      );
    }
    case "line": return <LineEl el={el} />;
    case "image": return <img src={el.src} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain" }} />;
    case "board": {
      const mode = fill ?? el.fill ?? "filled";
      return <Board grid={el.grid} fill={mode} size={el.size ?? 46} />;
    }
    case "ratioTable": return <RatioTableEl el={el} fill={fill ?? el.fill ?? "filled"} stage={stage} />;
    case "bar": return <BarEl el={el} fill={fill ?? el.fill ?? "filled"} stage={stage} />;
    case "ink": return <InkLayer strokes={el.strokes} w={el.w} h={el.h} />;
    case "numberGrid": return <NumberGridEl el={el} fill={fill ?? el.fill ?? "structure"} stage={stage} live={live} />;
    case "questions": return <QuestionSequence items={el.items} live={live} size={el.size} display={el} depthSlide={depthSlide} />;
    case "practice": return <Practice el={el} live={live} depthSlide={depthSlide} />;
    case "depth": return <DepthEl el={el} live={live} stage={stage} />;
    case "grid": return <GridEl el={el} live={live} />;
    case "generator": return <GeneratorEl el={el} live={live} />;
    case "worksheet": return el.view === "key" ? <SheetKey el={el} live={live} /> : <WorksheetEl el={el} live={live} />;
  }
}

/** Where an element sits on the canvas: a line's box starts at its first point (its own SVG reaches the second). */
const placeStyle = (el: DeckElement): CSSProperties =>
  el.kind === "line" ? { position: "absolute", left: el.x, top: el.y, width: 0, height: 0 } : { position: "absolute", left: el.x, top: el.y, width: el.w, height: el.h };

export function SlideCanvas({ slide, scale, live = false, fills, hidden, upTo, children }: {
  slide: Slide; scale: number; live?: boolean; fills?: Record<string, FillMode>;
  /** Presenting: only elements whose click (`step`) is at most this are shown; the rest keep their space, unseen. */ upTo?: number;
  /** Elements drawn invisibly (the editor hides a text box while it is being typed into). */ hidden?: ReadonlySet<string>; children?: ReactNode;
}) {
  return (
    <FitShareProvider><div data-slide-canvas="" style={{ width: CANVAS_W * scale, height: CANVAS_H * scale, position: "relative", overflow: "hidden" }}>
      <div style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${scale})`, transformOrigin: "0 0", position: "absolute", left: 0, top: 0, background: DECK_SURFACE, "--deck-surface": DECK_SURFACE } as CSSProperties}>
        <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: ACCENT_H, background: FAMILY_STYLE[slide.family].colour }} />
        {slide.els.map((el) => (
          <div key={el.id} style={{ ...placeStyle(el), pointerEvents: live ? "auto" : "none", visibility: hidden?.has(el.id) || (el.step ?? 0) > (upTo ?? Infinity) ? "hidden" : undefined }}>
            <ElementView el={el} live={live} depthSlide={slide.family === "depth"} fill={fills?.[el.id]} stage={(upTo ?? Infinity) - (el.step ?? 0)} />
          </div>
        ))}
        {children}
      </div>
    </div></FitShareProvider>
  );
}

/** How many clicks a slide's build has (0 when everything shows at once). */
export const slideSteps = (slide: Slide) => Math.max(0, ...slide.els.map((e) => (e.step ?? 0) + stagedClicks(e)));

/** Extra clicks a staged piece takes after the click it appears on: a ratio table one per further row, a bar one per further part and brace. */
export const stagedClicks = (el: DeckElement) => (el.kind === "depth" ? 1 : el.kind === "ratioTable" && el.staged ? Math.max(0, el.table.rows.length - 1) : el.kind === "bar" && el.staged ? barStages(el.bar) : el.kind === "numberGrid" && el.staged ? sieveSteps(el.stages) : 0);
