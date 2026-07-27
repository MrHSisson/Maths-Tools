// ─────────────────────────────────────────────────────────────────────────────
// BoxSchematic — the generalised CpuDiagram. A data-driven SVG of labelled boxes
// that highlight, with an optional value token flowing between two boxes along a
// route. The layout (nodes, containers, annotations, buses, palette) comes from a
// SchematicConfig supplied by the topic; the animation/highlight behaviour lives
// here. See CS_SHELL_PLAN.md ("representations as data").
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import type { SchematicConfig, Flow } from "../types";

export const BoxSchematic = ({
  config, highlight, flow, flowKey,
}: {
  config: SchematicConfig;
  highlight?: string[];
  flow?: Flow;
  flowKey?: number;
}) => {
  const hl = highlight ?? [];
  const on = (id: string) => hl.includes(id);
  const dim = (id: string) => (hl.length && !on(id) ? 0.32 : 1);
  const nodeById = (id: string) => config.nodes.find(n => n.id === id);

  // animated token: sit at `from`, then transition to `to` one frame after mount
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!flow) return;
    setPhase(0);
    let r2 = 0;
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setPhase(1)); });
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
  }, [flowKey, flow]);

  return (
    <svg viewBox={config.viewBox} style={{ display: "block", width: "100%", height: "auto", maxWidth: config.maxWidth ?? 520, margin: "0 auto" }} preserveAspectRatio="xMidYMid meet">
      {/* buses — thicken/darken when an endpoint is hot */}
      {(config.buses ?? []).map((b, i) => {
        const hot = (b.hotWhen ?? []).some(on);
        return (
          <line key={`bus${i}`} x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2}
            stroke={hot ? (b.hotStroke ?? "#334155") : (b.coldStroke ?? "#cbd5e1")}
            strokeWidth={hot ? (b.hotWidth ?? 4) : (b.coldWidth ?? 3)} />
        );
      })}

      {/* grouping containers (dashed boundaries, e.g. the CPU box) */}
      {(config.containers ?? []).map((c, i) => (
        <g key={`cont${i}`}>
          <rect x={c.x} y={c.y} width={c.w} height={c.h} rx={c.rx ?? 12}
            fill="none" stroke={c.stroke ?? "#94a3b8"} strokeWidth={1.5}
            strokeDasharray={c.dashed === false ? undefined : "5 4"} />
          {c.label && (
            <text x={c.labelX ?? c.x + 12} y={c.labelY ?? c.y + 17} fontSize={c.labelSize ?? 13}
              fontWeight={800} fill={c.labelColor ?? "#334155"}>{c.label}</text>
          )}
        </g>
      ))}

      {/* free-standing annotations */}
      {(config.texts ?? []).map((t, i) => (
        <text key={`txt${i}`} x={t.x} y={t.y} fontSize={t.size ?? 9} fontWeight={t.weight ?? 700}
          fill={t.color ?? "#94a3b8"} textAnchor={t.anchor ?? "middle"} letterSpacing={t.letterSpacing}>
          {t.text}
        </text>
      ))}

      {/* nodes */}
      {config.nodes.map(p => {
        const c = config.roleColor[p.role];
        return (
          <g key={p.id} opacity={dim(p.id)} style={{ transition: "opacity 0.25s" }}>
            <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={7}
              fill={on(p.id) ? config.roleTint[p.role] : "#fff"} stroke={c} strokeWidth={on(p.id) ? 3 : 1.4} />
            <text x={p.x + p.w / 2} y={p.y + p.h / 2 + 1} fontSize={12} fontWeight={700}
              fill={c} textAnchor="middle" dominantBaseline="central">{p.label}</text>
          </g>
        );
      })}

      {/* animated value token travelling from → to */}
      {flow && (() => {
        const f = nodeById(flow.from), t = nodeById(flow.to);
        if (!f || !t) return null;
        const fx = f.x + f.w / 2, fy = f.y + f.h / 2;
        const dx = (t.x + t.w / 2) - fx, dy = (t.y + t.h / 2) - fy;
        const kind = flow.kind ?? "data";
        const col = config.roleColor[kind] ?? "#059669";
        const tint = config.roleTint[kind] ?? "#d1fae5";
        const w = 46, h = 20;
        return (
          <g style={{ transition: "transform 0.85s ease", transform: `translate(${phase ? dx : 0}px, ${phase ? dy : 0}px)` }}>
            <rect x={fx - w / 2} y={fy - h / 2} width={w} height={h} rx={6} fill={tint} stroke={col} strokeWidth={2} />
            <text x={fx} y={fy + 1} fontSize={10} fontWeight={800} fill={col} textAnchor="middle" dominantBaseline="central">{flow.label}</text>
          </g>
        );
      })()}
    </svg>
  );
};
