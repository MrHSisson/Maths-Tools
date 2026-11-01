import { useEffect, useState, type CSSProperties } from "react";
import { Eye, EyeOff, Check } from "lucide-react";
import { InlineMath, MathRenderer } from "./MathRenderer";
import { BidmasPyramid } from "./BidmasPyramid";
import { Avatar, Mascot, assignCast } from "./DepthArt";
import { FitBox } from "./FitBox";
import { LV_LABELS } from "../colors";
import type { DepthItem } from "../depth";

// ─────────────────────────────────────────────────────────────────────────────
// One Depth item as ONE slide design, used by both the deck's Depth card and the tool's Depth section (DepthMode), so a change to
// how a Depth question looks is made once. It draws a single beat: the question (speakers, working, picture, question, options)
// or the answer. The question zone (speakers, working, prompt, options) is drawn the SAME on both beats and never moves: the answer
// beat only marks things in place (the right option, the first wrong line) and fills a gap reserved below, so nothing jumps when
// the answer is revealed. The owl (Feathers) sits in that gap as a mascot, with no speech. Everything is sized in em from `base`, and
// the whole face shrinks to fit the box it is given (`fit`), never above its natural size.
//
// Controlled by the parent: `answer` says which beat. With `controls` it also draws its own button row (Show answer) and answers
// the `a` key when `live`.
// ─────────────────────────────────────────────────────────────────────────────

const SPEAKER_COLOURS = ["#7c3aed", "#e11d48", "#059669", "#d97706", "#2563eb"];
const PURPOSE_LABEL = { diagnose: "Diagnose", explain: "Explain", extend: "Extend" } as const;
const PURPOSE_COLOUR = { diagnose: "#3b82f6", explain: "#f59e0b", extend: "#10b981" } as const;
const NAVY = "#1e3a8a";

interface DepthSlideProps {
  item: DepthItem;
  /** Which beat: false is the question, true the answer. */
  answer: boolean;
  onAnswerChange?: (answer: boolean) => void;
  /** Interactive (the player, the tool page): working lines can be tapped and the keys work. Off, it is drawn for a thumbnail. */
  live?: boolean;
  /** The base font size for the whole face: a CSS length such as "36px" or "1.9cqw". */
  base: string;
  /** Fill the parent box and shrink to fit it (a slide); off, the face takes the height it needs (a phone). */
  fit?: boolean;
  /** Draw a white card with the purpose's colour along its top (the tool page); the deck's slide already is the card. */
  frame?: boolean;
  /** Draw the button row (Show answer). Off when the parent has its own controls. */
  controls?: boolean;
  /** A short note beside the purpose and level in the header (for example "Quick check 2 of 3"). */
  tag?: string;
  /** The text size of the buttons and switches (a CSS length). A deck passes the same size as every other slide button. */
  buttonSize?: string;
}

