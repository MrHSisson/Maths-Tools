import { useEffect, useRef, useState } from "react";
import { EXTENT, HALF_PI, INVERSE_SPECS, INVERSE_STAGES, K, PANEL, curveSegments, fold, keptPoints, phase } from "../shared/inverseTrig";
import type { DeckElement } from "./types";

type El = Extract<DeckElement, { kind: "inverseTrig" }>;
const INK = "#1e293b", AXIS = "#64748b", BLUE = "#1d4ed8", ORANGE = "#c2410c";
const STAGE_MS = 1300;

/** Runs the number `p` from where it is to `target` over time, so one click plays a smooth animation (and Back plays it in reverse). Where the slide is only
 *  being looked at (the editor, thumbnails, print) or the person prefers reduced motion, it jumps straight to the target. */
function useAnimatedStage(target: number, animate: boolean) {
  const [p, setP] = useState(target);
  const now = useRef(target);
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!animate || reduce) { now.current = target; setP(target); return; }
    let raf = 0, last = performance.now();
    const tick = (t: number) => {
      const step = (t - last) / STAGE_MS; last = t;
      const dir = Math.sign(target - now.current);
      now.current = Math.abs(target - now.current) <= step ? target : now.current + dir * step;
      setP(now.current);
      if (now.current !== target) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, animate]);
  return p;
}

const path = (pts: [number, number][], ox: number, oy: number) => pts.map(([x, y], i) => `${i ? "L" : "M"}${(ox + K * x).toFixed(1)} ${(oy - K * y).toFixed(1)}`).join(" ");

/** The tick labels both axes carry, so the swap of x and y shows: ±1, ±π/2 and ±π. */
const TICKS: { v: number; label: string }[] = [
  { v: 1, label: "1" }, { v: -1, label: "−1" }, { v: HALF_PI, label: "π/2" }, { v: -HALF_PI, label: "−π/2" }, { v: Math.PI, label: "π" }, { v: -Math.PI, label: "−π" },
];

function Axes({ ox, oy, opacity }: { ox: number; oy: number; opacity: number }) {
  const e = EXTENT * K;
  return (
    <g opacity={opacity} fontSize={26} fill={AXIS} stroke="none">
      <g stroke={AXIS} strokeWidth={3} fill="none">
        <path d={`M${ox - e} ${oy}H${ox + e}M${ox} ${oy + e}V${oy - e}`} />
        <path d={`M${ox + e - 14} ${oy - 9}L${ox + e} ${oy}L${ox + e - 14} ${oy + 9}M${ox - 9} ${oy - e + 14}L${ox} ${oy - e}L${ox + 9} ${oy - e + 14}`} />
        {TICKS.map(({ v }) => <path key={v} d={`M${ox + K * v} ${oy - 8}V${oy + 8}M${ox - 8} ${oy - K * v}H${ox + 8}`} strokeWidth={2.5} />)}
      </g>
      <text x={ox + e - 4} y={oy - 20} textAnchor="end" fontStyle="italic">x</text>
      <text x={ox + 22} y={oy - e + 12} fontStyle="italic">y</text>
      {TICKS.map(({ v, label }) => (
        <g key={v}>
          <text x={ox + K * v} y={oy + 40} textAnchor="middle">{label}</text>
          <text x={ox - 16} y={oy - K * v + 9} textAnchor="end">{label}</text>
        </g>
      ))}
    </g>
  );
}

/** y = sin x, cos x or tan x restricted to the part that has an inverse, reflected in y = x and separated into y = arcsin x, arccos x or arctan x, one click at a time.
 *  The whole drawing is laid out at full size from the first view; each click only changes opacity, the fold or a slide sideways, so nothing re-lays out. */
