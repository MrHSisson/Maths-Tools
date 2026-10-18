import type { ReactNode } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// Mini pictures for the Critical Path Analysis topic tiles: a small fixed activity network (Start, A, B, C, End) with the feature of each
// topic drawn on it (float, a missing value, a cascade strip, a histogram, a limit line, a clock…). Decorative only: every picture uses the
// same boxes, colours and strokes as the real tool, so the tiles read as a set. Exam-style tiles reuse their skill's picture with a marks badge.
// ═══════════════════════════════════════════════════════════════════════════

const NAVY = "#1e3a8a", GREY = "#94a3b8", BLUE = "#2563eb", ORANGE = "#ea580c", RED = "#dc2626", GREEN = "#16a34a", PURPLE = "#7c3aed", SKY = "#bae6fd", GREEN_FILL = "#bbf7d0";
const BW = 24, BH = 16;
const N: Record<string, [number, number]> = { S: [2, 32], A: [32, 10], B: [32, 54], C: [64, 32], E: [94, 32] };
const ARCS: Array<[string, string]> = [["S", "A"], ["S", "B"], ["A", "C"], ["B", "C"], ["C", "E"]];

const Arc = ({ a, b, c = GREY, w = 1.4 }: { a: string; b: string; c?: string; w?: number }) => {
  const [x1, y1] = N[a], [x2, y2] = N[b];
  const sx = x1 + BW, sy = y1 + BH / 2, ex = x2 - 1, ey = y2 + BH / 2;
  const dx = ex - sx, dy = ey - sy, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
  return (
    <g>
      <line x1={sx} y1={sy} x2={ex - ux * 3} y2={ey - uy * 3} stroke={c} strokeWidth={w} />
      <polygon points={`${ex},${ey} ${ex - ux * 4.5 - uy * 2.2},${ey - uy * 4.5 + ux * 2.2} ${ex - ux * 4.5 + uy * 2.2},${ey - uy * 4.5 - ux * 2.2}`} fill={c} />
    </g>
  );
};
const Cell = ({ x, y, t, c = "#0f172a" }: { x: number; y: number; t?: string; c?: string }) => (t ? <text x={x} y={y} textAnchor="middle" fontSize={6.4} fontWeight={700} fill={c}>{t}</text> : null);
const Bx = ({ id, es, mid, lf, tone = NAVY, fill = "#fff", dashed, label }: { id: string; es?: string; mid?: string; lf?: string; tone?: string; fill?: string; dashed?: boolean; label?: string }) => {
  const [x, y] = N[id];
  return (
    <g>
      <rect x={x} y={y} width={BW} height={BH} rx={1.5} fill={fill} stroke={tone} strokeWidth={1.2} strokeDasharray={dashed ? "2.5 2" : undefined} />
      <line x1={x} y1={y + 6} x2={x + BW} y2={y + 6} stroke={tone} strokeWidth={0.8} />
      <line x1={x + 8} y1={y + 6} x2={x + 8} y2={y + BH} stroke={tone} strokeWidth={0.8} />
      <line x1={x + 16} y1={y + 6} x2={x + 16} y2={y + BH} stroke={tone} strokeWidth={0.8} />
      <text x={x + BW / 2} y={y + 5} textAnchor="middle" fontSize={5.2} fontStyle="italic" fontWeight={700} fill={NAVY}>{label ?? id}</text>
      <Cell x={x + 4} y={y + 13} t={es} />
      <Cell x={x + 12} y={y + 13} t={mid} />
      <Cell x={x + 20} y={y + 13} t={lf} />
    </g>
  );
};
const net = (crit: string[] = [], opts: { arrowCrit?: boolean } = {}) => (
  <>
    {ARCS.map(([a, b]) => <Arc key={a + b} a={a} b={b} c={opts.arrowCrit && crit.includes(a) && crit.includes(b) ? GREEN : GREY} w={opts.arrowCrit && crit.includes(a) && crit.includes(b) ? 2.2 : 1.4} />)}
  </>
);
const Tag = ({ x, y, t, c = NAVY, s = 8 }: { x: number; y: number; t: string; c?: string; s?: number }) => <text x={x} y={y} textAnchor="middle" fontSize={s} fontWeight={700} fill={c}>{t}</text>;
const Pill = ({ x, y, t, c = PURPLE }: { x: number; y: number; t: string; c?: string }) => <g><rect x={x - 13} y={y - 6} width={26} height={9} rx={4.5} fill="#fff" stroke={c} strokeWidth={1} /><text x={x} y={y + 1} textAnchor="middle" fontSize={5.6} fontWeight={700} fill="#0f172a">{t}</text></g>;
const Axis = ({ x0 = 6, x1 = 114, y = 66 }: { x0?: number; x1?: number; y?: number }) => (
  <g>
    <line x1={x0} y1={y} x2={x1} y2={y} stroke="#334155" strokeWidth={1.4} />
    <line x1={x0} y1={8} x2={x0} y2={y} stroke="#334155" strokeWidth={1.4} />
    {[20, 40, 60, 80, 100].map((x) => <line key={x} x1={x} y1={8} x2={x} y2={y} stroke="#cbd5e1" strokeWidth={0.8} strokeDasharray="2 2.5" />)}
  </g>
);
const Table = ({ x, y, w = 36, filled = true }: { x: number; y: number; w?: number; filled?: boolean }) => (
  <g>
    <rect x={x} y={y} width={w} height={8} fill={NAVY} />
    {[1, 2, 3, 4].map((i) => <rect key={i} x={x} y={y + 8 * i} width={w} height={8} fill="#fff" stroke={NAVY} strokeWidth={1} />)}
    <line x1={x + w * 0.3} y1={y} x2={x + w * 0.3} y2={y + 40} stroke={NAVY} strokeWidth={1} />
    <line x1={x + w * 0.62} y1={y} x2={x + w * 0.62} y2={y + 40} stroke={NAVY} strokeWidth={1} />
    {filled && [1, 2, 3, 4].map((i) => <line key={i} x1={x + w * 0.7} y1={y + 8 * i + 4} x2={x + w * 0.92} y2={y + 8 * i + 4} stroke={GREY} strokeWidth={1.4} />)}
  </g>
);
const Bars = ({ blocks, h = 9, y0 = 66, scale = 8 }: { blocks: Array<{ x: number; w: number; y: number; hh?: number; tone?: string; fill?: string }>; h?: number; y0?: number; scale?: number }) => (
  <>{blocks.map((b, i) => <rect key={i} x={b.x} y={y0 - (b.y + (b.hh ?? 1)) * scale} width={b.w} height={(b.hh ?? 1) * scale - 0.5 + (h - 9)} fill={b.fill ?? SKY} stroke={b.tone ?? NAVY} strokeWidth={1.1} />)}</>
);

