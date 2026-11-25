import katex from "katex";
import { createElement, type ReactNode } from "react";
import type { DecisionProblem } from "../../shared/decision";
import { MechPicture } from "../../shared/mechanics";

// What a saved Work, Energy and Power question adds when it is printed (the shell's `skillPrint`): its diagram under the question, and the worked answer (each step's caption and its
// working lines) on the answers page. A question whose Diagram option is None or Blurred prints without a picture. (A .ts file, not .tsx: every .tsx under src/tools is a registered tool.)
const tex = (row: string): string => katex.renderToString(row.replace(/^=\s*/, "= "), { throwOnError: false });
const div = (props: Record<string, unknown>, ...children: ReactNode[]): ReactNode => createElement("div", props, ...children);

export const MC_PRINT = {
  figure: (p: DecisionProblem): ReactNode =>
    p.mech?.scene && p.mech.display !== "hidden" && p.mech.display !== "blurred" ? div({ style: { height: "62mm" } }, createElement(MechPicture, { scene: p.mech.scene, display: "given", view: { stage: "answer" }, size: "board" })) : null,
  working: (p: DecisionProblem): ReactNode =>
    p.mech
      ? div({ style: { fontSize: "8.5pt", color: "#334155" } },
        ...p.mech.steps.map((st, k) => div({ key: k },
          div({ style: { marginTop: "1mm", fontStyle: "italic", color: "#64748b" } }, st.caption),
          ...st.lines.map((l, j) => (l.startsWith("#") ? div({ key: j, style: { fontWeight: 600 } }, l.slice(1)) : div({ key: j, dangerouslySetInnerHTML: { __html: tex(l) } }))))))
      : null,
};
