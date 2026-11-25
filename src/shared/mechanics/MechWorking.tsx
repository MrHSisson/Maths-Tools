// The picture of a Further Mechanics question in a DecisionShell tool: the diagram on top (given, built up as the working goes on, or absent) and the written
// working under it, a line at a time, the newest in blue. Rows are KaTeX rendered to strings and the layout is inline styles, so it prints.
import { useEffect, useMemo, useState, type CSSProperties, type ReactElement } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import MechDiagram, { MechPicture } from "./MechDiagram";
import type { MechProblemData, MechViewState } from "./problem";

const INK = "#0f172a";
const NEW = "#1d4ed8";
const GIVEN = "#475569";

const tex = (s: string): string => {
  try { return katex.renderToString(s, { throwOnError: false, displayMode: false }); } catch { return s; }
};

function Row({ row, fresh, base }: { row: string; fresh: boolean; base: string }): ReactElement {
  if (row === "") return <div style={{ height: 6 }} />;
  if (row.startsWith("#")) return <div style={{ fontSize: 12, fontWeight: 600, color: GIVEN, marginTop: 4 }}>{row.slice(1)}</div>;
  return <div style={{ color: fresh ? NEW : base, fontSize: 19, lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: tex(row) }} />;
}

type RevealMode = "pending" | "full" | "build";

const pill: CSSProperties = { padding: "10px 18px", minHeight: 44, borderRadius: 12, border: "1px solid #cbd5e1", background: "#fff", color: INK, fontWeight: 600, fontSize: 15, boxShadow: "0 2px 8px rgba(15,23,42,.15)", cursor: "pointer" };
const BLUR: CSSProperties = { filter: "blur(10px)", opacity: 0.8, pointerEvents: "none", userSelect: "none" };

/** `step` is undefined at the question. A blurred question (the default) hides the picture and the givens until the student chooses: Reveal Full shows the whole picture,
 *  Build Diagram shows the givens and draws the picture up as the working goes on. Starting the working without choosing counts as Reveal Full. A new question blurs again. */
export default function MechCanvas({ data, view }: { data: MechProblemData; view?: MechViewState }): ReactElement {
  const rows = useMemo(() => (view ? view.lines : data.known), [view, data.known]);
  const firstFresh = view ? rows.length - view.fresh : rows.length;
  const [mode, setMode] = useState<RevealMode>("pending");
  useEffect(() => { setMode("pending"); }, [data]);
  const blurKind = data.display === "blurred" && !!data.scene;
  const hidden = blurKind && mode === "pending" && !view;
  const picStage = view ? (view.stage === "answer" ? ({ stage: "answer" } as const) : ({ stage: "working", shown: view.shown } as const)) : ({ stage: "question" } as const);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", gap: 6, color: INK }}>
      {data.scene && data.display !== "hidden" && (
        <div style={{ flex: "1 1 55%", minHeight: 0, display: "flex", justifyContent: "center" }}>
          <div style={{ position: "relative", height: "100%", maxWidth: "100%", aspectRatio: `${data.scene.w} / ${data.scene.h}` }}>
            <div style={hidden ? BLUR : undefined} aria-hidden={hidden || undefined}>
              {!blurKind
                ? <MechPicture scene={data.scene} display={data.display} view={picStage} size="board" />
                : mode === "build"
                  ? <MechPicture scene={data.scene} display="build" view={picStage} size="board" />
                  : <MechDiagram scene={data.scene} showAnswer={view?.stage === "answer"} size="board" />}
            </div>
            {hidden && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
                <button type="button" onClick={() => setMode("full")} style={pill}>Reveal Full</button>
                <button type="button" onClick={() => setMode("build")} style={pill}>Build Diagram</button>
              </div>
            )}
          </div>
        </div>
      )}
      <div style={{ flex: "1 1 45%", minHeight: 0, overflow: "auto", padding: "2px 10px" }}>
        <div style={hidden ? BLUR : undefined} aria-hidden={hidden || undefined}>
          {!view && rows.length > 0 && <div style={{ fontSize: 12, fontWeight: 600, color: GIVEN }}>Given</div>}
          {/* the givens sit side by side so a question needs one line of them, not a column */}
          <div style={view ? undefined : { display: "flex", flexWrap: "wrap", columnGap: 22 }}>
            {rows.map((r, i) => <Row key={i} row={r} fresh={view ? i >= firstFresh : false} base={view ? INK : GIVEN} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

/** The question stage's picture (the enlarged question) for a Further Mechanics tool: the diagram when it is shown in full (the Full Diagram switch), never a blurred or built one. */
export const MECH_STAGE = {
  hasFigure: (p: { mech?: MechProblemData }): boolean => p.mech?.display === "full" && !!p.mech.scene,
  figure: (p: { mech?: MechProblemData }): ReactElement | null => (p.mech?.scene ? <div style={{ maxWidth: 560, margin: "0 auto" }}><MechDiagram scene={p.mech.scene} size="board" /></div> : null),
};
