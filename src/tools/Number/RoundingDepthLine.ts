// The number line used by Rounding's Depth bank — same look as the tool's own diagram (blue number, amber halfway,
// green answer) but self-contained so the bank never imports the tool file (which imports the bank).
// Written with createElement (a .ts file) because every .tsx under src/tools is treated as a tool by the organisation test.

import { createElement as h, type ReactNode } from "react";

const X0 = 60, LW = 540, STEP = LW / 10, LY = 105;
const INK = "#1e293b", BLUE = "#2563eb", GREEN = "#166534", HALF = "#b45309";

export interface DepthLineSpec {
  lo: string;       // lower boundary label
  mid: string;      // halfway label
  hi: string;       // upper boundary label
  num: string;      // the number being rounded (label)
  pos: number;      // 0..1 — where it sits between lo and hi
}

const label = (x: number, text: string, fill: string, key?: string) =>
  h("text", { key, x, y: LY + 52, textAnchor: "middle", dominantBaseline: "middle", fontSize: 28, fontWeight: 700, fill }, text);

/** `onAnswer` shades the half the number sits in, marks halfway and rings the answer. */
export function depthLine(spec: DepthLineSpec, onAnswer: boolean): ReactNode {
  const mx = X0 + spec.pos * LW;
  const up = spec.pos >= 0.5;
  const ansX = X0 + (up ? LW : 0);
  const midX = X0 + 5 * STEP;
  const kids: ReactNode[] = [];
  if (onAnswer) {
    kids.push(h("rect", { key: "half", x: up ? midX : X0, y: LY - 30, width: 5 * STEP, height: 60, rx: 6, fill: "#16a34a", opacity: 0.14 }));
    kids.push(h("line", { key: "midl", x1: midX, y1: LY - 46, x2: midX, y2: LY + 22, stroke: HALF, strokeWidth: 3, strokeDasharray: "6 5" }));
    kids.push(h("text", { key: "midt", x: midX, y: LY - 54, textAnchor: "middle", fontSize: 20, fontWeight: 700, fill: HALF }, "halfway"));
  }
  kids.push(
    h("text", { key: "num", x: mx, y: 32, textAnchor: "middle", dominantBaseline: "middle", fontSize: 32, fontWeight: 700, fill: BLUE }, spec.num),
    h("line", { key: "stem", x1: mx, y1: 50, x2: mx, y2: LY - 16, stroke: BLUE, strokeWidth: 4 }),
    h("polygon", { key: "arrow", points: `${mx - 9},${LY - 22} ${mx + 9},${LY - 22} ${mx},${LY - 8}`, fill: BLUE }),
    h("line", { key: "axis", x1: X0 - 20, y1: LY, x2: X0 + LW + 20, y2: LY, stroke: INK, strokeWidth: 4, strokeLinecap: "round" }),
    ...Array.from({ length: 11 }, (_, i) => {
      const major = i % 5 === 0;
      const x = X0 + i * STEP;
      return h("line", { key: `t${i}`, x1: x, y1: LY - (major ? 18 : 10), x2: x, y2: LY + (major ? 18 : 10), stroke: INK, strokeWidth: major ? 4 : 2.5 });
    }),
    h("circle", { key: "dot", cx: mx, cy: LY, r: 7, fill: BLUE }),
    label(X0, spec.lo, INK, "lo"),
    label(X0 + LW, spec.hi, INK, "hi"),
  );
  if (onAnswer) {
    kids.push(label(midX, spec.mid, HALF, "mid"));
    kids.push(h("circle", { key: "ring", cx: ansX, cy: LY, r: 13, fill: "none", stroke: GREEN, strokeWidth: 4 }));
  }
  return h("svg", {
    viewBox: "0 0 660 190", style: { display: "block", width: "100%", height: "auto" }, preserveAspectRatio: "xMidYMid meet",
    role: "img", "aria-label": `Number line from ${spec.lo} to ${spec.hi} with ${spec.num} marked`,
  }, ...kids);
}
