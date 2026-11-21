import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import type { DecisionProblem, LpRow, SolveStep } from "./types";

// The picture of a "Write a constraint" question is the page a student would WRITE: the variables, then the translation of the words, the tidying one line
// at a time, the check and the constraint in a box, the newest rows in blue. The step beside it says why each row is there. The page never scrolls: it is
// scaled to fit its panel. Rows are KaTeX rendered to a string with inline styles, so the layout holds on every screen.

const INK = "#0f172a";
const NEW = "#1d4ed8";
const GIVEN = "#475569";
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
  if (r.k === "slip") return <div style={{ color: "#92400e", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "0.3em 0.6em", fontSize: "0.72em", lineHeight: 1.4 }}><Prose text={r.t} /></div>;
  if (r.k === "result") return <div style={{ color: colour, border: `2px solid ${colour}`, borderRadius: 8, padding: "0.25em 0.7em", fontSize: "1.1em", fontWeight: 600 }}><Tex t={r.t} /></div>;
  return <div style={{ color: colour, fontSize: big ? "1.05em" : "1em" }}><Tex t={r.t} /></div>;
}

export default function LpCanvas({ p, step }: { p: DecisionProblem; step: SolveStep | undefined }) {
  const d = p.lp;
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const v = step?.lpView;
  const rows: LpRow[] = v ? v.rows : d ? [{ k: "head", t: "Variables" }, ...d.vars.map((x): LpRow => ({ k: "words", t: `$${x.sym}$ is the number of ${x.noun}` }))] : [];
  const fresh = v?.fresh ?? 0;
  useIso(() => {
    const b = box.current, i = inner.current;
    if (!b || !i || typeof ResizeObserver === "undefined") return;
    const fit = () => {
      const w = i.offsetWidth, h = i.offsetHeight;
      if (w > 0 && h > 0) setScale(Math.max(0.3, Math.min(1, (b.clientWidth - 20) / w, b.clientHeight / h)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(b);
    return () => ro.disconnect();
  }, [rows]);
  if (!d) return null;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff", overflow: "hidden", containerType: "size" } as CSSProperties}>
      <div style={{ position: "absolute", top: 12, left: 60, right: 12, ...label }}>Your working</div>
      <div ref={box} style={{ position: "absolute", top: 40, left: 14, right: 10, bottom: 8, overflow: "hidden", borderLeft: "2px solid #fecaca", paddingLeft: 14 }}>
        <div ref={inner} style={{ display: "inline-block", width: "max-content", maxWidth: "46em", transformOrigin: "top left", transform: `scale(${scale})`, fontSize: "clamp(13px, 4.4cqh, 30px)", color: v ? INK : GIVEN }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.5em" }}>
            {rows.map((r, i) => <Row key={i} r={r} fresh={!!v && i >= rows.length - fresh} big={r.k === "tex"} />)}
          </div>
          {!v && <div style={{ ...label, textTransform: "none", letterSpacing: 0, fontSize: 14, fontWeight: 500, paddingTop: 10 }}>Your working builds up here, one line at a time.</div>}
        </div>
      </div>
    </div>
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
