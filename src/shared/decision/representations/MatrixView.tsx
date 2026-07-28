import { useMemo } from "react";
import type { Network, SolveStep } from "../types";

// ═══════════════════════════════════════════════════════════════════════════
// MatrixView — a PURE renderer of a Network's distance/adjacency matrix, with
// per-cell highlight/strike driven by an optional SolveStep. Seeded from the
// NetworkSandbox spike's matrix panel; generates nothing.
// ═══════════════════════════════════════════════════════════════════════════

export interface MatrixViewProps {
  network: Network;
  step?: SolveStep;
  directed?: boolean;
  title?: string;
}

const cellStyle = (head: boolean, diag: boolean, state?: "highlight" | "strike"): React.CSSProperties => ({
  border: "1px solid #e2e8f0",
  padding: "5px 10px",
  textAlign: "center",
  minWidth: 28,
  fontWeight: head ? 800 : 600,
  color: head ? "#1e3a8a" : diag ? "#cbd5e1" : state === "strike" ? "#b91c1c" : state === "highlight" ? "#15803d" : "#334155",
  background: head ? "#f1f5f9" : state === "highlight" ? "#dcfce7" : state === "strike" ? "#fee2e2" : "#ffffff",
  textDecoration: state === "strike" ? "line-through" : undefined,
  transition: "background 220ms, color 220ms",
});

export default function MatrixView({ network, step, directed = false, title = "Distance matrix" }: MatrixViewProps) {
  const ids = useMemo(() => network.nodes.map((n) => n.id).sort(), [network]);

  const matrix = useMemo(() => {
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
  }, [ids, network.edges, directed]);

  // cellId → state, from the current beat.
  const cellStates = useMemo(() => {
    const m: Record<string, "highlight" | "strike"> = {};
    for (const c of step?.matrixCells ?? []) m[`${c.r}|${c.c}`] = c.state;
    return m;
  }, [step]);

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 12,
        boxShadow: "0 6px 24px rgba(15,23,42,0.10)",
        border: "1px solid #e2e8f0",
        padding: 14,
        display: "inline-block",
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
        {title}
      </div>
      <table style={{ borderCollapse: "collapse", fontSize: 14 }}>
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
                const v = matrix[r][c];
                return (
                  <td key={c} style={cellStyle(false, r === c, cellStates[`${r}|${c}`])}>
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
