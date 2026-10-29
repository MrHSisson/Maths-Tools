import { DECK_SURFACE } from "./theme";
import { QuestionFrame } from "./QuestionFrame";
import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { InlineMath, MathRenderer } from "../shared/components/MathRenderer";
import { RoundDigits } from "../shared/components/RoundDigits";
import type { AnyQuestion } from "../shared";
import { SolutionStepper, useSolutionStepper } from "../shared/components/SolutionStepper";
import { QuestionSequence, QuestionText } from "./QuestionPresentation";
import { fromDepth, legacyItems, missingQuestion } from "./questions";
import { generateFrom, generateSet, instructionOf, loadConfig, loadDepthItems } from "./generators";
import { bankQuestion } from "./store";
import { CANVAS_H, CANVAS_W, FAMILY_STYLE, type CuratedQuestion, type BoardGrid, type DeckElement, type FillMode, type Slide } from "./types";

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
    ? <div style={{ fontSize: size * 0.45, lineHeight: 1.35, textAlign: "left" }}>{q.lines.map((l, i) => <div key={i} style={book ? { fontSize: isMathsLine(l) ? size : size * 0.45, lineHeight: 1.2, whiteSpace: isMathsLine(l) ? undefined : "nowrap" } : undefined}><InlineMath text={l} /></div>)}</div>
    : <MathRenderer latex={q.latex} style={{ fontSize: size }} />;
}
const AnswerView = ({ q }: { q: Pick<Shown, "answer" | "suffix"> }) => <><MathRenderer latex={q.answer} style={{ fontSize: "1em" }} />{q.suffix ? ` ${q.suffix}` : ""}</>;

function Practice({ el, live, depthSlide }: { el: Extract<DeckElement, { kind: "practice" }>; live: boolean; depthSlide?: boolean }) {
  const items = useMemo(() => legacyItems(el, bankQuestion), [el]);
  return <QuestionSequence items={items} live={live} depthSlide={depthSlide} />;
}
function DepthEl({ el, live }: { el: Extract<DeckElement, { kind: "depth" }>; live: boolean }) {
  const [item, setItem] = useState<CuratedQuestion | null>(null);
  useEffect(() => { let on = true; void loadDepthItems(el.tool).then((items) => { if (on) { const found = items.find((i) => i.id === el.item); setItem(found ? fromDepth(el.tool, found) : missingQuestion(el.item, el.tool)); } }); return () => { on = false; }; }, [el.tool, el.item]);
  return item ? <QuestionSequence items={[item]} live={live} depthSlide /> : <div style={{ fontSize: 32 }}>Loading question…</div>;
}

const pill: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 22px", borderRadius: 16, border: "2px solid #cbd5e1", background: "white", fontWeight: 600, color: "#334155" };

/** The tool's generator running live, like its Whiteboard: opens on the question its seed gives (the same every time
 *  the slide is shown), New question draws a fresh one, and the working comes one step at a time. Keys: n, a, s. */
