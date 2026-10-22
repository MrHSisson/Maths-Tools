import type { Pic } from "../../tools/Interactive/WordsBingoData";

const INK = "#1e3a8a";        // navy outline
const FILL = "#dbeafe";        // light blue fill
const ACCENT = "#ea580c";      // highlighted part
const SHADE = "#38bdf8";       // shaded fraction part

type P = [number, number];
const pts = (a: P[]) => a.map(([x, y]) => `${x},${y}`).join(" ");

/** Little tick marks across the middle of a side, to show equal lengths. */
function Ticks({ a, b, n }: { a: P; b: P; n: number }) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  const nx = -uy, ny = ux;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const off = (i - (n - 1) / 2) * 7;
        const cx = mx + ux * off, cy = my + uy * off;
        return <line key={i} x1={cx - nx * 7} y1={cy - ny * 7} x2={cx + nx * 7} y2={cy + ny * 7} stroke={INK} strokeWidth={3} />;
      })}
    </>
  );
}

function Angle({ deg }: { deg: number }) {
  const O: P = [75, 95], L = 72, r = 26;
  const rad = (deg * Math.PI) / 180;
  const end: P = [O[0] + L * Math.cos(rad), O[1] - L * Math.sin(rad)];
  const arcEnd: P = [O[0] + r * Math.cos(rad), O[1] - r * Math.sin(rad)];
  const large = deg > 180 ? 1 : 0;
  return (
    <svg viewBox="0 0 190 190" style={{ display: "block", width: "100%", height: "100%" }}>
      {deg === 90 ? (
        <path d={`M ${O[0] + 20} ${O[1]} L ${O[0] + 20} ${O[1] - 20} L ${O[0]} ${O[1] - 20}`} fill="none" stroke={ACCENT} strokeWidth={4} />
      ) : (
        <path d={`M ${O[0] + r} ${O[1]} A ${r} ${r} 0 ${large} 0 ${arcEnd[0]} ${arcEnd[1]}`} fill="none" stroke={ACCENT} strokeWidth={4} />
      )}
      <line x1={O[0]} y1={O[1]} x2={O[0] + L} y2={O[1]} stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <line x1={O[0]} y1={O[1]} x2={end[0]} y2={end[1]} stroke={INK} strokeWidth={5} strokeLinecap="round" />
    </svg>
  );
}

function Poly({ n }: { n: number }) {
  const c: P = [100, 90], r = 70;
  const a = Array.from({ length: n }, (_, i) => {
    const t = -Math.PI / 2 + (2 * Math.PI * i) / n + (n === 8 ? Math.PI / n : 0);
    return [c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)] as P;
  });
  return (
    <svg viewBox="0 0 200 180" style={{ display: "block", width: "100%", height: "100%" }}>
      <polygon points={pts(a)} fill={FILL} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    </svg>
  );
}

function Tri({ k }: { k: "equilateral" | "isosceles" | "right" | "scalene" }) {
  const T: Record<string, P[]> = {
    equilateral: [[50, 135], [150, 135], [100, 48]],
    isosceles: [[65, 135], [135, 135], [100, 28]],
    right: [[50, 135], [150, 135], [50, 40]],
    scalene: [[35, 135], [165, 112], [92, 35]],
  };
  const t = T[k];
  return (
    <svg viewBox="0 0 200 170" style={{ display: "block", width: "100%", height: "100%" }}>
      <polygon points={pts(t)} fill={FILL} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {k === "equilateral" && <><Ticks a={t[0]} b={t[1]} n={1} /><Ticks a={t[1]} b={t[2]} n={1} /><Ticks a={t[2]} b={t[0]} n={1} /></>}
      {k === "isosceles" && <><Ticks a={t[1]} b={t[2]} n={1} /><Ticks a={t[2]} b={t[0]} n={1} /></>}
      {k === "right" && <path d="M 50 115 L 70 115 L 70 135" fill="none" stroke={ACCENT} strokeWidth={4} />}
    </svg>
  );
}

