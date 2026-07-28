import { useMemo, useState } from "react";
import { Home, ChevronLeft, ChevronRight, RefreshCw, FastForward, Rewind } from "lucide-react";
import type { DecisionProblem, DecisionShellProps, SolveStep } from "./types";
import NetworkView from "./representations/NetworkView";
import MatrixView from "./representations/MatrixView";

// ═══════════════════════════════════════════════════════════════════════════
// DecisionShell (increment 1 — thin) — full-canvas, navy-chrome shell for a
// Decision Maths question generator. Drives two modes off one <problem, solve>:
//   • Question  — the network + the prompt.
//   • Solution  — a forward/back stepper over solve()'s SolveStep[], with the
//     network + matrix updating in sync, a caption + running total, and a
//     "show all" jump to the terminal state.
// No print, no sandbox-expand, no Prim yet (increments 2–4). Chrome borrowed
// from NetworkSandbox / AlgebraTiles.
// ═══════════════════════════════════════════════════════════════════════════

type Mode = "question" | "solution";

export default function DecisionShell({ generate, solve, config }: DecisionShellProps) {
  const [problem, setProblem] = useState<DecisionProblem>(() => generate(1));
  const [mode, setMode] = useState<Mode>("question");
  const [stepIdx, setStepIdx] = useState(0);

  const steps = useMemo<SolveStep[]>(() => solve(problem), [problem, solve]);
  const current = steps[Math.min(stepIdx, steps.length - 1)];

  const newQuestion = () => {
    setProblem(generate(1));
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
          <div style={{ display: "flex", gap: 8 }}>
            <HeaderTab active={mode === "question"} onClick={() => setMode("question")}>Question</HeaderTab>
            <HeaderTab active={mode === "solution"} onClick={goSolution}>Solution</HeaderTab>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", background: "#f8fafc" }}>
        {mode === "question" ? (
          <QuestionMode problem={problem} instruction={config.instruction} onNew={newQuestion} onSolve={goSolution} />
        ) : (
          <SolutionMode
            problem={problem}
            steps={steps}
            stepIdx={Math.min(stepIdx, steps.length - 1)}
            current={current}
            setStepIdx={setStepIdx}
            onNew={newQuestion}
          />
        )}
      </div>
    </div>
  );
}

// ── Question mode ────────────────────────────────────────────────────────────
function QuestionMode({
  problem,
  instruction,
  onNew,
  onSolve,
}: {
  problem: DecisionProblem;
  instruction?: string;
  onNew: () => void;
  onSolve: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
      <div style={{ padding: "18px 32px 8px", flexShrink: 0 }}>
        {instruction && <div style={{ fontSize: 14, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>{instruction}</div>}
        <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{problem.prompt}</div>
      </div>
      <div style={{ flex: 1, minHeight: 0, position: "relative", margin: "8px 24px 12px", borderRadius: 16, overflow: "hidden", border: "1px solid #e2e8f0" }}>
        <NetworkView network={problem.network} interactive />
      </div>
      <BottomBar>
        <SecondaryBtn onClick={onNew}><RefreshCw size={16} /> New question</SecondaryBtn>
        <PrimaryBtn onClick={onSolve}>Show solution <ChevronRight size={18} /></PrimaryBtn>
      </BottomBar>
    </div>
  );
}

// ── Solution mode ────────────────────────────────────────────────────────────
function SolutionMode({
  problem,
  steps,
  stepIdx,
  current,
  setStepIdx,
  onNew,
}: {
  problem: DecisionProblem;
  steps: SolveStep[];
  stepIdx: number;
  current: SolveStep;
  setStepIdx: (n: number | ((p: number) => number)) => void;
  onNew: () => void;
}) {
  const last = steps.length - 1;
  const atEnd = stepIdx >= last;
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
      {/* Network + matrix, side by side */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", gap: 12, padding: "12px 24px 0", overflow: "hidden" }}>
        <div style={{ flex: 1, minWidth: 0, position: "relative", borderRadius: 16, overflow: "hidden", border: "1px solid #e2e8f0", background: "#fff" }}>
          <NetworkView network={problem.network} step={current} interactive />
        </div>
        <div style={{ flexShrink: 0, display: "flex", alignItems: "flex-start", overflow: "auto" }}>
          <MatrixView network={problem.network} step={current} />
        </div>
      </div>

      {/* Caption + running total */}
      <div style={{ padding: "14px 32px 4px", flexShrink: 0, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ flex: 1, fontSize: 18, fontWeight: 600, color: "#0f172a", lineHeight: 1.4 }}>{current.caption}</div>
        {current.runningTotal !== undefined && (
          <div
            style={{
              flexShrink: 0,
              background: "#dcfce7",
              border: "1px solid #86efac",
              color: "#15803d",
              borderRadius: 10,
              padding: "8px 16px",
              fontWeight: 800,
              fontSize: 16,
            }}
          >
            Total: {current.runningTotal}
          </div>
        )}
      </div>

      {/* Stepper controls */}
      <BottomBar>
        <SecondaryBtn onClick={onNew}><RefreshCw size={16} /> New question</SecondaryBtn>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
          <SecondaryBtn onClick={() => setStepIdx(0)} disabled={stepIdx === 0}><Rewind size={16} /></SecondaryBtn>
          <SecondaryBtn onClick={() => setStepIdx((p) => Math.max(0, p - 1))} disabled={stepIdx === 0}>
            <ChevronLeft size={18} /> Back
          </SecondaryBtn>
          <div style={{ minWidth: 96, textAlign: "center", fontWeight: 700, color: "#475569", fontSize: 14 }}>
            Step {stepIdx + 1} of {steps.length}
          </div>
          <PrimaryBtn onClick={() => setStepIdx((p) => Math.min(last, p + 1))} disabled={atEnd}>
            Next <ChevronRight size={18} />
          </PrimaryBtn>
          <SecondaryBtn onClick={() => setStepIdx(last)} disabled={atEnd}><FastForward size={16} /> Show all</SecondaryBtn>
        </div>
      </BottomBar>
    </div>
  );
}

// ── UI atoms ─────────────────────────────────────────────────────────────────
function HeaderTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
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

function BottomBar({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        flexShrink: 0,
        padding: "12px 24px",
        borderTop: "1px solid #e2e8f0",
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      {children}
    </div>
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

function SecondaryBtn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...btnBase(disabled), background: "#ffffff", color: "#334155" }}>
      {children}
    </button>
  );
}