function GeneratorEl({ el, live }: { el: Extract<DeckElement, { kind: "generator" }>; live: boolean }) {
  const [q, setQ] = useState<Shown | null | undefined>(undefined);
  const [prompt, setPrompt] = useState(el.prompt ?? "");
  const solution = useSolutionStepper(q?.working.length ?? 0, !!q);
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
    if (el.presentation && el.presentation !== "full") window.dispatchEvent(new Event("mt-ink-clear"));
    for (let i = 0; i < 20; i++) {                        // not one already shown on this slide
      const x = await generateFrom(el.tool, el.preset);
      if (!x) return;
      const key = x.key.replace(/-\d+$/, "");
      if (!seen.has(key) || i === 19) { seen.add(key); setQ(fromGenerated(x)); return; }
    }
  }, [el.tool, el.preset, el.presentation, seen, reset]);
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
  const whiteboard = el.presentation !== undefined && el.presentation !== "full";
  const content = <SolutionStepper
    question={<div style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: !q.lines?.length || q.lines.join("").length < 100 ? "center" : "left" }}>{prompt && <div style={{ fontSize: "0.6em", color: "#64748b" }}><InlineMath text={prompt} /></div>}{q.lines?.length ? <QuestionText lines={q.lines} /> : <MathRenderer latex={q.latex} style={{ fontSize: "1em" }} />}</div>}
    steps={q.working.map((w, i) => <div key={i}>{w.label && <div style={{ fontSize: "0.75em", color: "#64748b", marginBottom: 8 }}>{w.label}</div>}{w.type === "roundDigits" ? <RoundDigits {...(w.extra as { numStr: string; e: number; sf: boolean })} /> : w.type === "tStep" ? <div style={{ fontSize: "0.75em", lineHeight: 1.4 }}>{w.plain}</div> : <MathRenderer latex={w.latex} style={{ fontSize: "1em" }} />}</div>)}
    answer={<AnswerView q={q} />} state={solution} live={live} fontSize={whiteboard ? 42 : 46} questionFontSize={q.lines?.length ? 50 : whiteboard ? Math.min(size, 90) : size} layout={whiteboard ? "stacked" : "split"}
  />;
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ fontSize: 28, color: "#64748b", fontWeight: 600, padding: "0 4px 8px" }}>General practice · Level {el.preset.level.slice(-1)}</div>
      <div style={{ flex: 1, minHeight: 0 }}><QuestionFrame display={el} live={live}>{content}</QuestionFrame></div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8, fontSize: 28 }}>
        <B style={pill} onClick={() => void fresh()}><RefreshCw size={28} />New question</B>
        {total > 0 && !solution.open && <B style={pill} onClick={solution.next}>Show working</B>}
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
  const [prompt, setPrompt] = useState(el.prompt ?? "");
  useEffect(() => { setSeed(el.seed ?? 1); }, [el.seed]);
  useEffect(() => {
    let on = true;
    void generateSet(el.tool, el.preset, el.count, seed).then((x) => { if (on) setQs(x); });
    setPrompt(el.prompt ?? "");
    if (!el.prompt) void loadConfig(el.tool).then((c) => { if (on && c) setPrompt(instructionOf(c, el.preset.sub)); });
    return () => { on = false; };
  }, [el.tool, el.preset, el.count, seed, el.prompt]);
  useEffect(() => {
    if (!live) return;
    const h = (e: KeyboardEvent) => { if (!(e.target as HTMLElement).closest("input,textarea,select") && e.key === "a") setAnswers((v) => !v); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [live]);
  const B = live ? "button" : "span";
  const size = el.size ?? 60;
  if (!qs) return <div style={{ fontSize: 32, color: "#94a3b8" }}>Loading…</div>;
  // Worded questions that all open with the same instruction ("Work out:") say it once above the set, not on every cell
  const shown = qs.map((q) => fromGenerated(q));
  const shared = shown[0]?.lines?.length === 2 && shown.every((s) => s.lines?.length === 2 && s.lines[0] === shown[0].lines![0] && isMathsLine(s.lines[1])) ? shown[0].lines![0] : "";
  const heading = prompt || shared;
  // Each question carries its own instruction (a mix of "Write using a root" and "Write as a power"): the answer sits under it, as there is no room beside it
  const ownInstruction = !shared && shown.some((x) => x.lines?.some((l) => !isMathsLine(l)));
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {heading && <div style={{ fontSize: 40, color: "#64748b", marginBottom: 8 }}><InlineMath text={heading} /></div>}
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: `repeat(${Math.max(1, el.cols)}, 1fr)`, gridAutoRows: "1fr", columnGap: 40, rowGap: 6 }}>
        {qs.map((q, i) => {
          const s = shown[i], cell = shared && !prompt ? { ...s, lines: s.lines!.slice(1) } : s;
          return (
            <div key={q.key} style={{ display: "flex", alignItems: "baseline", gap: 18, borderBottom: "1px solid #e2e8f0", minWidth: 0 }}>
              <span style={{ fontSize: size * 0.6, fontWeight: 600, color: "#94a3b8", width: "1.6em", flexShrink: 0 }}>{i + 1}</span>
              {ownInstruction
                ? <div style={{ minWidth: 0 }}>
                    <QuestionView q={cell} size={size} book />
                    <div style={{ fontSize: size * 0.6, color: "#1e3a8a", fontWeight: 600, visibility: answers ? "visible" : "hidden", whiteSpace: "nowrap" }}><AnswerView q={s} /></div>
                  </div>
                : <>
                    <div style={{ minWidth: 0 }}><QuestionView q={cell} size={size} book /></div>
                    <span style={{ marginLeft: "auto", fontSize: size * 0.8, color: "#1e3a8a", fontWeight: 600, visibility: answers ? "visible" : "hidden", whiteSpace: "nowrap" }}><AnswerView q={s} /></span>
                  </>}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 10, fontSize: 26 }}>
        <B style={pill} onClick={() => setAnswers((v) => !v)}>{answers ? <EyeOff size={26} /> : <Eye size={26} />}{answers ? "Hide answers" : "Show answers"}</B>
        <B style={pill} onClick={() => { setSeed(Math.floor(Math.random() * 1e9)); setAnswers(false); }}><RefreshCw size={26} />New set</B>
      </div>
    </div>
  );
}