function Quad({ k }: { k: "square" | "rectangle" | "rhombus" | "kite" | "trapezium" | "parallelogram" }) {
  const Q: Record<string, P[]> = {
    square: [[60, 25], [140, 25], [140, 105], [60, 105]],
    rectangle: [[30, 35], [170, 35], [170, 105], [30, 105]],
    rhombus: [[100, 15], [160, 70], [100, 125], [40, 70]],
    kite: [[100, 12], [148, 58], [100, 135], [52, 58]],
    trapezium: [[65, 35], [135, 35], [175, 110], [25, 110]],
    parallelogram: [[60, 35], [170, 35], [140, 110], [30, 110]],
  };
  return (
    <svg viewBox="0 0 200 145" style={{ display: "block", width: "100%", height: "100%" }}>
      <polygon points={pts(Q[k])} fill={FILL} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    </svg>
  );
}

function Lines({ k }: { k: "parallel" | "perpendicular" }) {
  return (
    <svg viewBox="0 0 200 150" style={{ display: "block", width: "100%", height: "100%" }}>
      {k === "parallel" ? (
        <>
          <line x1={20} y1={50} x2={180} y2={50} stroke={INK} strokeWidth={5} strokeLinecap="round" />
          <line x1={20} y1={100} x2={180} y2={100} stroke={INK} strokeWidth={5} strokeLinecap="round" />
          {[50, 100].map(y => <polyline key={y} points={`92,${y - 9} 104,${y} 92,${y + 9}`} fill="none" stroke={ACCENT} strokeWidth={4} />)}
        </>
      ) : (
        <>
          <line x1={30} y1={110} x2={175} y2={110} stroke={INK} strokeWidth={5} strokeLinecap="round" />
          <line x1={75} y1={15} x2={75} y2={135} stroke={INK} strokeWidth={5} strokeLinecap="round" />
          <path d="M 75 90 L 95 90 L 95 110" fill="none" stroke={ACCENT} strokeWidth={4} />
        </>
      )}
    </svg>
  );
}

function CircleP({ part }: { part: "radius" | "diameter" | "circumference" }) {
  const c: P = [100, 80], r = 62;
  return (
    <svg viewBox="0 0 200 160" style={{ display: "block", width: "100%", height: "100%" }}>
      <circle cx={c[0]} cy={c[1]} r={r} fill={FILL} stroke={part === "circumference" ? ACCENT : INK} strokeWidth={part === "circumference" ? 9 : 5} />
      {part === "radius" && <line x1={c[0]} y1={c[1]} x2={c[0] + r} y2={c[1]} stroke={ACCENT} strokeWidth={6} strokeLinecap="round" />}
      {part === "diameter" && <line x1={c[0] - r} y1={c[1]} x2={c[0] + r} y2={c[1]} stroke={ACCENT} strokeWidth={6} strokeLinecap="round" />}
      <circle cx={c[0]} cy={c[1]} r={4} fill={INK} />
    </svg>
  );
}

function Bar({ num, den }: { num: number; den: number }) {
  const W = 360, H = 90, cw = W / den;
  return (
    <svg viewBox={`0 0 ${W + 8} ${H + 8}`} style={{ display: "block", width: "100%", height: "100%" }}>
      {Array.from({ length: den }, (_, i) => (
        <rect key={i} x={4 + i * cw} y={4} width={cw} height={H} fill={i < num ? SHADE : "#fff"} stroke={INK} strokeWidth={3} />
      ))}
    </svg>
  );
}

function Pie({ num, den }: { num: number; den: number }) {
  const c: P = [100, 100], r = 88;
  const at = (i: number): P => {
    const t = -Math.PI / 2 + (2 * Math.PI * i) / den;
    return [c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)];
  };
  return (
    <svg viewBox="0 0 200 200" style={{ display: "block", width: "100%", height: "100%" }}>
      {Array.from({ length: den }, (_, i) => {
        const a = at(i), b = at(i + 1);
        return <path key={i} d={`M ${c[0]} ${c[1]} L ${a[0]} ${a[1]} A ${r} ${r} 0 0 1 ${b[0]} ${b[1]} Z`} fill={i < num ? SHADE : "#fff"} stroke={INK} strokeWidth={3} strokeLinejoin="round" />;
      })}
    </svg>
  );
}

