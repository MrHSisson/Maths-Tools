import { useEffect, useState, type CSSProperties } from "react";
import { Eye, EyeOff, MessageCircle, Info } from "lucide-react";
import { InlineMath, MathRenderer } from "./MathRenderer";
import { BidmasPyramid } from "./BidmasPyramid";
import { Avatar, Mascot, assignCast } from "./DepthArt";
import { FitBox } from "./FitBox";
import { LV_LABELS } from "../colors";
import { feathersLine, type DepthItem } from "../depth";

// ─────────────────────────────────────────────────────────────────────────────
// One Depth item as ONE slide design, used by both the deck's Depth card and the tool's Depth section (DepthMode), so a change to
// how a Depth question looks is made once. It draws a single beat: the question (speakers, working, picture, question, options)
// or the answer (the same, marked, with the reasoning) and Feathers' line. Everything is sized in em from `base`, and the whole
// face shrinks to fit the box it is given (`fit`), never above its natural size. Optimised for a classroom slide: big quotes,
// options side by side, a big owl.
//
// Controlled by the parent: `answer` says which beat. With `controls` it also draws its own button row (Show answer, Teacher notes,
// Feathers) and answers the `a` / `t` keys when `live`.
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
  /** Draw the button row (Show answer, Teacher notes, Feathers). Off when the parent has its own controls. */
  controls?: boolean;
  /** Feathers' line shown (parent-controlled); omit for the per-device setting with its own switch. */
  feathersOn?: boolean;
  /** A short note beside the purpose and level in the header (for example "Quick check 2 of 3"). */
  tag?: string;
}

