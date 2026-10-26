// Perimeter & Area — the one renderer for every picture the tool draws.
import { useMemo, type CSSProperties } from "react";
import { boxOf, insideShape, type Pt } from "./model";
import { placePills, type PillIn, type Scene, type Seg } from "./labels";
import type { Drawing, Focus } from "./drawing";

const INK = "#4338ca", GIVEN = "#1e3a8a", FIND = "#b45309", DONE = "#166534", LIT = "#f59e0b";

interface Layout { W: number; H: number; sc: number; fs: number; fsC: number; capH: number; padX: number; padY: number; x0: number; y1: number; offX: number }

/** Size of the picture and where the model's coordinates land in it. Used by the renderer and by `_aspect` (print), so they can never drift. */
function layoutOf(d: Drawing, small: boolean): Layout {
  const pts: Pt[] = [...d.polys.flat(), ...d.helpers.flatMap((h) => [h.a, h.b])];
  if (d.grid) pts.push([d.grid.x0, d.grid.y0], [d.grid.x1, d.grid.y1]);
  const box = boxOf([pts]);
  const spanX = Math.max(box.x1 - box.x0, 1), spanY = Math.max(box.y1 - box.y0, 1);
  const target = small ? 170 : 380;
  let sc = Math.min(target / spanX, target / spanY);
  if (d.grid) sc = Math.min(sc, small ? 26 : 38);
  const fs = small ? 12 : 18, fsC = small ? 13 : 20;
  // room for the widest label to hang off a side and still sit inside the picture
  const widest = Math.max(1, ...d.edges.map((e) => Math.max(e.label.length, e.value?.length ?? 0)), ...d.helpers.map((h) => Math.max(h.label?.length ?? 0, h.value?.length ?? 0)));
  const reach = small ? 7 : 11;
  const padX = Math.max(small ? 44 : 66, widest * fs * 0.6 + fs * 1.3 + reach * 1.8);
  const padY = Math.max(small ? 30 : 46, fs * 1.6 + reach * 1.8);
  const capH = d.caption.length * fsC * 1.4 + (small ? 6 : 10);
  const capW = Math.max(0, ...d.caption.map((c) => c.length)) * fsC * 0.56 + 16;
  const W = Math.max(spanX * sc + padX * 2, capW);
  return { W, H: capH + spanY * sc + padY * 2, sc, fs, fsC, capH, padX, padY, x0: box.x0, y1: box.y1, offX: (W - spanX * sc) / 2 };
}
export const aspectOf = (d: Drawing): number => { const l = layoutOf(d, true); return l.W / l.H; };

/** Everything about the labels that is decided before drawing: which pills there are, where each goes, and the scene they were fitted to. */
export function labelPlan(d: Drawing, small: boolean, showAnswer: boolean, focus?: Focus) {
  const L = layoutOf(d, small);
  const X = (x: number) => L.offX + (x - L.x0) * L.sc;
  const Y = (y: number) => L.capH + L.padY + (L.y1 - y) * L.sc;
  const toModel = (px: number, py: number): Pt => [L.x0 + (px - L.offX) / L.sc, L.y1 - (py - L.capH - L.padY) / L.sc];
  const eps = 0.012 * Math.max(1, L.W / L.sc);
  const charW = L.fs * 0.6, pillH = L.fs * 1.6;
  const pillW = (text: string) => text.length * charW + L.fs * 1.3;
  const revealed = (i: number) => showAnswer || !!focus?.reveal?.includes(i);

  const labelOf = (i: number) => {
    const e = d.edges[i];
    if (e.kind === "plain") return e.label ? { text: e.label, color: GIVEN } : null;
    return revealed(i) ? { text: e.value ?? e.label, color: DONE } : { text: "?", color: FIND };
  };
  const items: PillIn[] = [];
  const pills: { i: number; text: string; color: string }[] = [];
  d.edges.forEach((e, i) => {
    const lab = labelOf(i);
    if (!lab) return;
    const dx = e.b[0] - e.a[0], dy = e.b[1] - e.a[1], len = Math.hypot(dx, dy) || 1;
    let nx = dy / len, ny = -dx / len;                                    // right-hand normal in model coordinates
    const mx = (e.a[0] + e.b[0]) / 2, my = (e.a[1] + e.b[1]) / 2;
    if (insideShape(mx + nx * eps, my + ny * eps, d.polys)) { nx = -nx; ny = -ny; }
    // sized for the longest thing it will say, so the pill does not hop about as a "?" becomes its value
    const widest = e.kind === "plain" ? lab.text : [lab.text, e.value ?? "", e.label ?? "?"].reduce((m, t) => (t.length > m.length ? t : m), "?");
    items.push({ ax: X(e.a[0]), ay: Y(e.a[1]), bx: X(e.b[0]), by: Y(e.b[1]), nx, ny: -ny, w: pillW(widest), h: pillH });
    pills.push({ i, text: lab.text, color: lab.color });
  });

  const shownHelpers = d.helpers.filter((h) => h.kind === "height" || h.kind === "extend" || h.always || focus?.helpers?.includes(h.id));
  const labelled = shownHelpers.filter((h) => h.label || h.find);
  const helperText = (h: (typeof labelled)[number]) => {
    const done = showAnswer || !!focus?.revealHelpers?.includes(h.id);
    return h.find ? (done ? (h.value ?? "") : "?") : (h.label ?? "");
  };
  labelled.forEach((h) => {
    const text = helperText(h);
    const widest = h.find ? [text, h.value ?? "", "?"].reduce((m, t) => (t.length > m.length ? t : m), "") : text;
    const ax = X(h.a[0]), ay = Y(h.a[1]), bx = X(h.b[0]), by = Y(h.b[1]), len = Math.hypot(bx - ax, by - ay) || 1;
    items.push({ ax, ay, bx, by, nx: (by - ay) / len, ny: -(bx - ax) / len, w: pillW(widest), h: pillH, free: true });
  });

  const segsOf = (loops: Pt[][]): Seg[] => loops.flatMap((p) => p.map((q, k) => { const r = p[(k + 1) % p.length]; return { x1: X(q[0]), y1: Y(q[1]), x2: X(r[0]), y2: Y(r[1]) }; }));
  const scene: Scene = {
    shape: segsOf(d.polys),
    helpers: shownHelpers.map((h) => ({ x1: X(h.a[0]), y1: Y(h.a[1]), x2: X(h.b[0]), y2: Y(h.b[1]) })),
    fixed: [],
    bounds: { x0: 1, y0: L.capH, x1: L.W - 1, y1: L.H - 1 },
    reach: small ? 7 : 11,
    cramp: small ? 3 : 5,
    inside: (px, py) => { const [x, y] = toModel(px, py); return insideShape(x, y, d.polys); },
  };
  const placed = placePills(items, scene);
  const spots = placed.slice(0, pills.length);
  const helperPills = labelled.map((h, k) => ({ h, text: helperText(h), rect: { x: placed[pills.length + k].x, y: placed[pills.length + k].y, w: pillW(helperText(h)), h: pillH }, lx: placed[pills.length + k].lx, ly: placed[pills.length + k].ly }));
  return { L, X, Y, pills, spots, helperPills, scene, charW, pillH, pillW };
}

