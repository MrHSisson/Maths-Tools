import type { CSSProperties } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import type { DecisionProblem, LpRow, SolveStep } from "./types";
import WorkingPage, { Newest } from "./WorkingPage";

// The picture of a "Write a constraint" question is the page a student would WRITE: the variables, then the translation of the words, the tidying one line
// at a time, the check and the constraint in a box, the newest rows in blue. The step beside it says why each row is there. On screen it is an open page that
// grows downward (WorkingPage). Rows are KaTeX rendered to a string with inline styles, so the layout holds on every screen.

const INK = "#0f172a";
const NEW = "#1d4ed8";
const GIVEN = "#475569";

function Tex({ t }: { t: string }) {
  let html: string;
  try { html = katex.renderToString(t, { throwOnError: false, output: "html", displayMode: false }); } catch { html = t; }
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
/** plain text with maths between $…$ */
function Prose({ text }: { text: string }) {
  return <>{text.split(/(\$[^$]+\$)/g).map((part, i) => (i % 2 === 1 ? <Tex key={i} t={part.slice(1, -1)} /> : <span key={i}>{part}</span>))}</>;
}
const label: CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#64748b" };

function Row({ r, fresh, big }: { r: LpRow; fresh: boolean; big: boolean }) {
  const colour = fresh ? NEW : INK;
  if (r.k === "gap") return <div style={{ height: "0.4em" }} />;
  if (r.k === "head") return <div style={{ ...label, textTransform: "none", letterSpacing: 0, fontSize: "0.62em", fontWeight: 700, color: GIVEN, paddingTop: 4 }}><Prose text={r.t} /></div>;
  if (r.k === "words") return <div style={{ color: colour, fontSize: "0.85em", lineHeight: 1.45 }}><Prose text={r.t} /></div>;
  if (r.k === "note") return <div style={{ color: fresh ? NEW : GIVEN, fontSize: "0.72em", lineHeight: 1.4 }}><Prose text={r.t} /></div>;
  if (r.k === "result") return <div style={{ color: colour, border: `2px solid ${colour}`, borderRadius: 8, padding: "0.25em 0.7em", fontSize: "1.1em", fontWeight: 600 }}><Tex t={r.t} /></div>;
  return <div style={{ color: colour, fontSize: big ? "1.05em" : "1em" }}><Tex t={r.t} /></div>;
}

export default function LpCanvas({ p, step }: { p: DecisionProblem; step: SolveStep | undefined }) {
  const d = p.lp;
  const v = step?.lpView;
  const prob = d?.info.kind === "problem" ? d.info : undefined;
  // a problem does not name its variables before the answer: the question shows only its table (when the data is shown as one)
  const rows: LpRow[] = v ? v.rows : d && !prob ? [{ k: "head", t: "Variables" }, ...d.vars.map((x): LpRow => ({ k: "words", t: `$${x.sym}$ is the number of ${x.noun}` }))] : [];
  const fresh = v?.fresh ?? 0;
  if (!d) return null;
  // the rows accumulate from step to step: the page is all of them, the rows the newest step added in blue
  const old = v ? rows.slice(0, rows.length - fresh) : rows;
  const added = v ? rows.slice(rows.length - fresh) : [];
  const line = (r: LpRow, i: number, isNew: boolean) => <Row key={i} r={r} fresh={isNew} big={r.k === "tex"} />;
  const col: CSSProperties = { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.5em" };
  return (
    <WorkingPage watch={`${p.prompt}|${rows.length}`} hint={!v ? "Your working builds up here, one line at a time." : undefined}>
      <div style={{ ...col, color: v ? INK : GIVEN }}>
        {old.map((r, i) => line(r, i, false))}
        {added.length > 0 && <Newest><div style={col}>{added.map((r, i) => line(r, old.length + i, true))}</div></Newest>}
      </div>
      {!v && prob?.showTable && prob.table && (
        <table style={{ borderCollapse: "collapse", fontSize: "0.8em", alignSelf: "center" }}>
          <thead><tr>{prob.table.head.map((h, i) => <th key={i} style={{ border: "1px solid #cbd5e1", padding: "0.25em 0.6em", background: "#f1f5f9", fontWeight: 600, textAlign: i === 0 ? "left" : "center" }}>{h}</th>)}</tr></thead>
          <tbody>{prob.table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={{ border: "1px solid #cbd5e1", padding: "0.25em 0.6em", textAlign: j === 0 ? "left" : "center", fontWeight: j === 0 || i === prob.table!.rows.length - 1 ? 600 : 400 }}>{c}</td>)}</tr>)}</tbody>
        </table>
      )}
    </WorkingPage>
  );
}

// ── the phone: the whole solution as one open page ──────────────────────────────────────────
const added = (st: SolveStep): LpRow[] => { const v = st.lpView; return v && v.fresh ? v.rows.slice(v.rows.length - v.fresh) : []; };
export function LpSolution({ steps }: { steps: SolveStep[] }) {
  return (
    <div className="flex flex-col gap-5">
      {steps.map((st, i) => (
        <div key={i}>
          <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.45, marginBottom: 4 }}><Prose text={st.caption} /></div>
          <div className="flex flex-col gap-2 items-start" style={{ fontSize: 17, color: INK }}>
            {added(st).map((r, j) => <Row key={j} r={r} fresh={false} big={r.k === "tex"} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
