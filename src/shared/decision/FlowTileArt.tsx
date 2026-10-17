import type { ReactNode } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// Mini pictures for the Network Flows topic tiles: one small fixed network (S, A, B, T) with the feature of each topic drawn on it
// (a cut line, an augmenting path, an added supersource…). Decorative only — every picture is the same network so the tiles read as a set.
// ═══════════════════════════════════════════════════════════════════════════

const NAVY = "#1e3a8a", GREY = "#94a3b8", BLUE = "#2563eb", ORANGE = "#ea580c", RED = "#dc2626", GREEN = "#16a34a";
const N: Record<string, [number, number]> = { S: [14, 40], A: [60, 14], B: [60, 66], T: [106, 40] };
const ARCS: Array<[string, string]> = [["S", "A"], ["S", "B"], ["A", "T"], ["B", "T"], ["A", "B"]];

const Arc = ({ a, b, c = GREY, w = 1.6, dash, head = true }: { a: string; b: string; c?: string; w?: number; dash?: boolean; head?: boolean }) => {
  const [x1, y1] = N[a], [x2, y2] = N[b];
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
  const ex = x2 - ux * 7, ey = y2 - uy * 7, sx = x1 + ux * 7, sy = y1 + uy * 7;
  return (
    <g>
      <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={c} strokeWidth={w} strokeDasharray={dash ? "3 2.5" : undefined} />
      {head && <polygon points={`${ex},${ey} ${ex - ux * 5 - uy * 2.6},${ey - uy * 5 + ux * 2.6} ${ex - ux * 5 + uy * 2.6},${ey - uy * 5 - ux * 2.6}`} fill={c} />}
    </g>
  );
};
const Node = ({ id, ring, label = id }: { id: string; ring?: string; label?: string }) => {
  const [x, y] = N[id];
  return <g><circle cx={x} cy={y} r={7} fill="#fff" stroke={ring ?? NAVY} strokeWidth={ring ? 2 : 1.4} /><text x={x} y={y + 3} textAnchor="middle" fontSize={8} fontWeight={700} fill={NAVY}>{label}</text></g>;
};
const Tag = ({ x, y, t, c = NAVY }: { x: number; y: number; t: string; c?: string }) => <text x={x} y={y} textAnchor="middle" fontSize={9} fontWeight={700} fill={c}>{t}</text>;
const Cut = ({ x, c = RED }: { x: number; c?: string }) => <line x1={x} y1={2} x2={x} y2={78} stroke={c} strokeWidth={1.8} strokeDasharray="4 3" />;

const base = (path: string[] = [], pc = BLUE, w = 2.6) => ARCS.map(([a, b]) => <Arc key={a + b} a={a} b={b} c={path.includes(a + b) ? pc : GREY} w={path.includes(a + b) ? w : 1.6} />);
const nodes = (ring?: Record<string, string>) => Object.keys(N).map((k) => <Node key={k} id={k} ring={ring?.[k]} />);

function scene(key: string): ReactNode {
  switch (key) {
    case "initialFind": return <>{base(["SA", "AT", "SB", "BT"])}{nodes()}</>;
    case "missingFlow": return <>{base()}{nodes()}<Tag x={31} y={22} t="?" c={ORANGE} /></>;
    case "potentials": return <>{base()}{nodes()}<Tag x={30} y={21} t="+3" c={GREEN} /><Tag x={30} y={62} t="−2" c={RED} /><Tag x={92} y={21} t="+1" c={GREEN} /></>;
    case "augment": return <>{base(["SA", "AB", "BT"], ORANGE, 3)}{nodes()}</>;
    case "nodeCap": return <>{base()}{nodes({ A: ORANGE })}<rect x={50} y={4} width={20} height={20} rx={5} fill="none" stroke={ORANGE} strokeWidth={1.6} strokeDasharray="3 2" /></>;
    case "cutValue": return <>{base()}<Cut x={83} />{nodes()}</>;
    case "cutTable": return <>{base()}<Cut x={37} /><Cut x={83} c={ORANGE} />{nodes()}</>;
    case "maxInspect": return <>{base(["SA", "AT", "SB", "BT"], GREEN, 3)}{nodes()}</>;
    case "maxCut": case "maxFlow": return <>{base(["SA", "AT", "SB", "BT"], GREEN, 3)}<Cut x={83} />{nodes()}</>;
    case "superAS": case "superST":
      return (
        <>
          <Arc a="S" b="A" /><Arc a="S" b="B" /><Arc a="A" b="T" /><Arc a="B" b="T" />
          <line x1={14} y1={40} x2={4} y2={22} stroke={BLUE} strokeWidth={2} strokeDasharray="3 2" /><line x1={14} y1={40} x2={4} y2={58} stroke={BLUE} strokeWidth={2} strokeDasharray="3 2" />
          {nodes()}<Tag x={5} y={19} t="S₁" c={BLUE} /><Tag x={5} y={69} t="S₂" c={BLUE} />
        </>
      );
    default: {
      const kind = key.replace("exam", "");
      const hl = kind === "Aug" || kind === "AugSuper" ? ["SA", "AB", "BT"] : [];
      return <>{base(hl, ORANGE, 3)}{(kind === "Cut" || kind === "Lower") && <Cut x={83} />}{kind === "Flow" && <Tag x={31} y={22} t="?" c={ORANGE} />}{nodes()}</>;
    }
  }
}

export default function FlowTileArt({ k }: { k: string }) {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-auto block" role="img" aria-hidden>
      {scene(k)}
    </svg>
  );
}
