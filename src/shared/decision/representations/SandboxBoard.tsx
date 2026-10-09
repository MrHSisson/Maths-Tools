import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Grid, Hash, RotateCcw, Table, X } from "lucide-react";
import type { CanvasExtras, DecisionProblem, DecisionShellProps, GNode, Network, SolveStep } from "../types";
import { flowBox } from "../cutCurve";
import FlowView from "./FlowView";
import MatrixView from "./MatrixView";
import NetworkView, { networkBox } from "./NetworkView";
import PanZoom from "./PanZoom";
import { questionView } from "../flowSolve";

// ═══════════════════════════════════════════════════════════════════════════
// The sandbox — the ONE place a Decision picture can be moved, zoomed and annotated.
//
// A question's picture is a fixed, display-optimised drawing (graphBank.ts / the flow templates) and never moves. The sandbox
// shows the SAME drawing — through the tool's own renderer, so a flow network keeps its circled flows, potentials and cut
// line — with vertices that can be dragged (the labels re-lay-out as they move), a pan / zoom frame, and a few display switches.
// It opens as an overlay over the question at the step the class is on (Back / Next here steps the working too), or stands
// alone as the Network Sandbox page, where any bank graph can be loaded.
// ═══════════════════════════════════════════════════════════════════════════

export const problemFromNetwork = (network: Network, prompt = ""): DecisionProblem => ({ network, prompt, answer: { text: "" }, matrixMode: "working" });

export interface SandboxBoardProps {
  problem: DecisionProblem;
  /** the working's beat to draw (omit for the question as given) */
  step?: SolveStep;
  /** the whole working, so the bar below the board can step it */
  steps?: SolveStep[];
  /** −1 = the question; 0… = a beat */
  idx?: number;
  onStep?: (i: number) => void;
  renderCanvas?: DecisionShellProps["renderCanvas"];
  matrixMissing?: string;
  /** extra controls at the top of the side panel (the standalone page's graph picker) */
  panelTop?: React.ReactNode;
  /** shown under the board (a tool's colour key) */
  footer?: React.ReactNode;
  /** the standalone page lets a weight be clicked and changed; a question's weights are fixed */
  onWeightChange?: (edgeId: string, weight: number) => void;
}