interface Props { d: Drawing; showAnswer: boolean; small?: boolean; fillBox?: boolean; dataIndex?: number; focus?: Focus }

export function ShapeDiagram({ d, showAnswer, small = false, fillBox = false, dataIndex, focus }: Props) {
  const { L, X, Y, pills, spots, helperPills, pillH, pillW } = useMemo(() => labelPlan(d, small, showAnswer, focus), [d, small, showAnswer, focus]);
  const dim = !!focus?.edges;
  const lit = (i: number) => !!focus?.edges?.includes(i);

  const path = d.polys.map((p) => p.map((q, k) => `${k ? "L" : "M"} ${X(q[0])} ${Y(q[1])}`).join(" ") + " Z").join(" ");
  const sw = small ? 2 : 3;
  const tick = (a: Pt, b: Pt, n: number) => {
    const mx = (X(a[0]) + X(b[0])) / 2, my = (Y(a[1]) + Y(b[1])) / 2;
    const dx = X(b[0]) - X(a[0]), dy = Y(b[1]) - Y(a[1]), len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, px = -uy, py = ux, h = small ? 4 : 6, gapT = small ? 3.5 : 5;
    return Array.from({ length: n }, (_, k) => {
      const o = (k - (n - 1) / 2) * gapT;
      return <line key={k} x1={mx + ux * o - px * h} y1={my + uy * o - py * h} x2={mx + ux * o + px * h} y2={my + uy * o + py * h} stroke={INK} strokeWidth={small ? 1.5 : 2} />;
    });
  };
  const sq = small ? 7 : 11;
  const corner = ([p, v, q]: [Pt, Pt, Pt], k: number) => {
    const a = [X(p[0]) - X(v[0]), Y(p[1]) - Y(v[1])], b = [X(q[0]) - X(v[0]), Y(q[1]) - Y(v[1])];
    const la = Math.hypot(a[0], a[1]) || 1, lb = Math.hypot(b[0], b[1]) || 1;
    const ax = (a[0] / la) * sq, ay = (a[1] / la) * sq, bx = (b[0] / lb) * sq, by = (b[1] / lb) * sq;
    const vx = X(v[0]), vy = Y(v[1]);
    return <path key={k} d={`M ${vx + ax} ${vy + ay} L ${vx + ax + bx} ${vy + ay + by} L ${vx + bx} ${vy + by}`} fill="none" stroke={INK} strokeWidth={small ? 1.2 : 1.6} />;
  };
  const pill = (x: number, y: number, text: string, color: string, opacity = 1, key?: string | number) => {
    const w = pillW(text);
    return (
      <g key={key} opacity={opacity}>
        <rect x={x - w / 2} y={y - pillH / 2} width={w} height={pillH} rx={pillH / 2} fill="white" stroke="#94a3b8" strokeWidth={1.2} />
        <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={L.fs} fontWeight={700} fill={color}>{text}</text>
      </g>
    );
  };

  const shownRegions = d.regions.filter((r) => r.always || focus?.regions?.includes(r.id));
  const shownHelpers = d.helpers.filter((h) => h.kind === "height" || h.kind === "extend" || h.always || focus?.helpers?.includes(h.id));
  const extra = dataIndex !== undefined ? { "data-q-index": dataIndex } : {};
  const style: CSSProperties = { display: "block", overflow: "visible", width: "100%", height: fillBox ? "100%" : "auto" };

  return (
    <svg viewBox={`0 0 ${L.W} ${L.H}`} style={style} {...extra}>
      {d.caption.map((c, i) => (
        <text key={i} x={L.W / 2} y={L.fsC * 1.3 * (i + 1) + (i ? 2 : 0)} textAnchor="middle" fontSize={L.fsC} fontWeight={i === d.caption.length - 1 ? 700 : 500} fill="#1e293b">{c}</text>
      ))}
      {d.grid && (() => {
        const g = d.grid;
        const lines = [];
        for (let x = g.x0; x <= g.x1; x++) lines.push(<line key={`x${x}`} x1={X(x)} y1={Y(g.y0)} x2={X(x)} y2={Y(g.y1)} stroke="#cbd5e1" strokeWidth={1} />);
        for (let y = g.y0; y <= g.y1; y++) lines.push(<line key={`y${y}`} x1={X(g.x0)} y1={Y(y)} x2={X(g.x1)} y2={Y(y)} stroke="#cbd5e1" strokeWidth={1} />);
        return <g>{lines}</g>;
      })()}
      <path d={path} fill={d.grid ? "rgba(165,180,252,0.55)" : "#e0e7ff"} fillRule="evenodd" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      {shownRegions.map((r) => {
        const b = boxOf([r.pts]);
        return (
          <g key={r.id}>
            <path d={r.pts.map((q, k) => `${k ? "L" : "M"} ${X(q[0])} ${Y(q[1])}`).join(" ") + " Z"} fill={r.color} fillOpacity={0.55} stroke={INK} strokeWidth={1.2} strokeDasharray="5 3" />
            {r.text && <text x={X((b.x0 + b.x1) / 2)} y={Y((b.y0 + b.y1) / 2)} textAnchor="middle" dominantBaseline="central" fontSize={L.fs * 1.2} fontWeight={700} fill="#1e293b">{r.text}</text>}
          </g>
        );
      })}
      {shownHelpers.map((h) => (
        <line key={h.id} x1={X(h.a[0])} y1={Y(h.a[1])} x2={X(h.b[0])} y2={Y(h.b[1])} stroke={focus?.helpers?.includes(h.id) ? LIT : h.kind === "box" ? INK : "#475569"} strokeWidth={focus?.helpers?.includes(h.id) ? 3.5 : 1.6} strokeDasharray="6 4" opacity={focus?.helpers && !focus.helpers.includes(h.id) ? 0.45 : 1} />
      ))}
      {d.edges.map((e, i) => lit(i) && <line key={`l${i}`} x1={X(e.a[0])} y1={Y(e.a[1])} x2={X(e.b[0])} y2={Y(e.b[1])} stroke={LIT} strokeWidth={small ? 4 : 6} strokeLinecap="round" />)}
      {d.edges.map((e, i) => e.ticks ? <g key={`t${i}`}>{tick(e.a, e.b, e.ticks)}</g> : null)}
      {d.corners.map(corner)}
      {pills.map((p, k) => Math.hypot(spots[k].x - spots[k].lx, spots[k].y - spots[k].ly) < 2 ? null : (
        <line key={`d${p.i}`} x1={spots[k].lx} y1={spots[k].ly} x2={spots[k].x} y2={spots[k].y} stroke="#64748b" strokeWidth={small ? 1 : 1.4} strokeDasharray="3 3" opacity={dim && !lit(p.i) && !focus?.reveal?.includes(p.i) ? 0.3 : 0.85} />
      ))}
      {pills.map((p, k) => pill(spots[k].x, spots[k].y, p.text, p.color, dim && !lit(p.i) && !focus?.reveal?.includes(p.i) ? 0.35 : 1, `p${p.i}`))}
      {helperPills.map((p) => Math.hypot(p.rect.x - p.lx, p.rect.y - p.ly) > Math.max(p.rect.w, p.rect.h) / 2 + 6 && (
        <line key={`hd${p.h.id}`} x1={p.lx} y1={p.ly} x2={p.rect.x} y2={p.rect.y} stroke="#64748b" strokeWidth={small ? 1 : 1.4} strokeDasharray="3 3" opacity={0.85} />
      ))}
      {helperPills.map((p) => pill(p.rect.x, p.rect.y, p.text, p.h.find ? (p.text === "?" ? FIND : DONE) : GIVEN, 1, `h${p.h.id}`))}
    </svg>
  );
}
