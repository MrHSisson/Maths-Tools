import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { DepthItem } from "../shared/depth";
import { Eye, EyeOff, Printer, RefreshCw } from "lucide-react";
import { InlineMath, MathRenderer } from "../shared/components/MathRenderer";
import { misconceptionLabel } from "../shared/misconceptions";
import type { AnyQuestion } from "../shared";
import { DepthFlat } from "./DepthFlat";
import { generateFrom, generateSet, instructionOf, loadConfig, loadDepthItems } from "./generators";
import { handlePrint } from "../shared/print";
import { bankQuestion } from "./store";
import { CANVAS_H, CANVAS_W, FAMILY_STYLE, type BankQuestion, type BoardGrid, type DeckElement, type FillMode, type Slide } from "./types";

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

interface Shown { latex: string; lines?: string[]; answer: string; suffix?: string; working: { label: string; latex: string }[]; source: string }
const fromBank = (b: BankQuestion, n: number, total: number): Shown => ({ latex: b.latex, lines: b.lines, answer: b.answer, working: b.working, source: `Hand-picked ${n} of ${total}` });
/** A generated question in the deck's terms (the same fields the tool's Whiteboard shows). */
export const fromGenerated = (q: AnyQuestion, source = "Generated"): Shown => ({
  latex: q.kind === "simple" ? (q.displayLatex ?? q.display) : "",
  lines: q.kind === "worded" ? q.lines : undefined,
  answer: q.answerLatex ?? q.answer,
  suffix: q.answerSuffix,
  working: q.working.map((w) => ({ label: w.label ?? "", latex: w.latex })),
  source,
});

/** A question as the class sees it: maths, or a worded question's lines (smaller, so a paragraph fits). */
function QuestionView({ q, size }: { q: Pick<Shown, "latex" | "lines">; size: number }) {
  return q.lines?.length
    ? <div style={{ fontSize: size * 0.45, lineHeight: 1.35, textAlign: "left" }}>{q.lines.map((l, i) => <div key={i}><InlineMath text={l} /></div>)}</div>
    : <MathRenderer latex={q.latex} style={{ fontSize: size }} />;
}
const AnswerView = ({ q }: { q: Pick<Shown, "answer" | "suffix"> }) => <><MathRenderer latex={q.answer} style={{ fontSize: "1em" }} />{q.suffix ? ` ${q.suffix}` : ""}</>;

function Practice({ el, live }: { el: Extract<DeckElement, { kind: "practice" }>; live: boolean }) {
  const bank = useMemo(() => el.bank.map((id) => bankQuestion(id)).filter((b): b is BankQuestion => !!b), [el.bank]);
  const [n, setN] = useState(0);                        // how many questions have been shown (0 = the first hand-picked one)
  const [gen, setGen] = useState<Shown | null>(null);
  const [answer, setAnswer] = useState(false);
  const [working, setWorking] = useState(false);
  const [teacher, setTeacher] = useState(false);
  const current: Shown | null = n < bank.length ? fromBank(bank[n], n + 1, bank.length) : gen;

  const refresh = useCallback(async () => {
    setAnswer(false); setWorking(false);
    const next = n + 1;
    if (next < bank.length) { setN(next); return; }                           // more hand-picked questions to come
    const q = el.generator ? await generateFrom(el.tool, el.generator) : null;
    if (q) {
      setGen(fromGenerated(q));
      setN(Math.max(next, bank.length));
    } else setN(bank.length ? next % bank.length : 0);                        // no generator: go round the bank again
  }, [n, bank, el.generator, el.tool]);

  useEffect(() => {
    if (!live) return;
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea,select")) return;
      if (e.key === "a") setAnswer((v) => !v);
      else if (e.key === "w") setWorking((v) => !v);
      else if (e.key === "r") void refresh();
      else if (e.key === "t") setTeacher((v) => !v);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [refresh, live]);

  const size = el.size ?? 120;
  const B = live ? "button" : "span";                   // a drawn-only copy (thumbnail, editor) has no real buttons inside a button
  const btn: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 22px", borderRadius: 16, border: "2px solid #cbd5e1", background: "white", fontWeight: 600, color: "#334155" };
  if (!current) return <div style={{ fontSize: 40, color: "#64748b" }}>Add a question to this practice slide (Edit → choose the slide → Questions).</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {el.prompt && <div style={{ fontSize: 40, color: "#64748b" }}><InlineMath text={el.prompt} /></div>}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#0f172a" }}><QuestionView q={current} size={size} /></div>
      <div style={{ minHeight: 150, fontSize: 56 }}>
        {answer && <div style={{ textAlign: "center", fontWeight: 600, color: "#1e3a8a" }}>≈ <AnswerView q={current} /></div>}
        {working && <div style={{ margin: "12px auto 0", maxWidth: 1000, fontSize: 38, color: "#334155" }}>{current.working.map((w, i) => (
          <div key={i} style={{ display: "flex", gap: 24, borderBottom: "1px solid #e2e8f0", padding: "4px 0" }}><span style={{ width: 300, flexShrink: 0, color: "#64748b" }}>{w.label}</span><MathRenderer latex={w.latex} style={{ fontSize: "1em" }} /></div>))}</div>}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginTop: 8, fontSize: 28 }}>
        <B style={btn} onClick={() => setAnswer((v) => !v)}>{answer ? <EyeOff size={28} /> : <Eye size={28} />}{answer ? "Hide answer" : "Show answer"}</B>
        <B style={btn} onClick={() => setWorking((v) => !v)}>{working ? "Hide working" : "Show working"}</B>
        <B style={btn} onClick={() => void refresh()}><RefreshCw size={28} />Another question</B>
        <B onClick={() => setTeacher((v) => !v)} style={{ marginLeft: "auto", fontSize: 22, fontWeight: 600, color: "#94a3b8" }}>{teacher ? "Hide teacher notes" : "Teacher notes"}</B>
      </div>
      {teacher && (
        <div style={{ marginTop: 8, borderRadius: 14, border: "1px solid #e2e8f0", background: "#f8fafc", padding: "8px 18px", fontSize: 24, color: "#475569" }}>
          {el.intention && <><b>Catches:</b> {misconceptionLabel(el.intention)} · </>} <b>Source:</b> {current.source}
        </div>
      )}
    </div>
  );
}

