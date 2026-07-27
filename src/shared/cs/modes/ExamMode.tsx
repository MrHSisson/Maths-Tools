// ─────────────────────────────────────────────────────────────────────────────
// MODE: EXAM — MCQ/state/short/scenario/extended + a Synoptic section. Exam
// realism: J277-style command words, mark tariffs, self-marking against a mark
// scheme, and a worked model answer. Self-contained: driven by its `questions`
// (exam) and `synoptic` content props, reading spec descriptions from the topic
// context via SpecBadge.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Info, Check } from "lucide-react";
import { CARD_SHADOW, boldText } from "../ui";
import { showTooltip } from "../tooltip";
import { SpecBadge } from "../context";
import { MARK_FORMATS, COMMAND_GUIDE, type ExamQuestion, type SynopticQuestion } from "../types";

// A prompt may carry {context} placeholders and a list of contexts to fill it —
// pick one at random so the same question can be re-rolled into a fresh version.
const resolvePrompt = (prompt: string, contexts?: string[]): { text: string; ctx: string | null } => {
  if (!contexts || !contexts.length) return { text: prompt, ctx: null };
  const ctx = contexts[Math.floor(Math.random() * contexts.length)];
  return { text: prompt.replace("{context}", ctx), ctx };
};

const MarkPips = ({ marks, revealed, cfg }: { marks: number; revealed: boolean; cfg: { color: string; bg: string; border: string } }) => (
  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
    {Array.from({ length: marks }).map((_, i) => (
      <div key={i} style={{ width: 26, height: 26, borderRadius: "50%", border: `2px solid ${cfg.border}`, background: revealed ? cfg.bg : "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", fontWeight: 700, color: cfg.color }}>{revealed ? "✓" : i + 1}</div>
    ))}
    <span style={{ fontSize: "0.78rem", color: "#9ca3af", fontWeight: 500, marginLeft: 4 }}>{revealed ? "mark scheme below" : "answer, then reveal"}</span>
  </div>
);