export function DepthSlide({ item, answer, onAnswerChange, live = false, base, fit = true, frame = false, controls = false, tag, buttonSize = "0.62em" }: DepthSlideProps) {
  const [picked, setPicked] = useState<number | null>(null);
  const [showPic, setShowPic] = useState(false);       // scaffold: the tool's picture, off to begin with and kept between questions
  const [plotPic, setPlotPic] = useState(false);
  const [showPyramid, setShowPyramid] = useState(true);
  useEffect(() => { setPicked(null); }, [item.id]);
  useEffect(() => {
    if (!live || !onAnswerChange) return;
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea,select")) return;
      if (e.key === "a") onAnswerChange?.(!answer);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [live, answer, onAnswerChange]);

  // in a deck the slide takes the Depth family's colour like every other slide; on the tool page each purpose has its own
  const accent = frame ? PURPOSE_COLOUR[item.purpose] : "#0f766e";
  const cast = assignCast((item.speakers ?? []).map((s) => s.name));
  const w = item.working;
  const cv = item.visual?.type === "custom" ? item.visual : null;
  const pyramid = item.visual?.type === "pyramid" ? item.visual : null;
  const B = live ? "button" : "span";
  const pill: CSSProperties = { display: "inline-flex", alignItems: "center", gap: "0.4em", padding: "0 0.85em", height: "1.85em", boxSizing: "border-box", borderRadius: "0.62em", border: "0.08em solid #cbd5e1", background: "white", fontWeight: 600, fontSize: buttonSize, lineHeight: 1.2, color: "#334155", cursor: live ? "pointer" : "default" };

  const header = (
    <div style={{ display: "flex", alignItems: "center", gap: "0.7em", flexWrap: "wrap" }}>
      <span style={{ fontSize: "0.5em", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: accent, lineHeight: 1.6 }}>{PURPOSE_LABEL[item.purpose]} · {LV_LABELS[item.level]}{tag ? ` · ${tag}` : ""}</span>
      {cv && !answer && <>
        <B role="switch" aria-checked={showPic} onClick={() => { setShowPic(!showPic); if (showPic) setPlotPic(false); }} style={{ ...pill, background: showPic ? "#dcfce7" : "white" }}>{cv.labels?.show ?? "Show picture"}</B>
        <B role="switch" aria-checked={plotPic} onClick={() => showPic && setPlotPic(!plotPic)} style={{ ...pill, opacity: showPic ? 1 : 0.4, background: plotPic ? "#dcfce7" : "white" }}>{cv.labels?.plot ?? "Plot the point"}</B>
      </>}
      {pyramid && <B role="switch" aria-checked={showPyramid} onClick={() => setShowPyramid(!showPyramid)} style={{ ...pill, background: showPyramid ? "#dcfce7" : "white" }}>BIDMAS pyramid</B>}
    </div>
  );

  // the claims stay exactly as they were when the answer is shown
  const speakers = item.speakers && (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35em" }}>
      {item.speakers.map((sp, i) => {
        const col = SPEAKER_COLOURS[i % SPEAKER_COLOURS.length];
        const right = i % 2 === 1;   // the first speaker stands on the left, the second on the right, and so on
        const edge = right ? { right: "-0.38em", borderRight: `0.07em solid ${col}`, borderTop: `0.07em solid ${col}` } : { left: "-0.38em", borderLeft: `0.07em solid ${col}`, borderBottom: `0.07em solid ${col}` };
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.6em", flexDirection: right ? "row-reverse" : "row" }}>
            <Avatar member={cast[i]} size="2.6em" />
            <div style={{ position: "relative", minWidth: 0, maxWidth: "calc(100% - 3.6em)", border: `0.07em solid ${col}`, borderRadius: "0.8em", padding: "0.25em 0.8em", background: "#fff" }}>
              <span style={{ position: "absolute", top: "50%", width: "0.6em", height: "0.6em", background: "#fff", transform: "translateY(-50%) rotate(45deg)", ...edge }} />
              <div style={{ fontSize: "0.5em", fontWeight: 700, color: col, textTransform: "uppercase", letterSpacing: "0.1em" }}>{sp.name}</div>
              {sp.says.map((line, k) => <div key={k} style={{ fontSize: "1em", fontWeight: 500, lineHeight: 1.3 }}><InlineMath text={line} /></div>)}
            </div>
          </div>
        );
      })}
    </div>
  );

  // lines are marked in place on the answer beat (a border and a label that never changes the row's size)
  const working = w && (
    <div>
      {w.intro && <div style={{ fontSize: "1em", marginBottom: "0.25em" }}><InlineMath text={w.intro} /></div>}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.15em" }}>
        {w.lines.map((ln, i) => {
          const isWrong = answer && i === w.wrongLine, after = answer && i > w.wrongLine, isPick = !answer && picked === i;
          const Row = live ? "button" : "div";
          return (
            <Row key={i} onClick={() => !answer && setPicked((p) => (p === i ? null : i))}
              style={{ display: "flex", alignItems: "center", gap: "0.6em", textAlign: "left", padding: "0.1em 0.6em", borderRadius: "0.5em", opacity: after ? 0.45 : 1, cursor: !answer && live ? "pointer" : "default",
                border: `0.07em solid ${isWrong ? "#dc2626" : isPick ? "#d97706" : "#e2e8f0"}`, background: isWrong ? "#fef2f2" : isPick ? "#fffbeb" : "#fff" }}>
              <span style={{ width: "1.3em", fontSize: "0.5em", fontWeight: 700, color: "#94a3b8" }}>{i + 1}</span>
              <span style={{ fontSize: "0.85em" }}><MathRenderer latex={ln} style={{ fontSize: "1em" }} /></span>
              {isWrong && <span style={{ marginLeft: "auto", fontSize: "0.5em", fontWeight: 700, color: "#dc2626" }}>First mistake</span>}
              {isPick && <span style={{ marginLeft: "auto", fontSize: "0.5em", fontWeight: 600, color: "#b45309" }}>Our pick</span>}
            </Row>
          );
        })}
      </div>
    </div>
  );

  // when the question is only the prompt of a claim / options / working, it is set modestly; on its own it leads the slide
  
  const question = (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.1em" }}>
      {item.question.map((line, i) => <div key={i} style={{ fontSize: "1.15em", fontWeight: 600, lineHeight: 1.3, color: "#111827" }}><InlineMath text={line} /></div>)}
    </div>
  );

  // the tiles keep their size: the right one is marked by colour and a tick, the others are softened
  const options = item.options && (
    <div style={{ display: "grid", gap: "0.4em", gridTemplateColumns: `repeat(${item.options.length <= 3 ? item.options.length : 2}, minmax(0, 1fr))` }}>
      {item.options.map((o, i) => {
        const right = answer && o.correct, wrong = answer && !o.correct;
        return (
          <div key={i} style={{ borderRadius: "0.7em", padding: "0.3em 0.6em", border: `0.07em solid ${right ? "#16a34a" : "#cbd5e1"}`, background: right ? "#f0fdf4" : "#fff", display: "flex", alignItems: "center", gap: "0.5em", opacity: wrong ? 0.55 : 1 }}>
            <span style={{ flexShrink: 0, width: "1.6em", height: "1.6em", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.7em", background: right ? "#16a34a" : NAVY }}>{right ? <Check size="1em" strokeWidth={3} aria-label="Correct" /> : String.fromCharCode(65 + i)}</span>
            <span style={{ fontSize: "1em", fontWeight: 500, lineHeight: 1.2 }}><InlineMath text={o.text} /></span>
          </div>
        );
      })}
    </div>
  );

  // The gap. It is in the layout on BOTH beats (so the question never moves); the answer fades into it. The owl stands at its left and the
  // picture (when the item has one) at its right: the owl is a mascot, not a speaker.
  const pictureShown = !!cv && (answer || showPic);
  const picture = cv && (
    <div aria-hidden={!pictureShown} style={{ flex: "0 0 38%", maxWidth: "20em", visibility: pictureShown ? "visible" : "hidden" }}>
      {pictureShown ? cv.render(answer, answer || plotPic) : cv.render(true, true)}
    </div>
  );
  const gap = (
    <div style={{ display: "flex", alignItems: "center", gap: "0.8em" }}>
      <Mascot mood={answer ? "know" : "think"} size="3em" tone="light" />
      <div aria-hidden={!answer} data-answer={answer ? "" : undefined} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.2em", borderLeft: `0.2em solid ${answer ? "#16a34a" : "transparent"}`, paddingLeft: "0.7em", opacity: answer ? 1 : 0, transition: "opacity 0.2s" }}>
        <div style={{ fontSize: "0.5em", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#15803d" }}>Answer</div>
        {item.answer.map((line, i) => <div key={i} style={{ fontSize: "0.9em", lineHeight: 1.35, color: "#111827" }}><InlineMath text={line} /></div>)}
      </div>
      {picture}
    </div>
  );

  const body = (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.55em", width: "100%" }}>
      {speakers}{working}{question}{options}
      {gap}
    </div>
  );
  const buttons = controls && (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.6em" }}>
      <B onClick={() => onAnswerChange?.(!answer)} style={pill}>{answer ? <EyeOff size="1em" /> : <Eye size="1em" />}{answer ? "Back to the question" : "Show answer"}</B>
    </div>
  );
  const pyramidCorner = pyramid && showPyramid && (
    <div style={{ position: "absolute", top: "0.4em", right: "0.6em", width: "6em", zIndex: 1 }}><BidmasPyramid strong={answer ? pyramid.strong : []} soft={answer ? pyramid.soft : []} maxWidth={200} /></div>
  );

  const shell: CSSProperties = frame
    ? { position: "relative", background: "#fff", borderRadius: "1em", borderTop: `0.35em solid ${accent}`, boxShadow: "0 0.15em 0.6em rgba(0,0,0,0.12)", padding: "0.9em 1.1em" }
    : { position: "relative", padding: "0.2em" };
  return (
    <div style={{ ...shell, fontSize: base, color: "#0f172a", display: "flex", flexDirection: "column", gap: "0.5em", ...(fit ? { height: "100%", boxSizing: "border-box" } : {}) }}>
      {pyramidCorner}
      {header}
      {fit ? <FitBox anchor="top">{body}</FitBox> : body}
      {buttons}
    </div>
  );
}