export function DepthSlide({ item, answer, onAnswerChange, live = false, base, fit = true, frame = false, controls = false, feathersOn, tag }: DepthSlideProps) {
  const [picked, setPicked] = useState<number | null>(null);
  const [teacher, setTeacher] = useState(false);
  const [showPic, setShowPic] = useState(false);       // scaffold: the tool's picture, off to begin with and kept between questions
  const [plotPic, setPlotPic] = useState(false);
  const [showPyramid, setShowPyramid] = useState(true);
  const [ownFeathers, setOwnFeathers] = useState(() => { try { return localStorage.getItem("mt-depth-feathers") !== "off"; } catch { return true; } });
  const feathers = feathersOn ?? ownFeathers;
  const toggleFeathers = () => setOwnFeathers((v) => { const n = !v; try { localStorage.setItem("mt-depth-feathers", n ? "on" : "off"); } catch { /* session only */ } return n; });
  useEffect(() => { setPicked(null); setTeacher(false); }, [item.id]);
  useEffect(() => {
    if (!live || !controls) return;
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea,select")) return;
      if (e.key === "a") onAnswerChange?.(!answer);
      else if (e.key === "t") setTeacher((v) => !v);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [live, controls, answer, onAnswerChange]);

  // in a deck the slide takes the Depth family's colour like every other slide; on the tool page each purpose has its own
  const accent = frame ? PURPOSE_COLOUR[item.purpose] : "#0f766e";
  const cast = assignCast((item.speakers ?? []).map((s) => s.name));
  const w = item.working;
  const cv = item.visual?.type === "custom" ? item.visual : null;
  const pyramid = item.visual?.type === "pyramid" ? item.visual : null;
  const B = live ? "button" : "span";
  const pill: CSSProperties = { display: "inline-flex", alignItems: "center", gap: "0.35em", padding: "0.25em 0.8em", borderRadius: "0.6em", border: "0.06em solid #cbd5e1", background: "white", fontWeight: 600, fontSize: "0.62em", color: "#334155", cursor: live ? "pointer" : "default" };

  const header = (
    <div style={{ display: "flex", alignItems: "center", gap: "0.8em", flexWrap: "wrap" }}>
      <span style={{ fontSize: "0.6em", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: accent }}>{PURPOSE_LABEL[item.purpose]} · {LV_LABELS[item.level]}{tag ? ` · ${tag}` : ""}</span>
      {cv && !answer && <>
        <B role="switch" aria-checked={showPic} onClick={() => { setShowPic(!showPic); if (showPic) setPlotPic(false); }} style={{ ...pill, background: showPic ? "#dcfce7" : "white" }}>{cv.labels?.show ?? "Show picture"}</B>
        <B role="switch" aria-checked={plotPic} onClick={() => showPic && setPlotPic(!plotPic)} style={{ ...pill, opacity: showPic ? 1 : 0.4, background: plotPic ? "#dcfce7" : "white" }}>{cv.labels?.plot ?? "Plot the point"}</B>
      </>}
      {pyramid && <B role="switch" aria-checked={showPyramid} onClick={() => setShowPyramid(!showPyramid)} style={{ ...pill, background: showPyramid ? "#dcfce7" : "white" }}>BIDMAS pyramid</B>}
    </div>
  );

  const speakers = item.speakers && (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.45em" }}>
      {item.speakers.map((sp, i) => {
        const col = SPEAKER_COLOURS[i % SPEAKER_COLOURS.length];
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.7em" }}>
            <Avatar member={cast[i]} size="3.6em" />
            <div style={{ position: "relative", flex: 1, minWidth: 0, border: `0.1em solid ${col}`, borderRadius: "0.9em", padding: "0.3em 0.9em", background: "#fff" }}>
              <span style={{ position: "absolute", left: "-0.42em", top: "50%", width: "0.7em", height: "0.7em", background: "#fff", borderLeft: `0.1em solid ${col}`, borderBottom: `0.1em solid ${col}`, transform: "translateY(-50%) rotate(45deg)" }} />
              <div style={{ fontSize: "0.55em", fontWeight: 800, color: col, textTransform: "uppercase", letterSpacing: "0.1em" }}>{sp.name}</div>
              {sp.says.map((line, k) => <div key={k} style={{ fontSize: "1.1em", fontWeight: 600, lineHeight: 1.3 }}><InlineMath text={line} /></div>)}
            </div>
          </div>
        );
      })}
    </div>
  );

  const working = w && (
    <div>
      {w.intro && !answer && <div style={{ fontSize: "1.05em", marginBottom: "0.3em" }}><InlineMath text={w.intro} /></div>}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.2em" }}>
        {w.lines.map((ln, i) => {
          const isWrong = answer && i === w.wrongLine, after = answer && i > w.wrongLine, isPick = !answer && picked === i;
          const Row = live ? "button" : "div";
          return (
            <Row key={i} onClick={() => !answer && setPicked((p) => (p === i ? null : i))}
              style={{ display: "flex", alignItems: "center", gap: "0.7em", textAlign: "left", padding: "0.12em 0.7em", borderRadius: "0.5em", opacity: after ? 0.45 : 1, cursor: !answer && live ? "pointer" : "default",
                border: `0.1em solid ${isWrong ? "#dc2626" : isPick ? "#d97706" : "#e2e8f0"}`, background: isWrong ? "#fef2f2" : isPick ? "#fffbeb" : "#fff" }}>
              <span style={{ width: "1.3em", fontSize: "0.6em", fontWeight: 700, color: "#94a3b8" }}>{i + 1}</span>
              <span style={{ fontSize: "1.15em" }}><MathRenderer latex={ln} style={{ fontSize: "1em" }} /></span>
              {isWrong && <span style={{ marginLeft: "auto", fontSize: "0.6em", fontWeight: 800, color: "#dc2626" }}>First mistake</span>}
              {isPick && <span style={{ marginLeft: "auto", fontSize: "0.6em", fontWeight: 700, color: "#b45309" }}>Our pick</span>}
            </Row>
          );
        })}
      </div>
    </div>
  );

  const picture = cv && (answer || showPic) && <div style={{ width: "100%", maxWidth: "26em" }}>{cv.render(answer, answer || plotPic)}</div>;

  const options = item.options && (
    <div style={{ display: "grid", gap: "0.5em", gridTemplateColumns: `repeat(${item.options.length <= 3 ? item.options.length : 2}, minmax(0, 1fr))` }}>
      {item.options.map((o, i) => {
        const right = answer && o.correct, wrong = answer && !o.correct;
        return (
          <div key={i} style={{ borderRadius: "0.8em", padding: "0.4em 0.7em", border: `0.1em solid ${right ? "#16a34a" : "#cbd5e1"}`, background: right ? "#f0fdf4" : "#fff", display: "flex", flexDirection: "column", gap: "0.2em" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5em" }}>
              <span style={{ flexShrink: 0, width: "1.7em", height: "1.7em", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.85em", background: right ? "#16a34a" : NAVY }}>{String.fromCharCode(65 + i)}</span>
              <span style={{ fontSize: "1.15em", fontWeight: 650, lineHeight: 1.2, opacity: wrong ? 0.8 : 1 }}><InlineMath text={o.text} /></span>
              {right && <span style={{ marginLeft: "auto", fontSize: "0.65em", fontWeight: 800, color: "#15803d" }}>Correct</span>}
            </div>
            {wrong && o.misconception && <div style={{ fontSize: "0.68em", color: "#475569", lineHeight: 1.3 }}><b>Shows: </b><InlineMath text={o.misconception} /></div>}
          </div>
        );
      })}
    </div>
  );

  const question = !answer && (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.1em" }}>
      {item.question.map((line, i) => <div key={i} style={{ fontSize: "1.35em", fontWeight: 650, lineHeight: 1.3, color: "#111827" }}><InlineMath text={line} /></div>)}
    </div>
  );
  const reasoning = answer && (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25em", borderLeft: "0.25em solid #16a34a", paddingLeft: "0.8em" }}>
      {item.answer.map((line, i) => <div key={i} style={{ fontSize: item.options || w ? "1.1em" : "1.3em", lineHeight: 1.35, color: "#111827" }}><InlineMath text={line} /></div>)}
    </div>
  );

  const line = feathers ? feathersLine(item, answer) : null;
  const owl = line && (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5em", fontSize: "0.8em" }}>
      <Mascot mood={answer ? "know" : "think"} size="3.6em" tone="light" />
      <div style={{ flex: 1, minWidth: 0, background: "#e7effa", border: "0.08em solid #94a3b8", borderRadius: "0.9em", padding: "0.3em 0.8em" }}>
        <div style={{ fontSize: "0.5em", fontWeight: 800, color: NAVY, textTransform: "uppercase", letterSpacing: "0.12em" }}>Feathers</div>
        <div style={{ fontSize: "0.95em", lineHeight: 1.25, color: "#334155" }}><InlineMath text={line} /></div>
      </div>
    </div>
  );

  const body = (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.6em", width: "100%" }}>
      {header}
      {answer && <div style={{ fontSize: "0.65em", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#15803d" }}>Answer</div>}
      {speakers}{working}{picture}{question}{options}{reasoning}
      {owl}
    </div>
  );
  const buttons = controls && (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.6em", fontSize: "0.7em" }}>
      <B onClick={() => onAnswerChange?.(!answer)} style={{ ...pill, fontSize: "0.7em", padding: "0.35em 1em" }}>{answer ? <EyeOff size="1em" /> : <Eye size="1em" />}{answer ? "Back to the question" : "Show answer"}</B>
      {live && <B onClick={toggleFeathers} aria-pressed={feathers} style={{ ...pill, background: feathers ? "#dbeafe" : "white" }}><MessageCircle size="1em" />Feathers</B>}
      {live && item.teacherNote && <B onClick={() => setTeacher((v) => !v)} aria-pressed={teacher} style={{ ...pill, background: teacher ? "#fde68a" : "white" }}><Info size="1em" />Teacher notes</B>}
    </div>
  );
  const note = live && teacher && item.teacherNote && <div style={{ fontSize: "0.65em", background: "#fffbeb", border: "0.06em solid #fde68a", borderRadius: "0.6em", padding: "0.4em 0.8em", color: "#78350f" }}><b>Teacher: </b><InlineMath text={item.teacherNote} /></div>;
  const pyramidCorner = pyramid && showPyramid && (
    <div style={{ position: "absolute", top: "0.4em", right: "0.6em", width: "7em", zIndex: 1 }}><BidmasPyramid strong={answer ? pyramid.strong : []} soft={answer ? pyramid.soft : []} maxWidth={200} /></div>
  );

  const shell: CSSProperties = frame
    ? { position: "relative", background: "#fff", borderRadius: "1em", borderTop: `0.35em solid ${accent}`, boxShadow: "0 0.15em 0.6em rgba(0,0,0,0.12)", padding: "0.9em 1.1em" }
    : { position: "relative", padding: "0.2em" };
  return (
    <div style={{ ...shell, fontSize: base, color: "#0f172a", display: "flex", flexDirection: "column", gap: "0.5em", ...(fit ? { height: "100%", boxSizing: "border-box" } : {}) }}>
      {pyramidCorner}
      {fit ? <FitBox>{body}</FitBox> : body}
      {note}
      {buttons}
    </div>
  );
}