const HID = { stroke: INK, strokeWidth: 3, strokeDasharray: "7 6", fill: "none" };
const LINE = { stroke: INK, strokeWidth: 5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const TOP = "#eff6ff", SIDE = "#bfdbfe";

function Box({ x, y, w, h, dx, dy }: { x: number; y: number; w: number; h: number; dx: number; dy: number }) {
  return (
    <>
      <polygon points={pts([[x, y], [x + dx, y - dy], [x + w + dx, y - dy], [x + w, y]])} fill={TOP} {...LINE} />
      <polygon points={pts([[x + w, y], [x + w + dx, y - dy], [x + w + dx, y + h - dy], [x + w, y + h]])} fill={SIDE} {...LINE} />
      <rect x={x} y={y} width={w} height={h} fill={FILL} {...LINE} />
      <line x1={x} y1={y + h} x2={x + dx} y2={y + h - dy} {...HID} />
      <polyline points={`${x + dx},${y - dy} ${x + dx},${y + h - dy} ${x + w + dx},${y + h - dy}`} {...HID} />
    </>
  );
}

function Solid({ k }: { k: "cube" | "cuboid" | "cylinder" | "cone" | "sphere" | "pyramid" | "prism" }) {
  let body: JSX.Element;
  switch (k) {
    case "cube": body = <Box x={30} y={72} w={80} h={80} dx={38} dy={34} />; break;
    case "cuboid": body = <Box x={22} y={78} w={112} h={56} dx={42} dy={38} />; break;
    case "cylinder":
      body = (
        <>
          <path d="M 45 42 L 45 128 A 55 17 0 0 0 155 128 L 155 42" fill={FILL} {...LINE} />
          <ellipse cx={100} cy={42} rx={55} ry={17} fill={TOP} {...LINE} />
        </>
      );
      break;
    case "cone":
      body = (
        <>
          <path d="M 100 15 L 40 125 A 60 18 0 0 0 160 125 Z" fill={FILL} {...LINE} />
          <path d="M 40 125 A 60 18 0 0 1 160 125" {...HID} />
        </>
      );
      break;
    case "sphere":
      body = (
        <>
          <defs>
            <radialGradient id="wb-sphere" cx="35%" cy="30%" r="75%">
              <stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#93c5fd" />
            </radialGradient>
          </defs>
          <circle cx={100} cy={85} r={66} fill="url(#wb-sphere)" {...LINE} />
          <path d="M 34 85 A 66 20 0 0 0 166 85" fill="none" stroke={INK} strokeWidth={2.5} opacity={0.5} />
        </>
      );
      break;
    case "pyramid":
      body = (
        <>
          <polygon points="100,22 125,128 165,98" fill={SIDE} {...LINE} />
          <polygon points="100,22 35,128 125,128" fill={FILL} {...LINE} />
          <line x1={100} y1={22} x2={75} y2={98} {...HID} />
          <polyline points="35,128 75,98 165,98" {...HID} />
        </>
      );
      break;
    case "prism":
      body = (
        <>
          <polygon points="65,58 125,28 160,98 100,128" fill={SIDE} {...LINE} />
          <polygon points="30,128 100,128 65,58" fill={FILL} {...LINE} />
          <polyline points="30,128 90,98 160,98" {...HID} />
          <line x1={90} y1={98} x2={125} y2={28} {...HID} />
        </>
      );
      break;
  }
  return <svg viewBox="0 0 200 170" style={{ display: "block", width: "100%", height: "100%" }}>{body}</svg>;
}

function Wall() {
  const rows = [1, 2, 3, 4, 6], W = 360, H = 34;
  return (
    <svg viewBox={`0 0 ${W + 8} ${rows.length * H + 8}`} style={{ display: "block", width: "100%", height: "100%" }}>
      {rows.map((d, r) =>
        Array.from({ length: d }, (_, i) => (
          <rect key={`${r}-${i}`} x={4 + (i * W) / d} y={4 + r * H} width={W / d} height={H} fill={FILL} stroke={INK} strokeWidth={2.5} />
        )),
      )}
    </svg>
  );
}

function NumberLine() {
  return (
    <svg viewBox="0 0 400 90" style={{ display: "block", width: "100%", height: "100%" }}>
      <line x1={15} y1={40} x2={385} y2={40} stroke={INK} strokeWidth={4} strokeLinecap="round" />
      {Array.from({ length: 11 }, (_, i) => (
        <g key={i}>
          <line x1={25 + i * 35} y1={28} x2={25 + i * 35} y2={52} stroke={INK} strokeWidth={3} />
          <text x={25 + i * 35} y={80} textAnchor="middle" fontSize={20} fontWeight={600} fill={INK}>{i}</text>
        </g>
      ))}
    </svg>
  );
}

function PieChart() {
  const parts = [0.4, 0.25, 0.2, 0.15], cols = ["#38bdf8", "#fbbf24", "#34d399", "#f472b6"];
  const c: P = [100, 90], r = 76;
  let a0 = -Math.PI / 2;
  return (
    <svg viewBox="0 0 200 180" style={{ display: "block", width: "100%", height: "100%" }}>
      {parts.map((f, i) => {
        const a1 = a0 + 2 * Math.PI * f;
        const d = `M ${c[0]} ${c[1]} L ${c[0] + r * Math.cos(a0)} ${c[1] + r * Math.sin(a0)} A ${r} ${r} 0 ${f > 0.5 ? 1 : 0} 1 ${c[0] + r * Math.cos(a1)} ${c[1] + r * Math.sin(a1)} Z`;
        a0 = a1;
        return <path key={i} d={d} fill={cols[i]} stroke="#fff" strokeWidth={3} />;
      })}
    </svg>
  );
}

function BarChart() {
  const bars = [60, 95, 40, 80];
  return (
    <svg viewBox="0 0 200 150" style={{ display: "block", width: "100%", height: "100%" }}>
      <line x1={25} y1={15} x2={25} y2={125} stroke={INK} strokeWidth={4} />
      <line x1={25} y1={125} x2={185} y2={125} stroke={INK} strokeWidth={4} />
      {bars.map((h, i) => <rect key={i} x={38 + i * 37} y={125 - h} width={26} height={h} fill={SHADE} stroke={INK} strokeWidth={3} />)}
    </svg>
  );
}

function Tally({ n }: { n: number }) {
  const groups = Math.ceil(n / 5);
  return (
    <svg viewBox="0 0 200 110" style={{ display: "block", width: "100%", height: "100%" }}>
      {Array.from({ length: groups }, (_, g) => {
        const count = Math.min(5, n - g * 5), x0 = 25 + g * 80;
        return (
          <g key={g} stroke={INK} strokeWidth={5} strokeLinecap="round">
            {Array.from({ length: Math.min(count, 4) }, (_, i) => <line key={i} x1={x0 + i * 14} y1={20} x2={x0 + i * 14} y2={90} />)}
            {count === 5 && <line x1={x0 - 8} y1={78} x2={x0 + 56} y2={32} />}
          </g>
        );
      })}
    </svg>
  );
}

export function PicView({ p }: { p: Pic }) {
  switch (p.t) {
    case "angle": return <Angle deg={p.deg} />;
    case "poly": return <Poly n={p.n} />;
    case "tri": return <Tri k={p.k} />;
    case "quad": return <Quad k={p.k} />;
    case "lines": return <Lines k={p.k} />;
    case "circle": return <CircleP part={p.part} />;
    case "bar": return <Bar num={p.num} den={p.den} />;
    case "pie": return <Pie num={p.num} den={p.den} />;
    case "solid": return <Solid k={p.k} />;
    case "wall": return <Wall />;
    case "numberline": return <NumberLine />;
    case "piechart": return <PieChart />;
    case "barchart": return <BarChart />;
    case "tally": return <Tally n={p.n} />;
  }
}
