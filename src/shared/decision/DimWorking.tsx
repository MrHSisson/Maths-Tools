import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import type { DecisionProblem, SolveStep } from "./types";
import { givenLines } from "./dimSolve";

// The picture of a Dimensional Analysis question is the page a student would WRITE: the formal working building up a line at a time, aligned on its equals
// signs, with the newest lines in blue. The step beside it says why each line is there. Before any working it shows what the question gives (the model or the
// formula). Every row is KaTeX rendered to a string and the layout is inline styles, so the exam paper prints it with renderToStaticMarkup.

const INK = "#0f172a";
const NEW = "#1d4ed8";
const GIVEN = "#475569";

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
    return `\\begin{array}{ll}${rows.join(" \\\\[0.85em] ")}\\end{array}`;
  }
  return "";
}
function Tex({ t }: { t: string }) {
  let html: string;
  try { html = katex.renderToString(t, { throwOnError: false, output: "html" }); } catch { html = t; }
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function DimCanvas({ p, step }: { p: DecisionProblem; step: SolveStep | undefined }) {
  const d = p.dim;
  const box = useRef<HTMLDivElement>(null);
  const v = step?.dimView;
  const lines = v ? v.lines : d ? givenLines(d) : [];
  const fresh = v?.fresh ?? 0;
  // keep the newest line in view as the page grows
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" }); }, [lines.length]);
  if (!d) return null;
  const base = v ? INK : GIVEN;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "10px 16px 0 60px", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#94a3b8", flexShrink: 0 }}>
        {v ? "Written working" : "Given"}
      </div>
      <div ref={box} style={{ flex: 1, minHeight: 0, overflow: "auto", margin: "4px 0 0 16px", padding: "8px 16px 16px 14px", borderLeft: "2px solid #fecaca" }}>
        {lines.length === 0 ? (
          <div style={{ color: "#94a3b8", fontSize: 16, paddingTop: 8 }}>Your working builds up here, one line at a time.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8, fontSize: 22, color: base }}>
            {blocks(lines, fresh).map((b, i) => (b.kind === "gap" ? <div key={i} style={{ height: 8 }} /> : <div key={i} style={{ maxWidth: "100%", overflowX: "auto" }}><Tex t={blockTex(b, base)} /></div>))}
          </div>
        )}
      </div>
    </div>
  );
}
