import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Eye, EyeOff } from "lucide-react";
import { InlineMath, MathRenderer } from "../shared/components/MathRenderer";
import { Avatar, Mascot, assignCast } from "../shared/components/DepthArt";
import { feathersLine, type DepthItem } from "../shared/depth";
import { LV_LABELS } from "../shared/colors";

// ─────────────────────────────────────────────────────────────────────────────
// A Depth item drawn straight onto a deck slide, in the deck's own style: no stage, no panel, no frame inside the
// slide's frame. The same fixed item from the tool's Depth bank (speakers, working, question, options, answer,
// Feathers, teacher note); the tool page's Depth mode keeps its own navy stage. Live: "Show answer" (or `a`) turns
// it to the answer, and a working line can be tapped as the class's pick. Everything is sized in em from one base
// size, which shrinks until the item fits its box.
// ─────────────────────────────────────────────────────────────────────────────

const SPEAKER_COLOURS = ["#7c3aed", "#e11d48", "#059669", "#d97706", "#2563eb"];
const PURPOSE = { diagnose: "Diagnose", explain: "Explain", extend: "Extend" } as const;
const ACCENT = "#0f766e";                     // the Depth family's colour (FAMILY_STYLE.depth)

export function DepthFlat({ item, live, base = 34 }: { item: DepthItem; live: boolean; base?: number }) {
  const [answer, setAnswer] = useState(false);
  const [teacher, setTeacher] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [size, setSize] = useState(base);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!live) return;
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea,select")) return;
      if (e.key === "a") setAnswer((v) => !v);
      else if (e.key === "t") setTeacher((v) => !v);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [live]);

  // start from the base size whenever what is shown changes, then shrink until it fits
  const [fit, setFit] = useState(0);
  useLayoutEffect(() => { setSize(base); setFit((n) => n + 1); }, [base, item, answer, teacher]);
  useLayoutEffect(() => {
    const el = box.current;
    if (el && el.scrollHeight > el.clientHeight + 1 && size > base * 0.55) setSize((s) => Math.round(s * 0.92 * 10) / 10);
  }, [size, base, fit]);

  const B = live ? "button" : "span";
  const btn: CSSProperties = { display: "inline-flex", alignItems: "center", gap: "0.35em", padding: "0.3em 0.8em", borderRadius: "0.5em", border: "1px solid #cbd5e1", background: "white", fontWeight: 600, color: "#334155", fontSize: "0.7em" };
  const cast = assignCast((item.speakers ?? []).map((s) => s.name));
  const w = item.working;
  const cv = item.visual?.type === "custom" ? item.visual : null;

  return (
    <div ref={box} style={{ height: "100%", overflow: "hidden", display: "flex", flexDirection: "column", gap: "0.55em", fontSize: size, color: "#0f172a" }}>
      <div style={{ fontSize: "0.6em", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: ACCENT }}>
        {PURPOSE[item.purpose]} · {LV_LABELS[item.level]}
      </div>

      {item.speakers && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4em" }}>
          {item.speakers.map((sp, i) => {
            const col = SPEAKER_COLOURS[i % SPEAKER_COLOURS.length];
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.6em" }}>
                <Avatar member={cast[i]} size="2.6em" />
                <div style={{ position: "relative", border: `0.08em solid ${col}`, borderRadius: "0.9em", padding: "0.2em 0.9em", minWidth: 0 }}>
                  <span style={{ position: "absolute", left: "-0.36em", top: "50%", width: "0.6em", height: "0.6em", background: "#fff", borderLeft: `0.08em solid ${col}`, borderBottom: `0.08em solid ${col}`, transform: "translateY(-50%) rotate(45deg)" }} />
                  <div style={{ fontSize: "0.5em", fontWeight: 700, color: col, textTransform: "uppercase", letterSpacing: "0.1em" }}>{sp.name}</div>
                  {sp.says.map((line, k) => <div key={k} style={{ fontWeight: 600, lineHeight: 1.3 }}><InlineMath text={line} /></div>)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {w && (
        <div>
          {w.intro && <div style={{ marginBottom: "0.2em" }}><InlineMath text={w.intro} /></div>}
          {w.lines.map((ln, i) => {
            const wrong = answer && i === w.wrongLine, after = answer && i > w.wrongLine, pick = !answer && picked === i;
            const Row = live ? "button" : "div";
            return (
              <Row key={i} onClick={() => !answer && setPicked((p) => (p === i ? null : i))}
                style={{ display: "flex", alignItems: "baseline", gap: "0.7em", width: "100%", textAlign: "left", padding: "0.1em 0.4em", opacity: after ? 0.4 : 1,
                  borderLeft: `0.12em solid ${wrong ? "#dc2626" : pick ? "#d97706" : "transparent"}`, borderBottom: "1px solid #e2e8f0" }}>
                <span style={{ width: "1.2em", fontSize: "0.55em", color: "#94a3b8", fontWeight: 700 }}>{i + 1}</span>
                <MathRenderer latex={ln} style={{ fontSize: "1.1em" }} />
                {wrong && <span style={{ marginLeft: "auto", fontSize: "0.55em", fontWeight: 700, color: "#dc2626" }}>FIRST MISTAKE</span>}
                {pick && <span style={{ marginLeft: "auto", fontSize: "0.55em", fontWeight: 700, color: "#b45309" }}>OUR PICK</span>}
              </Row>
            );
          })}
        </div>
      )}

      {cv && answer && <div style={{ maxWidth: "18em" }}>{cv.render(true, true)}</div>}

      <div>{item.question.map((line, i) => <div key={i} style={{ fontSize: "1.15em", fontWeight: 600, lineHeight: 1.3 }}><InlineMath text={line} /></div>)}</div>

      {item.options && (
        <div style={{ display: "grid", gap: "0.5em", gridTemplateColumns: `repeat(${Math.min(item.options.length, 4)}, minmax(0, 1fr))` }}>
          {item.options.map((o, i) => {
            const right = answer && o.correct, wrong = answer && !o.correct;
            return (
              <div key={i} style={{ borderRadius: "0.6em", padding: "0.35em 0.6em", border: `0.07em solid ${right ? "#16a34a" : "#cbd5e1"}`, background: right ? "#f0fdf4" : "#fff" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.45em" }}>
                  <span style={{ flexShrink: 0, width: "1.4em", height: "1.4em", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.7em", background: right ? "#16a34a" : "#1e3a8a" }}>{String.fromCharCode(65 + i)}</span>
                  <span style={{ fontWeight: 600, opacity: wrong ? 0.7 : 1 }}><InlineMath text={o.text} /></span>
                </div>
                {wrong && o.misconception && <div style={{ marginTop: "0.2em", fontSize: "0.55em", lineHeight: 1.3, color: "#475569" }}><InlineMath text={o.misconception} /></div>}
              </div>
            );
          })}
        </div>
      )}

      {answer && (
        <div style={{ borderLeft: `0.12em solid ${ACCENT}`, paddingLeft: "0.6em", display: "flex", flexDirection: "column", gap: "0.15em" }}>
          {item.answer.map((line, i) => <div key={i} style={{ lineHeight: 1.3 }}><InlineMath text={line} /></div>)}
        </div>
      )}

      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: "0.6em" }}>
        <Mascot mood={answer ? "know" : "think"} size="2.2em" tone="light" />
        <div style={{ fontSize: "0.65em", color: "#475569", fontWeight: 600, flex: 1, minWidth: 0 }}><InlineMath text={feathersLine(item, answer)} /></div>
        {live && item.teacherNote && <B onClick={() => setTeacher((v) => !v)} style={{ ...btn, border: 0, color: "#94a3b8" }}>{teacher ? "Hide teacher notes" : "Teacher notes"}</B>}
        <B onClick={() => setAnswer((v) => !v)} style={btn}>{answer ? <EyeOff size="1em" /> : <Eye size="1em" />}{answer ? "Back to the question" : "Show answer"}</B>
      </div>
      {live && teacher && item.teacherNote && <div style={{ fontSize: "0.6em", color: "#475569" }}><b>Teacher note:</b> <InlineMath text={item.teacherNote} /></div>}
    </div>
  );
}