/** One of a tool's Depth items, drawn flat on the slide (DepthFlat). */
function DepthEl({ el, live }: { el: Extract<DeckElement, { kind: "depth" }>; live: boolean }) {
  const [item, setItem] = useState<DepthItem | null | undefined>(undefined);
  useEffect(() => { let on = true; void loadDepthItems(el.tool).then((items) => { if (on) setItem(items.find((i) => i.id === el.item) ?? null); }); return () => { on = false; }; }, [el.tool, el.item]);
  if (item === undefined) return <div style={{ fontSize: 32, color: "#94a3b8" }}>Loading…</div>;
  if (item === null) return <div style={{ fontSize: 32, color: "#b91c1c" }}>Depth item "{el.item}" was not found in {el.tool}.</div>;
  return <DepthFlat item={item} live={live} />;
}

const pill: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 22px", borderRadius: 16, border: "2px solid #cbd5e1", background: "white", fontWeight: 600, color: "#334155" };

/** The tool's generator running live, like its Whiteboard: opens on the question its seed gives (the same every time
 *  the slide is shown), New question draws a fresh one, and the working comes one step at a time. Keys: n, a, s. */
function GeneratorEl({ el, live }: { el: Extract<DeckElement, { kind: "generator" }>; live: boolean }) {
  const [q, setQ] = useState<Shown | null | undefined>(undefined);
  const [prompt, setPrompt] = useState(el.prompt ?? "");
  const [answer, setAnswer] = useState(false);
  const [steps, setSteps] = useState(0);
  const seen = useMemo(() => new Set<string>(), []);
  useEffect(() => {
    let on = true;
    void generateFrom(el.tool, el.preset, el.seed ?? 1).then((x) => { if (on) setQ(x ? fromGenerated(x, "Generated") : null); });
    if (!el.prompt) void loadConfig(el.tool).then((c) => { if (on && c) setPrompt(instructionOf(c, el.preset.sub)); });
    return () => { on = false; };
  }, [el.tool, el.preset, el.seed, el.prompt]);
  const fresh = useCallback(async () => {
    setAnswer(false); setSteps(0);
    for (let i = 0; i < 20; i++) {                        // not one already shown on this slide
      const x = await generateFrom(el.tool, el.preset);
      if (!x) return;
      const key = x.key.replace(/-\d+$/, "");
      if (!seen.has(key) || i === 19) { seen.add(key); setQ(fromGenerated(x)); return; }
    }
  }, [el.tool, el.preset, seen]);
  useEffect(() => {
    if (!live) return;
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea,select")) return;
      if (e.key === "n") void fresh();
      else if (e.key === "a") setAnswer((v) => !v);
      else if (e.key === "s") setSteps((v) => v + 1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [live, fresh]);
  const B = live ? "button" : "span";
  const size = el.size ?? 110;
  if (q === undefined) return <div style={{ fontSize: 32, color: "#94a3b8" }}>Loading…</div>;
  if (q === null) return <div style={{ fontSize: 32, color: "#b91c1c" }}>The generator for "{el.tool}" could not be loaded.</div>;
  const total = q.working.length, shown = Math.min(steps, total);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {prompt && <div style={{ fontSize: 40, color: "#64748b" }}><InlineMath text={prompt} /></div>}
      <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#0f172a" }}><QuestionView q={q} size={size} /></div>
      <div style={{ minHeight: 120, fontSize: 38, color: "#334155" }}>
        {q.working.slice(0, shown).map((w, i) => (
          <div key={i} style={{ display: "flex", gap: 24, borderBottom: "1px solid #e2e8f0", padding: "4px 0" }}><span style={{ width: 300, flexShrink: 0, color: "#64748b" }}>{w.label}</span><MathRenderer latex={w.latex} style={{ fontSize: "1em" }} /></div>
        ))}
        {answer && <div style={{ marginTop: 8, textAlign: "center", fontWeight: 600, color: "#1e3a8a", fontSize: 56 }}><AnswerView q={q} /></div>}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8, fontSize: 28 }}>
        <B style={pill} onClick={() => void fresh()}><RefreshCw size={28} />New question</B>
        {total > 0 && <B style={pill} onClick={() => setSteps((v) => (v >= total ? 0 : v + 1))}>{shown >= total ? "Hide working" : `Next step (${shown}/${total})`}</B>}
        <B style={pill} onClick={() => setAnswer((v) => !v)}>{answer ? <EyeOff size={28} /> : <Eye size={28} />}{answer ? "Hide answer" : "Show answer"}</B>
      </div>
    </div>
  );
}