export default function SandboxBoard({ problem, step, steps, idx = -1, onStep, renderCanvas, matrixMissing, panelTop, footer, onWeightChange }: SandboxBoardProps) {
  const isFlow = !!problem.flow;
  const original = useMemo<GNode[]>(() => (problem.flow ? problem.flow.net.nodes : problem.network.nodes), [problem]);
  const [pos, setPos] = useState<Record<string, { x: number; y: number }>>({});
  const [weights, setWeights] = useState(true);
  const [editing, setEditing] = useState<{ id: string; value: string } | null>(null); // a weight being changed (standalone page)
  const [grid, setGrid] = useState(true);
  const hasMatrix = !isFlow && (problem.matrixMode ?? "off") !== "off";
  const [matrix, setMatrix] = useState(hasMatrix && problem.matrixMode === "question");
  const [narrow, setNarrow] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const on = () => setNarrow(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  // a different drawing (the standalone page loading another graph, a new question) starts from its own layout; a changed weight does not move anything
  const drawingKey = original.map((n) => `${n.id}:${n.x},${n.y}`).join("|");
  useEffect(() => { setPos({}); }, [drawingKey]);

  const nodes = useMemo<GNode[]>(() => original.map((n) => ({ ...n, ...(pos[n.id] ?? {}) })), [original, pos]);
  // the frame is taken from the ORIGINAL drawing and padded, so the picture keeps its size while a vertex is dragged outwards
  const box = useMemo(() => {
    const b = problem.flow ? flowBox(problem.flow.net) : networkBox(problem.network);
    return { x: b.x - 30, y: b.y - 30, w: b.w + 60, h: b.h + 60 };
  }, [problem]);

  const onNodeDown: CanvasExtras["onNodeDown"] = (id, e) => {
    e.stopPropagation(); // the frame must not pan
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;
    const toLogical = (cx: number, cy: number) => {
      const pt = svg.createSVGPoint();
      pt.x = cx; pt.y = cy;
      return pt.matrixTransform(svg.getScreenCTM()!.inverse());
    };
    const at = nodes.find((n) => n.id === id)!;
    const start = toLogical(e.clientX, e.clientY);
    const [dx, dy] = [start.x - at.x, start.y - at.y];
    const move = (ev: PointerEvent) => {
      const p = toLogical(ev.clientX, ev.clientY);
      setPos((prev) => ({ ...prev, [id]: { x: p.x - dx, y: p.y - dy } }));
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  const extras: CanvasExtras = { nodes, box, onNodeDown };
  const drawn = (() => {
    if (renderCanvas) return renderCanvas(problem, step, extras);
    if (problem.flow) {
      const d = problem.flow;
      return <FlowView net={{ ...d.net, nodes }} mode={d.mode} view={step?.flowView ?? questionView(problem)} labelPos={d.labelPos} frame={box} onNodeDown={onNodeDown} background="transparent" />;
    }
    // a beat that draws its own network (the complete network of least distances) is shown as it is: its vertices are not the question's, so they do not drag
    if (step?.network) return <NetworkView network={step.network} step={step} showWeights={weights} box={networkBox(step.network)} background="transparent" />;
    return <NetworkView network={{ ...problem.network, nodes }} step={step} showWeights={weights} box={box} onNodeDown={onNodeDown} onWeightClick={onWeightChange ? (id) => setEditing({ id, value: String(problem.network.edges.find((e) => e.id === id)?.weight ?? "") }) : undefined} background="transparent" />;
  })();

  const moved = Object.keys(pos).length > 0;
  const caption = step?.caption ?? problem.prompt;
  const last = (steps?.length ?? 0) - 1;

  const panel = (
    <div style={narrow ? { display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 10px", background: "#f5f3f0", borderBottom: "2px solid #d1d5db", alignItems: "center" } : { background: "#f5f3f0", flexShrink: 0, width: 210, overflow: "auto", display: "flex", flexDirection: "column", padding: 14, gap: 10, borderRight: "2px solid #d1d5db" }}>
      {panelTop}
      {!narrow && <Label>Display</Label>}
      {!isFlow && <Toggle icon={<Hash size={15} />} on={weights} onClick={() => setWeights((v) => !v)}>Weights</Toggle>}
      {hasMatrix && <Toggle icon={<Table size={15} />} on={matrix} onClick={() => setMatrix((v) => !v)}>Table</Toggle>}
      <Toggle icon={<Grid size={15} />} on={grid} onClick={() => setGrid((v) => !v)}>Grid</Toggle>
      {!narrow && <Label>Layout</Label>}
      <Toggle icon={<RotateCcw size={15} />} on={false} disabled={!moved} onClick={() => setPos({})}>Reset layout</Toggle>
      {!narrow && (
        <div style={{ marginTop: "auto", fontSize: 11.5, color: "#6b7280", lineHeight: 1.55 }}>
          Drag a vertex to move it · drag the background to pan · scroll or pinch to zoom. The question itself never moves — this is a copy to explore and annotate.
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, minWidth: 0, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ display: "flex", flexDirection: narrow ? "column" : "row", flex: 1, minHeight: 0 }}>
        {panel}
        <div style={{ flex: 1, position: "relative", minWidth: 0, minHeight: 0 }}>
          <PanZoom grid={grid} background="#f8fafc">{drawn}</PanZoom>
          {editing && onWeightChange && (
            <form
              onSubmit={(e) => { e.preventDefault(); const w = parseInt(editing.value, 10); if (Number.isFinite(w) && w >= 0 && w < 1000) onWeightChange(editing.id, w); setEditing(null); }}
              style={{ position: "absolute", left: "50%", top: 14, transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#fff", borderRadius: 12, boxShadow: "0 6px 24px rgba(15,23,42,0.18)", border: "1px solid #bfdbfe", zIndex: 5 }}
            >
              <span style={{ fontWeight: 700, color: "#1e3a8a" }}>Weight of {editing.id}</span>
              <input autoFocus type="number" min={0} max={999} value={editing.value} onChange={(e) => setEditing({ ...editing, value: e.target.value })} style={{ width: 70, padding: "4px 8px", border: "2px solid #d1d5db", borderRadius: 8, fontSize: 16, fontWeight: 700 }} />
              <button type="submit" style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: "#1e3a8a", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Set</button>
              <button type="button" onClick={() => setEditing(null)} style={{ padding: "5px 10px", borderRadius: 8, border: "2px solid #d1d5db", background: "#fff", color: "#475569", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
            </form>
          )}
          {matrix && hasMatrix && (
            <div style={{ position: "absolute", left: 12, top: 12, maxWidth: "calc(100% - 24px)", overflow: "auto", background: "#fff", borderRadius: 12, boxShadow: "0 6px 24px rgba(15,23,42,0.14)", border: "1px solid #e2e8f0", padding: 10 }}>
              <MatrixView network={problem.network} step={step} bare missing={matrixMissing} />
            </div>
          )}
        </div>
      </div>
      {footer && (
        <div style={{ flexShrink: 0, padding: "6px 12px", background: "#fff", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "4px 16px", fontSize: 12.5, color: "#334155", fontWeight: 600 }}>
          {footer}
        </div>
      )}
      {steps && onStep && (
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 12, padding: "10px 76px 10px 14px", background: "#fff", borderTop: "2px solid #d1d5db" }}>
          <StepBtn onClick={() => onStep(idx - 1)} disabled={idx < 0} title="Back"><ChevronLeft size={22} /></StepBtn>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.7, textTransform: "uppercase", color: "#9ca3af" }}>{idx < 0 ? "Question" : `Step ${Math.min(idx, last) + 1} of ${steps.length}`}</div>
            <div style={{ fontSize: narrow ? 13 : 15, fontWeight: 500, color: "#0f172a", lineHeight: 1.4, whiteSpace: "pre-line", maxHeight: narrow ? 74 : 92, overflowY: "auto", overflowWrap: "anywhere" }}>{caption}</div>
          </div>
          <StepBtn onClick={() => onStep(idx + 1)} disabled={idx >= last} title="Next" primary><ChevronRight size={22} /></StepBtn>
        </div>
      )}
    </div>
  );
}

/** The overlay a question opens: the sandbox over the whole page, with a way back. */
export function SandboxOverlay({ title, onClose, ...board }: SandboxBoardProps & { title: string; onClose: () => void }) {
  useEffect(() => {
    const on = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [onClose]);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 250, display: "flex", flexDirection: "column", background: "#f5f3f0" }} role="dialog" aria-label="Sandbox">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px", background: "#1e3a8a", color: "#fff", flexShrink: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 17 }}>Sandbox <span style={{ fontWeight: 500, opacity: 0.8 }}>· {title}</span></div>
        <button onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 10, border: "none", background: "rgba(255,255,255,0.14)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
          <X size={18} /> Back to the question
        </button>
      </div>
      <SandboxBoard {...board} />
    </div>
  );
}

// ── small atoms ───────────────────────────────────────────────────────────────
const Label = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>{children}</div>
);

function Toggle({ icon, on, onClick, disabled, children }: { icon: React.ReactNode; on: boolean; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "7px 10px", borderRadius: 8, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 8,
      border: on ? "2px solid #1e3a8a" : "2px solid #d1d5db", background: on ? "#dbeafe" : "#ffffff", color: on ? "#1e3a8a" : "#475569",
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1, width: "auto", textAlign: "left",
    }}>{icon}{children}</button>
  );
}

function StepBtn({ onClick, disabled, title, primary, children }: { onClick: () => void; disabled?: boolean; title: string; primary?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title} style={{
      width: 46, height: 46, borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1,
      border: primary ? "none" : "2px solid #d1d5db", background: primary ? "#1e3a8a" : "#fff", color: primary ? "#fff" : "#374151",
    }}>{children}</button>
  );
}