export const ExamMode = ({ questions, synoptic, section, showHints }: {
  questions: ExamQuestion[]; synoptic: SynopticQuestion[]; section: string; showHints: boolean;
}) => {
  const isSyn = section === "synoptic";
  const list = isSyn ? synoptic : (section === "all" ? questions : questions.filter(q => q.format === section));
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [ctx, setCtx] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [ticks, setTicks] = useState<Set<string>>(new Set());   // self-marked points
  const [showModel, setShowModel] = useState(false);

  const pickCtx = (i: number): string | null => {
    const q = list[i];
    return !isSyn && q ? resolvePrompt((q as ExamQuestion).prompt, (q as ExamQuestion).contexts).ctx : null;
  };
  const setup = (i: number) => { setIndex(i); setRevealed(false); setSelected(null); setTicks(new Set()); setShowModel(false); setCtx(pickCtx(i)); };
  const toggleTick = (k: string) => setTicks(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });

  // Reset ONLY when the section changes — not on every render. (list is a fresh
  // array each render, so depending on it here would reset the reveal instantly.)
  useEffect(() => { setIndex(0); setRevealed(false); setSelected(null); setTicks(new Set()); setShowModel(false); setCtx(pickCtx(0)); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  if (!list.length) return <div style={{ textAlign: "center", padding: 60, color: "#9ca3af", fontWeight: 600 }}>No questions in this section.</div>;

  // Clamp: switching to a shorter section leaves `index` out of range for one
  // render before the reset effect runs — guard against reading undefined.
  const idx = Math.min(index, list.length - 1);
  const q = list[idx];
  const format = q.format;
  const cfg = MARK_FORMATS[format];
  const promptText = !isSyn ? (ctx ? (q as ExamQuestion).prompt.replace("{context}", ctx) : (q as ExamQuestion).prompt) : (q as SynopticQuestion).prompt;

  const nav = (dir: number) => { const n = idx + dir; if (n >= 0 && n < list.length) setup(n); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 720, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button onClick={e => { e.stopPropagation(); showTooltip(`${cfg.label} — what it's asking`, COMMAND_GUIDE[format], e.currentTarget as HTMLElement); }}
            title="What this command word wants"
            style={{ minHeight: 24, display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 12px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, background: cfg.bg, color: cfg.color, border: `2px solid ${cfg.border}`, cursor: "pointer" }}>
            {cfg.label} <Info size={12} />
          </button>
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6b7280" }}>[{q.marks} mark{q.marks !== 1 ? "s" : ""}]</span>
          {isSyn && (q as SynopticQuestion).specTags.map(t => <SpecBadge key={t} tag={t} />)}
          {!isSyn && <SpecBadge tag={(q as ExamQuestion).specTag} />}
        </div>
        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#9ca3af" }}>{idx + 1} of {list.length}</span>
      </div>

      {isSyn && (
        <div style={{ background: "#eef2ff", border: "1.5px solid #c7d2fe", borderRadius: 10, padding: "8px 14px" }}>
          <p style={{ fontSize: "0.78rem", color: "#4338ca", fontWeight: 600, margin: 0 }}>Synoptic — this question combines understanding from more than one sub-topic, as real J277 questions do.</p>
        </div>
      )}

      {/* Question card */}
      <div style={{ background: "#fff", borderRadius: 16, border: `2px solid ${cfg.border}`, boxShadow: CARD_SHADOW, padding: "22px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
        <p style={{ fontSize: "1.08rem", fontWeight: 700, color: "#111827", lineHeight: 1.5, margin: 0 }}>{promptText}</p>

        {/* MCQ options */}
        {format === "mcq" && !isSyn && (q as ExamQuestion).options && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(q as ExamQuestion).options!.map((opt, i) => {
              const ans = (q as ExamQuestion).answerIndex;
              let bg = "#fff", border = "#e5e7eb", color = "#111827";
              if (revealed || selected !== null) {
                if (i === ans) { bg = "#ecfdf5"; border = "#10b981"; color = "#065f46"; }
                else if (i === selected) { bg = "#fef2f2"; border = "#ef4444"; color = "#991b1b"; }
              }
              return (
                <button key={i} onClick={() => { if (selected === null) { setSelected(i); setRevealed(true); } }}
                  style={{ minHeight: 44, textAlign: "left", padding: "10px 14px", borderRadius: 10, border: `2px solid ${border}`, background: bg, color, fontWeight: 600, fontSize: "0.9rem", cursor: selected === null ? "pointer" : "default", lineHeight: 1.4 }}>
                  <span style={{ fontWeight: 700, marginRight: 8 }}>{["A", "B", "C", "D"][i]}.</span>{opt}
                </button>
              );
            })}
          </div>
        )}

        {showHints && (
          <div style={{ background: "#f8fafc", borderRadius: 10, padding: "9px 14px", borderLeft: `4px solid ${cfg.border}` }}>
            <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#6b7280", margin: 0 }}><span style={{ color: cfg.color }}>Hint:</span> {q.hint}</p>
          </div>
        )}

        {format !== "mcq" && <MarkPips marks={q.marks} revealed={revealed} cfg={cfg} />}
      </div>

      {/* Reveal button (non-MCQ; MCQ reveals on select) */}
      {!revealed && format !== "mcq" && (
        <button onClick={() => setRevealed(true)} style={{ alignSelf: "center", minHeight: 44, padding: "0 32px", background: cfg.color, color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" }}>Reveal mark scheme</button>
      )}

      {/* Mark scheme */}
      {revealed && (
        <div style={{ background: "#fff", borderRadius: 16, border: `2px solid ${cfg.border}`, boxShadow: CARD_SHADOW, overflow: "hidden" }}>
          <div style={{ background: cfg.bg, padding: "12px 18px", borderBottom: `2px solid ${cfg.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <p style={{ fontWeight: 700, fontSize: "0.85rem", color: cfg.color, margin: 0 }}>Mark scheme — {q.marks} mark{q.marks !== 1 ? "s" : ""}</p>
            {format !== "mcq" && <span style={{ fontSize: "0.82rem", fontWeight: 800, color: cfg.color }}>You: {Math.min(ticks.size, q.marks)} / {q.marks}</span>}
          </div>
          <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
            {format !== "mcq" && (
              <p style={{ fontSize: "0.78rem", color: "#6b7280", fontWeight: 600, margin: 0 }}>Tick each point you actually made — mark yourself honestly.</p>
            )}
            {isSyn
              ? (q as SynopticQuestion).markScheme.map((group, gi) => (
                  <div key={group.tag}>
                    <div style={{ marginBottom: 8 }}><SpecBadge tag={group.tag} /></div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 2 }}>
                      {group.points.map((pt, i) => {
                        const key = `${gi}-${i}`; const ticked = ticks.has(key);
                        return (
                          <div key={i} onClick={() => toggleTick(key)} style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", background: ticked ? "#ecfdf5" : "transparent", borderRadius: 8, padding: "4px 6px", margin: "-2px -4px" }}>
                            <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 6, border: `2px solid ${ticked ? "#10b981" : cfg.border}`, background: ticked ? "#10b981" : "#fff", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>{ticked && <Check size={15} strokeWidth={3} />}</span>
                            <p style={{ fontSize: "0.9rem", color: "#374151", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{pt}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              : (q as ExamQuestion).markScheme.map((pt, i) => {
                  const key = String(i); const ticked = ticks.has(key); const tickable = format !== "mcq";
                  return (
                    <div key={i} onClick={tickable ? () => toggleTick(key) : undefined}
                      style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: tickable ? "pointer" : "default", background: ticked ? "#ecfdf5" : "transparent", borderRadius: 8, padding: "4px 6px", margin: "-2px -4px" }}>
                      {tickable
                        ? <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 6, border: `2px solid ${ticked ? "#10b981" : cfg.border}`, background: ticked ? "#10b981" : "#fff", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>{ticked && <Check size={15} strokeWidth={3} />}</span>
                        : <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: "50%", background: cfg.bg, border: `2px solid ${cfg.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, color: cfg.color, marginTop: 1 }}>{i + 1}</span>}
                      <p style={{ fontSize: "0.9rem", color: "#374151", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{pt}</p>
                    </div>
                  );
                })}

            {/* context-specific model notes (non-synoptic) */}
            {!isSyn && ctx && (q as ExamQuestion).modelNotes?.[ctx] && (
              <div style={{ marginTop: 4, padding: "12px 14px", background: "#f8fafc", borderRadius: 10, borderLeft: `4px solid ${cfg.border}` }}>
                <p style={{ fontSize: "0.74rem", fontWeight: 700, color: "#6b7280", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Model notes for this version</p>
                {(q as ExamQuestion).modelNotes![ctx].map((n, i) => (
                  <p key={i} style={{ fontSize: "0.85rem", color: "#374151", lineHeight: 1.6, margin: i ? "6px 0 0" : 0 }}>{n}</p>
                ))}
              </div>
            )}

            {/* worked model answer — how to turn the mark points into a real answer */}
            {q.modelAnswer && (
              <div>
                <button onClick={() => setShowModel(m => !m)}
                  style={{ minHeight: 40, padding: "0 16px", borderRadius: 10, fontWeight: 700, fontSize: "0.82rem", border: `2px solid ${cfg.border}`, background: showModel ? cfg.bg : "#fff", color: cfg.color, cursor: "pointer" }}>
                  {showModel ? "Hide model answer" : "Show model answer"}
                </button>
                {showModel && (
                  <div style={{ marginTop: 10, background: "#f8fafc", borderRadius: 10, borderLeft: `4px solid ${cfg.border}`, padding: "12px 14px" }}>
                    <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Model answer — bold shows where the marks are</p>
                    <p style={{ fontSize: "0.9rem", color: "#334155", lineHeight: 1.7, margin: 0 }}>{boldText(q.modelAnswer)}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <button onClick={() => nav(-1)} disabled={idx === 0} style={{ minHeight: 44, display: "flex", alignItems: "center", gap: 6, padding: "0 16px", borderRadius: 12, fontWeight: 700, fontSize: "0.88rem", border: "2px solid", cursor: idx === 0 ? "not-allowed" : "pointer", background: idx === 0 ? "#f3f4f6" : "#fff", color: idx === 0 ? "#d1d5db" : "#374151", borderColor: idx === 0 ? "#e5e7eb" : "#d1d5db" }}><ChevronLeft size={18} /> Prev</button>
        {!isSyn && (q as ExamQuestion).contexts && (
          <button onClick={() => setup(idx)} title="New version" style={{ minHeight: 44, display: "flex", alignItems: "center", gap: 6, padding: "0 14px", borderRadius: 12, fontWeight: 700, fontSize: "0.82rem", border: `2px solid ${cfg.border}`, background: cfg.bg, color: cfg.color, cursor: "pointer" }}><RefreshCw size={15} /> New</button>
        )}
        <button onClick={() => nav(1)} disabled={idx === list.length - 1} style={{ minHeight: 44, display: "flex", alignItems: "center", gap: 6, padding: "0 16px", borderRadius: 12, fontWeight: 700, fontSize: "0.88rem", border: "2px solid", cursor: idx === list.length - 1 ? "not-allowed" : "pointer", background: idx === list.length - 1 ? "#f3f4f6" : "#1e3a8a", color: idx === list.length - 1 ? "#d1d5db" : "#fff", borderColor: idx === list.length - 1 ? "#e5e7eb" : "#1e3a8a" }}>Next <ChevronRight size={18} /></button>
      </div>
    </div>
  );
};
