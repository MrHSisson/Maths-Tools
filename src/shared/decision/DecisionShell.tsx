import { useMemo, useState } from "react";
import { Home, ChevronLeft, ChevronRight, RefreshCw, FastForward, Rewind } from "lucide-react";
import type { DecisionProblem, DecisionShellProps, LegendItem, SolveStep } from "./types";
import NetworkView, { EDGE_STYLE, NODE_ROLE_STYLE } from "./representations/NetworkView";
import MatrixView from "./representations/MatrixView";

// ═══════════════════════════════════════════════════════════════════════════
// DecisionShell — full-canvas, navy-chrome shell for a Decision Maths question
// generator. Drives two modes off one <problem, solve>:
//   • Question  — the network + the prompt (+ the matrix, if config.questionMatrix).
//   • Solution  — a forward/back stepper over solve()'s SolveStep[], with the
//     network + matrix updating in sync, a caption + running total, and a
//     "show all" jump to the terminal state.
//
// Layout is the same in both modes so the network never jumps: the network
// canvas fills the left (with its colour key in a strip along its foot), a sidebar
// of cards on the right holds the words (prompt or step caption), the route so
// far and the matrix. Controls live in the bottom bar only — the canvas's zoom
// controls sit in its top-right corner, well away from Next. config.levels > 1 adds a level picker to the header.
// No print, no sandbox-expand yet (increments 3–4).
// ═══════════════════════════════════════════════════════════════════════════

type Mode = "question" | "solution";

const PAGE_BG = "#e2e8f0";
const CARD: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #cbd5e1",
  borderRadius: 14,
  boxShadow: "0 2px 10px rgba(15,23,42,0.08)",
};
const SIDEBAR_W = 440;

