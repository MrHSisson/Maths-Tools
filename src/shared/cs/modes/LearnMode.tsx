// ─────────────────────────────────────────────────────────────────────────────
// MODE: LEARN — taught, stepped walkthroughs over a topic's core representation.
// This is the *teaching* surface (I-do): explanation + a diagram that highlights
// the part under discussion, revealed one beat per press.
//
// Topic-agnostic: the predict/flow/analogy/trace engine is generic. A topic
// supplies its `lessons` and a `scenes` config that maps a lesson's descriptor
// (`kind`) to a representation — schematic → BoxSchematic, trace → TraceTable —
// plus an optional legend. See CS_SHELL_PLAN.md ("representations as data").
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CARD_SHADOW, boldText } from "../ui";
import { SpecBadge } from "../context";
import { BoxSchematic, TraceTable } from "../representations";
import { type Lesson, type SchematicConfig, type TraceConfig } from "../types";

// Scene config: maps a lesson's `kind` descriptor to the representation that
// renders its beats. A topic passes the configs its lessons reference; the
// engine picks the right one per lesson. `legend` (optional) is shown under the
// scene on any beat with `legend: true`.
export interface LearnScenes {
  schematic?: SchematicConfig;                  // default schematic for diagram lessons
  schematics?: Record<string, SchematicConfig>; // named schematics a lesson picks via `scene`
  trace?: TraceConfig;                          // kind: "trace" lessons
  legend?: ReactNode;
}

