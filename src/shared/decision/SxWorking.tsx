import { useMemo, type CSSProperties } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import type { DecisionProblem, LpRow, SolveStep, SxBlock, SxTabView } from "./types";
import { questionBlocks, solveSimplex } from "./lpSimplexSolve";
import WorkingPage, { Newest } from "./WorkingPage";

// The picture of a Simplex Algorithm question is the page a student would write: rows of words and lines, and the tableau as a table with the pivot column, the
// pivot row and the pivot highlighted and the row operations written beside the new tableau. On screen it is an open page that grows downward (WorkingPage): every
// step so far, each numbered like the step list beside it, the newest in blue and scrolled into view. Every cell is KaTeX rendered to a string with inline styles,
// so the layout holds on every screen.

const INK = "#0f172a";
const NEW = "#1d4ed8";
const GIVEN = "#475569";

function Tex({ t }: { t: string }) {
  let html: string;
  try { html = katex.renderToString(t, { throwOnError: false, output: "html", displayMode: false }); } catch { html = t; }
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
function Prose({ text }: { text: string }) {
  return <>{text.split(/(\$[^$]+\$)/g).map((part, i) => (i % 2 === 1 ? <Tex key={i} t={part.slice(1, -1)} /> : <span key={i}>{part}</span>))}</>;
}

function Row({ r, colour }: { r: LpRow; colour: string }) {
  if (r.k === "gap") return <div style={{ height: "0.4em" }} />;
  if (r.k === "head") return <div style={{ fontSize: "0.62em", fontWeight: 700, color: GIVEN, paddingTop: 4 }}><Prose text={r.t} /></div>;
  if (r.k === "words") return <div style={{ color: colour, fontSize: "0.85em", lineHeight: 1.45 }}><Prose text={r.t} /></div>;
  if (r.k === "note") return <div style={{ color: colour === INK ? GIVEN : colour, fontSize: "0.72em", lineHeight: 1.4 }}><Prose text={r.t} /></div>;
  if (r.k === "result") return <div style={{ color: colour, border: `2px solid ${colour}`, borderRadius: 8, padding: "0.25em 0.7em", fontSize: "1.1em", fontWeight: 600 }}><Tex t={r.t} /></div>;
  return <div style={{ color: colour }}><Tex t={r.t} /></div>;
}

function Tableau({ b, colour }: { b: SxTabView; colour: string }) {
  const cell: CSSProperties = { padding: "0.18em 0.55em", textAlign: "center", whiteSpace: "nowrap", minWidth: "2.1em" };
  const last = b.head.length - 1;
  return (
    <table style={{ borderCollapse: "collapse", fontSize: "0.85em", color: colour }}>
      <thead>
        <tr style={{ borderBottom: `2px solid ${colour}` }}>
          {b.label && <th style={{ ...cell, fontSize: "0.7em", color: GIVEN, textAlign: "left" }}>{b.labelHead}</th>}
          {b.head.map((h, j) => <th key={j} style={{ ...cell, fontWeight: 600, borderLeft: j === last ? `2px solid ${colour}` : undefined, background: b.hi === j || b.pivot?.[1] === j ? "#fef9c3" : undefined }}>{h ? <Tex t={h} /> : null}</th>)}
          {b.ops && <th style={{ ...cell, fontSize: "0.7em", color: GIVEN, textAlign: "left", paddingLeft: "1em" }}>{b.opsHead ? <Tex t={b.opsHead} /> : null}</th>}
        </tr>
      </thead>
      <tbody>
        {b.rows.map((r, i) => (
          <tr key={i} style={{ borderBottom: i === 0 ? `2px solid ${colour}` : undefined }}>
            {b.label && <td style={{ ...cell, textAlign: "left", fontWeight: 600 }}>{b.label[i] ? <Tex t={b.label[i]} /> : null}</td>}
            {r.map((v, j) => {
              const isPivot = b.pivot && b.pivot[0] === i && b.pivot[1] === j;
              const tint = b.pivot ? (b.pivot[0] === i || b.pivot[1] === j) : b.hi === j;
              return <td key={j} style={{ ...cell, borderLeft: j === last ? `2px solid ${colour}` : undefined, background: isPivot ? "#fde047" : tint ? "#fef9c3" : undefined, outline: isPivot ? "2px solid #ca8a04" : undefined, fontWeight: isPivot ? 700 : 400 }}><Tex t={v} /></td>;
            })}
            {b.ops && <td style={{ ...cell, textAlign: "left", paddingLeft: "1em", color: colour === INK ? GIVEN : colour, fontSize: "0.85em" }}>{b.ops[i] ? <Tex t={b.ops[i]} /> : null}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Block({ b, fresh }: { b: SxBlock; fresh: boolean }) {
  const colour = fresh ? NEW : INK;
  if (b.k === "tab") return <Tableau b={b} colour={colour} />;
  return <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.45em" }}>{b.rows.map((r, i) => <Row key={i} r={r} colour={colour} />)}</div>;
}

export default function SxCanvas({ p, step }: { p: DecisionProblem; step: SolveStep | undefined }) {
  // the page of working so far: every step up to this one, each step's new blocks under the last (the step is found among the problem's own steps, which are deterministic)
  const all = useMemo(() => (p.sx ? solveSimplex(p) : []), [p]);
  const idx = useMemo(() => {
    if (!step?.sxView) return -1;
    const key = JSON.stringify([step.caption, step.sxView]);
    return all.findIndex((st) => JSON.stringify([st.caption, st.sxView]) === key);
  }, [all, step]);
  if (!p.sx) return null;
  const shown = step?.sxView ? (idx >= 0 ? all.slice(0, idx + 1) : [step]) : [];
  const given = step ? [] : questionBlocks(p);
  const span = tabSpan([...given, ...all.flatMap((st) => st.sxView?.blocks ?? [])]);   // the same for every step, so nothing shifts as the page grows
  const blocksOf = (st: SolveStep): SxBlock[] => { const v = st.sxView; return v ? v.blocks.slice(v.blocks.length - (v.fresh ?? 0)) : []; };
  return (
    <WorkingPage watch={`${p.prompt}|${shown.length}`} heading={!step && given.length ? "The tableau" : "Your working"} hint={!step && !given.length ? "Your working builds up here, one step at a time." : undefined}>
      {given.map((b, i) => <PageBlock key={`g${i}`} b={b} fresh={false} span={span} />)}
      {shown.map((st, i) => {
        const newest = i === shown.length - 1;
        if (!blocksOf(st).length) return null;   // a step that only says something (the list beside it says it) adds nothing to draw
        const body = (
          <div style={{ display: "flex", gap: "0.7em", alignItems: "flex-start" }}>
            <span style={{ flex: "0 0 auto", width: "1.5em", height: "1.5em", marginTop: "0.15em", borderRadius: "50%", background: newest ? NEW : "#e2e8f0", color: newest ? "#fff" : GIVEN, fontSize: "0.62em", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.5em" }}>{blocksOf(st).map((b, j) => <PageBlock key={j} b={b} fresh={newest} span={span} />)}</div>
          </div>
        );
        return newest ? <Newest key={i}>{body}</Newest> : <div key={i} style={{ display: "contents" }}>{body}</div>;
      })}
    </WorkingPage>
  );
}

/** how wide the widest tableau of a working is, in em (an estimate from its columns): every tableau of a working sits in a box this wide, so they line up with each other */
export function tabSpan(blocks: SxBlock[]): number {
  let w = 0;
  for (const b of blocks) if (b.k === "tab") w = Math.max(w, ((b.head.length + (b.label ? 1.4 : 0)) * 3.1 + (b.ops ? 13 : 0)) * 0.85);
  return w;
}
/** a block on the open page: a tableau goes in the shared box (centred as a box, its own left edge the same as every other tableau's), a run of lines is left-aligned */
function PageBlock({ b, fresh, span }: { b: SxBlock; fresh: boolean; span: number }) {
  return <div style={b.k === "tab" ? { alignSelf: "center", width: `${span}em`, maxWidth: "100%", overflowX: "auto" } : undefined}><Block b={b} fresh={fresh} /></div>;
}

// ── the phone: the whole solution as one open page ──────────────────────────────────────────
export function SxSolution({ steps }: { steps: SolveStep[] }) {
  return (
    <div className="flex flex-col gap-5">
      {steps.map((st, i) => {
        const v = st.sxView;
        const added = v ? v.blocks.slice(v.blocks.length - (v.fresh ?? 0)) : [];
        return (
          <div key={i}>
            <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.45, marginBottom: 4 }}><Prose text={st.caption} /></div>
            <div className="flex flex-col gap-2 items-start" style={{ fontSize: 15, color: INK, maxWidth: "100%", overflowX: "auto" }}>
              {added.map((b, j) => <Block key={j} b={b} fresh={false} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── on paper: the question's own tableau or table, and the whole model working as one page ────────────────
// Used by the print of saved questions (config.skillPrint): flow layout, inline styles only, so it holds in a print window.
export function SxPrintFigure({ p }: { p: DecisionProblem }) {
  const blocks = questionBlocks(p);
  if (!blocks.length) return null;
  return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6em", color: INK }}>{blocks.map((b, i) => <Block key={i} b={b} fresh={false} />)}</div>;
}
export function SxPrintWorking({ steps }: { steps: SolveStep[] }) {
  const span = tabSpan(steps.flatMap((st) => st.sxView?.blocks ?? []));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3mm" }}>
      {steps.map((st, i) => {
        const v = st.sxView;
        const added = v ? v.blocks.slice(v.blocks.length - (v.fresh ?? 0)) : [];
        return (
          <div key={i} style={{ breakInside: "avoid" }}>
            <div style={{ fontSize: "0.9em", color: GIVEN, lineHeight: 1.4, marginBottom: 2 }}><Prose text={st.caption} /></div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4em", alignItems: "flex-start", color: INK }}>{added.map((b, j) => <div key={j} style={b.k === "tab" ? { alignSelf: "center", width: `${span}em` } : undefined}><Block b={b} fresh={false} /></div>)}</div>
          </div>
        );
      })}
    </div>
  );
}
