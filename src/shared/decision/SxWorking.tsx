import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import type { DecisionProblem, LpRow, SolveStep, SxBlock, SxTabView } from "./types";
import { questionBlocks } from "./lpSimplexSolve";

// The picture of a Simplex Algorithm question is the page a student would write: rows of words and lines, and the tableau as a table with the pivot column, the
// pivot row and the pivot highlighted and the row operations written beside the new tableau. The newest blocks are blue. The page never scrolls: it is scaled
// to fit its panel. Every cell is KaTeX rendered to a string with inline styles, so the layout holds on every screen.

const INK = "#0f172a";
const NEW = "#1d4ed8";
const GIVEN = "#475569";
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function Tex({ t }: { t: string }) {
  let html: string;
  try { html = katex.renderToString(t, { throwOnError: false, output: "html", displayMode: false }); } catch { html = t; }
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
function Prose({ text }: { text: string }) {
  return <>{text.split(/(\$[^$]+\$)/g).map((part, i) => (i % 2 === 1 ? <Tex key={i} t={part.slice(1, -1)} /> : <span key={i}>{part}</span>))}</>;
}
const label: CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#64748b" };

function Row({ r, colour }: { r: LpRow; colour: string }) {
  if (r.k === "gap") return <div style={{ height: "0.4em" }} />;
  if (r.k === "head") return <div style={{ fontSize: "0.62em", fontWeight: 700, color: GIVEN, paddingTop: 4 }}><Prose text={r.t} /></div>;
  if (r.k === "words") return <div style={{ color: colour, fontSize: "0.85em", lineHeight: 1.45 }}><Prose text={r.t} /></div>;
  if (r.k === "note") return <div style={{ color: colour === INK ? GIVEN : colour, fontSize: "0.72em", lineHeight: 1.4 }}><Prose text={r.t} /></div>;
  if (r.k === "result") return <div style={{ color: colour, border: `2px solid ${colour}`, borderRadius: 8, padding: "0.25em 0.7em", fontSize: "1.1em", fontWeight: 600 }}><Tex t={r.t} /></div>;
  return <div style={{ color: colour }}><Tex t={r.t} /></div>;
}

function Tableau({ b, colour }: { b: SxTabView; colour: string }) {
  const cell: CSSProperties = { padding: "0.18em 0.55em", textAlign: "center", whiteSpace: "nowrap" };
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
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const v = step?.sxView;
  const blocks: SxBlock[] = v ? v.blocks : questionBlocks(p);
  const fresh = v?.fresh ?? 0;
  useIso(() => {
    const bx = box.current, i = inner.current;
    if (!bx || !i || typeof ResizeObserver === "undefined") return;
    const fit = () => {
      const w = i.offsetWidth, h = i.offsetHeight;
      if (w > 0 && h > 0) setScale(Math.max(0.3, Math.min(1, (bx.clientWidth - 20) / w, bx.clientHeight / h)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(bx);
    return () => ro.disconnect();
  }, [blocks]);
  if (!p.sx) return null;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff", overflow: "hidden", containerType: "size" } as CSSProperties}>
      <div style={{ position: "absolute", top: 12, left: 60, right: 12, ...label }}>{v ? "Your working" : blocks.length ? "The tableau" : "Your working"}</div>
      <div ref={box} style={{ position: "absolute", top: 40, left: 14, right: 10, bottom: 8, overflow: "hidden", borderLeft: "2px solid #fecaca", paddingLeft: 14 }}>
        <div ref={inner} style={{ display: "inline-block", width: "max-content", maxWidth: "60em", transformOrigin: "top left", transform: `scale(${scale})`, fontSize: "clamp(13px, 4.4cqh, 30px)", color: INK }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.6em" }}>
            {blocks.map((b, i) => <Block key={i} b={b} fresh={!!v && i >= blocks.length - fresh} />)}
          </div>
          {!v && !blocks.length && <div style={{ ...label, textTransform: "none", letterSpacing: 0, fontSize: 14, fontWeight: 500 }}>Your working builds up here, one step at a time.</div>}
        </div>
      </div>
    </div>
  );
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
  return <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.45em", color: INK }}>{blocks.map((b, i) => <Block key={i} b={b} fresh={false} />)}</div>;
}
export function SxPrintWorking({ steps }: { steps: SolveStep[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3mm" }}>
      {steps.map((st, i) => {
        const v = st.sxView;
        const added = v ? v.blocks.slice(v.blocks.length - (v.fresh ?? 0)) : [];
        return (
          <div key={i} style={{ breakInside: "avoid" }}>
            <div style={{ fontSize: "0.9em", color: GIVEN, lineHeight: 1.4, marginBottom: 2 }}><Prose text={st.caption} /></div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4em", alignItems: "flex-start", color: INK }}>{added.map((b, j) => <Block key={j} b={b} fresh={false} />)}</div>
          </div>
        );
      })}
    </div>
  );
}