/** A book activity: a numbered set of generated questions (stable for its seed), answers on demand, a new set, and
 *  Print through the tool page's own worksheet print. Keys: a answers. */
function WorksheetEl({ el, live }: { el: Extract<DeckElement, { kind: "worksheet" }>; live: boolean }) {
  const [qs, setQs] = useState<AnyQuestion[] | null>(null);
  const [seed, setSeed] = useState(el.seed ?? 1);
  const [answers, setAnswers] = useState(false);
  const [prompt, setPrompt] = useState(el.prompt ?? "");
  useEffect(() => { setSeed(el.seed ?? 1); }, [el.seed]);
  useEffect(() => {
    let on = true;
    void generateSet(el.tool, el.preset, el.count, seed).then((x) => { if (on) setQs(x); });
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
  const size = el.size ?? 48;
  if (!qs) return <div style={{ fontSize: 32, color: "#94a3b8" }}>Loading…</div>;
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {prompt && <div style={{ fontSize: 34, color: "#64748b", marginBottom: 8 }}><InlineMath text={prompt} /></div>}
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: `repeat(${Math.max(1, el.cols)}, 1fr)`, gridAutoRows: "1fr", columnGap: 40, rowGap: 6 }}>
        {qs.map((q, i) => {
          const s = fromGenerated(q);
          return (
            <div key={q.key} style={{ display: "flex", alignItems: "baseline", gap: 18, borderBottom: "1px solid #e2e8f0", minWidth: 0 }}>
              <span style={{ fontSize: size * 0.6, fontWeight: 600, color: "#94a3b8", width: "1.6em", flexShrink: 0 }}>{i + 1}</span>
              <div style={{ minWidth: 0 }}><QuestionView q={s} size={size} /></div>
              <span style={{ marginLeft: "auto", fontSize: size * 0.8, color: "#1e3a8a", fontWeight: 600, visibility: answers ? "visible" : "hidden", whiteSpace: "nowrap" }}><AnswerView q={s} /></span>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 10, fontSize: 26 }}>
        <B style={pill} onClick={() => setAnswers((v) => !v)}>{answers ? <EyeOff size={26} /> : <Eye size={26} />}{answers ? "Hide answers" : "Show answers"}</B>
        <B style={pill} onClick={() => { setSeed(Math.floor(Math.random() * 1e9)); setAnswers(false); }}><RefreshCw size={26} />New set</B>
        <B style={pill} data-trusted-click="" onClick={() => handlePrint(qs, prompt || "Questions", el.preset.level, false, [], Math.min(el.cols, 3), prompt, "both")}><Printer size={26} />Print</B>
      </div>
    </div>
  );
}

/** Several hand-picked questions in a grid, numbered; the answers appear on demand (or `a`). */
function GridEl({ el, live }: { el: Extract<DeckElement, { kind: "grid" }>; live: boolean }) {
  const qs = useMemo(() => el.bank.map((id) => bankQuestion(id)).filter((b): b is BankQuestion => !!b), [el.bank]);
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
            <div style={{ textAlign: "center", color: "#0f172a" }}><QuestionView q={q} size={size} /></div>
            <div style={{ fontSize: size * 0.7, textAlign: "center", color: "#1e3a8a", fontWeight: 600, visibility: answers ? "visible" : "hidden" }}>≈ <MathRenderer latex={q.answer} style={{ fontSize: "1em" }} /></div>
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

function ElementView({ el, live, fill }: { el: DeckElement; live: boolean; fill?: FillMode }) {
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
    case "practice": return <Practice el={el} live={live} />;
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
      <div style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${scale})`, transformOrigin: "0 0", position: "absolute", left: 0, top: 0, background: "white" }}>
        <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: ACCENT_H, background: FAMILY_STYLE[slide.family].colour }} />
        {slide.els.map((el) => (
          <div key={el.id} style={{ ...placeStyle(el), pointerEvents: live ? "auto" : "none", visibility: hidden?.has(el.id) || (el.step ?? 0) > (upTo ?? Infinity) ? "hidden" : undefined }}>
            <ElementView el={el} live={live} fill={fills?.[el.id]} />
          </div>
        ))}
        {children}
      </div>
    </div>
  );
}

/** How many clicks a slide's build has (0 when everything shows at once). */
export const slideSteps = (slide: Slide) => Math.max(0, ...slide.els.map((e) => e.step ?? 0));