export const LearnMode = ({ lessons, scenes }: { lessons: Lesson[]; scenes: LearnScenes }) => {
  const [lessonIdx, setLessonIdx] = useState(0);
  const [step, setStep] = useState(0);
  const [predicted, setPredicted] = useState(false);   // has the You-do answer been revealed?

  const lesson = lessons[lessonIdx];
  const maxStep = lesson.steps.length - 1;
  // Clamp: when switching to a shorter lesson, `step` is briefly out of range
  // for one render before the reset effect fires — guard against undefined.
  const s = Math.min(step, maxStep);
  const cur = lesson.steps[s];
  const isTrace = lesson.kind === "trace";
  // A diagram lesson picks a named schematic via `scene`, else the topic default.
  // A "text" lesson (or one that resolves to nothing) shows no scene panel at all.
  const schematic = lesson.scene ? scenes.schematics?.[lesson.scene] : scenes.schematic;
  const showScene = lesson.kind !== "text" && (isTrace ? !!scenes.trace : !!schematic);
  const gated = !!cur.predict && !predicted;            // must predict before advancing
  const showFlow = !!cur.flow && !gated;

  useEffect(() => { setStep(0); }, [lessonIdx]);
  useEffect(() => { setPredicted(false); }, [step, lessonIdx]);

  const next = useCallback(() => setStep(s => Math.min(maxStep, s + 1)), [maxStep]);
  const prev = useCallback(() => setStep(s => Math.max(0, s - 1)), []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target !== document.body) return;
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); if (!gated) next(); }
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [next, prev, gated]);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
      {/* lesson picker */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {lessons.map((l, i) => (
          <button key={l.id} onClick={() => setLessonIdx(i)}
            style={{ minHeight: 40, padding: "0 14px", borderRadius: 10, fontWeight: 700, fontSize: "0.8rem", border: "2px solid", cursor: "pointer",
              background: i === lessonIdx ? "#1e3a8a" : "#fff", color: i === lessonIdx ? "#fff" : "#4b5563", borderColor: i === lessonIdx ? "#1e3a8a" : "#e5e7eb" }}>
            {i + 1}. {l.title}
          </button>
        ))}
      </div>

      {/* lesson card */}
      <div style={{ background: "#fff", borderRadius: 16, border: "2px solid #e5e7eb", boxShadow: CARD_SHADOW, padding: "18px 18px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <p style={{ fontWeight: 800, fontSize: "1rem", color: "#1e3a8a", margin: 0 }}>{lesson.title}</p>
          <div style={{ display: "flex", gap: 6 }}>{lesson.specTags.map(t => <SpecBadge key={t} tag={t} />)}</div>
        </div>

        {showScene && (
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 10px 10px" }}>
            {isTrace && scenes.trace
              ? <TraceTable config={scenes.trace} snapshot={cur.trace} hot={cur.highlight} />
              : schematic && <BoxSchematic config={schematic} highlight={gated ? [] : cur.highlight} flow={showFlow ? cur.flow : undefined} flowKey={s} />}
            {cur.legend && scenes.legend}
          </div>
        )}

        {/* explanation — one beat at a time; predict steps ask first (You-do) */}
        {gated ? (
          <div style={{ minHeight: 84, background: "#f5f3ff", borderRadius: 12, borderLeft: "4px solid #7c3aed", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7c3aed" }}>Your turn — predict first</span>
            <p style={{ fontSize: "1rem", color: "#334155", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{boldText(cur.predict!)}</p>
            <button onClick={() => setPredicted(true)}
              style={{ alignSelf: "flex-start", minHeight: 40, padding: "0 18px", borderRadius: 10, fontWeight: 700, fontSize: "0.85rem", border: "none", cursor: "pointer", background: "#7c3aed", color: "#fff" }}>
              Show answer
            </button>
          </div>
        ) : (
          <div style={{ minHeight: 84, background: "#eff6ff", borderRadius: 12, borderLeft: "4px solid #1e3a8a", padding: "14px 16px", display: "flex", alignItems: "center" }}>
            <p style={{ fontSize: "1rem", color: "#334155", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{boldText(cur.text)}</p>
          </div>
        )}

        {/* analogy — a concrete anchor for the whole lesson */}
        {lesson.analogy && (
          <div style={{ background: "#fffbeb", borderRadius: 12, border: "1.5px solid #fde68a", padding: "10px 14px" }}>
            <span style={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#b45309" }}>Think of it like…</span>
            <p style={{ fontSize: "0.86rem", color: "#78350f", lineHeight: 1.55, margin: "3px 0 0", fontWeight: 500 }}>{boldText(lesson.analogy)}</p>
          </div>
        )}

        {/* progress dots */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
          {lesson.steps.map((_, i) => (
            <span key={i} style={{ width: i === s ? 22 : 8, height: 8, borderRadius: 4, background: i === s ? "#1e3a8a" : i < s ? "#93c5fd" : "#e5e7eb", transition: "all 0.2s" }} />
          ))}
        </div>

        {/* nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <button onClick={prev} disabled={s === 0}
            style={{ minHeight: 44, display: "flex", alignItems: "center", gap: 6, padding: "0 18px", borderRadius: 12, fontWeight: 700, fontSize: "0.9rem", border: "2px solid", cursor: s === 0 ? "not-allowed" : "pointer", background: s === 0 ? "#f3f4f6" : "#fff", color: s === 0 ? "#d1d5db" : "#374151", borderColor: s === 0 ? "#e5e7eb" : "#d1d5db" }}>
            <ChevronLeft size={18} /> Back
          </button>
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#9ca3af" }}>{s + 1} / {lesson.steps.length}</span>
          {s < maxStep ? (
            <button onClick={next} disabled={gated} title={gated ? "Predict first" : undefined}
              style={{ minHeight: 44, display: "flex", alignItems: "center", gap: 6, padding: "0 22px", borderRadius: 12, fontWeight: 700, fontSize: "0.9rem", border: "2px solid", cursor: gated ? "not-allowed" : "pointer",
                background: gated ? "#f3f4f6" : "#1e3a8a", color: gated ? "#d1d5db" : "#fff", borderColor: gated ? "#e5e7eb" : "#1e3a8a" }}>
              Next <ChevronRight size={18} />
            </button>
          ) : lessonIdx < lessons.length - 1 ? (
            <button onClick={() => setLessonIdx(i => i + 1)}
              style={{ minHeight: 44, display: "flex", alignItems: "center", gap: 6, padding: "0 18px", borderRadius: 12, fontWeight: 700, fontSize: "0.88rem", border: "2px solid #059669", cursor: "pointer", background: "#059669", color: "#fff" }}>
              Next lesson <ChevronRight size={18} />
            </button>
          ) : (
            <span style={{ minHeight: 44, display: "flex", alignItems: "center", padding: "0 18px", fontSize: "0.82rem", fontWeight: 700, color: "#059669" }}>Lesson complete ✓</span>
          )}
        </div>
      </div>

      <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#9ca3af", fontWeight: 500, margin: 0 }}>Press → or space to step forward · ← to go back</p>
    </div>
  );
};
