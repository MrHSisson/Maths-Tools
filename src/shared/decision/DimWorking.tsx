import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import type { DecisionProblem, SolveStep } from "./types";
import { givenLines, initialKnown } from "./dimSolve";

// The picture of a Dimensional Analysis question is the page a student would WRITE. At the top, a short strip of what is KNOWN (the given quantities, then each one
// built so far); below it the working in progress, aligned on its equals signs, the newest lines in blue. The step beside it says why each line is there.
// The page never scrolls: its size follows the panel it sits in (a base size from the panel's height, then shrunk to fit if the content is still too big), and the
// working stage by stage keeps the content small. Every row is KaTeX rendered to a string and the layout is inline styles, so the exam paper can print it.

const INK = "#0f172a";
const NEW = "#1d4ed8";
const GIVEN = "#475569";
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

type Block = { kind: "gap" } | { kind: "free"; row: string; fresh: boolean } | { kind: "aligned"; rows: Array<{ row: string; fresh: boolean }> };

/** group the page's rows: consecutive rows with "&" are one aligned block, "" is a gap, anything else stands alone */
function blocks(lines: string[], fresh: number): Block[] {
  const firstFresh = lines.length - fresh;
  const out: Block[] = [];
  lines.forEach((row, i) => {
    const isNew = i >= firstFresh;
    if (row === "") { out.push({ kind: "gap" }); return; }
    if (row.includes("&")) {
      const last = out[out.length - 1];
      if (last && last.kind === "aligned") last.rows.push({ row, fresh: isNew });
      else out.push({ kind: "aligned", rows: [{ row, fresh: isNew }] });
    } else out.push({ kind: "free", row, fresh: isNew });
  });
  return out;
}

const colour = (tex: string, c: string): string => `{\\color{${c}}${tex}}`;
function blockTex(b: Block, base: string): string {
  if (b.kind === "free") return `\\displaystyle ${colour(b.row, b.fresh ? NEW : base)}`;
  if (b.kind === "aligned") {
    // two left-aligned columns: what is written on the left, then the "= …" that lines up under the first equals
    const rows = b.rows.map(({ row, fresh }) => {
      const at = row.indexOf("&");
      const c = fresh ? NEW : base;
      return `\\displaystyle ${colour(row.slice(0, at), c)} & \\displaystyle \\mkern-9mu ${colour(row.slice(at + 1), c)}`;
    });
    return `\\begin{array}{ll}${rows.join(" \\\\[0.7em] ")}\\end{array}`;
  }
  return "";
}
function Tex({ t }: { t: string }) {
  let html: string;
  try { html = katex.renderToString(t, { throwOnError: false, output: "html" }); } catch { html = t; }
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
const label: CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#94a3b8" };

export default function DimCanvas({ p, step }: { p: DecisionProblem; step: SolveStep | undefined }) {
  const d = p.dim;
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const v = step?.dimView;
  const known = v ? v.known : d ? initialKnown(d) : [];
  const knownFresh = v?.knownFresh ?? 0;
  const lines = v ? v.lines : d ? givenLines(d) : [];
  const fresh = v?.fresh ?? 0;
  // shrink the page to fit the panel (never scroll): measure the natural size, then scale to the room there is
  useIso(() => {
    const b = box.current, i = inner.current;
    if (!b || !i || typeof ResizeObserver === "undefined") return;
    const fit = () => {
      const w = i.offsetWidth, h = i.offsetHeight; // layout size: a transform does not change it, so there is nothing to reset
      if (w > 0 && h > 0) setScale(Math.max(0.3, Math.min(1, b.clientWidth / w, b.clientHeight / h)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(b);
    return () => ro.disconnect();
  }, [lines, known]);
  if (!d) return null;
  const base = v ? INK : GIVEN;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff", overflow: "hidden", containerType: "size" } as CSSProperties}>
      <div style={{ position: "absolute", top: 14, left: 60, right: 12, ...label }}>{v ? "Written working" : "The question"}</div>
      <div ref={box} style={{ position: "absolute", top: 46, left: 14, right: 10, bottom: 8, overflow: "hidden", borderLeft: "2px solid #fecaca", paddingLeft: 14 }}>
        <div ref={inner} style={{ display: "inline-block", width: "max-content", maxWidth: "none", transformOrigin: "top left", transform: `scale(${scale})`, fontSize: "clamp(12px, 4cqh, 30px)", color: base }}>
          <div style={{ marginBottom: 10, maxWidth: "26em" }}>
            <div style={{ ...label, marginBottom: 3 }}>Known</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 1.1em", fontSize: "0.9em", color: GIVEN }}>
              {known.map((k, i) => (
                <span key={i} style={{ whiteSpace: "nowrap", color: i >= known.length - knownFresh ? NEW : GIVEN }}><Tex t={k} /></span>
              ))}
            </div>
          </div>
          {lines.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.3em", borderTop: "1px solid #e2e8f0", paddingTop: 8 }}>
              {blocks(lines, fresh).map((b, i) => (b.kind === "gap" ? <div key={i} style={{ height: "0.4em" }} /> : <div key={i}><Tex t={blockTex(b, base)} /></div>))}
            </div>
          )}
          {!v && lines.length === 0 && <div style={{ ...label, textTransform: "none", letterSpacing: 0, fontSize: 14, fontWeight: 500, paddingTop: 6 }}>Your working builds up here, one line at a time.</div>}
        </div>
      </div>
    </div>
  );
}