export default function DecisionShell({ generate, solve, config }: DecisionShellProps) {
  const levelCount = config.levels ?? 1;
  const [level, setLevel] = useState(1);
  const [problem, setProblem] = useState<DecisionProblem>(() => generate(1));
  const [mode, setMode] = useState<Mode>("question");
  const [stepIdx, setStepIdx] = useState(0);

  const steps = useMemo<SolveStep[]>(() => solve(problem), [problem, solve]);
  const idx = Math.min(stepIdx, steps.length - 1);
  const current = steps[idx];
  const last = steps.length - 1;
  const inSolution = mode === "solution";

  const newQuestion = (lv = level) => {
    setProblem(generate(lv));
    setStepIdx(0);
    setMode("question");
  };

  const goSolution = () => {
    setMode("solution");
    setStepIdx(0);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="bg-blue-900 shadow-lg flex-shrink-0">
        <div className="px-8 py-4 flex justify-between items-center">
          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors"
            style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 16, fontWeight: 600 }}
          >
            <Home size={22} color="#fff" />
            <span className="text-white font-semibold text-lg">Home</span>
          </button>
          <div className="text-white font-bold text-lg tracking-wide">{config.pageTitle}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {levelCount > 1 && (
              <div style={{ display: "flex", gap: 4, marginRight: 12 }}>
                {Array.from({ length: levelCount }, (_, i) => i + 1).map((lv) => (
                  <HeaderTab
                    key={lv}
                    active={level === lv}
                    title={config.levelLabels?.[lv - 1]}
                    onClick={() => {
                      setLevel(lv);
                      newQuestion(lv);
                    }}
                  >
                    Level {lv}
                  </HeaderTab>
                ))}
              </div>
            )}
            <HeaderTab active={!inSolution} onClick={() => setMode("question")}>Question</HeaderTab>
            <HeaderTab active={inSolution} onClick={goSolution}>Solution</HeaderTab>
          </div>
        </div>
      </div>

      {/* Body — network canvas left, sidebar of cards right */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, gap: 16, padding: 16, background: PAGE_BG }}>
        <div style={{ ...CARD, flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
            <NetworkView network={problem.network} step={inSolution ? current : undefined} interactive background="#ffffff" />
          </div>
          {inSolution && config.legend && <Legend items={config.legend} />}
        </div>

        <div style={{ width: SIDEBAR_W, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
          {inSolution ? (
            <StepCard step={current} idx={idx} count={steps.length} />
          ) : (
            <div style={{ ...CARD, padding: "16px 18px" }}>
              <SectionLabel>{config.instruction ?? "Question"}</SectionLabel>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", lineHeight: 1.45 }}>{problem.prompt}</div>
            </div>
          )}

          {inSolution && current.route && current.route.length > 0 && <RouteCard route={current.route} />}

          {(inSolution || config.questionMatrix) && (
            <div style={{ ...CARD, padding: "14px 16px", display: "flex", justifyContent: "center" }}>
              <MatrixView network={problem.network} step={inSolution ? current : undefined} bare />
            </div>
          )}

        </div>
      </div>

      {/* Bottom bar — every control lives here */}
      <div
        style={{
          flexShrink: 0,
          padding: "12px 24px",
          borderTop: "1px solid #cbd5e1",
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <SecondaryBtn onClick={() => newQuestion()}><RefreshCw size={16} /> New question</SecondaryBtn>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
          {inSolution ? (
            <>
              <SecondaryBtn onClick={() => setStepIdx(0)} disabled={idx === 0} title="Back to the start"><Rewind size={16} /></SecondaryBtn>
              <SecondaryBtn onClick={() => setStepIdx(Math.max(0, idx - 1))} disabled={idx === 0}>
                <ChevronLeft size={18} /> Back
              </SecondaryBtn>
              <div style={{ minWidth: 96, textAlign: "center", fontWeight: 700, color: "#475569", fontSize: 14 }}>
                Step {idx + 1} of {steps.length}
              </div>
              <PrimaryBtn onClick={() => setStepIdx(Math.min(last, idx + 1))} disabled={idx >= last}>
                Next <ChevronRight size={18} />
              </PrimaryBtn>
              <SecondaryBtn onClick={() => setStepIdx(last)} disabled={idx >= last}><FastForward size={16} /> Show all</SecondaryBtn>
            </>
          ) : (
            <PrimaryBtn onClick={goSolution}>Show solution <ChevronRight size={18} /></PrimaryBtn>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sidebar cards ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 8 }}>
      {children}
    </div>
  );
}

function StepCard({ step, idx, count }: { step: SolveStep; idx: number; count: number }) {
  return (
    <div style={{ ...CARD, padding: "16px 18px", borderLeft: "5px solid #1e3a8a" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        {step.phase && (
          <span style={{ background: "#e0e7ff", color: "#1e3a8a", fontWeight: 800, fontSize: 12, borderRadius: 999, padding: "3px 10px" }}>
            {step.phase}
          </span>
        )}
        <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
          Step {idx + 1} of {count}
        </span>
        {step.runningTotal !== undefined && (
          <span
            style={{
              marginLeft: "auto",
              background: "#dcfce7",
              border: "1px solid #86efac",
              color: "#15803d",
              borderRadius: 8,
              padding: "3px 10px",
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            Total {step.runningTotal}
          </span>
        )}
      </div>
      {/* Fixed minimum height so the cards below don't jump as captions change length. */}
      <div style={{ fontSize: 17, fontWeight: 500, color: "#0f172a", lineHeight: 1.5, minHeight: 78 }}>{step.caption}</div>
    </div>
  );
}

function RouteCard({ route }: { route: string[] }) {
  return (
    <div style={{ ...CARD, padding: "12px 16px" }}>
      <SectionLabel>Route so far</SectionLabel>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
        {route.map((v, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            {i > 0 && <span style={{ color: "#94a3b8", fontWeight: 700 }}>→</span>}
            <span
              style={{
                minWidth: 30,
                textAlign: "center",
                padding: "3px 8px",
                borderRadius: 8,
                fontWeight: 800,
                fontSize: 15,
                color: "#1e3a8a",
                background: i === route.length - 1 ? "#fef3c7" : "#f1f5f9",
                border: `1px solid ${i === route.length - 1 ? "#f59e0b" : "#cbd5e1"}`,
              }}
            >
              {v}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Legend({ items }: { items: LegendItem[] }) {
  return (
    <div style={{ flexShrink: 0, borderTop: "1px solid #e2e8f0", background: "#f8fafc", padding: "8px 16px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 16px" }}>
        {items.map((it) => (
          <div key={it.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#334155", fontWeight: 600, whiteSpace: "nowrap" }}>
            <Swatch kind={it.swatch} />
            {it.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function Swatch({ kind }: { kind: LegendItem["swatch"] }) {
  if (kind === "indirect")
    return <span style={{ width: 28, textAlign: "center", fontStyle: "italic", fontWeight: 700, color: "#1d4ed8" }}>12</span>;
  if (kind === "current" || kind === "visited") {
    const s = NODE_ROLE_STYLE[kind];
    return (
      <svg width={20} height={20} style={{ flexShrink: 0 }}>
        <circle cx={10} cy={10} r={8} fill={s.fill} stroke={s.stroke} strokeWidth={2.5} />
      </svg>
    );
  }
  const s = EDGE_STYLE[kind];
  return (
    <svg width={28} height={20} style={{ flexShrink: 0 }}>
      <line x1={2} y1={10} x2={26} y2={10} stroke={s.stroke} strokeWidth={s.width} strokeDasharray={s.dash} strokeLinecap="round" opacity={s.opacity} />
    </svg>
  );
}

// ── UI atoms ─────────────────────────────────────────────────────────────────
function HeaderTab({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: "8px 18px",
        borderRadius: 8,
        fontWeight: 700,
        fontSize: 14,
        border: "none",
        cursor: "pointer",
        background: active ? "#ffffff" : "rgba(255,255,255,0.15)",
        color: active ? "#1e3a8a" : "#e0e7ff",
      }}
    >
      {children}
    </button>
  );
}

function btnBase(disabled?: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 16px",
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 14,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
    border: "1px solid #cbd5e1",
  };
}

function PrimaryBtn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...btnBase(disabled), background: "#1e3a8a", color: "#fff", border: "1px solid #1e3a8a" }}>
      {children}
    </button>
  );
}

function SecondaryBtn({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} disabled={disabled} title={title} style={{ ...btnBase(disabled), background: "#ffffff", color: "#334155" }}>
      {children}
    </button>
  );
}
