import { useMemo } from "react";
import type { MatrixCellState, Network, SolveStep } from "../types";

// ═══════════════════════════════════════════════════════════════════════════
// MatrixView — a PURE renderer of a Network's distance/adjacency matrix, with
// per-cell highlight/strike driven by an optional SolveStep. Seeded from the
// NetworkSandbox spike's matrix panel; generates nothing. A step may swap in its
// own `matrix` (e.g. a table of least distances being filled in) — entries marked
// indirect are routes via other vertices and render in italic blue.
// ═══════════════════════════════════════════════════════════════════════════

export interface MatrixViewProps {
  network: Network;
  step?: SolveStep;
  directed?: boolean;
  title?: string;
  /** Drop the card chrome (border/shadow/padding) — for a host that wraps it in its own card. */
  bare?: boolean;
}

const CELL_COLOR: Record<MatrixCellState, { fg: string; bg: string }> = {
  highlight: { fg: "#15803d", bg: "#dcfce7" },
  strike: { fg: "#b91c1c", bg: "#fee2e2" },
  considering: { fg: "#b45309", bg: "#fef3c7" },
  dim: { fg: "#cbd5e1", bg: "#f8fafc" },
};

const cellStyle = (head: boolean, diag: boolean, state?: MatrixCellState, indirect?: boolean): React.CSSProperties => ({
  border: "1px solid #cbd5e1",
  padding: "6px 10px",
  textAlign: "center",
  minWidth: 34,
  fontSize: 16,
  fontWeight: head ? 800 : 600,
  fontStyle: indirect ? "italic" : undefined,
  color: head ? "#1e3a8a" : diag ? "#cbd5e1" : state ? CELL_COLOR[state].fg : indirect ? "#1d4ed8" : "#334155",
  background: head ? "#e0e7ff" : state ? CELL_COLOR[state].bg : "#ffffff",
  textDecoration: state === "strike" || state === "dim" ? "line-through" : undefined,
  transition: "background 220ms, color 220ms",
});

export default function MatrixView({ network, step, directed = false, title = "Distance matrix", bare = false }: MatrixViewProps) {
  const ids = useMemo(() => network.nodes.map((n) => n.id).sort(), [network]);

  const matrix = useMemo(() => {
    if (step?.matrix) return step.matrix.values;
    const m: Record<string, Record<string, number | null>> = {};
    for (const a of ids) {
      m[a] = {};
      for (const b of ids) m[a][b] = null;
    }
    for (const e of network.edges) {
      m[e.from][e.to] = e.weight;
      if (!directed) m[e.to][e.from] = e.weight;
    }
    return m;
  }, [ids, network.edges, directed, step?.matrix]);

  const indirect = useMemo(() => new Set(step?.matrix?.indirect ?? []), [step?.matrix]);

  // cellId → state, from the current beat.
  const cellStates = useMemo(() => {
    const m: Record<string, MatrixCellState> = {};
    for (const c of step?.matrixCells ?? []) m[`${c.r}|${c.c}`] = c.state;
    return m;
  }, [step]);

  return (
    <div
      style={
        bare
          ? { display: "inline-block" }
          : {
              background: "#ffffff",
              borderRadius: 12,
              boxShadow: "0 6px 24px rgba(15,23,42,0.10)",
              border: "1px solid #e2e8f0",
              padding: 14,
              display: "inline-block",
            }
      }
    >
      <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 8 }}>
        {step?.matrixTitle ?? title}
      </div>
      <table style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={cellStyle(true, false)}></th>
            {ids.map((c) => (
              <th key={c} style={cellStyle(true, false)}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ids.map((r) => (
            <tr key={r}>
              <th style={cellStyle(true, false)}>{r}</th>
              {ids.map((c) => {
                const v = matrix[r]?.[c] ?? null;
                return (
                  <td key={c} style={cellStyle(false, r === c, cellStates[`${r}|${c}`], indirect.has(`${r}|${c}`))}>
                    {r === c ? "–" : v ?? ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
