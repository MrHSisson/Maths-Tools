// The picture of a Further Mechanics question in a DecisionShell tool: the diagram on top (given, built up as the working goes on, or absent) and the written
// working under it, a line at a time, the newest in blue. Rows are KaTeX rendered to strings and the layout is inline styles, so it prints.
import { useMemo, type ReactElement } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { MechPicture } from "./MechDiagram";
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

/** `step` is undefined at the question. */
export default function MechCanvas({ data, view }: { data: MechProblemData; view?: MechViewState }): ReactElement {
  const rows = useMemo(() => (view ? view.lines : data.known), [view, data.known]);
  const firstFresh = view ? rows.length - view.fresh : rows.length;
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", gap: 6, color: INK }}>
      {data.scene && data.display !== "hidden" && (
        <div style={{ flex: "1 1 55%", minHeight: 0, display: "flex", justifyContent: "center" }}>
          <div style={{ height: "100%", maxWidth: "100%", aspectRatio: `${data.scene.w} / ${data.scene.h}` }}>
            <MechPicture scene={data.scene} display={data.display} view={view ? (view.stage === "answer" ? { stage: "answer" } : { stage: "working", shown: view.shown }) : { stage: "question" }} size="board" />
          </div>
        </div>
      )}
      <div style={{ flex: "1 1 45%", minHeight: 0, overflow: "auto", padding: "2px 10px" }}>
        {!view && rows.length > 0 && <div style={{ fontSize: 12, fontWeight: 600, color: GIVEN }}>Given</div>}
        {/* the givens sit side by side so a question needs one line of them, not a column */}
        <div style={view ? undefined : { display: "flex", flexWrap: "wrap", columnGap: 22 }}>
          {rows.map((r, i) => <Row key={i} row={r} fresh={view ? i >= firstFresh : false} base={view ? INK : GIVEN} />)}
        </div>
      </div>
    </div>
  );
}