export function InverseTrigEl({ el, stage, live }: { el: El; stage: number; live: boolean }) {
  const target = Math.min(INVERSE_STAGES, Math.max(0, Number.isFinite(stage) ? stage : INVERSE_STAGES));
  const p = useAnimatedStage(target, live);
  const restrict = phase(p, 1), mirror = phase(p, 2), flip = phase(p, 3), split = phase(p, 4);
  const fn = el.fn, spec = INVERSE_SPECS[fn], name = fn;

  const W = el.w, H = el.h, oy = H / 2 + 60, mid = W / 2;
  const leftX = PANEL / 2 + 10, rightX = W - PANEL / 2 - 10;
  const mainX = mid + (leftX - mid) * split;        // the first axes slide left to make room
  const copyX = mid + (rightX - mid) * split;       // the reflected copy slides out to its own axes

  const whole = curveSegments(fn, -EXTENT, EXTENT, 600);
  const kept = keptPoints(fn);
  const folded = kept.map((pt) => fold(pt, flip));
  const asym: [number, number][][] = spec.asymptotes ? [-1, 1].map((s) => [[s * spec.dom[1], -EXTENT], [s * spec.dom[1], EXTENT]] as [number, number][]) : [];
  const foldedAsym = asym.map((line) => line.map((pt) => fold(pt, flip)));
  const diag = EXTENT * K;
  const hide = (a: number) => Math.max(0, Math.min(1, a));
  const [d0, d1] = spec.dom, [r0, r1] = spec.rng;
  const dot = (cx: number, cy: number, colour: string, k: number) => <circle key={k} cx={cx} cy={cy} r={11} fill={spec.closed ? colour : "#fff"} stroke={colour} strokeWidth={5} />;

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }} fontFamily="system-ui, sans-serif">
      {/* the first axes, and the second set that appears when the copy separates */}
      <Axes ox={mainX} oy={oy} opacity={1} />
      <Axes ox={rightX} oy={oy} opacity={split} />

      {/* the whole curve: solid at first, then only the part we keep stays bold */}
      {whole.map((seg, i) => <path key={i} d={path(seg, mainX, oy)} fill="none" stroke={BLUE} strokeWidth={5} strokeLinecap="round" opacity={1 - restrict * 0.8} strokeDasharray={restrict > 0.02 ? "14 12" : undefined} />)}
      {/* the kept part: drawn over it, bold, with its end points */}
      <g opacity={restrict}>
        <path d={path(kept, mainX, oy)} fill="none" stroke={BLUE} strokeWidth={9} strokeLinecap="round" />
        {spec.closed && [kept[0], kept[kept.length - 1]].map(([x, y], i) => dot(mainX + K * x, oy - K * y, BLUE, i))}
        {asym.map((line, i) => <path key={i} d={path(line, mainX, oy)} stroke={BLUE} strokeWidth={4} strokeDasharray="14 10" opacity={0.7} />)}
        <path d={`M${mainX + K * d0} ${oy}H${mainX + K * d1}`} stroke={BLUE} strokeWidth={10} strokeLinecap="round" opacity={0.55} />
        <path d={`M${mainX} ${oy - K * r0}V${oy - K * r1}`} stroke={BLUE} strokeWidth={10} strokeLinecap="round" opacity={0.35} />
      </g>

      {/* the mirror line y = x */}
      <g opacity={hide(mirror) * (1 - split)}>
        <path d={`M${mainX - diag} ${oy + diag}L${mainX + diag} ${oy - diag}`} stroke={INK} strokeWidth={4} strokeDasharray="16 12" />
        <text x={mainX + K * 2.2 + 18} y={oy - K * 2.2 - 14} fontSize={34} fill={INK} fontStyle="italic">y = x</text>
      </g>

      {/* the copy folding over the line, then sliding to its own axes (its points are relative to the first axes until it moves) */}
      <g opacity={flip > 0 ? 1 : 0}>
        <path d={path(folded, copyX, oy)} fill="none" stroke={ORANGE} strokeWidth={9} strokeLinecap="round" />
        {spec.closed && [folded[0], folded[folded.length - 1]].map(([x, y], i) => dot(copyX + K * x, oy - K * y, ORANGE, i))}
        {foldedAsym.map((line, i) => <path key={i} d={path(line, copyX, oy)} stroke={ORANGE} strokeWidth={4} strokeDasharray="14 10" opacity={0.7} />)}
        <g opacity={split} stroke={ORANGE} strokeWidth={10} strokeLinecap="round">
          <path d={`M${rightX + K * r0} ${oy}H${rightX + K * r1}`} opacity={0.55} />
          <path d={`M${rightX} ${oy - K * d0}V${oy - K * d1}`} opacity={0.35} />
        </g>
      </g>

      {/* captions */}
      <text x={mainX} y={44} textAnchor="middle" fontSize={40} fill={BLUE} fontWeight={600}>
        <tspan fontStyle="italic">y</tspan> = {name} <tspan fontStyle="italic">x</tspan>
      </text>
      <text x={mainX} y={92} textAnchor="middle" fontSize={32} fill={AXIS} opacity={restrict}>{spec.domCaption.replace("x", "\u0000").split("\u0000").flatMap((t, i, a) => i < a.length - 1 ? [t, <tspan key={i} fontStyle="italic">x</tspan>] : [t])}</text>
      <text x={rightX} y={44} textAnchor="middle" fontSize={40} fill={ORANGE} fontWeight={600} opacity={split}>
        <tspan fontStyle="italic">y</tspan> = arc{name} <tspan fontStyle="italic">x</tspan>
      </text>
      <text x={rightX} y={92} textAnchor="middle" fontSize={32} fill={AXIS} opacity={split}>{spec.invDomCaption.replace("x", "\u0000").split("\u0000").flatMap((t, i, a) => i < a.length - 1 ? [t, <tspan key={i} fontStyle="italic">x</tspan>] : [t])}</text>
    </svg>
  );
}