// the skill each exam-style tile borrows its picture from, and the marks badge it adds
const EXAM_OF: Record<string, [string, string]> = {
  exAsAny: ["full", "AS"], exBuild: ["network", "6"], exClaim: ["paths", "7"], exChange: ["change", "5"], exClock: ["clock", "9"], exMissing: ["unknown", "3"],
  exAlAny: ["level", "A"], exCascade: ["cascade", "8"], exTable: ["histogram", "10"], exHist: ["level", "7"], exShorten: ["shorten", "7"], exPick: ["pick", "1"], exAlloc: ["alloc", "10"],
};

function scene(key: string): ReactNode {
  switch (key) {
    case "network":
      return (
        <>
          <Table x={2} y={18} w={42} />
          <path d="M48 40 L58 40" stroke={GREY} strokeWidth={1.6} /><polygon points="62,40 56,36.5 56,43.5" fill={GREY} />
          <g transform="translate(60 0) scale(0.55)">{net()}{Object.keys(N).map((k) => <Bx key={k} id={k} dashed tone={BLUE} />)}</g>
          <g transform="translate(60 0) scale(0.55)" />
        </>
      );
    case "table":
      return (
        <>
          <g transform="translate(0 0) scale(0.62)">{net()}{Object.keys(N).map((k) => <Bx key={k} id={k} mid={k === "S" || k === "E" ? "0" : "4"} />)}</g>
          <path d="M66 40 L76 40" stroke={GREY} strokeWidth={1.6} /><polygon points="80,40 74,36.5 74,43.5" fill={GREY} />
          <Table x={82} y={18} w={36} />
        </>
      );
    case "forward":
      return <>{net()}<Bx id="S" es="0" mid="0" /><Bx id="A" es="0" mid="6" tone={BLUE} /><Bx id="B" es="0" mid="3" tone={BLUE} /><Bx id="C" es="6" mid="4" tone={BLUE} /><Bx id="E" es="10" mid="0" /><Tag x={110} y={14} t="→" c={BLUE} s={10} /></>;
    case "full":
      return <>{net(["S", "A", "C", "E"], { arrowCrit: true })}<Bx id="S" es="0" mid="0" lf="0" /><Bx id="A" es="0" mid="6" lf="6" tone={GREEN} fill={GREEN_FILL} /><Bx id="B" es="0" mid="3" lf="8" /><Bx id="C" es="6" mid="4" lf="10" tone={GREEN} fill={GREEN_FILL} /><Bx id="E" es="10" mid="0" lf="10" /></>;
    case "float":
      return <>{net()}<Bx id="S" es="0" mid="0" lf="0" /><Bx id="A" es="0" mid="6" lf="6" /><Bx id="B" es="0" mid="3" lf="8" /><Bx id="C" es="6" mid="4" lf="10" /><Bx id="E" es="10" mid="0" lf="10" /><Pill x={44} y={76} t="float 5" /><Tag x={110} y={14} t="−" c={PURPLE} s={10} /></>;
    case "paths":
      return <>{net(["S", "A", "C", "E"], { arrowCrit: true })}<Bx id="S" /><Bx id="A" tone={GREEN} fill={GREEN_FILL} /><Bx id="B" /><Bx id="C" tone={GREEN} fill={GREEN_FILL} /><Bx id="E" /></>;
    case "unknown":
      return <>{net()}<Bx id="S" es="0" mid="0" lf="0" /><Bx id="A" es="0" mid="6" lf="6" /><Bx id="B" es="0" mid="3" lf="8" /><Bx id="C" es="x" mid="4" lf="10" tone={ORANGE} /><Bx id="E" es="10" mid="0" lf="10" /><Tag x={76} y={62} t="x = ?" c={ORANGE} /></>;
    case "change":
      return <>{net(["S", "A", "C", "E"], { arrowCrit: true })}<Bx id="S" es="0" mid="0" lf="0" /><Bx id="A" es="0" mid="6" lf="6" tone={GREEN} fill={GREEN_FILL} /><Bx id="B" es="0" mid="3" lf="8" /><Bx id="C" es="6" mid="4" lf="10" tone={GREEN} fill={GREEN_FILL} /><Bx id="E" es="10" mid="0" lf="10" /><Tag x={20} y={56} t="+3" c={ORANGE} s={11} /><Tag x={76} y={14} t="C ⇢ 7" c={ORANGE} s={7} /></>;
    case "clock":
      return (
        <>
          <circle cx={36} cy={40} r={26} fill="#fff" stroke={NAVY} strokeWidth={2} />
          {[0, 90, 180, 270].map((a) => <line key={a} x1={36 + 21 * Math.sin((a * Math.PI) / 180)} y1={40 - 21 * Math.cos((a * Math.PI) / 180)} x2={36 + 24 * Math.sin((a * Math.PI) / 180)} y2={40 - 24 * Math.cos((a * Math.PI) / 180)} stroke={NAVY} strokeWidth={1.6} />)}
          <line x1={36} y1={40} x2={36} y2={24} stroke={NAVY} strokeWidth={2} /><line x1={36} y1={40} x2={48} y2={46} stroke={BLUE} strokeWidth={2} />
          <Tag x={92} y={36} t="18:30" c={NAVY} s={12} /><Tag x={92} y={52} t="+ 25 min" c={BLUE} s={8} />
        </>
      );
    case "reason":
      return (
        <>
          <path d="M8 10 h70 a6 6 0 0 1 6 6 v26 a6 6 0 0 1 -6 6 h-44 l-12 10 v-10 h-14 a6 6 0 0 1 -6 -6 v-26 a6 6 0 0 1 6 -6 z" fill="#fff" stroke={NAVY} strokeWidth={1.6} />
          {[20, 29, 38].map((y, i) => <line key={y} x1={16} y1={y} x2={i === 2 ? 50 : 72} y2={y} stroke={GREY} strokeWidth={2} strokeLinecap="round" />)}
          <rect x={86} y={14} width={28} height={14} rx={3} fill={GREEN} /><Tag x={100} y={24.5} t="E1" c="#fff" s={9} />
          <rect x={86} y={34} width={28} height={14} rx={3} fill="#b45309" /><Tag x={100} y={44.5} t="R1" c="#fff" s={9} />
        </>
      );
    case "reasonA":
      return (
        <>
          <path d="M8 10 h70 a6 6 0 0 1 6 6 v26 a6 6 0 0 1 -6 6 h-44 l-12 10 v-10 h-14 a6 6 0 0 1 -6 -6 v-26 a6 6 0 0 1 6 -6 z" fill="#fff" stroke={NAVY} strokeWidth={1.6} />
          <Tag x={43} y={38} t="?" c={ORANGE} s={26} />
          <rect x={88} y={20} width={24} height={14} rx={3} fill="#fff" stroke={NAVY} strokeWidth={1.4} /><line x1={92} y1={27} x2={108} y2={27} stroke={GREY} strokeWidth={2} />
          <text x={100} y={50} textAnchor="middle" fontSize={7} fontWeight={700} fill={NAVY}>model</text>
        </>
      );
    case "cascade":
      return (
        <>
          <Axis />
          {[[8, 22, 0, GREEN_FILL, GREEN], [30, 28, 0, GREEN_FILL, GREEN]].map(([x, w, , f, s], i) => <rect key={i} x={x as number} y={55} width={w as number} height={8} fill={f as string} stroke={s as string} strokeWidth={1.1} />)}
          <rect x={8} y={44} width={14} height={8} fill={SKY} stroke={NAVY} strokeWidth={1.1} /><rect x={22} y={44} width={28} height={8} fill="none" stroke={PURPLE} strokeWidth={1.1} strokeDasharray="3 2" />
          <rect x={30} y={33} width={20} height={8} fill={SKY} stroke={NAVY} strokeWidth={1.1} /><rect x={50} y={33} width={14} height={8} fill="none" stroke={PURPLE} strokeWidth={1.1} strokeDasharray="3 2" />
          <rect x={58} y={22} width={30} height={8} fill={SKY} stroke={NAVY} strokeWidth={1.1} /><rect x={88} y={22} width={10} height={8} fill="none" stroke={PURPLE} strokeWidth={1.1} strokeDasharray="3 2" />
          <rect x={58} y={55} width={36} height={8} fill={GREEN_FILL} stroke={GREEN} strokeWidth={1.1} />
        </>
      );
    case "histogram":
      return (
        <>
          <Axis />
          <Bars blocks={[
            { x: 8, w: 24, y: 0, hh: 2, tone: GREEN, fill: GREEN_FILL }, { x: 32, w: 22, y: 0, hh: 1, tone: GREEN, fill: GREEN_FILL }, { x: 54, w: 34, y: 0, hh: 2, tone: GREEN, fill: GREEN_FILL }, { x: 88, w: 20, y: 0, hh: 1, tone: GREEN, fill: GREEN_FILL },
            { x: 8, w: 24, y: 2, hh: 2 }, { x: 32, w: 40, y: 1, hh: 3 }, { x: 54, w: 20, y: 4, hh: 1 }, { x: 74, w: 14, y: 2, hh: 1 },
          ]} scale={9} />
        </>
      );
    case "level":
      return (
        <>
          <Axis />
          <Bars blocks={[
            { x: 8, w: 24, y: 0, hh: 2, tone: GREEN, fill: GREEN_FILL }, { x: 32, w: 22, y: 0, hh: 1, tone: GREEN, fill: GREEN_FILL }, { x: 54, w: 34, y: 0, hh: 2, tone: GREEN, fill: GREEN_FILL },
            { x: 8, w: 24, y: 2, hh: 1 }, { x: 32, w: 30, y: 1, hh: 2, tone: "#d97706", fill: "#fde68a" }, { x: 62, w: 26, y: 2, hh: 1 },
          ]} scale={10} />
          <line x1={6} y1={36} x2={114} y2={36} stroke={RED} strokeWidth={1.8} strokeDasharray="5 3" />
          <Tag x={106} y={32} t="limit" c={RED} s={6.5} />
        </>
      );
    case "alloc":
      return (
        <>
          <Axis />
          <text x={2} y={26} fontSize={5.5} fontWeight={700} fill={NAVY}>W2</text><text x={2} y={46} fontSize={5.5} fontWeight={700} fill={NAVY}>W1</text>
          <rect x={10} y={38} width={26} height={10} fill={GREEN_FILL} stroke={GREEN} strokeWidth={1.1} /><rect x={36} y={38} width={30} height={10} fill={GREEN_FILL} stroke={GREEN} strokeWidth={1.1} /><rect x={66} y={38} width={34} height={10} fill={GREEN_FILL} stroke={GREEN} strokeWidth={1.1} />
          <rect x={10} y={18} width={18} height={10} fill={SKY} stroke={NAVY} strokeWidth={1.1} /><rect x={40} y={18} width={22} height={10} fill={SKY} stroke={NAVY} strokeWidth={1.1} /><rect x={70} y={18} width={14} height={10} fill={SKY} stroke={NAVY} strokeWidth={1.1} />
        </>
      );
    case "shorten":
      return (
        <>
          <rect x={8} y={14} width={60} height={11} fill={GREEN_FILL} stroke={GREEN} strokeWidth={1.2} /><Tag x={38} y={22.5} t="E" c={NAVY} s={8} />
          <rect x={8} y={34} width={14} height={11} fill={GREEN_FILL} stroke={GREEN} strokeWidth={1.2} /><rect x={22} y={34} width={46} height={11} fill="none" stroke={ORANGE} strokeWidth={1.2} strokeDasharray="3 2" />
          <path d="M52 30 L52 33" stroke={ORANGE} strokeWidth={1.4} /><Tag x={92} y={43} t="→ 1" c={ORANGE} s={11} /><Tag x={92} y={22} t="15 h" c={NAVY} s={9} /><Tag x={92} y={60} t="14 h" c={GREEN} s={9} />
        </>
      );
    case "pick":
      return (
        <>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${i * 40} 6)`}>
              <rect x={1} y={2} width={36} height={46} rx={2} fill="#fff" stroke={i === 1 ? GREEN : "#cbd5e1"} strokeWidth={i === 1 ? 2 : 1.2} />
              <rect x={5} y={32} width={14} height={10} fill={GREEN_FILL} stroke={GREEN} strokeWidth={0.9} /><rect x={19} y={32} width={14} height={10} fill={GREEN_FILL} stroke={GREEN} strokeWidth={0.9} />
              <rect x={5} y={22} width={i === 2 ? 20 : 12} height={10} fill={SKY} stroke={NAVY} strokeWidth={0.9} /><rect x={i === 0 ? 5 : 19} y={i === 2 ? 12 : 22} width={14} height={10} fill={SKY} stroke={NAVY} strokeWidth={0.9} />
              <line x1={1} y1={i === 0 ? 14 : 22} x2={37} y2={i === 0 ? 14 : 22} stroke={RED} strokeWidth={1} strokeDasharray="3 2" />
              <Tag x={19} y={64} t={"ABC"[i]} c={i === 1 ? GREEN : NAVY} s={9} />
            </g>
          ))}
        </>
      );
    default:
      return <>{net()}{Object.keys(N).map((k) => <Bx key={k} id={k} />)}</>;
  }
}

export default function CpaTileArt({ k }: { k: string }) {
  const ex = EXAM_OF[k];
  return (
    <svg viewBox="0 0 120 80" className="w-full h-auto block" role="img" aria-hidden>
      {scene(ex ? ex[0] : k)}
      {ex && (
        <g>
          <rect x={90} y={0.5} width={29} height={14} rx={3} fill="#fff" stroke={ORANGE} strokeWidth={1.2} />
          <text x={104.5} y={10.8} textAnchor="middle" fontSize={8} fontWeight={800} fill={ORANGE}>{/^\d+$/.test(ex[1]) ? `[${ex[1]}]` : ex[1]}</text>
        </g>
      )}
    </svg>
  );
}
