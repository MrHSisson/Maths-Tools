import type { CSSProperties } from "react";
import type { DecisionProblem, LpRow, SolveStep } from "./types";
import WorkingPage, { Newest } from "./WorkingPage";
import { Prose, Row } from "./LpWorking";
import LpGraphPicture, { type GraphView } from "./LpGraphPicture";

// The picture of a Graphical LP question: the graph (LpGraphPicture) at the top, drawn a piece at a time as the steps go, and the written working under it, the newest
// rows in blue. The key under the graph holds the equations, so the graph itself stays clean. The graph's size never changes as it fills.

const INK = "#0f172a";
// the graph stays in view while the working scrolls: pinned above the working on a narrow panel (a phone), and beside it on a wide one (laptop, tablet landscape)
const SPLIT = `.gx-wrap{display:flex;flex-direction:column;gap:.6em}
.gx-pic{position:sticky;top:0;z-index:2;background:#fff;padding:2px 0 6px}
.gx-pic svg{max-height:36vh !important}
.gx-rows{min-width:0}
@container (min-width: 600px){
.gx-wrap{flex-direction:row;align-items:flex-start;gap:1.2em}
.gx-pic{flex:none;width:60%;top:8px}
.gx-pic svg{max-height:none !important}
.gx-rows{flex:1;font-size:.84em}}`;

function viewOf(p: DecisionProblem, step: SolveStep | undefined, all?: boolean): GraphView | undefined {
  const d = p.gx;
  if (!d) return undefined;
  const v = step?.gxView;
  return {
    lines: d.lines, shading: d.shading, win: d.win, grid: true,
    drawn: all ? d.lines.length : v?.drawn ?? 0,
    shaded: all ? d.lines.length : v?.shaded ?? 0,
    region: all ? true : v?.region ?? false,
    vertices: all ? d.vertices : v ? d.vertices.slice(0, v.vertices) : undefined,
    labels: all ? "always" : "hover",
  };
}

export default function GxCanvas({ p, step }: { p: DecisionProblem; step: SolveStep | undefined }) {
  const view = viewOf(p, step);
  if (!view) return null;
  const v = step?.gxView;
  const rows: LpRow[] = v ? v.rows : [];
  const fresh = v?.fresh ?? 0;
  const old = rows.slice(0, rows.length - fresh), added = rows.slice(rows.length - fresh);
  const col: CSSProperties = { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.5em" };
  return (
    <WorkingPage watch={`${p.prompt}|${rows.length}`} heading="Your graph and working" hint={!v ? "Your graph and working build up here, one step at a time." : undefined}>
      <style>{SPLIT}</style>
      <div className="gx-wrap">
        <div className="gx-pic"><LpGraphPicture view={view} /></div>
        <div className="gx-rows" style={{ ...col, color: INK }}>
          {old.map((r, i) => <Row key={i} r={r} fresh={false} big={r.k === "tex"} />)}
          {added.length > 0 && <Newest><div style={col}>{added.map((r, i) => <Row key={old.length + i} r={r} fresh big={r.k === "tex"} />)}</div></Newest>}
        </div>
      </div>
    </WorkingPage>
  );
}

/** the whole solution as one open page (the phone): the finished graph first, then the working */
export function GxSolution({ p, steps }: { p: DecisionProblem; steps: SolveStep[] }) {
  const view = viewOf(p, undefined, true);
  return (
    <div className="flex flex-col gap-5">
      {view && <LpGraphPicture view={view} />}
      {steps.map((st, i) => {
        const v = st.gxView;
        const added = v && v.fresh ? v.rows.slice(v.rows.length - v.fresh) : [];
        return (
          <div key={i}>
            <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.45, marginBottom: 4 }}><Prose text={st.caption} /></div>
            <div className="flex flex-col gap-2 items-start" style={{ fontSize: 17, color: INK }}>{added.map((r, j) => <Row key={j} r={r} fresh={false} big={r.k === "tex"} />)}</div>
          </div>
        );
      })}
    </div>
  );
}

/** on paper: the blank axes the student draws on, under the question */
export function GxPrintFigure({ p }: { p: DecisionProblem }) {
  const d = p.gx;
  if (!d) return null;
  return <div style={{ width: "100%", maxWidth: 520 }}><LpGraphPicture view={{ lines: d.lines, drawn: 0, shaded: 0, win: d.win, grid: true }} /></div>;
}
/** on the answers page: the finished graph, every corner labelled */
export function GxPrintWorking({ p }: { p: DecisionProblem }) {
  const view = viewOf(p, undefined, true);
  return view ? <div style={{ width: "100%", maxWidth: 520 }}><LpGraphPicture view={view} /></div> : null;
}