/** Several hand-picked questions in a grid, numbered; the answers appear on demand (or `a`). */
function GridEl({ el, live }: { el: Extract<DeckElement, { kind: "grid" }>; live: boolean }) {
  const qs = useMemo(() => legacyItems(el, bankQuestion), [el]);
  const [answers, setAnswers] = useState(false);
  useEffect(() => {
    if (!live) return;
    const h = (e: KeyboardEvent) => { if (!(e.target as HTMLElement).closest("input,textarea,select") && e.key === "a") setAnswers((v) => !v); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [live]);
  const B = live ? "button" : "span";
  const size = el.size ?? 56;
  if (!qs.length) return <div style={{ fontSize: 36, color: "#64748b" }}>Add questions to this grid (Edit → choose it → Questions).</div>;
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: `repeat(${Math.max(1, el.cols)}, 1fr)`, gap: 16 }}>
        {qs.map((q, i) => (
          <div key={q.id} style={{ border: "2px solid #e2e8f0", borderRadius: 18, padding: "10px 18px", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: 8, fontSize: 24, fontWeight: 600, color: "#94a3b8" }}>{i + 1}</span>
            <div style={{ textAlign: "center", color: "#0f172a" }}><div style={{ fontSize: size * 0.7 }}><QuestionText lines={q.question} /></div></div>
            <div style={{ fontSize: size * 0.7, textAlign: "center", color: "#1e3a8a", fontWeight: 600, visibility: answers ? "visible" : "hidden" }}><QuestionText lines={q.answer} /></div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 26 }}>
        <B onClick={() => setAnswers((v) => !v)} style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 22px", borderRadius: 16, border: "2px solid #cbd5e1", background: "white", fontWeight: 600, color: "#334155" }}>
          {answers ? <EyeOff size={26} /> : <Eye size={26} />}{answers ? "Hide answers" : "Show answers"}</B>
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

function ElementView({ el, live, fill, depthSlide }: { el: DeckElement; live: boolean; depthSlide?: boolean; fill?: FillMode }) {
  switch (el.kind) {
    case "text":
      return (
        <div style={{ width: "100%", height: "100%", fontSize: el.size, lineHeight: 1.25, color: el.colour ?? "#0f172a", fontWeight: el.bold ? 600 : 400, textAlign: el.align ?? "left",
          display: "flex", flexDirection: "column", justifyContent: el.middle ? "center" : "flex-start" }}><Lines text={el.text} /></div>
      );
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
    case "questions": return <QuestionSequence items={el.items} live={live} size={el.size} display={el} depthSlide={depthSlide} />;
    case "practice": return <Practice el={el} live={live} depthSlide={depthSlide} />;
    case "depth": return <DepthEl el={el} live={live} />;
    case "grid": return <GridEl el={el} live={live} />;
    case "generator": return <GeneratorEl el={el} live={live} />;
    case "worksheet": return <WorksheetEl el={el} live={live} />;
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
    <div style={{ width: CANVAS_W * scale, height: CANVAS_H * scale, position: "relative", overflow: "hidden" }}>
      <div style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${scale})`, transformOrigin: "0 0", position: "absolute", left: 0, top: 0, background: DECK_SURFACE, "--deck-surface": DECK_SURFACE } as CSSProperties}>
        <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: ACCENT_H, background: FAMILY_STYLE[slide.family].colour }} />
        {slide.els.map((el) => (
          <div key={el.id} style={{ ...placeStyle(el), pointerEvents: live ? "auto" : "none", visibility: hidden?.has(el.id) || (el.step ?? 0) > (upTo ?? Infinity) ? "hidden" : undefined }}>
            <ElementView el={el} live={live} depthSlide={slide.family === "depth"} fill={fills?.[el.id]} />
          </div>
        ))}
        {children}
      </div>
    </div>
  );
}

/** How many clicks a slide's build has (0 when everything shows at once). */
export const slideSteps = (slide: Slide) => Math.max(0, ...slide.els.map((e) => e.step ?? 0));
