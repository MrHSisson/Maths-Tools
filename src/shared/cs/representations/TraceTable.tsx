// ─────────────────────────────────────────────────────────────────────────────
// TraceTable — register/field contents shown row by row, updated one beat at a
// time. Generalised from the CPU trace lesson: the rows (fields + roles + a short
// "holds …" descriptor) and the role palette come from a TraceConfig supplied by
// the topic; the per-beat snapshot + hot highlighting are passed in as props.
// See docs/architecture/CS_SHELL_PLAN.md ("representations as data").
// ─────────────────────────────────────────────────────────────────────────────
import type { TraceConfig } from "../types";

export const TraceTable = ({
  config, snapshot, hot,
}: {
  config: TraceConfig;
  snapshot?: Record<string, string>;
  hot?: string[];
}) => {
  const snap = snapshot ?? {};
  const hotSet = new Set(hot ?? []);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: config.maxWidth ?? 440, margin: "0 auto" }}>
      {config.rows.map(r => {
        const c = config.roleColor[r.role]; const val = snap[r.key]; const isHot = hotSet.has(r.key);
        return (
          <div key={r.key} style={{ display: "grid", gridTemplateColumns: "48px 1fr 74px", alignItems: "center", gap: 8,
            background: isHot ? config.roleTint[r.role] : "#fff", border: `2px solid ${isHot ? c : "#e5e7eb"}`, borderRadius: 10, padding: "8px 10px", transition: "all 0.25s" }}>
            <span style={{ fontWeight: 800, fontSize: "0.9rem", color: c }}>{r.key}</span>
            <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#94a3b8" }}>holds {r.holds}</span>
            <span style={{ justifySelf: "stretch", textAlign: "center", fontWeight: 800, fontSize: "0.95rem",
              color: val ? c : "#cbd5e1", border: val ? `2px solid ${c}` : "2px dashed #e5e7eb", borderRadius: 8, padding: "3px 6px", transition: "all 0.25s" }}>
              {val ?? "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
};
